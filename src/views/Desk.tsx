import { useEffect, useState } from "react";
import {
  Scale, Building2, Users, Wallet, Home as HomeIcon, FolderOpen,
  ArrowLeft, History, Info, BookOpen, Compass, ChevronRight, Gavel,
} from "lucide-react";
import type { LangCtx } from "../state/lang";
import {
  store, loadHeadnotes,
  type Topic, type JudgementLite,
} from "../data/loader";

const CATS = [
  { id: "redevelopment", icon: Building2 },
  { id: "committee", icon: Users },
  { id: "money", icon: Wallet },
  { id: "membership", icon: HomeIcon },
  { id: "records", icon: FolderOpen },
  { id: "disputes", icon: Scale },
];

const ROLE_KEY: Record<string, "member" | "committee"> = {
  member: "member", buyer: "member", committee: "committee", office: "committee",
};

/* ================= RAIL ================= */

export function Rail({ ctx, slug, role, category, onCategory, onRole, onNavigate }: {
  ctx: LangCtx;
  slug: string | null;
  role: string;
  category: string;
  onCategory: (c: string) => void;
  onRole: (r: string) => void;
  onNavigate: () => void;
}) {
  const { t, lang } = ctx;
  const idx = store.topicsIndex;
  const cats = idx?.categories ?? [];
  const cat = cats.find(c => c.id === category);
  const situations = cat?.situations ?? [];
  void onNavigate;

  return (
    <aside className="sn-rail">
      <h5>{lang === "mr" ? "क्षेत्र" : "Area"}</h5>
      <div className="sn-rail-list">
        {cats.map(c => {
          const Icon = CATS.find(x => x.id === c.id)?.icon ?? Building2;
          return (
            <button key={c.id} className={"sn-rail-item" + (category === c.id ? " active" : "")}
              onClick={() => onCategory(c.id)}>
              <Icon size={15} />
              <span>{lang === "mr" ? c.label_mr : c.label_en}</span>
            </button>
          );
        })}
        {cats.length === 0 && <span className="sn-rail-note">{t("loading")}</span>}
      </div>

      {category && (
        <>
          <h5>{lang === "mr" ? "भूमिका" : "Role"}</h5>
          <div className="sn-rail-list">
            {([
              ["member", t("roleMember")],
              ["committee", t("roleCommittee")],
              ["office", t("roleOffice")],
              ["buyer", t("roleBuyer")],
            ] as Array<[string, string]>).map(([r, label]) => (
              <button key={r} className={"sn-rail-item" + (role === r ? " active" : "")}
                onClick={() => onRole(r)}>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {category && role && situations.length > 0 && (
        <>
          <h5>{lang === "mr" ? "परिस्थिती" : "Situation"}</h5>
          <div className="sn-rail-list">
            {situations.map(s => (
              <a key={s.slug} className={"sn-rail-item" + (slug === s.slug ? " active" : "")}
                href={`#/t/${s.slug}?role=${role}`}>
                <span>{lang === "mr" ? s.label_mr : s.label_en}</span>
                <ChevronRight size={14} style={{ marginLeft: "auto", flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </>
      )}

      <h5>{lang === "mr" ? "झटपट दुवे" : "Quick links"}</h5>
      <div className="sn-rail-list">
        <a className={"sn-rail-item" + (slug === "__all" ? " active" : "")} href="#/browse">
          <BookOpen size={15} /><span>{t("allTopics")}</span>
        </a>
        <a className="sn-rail-item" href="#/judgements"><Gavel size={15} /><span>{t("judgements")}</span></a>
        <a className="sn-rail-item" href="#/timeline"><History size={15} /><span>{t("timeline")}</span></a>
        <a className="sn-rail-item" href="#/reference"><BookOpen size={15} /><span>{lang === "mr" ? "कलम व कायदा" : "Sections & law"}</span></a>
        <a className="sn-rail-item" href="#/about"><Info size={15} /><span>{t("about")}</span></a>
      </div>
    </aside>
  );
}

/* ================= WELCOME DOCUMENT (no topic selected) ================= */

export function WelcomeDoc({ ctx }: { ctx: LangCtx }) {
  const { lang } = ctx;
  const idx = store.topicsIndex;
  const count = idx?.topics.length ?? 0;
  return (
    <div className="sn-doc">
      <p className="sn-kicker">{lang === "mr" ? "सहकार न्याय" : "Sahakar Nyaya"}</p>
      <h1 className="sn-doc-title">
        {lang === "mr"
          ? "विवाद दोन्ही बाजूंनी समजून घ्या — न्यायालयाने खरोखर काय ठरवले ते पाहा."
          : "See both sides of the argument — and what the courts actually decided."}
      </h1>
      <p style={{ color: "var(--ink-2)", maxWidth: "60ch" }}>
        {lang === "mr"
          ? "डावीकडून आपले क्षेत्र, भूमिका आणि परिस्थिती निवडा. उजव्या बाजूला कायदा काय म्हणतो, न्यायालयांनी काय ठरवले आणि पुढे काय करावे — हे निर्देशित उत्तर दिसेल."
          : "Use the guide on the left: pick your area, your role and your situation. The answer document opens here — the settled position first, then the law, the courts and your next steps."}
      </p>
      <div className="sn-welcome-cta">
        <a href="#/browse"><Compass size={17} /> {lang === "mr" ? `सर्व ${count} विषय पहा` : `Browse all ${count} topics`}</a>
        <a href="#/judgements"><Gavel size={17} /> {lang === "mr" ? "निकाल शोधा" : "Search judgements"}</a>
        <a href="#/timeline"><History size={17} /> {lang === "mr" ? "गृहनिर्माण GR इतिहास" : "Redevelopment GR timeline"}</a>
      </div>
    </div>
  );
}

/* ================= TOPIC DOCUMENT (settled position FIRST) ================= */

function useHeadnote(id: string, year: string) {
  const [hn, setHn] = useState<{ headnote_en: string; headnote_mr: string; title: string } | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    loadHeadnotes(year).then(chunk => { if (alive) setHn(chunk[id] ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, [id, year]);
  return hn;
}

function JRow({ id, ctx }: { id: string; ctx: LangCtx }) {
  const lite = store.lite ?? [];
  const j: JudgementLite | undefined = lite.find(x => x.id === id);
  const year = j?.year ?? id.match(/(\d{4})-\d{2}-\d{2}$/)?.[1] ?? "";
  const hn = useHeadnote(id, year);
  return (
    <a className="sn-jrow" href={`#/j/${id}`}>
      <div className="jt">{hn?.title || id}</div>
      <div className="jn">
        <span className="sn-hnlabel">{ctx.lang === "mr" ? "निकाल" : "judgement"}</span>
        {j?.date ?? ""} · {j?.benchName ?? ""}{j?.judge ? ` · ${j.judge}` : ""}
      </div>
    </a>
  );
}

function Group({ label, ids, ctx }: { label: string; ids: string[]; ctx: LangCtx }) {
  if (ids.length === 0) return null;
  return (
    <>
      <div className="sn-outcome">{label}<span className="count">{ids.length}</span></div>
      {ids.map(id => <JRow key={id} id={id} ctx={ctx} />)}
    </>
  );
}

export function TopicDoc({ ctx, topic }: { ctx: LangCtx; topic: Topic }) {
  const { t, lang } = ctx;
  const role = new URLSearchParams(location.hash.split("?")[1] ?? "").get("role") ?? "member";
  const rk = ROLE_KEY[role] ?? "member";
  const bLang = (en: string, mr: string) => (lang === "mr" ? mr : en);

  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("topics")}</p>
      <h1 className="sn-doc-title">{bLang(topic.title_en, topic.title_mr)}</h1>

      {rk === "committee"
        ? <div className="sn-role-banner">{topic.roleFraming.committee_en}<div className="mr">{topic.roleFraming.committee_mr}</div></div>
        : <div className="sn-role-banner">{topic.roleFraming.member_en}<div className="mr">{topic.roleFraming.member_mr}</div></div>}

      {/* SETTLED POSITION FIRST */}
      <div className="sn-settled">
        <div className="sn-settled-mark">
          {t("settledTitle")}
          <span className="sn-settled-ai">{t("aiLabelShort")}</span>
        </div>
        <div>{bLang(topic.settled_en, topic.settled_mr)}</div>
      </div>

      {/* THE DISAGREEMENT */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("disputeATitle")}</h2>
        <div className="sn-sect-body">{bLang(topic.disputeA_en, topic.disputeA_mr)}</div>
        <h2 className="sn-sect-h" style={{ marginTop: "var(--s4)" }}>{t("disputeBTitle")}</h2>
        <div className="sn-sect-body">{bLang(topic.disputeB_en, topic.disputeB_mr)}</div>
      </div>

      {/* LAW */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("lawSays")}</h2>
        <div className="sn-sect-body">{bLang(topic.lawSummary_en, topic.lawSummary_mr)}</div>
        {topic.grRefs.length > 0 && (
          <>
            <Heading4 text={t("grRefs")} />
            <div className="sn-tagrow">{topic.grRefs.map(g => <span key={g} className="sn-tag">{g}</span>)}</div>
          </>
        )}
      </div>

      {/* COURTS HELD */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("courtsHeld")}</h2>
        <Group label={t("courtsA")} ids={topic.holdGroups.a} ctx={ctx} />
        <Group label={t("courtsB")} ids={topic.holdGroups.b} ctx={ctx} />
        <Group label={t("courtsConditions")} ids={topic.holdGroups.conditions} ctx={ctx} />
        {topic.judgementIds.length > Object.values(topic.holdGroups).flat().length && (
          <>
            <Heading4 text={t("courtsHeld")} />
            {topic.judgementIds.filter(id => !Object.values(topic.holdGroups).flat().includes(id))
              .map(id => <JRow key={id} id={id} ctx={ctx} />)}
          </>
        )}
      </div>

      {/* NEXT STEPS */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("nextStepsTitle")}</h2>
        <Heading4 text={rk === "committee" ? t("nextStepsCommittee") : t("nextStepsMember")} />
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(rk === "committee"
            ? (lang === "mr" ? topic.nextSteps.committee_mr : topic.nextSteps.committee_en)
            : (lang === "mr" ? topic.nextSteps.member_mr : topic.nextSteps.member_en)
          ).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <Heading4 text={rk === "committee" ? t("nextStepsMember") : t("nextStepsCommittee")} />
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(rk === "committee"
            ? (lang === "mr" ? topic.nextSteps.member_mr : topic.nextSteps.member_en)
            : (lang === "mr" ? topic.nextSteps.committee_mr : topic.nextSteps.committee_en)
          ).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      {/* SOURCES */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("sectionsHeading")}</h2>
        <div className="sn-tagrow">
          {topic.sections.map(s => (
            <a key={s} className="sn-tag sec" href={`#/judgements?section=${encodeURIComponent(s)}`}>§ {s}</a>
          ))}
        </div>
        {topic.relatedTopics.length > 0 && (
          <>
            <Heading4 text={t("relatedTopics")} />
            <div className="sn-tagrow">
              {topic.relatedTopics.map(r => <a key={r} className="sn-tag" href={`#/t/${r}`}>{r}</a>)}
            </div>
          </>
        )}
        <div className="sn-actions">
          <a href="#/browse" className="sn-ghost"><ArrowLeft size={15} /> {t("allTopics")}</a>
        </div>
      </div>
    </div>
  );
}

/* small helper (kept local to avoid extra imports) */
function Heading4({ text }: { text: string }) {
  return <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-2)", margin: "var(--s4) 0 var(--s2)" }}>{text}</h4>;
}
