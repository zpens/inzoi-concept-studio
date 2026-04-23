# 추후 개선 항목 / Backlog

inZOI Asset Studio 에서 "지금은 OK, 나중에 필요하면 손대자" 로 미뤄둔 항목 모음.
새 아이디어는 아래 **# 대기 중** 에 추가하고, 진행 시작할 때 해당 항목을 옮기거나
상세화해서 세션에서 구현하세요.

---

## 🕑 대기 중

### [1] 에셋 카탈로그 데이터 반영 지연 단축 옵션

**현재 동작 (v1.8.x 기준):**

| 데이터 | 반영 지연 (최악) |
|--------|-----------------|
| 신규 카테고리 / 에셋 (catHier / objects.json 추가) | ~2시간 (서버 1h 캐시 + 클라이언트 1h 폴링) |
| 기존 에셋 필드 수정 (설명·태그·가격) | ~2시간 (동일) |
| 기존 id 의 아이콘 PNG 교체 | 최대 24시간 (브라우저 이미지 캐시) |
| 카탈로그 iframe 상세 (`:8080/#item=…`) | 즉시 (매번 라이브 로드) |

**즉시 반영 수단:**
- `GET /api/object-meta?force=1` → 서버 캐시 무효화
- 브라우저 `Ctrl + Shift + R` → 이미지 캐시 포함 전체 리로드

**개선 옵션 (필요 시):**

1. **서버 캐시 주기 단축** — `server.js` 의 `META_CACHE_TTL` 을 1h → 5min.
   트레이드오프: upstream(`:8080`) fetch 빈도 12배 증가, 여전히 ms 단위라 부담 거의 없음.
2. **클라이언트 폴링 주기 단축** — `inzoi-concept-tool.jsx` 의 object-meta useEffect
   `setInterval(load, 60*60*1000)` 을 `5*60*1000` 으로.
3. **아이콘 캐시 완화** — `/api/object-icon/:id` 의 `cache-control: public, max-age=86400`
   을 `no-cache` 또는 `max-age=60` 으로. 트레이드오프: 동일 아이콘 반복 로드 대역폭↑.
4. **웹소켓 / SSE 알림** — inzoiObjectList 쪽에서 파일 변경 감지해 concept-studio 에
   즉시 갱신 신호. 양쪽 수정 필요, 과투자일 가능성.

**결정 필요:** 현재 주기로 현업 불편 보고가 나오면 옵션 1+2 부터 적용. 아이콘 교체
주기가 짧다면 옵션 3.

---

### [2] 기존 제작 에셋 시각 유사도 기반 Top-N 추천 (Option C)

**현재:** 기존 제작 에셋 썸네일 그리드는 카테고리 내 **customize/unlockable 아닌 순**
으로 상위 8개 고정 노출. 현재 카드 이미지와의 실제 유사도는 반영 안 됨.

**목표:** 사용자가 만든 컨셉 이미지와 가장 비슷한 기존 에셋 top-5~8 추천.

**구현 스케치:**
1. 서버 측 일회성 job: `inzoiObjectList/data/objects.json` 5,265개 에셋 아이콘을 Gemini
   Vision 임베딩 (또는 CLIP 등) 으로 인덱싱 → `data/catalog_embeddings.json` 에 저장.
2. 카드의 참조이미지 또는 선정 시안을 같은 방식으로 임베딩.
3. 코사인 유사도 top-N 계산해 `spec.sample_thumbs` 대신 유사도 순으로 반환.
4. UI 에 "🎯 유사도 NN%" 배지 추가.

**고려할 점:**
- Gemini 가 공식 임베딩 API 를 제공하는지 확인 필요 (Gemini 3 는 아직 이미지
  임베딩 API 가 제한적). 대안: Vertex AI Vision API, 또는 PIL/OpenCV + pHash 기반
  경량 유사도.
- 5천 개 일회성 임베딩: Gemini 비용 약 ~$0.05/이미지 → 약 $250. 자주 쓸 기능이면
  합리적, 실험용이면 부담.
- 캐시 무효화: 카탈로그에 새 에셋 추가되면 해당 id 만 임베딩 추가.

**결정 필요:** 현재 카테고리 기반 랜덤 노출로 충분한지 수개월 운영 후 판단.

---

### [3] Gemini 프롬프트 후미 상수 카테고리별 분기

