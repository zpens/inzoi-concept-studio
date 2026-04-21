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

# cmd /c wrapper so git/npm stderr (informational text) does not get
# wrapped into a PowerShell RemoteException with a stack trace.
# We only log errors; success runs stay quiet to keep the log readable.
function Invoke-Native {
  param([string]$Cmd, [string]$Label)
  $out = cmd /c "$Cmd 2>&1"
  if ($LASTEXITCODE -ne 0) {
    Log "[!] $Label failed (exit=$LASTEXITCODE)"
    $text = ($out | Out-String).Trim()
    if ($text) { Log "    $text" }
    return $false
  }
  return $true
}

Log "--- auto-update run start ---"

try {
  $before = (cmd /c "git rev-parse HEAD").Trim()

  if (-not (Invoke-Native "git fetch origin main" "git fetch")) { exit 1 }
  if (-not (Invoke-Native "git pull --ff-only origin main" "git pull")) { exit 1 }

  $after = (cmd /c "git rev-parse HEAD").Trim()

  if ($before -eq $after) {
    Log "no changes (HEAD=$after)"
    exit 0
  }

  Log "HEAD advanced  $before -> $after"

  if (-not (Invoke-Native "npm install --no-fund --no-audit" "npm install")) { exit 1 }
  Log "dependencies updated"

  if (-not (Invoke-Native "npm run build" "build")) { exit 1 }
  Log "frontend rebuilt"

  if (-not (Invoke-Native "pm2 restart inzoi" "pm2 restart")) { exit 1 }
  Log "pm2 restart ok"

  Log "auto-update done: $after"
} catch {
  Log "[!] exception: $($_.Exception.Message)"
}
