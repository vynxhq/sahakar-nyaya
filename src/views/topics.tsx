import { useEffect, useState } from "react";
import { Heading, Text, Card, Grid, Stack, Button, Stepper, Step, Selector, Banner } from "@astryxdesign/core";
import { Building2, Users, Wallet, Home as HomeIcon, FolderOpen, Scale, ArrowRight } from "lucide-react";
import { useLang } from "../state/lang";
import { loadTopic, loadHeadnotes, store, type Topic } from "../data/loader";

const HUE_BY_CAT: Record<string, string> = {
  redevelopment: "indigo", committee: "violet", money: "emerald",
  membership: "teal", records: "amber", disputes: "rose",
};
function CatIcon({ id }: { id: string }) {
  const size = 20;
  switch (id) {
    case "redevelopment": return <Building2 size={size} />;
    case "committee": return <Users size={size} />;
    case "money": return <Wallet size={size} />;
    case "membership": return <HomeIcon size={size} />;
    case "records": return <FolderOpen size={size} />;
    case "disputes": return <Scale size={size} />;
    default: return <Building2 size={size} />;
  }
}

/* ---------- Home: hero + guided wizard + essentials ---------- */

export function viewHome(): React.ReactNode {
  const { t } = useLang();
  const idx = store.topicsIndex;
  const sections = store.sections ?? [];
  const top5 = ["79A", "91", "154B-10", "154B-29", "9_Arb"];
  const topList = sections.filter(s => top5.includes(s.id));
  const years = (store.lite ?? []).map(j => +j.year).filter(y => y && !Number.isNaN(y));
  void idx;

  return (
    <>
      <div className="sn-hero">
        <h1>
          {t("heroTitle")}
          <span className="sn-hero-sub">{t("heroSub")}</span>
        </h1>
        <p className="sn-hero-para">{t("heroPara")}</p>
        <div className="sn-searchcard">
          <div className="sn-searchbox">
            <input
              placeholder={t("searchPlaceholder")}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  location.hash = `#/judgements?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`;
                }
              }}
            />
            <button type="button" onClick={() => { location.hash = "#/judgements"; }}>{t("search")}</button>
          </div>
        </div>
      </div>

      <WizardHome />

      {years.length > 0 && (
        <div className="sn-stats">
          <div className="sn-stat"><b>{(store.lite ?? []).length}</b><span>{t("statJudgements")}</span></div>
          <div className="sn-stat"><b>{(store.lite ?? []).filter(j => j.isRedevelopment).length}</b><span>{t("statRedev")}</span></div>
          <div className="sn-stat"><b>{new Set((store.lite ?? []).map(j => j.bench)).size}</b><span>{t("statBenches")}</span></div>
          <div className="sn-stat"><b>{Math.min(...years)}–{Math.max(...years)}</b><span>{t("statYears")}</span></div>
        </div>
      )}

      <Heading level={2} style={{ margin: "26px 0 4px" }}>{t("essentials")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 14 }}>{t("essentialsSub")}</Text>
      <div className="sn-cards">
        {topList.map(s => (
          <Card key={s.id} padding={2}>
            <a href={`#/reference#${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Heading level={3} style={{ margin: 0 }}>{s.title}</Heading>
              <Text style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)" }}>
                {(useLangLang() === "mr" ? s.summaryMr : s.summary).slice(0, 130)}…
              </Text>
            </a>
          </Card>
        ))}
      </div>
    </>
  );
}

// helper: current language (module-level access avoids prop drilling here)
import { useLang as _useLang } from "../state/lang";
function useLangLang(): string { return _useLang().lang; }

/* ---------- Wizard ---------- */

function WizardHome(): React.ReactNode {
  const { t, lang } = useLang();
  const [category, setCategory] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [situation, setSituation] = useState<string>("");

  const idx = store.topicsIndex;
  const cats = idx?.categories ?? [];
  const cat = cats.find(c => c.id === category);
  const situations = cat?.situations ?? [];
  const step = !category ? 0 : !role ? 1 : 2;
  void situation;

  return (
    <Card padding={4} style={{ marginBottom: 20 }} className="sn-wizard">
      <Heading level={2} style={{ margin: 0 }}>{t("topics")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 14 }}>{t("topicsSub")}</Text>
      <Stack gap={2} className="sn-wizard-stack">
        <Stepper activeStep={step} label={t("topics")}>
          <Step step={0} label={t("stepCategory")} />
          <Step step={1} label={t("stepRole")} />
          <Step step={2} label={t("stepSituation")} />
        </Stepper>
        {!category && (
          cats.length > 0 ? (
            <Grid columns={{ minWidth: 220, repeat: "fill" }}>
              {cats.map(c => (
                <Card key={c.id} padding={2} style={{ cursor: "pointer" }} onClick={() => setCategory(c.id)}>
                  <div className={`sn-chip sn-chip-${HUE_BY_CAT[c.id] ?? "indigo"}`}><CatIcon id={c.id} /></div>
                  <Heading level={3} style={{ margin: 0, fontSize: "0.95rem" }}>
                    {lang === "mr" ? c.label_mr : c.label_en}
                  </Heading>
                </Card>
              ))}
            </Grid>
          ) : <Text>…</Text>
        )}
        {category && (
          <Selector
            label={lang === "mr" ? "भूमिका" : "Role"} isLabelHidden
            placeholder={lang === "mr" ? "भूमिका निवडा" : "Choose your role"}
            options={[
              { value: "member", label: lang === "mr" ? "संस्थेचा सभासद" : "A member of the society" },
              { value: "committee", label: lang === "mr" ? "व्यवस्थापन समितीवर" : "On the managing committee" },
              { value: "office", label: lang === "mr" ? "पदाधिकारी" : "An office bearer" },
              { value: "buyer", label: lang === "mr" ? "घर खरेदीदार" : "A flat purchaser" },
            ]}
            onChange={v => setRole(v ?? "")}
          />
        )}
        {category && role && (
          situations.length > 0 ? (
            <Selector
              label={lang === "mr" ? "परिस्थिती" : "Situation"} isLabelHidden
              placeholder={lang === "mr" ? "परिस्थिती निवडा" : "Choose your situation"} hasSearch
              options={situations.map(s => ({ value: s.slug, label: lang === "mr" ? s.label_mr : s.label_en }))}
              onChange={v => setSituation(v ?? "")}
            />
          ) : <Banner status="info" title={t("comingSoon")} container="card" />
        )}
        {category && role && situation && (
          <Button label={t("showMe")} variant="primary" href={`#/t/${situation}?role=${role}`}
            endContent={<ArrowRight size={15} />} />
        )}
      </Stack>
    </Card>
  );
}

