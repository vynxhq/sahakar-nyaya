import { useEffect, useState } from "react";
import {
  Building2, ChevronRight, Compass, FolderOpen, Gavel, History, Home as HomeIcon,
  Info, BookOpen, Scale, Users, Wallet,
} from "lucide-react";
import { useLang, type LangCtx } from "@/state/lang";
import { loadTopic, store, type Topic } from "@/data/loader";
import { useHeadnote } from "@/hooks/use-headnote";

const CATS = [
  { id: "redevelopment", icon: Building2 },
  { id: "committee", icon: Users },
  { id: "money", icon: Wallet },
  { id: "membership", icon: HomeIcon },
  { id: "records", icon: FolderOpen },
  { id: "disputes", icon: Scale },
];

/* ================= rail ================= */

export function Rail({ slug, role, category, onCategory, onRole }: {
  slug: string | null;
  role: string;
  category: string;
  onCategory: (c: string) => void;
  onRole: (r: string) => void;
}) {
  const { t, lang } = useLang();
  const idx = store.topicsIndex;
  const cats = idx?.categories ?? [];
  // derive the area from the open topic when the user never picked one
  const effCat = category || (slug ? idx?.topics.find(x => x.slug === slug)?.category ?? "" : "");
  const cat = cats.find(c => c.id === effCat);
  const situations = cat?.situations ?? [];

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r bg-background px-4 py-6 max-md:static max-md:h-auto max-md:border-r-0 max-md:border-b">
      <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {lang === "mr" ? "क्षेत्र" : "Area"}
      </h5>
      <div className="flex flex-col gap-0.5">
        {cats.map(c => {
          const Icon = CATS.find(x => x.id === c.id)?.icon ?? Building2;
          return (
            <button key={c.id} onClick={() => onCategory(c.id)}
              className={"flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                (effCat === c.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon size={15} className="shrink-0" />
              <span>{lang === "mr" ? c.label_mr : c.label_en}</span>
            </button>
          );
        })}
        {cats.length === 0 && <span className="text-xs text-muted-foreground">{t("loading")}</span>}
      </div>

      {effCat && (
        <>
          <h5 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {lang === "mr" ? "भूमिका" : "Role"}
          </h5>
          <div className="flex flex-col gap-0.5">
            {([
              ["member", t("roleMember")],
              ["committee", t("roleCommittee")],
              ["office", t("roleOffice")],
              ["buyer", t("roleBuyer")],
            ] as Array<[string, string]>).map(([r, label]) => (
              <button key={r} onClick={() => onRole(r)}
                className={"flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                  (role === r ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {effCat && role && situations.length > 0 && (
        <>
          <h5 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {lang === "mr" ? "परिस्थिती" : "Situation"}
          </h5>
          <div className="flex flex-col gap-0.5">
            {situations.map(s => (
              <a key={s.slug} href={`#/t/${s.slug}?role=${role}`}
                onClick={e => { e.preventDefault(); onCategory(effCat); location.hash = `#/t/${s.slug}?role=${role}`; }}
                className={"flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                  (slug === s.slug ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <span className="flex-1">{lang === "mr" ? s.label_mr : s.label_en}</span>
                <ChevronRight size={14} className="shrink-0 opacity-50" />
              </a>
            ))}
          </div>
        </>
      )}

      <h5 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {lang === "mr" ? "झटपट दुवे" : "Quick links"}
      </h5>
      <div className="flex flex-col gap-0.5">
        {([
          ["#/browse", t("allTopics"), BookOpen],
          ["#/judgements", t("judgements"), Gavel],
          ["#/timeline", t("timeline"), History],
          ["#/reference", lang === "mr" ? "कलम व कायदा" : "Sections & law", BookOpen],
          ["#/about", t("about"), Info],
        ] as Array<[string, string, typeof BookOpen]>).map(([href, label, Icon]) => (
          <a key={href} href={href}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Icon size={15} className="shrink-0" />
            <span>{label}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}

/* ================= welcome document ================= */

export function WelcomeDoc(): React.ReactNode {
  const { lang } = useLang();
  const count = store.topicsIndex?.topics.length ?? 0;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
        {lang === "mr" ? "सहकार न्याय" : "Sahakar Nyaya"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-light leading-[1.15] tracking-tight md:text-4xl">
        {lang === "mr"
          ? <>विवाद दोन्ही बाजूंनी समजून घ्या — <span className="text-primary">न्यायालयाने खरोखर काय ठरवले</span> ते पाहा.</>
          : <>See both sides of the argument — and <span className="text-primary">what the courts actually decided</span>.</>}
      </h1>
      <p className="mt-5 max-w-[58ch] text-[1.02rem] leading-relaxed text-muted-foreground">
        {lang === "mr"
          ? "डावीकडून आपले क्षेत्र, भूमिका आणि परिस्थिती निवडा. उजव्या बाजूला कायदा काय म्हणतो, न्यायालयांनी काय ठरवले आणि पुढे काय करावे — हे निर्देशित उत्तर दिसेल."
          : "Use the guide on the left: pick your area, your role and your situation. The answer document opens here — the settled position first, then the law, the courts and your next steps."}
      </p>
      <div className="mt-8 flex flex-col gap-2">
        <a href="#/browse" className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[0.95rem] font-semibold transition-colors hover:border-primary hover:text-primary">
          <Compass size={17} className="text-primary" />
          {lang === "mr" ? `सर्व ${count} मार्गदर्शित विषय पहा` : `Browse all ${count} guided topics`}
        </a>
        <a href="#/judgements" className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[0.95rem] font-semibold transition-colors hover:border-primary hover:text-primary">
          <Gavel size={17} className="text-primary" />
          {lang === "mr" ? "निकाल शोधा" : "Search judgements"}
        </a>
        <a href="#/timeline" className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[0.95rem] font-semibold transition-colors hover:border-primary hover:text-primary">
          <History size={17} className="text-primary" />
          {lang === "mr" ? "पुनर्विकास GR टाइमलाइन" : "Redevelopment GR timeline"}
        </a>
      </div>
    </div>
  );
}

/* ================= topic document (settled position FIRST) ================= */

function JRow({ id, lang }: { id: string; lang: string }) {
  const lite = store.lite ?? [];
  const j = lite.find(x => x.id === id);
  const year = j?.year ?? id.match(/(\d{4})-\d{2}-\d{2}$/)?.[1] ?? "";
  const hn = useHeadnote(id, year);
  return (
    <a href={`#/j/${id}`} className="block rounded-lg border border-border/60 bg-card px-4 py-3 transition-colors hover:border-primary/40">
      <div className="text-[0.92rem] font-semibold text-foreground">{hn?.title || id}</div>
      <div className="mt-1 text-[0.8rem] text-muted-foreground">
        <span className="mr-1.5 inline-block rounded-sm border border-primary/40 bg-primary/5 px-1.5 text-[0.6rem] font-bold uppercase tracking-wide text-primary">
          {lang === "mr" ? "निकाल" : "judgement"}
        </span>
        {j?.date ?? ""} · {j?.benchName ?? ""}{j?.judge ? ` · ${j.judge}` : ""}
      </div>
    </a>
  );
}

export function TopicDoc({ ctx, topic }: { ctx: LangCtx; topic: Topic }) {
  const { t, lang } = ctx;
  const role = new URLSearchParams(location.hash.split("?")[1] ?? "").get("role") ?? "member";
  const rk = (role === "committee" || role === "office") ? "committee" : "member";
  const bLang = (en: string, mr: string) => (lang === "mr" ? mr : en);
  const memberSteps = lang === "mr" ? topic.nextSteps.member_mr : topic.nextSteps.member_en;
  const committeeSteps = lang === "mr" ? topic.nextSteps.committee_mr : topic.nextSteps.committee_en;

  return (
    <article>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{t("topics")}</p>
      <h1 className="mt-2 font-display text-3xl font-light leading-[1.2] tracking-tight">
        {bLang(topic.title_en, topic.title_mr)}
      </h1>

      <div className="mt-5 border-y border-border py-4 text-[0.98rem] leading-relaxed">
        {rk === "committee"
          ? <>{topic.roleFraming.committee_en}<span className="mt-2 block text-[0.88rem] text-muted-foreground">{topic.roleFraming.committee_mr}</span></>
          : <>{topic.roleFraming.member_en}<span className="mt-2 block text-[0.88rem] text-muted-foreground">{topic.roleFraming.member_mr}</span></>}
      </div>

      {/* settled position first */}
      <div className="my-6 rounded-xl border-l-4 border-primary bg-card p-5 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-primary">{t("settledTitle")}</span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[0.66rem] text-muted-foreground">
            {t("aiLabelShort")}
          </span>
        </div>
        <p className="font-display text-[1.12rem] leading-relaxed text-foreground">
          {bLang(topic.settled_en, topic.settled_mr)}
        </p>
      </div>

      {/* the disagreement */}
      <h2 className="font-display text-xl">{lang === "mr" ? "वाद — दोन्ही बाजू" : "The disagreement"}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{t("disputeATitle")}</div>
          <p className="text-[0.92rem] leading-relaxed">{bLang(topic.disputeA_en, topic.disputeA_mr)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{t("disputeBTitle")}</div>
          <p className="text-[0.92rem] leading-relaxed">{bLang(topic.disputeB_en, topic.disputeB_mr)}</p>
        </div>
      </div>

      {/* law */}
      <h2 className="mt-8 font-display text-xl">{lang === "mr" ? "कायदा काय म्हणतो" : "What the law says"}</h2>
      <p className="mt-3 leading-relaxed">{bLang(topic.lawSummary_en, topic.lawSummary_mr)}</p>
      {topic.grRefs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {topic.grRefs.map(g => (
            <span key={g} className="rounded-full border border-border bg-muted px-3 py-1 text-[0.74rem] text-muted-foreground">{g}</span>
          ))}
        </div>
      )}

      {/* courts held */}
      <h2 className="mt-8 font-display text-xl">{lang === "mr" ? "न्यायालयांनी काय ठरवले" : "What the courts held"}</h2>
      <p className="text-sm text-muted-foreground">
        {lang === "mr" ? "बॉम्बे उच्च न्यायालयाचे खरे निकाल — कोणत्या मताला पाठिंबा त्याप्रमाणे गटबद्ध." : "Real Bombay High Court judgements, grouped by which interpretation they supported."}
      </p>
      <div className="mt-4">
        {([["a", lang === "mr" ? "मत A ला पाठिंबा" : "Supports interpretation A"],
           ["b", lang === "mr" ? "मत B ला पाठिंबा" : "Supports interpretation B"],
           ["conditions", lang === "mr" ? "अटी / बारकावे" : "With conditions"]] as Array<[string, string]>).map(([g, label]) => {
          const ids = topic.holdGroups[g as keyof typeof topic.holdGroups] ?? [];
          if (ids.length === 0) return null;
          return (
            <div key={g}>
              <div className="mt-5 mb-2.5 flex items-baseline gap-2">
                <span className="text-[0.95rem] font-bold">{label}</span>
                <span className="text-xs font-semibold text-primary">{ids.length}</span>
              </div>
              <div className="flex flex-col gap-2">{ids.map(jid => <JRow key={jid} id={jid} lang={lang} />)}</div>
            </div>
          );
        })}
        {topic.judgementIds.filter(id =>
          !Object.values(topic.holdGroups).flat().includes(id),
        ).length > 0 && (
          <>
            <div className="mt-5 mb-2.5 text-[0.95rem] font-bold">
              {lang === "mr" ? "इतर संबंधित निकाल" : "Other related judgements"}
            </div>
            <div className="flex flex-col gap-2">
              {topic.judgementIds
                .filter(id => !Object.values(topic.holdGroups).flat().includes(id))
                .map(id => <JRow key={id} id={id} lang={lang} />)}
            </div>
          </>
        )}
      </div>

      {/* next steps */}
      <h2 className="mt-8 font-display text-xl">{t("nextStepsTitle")}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-widest text-primary">{t("nextStepsMember")}</div>
          <ul className="ml-4 list-disc space-y-1.5 text-[0.92rem]">{memberSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-widest text-primary">{t("nextStepsCommittee")}</div>
          <ul className="ml-4 list-disc space-y-1.5 text-[0.92rem]">{committeeSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      </div>

      {/* sources */}
      <h2 className="mt-8 font-display text-xl">{lang === "mr" ? "स्रोत" : "Sources"}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topic.sections.map(s => (
          <a key={s} href={`#/judgements?section=${encodeURIComponent(s)}`}
            className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-[0.76rem] font-semibold text-primary hover:bg-primary/10">
            § {s}
          </a>
        ))}
      </div>
      {topic.relatedTopics.length > 0 && (
        <>
          <h3 className="mt-6 text-[0.8rem] font-bold uppercase tracking-widest text-muted-foreground">{t("relatedTopics")}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topic.relatedTopics.map(r => <a key={r} className="sn-tag" href={`#/t/${r}`}>{r}</a>)}
          </div>
        </>
      )}
      <div className="mt-8"><a href="#/browse" className="text-sm font-semibold text-primary">← {t("allTopics")}</a></div>
    </article>
  );
}

/* ================= TopicPane wrapper (loads topic) ================= */

export function TopicPane({ ctx, slug }: { ctx: LangCtx; slug: string }) {
  const [topic, setTopic] = useState<Topic | null>(store.topics[slug] ?? null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    setTopic(store.topics[slug] ?? null);
    setMissing(false);
    loadTopic(slug).then(tp => { if (alive) setTopic(tp); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [slug]);
  if (missing) return <div className="sn-empty">{ctx.t("judgNotFound")}</div>;
  if (!topic) return <div className="sn-empty">{ctx.t("loading")}</div>;
  return <TopicDoc ctx={ctx} topic={topic} />;
}
