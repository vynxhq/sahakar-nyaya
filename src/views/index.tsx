import { useEffect, useMemo, useState } from "react";
import { Heading, Text, Card, Pagination } from "@astryxdesign/core";
import { Calendar, Landmark, User, Hash, FileText, ArrowLeft, Download } from "lucide-react";
import type { LangCtx } from "../state/lang";
import {
  store, loadHeadnotes, ensureSearchIndex, searchIds, checkMisroute,
  type JudgementLite, type Headnotes,
} from "../data/loader";

/* ---------- shared helpers ---------- */

export function useHeadnote(id: string, year: string): { hn: Headnotes[string] | null; missing: boolean } {
  const [hn, setHn] = useState<Headnotes[string] | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    loadHeadnotes(year)
      .then(chunk => { if (alive) setHn(chunk[id] ?? null); })
      .catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [id, year]);
  return { hn, missing };
}

function HeadnoteBlock({ j }: { j: JudgementLite }) {
  const { hn, missing } = useHeadnote(j.id, j.year);
  if (missing) return <Text>(headnote text unavailable)</Text>;
  if (!hn) return <Text>…</Text>;
  return (
    <div>
      <p style={{ margin: "6px 0 4px", fontWeight: 600, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>English</p>
      <div className="hn">{hn.headnote_en}</div>
      <p style={{ margin: "10px 0 4px", fontWeight: 600, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>मराठी</p>
      <div className="hn">{hn.headnote_mr}</div>
    </div>
  );
}


function TagRow({ j, t }: { j: JudgementLite; t: LangCtx["t"] }) {
  return (
    <div className="sn-tagrow">
      {j.sections.map(s => (
        <a key={s} className="sn-tag-sec" style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, textDecoration: "none" }}
          href={`#/judgements?section=${encodeURIComponent(s)}`}>§ {s}</a>
      ))}
      {j.isRedevelopment && <span className="sn-tag-redev" style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, border: "1px solid #fca5a5" }}>{t("redevTag")}</span>}
      {j.needsReview && <span className="sn-tag-nr" style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, border: "1px solid #fcd34d" }}>{t("needsReview")}</span>}
    </div>
  );
}

/* ---------- Sections ---------- */

