# Changelog

inZOI Asset Studio 변경 이력. 최신 버전이 위쪽에 있습니다.

## [1.1.2] — 2026-04-22

### Phase F (부분) — 컨펌 시 snapshot 보존
- 카드가 `confirmed_at` 설정되는 순간 `data/snapshots/{card_id}__{ts}.json` 로 JSON 스냅샷 저장.
- 스냅샷 내용: 카드 모든 필드 + data JSON + 체크리스트/체크리스트 아이템 + 첨부 + 댓글 + 최근 200건 활동 이력.
- 이후 카드가 수정·삭제되더라도 스냅샷은 파일시스템에 독립적으로 존재.
- `data/snapshots/` 는 `.gitignore` 대상이며, 매일 18:30 자동 백업에 포함됨.

## [1.1.1] — 2026-04-22

### Phase B-2 + D — 이중 저장 + 통합 카드 모달
- **이중 저장**: 위시리스트 / 완료 아이템 추가 시 기존 테이블과 `cards` 에 동시 저장. 기존 데이터 손실 없이 점진 이전.
- **통합 카드 상세 모달**: 960×92vh 모달로 큰 썸네일, 설명, 상태 드롭다운, 댓글 + 입력, 활동 이력, data JSON 뷰어. 컨펌된 카드는 🔒 잠김.
- 완료 목록 / 위시리스트 카드 클릭 시 cards 테이블에 있으면 통합 모달, 없으면 기존 모달로 자동 폴백.

## [1.1.0] — 2026-04-22

### Phase A — 앱 이름 변경 + 카드 데이터 모델 기반
- **앱 이름 변경**: inZOI Concept Studio → **inZOI Asset Studio**.
- **새 DB 테이블**: `lists` / `cards` / `checklists` / `checklist_items` / `card_attachments` / `card_comments` / `card_activities` (append-only) + 예약: `labels` / `members`.
- **자동 시드 리스트 4개**: 아이디어 / 시안 생성 / 컨셉시트 / 완료 (status_key = wishlist / drafting / sheet / done).
- **서버 API**: `GET/POST/PATCH/DELETE /api/projects/:slug/cards`, `/cards/:id/comments`, `GET /lists`.
- **컨펌 보호**: `confirmed_at` 있는 카드는 수정 요청 거부 (`{ force: true }` 또는 재오픈 필요).
- 레거시 마이그레이션: `npm run migrate:cards` — `wishlist_items` / `jobs` / `completed_items` 를 `cards` 로 복사 (원본 유지, 롤백 가능).

## 이전 버전

앱 이름 변경 이전 버전들은 "inZOI Concept Studio" 로 표기됨.



## [1.0.0] — 2026-04-21

### Phase 2 — 워크플로우 탭 카드 허브 UX 대개편

각 워크플로우 탭(시안 생성 / 투표 및 선정 / 컨셉시트 생성)을 **카드 그리드 허브** 로 재설계. 여러 작업을 동시에 진행하며 전체 상태를 한눈에 보고 관리할 수 있습니다.

**탭별 카드 허브:**
- **시안 생성**: step 0~1 의 작업 카드 그리드. 각 카드에 카테고리 아이콘, 프롬프트 요약, 시안 썸네일, 단계 배지. 상단에 "＋ 새 시안" 버튼.
- **투표 및 선정**: step 2~3 작업 카드. 카드마다 투표자 수 / 총 득표 수 표시.
- **컨셉시트 생성**: step 4~6 작업 카드. 선정된 시안 또는 컨셉시트 PNG 썸네일, "시트 생성됨" 뱃지.

**동작 방식:**
- 카드 클릭 → 해당 작업을 `active` 로 설정 → 아래쪽 "선택된 작업 진행" 섹션에 기존 step-based UI 전개.
- 작업이 하나도 없는 탭에는 친절한 안내 + 다음 단계 이동 힌트.
- 작업 단계가 바뀌면 자동으로 해당 탭으로 이동(기존 동작 유지).

