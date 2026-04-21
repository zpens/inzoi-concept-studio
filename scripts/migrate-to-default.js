// 이전까지 각 PC 가 자동 생성한 별도 슬러그(/p/xxxxxxxx) 에 쌓은
// 모든 jobs / completed / wishlist / activity 를 "default" 프로젝트
// 하나로 합쳐서 팀 전체가 같이 쓰게 만든다.
//
// 실행:  pm2 stop inzoi && node scripts/migrate-to-default.js && pm2 start inzoi
// 또는:  pm2 stop inzoi && npm run migrate:default && pm2 start inzoi
// (pm2 가 DB 를 쥐고 있으면 WAL busy 에러가 날 수 있어 stop 권장)

import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "inzoi.db");

const db = new Database(DB_PATH);

// 1) default 프로젝트가 없으면 생성.
let def = db.prepare("SELECT id, slug, name FROM projects WHERE slug = ?").get("default");
if (!def) {
  const id = randomUUID();
  db.prepare("INSERT INTO projects (id, slug, name) VALUES (?, ?, ?)")
    .run(id, "default", "inZOI Concept Studio");
  def = { id, slug: "default", name: "inZOI Concept Studio" };
  console.log("[+] default 프로젝트 새로 생성:", id);
} else {
  console.log("[*] default 프로젝트 사용:", def.id);
}
const defaultId = def.id;

// 2) 현재 상태 요약.
const allProjects = db.prepare("SELECT id, slug, name FROM projects").all();
console.log(`[i] 총 프로젝트 ${allProjects.length}개`);
for (const p of allProjects) {
  const jobsN   = db.prepare("SELECT COUNT(*) n FROM jobs             WHERE project_id = ?").get(p.id).n;
  const compN   = db.prepare("SELECT COUNT(*) n FROM completed_items  WHERE project_id = ?").get(p.id).n;
  const wishN   = db.prepare("SELECT COUNT(*) n FROM wishlist_items   WHERE project_id = ?").get(p.id).n;
  const actN    = db.prepare("SELECT COUNT(*) n FROM activity_log     WHERE project_id = ?").get(p.id).n;
  console.log(`    - ${p.slug.padEnd(14)}  jobs=${jobsN}  completed=${compN}  wishlist=${wishN}  activity=${actN}  ${p.id === defaultId ? "(default)" : ""}`);
}

// 3) 트랜잭션으로 이관.
const migrate = db.transaction(() => {
  const tables = ["jobs", "completed_items", "wishlist_items", "activity_log"];
  const results = {};
  for (const t of tables) {
    const r = db.prepare(`UPDATE ${t} SET project_id = ? WHERE project_id != ?`).run(defaultId, defaultId);
    results[t] = r.changes;
  }
  const delR = db.prepare("DELETE FROM projects WHERE id != ?").run(defaultId);
  results.projects_deleted = delR.changes;
  return results;
});

const r = migrate();
console.log("[✓] 이관 결과:");
console.log(`    jobs            ${r.jobs}`);
console.log(`    completed_items ${r.completed_items}`);
console.log(`    wishlist_items  ${r.wishlist_items}`);
console.log(`    activity_log    ${r.activity_log}`);
console.log(`    projects 삭제   ${r.projects_deleted}`);

// 4) 최종 상태.
const finalJobs = db.prepare("SELECT COUNT(*) n FROM jobs            WHERE project_id = ?").get(defaultId).n;
const finalComp = db.prepare("SELECT COUNT(*) n FROM completed_items WHERE project_id = ?").get(defaultId).n;
const finalWish = db.prepare("SELECT COUNT(*) n FROM wishlist_items  WHERE project_id = ?").get(defaultId).n;
console.log(`[✓] default 합계: jobs=${finalJobs} completed=${finalComp} wishlist=${finalWish}`);

db.close();
