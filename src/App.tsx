import { useEffect, useState } from "react";
import { Scale, Search, X } from "lucide-react";
import { LangContext, initLangFromStorage, type LangCtx } from "./state/lang";
import { catalog, tr, type CatalogKey, type Lang } from "./i18n/catalogs";
import { loadCore, warmHeavy, store } from "./data/loader";
import { Palette } from "./components/Palette";
import { Rail, WelcomeDoc, TopicPane } from "./views/Desk";
import { TimelineDoc, ReferenceDoc, AboutDoc } from "./views/Docs";
import { JudgementsView, JudgementDoc } from "./views/Judgements";
import { BrowseView } from "./views/Browse";

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          ? <TopicPane ctx={ctx} slug={view.slug} />
          : <WelcomeDoc />;
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
            slug={deskTopic}
            role={deskRole}
            category={guideCategory}
            onCategory={c => { setGuideCategory(c); if (deskTopic) location.hash = "#/"; }}
            onRole={r => {
              setGuideRole(r);
              if (deskTopic) location.hash = `#/t/${deskTopic}?role=${r}`;
            }}
          />
          <main className="sn-pane">{pane}</main>
        </div>

        {paletteOpen && <Palette onClose={() => setPaletteOpen(false)} />}
    </LangContext.Provider>
  );
}

