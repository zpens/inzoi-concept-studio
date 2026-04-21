// data/ 폴더를 backup/ 아래 타임스탬프 이름으로 재귀 복사.
// 외부 의존성 없이 Node 표준 모듈만 사용 (크로스 플랫폼).
//
// 실행:  npm run backup   또는   node scripts/backup.js
// 예약:  Windows 작업 스케줄러 / cron 으로 주기 실행 권장.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "data");
const OUT_ROOT = path.join(ROOT, "backup");

if (!fs.existsSync(SRC)) {
  console.error(`[!] 백업 원본 폴더가 없습니다: ${SRC}`);
  process.exit(1);
}

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }
  } else if (stat.isFile()) {
    fs.copyFileSync(src, dst);
  }
}

const target = path.join(OUT_ROOT, `data-${ts()}`);
fs.mkdirSync(OUT_ROOT, { recursive: true });
copyRecursive(SRC, target);

// 7일 이상 된 백업은 자동 정리 (필요 시 주석 해제).
// const maxAgeDays = 14;
// const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
// for (const name of fs.readdirSync(OUT_ROOT)) {
//   const p = path.join(OUT_ROOT, name);
//   if (fs.statSync(p).mtimeMs < cutoff) {
//     fs.rmSync(p, { recursive: true, force: true });
//     console.log(`[cleanup] ${name}`);
//   }
// }

console.log(`[✓] 백업 완료: ${path.relative(ROOT, target)}`);
