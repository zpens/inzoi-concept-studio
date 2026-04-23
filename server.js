// inZOI Concept Studio — 사내망 단일 서버
// Node.js + Hono + better-sqlite3 + 파일시스템
// 기존 Cloudflare Pages Functions (functions/api/[[catchall]].js) 로직을 포팅.
//
// 실행:  node server.js   (또는 start.bat / start.sh)
// 포트:  기본 3000, 환경변수 PORT 로 덮어쓰기 가능.

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import Database from "better-sqlite3";
import { randomUUID, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const DB_PATH = path.join(DATA_DIR, "inzoi.db");
const DIST_DIR = path.join(__dirname, "dist");
const SCHEMA_PATH = path.join(__dirname, "schema.sqlite.sql");

// ─── 런타임 준비 ─────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));

// 사내 공유용 IP 를 자동으로 찾아 콘솔에 표시.
function detectLanIps() {
  const ifs = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifs)) {
    for (const ni of ifs[name] || []) {
      if (!ni.internal && ni.family === "IPv4") ips.push(ni.address);
    }
  }
  return ips;
}

// URL-safe 짧은 slug 생성.
function randomSlug(len = 8) {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(len);
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

// JSON 필드를 자동으로 파싱해 응답에 넣어주는 헬퍼.
function parseJsonFields(row, fields) {
  if (!row) return row;
  for (const f of fields) {
    if (row[f] != null && typeof row[f] === "string") {
      try { row[f] = JSON.parse(row[f]); } catch { /* 원본 유지 */ }
    }
  }
  return row;
}

// ─── DB helpers ────────────────────────────────────────
const stmts = {
  getProjectBySlug: db.prepare("SELECT * FROM projects WHERE slug = ?"),
  getProjectIdBySlug: db.prepare("SELECT id FROM projects WHERE slug = ?"),
  listJobs: db.prepare("SELECT * FROM jobs WHERE project_id = ? ORDER BY created_at ASC"),
  listCompleted: db.prepare("SELECT * FROM completed_items WHERE project_id = ? ORDER BY completed_at DESC"),
  listWishlist: db.prepare("SELECT * FROM wishlist_items WHERE project_id = ? ORDER BY created_at DESC"),
  insertProject: db.prepare("INSERT INTO projects (id, slug, name) VALUES (?, ?, ?)"),
  updateProjectName: db.prepare("UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?"),
  touchProject: db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?"),
  upsertJob: db.prepare(`
    INSERT INTO jobs (
      id, project_id, step, loading, loading_msg, loading_progress,
      category, top_tab, selected_room, style_preset, prompt, ref_images,
      variant_count, designs, enhanced_prompt, selected_design, feedback,
      votes, voters, current_voter, current_votes,
      concept_sheet, multi_view_images, updated_at, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    ON CONFLICT(id) DO UPDATE SET
      step = excluded.step,
      loading = excluded.loading,
      loading_msg = excluded.loading_msg,
      loading_progress = excluded.loading_progress,
      category = excluded.category,
      top_tab = excluded.top_tab,
      selected_room = excluded.selected_room,
      style_preset = excluded.style_preset,
      prompt = excluded.prompt,
      ref_images = excluded.ref_images,
      variant_count = excluded.variant_count,
      designs = excluded.designs,
      enhanced_prompt = excluded.enhanced_prompt,
      selected_design = excluded.selected_design,
      feedback = excluded.feedback,
      votes = excluded.votes,
      voters = excluded.voters,
      current_voter = excluded.current_voter,
      current_votes = excluded.current_votes,
      concept_sheet = excluded.concept_sheet,
      multi_view_images = excluded.multi_view_images,
      updated_at = datetime('now'),
      updated_by = excluded.updated_by`),
  deleteJob: db.prepare("DELETE FROM jobs WHERE id = ? AND project_id = ?"),
  insertCompleted: db.prepare(`
    INSERT INTO completed_items (
      id, project_id, job_id, asset_code, category, category_label, category_icon,
      style, prompt, seed, colors, gradient, image_url, concept_sheet_url,
      voters, winner, pipeline_status, designer, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  deleteCompleted: db.prepare("DELETE FROM completed_items WHERE id = ? AND project_id = ?"),
  insertWishlist: db.prepare(`
    INSERT INTO wishlist_items (id, project_id, title, note, image_url, gradient, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`),
  deleteWishlist: db.prepare("DELETE FROM wishlist_items WHERE id = ? AND project_id = ?"),
  insertActivity: db.prepare("INSERT INTO activity_log (project_id, actor, action, payload) VALUES (?, ?, ?, ?)"),

  // ── 카드 시스템 (Phase A) ──
  listLists: db.prepare("SELECT * FROM lists WHERE project_id = ? ORDER BY position ASC"),
  getListByStatus: db.prepare("SELECT * FROM lists WHERE project_id = ? AND status_key = ?"),
  getListById: db.prepare("SELECT * FROM lists WHERE id = ? AND project_id = ?"),
  insertList: db.prepare("INSERT INTO lists (id, project_id, status_key, name, icon, position) VALUES (?, ?, ?, ?, ?, ?)"),

  listCardsByProject: db.prepare("SELECT * FROM cards WHERE project_id = ? AND is_archived = 0 ORDER BY list_id, position"),
  getCardById: db.prepare("SELECT * FROM cards WHERE id = ? AND project_id = ?"),
  insertCard: db.prepare(`
    INSERT INTO cards (
      id, project_id, list_id, position, title, description, thumbnail_url,
      due_date, priority, data, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateCardField: db.prepare(`UPDATE cards SET list_id = COALESCE(?, list_id),
    position = COALESCE(?, position), title = COALESCE(?, title),
    description = COALESCE(?, description), thumbnail_url = COALESCE(?, thumbnail_url),
    due_date = COALESCE(?, due_date), priority = COALESCE(?, priority),
    data = COALESCE(?, data), confirmed_at = COALESCE(?, confirmed_at),
    confirmed_by = COALESCE(?, confirmed_by), is_archived = COALESCE(?, is_archived),
    updated_at = datetime('now'), updated_by = COALESCE(?, updated_by)
    WHERE id = ? AND project_id = ?`),
  deleteCard: db.prepare("DELETE FROM cards WHERE id = ? AND project_id = ?"),

  // 카드 하위 엔티티 (조회는 단일 쿼리로 묶어서)
  listChecklistsByCard: db.prepare("SELECT * FROM checklists WHERE card_id = ? ORDER BY position ASC"),
  listChecklistItemsByCard: db.prepare(`SELECT ci.* FROM checklist_items ci
    JOIN checklists cl ON cl.id = ci.checklist_id
    WHERE cl.card_id = ? ORDER BY ci.position ASC`),
  listAttachmentsByCard: db.prepare("SELECT * FROM card_attachments WHERE card_id = ? ORDER BY created_at DESC"),
  listCommentsByCard: db.prepare("SELECT * FROM card_comments WHERE card_id = ? ORDER BY created_at ASC"),
  listActivitiesByCard: db.prepare("SELECT * FROM card_activities WHERE card_id = ? ORDER BY created_at DESC LIMIT 200"),

  insertComment: db.prepare("INSERT INTO card_comments (id, card_id, body, actor) VALUES (?, ?, ?, ?)"),
  insertCardActivity: db.prepare("INSERT INTO card_activities (card_id, actor, action, payload) VALUES (?, ?, ?, ?)"),
};

// 기본 리스트 (칸반 컬럼) 4개를 프로젝트에 시드. 누락 항목만 채운다.
const DEFAULT_LISTS = [
  { status_key: "wishlist", name: "아이디어",   icon: "⭐", position: 0 },
  { status_key: "drafting", name: "시안 생성",  icon: "✨", position: 1 },
  { status_key: "sheet",    name: "컨셉시트",   icon: "📑", position: 2 },
  { status_key: "done",     name: "완료",       icon: "✅", position: 3 },
];
function ensureDefaultLists(projectId) {
  for (const l of DEFAULT_LISTS) {
    const exists = stmts.getListByStatus.get(projectId, l.status_key);
    if (!exists) {
      stmts.insertList.run(randomUUID(), projectId, l.status_key, l.name, l.icon, l.position);
    }
  }
}

// 레거시 wishlist_items / completed_items 가 cards 에 아직 반영 안 됐으면 자동 복사.
// 한 번만 수행하도록 각 레거시 row 에 대해 cards 의 wish-<id> / comp-<id> 존재 여부 체크.
function ensureLegacyMigration(projectId) {
  try {
    const lists = stmts.listLists.all(projectId);
    const listByKey = Object.fromEntries(lists.map((l) => [l.status_key, l.id]));
    if (!listByKey.wishlist || !listByKey.done) return;

    const hasCard = db.prepare("SELECT 1 FROM cards WHERE id = ?");

    const wishes = db.prepare("SELECT * FROM wishlist_items WHERE project_id = ?").all(projectId);
    for (const w of wishes) {
      const cardId = `wish-${w.id}`;
      if (hasCard.get(cardId)) continue;
      stmts.insertCard.run(
        cardId, projectId, listByKey.wishlist,
        Date.parse(w.created_at || new Date().toISOString()) || Date.now(),
        w.title || "(제목 없음)", w.note || null, w.image_url || null,
        null, null,
        JSON.stringify({ source: "wishlist", gradient: w.gradient || null, auto_migrated: true }),
        null, null
      );
    }

    const completed = db.prepare("SELECT * FROM completed_items WHERE project_id = ?").all(projectId);
    for (const c of completed) {
      const cardId = `comp-${c.id}`;
      if (hasCard.get(cardId)) continue;
      const data = {
        source: "completed", auto_migrated: true,
        asset_code: c.asset_code, category: c.category,
        category_label: c.category_label, category_icon: c.category_icon,
        style: c.style, prompt: c.prompt, seed: c.seed,
        colors: c.colors ? JSON.parse(c.colors) : [],
        gradient: c.gradient, image_url: c.image_url,
        concept_sheet_url: c.concept_sheet_url, voters: c.voters,
        winner: c.winner, pipeline_status: c.pipeline_status, designer: c.designer,
      };
      stmts.insertCard.run(
        cardId, projectId, listByKey.done,
        Date.parse(c.completed_at || new Date().toISOString()) || Date.now(),
        c.category_label || c.category || "완료",
        c.prompt || null, c.concept_sheet_url || c.image_url || null,
        null, null,
        JSON.stringify(data),
        c.designer || null, c.designer || null
      );
      // confirmed_at 설정
      db.prepare("UPDATE cards SET confirmed_at = ?, confirmed_by = ? WHERE id = ?")
        .run(c.completed_at || new Date().toISOString(), c.designer || null, cardId);
    }
  } catch (err) {
    console.warn("legacy auto-migration failed (non-fatal):", err.message);
  }
}
// 시작 시 default 프로젝트에 리스트 시드.
try {
  const def = stmts.getProjectBySlug.get("default");
  if (def) ensureDefaultLists(def.id);
} catch (e) { /* default 가 아직 없으면 POST /api/projects 시 생성됨 */ }

function getProjectSnapshot(slug) {
  const project = stmts.getProjectBySlug.get(slug);
  if (!project) return null;
  ensureDefaultLists(project.id);
  ensureLegacyMigration(project.id);
  const jobsRaw = stmts.listJobs.all(project.id);
  const completedRaw = stmts.listCompleted.all(project.id);
  const wishlistRaw = stmts.listWishlist.all(project.id);
  const jobFields = ["ref_images", "designs", "votes", "voters", "current_votes", "multi_view_images"];
  const jobs = jobsRaw.map((r) => parseJsonFields(r, jobFields));
  const completed = completedRaw.map((r) => parseJsonFields(r, ["colors"]));
  // 카드 시스템 (Phase A 부터)
  const lists = stmts.listLists.all(project.id);
  const cards = stmts.listCardsByProject.all(project.id).map((c) => parseJsonFields(c, ["data"]));
  return { project, jobs, completed, wishlist: wishlistRaw, lists, cards };
}

function logCardActivity(cardId, actor, action, payload) {
  try {
    stmts.insertCardActivity.run(cardId, actor || null, action, payload ? JSON.stringify(payload) : null);
  } catch { /* best-effort */ }
}

function logActivity(projectId, actor, action, payload) {
  try {
    stmts.insertActivity.run(projectId, actor || null, action, payload ? JSON.stringify(payload) : null);
  } catch { /* best-effort */ }
}

// ─── HTTP 라우터 ───────────────────────────────────────
const app = new Hono();

// CORS 는 기본적으로 필요 없음 (동일 호스트로 서빙). 사내 다른 포트/호스트에서 호출하면 필요.
app.use("*", async (c, next) => {
  c.header("cache-control", "no-store");
  await next();
});

// 헬스체크 — package.json 의 version 을 읽어 동적으로 노출.
let PKG_VERSION = "unknown";
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf-8"));
  PKG_VERSION = pkg.version || "unknown";
} catch { /* keep default */ }
app.get("/api/health", (c) =>
  c.json({ ok: true, version: PKG_VERSION, time: new Date().toISOString() })
);

// 단일 에셋 상세 조회용 캐시 — objects.json + meta.objTags 병합. 1시간 TTL.
let _objectsCache = { fetchedAt: 0, byId: null, objTags: null };
// upstream fetch 에 5초 타임아웃 — :8080 이 꺼져있거나 느릴 때 요청이 무한 대기하지 않게.
async function timedFetch(url, ms = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

async function loadObjectsCache(base) {
  const now = Date.now();
  if (_objectsCache.byId && now - _objectsCache.fetchedAt < META_CACHE_TTL) return _objectsCache;
  const [r1, r2] = await Promise.all([
    timedFetch(`${base}/data/objects.json`),
    timedFetch(`${base}/data/meta.json`),
  ]);
  if (!r1.ok) throw new Error(`objects.json upstream ${r1.status}`);
  const objects = await r1.json();
  const meta = r2.ok ? await r2.json() : {};
  const byId = new Map();
  for (const o of objects) { if (o?.id) byId.set(o.id, o); }
  _objectsCache = { fetchedAt: now, byId, objTags: meta.objTags || {} };
  return _objectsCache;
}

// /api/object-detail/:id — 특정 에셋의 상세 정보 JSON 반환.
app.get("/api/object-detail/:id", async (c) => {
  const base = process.env.INZOI_OBJECT_LIST_URL || "http://localhost:8080";
  const rawId = c.req.param("id") || "";
  const id = rawId.replace(/[^A-Za-z0-9_\-]/g, "");
  if (!id) return c.json({ error: "invalid id" }, 400);
  try {
    const { byId, objTags } = await loadObjectsCache(base);
    const o = byId.get(id);
    if (!o) return c.json({ error: "not found" }, 404);
    const tags = typeof o.tags === "string"
      ? o.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const styleTags = (objTags[o.id] || []).filter(Boolean);
    const mats = Array.isArray(o.mats) ? o.mats : [];
    // 같은 filter 안의 다른 변형 (최대 10개, 자기 제외)
    const siblings = [];
    for (const v of byId.values()) {
      if (v.id === o.id) continue;
      if (v.filter !== o.filter) continue;
      siblings.push({
        id: v.id,
        name: v.name || v.id,
        icon_url: `/api/object-icon/${encodeURIComponent(v.icon || v.id)}`,
        price: v.price ?? null,
      });
      if (siblings.length >= 10) break;
    }
    return c.json({
      id: o.id,
      name: o.name || o.id,
      desc: o.desc || null,
      category: o.category || null,
      filter: o.filter || null,
      icon_url: `/api/object-icon/${encodeURIComponent(o.icon || o.id)}`,
      price: typeof o.price === "number" ? o.price : null,
      tags, style_tags: styleTags, mats,
      unlockable: !!o.unlockable,
      cst: !!o.cst,
      siblings,
      source_hash_url: `${base}/#item=${encodeURIComponent(o.id)}`,
    });
  } catch (err) {
    console.warn("object-detail 실패:", err.message);
    return c.json({ error: err.message }, 502);
  }
});

// /api/object-icon/:id — inzoiObjectList 의 /img/{id}.PNG 를 동일 오리진으로 프록시.
// 브라우저가 cross-origin / 혼합 콘텐츠 걱정 없이 아이콘 이미지 로드 가능.
// 24시간 브라우저 캐시 허용.
app.get("/api/object-icon/:id", async (c) => {
  const base = process.env.INZOI_OBJECT_LIST_URL || "http://localhost:8080";
  const raw = c.req.param("id") || "";
  const id = raw.replace(/[^A-Za-z0-9_\-]/g, "");
  if (!id) return c.text("invalid id", 400);
  try {
    let r = await timedFetch(`${base}/img/${id}.PNG`, 3000);
    if (!r.ok) r = await timedFetch(`${base}/img/${id}.png`, 3000);
    if (!r.ok) r = await timedFetch(`${base}/img/${id}.jpg`, 3000);
    if (!r.ok) return c.text("not found", 404);
    const buf = await r.arrayBuffer();
    return c.body(buf, 200, {
      "content-type": r.headers.get("content-type") || "image/png",
      "cache-control": "public, max-age=86400",
    });
  } catch (e) {
    return c.text(`proxy error: ${e.message}`, 502);
  }
});

// /api/object-meta — inzoiObjectList 의 meta.json + objects.json 을 읽어
// 카테고리(스펙 포함) / 스타일 목록으로 변환해 반환.
// 환경변수 INZOI_OBJECT_LIST_URL 로 대체 가능. 1시간 메모리 캐시.
// ?force=1 로 즉시 무효화.
let _metaCache = { fetchedAt: 0, data: null };
const META_CACHE_TTL = 60 * 60 * 1000; // 1 hour — 자주 안 바뀌는 데이터

app.get("/api/object-meta", async (c) => {
  const base = process.env.INZOI_OBJECT_LIST_URL || "http://localhost:8080";
  const now = Date.now();
  const force = c.req.query("force") === "1";
  if (!force && _metaCache.data && now - _metaCache.fetchedAt < META_CACHE_TTL) {
    return c.json(_metaCache.data);
  }
  try {
    const [r1, r2] = await Promise.all([
      timedFetch(`${base}/data/meta.json`),
      timedFetch(`${base}/data/objects.json`),
    ]);
    if (!r1.ok) throw new Error(`meta.json upstream ${r1.status}`);
    const meta = await r1.json();
    const objects = r2.ok ? await r2.json() : [];

    const filterKo = meta.filterKo || {};
    const catHier = meta.catHier || {};
    const objTags = meta.objTags || {};

    const styleMap = {
      Modern: "모던", Scandinavian: "스칸디나비안", Mid_Century_Modern: "미드센추리",
      Industrial: "인더스트리얼", Classic: "클래식", Natural: "내추럴",
      Vintage: "빈티지", Minimal: "미니멀", Luxury: "럭셔리",
    };
    const iconFor = (room) => ({
      "침실": "🛏️", "거실": "🛋️", "주방": "🍳", "욕실": "🚿",
      "서재": "📚", "취미": "🎨", "야외공간": "🌳", "소셜 이벤트": "🎉",
      "DEV": "⚙️", "기타": "📦", "집": "🏠", "외관": "🏡",
      "조명": "💡", "테이블 세팅": "🍽️", "플랫폼": "🎮", "음료": "🥤", "음식": "🍜",
      "승용차": "🚗", "미래형": "🚀", "자동차": "🚙", "기타(탑승)": "🏍️",
    })[room] || "📦";

    // objects 를 filter (= typeId) 별로 인덱싱. 한 번만 순회.
    const byFilter = new Map();
    for (const o of objects) {
      const f = o?.filter;
      if (!f) continue;
      if (!byFilter.has(f)) byFilter.set(f, []);
      byFilter.get(f).push(o);
    }

    // 카테고리별 스펙 생성 — Gemini 프롬프트 힌트로 쓸 수 있는 수준의 요약.
    const buildSpec = (typeId) => {
      const assets = byFilter.get(typeId) || [];
      if (assets.length === 0) return null;
      // 한글 이름 중복 제거, 앞 5개
      const nameSet = new Set();
      for (const a of assets) {
        if (a.name && typeof a.name === "string" && a.name.trim()) nameSet.add(a.name.trim());
        if (nameSet.size >= 5) break;
      }
      // 한글 설명 샘플 — 에셋 카탈로그의 가장 첫 의미있는 설명 하나만 (UI 인용용)
      let sampleDesc = null;
      for (const a of assets) {
        if (a.desc && typeof a.desc === "string") {
          const d = a.desc.trim();
          if (d && d.length > 10 && d.length < 300) { sampleDesc = d; break; }
        }
      }
      // 태그 빈도 계산
      const tagCount = new Map();
      for (const a of assets) {
        if (typeof a.tags === "string") {
          for (const t of a.tags.split(",").map((s) => s.trim()).filter(Boolean)) {
            tagCount.set(t, (tagCount.get(t) || 0) + 1);
          }
        }
      }
      const commonTags = [...tagCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([t]) => t);
      // 해당 카테고리 에셋에 달린 스타일 태그 (meta.objTags 교차)
      const styleSet = new Set();
      for (const a of assets) {
        const tags = objTags[a.id] || [];
        for (const t of tags) if (styleMap[t]) styleSet.add(t);
      }
      // 가격대
      const prices = assets.map((a) => a.price).filter((p) => typeof p === "number" && p > 0);
      const priceRange = prices.length
        ? { min: Math.min(...prices), max: Math.max(...prices), median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] }
        : null;
      // 구매 가능 / 언락 통계 — 일반 에셋인지 특수 에셋인지 파악용
      const unlockCount = assets.filter((a) => a.unlockable).length;
      const customCount = assets.filter((a) => a.cst).length;
      // 시각 참조용 썸네일 상위 8개 — customize/unlockable 아닌 기본 에셋을 선호.
      const prioritized = [...assets].sort((a, b) => {
        const aScore = (a.unlockable ? 2 : 0) + (a.cst ? 1 : 0);
        const bScore = (b.unlockable ? 2 : 0) + (b.cst ? 1 : 0);
        return aScore - bScore;
      });
      const sampleThumbs = [];
      const seenIcon = new Set();
      for (const a of prioritized) {
        const iconId = a.icon || a.id;
        if (!iconId || seenIcon.has(iconId)) continue;
        seenIcon.add(iconId);
        sampleThumbs.push({
          id: a.id,
          name: a.name || a.id,
          icon_url: `/api/object-icon/${iconId}`,
          price: a.price ?? null,
          tags: typeof a.tags === "string" ? a.tags : null,
        });
        if (sampleThumbs.length >= 8) break;
      }
      return {
        asset_count: assets.length,
        sample_names: [...nameSet],
        sample_desc: sampleDesc,
        sample_thumbs: sampleThumbs,
        common_tags: commonTags,
        styles: [...styleSet],
        price_range: priceRange,
        unlock_count: unlockCount,
        custom_count: customCount,
      };
    };

    const categories = [];
    const seen = new Set();
    for (const [group, rooms] of Object.entries(catHier)) {
      for (const [room, types] of Object.entries(rooms)) {
        if (!Array.isArray(types)) continue;
        for (const typeId of types) {
          if (seen.has(typeId)) continue;
          seen.add(typeId);
          const label = filterKo[typeId] || typeId;
          const spec = buildSpec(typeId);
          categories.push({
            id: typeId,
            label,
            room,
            group,
            icon: iconFor(room),
            preset: `${label}, furniture asset`,
            spec, // 없을 수도 있음 (objects.json 미로드 or 에셋 없음)
          });
        }
      }
    }

    // 전역 스타일 목록 — objTags 에 실제 등장한 것만.
    const stylePresent = new Set();
    for (const tags of Object.values(objTags)) {
      if (!Array.isArray(tags)) continue;
      for (const t of tags) if (styleMap[t]) stylePresent.add(t);
    }
    const styles = Object.keys(styleMap)
      .filter((id) => stylePresent.size === 0 || stylePresent.has(id))
      .map((id) => ({ id, label: styleMap[id] }));

    const out = {
      categories, styles,
      source: base,
      fetched_at: new Date().toISOString(),
      category_count: categories.length,
      style_count: styles.length,
      asset_count: objects.length,
      has_specs: objects.length > 0,
    };
    _metaCache = { fetchedAt: now, data: out };
    return c.json(out);
  } catch (err) {
    console.warn("object-meta 프록시 실패:", err.message);
    return c.json({ error: err.message, source: base }, 502);
  }
});

// POST /api/projects
// slug 가 이미 있으면 충돌 에러 대신 기존 프로젝트를 그대로 반환 (idempotent).
// 팀이 "default" 하나로 수렴할 때 race 없이 안전.
app.post("/api/projects", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const id = randomUUID();
  const slug = body.slug || randomSlug();
  const name = body.name || "Untitled project";
  try {
    stmts.insertProject.run(id, slug, name);
    ensureDefaultLists(id);
    return c.json({ id, slug, name }, 201);
  } catch (err) {
    const existing = stmts.getProjectBySlug.get(slug);
    if (existing) {
      ensureDefaultLists(existing.id);
      return c.json(existing, 200);
    }
    return c.json({ error: "slug conflict, retry" }, 409);
  }
});

// ─── 카드 시스템 API (Phase A) ──────────────────────────────────

// GET /api/projects/:slug/lists — 리스트 (칸반 컬럼) 목록
app.get("/api/projects/:slug/lists", (c) => {
  const p = stmts.getProjectBySlug.get(c.req.param("slug"));
  if (!p) return c.json({ error: "Not found" }, 404);
  ensureDefaultLists(p.id);
  return c.json(stmts.listLists.all(p.id));
});

// GET /api/projects/:slug/cards — 전체 카드 (아카이브 제외)
// ?archived=1 쿼리로 아카이브 뷰 전환.
app.get("/api/projects/:slug/cards", (c) => {
  const p = stmts.getProjectBySlug.get(c.req.param("slug"));
  if (!p) return c.json({ error: "Not found" }, 404);
  const url = new URL(c.req.url);
  const archivedOnly = url.searchParams.get("archived") === "1";
  const sql = archivedOnly
    ? "SELECT * FROM cards WHERE project_id = ? AND is_archived = 1 ORDER BY updated_at DESC"
    : "SELECT * FROM cards WHERE project_id = ? AND is_archived = 0 ORDER BY list_id, position";
  const rows = db.prepare(sql).all(p.id).map((r) => parseJsonFields(r, ["data"]));
  return c.json(rows);
});

// GET /api/projects/:slug/cards/:id — 카드 상세 (하위 엔티티 포함)
app.get("/api/projects/:slug/cards/:id", (c) => {
  const p = stmts.getProjectBySlug.get(c.req.param("slug"));
  if (!p) return c.json({ error: "Not found" }, 404);
  const card = stmts.getCardById.get(c.req.param("id"), p.id);
  if (!card) return c.json({ error: "card not found" }, 404);
  parseJsonFields(card, ["data"]);
  card.checklists    = stmts.listChecklistsByCard.all(card.id);
  card.checklist_items = stmts.listChecklistItemsByCard.all(card.id);
  card.attachments   = stmts.listAttachmentsByCard.all(card.id);
  card.comments      = stmts.listCommentsByCard.all(card.id);
  card.activities    = stmts.listActivitiesByCard.all(card.id)
    .map((a) => parseJsonFields(a, ["payload"]));
  return c.json(card);
});

// POST /api/projects/:slug/cards — 새 카드 생성
app.post("/api/projects/:slug/cards", async (c) => {
  const p = stmts.getProjectBySlug.get(c.req.param("slug"));
  if (!p) return c.json({ error: "Not found" }, 404);
  ensureDefaultLists(p.id);

  const body = await c.req.json().catch(() => ({}));
  if (!body.title || typeof body.title !== "string") {
    return c.json({ error: "title required" }, 400);
  }

  // list 해석: list_id / status_key 둘 다 허용. 기본은 'wishlist'.
  let list = null;
  if (body.list_id) list = stmts.getListById.get(body.list_id, p.id);
  else if (body.status_key) list = stmts.getListByStatus.get(p.id, body.status_key);
  if (!list) list = stmts.getListByStatus.get(p.id, "wishlist");
  if (!list) return c.json({ error: "list resolution failed" }, 500);

  const id = body.id ? String(body.id) : randomUUID();
  const data = body.data ? JSON.stringify(body.data) : "{}";
  const pos = typeof body.position === "number" ? body.position : Date.now();

  try {
    stmts.insertCard.run(
      id, p.id, list.id, pos,
      body.title, body.description ?? null, body.thumbnail_url ?? null,
      body.due_date ?? null, body.priority ?? null, data,
      body.created_by ?? body.actor ?? null,
      body.updated_by ?? body.actor ?? null
    );
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      // 동일 id 로 재시도 — 이미 존재하면 기존 반환.
      const existing = stmts.getCardById.get(id, p.id);
      if (existing) { parseJsonFields(existing, ["data"]); return c.json(existing, 200); }
    }
    throw err;
  }
  logCardActivity(id, body.actor ?? null, "created", { title: body.title, list: list.status_key });
  stmts.touchProject.run(p.id);

  const created = stmts.getCardById.get(id, p.id);
  parseJsonFields(created, ["data"]);
  return c.json(created, 201);
});

// PATCH /api/projects/:slug/cards/:id — 부분 수정 (상태 이동 포함)
app.patch("/api/projects/:slug/cards/:id", async (c) => {
  const p = stmts.getProjectBySlug.get(c.req.param("slug"));
  if (!p) return c.json({ error: "Not found" }, 404);
  const id = c.req.param("id");
  const prev = stmts.getCardById.get(id, p.id);
  if (!prev) return c.json({ error: "card not found" }, 404);

  const body = await c.req.json().catch(() => ({}));

  // confirmed 카드 수정 방어 — 재오픈하려면 명시적으로 is_archived / confirmed_at 변경 요청 필요.
  if (prev.confirmed_at && !body.force && body.is_archived === undefined && body.confirmed_at === undefined) {
    return c.json({ error: "confirmed card is locked. pass { force: true } or reopen.", locked: true }, 403);
  }

  // list_id 해석 (status_key 로 넘어올 수도 있음)
  let newListId = null;
  if (body.list_id) {
    const l = stmts.getListById.get(body.list_id, p.id);
    if (!l) return c.json({ error: "invalid list_id" }, 400);
    newListId = l.id;
  } else if (body.status_key) {
    const l = stmts.getListByStatus.get(p.id, body.status_key);
    if (!l) return c.json({ error: "invalid status_key" }, 400);
    newListId = l.id;
  }

  const dataJson = body.data !== undefined
    ? (typeof body.data === "string" ? body.data : JSON.stringify(body.data))
    : null;

  stmts.updateCardField.run(
    newListId,
    body.position ?? null,
    body.title ?? null,
    body.description ?? null,
    body.thumbnail_url ?? null,
    body.due_date ?? null,
    body.priority ?? null,
    dataJson,
    body.confirmed_at ?? null,
    body.confirmed_by ?? null,
    body.is_archived !== undefined ? (body.is_archived ? 1 : 0) : null,
    body.updated_by ?? body.actor ?? null,
    id, p.id
  );
  // updateCardField 의 SQL 이 COALESCE 를 써서 null 바인딩은 "변경 없음" 으로 처리됨.
  // 재오픈 (confirmed_at/confirmed_by 를 명시적 NULL 로 지우는 경우) 는 별도 SQL 로 강제.
  if (body.confirmed_at === null) {
    db.prepare("UPDATE cards SET confirmed_at = NULL, confirmed_by = NULL, updated_at = datetime('now') WHERE id = ? AND project_id = ?")
      .run(id, p.id);
  }
  stmts.touchProject.run(p.id);

  // 활동 이력 기록
  if (newListId && newListId !== prev.list_id) {
    const fromList = stmts.getListById.get(prev.list_id, p.id);
    const toList   = stmts.getListById.get(newListId, p.id);
    logCardActivity(id, body.actor ?? null, "moved", {
      from: fromList?.status_key ?? null, to: toList?.status_key ?? null,
    });
  }
  const changedFields = ["title", "description", "priority", "due_date", "thumbnail_url", "is_archived"]
    .filter((f) => body[f] !== undefined && body[f] !== prev[f]);
  if (changedFields.length) {
    logCardActivity(id, body.actor ?? null, "field_updated", { fields: changedFields });
  }
  if (body.confirmed_at !== undefined && body.confirmed_at !== prev.confirmed_at) {
    logCardActivity(id, body.actor ?? null, body.confirmed_at ? "confirmed" : "reopened", null);

    // Phase F: 컨펌 시점 snapshot 을 data/snapshots/ 에 immutable 로 저장.
    // 이후 수정/삭제되어도 이 파일은 남아 과거 상태 추적 가능.
    if (body.confirmed_at) {
      try {
        const snapshotDir = path.join(DATA_DIR, "snapshots");
        if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const snapshotFile = path.join(snapshotDir, `${id}__${ts}.json`);
        const snap = stmts.getCardById.get(id, p.id);
        parseJsonFields(snap, ["data"]);
        snap.checklists    = stmts.listChecklistsByCard.all(id);
        snap.checklist_items = stmts.listChecklistItemsByCard.all(id);
        snap.attachments   = stmts.listAttachmentsByCard.all(id);
        snap.comments      = stmts.listCommentsByCard.all(id);
        snap.activities    = stmts.listActivitiesByCard.all(id)
          .map((a) => parseJsonFields(a, ["payload"]));
        fs.writeFileSync(snapshotFile, JSON.stringify({
          card: snap, snapshot_at: new Date().toISOString(),
          actor: body.actor ?? null, reason: "confirmed",
        }, null, 2));
      } catch (err) {
        console.warn("snapshot write failed", err.message);
      }
    }
  }

  const next = stmts.getCardById.get(id, p.id);
  parseJsonFields(next, ["data"]);
  return c.json(next);
});

// DELETE /api/projects/:slug/cards/:id — 완전 삭제 (아카이브 하려면 PATCH is_archived=true 사용)
app.delete("/api/projects/:slug/cards/:id", (c) => {
  const p = stmts.getProjectBySlug.get(c.req.param("slug"));
  if (!p) return c.json({ error: "Not found" }, 404);
  const cardId = c.req.param("id");
  stmts.deleteCard.run(cardId, p.id);
  // 대응되는 legacy 행도 함께 제거 — 남아있으면 ensureLegacyMigration 이
  // 다음 스냅샷에서 카드를 자동 재생성해 삭제가 되돌아가 보인다.
  try {
    if (cardId.startsWith("wish-")) {
      const legacyId = cardId.slice(5);
      db.prepare("DELETE FROM wishlist_items WHERE id = ? AND project_id = ?").run(legacyId, p.id);
    } else if (cardId.startsWith("comp-")) {
      const legacyId = cardId.slice(5);
      db.prepare("DELETE FROM completed_items WHERE id = ? AND project_id = ?").run(legacyId, p.id);
    }
  } catch (e) { console.warn("legacy cleanup 실패 (무시):", e.message); }
  stmts.touchProject.run(p.id);
  return c.json({ ok: true });
});

// POST /api/projects/:slug/cards/:id/comments — 댓글 추가
app.post("/api/projects/:slug/cards/:id/comments", async (c) => {
  const p = stmts.getProjectBySlug.get(c.req.param("slug"));
  if (!p) return c.json({ error: "Not found" }, 404);
  const cardId = c.req.param("id");
  const card = stmts.getCardById.get(cardId, p.id);
  if (!card) return c.json({ error: "card not found" }, 404);

  const body = await c.req.json();
  if (!body.body || typeof body.body !== "string") return c.json({ error: "body required" }, 400);
  const id = randomUUID();
  stmts.insertComment.run(id, cardId, body.body, body.actor ?? null);
  logCardActivity(cardId, body.actor ?? null, "comment_added", { preview: body.body.slice(0, 80) });
  return c.json({ id, body: body.body, actor: body.actor ?? null, created_at: new Date().toISOString() }, 201);
});

// GET /api/projects/:slug
app.get("/api/projects/:slug", (c) => {
  const snap = getProjectSnapshot(c.req.param("slug"));
  if (!snap) return c.json({ error: "Not found" }, 404);
  return c.json(snap);
});

// PATCH /api/projects/:slug
app.patch("/api/projects/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.name === "string") stmts.updateProjectName.run(body.name, row.id);
  return c.json({ ok: true });
});