export function viewSections(ctx: LangCtx, anchor: string): React.ReactNode {
  const { t } = ctx;
  const sections = store.sections!;
  const one = sections.find(s => s.id === anchor);
  if (one) return sectionDetail(ctx, one);
  return (
    <>
      <Heading level={2} style={{ margin: "6px 0 4px" }}>{t("verifiedGuide")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}>
        {t("misrouteTip")} <b>73-CA</b>, <b>Rule 58-A</b>, <b>101</b>{t("misrouteTipTail")}
      </Text>
      <div className="sn-cards" style={{ flexDirection: "column", display: "flex" }}>
        {sections.map(s => (
          <Card key={s.id}>
            <a href={`#/sections#${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Heading level={3} style={{ color: "var(--primary)", margin: 0 }}>{s.title}</Heading>
              <Text style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>{s.titleMr}</Text>
              <Text style={{ fontSize: "0.88rem" }}>{(ctx.lang === "mr" ? s.summaryMr : s.summary).slice(0, 200)}…</Text>
            </a>
          </Card>
        ))}
      </div>
    </>
  );
}

function sectionDetail(ctx: LangCtx, s: import("../data/loader").SectionInfo): React.ReactNode {
  const { t } = ctx;
  const disp = ctx.lang === "mr" && s.disputesMr ? s.disputesMr! : s.disputes;
  return (
    <Card>
      <Heading level={2} style={{ color: "var(--primary)", margin: 0 }}>{s.title}</Heading>
      <Text style={{ color: "var(--color-text-secondary)" }}>{s.titleMr}</Text>
      <Text>{ctx.lang === "mr" ? s.summaryMr : s.summary}</Text>
      <Heading level={4} style={{ margin: "14px 0 6px" }}>{t("typicalDisputes")}</Heading>
      <ul>{disp.map((d, i) => <li key={i}>{d}</li>)}</ul>
      <Heading level={4} style={{ margin: "14px 0 6px" }}>{t("whoAsks")}</Heading>
      <div style={{ display: "grid", gap: 8, fontSize: "0.9rem" }}>
        {s.ask?.memberPro && <div><b style={{ color: "var(--primary)" }}>{t("memberPro")}</b> {s.ask.memberPro}</div>}
        {s.ask?.memberAnti && <div><b style={{ color: "var(--primary)" }}>{t("memberAnti")}</b> {s.ask.memberAnti}</div>}
        {s.ask?.committee && <div><b style={{ color: "var(--primary)" }}>{t("committee")}</b> {s.ask.committee}</div>}
      </div>
      {s.landmarks && s.landmarks.length > 0 && (
        <>
          <Heading level={4} style={{ margin: "14px 0 6px" }}>{t("landmarks")}</Heading>
          <ul>{s.landmarks.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </>
      )}
      <Heading level={4} style={{ margin: "14px 0 6px" }}>{t("searchThese")}</Heading>
      <div className="sn-tagrow">
        {[s.id, ...(s.keywordsEn ?? []), ...(s.keywordsMr ?? [])].map(k => (
          <a key={k} href={`#/judgements?q=${encodeURIComponent(k)}`}
            style={{ fontSize: "0.8rem", padding: "3px 10px", borderRadius: 20, border: "1px solid var(--color-border)", textDecoration: "none", color: "inherit" }}>
            {k}
          </a>
        ))}
      </div>
      <p style={{ marginTop: 14 }}><a href="#/sections">← {t("allSections")}</a></p>
    </Card>
  );
}

/* ---------- Judgements list ---------- */

export function JudgementsView({ ctx, qstr }: { ctx: LangCtx; qstr: string }): React.ReactNode {
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
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = list.slice(p * pageSize, (p + 1) * pageSize);
  const years = [...new Set(lite.map(j => j.year))].sort().reverse();
  const benches = [...new Set(lite.map(j => j.bench))];

  const waiting = q.trim() && !indexReady;

  return (
    <>
      <Heading level={2} style={{ margin: "6px 0 4px" }}>{t("judgements")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}>
        {t("searchHeadnotes")}
      </Text>
      <div className="sn-filters">
        <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }}
          placeholder={t("searchHeadnotes")}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.9rem", maxWidth: 240 }} />
        <select value={bench} onChange={e => { setBench(e.target.value); setPage(0); }}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.9rem" }}>
          <option value="">{t("allBenches")}</option>
          {benches.map(b => <option key={b} value={b}>{lite.find(x => x.bench === b)?.benchName ?? b}</option>)}
        </select>
        <select value={section} onChange={e => { setSection(e.target.value); setPage(0); }}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.9rem" }}>
          <option value="">{t("allSectionsOpt")}</option>
          {(store.sections ?? []).map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
        </select>
        <select value={redev} onChange={e => { setRedev(e.target.value); setPage(0); }}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.9rem" }}>
          <option value="">{t("allMatters")}</option>
          <option value="true">{t("redevOnly")}</option>
          <option value="false">{t("otherMatters")}</option>
        </select>
        <select value={year} onChange={e => { setYear(e.target.value); setPage(0); }}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.9rem" }}>
          <option value="">{t("allYears")}</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>
      {misroute && (
        <div className="sn-misroute">
          <b>{t("commonMis")} “{misroute.wrong}”</b> → <span className="fix">{t("see")} {misroute.correct}</span><br />{misroute.note}
        </div>
      )}
      {waiting ? (
        <div className="sn-empty">{t("loadingIndex")}</div>
      ) : slice.length === 0 ? (
        <div className="sn-empty">{t("noResults")}</div>
      ) : (
        slice.map(j => <JCard key={j.id} j={j} t={t} lang={ctx.lang} />)
      )}
      {pages > 1 && !waiting && (
        <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
          <Pagination page={p + 1} totalPages={pages} totalItems={list.length} pageSize={pageSize}
            onChange={pg => setPage(pg - 1)} />
        </div>
      )}
    </>
  );
}

