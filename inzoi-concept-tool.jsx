import { useState, useRef, useCallback, useEffect } from "react";

// ─── Version Info ───
const APP_VERSION = "1.3.0";
const CHANGELOG = [
  {
    version: "1.3.0",
    date: "2026-03-04",
    changes: [
      "완료 목록 카드에 대형 이미지 썸네일 추가",
      "위시리스트 기능 추가 (이미지 첨부, 메모)",
      "사이드바 탭 UI (완료 목록 / 위시리스트)",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-04",
    changes: [
      "완료된 컨셉시트 리스트 사이드 패널 추가",
      "파이프라인 전송 완료 시 자동 목록 추가",
      "버전 정보 및 변경내역 팝업 추가",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-01",
    changes: [
      "투표 및 시안 선정 워크플로우 추가",
      "다중 투표자 지원",
      "동점 시 수동 선정 기능",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-02-28",
    changes: [
      "초기 릴리스",
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
    id: 1, category: "bed", categoryLabel: "침대", categoryIcon: "🛏️",
    style: "스칸디나비안", prompt: "화이트 오크 프레임의 로우 플랫폼 침대, 슬랫 헤드보드",
    seed: 1847293650, colors: ["#d4a574", "#f5f0e8", "#8b7355", "#e8d5b7", "#2c3639"],
    gradient: "linear-gradient(135deg, #2e2a1a 0%, #1a2e2a 50%, #1a1a2e 100%)",
    completedAt: "2026-02-20T14:30:00", voters: 5, winner: "시안 3",
  },
  {
    id: 2, category: "sofa", categoryLabel: "소파", categoryIcon: "🛋️",
    style: "미드센추리", prompt: "월넛 우드 프레임 3인 소파, 머스타드 옐로우 쿠션",
    seed: 982736451, colors: ["#c2956b", "#d4af37", "#1a1a2e", "#f5f5f5", "#6b4423"],
    gradient: "linear-gradient(135deg, #1c1917 0%, #44403c 50%, #1c1917 100%)",
    completedAt: "2026-02-21T10:15:00", voters: 3, winner: "시안 5",
  },
  {
    id: 3, category: "desk", categoryLabel: "책상", categoryIcon: "🖥️",
    style: "모던", prompt: "블랙 메탈 프레임에 월넛 상판, 케이블 정리 홀 포함",
    seed: 574839201, colors: ["#1a1a2e", "#64748b", "#a87c5a", "#e2e8f0", "#334155"],
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
    completedAt: "2026-02-22T16:45:00", voters: 4, winner: "시안 1",
  },
  {
    id: 4, category: "dining-table", categoryLabel: "식탁", categoryIcon: "🍽️",
    style: "내추럴", prompt: "라이브 엣지 아카시아 원목 6인 식탁, 블랙 철제 다리",
    seed: 1293847560, colors: ["#86a873", "#a87c5a", "#f0ece3", "#3f4e4f", "#dcd7c9"],
    gradient: "linear-gradient(135deg, #14120f 0%, #3d2f1e 50%, #14120f 100%)",
    completedAt: "2026-02-23T09:20:00", voters: 6, winner: "시안 7",
  },
  {
    id: 5, category: "wardrobe", categoryLabel: "옷장", categoryIcon: "🚪",
    style: "빈티지", prompt: "앤틱 마호가니 2도어 워드로브, 조각 장식 디테일",
    seed: 738291045, colors: ["#5c3d2e", "#8b6f47", "#d4c5a9", "#3b2a1a", "#c8a882"],
    gradient: "linear-gradient(135deg, #1e1a14 0%, #3d2a1a 50%, #1a1a1e 100%)",
    completedAt: "2026-02-25T11:30:00", voters: 4, winner: "시안 2",
  },
  {
    id: 6, category: "bookshelf", categoryLabel: "책장", categoryIcon: "📚",
    style: "인더스트리얼", prompt: "파이프 프레임 5단 오픈 선반, 재활용 목재 보드",
    seed: 219384756, colors: ["#78716c", "#292524", "#d6cfc7", "#57534e", "#a8a29e"],
    gradient: "linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)",
    completedAt: "2026-02-26T15:00:00", voters: 3, winner: "시안 4",
  },
  {
    id: 7, category: "bathtub", categoryLabel: "욕조", categoryIcon: "🛁",
    style: "럭셔리", prompt: "블랙 대리석 독립형 욕조, 골드 수전 세트",
    seed: 847562913, colors: ["#1a1a1a", "#d4af37", "#2c2c2c", "#f5f5f5", "#8b7355"],
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #2c1810 50%, #0a0a14 100%)",
    completedAt: "2026-02-27T13:45:00", voters: 7, winner: "시안 6",
  },
  {
    id: 8, category: "office-chair", categoryLabel: "사무용 의자", categoryIcon: "💺",
    style: "모던", prompt: "메쉬 백 인체공학 의자, 알루미늄 베이스, 헤드레스트 포함",
    seed: 364718290, colors: ["#334155", "#0f172a", "#e2e8f0", "#64748b", "#1e293b"],
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    completedAt: "2026-02-28T10:00:00", voters: 5, winner: "시안 3",
  },
  {
    id: 9, category: "planter", categoryLabel: "화분/화단", categoryIcon: "🪴",
    style: "미니멀", prompt: "화이트 시멘트 원형 화분, 우든 스탠드 세트 3종",
    seed: 591028374, colors: ["#e2e8f0", "#a87c5a", "#86a873", "#f8fafc", "#64748b"],
    gradient: "linear-gradient(135deg, #1a2e1a 0%, #2a3a2a 50%, #1a1e2a 100%)",
    completedAt: "2026-03-01T08:30:00", voters: 2, winner: "시안 1",
  },
  {
    id: 10, category: "fireplace", categoryLabel: "벽난로", categoryIcon: "🔥",
    style: "빈티지", prompt: "빅토리안 스타일 대리석 벽난로, 아이언 그레이트 포함",
    seed: 482917365, colors: ["#f0ece3", "#78716c", "#44403c", "#d6cfc7", "#292524"],
    gradient: "linear-gradient(135deg, #2e2a1a 0%, #44403c 50%, #1c1917 100%)",
    completedAt: "2026-03-02T17:15:00", voters: 8, winner: "시안 8",
  },
];

// ─── Sample Wishlist Data ───
const SAMPLE_WISHLIST = [
  {
    id: 101, title: "둥근 라탄 의자",
    note: "발리 리조트에서 본 행잉 체어. 베란다에 두면 좋겠다",
    imageUrl: null, gradient: "linear-gradient(135deg, #2e2a1a 0%, #3d2f1e 50%, #1a2e2a 100%)",
    createdAt: "2026-02-18T11:00:00",
  },
  {
    id: 102, title: "테라조 커피 테이블",
    note: "핑크+그레이 테라조 상판, 황동 다리 조합",
    imageUrl: null, gradient: "linear-gradient(135deg, #2e1a2a 0%, #1a2e3e 50%, #2a2e1a 100%)",
    createdAt: "2026-02-19T15:30:00",
  },
  {
    id: 103, title: "일본식 좌식 테이블",
    note: "히노키 원목 로우 테이블, 접이식 다리. 다다미방 컨셉에 맞게",
    imageUrl: null, gradient: "linear-gradient(135deg, #1a2e1a 0%, #2e2a1a 50%, #1a1a2e 100%)",
    createdAt: "2026-02-20T09:00:00",
  },
  {
    id: 104, title: "네온 LED 선반",
    note: "아크릴 선반 + 하단 RGB LED 스트립. 게이밍룸/바 인테리어용",
    imageUrl: null, gradient: "linear-gradient(135deg, #1a0a2e 0%, #0a1a3e 50%, #2e0a1a 100%)",
    createdAt: "2026-02-22T20:00:00",
  },
  {
    id: 105, title: "캣타워 겸 책장",
    note: "고양이 동선을 고려한 벽걸이 모듈 선반. 책 수납 + 캣워크 겸용",
    imageUrl: null, gradient: "linear-gradient(135deg, #2e2a1a 0%, #1a2e2a 50%, #2a1a2e 100%)",
    createdAt: "2026-02-24T14:20:00",
  },
  {
    id: 106, title: "플로팅 나이트스탠드",
    note: "벽 부착형 서랍 협탁. 아래 공간 비워서 청소 편하게",
    imageUrl: null, gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    createdAt: "2026-02-25T16:45:00",
  },
  {
    id: 107, title: "아웃도어 파이어핏 테이블",
    note: "가스 버너 내장 원형 테이블. 테라스에서 불멍용",
    imageUrl: null, gradient: "linear-gradient(135deg, #2e1a0a 0%, #3e2a1a 50%, #1a0a0a 100%)",
    createdAt: "2026-02-27T18:00:00",
  },
  {
    id: 108, title: "투명 아크릴 의자",
    note: "루이 고스트 체어 스타일. 좁은 공간에서 시각적 답답함 줄이기",
    imageUrl: null, gradient: "linear-gradient(135deg, #1a1a2e 0%, #2e2e3e 50%, #1e1e2a 100%)",
    createdAt: "2026-02-28T12:30:00",
  },
  {
    id: 109, title: "빈티지 가죽 소파",
    note: "에이징 처리된 코냑 브라운 가죽, 체스터필드 스타일 버튼 터프팅",
    imageUrl: null, gradient: "linear-gradient(135deg, #1c1917 0%, #3d2a1a 50%, #1c1917 100%)",
    createdAt: "2026-03-01T10:15:00",
  },
  {
    id: 110, title: "모듈형 벽면 수납장",
    note: "격자형 큐브 유닛 자유 조합. 화이트+내추럴 오크 MIX",
    imageUrl: null, gradient: "linear-gradient(135deg, #1e293b 0%, #1a2e1a 50%, #2e2a1a 100%)",
    createdAt: "2026-03-02T11:00:00",
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
function generateConceptSheetCanvas(canvas, images, metadata) {
  const ctx = canvas.getContext("2d");
  const W = 2400, H = 3200;
  canvas.width = W;
  canvas.height = H;

  // Background
  ctx.fillStyle = "#0f0f13";
  ctx.fillRect(0, 0, W, H);

  // Header bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(1, "#16213e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 120);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px 'Segoe UI', sans-serif";
  ctx.fillText("inZOI ASSET CONCEPT SHEET", 60, 78);

  // Subtitle
  ctx.fillStyle = "#64748b";
  ctx.font = "20px 'Segoe UI', sans-serif";
  ctx.fillText(`${metadata.category} — ${metadata.style} — ${new Date().toLocaleDateString("ko-KR")}`, W - 600, 78);

  // Main view area
  const mainY = 160;
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 2;

  // Main image (large)
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(60, mainY, 1400, 1100);
  ctx.strokeRect(60, mainY, 1400, 1100);
  if (images.main) {
    ctx.drawImage(images.main, 60, mainY, 1400, 1100);
  }
  ctx.fillStyle = "#475569";
  ctx.font = "16px 'Segoe UI', sans-serif";
  ctx.fillText("MAIN VIEW (3/4)", 70, mainY + 1090);

  // Side views (right column)
  const sideX = 1500;
  const sideW = 840;
  const sideH = 530;
  const views = [
    { key: "front", label: "FRONT VIEW" },
    { key: "side", label: "SIDE VIEW" },
  ];
  views.forEach((v, i) => {
    const y = mainY + i * (sideH + 40);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(sideX, y, sideW, sideH);
    ctx.strokeRect(sideX, y, sideW, sideH);
    if (images[v.key]) {
      ctx.drawImage(images[v.key], sideX, y, sideW, sideH);
    }
    ctx.fillStyle = "#475569";
    ctx.font = "16px 'Segoe UI', sans-serif";
    ctx.fillText(v.label, sideX + 10, y + sideH - 10);
  });

  // Bottom row
  const bottomY = mainY + 1140;
  const bottomViews = [
    { key: "back", label: "BACK VIEW" },
    { key: "detail", label: "DETAIL" },
    { key: "top", label: "TOP VIEW" },
  ];
  const bw = (W - 120 - 40 * 2) / 3;
  bottomViews.forEach((v, i) => {
    const x = 60 + i * (bw + 40);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(x, bottomY, bw, 600);
    ctx.strokeRect(x, bottomY, bw, 600);
    if (images[v.key]) {
      ctx.drawImage(images[v.key], x, bottomY, bw, 600);
    }
    ctx.fillStyle = "#475569";
    ctx.font = "16px 'Segoe UI', sans-serif";
    ctx.fillText(v.label, x + 10, bottomY + 590);
  });

  // Info section
  const infoY = bottomY + 640;

  // Color palette
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillText("COLOR PALETTE", 60, infoY + 30);
  const colors = metadata.colors || generateColors(5);
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(60 + i * 120, infoY + 50, 100, 60);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(60 + i * 120, infoY + 50, 100, 60);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px monospace";
    ctx.fillText(c, 65 + i * 120, infoY + 130);
  });

  // Metadata
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillText("SPECIFICATIONS", 900, infoY + 30);

  const specs = [
    `카테고리: ${metadata.category}`,
    `스타일: ${metadata.style}`,
    `프롬프트: ${metadata.prompt?.substring(0, 60)}...`,
    `생성 모델: ComfyUI Pipeline`,
    `시드: ${metadata.seed || "N/A"}`,
  ];
  ctx.fillStyle = "#94a3b8";
  ctx.font = "18px 'Segoe UI', sans-serif";
  specs.forEach((s, i) => {
    ctx.fillText(s, 900, infoY + 65 + i * 32);
  });

  // Footer
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, H - 50, W, 50);
  ctx.fillStyle = "#475569";
  ctx.font = "14px 'Segoe UI', sans-serif";
  ctx.fillText("Generated with inZOI Asset Concept Tool — Powered by ComfyUI", 60, H - 18);
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
              borderTop: "1px solid rgba(255,255,255,0.05)",
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
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
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
              background: "rgba(255,255,255,0.02)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.background = "rgba(99,102,241,0.05)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
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
        boxShadow: selected ? "0 0 35px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.1)" : "0 8px 32px rgba(0,0,0,0.3)",
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
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 54, filter: selected ? "none" : "grayscale(0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
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
          background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
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
      background: "radial-gradient(circle at center, rgba(11, 12, 16, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ position: "relative", width: 100, height: 100 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.05)",
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
          background: "rgba(99,102,241,0.1)",
          boxShadow: "0 0 30px var(--primary-glow)",
          animation: "pulseGlow 2s infinite",
        }} />
      </div>
      <div className="text-gradient" style={{ marginTop: 32, fontSize: 22, fontWeight: 700, letterSpacing: "0.02em" }}>
        {message}
      </div>
      {progress !== undefined && (
        <div style={{ width: 320, height: 6, background: "rgba(0,0,0,0.5)", borderRadius: 3, marginTop: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
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

  // Completed list state
  const [completedList, setCompletedList] = useState(SAMPLE_COMPLETED);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("completed"); // "completed" | "wishlist"
  const [expandedItem, setExpandedItem] = useState(null);
  const [newItemId, setNewItemId] = useState(null);

  // Wishlist state
  const [wishlist, setWishlist] = useState(SAMPLE_WISHLIST);
  const [wishTitle, setWishTitle] = useState("");
  const [wishNote, setWishNote] = useState("");
  const [wishImage, setWishImage] = useState(null);
  const wishImageRef = useRef(null);

  // Version modal state
  const [versionOpen, setVersionOpen] = useState(false);

  const canvasRef = useRef(null);

  const STEPS = ["입력", "시안 생성", "투표", "시안 선정", "컨셉시트 생성", "결과 전달"];

  // ─── Step 1 → 2: Generate designs ───
  const generateDesigns = async () => {
    if (!category || !prompt) return;

    setLoading(true);
    setLoadingMsg("프롬프트 최적화 중...");
    setLoadingProgress(10);

    try {
      // Use Claude API to enhance prompt
      const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === category);
      const styleInfo = STYLE_PRESETS.find((s) => s.id === stylePreset);
      const spec = ASSET_SPECS[category] || DEFAULT_SPEC;

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

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await response.json();
      const enhanced = data.content?.[0]?.text || `${catInfo.preset}, ${styleInfo?.label || "modern"} style, ${prompt}${spec.hint ? `, ${spec.hint}` : ""}, product design concept, white background, studio lighting, high detail, game asset reference`;
      setEnhancedPrompt(enhanced);

      setLoadingMsg("디자인 시안 생성 중...");
      setLoadingProgress(30);

      // Generate multiple design variations
      const gradients = [
        "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1e293b 100%)",
        "linear-gradient(135deg, #1e293b 0%, #1a2e1a 50%, #2e1a1a 100%)",
        "linear-gradient(135deg, #2e2a1a 0%, #1a2e2a 50%, #1a1a2e 100%)",
        "linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 50%, #1a1a2e 100%)",
        "linear-gradient(135deg, #2e1a2a 0%, #1a2e3e 50%, #2a2e1a 100%)",
        "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        "linear-gradient(135deg, #1c1917 0%, #44403c 50%, #1c1917 100%)",
        "linear-gradient(135deg, #14120f 0%, #3d2f1e 50%, #14120f 100%)",
      ];

      const newDesigns = [];
      for (let i = 0; i < 8; i++) {
        setLoadingProgress(30 + (i / 8) * 60);
        setLoadingMsg(`디자인 시안 생성 중... (${i + 1}/8)`);

        const seed = generateSeed();
        newDesigns.push({
          id: i,
          seed,
          icon: catInfo.icon,
          gradient: gradients[i],
          prompt: enhanced,
          imageUrl: null, // ComfyUI would provide actual images
          colors: generateColors(5),
        });

        // Simulate generation time
        await new Promise((r) => setTimeout(r, 300));
      }

      setDesigns(newDesigns);
      setLoadingProgress(100);
      setLoadingMsg("완료!");
      await new Promise((r) => setTimeout(r, 500));
      setStep(1);
    } catch (err) {
      console.error(err);
      // Fallback: generate without API
      const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === category);
      const fallbackDesigns = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        seed: generateSeed(),
        icon: catInfo.icon,
        gradient: `linear-gradient(${100 + i * 25}deg, #1a1a2e, #334155)`,
        prompt: prompt,
        imageUrl: null,
        colors: generateColors(5),
      }));
      setDesigns(fallbackDesigns);
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
    setLoadingMsg("멀티뷰 이미지 생성 중...");
    setLoadingProgress(10);

    const design = designs[selectedDesign];
    const views = {};

    // Simulate multi-view generation
    for (let i = 0; i < VIEW_ANGLES.length; i++) {
      const view = VIEW_ANGLES[i];
      setLoadingMsg(`${view.label} 뷰 생성 중... (${i + 1}/${VIEW_ANGLES.length})`);
      setLoadingProgress(10 + (i / VIEW_ANGLES.length) * 70);
      await new Promise((r) => setTimeout(r, 400));
      views[view.id] = null; // ComfyUI would provide actual images
    }

    setMultiViewImages(views);
    setLoadingMsg("컨셉시트 레이아웃 생성 중...");
    setLoadingProgress(85);

    // Generate concept sheet on canvas
    await new Promise((r) => setTimeout(r, 500));

    if (canvasRef.current) {
      const catInfo = FURNITURE_CATEGORIES.find((c) => c.id === category);
      const styleInfo = STYLE_PRESETS.find((s) => s.id === stylePreset);
      generateConceptSheetCanvas(canvasRef.current, views, {
        category: catInfo?.label || "",
        style: styleInfo?.label || "",
        prompt: enhancedPrompt || prompt,
        seed: design.seed,
        colors: design.colors,
      });
      setConceptSheet(canvasRef.current.toDataURL("image/png"));
    }

    setLoadingProgress(100);
    setLoadingMsg("컨셉시트 완성!");
    await new Promise((r) => setTimeout(r, 500));
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
                background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)",
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => { setSidebarTab("wishlist"); setSidebarOpen(true); }}
            className="hover-lift"
            style={{
              padding: "10px 20px", borderRadius: 12,
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)",
              color: "#fbbf24", fontSize: 14, fontWeight: 600, cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.3s",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(234,179,8,0.2)"; e.currentTarget.style.borderColor = "rgba(234,179,8,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(234,179,8,0.1)"; e.currentTarget.style.borderColor = "rgba(234,179,8,0.3)"; }}
          >
            <span style={{ fontSize: 16 }}>⭐</span>
            위시리스트
            <span style={{
              background: "linear-gradient(135deg, #eab308, #f59e0b)",
              color: "#000", fontSize: 11, fontWeight: 800,
              padding: "2px 8px", borderRadius: 10, minWidth: 20, textAlign: "center",
            }}>
              {wishlist.length}
            </span>
          </button>
          <button
            onClick={() => { setSidebarTab("completed"); setSidebarOpen(true); }}
            className="hover-lift"
            style={{
              padding: "10px 20px", borderRadius: 12,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#a5b4fc", fontSize: 14, fontWeight: 600, cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.3s",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
          >
            <span style={{ fontSize: 16 }}>📋</span>
            완료 목록
            <span style={{
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              color: "#fff", fontSize: 11, fontWeight: 800,
              padding: "2px 8px", borderRadius: 10, minWidth: 20, textAlign: "center",
            }}>
              {completedList.length}
            </span>
          </button>
          {step > 0 && (
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
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--surface-border)",
                color: "var(--text-lighter)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                backdropFilter: "blur(8px)",
                transition: "all 0.3s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-lighter)"; }}
            >
              새로 시작
            </button>
          )}
        </div>
      </header>

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
                      background: topTab === tab.id ? "rgba(255,255,255,0.05)" : "transparent",
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
                <div style={{ border: "1px solid var(--surface-border)", borderTop: "none", borderRadius: "0 0 16px 16px", overflow: "hidden", background: "rgba(0,0,0,0.2)" }}>
                  {/* Room tabs — horizontal */}
                  <div style={{ display: "flex", gap: 0, overflowX: "auto", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--surface-border)", scrollbarWidth: "none" }}>
                    {(topTab === "furniture"
                      ? ["침실", "거실", "주방", "욕실", "서재", "야외공간", "취미", "소셜 이벤트", "기타"]
                      : ["벽", "바닥", "지붕", "문", "창문", "계단", "기둥", "울타리", "기타 건축"]
                    ).map(room => (
                      <button key={room} onClick={() => { setSelectedRoom(room); setCategory(null); }} style={{
                        flexShrink: 0,
                        padding: "12px 20px", border: "none",
                        borderBottom: selectedRoom === room ? "2px solid var(--accent)" : "2px solid transparent",
                        borderRight: "1px solid rgba(255,255,255,0.05)",
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
                        background: category === cat.id ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                        color: category === cat.id ? "#fff" : "var(--text-muted)",
                        fontSize: 13, fontWeight: category === cat.id ? 700 : 500,
                        boxShadow: category === cat.id ? "0 4px 15px rgba(34,211,238,0.2)" : "none",
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
                      <div style={{ marginTop: 8, fontSize: 12, color: "#6366f1" }}>
                        선택: {FURNITURE_CATEGORIES.find(c => c.id === category)?.icon} {FURNITURE_CATEGORIES.find(c => c.id === category)?.room} &gt; {FURNITURE_CATEGORIES.find(c => c.id === category)?.label}
                      </div>
                      <div style={{
                        marginTop: 12, padding: "16px 20px", borderRadius: 14,
                        background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)",
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
                            borderTop: "1px solid rgba(255,255,255,0.06)",
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
                        background: stylePreset === s.id ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
                        cursor: "pointer", transition: "all 0.3s",
                        display: "flex", alignItems: "center", gap: 10,
                        color: stylePreset === s.id ? "#fff" : "var(--text-muted)", fontSize: 14, fontWeight: 600,
                        boxShadow: stylePreset === s.id ? "0 4px 15px rgba(34,211,238,0.2)" : "none",
                      }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: s.color, boxShadow: "0 2px 5px rgba(0,0,0,0.5)" }} />
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
                    background: "rgba(0,0,0,0.3)", color: "var(--text-main)",
                    fontSize: 15, lineHeight: 1.6, resize: "vertical",
                    outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box", transition: "all 0.3s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.boxShadow = "0 0 20px rgba(99, 102, 241, 0.2)";
                    e.target.style.background = "rgba(0,0,0,0.5)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--surface-border)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "rgba(0,0,0,0.3)";
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
                  생성된 8개의 시안을 확인하고 팀 투표를 진행하세요.
                </p>
              </div>
              <button
                onClick={generateDesigns}
                className="hover-lift glass-panel"
                style={{
                  padding: "12px 24px", borderRadius: 14,
                  background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
                  color: "var(--text-lighter)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-lighter)"; }}
              >
                <span style={{ fontSize: 16 }}>🔄</span> 재생성
              </button>
            </div>

            {/* Enhanced prompt display */}
            {enhancedPrompt && (
              <div className="glass-panel" style={{
                padding: 24, borderRadius: 16,
                background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.02))",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                marginBottom: 32,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px rgba(34,211,238,0.8)" }} />
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
                    border: "2px solid var(--surface-border)", background: "rgba(0,0,0,0.3)",
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
                    boxShadow: currentVotes.includes(i) ? "0 0 35px rgba(34, 211, 238, 0.4)" : "0 8px 32px rgba(0,0,0,0.3)",
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
                          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
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
                      background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
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
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
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
                        <div style={{ flex: 1, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
                          <div className="vote-bar-fill" style={{
                            width: `${maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0}%`,
                            height: "100%", borderRadius: 8,
                            background: isWinner
                              ? "linear-gradient(90deg, var(--accent), rgba(34,211,238,0.6))"
                              : "linear-gradient(90deg, var(--primary), rgba(99,102,241,0.4))",
                            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: isWinner ? "0 0 15px rgba(34,211,238,0.4)" : "none",
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
                      border: "1px solid rgba(34,211,238,0.3)",
                      background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(99,102,241,0.05))",
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
                                background: selectedDesign === idx ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.03)",
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
                            boxShadow: "0 0 20px rgba(34,211,238,0.3)",
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
                        background: "rgba(255,255,255,0.03)", fontSize: 13,
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
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
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
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 96, boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                      }}>
                        {designs[selectedDesign]?.icon}
                      </div>
                    </div>
                  )}
                  <div style={{
                    position: "absolute", top: 20, left: 20,
                    padding: "8px 16px", borderRadius: 12,
                    background: "rgba(34,211,238,0.9)",
                    backdropFilter: "blur(4px)",
                    fontSize: 14, fontWeight: 800, color: "#000",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
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
                        border: "1px solid rgba(255,255,255,0.15)",
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
                      <div style={{ fontSize: 14, color: "var(--text-lighter)", lineHeight: 1.6, background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8 }}>{prompt}</div>
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
                      borderRadius: 16, border: "2px solid rgba(255,255,255,0.1)",
                      background: "rgba(0,0,0,0.4)", color: "var(--text-main)",
                      fontSize: 15, lineHeight: 1.6, resize: "vertical",
                      outline: "none", fontFamily: "inherit",
                      boxSizing: "border-box", transition: "all 0.3s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.background = "rgba(0,0,0,0.6)";
                      e.target.style.boxShadow = "0 0 15px rgba(99,102,241,0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                      e.target.style.background = "rgba(0,0,0,0.4)";
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
                      background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
                      color: "var(--text-lighter)", fontSize: 15, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-lighter)"; }}
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
                  background: "rgba(0,0,0,0.5)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
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
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>해상도</span>
                      <span style={{ fontWeight: 600 }}>2400 × 3200<small>px</small></span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>포맷</span>
                      <span style={{ fontWeight: 600, color: "var(--accent)" }}>PNG</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--text-muted)" }}>카테고리</span>
                      <span style={{ fontWeight: 600 }}>{FURNITURE_CATEGORIES.find((c) => c.id === category)?.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
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
                        background: "rgba(255,255,255,0.05)", fontSize: 13, color: "var(--text-main)",
                        display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
                        border: "1px solid rgba(255,255,255,0.05)",
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
                      background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
                      color: "var(--text-lighter)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      transition: "all 0.3s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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

      {/* Version Info Modal */}
      {versionOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setVersionOpen(false)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480, maxWidth: "90vw", maxHeight: "80vh",
            background: "rgba(15, 17, 24, 0.97)",
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
                  background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
                  color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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
                  borderBottom: idx < CHANGELOG.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: idx === 0 ? "var(--accent)" : "var(--text-lighter)",
                      background: idx === 0 ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)",
                      border: idx === 0 ? "1px solid rgba(34,211,238,0.25)" : "1px solid var(--surface-border)",
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

      {/* Sidebar Panel */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`sidebar-panel ${sidebarOpen ? "sidebar-open" : ""}`}>
        {/* Sidebar Header */}
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid var(--surface-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
              {sidebarTab === "completed" ? "완료된 컨셉시트" : "위시리스트"}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
                color: "var(--text-muted)", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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
                  background: sidebarTab === tab.key ? "rgba(255,255,255,0.06)" : "transparent",
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
                  background: sidebarTab === tab.key ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                  color: sidebarTab === tab.key ? "#a5b4fc" : "var(--text-muted)",
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
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    style={{
                      borderRadius: 16,
                      background: expandedItem === item.id ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)",
                      border: expandedItem === item.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--surface-border)",
                      cursor: "pointer", transition: "all 0.2s",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {newItemId === item.id && (
                      <span style={{
                        position: "absolute", top: 12, right: 12, zIndex: 2,
                        background: "linear-gradient(135deg, #22d3ee, #6366f1)",
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
                        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
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
                            background: c, border: "1px solid rgba(255,255,255,0.1)",
                          }} />
                        ))}
                      </div>
                      {/* Expanded details */}
                      {expandedItem === item.id && (
                        <div style={{
                          marginTop: 12, paddingTop: 12,
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          animation: "fadeIn 0.3s ease",
                        }}>
                          <div style={{ fontSize: 13, color: "var(--text-lighter)", lineHeight: 1.7, marginBottom: 10 }}>
                            {item.prompt}
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
                            <span>Seed: <code style={{ color: "var(--accent)", fontFamily: "monospace" }}>{item.seed}</code></span>
                            <span>카테고리: {item.category}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                            완료: {new Date(item.completedAt).toLocaleString("ko-KR")}
                          </div>
                        </div>
                      )}
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
                    background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
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
                    background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
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
                      background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
                      color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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
                    background: wishTitle.trim() ? "linear-gradient(135deg, #eab308, #f59e0b)" : "rgba(255,255,255,0.05)",
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
                        background: "rgba(255,255,255,0.03)",
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
                              background: "rgba(255,255,255,0.05)", border: "1px solid var(--surface-border)",
                              color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--surface-border)"; }}
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

      {/* Hidden canvas for concept sheet generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ComfyUI Integration Note */}
      {step === 0 && (
        <div style={{
          margin: "0 40px 40px", padding: 20, borderRadius: 12,
          background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)",
          maxWidth: 1400, marginLeft: "auto", marginRight: "auto",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 8 }}>
            ℹ️ ComfyUI 연동 안내
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
            현재 프로토타입은 UI 플로우와 프롬프트 최적화(Claude API)를 시연합니다.
            실제 이미지 생성을 위해서는 ComfyUI 클라우드 API(ViewComfy, RunComfy 등)를 연동해야 합니다.
            <code style={{
              padding: "2px 6px", borderRadius: 4, background: "#1e293b",
              fontSize: 11, margin: "0 4px",
            }}>
              workflow_api.json
            </code>
            파일을 클라우드에 배포하면, 이 UI에서 직접 이미지 생성이 가능합니다.
          </div>
        </div>
      )}
    </div>
  );
}