// PUT /api/projects/:slug/jobs/:id
app.put("/api/projects/:slug/jobs/:id", async (c) => {
  const slug = c.req.param("slug");
  const jobId = c.req.param("id");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  const b = await c.req.json().catch(() => ({}));
  const j = { ...b };
  const jsonFields = ["ref_images", "designs", "votes", "voters", "current_votes", "multi_view_images"];
  for (const f of jsonFields) if (j[f] != null && typeof j[f] !== "string") j[f] = JSON.stringify(j[f]);

  stmts.upsertJob.run(
    jobId, row.id,
    j.step ?? 0, j.loading ? 1 : 0, j.loading_msg ?? null, j.loading_progress ?? 0,
    j.category ?? null, j.top_tab ?? "furniture", j.selected_room ?? "침실",
    j.style_preset ?? null, j.prompt ?? null, j.ref_images ?? null,
    j.variant_count ?? 1, j.designs ?? null, j.enhanced_prompt ?? null,
    j.selected_design ?? null, j.feedback ?? null,
    j.votes ?? null, j.voters ?? null, j.current_voter ?? null, j.current_votes ?? null,
    j.concept_sheet ?? null, j.multi_view_images ?? null,
    j.updated_by ?? null
  );
  stmts.touchProject.run(row.id);
  return c.json({ ok: true, id: jobId });
});

