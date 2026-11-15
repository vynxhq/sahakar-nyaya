import { useEffect, useState } from "react";
import { loadHeadnotes } from "@/data/loader";

export function useHeadnote(id: string, year: string) {
  const [hn, setHn] = useState<{ headnote_en: string; headnote_mr: string; title: string } | null>(null);
  useEffect(() => {
    if (!id || !year) return;
    let alive = true;
    loadHeadnotes(year).then(chunk => { if (alive) setHn(chunk[id] ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, [id, year]);
  return hn;
}
