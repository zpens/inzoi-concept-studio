# Auto-update: periodic git pull + (on changes) npm install + build + pm2 restart.
# Registered as a Windows Scheduled Task by install.ps1. Runs every N minutes.
# Writes append-only log to logs/auto-update.log.

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logFile = Join-Path $logDir "auto-update.log"

function Log {
  param([string]$Msg)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$ts  $Msg" | Out-File -FilePath $logFile -Append -Encoding utf8
}

Log "--- auto-update run start ---"

try {
  $before = (& git rev-parse HEAD).Trim()
  & git fetch origin main 2>&1 | Out-String | ForEach-Object { if ($_) { Log $_ } }
  & git pull --ff-only origin main 2>&1 | Out-String | ForEach-Object { if ($_) { Log $_ } }
  $after = (& git rev-parse HEAD).Trim()

  if ($before -eq $after) {
    Log "no changes (HEAD=$after)"
    exit 0
  }

  Log "HEAD advanced  $before -> $after"
  Log "running npm install..."
  cmd /c "npm install --no-fund --no-audit 2>&1" | Out-String | ForEach-Object { if ($_) { Log $_ } }
  if ($LASTEXITCODE -ne 0) { Log "[!] npm install failed (exit=$LASTEXITCODE)"; exit 1 }

  Log "running npm run build..."
  cmd /c "npm run build 2>&1" | Out-String | ForEach-Object { if ($_) { Log $_ } }
  if ($LASTEXITCODE -ne 0) { Log "[!] build failed (exit=$LASTEXITCODE)"; exit 1 }

  Log "pm2 restart inzoi..."
  cmd /c "pm2 restart inzoi 2>&1" | Out-String | ForEach-Object { if ($_) { Log $_ } }

  Log "auto-update done"
} catch {
  Log "[!] exception: $($_.Exception.Message)"
}