// DELETE /api/projects/:slug/jobs/:id
app.delete("/api/projects/:slug/jobs/:id", (c) => {
  const slug = c.req.param("slug");
  const jobId = c.req.param("id");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  stmts.deleteJob.run(jobId, row.id);
  stmts.touchProject.run(row.id);
  return c.json({ ok: true });
});

// POST /api/projects/:slug/completed
app.post("/api/projects/:slug/completed", async (c) => {
  const slug = c.req.param("slug");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  const b = await c.req.json();
  const id = String(b.id ?? Date.now());
  try {
    stmts.insertCompleted.run(
      id, row.id, b.job_id ?? null, b.asset_code ?? null,
      b.category ?? null, b.category_label ?? null, b.category_icon ?? null,
      b.style ?? null, b.prompt ?? null, b.seed ?? null,
      b.colors ? JSON.stringify(b.colors) : null,
      b.gradient ?? null, b.image_url ?? null, b.concept_sheet_url ?? null,
      b.voters ?? null, b.winner ?? null, b.pipeline_status ?? null,
      b.designer ?? null, b.completed_at ?? new Date().toISOString()
    );
  } catch (err) {
    // 중복 POST (폴링·retry 동반) 은 조용히 무시해 서버 로그 폭주 방지.
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return c.json({ ok: true, duplicate: true, id }, 200);
    }
    throw err;
  }
  stmts.touchProject.run(row.id);
  logActivity(row.id, b.updated_by, "completed_added", { id, label: b.category_label });
  return c.json({ ok: true, id }, 201);
});

