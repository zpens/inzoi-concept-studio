# inZOI Concept Studio — 사내 PC 배포 가이드

이 문서는 **운영자 PC 한 대**에서 서버를 돌리고, 사내 팀원들이 브라우저로 접속하는 구성의 세팅 가이드입니다.

- 전용 서버·Docker 불필요. Node.js LTS 만 설치하면 됩니다.
- 데이터는 모두 `data/` 폴더 안에 저장됩니다 (SQLite 파일 + 이미지).
- 백업 = `data/` 폴더 복사.

---

## 1. 운영자 PC 요구사항

| 항목 | 권장 | 최소 |
|---|---|---|
| OS | Windows 10/11 (x64) 또는 macOS 12+ | 동일 |
| RAM | 8 GB | 4 GB |
| 디스크 여유 | 100 GB 이상 | 20 GB |
| 네트워크 | 사내망 연결, 가급적 **고정 IP** | DHCP 여도 가능 |
| 설치 소프트웨어 | Node.js LTS (v20 이상), Git | Node.js 만 있어도 가능 |

> **중요**: 이 PC 가 꺼지면 서비스도 꺼집니다. 절전 모드를 비활성화하고, 가능하면 항상 전원을 켠 상태로 두세요.

---

## 2. 최초 설치 (약 10 분)

### 2-1. Node.js 설치
- Windows: https://nodejs.org 에서 **LTS** 다운로드 후 설치
- macOS: `brew install node` 또는 공식 설치 파일
- 확인: 터미널에서 `node -v` → `v20.x` 이상이어야 함.

### 2-2. 코드 받기
```powershell
# 원하는 위치에서
git clone https://github.com/zpens/inzoi-concept-studio.git
cd inzoi-concept-studio
```
(Git 없이 ZIP 다운로드해도 됩니다.)

### 2-3. 의존성 + 빌드
```powershell
npm install
npm run build
```
- `npm install`: 필요한 패키지 설치 (약 2~3분)
- `npm run build`: 프론트엔드 빌드 → `dist/` 생성 (약 10초)

---

## 3. 서버 실행

### 방법 A — 원클릭 실행 (추천)
- Windows: `start.bat` **더블 클릭**
- macOS / Linux: `./start.sh` 실행 (`chmod +x start.sh` 한 번 필요)

콘솔에 다음이 표시됩니다:
```
▶ inZOI Concept Studio — 사내 로컬 서버
  ─────────────────────────────────────────
   로컬 확인 : http://localhost:3000
   사내 동료 : http://10.10.x.x:3000
   DB        : data\inzoi.db
   이미지    : data\images
  ─────────────────────────────────────────
```

### 방법 B — 수동 실행
```powershell
npm start
# 또는
node server.js
```

### 포트 변경
`set PORT=4000 && node server.js` (Windows)
`PORT=4000 node server.js` (mac/Linux)

---

## 4. 팀원이 접속하도록 공유

### 4-1. Windows 방화벽 허용 (한 번만)
관리자 PowerShell 에서:
```powershell
New-NetFirewallRule -DisplayName "inZOI Concept Studio" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```
Windows Defender 방화벽 알림이 뜨면 **"액세스 허용"** 선택해도 됩니다.

macOS: 첫 실행 시 "수신 연결 허용" 팝업에서 **허용**.

### 4-2. 내 IP 확인
- Windows: `ipconfig` → "IPv4 주소" (예: `10.10.5.42`)
- macOS: `ifconfig | grep inet` (혹은 시스템 환경설정 → 네트워크)

### 4-3. 팀에 공유
예시 메시지:
> inZOI Concept Studio 가 열렸습니다.
> 접속 URL: **http://10.10.5.42:3000**
> 동작은 9시~6시 (점심 12~13시엔 잠시 꺼질 수 있음)

> **팁**: IP 가 자주 바뀐다면 사내 IT 팀에 고정 IP 또는 DNS 호스트명 할당을 요청하세요.

---

## 5. 백업 (중요)

### 수동 백업
```powershell
npm run backup
```
→ `backup/data-YYYYMMDD-HHMM/` 에 `data/` 전체 복사됩니다.

### 자동 백업 (권장)
**Windows 작업 스케줄러**:
- "작업 만들기" → 트리거: 매일 오후 6시
- 동작: 프로그램 시작 → `npm.cmd` 인수 `run backup` 시작 위치에 프로젝트 경로

**macOS / Linux crontab**:
```bash
0 18 * * * cd /path/to/inzoi-concept-studio && npm run backup >> backup/backup.log 2>&1
```

