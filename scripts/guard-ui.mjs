/**
 * scripts/guard-ui.mjs — UI-copy regression guard, run as part of `npm run build`.
 *
 * Gate 1: every topic JSON's title_en must be Title Case (first letter of every
 *         word capitalized, except allowed small words).
 * Gate 2: UI strings that exist in the i18n catalog must NOT be hardcoded
 *         inline in view/component files — they must come from the catalog.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const SMALL = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "for", "with", "on", "at",
  "by", "is", "are", "vs", "&", "from", "into", "per", "nor", "but", "so",
  "yet", "as", "it", "its",
]);

function titleCaseOk(title) {
  const words = title.match(/[A-Za-z][A-Za-z'&-]*/g) ?? [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (SMALL.has(w.toLowerCase())) continue;
    if (!/^[A-Z0-9]/.test(w)) errors.push(`title not Title Case: "${w}" in "${title}"`);
  }
}

/* Gate 1: topic titles */
const topicsDir = join(root, "public", "data", "topics");
for (const f of readdirSync(topicsDir)) {
  if (!f.endsWith(".json") || f === "index.json") continue;
  const d = JSON.parse(readFileSync(join(topicsDir, f), "utf-8"));
  titleCaseOk(d.title_en);
}

/* Gate 2: catalog strings must not be hardcoded in views/components */
const catalogSrc = readFileSync(join(root, "src", "i18n", "catalogs.ts"), "utf-8");
const enStrings = new Set();
for (const m of catalogSrc.matchAll(/: \{ en: "([^"]{8,})"/g)) enStrings.add(m[1]);

const scanDirs = [join(root, "src", "views"), join(root, "src", "components")];
const skipNames = new Set(["catalogs.ts"]);
for (const dir of scanDirs) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".tsx") || skipNames.has(f)) continue;
    const src = readFileSync(join(dir, f), "utf-8");
    for (const s of enStrings) {
      if (src.includes(`"${s}"`)) {
        errors.push(`hardcoded UI string in ${f}: "${s.slice(0, 50)}" — use the catalog instead`);
      }
    }
  }
}

if (errors.length) {
  console.error("UI GUARD FAILED:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("ui guard: OK (topic titles Title Case; no hardcoded catalog strings)");
