/** Shared types + data loader with timeout/retry, lazy year chunks, background warming. */

export type Lang = "en" | "mr";

export interface JudgementLite {
  id: string;
  file: string;
  cnr: string;
  date: string;
  year: string;
  bench: string;
  benchName: string;
  judge: string;
  sections: string[];
  oldMap: Record<string, string>;
  parties: string[];
  isRedevelopment: boolean;
  disposition: string;
  courtDisposal: string;
  confidence: string;
  needsReview: boolean;
}

export interface Headnotes {
  [id: string]: { headnote_en: string; headnote_mr: string; title: string };
}

export interface SectionInfo {
  id: string;
  title: string;
  titleMr: string;
  summary: string;
  summaryMr: string;
  disputes: string[];
  disputesMr?: string[];
  ask?: { memberPro?: string; memberAnti?: string; committee?: string };
  landmarks?: string[];
  keywordsEn?: string[];
  keywordsMr?: string[];
}

export interface Misroute { wrong: string; correct: string; note: string }

export interface TimelineItem {
  date: string; dateMr: string; title: string; titleMr: string;
  desc: string; descMr: string; doc: string | null;
}
export interface Timeline { items: TimelineItem[]; sourcePackNote: string; sourcePackNoteMr: string }

const DOCS: string[] = []; // position -> doc id (mirrors search-index.json)

export function docIdAt(i: number): string {
  return DOCS[i];
}

/** fetch JSON with 25s timeout, 3 attempts, linear back-off. */
export async function fetchJSON<T>(url: string, tries = 3, timeoutMs = 25000): Promise<T> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(`${url}?t=${Date.now()}`, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
      return (await r.json()) as T;
    } catch (err) {
      if (attempt === tries) {
        throw new Error(`${url} (${err instanceof DOMException && err.name === "AbortError" ? "timeout" : String(err)})`);
      }
      await new Promise(res => setTimeout(res, 1200 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("unreachable");
}

/* ----- store ----- */

export interface Store {
  lite: JudgementLite[] | null;
  sections: SectionInfo[] | null;
  top5: string[] | null;
  misroutes: Misroute[] | null;
  timeline: Timeline | null;
  headnotes: Record<string, Headnotes>; // year -> chunk
  searchIndex: Record<string, number[]> | null;
  searchIndexFailed: boolean;
}

export const store: Store = {
  lite: null, sections: null, top5: null, misroutes: null, timeline: null,
  headnotes: {}, searchIndex: null, searchIndexFailed: false,
};

const searchIndexReady: { p: Promise<void> | null } = { p: null };

/** Phase 1 — everything needed for first paint. */
export async function loadCore(): Promise<void> {
  if (store.lite) return;
  const [lite, sectionsJson, misroutes] = await Promise.all([
    fetchJSON<{ judgements: JudgementLite[]; top5: string[] }>("data/index-lite.json"),
    fetchJSON<{ sections: SectionInfo[]; top5: string[] }>("data/sections.json"),
    fetchJSON<Misroute[]>("data/misroutes.json"),
  ]);
  store.lite = lite.judgements;
  fillDocOrder(store.lite);
  store.top5 = lite.top5 ?? sectionsJson.top5;
  store.sections = sectionsJson.sections;
  store.misroutes = misroutes;
}

/** Phase 2 — heavy assets, background. Safe to call repeatedly. */
export function warmHeavy(onProgress?: (msg: string) => void): void {
  if (!searchIndexReady.p) {
    onProgress?.("search index");
    searchIndexReady.p = fetchJSON<Record<string, number[]>>("data/search-index.json")
      .then(idx => {
        // build the position -> id table from the loaded lite list order
        store.searchIndex = idx;
      })
      .catch(() => { store.searchIndexFailed = true; });
  }
  if (!store.timeline) {
    fetchJSON<Timeline>("data/gr-timeline.json")
      .then(tl => { store.timeline = tl; })
      .catch(() => {});
  }
}

export async function ensureSearchIndex(): Promise<void> {
  if (store.searchIndex || store.searchIndexFailed) return;
  warmHeavy();
  if (searchIndexReady.p) await searchIndexReady.p;
  else await new Promise(r => setTimeout(r, 300));
}

/** Phase 1 also fills DOCS in the same order the compact index was built (date desc). */
export function fillDocOrder(lite: JudgementLite[]): void {
  DOCS.length = 0;
  for (const j of lite) DOCS.push(j.id);
}

export async function loadHeadnotes(year: string): Promise<Headnotes> {
  if (store.headnotes[year]) return store.headnotes[year];
  const chunk = await fetchJSON<Headnotes>(`data/headnotes/${year}.json`);
  store.headnotes[year] = chunk;
  return chunk;
}

/** Background-warm all headnote chunks (staggered to keep the UI responsive). */
export function warmAllHeadnotes(): void {
  if (!store.lite) return;
  const years = [...new Set(store.lite.map(j => j.year))].sort().reverse();
  let delay = 800;
  for (const y of years) {
    setTimeout(() => { loadHeadnotes(y).catch(() => {}); }, delay);
    delay += 1500;
  }
}

/** Search: returns matching doc ids, or null for "no query". Requires the index. */
export function searchIds(q: string): Set<string> | null {
  q = q.trim().toLowerCase();
  if (!q || !store.searchIndex) return null;
  const toks = q.split(/\s+/).map(x => x.replace(/[^\w\u0900-\u097F]/g, "")).filter(x => x.length > 1);
  if (!toks.length) return null;
  const sets = toks.map(tok => {
    const ids = new Set<string>();
    for (const key in store.searchIndex!) {
      if (key.startsWith(tok) || tok.startsWith(key))
        for (const i of store.searchIndex![key]) ids.add(docIdAt(i));
    }
    return ids;
  });
  let out = sets[0];
  for (let i = 1; i < sets.length; i++) {
    const inter = new Set([...out].filter(x => sets[i].has(x)));
    if (inter.size) out = inter;
    else out = new Set([...out, ...sets[i]]);
  }
  return out;
}

export function checkMisroute(q: string, misroutes: Misroute[] | null): Misroute | null {
  const u = (q || "").toUpperCase().replace(/\s+/g, " ").trim();
  if (!u || !misroutes) return null;
  for (const m of misroutes) if (u.includes(m.wrong.toUpperCase())) return m;
  return null;
}
