-- inZOI Concept Studio — SQLite schema (로컬 / 사내망 서버용)
-- server.js 가 자동으로 이 파일을 실행해 초기 테이블을 생성한다.
-- D1 버전(schema.sql) 과 거의 동일하며, SQLite 전용 문법 사용.

PRAGMA journal_mode = WAL;
PRAGMA synchronous  = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled project',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 0,
  loading INTEGER NOT NULL DEFAULT 0,
  loading_msg TEXT,
  loading_progress INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  top_tab TEXT DEFAULT 'furniture',
  selected_room TEXT DEFAULT '침실',
  style_preset TEXT,
  prompt TEXT,
  ref_images TEXT,
  variant_count INTEGER NOT NULL DEFAULT 1,
  designs TEXT,
  enhanced_prompt TEXT,
  selected_design INTEGER,
  feedback TEXT,
  votes TEXT,
  voters TEXT,
  current_voter TEXT,
  current_votes TEXT,
  concept_sheet TEXT,
  multi_view_images TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON jobs(project_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS completed_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  job_id TEXT,
  asset_code TEXT,
  category TEXT,
  category_label TEXT,
  category_icon TEXT,
  style TEXT,
  prompt TEXT,
  seed INTEGER,
  colors TEXT,
  gradient TEXT,
  image_url TEXT,
  concept_sheet_url TEXT,
  voters INTEGER,
  winner TEXT,
  pipeline_status TEXT,
  designer TEXT,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_completed_project ON completed_items(project_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  image_url TEXT,
  gradient TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wishlist_project ON wishlist_items(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  actor TEXT,
  action TEXT,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id, created_at DESC);

-- ─── 카드 기반 태스크 관리 (Phase A, v1.1+) ────────────────────────
-- projects = board. lists = 상태 컬럼. cards = 어셋 카드.
-- 프론트엔드가 자주 바뀌어도 여기 저장된 데이터는 유지된다.

CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status_key TEXT NOT NULL,         -- 'wishlist' | 'drafting' | 'sheet' | 'done' 등
  name TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE (project_id, status_key)
);
CREATE INDEX IF NOT EXISTS idx_lists_project ON lists(project_id, position);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,

  -- 안정 컬럼 (인덱싱 대상, 자주 안 바뀜)
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  due_date TEXT,
  priority TEXT,                     -- low/normal/high/urgent

  confirmed_at TEXT,
  confirmed_by TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  updated_by TEXT,

  -- 유연 확장 영역 (프론트엔드 튜닝의 주 대상)
  data TEXT NOT NULL DEFAULT '{}',

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cards_project ON cards(project_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_list ON cards(list_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_archived ON cards(project_id, is_archived);

-- v1.10.200 — 머티리얼 (재질) 카드 별도 테이블. 어셋 카드와 평행 구조.
-- 시안 / 참조 이미지 / 타일링 메타 등은 모두 data JSON.
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                     -- 목재/금속/석재/직물/플라스틱/유리/콘크리트/기타
  thumbnail_url TEXT,
  priority TEXT,
  assignee TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,
  updated_by TEXT,
  data TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_archived ON materials(project_id, is_archived);

CREATE TABLE IF NOT EXISTS checklists (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_checklists_card ON checklists(card_id, position);

CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  checklist_id TEXT NOT NULL,
  text TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_list ON checklist_items(checklist_id, position);

CREATE TABLE IF NOT EXISTS card_attachments (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  name TEXT,
  url TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  uploaded_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_card_attachments_card ON card_attachments(card_id, created_at DESC);

CREATE TABLE IF NOT EXISTS card_comments (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  body TEXT NOT NULL,
  actor TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_card_comments_card ON card_comments(card_id, created_at DESC);

-- append-only 이력
CREATE TABLE IF NOT EXISTS card_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  actor TEXT,
  action TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_card_activities_card ON card_activities(card_id, created_at DESC);

-- 라벨/멤버는 스키마만 준비 (UI 는 추후)
CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_labels (
  card_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (card_id, label_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  color TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_members (
  card_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  role TEXT,
  PRIMARY KEY (card_id, member_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ─── 프로필 (v1.10.8) — 댓글·편집·투표 작성자 구분용 ──────────────
-- 팀 내 누구나 추가 가능, 삭제 없음. 전역 공유.
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL DEFAULT '🧑',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── AI API 사용량 로그 (v1.10.89) ─────────────────────────
-- /api/ai/gemini/* 와 /api/ai/claude/* 프록시 통과 시마다 한 줄 INSERT.
-- actor 별로 토큰 / 추정 비용 집계해 API 설정 모달에서 확인.
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT,                  -- 호출한 프로필 이름 (헤더 X-Actor-Name)
  endpoint TEXT NOT NULL,      -- 'gemini' / 'claude'
  model TEXT,                  -- 'gemini-3-flash-image' 등
  status_code INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  image_count INTEGER,         -- 이미지 생성 모델은 토큰 대신 이미지 개수
  duration_ms INTEGER,
  cost_usd REAL,               -- 추정 (모델별 가격표 × 사용량)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_usage_actor_date ON ai_usage_log(actor, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_date ON ai_usage_log(created_at DESC);
