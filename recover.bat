@echo off
setlocal

rem inZOI Asset Studio - 원클릭 강제 복구
rem pm2 프로세스 완전 재기동 + GitHub 최신 강제 동기화 + 재빌드

cd /d "%~dp0"

echo.
echo === 1/7 pm2 프로세스 제거 ===
call pm2 delete inzoi 2^>nul

echo.
echo === 2/7 git 최신화 (강제) ===
call git fetch origin main
if errorlevel 1 (
  echo [!] git fetch 실패. 네트워크 확인 필요.
  pause
  exit /b 1
)
call git reset --hard origin/main

echo.
echo === 3/7 의존성 설치 ===
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo [!] npm install 실패. node_modules 를 지우고 재시도를 권장.
  pause
  exit /b 1
)

echo.
echo === 4/7 프론트엔드 빌드 ===
call npm run build
if errorlevel 1 (
  echo [!] 빌드 실패. 로그 확인 필요.
  pause
  exit /b 1
)

echo.
echo === 5/7 pm2 기동 ===
call pm2 start ecosystem.config.cjs
call pm2 save

echo.
echo === 6/7 헬스 체크 (5초 대기) ===
timeout /t 5 /nobreak >nul
call curl.exe http://localhost:3000/api/health

echo.
echo === 7/7 pm2 상태 ===
call pm2 status

echo.
echo 복구 완료. 브라우저에서 Ctrl+F5 로 하드 리프레시 권장.
pause
