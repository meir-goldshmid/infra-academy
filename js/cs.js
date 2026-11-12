/* CS Degree: Duolingo-style step lessons (merged from CS Degree Quest), bilingual, sharing XP/streak with Infra Academy. */
(function () {
  "use strict";
  const CQ = window.CQ || { units: [], he: {}, widgets: {} };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const QT = ["mcq", "tf", "input", "order"];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => String(s || "").toLowerCase().replace(/[\s'"`.,;:!?()[\]{}_\-–—·×*^]+/g, "").replace(/²/g, "2").replace(/³/g, "3");
  function inputCorrect(given, answer) {
    const g = norm(given); if (!g) return false;
    return [].concat(answer).some(a => {
      const n = norm(a); if (n === g) return true;
      return /^-?[\d.]+(e-?\d+)?$/.test(g) && /^-?[\d.]+(e-?\d+)?$/.test(n) && Math.abs(parseFloat(g) - parseFloat(n)) <= 1e-9 * Math.max(1, Math.abs(parseFloat(n)));
    });
  }
  const PRAISE = { en: ["Nice!", "Correct!", "Nailed it!", "Ship it! 🚀", "Green build ✅", "Exactly right!"], he: ["יפה!", "נכון!", "בול!", "Ship it! 🚀", "Build ירוק ✅", "בדיוק!"] };
  const OOPS = { en: ["Not quite.", "Close, but no.", "Rollback! 🔙", "That one bites everyone."], he: ["לא בדיוק.", "קרוב, אבל לא.", "Rollback! 🔙", "על זה כולם נופלים."] };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function unitsFor(lang) { return CQ.units.map(u => (lang === "he" && CQ.he[u.id]) ? Object.assign({}, CQ.he[u.id], { _en: u }) : u); }
  function stepByRef(ref, lang) {
    const [uid, lid, i] = ref.split("/"); const u = unitsFor(lang).find(x => x.id === uid); const l = u && u.lessons.find(x => x.id === lid);
    return l && l.steps[+i] ? { u, l, step: l.steps[+i] } : null;
  }
  CQ.searchItems = (lang) => {
    const out = [];
    unitsFor(lang).forEach(u => u.lessons.forEach(l => out.push({ u, l, text: l.steps.map(s => (s.title || "") + " " + (s.html || "") + " " + (s.q || "")).join(" ") })));
    return out;
  };

  function render(app, parts, C) {
    const S = C.S; const lang = S.lang; const he = lang === "he"; const T = (en, h) => he ? h : en; const { esc } = C;
    S.cs = S.cs || { done: {}, missed: {} };
    const cs = S.cs;
    const units = unitsFor(lang);
    const [, sub, a, b] = parts;
    const crumbs = `<div class="crumbs"><a href="#/cs">🎓 ${T("CS Degree", "תואר במדעי המחשב")}</a></div>`;
    const lessonDone = (u, l) => cs.done[`${u.id}/${l.id}`];
    const unitPct = (u) => Math.round(u.lessons.filter(l => lessonDone(u, l)).length / u.lessons.length * 100);
    const missedCount = Object.keys(cs.missed).filter(r => stepByRef(r, lang)).length;

    if (!units.length) { app.innerHTML = `<p class="muted">CS content failed to load.</p>`; return null; }

    // ---------- unit ----------
    if (sub === "unit" && a) {
      const u = units.find(x => x.id === a); if (!u) { location.hash = "#/cs"; return null; }
      const next = u.lessons.find(l => !lessonDone(u, l)) || u.lessons[0];
      app.innerHTML = `${crumbs}<div class="track-head"><span class="ticon">${u.emoji}</span><div><h1 style="margin:0">${esc(u.title)}</h1><p class="muted" style="margin:0">${esc(u.tagline)}</p></div></div>
        ${!CQ.he[u.id] && he ? `<p class="tag">🇬🇧 ${"היחידה הזו עדיין באנגלית — התרגום בדרך"}</p>` : ""}
        <div class="row" style="margin-bottom:14px"><a class="btn primary" href="#/cs/lesson/${u.id}/${next.id}">▶ ${esc(next.emoji)} ${esc(next.title)}</a></div>
        <div class="lesson-list">${u.lessons.map((l, i) => { const d = lessonDone(u, l); const qn = l.steps.filter(s => QT.includes(s.type)).length;
          return `<a class="card lesson-item" href="#/cs/lesson/${u.id}/${l.id}"><span class="licon">${l.emoji}</span><span class="ltext"><b>${i + 1}. ${esc(l.title)}</b><span>${l.steps.length} ${T("steps", "שלבים")} · ${qn} ${T("questions", "שאלות")}${d ? ` · 🎯 ${Math.round(d.acc * 100)}%` : ""}</span></span><span class="check ${d ? "on" : ""}">${d ? "✓" : ""}</span></a>`; }).join("")}</div>`;
      return null;
    }

    // ---------- lesson / review player ----------
    if ((sub === "lesson" && a && b) || sub === "review") {
      let queue, title, u, l, mode;
      if (sub === "review") {
        mode = "review"; title = T("Review your mistakes", "חזרה על טעויות");
        queue = shuffle(Object.keys(cs.missed)).map(r => { const x = stepByRef(r, lang); return x && Object.assign({}, x.step, { _ref: r, _src: `${x.u.emoji} ${x.l.title}` }); }).filter(Boolean).slice(0, 12);
        if (!queue.length) { app.innerHTML = `${crumbs}<div class="card" style="text-align:center"><h2>🧠 ${T("Nothing to review — clean record!", "אין מה לחזור — רקורד נקי!")}</h2></div>`; return null; }
      } else {
        u = units.find(x => x.id === a); l = u && u.lessons.find(x => x.id === b);
        if (!l) { location.hash = "#/cs"; return null; }
        mode = "lesson"; title = l.title;
        queue = l.steps.map((s, i) => Object.assign({}, s, { _ref: `${u.id}/${l.id}/${i}` }));
      }
      const totalQ = queue.filter(s => QT.includes(s.type)).length;
      let pos = 0, firstTry = 0, xp = 0, combo = 0;
      app.innerHTML = `<div class="cs-player"><div class="cs-top"><a class="btn small" href="${mode === "review" ? "#/cs" : "#/cs/unit/" + u.id}">✕</a><div class="rank-bar" style="flex:1;margin:0"><div id="pbar" style="width:0%"></div></div><span id="combo" class="tag"></span></div>
        <div class="muted" style="font-size:.9em;margin:6px 0">${mode === "lesson" ? `${u.emoji} ${esc(u.title)} › ` : ""}<b>${esc(title)}</b></div>
        <div class="card cs-stage" id="stage"></div><div id="foot" class="cs-foot"></div></div>`;
      const setTop = () => { $("#pbar").style.width = (pos / queue.length * 100) + "%"; $("#combo").textContent = combo >= 3 ? `🔥${combo}` : ""; };
      const footer = (state, html, label, onClick, disabled) => {
        const f = $("#foot"); f.className = "cs-foot " + (state || "");
        f.innerHTML = `<div class="cs-fb">${html || ""}</div><button class="btn ${state === "good" ? "good" : state === "bad" ? "bad" : "primary"}" id="fbtn" ${disabled ? "disabled" : ""}>${label}</button>`;
        $("#fbtn").onclick = onClick; return $("#fbtn");
      };
      const next = () => { pos++; show(); };
      const grade = (ok, s, mark, correctText) => {
        mark();
        if (ok) {
          combo++; if (!s._retry) firstTry++;
          const gain = s._retry ? 5 : 10; xp += gain;
          if (cs.missed[s._ref]) { cs.missed[s._ref]--; if (cs.missed[s._ref] <= 0) delete cs.missed[s._ref]; }
          footer("good", `<b>🎉 ${pick(PRAISE[lang])}</b> <span class="tag">+${gain} XP</span><div>${s.explain || ""}</div>`, T("Continue", "המשך"), next);
        } else {
          combo = 0; cs.missed[s._ref] = (cs.missed[s._ref] || 0) + 1;
          const tries = (s._tries || 0) + 1;
          if (tries <= 2 && mode === "lesson") queue.push(Object.assign({}, s, { _retry: true, _tries: tries }));
          footer("bad", `<b>🤔 ${pick(OOPS[lang])}</b><div class="cs-correct">${T("Answer", "תשובה")}: ${correctText}</div><div>${s.explain || ""}</div>${tries <= 2 && mode === "lesson" ? `<div class="muted" style="font-size:.85em">↻ ${T("You'll see this one again in a moment.", "השאלה הזו תחזור עוד רגע.")}</div>` : ""}`, T("Got it", "הבנתי"), next);
        }
        C.save(); setTop();
      };
      const show = () => {
        setTop();
        if (pos >= queue.length) return finish();
        const s = queue[pos]; const st = $("#stage"); window.scrollTo(0, 0);
        const src = s._src ? `<div class="muted" style="font-size:.85em">${esc(s._src)}</div>` : "";
        const retry = s._retry ? `<div class="cs-qlabel" style="color:var(--warn)">↻ ${T("Let's try that again", "בוא/י ננסה שוב")}</div>` : "";
        if (s.type === "learn") {
          st.innerHTML = `${s.title ? `<h2 style="margin-top:0">${s.title}</h2>` : ""}<div class="learn-body">${s.html}</div>`;
          footer("", "", T("Continue", "המשך"), next);
        } else if (s.type === "widget") {
          st.innerHTML = `${s.title ? `<h2 style="margin-top:0">${s.title}</h2>` : ""}<div class="learn-body">${s.html || ""}</div><div id="wmount" dir="ltr"></div>`;
          const w = CQ.widgets[s.widget]; if (w) try { w($("#wmount"), s); } catch (e) { console.error(e); }
          footer("", "", T("Continue", "המשך"), next);
        } else if (s.type === "mcq") {
          const order = shuffle(s.choices.map((c, i) => i)); let sel = null;
          st.innerHTML = `${retry}${src}<div class="cs-qlabel">${T("Choose the answer", "בחר/י את התשובה")}</div><h2>${s.q}</h2><div class="opts cs-choices">${order.map((i, k) => `<button class="opt" data-i="${i}"><span class="cs-key">${k + 1}</span> ${s.choices[i]}</button>`).join("")}</div>`;
          const btn = footer("", "", T("Check", "בדיקה"), () => grade(sel === s.answer, s, () => $$(".opt", st).forEach(c => { c.disabled = true; if (+c.dataset.i === s.answer) c.classList.add("correct"); else if (+c.dataset.i === sel) c.classList.add("wrong"); }), s.choices[s.answer]), true);
          $$(".opt", st).forEach(c => c.onclick = () => { sel = +c.dataset.i; $$(".opt", st).forEach(x => x.classList.toggle("sel", x === c)); btn.disabled = false; });
        } else if (s.type === "tf") {
          let sel = null;
          st.innerHTML = `${retry}${src}<div class="cs-qlabel">${T("True or false?", "נכון או לא נכון?")}</div><h2>${s.q}</h2><div class="cs-tf"><button class="opt" data-v="1">👍 ${T("True", "נכון")}</button><button class="opt" data-v="0">👎 ${T("False", "לא נכון")}</button></div>`;
          const btn = footer("", "", T("Check", "בדיקה"), () => grade(sel === s.answer, s, () => $$(".opt", st).forEach(c => { c.disabled = true; const v = c.dataset.v === "1"; if (v === s.answer) c.classList.add("correct"); else if (v === sel) c.classList.add("wrong"); }), s.answer ? T("True", "נכון") : T("False", "לא נכון")), true);
          $$(".opt", st).forEach(c => c.onclick = () => { sel = c.dataset.v === "1"; $$(".opt", st).forEach(x => x.classList.toggle("sel", x === c)); btn.disabled = false; });
        } else if (s.type === "input") {
          st.innerHTML = `${retry}${src}<div class="cs-qlabel">${T("Type the answer", "הקלד/י את התשובה")}</div><h2>${s.q}</h2><input class="cs-input" id="ans" placeholder="${esc(s.placeholder || T("Your answer", "התשובה שלך"))}" autocomplete="off" spellcheck="false">`;
          const inp = $("#ans");
          const check = () => { if (!inp.value.trim()) return; const ok = inputCorrect(inp.value, s.answer); grade(ok, s, () => { inp.disabled = true; inp.classList.add(ok ? "right" : "wrong"); }, esc([].concat(s.answer)[0])); };
          const btn = footer("", "", T("Check", "בדיקה"), check, true);
          inp.oninput = () => { btn.disabled = !inp.value.trim(); };
          inp.onkeydown = (e) => { if (e.key === "Enter" && !btn.disabled && !inp.disabled) check(); };
          setTimeout(() => inp.focus({ preventScroll: true }), 150);
        } else if (s.type === "order") {
          const pool = shuffle(s.items.map((t, i) => ({ t, i }))); if (pool.every((p, k) => p.i === k)) pool.reverse();
          const chosen = [];
          st.innerHTML = `${retry}${src}<div class="cs-qlabel">${T("Put in order", "סדר/י לפי הסדר")}</div><h2>${s.q}</h2><div class="cs-slots" id="slots"></div><div class="cs-pool" id="pool"></div>`;
          const btn = footer("", "", T("Check", "בדיקה"), () => { const ok = chosen.every((p, k) => p.i === k); grade(ok, s, () => { $("#slots").classList.add(ok ? "right" : "wrong"); $$(".tok", st).forEach(t => t.disabled = true); }, s.items.join(" → ")); }, true);
          const draw = () => {
            $("#slots").innerHTML = chosen.map((p, k) => `<button class="tok" data-k="${k}"><b>${k + 1}</b> ${p.t}</button>`).join("") || `<span class="muted" style="font-size:.85em">${T("Tap items below in the right order", "הקישו על הפריטים למטה לפי הסדר הנכון")}</span>`;
            $("#pool").innerHTML = pool.filter(p => !chosen.includes(p)).map(p => `<button class="tok" data-i="${p.i}">${p.t}</button>`).join("");
            $$("#slots .tok", st).forEach(x => x.onclick = () => { chosen.splice(+x.dataset.k, 1); draw(); });
            $$("#pool .tok", st).forEach(x => x.onclick = () => { chosen.push(pool.find(p => p.i === +x.dataset.i)); draw(); });
            btn.disabled = chosen.length !== s.items.length;
          };
          draw();
        }
      };
      const finish = () => {
        const acc = totalQ ? firstTry / totalQ : 1; let bonus;
        if (mode === "lesson") { const k = `${u.id}/${l.id}`; const prev = cs.done[k]; bonus = (prev ? 10 : 25) + (acc >= 1 ? 15 : 0); cs.done[k] = { acc: Math.max(acc, prev ? prev.acc : 0), times: (prev ? prev.times : 0) + 1, at: new Date().toISOString().slice(0, 10) }; }
        else bonus = 15;
        xp += bonus; C.save(); C.addXP(xp); C.confetti();
        const nextL = mode === "lesson" ? (u.lessons[u.lessons.indexOf(l) + 1] || null) : null;
        app.innerHTML = `<div class="card" style="text-align:center;max-width:560px;margin:20px auto"><div style="font-size:4em">${acc >= 1 ? "💎" : mode === "review" ? "🧠" : "⭐"}</div>
          <h1>${acc >= 1 ? T("Flawless!", "מושלם!") : acc >= .7 ? T("Great job!", "עבודה מצוינת!") : T("Done! The review will lock it in.", "סיימת! החזרה תקבע את זה.")}</h1>
          <div class="stats"><div class="stat"><b>+${xp}</b>XP</div><div class="stat"><b>${Math.round(acc * 100)}%</b>${T("accuracy", "דיוק")}</div><div class="stat"><b>${totalQ}</b>${T("questions", "שאלות")}</div></div>
          <div class="row" style="justify-content:center;margin-top:18px">${nextL ? `<a class="btn primary" href="#/cs/lesson/${u.id}/${nextL.id}">${T("Next lesson", "השיעור הבא")}: ${nextL.emoji} ${esc(nextL.title)}</a>` : ""}<a class="btn" href="${mode === "lesson" ? "#/cs/unit/" + u.id : "#/cs"}">${T("Back", "חזרה")}</a></div></div>`;
      };
      show();
      return null;
    }

    // ---------- map ----------
    const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0);
    const doneLessons = units.reduce((n, u) => n + u.lessons.filter(l => lessonDone(u, l)).length, 0);
    const nextU = units.find(u => u.lessons.some(l => !lessonDone(u, l))) || units[0];
    const nextL = nextU.lessons.find(l => !lessonDone(nextU, l)) || nextU.lessons[0];
    app.innerHTML = `<h1>🎓 ${T("The CS degree you never took", "התואר במדעי המחשב שלא עשית")}</h1>
      <p class="muted">${T("Logic, bits, proofs, logs, Big-O, probability, data structures, algorithms, graphs, calculus, linear algebra and theory of computation — in 5-minute lessons, every concept tied back to Kubernetes, Postgres, Redis and incidents.", "לוגיקה, ביטים, הוכחות, לוגריתמים, Big-O, הסתברות, מבני נתונים, אלגוריתמים, גרפים, חדו\"א, אלגברה לינארית ותורת החישוביות — בשיעורים של 5 דקות, וכל מושג מחובר ל-Kubernetes, Postgres, Redis ותקלות.")}</p>
      <div class="row" style="margin-bottom:16px"><a class="btn primary" href="#/cs/lesson/${nextU.id}/${nextL.id}">▶ ${nextU.emoji} ${esc(nextL.title)}</a>
        <a class="btn" href="#/cs/review">🔁 ${T("Review mistakes", "חזרה על טעויות")} <span class="tag">${missedCount}</span></a>
        <a class="btn" href="#/interview/coding">🧩 ${T("Practice coding problems", "תרגול בעיות קוד")}</a>
        <span class="tag">${doneLessons}/${totalLessons} ${T("lessons", "שיעורים")}</span></div>
      <div class="grid">${units.map((u) => { const p = unitPct(u); return `<a class="card track-card" href="#/cs/unit/${u.id}" style="--tc:${u.color}"><span class="step">${u.order}</span><span class="ticon">${u.emoji}</span><h3>${esc(u.title)}</h3><p>${esc(u.tagline)}</p>
        <div class="row"><span class="tag">${u.lessons.length} ${T("lessons", "שיעורים")}</span>${he && !CQ.he[u.id] ? `<span class="tag">EN</span>` : ""}</div><div class="bar"><div style="width:${p}%"></div></div></a>`; }).join("")}</div>`;
    return null;
  }

  CQ.render = render;
})();
