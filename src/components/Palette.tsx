import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { store, searchIds, type Lang } from "../data/loader";

interface PaletteResult {
  kind: "topic" | "judgement" | "section";
  id: string;
  label: string;
  sub: string;
  href: string;
}

export function Palette({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo<PaletteResult[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const out: PaletteResult[] = [];

    for (const tp of store.topicsIndex?.topics ?? []) {
      const title = lang === "mr" ? tp.title_mr : tp.title_en;
      if (title.toLowerCase().includes(query) || tp.slug.includes(query)) {
        out.push({ kind: "topic", id: tp.slug, label: title, sub: lang === "mr" ? "विषय" : "Guided topic", href: `#/t/${tp.slug}` });
      }
    }
    const ids = searchIds(query);
    if (ids) {
      let n = 0;
      for (const j of store.lite ?? []) {
        if (n >= 8) break;
        if (ids.has(j.id)) {
          out.push({ kind: "judgement", id: j.id, label: `CNR ${j.cnr} · ${j.date}`, sub: j.judge || j.benchName, href: `#/j/${j.id}` });
          n++;
        }
      }
    }
    for (const s of store.sections ?? []) {
      if (s.id.toLowerCase().includes(query) || s.title.toLowerCase().includes(query)) {
        out.push({ kind: "section", id: s.id, label: `§ ${s.id} — ${s.title}`, sub: lang === "mr" ? "कलम" : "Section reference", href: `#/sections#${s.id}` });
      }
    }
    return out.slice(0, 14);
  }, [q, lang]);

  const open = (href: string) => { location.hash = href; onClose(); };

  return (
    <div className="sn-palette-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sn-palette" role="dialog" aria-label="search">
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 16, top: 18, color: "var(--ink-2)" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={lang === "mr" ? "विषय, निकाल, कलम शोधा…" : "Search topics, judgements, sections…"} />
        </div>
        <div className="sn-pal-results">
          {results.length === 0 && q.trim() !== "" && <div className="sn-pal-empty">{lang === "mr" ? "काही सापडले नाही" : "No matches"}</div>}
          {results.length === 0 && q.trim() === "" && (
            <div className="sn-pal-empty">{lang === "mr" ? "टाइप करून शोधा" : "Type to search"}</div>
          )}
          {results.map(r => (
            <button key={r.kind + r.id} className="sn-pal-item" onClick={() => open(r.href)}>
              <div>{r.label}</div>
              {r.sub && <div className="sub">{r.sub}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Global keyboard shortcut: Ctrl+K / Cmd+K toggles the palette. */
export function usePaletteShortcut(setOpen: (v: boolean) => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}

