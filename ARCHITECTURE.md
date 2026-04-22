# inZOI Asset Studio — 아키텍처 & 운영 가이드

버전 1.7.x 기준. 세부 변경 이력은 `inzoi-concept-tool.jsx` 상단의 `CHANGELOG` 상수를 참조.

---

## 1. 목적 & 큰 그림

inZOI 게임에 들어갈 가구·인테리어 에셋의 **컨셉시트**를 협업으로 만드는 도구.
흐름: **아이디어(위시)** → **시안 생성(Gemini 이미지)** → **선정/투표** → **컨셉시트** → **완료**.

사내 전용. 운영자 PC(10.99.4.115) 한 대가 서버 + DB를 맡고, 다른 PC는 브라우저로 접속.
자동 업데이트 / 자동 복구가 내장되어 있어 수동 관리 없이 돌아간다.

---

## 2. 데이터 모델 (SOT)

**`cards` 테이블이 유일한 Source Of Truth**.
레거시 테이블(`wishlist_items` / `completed_items` / `jobs`)은 **읽기 전용** 으로만 취급.

```
projects(slug="default") 1
  ├── lists  — wishlist / drafting / sheet / done (status_key 고정)
  └── cards  — 실제 카드 (list_id 로 단계 구분)
       ├── card_comments
       ├── card_activities (append-only 이력)
       ├── card_attachments
       └── checklists / checklist_items
```

### 카드 상태 흐름
```
wishlist → drafting → sheet → done
  (아이디어)  (시안 생성)  (컨셉시트)  (확정)
```
- `confirmed_at` 설정 시 카드 잠금. 수정하려면 "🔓 재오픈" 버튼으로 해제.
- 모든 확정은 `data/snapshots/{card_id}__{ts}.json` 에 자동 백업.

### `card.data` 의 주요 키
| 키 | 의미 |
|----|------|
| `category` | 카테고리 id (`Bed`, `Sofa` …) |
| `category_label` | 한글 라벨 캐시 |
| `style_preset` | 스타일 id (`Modern`, `Scandinavian` …) |
| `prompt` | 사용자가 쓴 프롬프트 원문 |
| `ref_images` | 참조 이미지 URL 배열 (Gemini multimodal input) |
| `designs` | 생성된 시안 `{seed, imageUrl, createdAt}[]` |
| `selected_design` | 선정(대표) 시안 index |
| `concept_sheet_url` | 최종 컨셉시트 PNG URL |
| `source` | `"wishlist" / "completed"` 등 origin |

### 중복 방지 규칙 (1.5.7+)
클라이언트가 derived 목록(wishlist / completedList)을 legacy 테이블에 역복사하던 싱크를 모두 제거. `ensureLegacyMigration`이 남은 legacy 행으로 `wish-…` / `comp-…` 접두사 카드를 재생성하는 루프가 끊겼다.
앱 초기화 시 `list_id + title + description + thumbnail_url` 동일한 카드는 가장 깨끗한 id 1개만 남기고 자동 삭제 (id 우선순위: 접두사 없음 > `card-…` > `wish-…` > `comp-…` > 이중 접두사 > `job-…`).

---

## 3. 외부 연동

### Gemini API (필수)
| 용도 | 모델 | 호출 지점 |
|------|------|----------|
| 시안 이미지 생성 | `gemini-3-flash-image` (나노바나나2) | `generateImageWithGemini` |
| 카테고리 자동 분류 | `gemini-2.5-flash` + `responseMimeType: application/json` | `classifyCategoryWithGemini` |

### Claude API (선택)
`claude-sonnet-4-20250514` 로 프롬프트 enhance. Claude 키 없으면 기본 프롬프트 그대로 전송.

### inzoiObjectList 연동 (1.7.0+)
카테고리/스타일 목록이 외부 프로젝트(`D:\Project_ai\inzoiObjectList`)의 `data/meta.json` + `data/objects.json` 과 자동 동기.
```
브라우저 → /api/object-meta → [concept-studio :3000]
                                  ↓ fetch (meta.json + objects.json 병렬)
                             http://localhost:8080/data/*.json
                             (inzoiObjectList 내장 server.py)
```
- 서버 1시간 메모리 캐시, `?force=1` 로 즉시 무효화
- 다른 호스트는 `INZOI_OBJECT_LIST_URL` 환경변수로 override
- 실패 시 코드에 하드코딩된 fallback 목록 사용 (앱은 정상 동작)
- 클라이언트는 1시간 주기 재조회 → `let FURNITURE_CATEGORIES` / `let STYLE_PRESETS` 교체 + `metaVersion` bump 으로 강제 re-render

