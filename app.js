/* Sahakar Nyaya — MVP app logic (vanilla JS, hash router) */
"use strict";

const state = {
  lang: localStorage.getItem("sn_lang") || "en",
  judgements: null, index: null, sections: null, misroutes: null, timeline: null,
  page: 0, pageSize: 12,
  filters: { q: "", bench: "", section: "", redev: "", year: "" },
};

const $view = document.getElementById("view");
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const t = (en, mr) => state.lang === "mr" ? mr : en;

/* ---------- language ---------- */
function applyLang() {
  document.body.classList.toggle("lang-mr", state.lang === "mr");
  document.getElementById("langToggle").textContent = state.lang === "mr" ? "English" : "मराठी";
  document.documentElement.lang = state.lang === "mr" ? "mr" : "en";
  document.querySelectorAll("[data-en]").forEach(el => {
    el.textContent = state.lang === "mr" ? el.dataset.mr : el.dataset.en;
  });
}
document.getElementById("langToggle").addEventListener("click", () => {
  state.lang = state.lang === "mr" ? "en" : "mr";
  localStorage.setItem("sn_lang", state.lang);
  applyLang(); route();
});

/* ---------- data load ---------- */
const DOCS = []; // id -> doc id lookup for the compact search index

async function fetchJSON(url, tries = 3, timeoutMs = 25000) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url + "?t=" + Date.now(), { signal: ctrl.signal });
      if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
      return await r.json();
    } catch (err) {
      if (attempt === tries) throw new Error(url + " (" + (err.name === "AbortError" ? "timeout" : err.message) + ")");
      await new Promise(res => setTimeout(res, 1200 * attempt)); // back-off, then retry
    } finally {
      clearTimeout(timer);
    }
  }
}

async function ensureData() {
  if (state.judgements) return;
  const setProgress = msg => {
    const el = document.getElementById("loadmsg");
    if (el) el.textContent = state.lang === "mr" ? LOADING_MR[msg] || msg : msg;
  };
  // Phase 1: everything the first paint needs (small + one medium file)
  setProgress("judgements");
  [state.judgements, state.sections, state.misroutes] = await Promise.all([
    fetchJSON("data/judgements.json"),
    fetchJSON("data/sections.json"),
    fetchJSON("data/misroutes.json"),
  ]);
  state.judgements.forEach(j => DOCS.push(j.id));

  // Phase 2 (background, non-blocking): the heavy search index + timeline
  state.searchIndexReady = fetchJSON("data/search-index.json")
    .then(idx => { state.index = idx; })
    .catch(() => { state.indexFailed = true; });
  fetchJSON("data/gr-timeline.json").then(tl => { state.timeline = tl; }).catch(() => {});
}
const LOADING_MR = { "judgements": "निकाल लोड होत आहे…", "search": "शोध-निर्देशिका लोड होत आहे…" };

async function ensureSearchIndex() {
  if (state.index || state.indexFailed) return;
  if (state.searchIndexReady) await state.searchIndexReady;
  else await new Promise(r => setTimeout(r, 300)); // phase-2 not started yet — yield and retry
}

/* ---------- search ---------- */
function searchIds(q) {
  q = (q || "").trim().toLowerCase();
  if (!q || !state.index) return null;
  const toks = q.split(/\s+/).map(x => x.replace(/[^\w\u0900-\u097F]/g, "")).filter(x => x.length > 1);
  if (!toks.length) return null;
  const sets = toks.map(tok => {
    const ids = new Set();
    for (const key in state.index) {
      if (key.startsWith(tok) || tok.startsWith(key))
        for (const i of state.index[key]) ids.add(DOCS[i]);
    }
    return ids;
  });
  let out = sets[0];
  for (let i = 1; i < sets.length; i++) {
    const inter = new Set([...out].filter(x => sets[i].has(x)));
    if (inter.size) out = inter; else out = new Set([...out, ...sets[i]]);
  }
  return out;
}
function checkMisroute(q) {
  q = (q || "").toUpperCase().replace(/\s+/g, " ").trim();
  if (!q) return null;
  for (const m of state.misroutes) {
    if (q.includes(m.wrong.toUpperCase())) return m;
  }
  return null;
}
function filtered() {
  const ids = searchIds(state.filters.q);
  return state.judgements.filter(j => {
    if (ids && !ids.has(j.id)) return false;
    if (state.filters.bench && j.bench !== state.filters.bench) return false;
    if (state.filters.section && !j.sections.includes(state.filters.section)) return false;
    if (state.filters.redev && String(j.isRedevelopment) !== state.filters.redev) return false;
    if (state.filters.year && j.year !== state.filters.year) return false;
    return true;
  });
}

