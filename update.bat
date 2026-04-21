@echo off
setlocal

rem ─── inZOI Concept Studio — 원클릭 업데이트 ───
rem GitHub 최신 코드 pull + 의존성 반영 + 재빌드 + pm2 재시작

cd /d "%~dp0"

echo.
echo ━━━ 1/4 git pull ━━━
git pull
if errorlevel 1 (
  echo [!] git pull 실패. 네트워크/권한 확인 필요.
  pause
  exit /b 1
)

echo.
echo ━━━ 2/4 npm install ━━━
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo [!] npm install 실패.
  pause
  exit /b 1
)

echo.
echo ━━━ 3/4 npm run build ━━━
call npm run build
if errorlevel 1 (
  echo [!] 빌드 실패.
  pause
  exit /b 1
)

echo.
echo ━━━ 4/4 pm2 restart inzoi ━━━
call pm2 restart inzoi
if errorlevel 1 (
  echo [!] pm2 에 inzoi 프로세스가 없습니다. install.bat 먼저 실행하세요.
  pause
  exit /b 1
)

echo.
echo ━━━ 업데이트 완료 ━━━
call pm2 status inzoi
echo.
pause
