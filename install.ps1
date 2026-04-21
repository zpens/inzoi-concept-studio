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

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

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
  } else {
    Write-Warn "Node.js not found - trying winget install..."
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
      Write-Err "winget unavailable. Install Node.js LTS manually from https://nodejs.org"
      exit 1
    }
    winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
      Write-Err "Node.js install failed. Install manually from https://nodejs.org"
      exit 1
    }
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
  npm install --no-fund --no-audit 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed"; exit 1 }
  Write-Ok "dependencies installed"

  Write-Host "  running npm run build..." -ForegroundColor DarkCyan
  npm run build 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { Write-Err "build failed"; exit 1 }
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
    npm install -g pm2 pm2-windows-startup 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { Write-Err "pm2 install failed"; exit 1 }
    $machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH    = $machinePath + ";" + $userPath
    Write-Ok "pm2 installed"
  } else {
    Write-Ok "pm2 already installed"
  }

  pm2 delete inzoi 2>&1 | Out-Null
  $env:PORT = $Port
  pm2 start server.js --name inzoi --cwd "$ProjectRoot" 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { Write-Err "pm2 start failed"; exit 1 }
  pm2 save | Out-Host

  $startupCmd = Get-Command pm2-startup -ErrorAction SilentlyContinue
  if ($startupCmd) {
    pm2-startup install 2>&1 | Out-Null
    Write-Ok "auto-start on boot registered (pm2-windows-startup)"
  } else {
    Write-Warn "pm2-windows-startup not found - skipping auto-start"
  }
  Write-Ok "pm2 registered: inzoi (port $Port)"
}

# --- 6. Scheduled Task: daily backup ---
Write-Step "6/7  scheduled backup (daily 18:30)"
if ($SkipBackupTask) {
  Write-Skip "skipped by -SkipBackupTask"
} else {
  $taskName = "inZOI Concept Backup"
  $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }
  $action   = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c npm run backup" -WorkingDirectory $ProjectRoot
  $trigger  = New-ScheduledTaskTrigger -Daily -At 6:30PM
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "inZOI Concept Studio - daily data backup" | Out-Null
  Write-Ok "registered: $taskName (daily 18:30)"
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
