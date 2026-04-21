# inZOI Concept Studio - on-prem auto installer
# Runs once on the operator PC and handles:
#   1. Node.js LTS (via winget, only if missing)
#   2. npm install + npm run build
#   3. Windows Firewall inbound rule
#   4. Disable sleep (AC power)
#   5. pm2 + pm2-windows-startup + inzoi process
#   6. Scheduled Task: daily data backup at 18:30
#   7. Health check and final URL summary
#
# Usage:  run from an Administrator PowerShell
#   .\install.ps1
# Optional flags: -Port 8082 -SkipNode -SkipBuild -SkipFirewall -SkipPm2 -SkipBackupTask

param(
  [int]$Port = 3000,
  [switch]$SkipNode,
  [switch]$SkipBuild,
  [switch]$SkipFirewall,
  [switch]$SkipPm2,
  [switch]$SkipBackupTask
)

# Keep Continue so that native CLIs (npm/pm2/winget) writing to stderr
# do not get wrapped into terminating RemoteException by Windows PS 5.x.
# We check $LASTEXITCODE explicitly after every native command.
$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

function Exit-OnFail {
  param([int]$Code, [string]$What)
  if ($Code -ne 0) {
    Write-Host "  [x]  $What  (exit=$Code)" -ForegroundColor Red
    exit 1
  }
}

function Write-Step { param([string]$Msg) Write-Host ""; Write-Host "=== $Msg ===" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "  [OK] $Msg" -ForegroundColor Green }
function Write-Skip { param([string]$Msg) Write-Host "  [skip] $Msg" -ForegroundColor DarkGray }
function Write-Warn { param([string]$Msg) Write-Host "  [!]  $Msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$Msg) Write-Host "  [x]  $Msg" -ForegroundColor Red }

$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Err "Administrator privileges required. Please run via install.bat or launch PowerShell as Administrator."
  exit 1
}

Write-Host ""
Write-Host "+---------------------------------------------+" -ForegroundColor Cyan
Write-Host "|   inZOI Concept Studio - auto installer     |" -ForegroundColor Cyan
Write-Host "+---------------------------------------------+" -ForegroundColor Cyan
Write-Host "  project root: $ProjectRoot"
Write-Host "  port:         $Port"
Write-Host ""

# --- 1. Node.js ---
Write-Step "1/7  Node.js"
if ($SkipNode) {
  Write-Skip "skipped by -SkipNode"
} else {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    $ver = & node -v
    Write-Ok "Node.js already installed ($ver)"
    $majorStr = $ver.TrimStart('v').Split('.')[0]
    $major = 0; [int]::TryParse($majorStr, [ref]$major) | Out-Null
    if ($major -ge 25) {
      Write-Warn "Node.js $ver is the Current channel - stick with LTS when possible."
      Write-Warn "If better-sqlite3 fails to install, downgrade to v24 LTS from https://nodejs.org"
    }
    if ($major -lt 18) {
      Write-Err "Node.js $ver is too old. Please install v20 or v22 LTS and retry."
      exit 1
    }
  } else {
    Write-Warn "Node.js not found - trying winget install..."
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
      Write-Err "winget unavailable. Install Node.js LTS manually from https://nodejs.org"
      exit 1
    }
    & winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    Exit-OnFail $LASTEXITCODE "Node.js install failed"
    $machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH    = $machinePath + ";" + $userPath
    Write-Ok "Node.js LTS installed"
  }
}

# --- 2. npm install + build ---
Write-Step "2/7  npm install + build"
if ($SkipBuild) {
  Write-Skip "skipped by -SkipBuild"
} else {
  if (Test-Path "node_modules") {
    Write-Ok "node_modules present - running incremental install"
  } else {
    Write-Host "  running npm install..." -ForegroundColor DarkCyan
  }
  # cmd /c suppresses PowerShell's habit of elevating native stderr to errors.
  # Any deprecation warnings from npm are now just printed and ignored.
  cmd /c "npm install --no-fund --no-audit"
  Exit-OnFail $LASTEXITCODE "npm install failed"
  Write-Ok "dependencies installed"

  Write-Host "  running npm run build..." -ForegroundColor DarkCyan
  cmd /c "npm run build"
  Exit-OnFail $LASTEXITCODE "build failed"
  Write-Ok "frontend build complete"
}

# --- 3. Firewall rule ---
Write-Step "3/7  Windows Firewall (TCP $Port inbound)"
if ($SkipFirewall) {
  Write-Skip "skipped by -SkipFirewall"
} else {
  $ruleName = "inZOI Concept Studio (Port $Port)"
  $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Ok "rule already exists: $ruleName"
  } else {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Any | Out-Null
    Write-Ok "added inbound rule: $ruleName"
  }
}