/* ---------- Topics directory ---------- */

export function TopicsDirectoryView(): React.ReactNode {
  const { t, lang } = useLang();
  const idx = store.topicsIndex;
  if (!idx) return <div className="sn-empty">{t("loading")}</div>;
  const byCat = new Map<string, typeof idx.topics>();
  for (const tp of idx.topics) {
    const list = byCat.get(tp.category) ?? [];
    list.push(tp);
    byCat.set(tp.category, list);
  }
  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("topics")}</p>
      <h1 className="sn-doc-title">{t("allTopics")}</h1>
      {[...byCat.entries()].map(([catId, topics]) => {
        const c = idx.categories.find(x => x.id === catId);
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

/* ---------- Topic document ---------- */

function useHeadnote(id: string, year: string) {
  const [hn, setHn] = useState<{ headnote_en: string; headnote_mr: string; title: string } | null>(null);
  useEffect(() => {
    if (!id || !year) return;
    let alive = true;
    loadHeadnotes(year).then(chunk => { if (alive) setHn(chunk[id] ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, [id, year]);
  return hn;
}

function JRow({ id, ctx }: { id: string; ctx: { lang: string } }) {
  const lite = store.lite ?? [];
  const j = lite.find(x => x.id === id);
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

export function TopicPageView({ slug, qstr }: { slug: string; qstr: string }): React.ReactNode {
  const { t, lang } = useLang();
  const [topic, setTopic] = useState<Topic | null>(store.topics[slug] ?? null);
  const [missing, setMissing] = useState(false);
  const role = new URLSearchParams(qstr).get("role") ?? "member";
  const rk = (role === "committee" || role === "office") ? "committee" : "member";

  useEffect(() => {
    let alive = true;
    setTopic(store.topics[slug] ?? null);
    setMissing(false);
    loadTopic(slug).then(tp => { if (alive) setTopic(tp); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [slug]);

  if (missing) return <div className="sn-empty">{t("judgNotFound")}</div>;
  if (!topic) return <div className="sn-empty">{t("loading")}</div>;

  const bLang = (en: string, mr: string) => (lang === "mr" ? mr : en);
  const memberSteps = lang === "mr" ? topic.nextSteps.member_mr : topic.nextSteps.member_en;
  const committeeSteps = lang === "mr" ? topic.nextSteps.committee_mr : topic.nextSteps.committee_en;

  return (
    <div className="sn-doc">
      <p className="sn-kicker">{t("topics")}</p>
      <h1 className="sn-doc-title">{bLang(topic.title_en, topic.title_mr)}</h1>

      {rk === "committee"
        ? <div className="sn-role-banner">{topic.roleFraming.committee_en}<div className="mr">{topic.roleFraming.committee_mr}</div></div>
        : <div className="sn-role-banner">{topic.roleFraming.member_en}<div className="mr">{topic.roleFraming.member_mr}</div></div>}

      {/* settled position first */}
      <div className="sn-settled">
        <div className="sn-settled-mark">
          {t("settledTitle")}
          <span className="sn-settled-ai">{t("aiLabelShort")}</span>
        </div>
        <div>{bLang(topic.settled_en, topic.settled_mr)}</div>
      </div>

      {/* the disagreement */}
      <div className="sn-compare">
        <div className="sn-interpretation">
          <div className="sn-int-label">{t("disputeATitle")}</div>
          <div className="sn-int-body">{bLang(topic.disputeA_en, topic.disputeA_mr)}</div>
        </div>
        <div className="sn-interpretation">
          <div className="sn-int-label">{t("disputeBTitle")}</div>
          <div className="sn-int-body">{bLang(topic.disputeB_en, topic.disputeB_mr)}</div>
        </div>
      </div>

      {/* law */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("lawSays")}</h2>
        <div className="sn-sect-body">{bLang(topic.lawSummary_en, topic.lawSummary_mr)}</div>
        {topic.grRefs.length > 0 && (
          <>
            <h4 style={{ margin: "var(--s3) 0 var(--s2)" }}>{t("grRefs")}</h4>
            <div className="sn-tagrow">{topic.grRefs.map(g => <span key={g} className="sn-tag">{g}</span>)}</div>
          </>
        )}
      </div>

      {/* courts held */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("courtsHeld")}</h2>
        {([["a", t("courtsA")], ["b", t("courtsB")], ["conditions", t("courtsConditions")]] as Array<[string, string]>).map(([g, label]) => {
          const ids = topic.holdGroups[g as keyof typeof topic.holdGroups] ?? [];
          if (ids.length === 0) return null;
          return (
            <div key={g}>
              <div className="sn-outcome">{label}<span className="count">{ids.length}</span></div>
              {ids.map(id => <JRow key={id} id={id} ctx={{ lang }} />)}
            </div>
          );
        })}
        {topic.holdGroups.a.length + topic.holdGroups.b.length + topic.holdGroups.conditions.length === 0 && (
          <div className="sn-tagrow">
            {topic.judgementIds.map(id => <JRow key={id} id={id} ctx={{ lang }} />)}
          </div>
        )}
      </div>

      {/* next steps */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("nextStepsTitle")}</h2>
        <h4 style={{ margin: "0 0 var(--s2)" }}>
          {rk === "committee" ? t("nextStepsCommittee") : t("nextStepsMember")}
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(rk === "committee" ? committeeSteps : memberSteps).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <h4 style={{ margin: "var(--s4) 0 var(--s2)" }}>
          {rk === "committee" ? t("nextStepsMember") : t("nextStepsCommittee")}
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(rk === "committee" ? memberSteps : committeeSteps).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      {/* sources */}
      <div className="sn-sect">
        <h2 className="sn-sect-h">{t("sectionsHeading")}</h2>
        <div className="sn-tagrow">
          {topic.sections.map(s => (
            <a key={s} className="sn-tag sec" href={`#/judgements?section=${encodeURIComponent(s)}`}>§ {s}</a>
          ))}
        </div>
        {topic.relatedTopics.length > 0 && (
          <>
            <h4 style={{ margin: "var(--s4) 0 var(--s2)" }}>{t("relatedTopics")}</h4>
            <div className="sn-tagrow">
              {topic.relatedTopics.map(r => <a key={r} className="sn-tag" href={`#/t/${r}`}>{r}</a>)}
            </div>
          </>
        )}
        <div className="sn-actions">
          <a href="#/browse">← {t("allTopics")}</a>
        </div>
      </div>
    </div>
  );
}
