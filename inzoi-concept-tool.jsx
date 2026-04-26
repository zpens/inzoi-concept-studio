import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Version Info ───
const APP_VERSION = "1.10.97";
const CHANGELOG = [
  {
    version: "1.10.97",
    date: "2026-04-26",
    changes: [
      "[버그 수정] 참조 이미지를 ⭐ 대표로 지정해도 카드 썸네일이 안 바뀌던 문제 — CardHubCard / CardListRow / 상세 모달 좌측 대표이미지 모두 'designs.length === 1 이면 그 시안을 우선' 로직(v1.10.0) 때문에 사용자의 명시 설정이 무시됐음. 우선순위 뒤집어 card.thumbnail_url 이 최우선, 없을 때만 단일 시안 자동 fallback",
      "결과: 시안 1장 + 참조 1장 카드에서 참조를 ⭐ 대표로 지정 → 카드 그리드/리스트/상세 좌측에 그 참조 이미지 즉시 반영",
    ],
  },
  {
    version: "1.10.96",
    date: "2026-04-26",
    changes: [
      "어셋 정보 없을 때 시안 생성 자동 분류 선행 — DesignsPanel.doGenerate 가 prompt/description 모두 비어있고 이미지(ref 또는 thumbnail)만 있으면 classifyCategoryWithGemini + generatePromptFromImage 자동 실행 후 그 결과(category, style, posmap, size, prompt) 를 PATCH 저장하고 새 prompt 로 시안 생성. 사용자가 별도로 자동 분류 누를 필요 없음",
      "버튼 라벨이 단계별로 변경: '🎨 N개 생성' → '🤖 어셋 정보 자동 분류 중...' → '생성 중… (1/4)'",
      "이미지도 prompt 도 없으면 alert 메시지 갱신: '프롬프트, 설명, 또는 이미지가 필요합니다'",
    ],
  },
  {
    version: "1.10.95",
    date: "2026-04-26",
    changes: [
      "v1.10.94 의 자동 상세 오픈 롤백 — 위시 카드에서 시안 생성 후 모달이 자동으로 띄워지면 '진행중으로 넘어간 듯' 보여 사용자가 혼란. 다시 작업큐 ✓ 완료 표시 → 사용자 클릭으로 상세 열기 (v1.10.23 정책 복귀)",
      "[참고] 위시→진행 list_id 변경은 코드상 자동 이동이 없으며, 사용자가 명시적으로 'WishlistToDraftingAction → 시안 단계로 이동' 버튼 클릭 시에만 발생",
    ],
  },
  {
    version: "1.10.94",
    date: "2026-04-26",
    changes: [
      "시안 생성 완료 시 카드 상세 자동 오픈 — 작업큐에서 ✓ 완료 표시되면 동시에 해당 카드 상세 모달 자동 활성화. 단, 사용자가 다른 카드 모달을 열어 보고 있으면 방해하지 않음(현재 작업 우선). v1.10.23 의 완전 비활성화에서 '다른 모달이 안 열린 경우만 자동 오픈' 정책으로 완화",
    ],
  },
  {
    version: "1.10.93",
    date: "2026-04-26",
    changes: [
      "[버그 수정] 한글 프로필(예: 조영복) 사용 시 자동 분류 / 시안 생성 등 모든 AI 호출 실패 — fetch 가 'String contains non ISO-8859-1 code point' TypeError throw. HTTP 헤더는 ISO-8859-1 만 허용되는데 X-Actor-Name 에 한글 그대로 넣어서 발생",
      "수정: 클라이언트가 encodeURIComponent 로 인코딩 후 헤더 전송, 서버 프록시가 decodeURIComponent 로 복원. Gemini / Claude 두 경로 모두 적용",
    ],
  },
  {
    version: "1.10.92",
    date: "2026-04-26",
    changes: [
      "자동 분류 실패 진단 강화 — classifyCategoryWithGemini 의 모든 실패 경로(JSON 없음 / category_id 누락 / FURNITURE_CATEGORIES 미일치 / JSON 파싱 실패)에 console.warn 출력. 사용자 alert 도 사유별로 구분 (HTTP 에러 vs 응답 인식 실패). F12 콘솔 보면 정확한 원인 파악 가능",
    ],
  },
  {
    version: "1.10.91",
    date: "2026-04-26",
    changes: [
      "[버그 수정] API 사용량 로그가 actor=null(익명) 으로 누적되던 문제 — AI 프록시 헤더 헬퍼가 localStorage('inzoi_actor_name') 를 읽어 X-Actor-Name 으로 전달하는데, 프로필 선택 시 그 키가 갱신 안 됨(actorName 은 currentProfile.name 에서 파생되는 메모이제이션 값일 뿐). actorName 변경 시 localStorage 자동 동기 effect 추가. 새로고침 후 호출하면 그 사용자 사용량으로 정상 기록",
    ],
  },
  {
    version: "1.10.90",
    date: "2026-04-26",
    changes: [
      "API 사용량 패널 풀 개편 — 🏆 Top 5 사용자 leaderboard (메달 + 비율 막대), 프로필 드롭다운으로 다른 사용자 사용량 조회, 기간 토글(오늘/7일/30일/90일), 탭 뷰(🤖 모델별 / 📅 일자별 / 🕐 최근 호출)",
      "📅 일자별 — 막대 그래프로 일 단위 비용 시각화 (최대 90일)",
      "🤖 모델별 — 선택된 기간 범위로 자동 갱신 (이전엔 month 고정)",
      "Top 5 항목 클릭 → 해당 사용자 상세로 자동 전환",
      "GET /api/usage/daily?actor=&days= 신규 — 일별 시계열 집계",
    ],
  },
  {
    version: "1.10.89",
    date: "2026-04-26",
    changes: [
      "API 사용량 추적 (옵션 B 풀 구현) — 서버 프록시(/api/ai/gemini/* + /api/ai/claude/*)가 응답에서 토큰/이미지 수 추출 → 모델별 가격표 적용 → ai_usage_log 테이블에 INSERT. 헤더 X-Actor-Name 으로 프로필별 집계",
      "GET /api/usage?actor=<name> — 오늘/주(7일)/월(30일) 합계 + 엔드포인트·모델별 breakdown + 최근 30건. ?actor=* 로 전체 사용자 비교",
      "API 설정 모달에 📊 API 사용량 패널 — 3개 카드(오늘/주/월), 엔드포인트별 표, 최근 호출 details, 👥 전체 비교 토글",
      "가격표: Gemini 3 Flash Image $0.039/장, Gemini 1.5/2.5 Flash $0.075/$0.30 per 1M, Claude Sonnet $3/$15, Claude Opus $15/$75 — 추정 ±10%",
      "schema.sqlite.sql 에 ai_usage_log 테이블 + 인덱스 2개 추가 (actor+date / date)",
    ],
  },
  {
    version: "1.10.88",
    date: "2026-04-26",
    changes: [
      "[버그 수정] HTTP 환경에서 🔗 링크 복사 / 카드 🔗 공유 안 되던 문제 — navigator.clipboard 가 secure context (HTTPS / localhost) 에서만 동작. 사내망 http://10.99.4.115:8081 에서 차단됨. copyToClipboard 헬퍼로 통일: 1) navigator.clipboard 시도 2) 실패 시 hidden textarea + document.execCommand('copy') legacy 방식 fallback. 둘 다 실패하면 prompt 표시",
      "UpdateChipBar 의 태그 공유 + CardShareLink 의 카드 공유 모두 같은 헬퍼로 동작",
    ],
  },
  {
    version: "1.10.87",
    date: "2026-04-26",
    changes: [
      "[A 옵션] 태그별 공유 URL — UpdateChipBar 우측에 '🔗 링크 복사' 버튼 추가. 현재 URL + ?tag=... 쿼리로 선택된 업데이트 태그가 인코딩되어 클립보드에 복사. 외부 동료가 링크 클릭 → 같은 탭의 같은 태그 필터로 자동 진입",
      "selectedUpdates 변경 시 URL ?tag= 자동 갱신 (replaceState — history 오염 없음). 부팅 시 ?tag=... 읽어 초기 필터 채움. 브라우저 뒤로/앞으로 popstate 도 동기",
      "복수 태그는 콤마 구분: ?tag=0.7.0,0.8.0",
    ],
  },
  {
    version: "1.10.86",
    date: "2026-04-26",
    changes: [
      "메인페이지 헤더 컴팩트화 — 위시 / 진행 중 / 완료 탭 모두 동일 패턴으로 정리. 제목 fontSize 28→22, 카운트 텍스트(예: '52개') 가 제목 아래 별도 줄 → 제목 옆 인라인. 상단 padding 32→20, sticky 헤더 padding 4→2, 제목 영역 marginBottom 24→10. 전체 헤더 높이 약 60px 절약 → 카드 그리드가 더 위로 노출",
    ],
  },
  {
    version: "1.10.85",
    date: "2026-04-26",
    changes: [
      "단일 이미지 자동 대표 등록 — 카드에 이미지(시안 + 참조 합산)가 1개만 있고 thumbnail_url 미설정이면 자동으로 그것을 대표로 PATCH. 위시에서 시안 1개 생성 시 / 시안 삭제로 1개만 남았을 때도 자동 적용",
      "카테고리 계층 표시 — 리스트뷰에서 '게이트 · 외관' → '건축 / 외관 / 게이트' 처럼 상위 group / room / label 모두. inzoiObjectList catHier 의 lv1/lv2 구조 활용",
      "카테고리 정렬 키도 같은 계층 문자열 사용 → 같은 group(예: 건축) 끼리 자연스럽게 묶임",
    ],
  },
  {
    version: "1.10.84",
    date: "2026-04-26",
    changes: [
      "위시 단계에서도 시안 생성 가능 — DesignsPanel 의 생성 UI(추가 프롬프트 + N개 생성) 가 drafting 만이 아니라 위시 stage 에서도 노출. 카드를 시안 단계로 옮기지 않고도 바로 이미지 생성 시도 가능. 프롬프트는 card.data.prompt 또는 description/title fallback 사용",
      "WishlistToDraftingAction (→ 시안 단계로 이동 버튼) 은 그대로 유지 — 사용자가 명시적으로 단계 이동 원할 때 사용",
    ],
  },
  {
    version: "1.10.83",
    date: "2026-04-26",
    changes: [
      "스타일 필터 누락 보완 — 서버 /api/object-meta 의 styleMap 에 Bohemian/Country/Hanok/Tropical 추가. inzoiObjectList objTags 에는 있지만 매핑이 없어 클라이언트 필터에 안 나타나던 4개 스타일이 이제 노출됨 (보헤미안 / 컨트리 / 한옥 / 트로피컬)",
      "전체 스타일: 9개 → 13개. 자동 분류 / 카드 생성 / 카탈로그 매칭 모두 영향",
    ],
  },
  {
    version: "1.10.82",
    date: "2026-04-26",
    changes: [
      "[버그 수정] 카드 상세 모달의 시안 이미지가 5초마다 깜박이던 문제 — DesignsPanel 함수 안에 정의된 const Tile = (...) => {} 가 부모 폴링 setCards/setLists 시 새 reference 로 만들어져 React 가 컴포넌트 type 변경으로 인식 → Tile 인스턴스 unmount/remount → IMG element 도 함께 재생성 → 매 폴링마다 짧은 깜박임",
      "Tile → renderTile 함수로 변경하고 호출도 JSX 컴포넌트(<Tile ... />) 대신 직접 함수 호출(renderTile(d,i,h))로 전환. JSX 결과가 부모 트리에 그대로 mount 되어 IMG element 재사용",
      "outer div 에 key={i} 추가 (배열 매핑 호환)",
    ],
  },
  {
    version: "1.10.81",
    date: "2026-04-26",
    changes: [
      "[버그 수정] 생성 실패한 시안(imageUrl: null) 이 삭제 안 되던 문제 — Tile 의 🗑 버튼이 'd?.imageUrl &&' 가드로 숨겨지고 있었음. 가드 완화하고 raw.length 안쪽 idx 만 허용해 _sheet/_legacy 는 여전히 보호. 이제 '실패' placeholder 도 우측 하단 🗑 로 제거 가능",
    ],
  },
  {
    version: "1.10.80",
    date: "2026-04-26",
    changes: [
      "[버그 수정] 진행 중 탭에서 삭제 안 되던 '새 작업' placeholder 제거 — invariant useEffect 가 jobs.length>=1 유지하려 빈 legacy job 을 자동 생성하던 부작용. 데이터 없는 빈 job 은 그리드에서 숨김 (isBlankJob 필터). 데이터가 있는 legacy job 은 계속 표시",
      "+ 새 시안 버튼은 그대로 동작 (실제 카드를 drafting 으로 직접 생성)",
    ],
  },
  {
    version: "1.10.79",
    date: "2026-04-26",
    changes: [
      "카드 상세 모달 활동 이력 — 기본값을 접힘으로 변경 (이전엔 펼침). 헤더 클릭으로 펼치기 가능",
    ],
  },
  {
    version: "1.10.78",
    date: "2026-04-26",
    changes: [
      "카드 상세 모달 폭 1440 → 1600. 우측 프레임이 시안 그리드 1열(160px) 더 수용 — auto-fill minmax(160) 기준 4열 → 5열",
      "좌/우 비율 1:1 → 1:1.3 (좌 ≈ 696, 우 ≈ 904). 좌측은 기존 폭 유지, 우측만 확장",
      "[버그 수정] 카드 상태 이동 후 자동 탭 전환 — STATUS_TO_TAB 가 옛 tab id (create/sheet) 를 가리키고 있어 의미 없는 setActiveTab 호출. 통합 'progress' 로 매핑 정정",
    ],
  },
  {
    version: "1.10.77",
    date: "2026-04-26",
    changes: [
      "메인 콘텐츠 폭 1400 → 1600 (모든 main wrapper / sticky 헤더 / API 안내 동시 적용) — 와이드 모니터에서 카드 한 줄에 더 많이 노출",
      "헤더 좌측 tagline 'AI-Powered Furniture Asset Concept Generator' 제거 — 좌측 브랜딩 슬림화",
      "헤더 레이아웃 flex space-between → 3-column grid (1fr auto 1fr) — [위시][진행 중][완료] 탭이 좌/우 그룹 폭과 무관하게 화면 정중앙 고정",
      "헤더 좌우 padding 40 → 24 (탭 가운데 정렬과 균형 맞춤)",
    ],
  },
  {
    version: "1.10.76",
    date: "2026-04-26",
    changes: [
      "리스트뷰 컬럼 미세 조정 — 스타일 70 → 85 (스칸디나비안·인더스트리얼 등 6자 라벨 잘림 완화), 진행 92 → 78 (4자 + emoji 라벨 기준 충분)",
    ],
  },
  {
    version: "1.10.75",
    date: "2026-04-26",
    changes: [
      "리스트뷰 진행 컬럼 폭 130 → 92. 용어 단축('투표 및 선정' → '투표') 으로 모든 stage 라벨이 비슷한 길이가 되어 넓게 둘 필요 없어짐",
    ],
  },
  {
    version: "1.10.74",
    date: "2026-04-26",
    changes: [
      "용어 통일 — 위시 / 시안 / 투표 / 시트 / 완료 5단계 단일 어휘. 같은 단계가 곳곳에서 다른 이름(위시리스트=아이디어, 시안=시안 생성, 시트=컨셉시트)으로 불리던 혼란 정리",
      "STATUS_META 라벨: 위시리스트→위시, 시안 생성→시안, 컨셉시트→시트 (icon 도 ✨→🎨 통일)",
      "STAGE_OPTIONS 에 wishlist 엔트리 신규 + '🗳️ 투표 및 선정' → '🗳️ 투표' 단축",
      "탭 라벨: 위시리스트→위시, 완료 목록→완료 (icon 📋→✅)",
      "페이지 헤딩 / 버튼 / 모달 제목 일괄 정리: 'Completed → 완료', '⭐ 위시리스트 → ⭐ 위시', '＋ 새 아이디어 → ＋ 새 위시', 'WishlistToDraftingAction 헤더', 'DesignsPanel 컨셉시트 단계로 이동 → 시트 단계로 이동' 등",
      "단축키 치트시트 N 키 라벨도 '새 위시 추가'",
    ],
  },
  {
    version: "1.10.73",
    date: "2026-04-26",
    changes: [
      "[HOTFIX] v1.10.72 통합 후 화면 전체 blank 재발 — 두 번째 IIFE(상세 진행 UI 표시 조건)의 `ranges` 객체에 옛 키(create/vote/sheet)만 있어 activeTab='progress' 시 `const [min, max] = undefined` 로 TypeError 크래시. ranges 를 progress:[0,6] 로 갱신, 안전 가드 추가",
      "활동 → 자동 전환 메시지 / 완료 탭 새 시안 버튼 도 setActiveTab(\"create\") → setActiveTab(\"progress\") 로 통일",
    ],
  },
  {
    version: "1.10.72",
    date: "2026-04-26",
    changes: [
      "탭 통합 — 시안 생성 / 투표 및 선정 / 컨셉시트 생성 → '🚀 진행 중' 단일 탭. 3탭 → 2단계(드래프팅 + 시트) 카드를 한 화면에. 탭 5개 → 3개 (위시 / 진행 / 완료)",
      "정렬 옵션에 🎯 진행 단계순 추가 (정렬 시 자연스럽게 단계별 그룹으로 시각화)",
      "카드 그리드 좌상단에 stage badge — computeStage 기반으로 🎨 시안 / 🗳️ 투표 및 선정 / 📑 시트 / ✅ 완료 표시",
      "+ 새 시안 버튼이 진행 중 탭에서 항상 노출 (이전엔 시안 생성 탭에서만)",
      "단계별 카드 컴포넌트 분기는 카드의 _statusKey 로 자동 결정 (drafting → create 렌더, sheet → sheet 렌더)",
      "각 카드 모달에서 stage 자동 전환 시 더 이상 탭 이동 필요 없음 — 탭 한 곳에서 모든 진행 흐름 확인",
    ],
  },
  {
    version: "1.10.71",
    date: "2026-04-26",
    changes: [
      "[보안] API 키 서버 프록시화 — 키 자체가 클라이언트로 더 이상 전달되지 않음. /api/config 는 boolean(설정 유무) 만 응답. 모든 Gemini / Claude 호출은 /api/ai/gemini/* 와 /api/ai/claude/* 프록시를 거쳐 서버에서 키 부착",
      "프록시는 Google/Anthropic API 의 path/body 를 그대로 forward — 클라이언트 코드는 URL 만 변경, 응답 형식 동일",
      "개인 키 override 는 X-Personal-Gemini-Key / X-Personal-Claude-Key 헤더로 서버에 전달 (서버가 받아 그 키로 호출)",
      "변경: generateImageWithGemini / generatePromptFromImage / classifyCategoryWithGemini / estimateSizeWithGemini / listGeminiImageModels / Claude 메시지 호출 모두 프록시 경유",
      "이제 사내망 사용자가 /api/config 또는 devtools 에서 키를 직접 볼 수 없음",
    ],
  },
  {
    version: "1.10.70",
    date: "2026-04-26",
    changes: [
      "API 키 팀 공용 배포 — 운영 PC .env 의 GEMINI_API_KEY / CLAUDE_API_KEY 가 GET /api/config 로 클라이언트에 자동 전달. 새 사용자도 API 설정 입력 없이 바로 시작 가능",
      "우선순위: 개인 localStorage 키 > 서버 팀 기본값. API 설정 모달에 source 라벨(👤 개인 키 / 🏢 팀 기본값) 표시",
      "빈 입력 + 저장 = 개인 키 삭제 → 팀 기본값으로 복귀. placeholder 가 \"(비워두면 팀 기본값 사용)\"으로 동적 변경",
      "서버에 .env 자동 로더 내장 (dotenv 의존성 없이) — KEY=VALUE 단순 파싱. .env.example 샘플 추가",
      "사내망 한정 접근(10.99.4.115)을 전제로 한 1단계 보안 모델. 키 회전은 운영 PC .env 수정 + pm2 restart 만으로 즉시 반영",
    ],
  },
  {
    version: "1.10.69",
    date: "2026-04-26",
    changes: [
      "갤러리 캔버스(F) 시안 순서 변경 — 시안 타일 hover 시 좌측에 ◀/▶ 버튼 (designs ≥ 2 일 때만). 한 번 클릭으로 designs 배열 swap, selected_design 인덱스도 자동 동기",
      "레이아웃 모드 토글 — 🧱 justified(자유 배치) / ▦ 균등 그리드(360×360 고정) / ⏱ 타임라인(1열, 최신순). 상단 바 우측 셀렉트, localStorage 영속, 모드 변경 시 자동 refit",
      "타임라인은 item.meta.createdAt 으로 정렬 — AI 시안/시트 history 모두 시간 기준으로 한 줄에 배치, 최대 폭 70% 캡",
    ],
  },
  {
    version: "1.10.68",
    date: "2026-04-26",
    changes: [
      "포인트 코멘트 — lightbox 좌하단 🗨 코멘트 버튼 클릭 시 코멘트 모드 진입, 이미지 위 원하는 위치 클릭 → 입력 popover → 저장 시 마커가 그 위치에 고정",
      "마커는 이미지와 같은 transform 으로 줌·패닝에 따라 이동, counter-scale 로 시각 크기 일정 유지",
      "마커 hover 시 본문 / 작성자 / 시각 popover 표시. 본인 코멘트는 🗑 삭제 버튼",
      "스키마: card.data.point_comments[image_url] = [{ id, x, y, body, actor, createdAt }]. x/y 는 0~1 정규화 좌표라 해상도와 무관",
      "갤러리 타일 좌하단에 🗨 N 코멘트 수 badge 표시 (≥1 일 때만)",
      "Ctrl/⌘+Enter 로 빠른 저장, Esc 취소",
    ],
  },
  {
    version: "1.10.67",
    date: "2026-04-26",
    changes: [
      "갤러리 비교 모드(F → Ctrl-클릭 ≥ 2장 → 🔀 비교) 에 🪄 슬라이더 모드 추가 — Before/After 식 좌·우 이미지를 가운데 슬라이더로 swipe 비교. 같은 시드 다른 프롬프트 / 시안 vs 시트 변화 등 미세 차이 확인에 강력",
      "슬라이더 모드: 좌·우 이미지 셀렉트로 자유 선택, 핸들 드래그로 분할선 이동 (touchAction: none 으로 모바일 호환)",
      "기존 그리드 모드(📰)와 토글 — 2장 이상이면 토글 활성, 1장 비교는 그리드만",
      "CompareOverlay 컴포넌트로 추출 — GalleryCanvas 안에서 인라인이던 비교 UI 분리",
    ],
  },
  {
    version: "1.10.66",
    date: "2026-04-26",
    changes: [
      "갤러리 캔버스(F) 외부 이미지 드래그-드롭 → ref_images 자동 추가. 데스크탑 / 다른 브라우저 탭에서 이미지 드래그해 갤러리에 놓으면 업로드 후 참조 이미지에 추가, 다음 시안 생성에 자동 반영",
      "드래그 중 시각 오버레이 (점선 테두리 + 📥 안내). 업로드 중에는 ⏳ 진행 표시",
      "다중 파일 동시 드롭 지원. 중복 URL 은 무시",
      "기존 paste / + 이미지 추가 / lightbox 그리기 → 참조 저장과 같은 ref_images 흐름 공유",
    ],
  },
  {
    version: "1.10.65",
    date: "2026-04-26",
    changes: [
      "갤러리 캔버스(F) 다중 선택 + 비교 — Ctrl/Cmd-클릭으로 타일 선택(녹색 inset border + ✓ badge), 2장 이상이면 상단에 🔀 비교 버튼. 클릭 시 풀스크린 비교 그리드(2~4 columns 자동) — contain 으로 풀사이즈 유지, 각 이미지 클릭 시 lightbox 진입",
      "비교 모드 ESC 또는 ← 갤러리로 버튼으로 복귀. 선택 상태는 비교 종료 후에도 유지 (해제는 ✕ 해제 명시)",
      "일반 클릭은 그대로 lightbox, 모디파이어 키만 선택 토글 — 기존 워크플로 비파괴",
    ],
  },
  {
    version: "1.10.64",
    date: "2026-04-26",
    changes: [
      "갤러리 캔버스(F) 상단에 그룹별 표시 토글 chip — 🖼 참조 / 🎨 시안 / 📑 현재 시트 / 🗂 이전 시트 N. 클릭으로 해당 그룹 숨기기·표시. 시트 history 가 많을 때 시안만 보기 등 시각 정리 가능",
      "비활성 그룹 키는 카드별 localStorage 저장 (gallery_disabled_groups_<cardId>). 재방문 시 상태 유지",
      "그룹 토글 시 자동으로 fit-to-viewport 재실행 — 줄어든 콘텐츠가 화면에 가득",
    ],
  },
  {
    version: "1.10.63",
    date: "2026-04-26",
    changes: [
      "갤러리 캔버스(F) — 타일 클릭 시 ImageLightbox 진입 (줌/패닝/그리기 전체 기능). 갤러리 위에 스택되도록 zIndex 1100 적용",
      "타일 hover 우상단에 🎯 참조 버튼 (시안/시트 종류만) — 클릭 한 번으로 해당 이미지 URL 을 ref_images 에 추가, 다음 시안 생성에 자동 반영. 중복은 무시",
      "타일 좌클릭 = lightbox / 미들·우 드래그 = 패닝 / 좌 드래그(>4px) 도 클릭 무시. 기존 cover/copy-ref 버튼은 stopPropagation 으로 클릭 분리",
      "ImageLightbox 에 zIndex prop 추가 (default 300, 갤러리에서는 1100)",
    ],
  },
  {
    version: "1.10.62",
    date: "2026-04-26",
    changes: [
      "갤러리 캔버스(F) 타일 hover 시 메타 패널 표시 — 좌하단에 해상도 / 종류(AI 시안·업로드·시트·참조) / 모델 / seed / 생성 시각 / 투표 수. 카드 단일 데이터 소스만 사용, 추가 fetch 없음",
      "메타 패널은 줌과 무관하게 일정 크기 유지 (counter-scale: invScale 적용)",
      "groups useMemo 가 각 item 에 meta 객체 enrich (kind/seed/model/createdAt/votes/view)",
    ],
  },
  {
    version: "1.10.61",
    date: "2026-04-26",
    changes: [
      "[버그 수정] 갤러리 캔버스(F) 에서 이미지가 원본 해상도로 안 보이던 문제 — 셀 크기(약 460px)로 다운샘플 후 GPU 업스케일되어 줌인해도 흐림. 이제 IMG 를 자연 해상도(최대 2048px cap) 로 렌더하고 CSS transform 으로 셀에 fit → 줌인 시 원본 픽셀 노출",
      "aspects 상태가 {aspect, w, h} 객체로 확장 (이전 number 와 호환). LAYOUT 이 naturalImgW/H 를 GalleryTile 에 전달",
      "MAX_DIM 2048 cap — 4K+ 이미지 메모리 폭주 방지 (2K로 다운샘플하지만 기존 460 대비 4배 해상도)",
    ],
  },
  {
    version: "1.10.60",
    date: "2026-04-26",
    changes: [
      "이미지 lightbox 에 그리기 기능 — 좌하단 🖊 그리기 진입. 펜·지우개·되돌리기·전체 비우기·색상 4종(빨강/노랑/파랑/흰색). 그림은 이미지 자연 해상도 캔버스에 직접 그려져 품질 보존",
      "💾 참조 저장 + 닫기 — 원본 이미지 + 그림을 합성해 PNG 로 업로드 → card.data.ref_images 끝에 추가. 다음 시안 생성 시 자동 반영 (v1.10.58 의 cover prepend + ref_images 로직과 자연 연동)",
      "draw 모드에서는 줌/패닝 일시 비활성, 캔버스가 pointer 이벤트 가져감. 이미지 ←/→ 이동 시 자동으로 view 모드 복귀 + history 리셋",
      "지우개는 destination-out 합성 모드 — 원본은 보존하면서 그림만 부분 삭제",
    ],
  },
  {
    version: "1.10.59",
    date: "2026-04-26",
    changes: [
      "이미지 lightbox 줌/패닝 지원 — 시안/참조/시트 이미지 클릭 시 GalleryCanvas 와 동일한 인터랙션. 휠로 커서 기준 줌(0.05~20×), 좌/휠/우 드래그 패닝, 0 키로 화면 맞춤, ←/→ 로 갤러리 이동, ESC 닫기",
      "ImageLightbox 컴포넌트로 추출 — 기존 인라인 로직 정리, viewRef + DOM transform 패턴(React 리렌더 회피) 재사용",
      "좌하단에 ⛶ 맞춤 + 🔍 N% 컨트롤. 우상단 닫기/저장 버튼은 기존대로",
    ],
  },
  {
    version: "1.10.58",
    date: "2026-04-26",
    changes: [
      "[#18] 시안 추가 생성 시 대표이미지를 항상 참조 1순위로 prepend — generateCardVariants 가 ref_images 와 무관하게 thumbnail_url 을 맨 앞에 추가 (중복 제거). 이전엔 ref 가 있으면 대표가 무시됐지만 이제 '대표 기준 보강' 의도가 일관 동작",
      "추가 프롬프트 자동 복원 — generateCardVariants 가 last_extra_prompt 를 같은 PATCH 에 저장해 race 회피, 다음 회차에 카드별로 자동 입력. 빈 값이면 클리어",
      "DesignsPanel 정렬 (생성순/최신순/투표순) — 헤더에 셀렉트 추가, sortedRenderOrder 가 원본 idx 보존해 voteCount/selectDesign/removeDesign 정상 동작",
      "drafting 단계 ☆ 선정 동작 분리 — 이전엔 선정 = 대표 + sheet 자동 이동 묶음. 이제 ☆ 선정 = 대표만 변경, 별도 패널 하단 '✨ 선정 시안 으로 컨셉시트 단계로 이동 →' 버튼 신설. 의도 명확",
      "카드 복제 (📋) — 상세 모달 헤더에 신설. 어셋 정보·프롬프트·참조 이미지·last_extra_prompt 가져오고 시안/시트/투표는 비워서 drafting 으로 새 카드 생성",
      "CardActionPanel dead-code 정리 — drafting 분기 흡수 후 남은 count/extraPrompt/doGenerate/selectDesign/setCoverDesign/removeDesign 제거 (~80줄 감소)",
      "DesignsPanel 생성 행 flexWrap + 버튼 whiteSpace 처리 — 좁은 폭에서 버튼 찌그러짐 방지",
    ],
  },
  {
    version: "1.10.57",
    date: "2026-04-26",
    changes: [
      "시안 생성 / 시안 이력 패널 통합 — drafting 단계에서 같은 썸네일 그리드가 두 번(시안 생성 패널 + 시안 이력 패널) 렌더되던 시각 중복 제거. DesignsPanel 한 곳에서 생성·표시·선정·삭제·투표 일원화",
      "DesignsPanel 헤더에 추가 프롬프트 + [1][2][4] + 🎨 N개 생성 컨트롤 노출 (drafting 일 때만)",
      "Tile 에 🗑 삭제 버튼 추가 (우측 하단). _sheet/_legacy 시안은 보호",
      "DesignsPanel.selectDesign 가 drafting 단계에서는 컨셉시트로 자동 이동 (구 CardActionPanel.selectDesign 동작 보존)",
      "타이틀 '🎨 시안 이력' → '🎨 시안' 으로 단순화. CardActionPanel 의 drafting 분기는 null 반환",
    ],
  },
  {
    version: "1.10.56",
    date: "2026-04-26",
    changes: [
      "유사 에셋 / 기존 제작 에셋 그리드에서 중복 아이콘 제거 — 같은 에셋이 여러 inZOI 카테고리에 복사 등록된 경우(같은 icon 파일이 여러 id 로 노출) 가장 점수 높은 한 건만 표시",
      "findSimilarCatalogAssets 가 score 정렬 후 icon → name → id 순 키로 dedup. fallback(spec.sample_thumbs) 경로도 동일 정책 적용",
      "결과: 12개 슬롯이 실제 서로 다른 에셋 12개로 채워짐 (이전엔 중복 때문에 의미 있는 후보가 6~8개로 줄던 케이스)",
    ],
  },
  {
    version: "1.10.55",
    date: "2026-04-26",
    changes: [
      "[버그 수정] 활동 이력 / 댓글 / 카드 날짜 표시가 KST(+9) 보다 9시간 늦게 보이던 문제 — SQLite datetime('now') 가 UTC 'YYYY-MM-DD HH:MM:SS' (Z 없음) 로 저장되는데 프런트가 단순 slice 로 잘라 그대로 표시했음. 명시적 UTC 파싱 → 로컬 변환 헬퍼 formatLocalTime 도입",
      "적용 위치: 활동 이력 (MM-DD HH:MM), 댓글 (YYYY-MM-DD HH:MM), 리스트 뷰 날짜, 카드 그리드 완료/생성일, 시트 history generated_at, 갤러리 시트 그룹 타이틀, 아카이브 updated_at",
      "기존 ISO 'Z' 또는 timezone 이 있는 값은 그대로, 없으면 UTC 로 간주하는 휴리스틱 — 두 형식 모두 안전",
    ],
  },
  {
    version: "1.10.54",
    date: "2026-04-23",
    changes: [
      "메인뷰 좌/우 끝 통일 — 시안 생성/투표/시트/완료/위시 sticky 헤더의 marginLeft:-40, marginRight:-40, paddingLeft:40, paddingRight:40 제거. 이전엔 헤더 배경이 maxWidth 1400 까지 확장되어 1320 폭의 카드와 좌우가 어긋나 보였음. 이제 헤더·태그 chip·리스트 헤더·카드 모두 동일한 1320 inner 콘텐츠 영역에 정렬",
      "리스트 뷰 컬럼 폭 재조정 — 우선순위 70→56, 업데이트 90→120 (긴 태그 ellipsis 110), 카테고리 150→140, 스타일 80→70, 크기 130→115, 상태 95→70, 진행 110→130 (🗳️ 투표 및 선정 등 긴 라벨 수용), 날짜 100→92. 빈 공간/잘림 양쪽 균형 맞춤",
      "갤러리 캔버스 (F) — 같은 URL 이미지를 여러 그룹(대표/시안/시트)에 중복 표시하지 않도록 dedup. 대표가 시안이기도 하면 첫 그룹(대표)에서만 보임",
      "갤러리 캔버스 초기 fit-to-viewport — 작은 콘텐츠도 화면 가득 채우도록 fitScale cap(1) 제거. 이미지 적은 카드도 첫 진입 시 크게 표시",
    ],
  },
  {
    version: "1.10.53",
    date: "2026-04-25",
    changes: [
      "API 상태 안내 문구가 Claude API 키 설정 여부를 반영 — Gemini + Claude 둘 다 등록되어 있으면 'Gemini + Claude 모두 연결됨 — 프롬프트 자동 최적화 활성' 표시. 이전엔 Gemini 만 보고 'Claude 추가하면…' 항상 안내해 혼란",
    ],
  },
  {
    version: "1.10.52",
    date: "2026-04-25",
    changes: [
      "업데이트 태그 삭제 지원 — chip 바 ✏️ 인라인 편집에서 이름을 빈 값으로 저장하면 '태그 전역 삭제' 확인창 → 해당 태그 붙은 모든 카드를 미지정으로 일괄 변경. 별도 UI 버튼 없이 기존 편집 흐름 확장",
      "renameUpdateTag 가 null 입력 시 selectedUpdates 에 새 값 추가 안하도록 수정 — 삭제 후 필터 정리",
    ],
  },
  {
    version: "1.10.51",
    date: "2026-04-25",
    changes: [
      "시안 이력 섹션에 이미지 붙여넣기 지원 — 헤더에 '📋 붙여넣기' 버튼 (navigator.clipboard.read) + 패널 내부 hover/focus 중에만 Ctrl+V 로 직접 붙여넣기",
      "ingestImage 공용 함수로 File 파일 선택 / Clipboard API / Ctrl+V 세 경로 통합",
      "PromptRefEditor 의 참조 이미지 paste 와 충돌 방지 — capture 모드 + stopImmediatePropagation 으로 패널이 활성 상태일 때만 DesignsPanel 이 가로챔",
      "패널 활성 상태일 땐 테두리가 primary 색으로 바뀌고 '📋 Ctrl+V 로 붙여넣기 가능' 안내 문구 노출",
    ],
  },
  {
    version: "1.10.50",
    date: "2026-04-25",
    changes: [
      "[버그 수정] 자동 분류 실행해도 카테고리·스타일이 이미 값이 있으면 덮어쓰지 않던 문제 — 버튼 클릭 = 재분석 의도로 해석해 category/style_preset/posmap_features/catalog_matches 는 항상 새 결과로 덮어씀. 크기 수동 입력과 기존 프롬프트는 존중",
      "자동 분류 버튼 위치 이동 — 카테고리 필드 라벨 옆 → '📝 어셋 정보' 헤더 라인 우측으로. 카테고리 필드 라벨은 텍스트만 남김",
      "자동 분류 기준은 card.data.ref_images[0] || card.thumbnail_url. 대표이미지 교체 후 다시 '🤖 자동 분류' 누르면 새 이미지 기준으로 분석·덮어쓰기",
    ],
  },
  {
    version: "1.10.49",
    date: "2026-04-25",
    changes: [
      "리스트 뷰 업데이트 태그 팝오버 간소화 — 우선순위처럼 기존 태그 목록 중 선택만. 새 태그 입력 / 저장 버튼 제거. 등록된 태그 없으면 상세 모달 안내 표시",
      "리스트 뷰 제목 클릭 동작 변경 — ✏️ hover 버튼 제거하고 제목 텍스트 자체 클릭으로 바로 인라인 input 전환. 썸네일 / 설명 / 다른 셀 클릭은 기존대로 상세 모달 오픈",
      "제목 hover 시 연한 배경 + cursor: text 로 편집 가능 표시",
    ],
  },
  {
    version: "1.10.48",
    date: "2026-04-25",
    changes: [
      "리스트 뷰에도 카드 크기(0.5× / 1× / 2×) 토글 적용 — 이전엔 카드 뷰에서만 보였는데 항상 표시",
      "스케일 대상: 썸네일(90×90 기본 → 45/90/180) + 행 수직 padding(15px 기본 → 7.5/15/30). 텍스트 셀은 고정 너비 유지해 가독성 보존",
      "CardListHeader / CardListRow 모두 getListGrid(scale) 로 동적 grid 생성, 썸네일 컬럼만 scale 적용",
    ],
  },
  {
    version: "1.10.47",
    date: "2026-04-25",
    changes: [
      "[버그 수정] 리스트 뷰 팝오버 피커가 아래 행 뒤에 가려지던 문제 — row 가 position: relative 라 자체 stacking context 에 갇혀 z-index: 50 팝오버가 다음 row 위로 못 올라감. editing 상태일 때 해당 row 전체 zIndex 를 100 으로 올려 다른 row 위로 뜨게 수정",
    ],
  },
  {
    version: "1.10.46",
    date: "2026-04-25",
    changes: [
      "[버그 수정] 상세 모달의 업데이트 일정이 이미 채워져 있으면 수정 불편하던 문제 — 기존 <input list=…> datalist UX 에서 리스트 뷰와 같은 팝오버 피커로 교체. 기입된 값이든 빈 값이든 항상 클릭으로 기존 태그 pill 선택 또는 새 태그 입력 가능",
      "잠긴(완료) 카드는 여전히 수정 불가, 비워서 '미지정'으로 되돌리는 전용 버튼 제공",
    ],
  },
  {
    version: "1.10.45",
    date: "2026-04-25",
    changes: [
      "리스트 뷰 제목 셀 인라인 편집 — 행 hover 시 우측 ✏️ 아이콘, 클릭하면 input 전환 / Enter 저장 / Esc 취소 / blur 자동 저장",
      "업데이트 태그 셀 = 팝오버 피커로 전환 — 기존 태그들을 pill 로 나열해서 클릭 즉시 적용, 하단에 '새 태그 / 직접 입력' 박스 분리. 기존 태그 많아도 스크롤 (max 320)",
      "[버그 수정] 리스트 뷰 팝오버가 다른 행 팝오버를 열어도 안 닫히던 문제 — 외부 클릭 감지를 'data-inline-edit attribute 기준' → 'row ref 기준'으로 변경해 행 경계로 닫힘",
      "팝오버 z-index 30 → 50, background #fff 로 불투명 보장 → 뒤 내용 겹쳐보이는 현상 수정",
      "진행 컬럼 정렬 가능 — 헤더 클릭 시 stage 기준 정렬 (wishlist<drafting<voting<sheet<done)",
      "enrichedCards useMemo 도입 — cards 에 _statusKey 를 일괄 주입해 stage 정렬/렌더에서 재사용",
    ],
  },
  {
    version: "1.10.44",
    date: "2026-04-25",
    changes: [
      "리스트 뷰 인라인 편집 — 우선순위 / 업데이트 태그 셀 클릭 시 해당 셀 아래 팝업 열려 바로 수정 가능. 저장은 즉시 PATCH, 외부 클릭/Esc 로 닫힘",
      "리스트 뷰에 [진행] 컬럼 추가 (상태 ↔ 생성일 사이) — 🎨 시안 / 🗳️ 투표 및 선정 / 📑 시트 / ✅ 완료 중 선택해서 바로 상태 변경. 완료 선택 시 confirmed_at 자동 세팅, 되돌릴 땐 해제",
      "LIST_GRID 10→11 컬럼 (110px 진행 컬럼 신규)",
      "컬럼 헤더에 '진행' 라벨 추가",
      "card._statusKey 힌트를 부모에서 주입해 computeStage(drafting 내부에서 시안/투표 designs.length 기준 구분) 동작",
    ],
  },
  {
    version: "1.10.43",
    date: "2026-04-24",
    changes: [
      "[버그 수정] 새 아이디어 추가 창에서 Ctrl+V 이미지 붙여넣기가 안되던 문제 — paste 리스너가 '위시 탭일 때만' 등록되고 있어 N 단축키 / 다른 탭에서 모달 오픈 시 작동 안함. 조건을 'wishAddOpen && !detailCard' 로 변경해 모달 열림 상태 기준으로 동작",
    ],
  },
  {
    version: "1.10.42",
    date: "2026-04-24",
    changes: [
      "자동 분류 개편 — 제안/적용 확인 단계 없이 결과를 바로 저장. 카테고리 / 스타일 / 크기 / posmap features / 카탈로그 매칭 top-12 에 더해 프롬프트 초안도 한 번에 채움 (이미 값이 있는 필드는 건드리지 않음)",
      "AI 자동 준비 + 이동 버튼 (v1.10.40) 제거 — 자동 분류가 프롬프트까지 커버하므로 중복. WishlistToDraftingAction 은 원래의 단일 이동 버튼으로 복귀",
      "classifyCategoryWithGemini + generatePromptFromImage 을 Promise.allSettled 로 병렬 호출해 한 번에 처리",
    ],
  },
  {
    version: "1.10.41",
    date: "2026-04-24",
    changes: [
      "👍 시안 투표 (단독 재투입) — 각 시안 타일 좌하단에 👍 버튼 + 카운트. 프로필 기반 (card.data.cardVotes = { [designIdx]: { [profileName]: true } }), 토글 방식, 본인 투표는 primary 색",
      "1등 시안은 🏆 배지 + 초록 테두리, 헤더에 '🏆 투표 1등 선정 (N표)' 버튼 — 클릭 시 selected_design + 썸네일 자동 갱신",
      "hover 시 투표자 이름 tooltip (voters.join(', '))",
      "(legacy job.data.votes 와 이름 충돌 방지 위해 cardVotes 로 분리)",
    ],
  },
  {
    version: "1.10.40",
    date: "2026-04-24",
    changes: [
      "🤖 위시 → 시안 자동 준비 (단독 재투입) — 위시 카드 상세에 'AI 자동 준비 + 이동' 버튼. Gemini 로 카테고리/스타일/크기 자동 분류 + 이미지 기반 프롬프트 초안 2~4문장 생성 → 서버 저장 → 드래프트 상태로 자동 이동",
      "generatePromptFromImage 함수 신규 — 이미지 + 제목으로 한글 프롬프트 초안 생성 (Gemini 2.5 Flash Vision)",
      "참조 이미지 없으면 Gemini 호출 스킵하고 제목만으로 드래프트 이동 가능",
    ],
  },
  {
    version: "1.10.39",
    date: "2026-04-24",
    changes: [
      "[HOTFIX] 카드 상세에서 '카탈로그 매칭 기준' 렌더 시 catalog_matches 없고 posmap_features 만 있는 새 카드가 crash 하던 문제 — cm.features → cm?.features 옵셔널 체이닝. '보안문' 같은 AI 자동분류 직후 아직 카탈로그 top-12 저장되지 않은 카드에서 detail modal blank 재현",
    ],
  },
  {
    version: "1.10.38",
    date: "2026-04-24",
    changes: [
      "⌨️ 단축키 치트시트 (단독 재투입) — ? 키로 오버레이 열기/닫기, Esc 도 닫힘. 전역 / 상세 / 갤러리 / 편집 / Lightbox 그룹별 정리",
      "(v1.10.37 에 3개 기능 한번에 넣었다 blank-screen 재발해 revert, 기능별 분리 재투입)",
    ],
  },
  {
    version: "1.10.36",
    date: "2026-04-24",
    changes: [
      "추가 프롬프트 결합 방식 강화 — '기존 — 추가' em dash 대신 '기존. Additionally apply: 추가' 영문 접속어로 Gemini 가 뒤 문장을 override 가 아닌 '덧붙임' 으로 해석하게 유도",
      "추가 프롬프트 입력 아래에 최종 프롬프트 실시간 프리뷰 추가 — '→ 최종: {기존}. Additionally apply: {추가}' 로 점선 박스에 회색 표기",
    ],
  },
  {
    version: "1.10.35",
    date: "2026-04-24",
    changes: [
      "한 번에 생성 개수 옵션 1 / 2 / 4 만 제공 (8 제거) — UI 선택지 + generateCardVariants 의 클라이언트 안전장치(Math.min) 도 4 로 통일",
    ],
  },
  {
    version: "1.10.34",
    date: "2026-04-24",
    changes: [
      "갤러리 레이아웃을 Justified Grid (Google Photos / Flickr 식) 로 변경 — 각 행의 이미지 너비를 자동 조정해 행 폭이 CONTAINER_W(2800px) 를 꽉 채움, 행 높이 통일 (기본 460)",
      "서로 다른 원본 비율 이미지들이 한 화면에 더 크고 효율적으로 배치 — 빈 공간 최소화, 세로 스택 제거",
      "img aspect ratio 는 onLoad 에서 자동 수집(naturalWidth/naturalHeight) → useMemo 로 행 packing 재계산",
      "각 타일은 justified 셀(width/height) + object-fit: cover 로 채움 — 셀 비율이 이미 이미지 aspect 와 같아 crop 되지 않음",
      "fit-to-viewport 가 justified 전체 박스를 뷰포트에 맞춤 → 초기 오픈 시 한눈에 다 보임",
    ],
  },
  {
    version: "1.10.33",
    date: "2026-04-24",
    changes: [
      "[버그] 갤러리 이미지가 원본 해상도로 안 나오던 문제 — v1.10.32 의 height: 480 CSS 가 GPU 레이어를 480px 로 다운샘플 스냅샷 → 줌인 시 블러. 제거하고 img 는 natural size (max 1280px) 로 렌더 → GPU 텍스처 = 소스 해상도",
      "갤러리 레이아웃 — 그룹 세로 스택 제거. 모든 이미지를 단일 flex-wrap 그리드로 평탄화, maxWidth 3200px 안에서 자연스럽게 줄바꿈 → 한 화면에 더 많이 표시",
      "그룹 라벨은 각 타일 좌상단 배지로만 구분 (🎨 시안 #N / 📑 front / 📤 업로드 등). 별도 그룹 헤더 삭제",
      "fit-to-viewport 가 이 wrap 그리드 기준으로 재계산 — 가로로 꽉 차면 세로로 쌓이고, 전체 박스가 뷰포트에 맞춤",
    ],
  },
  {
    version: "1.10.32",
    date: "2026-04-24",
    changes: [
      "갤러리 타일 — 테두리/그림자 제거하고 이미지만 gap 0 으로 붙여 packing",
      "타일 고정 크기 정사각(260 object-fit contain) → height 480 + width auto 로 원본 비율 그대로. 줌인 시 소스 해상도 사용해 덜 깨짐",
      "갤러리 오픈 시 자동 fit-to-viewport — 콘텐츠 전체가 화면에 꽉 차게 scale 자동 계산 (마운트 후 120ms + 500ms + 모든 이미지 load 시점)",
      "전체 보기 버튼(⊡) 과 '1:1 원본 크기' 버튼 분리. 0 키 = 전체 보기 (이전엔 scale=1 리셋)",
      "각 그룹 헤더도 scale 역수로 counter-scale 해서 항상 읽히는 크기 유지",
    ],
  },
  {
    version: "1.10.31",
    date: "2026-04-24",
    changes: [
      "갤러리 ⭐ 선정 버튼 제거 — 대표 지정(⭐/☆)만 유지. 시안 선정은 DesignsPanel 에서 계속 가능",
      "줌 한계 6x → 20x — 원본 이미지 더 크게 확대 가능",
      "아이콘(⭐ 대표, label 배지) 이 캔버스 scale 의 역수로 counter-scale → 줌인해도 비례로 작아져 이미지를 가리지 않음",
      "[성능] 팬/줌 리렌더 최소화 — x/y 를 React state 에서 ref 로 빼 직접 DOM transform 업데이트, setState 는 scale 변경 시에만. translate3d + will-change: transform 으로 GPU 레이어 승격",
    ],
  },
  {
    version: "1.10.30",
    date: "2026-04-24",
    changes: [
      "상세 모달 헤더 제목 앞 상태 아이콘(meta.icon, 예: ⭐ ✨ 📑 ✅) 제거 — 카드 뷰 / 리스트 뷰에서 v1.10.15 에 이미 제거된 것과 일관",
    ],
  },
  {
    version: "1.10.29",
    date: "2026-04-24",
    changes: [
      "상세 모달 Esc 로 닫기 지원 — 단, 갤러리(F) / 미리보기 lightbox / 카탈로그 iframe 모달이 열려있으면 그쪽이 먼저 닫힘 (각자 자체 Esc 핸들러 유지)",
      "입력창(input/textarea/select/contenteditable) 포커스 중엔 동작 안 함 — 평소 입력 방해 없음",
    ],
  },
  {
    version: "1.10.28",
    date: "2026-04-24",
    changes: [
      "갤러리 팬 제스처 변경 — 좌클릭 드래그 대신 '가운데 버튼' 또는 '우클릭' 누른 채 드래그",
      "좌클릭은 타일 내부 버튼(⭐/☆, 선정) 클릭용으로 예약되어 의도치 않은 팬 방지",
      "우클릭 팬 중 브라우저 컨텍스트 메뉴는 onContextMenu preventDefault 로 차단",
      "상단 안내 문구도 '가운데/우클릭 드래그 팬' 으로 수정",
    ],
  },
  {
    version: "1.10.27",
    date: "2026-04-24",
    changes: [
      "갤러리 캔버스 — hover 시 떠있던 그라데이션 오버레이 제거. 이미지 줌인 시야를 가리지 않음",
      "대표 지정은 타일 우측 상단 고정 ⭐/☆ 원형 아이콘 클릭 — 현재 대표는 초록 ⭐, 아니면 검정 ☆",
      "시안 선정 버튼도 우측 상단 대표 아이콘 바로 아래 작은 pill 로 배치 (design 타입만)",
      "↗ 원본 링크는 제거 — 캔버스 자체가 팬/줌 으로 원본 탐색 가능",
    ],
  },
  {
    version: "1.10.26",
    date: "2026-04-24",
    changes: [
      "🖼 갤러리 캔버스 — 상세 모달 열고 F 키 (또는 헤더 🖼 버튼) 로 전체 화면 전환. 카드의 모든 이미지를 그룹별(대표/참조 · 시안 · 현재 시트 · 이전 시트)로 한 화면에 배치",
      "팬 / 줌 / 키보드 조작: 휠=커서 기준 줌 · 드래그=팬 · 0=초기화 · ±=줌 · 방향키=팬 · Esc/F=닫기",
      "각 이미지 호버 시 ☆ 대표 (카드 썸네일 지정) / ⭐ 선정 (시안 한정, selected_design + 썸네일 갱신) / ↗ 원본 열기 버튼",
      "선정된 시안은 노란 테두리 + ⭐ 선정 배지, 현재 대표는 초록 테두리",
      "외부 의존성 없음 — CSS translate+scale 로 구현",
      "단축키 추가 — N: 어디서나 새 아이디어 추가 모달 오픈",
    ],
  },
  {
    version: "1.10.25",
    date: "2026-04-24",
    changes: [
      "시안 생성 패널에 '추가 프롬프트' 한 줄 입력 — 저장된 기본 프롬프트는 그대로 두고 이번 회차에만 '기본 — 추가지시' 형태로 뒤에 붙여 Gemini 호출",
      "예: 기존 프롬프트 유지 + '더 단순하게', '파스텔 톤', '다리 없애기' 같은 변형 지시",
      "Enter 로 바로 생성, 생성 중엔 비활성화. 값은 저장 안되고 모달 닫으면 초기화",
    ],
  },
  {
    version: "1.10.24",
    date: "2026-04-24",
    changes: [
      "카드 상세 딥링크 — 각 카드에 고유 URL /p/<slug>/cards/<cardId> 부여",
      "상세 모달 열 때 자동으로 pushState, 닫으면 /p/<slug> 로 복귀, 뒤로/앞으로 브라우저 버튼(popstate) 지원",
      "최초 로드 시 URL 에 cardId 있으면 자동으로 해당 카드 상세 오픈 — 공유 링크 바로 접근 가능",
      "상세 모달 제목 옆에 작은 🔗 링크 버튼 — 클릭 시 클립보드 복사, 1.5 초간 '복사됨' 표시 (clipboard API 차단 시 prompt fallback)",
    ],
  },
  {
    version: "1.10.23",
    date: "2026-04-24",
    changes: [
      "생성 완료 시 상세 페이지 자동 오픈 중단 — 사용자가 도중 모달을 닫았다면 작업큐에 '✓ 완료' 알림만 뜸. 클릭 시에 상세 오픈",
      "CardActionPanel onRefresh 가 setDetailCard((prev) => prev?.id === d.id ? d : prev) 로 변경 — 열려있는 카드만 갱신",
      "작업큐에 완료 상태 디자인 추가 — 초록 배경 / '✓ 완료 · 클릭해서 열기' / ✕ 버튼으로 알림 닫기 가능",
      "작업큐 타이틀도 '생성 중' → '작업 큐' 로 일반화, 전체 완료 시 아이콘 ✅",
    ],
  },
  {
    version: "1.10.22",
    date: "2026-04-24",
    changes: [
      "시안 이력 패널 대개편 — DesignsPanel 컴포넌트로 추출 + 3가지 보기 모드",
      "  · 🔲 그리드 (기본, 자동 맞춤 4~6열)",
      "  · ⬛⬛ 나란히 (2열, 280px 높이 — 시안 2개 비교)",
      "  · 🖼 하나씩 (420px, 좌우 ‹ › 버튼 + 하단 페이지 닷 네비)",
      "각 시안 타일에 ☆ 선정 버튼 추가 — 클릭 시 card.data.selected_design + card.thumbnail_url 자동 갱신",
      "선정된 시안은 ⭐ 선정 배지 (노란 테두리), image objectFit: cover → contain 으로 비율 온전히 표시",
      "빈 상태 안내 개선",
    ],
  },
  {
    version: "1.10.21",
    date: "2026-04-24",
    changes: [
      "시안 이력에 외부 이미지 수동 추가 — 섹션 헤더 우측 '＋ 이미지 추가' 버튼, 파일 선택 시 /api/upload 거쳐 card.data.designs 끝에 추가 (source: 'upload' 태그)",
      "업로드된 시안은 📤 배지로 AI 생성 시안과 구분",
      "시안 이력 섹션을 drafting 단계에서도 표시 (이전엔 drafting 외 단계만 보였음) — 빈 상태일 땐 안내 메시지",
    ],
  },
  {
    version: "1.10.20",
    date: "2026-04-24",
    changes: [
      "활동 이력에 컨셉시트 4뷰 생성도 기록 — sheet_generated 액션 추가 ('시트 생성' 라벨, views 개수 + 모델명 payload)",
      "기존 designs_added 라벨도 '생성' → '시안 생성' 으로 명확화 (시트 생성과 구분)",
      "서버: PATCH 시 data.concept_sheet_views.generated_at 타임스탬프 변경 감지해 활동 기록",
      "활동 필터 드롭다운에 '시트 생성' 옵션 추가",
      "시트 재생성 시 기존 시트 삭제하지 않고 card.data.concept_sheet_history[] 에 보존 — 상세 모달에 '📚 이전 시트 기록' details 토글로 누적 4뷰 썸네일 표시 (생성일시 + 모델명)",
    ],
  },
  {
    version: "1.10.19",
    date: "2026-04-24",
    changes: [
      "[버그 수정] 컨셉시트(4뷰) 생성 중인 카드가 우하단 작업큐에 안 뜨던 문제 — makeSheet 에서 onGenerateProgress/onGenerateEnd 콜백 호출 추가 (시안 생성과 동일 패턴)",
    ],
  },
  {
    version: "1.10.18",
    date: "2026-04-24",
    changes: [
      "활동 이력 — '생성' 라벨을 용도별로 분리",
      "  · 카드 신규 등록(created) → '신규'",
      "  · 시안 이미지 생성(designs_added) → '생성'",
      "서버가 PATCH 시 prev/next data.designs 길이를 비교해 증가했으면 designs_added 활동 기록 (+count)",
      "활동 이력 필터 드롭다운에도 '시안 생성' 옵션 추가",
    ],
  },
  {
    version: "1.10.17",
    date: "2026-04-24",
    changes: [
      "[버그 수정] 유사 에셋 아이콘이 일부 안 보이던 문제 — 에셋의 icon 파일명이 id 와 다른 경우 /api/object-icon/:id 가 404. 서버 posmap 응답에 objects.json 의 icon 필드 포함, 클라이언트는 m.icon || m.id 로 아이콘 URL 구성",
      "유사 에셋 썸네일 로드 실패 시 해당 카테고리 이모지로 fallback 표시 (예전엔 숨김)",
      "findSimilarCatalogAssets 결과에 icon / name 필드 포함",
      "활동 이력 UI 개편 — 각 항목에 프로필 아이콘 원형 22px (hover 시 이름), action 명 한글화 (created→생성, moved→상태 이동 등), 배경 pill 로 가독성 향상",
      "활동 이력 헤더 클릭 시 접기/펼치기 (기본 펼침)",
    ],
  },
  {
    version: "1.10.16",
    date: "2026-04-24",
    changes: [
      "상세 모달 좌/우 프레임 동일 폭 — gridTemplateColumns '1.3fr 1fr' → '1fr 1fr'",
      "모달 전체 폭 1250 → 1440px — 좌측 크기 유지하면서 우측 확장 (maxWidth 96vw 는 유지, 좁은 화면에선 자동 축소)",
    ],
  },
  {
    version: "1.10.15",
    date: "2026-04-24",
    changes: [
      "카드 제목 앞 카테고리 아이콘 자동 노출 제거 — CardHubCard / CardListRow 둘 다 {catInfo.icon} 프리픽스 삭제. 카테고리는 별도 컬럼/배지로 이미 노출됨",
    ],
  },
  {
    version: "1.10.14",
    date: "2026-04-24",
    changes: [
      "리스트 뷰 행 오른쪽 끝에 작성자 아이콘 열 추가 — 카드의 created_by 프로필 이모지, 마우스 hover 시 이름 tooltip 표시",
      "LIST_GRID 9→10 컬럼 (마지막 32px)",
      "댓글 입력창 앞에 현재 프로필 아이콘 32px 원형 표시 — hover 시 현재 프로필 이름 tooltip, 프로필 미선택 시 회색 톤 + 안내",
    ],
  },
  {
    version: "1.10.13",
    date: "2026-04-24",
    changes: [
      "[HOTFIX — 카드 선택 시 화면이 하얗게 되던 문제] AssetInfoEditor 에서 v1.10.9 에 refImages state 를 PromptRefEditor 로 분리했는데 runCategorySuggest 버튼의 disabled / cursor 조건에 refImages[0] 참조가 남아 있어 ReferenceError 로 모달 렌더 실패. card.data.ref_images / thumbnail_url 로 이미지 유무 판정하도록 수정",
      "(이번 재발 사례 TDZ 메모에 추가 — state 제거 시 잔여 참조 grep 필수)",
    ],
  },
  {
    version: "1.10.12",
    date: "2026-04-24",
    changes: [
      "헤더의 ＋ 새 시안 버튼 제거 — 시안 생성 탭 본문 상단에 동일 버튼이 이미 있어 중복",
    ],
  },
  {
    version: "1.10.11",
    date: "2026-04-24",
    changes: [
      "프로필 편집 가능 — 드롭다운 각 행 오른쪽 ✏️ 클릭 시 인라인 편집 (이름 + 아이콘), Enter 저장 / Esc 취소 / 저장 버튼",
      "이름 변경 시 서버가 card_comments / card_activities / activity_log 의 actor 필드를 트랜잭션으로 일괄 갱신 — 기존 댓글·활동 기록도 새 이름으로 자동 연결 (orphan 방지)",
      "이름 충돌 (다른 프로필이 같은 이름 사용) 시 409 반환",
      "삭제는 여전히 지원 안 함 (사용자 요구사항 유지)",
    ],
  },
  {
    version: "1.10.10",
    date: "2026-04-24",
    changes: [
      "헤더 우측 3개 버튼(아카이브 / API 설정 / 새 시안) 컴팩트화 — padding 10→5, fontSize 13-14→11-12, 아이콘도 한 단계 축소",
      "헤더 검색창 폭 280→238px (약 15% 감소)",
      "프로필 아이콘 후보 16개 → 21개로 확장. 피부색(light / medium / dark) × 남/녀 기본, 빨강머리·곱슬·흰머리·탈모·수염·금발·안경(🤓/🧐)·어르신 포함 — 사용자 구분감 강화",
      "프로필 선택 그리드 8→7 열 (21 = 7×3 행)",
    ],
  },
  {
    version: "1.10.9",
    date: "2026-04-24",
    changes: [
      "프롬프트 + 참조 이미지를 우측 프레임 최상단(시안 생성 위)으로 이동 — 좌측 AssetInfoEditor 에서 분리",
      "PromptRefEditor 신규 컴포넌트 — 자체 state, PATCH, onRefresh 로 동기화, Ctrl+V 이미지 붙여넣기 유지",
      "AssetInfoEditor 는 카테고리 / 스타일 / 크기 / 카탈로그 매칭에 집중 (프롬프트/참조 관련 state·effect 정리)",
      "자동 분류는 여전히 refImages[0] || thumbnail_url 로 이미지를 받음 (card.data 직접 읽기)",
    ],
  },
  {
    version: "1.10.8",
    date: "2026-04-24",
    changes: [
      "👤 프로필 시스템 추가 — 헤더 맨 오른쪽에 프로필 선택기. 머리 이모지 + 이름, 여러 개 미리 등록 후 하나 선택 → localStorage 에 id 저장되어 새로고침 / 탭 전환해도 본인 프로필 유지",
      "프로필은 전역 공유 (누구나 추가, 삭제 없음). 30초마다 서버 폴링으로 다른 사용자가 추가한 프로필 반영",
      "서버: profiles 테이블 + GET/POST /api/profiles — 이름 unique, 중복 시 기존 반환",
      "댓글 작성자 옆에 프로필 아이콘 표시 (👤 이름 · 날짜) — 이름으로 프로필 매칭, 없으면 기본 👤, 시스템은 ⚙️",
      "활동 이력에도 작성자 아이콘 추가",
      "actorName 은 선택된 프로필 이름에서 자동 파생 — 프로필 없으면 기존 inzoi_actor_name fallback (하위 호환)",
      "아이콘 선택 후보 16종: 🧑 👤 👨 👩 🧔 👱 👴 👵 🧓 🧒 🤓 😊 🙂 🦊 🐻 🐰",
    ],
  },
  {
    version: "1.10.7",
    date: "2026-04-24",
    changes: [
      "상세 모달 레이아웃 재정리 — 좌: 업데이트 일정 → 우선순위 → 대표이미지 → 어셋정보 → 설명. 우: 시안 생성 → 시안 이력 → 댓글 → 활동 이력",
      "[버그 수정] 댓글 편집이 안 되던 문제 — actorName 미설정(null) 사용자가 본인이 쓴 익명 댓글(cm.actor=null) 도 본인으로 인정되게 서버/클라 확인 로직 완화 ((cm.actor || null) === (actor || null))",
      "v1.10.0 에서 추가한 본인 댓글 삭제도 같이 익명 케이스 허용",
    ],
  },
  {
    version: "1.10.6",
    date: "2026-04-24",
    changes: [
      "상세 모달 댓글 편집 가능 — 본인이 쓴 댓글은 본문 클릭 또는 ✏️ 로 인라인 textarea 전환, Ctrl/⌘+Enter 저장 / Esc 취소 / blur 자동 저장",
      "서버: PATCH /api/projects/:slug/cards/:id/comments/:commentId — actor 일치 검사, 빈 본문 거부, 'comment_edited' 활동 기록",
      "CommentRow 컴포넌트로 분리 — 편집 / 삭제 ✏️ ✕ 한 곳에 모음",
    ],
  },
  {
    version: "1.10.5",
    date: "2026-04-24",
    changes: [
      "스타일 프리셋 기본 목록 8개 → 24개 확장: 컨템포러리 / 재팬디 / 레트로 / 아르데코 / 러스틱 / 팜하우스 / 보헤미안 / 코스탈 / 지중해 / 전통(한옥) / 프렌치 컨트리 / 어반 / 퓨처리스틱 / 키즈 / 고딕 / 이클렉틱 추가",
      "(inzoiObjectList meta.json 에 styles 가 있으면 그게 우선 — 이 목록은 fallback)",
      "상세 모달 '설명' 영역 편집 가능 — CardDescriptionEditor 컴포넌트로 교체. 클릭해서 textarea 로 전환, Ctrl/⌘+Enter 로 저장 / Esc 로 취소 / blur 로 자동 저장",
    ],
  },
  {
    version: "1.10.4",
    date: "2026-04-24",
    changes: [
      "유사 에셋 가중치 재조정 — 검증 목적(같은 종류 에셋 이미 있는지 확인) 정확도 향상",
      "  · 이름 키워드 매칭 ×25 → ×50 (가장 강한 신호로 승격)",
      "  · style +30 → +10, mood +20 → +5 (분위기 기반 일치는 낮춘 보조 신호로)",
      "  · shape ×20 유지, materials ×10 유지, size +5 유지",
      "  · colors ×15 제거 — 같은 색이라도 다른 오브젝트 매칭 잦음",
      "  · 같은 filter -10 페널티 제거 — 검증엔 같은 종류 더 보여야 함",
      "  · 다른 catHier lv1 -50 페널티 유지 (가구 ↔ 탑승물/건축 배제)",
      "[기존 카드 자동 반영] 상세에서 유사 에셋 그리드 렌더 시 저장된 features 로 매번 fresh 재계산 — 예전에 분류한 카드도 새 기준으로 자동 재매칭",
    ],
  },
  {
    version: "1.10.3",
    date: "2026-04-23",
    changes: [
      "리스트 뷰 컬럼 헤더(제목 / 우선순위 / 업데이트 / 카테고리 …) 도 sticky 영역으로 이동 — 카드 스크롤 시 컬럼 라벨이 따라다님",
      "카드 뷰에서는 컬럼 헤더 숨김 (불필요)",
    ],
  },
  {
    version: "1.10.2",
    date: "2026-04-23",
    changes: [
      "탭 상단(제목 · 뷰 토글 · 카드 크기 · 정렬 · ＋새 시안 · 업데이트 chip 바) 전부 sticky 고정 — 카드 스크롤 시 상단이 남아 필터/정렬 접근 유지",
      "메인 / 완료 / 위시 탭 3곳 모두 적용 (top: 64px 전역 헤더 바로 아래)",
    ],
  },
  {
    version: "1.10.1",
    date: "2026-04-23",
    changes: [
      "헤더에 🔍 전체 카드 검색 추가 — Asset Studio 로고 바로 옆, 제목 / 설명 / 업데이트 태그 / 카테고리·스타일 라벨 매칭. 탭과 무관하게 모든 카드 대상",
      "입력 즉시 상위 12개 결과 드롭다운 (썸네일 · 상태 · 카테고리 · 업데이트 태그). 클릭하면 상세 모달 오픈",
      "ESC / ✕ 로 검색어 즉시 초기화, blur 시 드롭다운 자동 닫힘",
    ],
  },
  {
    version: "1.10.0",
    date: "2026-04-23",
    changes: [
      "[버그 수정] 상세 모달에서 업데이트 일정 입력 후 금방 지워지던 문제 — PriorityField / TargetUpdateField 가 서로 stale card.data 를 PATCH 로 덮어쓰던 race 해결. 각 필드 저장 시 서버 응답을 onSaved 로 부모에 전달해 detailCard 즉시 동기화.",
      "업데이트 chip ✏️ 일괄 이름 변경 — '교도소 · 3' 같은 chip 옆 ✏️ 클릭하면 인라인 입력으로 전환, 확인 시 해당 태그 붙은 모든 카드의 target_update 를 새 이름으로 일괄 PATCH. 컨펌 카드도 force 로 갱신.",
      "본인 댓글 삭제 ✕ — 상세 모달 댓글 목록에서 본인이 쓴 댓글만 우측 상단에 ✕ 표시, 서버가 actor 일치 검사 후 DELETE /api/.../comments/:commentId 처리, 'comment_deleted' 활동 기록.",
      "시안 이미지가 단 한 개뿐이면 무조건 대표 이미지 — CardHubCard / CardListRow / 상세 모달 좌측 대표 이미지 모두 designs.length === 1 일 때 card.thumbnail_url 보다 그 한 장을 우선.",
    ],
  },
  {
    version: "1.9.9",
    date: "2026-04-23",
    changes: [
      "상단 🔥 우선순위 chip 필터 바 제거 — 리스트 컬럼 헤더 클릭 정렬로 같은 역할 커버",
      "PriorityChipBar / matchesPriorityFilter / collectPriorityChips / selectedPriorities 관련 코드 전부 삭제 (데드 코드 방지)",
      "우선순위 필드(상세 모달)와 리스트 컬럼 / 정렬은 그대로 유지",
    ],
  },
  {
    version: "1.9.8",
    date: "2026-04-23",
    changes: [
      "우선순위 필드를 상세 모달 좌측 최상단(썸네일 위)으로 이동 — 카드 열자마자 가장 먼저 눈에 들어오도록",
      "리스트 뷰 컬럼 헤더 클릭 정렬 — 제목 / 우선순위 / 업데이트 / 카테고리 / 스타일 / 크기 / 상태 / 생성일 모두 클릭 가능",
      "클릭 사이클 = 기본(생성일 역순) → ▲ 오름차순 → ▼ 내림차순 → 기본 (토글)",
      "활성 정렬 컬럼은 primary 색상 + ▲/▼ 화살표로 강조, 나머지는 ↕ 힌트",
      "sortCardArray 가 getCard 리졸버 받아 wishlist / 완료 탭(item 배열)에서도 card.data 기반 정렬 동작",
      "우선순위 정렬은 '1 < 2 < 3 < 미정 < 보류' 순, 업데이트 정렬은 '미지정' 항상 뒤로, 크기는 W×D×H 부피 기준, 상태는 시안 수 기준 (컨펌은 최상위)",
    ],
  },
  {
    version: "1.9.7",
    date: "2026-04-23",
    changes: [
      "우선순위 '미정' 버튼이 투명 배경·투명 테두리라 안 보이던 문제 수정 — 회색 배경 + 테두리 추가",
      "우선순위 버튼 클릭 시 active 하이라이트가 즉시 반영 안되던 문제 수정 — optimistic local state 로 클릭 즉시 UI 업데이트, 실패 시 rollback",
      "활성 버튼에 그림자 추가 — 선택 여부 더 명확",
    ],
  },
  {
    version: "1.9.6",
    date: "2026-04-23",
    changes: [
      "🔥 우선순위 필드 추가 — card.data.priority 에 1/2/3/미정/보류 5개 고정값 저장, 상세 모달 최상단 어셋 정보 섹션 위에 버튼 5개로 편집",
      "리스트 뷰에 [우선순위] 컬럼 추가 — 제목과 업데이트 사이, 1(빨강)/2(주황)/3(노랑)/미정(회색)/보류(흐림) 색상 뱃지",
      "메인/완료/위시 탭 상단에 🔥 우선순위 chip 필터 바 — 업데이트 chip 바 위에 다중 선택, 카드에 실제 등장한 값만 노출",
      "LIST_GRID 를 8→9 컬럼으로 확장 (90px 1fr 70px 90px 150px 80px 130px 95px 100px)",
    ],
  },
  {
    version: "1.9.5",
    date: "2026-04-22",
    changes: [
      "리스트 뷰에 [업데이트] 컬럼 추가 — 제목과 카테고리 사이에 🗓️ target_update 값 (교도소 / voc / 미지정 등) 표시",
      "LIST_GRID 를 7→8 컬럼으로 확장 (90px 1fr 90px 150px 80px 130px 95px 100px)",
    ],
  },
  {
    version: "1.9.4",
    date: "2026-04-23",
    changes: [
      "유사 에셋 썸네일에서 ↗ 바로가기 배지와 NN% 유사도 배지 제거 — 깔끔한 아이콘만 표시",
    ],
  },
  {
    version: "1.9.3",
    date: "2026-04-23",
    changes: [
      "유사 에셋 매칭에 catHier lv1 분류 반영 — 가구 카드 검색 시 탑승물 / 건축 / 제작·기타 같은 다른 lv1 의 에셋은 -50 페널티로 자동 배제",
      "서버가 catHier 를 파싱해 filter→lv1 / filter→lv2 매핑을 만들고 posmap 응답 각 entry 에 lv1/lv2 첨부",
      "사용자 카드의 카테고리에서 lv1 자동 계산 (FURNITURE_CATEGORIES.group), 매칭 시 cross-lv1 강한 페널티",
      "[데이터 출처 재확인] posmap_scores.json (shape/style/materials) + objects.json (filter/name) + meta.json (catHier lv1 매핑) 3개 모두 정상 소비",
    ],
  },
  {
    version: "1.9.2",
    date: "2026-04-23",
    changes: [
      "유사 에셋 매칭 정확도 향상 (검증 용도) — Gemini 가 posmap_shape (형태: 곡선/사각/원형/유기적/직선) + keywords (한글 명사 1~3개) 도 추출",
      "매칭 점수에 shape 매칭 ×20, asset name 키워드 매칭 ×25 추가 — '바구니' 같은 명사로 카탈로그 이름 검색해 같은 종류 에셋 우선 노출",
      "같은 카테고리 페널티 -30 → -10 으로 완화 — 검증엔 같은 종류 매칭이 더 중요",
      "서버 posmap 응답에 shape 배열 + objects.json name 포함 (키워드 매칭 가능)",
      "추천 배지에 매칭 근거 표시: 🔑 키워드 · 형태 · 스타일 · 재질",
    ],
  },
  {
    version: "1.9.1",
    date: "2026-04-23",
    changes: [
      "[버그 수정] /api/object-meta 가 5초 타임아웃으로 abort 되어 posmap 유사도 매칭이 작동 안 하던 문제 — object-meta upstream fetch 만 20초로 상향 (objects.json 1.8MB + posmap_scores.json 333KB 동시 수신)",
      "개별 파일 실패 시 fallback (meta 필수, objects/posmap 빈 배열) 로 부분 성공 허용 → 하나가 느려도 전체 응답 막히지 않음",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-04-23",
    changes: [
      "기존 제작 에셋 top-12 컷오프(기본 카테고리 정렬) · 자동 분류 시 posmap_scores 유사도 기반 재정렬",
      "/api/object-meta 응답에 posmap_scores (전 에셋 ML 분석) 포함 — style/mood/size/colors/materials/filter",
      "Gemini 자동 분류 1콜이 posmap 스키마와 동일한 한글 feature 추출 (posmap_style/mood/size/colors/materials) — 추가 호출 없음",
      "클라이언트가 카드 feature 로 전 5,790개 에셋 전수 스캔, inzoiObjectList 의 calcSimilarity 알고리즘 그대로 사용 (스타일 +30, 무드 +20, 색상 ×15, 재질 ×10, 같은 카테고리 -30 크로스 카테고리 유도) — 즉시 완료",
      "card.data.catalog_matches 에 features + top-12 items 저장, 썸네일 그리드가 이 우선, 각 썸네일에 유사도 % + 카테고리 배지 표시",
    ],
  },
  {
    version: "1.8.7",
    date: "2026-04-23",
    changes: [
      "카탈로그 상세 모달을 iframe 으로 회귀 — 카탈로그 자체 상세 UI (#item=<id>) 를 그대로 재사용해 원본 프로젝트 업데이트가 자동 반영",
      "1.8.6 에서 추가했던 서버 /api/object-detail 엔드포인트 · loadCatalogCache · 클라 Section/InfoCell/ThumbGrid/MAT_KO 등 한글 라벨 맵 전부 제거 (중복 렌더 제거)",
      "iframe 모달 헤더: 📦 에셋 카탈로그 · <id> · ↗ 새 탭 · ✕. ESC 로 닫힘",
    ],
  },
  {
    version: "1.8.6",
    date: "2026-04-23",
    changes: [
      "카탈로그 상세 모달이 inzoiObjectList 의 모달과 동일한 구성으로 대폭 확장 — 서버가 object_templates / posmap_scores / state_variations / customize_data / grab_types / collection_items / item_history / recommendations / similar_items 까지 한 번에 통합 캐시",
      "포지셔닝맵 분석 섹션 (스타일/무드/크기/재질/색상 팔레트), 배치 정보 (carriable/handStyle/placement), 커스터마이즈 정보 (파트·AI 텍스처 지원 여부), 변형 (state_variations), 함께 배치된 아이템, 유사 아이템(벡터 유사도) 전부 표시",
      "헤더 태그 라인에 inzoiObjectList 와 동일한 pill (카테고리 경로·가격·커마 가능/재질·잠금해제 조건·grab 유형·컬렉션·추가/수정일) 배치",
      "재질/잠금조건/grab/컬렉션 한글 라벨 맵 (MAT_KO/COND_KO/GRAB_KO/COLL_KO) 클라이언트 복사",
    ],
  },
  {
    version: "1.8.5",
    date: "2026-04-23",
    changes: [
      "[버그 수정] 카탈로그 상세 모달이 '로딩 중' 에서 멈추던 문제 — inzoiObjectList :8080 upstream fetch 에 5초 AbortController 타임아웃 추가",
      "서버 timedFetch 헬퍼로 모든 upstream (/api/object-meta, /api/object-detail, /api/object-icon) 통일",
      "클라이언트 모달 에러 UI 개선 — '카탈로그 데이터 불러오기 실패' + 구체적 안내 ('운영자 PC 의 object catalog 서버 확인')",
    ],
  },
  {
    version: "1.8.4",
    date: "2026-04-23",
    changes: [
      "카탈로그 상세를 iframe 대신 네이티브 모달로 렌더 — /api/object-detail/:id 가 해당 에셋 데이터만 내려주고 클라이언트가 직접 그림 (전체 카탈로그 페이지 로드 없음, 훨씬 가볍고 빠름)",
      "네이티브 모달: 아이콘 200×200, 이름/설명/필터/가격/태그/스타일태그/재질/속성, 같은 필터 변형 최대 10개 썸네일 — 클릭 시 모달 내에서 이동",
      "[버그 수정] 완료 카드 '🔓 재오픈' 버튼이 실제로 잠금 풀리지 않던 문제 — 서버 updateCardField SQL 의 COALESCE 가 null 바인딩을 '변경 없음' 으로 처리. body.confirmed_at === null 일 때 별도 UPDATE 로 NULL 강제 (confirmed_by 도 동시 클리어)",
    ],
  },
  {
    version: "1.8.3",
    date: "2026-04-23",
    changes: [
      "카탈로그 상세를 새 탭 대신 현재 페이지의 iframe 모달로 표시 — 92vw × 88vh, 헤더에 에셋 id / '↗ 새 탭' / ✕",
      "📎 카탈로그 전체 보기 버튼도 동일 iframe 모달로 (해시 없이 홈 로드)",
      "기존 이미지 lightbox 는 그대로 유지 — 카탈로그 모달은 더 높은 z-index 로 오버레이",
    ],
  },
  {
    version: "1.8.2",
    date: "2026-04-23",
    changes: [
      "기존 제작 에셋 썸네일 클릭 시 inzoiObjectList 의 해당 에셋 상세를 새 탭으로 딥링크 — URL 해시 `#item=<id>` 로 카탈로그가 자동 인식해 모달 오픈",
      "썸네일 우측 상단에 ↗ 배지 + hover 시 테두리 강조 + 살짝 떠오르는 피드백으로 '클릭 가능' 시각화",
    ],
  },
  {
    version: "1.8.1",
    date: "2026-04-23",
    changes: [
      "카테고리 스펙 배너에 '📦 기존 제작 에셋' 썸네일 그리드 추가 — inzoiObjectList 의 카탈로그 상위 8개 에셋 아이콘 표시",
      "서버 /api/object-icon/:id 프록시 엔드포인트 — :8080/img/*.PNG 를 동일 오리진으로 프록시, 24시간 브라우저 캐시",
      "spec.sample_thumbs = [{id, name, icon_url, price, tags}] 8개 반환, 썸네일 클릭 시 lightbox, hover 툴팁에 이름/가격/태그",
      "📎 '카탈로그 전체 보기' 링크 버튼으로 inzoiObjectList :8080 홈 새 탭 오픈",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-04-23",
    changes: [
      "컨셉시트 생성이 Gemini 3 Flash Image (나노바나나2) 로 4뷰(정면·측면·후면·상단) 병렬 생성 — 기존 Canvas 2D 합성 대체",
      "각 뷰 1024² 수준, 카드별 card.data.concept_sheet_views = { front, side, back, top, model, generated_at, source_image_url } 저장",
      "상세 모달 sheet 패널에 2×2 그리드 미리보기 + 📥 뷰별 다운로드 버튼. 실패 뷰는 '실패' 표시로 재생성 가능",
      "[버그 수정] 참조 이미지에서 '대표' 지정해도 카드 썸네일이 이전 디자인/시안으로 보이던 문제 — card.thumbnail_url 을 항상 최우선으로, 없을 때만 tabId 별 fallback",
    ],
  },
  {
    version: "1.7.9",
    date: "2026-04-23",
    changes: [
      "Gemini 시안 생성 프롬프트 영문 일관화 — 카테고리/스타일을 id 기반 영문으로 변환(PascalCase → 'vanity table', 'mid century modern')",
      "크기 정보가 있으면 프롬프트에 'target size: 190cm wide, 210cm deep, 50cm tall' 자동 포함",
      "카탈로그 spec hints (referenced variants / tags) 는 프롬프트에서 제거 — 사용자 요청에 따라 참조이미지 + 프롬프트 + 스타일 + 크기만 포함",
    ],
  },
  {
    version: "1.7.8",
    date: "2026-04-23",
    changes: [
      "참조 이미지에 hover 오버레이 추가 — '☆ 대표' / '✕ 삭제' 버튼으로 카드 썸네일 지정 및 제거",
      "현재 카드 썸네일과 일치하는 참조 이미지는 ⭐ 배지 + 노란 테두리로 구분",
    ],
  },
  {
    version: "1.7.7",
    date: "2026-04-23",
    changes: [
      "리스트 뷰에 스타일 / 크기 컬럼 추가 — 총 7컬럼(썸네일 · 제목 · 카테고리 · 스타일 · 크기 · 상태 · 날짜)",
      "크기는 '180×210×50 cm' 모노스페이스 + source 아이콘(🤖/📚/✏️) 으로 출처 표시",
      "스타일은 라운드 배지(모던/스칸디나비안 등) 로 강조",
    ],
  },
  {
    version: "1.7.6",
    date: "2026-04-23",
    changes: [
      "🤖 자동 분류가 카테고리 + 스타일 + 크기(W/D/H cm) 까지 한 번에 제안 — Gemini 응답에 width_cm / depth_cm / height_cm / size_confidence / size_reason 추가",
      "추천 배지에 '📏 180×210×50cm · 70%' 로 크기도 표시, [적용] 한 번으로 세 필드 전부 반영",
      "카테고리 선택 즉시 ASSET_SPECS 매핑 카테고리는 카탈로그 중앙값(midpoint) 으로 size_info 자동 채움 (source='catalog') — 기존 값 있으면 건드리지 않음",
      "SizeInfoPanel 의 개별 AI 추정 버튼 제거 — 통합 '자동 분류' 로 일원화, 입력 상태 배지(🤖 AI 추정 / 📚 카탈로그 기준 / ✏️ 수동 입력) 추가",
    ],
  },
  {
    version: "1.7.5",
    date: "2026-04-23",
    changes: [
      "📏 크기 정보 패널 추가 — 어셋 정보 안에 별도 강조된 초록색 박스로 W/D/H (cm) 수동 입력 필드",
      "'🔍 이미지로 AI 추정' 버튼 — Gemini Vision 이 참조/썸네일 이미지에서 실제 크기(cm) 추정, JSON 응답 파싱 → 필드 자동 채움",
      "카탈로그 참고 범위 — PascalCase 카테고리 id 를 ASSET_SPECS (kebab) 로 매핑하는 CATEGORY_TO_LEGACY_SPEC 테이블로 10여 카테고리는 기본 크기 범위 표시",
      "업데이트 일정 필드를 어셋 정보 안에서 밖으로 이동 — 상세 모달 좌측, 어셋 정보 상단에 별도 노란색 박스로 강조",
      "card.data.size_info 구조: { width_cm, depth_cm, height_cm, source: 'manual'|'ai', confidence, reason, updated_at }",
    ],
  },
  {
    version: "1.7.4",
    date: "2026-04-23",
    changes: [
      "업데이트 일정 필드 + 필터 추가 — 카드 상세 어셋 정보에 🗓️ 업데이트 일정 자유 입력 (card.data.target_update), 기존 값 datalist 자동완성",
      "모든 메인 탭(위시 / 시안 생성 / 투표 / 컨셉시트 / 완료) 상단에 chip 바 노출 — '[전체] [2026-Q2] [미지정]' 다중 토글",
      "chip 은 탭에 보이는 카드 내 값만 집계 · 빈 값은 '미지정' 으로 묶임 · 한글 정렬",
    ],
  },
  {
    version: "1.7.3",
    date: "2026-04-23",
    changes: [
      "카테고리 선택 시 스펙 배너 대폭 확장 — 인용 설명(sample_desc), 예시 이름, 태그, 스타일, 가격대(min~max, 중앙값), 커스터마이즈/해금 카운트 표시",
      "서버 /api/object-meta spec 블록에 sample_desc / unlock_count / custom_count 추가",
      "배너 헤더에 카테고리 아이콘 + '가구 / 침실' 같은 계층 경로 노출",
    ],
  },
  {
    version: "1.7.2",
    date: "2026-04-23",
    changes: [
      "🤖 자동 분류가 카테고리 + 스타일 프리셋을 한 번에 추천 — Gemini 응답에 style_id / style_confidence 추가",
      "추천 배지에 '· 모던 스타일 · 70%' 포맷으로 두 결과 동시 표시, [적용] 한 번으로 둘 다 반영",
      "이미 스타일이 선택된 카드는 [적용] 시 카테고리만 교체하고 기존 스타일 유지 (배지에 '(기존 선택 유지)' 표시)",
    ],
  },
  {
    version: "1.7.1",
    date: "2026-04-23",
    changes: [
      "카테고리 스펙 정보 추가 — /api/object-meta 가 objects.json(5,265 에셋) 도 읽어 카테고리별 sample_names / common_tags / styles / price_range 생성",
      "Gemini 시안 생성 프롬프트에 실제 카탈로그의 변형 이름/태그 자동 concat (기존 하드코딩 ASSET_SPECS 대신 208개 전 카테고리 커버)",
      "어셋 정보 섹션에 '✦ <카테고리> 스펙' 배지 추가 — 카탈로그 에셋 수, 예시 이름, 태그, 스타일 표시",
      "meta/spec 캐시 주기 5분 → 1시간 (자주 안 바뀌는 데이터, 부하 감소)",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-04-22",
    changes: [
      "카테고리 / 스타일을 inzoiObjectList 의 meta.json 과 자동 연동 — 서버 /api/object-meta 가 운영자 PC :8080/data/meta.json 을 프록시해 catHier + filterKo + objTags 에서 목록 생성",
      "클라이언트는 앱 시작 시 + 5분 주기로 목록 갱신, 실패 시 내장 fallback 목록 사용",
      "meta.json 이 변동되면 최대 5분 내 자동 반영 (서버 캐시 동일 주기, ?force=1 로 즉시 무효화 가능)",
    ],
  },
  {
    version: "1.6.9",
    date: "2026-04-22",
    changes: [
      "[버그 수정] 시안 생성 / 투표 탭의 카드 썸네일이 '대표 이미지' 변경을 반영하지 않던 문제 — 첫 시안 이미지를 무조건 쓰던 로직을 '선정 시안 > 첫 시안 > 카드 썸네일' 우선순위로 교체 (CardHubCard / CardListRow 모두)",
    ],
  },
  {
    version: "1.6.8",
    date: "2026-04-22",
    changes: [
      "위시리스트 '새 아이디어 추가' 폼을 좌측 사이드에서 제거 — 헤더 '＋ 새 아이디어' 버튼 누르면 모달로 오픈",
      "그리드가 전체 너비 차지, 시안 생성 / 완료 탭과 레이아웃 통일",
      "빈 위시리스트에서 '＋ 첫 아이디어 추가' CTA 버튼 노출",
    ],
  },
  {
    version: "1.6.7",
    date: "2026-04-22",
    changes: [
      "리스트 뷰 행 높이 약 1.5배 확대 — 썸네일 60→90px, 패딩 10→15px, 제목/메타 폰트 조금 키움",
    ],
  },
  {
    version: "1.6.6",
    date: "2026-04-22",
    changes: [
      "어셋 정보의 카테고리 선택기를 검색 가능한 콤보박스로 교체 — 50+ 카테고리를 라벨/방/id 로 substring 매칭",
      "키보드 ↑ ↓ / Enter / Esc 지원, ✕ 로 선택 초기화, 바깥 클릭으로 닫힘",
    ],
  },
  {
    version: "1.6.5",
    date: "2026-04-22",
    changes: [
      "메인 페이지 뷰 토글 추가 — 🔲 카드 뷰(기본) ↔ ☰ 리스트 뷰",
      "리스트 뷰는 썸네일(60px) + 제목 + 카테고리 + 상태/시안수 + 날짜 컬럼으로 컴팩트 표시, 많은 카드를 한 눈에 스캔",
      "뷰 선택은 localStorage 에 저장되어 새로고침해도 유지, 리스트 뷰에선 카드 크기 토글 숨김",
    ],
  },
  {
    version: "1.6.4",
    date: "2026-04-22",
    changes: [
      "🤖 카테고리 자동 분류 추가 — 카드 상세 모달의 카테고리 필드 옆 '자동 분류' 버튼을 누르면 첨부 이미지를 Gemini 2.5 Flash Vision 에 보내 카테고리 id + confidence 반환",
      "자동 적용하지 않고 '추천: 🛏️ 침대 (85%)' 배지로 제안, [적용] 클릭 시 반영 — 확신도 50% 미만은 주황색으로 표시",
      "응답이 실제 FURNITURE_CATEGORIES 에 존재하는 id 인지 검증해 hallucination 방지",
    ],
  },
  {
    version: "1.6.3",
    date: "2026-04-22",
    changes: [
      "[버그 수정] 위시리스트 / 상세 모달에서 입력창에 포커스된 상태로 Ctrl+V 하면 이미지 붙여넣기가 동작하지 않던 문제 해결 — 클립보드에 이미지가 있을 때만 기본 동작을 가로채고, 텍스트 붙여넣기는 그대로 유지",
    ],
  },
  {
    version: "1.6.2",
    date: "2026-04-22",
    changes: [
      "카드 썸네일 비율 조정 — 이미지 높이 180→240 (33% 증가), 본문 패딩/폰트 축소로 설명 영역 압축. 설명은 1줄로 말줄임 처리.",
      "'카드' 보조 배지 제거로 헤더 공간 절약",
    ],
  },
  {
    version: "1.6.1",
    date: "2026-04-22",
    changes: [
      "컨셉시트 생성 버튼이 선정된 시안이 없어 비활성화되던 문제 개선 — 선정 시안 → (미선정) 첫 시안 → 카드 썸네일 순으로 fallback, 하나라도 있으면 활성화",
      "소스 이미지 라벨과 툴팁에 어떤 이미지로 만들지 표시",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-04-22",
    changes: [
      "메인 카드 그리드에 카드 크기 토글(0.5× / 1× / 2×) 추가 — localStorage 에 저장되어 새로고침 후에도 유지",
      "위시리스트 / 완료목록 카드가 시안 생성 탭 크기 기준으로 동일한 양식, 스케일 적용",
      "위시리스트 이미지 다중 첨부 지원 — 파일 선택(multiple) · Ctrl+V 반복 붙여넣기 모두 최대 4개까지 누적",
      "위시리스트 생성 시 첫 이미지는 썸네일로, 전체는 data.ref_images 로 저장 → drafting 단계에서 그대로 참조이미지로 사용",
      "카드 상세 모달(AssetInfoEditor)에서 Ctrl+V 로 참조 이미지 붙여넣기 지원",
    ],
  },
  {
    version: "1.5.9",
    date: "2026-04-22",
    changes: [
      "위시리스트 / 완료목록 카드 그리드를 CardHubCard 양식으로 통일 — 시안 생성 / 투표 / 컨셉시트 생성 탭과 동일한 UI",
      "메인 카드 그리드에 정렬 드롭다운 추가 (최신순 / 오래된순 / 이름 A→Z / 이름 Z→A)",
      "CardHubCard 가 tabId='wishlist' 와 'completed' 도 인식해 썸네일/메타 표시",
    ],
  },
  {
    version: "1.5.8",
    date: "2026-04-22",
    changes: [
      "카드 상세 모달에서 ← → 키로 같은 탭의 이전/다음 카드로 이동",
      "상세 모달 오픈 시 slide-in 애니메이션 제거 (바로 표시)",
      "완료 목록 / 위시리스트 카드 클릭이 항상 새 카드 모달을 열도록 수정 — item._cardId 우선 사용해 접두사 중복 방지",
    ],
  },
  {
    version: "1.5.7",
    date: "2026-04-22",
    changes: [
      "[버그 수정] 같은 카드가 2개씩 보이는 근본 원인 제거 — 클라이언트의 legacy completed/wishlist 싱크 effect 제거 (cards 가 유일 SOT)",
      "이 싱크가 cards → legacy → ensureLegacyMigration → 이중 접두사 카드 재생성(e.g. comp-wish-xxx) 을 유발하고 있었음",
      "앱 초기화 dedupe 가 이중 접두사 카드(`comp-wish-…`, `wish-job-…`, `comp-job-…`)를 우선 삭제하도록 강화 — 기존 중복 데이터도 한번에 정리",
      "수동 위시/완료 추가 핸들러에서도 legacy POST 제거",
    ],
  },
  {
    version: "1.5.6",
    date: "2026-04-22",
    changes: [
      "[버그 수정] 위시리스트에 같은 내용 카드가 여러개 보이던 문제 — 앱 초기화 시 list_id+title+description+thumbnail 동일한 중복 카드 자동 정리(가장 오래된 1개 유지), derived 단계에서도 내용 기준 중복 제거",
      "완료목록 카드 상세의 시안 이력이 legacy 마이그레이션 카드(designs 없음)에서도 data.image_url / concept_sheet_url 로 fallback 해 표시",
      "lightbox 갤러리 순환 대상에 data.image_url 포함 — 완료 카드에서도 ← → 로 확인 가능",
    ],
  },
  {
    version: "1.5.5",
    date: "2026-04-22",
    changes: [
      "카드 상세 모달의 참조 이미지(72→144px) 및 시안 썸네일(100→200px) 크기 2배 확대 — 드래프트 패널 / 시안 이력 / AssetInfoEditor 모두 일괄",
    ],
  },
  {
    version: "1.5.4",
    date: "2026-04-22",
    changes: [
      "시안 작업 큐 재설계 — 실제로 생성 중인 항목이 있을 때만 우하단에 노출, 끝나면 자동 숨김",
      "카드 생성 진행률(done/total + 프로그레스 바)을 카드별로 표시, 클릭 시 해당 카드 상세 모달 오픈",
      "기존 레거시 job queue 는 여전히 loading 중인 것만 표시",
    ],
  },
  {
    version: "1.5.3",
    date: "2026-04-22",
    changes: [
      "시안 이력 섹션 추가 — 컨셉시트 / 완료 단계 카드도 상세 모달에서 그동안 생성된 시안(designs)을 그리드로 확인, 썸네일 클릭 시 lightbox 로 원본 열람",
      "선정된 시안은 ⭐ 배지 + 노란 테두리로 표시",
    ],
  },
  {
    version: "1.5.2",
    date: "2026-04-22",
    changes: [
      "이미지 lightbox 좌/우 이동 지원 — 카드 상세에서 열린 이미지는 ← → 키 또는 ‹ › 버튼으로 해당 카드의 모든 이미지(썸네일·참조·시안·컨셉시트)를 순환",
      "인덱스 표시(1/N) 하단 중앙에 추가",
    ],
  },
  {
    version: "1.5.1",
    date: "2026-04-22",
    changes: [
      "[버그 수정] 위시리스트 이미지가 시안 단계로 넘어오면 참조이미지에서 사라지던 문제 해결 — card.thumbnail_url 로 ref_images 자동 seed & 서버 저장",
      "Gemini multimodal 호출도 ref_images 비어있으면 thumbnail_url 로 fallback",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-22",
    changes: [
      "시안 썸네일 클릭 시 원본 해상도 lightbox 오픈 (hover 오버레이가 pointer-events: none 으로 더 이상 클릭을 가로채지 않음)",
      "'☆ 대표' 버튼 추가 — 상태 이동 없이 카드 대표 이미지(썸네일)만 지정, 대표 지정된 시안은 ⭐ 배지 + 노란 테두리 표시",
      "카드 상세 모달 크기 약 30% 확장 (960×92vh → 1250×94vh, maxWidth 96vw)",
    ],
  },
  {
    version: "1.4.9",
    date: "2026-04-22",
    changes: [
      "[버그 수정] '투표 및 선정' / '컨셉시트 생성' 탭이 선택 직후 다시 '시안 생성' 으로 튕기던 문제 해결",
      "  - legacy job step 기반 자동 탭 전환 effect 가 탭 클릭 직후 덮어쓰던 것을 showWorkflowDetail 이 켜진 경우로만 제한",
    ],
  },
  {
    version: "1.4.8",
    date: "2026-04-22",
    changes: [
      "[버그 수정] 카드 삭제가 폴링 후 되돌아가 보이던 문제 해결 — 서버 DELETE 가 대응되는 legacy wishlist_items/completed_items 행도 함께 제거",
    ],
  },
  {
    version: "1.4.7",
    date: "2026-04-22",
    changes: [
      "카드 상세 모달 제목 인라인 편집 — 제목 클릭 시 input 전환, Enter/blur 로 저장, ESC 취소",
    ],
  },
  {
    version: "1.4.6",
    date: "2026-04-22",
    changes: [
      "'투표 및 선정' 탭이 drafting 중 designs 가 생성된 '선정 대기' 카드만 보여주도록 필터 분리",
      "'컨셉시트 생성' 탭은 sheet 상태 카드만 (기존 동일)",
      "상세 모달에 🗑️ 영구 삭제 버튼 추가 — 아카이브(soft)와 구분되는 복구 불가 작업",
    ],
  },
  {
    version: "1.4.5",
    date: "2026-04-22",
    changes: [
      "상세 모달의 아카이브 버튼이 상태 토글(🗄️ 아카이브 / 📤 복구)로 구분 표시",
      "이미지 클릭 시 원본 해상도 lightbox 뷰어 오픈 (상세 썸네일, 시안 그리드, 컨셉시트, 참조이미지)",
      "기존 레거시 '새 작업' (빈) 카드 클릭 시 자동으로 card 마이그레이션 + 상세 모달 오픈",
    ],
  },
  {
    version: "1.4.4",
    date: "2026-04-22",
    changes: [
      "'＋ 새 시안' 버튼이 레거시 job 대신 카드를 drafting 상태로 생성하고 상세 모달을 즉시 오픈",
      "시안 생성 탭에서 '새 작업' 카드를 열면 어셋 정보가 모달 안 AssetInfoEditor 에서 바로 편집",
      "기존 레거시 작업(화면 하단 전개)은 phase-out — 새로 만드는 작업은 전부 카드 모달 경로",
    ],
  },
  {
    version: "1.4.3",
    date: "2026-04-22",
    changes: [
      "어셋 정보(카테고리·스타일·프롬프트·참조이미지) 입력이 카드 상세 모달 안에서 인라인 자동 저장",
      "카드 생성은 최소 정보(제목 등)만, 세부 편집은 상세에서 점진적으로",
      "별도 '시안 생성 준비' 다이얼로그 제거 — 위시 → 시안 이동은 필수 필드 검증 후 바로 전환",
      "[버그 수정] 아카이브에서 복구 시 카드가 다시 보이지 않던 문제 해결 + 복구된 단계 탭으로 자동 전환",
    ],
  },
  {
    version: "1.4.2",
    date: "2026-04-22",
    changes: [
      "[버그 수정] 위시 → 시안 생성 이동 시 카드가 사라지던 문제 해결",
      "워크플로우 탭(시안 생성/투표/컨셉시트)이 이제 새 cards 시스템 카드도 그리드에 렌더",
      "CardHubCard 컴포넌트 추가 — 시안 개수 / 컨셉시트 생성 여부 / 스타일 등 표시",
      "탭 카운트 뱃지가 legacy jobs + 새 카드 합산",
      "카드 클릭 시 기존 통합 카드 모달 오픈 (Gemini 시안 생성 UI 바로 접근 가능)",
    ],
  },
  {
    version: "1.4.1",
    date: "2026-04-22",
    changes: [
      "위시 → 시안 생성 전환 시 자동으로 시안 생성 탭으로 이동 (이전엔 위시 탭에 머물러 카드를 못 찾음)",
      "카드 모달에서 status_key 가 바뀌면 그 단계에 해당하는 탭으로 자동 전환",
      "예: 시안 → 컨셉시트 → 완료 단계 이동 시 사용자도 함께 이동",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-22",
    changes: [
      "위시 → 시안 생성 전환 시 다이얼로그 추가 (카테고리·스타일·프롬프트·참조이미지 입력)",
      "Gemini 멀티모달 호출 — 참조 이미지를 inline_data 로 함께 전송하여 스타일 반영",
      "프롬프트 자동 enhance: 카테고리·스타일·스펙 힌트가 합성된 enhancedPrompt 사용",
      "위시 카드 썸네일이 자동으로 참조이미지 후보로 채워짐 (4개까지 추가 가능)",
      "참조 이미지는 /api/upload 거쳐 /data/images/ URL 로 보관",
    ],
  },
  {
    version: "1.3.3",
    date: "2026-04-22",
    changes: [
      "자동 복구 로직 강화 — 자동 복구가 실패해도 마지막 정상 버전으로 롤백",
      "auto-update 가 빌드/재시작 후 health 체크 — 실패 시 이전 커밋으로 자동 롤백",
      "health-check.ps1 이 pm2 상태까지 확인 후 필요 시 강제 rebuild + restart (4단계 복구)",
      "pm2 max_restarts 20 → 50, exp_backoff_restart_delay 추가로 일시 오류에 더 관대",
    ],
  },
  {
    version: "1.3.2",
    date: "2026-04-22",
    changes: [
      "상단 탭 순서: 위시리스트를 맨 앞으로 이동 (위시 → 시안 생성 → 투표 → 컨셉시트 → 완료)",
      "[버그 수정] 위시리스트 저장 실패 시 alert 로 명확히 알림 + 폼 초기화 차단 (재시도 가능)",
      "서버 기동 시 기존 wishlist_items / completed_items 자동으로 cards 로 이주 (npm run migrate:cards 불필요)",
      "ensureLegacyMigration: 레거시 row 마다 wish-<id> / comp-<id> 존재 여부 체크 후 없는 것만 복사",
    ],
  },
  {
    version: "1.3.1",
    date: "2026-04-22",
    changes: [
      "브라우저 연결 끊김 감지 + 자동 복구 UX 추가",
      "폴링 실패 시 상단에 노란색 '🔄 서버 재연결 중' 배너",
      "3회 연속 실패 시 빨간색 '⚠️ 서버 연결 실패' + 🔁 새로고침 버튼",
      "연결 끊김 상태에서는 폴링 주기가 5초 → 2초로 단축 (빠른 복구)",
      "복구되면 자동으로 배너 사라지고 정상 5초 주기 복귀",
      "/api/health 가 package.json 의 version 을 동적으로 노출",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04-22",
    changes: [
      "[Phase B-3] wishlist / completedList state 를 cards 에서 derived 로 완전 전환",
      "cards 가 single source of truth. 기존 wishlist_items / completed_items 테이블은 하위 호환으로만 유지",
      "카드 추가 시 setCards 로 즉시 UI 반영 (폴링 기다릴 필요 없음)",
      "위시리스트 카드 삭제 시 cards 테이블에서 삭제 (UI 즉시 갱신)",
      "[컨셉시트 카드 내부 생성] sheet 단계 카드 모달에서 '📑 컨셉시트 생성' 버튼으로 바로 PNG 제작",
      "생성된 컨셉시트는 썸네일 + 카드 썸네일 자동 갱신 + 다운로드 버튼 제공",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-22",
    changes: [
      "[Phase E] Gemini 시안 생성을 카드 내부 액션으로 통합",
      "카드 모달에 상태별 액션 패널: 아이디어 → 시안 생성 → 컨셉시트 → 완료",
      "아이디어 카드: '✨ 시안 생성 시작' 버튼으로 drafting 단계 진입",
      "시안 생성 카드: 카드 내부에서 Gemini로 1/2/4/8개 시안 추가 생성, 썸네일 그리드, 개별 삭제/선정",
      "시안 선정 시 자동으로 썸네일 갱신 + 컨셉시트 단계로 이동",
      "컨셉시트 카드: '✅ 최종 완료' 버튼으로 컨펌 + 잠금",
      "선정된 시안은 카드의 thumbnail_url 로 기록되어 그리드에서 바로 보임",
    ],
  },
  {
    version: "1.1.4",
    date: "2026-04-22",
    changes: [
      "[Phase F 마무리] 카드 모달에 🔓 재오픈 / 🗄️ 아카이브 버튼 추가",
      "헤더에 🗄️ 아카이브 버튼 — 보관된 카드 목록 모달 오픈, 카드 클릭 시 복구",
      "컨펌된(최종 완료) 카드 재오픈 시 force:true 로 잠금 해제 + 이력 기록",
      "활동 이력에 액션 필터 드롭다운 (모든 액션 / 상태 이동 / 필드 수정 / 댓글 / 완료·재오픈 / 생성)",
      "서버 GET /api/projects/:slug/cards?archived=1 엔드포인트 — 아카이브 전용 조회",
    ],
  },
  {
    version: "1.1.3",
    date: "2026-04-22",
    changes: [
      "[핫픽스] 서버가 UNIQUE 제약 위반으로 로그 폭주하던 문제 해결",
      "원인: 폴링으로 받은 서버 아이템을 debounce effect 가 '새 추가'로 오인해 중복 POST",
      "서버 측 POST /wishlist, /completed, /cards 가 중복 id 시 조용히 200 반환 (idempotent)",
      "클라이언트 측 폴링 merge 시 prevRef 도 동기화 → 다음 diff 가 재POST 하지 않음",
    ],
  },
  {
    version: "1.1.2",
    date: "2026-04-22",
    changes: [
      "[Phase F] 카드 컨펌 시점 JSON snapshot 자동 저장 (data/snapshots/)",
      "스냅샷에는 카드 + 체크리스트 + 첨부 + 댓글 + 활동 이력 전체 포함",
      "이후 수정/삭제되어도 snapshot 파일은 immutable 로 보존",
      "파일명: {card_id}__{timestamp}.json",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-04-22",
    changes: [
      "[Phase B-2] 위시리스트/완료 아이템 추가 시 cards 테이블에도 이중 저장",
      "[Phase D] 통합 카드 상세 모달 추가 — 상태 이동, 댓글, 활동 이력, data JSON 뷰어",
      "완료/위시리스트 카드 클릭 시 cards 에 있으면 새 통합 모달, 없으면 기존 모달 (자동 폴백)",
      "카드 상태 드롭다운으로 아이디어↔시안↔컨셉시트↔완료 단계 이동",
      "컨펌(완료) 카드는 모달에서 🔒 잠김 표시 + 댓글/상태 변경 불가",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-22",
    changes: [
      "앱 이름 변경: inZOI Concept Studio → inZOI Asset Studio",
      "[Phase A] 카드 기반 태스크 관리 DB 스키마 도입 (lists / cards / checklists / card_attachments / card_comments / card_activities / labels / members)",
      "기본 리스트 4개 자동 시드: 아이디어 / 시안 생성 / 컨셉시트 / 완료",
      "서버 API 추가: /api/projects/:slug/lists, /cards (CRUD, 댓글, 활동 이력)",
      "컨펌된 카드는 수정 방어, 상태 이동 시 card_activities 자동 기록",
    ],
  },
  {
    version: "1.0.1",
    date: "2026-04-21",
    changes: [
      "프로젝트 URL 개념 제거 — 팀 전체가 단일 'default' 프로젝트 공유",
      "헤더에서 🔗 공유 URL 버튼 제거, 저장 상태 표시로 대체",
      "워크플로우 탭 진입 시 카드 그리드만 표시, 아래 입력/단계 UI 는 숨김",
      "카드 클릭 또는 ＋ 새 시안 누를 때만 상세 UI 전개",
      "상세 헤더에 '← 목록으로' 버튼 추가로 쉽게 그리드 복귀",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-21",
    changes: [
      "[UX 대개편] 각 워크플로우 탭을 카드 허브로 전환",
      "시안 생성 탭 — 시안 여러 개 동시 관리, 각 카드 클릭 시 갤러리로 진입",
      "투표 및 선정 탭 — 생성된 시안 리스트가 카드 그리드로 표시, 카드마다 투표자/득표 현황",
      "컨셉시트 생성 탭 — 선정된 작업 리스트, 시트 생성/검토 상태 한눈에",
      "탭 상단에 '＋ 새 시안' 버튼 + 작업 개수 안내",
      "기존 step 기반 단계 UI 는 카드 하단에 '선택된 작업 진행' 섹션으로 통합",
    ],
  },
  {
    version: "0.9.10",
    date: "2026-04-21",
    changes: [
      "[중대] 이미지 저장소를 파일시스템으로 분리 — /api/upload → data/images/{uuid}.png",
      "Gemini 시안, 컨셉시트 PNG, 위시 첨부 이미지 모두 서버 파일로 저장 후 URL 만 DB 에 보관",
      "위시리스트 추가 시 await POST 로 즉시 동기 저장 (새로고침 안전)",
      "위시리스트 폼 버튼이 이미지 업로드 완료까지 기다린 후 완료 처리",
      "[버그 수정] DB 2MB row 제한 때문에 이미지가 null 저장되던 문제 근본 해결",
    ],
  },
  {
    version: "0.9.9",
    date: "2026-04-21",
    changes: [
      "위시리스트 카드 클릭 시 상세 정보 모달 추가 — 큰 이미지/제목/메모/등록일시/삭제/다운로드",
      "위시리스트 카드의 메모는 2줄까지만 표시(ellipsis), 클릭하면 전체 내용 확인",
      "삭제 버튼은 카드/모달 양쪽에 제공",
    ],
  },
  {
    version: "0.9.8",
    date: "2026-04-21",
    changes: [
      "[버그 수정] 파이프라인 전송 완료 직후 새로고침하면 완료 목록에서 사라지던 문제 해결",
      "파이프라인 전송 시 즉시 서버에 저장 (await) 후 로컬 반영 — 500ms debounce 대기 없이 확정",
      "beforeunload/pagehide 이벤트에서 sendBeacon 으로 보류 중인 변경사항 긴급 전송",
      "앱 시작 시 서버 스냅샷으로 prev refs 초기화 — 불필요한 중복 POST 방지",
    ],
  },
  {
    version: "0.9.7",
    date: "2026-04-21",
    changes: [
      "상단 메뉴를 5단계로 재편 — 시안 생성 / 투표 및 선정 / 컨셉시트 생성 / 완료 목록 / 위시리스트",
      "각 탭은 담당 step 범위(0-1 / 2-3 / 4-6)의 작업 개수를 뱃지로 표시",
      "탭 클릭 시 해당 단계의 작업으로 자동 전환, 없으면 친절한 empty-state 안내",
      "step 이 바뀌면 자동으로 맞는 탭으로 이동 (예: 투표 시작 시 '투표 및 선정' 탭으로)",
      "'＋ 새 시안' 버튼은 모든 워크플로우 탭에서 사용 가능",
    ],
  },
  {
    version: "0.9.6",
    date: "2026-04-21",
    changes: [
      "사내 서버 자동 운영 강화 — 5분마다 git pull + 재빌드 + pm2 restart 자동",
      "2분마다 /api/health 헬스체크 실패 시 자동 복구 (pm2 restart → 실패 시 cold start)",
      "ecosystem.config.cjs 로 pm2 설정 체계화 (max_restarts 20, restart_delay 5s, 메모리 1GB 초과 시 재시작)",
      "재부팅 시 pm2-windows-startup 이 프로세스 자동 복구",
      "logs/ 디렉토리에 auto-update.log, health-check.log, pm2-*.log 남김",
      "better-sqlite3 v12.9.0 (Node v24 prebuild 공식 지원)",
    ],
  },
  {
    version: "0.9.5",
    date: "2026-04-21",
    changes: [
      "원클릭 자동 설치 스크립트 추가 — install.ps1 / install.bat / bootstrap.ps1",
      "관리자 PowerShell 한 줄로 Node/Git 설치 + clone + build + 방화벽 + pm2 + 백업 스케줄러 전부 자동화",
      "update.bat: GitHub 최신 코드 pull + 재빌드 + pm2 재시작 원클릭",
      "uninstall.ps1: pm2/방화벽/백업 작업 등록 해제 (데이터 보존)",
    ],
  },
  {
    version: "0.9.4",
    date: "2026-04-21",
    changes: [
      "사내 PC 배포 지원 — Node + Hono + SQLite 단일 서버 추가 (server.js)",
      "start.bat / start.sh 원클릭 실행 스크립트",
      "data/ 폴더 기반 로컬 저장 (SQLite + 이미지 파일시스템)",
      "scripts/backup.js 로 data/ 폴더 타임스탬프 백업",
      "기존 Cloudflare 스택은 레거시로 유지 — 사내 운영자 PC 안정화 후 제거 예정",
      "상세 배포 가이드: README-사내배포.md",
    ],
  },
  {
    version: "0.9.3",
    date: "2026-04-21",
    changes: [
      "[버그 수정] 완료 목록 항목이 사라지던 문제 해결 — 폴링이 서버 빈 응답으로 로컬 신규 항목 덮어쓰는 경쟁 조건 제거",
      "대용량 base64 이미지(컨셉시트 등)가 D1 row 제한(2MB)을 넘지 않도록 저장 시 800KB 초과하면 자동 생략 (세션 내 표시는 유지)",
      "완료 목록/위시리스트 폴링 merge 로직 추가 — 로컬에만 있는 아이템 보존",
      "향후 R2 마이그레이션으로 근본 해결 예정",
    ],
  },
  {
    version: "0.9.2",
    date: "2026-04-21",
    changes: [
      "디자인 시안 카드 클릭 시 이미지 확대 모달 (갤러리 스텝)",
      "확대 모달에서 PNG 로컬 저장 버튼 제공",
      "모달 하단에 사용된 프롬프트도 함께 표시",
    ],
  },
  {
    version: "0.9.1",
    date: "2026-04-21",
    changes: [
      "위시리스트에 Ctrl+V 클립보드 이미지 붙여넣기 지원",
      "시안 개수 기본값을 4개 → 1개로 변경 (필요 시 2/4/8 선택)",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-04-21",
    changes: [
      "Cloudflare D1 백엔드 연동 — 모든 작업/완료목록/위시리스트가 서버에 저장",
      "프로젝트 URL 공유 기능 — /p/{slug} URL 로 팀원과 동일 프로젝트 공유",
      "5초 간격 자동 동기화 — 다른 사람 변경사항이 자동 반영",
      "헤더 우측에 프로젝트 URL 버튼 추가 (클릭 시 공유 URL 복사)",
      "localStorage 의존성 제거 — 이제 새로고침/다른 브라우저에서도 동일 데이터",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-04-21",
    changes: [
      "시안 N개 동시 생성 — 입력 폼에 \"시안 개수\" 선택 (1/2/4/8) 추가",
      "Gemini API 병렬 호출 (최대 동시 4개 쓰로틀링으로 레이트 리밋 회피)",
      "큐 패널 진행률이 완료된 시안 개수 표시 (예: 3/4)",
      "1개만 생성 시 투표 건너뛰고 자동 선정으로 진행",
      "일부 시안 실패 시에도 성공한 것은 갤러리에 표시 (부분 실패 허용)",
    ],
  },
  {
    version: "0.7.1",
    date: "2026-04-21",
    changes: [
      "시안 생성을 완전 백그라운드 작업으로 전환 — \"생성중\" 화면 없이 입력 폼 유지",
      "생성 클릭 시 새 빈 작업으로 자동 전환되어 다음 어셋을 바로 입력 가능",
      "진행 상황은 우측 하단 큐 패널에서만 표시, 메인 화면은 방해받지 않음",
      "생성 중인 작업 카드 클릭 시 버튼 비활성화로 중복 제출 방지",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-04-20",
    changes: [
      "시안 작업 큐 도입 — 여러 시안을 동시에 백그라운드에서 생성",
      "전체화면 로딩 오버레이 제거, 우측 하단 플로팅 큐 패널로 진행 상황 표시",
      "헤더 \"＋ 새 시안\" 버튼으로 진행 중 작업 유지한 채 새 작업 시작",
      "완료된 컨셉시트 클릭 시 대형 모달에 전체 정보/이미지 표시",
      "완료 목록·위시리스트 localStorage 자동 저장 (새로고침해도 유지)",
      "컨셉시트 전 뷰에 동일 디자인 공유 (정면/측면/후면/디테일 자동 변형)",
      "컨셉시트 캔버스 한글 라벨 + 라이트 테마 통일",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-03-27",
    changes: [
      "나노바나나2 (Gemini 3.1 Flash Image) API 연동으로 실제 이미지 생성",
      "API 키 설정 패널 추가 (Gemini / Claude)",
      "멀티뷰 컨셉시트 실제 이미지 생성",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-03-06",
    changes: [
      "inZOI Canvas 브랜드 디자인 시스템 적용",
      "컬러 팔레트 변경 (indigo → inZOI blue/skyblue)",
      "Pretendard 한글 폰트 추가",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-03-05",
    changes: [
      "완료 목록 카드에 대형 이미지 썸네일 추가",
      "위시리스트 기능 추가 (이미지 첨부, 메모)",
      "사이드바 탭 UI (완료 목록 / 위시리스트)",
      "샘플 데이터 10개씩 확장",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-03-04",
    changes: [
      "완료된 컨셉시트 리스트 사이드 패널 추가",
      "파이프라인 전송 완료 시 자동 목록 추가",
      "버전 정보 및 변경내역 팝업 추가",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-03-01",
    changes: [
      "투표 및 시안 선정 워크플로우 추가",
      "다중 투표자 지원",
      "동점 시 수동 선정 기능",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-28",
    changes: [
      "초기 프로토타입",
      "AI 기반 프롬프트 최적화 (Claude API)",
      "카테고리별 가구 컨셉 생성",
      "멀티뷰 컨셉시트 생성",
      "에셋 메타데이터 JSON 내보내기",
    ],
  },
];

// ─── Sample Completed Data ───
const SAMPLE_COMPLETED = [
  {
    id: 1, category: "sofa", categoryLabel: "소파", categoryIcon: "🛋️",
    assetCode: "FRN-LIV-0041", designer: "박지수",
    style: "미드센추리 모던",
    prompt: "1960년대 덴마크 가구 디자인에서 영감을 받은 3인용 소파. 테이퍼드 월넛 원목 다리(높이 18cm), 버터스카치 컬러 풀그레인 가죽 시트, 쿠션은 덕다운 혼합 충전재로 살짝 꺼지는 느낌. 등받이 높이는 낮게 유지해 공간이 답답해 보이지 않도록. 인게임 거실 럭셔리 세트 메인 피스로 활용 예정.",
    seed: 1847293650, colors: ["#c4874a", "#d4af6e", "#3b2a1a", "#f5e8d5", "#1a0f0a"],
    gradient: "linear-gradient(135deg, #1c1410 0%, #3d2b18 50%, #1c1410 100%)",
    completedAt: "2026-02-14T11:20:00", voters: 7, winner: "시안 2",
    pipelineStatus: "텍스처링 진행중",
    imageUrl: "/images/sofa.jpg",
  },
  {
    id: 2, category: "bed", categoryLabel: "침대", categoryIcon: "🛏️",
    assetCode: "FRN-BED-0018", designer: "김도현",
    style: "재패니즈 모던",
    prompt: "일본 선(禅) 미학 기반의 로우 플랫폼 침대. 훈증 처리 아시안 참나무(Smoked Oak) 프레임, 침대 높이는 바닥에서 매트리스 상단까지 38cm로 제한. 헤드보드는 세로 그루브 음각 패턴, 탈착식 나이트스탠드 확장 모듈 포함. 침구류와 분리된 별도 mesh로 소재 커스터마이징 가능하게 구성. 시크릿 서랍 2개 hidden in frame.",
    seed: 982736451, colors: ["#8b7355", "#c4a882", "#3d3228", "#f0e8d8", "#1e1812"],
    gradient: "linear-gradient(135deg, #1a1410 0%, #2e2418 50%, #1a1410 100%)",
    completedAt: "2026-02-17T15:40:00", voters: 6, winner: "시안 5",
    pipelineStatus: "LOD 작업 대기",
    imageUrl: "/images/bed.jpg",
  },
  {
    id: 3, category: "desk", categoryLabel: "책상", categoryIcon: "🖥️",
    assetCode: "FRN-STD-0029", designer: "이승민",
    style: "테크 미니멀",
    prompt: "홈오피스/서재 세트용 L자형 전동 스탠딩 데스크. 컬러: 매트 블랙 파우더코팅 스틸 프레임 + 화이트 오크 합판 상판(두께 28mm). 상판 후면에 케이블 정리 트레이 내장, 상판 우측에 USB-C·USB-A 빌트인 허브 소켓 표현. 높이 조절 모터 기둥 디테일 살리되 인게임 폴리 예산 내 표현. 모니터 암 홀 위치 정면 중앙 상단.",
    seed: 574839201, colors: ["#1a1a1a", "#4a4a4a", "#c8bfa8", "#f0ede8", "#2a2a2a"],
    gradient: "linear-gradient(135deg, #111111 0%, #2a2a2a 50%, #111111 100%)",
    completedAt: "2026-02-19T09:15:00", voters: 8, winner: "시안 4",
    pipelineStatus: "QA 완료",
    imageUrl: "/images/desk.jpg",
  },
  {
    id: 4, category: "dining-table", categoryLabel: "식탁", categoryIcon: "🍽️",
    assetCode: "FRN-DIN-0033", designer: "박지수",
    style: "내추럴 러스틱",
    prompt: "라이브 엣지 슬랩 6인 식탁. 수령 80년 이상 아카시아 원목 상판, 자연스러운 결 살리고 에폭시 크랙 충전 표현(에폭시 컬러 클리어). 하부 다리는 헤어핀 스타일 블랙 파우더코팅 강철(Ø12mm 환봉 3발), 높이 73cm 준수. 상판 두께는 두껍게(60mm) 표현해야 원목의 존재감 살아남. 일부 버클 포함한 우드 결 텍스처 필수.",
    seed: 1293847560, colors: ["#a0784a", "#c8a06a", "#2a2a2a", "#f0e4ce", "#6b4c2a"],
    gradient: "linear-gradient(135deg, #1a1008 0%, #3a2410 50%, #1a1008 100%)",
    completedAt: "2026-02-21T16:00:00", voters: 5, winner: "시안 7",
    pipelineStatus: "모델링 진행중",
    imageUrl: "/images/dining-table.jpg",
  },
  {
    id: 5, category: "bathtub", categoryLabel: "욕조", categoryIcon: "🛁",
    assetCode: "FRN-BTH-0007", designer: "최연재",
    style: "럭셔리 스파",
    prompt: "프리스탠딩 오벌 욕조, 페블 그레이 무광 세라믹 외관에 내부는 글로시 화이트. 클로우풋 디자인 아닌 슬림 패디스탈 베이스(높이 12cm). 황동 매트 골드 수전(캐스케이드 타입 스파우트)과 핸드샤워 홀더 세트 포함. 욕조 테두리에 티크 우드 배스 트레이 올려놓은 연출 포함. 물 채웠을 때 수면 shader를 위한 내부 rim 깊이 표현 명확히.",
    seed: 738291045, colors: ["#c8c0b4", "#d4af6e", "#f8f4f0", "#8a8078", "#2a2418"],
    gradient: "linear-gradient(135deg, #1e1c18 0%, #3a3628 50%, #1e1c18 100%)",
    completedAt: "2026-02-24T13:30:00", voters: 9, winner: "시안 3",
    pipelineStatus: "텍스처링 완료",
    imageUrl: "/images/bathtub.jpg",
  },
  {
    id: 6, category: "bookshelf", categoryLabel: "책장", categoryIcon: "📚",
    assetCode: "FRN-STD-0031", designer: "김도현",
    style: "인더스트리얼 빈티지",
    prompt: "6단 오픈형 서재 책장, 1인치 블랙 파이프 + 유니온 피팅 프레임 구조. 선반판은 재활용 전신주 소재처럼 보이는 헤비 웨더드 오크(짙은 탄화 처리). 선반 간격: 하단 2단 300mm(대형 서적용), 상단 4단 240mm. 상단 좌측 코너에 장식용 스팟라이트 클립온 포함. 벽 고정 브라켓도 디테일로 표현. 볼트·너트 디테일 클로즈업 텍스처 필수.",
    seed: 219384756, colors: ["#3a3028", "#6a5a48", "#c8b89a", "#1e1814", "#f0e4d0"],
    gradient: "linear-gradient(135deg, #181410 0%, #2e2418 50%, #181410 100%)",
    completedAt: "2026-02-26T10:45:00", voters: 4, winner: "시안 6",
    pipelineStatus: "QA 완료",
    imageUrl: "/images/bookshelf.jpg",
  },
  {
    id: 7, category: "office-chair", categoryLabel: "사무용 의자", categoryIcon: "💺",
    assetCode: "FRN-STD-0034", designer: "이승민",
    style: "인체공학 모던",
    prompt: "고급형 인체공학 메쉬 오피스 체어. 등판: 3D 에어메쉬(다크 챠콜), 좌판: 폼 쿠션 + 브레더블 패브릭. 뒷면 럼버 서포트 노브 디테일, 4방향 조절 팔걸이(높이+너비+각도+전후). 실버 알루미늄 5발 베이스(Ø65mm 듀얼 캐스터 표현). 헤드레스트는 분리 가능한 듯한 디테일. 틸트 텐션 다이얼 좌측 하단. 배색: 챠콜×실버×블랙.",
    seed: 364718290, colors: ["#3a3a3a", "#5a5a5a", "#c0c0c8", "#1a1a1a", "#e8e8f0"],
    gradient: "linear-gradient(135deg, #0f0f14 0%, #1e1e28 50%, #0f0f14 100%)",
    completedAt: "2026-02-28T14:20:00", voters: 6, winner: "시안 1",
    pipelineStatus: "모델링 진행중",
    imageUrl: "/images/office-chair.jpg",
  },
  {
    id: 8, category: "wardrobe", categoryLabel: "옷장", categoryIcon: "🚪",
    assetCode: "FRN-BED-0022", designer: "최연재",
    style: "컨템포러리 미니멀",
    prompt: "빌트인처럼 보이는 슬라이딩 도어 4도어 워드로브(W240×D65×H230cm). 도어 패널: 무광 화이트 래커 + 슬림 알루미늄 프레임(20mm 폭). 좌측 2도어: 상하 행거 공간, 우측 2도어: 서랍 4단 + 선반 3단. 도어 하단에 숨겨진 LED 간접조명 라인. 손잡이 없는 push-to-open 방식, 상단 코너에 통풍 슬릿 표현. 내부 구성 도어 오픈 시 보여야 함.",
    seed: 847562913, colors: ["#f0f0ec", "#d8d8d4", "#a0a09c", "#2a2a28", "#1a1a18"],
    gradient: "linear-gradient(135deg, #1c1c1a 0%, #2e2e2c 50%, #1c1c1a 100%)",
    completedAt: "2026-03-03T09:00:00", voters: 7, winner: "시안 2",
    pipelineStatus: "텍스처링 진행중",
    imageUrl: "/images/wardrobe.jpg",
  },
  {
    id: 9, category: "dining-chair", categoryLabel: "식탁 의자", categoryIcon: "🪑",
    assetCode: "FRN-DIN-0035", designer: "박지수",
    style: "스칸디나비안 오가닉",
    prompt: "유기적 곡선형 쉘 체어. 원피스 몰딩 너도밤나무(Beech) 베니어 쉘, 표면 자연 오일 왁스 피니시. 좌면에 얇은 폼+패브릭 쿠션패드 탈부착 가능. 4각 테이퍼드 다리 오크(높이 44cm 좌면). 다리와 쉘 연결부 금속 볼트 헤드 노출 디테일. 어두운 배경의 인게임 식당·카페 씬 모두 어울리는 뉴트럴 컬러 우선. 식탁 FRN-DIN-0033과 세트 연출.",
    seed: 591028374, colors: ["#c8b090", "#e8d8c0", "#8a7060", "#f8f0e4", "#3a2e24"],
    gradient: "linear-gradient(135deg, #1c1610 0%, #3028 50%, #1c1610 100%)",
    completedAt: "2026-03-05T11:10:00", voters: 5, winner: "시안 3",
    pipelineStatus: "컨셉 승인 완료",
    imageUrl: "/images/dining-chair.jpg",
  },
  {
    id: 10, category: "fireplace", categoryLabel: "벽난로", categoryIcon: "🔥",
    assetCode: "FRN-LIV-0043", designer: "이승민",
    style: "모던 클래식",
    prompt: "빌트인 전기 벽난로(실제 불꽃 없는 LED 에뮬레이션 표현). 외부 케이스: 크림 화이트 마블 패턴 세라믹 타일 + 무광 블랙 스틸 인서트 프레임. 내부 로그 및 불꽃은 animated texture로 처리. 상부 맨틀피스 폭 160cm, 대리석 느낌 상판. 벽 매립 깊이 표현(음각 30cm). 인게임 럭셔리 거실·리조트 로비 배경에 배치 예정. 파이어 파티클 이펙트 연동 소켓 위치 명기.",
    seed: 482917365, colors: ["#f0ece4", "#c8c0b0", "#1a1a1a", "#d0c8b8", "#4a4a48"],
    gradient: "linear-gradient(135deg, #181814 0%, #2e2e28 50%, #181814 100%)",
    completedAt: "2026-03-06T16:30:00", voters: 8, winner: "시안 5",
    pipelineStatus: "최종 검토중",
    imageUrl: "/images/fireplace.jpg",
  },
];

// ─── Sample Wishlist Data ───
const SAMPLE_WISHLIST = [
  {
    id: 101,
    title: "체스터필드 3인 소파 — 코냑 브라운",
    note: "영국 빅토리아 시대 클럽하우스 분위기. 에이징 처리 풀그레인 가죽, 딥버튼 터프팅, 롤드 암레스트. 클래식 빌라·저택 씬에 필요. 현재 럭셔리 거실 세트에 소파가 미드센추리뿐이라 시대감 다양화 필요. 가죽 소재는 기존 FRN-LIV-0041과 공용 머티리얼 활용 가능할 듯.",
    imageUrl: "/images/wish-sofa.jpg", gradient: "linear-gradient(135deg, #2a1a0c 0%, #4a2e14 50%, #2a1a0c 100%)",
    createdAt: "2026-02-10T10:30:00",
  },
  {
    id: 102,
    title: "커브드 페이퍼 펜던트 조명",
    note: "한국 한지 느낌의 플리츠 페이퍼 쉐이드 펜던트. 인게임 카페·티하우스 씬 분위기용. 빛 투과 shader가 관건 — 내부 광원이 종이 결을 통해 새어나오는 표현 필요. 유사 레퍼런스: 이세이 미야케 헝가마마 램프. 폴리는 낮게 유지하되 실루엣의 섬세함 살려야.",
    imageUrl: "/images/wish-lamp.jpg", gradient: "linear-gradient(135deg, #2a2418 0%, #3e3428 50%, #2a2418 100%)",
    createdAt: "2026-02-12T14:00:00",
  },
  {
    id: 103,
    title: "테라조 사이드 테이블 — 핑크 베이지",
    note: "핑크×그레이×화이트 칩 혼합 테라조 원형 상판(Ø50cm), 황동 매트 3발 다리. 카페·홈오피스 액세서리 오브젝트로 활용도 높음. 텍스처 해상도가 중요 — 테라조 칩 패턴이 뭉개지지 않도록 2K 이상 디퓨즈 텍스처 필요. 기존 커피 테이블 라인업(저상형)과 높이 차별화해서 소품 연출용으로.",
    imageUrl: "/images/wish-table.jpg", gradient: "linear-gradient(135deg, #2e2428 0%, #3e3034 50%, #2e2428 100%)",
    createdAt: "2026-02-15T09:20:00",
  },
  {
    id: 104,
    title: "모듈형 큐브 수납장 — 오픈+도어 혼합",
    note: "12칸 4×3 그리드 구성, 오픈 칸과 도어 칸 교차 배치. 도어는 루버 슬릿 스타일 또는 패브릭 패널 두 가지 바리에이션. 컬러: 화이트 + 내추럴 오크 혼합. 인게임 서재·드레스룸에 모두 쓸 수 있는 유연한 디자인 필요. IKEA KALLAX 구조 참고하되 퀄리티 레벨 올려서. 모듈 단위로 메쉬 분리해서 구성 커스텀 가능하게.",
    imageUrl: "/images/wish-storage.jpg", gradient: "linear-gradient(135deg, #1e1e1c 0%, #3a3832 50%, #1e1e1c 100%)",
    createdAt: "2026-02-18T16:45:00",
  },
  {
    id: 105,
    title: "반려동물용 빌트인 캣워크 선반",
    note: "벽면 부착형 플로팅 선반 3단 세트, 고양이 이동 동선 고려한 지그재그 배치. 선반 표면은 사이잘 로프 텍스처(스크래칭 방지 소재). 하단 유닛에는 가리개 있는 캣 하우스 포함. 반려동물 인터랙션 연동 소켓 위치 확정 필요. inZOI 내 펫 시스템 추가 예정과 맞물려 우선순위 높음 — 담당 PM에게 로드맵 확인 요청 중.",
    imageUrl: "/images/wish-catshelf.jpg", gradient: "linear-gradient(135deg, #1e1c14 0%, #342e20 50%, #1e1c14 100%)",
    createdAt: "2026-02-20T11:00:00",
  },
  {
    id: 106,
    title: "플로팅 벽부착 협탁 — 오크+블랙",
    note: "벽 고정 브라켓 숨긴 플로팅 협탁, 서랍 1단 + 오픈 선반 1단. 화이트 오크 상판 + 블랙 하단 박스 투톤. 침대 세트 FRN-BED-0018에 맞춰 높이 기준은 침대 매트리스 상단(38cm)에서 +5cm 정도로. 벽면 설치 애니메이션 필요 여부는 UX팀 논의 중. 충전 케이블용 홀 후면에 표현 부탁.",
    imageUrl: "/images/wish-nightstand.jpg", gradient: "linear-gradient(135deg, #1a1610 0%, #2e2820 50%, #1a1610 100%)",
    createdAt: "2026-02-23T15:30:00",
  },
  {
    id: 107,
    title: "야외 라운지 데이베드",
    note: "풀사이드·루프탑 씬용 야외 데이베드. 쿠션은 스트라이프 패턴 아웃도어 패브릭(흰색+베이지), 프레임은 내부식 알루미늄 파우더코팅 화이트. 차양 캐노피 탈부착 구성 필요(접힌 상태·펼친 상태 2종). 인게임 리조트·펜트하우스 루프탑 씬에 배치 예정. 날씨 시스템 연동해서 비올 때 캐노피 자동 펼쳐지는 인터랙션도 제안 중.",
    imageUrl: "/images/wish-daybed.jpg", gradient: "linear-gradient(135deg, #1c2028 0%, #2c3040 50%, #1c2028 100%)",
    createdAt: "2026-02-25T17:20:00",
  },
  {
    id: 108,
    title: "빈티지 바 카트 — 황동+유리",
    note: "2단 바 카트, 상단 트레이에 유리잔·보틀 오브젝트 연출. 황동 파이프 프레임 + 강화유리 선반. 바퀴 4개(잠금 디테일 있는 스윙 캐스터). 높이 85cm, 폭 65cm 정도. 현재 주방/거실 씬에 고급 오브젝트 수량이 부족해 우선순위 높음. 보틀·유리잔은 별도 Props 팀과 협업 — 이미 스케줄 조율 중. 황동 컬러는 FRN-BTH-0007 욕조 수전 머티리얼 재활용 가능.",
    imageUrl: "/images/wish-barcart.jpg", gradient: "linear-gradient(135deg, #1e1c10 0%, #3a3418 50%, #1e1c10 100%)",
    createdAt: "2026-02-27T13:00:00",
  },
  {
    id: 109,
    title: "일본식 다도실 좌식 테이블",
    note: "히노키 원목 로우 테이블(H33cm), 접이식 다리 구조(접힌 상태도 메쉬 필요). 상판 테두리에 옻칠 느낌의 무광 블랙 마감선. 다다미방·일본식 정원 씬용. 좌식 쿠션(자부통) 별도 Props와 세트 연출 예정. 사용자 앉기 인터랙션은 캐릭터 좌식 포즈 애니메이션팀과 연동 필요 — 담당자 김주완 팀장.",
    imageUrl: "/images/wish-tatami.jpg", gradient: "linear-gradient(135deg, #1a1810 0%, #2e2c1c 50%, #1a1810 100%)",
    createdAt: "2026-03-01T09:45:00",
  },
  {
    id: 110,
    title: "투명 폴리카보네이트 쉘 체어",
    note: "루이 고스트 체어 레퍼런스. 전면 투명 소재 특성상 배경 굴절·반사 shader 처리가 핵심. 작은 공간 씬에서 시각적 개방감 확보 목적. 좌면 하단의 다리 연결부 몰드 라인 디테일 정확히 표현 필요. 투명 소재 특성상 폴리카운트 대비 퀄리티 확보 어려움 — 렌더팀에 사전 shader 테스트 요청할 것.",
    imageUrl: "/images/wish-chair.jpg", gradient: "linear-gradient(135deg, #141428 0%, #1e1e3c 50%, #141428 100%)",
    createdAt: "2026-03-04T14:30:00",
  },
];

// ─── Constants ───
// 기본(fallback) 카테고리 목록. 서버 /api/object-meta 가 inzoiObjectList
// meta.json 을 변환해 내려주면 런타임에 교체된다.
let FURNITURE_CATEGORIES = [
  // ── 침실 (572) ──
  { id: "bed", label: "침대", icon: "🛏️", room: "침실", preset: "bed frame with headboard, bedroom furniture" },
  { id: "kids-bed", label: "어린이 침대", icon: "🧒", room: "침실", preset: "children's bed, kids bedroom furniture" },
  { id: "vanity", label: "화장대", icon: "🪞", room: "침실", preset: "vanity table with mirror, dressing furniture" },
  { id: "nightstand", label: "협탁", icon: "🛋️", room: "침실", preset: "nightstand, bedside table" },
  { id: "wardrobe", label: "옷장", icon: "🚪", room: "침실", preset: "wardrobe closet, clothing storage" },
  { id: "dresser-bed", label: "장식장", icon: "🗄️", room: "침실", preset: "decorative cabinet, display case" },
  { id: "storage-bed", label: "수납장", icon: "📦", room: "침실", preset: "storage cabinet, chest of drawers" },
  { id: "rug-bed", label: "러그", icon: "🟫", room: "침실", preset: "area rug, floor carpet" },
  { id: "mirror-wall", label: "벽 거울", icon: "🪞", room: "침실", preset: "wall-mounted mirror" },
  { id: "mirror-stand", label: "스탠드 거울", icon: "🪞", room: "침실", preset: "standing floor mirror" },
  { id: "ceiling-light", label: "천장 조명", icon: "💡", room: "침실", preset: "ceiling light, pendant lamp" },
  { id: "stand-light", label: "스탠드 조명", icon: "🪔", room: "침실", preset: "floor lamp, standing light" },
  { id: "table-light", label: "테이블 조명", icon: "🔦", room: "침실", preset: "table lamp, desk light" },
  { id: "wall-light", label: "벽 조명", icon: "💡", room: "침실", preset: "wall sconce, wall-mounted light" },
  // ── 거실 (686) ──
  { id: "sofa", label: "소파", icon: "🛋️", room: "거실", preset: "sofa, upholstered seating, living room couch" },
  { id: "cushion", label: "쿠션", icon: "🟨", room: "거실", preset: "decorative cushion, throw pillow" },
  { id: "chair-living", label: "의자", icon: "💺", room: "거실", preset: "accent chair, living room chair" },
  { id: "table-living", label: "테이블", icon: "🪑", room: "거실", preset: "coffee table, living room table" },
  { id: "shelf-living", label: "선반", icon: "📚", room: "거실", preset: "bookshelf, wall shelf, display shelf" },
  { id: "fireplace", label: "벽난로", icon: "🔥", room: "거실", preset: "fireplace, mantelpiece" },
  { id: "tv", label: "TV", icon: "📺", room: "거실", preset: "television, flat screen TV" },
  { id: "tv-stand", label: "TV 스탠드", icon: "📺", room: "거실", preset: "TV stand, media console" },
  { id: "audio", label: "음향기기", icon: "🔊", room: "거실", preset: "audio speaker, sound system" },
  // ── 주방 (692) ──
  { id: "dining-table", label: "식탁", icon: "🍽️", room: "주방", preset: "dining table, kitchen table" },
  { id: "dining-chair", label: "식탁 의자", icon: "🪑", room: "주방", preset: "dining chair, kitchen chair" },
  { id: "counter", label: "조리대/싱크대", icon: "🚰", room: "주방", preset: "kitchen counter, sink cabinet" },
  { id: "kitchen-storage", label: "주방 수납", icon: "🗄️", room: "주방", preset: "kitchen cabinet, pantry storage" },
  { id: "kitchen-appliance", label: "주방 가전", icon: "🍳", room: "주방", preset: "kitchen appliance, cooking equipment" },
  // ── 욕실 (529) ──
  { id: "bathtub", label: "욕조", icon: "🛁", room: "욕실", preset: "bathtub, freestanding bath" },
  { id: "toilet", label: "변기", icon: "🚽", room: "욕실", preset: "toilet, bathroom fixture" },
  { id: "sink-bath", label: "세면대", icon: "🚿", room: "욕실", preset: "bathroom sink, vanity basin" },
  { id: "bath-storage", label: "욕실 수납", icon: "🧴", room: "욕실", preset: "bathroom cabinet, storage shelf" },
  // ── 서재 (639) ──
  { id: "desk", label: "책상", icon: "🖥️", room: "서재", preset: "desk, study desk, workspace table" },
  { id: "office-chair", label: "사무용 의자", icon: "💺", room: "서재", preset: "office chair, desk chair" },
  { id: "bookshelf", label: "책장", icon: "📚", room: "서재", preset: "bookcase, book shelf" },
  { id: "desk-storage", label: "서재 수납", icon: "🗄️", room: "서재", preset: "filing cabinet, desk organizer" },
  // ── 야외공간 (444) ──
  { id: "outdoor-chair", label: "야외 의자", icon: "🪑", room: "야외공간", preset: "outdoor chair, patio chair, garden seating" },
  { id: "outdoor-table", label: "야외 테이블", icon: "🏖️", room: "야외공간", preset: "outdoor table, patio table, garden table" },
  { id: "planter", label: "화분/화단", icon: "🪴", room: "야외공간", preset: "planter pot, flower bed, garden planter" },
  { id: "outdoor-deco", label: "야외 장식", icon: "🏡", room: "야외공간", preset: "outdoor decoration, garden ornament" },
  // ── 취미 (128) ──
  { id: "hobby-music", label: "악기", icon: "🎸", room: "취미", preset: "musical instrument" },
  { id: "hobby-sports", label: "운동기구", icon: "🏋️", room: "취미", preset: "exercise equipment, fitness gear" },
  { id: "hobby-game", label: "게임/오락", icon: "🎮", room: "취미", preset: "gaming furniture, entertainment setup" },
  // ── 소셜 이벤트 (246) ──
  { id: "party", label: "파티 용품", icon: "🎉", room: "소셜 이벤트", preset: "party decoration, event furniture" },
  { id: "wedding", label: "웨딩", icon: "💒", room: "소셜 이벤트", preset: "wedding decoration, ceremony furniture" },
  // ── 기타 (306) ──
  { id: "pet", label: "반려동물", icon: "🐾", room: "기타", preset: "pet furniture, pet bed, pet house" },
  { id: "plant-indoor", label: "실내 화분", icon: "🪴", room: "기타", preset: "indoor plant pot, houseplant" },
  { id: "other", label: "기타 가구", icon: "🏠", room: "기타", preset: "miscellaneous furniture piece" },
  // ── 건축 ──
  { id: "wall", label: "벽지", icon: "🧱", room: "벽", preset: "wall, wallpaper, wall panel" },
  { id: "wall-trim", label: "몰딩/트림", icon: "📏", room: "벽", preset: "wall trim, molding, baseboard" },
  { id: "wall-deco", label: "벽 장식", icon: "🖼️", room: "벽", preset: "wall decoration, wall art" },
  { id: "floor-tile", label: "바닥 타일", icon: "🟫", room: "바닥", preset: "floor tile, flooring material" },
  { id: "floor-wood", label: "나무 바닥", icon: "🪵", room: "바닥", preset: "hardwood floor, wooden flooring" },
  { id: "floor-carpet", label: "카펫 바닥", icon: "🟨", room: "바닥", preset: "carpet floor, floor covering" },
  { id: "roof", label: "지붕", icon: "🏠", room: "지붕", preset: "roof, roofing, roof tile" },
  { id: "door-int", label: "실내 문", icon: "🚪", room: "문", preset: "interior door, room door" },
  { id: "door-ext", label: "현관문", icon: "🚪", room: "문", preset: "front door, entrance door, exterior door" },
  { id: "door-arch", label: "아치/입구", icon: "🏛️", room: "문", preset: "arch, archway, doorway" },
  { id: "window-std", label: "창문", icon: "🪟", room: "창문", preset: "window, glass window" },
  { id: "window-large", label: "대형 창", icon: "🪟", room: "창문", preset: "large window, floor-to-ceiling window" },
  { id: "window-round", label: "원형 창", icon: "⭕", room: "창문", preset: "round window, circular window" },
  { id: "stairs", label: "계단", icon: "🪜", room: "계단", preset: "staircase, stairs" },
  { id: "column", label: "기둥", icon: "🏛️", room: "기둥", preset: "column, pillar, architectural column" },
  { id: "fence", label: "울타리", icon: "🏗️", room: "울타리", preset: "fence, railing, barrier" },
  { id: "arch-other", label: "기타", icon: "🏗️", room: "기타 건축", preset: "architectural element" },
];

// 에셋별 posmap ML 분석 결과. /api/object-meta 에서 내려와 교체됨.
// { id: { style, mood, size, colors[], materials[], posx, posy, filter } }
let POSMAP_SCORES = {};

let STYLE_PRESETS = [
  { id: "modern",         label: "모던",         color: "#64748b" },
  { id: "contemporary",   label: "컨템포러리",   color: "#475569" },
  { id: "scandinavian",   label: "스칸디나비안", color: "#d4a574" },
  { id: "japandi",        label: "재팬디",       color: "#b8a790" },
  { id: "midcentury",     label: "미드센추리",   color: "#c2956b" },
  { id: "industrial",     label: "인더스트리얼", color: "#78716c" },
  { id: "minimal",        label: "미니멀",       color: "#e2e8f0" },
  { id: "vintage",        label: "빈티지",       color: "#a87c5a" },
  { id: "retro",          label: "레트로",       color: "#d97757" },
  { id: "luxury",         label: "럭셔리",       color: "#d4af37" },
  { id: "art-deco",       label: "아르데코",     color: "#c9a227" },
  { id: "natural",        label: "내추럴",       color: "#86a873" },
  { id: "rustic",         label: "러스틱",       color: "#8b6f47" },
  { id: "farmhouse",      label: "팜하우스",     color: "#a8906a" },
  { id: "bohemian",       label: "보헤미안",     color: "#c17a54" },
  { id: "coastal",        label: "코스탈",       color: "#6fa8dc" },
  { id: "mediterranean",  label: "지중해",       color: "#4b9cd3" },
  { id: "traditional-kr", label: "전통(한옥)",   color: "#9b7e5e" },
  { id: "french-country", label: "프렌치 컨트리", color: "#d4a5a5" },
  { id: "urban",          label: "어반",         color: "#525252" },
  { id: "futuristic",     label: "퓨처리스틱",   color: "#7c3aed" },
  { id: "kids",           label: "키즈",         color: "#f472b6" },
  { id: "gothic",         label: "고딕",         color: "#1e293b" },
  { id: "eclectic",       label: "이클렉틱",     color: "#be6f4e" },
];

const VIEW_ANGLES = [
  { id: "main", label: "메인 (3/4 뷰)", angle: "three-quarter perspective view" },
  { id: "front", label: "정면", angle: "front orthographic view" },
  { id: "side", label: "측면", angle: "side orthographic view" },
  { id: "back", label: "후면", angle: "back orthographic view" },
  { id: "detail", label: "디테일", angle: "close-up detail shot of texture and joints" },
  { id: "top", label: "상단", angle: "top-down view" },
];

// ─── Asset Specs (Prototype — placeholder data) ───
const ASSET_SPECS = {
  bed: {
    rules: ["폴리 수: 5,000 tri 이하", "텍스처: 2048×2048 (Diffuse/Normal/ORM)", "LOD 3단계 필수", "침구 Mesh 분리"],
    size: { W: "160–220cm", D: "200–220cm", H: "40–60cm (매트리스)" },
    interactions: ["눕기 / 잠자기", "침구 컬러 커스텀"],
    hint: "standard bed 160-220cm wide, 200-220cm long, 40-60cm high mattress",
  },
  "kids-bed": {
    rules: ["폴리 수: 4,000 tri 이하", "텍스처: 1024×1024", "LOD 2단계", "안전 가드 별도 Mesh"],
    size: { W: "90–140cm", D: "160–200cm", H: "35–50cm" },
    interactions: ["눕기 (어린이)", "낙상 방지 가드 온/오프"],
    hint: "children's bed with safety rails, 90-140cm wide, lower and smaller proportions",
  },
  vanity: {
    rules: ["폴리 수: 3,000 tri 이하", "거울 Reflection Probe 필수", "서랍 별도 Mesh"],
    size: { W: "80–120cm", D: "40–50cm", H: "70–80cm (+거울 70cm)" },
    interactions: ["앉기 (의자 연동)", "서랍 열기/닫기", "거울 반사"],
    hint: "vanity dressing table with mirror, 80-120cm wide, 40-50cm deep",
  },
  nightstand: {
    rules: ["폴리 수: 1,500 tri 이하", "텍스처: 512×512", "서랍 별도 Mesh"],
    size: { W: "40–60cm", D: "35–50cm", H: "50–65cm" },
    interactions: ["서랍 열기/닫기", "아이템 올려놓기"],
    hint: "compact bedside nightstand 40-60cm wide, 50-65cm tall",
  },
  wardrobe: {
    rules: ["폴리 수: 6,000 tri 이하", "도어 별도 Mesh (애니메이션)", "내부 Mesh 포함"],
    size: { W: "120–240cm", D: "50–65cm", H: "180–230cm" },
    interactions: ["문 열기/닫기", "의류 수납 UI", "캐릭터 드레스업"],
    hint: "wardrobe 120-240cm wide, 180-230cm tall, with openable doors",
  },
  sofa: {
    rules: ["폴리 수: 6,000 tri 이하", "쿠션 별도 Mesh", "패브릭 텍스처 타일링"],
    size: { W: "160–300cm", D: "80–100cm", H: "75–90cm" },
    interactions: ["앉기 (2–4인)", "눕기 (1인)", "쿠션 색상 커스텀"],
    hint: "living room sofa 160-300cm wide, 80-100cm deep, seat height 40-50cm",
  },
  "chair-living": {
    rules: ["폴리 수: 2,500 tri 이하", "패브릭/가죽 머티리얼 분리", "다리 별도 Mesh"],
    size: { W: "60–90cm", D: "65–85cm", H: "75–95cm" },
    interactions: ["앉기 (1인)"],
    hint: "accent armchair 60-90cm wide, upholstered seat",
  },
  "table-living": {
    rules: ["폴리 수: 2,000 tri 이하", "상판 별도 Mesh", "유리/목재 머티리얼"],
    size: { W: "60–130cm", D: "40–80cm", H: "38–50cm" },
    interactions: ["아이템 올려놓기"],
    hint: "coffee table 60-130cm wide, low 38-50cm height",
  },
  "dining-table": {
    rules: ["폴리 수: 3,500 tri 이하", "확장 Leaf Mesh 분리", "상판/다리 별도 Mesh"],
    size: { W: "120–200cm", D: "75–100cm", H: "72–78cm" },
    interactions: ["앉기 (4–8인)", "식기 세팅 배치"],
    hint: "dining table 120-200cm wide, standard 75-78cm height",
  },
  "dining-chair": {
    rules: ["폴리 수: 1,800 tri 이하", "등받이/시트 별도 Mesh"],
    size: { W: "40–55cm", D: "45–55cm", H: "80–95cm" },
    interactions: ["앉기 (1인)", "테이블 밀어넣기"],
    hint: "dining chair 40-55cm wide, seat height 44-48cm",
  },
  desk: {
    rules: ["폴리 수: 3,000 tri 이하", "서랍 별도 Mesh", "케이블 홀 권장"],
    size: { W: "100–160cm", D: "55–75cm", H: "70–78cm" },
    interactions: ["앉기 (1인)", "모니터/아이템 배치", "서랍 열기/닫기"],
    hint: "desk 100-160cm wide, 55-75cm deep, standard 72-76cm height",
  },
  "office-chair": {
    rules: ["폴리 수: 4,000 tri 이하", "높이 조절 Mesh 분리", "바퀴 5개 별도 Mesh"],
    size: { W: "60–75cm", D: "60–75cm", H: "90–120cm" },
    interactions: ["앉기 (1인)", "높이 조절", "360° 회전"],
    hint: "ergonomic office chair 60-75cm wide, adjustable seat height 45-55cm",
  },
  bookshelf: {
    rules: ["폴리 수: 2,500 tri 이하", "선반 별도 Mesh", "책 덱칼 텍스처 포함"],
    size: { W: "60–120cm", D: "25–40cm", H: "150–220cm" },
    interactions: ["아이템 수납", "책 꽂기"],
    hint: "bookcase 60-120cm wide, 25-40cm deep, 150-220cm tall",
  },
  bathtub: {
    rules: ["폴리 수: 4,000 tri 이하", "수면 Shader 필수", "배수구 별도 Mesh"],
    size: { W: "70–90cm", D: "150–180cm", H: "50–70cm" },
    interactions: ["목욕하기", "물 채우기/빼기"],
    hint: "bathtub 70-90cm wide, 150-180cm long, 50-70cm deep",
  },
  toilet: {
    rules: ["폴리 수: 2,500 tri 이하", "뚜껑 별도 Mesh (애니메이션)", "물탱크 포함"],
    size: { W: "35–45cm", D: "60–80cm", H: "70–85cm" },
    interactions: ["앉기", "뚜껑 열기/닫기", "물 내리기"],
    hint: "toilet with lid and tank, 35-45cm wide, 60-80cm long",
  },
  "sink-bath": {
    rules: ["폴리 수: 2,000 tri 이하", "수도꼭지 별도 Mesh", "물 파티클 연동"],
    size: { W: "45–65cm", D: "35–55cm", H: "80–90cm (받침 포함)" },
    interactions: ["손 씻기", "수도꼭지 조작"],
    hint: "bathroom sink with faucet, 45-65cm wide, mounted at 80-90cm height",
  },
};

const DEFAULT_SPEC = {
  rules: ["폴리 수: 카테고리별 상이 (추후 정의)", "텍스처: 1024×1024 기본", "LOD 최소 2단계"],
  size: { W: "TBD", D: "TBD", H: "TBD" },
  interactions: ["기본 배치 상호작용", "추후 상세 정의 예정"],
  hint: "",
};

// PascalCase / snake_case 로 바뀐 inzoiObjectList 카테고리 id 를 기존
// ASSET_SPECS (kebab lowercase) 로 매핑. 일치 없으면 null.
const CATEGORY_TO_LEGACY_SPEC = {
  Bed: "bed", Child_Bed: "kids-bed",
  VanityTable: "vanity", SideTable: "nightstand",
  Closet: "wardrobe", Sofa: "sofa",
  Chair01: "chair-living", LowTable: "table-living",
  Desk: "desk", BookShelf: "bookshelf",
  DiningRoom_Table: "dining-table", DiningRoom_Chair: "dining-chair",
  Kitchen_Countertop: "counter", Bath: "bathtub",
  Toilet: "toilet",
};
function findLegacySpec(categoryId) {
  if (!categoryId) return null;
  const key = CATEGORY_TO_LEGACY_SPEC[categoryId] || categoryId.toLowerCase();
  return ASSET_SPECS[key] || null;
}

// "160–220cm" 또는 "50cm" 또는 "40-60cm (매트리스)" 에서 숫자 중앙값 추출.
function parseRangeToMid(s) {
  if (typeof s !== "string") return null;
  const m = s.match(/(\d+)\s*[–\-~]\s*(\d+)/);
  if (m) return Math.round((Number(m[1]) + Number(m[2])) / 2);
  const m2 = s.match(/(\d+)/);
  return m2 ? Number(m2[1]) : null;
}

// 카테고리 id 에서 ASSET_SPECS 의 W/D/H 범위 중앙값을 cm 숫자로 변환.
// 매핑 없거나 TBD 면 null.
function categoryToDefaultSize(categoryId) {
  const spec = findLegacySpec(categoryId);
  if (!spec?.size) return null;
  const w = parseRangeToMid(spec.size.W);
  const d = parseRangeToMid(spec.size.D);
  const h = parseRangeToMid(spec.size.H);
  if (!w && !d && !h) return null;
  return { width_cm: w, depth_cm: d, height_cm: h };
}

// ─── Utility Functions ───
function generateSeed() {
  return Math.floor(Math.random() * 2147483647);
}

// v1.10.88 — HTTP (non-secure context) 에서도 동작하는 클립보드 복사.
// navigator.clipboard 는 HTTPS/localhost 외에서 undefined 또는 차단되므로 legacy execCommand fallback.
async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

// SQLite datetime('now') 는 UTC 'YYYY-MM-DD HH:MM:SS' (Z 없음).
// 단순 slice 로 표시하면 KST(+9) 보다 9시간 늦어 보임 → 명시적 UTC 파싱 후 local 변환.
// fmt: "ymd" → "MM-DD", "ymdhm" → "MM-DD HH:MM", "ymdhms" → "MM-DD HH:MM:SS",
//      "full" → "YYYY-MM-DD HH:MM", "date" → "YYYY-MM-DD".
function formatLocalTime(s, fmt = "ymdhm") {
  if (!s) return "";
  let iso = String(s);
  // ISO 'Z' 또는 timezone 이 이미 붙어있으면 그대로, 아니면 UTC 로 간주.
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso)) {
    iso = iso.includes("T") ? iso + "Z" : iso.replace(" ", "T") + "Z";
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(s).slice(0, 16);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  if (fmt === "date") return `${yy}-${mm}-${dd}`;
  if (fmt === "ymd") return `${mm}-${dd}`;
  if (fmt === "ymdhms") return `${mm}-${dd} ${hh}:${mi}:${ss}`;
  if (fmt === "full") return `${yy}-${mm}-${dd} ${hh}:${mi}`;
  return `${mm}-${dd} ${hh}:${mi}`;
}

function generateColors(count) {
  const palettes = [
    ["#2d1b0e", "#6b4423", "#c4956a", "#e8d5b7", "#f5f0e8"],
    ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#f5f5f5"],
    ["#2c3639", "#3f4e4f", "#a27b5c", "#dcd7c9", "#f0ece3"],
    ["#1b1a17", "#4a403a", "#8b7355", "#d4c5a9", "#f2edd7"],
    ["#0b2447", "#19376d", "#576cbc", "#a5d7e8", "#f0f7ff"],
    ["#362222", "#5c3d3d", "#a47551", "#d4b896", "#f0e6d3"],
  ];
  return palettes[Math.floor(Math.random() * palettes.length)].slice(0, count);
}

// ─── Concept Sheet Canvas Generator ───
// Draws the passed image into a slot with a per-view transform
// (flip for back, zoom for detail, crop for top/side). All slots
// share the same source image so the sheet presents ONE consistent
// design instead of six drifting AI re-rolls.
function drawViewSlot(ctx, img, x, y, w, h, viewKey) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (viewKey === "back") {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
  } else if (viewKey === "detail") {
    const sw = img.width * 0.45;
    const sh = img.height * 0.45;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else if (viewKey === "top") {
    const sh = img.height * 0.55;
    ctx.drawImage(img, 0, 0, img.width, sh, x, y, w, h);
  } else if (viewKey === "side") {
    const sw = img.width * 0.7;
    const sx = (img.width - sw) / 2;
    ctx.drawImage(img, sx, 0, sw, img.height, x, y, w, h);
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
  ctx.restore();
}

function generateConceptSheetCanvas(canvas, images, metadata) {
  const ctx = canvas.getContext("2d");
  const W = 2400, H = 3200;
  canvas.width = W;
  canvas.height = H;

  // Background — light theme to match app
  ctx.fillStyle = "#f5f7fb";
  ctx.fillRect(0, 0, W, H);

  // Header bar (inZOI dark blue)
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#0b1a3e");
  grad.addColorStop(1, "#102a5e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 120);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px 'Pretendard', 'Segoe UI', 'Malgun Gothic', sans-serif";
  ctx.fillText("inZOI 에셋 컨셉시트", 60, 78);

  // Subtitle
  ctx.fillStyle = "#a5b8de";
  ctx.font = "20px 'Pretendard', 'Segoe UI', 'Malgun Gothic', sans-serif";
  ctx.fillText(`${metadata.category} — ${metadata.style} — ${new Date().toLocaleDateString("ko-KR")}`, W - 600, 78);

  const slotFill = "#ffffff";
  const slotBorder = "#d8dce8";
  const labelColor = "#334155";
  ctx.lineWidth = 2;

  const drawSlot = (x, y, w, h, viewKey, label) => {
    ctx.fillStyle = slotFill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = slotBorder;
    ctx.strokeRect(x, y, w, h);
    if (images && images[viewKey]) {
      drawViewSlot(ctx, images[viewKey], x, y, w, h, viewKey);
    }
    ctx.fillStyle = "rgba(11, 26, 62, 0.82)";
    ctx.fillRect(x, y + h - 44, 230, 44);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Pretendard', 'Segoe UI', 'Malgun Gothic', sans-serif";
    ctx.fillText(label, x + 16, y + h - 14);
  };

  const mainY = 160;

  // Main image (large)
  drawSlot(60, mainY, 1400, 1100, "main", "메인 뷰 (3/4)");

  // Side views (right column)
  const sideX = 1500;
  const sideW = 840;
  const sideH = 530;
  [
    { key: "front", label: "정면 뷰" },
    { key: "side", label: "측면 뷰" },
  ].forEach((v, i) => {
    drawSlot(sideX, mainY + i * (sideH + 40), sideW, sideH, v.key, v.label);
  });

  // Bottom row
  const bottomY = mainY + 1140;
  const bottomViews = [
    { key: "back", label: "후면 뷰" },
    { key: "detail", label: "디테일" },
    { key: "top", label: "상단 뷰" },
  ];
  const bw = (W - 120 - 40 * 2) / 3;
  bottomViews.forEach((v, i) => {
    drawSlot(60 + i * (bw + 40), bottomY, bw, 600, v.key, v.label);
  });

  // Info section
  const infoY = bottomY + 640;

  // Color palette
  ctx.fillStyle = "#0b1a3e";
  ctx.font = "bold 22px 'Pretendard', 'Segoe UI', 'Malgun Gothic', sans-serif";
  ctx.fillText("컬러 팔레트", 60, infoY + 30);
  const colors = metadata.colors || generateColors(5);
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(60 + i * 120, infoY + 50, 100, 60);
    ctx.strokeStyle = "#cbd2e0";
    ctx.strokeRect(60 + i * 120, infoY + 50, 100, 60);
    ctx.fillStyle = labelColor;
    ctx.font = "12px monospace";
    ctx.fillText(c, 65 + i * 120, infoY + 130);
  });

  // Metadata
  ctx.fillStyle = "#0b1a3e";
  ctx.font = "bold 22px 'Pretendard', 'Segoe UI', 'Malgun Gothic', sans-serif";
  ctx.fillText("에셋 사양", 900, infoY + 30);

  const specs = [
    `카테고리: ${metadata.category}`,
    `스타일: ${metadata.style}`,
    `프롬프트: ${metadata.prompt?.substring(0, 60)}...`,
    `생성 모델: ${metadata.model || "Gemini Image"}`,
    `시드: ${metadata.seed || "N/A"}`,
  ];
  ctx.fillStyle = labelColor;
  ctx.font = "18px 'Pretendard', 'Segoe UI', 'Malgun Gothic', sans-serif";
  specs.forEach((s, i) => {
    ctx.fillText(s, 900, infoY + 65 + i * 32);
  });

  // Footer
  ctx.fillStyle = "#0b1a3e";
  ctx.fillRect(0, H - 50, W, 50);
  ctx.fillStyle = "#a5b8de";
  ctx.font = "14px 'Pretendard', 'Segoe UI', 'Malgun Gothic', sans-serif";
  ctx.fillText("inZOI 에셋 컨셉 도구에서 생성 — Powered by Gemini", 60, H - 18);
  ctx.fillText(`© ${new Date().getFullYear()} KRAFTON inZOI`, W - 300, H - 18);
}

// ─── Components ───

function StepIndicator({ currentStep, steps }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      padding: "0 40px", marginBottom: 32,
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            opacity: i <= currentStep ? 1 : 0.4,
            transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: i === currentStep
                ? "linear-gradient(135deg, var(--primary), var(--secondary))"
                : i < currentStep ? "rgba(34, 197, 94, 0.2)" : "var(--surface-color)",
              border: i < currentStep ? "1px solid rgba(34, 197, 94, 0.5)" : i === currentStep ? "none" : "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700,
              color: i < currentStep ? "#4ade80" : i === currentStep ? "#fff" : "var(--text-muted)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: i === currentStep ? "0 0 20px var(--primary-glow)" : "none",
            }}>
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 14, fontWeight: i === currentStep ? 700 : 500,
              color: i === currentStep ? "var(--text-main)" : "var(--text-muted)",
              whiteSpace: "nowrap",
              textShadow: i === currentStep ? "0 0 10px rgba(255,255,255,0.2)" : "none",
            }}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 16px",
              background: i < currentStep
                ? "linear-gradient(90deg, #22c55e, #10b981)"
                : "var(--surface-color)",
              borderTop: "1px solid rgba(0,0,0,0.04)",
              transition: "background 0.4s",
              boxShadow: i < currentStep ? "0 0 10px rgba(34,197,94,0.3)" : "none",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function ImageUploader({ images, onImagesChange }) {
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const newImages = [...images];
    Array.from(files).slice(0, 5 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({ url: e.target.result, name: file.name });
        onImagesChange([...newImages]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12,
      }}>
        {images.map((img, i) => (
          <div key={i} className="hover-lift" style={{
            position: "relative", aspectRatio: "1", borderRadius: 16,
            overflow: "hidden", border: "1px solid var(--surface-border)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
          }}>
            <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => onImagesChange(images.filter((_, j) => j !== i))}
              style={{
                position: "absolute", top: 8, right: 8,
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(239,68,68,0.8)", border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(4px)",
                color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.8)"; e.currentTarget.style.transform = "scale(1)"; }}
            >×</button>
          </div>
        ))}
        {images.length < 5 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel"
            style={{
              aspectRatio: "1", borderRadius: 16,
              border: "1px dashed rgba(255,255,255,0.2)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.3s",
              background: "rgba(0,0,0,0.02)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.background = "rgba(7,110,232,0.05)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(7,110,232,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.background = "rgba(0,0,0,0.02)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: 28, marginBottom: 4, color: "var(--primary)" }}>+</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>이미지 추가</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{images.length}/5</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function DesignCard({ design, selected, onClick, index }) {
  return (
    <div
      onClick={onClick}
      className={selected ? "" : "hover-lift glass-panel"}
      style={{
        borderRadius: 20, overflow: "hidden",
        border: selected ? "2px solid var(--accent)" : "1px solid var(--surface-border)",
        cursor: "pointer", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: selected ? "scale(1.03)" : "scale(1)",
        boxShadow: selected ? "0 0 35px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.1)" : "0 8px 32px rgba(0,0,0,0.06)",
        background: selected ? "rgba(34, 211, 238, 0.03)" : "var(--surface-color)",
        position: "relative",
      }}
    >
      <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden" }}>
        {design.imageUrl ? (
          <img src={design.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: selected ? "scale(1.05)" : "scale(1)" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: design.gradient || `linear-gradient(${135 + index * 30}deg, #1e293b, #334155)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.5s",
            transform: selected ? "scale(1.05)" : "scale(1)",
          }}>
            <div style={{
              width: "60%", height: "60%", borderRadius: 16,
              background: "rgba(0,0,0,0.02)",
              border: "1px solid rgba(0,0,0,0.08)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 54, filter: selected ? "none" : "grayscale(0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
              transition: "all 0.3s",
            }}>
              {design.icon}
            </div>
          </div>
        )}
        {selected && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--accent)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#000", fontWeight: 800,
            boxShadow: "0 4px 15px rgba(34, 211, 238, 0.5)",
            animation: "pulseGlow 2s infinite",
          }}>✓</div>
        )}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "50px 20px 16px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>시안 {index + 1}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "monospace" }}>Seed: {design.seed}</div>
        </div>
      </div>
    </div>
  );
}

function LoadingOverlay({ message, progress }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(240, 242, 245, 0.97) 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ position: "relative", width: 100, height: 100 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "3px solid rgba(0,0,0,0.04)",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "var(--accent)",
          borderRightColor: "var(--primary)",
          animation: "spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        }} />
        <div style={{
          position: "absolute", inset: 12, borderRadius: "50%",
          background: "rgba(7,110,232,0.1)",
          boxShadow: "0 0 30px var(--primary-glow)",
          animation: "pulseGlow 2s infinite",
        }} />
      </div>
      <div className="text-gradient" style={{ marginTop: 32, fontSize: 22, fontWeight: 700, letterSpacing: "0.02em" }}>
        {message}
      </div>
      {progress !== undefined && (
        <div style={{ width: 320, height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, marginTop: 20, overflow: "hidden", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: "linear-gradient(90deg, var(--primary), var(--accent))",
            borderRadius: 3, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 10px var(--primary-glow)",
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Gemini Image Generation API Helper ───
// dataURL 또는 /data/images/... URL 을 base64+mime 으로 변환.
async function fetchImagePart(url) {
  if (typeof url !== "string") return null;
  if (url.startsWith("data:")) {
    const m = url.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (!m) return null;
    return { mime: m[1], base64: m[2] };
  }
  // 서버에 호스팅된 이미지 (/data/images/...) 또는 외부 URL
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return { mime: blob.type || "image/png", base64: btoa(bin) };
  } catch (e) {
    console.warn("fetchImagePart failed for", url, e);
    return null;
  }
}

// v1.10.71 — apiKey 인자는 personal override 만. "[server]" placeholder 면 서버 팀 키 사용.
// v1.10.89 — X-Actor-Name 헤더로 actor 전달 → 서버가 사용량 로그에 기록.
// v1.10.93 — 한글 등 non-ISO-8859-1 문자가 헤더에 들어가면 fetch 가 throw.
//            encodeURIComponent 로 안전하게 변환, 서버에서 decodeURIComponent.
function geminiProxyHeaders(apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey && apiKey !== "[server]") headers["X-Personal-Gemini-Key"] = apiKey;
  try {
    const actor = localStorage.getItem("inzoi_actor_name");
    if (actor) headers["X-Actor-Name"] = encodeURIComponent(actor);
  } catch { /* ignore */ }
  return headers;
}
async function generateImageWithGemini(apiKey, prompt, model, refImages = []) {
  console.log(`Generating image with model: ${model}, refImages=${refImages.length}`);

  // multimodal: 프롬프트 + 참조 이미지 inline_data
  const parts = [{ text: prompt }];
  for (const url of refImages.slice(0, 4)) {  // 안전상 최대 4개로 제한
    const part = await fetchImagePart(url);
    if (part) {
      parts.push({ inline_data: { mime_type: part.mime, data: part.base64 } });
    }
  }

  const response = await fetch(
    `/api/ai/gemini/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: geminiProxyHeaders(apiKey),
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    console.error(`${model} error:`, errBody);
    let msg = `${model}: ${response.status}`;
    try {
      const errJson = JSON.parse(errBody);
      msg = errJson.error?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await response.json();
  console.log(`${model} response:`, JSON.stringify(data).substring(0, 300));

  const respParts = data.candidates?.[0]?.content?.parts || [];
  for (const part of respParts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
    }
  }

  const blockReason = data.candidates?.[0]?.finishReason;
  if (blockReason === "SAFETY" || blockReason === "IMAGE_SAFETY") {
    throw new Error("안전 필터에 의해 이미지가 차단되었습니다.");
  }

  throw new Error(`이미지 없음 (finishReason: ${blockReason || "unknown"})`);
}

// 이미지 한 장을 받아 FURNITURE_CATEGORIES 중 가장 적합한 카테고리 id 와
// confidence(0~1) 를 돌려준다. Gemini 2.5 Flash(vision) 로 호출하고 JSON 응답만 요청.
// posmap_scores 가 사용하는 한글 enum — Gemini 응답 검증용.
const POSMAP_STYLES = ["내추럴", "모던", "미니멀", "미드센추리", "보헤미안", "빈티지", "스칸디나비안", "아르데코", "인더스트리얼", "전통", "캐주얼", "컨트리", "클래식", "키치"];
const POSMAP_MOODS = ["럭셔리", "세련된", "아늑한", "차분한", "캐주얼", "활기찬"];
const POSMAP_SIZES = ["대", "소", "중"];
const POSMAP_SHAPES = ["곡선", "사각", "원형", "유기적", "직선"];
const POSMAP_COLORS = ["갈색", "검정", "금색", "노랑", "베이지", "보라", "분홍", "빨강", "은색", "주황", "초록", "파랑", "회색", "흰색"];
const POSMAP_MATERIALS = ["가죽", "금속", "대리석", "라탄", "목재", "석재", "세라믹", "유리", "콘크리트", "패브릭", "플라스틱"];

// 이미지 + 제목 으로 3D 에셋 생성용 한글 프롬프트 초안 작성 (v1.10.40).
// 위시 → 시안 자동 준비에 사용. classifyCategoryWithGemini 와 동일 모델(2.5-flash).
async function generatePromptFromImage(apiKey, imageUrl, titleHint) {
  const part = await fetchImagePart(imageUrl);
  if (!part) throw new Error("이미지 로드 실패");
  const titleLine = titleHint ? `카드 제목: "${titleHint}"\n` : "";
  const prompt = `${titleLine}이 이미지는 inZOI 게임 가구/인테리어 에셋 컨셉 생성용 참고 이미지입니다.
이미지를 보고 3D 에셋 생성 프롬프트 초안을 한글로 2~4문장 작성하세요.
포함할 정보: 재질(예: 월넛, 파우더코팅 스틸, 가죽), 색상, 표면 마감, 형태·실루엣, 추정 크기(cm 단위, 가능할 때), 특징적 디테일.
설명 문구 없이 바로 에셋 자체의 묘사로 시작. 마크다운 없이 자연스러운 문장.
반드시 JSON 만 응답:
{ "prompt": "..." }`;
  const response = await fetch(
    `/api/ai/gemini/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: geminiProxyHeaders(apiKey),
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: part.mime, data: part.base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  try {
    const parsed = JSON.parse(text);
    return typeof parsed.prompt === "string" ? parsed.prompt.trim() : null;
  } catch { return null; }
}

async function classifyCategoryWithGemini(apiKey, imageUrl) {
  const part = await fetchImagePart(imageUrl);
  if (!part) throw new Error("이미지 로드 실패");

  const categoryList = FURNITURE_CATEGORIES
    .map((c) => `- ${c.id}: ${c.label} (${c.room})`)
    .join("\n");
  const styleList = STYLE_PRESETS
    .map((s) => `- ${s.id}: ${s.label}`)
    .join("\n");

  const prompt = `이 이미지를 분석해 아래 정보를 모두 추출하세요.
반드시 JSON 형식만 응답:
{
  "category_id":"<id>",
  "category_confidence":0.0~1.0,
  "style_id":"<id>",
  "style_confidence":0.0~1.0,
  "width_cm":<정수>,
  "depth_cm":<정수>,
  "height_cm":<정수>,
  "size_confidence":0.0~1.0,
  "size_reason":"<짧은 근거>",
  "posmap_style":"<한글 스타일>",
  "posmap_mood":"<한글 무드>",
  "posmap_size":"<한글 크기>",
  "posmap_shape":["<한글 형태1>", "<한글 형태2>"],
  "posmap_colors":["<한글 색상1>", "<한글 색상2>", ...],
  "posmap_materials":["<한글 재질1>", "<한글 재질2>", ...],
  "keywords":["<핵심 명사1>", "<핵심 명사2>"]
}

규칙 (카테고리 / 스타일 / 크기):
- category_id / style_id 는 반드시 아래 '카테고리' / '스타일' 목록의 id 중에서.
- width/depth/height 는 실제 cm 단위 정수.
- 크기 판단 어려우면 size_confidence < 0.5.

규칙 (posmap_* — 카탈로그 검색용 한글 enum, 반드시 아래 목록에서만 고르세요):
- posmap_style: ${POSMAP_STYLES.join(" / ")}
- posmap_mood: ${POSMAP_MOODS.join(" / ")}
- posmap_size: ${POSMAP_SIZES.join(" / ")} (소=작은가구·소품, 중=일반가구, 대=큰가구)
- posmap_shape: 최대 2개. ${POSMAP_SHAPES.join(" / ")} 중에서. 주 형태 순.
- posmap_colors: 최대 4개. ${POSMAP_COLORS.join(", ")} 중에서. 주 색상 순.
- posmap_materials: 최대 3개. ${POSMAP_MATERIALS.join(", ")} 중에서. 주 재질 순.

규칙 (keywords — 카탈로그 이름 검색용):
- 이미지 속 사물의 종류·기능을 나타내는 한글 명사 1~3개. 예: ["바구니","트레이"], ["침대","베드"], ["조명","램프"].
- 카테고리 라벨과 동일 단어 OK. 변형(영문 일반명·동의어) 도 추가하면 좋음.

카테고리:
${categoryList}

스타일:
${styleList}`;

  const response = await fetch(
    `/api/ai/gemini/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: geminiProxyHeaders(apiKey),
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: part.mime, data: part.base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    }
  );
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`gemini ${response.status}: ${errBody.slice(0, 120)}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  // v1.10.92 — 실패 진단을 위한 console 로그.
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) {
    console.warn("[자동 분류] Gemini 응답에 JSON 없음:", { text: text.slice(0, 500), finishReason: data.candidates?.[0]?.finishReason });
    return null;
  }
  try {
    const obj = JSON.parse(m[0]);
    const catId = obj.category_id || obj.category || null;
    if (!catId) {
      console.warn("[자동 분류] category_id 누락:", obj);
      return null;
    }
    if (!FURNITURE_CATEGORIES.find((c) => c.id === catId)) {
      console.warn(`[자동 분류] category_id="${catId}" 가 FURNITURE_CATEGORIES 에 없음. 카테고리 목록은 inzoiObjectList catHier 에서 fetch:`,
        FURNITURE_CATEGORIES.length === 0 ? "(아직 로드 전)" : `${FURNITURE_CATEGORIES.length}개`);
      return null;
    }
    // 카테고리는 필수, 스타일은 선택 (검증 실패 시 null)
    const styleId = obj.style_id || obj.style || null;
    const validStyle = styleId && STYLE_PRESETS.find((s) => s.id === styleId) ? styleId : null;
    const pickDim = (v) => typeof v === "number" && v > 0 && v < 2000 ? Math.round(v) : null;
    const sizeInfo = (obj.width_cm || obj.depth_cm || obj.height_cm) ? {
      width_cm: pickDim(obj.width_cm),
      depth_cm: pickDim(obj.depth_cm),
      height_cm: pickDim(obj.height_cm),
      confidence: typeof obj.size_confidence === "number" ? obj.size_confidence : 0.5,
      reason: typeof obj.size_reason === "string" ? obj.size_reason.slice(0, 200) : null,
    } : null;
    // posmap feature 검증 — 허용된 한글 enum 만.
    const filterInList = (arr, allowed, cap) => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((v) => typeof v === "string" && allowed.includes(v)).slice(0, cap);
    };
    // keywords — 한글 명사 위주, 최대 3개, 1~10자 정도로 제한.
    const cleanKeywords = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((v) => typeof v === "string" ? v.trim() : "")
        .filter((v) => v.length >= 1 && v.length <= 12)
        .slice(0, 3);
    };
    const posmapFeatures = {
      style: POSMAP_STYLES.includes(obj.posmap_style) ? obj.posmap_style : null,
      mood: POSMAP_MOODS.includes(obj.posmap_mood) ? obj.posmap_mood : null,
      size: POSMAP_SIZES.includes(obj.posmap_size) ? obj.posmap_size : null,
      shape: filterInList(obj.posmap_shape, POSMAP_SHAPES, 2),
      colors: filterInList(obj.posmap_colors, POSMAP_COLORS, 4),
      materials: filterInList(obj.posmap_materials, POSMAP_MATERIALS, 3),
      keywords: cleanKeywords(obj.keywords),
    };
    return {
      category_id: catId,
      confidence: typeof obj.category_confidence === "number"
        ? obj.category_confidence
        : (typeof obj.confidence === "number" ? obj.confidence : 0.5),
      style_id: validStyle,
      style_confidence: typeof obj.style_confidence === "number" ? obj.style_confidence : null,
      size_info: sizeInfo,
      posmap_features: posmapFeatures,
    };
  } catch (e) {
    console.warn("[자동 분류] JSON 파싱 실패:", e.message, m[0].slice(0, 300));
    return null;
  }
}

// posmap 유사도 계산 (v1.10.4 재조정).
// 검증 목적 → 이름이 비슷한 같은 종류 에셋이 맨 위에 오는게 핵심.
// 가중치:
//   이름 키워드 매칭 ×50 (dominant, v1.9.2 25→v1.10.4 50)
//   shape ×20 (유지)
//   materials ×10 (유지)
//   style +10 (v1.9.x 30→v1.10.4 10, 낮춤)
//   mood +5 (v1.9.x 20→v1.10.4 5, 낮춤)
//   size +5 (유지)
// 제거된 항목 (v1.10.4):
//   colors 매칭 — 같은 색상이라도 다른 오브젝트 매칭 잦아 정확도 저해
//   같은 filter -10 페널티 — 오히려 같은 종류 검증 목적에 역효과
// 유지 페널티:
//   다른 catHier lv1 (가구 vs 탑승물/건축/제작) -50 — 큰 분류 다르면 거의 무관
function calcPosmapSimilarity(userFeatures, assetScore, userCategoryId, userLv1) {
  if (!assetScore?.style) return -999;
  let score = 0;
  // 1. 이름 키워드 매칭 (가장 강한 신호)
  const kws = userFeatures.keywords || [];
  if (kws.length > 0 && assetScore.name) {
    const nameLower = assetScore.name.toLowerCase();
    let kwHits = 0;
    for (const kw of kws) {
      if (kw && nameLower.includes(kw.toLowerCase())) kwHits++;
    }
    score += kwHits * 50;
  }
  // 2. shape
  const ush = userFeatures.shape || [];
  const osh = assetScore.shape || [];
  if (ush.length > 0 && osh.length > 0) {
    score += ush.filter((s) => osh.includes(s)).length * 20;
  }
  // 3. materials
  const im = userFeatures.materials || [];
  const om = assetScore.materials || [];
  score += im.filter((m) => om.includes(m)).length * 10;
  // 4. style / mood (보조 신호, 낮은 가중치)
  if (userFeatures.style && assetScore.style === userFeatures.style) score += 10;
  if (userFeatures.mood && assetScore.mood === userFeatures.mood) score += 5;
  // 5. size
  if (userFeatures.size && assetScore.size === userFeatures.size) score += 5;
  // 6. catHier lv1 페널티 (큰 분류 다르면 배제)
  if (userLv1 && assetScore.lv1 && assetScore.lv1 !== userLv1) score -= 50;
  return score;
}

// 사용자 feature 로 POSMAP_SCORES 전수 스캔해 top-N 유사 에셋 반환.
function findSimilarCatalogAssets(userFeatures, userCategoryId, topN = 12) {
  // 사용자 카테고리로부터 lv1 파악 (FURNITURE_CATEGORIES 의 group 필드).
  const userCat = userCategoryId ? FURNITURE_CATEGORIES.find((c) => c.id === userCategoryId) : null;
  const userLv1 = userCat?.group || null;
  const entries = [];
  for (const [id, score] of Object.entries(POSMAP_SCORES)) {
    const s = calcPosmapSimilarity(userFeatures, score, userCategoryId, userLv1);
    if (s > 0) entries.push({
      id, score: s,
      filter: score.filter, lv1: score.lv1, lv2: score.lv2,
      icon: score.icon || null,
      name: score.name || null,
    });
  }
  entries.sort((a, b) => b.score - a.score);
  // v1.10.56 — 같은 아이콘이 여러 카테고리에 복사되어 있을 때 중복 제거.
  // 키 우선순위: icon (실제 이미지 파일) > name. 가장 높은 score 만 유지.
  const seen = new Set();
  const deduped = [];
  for (const e of entries) {
    const key = e.icon ? `icon:${e.icon}` : e.name ? `name:${e.name}` : `id:${e.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
    if (deduped.length >= topN) break;
  }
  const maxScore = deduped.length ? deduped[0].score : 1;
  return deduped.map((e) => ({
    id: e.id,
    score: e.score,
    normalized: maxScore > 0 ? e.score / maxScore : 0,
    filter: e.filter,
    lv1: e.lv1,
    lv2: e.lv2,
    icon: e.icon,
    name: e.name,
  }));
}

// 컨셉시트 4뷰(front/side/back/top) 를 Gemini 3 Flash Image (나노바나나2) 로 생성.
// 소스 이미지를 multimodal 참조로 주고 각 뷰별 프롬프트로 병렬 호출.
// onProgress(done, total) 로 진행률 보고.
const SHEET_VIEWS = [
  { id: "front", label: "정면", prompt: "straight-on front view, orthographic perspective" },
  { id: "side",  label: "측면", prompt: "straight-on left side view, orthographic perspective" },
  { id: "back",  label: "후면", prompt: "straight-on back view, orthographic perspective" },
  { id: "top",   label: "상단", prompt: "top-down view, orthographic perspective" },
];

async function generateConceptSheetViews({ apiKey, sourceImageUrl, model, contextLabel, onProgress }) {
  const tasks = SHEET_VIEWS.map((v) => async () => {
    const prompt = `Render a ${v.prompt} of this ${contextLabel || "furniture asset"}. `
      + `Keep the exact proportions, materials, colors, and design details from the source image. `
      + `Neutral gray background, even studio lighting, high detail, 3D product render, game asset reference.`;
    try {
      const raw = await generateImageWithGemini(apiKey, prompt, model, [sourceImageUrl]);
      const uploaded = await uploadDataUrl(raw);
      return { view: v.id, label: v.label, imageUrl: uploaded };
    } catch (err) {
      return { view: v.id, label: v.label, imageUrl: null, error: err.message };
    }
  });
  return await runWithConcurrencyLimit(tasks, 2, onProgress);
}

// 이미지에서 대략적 실제 크기(cm)를 추정. 카테고리 라벨을 context 로 준다.
async function estimateSizeWithGemini(apiKey, imageUrl, categoryLabel) {
  const part = await fetchImagePart(imageUrl);
  if (!part) throw new Error("이미지 로드 실패");

  const prompt = `이 이미지에 보이는 ${categoryLabel || "가구"}의 실제 크기를 추정해주세요.
반드시 JSON 만 응답:
{"width_cm": <정수>, "depth_cm": <정수>, "height_cm": <정수>, "confidence": 0.0~1.0, "reason": "<짧은 근거>"}

규칙:
- width: 정면 기준 좌우 길이 (cm)
- depth: 정면 기준 앞뒤 길이 (cm)
- height: 바닥에서 꼭대기까지 높이 (cm)
- ${categoryLabel || "해당 가구"} 의 일반적 크기 범위를 기준으로 판단
- 이미지에서 판단 어려우면 confidence 0.5 미만`;

  const response = await fetch(
    `/api/ai/gemini/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: geminiProxyHeaders(apiKey),
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: part.mime, data: part.base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    }
  );
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`gemini ${response.status}: ${errBody.slice(0, 120)}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    const pick = (v) => typeof v === "number" && v > 0 && v < 2000 ? Math.round(v) : null;
    return {
      width_cm: pick(obj.width_cm ?? obj.w),
      depth_cm: pick(obj.depth_cm ?? obj.d),
      height_cm: pick(obj.height_cm ?? obj.h),
      confidence: typeof obj.confidence === "number" ? obj.confidence : 0.5,
      reason: typeof obj.reason === "string" ? obj.reason.slice(0, 200) : null,
    };
  } catch { return null; }
}

// ─── List available Gemini image models ───
async function listGeminiImageModels(apiKey) {
  const response = await fetch(
    `/api/ai/gemini/v1beta/models`,
    { headers: geminiProxyHeaders(apiKey) }
  );
  if (!response.ok) throw new Error(`ListModels failed: ${response.status}`);
  const data = await response.json();
  return (data.models || [])
    .filter(m =>
      m.supportedGenerationMethods?.includes("generateContent") &&
      (m.name?.includes("image") || m.displayName?.toLowerCase().includes("image"))
    )
    .map(m => ({
      id: m.name?.replace("models/", ""),
      displayName: m.displayName,
    }));
}

// ─── D1 row <-> frontend shape 변환 ──────────────────────────────
// 서버는 snake_case + JSON 문자열로 저장, 프론트는 camelCase + 실제 객체.
function safeParse(s) {
  if (s == null) return null;
  if (typeof s === "object") return s;
  try { return JSON.parse(s); } catch { return null; }
}

// 이제 Gemini 이미지, 컨셉시트, 위시 이미지는 모두 /api/upload 를 거쳐
// /data/images/{uuid}.png 형식의 URL 만 DB 에 저장되므로 행 크기 걱정 없음.
// dataURL 이 여전히 들어온 경우(업로드 실패 fallback) 만 잘라서 DB 폭주 방지.
const DB_MAX_DATA_URL = 800_000;
function trimForDb(s, label) {
  if (!s || typeof s !== "string") return s ?? null;
  if (s.startsWith("data:") && s.length > DB_MAX_DATA_URL) {
    console.warn(`[D1] ${label} 가 아직 dataURL 상태 (${(s.length / 1024).toFixed(0)}KB) — 업로드 실패로 판단, DB 에서 생략`);
    return null;
  }
  return s;
}

function trimDesigns(designs) {
  if (!Array.isArray(designs)) return designs;
  return designs.map((d) => ({
    ...d,
    imageUrl: trimForDb(d?.imageUrl, `design.imageUrl(seed=${d?.seed})`),
  }));
}

function dbRowToJob(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    step: row.step ?? 0,
    loading: !!row.loading,
    loadingMsg: row.loading_msg || "",
    loadingProgress: row.loading_progress ?? 0,
    category: row.category,
    topTab: row.top_tab || "furniture",
    selectedRoom: row.selected_room || "침실",
    stylePreset: row.style_preset,
    prompt: row.prompt || "",
    refImages: safeParse(row.ref_images) || [],
    variantCount: row.variant_count ?? 4,
    designs: safeParse(row.designs) || [],
    enhancedPrompt: row.enhanced_prompt || "",
    selectedDesign: row.selected_design,
    feedback: row.feedback || "",
    votes: safeParse(row.votes) || {},
    voters: safeParse(row.voters) || [],
    currentVoter: row.current_voter || "",
    currentVotes: safeParse(row.current_votes) || [],
    conceptSheet: row.concept_sheet,
    multiViewImages: safeParse(row.multi_view_images) || {},
  };
}

function jobToDbPayload(job, actor) {
  return {
    step: job.step ?? 0,
    loading: job.loading ? 1 : 0,
    loading_msg: job.loadingMsg || null,
    loading_progress: job.loadingProgress ?? 0,
    category: job.category ?? null,
    top_tab: job.topTab || "furniture",
    selected_room: job.selectedRoom || "침실",
    style_preset: job.stylePreset ?? null,
    prompt: job.prompt ?? null,
    ref_images: JSON.stringify(job.refImages || []),
    variant_count: job.variantCount ?? 4,
    designs: JSON.stringify(trimDesigns(job.designs || [])),
    enhanced_prompt: job.enhancedPrompt ?? null,
    selected_design: job.selectedDesign ?? null,
    feedback: job.feedback ?? null,
    votes: JSON.stringify(job.votes || {}),
    voters: JSON.stringify(job.voters || []),
    current_voter: job.currentVoter ?? null,
    current_votes: JSON.stringify(job.currentVotes || []),
    concept_sheet: trimForDb(job.conceptSheet, "job.conceptSheet"),
    multi_view_images: JSON.stringify(job.multiViewImages || {}),
    updated_by: actor || null,
  };
}

function dbRowToCompleted(row) {
  return {
    id: row.id,
    assetCode: row.asset_code,
    category: row.category,
    categoryLabel: row.category_label,
    categoryIcon: row.category_icon,
    style: row.style,
    prompt: row.prompt,
    seed: row.seed,
    colors: safeParse(row.colors) || [],
    gradient: row.gradient,
    imageUrl: row.image_url,
    conceptSheetUrl: row.concept_sheet_url,
    voters: row.voters,
    winner: row.winner,
    pipelineStatus: row.pipeline_status,
    designer: row.designer,
    completedAt: row.completed_at,
  };
}

function completedToDbPayload(item) {
  return {
    id: String(item.id),
    job_id: item.jobId ?? null,
    asset_code: item.assetCode ?? null,
    category: item.category,
    category_label: item.categoryLabel,
    category_icon: item.categoryIcon,
    style: item.style,
    prompt: item.prompt,
    seed: item.seed,
    colors: item.colors || [],
    gradient: item.gradient,
    image_url: trimForDb(item.imageUrl, "completed.imageUrl"),
    concept_sheet_url: trimForDb(item.conceptSheetUrl, "completed.conceptSheetUrl"),
    voters: item.voters,
    winner: item.winner,
    pipeline_status: item.pipelineStatus,
    designer: item.designer,
    completed_at: item.completedAt,
  };
}

function dbRowToWishlist(row) {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    imageUrl: row.image_url,
    gradient: row.gradient,
    createdAt: row.created_at,
  };
}

function wishlistToDbPayload(item) {
  return {
    id: String(item.id),
    title: item.title,
    note: item.note,
    image_url: trimForDb(item.imageUrl, "wishlist.imageUrl"),
    gradient: item.gradient,
    created_at: item.createdAt,
  };
}

function getSlugFromUrl() {
  if (typeof location === "undefined") return null;
  const m = location.pathname.match(/^\/p\/([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

// URL 의 /cards/:id 부분에서 cardId 추출 (v1.10.24 — 딥링크 공유용).
function getCardIdFromUrl() {
  if (typeof location === "undefined") return null;
  const m = location.pathname.match(/^\/p\/[A-Za-z0-9]+\/cards\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// 상세 모달에 매치되는 URL 로 replace/push. pushReplace=true 면 replaceState.
function syncCardUrl(slug, cardId, pushReplace = false) {
  if (typeof history === "undefined" || !slug) return;
  const target = cardId ? `/p/${slug}/cards/${encodeURIComponent(cardId)}` : `/p/${slug}`;
  if (location.pathname === target) return;
  try {
    if (pushReplace) history.replaceState({}, "", target);
    else history.pushState({}, "", target);
  } catch { /* 브라우저 히스토리 사용 불가 환경 무시 */ }
}

// 카드 모달용 헬퍼들.
async function fetchCardDetail(slug, cardId) {
  const r = await fetch(`/api/projects/${slug}/cards/${cardId}`);
  if (!r.ok) return null;
  return r.json();
}

async function patchCard(slug, cardId, patch) {
  const r = await fetch(`/api/projects/${slug}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(`patch ${r.status}`);
  return r.json();
}

async function fetchProfiles() {
  try {
    const r = await fetch("/api/profiles");
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

async function createProfile(name, icon) {
  const r = await fetch("/api/profiles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, icon }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `profile ${r.status}`);
  }
  return r.json();
}

async function updateProfile(id, name, icon) {
  const r = await fetch(`/api/profiles/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, icon }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `profile ${r.status}`);
  }
  return r.json();
}

async function postCardComment(slug, cardId, body, actor) {
  const r = await fetch(`/api/projects/${slug}/cards/${cardId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body, actor }),
  });
  if (!r.ok) throw new Error(`comment ${r.status}`);
  return r.json();
}

// 본인 댓글 삭제 — 서버가 actor 일치 검사.
async function deleteCardComment(slug, cardId, commentId, actor) {
  const r = await fetch(`/api/projects/${slug}/cards/${cardId}/comments/${commentId}?actor=${encodeURIComponent(actor || "")}`, {
    method: "DELETE",
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `delete ${r.status}`);
  }
  return r.json();
}

// 본인 댓글 수정 — 서버가 actor 일치 검사.
async function patchCardComment(slug, cardId, commentId, body, actor) {
  const r = await fetch(`/api/projects/${slug}/cards/${cardId}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body, actor }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `edit ${r.status}`);
  }
  return r.json();
}

// v1.10.74 — 용어 통일: 위시 / 시안 / 투표 / 시트 / 완료
const STATUS_META = {
  wishlist: { label: "위시",  icon: "⭐", color: "#f59e0b" },
  drafting: { label: "시안",  icon: "🎨", color: "#7c3aed" },
  sheet:    { label: "시트",  icon: "📑", color: "#076ee8" },
  done:     { label: "완료",  icon: "✅", color: "#22c55e" },
};

// 카드 내부 "시안 생성" 액션.
// - card.data.category / style_preset 으로 enhanced prompt 자동 구성
// - card.data.ref_images 가 있으면 Gemini multimodal 로 함께 전송
// - 결과를 card.data.designs 에 append, PATCH 로 저장
async function generateCardVariants({ card, count, prompt, geminiApiKey, selectedModel, slug, actor, onProgress, extraPromptToSave }) {
  const seeds = Array.from({ length: Math.max(1, Math.min(4, count)) }, () => generateSeed());

  // prompt enhance — 영문 일관성 우선, 카테고리 spec hints 는 제외 (사용자 요청 v1.7.9).
  const catInfo = card.data?.category
    ? FURNITURE_CATEGORIES.find((c) => c.id === card.data.category)
    : null;
  const styleInfo = card.data?.style_preset
    ? STYLE_PRESETS.find((s) => s.id === card.data.style_preset)
    : null;

  // PascalCase / snake_case id 를 영문 자연어로 변환. "VanityTable" → "vanity table",
  // "Child_Bed" → "child bed", "Mid_Century_Modern" → "mid century modern".
  const toEnglish = (id) => typeof id === "string"
    ? id.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().trim()
    : "";
  const englishCategory = catInfo ? toEnglish(catInfo.id) : "";
  const englishStyle = styleInfo ? toEnglish(styleInfo.id) : "modern";

  // 크기 힌트 — size_info 가 있으면 "target size: WxDxHcm" 로 프롬프트에 포함.
  const si = card.data?.size_info;
  const dims = [
    si?.width_cm ? `${si.width_cm}cm wide` : null,
    si?.depth_cm ? `${si.depth_cm}cm deep` : null,
    si?.height_cm ? `${si.height_cm}cm tall` : null,
  ].filter(Boolean);
  const sizeHint = dims.length ? `, target size: ${dims.join(", ")}` : "";

  const enhancedPrompt = catInfo
    ? `${englishCategory} furniture asset, ${englishStyle} style, ${prompt}${sizeHint}, product design concept, white background, studio lighting, high detail, game asset reference`
    : prompt;

  // ref_images 가 비어있고 card.thumbnail_url 이 있으면 (위시리스트에서 넘어온
  // 이미지) fallback 으로 포함시켜 Gemini multimodal 에 확실히 전달.
  // v1.10.58 — 대표이미지(thumbnail_url) 를 항상 참조 1순위로 prepend.
  // 이전엔 ref_images 가 있으면 대표가 무시됐지만, 사용자는 "대표를 기준으로 보강" 을 기대.
  // 대표가 ref_images 에 이미 들어가 있으면 중복 제거 후 맨 앞으로.
  let refImages = Array.isArray(card.data?.ref_images) ? [...card.data.ref_images] : [];
  if (card.thumbnail_url) {
    refImages = refImages.filter((u) => u !== card.thumbnail_url);
    refImages.unshift(card.thumbnail_url);
  }

  const tasks = seeds.map((s) => async () => {
    try {
      const raw = await generateImageWithGemini(geminiApiKey, enhancedPrompt, selectedModel, refImages);
      const uploaded = await uploadDataUrl(raw);
      return { seed: s, imageUrl: uploaded, createdAt: new Date().toISOString() };
    } catch (err) {
      return { seed: s, imageUrl: null, error: err.message, createdAt: new Date().toISOString() };
    }
  });
  const results = await runWithConcurrencyLimit(tasks, 4, onProgress);
  const valid = results.filter((r) => r && r.imageUrl);
  const existing = Array.isArray(card.data?.designs) ? card.data.designs : [];
  const nextData = {
    ...(card.data || {}),
    prompt,
    enhanced_prompt: enhancedPrompt,
    designs: [...existing, ...valid],
    // v1.10.58 — 다음 회차 자동 복원용 추가 프롬프트 저장 (빈 값이면 null 로 클리어).
    last_extra_prompt: (typeof extraPromptToSave === "string" && extraPromptToSave.trim())
      ? extraPromptToSave.trim() : null,
  };
  // 첫 시안 생성이면 썸네일 갱신 (참조 이미지가 아닌 생성된 결과로).
  const patch = { data: nextData, actor };
  if (valid[0]?.imageUrl && (card.data?.source === "wishlist" || !card.thumbnail_url)) {
    patch.thumbnail_url = valid[0].imageUrl;
  }
  await fetch(`/api/projects/${slug}/cards/${card.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  return { added: valid.length, failed: results.length - valid.length };
}

// dataURL 을 서버에 업로드하고 /data/images/... URL 을 반환.
// 이미 URL 이거나 업로드 실패 시 원본 반환 (fallback 으로 dataURL 유지).
async function uploadDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return dataUrl;
  if (!dataUrl.startsWith("data:")) return dataUrl; // 이미 URL
  try {
    const r = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    if (!r.ok) throw new Error(`upload ${r.status}`);
    const data = await r.json();
    return data.url || dataUrl;
  } catch (e) {
    console.warn("이미지 업로드 실패, dataURL 로 대체:", e.message);
    return dataUrl;
  }
}

// 카드 상세 모달 안에 인라인으로 보이는 어셋 정보 에디터.
// 프롬프트 + 참조 이미지 전용 편집기 (v1.10.9 — AssetInfoEditor 에서 분리).
// 우측 프레임 시안 생성 위에 배치. 자체 state + PATCH + onRefresh 로 동기화.
function PromptRefEditor({ card, projectSlug, actor, disabled, onRefresh, onOpenImage }) {
  const initialRefs = (card.data?.ref_images && card.data.ref_images.length)
    ? card.data.ref_images
    : (card.thumbnail_url ? [card.thumbnail_url] : []);
  const [prompt, setPrompt] = React.useState(card.data?.prompt || card.description || "");
  const [refImages, setRefImages] = React.useState(initialRefs);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    setPrompt(card.data?.prompt || card.description || "");
    const next = (card.data?.ref_images && card.data.ref_images.length)
      ? card.data.ref_images
      : (card.thumbnail_url ? [card.thumbnail_url] : []);
    setRefImages(next);
  }, [card.id, card.updated_at]);

  const save = async (patchFields) => {
    if (disabled) return;
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: { ...(card.data || {}), ...patchFields }, actor }),
      });
      await onRefresh?.();
    } catch (e) { console.warn("프롬프트/참조 저장 실패:", e); }
  };

  // 초기 진입 시 ref_images 서버에 없는데 thumbnail_url 로 seed 된 상태면 한번 저장.
  React.useEffect(() => {
    if (disabled) return;
    const hasServerRefs = Array.isArray(card.data?.ref_images) && card.data.ref_images.length > 0;
    if (!hasServerRefs && card.thumbnail_url && refImages.length > 0) {
      save({ ref_images: refImages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  const addRefFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = await uploadDataUrl(ev.target.result);
      setRefImages((prev) => {
        if (prev.length >= 4) return prev;
        const next = [...prev, url];
        save({ ref_images: next });
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  // 상세 모달 열린 상태에서 Ctrl+V 로 이미지 붙여넣기 지원.
  React.useEffect(() => {
    if (disabled) return;
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) { addRefFile(f); e.preventDefault(); return; }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, disabled]);

  const fieldLabel = { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 };
  const fieldBox = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: "1px solid var(--surface-border)",
    background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
    fontSize: 13, color: "var(--text-main)", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      padding: 14, borderRadius: 12,
      background: "rgba(7,110,232,0.04)",
      border: "1px solid rgba(7,110,232,0.18)",
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={fieldLabel}>📝 프롬프트 <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>(재질·색상·치수 등 자세히)</span></div>
        <textarea
          value={prompt}
          disabled={disabled}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={() => {
            if (prompt !== (card.data?.prompt || card.description || "")) {
              save({ prompt: prompt.trim() });
            }
          }}
          rows={4}
          placeholder="원하는 어셋을 자세히 적어주세요 (blur 시 자동 저장)"
          style={{ ...fieldBox, fontSize: 13, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div>
        <div style={fieldLabel}>🖼️ 참조 이미지 ({refImages.length}/4) <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>(Gemini multimodal · Ctrl+V 로 붙여넣기)</span></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {refImages.map((url, i) => {
            const isCover = card.thumbnail_url === url;
            return (
              <div
                key={i}
                onMouseEnter={(e) => { const ov = e.currentTarget.querySelector(".ref-hover-overlay"); if (ov) ov.style.opacity = 1; }}
                onMouseLeave={(e) => { const ov = e.currentTarget.querySelector(".ref-hover-overlay"); if (ov) ov.style.opacity = 0; }}
                style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}
              >
                <img
                  src={url}
                  alt=""
                  onClick={() => onOpenImage?.(url)}
                  style={{
                    width: 144, height: 144, objectFit: "cover", display: "block",
                    border: isCover ? "2px solid #fbbf24" : "1px solid var(--surface-border)",
                    cursor: onOpenImage ? "zoom-in" : "default",
                  }}
                />
                {isCover && (
                  <div style={{
                    position: "absolute", top: 4, left: 4,
                    padding: "2px 6px", borderRadius: 4,
                    background: "#fbbf24", color: "#000", fontSize: 9, fontWeight: 800,
                    pointerEvents: "none",
                  }}>⭐ 대표</div>
                )}
                {!disabled && (
                  <div
                    className="ref-hover-overlay"
                    style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "flex-end", justifyContent: "center",
                      padding: 6,
                      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 55%)",
                      opacity: 0, transition: "opacity 0.2s",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ display: "flex", gap: 4, pointerEvents: "auto" }}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
                              method: "PATCH",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ thumbnail_url: url, actor }),
                            });
                            await onRefresh?.();
                          } catch (err) { alert("대표 지정 실패: " + err.message); }
                        }}
                        disabled={isCover}
                        title={isCover ? "이미 대표" : "카드 썸네일로 지정"}
                        style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: isCover ? "#fbbf24" : "rgba(255,255,255,0.9)",
                          border: "none", color: isCover ? "#000" : "var(--text-main)",
                          cursor: isCover ? "default" : "pointer",
                        }}
                      >{isCover ? "⭐ 대표" : "☆ 대표"}</button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const next = refImages.filter((_, idx) => idx !== i);
                          setRefImages(next);
                          await save({ ref_images: next });
                        }}
                        title="참조 이미지 삭제"
                        style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: "rgba(239,68,68,0.9)", border: "none", color: "#fff", cursor: "pointer",
                        }}
                      >✕ 삭제</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!disabled && refImages.length < 4 && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => { addRefFile(e.target.files?.[0]); e.target.value = ""; }}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 144, height: 144, borderRadius: 10,
                  background: "rgba(0,0,0,0.03)", border: "1px dashed var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                }}
              >+ 추가</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 카테고리 / 스타일 필드 자동 저장 (v1.10.9 — 프롬프트 + 참조는 PromptRefEditor 로 분리).
// 카드 생성은 최소 정보(제목)로, 어셋 정보는 여기서 점진적으로 채운다.
function AssetInfoEditor({ card, projectSlug, actor, onRefresh, disabled, onOpenImage, onOpenCatalog, geminiApiKey, availableUpdates = [] }) {
  const [category, setCategory] = React.useState(card.data?.category || "");
  const [stylePreset, setStylePreset] = React.useState(card.data?.style_preset || "");
  const [saving, setSaving] = React.useState(false);
  const [suggesting, setSuggesting] = React.useState(false);

  // 🤖 자동 분류 (v1.10.50) — Gemini 로 카테고리 / 스타일 / 크기 / 프롬프트 한 번에
  // 추출해서 **바로 저장**. 사용자가 명시적으로 버튼을 눌렀으므로 기존 값도 덮어씀
  // (대표이미지 교체 후 재분석 시 새 결과가 즉시 반영되게). 프롬프트는 비어있을 때만 추가.
  const runCategorySuggest = async () => {
    if (!geminiApiKey) { alert("Gemini API 키가 필요합니다 (우측 상단 API 설정)"); return; }
    const refs = Array.isArray(card.data?.ref_images) ? card.data.ref_images : [];
    const src = refs[0] || card.thumbnail_url;
    if (!src) { alert("참조 이미지를 먼저 추가해주세요"); return; }
    setSuggesting(true);
    try {
      const existingPrompt = card.data?.prompt || card.description || "";
      const [clsResult, promptResult] = await Promise.allSettled([
        classifyCategoryWithGemini(geminiApiKey, src),
        existingPrompt ? Promise.resolve(null) : generatePromptFromImage(geminiApiKey, src, card.title),
      ]);
      const r = clsResult.status === "fulfilled" ? clsResult.value : null;
      const p = promptResult.status === "fulfilled" ? promptResult.value : null;
      // v1.10.92 — 실패 사유를 구분해 표시. console 에 더 자세한 정보.
      if (clsResult.status === "rejected") console.warn("[자동 분류] classify 거부:", clsResult.reason);
      if (promptResult.status === "rejected") console.warn("[자동 분류] prompt 거부:", promptResult.reason);
      if (!r && !p) {
        const errMsg = clsResult.status === "rejected"
          ? `자동 분류 실패: ${clsResult.reason?.message || clsResult.reason}\n\n(F12 콘솔에서 상세 확인 가능)`
          : "자동 분류 실패 — Gemini 응답에서 카테고리를 인식하지 못했습니다.\n\n원인 후보:\n• 이미지가 가구/오브젝트가 아님\n• 카테고리 목록이 아직 로드되지 않음 (새로고침 후 재시도)\n• Gemini 응답이 예상 JSON 포맷이 아님\n\n(F12 콘솔에서 [자동 분류] 로그 확인)";
        alert(errMsg);
        return;
      }

      const patch = {};
      // 카테고리 / 스타일은 버튼 클릭 = 재분석 의도 → 덮어씀 (v1.10.50).
      if (r?.category_id) {
        patch.category = r.category_id;
        setCategory(r.category_id);
      }
      if (r?.style_id) {
        patch.style_preset = r.style_id;
        setStylePreset(r.style_id);
      }
      // 크기는 수동 입력이면 존중 (정확한 값이라 AI 추정으로 덮어쓰지 않음).
      const existingSize = card.data?.size_info;
      const sizeManuallySet = existingSize?.source === "manual" && (existingSize.width_cm || existingSize.depth_cm || existingSize.height_cm);
      if (r?.size_info && !sizeManuallySet) {
        patch.size_info = {
          width_cm: r.size_info.width_cm,
          depth_cm: r.size_info.depth_cm,
          height_cm: r.size_info.height_cm,
          source: "ai",
          confidence: r.size_info.confidence,
          reason: r.size_info.reason,
          updated_at: new Date().toISOString(),
        };
      }
      // posmap features + 카탈로그 매칭 — 덮어씀.
      if (r?.posmap_features) {
        patch.posmap_features = r.posmap_features;
        if (Object.keys(POSMAP_SCORES).length > 0) {
          const catId = r.category_id || card.data?.category;
          const matches = findSimilarCatalogAssets(r.posmap_features, catId, 12);
          if (matches.length > 0) {
            patch.catalog_matches = {
              features: r.posmap_features,
              items: matches.map((m) => ({
                id: m.id,
                score: m.score,
                normalized: m.normalized,
                filter: m.filter,
                lv1: m.lv1,
                lv2: m.lv2,
              })),
              generated_at: new Date().toISOString(),
            };
          }
        }
      }
      // 프롬프트는 비어있을 때만 초안 추가 (사용자가 쓴 프롬프트는 존중).
      if (p && !existingPrompt) {
        patch.prompt = p;
      }

      if (Object.keys(patch).length > 0) {
        await save(patch);
      } else {
        alert("이미지에서 분류 결과를 얻지 못했습니다.");
      }
    } catch (e) {
      alert("자동 분류 실패: " + e.message);
    } finally {
      setSuggesting(false);
    }
  };

  // 서버에서 카드가 갱신되면 로컬 폼 상태도 동기화.
  React.useEffect(() => {
    setCategory(card.data?.category || "");
    setStylePreset(card.data?.style_preset || "");
  }, [card.id, card.updated_at]);

  const save = async (patchFields) => {
    if (disabled) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), ...patchFields },
          actor,
        }),
      });
      await onRefresh();
    } catch (e) { console.warn("어셋 정보 저장 실패:", e); }
    finally { setSaving(false); }
  };

  // 카테고리 선택 시 카탈로그 기준 기본 크기로 size_info 자동 채움.
  // 사용자가 manual 로 값을 입력했거나 AI 가 채운 경우엔 건드리지 않음.
  React.useEffect(() => {
    if (disabled) return;
    if (!category) return;
    const existing = card.data?.size_info;
    const hasValue = existing && (existing.width_cm || existing.depth_cm || existing.height_cm);
    if (hasValue) return; // 이미 값이 있으면 건드리지 않음
    const def = categoryToDefaultSize(category);
    if (!def) return;
    save({
      size_info: {
        ...def,
        source: "catalog",
        updated_at: new Date().toISOString(),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, card.id]);

  // 참조 이미지 seed / paste / addRefFile 은 PromptRefEditor 로 이동됨 (v1.10.9).

  const fieldLabel = { fontSize: 11, fontWeight: 700, color: "var(--text-lighter)", marginBottom: 5 };
  const fieldBox = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: "1px solid var(--surface-border)", background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
    fontSize: 13, color: "var(--text-main)", boxSizing: "border-box",
  };

  return (
    <div style={{
      marginBottom: 20, padding: 14, borderRadius: 12,
      background: "rgba(7,110,232,0.03)", border: "1px solid rgba(7,110,232,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>
          📝 어셋 정보
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {saving ? "저장 중…" : "자동 저장"}
        </div>
        {!disabled && (() => {
          // 자동 분류 버튼을 어셋 정보 헤더로 이동 (v1.10.50).
          const firstRef = Array.isArray(card.data?.ref_images) ? card.data.ref_images[0] : null;
          const noImage = !firstRef && !card.thumbnail_url;
          return (
            <button
              onClick={runCategorySuggest}
              disabled={suggesting || noImage}
              title={noImage
                ? "대표 이미지 / 참조 이미지 필요"
                : "대표 이미지 기준으로 카테고리·스타일·크기·프롬프트 자동 분류 (Gemini Vision). 기존 값은 덮어씀"}
              style={{
                marginLeft: "auto",
                padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: suggesting ? "rgba(0,0,0,0.06)" : "rgba(7,110,232,0.08)",
                border: "1px solid rgba(7,110,232,0.3)",
                color: suggesting ? "var(--text-muted)" : "var(--primary)",
                cursor: (suggesting || noImage) ? "not-allowed" : "pointer",
              }}
            >{suggesting ? "⏳ 분석 중…" : "🤖 자동 분류"}</button>
          );
        })()}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={fieldLabel}>카테고리</div>
          <CategoryPicker
            value={category}
            disabled={disabled}
            onChange={(v) => { setCategory(v); save({ category: v }); }}
          />
        </div>
        <div>
          <div style={fieldLabel}>스타일 프리셋</div>
          <select
            value={stylePreset}
            disabled={disabled}
            onChange={(e) => { const v = e.target.value; setStylePreset(v); save({ style_preset: v }); }}
            style={fieldBox}
          >
            <option value="">— 자동 (modern) —</option>
            {STYLE_PRESETS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 카테고리 선택 시 inzoiObjectList 에서 가져온 스펙 정보 표시.
          sample_names / common_tags / styles 는 Gemini 프롬프트에도 자동 반영된다. */}
      {(() => {
        const cat = category ? FURNITURE_CATEGORIES.find((c) => c.id === category) : null;
        const spec = cat?.spec;
        if (!cat || !spec) return null;
        const pr = spec.price_range;
        const fmtPrice = (n) => n >= 10000 ? `${(n / 10000).toFixed(1)}만` : `${n.toLocaleString()}`;
        const hilite = { color: "var(--text-muted)", fontWeight: 600, minWidth: 60, display: "inline-block" };
        return (
          <div style={{
            marginBottom: 10, padding: "10px 12px", borderRadius: 8,
            background: "rgba(7,110,232,0.05)", border: "1px solid rgba(7,110,232,0.18)",
            fontSize: 11, color: "var(--text-lighter)", lineHeight: 1.7,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: 12 }}>
                {cat.icon} {cat.label} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {cat.group} / {cat.room}</span>
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 10, marginLeft: "auto" }}>
                카탈로그 {spec.asset_count}개 에셋 기반 · Gemini 프롬프트 자동 반영
              </span>
            </div>
            {spec.sample_desc && (
              <div style={{
                marginBottom: 6, padding: "6px 10px", borderRadius: 6,
                background: "rgba(0,0,0,0.03)", fontStyle: "italic",
                color: "var(--text-main)", fontSize: 11, lineHeight: 1.5,
              }}>
                "{spec.sample_desc}"
              </div>
            )}
            {spec.sample_names?.length > 0 && (
              <div><span style={hilite}>예시 이름</span>{spec.sample_names.slice(0, 5).join(" · ")}</div>
            )}
            {spec.common_tags?.length > 0 && (
              <div><span style={hilite}>태그</span>{spec.common_tags.slice(0, 6).join(", ")}</div>
            )}
            {spec.styles?.length > 0 && (
              <div><span style={hilite}>스타일</span>{spec.styles.map((s) => {
                const sp = STYLE_PRESETS.find((p) => p.id === s);
                return sp ? sp.label : s;
              }).join(", ")}</div>
            )}
            {pr && (
              <div>
                <span style={hilite}>가격대</span>
                {fmtPrice(pr.min)} ~ {fmtPrice(pr.max)}
                <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>(중앙값 {fmtPrice(pr.median)})</span>
              </div>
            )}
            {(spec.unlock_count > 0 || spec.custom_count > 0) && (
              <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 4 }}>
                {spec.custom_count > 0 && `🎨 커스터마이즈 ${spec.custom_count}개`}
                {spec.custom_count > 0 && spec.unlock_count > 0 && " · "}
                {spec.unlock_count > 0 && `🔒 조건부 해금 ${spec.unlock_count}개`}
              </div>
            )}
            {(() => {
              // v1.10.4: 저장된 features (card.data.catalog_matches.features 또는 posmap_features)
              // 가 있으면 매번 fresh 로 재계산 — 가중치 조정 후 기존 카드도 자동 반영.
              // features 없으면 spec.sample_thumbs (기본 카테고리 정렬) 로 fallback.
              const cm = card.data?.catalog_matches;
              const features = cm?.features || card.data?.posmap_features;
              const fresh = features && typeof features === "object"
                ? findSimilarCatalogAssets(features, card.data?.category, 12)
                : [];
              const useMatches = fresh.length > 0;
              const items = useMatches
                ? fresh.map((m) => {
                    const fromSpec = spec.sample_thumbs?.find((s) => s.id === m.id);
                    // 아이콘 파일명이 id 와 다를 수 있어 m.icon (objects.json 의 icon 필드) 우선 사용.
                    // 그 다음 sample_thumbs 의 미리 만들어진 URL, 마지막으로 id 를 파일명으로 시도.
                    const iconKey = m.icon || m.id;
                    return {
                      id: m.id,
                      name: m.name || fromSpec?.name || m.id,
                      icon_url: fromSpec?.icon_url || `/api/object-icon/${encodeURIComponent(iconKey)}`,
                      filter: m.filter,
                      score: m.score,
                      normalized: m.normalized,
                    };
                  })
                : (() => {
                    // v1.10.56 — 같은 icon_url 또는 name 이 여러 카테고리에 복사되어 있어도 한 번만.
                    const seenT = new Set();
                    const out = [];
                    for (const t of (spec.sample_thumbs || [])) {
                      const key = t.icon_url || t.name || t.id;
                      if (seenT.has(key)) continue;
                      seenT.add(key);
                      out.push({ ...t });
                    }
                    return out;
                  })();
              if (items.length === 0) return null;
              return (
                <div style={{
                  marginTop: 10, paddingTop: 10,
                  borderTop: "1px dashed rgba(7,110,232,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>
                      {useMatches ? "🎯 유사 에셋 (posmap 매칭)" : "📦 기존 제작 에셋"}
                      <span style={{ color: "var(--text-muted)", fontWeight: 500 }}> ({items.length}{useMatches ? "" : ` / ${spec.asset_count}`})</span>
                    </span>
                    {useMatches && cm?.features && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text-muted)" }}>
                        기준:
                        {cm.features.keywords?.length > 0 && (
                          <span style={{ color: "var(--primary)", fontWeight: 700 }}> 🔑 {cm.features.keywords.join(", ")}</span>
                        )}
                        {cm.features.shape?.length > 0 && ` · ${cm.features.shape.join("/")}`}
                        {cm.features.style && ` · ${cm.features.style}`}
                        {cm.features.materials?.length > 0 && ` · ${cm.features.materials.slice(0, 2).join(",")}`}
                      </span>
                    )}
                    <button
                      onClick={() => onOpenCatalog?.("")}
                      title="카탈로그 전체 브라우즈"
                      style={{
                        marginLeft: "auto", fontSize: 10, fontWeight: 600,
                        padding: "3px 10px", borderRadius: 6,
                        background: "rgba(7,110,232,0.08)", border: "1px solid rgba(7,110,232,0.25)",
                        color: "var(--primary)", cursor: "pointer",
                      }}
                    >📎 카탈로그 전체 보기</button>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                    gap: 6,
                  }}>
                    {items.map((t) => {
                      const filterKo = t.filter ? FURNITURE_CATEGORIES.find((c) => c.id === t.filter)?.label : null;
                      const filterIcon = t.filter ? FURNITURE_CATEGORIES.find((c) => c.id === t.filter)?.icon : null;
                      const pct = t.normalized != null ? Math.round(t.normalized * 100) : null;
                      return (
                        <div
                          key={t.id}
                          onClick={() => onOpenCatalog?.(t.id)}
                          title={`카탈로그 상세: ${t.name}${t.filter ? ` · ${filterKo || t.filter}` : ""}${pct != null ? ` · 유사도 ${pct}%` : ""}`}
                          style={{
                            cursor: onOpenCatalog ? "pointer" : "default",
                            borderRadius: 6, overflow: "hidden",
                            border: "1px solid var(--surface-border)",
                            background: "#fff",
                            transition: "border-color 0.15s, transform 0.15s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "var(--primary)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "var(--surface-border)";
                            e.currentTarget.style.transform = "none";
                          }}
                        >
                          <div style={{
                            width: "100%", aspectRatio: "1/1",
                            background: "rgba(0,0,0,0.03)",
                            position: "relative",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <img
                              src={t.icon_url}
                              alt={t.name}
                              loading="lazy"
                              onError={(e) => {
                                // 이미지 로드 실패 시 숨기고 카테고리 이모지 fallback 표시 (v1.10.17).
                                const img = e.currentTarget;
                                if (!img._fallback) {
                                  img._fallback = true;
                                  img.style.display = "none";
                                  const parent = img.parentNode;
                                  if (parent && !parent.querySelector(".icon-fallback")) {
                                    const span = document.createElement("span");
                                    span.className = "icon-fallback";
                                    span.textContent = filterIcon || "📦";
                                    span.style.cssText = "font-size:28px;opacity:0.4;";
                                    parent.appendChild(span);
                                  }
                                }
                              }}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </div>
                          <div style={{
                            padding: "3px 5px",
                            fontSize: 9, color: "var(--text-main)", fontWeight: 600,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            textAlign: "center",
                          }}>
                            {t.name}
                          </div>
                          {filterKo && (
                            <div style={{
                              padding: "0 5px 3px",
                              fontSize: 8, color: "var(--text-muted)",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              textAlign: "center",
                            }}>
                              {filterIcon} {filterKo}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* 📏 크기 정보 — 강조된 박스. 수동 입력 + '🤖 자동 분류' 버튼이 AI 추정까지 통합 처리.
          카테고리 선택 시 카탈로그 기본 크기로 자동 채움(source='catalog'). */}
      <SizeInfoPanel
        card={card}
        disabled={disabled}
        categoryId={category}
        onSave={async (sizeInfo) => { await save({ size_info: sizeInfo }); }}
      />

      {/* 프롬프트 + 참조 이미지는 우측 프레임 PromptRefEditor 로 분리됨 (v1.10.9) */}
    </div>
  );
}

// 카드 상태별 액션 패널 (Phase E):
//   wishlist → "시안 생성 시작"
//   drafting → Gemini 시안 추가 생성 + 그리드 + 선정
//   sheet    → "최종 완료" 버튼 (시트 생성은 기존 흐름 혹은 간단화)
//   done     → (confirmed 잠금, 이 패널은 렌더 안 함)
function CardActionPanel({ card, statusKey, projectSlug, geminiApiKey, selectedModel, actor, onMoveTo, onRefresh, onOpenApiSettings, onOpenImage, onGenerateProgress, onGenerateEnd }) {
  // v1.10.58 — drafting 분기가 DesignsPanel 로 이동(v1.10.57)한 뒤 남은 dead-state 정리.
  // sheet 분기의 makeSheet 가 busy/progress 만 사용. count/extraPrompt/doGenerate/
  // selectDesign/setCoverDesign/removeDesign 은 모두 DesignsPanel 로 이주됨.
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(null);

  const designs = Array.isArray(card.data?.designs) ? card.data.designs : [];
  const selectedIdx = card.data?.selected_design;

  const sectionStyle = {
    marginBottom: 20, padding: 14, borderRadius: 12,
    background: "linear-gradient(135deg, rgba(7,110,232,0.04), rgba(139,92,246,0.02))",
    border: "1px solid rgba(7,110,232,0.18)",
  };
  const titleStyle = { fontSize: 13, fontWeight: 800, color: "var(--primary)", marginBottom: 10 };

  if (statusKey === "wishlist") {
    return <WishlistToDraftingAction card={card} onMoveTo={onMoveTo} />;
  }

  // v1.10.57 — drafting 분기는 DesignsPanel 로 흡수됨. 시안 그리드와 생성 UI 가
  // 한 패널에 통합되어 시각 중복 제거.
  if (statusKey === "drafting") return null;

  if (statusKey === "sheet") {
    const selectedDesign = selectedIdx != null ? designs[selectedIdx] : null;
    const views = card.data?.concept_sheet_views || null; // { front, side, back, top }
    const hasViews = views && (views.front || views.side || views.back || views.top);
    // 소스 이미지 우선순위: 선정된 시안 → 첫 이미지 있는 시안 → 카드 썸네일.
    const fallbackDesign = !selectedDesign?.imageUrl
      ? designs.find((d) => d?.imageUrl) || null
      : null;
    const sourceImageUrl = selectedDesign?.imageUrl || fallbackDesign?.imageUrl || card.thumbnail_url;
    const sourceSeed = selectedDesign?.seed ?? fallbackDesign?.seed ?? null;
    const canMakeSheet = !!sourceImageUrl && !!geminiApiKey;
    const sourceLabel = selectedDesign?.imageUrl
      ? `선정 시안 #${selectedIdx + 1}`
      : fallbackDesign
        ? `시안 #${designs.indexOf(fallbackDesign) + 1} (미선정)`
        : card.thumbnail_url ? "카드 썸네일" : null;

    const makeSheet = async () => {
      if (!geminiApiKey) { onOpenApiSettings?.(); return; }
      if (!sourceImageUrl) { alert("컨셉시트에 사용할 이미지가 없습니다."); return; }
      setBusy(true);
      const totalViews = SHEET_VIEWS.length;
      setProgress({ done: 0, total: totalViews });
      // 작업큐에도 등록 — 시안 생성과 동일하게 floating queue 에 노출 (v1.10.19 fix).
      onGenerateProgress?.(card, 0, totalViews);
      try {
        const contextLabel = card.data?.category_label || card.title || "furniture asset";
        const results = await generateConceptSheetViews({
          apiKey: geminiApiKey,
          sourceImageUrl,
          model: selectedModel,
          contextLabel,
          onProgress: (done, total) => {
            setProgress({ done, total });
            onGenerateProgress?.(card, done, total);
          },
        });
        const viewsObj = {};
        for (const r of results) {
          if (r?.imageUrl) viewsObj[r.view] = r.imageUrl;
        }
        const failed = SHEET_VIEWS.length - Object.keys(viewsObj).length;
        if (Object.keys(viewsObj).length === 0) {
          alert("컨셉시트 4뷰 생성 전부 실패. 다시 시도해주세요.");
          return;
        }
        const front = viewsObj.front || viewsObj.side || viewsObj.back || viewsObj.top || null;
        // 재생성 시 기존 시트를 삭제하지 않고 concept_sheet_history 에 보존 (v1.10.20).
        const existingViews = card.data?.concept_sheet_views || null;
        const prevHistory = Array.isArray(card.data?.concept_sheet_history) ? card.data.concept_sheet_history : [];
        const nextHistory = existingViews
          ? [existingViews, ...prevHistory] // 최신이 앞, 이전 기록 뒤로
          : prevHistory;
        await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            data: {
              ...(card.data || {}),
              concept_sheet_views: {
                ...viewsObj,
                model: selectedModel,
                generated_at: new Date().toISOString(),
                source_image_url: sourceImageUrl,
                source_seed: sourceSeed,
              },
              concept_sheet_history: nextHistory,
              concept_sheet_url: front, // 정면뷰(또는 가용 첫 뷰) 를 기존 필드에도 저장
            },
            thumbnail_url: front || card.thumbnail_url,
            actor,
          }),
        });
        await onRefresh();
        if (failed > 0) alert(`${failed}개 뷰 생성 실패 — 재생성으로 다시 시도할 수 있습니다.`);
      } catch (e) {
        alert("컨셉시트 생성 실패: " + e.message);
      } finally {
        setBusy(false); setProgress(null);
        onGenerateEnd?.(card); // 작업큐에서 제거
      }
    };

    return (
      <div style={sectionStyle}>
        <div style={titleStyle}>시트 (4뷰 · Gemini)</div>
        {sourceImageUrl && (
          <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              소스 이미지: {sourceLabel}{sourceSeed != null ? ` (seed: ${sourceSeed})` : ""}
            </div>
            <img
              src={sourceImageUrl}
              alt="소스 이미지"
              onClick={() => onOpenImage?.(sourceImageUrl)}
              style={{ width: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 6, background: "#fff", cursor: onOpenImage ? "zoom-in" : "default" }}
            />
          </div>
        )}

        {hasViews ? (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#22c55e", marginBottom: 6, fontWeight: 700 }}>
              ✓ 4뷰 생성됨 {views.model && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {views.model}</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {SHEET_VIEWS.map((v) => {
                const url = views[v.id];
                return (
                  <div key={v.id} style={{
                    position: "relative", borderRadius: 8, overflow: "hidden",
                    border: "1px solid var(--surface-border)",
                    background: url ? "#000" : "rgba(0,0,0,0.05)",
                  }}>
                    {url ? (
                      <img
                        src={url}
                        alt={v.label}
                        onClick={() => onOpenImage?.(url)}
                        style={{ width: "100%", height: 160, objectFit: "cover", display: "block", cursor: onOpenImage ? "zoom-in" : "default" }}
                      />
                    ) : (
                      <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", fontSize: 11 }}>실패</div>
                    )}
                    <div style={{
                      position: "absolute", top: 4, left: 4,
                      padding: "2px 6px", borderRadius: 4,
                      background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 10, fontWeight: 700,
                      pointerEvents: "none",
                    }}>{v.label}</div>
                    {url && (
                      <a
                        href={url}
                        download={`inzoi_${card.id}_${v.id}.png`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute", bottom: 4, right: 4,
                          padding: "2px 6px", borderRadius: 4,
                          background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10,
                          textDecoration: "none", fontWeight: 600,
                        }}
                        title="PNG 저장"
                      >📥</a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px dashed var(--surface-border)", color: "var(--text-muted)", fontSize: 12, marginBottom: 10 }}>
            정면 · 측면 · 후면 · 상단 4장을 Gemini 로 생성합니다.
          </div>
        )}

        {/* 이전 시트 기록 — 재생성 시 보존 (v1.10.20) */}
        {Array.isArray(card.data?.concept_sheet_history) && card.data.concept_sheet_history.length > 0 && (
          <details style={{ marginBottom: 10 }}>
            <summary style={{
              cursor: "pointer", fontSize: 11, fontWeight: 700,
              color: "var(--text-muted)", padding: "6px 0",
            }}>📚 이전 시트 기록 ({card.data.concept_sheet_history.length})</summary>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {card.data.concept_sheet_history.map((h, i) => (
                <div key={i} style={{ padding: 8, borderRadius: 8, background: "rgba(0,0,0,0.02)", border: "1px solid var(--surface-border)" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                    {h.generated_at ? formatLocalTime(h.generated_at, "full") : "시점 불명"}
                    {h.model && ` · ${h.model}`}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                    {SHEET_VIEWS.map((v) => {
                      const url = h[v.id];
                      return url ? (
                        <img
                          key={v.id}
                          src={url}
                          alt={v.label}
                          title={v.label}
                          onClick={() => onOpenImage?.(url)}
                          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 4, cursor: onOpenImage ? "zoom-in" : "default", border: "1px solid var(--surface-border)" }}
                        />
                      ) : (
                        <div key={v.id} title={`${v.label} (없음)`} style={{ width: "100%", aspectRatio: "1/1", background: "rgba(0,0,0,0.05)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--text-muted)" }}>—</div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={makeSheet}
            disabled={busy || !canMakeSheet}
            style={{
              flex: 1, minWidth: 140, padding: "10px 14px", borderRadius: 10,
              background: busy || !canMakeSheet ? "rgba(0,0,0,0.08)" : "var(--primary)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: busy ? "wait" : (!canMakeSheet ? "not-allowed" : "pointer"),
            }}
            title={!geminiApiKey ? "Gemini API 키 필요" : canMakeSheet ? `${sourceLabel} 으로 4뷰 생성` : "시안 또는 카드 이미지 필요"}
          >
            {busy
              ? `생성 중… ${progress ? `(${progress.done}/${progress.total})` : ""}`
              : hasViews ? "🔄 재생성" : "🎨 4뷰 생성 (Gemini)"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            onClick={() => onMoveTo("done")}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >✅ 최종 완료로 이동</button>
          <button
            onClick={() => onMoveTo("drafting")}
            style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
              color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >← 시안으로</button>
        </div>
      </div>
    );
  }

  return null;
}

// 위시 → 시안 단계 전환 버튼. 어셋 정보는 AssetInfoEditor 에서 이미 편집됨.
// 여기서는 필수 필드(카테고리, 프롬프트) 검증 후 바로 상태 이동.
// 위시 → 시안 단계 전환 버튼. 어셋 정보는 AssetInfoEditor 의 🤖 자동 분류에서 채움.
function WishlistToDraftingAction({ card, onMoveTo }) {
  const hasCategory = !!(card.data?.category);
  const hasPrompt = !!(card.data?.prompt || card.description);
  const ready = hasCategory && hasPrompt;
  const sectionStyle = {
    marginBottom: 20, padding: 14, borderRadius: 12,
    background: "linear-gradient(135deg, rgba(7,110,232,0.04), rgba(139,92,246,0.02))",
    border: "1px solid rgba(7,110,232,0.18)",
  };
  return (
    <div style={sectionStyle}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", marginBottom: 10 }}>
        위시 → 시안
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
        좌측 어셋 정보의 🤖 자동 분류로 카테고리·스타일·크기·프롬프트를 한 번에 채우거나 수동 입력한 뒤 이동하세요.
        {!ready && (
          <div style={{ marginTop: 6, color: "#d97706", fontWeight: 600 }}>
            ⚠ {!hasCategory && "카테고리"}{!hasCategory && !hasPrompt && " · "}{!hasPrompt && "프롬프트"} 필요
          </div>
        )}
      </div>
      <button
        onClick={async () => {
          if (!ready) { alert("카테고리와 프롬프트를 먼저 입력해주세요."); return; }
          await onMoveTo("drafting");
        }}
        className={ready ? "btn-primary" : ""}
        disabled={!ready}
        style={{
          padding: "10px 18px", borderRadius: 10, border: "none",
          background: ready ? undefined : "rgba(0,0,0,0.08)",
          color: ready ? "#fff" : "var(--text-muted)",
          fontSize: 13, fontWeight: 700, cursor: ready ? "pointer" : "not-allowed",
        }}
      >✨ 시안 단계로 이동</button>
    </div>
  );
}


// 카드 제목 인라인 에디터. 클릭(또는 포커스)하면 input 로 전환,
// blur / Enter 로 저장, ESC 로 취소.
// 카드 배열 정렬 헬퍼.
// sortBy 기본값: "date_desc" | "date_asc" | "title_asc" | "title_desc"
// 추가 (v1.9.8, 리스트 뷰 헤더 클릭 정렬용):
//   priority_asc/desc, update_asc/desc, category_asc/desc,
//   style_asc/desc, size_asc/desc, status_asc/desc
// entries 가 card 가 아니라 item({_cardId}) 인 경우 getCard(entry) 로 card 를 얻는다.
function sortCardArray(arr, sortBy, dateKey = "created_at", titleKey = "title", getCard) {
  const cpy = arr.slice();
  const card = getCard || ((x) => x);
  // 우선순위 정렬용 인덱스 (낮을수록 앞): "1" < "2" < "3" < "미정" < "보류"
  const priorityRank = (p) => {
    const idx = PRIORITY_OPTIONS.indexOf(p);
    return idx === -1 ? 99 : idx;
  };
  const cmpStr = (av, bv) => (av || "").localeCompare(bv || "", "ko");
  const cmpNum = (av, bv) => (av || 0) - (bv || 0);
  if (sortBy === "date_asc") {
    cpy.sort((a, b) => cmpStr(a[dateKey], b[dateKey]));
  } else if (sortBy === "title_asc") {
    cpy.sort((a, b) => cmpStr(a[titleKey], b[titleKey]));
  } else if (sortBy === "title_desc") {
    cpy.sort((a, b) => cmpStr(b[titleKey], a[titleKey]));
  } else if (sortBy === "priority_asc" || sortBy === "priority_desc") {
    const dir = sortBy === "priority_asc" ? 1 : -1;
    cpy.sort((a, b) => dir * (priorityRank(getCardPriority(card(a))) - priorityRank(getCardPriority(card(b)))));
  } else if (sortBy === "update_asc" || sortBy === "update_desc") {
    const dir = sortBy === "update_asc" ? 1 : -1;
    // 빈 값 ("미지정") 은 항상 뒤로.
    cpy.sort((a, b) => {
      const av = card(a)?.data?.target_update?.trim?.() || "";
      const bv = card(b)?.data?.target_update?.trim?.() || "";
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return dir * cmpStr(av, bv);
    });
  } else if (sortBy === "category_asc" || sortBy === "category_desc") {
    const dir = sortBy === "category_asc" ? 1 : -1;
    // v1.10.85 — group / room / label 계층 키로 정렬해 같은 상위 분류끼리 묶임.
    const catKey = (id) => {
      const ci = id ? FURNITURE_CATEGORIES.find((c) => c.id === id) : null;
      if (!ci) return "";
      return [ci.group || "", ci.room || "", ci.label || id || ""].join(" / ");
    };
    cpy.sort((a, b) => {
      const aKey = catKey(card(a)?.data?.category);
      const bKey = catKey(card(b)?.data?.category);
      if (!aKey && !bKey) return 0;
      if (!aKey) return 1;
      if (!bKey) return -1;
      return dir * cmpStr(aKey, bKey);
    });
  } else if (sortBy === "style_asc" || sortBy === "style_desc") {
    const dir = sortBy === "style_asc" ? 1 : -1;
    cpy.sort((a, b) => {
      const aId = card(a)?.data?.style_preset;
      const bId = card(b)?.data?.style_preset;
      const aLabel = aId ? (STYLE_PRESETS.find((s) => s.id === aId)?.label || aId) : "";
      const bLabel = bId ? (STYLE_PRESETS.find((s) => s.id === bId)?.label || bId) : "";
      if (!aLabel && !bLabel) return 0;
      if (!aLabel) return 1;
      if (!bLabel) return -1;
      return dir * cmpStr(aLabel, bLabel);
    });
  } else if (sortBy === "size_asc" || sortBy === "size_desc") {
    const dir = sortBy === "size_asc" ? 1 : -1;
    const vol = (c) => {
      const s = c?.data?.size_info || {};
      const w = Number(s.width_cm) || 0, d = Number(s.depth_cm) || 0, h = Number(s.height_cm) || 0;
      return w * d * h;
    };
    cpy.sort((a, b) => dir * cmpNum(vol(card(a)), vol(card(b))));
  } else if (sortBy === "status_asc" || sortBy === "status_desc") {
    const dir = sortBy === "status_asc" ? 1 : -1;
    // 상태 지표: 컨펌된 카드(확정) > 시안 수 > 0
    const rank = (c) => {
      if (!c) return 0;
      if (c.confirmed_at) return 9999;
      const designs = Array.isArray(c.data?.designs) ? c.data.designs.length : 0;
      return designs;
    };
    cpy.sort((a, b) => dir * cmpNum(rank(card(a)), rank(card(b))));
  } else if (sortBy === "stage_asc" || sortBy === "stage_desc") {
    const dir = sortBy === "stage_asc" ? 1 : -1;
    // 진행 단계: wishlist=0, drafting=1, voting(drafting+designs)=2, sheet=3, done=4
    // card._statusKey (부모에서 주입) 가 있으면 그걸 우선 사용.
    const stageRank = (c) => {
      if (!c) return -1;
      if (c.confirmed_at) return 4;
      const sk = c._statusKey;
      if (sk === "done") return 4;
      if (sk === "sheet") return 3;
      if (sk === "wishlist") return 0;
      // drafting: designs 유무로 시안 vs 투표
      const designs = Array.isArray(c.data?.designs) ? c.data.designs : [];
      return designs.length > 0 ? 2 : 1;
    };
    cpy.sort((a, b) => dir * cmpNum(stageRank(card(a)), stageRank(card(b))));
  } else {
    cpy.sort((a, b) => cmpStr(b[dateKey], a[dateKey]));
  }
  return cpy;
}

// inzoiObjectList 에셋 상세 — 커스텀 렌더 대신 카탈로그의 상세 모달을 iframe 으로
// 그대로 사용. 카탈로그 쪽 기능/데이터 업데이트가 자동으로 반영됨.
function CatalogDetailModal({ id, onClose }) {
  const base = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : "http://localhost:8080";
  const src = id ? `${base}/#item=${encodeURIComponent(id)}` : `${base}/`;

  // ESC 로 닫기
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} style={{ zIndex: 299 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "92vw", height: "88vh",
        background: "#fff", border: "1px solid var(--surface-border)",
        borderRadius: 14, zIndex: 300,
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "10px 16px", borderBottom: "1px solid var(--surface-border)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
            📦 inzoi 에셋 카탈로그
          </span>
          {id && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
              {id}
            </span>
          )}
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            title="새 탭에서 열기"
            style={{
              marginLeft: "auto",
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: "rgba(7,110,232,0.08)", border: "1px solid rgba(7,110,232,0.25)",
              color: "var(--primary)", textDecoration: "none",
            }}
          >↗ 새 탭</a>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
              color: "var(--text-muted)", fontSize: 16, cursor: "pointer",
            }}
          >✕</button>
        </div>
        <iframe
          src={src}
          title="inzoi 에셋 카탈로그 상세"
          style={{ flex: 1, width: "100%", border: "none", background: "#fff" }}
        />
      </div>
    </>
  );
}

// 우선순위 enum — 고정 5개. card.data.priority 에 문자열로 저장, 빈값은 '미정'으로 취급.
const PRIORITY_OPTIONS = ["1", "2", "3", "미정", "보류"];
function getCardPriority(card) {
  const v = card?.data?.priority;
  if (v && PRIORITY_OPTIONS.includes(v)) return v;
  return "미정";
}
// 우선순위 뱃지 색상 — 1/2/3 은 경고 레벨, 미정/보류는 눈에 보이는 중립 배경.
function priorityBadgeStyle(p) {
  switch (p) {
    case "1": return { bg: "rgba(220,38,38,0.12)",  fg: "#dc2626", border: "rgba(220,38,38,0.3)" };
    case "2": return { bg: "rgba(234,88,12,0.12)",  fg: "#ea580c", border: "rgba(234,88,12,0.3)" };
    case "3": return { bg: "rgba(202,138,4,0.12)",  fg: "#a16207", border: "rgba(202,138,4,0.3)" };
    case "보류": return { bg: "rgba(100,116,139,0.1)", fg: "#64748b", border: "rgba(100,116,139,0.3)" };
    default: return { bg: "rgba(0,0,0,0.04)",          fg: "#64748b", border: "rgba(0,0,0,0.15)" };
  }
}

// 우선순위 필드 — 어셋 정보 섹션 위에 별도로 노출. 5개 버튼 중 선택.
// 로컬 optimistic state 로 클릭 즉시 active 하이라이트 반영 (부모 re-fetch 기다리지 않음).
// onSaved(nextCard) 로 서버 응답을 부모에 전달해 detailCard 동기화 — 다른 필드와의 stale
// card.data race (업데이트 일정이 금방 지워지는 현상 등) 방지.
function PriorityField({ card, projectSlug, actor, disabled, onSaved }) {
  const serverValue = getCardPriority(card);
  const [optimistic, setOptimistic] = React.useState(serverValue);
  // 다른 카드로 전환 or 서버 값이 바뀌면 local 도 동기화.
  React.useEffect(() => { setOptimistic(serverValue); }, [card.id, serverValue]);
  const current = optimistic;
  const save = async (next) => {
    setOptimistic(next); // 즉시 UI 반영
    try {
      const r = await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), priority: next || null },
          actor,
        }),
      });
      if (!r.ok) throw new Error(`priority ${r.status}`);
      const updated = await r.json();
      onSaved?.(updated);
    } catch (e) {
      console.warn("우선순위 저장 실패:", e);
      setOptimistic(serverValue); // rollback
    }
  };
  return (
    <div style={{
      marginBottom: 14, padding: "10px 14px", borderRadius: 10,
      background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.22)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", minWidth: 130 }}>
          🔥 우선순위
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PRIORITY_OPTIONS.map((p) => {
            const active = current === p;
            const s = priorityBadgeStyle(p);
            return (
              <button
                key={p}
                disabled={disabled}
                onClick={() => { if (!disabled && p !== current) save(p); }}
                style={{
                  padding: "5px 12px", borderRadius: 8,
                  background: active ? s.fg : s.bg,
                  color: active ? "#fff" : s.fg,
                  border: `1px solid ${active ? s.fg : s.border}`,
                  fontSize: 12, fontWeight: 700, cursor: disabled ? "default" : "pointer",
                  minWidth: 40, transition: "all 0.15s",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                }}
              >{p}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 업데이트 일정 필드 — 어셋 정보 섹션 위에 별도로 노출. 자유 입력 + datalist.
// onSaved(nextCard) 로 서버 응답을 부모에 전달해 detailCard 동기화 — 다른 필드와의 stale
// card.data race 방지 (다른 필드 저장이 target_update 를 덮어써 금방 지워지던 현상).
function TargetUpdateField({ card, projectSlug, actor, disabled, availableUpdates = [], onSaved }) {
  // v1.10.46 — 팝오버 피커 방식: 배지 클릭 시 기존 태그 pill 리스트 + 새 태그 입력 팝업이 열림.
  // 목록이 많아도 스크롤. 기입된 값도 동일하게 변경 가능.
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const wrapRef = React.useRef(null);
  const current = card.data?.target_update?.trim?.() || "";

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) { setOpen(false); }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const save = async (next) => {
    try {
      const r = await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), target_update: next || null },
          actor,
        }),
      });
      if (!r.ok) throw new Error(`update ${r.status}`);
      const updated = await r.json();
      onSaved?.(updated);
      setOpen(false);
      setDraft("");
    } catch (e) { alert("업데이트 일정 저장 실패: " + e.message); }
  };

  return (
    <div ref={wrapRef} style={{
      marginBottom: 14, padding: "10px 14px", borderRadius: 10,
      background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)",
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#b45309", minWidth: 130 }}>
          🗓️ 업데이트 일정
        </span>
        <button
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          title={disabled ? "잠긴 카드는 수정 불가" : "클릭해서 변경"}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: "1px solid rgba(234,179,8,0.3)",
            background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
            fontSize: 13, color: current ? "#b45309" : "var(--text-muted)",
            fontWeight: current ? 700 : 400,
            textAlign: "left", cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {current ? `🗓️ ${current}` : "미지정 — 클릭해서 설정"}
        </button>
      </div>
      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 142, right: 14,
          zIndex: 50, padding: 10, borderRadius: 10, maxHeight: 320, overflowY: "auto",
          background: "#fff", border: "1px solid var(--surface-border)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
        }}>
          {availableUpdates && availableUpdates.length > 0 ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>기존 태그</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                {availableUpdates.map((u) => {
                  const active = current === u;
                  return (
                    <button
                      key={u}
                      onClick={() => save(u)}
                      style={{
                        padding: "5px 12px", borderRadius: 14,
                        background: active ? "#b45309" : "rgba(180,83,9,0.1)",
                        color: active ? "#fff" : "#b45309",
                        border: `1px solid ${active ? "#b45309" : "rgba(180,83,9,0.3)"}`,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >🗓️ {u}</button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
              기존 태그 없음 — 아래에 새로 입력하세요.
            </div>
          )}
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>새 태그 / 직접 입력</div>
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="예: 2026-Q2 업데이트, 1.2 봄 패치"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") { e.preventDefault(); save(draft.trim() || null); }
              else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
            }}
            style={{
              width: "100%", padding: "6px 10px", borderRadius: 6,
              border: "1px solid var(--surface-border)", outline: "none",
              fontSize: 12, boxSizing: "border-box", marginBottom: 6,
            }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => save(draft.trim() || null)}
              disabled={!draft.trim()}
              style={{
                flex: 1, padding: "6px 0", borderRadius: 6, border: "none",
                background: draft.trim() ? "var(--primary)" : "rgba(0,0,0,0.08)",
                color: draft.trim() ? "#fff" : "var(--text-muted)",
                fontSize: 12, fontWeight: 700, cursor: draft.trim() ? "pointer" : "not-allowed",
              }}
            >저장</button>
            {current && (
              <button
                onClick={() => save(null)}
                title="미지정으로 되돌림"
                style={{
                  padding: "6px 12px", borderRadius: 6,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
                }}
              >미지정</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 📏 크기 정보 패널 — 수동 입력 + 카탈로그 참고. AI 추정은 통합 '자동 분류' 버튼이 대신함.
function SizeInfoPanel({ card, disabled, categoryId, onSave }) {
  const si = card.data?.size_info || {};
  const [w, setW] = React.useState(si.width_cm ?? "");
  const [d, setD] = React.useState(si.depth_cm ?? "");
  const [h, setH] = React.useState(si.height_cm ?? "");
  const sourceLabel = si.source === "ai" ? `🤖 AI 추정${si.confidence != null ? ` · ${Math.round(si.confidence * 100)}%` : ""}`
                    : si.source === "catalog" ? "📚 카탈로그 기준 자동 적용"
                    : si.source === "manual" ? "✏️ 수동 입력"
                    : null;
  const note = si.source === "ai" && si.reason ? si.reason : sourceLabel;

  React.useEffect(() => {
    const s = card.data?.size_info || {};
    setW(s.width_cm ?? "");
    setD(s.depth_cm ?? "");
    setH(s.height_cm ?? "");
  }, [card.id, card.updated_at]);

  const commit = () => {
    const next = {
      width_cm: w === "" ? null : Number(w),
      depth_cm: d === "" ? null : Number(d),
      height_cm: h === "" ? null : Number(h),
      source: "manual",
      updated_at: new Date().toISOString(),
    };
    onSave?.(next);
  };

  const legacySpec = findLegacySpec(categoryId);
  const catalogSize = legacySpec?.size;

  const inputStyle = {
    width: 70, padding: "6px 8px", borderRadius: 6,
    border: "1px solid rgba(16,185,129,0.3)",
    background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
    fontSize: 13, color: "var(--text-main)", textAlign: "center", outline: "none",
  };
  const labelStyle = { fontSize: 10, color: "#047857", fontWeight: 700 };

  return (
    <div style={{
      marginBottom: 14, padding: "12px 14px", borderRadius: 10,
      background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#047857" }}>📏 크기 정보</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>(중요)</span>
        {si.source && (
          <span style={{
            fontSize: 10, fontWeight: 600,
            marginLeft: "auto",
            padding: "2px 8px", borderRadius: 10,
            background: si.source === "ai" ? "rgba(7,110,232,0.12)" : si.source === "catalog" ? "rgba(234,179,8,0.15)" : "rgba(0,0,0,0.06)",
            color: si.source === "ai" ? "var(--primary)" : si.source === "catalog" ? "#b45309" : "var(--text-muted)",
          }}>
            {sourceLabel}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={labelStyle}>W · 가로</span>
          <input type="number" min="0" value={w} disabled={disabled}
            onChange={(e) => setW(e.target.value)}
            onBlur={commit}
            style={inputStyle} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>cm</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={labelStyle}>D · 깊이</span>
          <input type="number" min="0" value={d} disabled={disabled}
            onChange={(e) => setD(e.target.value)}
            onBlur={commit}
            style={inputStyle} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>cm</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={labelStyle}>H · 높이</span>
          <input type="number" min="0" value={h} disabled={disabled}
            onChange={(e) => setH(e.target.value)}
            onBlur={commit}
            style={inputStyle} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>cm</span>
        </div>
      </div>

      {si.source === "ai" && si.reason && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, fontStyle: "italic" }}>
          🤖 {si.reason}
        </div>
      )}
      {catalogSize && (catalogSize.W !== "TBD" || catalogSize.D !== "TBD" || catalogSize.H !== "TBD") && (
        <div style={{
          marginTop: 8, padding: "6px 10px", borderRadius: 6,
          background: "rgba(0,0,0,0.03)", fontSize: 11, color: "var(--text-lighter)", lineHeight: 1.5,
        }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>📚 카탈로그 참고 범위:</span>{" "}
          {catalogSize.W !== "TBD" && <span>W {catalogSize.W}</span>}
          {catalogSize.W !== "TBD" && catalogSize.D !== "TBD" && " · "}
          {catalogSize.D !== "TBD" && <span>D {catalogSize.D}</span>}
          {catalogSize.D !== "TBD" && catalogSize.H !== "TBD" && " · "}
          {catalogSize.H !== "TBD" && <span>H {catalogSize.H}</span>}
        </div>
      )}
    </div>
  );
}

// 검색 가능한 카테고리 선택기. FURNITURE_CATEGORIES 50+ 개 중에서 라벨/방/id 로
// substring 매칭. 포커스 시 드롭다운 오픈, 클릭으로 선택.
function CategoryPicker({ value, onChange, disabled }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [hoverIdx, setHoverIdx] = React.useState(0);
  const inputRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  const selected = FURNITURE_CATEGORIES.find((c) => c.id === value);
  // useMemo 를 쓰지 않음 — FURNITURE_CATEGORIES 가 서버에서 교체될 때 stale
  // closure 로 인해 구 목록이 보이는 문제를 피하려 매 렌더마다 필터링.
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? FURNITURE_CATEGORIES
    : FURNITURE_CATEGORIES.filter((c) =>
        `${c.label} ${c.room} ${c.id}`.toLowerCase().includes(q)
      );

  // 바깥 클릭으로 닫기
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  React.useEffect(() => { setHoverIdx(0); }, [query, open]);

  const pick = (c) => {
    onChange(c.id);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const fieldStyle = {
    width: "100%", padding: "8px 28px 8px 10px", borderRadius: 8,
    border: `1px solid ${open ? "var(--primary)" : "var(--surface-border)"}`,
    background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
    fontSize: 13, color: "var(--text-main)", boxSizing: "border-box", outline: "none",
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={open ? query : (selected ? `${selected.icon} ${selected.label} (${selected.room})` : "")}
        placeholder={selected ? "" : "— 검색 또는 선택 —"}
        onFocus={() => { if (!disabled) { setOpen(true); setQuery(""); } }}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHoverIdx((i) => Math.min(i + 1, filtered.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHoverIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); if (filtered[hoverIdx]) pick(filtered[hoverIdx]); }
          else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        }}
        style={fieldStyle}
      />
      {value && !open && !disabled && (
        <button
          onClick={() => onChange("")}
          title="초기화"
          style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            width: 20, height: 20, borderRadius: 10,
            background: "rgba(0,0,0,0.06)", border: "none",
            color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
      )}
      {!value && !open && (
        <span style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)", fontSize: 11, pointerEvents: "none",
        }}>▾</span>
      )}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          maxHeight: 280, overflowY: "auto", zIndex: 50,
          background: "#fff", border: "1px solid var(--surface-border)",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
              일치하는 카테고리 없음
            </div>
          ) : filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              onMouseEnter={() => setHoverIdx(i)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "7px 10px",
                background: hoverIdx === i ? "rgba(7,110,232,0.08)" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 13, color: "var(--text-main)",
              }}
            >
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span style={{ fontWeight: value === c.id ? 700 : 500, flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.room}</span>
              {value === c.id && <span style={{ color: "var(--primary)", fontSize: 11 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 업데이트 일정 필터링 헬퍼. selected 가 비어있으면 전체 통과.
// "__unspecified" 는 target_update 가 비어있는 카드.
function matchesUpdateFilter(card, selected) {
  if (!selected || selected.length === 0) return true;
  const v = card?.data?.target_update?.trim?.() || "";
  return v ? selected.includes(v) : selected.includes("__unspecified");
}

// 현재 보이는 카드들에서 target_update 값과 카운트 집계.
function collectUpdateChips(cards) {
  const counts = new Map();
  let unspecified = 0;
  for (const c of cards) {
    if (c.is_archived) continue;
    const v = c.data?.target_update?.trim?.() || "";
    if (v) counts.set(v, (counts.get(v) || 0) + 1);
    else unspecified++;
  }
  const chips = [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "ko"))
    .map(([value, count]) => ({ value, label: value, count }));
  if (unspecified > 0) chips.push({ value: "__unspecified", label: "미지정", count: unspecified });
  return chips;
}

// 업데이트 일정 chip 필터 바. 다중 선택, 전체 chip 으로 선택 초기화.
// 개별 업데이트 chip — 본체 클릭 = 필터 토글, ✏️ = 인라인 이름 변경 (일괄 적용).
function UpdateChipItem({ chip, active, faded, onToggle, onRename }) {
  const [editing, setEditing] = React.useState(false);
  const [input, setInput] = React.useState(chip.label);
  React.useEffect(() => { setInput(chip.label); }, [chip.label]);
  const baseStyle = {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 4px 4px 10px", borderRadius: 14,
    background: active ? "var(--primary)" : (faded ? "rgba(0,0,0,0.04)" : "rgba(7,110,232,0.08)"),
    border: `1px solid ${active ? "var(--primary)" : "rgba(7,110,232,0.18)"}`,
    color: active ? "#fff" : (faded ? "var(--text-muted)" : "var(--primary)"),
    fontSize: 11, fontWeight: 700, transition: "all 0.15s",
  };
  const commit = () => {
    const next = input.trim();
    setEditing(false);
    // 빈 값으로 저장 = 태그 전역 삭제 (v1.10.52). 해당 태그 붙은 모든 카드를 미지정으로.
    if (!next) {
      if (!confirm(`'${chip.label}' 태그를 삭제합니다.\n이 태그가 붙은 카드 ${chip.count}개는 모두 '미지정' 이 됩니다. 계속할까요?`)) {
        setInput(chip.label);
        return;
      }
      onRename(chip.value, null);
      return;
    }
    if (next === chip.label) { setInput(chip.label); return; }
    if (!confirm(`'${chip.label}' 태그가 붙은 카드 ${chip.count}개를 '${next}' 로 일괄 변경합니다. 계속할까요?`)) {
      setInput(chip.label);
      return;
    }
    onRename(chip.value, next);
  };
  if (editing) {
    return (
      <span style={{ ...baseStyle, padding: "2px 6px", background: "#fff", border: "1px solid var(--primary)" }}>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            else if (e.key === "Escape") { e.preventDefault(); setEditing(false); setInput(chip.label); }
          }}
          onBlur={() => { if (editing) commit(); }}
          style={{
            border: "none", outline: "none", fontSize: 11, fontWeight: 700,
            background: "transparent", color: "var(--text-main)", padding: "2px 2px",
            width: `${Math.max(input.length, chip.label.length, 4) + 2}ch`,
          }}
        />
      </span>
    );
  }
  return (
    <span style={baseStyle}>
      <span
        onClick={onToggle}
        style={{ cursor: "pointer" }}
      >{chip.label} · {chip.count}</span>
      {!!onRename && (
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title={`'${chip.label}' 태그 이름 일괄 변경`}
          style={{
            width: 18, height: 18, borderRadius: 9,
            border: "none", background: "transparent",
            color: active ? "rgba(255,255,255,0.85)" : "inherit",
            cursor: "pointer", fontSize: 10, padding: 0, lineHeight: 1,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >✏️</button>
      )}
    </span>
  );
}

function UpdateChipBar({ chips, selected, onChange, totalCount, onRename }) {
  if (chips.length === 0) return null;
  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };
  const allStyle = {
    padding: "4px 10px", borderRadius: 14,
    background: selected.length === 0 ? "var(--primary)" : "rgba(7,110,232,0.08)",
    border: `1px solid ${selected.length === 0 ? "var(--primary)" : "rgba(7,110,232,0.18)"}`,
    color: selected.length === 0 ? "#fff" : "var(--primary)",
    fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
  };
  // v1.10.87 — 현재 필터 상태 그대로 URL 복사 (외부 동료에게 공유).
  // v1.10.88 — HTTP 환경 호환을 위해 copyToClipboard 헬퍼 사용 (legacy execCommand fallback).
  const [copied, setCopied] = React.useState(false);
  const copyShare = async () => {
    const url = new URL(window.location.href);
    if (selected.length > 0) url.searchParams.set("tag", selected.join(","));
    else url.searchParams.delete("tag");
    const text = url.toString();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      window.prompt("이 링크를 복사하세요:", text);
    }
  };
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginRight: 4 }}>🗓️ 업데이트:</span>
      <button onClick={() => onChange([])} style={allStyle}>전체 · {totalCount}</button>
      {chips.map((c) => {
        const faded = c.value === "__unspecified";
        return (
          <UpdateChipItem
            key={c.value}
            chip={c}
            active={selected.includes(c.value)}
            faded={faded}
            onToggle={() => toggle(c.value)}
            // '미지정' 은 빈값 묶음이라 이름 변경 대상 아님.
            onRename={faded ? null : onRename}
          />
        );
      })}
      {/* v1.10.87 — 현재 탭 + 선택된 태그 필터 상태로 공유 URL 복사 */}
      <button
        onClick={copyShare}
        title={selected.length > 0 ? `선택된 태그(${selected.length}) 필터 URL 복사` : "현재 탭 URL 복사"}
        style={{
          marginLeft: "auto",
          padding: "4px 10px", borderRadius: 14,
          background: copied ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "var(--surface-border)"}`,
          color: copied ? "#15803d" : "var(--text-muted)",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >{copied ? "✓ 복사됨" : "🔗 링크 복사"}</button>
    </div>
  );
}

// 카드/리스트 뷰 토글.
function ViewModeToggle({ value, onChange }) {
  const btn = (mode, icon, title) => (
    <button
      onClick={() => onChange(mode)}
      title={title}
      style={{
        padding: "4px 10px", borderRadius: 6,
        background: value === mode ? "#fff" : "transparent",
        border: "none", cursor: "pointer",
        fontSize: 13,
        color: value === mode ? "var(--primary)" : "var(--text-muted)",
        boxShadow: value === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      }}
    >{icon}</button>
  );
  return (
    <div style={{
      display: "flex", gap: 2, padding: 2, borderRadius: 8,
      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
    }}>
      {btn("card", "🔲", "카드 뷰")}
      {btn("list", "☰", "리스트 뷰")}
    </div>
  );
}

// 리스트 뷰 공통 grid 템플릿 — 11컬럼 (v1.10.44: 진행 컬럼 추가).
// 썸네일 / 제목 / 우선순위 / 업데이트 / 카테고리 / 스타일 / 크기 / 상태 / 진행 / 날짜 / 작성자
// 썸네일 컬럼만 scale 배율 적용 (v1.10.48). 나머지 텍스트 컬럼은 고정.
// v1.10.54 — 콘텐츠 길이에 맞춰 좌우폭 재조정.
//   우선순위(P0-P3): 70→56, 업데이트(태그): 90→120, 카테고리: 150→140, 스타일: 80→70,
//   크기(W×D×H cm): 130→115, 상태(시안 N): 95→70, 진행(🗳️ 투표 및 선정): 110→130,
//   날짜(YYYY-MM-DD): 100→92.
const getListGrid = (scale = 1) => {
  // v1.10.76 — 스타일 70→85 (스칸디나비안 등 6자 라벨 ellipsis 완화), 진행 92→78 (라벨 4자 + emoji 라 충분).
  const thumb = Math.round(90 * scale);
  return `${thumb}px 1fr 56px 120px 140px 85px 115px 70px 78px 92px 32px`;
};
const LIST_GRID = getListGrid(1); // 기본

// 진행 단계 옵션 (v1.10.44) — 리스트 뷰 인라인 편집용. 시안/투표는 같은 drafting 상태.
// v1.10.74 — 위시 단계 추가, "투표 및 선정" → "투표" 로 단축. 5단계 단일 어휘.
const STAGE_OPTIONS = [
  { key: "wishlist", label: "⭐ 위시",  statusKey: "wishlist" },
  { key: "drafting", label: "🎨 시안",  statusKey: "drafting" },
  { key: "voting",   label: "🗳️ 투표",  statusKey: "drafting" },
  { key: "sheet",    label: "📑 시트",  statusKey: "sheet" },
  { key: "done",     label: "✅ 완료",  statusKey: "done" },
];
function computeStage(card) {
  const confirmedAt = card.confirmed_at;
  if (confirmedAt) return "done";
  // list_id 로 status_key 추정 불가능 → 여기선 card.list_id 대신 _statusKey 힌트 사용 (부모가 주입).
  const sk = card._statusKey;
  if (sk === "done") return "done";
  if (sk === "sheet") return "sheet";
  if (sk === "wishlist") return "wishlist";
  // drafting 안에서 시안/투표 구분 — designs 유무로.
  const designs = Array.isArray(card.data?.designs) ? card.data.designs : [];
  return designs.length > 0 ? "voting" : "drafting";
}

function CardListRow({ card, tabId, onClick, profileByName, projectSlug, actor, lists, availableUpdates, onSaved, scale = 1 }) {
  const thumbSize = Math.round(90 * scale);
  const rowPadV = Math.round(15 * scale);
  const data = card.data || {};
  const designs = Array.isArray(data.designs) ? data.designs : [];
  const selectedIdx = typeof data.selected_design === "number" ? data.selected_design : null;
  const selected = selectedIdx != null ? designs[selectedIdx] : null;
  const catInfo = data.category ? FURNITURE_CATEGORIES.find((c) => c.id === data.category) : null;
  const styleInfo = data.style_preset ? STYLE_PRESETS.find((s) => s.id === data.style_preset) : null;

  // 인라인 편집 상태: "title" | "priority" | "update" | "stage" | null
  const [editing, setEditing] = React.useState(null);
  const [titleDraft, setTitleDraft] = React.useState("");
  const rowRef = React.useRef(null);

  // 외부 클릭 시 닫기 — 이전엔 data-il-edit attribute 기준이라
  // 다른 행의 팝오버를 클릭해도 자기 팝오버가 안 닫혔음. row 스코프로 변경 (v1.10.45).
  React.useEffect(() => {
    if (!editing) return;
    const onDoc = (e) => {
      if (!rowRef.current?.contains(e.target)) setEditing(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [editing]);

  // 저장 헬퍼 — data 병합 PATCH.
  const saveData = async (fields) => {
    if (!projectSlug) return;
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: { ...(card.data || {}), ...fields }, actor }),
      });
      await onSaved?.();
      setEditing(null);
    } catch (e) { alert("저장 실패: " + e.message); }
  };

  // 상태(status_key) 변경 헬퍼 — 완료 이동 시 confirmed_at 설정, 되돌릴 땐 해제.
  const saveStatus = async (statusKey) => {
    if (!projectSlug) return;
    try {
      const body = { status_key: statusKey, actor };
      if (statusKey === "done" && !card.confirmed_at) {
        body.confirmed_at = new Date().toISOString();
        body.confirmed_by = actor || null;
      } else if (statusKey !== "done" && card.confirmed_at) {
        body.confirmed_at = null;
        body.confirmed_by = null;
        body.force = true;
      }
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      await onSaved?.();
      setEditing(null);
    } catch (e) { alert("상태 변경 실패: " + e.message); }
  };

  // 최상위 body 필드 (title 같은) PATCH — data 병합 없이 바로.
  const savePatch = async (body) => {
    if (!projectSlug) return;
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, actor }),
      });
      await onSaved?.();
      setEditing(null);
    } catch (e) { alert("저장 실패: " + e.message); }
  };

  const openCell = (e, which) => {
    e.stopPropagation();
    if (which === "title") setTitleDraft(card.title || "");
    setEditing(editing === which ? null : which);
  };
  const stopClick = (e) => e.stopPropagation();

  // 썸네일 우선순위 (v1.10.97 변경):
  // 1) 사용자가 ⭐ 대표 버튼으로 명시 설정한 card.thumbnail_url 이 최우선
  //    (참조 이미지를 대표로 지정해도 카드에 반영되도록).
  // 2) 명시 설정 없으면 시안 1개일 때 그 한 장을 자동으로.
  // 3) 없으면 탭별 fallback.
  const singleImage = designs.length === 1 && designs[0]?.imageUrl ? designs[0].imageUrl : null;
  let thumb = card.thumbnail_url || singleImage;
  if (!thumb) {
    if (tabId === "sheet" || tabId === "completed") {
      thumb = data.concept_sheet_url || selected?.imageUrl;
    } else if (tabId !== "wishlist") {
      thumb = selected?.imageUrl || designs.find((d) => d?.imageUrl)?.imageUrl;
    }
  }

  const date = tabId === "completed" ? card.confirmed_at : card.created_at;

  const size = data.size_info;
  const hasSize = size && (size.width_cm || size.depth_cm || size.height_cm);
  const sizeLabel = hasSize
    ? `${size.width_cm || "?"}×${size.depth_cm || "?"}×${size.height_cm || "?"}`
    : null;
  const sizeSrcColor = size?.source === "ai" ? "var(--primary)"
                     : size?.source === "catalog" ? "#b45309"
                     : size?.source === "manual" ? "var(--text-main)" : "var(--text-muted)";
  const sizeSrcIcon = size?.source === "ai" ? "🤖"
                    : size?.source === "catalog" ? "📚"
                    : size?.source === "manual" ? "✏️" : "";

  return (
    <div
      ref={rowRef}
      onClick={onClick}
      className="hover-lift"
      style={{
        display: "grid",
        gridTemplateColumns: getListGrid(scale),
        gap: 14, alignItems: "center",
        padding: `${rowPadV}px 18px`, borderRadius: 12,
        border: "1px solid var(--surface-border)",
        background: "var(--surface-color)",
        cursor: "pointer", transition: "all 0.15s",
        position: "relative",
        // 팝오버 열릴 때 이 row 를 다른 row 보다 위로 올림 (v1.10.47).
        zIndex: editing ? 100 : "auto",
      }}
    >
      <div style={{
        width: thumbSize, height: thumbSize, borderRadius: Math.round(10 * scale), overflow: "hidden",
        background: thumb ? "#000" : "rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: Math.round(36 * scale), opacity: 0.5 }}>{catInfo?.icon || "📇"}</span>
        )}
      </div>
      {/* 제목 — 제목 텍스트 직접 클릭 시 인라인 편집 (v1.10.49). 설명/썸네일 등 다른 영역 클릭은 기존대로 상세 모달 오픈. */}
      <div style={{ minWidth: 0, position: "relative" }}>
        {editing === "title" ? (
          <input
            autoFocus
            value={titleDraft}
            onClick={stopClick}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") { e.preventDefault(); savePatch({ title: titleDraft.trim() || card.title }); }
              else if (e.key === "Escape") { e.preventDefault(); setEditing(null); }
            }}
            onBlur={() => {
              const next = titleDraft.trim();
              if (next && next !== card.title) savePatch({ title: next });
              else setEditing(null);
            }}
            style={{
              width: "100%", padding: "6px 10px", borderRadius: 8,
              border: "1px solid var(--primary)", outline: "none",
              fontSize: 15, fontWeight: 700, color: "var(--text-main)",
              background: "#fff", boxSizing: "border-box",
            }}
          />
        ) : (
          <>
            <div
              onClick={(e) => openCell(e, "title")}
              title="클릭해서 제목 수정"
              style={{
                fontSize: 15, fontWeight: 700, color: "var(--text-main)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                cursor: "text", display: "inline-block", maxWidth: "100%",
                padding: "2px 4px", marginLeft: -4, borderRadius: 4,
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {card.title || "(제목 없음)"}
            </div>
            {card.description && (
              <div style={{
                fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 4,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {card.description}
              </div>
            )}
          </>
        )}
      </div>
      {/* 우선순위 — 클릭해서 인라인 변경 (v1.10.44) */}
      <div
        data-il-edit
        onClick={(e) => openCell(e, "priority")}
        style={{ fontSize: 11, position: "relative", cursor: "pointer" }}
        title="클릭해서 우선순위 변경"
      >
        {(() => {
          const p = getCardPriority(card);
          const s = priorityBadgeStyle(p);
          return (
            <span style={{
              padding: "2px 10px", borderRadius: 10,
              background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
              fontWeight: 700, display: "inline-block", minWidth: 36, textAlign: "center",
            }}>{p}</span>
          );
        })()}
        {editing === "priority" && (
          <div
            data-il-edit
            onClick={stopClick}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
              padding: 6, borderRadius: 8,
              background: "#fff", border: "1px solid var(--surface-border)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              display: "flex", gap: 4, flexWrap: "wrap",
            }}
          >
            {PRIORITY_OPTIONS.map((p) => {
              const active = getCardPriority(card) === p;
              const s = priorityBadgeStyle(p);
              return (
                <button
                  key={p}
                  onClick={() => saveData({ priority: p })}
                  style={{
                    padding: "4px 10px", borderRadius: 8,
                    background: active ? s.fg : s.bg,
                    color: active ? "#fff" : s.fg,
                    border: `1px solid ${active ? s.fg : s.border}`,
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >{p}</button>
              );
            })}
          </div>
        )}
      </div>
      {/* 업데이트 — 팝오버 피커 (v1.10.45). 기존 태그 리스트 + 커스텀 입력. */}
      <div
        onClick={(e) => openCell(e, "update")}
        style={{ fontSize: 11, position: "relative", overflow: "visible", whiteSpace: "nowrap", cursor: "pointer" }}
        title="클릭해서 업데이트 태그 변경"
      >
        {(() => {
          const tu = data.target_update?.trim?.() || "";
          if (!tu) return <span style={{ color: "var(--text-muted)" }}>미지정</span>;
          return (
            <span style={{
              padding: "2px 8px", borderRadius: 10,
              background: "rgba(180,83,9,0.1)", color: "#b45309", fontWeight: 600,
              overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", maxWidth: 110,
            }}>🗓️ {tu}</span>
          );
        })()}
        {editing === "update" && (
          <div
            onClick={stopClick}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
              padding: 6, borderRadius: 10, width: 220, maxHeight: 300, overflowY: "auto",
              background: "#fff", border: "1px solid var(--surface-border)",
              boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
              display: "flex", flexDirection: "column", gap: 3,
            }}
          >
            {availableUpdates && availableUpdates.length > 0 ? (
              <>
                {availableUpdates.map((u) => {
                  const active = (data.target_update || "") === u;
                  return (
                    <button
                      key={u}
                      onClick={() => saveData({ target_update: u })}
                      style={{
                        padding: "6px 10px", borderRadius: 6, textAlign: "left",
                        background: active ? "rgba(180,83,9,0.12)" : "transparent",
                        border: "none",
                        color: active ? "#b45309" : "var(--text-main)",
                        fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
                      }}
                    >🗓️ {u}{active && " ✓"}</button>
                  );
                })}
                <div style={{ height: 1, background: "var(--surface-border)", margin: "3px 2px" }} />
              </>
            ) : (
              <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "6px 10px" }}>
                등록된 태그가 없습니다.<br />상세 모달에서 새 태그를 먼저 추가하세요.
              </div>
            )}
            <button
              onClick={() => saveData({ target_update: null })}
              style={{
                padding: "6px 10px", borderRadius: 6, textAlign: "left",
                background: !(data.target_update || "") ? "rgba(0,0,0,0.04)" : "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: 12, fontWeight: !(data.target_update || "") ? 700 : 500, cursor: "pointer",
              }}
            >미지정{!(data.target_update || "") && " ✓"}</button>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {catInfo
          ? `${catInfo.group ? catInfo.group + " / " : ""}${catInfo.room ? catInfo.room + " / " : ""}${catInfo.label}`
          : "—"}
      </div>
      <div style={{ fontSize: 11 }}>
        {styleInfo ? (
          <span style={{
            padding: "2px 8px", borderRadius: 10,
            background: "rgba(7,110,232,0.08)", color: "var(--primary)", fontWeight: 600,
          }}>{styleInfo.label}</span>
        ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
      </div>
      <div style={{ fontSize: 11, color: sizeSrcColor, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4 }}>
        {sizeLabel ? (
          <>
            <span style={{ fontSize: 10 }}>{sizeSrcIcon}</span>
            <span>{sizeLabel}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 10 }}>cm</span>
          </>
        ) : <span style={{ color: "var(--text-muted)", fontFamily: "inherit" }}>—</span>}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {tabId === "vote" && (designs.length > 0 ? `시안 ${designs.length}` : "—")}
        {(tabId === "sheet" || tabId === "completed") && (
          data.concept_sheet_url
            ? <span style={{ color: "#22c55e", fontWeight: 600 }}>✓ 시트</span>
            : <span>—</span>
        )}
        {tabId === "create" && (designs.length > 0 ? `시안 ${designs.length}` : "—")}
        {tabId === "wishlist" && "—"}
      </div>
      {/* 진행 단계 — 클릭해서 인라인 변경 (v1.10.44) */}
      <div
        data-il-edit
        onClick={(e) => openCell(e, "stage")}
        style={{ fontSize: 11, position: "relative", cursor: "pointer" }}
        title="클릭해서 진행 단계 변경"
      >
        {(() => {
          const stage = computeStage(card);
          const opt = STAGE_OPTIONS.find((o) => o.key === stage) || { label: "⭐ 아이디어" };
          return (
            <span style={{
              padding: "2px 8px", borderRadius: 10,
              background: "rgba(124,58,237,0.08)", color: "#7c3aed",
              fontWeight: 700,
              border: "1px solid rgba(124,58,237,0.25)",
              display: "inline-block", whiteSpace: "nowrap",
            }}>{opt.label}</span>
          );
        })()}
        {editing === "stage" && (
          <div
            data-il-edit
            onClick={stopClick}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
              padding: 6, borderRadius: 8, width: 150,
              background: "#fff", border: "1px solid var(--surface-border)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              display: "flex", flexDirection: "column", gap: 3,
            }}
          >
            {STAGE_OPTIONS.map((opt) => {
              const active = computeStage(card) === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => saveStatus(opt.statusKey)}
                  style={{
                    padding: "6px 10px", borderRadius: 6, textAlign: "left",
                    background: active ? "rgba(124,58,237,0.1)" : "transparent",
                    border: "none",
                    color: active ? "#7c3aed" : "var(--text-main)",
                    fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
                  }}
                >{opt.label}</button>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
        {date ? formatLocalTime(date, "date") : "-"}
      </div>
      {/* 작성자 아이콘 (v1.10.14) — 마우스 올리면 이름 tooltip */}
      {(() => {
        const author = card.created_by || card.updated_by || null;
        const authorProfile = author ? profileByName?.get?.(author) : null;
        const icon = authorProfile?.icon || (author ? "👤" : "—");
        const tooltip = author || "작성자 없음";
        return (
          <div
            title={tooltip}
            style={{
              fontSize: 18, textAlign: "center", cursor: "help",
              opacity: author ? 1 : 0.35,
            }}
          >{icon}</div>
        );
      })()}
    </div>
  );
}

// sortBy 를 특정 컬럼 기준으로 toggle. 같은 컬럼 재클릭 = asc → desc → 해제 (기본 date_desc).
function cycleSortBy(currentSortBy, ascKey, descKey, defaultSort = "date_desc") {
  if (currentSortBy === ascKey) return descKey;
  if (currentSortBy === descKey) return defaultSort;
  return ascKey;
}

// 리스트 뷰 헤더 행. 클릭 가능한 셀은 sortBy 전환.
function CardListHeader({ tabId, sortBy, onSortChange, scale = 1 }) {
  const cellBase = {
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    letterSpacing: "0.05em", textTransform: "uppercase",
  };
  const onSort = typeof onSortChange === "function" ? onSortChange : null;
  // 각 컬럼의 (asc, desc) 키. 완료 탭은 날짜 키가 completedAt 이지만 date_asc/desc 로 공통 매핑.
  const dateAsc = "date_asc", dateDesc = "date_desc";
  const SortCell = ({ label, ascKey, descKey, align = "left" }) => {
    const activeDir = sortBy === ascKey ? "asc" : sortBy === descKey ? "desc" : null;
    const clickable = !!onSort && !!ascKey;
    return (
      <div
        onClick={clickable ? () => onSort(cycleSortBy(sortBy, ascKey, descKey)) : undefined}
        style={{
          ...cellBase,
          textAlign: align,
          cursor: clickable ? "pointer" : "default",
          userSelect: "none",
          color: activeDir ? "var(--primary)" : cellBase.color,
          display: "flex", alignItems: "center",
          justifyContent: align === "right" ? "flex-end" : "flex-start",
          gap: 4,
        }}
        title={clickable ? "클릭해서 정렬" : undefined}
      >
        <span>{label}</span>
        {clickable && (
          <span style={{ fontSize: 9, opacity: activeDir ? 1 : 0.35 }}>
            {activeDir === "asc" ? "▲" : activeDir === "desc" ? "▼" : "↕"}
          </span>
        )}
      </div>
    );
  };
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: getListGrid(scale),
      gap: 14, alignItems: "center",
      padding: "6px 18px",
    }}>
      <div />
      <SortCell label="제목"            ascKey="title_asc"    descKey="title_desc" />
      <SortCell label="우선순위"        ascKey="priority_asc" descKey="priority_desc" />
      <SortCell label="업데이트"        ascKey="update_asc"   descKey="update_desc" />
      <SortCell label="카테고리"        ascKey="category_asc" descKey="category_desc" />
      <SortCell label="스타일"          ascKey="style_asc"    descKey="style_desc" />
      <SortCell label="크기 (W×D×H)"    ascKey="size_asc"     descKey="size_desc" />
      <SortCell label={tabId === "completed" ? "결과" : "상태"} ascKey="status_asc" descKey="status_desc" />
      <SortCell label="진행" ascKey="stage_asc" descKey="stage_desc" />
      <SortCell label={tabId === "completed" ? "완료일" : "생성일"} ascKey={dateAsc} descKey={dateDesc} align="right" />
      <div style={{ ...cellBase, textAlign: "center" }} title="작성자">👤</div>
    </div>
  );
}

// 카드 크기 선택 위젯 — 0.5× / 1× / 2× 토글 버튼.
function CardScaleSelect({ value, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 2, padding: 2, borderRadius: 8,
      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
    }}>
      {[0.5, 1, 2].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          title={`카드 크기 ${v}×`}
          style={{
            padding: "4px 10px", borderRadius: 6,
            background: value === v ? "#fff" : "transparent",
            border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700,
            color: value === v ? "var(--primary)" : "var(--text-muted)",
            boxShadow: value === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >{v}×</button>
      ))}
    </div>
  );
}

// 정렬 드롭다운 — 메인 그리드 상단에 공통 배치.
function SortSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="정렬 방식"
      style={{
        padding: "6px 10px", borderRadius: 8,
        border: "1px solid var(--surface-border)", background: "#fff",
        color: "var(--text-main)", fontSize: 12, fontWeight: 600, cursor: "pointer",
      }}
    >
      <option value="date_desc">📅 최신순</option>
      <option value="date_asc">📅 오래된순</option>
      <option value="title_asc">🔤 이름 A→Z</option>
      <option value="title_desc">🔤 이름 Z→A</option>
      <option value="stage_asc">🎯 진행 단계 (시안→시트)</option>
      <option value="stage_desc">🎯 진행 단계 (시트→시안)</option>
    </select>
  );
}

// 🖼 갤러리 캔버스 (v1.10.26) — 상세 모달이 열린 상태에서 단축키 F 로 전체 화면.
// 카드의 모든 이미지(대표/참조 · 시안 · 현재 시트 · 과거 시트) 를 4개 그룹 row 로 배치하고
// 전체 캔버스에 translate+scale 로 pan/zoom. 외부 의존성 없음.
function GalleryCanvas({ card, projectSlug, actor, onClose, onSaved }) {
  // 팬(x/y) 은 ref + 직접 DOM transform 으로 처리해 React 리렌더 회피 (v1.10.31).
  // scale 만 state — 아이콘 counter-scale 계산에 React 가 필요.
  const viewRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const [scale, setScale] = React.useState(1);
  const [dragging, setDragging] = React.useState(false);
  // 이미지별 aspect ratio (w/h) — onLoad 에서 채워 justified 레이아웃에 사용 (v1.10.34).
  const [aspects, setAspects] = React.useState({});
  // v1.10.63 — 타일 클릭 시 lightbox (줌/패닝/그리기 전체 기능) 열기.
  const [lightboxSrc, setLightboxSrc] = React.useState(null);
  // v1.10.65 — 다중 선택 + 비교 오버레이 (Cmd/Ctrl-클릭으로 토글).
  const [selectedUrls, setSelectedUrls] = React.useState(() => new Set());
  const [compareMode, setCompareMode] = React.useState(false);
  const toggleSelect = (url) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };
  const clearSelect = () => setSelectedUrls(new Set());
  // v1.10.66 — 외부 이미지 드래그-드롭 → ref_images 에 추가.
  const [dropActive, setDropActive] = React.useState(false);
  const [dropBusy, setDropBusy] = React.useState(false);
  const dragCountRef = React.useRef(0);
  const onDragEnter = (e) => {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    dragCountRef.current += 1;
    setDropActive(true);
  };
  const onDragOver = (e) => {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
  };
  const onDragLeave = (e) => {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    dragCountRef.current = Math.max(0, dragCountRef.current - 1);
    if (dragCountRef.current === 0) setDropActive(false);
  };
  const onDrop = async (e) => {
    e.preventDefault();
    dragCountRef.current = 0;
    setDropActive(false);
    const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setDropBusy(true);
    try {
      const dataUrls = await Promise.all(files.map((f) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = (ev) => resolve(ev.target.result);
        r.onerror = reject;
        r.readAsDataURL(f);
      })));
      const urls = await Promise.all(dataUrls.map((d) => uploadDataUrl(d)));
      const existing = Array.isArray(card.data?.ref_images) ? card.data.ref_images : [];
      const merged = [...existing];
      for (const u of urls) { if (u && !merged.includes(u)) merged.push(u); }
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), ref_images: merged },
          actor,
        }),
      });
      await onSaved?.();
    } catch (e) {
      alert("이미지 추가 실패: " + e.message);
    } finally {
      setDropBusy(false);
    }
  };
  // v1.10.64 — 그룹별 표시 토글 (refs / designs / sheet-current / sheet-history-N).
  // localStorage 에 카드별 비활성 그룹 키 저장. 기본은 모두 활성.
  const groupStateKey = `gallery_disabled_groups_${card?.id || "_"}`;
  const [disabledGroups, setDisabledGroups] = React.useState(() => {
    try {
      const raw = localStorage.getItem(groupStateKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  // v1.10.69 — 레이아웃 모드: justified / grid / timeline. localStorage 영속.
  const [layoutMode, setLayoutMode] = React.useState(() => {
    try { return localStorage.getItem("gallery_layout_mode") || "justified"; }
    catch { return "justified"; }
  });
  React.useEffect(() => {
    try { localStorage.setItem("gallery_layout_mode", layoutMode); } catch {}
  }, [layoutMode]);
  const toggleGroup = (key) => {
    setDisabledGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(groupStateKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const wrapRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const panStart = React.useRef(null);

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  // viewRef 기반 DOM transform 적용 — setState 없이 매 pointermove 처리.
  const applyTransform = React.useCallback(() => {
    const v = viewRef.current;
    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.scale})`;
    }
  }, []);

  // 초기/언마운트 시 transform 동기화.
  React.useEffect(() => { applyTransform(); }, [applyTransform]);

  // 화면에 가득 맞추기 (v1.10.32) — 콘텐츠 bounding box 를 뷰포트에 fit.
  const fitToViewport = React.useCallback(() => {
    const content = contentRef.current;
    const wrap = wrapRef.current;
    if (!content || !wrap) return;
    // 현재 transform 제거하고 계산해야 자연 크기 얻음.
    const prev = content.style.transform;
    content.style.transform = "";
    const cw = content.scrollWidth;
    const ch = content.scrollHeight;
    const vw = wrap.clientWidth;
    const vh = wrap.clientHeight;
    content.style.transform = prev;
    if (cw === 0 || ch === 0) return;
    // v1.10.54 — 가득 채우기: 작은 콘텐츠는 뷰포트 가득 차게 확대 (cap 제거).
    const fitScale = Math.min((vw - 40) / cw, (vh - 100) / ch);
    const safe = Math.max(0.05, fitScale);
    viewRef.current = {
      scale: safe,
      x: Math.max(20, (vw - cw * safe) / 2),
      y: 70, // top 상단 바 아래에서 시작
    };
    applyTransform();
    setScale(safe);
  }, [applyTransform]);

  // 마운트 직후 + 이미지들 load 다 끝난 뒤 한번 더 fit.
  const loadedCountRef = React.useRef(0);
  const totalImagesRef = React.useRef(0);
  React.useEffect(() => {
    totalImagesRef.current = groups.reduce((n, g) => n + g.items.length, 0);
    const t1 = setTimeout(fitToViewport, 120);
    const t2 = setTimeout(fitToViewport, 500); // 이미지 로드 대기
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // v1.10.64 — 그룹 토글 시 자동 refit (콘텐츠 크기 변경 반영).
  // v1.10.69 — 레이아웃 모드 변경 시도 자동 refit.
  React.useEffect(() => {
    const t = setTimeout(fitToViewport, 50);
    return () => clearTimeout(t);
  }, [disabledGroups, layoutMode, fitToViewport]);
  const onImageLoad = React.useCallback((e, url) => {
    // v1.10.61 — aspect 와 자연 해상도(w, h) 모두 저장. 자연 해상도로 IMG 렌더해야
    // 줌인 시 원본 픽셀이 보임 (이전엔 셀 크기로 다운샘플 → GPU 업스케일 → 흐림).
    const img = e?.currentTarget;
    if (img && img.naturalWidth && img.naturalHeight && url) {
      const a = img.naturalWidth / img.naturalHeight;
      setAspects((prev) => {
        const cur = prev[url];
        const same = cur && typeof cur === "object" && cur.w === img.naturalWidth && cur.h === img.naturalHeight;
        if (same) return prev;
        return { ...prev, [url]: { aspect: a, w: img.naturalWidth, h: img.naturalHeight } };
      });
    }
    loadedCountRef.current += 1;
    if (loadedCountRef.current === totalImagesRef.current) {
      fitToViewport();
    }
  }, [fitToViewport]);

  // 이미지 수집 — 그룹 단위. v1.10.54: 같은 URL 은 한 번만 표시 (그룹 우선순위: refs → designs → sheet → history).
  const groups = React.useMemo(() => {
    const out = [];
    const seen = new Set();
    const dedup = (items) => items.filter((it) => {
      if (!it.url || seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });
    const refs = Array.isArray(card.data?.ref_images) ? card.data.ref_images : [];
    const hero = card.thumbnail_url;
    const headRefs = [];
    if (hero && !refs.includes(hero)) headRefs.push(hero);
    headRefs.push(...refs);
    if (headRefs.length) {
      const items = dedup(headRefs.map((url) => ({
        url, type: "ref",
        isCover: url === hero,
        label: url === hero ? "⭐ 대표" : null,
        meta: { kind: url === hero ? "대표 이미지" : "참조 이미지" },
      })));
      if (items.length) out.push({ key: "refs", title: "🖼 대표 / 참조", items });
    }
    // v1.10.62 — 각 item 에 메타정보(seed/model/createdAt/source/votes) 추가, hover 패널 표시용.
    const cardVotes = (card.data?.cardVotes && typeof card.data.cardVotes === "object") ? card.data.cardVotes : {};
    const designs = (Array.isArray(card.data?.designs) ? card.data.designs : []).filter((d) => d?.imageUrl);
    if (designs.length) {
      const items = dedup(designs.map((d, i) => {
        const v = cardVotes[i];
        const voteN = (v && typeof v === "object") ? Object.keys(v).length : 0;
        return {
          url: d.imageUrl, type: "design", designIdx: i,
          isSelected: card.data?.selected_design === i,
          isCover: d.imageUrl === hero,
          label: d._sheet ? "📑 시트"
            : d._legacy ? "🗂 레거시"
            : d.source === "upload" ? `📤 #${i + 1}`
            : `#${i + 1}`,
          meta: {
            kind: d._sheet ? "시트" : d._legacy ? "레거시" : d.source === "upload" ? "업로드" : "AI 시안",
            seed: d.seed ?? null,
            createdAt: d.createdAt || null,
            votes: voteN,
            badge: `#${i + 1}`,
          },
        };
      }));
      if (items.length) out.push({ key: "designs", title: `🎨 시안 (${items.length})`, items });
    }
    const v = card.data?.concept_sheet_views;
    if (v && (v.front || v.side || v.back || v.top)) {
      const items = dedup(["front", "side", "back", "top"].filter((k) => v[k]).map((k) => ({
        url: v[k], type: "sheet",
        label: k === "front" ? "정면" : k === "side" ? "측면" : k === "back" ? "후면" : "상단",
        isCover: v[k] === hero,
        meta: {
          kind: "현재 시트",
          view: k,
          model: v.model || null,
          createdAt: v.generated_at || null,
        },
      })));
      if (items.length) {
        out.push({
          key: "sheet-current",
          title: `📑 현재 시트${v.model ? ` · ${v.model}` : ""}${v.generated_at ? ` · ${formatLocalTime(v.generated_at, "date")}` : ""}`,
          items,
        });
      }
    }
    const history = Array.isArray(card.data?.concept_sheet_history) ? card.data.concept_sheet_history : [];
    history.forEach((h, hi) => {
      const items = dedup(["front", "side", "back", "top"].filter((k) => h[k]).map((k) => ({
        url: h[k], type: "sheet-history",
        label: k === "front" ? "정면" : k === "side" ? "측면" : k === "back" ? "후면" : "상단",
        isCover: h[k] === hero,
        meta: {
          kind: `이전 시트 ${hi + 1}`,
          view: k,
          model: h.model || null,
          createdAt: h.generated_at || null,
        },
      })));
      if (items.length) {
        out.push({
          key: `sheet-history-${hi}`,
          title: `🗂 이전 시트 ${hi + 1}${h.generated_at ? ` · ${formatLocalTime(h.generated_at, "date")}` : ""}${h.model ? ` · ${h.model}` : ""}`,
          items,
        });
      }
    });
    return out;
  }, [card]);

  // 휠 줌 (커서 기준) — scale 은 setState, x/y 는 ref 로 직접 반영.
  const onWheel = React.useCallback((e) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    const prev = viewRef.current;
    const nextScale = clamp(prev.scale * Math.exp(delta), 0.1, 20);
    if (nextScale === prev.scale) return;
    const ratio = nextScale / prev.scale;
    viewRef.current = {
      scale: nextScale,
      x: px - (px - prev.x) * ratio,
      y: py - (py - prev.y) * ratio,
    };
    applyTransform();
    setScale(nextScale);
  }, [applyTransform]);

  // passive: false 로 wheel 리스너 등록 (기본 브라우저 줌 방지).
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e) => onWheel(e);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [onWheel]);

  const onPointerDown = (e) => {
    if (e.button !== 1 && e.button !== 2) return;
    e.preventDefault();
    setDragging(true);
    const v = viewRef.current;
    panStart.current = { sx: e.clientX, sy: e.clientY, vx: v.x, vy: v.y, moved: false };
    wrapRef.current?.setPointerCapture(e.pointerId);
  };
  // 팬: viewRef 업데이트 + 직접 transform — setState 안 불러 React 리렌더 없음.
  const onPointerMove = (e) => {
    if (!panStart.current) return;
    const { sx, sy, vx, vy } = panStart.current;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) panStart.current.moved = true;
    viewRef.current.x = vx + dx;
    viewRef.current.y = vy + dy;
    applyTransform();
  };
  const onPointerUp = (e) => {
    panStart.current = null;
    setDragging(false);
    try { wrapRef.current?.releasePointerCapture?.(e.pointerId); } catch {}
  };

  // 키보드.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "0") { fitToViewport(); return; }
      if (e.key === "+" || e.key === "=") {
        const s = clamp(viewRef.current.scale * 1.2, 0.1, 20);
        viewRef.current.scale = s; applyTransform(); setScale(s); return;
      }
      if (e.key === "-" || e.key === "_") {
        const s = clamp(viewRef.current.scale / 1.2, 0.1, 20);
        viewRef.current.scale = s; applyTransform(); setScale(s); return;
      }
      if (e.key === "ArrowUp")    { viewRef.current.y += 80; applyTransform(); return; }
      if (e.key === "ArrowDown")  { viewRef.current.y -= 80; applyTransform(); return; }
      if (e.key === "ArrowLeft")  { viewRef.current.x += 80; applyTransform(); return; }
      if (e.key === "ArrowRight") { viewRef.current.x -= 80; applyTransform(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, applyTransform, fitToViewport]);

  // 액션.
  const setCover = async (url) => {
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thumbnail_url: url, actor }),
      });
      await onSaved?.();
    } catch (e) { alert("대표 지정 실패: " + e.message); }
  };
  // v1.10.63 — 시안/시트 → 다음 시안 생성 참조로 추가 (ref_images 끝에 push).
  // 이미 ref_images 에 있는 URL 이면 무시.
  const copyToRef = async (url) => {
    if (!url) return;
    const existing = Array.isArray(card.data?.ref_images) ? card.data.ref_images : [];
    if (existing.includes(url)) {
      alert("이미 참조 이미지로 등록되어 있습니다.");
      return;
    }
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), ref_images: [...existing, url] },
          actor,
        }),
      });
      await onSaved?.();
      alert("🎯 참조 이미지에 추가됨. 다음 시안 생성에 반영됩니다.");
    } catch (e) { alert("참조 추가 실패: " + e.message); }
  };
  // v1.10.69 — 시안 순서 변경 (designs 배열 swap). selected_design 도 새 인덱스로 동기.
  const moveDesign = async (idx, dir) => {
    const designs = Array.isArray(card.data?.designs) ? [...card.data.designs] : [];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= designs.length) return;
    [designs[idx], designs[newIdx]] = [designs[newIdx], designs[idx]];
    let nextSelected = card.data?.selected_design;
    if (nextSelected === idx) nextSelected = newIdx;
    else if (nextSelected === newIdx) nextSelected = idx;
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), designs, selected_design: nextSelected },
          actor,
        }),
      });
      await onSaved?.();
    } catch (e) { alert("순서 변경 실패: " + e.message); }
  };
  const selectDesign = async (idx) => {
    try {
      const d = card.data?.designs?.[idx];
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), selected_design: idx },
          thumbnail_url: d?.imageUrl || card.thumbnail_url,
          actor,
        }),
      });
      await onSaved?.();
    } catch (e) { alert("선정 실패: " + e.message); }
  };

  const totalImages = groups.reduce((n, g) => n + g.items.length, 0);

  // Justified 그리드 레이아웃 (v1.10.34) — Google Photos / Flickr 식.
  // 각 행의 이미지들이 CONTAINER_WIDTH 를 꽉 채우도록 너비 자동 조정, 행 높이 통일.
  // 마지막 행은 비율 유지한 채 target 에서 stretch 안 함.
  const LAYOUT = React.useMemo(() => {
    const TARGET_H = 460;      // 기본 행 높이 (큼)
    const CONTAINER_W = 2800;  // 한 행 폭. 화면보다 크게 잡고 fit-to-viewport 가 축소해서 화면에 맞춤
    const GAP = 2;
    // v1.10.64 — 비활성 그룹 제외 후 펴기.
    const flat = groups.filter((g) => !disabledGroups.has(g.key)).flatMap((g) => g.items);
    // v1.10.61 — aspects 헬퍼 ({aspect,w,h} 또는 옛 number 호환).
    const aspectOf = (url) => {
      const v = aspects[url];
      if (typeof v === "number") return v;
      if (v && typeof v === "object") return v.aspect || 1;
      return 1;
    };
    const naturalOf = (url) => {
      const v = aspects[url];
      const natW = (v && typeof v === "object" && v.w) ? v.w : null;
      const natH = (v && typeof v === "object" && v.h) ? v.h : null;
      return { natW, natH };
    };

    // v1.10.69 — 균등 그리드: 모든 타일 동일 크기.
    if (layoutMode === "grid") {
      const SIZE = 360;
      const GGAP = 6;
      const perRow = Math.max(1, Math.floor((CONTAINER_W + GGAP) / (SIZE + GGAP)));
      const rows = [];
      for (let i = 0; i < flat.length; i += perRow) {
        const slice = flat.slice(i, i + perRow);
        rows.push({
          height: SIZE,
          items: slice.map((item) => {
            const { natW, natH } = naturalOf(item.url);
            return { item, width: SIZE, naturalImgW: natW, naturalImgH: natH };
          }),
        });
      }
      return { rows, gap: GGAP, containerWidth: CONTAINER_W };
    }

    // v1.10.69 — 타임라인: 1열, 생성 시각 desc (최신순). createdAt 없으면 원래 순서.
    if (layoutMode === "timeline") {
      const indexed = flat.map((item, i) => ({ item, i }));
      indexed.sort((a, b) => {
        const ad = a.item.meta?.createdAt || "";
        const bd = b.item.meta?.createdAt || "";
        if (ad && bd) return bd.localeCompare(ad);
        if (ad) return -1;
        if (bd) return 1;
        return a.i - b.i;
      });
      const ROW_H = 540;
      const MAX_W = CONTAINER_W * 0.7;
      const rows = indexed.map(({ item }) => {
        const a = aspectOf(item.url);
        let w = ROW_H * a;
        let h = ROW_H;
        if (w > MAX_W) { w = MAX_W; h = MAX_W / a; }
        const { natW, natH } = naturalOf(item.url);
        return { height: h, items: [{ item, width: w, naturalImgW: natW, naturalImgH: natH }] };
      });
      return { rows, gap: 12, containerWidth: CONTAINER_W };
    }

    // justified (기본) — 기존 로직.
    const rows = [];
    let cur = [];
    let curW = 0;
    for (const item of flat) {
      const a = aspectOf(item.url);
      const w = TARGET_H * a;
      if (curW + w + GAP * cur.length > CONTAINER_W && cur.length > 0) {
        rows.push({ items: cur, totalW: curW, full: true });
        cur = [];
        curW = 0;
      }
      cur.push({ item, naturalW: w });
      curW += w;
    }
    if (cur.length) rows.push({ items: cur, totalW: curW, full: false });
    const laid = rows.map((row) => {
      const available = CONTAINER_W - GAP * (row.items.length - 1);
      const rowScale = row.full ? available / row.totalW : Math.min(1, available / row.totalW);
      const rowH = TARGET_H * rowScale;
      return {
        height: rowH,
        items: row.items.map((x) => {
          const { natW, natH } = naturalOf(x.item.url);
          return { item: x.item, width: x.naturalW * rowScale, naturalImgW: natW, naturalImgH: natH };
        }),
      };
    });
    return { rows: laid, gap: GAP, containerWidth: CONTAINER_W };
  }, [groups, aspects, disabledGroups, layoutMode]);


  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(8, 12, 22, 0.98)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "10px 16px", zIndex: 10,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
        pointerEvents: "none",
      }}>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          🖼 <span style={{ maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.title || "(제목 없음)"}</span>
          <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>— 갤러리 · {totalImages}개</span>
        </div>
        {/* v1.10.64 — 그룹별 표시 토글 chip */}
        {groups.length > 1 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            pointerEvents: "auto",
          }}>
            {groups.map((g) => {
              const enabled = !disabledGroups.has(g.key);
              const label = g.key === "refs" ? "🖼 참조"
                : g.key === "designs" ? "🎨 시안"
                : g.key === "sheet-current" ? "📑 현재 시트"
                : g.key.startsWith("sheet-history-") ? `🗂 이전 시트 ${Number(g.key.replace("sheet-history-", "")) + 1}`
                : g.title.split(" ").slice(0, 2).join(" ");
              return (
                <button
                  key={g.key}
                  onClick={() => toggleGroup(g.key)}
                  title={enabled ? "이 그룹 숨기기" : "이 그룹 표시"}
                  style={{
                    padding: "4px 10px", borderRadius: 12,
                    background: enabled ? "rgba(7,110,232,0.25)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${enabled ? "rgba(7,110,232,0.55)" : "rgba(255,255,255,0.18)"}`,
                    color: enabled ? "#fff" : "rgba(255,255,255,0.45)",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    textDecoration: enabled ? "none" : "line-through",
                  }}
                >{label} ({g.items.length})</button>
              );
            })}
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
          {/* v1.10.65 — 다중 선택 액션 */}
          {selectedUrls.size > 0 && (
            <>
              <span style={{
                padding: "4px 10px", borderRadius: 12,
                background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)",
                color: "#86efac", fontSize: 11, fontWeight: 700,
              }}>✓ {selectedUrls.size}장 선택</span>
              {selectedUrls.size >= 2 && (
                <button
                  onClick={() => setCompareMode(true)}
                  title="선택한 이미지 나란히 비교"
                  style={{
                    padding: "5px 12px", borderRadius: 12,
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >🔀 비교</button>
              )}
              <button
                onClick={clearSelect}
                title="선택 해제"
                style={{
                  padding: "5px 10px", borderRadius: 12,
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >✕ 해제</button>
            </>
          )}
          {/* v1.10.69 — 레이아웃 모드 토글 (justified / 균등 / 타임라인) */}
          <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {[
              { id: "justified", icon: "🧱", title: "Justified (자유 배치)" },
              { id: "grid",      icon: "▦",  title: "균등 그리드" },
              { id: "timeline",  icon: "⏱",  title: "타임라인 (시간순 1열)" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setLayoutMode(m.id)}
                title={m.title}
                style={{
                  padding: "3px 8px", borderRadius: 5, border: "none",
                  background: layoutMode === m.id ? "rgba(255,255,255,0.18)" : "transparent",
                  color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >{m.icon}</button>
            ))}
          </div>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
            휠 줌 · 가운데/우클릭 드래그 팬 · 0 전체 · Ctrl+클릭 선택 · Esc/F 닫기
          </span>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontFamily: "monospace", padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.08)" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={fitToViewport}
            title="화면에 가득 맞추기"
            style={{
              padding: "5px 10px", borderRadius: 6,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >⊡ 전체 보기</button>
          <button
            onClick={() => {
              viewRef.current = { ...viewRef.current, scale: 1 };
              applyTransform();
              setScale(1);
            }}
            title="원본 1:1 보기"
            style={{
              padding: "5px 10px", borderRadius: 6,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >1:1</button>
          <button
            onClick={onClose}
            style={{
              padding: "5px 10px", borderRadius: 6,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
              color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >✕ 닫기</button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()} /* 우클릭 팬 중 브라우저 메뉴 차단 */
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          position: "absolute", inset: 0,
          overflow: "hidden",
          cursor: dragging ? "grabbing" : "default",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <div ref={contentRef} style={{
          position: "absolute", left: 0, top: 0,
          transformOrigin: "0 0",
          willChange: "transform",
          padding: 0,
          width: LAYOUT.containerWidth,
          // v1.10.34 — Justified 레이아웃. 각 행 폭 = CONTAINER_W 로 자동 정렬.
          display: "flex", flexDirection: "column",
          gap: LAYOUT.gap,
        }}>
          {groups.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, padding: 40 }}>
              이 카드엔 아직 이미지가 없습니다.
            </div>
          )}
          {LAYOUT.rows.map((row, ri) => (
            <div key={ri} style={{
              display: "flex", gap: LAYOUT.gap,
              height: row.height,
            }}>
              {row.items.map(({ item, width, naturalImgW, naturalImgH }, ii) => {
                const cmts = card?.data?.point_comments?.[item.url];
                const commentCount = Array.isArray(cmts) ? cmts.length : 0;
                const designsLen = Array.isArray(card?.data?.designs) ? card.data.designs.length : 0;
                return (
                  <GalleryTile
                    key={`${ri}-${ii}`}
                    item={item}
                    width={width}
                    height={row.height}
                    naturalImgW={naturalImgW}
                    naturalImgH={naturalImgH}
                    scale={scale}
                    onSetCover={setCover}
                    onCopyToRef={copyToRef}
                    onOpenLightbox={(url) => setLightboxSrc(url)}
                    selected={selectedUrls.has(item.url)}
                    onToggleSelect={toggleSelect}
                    commentCount={commentCount}
                    designsCount={designsLen}
                    onMoveDesign={moveDesign}
                    onImageLoad={onImageLoad}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* v1.10.63 — 타일 클릭 시 ImageLightbox (zIndex 1100 으로 갤러리 위에). */}
      {lightboxSrc && (() => {
        const flat = groups.flatMap((g) => g.items.map((it) => it.url)).filter(Boolean);
        const uniq = Array.from(new Set(flat));
        return (
          <ImageLightbox
            src={lightboxSrc}
            gallery={uniq}
            onChange={setLightboxSrc}
            onClose={() => setLightboxSrc(null)}
            card={card}
            projectSlug={projectSlug}
            actor={actor}
            onSavedRef={async () => { await onSaved?.(); }}
            zIndex={1100}
          />
        );
      })()}
      {/* v1.10.66 — 드래그-드롭 활성 오버레이 + 진행 상태 */}
      {(dropActive || dropBusy) && (
        <div style={{
          position: "absolute", inset: 16, zIndex: 1150,
          border: "3px dashed rgba(7,110,232,0.7)",
          borderRadius: 18,
          background: "rgba(7,110,232,0.08)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 18, fontWeight: 800,
          pointerEvents: "none",
          backdropFilter: "blur(2px)",
        }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{dropBusy ? "⏳" : "📥"}</div>
          <div>{dropBusy ? "이미지 업로드 중…" : "여기에 놓아 참조 이미지로 추가"}</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
            {dropBusy ? "잠시 기다려주세요" : "다음 시안 생성에 자동 반영됩니다"}
          </div>
        </div>
      )}
      {/* v1.10.65 — 다중 비교 오버레이. 선택 순서대로 격자 배치, contain 으로 풀사이즈.
          v1.10.67 — 2장 선택 시 🪄 슬라이더 모드 토글 (Before/After 비교). */}
      {compareMode && selectedUrls.size >= 2 && (
        <CompareOverlay
          urls={[...selectedUrls]}
          onClose={() => setCompareMode(false)}
          onOpenLightbox={(u) => setLightboxSrc(u)}
        />
      )}
    </div>
  );
}

// 🖼 이미지 Lightbox (v1.10.59) — 시안/참조/시트 이미지 클릭 시 줌·패닝 지원.
// GalleryCanvas 와 동일한 패턴: viewRef + ref-based DOM transform 으로 React 리렌더 회피,
// 휠 줌(커서 기준), 좌/중/우 클릭 드래그 패닝, 0 키로 fit, ←/→ 로 갤러리 이동, ESC 닫기.
// v1.10.60 — 그리기 모드 추가 (펜/지우개/색상). 카드 컨텍스트(card+projectSlug+actor) 가
// 있으면 합성 이미지를 ref_images 끝에 추가해 다음 시안 생성에 자동 반영.
function ImageLightbox({ src, gallery, onChange, onClose, card, projectSlug, actor, onSavedRef, zIndex = 300 }) {
  const idx = gallery.indexOf(src);
  const hasNav = gallery.length > 1 && idx >= 0;
  const canSaveRef = !!(card && projectSlug);
  const viewRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const [scale, setScale] = React.useState(1);
  const [dragging, setDragging] = React.useState(false);
  const wrapRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const panStart = React.useRef(null);
  // v1.10.60 — 그리기 모드 state.
  // v1.10.68 — 모드 확장: "view" | "draw" | "comment".
  const [mode, setMode] = React.useState("view");
  const [tool, setTool] = React.useState("pen");          // "pen" | "eraser"
  const [color, setColor] = React.useState("#ef4444");
  const [saving, setSaving] = React.useState(false);
  const [hasStrokes, setHasStrokes] = React.useState(false);
  const canvasRef = React.useRef(null);
  const drawingRef = React.useRef(false);
  const lastPtRef = React.useRef(null);
  const historyRef = React.useRef([]);
  // v1.10.68 — 포인트 코멘트 state. card.data.point_comments[url] 에 저장.
  const allPointComments = (card?.data?.point_comments && typeof card.data.point_comments === "object") ? card.data.point_comments : {};
  const pointComments = Array.isArray(allPointComments[src]) ? allPointComments[src] : [];
  const [pending, setPending] = React.useState(null);    // {x, y, body}
  const [hoverCommentId, setHoverCommentId] = React.useState(null);
  const COLORS = [
    { id: "#ef4444", label: "빨강" },
    { id: "#facc15", label: "노랑" },
    { id: "#3b82f6", label: "파랑" },
    { id: "#ffffff", label: "흰색" },
  ];
  const PEN_W = 6, ERASER_W = 14;

  const markersRef = React.useRef(null);
  const apply = React.useCallback(() => {
    const v = viewRef.current;
    const t = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.scale})`;
    if (imgRef.current) imgRef.current.style.transform = t;
    if (canvasRef.current) canvasRef.current.style.transform = t;
    if (markersRef.current) markersRef.current.style.transform = t;
  }, []);

  const fitToViewport = React.useCallback(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;
    const vw = wrap.clientWidth;
    const vh = wrap.clientHeight;
    const fit = Math.min((vw - 40) / iw, (vh - 40) / ih);
    const s = Math.max(0.05, fit);
    viewRef.current = {
      scale: s,
      x: (vw - iw * s) / 2,
      y: (vh - ih * s) / 2,
    };
    apply();
    setScale(s);
  }, [apply]);

  // src 변경 시 리셋 + fit (이미지 로드 후 호출됨, 캐시된 경우 useEffect 에서도 시도)
  React.useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth) {
      fitToViewport();
    } else {
      viewRef.current = { x: 0, y: 0, scale: 1 };
      apply();
      setScale(1);
    }
    // v1.10.60 — 이미지 변경 시 그리기 모드 자동 종료, history 리셋.
    setMode("view");
    setHasStrokes(false);
    historyRef.current = [];
  }, [src, fitToViewport, apply]);

  // v1.10.60 — 그리기 캔버스 초기화 (이미지 natural 크기와 동일).
  const initCanvas = React.useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const w = img.naturalWidth || 1024;
    const h = img.naturalHeight || 1024;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      historyRef.current = [];
      setHasStrokes(false);
    }
  }, []);

  React.useEffect(() => {
    if (mode === "draw") initCanvas();
  }, [mode, src, initCanvas]);

  // 캔버스 좌표로 변환 — getBoundingClientRect 가 CSS transform 반영하므로 비율로 환산.
  const toCanvasCoord = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const snap = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(snap);
      if (historyRef.current.length > 20) historyRef.current.shift();
    } catch { /* skip */ }
  };

  const onDrawDown = (e) => {
    if (mode !== "draw") return;
    e.stopPropagation();
    e.preventDefault();
    drawingRef.current = true;
    pushHistory();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const p = toCanvasCoord(e.clientX, e.clientY);
    lastPtRef.current = p;
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(p.x, p.y, ERASER_W / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PEN_W / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    setHasStrokes(true);
    canvas.setPointerCapture?.(e.pointerId);
  };

  const onDrawMove = (e) => {
    if (!drawingRef.current || mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPtRef.current) return;
    const ctx = canvas.getContext("2d");
    const p = toCanvasCoord(e.clientX, e.clientY);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = ERASER_W;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = PEN_W;
    }
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPtRef.current = p;
  };

  const onDrawUp = (e) => {
    drawingRef.current = false;
    lastPtRef.current = null;
    canvasRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const undo = () => {
    const snap = historyRef.current.pop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (snap) {
      ctx.putImageData(snap, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStrokes(historyRef.current.length > 0);
  };

  const clearAll = () => {
    if (!hasStrokes) return;
    if (!confirm("그림을 모두 지우시겠어요?")) return;
    pushHistory();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  // v1.10.68 — 포인트 코멘트 PATCH 헬퍼.
  const patchComments = async (nextForUrl) => {
    if (!canSaveRef) return;
    const nextAll = { ...allPointComments, [src]: nextForUrl };
    if (nextForUrl.length === 0) delete nextAll[src];
    try {
      const r = await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), point_comments: nextAll },
          actor: actor || null,
        }),
      });
      if (!r.ok) throw new Error(`PATCH ${r.status}`);
      await onSavedRef?.();
    } catch (e) { alert("코멘트 저장 실패: " + e.message); }
  };
  const addComment = async (x, y, body) => {
    const trimmed = (body || "").trim();
    if (!trimmed) return;
    const newC = {
      id: `pc-${Date.now()}`,
      x, y, body: trimmed,
      actor: actor || null,
      createdAt: new Date().toISOString(),
    };
    await patchComments([...pointComments, newC]);
  };
  const deleteComment = async (id) => {
    if (!confirm("이 코멘트를 삭제하시겠어요?")) return;
    await patchComments(pointComments.filter((c) => c.id !== id));
  };

  // 코멘트 모드에서 이미지 클릭 → 좌표 계산 → pending input 표시.
  const onCommentDown = (e) => {
    if (mode !== "comment") return;
    e.stopPropagation();
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPending({ x, y, body: "" });
  };
  const cancelPending = () => setPending(null);
  const submitPending = async () => {
    if (!pending) return;
    await addComment(pending.x, pending.y, pending.body);
    setPending(null);
    setMode("view");
  };

  const saveAsRef = async () => {
    if (!canSaveRef) { alert("이 컨텍스트에서는 참조 저장이 불가합니다."); return; }
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    if (!hasStrokes) { alert("먼저 이미지에 그림을 추가해주세요."); return; }
    setSaving(true);
    try {
      const off = document.createElement("canvas");
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const ctx = off.getContext("2d");
      ctx.drawImage(img, 0, 0, off.width, off.height);
      ctx.drawImage(canvas, 0, 0, off.width, off.height);
      const dataUrl = off.toDataURL("image/png");
      const url = await uploadDataUrl(dataUrl);
      const existing = Array.isArray(card.data?.ref_images) ? card.data.ref_images : [];
      const r = await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), ref_images: [...existing, url] },
          actor: actor || null,
        }),
      });
      if (!r.ok) throw new Error(`PATCH ${r.status}`);
      await onSavedRef?.();
      alert("✏️ 참조 이미지에 추가됨. 다음 시안 생성에 반영됩니다.");
      onClose();
    } catch (e) {
      alert("참조 저장 실패: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const onWheel = React.useCallback((e) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    const prev = viewRef.current;
    const nextScale = Math.max(0.05, Math.min(20, prev.scale * Math.exp(delta)));
    if (nextScale === prev.scale) return;
    const ratio = nextScale / prev.scale;
    viewRef.current = {
      scale: nextScale,
      x: px - (px - prev.x) * ratio,
      y: py - (py - prev.y) * ratio,
    };
    apply();
    setScale(nextScale);
  }, [apply]);

  // 휠 이벤트는 native non-passive 가 필요 (preventDefault) — useEffect 에서 직접 등록.
  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const onPointerDown = (e) => {
    // 좌(0)/휠(1)/우(2) 모두 패닝 — GalleryCanvas 와 동일.
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    // 닫기/네비/다운로드 버튼 위에서는 패닝 시작 안 함.
    if (e.target.closest("[data-lightbox-ui]")) return;
    // v1.10.60 — 그리기 모드에서는 캔버스가 자체 처리, wrap 패닝 차단.
    if (mode === "draw") return;
    // v1.10.68 — 코멘트 모드: 좌클릭 = 코멘트 위치 지정, 다른 버튼은 패닝 가능.
    if (mode === "comment" && e.button === 0) {
      onCommentDown(e);
      return;
    }
    e.preventDefault();
    setDragging(true);
    panStart.current = { x: e.clientX, y: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
    wrapRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    viewRef.current = { ...viewRef.current, x: panStart.current.vx + dx, y: panStart.current.vy + dy };
    apply();
  };
  const onPointerUp = (e) => {
    if (!panStart.current) return;
    // 거의 안 움직였으면 클릭으로 간주 → 배경이면 닫기.
    const dx = Math.abs(e.clientX - panStart.current.x);
    const dy = Math.abs(e.clientY - panStart.current.y);
    setDragging(false);
    panStart.current = null;
    wrapRef.current?.releasePointerCapture?.(e.pointerId);
    if (dx < 4 && dy < 4 && e.button === 0 && e.target === wrapRef.current) {
      onClose();
    }
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowLeft" && hasNav) {
        e.preventDefault();
        onChange(gallery[(idx - 1 + gallery.length) % gallery.length]);
      }
      else if (e.key === "ArrowRight" && hasNav) {
        e.preventDefault();
        onChange(gallery[(idx + 1) % gallery.length]);
      }
      else if (e.key === "0") { e.preventDefault(); fitToViewport(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasNav, gallery, idx, onChange, onClose, fitToViewport]);

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed", inset: 0, zIndex,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)",
        cursor: dragging ? "grabbing" : "grab",
        animation: "fadeIn 0.2s ease",
        outline: "none", overflow: "hidden",
        userSelect: "none",
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt=""
        draggable={false}
        crossOrigin="anonymous"
        onLoad={fitToViewport}
        style={{
          position: "absolute", left: 0, top: 0,
          transformOrigin: "0 0",
          willChange: "transform",
          userSelect: "none",
          pointerEvents: "none", // 클릭/드래그는 wrap 이 받음
        }}
      />
      {/* v1.10.60 — 그리기 캔버스 (이미지와 같은 transform). draw 모드일 때만 pointer 활성. */}
      <canvas
        ref={canvasRef}
        onPointerDown={onDrawDown}
        onPointerMove={onDrawMove}
        onPointerUp={onDrawUp}
        style={{
          position: "absolute", left: 0, top: 0,
          transformOrigin: "0 0",
          willChange: "transform",
          pointerEvents: mode === "draw" ? "auto" : "none",
          cursor: mode === "draw" ? (tool === "eraser" ? "cell" : "crosshair") : "default",
          // canvas 픽셀 단위 그리기는 자연 해상도로 하되, 화면 표시는 transform 으로 맞춤.
          // width/height attribute 는 initCanvas 에서 동적 설정 (style 은 자연 크기에 맞게 강제 안함).
        }}
      />
      {/* v1.10.68 — 코멘트 마커 레이어 (이미지와 같은 transform).
          인보크는 0~1 정규화 좌표를 IMG 픽셀 좌표로 변환해 표시. */}
      <div
        ref={markersRef}
        style={{
          position: "absolute", left: 0, top: 0,
          width: imgRef.current?.naturalWidth || 0,
          height: imgRef.current?.naturalHeight || 0,
          transformOrigin: "0 0",
          willChange: "transform",
          pointerEvents: "none",
        }}
      >
        {pointComments.map((c, idx) => {
          const iw = imgRef.current?.naturalWidth || 1024;
          const ih = imgRef.current?.naturalHeight || 1024;
          const px = c.x * iw;
          const py = c.y * ih;
          const counterScale = 1 / Math.max(scale, 0.05);
          const isMine = !!actor && c.actor === actor;
          return (
            <div key={c.id} style={{
              position: "absolute", left: px, top: py,
              transform: `translate(-50%, -50%) scale(${counterScale})`,
              transformOrigin: "center",
              pointerEvents: "auto",
            }}>
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onMouseEnter={() => setHoverCommentId(c.id)}
                onMouseLeave={() => setHoverCommentId(null)}
                style={{
                  width: 28, height: 28, borderRadius: 14,
                  background: hoverCommentId === c.id ? "#f59e0b" : "rgba(245,158,11,0.92)",
                  border: "2px solid #fff",
                  color: "#fff", fontSize: 13, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >{idx + 1}</div>
              {hoverCommentId === c.id && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute", top: 34, left: "50%",
                    transform: "translateX(-50%)",
                    minWidth: 220, maxWidth: 320,
                    padding: 10, borderRadius: 10,
                    background: "rgba(20,20,28,0.96)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#fff", fontSize: 12, lineHeight: 1.5,
                    boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
                  }}
                >
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                    {c.actor || "익명"} · {formatLocalTime(c.createdAt, "ymdhm")}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.body}</div>
                  {isMine && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }}
                      style={{
                        marginTop: 6, padding: "3px 10px", borderRadius: 6,
                        background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)",
                        color: "#fca5a5", fontSize: 10, fontWeight: 700, cursor: "pointer",
                      }}
                    >🗑 삭제</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* v1.10.68 — 새 코멘트 입력 popover (pending 위치 기준 화면 좌표) */}
      {pending && (() => {
        const img = imgRef.current;
        if (!img) return null;
        const r = img.getBoundingClientRect();
        const px = r.left + pending.x * r.width;
        const py = r.top + pending.y * r.height;
        return (
          <div
            data-lightbox-ui
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", left: px, top: py + 18,
              transform: "translateX(-50%)",
              minWidth: 260, padding: 10, borderRadius: 12,
              background: "rgba(20,20,28,0.97)",
              border: "1px solid rgba(245,158,11,0.5)",
              boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
              zIndex: 4,
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
              🗨 새 코멘트 — Ctrl/⌘+Enter 저장, Esc 취소
            </div>
            <textarea
              autoFocus
              value={pending.body}
              onChange={(e) => setPending({ ...pending, body: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") { e.preventDefault(); cancelPending(); }
                else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitPending(); }
              }}
              placeholder="피드백을 입력하세요…"
              style={{
                width: "100%", minHeight: 60, padding: 6, borderRadius: 6,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff", fontSize: 12, fontFamily: "inherit",
                resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
              <button
                onClick={cancelPending}
                style={{
                  padding: "5px 10px", borderRadius: 6,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >취소</button>
              <button
                onClick={submitPending}
                disabled={!pending.body.trim()}
                style={{
                  padding: "5px 12px", borderRadius: 6,
                  background: pending.body.trim() ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#fff", fontSize: 11, fontWeight: 700,
                  cursor: pending.body.trim() ? "pointer" : "not-allowed",
                }}
              >💾 저장</button>
            </div>
          </div>
        );
      })()}
      {hasNav && (
        <>
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); onChange(gallery[(idx - 1 + gallery.length) % gallery.length]); }}
            style={{
              position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
              width: 56, height: 56, borderRadius: 28,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 28, cursor: "pointer", zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="이전 (←)"
          >‹</button>
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); onChange(gallery[(idx + 1) % gallery.length]); }}
            style={{
              position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
              width: 56, height: 56, borderRadius: 28,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 28, cursor: "pointer", zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="다음 (→)"
          >›</button>
          <div
            data-lightbox-ui
            style={{
              position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
              padding: "6px 14px", borderRadius: 14,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 600, zIndex: 2,
            }}
          >{idx + 1} / {gallery.length}</div>
        </>
      )}
      {/* 줌 / fit / 그리기 컨트롤 — view 모드 */}
      {mode === "view" && (
        <div
          data-lightbox-ui
          style={{
            position: "absolute", bottom: 24, left: 24,
            display: "flex", gap: 6, zIndex: 2,
          }}
        >
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); fitToViewport(); }}
            title="화면에 맞추기 (0)"
            style={{
              padding: "6px 12px", borderRadius: 14,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >⛶ 맞춤</button>
          <div
            data-lightbox-ui
            style={{
              padding: "6px 12px", borderRadius: 14,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center",
            }}
          >🔍 {Math.round(scale * 100)}%</div>
          {canSaveRef && (
            <button
              data-lightbox-ui
              onClick={(e) => { e.stopPropagation(); setMode("draw"); }}
              title="이미지에 그리기 → 다음 시안 생성에 참조로 추가"
              style={{
                padding: "6px 12px", borderRadius: 14,
                background: "rgba(7,110,232,0.5)", border: "1px solid rgba(7,110,232,0.7)",
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >🖊 그리기</button>
          )}
          {canSaveRef && (
            <button
              data-lightbox-ui
              onClick={(e) => { e.stopPropagation(); setMode("comment"); }}
              title="이미지 위 클릭 위치에 코멘트 남기기"
              style={{
                padding: "6px 12px", borderRadius: 14,
                background: pointComments.length > 0 ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.15)",
                border: `1px solid ${pointComments.length > 0 ? "rgba(245,158,11,0.7)" : "rgba(255,255,255,0.3)"}`,
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >🗨 코멘트{pointComments.length > 0 ? ` ${pointComments.length}` : ""}</button>
          )}
        </div>
      )}
      {/* v1.10.68 — 코멘트 모드 안내 바 */}
      {mode === "comment" && (
        <div
          data-lightbox-ui
          style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 8, alignItems: "center", zIndex: 3,
            padding: "8px 14px", borderRadius: 16,
            background: "rgba(245,158,11,0.92)", color: "#000",
            fontSize: 12, fontWeight: 700,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          🗨 코멘트 모드 — 이미지 위 원하는 위치 클릭
          <button
            onClick={(e) => { e.stopPropagation(); setMode("view"); setPending(null); }}
            style={{
              padding: "4px 10px", borderRadius: 8,
              background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,0,0,0.3)",
              color: "#000", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >종료</button>
        </div>
      )}
      {/* v1.10.60 — draw 모드 도구바 */}
      {mode === "draw" && (
        <div
          data-lightbox-ui
          style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 6, alignItems: "center", zIndex: 3,
            padding: "8px 12px", borderRadius: 16,
            background: "rgba(20,20,28,0.92)", border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
          }}
        >
          {COLORS.map((c) => (
            <button
              key={c.id}
              data-lightbox-ui
              onClick={(e) => { e.stopPropagation(); setColor(c.id); setTool("pen"); }}
              title={c.label}
              style={{
                width: 26, height: 26, borderRadius: 13,
                background: c.id,
                border: color === c.id && tool === "pen"
                  ? "3px solid #fff"
                  : "1px solid rgba(255,255,255,0.4)",
                cursor: "pointer", padding: 0,
                boxShadow: color === c.id && tool === "pen" ? "0 0 0 2px " + c.id : "none",
              }}
            />
          ))}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); setTool("pen"); }}
            title="펜"
            style={{
              padding: "5px 10px", borderRadius: 8,
              background: tool === "pen" ? "rgba(255,255,255,0.2)" : "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >✏️ 펜</button>
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); setTool("eraser"); }}
            title="지우개"
            style={{
              padding: "5px 10px", borderRadius: 8,
              background: tool === "eraser" ? "rgba(255,255,255,0.2)" : "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >🧹 지우개</button>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); undo(); }}
            disabled={historyRef.current.length === 0}
            title="되돌리기"
            style={{
              padding: "5px 10px", borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: historyRef.current.length === 0 ? "rgba(255,255,255,0.4)" : "#fff",
              fontSize: 12, fontWeight: 700,
              cursor: historyRef.current.length === 0 ? "not-allowed" : "pointer",
            }}
          >↶ 되돌리기</button>
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); clearAll(); }}
            disabled={!hasStrokes}
            title="전체 지우기"
            style={{
              padding: "5px 10px", borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: hasStrokes ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 700,
              cursor: hasStrokes ? "pointer" : "not-allowed",
            }}
          >🗑 비우기</button>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
          <button
            data-lightbox-ui
            onClick={(e) => { e.stopPropagation(); saveAsRef(); }}
            disabled={saving || !hasStrokes}
            style={{
              padding: "6px 14px", borderRadius: 8,
              background: saving || !hasStrokes
                ? "rgba(255,255,255,0.1)"
                : "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              color: saving || !hasStrokes ? "rgba(255,255,255,0.5)" : "#fff",
              fontSize: 12, fontWeight: 700,
              cursor: saving || !hasStrokes ? "not-allowed" : "pointer",
            }}
          >{saving ? "저장 중…" : "💾 참조 저장 + 닫기"}</button>
          <button
            data-lightbox-ui
            onClick={(e) => {
              e.stopPropagation();
              if (hasStrokes && !confirm("그림을 버리고 종료하시겠어요?")) return;
              setMode("view");
              const c = canvasRef.current;
              if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
              historyRef.current = [];
              setHasStrokes(false);
            }}
            title="그리기 종료 (저장 안 함)"
            style={{
              padding: "5px 10px", borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >✕</button>
        </div>
      )}
      <button
        data-lightbox-ui
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute", top: 20, right: 20,
          width: 44, height: 44, borderRadius: 22,
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff", fontSize: 20, cursor: "pointer", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title="닫기 (ESC)"
      >✕</button>
      <a
        data-lightbox-ui
        href={src}
        download
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: 20, right: 76,
          padding: "10px 16px", borderRadius: 22,
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6, zIndex: 2,
        }}
      >📥 저장</a>
    </div>
  );
}

// v1.10.67 — 다중 선택 비교 오버레이. 그리드 모드(N장 격자) + 슬라이더 모드(2장 Before/After).
function CompareOverlay({ urls, onClose, onOpenLightbox }) {
  const n = urls.length;
  const cols = n <= 2 ? n : (n <= 4 ? 2 : (n <= 6 ? 3 : 4));
  const [mode, setMode] = React.useState("grid");      // "grid" | "slider"
  const [sliderPos, setSliderPos] = React.useState(0.5); // 0~1 (좌→우)
  const [sliderA, setSliderA] = React.useState(0);       // 좌측 이미지 idx
  const [sliderB, setSliderB] = React.useState(1);       // 우측 이미지 idx
  const sliderRef = React.useRef(null);
  const draggingSlider = React.useRef(false);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // n 변경 시 슬라이더 인덱스 보정
  React.useEffect(() => {
    if (sliderA >= n) setSliderA(0);
    if (sliderB >= n) setSliderB(Math.min(1, n - 1));
  }, [n, sliderA, sliderB]);

  const onSliderDown = (e) => {
    draggingSlider.current = true;
    sliderRef.current?.setPointerCapture?.(e.pointerId);
    updateSlider(e);
  };
  const onSliderMove = (e) => {
    if (!draggingSlider.current) return;
    updateSlider(e);
  };
  const onSliderUp = (e) => {
    draggingSlider.current = false;
    sliderRef.current?.releasePointerCapture?.(e.pointerId);
  };
  const updateSlider = (e) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    setSliderPos(Math.max(0, Math.min(1, x)));
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(8,10,14,0.97)",
        display: "flex", flexDirection: "column",
        outline: "none",
      }}
    >
      <div style={{
        padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>
          🔀 비교 — {n}장
        </div>
        {/* v1.10.67 — 모드 토글 */}
        <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 8, background: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setMode("grid")}
            style={{
              padding: "4px 10px", borderRadius: 6, border: "none",
              background: mode === "grid" ? "rgba(255,255,255,0.15)" : "transparent",
              color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >📰 그리드</button>
          <button
            onClick={() => setMode("slider")}
            disabled={n < 2}
            style={{
              padding: "4px 10px", borderRadius: 6, border: "none",
              background: mode === "slider" ? "rgba(255,255,255,0.15)" : "transparent",
              color: n < 2 ? "rgba(255,255,255,0.3)" : "#fff",
              fontSize: 11, fontWeight: 700, cursor: n < 2 ? "not-allowed" : "pointer",
            }}
          >🪄 슬라이더</button>
        </div>
        {mode === "slider" && n >= 2 && (
          <>
            <select
              value={sliderA}
              onChange={(e) => setSliderA(Number(e.target.value))}
              style={{
                padding: "3px 8px", borderRadius: 6,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff", fontSize: 11, fontWeight: 600,
              }}
            >
              {urls.map((_, i) => <option key={i} value={i} style={{ color: "#000" }}>좌: #{i + 1}</option>)}
            </select>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>↔</span>
            <select
              value={sliderB}
              onChange={(e) => setSliderB(Number(e.target.value))}
              style={{
                padding: "3px 8px", borderRadius: 6,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff", fontSize: 11, fontWeight: 600,
              }}
            >
              {urls.map((_, i) => <option key={i} value={i} style={{ color: "#000" }}>우: #{i + 1}</option>)}
            </select>
          </>
        )}
        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>ESC 로 갤러리 복귀</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: "auto", padding: "5px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >← 갤러리로</button>
      </div>
      {mode === "grid" && (
        <div style={{
          flex: 1, padding: 14, overflow: "hidden",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: "1fr",
          gap: 10,
        }}>
          {urls.map((u, i) => (
            <div
              key={u}
              style={{
                position: "relative", borderRadius: 10, overflow: "hidden",
                background: "#000",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <img
                src={u}
                alt=""
                onClick={() => onOpenLightbox?.(u)}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "contain",
                  cursor: "zoom-in", display: "block",
                  background: "#000",
                }}
              />
              <div style={{
                position: "absolute", top: 6, left: 6,
                padding: "2px 9px", borderRadius: 11,
                background: "rgba(0,0,0,0.7)", color: "#fff",
                fontSize: 11, fontWeight: 700, pointerEvents: "none",
              }}>#{i + 1}</div>
            </div>
          ))}
        </div>
      )}
      {mode === "slider" && n >= 2 && (
        <div
          ref={sliderRef}
          onPointerDown={onSliderDown}
          onPointerMove={onSliderMove}
          onPointerUp={onSliderUp}
          style={{
            flex: 1, position: "relative",
            background: "#000",
            cursor: "ew-resize",
            overflow: "hidden",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          {/* 좌측 (A) — 풀사이즈 */}
          <img
            src={urls[Math.min(sliderA, n - 1)]}
            alt=""
            draggable={false}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
          {/* 우측 (B) — clip-path 로 sliderPos 우측만 표시 */}
          <img
            src={urls[Math.min(sliderB, n - 1)]}
            alt=""
            draggable={false}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "contain",
              clipPath: `inset(0 0 0 ${sliderPos * 100}%)`,
              pointerEvents: "none",
            }}
          />
          {/* 슬라이더 라인 + 핸들 */}
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${sliderPos * 100}%`,
            width: 2, marginLeft: -1,
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 12px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: "50%",
            left: `${sliderPos * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 44, height: 44, borderRadius: 22,
            background: "rgba(255,255,255,0.95)",
            border: "2px solid #fff",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#1a1d23", fontSize: 18, fontWeight: 800,
            pointerEvents: "none",
          }}>↔</div>
          {/* 라벨 */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            padding: "4px 10px", borderRadius: 12,
            background: "rgba(0,0,0,0.65)", color: "#fff",
            fontSize: 12, fontWeight: 700, pointerEvents: "none",
          }}>좌 #{sliderA + 1}</div>
          <div style={{
            position: "absolute", top: 12, right: 12,
            padding: "4px 10px", borderRadius: 12,
            background: "rgba(0,0,0,0.65)", color: "#fff",
            fontSize: 12, fontWeight: 700, pointerEvents: "none",
          }}>우 #{sliderB + 1}</div>
        </div>
      )}
    </div>
  );
}

function GalleryTile({ item, width, height, naturalImgW, naturalImgH, scale, onSetCover, onCopyToRef, onOpenLightbox, selected, onToggleSelect, commentCount = 0, designsCount = 0, onMoveDesign, onImageLoad }) {
  // Justified 레이아웃 (v1.10.34) — 셀 크기 고정(width/height).
  // v1.10.61: 이미지를 자연 해상도로 렌더하고 transform 으로 셀에 맞춤.
  //   이전엔 width/height 100% + object-fit cover → 셀 크기로 다운샘플 → 줌인 시 GPU 업스케일로 흐림.
  //   이제 IMG bitmap 이 natural pixel 그대로 → 줌인하면 원본 픽셀이 노출됨.
  //   메모리 보호: 단일 IMG 가 최대 2048px 변에 cap.
  // v1.10.62: hover 시 메타 패널 표시 (해상도 / 종류 / model / seed / 날짜 / 투표).
  const coverBtnTitle = item.isCover ? "현재 대표 이미지" : "카드 대표(썸네일)로 지정";
  const invScale = 1 / Math.max(scale || 1, 0.01);
  const [hovered, setHovered] = React.useState(false);
  const meta = item.meta || {};
  const metaParts = [];
  if (naturalImgW && naturalImgH) metaParts.push(`${naturalImgW}×${naturalImgH}`);
  if (meta.kind) metaParts.push(meta.kind);
  if (meta.model) metaParts.push(meta.model);
  if (meta.seed != null) metaParts.push(`seed:${meta.seed}`);
  if (meta.createdAt) metaParts.push(formatLocalTime(meta.createdAt, "ymdhm"));
  if (meta.votes > 0) metaParts.push(`👍 ${meta.votes}`);
  const showMeta = hovered && metaParts.length > 0;

  // 자연 해상도 알고 있으면 그것 기반, 모르면 fallback (이미지 로드 전).
  let imgStyle;
  if (naturalImgW && naturalImgH) {
    const MAX_DIM = 2048; // 메모리 cap
    const cap = Math.min(MAX_DIM / naturalImgW, MAX_DIM / naturalImgH, 1);
    const renderW = naturalImgW * cap;
    const renderH = naturalImgH * cap;
    const fit = Math.max(width / renderW, height / renderH); // cover 동작
    imgStyle = {
      display: "block", pointerEvents: "none",
      width: renderW, height: renderH,
      transform: `scale(${fit})`,
      transformOrigin: "top left",
      imageRendering: "auto",
      position: "absolute", left: 0, top: 0,
    };
  } else {
    imgStyle = {
      display: "block", pointerEvents: "none",
      width: "100%", height: "100%",
      objectFit: "cover",
      imageRendering: "auto",
    };
  }

  // v1.10.63 — 좌클릭 시 lightbox(줌/패닝/그리기 전체 기능). 작은 클릭만 → 드래그-팬과 충돌 회피.
  // v1.10.65 — Cmd/Ctrl-클릭은 선택 토글, 일반 클릭은 lightbox.
  const downRef = React.useRef(null);
  const onTileDown = (e) => {
    if (e.button !== 0) return;
    downRef.current = { x: e.clientX, y: e.clientY, mod: e.ctrlKey || e.metaKey };
  };
  const onTileUp = (e) => {
    if (e.button !== 0 || !downRef.current) return;
    const dx = Math.abs(e.clientX - downRef.current.x);
    const dy = Math.abs(e.clientY - downRef.current.y);
    const mod = downRef.current.mod;
    downRef.current = null;
    if (dx < 4 && dy < 4) {
      if (mod) onToggleSelect?.(item.url);
      else onOpenLightbox?.(item.url);
    }
  };
  const isCopyable = item.type === "design" || item.type === "sheet" || item.type === "sheet-history";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={onTileDown}
      onPointerUp={onTileUp}
      style={{
        width, height,
        position: "relative",
        display: "inline-block", flexShrink: 0,
        overflow: "hidden",
        background: "#111",
        cursor: "zoom-in",
        boxShadow: selected ? "inset 0 0 0 4px #22c55e" : "none",
      }}>
      <img
        src={item.url}
        alt=""
        draggable={false}
        onLoad={(e) => onImageLoad?.(e, item.url)}
        style={imgStyle}
      />
      {/* v1.10.65 — 선택된 타일 ✓ badge (좌상단, label 위쪽 제외하고 우하단 사용) */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 6, right: 6,
          width: 26, height: 26, borderRadius: 13,
          background: "#22c55e", color: "#fff",
          fontSize: 14, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${invScale})`, transformOrigin: "bottom right",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
          pointerEvents: "none",
        }}>✓</div>
      )}
      {/* v1.10.68 — 코멘트 수 badge (좌하단). 클릭 시 lightbox 진입은 부모 onTileUp 처리. */}
      {commentCount > 0 && (
        <div style={{
          position: "absolute", bottom: 6, left: 6,
          padding: "3px 9px", borderRadius: 12,
          background: "rgba(245,158,11,0.92)", color: "#fff",
          fontSize: 11, fontWeight: 800,
          display: "flex", alignItems: "center", gap: 3,
          transform: `scale(${invScale})`, transformOrigin: "bottom left",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>🗨 {commentCount}</div>
      )}
      {/* v1.10.62 — 메타 hover 패널 (좌하단). 줌이 변해도 일정 크기 유지하기 위해 counter-scale. */}
      {showMeta && (
        <div style={{
          position: "absolute", bottom: 6, left: 6,
          padding: "4px 8px", borderRadius: 6,
          background: "rgba(0,0,0,0.78)", color: "#fff",
          fontSize: 10, fontWeight: 600, lineHeight: 1.4,
          fontFamily: "monospace",
          pointerEvents: "none",
          maxWidth: "calc(100% - 12px)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          transform: `scale(${invScale})`, transformOrigin: "bottom left",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }}>
          {metaParts.join(" · ")}
        </div>
      )}
      {item.label && (
        <div style={{
          position: "absolute", top: 6, left: 6,
          padding: "2px 8px", borderRadius: 4,
          background: "rgba(0,0,0,0.72)", color: "#fff",
          fontSize: 10, fontWeight: 700, pointerEvents: "none",
          transform: `scale(${invScale})`, transformOrigin: "top left",
        }}>{item.label}</div>
      )}
      <button
        data-action="cover"
        onClick={(e) => {
          e.stopPropagation();
          if (item.isCover) return;
          onSetCover(item.url);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        title={coverBtnTitle}
        style={{
          position: "absolute", top: 6, right: 6,
          width: 30, height: 30, borderRadius: 15,
          background: item.isCover ? "#22c55e" : "rgba(0,0,0,0.55)",
          border: "none",
          color: "#fff",
          fontSize: 15, cursor: item.isCover ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0, lineHeight: 1,
          transform: `scale(${invScale})`, transformOrigin: "top right",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
        }}
      >{item.isCover ? "⭐" : "☆"}</button>
      {/* v1.10.63 — 시안/시트 → 다음 시안 생성 참조로 추가 (hover 시만 노출) */}
      {hovered && isCopyable && onCopyToRef && (
        <button
          data-action="copy-ref"
          onClick={(e) => { e.stopPropagation(); onCopyToRef(item.url); }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          title="다음 시안 생성 참조로 추가"
          style={{
            position: "absolute", top: 6, right: 42,
            padding: "4px 9px", borderRadius: 13,
            background: "rgba(7,110,232,0.85)", border: "none",
            color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
            transform: `scale(${invScale})`, transformOrigin: "top right",
            boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
            whiteSpace: "nowrap",
          }}
        >🎯 참조</button>
      )}
      {/* v1.10.69 — 시안 순서 변경 ◀/▶ (design 타입 + 2개 이상일 때 hover) */}
      {hovered && item.type === "design" && designsCount > 1 && onMoveDesign && (
        <div style={{
          position: "absolute", top: "50%", left: 6,
          transform: `translateY(-50%) scale(${invScale})`, transformOrigin: "left center",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <button
            data-action="move-prev"
            onClick={(e) => { e.stopPropagation(); onMoveDesign(item.designIdx, -1); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            disabled={item.designIdx === 0}
            title="앞으로 이동"
            style={{
              width: 30, height: 30, borderRadius: 15, border: "none",
              background: item.designIdx === 0 ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.7)",
              color: item.designIdx === 0 ? "rgba(255,255,255,0.4)" : "#fff",
              fontSize: 14, fontWeight: 800,
              cursor: item.designIdx === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
            }}
          >◀</button>
          <button
            data-action="move-next"
            onClick={(e) => { e.stopPropagation(); onMoveDesign(item.designIdx, +1); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            disabled={item.designIdx === designsCount - 1}
            title="뒤로 이동"
            style={{
              width: 30, height: 30, borderRadius: 15, border: "none",
              background: item.designIdx === designsCount - 1 ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.7)",
              color: item.designIdx === designsCount - 1 ? "rgba(255,255,255,0.4)" : "#fff",
              fontSize: 14, fontWeight: 800,
              cursor: item.designIdx === designsCount - 1 ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
            }}
          >▶</button>
        </div>
      )}
    </div>
  );
}

// 카드 공유 링크 복사 — 제목 옆 작은 🔗 아이콘, 클릭 시 현재 카드 URL 을 클립보드에 복사 (v1.10.24).
// v1.10.89 — API 설정 모달 안의 사용량 패널.
// v1.10.90 — Top 5 leaderboard + 프로필 선택 + 기간 + 탭 뷰(요약/모델/일자/최근).
function ApiUsagePanel({ currentActor, profiles = [] }) {
  const [selectedActor, setSelectedActor] = React.useState(currentActor || "");
  const [period, setPeriod] = React.useState("month"); // today / week / month / 90d
  const [view, setView] = React.useState("summary");   // summary / model / daily / recent
  const [data, setData] = React.useState(null);
  const [leaderboard, setLeaderboard] = React.useState(null);
  const [daily, setDaily] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const periodToDays = (p) => p === "today" ? 1 : p === "week" ? 7 : p === "month" ? 30 : 90;
  const periodLabel = (p) => p === "today" ? "오늘" : p === "week" ? "이번주(7일)" : p === "month" ? "이번달(30일)" : "최근 90일";

  // 단일 actor 요약 + 최근 호출
  const reloadActor = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedActor ? `?actor=${encodeURIComponent(selectedActor)}` : "";
      const r = await fetch(`/api/usage${q}`);
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedActor]);

  // Top 5 leaderboard (전체 사용자, 30일)
  const reloadLeaderboard = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/usage?actor=*&days=30`);
      if (r.ok) setLeaderboard(((await r.json()).rows || []).slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  // 일자별 시계열
  const reloadDaily = React.useCallback(async () => {
    try {
      const days = periodToDays(period);
      const a = selectedActor ? encodeURIComponent(selectedActor) : "";
      const r = await fetch(`/api/usage/daily?actor=${a}&days=${days}`);
      if (r.ok) setDaily((await r.json()).rows || []);
    } catch { /* ignore */ }
  }, [selectedActor, period]);

  React.useEffect(() => { reloadActor(); }, [reloadActor]);
  React.useEffect(() => { reloadLeaderboard(); }, [reloadLeaderboard]);
  React.useEffect(() => { if (view === "daily") reloadDaily(); }, [view, reloadDaily]);

  const fmtCost = (n) => "$" + (Number(n) || 0).toFixed(4);
  const fmtTok = (n) => (Number(n) || 0).toLocaleString();
  const sumCost = (arr) => (arr || []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
  const sumCalls = (arr) => (arr || []).reduce((s, r) => s + (Number(r.calls) || 0), 0);

  // 선택된 기간의 집계 행 (data.today/week/month, 90d 는 daily 합산)
  const periodRows = data ? (period === "today" ? data.today : period === "week" ? data.week : data.month) : null;
  // 90d 는 별도 fetch 필요할 수 있지만 month(30) 까지만 단일-actor 엔드포인트가 제공. 90 은 daily 합산.

  // Top 5 비용 합산 (퍼센트용)
  const lbTotalCost = leaderboard ? leaderboard.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0) : 0;
  const dailyMaxCost = daily ? Math.max(0.001, ...daily.map((r) => Number(r.cost_usd) || 0)) : 0.001;

  // 프로필 옵션: 선택된 actor + 모든 프로필 + (익명).
  const profileOptions = (() => {
    const opts = profiles.map((p) => p.name);
    if (currentActor && !opts.includes(currentActor)) opts.unshift(currentActor);
    return opts;
  })();

  return (
    <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--surface-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>📊 API 사용량</span>
        <button
          onClick={() => { reloadActor(); reloadLeaderboard(); reloadDaily(); }}
          disabled={loading}
          title="새로고침"
          style={{
            marginLeft: "auto", padding: "4px 10px", borderRadius: 8,
            background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
            color: "var(--text-muted)", fontSize: 11, fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >{loading ? "로딩..." : "🔄 새로고침"}</button>
      </div>

      {/* 🏆 Top 5 leaderboard (이번달, 전체 사용자) */}
      {leaderboard && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
            🏆 Top 5 사용자 (최근 30일)
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--text-muted)", textAlign: "center", border: "1px dashed var(--surface-border)", borderRadius: 8 }}>
              호출 기록 없음
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {leaderboard.map((r, i) => {
                const pct = lbTotalCost > 0 ? (Number(r.cost_usd) / lbTotalCost) * 100 : 0;
                const isCurrent = r.actor === currentActor;
                const isSelected = r.actor === selectedActor;
                const medal = ["🥇", "🥈", "🥉", "4위", "5위"][i] || `${i + 1}위`;
                return (
                  <button
                    key={r.actor + i}
                    onClick={() => setSelectedActor(r.actor === "(익명)" ? "" : r.actor)}
                    title="클릭해서 이 사용자의 상세 보기"
                    style={{
                      display: "grid", gridTemplateColumns: "32px 1fr auto auto", gap: 8,
                      alignItems: "center", padding: "6px 10px",
                      borderRadius: 8, border: "none", textAlign: "left", cursor: "pointer",
                      background: isSelected ? "rgba(7,110,232,0.08)" : "rgba(0,0,0,0.02)",
                      borderLeft: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
                      fontSize: 12, position: "relative",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{medal}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontWeight: isCurrent ? 800 : 600,
                        color: isCurrent ? "var(--primary)" : "var(--text-main)",
                      }}>
                        {isCurrent && <span>👤</span>}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.actor}</span>
                      </div>
                      <div style={{ marginTop: 2, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--primary), var(--secondary))" }} />
                      </div>
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{r.calls}회</span>
                    <span style={{ fontWeight: 700, minWidth: 70, textAlign: "right" }}>{fmtCost(r.cost_usd)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 프로필 / 기간 선택 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>프로필:</span>
        <select
          value={selectedActor}
          onChange={(e) => setSelectedActor(e.target.value)}
          style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 12,
            border: "1px solid var(--surface-border)", background: "#fff",
            color: "var(--text-main)", fontWeight: 600, cursor: "pointer",
          }}
        >
          <option value="">(익명)</option>
          {profileOptions.map((name) => (
            <option key={name} value={name}>
              {name === currentActor ? `👤 ${name} (나)` : name}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginLeft: 8 }}>기간:</span>
        <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 7, background: "rgba(0,0,0,0.04)" }}>
          {[
            { id: "today", label: "오늘" },
            { id: "week",  label: "7일" },
            { id: "month", label: "30일" },
            { id: "90d",   label: "90일" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: "3px 9px", borderRadius: 5, border: "none",
                background: period === p.id ? "#fff" : "transparent",
                color: period === p.id ? "var(--primary)" : "var(--text-muted)",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                boxShadow: period === p.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* 합계 한 줄 */}
      {data && periodRows && period !== "90d" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 12px", borderRadius: 8, marginBottom: 10,
          background: "linear-gradient(135deg, rgba(7,110,232,0.06), rgba(139,92,246,0.04))",
          border: "1px solid rgba(7,110,232,0.18)",
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{periodLabel(period)}:</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{fmtCost(sumCost(periodRows))}</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{sumCalls(periodRows)}회 호출</span>
        </div>
      )}
      {period === "90d" && daily && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 12px", borderRadius: 8, marginBottom: 10,
          background: "linear-gradient(135deg, rgba(7,110,232,0.06), rgba(139,92,246,0.04))",
          border: "1px solid rgba(7,110,232,0.18)",
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>최근 90일:</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
            {fmtCost(daily.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0))}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {daily.reduce((s, r) => s + (Number(r.calls) || 0), 0)}회 호출 / {daily.length}일 활성
          </span>
        </div>
      )}

      {/* 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8, borderBottom: "1px solid var(--surface-border)" }}>
        {[
          { id: "model",  label: "🤖 모델별" },
          { id: "daily",  label: "📅 일자별" },
          { id: "recent", label: "🕐 최근 호출" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            style={{
              padding: "6px 12px", borderRadius: "6px 6px 0 0", border: "none",
              borderBottom: view === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              background: "transparent",
              color: view === t.id ? "var(--primary)" : "var(--text-muted)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* 모델별 */}
      {view === "model" && (
        periodRows && periodRows.length > 0 ? (
          <div style={{ border: "1px solid var(--surface-border)", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
            {periodRows.map((r, i) => (
              <div key={`${r.endpoint}-${r.model}-${i}`} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 10,
                alignItems: "center", padding: "6px 10px", fontSize: 11,
                background: i % 2 ? "rgba(0,0,0,0.02)" : "transparent",
              }}>
                <span style={{ color: r.endpoint === "claude" ? "#a855f7" : "#076ee8", fontWeight: 700 }}>
                  {r.endpoint === "claude" ? "🤖 Claude" : "✨ Gemini"}
                </span>
                <span style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.model || "—"}
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  {r.image_count > 0 ? `🖼 ${r.image_count}장` : `${fmtTok(r.input_tokens)}↓ / ${fmtTok(r.output_tokens)}↑`}
                </span>
                <span style={{ fontWeight: 700, minWidth: 70, textAlign: "right" }}>
                  {fmtCost(r.cost_usd)} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {r.calls}회</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontSize: 11, color: "var(--text-muted)", border: "1px dashed var(--surface-border)", borderRadius: 8 }}>
            기록 없음
          </div>
        )
      )}

      {/* 일자별 — 최대 30일 막대 그래프 */}
      {view === "daily" && (
        daily && daily.length > 0 ? (
          <div style={{ border: "1px solid var(--surface-border)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80, marginBottom: 6 }}>
              {daily.map((r) => {
                const h = Math.max(2, (Number(r.cost_usd) || 0) / dailyMaxCost * 76);
                return (
                  <div
                    key={r.day}
                    title={`${r.day} · $${(Number(r.cost_usd) || 0).toFixed(4)} · ${r.calls}회`}
                    style={{
                      flex: 1, height: `${h}px`,
                      background: "linear-gradient(180deg, var(--primary), var(--secondary))",
                      borderRadius: "2px 2px 0 0", minWidth: 4,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-muted)", fontFamily: "monospace" }}>
              <span>{daily[0]?.day || ""}</span>
              <span>{daily[daily.length - 1]?.day || ""}</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontSize: 11, color: "var(--text-muted)", border: "1px dashed var(--surface-border)", borderRadius: 8 }}>
            기록 없음 (탭 진입 시 자동 로드)
          </div>
        )
      )}

      {/* 최근 호출 */}
      {view === "recent" && (
        data && data.recent && data.recent.length > 0 ? (
          <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--surface-border)", borderRadius: 8, marginBottom: 8 }}>
            {data.recent.map((r, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "auto auto 1fr auto auto", gap: 8,
                padding: "5px 10px", fontSize: 10, color: "var(--text-muted)",
                fontFamily: "monospace", background: i % 2 ? "rgba(0,0,0,0.02)" : "transparent",
              }}>
                <span>{formatLocalTime(r.created_at, "ymdhms")}</span>
                <span style={{ color: r.endpoint === "claude" ? "#a855f7" : "#076ee8", fontWeight: 700 }}>{r.endpoint}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.model || "—"}</span>
                <span style={{ color: r.status_code && r.status_code < 300 ? "#15803d" : "#dc2626" }}>{r.status_code || "?"}</span>
                <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{fmtCost(r.cost_usd)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontSize: 11, color: "var(--text-muted)", border: "1px dashed var(--surface-border)", borderRadius: 8 }}>
            기록 없음
          </div>
        )
      )}

      <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
        💡 비용은 모델별 공개 단가(Gemini 3 Flash Image $0.039/장, Claude Sonnet $3/$15 per 1M 등)로 추정. 실제 청구액과 ±10% 차이 가능
      </div>
    </div>
  );
}

function CardShareLink({ slug, cardId }) {
  const [copied, setCopied] = React.useState(false);
  if (!slug || !cardId) return null;
  const copy = async () => {
    const url = `${location.origin}/p/${slug}/cards/${encodeURIComponent(cardId)}`;
    // v1.10.88 — HTTP 환경 호환 헬퍼 사용
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      window.prompt("이 링크를 복사하세요:", url);
    }
  };
  return (
    <button
      onClick={copy}
      title="이 카드 링크 복사"
      style={{
        padding: "2px 6px", borderRadius: 6,
        background: copied ? "rgba(34,197,94,0.12)" : "transparent",
        border: `1px solid ${copied ? "rgba(34,197,94,0.35)" : "var(--surface-border)"}`,
        color: copied ? "#15803d" : "var(--text-muted)",
        fontSize: 10, fontWeight: 700, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 3, lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 11 }}>🔗</span>
      {copied ? "복사됨" : "링크"}
    </button>
  );
}

function CardTitleEditor({ card, projectSlug, actor, disabled, onSaved }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(card.title || "");
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => { setValue(card.title || ""); }, [card.id, card.title]);
  React.useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = async () => {
    const next = value.trim();
    if (!next) { setValue(card.title || ""); setEditing(false); return; }
    if (next === card.title) { setEditing(false); return; }
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: next, actor }),
      });
      setEditing(false);
      await onSaved?.();
    } catch (e) { alert("제목 저장 실패: " + e.message); }
    finally { setSaving(false); }
  };

  if (editing && !disabled) {
    return (
      <input
        ref={inputRef}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          else if (e.key === "Escape") { setValue(card.title || ""); setEditing(false); }
        }}
        style={{
          fontSize: 18, fontWeight: 800, color: "var(--text-main)",
          padding: "2px 8px", borderRadius: 6,
          border: "1px solid var(--primary)", outline: "none",
          background: "#fff", width: "100%",
        }}
      />
    );
  }
  return (
    <div
      onClick={() => !disabled && setEditing(true)}
      title={disabled ? "잠긴 카드는 제목 수정 불가" : "클릭하여 제목 수정"}
      style={{
        fontSize: 18, fontWeight: 800, color: "var(--text-main)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        padding: "2px 8px", borderRadius: 6,
        cursor: disabled ? "not-allowed" : "text",
        border: "1px solid transparent",
      }}
      onMouseOver={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
      onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {card.title || <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>(제목 없음)</span>}
    </div>
  );
}

// 설명 인라인 에디터 — 클릭해서 textarea 로 전환, Ctrl/⌘+Enter 또는 blur 로 저장.
// CardTitleEditor 와 동일한 패턴 (card.id / card.updated_at 으로 local state sync).
function CardDescriptionEditor({ card, projectSlug, actor, disabled, onSaved }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(card.description || "");
  const [saving, setSaving] = React.useState(false);
  const areaRef = React.useRef(null);

  React.useEffect(() => {
    setValue(card.description || "");
  }, [card.id, card.updated_at]);
  React.useEffect(() => { if (editing) areaRef.current?.focus(); }, [editing]);

  const commit = async () => {
    const next = value;
    if (next === (card.description || "")) { setEditing(false); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: next || "", actor }),
      });
      if (!r.ok) throw new Error(`desc ${r.status}`);
      setEditing(false);
      await onSaved?.();
    } catch (e) {
      alert("설명 저장 실패: " + e.message);
    } finally { setSaving(false); }
  };

  if (editing && !disabled) {
    return (
      <textarea
        ref={areaRef}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if ((e.key === "Enter") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); }
          else if (e.key === "Escape") { setValue(card.description || ""); setEditing(false); }
        }}
        placeholder="설명을 입력하세요 — Ctrl/⌘+Enter 로 저장, Esc 취소"
        style={{
          width: "100%", minHeight: 100,
          padding: 14, borderRadius: 10,
          border: "1px solid var(--primary)",
          background: "#fff", outline: "none",
          fontSize: 13, color: "var(--text-main)", lineHeight: 1.8,
          fontFamily: "inherit", resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    );
  }
  return (
    <div
      onClick={() => !disabled && setEditing(true)}
      title={disabled ? "잠긴 카드는 설명 수정 불가" : "클릭해서 설명 편집"}
      style={{
        padding: 14, borderRadius: 10,
        background: "rgba(0,0,0,0.03)",
        fontSize: 13, color: "var(--text-lighter)", lineHeight: 1.8,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        minHeight: 80, cursor: disabled ? "not-allowed" : "text",
        border: "1px solid transparent", transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseOver={(e) => { if (!disabled) e.currentTarget.style.borderColor = "var(--surface-border)"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
    >
      {card.description || <span style={{ color: "var(--text-muted)" }}>(설명 없음 — 클릭해서 입력)</span>}
    </div>
  );
}

// 시안 이력 패널 — 그리드 / 나란히(2열) / 하나씩(carousel) 3가지 보기 모드 + 선정 + 외부 이미지 업로드.
// v1.10.22 — 복수 시안 비교 / 단일 확대 / ⭐ 선정 UI 한 곳에 모음.
function DesignsPanel({
  card, projectSlug, actor, disabled, statusKey,
  geminiApiKey, selectedModel, onOpenApiSettings,
  onGenerateProgress, onGenerateEnd,
  onOpenImage, onRefresh,
}) {
  const [viewMode, setViewMode] = React.useState("grid"); // "grid" | "compare" | "single"
  const [singleIdx, setSingleIdx] = React.useState(0);
  // v1.10.57 — CardActionPanel drafting 분기를 흡수: 생성 UI 상태.
  const [count, setCount] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(null);
  // v1.10.58 — 추가 프롬프트는 카드별로 저장된 last_extra_prompt 로 자동 복원.
  const [extraPrompt, setExtraPrompt] = React.useState(card.data?.last_extra_prompt || "");
  // v1.10.58 — 시안 정렬 (생성순 / 최신순 / 투표순). 카드 단위 메모리.
  const [sortMode, setSortMode] = React.useState("created");
  // 카드 변경 시 추가 프롬프트 / 정렬 초기화.
  React.useEffect(() => {
    setExtraPrompt(card.data?.last_extra_prompt || "");
    setSortMode("created");
  }, [card.id]);

  // v1.10.85 — 카드에 이미지가 1개만 있고 대표 미설정이면 자동 대표 등록.
  // designs (image url) + ref_images 합쳐 1개일 때만. 무한 루프 방지: thumbnail_url 변경 후 effect 재실행 시 조건 false.
  React.useEffect(() => {
    if (disabled || !projectSlug || !card?.id) return;
    if (card.thumbnail_url) return;
    const designUrls = Array.isArray(card.data?.designs)
      ? card.data.designs.map((d) => d?.imageUrl).filter(Boolean) : [];
    const refUrls = Array.isArray(card.data?.ref_images) ? card.data.ref_images.filter(Boolean) : [];
    const all = [...designUrls, ...refUrls];
    if (all.length !== 1) return;
    const url = all[0];
    fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ thumbnail_url: url, actor: actor || null }),
    }).then((r) => { if (r.ok) onRefresh?.(); }).catch(() => { /* ignore */ });
  }, [card?.id, card?.thumbnail_url, card?.data?.designs?.length, card?.data?.ref_images?.length, projectSlug, disabled]);

  const raw = Array.isArray(card.data?.designs) ? card.data.designs : [];
  const extras = [];
  if (raw.length === 0 && card.data?.image_url) {
    extras.push({ imageUrl: card.data.image_url, seed: card.data.seed, _legacy: true });
  }
  if (card.data?.concept_sheet_url
      && !raw.find((d) => d?.imageUrl === card.data.concept_sheet_url)
      && !extras.find((d) => d.imageUrl === card.data.concept_sheet_url)) {
    extras.push({ imageUrl: card.data.concept_sheet_url, seed: null, _sheet: true });
  }
  const displayDesigns = [...raw, ...extras];
  const selectedIdx = card.data?.selected_design;

  // singleIdx 가 범위 밖이면 0 으로 보정.
  React.useEffect(() => {
    if (singleIdx >= displayDesigns.length) setSingleIdx(Math.max(0, displayDesigns.length - 1));
  }, [displayDesigns.length, singleIdx]);

  const save = async (patchFields) => {
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: { ...(card.data || {}), ...patchFields }, actor }),
      });
      await onRefresh?.();
    } catch (e) { alert("저장 실패: " + e.message); }
  };

  // 이미지 파일/blob 을 시안 리스트에 추가하는 공용 함수 (v1.10.51).
  const ingestImage = (fileOrBlob) => {
    if (!fileOrBlob || disabled) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const url = await uploadDataUrl(ev.target.result);
        const existing = Array.isArray(card.data?.designs) ? card.data.designs : [];
        const newDesign = { seed: null, imageUrl: url, source: "upload", createdAt: new Date().toISOString() };
        await save({ designs: [...existing, newDesign] });
      } catch (err) { alert("이미지 추가 실패: " + err.message); }
    };
    reader.readAsDataURL(fileOrBlob);
  };
  const addExternalImage = ingestImage; // 기존 호출 호환.

  // 📋 붙여넣기 버튼 — Clipboard API 로 명시적으로 클립보드에서 이미지 읽음 (v1.10.51).
  const pasteFromClipboard = async () => {
    if (disabled) return;
    if (!navigator.clipboard?.read) {
      alert("이 브라우저는 Clipboard API 를 지원하지 않습니다. Ctrl+V 로 붙여넣거나 '＋ 이미지 추가' 버튼을 사용하세요.");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            ingestImage(blob);
            return;
          }
        }
      }
      alert("클립보드에 이미지가 없습니다.");
    } catch (e) {
      alert("클립보드 읽기 실패: " + e.message);
    }
  };

  // 패널 내부에 포커스/호버 중일 때 Ctrl+V 로 바로 붙여넣기 (v1.10.51).
  // PromptRefEditor 의 전역 paste 와 충돌 방지를 위해 '이 패널이 최근 상호작용 대상' 일 때만 처리.
  const panelRef = React.useRef(null);
  const [panelActive, setPanelActive] = React.useState(false);
  React.useEffect(() => {
    if (disabled) return;
    const onPaste = (e) => {
      if (!panelActive) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            ingestImage(f);
            e.preventDefault();
            // 한번만 처리하고 다른 paste 리스너(ref images) 로 전파 중단.
            e.stopImmediatePropagation?.();
            return;
          }
        }
      }
    };
    // capture 모드로 등록해 PromptRefEditor 의 paste 핸들러보다 먼저 동작.
    window.addEventListener("paste", onPaste, true);
    return () => window.removeEventListener("paste", onPaste, true);
  }, [disabled, panelActive, card.id]);

  const selectDesign = async (idx) => {
    if (disabled) return;
    const d = displayDesigns[idx];
    const patch = { selected_design: idx };
    // 업로드/AI 시안을 선정하면 카드 썸네일도 같이 갱신.
    // v1.10.58 — 단계 자동 이동(drafting → sheet) 제거. 별도 패널 하단 버튼으로 분리.
    const extraPatch = {};
    if (d?.imageUrl) extraPatch.thumbnail_url = d.imageUrl;
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), ...patch },
          ...extraPatch,
          actor,
        }),
      });
      await onRefresh?.();
    } catch (e) { alert("선정 실패: " + e.message); }
  };

  // v1.10.57 — 시안 삭제 (구 CardActionPanel.removeDesign 흡수).
  const removeDesign = async (idx) => {
    if (disabled) return;
    if (!confirm("이 시안을 삭제하시겠어요?")) return;
    const next = raw.filter((_, i) => i !== idx);
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: { ...(card.data || {}), designs: next }, actor }),
      });
      await onRefresh?.();
    } catch (e) { alert("삭제 실패: " + e.message); }
  };

  // v1.10.57 — 시안 생성 (구 CardActionPanel.doGenerate 흡수). drafting 단계에서만 노출.
  // v1.10.96 — 어셋 정보(prompt) 가 비어있고 이미지가 있으면 자동 분류부터 실행 후 그 결과로 생성.
  const doGenerate = async () => {
    if (!geminiApiKey) { onOpenApiSettings?.(); return; }
    setBusy(true);
    onGenerateProgress?.(card, 0, count);

    // 1) 자동 분류 선행 — prompt/description 모두 없고 이미지가 있으면.
    let workingCard = card;
    let basePrompt = card.data?.prompt || card.description || card.title;
    const refs = Array.isArray(card.data?.ref_images) ? card.data.ref_images : [];
    const imgSrc = refs[0] || card.thumbnail_url;
    const needsAutoClassify = !card.data?.prompt && !card.description && imgSrc;
    if (needsAutoClassify) {
      setProgress({ done: 0, total: count, label: "🤖 어셋 정보 자동 분류 중..." });
      try {
        const [clsResult, promptResult] = await Promise.allSettled([
          classifyCategoryWithGemini(geminiApiKey, imgSrc),
          generatePromptFromImage(geminiApiKey, imgSrc, card.title),
        ]);
        const clsR = clsResult.status === "fulfilled" ? clsResult.value : null;
        const p = promptResult.status === "fulfilled" ? promptResult.value : null;
        const patch = {};
        if (clsR?.category_id) patch.category = clsR.category_id;
        if (clsR?.style_id) patch.style_preset = clsR.style_id;
        if (clsR?.posmap_features) patch.posmap_features = clsR.posmap_features;
        if (clsR?.size_info) {
          patch.size_info = {
            width_cm: clsR.size_info.width_cm,
            depth_cm: clsR.size_info.depth_cm,
            height_cm: clsR.size_info.height_cm,
            source: "ai",
            confidence: clsR.size_info.confidence,
            reason: clsR.size_info.reason,
            updated_at: new Date().toISOString(),
          };
        }
        if (p) {
          patch.prompt = p;
          basePrompt = p;
        }
        if (Object.keys(patch).length > 0) {
          await save(patch);
          // save 가 onRefresh 호출하지만 workingCard 는 로컬에서 만들어 사용 (prompt 즉시 반영).
          workingCard = { ...card, data: { ...(card.data || {}), ...patch } };
        }
      } catch (e) {
        console.warn("[자동 분류 + 시안 생성] 자동 분류 실패, 기존 fallback 으로 진행:", e.message);
      }
    }

    // 2) prompt 검증
    if (!basePrompt) {
      setBusy(false);
      setProgress(null);
      onGenerateEnd?.(card);
      alert("시안 생성을 위해 프롬프트, 설명, 또는 이미지가 필요합니다.");
      return;
    }

    // 3) 시안 생성
    const extra = extraPrompt.trim();
    const prompt = extra ? `${basePrompt}. Additionally apply: ${extra}` : basePrompt;
    setProgress({ done: 0, total: count });
    try {
      const r = await generateCardVariants({
        card: workingCard, count, prompt, geminiApiKey, selectedModel,
        slug: projectSlug, actor,
        extraPromptToSave: extra,
        onProgress: (done, total) => {
          setProgress({ done, total });
          onGenerateProgress?.(card, done, total);
        },
      });
      if (r.added === 0) alert(`생성 실패 (시도 ${count}개, 실패 ${r.failed}개)`);
      await onRefresh?.();
    } catch (e) { alert("생성 실패: " + e.message); }
    finally {
      setBusy(false);
      setProgress(null);
      onGenerateEnd?.(card);
    }
  };

  // v1.10.58 — drafting → sheet 단계 이동 (선정된 시안으로 컨셉시트 만들기).
  const moveSelectedToSheet = async () => {
    if (disabled || selectedIdx == null) return;
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status_key: "sheet", actor }),
      });
      await onRefresh?.();
    } catch (e) { alert("단계 이동 실패: " + e.message); }
  };

  // 👍 시안 투표 (v1.10.41) — 프로필 기반 토글.
  // card.data.cardVotes = { [designIdx]: { [profileName]: true } } 로 저장.
  // (legacy job 시스템의 card.data.votes 와 이름 충돌 피하기 위해 cardVotes 사용)
  const rawCardVotes = card.data?.cardVotes;
  const cardVotes = (rawCardVotes && typeof rawCardVotes === "object" && !Array.isArray(rawCardVotes))
    ? rawCardVotes : {};
  const voteCount = (idx) => {
    const v = cardVotes[idx];
    return v && typeof v === "object" ? Object.keys(v).length : 0;
  };
  const iVoted = (idx) => {
    if (!actor) return false;
    const v = cardVotes[idx];
    return !!(v && typeof v === "object" && v[actor]);
  };
  const votersOf = (idx) => {
    const v = cardVotes[idx];
    return v && typeof v === "object" ? Object.keys(v) : [];
  };
  let voteLeaderIdx = null, voteLeaderCount = 0;
  displayDesigns.forEach((_, i) => {
    const c = voteCount(i);
    if (c > voteLeaderCount) { voteLeaderCount = c; voteLeaderIdx = i; }
  });
  const toggleVote = async (idx) => {
    if (disabled) return;
    if (!actor) { alert("프로필을 먼저 선택해 주세요 (헤더 우측)."); return; }
    const forIdx = (cardVotes[idx] && typeof cardVotes[idx] === "object") ? cardVotes[idx] : {};
    const hasMine = !!forIdx[actor];
    const nextForIdx = { ...forIdx };
    if (hasMine) delete nextForIdx[actor];
    else nextForIdx[actor] = true;
    const nextVotes = { ...cardVotes };
    if (Object.keys(nextForIdx).length === 0) delete nextVotes[idx];
    else nextVotes[idx] = nextForIdx;
    await save({ cardVotes: nextVotes });
  };
  const selectTopVote = async () => {
    if (voteLeaderIdx == null) return;
    await selectDesign(voteLeaderIdx);
  };

  // 보기 모드 토글 버튼.
  const ModeBtn = ({ mode, icon, title }) => (
    <button
      onClick={() => setViewMode(mode)}
      title={title}
      style={{
        padding: "3px 8px", borderRadius: 6, border: "none",
        background: viewMode === mode ? "#fff" : "transparent",
        color: viewMode === mode ? "var(--primary)" : "var(--text-muted)",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      }}
    >{icon}</button>
  );

  const renderBadge = (d, i) => d._sheet ? "📑 시트"
    : d._legacy ? "🗂 레거시"
    : d.source === "upload" ? `📤 #${i + 1}`
    : `#${i + 1}`;

  // v1.10.58 — 정렬 적용된 렌더 순서. 원본 인덱스(i) 보존이 핵심: voteCount, selectDesign,
  // removeDesign 모두 displayDesigns 의 원본 idx 를 받아야 함.
  const sortedRenderOrder = React.useMemo(() => {
    const base = displayDesigns.map((d, i) => ({ d, i }));
    if (sortMode === "newest") return base.slice().reverse();
    if (sortMode === "votes") {
      return base.slice().sort((a, b) => {
        const av = (cardVotes[a.i] && typeof cardVotes[a.i] === "object") ? Object.keys(cardVotes[a.i]).length : 0;
        const bv = (cardVotes[b.i] && typeof cardVotes[b.i] === "object") ? Object.keys(cardVotes[b.i]).length : 0;
        return bv - av;
      });
    }
    return base; // "created" — 원본 순
  }, [displayDesigns, sortMode, cardVotes]);

  // 하나의 시안 타일 — 선정 + 투표 UI (v1.10.41).
  // v1.10.82: 일반 함수로 사용 (JSX 컴포넌트 X). 부모 폴링(5초) 시 컴포넌트 reference 가
  // 새로 만들어져 React 가 unmount→remount 하면서 IMG 가 깜박이던 문제 해결. 이제 직접 호출
  // 결과 JSX 가 부모 트리에 그대로 mount → IMG element 재사용 → 깜박임 없음.
  const renderTile = (d, i, height) => {
    const isSelected = selectedIdx === i;
    const n = voteCount(i);
    const mine = iVoted(i);
    const isLeader = voteLeaderIdx === i && voteLeaderCount > 0;
    const voters = votersOf(i);
    return (
      <div key={i} style={{
        position: "relative", borderRadius: 8, overflow: "hidden",
        border: isSelected ? "2px solid #fbbf24"
          : isLeader ? "2px solid #22c55e"
          : "1px solid var(--surface-border)",
        background: "#000",
      }}>
        {d?.imageUrl ? (
          <img
            src={d.imageUrl}
            alt=""
            onClick={() => onOpenImage?.(d.imageUrl)}
            style={{ width: "100%", height, objectFit: "contain", display: "block", cursor: "zoom-in", background: "#000" }}
          />
        ) : (
          <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", fontSize: 11 }}>실패</div>
        )}
        <div style={{
          position: "absolute", top: 4, left: 4,
          padding: "1px 6px", borderRadius: 4,
          background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 9, fontFamily: "monospace",
          pointerEvents: "none",
        }}>{renderBadge(d, i)}</div>
        {isSelected ? (
          <div style={{
            position: "absolute", top: 4, right: 4,
            padding: "1px 6px", borderRadius: 4,
            background: "#fbbf24", color: "#000", fontSize: 10, fontWeight: 800,
          }}>⭐ 선정</div>
        ) : !disabled && d?.imageUrl && (
          <button
            onClick={() => selectDesign(i)}
            title="이 시안을 대표로 선정 (카드 썸네일도 함께 갱신)"
            style={{
              position: "absolute", top: 4, right: 4,
              padding: "2px 8px", borderRadius: 4,
              background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.12)",
              color: "var(--text-main)", fontSize: 10, fontWeight: 700, cursor: "pointer",
            }}
          >☆ 선정</button>
        )}
        {/* 👍 투표 버튼 + 카운트 — 좌측 하단 (v1.10.41) */}
        {d?.imageUrl && !disabled && (
          <button
            onClick={() => toggleVote(i)}
            title={voters.length > 0 ? `투표: ${voters.join(", ")}` : (actor ? "투표하기" : "프로필 선택 후 투표 가능")}
            style={{
              position: "absolute", bottom: 6, left: 6,
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 14,
              background: mine ? "var(--primary)" : "rgba(0,0,0,0.72)",
              border: "none",
              color: "#fff", fontSize: 11, fontWeight: 700,
              cursor: actor ? "pointer" : "not-allowed",
              opacity: actor ? 1 : 0.6,
            }}
          >
            <span>👍</span>
            <span>{n}</span>
            {isLeader && <span style={{ fontSize: 10 }}>🏆</span>}
          </button>
        )}
        {/* 🗑 삭제 — 우측 하단. v1.10.81: imageUrl 없는(생성 실패) 시안도 삭제 가능. */}
        {!disabled && !d._sheet && !d._legacy && i < raw.length && (
          <button
            onClick={() => removeDesign(i)}
            title={d?.imageUrl ? "이 시안 삭제" : "실패한 시안 삭제"}
            style={{
              position: "absolute", bottom: 6, right: 6,
              padding: "3px 9px", borderRadius: 14,
              background: "rgba(239,68,68,0.85)", border: "none",
              color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >🗑</button>
        )}
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      onMouseEnter={() => setPanelActive(true)}
      onMouseLeave={() => setPanelActive(false)}
      onMouseDown={() => setPanelActive(true)}
      style={{
        padding: 14, borderRadius: 12,
        background: "rgba(0,0,0,0.02)",
        border: `1px solid ${panelActive ? "rgba(7,110,232,0.3)" : "var(--surface-border)"}`,
        outline: "none",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
          🎨 시안 ({displayDesigns.length}개)
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {panelActive ? "📋 Ctrl+V 로 붙여넣기 가능" : "AI 생성 + 외부 업로드 · ☆ 선정 / 👍 투표 / 🗑 삭제"}
        </div>
        {voteLeaderIdx != null && !disabled && selectedIdx !== voteLeaderIdx && (
          <button
            onClick={selectTopVote}
            title={`투표 1등 (#${voteLeaderIdx + 1}, ${voteLeaderCount}표) 을 대표 시안으로 선정`}
            style={{
              padding: "4px 10px", borderRadius: 14,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)",
              color: "#15803d", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >🏆 투표 1등 선정 ({voteLeaderCount}표)</button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {/* v1.10.58 — 시안 정렬 (생성순/최신순/투표순) */}
          {displayDesigns.length > 1 && (
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              title="시안 정렬"
              style={{
                padding: "3px 8px", borderRadius: 6,
                border: "1px solid var(--surface-border)", background: "#fff",
                color: "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              <option value="created">📋 생성순</option>
              <option value="newest">🆕 최신순</option>
              <option value="votes">👍 투표순</option>
            </select>
          )}
          {displayDesigns.length > 0 && (
            <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 7, background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)" }}>
              <ModeBtn mode="grid" icon="🔲" title="그리드" />
              <ModeBtn mode="compare" icon="⬛⬛" title="나란히 (2열)" />
              <ModeBtn mode="single" icon="🖼" title="하나씩" />
            </div>
          )}
          {!disabled && (
            <>
              <button
                onClick={pasteFromClipboard}
                title="클립보드의 이미지를 시안으로 붙여넣기"
                style={{
                  padding: "4px 10px", borderRadius: 6,
                  background: "rgba(7,110,232,0.08)", border: "1px solid rgba(7,110,232,0.25)",
                  color: "var(--primary)", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}
              >📋 붙여넣기</button>
              <label
                title="다른 곳에서 만든 이미지 파일을 시안으로 추가"
                style={{
                  padding: "4px 10px", borderRadius: 6,
                  background: "rgba(7,110,232,0.08)", border: "1px solid rgba(7,110,232,0.25)",
                  color: "var(--primary)", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}
              >
                ＋ 이미지 추가
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { addExternalImage(e.target.files?.[0]); e.target.value = ""; }}
                  style={{ display: "none" }}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* 시안 생성 — drafting / wishlist 단계 모두 노출 (v1.10.84: 위시 단계에서도 직접 생성 가능).
          위시 카드도 description/title 만 있으면 doGenerate 가 그것을 prompt fallback 으로 사용. */}
      {(statusKey === "drafting" || statusKey === "wishlist") && !disabled && (
        <div style={{
          marginBottom: 10, padding: 10, borderRadius: 10,
          background: "linear-gradient(135deg, rgba(7,110,232,0.05), rgba(139,92,246,0.03))",
          border: "1px solid rgba(7,110,232,0.18)",
        }}>
          <input
            type="text"
            value={extraPrompt}
            disabled={busy}
            onChange={(e) => setExtraPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !busy) doGenerate(); }}
            placeholder="추가 프롬프트 (선택) — 예: 더 단순하게, 파스텔 톤, 다리 없애기"
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 8,
              border: "1px solid var(--surface-border)",
              background: busy ? "rgba(0,0,0,0.03)" : "#fff",
              fontSize: 12, color: "var(--text-main)", outline: "none",
              marginBottom: 6, boxSizing: "border-box",
            }}
          />
          {extraPrompt.trim() && (() => {
            const base = card.data?.prompt || card.description || card.title || "";
            return (
              <div style={{
                marginBottom: 8, padding: "6px 10px", borderRadius: 6,
                background: "rgba(0,0,0,0.03)", border: "1px dashed var(--surface-border)",
                fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>→ 최종: </span>
                {`${base}. Additionally apply: ${extraPrompt.trim()}`}
              </div>
            );
          })()}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {[1, 2, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                disabled={busy}
                style={{
                  padding: "5px 11px", borderRadius: 7,
                  background: count === n ? "var(--primary)" : "rgba(0,0,0,0.04)",
                  border: count === n ? "none" : "1px solid var(--surface-border)",
                  color: count === n ? "#fff" : "var(--text-muted)",
                  fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer",
                }}
              >{n}</button>
            ))}
            <button
              onClick={doGenerate}
              disabled={busy}
              style={{
                marginLeft: "auto", padding: "7px 14px", borderRadius: 9,
                background: busy ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, var(--primary), var(--secondary))",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {busy
                ? (progress?.label
                    ? progress.label
                    : `생성 중… ${progress ? `(${progress.done}/${progress.total})` : ""}`)
                : `🎨 ${count}개 생성`}
            </button>
          </div>
        </div>
      )}

      {displayDesigns.length === 0 ? (
        <div style={{
          padding: 20, borderRadius: 8, textAlign: "center",
          background: "rgba(0,0,0,0.02)", border: "1px dashed var(--surface-border)",
          fontSize: 12, color: "var(--text-muted)",
        }}>
          시안이 아직 없습니다. 위의 시안 생성 버튼 또는 ＋ 이미지 추가로 시작하세요.
        </div>
      ) : viewMode === "grid" ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
        }}>
          {sortedRenderOrder.map(({ d, i }) => renderTile(d, i, 150))}
        </div>
      ) : viewMode === "compare" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {sortedRenderOrder.map(({ d, i }) => renderTile(d, i, 280))}
        </div>
      ) : (
        // single — carousel
        <div>
          {(() => {
            const idx = Math.min(singleIdx, displayDesigns.length - 1);
            const d = displayDesigns[idx];
            return (
              <>
                <div style={{ position: "relative" }}>
                  {renderTile(d, idx, 420)}
                  {displayDesigns.length > 1 && (
                    <>
                      <button
                        onClick={() => setSingleIdx((idx - 1 + displayDesigns.length) % displayDesigns.length)}
                        title="이전 시안"
                        style={{
                          position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)",
                          width: 36, height: 36, borderRadius: 18,
                          background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                          fontSize: 18, cursor: "pointer",
                        }}
                      >‹</button>
                      <button
                        onClick={() => setSingleIdx((idx + 1) % displayDesigns.length)}
                        title="다음 시안"
                        style={{
                          position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)",
                          width: 36, height: 36, borderRadius: 18,
                          background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                          fontSize: 18, cursor: "pointer",
                        }}
                      >›</button>
                    </>
                  )}
                </div>
                <div style={{
                  marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center",
                }}>
                  {displayDesigns.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSingleIdx(i)}
                      title={`#${i + 1}`}
                      style={{
                        width: 18, height: 18, borderRadius: 9,
                        border: "none",
                        background: i === idx ? "var(--primary)" : "rgba(0,0,0,0.15)",
                        color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
                      }}
                    >{i + 1}</button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* v1.10.58 — drafting 에서 ☆ 선정은 대표만 변경, 단계 이동은 별도 버튼 */}
      {statusKey === "drafting" && !disabled && selectedIdx != null && displayDesigns[selectedIdx]?.imageUrl && (
        <button
          onClick={moveSelectedToSheet}
          style={{
            marginTop: 12, width: "100%", padding: "10px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 10px rgba(7,110,232,0.2)",
          }}
        >✨ 선정 시안 (#{selectedIdx + 1}) 으로 시트 단계로 이동 →</button>
      )}
    </div>
  );
}

// 상세 모달 댓글 한 줄 — 본인 댓글은 인라인 편집 + 삭제 가능.
// 편집 시 textarea, Ctrl/⌘+Enter 저장, Esc 취소, blur 자동 저장.
function CommentRow({ comment, projectSlug, cardId, actorName, profileByName, onChanged }) {
  // 본인 확인: 작성자 이름이 같으면 본인. null === null (양쪽 다 익명) 도 본인으로 인정.
  const mine = (comment.actor || null) === (actorName || null);
  const authorProfile = comment.actor ? profileByName?.get?.(comment.actor) : null;
  const authorIcon = authorProfile?.icon || (comment.actor ? "👤" : "❓");
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(comment.body || "");
  const [saving, setSaving] = React.useState(false);
  const areaRef = React.useRef(null);
  React.useEffect(() => { setValue(comment.body || ""); }, [comment.id, comment.body]);
  React.useEffect(() => { if (editing) { areaRef.current?.focus(); areaRef.current?.select(); } }, [editing]);

  const commit = async () => {
    const next = value.trim();
    if (!next) { setValue(comment.body || ""); setEditing(false); return; }
    if (next === comment.body) { setEditing(false); return; }
    setSaving(true);
    try {
      await patchCardComment(projectSlug, cardId, comment.id, next, actorName);
      setEditing(false);
      await onChanged?.();
    } catch (e) { alert("댓글 수정 실패: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      padding: "8px 12px", borderRadius: 10,
      background: "rgba(0,0,0,0.03)", fontSize: 13,
      position: "relative",
    }}>
      <div style={{
        fontSize: 11, color: "var(--text-muted)", marginBottom: 4,
        paddingRight: mine ? 46 : 0,
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <span style={{ fontSize: 13 }}>{authorIcon}</span>
        <span style={{ fontWeight: 600, color: "var(--text-lighter)" }}>
          {comment.actor || "익명"}
        </span>
        <span>· {formatLocalTime(comment.created_at, "full")}</span>
      </div>
      {editing && mine ? (
        <textarea
          ref={areaRef}
          value={value}
          disabled={saving}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if ((e.key === "Enter") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); }
            else if (e.key === "Escape") { setValue(comment.body || ""); setEditing(false); }
          }}
          placeholder="Ctrl/⌘+Enter 저장, Esc 취소"
          style={{
            width: "100%", minHeight: 60,
            padding: "6px 8px", borderRadius: 8,
            border: "1px solid var(--primary)", outline: "none",
            fontSize: 13, color: "var(--text-main)", lineHeight: 1.6,
            fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
            background: "#fff",
          }}
        />
      ) : (
        <div
          onClick={() => { if (mine && !editing) setEditing(true); }}
          title={mine ? "클릭해서 수정" : undefined}
          style={{
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            cursor: mine ? "text" : "default",
          }}
        >{comment.body}</div>
      )}
      {mine && !editing && (
        <div style={{
          position: "absolute", top: 4, right: 4,
          display: "flex", gap: 2,
        }}>
          <button
            onClick={() => setEditing(true)}
            title="내 댓글 수정"
            style={{
              width: 18, height: 18, borderRadius: 9,
              border: "none", background: "transparent",
              color: "var(--text-muted)", fontSize: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
            }}
          >✏️</button>
          <button
            onClick={async () => {
              if (!confirm("이 댓글을 삭제할까요?")) return;
              try {
                await deleteCardComment(projectSlug, cardId, comment.id, actorName);
                await onChanged?.();
              } catch (e) { alert("댓글 삭제 실패: " + e.message); }
            }}
            title="내 댓글 삭제"
            style={{
              width: 18, height: 18, borderRadius: 9,
              border: "none", background: "transparent",
              color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

// 카드 상세 모달의 댓글 입력창. ref 대신 local state 로 간단히.
function CardCommentInput({ onSubmit, disabled, currentProfile }) {
  const [val, setVal] = React.useState("");
  const icon = currentProfile?.icon || "👤";
  const tooltip = currentProfile?.name || "프로필 미선택 — 헤더에서 선택하세요";
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {/* 현재 작성자 아이콘 — 마우스 올리면 이름 tooltip (v1.10.14) */}
      <div
        title={tooltip}
        style={{
          width: 32, height: 32, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: currentProfile ? "rgba(7,110,232,0.08)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${currentProfile ? "rgba(7,110,232,0.2)" : "var(--surface-border)"}`,
          fontSize: 16, cursor: "help", flexShrink: 0,
          opacity: currentProfile ? 1 : 0.55,
        }}
      >{icon}</div>
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            onSubmit(val);
            setVal("");
          }
        }}
        disabled={disabled}
        placeholder={disabled ? "완료된 카드는 댓글 불가" : "댓글 작성 (Enter)"}
        style={{
          flex: 1, padding: "8px 12px", borderRadius: 8,
          border: "1px solid var(--surface-border)",
          background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
          fontSize: 13, outline: "none",
          color: disabled ? "var(--text-muted)" : "var(--text-main)",
        }}
      />
      <button
        onClick={() => { if (val.trim()) { onSubmit(val); setVal(""); } }}
        disabled={disabled || !val.trim()}
        style={{
          padding: "8px 14px", borderRadius: 8,
          background: (!disabled && val.trim()) ? "var(--primary)" : "rgba(0,0,0,0.08)",
          border: "none",
          color: (!disabled && val.trim()) ? "#fff" : "var(--text-muted)",
          fontSize: 12, fontWeight: 700, cursor: (!disabled && val.trim()) ? "pointer" : "not-allowed",
        }}
      >보내기</button>
    </div>
  );
}

// Each in-flight concept generation is a "job". The app keeps an array of
// jobs so the user can spawn a new one while previous ones are still
// running (image generation, voting, etc.). One job is the "active" job
// — its state drives the main content area.
function createBlankJob(id) {
  return {
    id,
    createdAt: new Date().toISOString(),
    step: 0,
    loading: false,
    loadingMsg: "",
    loadingProgress: 0,
    category: null,
    topTab: "furniture",
    selectedRoom: "침실",
    stylePreset: null,
    prompt: "",
    refImages: [],
    variantCount: 1,      // 한 번에 생성할 시안 개수 (1 / 2 / 4 / 8), 기본 1
    designs: [],
    enhancedPrompt: "",
    selectedDesign: null,
    feedback: "",
    votes: {},
    voters: [],
    currentVoter: "",
    currentVotes: [],
    conceptSheet: null,
    multiViewImages: {},
  };
}

// Gemini 레이트 리밋을 피하려 병렬 호출 수를 제한한다.
// 청크 단위로 실행하고 각 호출이 끝나면 onProgress 콜백을 쏜다.
async function runWithConcurrencyLimit(tasks, limit, onProgress) {
  const results = new Array(tasks.length);
  let nextIndex = 0;
  let completed = 0;

  const worker = async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= tasks.length) return;
      try {
        results[i] = await tasks[i]();
      } catch (err) {
        results[i] = { __error: err };
      }
      completed++;
      onProgress?.(completed, tasks.length);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  );
  return results;
}

const JOB_STEP_LABELS = ["입력", "시안 생성중", "투표", "선정", "컨셉시트", "전송 준비", "전송 완료"];

// 워크플로우 탭(시안 생성/투표/컨셉시트) 의 카드 허브에서 사용하는 job 카드.
// 큐 패널 카드(JobQueueCard)는 작고 컴팩트한 사이드뷰용이고,
// 이것은 메인 영역의 그리드용 큰 카드.
// 새 카드 시스템용 허브 카드 (위시·completed 탭의 카드와 달리 워크플로우
// 탭에서 쓰는 컴팩트 그리드 카드. 클릭 시 통합 카드 모달 오픈).
function CardHubCard({ card, tabId, onClick, scale = 1 }) {
  const data = card.data || {};
  const designs = Array.isArray(data.designs) ? data.designs : [];
  const selectedIdx = typeof data.selected_design === "number" ? data.selected_design : null;
  const selected = selectedIdx != null ? designs[selectedIdx] : null;

  // 썸네일 우선순위 (v1.10.97 변경):
  // 1) 사용자가 ⭐ 대표 버튼으로 명시 설정한 card.thumbnail_url 이 최우선
  //    (참조 이미지를 대표로 지정해도 카드에 반영되도록).
  // 2) 명시 설정 없으면 시안 1개일 때 그 한 장을 자동으로.
  // 3) 없으면 탭별 fallback.
  const singleImage = designs.length === 1 && designs[0]?.imageUrl ? designs[0].imageUrl : null;
  let thumb = card.thumbnail_url || singleImage;
  if (!thumb) {
    if (tabId === "sheet" || tabId === "completed") {
      thumb = data.concept_sheet_url || selected?.imageUrl;
    } else if (tabId !== "wishlist") {
      thumb = selected?.imageUrl || designs.find((d) => d?.imageUrl)?.imageUrl;
    }
  }

  const catInfo = data.category ? FURNITURE_CATEGORIES.find((c) => c.id === data.category) : null;
  const styleInfo = data.style_preset ? STYLE_PRESETS.find((s) => s.id === data.style_preset) : null;

  return (
    <div
      onClick={onClick}
      className="hover-lift"
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        border: "1px solid var(--surface-border)",
        background: "var(--surface-color)",
        transition: "all 0.2s",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{
        width: "100%", height: Math.round(240 * scale), position: "relative",
        background: thumb ? "#000" : "rgba(0,0,0,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: Math.round(72 * scale), opacity: 0.5 }}>{catInfo?.icon || "📇"}</span>
        )}
        {/* v1.10.72 — stage badge (좌상단). progress 탭에서 단계 식별에 핵심. */}
        {(() => {
          const stage = computeStage(card);
          const opt = STAGE_OPTIONS.find((o) => o.key === stage);
          if (!opt) return null;
          return (
            <div style={{
              position: "absolute", top: 10, left: 10,
              padding: "3px 10px", borderRadius: 10,
              background: "rgba(124,58,237,0.92)", color: "#fff",
              fontSize: Math.round(11 * Math.sqrt(scale)), fontWeight: 800,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}>{opt.label}</div>
          );
        })()}
        {designs.length > 0 && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "3px 10px", borderRadius: 10,
            background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: Math.round(11 * Math.sqrt(scale)), fontWeight: 700,
          }}>시안 {designs.length}</div>
        )}
      </div>
      <div style={{ padding: `${Math.round(10 * scale)}px ${Math.round(14 * scale)}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: Math.round(14 * Math.sqrt(scale)), fontWeight: 800, color: "var(--text-main)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0,
          }}>
            {card.title}
          </span>
        </div>
        {(card.description || styleInfo) && (
          <div style={{
            fontSize: Math.round(11 * Math.sqrt(scale)), color: "var(--text-muted)", lineHeight: 1.4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {styleInfo ? `${styleInfo.label} · ` : ""}{card.description || ""}
          </div>
        )}
        {(tabId === "sheet" || tabId === "completed") && data.concept_sheet_url && (
          <div style={{ marginTop: 4, fontSize: Math.round(10 * Math.sqrt(scale)), color: "#22c55e", fontWeight: 600 }}>
            ✓ 시트
          </div>
        )}
        {tabId === "completed" && card.confirmed_at && (
          <div style={{ marginTop: 2, fontSize: Math.round(10 * Math.sqrt(scale)), color: "var(--text-muted)" }}>
            완료 {formatLocalTime(card.confirmed_at, "date")}
          </div>
        )}
        {tabId === "wishlist" && (
          <div style={{ marginTop: 2, fontSize: Math.round(10 * Math.sqrt(scale)), color: "var(--text-muted)" }}>
            {card.created_at ? formatLocalTime(card.created_at, "date") : "-"}
          </div>
        )}
        {tabId === "vote" && (
          <div style={{ marginTop: 4, fontSize: Math.round(10 * Math.sqrt(scale)), color: "var(--text-muted)" }}>
            시안 {designs.length}개 · 투표자 {(data.voters || []).length}명
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowJobCard({ job, active, onSelect, tabId }) {
  const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === job.category);
  const icon = catInfo?.icon || "🆕";
  const label = catInfo?.label || "새 작업";
  const promptSnippet = job.prompt
    ? (job.prompt.length > 70 ? job.prompt.slice(0, 70) + "…" : job.prompt)
    : "입력 대기 중";

  const designs = Array.isArray(job.designs) ? job.designs : [];
  const firstImage = designs.find((d) => d && d.imageUrl)?.imageUrl || null;
  const selectedDesign = (job.selectedDesign != null && designs[job.selectedDesign]) || null;

  // 탭별로 카드의 주 썸네일을 다르게.
  let thumb = null;
  if (tabId === "create") thumb = firstImage;
  else if (tabId === "vote") thumb = firstImage;
  else if (tabId === "sheet") thumb = job.conceptSheet || selectedDesign?.imageUrl || firstImage;

  const stepLabel = JOB_STEP_LABELS[job.step] || "";
  const voterCount = Array.isArray(job.voters) ? job.voters.length : 0;
  const voteCounts = (job.votes && typeof job.votes === "object") ? Object.values(job.votes).reduce((a, b) => a + (b || 0), 0) : 0;

  return (
    <div
      onClick={onSelect}
      className="hover-lift"
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        border: active ? "2px solid var(--primary)" : "1px solid var(--surface-border)",
        background: "var(--surface-color)",
        transition: "all 0.2s",
        boxShadow: active ? "0 6px 24px var(--primary-glow)" : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{
        width: "100%", height: 180, position: "relative",
        background: thumb ? "#000" : "rgba(0,0,0,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 56, opacity: 0.5 }}>{icon}</span>
        )}
        {designs.length > 1 && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "3px 10px", borderRadius: 10,
            background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 700,
          }}>시안 {designs.length}</div>
        )}
        {active && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            padding: "3px 10px", borderRadius: 10,
            background: "var(--primary)", color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.05em",
          }}>선택됨</div>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)" }}>{icon} {label}</span>
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 700,
            color: "var(--primary)", background: "rgba(7,110,232,0.1)",
            padding: "2px 8px", borderRadius: 7,
          }}>{stepLabel}</span>
        </div>
        <div style={{
          fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", minHeight: 36,
        }}>{promptSnippet}</div>
        {tabId === "vote" && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>투표자 {voterCount}명</span>
            <span>총 득표 {voteCounts}</span>
          </div>
        )}
        {tabId === "sheet" && selectedDesign && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
            시안 {(job.selectedDesign ?? 0) + 1} 선정{job.conceptSheet ? " · 시트 생성됨" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function JobQueueCard({ job, active, onSelect, onRemove }) {
  const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === job.category);
  const title = catInfo ? `${catInfo.icon} ${catInfo.label}` : "🆕 새 시안 작업";
  const subtitle = job.prompt
    ? (job.prompt.length > 42 ? job.prompt.substring(0, 42) + "…" : job.prompt)
    : "어셋 정보 입력 중";
  const stepLabel = job.loading
    ? (job.loadingMsg || "진행 중…")
    : (JOB_STEP_LABELS[job.step] || "");
  const progress = job.loading ? job.loadingProgress : Math.min(100, (job.step / 5) * 100);

  return (
    <div
      onClick={onSelect}
      className="hover-lift"
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        cursor: "pointer",
        background: active ? "rgba(7,110,232,0.10)" : "rgba(0,0,0,0.02)",
        border: active ? "1px solid rgba(7,110,232,0.35)" : "1px solid var(--surface-border)",
        marginBottom: 8,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "var(--text-main)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{title}</div>
          <div style={{
            fontSize: 11, color: "var(--text-muted)", marginTop: 3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{subtitle}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="작업 제거"
          style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
            color: "var(--text-muted)", fontSize: 11, cursor: "pointer", lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >✕</button>
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          flex: 1, height: 5, borderRadius: 3,
          background: "rgba(0,0,0,0.06)", overflow: "hidden",
        }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: job.loading
              ? "linear-gradient(90deg, var(--primary), var(--accent))"
              : "var(--accent)",
            transition: "width 0.3s",
            boxShadow: job.loading ? "0 0 8px rgba(152,166,255,0.6)" : "none",
          }} />
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, minWidth: 72, textAlign: "right" }}>
          {stepLabel}
        </div>
      </div>
    </div>
  );
}

// 프로필 아이콘 후보 — 피부색 / 헤어색 / 헤어 스타일 / 안경 조합으로 구분감 강화 (v1.10.10).
// 일부 플랫폼은 ZWJ 시퀀스 렌더링이 제한될 수 있음 (Windows 11 기본 이모지 폰트는 지원).
const PROFILE_ICON_CHOICES = [
  // 피부색 3단 × 남녀 (기본 헤어)
  "👨🏻","👨🏽","👨🏿",
  "👩🏻","👩🏽","👩🏿",
  // 빨강 머리
  "👨🏻‍🦰","👩🏼‍🦰",
  // 곱슬 머리
  "👨🏼‍🦱","👩🏾‍🦱",
  // 흰머리 / 탈모
  "👨🏻‍🦳","👩🏿‍🦳","👨🏾‍🦲",
  // 수염
  "🧔🏻","🧔🏿",
  // 금발
  "👱🏻‍♀️","👱🏿‍♂️",
  // 안경 (nerd / monocle)
  "🤓","🧐",
  // 어르신
  "👴🏼","👵🏾",
];

// 헤더 프로필 선택기 — 현재 프로필 표시 + 드롭다운으로 변경 / ＋ 새 프로필 / ✏️ 편집.
function ProfilePicker({ profiles, current, onChange, onCreate, onEdit }) {
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null); // 편집 중인 프로필 id
  const [newName, setNewName] = React.useState("");
  const [newIcon, setNewIcon] = React.useState(PROFILE_ICON_CHOICES[0]);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setCreating(false); setEditingId(null); } };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const submitNew = async () => {
    const n = newName.trim();
    if (!n) return;
    try {
      const p = await onCreate(n, newIcon);
      if (p) { onChange(p); setOpen(false); setCreating(false); setNewName(""); }
    } catch (e) { alert("프로필 생성 실패: " + e.message); }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setNewName(p.name);
    setNewIcon(p.icon);
    setCreating(false);
  };
  const submitEdit = async () => {
    const n = newName.trim();
    if (!n || !editingId) return;
    try {
      await onEdit?.(editingId, n, newIcon);
      setEditingId(null);
      setNewName("");
    } catch (e) { alert("프로필 수정 실패: " + e.message); }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={current ? `현재 프로필: ${current.name}` : "프로필 선택 (댓글/편집 작성자 구분)"}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px 6px 8px", borderRadius: 999,
          background: current ? "rgba(7,110,232,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${current ? "rgba(7,110,232,0.25)" : "rgba(239,68,68,0.3)"}`,
          color: current ? "var(--primary)" : "#dc2626",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 16 }}>{current?.icon || "👤"}</span>
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.name || "프로필 선택"}
        </span>
        <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 260,
          background: "#fff", border: "1px solid var(--surface-border)",
          borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
          zIndex: 200, padding: 6,
        }}>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {profiles.length === 0 && !creating && (
              <div style={{ padding: "14px 10px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                아직 프로필이 없습니다.<br />＋ 로 추가하세요.
              </div>
            )}
            {profiles.map((p) => {
              const active = current?.id === p.id;
              if (editingId === p.id) {
                return (
                  <div key={p.id} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(7,110,232,0.06)", marginBottom: 4 }}>
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); submitEdit(); }
                        else if (e.key === "Escape") { setEditingId(null); setNewName(""); }
                      }}
                      placeholder="이름"
                      style={{
                        width: "100%", padding: "5px 7px", borderRadius: 6,
                        border: "1px solid var(--surface-border)", outline: "none",
                        fontSize: 12, boxSizing: "border-box", marginBottom: 6,
                      }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
                      {PROFILE_ICON_CHOICES.map((ic) => (
                        <button
                          key={ic}
                          onClick={() => setNewIcon(ic)}
                          style={{
                            aspectRatio: "1/1", padding: 0,
                            background: newIcon === ic ? "rgba(7,110,232,0.14)" : "transparent",
                            border: `1px solid ${newIcon === ic ? "var(--primary)" : "var(--surface-border)"}`,
                            borderRadius: 5, cursor: "pointer", fontSize: 14,
                          }}
                        >{ic}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={submitEdit}
                        disabled={!newName.trim()}
                        style={{
                          flex: 1, padding: "4px 0", borderRadius: 5, border: "none",
                          background: newName.trim() ? "var(--primary)" : "rgba(0,0,0,0.08)",
                          color: newName.trim() ? "#fff" : "var(--text-muted)",
                          fontSize: 11, fontWeight: 700, cursor: newName.trim() ? "pointer" : "not-allowed",
                        }}
                      >저장</button>
                      <button
                        onClick={() => { setEditingId(null); setNewName(""); }}
                        style={{
                          padding: "4px 10px", borderRadius: 5,
                          background: "transparent", border: "1px solid var(--surface-border)",
                          color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                        }}
                      >취소</button>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 6px 7px 10px", borderRadius: 8,
                    background: active ? "rgba(7,110,232,0.1)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <div
                    onClick={() => { onChange(p); setOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer", minWidth: 0 }}
                  >
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 600, flex: 1,
                      color: active ? "var(--primary)" : "var(--text-main)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{p.name}</span>
                    {active && <span style={{ fontSize: 11, color: "var(--primary)" }}>✓</span>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                    title={`'${p.name}' 수정`}
                    style={{
                      width: 22, height: 22, borderRadius: 11,
                      background: "transparent", border: "none",
                      color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >✏️</button>
                </div>
              );
            })}
          </div>
          {creating ? (
            <div style={{ padding: 10, borderTop: "1px solid var(--surface-border)", marginTop: 4 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>이름</div>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); submitNew(); }
                  else if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                placeholder="예) 김기획"
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 6,
                  border: "1px solid var(--surface-border)", outline: "none",
                  fontSize: 13, boxSizing: "border-box", marginBottom: 8,
                }}
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>아이콘</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 10 }}>
                {PROFILE_ICON_CHOICES.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setNewIcon(ic)}
                    style={{
                      aspectRatio: "1/1", padding: 0,
                      background: newIcon === ic ? "rgba(7,110,232,0.14)" : "transparent",
                      border: `1px solid ${newIcon === ic ? "var(--primary)" : "var(--surface-border)"}`,
                      borderRadius: 6, cursor: "pointer", fontSize: 16,
                    }}
                  >{ic}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={submitNew}
                  disabled={!newName.trim()}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: 6, border: "none",
                    background: newName.trim() ? "var(--primary)" : "rgba(0,0,0,0.08)",
                    color: newName.trim() ? "#fff" : "var(--text-muted)",
                    fontSize: 12, fontWeight: 700, cursor: newName.trim() ? "pointer" : "not-allowed",
                  }}
                >추가</button>
                <button
                  onClick={() => { setCreating(false); setNewName(""); }}
                  style={{
                    padding: "6px 12px", borderRadius: 6,
                    background: "transparent", border: "1px solid var(--surface-border)",
                    color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
                  }}
                >취소</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                width: "100%", padding: "8px 10px", marginTop: 4, borderRadius: 8,
                background: "transparent", border: "1px dashed var(--surface-border)",
                color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                textAlign: "left",
              }}
            >＋ 새 프로필</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main App ───
export default function InZOIConceptTool() {
  // ─── Per-job state ──────────────────────────────────────────────
  // Each in-flight concept generation is a job. All the step-specific
  // state (step, category, prompt, designs, voting, conceptSheet, ...)
  // lives inside the job object so multiple jobs can coexist.
  // The setter names below (setStep, setCategory, ...) are kept
  // backwards-compatible — they route to the ACTIVE job, so the JSX
  // in the rest of this file does not need to change.
  const [jobs, setJobs] = useState(() => [createBlankJob(Date.now())]);
  const [activeJobId, setActiveJobId] = useState(() => jobs[0].id);

  const activeJob = jobs.find((j) => j.id === activeJobId) || jobs[0] || createBlankJob(0);

  const updateJob = useCallback((jobId, patch) => {
    setJobs((prev) => prev.map((j) => {
      if (j.id !== jobId) return j;
      const p = typeof patch === "function" ? patch(j) : patch;
      return { ...j, ...p };
    }));
  }, []);

  // Setter factory — targets the active job. Supports function form.
  const mk = (field) => (v) => setJobs((prev) => prev.map((j) => {
    if (j.id !== activeJobId) return j;
    return { ...j, [field]: typeof v === "function" ? v(j[field]) : v };
  }));

  const setStep = mk("step");
  const setLoading = mk("loading");
  const setLoadingMsg = mk("loadingMsg");
  const setLoadingProgress = mk("loadingProgress");
  const setCategory = mk("category");
  const setTopTab = mk("topTab");
  const setSelectedRoom = mk("selectedRoom");
  const setStylePreset = mk("stylePreset");
  const setPrompt = mk("prompt");
  const setRefImages = mk("refImages");
  const setVariantCount = mk("variantCount");
  const setDesigns = mk("designs");
  const setEnhancedPrompt = mk("enhancedPrompt");
  const setSelectedDesign = mk("selectedDesign");
  const setFeedback = mk("feedback");
  const setVotes = mk("votes");
  const setVoters = mk("voters");
  const setCurrentVoter = mk("currentVoter");
  const setCurrentVotes = mk("currentVotes");
  const setConceptSheet = mk("conceptSheet");
  const setMultiViewImages = mk("multiViewImages");

  // Read active-job fields as if they were top-level state.
  const {
    step, loading, loadingMsg, loadingProgress,
    category, topTab, selectedRoom, stylePreset, prompt, refImages,
    variantCount,
    designs, enhancedPrompt,
    selectedDesign, feedback,
    votes, voters, currentVoter, currentVotes,
    conceptSheet, multiViewImages,
  } = activeJob;

  // spawnNewJob 은 projectSlug / actorName 선언 이후에 정의된다 (TDZ 방지).

  // Remove a job; invariant effect below picks a new active one.
  const removeJob = useCallback((jobId) => {
    setJobs((prev) => {
      const remaining = prev.filter((j) => j.id !== jobId);
      if (remaining.length === 0) return [createBlankJob(Date.now())];
      return remaining;
    });
  }, []);

  // Completed list / wishlist — D1 가 source of truth. 초기 렌더는 빈 배열로
  // 시작하고, 아래 init effect 에서 스냅샷을 로드한다.
  // [Phase B-3] completedList 는 더 이상 독립 state 아님. cards 에서 derived.
  // 하위 호환용으로 동일한 배열 shape 를 내려주고 기존 컴포넌트는 수정 없이 작동.
  // setCompletedList(...) 호출부는 전부 cards API 로 이관됨.
  const setCompletedList = () => { /* deprecated: cards 가 SOT */ };
  // v1.10.72 — 시안 생성 / 투표 및 선정 / 컨셉시트 생성 → "🚀 진행 중" 단일 탭으로 통합.
  const [activeTab, setActiveTab] = useState("progress"); // "wishlist" | "progress" | "completed"
  const [sortBy, setSortBy] = useState("date_desc"); // "date_desc" | "date_asc" | "title_asc" | "title_desc"
  const [cardScale, setCardScale] = useState(() => {
    const v = parseFloat(localStorage.getItem("inzoi_card_scale"));
    return [0.5, 1, 2].includes(v) ? v : 1;
  });
  useEffect(() => { try { localStorage.setItem("inzoi_card_scale", String(cardScale)); } catch {} }, [cardScale]);
  // "card" (기본) | "list" — 메인 페이지 보기 방식
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("inzoi_view_mode") === "list" ? "list" : "card");
  useEffect(() => { try { localStorage.setItem("inzoi_view_mode", viewMode); } catch {} }, [viewMode]);

  // 업데이트 일정 필터 상태 (availableUpdates 는 cards 선언 이후에 정의 — TDZ 방지).
  const [selectedUpdates, setSelectedUpdates] = useState(() => {
    // v1.10.87 — 부팅 시 ?tag=... 쿼리 읽어 초기값 채움 (공유 URL 진입 지원).
    try {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tag");
      return t ? t.split(",").map((s) => s.trim()).filter(Boolean) : [];
    } catch { return []; }
  });
  // 헤더 전체 카드 검색. 탭과 무관하게 모든 카드를 대상으로 제목/설명/태그/카테고리 라벨 매칭.
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // inzoiObjectList 의 meta.json 을 5분 주기로 가져와 카테고리/스타일 목록을 교체.
  // 실패하면 hardcoded fallback 사용. metaVersion bump 으로 하위 컴포넌트 re-render.
  const [metaVersion, setMetaVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/object-meta");
        if (!r.ok) return;
        const d = await r.json();
        if (cancelled) return;
        let changed = false;
        if (Array.isArray(d.categories) && d.categories.length > 0) {
          FURNITURE_CATEGORIES = d.categories;
          changed = true;
        }
        if (Array.isArray(d.styles) && d.styles.length > 0) {
          STYLE_PRESETS = d.styles;
          changed = true;
        }
        if (d.posmap && typeof d.posmap === "object") {
          POSMAP_SCORES = d.posmap;
          changed = true;
        }
        if (changed) setMetaVersion((v) => v + 1);
      } catch (e) { console.warn("object-meta 로드 실패:", e.message); }
    }
    load();
    const t = setInterval(load, 60 * 60 * 1000); // 1시간 — meta.json 은 자주 안 바뀜
    return () => { cancelled = true; clearInterval(t); };
  }, []);
  const [expandedItem, setExpandedItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailDesign, setDetailDesign] = useState(null); // 시안 이미지 확대 모달
  const [detailWish, setDetailWish] = useState(null);     // 위시리스트 상세 모달
  const [archiveOpen, setArchiveOpen] = useState(false);   // 아카이브 뷰 토글
  const [archivedCards, setArchivedCards] = useState([]);  // 서버에서 가져온 아카이브 카드
  const [activityFilter, setActivityFilter] = useState("all"); // 카드 활동 이력 필터
  const [activitiesExpanded, setActivitiesExpanded] = useState(false); // v1.10.79 — 기본 접힘으로 변경 (이전 v1.10.17 기본 펼침)
  const [galleryOpen, setGalleryOpen] = useState(false); // 상세 갤러리 캔버스 (F, v1.10.26)
  const [shortcutsOpen, setShortcutsOpen] = useState(false); // ? 키 단축키 치트시트 (v1.10.37)
  const [newItemId, setNewItemId] = useState(null);
  // 워크플로우 탭 상세 전개 여부. 기본 false 라 그리드만 보이고, 카드 클릭하거나
  // ＋ 새 시안 눌렀을 때만 true 로 전환되어 입력/단계 UI 가 드러난다.
  const [showWorkflowDetail, setShowWorkflowDetail] = useState(false);

  // Phase A/B: 새 카드 시스템 state. 기존 completedList / wishlist / jobs 와
  // 병행 유지하며, 단계적으로 UI 를 cards 기반으로 이전한다.
  const [cards, setCards] = useState([]);           // 프로젝트 내 모든 카드 (is_archived=0)
  const [lists, setLists] = useState([]);           // wishlist / drafting / sheet / done
  const [detailCard, setDetailCard] = useState(null); // 상세 모달에 열린 카드
  const [previewImage, setPreviewImage] = useState(null); // 이미지 원본 해상도 뷰어
  const [catalogItemId, setCatalogItemId] = useState(null); // inzoiObjectList 카탈로그 상세 iframe
  // 카드별 Gemini 생성 진행 상황. 생성 중일 때만 작업큐에 노출하고 끝나면 제거.
  // shape: { [cardId]: { title, thumb, done, total } }
  const [generatingCards, setGeneratingCards] = useState({});

  // 모든 카드에서 등장한 target_update 값 목록 (AssetInfoEditor datalist 및 chip 바에 사용).
  // cards 선언 이후여야 함 (TDZ 방지).
  // lists 의 status_key 를 각 카드에 _statusKey 로 주입 — 리스트 뷰 stage 정렬/렌더에 사용 (v1.10.45).
  const enrichedCards = useMemo(() => {
    const statusByList = new Map(lists.map((l) => [l.id, l.status_key]));
    return cards.map((c) => ({ ...c, _statusKey: statusByList.get(c.list_id) }));
  }, [cards, lists]);

  const availableUpdates = useMemo(() => {
    const set = new Set();
    for (const c of cards) {
      const v = c.data?.target_update?.trim?.();
      if (v) set.add(v);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "ko"));
  }, [cards]);

  // 전체 카드 검색 결과 — 제목 / 설명 / target_update / 카테고리 라벨 / 스타일 라벨 매칭.
  // is_archived 제외. 최대 12개.
  const globalSearchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    const hits = [];
    for (const c of cards) {
      if (c.is_archived) continue;
      const title = (c.title || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      const tu = (c.data?.target_update || "").toLowerCase();
      const catId = c.data?.category;
      const catLabel = catId ? (FURNITURE_CATEGORIES.find((x) => x.id === catId)?.label || "").toLowerCase() : "";
      const styleId = c.data?.style_preset;
      const styleLabel = styleId ? (STYLE_PRESETS.find((x) => x.id === styleId)?.label || "").toLowerCase() : "";
      if (title.includes(q) || desc.includes(q) || tu.includes(q) || catLabel.includes(q) || styleLabel.includes(q)) {
        hits.push(c);
        if (hits.length >= 12) break;
      }
    }
    return hits;
  }, [cards, globalSearch]);


  // 상세 모달 ← → 키 네비게이션은 projectSlug 선언 이후에 정의 (TDZ 방지).

  // [Phase B-3] cards → 기존 wishlist / completedList shape 로 변환하는 derived.
  // 컴포넌트들은 계속 `wishlist` / `completedList` 변수명 그대로 사용.
  //
  // 중복 제거: (1) _cardId 중복 (정상적으로 없어야 하지만 안전장치),
  // (2) 같은 title+note+imageUrl 조합은 가장 오래된 것만 남기고 나머지는 숨김
  //     — 과거 버전의 legacy 마이그레이션이 wishlist_items 에 같은 내용을 여러번
  //     쌓아 같은 카드가 여러개 보이는 경우가 있었음.
  const wishlist = useMemo(() => {
    const listId = lists.find((l) => l.status_key === "wishlist")?.id;
    if (!listId) return [];
    const raw = cards
      .filter((c) => c.list_id === listId && !c.is_archived)
      .map((c) => {
        const d = c.data || {};
        return {
          id: c.id.startsWith("wish-") ? c.id.slice(5) : c.id,
          title: c.title,
          note: c.description,
          imageUrl: c.thumbnail_url,
          gradient: d.gradient,
          createdAt: c.created_at,
          _cardId: c.id,
        };
      });
    const seenIds = new Set();
    const seenContent = new Map(); // content key → earliest entry
    for (const it of raw) {
      if (seenIds.has(it._cardId)) continue;
      seenIds.add(it._cardId);
      const key = `${it.title || ""}|${it.note || ""}|${it.imageUrl || ""}`;
      const cur = seenContent.get(key);
      if (!cur || (it.createdAt || "") < (cur.createdAt || "")) {
        seenContent.set(key, it);
      }
    }
    return [...seenContent.values()]
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [cards, lists]);

  const completedList = useMemo(() => {
    const listId = lists.find((l) => l.status_key === "done")?.id;
    if (!listId) return [];
    const raw = cards
      .filter((c) => c.list_id === listId && !c.is_archived)
      .map((c) => {
        const d = c.data || {};
        const selectedDesign = (typeof d.selected_design === "number" && Array.isArray(d.designs)) ? d.designs[d.selected_design] : null;
        return {
          id: c.id.startsWith("comp-") ? c.id.slice(5) : c.id,
          assetCode: d.asset_code,
          category: d.category,
          categoryLabel: d.category_label || c.title,
          categoryIcon: d.category_icon || "🏠",
          style: d.style,
          prompt: d.prompt || c.description,
          seed: d.seed || selectedDesign?.seed,
          colors: d.colors || [],
          gradient: d.gradient,
          imageUrl: d.image_url || selectedDesign?.imageUrl || c.thumbnail_url,
          conceptSheetUrl: d.concept_sheet_url || c.thumbnail_url,
          voters: d.voters,
          winner: d.winner,
          pipelineStatus: d.pipeline_status,
          designer: d.designer,
          completedAt: c.confirmed_at || c.updated_at || c.created_at,
          _cardId: c.id,
        };
      });
    // wishlist 와 동일한 방식으로 내용 중복 제거 (categoryLabel + prompt + imageUrl).
    const seenIds = new Set();
    const seenContent = new Map();
    for (const it of raw) {
      if (seenIds.has(it._cardId)) continue;
      seenIds.add(it._cardId);
      const key = `${it.categoryLabel || ""}|${it.prompt || ""}|${it.imageUrl || ""}`;
      const cur = seenContent.get(key);
      if (!cur || (it.completedAt || "") < (cur.completedAt || "")) {
        seenContent.set(key, it);
      }
    }
    return [...seenContent.values()]
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
  }, [cards, lists]);

  // [Phase B-3] wishlist 도 cards derived. 기존 shape 호환.
  const setWishlist = () => { /* deprecated */ };
  const [wishTitle, setWishTitle] = useState("");
  const [wishNote, setWishNote] = useState("");
  // 위시리스트 작성 중 첨부할 이미지들 (dataURL 배열). 최대 4개.
  const [wishImages, setWishImages] = useState([]);
  const wishImageRef = useRef(null);
  const [wishAddOpen, setWishAddOpen] = useState(false);

  // 클립보드 이미지 붙여넣기 — 위시리스트 탭에서만 활성. 여러번 붙여넣으면 누적.
  // 새 아이디어 모달이 열려있으면 탭 무관하게 Ctrl+V 로 이미지 붙여넣기 가능 (v1.10.43).
  // 상세 모달(detailCard) 이 위에 있으면 AssetInfoEditor 가 우선 처리하므로 skip.
  useEffect(() => {
    if (!wishAddOpen || detailCard) return;
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      let handled = false;
      for (const it of items) {
        if (it.type && it.type.startsWith("image/")) {
          const file = it.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => setWishImages((prev) => prev.length >= 4 ? prev : [...prev, ev.target.result]);
          reader.readAsDataURL(file);
          handled = true;
          break;
        }
      }
      if (handled) e.preventDefault();
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [wishAddOpen, detailCard]);

  // Version modal state
  const [versionOpen, setVersionOpen] = useState(false);

  // API key state — v1.10.71: 키 자체는 클라이언트에 노출 안됨. /api/config 가 boolean 만 응답.
  // - personalKey 가 있으면 헤더로 서버에 전달 (개인 override)
  // - 서버 키만 있으면 placeholder "[server]" 를 effective 로 사용 (truthy check 호환).
  // - 모든 외부 API 호출은 /api/ai/gemini/* 또는 /api/ai/claude/* 프록시 경유, 키는 서버에서만 부착.
  const [personalGeminiKey, setPersonalGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [personalClaudeKey, setPersonalClaudeKey] = useState(() => localStorage.getItem("claude_api_key") || "");
  const [serverConfig, setServerConfig] = useState({ gemini: false, claude: false, loaded: false });
  const [showApiSettings, setShowApiSettings] = useState(false);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => { if (cfg) setServerConfig({ gemini: !!cfg.gemini, claude: !!cfg.claude, loaded: true }); })
      .catch(() => setServerConfig((p) => ({ ...p, loaded: true })));
  }, []);
  // 우선순위: 개인 키 > 서버 placeholder. 빈 값이면 unavailable.
  const geminiApiKey = personalGeminiKey || (serverConfig.gemini ? "[server]" : "");
  const claudeApiKey = personalClaudeKey || (serverConfig.claude ? "[server]" : "");
  const geminiSource = personalGeminiKey ? "personal" : (serverConfig.gemini ? "server" : null);
  const claudeSource = personalClaudeKey ? "personal" : (serverConfig.claude ? "server" : null);
  const setGeminiApiKey = setPersonalGeminiKey;
  const setClaudeApiKey = setPersonalClaudeKey;

  // Invariant: always have ≥ 1 job and activeJobId points to one that exists.
  useEffect(() => {
    if (jobs.length === 0) {
      const nj = createBlankJob(Date.now());
      setJobs([nj]);
      setActiveJobId(nj.id);
    } else if (!jobs.find((j) => j.id === activeJobId)) {
      setActiveJobId(jobs[0].id);
    }
  }, [jobs, activeJobId]);

  // v1.10.72 — 3 탭이 통합되어 step 기반 자동 전환은 의미 없어짐. 무시.

  // ── 프로젝트 slug / 동기화 상태 ──
  const [projectSlug, setProjectSlug] = useState(null);
  const [projectReady, setProjectReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle" | "saving" | "error"
  const [connection, setConnection] = useState({ state: "connected", failStreak: 0 });
  // state: "connected" | "reconnecting" | "offline"
  // 프로필 (전역 공유, v1.10.8).
  // profiles 는 서버에서 로드, currentProfile 은 localStorage 에 id 저장.
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileIdRaw] = useState(() => {
    try { return localStorage.getItem("inzoi_profile_id") || null; } catch { return null; }
  });
  const setCurrentProfileId = (id) => {
    setCurrentProfileIdRaw(id);
    try {
      if (id) localStorage.setItem("inzoi_profile_id", id);
      else localStorage.removeItem("inzoi_profile_id");
    } catch {}
  };
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await fetchProfiles();
      if (!cancelled) setProfiles(list);
    }
    load();
    const t = setInterval(load, 30 * 1000); // 다른 사용자가 추가한 프로필 30초마다 반영
    return () => { cancelled = true; clearInterval(t); };
  }, []);
  const currentProfile = useMemo(
    () => profiles.find((p) => p.id === currentProfileId) || null,
    [profiles, currentProfileId]
  );
  // 새 프로필 생성 (바로 현재 프로필로 설정).
  const handleCreateProfile = async (name, icon) => {
    const p = await createProfile(name, icon);
    setProfiles((prev) => prev.find((x) => x.id === p.id) ? prev : [...prev, p]);
    return p;
  };
  // 프로필 편집 (이름 변경 시 서버가 card_comments / card_activities / activity_log 의
  // actor 필드를 일괄 갱신해 기존 기록도 새 이름으로 연결됨).
  const handleEditProfile = async (id, name, icon) => {
    const p = await updateProfile(id, name, icon);
    setProfiles((prev) => prev.map((x) => x.id === id ? p : x));
    // 이름이 바뀌었으면 상세 카드를 새로 불러와 댓글/활동에 반영된 새 이름 보여주기.
    if (detailCard) {
      try {
        const d = await fetchCardDetail(projectSlug, detailCard.id);
        if (d) setDetailCard(d);
      } catch {}
    }
    return p;
  };
  // actor 이름은 프로필에서 파생 — 프로필 없으면 localStorage 의 예전 inzoi_actor_name fallback.
  const actorName = useMemo(() => {
    if (currentProfile?.name) return currentProfile.name;
    try { return localStorage.getItem("inzoi_actor_name") || null; } catch { return null; }
  }, [currentProfile]);
  // v1.10.91 — inzoi_actor_name localStorage 동기화. AI 프록시 헤더(X-Actor-Name) 가
  // localStorage 를 읽어 사용량 로깅. 프로필 선택만으론 localStorage 가 갱신되지 않아
  // 모든 호출이 actor=null(익명) 로 기록되던 버그 수정.
  useEffect(() => {
    try {
      if (actorName) localStorage.setItem("inzoi_actor_name", actorName);
      else localStorage.removeItem("inzoi_actor_name");
    } catch { /* ignore */ }
  }, [actorName]);
  // actor 이름으로 프로필 찾기 (댓글/활동에 아이콘 표시용).
  const profileByName = useMemo(() => {
    const m = new Map();
    for (const p of profiles) m.set(p.name, p);
    return m;
  }, [profiles]);

  // 카드 상세 딥링크 — URL /p/<slug>/cards/<id> 로 상세 모달 공유 (v1.10.24).
  // 1) 최초 로드 시 URL 에 cardId 있으면 자동 오픈
  // 2) detailCard 열고 닫을 때 URL 동기화
  // 3) 브라우저 뒤로/앞으로 (popstate) 지원
  useEffect(() => {
    if (!projectSlug) return;
    const initialCardId = getCardIdFromUrl();
    if (!initialCardId) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchCardDetail(projectSlug, initialCardId);
        if (!cancelled && d) setDetailCard(d);
      } catch { /* URL 의 카드가 없거나 오류 — 무시하고 프로젝트 페이지 유지 */ }
    })();
    return () => { cancelled = true; };
  }, [projectSlug]);

  useEffect(() => {
    if (!projectSlug) return;
    syncCardUrl(projectSlug, detailCard?.id || null, false);
  }, [detailCard?.id, projectSlug]);

  useEffect(() => {
    if (!projectSlug) return;
    const onPop = async () => {
      const cid = getCardIdFromUrl();
      if (!cid) { setDetailCard(null); return; }
      if (detailCard?.id === cid) return;
      try {
        const d = await fetchCardDetail(projectSlug, cid);
        if (d) setDetailCard(d);
      } catch {}
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [projectSlug, detailCard?.id]);

  // v1.10.87 — selectedUpdates 변경 시 URL 쿼리 ?tag=... 에 동기 (replaceState 로 history 오염 X).
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const cur = url.searchParams.get("tag") || "";
      const next = selectedUpdates.length > 0 ? selectedUpdates.join(",") : "";
      if (cur === next) return;
      if (next) url.searchParams.set("tag", next);
      else url.searchParams.delete("tag");
      window.history.replaceState({}, "", url.toString());
    } catch { /* ignore */ }
  }, [selectedUpdates]);

  // popstate 시 URL 의 tag 쿼리 ↔ state 동기 (브라우저 뒤로/앞으로 + 외부 공유 링크 진입 지원).
  useEffect(() => {
    const onPop = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const t = sp.get("tag");
        const next = t ? t.split(",").map((s) => s.trim()).filter(Boolean) : [];
        setSelectedUpdates((prev) => {
          if (prev.length === next.length && prev.every((v, i) => v === next[i])) return prev;
          return next;
        });
      } catch { /* ignore */ }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 업데이트 태그 일괄 이름 변경 — chip 의 ✏️ 에서 호출. 해당 태그가 붙은
  // 모든 카드에 PATCH 를 병렬로 날리고, 응답으로 로컬 cards/detailCard 도 동기화.
  // selectedUpdates 에 이전 값이 있었으면 새 값으로 치환해 필터가 풀리지 않게 한다.
  const renameUpdateTag = React.useCallback(async (oldVal, newVal) => {
    if (!projectSlug) return;
    const targets = cards.filter((c) => (c.data?.target_update || "") === oldVal);
    if (targets.length === 0) return;
    try {
      const results = await Promise.all(targets.map(async (c) => {
        const r = await fetch(`/api/projects/${projectSlug}/cards/${c.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            data: { ...(c.data || {}), target_update: newVal || null },
            actor: actorName,
            force: true, // 컨펌된 카드도 태그 이름 변경은 허용.
          }),
        });
        if (!r.ok) throw new Error(`rename ${r.status} on ${c.id}`);
        return r.json();
      }));
      setCards((prev) => {
        const map = new Map(results.map((r) => [r.id, r]));
        return prev.map((c) => map.get(c.id) || c);
      });
      setDetailCard((prev) => (prev ? (results.find((r) => r.id === prev.id) || prev) : prev));
      setSelectedUpdates((prev) => {
        if (!prev.includes(oldVal)) return prev;
        const deduped = prev.filter((v) => v !== oldVal);
        // newVal 이 null/빈값이면 삭제 — selectedUpdates 에 새 값을 추가하지 않음.
        if (!newVal) return deduped;
        return deduped.includes(newVal) ? deduped : [...deduped, newVal];
      });
    } catch (e) {
      alert(`태그 이름 변경 실패: ${e.message}`);
    }
  }, [cards, projectSlug, actorName]);

  // 전역 단축키 (v1.10.26~)
  //   F: 상세 모달 열려있을 때 갤러리 캔버스 토글
  //   N: 어디서나 새 아이디어(위시 추가) 모달 오픈
  //   Esc: 상세 모달 닫기 (v1.10.29) — 단 갤러리/미리보기/카탈로그가 먼저 닫힘
  // 입력창(input/textarea/select/contenteditable) 포커스 중엔 동작 안 함.
  useEffect(() => {
    const onKey = (e) => {
      const tgt = e.target;
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.tagName === "SELECT" || tgt.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "f" || e.key === "F") {
        if (detailCard) { e.preventDefault(); setGalleryOpen((v) => !v); }
      } else if (e.key === "n" || e.key === "N") {
        if (!wishAddOpen) { e.preventDefault(); setWishAddOpen(true); }
      } else if (e.key === "?") {
        e.preventDefault(); setShortcutsOpen((v) => !v);
      } else if (e.key === "Escape") {
        if (shortcutsOpen) { e.preventDefault(); setShortcutsOpen(false); return; }
        // 우선순위: 갤러리 / 미리보기 / 카탈로그 모달이 열려있으면 자체 Esc 핸들러에 양보.
        if (galleryOpen || previewImage || catalogItemId) return;
        if (detailCard) { e.preventDefault(); setDetailCard(null); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailCard, wishAddOpen, galleryOpen, previewImage, catalogItemId, shortcutsOpen]);

  // 상세 카드가 닫히면 갤러리도 함께 닫음.
  useEffect(() => {
    if (!detailCard && galleryOpen) setGalleryOpen(false);
  }, [detailCard, galleryOpen]);

  // 상세 모달이 열려있을 때 ← → 키로 같은 탭의 이전/다음 카드로 이동.
  // input/textarea 입력 중이거나 이미지 lightbox 가 열려있을 땐 동작 안 함.
  useEffect(() => {
    if (!detailCard || !projectSlug) return;
    const handler = async (e) => {
      if (previewImage) return;
      const tgt = e.target;
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      let list = [];
      const findByStatus = (sk) => lists.find((l) => l.status_key === sk)?.id;
      if (activeTab === "wishlist") {
        const lid = findByStatus("wishlist");
        if (lid) list = cards.filter((c) => c.list_id === lid && !c.is_archived);
      } else if (activeTab === "progress") {
        // v1.10.72 — drafting + sheet 모두 포함.
        const draftingLid = findByStatus("drafting");
        const sheetLid = findByStatus("sheet");
        list = cards.filter((c) =>
          (c.list_id === draftingLid || c.list_id === sheetLid) && !c.is_archived
        );
      } else if (activeTab === "completed") {
        const lid = findByStatus("done");
        if (lid) list = cards.filter((c) => c.list_id === lid && !c.is_archived);
      }
      if (list.length < 2) return;
      list = list.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      const idx = list.findIndex((c) => c.id === detailCard.id);
      if (idx < 0) return;
      e.preventDefault();
      const next = e.key === "ArrowLeft"
        ? (idx - 1 + list.length) % list.length
        : (idx + 1) % list.length;
      try {
        const detail = await fetchCardDetail(projectSlug, list[next].id);
        if (detail) setDetailCard(detail);
      } catch { /* 무시 */ }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detailCard, previewImage, activeTab, cards, lists, projectSlug]);

  // [v1.4.4] '＋ 새 시안' 은 새 card 를 drafting 상태로 생성하고 상세 모달을 즉시 오픈.
  // projectSlug 미설정 시에만 레거시 job 경로로 폴백.
  const spawnNewJob = useCallback(async () => {
    if (!projectSlug) {
      const nj = createBlankJob(Date.now());
      setJobs((prev) => [...prev, nj]);
      setActiveJobId(nj.id);
      setShowWorkflowDetail(true);
      return nj.id;
    }
    const cardId = `card-${Date.now()}`;
    try {
      const r = await fetch(`/api/projects/${projectSlug}/cards`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cardId,
          title: "새 작업",
          status_key: "drafting",
          data: {},
          actor: actorName || null,
        }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const created = await r.json();
      setCards((prev) => (prev.find((c) => c.id === created.id) ? prev : [created, ...prev]));
      const detail = await fetchCardDetail(projectSlug, created.id);
      if (detail) setDetailCard(detail);
    } catch (e) {
      console.warn("새 카드 생성 실패:", e);
      alert("카드 생성 실패: " + e.message);
    }
    return cardId;
  }, [projectSlug, actorName]);

  // 앱 시작 시: 팀 전체가 공유하는 단일 프로젝트 (default 슬러그) 를 사용한다.
  // 없으면 생성하고, 이어서 스냅샷을 내려받아 jobs / completedList / wishlist 를 복원한다.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const slug = "default";

      // 프로젝트 없으면 생성 (서버가 idempotent 하게 처리).
      try {
        const probe = await fetch(`/api/projects/${slug}`);
        if (probe.status === 404) {
          await fetch("/api/projects", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ slug, name: "inZOI Asset Studio" }),
          });
        }
      } catch (e) { console.warn("프로젝트 확인/생성 실패", e); }

      if (cancelled) return;
      setProjectSlug(slug);

      // Snapshot 로드
      try {
        const r = await fetch(`/api/projects/${slug}`);
        if (!r.ok) throw new Error(`snapshot ${r.status}`);
        const data = await r.json();
        if (cancelled) return;
        const serverJobs = (data.jobs || []).map(dbRowToJob);
        const serverCompleted = (data.completed || []).map(dbRowToCompleted);
        const serverWishlist  = (data.wishlist  || []).map(dbRowToWishlist);

        // prev ref 를 먼저 서버 스냅샷으로 채워서, 이후 setState 로 트리거되는
        // sync effect 가 "새로 추가됐다" 고 오인해 중복 POST 를 하지 않게 한다.
        prevJobsRef.current      = serverJobs;
        prevCompletedRef.current = serverCompleted;
        prevWishlistRef.current  = serverWishlist;

        if (serverJobs.length > 0) {
          setJobs(serverJobs);
          setActiveJobId(serverJobs[0].id);
        }
        setCompletedList(serverCompleted);
        setWishlist(serverWishlist);

        // Phase A/B: 새 카드 모델도 함께 로드
        const serverLists = (data.lists || []);
        const serverCards = (data.cards || []);
        setLists(serverLists);
        setCards(serverCards);

        // 과거 버전 legacy 싱크가 cards → legacy → 다시 cards 로 복제한
        // 케이스를 정리. 같은 list_id + title + description + thumbnail_url
        // 조합의 카드가 2개 이상이면 "깨끗한 id" 1개만 남기고 나머지 DELETE.
        //
        // id 우선순위 (낮을수록 보존):
        //   1: 접두사 없음 (`<timestamp>`)  — 사용자가 직접 만든 것
        //   2: `card-…`  — 새 카드 플로우 생성
        //   3: `wish-…`  — wishlist 마이그레이션
        //   4: `comp-…`  — completed 마이그레이션
        //   5: `comp-wish-…` / `wish-job-…` / `comp-job-…` — 이중 접두사, legacy 루프 잔여물
        //   6: `job-…`   — legacy job 기반 마이그레이션
        try {
          const rank = (id) => {
            if (!id) return 0;
            if (id.startsWith("comp-wish-") || id.startsWith("wish-job-") || id.startsWith("comp-job-")) return 5;
            if (id.startsWith("comp-")) return 4;
            if (id.startsWith("wish-")) return 3;
            if (id.startsWith("card-")) return 2;
            if (id.startsWith("job-"))  return 6;
            return 1;
          };
          const groups = new Map();
          for (const c of serverCards) {
            if (c.is_archived) continue;
            const key = `${c.list_id}|${c.title || ""}|${c.description || ""}|${c.thumbnail_url || ""}`;
            const arr = groups.get(key) || [];
            arr.push(c);
            groups.set(key, arr);
          }
          const toDelete = [];
          for (const arr of groups.values()) {
            if (arr.length <= 1) continue;
            arr.sort((a, b) => {
              const dr = rank(a.id) - rank(b.id);
              if (dr !== 0) return dr;
              return (a.created_at || "").localeCompare(b.created_at || "");
            });
            for (let i = 1; i < arr.length; i++) toDelete.push(arr[i].id);
          }
          if (toDelete.length > 0) {
            console.info(`[dedupe] 중복 카드 ${toDelete.length}건 정리`);
            for (const id of toDelete) {
              try { await fetch(`/api/projects/${slug}/cards/${id}`, { method: "DELETE" }); } catch {}
            }
            setCards((prev) => prev.filter((c) => !toDelete.includes(c.id)));
          }
        } catch (e) { console.warn("[dedupe] 실패 (무시):", e); }
      } catch (err) {
        console.warn("스냅샷 로드 실패 — 기본 상태로 시작", err);
      } finally {
        if (!cancelled) setProjectReady(true);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // ── D1 동기화 effect: jobs / completedList / wishlist 변경을 debounce 후 저장 ──
  const prevJobsRef = useRef([]);
  const prevCompletedRef = useRef([]);
  const prevWishlistRef = useRef([]);

  useEffect(() => {
    if (!projectSlug || !projectReady) return;
    const timer = setTimeout(async () => {
      const prev = prevJobsRef.current;
      setSyncStatus("saving");
      try {
        // upsert changed
        for (const j of jobs) {
          const old = prev.find((p) => p.id === j.id);
          if (!old || JSON.stringify(old) !== JSON.stringify(j)) {
            await fetch(`/api/projects/${projectSlug}/jobs/${j.id}`, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(jobToDbPayload(j, actorName)),
            });
          }
        }
        // delete removed
        for (const p of prev) {
          if (!jobs.find((j) => j.id === p.id)) {
            await fetch(`/api/projects/${projectSlug}/jobs/${p.id}`, { method: "DELETE" });
          }
        }
        prevJobsRef.current = jobs;
        setSyncStatus("idle");
      } catch (e) { console.warn("jobs 동기화 실패", e); setSyncStatus("error"); }
    }, 500);
    return () => clearTimeout(timer);
  }, [jobs, projectSlug, projectReady, actorName]);

  // [v1.5.7] legacy completed/wishlist sync 제거 — cards 가 SOT.
  // 이전엔 cards → legacy 테이블로 역복사하다가 ensureLegacyMigration 이
  // 다시 comp-* / wish-* 접두사로 카드를 재생성해 중복이 쌓였다.
  // (sync effects removed; snapshot init + 카드 CRUD 로 충분)
  // keep prevCompletedRef / prevWishlistRef 만 유지해 다른 코드 호환.
  useEffect(() => {
    if (!projectSlug || !projectReady) return;
    prevCompletedRef.current = completedList;
  }, [completedList, projectSlug, projectReady]);

  useEffect(() => {
    if (!projectSlug || !projectReady) return;
    const timer = setTimeout(async () => {
      const prev = prevWishlistRef.current;
      try {
        // [v1.5.7] legacy /wishlist POST/DELETE 제거. cards 가 SOT.
        prevWishlistRef.current = wishlist;
      } catch (e) { console.warn("wishlist 동기화 실패", e); }
    }, 500);
    return () => clearTimeout(timer);
  }, [wishlist, projectSlug, projectReady]);

  // 페이지를 떠날 때 (새로고침/탭 닫기) debounce 타이머가 아직 발사되지 않은
  // 변경사항이 있으면 sendBeacon 으로 서버에 긴급 전송한다. 사용자가 완료 항목
  // 추가 직후 즉시 F5 눌러도 데이터가 사라지지 않도록 하기 위함.
  useEffect(() => {
    if (!projectSlug || !projectReady) return;
    // [v1.5.7] legacy sendBeacon 제거 — cards CRUD 가 이미 동기 await 됨.
  }, [completedList, wishlist, projectSlug, projectReady]);

  // 5초마다 서버 스냅샷을 가져와 자신이 편집 중이 아닌 리소스를 갱신 (협업).
  // 주의: 로컬에 갓 추가됐지만 아직 서버 저장이 완료되지 않은 항목은 유지해야
  // 한다 (폴링이 빈 서버 응답으로 덮어씌우는 경쟁 조건 방지).
  useEffect(() => {
    if (!projectSlug || !projectReady) return;
    let cancelled = false;
    // 연결 끊겨있으면 2초 간격으로 빠르게 재시도, 정상이면 5초.
    const pollInterval = connection.state === "connected" ? 5000 : 2000;
    const tick = async () => {
      try {
        const r = await fetch(`/api/projects/${projectSlug}`);
        if (!r.ok) throw new Error(`http ${r.status}`);
        const data = await r.json();
        if (cancelled) return;
        // 성공 — 연결 상태 복구
        setConnection((c) => c.state !== "connected" ? { state: "connected", failStreak: 0 } : c);

        // jobs: active 는 로컬 유지, 나머지는 서버 기준. 서버에만 있는 것 추가.
        const serverJobs = (data.jobs || []).map(dbRowToJob);
        setJobs((local) => {
          const merged = local.map((lj) => {
            if (lj.id === activeJobId) return lj;
            const sj = serverJobs.find((s) => String(s.id) === String(lj.id));
            return sj || lj;
          });
          for (const sj of serverJobs) {
            if (!merged.find((m) => String(m.id) === String(sj.id))) merged.push(sj);
          }
          return merged;
        });

        // completed: 서버 기준 목록에 "로컬에만 있는" 아이템을 merge.
        // 중요: 폴링으로 받아온 서버 아이템은 prev ref 에도 반영해서,
        // 다음 debounce 사이클이 "새로 추가됨" 으로 오인해 재POST 하지 않게 한다.
        const serverCompleted = (data.completed || []).map(dbRowToCompleted);
        setCompletedList((local) => {
          const serverIds = new Set(serverCompleted.map((c) => String(c.id)));
          const localOnly = local.filter((c) => !serverIds.has(String(c.id)));
          const merged = [...localOnly, ...serverCompleted];
          prevCompletedRef.current = merged;
          return merged;
        });

        // wishlist: 동일한 전략.
        const serverWishlist = (data.wishlist || []).map(dbRowToWishlist);
        setWishlist((local) => {
          const serverIds = new Set(serverWishlist.map((c) => String(c.id)));
          const localOnly = local.filter((c) => !serverIds.has(String(c.id)));
          const merged = [...localOnly, ...serverWishlist];
          prevWishlistRef.current = merged;
          return merged;
        });

        // cards / lists 는 서버 단일 source — 그대로 반영.
        setLists(data.lists || []);
        setCards(data.cards || []);
      } catch (e) {
        // 실패 — 카운터 증가. 3회 연속이면 "offline" 으로 전환.
        setConnection((c) => {
          const streak = c.failStreak + 1;
          return {
            state: streak >= 3 ? "offline" : "reconnecting",
            failStreak: streak,
          };
        });
      }
    };
    const handle = setInterval(tick, pollInterval);
    return () => { cancelled = true; clearInterval(handle); };
  }, [projectSlug, projectReady, activeJobId, connection.state]);

  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("gemini_model") || "gemini-3-flash-image");

  const canvasRef = useRef(null);

  const STEPS = ["입력", "시안 생성", "투표", "시안 선정", "컨셉시트 생성", "결과 전달"];

  // ─── Step 1 → 2: Generate designs ───
  // The generation runs entirely in the background against the captured
  // jobId. The ACTIVE workspace is reset to a new blank job immediately
  // so the user can start typing the next asset without waiting for
  // Gemini. Progress shows in the floating queue panel; clicking the
  // finished card switches the workspace to review the designs.
  const generateDesigns = async (opts = {}) => {
    const { keepActive = false } = opts;
    const jobId = activeJobId;
    const snap = jobs.find((j) => j.id === jobId) || activeJob;
    if (!snap.category || !snap.prompt) return;
    if (!geminiApiKey) {
      setShowApiSettings(true);
      return;
    }

    const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === snap.category);
    const styleInfo = STYLE_PRESETS.find((s) => s.id === snap.stylePreset);
    const spec = ASSET_SPECS[snap.category] || DEFAULT_SPEC;

    let enhanced = `${catInfo.preset}, ${styleInfo?.label || "modern"} style, ${snap.prompt}${spec.hint ? `, ${spec.hint}` : ""}, product design concept, white background, studio lighting, high detail, game asset reference`;

    // Kick the job into "loading" without advancing step — the main view
    // should NOT transition to the gallery until the designs are ready.
    updateJob(jobId, {
      loading: true,
      loadingMsg: "프롬프트 최적화 중...",
      loadingProgress: 10,
      designs: [],
    });

    // Re-generation from the gallery (step === 1) should stay in place.
    // Initial generation from the input form: hand the user a fresh blank
    // workspace so they can queue up the next asset immediately.
    if (!keepActive) {
      const next = createBlankJob(Date.now() + 1);
      setJobs((prev) => [...prev, next]);
      setActiveJobId(next.id);
    }

    try {
      if (claudeApiKey) {
        const systemPrompt = `You are an expert furniture concept artist for inZOI (a life simulation game by KRAFTON).
Given a furniture description, generate an enhanced, detailed prompt optimized for AI image generation.
The output should describe a single piece of furniture in detail: materials, colors, proportions, style details, lighting.
Always include: "product design concept, white background, studio lighting, high detail, game asset reference"
Match the inZOI aesthetic: stylized realism, slightly idealized proportions, warm and inviting feel.
Respond ONLY with the enhanced prompt in English, nothing else.`;

        const userMsg = `Furniture type: ${catInfo.label} (${catInfo.preset})
Style: ${styleInfo?.label || "modern"}
User description: ${snap.prompt}${spec.hint ? `\nDimension & scale reference: ${spec.hint}` : ""}
Reference images provided: ${snap.refImages.length > 0 ? "yes" : "no"}`;

        // v1.10.71 — 서버 프록시. claudeApiKey 가 "[server]" 가 아니면 personal override 헤더로 전달.
        // v1.10.89 — X-Actor-Name 헤더로 사용량 로그용 actor 전달.
        const claudeHeaders = {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        };
        if (claudeApiKey && claudeApiKey !== "[server]") claudeHeaders["X-Personal-Claude-Key"] = claudeApiKey;
        try {
          // v1.10.93 — 한글 actor 이름 encodeURIComponent 처리.
          const _actor = localStorage.getItem("inzoi_actor_name");
          if (_actor) claudeHeaders["X-Actor-Name"] = encodeURIComponent(_actor);
        } catch { /* ignore */ }
        const claudeResp = await fetch("/api/ai/claude/v1/messages", {
          method: "POST",
          headers: claudeHeaders,
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userMsg }],
          }),
        });

        if (claudeResp.ok) {
          const claudeData = await claudeResp.json();
          enhanced = claudeData.content?.[0]?.text || enhanced;
        }
      }
      // N개 시안을 병렬 생성. 각 호출은 다른 seed로 변주를 유도.
      const count = Math.max(1, Math.min(8, snap.variantCount || 4));
      const seeds = Array.from({ length: count }, () => generateSeed());

      updateJob(jobId, {
        enhancedPrompt: enhanced,
        loadingMsg: `나노바나나2로 시안 생성 중... (0/${count})`,
        loadingProgress: 30,
      });

      const tasks = seeds.map((s) => async () => {
        try {
          const url = await generateImageWithGemini(geminiApiKey, enhanced, selectedModel);
          // 서버 /data/images/ 로 업로드해서 URL 만 DB 에 저장. 용량 제한 회피.
          const stored = await uploadDataUrl(url);
          return { seed: s, imageUrl: stored };
        } catch (imgErr) {
          console.error("Image generation failed:", imgErr);
          return { seed: s, imageUrl: null, error: imgErr.message };
        }
      });

      // Gemini 레이트 리밋 회피를 위해 최대 4개씩 병렬 실행.
      const CONCURRENCY = 4;
      const results = await runWithConcurrencyLimit(tasks, CONCURRENCY, (done, total) => {
        const pct = 30 + Math.round((done / total) * 65);
        updateJob(jobId, {
          loadingMsg: `나노바나나2로 시안 생성 중... (${done}/${total})`,
          loadingProgress: pct,
        });
      });

      const failed = results.filter((r) => !r || !r.imageUrl).length;

      updateJob(jobId, {
        loadingProgress: 100,
        loadingMsg: failed > 0 ? `완료 (${count - failed}/${count})` : "완료!",
        step: 1,
        designs: results.map((r, i) => ({
          id: i,
          seed: r?.seed ?? seeds[i],
          icon: catInfo.icon,
          gradient: "linear-gradient(135deg, #1e293b, #334155)",
          prompt: enhanced,
          imageUrl: r?.imageUrl ?? null,
          colors: generateColors(5),
        })),
      });
      if (failed === count) {
        alert(`모든 시안 생성 실패 (${count}개). API 키/모델 설정을 확인해주세요.`);
      }
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error(err);
      alert(`이미지 생성 오류: ${err.message}`);
      // 모든 시안이 실패해도 UI가 빈 상태로 남지 않도록 placeholder N개 생성.
      const count = Math.max(1, Math.min(8, snap.variantCount || 4));
      updateJob(jobId, {
        step: 1,
        designs: Array.from({ length: count }, (_, i) => ({
          id: i,
          seed: generateSeed(),
          icon: catInfo.icon,
          gradient: "linear-gradient(135deg, #1e293b, #334155)",
          prompt: enhanced,
          imageUrl: null,
          colors: generateColors(5),
        })),
      });
    } finally {
      updateJob(jobId, { loading: false, loadingProgress: 0 });
    }
  };

  // ─── Step 3 → 4: Generate concept sheet ───
  const generateConceptSheet = async () => {
    const jobId = activeJobId;
    const snap = jobs.find((j) => j.id === jobId) || activeJob;
    if (snap.selectedDesign === null || snap.selectedDesign === undefined) return;

    updateJob(jobId, { loading: true, loadingMsg: "컨셉시트 레이아웃 생성 중...", loadingProgress: 20 });

    const design = snap.designs[snap.selectedDesign];
    const sourceUrl = design.imageUrl || `/images/${snap.category}.jpg`;
    const sourceImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = sourceUrl;
    });

    updateJob(jobId, { loadingProgress: 60 });

    const viewImages = {};
    const views = {};
    for (const view of VIEW_ANGLES) {
      viewImages[view.id] = sourceImg;
      views[view.id] = sourceUrl;
    }
    updateJob(jobId, { multiViewImages: views, loadingProgress: 80 });
    await new Promise((r) => setTimeout(r, 200));

    let sheetDataUrl = null;
    if (canvasRef.current) {
      const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === snap.category);
      const styleInfo = STYLE_PRESETS.find((s) => s.id === snap.stylePreset);
      generateConceptSheetCanvas(canvasRef.current, viewImages, {
        category: catInfo?.label || "",
        style: styleInfo?.label || "",
        prompt: snap.enhancedPrompt || snap.prompt,
        seed: design.seed,
        colors: design.colors,
        model: selectedModel,
      });
      const raw = canvasRef.current.toDataURL("image/png");
      // 대용량 PNG (2400x3200, 수 MB) 을 서버 파일로 업로드.
      updateJob(jobId, { loadingMsg: "서버에 컨셉시트 업로드 중..." });
      sheetDataUrl = await uploadDataUrl(raw);
    }

    updateJob(jobId, { conceptSheet: sheetDataUrl, loadingProgress: 100, loadingMsg: "컨셉시트 완성!" });
    await new Promise((r) => setTimeout(r, 400));
    updateJob(jobId, { step: 5, loading: false });
  };

  // ─── Download handler ───
  const downloadConceptSheet = () => {
    if (!conceptSheet) return;
    const link = document.createElement("a");
    link.download = `inzoi_concept_${category}_${Date.now()}.png`;
    link.href = conceptSheet;
    link.click();
  };

  // ─── Render ───
  return (
    <div style={{
      minHeight: "100vh",
      // the background is now handled in index.css
      color: "var(--text-main)",
    }}>
      {/* Loading is shown per-job in the floating queue panel, not as a full-screen overlay. */}

      {/* 서버 연결 끊김 배너 — 폴링 실패 시 상단에 알림 */}
      {connection.state !== "connected" && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          padding: "10px 20px", textAlign: "center",
          background: connection.state === "offline" ? "#ef4444" : "#f59e0b",
          color: "#fff", fontSize: 13, fontWeight: 700,
          zIndex: 9999, boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          animation: "fadeIn 0.2s ease",
        }}>
          {connection.state === "reconnecting" ? (
            <>
              <span style={{ fontSize: 14 }}>🔄</span>
              서버 재연결 중... (시도 {connection.failStreak}회) — 잠시만 기다려주세요.
            </>
          ) : (
            <>
              <span style={{ fontSize: 14 }}>⚠️</span>
              서버 연결 실패 ({connection.failStreak}회 연속). 네트워크 또는 운영자 PC 확인 필요.
              <button
                onClick={() => location.reload()}
                style={{
                  marginLeft: 12, padding: "4px 12px", borderRadius: 6,
                  background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.5)",
                  color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >🔁 새로고침</button>
            </>
          )}
        </div>
      )}


      {/* Header */}
      <header className="glass-panel" style={{
        padding: "12px 24px",
        borderBottom: "1px solid var(--surface-border)",
        // v1.10.77 — 3 컬럼 grid 로 좌/중/우 배치. 가운데 탭이 화면 중앙에 정확히 위치.
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
            onClick={() => setVersionOpen(true)}
            title="버전 정보 보기"
          >
            <img src="/InZOI_Logo.png" alt="inZOI" style={{ height: 28, objectFit: "contain" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="text-gradient" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Asset Studio
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "var(--accent)",
                  background: "rgba(152,166,255,0.1)", border: "1px solid rgba(152,166,255,0.25)",
                  padding: "1px 7px", borderRadius: 6, letterSpacing: "0.02em",
                }}>
                  v{APP_VERSION}
                </span>
              </div>
              {/* v1.10.77 — tagline 제거로 좌측 브랜딩 폭 축소 */}
            </div>
          </div>
          {/* 헤더 전체 카드 검색 — 제목/설명/업데이트 태그/카테고리/스타일 라벨 매칭 */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, pointerEvents: "none", opacity: 0.6,
              }}>🔍</span>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => { setGlobalSearch(e.target.value); setGlobalSearchOpen(true); }}
                onFocus={() => setGlobalSearchOpen(true)}
                onBlur={() => setTimeout(() => setGlobalSearchOpen(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setGlobalSearch(""); setGlobalSearchOpen(false); e.currentTarget.blur(); }
                }}
                placeholder="전체 카드 검색 (제목 / 설명 / 태그 / 카테고리)"
                style={{
                  width: 238, padding: "8px 28px 8px 32px", borderRadius: 10,
                  border: "1px solid var(--surface-border)",
                  background: "rgba(0,0,0,0.03)",
                  fontSize: 12, color: "var(--text-main)", outline: "none", boxSizing: "border-box",
                }}
              />
              {globalSearch && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); setGlobalSearch(""); setGlobalSearchOpen(false); }}
                  title="지우기"
                  style={{
                    position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                    width: 18, height: 18, borderRadius: 9,
                    background: "rgba(0,0,0,0.08)", border: "none",
                    color: "var(--text-muted)", fontSize: 10, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              )}
            </div>
            {globalSearchOpen && globalSearch.trim() && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0,
                width: 420, maxHeight: 380, overflowY: "auto",
                background: "#fff", border: "1px solid var(--surface-border)",
                borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", zIndex: 150,
                padding: 4,
              }}>
                {globalSearchResults.length === 0 ? (
                  <div style={{ padding: "16px 14px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                    검색 결과 없음
                  </div>
                ) : globalSearchResults.map((c) => {
                  const data = c.data || {};
                  const catInfo = data.category ? FURNITURE_CATEGORIES.find((x) => x.id === data.category) : null;
                  const ds = Array.isArray(data.designs) ? data.designs : [];
                  const single = ds.length === 1 && ds[0]?.imageUrl ? ds[0].imageUrl : null;
                  const thumb = single || c.thumbnail_url;
                  const list = lists.find((l) => l.id === c.list_id);
                  const statusLabel = list ? (STATUS_META[list.status_key]?.label || list.name) : null;
                  const tu = data.target_update?.trim?.();
                  return (
                    <div
                      key={c.id}
                      onMouseDown={async (e) => {
                        e.preventDefault();
                        if (!projectSlug) return;
                        try {
                          const detail = await fetchCardDetail(projectSlug, c.id);
                          if (detail) {
                            setDetailCard(detail);
                            setGlobalSearchOpen(false);
                          }
                        } catch (err) { console.warn("검색 결과 열기 실패", err); }
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(7,110,232,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 6, overflow: "hidden", flexShrink: 0,
                        background: thumb ? "#000" : "rgba(0,0,0,0.05)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {thumb
                          ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 18, opacity: 0.6 }}>{catInfo?.icon || "📇"}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700, color: "var(--text-main)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{c.title || "(제목 없음)"}</div>
                        <div style={{
                          fontSize: 11, color: "var(--text-muted)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {[statusLabel, catInfo?.label, tu].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--text-muted)", borderTop: "1px solid var(--surface-border)" }}>
                  {globalSearchResults.length > 0 ? `상위 ${globalSearchResults.length}개` : ""}
                  {globalSearchResults.length >= 12 && " · 더 좁은 검색어로 좁혀보세요"}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tab Navigation — 5-step workflow */}
        {(() => {
          // 각 탭이 "담당하는" step 범위. 탭 클릭 시 해당 범위의 작업으로
          // active 를 옮기고, 범위 밖이면 empty 상태 UI 가 표시된다.
          const TAB_STEP_RANGES = {
            progress: [0, 6], // v1.10.72 — 통합 탭은 step 0~6 전체 커버
          };
          // 자연스러운 흐름: 아이디어(위시) → 시안 → 투표 → 컨셉시트 → 완료
          // count 는 legacy jobs + 새 카드 시스템 합산.
          // v1.10.72 — 3 탭(시안 생성 / 투표 및 선정 / 컨셉시트 생성) 을 "🚀 진행 중" 단일 탭으로 통합.
          const draftingListId = lists.find((l) => l.status_key === "drafting")?.id;
          const sheetListId    = lists.find((l) => l.status_key === "sheet")?.id;
          const activeDraftingCards = draftingListId
            ? cards.filter((c) => c.list_id === draftingListId && !c.is_archived)
            : [];
          const sheetCount = sheetListId
            ? cards.filter((c) => c.list_id === sheetListId && !c.is_archived).length
            : 0;
          const progressCount = activeDraftingCards.length + sheetCount + jobs.filter(j => j.step >= 0 && j.step <= 6).length;
          const TABS = [
            { id: "wishlist",  label: "위시",     icon: "⭐", count: wishlist.length },
            { id: "progress",  label: "진행 중",  icon: "🚀", count: progressCount },
            { id: "completed", label: "완료",     icon: "✅", count: completedList.length },
          ];
          const switchTab = (id) => {
            setActiveTab(id);
            // 명시적 탭 이동 시에는 상세 뷰를 닫고 그리드만 보이게 한다.
            setShowWorkflowDetail(false);
            const range = TAB_STEP_RANGES[id];
            if (range && (step < range[0] || step > range[1])) {
              const target = jobs.find(j => j.step >= range[0] && j.step <= range[1]);
              if (target) setActiveJobId(target.id);
            }
          };
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.03)", padding: "4px", borderRadius: 14, border: "1px solid var(--surface-border)" }}>
              {TABS.map((tab, idx) => (
                <React.Fragment key={tab.id}>
                  {(idx === 1 || idx === 2) && <div style={{ width: 1, height: 20, background: "var(--surface-border)", margin: "0 2px" }} />}
                  <button onClick={() => switchTab(tab.id)} style={{
                    padding: "8px 14px", borderRadius: 10,
                    background: activeTab === tab.id ? "#fff" : "transparent",
                    border: "none",
                    color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
                    fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 6,
                    boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    whiteSpace: "nowrap",
                  }}>
                    <span style={{ fontSize: 14 }}>{tab.icon}</span>
                    {tab.label}
                    {tab.count > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 7,
                        background: activeTab === tab.id ? "rgba(7,110,232,0.14)" : "rgba(0,0,0,0.06)",
                        color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>
          );
        })()}

        {/* Right: Settings + New Start button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
          {/* 저장 상태 작은 인디케이터 (프로젝트는 전체 공유 하나라 URL 공유 UI 는 제거). */}
          {syncStatus !== "idle" && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: "6px 10px", borderRadius: 8,
              background: syncStatus === "error" ? "rgba(239,68,68,0.1)" : "rgba(7,110,232,0.08)",
              color: syncStatus === "error" ? "#ef4444" : "var(--primary)",
            }}>
              {syncStatus === "saving" ? "저장중..." : "저장 실패"}
            </span>
          )}
          <button
            onClick={async () => {
              if (projectSlug) {
                try {
                  const r = await fetch(`/api/projects/${projectSlug}/cards?archived=1`);
                  if (r.ok) setArchivedCards(await r.json());
                } catch (e) { console.warn("archive fetch failed", e); }
              }
              setArchiveOpen(true);
            }}
            className="hover-lift"
            style={{
              padding: "5px 10px", borderRadius: 8,
              background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
              color: "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
            title="아카이브된 카드 목록"
          >
            <span style={{ fontSize: 12 }}>🗄️</span>
            아카이브
          </button>
          <button
            onClick={() => setShowApiSettings(true)}
            className="hover-lift"
            style={{
              padding: "5px 10px", borderRadius: 8,
              background: geminiApiKey ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${geminiApiKey ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: geminiApiKey ? "#10b981" : "#ef4444",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              transition: "all 0.3s",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontSize: 12 }}>{geminiApiKey ? "🔑" : "⚠️"}</span>
            API 설정
          </button>
          {/* 헤더의 ＋ 새 시안 버튼은 v1.10.12 제거 — 시안 생성 탭 본문에 동일 버튼 존재 */}
          {/* 프로필 선택기 — 헤더 맨 오른쪽 끝 (v1.10.8) */}
          <ProfilePicker
            profiles={profiles}
            current={currentProfile}
            onChange={(p) => setCurrentProfileId(p.id)}
            onCreate={handleCreateProfile}
            onEdit={handleEditProfile}
          />
        </div>
      </header>

      {/* ═══ 작업 탭 (시안 생성 / 투표 및 선정 / 컨셉시트 생성) ═══ */}
      {/* 세 탭이 공유하는 워크플로우 본문. 각 탭은 step 범위로 매칭.
          - create: step 0~1
          - vote:   step 2~3
          - sheet:  step 4~6
          범위 밖이면 빈 상태 안내 */}
      {activeTab === "progress" && <>

      {/* v1.10.72 — 카드 허브 (통합 진행 중 탭). 시안 생성·투표·시트 단계 카드를 한 화면에. */}
      {(() => {
        // 통합: drafting + sheet 모든 카드. jobs 는 step 0~6 전 범위.
        // v1.10.80 — 빈 legacy job(placeholder "새 작업") 은 그리드에서 숨김.
        // 데이터(카테고리/시안/프롬프트) 가 있는 legacy job 만 노출. invariant useEffect 가 빈 job 1개를
        // 항상 유지하지만 사용자에게 보일 필요는 없음 (카드 생성은 + 새 시안 버튼으로 직접 처리).
        const isBlankJob = (j) => !j.category && (!j.designs || j.designs.length === 0) && !j.prompt;
        const inRangeJobs = jobs.filter((j) => j.step >= 0 && j.step <= 6 && !isBlankJob(j));
        const draftingLid = lists.find((l) => l.status_key === "drafting")?.id;
        const sheetLid    = lists.find((l) => l.status_key === "sheet")?.id;
        const inRangeCards = cards.filter((c) =>
          (c.list_id === draftingLid || c.list_id === sheetLid) && !c.is_archived
        );
        const totalCount = inRangeJobs.length + inRangeCards.length;

        const tabMeta = {
          title: "진행 중",
          icon: "🚀",
          desc: "위시 → 시안 → 투표 → 시트 단계 카드를 한 화면에. 정렬을 '진행 단계' 로 두면 단계별 그룹으로 보입니다.",
        };

        return (
          <main style={{ padding: "20px 40px 0", maxWidth: 1600, margin: "0 auto" }}>
            {/* v1.10.86 — 헤더 상하 폭 축소 + 카운트 제목 옆으로 인라인. */}
            <div style={{
              position: "sticky", top: 64, zIndex: 50,
              background: "var(--bg-color)", paddingTop: 2, paddingBottom: 2,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <h2 className="text-gradient" style={{ fontSize: 22, fontWeight: 800 }}>
                    {tabMeta.icon} {tabMeta.title}
                  </h2>
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {totalCount > 0 ? `${totalCount}개` : tabMeta.desc}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ViewModeToggle value={viewMode} onChange={setViewMode} />
                  <CardScaleSelect value={cardScale} onChange={setCardScale} />
                  <SortSelect value={sortBy} onChange={setSortBy} />
                  {/* v1.10.72 — 진행 중 탭에서 항상 노출. 새 카드는 drafting 으로 생성. */}
                  <button
                    onClick={spawnNewJob}
                    className="btn-primary hover-lift"
                    style={{
                      padding: "12px 22px", borderRadius: 12, border: "none",
                      color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 4px 14px var(--primary-glow)",
                    }}
                  >＋ 새 시안</button>
                </div>
              </div>

              {(() => {
                const chips = collectUpdateChips(inRangeCards);
                return (
                  <UpdateChipBar
                    chips={chips}
                    selected={selectedUpdates}
                    onChange={setSelectedUpdates}
                    totalCount={inRangeCards.length}
                    onRename={renameUpdateTag}
                  />
                );
              })()}
              {viewMode === "list" && totalCount > 0 && (
                <CardListHeader tabId={activeTab} sortBy={sortBy} onSortChange={setSortBy} scale={cardScale} />
              )}
            </div>

            {totalCount > 0 ? (
              viewMode === "list" ? (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(() => {
                      const statusByList = new Map(lists.map((l) => [l.id, l.status_key]));
                      const inRangeEnriched = inRangeCards.map((c) => ({ ...c, _statusKey: statusByList.get(c.list_id) }));
                      // v1.10.72 — progress 탭에서 카드 단계에 맞춰 컴포넌트 분기 결정.
                      const tabIdFor = (c) => c._statusKey === "sheet" ? "sheet" : "create";
                      return sortCardArray(inRangeEnriched.filter((c) => matchesUpdateFilter(c, selectedUpdates)), sortBy).map((c) => (
                        <CardListRow
                          key={`card-${c.id}`}
                          card={c}
                          tabId={tabIdFor(c)}
                          scale={cardScale}
                          profileByName={profileByName}
                          projectSlug={projectSlug}
                          actor={actorName}
                          lists={lists}
                          availableUpdates={availableUpdates}
                          onSaved={async () => {
                            const d = await fetchCardDetail(projectSlug, c.id);
                            if (d) {
                              setCards((prev) => prev.map((x) => x.id === d.id ? d : x));
                              setDetailCard((prev) => (prev && prev.id === d.id) ? d : prev);
                            }
                          }}
                          onClick={async () => {
                            if (!projectSlug) return;
                            try {
                              const detail = await fetchCardDetail(projectSlug, c.id);
                              if (detail) setDetailCard(detail);
                            } catch (e) { console.warn("카드 열기 실패", e); }
                          }}
                        />
                      ));
                    })()}
                  </div>
                </div>
              ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(240 * cardScale)}px, 1fr))`,
                gap: 16,
                marginBottom: 40,
              }}>
                {/* 새 카드 시스템의 카드들 — 위시에서 넘어온 것 포함. 정렬 sortBy 적용 */}
                {(() => {
                  // v1.10.72 — progress 탭: 카드 단계 별 derivedTab 으로 렌더 분기.
                  const statusByList = new Map(lists.map((l) => [l.id, l.status_key]));
                  const enriched = inRangeCards.map((c) => ({ ...c, _statusKey: statusByList.get(c.list_id) }));
                  const tabIdFor = (c) => c._statusKey === "sheet" ? "sheet" : "create";
                  return sortCardArray(enriched.filter((c) => matchesUpdateFilter(c, selectedUpdates)), sortBy).map((c) => (
                  <CardHubCard
                    key={`card-${c.id}`}
                    card={c}
                    tabId={tabIdFor(c)}
                    scale={cardScale}
                    onClick={async () => {
                      if (!projectSlug) return;
                      try {
                        const detail = await fetchCardDetail(projectSlug, c.id);
                        if (detail) setDetailCard(detail);
                      } catch (e) { console.warn("카드 열기 실패", e); }
                    }}
                  />
                  ));
                })()}
                {/* 레거시 jobs 기반 카드 — 빈 '새작업' 은 클릭 시 card 로 마이그레이션해 모달 오픈 */}
                {inRangeJobs.map((j) => {
                  const isBlank = !j.category && (!j.designs || j.designs.length === 0) && !j.prompt;
                  // v1.10.72 — progress 탭에서 job.step 기반 derivedTab.
                  const jobTabId = j.step >= 4 ? "sheet" : (j.step >= 2 ? "vote" : "create");
                  return (
                    <WorkflowJobCard
                      key={j.id}
                      job={j}
                      active={j.id === activeJobId && showWorkflowDetail}
                      tabId={jobTabId}
                      onSelect={async () => {
                        if (isBlank && projectSlug) {
                          // 빈 레거시 job → 대응되는 card 를 drafting 상태로 새로 만들고 상세 모달 오픈
                          try {
                            const cardId = `card-${Date.now()}`;
                            const r = await fetch(`/api/projects/${projectSlug}/cards`, {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({
                                id: cardId, title: "새 작업",
                                status_key: "drafting", data: {}, actor: actorName || null,
                              }),
                            });
                            if (r.ok) {
                              const created = await r.json();
                              setCards((prev) => (prev.find((c) => c.id === created.id) ? prev : [created, ...prev]));
                              const detail = await fetchCardDetail(projectSlug, created.id);
                              if (detail) setDetailCard(detail);
                              // 레거시 빈 job 제거 (혼란 방지)
                              setJobs((prev) => prev.filter((x) => x.id !== j.id));
                              return;
                            }
                          } catch (e) { console.warn("카드 마이그레이션 실패", e); }
                        }
                        // 데이터가 있는 레거시 job 은 기존 UI 유지
                        setActiveJobId(j.id);
                        setShowWorkflowDetail(true);
                      }}
                    />
                  );
                })}
              </div>
              )
            ) : (
              <div style={{
                padding: "60px 40px", textAlign: "center",
                background: "rgba(0,0,0,0.02)",
                border: "1px dashed var(--surface-border)", borderRadius: 16,
                marginBottom: 40,
              }}>
                <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.6 }}>{tabMeta.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>
                  진행 중인 카드가 없습니다
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  ＋ 새 시안 버튼으로 시작하거나, 위시 탭에서 카드를 시안 단계로 이동하세요.
                </div>
              </div>
            )}
          </main>
        );
      })()}

      {/* 상세 진행 UI 는 사용자가 카드를 직접 선택하거나 ＋ 새 시안을 눌렀을 때만 전개 */}
      {(() => {
        // v1.10.72.1 — 통합 진행 탭은 step 0~6 전 범위.
        const ranges = { progress: [0, 6] };
        const r = ranges[activeTab];
        if (!r) return null;
        const [min, max] = r;
        if (step < min || step > max) return null;
        if (!showWorkflowDetail) return null;
        return (
          <>
            <div style={{
              margin: "8px 40px 0", maxWidth: 1600, marginLeft: "auto", marginRight: "auto",
              borderTop: "1px solid var(--surface-border)", paddingTop: 20,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
                선택된 작업 진행
              </div>
              <button
                onClick={() => setShowWorkflowDetail(false)}
                className="hover-lift"
                style={{
                  padding: "6px 12px", borderRadius: 9,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >← 목록으로</button>
            </div>
            <div style={{ padding: "20px 0 0" }}>
              <StepIndicator currentStep={step} steps={STEPS} />
            </div>
          </>
        );
      })()}

      {/* Content — 상세 모드일 때만 렌더 */}
      <main style={{
        padding: "0 40px 60px", maxWidth: 1600, margin: "0 auto",
        display: showWorkflowDetail ? "block" : "none",
      }}>

        {/* ═══ STEP 1: Input ═══ */}
        {step === 0 && (
          <div style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 className="text-gradient" style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>어셋 정보 입력</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 400 }}>
                원하는 가구 타입, 스타일, 설명을 입력하면 고퀄리티 AI 디자인 시안을 생성합니다.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: 40, borderRadius: 24 }}>
              {/* Category Selection - Top tabs + Room tabs + sub-category chips */}
              <div style={{ marginBottom: 40 }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-lighter)", display: "block", marginBottom: 16 }}>
                  가구 카테고리 <span style={{ color: "var(--accent)" }}>*</span>
                </label>
                {/* Top-level tabs: 가구 / 건축 */}
                <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
                  {[
                    { id: "furniture", label: "가구", count: 3471 },
                    { id: "architecture", label: "건축", count: 321 },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => {
                      setTopTab(tab.id);
                      setSelectedRoom(tab.id === "furniture" ? "침실" : "벽");
                      setCategory(null);
                    }} style={{
                      padding: "14px 32px", border: "1px solid var(--surface-border)",
                      borderBottom: topTab === tab.id ? "1px solid transparent" : "1px solid var(--surface-border)",
                      borderRadius: "16px 16px 0 0",
                      background: topTab === tab.id ? "rgba(0,0,0,0.04)" : "transparent",
                      color: topTab === tab.id ? "#fff" : "var(--text-muted)",
                      fontSize: 15, fontWeight: topTab === tab.id ? 700 : 500,
                      cursor: "pointer", position: "relative",
                      zIndex: topTab === tab.id ? 2 : 1,
                      marginRight: -1,
                      transition: "all 0.3s",
                    }}>
                      {tab.label}
                      <span style={{ fontSize: 12, color: topTab === tab.id ? "var(--accent)" : "rgba(255,255,255,0.3)", marginLeft: 8, fontWeight: 600 }}>{tab.count}</span>
                    </button>
                  ))}
                  <div style={{ flex: 1, borderBottom: "1px solid var(--surface-border)" }} />
                </div>
                {/* Room + Sub-category panel */}
                <div style={{ border: "1px solid var(--surface-border)", borderTop: "none", borderRadius: "0 0 16px 16px", overflow: "hidden", background: "rgba(0,0,0,0.04)" }}>
                  {/* Room tabs — horizontal */}
                  <div style={{ display: "flex", gap: 0, overflowX: "auto", background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--surface-border)", scrollbarWidth: "none" }}>
                    {(topTab === "furniture"
                      ? ["침실", "거실", "주방", "욕실", "서재", "야외공간", "취미", "소셜 이벤트", "기타"]
                      : ["벽", "바닥", "지붕", "문", "창문", "계단", "기둥", "울타리", "기타 건축"]
                    ).map(room => (
                      <button key={room} onClick={() => { setSelectedRoom(room); setCategory(null); }} style={{
                        flexShrink: 0,
                        padding: "12px 20px", border: "none",
                        borderBottom: selectedRoom === room ? "2px solid var(--accent)" : "2px solid transparent",
                        borderRight: "1px solid rgba(0,0,0,0.04)",
                        background: "transparent",
                        color: selectedRoom === room ? "var(--text-main)" : "var(--text-muted)",
                        fontSize: 13, fontWeight: selectedRoom === room ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                        onMouseOver={e => selectedRoom !== room && (e.currentTarget.style.color = "#fff")}
                        onMouseOut={e => selectedRoom !== room && (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                  {/* Sub-categories */}
                  <div style={{ padding: 20, display: "flex", gap: 10, flexWrap: "wrap", alignContent: "flex-start", minHeight: 100 }}>
                    {FURNITURE_CATEGORIES.filter(c => c.room === selectedRoom).map(cat => (
                      <button key={cat.id} onClick={() => setCategory(cat.id)} className="hover-lift" style={{
                        padding: "9px 14px", borderRadius: 12,
                        border: category === cat.id ? "2px solid var(--accent)" : "1px solid var(--surface-border)",
                        background: category === cat.id ? "rgba(152,166,255,0.1)" : "rgba(0,0,0,0.02)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                        color: category === cat.id ? "#fff" : "var(--text-muted)",
                        fontSize: 13, fontWeight: category === cat.id ? 700 : 500,
                        boxShadow: category === cat.id ? "0 4px 15px rgba(152,166,255,0.2)" : "none",
                      }}>
                        <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                    {FURNITURE_CATEGORIES.filter(c => c.room === selectedRoom).length === 0 && (
                      <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 14 }}>해당 카테고리 준비 중입니다.</div>
                    )}
                  </div>
                </div>
                {category && (() => {
                  const spec = ASSET_SPECS[category] || DEFAULT_SPEC;
                  return (
                    <>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#076ee8" }}>
                        선택: {FURNITURE_CATEGORIES.find(c => c.id === category)?.icon} {FURNITURE_CATEGORIES.find(c => c.id === category)?.room} &gt; {FURNITURE_CATEGORIES.find(c => c.id === category)?.label}
                      </div>
                      <div style={{
                        marginTop: 12, padding: "16px 20px", borderRadius: 14,
                        background: "rgba(7,110,232,0.05)", border: "1px solid rgba(7,110,232,0.15)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em" }}>어셋 규격 / 제작 규칙</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>(프로토타입 — 추후 정식 데이터 적용 예정)</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 20 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>📐 규격</div>
                            {Object.entries(spec.size).map(([k, v]) => (
                              <div key={k} style={{ fontSize: 12, color: "var(--text-lighter)", marginBottom: 5, display: "flex", gap: 8 }}>
                                <span style={{ color: "var(--text-muted)", fontWeight: 700, minWidth: 18 }}>{k}</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>⚙️ 제작 규칙</div>
                            {spec.rules.map((r, i) => (
                              <div key={i} style={{ fontSize: 12, color: "var(--text-lighter)", marginBottom: 5, display: "flex", gap: 6, alignItems: "flex-start" }}>
                                <span style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }}>·</span>
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>🔗 상호작용</div>
                            {spec.interactions.map((r, i) => (
                              <div key={i} style={{ fontSize: 12, color: "var(--text-lighter)", marginBottom: 5, display: "flex", gap: 6, alignItems: "flex-start" }}>
                                <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>·</span>
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {spec.hint && (
                          <div style={{
                            marginTop: 12, paddingTop: 10,
                            borderTop: "1px solid rgba(0,0,0,0.05)",
                            fontSize: 11, color: "var(--text-muted)",
                            display: "flex", gap: 6, alignItems: "flex-start",
                          }}>
                            <span style={{ color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>✦</span>
                            <span><span style={{ color: "var(--primary)", fontWeight: 600 }}>프롬프트 자동 반영:</span> {spec.hint}</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Style Preset */}
              <div style={{ marginBottom: 40 }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-lighter)", display: "block", marginBottom: 16 }}>
                  스타일 프리셋
                </label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {STYLE_PRESETS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStylePreset(s.id)}
                      className="hover-lift"
                      style={{
                        padding: "10px 24px", borderRadius: 24,
                        border: stylePreset === s.id ? "2px solid var(--accent)" : "1px solid var(--surface-border)",
                        background: stylePreset === s.id ? "rgba(152,166,255,0.1)" : "rgba(0,0,0,0.02)",
                        cursor: "pointer", transition: "all 0.3s",
                        display: "flex", alignItems: "center", gap: 10,
                        color: stylePreset === s.id ? "#fff" : "var(--text-muted)", fontSize: 14, fontWeight: 600,
                        boxShadow: stylePreset === s.id ? "0 4px 15px rgba(152,166,255,0.2)" : "none",
                      }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: s.color, boxShadow: "0 2px 5px rgba(0,0,0,0.08)" }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div style={{ marginBottom: 40 }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-lighter)", display: "block", marginBottom: 16 }}>
                  디자인 설명 (프롬프트) <span style={{ color: "var(--accent)" }}>*</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="원하는 가구의 스타일, 소재, 색상, 특징 등을 자세히 설명해주세요.&#10;예: 스칸디나비안 미니멀 원목 책상, 슬림한 원형 다리, 화이트 오크 소재, 서랍 2개, 깔끔한 실루엣"
                  style={{
                    width: "100%", minHeight: 140, padding: 20,
                    borderRadius: 16, border: "2px solid var(--surface-border)",
                    background: "rgba(0,0,0,0.06)", color: "var(--text-main)",
                    fontSize: 15, lineHeight: 1.6, resize: "vertical",
                    outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box", transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.boxShadow = "0 0 20px rgba(99, 102, 241, 0.2)";
                    e.target.style.background = "rgba(0,0,0,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--surface-border)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "rgba(0,0,0,0.06)";
                  }}
                />
              </div>

              {/* Reference Images */}
              <div style={{ marginBottom: 48 }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-lighter)", display: "block", marginBottom: 16 }}>
                  레퍼런스 이미지 (선택, 최대 5장)
                </label>
                <ImageUploader images={refImages} onImagesChange={setRefImages} />
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
                  무드보드, 기존 제품 사진, 스케치 등을 업로드하면 스타일과 형태를 참조합니다.
                </p>
              </div>

              {/* Variant Count Selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-lighter)", display: "block", marginBottom: 12 }}>
                  시안 개수
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginLeft: 8 }}>
                    — 동일 프롬프트로 생성할 변주 개수 (Gemini 호출 {variantCount}회)
                  </span>
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[1, 2, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setVariantCount(n)}
                      style={{
                        padding: "10px 22px", borderRadius: 12,
                        background: variantCount === n
                          ? "linear-gradient(135deg, var(--primary), var(--secondary))"
                          : "rgba(0,0,0,0.04)",
                        border: variantCount === n
                          ? "none"
                          : "1px solid var(--surface-border)",
                        color: variantCount === n ? "#fff" : "var(--text-lighter)",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: variantCount === n ? "0 4px 14px var(--primary-glow)" : "none",
                        minWidth: 56,
                      }}
                    >
                      {n}개
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => generateDesigns()}
                  disabled={!category || !prompt || loading}
                  className={(!category || !prompt || loading) ? "" : "btn-primary"}
                  style={{
                    width: "100%", maxWidth: 600, padding: "20px 40px",
                    borderRadius: 20,
                    background: (!category || !prompt || loading)
                      ? "var(--surface-color)"
                      : "",
                    border: (!category || !prompt || loading) ? "1px solid var(--surface-border)" : "none",
                    color: (!category || !prompt || loading) ? "var(--text-muted)" : "#fff",
                    fontSize: 18, fontWeight: 800,
                    cursor: (!category || !prompt || loading) ? "not-allowed" : "pointer",
                    letterSpacing: "0.05em",
                    boxShadow: (!category || !prompt || loading) ? "none" : "0 10px 30px var(--primary-glow)",
                  }}
                >
                  {loading ? "🎨 백그라운드에서 생성 중…" : `시안 ${variantCount}개 생성하기 ✨`}
                </button>
                {loading && (
                  <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-muted)" }}>
                    우측 하단 작업 큐에서 진행률을 확인할 수 있습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Design Gallery ═══ */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <h2 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>디자인 시안</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
                  생성된 {designs.length}개의 시안을 확인하고 팀 투표를 진행하세요.
                </p>
              </div>
              <button
                onClick={() => generateDesigns({ keepActive: true })}
                className="hover-lift glass-panel"
                style={{
                  padding: "12px 24px", borderRadius: 14,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-lighter)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#fff"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--text-lighter)"; }}
              >
                <span style={{ fontSize: 16 }}>🔄</span> 재생성
              </button>
            </div>

            {/* Enhanced prompt display */}
            {enhancedPrompt && (
              <div className="glass-panel" style={{
                padding: 24, borderRadius: 16,
                background: "linear-gradient(135deg, rgba(7,110,232,0.05), rgba(139,92,246,0.02))",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                marginBottom: 32,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px rgba(152,166,255,0.8)" }} />
                  <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.05em" }}>
                    AI 프롬프트 최적화 완료
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "var(--text-lighter)", lineHeight: 1.7, fontWeight: 400 }}>
                  {enhancedPrompt}
                </div>
              </div>
            )}

            {/* Design Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24, marginBottom: 40,
            }}>
              {designs.map((design, i) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  index={i}
                  selected={selectedDesign === i}
                  onClick={() => setDetailDesign({ ...design, _index: i })}
                />
              ))}
            </div>

            {/* Next button */}
            {designs.length > 0 && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => {
                    // 1개만 생성된 경우 투표는 의미 없으니 건너뛰고 자동 선정 → 시안 선정 스텝.
                    if (designs.length === 1) {
                      setSelectedDesign(0);
                      setStep(3);
                    } else {
                      setSelectedDesign(null);
                      setStep(2);
                    }
                  }}
                  className="btn-primary"
                  style={{
                    width: "100%", maxWidth: 600, padding: "20px 40px",
                    borderRadius: 20,
                    border: "none",
                    color: "#fff",
                    fontSize: 18, fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    boxShadow: "0 10px 30px var(--primary-glow)",
                  }}
                >
                  {designs.length === 1 ? "이 시안으로 진행하기 →" : "투표 시작하기 🗳️"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: Voting ═══ */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>디자인 시안 투표</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
                팀원들이 선호하는 시안에 투표하세요. 복수 선택이 가능합니다.
              </p>
            </div>

            {/* Voter name input */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 20, marginBottom: 32 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-lighter)", whiteSpace: "nowrap" }}>
                  투표자 이름
                </label>
                <input
                  value={currentVoter}
                  onChange={(e) => setCurrentVoter(e.target.value)}
                  placeholder="이름을 입력하세요"
                  style={{
                    flex: 1, padding: "12px 20px", borderRadius: 12,
                    border: "2px solid var(--surface-border)", background: "rgba(0,0,0,0.06)",
                    color: "var(--text-main)", fontSize: 15, outline: "none",
                    fontFamily: "inherit", transition: "all 0.3s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--surface-border)"; }}
                />
              </div>
            </div>

            {/* Design Grid with vote badges */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24, marginBottom: 32,
            }}>
              {designs.map((design, i) => (
                <div
                  key={design.id}
                  onClick={() => {
                    if (!currentVoter.trim()) return;
                    setCurrentVotes(prev =>
                      prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i]
                    );
                  }}
                  className={currentVotes.includes(i) ? "" : "hover-lift glass-panel"}
                  style={{
                    borderRadius: 20, overflow: "hidden",
                    border: currentVotes.includes(i) ? "2px solid var(--accent)" : "1px solid var(--surface-border)",
                    cursor: currentVoter.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: currentVotes.includes(i) ? "scale(1.03)" : "scale(1)",
                    boxShadow: currentVotes.includes(i) ? "0 0 35px rgba(34, 211, 238, 0.4)" : "0 8px 32px rgba(0,0,0,0.06)",
                    background: currentVotes.includes(i) ? "rgba(34, 211, 238, 0.03)" : "var(--surface-color)",
                    position: "relative",
                    opacity: currentVoter.trim() ? 1 : 0.6,
                  }}
                >
                  <div style={{ aspectRatio: "1", position: "relative", overflow: "hidden" }}>
                    {design.imageUrl ? (
                      <img src={design.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        background: design.gradient || `linear-gradient(${135 + i * 30}deg, #1e293b, #334155)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <div style={{
                          width: "60%", height: "60%", borderRadius: 16,
                          background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 54,
                        }}>
                          {design.icon}
                        </div>
                      </div>
                    )}
                    {/* Vote count badge */}
                    {(votes[i] || 0) > 0 && (
                      <div className="vote-badge" style={{
                        position: "absolute", top: 12, left: 12,
                        minWidth: 32, height: 32, borderRadius: 16,
                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800, color: "#fff",
                        padding: "0 10px",
                        boxShadow: "0 4px 15px var(--primary-glow)",
                      }}>
                        {votes[i]}표
                      </div>
                    )}
                    {currentVotes.includes(i) && (
                      <div style={{
                        position: "absolute", top: 12, right: 12,
                        width: 32, height: 32, borderRadius: "50%",
                        background: "var(--accent)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 18, color: "#000", fontWeight: 800,
                        boxShadow: "0 4px 15px rgba(34, 211, 238, 0.5)",
                      }}>✓</div>
                    )}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "50px 20px 16px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>시안 {i + 1}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "monospace" }}>Seed: {design.seed}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vote button */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <button
                onClick={() => {
                  if (!currentVoter.trim() || currentVotes.length === 0) return;
                  const newVotes = { ...votes };
                  currentVotes.forEach(idx => {
                    newVotes[idx] = (newVotes[idx] || 0) + 1;
                  });
                  setVotes(newVotes);
                  setVoters(prev => [...prev, { name: currentVoter.trim(), votes: [...currentVotes] }]);
                  setCurrentVoter("");
                  setCurrentVotes([]);
                }}
                disabled={!currentVoter.trim() || currentVotes.length === 0}
                className={(!currentVoter.trim() || currentVotes.length === 0) ? "" : "btn-primary"}
                style={{
                  padding: "16px 48px", borderRadius: 16,
                  background: (!currentVoter.trim() || currentVotes.length === 0) ? "var(--surface-color)" : "",
                  border: (!currentVoter.trim() || currentVotes.length === 0) ? "1px solid var(--surface-border)" : "none",
                  color: (!currentVoter.trim() || currentVotes.length === 0) ? "var(--text-muted)" : "#fff",
                  fontSize: 16, fontWeight: 800,
                  cursor: (!currentVoter.trim() || currentVotes.length === 0) ? "not-allowed" : "pointer",
                  boxShadow: (!currentVoter.trim() || currentVotes.length === 0) ? "none" : "0 8px 25px var(--primary-glow)",
                }}
              >
                투표하기
              </button>
            </div>

            {/* Voting history panel */}
            {voters.length > 0 && (
              <div className="glass-panel" style={{ padding: 32, borderRadius: 20, marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-lighter)", marginBottom: 20 }}>
                  투표 현황 ({voters.length}명 참여)
                </h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {voters.map((voter, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "12px 16px", borderRadius: 12,
                      background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800, color: "#fff",
                      }}>
                        {voter.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>{voter.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          선택: {voter.votes.map(v => `시안 ${v + 1}`).join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close voting button */}
            {voters.length > 0 && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary"
                  style={{
                    width: "100%", maxWidth: 600, padding: "20px 40px",
                    borderRadius: 20, border: "none", color: "#fff",
                    fontSize: 18, fontWeight: 800, cursor: "pointer",
                    letterSpacing: "0.05em",
                    boxShadow: "0 10px 30px var(--primary-glow)",
                  }}
                >
                  투표 마감하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 4: Vote Results & Selection ═══ */}
        {step === 3 && (
          <div style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>투표 결과</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
                {voters.length}명이 참여한 투표 결과입니다.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40 }}>
              {/* Bar chart */}
              <div className="glass-panel" style={{ padding: 32, borderRadius: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-lighter)", marginBottom: 24 }}>득표 현황</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  {designs.map((design, i) => {
                    const maxVotes = Math.max(...designs.map((_, idx) => votes[idx] || 0), 1);
                    const voteCount = votes[i] || 0;
                    const maxVote = Math.max(...designs.map((_, idx) => votes[idx] || 0));
                    const isWinner = voteCount > 0 && voteCount === maxVote;
                    const winnerCount = designs.filter((_, idx) => (votes[idx] || 0) === maxVote && maxVote > 0).length;
                    const isTied = winnerCount > 1 && isWinner;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 80, fontSize: 14, fontWeight: 700, color: isWinner ? "var(--accent)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                          시안 {i + 1}
                        </div>
                        <div style={{ flex: 1, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.04)", overflow: "hidden", position: "relative" }}>
                          <div className="vote-bar-fill" style={{
                            width: `${maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0}%`,
                            height: "100%", borderRadius: 8,
                            background: isWinner
                              ? "linear-gradient(90deg, var(--accent), rgba(152,166,255,0.6))"
                              : "linear-gradient(90deg, var(--primary), rgba(7,110,232,0.4))",
                            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: isWinner ? "0 0 15px rgba(152,166,255,0.4)" : "none",
                          }} />
                        </div>
                        <div style={{ width: 48, fontSize: 16, fontWeight: 800, color: isWinner ? "var(--accent)" : "var(--text-main)", textAlign: "right" }}>
                          {voteCount}
                        </div>
                        {isWinner && !isTied && <span style={{ fontSize: 16 }}>🏆</span>}
                        {isTied && <span style={{ fontSize: 14, color: "var(--accent)" }}>동점</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right panel */}
              <div>
                {/* Winner highlight */}
                {(() => {
                  const maxVote = Math.max(...designs.map((_, idx) => votes[idx] || 0));
                  const winners = designs.map((_, idx) => idx).filter(idx => (votes[idx] || 0) === maxVote && maxVote > 0);
                  const isTied = winners.length > 1;
                  return (
                    <div className="glass-panel" style={{
                      padding: 32, borderRadius: 24, marginBottom: 24,
                      border: "1px solid rgba(152,166,255,0.3)",
                      background: "linear-gradient(135deg, rgba(152,166,255,0.1), rgba(7,110,232,0.05))",
                    }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-lighter)", marginBottom: 16 }}>
                        {isTied ? "동점 — 시안을 선택하세요" : "1위 시안"}
                      </h3>
                      {isTied ? (
                        <div style={{ display: "grid", gap: 12 }}>
                          {winners.map(idx => (
                            <button
                              key={idx}
                              onClick={() => setSelectedDesign(idx)}
                              className={selectedDesign === idx ? "" : "hover-lift"}
                              style={{
                                padding: "16px 20px", borderRadius: 16,
                                background: selectedDesign === idx ? "rgba(152,166,255,0.15)" : "rgba(0,0,0,0.02)",
                                border: selectedDesign === idx ? "2px solid var(--accent)" : "1px solid var(--surface-border)",
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                                color: "var(--text-main)", fontSize: 15, fontWeight: 700,
                                transition: "all 0.3s",
                              }}
                            >
                              <span style={{ fontSize: 24 }}>{designs[idx]?.icon}</span>
                              시안 {idx + 1} ({maxVote}표)
                              {selectedDesign === idx && <span style={{ marginLeft: "auto", color: "var(--accent)" }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      ) : winners.length > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{
                            width: 64, height: 64, borderRadius: 16,
                            background: designs[winners[0]]?.gradient || "#1a1a2e",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 32, border: "2px solid var(--accent)",
                            boxShadow: "0 0 20px rgba(152,166,255,0.3)",
                          }}>
                            {designs[winners[0]]?.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>시안 {winners[0] + 1} 🏆</div>
                            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{maxVote}표 획득</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: "var(--text-muted)" }}>투표 결과가 없습니다.</div>
                      )}
                    </div>
                  );
                })()}

                {/* Voter summary */}
                <div className="glass-panel" style={{ padding: 32, borderRadius: 24, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-lighter)", marginBottom: 16 }}>투표자별 선택 내역</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {voters.map((voter, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 10,
                        background: "rgba(0,0,0,0.02)", fontSize: 13,
                      }}>
                        <span style={{ fontWeight: 700, color: "var(--text-main)", minWidth: 60 }}>{voter.name}</span>
                        <span style={{ color: "var(--text-muted)" }}>→</span>
                        <span style={{ color: "var(--text-lighter)" }}>
                          {voter.votes.map(v => `시안 ${v + 1}`).join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm button */}
                {(() => {
                  const maxVote = Math.max(...designs.map((_, idx) => votes[idx] || 0));
                  const winners = designs.map((_, idx) => idx).filter(idx => (votes[idx] || 0) === maxVote && maxVote > 0);
                  const isTied = winners.length > 1;
                  const isDisabled = isTied && selectedDesign === null;
                  return (
                    <button
                      onClick={() => {
                        if (winners.length === 1) {
                          setSelectedDesign(winners[0]);
                        }
                        const finalSelection = winners.length === 1 ? winners[0] : selectedDesign;
                        if (finalSelection !== null) {
                          setSelectedDesign(finalSelection);
                          setStep(4);
                        }
                      }}
                      disabled={isDisabled}
                      className={isDisabled ? "" : "btn-primary"}
                      style={{
                        width: "100%", padding: "20px 40px", borderRadius: 20,
                        background: isDisabled ? "var(--surface-color)" : "",
                        border: isDisabled ? "1px solid var(--surface-border)" : "none",
                        color: isDisabled ? "var(--text-muted)" : "#fff",
                        fontSize: 18, fontWeight: 800,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        letterSpacing: "0.05em",
                        boxShadow: isDisabled ? "none" : "0 10px 30px var(--primary-glow)",
                      }}
                    >
                      선정 확정
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 5: Refinement ═══ */}
        {step === 4 && (
          <div style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <h2 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>시안 확인 및 디테일 수정</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>
              선택한 시안의 디테일을 확인하고, 멀티뷰 생성을 위한 추가 지시사항을 입력하세요.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
              {/* Selected design preview */}
              <div>
                <div className="glass-panel hover-lift" style={{
                  aspectRatio: "1", borderRadius: 24, overflow: "hidden",
                  border: "1px solid var(--surface-border)", position: "relative",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                }}>
                  {designs[selectedDesign]?.imageUrl ? (
                    <img src={designs[selectedDesign].imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: designs[selectedDesign]?.gradient || "#1a1a2e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: "50%", height: "50%", borderRadius: 32,
                        background: "rgba(0,0,0,0.04)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        backdropFilter: "blur(12px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 96, boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
                      }}>
                        {designs[selectedDesign]?.icon}
                      </div>
                    </div>
                  )}
                  <div style={{
                    position: "absolute", top: 20, left: 20,
                    padding: "8px 16px", borderRadius: 12,
                    background: "rgba(152,166,255,0.9)",
                    backdropFilter: "blur(4px)",
                    fontSize: 14, fontWeight: 800, color: "#000",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                  }}>
                    선택된 시안 {selectedDesign + 1}
                  </div>
                </div>

                {/* Color palette */}
                <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                  {designs[selectedDesign]?.colors?.map((c, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div className="hover-lift glass-panel" style={{
                        height: 48, borderRadius: 12, background: c,
                        border: "1px solid rgba(0,0,0,0.1)",
                        cursor: "pointer",
                      }} />
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontFamily: "monospace", fontWeight: 600 }}>{c}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback panel */}
              <div>
                <div className="glass-panel" style={{
                  padding: 32, borderRadius: 24,
                  border: "1px solid var(--surface-border)",
                  marginBottom: 24,
                }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-lighter)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--accent)" }}>■</span> 시안 정보 요약
                  </h3>
                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>카테고리</div>
                      <div style={{ fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 18 }}>{FURNITURE_CATEGORIES.find((c) => c.id === category)?.icon}</span>
                        {FURNITURE_CATEGORIES.find((c) => c.id === category)?.label}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>스타일</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{STYLE_PRESETS.find((s) => s.id === stylePreset)?.label || "커스텀"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>프롬프트</div>
                      <div style={{ fontSize: 14, color: "var(--text-lighter)", lineHeight: 1.6, background: "rgba(0,0,0,0.04)", padding: 12, borderRadius: 8 }}>{prompt}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>생성 시드</div>
                      <div style={{ fontSize: 14, fontFamily: "monospace", color: "var(--accent)" }}>{designs[selectedDesign]?.seed}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: 32, borderRadius: 24 }}>
                  <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-lighter)", display: "block", marginBottom: 12 }}>
                    디테일 수정 요청 (선택)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="멀티뷰 생성 시 반영할 추가 디테일을 입력하세요.&#10;예: 다리를 더 가늘게, 등받이 각도를 살짝 더 기울이게 등..."
                    style={{
                      width: "100%", minHeight: 120, padding: 20,
                      borderRadius: 16, border: "2px solid rgba(0,0,0,0.06)",
                      background: "rgba(0,0,0,0.06)", color: "var(--text-main)",
                      fontSize: 15, lineHeight: 1.6, resize: "vertical",
                      outline: "none", fontFamily: "inherit",
                      boxSizing: "border-box", transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.background = "rgba(0,0,0,0.6)";
                      e.target.style.boxShadow = "0 0 15px rgba(7,110,232,0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(0,0,0,0.06)";
                      e.target.style.background = "rgba(0,0,0,0.06)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
                  <button
                    onClick={() => setStep(1)}
                    className="hover-lift glass-panel"
                    style={{
                      flex: 1, padding: "16px 24px", borderRadius: 16,
                      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                      color: "var(--text-lighter)", fontSize: 15, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--text-lighter)"; }}
                  >
                    ← 시안 다시 선택
                  </button>
                  <button
                    onClick={generateConceptSheet}
                    className="btn-primary"
                    style={{
                      flex: 2, padding: "16px 24px", borderRadius: 16,
                      border: "none", color: "#fff",
                      fontSize: 15, fontWeight: 800, cursor: "pointer",
                      boxShadow: "0 8px 25px var(--primary-glow)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    컨셉시트 최종 생성 완료 🛠️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 6: Concept Sheet Result ═══ */}
        {(step === 5 || step === 6) && (
          <div style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <h2 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
              {step === 5 ? "컨셉시트 생성 완료" : "에셋 파이프라인 전달 완료"}
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>
              {step === 5 ? "생성된 고해상도 컨셉시트를 확인하고 다운로드하세요." : "컨셉시트가 성공적으로 전달되었습니다."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 40 }}>
              {/* Concept sheet preview */}
              <div>
                <div className="glass-panel" style={{
                  borderRadius: 24, overflow: "hidden",
                  border: "1px solid var(--surface-border)",
                  background: "rgba(0,0,0,0.08)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                }}>
                  {conceptSheet ? (
                    <img src={conceptSheet} alt="Concept Sheet" style={{ width: "100%", display: "block" }} />
                  ) : (
                    <div style={{ padding: 100, textAlign: "center", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>🖼️</div>
                      컨셉시트 렌더링 중...
                    </div>
                  )}
                </div>
              </div>

              {/* Actions panel */}
              <div>
                <div className="glass-panel" style={{
                  padding: 32, borderRadius: 24,
                  border: "1px solid var(--surface-border)",
                  marginBottom: 24,
                }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-lighter)", marginBottom: 20 }}>📋 에셋 메타데이터</h3>
                  <div style={{ display: "grid", gap: 14, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>해상도</span>
                      <span style={{ fontWeight: 600 }}>2400 × 3200<small>px</small></span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>포맷</span>
                      <span style={{ fontWeight: 600, color: "var(--accent)" }}>PNG</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>카테고리</span>
                      <span style={{ fontWeight: 600 }}>{FURNITURE_CATEGORIES.find((c) => c.id === category)?.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>스타일</span>
                      <span style={{ fontWeight: 600 }}>{STYLE_PRESETS.find((s) => s.id === stylePreset)?.label || "-"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>Gen 시드</span>
                      <span style={{ fontFamily: "monospace", color: "var(--primary)" }}>{designs[selectedDesign]?.seed}</span>
                    </div>
                  </div>
                </div>

                {/* View slots */}
                <div className="glass-panel" style={{
                  padding: 32, borderRadius: 24,
                  border: "1px solid var(--surface-border)",
                  marginBottom: 24,
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-lighter)", marginBottom: 16 }}>포함된 렌더링 뷰</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {VIEW_ANGLES.map((v) => (
                      <div key={v.id} style={{
                        padding: "10px 14px", borderRadius: 12,
                        background: "rgba(0,0,0,0.04)", fontSize: 13, color: "var(--text-main)",
                        display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
                        border: "1px solid rgba(0,0,0,0.04)",
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
                        {v.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "grid", gap: 12 }}>
                  <button
                    onClick={downloadConceptSheet}
                    className="btn-primary hover-lift"
                    style={{
                      width: "100%", padding: "18px 24px", borderRadius: 16,
                      border: "none", color: "#fff",
                      fontSize: 16, fontWeight: 800, cursor: "pointer",
                      boxShadow: "0 4px 20px var(--primary-glow)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📥</span> 고해상도 파일 다운로드 (PNG)
                  </button>

                  <button
                    onClick={() => {
                      const data = {
                        category, stylePreset, prompt, enhancedPrompt,
                        selectedDesign, seed: designs[selectedDesign]?.seed,
                        colors: designs[selectedDesign]?.colors,
                        feedback, timestamp: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.download = `inzoi_metadata_${Date.now()}.json`;
                      link.href = url;
                      link.click();
                    }}
                    className="hover-lift"
                    style={{
                      width: "100%", padding: "16px 24px", borderRadius: 16,
                      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                      color: "var(--text-lighter)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      transition: "all 0.3s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  >
                    <span style={{ fontSize: 18 }}>📋</span> 에셋 메타데이터 백업 (JSON)
                  </button>

                  {step === 5 && (
                    <button
                      onClick={async () => {
                        const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === category);
                        const styleInfo = STYLE_PRESETS.find((s) => s.id === stylePreset);
                        const design = designs[selectedDesign] || {};
                        const newId = Date.now();
                        const newItem = {
                          id: newId,
                          category: category,
                          categoryLabel: catInfo?.label || category,
                          categoryIcon: catInfo?.icon || "🏠",
                          style: styleInfo?.label || "커스텀",
                          prompt: prompt,
                          seed: design.seed || 0,
                          colors: design.colors || ["#666"],
                          gradient: design.gradient || "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1e293b 100%)",
                          imageUrl: design.imageUrl || null,
                          conceptSheetUrl: conceptSheet || null,
                          completedAt: new Date().toISOString(),
                          voters: voters.length || 1,
                          winner: `시안 ${(selectedDesign || 0) + 1}`,
                        };
                        const finishedJobId = activeJobId;

                        // [v1.5.7] legacy /completed POST 제거 — cards 만 SOT 로 저장.
                        // 2) 서버 저장 확정 후 로컬 반영
                        setCompletedList((prev) => [newItem, ...prev]);
                        // prev ref 에도 등록해서 debounce effect 가 중복 POST 하지 않도록.
                        prevCompletedRef.current = [newItem, ...prevCompletedRef.current];

                        // 3) 새 카드 시스템에도 이중 저장 (Phase B-2). 실패해도
                        //    기존 completedList 에는 이미 저장되어 UX 영향 없음.
                        if (projectSlug) {
                          try {
                            const cardBody = {
                              id: `comp-${newItem.id}`,
                              title: newItem.categoryLabel || newItem.category || "완료 아이템",
                              description: newItem.prompt,
                              thumbnail_url: newItem.conceptSheetUrl || newItem.imageUrl,
                              status_key: "done",
                              data: {
                                source: "completed",
                                asset_code: newItem.assetCode,
                                category: newItem.category,
                                category_label: newItem.categoryLabel,
                                category_icon: newItem.categoryIcon,
                                style: newItem.style,
                                prompt: newItem.prompt,
                                seed: newItem.seed,
                                colors: newItem.colors,
                                gradient: newItem.gradient,
                                voters: newItem.voters,
                                winner: newItem.winner,
                                pipeline_status: newItem.pipelineStatus,
                                designer: newItem.designer,
                                concept_sheet_url: newItem.conceptSheetUrl,
                                image_url: newItem.imageUrl,
                              },
                              actor: actorName || null,
                              confirmed_at: newItem.completedAt,
                              confirmed_by: newItem.designer || actorName || null,
                            };
                            const rCard = await fetch(`/api/projects/${projectSlug}/cards`, {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify(cardBody),
                            });
                            if (rCard.ok) {
                              const created = await rCard.json();
                              // 즉시 cards state 에 반영 → derived completedList 에 바로 나타남.
                              setCards((prev) => {
                                if (prev.find((c) => c.id === created.id)) return prev;
                                return [created, ...prev];
                              });
                            }
                          } catch (e) { console.warn("card 이중 저장 실패 (무시):", e); }
                        }

                        setNewItemId(newId);
                        setStep(6);
                        setTimeout(() => {
                          setActiveTab("completed");
                          removeJob(finishedJobId);
                        }, 1200);
                      }}
                      className="hover-lift"
                      style={{
                        width: "100%", padding: "18px 24px", borderRadius: 16,
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.4))",
                        border: "1px solid rgba(16, 185, 129, 0.5)",
                        color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        marginTop: 12, boxShadow: "0 4px 20px rgba(16, 185, 129, 0.2)",
                      }}
                    >
                      🚀 파이프라인으로 전송 완료
                    </button>
                  )}
                </div>

                {step === 6 && (
                  <div style={{
                    marginTop: 24, padding: 32, borderRadius: 24,
                    background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)",
                    textAlign: "center", backdropFilter: "blur(8px)",
                    animation: "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#34d399", letterSpacing: "0.02em" }}>에셋 전송 완료!</div>
                    <div style={{ fontSize: 14, color: "#6ee7b7", marginTop: 8, fontWeight: 500 }}>
                      컨셉시트가 모델링 파이프라인 대기열에 등록되었습니다.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* API Status Note */}
      {step === 0 && (
        <div style={{
          margin: "0 40px 40px", padding: 20, borderRadius: 12,
          background: geminiApiKey ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
          border: `1px solid ${geminiApiKey ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          maxWidth: 1600, marginLeft: "auto", marginRight: "auto",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: geminiApiKey ? "#10b981" : "#ef4444", marginBottom: 8 }}>
            {geminiApiKey
              ? (claudeApiKey
                  ? "✅ Gemini (나노바나나2) + Claude API 모두 연결됨 — 프롬프트 자동 최적화 활성"
                  : "✅ 나노바나나2 (Gemini 3.1 Flash Image) API 연결됨")
              : "⚠️ API 키를 설정해주세요"}
            {/* v1.10.70 — source 라벨 */}
            {geminiApiKey && (
              <span style={{
                marginLeft: 10, fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: 8,
                background: geminiSource === "personal" ? "rgba(7,110,232,0.12)" : "rgba(34,197,94,0.12)",
                color: geminiSource === "personal" ? "var(--primary)" : "#15803d",
              }}>
                {geminiSource === "personal" ? "👤 개인 키" : "🏢 팀 기본값"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
            {geminiApiKey
              ? (claudeApiKey
                  ? "Gemini 로 이미지 생성 + Claude 로 프롬프트 자동 최적화. 두 API 모두 정상 동작 중."
                  : "나노바나나2 (Gemini 3.1 Flash Image)로 실제 이미지를 생성합니다. Claude API 키를 추가하면 프롬프트 자동 최적화도 활성화됩니다.")
              : <>상단 <strong>API 설정</strong> 버튼을 눌러 Gemini API 키를 입력하세요. 팀 운영자가 서버에 기본 키를 설정해두면 자동으로 적용됩니다.</>
            }
          </div>
        </div>
      )}

      </>} {/* end workflow tabs (create / vote / sheet) */}

      {/* ═══ Completed Tab ═══ */}
      {activeTab === "completed" && (
        <main style={{ padding: "20px 40px 60px", maxWidth: 1600, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
          {/* v1.10.86 — 헤더 상하 폭 축소 + 카운트 제목 옆으로 인라인. */}
          <div style={{
            position: "sticky", top: 64, zIndex: 50,
            background: "var(--bg-color)", paddingTop: 2, paddingBottom: 2,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <h2 className="text-gradient" style={{ fontSize: 22, fontWeight: 800 }}>✅ 완료</h2>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {completedList.length > 0 ? `${completedList.length}개` : "완료된 시트가 없습니다"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <CardScaleSelect value={cardScale} onChange={setCardScale} />
                <SortSelect value={sortBy} onChange={setSortBy} />
                <button
                  onClick={() => setActiveTab("progress")}
                  className="btn-primary hover-lift"
                  style={{
                    padding: "12px 24px", borderRadius: 14, border: "none",
                    color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 4px 20px var(--primary-glow)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <span>✨</span> 새 시안
                </button>
              </div>
            </div>
            {completedList.length > 0 && (() => {
              const completedCards = completedList
                .map((item) => cards.find((c) => c.id === item._cardId))
                .filter(Boolean);
              const chips = collectUpdateChips(completedCards);
              return (
                <UpdateChipBar
                  chips={chips}
                  selected={selectedUpdates}
                  onChange={setSelectedUpdates}
                  totalCount={completedList.length}
                  onRename={renameUpdateTag}
                />
              );
            })()}
            {viewMode === "list" && completedList.length > 0 && (
              <CardListHeader tabId="completed" sortBy={sortBy} onSortChange={setSortBy} scale={cardScale} />
            )}
          </div>

          {completedList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>📭</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>완료된 시트가 없습니다</div>
              <button onClick={() => setActiveTab("progress")} className="btn-primary" style={{
                padding: "12px 28px", borderRadius: 14, border: "none",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
                첫 시안 만들기
              </button>
            </div>
          ) : (() => {
            const filterItem = (item) => {
              const card = cards.find((c) => c.id === item._cardId);
              return card && matchesUpdateFilter(card, selectedUpdates);
            };
            const visibleList = completedList.filter(filterItem);
            return (
              <>
                {viewMode === "list" ? (
                  <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {sortCardArray(
                        visibleList, sortBy, "completedAt", "categoryLabel",
                        (item) => enrichedCards.find((c) => c.id === item._cardId)
                      ).map((item) => {
                        const card = enrichedCards.find((c) => c.id === item._cardId);
                        if (!card) return null;
                        return (
                          <CardListRow
                            key={item._cardId}
                            card={card}
                            tabId="completed"
                            scale={cardScale}
                            profileByName={profileByName}
                            projectSlug={projectSlug}
                            actor={actorName}
                            lists={lists}
                            availableUpdates={availableUpdates}
                            onSaved={async () => {
                              const d = await fetchCardDetail(projectSlug, card.id);
                              if (d) {
                                setCards((prev) => prev.map((x) => x.id === d.id ? d : x));
                                setDetailCard((prev) => (prev && prev.id === d.id) ? d : prev);
                              }
                            }}
                            onClick={async () => {
                              if (!projectSlug) return;
                              try {
                                const detail = await fetchCardDetail(projectSlug, card.id);
                                if (detail) setDetailCard(detail);
                              } catch { /* 무시 */ }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(240 * cardScale)}px, 1fr))`, gap: 16 }}>
                    {sortCardArray(visibleList, sortBy, "completedAt", "categoryLabel").map((item) => {
                  const card = cards.find((c) => c.id === item._cardId);
                  if (!card) return null;
                  return (
                    <CardHubCard
                      key={item._cardId}
                      card={card}
                      tabId="completed"
                      scale={cardScale}
                      onClick={async () => {
                        if (!projectSlug) return;
                        try {
                          const detail = await fetchCardDetail(projectSlug, card.id);
                          if (detail) setDetailCard(detail);
                        } catch { /* 무시 */ }
                      }}
                    />
                  );
                })}
                  </div>
                )}
              </>
            );
          })()}
        </main>
      )}

      {/* ═══ Wishlist Tab ═══ */}
      {activeTab === "wishlist" && (
        <main style={{ padding: "20px 40px 60px", maxWidth: 1600, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
          {/* 제목 ~ 업데이트 chip 까지 sticky. v1.10.54 — 좌/우 끝 통일. v1.10.86 — 상하 폭 축소 + 카운트 인라인. */}
          <div style={{
            position: "sticky", top: 64, zIndex: 50,
            background: "var(--bg-color)", paddingTop: 2, paddingBottom: 2,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <h2 className="text-gradient" style={{ fontSize: 22, fontWeight: 800 }}>⭐ 위시</h2>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {wishlist.length > 0 ? `${wishlist.length}개` : "만들고 싶은 가구 아이디어를 기록하세요."}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <CardScaleSelect value={cardScale} onChange={setCardScale} />
                <SortSelect value={sortBy} onChange={setSortBy} />
                <button
                  onClick={() => setWishAddOpen(true)}
                  className="hover-lift"
                  style={{
                    padding: "12px 22px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #eab308, #f59e0b)",
                    color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    boxShadow: "0 4px 14px rgba(234,179,8,0.3)",
                  }}
                >＋ 새 위시</button>
              </div>
            </div>
            {wishlist.length > 0 && (() => {
              const wishCards = wishlist
                .map((item) => cards.find((c) => c.id === item._cardId))
                .filter(Boolean);
              const chips = collectUpdateChips(wishCards);
              return (
                <UpdateChipBar
                  chips={chips}
                  selected={selectedUpdates}
                  onChange={setSelectedUpdates}
                  totalCount={wishlist.length}
                  onRename={renameUpdateTag}
                />
              );
            })()}
            {viewMode === "list" && wishlist.length > 0 && (
              <CardListHeader tabId="wishlist" sortBy={sortBy} onSortChange={setSortBy} scale={cardScale} />
            )}
          </div>

          <div>
              {wishlist.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>💫</div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>만들고 싶은 가구 아이디어를 추가해보세요</div>
                  <button
                    onClick={() => setWishAddOpen(true)}
                    style={{
                      padding: "10px 20px", borderRadius: 10, border: "none",
                      background: "linear-gradient(135deg, #eab308, #f59e0b)",
                      color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}
                  >＋ 첫 아이디어 추가</button>
                </div>
              ) : (() => {
                const filterItem = (item) => {
                  const card = cards.find((c) => c.id === item._cardId);
                  return card && matchesUpdateFilter(card, selectedUpdates);
                };
                const visibleList = wishlist.filter(filterItem);
                return (
                  <>
                    {viewMode === "list" ? (
                      <div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {sortCardArray(
                            visibleList, sortBy, "createdAt", "title",
                            (item) => enrichedCards.find((c) => c.id === item._cardId)
                          ).map((item) => {
                            const card = enrichedCards.find((c) => c.id === item._cardId);
                            if (!card) return null;
                            return (
                              <CardListRow
                                key={item._cardId}
                                card={card}
                                tabId="wishlist"
                                scale={cardScale}
                                profileByName={profileByName}
                                projectSlug={projectSlug}
                                actor={actorName}
                                lists={lists}
                                availableUpdates={availableUpdates}
                                onSaved={async () => {
                                  const d = await fetchCardDetail(projectSlug, card.id);
                                  if (d) {
                                    setCards((prev) => prev.map((x) => x.id === d.id ? d : x));
                                    setDetailCard((prev) => (prev && prev.id === d.id) ? d : prev);
                                  }
                                }}
                                onClick={async () => {
                                  if (!projectSlug) return;
                                  try {
                                    const detail = await fetchCardDetail(projectSlug, card.id);
                                    if (detail) setDetailCard(detail);
                                  } catch { /* 무시 */ }
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(240 * cardScale)}px, 1fr))`, gap: 16 }}>
                        {sortCardArray(visibleList, sortBy, "createdAt", "title").map((item) => {
                    const card = cards.find((c) => c.id === item._cardId);
                    if (!card) return null;
                    return (
                      <CardHubCard
                        key={item._cardId}
                        card={card}
                        tabId="wishlist"
                        scale={cardScale}
                        onClick={async () => {
                          if (!projectSlug) return;
                          try {
                            const detail = await fetchCardDetail(projectSlug, card.id);
                            if (detail) setDetailCard(detail);
                          } catch { /* 무시 */ }
                        }}
                      />
                    );
                  })}
                      </div>
                    )}
                  </>
                );
              })()}
          </div>
        </main>
      )}

      {/* 새 아이디어 추가 모달 — 위시리스트 탭에서 헤더 버튼으로 오픈 */}
      {wishAddOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setWishAddOpen(false)} style={{ zIndex: 210 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 560, maxWidth: "94vw", maxHeight: "92vh",
            background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
            border: "1px solid var(--surface-border)", borderRadius: 18, zIndex: 211,
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--surface-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)" }}>⭐ 새 위시 추가</div>
              <button
                onClick={() => setWishAddOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 16, cursor: "pointer",
                }}
              >✕</button>
            </div>
            <div style={{ padding: "20px 22px", overflow: "auto", flex: 1 }}>
              <input
                type="text"
                placeholder="제목 (예: 라탄 행잉 체어)"
                value={wishTitle}
                onChange={(e) => setWishTitle(e.target.value)}
                autoFocus
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  background: "#fff", border: "1px solid var(--surface-border)",
                  color: "var(--text-main)", fontSize: 14, outline: "none",
                  marginBottom: 10, boxSizing: "border-box",
                }}
              />
              <textarea
                placeholder="메모 (참고 사항, 원하는 스타일 등)"
                value={wishNote}
                onChange={(e) => setWishNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  background: "#fff", border: "1px solid var(--surface-border)",
                  color: "var(--text-main)", fontSize: 14, outline: "none",
                  marginBottom: 14, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <input
                  ref={wishImageRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    for (const file of files) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setWishImages((prev) => prev.length >= 4 ? prev : [...prev, ev.target.result]);
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => wishImageRef.current?.click()}
                  disabled={wishImages.length >= 4}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
                    cursor: wishImages.length >= 4 ? "not-allowed" : "pointer",
                    opacity: wishImages.length >= 4 ? 0.5 : 1,
                  }}
                >🖼️ 이미지 첨부 ({wishImages.length}/4)</button>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  또는 <kbd style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(0,0,0,0.06)", border: "1px solid var(--surface-border)", fontFamily: "monospace", fontSize: 10 }}>Ctrl+V</kbd> 로 붙여넣기 (여러 번)
                </span>
              </div>
              {wishImages.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  {wishImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={img} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid var(--surface-border)" }} />
                      <button
                        onClick={() => setWishImages((prev) => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: "absolute", top: -6, right: -6,
                          width: 18, height: 18, borderRadius: 9,
                          background: "rgba(239,68,68,0.95)", color: "#fff",
                          border: "1px solid #fff", fontSize: 10, cursor: "pointer", lineHeight: 1,
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 22px", borderTop: "1px solid var(--surface-border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setWishAddOpen(false)}
                style={{
                  padding: "10px 18px", borderRadius: 10,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >취소</button>
              <button
                onClick={async () => {
                  if (!wishTitle.trim()) return;
                  const gradients = [
                    "linear-gradient(135deg, #2e2a1a 0%, #3d2f1e 50%, #1a2e2a 100%)",
                    "linear-gradient(135deg, #2e1a2a 0%, #1a2e3e 50%, #2a2e1a 100%)",
                    "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1e293b 100%)",
                    "linear-gradient(135deg, #14120f 0%, #3d2f1e 50%, #14120f 100%)",
                  ];
                  const uploaded = await Promise.all(wishImages.map((d) => uploadDataUrl(d)));
                  const primary = uploaded[0] || null;
                  const item = {
                    id: Date.now(),
                    title: wishTitle.trim(),
                    note: wishNote.trim(),
                    imageUrl: primary,
                    gradient: gradients[Math.floor(Math.random() * gradients.length)],
                    createdAt: new Date().toISOString(),
                  };
                  setWishlist((prev) => [item, ...prev]);
                  prevWishlistRef.current = [item, ...prevWishlistRef.current];

                  if (projectSlug) {
                    let ok = false;
                    try {
                      const rCard = await fetch(`/api/projects/${projectSlug}/cards`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          id: `wish-${item.id}`,
                          title: item.title,
                          description: item.note,
                          thumbnail_url: item.imageUrl,
                          status_key: "wishlist",
                          data: { source: "wishlist", gradient: item.gradient, ref_images: uploaded },
                          actor: actorName || null,
                        }),
                      });
                      if (rCard.ok) {
                        const created = await rCard.json();
                        setCards((prev) => (prev.find((c) => c.id === created.id) ? prev : [created, ...prev]));
                        ok = true;
                      } else {
                        const body = await rCard.text();
                        alert(`위시리스트 저장 실패 (서버 ${rCard.status}).\n${body.slice(0, 200)}`);
                      }
                    } catch (e) {
                      alert("위시리스트 저장 실패 — 서버 연결 확인 필요.\n" + e.message);
                    }
                    if (!ok) return;
                  }

                  setWishTitle("");
                  setWishNote("");
                  setWishImages([]);
                  if (wishImageRef.current) wishImageRef.current.value = "";
                  setWishAddOpen(false);
                }}
                disabled={!wishTitle.trim()}
                style={{
                  padding: "10px 22px", borderRadius: 10, border: "none",
                  background: wishTitle.trim() ? "linear-gradient(135deg, #eab308, #f59e0b)" : "rgba(0,0,0,0.08)",
                  color: wishTitle.trim() ? "#000" : "var(--text-muted)",
                  fontSize: 13, fontWeight: 700,
                  cursor: wishTitle.trim() ? "pointer" : "not-allowed",
                }}
              >추가하기</button>
            </div>
          </div>
        </>
      )}

      {/* API Settings Modal */}
      {showApiSettings && (
        <>
          <div className="sidebar-overlay" onClick={() => setShowApiSettings(false)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520, maxWidth: "90vw",
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--surface-border)",
            borderRadius: 24, zIndex: 202,
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <div style={{
              padding: "24px 28px 16px", borderBottom: "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)" }}>API 설정</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  이미지 생성에 필요한 API 키를 입력하세요
                </div>
              </div>
              <button
                onClick={() => setShowApiSettings(false)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "24px 28px 28px" }}>
              {/* v1.10.71 — 팀 / 개인 키 source 안내. 키는 절대 클라이언트에 노출 안됨. */}
              <div style={{
                marginBottom: 20, padding: "10px 14px", borderRadius: 10,
                background: serverConfig.gemini || serverConfig.claude
                  ? "rgba(7,110,232,0.06)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${serverConfig.gemini || serverConfig.claude
                  ? "rgba(7,110,232,0.2)" : "var(--surface-border)"}`,
                fontSize: 12, color: "var(--text-lighter)", lineHeight: 1.6,
              }}>
                {serverConfig.gemini || serverConfig.claude ? (
                  <>
                    🔒 <strong>팀 키가 서버에서 관리</strong>됩니다 — 모든 AI 호출은 서버 프록시 경유, 키는 클라이언트에 노출되지 않습니다 ·
                    Gemini {serverConfig.gemini ? "✓" : "—"} / Claude {serverConfig.claude ? "✓" : "—"}
                    <div style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 11 }}>
                      개인 키 입력 = 서버에 헤더로 전달해 그 키로 호출. 빈 칸 = 팀 키 사용.
                    </div>
                  </>
                ) : (
                  <>⚠️ 서버 .env 에 키가 설정되지 않았습니다. 운영자가 GEMINI_API_KEY 를 .env 에 등록해야 사용 가능합니다.</>
                )}
              </div>
              {/* Gemini API Key */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "#fff",
                    background: "linear-gradient(135deg, #4285f4, #34a853)",
                    padding: "2px 8px", borderRadius: 6,
                  }}>필수</span>
                  <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text-lighter)" }}>
                    Google Gemini API Key
                  </label>
                  <span style={{
                    marginLeft: "auto", fontSize: 10, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 8,
                    background: geminiSource === "personal" ? "rgba(7,110,232,0.12)"
                      : geminiSource === "server" ? "rgba(34,197,94,0.12)"
                      : "rgba(239,68,68,0.12)",
                    color: geminiSource === "personal" ? "var(--primary)"
                      : geminiSource === "server" ? "#15803d"
                      : "#ef4444",
                  }}>
                    {geminiSource === "personal" ? "👤 개인 키"
                      : geminiSource === "server" ? "🏢 팀 기본값"
                      : "❌ 미설정"}
                  </span>
                </div>
                <input
                  type="password"
                  value={personalGeminiKey}
                  onChange={(e) => setPersonalGeminiKey(e.target.value)}
                  placeholder={serverConfig.gemini ? "(비워두면 팀 기본값 사용)" : "AIza..."}
                  style={{
                    width: "100%", padding: "14px 18px", borderRadius: 12,
                    border: "2px solid var(--surface-border)", background: "rgba(0,0,0,0.04)",
                    color: "var(--text-main)", fontSize: 14, outline: "none",
                    fontFamily: "monospace", boxSizing: "border-box", transition: "all 0.3s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--surface-border)"; }}
                />
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
                  Google AI Studio에서 발급받으세요.
                </div>

                {/* Model selection */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <button
                      onClick={async () => {
                        if (!geminiApiKey) { alert("API 키를 먼저 입력하세요."); return; }
                        setLoadingModels(true);
                        try {
                          const models = await listGeminiImageModels(geminiApiKey);
                          setAvailableModels(models);
                          if (models.length === 0) alert("이미지 생성 가능한 모델을 찾지 못했습니다.");
                        } catch (err) {
                          alert(`모델 조회 실패: ${err.message}`);
                        } finally {
                          setLoadingModels(false);
                        }
                      }}
                      style={{
                        padding: "8px 14px", borderRadius: 8,
                        background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                        color: "var(--text-lighter)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {loadingModels ? "조회 중..." : "사용 가능한 모델 조회"}
                    </button>
                  </div>

                  {availableModels.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                      {availableModels.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedModel(m.id)}
                          style={{
                            padding: "10px 14px", borderRadius: 10, textAlign: "left",
                            background: selectedModel === m.id ? "rgba(7,110,232,0.1)" : "rgba(0,0,0,0.03)",
                            border: selectedModel === m.id ? "2px solid var(--primary)" : "1px solid var(--surface-border)",
                            color: selectedModel === m.id ? "var(--primary)" : "var(--text-main)",
                            fontSize: 13, fontWeight: selectedModel === m.id ? 700 : 500,
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                        >
                          <div>{m.displayName}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginTop: 2 }}>{m.id}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{
                    marginTop: 8, padding: "8px 12px", borderRadius: 8,
                    background: "rgba(0,0,0,0.03)", fontSize: 12, color: "var(--text-muted)",
                    fontFamily: "monospace",
                  }}>
                    현재 모델: <strong style={{ color: "var(--primary)" }}>{selectedModel}</strong>
                  </div>
                </div>
              </div>

              {/* Claude API Key */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "var(--text-muted)",
                    background: "rgba(0,0,0,0.06)",
                    padding: "2px 8px", borderRadius: 6, border: "1px solid var(--surface-border)",
                  }}>선택</span>
                  <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text-lighter)" }}>
                    Anthropic Claude API Key
                  </label>
                  <span style={{
                    marginLeft: "auto", fontSize: 10, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 8,
                    background: claudeSource === "personal" ? "rgba(7,110,232,0.12)"
                      : claudeSource === "server" ? "rgba(34,197,94,0.12)"
                      : "rgba(0,0,0,0.06)",
                    color: claudeSource === "personal" ? "var(--primary)"
                      : claudeSource === "server" ? "#15803d"
                      : "var(--text-muted)",
                  }}>
                    {claudeSource === "personal" ? "👤 개인 키"
                      : claudeSource === "server" ? "🏢 팀 기본값"
                      : "— 미설정"}
                  </span>
                </div>
                <input
                  type="password"
                  value={personalClaudeKey}
                  onChange={(e) => setPersonalClaudeKey(e.target.value)}
                  placeholder={serverConfig.claude ? "(비워두면 팀 기본값 사용)" : "sk-ant-..."}
                  style={{
                    width: "100%", padding: "14px 18px", borderRadius: 12,
                    border: "2px solid var(--surface-border)", background: "rgba(0,0,0,0.04)",
                    color: "var(--text-main)", fontSize: 14, outline: "none",
                    fontFamily: "monospace", boxSizing: "border-box", transition: "all 0.3s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--surface-border)"; }}
                />
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
                  프롬프트 최적화에 사용됩니다. 없으면 기본 프롬프트로 생성합니다.
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={() => {
                  // v1.10.70 — 빈 값이면 localStorage 키 제거 (= 팀 기본값 사용).
                  if (personalGeminiKey.trim()) localStorage.setItem("gemini_api_key", personalGeminiKey.trim());
                  else localStorage.removeItem("gemini_api_key");
                  if (personalClaudeKey.trim()) localStorage.setItem("claude_api_key", personalClaudeKey.trim());
                  else localStorage.removeItem("claude_api_key");
                  localStorage.setItem("gemini_model", selectedModel);
                  setShowApiSettings(false);
                }}
                className="btn-primary"
                style={{
                  width: "100%", padding: "16px", borderRadius: 14,
                  border: "none", color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 20px var(--primary-glow)",
                }}
              >
                저장
              </button>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
                개인 키는 브라우저 로컬 스토리지에만 저장됩니다 · 팀 기본값은 서버 환경변수에서 제공
              </div>

              {/* v1.10.89 — API 사용량 (현재 프로필 기준).
                  v1.10.90 — Top 5 + 프로필 선택 + 기간 + 탭 뷰 */}
              <ApiUsagePanel currentActor={actorName} profiles={profiles} />
            </div>
          </div>
        </>
      )}

      {/* Archive Modal — 아카이브된 카드 목록 (Phase F) */}
      {archiveOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setArchiveOpen(false)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 900, maxWidth: "94vw", maxHeight: "88vh",
            background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
            border: "1px solid var(--surface-border)", borderRadius: 20, zIndex: 202,
            boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <div style={{
              padding: "16px 24px", borderBottom: "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>🗄️ 아카이브</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  보관 처리된 카드 {archivedCards.length}개. 복구하려면 카드를 열어서 상태를 변경하세요.
                </div>
              </div>
              <button
                onClick={() => setArchiveOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                }}
              >✕</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
              {archivedCards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📭</div>
                  <div style={{ fontSize: 14 }}>아카이브된 카드가 없습니다.</div>
                </div>
              ) : (
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12,
                }}>
                  {archivedCards.map((c) => {
                    const list = lists.find((l) => l.id === c.list_id);
                    const meta = STATUS_META[list?.status_key || "wishlist"];
                    return (
                      <div
                        key={c.id}
                        onClick={async () => {
                          setArchiveOpen(false);
                          try {
                            await patchCard(projectSlug, c.id, { is_archived: false, force: true, actor: actorName });
                            const detail = await fetchCardDetail(projectSlug, c.id);
                            const restored = detail || { ...c, is_archived: 0 };
                            setCards((prev) => {
                              const without = prev.filter((x) => x.id !== restored.id);
                              return [restored, ...without];
                            });
                            setArchivedCards((prev) => prev.filter((x) => x.id !== restored.id));
                            const restoredList = lists.find((l) => l.id === restored.list_id);
                            const tabMap = { wishlist: "wishlist", drafting: "create", sheet: "sheet", done: "completed" };
                            setActiveTab(tabMap[restoredList?.status_key] || "wishlist");
                            if (detail) setDetailCard(detail);
                          } catch (e) { alert("복구 실패: " + e.message); }
                        }}
                        className="hover-lift"
                        style={{
                          padding: 14, borderRadius: 12,
                          background: "rgba(0,0,0,0.02)", border: "1px solid var(--surface-border)",
                          cursor: "pointer", opacity: 0.85,
                        }}
                      >
                        {c.thumbnail_url && (
                          <div style={{ width: "100%", height: 100, borderRadius: 8, overflow: "hidden", marginBottom: 10, background: "#000" }}>
                            <img src={c.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(40%)" }} />
                          </div>
                        )}
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {meta?.icon} {meta?.label} · {formatLocalTime(c.updated_at, "date")}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--primary)", marginTop: 6, fontWeight: 600 }}>
                          클릭하여 복구
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Card Detail Modal (Phase D) — 통합 카드 상세. 상태 이동, 댓글, 이력 */}
      {detailCard && (() => {
        const card = detailCard;
        const list = lists.find((l) => l.id === card.list_id);
        const statusKey = list?.status_key || "wishlist";
        const meta = STATUS_META[statusKey] || STATUS_META.wishlist;
        const confirmed = !!card.confirmed_at;

        // v1.10.78 — 진행 중 탭으로 통합되어 drafting/sheet 모두 progress 로 매핑.
        const STATUS_TO_TAB = { wishlist: "wishlist", drafting: "progress", sheet: "progress", done: "completed" };
        const moveTo = async (newStatusKey) => {
          if (!projectSlug) return;
          try {
            const patch = { status_key: newStatusKey, actor: actorName };
            if (newStatusKey === "done" && !card.confirmed_at) {
              patch.confirmed_at = new Date().toISOString();
              patch.confirmed_by = actorName;
            }
            const updated = await patchCard(projectSlug, card.id, patch);
            const detail = await fetchCardDetail(projectSlug, card.id);
            if (detail) setDetailCard(detail);
            setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            // 카드가 다른 단계로 이동했으면 사용자도 그 탭으로 데려간다.
            const targetTab = STATUS_TO_TAB[newStatusKey];
            if (targetTab && targetTab !== activeTab) setActiveTab(targetTab);
          } catch (e) {
            alert("상태 이동 실패: " + e.message);
          }
        };

        const submitComment = async (body) => {
          if (!body.trim() || !projectSlug) return;
          try {
            await postCardComment(projectSlug, card.id, body.trim(), actorName);
            const detail = await fetchCardDetail(projectSlug, card.id);
            if (detail) setDetailCard(detail);
          } catch (e) { alert("댓글 추가 실패: " + e.message); }
        };

        return (
          <>
            <div className="sidebar-overlay" onClick={() => setDetailCard(null)} />
            <div style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              // v1.10.78 — 폭 1440 → 1600. 우측 프레임이 시안 그리드 1열(160px) 추가 수용.
              width: 1600, maxWidth: "96vw", maxHeight: "94vh",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--surface-border)",
              borderRadius: 20, zIndex: 202,
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              {/* Header — 상태 아이콘 프리픽스 제거 (v1.10.30) */}
              <div style={{
                padding: "14px 24px", borderBottom: "1px solid var(--surface-border)",
                display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CardTitleEditor
                      card={card}
                      projectSlug={projectSlug}
                      actor={actorName}
                      disabled={confirmed}
                      onSaved={async () => {
                        const d = await fetchCardDetail(projectSlug, card.id);
                        if (d) {
                          setDetailCard(d);
                          setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                        }
                      }}
                    />
                    {confirmed && <span style={{ fontSize: 11, color: "#22c55e", whiteSpace: "nowrap" }}>🔒 잠김</span>}
                    {/* 카드 딥링크 복사 (v1.10.24) — 제목 옆 아주 작게 */}
                    <CardShareLink slug={projectSlug} cardId={card.id} />
                    {/* 갤러리 캔버스 진입 (v1.10.26) — 단축키 F */}
                    <button
                      onClick={() => setGalleryOpen(true)}
                      title="이 카드의 모든 이미지 갤러리 (단축키: F)"
                      style={{
                        padding: "2px 6px", borderRadius: 6,
                        background: "transparent", border: "1px solid var(--surface-border)",
                        color: "var(--text-muted)", fontSize: 10, fontWeight: 700, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 3, lineHeight: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: 11 }}>🖼</span>
                      갤러리
                      <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "monospace", opacity: 0.7 }}>F</span>
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", paddingLeft: 8 }}>
                    {meta.label} · 수정 {card.updated_at?.slice(0, 16).replace("T", " ") || "-"}
                  </div>
                </div>
                {/* 상태 드롭다운 */}
                <select
                  value={statusKey}
                  onChange={(e) => moveTo(e.target.value)}
                  disabled={confirmed}
                  style={{
                    padding: "8px 14px", borderRadius: 10,
                    border: "1px solid var(--surface-border)",
                    background: "rgba(0,0,0,0.03)",
                    color: "var(--text-main)", fontSize: 13, fontWeight: 600,
                    cursor: confirmed ? "not-allowed" : "pointer",
                  }}
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.status_key}>
                      {l.icon} {l.name}
                    </option>
                  ))}
                </select>
                {/* 재오픈 (컨펌된 카드만) */}
                {confirmed && (
                  <button
                    onClick={async () => {
                      if (!confirm("이 카드를 재오픈하시겠어요? 잠금이 풀리고 편집 가능해집니다.")) return;
                      try {
                        await patchCard(projectSlug, card.id, {
                          confirmed_at: null, confirmed_by: null,
                          force: true, actor: actorName,
                        });
                        const detail = await fetchCardDetail(projectSlug, card.id);
                        if (detail) setDetailCard(detail);
                        setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, confirmed_at: null, confirmed_by: null } : c));
                      } catch (e) { alert("재오픈 실패: " + e.message); }
                    }}
                    style={{
                      padding: "8px 12px", borderRadius: 10,
                      background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)",
                      color: "#d97706", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                    title="컨펌 해제 (편집 가능 상태로 되돌리기)"
                  >🔓 재오픈</button>
                )}
                {/* v1.10.58 — 카드 복제 (어셋 정보 + 프롬프트 + 참조 이미지 가져오고 시안/시트는 비움) */}
                <button
                  onClick={async () => {
                    if (!confirm(`"${card.title}" 을 복제하시겠어요?\n어셋 정보·프롬프트·참조 이미지는 가져오고 시안/시트는 비웁니다.`)) return;
                    try {
                      const newId = `card-${Date.now()}`;
                      const src = card.data || {};
                      // 시안/시트 관련 필드는 제외, 나머지 메타는 복사.
                      const { designs, concept_sheet_views, concept_sheet_history, concept_sheet_url,
                              selected_design, image_url, cardVotes, ...meta } = src;
                      const newData = { ...meta };
                      const r = await fetch(`/api/projects/${projectSlug}/cards`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          id: newId,
                          title: `${card.title} (복제)`,
                          description: card.description || null,
                          status_key: "drafting",
                          data: newData,
                          thumbnail_url: (newData.ref_images && newData.ref_images[0]) || null,
                          actor: actorName || null,
                        }),
                      });
                      if (!r.ok) throw new Error(`복제 실패 ${r.status}`);
                      const created = await r.json();
                      setCards((prev) => [created, ...prev]);
                      const detail = await fetchCardDetail(projectSlug, created.id);
                      if (detail) setDetailCard(detail);
                    } catch (e) { alert("복제 실패: " + e.message); }
                  }}
                  style={{
                    padding: "8px 12px", borderRadius: 10,
                    background: "rgba(7,110,232,0.08)", border: "1px solid rgba(7,110,232,0.25)",
                    color: "var(--primary)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                  title="비슷한 컨셉으로 새 카드 시작 (시안/시트 비움)"
                >📋 복제</button>

                {/* 영구 삭제 — 아카이브와 구분되는 복구 불가 작업 */}
                <button
                  onClick={async () => {
                    if (!confirm(`"${card.title}" 카드를 영구 삭제하시겠어요?\n아카이브와 달리 복구할 수 없습니다.`)) return;
                    try {
                      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, { method: "DELETE" });
                      setCards((prev) => prev.filter((c) => c.id !== card.id));
                      setArchivedCards((prev) => prev.filter((c) => c.id !== card.id));
                      setDetailCard(null);
                    } catch (e) { alert("삭제 실패: " + e.message); }
                  }}
                  style={{
                    padding: "8px 12px", borderRadius: 10,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                    color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                  title="영구 삭제 (복구 불가)"
                >🗑️ 삭제</button>

                {/* 아카이브 토글 — 현재 상태에 따라 버튼 라벨/색상이 바뀜 */}
                {card.is_archived ? (
                  <button
                    onClick={async () => {
                      try {
                        await patchCard(projectSlug, card.id, { is_archived: false, force: true, actor: actorName });
                        const detail = await fetchCardDetail(projectSlug, card.id);
                        const restored = detail || { ...card, is_archived: 0 };
                        setCards((prev) => {
                          const without = prev.filter((x) => x.id !== restored.id);
                          return [restored, ...without];
                        });
                        setArchivedCards((prev) => prev.filter((x) => x.id !== restored.id));
                        if (detail) setDetailCard(detail);
                      } catch (e) { alert("복구 실패: " + e.message); }
                    }}
                    style={{
                      padding: "8px 12px", borderRadius: 10,
                      background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)",
                      color: "#15803d", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                    title="아카이브에서 꺼내 원래 단계로 복구"
                  >📤 복구</button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!confirm("이 카드를 아카이브로 옮기시겠어요?")) return;
                      try {
                        await patchCard(projectSlug, card.id, { is_archived: true, force: true, actor: actorName });
                        setCards((prev) => prev.filter((c) => c.id !== card.id));
                        setDetailCard(null);
                      } catch (e) { alert("아카이브 실패: " + e.message); }
                    }}
                    style={{
                      padding: "8px 12px", borderRadius: 10,
                      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                      color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                    title="목록에서 숨김 (아카이브 뷰에서 복구 가능)"
                  >🗄️ 아카이브</button>
                )}
                <button
                  onClick={() => setDetailCard(null)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              </div>

              {/* Body — v1.10.78: 우측이 시안 그리드 1열 더 수용하도록 1fr → 1.3fr 비율 (좌 ≈ 696, 우 ≈ 904). */}
              <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 0 }}>
                {/* 왼쪽: 업데이트 일정 · 우선순위 · 대표이미지 · 어셋정보 (v1.10.7) */}
                <div style={{ padding: 24, borderRight: "1px solid var(--surface-border)" }}>
                  {/* 1) 업데이트 일정 */}
                  <TargetUpdateField
                    card={card}
                    projectSlug={projectSlug}
                    actor={actorName}
                    disabled={confirmed}
                    availableUpdates={availableUpdates}
                    onSaved={(d) => {
                      setDetailCard(d);
                      setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                    }}
                  />

                  {/* 2) 우선순위 */}
                  <PriorityField
                    card={card}
                    projectSlug={projectSlug}
                    actor={actorName}
                    disabled={confirmed}
                    onSaved={(d) => {
                      setDetailCard(d);
                      setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                    }}
                  />

                  {/* 3) 대표이미지 — v1.10.97: 명시 thumbnail_url 우선, 없으면 단일 시안. */}
                  {(() => {
                    const ds = Array.isArray(card.data?.designs) ? card.data.designs : [];
                    const single = ds.length === 1 && ds[0]?.imageUrl ? ds[0].imageUrl : null;
                    const src = card.thumbnail_url || single;
                    return src ? (
                      <div style={{
                        background: "rgba(0,0,0,0.04)", padding: 16, borderRadius: 12,
                        marginBottom: 20, textAlign: "center",
                      }}>
                        <img
                          src={src}
                          alt=""
                          onClick={() => setPreviewImage(src)}
                          style={{
                            maxWidth: "100%", maxHeight: 340, objectFit: "contain",
                            borderRadius: 10, background: "#fff",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                            cursor: "zoom-in",
                          }}
                        />
                      </div>
                    ) : null;
                  })()}

                  {/* 4) 어셋 정보 (카테고리 / 스타일 / 크기 / 카탈로그 매칭 등) */}
                  <AssetInfoEditor
                    card={card}
                    projectSlug={projectSlug}
                    actor={actorName}
                    disabled={confirmed}
                    onOpenImage={setPreviewImage}
                    onOpenCatalog={setCatalogItemId}
                    geminiApiKey={geminiApiKey}
                    availableUpdates={availableUpdates}
                    onRefresh={async () => {
                      const d = await fetchCardDetail(projectSlug, card.id);
                      if (d) {
                        setDetailCard(d);
                        setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                      }
                    }}
                  />

                  {/* 설명 (편집 가능) */}
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6 }}>설명</div>
                  <CardDescriptionEditor
                    card={card}
                    projectSlug={projectSlug}
                    actor={actorName}
                    disabled={confirmed}
                    onSaved={async () => {
                      const d = await fetchCardDetail(projectSlug, card.id);
                      if (d) {
                        setDetailCard(d);
                        setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                      }
                    }}
                  />

                  {card.data && Object.keys(card.data).length > 0 && (
                    <details style={{ marginTop: 20 }}>
                      <summary style={{
                        cursor: "pointer", fontSize: 12, fontWeight: 700,
                        color: "var(--text-muted)", marginBottom: 8,
                      }}>추가 데이터 (data JSON)</summary>
                      <pre style={{
                        padding: 12, borderRadius: 8,
                        background: "rgba(0,0,0,0.03)",
                        fontSize: 11, fontFamily: "monospace", color: "var(--text-lighter)",
                        maxHeight: 200, overflow: "auto",
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>{JSON.stringify(card.data, null, 2)}</pre>
                    </details>
                  )}
                </div>

                {/* 오른쪽: 프롬프트/참조 → 시안 생성 → 시안 이력 → 댓글 → 활동 (v1.10.9) */}
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* 0) 프롬프트 + 참조 이미지 (v1.10.9 — 좌 AssetInfoEditor 에서 이동) */}
                  <PromptRefEditor
                    card={card}
                    projectSlug={projectSlug}
                    actor={actorName}
                    disabled={confirmed}
                    onOpenImage={setPreviewImage}
                    onRefresh={async () => {
                      const d = await fetchCardDetail(projectSlug, card.id);
                      if (d) {
                        setDetailCard(d);
                        setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                      }
                    }}
                  />

                  {/* 1) 시안 생성 — 상태별 액션 (drafting: 생성, vote: 투표, sheet: 4뷰) */}
                  {!confirmed && (
                    <CardActionPanel
                      card={card}
                      statusKey={statusKey}
                      projectSlug={projectSlug}
                      geminiApiKey={geminiApiKey}
                      selectedModel={selectedModel}
                      actor={actorName}
                      onMoveTo={moveTo}
                      onOpenImage={setPreviewImage}
                      onRefresh={async () => {
                        const d = await fetchCardDetail(projectSlug, card.id);
                        if (!d) return;
                        setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                        // 사용자가 생성 도중 모달을 닫았다면 자동으로 다시 열지 않음 (v1.10.23).
                        // 같은 카드가 열려있을 때만 detailCard 갱신.
                        setDetailCard((prev) => (prev && prev.id === d.id) ? d : prev);
                      }}
                      onOpenApiSettings={() => setShowApiSettings(true)}
                      onGenerateProgress={(c, done, total) => setGeneratingCards((prev) => ({
                        ...prev,
                        [c.id]: { title: c.title, thumb: c.thumbnail_url, done, total, completed: false },
                      }))}
                      onGenerateEnd={(c) => setGeneratingCards((prev) => {
                        const cur = prev[c.id];
                        if (!cur) return prev;
                        // v1.10.95 — v1.10.94 의 자동 상세 오픈 롤백. 작업큐의 ✓ 완료 표시 후 사용자가
                        // 클릭해야 상세 열림 (위시에서 시안만 만들고 보는 사용자 경험 방해 X).
                        return { ...prev, [c.id]: { ...cur, completed: true, done: cur.total } };
                      })}
                    />
                  )}

                  {/* 2) 시안 — 생성 + 갤러리 + 선정 + 투표 + 삭제 통합 (v1.10.57: CardActionPanel drafting 흡수) */}
                  <DesignsPanel
                    card={card}
                    projectSlug={projectSlug}
                    actor={actorName}
                    disabled={confirmed}
                    statusKey={statusKey}
                    geminiApiKey={geminiApiKey}
                    selectedModel={selectedModel}
                    onOpenApiSettings={() => setShowApiSettings(true)}
                    onGenerateProgress={(c, done, total) => setGeneratingCards((prev) => ({
                      ...prev,
                      [c.id]: { title: c.title, thumb: c.thumbnail_url, done, total, completed: false },
                    }))}
                    onGenerateEnd={(c) => setGeneratingCards((prev) => {
                      const cur = prev[c.id];
                      if (!cur) return prev;
                      return { ...prev, [c.id]: { ...cur, completed: true, done: cur.total } };
                    })}
                    onOpenImage={setPreviewImage}
                    onRefresh={async () => {
                      const d = await fetchCardDetail(projectSlug, card.id);
                      if (d) {
                        setDetailCard(d);
                        setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                      }
                    }}
                  />

                  {/* 3) 댓글 */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
                      댓글 ({card.comments?.length || 0})
                    </div>
                    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                      {(card.comments || []).map((cm) => (
                        <CommentRow
                          key={cm.id}
                          comment={cm}
                          projectSlug={projectSlug}
                          cardId={card.id}
                          actorName={actorName}
                          profileByName={profileByName}
                          onChanged={async () => {
                            const detail = await fetchCardDetail(projectSlug, card.id);
                            if (detail) setDetailCard(detail);
                          }}
                        />
                      ))}
                      {(!card.comments || card.comments.length === 0) && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                          아직 댓글이 없습니다.
                        </div>
                      )}
                    </div>
                    <CardCommentInput onSubmit={submitComment} disabled={confirmed} currentProfile={currentProfile} />
                  </div>

                  {/* 활동 이력 — 접기/펼치기 지원 (기본 펼침), 한글 액션 라벨 (v1.10.17) */}
                  {(() => {
                    const ACTION_LABEL = {
                      created: "신규",              // 카드 신규 등록
                      designs_added: "시안 생성",    // 시안 이미지 생성 (Gemini)
                      sheet_generated: "시트 생성",  // 컨셉시트 4뷰 생성
                      moved: "상태 이동",
                      field_updated: "필드 수정",
                      comment_added: "댓글 작성",
                      comment_edited: "댓글 수정",
                      comment_deleted: "댓글 삭제",
                      confirmed: "완료",
                      reopened: "재오픈",
                    };
                    return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={() => setActivitiesExpanded((v) => !v)}
                        title={activitiesExpanded ? "접기" : "펼치기"}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "2px 6px", borderRadius: 6,
                          background: "transparent", border: "none",
                          color: "var(--text-muted)", fontSize: 12, fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 10, display: "inline-block", transform: activitiesExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
                        활동 이력 ({card.activities?.length || 0})
                      </button>
                      {activitiesExpanded && card.activities?.length > 0 && (
                        <select
                          value={activityFilter}
                          onChange={(e) => setActivityFilter(e.target.value)}
                          style={{
                            marginLeft: "auto", padding: "3px 8px", borderRadius: 6,
                            border: "1px solid var(--surface-border)", background: "#fff",
                            color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                          }}
                        >
                          <option value="all">모든 액션</option>
                          <option value="designs_added">시안 생성</option>
                          <option value="sheet_generated">시트 생성</option>
                          <option value="moved">상태 이동</option>
                          <option value="field_updated">필드 수정</option>
                          <option value="comment_added">댓글</option>
                          <option value="confirmed">완료/재오픈</option>
                          <option value="created">신규</option>
                        </select>
                      )}
                    </div>
                    {activitiesExpanded && (
                    <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {(card.activities || [])
                        .filter((a) => activityFilter === "all" || a.action === activityFilter ||
                          (activityFilter === "confirmed" && (a.action === "confirmed" || a.action === "reopened")))
                        .map((a) => {
                          const authorProfile = a.actor ? profileByName.get(a.actor) : null;
                          const authorIcon = authorProfile?.icon || (a.actor ? "👤" : "⚙️");
                          const actionLabel = ACTION_LABEL[a.action] || a.action;
                          return (
                            <div key={a.id} style={{
                              display: "flex", alignItems: "flex-start", gap: 8,
                              fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5,
                              padding: "4px 8px", borderRadius: 8,
                              background: "rgba(0,0,0,0.02)",
                            }}>
                              <span
                                title={a.actor || "시스템"}
                                style={{
                                  fontSize: 16, flexShrink: 0, width: 22, height: 22,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  borderRadius: 11,
                                  background: a.actor ? "rgba(7,110,232,0.08)" : "rgba(0,0,0,0.04)",
                                  cursor: "help",
                                }}
                              >{authorIcon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div>
                                  <span style={{ color: "var(--text-lighter)", fontWeight: 600 }}>
                                    {a.actor || "시스템"}
                                  </span>
                                  <span style={{ margin: "0 6px", color: "var(--text-muted)" }}>·</span>
                                  <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{actionLabel}</span>
                                  {a.payload && typeof a.payload === "object" && (
                                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                      {" "}({Object.entries(a.payload).slice(0, 2).map(([k, v]) => `${k}:${typeof v === "object" ? JSON.stringify(v).slice(0, 20) : String(v).slice(0, 20)}`).join(", ")})
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                                  {formatLocalTime(a.created_at, "ymdhm")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {(!card.activities || card.activities.length === 0) && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                          활동 이력 없음.
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Wishlist Detail Modal */}
      {detailWish && (
        <>
          <div className="sidebar-overlay" onClick={() => setDetailWish(null)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 720, maxWidth: "94vw", maxHeight: "92vh",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--surface-border)",
            borderRadius: 20, zIndex: 202,
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 24px", borderBottom: "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 22 }}>⭐</span>
                <div style={{
                  fontSize: 18, fontWeight: 800, color: "var(--text-main)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {detailWish.title}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {detailWish.imageUrl && (
                  <a
                    href={detailWish.imageUrl}
                    download={`wish_${String(detailWish.id)}.png`}
                    style={{
                      padding: "8px 14px", borderRadius: 10,
                      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                      color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
                      textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                    }}
                    title="이미지 로컬 저장"
                  >📥 저장</a>
                )}
                <button
                  onClick={() => {
                    if (confirm("이 아이디어를 삭제하시겠어요?")) {
                      setWishlist(prev => prev.filter(w => w.id !== detailWish.id));
                      setDetailWish(null);
                    }
                  }}
                  style={{
                    padding: "8px 14px", borderRadius: 10,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                    color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >삭제</button>
                <button
                  onClick={() => setDetailWish(null)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              {detailWish.imageUrl ? (
                <div style={{
                  background: "rgba(0,0,0,0.04)", padding: 20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  maxHeight: "52vh",
                }}>
                  <img
                    src={detailWish.imageUrl}
                    alt=""
                    style={{
                      maxWidth: "100%", maxHeight: "48vh", objectFit: "contain",
                      borderRadius: 10, background: "#fff",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                    }}
                  />
                </div>
              ) : detailWish.gradient ? (
                <div style={{ height: 100, background: detailWish.gradient }} />
              ) : null}

              <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6 }}>
                    메모
                  </div>
                  <div style={{
                    fontSize: 14, color: "var(--text-lighter)", lineHeight: 1.8,
                    padding: 14, borderRadius: 12,
                    background: "rgba(0,0,0,0.03)", border: "1px solid var(--surface-border)",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    minHeight: 60,
                  }}>
                    {detailWish.note || "(메모 없음)"}
                  </div>
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
                  fontSize: 12,
                }}>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>ID</div>
                    <code style={{ color: "var(--accent)", fontSize: 13, fontFamily: "monospace" }}>
                      {String(detailWish.id)}
                    </code>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>등록일시</div>
                    <div style={{ color: "var(--text-lighter)", fontSize: 13 }}>
                      {new Date(detailWish.createdAt).toLocaleString("ko-KR")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Design Image Zoom Modal */}
      {detailDesign && (
        <>
          <div className="sidebar-overlay" onClick={() => setDetailDesign(null)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "92vw", maxHeight: "94vh",
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--surface-border)",
            borderRadius: 20, zIndex: 202,
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)" }}>
                  시안 {(detailDesign._index ?? 0) + 1}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontFamily: "monospace" }}>
                  Seed: {detailDesign.seed}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {detailDesign.imageUrl && (
                  <a
                    href={detailDesign.imageUrl}
                    download={`inzoi_design_${detailDesign.seed || Date.now()}.png`}
                    className="btn-primary"
                    style={{
                      padding: "9px 16px", borderRadius: 10,
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      textDecoration: "none",
                      display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 4px 14px var(--primary-glow)",
                    }}
                    title="이미지 로컬 저장 (PNG)"
                  >
                    <span style={{ fontSize: 14 }}>📥</span> 저장
                  </a>
                )}
                <button
                  onClick={() => setDetailDesign(null)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                >✕</button>
              </div>
            </div>
            <div style={{
              flex: 1, overflow: "auto",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.03)", padding: 24,
            }}>
              {detailDesign.imageUrl ? (
                <img
                  src={detailDesign.imageUrl}
                  alt={`design ${(detailDesign._index ?? 0) + 1}`}
                  style={{
                    maxWidth: "100%", maxHeight: "78vh",
                    objectFit: "contain",
                    borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                    background: "#fff",
                  }}
                />
              ) : (
                <div style={{ padding: 80, color: "var(--text-muted)", fontSize: 14 }}>
                  이미지가 아직 준비되지 않았습니다.
                </div>
              )}
            </div>
            {detailDesign.prompt && (
              <div style={{
                padding: "12px 20px", borderTop: "1px solid var(--surface-border)",
                maxHeight: "18vh", overflowY: "auto",
                fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, flexShrink: 0,
              }}>
                <div style={{ fontWeight: 700, color: "var(--text-lighter)", marginBottom: 4 }}>프롬프트</div>
                {detailDesign.prompt}
              </div>
            )}
          </div>
        </>
      )}

      {/* Completed Item Detail Modal */}
      {detailItem && (
        <>
          <div className="sidebar-overlay" onClick={() => setDetailItem(null)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 1200, maxWidth: "95vw", maxHeight: "92vh",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--surface-border)",
            borderRadius: 24, zIndex: 202,
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 28px", borderBottom: "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 32 }}>{detailItem.categoryIcon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)" }}>
                      {detailItem.categoryLabel}
                    </div>
                    {detailItem.assetCode && (
                      <code style={{
                        fontSize: 12, color: "var(--primary)", fontWeight: 700, letterSpacing: "0.04em",
                        background: "rgba(7,110,232,0.07)", padding: "3px 10px", borderRadius: 6,
                      }}>
                        {detailItem.assetCode}
                      </code>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
                    {detailItem.style}
                    {detailItem.designer && ` · 담당 ${detailItem.designer}`}
                    {` · ${new Date(detailItem.completedAt).toLocaleDateString("ko-KR")}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{
              display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 0,
              overflowY: "auto", flex: 1,
            }}>
              {/* Image */}
              <div style={{
                padding: 24, borderRight: "1px solid var(--surface-border)",
                background: detailItem.gradient || "linear-gradient(135deg, #1a1a2e, #2d1b4e)",
                display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420,
              }}>
                {detailItem.conceptSheetUrl || detailItem.imageUrl ? (
                  <img
                    src={detailItem.conceptSheetUrl || detailItem.imageUrl}
                    alt=""
                    style={{
                      width: "100%", maxHeight: "72vh", objectFit: "contain",
                      borderRadius: 12, background: "#fff",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 128, opacity: 0.4 }}>{detailItem.categoryIcon}</span>
                )}
              </div>

              {/* Details */}
              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
                {detailItem.pipelineStatus && (() => {
                  const statusColor = detailItem.pipelineStatus.includes("완료") ? "#22c55e"
                    : detailItem.pipelineStatus.includes("진행") ? "#f59e0b"
                    : detailItem.pipelineStatus.includes("대기") ? "#94a3b8"
                    : "var(--text-muted)";
                  return (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "6px 12px", borderRadius: 10, alignSelf: "flex-start",
                      background: `${statusColor}15`, border: `1px solid ${statusColor}40`,
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                        {detailItem.pipelineStatus}
                      </span>
                    </div>
                  );
                })()}

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                  padding: 16, borderRadius: 14, background: "rgba(0,0,0,0.03)",
                  border: "1px solid var(--surface-border)",
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 4 }}>선정 시안</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--primary)" }}>{detailItem.winner}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 4 }}>투표 인원</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)" }}>{detailItem.voters}명</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 8 }}>
                    프롬프트
                  </div>
                  <div style={{
                    fontSize: 13, color: "var(--text-lighter)", lineHeight: 1.8,
                    padding: 14, borderRadius: 12,
                    background: "rgba(0,0,0,0.03)", border: "1px solid var(--surface-border)",
                  }}>
                    {detailItem.prompt}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 8 }}>
                    컬러 팔레트
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {detailItem.colors.map((c, ci) => (
                      <div key={ci} style={{ flex: 1 }}>
                        <div style={{ height: 40, borderRadius: 8, background: c, border: "1px solid rgba(0,0,0,0.06)" }} />
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace", marginTop: 4, textAlign: "center" }}>{c}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                  fontSize: 12,
                }}>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Seed</div>
                    <code style={{ color: "var(--accent)", fontSize: 13 }}>{detailItem.seed}</code>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>완료일시</div>
                    <div style={{ color: "var(--text-lighter)", fontSize: 13 }}>
                      {new Date(detailItem.completedAt).toLocaleString("ko-KR")}
                    </div>
                  </div>
                </div>

                {(detailItem.conceptSheetUrl || detailItem.imageUrl) && (
                  <a
                    href={detailItem.conceptSheetUrl || detailItem.imageUrl}
                    download={`inzoi_${detailItem.category}_${detailItem.id}.png`}
                    className="btn-primary hover-lift"
                    style={{
                      marginTop: "auto",
                      padding: "14px 20px", borderRadius: 14,
                      color: "#fff", fontSize: 14, fontWeight: 700,
                      textDecoration: "none", textAlign: "center",
                      boxShadow: "0 4px 20px var(--primary-glow)",
                    }}
                  >
                    📥 이미지 다운로드
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Version Info Modal */}
      {versionOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setVersionOpen(false)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480, maxWidth: "90vw", maxHeight: "80vh",
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--surface-border)",
            borderRadius: 24, zIndex: 202,
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{
              padding: "24px 28px 16px", borderBottom: "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)" }}>
                  inZOI Asset Studio
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  버전 {APP_VERSION}
                </div>
              </div>
              <button
                onClick={() => setVersionOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-lighter)", marginBottom: 16 }}>
                변경내역
              </div>
              {CHANGELOG.map((entry, idx) => (
                <div key={entry.version} style={{
                  marginBottom: 20,
                  paddingBottom: idx < CHANGELOG.length - 1 ? 20 : 0,
                  borderBottom: idx < CHANGELOG.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: idx === 0 ? "var(--accent)" : "var(--text-lighter)",
                      background: idx === 0 ? "rgba(152,166,255,0.1)" : "rgba(0,0,0,0.04)",
                      border: idx === 0 ? "1px solid rgba(152,166,255,0.25)" : "1px solid var(--surface-border)",
                      padding: "3px 10px", borderRadius: 8,
                    }}>
                      v{entry.version}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{entry.date}</span>
                    {idx === 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: "#fff",
                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                        padding: "2px 8px", borderRadius: 6,
                      }}>
                        최신
                      </span>
                    )}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {entry.changes.map((change, ci) => (
                      <li key={ci} style={{
                        fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8,
                        listStyleType: "disc",
                      }}>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Legacy sidebar removed */}
      {false && <>
      <div style={{ display: "none" }}>
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid var(--surface-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
              {sidebarTab === "completed" ? "완료된 컨셉시트" : "위시리스트"}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
            >
              ✕
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "completed", label: "완료 목록", icon: "📋", count: completedList.length },
              { key: "wishlist", label: "위시리스트", icon: "⭐", count: wishlist.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSidebarTab(tab.key)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: "10px 10px 0 0",
                  background: sidebarTab === tab.key ? "rgba(0,0,0,0.05)" : "transparent",
                  border: "none", borderBottom: sidebarTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                  color: sidebarTab === tab.key ? "var(--text-main)" : "var(--text-muted)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                {tab.label}
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 8,
                  background: sidebarTab === tab.key ? "rgba(7,110,232,0.2)" : "rgba(0,0,0,0.05)",
                  color: sidebarTab === tab.key ? "#84c5ff" : "var(--text-muted)",
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Content */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>

          {/* ─── Completed Tab ─── */}
          {sidebarTab === "completed" && (
            completedList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>완료된 컨셉시트가 없습니다</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {completedList.map((item) => (
                  <div
                    key={item.id}
                    className="sidebar-item"
                    onClick={async () => {
                    // 새 cards 테이블 먼저 시도. item._cardId 로 실제 카드 id 사용
                    // (comp- 접두사 중복 이슈 방지). 없으면 예전 모달로 폴백.
                    if (projectSlug) {
                      const cardId = item._cardId || `comp-${item.id}`;
                      try {
                        const detail = await fetchCardDetail(projectSlug, cardId);
                        if (detail) { setDetailCard(detail); return; }
                      } catch {}
                    }
                    setDetailItem(item);
                  }}
                    style={{
                      borderRadius: 16,
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid var(--surface-border)",
                      cursor: "pointer", transition: "all 0.2s",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {newItemId === item.id && (
                      <span style={{
                        position: "absolute", top: 12, right: 12, zIndex: 2,
                        background: "linear-gradient(135deg, #98a6ff, #076ee8)",
                        color: "#fff", fontSize: 10, fontWeight: 800,
                        padding: "2px 8px", borderRadius: 8, letterSpacing: "0.05em",
                        animation: "badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}>
                        NEW
                      </span>
                    )}
                    {/* Large Image / Gradient Thumbnail */}
                    <div style={{
                      width: "100%", height: 160, position: "relative",
                      background: item.gradient || "linear-gradient(135deg, #1a1a2e, #2d1b4e)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {item.imageUrl || item.conceptSheetUrl ? (
                        <img
                          src={item.conceptSheetUrl || item.imageUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 56, opacity: 0.5 }}>{item.categoryIcon}</span>
                      )}
                      {/* Overlay info */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        padding: "24px 14px 10px",
                        background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                      }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                          {item.categoryIcon} {item.categoryLabel}
                          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginLeft: 8 }}>
                            {item.style}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Card Body */}
                    <div style={{ padding: "12px 14px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {item.winner} 선정 · 투표 {item.voters}명
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(item.completedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      {/* Color palette */}
                      <div style={{ display: "flex", gap: 4 }}>
                        {item.colors.map((c, ci) => (
                          <div key={ci} style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: c, border: "1px solid rgba(0,0,0,0.06)",
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ─── Wishlist Tab ─── */}
          {sidebarTab === "wishlist" && (
            <>
              {/* Add Wish Form */}
              <div style={{
                padding: 16, borderRadius: 16, marginBottom: 16,
                background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 12 }}>
                  새 아이디어 추가
                </div>
                <input
                  type="text"
                  placeholder="제목 (예: 라탄 행잉 체어)"
                  value={wishTitle}
                  onChange={e => setWishTitle(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-main)", fontSize: 13, outline: "none",
                    marginBottom: 8, transition: "border-color 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(234,179,8,0.4)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--surface-border)"; }}
                />
                <textarea
                  placeholder="메모 (참고 사항, 원하는 스타일 등)"
                  value={wishNote}
                  onChange={e => setWishNote(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-main)", fontSize: 13, outline: "none",
                    marginBottom: 8, resize: "vertical", lineHeight: 1.5,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(234,179,8,0.4)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--surface-border)"; }}
                />
                {/* Image upload — 사이드바 버전. 다중 업로드 / 붙여넣기 지원 */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                    <input
                      ref={wishImageRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        for (const file of files) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setWishImages((prev) => prev.length >= 4 ? prev : [...prev, ev.target.result]);
                          reader.readAsDataURL(file);
                        }
                        e.target.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                    <button
                      onClick={() => wishImageRef.current?.click()}
                      disabled={wishImages.length >= 4}
                      style={{
                        padding: "8px 14px", borderRadius: 8,
                        background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                        color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
                        cursor: wishImages.length >= 4 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                        opacity: wishImages.length >= 4 ? 0.5 : 1,
                      }}
                    >
                      🖼️ 이미지 ({wishImages.length}/4)
                    </button>
                  </div>
                  {wishImages.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {wishImages.map((img, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img src={img} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", border: "1px solid var(--surface-border)" }} />
                          <button
                            onClick={() => setWishImages((prev) => prev.filter((_, i) => i !== idx))}
                            style={{
                              position: "absolute", top: -5, right: -5,
                              width: 16, height: 16, borderRadius: 8,
                              background: "rgba(239,68,68,0.95)", color: "#fff",
                              border: "1px solid #fff", fontSize: 9, cursor: "pointer", lineHeight: 1,
                            }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (!wishTitle.trim()) return;
                    const gradients = [
                      "linear-gradient(135deg, #2e2a1a 0%, #3d2f1e 50%, #1a2e2a 100%)",
                      "linear-gradient(135deg, #2e1a2a 0%, #1a2e3e 50%, #2a2e1a 100%)",
                      "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1e293b 100%)",
                      "linear-gradient(135deg, #14120f 0%, #3d2f1e 50%, #14120f 100%)",
                    ];
                    // 여러 이미지를 병렬 업로드. 첫번째가 썸네일, 전체는 ref_images.
                    const uploaded = await Promise.all(wishImages.map((d) => uploadDataUrl(d)));
                    const primary = uploaded[0] || null;
                    const item = {
                      id: Date.now(),
                      title: wishTitle.trim(),
                      note: wishNote.trim(),
                      imageUrl: primary,
                      gradient: gradients[Math.floor(Math.random() * gradients.length)],
                      createdAt: new Date().toISOString(),
                    };
                    // [v1.5.7] legacy /wishlist POST 제거 — cards 만 SOT 로 저장.
                    setWishlist(prev => [item, ...prev]);
                    prevWishlistRef.current = [item, ...prevWishlistRef.current];

                    if (projectSlug) {
                      let ok = false;
                      try {
                        const rCard = await fetch(`/api/projects/${projectSlug}/cards`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            id: `wish-${item.id}`,
                            title: item.title,
                            description: item.note,
                            thumbnail_url: item.imageUrl,
                            status_key: "wishlist",
                            data: { source: "wishlist", gradient: item.gradient, ref_images: uploaded },
                            actor: actorName || null,
                          }),
                        });
                        if (rCard.ok) {
                          const created = await rCard.json();
                          setCards((prev) => {
                            if (prev.find((c) => c.id === created.id)) return prev;
                            return [created, ...prev];
                          });
                          ok = true;
                        } else {
                          const body = await rCard.text();
                          console.warn("wishlist card 저장 실패:", rCard.status, body);
                          alert(`위시리스트 저장 실패 (서버 ${rCard.status}). 잠시 후 다시 시도해주세요.\n상세: ${body.slice(0, 200)}`);
                        }
                      } catch (e) {
                        console.warn("wishlist card 저장 에러:", e);
                        alert("위시리스트 저장 실패 — 서버 연결을 확인해주세요.\n" + e.message);
                      }
                      if (!ok) return; // 저장 실패 시 폼 초기화하지 않음 (재시도 기회)
                    }

                    setWishTitle("");
                    setWishNote("");
                    setWishImages([]);
                    if (wishImageRef.current) wishImageRef.current.value = "";
                  }}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10,
                    background: wishTitle.trim() ? "linear-gradient(135deg, #eab308, #f59e0b)" : "rgba(0,0,0,0.04)",
                    border: "none",
                    color: wishTitle.trim() ? "#000" : "var(--text-muted)",
                    fontSize: 13, fontWeight: 700, cursor: wishTitle.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                  }}
                >
                  추가하기
                </button>
              </div>

              {/* Wishlist Items */}
              {wishlist.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💫</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>만들고 싶은 가구 아이디어를 추가해보세요</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="sidebar-item"
                      style={{
                        borderRadius: 16, overflow: "hidden",
                        background: "rgba(0,0,0,0.02)",
                        border: "1px solid var(--surface-border)",
                        transition: "all 0.2s", position: "relative",
                      }}
                    >
                      {/* Image area */}
                      <div style={{
                        width: "100%", height: item.imageUrl ? 140 : 0,
                        background: item.gradient || "linear-gradient(135deg, #1a1a2e, #2d1b4e)",
                        overflow: "hidden",
                      }}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>
                              {item.title}
                            </div>
                            {item.note && (
                              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                                {item.note}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              // cards 테이블에서 삭제 → derived wishlist 자동 반영.
                              if (projectSlug) {
                                const cardId = item._cardId || `wish-${item.id}`;
                                try {
                                  await fetch(`/api/projects/${projectSlug}/cards/${cardId}`, { method: "DELETE" });
                                  setCards((prev) => prev.filter((c) => c.id !== cardId));
                                } catch (err) { console.warn("삭제 실패:", err); }
                              }
                            }}
                            style={{
                              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                              background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                              color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--surface-border)"; }}
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                          {new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </>}

      {/* Hidden canvas for concept sheet generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Floating 시안 작업 큐 — 실제 생성 중인 항목이 있을 때만 노출.
          동시에 여러 카드를 생성해도 진행률을 한눈에 볼 수 있게 한다. */}
      {(() => {
        const runningJobs = jobs.filter((j) => j.loading);
        const runningCards = Object.entries(generatingCards);
        const total = runningJobs.length + runningCards.length;
        if (total === 0) return null;
        return (
          <div style={{
            position: "fixed",
            bottom: 24, right: 24,
            width: 320, maxHeight: "60vh",
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(16px)",
            borderRadius: 16,
            border: "1px solid var(--surface-border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            zIndex: 90,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--surface-border)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>
                {runningCards.every(([, i]) => i.completed) && runningCards.length > 0 ? "✅" : "⏳"}
              </span>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
                작업 큐 ({total})
              </div>
            </div>
            <div style={{ padding: 10, overflowY: "auto", flex: 1 }}>
              {runningCards.map(([cid, info]) => {
                const pct = info.total > 0 ? Math.round((info.done / info.total) * 100) : 0;
                const done = !!info.completed;
                return (
                  <div
                    key={cid}
                    onClick={async () => {
                      if (!projectSlug) return;
                      try {
                        const d = await fetchCardDetail(projectSlug, cid);
                        if (d) setDetailCard(d);
                        // 완료된 항목을 클릭한 경우 작업큐에서 제거 (v1.10.23).
                        if (done) {
                          setGeneratingCards((prev) => {
                            const n = { ...prev };
                            delete n[cid];
                            return n;
                          });
                        }
                      } catch (e) { /* 무시 */ }
                    }}
                    style={{
                      padding: "8px 10px", borderRadius: 10, marginBottom: 6,
                      background: done ? "rgba(34,197,94,0.08)" : "rgba(7,110,232,0.05)",
                      border: `1px solid ${done ? "rgba(34,197,94,0.35)" : "rgba(7,110,232,0.2)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {info.thumb && <img src={info.thumb} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {info.title || "(제목 없음)"}
                        </div>
                        <div style={{ fontSize: 10, color: done ? "#15803d" : "var(--text-muted)", fontWeight: done ? 700 : 500 }}>
                          {done ? `✓ 완료 · 클릭해서 열기` : `${info.done}/${info.total} · ${pct}%`}
                        </div>
                      </div>
                      {done && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGeneratingCards((prev) => {
                              const n = { ...prev };
                              delete n[cid];
                              return n;
                            });
                          }}
                          title="알림 닫기"
                          style={{
                            width: 22, height: 22, borderRadius: 11,
                            background: "rgba(0,0,0,0.05)", border: "none",
                            color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >✕</button>
                      )}
                    </div>
                    {!done && (
                      <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--primary), var(--secondary))", transition: "width 0.3s" }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {runningJobs.map((job) => (
                <JobQueueCard
                  key={job.id}
                  job={job}
                  active={job.id === activeJobId}
                  onSelect={() => setActiveJobId(job.id)}
                  onRemove={() => removeJob(job.id)}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* inzoiObjectList 에셋 상세 모달 (네이티브) — 카탈로그 전체 페이지가 아닌
          /api/object-detail/:id 로 해당 에셋 데이터만 fetch 해서 가볍게 렌더. */}
      {catalogItemId && (
        <CatalogDetailModal
          id={catalogItemId}
          onClose={() => setCatalogItemId(null)}
        />
      )}

      {/* 단축키 치트시트 (v1.10.37 재투입) — ? 키로 토글 */}
      {shortcutsOpen && (
        <div
          onClick={() => setShortcutsOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 560, maxWidth: "92vw", maxHeight: "80vh",
              background: "#fff", borderRadius: 16, padding: "22px 26px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-main)" }}>⌨️ 단축키</div>
              <button
                onClick={() => setShortcutsOpen(false)}
                style={{
                  marginLeft: "auto", width: 28, height: 28, borderRadius: 8,
                  background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 13, cursor: "pointer",
                }}
              >✕</button>
            </div>
            {[
              { title: "전역", items: [
                ["?", "이 치트시트 열기/닫기"],
                ["N", "새 위시 추가"],
                ["Esc", "모달 / 갤러리 / 치트시트 닫기"],
              ]},
              { title: "카드 상세 모달", items: [
                ["F", "갤러리 캔버스 열기/닫기"],
                ["좌 / 우 방향키", "같은 탭의 이전 / 다음 카드"],
                ["Esc", "상세 모달 닫기"],
              ]},
              { title: "갤러리 캔버스", items: [
                ["휠", "커서 기준 줌"],
                ["가운데 / 우클릭 드래그", "팬"],
                ["0", "전체 보기"],
                ["+ / -", "줌"],
                ["방향키", "팬"],
                ["Esc / F", "닫기"],
              ]},
              { title: "인라인 편집", items: [
                ["Enter (제목 / 댓글)", "저장"],
                ["Ctrl / Cmd + Enter (textarea)", "저장"],
                ["Esc", "취소"],
              ]},
              { title: "이미지 Lightbox", items: [
                ["좌 / 우 방향키", "다음 이미지"],
                ["Esc", "닫기"],
              ]},
            ].map((group) => (
              <div key={group.title} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                  marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase",
                }}>{group.title}</div>
                {group.items.map((row) => (
                  <div key={row[0]} style={{ display: "flex", alignItems: "center", padding: "5px 0", fontSize: 13 }}>
                    <kbd style={{
                      padding: "2px 9px", borderRadius: 6, minWidth: 32,
                      background: "rgba(0,0,0,0.05)", border: "1px solid var(--surface-border)",
                      color: "var(--text-main)", fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                      textAlign: "center",
                    }}>{row[0]}</kbd>
                    <span style={{ marginLeft: 12, color: "var(--text-lighter)" }}>{row[1]}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8,
              background: "rgba(7,110,232,0.06)", fontSize: 11, color: "var(--text-muted)",
            }}>
              입력창(텍스트박스) 포커스 중엔 단축키 동작 안 함.
            </div>
          </div>
        </div>
      )}

      {/* 갤러리 캔버스 (v1.10.26) — 단축키 F / 헤더 🖼 버튼으로 오픈 */}
      {galleryOpen && detailCard && (
        <GalleryCanvas
          card={detailCard}
          projectSlug={projectSlug}
          actor={actorName}
          onClose={() => setGalleryOpen(false)}
          onSaved={async () => {
            const d = await fetchCardDetail(projectSlug, detailCard.id);
            if (d) {
              setDetailCard(d);
              setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
            }
          }}
        />
      )}

      {/* 이미지 원본 해상도 뷰어 (lightbox) — v1.10.59: ImageLightbox 컴포넌트로 추출.
          줌/패닝 (휠 + 좌/중/우 드래그), 0 키로 fit, ←/→ 갤러리 이동, ESC 닫기.
          상세 모달이 열려 있으면 카드의 모든 이미지(썸네일·참조·시안·시트) 를 묶음. */}
      {previewImage && (() => {
        const gallery = (() => {
          if (!detailCard) return [previewImage];
          const set = [];
          const push = (u) => { if (u && !set.includes(u)) set.push(u); };
          push(detailCard.thumbnail_url);
          (detailCard.data?.ref_images || []).forEach(push);
          (detailCard.data?.designs || []).forEach((d) => push(d?.imageUrl));
          push(detailCard.data?.image_url);        // legacy comp_* 카드 fallback
          const v = detailCard.data?.concept_sheet_views;
          if (v) { push(v.front); push(v.side); push(v.back); push(v.top); }
          push(detailCard.data?.concept_sheet_url);
          if (!set.includes(previewImage)) set.push(previewImage);
          return set;
        })();
        return (
          <ImageLightbox
            src={previewImage}
            gallery={gallery}
            onChange={setPreviewImage}
            onClose={() => setPreviewImage(null)}
            card={detailCard}
            projectSlug={projectSlug}
            actor={actorName}
            onSavedRef={async () => {
              if (!detailCard) return;
              const d = await fetchCardDetail(projectSlug, detailCard.id);
              if (d) {
                setDetailCard(d);
                setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
              }
            }}
          />
        );
      })()}
    </div>
  );
}