// DELETE /api/projects/:slug/completed/:id
app.delete("/api/projects/:slug/completed/:id", (c) => {
  const slug = c.req.param("slug");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  stmts.deleteCompleted.run(c.req.param("id"), row.id);
  stmts.touchProject.run(row.id);
  return c.json({ ok: true });
});

// POST /api/projects/:slug/wishlist
app.post("/api/projects/:slug/wishlist", async (c) => {
  const slug = c.req.param("slug");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  const b = await c.req.json();
  const id = String(b.id ?? Date.now());
  try {
    stmts.insertWishlist.run(
      id, row.id, b.title ?? "Untitled", b.note ?? null,
      b.image_url ?? null, b.gradient ?? null,
      b.created_at ?? new Date().toISOString()
    );
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      return c.json({ ok: true, duplicate: true, id }, 200);
    }
    throw err;
  }
  stmts.touchProject.run(row.id);
  return c.json({ ok: true, id }, 201);
});

// DELETE /api/projects/:slug/wishlist/:id
app.delete("/api/projects/:slug/wishlist/:id", (c) => {
  const slug = c.req.param("slug");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  stmts.deleteWishlist.run(c.req.param("id"), row.id);
  stmts.touchProject.run(row.id);
  return c.json({ ok: true });
});

// POST /api/projects/:slug/activity
app.post("/api/projects/:slug/activity", async (c) => {
  const slug = c.req.param("slug");
  const row = stmts.getProjectIdBySlug.get(slug);
  if (!row) return c.json({ error: "Not found" }, 404);
  const b = await c.req.json().catch(() => ({}));
  logActivity(row.id, b.actor, b.action || "unknown", b.payload);
  return c.json({ ok: true });
});

