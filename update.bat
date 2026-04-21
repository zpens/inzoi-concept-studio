@echo off
setlocal

rem inZOI Concept Studio - one-click update
rem git pull + npm install + build + pm2 restart

cd /d "%~dp0"

echo.
echo === 1/4  git pull ===
git pull
if errorlevel 1 (
  echo [!] git pull failed. Check network or permissions.
  pause
  exit /b 1
)

echo.
echo === 2/4  npm install ===
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo [!] npm install failed.
  pause
  exit /b 1
)

echo.
echo === 3/4  npm run build ===
call npm run build
if errorlevel 1 (
  echo [!] build failed.
  pause
  exit /b 1
)

echo.
echo === 4/4  pm2 restart inzoi ===
call pm2 restart inzoi
if errorlevel 1 (
  echo [!] pm2 has no 'inzoi' process. Run install.bat first.
  pause
  exit /b 1
)

echo.
echo === update complete ===
call pm2 status inzoi
echo.
pause
