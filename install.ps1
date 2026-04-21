# inZOI Concept Studio — 사내 PC 자동 설치 스크립트
# 운영자 PC 한 대에서 이 스크립트 한 번만 실행하면 다음 모두 자동 처리됨:
#   1. Node.js LTS 설치 (winget, 없을 때만)
#   2. npm install + npm run build
#   3. Windows 방화벽 규칙 추가
#   4. 절전 모드 비활성화 (AC 전원)
#   5. pm2 + pm2-windows-startup 설치 및 등록
#   6. 매일 오후 6:30 자동 백업 작업 스케줄러 등록
#   7. 서버 기동 및 접속 URL 출력
#
# 사용법:  관리자 PowerShell 에서  .\install.ps1
#         또는 install.bat 더블 클릭 (자동 관리자 승격)

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

function Write-Step {
  param([string]$Msg, [string]$Color = "Cyan")
  Write-Host ""
  Write-Host "━━━ $Msg ━━━" -ForegroundColor $Color
}

function Write-Ok   { param([string]$Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }
function Write-Skip { param([string]$Msg) Write-Host "  ↷ $Msg" -ForegroundColor DarkGray }
function Write-Warn { param([string]$Msg) Write-Host "  ! $Msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$Msg) Write-Host "  ✕ $Msg" -ForegroundColor Red }

# 관리자 권한 확인.
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Err "관리자 권한이 필요합니다. install.bat 을 통해 실행하거나 PowerShell 을 관리자로 열어주세요."
  exit 1
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   inZOI Concept Studio — 자동 설치              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  프로젝트 경로: $ProjectRoot"
Write-Host "  포트: $Port"
Write-Host ""

# ─── 1. Node.js ───────────────────────────────────────
Write-Step "1/7  Node.js 확인"
if ($SkipNode) {
  Write-Skip "--SkipNode 옵션으로 건너뜀"
} else {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    $ver = (node -v)
    Write-Ok  "이미 설치됨 ($ver)"
  } else {
    Write-Warn "Node.js 가 없습니다. winget 으로 LTS 설치 시도..."
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
      Write-Err "winget 이 없습니다. https://nodejs.org 에서 LTS 수동 설치 후 다시 실행해주세요."
      exit 1
    }
    winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
      Write-Err "Node.js 설치 실패. 수동 설치 필요: https://nodejs.org"
      exit 1
    }
    # 세션 PATH 갱신.
    $env:PATH = [Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH","User")
    Write-Ok "Node.js LTS 설치 완료"
  }
}

# ─── 2. 의존성 + 빌드 ─────────────────────────────────
Write-Step "2/7  의존성 설치 + 빌드"
if ($SkipBuild) {
  Write-Skip "--SkipBuild 옵션으로 건너뜀"
} else {
  if (Test-Path "node_modules") {
    Write-Ok "node_modules 존재 — 증분 설치 실행"
  } else {
    Write-Host "  npm install..." -ForegroundColor DarkCyan
  }
  npm install --no-fund --no-audit 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { Write-Err "npm install 실패"; exit 1 }
  Write-Ok "의존성 설치 완료"

  Write-Host "  npm run build..." -ForegroundColor DarkCyan
  npm run build 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { Write-Err "빌드 실패"; exit 1 }
  Write-Ok "프론트엔드 빌드 완료"
}

# ─── 3. 방화벽 규칙 ───────────────────────────────────
Write-Step "3/7  Windows 방화벽 허용 (포트 $Port)"
if ($SkipFirewall) {
  Write-Skip "--SkipFirewall 옵션으로 건너뜀"
} else {
  $ruleName = "inZOI Concept Studio (Port $Port)"
  $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Ok "규칙 이미 존재: $ruleName"
  } else {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Any | Out-Null
    Write-Ok "방화벽 인바운드 규칙 추가: $ruleName"
  }
}

# ─── 4. 절전 모드 비활성화 (AC) ──────────────────────
Write-Step "4/7  절전 모드 비활성화 (AC 전원 기준)"
powercfg /change standby-timeout-ac 0 | Out-Null
powercfg /change hibernate-timeout-ac 0 | Out-Null
Write-Ok "AC 전원 연결 시 절전/최대절전 안 함"

# ─── 5. pm2 상주 ─────────────────────────────────────
Write-Step "5/7  pm2 상주 등록"
if ($SkipPm2) {
  Write-Skip "--SkipPm2 옵션으로 건너뜀"
} else {
  $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
  if (-not $pm2) {
    Write-Host "  pm2 글로벌 설치..." -ForegroundColor DarkCyan
    npm install -g pm2 pm2-windows-startup 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { Write-Err "pm2 설치 실패"; exit 1 }
    $env:PATH = [Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH","User")
    Write-Ok "pm2 설치 완료"
  } else {
    Write-Ok "pm2 이미 설치됨"
  }

  # 기존 inzoi 프로세스 정리 후 재등록.
  pm2 delete inzoi 2>&1 | Out-Null
  $env:PORT = $Port
  pm2 start server.js --name inzoi --cwd "$ProjectRoot" 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { Write-Err "pm2 start 실패"; exit 1 }
  pm2 save | Out-Host

  # Windows 부팅 시 자동 시작.
  $startupCmd = Get-Command pm2-startup -ErrorAction SilentlyContinue
  if ($startupCmd) {
    pm2-startup install 2>&1 | Out-Null
    Write-Ok "Windows 재부팅 시 자동 시작 등록 (pm2-windows-startup)"
  } else {
    Write-Warn "pm2-windows-startup 찾지 못함 — 수동 확인 필요"
  }
  Write-Ok "pm2 상주 등록: inzoi (포트 $Port)"
}

# ─── 6. 자동 백업 작업 스케줄러 ───────────────────────
Write-Step "6/7  자동 백업 작업 스케줄러 등록"
if ($SkipBackupTask) {
  Write-Skip "--SkipBackupTask 옵션으로 건너뜀"
} else {
  $taskName = "inZOI Concept Backup"
  $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }
  $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c npm run backup" -WorkingDirectory $ProjectRoot
  $trigger = New-ScheduledTaskTrigger -Daily -At 6:30PM
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "inZOI Concept Studio — data 폴더 일일 백업" | Out-Null
  Write-Ok "매일 오후 6:30 자동 백업 등록 완료"
}

# ─── 7. 최종 확인 ────────────────────────────────────
Write-Step "7/7  설치 완료 확인" "Green"

Start-Sleep -Seconds 2
try {
  $health = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -TimeoutSec 5
  Write-Ok "서버 기동 확인: v$($health.version) ($(($health.time)))"
} catch {
  Write-Warn "헬스체크 응답 없음 — pm2 logs inzoi 로 확인하세요"
}

$lanIps = @()
$ifs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.PrefixOrigin -ne 'WellKnown' }
foreach ($ip in $ifs) { $lanIps += $ip.IPAddress }

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   설치 완료                                     ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  ▶ 로컬 확인  : " -NoNewline
Write-Host "http://localhost:$Port" -ForegroundColor Cyan
foreach ($ip in $lanIps) {
  Write-Host "  ▶ 팀원 접속  : " -NoNewline
  Write-Host "http://${ip}:${Port}" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  유용한 명령:"
Write-Host "    pm2 status       → 서버 상태 확인"
Write-Host "    pm2 logs inzoi   → 로그 실시간 보기"
Write-Host "    pm2 restart inzoi→ 재시작"
Write-Host "    update.bat       → GitHub 최신 코드 적용 + 재시작"
Write-Host "    uninstall.ps1    → 모든 등록 해제 (데이터는 유지)"
Write-Host ""
