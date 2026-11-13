/* Infra Academy — app shell, router, views. No build step, no dependencies. */
(function () {
  "use strict";
  const I = window.INFRA;
  I.lessons = I.lessons || []; I.glossary = I.glossary || []; I.scenarios = I.scenarios || [];
  { // one entry per term ("Fail closed" == "Fail-closed"): keeps the glossary, flashcards and auto-links free of duplicates
    const seenT = new Set();
    I.glossary = I.glossary.filter(g => { const k = String(g.term || "").toLowerCase().replace(/[^a-z0-9֐-׿]/g, ""); if (seenT.has(k)) return false; seenT.add(k); return true; });
  }

  // ---------------- state ----------------
  const KEY = "infra-academy-v1";
  const defaults = { lang: "he", theme: "auto", done: {}, quiz: {}, xp: 0, days: [], cards: {}, notes: {}, scen: {}, daily: {}, last: null, path: null };
  let S;
  try { S = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = Object.assign({}, defaults); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const L = (o) => o == null ? "" : typeof o === "string" ? o : (o[S.lang] != null ? o[S.lang] : (o.en != null ? o.en : ""));
  const t = (k) => L(I.ui[k]);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const today = () => new Date().toISOString().slice(0, 10);
  // quiz/glossary strings: render inline HTML only when they actually contain simple tags
  const rich = (s) => /<\/?(code|strong|em|b|i|br)[\s>\/]/.test(String(s)) ? String(s) : esc(s);
  const strip = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ");

  // ---------------- data prep ----------------
  const trackIndex = Object.fromEntries(I.tracks.map((tr, i) => [tr.id, i]));
  const lessons = I.lessons.slice().sort((a, b) => (trackIndex[a.track] - trackIndex[b.track]) || ((a.order || 99) - (b.order || 99)));
  const byId = Object.fromEntries(lessons.map(l => [l.id, l]));
  const trackLessons = (id) => lessons.filter(l => l.track === id);
  const trackOf = (id) => I.tracks.find(tr => tr.id === id);

  // ---------------- gamification ----------------
  function rankFor(xp) {
    let r = I.ranks[0], next = null;
    for (let i = 0; i < I.ranks.length; i++) { if (xp >= I.ranks[i].xp) { r = I.ranks[i]; next = I.ranks[i + 1] || null; } }
    return { r, next };
  }
  function touchDay() { const d = today(); if (!S.days.includes(d)) { S.days.push(d); S.days = S.days.slice(-400); } }
  function streak() {
    const set = new Set(S.days); let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function addXP(n, msg) {
    const before = rankFor(S.xp).r;
    S.xp = Math.max(0, S.xp + n); touchDay(); save(); renderXP();
    const after = rankFor(S.xp).r;
    if (after !== before && n > 0) { confetti(); toast(`${after.icon} ${L(after.title)}!`); }
    else if (msg) toast(msg);
  }
  function renderXP() {
    const { r } = rankFor(S.xp);
    $("#xpPill").innerHTML = `${r.icon} ${S.xp} XP · 🔥${streak()}`;
    $("#xpPill").title = L(r.title);
  }
  let toastTimer;
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 1800);
  }
  function confetti() {
    const em = ["🎉", "✨", "🚀", "☸️", "🐳", "🛰️"];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("div"); s.className = "confetti";
      s.textContent = em[i % em.length]; s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = Math.random() * .5 + "s"; document.body.appendChild(s);
      setTimeout(() => s.remove(), 2400);
    }
  }
  function copy(text) {
    const done = () => toast(t("copied"));
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {} ta.remove();
  }
  I.helpers = { L, t, esc, addXP, toast, copy, get lang() { return S.lang; } };
  // context handed to js/interview.js
  const ctx = { L, t, esc, addXP, toast, copy, confetti, strip, save: () => save(), get S() { return S; }, get lessons() { return lessons; }, get byId() { return byId; }, trackOf };

  // ---------------- shell ----------------
  function applyLang() {
    document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === "he" ? "rtl" : "ltr";
    $("#langBtn").textContent = S.lang === "he" ? "EN" : "עב";
    $$("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    $("#searchInput").placeholder = t("searchPlaceholder");
    $("#nav").innerHTML = [
      ["#/", "navHome"], ["#/paths", "navPaths"], ["#/learn", "navLearn"], ["#/play", "navPlay"], ["#/oncall", "navOncall"], ["#/interview", "navInterview"], ["#/cs", "navCS"],
      ["#/cards", "navCards"], ["#/glossary", "navGlossary"], ["#/cookbook", "navCookbook"], ["#/ask", "navAsk"]
    ].map(([h, k]) => `<a href="${h}" data-route="${h}">${t(k)}</a>`).join("");
    // phone bottom tab bar: the 4 places you use most + search
    $("#tabbar").innerHTML = [["#/", "🏠", "navHome"], ["#/paths", "🧭", "navPaths"], ["#/learn", "📚", "navLearn"], ["#/interview", "🎯", "navInterview"]]
      .map(([h, ic, k]) => `<a href="${h}" data-route="${h}"><span>${ic}</span>${t(k)}</a>`).join("") +
      `<button type="button" id="tabSearch"><span>🔎</span>${t("navSearch")}</button>`;
    $("#tabSearch").onclick = () => openSearch();
  }
  function applyTheme() {
    if (S.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", S.theme);
    $("#themeBtn").textContent = S.theme === "dark" ? "☀️" : S.theme === "light" ? "🌙" : "🌓";
  }
  $("#langBtn").onclick = () => { S.lang = S.lang === "he" ? "en" : "he"; save(); searchIndex = null; applyLang(); render(); };
  $("#themeBtn").onclick = () => { S.theme = S.theme === "auto" ? "dark" : S.theme === "dark" ? "light" : "auto"; save(); applyTheme(); };

  // ---------------- router ----------------
  let cleanup = null;
  function render() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    const hash = location.hash.replace(/^#\/?/, "");
    const [route, arg] = hash.split("/");
    $$("#nav a, #tabbar a").forEach(a => {
      const r = a.dataset.route.replace("#/", "");
      a.classList.toggle("active", r === route || (r === "learn" && (route === "track" || route === "lesson")) || (r === "" && route === ""));
    });
    readBar(false); hideGloss();
    const app = $("#app");
    const views = { "": home, paths: viewPaths, learn, track: viewTrack, lesson: viewLesson, play, oncall, cards, glossary, cookbook, ask };
    if (route === "cs" && window.CQ && CQ.render) { cleanup = CQ.render(app, hash.split("/").map(decodeURIComponent), ctx) || null; }
    else if (route === "interview" && I.interview) { cleanup = I.interview.render(app, hash.split("/").slice(1).map(decodeURIComponent), ctx) || null; }
    else (views[route] || home)(app, arg ? decodeURIComponent(arg) : undefined);
    if (!location.hash.includes("#sec-")) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);

  // ---------------- code blocks: header (language, wrap, copy) + light highlighting ----------------
  // Content <pre> blocks hold plain escaped text, so we re-tokenize textContent and re-escape every piece.
  const KW = new Set(("const let var function return async await def class import export lambda yield new try catch finally throw " +
    "null undefined None True False true false nil func go defer chan struct interface public private static void fn impl mut pub " +
    "SELECT INSERT UPDATE DELETE FROM WHERE JOIN ON GROUP BY ORDER LIMIT VALUES SET BEGIN COMMIT ROLLBACK CREATE TABLE INDEX " +
    "PRIMARY KEY REFERENCES FOR AND OR NOT NULL UNIQUE ALTER RETURNING").split(" "));
  const TOK = /((?<![:\w"'])\/\/[^\n]*|\/\*[\s\S]*?\*\/|(?<=^|[ \t])#(?![!{\d]|[0-9a-fA-F]{3,8}\b)[^\n]*|(?<=^|[ \t])--(?=[ \t])[^\n]*)|("(?:[^"\\\n]|\\.)*"|(?<![\w])'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/gm;
  function highlight(text) {
    let out = "", last = 0, m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(text))) {
      out += esc(text.slice(last, m.index)); last = TOK.lastIndex;
      if (m[1]) out += `<span class="tk-c">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="tk-s">${esc(m[2])}</span>`;
      else if (m[3]) out += `<span class="tk-n">${esc(m[3])}</span>`;
      else out += KW.has(m[4]) ? `<span class="tk-k">${esc(m[4])}</span>` : esc(m[4]);
    }
    return out + esc(text.slice(last));
  }
  function guessLang(s) {
    if (/^\s*(apiVersion|kind):/m.test(s)) return "yaml";
    if (/\b(SELECT|INSERT INTO|UPDATE \w+ SET|BEGIN;|CREATE TABLE)\b/.test(s)) return "sql";
    if (/^\s*[{\[]\s*"/.test(s)) return "json";
    if (/^\s*(\$ |kubectl |curl |docker |redis-cli|psql |dig |openssl |sudo )/m.test(s)) return "shell";
    if (/^\s*(def |import \w+$|from \w+ import|async def )/m.test(s)) return "python";
    if (/^\s*(func |package )/m.test(s)) return "go";
    if (/\b(const|let|=>|require\(|console\.)/.test(s)) return "js";
    if (/\b(public (static )?(class|void)|@Override|using System)/.test(s)) return "java/c#";
    return "code";
  }
  function applyWrap() { document.body.classList.toggle("wrap-code", !!S.wrapCode); }
  function enhanceCode(root) {
    $$("pre:not([data-enh])", root).forEach(pre => {
      pre.setAttribute("data-enh", "1");
      if (pre.closest(".term, .diagram, .scenario-step, .formula")) return;
      const text = pre.textContent;
      if (!pre.children.length && text.length < 20000) pre.innerHTML = highlight(text);
      const box = document.createElement("div"); box.className = "codebox";
      const head = document.createElement("div"); head.className = "code-head";
      head.innerHTML = `<span class="lang">${esc(guessLang(text))}</span>` +
        `<button type="button" class="wrap" title="Wrap long lines">↩ ${S.lang === "he" ? "גלישה" : "Wrap"}</button>` +
        `<button type="button" class="cp">${t("copy")}</button>`;
      head.querySelector(".cp").onclick = () => copy(text);
      head.querySelector(".wrap").onclick = () => { S.wrapCode = !S.wrapCode; save(); applyWrap(); };
      pre.parentNode.insertBefore(box, pre); box.appendChild(head); box.appendChild(pre);
    });
  }
  applyWrap();
  new MutationObserver(() => enhanceCode($("#app"))).observe($("#app"), { childList: true, subtree: true });

  // ---------------- views ----------------

  // ---------------- learning flow: paths, context, cross-links ----------------
  const PATHS = I.paths || [];
  const pathById = Object.fromEntries(PATHS.map(p => [p.id, p]));
  const lessonIdx = Object.fromEntries(lessons.map((l, i) => [l.id, i]));
  const fmt = (k, a, b) => t(k).replace("{a}", a).replace("{b}", b);
  function pathSteps(p) {
    const out = [];
    (p.stages || []).forEach((st, si) => (st.steps || []).forEach(x => { if (byId[x.lesson]) out.push({ lesson: x.lesson, why: x.why, stage: si }); }));
    return out;
  }
  function pathProgress(p) {
    const steps = pathSteps(p); const done = steps.filter(x => S.done[x.lesson]).length;
    return { steps, done, pct: steps.length ? Math.round(done / steps.length * 100) : 0, next: steps.find(x => !S.done[x.lesson]) || steps[0] || null };
  }
  const backlinks = {};
  lessons.forEach(l => (l.related || []).forEach(r => { if (byId[r] && r !== l.id) (backlinks[r] = backlinks[r] || []).push(l.id); }));
  const chip = (id) => { const l = byId[id]; return l ? `<a class="chip ${S.done[id] ? "done" : ""}" href="#/lesson/${id}">${l.icon || "📄"} ${esc(L(l.title))}${S.done[id] ? " ✓" : ""}</a>` : ""; };

  function pathCard(p) {
    const pr = pathProgress(p); const active = S.path === p.id;
    return `<a class="card path-card ${active ? "active" : ""}" href="#/paths/${p.id}" style="--tc:${p.color || "var(--accent)"}">
      <div class="pc-head"><span class="ticon">${p.icon || "🧭"}</span><h3>${esc(L(p.title))}</h3></div>
      ${active ? `<span class="tag on">★ ${t("yourPath")}</span>` : ""}
      <p>${esc(L(p.blurb))}</p>
      <div class="row"><span class="tag">${pr.steps.length} ${t("pathSteps")}</span><span class="tag">${pr.done}/${pr.steps.length} ✓</span></div>
      <div class="pb-bar"><div style="width:${pr.pct}%"></div></div></a>`;
  }

  function viewPaths(app, id) {
    const p = id && pathById[id];
    if (!p) {
      app.innerHTML = `<h1>🧭 ${t("pathsTitle")}</h1><p class="muted">${t("pathsSub")}</p><div class="grid">${PATHS.map(pathCard).join("")}</div>
        <h2>📚 ${t("navLearn")}</h2><div class="grid">${I.tracks.map(trackCard).join("")}</div>`;
      return;
    }
    const pr = pathProgress(p); const active = S.path === p.id;
    let n = 0;
    const stages = (p.stages || []).map((st, si) => {
      const steps = (st.steps || []).filter(x => byId[x.lesson]);
      const sd = steps.filter(x => S.done[x.lesson]).length;
      return `<section class="stage" id="stage-${si}">
        <div class="stage-head"><h2>${esc(L(st.title))}</h2><span class="tag">${sd}/${steps.length} ✓</span></div>
        <p class="stage-intro">${esc(L(st.intro))}</p>
        <ol class="steps">${steps.map(x => { n++; const l = byId[x.lesson]; const isNext = pr.next && pr.next.lesson === x.lesson && !S.done[x.lesson];
          return `<li class="${S.done[x.lesson] ? "done" : ""} ${isNext ? "next" : ""}"><a href="#/lesson/${l.id}" data-pathstep>
            <span class="num">${S.done[x.lesson] ? "✓" : n}</span>
            <span class="st-text"><b>${l.icon || "📄"} ${esc(L(l.title))}</b><span class="why">${esc(L(x.why))}</span>
            <span class="row" style="gap:6px"><span class="tag">${I.ui.level[S.lang][l.level || 1] || ""}</span><span class="tag">⏱ ${l.minutes || 5} ${t("min")}</span>${isNext ? `<span class="tag on">▶ ${t("nextStep")}</span>` : ""}</span></span></a></li>`; }).join("")}</ol>
      </section>`;
    }).join("");
    const nextL = pr.next && byId[pr.next.lesson];
    app.innerHTML = `
      <div class="crumbs"><a href="#/paths">${t("pathsTitle")}</a></div>
      <div class="card path-hero" style="--tc:${p.color || "var(--accent)"}">
        <div class="pc-head"><span class="ticon big">${p.icon || "🧭"}</span><div><h1 style="margin:0">${esc(L(p.title))}</h1><p style="margin:.2em 0 0">${esc(L(p.blurb))}</p></div></div>
        <p class="muted" style="margin:.8em 0">👤 ${esc(L(p.audience))}</p>
        <div class="row"><span class="tag">${pr.steps.length} ${t("pathSteps")}</span><span class="tag">${(p.stages || []).length} ${S.lang === "he" ? "שלבים מרכזיים" : "stages"}</span><span class="tag">${pr.done}/${pr.steps.length} ✓</span></div>
        <div class="pb-bar" style="margin:10px 0"><div style="width:${pr.pct}%"></div></div>
        <div class="row">
          ${nextL ? `<a class="btn primary" href="#/lesson/${nextL.id}" data-pathstep>${pr.done ? t("continuePath") : t("startPath")}: ${nextL.icon} ${esc(L(nextL.title))}</a>` : ""}
          ${active ? `<span class="tag on">★ ${t("followingPath")}</span><button class="btn small" id="stopPath">${t("stopPath")}</button>` : `<button class="btn small" id="followPath">★ ${t("followPath")}</button>`}
        </div>
        <div class="stage-jump">${(p.stages || []).map((st, si) => `<a href="javascript:void 0" data-stage="${si}" class="chip">${esc(L(st.title))}</a>`).join("")}</div>
      </div>
      ${stages}`;
    $$("[data-pathstep]", app).forEach(a => a.addEventListener("click", () => { S.path = p.id; save(); }));
    $$("[data-stage]", app).forEach(a => a.onclick = () => { const el = $("#stage-" + a.dataset.stage); if (el) el.scrollIntoView({ behavior: "smooth" }); });
    const f = $("#followPath"); if (f) f.onclick = () => { S.path = p.id; save(); toast("★ " + L(p.title)); render(); };
    const sp = $("#stopPath"); if (sp) sp.onclick = () => { S.path = null; save(); render(); };
  }

  // interactive end-to-end flow stepper: actors strip + one hop at a time + full step list
  function mountFlow(box, f) {
    let i = 0, timer = null;
    const steps = f.steps, total = (k) => steps.slice(0, k + 1).reduce((a, x) => a + (x.ms || 0), 0);
    const hasMs = steps.some(x => x.ms);
    const msTxt = (v) => {
      const he = S.lang === "he", u = (en, h) => he ? h : en, r1 = (x) => (Math.round(x * 10) / 10).toString();
      if (v < 1000) return Math.round(v) + " ms";
      if (v < 60e3) return r1(v / 1e3) + " s";
      if (v < 3600e3) return r1(v / 60e3) + u(" min", " דק'");
      if (v < 86400e3) return r1(v / 3600e3) + u(" h", " שע'");
      return r1(v / 86400e3) + u(" days", " ימים");
    };
    box.innerHTML = `<div class="fl-actors">${f.actors.map((a, k) => `<span class="fl-actor" data-a="${k}">${esc(a)}</span>`).join("")}</div>
      <div class="fl-card" aria-live="polite"></div>
      <div class="row fl-ctrl"><button class="btn small" data-fl="prev">‹</button><button class="btn small primary" data-fl="play"></button><button class="btn small" data-fl="next">›</button>
        <span class="spacer"></span><span class="muted small fl-count"></span></div>
      <div class="fl-bar"><div></div></div>
      <details class="fl-all"><summary>${t("flowAll")} (${steps.length})</summary><ol>${steps.map((x, k) =>
        `<li><a href="javascript:void 0" data-go="${k}"><b>${esc(f.actors[x.from])} → ${esc(f.actors[x.to])}</b> · ${esc(L(x.label))}${x.ms ? ` <span class="muted small">+${msTxt(x.ms)}</span>` : ""}</a></li>`).join("")}</ol></details>`;
    const card = $(".fl-card", box), play = $('[data-fl="play"]', box);
    function show() {
      const x = steps[i];
      $$(".fl-actor", box).forEach(el => { const a = +el.dataset.a; el.className = "fl-actor" + (a === x.from ? " from" : "") + (a === x.to ? " to" : ""); });
      const act = $(`.fl-actor[data-a="${x.to}"]`, box); if (act) act.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      card.innerHTML = `<div class="fl-hop"><span class="fl-n">${i + 1}</span><b>${esc(f.actors[x.from])}</b><span class="fl-arrow">→</span><b>${esc(f.actors[x.to])}</b>
          ${x.ms ? `<span class="tag">+${msTxt(x.ms)}</span>` : ""}${hasMs ? `<span class="tag on">⏱ ${t("flowTotal")}: ${msTxt(total(i))}</span>` : ""}</div>
        <h3>${esc(L(x.label))}</h3><div class="fl-detail">${L(x.detail)}</div>
        ${x.fail ? `<div class="fl-fail">💥 <b>${t("flowFail")}:</b> ${L(x.fail)}</div>` : ""}`;
      enhanceCode(card);
      $(".fl-count", box).textContent = fmt("flowStep", i + 1, steps.length);
      $(".fl-bar > div", box).style.width = ((i + 1) / steps.length * 100) + "%";
      $('[data-fl="prev"]', box).disabled = i === 0; $('[data-fl="next"]', box).disabled = i === steps.length - 1;
      play.textContent = timer ? "⏸ " + t("flowPause") : "▶ " + t("flowPlay");
    }
    const stopPlay = () => { if (timer) { clearInterval(timer); timer = null; } };
    $('[data-fl="prev"]', box).onclick = () => { stopPlay(); if (i > 0) { i--; show(); } };
    $('[data-fl="next"]', box).onclick = () => { stopPlay(); if (i < steps.length - 1) { i++; show(); } };
    play.onclick = () => {
      if (timer) { stopPlay(); show(); return; }
      if (i >= steps.length - 1) i = 0;
      timer = setInterval(() => { if (i < steps.length - 1) { i++; show(); } else { stopPlay(); show(); } }, 3200); show();
    };
    $$("[data-go]", box).forEach(a => a.onclick = () => { stopPlay(); i = +a.dataset.go; show(); card.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
    show();
    return stopPlay;
  }

  function pathPos(l) {
    const p = pathById[S.path]; if (!p) return null;
    const steps = pathSteps(p); const i = steps.findIndex(x => x.lesson === l.id);
    return i < 0 ? null : { p, steps, i, prev: steps[i - 1], next: steps[i + 1] };
  }
  function pathBar(l) {
    const pp = pathPos(l); if (!pp) return "";
    const { p, steps, i, prev, next } = pp; const nl = next && byId[next.lesson];
    return `<div class="card pathbar" style="--tc:${p.color || "var(--accent)"}">
      <div class="row" style="gap:8px"><a href="#/paths/${p.id}"><b>${p.icon} ${esc(L(p.title))}</b></a><span class="tag">${fmt("stepOf", i + 1, steps.length)}</span><span class="tag">${esc(L(p.stages[steps[i].stage].title))}</span></div>
      <div class="pb-bar"><div style="width:${Math.round((i + 1) / steps.length * 100)}%"></div></div>
      <div class="why">💡 ${esc(L(steps[i].why))}</div>
      <div class="row">${prev ? `<a class="btn small" href="#/lesson/${prev.lesson}">${t("prevStep")}</a>` : ""}<span class="spacer"></span>
        ${nl ? `<a class="btn small primary" href="#/lesson/${nl.id}">${t("nextStep")}: ${nl.icon} ${esc(L(nl.title))}</a>` : `<span class="tag on">${t("pathDone")}</span>`}</div>
    </div>`;
  }
  function contextBox(l) {
    const tls = trackLessons(l.track); const tr = trackOf(l.track) || { icon: "", title: { en: "", he: "" } };
    const me = lessonIdx[l.id]; const lv = l.level || 1;
    const rel = [...new Set((l.related || []).filter(r => byId[r] && r !== l.id))];
    const before = rel.filter(r => (byId[r].level || 1) < lv || ((byId[r].level || 1) === lv && lessonIdx[r] < me)).slice(0, 5);
    const after = [...new Set([...rel.filter(r => !before.includes(r)), ...(backlinks[l.id] || []).filter(r => !before.includes(r))])].slice(0, 5);
    const inPaths = PATHS.map(p => { const st = pathSteps(p); const i = st.findIndex(x => x.lesson === l.id);
      return i < 0 ? "" : `<a class="chip path" href="#/paths/${p.id}">${p.icon} ${esc(L(p.title))} · ${i + 1}/${st.length}</a>`; }).join("");
    return `<details class="card context" id="ctxBox" ${(S.ctxClosed != null ? S.ctxClosed : window.innerWidth < 700) ? "" : "open"}>
      <summary>🧭 ${t("whereFits")}</summary>
      <div class="ctx-grid">
        <div><div class="ctx-h">${fmt("lessonNofM", tls.indexOf(l) + 1, tls.length)}</div><div class="chips"><a class="chip" href="#/track/${l.track}">${tr.icon} ${esc(L(tr.title))}</a></div>
          ${inPaths ? `<div class="ctx-h">${t("inPaths")}</div><div class="chips">${inPaths}</div>` : ""}</div>
        ${before.length ? `<div><div class="ctx-h">📌 ${t("beforeThis")}</div><div class="chips">${before.map(chip).join("")}</div></div>` : ""}
        ${after.length ? `<div><div class="ctx-h">🚀 ${t("leadsTo")}</div><div class="chips">${after.map(chip).join("")}</div></div>` : ""}
      </div>
      <p class="muted ctx-hint">🔗 ${t("glossLinkHint")}</p></details>`;
  }

  // glossary terms inside lesson text become tappable links (first occurrence of each term)
  let glossRe = null, glossMap = null;
  function buildGloss() {
    glossMap = new Map();
    const clean = (x) => x.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    I.glossary.forEach(g => {
      if (!g.term || !g.lesson || !byId[g.lesson]) return;
      [clean(g.term), ...g.term.split(/\s+\/\s+/).map(clean)].forEach(n => { if (n.length >= 3 && !glossMap.has(n)) glossMap.set(n, g); });
    });
    const keys = [...glossMap.keys()].sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    glossRe = keys.length ? new RegExp("(?<![\\w-])(" + keys.join("|") + ")(?![\\w-])", "g") : null;
  }
  function linkGlossary(root, currentId) {
    if (!root) return; if (!glossMap) buildGloss(); if (!glossRe) return;
    const used = new Set(); let count = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n =>
      n.parentElement.closest("pre, code, a, h1, h2, h3, summary, .codebox, .cmd, .quiz, button, textarea, .chips, .fl-actors, .fl-hop, .fl-all") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (count >= 30) break;
      const text = node.nodeValue; let m, last = 0, frag = null; glossRe.lastIndex = 0;
      while ((m = glossRe.exec(text)) && count < 30) {
        const g = glossMap.get(m[1]); if (!g || g.lesson === currentId || used.has(g.term)) continue;
        used.add(g.term); count++; frag = frag || document.createDocumentFragment();
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const a = document.createElement("a"); a.className = "gl-link"; a.href = "#/lesson/" + g.lesson; a.dataset.term = g.term; a.textContent = m[1];
        frag.appendChild(a); last = m.index + m[1].length;
      }
      if (frag) { frag.appendChild(document.createTextNode(text.slice(last))); node.parentNode.replaceChild(frag, node); }
    }
  }
  function showGloss(a) {
    const g = I.glossary.find(x => x.term === a.dataset.term); const l = g && byId[g.lesson]; if (!l) return;
    const pop = $("#glPop");
    pop.innerHTML = `<button type="button" class="gl-x" aria-label="close">✕</button><b>${esc(g.term)}</b><p>${esc(L(g.def))}</p>
      <a class="btn small primary" href="#/lesson/${l.id}">${t("openLesson")}: ${l.icon || ""} ${esc(L(l.title))}</a>`;
    pop.hidden = false;
    const r = a.getBoundingClientRect(); const W = document.documentElement.clientWidth; const w = Math.min(340, W - 24);
    pop.style.width = w + "px";
    pop.style.left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), W - w - 12) + "px";
    pop.style.top = (window.scrollY + r.bottom + 8) + "px";
    pop.querySelector(".gl-x").onclick = hideGloss;
  }
  function hideGloss() { const p = $("#glPop"); if (p) p.hidden = true; }
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest(".gl-link");
    if (a) { e.preventDefault(); showGloss(a); return; }
    if (!(e.target.closest && e.target.closest(".gl-pop"))) hideGloss();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideGloss(); });

  // reading progress bar on lesson pages
  let readOn = false;
  function readBar(on) { readOn = on; const b = $("#readbar"); if (b) { b.style.width = "0"; b.hidden = !on; } }
  window.addEventListener("scroll", () => {
    if (!readOn) return; const h = document.documentElement; const max = h.scrollHeight - h.clientHeight;
    $("#readbar").style.width = (max > 0 ? Math.min(100, h.scrollTop / max * 100) : 0) + "%";
  }, { passive: true });

  function flowRow() {
    const ap = pathById[S.path]; const pr = ap && pathProgress(ap); const nx = pr && pr.next && byId[pr.next.lesson];
    const last = S.last && byId[S.last];
    if (!nx && !last) return "";
    return `<section class="flow-row">
      ${nx ? `<a class="card flow-card" href="#/lesson/${nx.id}" style="--tc:${ap.color || "var(--accent)"}"><span class="ctx-h">★ ${t("yourPath")} · ${ap.icon} ${esc(L(ap.title))}</span>
        <b>▶ ${nx.icon} ${esc(L(nx.title))}</b><span class="muted">${esc(L(pr.next.why))}</span><div class="pb-bar"><div style="width:${pr.pct}%"></div></div><span class="muted small">${pr.done}/${pr.steps.length} ✓</span></a>` : ""}
      ${last ? `<a class="card flow-card" href="#/lesson/${last.id}"><span class="ctx-h">↩️ ${t("continueWhere")}</span><b>${last.icon} ${esc(L(last.title))}</b><span class="muted">${esc(L(last.tldr))}</span></a>` : ""}
    </section>`;
  }

  function trackCard(tr, i) {
    const ls = trackLessons(tr.id); const d = ls.filter(l => S.done[l.id]).length;
    const pct = ls.length ? Math.round(d / ls.length * 100) : 0;
    return `<a class="card track-card" href="#/track/${tr.id}" style="--tc:${tr.color}">
      <span class="step">${i + 1}</span><span class="ticon">${tr.icon}</span>
      <h3>${esc(L(tr.title))}</h3><p>${esc(L(tr.blurb))}</p>
      <div class="row"><span class="tag">${ls.length} ${t("lessons")}</span><span class="tag">${d}/${ls.length} ✓</span></div>
      <div class="bar"><div style="width:${pct}%"></div></div></a>`;
  }
  function nextLesson() { return lessons.find(l => !S.done[l.id]) || lessons[0]; }

  function seeded(seed) { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }

  function home(app) {
    const { r, next } = rankFor(S.xp);
    const pct = next ? Math.round((S.xp - r.xp) / (next.xp - r.xp) * 100) : 100;
    const doneCount = Object.keys(S.done).filter(k => byId[k]).length;
    const ap = pathById[S.path]; const apn = ap && pathProgress(ap).next;
    const nl = (apn && byId[apn.lesson]) || nextLesson();
    const rnd = seeded(today());
    const dl = lessons.length ? lessons[Math.floor(rnd() * lessons.length)] : null;
    const ql = lessons.filter(l => l.quiz && l.quiz.length);
    const qLesson = ql.length ? ql[Math.floor(rnd() * ql.length)] : null;
    const q = qLesson ? qLesson.quiz[Math.floor(rnd() * qLesson.quiz.length)] : null;
    const g = I.glossary.length ? I.glossary[Math.floor(rnd() * I.glossary.length)] : null;
    app.innerHTML = `
      ${flowRow()}
      <section class="hero">
        <div class="card hero-main">
          <h1>${t("heroTitle")}</h1><p>${t("heroSub")}</p>
          <div class="row">
            ${nl ? `<a class="btn primary" href="#/lesson/${nl.id}">${doneCount ? t("continue") : t("start")}: ${nl.icon} ${esc(L(nl.title))}</a>` : ""}
            <a class="btn" href="#/lesson/${lessons.length ? lessons[Math.floor(Math.random() * lessons.length)].id : ""}">${t("randomLesson")}</a>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-top:0">${t("progress")}</h3>
          <div class="row"><span style="font-size:2em">${r.icon}</span><div><b>${esc(L(r.title))}</b><br><span class="muted">${next ? `${next.xp - S.xp} XP ${t("nextRank")} ${esc(L(next.title))}` : "🏆"}</span></div></div>
          <div class="rank-bar"><div style="width:${pct}%"></div></div>
          <div class="stats">
            <div class="stat"><b>${S.xp}</b>${t("xp")}</div>
            <div class="stat"><b>🔥${streak()}</b>${t("streak")}</div>
            <div class="stat"><b>${doneCount}/${lessons.length}</b>${t("learned")}</div>
          </div>
          <div class="row" style="margin-top:10px">
            <button class="btn small" id="expBtn">⬇️ ${t("exportProgress")}</button>
            <label class="btn small">⬆️ ${t("importProgress")}<input type="file" id="impFile" accept=".json" hidden></label>
            <button class="btn small" id="resetBtn">🗑️ ${t("resetProgress")}</button>
          </div>
        </div>
      </section>
      ${dl ? `<section class="card">
        <h2 style="margin-top:0">☀️ ${t("dailyTitle")} <span class="muted" style="font-size:.6em;font-weight:400">${t("dailySub")}</span></h2>
        <div class="daily">
          <div class="item">💡 <a href="#/lesson/${dl.id}"><b>${dl.icon} ${esc(L(dl.title))}</b></a> — ${esc(L(dl.tldr))}</div>
          ${q ? `<div class="item" id="dailyQuiz"></div>` : ""}
          ${g ? `<div class="item"><details><summary>🃏 <b>${esc(g.term)}</b> — ${S.lang === "he" ? "מה זה?" : "what is it?"}</summary><p style="margin:.4em 0 0">${esc(L(g.def))}</p></details></div>` : ""}
        </div></section>` : ""}
      ${PATHS.length ? `<h2>🧭 ${t("pathsTitle")}</h2><p class="muted" style="margin-top:-6px">${t("pathsSub")}</p><div class="grid">${PATHS.map(pathCard).join("")}</div>` : ""}
      <h2>🗺️ ${t("path")}</h2>
      <div class="grid">${I.tracks.map(trackCard).join("")}</div>`;
    if (q) renderQuizQ($("#dailyQuiz"), q, "daily:" + today(), 15);
    $("#expBtn").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }));
      a.download = `infra-academy-progress-${today()}.json`; a.click();
    };
    $("#impFile").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(txt => { try { S = Object.assign({}, defaults, JSON.parse(txt)); save(); applyLang(); applyTheme(); renderXP(); render(); toast("✓"); } catch (err) { toast("Invalid file"); } });
    };
    let armed = false;
    $("#resetBtn").onclick = (e) => {
      if (!armed) { armed = true; e.target.textContent = t("resetConfirm"); return; }
      const keep = { lang: S.lang, theme: S.theme }; S = Object.assign({}, defaults, keep, { done: {}, quiz: {}, cards: {}, notes: {}, scen: {}, daily: {}, days: [] }); save(); renderXP(); render();
    };
  }

  function learn(app) {
    app.innerHTML = `<h1>📚 ${t("navLearn")}</h1><div class="grid">${I.tracks.map(trackCard).join("")}</div>`;
  }

  function viewTrack(app, id) {
    const tr = trackOf(id); if (!tr) return home(app);
    const ls = trackLessons(id);
    const sims = Object.entries(I.sims || {}).filter(([, s]) => s.track === id);
    const dn = ls.filter(l => S.done[l.id]).length; const nx = ls.find(l => !S.done[l.id]);
    const inPaths = PATHS.filter(p => pathSteps(p).some(x => byId[x.lesson] && byId[x.lesson].track === id));
    let num = 0, lastLv = 0;
    app.innerHTML = `
      <div class="crumbs"><a href="#/learn">${t("navLearn")}</a></div>
      <div class="track-head"><span class="ticon">${tr.icon}</span><div><h1 style="margin:0">${esc(L(tr.title))}</h1><p class="muted" style="margin:0">${esc(L(tr.blurb))}</p></div></div>
      <div class="card track-progress" style="--tc:${tr.color}">
        <div class="row"><b>${dn}/${ls.length} ✓</b><span class="spacer"></span>${nx ? `<a class="btn primary" href="#/lesson/${nx.id}">${dn ? t("trackContinue") : t("trackStart")}: ${nx.icon || ""} ${esc(L(nx.title))}</a>` : ""}</div>
        <div class="pb-bar" style="margin-top:10px"><div style="width:${ls.length ? Math.round(dn / ls.length * 100) : 0}%"></div></div>
        ${inPaths.length ? `<div class="chips" style="margin-top:10px"><span class="muted small">${t("inPaths")}</span>${inPaths.map(p => `<a class="chip path" href="#/paths/${p.id}">${p.icon} ${esc(L(p.title))}</a>`).join("")}</div>` : ""}
      </div>
      <div class="lesson-list">${ls.length ? ls.map(l => { num++; const lv = l.level || 1; const head = lv !== lastLv ? `<h3 class="lv-head">${I.ui.level[S.lang][lv] || ""}</h3>` : ""; lastLv = lv; return head + `
        <a class="card lesson-item ${nx && nx.id === l.id ? "next" : ""}" href="#/lesson/${l.id}"><span class="lnum">${num}</span>
          <span class="licon">${l.icon || "📄"}</span>
          <span class="ltext"><b>${esc(L(l.title))}</b><span>${esc(L(l.tldr))}</span></span>
          <span class="tag">${I.ui.level[S.lang][l.level || 1] || ""}</span>
          <span class="tag">${l.minutes || 5} ${t("min")}</span>
          <span class="check ${S.done[l.id] ? "on" : ""}">${S.done[l.id] ? "✓" : ""}</span>
        </a>`; }).join("") : `<p class="muted">${t("comingSoon")}</p>`}</div>
      ${sims.length ? `<h2>🎮 ${t("playground")}</h2><div class="grid">${sims.map(([sid, s]) => simCard(sid, s)).join("")}</div>` : ""}`;
  }

  function quizState(key) { return S.quiz[key] || (S.quiz[key] = {}); }
  function renderQuizQ(el, q, key, xp) {
    const st = S.quiz[key];
    el.innerHTML = `<div class="quiz-q"><b>❓ ${rich(L(q.q))}</b><div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${rich(L(o))}</button>`).join("")}</div><div class="explain" hidden></div></div>`;
    const show = (picked) => {
      $$(".opt", el).forEach(b => { b.disabled = true; const i = +b.dataset.i; if (i === q.answer) b.classList.add("correct"); else if (i === picked) b.classList.add("wrong"); });
      const ex = $(".explain", el); ex.hidden = false;
      ex.innerHTML = `<b>${picked === q.answer ? "✅ " + t("correct") : "❌ " + t("wrong")}</b> ${rich(L(q.explain))}`;
    };
    if (st && st.picked != null) show(st.picked);
    $$(".opt", el).forEach(b => b.onclick = () => {
      const i = +b.dataset.i; if (S.quiz[key]) return;
      S.quiz[key] = { picked: i, ok: i === q.answer }; save(); show(i);
      if (i === q.answer) addXP(xp || 10, `+${xp || 10} XP`);
    });
  }

  function viewLesson(app, id) {
    const l = byId[id];
    if (!l) { app.innerHTML = `<p>${t("lessonNotFound")}</p>`; return; }
    S.last = id; save();
    const pp = pathPos(l);
    const tr = trackOf(l.track) || { title: { en: "", he: "" }, icon: "" };
    const idx = lessons.indexOf(l); const prev = lessons[idx - 1]; const next = lessons[idx + 1];
    const secs = [];
    const sec = (key, title, html, cls) => { secs.push([key, title]); return `<section id="sec-${key}" class="${cls || ""}"><h2>${title}</h2>${html}</section>`; };
    let body = "";
    body += pathBar(l);
    body += `<div class="tldr">⚡ ${esc(L(l.tldr))}</div>`;
    body += contextBox(l);
    if (l.analogy) body += `<div class="card analogy" style="margin-top:16px"><div class="label">🎭 ${t("analogy")}</div><div>${L(l.analogy)}</div></div>`;
    (l.sections || []).forEach((s, i) => { body += sec("s" + i, esc(L(s.h)), `<div class="section-body">${L(s.body)}</div>`); });
    if (l.flow && l.flow.steps && l.flow.steps.length) body += sec("flow", "🔄 " + t("flowTitle"), `<div class="flowbox" id="flowBox"></div>`);
    if (l.diagram) body += sec("diagram", "🖼️ " + t("diagram"), `<div class="diagram"><pre>${esc(l.diagram)}</pre></div>`);
    if (l.playground && I.sims && I.sims[l.playground]) body += sec("play", "🎮 " + t("playground") + ` <a class="btn small" href="#/play/${l.playground}">${t("openFull")}</a>`, `<div id="lessonSim"></div>`);
    if (l.handsOn && l.handsOn.length) body += sec("hands", "⌨️ " + t("handsOn"), l.handsOn.map(h => `<div class="cmd"><code>${esc(h.cmd)}</code><button class="btn small" data-copy="${esc(h.cmd)}">${t("copy")}</button><div class="what">${L(h.what)}</div></div>`).join(""));
    if (l.mnemonic) body += `<div class="card mnemonic" style="margin-top:24px"><div class="label">🧠 ${t("mnemonic")}</div><div>${L(l.mnemonic)}</div></div>`;
    if (l.pitfalls && l.pitfalls.length) body += sec("pit", "🕳️ " + t("pitfalls"), l.pitfalls.map(p => `<div class="pitfall">${L(p)}</div>`).join(""));
    if (l.interview && l.interview.length) body += sec("int", "🎤 " + t("interview"), l.interview.map(q => `<details class="qa"><summary>${L(q.q)}</summary><div style="margin-top:8px">${L(q.a)}</div></details>`).join(""));
    if (l.quiz && l.quiz.length) body += sec("quiz", "📝 " + t("quiz"), `<div id="quizBox"></div>`);
    body += sec("notes", "✍️ " + t("notes"), `<textarea class="notes" id="notes" placeholder="${esc(t("notesPh"))}">${esc(S.notes[l.id] || "")}</textarea>`);
    body += `<div class="card ask-box" style="margin-top:20px"><b>🤖 ${t("askClaude")}</b><p class="muted" style="margin:.3em 0 .6em">${t("askClaudeSub")}</p>
      <div class="row"><input id="askQ" type="text" style="flex:1;min-width:200px;padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font:inherit" placeholder="${S.lang === "he" ? "מה לא ברור? (אופציונלי)" : "What's unclear? (optional)"}"><button class="btn primary" id="askCopy">${t("copyPrompt")}</button></div></div>`;
    if (l.related && l.related.length) {
      const rel = l.related.filter(r => byId[r]);
      if (rel.length) body += `<h2>🔗 ${t("related")}</h2><div class="chips">${rel.map(chip).join("")}</div>`;
    }
    const bl = (backlinks[l.id] || []).filter(r => !(l.related || []).includes(r));
    if (bl.length) body += `<h2>🔁 ${t("referencedBy")}</h2><div class="chips">${bl.slice(0, 12).map(chip).join("")}</div>`;
    body += `<div class="lesson-footer">
      ${prev ? `<a class="btn" href="#/lesson/${prev.id}">${t("prev")}</a>` : ""}
      <span class="spacer"></span>
      <button class="btn ${S.done[l.id] ? "good" : "primary"}" id="doneBtn">${S.done[l.id] ? t("done") : t("markDone")}</button>
      ${pp && pp.next ? `<a class="btn" href="#/lesson/${pp.next.lesson}">${t("nextStep")} ›</a>` : next ? `<a class="btn" href="#/lesson/${next.id}">${t("next")}</a>` : ""}
    </div>`;
    app.innerHTML = `
      <div class="crumbs"><a href="#/learn">${t("navLearn")}</a> › <a href="#/track/${l.track}">${tr.icon} ${esc(L(tr.title))}</a></div>
      <div class="lesson-layout">
        <article class="lesson">
          <h1><span>${l.icon || "📄"}</span><span>${esc(L(l.title))}</span></h1>
          <div class="row" style="margin-bottom:14px"><span class="tag">${I.ui.level[S.lang][l.level || 1]}</span><span class="tag">⏱ ${l.minutes || 5} ${t("min")}</span>${S.done[l.id] ? `<span class="tag" style="color:var(--good)">✓ ${t("done")}</span>` : ""}</div>
          <details class="toc-m"><summary>📑 ${t("onThisPage")}</summary>${secs.map(([k, ti]) => `<a href="javascript:void 0" data-sec="${k}">${ti.replace(/<[^>]+>.*$/, "")}</a>`).join("")}</details>
          ${body}
        </article>
        <aside class="toc">${secs.map(([k, ti]) => `<a href="javascript:void 0" data-sec="${k}">${ti.replace(/<[^>]+>.*$/, "")}</a>`).join("")}</aside>
      </div>`;
    $$("[data-copy]", app).forEach(b => b.onclick = () => copy(b.dataset.copy));
    $$("[data-sec]", app).forEach(a => a.onclick = () => { const s = $("#sec-" + a.dataset.sec); if (s) s.scrollIntoView({ behavior: "smooth" }); const d = a.closest(".toc-m"); if (d) d.open = false; });
    const cb = $("#ctxBox"); if (cb) cb.ontoggle = () => { S.ctxClosed = !cb.open; save(); };
    if (l.flow && $("#flowBox")) { const stop = mountFlow($("#flowBox"), l.flow); const prev = cleanup; cleanup = () => { stop(); if (prev) prev(); }; }
    linkGlossary($(".lesson", app), l.id);
    readBar(true);
    if (l.quiz) { const qb = $("#quizBox"); l.quiz.forEach((q, i) => { const d = document.createElement("div"); qb.appendChild(d); renderQuizQ(d, q, l.id + ":" + i, 10); }); }
    const notes = $("#notes"); notes.oninput = () => { S.notes[l.id] = notes.value; save(); };
    $("#doneBtn").onclick = () => {
      if (S.done[l.id]) return;
      S.done[l.id] = today(); save(); addXP(50, "+50 XP 🎓"); confetti();
      const b = $("#doneBtn"); b.textContent = t("done"); b.classList.remove("primary"); b.classList.add("good");
    };
    $("#askCopy").onclick = () => copy(lessonPrompt(l, $("#askQ").value));
    if (l.playground && I.sims && I.sims[l.playground]) { const sc = mountSim($("#lessonSim"), l.playground); const pc = cleanup; cleanup = () => { if (typeof sc === "function") sc(); if (pc) pc(); }; }
  }

  function lessonPrompt(l, question) {
    const langName = S.lang === "he" ? "Hebrew (keep technical terms in English)" : "English";
    return `I'm learning infrastructure & cloud with my Infra Academy app (this project folder).
I just read the lesson "${L(l.title)}" (id: ${l.id}, track: ${l.track}).
Its TL;DR: ${strip(L(l.tldr))}
${question ? `My question: ${question}` : "Explain this topic to me again from a different angle, with a fresh analogy, a concrete production example, and 2 check-yourself questions."}

Answer in ${langName}. Be concrete and practical; show real commands/config where relevant.
If the answer is worth keeping, also add it as a new lesson (or extend this one) following CONTENT_SCHEMA.md, put it in content/my-lessons.js, and run node tools/validate.js.`;
  }

  // ---------------- simulators ----------------
  function simCard(id, s) {
    return `<a class="card track-card" href="#/play/${id}" style="--tc:${(trackOf(s.track) || {}).color || "var(--accent)"}"><span class="ticon">${s.icon}</span><h3>${esc(L(s.title))}</h3><p>${esc(L(s.desc))}</p></a>`;
  }
  function mountSim(el, id) {
    const s = I.sims[id]; if (!s || !el) return null;
    el.innerHTML = `<div class="sim"><h3>${s.icon} ${esc(L(s.title))}</h3><p class="muted" style="margin-top:0">${esc(L(s.desc))}</p><div class="sim-body"></div></div>`;
    try { return s.mount($(".sim-body", el), I.helpers) || null; }
    catch (e) { console.error(e); el.innerHTML += `<p class="muted">Simulator error: ${esc(e.message)}</p>`; return null; }
  }
  function play(app, id) {
    if (id && I.sims && I.sims[id]) {
      const s = I.sims[id];
      const rel = lessons.filter(l => l.playground === id);
      app.innerHTML = `<div class="crumbs"><a href="#/play">${t("playTitle")}</a></div><div id="simHost"></div>
        ${rel.length ? `<h2>📚 ${t("related")}</h2><div class="row">${rel.map(r => `<a class="btn small" href="#/lesson/${r.id}">${r.icon} ${esc(L(r.title))}</a>`).join("")}</div>` : ""}`;
      cleanup = mountSim($("#simHost"), id);
      if (!S.daily["sim:" + id]) { S.daily["sim:" + id] = 1; addXP(15, "+15 XP 🎮"); }
      return;
    }
    app.innerHTML = `<h1>🎮 ${t("playTitle")}</h1><p class="muted">${t("playSub")}</p><div class="grid">${Object.entries(I.sims || {}).map(([sid, s]) => simCard(sid, s)).join("")}</div>`;
  }

  // ---------------- on-call ----------------
  function oncall(app, id) {
    const sc = I.scenarios.find(s => s.id === id);
    if (!sc) {
      app.innerHTML = `<h1>📟 ${t("oncallTitle")}</h1><p class="muted">${t("oncallSub")}</p>
        <div class="grid">${I.scenarios.map(s => `<a class="card track-card" href="#/oncall/${s.id}" style="--tc:var(--bad)"><span class="ticon">${s.icon || "🔥"}</span><h3>${esc(L(s.title))}</h3>
        <p>${S.scen[s.id] != null ? `🏅 ${t("score")}: ${S.scen[s.id]}` : ""}</p></a>`).join("")}</div>`;
      return;
    }
    let score = 0; const hist = [];
    app.innerHTML = `<div class="crumbs"><a href="#/oncall">${t("oncallTitle")}</a></div><h1>${sc.icon || "🔥"} ${esc(L(sc.title))}</h1><div class="row"><span class="tag" id="scScore"></span></div><div id="scHist" class="history"></div><div id="scBox"></div>`;
    const go = (key, fb) => {
      const st = sc.steps[key]; const box = $("#scBox");
      $("#scScore").textContent = `${t("score")}: ${score}`;
      $("#scHist").innerHTML = hist.map((h, i) => `<div>${i + 1}. ${esc(h)}</div>`).join("");
      let html = "";
      if (fb) html += `<div class="feedback ${fb.score > 0 ? "pos" : fb.score < 0 ? "neg" : "neu"}">${fb.score > 0 ? "👍" : fb.score < 0 ? "👎" : "🤔"} <b>${fb.score > 0 ? "+" : ""}${fb.score}</b> — ${L(fb.feedback)}</div>`;
      html += `<div class="card scenario-step"><div>${L(st.text)}</div>${st.data ? `<pre class="data">${esc(st.data)}</pre>` : ""}`;
      if (st.end) {
        const win = st.end === "win";
        html += `<h2>${win ? t("win") : t("lose")}</h2><p><b>${t("score")}: ${score}</b></p>`;
        if (sc.lessons && sc.lessons.length) html += `<p>${t("studyThese")} ${sc.lessons.filter(x => byId[x]).map(x => `<a class="btn small" href="#/lesson/${x}">${byId[x].icon} ${esc(L(byId[x].title))}</a>`).join(" ")}</p>`;
        html += `<button class="btn primary" id="scAgain">${t("restart")}</button>`;
      } else {
        html += `<div style="margin-top:12px">${st.choices.map((c, i) => `<button class="choice" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(L(c.label))}</button>`).join("")}</div>`;
      }
      html += `</div>`;
      box.innerHTML = html;
      if (st.end) {
        const best = S.scen[sc.id];
        if (st.end === "win" && (best == null || score > best)) { S.scen[sc.id] = score; save(); addXP(Math.max(20, score), `+${Math.max(20, score)} XP 📟`); confetti(); }
        $("#scAgain").onclick = () => oncall(app, id);
      } else {
        $$(".choice", box).forEach(b => b.onclick = () => {
          const c = st.choices[+b.dataset.i]; score += c.score || 0; hist.push(L(c.label));
          go(c.next, c); window.scrollTo({ top: $("#scBox").offsetTop - 80, behavior: "smooth" });
        });
      }
    };
    go(sc.start);
  }

  // ---------------- flashcards (Leitner) ----------------
  const INTERVALS = [0, 1, 2, 4, 9, 21];
  function allCards() {
    const cs = I.glossary.map(g => ({ id: "g:" + g.term, track: g.track, front: g.term, back: L(g.def), lesson: g.lesson }));
    lessons.forEach(l => (l.interview || []).forEach((q, i) => cs.push({ id: `i:${l.id}:${i}`, track: l.track, front: strip(L(q.q)), back: L(q.a), lesson: l.id, isQ: true })));
    return cs;
  }
  function cards(app, trackFilter) {
    let filter = trackFilter || "all"; let force = false;
    const draw = () => {
      const all = allCards().filter(c => filter === "all" || c.track === filter);
      const now = today();
      const due = all.filter(c => { const st = S.cards[c.id]; return force || !st || st.due <= now; });
      const counts = [1, 2, 3, 4, 5].map(b => all.filter(c => (S.cards[c.id] || { box: 1 }).box === b).length);
      const card = due.length ? due[Math.floor(Math.random() * due.length)] : null;
      app.innerHTML = `<h1>🃏 ${t("cardsTitle")}</h1><p class="muted">${t("cardsSub")}</p>
        <div class="row"><select id="cardTrack" class="btn"><option value="all">${t("allTracks")}</option>${I.tracks.map(tr => `<option value="${tr.id}" ${filter === tr.id ? "selected" : ""}>${tr.icon} ${esc(L(tr.title))}</option>`).join("")}</select>
        <span class="tag">${due.length} ${t("due")}</span></div>
        <div class="boxes">${counts.map((c, i) => `<span>📦${i + 1}: ${c}</span>`).join("")}</div>
        ${card ? `<div class="card flash"><div class="front">${esc(card.front)}</div><div class="back" hidden>${card.isQ ? card.back : esc(card.back)}${card.lesson && byId[card.lesson] ? `<p><a href="#/lesson/${card.lesson}">→ ${esc(L(byId[card.lesson].title))}</a></p>` : ""}</div>
          <div class="row" style="justify-content:center;margin-top:18px" id="flashBtns"><button class="btn primary" id="showBtn">${t("showAnswer")}</button></div></div>`
          : `<div class="card flash"><p>${t("cardsDone")}</p><div class="row" style="justify-content:center"><button class="btn primary" id="forceBtn">${t("studyAll")}</button></div></div>`}`;
      $("#cardTrack").value = filter;
      $("#cardTrack").onchange = (e) => { filter = e.target.value; draw(); };
      if (!card) { $("#forceBtn").onclick = () => { force = true; draw(); }; return; }
      $("#showBtn").onclick = () => {
        $(".flash .back").hidden = false;
        $("#flashBtns").innerHTML = `<button class="btn bad" id="noBtn">${t("forgot")}</button><button class="btn good" id="yesBtn">${t("knewIt")}</button>`;
        const grade = (ok) => {
          const st = S.cards[card.id] || { box: 1 };
          st.box = ok ? Math.min(5, st.box + 1) : 1;
          const d = new Date(); d.setDate(d.getDate() + INTERVALS[st.box]); st.due = d.toISOString().slice(0, 10);
          S.cards[card.id] = st; save(); addXP(ok ? 3 : 1); draw();
        };
        $("#yesBtn").onclick = () => grade(true); $("#noBtn").onclick = () => grade(false);
      };
    };
    draw();
  }

  // ---------------- glossary ----------------
  function glossary(app) {
    const items = I.glossary.slice().sort((a, b) => a.term.localeCompare(b.term));
    app.innerHTML = `<h1>📖 ${t("glossaryTitle")}</h1><div class="row"><input id="gf" type="text" class="btn" style="flex:1;font-weight:400" placeholder="${t("filter")}"><select id="gt" class="btn"><option value="all">${t("allTracks")}</option>${I.tracks.map(tr => `<option value="${tr.id}">${tr.icon} ${esc(L(tr.title))}</option>`).join("")}</select></div><div id="gl" class="card" style="margin-top:12px"></div>`;
    const draw = () => {
      const q = $("#gf").value.trim().toLowerCase(); const tk = $("#gt").value;
      const res = items.filter(g => (tk === "all" || g.track === tk) && (!q || g.term.toLowerCase().includes(q) || L(g.def).toLowerCase().includes(q)));
      $("#gl").innerHTML = res.map(g => `<div class="glossary-item"><b dir="ltr">${esc(g.term)}</b> <span class="tag">${(trackOf(g.track) || {}).icon || ""}</span><div>${esc(L(g.def))}${g.lesson && byId[g.lesson] ? ` <a href="#/lesson/${g.lesson}">→</a>` : ""}</div></div>`).join("") || `<p class="muted">${t("noResults")}</p>`;
    };
    $("#gf").oninput = draw; $("#gt").onchange = draw; draw();
  }

  // ---------------- cookbook ----------------
  function cookbook(app) {
    app.innerHTML = `<h1>⌨️ ${t("cookbookTitle")}</h1><p class="muted">${t("cookbookSub")}</p><input id="cf" type="text" class="btn" style="width:100%;font-weight:400" placeholder="${t("filter")} (kubectl, docker, dig, curl…)"><div id="cb"></div>`;
    const draw = () => {
      const q = $("#cf").value.trim().toLowerCase();
      $("#cb").innerHTML = I.tracks.map(tr => {
        const rows = [];
        trackLessons(tr.id).forEach(l => (l.handsOn || []).forEach(h => { if (!q || h.cmd.toLowerCase().includes(q) || strip(L(h.what)).toLowerCase().includes(q)) rows.push({ l, h }); }));
        if (!rows.length) return "";
        return `<h2>${tr.icon} ${esc(L(tr.title))}</h2>` + rows.map(({ l, h }) => `<div class="cmd"><code>${esc(h.cmd)}</code><button class="btn small" data-copy="${esc(h.cmd)}">${t("copy")}</button><div class="what">${L(h.what)} · <a href="#/lesson/${l.id}">${esc(L(l.title))}</a></div></div>`).join("");
      }).join("") || `<p class="muted">${t("noResults")}</p>`;
      $$("[data-copy]", app).forEach(b => b.onclick = () => copy(b.dataset.copy));
    };
    $("#cf").oninput = draw; draw();
  }

  // ---------------- ask ----------------
  function ask(app) {
    const he = S.lang === "he";
    const folder = "path/to/infra-academy";
    app.innerHTML = `<h1>🤖 ${t("askTitle")}</h1>
      <p class="muted">${he ? "שלוש דרכים לקבל תשובה בלי לפתוח צ'אט או גוגל — מהמהירה לעמוקה." : "Three ways to get answers without opening a chat or Google — from fastest to deepest."}</p>
      <div class="card"><h3 style="margin-top:0">1️⃣ ${he ? "חיפוש בבסיס הידע (מיידי)" : "Search the knowledge base (instant)"}</h3>
        <p>${he ? "כל שיעור, מונח, פקודה ותרחיש. לחצו <kbd>/</kbd> בכל מקום." : "Every lesson, term, command and scenario. Press <kbd>/</kbd> anywhere."}</p>
        <button class="btn primary" id="askSearch">🔎 ${t("searchHint")}</button></div>
      <div class="card" style="margin-top:14px"><h3 style="margin-top:0">2️⃣ ${he ? "Claude Code בתיקיית הפרויקט — המורה הפרטי שלך" : "Claude Code in this project — your private tutor"}</h3>
        <p>${he ? "הפרויקט מגיע עם קובץ CLAUDE.md ו-skills ש\"מלמדים\" את Claude להיות מורה תשתיות. כל תשובה טובה יכולה להפוך לשיעור קבוע באפליקציה — כך הידע נצבר אצלך ולא נעלם בהיסטוריית צ'אט." : "The project ships a CLAUDE.md and skills that turn Claude into an infra tutor. Any good answer can become a permanent lesson in this app — knowledge accumulates here instead of vanishing in chat history."}</p>
        <div class="cmd"><code>cd "${folder}" &amp;&amp; claude</code><button class="btn small" data-copy='cd "${folder}" && claude'>${t("copy")}</button><div class="what">${he ? "פותחים את Claude Code בתיקייה" : "Open Claude Code in the folder"}</div></div>
        <div class="cmd"><code>/teach service mesh</code><button class="btn small" data-copy="/teach service mesh">${t("copy")}</button><div class="what">${he ? "כותב שיעור דו-לשוני חדש (עם אנלוגיה, פקודות ובוחן) לתוך content/my-lessons.js" : "Writes a new bilingual lesson (analogy, commands, quiz) into content/my-lessons.js"}</div></div>
        <div class="cmd"><code>/explain why does my pod get OOMKilled when the node has free memory?</code><button class="btn small" data-copy="/explain why does my pod get OOMKilled when the node has free memory?">${t("copy")}</button><div class="what">${he ? "תשובה מיידית בסגנון האקדמיה: אנלוגיה, הסבר, דוגמה מפרודקשן, ומה לבדוק" : "An instant Academy-style answer: analogy, explanation, production example, what to check"}</div></div>
        <div class="cmd"><code>/quiz-me kubernetes</code><button class="btn small" data-copy="/quiz-me kubernetes">${t("copy")}</button><div class="what">${he ? "ראיון טכני אינטראקטיבי על מסלול, לפי מה שכבר למדת" : "An interactive mock interview on a track, based on what you've learned"}</div></div>
        <div class="cmd"><code>/publish</code><button class="btn small" data-copy="/publish">${t("copy")}</button><div class="what">${he ? "מאמת את התוכן, עושה commit ו-push — והאתר ב-GitHub Pages מתעדכן" : "Validates content, commits and pushes — your GitHub Pages site updates"}</div></div>
      </div>
      <div class="card" style="margin-top:14px"><h3 style="margin-top:0">3️⃣ ${he ? "בונה פרומפטים (לכל Claude)" : "Prompt builder (for any Claude)"}</h3>
        <p class="muted">${he ? "כתבו שאלה, בחרו סגנון — ומקבלים פרומפט שמחזיר תשובה בפורמט של האקדמיה." : "Type a question, pick a style — get a prompt that returns an Academy-format answer."}</p>
        <textarea class="notes" id="pbQ" placeholder="${he ? "למשל: מה ההבדל בין Kafka ל-RabbitMQ ומתי לבחור כל אחד?" : "e.g. What's the difference between Kafka and RabbitMQ and when do I pick each?"}"></textarea>
        <div class="row" style="margin-top:8px">
          <select id="pbStyle" class="btn">
            <option value="eli5">${he ? "🧒 תסביר לי כמו לילד בן 5" : "🧒 Explain like I'm 5"}</option>
            <option value="eng" selected>${he ? "🧑‍💻 כמו למפתח" : "🧑‍💻 Like to a developer"}</option>
            <option value="senior">${he ? "🧙 צלילה לעומק (Senior)" : "🧙 Deep dive (senior)"}</option>
            <option value="interview">${he ? "🎤 תכין אותי לראיון" : "🎤 Prep me for an interview"}</option>
            <option value="debug">${he ? "🚒 עזור לי לדבג תקלה" : "🚒 Help me debug an incident"}</option>
          </select>
          <button class="btn primary" id="pbCopy">${t("copyPrompt")}</button>
        </div></div>`;
    $("#askSearch").onclick = openSearch;
    $$("[data-copy]", app).forEach(b => b.onclick = () => copy(b.dataset.copy));
    $("#pbCopy").onclick = () => {
      const styles = {
        eli5: "Explain it like I'm 5 first (one everyday analogy), then one level deeper.",
        eng: "Explain it to a software developer: analogy, how it really works, a concrete production example, real commands/config, common pitfalls.",
        senior: "Go deep like a senior SRE/architect: internals, trade-offs, failure modes, numbers, and what to monitor.",
        interview: "Act as an interviewer: ask me 5 progressively harder questions one at a time, wait for my answer, then grade and correct me.",
        debug: "Act as an incident commander: ask me for the symptoms, then guide me step by step with the exact commands/queries to run, from most likely cause to least."
      };
      copy(`${$("#pbQ").value || "(my question)"}\n\n${styles[$("#pbStyle").value]}\nAnswer in ${he ? "Hebrew (keep technical terms in English)" : "English"}. End with a one-line memory hook and 2 check-yourself questions.`);
    };
  }

  // ---------------- search ----------------
  let searchIndex = null;
  function buildIndex() {
    const idx = [];
    const both = (o) => o ? (typeof o === "string" ? o : (o.en || "") + " " + (o.he || "")) : "";
    lessons.forEach(l => idx.push({ type: "📄", href: `#/lesson/${l.id}`, title: () => `${l.icon || ""} ${L(l.title)}`, sub: () => L(l.tldr),
      hay: [both(l.title), l.id, both(l.tldr)].join(" ").toLowerCase(), body: strip([(l.sections || []).map(s => both(s.h) + " " + both(s.body)).join(" "), both(l.analogy), both(l.mnemonic)].join(" ")).toLowerCase() }));
    I.glossary.forEach(g => idx.push({ type: "📖", href: g.lesson ? `#/lesson/${g.lesson}` : "#/glossary", title: () => g.term, sub: () => L(g.def), hay: (g.term + " " + both(g.def)).toLowerCase(), body: "" }));
    lessons.forEach(l => (l.handsOn || []).forEach(h => idx.push({ type: "⌨️", href: `#/lesson/${l.id}`, title: () => h.cmd, sub: () => strip(L(h.what)), hay: (h.cmd + " " + strip(both(h.what))).toLowerCase(), body: "" })));
    I.scenarios.forEach(s => idx.push({ type: "📟", href: `#/oncall/${s.id}`, title: () => L(s.title), sub: () => t("oncallTitle"), hay: both(s.title).toLowerCase(), body: "" }));
    (I.topQuestions || []).forEach(q => idx.push({ type: "🏆", href: `#/interview/top`, title: () => strip(L(q.q)), sub: () => (q.companies || []).join(" · "), hay: (both(q.q) + " " + (q.companies || []).join(" ")).toLowerCase(), body: strip(both(q.signal) + " " + both(q.outline)).toLowerCase() }));
    (I.designs || []).forEach(d => idx.push({ type: "🏛️", href: `#/interview/design/${d.id}`, title: () => `${d.icon || ""} ${L(d.title)}`, sub: () => strip(L(d.prompt)), hay: (both(d.title) + " " + both(d.prompt) + " " + d.id).toLowerCase(), body: strip((d.deepDives || []).map(x => both(x.h) + " " + both(x.body)).join(" ")).toLowerCase() }));
    (I.problems || []).forEach(p => idx.push({ type: "🧩", href: `#/interview/code/${p.id}`, title: () => `${p.icon || ""} ${L(p.title)}${p.leetcode ? " (LC " + p.leetcode + ")" : ""}`, sub: () => (p.tags || []).join(", "), hay: (both(p.title) + " " + (p.tags || []).join(" ") + " " + p.id + " lc" + (p.leetcode || "") + " " + (p.leetcode || "")).toLowerCase(), body: strip(both(p.statement)).toLowerCase() }));
    if (window.CQ && CQ.searchItems) CQ.searchItems(S.lang).forEach(({ u, l, text }) => idx.push({ type: "🎓", href: `#/cs/lesson/${u.id}/${l.id}`, title: () => `${l.emoji} ${l.title}`, sub: () => `${u.emoji} ${u.title}`, hay: (l.title + " " + u.title).toLowerCase(), body: strip(text).toLowerCase() }));
    Object.entries(I.sims || {}).forEach(([id, s]) => idx.push({ type: "🎮", href: `#/play/${id}`, title: () => L(s.title), sub: () => L(s.desc), hay: (both(s.title) + " " + both(s.desc)).toLowerCase(), body: "" }));
    return idx;
  }
  let sel = 0, results = [];
  function doSearch(q) {
    searchIndex = searchIndex || buildIndex();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { results = []; $("#searchResults").innerHTML = ""; return; }
    results = searchIndex.map(e => {
      let sc = 0;
      for (const w of terms) {
        const inH = e.hay.includes(w), inB = e.body.includes(w);
        if (!inH && !inB) return null;
        sc += (inH ? 10 : 0) + (inB ? 2 : 0) + (e.title().toLowerCase().includes(w) ? 15 : 0);
      }
      if (e.type === "📄") sc += 3;
      return { e, sc };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 30);
    sel = 0;
    const hl = (s) => { let h = esc(s); terms.forEach(w => { h = h.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); }); return h; };
    $("#searchResults").innerHTML = results.length ? results.map((r, i) => `<a class="sr ${i === 0 ? "sel" : ""}" href="${r.e.href}">${r.e.type} ${hl(r.e.title())}<small>${hl(String(r.e.sub()).slice(0, 140))}</small></a>`).join("")
      : `<p class="muted" style="padding:12px">${t("noResults")}</p>`;
  }
  function openSearch() { $("#searchModal").hidden = false; const i = $("#searchInput"); i.value = ""; doSearch(""); setTimeout(() => i.focus(), 10); }
  function closeSearch() { $("#searchModal").hidden = true; }
  $("#searchBtn").onclick = openSearch;
  $("#searchModal").addEventListener("click", (e) => { if (e.target.dataset.close != null || e.target.closest(".sr")) closeSearch(); });
  $("#searchInput").addEventListener("input", (e) => doSearch(e.target.value));
  $("#searchInput").addEventListener("keydown", (e) => {
    const items = $$(".sr");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % Math.max(1, items.length); items.forEach((a, i) => a.classList.toggle("sel", i === sel)); if (items[sel]) items[sel].scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter" && items[sel]) { location.hash = items[sel].getAttribute("href"); closeSearch(); }
    if (e.key === "Escape") closeSearch();
  });
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (e.key === "/" && !["input", "textarea", "select"].includes(tag)) { e.preventDefault(); openSearch(); }
    if (e.key === "Escape" && !$("#searchModal").hidden) closeSearch();
  });

  // ---------------- boot ----------------
  applyTheme(); applyLang(); renderXP(); render();
})();
