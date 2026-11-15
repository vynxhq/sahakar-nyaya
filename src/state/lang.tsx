import { createContext, useContext } from "react";
import type { Lang } from "../i18n/catalogs";
import { tr, type CatalogKey } from "../i18n/catalogs";

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: CatalogKey) => string;
}

export const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: key => catalogFallback(key),
});

function catalogFallback(key: CatalogKey): string {
  return tr("en", key);
}

export function useLang(): LangCtx {
  return useContext(LangContext);
}

export function initLangFromStorage(): Lang {
  return (localStorage.getItem("sn_lang") as Lang) || "en";
}