function JCard({ j, t, lang }: { j: JudgementLite; t: LangCtx["t"]; lang: string }) {
  const { hn, missing } = useHeadnote(j.id, j.year);
  return (
    <Card style={{ marginBottom: 10 }} className="sn-jcard">
      <div className="sn-meta">
        <span><Calendar size={13} /> {j.date}</span><span><Landmark size={13} /> {j.benchName}</span>
        {j.judge && <span><User size={13} /> {j.judge}</span>}
        <span><Hash size={13} /> {lang === "mr" ? "सीएनआर" : "CNR"}: {j.cnr}</span>
      </div>
      <Heading level={3} style={{ margin: "0 0 6px", fontSize: "0.98rem" }}>
        <a href={`#/j/${encodeURIComponent(j.id)}`} style={{ textDecoration: "none", color: "inherit" }}>
          {hn?.title || `CNR ${j.cnr}`}
        </a>
      </Heading>
      {missing ? <Text style={{ fontSize: "0.9rem" }}>(headnote unavailable)</Text>
        : !hn ? <Text style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>…</Text>
        : (<>
          <div className="hn" style={{ fontSize: "0.9rem" }}><span className="sn-hnlabel">EN</span> {hn.headnote_en}</div>
          <div className="hn" style={{ fontSize: "0.9rem" }}><span className="sn-hnlabel">मरा</span> {hn.headnote_mr}</div>
        </>)}
      <TagRow j={j} t={t} />
    </Card>
  );
}

/* ---------- Detail ---------- */

export function DetailView({ ctx, id }: { ctx: LangCtx; id: string }): React.ReactNode {
  const { t } = ctx;
  const lite = store.lite!;
  const j = lite.find(x => x.id === id);
  const { hn } = useHeadnote(j?.id ?? "", j?.year ?? "");
  if (!j) return <div className="sn-empty">{t("judgNotFound")}</div>;
  return (
    <>
      <Card style={{ marginBottom: 14 }} className="sn-panel">
        <Heading level={2} style={{ margin: 0, color: "var(--primary)", fontSize: "1.05rem" }}>
          {hn?.title || `CNR ${j.cnr}`}
        </Heading>
        <div className="sn-meta" style={{ margin: "8px 0" }}>
          <span><Calendar size={13} /> {j.date}</span><span><Landmark size={13} /> {j.benchName}</span>
          {j.judge && <span><User size={13} /> {j.judge}</span>}
          <span><Hash size={13} /> {ctx.lang === "mr" ? "सीएनआर" : "CNR"}: {j.cnr}</span>
          <span>{t("outcomes")}: {j.disposition}</span>
          {j.courtDisposal && <span>{t("registry")}: {j.courtDisposal}</span>}
        </div>
        <div className="sn-actions">
          <a href={`pdfs/${j.file}`} target="_blank" rel="noopener"><FileText size={15} /> {t("openPdf")}</a>
          <a href="#/judgements" className="sn-gold"><ArrowLeft size={15} /> {t("backToResults")}</a>
        </div>
      </Card>
      <Card style={{ marginBottom: 14 }} className="sn-panel">
        <Heading level={4} style={{ margin: 0 }}>{t("headnoteTitle")}</Heading>
        <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 600 }}>
          ⚠ {t("aiLabel")}{j.needsReview ? ` · ${t("needsReview")}` : ""}
        </span>
        <HeadnoteBlock j={j} />
      </Card>
      {(j.sections.length > 0 || Object.keys(j.oldMap).length > 0) && (
        <Card style={{ marginBottom: 14 }} className="sn-panel">
          <Heading level={4} style={{ margin: 0 }}>{t("sectionsHeading")}</Heading>
          <div className="sn-tagrow">
            {j.sections.map(s => (
              <a key={s} href={`#/judgements?section=${encodeURIComponent(s)}`}
                style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, background: "#ecfdf5", border: "1px solid #6ee7b7", color: "#065f46", textDecoration: "none" }}>
                § {s}
              </a>
            ))}
          </div>
          {Object.entries(j.oldMap).length > 0 && (
            <div className="sn-oldmap">
              {t("oldMapHeading")}<br />
              {Object.entries(j.oldMap).map(([o, n]) => (
                <span key={o}><code>§ {o}</code><span className="arrow">→</span><code>§ {n}</code></span>
              ))}
            </div>
          )}
        </Card>
      )}
      {j.parties.length > 0 && (
        <Card style={{ marginBottom: 14 }} className="sn-panel">
          <Heading level={4} style={{ margin: 0 }}>{t("partiesHeading")}</Heading>
          <div className="sn-tagrow">{j.parties.map(p => <span key={p} style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, background: "var(--color-background-muted)", border: "1px solid var(--color-border)" }}>{p}</span>)}</div>
        </Card>
      )}
      <Card style={{ marginBottom: 14 }} className="sn-panel">
        <Heading level={4} style={{ margin: 0 }}>{t("readOriginal")}</Heading>
        <iframe className="sn-pdfbox" src={`pdfs/${j.file}`} title="judgement PDF" />
        <div className="sn-actions">
          <a href={`pdfs/${j.file}`} download={j.file}><Download size={15} /> {t("downloadPdf")}</a>
        </div>
      </Card>
    </>
  );
}

