import { useEffect, useState } from "react";
import { Scale, Search, X } from "lucide-react";
import { stoneTheme } from "./theme/sahakarTheme";
import { Theme } from "@astryxdesign/core/theme";
import { LangContext, initLangFromStorage, type LangCtx } from "./state/lang";
import { catalog, tr, type CatalogKey, type Lang } from "./i18n/catalogs";
import { loadCore, loadTopic, warmHeavy, store, type Topic } from "./data/loader";
import { Palette, usePaletteShortcut } from "./components/Palette";
import { Rail, WelcomeDoc, TopicDoc } from "./views/Desk";
import { JudgementsView, JudgementDoc } from "./views/Judgements";
import { BrowseView } from "./views/Browse";
import { TimelineDoc, ReferenceDoc, AboutDoc } from "./views/Docs";

function parseHash(): { path: string; sub: string; qstr: string } {
  let h = location.hash.replace(/^#\/?/, "");
  const qIdx = h.indexOf("?");
  const qstr = qIdx >= 0 ? h.slice(qIdx + 1) : "";
  const bare = qIdx >= 0 ? h.slice(0, qIdx) : h;
  const path = bare.split("/")[0] || "desk";
  const sub = bare.includes("/") ? bare.slice(bare.indexOf("/") + 1) : "";
  return { path, sub, qstr };
}

type View =
  | { name: "desk"; slug: string | null; role: string }
  | { name: "browse" }
  | { name: "judgements"; qstr: string }
  | { name: "j"; id: string }
  | { name: "timeline" }
  | { name: "reference"; anchor: string }
  | { name: "about" };

function viewFromHash(): View {
  const { path, sub, qstr } = parseHash();
  switch (path) {
    case "": case "desk": case "t": {
      const params = new URLSearchParams(qstr);
      return { name: "desk", slug: path === "t" ? decodeURIComponent(sub) : null, role: params.get("role") ?? "member" };
    }
    case "browse": return { name: "browse" };
    case "judgements": return { name: "judgements", qstr };
    case "j": return { name: "j", id: decodeURIComponent(sub) };
    case "timeline": return { name: "timeline" };
    case "reference": return { name: "reference", anchor: decodeURIComponent(sub) };
    case "about": return { name: "about" };
    default: return { name: "desk", slug: null, role: "member" };
  }
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(initLangFromStorage());
  const [ready, setReady] = useState(store.lite != null);
  const [error, setError] = useState<string | null>(null);
  const [pillOpen, setPillOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [, force] = useState(0);
  const [view, setView] = useState<View>(viewFromHash());
  const [guideCategory, setGuideCategory] = useState<string>("");
  const [guideRole, setGuideRole] = useState<string>("member");

  const setLang = (l: Lang) => {
    localStorage.setItem("sn_lang", l);
    setLangState(l);
  };
  const ctx: LangCtx = { lang, setLang, t: (key: CatalogKey) => tr(lang, key) };

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (ready) return;
    loadCore()
      .then(() => { setReady(true); warmHeavy(); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [ready]);
  useEffect(() => {
    const iv = setInterval(() => force(x => x + 1), 1200);
    return () => clearInterval(iv);
  }, []);
  // Bug A fix: when a topic is open but no area was picked, derive the area
  // from the topic's category so the Role/Situation lists are never hidden.
  useEffect(() => {
    if (view.name !== "desk" || !view.slug) return;
    if (guideCategory) return;
    const tp = store.topics[view.slug] ?? store.topicsIndex?.topics.find(x => x.slug === view.slug);
    const cat = tp?.category ?? store.topicsIndex?.topics.find(x => x.slug === view.slug)?.category;
    if (cat) setGuideCategory(cat);
  }, [view, guideCategory]);
  usePaletteShortcut(setPaletteOpen);

  const t = (key: CatalogKey) => tr(lang, key);

  let pane: React.ReactNode;
  if (error) {
    pane = (
      <div className="sn-empty">
        <p>{t("failedLoad")}<br />{error}</p>
        <button className="sn-lang-btn" onClick={() => { setError(null); location.reload(); }}>{t("retry")}</button>
      </div>
    );
  } else if (!ready) {
    pane = <div className="sn-empty">{t("loadingJudgements")}</div>;
  } else {
    switch (view.name) {
      case "desk":
        pane = view.slug
          ? <TopicPane slug={view.slug} lang={lang} />
          : <WelcomeDoc ctx={ctx} />;
        break;
      case "browse": pane = <BrowseView ctx={ctx} />; break;
      case "judgements": pane = <JudgementsView ctx={ctx} qstr={view.qstr} />; break;
      case "j": pane = <JudgementDoc ctx={ctx} id={view.id} />; break;
      case "timeline": pane = <TimelineDoc ctx={ctx} />; break;
      case "reference": pane = <ReferenceDoc ctx={ctx} anchor={view.anchor} />; break;
      case "about": pane = <AboutDoc ctx={ctx} />; break;
    }
  }

  const deskTopic = view.name === "desk" ? view.slug : null;
  const deskRole = view.name === "desk" ? view.role : guideRole;

  return (
    <LangContext.Provider value={ctx}>
      <Theme theme={stoneTheme} mode="light">
        {pillOpen && (
          <div className="sn-pill">
            <X size={14} style={{ transform: "rotate(45deg)" }} />
            <span>{t("banner")}</span>
            <button onClick={() => setPillOpen(false)} aria-label="dismiss">✕</button>
          </div>
        )}
        <header className="sn-topbar">
          <a href="#/" className="sn-brand">
            <span className="sn-brand-mark"><Scale size={17} /></span>
            <span className="sn-brand-word">
              <b>{catalog.appName[lang].split(" · ")[0]}</b>
              <span>{catalog.appName[lang]}</span>
            </span>
          </a>
          <button className="sn-kbd-trigger" onClick={() => setPaletteOpen(true)}>
            <Search size={14} />
            {lang === "mr" ? "शोधा…" : "Search the app…"}
            <kbd>Ctrl K</kbd>
          </button>
          <button className="sn-lang-btn" onClick={() => setLang(lang === "mr" ? "en" : "mr")}>
            {t("switchLang")}
          </button>
        </header>

        <div className="sn-desk">
          <Rail
            ctx={ctx}
            slug={deskTopic}
            role={deskRole}
            category={guideCategory}
            onCategory={c => { setGuideCategory(c); if (deskTopic) location.hash = "#/"; }}
            onRole={r => {
              setGuideRole(r);
              if (deskTopic) location.hash = `#/t/${deskTopic}?role=${r}`;
            }}
            onNavigate={() => {}}
          />
          <main className="sn-pane">{pane}</main>
        </div>

        {paletteOpen && <Palette lang={lang} onClose={() => setPaletteOpen(false)} />}
      </Theme>
    </LangContext.Provider>
  );
}

function TopicPane({ slug, lang }: { slug: string; lang: Lang }) {
  const [topic, setTopic] = useState<Topic | null>(store.topics[slug] ?? null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    setTopic(store.topics[slug] ?? null);
    setMissing(false);
    loadTopic(slug).then(tp => { if (alive) setTopic(tp); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [slug]);
  const t = (key: CatalogKey) => tr(lang, key);
  const paneCtx: LangCtx = { lang, setLang: () => {}, t };
  if (missing) return <div className="sn-empty">{t("judgNotFound")}</div>;
  if (!topic) return <div className="sn-empty">{t("loading")}</div>;
  return <TopicDoc ctx={paneCtx} topic={topic} />;
}
