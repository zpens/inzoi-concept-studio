import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Version Info ───
const APP_VERSION = "1.4.4";
const CHANGELOG = [
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
const FURNITURE_CATEGORIES = [
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

const STYLE_PRESETS = [
  { id: "modern", label: "모던", color: "#64748b" },
  { id: "scandinavian", label: "스칸디나비안", color: "#d4a574" },
  { id: "midcentury", label: "미드센추리", color: "#c2956b" },
  { id: "industrial", label: "인더스트리얼", color: "#78716c" },
  { id: "minimal", label: "미니멀", color: "#e2e8f0" },
  { id: "vintage", label: "빈티지", color: "#a87c5a" },
  { id: "luxury", label: "럭셔리", color: "#d4af37" },
  { id: "natural", label: "내추럴", color: "#86a873" },
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

// ─── Utility Functions ───
function generateSeed() {
  return Math.floor(Math.random() * 2147483647);
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
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// ─── List available Gemini image models ───
async function listGeminiImageModels(apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
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

async function postCardComment(slug, cardId, body, actor) {
  const r = await fetch(`/api/projects/${slug}/cards/${cardId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body, actor }),
  });
  if (!r.ok) throw new Error(`comment ${r.status}`);
  return r.json();
}

const STATUS_META = {
  wishlist: { label: "아이디어",   icon: "⭐", color: "#f59e0b" },
  drafting: { label: "시안 생성",  icon: "✨", color: "#7c3aed" },
  sheet:    { label: "컨셉시트",   icon: "📑", color: "#076ee8" },
  done:     { label: "완료",       icon: "✅", color: "#22c55e" },
};

// 카드 내부 "시안 생성" 액션.
// - card.data.category / style_preset 으로 enhanced prompt 자동 구성
// - card.data.ref_images 가 있으면 Gemini multimodal 로 함께 전송
// - 결과를 card.data.designs 에 append, PATCH 로 저장
async function generateCardVariants({ card, count, prompt, geminiApiKey, selectedModel, slug, actor, onProgress }) {
  const seeds = Array.from({ length: Math.max(1, Math.min(8, count)) }, () => generateSeed());

  // prompt enhance — 기존 generateDesigns 와 동일 패턴
  const catInfo = card.data?.category
    ? FURNITURE_CATEGORIES.find((c) => c.id === card.data.category)
    : null;
  const styleInfo = card.data?.style_preset
    ? STYLE_PRESETS.find((s) => s.id === card.data.style_preset)
    : null;
  const spec = catInfo ? (ASSET_SPECS[catInfo.id] || DEFAULT_SPEC) : null;
  const enhancedPrompt = catInfo
    ? `${catInfo.preset}, ${styleInfo?.label || "modern"} style, ${prompt}${spec?.hint ? `, ${spec.hint}` : ""}, product design concept, white background, studio lighting, high detail, game asset reference`
    : prompt;

  const refImages = Array.isArray(card.data?.ref_images) ? card.data.ref_images : [];

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
// 카테고리 / 스타일 / 프롬프트 / 참조 이미지 4개 필드 자동 저장.
// 카드 생성은 최소 정보(제목)로, 어셋 정보는 여기서 점진적으로 채운다.
function AssetInfoEditor({ card, projectSlug, actor, onRefresh, disabled }) {
  const [category, setCategory] = React.useState(card.data?.category || "");
  const [stylePreset, setStylePreset] = React.useState(card.data?.style_preset || "");
  const [prompt, setPrompt] = React.useState(card.data?.prompt || card.description || "");
  const [refImages, setRefImages] = React.useState(card.data?.ref_images || []);
  const [saving, setSaving] = React.useState(false);
  const fileRef = React.useRef(null);

  // 서버에서 카드가 갱신되면 로컬 폼 상태도 동기화.
  React.useEffect(() => {
    setCategory(card.data?.category || "");
    setStylePreset(card.data?.style_preset || "");
    setPrompt(card.data?.prompt || card.description || "");
    setRefImages(card.data?.ref_images || []);
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

  const addRefFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = await uploadDataUrl(ev.target.result);
      const next = [...refImages, url];
      setRefImages(next);
      await save({ ref_images: next });
    };
    reader.readAsDataURL(file);
  };

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
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={fieldLabel}>카테고리</div>
          <select
            value={category}
            disabled={disabled}
            onChange={(e) => { const v = e.target.value; setCategory(v); save({ category: v }); }}
            style={fieldBox}
          >
            <option value="">— 선택 —</option>
            {FURNITURE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label} ({c.room})</option>
            ))}
          </select>
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

      <div style={{ marginBottom: 10 }}>
        <div style={fieldLabel}>프롬프트 <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>(재질·색상·치수 등 자세히)</span></div>
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
        <div style={fieldLabel}>참조 이미지 ({refImages.length}/4) <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>(Gemini multimodal 에 함께 전송)</span></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {refImages.map((url, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--surface-border)" }} />
              {!disabled && (
                <button
                  onClick={async () => {
                    const next = refImages.filter((_, idx) => idx !== i);
                    setRefImages(next);
                    await save({ ref_images: next });
                  }}
                  style={{
                    position: "absolute", top: -6, right: -6,
                    width: 18, height: 18, borderRadius: 9,
                    background: "rgba(239,68,68,0.95)", color: "#fff",
                    border: "1px solid #fff", fontSize: 10, cursor: "pointer", lineHeight: 1,
                  }}
                >✕</button>
              )}
            </div>
          ))}
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
                  width: 72, height: 72, borderRadius: 8,
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

// 카드 상태별 액션 패널 (Phase E):
//   wishlist → "시안 생성 시작"
//   drafting → Gemini 시안 추가 생성 + 그리드 + 선정
//   sheet    → "최종 완료" 버튼 (시트 생성은 기존 흐름 혹은 간단화)
//   done     → (confirmed 잠금, 이 패널은 렌더 안 함)
function CardActionPanel({ card, statusKey, projectSlug, geminiApiKey, selectedModel, actor, onMoveTo, onRefresh, onOpenApiSettings }) {
  const [count, setCount] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(null);

  const designs = Array.isArray(card.data?.designs) ? card.data.designs : [];
  const selectedIdx = card.data?.selected_design;

  const doGenerate = async () => {
    if (!geminiApiKey) { onOpenApiSettings(); return; }
    const prompt = card.data?.prompt || card.description || card.title;
    if (!prompt) { alert("시안 생성을 위해 카드 설명 또는 프롬프트가 필요합니다."); return; }
    setBusy(true);
    setProgress({ done: 0, total: count });
    try {
      const r = await generateCardVariants({
        card, count, prompt, geminiApiKey, selectedModel,
        slug: projectSlug, actor,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (r.added === 0) alert(`생성 실패 (시도 ${count}개, 실패 ${r.failed}개)`);
      await onRefresh();
    } catch (e) { alert("생성 실패: " + e.message); }
    finally { setBusy(false); setProgress(null); }
  };

  const selectDesign = async (idx) => {
    try {
      const d = designs[idx];
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: { ...(card.data || {}), selected_design: idx },
          thumbnail_url: d?.imageUrl || card.thumbnail_url,
          status_key: "sheet",
          actor,
        }),
      });
      await onRefresh();
    } catch (e) { alert("선정 실패: " + e.message); }
  };

  const removeDesign = async (idx) => {
    if (!confirm("이 시안을 삭제하시겠어요?")) return;
    const next = designs.filter((_, i) => i !== idx);
    try {
      await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: { ...(card.data || {}), designs: next }, actor }),
      });
      await onRefresh();
    } catch (e) { alert("삭제 실패: " + e.message); }
  };

  const sectionStyle = {
    marginBottom: 20, padding: 14, borderRadius: 12,
    background: "linear-gradient(135deg, rgba(7,110,232,0.04), rgba(139,92,246,0.02))",
    border: "1px solid rgba(7,110,232,0.18)",
  };
  const titleStyle = { fontSize: 13, fontWeight: 800, color: "var(--primary)", marginBottom: 10 };

  if (statusKey === "wishlist") {
    return <WishlistToDraftingAction card={card} onMoveTo={onMoveTo} />;
  }

  if (statusKey === "drafting") {
    return (
      <div style={sectionStyle}>
        <div style={titleStyle}>시안 생성 ({designs.length}개)</div>
        {/* 개수 선택 + 생성 버튼 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {[1, 2, 4, 8].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              disabled={busy}
              style={{
                padding: "6px 12px", borderRadius: 8,
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
              marginLeft: "auto", padding: "8px 14px", borderRadius: 10,
              background: busy ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, var(--primary), var(--secondary))",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy
              ? `생성 중… ${progress ? `(${progress.done}/${progress.total})` : ""}`
              : `🎨 ${count}개 생성`}
          </button>
        </div>

        {/* 시안 썸네일 그리드 */}
        {designs.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 8,
          }}>
            {designs.map((d, i) => (
              <div key={i} style={{
                position: "relative", borderRadius: 8, overflow: "hidden",
                border: selectedIdx === i ? "2px solid var(--primary)" : "1px solid var(--surface-border)",
                background: "#000",
              }}>
                {d.imageUrl ? (
                  <img src={d.imageUrl} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", fontSize: 11 }}>실패</div>
                )}
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  padding: 4, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)",
                  opacity: 0, transition: "opacity 0.2s",
                }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 0}
                >
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    <button
                      onClick={() => selectDesign(i)}
                      style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: "var(--primary)", border: "none", color: "#fff", cursor: "pointer",
                      }}
                      title="이 시안 선정 → 컨셉시트로 이동"
                    >선정 →</button>
                    <button
                      onClick={() => removeDesign(i)}
                      style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: "rgba(239,68,68,0.9)", border: "none", color: "#fff", cursor: "pointer",
                      }}
                    >삭제</button>
                  </div>
                </div>
                <div style={{
                  position: "absolute", top: 4, left: 4,
                  padding: "1px 6px", borderRadius: 4,
                  background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 9, fontFamily: "monospace",
                }}>#{i + 1}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: 20, textAlign: "center", borderRadius: 10,
            background: "rgba(0,0,0,0.03)", border: "1px dashed var(--surface-border)",
            color: "var(--text-muted)", fontSize: 12,
          }}>
            아직 생성된 시안이 없습니다. 위 "🎨 N개 생성" 버튼을 눌러 시작하세요.
          </div>
        )}
      </div>
    );
  }

  if (statusKey === "sheet") {
    const selectedDesign = selectedIdx != null ? designs[selectedIdx] : null;
    const sheetUrl = card.data?.concept_sheet_url;

    const makeSheet = async () => {
      if (!selectedDesign?.imageUrl) { alert("선정된 시안 이미지가 필요합니다."); return; }
      setBusy(true);
      try {
        // 소스 이미지 로드
        const sourceImg = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = selectedDesign.imageUrl;
        });
        if (!sourceImg) { alert("소스 이미지 로드 실패"); return; }

        // 임시 canvas 에 6개 뷰 slot 모두 같은 이미지 (transforms 로 다르게 보임)
        const canvas = document.createElement("canvas");
        const viewImages = {};
        for (const v of VIEW_ANGLES) viewImages[v.id] = sourceImg;

        generateConceptSheetCanvas(canvas, viewImages, {
          category: card.data?.category_label || card.title,
          style:    card.data?.style || "",
          prompt:   card.data?.prompt || card.description || "",
          seed:     selectedDesign.seed,
          colors:   card.data?.colors || [],
          model:    selectedModel,
        });

        const raw = canvas.toDataURL("image/png");
        const uploaded = await uploadDataUrl(raw);

        await fetch(`/api/projects/${projectSlug}/cards/${card.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            data: { ...(card.data || {}), concept_sheet_url: uploaded },
            thumbnail_url: uploaded,
            actor,
          }),
        });
        await onRefresh();
      } catch (e) {
        alert("컨셉시트 생성 실패: " + e.message);
      } finally { setBusy(false); }
    };

    return (
      <div style={sectionStyle}>
        <div style={titleStyle}>컨셉시트</div>
        {selectedDesign?.imageUrl && (
          <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              선정 시안 #{selectedIdx + 1} (seed: {selectedDesign.seed})
            </div>
            <img src={selectedDesign.imageUrl} alt="선정 시안" style={{ width: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 6, background: "#fff" }} />
          </div>
        )}

        {sheetUrl ? (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#22c55e", marginBottom: 6, fontWeight: 700 }}>✓ 컨셉시트 생성됨</div>
            <a href={sheetUrl} target="_blank" rel="noreferrer">
              <img src={sheetUrl} alt="컨셉시트" style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 6, background: "#fff", cursor: "zoom-in" }} />
            </a>
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px dashed var(--surface-border)", color: "var(--text-muted)", fontSize: 12, marginBottom: 10 }}>
            아직 컨셉시트가 없습니다. 아래 버튼으로 생성하세요.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={makeSheet}
            disabled={busy || !selectedDesign?.imageUrl}
            style={{
              flex: 1, minWidth: 140, padding: "10px 14px", borderRadius: 10,
              background: busy || !selectedDesign?.imageUrl ? "rgba(0,0,0,0.08)" : "var(--primary)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: busy ? "wait" : (!selectedDesign?.imageUrl ? "not-allowed" : "pointer"),
            }}
            title={selectedDesign?.imageUrl ? "선정 시안으로 컨셉시트 PNG 제작" : "선정된 시안이 없습니다"}
          >{busy ? "생성 중…" : sheetUrl ? "🔄 재생성" : "📑 컨셉시트 생성"}</button>
          {sheetUrl && (
            <a
              href={sheetUrl}
              download={`inzoi_sheet_${card.id}.png`}
              style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textDecoration: "none",
              }}
            >📥 저장</a>
          )}
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
        아이디어 → 시안 생성
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
        위 어셋 정보를 채운 뒤 시안 생성 단계로 넘기세요.
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
      >✨ 시안 생성 단계로 이동</button>
    </div>
  );
}


