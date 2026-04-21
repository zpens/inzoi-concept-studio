# inZOI Concept Studio — 등록 해제 스크립트
# - pm2 프로세스 / 자동시작 제거
# - 방화벽 규칙 제거
# - 자동 백업 작업 스케줄러 제거
# ⚠ data/ 폴더와 node_modules 는 그대로 유지 (사용자 판단).

param(
  [int]$Port = 3000,
  [switch]$PurgeData    # 주의: 데이터까지 완전 삭제 플래그
)

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "[!] 관리자 권한이 필요합니다." -ForegroundColor Red
  exit 1
}

Write-Host "━━━ 1/4 pm2 inzoi 프로세스 중지 + 제거 ━━━" -ForegroundColor Cyan
pm2 delete inzoi 2>&1 | Out-Null
pm2 save 2>&1 | Out-Null
Write-Host "  ✓ pm2 프로세스 제거" -ForegroundColor Green

Write-Host ""
Write-Host "━━━ 2/4 방화벽 규칙 제거 ━━━" -ForegroundColor Cyan
$rules = Get-NetFirewallRule -DisplayName "inZOI Concept Studio*" -ErrorAction SilentlyContinue
if ($rules) {
  $rules | Remove-NetFirewallRule
  Write-Host "  ✓ 방화벽 규칙 제거 완료 ($($rules.Count)개)" -ForegroundColor Green
} else {
  Write-Host "  ↷ 해당 방화벽 규칙 없음" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "━━━ 3/4 자동 백업 작업 스케줄러 제거 ━━━" -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName "inZOI Concept Backup" -ErrorAction SilentlyContinue
if ($task) {
  Unregister-ScheduledTask -TaskName "inZOI Concept Backup" -Confirm:$false
  Write-Host "  ✓ 작업 스케줄러 제거" -ForegroundColor Green
} else {
  Write-Host "  ↷ 등록된 작업 없음" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "━━━ 4/4 데이터 처리 ━━━" -ForegroundColor Cyan
if ($PurgeData) {
  if (Test-Path "data") {
    Remove-Item -Recurse -Force "data"
    Write-Host "  ✕ data/ 폴더 완전 삭제됨" -ForegroundColor Red
  }
  if (Test-Path "backup") {
    Remove-Item -Recurse -Force "backup"
    Write-Host "  ✕ backup/ 폴더 완전 삭제됨" -ForegroundColor Red
  }
} else {
  Write-Host "  ↷ data/ + backup/ 유지됨. 완전 삭제하려면  .\uninstall.ps1 -PurgeData" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "━━━ 제거 완료 ━━━" -ForegroundColor Green
Write-Host "  node_modules/, dist/ 는 남아있습니다. 프로젝트 폴더 자체를 지우려면 수동 삭제."
Write-Host ""