#### /api/object-meta 응답 구조 (1.7.1+)
```jsonc
{
  "categories": [
    {
      "id": "Bed",             // meta.catHier 의 type id
      "label": "침대",         // meta.filterKo
      "room": "침실",          // 상위 room
      "group": "가구",         // 최상위 그룹
      "icon": "🛏️",            // room 기반 이모지
      "preset": "침대, furniture asset",
      "spec": {                // objects.json 에서 집계 (없을 수 있음)
        "asset_count": 25,
        "sample_names": ["싱글 침대", "더블 침대", "네추럴 드림 침대", ...],
        "common_tags": ["Bed_Single", "Bed_Double", "Cheap_Bed", ...],
        "styles": ["Modern", "Scandinavian", "Industrial"],
        "price_range": { "min": 100, "max": 5000, "median": 800 }
      }
    }
    // ~208 카테고리
  ],
  "styles": [
    { "id": "Modern", "label": "모던" }, ...  // 9개, objTags 에 실제 등장하는 것만
  ],
  "source": "http://localhost:8080",
  "fetched_at": "2026-04-23T...",
  "category_count": 208,
  "style_count": 9,
  "asset_count": 5265,
  "has_specs": true
}
```

#### spec 의 Gemini 프롬프트 반영
`generateCardVariants` 에서 `catInfo.spec.sample_names` 와 `catInfo.spec.common_tags` 를 프롬프트에 concat:
```
"<preset>, <style> style, <user prompt>,
 referenced variants: 싱글 침대, 더블 침대, 네추럴 드림 침대;
 tags: Bed_Single, Bed_Double, Cheap_Bed, Bed,
 product design concept, white background, ..."
```
이전(1.6.x 이하)의 하드코딩 `ASSET_SPECS` 는 10개 카테고리만 커버했지만 이제 208개 전 카테고리에 카탈로그 기반 힌트가 자동 적용.

#### AssetInfoEditor UI
카테고리 선택 시 `✦ <카테고리> 스펙` 배너 노출 — `asset_count`, `sample_names`, `common_tags`, `styles` 표시. 사용자는 어떤 정보가 Gemini 에 전달되는지 시각적으로 확인 가능.

---

## 4. 주요 기능

### 메인 그리드 (5 탭)
- **⭐ 위시리스트**: 제목만 입력해 카드 추가 → 상세에서 어셋 정보 점진 완성
- **✨ 시안 생성**: drafting 카드, Gemini 로 N개 병렬 생성 (1/2/4/8)
- **🗳️ 투표 및 선정**: drafting 중 designs 가 1개 이상인 "선정 대기" 카드
- **📑 컨셉시트 생성**: sheet 상태 카드
- **📋 완료 목록**: done 상태 카드 (잠김)

각 탭 공통 툴바: **뷰 토글(🔲/☰) · 카드 크기(0.5/1/2×) · 정렬(최신/이름) · 액션 버튼**.
선택은 모두 `localStorage` 저장.

### 카드 상세 모달 (1250×94vh)
- 제목 인라인 편집 (클릭 → input, Enter/blur 저장)
- 어셋 정보: 검색 가능한 카테고리 피커 + 🤖 자동 분류 버튼 + 스타일 + 프롬프트 + 참조 이미지 (Ctrl+V 붙여넣기 / 최대 4개)
- 상태별 액션 패널 (wishlist→drafting 이동, 시안 생성, 선정, 컨셉시트 생성)
- 시안 이력 그리드 (sheet/done 에서 읽기 전용)
- 댓글 + 활동 이력 (필터)
- 헤더 버튼: 🗑️ 삭제 / 🗄️ 아카이브 ↔ 📤 복구 / 🔓 재오픈 (확정 시)

### 이미지 lightbox
카드 상세에서 이미지 클릭 시 원본 해상도 full-screen, **← →** 키로 해당 카드의 모든 이미지(썸네일·참조·시안·컨셉시트) 순환. **ESC** 닫기.

### 시안 작업 큐 (우하단 플로팅)
실제 Gemini 호출이 진행 중일 때만 노출. 카드별 `done/total` + 프로그레스 바. 완료 시 자동 숨김.

### 상세 모달 카드 네비게이션
모달 열린 상태에서 **← →** 키로 현재 탭의 이전/다음 카드로 이동.

---

## 5. 운영 자동화

### 프로세스 관리
- **pm2 + pm2-windows-startup** — OS 부팅 시 자동 시작, 크래시 시 50회까지 재시작
- `ecosystem.config.cjs` 에 `exp_backoff_restart_delay: 3000`

