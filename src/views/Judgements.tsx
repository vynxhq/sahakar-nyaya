import { useEffect, useMemo, useState } from "react";
import type { LangCtx } from "../state/lang";

import {
  store, loadHeadnotes, ensureSearchIndex, searchIds, checkMisroute,
  type JudgementLite, type Headnotes,
} from "../data/loader";


export function useHeadnote(id: string, year: string) {
  const [hn, setHn] = useState<Headnotes[string] | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    loadHeadnotes(year).then(c => { if (alive) setHn(c[id] ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, [id, year]);
  return hn;
}

function JRow({ j }: { j: JudgementLite }) {
  const hn = useHeadnote(j.id, j.year);
  return (
    <a className="sn-jrow" href={`#/j/${j.id}`}>
      <div className="jt">{hn?.title || `CNR ${j.cnr}`}</div>
      <div className="jn">
        <span className="sn-hnlabel">EN</span> {(hn?.headnote_en ?? "").slice(0, 140)}…
        <div style={{ marginTop: 4 }}><span className="sn-hnlabel">मरा</span> {(hn?.headnote_mr ?? "").slice(0, 140)}…</div>
        <div style={{ marginTop: 4 }}>{j.date} · {j.benchName}{j.judge ? ` · ${j.judge}` : ""}</div>
      </div>
    </a>
  );
}

export function JudgementsView({ ctx, qstr }: { ctx: LangCtx; qstr: string }) {
  const { t } = ctx;
  const params = new URLSearchParams(qstr);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [bench, setBench] = useState("");
  const [section, setSection] = useState(params.get("section") ?? "");
  const [redev, setRedev] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(0);
  const [indexReady, setIndexReady] = useState(store.searchIndex != null || store.searchIndexFailed);
  useEffect(() => { ensureSearchIndex().then(() => setIndexReady(true)); }, []);

  const lite = store.lite!;
  const list = useMemo(() => {
    const ids = q.trim() ? searchIds(q) : null;
    return lite.filter(j => {
      if (ids && !ids.has(j.id)) return false;
      if (bench && j.bench !== bench) return false;
      if (section && !j.sections.includes(section)) return false;
      if (redev && String(j.isRedevelopment) !== redev) return false;
      if (year && j.year !== year) return false;
      return true;
    });
  }, [lite, q, bench, section, redev, year]);

  const misroute = checkMisroute(q, store.misroutes);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = list.slice(p * pageSize, (p + 1) * pageSize);
  const years = [...new Set(lite.map(j => j.year))].sort().reverse();
  const benches = [...new Set(lite.map(j => j.bench))];
  const waiting = q.trim() && !indexReady;

  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("judgements")}</p>
      <h1 className="sn-doc-title" style={{ fontSize: "1.5rem" }}>{t("searchHeadnotes")}</h1>
      <div className="sn-filters" style={{ marginTop: "var(--s4)" }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder={t("searchHeadnotes")} />
        <select value={bench} onChange={e => { setBench(e.target.value); setPage(0); }}>
          <option value="">{t("allBenches")}</option>
          {benches.map(b => <option key={b} value={b}>{lite.find(x => x.bench === b)?.benchName ?? b}</option>)}
        </select>
        <select value={section} onChange={e => { setSection(e.target.value); setPage(0); }}>
          <option value="">{t("allSectionsOpt")}</option>
          {(store.sections ?? []).map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
        <select value={redev} onChange={e => { setRedev(e.target.value); setPage(0); }}>
          <option value="">{t("allMatters")}</option>
          <option value="true">{t("redevOnly")}</option>
          <option value="false">{t("otherMatters")}</option>
        </select>
        <select value={year} onChange={e => { setYear(e.target.value); setPage(0); }}>
          <option value="">{t("allYears")}</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>
      {misroute && (
        <div className="sn-misroute">
          <b>{t("commonMis")} “{misroute.wrong}”</b> → <span className="fix">{t("see")} {misroute.correct}</span><br />{misroute.note}
        </div>
      )}
      {waiting ? <div className="sn-empty">{t("loadingIndex")}</div>
        : slice.length === 0 ? <div className="sn-empty">{t("noResults")}</div>
        : slice.map(j => <JRow key={j.id} j={j} />)}
      {pages > 1 && !waiting && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => { setPage(p - 1); window.scrollTo(0, 0); }} disabled={p <= 1}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm disabled:opacity-40 hover:border-primary">←</button>
          <span className="text-sm text-muted-foreground">{p + 1} / {pages}</span>
          <button onClick={() => { setPage(p + 1); window.scrollTo(0, 0); }} disabled={p >= pages - 1}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm disabled:opacity-40 hover:border-primary">→</button>
        </div>
      )}
    </div>
  );
}

export function JudgementDoc({ ctx, id }: { ctx: LangCtx; id: string }) {
  const { t, lang } = ctx;
  void t;
  const lite = store.lite!;
  const j = lite.find(x => x.id === id);
  const hn = useHeadnote(j?.id ?? "", j?.year ?? "");
  if (!j) return <div className="sn-empty">{t("judgNotFound")}</div>;
  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("judgements")} · {j.benchName}</p>
      <h1 className="sn-doc-title" style={{ fontSize: "1.5rem" }}>{hn?.title || `CNR ${j.cnr}`}</h1>
      <div className="sn-meta">
        {j.date && <span>{j.date}</span>}
        {j.judge && <span>{j.judge}</span>}
        <span>{lang === "mr" ? "सीएनआर" : "CNR"}: {j.cnr}</span>
        <span>{t("outcomes")}: {j.disposition}</span>
        {j.courtDisposal && <span>{t("registry")}: {j.courtDisposal}</span>}
      </div>
      <div className="sn-settled">
        <div className="sn-settled-mark">
          {t("headnoteTitle").split("(")[0]}
          <span className="sn-settled-ai">{t("aiLabelShort")}{j.needsReview ? ` · ${t("needsReview")}` : ""}</span>
        </div>
        <div><p style={{ margin: "0 0 10px" }}><b>EN</b> — {hn?.headnote_en ?? "…"}</p>
             <p style={{ margin: 0 }}><b>मराठी</b> — {hn?.headnote_mr ?? "…"}</p></div>
      </div>
      {j.sections.length > 0 && (
        <div className="sn-sect">
          <h2 className="sn-sect-h">{t("sectionsHeading")}</h2>
          <div className="sn-tagrow">
            {j.sections.map(s => <a key={s} className="sn-tag sec" href={`#/judgements?section=${encodeURIComponent(s)}`}>§ {s}</a>)}
          </div>
          {Object.entries(j.oldMap).length > 0 && (
            <div className="sn-oldmap">
              {t("oldMapHeading")}<br />
              {Object.entries(j.oldMap).map(([o, n]) => <span key={o}><code>§ {o}</code><span className="arrow">→</span><code>§ {n}</code></span>)}
            </div>
          )}
        </div>
      )}
      {j.parties.length > 0 && (
        <div className="sn-sect">
          <h2 className="sn-sect-h">{t("partiesHeading")}</h2>
          <div className="sn-tagrow">{j.parties.map(p => <span key={p} className="sn-tag">{p}</span>)}</div>
        </div>
      )}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("readOriginal")}</h2>
        <iframe className="sn-pdfbox" src={`pdfs/${j.file}`} title="judgement PDF" />
        <div className="sn-actions">
          <a href={`pdfs/${j.file}`} download={j.file}>{t("downloadPdf")}</a>
          <a href="#/judgements" className="sn-ghost">{t("backToResults")}</a>
        </div>
      </div>
    </div>
  );
}