**공용 컴포넌트:** `WorkflowJobCard` — 탭 컨텍스트에 맞춰 썸네일과 메타데이터를 다르게 렌더링.

## [0.9.10] — 2026-04-21

### Phase 1 — 이미지 영속성 근본 해결
**문제**: 위시리스트, 컨셉시트 이미지가 새로고침하면 사라졌음.

**원인**: base64 dataURL 을 D1 TEXT 컬럼에 그대로 저장 시도. 2MB row 제한 때문에 800KB 이상 이미지는 `trimForDb` 가 조용히 null 로 교체 → 재로드 시 이미지 없음.

**수정**:
- **`POST /api/upload`** — dataURL 을 받아 `data/images/{uuid}.{ext}` 파일로 저장하고 URL 반환.
- Gemini 시안, 컨셉시트 PNG, 위시 첨부 이미지 모두 이 엔드포인트 경유. DB 에는 `/data/images/...` URL 만 저장.
- **위시리스트 추가** 시 업로드 + `await POST` 로 즉시 동기 저장. 실패 시 alert.
- `trimForDb` 는 이제 "업로드 실패 fallback dataURL" 만 잘라냄. 정상 경로에서는 이미지가 절대 DB 에 들어가지 않음.

## [0.9.9] — 2026-04-21

### 추가
- 위시리스트 카드 클릭 시 상세 정보 모달 (큰 이미지, 제목, 메모 전문, 등록일시, 다운로드/삭제).
- 카드 메모는 2줄 ellipsis, 전체 내용은 모달에서 확인.

## [0.9.8] — 2026-04-21

### 버그 수정 — 새로고침 시 완료 목록 유실
**증상**: 파이프라인 전송 완료 버튼을 누른 직후 새로고침하면 방금 추가한 항목이 사라짐.

**원인**: `setCompletedList` 후 500ms debounce 가 서버 POST 를 예약하는데, 그 사이 새로고침이 일어나면 POST 가 발사되기 전에 페이지가 종료 → 서버에 저장 안 됨 → 재로드 시 서버의 (추가 전) 빈 목록으로 덮어씀.

**수정**:
- **파이프라인 전송 완료** 버튼이 서버에 **즉시 동기 POST** (`await`) 후 로컬 반영. 저장 실패 시 알림 + 중단.
- 로컬 반영과 동시에 `prevCompletedRef` 에도 등록해서 debounce effect 가 중복 POST 하지 않도록.
- `beforeunload` / `pagehide` 이벤트 리스너 추가 — 아직 debounce 대기 중이던 완료/위시리스트 신규 항목을 `navigator.sendBeacon` 으로 긴급 전송. 브라우저가 페이지를 닫거나 새로고침할 때도 안전하게 보장.
- 앱 시작 시 서버 스냅샷으로 `prevJobsRef` / `prevCompletedRef` / `prevWishlistRef` 를 선제 초기화 → 첫 debounce effect 가 서버 데이터를 "새로 추가됐다"고 오인해 중복 POST 하지 않도록.

## [0.9.7] — 2026-04-21

### 상단 메뉴 5단계 재편
- 상단 탭: **시안 생성 → 투표 및 선정 → 컨셉시트 생성 → 완료 목록 → 위시리스트**
- 각 워크플로우 탭이 담당하는 step 범위:
  - **시안 생성**: step 0~1 (입력, 갤러리)
  - **투표 및 선정**: step 2~3 (투표, 선정)
  - **컨셉시트 생성**: step 4~6 (생성, 결과 전달 준비)
- 탭 옆에 해당 단계 **진행 중 작업 개수** 뱃지 표시.
- 탭 클릭 시 해당 step 범위의 첫 작업으로 자동 전환.
- 해당 탭의 범위에 작업이 없으면 친절한 empty-state 안내와 다음 단계로 이동하는 힌트 제공.
- 활성 작업의 step 이 변하면 탭도 자동 전환 — 예: 갤러리에서 "투표 시작하기" 누르면 자동으로 "투표 및 선정" 탭으로 전환.
- "＋ 새 시안" 버튼은 모든 워크플로우 탭에서 접근 가능. 클릭 시 항상 "시안 생성" 탭으로 복귀 후 새 빈 작업 생성.

