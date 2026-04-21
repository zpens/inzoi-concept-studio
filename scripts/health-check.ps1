# Health check: ping /api/health; if it fails, pm2 restart inzoi.
# Registered as a Windows Scheduled Task by install.ps1. Runs every 2 minutes.
# Writes append-only log to logs/health-check.log (only when state changes).

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

$lastState = if (Test-Path $stateFile) { Get-Content $stateFile -Raw -ErrorAction SilentlyContinue } else { "" }
$lastState = ($lastState | Out-String).Trim()

try {
  $r = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec $TimeoutSec
  if ($r.ok) {
    if ($lastState -ne "ok") {
      Log "recovered: version=$($r.version) time=$($r.time)"
      "ok" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline
    }
    exit 0
  }
  throw "health endpoint returned unexpected payload"
} catch {
  Log "unreachable: $($_.Exception.Message)"
  "down" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline

  # Try to bounce the pm2 process.
  cmd /c "pm2 restart inzoi 2>&1" | Out-String | ForEach-Object { if ($_) { Log $_ } }
  Start-Sleep -Seconds 5

  # Second probe; if still failing, attempt a cold start.
  try {
    $r2 = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec $TimeoutSec
    if ($r2.ok) {
      Log "restart successful: version=$($r2.version)"
      "ok" | Out-File -FilePath $stateFile -Encoding utf8 -NoNewline
      exit 0
    }
  } catch {
    Log "restart did not recover - trying cold start via ecosystem file..."
    cmd /c "pm2 delete inzoi 2>&1" | Out-Null
    cmd /c "pm2 start ecosystem.config.cjs 2>&1" | Out-String | ForEach-Object { if ($_) { Log $_ } }
    cmd /c "pm2 save 2>&1" | Out-Null
  }
}
