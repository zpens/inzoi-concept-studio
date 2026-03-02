import { useState, useRef, useCallback, useEffect } from "react";

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

  // Step 4 state
  const [conceptSheet, setConceptSheet] = useState(null);
  const [multiViewImages, setMultiViewImages] = useState({});

  const canvasRef = useRef(null);

  const STEPS = ["입력", "시안 생성", "시안 선택", "컨셉시트 생성", "결과 전달"];

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
    setStep(3);
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/InZOI_Logo.png" alt="inZOI" style={{ height: 28, objectFit: "contain" }} />
          <div>
            <div className="text-gradient" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Concept Studio
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em", fontWeight: 500 }}>
              AI-Powered Furniture Asset Concept Generator
            </div>
          </div>
        </div>
        {step > 0 && (
          <button
            onClick={() => {
              setStep(0);
              setDesigns([]);
              setSelectedDesign(null);
              setConceptSheet(null);
              setFeedback("");
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
                  생성된 8개의 시안 중 마음에 드는 디자인을 선택하세요.
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

            {/* Selected design info */}
            {selectedDesign !== null && (
              <div style={{
                padding: 24, borderRadius: 20,
                background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(99,102,241,0.05))",
                border: "1px solid rgba(34,211,238,0.3)",
                marginBottom: 32, backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                animation: "fadeIn 0.4s ease",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>시안 {selectedDesign + 1} 선택됨 <span style={{ color: "var(--accent)" }}>✨</span></div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, fontFamily: "monospace" }}>
                      Seed: {designs[selectedDesign].seed}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {designs[selectedDesign].colors.map((c, i) => (
                      <div key={i} style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: c, border: "2px solid rgba(255,255,255,0.2)",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Next button */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => selectedDesign !== null && setStep(2)}
                disabled={selectedDesign === null}
                className={selectedDesign === null ? "" : "btn-primary"}
                style={{
                  width: "100%", maxWidth: 600, padding: "20px 40px",
                  borderRadius: 20,
                  background: selectedDesign === null ? "var(--surface-color)" : "",
                  border: selectedDesign === null ? "1px solid var(--surface-border)" : "none",
                  color: selectedDesign === null ? "var(--text-muted)" : "#fff",
                  fontSize: 18, fontWeight: 800,
                  cursor: selectedDesign === null ? "not-allowed" : "pointer",
                  letterSpacing: "0.05em",
                  boxShadow: selectedDesign === null ? "none" : "0 10px 30px var(--primary-glow)",
                }}
              >
                선택한 시안으로 진행 🚀
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Refinement ═══ */}
        {step === 2 && (
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

        {/* ═══ STEP 4: Concept Sheet Result ═══ */}
        {(step === 3 || step === 4) && (
          <div style={{ animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <h2 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
              {step === 3 ? "컨셉시트 생성 완료" : "에셋 파이프라인 전달 완료"}
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>
              {step === 3 ? "생성된 고해상도 컨셉시트를 확인하고 다운로드하세요." : "컨셉시트가 성공적으로 전달되었습니다."}
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

                  {step === 3 && (
                    <button
                      onClick={() => setStep(4)}
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

                {step === 4 && (
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