### 주기적으로 NAS/외장 디스크에 복사
```powershell
# 예: 주 1회
robocopy data \\NAS\backup\inzoi-%date:~0,4%%date:~5,2%%date:~8,2% /E
```

---

## 6. 항상 켜두기 (백그라운드 상주)

개발자용 `node server.js` 는 콘솔 창을 닫으면 꺼집니다. 24/7 운영하려면:

### pm2 사용 (권장)
```powershell
npm install -g pm2
pm2 start server.js --name inzoi
pm2 save

# Windows: 재부팅 시 자동 시작
npm install -g pm2-windows-startup
pm2-startup install

# mac/Linux:
pm2 startup
```

이후:
- 상태 확인: `pm2 status`
- 로그 실시간: `pm2 logs inzoi`
- 재시작: `pm2 restart inzoi`
- 중지: `pm2 stop inzoi`

### 절전 모드 비활성화
- Windows: 설정 → 시스템 → 전원 → "절전 모드로 전환" → **안 함**
- macOS: 시스템 환경설정 → 에너지 절약 → "컴퓨터가 잠들지 않도록" 체크

---

## 7. 업데이트 (개발자 PC 에서 코드 변경 후)

```powershell
# 운영자 PC 에서:
git pull
npm install       # 새 의존성이 있으면
npm run build     # 프론트 변경이 있으면
pm2 restart inzoi
```

---

## 8. 문제 해결

| 증상 | 확인 |
|---|---|
| 팀원이 접속 못함 | 방화벽 허용 됐는지, IP 맞는지, 포트 3000 아닌지 |
| "dist/index.html not found" | `npm run build` 먼저 실행 |
| better-sqlite3 빌드 에러 | Node v20 LTS 인지 확인. 그래도 안 되면 Windows Build Tools 필요 (`npm install -g windows-build-tools`) |
| DB lock 에러 | 서버가 두 개 떠 있지 않은지 확인 (`pm2 list` 또는 작업 관리자) |
| 디스크 꽉 참 | `data/images/` 크기 확인, 오래된 백업 정리 |

### 서버 로그 위치
- `pm2 logs inzoi` 로 실시간 확인
- 파일: `~/.pm2/logs/inzoi-out.log` 및 `inzoi-error.log`

### 완전 초기화 (주의: 데이터 삭제)
```powershell
# 서버 중지 후
rmdir /s /q data
npm start
```

---

## 9. 보안 메모

- **Gemini API 키**는 현재 브라우저 localStorage 에 저장됩니다 (사용자 개인 키). 팀 공유 키로 바꾸려면 서버 측 프록시 필요.
- 서버는 **사내망 전용**으로 운영하세요. 외부 인터넷에 직접 노출하면 누구나 프로젝트 데이터를 읽을 수 있습니다.
- 외부 공유가 필요하면 사내 VPN 을 경유하거나 Cloudflare Tunnel 같은 게이트웨이 경유.
- 민감 자료를 `prompt` / 참조 이미지로 넣지 않도록 팀에 안내.

---

## 10. 파일 구조

```
inzoi-concept-studio/
├── server.js               ← Node 서버 본체
├── schema.sqlite.sql       ← DB 스키마
├── start.bat / start.sh    ← 원클릭 실행
├── scripts/
│   └── backup.js           ← 백업 스크립트
├── dist/                   ← React 빌드 결과물 (npm run build 로 생성)
├── data/                   ← ★ 운영 데이터 (백업 대상) ★
│   ├── inzoi.db            ← SQLite
│   └── images/             ← 업로드 이미지 (향후)
├── backup/                 ← npm run backup 결과물
├── inzoi-concept-tool.jsx  ← 프론트엔드 소스
├── functions/              ← (legacy) Cloudflare Pages Functions, 지금은 미사용
└── wrangler.jsonc          ← (legacy) Cloudflare 설정, 지금은 미사용
```

---

## 11. 현재 상태 / 로드맵

- [x] Node + SQLite 단일 바이너리 서버
- [x] 프로젝트 공유 URL (`/p/{slug}`)
- [x] 완료 목록 / 위시리스트 / 활동 로그 CRUD
- [x] 5초 폴링 실시간 동기화
- [ ] 이미지 업로드 → `data/images/` 분리 저장 (향후, 현재는 dataURL 유지)
- [ ] Gemini API 서버 프록시 (팀 공유 키)
- [ ] 단순 인증 (이름 입력 → 세션 식별)

질문 / 이슈 보고: https://github.com/zpens/inzoi-concept-studio/issues
