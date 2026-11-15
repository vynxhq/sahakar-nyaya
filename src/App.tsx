import { useEffect, useState } from "react";
import { TopNav, Button } from "@astryxdesign/core";
import { stoneTheme } from "./theme/sahakarTheme";
import { Theme } from "@astryxdesign/core/theme";
import { LangContext, initLangFromStorage, type LangCtx } from "./state/lang";
import { catalog, tr, type CatalogKey, type Lang } from "./i18n/catalogs";
import { loadCore, warmHeavy, store } from "./data/loader";
import { viewHome, viewSections, JudgementsView, DetailView, viewTimeline, viewAbout } from "./views";

function parseHash(): { path: string; sub: string; qstr: string; anchor: string } {
  let h = location.hash.replace(/^#\/?/, "");
  const aIdx = h.indexOf("#");
  const anchor = aIdx >= 0 ? h.slice(aIdx + 1) : "";
  if (aIdx >= 0) h = h.slice(0, aIdx);
  const qIdx = h.indexOf("?");
  const qstr = qIdx >= 0 ? h.slice(qIdx + 1) : "";
  const bare = qIdx >= 0 ? h.slice(0, qIdx) : h;
  const path = bare.split("/")[0] || "home";
  const sub = bare.includes("/") ? bare.slice(bare.indexOf("/") + 1) : "";
  return { path, sub, qstr, anchor };
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(initLangFromStorage());
  const [ready, setReady] = useState(store.lite != null);
  const [error, setError] = useState<string | null>(null);
  const [, force] = useState(0);

  const setLang = (l: Lang) => {
    localStorage.setItem("sn_lang", l);
    setLangState(l);
  };
  const ctx: LangCtx = {
    lang,
    setLang,
    t: (key: CatalogKey) => tr(lang, key),
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (ready) return;
    loadCore()
      .then(() => {
        setReady(true);
        warmHeavy();
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [ready]);

  // re-render on background store updates (headnote chunks, timeline, index)
  useEffect(() => {
    const iv = setInterval(() => force(x => x + 1), 1500);
    return () => clearInterval(iv);
  }, []);

  const t = (key: CatalogKey) => tr(lang, key);

  let body: React.ReactNode;
  if (error) {
    body = (
      <div className="sn-empty">
        <p>{t("failedLoad")}<br />{error}</p>
        <Button label={t("retry")} variant="primary" onClick={() => { setError(null); location.reload(); }} />
      </div>
    );
  } else if (!ready) {
    body = <div className="sn-empty">{t("loadingJudgements")}</div>;
  } else {
    const { path, sub, qstr, anchor } = route;
    switch (path) {
      case "home": body = viewHome(ctx); break;
      case "sections": body = viewSections(ctx, anchor); break;
      case "judgements": body = <JudgementsView ctx={ctx} qstr={qstr} />; break;
      case "j": body = <DetailView ctx={ctx} id={decodeURIComponent(sub)} />; break;
      case "timeline": body = viewTimeline(ctx); break;
      case "about": body = viewAbout(ctx); break;
      default: body = <div className="sn-empty">{t("notFound")}</div>;
    }
  }

  const navItem = (href: string, key: CatalogKey, active: string) => (
    <a href={href} style={{ color: "#fff", textDecoration: "none", padding: "6px 10px", borderRadius: 8, fontSize: "0.9rem", background: route.path === active ? "rgba(255,255,255,.16)" : undefined }}>
      {t(key)}
    </a>
  );

  return (
    <LangContext.Provider value={ctx}>
      <Theme theme={stoneTheme} mode={lang === "mr" ? "light" : "light"}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-background-body)" }}>
          <TopNav
            heading={<a href="#/" style={{ color: "#fff", textDecoration: "none", display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{catalog.appName[lang].split(" · ")[0]}</span>
              <span style={{ fontSize: "0.72rem", opacity: 0.85 }}>{catalog.appName[lang]}</span>
            </a>}
            startContent={undefined}
            endContent={
              <Button label={t("switchLang")} variant="secondary" size="sm"
                onClick={() => setLang(lang === "mr" ? "en" : "mr")} />
            }
          >
            <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
              {navItem("#/", "home", "home")}
              {navItem("#/sections", "sections", "sections")}
              {navItem("#/judgements", "judgements", "judgements")}
              {navItem("#/timeline", "timeline", "timeline")}
              {navItem("#/about", "about", "about")}
            </nav>
          </TopNav>
          <div className="sn-banner">⚠ {t("banner")}</div>
          <main style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 16px 48px", width: "100%", flex: 1 }}>
            {body}
          </main>
          <footer className="sn-footer"><p style={{ margin: 0 }}>{t("footer")}</p></footer>
        </div>
      </Theme>
    </LangContext.Provider>
  );
}

// keep warmHeavy referenced for tree-shaking clarity
void warmHeavy;
void store;
