// Cloudflare Pages Functions — 단일 API 라우터.
// D1 바인딩 env.DB 가 wrangler.jsonc 에서 주입됨.
//
// 라우트 요약:
//   POST   /api/projects                               → 새 프로젝트 생성
//   GET    /api/projects/:slug                         → 프로젝트 + 전체 자식 리소스 스냅샷
//   PATCH  /api/projects/:slug                         → 이름/메타 수정
//   PUT    /api/projects/:slug/jobs/:id                → job upsert (전체 치환)
//   DELETE /api/projects/:slug/jobs/:id                → job 삭제
//   POST   /api/projects/:slug/completed               → completed 아이템 추가
//   DELETE /api/projects/:slug/completed/:id           → completed 삭제
//   POST   /api/projects/:slug/wishlist                → 위시리스트 추가
//   DELETE /api/projects/:slug/wishlist/:id            → 위시리스트 삭제
//   POST   /api/projects/:slug/activity                → 활동 로그 추가

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const notFound = () => json({ error: "Not found" }, 404);
const badRequest = (msg) => json({ error: msg || "Bad request" }, 400);

// ── slug / id 생성 (URL-safe 짧은 문자열) ──
function randomSlug(len = 8) {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

function parseJsonFields(row, fields) {
  if (!row) return row;
  for (const f of fields) {
    if (row[f] != null && typeof row[f] === "string") {
      try { row[f] = JSON.parse(row[f]); } catch { /* leave */ }
    }
  }
  return row;
}

// ── 프로젝트 조회: 모든 자식 리소스까지 한 번에 ──
async function getProjectSnapshot(DB, slug) {
  const proj = await DB.prepare("SELECT * FROM projects WHERE slug = ?").bind(slug).first();
  if (!proj) return null;

  const jobsRes = await DB.prepare(
    "SELECT * FROM jobs WHERE project_id = ? ORDER BY created_at ASC"
  ).bind(proj.id).all();
  const completedRes = await DB.prepare(
    "SELECT * FROM completed_items WHERE project_id = ? ORDER BY completed_at DESC"
  ).bind(proj.id).all();
  const wishlistRes = await DB.prepare(
    "SELECT * FROM wishlist_items WHERE project_id = ? ORDER BY created_at DESC"
  ).bind(proj.id).all();

  const jobFields = [
    "ref_images", "designs", "votes", "voters", "current_votes", "multi_view_images",
  ];
  const jobs = (jobsRes.results || []).map((r) => parseJsonFields(r, jobFields));

  const completedFields = ["colors"];
  const completed = (completedRes.results || []).map((r) => parseJsonFields(r, completedFields));

  return {
    project: proj,
    jobs,
    completed,
    wishlist: wishlistRes.results || [],
  };
}

async function getProjectIdBySlug(DB, slug) {
  const row = await DB.prepare("SELECT id FROM projects WHERE slug = ?").bind(slug).first();
  return row?.id || null;
}

async function touchProject(DB, projectId) {
  await DB.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?")
    .bind(projectId).run();
}

// ── 활동 로그 ──
async function logActivity(DB, projectId, actor, action, payload) {
  try {
    await DB.prepare(
      "INSERT INTO activity_log (project_id, actor, action, payload) VALUES (?, ?, ?, ?)"
    ).bind(projectId, actor || null, action, payload ? JSON.stringify(payload) : null).run();
  } catch (e) { /* logging best-effort */ }
}

// ─── 라우팅 ───
export async function onRequest(context) {
  const { request, env, params } = context;
  const DB = env.DB;
  if (!DB) return json({ error: "D1 binding 'DB' missing" }, 500);

  const path = Array.isArray(params.catchall) ? params.catchall : [params.catchall];
  const method = request.method.toUpperCase();

  try {
    // POST /api/projects
    if (method === "POST" && path.length === 1 && path[0] === "projects") {
      const body = await request.json().catch(() => ({}));
      const id = crypto.randomUUID();
      const slug = body.slug || randomSlug();
      const name = body.name || "Untitled project";
      await DB.prepare(
        "INSERT INTO projects (id, slug, name) VALUES (?, ?, ?)"
      ).bind(id, slug, name).run();
      return json({ id, slug, name }, 201);
    }

    // GET /api/projects/:slug
    if (method === "GET" && path.length === 2 && path[0] === "projects") {
      const snapshot = await getProjectSnapshot(DB, path[1]);
      if (!snapshot) return notFound();
      return json(snapshot);
    }

    // PATCH /api/projects/:slug
    if (method === "PATCH" && path.length === 2 && path[0] === "projects") {
      const slug = path[1];
      const body = await request.json().catch(() => ({}));
      const id = await getProjectIdBySlug(DB, slug);
      if (!id) return notFound();
      if (typeof body.name === "string") {
        await DB.prepare(
          "UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(body.name, id).run();
      }
      return json({ ok: true });
    }

    // PUT /api/projects/:slug/jobs/:id   (upsert)
    if (method === "PUT" && path.length === 4 && path[0] === "projects" && path[2] === "jobs") {
      const slug = path[1];
      const jobId = path[3];
      const body = await request.json().catch(() => ({}));
      const projectId = await getProjectIdBySlug(DB, slug);
      if (!projectId) return notFound();

      const jsonFields = ["ref_images", "designs", "votes", "voters", "current_votes", "multi_view_images"];
      const j = { ...body };
      for (const f of jsonFields) if (j[f] != null && typeof j[f] !== "string") j[f] = JSON.stringify(j[f]);

      await DB.prepare(
        `INSERT INTO jobs (
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
            updated_by = excluded.updated_by`
      ).bind(
        jobId, projectId,
        j.step ?? 0, j.loading ? 1 : 0, j.loading_msg ?? null, j.loading_progress ?? 0,
        j.category ?? null, j.top_tab ?? "furniture", j.selected_room ?? "침실",
        j.style_preset ?? null, j.prompt ?? null, j.ref_images ?? null,
        j.variant_count ?? 4, j.designs ?? null, j.enhanced_prompt ?? null,
        j.selected_design ?? null, j.feedback ?? null,
        j.votes ?? null, j.voters ?? null, j.current_voter ?? null, j.current_votes ?? null,
        j.concept_sheet ?? null, j.multi_view_images ?? null,
        j.updated_by ?? null
      ).run();

      await touchProject(DB, projectId);
      return json({ ok: true, id: jobId });
    }

    // DELETE /api/projects/:slug/jobs/:id
    if (method === "DELETE" && path.length === 4 && path[0] === "projects" && path[2] === "jobs") {
      const slug = path[1];
      const jobId = path[3];
      const projectId = await getProjectIdBySlug(DB, slug);
      if (!projectId) return notFound();
      await DB.prepare("DELETE FROM jobs WHERE id = ? AND project_id = ?").bind(jobId, projectId).run();
      await touchProject(DB, projectId);
      return json({ ok: true });
    }

    // POST /api/projects/:slug/completed
    if (method === "POST" && path.length === 3 && path[0] === "projects" && path[2] === "completed") {
      const slug = path[1];
      const projectId = await getProjectIdBySlug(DB, slug);
      if (!projectId) return notFound();
      const body = await request.json();
      const id = String(body.id ?? Date.now());
      await DB.prepare(
        `INSERT INTO completed_items (
          id, project_id, job_id, asset_code, category, category_label, category_icon,
          style, prompt, seed, colors, gradient, image_url, concept_sheet_url,
          voters, winner, pipeline_status, designer, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, projectId, body.job_id ?? null, body.asset_code ?? null,
        body.category ?? null, body.category_label ?? null, body.category_icon ?? null,
        body.style ?? null, body.prompt ?? null, body.seed ?? null,
        body.colors ? JSON.stringify(body.colors) : null,
        body.gradient ?? null, body.image_url ?? null, body.concept_sheet_url ?? null,
        body.voters ?? null, body.winner ?? null, body.pipeline_status ?? null,
        body.designer ?? null, body.completed_at ?? new Date().toISOString()
      ).run();
      await touchProject(DB, projectId);
      await logActivity(DB, projectId, body.updated_by, "completed_added", { id, label: body.category_label });
      return json({ ok: true, id }, 201);
    }

    // DELETE /api/projects/:slug/completed/:id
    if (method === "DELETE" && path.length === 4 && path[0] === "projects" && path[2] === "completed") {
      const slug = path[1];
      const projectId = await getProjectIdBySlug(DB, slug);
      if (!projectId) return notFound();
      await DB.prepare("DELETE FROM completed_items WHERE id = ? AND project_id = ?")
        .bind(path[3], projectId).run();
      await touchProject(DB, projectId);
      return json({ ok: true });
    }

    // POST /api/projects/:slug/wishlist
    if (method === "POST" && path.length === 3 && path[0] === "projects" && path[2] === "wishlist") {
      const slug = path[1];
      const projectId = await getProjectIdBySlug(DB, slug);
      if (!projectId) return notFound();
      const body = await request.json();
      const id = String(body.id ?? Date.now());
      await DB.prepare(
        `INSERT INTO wishlist_items (id, project_id, title, note, image_url, gradient, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, projectId, body.title ?? "Untitled", body.note ?? null,
        body.image_url ?? null, body.gradient ?? null,
        body.created_at ?? new Date().toISOString()
      ).run();
      await touchProject(DB, projectId);
      return json({ ok: true, id }, 201);
    }

    // DELETE /api/projects/:slug/wishlist/:id
    if (method === "DELETE" && path.length === 4 && path[0] === "projects" && path[2] === "wishlist") {
      const slug = path[1];
      const projectId = await getProjectIdBySlug(DB, slug);
      if (!projectId) return notFound();
      await DB.prepare("DELETE FROM wishlist_items WHERE id = ? AND project_id = ?")
        .bind(path[3], projectId).run();
      await touchProject(DB, projectId);
      return json({ ok: true });
    }

    // POST /api/projects/:slug/activity
    if (method === "POST" && path.length === 3 && path[0] === "projects" && path[2] === "activity") {
      const slug = path[1];
      const projectId = await getProjectIdBySlug(DB, slug);
      if (!projectId) return notFound();
      const body = await request.json().catch(() => ({}));
      await logActivity(DB, projectId, body.actor, body.action || "unknown", body.payload);
      return json({ ok: true });
    }

    return notFound();
  } catch (err) {
    console.error("API error", err);
    return json({ error: err.message || "Internal error" }, 500);
  }
}
