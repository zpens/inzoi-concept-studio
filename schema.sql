-- inZOI Concept Studio — D1 schema
-- Execute with: npx wrangler d1 execute inzoi-concept-db --remote --file=./schema.sql

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
  ref_images TEXT,          -- JSON array
  variant_count INTEGER NOT NULL DEFAULT 4,
  designs TEXT,             -- JSON array of designs
  enhanced_prompt TEXT,
  selected_design INTEGER,
  feedback TEXT,
  votes TEXT,               -- JSON map { design_idx: count }
  voters TEXT,              -- JSON array of voter names
  current_voter TEXT,
  current_votes TEXT,       -- JSON array
  concept_sheet TEXT,       -- base64 dataURL (later → R2 key)
  multi_view_images TEXT,   -- JSON map
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
  colors TEXT,              -- JSON array
  gradient TEXT,
  image_url TEXT,           -- dataURL or R2 key
  concept_sheet_url TEXT,   -- dataURL or R2 key
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