/* ---------- cards ---------- */
function jcard(j) {
  return `<div class="jcard">
    <div class="meta"><span>📅 ${esc(j.date)}</span><span>🏛 ${esc(j.benchName)}</span><span>👨‍⚖️ ${esc(j.judge)}</span><span>${t("CNR","सीएनआर")}: ${esc(j.cnr)}</span></div>
    <h3><a href="#/j/${encodeURIComponent(j.id)}">${esc(j.title || ("CNR " + j.cnr))}</a></h3>
    <div class="hn"><span class="hnlabel">EN</span> ${esc(j.headnoteEn)}</div>
    <div class="hn hn-mr"><span class="hnlabel">मरा</span> ${esc(j.headnoteMr)}</div>
    <div class="tagrow">
      ${j.sections.map(s => `<a class="tag sec" href="#/judgements?section=${encodeURIComponent(s)}">§ ${esc(s)}</a>`).join("")}
      ${j.isRedevelopment ? `<span class="tag redev">${t("REDEVELOPMENT","पुनर्विकास")}</span>` : ""}
      ${j.needsReview ? `<span class="tag nr" title="${t("Excerpt truncated or outcome unclear — flagged for human review","उतारा अपूर्ण किंवा निकाल अस्पष्ट — मानवी तपासणीसाठी चिन्हांकित")}">${t("needs review","तपासणी उर्वरित")}</span>` : ""}
    </div>
  </div>`;
}
function misrouteCard(m) {
  if (!m) return "";
  return `<div class="misroute-card"><b>${t("Common mis-citation:","वारंवार चुकीचा संदर्भ:")}</b> “${esc(m.wrong)}” → <span class="fix">${t("see","पहा")} ${esc(m.correct)}</span><br>${esc(m.note)}</div>`;
}
function stats() {
  const j = state.judgements;
  const years = j.map(x => +x.year).filter(y => y);
  return `<div class="stats">
    <div class="stat"><b>${j.length}</b><span>${t("judgements with bilingual headnotes","द्विभाषिक सारांशांसह निकाल")}</span></div>
    <div class="stat"><b>${j.filter(x => x.isRedevelopment).length}</b><span>${t("redevelopment disputes","पुनर्विकास वाद")}</span></div>
    <div class="stat"><b>${new Set(j.map(x => x.bench)).size}</b><span>${t("Bombay HC benches","बॉम्बे उच्च न्यायालय खंडपीठे")}</span></div>
    <div class="stat"><b>${Math.min(...years)}–${Math.max(...years)}</b><span>${t("decision years","निर्णय वर्षे")}</span></div>
    <div class="stat"><b>${j.filter(x => x.needsReview).length}</b><span>${t("flagged for human review","मानवी तपासणीस चिन्हांकित")}</span></div>
  </div>`;
}

