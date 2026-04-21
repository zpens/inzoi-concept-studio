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