# --- 4. Disable sleep on AC ---
Write-Step "4/7  disable sleep on AC power"
powercfg /change standby-timeout-ac 0 | Out-Null
powercfg /change hibernate-timeout-ac 0 | Out-Null
Write-Ok "no sleep / hibernate while on AC"

# --- 5. pm2 ---
Write-Step "5/7  pm2 registration"
if ($SkipPm2) {
  Write-Skip "skipped by -SkipPm2"
} else {
  $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
  if (-not $pm2) {
    Write-Host "  installing pm2 globally..." -ForegroundColor DarkCyan
    cmd /c "npm install -g pm2 pm2-windows-startup"
    Exit-OnFail $LASTEXITCODE "pm2 install failed"
    $machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH    = $machinePath + ";" + $userPath
    Write-Ok "pm2 installed"
  } else {
    Write-Ok "pm2 already installed"
  }

  cmd /c "pm2 delete inzoi" 2>$null | Out-Null
  $env:PORT = $Port
  # Start through the ecosystem file so max_restarts / restart_delay /
  # log paths are consistent across restarts.
  cmd /c "pm2 start ecosystem.config.cjs"
  Exit-OnFail $LASTEXITCODE "pm2 start failed"
  cmd /c "pm2 save" | Out-Null

  $startupCmd = Get-Command pm2-startup -ErrorAction SilentlyContinue
  if ($startupCmd) {
    cmd /c "pm2-startup install" | Out-Null
    Write-Ok "auto-start on boot registered (pm2-windows-startup)"
  } else {
    Write-Warn "pm2-windows-startup not found - skipping auto-start"
  }
  Write-Ok "pm2 registered: inzoi (port $Port)"
}

# --- 6. Scheduled Tasks: backup + auto-update + health check ---
Write-Step "6/7  scheduled tasks (backup / auto-update / health)"
if ($SkipBackupTask) {
  Write-Skip "skipped by -SkipBackupTask"
} else {
  $principalSchedule = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
  $commonSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew

  function Register-Mine {
    param([string]$Name, $Action, $Trigger, [string]$Description)
    $existing = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if ($existing) { Unregister-ScheduledTask -TaskName $Name -Confirm:$false }
    Register-ScheduledTask -TaskName $Name -Action $Action -Trigger $Trigger `
      -Settings $commonSettings -Principal $principalSchedule -Description $Description | Out-Null
    Write-Ok "registered: $Name"
  }

  # 6a. Daily backup at 18:30
  $backupAction = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c npm run backup" -WorkingDirectory $ProjectRoot
  $backupTrigger = New-ScheduledTaskTrigger -Daily -At 6:30PM
  Register-Mine "inZOI Concept Backup" $backupAction $backupTrigger "inZOI Concept Studio - daily data backup (18:30)"

  # 6b. Auto update every 5 minutes
  $updateAction = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ProjectRoot\scripts\auto-update.ps1`"" `
    -WorkingDirectory $ProjectRoot
  $updateTrigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(2)) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
  Register-Mine "inZOI Concept Auto Update" $updateAction $updateTrigger "git pull + rebuild + pm2 restart (every 5 min)"

  # 6c. Health check every 2 minutes
  $healthAction = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ProjectRoot\scripts\health-check.ps1`" -Port $Port" `
    -WorkingDirectory $ProjectRoot
  $healthTrigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(1)) `
    -RepetitionInterval (New-TimeSpan -Minutes 2) -RepetitionDuration (New-TimeSpan -Days 3650)
  Register-Mine "inZOI Concept Health Check" $healthAction $healthTrigger "ping /api/health; pm2 restart on failure (every 2 min)"
}

# --- 7. health check ---
Write-Step "7/7  health check"
Start-Sleep -Seconds 2
try {
  $health = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec 5
  Write-Ok "server is live: v$($health.version)  time=$($health.time)"
} catch {
  Write-Warn "health check failed - run 'pm2 logs inzoi' to inspect"
}

$lanIps = @()
$ifs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.PrefixOrigin -ne 'WellKnown' }
foreach ($ip in $ifs) { $lanIps += $ip.IPAddress }

Write-Host ""
Write-Host "+---------------------------------------------+" -ForegroundColor Green
Write-Host "|   installation complete                     |" -ForegroundColor Green
Write-Host "+---------------------------------------------+" -ForegroundColor Green
Write-Host ""
Write-Host "  local  : " -NoNewline
Write-Host "http://localhost:$Port" -ForegroundColor Cyan
foreach ($ip in $lanIps) {
  Write-Host "  team   : " -NoNewline
  Write-Host ("http://" + $ip + ":" + $Port) -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  useful commands:"
Write-Host "    pm2 status            show server status"
Write-Host "    pm2 logs inzoi        tail logs"
Write-Host "    pm2 restart inzoi     restart server"
Write-Host "    update.bat            pull latest + rebuild + restart"
Write-Host "    uninstall.ps1         remove pm2/firewall/task (keeps data)"
Write-Host ""
