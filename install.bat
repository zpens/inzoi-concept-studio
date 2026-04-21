@echo off
setlocal

rem ─── inZOI Concept Studio — 자동 설치 (관리자 권한 자동 승격) ───
rem 더블 클릭만 하면 UAC 창 승인 → install.ps1 실행.

cd /d "%~dp0"

rem 관리자 권한으로 PowerShell 실행.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','%~dp0install.ps1' -WorkingDirectory '%~dp0'"

echo.
echo 관리자 권한 창에서 설치가 진행됩니다.
echo 이 창은 닫으셔도 됩니다.
echo.
pause