/* ---------- views ---------- */
function viewHome() {
  const top5 = state.sections.sections.filter(s => state.sections.top5.includes(s.id));
  $view.innerHTML = `
    <div class="hero">
      <h1>${t("Instant judgements, section by section.","कलमानुसार, क्षणिक निकाल.")}<span class="mr">${t("Bombay High Court on the Maharashtra Co-operative Societies Act — for housing society members and committees.","महाराष्ट्र सहकारी समाज कायद्यावरील बॉम्बे उच्च न्यायालयाचे निकाल — गृहनिर्माण संस्थांच्या सभासदांसाठी व समितींसाठी.")}</span></h1>
      <p>${t("Two members disagree about the same section? Search it — read what the High Court actually decided, in English and Marathi.","दोन सभासदांची एकाच कलमावर मते वेगळी? कलम शोधा — उच्च न्यायालयाने खरोखर काय ठरवले, इंग्रजी व मराठीत वाचा.")}</p>
      <div class="searchbox">
        <input id="q" placeholder="${t("Search a section, topic, or word… (try: 73-CA, 154B-29, पुनर्विकास)","कलम, विषय किंवा शब्द शोधा… (पहा: ७३-सीए, १५४ब-२९, पुनर्विकास)")}" />
        <button id="go">${t("Search","शोधा")}</button>
      </div>
    </div>
    ${stats()}
    <h2 class="viewtitle">${t("Start with the redevelopment essentials","पुनर्विकासाच्या आवश्यक कलमांपासून सुरुवात करा")}<span class="mr">${t("The five sections that decide most CHS disputes","बहुतांश संस्था-वादांचा निर्णय करणारी पाच कलमे")}</span></h2>
    <div class="section-cards">
      ${top5.map(s => `<a class="scard" href="#/sections#${s.id}">
        <h3>${esc(s.title)}</h3>
        <p>${esc((state.lang === "mr" ? s.summaryMr : s.summary).slice(0, 130))}…</p>
      </a>`).join("")}
    </div>`;
  const go = () => {
    state.filters = { q: document.getElementById("q").value, bench: "", section: "", redev: "", year: "" };
    location.hash = "#/judgements";
  };
  document.getElementById("go").addEventListener("click", go);
  document.getElementById("q").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
}

