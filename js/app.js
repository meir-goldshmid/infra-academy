/* Infra Academy — app shell, router, views. No build step, no dependencies. */
(function () {
  "use strict";
  const I = window.INFRA;
  I.lessons = I.lessons || []; I.glossary = I.glossary || []; I.scenarios = I.scenarios || [];

  // ---------------- state ----------------
  const KEY = "infra-academy-v1";
  const defaults = { lang: "he", theme: "auto", done: {}, quiz: {}, xp: 0, days: [], cards: {}, notes: {}, scen: {}, daily: {} };
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
      ["#/", "navHome"], ["#/learn", "navLearn"], ["#/play", "navPlay"], ["#/oncall", "navOncall"], ["#/interview", "navInterview"], ["#/cs", "navCS"],
      ["#/cards", "navCards"], ["#/glossary", "navGlossary"], ["#/cookbook", "navCookbook"], ["#/ask", "navAsk"]
    ].map(([h, k]) => `<a href="${h}" data-route="${h}">${t(k)}</a>`).join("");
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
    $$("#nav a").forEach(a => {
      const r = a.dataset.route.replace("#/", "");
      a.classList.toggle("active", r === route || (r === "learn" && (route === "track" || route === "lesson")) || (r === "" && route === ""));
    });
    const app = $("#app");
    const views = { "": home, learn, track: viewTrack, lesson: viewLesson, play, oncall, cards, glossary, cookbook, ask };
    if (route === "cs" && window.CQ && CQ.render) { cleanup = CQ.render(app, hash.split("/").map(decodeURIComponent), ctx) || null; }
    else if (route === "interview" && I.interview) { cleanup = I.interview.render(app, hash.split("/").slice(1).map(decodeURIComponent), ctx) || null; }
    else (views[route] || home)(app, arg ? decodeURIComponent(arg) : undefined);
    if (!location.hash.includes("#sec-")) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);

  // ---------------- views ----------------
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
    const nl = nextLesson();
    const rnd = seeded(today());
    const dl = lessons.length ? lessons[Math.floor(rnd() * lessons.length)] : null;
    const ql = lessons.filter(l => l.quiz && l.quiz.length);
    const qLesson = ql.length ? ql[Math.floor(rnd() * ql.length)] : null;
    const q = qLesson ? qLesson.quiz[Math.floor(rnd() * qLesson.quiz.length)] : null;
    const g = I.glossary.length ? I.glossary[Math.floor(rnd() * I.glossary.length)] : null;
    app.innerHTML = `
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
    app.innerHTML = `
      <div class="crumbs"><a href="#/learn">${t("navLearn")}</a></div>
      <div class="track-head"><span class="ticon">${tr.icon}</span><div><h1 style="margin:0">${esc(L(tr.title))}</h1><p class="muted" style="margin:0">${esc(L(tr.blurb))}</p></div></div>
      <div class="lesson-list">${ls.length ? ls.map(l => `
        <a class="card lesson-item" href="#/lesson/${l.id}">
          <span class="licon">${l.icon || "📄"}</span>
          <span class="ltext"><b>${esc(L(l.title))}</b><span>${esc(L(l.tldr))}</span></span>
          <span class="tag">${I.ui.level[S.lang][l.level || 1] || ""}</span>
          <span class="tag">${l.minutes || 5} ${t("min")}</span>
          <span class="check ${S.done[l.id] ? "on" : ""}">${S.done[l.id] ? "✓" : ""}</span>
        </a>`).join("") : `<p class="muted">${t("comingSoon")}</p>`}</div>
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
    const tr = trackOf(l.track) || { title: { en: "", he: "" }, icon: "" };
    const idx = lessons.indexOf(l); const prev = lessons[idx - 1]; const next = lessons[idx + 1];
    const secs = [];
    const sec = (key, title, html, cls) => { secs.push([key, title]); return `<section id="sec-${key}" class="${cls || ""}"><h2>${title}</h2>${html}</section>`; };
    let body = "";
    body += `<div class="tldr">⚡ ${esc(L(l.tldr))}</div>`;
    if (l.analogy) body += `<div class="card analogy" style="margin-top:16px"><div class="label">🎭 ${t("analogy")}</div><div>${L(l.analogy)}</div></div>`;
    (l.sections || []).forEach((s, i) => { body += sec("s" + i, esc(L(s.h)), `<div class="section-body">${L(s.body)}</div>`); });
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
      const rel = l.related.map(r => byId[r]).filter(Boolean);
      if (rel.length) body += `<h2>🔗 ${t("related")}</h2><div class="row">${rel.map(r => `<a class="btn small" href="#/lesson/${r.id}">${r.icon || ""} ${esc(L(r.title))}</a>`).join("")}</div>`;
    }
    body += `<div class="lesson-footer">
      ${prev ? `<a class="btn" href="#/lesson/${prev.id}">${t("prev")}</a>` : ""}
      <span class="spacer"></span>
      <button class="btn ${S.done[l.id] ? "good" : "primary"}" id="doneBtn">${S.done[l.id] ? t("done") : t("markDone")}</button>
      ${next ? `<a class="btn" href="#/lesson/${next.id}">${t("next")}</a>` : ""}
    </div>`;
    app.innerHTML = `
      <div class="crumbs"><a href="#/learn">${t("navLearn")}</a> › <a href="#/track/${l.track}">${tr.icon} ${esc(L(tr.title))}</a></div>
      <div class="lesson-layout">
        <article class="lesson">
          <h1><span>${l.icon || "📄"}</span><span>${esc(L(l.title))}</span></h1>
          <div class="row" style="margin-bottom:14px"><span class="tag">${I.ui.level[S.lang][l.level || 1]}</span><span class="tag">⏱ ${l.minutes || 5} ${t("min")}</span>${S.done[l.id] ? `<span class="tag" style="color:var(--good)">✓ ${t("done")}</span>` : ""}</div>
          ${body}
        </article>
        <aside class="toc">${secs.map(([k, ti]) => `<a href="javascript:void 0" data-sec="${k}">${ti.replace(/<[^>]+>.*$/, "")}</a>`).join("")}</aside>
      </div>`;
    $$("[data-copy]", app).forEach(b => b.onclick = () => copy(b.dataset.copy));
    $$("[data-sec]", app).forEach(a => a.onclick = () => { const s = $("#sec-" + a.dataset.sec); if (s) s.scrollIntoView({ behavior: "smooth" }); });
    if (l.quiz) { const qb = $("#quizBox"); l.quiz.forEach((q, i) => { const d = document.createElement("div"); qb.appendChild(d); renderQuizQ(d, q, l.id + ":" + i, 10); }); }
    const notes = $("#notes"); notes.oninput = () => { S.notes[l.id] = notes.value; save(); };
    $("#doneBtn").onclick = () => {
      if (S.done[l.id]) return;
      S.done[l.id] = today(); save(); addXP(50, "+50 XP 🎓"); confetti();
      const b = $("#doneBtn"); b.textContent = t("done"); b.classList.remove("primary"); b.classList.add("good");
    };
    $("#askCopy").onclick = () => copy(lessonPrompt(l, $("#askQ").value));
    if (l.playground && I.sims && I.sims[l.playground]) cleanup = mountSim($("#lessonSim"), l.playground);
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
            <option value="eng" selected>${he ? "🧑‍💻 כמו למפתח/ת" : "🧑‍💻 Like to a developer"}</option>
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