### 내부
- `TAB_STEP_RANGES` 상수 도입, `switchTab` 헬퍼가 탭 전환과 activeJob 재할당을 함께 처리.
- 워크플로우 본문 JSX 3탭이 공유 — step 기반 조건부 렌더링은 그대로 유지되어 수정 영향 최소화.

## [0.9.6] — 2026-04-21

### 사내 서버 무인 자동 운영 강화
- **자동 git pull + 재빌드** — `scripts/auto-update.ps1` 이 **5분마다** 실행. `git fetch`/`pull --ff-only` → HEAD 가 바뀌었으면 `npm install` + `npm run build` + `pm2 restart`. 변화 없으면 no-op. 로그: `logs/auto-update.log`.
- **헬스체크 + 자동 복구** — `scripts/health-check.ps1` 이 **2분마다** `/api/health` 호출. 실패 시 `pm2 restart inzoi`; 여전히 응답 없으면 `pm2 delete` 후 ecosystem 파일로 cold start. 상태 변화(복구/끊김)만 로그: `logs/health-check.log`.
- **재부팅 자동 시작** — `pm2-windows-startup` 서비스로 부팅 시 `pm2 resurrect` 자동 실행. install.ps1 이 등록.
- **pm2 ecosystem** — `ecosystem.config.cjs` 로 프로세스 정책 체계화:
  - `max_restarts: 20`, `restart_delay: 5000ms`, `min_uptime: 10s`
  - `max_memory_restart: 1G` (메모리 누수 보호)
  - 로그 경로 `logs/pm2-error.log`, `logs/pm2-out.log`
- **better-sqlite3 v12.9.0** — Node v24 LTS prebuild 공식 지원. Visual Studio Build Tools 불필요.

### 스크립트 업데이트
- `install.ps1` 6단계가 백업 / auto-update / health-check 3개 스케줄 작업을 한 번에 등록.
- `uninstall.ps1` 이 3개 작업 모두 해제.
- `package.json` 에 `npm run auto-update`, `npm run health-check` 스크립트 노출.

### 운영 관점
- 개발자가 main 에 push 하면 **운영자 PC 가 최대 5분 내 자동 반영**. update.bat 수동 실행 불필요.
- 프로세스가 응답 없으면 **최대 2분 내 자동 복구 시도**.
- 운영자 PC 재부팅 시 pm2 가 inzoi 프로세스 자동 복원.
- 확인 명령:
  ```
  pm2 status                    현재 프로세스 상태
  type logs\auto-update.log     최근 업데이트 기록
  type logs\health-check.log    최근 헬스체크 이벤트
  ```

## [0.9.5] — 2026-04-21

### 자동 설치 스크립트
- **`bootstrap.ps1`** — 원격 한 줄 설치. 관리자 PowerShell 에서 `iwr .../bootstrap.ps1 | iex` 하면 Git/Node 설치부터 clone, 빌드, 방화벽, pm2 상주, 자동 백업 스케줄러까지 일괄 처리.
- **`install.ps1`** — 프로젝트 루트에서 실행하는 자동 설치 본체. 이미 코드를 받아둔 경우 이걸 바로 실행. 7단계로 색상 로그 출력.
- **`install.bat`** — 더블 클릭 시 UAC 승격 후 `install.ps1` 호출.
- **`update.bat`** — 더블 클릭 원클릭 업데이트. `git pull` + `npm install` + `build` + `pm2 restart`.
- **`uninstall.ps1`** — pm2 프로세스, 방화벽 규칙, 백업 작업 스케줄러를 일괄 해제. 기본은 data/ 보존, `-PurgeData` 플래그로 완전 삭제 가능.
- 실패 시 명확한 색상 로그와 복구 안내. 멱등성(이미 설치된 부분은 자동 skip) 보장.