/* ---------- Timeline ---------- */

export function viewTimeline(ctx: LangCtx): React.ReactNode {
  const { t } = ctx;
  const tl = store.timeline;
  if (!tl) return <div className="sn-empty">{t("loading")}</div>;
  return (
    <>
      <Heading level={2} style={{ margin: "6px 0 4px" }}>{t("timelineTitle")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}>{t("timelineSub")}</Text>
      <div className="sn-tl">
        {tl.items.map((it, i) => (
          <div key={i} className="sn-tl-item">
            <div className="sn-tl-date">{ctx.lang === "mr" ? it.dateMr : it.date}</div>
            <Heading level={3} style={{ margin: "2px 0 4px", fontSize: "1rem" }}>
              {ctx.lang === "mr" ? it.titleMr : it.title}
            </Heading>
            <Text style={{ fontSize: "0.9rem" }}>{ctx.lang === "mr" ? it.descMr : it.desc}</Text>
            {it.doc && <a href={it.doc} target="_blank" rel="noopener" style={{ fontSize: "0.85rem" }}><FileText size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />{t("officialDoc")}</a>}
          </div>
        ))}
      </div>
      <Card style={{ marginTop: 16 }}>
        <small>{tl.sourcePackNote}</small><br /><small>{tl.sourcePackNoteMr}</small>
      </Card>
    </>
  );
}

/* ---------- About ---------- */

export function viewAbout(ctx: LangCtx): React.ReactNode {
  const { t } = ctx;
  const misroutes = store.misroutes ?? [];
  return (
    <>
      <Heading level={2} style={{ margin: "6px 0 12px" }}>{t("about")}</Heading>
      <Card style={{ marginBottom: 14 }} className="sn-panel">
        <Heading level={3} style={{ margin: 0 }}>{t("idea")}</Heading>
        <Text>{t("ideaBody")}</Text>
      </Card>
      <Card style={{ marginBottom: 14 }} className="sn-panel">
        <Heading level={3} style={{ margin: 0 }}>{t("dataFrom")}</Heading>
        <ul>
          <li>{t("srcJudgements")} <i>Indian High Court Judgments</i> {t("srcDataset")}</li>
          <li>{t("srcStatutes")}</li>
          <li>{t("srcTaxonomy")}</li>
        </ul>
      </Card>
      <Card style={{ marginBottom: 14 }} className="sn-panel">
        <Heading level={3} style={{ margin: 0 }}>{t("misrouteCorrector")}</Heading>
        <Text>{t("misrouteBody")}</Text>
        <div className="sn-tagrow">
          {misroutes.map(m => (
            <a key={m.wrong} href={`#/judgements?q=${encodeURIComponent(m.wrong)}`}
              style={{ fontSize: "0.8rem", padding: "3px 10px", borderRadius: 20, border: "1px solid var(--color-border)", textDecoration: "none", color: "inherit" }}>
              {m.wrong}
            </a>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom: 14 }} className="sn-panel">
        <Heading level={3} style={{ margin: 0 }}>{t("limitations")}</Heading>
        <ul>
          <li>{t("lim1")}</li>
          <li>{t("lim2")}</li>
          <li>{t("lim3")}</li>
        </ul>
      </Card>
    </>
  );
}

export { viewHome, TopicsDirectoryView, TopicPageView } from "./topics";
