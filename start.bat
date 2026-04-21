@echo off
setlocal

rem ─── inZOI Concept Studio — Windows 원클릭 실행 ───
rem 처음 실행 시 자동으로 의존성 설치 + React 빌드까지 진행합니다.

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [!] Node.js 가 설치되어 있지 않습니다.
  echo     https://nodejs.org 에서 LTS 버전을 먼저 설치하세요.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [*] node_modules 없음 — npm install 실행...
  call npm install
  if errorlevel 1 (
    echo [!] npm install 실패. 로그를 확인하세요.
    pause
    exit /b 1
  )
)

if not exist dist (
  echo [*] dist 없음 — 프론트엔드 빌드 실행...
  call npm run build
  if errorlevel 1 (
    echo [!] 빌드 실패. 로그를 확인하세요.
    pause
    exit /b 1
  )
)

if not defined PORT set PORT=3000

rem 포트 충돌 체크 — 이미 사용 중이면 사용자에게 경고.
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo.
  echo [!] 포트 %PORT% 가 이미 사용 중입니다.
  echo     다른 포트로 시작하려면:  set PORT=8082  ^&^&  start.bat
  echo     사용 중인 프로세스 확인:  netstat -ano ^| findstr :%PORT%
  echo.
  pause
  exit /b 1
)

echo.
echo ─────────────────────────────────────────────
echo  inZOI Concept Studio 서버를 시작합니다.
echo  포트: %PORT%
echo  중지하려면 이 창을 닫거나 Ctrl+C 를 누르세요.
echo ─────────────────────────────────────────────
echo.

node server.js
pause
