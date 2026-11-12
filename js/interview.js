/* Interview prep: system design cases, coding problems, mock interview, question bank, behavioral. */
(function () {
  "use strict";
  const I = window.INFRA;
  I.designs = I.designs || []; I.problems = I.problems || [];
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const behavioral = [
    { q: { en: "Tell me about the worst production incident you were part of.", he: "ספר/י על התקלה הכי גרועה בפרודקשן שהיית חלק ממנה." },
      tip: { en: "STAR: Situation (impact in numbers), Task (your role — IC? responder?), Action (how you detected, mitigated FIRST, then found root cause), Result (MTTR, postmortem action items you drove). Show blamelessness.", he: "STAR: Situation (ההשפעה במספרים), Task (התפקיד שלך — IC? מגיב/ה?), Action (איך זוהה, איך ייצבתם קודם, ואז שורש הבעיה), Result (MTTR, ה-action items מה-postmortem שהובלת). להראות גישה blameless." } },
    { q: { en: "How do you decide between shipping a feature and improving reliability?", he: "איך מחליטים בין לשחרר פיצ'ר לבין לשפר אמינות?" },
      tip: { en: "Talk SLOs and error budgets: budget left → ship; budget burned → reliability work wins. Data over opinions.", he: "לדבר על SLO ו-error budget: נשאר תקציב → משחררים; נשרף → עבודת אמינות מנצחת. נתונים במקום דעות." } },
    { q: { en: "Tell me about a time you reduced cloud cost.", he: "ספר/י על פעם שהורדת עלויות ענן." },
      tip: { en: "Numbers! Baseline → what you measured (tagging, cost explorer) → changes (rightsizing, spot, NAT/egress, log retention) → % saved, with no SLO regression.", he: "מספרים! מצב התחלתי → מה מדדת (tagging, cost explorer) → מה שינית (rightsizing, spot, NAT/egress, retention של לוגים) → כמה % נחסך, בלי פגיעה ב-SLO." } },
    { q: { en: "You disagree with a senior engineer's architecture. What do you do?", he: "את/ה לא מסכים/ה עם ארכיטקטורה של מהנדס/ת בכיר/ה. מה עושים?" },
      tip: { en: "Disagree with data: write a short design doc comparing options against requirements, propose a small experiment/PoC, commit once decided.", he: "חולקים עם נתונים: מסמך design קצר שמשווה אפשרויות מול הדרישות, מציעים ניסוי/PoC קטן, ומתחייבים כשהוחלט (disagree & commit)." } },
    { q: { en: "How would you onboard a legacy service with no monitoring?", he: "איך היית מכניס/ה שירות legacy בלי ניטור בכלל?" },
      tip: { en: "Start from the user: define 1-2 SLIs (availability, latency) → golden signals dashboard → symptom-based alerts with runbooks → logs with request IDs → traces later.", he: "מתחילים מהמשתמש: 1-2 SLIs (זמינות, latency) → דשבורד golden signals → התראות על סימפטומים עם runbooks → לוגים עם request IDs → traces אחר כך." } },
    { q: { en: "What happens when you type a URL in the browser and press Enter?", he: "מה קורה כשמקלידים URL בדפדפן ולוחצים Enter?" },
      tip: { en: "The classic. Go layer by layer and pick where to go deep: DNS (cache → resolver → root/TLD/authoritative), TCP handshake, TLS, HTTP, LB/CDN, reverse proxy, app, DB, response, rendering.", he: "הקלאסיקה. עוברים שכבה-שכבה ובוחרים איפה להעמיק: DNS (cache → resolver → root/TLD/authoritative), TCP handshake, TLS, HTTP, LB/CDN, reverse proxy, אפליקציה, DB, תשובה, רינדור." } },
    { q: { en: "A service's p99 latency doubled after a deploy but CPU is low. Walk me through it.", he: "ה-p99 של שירות הוכפל אחרי deploy אבל ה-CPU נמוך. תעבור/י איתי על זה." },
      tip: { en: "Mitigate (rollback?) vs investigate. Check: downstream dependency latency (traces), DB slow queries / missing index, connection pool exhaustion, GC pauses, CPU throttling (limits!), lock contention, retries storm.", he: "קודם לייצב (rollback?) או לחקור. לבדוק: latency של תלויות (traces), שאילתות איטיות / אינדקס חסר, מיצוי connection pool, GC pauses, CPU throttling (limits!), נעילות, סערת retries." } },
    { q: { en: "Why do you want to work in infrastructure / SRE?", he: "למה את/ה רוצה לעבוד בתשתיות / SRE?" },
      tip: { en: "Be genuine and specific: a moment you enjoyed debugging a system end-to-end, automating toil, or making something measurably more reliable.", he: "להיות כנים וספציפיים: רגע שנהנית לדבג מערכת מקצה לקצה, לאטמט עבודה שחורה, או להפוך משהו לאמין יותר באופן מדיד." } },
    { q: { en: "[Staff+] Tell me about a technical decision you drove across multiple teams.", he: "[Staff+] ספר/י על החלטה טכנית שהובלת מול כמה צוותים." },
      tip: { en: "Scope is the signal: how many teams/services, what was ambiguous, the options you compared (with a design doc/RFC), how you got buy-in from people who disagreed, and the measurable outcome 6-12 months later.", he: "ה-scope הוא הסיגנל: כמה צוותים/שירותים, מה היה עמום, אילו אופציות השווית (עם design doc/RFC), איך השגת buy-in ממי שהתנגד, ומה התוצאה המדידה אחרי 6-12 חודשים." } },
    { q: { en: "[Staff+] Tell me about a time you were wrong about a big technical bet.", he: "[Staff+] ספר/י על פעם שטעית בהימור טכני גדול." },
      tip: { en: "Own it without drama: what signal you missed, when you noticed, how you limited the blast radius (reversible decision? rollback plan?), and what you changed in how you decide now.", he: "לקחת אחריות בלי דרמה: איזה סיגנל פספסת, מתי שמת לב, איך הגבלת את ה-blast radius (החלטה הפיכה? תוכנית rollback?), ומה שינית מאז בדרך שבה את/ה מחליט/ה." } },
    { q: { en: "[Staff+] How did you raise the engineering bar beyond your own team?", he: "[Staff+] איך הרמת את הרף ההנדסי מעבר לצוות שלך?" },
      tip: { en: "Leverage, not heroics: a paved road, a PRR checklist, an SLO program, a migration tool, mentoring that produced other leads. Show adoption numbers.", he: "מינוף, לא גבורה: paved road, צ'קליסט PRR, תוכנית SLO, כלי מיגרציה, mentoring שהצמיח עוד מובילים. להראות מספרי אימוץ." } },
    { q: { en: "[Staff+] Leadership wants a big rewrite you believe is a mistake. What do you do?", he: "[Staff+] ההנהלה רוצה rewrite גדול שלדעתך הוא טעות. מה עושים?" },
      tip: { en: "Understand the real goal first, quantify cost/risk, offer an incremental alternative (strangler fig), write it down BLUF, then disagree & commit if overruled — and set checkpoints to revisit.", he: "קודם להבין את המטרה האמיתית, לכמת עלות/סיכון, להציע חלופה הדרגתית (strangler fig), לכתוב BLUF, ואם הוחלט אחרת — disagree & commit, עם נקודות בדיקה לחזור להחלטה." } },
    { q: { en: "[Staff+] Walk me through the most complex system you owned, end to end.", he: "[Staff+] תעבור/י איתי על המערכת הכי מורכבת שהייתה באחריותך, מקצה לקצה." },
      tip: { en: "Expect to be drilled 3-4 levels deep. Prepare: architecture diagram, numbers (QPS, data size, SLO, cost), the hardest failure you hit, what you'd redesign today and why.", he: "לצפות לחפירה של 3-4 רמות לעומק. להכין: דיאגרמה, מספרים (QPS, נפח נתונים, SLO, עלות), התקלה הכי קשה, ומה היית מתכנן/ת אחרת היום ולמה." } }
  ];

  const checklist = [
    { en: "Explain your last system end-to-end on a whiteboard in 5 minutes (traffic path, data, deploy, monitoring).", he: "להסביר את המערכת האחרונה שלך מקצה לקצה על לוח ב-5 דקות (מסלול התעבורה, מידע, deploy, ניטור)." },
    { en: "Have 3 incident stories ready in STAR form, with numbers.", he: "3 סיפורי תקלות מוכנים בפורמט STAR, עם מספרים." },
    { en: "Know your latency & capacity numbers (RAM vs SSD vs network, QPS per server).", he: "להכיר מספרי latency וקיבולת (RAM מול SSD מול רשת, QPS לשרת)." },
    { en: "Practice 2 design cases out loud with a timer this week.", he: "לתרגל 2 תרגילי design בקול עם טיימר השבוע." },
    { en: "Solve one medium coding problem per day, explaining while you type.", he: "לפתור בעיית קוד medium אחת ביום, ולהסביר תוך כדי הקלדה." },
    { en: "Prepare questions for them: on-call load, SLOs, postmortem culture, how deploys work.", he: "להכין שאלות אליהם: עומס תורנויות, SLOs, תרבות postmortem, איך עובדים deploys." }
  ];

  function render(app, parts, C) {
    const { L, t, esc } = C; const S = C.S; const he = S.lang === "he";
    S.iv = S.iv || { design: {}, code: {}, attempts: {}, mocks: [] };
    const iv = S.iv;
    const T = (en, h) => he ? h : en;
    const [sub, id] = parts;
    const crumbs = `<div class="crumbs"><a href="#/interview">${t("navInterview")}</a></div>`;
    const diffColor = { easy: "var(--good)", medium: "var(--warn)", hard: "var(--bad)" };

    // ---------- design case ----------
    if (sub === "design" && id) {
      const d = I.designs.find(x => x.id === id); if (!d) { location.hash = "#/interview"; return; }
      const list = (arr) => `<ul>${(arr || []).map(x => `<li>${L(x)}</li>`).join("")}</ul>`;
      const step = (n, title, html, open) => `<details class="qa" ${open ? "open" : ""}><summary>${n}. ${title}</summary><div style="margin-top:8px">${html}</div></details>`;
      app.innerHTML = `${crumbs}<h1>${d.icon || "🏛️"} ${esc(L(d.title))}</h1>
        <div class="tldr">🎤 ${L(d.prompt)}</div>
        <div class="card" style="margin-top:14px"><b>⏱️ ${T("Try it yourself first", "נסו קודם לבד")}</b>
          <p class="muted" style="margin:.3em 0">${T("Set a timer, sketch on paper (or in the box below) and talk out loud. Then open the steps one by one and compare.", "הפעילו טיימר, שרטטו על דף (או בתיבה למטה) ודברו בקול. אחר כך פתחו את השלבים אחד-אחד והשוו.")}</p>
          <div class="row"><button class="btn" data-min="45">45:00</button><button class="btn" data-min="20">20:00</button><span id="timer" class="tag" style="font-size:1.1em"></span></div>
          <textarea class="notes" id="att" style="margin-top:10px" placeholder="${T("Your answer: requirements, numbers, components…", "התשובה שלך: דרישות, מספרים, רכיבים…")}">${esc(iv.attempts["d:" + d.id] || "")}</textarea></div>
        <h2>🪜 ${T("The model answer, step by step", "תשובה לדוגמה, שלב אחרי שלב")}</h2>
        ${step(1, T("Clarifying questions", "שאלות הבהרה"), list(d.clarify))}
        ${step(2, T("Requirements", "דרישות"), `<b>${T("Functional", "פונקציונליות")}</b>${list(d.functional)}<b>${T("Non-functional", "לא פונקציונליות")}</b>${list(d.nonFunctional)}`)}
        ${step(3, T("Back-of-the-envelope estimates", "הערכות גסות (Back-of-envelope)"), L(d.estimates))}
        ${step(4, "API", `<pre>${esc(d.api)}</pre>`)}
        ${step(5, T("Data model", "מודל נתונים"), `<pre>${esc(d.dataModel)}</pre>`)}
        ${step(6, T("High-level architecture", "ארכיטקטורה ברמה גבוהה"), `<pre>${esc(d.diagram)}</pre>`)}
        ${(d.deepDives || []).map((x, i) => step(7 + i, "🔬 " + esc(L(x.h)), L(x.body))).join("")}
        ${step(7 + (d.deepDives || []).length, T("Trade-offs to say out loud", "Trade-offs שכדאי להגיד בקול"), list(d.tradeoffs))}
        ${(d.followUps || []).length ? `<h2>🔥 ${T("Interviewer follow-ups", "שאלות המשך של המראיין/ת")}</h2>${d.followUps.map(f => `<details class="qa"><summary>${L(f.q)}</summary><div style="margin-top:8px">${L(f.a)}</div></details>`).join("")}` : ""}
        ${(d.related || []).filter(r => C.byId[r]).length ? `<h2>📚 ${T("Brush up", "לרענן")}</h2><div class="row">${d.related.filter(r => C.byId[r]).map(r => `<a class="btn small" href="#/lesson/${r}">${C.byId[r].icon} ${esc(L(C.byId[r].title))}</a>`).join("")}</div>` : ""}
        <div class="lesson-footer"><span class="spacer"></span><button class="btn ${iv.design[d.id] ? "good" : "primary"}" id="doneD">${iv.design[d.id] ? T("Practiced ✓", "תורגל ✓") : T("I practiced this ✓", "תרגלתי את זה ✓")}</button></div>`;
      const att = $("#att"); att.oninput = () => { iv.attempts["d:" + d.id] = att.value; C.save(); };
      $("#doneD").onclick = () => { if (iv.design[d.id]) return; iv.design[d.id] = new Date().toISOString().slice(0, 10); C.save(); C.addXP(80, "+80 XP 🏛️"); C.confetti(); render(app, parts, C); };
      let timer = null;
      $$("[data-min]").forEach(b => b.onclick = () => {
        clearInterval(timer); let left = +b.dataset.min * 60;
        const show = () => { $("#timer").textContent = `⏱️ ${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`; };
        show(); timer = setInterval(() => { left--; show(); if (left <= 0) { clearInterval(timer); C.toast(T("⏰ Time! Now compare with the model answer.", "⏰ נגמר הזמן! עכשיו השוו לתשובה לדוגמה.")); } }, 1000);
      });
      return () => clearInterval(timer);
    }

    // ---------- coding problem ----------
    if (sub === "code" && id) {
      const p = I.problems.find(x => x.id === id); if (!p) { location.hash = "#/interview/coding"; return; }
      app.innerHTML = `<div class="crumbs"><a href="#/interview">${t("navInterview")}</a> › <a href="#/interview/coding">${T("Coding", "קוד")}</a></div>
        <h1>${p.icon || "🧩"} ${esc(L(p.title))}</h1>
        <div class="row" style="margin-bottom:12px"><span class="tag" style="color:${diffColor[p.difficulty]}">${p.difficulty}</span>${p.leetcode ? `<span class="tag">LeetCode ${esc(p.leetcode)}</span>` : ""}${(p.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>
        <div class="card">${L(p.statement)}${p.examples ? `<pre>${esc(p.examples)}</pre>` : ""}</div>
        <div class="card analogy" style="margin-top:14px"><div class="label">🏭 ${T("Where this lives in real infra", "איפה זה חי בתשתיות אמיתיות")}</div><div>${L(p.whyInfra)}</div></div>
        <h2>✍️ ${T("Your solution", "הפתרון שלך")}</h2>
        <textarea class="notes mono" id="att" spellcheck="false" style="min-height:220px;direction:ltr;text-align:left" placeholder="def solve(...):">${esc(iv.attempts["c:" + p.id] || "")}</textarea>
        <p class="muted" style="font-size:.88em">${T("Say your approach out loud before typing. Saved locally.", "אמרו את הגישה בקול לפני שמקלידים. נשמר מקומית.")}</p>
        <h2>💡 ${T("Hints", "רמזים")}</h2><div id="hints"></div><button class="btn small" id="hintBtn">${T("Next hint", "הרמז הבא")}</button>
        <h2>✅ ${T("Solution", "פתרון")}</h2>
        <details class="qa"><summary>${T("Reveal solution (try first!)", "הצג פתרון (לנסות קודם!)")}</summary>
          <div style="margin-top:8px"><div class="row" style="justify-content:flex-end"><button class="btn small" id="copySol">${t("copy")}</button></div><pre>${esc(p.solution)}</pre>${L(p.explain)}<p><b>⏱️ ${esc(p.complexity || "")}</b></p></div></details>
        ${(p.followUps || []).length ? `<h2>🔥 ${T("Follow-ups", "שאלות המשך")}</h2>${p.followUps.map(f => `<details class="qa"><summary>${L(f.q)}</summary><div style="margin-top:8px">${L(f.a)}</div></details>`).join("")}` : ""}
        <div class="lesson-footer"><span class="spacer"></span><button class="btn ${iv.code[p.id] ? "good" : "primary"}" id="doneC">${iv.code[p.id] ? T("Solved ✓", "נפתר ✓") : T("I solved it ✓", "פתרתי ✓")}</button></div>`;
      let h = 0; const hints = p.hints || [];
      const showHint = () => { $("#hints").innerHTML = hints.slice(0, h).map((x, i) => `<div class="pitfall" style="border-color:var(--warn);background:color-mix(in srgb,var(--warn) 9%,var(--surface))">💡 ${i + 1}. ${L(x)}</div>`).join(""); $("#hintBtn").disabled = h >= hints.length; };
      $("#hintBtn").onclick = () => { h++; showHint(); }; showHint();
      $("#copySol").onclick = () => C.copy(p.solution);
      const att = $("#att"); att.oninput = () => { iv.attempts["c:" + p.id] = att.value; C.save(); };
      att.onkeydown = (e) => { if (e.key === "Tab") { e.preventDefault(); const s = att.selectionStart; att.value = att.value.slice(0, s) + "    " + att.value.slice(att.selectionEnd); att.selectionStart = att.selectionEnd = s + 4; } };
      $("#doneC").onclick = () => { if (iv.code[p.id]) return; iv.code[p.id] = new Date().toISOString().slice(0, 10); C.save(); const xp = { easy: 30, medium: 60, hard: 100 }[p.difficulty] || 40; C.addXP(xp, `+${xp} XP 🧩`); C.confetti(); render(app, parts, C); };
      return null;
    }

    // ---------- lists ----------
    if (sub === "design") {
      app.innerHTML = `${crumbs}<h1>🏛️ ${T("System design", "System Design")}</h1><div class="grid">${I.designs.map(d => `<a class="card track-card" href="#/interview/design/${d.id}" style="--tc:var(--accent)"><span class="ticon">${d.icon || "🏛️"}</span><h3>${esc(L(d.title))}</h3><p>${esc(C.strip(L(d.prompt))).slice(0, 140)}</p><div class="row"><span class="tag">${"⭐".repeat(d.level || 1)}</span>${iv.design[d.id] ? `<span class="tag" style="color:var(--good)">✓</span>` : ""}</div></a>`).join("") || `<p class="muted">${t("comingSoon")}</p>`}</div>`;
      return null;
    }
    if (sub === "coding") {
      let f = "all";
      const draw = () => {
        const ps = I.problems.filter(p => f === "all" || p.difficulty === f || (f === "todo" && !iv.code[p.id]));
        $("#plist").innerHTML = ps.map(p => `<a class="card lesson-item" href="#/interview/code/${p.id}"><span class="licon">${p.icon || "🧩"}</span><span class="ltext"><b>${esc(L(p.title))}</b><span>${(p.tags || []).join(" · ")}</span></span>${p.leetcode ? `<span class="tag">LC ${esc(p.leetcode)}</span>` : ""}<span class="tag" style="color:${diffColor[p.difficulty]}">${p.difficulty}</span><span class="check ${iv.code[p.id] ? "on" : ""}">${iv.code[p.id] ? "✓" : ""}</span></a>`).join("") || `<p class="muted">${t("comingSoon")}</p>`;
      };
      app.innerHTML = `${crumbs}<h1>🧩 ${T("Coding practice", "תרגול קוד")}</h1><p class="muted">${T("LeetCode-style problems picked for infra/backend roles — each tied to where it shows up in real systems.", "בעיות בסגנון LeetCode שנבחרו לתפקידי תשתיות/backend — כל אחת מקושרת למקום שבו היא מופיעה במערכות אמיתיות.")}</p>
        <div class="row" style="margin-bottom:12px">${[["all", T("All", "הכול")], ["easy", "easy"], ["medium", "medium"], ["hard", "hard"], ["todo", T("Not solved yet", "עוד לא נפתרו")]].map(([k, l]) => `<button class="btn small" data-f="${k}">${l}</button>`).join("")}</div><div class="lesson-list" id="plist"></div>`;
      $$("[data-f]").forEach(b => b.onclick = () => { f = b.dataset.f; draw(); }); draw();
      return null;
    }
    if (sub === "bank") {
      app.innerHTML = `${crumbs}<h1>🗂️ ${T("Question bank", "מאגר שאלות")}</h1><p class="muted">${T("Every interview question from every lesson.", "כל שאלות הראיון מכל השיעורים.")}</p>
        <input id="bf" type="text" class="btn" style="width:100%;font-weight:400" placeholder="${t("filter")}"><div id="bl"></div>`;
      const draw = () => {
        const q = $("#bf").value.trim().toLowerCase();
        $("#bl").innerHTML = I.tracks.map(tr => {
          const items = [];
          C.lessons.filter(l => l.track === tr.id).forEach(l => (l.interview || []).forEach(x => { if (!q || C.strip(L(x.q) + " " + L(x.a)).toLowerCase().includes(q)) items.push({ l, x }); }));
          return items.length ? `<h2>${tr.icon} ${esc(L(tr.title))} <span class="tag">${items.length}</span></h2>` + items.map(({ l, x }) => `<details class="qa"><summary>${L(x.q)}</summary><div style="margin-top:8px">${L(x.a)}<p><a href="#/lesson/${l.id}">→ ${esc(L(l.title))}</a></p></div></details>`).join("") : "";
        }).join("");
      };
      $("#bf").oninput = draw; draw(); return null;
    }
    if (sub === "behavioral") {
      app.innerHTML = `${crumbs}<h1>🗣️ ${T("Behavioral & scenario questions", "שאלות התנהגותיות ותרחישים")}</h1>
        <p class="muted">${T("Infra interviews always include 'tell me about a time…' and 'walk me through…'. Practice out loud.", "ראיונות תשתיות תמיד כוללים 'ספר/י על פעם ש…' ו'תעבור/י איתי על…'. מתרגלים בקול.")}</p>
        ${behavioral.map(b => `<details class="qa"><summary>${L(b.q)}</summary><div style="margin-top:8px">💡 ${L(b.tip)}</div></details>`).join("")}
        <h2>✅ ${T("Interview-week checklist", "צ'קליסט לשבוע הראיון")}</h2><div class="card">${checklist.map((c, i) => `<label style="display:block;padding:4px 0"><input type="checkbox" data-ck="${i}" ${iv["ck" + i] ? "checked" : ""}> ${L(c)}</label>`).join("")}</div>`;
      $$("[data-ck]").forEach(cb => cb.onchange = () => { iv["ck" + cb.dataset.ck] = cb.checked; C.save(); });
      return null;
    }

    // ---------- mock interview ----------
    if (sub === "mock") {
      let qs = [], i = 0, scores = [], timer = null;
      const pool = (tracks) => {
        const out = [];
        C.lessons.filter(l => tracks.includes(l.track)).forEach(l => (l.interview || []).forEach(x => out.push({ q: x.q, a: x.a, track: l.track, lesson: l.id })));
        if (tracks.includes("design")) I.designs.forEach(d => (d.followUps || []).forEach(x => out.push({ q: x.q, a: x.a, track: "design", design: d.id })));
        return out.sort(() => Math.random() - .5);
      };
      const setup = () => {
        app.innerHTML = `${crumbs}<h1>🎙️ ${T("Mock interview", "ראיון מדומה")}</h1>
          <p class="muted">${T("Random questions, a timer per question, you answer (out loud or typed), then compare with the model answer and grade yourself honestly.", "שאלות אקראיות, טיימר לכל שאלה, עונים (בקול או בכתב), משווים לתשובה לדוגמה ומדרגים את עצמכם בכנות.")}</p>
          <div class="card"><b>${T("Topics", "נושאים")}</b><div class="row" style="margin:8px 0">${I.tracks.map(tr => `<label class="tag" style="font-size:.9em;padding:4px 10px"><input type="checkbox" data-tr="${tr.id}" checked> ${tr.icon} ${esc(L(tr.title))}</label>`).join("")}${I.designs.length ? `<label class="tag" style="font-size:.9em;padding:4px 10px"><input type="checkbox" data-tr="design" checked> 🏛️ System design</label>` : ""}</div>
          <div class="row"><label>${T("Questions", "שאלות")} <select id="cnt" class="btn"><option>5</option><option selected>8</option><option>12</option></select></label>
          <label>${T("Minutes per question", "דקות לשאלה")} <select id="mpq" class="btn"><option>2</option><option selected>3</option><option>5</option></select></label>
          <button class="btn primary" id="go">🎬 ${T("Start", "התחלה")}</button></div></div>
          ${iv.mocks.length ? `<h2>📈 ${T("History", "היסטוריה")}</h2><div class="card">${iv.mocks.slice(-8).reverse().map(m => `<div>${m.date} — <b>${m.pct}%</b> (${m.n} ${T("questions", "שאלות")})</div>`).join("")}</div>` : ""}`;
        $("#go").onclick = () => {
          const tracks = $$("[data-tr]").filter(c => c.checked).map(c => c.dataset.tr);
          qs = pool(tracks).slice(0, +$("#cnt").value); i = 0; scores = [];
          if (!qs.length) { C.toast(T("No questions for these topics yet", "אין עדיין שאלות לנושאים האלה")); return; }
          ask(+$("#mpq").value);
        };
      };
      const ask = (mpq) => {
        clearInterval(timer);
        if (i >= qs.length) return finish();
        const q = qs[i]; let left = mpq * 60;
        app.innerHTML = `${crumbs}<div class="row"><span class="tag">${i + 1} / ${qs.length}</span><span class="spacer"></span><span class="tag" id="tm" style="font-size:1.1em"></span></div>
          <div class="card" style="margin-top:12px"><h2 style="margin-top:0">🎤 ${L(q.q)}</h2>
          <textarea class="notes" id="ans" placeholder="${T("Answer out loud, or type key points…", "ענו בקול, או הקלידו נקודות עיקריות…")}"></textarea>
          <div class="row" style="margin-top:10px"><button class="btn primary" id="rev">${t("reveal")}</button></div><div id="model"></div></div>`;
        const tm = $("#tm"); const show = () => tm.textContent = `⏱️ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; show();
        timer = setInterval(() => { left--; show(); if (left <= 0) { clearInterval(timer); tm.style.color = "var(--bad)"; } }, 1000);
        $("#rev").onclick = () => {
          clearInterval(timer); $("#rev").remove();
          const link = q.lesson ? `<a href="#/lesson/${q.lesson}" target="_blank">→ ${esc(L(C.byId[q.lesson].title))}</a>` : q.design ? `<a href="#/interview/design/${q.design}" target="_blank">→ system design</a>` : "";
          $("#model").innerHTML = `<div class="explain quiz-q" style="margin-top:12px"><div class="explain">${L(q.a)}<p>${link}</p></div></div>
            <p><b>${T("How did you do?", "איך הלך?")}</b></p><div class="row"><button class="btn bad" data-s="0">😬 ${T("Missed it", "פספסתי")}</button><button class="btn" data-s="1">🤏 ${T("Partially", "חלקית")}</button><button class="btn good" data-s="2">💪 ${T("Nailed it", "פגיעה בול")}</button></div>`;
          $$("[data-s]").forEach(b => b.onclick = () => { scores.push({ s: +b.dataset.s, q }); i++; ask(mpq); });
        };
      };
      const finish = () => {
        const total = scores.reduce((a, x) => a + x.s, 0), pct = Math.round(total / (scores.length * 2) * 100);
        iv.mocks.push({ date: new Date().toISOString().slice(0, 10), pct, n: scores.length }); C.save(); C.addXP(10 * scores.length, `+${10 * scores.length} XP 🎙️`);
        const weak = {}; scores.filter(x => x.s < 2).forEach(x => weak[x.q.track] = (weak[x.q.track] || 0) + 1);
        const weakList = Object.entries(weak).sort((a, b) => b[1] - a[1]).map(([k]) => k === "design" ? `<a class="btn small" href="#/interview/design">🏛️ System design</a>` : `<a class="btn small" href="#/track/${k}">${C.trackOf(k).icon} ${esc(L(C.trackOf(k).title))}</a>`).join(" ");
        app.innerHTML = `${crumbs}<div class="card" style="text-align:center"><h1>${pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚"} ${pct}%</h1><p>${pct >= 80 ? T("Interview-ready on these topics.", "מוכנים לראיון בנושאים האלה.") : pct >= 50 ? T("Solid base — close the gaps below.", "בסיס טוב — לסגור את הפערים למטה.") : T("Good that you found this now and not in the interview 😉", "טוב שגילית את זה עכשיו ולא בראיון 😉")}</p>
          ${weakList ? `<p>${T("Review:", "לחזור על:")} ${weakList}</p>` : ""}<button class="btn primary" id="again">${t("restart")}</button></div>
          <h2>${T("Your answers", "התשובות שלך")}</h2>${scores.map(x => `<details class="qa"><summary>${["😬", "🤏", "💪"][x.s]} ${L(x.q.q)}</summary><div style="margin-top:8px">${L(x.q.a)}</div></details>`).join("")}`;
        if (pct >= 80) C.confetti();
        $("#again").onclick = setup;
      };
      setup();
      return () => clearInterval(timer);
    }

    // ---------- hub ----------
    const bankCount = C.lessons.reduce((a, l) => a + (l.interview || []).length, 0);
    const dDone = I.designs.filter(d => iv.design[d.id]).length, cDone = I.problems.filter(p => iv.code[p.id]).length;
    const lastMock = iv.mocks.length ? iv.mocks[iv.mocks.length - 1].pct : null;
    const learned = Object.keys(S.done).length;
    const readiness = Math.round(
      40 * Math.min(1, learned / Math.max(1, C.lessons.length)) +
      20 * (I.designs.length ? dDone / I.designs.length : 0) +
      20 * (I.problems.length ? cDone / I.problems.length : 0) +
      20 * ((lastMock || 0) / 100));
    const card = (href, icon, title, desc, meta) => `<a class="card track-card" href="${href}" style="--tc:var(--accent)"><span class="ticon">${icon}</span><h3>${title}</h3><p>${desc}</p>${meta ? `<div class="row"><span class="tag">${meta}</span></div>` : ""}</a>`;
    app.innerHTML = `<h1>🎯 ${t("navInterview")}</h1>
      <div class="hero"><div class="card hero-main"><h2 style="margin-top:0">${T("Your readiness", "רמת המוכנות שלך")}: ${readiness}%</h2>
        <div class="rank-bar"><div style="width:${readiness}%"></div></div>
        <p>${T("Weighted: lessons learned 40% · system design 20% · coding 20% · last mock interview 20%.", "משוקלל: שיעורים שנלמדו 40% · System design ‏20% · קוד 20% · ראיון מדומה אחרון 20%.")}</p></div>
        <div class="card"><h3 style="margin-top:0">🗓️ ${T("A 4-week plan", "תוכנית ל-4 שבועות")}</h3><ol style="margin:0;padding-inline-start:20px">
          <li>${T("Week 1: Foundations, Linux, Networking + 1 easy problem/day", "שבוע 1: יסודות, Linux, רשתות + בעיה easy ביום")}</li>
          <li>${T("Week 2: Containers, Kubernetes + design framework + 2 classic designs", "שבוע 2: קונטיינרים, Kubernetes + מסגרת design + 2 תרגילים קלאסיים")}</li>
          <li>${T("Week 3: Architecture, Data, Observability + medium problems", "שבוע 3: ארכיטקטורה, מידע, Observability + בעיות medium")}</li>
          <li>${T("Week 4: Reliability, Cloud, senior designs, 3 mock interviews, behavioral stories", "שבוע 4: אמינות, ענן, designs לבכירים, 3 ראיונות מדומים, סיפורים התנהגותיים")}</li></ol></div></div>
      <div class="grid">
        ${card("#/interview/design", "🏛️", "System design", T("Case studies with clarifying questions, real estimates, diagrams, deep dives and follow-ups.", "תרגילים עם שאלות הבהרה, הערכות אמיתיות, דיאגרמות, צלילות לעומק ושאלות המשך."), `${dDone}/${I.designs.length} ✓`)}
        ${card("#/interview/coding", "🧩", T("Coding (LeetCode-style)", "קוד (בסגנון LeetCode)"), T("Problems that matter for infra: LRU, rate limiters, consistent hashing, topo sort, heaps, intervals.", "בעיות שרלוונטיות לתשתיות: LRU, rate limiters, consistent hashing, topo sort, heaps, intervals."), `${cDone}/${I.problems.length} ✓`)}
        ${card("#/interview/mock", "🎙️", T("Mock interview", "ראיון מדומה"), T("Timed random questions from everything you learned. Self-graded, tracks your weak spots.", "שאלות אקראיות עם טיימר מכל מה שלמדת. דירוג עצמי, מזהה נקודות חולשה."), lastMock != null ? `${T("last", "אחרון")}: ${lastMock}%` : "")}
        ${card("#/interview/bank", "🗂️", T("Question bank", "מאגר שאלות"), T("All interview Q&A from all lessons, searchable.", "כל שאלות ותשובות הראיון מכל השיעורים, עם חיפוש."), `${bankCount}`)}
        ${card("#/interview/behavioral", "🗣️", T("Behavioral & scenarios", "התנהגותי ותרחישים"), T("'Tell me about an outage', 'what happens when you type a URL', STAR stories, interview-week checklist.", "'ספר/י על תקלה', 'מה קורה כשמקלידים URL', סיפורי STAR, צ'קליסט לשבוע הראיון."), "")}
        ${card("#/oncall", "📟", T("Live troubleshooting", "דיבאג חי"), T("On-call scenarios = the 'debug this with me' round.", "תרחישי תורנות = סבב ה'בוא נדבג את זה יחד'."), "")}
      </div>`;
    return null;
  }

  I.interview = { render };
})();