### 문서
- README-사내배포.md 상단에 "🚀 한 줄 자동 설치" 섹션 추가. 기존 수동 설치는 fallback 으로 아래로 이동.

## [0.9.4] — 2026-04-21

### 사내 PC 배포 지원
- **Node + Hono + SQLite 단일 서버 (`server.js`)** — Cloudflare Pages Functions 로직을 Node.js 로 포팅. Docker 없이 Node LTS 하나만 설치하면 실행.
- **원클릭 실행** — Windows `start.bat`, macOS/Linux `start.sh`. 의존성 자동 설치 + 빌드 + 기동.
- **로컬 저장** — `data/inzoi.db` (SQLite) + `data/images/` (이미지). 폴더 하나가 전체 상태.
- **사내 IP 자동 감지** — 서버 기동 시 콘솔에 동료 접속용 URL 표시.
- **백업 스크립트** — `npm run backup` 으로 `data/` 를 `backup/data-YYYYMMDD-HHMM/` 에 타임스탬프 복사. 외부 의존성 없음.
- **배포 가이드** — [README-사내배포.md](./README-사내배포.md) 에 운영자 PC 세팅 단계, 방화벽, pm2 상주 방법, 문제 해결 등 문서화.

### 아키텍처
- 프론트엔드는 변경 없음 — 기존 `/api/projects/...` 엔드포인트를 같은 스펙으로 서빙.
- 기존 Cloudflare 스택(`wrangler.jsonc`, `functions/`)은 레거시로 유지. 사내 운영자 PC 안정화 후 제거 예정.

### 알려진 한계
- 운영자 PC 가 꺼지면 서비스 중단. 절전 모드 비활성화 + pm2 상주 필요.
- 동시 접속 ~20명 내외에서 안정. 그 이상이면 전용 서버 고려.
- 이미지는 여전히 base64 dataURL 로 DB 에 저장 (SQLite 는 용량 제한 없음). 추후 `data/images/` 분리 업로드로 전환 예정.

## [0.9.3] — 2026-04-21

### 버그 수정
- **완료 목록 항목이 사라지던 문제 해결** — 파이프라인 전송 후 완료 목록에 추가된 아이템이 5초 폴링 시 서버의 빈 응답(아직 저장 안 된 상태)에 덮어씌워 사라지는 경쟁 조건 제거. 이제 로컬에만 있는 신규 아이템은 폴링 merge 시 보존됨.
- **대용량 이미지 저장 실패 대응** — 컨셉시트 PNG 같은 큰 base64 dataURL(~수 MB)이 D1 의 2MB row 제한을 넘어 INSERT 실패하던 문제. 이제 800KB 초과 시 서버 저장은 생략하고 세션 내에서는 원본 표시. R2 마이그레이션 후 근본 해결 예정.
- 폴링 merge 시 id 비교를 문자열 변환 후 수행 (로컬 number / 서버 string 불일치 보정).

## [0.9.2] — 2026-04-21

### 추가
- **디자인 시안 이미지 확대 모달** — 갤러리(Step 1)에서 시안 카드 클릭 시 큰 이미지로 모달 오픈. 오버레이 또는 ✕ 버튼으로 닫기.
- **PNG 로컬 저장 버튼** — 모달 헤더 `📥 저장` 버튼으로 현재 시안 이미지를 `inzoi_design_{seed}.png` 파일명으로 다운로드.
- 모달 하단에 생성에 사용된 프롬프트 스크롤 뷰 제공.

## [0.9.1] — 2026-04-21

### 추가
- **위시리스트 클립보드 이미지 붙여넣기** — 위시리스트 탭에서 `Ctrl+V` 로 캡처/복사한 이미지를 바로 첨부. "이미지 첨부" 버튼 옆에 힌트 표시.

### 변경
- 시안 생성 개수 기본값을 **4개 → 1개**로 변경. 여러 시안을 원할 때는 2/4/8 중 선택.

## [0.9.0] — 2026-04-21

