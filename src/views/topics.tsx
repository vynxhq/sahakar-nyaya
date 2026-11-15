import { useEffect, useState } from "react";
import { Heading, Text, Card, Grid, Stack, Button, Stepper, Step, Selector, Badge, Banner } from "@astryxdesign/core";
import { Building2, Users, Wallet, Home as HomeIcon, FolderOpen, Scale } from "lucide-react";
import { useLang } from "../state/lang";
import { loadTopicsIndex, loadTopic, loadHeadnotes, type TopicsIndex, type Topic } from "../data/loader";

/* ---------- Home (guided entry) ---------- */

export function viewHome(): React.ReactNode {
  const { t } = useLang();
  void loadTopicsIndex().catch(() => {});
  return (
    <>
      <div className="sn-hero">
        <h1>{t("heroTitle")}<span className="sn-hero-sub"><span className="saffron">{t("heroSub")}</span></span></h1>
        <p className="sn-hero-para">{t("heroPara")}</p>
        <div className="sn-searchcard">
          <div className="sn-searchbox">
            <input placeholder={t("searchPlaceholder")} onKeyDown={e => { if (e.key === "Enter") location.hash = `#/judgements?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`; }} />
            <button type="button">{t("search")}</button>
          </div>
        </div>
      </div>
      <WizardHome />
      <Heading level={2} style={{ margin: "18px 0 4px" }}>{t("essentials")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}>{t("essentialsSub")}</Text>
      <SectionCards />
    </>
  );
}


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

/* Wizard: category → role → situation → topic */
function WizardHome(): React.ReactNode {
  const { t, lang } = useLang();
  const [idx, setIdx] = useState<TopicsIndex | null>(null);
  const [category, setCategory] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [situation, setSituation] = useState<string>("");

  useEffect(() => { loadTopicsIndex().then(setIdx).catch(() => {}); }, []);

  const cats = idx?.categories ?? [];
  const cat = cats.find(c => c.id === category);
  const situations = cat?.situations ?? [];
  const topicSlug = situation || null;
  const step = !category ? 0 : !role ? 1 : 2;

  return (
    <Card style={{ marginBottom: 18 }}>
      <Heading level={2} style={{ margin: 0 }}>{t("topics")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}>{t("topicsSub")}</Text>
      <Stack gap={2} className="sn-wizard-stack">
        <Stepper activeStep={step} label={t("topics")}>
          <Step step={0} label={t("stepCategory")} />
          <Step step={1} label={t("stepRole")} />
          <Step step={2} label={t("stepSituation")} />
        </Stepper>
        {!category && (
          cats.length > 0 ? (
            <Grid columns={{ minWidth: 240, repeat: "fill" }} gap={2}>
              {cats.map(c => (
                <Card key={c.id} padding={2} style={{ cursor: "pointer" }} onClick={() => setCategory(c.id)}>
                  <div className={`sn-chip sn-chip-${HUE_BY_CAT[c.id] ?? "indigo"}`}><CatIcon id={c.id} /></div>
                  <Heading level={3} style={{ margin: 0, fontSize: "1rem" }}>{lang === "mr" ? c.label_mr : c.label_en}</Heading>
                </Card>
              ))}
            </Grid>
          ) : <Text>…</Text>
        )}
        {category && (
          <Selector label={t("wizardIAm")} isLabelHidden placeholder={t("wizardIAm")}
            options={[
              { value: "member", label: t("roleMember") },
              { value: "committee", label: t("roleCommittee") },
              { value: "office", label: t("roleOffice") },
              { value: "buyer", label: t("roleBuyer") },
            ]}
            onChange={v => { setRole(v ?? ""); setSituation(""); }} />
        )}
        {category && role && (
          situations.length > 0 ? (
            <Selector label={t("wizardSituation")} isLabelHidden placeholder={t("wizardSituation")} hasSearch
              presentation="adaptive"
              options={situations.map(s => ({ value: s.slug, label: lang === "mr" ? s.label_mr : s.label_en }))}
              onChange={v => setSituation(v ?? "")} />
          ) : <Banner status="info" title={t("comingSoon")} container="card" />
        )}
        {topicSlug && (
          <Button label={t("showMe")} variant="primary" href={`#/t/${topicSlug}?role=${role}`} />
            
        )}
      </Stack>
    </Card>
  );
}

