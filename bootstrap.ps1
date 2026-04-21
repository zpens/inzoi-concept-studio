# inZOI Concept Studio — 원격 부트스트랩
# 한 줄 명령으로 전체 설치 (운영자 PC 에서 최초 1회).
#
# 사용법 (관리자 PowerShell):
#   iwr https://raw.githubusercontent.com/zpens/inzoi-concept-studio/main/bootstrap.ps1 | iex
#
# 동작:
#   1. C:\inzoi-concept-studio 로 GitHub 리포 clone (없으면 Git 먼저 설치)
#   2. install.ps1 을 관리자 권한으로 실행

param(
  [string]$InstallPath = "C:\inzoi-concept-studio",
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$Msg) Write-Host "━━━ $Msg ━━━" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "[!] 관리자 권한 PowerShell 에서 실행해주세요." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   inZOI Concept Studio — 원격 부트스트랩         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  설치 경로: $InstallPath"
Write-Host "  포트:      $Port"
Write-Host ""

# Git 확인 / 설치.
Write-Step "Git 확인"
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  Write-Host "  Git 이 없습니다. winget 으로 설치 시도..."
  winget install Git.Git --silent --accept-source-agreements --accept-package-agreements
  $env:PATH = [Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH","User")
  Write-Ok "Git 설치 완료"
} else {
  Write-Ok "Git 이미 설치됨 ($((git --version)))"
}

# Clone / Pull.
Write-Step "소스 코드 동기화"
if (Test-Path $InstallPath) {
  if (Test-Path (Join-Path $InstallPath ".git")) {
    Push-Location $InstallPath
    git pull
    Pop-Location
    Write-Ok "git pull 완료"
  } else {
    Write-Host "  [!] $InstallPath 이 이미 존재하지만 Git 리포가 아닙니다." -ForegroundColor Yellow
    Write-Host "      다른 경로를 사용하거나 폴더를 비운 뒤 재시도: -InstallPath D:\inzoi" -ForegroundColor Yellow
    exit 1
  }
} else {
  git clone https://github.com/zpens/inzoi-concept-studio.git $InstallPath
  Write-Ok "git clone 완료"
}

# install.ps1 실행.
Write-Step "install.ps1 실행"
Set-Location $InstallPath
& "$InstallPath\install.ps1" -Port $Port