### 추가 — 협업 백엔드 도입
- **Cloudflare D1 데이터베이스** — 모든 작업(`jobs`), 완료 목록(`completed_items`), 위시리스트(`wishlist_items`), 활동 로그(`activity_log`)를 서버에 저장. 더 이상 localStorage 의존 X.
- **프로젝트 공유 URL** — 첫 접속 시 자동으로 고유 slug(`/p/{8자리}`)가 발급되고 URL 에 반영. 팀원에게 링크를 보내면 같은 프로젝트에 바로 접속.
- **헤더 공유 URL 버튼** — 클릭 시 클립보드 복사. 저장 상태 인디케이터(`저장중` / `⚠`)도 함께 표시.
- **5초 폴링 실시간 동기화** — 다른 사람이 추가한 시안·완료 아이템·위시리스트가 최대 5초 안에 자동 반영. 내가 편집 중인 active job 은 덮어쓰지 않음.
- **Pages Functions API** — `/api/projects/:slug`, `/api/projects/:slug/jobs/:id`, `/api/projects/:slug/completed/:id`, `/api/projects/:slug/wishlist/:id`, `/api/projects/:slug/activity` 라우트. 단일 catchall 라우터로 구현.

### 변경
- 완료 목록·위시리스트가 **D1 이 source of truth**. 기존 localStorage 저장 로직 제거.
- 상태 변경 시 500ms debounce 후 서버 저장 (jobs 는 diff PUT, completed/wishlist 는 POST/DELETE).
- 이제 브라우저 캐시를 비우거나 다른 기기에서 접속해도 동일 프로젝트 데이터 유지.

### 내부
- D1 스키마 5 테이블 (projects / jobs / completed_items / wishlist_items / activity_log), 인덱스 포함.
- `dbRowToJob` / `jobToDbPayload` 등 snake_case ↔ camelCase 변환 헬퍼.
- `wrangler.jsonc` 에 D1 바인딩 정의, Pages Functions 에서 `env.DB` 로 접근.

### 알려진 한계
- 이미지(Gemini dataURL)가 D1 TEXT 컬럼에 그대로 저장됨. row 당 수 MB. 향후 R2 로 분리 예정(R2 활성화 필요).
- Gemini API 키는 여전히 브라우저 localStorage. 팀 공유 키로 전환할 경우 서버 측 시크릿으로 이전 필요.
- 동시 편집 충돌은 last-write-wins (진짜 실시간 아님).

## [0.8.0] — 2026-04-21

### 추가
- **시안 N개 동시 생성** — 입력 폼에 `시안 개수` 선택 UI (1 / 2 / 4 / 8) 추가. 기본값 4.
- Gemini API 병렬 호출 — 선택한 개수만큼 동시에 이미지 생성. 레이트 리밋 회피를 위해 **최대 동시 4개 쓰로틀링** (`runWithConcurrencyLimit`).
- 각 호출이 완료될 때마다 큐 패널의 로딩 메시지·진행바가 `나노바나나2로 시안 생성 중... (2/4)` 식으로 실시간 갱신.

### 변경
- 1개만 생성한 경우 투표 단계를 건너뛰고 바로 "시안 선정" 스텝으로 진행 (단일 후보 투표는 의미 없음).
- 일부 시안만 실패해도 성공한 것들은 갤러리에 표시 — 전부 실패일 때만 경고.
- 갤러리 "다음" 버튼 라벨이 디자인 개수에 따라 달라짐 (`이 시안으로 진행하기 →` / `투표 시작하기 🗳️`).

### 내부
- `job.variantCount` 필드 추가, `setVariantCount` setter 노출.
- 공용 유틸 `runWithConcurrencyLimit(tasks, limit, onProgress)` — 태스크 배열을 N개 병렬 제한으로 실행, 완료 시마다 진행 콜백.

## [0.7.1] — 2026-04-21

