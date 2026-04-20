import { useState, useRef, useCallback, useEffect } from "react";

// ─── Version Info ───
const APP_VERSION = "0.6.0";
const CHANGELOG = [
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
async function generateImageWithGemini(apiKey, prompt, model) {
  console.log(`Generating image with model: ${model}`);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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

  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
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

// ─── Main App ───
export default function InZOIConceptTool() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Step 1 state
  const [category, setCategory] = useState(null);
  const [topTab, setTopTab] = useState("furniture");
  const [selectedRoom, setSelectedRoom] = useState("침실");
  const [stylePreset, setStylePreset] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [refImages, setRefImages] = useState([]);

  // Step 2 state
  const [designs, setDesigns] = useState([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");

  // Step 3 state
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Voting state
  const [votes, setVotes] = useState({});
  const [voters, setVoters] = useState([]);
  const [currentVoter, setCurrentVoter] = useState("");
  const [currentVotes, setCurrentVotes] = useState([]);

  // Step 4 state
  const [conceptSheet, setConceptSheet] = useState(null);
  const [multiViewImages, setMultiViewImages] = useState({});

  // Completed list state (persisted to localStorage)
  const [completedList, setCompletedList] = useState(() => {
    try {
      const raw = localStorage.getItem("inzoi_completed_list");
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through */ }
    return SAMPLE_COMPLETED;
  });
  const [activeTab, setActiveTab] = useState("create"); // "create" | "completed" | "wishlist"
  const [expandedItem, setExpandedItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [newItemId, setNewItemId] = useState(null);

  // Wishlist state (persisted to localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const raw = localStorage.getItem("inzoi_wishlist");
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through */ }
    return SAMPLE_WISHLIST;
  });
  const [wishTitle, setWishTitle] = useState("");
  const [wishNote, setWishNote] = useState("");
  const [wishImage, setWishImage] = useState(null);
  const wishImageRef = useRef(null);

  // Version modal state
  const [versionOpen, setVersionOpen] = useState(false);

  // API key state
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [claudeApiKey, setClaudeApiKey] = useState(() => localStorage.getItem("claude_api_key") || "");
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Persist completed list + wishlist to localStorage.
  // Image data urls can exceed the ~5MB quota fast, so on quota errors
  // we retry without the heavy image fields rather than losing the item.
  useEffect(() => {
    const stripImages = (list) => list.map(({ imageUrl, conceptSheetUrl, ...rest }) => rest);
    try {
      localStorage.setItem("inzoi_completed_list", JSON.stringify(completedList));
    } catch (err) {
      try {
        localStorage.setItem("inzoi_completed_list", JSON.stringify(stripImages(completedList)));
        console.warn("완료 목록 저장 용량 초과 — 이미지 데이터는 생략하고 메타데이터만 저장했습니다.");
      } catch (e2) {
        console.error("완료 목록 저장 실패", e2);
      }
    }
  }, [completedList]);

  useEffect(() => {
    const stripImages = (list) => list.map(({ imageUrl, ...rest }) => rest);
    try {
      localStorage.setItem("inzoi_wishlist", JSON.stringify(wishlist));
    } catch (err) {
      try {
        localStorage.setItem("inzoi_wishlist", JSON.stringify(stripImages(wishlist)));
        console.warn("위시리스트 저장 용량 초과 — 이미지 데이터는 생략하고 메타데이터만 저장했습니다.");
      } catch (e2) {
        console.error("위시리스트 저장 실패", e2);
      }
    }
  }, [wishlist]);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("gemini_model") || "gemini-3-flash-image");

  const canvasRef = useRef(null);

  const STEPS = ["입력", "시안 생성", "투표", "시안 선정", "컨셉시트 생성", "결과 전달"];

  // ─── Step 1 → 2: Generate designs ───
  const generateDesigns = async () => {
    if (!category || !prompt) return;
    if (!geminiApiKey) {
      setShowApiSettings(true);
      return;
    }

    setLoading(true);
    setLoadingMsg("프롬프트 최적화 중...");
    setLoadingProgress(10);

    const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === category);
    const styleInfo = STYLE_PRESETS.find((s) => s.id === stylePreset);
    const spec = ASSET_SPECS[category] || DEFAULT_SPEC;

    let enhanced = `${catInfo.preset}, ${styleInfo?.label || "modern"} style, ${prompt}${spec.hint ? `, ${spec.hint}` : ""}, product design concept, white background, studio lighting, high detail, game asset reference`;

    try {
      // Use Claude API to enhance prompt (if key available)
      if (claudeApiKey) {
        const systemPrompt = `You are an expert furniture concept artist for inZOI (a life simulation game by KRAFTON).
Given a furniture description, generate an enhanced, detailed prompt optimized for AI image generation.
The output should describe a single piece of furniture in detail: materials, colors, proportions, style details, lighting.
Always include: "product design concept, white background, studio lighting, high detail, game asset reference"
Match the inZOI aesthetic: stylized realism, slightly idealized proportions, warm and inviting feel.
Respond ONLY with the enhanced prompt in English, nothing else.`;

        const userMsg = `Furniture type: ${catInfo.label} (${catInfo.preset})
Style: ${styleInfo?.label || "modern"}
User description: ${prompt}${spec.hint ? `\nDimension & scale reference: ${spec.hint}` : ""}
Reference images provided: ${refImages.length > 0 ? "yes" : "no"}`;

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
      setEnhancedPrompt(enhanced);

      setLoadingMsg("나노바나나2로 디자인 시안 생성 중...");
      setLoadingProgress(30);

      // Generate 1 image with Gemini API
      const seed = generateSeed();
      let imageUrl = null;
      try {
        imageUrl = await generateImageWithGemini(geminiApiKey, enhanced, selectedModel);
      } catch (imgErr) {
        console.error("Image generation failed:", imgErr);
        alert(`이미지 생성 실패: ${imgErr.message}`);
      }

      setLoadingProgress(90);
      setDesigns([{
        id: 0,
        seed,
        icon: catInfo.icon,
        gradient: "linear-gradient(135deg, #1e293b, #334155)",
        prompt: enhanced,
        imageUrl,
        colors: generateColors(5),
      }]);
      setLoadingProgress(100);
      setLoadingMsg("완료!");
      await new Promise((r) => setTimeout(r, 500));
      setStep(1);
    } catch (err) {
      console.error(err);
      alert(`이미지 생성 오류: ${err.message}`);
      setDesigns([{
        id: 0,
        seed: generateSeed(),
        icon: catInfo.icon,
        gradient: "linear-gradient(135deg, #1e293b, #334155)",
        prompt: enhanced,
        imageUrl: null,
        colors: generateColors(5),
      }]);
      setStep(1);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  // ─── Step 3 → 4: Generate concept sheet ───
  const generateConceptSheet = async () => {
    if (selectedDesign === null) return;

    setLoading(true);
    setLoadingMsg("컨셉시트 레이아웃 생성 중...");
    setLoadingProgress(20);

    const design = designs[selectedDesign];

    // Reuse the SAME source image across all view slots.
    // Gemini image generation isn't seed-consistent across calls, so
    // generating a separate image per view produced six different
    // products on one sheet. Instead we take the one image the user
    // actually voted for in Step 3 and transform it per slot.
    const sourceUrl = design.imageUrl || `/images/${category}.jpg`;
    const sourceImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = sourceUrl;
    });

    setLoadingProgress(60);

    const viewImages = {};
    const views = {};
    for (const view of VIEW_ANGLES) {
      viewImages[view.id] = sourceImg;
      views[view.id] = sourceUrl;
    }
    setMultiViewImages(views);

    setLoadingProgress(80);
    await new Promise((r) => setTimeout(r, 200));

    if (canvasRef.current) {
      const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === category);
      const styleInfo = STYLE_PRESETS.find((s) => s.id === stylePreset);
      generateConceptSheetCanvas(canvasRef.current, viewImages, {
        category: catInfo?.label || "",
        style: styleInfo?.label || "",
        prompt: enhancedPrompt || prompt,
        seed: design.seed,
        colors: design.colors,
        model: selectedModel,
      });
      setConceptSheet(canvasRef.current.toDataURL("image/png"));
    }

    setLoadingProgress(100);
    setLoadingMsg("컨셉시트 완성!");
    await new Promise((r) => setTimeout(r, 400));
    setStep(5);
    setLoading(false);
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
      {loading && <LoadingOverlay message={loadingMsg} progress={loadingProgress} />}

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
                Concept Studio
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
        {/* Tab Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.03)", padding: "4px", borderRadius: 14, border: "1px solid var(--surface-border)" }}>
          {[
            { id: "create", label: "시안 생성", icon: "✨" },
            { id: "completed", label: "완료 목록", icon: "📋", count: completedList.length },
            { id: "wishlist", label: "위시리스트", icon: "⭐", count: wishlist.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "8px 18px", borderRadius: 10,
              background: activeTab === tab.id ? "#fff" : "transparent",
              border: "none",
              color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
              fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 7,
              boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}>
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 8,
                  background: activeTab === tab.id ? "rgba(7,110,232,0.12)" : "rgba(0,0,0,0.06)",
                  color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Settings + New Start button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160, justifyContent: "flex-end" }}>
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
          {activeTab === "create" && step > 0 && (
            <button
              onClick={() => {
                setStep(0);
                setDesigns([]);
                setSelectedDesign(null);
                setConceptSheet(null);
                setFeedback("");
                setVotes({});
                setVoters([]);
                setCurrentVoter("");
                setCurrentVotes([]);
              }}
              className="hover-lift"
              style={{
                padding: "10px 24px", borderRadius: 12,
                background: "rgba(0,0,0,0.04)",
                border: "1px solid var(--surface-border)",
                color: "var(--text-lighter)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "var(--text-main)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--text-lighter)"; }}
            >
              새로 시작
            </button>
          )}
        </div>
      </header>

      {/* ═══ Create Tab ═══ */}
      {activeTab === "create" && <>

      {/* Step Indicator */}
      <div style={{ padding: "32px 0 0" }}>
        <StepIndicator currentStep={step} steps={STEPS} />
      </div>

      {/* Content */}
      <main style={{ padding: "0 40px 60px", maxWidth: 1400, margin: "0 auto" }}>

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

              {/* Generate Button */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={generateDesigns}
                  disabled={!category || !prompt}
                  className={(!category || !prompt) ? "" : "btn-primary"}
                  style={{
                    width: "100%", maxWidth: 600, padding: "20px 40px",
                    borderRadius: 20,
                    background: (!category || !prompt)
                      ? "var(--surface-color)"
                      : "",
                    border: (!category || !prompt) ? "1px solid var(--surface-border)" : "none",
                    color: (!category || !prompt) ? "var(--text-muted)" : "#fff",
                    fontSize: 18, fontWeight: 800,
                    cursor: (!category || !prompt) ? "not-allowed" : "pointer",
                    letterSpacing: "0.05em",
                    boxShadow: (!category || !prompt) ? "none" : "0 10px 30px var(--primary-glow)",
                  }}
                >
                  시안 생성하기 ✨
                </button>
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
                onClick={generateDesigns}
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
                  onClick={() => setSelectedDesign(i)}
                />
              ))}
            </div>

            {/* Next button */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => { setSelectedDesign(null); setStep(2); }}
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
                투표 시작하기 🗳️
              </button>
            </div>
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
                      onClick={() => {
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
                        setCompletedList((prev) => [newItem, ...prev]);
                        setNewItemId(newId);
                        setStep(6);
                        setTimeout(() => setActiveTab("completed"), 1200);
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

      </>} {/* end activeTab === "create" */}

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
                  onClick={() => setDetailItem(item)}
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
                  onClick={() => {
                    if (!wishTitle.trim()) return;
                    const gradients = [
                      "linear-gradient(135deg, #2e2a1a 0%, #3d2f1e 50%, #1a2e2a 100%)",
                      "linear-gradient(135deg, #2e1a2a 0%, #1a2e3e 50%, #2a2e1a 100%)",
                      "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1e293b 100%)",
                      "linear-gradient(135deg, #14120f 0%, #3d2f1e 50%, #14120f 100%)",
                    ];
                    setWishlist(prev => [{
                      id: Date.now(),
                      title: wishTitle.trim(),
                      note: wishNote.trim(),
                      imageUrl: wishImage,
                      gradient: gradients[Math.floor(Math.random() * gradients.length)],
                      createdAt: new Date().toISOString(),
                    }, ...prev]);
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
                      className="hover-lift glass-panel"
                      style={{
                        borderRadius: 18, overflow: "hidden",
                        border: "1px solid var(--surface-border)",
                        transition: "all 0.3s",
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
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 6 }}>
                              {item.title}
                            </div>
                            {item.note && (
                              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.note}</div>
                            )}
                          </div>
                          <button
                            onClick={() => setWishlist(prev => prev.filter(w => w.id !== item.id))}
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
                  inZOI Concept Studio
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
                    onClick={() => setDetailItem(item)}
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
                  onClick={() => {
                    if (!wishTitle.trim()) return;
                    const gradients = [
                      "linear-gradient(135deg, #2e2a1a 0%, #3d2f1e 50%, #1a2e2a 100%)",
                      "linear-gradient(135deg, #2e1a2a 0%, #1a2e3e 50%, #2a2e1a 100%)",
                      "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1e293b 100%)",
                      "linear-gradient(135deg, #14120f 0%, #3d2f1e 50%, #14120f 100%)",
                    ];
                    setWishlist(prev => [{
                      id: Date.now(),
                      title: wishTitle.trim(),
                      note: wishNote.trim(),
                      imageUrl: wishImage,
                      gradient: gradients[Math.floor(Math.random() * gradients.length)],
                      createdAt: new Date().toISOString(),
                    }, ...prev]);
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setWishlist(prev => prev.filter(w => w.id !== item.id));
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
    </div>
  );
}
