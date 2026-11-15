import type { LangCtx } from "../state/lang";
import { store } from "../data/loader";

/* ---------- Timeline ---------- */

export function TimelineDoc({ ctx }: { ctx: LangCtx }) {
  const { t, lang } = ctx;
  const tl = store.timeline;
  if (!tl) return <div className="sn-empty">{t("loading")}</div>;
  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("timeline")}</p>
      <h1 className="sn-doc-title">{lang === "mr" ? "पुनर्विकास विधी — १९९१ → आज" : "Redevelopment law timeline — 1991 → today"}</h1>
      <p style={{ color: "var(--ink-2)" }}>{lang === "mr" ? tl.sourcePackNoteMr : tl.sourcePackNote}</p>
      <div className="sn-tl">
        {tl.items.map((it, i) => (
          <div key={i} className="sn-tl-item">
            <div className="sn-tl-date">{lang === "mr" ? it.dateMr : it.date}</div>
            <h2 style={{ fontSize: "1.02rem", margin: "2px 0 6px" }}>{lang === "mr" ? it.titleMr : it.title}</h2>
            <p style={{ fontSize: "0.94rem", margin: "0 0 6px" }}>{lang === "mr" ? it.descMr : it.desc}</p>
            {it.doc && <a href={it.doc} target="_blank" rel="noopener" style={{ fontSize: "0.85rem" }}>{t("officialDoc")}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Reference (sections) ---------- */

export function ReferenceDoc({ ctx, anchor }: { ctx: LangCtx; anchor: string }) {
  const { t, lang } = ctx;
  const sections = store.sections ?? [];
  const one = sections.find(s => s.id === anchor);
  if (one) {
    const disp = lang === "mr" && one.disputesMr ? one.disputesMr! : one.disputes;
    return (
      <div className="sn-doc">
        <p className="sn-kicker">{t("sections")}</p>
        <h1 className="sn-doc-title">{one.title}</h1>
        <p style={{ color: "var(--ink-2)", marginTop: 0 }}>{one.titleMr}</p>
        <div className="sn-panel" style={{ padding: "var(--s4) var(--s5)" }}>
          <p style={{ marginTop: 0 }}>{lang === "mr" ? one.summaryMr : one.summary}</p>
          <h2 style={{ fontSize: "1rem", margin: "var(--s4) 0 var(--s2)" }}>{t("typicalDisputes")}</h2>
          <ul>{disp.map((d, i) => <li key={i}>{d}</li>)}</ul>
          {one.ask && (
            <>
              <h2 style={{ fontSize: "1rem", margin: "var(--s4) 0 var(--s2)" }}>{t("whoAsks")}</h2>
              {one.ask.memberPro && <p><b>{t("memberPro")}</b> {one.ask.memberPro}</p>}
              {one.ask.memberAnti && <p><b>{t("memberAnti")}</b> {one.ask.memberAnti}</p>}
              {one.ask.committee && <p><b>{t("committee")}</b> {one.ask.committee}</p>}
            </>
          )}
          {one.landmarks && one.landmarks.length > 0 && (
            <>
              <h2 style={{ fontSize: "1rem", margin: "var(--s4) 0 var(--s2)" }}>{t("landmarks")}</h2>
              <ul>{one.landmarks.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </>
          )}
        </div>
        <div className="sn-actions">
          <a href="#/reference" className="sn-ghost">← {t("allSections")}</a>
          <a href={`#/judgements?q=${encodeURIComponent(one.id)}`}>{t("searchThese")}</a>
        </div>
      </div>
    );
  }
  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("sections")}</p>
      <h1 className="sn-doc-title">{t("verifiedGuide")}</h1>
      <Text2 text={t("misrouteTip") + " 73-CA, Rule 58-A, 101 " + t("misrouteTipTail")} />
      <div className="sn-list-gap">
        {sections.map(s => (
          <a key={s.id} href={`#/reference#${s.id}`} className="sn-jrow">
            <div className="jt">{s.title}</div>
            <div className="jn">{s.titleMr}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function Text2({ text }: { text: string }) {
  return <p style={{ color: "var(--ink-2)" }}>{text}</p>;
}

/* ---------- About ---------- */

export function AboutDoc({ ctx }: { ctx: LangCtx }) {
  const { t } = ctx;
  const misroutes = store.misroutes ?? [];
  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("about")}</p>
      <h1 className="sn-doc-title">{t("idea")}</h1>
      <p>{t("ideaBody")}</p>
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("dataFrom")}</h2>
        <ul>
          <li>{t("srcJudgements")} <i>Indian High Court Judgments</i> {t("srcDataset")}</li>
          <li>{t("srcStatutes")}</li>
          <li>{t("srcTaxonomy")}</li>
        </ul>
      </div>
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("misrouteCorrector")}</h2>
        <p>{t("misrouteBody")}</p>
        <div className="sn-tagrow">
          {misroutes.map(m => (
            <a key={m.wrong} href={`#/judgements?q=${encodeURIComponent(m.wrong)}`} className="sn-tag">{m.wrong}</a>
          ))}
        </div>
      </div>
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("limitations")}</h2>
        <ul>
          <li>{t("lim1")}</li>
          <li>{t("lim2")}</li>
          <li>{t("lim3")}</li>
        </ul>
      </div>
    </div>
  );
}