### 변경
- **시안 생성 완전 백그라운드화** — 입력 폼에서 "시안 생성하기"를 누르면 메인 화면이 더 이상 "생성중" 뷰로 전환되지 않습니다. 현재 작업은 백그라운드로 돌아가고, 활성 작업은 즉시 새 빈 작업으로 교체되어 바로 다음 어셋 입력을 시작할 수 있습니다.
- 진행 상황은 우측 하단 플로팅 큐 패널에서만 확인 — 메인 영역은 항상 사용자가 현재 하는 일에 집중할 수 있도록 유지됩니다.
- 재생성(step 1 갤러리)은 기존대로 현재 작업을 유지한 채 다시 생성합니다.

### 개선
- 생성 중 작업 카드로 전환해도 생성 버튼이 비활성화되어 중복 제출을 막습니다.
- 버튼 라벨이 로딩 상태를 반영 (`🎨 백그라운드에서 생성 중…`).

## [0.7.0] — 2026-04-20

### 추가
- **시안 작업 큐** — 여러 시안을 동시에 진행. `jobs[]` 배열 기반 상태로 재구성되어 각 작업이 자신의 step·category·prompt·designs·투표·conceptSheet·loading 상태를 독립적으로 보유합니다.
- **우측 하단 플로팅 큐 패널** — 각 작업의 카테고리·프롬프트 스니펫·진행바·단계 라벨·✕(삭제) 표시. 카드 클릭으로 작업 전환.
- 헤더 **`＋ 새 시안`** 버튼 — 진행 중 작업 유지한 채 새 작업 시작.
- **완료 컨셉시트 상세 모달** — 완료 목록 카드 클릭 시 1200px 모달에 대형 이미지·에셋코드·파이프라인 상태·선정 시안·투표 수·프롬프트 전문·컬러 팔레트·시드·완료일시·다운로드 버튼 표시.
- **localStorage 자동 저장** — 완료 목록·위시리스트가 새로고침해도 유지. 이미지 용량 초과 시 메타데이터만이라도 저장하도록 폴백 처리.

### 변경
- 전체화면 로딩 오버레이를 큐 패널로 교체.
- 컨셉시트 6개 뷰 슬롯이 동일 디자인을 공유하도록 변경. 뷰마다 별도 Gemini 호출 제거(비용 절감 + 일관성) 후 캔버스에서 정면/측면/후면/디테일/상단 전용 변형(반전/크롭/줌) 적용.
- 컨셉시트 캔버스에 한글 라벨과 라이트 테마(inZOI Canvas 시스템) 적용.
- Pipeline 전송 완료 시 해당 job을 큐에서 자동 제거.

## [0.6.0] — 2026-03-27

### 추가
- 나노바나나2 (Gemini 3.1 Flash Image) API 연동으로 실제 이미지 생성.
- API 키 설정 패널 (Gemini / Claude).
- 멀티뷰 컨셉시트 실제 이미지 생성.

## [0.5.0] — 2026-03-06

- inZOI Canvas 브랜드 디자인 시스템 적용.
- 컬러 팔레트 변경 (indigo → inZOI blue/skyblue).
- Pretendard 한글 폰트 추가.

## [0.4.0] — 2026-03-05

- 완료 목록 카드에 대형 이미지 썸네일 추가.
- 위시리스트 기능 추가 (이미지 첨부, 메모).
- 사이드바 탭 UI (완료 목록 / 위시리스트).
- 샘플 데이터 10개씩 확장.

## [0.3.0] — 2026-03-04

- 완료된 컨셉시트 리스트 사이드 패널 추가.
- 파이프라인 전송 완료 시 자동 목록 추가.
- 버전 정보 및 변경내역 팝업 추가.

## [0.2.0] — 2026-03-01

- 투표 및 시안 선정 워크플로우 추가.
- 다중 투표자 지원.
- 동점 시 수동 선정 기능.

## [0.1.0] — 2026-02-28

- 초기 프로토타입.
- AI 기반 프롬프트 최적화 (Claude API).
- 카테고리별 가구 컨셉 생성.
- 멀티뷰 컨셉시트 생성.
- 에셋 메타데이터 JSON 내보내기.
