# inZOI Concept Studio - uninstaller
# Unregisters pm2 / firewall / scheduled task.
# Data folder is kept by default (use -PurgeData to wipe).

param(
  [int]$Port = 3000,
  [switch]$PurgeData
)

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "[!] Administrator privileges required." -ForegroundColor Red
  exit 1
}

Write-Host "=== 1/4  pm2 delete inzoi ===" -ForegroundColor Cyan
pm2 delete inzoi 2>&1 | Out-Null
pm2 save 2>&1 | Out-Null
Write-Host "  [OK] pm2 inzoi process removed" -ForegroundColor Green

Write-Host ""
Write-Host "=== 2/4  firewall rules ===" -ForegroundColor Cyan
$rules = Get-NetFirewallRule -DisplayName "inZOI Concept Studio*" -ErrorAction SilentlyContinue
if ($rules) {
  $rules | Remove-NetFirewallRule
  Write-Host "  [OK] removed firewall rules" -ForegroundColor Green
} else {
  Write-Host "  [skip] no matching firewall rules" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== 3/4  scheduled tasks ===" -ForegroundColor Cyan
$taskNames = @(
  "inZOI Concept Backup",
  "inZOI Concept Auto Update",
  "inZOI Concept Health Check"
)
$removed = 0
foreach ($n in $taskNames) {
  $task = Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue
  if ($task) {
    Unregister-ScheduledTask -TaskName $n -Confirm:$false
    Write-Host "  [OK] removed: $n" -ForegroundColor Green
    $removed++
  }
}
if ($removed -eq 0) { Write-Host "  [skip] no scheduled tasks registered" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "=== 4/4  data ===" -ForegroundColor Cyan
if ($PurgeData) {
  if (Test-Path "data")   { Remove-Item -Recurse -Force "data";   Write-Host "  [x] data/ deleted"   -ForegroundColor Red }
  if (Test-Path "backup") { Remove-Item -Recurse -Force "backup"; Write-Host "  [x] backup/ deleted" -ForegroundColor Red }
} else {
  Write-Host "  [skip] data/ and backup/ kept. Use  .\uninstall.ps1 -PurgeData  to wipe." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== uninstall complete ===" -ForegroundColor Green
Write-Host "  node_modules/ and dist/ remain. Remove the project folder manually to fully clean up."
Write-Host ""
