@echo off
setlocal

rem inZOI Concept Studio - Windows one-click installer
rem Double-click this file. It will self-elevate (UAC) and run install.ps1.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','%~dp0install.ps1' -WorkingDirectory '%~dp0'"

echo.
echo Installation is running in the elevated PowerShell window.
echo You may close this window.
echo.
pause
