@echo off
setlocal

rem inZOI Concept Studio - Windows one-click runner (foreground mode)
rem Auto-installs deps and builds on first run.

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [!] Node.js is not installed.
  echo     Install LTS from https://nodejs.org and retry.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [*] node_modules missing - running npm install...
  call npm install
  if errorlevel 1 (
    echo [!] npm install failed. Check the log above.
    pause
    exit /b 1
  )
)

if not exist dist (
  echo [*] dist missing - running frontend build...
  call npm run build
  if errorlevel 1 (
    echo [!] build failed. Check the log above.
    pause
    exit /b 1
  )
)

if not defined PORT set PORT=3000

netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo.
  echo [!] Port %PORT% is already in use.
  echo     To start on another port:  set PORT=8082  ^&^&  start.bat
  echo     Find the process:          netstat -ano ^| findstr :%PORT%
  echo.
  pause
  exit /b 1
)

echo.
echo ---------------------------------------------
echo  inZOI Concept Studio server starting
echo  Port: %PORT%
echo  Stop with Ctrl+C
echo ---------------------------------------------
echo.

node server.js
pause