**현재 (`inzoi-concept-tool.jsx` generateCardVariants, ~line 1999):**
```
... product design concept, white background, studio lighting, high detail, game asset reference
```
모든 카테고리에 동일 suffix.

**문제:** 벽지 / 지붕 / 울타리 / 야외 장식 등 **건축·외관** 카테고리에는
"white background, studio lighting" 이 오히려 문맥 왜곡.

**개선안 — 카테고리 `group` 별 suffix 분기:**

| group | suffix 후보 |
|-------|------------|
| 가구 | `white background, studio lighting, high detail, game asset reference` (현행) |
| 건축 | `architectural rendering, neutral gray background, even ambient light, high detail, game asset reference` |
| 외관 / 야외공간 | `outdoor setting, natural daylight, neutral background, high detail, game asset reference` |
| 탑승물 | `3d product render, neutral gray background, studio light setup, high detail, game asset reference` |
| 기타 (소셜 이벤트 / 음식 / 음료) | `product photo, neutral background, soft lighting, high detail, game asset reference` |

**결정 필요:** 샘플 생성 품질 비교 후 적용.

---

### [4] 릴리즈 엔티티 (업데이트 일정) 정식화

**현재:** `card.data.target_update` 는 **자유 입력 문자열** (v1.7.4).
장점: 관리 UI 없이 바로 사용 가능. 단점: 오타가 별도 그룹, 예정일/상태 관리 불가.

**6개월 이상 운영하거나 릴리즈별 리포트가 필요해지면:**
- `releases` 테이블 (id, name, planned_date, status, notes) 추가
- cards 에 `release_id` FK
- 문자열 값 → 릴리즈 엔티티로 마이그레이션 스크립트 (unique 값 모아 생성)
- 릴리즈 CRUD 모달 + 달력 뷰
- 완료 탭 chip 바가 release 엔티티 기반이 되면 "예정일 지남" 경고 가능

**결정 필요:** 문자열로 버티다가 관리 요청 들어오면 승격.

---

### [5] 추가 메인 페이지 뷰 모드

**현재:** 🔲 카드 · ☰ 리스트 두 가지 (v1.6.5 / v1.7.7).

**제안되었으나 미구현:**
- **칸반 보드** — `wishlist → drafting → sheet → done` 컬럼, 드래그로 상태 이동.
  카드 라이프사이클과 궁합 좋음. 공수 중간.
- **인스펙터 (리스트 + 프리뷰)** — 좌측 좁은 리스트 / 우측 큰 프리뷰.
  검토·승인 작업에 최적. 모바일에서 불편.
- **타임라인** — 생성일 / 완료일 / `target_update` 기준 축 배치.
  업데이트 일정 필드와 궁합 좋음.
- **메이슨리 (Pinterest 식)** — 원본 비율 유지. 참조 이미지 수집 단계에 적합.
- **비교 뷰** — 2–4 카드 동시 표시, 선정 과정에서 유용.

**추천 순서:** 칸반 → 인스펙터 → 타임라인.

---

### [6] 컨셉시트 4뷰 생성 실패 뷰 재시도

**현재 (v1.8.0):** 4뷰 중 일부 실패 시 "실패" placeholder 표시, "재생성" 으로 **전부
다시** 생성.

**개선안:** 실패한 뷰만 선택해서 재시도 가능하게. 이미 성공한 뷰는 유지. Gemini
호출 비용 절약 (개당 $0.03).

---

## ✅ 완료 (참고용)

- TDZ 재발 체크리스트 (`ARCHITECTURE.md` §7) — v1.7.4 기점, 이미 4회 재발 방지 목적
- 카테고리/스타일 inzoiObjectList 연동 — v1.7.0+
- 카테고리 스펙 (objects.json 집계) — v1.7.1
- 자동 분류 (카테고리 + 스타일 + 크기 통합) — v1.7.6
- 크기 정보 카탈로그 자동 채움 + Gemini 추정 — v1.7.5 / v1.7.6
- 컨셉시트 Gemini 4뷰 생성 — v1.8.0
- 기존 제작 에셋 썸네일 + iframe 상세 모달 — v1.8.1 ~ v1.8.3

---

> **기록 방식 제안:** 새 항목은 `## 🕑 대기 중` 마지막에 번호 붙여 추가 (현재/개선안/결정
> 필요 3 섹션). 진행 시작하면 해당 섹션을 세션 프롬프트로 그대로 붙여넣으면 맥락
> 전달 끝.
