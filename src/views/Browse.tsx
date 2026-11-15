import { useEffect, useState } from "react";
import type { LangCtx } from "../state/lang";
import { loadTopicsIndex, loadHeadnotes, type TopicsIndex } from "../data/loader";

export function BrowseView({ ctx }: { ctx: LangCtx }) {
  const { t, lang } = ctx;
  const [idx, setIdx] = useState<TopicsIndex | null>(null);
  useEffect(() => { loadTopicsIndex().then(setIdx).catch(() => {}); }, []);
  if (!idx) return <div className="sn-empty">{t("loading")}</div>;

  const byCat = new Map<string, typeof idx.topics>();
  for (const tp of idx.topics) {
    const list = byCat.get(tp.category) ?? [];
    list.push(tp);
    byCat.set(tp.category, list);
  }
  const catMeta = new Map(idx.categories.map(c => [c.id, c]));

  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("topics")}</p>
      <h1 className="sn-doc-title">{t("allTopics")}</h1>
      {[...byCat.entries()].map(([catId, topics]) => {
        const c = catMeta.get(catId);
        return (
          <div key={catId} className="sn-sect">
            <h2 className="sn-sect-h">{lang === "mr" ? c?.label_mr ?? catId : c?.label_en ?? catId}</h2>
            <div className="sn-list-gap">
              {topics.map(tp => (
                <a key={tp.slug} className="sn-jrow" href={`#/t/${tp.slug}`}>
                  <div className="jt">{lang === "mr" ? tp.title_mr : tp.title_en}</div>
                  <div className="sn-tagrow" style={{ marginTop: 6 }}>
                    {tp.sections.map(s => <span key={s} className="sn-tag">§ {s}</span>)}
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{lang === "mr" ? "निकाल व कलम" : "Judgements & sections"}</h2>
        <div className="sn-welcome-cta">
          <a href="#/judgements">{lang === "mr" ? "सर्व निकाल शोधा" : "Search all judgements"}</a>
          <a href="#/reference">{lang === "mr" ? "कलम व कायदा संदर्भ" : "Sections & law reference"}</a>
          <a href="#/timeline">{lang === "mr" ? "शासन निर्णय टाइमलाइन" : "GR timeline"}</a>
        </div>
      </div>
    </div>
  );
}

/* keep loadHeadnotes referenced for potential future use in browse */
void loadHeadnotes;
