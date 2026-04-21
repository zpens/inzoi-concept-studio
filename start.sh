#!/usr/bin/env bash
# inZOI Concept Studio — macOS / Linux 원클릭 실행

set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[!] Node.js 가 설치되어 있지 않습니다. https://nodejs.org 에서 LTS 설치 필요."
  exit 1
fi

[ ! -d node_modules ] && echo "[*] npm install..." && npm install
[ ! -d dist ]         && echo "[*] npm run build..." && npm run build

export PORT="${PORT:-3000}"

echo ""
echo "─────────────────────────────────────────────"
echo " inZOI Concept Studio 서버를 시작합니다."
echo " 중지하려면 Ctrl+C"
echo "─────────────────────────────────────────────"
echo ""

exec node server.js
