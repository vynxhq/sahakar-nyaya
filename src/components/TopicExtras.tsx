import { useEffect, useState } from "react";

/** Thin scroll-progress bar fixed under the topbar. Only rendered on topic pages. */
export function ReadingProgress(): React.ReactNode {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-transparent" aria-hidden>
      <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}

/** Per-topic feedback stored locally (no backend yet). */
export function FeedbackWidget({ lang }: { lang: string }) {
  const key = "sn_feedback_" + (location.hash || "/");
  const [given, setGiven] = useState<string | null>(null);
  useEffect(() => { setGiven(localStorage.getItem(key)); }, [key]);

  if (given) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        {lang === "mr"
          ? "प्रतिसादाबद्दल धन्यवाद — तुमची नोंद जतन केली आहे."
          : "Thanks — your note is saved on this device and will shape the next review of this page."}
      </p>
    );
  }
  const send = (v: string) => {
    try { localStorage.setItem(key, v); } catch {}
    setGiven(v);
  };
  const btn = "rounded-full border px-3.5 py-1.5 text-sm transition-colors";
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {lang === "mr" ? "हे उत्तर उपयुक्त होते?" : "Was this answer useful?"}
      </span>
      <button onClick={() => send("helpful")} className={btn + " border-border hover:border-primary hover:text-primary"}>
        {lang === "mr" ? "उपयुक्त" : "Yes, helpful"}
      </button>
      <button onClick={() => send("unclear")} className={btn + " border-border hover:border-primary hover:text-primary"}>
        {lang === "mr" ? "अधिक स्पष्ट हवे" : "Needs clarity"}
      </button>
      <button onClick={() => send("contact")} className={btn + " border-border hover:border-primary hover:text-primary"}>
        {lang === "mr" ? "मला वकिलाशी संपर्क करायचा आहे" : "I need a lawyer"}
      </button>
    </div>
  );
}

/** WhatsApp / native share for a topic. */
export function ShareButton({ title, lang }: { title: string; lang: string }) {
  const onClick = () => {
    const url = location.href;
    const text = (lang === "mr" ? "सहकार न्याय — " : "Sahakar Nyaya — ") + title;
    if (navigator.share) {
      navigator.share({ title: "Sahakar Nyaya", text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    }
  };
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
      {lang === "mr" ? "शेअर करा" : "Share"}
    </button>
  );
}
