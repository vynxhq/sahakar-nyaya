import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useLang } from "@/state/lang";
import { catalog } from "@/i18n/catalogs";
import { store, searchIds } from "@/data/loader";

export function Palette({ onClose }: { onClose: () => void }) {
  const { lang } = useLang();
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const query = q.trim().toLowerCase();
  const topics = (store.topicsIndex?.topics ?? []).filter(tp =>
    (lang === "mr" ? tp.title_mr : tp.title_en).toLowerCase().includes(query) || tp.slug.includes(query),
  ).slice(0, 6);
  const sections = (store.sections ?? []).filter(s =>
    s.id.toLowerCase().includes(query) || s.title.toLowerCase().includes(query),
  ).slice(0, 4);
  const ids = query ? searchIds(query) : null;
  const judgements = ids ? (store.lite ?? []).filter(j => ids.has(j.id)).slice(0, 6) : [];

  const open = (href: string) => { location.hash = href; onClose(); };
  const hasAny = topics.length + sections.length + judgements.length > 0;

  return (
    <CommandDialog open onOpenChange={o => { if (!o) onClose(); }}>
      <CommandInput value={q} onValueChange={setQ} placeholder={lang === "mr" ? "विषय, निकाल, कलम शोधा…" : "Search topics, judgements, sections…"} />
      <CommandList>
        <CommandEmpty>{lang === "mr" ? "काही सापडले नाही" : "No matches."}</CommandEmpty>
        {topics.length > 0 && (
          <CommandGroup heading={lang === "mr" ? "मार्गदर्शित विषय" : "Guided topics"}>
            {topics.map(tp => (
              <CommandItem key={tp.slug} onSelect={() => open(`#/t/${tp.slug}`)}>
                <span>{lang === "mr" ? tp.title_mr : tp.title_en}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {sections.length > 0 && (
          <CommandGroup heading={catalog.paletteSections[lang]}>
            {sections.map(s => (
              <CommandItem key={s.id} onSelect={() => open(`#/reference#${s.id}`)}>
                <span>§ {s.id} — {s.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {judgements.length > 0 && (
          <CommandGroup heading={catalog.paletteJudgements[lang]}>
            {judgements.map(j => (
              <CommandItem key={j.id} onSelect={() => open(`#/j/${j.id}`)}>
                <span>{j.date} · {j.benchName}{j.judge ? ` · ${j.judge}` : ""}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!hasAny && query && (
          <CommandGroup heading={catalog.paletteJudgements[lang]}>
            <CommandItem onSelect={() => { open(`#/judgements?q=${encodeURIComponent(query)}`); }} className="text-muted-foreground">
              {lang === "mr" ? "सर्व निकालांमध्ये शोधा" : `Search all judgements for “${query}”`}
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