// POST /api/upload — dataURL 을 받아 data/images/ 에 파일로 저장하고 URL 반환.
// Gemini 시안, 컨셉시트 PNG, 위시 붙여넣기 이미지 모두 여기로 업로드해서
// DB 의 2MB row 제한을 회피한다.
app.post("/api/upload", async (c) => {
  let body;
  try { body = await c.req.json(); }
  catch { return c.json({ error: "invalid json" }, 400); }

  const dataUrl = body?.dataUrl;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return c.json({ error: "expected { dataUrl: 'data:*;base64,...' }" }, 400);
  }

  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) return c.json({ error: "malformed dataUrl" }, 400);

  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");

  // mime → 확장자 매핑 (단순 추출).
  const extMap = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
  const ext = extMap[mime] || mime.split("/")[1] || "bin";
  const id = randomUUID();
  const filename = `${id}.${ext}`;
  const filepath = path.join(IMAGES_DIR, filename);

  try {
    fs.writeFileSync(filepath, buffer);
  } catch (err) {
    console.error("image write failed", err);
    return c.json({ error: "write failed" }, 500);
  }

  return c.json({
    url: `/data/images/${filename}`,
    filename,
    mime,
    size: buffer.length,
  }, 201);
});

// 업로드된 이미지 스태틱 서빙.
app.use("/data/images/*", serveStatic({ root: "./" }));