function SectionCards(): React.ReactNode {
  const { lang, t } = useLang();
  const [sections, setSections] = useState<Array<{ id: string; title: string; summary: string; summaryMr: string }> | null>(null);
  useEffect(() => {
    fetch("data/sections.json").then(r => r.json()).then(d => setSections(d.sections)).catch(() => {});
  }, []);
  const top5 = ["79A", "91", "154B-10", "154B-29", "9_Arb"];
  const list = (sections ?? []).filter(s => top5.includes(s.id));
  return (
    <Grid columns={{ minWidth: 240, repeat: "fill" }} gap={2}>
      {list.map(s => (
        <Card key={s.id}>
          <a href={`#/sections#${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Heading level={3} style={{ margin: 0, color: "var(--color-accent)" }}>{s.title}</Heading>
            <Text style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              {(lang === "mr" ? s.summaryMr : s.summary).slice(0, 130)}…
            </Text>
          </a>
        </Card>
      ))}
      {list.length === 0 && <Text>{t("loading")}</Text>}
    </Grid>
  );
}

/* ---------- Topics directory ---------- */

export function TopicsDirectoryView(): React.ReactNode {
  const { t, lang } = useLang();
  const [idx, setIdx] = useState<TopicsIndex | null>(null);
  useEffect(() => { loadTopicsIndex().then(setIdx).catch(() => {}); }, []);
  if (!idx) return <div className="sn-empty">{t("loading")}</div>;
  return (
    <>
      <Heading level={2} style={{ margin: "6px 0 4px" }}>{t("allTopics")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}>{t("topicsSub")}</Text>
      <Grid columns={{ minWidth: 260, repeat: "fill" }} gap={2}>
        {idx.topics.map(tp => (
          <Card key={tp.slug}>
            <a href={`#/t/${tp.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Heading level={3} style={{ margin: 0, fontSize: "1rem" }}>
                {lang === "mr" ? tp.title_mr : tp.title_en}
              </Heading>
              <div className="sn-tagrow">
                {tp.sections.map(s => <span key={s} className="sn-tag">§ {s}</span>)}
              </div>
            </a>
          </Card>
        ))}
      </Grid>
    </>
  );
}

/* ---------- Topic page (mediation template) ---------- */

export function TopicPageView({ slug, qstr }: { slug: string; qstr: string }): React.ReactNode {
  const { t, lang } = useLang();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    loadTopic(slug).then(tp => { if (alive) setTopic(tp); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [slug]);

  if (missing) return <div className="sn-empty">{t("judgNotFound")}</div>;
  if (!topic) return <div className="sn-empty">{t("loading")}</div>;

  const role = new URLSearchParams(qstr).get("role") ?? "member";
  const title = lang === "mr" ? topic.title_mr : topic.title_en;
  const bLang = (en: string, mr: string) => (lang === "mr" ? mr : en);

  return (
    <>
      <h1 className="sn-topic-title">{title}</h1>
      {topic.redev && <Badge variant="info" label={t("redevTag")} />}
      {role === "committee" || role === "office" ? (
        <div className="sn-role-banner">{topic.roleFraming.committee_en}<div className="mr">{topic.roleFraming.committee_mr}</div></div>
      ) : (
        <div className="sn-role-banner">{topic.roleFraming.member_en}<div className="mr">{topic.roleFraming.member_mr}</div></div>
      )}

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

      <Heading level={3} style={{ margin: "16px 0 8px" }}>{t("lawSays")}</Heading>
      <Card>
        {bLang(topic.lawSummary_en, topic.lawSummary_mr)}
        {topic.grRefs.length > 0 && (
          <>
            <Heading level={4} style={{ margin: "12px 0 4px" }}>{t("grRefs")}</Heading>
            <div className="sn-tagrow">{topic.grRefs.map(g => <span key={g} className="sn-tag">{g}</span>)}</div>
          </>
        )}
      </Card>

      <CourtsHeld topic={topic} />

      <div className="sn-settled">
        <div className="sn-settled-mark">{t("settledTitle")}<span className="sn-settled-ai">{t("aiLabelShort")}</span></div>
        <div>{bLang(topic.settled_en, topic.settled_mr)}</div>
      </div>

      <Heading level={3} style={{ margin: "16px 0 8px" }}>{t("nextStepsTitle")}</Heading>
      <Grid columns={{ minWidth: 280, repeat: "fill" }} gap={2}>
        <Card>
          <Heading level={4} style={{ margin: 0 }}>{t("nextStepsMember")}</Heading>
          <ul>{(lang === "mr" ? topic.nextSteps.member_mr : topic.nextSteps.member_en).map((s, i) => <li key={i}>{s}</li>)}</ul>
        </Card>
        <Card>
          <Heading level={4} style={{ margin: 0 }}>{t("nextStepsCommittee")}</Heading>
          <ul>{(lang === "mr" ? topic.nextSteps.committee_mr : topic.nextSteps.committee_en).map((s, i) => <li key={i}>{s}</li>)}</ul>
        </Card>
      </Grid>

      <Heading level={3} style={{ margin: "16px 0 8px" }}>{t("sectionsHeading")}</Heading>
      <div className="sn-tagrow">
        {topic.sections.map(s => <a key={s} className="sn-tag-sec" href={`#/judgements?section=${encodeURIComponent(s)}`}>§ {s}</a>)}
      </div>
      {topic.relatedTopics.length > 0 && (
        <>
          <Heading level={3} style={{ margin: "16px 0 8px" }}>{t("relatedTopics")}</Heading>
          <div className="sn-tagrow">
            {topic.relatedTopics.map(r => <a key={r} href={`#/t/${r}`}>{r}</a>)}
          </div>
        </>
      )}
      <p style={{ marginTop: 14 }}><a href="#/topics">← {t("allTopics")}</a></p>
    </>
  );
}

/* Courts-held: groups judgements by interpretation side, pulling headnote chunks */
function CourtsHeld({ topic }: { topic: Topic }): React.ReactNode {
  const { t } = useLang();
  const [chunks, setChunks] = useState<Record<string, { headnote_en: string; headnote_mr: string; title: string }> | null>(null);
  // year extraction: judgement id ends _1_YYYY-MM-DD; use meta instead: rely on lite data
  useEffect(() => {
    let alive = true;
    const uniqYears = [...new Set(
      topic.judgementIds.map(id => {
        const m = id.match(/(\d{4})-\d{2}-\d{2}$/);
        return m ? m[1] : "";
      }).filter(Boolean),
    )];
    Promise.all(uniqYears.map(y => loadHeadnotes(y).catch(() => [])))
      .then(lists => {
        if (!alive) return;
        const merged: typeof chunks = {};
        for (const l of lists) Object.assign(merged!, l);
        setChunks(merged);
      });
    return () => { alive = false; };
  }, [topic.slug]);

  if (!chunks) return <div className="sn-empty">{t("loading")}</div>;
  const groups: Array<[string, string[], string]> = [
    [t("courtsA"), topic.holdGroups.a, "info"],
    [t("courtsB"), topic.holdGroups.b, "warning"],
    [t("courtsConditions"), topic.holdGroups.conditions, "neutral"],
  ];
  return (
    <>
      <Heading level={3} style={{ margin: "16px 0 4px" }}>{t("courtsHeld")}</Heading>
      <Text style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}>{t("courtsHeldSub")}</Text>
      {groups.map(([label, ids]) => ids.length === 0 ? null : (
        <Card key={label} style={{ marginBottom: 12 }}>
          <span className={label === t("courtsA") ? "sn-outcome sn-outcome-a" : label === t("courtsB") ? "sn-outcome sn-outcome-b" : "sn-outcome sn-outcome-c"}>{label} <span className="count">{ids.length}</span></span>
          <div style={{ marginTop: 8 }}>
            {ids.map(id => {
              const hn = chunks[id];
              if (!hn) return (
                <div key={id} style={{ margin: "6px 0" }}>
                  <a href={`#/j/${id}`} style={{ textDecoration: "none", color: "var(--color-accent)" }}>{id}</a>
                </div>
              );
              return (
                <div key={id} style={{ marginBottom: 12 }}>
                  <a href={`#/j/${id}`} style={{ textDecoration: "none", color: "var(--color-accent)", fontWeight: 600 }}>
                    {hn.title || id}
                  </a>
                  <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    <span className="sn-hnlabel">EN</span> {hn.headnote_en}
                  </div>
                  <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    <span className="sn-hnlabel">मरा</span> {hn.headnote_mr}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </>
  );
}

/* ensure lang unused-var tolerance for strict tsc in some builds */
void (function () { return undefined; });
