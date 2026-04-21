# inZOI Concept Studio - remote bootstrap
# One-line installer for the operator PC (first run).
#
# Usage (Administrator PowerShell):
#   iwr https://raw.githubusercontent.com/zpens/inzoi-concept-studio/main/bootstrap.ps1 | iex
#
# Steps:
#   1. Ensure Git is installed (winget install if missing)
#   2. Clone (or pull) the repo into $InstallPath
#   3. Run install.ps1 with the given -Port

param(
  [string]$InstallPath = "C:\inzoi-concept-studio",
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$Msg) Write-Host "=== $Msg ===" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "  [OK] $Msg" -ForegroundColor Green }

$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "[!] Please run in an Administrator PowerShell." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "+---------------------------------------------+" -ForegroundColor Cyan
Write-Host "|   inZOI Concept Studio - remote bootstrap   |" -ForegroundColor Cyan
Write-Host "+---------------------------------------------+" -ForegroundColor Cyan
Write-Host "  install path: $InstallPath"
Write-Host "  port:         $Port"
Write-Host ""

Write-Step "check Git"
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  Write-Host "  Git not found - trying winget install..."
  winget install Git.Git --silent --accept-source-agreements --accept-package-agreements
  $machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
  $userPath    = [Environment]::GetEnvironmentVariable("PATH", "User")
  $env:PATH    = $machinePath + ";" + $userPath
  Write-Ok "Git installed"
} else {
  $ver = & git --version
  Write-Ok "Git already installed ($ver)"
}

Write-Step "sync source"
if (Test-Path $InstallPath) {
  if (Test-Path (Join-Path $InstallPath ".git")) {
    Push-Location $InstallPath
    git pull
    Pop-Location
    Write-Ok "git pull complete"
  } else {
    Write-Host "  [!] $InstallPath exists but is not a git repo." -ForegroundColor Yellow
    Write-Host "      Use a different path: -InstallPath D:\inzoi" -ForegroundColor Yellow
    exit 1
  }
} else {
  git clone https://github.com/zpens/inzoi-concept-studio.git $InstallPath
  Write-Ok "git clone complete"
}

Write-Step "run install.ps1"
Set-Location $InstallPath
& "$InstallPath\install.ps1" -Port $Port
