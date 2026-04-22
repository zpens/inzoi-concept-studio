// 기존 wishlist_items / completed_items / jobs 테이블에 남아있는 데이터를
// 새 cards 테이블로 복사한다. 원본은 유지(롤백 대비).
//
// 실행:   pm2 stop inzoi && npm run migrate:cards && pm2 start inzoi
//
// 규칙:
//   - wishlist_items  → cards.list=wishlist
//   - jobs (step 0~1) → cards.list=drafting
//   - jobs (step 2~3) → cards.list=drafting (투표는 시안 생성 내부로 통합)
//   - jobs (step 4~5) → cards.list=sheet
//   - jobs (step 6)   → cards.list=done
//   - completed_items → cards.list=done
// 중복 id 는 스킵.

import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "inzoi.db");
const db = new Database(DB_PATH);

function info(msg) { console.log(msg); }

// 1) default 프로젝트 + 기본 리스트 확보.
let proj = db.prepare("SELECT id FROM projects WHERE slug = ?").get("default");
if (!proj) {
  const id = randomUUID();
  db.prepare("INSERT INTO projects (id, slug, name) VALUES (?, ?, ?)")
    .run(id, "default", "inZOI Asset Studio");
  proj = { id };
  info(`[+] default 프로젝트 새로 생성`);
}
const DEFAULT_LISTS = [
  { status_key: "wishlist", name: "아이디어",   icon: "⭐", position: 0 },
  { status_key: "drafting", name: "시안 생성",  icon: "✨", position: 1 },
  { status_key: "sheet",    name: "컨셉시트",   icon: "📑", position: 2 },
  { status_key: "done",     name: "완료",       icon: "✅", position: 3 },
];
for (const l of DEFAULT_LISTS) {
  const exists = db.prepare("SELECT id FROM lists WHERE project_id = ? AND status_key = ?")
    .get(proj.id, l.status_key);
  if (!exists) {
    db.prepare("INSERT INTO lists (id, project_id, status_key, name, icon, position) VALUES (?, ?, ?, ?, ?, ?)")
      .run(randomUUID(), proj.id, l.status_key, l.name, l.icon, l.position);
  }
}
const listByKey = Object.fromEntries(
  db.prepare("SELECT status_key, id FROM lists WHERE project_id = ?").all(proj.id)
    .map((r) => [r.status_key, r.id])
);

// 카드 id 에 prefix 붙여서 기존 id 공간과 구분.
const idFor = (prefix, origId) => `${prefix}-${origId}`;

const hasCard = db.prepare("SELECT 1 FROM cards WHERE id = ?");
const insertCard = db.prepare(`
  INSERT INTO cards (
    id, project_id, list_id, position, title, description, thumbnail_url,
    due_date, priority, data, created_at, updated_at, created_by, updated_by,
    confirmed_at, confirmed_by, is_archived
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const migrate = db.transaction(() => {
  const result = { wishlist: 0, jobs: 0, completed: 0, skipped: 0 };

  // 2) wishlist_items → cards.list=wishlist
  const wishRows = db.prepare("SELECT * FROM wishlist_items WHERE project_id = ?").all(proj.id);
  for (const w of wishRows) {
    const cardId = idFor("wish", w.id);
    if (hasCard.get(cardId)) { result.skipped++; continue; }
    insertCard.run(
      cardId, proj.id, listByKey.wishlist, Date.parse(w.created_at || new Date().toISOString()),
      w.title || "(제목 없음)", w.note || null, w.image_url || null,
      null, null,
      JSON.stringify({ source: "wishlist", gradient: w.gradient || null }),
      w.created_at || null, w.created_at || null, null, null,
      null, null, 0
    );
    result.wishlist++;
  }

  // 3) jobs → cards (step 에 따라 list)
  const jobRows = db.prepare("SELECT * FROM jobs WHERE project_id = ?").all(proj.id);
  for (const j of jobRows) {
    const cardId = idFor("job", j.id);
    if (hasCard.get(cardId)) { result.skipped++; continue; }

    const step = j.step ?? 0;
    const listKey = step >= 6 ? "done" : step >= 4 ? "sheet" : step >= 2 ? "drafting" : "drafting";

    // 썸네일: 첫 디자인 이미지 또는 concept_sheet
    let thumb = null;
    try {
      const designs = j.designs ? JSON.parse(j.designs) : [];
      thumb = designs.find((d) => d && d.imageUrl)?.imageUrl || null;
    } catch {}
    if (!thumb && j.concept_sheet) thumb = j.concept_sheet;

    const data = {
      source: "job",
      original_step: step,
      category: j.category,
      style_preset: j.style_preset,
      prompt: j.prompt,
      enhanced_prompt: j.enhanced_prompt,
      designs: safeJson(j.designs, []),
      selected_design: j.selected_design,
      votes: safeJson(j.votes, {}),
      voters: safeJson(j.voters, []),
      concept_sheet: j.concept_sheet,
      seed_chain: safeJson(j.designs, []).map((d) => d?.seed).filter(Boolean),
    };

    insertCard.run(
      cardId, proj.id, listByKey[listKey],
      Date.parse(j.created_at || new Date().toISOString()),
      j.prompt ? j.prompt.slice(0, 60) : (j.category || "작업"),
      null, thumb, null, null,
      JSON.stringify(data),
      j.created_at || null, j.updated_at || null, null, j.updated_by || null,
      step >= 6 ? (j.updated_at || new Date().toISOString()) : null,
      step >= 6 ? (j.updated_by || null) : null,
      0
    );
    result.jobs++;
  }

  // 4) completed_items → cards.list=done
  const compRows = db.prepare("SELECT * FROM completed_items WHERE project_id = ?").all(proj.id);
  for (const c of compRows) {
    const cardId = idFor("comp", c.id);
    if (hasCard.get(cardId)) { result.skipped++; continue; }

    const data = {
      source: "completed",
      asset_code: c.asset_code,
      category: c.category,
      category_label: c.category_label,
      category_icon: c.category_icon,
      style: c.style,
      prompt: c.prompt,
      seed: c.seed,
      colors: safeJson(c.colors, []),
      gradient: c.gradient,
      voters: c.voters,
      winner: c.winner,
      pipeline_status: c.pipeline_status,
      designer: c.designer,
      concept_sheet_url: c.concept_sheet_url,
    };

    insertCard.run(
      cardId, proj.id, listByKey.done,
      Date.parse(c.completed_at || new Date().toISOString()),
      c.category_label || c.category || "완료 아이템",
      c.prompt || null, c.concept_sheet_url || c.image_url || null,
      null, null,
      JSON.stringify(data),
      c.completed_at || null, c.completed_at || null, c.designer || null, c.designer || null,
      c.completed_at || null, c.designer || null, 0
    );
    result.completed++;
  }

  return result;
});

function safeJson(s, fallback) {
  if (s == null) return fallback;
  if (typeof s === "object") return s;
  try { return JSON.parse(s); } catch { return fallback; }
}

const r = migrate();
info("[✓] 이관 완료");
info(`    wishlist  → ${r.wishlist}개`);
info(`    jobs      → ${r.jobs}개`);
info(`    completed → ${r.completed}개`);
info(`    (이미 존재) 스킵 → ${r.skipped}개`);

const total = db.prepare("SELECT COUNT(*) n FROM cards WHERE project_id = ?").get(proj.id).n;
info(`[i] cards 테이블 총 ${total}개`);

db.close();