// React 빌드 결과물 서빙. 매칭되지 않으면 SPA fallback 으로 index.html 반환.
if (fs.existsSync(DIST_DIR)) {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.notFound((c) => {
    const indexPath = path.join(DIST_DIR, "index.html");
    if (!fs.existsSync(indexPath)) {
      return c.text("dist/index.html not found — `npm run build` 먼저 실행해주세요.", 500);
    }
    return c.html(fs.readFileSync(indexPath, "utf-8"));
  });
} else {
  app.get("/", (c) =>
    c.text("dist/ 폴더가 없습니다. `npm run build` 먼저 실행해주세요.", 500)
  );
}

// ─── 서버 기동 ──────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  const lanIps = detectLanIps();
  const lines = [
    "",
    "▶ inZOI Concept Studio — 사내 로컬 서버",
    "  ─────────────────────────────────────────",
    `   로컬 확인 : http://localhost:${info.port}`,
    ...lanIps.map((ip) => `   사내 동료 : http://${ip}:${info.port}`),
    `   DB        : ${path.relative(__dirname, DB_PATH)}`,
    `   이미지    : ${path.relative(__dirname, IMAGES_DIR)}`,
    "  ─────────────────────────────────────────",
    "   중지: Ctrl+C   |   백업: npm run backup",
    "",
  ];
  console.log(lines.join("\n"));
});
