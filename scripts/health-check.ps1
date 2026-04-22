# Health check: ping /api/health; if it fails try progressively stronger recoveries.
# Registered as a Windows Scheduled Task by install.ps1. Runs every 2 minutes.
# Writes append-only log to logs/health-check.log (only when state changes or recovery runs).

param(
  [int]$Port = 3000,
  [int]$TimeoutSec = 8
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logFile = Join-Path $logDir "health-check.log"
$stateFile = Join-Path $logDir ".last-health-state"

function Log {
  param([string]$Msg)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$ts  $Msg" | Out-File -FilePath $logFile -Append -Encoding utf8
}

function TryHealth {
  try {
    $r = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec $TimeoutSec
    if ($r.ok) { return $r }
  } catch { }
  return $null
}

function Pm2Status {
  # Returns "online" / "stopped" / "errored" / "missing" / "unknown".
  try {
    $listJson = cmd /c "pm2 jlist 2>&1" | Out-String
    if ($LASTEXITCODE -ne 0) { return "missing" }
    $list = $listJson | ConvertFrom-Json
    $p = $list | Where-Object { $_.name -eq "inzoi" }
    if (-not $p) { return "missing" }
    return $p.pm2_env.status
  } catch { return "unknown" }
}

$lastState = if (Test-Path $stateFile) { (Get-Content $stateFile -Raw -ErrorAction SilentlyContinue | Out-String).Trim() } else { "" }

# 1) Happy path
$r = TryHealth
if ($r) {
  if ($lastState -ne "ok") {
    Log "recovered: version=$($r.version) time=$($r.time)"
    "ok" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline
  }
  exit 0
}

Log "health unreachable — starting recovery"
"down" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline

# 2) pm2 restart
cmd /c "pm2 restart inzoi 2>&1" | Out-Null
Start-Sleep -Seconds 6
if (TryHealth) { Log "recovered via pm2 restart"; "ok" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline; exit 0 }

# 3) Check pm2 status — if stopped/errored, cold start via ecosystem
$status = Pm2Status
Log "pm2 status after restart: $status"
if ($status -ne "online") {
  cmd /c "pm2 delete inzoi 2>&1" | Out-Null
  cmd /c "pm2 start ecosystem.config.cjs 2>&1" | Out-Null
  cmd /c "pm2 save 2>&1" | Out-Null
  Start-Sleep -Seconds 6
  if (TryHealth) { Log "recovered via cold start"; "ok" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline; exit 0 }
}

# 4) Still dead — try a fresh rebuild from origin/main
Log "still unreachable — forcing rebuild from origin/main"
try {
  cmd /c "git fetch origin main 2>&1" | Out-Null
  cmd /c "git reset --hard origin/main 2>&1" | Out-Null
  cmd /c "npm install --no-fund --no-audit 2>&1" | Out-Null
  cmd /c "npm run build 2>&1" | Out-Null
  cmd /c "pm2 delete inzoi 2>&1" | Out-Null
  cmd /c "pm2 start ecosystem.config.cjs 2>&1" | Out-Null
  cmd /c "pm2 save 2>&1" | Out-Null
  Start-Sleep -Seconds 8
  $r = TryHealth
  if ($r) {
    Log "recovered via forced rebuild: version=$($r.version)"
    "ok" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline
    exit 0
  }
  Log "[!] forced rebuild did not recover — manual intervention needed"
} catch {
  Log "[!] rebuild exception: $($_.Exception.Message)"
}
