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
};

function getProjectSnapshot(slug) {
  const project = stmts.getProjectBySlug.get(slug);
  if (!project) return null;
  const jobsRaw = stmts.listJobs.all(project.id);
  const completedRaw = stmts.listCompleted.all(project.id);
  const wishlistRaw = stmts.listWishlist.all(project.id);
  const jobFields = ["ref_images", "designs", "votes", "voters", "current_votes", "multi_view_images"];
  const jobs = jobsRaw.map((r) => parseJsonFields(r, jobFields));
  const completed = completedRaw.map((r) => parseJsonFields(r, ["colors"]));
  return { project, jobs, completed, wishlist: wishlistRaw };
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

// 헬스체크.
app.get("/api/health", (c) =>
  c.json({ ok: true, version: "0.9.3", time: new Date().toISOString() })
);

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
    return c.json({ id, slug, name }, 201);
  } catch (err) {
    const existing = stmts.getProjectBySlug.get(slug);
    if (existing) return c.json(existing, 200);
    return c.json({ error: "slug conflict, retry" }, 409);
  }
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
  stmts.insertCompleted.run(
    id, row.id, b.job_id ?? null, b.asset_code ?? null,
    b.category ?? null, b.category_label ?? null, b.category_icon ?? null,
    b.style ?? null, b.prompt ?? null, b.seed ?? null,
    b.colors ? JSON.stringify(b.colors) : null,
    b.gradient ?? null, b.image_url ?? null, b.concept_sheet_url ?? null,
    b.voters ?? null, b.winner ?? null, b.pipeline_status ?? null,
    b.designer ?? null, b.completed_at ?? new Date().toISOString()
  );
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
  stmts.insertWishlist.run(
    id, row.id, b.title ?? "Untitled", b.note ?? null,
    b.image_url ?? null, b.gradient ?? null,
    b.created_at ?? new Date().toISOString()
  );
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