### 스케줄된 작업 (Windows Task Scheduler, `install.ps1` 이 등록)
| 작업 | 주기 | 스크립트 |
|------|------|---------|
| auto-update | 5분 | `scripts/auto-update.ps1` — git pull + 변화 있을 때만 build + restart, 실패 시 이전 커밋으로 롤백 |
| health-check | 2분 | `scripts/health-check.ps1` — `/api/health` 4단계 복구 (ping → pm2 restart → cold start → forced rebuild) |
| 일일 백업 | 18:30 | SQLite + `data/snapshots/` + uploads |

### 수동 복구
- **`recover.bat`** — 원클릭 강제 복구: pm2 삭제 + git reset --hard origin/main + 재설치 + 재빌드 + pm2 재기동.
- 헬스 엔드포인트: `GET http://10.99.4.115:3000/api/health` → `{ok, version, time}`.

---

## 6. 배포

```bash
# 로컬에서 개발/빌드
npm run dev       # vite dev server
npm run build     # dist/ 생성

# 커밋 → push → 운영자 PC 는 5분 내 auto-update 로 반영
git add . && git commit -m "..." && git push origin main
```

`package.json` 의 `version` 과 `inzoi-concept-tool.jsx` 상단의 `APP_VERSION` 은 **항상 일치**. 이 둘을 같이 올리고 `CHANGELOG` 배열에 항목 추가.

---

## 7. 알려진 함정

| 함정 | 증상 | 대처 |
|------|------|------|
| **TDZ (Temporal Dead Zone)** | 빈 화면 | `useEffect` / `useCallback` 의 deps 배열이 같은 컴포넌트 본문 더 아래에서 선언된 `const` 를 참조할 때 발생. 관련 훅을 선언 이후로 옮긴다. 과거 1.4.4 / 1.5.8 에서 재발. |
| **legacy 싱크 루프** | 같은 카드 2개 (`wish-…` + `comp-wish-…`) | 1.5.7 에서 완료/위시리스트 싱크 effect 전부 제거. 새 기능 추가 시 legacy 테이블에 역복사 금지. |
| **ensureLegacyMigration** | DELETE 해도 폴링 후 카드 부활 | 서버 `DELETE /cards/:id` 에서 `wish-` / `comp-` 접두사 확인 후 legacy 행도 함께 삭제 (1.4.8). |
| **붙여넣기 가드 과잉** | input 포커스 시 이미지 Ctrl+V 차단 | 클립보드에 이미지가 있을 때만 `preventDefault`, 텍스트 붙여넣기는 기본 동작 유지 (1.6.3). |
| **Cover 우선순위** | ☆ 대표 눌러도 그리드 썸네일 안 바뀜 | `CardHubCard` / `CardListRow` 의 thumb 선택에 `selected?.imageUrl` 를 항상 최우선으로. 1.6.9 에서 수정. |

---

## 8. 주요 파일 지도

| 경로 | 역할 |
|------|------|
| `inzoi-concept-tool.jsx` | **단일 React 파일** — App, 모든 컴포넌트, 상태, 효과. ~6000줄+. 맨 위 `APP_VERSION` / `CHANGELOG` 가 사용자 노출되는 단일 기록. |
| `server.js` | Hono + better-sqlite3 서버. cards CRUD + object-meta 프록시 + upload. |
| `schema.sqlite.sql` | 스키마. 외래키 cascade 는 `ON DELETE CASCADE` 명시. |
| `scripts/install.ps1` | 운영자 PC 1-click 설치: Node/pm2 확인 → schedule task 등록 → pm2 start. |
| `scripts/auto-update.ps1` | 5분 주기 git pull + 빌드 + restart (+롤백). |
| `scripts/health-check.ps1` | 2분 주기 health 4단계 복구. |
| `ecosystem.config.cjs` | pm2 설정. |
| `recover.bat` | 원클릭 강제 복구. |
| `data/inzoi-concept.db` | SQLite DB (WAL 모드). |
| `data/images/` | 업로드된 이미지. |
| `data/snapshots/` | 카드 확정 시 JSON 백업. |

---

## 9. 개발 팁

- **단일 파일 React** 라서 Find in File (Ctrl+F) 가 대부분의 답. `function AssetInfoEditor`, `function CardHubCard` 로 바로 이동.
- **상태 추가 위치**: `const [...] = useState(...)` 는 `projectSlug` 선언(3060줄대) 이전과 이후가 구분되니 TDZ 주의.
- **로깅**: 서버는 `console.warn`, 클라이언트도 동일. pm2 logs 에서 조회.
- **DB 직접 조회** (진단용):
  ```bash
  node -e "const db = require('better-sqlite3')('data/inzoi-concept.db'); console.log(db.prepare('SELECT id, list_id, title FROM cards').all());"
  ```
