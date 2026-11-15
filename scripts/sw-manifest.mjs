/**
 * scripts/sw-manifest.mjs — post-build: emit sw-manifest.json (all built assets)
 * and copy sw.js into dist/. Run as the last step of `npm run build`.
 */
import { readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { join, relative } from "node:path";

const dist = join(process.cwd(), "dist");
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else {
      const rel = relative(dist, p).split("\\").join("/");
      if (rel === "sw.js" || rel.startsWith("sw-manifest")) continue;
      files.push(rel);
    }
  }
}
walk(dist);

writeFileSync(
  join(dist, "sw-manifest.json"),
  JSON.stringify({ revision: Date.now(), files }),
);

// sw.js source lives in src/sw.js; copy verbatim
copyFileSync(join(process.cwd(), "src", "sw.js"), join(dist, "sw.js"));
console.log(`sw-manifest: ${files.length} files`);