function viewSections(anchor) {
  const all = state.sections.sections;
  const one = all.find(s => s.id === anchor);
  $view.innerHTML = `
    <h2 class="viewtitle">${t("The verified section guide","प्रमाणित कलम-मार्गदर्शक")}<span class="mr">${t("What each section actually does — and the citations people get wrong","प्रत्येक कलम खरोखर काय करते — व लोक चुकीचे संदर्भ कोणते देतात")}</span></h2>
    ${one ? sdetail(one) : `
      <p style="font-size:.9rem;color:var(--muted)">${t("Tip: try a common (wrong) citation like","टीप: एखादा चुकीचा संदर्भ शोधून पहा, उदा.")} <b>73-CA</b>, <b>Rule 58-A</b>, <b>101</b> ${t("— in the Judgements tab.","— निकाल-टॅबमध्ये.")}</p>
      ${misrouteDefault()}
      <div class="slist">${all.map(ssummary).join("")}</div>`}`;
  bindChips();
}
function misrouteDefault() {
  return `<div class="misroute-card">${state.misroutes.slice(0, 3).map(m =>
    `<div style="margin-bottom:6px"><b>“${esc(m.wrong)}”</b> → <span class="fix">${esc(m.correct)}</span> — ${esc(m.note)}</div>`).join("")}</div>`;
}
function ssummary(s) {
  const txt = state.lang === "mr" ? s.summaryMr : s.summary;
  return `<div class="sdetail"><h3><a href="#/sections#${s.id}" style="text-decoration:none">${esc(s.title)}</a></h3>
    <p class="mr-title">${esc(s.titleMr)}</p><p style="font-size:.9rem">${esc(txt.slice(0, 200))}…</p></div>`;
}
function sdetail(s) {
  const ask = s.ask || {};
  const disp = state.lang === "mr" ? (s.disputesMr || s.disputes) : s.disputes;
  return `<div class="sdetail">
    <h3>${esc(s.title)}</h3><p class="mr-title">${esc(s.titleMr)}</p>
    <p style="font-size:.92rem">${esc(state.lang === "mr" ? s.summaryMr : s.summary)}</p>
    <h4>${t("Typical disputes","ठराविक वाद")}</h4>
    <ul>${disp.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
    <h4>${t("Who asks what","कोण काय विचारते")}</h4>
    <div class="askgrid">
      ${ask.memberPro ? `<div><span class="who">${t("Member (pro-redevelopment):","सभासद (पुनर्विकास-समर्थक):")}</span> ${esc(ask.memberPro)}</div>` : ""}
      ${ask.memberAnti ? `<div><span class="who">${t("Member (opposing):","सभासद (विरोधक):")}</span> ${esc(ask.memberAnti)}</div>` : ""}
      ${ask.committee ? `<div><span class="who">${t("Managing committee:","व्यवस्थापन समिती:")}</span> ${esc(ask.committee)}</div>` : ""}
    </div>
    ${s.landmarks && s.landmarks.length ? `<h4>${t("Landmark decisions","महत्त्वाचे निर्णय")}</h4><ul>${s.landmarks.map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
    <h4>${t("Search these judgements","या कलमाचे निकाल शोधा")}</h4>
    <div class="chips">
      <span class="chip" data-q="${esc(s.id)}">§ ${esc(s.id)}</span>
      ${(s.keywordsEn || []).map(k => `<span class="chip" data-q="${esc(k)}">${esc(k)}</span>`).join("")}
      ${(s.keywordsMr || []).map(k => `<span class="chip" data-q="${esc(k)}">${esc(k)}</span>`).join("")}
    </div>
    <p style="margin-top:14px"><a href="#/sections">← ${t("all sections","सर्व कलमे")}</a></p>
  </div>`;
}
function bindChips() {
  $view.querySelectorAll(".chip[data-q]").forEach(c => c.addEventListener("click", () => {
    state.filters = { q: c.dataset.q, bench: "", section: "", redev: "", year: "" };
    location.hash = "#/judgements";
  }));
}

/* ---------- judgements list ---------- */
function viewJudgements(qstr) {
  const params = new URLSearchParams(qstr || "");
  if (params.get("section")) state.filters.section = params.get("section");
  if (params.has("q")) state.filters.q = params.get("q");
  renderList(true);
}
function renderList(full) {
  // The heavy search index loads in the background; if a query arrives first, wait for it.
  if (state.filters.q.trim() && !state.index && !state.indexFailed) {
    document.getElementById("results").innerHTML = `<div class="empty">${t("Loading search index…","शोध-निर्देशिका लोड होत आहे…")}</div>`;
    setTimeout(() => ensureSearchIndex().then(() => renderList(false)), 300);
    return;
  }
  const mr = checkMisroute(state.filters.q);
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / state.pageSize));
  if (state.page >= pages) state.page = 0;
  const slice = list.slice(state.page * state.pageSize, (state.page + 1) * state.pageSize);
  const years = [...new Set(state.judgements.map(j => j.year))].sort().reverse();
  const resultsHTML = `
    ${misrouteCard(mr)}
    ${slice.length ? slice.map(jcard).join("") : `<div class="empty">${t("No judgements match these filters.","या चाळांशी जुळणारे निकाल नाहीत.")}</div>`}
    ${pages > 1 ? `<div class="pager"><button id="prev" ${state.page===0?"disabled":""}>←</button>
      <span style="align-self:center;font-size:.85rem;color:var(--muted)">${state.page+1} / ${pages} · ${list.length} ${t("results","निकाल")}</span>
      <button id="next" ${state.page>=pages-1?"disabled":""}>→</button></div>` : ""}`;
  if (!full) {
    document.getElementById("results").innerHTML = resultsHTML;
    bindPager();
    return;
  }
  $view.innerHTML = `
    <h2 class="viewtitle">${t("Judgements","निकाल")}<span class="mr">${t("Search and filter the enriched corpus","समृद्ध संग्रह शोधा व चाळा")}</span></h2>
    <div class="filters">
      <input id="fq" value="${esc(state.filters.q)}" placeholder="${t("Search headnotes (EN/MR), sections, judges…","सारांश (इं/मरा), कलमे, न्यायाधीश शोधा…")}" />
      <select id="fbench"><option value="">${t("All benches","सर्व खंडपीठे")}</option>
        ${[...new Set(state.judgements.map(j => j.bench))].map(b =>
          `<option value="${b}" ${state.filters.bench===b?"selected":""}>${esc(state.judgements.find(x=>x.bench===b).benchName)}</option>`).join("")}
      </select>
      <select id="fsec"><option value="">${t("All sections","सर्व कलमे")}</option>
        ${state.sections.sections.map(s => `<option value="${s.id}" ${state.filters.section===s.id?"selected":""}>${esc(s.id)}</option>`).join("")}
      </select>
      <select id="fredev"><option value="">${t("All matters","सर्व प्रकरणे")}</option>
        <option value="true" ${state.filters.redev==="true"?"selected":""}>${t("Redevelopment only","फक्त पुनर्विकास")}</option>
        <option value="false" ${state.filters.redev==="false"?"selected":""}>${t("Other matters","इतर प्रकरणे")}</option>
      </select>
      <select id="fyear"><option value="">${t("All years","सर्व वर्षे")}</option>
        ${years.map(y => `<option ${state.filters.year===y?"selected":""}>${y}</option>`).join("")}
      </select>
    </div>
    <div id="results">${resultsHTML}</div>`;
  ["fq","fbench","fsec","fredev","fyear"].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener(id === "fq" ? "input" : "change", () => {
      state.filters = { q: document.getElementById("fq").value,
        bench: document.getElementById("fbench").value,
        section: document.getElementById("fsec").value,
        redev: document.getElementById("fredev").value,
        year: document.getElementById("fyear").value };
      state.page = 0;
      if (id === "fq") renderList(false);
      else renderList(false);
    });
  });
  bindPager();
}
function bindPager() {
  const prev = document.getElementById("prev"), next = document.getElementById("next");
  if (prev) prev.addEventListener("click", () => { state.page--; renderList(false); window.scrollTo(0, 0); });
  if (next) next.addEventListener("click", () => { state.page++; renderList(false); window.scrollTo(0, 0); });
}

/* ---------- detail ---------- */
function viewDetail(id) {
  const j = state.judgements.find(x => x.id === id);
  if (!j) { $view.innerHTML = `<div class="empty">${t("Judgement not found.","निकाल सापडला नाही.")}</div>`; return; }
  const oldMap = Object.entries(j.oldMap || {});
  $view.innerHTML = `
    <div class="dhead">
      <h2>${esc(j.title || ("CNR " + j.cnr))}</h2>
      <div class="meta">
        <span>📅 ${esc(j.date)}</span><span>🏛 ${esc(j.benchName)}</span>
        <span>👨‍⚖️ ${esc(j.judge)}</span><span>${t("CNR","सीएनआर")}: ${esc(j.cnr)}</span>
        <span>${t("Outcome","निकाल")}: ${esc(j.disposition)}</span>
        ${j.courtDisposal ? `<span>${t("Registry","नोंदणी")}: ${esc(j.courtDisposal)}</span>` : ""}
      </div>
      <div class="actions">
        <a href="${esc(j.pdf)}" target="_blank" rel="noopener">📄 ${t("Open full judgement (PDF)","संपूर्ण निकाल उघडा (PDF)")}</a>
        <a class="gold" href="#/judgements">← ${t("back to results","निकालांकडे")}</a>
      </div>
    </div>
    <div class="dblock">
      <h4>${t("Plain-language headnote (English + मराठी)","सोप्या भाषेतील सारांश (English + मराठी)")}</h4>
      <span class="ai-label">⚠ ${t("AI-assisted, under legal review","ॲI-सहाय्यित, कायदेशीर तपासणीत")}${j.needsReview ? " · " + t("needs review","तपासणी उर्वरित") : ""}</span>
      <p style="margin:8px 0 4px;font-weight:600;font-size:.8rem;color:var(--muted)">English</p>
      <div class="hn"><p>${esc(j.headnoteEn)}</p></div>
      <p style="margin:10px 0 4px;font-weight:600;font-size:.8rem;color:var(--muted)">मराठी</p>
      <div class="hn"><p>${esc(j.headnoteMr)}</p></div>
    </div>
    ${(j.sections.length || oldMap.length) ? `<div class="dblock">
      <h4>${t("Sections","कलमे")}</h4>
      <div class="tagrow">${j.sections.map(s => `<a class="tag sec" href="#/judgements?section=${encodeURIComponent(s)}">§ ${esc(s)}</a>`).join("")}</div>
      ${oldMap.length ? `<div class="oldmap" style="margin-top:10px">${t("Old citation mapped to Chapter XIII-B:","जुना संदर्भ → प्रकरण १३-ब:")}<br>
        ${oldMap.map(([o, n]) => `<code>§ ${esc(o)}</code><span class="arrow">→</span><code>§ ${esc(n)}</code>`).join("<br>")}</div>` : ""}
    </div>` : ""}
    ${(j.parties || []).length ? `<div class="dblock">
      <h4>${t("Parties / roles","पक्षकार / भूमिका")}</h4>
      <div class="tagrow">${j.parties.map(p => `<span class="tag">${esc(p)}</span>`).join("")}</div>
    </div>` : ""}
    <div class="dblock">
      <h4>${t("Read the original","मूळ निकाल वाचा")}</h4>
      <iframe class="pdfbox" src="${esc(j.pdf)}" title="judgement PDF"></iframe>
      <div class="actions" style="margin-top:10px">
        <a href="${esc(j.pdf)}" download="${esc(j.file)}">⬇ ${t("Download PDF","PDF डाउनलोड")}</a>
        ${j.s3 ? `<a href="${esc(j.s3)}" target="_blank" rel="noopener">${t("Source dataset record","मूळ माहितीसंच नोंद")}</a>` : ""}
      </div>
    </div>`;
}

/* ---------- timeline ---------- */
function viewTimeline() {
  if (!state.timeline) {
    $view.innerHTML = `<div class="loading">${t("Loading…","लोड होत आहे…")}</div>`;
    ensureData().then(() => fetchJSON("data/gr-timeline.json")).then(tl => { state.timeline = tl; viewTimeline(); }).catch(e => {
      $view.innerHTML = `<div class="empty">${t("Failed to load timeline:","टाइमलाइन लोड अयशस्वी:")} ${esc(e.message)}</div>`;
    });
    return;
  }
  $view.innerHTML = `
    <h2 class="viewtitle">${t("Redevelopment law timeline — 1991 → today","पुनर्विकास विधी — १९९१ → आज")}<span class="mr">${t("Every instrument your society's redevelopment runs on, with official documents","संस्थेच्या पुनर्विकासाची प्रत्येक वैधानिक साधन, अधिकृत दस्तऐवजांसह")}</span></h2>
    <div class="tl">
      ${state.timeline.items.map(it => `<div class="tl-item">
        <div class="tl-date">${esc(it.date)}</div>
        <h3>${esc(it.title)}</h3>
        <div class="en"><p>${esc(it.desc)}</p></div>
        <div class="mr"><p>${esc(it.descMr)}</p></div>
        ${it.doc ? `<a href="${esc(it.doc)}" target="_blank" rel="noopener">📄 ${t("official document (PDF)","अधिकृत दस्तऐवज (PDF)")}</a>` : ""}
      </div>`).join("")}
    </div>
    <div class="about-block" style="margin-top:16px"><small>${esc(state.timeline.sourcePackNote)}</small><br><small>${esc(state.timeline.sourcePackNoteMr)}</small></div>`;
}

/* ---------- about ---------- */
function viewAbout() {
  $view.innerHTML = `
    <h2 class="viewtitle">${t("About this prototype","या प्रारूपाविषयी")}</h2>
    <div class="about-block">
      <h3 style="margin-top:0">${t("The idea","कल्पना")}</h3>
      ${t("When two members — or a member and the managing committee — read the same section of the Maharashtra Co-operative Societies Act two different ways, this app shows what the Bombay High Court actually decided on that section. It starts with CHS redevelopment, where the stakes and the confusion are highest.",
      "एकाच कलमावर दोन सभासदांची — किंवा सभासद व व्यवस्थापन समितीची — वेगळी मते असतील, तेव्हा हे साधन त्या कलमावर बॉम्बे उच्च न्यायालयाने खरोखर काय ठरवले ते दाखवते. सुरुवात गृहनिर्माण संस्थांच्या पुनर्विकासापासून, जिथे दांडीग व गोंधळ सर्वाधिक.")}
    </div>
    <div class="about-block">
      <h3 style="margin-top:0">${t("Where the data comes from","माहितीचा स्रोत")}</h3>
      <ul>
        <li>${t("Judgements: public-domain court records from the open","निकाल: सार्वजनिक न्यायालयीन अभिलेख —")} <i>Indian High Court Judgments</i> ${t("dataset (CC-BY-4.0, Dattam Labs on the AWS Registry of Open Data), 25 High Courts, quarterly updates.","माहितीसंच (CC-BY-4.0, Dattam Labs / AWS Registry of Open Data), २५ उच्च न्यायालये, त्रैमासिक अद्ययावत.")}</li>
        <li>${t("Statutes, Rules, Bye-laws and GRs: official Maharashtra government portals.","कायदे, नियम, करारनामे व शासन निर्णय: महाराष्ट्र शासनाची अधिकृत संकेतस्थळे.")}</li>
        <li>${t("Section taxonomy: verified against the gazetted Bill/Act texts (including the Sec 154B(2) exclusions).","कलम-वर्गीकरण: राजपत्रित विधेयक/अधिनियम मजकुराशी (१५४ब(२) अनामता-यादीसह) पडताळले.")}</li>
      </ul>
    </div>
    <div class="about-block">
      <h3 style="margin-top:0">${t("The mis-citation corrector","चुकीच्या संदर्भाचे दुरुस्ती-साधन")}</h3>
      ${t("Society disputes are full of citations that don't apply to housing societies. Search any of these and the app corrects the route:","संस्था-वादांत अशा संदर्भांनी भरलेली असतात जी गृहनिर्माण संस्थांना लागूच नाहीत. खालीलपैकी कोणताही शोधा — ॲप योग्य कलमाकडे निर्देशित करेल:")}
      <div class="chips" style="margin-top:8px">
        ${state.misroutes.map(m => `<span class="chip" data-q="${esc(m.wrong)}">${esc(m.wrong)}</span>`).join("")}
      </div>
    </div>
    <div class="about-block">
      <h3 style="margin-top:0">${t("Important limitations","महत्त्वाच्या मर्यादा")}</h3>
      <ul>
        <li>${t("AI-assisted headnotes are under legal review — read the linked PDF before relying on anything.","ॲI-सहाय्यित सारांश कायदेशीर तपासणीत आहेत — काहीही वापरण्यापूर्वी जोडलेला PDF वाचा.")}</li>
        <li>${t("Records flagged 'needs review' have truncated excerpts — the outcome shown may be incomplete.","'तपासणी उर्वरित' चिन्हांकित नोंदींचे उतारे अपूर्ण आहेत — दाखवलेला निकाल अपूर्ण असू शकतो.")}</li>
        <li>${t("This demo covers the enriched Tier-1 corpus (1,359 judgements); the full corpus is 6,430 MCS-citing judgements and growing.","हे प्रारूप समृद्ध टियर-१ संग्रह (१,३५९ निकाल) दाखवते; संपूर्ण संग्रह ६,४३० कलम-संदर्भित निकाल व वाढत आहे.")}</li>
      </ul>
    </div>`;
  bindChips();
}

/* ---------- router ---------- */
function route() {
  let h = location.hash.replace(/^#\/?/, "");
  const aIdx = h.indexOf("#");
  const anchor = aIdx >= 0 ? h.slice(aIdx + 1) : "";
  if (aIdx >= 0) h = h.slice(0, aIdx);
  const qIdx = h.indexOf("?");
  const qstr = qIdx >= 0 ? h.slice(qIdx + 1) : "";
  const bare = qIdx >= 0 ? h.slice(0, qIdx) : h;
  const path = bare.split("/")[0];
  const sub = bare.includes("/") ? bare.slice(bare.indexOf("/") + 1) : "";

  if (!state.judgements) {
    $view.innerHTML = `<div class="loading">${t("Loading…","लोड होत आहे…")} <span id="loadmsg"></span>
      <div style="margin-top:10px"><button onclick="location.reload()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--line);background:var(--card);cursor:pointer">${t("Retry","पुन्हा प्रयत्न")}</button></div></div>`;
  }
  ensureData().then(() => {
    document.querySelectorAll("[data-nav]").forEach(a =>
      a.classList.toggle("active", a.dataset.nav === (path || "home")));
    switch (path) {
      case "": case undefined: viewHome(); break;
      case "sections": viewSections(anchor); break;
      case "judgements": viewJudgements(qstr); break;
      case "j": viewDetail(decodeURIComponent(sub)); break;
      case "timeline": viewTimeline(); break;
      case "about": viewAbout(); break;
      default: $view.innerHTML = `<div class="empty">${t("Page not found.","पान सापडले नाही.")}</div>`;
    }
    window.scrollTo(0, 0);
  }).catch(err => {
    $view.innerHTML = `<div class="empty"><p>${t("Failed to load data:","माहिती लोड अयशस्वी:")}<br>${esc(err.message)}</p>
      <button onclick="location.reload()" style="padding:10px 20px;border-radius:8px;border:none;background:var(--maroon);color:#fff;font-weight:700;cursor:pointer">${t("Retry","पुन्हा प्रयत्न करा")}</button></div>`;
  });
}
window.addEventListener("hashchange", route);
applyLang();
route();