// 카드 상세 모달의 댓글 입력창. ref 대신 local state 로 간단히.
function CardCommentInput({ onSubmit, disabled }) {
  const [val, setVal] = React.useState("");
  return (
    <div style={{ display: "flex", gap: 6 }}>
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
function CardHubCard({ card, tabId, onClick }) {
  const data = card.data || {};
  const designs = Array.isArray(data.designs) ? data.designs : [];
  const selectedIdx = typeof data.selected_design === "number" ? data.selected_design : null;
  const selected = selectedIdx != null ? designs[selectedIdx] : null;

  // 탭별 썸네일 선택 로직
  let thumb = card.thumbnail_url;
  if (tabId === "sheet") {
    thumb = data.concept_sheet_url || selected?.imageUrl || card.thumbnail_url;
  } else {
    thumb = designs.find((d) => d?.imageUrl)?.imageUrl || card.thumbnail_url;
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
        width: "100%", height: 180, position: "relative",
        background: thumb ? "#000" : "rgba(0,0,0,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 56, opacity: 0.5 }}>{catInfo?.icon || "📇"}</span>
        )}
        {designs.length > 0 && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "3px 10px", borderRadius: 10,
            background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 700,
          }}>시안 {designs.length}</div>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{
            fontSize: 15, fontWeight: 800, color: "var(--text-main)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0,
          }}>
            {catInfo?.icon || ""} {card.title}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, flexShrink: 0,
            color: "var(--primary)", background: "rgba(7,110,232,0.1)",
            padding: "2px 6px", borderRadius: 6,
          }}>카드</span>
        </div>
        <div style={{
          fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", minHeight: 36,
        }}>
          {styleInfo ? `${styleInfo.label} · ` : ""}{card.description || "(설명 없음)"}
        </div>
        {tabId === "sheet" && data.concept_sheet_url && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#22c55e", fontWeight: 600 }}>
            ✓ 컨셉시트 생성됨
          </div>
        )}
        {tabId === "vote" && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
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

  // Spawn a new blank job and focus it. 상세 UI 도 자동으로 전개.
  // [v1.4.4] '＋ 새 시안' 은 이제 새 card 를 drafting 상태로 생성하고
  // 카드 상세 모달을 바로 열어 어셋 정보 인라인 편집으로 유도한다.
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
  const [activeTab, setActiveTab] = useState("create"); // "create" | "completed" | "wishlist"
  const [expandedItem, setExpandedItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailDesign, setDetailDesign] = useState(null); // 시안 이미지 확대 모달
  const [detailWish, setDetailWish] = useState(null);     // 위시리스트 상세 모달
  const [archiveOpen, setArchiveOpen] = useState(false);   // 아카이브 뷰 토글
  const [archivedCards, setArchivedCards] = useState([]);  // 서버에서 가져온 아카이브 카드
  const [activityFilter, setActivityFilter] = useState("all"); // 카드 활동 이력 필터
  const [newItemId, setNewItemId] = useState(null);
  // 워크플로우 탭 상세 전개 여부. 기본 false 라 그리드만 보이고, 카드 클릭하거나
  // ＋ 새 시안 눌렀을 때만 true 로 전환되어 입력/단계 UI 가 드러난다.
  const [showWorkflowDetail, setShowWorkflowDetail] = useState(false);

  // Phase A/B: 새 카드 시스템 state. 기존 completedList / wishlist / jobs 와
  // 병행 유지하며, 단계적으로 UI 를 cards 기반으로 이전한다.
  const [cards, setCards] = useState([]);           // 프로젝트 내 모든 카드 (is_archived=0)
  const [lists, setLists] = useState([]);           // wishlist / drafting / sheet / done
  const [detailCard, setDetailCard] = useState(null); // 상세 모달에 열린 카드

  // [Phase B-3] cards → 기존 wishlist / completedList shape 로 변환하는 derived.
  // 컴포넌트들은 계속 `wishlist` / `completedList` 변수명 그대로 사용.
  const wishlist = useMemo(() => {
    const listId = lists.find((l) => l.status_key === "wishlist")?.id;
    if (!listId) return [];
    return cards
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
      })
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [cards, lists]);

  const completedList = useMemo(() => {
    const listId = lists.find((l) => l.status_key === "done")?.id;
    if (!listId) return [];
    return cards
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
      })
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
  }, [cards, lists]);

  // [Phase B-3] wishlist 도 cards derived. 기존 shape 호환.
  const setWishlist = () => { /* deprecated */ };
  const [wishTitle, setWishTitle] = useState("");
  const [wishNote, setWishNote] = useState("");
  const [wishImage, setWishImage] = useState(null);
  const wishImageRef = useRef(null);

  // 클립보드 이미지 붙여넣기 지원 (위시리스트 탭에서만 활성).
  // 캡처한 첫 번째 이미지 아이템을 dataURL 로 읽어 setWishImage 에 저장한다.
  useEffect(() => {
    if (activeTab !== "wishlist") return;
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type && it.type.startsWith("image/")) {
          const file = it.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => setWishImage(ev.target.result);
          reader.readAsDataURL(file);
          e.preventDefault();
          return;
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [activeTab]);

  // Version modal state
  const [versionOpen, setVersionOpen] = useState(false);

  // API key state
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [claudeApiKey, setClaudeApiKey] = useState(() => localStorage.getItem("claude_api_key") || "");
  const [showApiSettings, setShowApiSettings] = useState(false);

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

  // 활성 작업의 step 이 변하면 워크플로우 탭을 자동 전환한다
  // (step 1→2 투표로, 3→4 컨셉시트로, 등). 사용자가 completed/wishlist 같은
  // 비-워크플로우 탭에 있을 땐 건드리지 않는다.
  useEffect(() => {
    if (activeTab !== "create" && activeTab !== "vote" && activeTab !== "sheet") return;
    let target = null;
    if (step <= 1) target = "create";
    else if (step <= 3) target = "vote";
    else if (step <= 6) target = "sheet";
    if (target && target !== activeTab) setActiveTab(target);
  }, [step, activeTab]);

  // ── 프로젝트 slug / 동기화 상태 ──
  const [projectSlug, setProjectSlug] = useState(null);
  const [projectReady, setProjectReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle" | "saving" | "error"
  const [connection, setConnection] = useState({ state: "connected", failStreak: 0 });
  // state: "connected" | "reconnecting" | "offline"
  const actorName = useMemo(() => {
    try { return localStorage.getItem("inzoi_actor_name") || null; } catch { return null; }
  }, []);

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

  useEffect(() => {
    if (!projectSlug || !projectReady) return;
    const timer = setTimeout(async () => {
      const prev = prevCompletedRef.current;
      try {
        const added = completedList.filter((c) => !prev.find((p) => p.id === c.id));
        const removed = prev.filter((p) => !completedList.find((c) => c.id === p.id));
        for (const c of added) {
          await fetch(`/api/projects/${projectSlug}/completed`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(completedToDbPayload(c)),
          });
        }
        for (const r of removed) {
          await fetch(`/api/projects/${projectSlug}/completed/${r.id}`, { method: "DELETE" });
        }
        prevCompletedRef.current = completedList;
      } catch (e) { console.warn("completed 동기화 실패", e); }
    }, 500);
    return () => clearTimeout(timer);
  }, [completedList, projectSlug, projectReady]);

  useEffect(() => {
    if (!projectSlug || !projectReady) return;
    const timer = setTimeout(async () => {
      const prev = prevWishlistRef.current;
      try {
        const added = wishlist.filter((c) => !prev.find((p) => p.id === c.id));
        const removed = prev.filter((p) => !wishlist.find((c) => c.id === p.id));
        for (const c of added) {
          await fetch(`/api/projects/${projectSlug}/wishlist`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(wishlistToDbPayload(c)),
          });
        }
        for (const r of removed) {
          await fetch(`/api/projects/${projectSlug}/wishlist/${r.id}`, { method: "DELETE" });
        }
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
    const flush = () => {
      try {
        const prevC = prevCompletedRef.current;
        const addedC = completedList.filter((c) => !prevC.find((p) => String(p.id) === String(c.id)));
        for (const c of addedC) {
          navigator.sendBeacon?.(
            `/api/projects/${projectSlug}/completed`,
            new Blob([JSON.stringify(completedToDbPayload(c))], { type: "application/json" })
          );
        }
        const prevW = prevWishlistRef.current;
        const addedW = wishlist.filter((w) => !prevW.find((p) => String(p.id) === String(w.id)));
        for (const w of addedW) {
          navigator.sendBeacon?.(
            `/api/projects/${projectSlug}/wishlist`,
            new Blob([JSON.stringify(wishlistToDbPayload(w))], { type: "application/json" })
          );
        }
      } catch (e) { /* best-effort */ }
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
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

        const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": claudeApiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
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
        padding: "12px 40px",
        borderBottom: "1px solid var(--surface-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
      }}>
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
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em", fontWeight: 500 }}>
              AI-Powered Furniture Asset Concept Generator
            </div>
          </div>
        </div>
        {/* Tab Navigation — 5-step workflow */}
        {(() => {
          // 각 탭이 "담당하는" step 범위. 탭 클릭 시 해당 범위의 작업으로
          // active 를 옮기고, 범위 밖이면 empty 상태 UI 가 표시된다.
          const TAB_STEP_RANGES = {
            create: [0, 1],
            vote: [2, 3],
            sheet: [4, 6],
          };
          // 자연스러운 흐름: 아이디어(위시) → 시안 → 투표 → 컨셉시트 → 완료
          // count 는 legacy jobs + 새 카드 시스템 합산.
          const draftingListId = lists.find((l) => l.status_key === "drafting")?.id;
          const sheetListId    = lists.find((l) => l.status_key === "sheet")?.id;
          const cardsInList = (id) => id ? cards.filter((c) => c.list_id === id && !c.is_archived).length : 0;
          const TABS = [
            { id: "wishlist",  label: "위시리스트",    icon: "⭐", count: wishlist.length },
            { id: "create",    label: "시안 생성",     icon: "✨", count: jobs.filter(j => j.step >= 0 && j.step <= 1).length + cardsInList(draftingListId) },
            { id: "vote",      label: "투표 및 선정",  icon: "🗳️", count: jobs.filter(j => j.step >= 2 && j.step <= 3).length },
            { id: "sheet",     label: "컨셉시트 생성", icon: "📑", count: jobs.filter(j => j.step >= 4 && j.step <= 6).length + cardsInList(sheetListId) },
            { id: "completed", label: "완료 목록",     icon: "📋", count: completedList.length },
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
                  {(idx === 1 || idx === 4) && <div style={{ width: 1, height: 20, background: "var(--surface-border)", margin: "0 2px" }} />}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160, justifyContent: "flex-end" }}>
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
              padding: "10px 14px", borderRadius: 12,
              background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
              color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
            title="아카이브된 카드 목록"
          >
            <span style={{ fontSize: 14 }}>🗄️</span>
            아카이브
          </button>
          <button
            onClick={() => setShowApiSettings(true)}
            className="hover-lift"
            style={{
              padding: "10px 18px", borderRadius: 12,
              background: geminiApiKey ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${geminiApiKey ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: geminiApiKey ? "#10b981" : "#ef4444",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.3s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{geminiApiKey ? "🔑" : "⚠️"}</span>
            API 설정
          </button>
          {(activeTab === "create" || activeTab === "vote" || activeTab === "sheet") && (
            <button
              onClick={() => { setActiveTab("create"); spawnNewJob(); }}
              className="hover-lift"
              style={{
                padding: "10px 20px", borderRadius: 12,
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                border: "none",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 14px var(--primary-glow)",
                display: "flex", alignItems: "center", gap: 6,
              }}
              title="새 시안 작업 추가 (현재 작업은 유지)"
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> 새 시안
            </button>
          )}
        </div>
      </header>

      {/* ═══ 작업 탭 (시안 생성 / 투표 및 선정 / 컨셉시트 생성) ═══ */}
      {/* 세 탭이 공유하는 워크플로우 본문. 각 탭은 step 범위로 매칭.
          - create: step 0~1
          - vote:   step 2~3
          - sheet:  step 4~6
          범위 밖이면 빈 상태 안내 */}
      {(activeTab === "create" || activeTab === "vote" || activeTab === "sheet") && <>

      {/* 카드 허브 — 탭 헤더 + 해당 step 범위의 작업 카드 그리드. 카드 클릭
          시 해당 작업을 active 로 전환하고 아래쪽에 step-based 상세 UI 표시. */}
      {(() => {
        const ranges = { create: [0, 1], vote: [2, 3], sheet: [4, 6] };
        const [min, max] = ranges[activeTab];
        const inRangeJobs = jobs.filter((j) => j.step >= min && j.step <= max);

        // 새 카드 시스템: 각 탭이 담당하는 list 의 카드도 함께 표시.
        const TAB_TO_STATUS = { create: "drafting", vote: "drafting", sheet: "sheet" };
        const tabStatusKey = TAB_TO_STATUS[activeTab];
        const tabListId = lists.find((l) => l.status_key === tabStatusKey)?.id;
        const inRangeCards = tabListId
          ? cards.filter((c) => c.list_id === tabListId && !c.is_archived)
          : [];
        const totalCount = inRangeJobs.length + inRangeCards.length;

        const tabMeta = {
          create: { title: "시안 생성",     icon: "✨", desc: "새 어셋 시안을 만들고 갤러리에서 확인하세요." },
          vote:   { title: "투표 및 선정",  icon: "🗳️", desc: "생성된 시안 중 팀 투표로 최종안을 선정하세요." },
          sheet:  { title: "컨셉시트 생성", icon: "📑", desc: "선정된 시안으로 멀티뷰 컨셉시트를 만들고 파이프라인에 전송하세요." },
        }[activeTab];

        return (
          <main style={{ padding: "32px 40px 0", maxWidth: 1400, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
              <div>
                <h2 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                  {tabMeta.icon} {tabMeta.title}
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  {totalCount > 0
                    ? `이 단계에 ${totalCount}개의 작업이 있습니다. 카드를 선택해 진행하세요.`
                    : tabMeta.desc}
                </p>
              </div>
              {activeTab === "create" && (
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
              )}
            </div>

            {totalCount > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
                marginBottom: 40,
              }}>
                {/* 새 카드 시스템의 카드들 — 위시에서 넘어온 것 포함 */}
                {inRangeCards.map((c) => (
                  <CardHubCard
                    key={`card-${c.id}`}
                    card={c}
                    tabId={activeTab}
                    onClick={async () => {
                      if (!projectSlug) return;
                      try {
                        const detail = await fetchCardDetail(projectSlug, c.id);
                        if (detail) setDetailCard(detail);
                      } catch (e) { console.warn("카드 열기 실패", e); }
                    }}
                  />
                ))}
                {/* 레거시 jobs 기반 카드 */}
                {inRangeJobs.map((j) => (
                  <WorkflowJobCard
                    key={j.id}
                    job={j}
                    active={j.id === activeJobId && showWorkflowDetail}
                    tabId={activeTab}
                    onSelect={() => { setActiveJobId(j.id); setShowWorkflowDetail(true); }}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                padding: "60px 40px", textAlign: "center",
                background: "rgba(0,0,0,0.02)",
                border: "1px dashed var(--surface-border)", borderRadius: 16,
                marginBottom: 40,
              }}>
                <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.6 }}>{tabMeta.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>
                  {activeTab === "create" ? "아직 생성된 시안이 없습니다" :
                   activeTab === "vote"   ? "투표할 시안이 없습니다" :
                                            "컨셉시트를 만들 작업이 없습니다"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {activeTab === "create" ? "＋ 새 시안 버튼을 눌러 첫 번째 작업을 시작하세요." :
                   activeTab === "vote"   ? "시안 생성 탭에서 먼저 이미지를 만든 뒤 '투표 시작하기' 를 눌러주세요." :
                                            "투표 및 선정을 마치면 이 탭으로 자동 이동합니다."}
                </div>
              </div>
            )}
          </main>
        );
      })()}

      {/* 상세 진행 UI 는 사용자가 카드를 직접 선택하거나 ＋ 새 시안을 눌렀을 때만 전개 */}
      {(() => {
        const ranges = { create: [0, 1], vote: [2, 3], sheet: [4, 6] };
        const [min, max] = ranges[activeTab];
        if (step < min || step > max) return null;
        if (!showWorkflowDetail) return null;
        return (
          <>
            <div style={{
              margin: "8px 40px 0", maxWidth: 1400, marginLeft: "auto", marginRight: "auto",
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
        padding: "0 40px 60px", maxWidth: 1400, margin: "0 auto",
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
                  {[1, 2, 4, 8].map((n) => (
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

                        // 1) 즉시 서버에 동기 저장. 새로고침해도 남도록 await.
                        if (projectSlug) {
                          try {
                            const r = await fetch(`/api/projects/${projectSlug}/completed`, {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify(completedToDbPayload(newItem)),
                            });
                            if (!r.ok) console.warn("완료 아이템 서버 저장 실패:", r.status);
                          } catch (e) {
                            console.warn("완료 아이템 서버 저장 실패:", e);
                            alert("완료 아이템을 서버에 저장하지 못했습니다. 네트워크를 확인하고 다시 시도해주세요.");
                            return;
                          }
                        }

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
          maxWidth: 1400, marginLeft: "auto", marginRight: "auto",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: geminiApiKey ? "#10b981" : "#ef4444", marginBottom: 8 }}>
            {geminiApiKey ? "✅ 나노바나나2 (Gemini 3.1 Flash Image) API 연결됨" : "⚠️ API 키를 설정해주세요"}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
            {geminiApiKey
              ? "나노바나나2 (Gemini 3.1 Flash Image)로 실제 이미지를 생성합니다. Claude API 키를 추가하면 프롬프트 자동 최적화도 활성화됩니다."
              : <>상단 <strong>API 설정</strong> 버튼을 눌러 Gemini API 키를 입력하세요. Google AI Studio에서 무료로 발급받을 수 있습니다.</>
            }
          </div>
        </div>
      )}

      </>} {/* end workflow tabs (create / vote / sheet) */}

      {/* ═══ Completed Tab ═══ */}
      {activeTab === "completed" && (
        <main style={{ padding: "40px 40px 60px", maxWidth: 1400, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
            <div>
              <h2 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>완료된 컨셉시트</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 16 }}>총 {completedList.length}개의 에셋 컨셉시트가 완성됐습니다.</p>
            </div>
            <button
              onClick={() => setActiveTab("create")}
              className="btn-primary hover-lift"
              style={{
                padding: "12px 24px", borderRadius: 14, border: "none",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 20px var(--primary-glow)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span>✨</span> 새 시안 생성
            </button>
          </div>

          {completedList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>📭</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>완료된 컨셉시트가 없습니다</div>
              <button onClick={() => setActiveTab("create")} className="btn-primary" style={{
                padding: "12px 28px", borderRadius: 14, border: "none",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
                첫 시안 생성하기
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
              {completedList.map((item) => (
                <div
                  key={item.id}
                  onClick={async () => {
                    // 새 cards 테이블에 있으면 통합 카드 모달, 없으면 기존 상세 모달로 폴백.
                    if (projectSlug) {
                      try {
                        const detail = await fetchCardDetail(projectSlug, `comp-${item.id}`);
                        if (detail) { setDetailCard(detail); return; }
                      } catch {}
                    }
                    setDetailItem(item);
                  }}
                  className="hover-lift glass-panel"
                  style={{
                    borderRadius: 20, overflow: "hidden",
                    border: "1px solid var(--surface-border)",
                    cursor: "pointer", transition: "all 0.3s",
                    background: "var(--surface-color)",
                    position: "relative",
                  }}
                >
                  {newItemId === item.id && (
                    <span style={{
                      position: "absolute", top: 14, right: 14, zIndex: 2,
                      background: "linear-gradient(135deg, #98a6ff, #076ee8)",
                      color: "#fff", fontSize: 10, fontWeight: 800,
                      padding: "3px 10px", borderRadius: 8, letterSpacing: "0.05em",
                      animation: "badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}>NEW</span>
                  )}
                  {/* Thumbnail */}
                  <div style={{
                    width: "100%", height: 200, position: "relative",
                    background: item.gradient || "linear-gradient(135deg, #1a1a2e, #2d1b4e)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.imageUrl || item.conceptSheetUrl ? (
                      <img src={item.conceptSheetUrl || item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 64, opacity: 0.5 }}>{item.categoryIcon}</span>
                    )}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "40px 16px 12px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                        {item.categoryIcon} {item.categoryLabel}
                        <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.6)", marginLeft: 8 }}>{item.style}</span>
                      </div>
                    </div>
                  </div>
                  {/* Card Body */}
                  <div style={{ padding: "16px 18px" }}>
                    {/* Asset code + status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      {item.assetCode && (
                        <code style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, letterSpacing: "0.04em", background: "rgba(7,110,232,0.07)", padding: "2px 8px", borderRadius: 6 }}>
                          {item.assetCode}
                        </code>
                      )}
                      {item.pipelineStatus && (() => {
                        const statusColor = item.pipelineStatus.includes("완료") ? "#22c55e"
                          : item.pipelineStatus.includes("진행") ? "#f59e0b"
                          : item.pipelineStatus.includes("대기") ? "#94a3b8"
                          : "var(--text-muted)";
                        return (
                          <span style={{ fontSize: 11, color: statusColor, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                            {item.pipelineStatus}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {item.winner} 선정 · {item.voters}명 투표{item.designer && ` · ${item.designer}`}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {new Date(item.completedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {item.colors.map((c, ci) => (
                        <div key={ci} style={{ flex: 1, height: 20, borderRadius: 5, background: c, border: "1px solid rgba(0,0,0,0.06)" }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ═══ Wishlist Tab ═══ */}
      {activeTab === "wishlist" && (
        <main style={{ padding: "40px 40px 60px", maxWidth: 1400, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 40, alignItems: "start" }}>

            {/* Left: Form */}
            <div style={{ position: "sticky", top: 100 }}>
              <h2 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>위시리스트</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>만들고 싶은 가구 아이디어를 기록하세요.</p>

              <div className="glass-panel" style={{ padding: 28, borderRadius: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-lighter)", marginBottom: 16 }}>새 아이디어 추가</div>
                <input
                  type="text"
                  placeholder="제목 (예: 라탄 행잉 체어)"
                  value={wishTitle}
                  onChange={e => setWishTitle(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-main)", fontSize: 14, outline: "none",
                    marginBottom: 10, transition: "border-color 0.2s", boxSizing: "border-box",
                  }}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--surface-border)"; }}
                />
                <textarea
                  placeholder="메모 (참고 사항, 원하는 스타일 등)"
                  value={wishNote}
                  onChange={e => setWishNote(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                    color: "var(--text-main)", fontSize: 14, outline: "none",
                    marginBottom: 10, resize: "vertical", lineHeight: 1.6,
                    transition: "border-color 0.2s", boxSizing: "border-box",
                  }}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--surface-border)"; }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                  <input
                    ref={wishImageRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setWishImage(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => wishImageRef.current?.click()}
                    style={{
                      padding: "9px 16px", borderRadius: 10,
                      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                      color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  >
                    🖼️ 이미지 첨부
                  </button>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                    또는 <kbd style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(0,0,0,0.06)", border: "1px solid var(--surface-border)", fontFamily: "monospace", fontSize: 10 }}>Ctrl+V</kbd> 로 붙여넣기
                  </span>
                  {wishImage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <img src={wishImage} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                      <button
                        onClick={() => { setWishImage(null); if (wishImageRef.current) wishImageRef.current.value = ""; }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 16, cursor: "pointer" }}
                      >✕</button>
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
                    // 이미지가 dataURL 이면 먼저 서버에 업로드해서 URL 로 변환.
                    const uploadedUrl = await uploadDataUrl(wishImage);
                    const item = {
                      id: Date.now(),
                      title: wishTitle.trim(),
                      note: wishNote.trim(),
                      imageUrl: uploadedUrl,
                      gradient: gradients[Math.floor(Math.random() * gradients.length)],
                      createdAt: new Date().toISOString(),
                    };
                    // 새로고침에도 남도록 즉시 서버 저장 (await).
                    if (projectSlug) {
                      try {
                        const r = await fetch(`/api/projects/${projectSlug}/wishlist`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify(wishlistToDbPayload(item)),
                        });
                        if (!r.ok) throw new Error(`${r.status}`);
                      } catch (e) {
                        alert("위시리스트 저장 실패: " + e.message);
                        return;
                      }
                    }
                    setWishlist(prev => [item, ...prev]);
                    prevWishlistRef.current = [item, ...prevWishlistRef.current];

                    // [Phase B-3 이후] 위시리스트는 cards 가 SOT. 저장 실패 시 사용자에게 알림.
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
                            data: { source: "wishlist", gradient: item.gradient },
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
                    setWishImage(null);
                    if (wishImageRef.current) wishImageRef.current.value = "";
                  }}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    background: wishTitle.trim() ? "linear-gradient(135deg, #eab308, #f59e0b)" : "rgba(0,0,0,0.04)",
                    border: "none",
                    color: wishTitle.trim() ? "#000" : "var(--text-muted)",
                    fontSize: 14, fontWeight: 700, cursor: wishTitle.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                  }}
                >
                  추가하기
                </button>
              </div>
            </div>

            {/* Right: Grid */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 500 }}>
                  {wishlist.length}개의 아이디어
                </div>
              </div>

              {wishlist.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>💫</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>만들고 싶은 가구 아이디어를 왼쪽 폼에서 추가해보세요</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      onClick={async () => {
                        if (projectSlug) {
                          try {
                            const detail = await fetchCardDetail(projectSlug, `wish-${item.id}`);
                            if (detail) { setDetailCard(detail); return; }
                          } catch {}
                        }
                        setDetailWish(item);
                      }}
                      className="hover-lift glass-panel"
                      style={{
                        borderRadius: 18, overflow: "hidden",
                        border: "1px solid var(--surface-border)",
                        transition: "all 0.3s",
                        cursor: "pointer",
                      }}
                    >
                      {item.imageUrl && (
                        <div style={{ width: "100%", height: 160, overflow: "hidden" }}>
                          <img src={item.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      {!item.imageUrl && (
                        <div style={{ width: "100%", height: 80, background: item.gradient }} />
                      )}
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 6,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {item.title}
                            </div>
                            {item.note && (
                              <div style={{
                                fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}>{item.note}</div>
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
                              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                              background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                              color: "var(--text-muted)", fontSize: 13, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--surface-border)"; }}
                          >✕</button>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
                          {new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
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
                </div>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
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
                </div>
                <input
                  type="password"
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder="sk-ant-..."
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
                  localStorage.setItem("gemini_api_key", geminiApiKey);
                  localStorage.setItem("claude_api_key", claudeApiKey);
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
                API 키는 브라우저 로컬 스토리지에만 저장되며 서버로 전송되지 않습니다.
              </div>
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
                          {meta?.icon} {meta?.label} · {c.updated_at?.slice(0, 10)}
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

        const STATUS_TO_TAB = { wishlist: "wishlist", drafting: "create", sheet: "sheet", done: "completed" };
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
              width: 960, maxWidth: "95vw", maxHeight: "92vh",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--surface-border)",
              borderRadius: 20, zIndex: 202,
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
              animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "14px 24px", borderBottom: "1px solid var(--surface-border)",
                display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
              }}>
                <span style={{ fontSize: 24 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {card.title}
                    {confirmed && <span style={{ fontSize: 11, marginLeft: 8, color: "#22c55e" }}>🔒 잠김</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
                {/* 아카이브 */}
                <button
                  onClick={async () => {
                    if (!confirm("이 카드를 아카이브로 옮기시겠어요?")) return;
                    try {
                      await patchCard(projectSlug, card.id, {
                        is_archived: true, force: true, actor: actorName,
                      });
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

              {/* Body */}
              <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 0 }}>
                {/* 왼쪽: 썸네일 + 액션 + 설명 */}
                <div style={{ padding: 24, borderRight: "1px solid var(--surface-border)" }}>
                  {card.thumbnail_url && (
                    <div style={{
                      background: "rgba(0,0,0,0.04)", padding: 16, borderRadius: 12,
                      marginBottom: 20, textAlign: "center",
                    }}>
                      <img
                        src={card.thumbnail_url}
                        alt=""
                        style={{
                          maxWidth: "100%", maxHeight: 340, objectFit: "contain",
                          borderRadius: 10, background: "#fff",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                        }}
                      />
                    </div>
                  )}

                  {/* 어셋 정보 인라인 편집 (자동 저장) — 카드 생성은 최소 정보, 편집은 여기서 */}
                  <AssetInfoEditor
                    card={card}
                    projectSlug={projectSlug}
                    actor={actorName}
                    disabled={confirmed}
                    onRefresh={async () => {
                      const d = await fetchCardDetail(projectSlug, card.id);
                      if (d) {
                        setDetailCard(d);
                        setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                      }
                    }}
                  />

                  {/* === Phase E: 상태별 카드 액션 === */}
                  {!confirmed && (
                    <CardActionPanel
                      card={card}
                      statusKey={statusKey}
                      projectSlug={projectSlug}
                      geminiApiKey={geminiApiKey}
                      selectedModel={selectedModel}
                      actor={actorName}
                      onMoveTo={moveTo}
                      onRefresh={async () => {
                        const d = await fetchCardDetail(projectSlug, card.id);
                        if (d) {
                          setDetailCard(d);
                          setCards((prev) => prev.map((c) => c.id === d.id ? d : c));
                        }
                      }}
                      onOpenApiSettings={() => setShowApiSettings(true)}
                    />
                  )}

                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6 }}>설명</div>
                  <div style={{
                    padding: 14, borderRadius: 10,
                    background: "rgba(0,0,0,0.03)",
                    fontSize: 13, color: "var(--text-lighter)", lineHeight: 1.8,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    minHeight: 80,
                  }}>
                    {card.description || <span style={{ color: "var(--text-muted)" }}>(설명 없음)</span>}
                  </div>

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

                {/* 오른쪽: 댓글 + 활동 이력 */}
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* 메타 */}
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    <div>생성: {card.created_at?.slice(0, 16).replace("T", " ") || "-"} · {card.created_by || "알 수 없음"}</div>
                    {card.confirmed_at && <div style={{ color: "#22c55e", marginTop: 4 }}>완료: {card.confirmed_at.slice(0, 16).replace("T", " ")} · {card.confirmed_by || "-"}</div>}
                  </div>

                  {/* 댓글 */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
                      댓글 ({card.comments?.length || 0})
                    </div>
                    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                      {(card.comments || []).map((cm) => (
                        <div key={cm.id} style={{
                          padding: "8px 12px", borderRadius: 10,
                          background: "rgba(0,0,0,0.03)", fontSize: 13,
                        }}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                            {cm.actor || "익명"} · {cm.created_at?.slice(0, 16).replace("T", " ")}
                          </div>
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{cm.body}</div>
                        </div>
                      ))}
                      {(!card.comments || card.comments.length === 0) && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                          아직 댓글이 없습니다.
                        </div>
                      )}
                    </div>
                    <CardCommentInput onSubmit={submitComment} disabled={confirmed} />
                  </div>

                  {/* 활동 이력 */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                        활동 이력 ({card.activities?.length || 0})
                      </div>
                      {card.activities?.length > 0 && (
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
                          <option value="moved">상태 이동</option>
                          <option value="field_updated">필드 수정</option>
                          <option value="comment_added">댓글</option>
                          <option value="confirmed">완료/재오픈</option>
                          <option value="created">생성</option>
                        </select>
                      )}
                    </div>
                    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                      {(card.activities || [])
                        .filter((a) => activityFilter === "all" || a.action === activityFilter ||
                          (activityFilter === "confirmed" && (a.action === "confirmed" || a.action === "reopened")))
                        .map((a) => (
                        <div key={a.id} style={{
                          fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6,
                          padding: "3px 0",
                        }}>
                          <span style={{ color: "var(--text-lighter)", fontWeight: 600 }}>
                            {a.actor || "시스템"}
                          </span>
                          {" · "}
                          {a.action}
                          {a.payload && typeof a.payload === "object" && (
                            <span style={{ color: "var(--text-muted)" }}>
                              {" "}({Object.entries(a.payload).slice(0, 2).map(([k, v]) => `${k}:${typeof v === "object" ? JSON.stringify(v).slice(0, 20) : String(v).slice(0, 20)}`).join(", ")})
                            </span>
                          )}
                          <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                            {a.created_at?.slice(5, 16).replace("T", " ")}
                          </span>
                        </div>
                      ))}
                      {(!card.activities || card.activities.length === 0) && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                          활동 이력 없음.
                        </div>
                      )}
                    </div>
                  </div>
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
                    // 새 cards 테이블에 있으면 통합 카드 모달, 없으면 기존 상세 모달로 폴백.
                    if (projectSlug) {
                      try {
                        const detail = await fetchCardDetail(projectSlug, `comp-${item.id}`);
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
                {/* Image upload */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <input
                    ref={wishImageRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setWishImage(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => wishImageRef.current?.click()}
                    style={{
                      padding: "8px 14px", borderRadius: 8,
                      background: "rgba(0,0,0,0.04)", border: "1px solid var(--surface-border)",
                      color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  >
                    🖼️ 이미지 첨부
                  </button>
                  {wishImage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <img src={wishImage} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                      <button
                        onClick={() => { setWishImage(null); if (wishImageRef.current) wishImageRef.current.value = ""; }}
                        style={{
                          background: "none", border: "none", color: "var(--text-muted)",
                          fontSize: 14, cursor: "pointer", padding: 2,
                        }}
                      >
                        ✕
                      </button>
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
                    // 이미지가 dataURL 이면 먼저 서버에 업로드해서 URL 로 변환.
                    const uploadedUrl = await uploadDataUrl(wishImage);
                    const item = {
                      id: Date.now(),
                      title: wishTitle.trim(),
                      note: wishNote.trim(),
                      imageUrl: uploadedUrl,
                      gradient: gradients[Math.floor(Math.random() * gradients.length)],
                      createdAt: new Date().toISOString(),
                    };
                    // 새로고침에도 남도록 즉시 서버 저장 (await).
                    if (projectSlug) {
                      try {
                        const r = await fetch(`/api/projects/${projectSlug}/wishlist`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify(wishlistToDbPayload(item)),
                        });
                        if (!r.ok) throw new Error(`${r.status}`);
                      } catch (e) {
                        alert("위시리스트 저장 실패: " + e.message);
                        return;
                      }
                    }
                    setWishlist(prev => [item, ...prev]);
                    prevWishlistRef.current = [item, ...prevWishlistRef.current];

                    // [Phase B-3 이후] 위시리스트는 cards 가 SOT. 저장 실패 시 사용자에게 알림.
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
                            data: { source: "wishlist", gradient: item.gradient },
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
                    setWishImage(null);
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

      {/* Floating job queue — visible on all workflow tabs (create/vote/sheet). */}
      {(activeTab === "create" || activeTab === "vote" || activeTab === "sheet") && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 340,
          maxHeight: "70vh",
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(16px)",
          borderRadius: 16,
          border: "1px solid var(--surface-border)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--surface-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🗂️</span>
              시안 작업 큐
              <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>
                ({jobs.length})
              </span>
            </div>
            <button
              onClick={spawnNewJob}
              style={{
                padding: "6px 12px", borderRadius: 9,
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                border: "none", color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              }}
              title="빈 작업 추가"
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>＋</span> 새 시안
            </button>
          </div>
          <div style={{ padding: 10, overflowY: "auto", flex: 1 }}>
            {jobs.map((job) => (
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
      )}
    </div>
  );
}
