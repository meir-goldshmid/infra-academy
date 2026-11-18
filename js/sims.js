/* Interactive simulators. Each sim: { icon, track, title, desc, mount(el, H) -> cleanup } */
(function () {
  "use strict";
  const I = window.INFRA;
  I.sims = I.sims || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#888";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  const T = (H) => (en, he) => H.lang === "he" ? he : en;
  const metric = (label, value, cls) => `<div class="metric ${cls || ""}"><small>${label}</small><b>${value}</b></div>`;
  const slider = (id, label, min, max, step, val) => `<label>${label} <b id="${id}V">${val}</b><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;

  function chart(canvas, series, opts) {
    const dpr = window.devicePixelRatio || 1; const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w) return;
    canvas.width = w * dpr; canvas.height = h * dpr; const c = canvas.getContext("2d"); c.scale(dpr, dpr);
    c.clearRect(0, 0, w, h);
    const maxY = opts.maxY || Math.max(1, ...series.flatMap(s => s.data)) * 1.1;
    const n = Math.max(...series.map(s => s.data.length), 2);
    c.strokeStyle = css("--border"); c.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = 6 + (h - 12) * i / 4; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    series.forEach(s => {
      c.strokeStyle = s.color; c.lineWidth = s.width || 2; c.setLineDash(s.dash || []); c.beginPath();
      s.data.forEach((v, i) => { const x = (w - 4) * i / (n - 1) + 2; const y = h - 6 - (h - 12) * clamp(v / maxY, 0, 1); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.stroke(); c.setLineDash([]);
      if (s.fill) { c.lineTo((w - 4) * (s.data.length - 1) / (n - 1) + 2, h); c.lineTo(2, h); c.closePath(); c.globalAlpha = .12; c.fillStyle = s.color; c.fill(); c.globalAlpha = 1; }
    });
  }
  const legend = (items) => `<div class="row" style="font-size:.85em;margin-top:4px">${items.map(([c, l]) => `<span><span style="display:inline-block;width:12px;height:3px;background:${c};vertical-align:middle"></span> ${l}</span>`).join("")}</div>`;

  // =============== 1. Load balancer ===============
  I.sims.lb = {
    icon: "⚖️", track: "networking",
    title: { en: "Load balancer lab", he: "מעבדת Load Balancer" },
    desc: { en: "Pick an algorithm, kill servers, make one slow, turn off health checks — and watch errors and latency.", he: "בחר אלגוריתם, הפל שרתים, האט אחד, כבה health checks — וראה מה קורה ל-errors ול-latency." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls">
        <label>${t("Algorithm", "אלגוריתם")}<select id="alg"><option value="rr">Round Robin</option><option value="lc">Least Connections</option><option value="rand">Random</option><option value="hash">IP Hash (sticky)</option></select></label>
        ${slider("rate", t("Requests/sec", "בקשות לשנייה"), 5, 120, 5, 40)}
        ${slider("n", t("Servers", "שרתים"), 2, 6, 1, 4)}
        <label><span><input type="checkbox" id="hc" checked> ${t("Health checks", "Health checks")}</span></label>
        <label><span><input type="checkbox" id="slow"> ${t("Server 1 is slow (GC pauses)", "שרת 1 איטי (GC pauses)")}</span></label>
      </div>
      <div class="sim-stage"><div class="lb-box">⚖️ Load Balancer</div><div class="servers" id="srv"></div></div>
      <p class="muted" style="font-size:.88em">${t("Tip: click a server to kill / revive it.", "טיפ: לחץ על שרת כדי להפיל / להחיות אותו.")}</p>
      <div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      let servers = [], acc = 0, total = 0, errors = 0, lat = 50, rr = 0, errWin = [];
      const mk = (n) => { servers = Array.from({ length: n }, (_, i) => servers[i] || { up: true, active: 0, served: 0, downAt: 0 }); };
      mk(4);
      const $ = (s) => el.querySelector(s);
      $("#n").oninput = (e) => { $("#nV").textContent = e.target.value; mk(+e.target.value); draw(); };
      $("#rate").oninput = (e) => $("#rateV").textContent = e.target.value;
      const draw = () => {
        $("#srv").innerHTML = servers.map((s, i) => {
          const cap = (i === 0 && $("#slow").checked) ? 1 : 4;
          return `<div class="server ${s.up ? "" : "down"}" data-i="${i}" style="cursor:pointer">🖥️ <b>srv-${i + 1}</b>
          <div class="load"><div style="width:${clamp(s.active / 30 * 100, 0, 100)}%"></div></div>
          <small>${s.up ? `${s.active} ${t("active", "פעילים")}` : "💀 DOWN"}</small><br><small>${s.served} ${t("served", "טופלו")}</small>${cap === 1 && s.up ? "<br><small>🐢</small>" : ""}</div>`;
        }).join("");
        el.querySelectorAll(".server").forEach(d => d.onclick = () => { const s = servers[+d.dataset.i]; s.up = !s.up; s.downAt = Date.now(); if (!s.up) s.active = 0; draw(); });
      };
      draw();
      const pick = (client) => {
        const hc = $("#hc").checked; const now = Date.now();
        const pool = servers.map((s, i) => i).filter(i => !hc || servers[i].up || now - servers[i].downAt < 1500);
        if (!pool.length) return -1;
        const alg = $("#alg").value;
        if (alg === "rr") { rr = (rr + 1) % pool.length; return pool[rr]; }
        if (alg === "rand") return pool[Math.floor(Math.random() * pool.length)];
        if (alg === "hash") return pool[(client * 2654435761 >>> 0) % pool.length];
        return pool.reduce((b, i) => servers[i].active < servers[b].active ? i : b, pool[0]);
      };
      const tick = setInterval(() => {
        acc += +$("#rate").value / 10;
        let errsNow = 0;
        while (acc >= 1) {
          acc--; total++;
          const client = Math.floor(Math.random() * 12);
          const i = pick(client);
          if (i < 0 || !servers[i].up) { errors++; errsNow++; continue; }
          servers[i].active++;
          if (servers[i].active > 40) { servers[i].active--; errors++; errsNow++; } // queue overflow -> 503
        }
        let sumLat = 0, cnt = 0;
        servers.forEach((s, i) => {
          if (!s.up) return;
          const cap = (i === 0 && $("#slow").checked) ? 1 : 4;
          const doneN = Math.min(s.active, cap); s.active -= doneN; s.served += doneN;
          sumLat += (20 + s.active / cap * 100) * doneN; cnt += doneN;
        });
        if (cnt) lat = lat * .85 + (sumLat / cnt) * .15;
        errWin.push(errsNow); if (errWin.length > 30) errWin.shift();
        draw();
        const errRate = total ? errors / total * 100 : 0;
        const recentErr = errWin.reduce((a, b) => a + b, 0);
        $("#out").innerHTML = metric(t("Requests", "בקשות"), fmt(total)) + metric(t("Errors (5xx)", "שגיאות (5xx)"), `${fmt(errors)} (${fmt(errRate, 1)}%)`, errRate > 1 ? "bad" : "good") + metric(t("Avg latency", "Latency ממוצע"), fmt(lat) + " ms", lat > 300 ? "bad" : lat > 120 ? "warn" : "good");
        const down = servers.some(s => !s.up), alg = $("#alg").value;
        let msg;
        if (down && !$("#hc").checked && recentErr) msg = t("💥 Without health checks the LB keeps sending traffic to a dead server — every Nth request fails. Turn health checks on.", "💥 בלי health checks ה-LB ממשיך לשלוח תעבורה לשרת מת — כל בקשה N נכשלת. הדלק health checks.");
        else if (down && recentErr) msg = t("⏱️ Health checks remove a dead server only after a few failed probes (~1.5s here). Errors during that window are why probe interval & thresholds matter.", "⏱️ Health checks מוציאים שרת מת רק אחרי כמה בדיקות שנכשלו (~1.5 שניות כאן). השגיאות בחלון הזה הן הסיבה שתדירות הבדיקות והספים חשובים.");
        else if ($("#slow").checked && alg === "rr") msg = t("🐢 Round robin is blind: the slow server gets the same share and its queue explodes. Try Least Connections.", "🐢 Round Robin עיוור: השרת האיטי מקבל אותו נתח והתור שלו מתפוצץ. נסה Least Connections.");
        else if ($("#slow").checked && alg === "lc") msg = t("✅ Least Connections notices the slow server is busy and routes around it.", "✅ Least Connections מזהה שהשרת האיטי עמוס ועוקף אותו.");
        else if (alg === "hash") msg = t("📌 IP hash = stickiness: same client → same server. Great for caches, but load can be uneven and a dead server reshuffles clients.", "📌 IP Hash = דביקות: אותו לקוח ← אותו שרת. טוב ל-cache, אבל העומס יכול להיות לא מאוזן ושרת שנופל מערבב לקוחות.");
        else msg = t("Raise the request rate until latency climbs — that's saturation. Then add a server.", "העלה את קצב הבקשות עד שה-latency מטפס — זו רוויה (saturation). ואז הוסף שרת.");
        $("#lesson").innerHTML = msg;
      }, 100);
      return () => clearInterval(tick);
    }
  };

  // =============== 2. Requests & limits ===============
  I.sims.resources = {
    icon: "🎛️", track: "kubernetes",
    title: { en: "CPU & memory: requests vs limits", he: "CPU וזיכרון: Requests מול Limits" },
    desc: { en: "Set requests/limits, push load, leak memory. See CPU throttling vs OOMKilled (exit 137) and the QoS class.", he: "קבע requests/limits, העמס, תדליף זיכרון. ראה CPU throttling מול OOMKilled (exit 137) ומחלקת ה-QoS." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls">
        ${slider("cr", "CPU request (m)", 0, 2000, 50, 250)}${slider("cl", "CPU limit (m)", 0, 4000, 50, 500)}
        ${slider("mr", "Memory request (Mi)", 0, 4096, 64, 256)}${slider("ml", "Memory limit (Mi)", 0, 4096, 64, 512)}
      </div><div class="sim-controls">
        ${slider("load", t("CPU demand from traffic (m)", "ביקוש CPU מהתעבורה (m)"), 50, 3000, 50, 300)}
        <label><span><input type="checkbox" id="leak"> ${t("Memory leak 🐛", "דליפת זיכרון 🐛")}</span></label>
        <button class="btn small" id="spike">${t("Load a big file (+300Mi)", "טעינת קובץ גדול (+300Mi)")}</button>
      </div>
      <div class="sim-stage">
        <div class="gauge-label"><span>CPU</span><span id="cpuTxt"></span></div><div class="gauge" id="cpuG"><div class="fill"></div><div class="mark" title="request"></div><div class="mark lim" title="limit"></div></div>
        <div class="gauge-label"><span>Memory</span><span id="memTxt"></span></div><div class="gauge" id="memG"><div class="fill"></div><div class="mark"></div><div class="mark lim"></div></div>
        <pre id="kc" style="margin:0;font-size:.8em"></pre>
      </div><div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      ["cr", "cl", "mr", "ml", "load"].forEach(id => $("#" + id).oninput = (e) => $("#" + id + "V").textContent = e.target.value);
      let mem = 120, restarts = 0, lastState = "Running", lastExit = "", oomFlash = 0, crashUntil = 0;
      $("#spike").onclick = () => mem += 300;
      const NODE_CPU = 4000, NODE_MEM = 8192;
      const tick = setInterval(() => {
        const cr = +$("#cr").value, cl = +$("#cl").value, mr = +$("#mr").value, ml = +$("#ml").value, load = +$("#load").value;
        const qos = (cr === 0 && cl === 0 && mr === 0 && ml === 0) ? "BestEffort" : (cr > 0 && mr > 0 && cr === cl && mr === ml) ? "Guaranteed" : "Burstable";
        const now = Date.now();
        let state = "Running", cpuUse = 0, throttle = 0;
        if (cr > NODE_CPU || mr > NODE_MEM) state = "Pending";
        else if (now < crashUntil) state = "CrashLoopBackOff";
        else {
          const cap = cl > 0 ? cl : NODE_CPU;
          cpuUse = Math.min(load, cap); throttle = load > cap ? (load - cap) / load * 100 : 0;
          if ($("#leak").checked) mem += 12;
          mem += (Math.random() - .5) * 6; mem = Math.max(80, mem);
          const memCap = ml > 0 ? ml : NODE_MEM;
          if (mem > memCap) { restarts++; lastState = "OOMKilled"; lastExit = "137"; mem = 120; oomFlash = 12; crashUntil = now + Math.min(10000, 1000 * Math.pow(2, Math.min(restarts, 4)) / 4); state = "CrashLoopBackOff"; }
        }
        const maxC = Math.max(4000, cl, load), maxM = 4096;
        const setG = (g, val, req, lim, max) => {
          g.querySelector(".fill").style.width = clamp(val / max * 100, 0, 100) + "%";
          const [r, l] = g.querySelectorAll(".mark");
          r.style.insetInlineStart = clamp(req / max * 100, 0, 100) + "%"; r.style.display = req ? "" : "none";
          l.style.insetInlineStart = clamp(lim / max * 100, 0, 100) + "%"; l.style.display = lim ? "" : "none";
        };
        setG($("#cpuG"), cpuUse, cr, cl, maxC); setG($("#memG"), state === "Running" ? mem : 0, mr, ml, maxM);
        $("#cpuG .fill").style.background = throttle > 0 ? css("--warn") : css("--accent");
        $("#memG .fill").style.background = ml && mem > ml * .85 ? css("--bad") : css("--accent");
        $("#cpuTxt").textContent = `${fmt(cpuUse)}m ${t("used", "בשימוש")} / ${t("demand", "ביקוש")} ${load}m`;
        $("#memTxt").textContent = `${fmt(state === "Running" ? mem : 0)}Mi`;
        $("#kc").textContent = `$ kubectl get pod checkout-7d9f\nNAME            READY  STATUS             RESTARTS\ncheckout-7d9f   ${state === "Running" ? "1/1" : "0/1"}    ${state.padEnd(18)} ${restarts}` +
          (lastState === "OOMKilled" ? `\n\n$ kubectl describe pod checkout-7d9f | grep -A3 "Last State"\n    Last State:  Terminated\n      Reason:    OOMKilled\n      Exit Code: ${lastExit}` : "");
        const latency = 40 / Math.max(0.05, 1 - throttle / 100);
        $("#out").innerHTML = metric("QoS class", qos, qos === "Guaranteed" ? "good" : qos === "BestEffort" ? "bad" : "warn") +
          metric(t("CPU throttled", "CPU throttled"), fmt(throttle) + "%", throttle > 0 ? "warn" : "good") +
          metric("p99 latency", fmt(latency) + " ms", latency > 100 ? "bad" : "good") + metric(t("Restarts", "Restarts"), restarts, restarts ? "bad" : "good");
        let msg;
        if (state === "Pending") msg = t("⏳ Pending: the request is bigger than any node's allocatable capacity. The scheduler places pods by REQUESTS, not usage.", "⏳ Pending: ה-request גדול מהקיבולת של כל node. ה-scheduler משבץ לפי REQUESTS, לא לפי שימוש בפועל.");
        else if (oomFlash > 0) msg = t("💀 OOMKilled! Memory is incompressible — crossing the memory limit kills the container (exit 137 = 128 + SIGKILL 9). Raise the limit or fix the leak.", "💀 OOMKilled! זיכרון הוא משאב שלא ניתן לדחיסה — חציית ה-limit הורגת את הקונטיינר (exit 137 = 128 + SIGKILL 9). הגדל limit או תקן את הדליפה.");
        else if (throttle > 0) msg = t("🐢 CPU is compressible: above the limit you are THROTTLED, not killed. The app survives but latency goes up. Many teams drop CPU limits and keep requests.", "🐢 CPU ניתן לדחיסה: מעל ה-limit עושים לך THROTTLE, לא הורגים. האפליקציה שורדת אבל ה-latency עולה. הרבה צוותים מוותרים על CPU limits ומשאירים requests.");
        else if (qos === "BestEffort") msg = t("⚠️ BestEffort: no requests/limits → first to be evicted when the node is under memory pressure.", "⚠️ BestEffort: בלי requests/limits ← הראשון שמפונה כשיש לחץ זיכרון על ה-node.");
        else msg = t("Try: turn on the leak, or push CPU demand above the limit. Then set request = limit for both to get Guaranteed QoS.", "נסה: הדלק את הדליפה, או העלה ביקוש CPU מעל ה-limit. אחר כך קבע request = limit לשניהם כדי לקבל Guaranteed QoS.");
        if (oomFlash > 0) oomFlash--;
        $("#lesson").innerHTML = msg;
      }, 250);
      return () => clearInterval(tick);
    }
  };

  // =============== 3. Queue ===============
  I.sims.queue = {
    icon: "📬", track: "architecture",
    title: { en: "Queue & consumers", he: "תור ו-Consumers" },
    desc: { en: "Producers vs consumers. Watch the backlog grow, add consumers, inject a poison message, enable a DLQ.", he: "Producers מול Consumers. ראה את ה-backlog גדל, הוסף consumers, הזרק poison message, הפעל DLQ." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls">
        ${slider("prod", t("Produced msgs/sec", "הודעות לשנייה (producer)"), 1, 60, 1, 20)}
        ${slider("cons", t("Consumers", "Consumers"), 1, 12, 1, 3)}
        ${slider("proc", t("Processing time (ms/msg)", "זמן עיבוד (ms להודעה)"), 50, 1000, 50, 200)}
        <label><span><input type="checkbox" id="dlq" checked> ${t("DLQ after 3 retries", "DLQ אחרי 3 ניסיונות")}</span></label>
        <button class="btn small" id="poison">☠️ ${t("Inject poison message", "הזרקת poison message")}</button>
        <button class="btn small" id="burst">📈 ${t("Traffic burst ×300", "פרץ תעבורה ×300")}</button>
      </div>
      <div class="sim-stage"><div class="muted" style="font-size:.85em">📥 Queue (${t("each square = 1 message", "כל ריבוע = הודעה")})</div><div class="queue-lane" id="lane"></div>
      <div class="consumers" id="cs"></div><div style="margin-top:8px" class="muted" id="dlqBox"></div></div>
      <canvas class="chart" id="ch" style="margin-top:10px"></canvas>${legend([[css("--accent"), t("backlog", "backlog")], [css("--bad"), t("consumer lag (s)", "lag בשניות")]])}
      <div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      ["prod", "cons", "proc"].forEach(id => $("#" + id).oninput = (e) => $("#" + id + "V").textContent = e.target.value);
      let q = [], workers = [], acc = 0, processed = 0, dlq = 0, hist = [], lagHist = [], time = 0;
      $("#poison").onclick = () => q.push({ poison: true, tries: 0, at: time });
      $("#burst").onclick = () => { for (let i = 0; i < 300; i++) q.push({ at: time }); };
      const tick = setInterval(() => {
        const dt = .2; time += dt;
        acc += +$("#prod").value * dt;
        while (acc >= 1) { acc--; q.push({ at: time }); }
        const n = +$("#cons").value, proc = +$("#proc").value / 1000;
        while (workers.length < n) workers.push({ msg: null, left: 0 });
        workers.length = n;
        workers.forEach(w => {
          let budget = dt;
          while (budget > 0) {
            if (!w.msg) { w.msg = q.shift() || null; if (!w.msg) break; w.left = proc; }
            const use = Math.min(budget, w.left); w.left -= use; budget -= use;
            if (w.left <= 1e-9) {
              if (w.msg.poison) {
                w.msg.tries++;
                if ($("#dlq").checked && w.msg.tries >= 3) { dlq++; w.msg = null; }
                else { w.left = proc; } // retry forever, blocking this consumer
              } else { processed++; w.msg = null; }
            }
          }
        });
        const oldest = q.length ? time - q[0].at : 0;
        hist.push(q.length); lagHist.push(oldest); if (hist.length > 150) { hist.shift(); lagHist.shift(); }
        $("#lane").innerHTML = q.slice(0, 400).map(m => `<span class="msg ${m.poison ? "poison" : ""}"></span>`).join("") + (q.length > 400 ? ` +${q.length - 400}` : "");
        $("#cs").innerHTML = workers.map((w, i) => `<span class="consumer ${w.msg ? "busy" : ""}">👷 c${i + 1} ${w.msg ? (w.msg.poison ? "☠️ " + t("stuck", "תקוע") : "⚙️") : "💤"}</span>`).join("");
        $("#dlqBox").textContent = `🪦 DLQ: ${dlq}`;
        chart($("#ch"), [{ data: hist, color: css("--accent"), fill: true }, { data: lagHist.map(x => x * (Math.max(...hist, 10) / Math.max(...lagHist, 1))), color: css("--bad"), dash: [4, 3] }], {});
        const capacity = n / proc, prod = +$("#prod").value;
        $("#out").innerHTML = metric(t("Backlog", "Backlog"), fmt(q.length), q.length > 100 ? "bad" : "good") + metric(t("Oldest msg age", "גיל ההודעה הוותיקה"), fmt(oldest, 1) + "s", oldest > 10 ? "bad" : "good") +
          metric(t("Capacity", "קיבולת"), fmt(capacity, 1) + "/s") + metric(t("Incoming", "נכנס"), prod + "/s") + metric(t("Processed", "עובדו"), fmt(processed));
        const stuck = workers.some(w => w.msg && w.msg.poison && w.msg.tries >= 3);
        let msg;
        if (stuck) msg = t("☠️ A poison message is retried forever and blocks a consumer. That's why you need a max-retry + Dead Letter Queue — enable it.", "☠️ Poison message מנוסה שוב ושוב לנצח וחוסם consumer. בגלל זה צריך max-retry + Dead Letter Queue — הפעל.");
        else if (prod > capacity) msg = t(`📈 Incoming (${prod}/s) > capacity (${fmt(capacity, 1)}/s = consumers ÷ processing time). The backlog grows forever. Add consumers or make processing faster. Scale on LAG, not CPU (KEDA does this).`, `📈 נכנס (${prod}/s) > קיבולת (${fmt(capacity, 1)}/s = consumers ÷ זמן עיבוד). ה-backlog יגדל לנצח. הוסף consumers או האיצו עיבוד. עושים scale לפי LAG, לא לפי CPU (KEDA עושה את זה).`);
        else if (q.length > 50) msg = t("🧽 Capacity > incoming, so the backlog drains. The queue absorbed the burst — that's the whole point: decoupling producers from consumers.", "🧽 קיבולת > נכנס, אז ה-backlog מתרוקן. התור ספג את הפרץ — זה כל הרעיון: ניתוק producers מ-consumers.");
        else msg = t("Hit 'Traffic burst' and watch the queue absorb it instead of crashing the consumers.", "לחץ 'פרץ תעבורה' ותראה איך התור סופג אותו במקום להפיל את ה-consumers.");
        $("#lesson").innerHTML = msg;
      }, 200);
      return () => clearInterval(tick);
    }
  };

  // =============== 4. SLO / error budget ===============
  I.sims.slo = {
    icon: "🎯", track: "reliability",
    title: { en: "SLO & error budget calculator", he: "מחשבון SLO ו-Error Budget" },
    desc: { en: "How much downtime does 99.9% really allow? Burn your budget with incidents and see when releases freeze.", he: "כמה downtime באמת מותר ב-99.9%? שרוף את התקציב עם תקלות וראה מתי מקפיאים releases." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls">
        <label>SLO %<select id="slo"><option>99</option><option>99.5</option><option selected>99.9</option><option>99.95</option><option>99.99</option><option>99.999</option></select></label>
        <label>${t("Window", "חלון")}<select id="win"><option value="30">30 ${t("days", "ימים")}</option><option value="7">7 ${t("days", "ימים")}</option><option value="90">${t("quarter", "רבעון")}</option><option value="365">${t("year", "שנה")}</option></select></label>
        <label>${t("Requests / month", "בקשות לחודש")}<input type="number" id="reqs" value="10000000" step="1000000" style="width:130px"></label>
      </div>
      <div class="sim-stage">
        <div id="allow" style="font-size:1.1em"></div>
        <div class="gauge-label" style="margin-top:10px"><span>${t("Error budget remaining", "Error budget שנותר")}</span><span id="bTxt"></span></div>
        <div class="gauge" id="bG"><div class="fill"></div></div>
        <div class="row">
          <button class="btn small" data-burn="5">💥 ${t("5 min full outage", "5 דק' השבתה מלאה")}</button>
          <button class="btn small" data-burn="30">🔥 ${t("30 min full outage", "30 דק' השבתה מלאה")}</button>
          <button class="btn small" data-burn="60,0.1">🌡️ ${t("1h at 10% errors", "שעה עם 10% שגיאות")}</button>
          <button class="btn small" data-burn="240,0.02">🐌 ${t("4h at 2% errors", "4 שעות עם 2% שגיאות")}</button>
          <button class="btn small" id="resetB">↺</button>
        </div>
        <div id="log" class="muted" style="font-size:.88em;margin-top:8px"></div>
      </div>
      <h3>🔗 ${t("Composite availability (serial dependencies)", "זמינות מורכבת (תלויות בטור)")}</h3>
      <div class="sim-controls">${slider("deps", t("Dependencies in the chain", "תלויות בשרשרת"), 1, 10, 1, 4)}<label>${t("Each one's availability %", "זמינות כל אחת %")}<select id="depA"><option>99</option><option>99.9</option><option selected>99.95</option><option>99.99</option></select></label></div>
      <div id="comp"></div>
      <h3>📋 ${t("The nines table", "טבלת התשיעיות")}</h3><div id="nines"></div>
      <div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      let burned = 0; const log = [];
      const dur = (min) => min >= 1440 ? fmt(min / 1440, 1) + t(" days", " ימים") : min >= 60 ? fmt(min / 60, 1) + t(" h", " שע'") : min >= 1 ? fmt(min, 1) + t(" min", " דק'") : fmt(min * 60, 1) + t(" s", " שנ'");
      const draw = () => {
        const slo = +$("#slo").value, win = +$("#win").value;
        const budgetMin = (1 - slo / 100) * win * 1440;
        const reqs = +$("#reqs").value * win / 30;
        const allowedFail = reqs * (1 - slo / 100);
        $("#allow").innerHTML = `${t("Allowed downtime", "Downtime מותר")}: <b>${dur(budgetMin)}</b> ${t("per", "ל-")}${win} ${t("days", "ימים")} · ${t("or", "או")} <b>${fmt(allowedFail)}</b> ${t("failed requests", "בקשות כושלות")}`;
        const left = Math.max(0, budgetMin - burned); const pct = budgetMin ? left / budgetMin * 100 : 0;
        $("#bG .fill").style.width = pct + "%"; $("#bG .fill").style.background = pct > 50 ? css("--good") : pct > 0 ? css("--warn") : css("--bad");
        $("#bTxt").textContent = `${fmt(pct)}% (${dur(left)})`;
        $("#log").innerHTML = log.slice(-5).join("<br>");
        const n = +$("#deps").value, a = +$("#depA").value / 100;
        const comp = Math.pow(a, n) * 100;
        $("#comp").innerHTML = `<p>${a * 100}%<sup>${n}</sup> = <b>${fmt(comp, 3)}%</b> → ${dur((1 - comp / 100) * 30 * 1440)} ${t("downtime / month", "downtime לחודש")}. ${comp < slo ? `<span style="color:var(--bad)">${t("Below your SLO! Your SLO can't be higher than your dependencies allow.", "מתחת ל-SLO שלך! ה-SLO שלך לא יכול להיות גבוה ממה שהתלויות מאפשרות.")}</span>` : ""}</p>`;
        $("#nines").innerHTML = `<table><tr><th>SLO</th><th>${t("per year", "לשנה")}</th><th>${t("per month", "לחודש")}</th><th>${t("per week", "לשבוע")}</th><th>${t("per day", "ליום")}</th></tr>` +
          [99, 99.5, 99.9, 99.95, 99.99, 99.999].map(s => `<tr${s === slo ? ' style="background:var(--surface-2);font-weight:700"' : ""}><td>${s}%</td>${[365, 30, 7, 1].map(d => `<td>${dur((1 - s / 100) * d * 1440)}</td>`).join("")}</tr>`).join("") + `</table>`;
        let msg;
        if (pct <= 0) msg = t("🧊 Budget exhausted → per the error-budget policy: freeze feature releases, only reliability work ships until the window recovers.", "🧊 התקציב נגמר ← לפי מדיניות ה-error budget: מקפיאים פיצ'רים, רק עבודת אמינות עולה עד שהחלון מתאושש.");
        else if (pct < 50) msg = t("⚠️ More than half the budget is gone. Slow down risky deploys, prioritize the postmortem action items.", "⚠️ יותר מחצי מהתקציב נשרף. מאטים deploys מסוכנים, מתעדפים את ה-action items מה-postmortem.");
        else msg = t("💡 Budget left = permission to take risks: ship features, run chaos experiments. 100% is the wrong target — users can't tell 99.99% from 100% but your velocity can.", "💡 תקציב שנשאר = רשות לקחת סיכונים: לשחרר פיצ'רים, להריץ ניסויי chaos. 100% זו מטרה שגויה — משתמשים לא מבחינים בין 99.99% ל-100%, אבל הקצב שלך כן.");
        $("#lesson").innerHTML = msg;
      };
      el.querySelectorAll("[data-burn]").forEach(b => b.onclick = () => {
        const [m, f] = b.dataset.burn.split(","); const cost = +m * (f ? +f : 1); burned += cost;
        log.push(`${b.textContent.trim()} → −${dur(cost)}`); draw();
      });
      $("#resetB").onclick = () => { burned = 0; log.length = 0; draw(); };
      ["slo", "win", "reqs", "depA"].forEach(id => $("#" + id).oninput = draw);
      $("#deps").oninput = (e) => { $("#depsV").textContent = e.target.value; draw(); };
      draw();
      return null;
    }
  };

  // =============== 5. CIDR ===============
  I.sims.cidr = {
    icon: "🧮", track: "networking",
    title: { en: "CIDR & subnet calculator", he: "מחשבון CIDR ו-Subnets" },
    desc: { en: "Type an IP/prefix, see network vs host bits, ranges, usable IPs (and what AWS reserves). Split into subnets.", he: "הקלד IP/prefix, ראה ביטים של רשת מול host, טווחים, כתובות שמישות (ומה AWS שומר לעצמו). פצל ל-subnets." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls"><label>IP / prefix<input type="text" id="ip" value="10.0.0.0/16" style="direction:ltr;width:170px"></label>
        ${slider("split", t("Split into /", "פיצול ל- /"), 16, 28, 1, 24)}
        <span class="row">${["10.0.0.0/16", "192.168.1.10/24", "172.16.5.0/20", "10.0.1.0/28"].map(p => `<button class="btn small" data-p="${p}">${p}</button>`).join("")}</span></div>
      <div class="sim-stage" id="res"></div><div id="subs"></div><div class="sim-lesson">${t("💡 Each +1 on the prefix halves the block. /16 = 65,536 · /24 = 256 · /28 = 16. In AWS every subnet loses 5 IPs (network, VPC router, DNS, future, broadcast). Private ranges: 10/8, 172.16/12, 192.168/16.", "💡 כל +1 ב-prefix חוצה את הבלוק. ‎/16 = 65,536 · ‎/24 = 256 · ‎/28 = 16. ב-AWS כל subnet מאבד 5 כתובות (רשת, ראוטר VPC, DNS, שמור, broadcast). טווחים פרטיים: 10/8, 172.16/12, 192.168/16.")}</div>`;
      const $ = (s) => el.querySelector(s);
      const toInt = (ip) => ip.split(".").reduce((a, o) => (a << 8 >>> 0) + (+o), 0) >>> 0;
      const toIp = (n) => [24, 16, 8, 0].map(s => (n >>> s) & 255).join(".");
      const draw = () => {
        const m = $("#ip").value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
        if (!m || m.slice(1, 5).some(o => +o > 255) || +m[5] > 32) { $("#res").innerHTML = `<span style="color:var(--bad)">${t("Format: a.b.c.d/nn", "פורמט: a.b.c.d/nn")}</span>`; $("#subs").innerHTML = ""; return; }
        const p = +m[5], ip = toInt(m.slice(1, 5).join("."));
        const mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
        const net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0, size = Math.pow(2, 32 - p);
        const bits = ip.toString(2).padStart(32, "0");
        const b = bits.split("").map((c, i) => `<span class="${i < p ? "n" : "h"}">${c}</span>${i % 8 === 7 && i < 31 ? "." : ""}`).join("");
        const priv = (net >>> 24 === 10) || (net >>> 20 === (172 << 4 | 1)) || (net >>> 16 === (192 << 8 | 168));
        $("#res").innerHTML = `<div class="cidr-bits">${b}</div><div class="muted" style="font-size:.82em"><span style="color:var(--accent)">■</span> ${t("network bits", "ביטים של רשת")} (${p}) &nbsp; <span style="color:var(--good)">■</span> ${t("host bits", "ביטים של host")} (${32 - p})</div>
          <div class="sim-out">${metric(t("Network", "רשת"), toIp(net))}${metric(t("Netmask", "Netmask"), toIp(mask))}${metric(t("Broadcast", "Broadcast"), toIp(bc))}
          ${metric(t("Total IPs", "סה\"כ כתובות"), fmt(size))}${metric(t("Usable (classic)", "שמישות (קלאסי)"), fmt(Math.max(0, size - 2)))}${metric(t("Usable in AWS", "שמישות ב-AWS"), fmt(Math.max(0, size - 5)))}
          ${metric(t("Range", "טווח"), `${toIp(net)} – ${toIp(bc)}`)}${metric(t("Private?", "פרטי?"), priv ? "✅ RFC1918" : "🌍 " + t("public", "ציבורי"), priv ? "good" : "warn")}</div>`;
        const sp = +$("#split").value;
        if (sp > p) {
          const count = Math.pow(2, sp - p), each = Math.pow(2, 32 - sp);
          const rows = []; for (let i = 0; i < Math.min(count, 16); i++) { const s = net + i * each; rows.push(`<tr><td>${toIp(s)}/${sp}</td><td>${toIp(s)} – ${toIp(s + each - 1)}</td><td>${fmt(Math.max(0, each - 5))}</td></tr>`); }
          $("#subs").innerHTML = `<h3>${t("Split", "פיצול")}: ${fmt(count)} × /${sp}</h3><table><tr><th>Subnet</th><th>${t("Range", "טווח")}</th><th>${t("Usable (AWS)", "שמישות (AWS)")}</th></tr>${rows.join("")}${count > 16 ? `<tr><td colspan=3>… +${fmt(count - 16)}</td></tr>` : ""}</table>`;
        } else $("#subs").innerHTML = "";
      };
      $("#ip").oninput = draw; $("#split").oninput = (e) => { $("#splitV").textContent = e.target.value; draw(); };
      el.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { $("#ip").value = b.dataset.p; draw(); });
      draw(); return null;
    }
  };

  // =============== 6. Firewall ===============
  I.sims.firewall = {
    icon: "🧱", track: "networking",
    title: { en: "Firewall rule tester", he: "בודק חוקי Firewall" },
    desc: { en: "Ordered rules, first match wins, implicit deny at the end. Build rules, fire packets, see which rule hit.", he: "חוקים מסודרים, ההתאמה הראשונה מנצחת, deny מובלע בסוף. בנה חוקים, שלח packets, ראה איזה חוק תפס." },
    mount(el, H) {
      const t = T(H);
      const presets = {
        db: [["allow", "10.0.1.0/24", "5432", "tcp"], ["deny", "0.0.0.0/0", "5432", "tcp"], ["allow", "10.0.0.0/16", "22", "tcp"]],
        web: [["allow", "0.0.0.0/0", "443", "tcp"], ["allow", "0.0.0.0/0", "80", "tcp"], ["allow", "10.0.99.0/24", "22", "tcp"]],
        oops: [["allow", "0.0.0.0/0", "any", "any"], ["deny", "0.0.0.0/0", "22", "tcp"]]
      };
      let rules = presets.db.map(r => r.slice());
      el.innerHTML = `<div class="row" style="margin-bottom:8px"><b>${t("Presets", "תבניות")}:</b><button class="btn small" data-pre="db">🗄️ ${t("DB tier", "שכבת DB")}</button><button class="btn small" data-pre="web">🌐 ${t("Web tier", "שכבת Web")}</button><button class="btn small" data-pre="oops">🙈 ${t("Order bug", "באג סדר")}</button></div>
        <div class="rule muted" style="font-size:.8em"><span>#</span><span>action</span><span>source CIDR</span><span>port</span><span>proto</span><span></span></div>
        <div class="rules" id="rules"></div>
        <button class="btn small" id="add" style="margin-top:6px">+ ${t("rule", "חוק")}</button>
        <h3>📦 ${t("Test packet", "Packet לבדיקה")}</h3>
        <div class="sim-controls" style="direction:ltr"><label>source IP<input type="text" id="src" value="10.0.1.25"></label><label>dest port<input type="number" id="port" value="5432" style="width:90px"></label>
        <label>proto<select id="proto"><option>tcp</option><option>udp</option></select></label><button class="btn primary" id="fire">🚀 ${t("Send", "שליחה")}</button></div>
        <div class="row">${[["10.0.1.25", 5432, t("app → db", "app → db")], ["203.0.113.7", 5432, t("internet → db 😱", "אינטרנט ← db 😱")], ["10.0.2.9", 22, t("admin SSH", "SSH של אדמין")], ["198.51.100.4", 443, "HTTPS"]].map(([s, p, l]) => `<button class="btn small" data-s="${s}" data-port="${p}">${l}</button>`).join("")}</div>
        <div class="sim-stage" id="verdict" style="margin-top:10px;min-height:60px"></div>
        <div class="sim-lesson">${t("💡 Security Groups (AWS) are stateful allow-lists — order doesn't matter and return traffic is automatic. NACLs and classic firewalls/iptables are ordered and first match wins — a broad allow on top silently defeats every deny below it. Always end with default deny.", "💡 Security Groups ב-AWS הם allow-list עם state — הסדר לא משנה ותעבורה חוזרת מותרת אוטומטית. NACLs וחומות אש קלאסיות/iptables מסודרים וההתאמה הראשונה מנצחת — allow רחב למעלה מבטל בשקט כל deny מתחתיו. תמיד לסיים ב-default deny.")}</div>`;
      const $ = (s) => el.querySelector(s);
      const toInt = (ip) => ip.split(".").reduce((a, o) => (a << 8 >>> 0) + (+o), 0) >>> 0;
      const inCidr = (ip, cidr) => { const [b, p] = cidr.split("/"); const pp = +p; if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip) || !/^\d+\.\d+\.\d+\.\d+$/.test(b) || isNaN(pp)) return false; const m = pp === 0 ? 0 : (0xFFFFFFFF << (32 - pp)) >>> 0; return ((toInt(ip) & m) >>> 0) === ((toInt(b) & m) >>> 0); };
      const drawRules = (hit) => {
        $("#rules").innerHTML = rules.map((r, i) => `<div class="rule ${hit === i ? "hit" : ""}" data-i="${i}"><b>${i + 1}</b>
          <select data-k="0"><option ${r[0] === "allow" ? "selected" : ""}>allow</option><option ${r[0] === "deny" ? "selected" : ""}>deny</option></select>
          <input type="text" data-k="1" value="${esc(r[1])}"><input type="text" data-k="2" value="${esc(r[2])}">
          <select data-k="3">${["tcp", "udp", "any"].map(p => `<option ${r[3] === p ? "selected" : ""}>${p}</option>`).join("")}</select>
          <button class="btn small" data-del="${i}">✕</button></div>`).join("") + `<div class="rule ${hit === -1 ? "hit" : ""}"><b>*</b><span style="grid-column:2/6" class="muted">deny all (implicit default)</span></div>`;
        el.querySelectorAll(".rule[data-i]").forEach(row => row.querySelectorAll("[data-k]").forEach(inp => inp.oninput = () => { rules[+row.dataset.i][+inp.dataset.k] = inp.value; }));
        el.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { rules.splice(+b.dataset.del, 1); drawRules(); });
      };
      const fire = () => {
        const src = $("#src").value.trim(), port = $("#port").value, proto = $("#proto").value;
        let hit = -1;
        for (let i = 0; i < rules.length; i++) { const r = rules[i]; if (inCidr(src, r[1]) && (r[2] === "any" || r[2] === port) && (r[3] === "any" || r[3] === proto)) { hit = i; break; } }
        const action = hit === -1 ? "deny" : rules[hit][0];
        drawRules(hit);
        $("#verdict").innerHTML = `<div style="font-size:1.2em">${action === "allow" ? "✅ ALLOW" : "⛔ DENY"} <span class="muted" style="font-size:.8em">${src} → :${port}/${proto}</span></div>
          <div>${hit === -1 ? t("No rule matched → implicit default deny.", "אף חוק לא תפס ← default deny מובלע.") : t(`Rule #${hit + 1} matched first; rules below it were never evaluated.`, `חוק #${hit + 1} תפס ראשון; החוקים שמתחתיו לא נבדקו בכלל.`)}</div>`;
      };
      el.querySelectorAll("[data-pre]").forEach(b => b.onclick = () => { rules = presets[b.dataset.pre].map(r => r.slice()); drawRules(); $("#verdict").innerHTML = ""; });
      el.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { $("#src").value = b.dataset.s; $("#port").value = b.dataset.port; $("#proto").value = "tcp"; fire(); });
      $("#add").onclick = () => { rules.push(["allow", "0.0.0.0/0", "any", "tcp"]); drawRules(); };
      $("#fire").onclick = fire; drawRules(); return null;
    }
  };

  // =============== 7. Scheduler ===============
  I.sims.scheduler = {
    icon: "🧩", track: "kubernetes",
    title: { en: "Kubernetes scheduler", he: "ה-Scheduler של Kubernetes" },
    desc: { en: "Deploy pods by CPU request, kill nodes, taint the GPU node, add nodes like the Cluster Autoscaler.", he: "פרוס pods לפי CPU request, הפל nodes, שים taint על ה-node עם ה-GPU, הוסף nodes כמו Cluster Autoscaler." },
    mount(el, H) {
      const t = T(H);
      const colors = ["#4c6ef5", "#12b886", "#f76707", "#ae3ec9", "#e64980", "#1098ad"];
      let nodes = [{ name: "node-a", cap: 4000, up: true }, { name: "node-b", cap: 4000, up: true }, { name: "gpu-1", cap: 8000, up: true, taint: true }];
      let pods = [], seq = 0, events = [];
      el.innerHTML = `<div class="sim-controls">
        <label>${t("App", "אפליקציה")}<select id="app">${["web", "api", "worker", "ml-train"].map((a, i) => `<option value="${i}">${a}</option>`).join("")}</select></label>
        <label>CPU request<select id="req"><option>250</option><option selected>500</option><option>1000</option><option>2000</option><option>3000</option></select></label>
        <label>${t("Replicas", "רפליקות")}<select id="rep"><option>1</option><option selected>3</option><option>5</option></select></label>
        <label>${t("Strategy", "אסטרטגיה")}<select id="strat"><option value="spread">${t("Spread (LeastAllocated)", "פיזור (LeastAllocated)")}</option><option value="pack">${t("Bin-pack (MostAllocated)", "דחיסה (MostAllocated)")}</option></select></label>
        <label><span><input type="checkbox" id="tol"> ${t("tolerates gpu taint", "toleration ל-taint של gpu")}</span></label>
        <button class="btn primary" id="deploy">🚀 kubectl apply</button></div>
        <div class="row" style="margin-bottom:10px"><button class="btn small" id="addNode">➕ ${t("Add node (autoscaler)", "הוספת node (autoscaler)")}</button><button class="btn small" id="taint">🏷️ ${t("Toggle taint on gpu-1", "הדלקה/כיבוי taint על gpu-1")}</button><button class="btn small" id="clear">🧹 ${t("Delete all pods", "מחיקת כל ה-pods")}</button></div>
        <div class="sim-stage"><div class="nodes" id="nodes"></div><div style="margin-top:10px"><b>⏳ Pending:</b> <span class="pending" id="pend"></span></div></div>
        <p class="muted" style="font-size:.88em">${t("Tip: click a node to crash / recover it.", "טיפ: לחץ על node כדי להפיל / לשחזר אותו.")}</p>
        <pre id="ev" style="font-size:.8em;max-height:150px"></pre><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      const used = (n) => pods.filter(p => p.node === n.name).reduce((a, p) => a + p.req, 0);
      const ev = (s) => { events.push(s); events = events.slice(-8); };
      const schedule = () => {
        const strat = $("#strat").value;
        pods.filter(p => !p.node).forEach(p => {
          const fits = nodes.filter(n => n.up && (!n.taint || p.tol) && n.cap - used(n) >= p.req);
          if (!fits.length) { if (!p.warned) { ev(`Warning  FailedScheduling  pod/${p.name}  0/${nodes.length} nodes are available: ${nodes.filter(n => !n.up).length} node(s) NotReady, ${nodes.filter(n => n.up && n.taint && !p.tol).length} node(s) had untolerated taint {gpu: true}, insufficient cpu.`); p.warned = true; } return; }
          fits.sort((a, b) => strat === "spread" ? (used(a) / a.cap) - (used(b) / b.cap) : (used(b) / b.cap) - (used(a) / a.cap));
          p.node = fits[0].name; p.warned = false; ev(`Normal   Scheduled  pod/${p.name}  Successfully assigned to ${p.node}`);
        });
      };
      const draw = () => {
        $("#nodes").innerHTML = nodes.map(n => { const u = used(n); return `<div class="node ${n.up ? "" : "down"}" data-n="${n.name}" style="cursor:pointer"><b>${n.up ? "🖥️" : "💀"} ${n.name}</b> ${n.taint ? "🏷️" : ""}<br><small>${u}m / ${n.cap}m CPU</small>
          <div class="gauge" style="height:8px;margin:4px 0"><div class="fill" style="width:${u / n.cap * 100}%"></div></div><div class="pods">${pods.filter(p => p.node === n.name).map(p => `<span class="pod" style="background:${p.color}">${p.name}</span>`).join("")}</div></div>`; }).join("");
        $("#pend").innerHTML = pods.filter(p => !p.node).map(p => `<span class="pod" style="background:${p.color};opacity:.6">${p.name}</span>`).join("") || "—";
        $("#ev").textContent = "$ kubectl get events\n" + events.join("\n");
        el.querySelectorAll("[data-n]").forEach(d => d.onclick = () => {
          const n = nodes.find(x => x.name === d.dataset.n); n.up = !n.up;
          if (!n.up) { ev(`Warning  NodeNotReady  node/${n.name}  Node is not ready — evicting pods`); pods.forEach(p => { if (p.node === n.name) p.node = null; }); }
          else ev(`Normal   NodeReady  node/${n.name}`);
          schedule(); draw(); lesson();
        });
      };
      const lesson = () => {
        const pend = pods.filter(p => !p.node);
        let msg;
        if (pend.length && nodes.some(n => !n.up)) msg = t("💀 A node died: its pods were evicted and rescheduled onto the survivors — if there's room. No room → Pending. That's why you keep headroom (N+1).", "💀 Node מת: ה-pods שלו פונו ושובצו מחדש על השורדים — אם יש מקום. אין מקום ← Pending. בגלל זה שומרים headroom (N+1).");
        else if (pend.length) msg = t("⏳ Pending = no node has enough UNREQUESTED CPU (or a taint blocks it). Fix: smaller requests, add a node (Cluster Autoscaler does exactly this when it sees Pending pods), or add a toleration.", "⏳ Pending = לאף node אין מספיק CPU שלא הוזמן (או ש-taint חוסם). פתרון: requests קטנים יותר, להוסיף node (ה-Cluster Autoscaler עושה בדיוק את זה כשהוא רואה Pending), או להוסיף toleration.");
        else if ($("#strat").value === "pack") msg = t("📦 Bin-packing fills nodes tightly → fewer nodes, lower cost, but a node failure hurts more pods.", "📦 דחיסה ממלאת nodes עד הסוף ← פחות nodes, פחות עלות, אבל נפילת node פוגעת ביותר pods.");
        else msg = t("🌍 Spreading balances load and limits the blast radius of a node failure. Note gpu-1 is tainted: only pods with a matching toleration may land there.", "🌍 פיזור מאזן עומס ומקטין את ה-blast radius של נפילת node. שים לב: על gpu-1 יש taint — רק pods עם toleration מתאים יכולים לנחות שם.");
        $("#lesson").innerHTML = msg;
      };
      $("#deploy").onclick = () => {
        const ai = +$("#app").value, name = ["web", "api", "worker", "ml-train"][ai];
        for (let i = 0; i < +$("#rep").value; i++) pods.push({ name: `${name}-${(++seq).toString(36)}`, req: +$("#req").value, color: colors[ai], tol: $("#tol").checked, node: null });
        schedule(); draw(); lesson();
      };
      $("#addNode").onclick = () => { nodes.push({ name: `node-${String.fromCharCode(97 + nodes.length)}`, cap: 4000, up: true }); ev(`Normal   ScaleUp  cluster-autoscaler  added node-${String.fromCharCode(97 + nodes.length - 1)}`); schedule(); draw(); lesson(); };
      $("#taint").onclick = () => { const g = nodes.find(n => n.name === "gpu-1"); g.taint = !g.taint; schedule(); draw(); lesson(); };
      $("#clear").onclick = () => { pods = []; events = []; draw(); lesson(); };
      draw(); lesson(); return null;
    }
  };

  // =============== 8. DR / BCDR ===============
  I.sims.dr = {
    icon: "🌪️", track: "reliability",
    title: { en: "Disaster recovery: RPO & RTO", he: "התאוששות מאסון: RPO ו-RTO" },
    desc: { en: "Pick a DR strategy, set business targets, then trigger a disaster. How much data did you lose? How long were you down? What did it cost?", he: "בחר אסטרטגיית DR, קבע יעדים עסקיים, ואז הפעל אסון. כמה מידע איבדת? כמה זמן היית למטה? כמה זה עלה?" },
    mount(el, H) {
      const t = T(H);
      const S = {
        backup: { n: t("Backup & Restore", "Backup & Restore"), cost: 1.1, rpoF: (h) => Math.random() * h * 60, rto: [360, 1440], c: "#868e96", d: t("Nightly/periodic backups to another region. Restore everything from scratch when disaster hits.", "גיבויים תקופתיים ל-region אחר. משחזרים הכול מאפס כשהאסון מגיע.") },
        pilot: { n: "Pilot Light", cost: 1.25, rpoF: () => 1 + Math.random() * 10, rto: [60, 240], c: "#f59f00", d: t("Data replicated continuously; core infra (DB) is on, but app servers are off. Scale up on disaster.", "המידע משוכפל ברציפות; תשתית הליבה (DB) דולקת, אבל שרתי האפליקציה כבויים. מגדילים בזמן אסון.") },
        warm: { n: "Warm Standby", cost: 1.6, rpoF: () => Math.random() * 2, rto: [10, 30], c: "#1c7ed6", d: t("A scaled-down full copy is always running. Scale it up and switch DNS.", "עותק מלא מוקטן רץ כל הזמן. מגדילים ומעבירים DNS.") },
        active: { n: "Multi-site Active/Active", cost: 2.2, rpoF: () => Math.random() * .05, rto: [0, 2], c: "#2f9e44", d: t("Both regions serve traffic all the time. Losing one = the other absorbs. Hardest: data consistency & conflicts.", "שני ה-regions מגישים תעבורה כל הזמן. נפל אחד = השני סופג. הכי קשה: עקביות מידע וקונפליקטים.") }
      };
      el.innerHTML = `<div class="sim-controls">
        <label>${t("DR strategy", "אסטרטגיית DR")}<select id="st">${Object.entries(S).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join("")}</select></label>
        ${slider("bf", t("Backup every (hours)", "גיבוי כל (שעות)"), 1, 24, 1, 24)}
        <label>${t("Business RPO target", "יעד RPO עסקי")}<select id="rpoT"><option value="1440">24h</option><option value="60">1h</option><option value="15" selected>15 min</option><option value="1">~0</option></select></label>
        <label>${t("Business RTO target", "יעד RTO עסקי")}<select id="rtoT"><option value="1440">24h</option><option value="240">4h</option><option value="60" selected>1h</option><option value="5">5 min</option></select></label>
        <label>${t("Monthly infra cost (single region) $", "עלות תשתית חודשית (region אחד) $")}<input type="number" id="base" value="20000" style="width:110px"></label>
        <button class="btn bad" id="boom">💥 ${t("Region goes down!", "ה-Region נופל!")}</button></div>
      <p id="desc" class="muted"></p>
      <div class="dr-timeline" id="tl"></div>
      <div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      $("#bf").oninput = (e) => $("#bfV").textContent = e.target.value;
      const desc = () => { const s = S[$("#st").value]; $("#desc").textContent = s.d; $("#bf").parentElement.style.display = $("#st").value === "backup" ? "" : "none"; };
      $("#st").onchange = desc; desc();
      const dur = (m) => m >= 60 ? fmt(m / 60, 1) + "h" : m >= 1 ? fmt(m, 0) + " min" : fmt(m * 60, 0) + " s";
      $("#boom").onclick = () => {
        const k = $("#st").value, s = S[k];
        const rpo = s.rpoF(+$("#bf").value), rto = s.rto[0] + Math.random() * (s.rto[1] - s.rto[0]);
        const rpoT = +$("#rpoT").value, rtoT = +$("#rtoT").value;
        const span = Math.max(rpo + rto, 60) * 1.15;
        const x = (m) => (m / span * 100);
        const lossStart = 0, boom = rpo;
        $("#tl").innerHTML = `<div class="dr-seg" style="left:${x(lossStart)}%;width:${Math.max(.5, x(rpo))}%;background:var(--warn)">${t("data lost", "מידע אבד")} (RPO ${dur(rpo)})</div>
          <div class="dr-seg" style="left:${x(boom)}%;width:${Math.max(.5, x(rto))}%;background:var(--bad)">${t("down", "למטה")} (RTO ${dur(rto)})</div>
          <div style="position:absolute;left:${x(boom)}%;top:0;font-size:18px;transform:translateX(-50%)">💥</div>
          <div style="position:absolute;left:0;bottom:2px;font-size:11px" class="muted">${t("last good copy", "עותק תקין אחרון")}</div><div style="position:absolute;right:4px;bottom:2px;font-size:11px" class="muted">${t("back online", "חזרה לאוויר")}</div>`;
        const okRpo = rpo <= rpoT, okRto = rto <= rtoT;
        $("#out").innerHTML = metric("RPO " + t("(data lost)", "(מידע שאבד)"), dur(rpo), okRpo ? "good" : "bad") + metric("RTO " + t("(downtime)", "(זמן השבתה)"), dur(rto), okRto ? "good" : "bad") +
          metric(t("Monthly cost", "עלות חודשית"), "$" + fmt(+$("#base").value * s.cost), "") + metric(t("Targets met?", "עמדנו ביעדים?"), okRpo && okRto ? "✅" : "❌", okRpo && okRto ? "good" : "bad");
        let msg = okRpo && okRto ? t("✅ Targets met. Now ask: is this strategy over-paying? Pick the CHEAPEST strategy that meets the business RPO/RTO — not the fanciest.", "✅ עמדנו ביעדים. עכשיו תשאל: האם אנחנו משלמים יותר מדי? בוחרים את האסטרטגיה הזולה ביותר שעומדת ב-RPO/RTO העסקי — לא את המפוארת ביותר.")
          : t(`❌ ${!okRpo ? "RPO missed: you lost more data than the business allows — replicate more often. " : ""}${!okRto ? "RTO missed: restoring took too long — keep more infra warm, automate failover." : ""}`, `❌ ${!okRpo ? "פספסנו RPO: איבדנו יותר מידע ממה שהעסק מרשה — לשכפל בתדירות גבוהה יותר. " : ""}${!okRto ? "פספסנו RTO: השחזור לקח יותר מדי — להשאיר יותר תשתית חמה, לאטמט failover." : ""}`);
        msg += "<br>" + t("🧠 RPO = how far BACK in time you lose data (Point). RTO = how long until you're back (Time). And a DR plan you never drilled is a wish.", "🧠 RPO = כמה אחורה בזמן איבדת מידע (Point). RTO = כמה זמן עד שחזרת (Time). ותוכנית DR שלא תורגלה היא משאלה.");
        $("#lesson").innerHTML = msg;
      };
      return null;
    }
  };

  // =============== 9. Cache ===============
  I.sims.cache = {
    icon: "⚡", track: "architecture",
    title: { en: "Cache hit-ratio lab", he: "מעבדת Cache Hit Ratio" },
    desc: { en: "Tune cache size and TTL against a realistic (Zipf) traffic pattern. Then flush the cache and watch the database get stampeded.", he: "כוונן גודל cache ו-TTL מול תבנית תעבורה מציאותית (Zipf). אז תרוקן את ה-cache ותראה את ה-DB נרמס." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls">
        ${slider("size", t("Cache size (keys)", "גודל cache (מפתחות)"), 0, 5000, 100, 1000)}
        ${slider("ttl", "TTL (s)", 1, 600, 1, 60)}
        ${slider("skew", t("Traffic skew (hot keys)", "הטיית תעבורה (מפתחות חמים)"), 0, 1.4, 0.1, 1)}
        <button class="btn small bad" id="flush">🧨 ${t("Flush cache (deploy / restart)", "ריקון cache (deploy / restart)")}</button></div>
      <canvas class="chart" id="ch"></canvas>${legend([[css("--good"), t("hit ratio %", "hit ratio %")], [css("--bad"), t("DB queries/s", "שאילתות DB לשנייה")]])}
      <div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      const KEYS = 20000, RPS = 2000;
      let cache = new Map(), time = 0, hr = [], db = [], cdf = null, lastSkew = null;
      const buildCdf = (s) => { const w = []; let sum = 0; for (let i = 1; i <= KEYS; i++) { sum += 1 / Math.pow(i, s); w.push(sum); } return w.map(x => x / sum); };
      const sample = () => { const r = Math.random(); let lo = 0, hi = KEYS - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < r) lo = m + 1; else hi = m; } return lo; };
      ["size", "ttl", "skew"].forEach(id => $("#" + id).oninput = (e) => $("#" + id + "V").textContent = e.target.value);
      $("#flush").onclick = () => cache.clear();
      const tick = setInterval(() => {
        const skew = +$("#skew").value; if (skew !== lastSkew) { cdf = buildCdf(skew); lastSkew = skew; }
        const size = +$("#size").value, ttl = +$("#ttl").value;
        time += 1; let hits = 0; const N = 400; // sample of requests representing 1s
        for (let i = 0; i < N; i++) {
          const k = sample(); const e = cache.get(k);
          if (e && e > time) { hits++; cache.delete(k); cache.set(k, e); }
          else { if (size > 0) { cache.delete(k); cache.set(k, time + ttl); if (cache.size > size) cache.delete(cache.keys().next().value); } }
        }
        const h = hits / N; hr.push(h * 100); db.push((1 - h) * RPS); if (hr.length > 120) { hr.shift(); db.shift(); }
        chart($("#ch"), [{ data: hr, color: css("--good") }, { data: db.map(x => x / RPS * 100), color: css("--bad"), fill: true }], { maxY: 100 });
        const lat = h * 1 + (1 - h) * 40;
        $("#out").innerHTML = metric("Hit ratio", fmt(h * 100, 1) + "%", h > .8 ? "good" : h > .5 ? "warn" : "bad") + metric(t("DB load", "עומס DB"), fmt((1 - h) * RPS) + " q/s", (1 - h) * RPS > 1000 ? "bad" : "good") + metric(t("Avg latency", "Latency ממוצע"), fmt(lat, 1) + " ms") + metric(t("Keys in cache", "מפתחות ב-cache"), fmt(cache.size));
        let msg;
        if (h < .3 && hr.length > 3 && hr[hr.length - 4] > 60) msg = t("🐘💥 Cold cache! Every request falls through to the DB at once — a cache stampede. Mitigations: warm the cache before traffic, request coalescing, staggered TTLs (jitter).", "🐘💥 Cache קר! כל הבקשות נופלות ל-DB בבת אחת — cache stampede. פתרונות: לחמם את ה-cache לפני תעבורה, איחוד בקשות (coalescing), TTL עם jitter.");
        else if (skew < .4) msg = t("🎲 Uniform traffic = no hot keys → caching barely helps unless the cache holds almost everything.", "🎲 תעבורה אחידה = אין מפתחות חמים ← cache כמעט לא עוזר אלא אם הוא מחזיק כמעט הכול.");
        else msg = t(`💡 Real traffic is skewed: a few keys get most hits, so even a small cache wins big. Avg latency = hit% × 1ms + miss% × 40ms. Short TTL = fresher data, more misses.`, `💡 תעבורה אמיתית מוטה: מעט מפתחות מקבלים את רוב הפניות, אז גם cache קטן מרוויח הרבה. Latency ממוצע = hit% × 1ms + miss% × 40ms. TTL קצר = מידע טרי יותר, יותר misses.`);
        $("#lesson").innerHTML = msg;
      }, 300);
      return () => clearInterval(tick);
    }
  };

  // =============== 10. Autoscaling ===============
  I.sims.scaling = {
    icon: "📈", track: "kubernetes",
    title: { en: "Autoscaling vs traffic", he: "Autoscaling מול תעבורה" },
    desc: { en: "A day of traffic in 30 seconds. Tune min/max replicas, target CPU and pod startup time. Fire a spike. Watch errors and cost.", he: "יום של תעבורה ב-30 שניות. כוונן min/max replicas, יעד CPU וזמן עליית pod. שלח spike. ראה שגיאות ועלות." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls">
        <label><span><input type="checkbox" id="auto" checked> HPA ${t("on", "פעיל")}</span></label>
        ${slider("min", "min replicas", 1, 10, 1, 2)}${slider("max", "max replicas", 2, 40, 1, 20)}
        ${slider("target", t("target CPU %", "יעד CPU %"), 30, 95, 5, 70)}${slider("boot", t("time to ready: node + pod (min)", "זמן עד מוכנות: node + pod (דק')"), 0, 60, 5, 10)}
        <button class="btn small bad" id="spike">🚀 ${t("Black Friday spike", "ספייק של בלאק פריידיי")}</button></div>
      <canvas class="chart" id="ch" style="height:220px"></canvas>${legend([[css("--accent"), t("traffic (rps)", "תעבורה (rps)")], [css("--good"), t("capacity (ready pods × 100 rps)", "קיבולת (pods מוכנים × 100 rps)")], [css("--bad"), t("dropped", "נזרק")]])}
      <div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      ["min", "max", "target", "boot"].forEach(id => $("#" + id).oninput = (e) => $("#" + id + "V").textContent = e.target.value);
      let minute = 0, ready = 2, starting = [], tr = [], cap = [], drop = [], spike = 0, podMinutes = 0, dropped = 0, served = 0;
      $("#spike").onclick = () => spike = 60;
      const PER = 100;
      const tick = setInterval(() => {
        minute += 5; // each tick = 5 simulated minutes
        const hour = (minute / 60) % 24;
        let traffic = 300 + 900 * Math.max(0, Math.sin((hour - 6) / 24 * 2 * Math.PI)) + Math.random() * 80;
        if (spike > 0) { traffic += 1800 * Math.min(1, spike / 30); spike -= 10; }
        const min = +$("#min").value, max = Math.max(min, +$("#max").value), target = +$("#target").value / 100, boot = +$("#boot").value;
        starting = starting.map(s => s - 5); const nowReady = starting.filter(s => s <= 0).length; ready += nowReady; starting = starting.filter(s => s > 0);
        if ($("#auto").checked) {
          const util = traffic / Math.max(1, ready * PER);
          const desired = clamp(Math.ceil(ready * util / target), min, max);
          const total = ready + starting.length;
          if (desired > total) for (let i = 0; i < desired - total; i++) starting.push(boot);
          else if (desired < ready && minute % 30 === 0) ready = Math.max(min, ready - 1); // slow scale-down (stabilization)
        } else { ready = min; starting = []; }
        const capacity = ready * PER; const d = Math.max(0, traffic - capacity);
        dropped += d; served += traffic; podMinutes += (ready + starting.length) * 5;
        tr.push(traffic); cap.push(capacity); drop.push(d); if (tr.length > 288) { tr.shift(); cap.shift(); drop.shift(); }
        const mx = Math.max(...tr, ...cap) * 1.1;
        chart($("#ch"), [{ data: tr, color: css("--accent"), fill: true }, { data: cap, color: css("--good"), width: 2.5 }, { data: drop, color: css("--bad"), fill: true }], { maxY: mx });
        const errPct = served ? dropped / served * 100 : 0;
        $("#out").innerHTML = metric(t("Time", "שעה"), `${String(Math.floor(hour)).padStart(2, "0")}:${String(Math.floor(minute % 60)).padStart(2, "0")}`) + metric(t("Ready pods", "Pods מוכנים"), ready) + metric(t("Starting", "עולים"), starting.length) +
          metric(t("Dropped requests", "בקשות שנזרקו"), fmt(errPct, 2) + "%", errPct > 1 ? "bad" : "good") + metric(t("Cost (pod-hours)", "עלות (pod-hours)"), fmt(podMinutes / 60));
        let msg;
        if (!$("#auto").checked) msg = t("🧱 Fixed capacity: either you over-provision for the peak (paying all night) or you drop traffic at peak. Turn HPA on.", "🧱 קיבולת קבועה: או שמקצים ל-peak (ומשלמים כל הלילה) או שזורקים תעבורה ב-peak. הדלק HPA.");
        else if (d > 0 && starting.length) msg = t("⏳ The autoscaler reacted, but new pods take time to start. Scaling is never instant: lower the target %, keep more min replicas before known events, make startup faster.", "⏳ ה-autoscaler הגיב, אבל pods חדשים לוקחים זמן לעלות. Scaling אף פעם לא מיידי: הורד את יעד ה-%, החזיקו יותר min replicas לפני אירועים ידועים, קצרו את זמן העלייה.");
        else if (d > 0 && ready >= max) msg = t("🧢 Hit max replicas — the ceiling protects your budget (and your DB!), but traffic above it is dropped.", "🧢 הגענו ל-max replicas — התקרה מגינה על התקציב (ועל ה-DB!), אבל תעבורה מעליה נזרקת.");
        else msg = t("💡 HPA formula: desired = ceil(current × currentUtil / targetUtil). Lower target = more headroom = more cost. Scale-down is deliberately slow to avoid flapping.", "💡 נוסחת HPA: desired = ceil(current × currentUtil / targetUtil). יעד נמוך = יותר headroom = יותר עלות. ה-scale down איטי בכוונה כדי למנוע flapping.");
        $("#lesson").innerHTML = msg;
      }, 200);
      return () => clearInterval(tick);
    }
  };

  // =============== 11. Terminal ===============
  I.sims.terminal = {
    icon: "💻", track: "kubernetes",
    title: { en: "Debug terminal: the mystery pod", he: "טרמינל דיבאג: ה-Pod המסתורי" },
    desc: { en: "A fake shell with real-looking output. checkout is down — find out why using kubectl, docker and Linux tools. Type 'help'.", he: "Shell מדומה עם פלט שנראה אמיתי. checkout למטה — גלו למה עם kubectl, docker וכלי Linux. הקלד help." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="term" id="out"></div><div class="term-input"><span>$</span><input id="in" autocomplete="off" spellcheck="false" placeholder="kubectl get pods"></div>
        <div class="row" style="margin-top:8px">${["help", "kubectl get pods", "kubectl describe pod checkout-7d9f-x2k", "kubectl logs checkout-7d9f-x2k --previous", "kubectl top pods", "free -h", "dig api.payments.internal"].map(c => `<button class="btn small mono" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
      const $ = (s) => el.querySelector(s);
      const out = $("#out"); let found = { oom: false };
      const print = (s, cls) => { out.innerHTML += (cls ? `<span style="color:${cls}">` : "") + esc(s) + (cls ? "</span>" : "") + "\n"; out.scrollTop = out.scrollHeight; };
      const C = {
        "help": () => t(`Mission: checkout is failing. Find the root cause, then type:  answer <cause>
Commands: kubectl get pods|nodes|events|svc|deploy · kubectl describe pod <name> · kubectl logs <pod> [--previous]
kubectl top pods|nodes · kubectl get deploy checkout -o yaml · docker ps · docker stats · free -h · df -h · uptime
top · ss -tlnp · dig <host> · curl -v <url> · ping <host> · clear`, `משימה: checkout נכשל. מצא את שורש הבעיה ואז הקלד:  answer <cause>
פקודות: kubectl get pods|nodes|events|svc|deploy · kubectl describe pod <name> · kubectl logs <pod> [--previous]
kubectl top pods|nodes · kubectl get deploy checkout -o yaml · docker ps · docker stats · free -h · df -h · uptime
top · ss -tlnp · dig <host> · curl -v <url> · ping <host> · clear`),
        "kubectl get pods": () => `NAME                        READY   STATUS             RESTARTS        AGE
checkout-7d9f-x2k           0/1     CrashLoopBackOff   7 (42s ago)     14m
checkout-7d9f-p8m           0/1     CrashLoopBackOff   7 (51s ago)     14m
cart-5c6b-qq1               1/1     Running            0               3d
payments-68f-z9t            1/1     Running            0               3d
frontend-74d-aa2            1/1     Running            0               2d`,
        "kubectl get nodes": () => `NAME     STATUS   ROLES    AGE   VERSION
node-a   Ready    <none>   41d   v1.31.2
node-b   Ready    <none>   41d   v1.31.2
node-c   Ready    <none>   12d   v1.31.2`,
        "kubectl get events": () => `LAST SEEN   TYPE      REASON      OBJECT                       MESSAGE
14m         Normal    Scheduled   pod/checkout-7d9f-x2k        Successfully assigned default/checkout-7d9f-x2k to node-b
14m         Normal    Pulled      pod/checkout-7d9f-x2k        Container image "registry.local/checkout:2.4.0" already present
42s         Warning   BackOff     pod/checkout-7d9f-x2k        Back-off restarting failed container checkout
51s         Warning   BackOff     pod/checkout-7d9f-p8m        Back-off restarting failed container checkout`,
        "kubectl get svc": () => `NAME       TYPE        CLUSTER-IP     PORT(S)    AGE
checkout   ClusterIP   10.96.41.12    8080/TCP   90d
payments   ClusterIP   10.96.8.201    8080/TCP   90d`,
        "kubectl get deploy": () => `NAME       READY   UP-TO-DATE   AVAILABLE   AGE
checkout   0/2     2            0           90d
cart       1/1     1            1           90d
payments   1/1     1            1           90d`,
        "kubectl get deploy checkout -o yaml": () => `...
    spec:
      containers:
      - name: checkout
        image: registry.local/checkout:2.4.0   # was 2.3.1 yesterday
        resources:
          requests: { cpu: 250m, memory: 256Mi }
          limits:   { cpu: "1",  memory: 256Mi }
        livenessProbe: { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10 }
...`,
        "kubectl describe pod": () => `Name:         checkout-7d9f-x2k
Node:         node-b/10.0.2.14
Containers:
  checkout:
    Image:          registry.local/checkout:2.4.0
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Tue, 12 Nov 2026 10:41:02
      Finished:     Tue, 12 Nov 2026 10:41:39
    Restart Count:  7
    Limits:
      cpu:     1
      memory:  256Mi
    Requests:
      cpu:     250m
      memory:  256Mi
Events:
  Warning  BackOff  42s (x31 over 13m)  kubelet  Back-off restarting failed container`,
        "kubectl logs": () => `{"level":"info","msg":"starting checkout v2.4.0","port":8080}
{"level":"info","msg":"loading product catalog into memory cache","items":182340}
{"level":"info","msg":"cache warmup 61%"}`,
        "kubectl logs --previous": () => `{"level":"info","msg":"starting checkout v2.4.0","port":8080}
{"level":"info","msg":"loading product catalog into memory cache","items":182340}
{"level":"info","msg":"cache warmup 61%"}
{"level":"info","msg":"cache warmup 93%"}
(container was killed — no more output. Killed processes don't get to log their goodbye.)`,
        "kubectl top pods": () => `NAME                CPU(cores)   MEMORY(bytes)
checkout-7d9f-x2k   612m         251Mi
cart-5c6b-qq1       35m          120Mi
payments-68f-z9t    48m          180Mi`,
        "kubectl top nodes": () => `NAME     CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
node-a   812m         20%    3120Mi          39%
node-b   1430m        35%    2890Mi          36%
node-c   402m         10%    2214Mi          28%`,
        "docker ps": () => `CONTAINER ID   IMAGE                          STATUS                     NAMES
a1b2c3d4e5f6   registry.local/cart:1.9.2      Up 3 days                  k8s_cart_cart-5c6b
f6e5d4c3b2a1   registry.local/checkout:2.4.0  Exited (137) 40 seconds ago  k8s_checkout_checkout-7d9f`,
        "docker stats": () => `NAME                         CPU %   MEM USAGE / LIMIT   MEM %
k8s_cart_cart-5c6b           0.8%    120MiB / 512MiB     23.4%
k8s_checkout_checkout-7d9f   61.2%   254MiB / 256MiB     99.2%`,
        "free -h": () => `               total        used        free      shared  buff/cache   available
Mem:            7.7Gi       2.8Gi       412Mi        12Mi       4.5Gi       4.6Gi
Swap:              0B          0B          0B
# ${t("Note: low 'free' is fine — buff/cache is reclaimable. Look at 'available'. The node is NOT out of memory.", "שים לב: 'free' נמוך זה בסדר — buff/cache ניתן לשחרור. מסתכלים על 'available'. ל-node יש זיכרון.")}`,
        "df -h": () => `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   80G   41G   39G  52% /
overlay          80G   41G   39G  52% /var/lib/containerd`,
        "uptime": () => ` 10:42:13 up 41 days,  3:12,  0 users,  load average: 1.21, 1.35, 1.40   (4 vCPU → fine)`,
        "top": () => `top - 10:42:15 up 41 days, load average: 1.21, 1.35, 1.40
Tasks: 212 total,   1 running, 211 sleeping
%Cpu(s): 18.2 us,  4.1 sy,  0.0 ni, 76.9 id,  0.6 wa,  0.0 hi,  0.2 si,  0.0 st
MiB Mem :   7884.0 total,    412.3 free,   2867.5 used,   4604.2 buff/cache
  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 8812 1000      20   0 1287340 254112  20140 S  61.0   3.1   0:31.82 java`,
        "ss -tlnp": () => `State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port  Process
LISTEN  0       4096     0.0.0.0:8080         0.0.0.0:*          users:(("java",pid=8812))
LISTEN  0       4096     0.0.0.0:10250        0.0.0.0:*          users:(("kubelet",pid=611))`,
        "dig": () => `;; ANSWER SECTION:
api.payments.internal.  30  IN  A  10.96.8.201
;; Query time: 2 msec   (${t("DNS is fine this time 😉", "הפעם זה לא DNS 😉")})`,
        "curl": () => `*   Trying 10.96.41.12:8080...
* connect to 10.96.41.12 port 8080 failed: Connection refused
curl: (7) Failed to connect   (${t("no ready endpoints behind the service", "אין endpoints מוכנים מאחורי ה-service")})`,
        "ping": () => `PING 10.0.2.14: 56 data bytes
64 bytes from 10.0.2.14: icmp_seq=0 ttl=64 time=0.41 ms
64 bytes from 10.0.2.14: icmp_seq=1 ttl=64 time=0.38 ms   (${t("network is fine", "הרשת בסדר")})`
      };
      const run = (raw) => {
        const cmd = raw.trim().replace(/\s+/g, " "); if (!cmd) return;
        print("$ " + cmd, css("--good"));
        if (cmd === "clear") { out.innerHTML = ""; return; }
        if (cmd.startsWith("answer")) {
          const a = cmd.slice(6).toLowerCase();
          if (/oom|memory|זיכרון|137|limit/.test(a)) {
            print(t(`✅ Correct! v2.4.0 loads the whole product catalog into an in-memory cache; it needs ~300Mi but the memory LIMIT is 256Mi → OOMKilled (exit 137) → CrashLoopBackOff.
Fix now: kubectl rollout undo deploy/checkout  (mitigate first!)
Fix properly: raise memory request+limit (e.g. 512Mi) based on measured usage, or don't cache the whole catalog in-process (use Redis).
+60 XP`, `✅ נכון! v2.4.0 טוען את כל קטלוג המוצרים ל-cache בזיכרון; הוא צריך ~300Mi אבל ה-LIMIT הוא 256Mi ← OOMKilled (exit 137) ← CrashLoopBackOff.
תיקון מיידי: kubectl rollout undo deploy/checkout  (קודם מייצבים!)
תיקון אמיתי: להגדיל memory request+limit (למשל 512Mi) לפי מדידה, או לא לשמור את כל הקטלוג בזיכרון התהליך (Redis).
+60 XP`), css("--good"));
            if (!found.oom) { found.oom = true; H.addXP(60, "+60 XP 🕵️"); }
          } else print(t("❌ Not it. Hint: look at 'Last State' in kubectl describe.", "❌ לא זה. רמז: הסתכל על 'Last State' ב-kubectl describe."), css("--bad"));
          return;
        }
        if (cmd.startsWith("kubectl rollout undo")) { print("deployment.apps/checkout rolled back\n" + t("👍 Good instinct: mitigate first. But what was the root cause? (answer <cause>)", "👍 אינסטינקט טוב: קודם מייצבים. אבל מה שורש הבעיה? (answer <cause>)")); return; }
        let key = Object.keys(C).find(k => k === cmd);
        if (!key) {
          if (/^kubectl describe pod/.test(cmd)) key = "kubectl describe pod";
          else if (/^kubectl logs .*--previous/.test(cmd) || /^kubectl logs .*-p\b/.test(cmd)) key = "kubectl logs --previous";
          else if (/^kubectl logs/.test(cmd)) key = "kubectl logs";
          else if (/^kubectl get po/.test(cmd)) key = "kubectl get pods";
          else if (/^kubectl get (ev|events)/.test(cmd)) key = "kubectl get events";
          else if (/^kubectl get (no|nodes)/.test(cmd)) key = "kubectl get nodes";
          else if (/^kubectl get deploy.*yaml/.test(cmd)) key = "kubectl get deploy checkout -o yaml";
          else if (/^kubectl get deploy/.test(cmd)) key = "kubectl get deploy";
          else if (/^(dig|nslookup)/.test(cmd)) key = "dig";
          else if (/^curl/.test(cmd)) key = "curl";
          else if (/^ping/.test(cmd)) key = "ping";
          else if (/^(htop|top)/.test(cmd)) key = "top";
          else if (/^(netstat|ss)/.test(cmd)) key = "ss -tlnp";
          else if (/^free/.test(cmd)) key = "free -h";
          else if (/^df/.test(cmd)) key = "df -h";
        }
        if (key) print(C[key]()); else print(t(`command not found in this simulator: ${cmd}  (type 'help')`, `הפקודה לא קיימת בסימולטור: ${cmd}  (הקלד help)`), css("--warn"));
      };
      print(t("📟 PagerDuty: [P1] checkout — 100% of requests failing. You're on call. Type 'help' to start.", "📟 PagerDuty: [P1] checkout — 100% מהבקשות נכשלות. אתה בתורנות. הקלד help כדי להתחיל."), css("--bad"));
      const inp = $("#in"); const hist = []; let hi = 0;
      inp.onkeydown = (e) => {
        if (e.key === "Enter") { hist.push(inp.value); hi = hist.length; run(inp.value); inp.value = ""; }
        else if (e.key === "ArrowUp") { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ""; e.preventDefault(); }
        else if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ""; e.preventDefault(); }
      };
      el.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { run(b.dataset.c); inp.focus(); });
      return null;
    }
  };
  // =============== 12. Cache eviction: FIFO vs LRU vs LFU ===============
  I.sims.eviction = {
    icon: "🧹", track: "architecture",
    title: { en: "Cache eviction lab: FIFO vs LRU vs LFU", he: "מעבדת Eviction: FIFO מול LRU מול LFU" },
    desc: { en: "Same requests, same cache size, three eviction policies side by side. Click keys yourself or play a traffic pattern and see who wins — and when LRU collapses.", he: "אותן בקשות, אותו גודל cache, שלוש מדיניות eviction זו לצד זו. לחץ על מפתחות בעצמך או הרץ תבנית תעבורה וראה מי מנצח — ומתי LRU קורס." },
    mount(el, H) {
      const t = T(H);
      const KEYS = "ABCDEFGHIJ".split("");
      el.innerHTML = `<div class="sim-controls">
        ${slider("cap", t("Cache size (slots)", "גודל cache (משבצות)"), 2, 8, 1, 4)}
        <label>${t("Traffic pattern", "תבנית תעבורה")}<select id="pat">
          <option value="zipf">${t("Hot keys (Zipf) — realistic", "מפתחות חמים (Zipf) — מציאותי")}</option>
          <option value="loop">${t("Loop over N+1 keys (cyclic scan)", "לולאה על N+1 מפתחות (סריקה מחזורית)")}</option>
          <option value="scan">${t("Hot keys + a one-off big scan", "מפתחות חמים + סריקה חד-פעמית גדולה")}</option>
          <option value="shift">${t("Popularity shift (yesterday's hits go cold)", "שינוי פופולריות (הלהיטים של אתמול מתקררים)")}</option>
        </select></label>
        <button class="btn small" id="play">▶ ${t("Play", "הפעלה")}</button>
        <button class="btn small" id="step">⏭ ${t("Step", "צעד")}</button>
        <button class="btn small" id="reset">↺ ${t("Reset", "איפוס")}</button></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;direction:ltr">${KEYS.map(k => `<button class="btn small" data-k="${k}" style="min-width:2.4em;font-family:monospace">${k}</button>`).join("")}</div>
      <div style="opacity:.75;font-size:.85em">${t("Click a key to request it, or use Play / Step.", "לחץ על מפתח כדי לבקש אותו, או Play / צעד.")}</div>
      <div id="seq" style="font-family:monospace;font-size:.85em;opacity:.8;min-height:1.4em;direction:ltr;text-align:left;overflow:hidden;white-space:nowrap;margin-top:4px"></div>
      <div id="cols" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:8px"></div>
      <div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      let pols, seq, timer = null, step = 0;
      const mk = (name) => ({ name, slots: [], meta: {}, hits: 0, miss: 0, last: null, evicted: null, clock: 0 });
      const access = (p, k) => {
        const cap = +$("#cap").value; const m = p.meta; p.clock++; p.evicted = null;
        if (p.slots.includes(k)) {
          p.hits++; p.last = "hit";
          if (p.name !== "FIFO") m[k].used = p.clock;
          if (p.name === "LFU") m[k].freq++;
          return;
        }
        p.miss++; p.last = "miss";
        if (p.slots.length >= cap) {
          let victim;
          if (p.name === "FIFO") victim = p.slots.reduce((a, b) => m[a].added <= m[b].added ? a : b);
          else if (p.name === "LRU") victim = p.slots.reduce((a, b) => m[a].used <= m[b].used ? a : b);
          else victim = p.slots.reduce((a, b) => (m[a].freq < m[b].freq || (m[a].freq === m[b].freq && m[a].used <= m[b].used)) ? a : b);
          p.slots.splice(p.slots.indexOf(victim), 1); delete m[victim]; p.evicted = victim;
        }
        p.slots.push(k); m[k] = { added: p.clock, used: p.clock, freq: 1 };
      };
      const zipf = () => { const w = KEYS.map((_, i) => 1 / Math.pow(i + 1, 1.2)); let r = Math.random() * w.reduce((a, b) => a + b); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return KEYS[i]; } return KEYS[0]; };
      const next = () => {
        const pat = $("#pat").value, cap = +$("#cap").value;
        if (pat === "zipf") return zipf();
        if (pat === "loop") return KEYS[step % Math.min(cap + 1, KEYS.length)];
        if (pat === "scan") { const ph = step % 40, len = Math.min(KEYS.length - 3, cap + 2); if (ph >= 25 && ph < 25 + len) return KEYS[3 + (ph - 25)]; return KEYS[[0, 0, 1, 0, 2, 1, 0][step % 7]]; }
        const hot = step < 30 ? ["A", "A", "B", "A", "B", "C"] : ["H", "I", "J", "H", "I", "H"];
        return hot[Math.floor(Math.random() * hot.length)];
      };
      const render = (k) => {
        const ratio = (p) => p.hits / Math.max(1, p.hits + p.miss);
        const best = Math.max(...pols.map(ratio));
        $("#seq").textContent = seq.join(" ");
        $("#cols").innerHTML = pols.map(p => {
          const col = p.last === "hit" ? css("--good") : p.last === "miss" ? css("--bad") : css("--border");
          const rule = p.name === "FIFO" ? t("evicts the oldest inserted", "מוציא את מי שנכנס ראשון") : p.name === "LRU" ? t("evicts the least recently used", "מוציא את מי שלא נגעו בו הכי הרבה זמן") : t("evicts the least frequently used", "מוציא את הכי פחות פופולרי");
          return `<div style="border:2px solid ${col};border-radius:10px;padding:8px">
            <b>${p.name}</b> ${step && best > 0 && ratio(p) === best ? "🏆" : ""}<div style="font-size:.8em;opacity:.8">${rule}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0;direction:ltr">${p.slots.map(s => `<span style="font-family:monospace;padding:3px 7px;border-radius:6px;background:${s === k ? (p.last === "hit" ? css("--good") : css("--accent")) : css("--border")};color:${s === k ? "#fff" : "inherit"}">${s}${p.name === "LFU" ? `<sub>${p.meta[s].freq}</sub>` : ""}</span>`).join("")}</div>
            <div style="font-size:.85em;min-height:1.3em">${p.last ? (p.last === "hit" ? "✅ hit" : "❌ miss") : ""}${p.evicted ? ` · 🗑️ ${t("evicted", "הוצא")} ${p.evicted}` : ""}</div>
            <div style="font-size:1.3em;font-weight:700">${fmt(ratio(p) * 100, 0)}%</div><small>${p.hits}/${p.hits + p.miss} hits</small></div>`;
        }).join("");
        $("#out").innerHTML = metric(t("Requests", "בקשות"), fmt(step));
        const pat = $("#pat").value; let msg;
        if (step < 8) msg = t("💡 Each column is the same cache size with a different eviction rule. Click keys or press Play.", "💡 כל עמודה היא אותו גודל cache עם כלל eviction אחר. לחץ על מפתחות או Play.");
        else if (pat === "loop") msg = t("💥 Cyclic scan over N+1 keys: every policy here evicts exactly the key you need next → ~0% hits (LFU too: every key has the same count). A cache 1 slot too small is as bad as no cache. That's why databases use scan-resistant variants (Postgres ring buffers for sequential scans, InnoDB midpoint insertion).", "💥 סריקה מחזורית על N+1 מפתחות: כל המדיניות כאן מוציאות בדיוק את המפתח שיידרש הבא ← כ-0% hits (גם LFU: לכל המפתחות אותו מונה). cache שקטן במשבצת אחת גרוע כמו בלי cache. בגלל זה מסדי נתונים משתמשים בגרסאות עמידות לסריקה (ring buffer ב-Postgres ל-seq scan, midpoint insertion ב-InnoDB).");
        else if (pat === "scan") msg = t("🧽 A one-off scan pollutes LRU: it pushes out the hot keys. LFU remembers that A/B/C are popular and keeps them. Modern caches (Caffeine W-TinyLFU, Redis allkeys-lfu) mix recency and frequency.", "🧽 סריקה חד-פעמית 'מזהמת' את LRU: היא דוחפת החוצה את המפתחות החמים. LFU זוכר ש-A/B/C פופולריים ומשאיר אותם. caches מודרניים (Caffeine W-TinyLFU, Redis allkeys-lfu) משלבים recency ו-frequency.");
        else if (pat === "shift") msg = t("🕰️ After the popularity shift, pure LFU clings to yesterday's heroes (A/B have big counters) while LRU adapts fast. That's why real LFU implementations decay counters over time (Redis lfu-decay-time).", "🕰️ אחרי שינוי הפופולריות, LFU טהור נאחז בלהיטים של אתמול (ל-A/B יש מונים גבוהים) בזמן ש-LRU מסתגל מהר. לכן מימושי LFU אמיתיים מדעיכים מונים עם הזמן (lfu-decay-time ב-Redis).");
        else msg = t("📊 With skewed (Zipf) traffic LRU and LFU both beat FIFO; a bigger cache raises the hit ratio with diminishing returns. Interview tip: LRU = hashmap + doubly linked list → O(1) get/put.", "📊 בתעבורה מוטה (Zipf) גם LRU וגם LFU מנצחים את FIFO; cache גדול יותר מעלה את ה-hit ratio עם תשואה פוחתת. טיפ לראיון: LRU = hashmap + רשימה מקושרת דו-כיוונית ← get/put ב-O(1).");
        $("#lesson").innerHTML = msg;
      };
      const reset = () => { pols = [mk("FIFO"), mk("LRU"), mk("LFU")]; seq = []; step = 0; render(); };
      const request = (k) => { seq.push(k); if (seq.length > 60) seq.shift(); pols.forEach(p => access(p, k)); step++; render(k); };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } $("#play").textContent = "▶ " + t("Play", "הפעלה"); };
      el.querySelectorAll("[data-k]").forEach(b => b.onclick = () => request(b.dataset.k));
      $("#step").onclick = () => request(next());
      $("#play").onclick = () => { if (timer) stop(); else { timer = setInterval(() => request(next()), 350); $("#play").textContent = "⏸ " + t("Pause", "השהיה"); } };
      $("#reset").onclick = () => { stop(); reset(); };
      $("#cap").oninput = (e) => { $("#capV").textContent = e.target.value; reset(); };
      $("#pat").onchange = reset;
      reset();
      return () => { if (timer) clearInterval(timer); };
    }
  };
  // =============== 13. TCP vs UDP: handshake, window, loss ===============
  I.sims.tcp = {
    icon: "🤝", track: "networking",
    title: { en: "TCP vs UDP: handshake, window & loss", he: "TCP מול UDP: handshake, window ו-packet loss" },
    desc: { en: "Watch SYN / SYN-ACK / ACK, data segments and cumulative ACKs, a sliding window, retransmissions under packet loss and the FIN / TIME_WAIT close. Then switch to UDP and watch lost packets simply vanish.", he: "צפה ב-SYN / SYN-ACK / ACK, ב-segments עם ACK מצטבר, ב-sliding window, ב-retransmissions תחת packet loss ובסגירה עם FIN ו-TIME_WAIT. אחר כך עבור ל-UDP ותראה איך packets שאבדו פשוט נעלמים." },
    mount(el, H) {
      const t = T(H);
      const N = 12, STEP = 0.04, RTO = 75, X0 = 100, X1 = 500;
      el.innerHTML = `<div class="sim-controls">
        <label>${t("Protocol", "פרוטוקול")}<select id="proto"><option value="tcp">TCP</option><option value="udp">UDP</option></select></label>
        ${slider("win", t("Window (segments in flight)", "Window (segments באוויר)"), 1, 8, 1, 4)}
        ${slider("loss", t("Packet loss %", "Packet loss %"), 0, 50, 5, 10)}
        <label>${t("Speed", "מהירות")}<select id="spd"><option value="1">1×</option><option value="2" selected>2×</option><option value="4">4×</option></select></label>
        <button class="btn primary" id="go">▶ ${t("Connect & send 12 segments", "התחבר ושלח 12 segments")}</button>
        <button class="btn small" id="pause">⏸ ${t("Pause", "השהיה")}</button></div>
      <div class="sim-stage" style="direction:ltr"><svg id="svg" viewBox="0 0 600 150" style="width:100%;height:auto;display:block"></svg>
        <div id="strip" style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;align-items:center"></div></div>
      <pre id="log" style="font-size:.78em;max-height:160px;direction:ltr;text-align:left;margin-top:8px"></pre>
      <div class="sim-out" id="out"></div><div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      ["win", "loss"].forEach(id => $("#" + id).oninput = (e) => $("#" + id + "V").textContent = e.target.value);
      let S, paused = false;
      const log = (s) => { S.log.push(`[t=${String(S.tick).padStart(4, " ")}] ${s}`); if (S.log.length > 60) S.log.shift(); };
      const reset = () => {
        S = { running: false, done: false, mode: $("#proto").value, cs: "CLOSED", ss: "LISTEN", pk: [], seg: Array.from({ length: N }, () => "unsent"),
          base: 1, next: 1, rcvNext: 1, buf: new Set(), timer: 0, dup: 0, sent: 0, retx: 0, lost: 0, delivered: 0, tick: 0, log: [], tw: 0, finAt: 0, paceAt: 0, estAt: 0, endTick: 0 };
        if (S.mode === "udp") { S.cs = "—"; S.ss = "—"; }
      };
      const send = (type, dir, label, extra) => {
        const p = Object.assign({ type, dir, label, pos: 0, drop: false, dead: 0 }, extra || {});
        if ((type === "data" || type === "ack" || type === "udp") && Math.random() * 100 < +$("#loss").value) p.drop = true;
        if (type === "data" || type === "udp") S.sent++;
        S.pk.push(p);
      };
      const retransmit = (seq, why) => { S.retx++; S.seg[seq - 1] = "flight"; send("data", "c2s", "SEQ " + seq, { seq }); S.timer = S.tick; S.dup = 0; log(`client: retransmit SEQ ${seq} — ${why}`); };
      const arrive = (p) => {
        if (p.dir === "c2s") {
          if (p.type === "syn") { S.ss = "SYN_RCVD"; log("server ← SYN   → SYN_RCVD, replies SYN-ACK"); send("synack", "s2c", "SYN-ACK"); }
          else if (p.type === "hsack") { S.ss = "ESTABLISHED"; log("server ← ACK   → ESTABLISHED"); }
          else if (p.type === "data") {
            if (p.seq >= S.rcvNext) S.buf.add(p.seq);
            const before = S.rcvNext;
            while (S.buf.has(S.rcvNext)) { S.buf.delete(S.rcvNext); S.rcvNext++; S.delivered++; }
            log(`server ← SEQ ${p.seq}${S.rcvNext === before && p.seq > before ? " (out of order, buffered)" : ""} → ACK ${S.rcvNext}`);
            send("ack", "s2c", "ACK " + S.rcvNext, { ack: S.rcvNext });
          } else if (p.type === "udp") { S.seg[p.seq - 1] = "recv"; S.delivered++; log(`server ← datagram ${p.seq}`); }
          else if (p.type === "fin") { S.ss = "CLOSE_WAIT"; log("server ← FIN   → CLOSE_WAIT, replies ACK"); send("finack", "s2c", "ACK"); S.finAt = S.tick + 10; }
          else if (p.type === "lastack") { S.ss = "CLOSED"; log("server ← ACK   → CLOSED"); }
        } else {
          if (p.type === "synack") { S.cs = "ESTABLISHED"; S.estAt = S.tick; S.paceAt = S.tick + 3; log("client ← SYN-ACK → ESTABLISHED, sends ACK (1 RTT spent, 0 bytes sent)"); send("hsack", "c2s", "ACK"); }
          else if (p.type === "ack") {
            if (p.ack > S.base) { for (let s = S.base; s < p.ack; s++) S.seg[s - 1] = "acked"; S.base = p.ack; S.timer = S.tick; S.dup = 0; }
            else if (p.ack === S.base && S.base < S.next) { S.dup++; if (S.dup === 3) retransmit(S.base, "fast retransmit (3 duplicate ACKs)"); }
          } else if (p.type === "finack") { S.cs = "FIN_WAIT_2"; log("client ← ACK   → FIN_WAIT_2"); }
          else if (p.type === "fin") { S.cs = "TIME_WAIT"; S.tw = S.tick + 45; log("client ← FIN   → TIME_WAIT (waits 2×MSL, 60s on Linux), sends ACK"); send("lastack", "c2s", "ACK"); }
        }
      };
      const step = () => {
        if (!S.running || S.done) return;
        S.tick++;
        const win = +$("#win").value;
        if (S.mode === "tcp") {
          if (S.cs === "ESTABLISHED") {
            if (S.next <= N && S.next < S.base + win && S.tick >= S.paceAt) {
              S.seg[S.next - 1] = "flight"; if (S.base === S.next) S.timer = S.tick;
              send("data", "c2s", "SEQ " + S.next, { seq: S.next }); S.next++; S.paceAt = S.tick + 3;
            }
            if (S.base < S.next && S.tick - S.timer > RTO) retransmit(S.base, "timeout (RTO expired)");
            if (S.base > N) { S.cs = "FIN_WAIT_1"; log("client: all data ACKed → sends FIN, FIN_WAIT_1"); send("fin", "c2s", "FIN"); }
          }
          if (S.finAt && S.tick >= S.finAt) { S.finAt = 0; S.ss = "LAST_ACK"; log("server: app closed → sends FIN, LAST_ACK"); send("fin", "s2c", "FIN"); }
          if (S.tw && S.tick >= S.tw) { S.tw = 0; S.cs = "CLOSED"; log("client: TIME_WAIT expired → CLOSED"); }
          if (S.cs === "CLOSED" && S.ss === "CLOSED" && !S.pk.length) { S.done = true; S.endTick = S.tick; }
        } else {
          if (S.next <= N && S.tick >= S.paceAt) { S.seg[S.next - 1] = "flight"; send("udp", "c2s", "DGRAM " + S.next, { seq: S.next }); S.next++; S.paceAt = S.tick + 3; }
          if (S.next > N && !S.pk.length) { S.done = true; S.endTick = S.tick; log(`done: ${S.delivered}/${N} datagrams arrived. Nobody noticed the rest.`); }
        }
        S.pk.forEach(p => {
          if (p.dead) { p.dead++; return; }
          p.pos += STEP;
          if (p.drop && p.pos >= 0.5) {
            p.dead = 1; S.lost++;
            if (p.type === "data" || p.type === "udp") { if (S.seg[p.seq - 1] !== "acked") S.seg[p.seq - 1] = "lost"; }
            log(`✖ ${p.label} lost in the network`);
          } else if (!p.drop && p.pos >= 1) { p.arrived = true; arrive(p); }
        });
        S.pk = S.pk.filter(p => !p.arrived && p.dead < 12);
      };
      const stCol = { unsent: css("--surface-2"), flight: css("--accent"), acked: css("--good"), recv: css("--good"), lost: css("--bad") };
      const pkCol = (p) => p.type === "data" || p.type === "udp" ? css("--accent") : p.type === "ack" ? css("--good") : /fin|lastack/.test(p.type) ? "#ae3ec9" : css("--warn");
      const render = () => {
        const txt = css("--text"), bd = css("--border"), s2 = css("--surface-2");
        const box = (x, name, st) => `<rect x="${x}" y="15" width="85" height="120" rx="10" fill="${s2}" stroke="${bd}"/><text x="${x + 42}" y="45" text-anchor="middle" font-size="14" font-weight="700" fill="${txt}">${name}</text><text x="${x + 42}" y="70" text-anchor="middle" font-size="10" fill="${txt}">${st}</text>`;
        let svg = box(8, "💻 client", S.cs) + box(507, "🖥️ server", S.ss);
        svg += `<line x1="${X0}" y1="55" x2="${X1}" y2="55" stroke="${bd}" stroke-dasharray="4 4"/><line x1="${X0}" y1="105" x2="${X1}" y2="105" stroke="${bd}" stroke-dasharray="4 4"/>`;
        svg += `<text x="300" y="30" text-anchor="middle" font-size="10" fill="${txt}" opacity=".6">client → server</text><text x="300" y="138" text-anchor="middle" font-size="10" fill="${txt}" opacity=".6">server → client</text>`;
        S.pk.forEach(p => {
          const pos = Math.min(p.pos, 1); const x = p.dir === "c2s" ? X0 + pos * (X1 - X0) : X1 - pos * (X1 - X0); const y = p.dir === "c2s" ? 55 : 105;
          if (p.dead) svg += `<g opacity="${1 - p.dead / 12}"><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="20" fill="${css("--bad")}">✖</text><text x="${x}" y="${y - 12}" text-anchor="middle" font-size="9" fill="${css("--bad")}">${p.label}</text></g>`;
          else svg += `<rect x="${x - 30}" y="${y - 9}" width="60" height="18" rx="5" fill="${pkCol(p)}"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#fff">${p.label}</text>`;
        });
        $("#svg").innerHTML = svg;
        const win = +$("#win").value;
        $("#strip").innerHTML = `<small style="margin-right:6px">${S.mode === "tcp" ? t("send buffer:", "send buffer:") : t("datagrams:", "datagrams:")}</small>` + S.seg.map((st, i) => {
          const inWin = S.mode === "tcp" && i + 1 >= S.base && i + 1 < S.base + win;
          return `<span title="${st}" style="display:inline-block;min-width:26px;text-align:center;padding:3px 0;border-radius:5px;font-size:.78em;font-family:var(--mono);background:${stCol[st]};color:${st === "unsent" ? "inherit" : "#fff"};outline:${inWin ? `2px solid ${css("--warn")}` : "none"};outline-offset:1px">${i + 1}</span>`;
        }).join("") + (S.mode === "tcp" ? `<small style="margin-left:8px">🟧 = ${t("window", "window")}</small>` : "");
        $("#log").textContent = S.log.slice(-10).join("\n") || "$ tcpdump -i eth0 'tcp or udp'";
        const rtt = 2 / STEP, time = S.done ? S.endTick : S.tick;
        $("#out").innerHTML = (S.mode === "tcp" ? metric(t("Client state", "מצב client"), S.cs, S.cs === "ESTABLISHED" ? "good" : "") + metric(t("Server state", "מצב server"), S.ss, S.ss === "ESTABLISHED" ? "good" : "") : "") +
          metric(t("Delivered to app", "הגיע לאפליקציה"), `${S.delivered}/${N}`, S.done ? (S.delivered === N ? "good" : "bad") : "") +
          metric(t("Packets sent", "Packets שנשלחו"), S.sent) + metric(t("Lost on the wire", "אבדו בדרך"), S.lost, S.lost ? "warn" : "good") +
          (S.mode === "tcp" ? metric(t("Retransmissions", "Retransmissions"), S.retx, S.retx ? "warn" : "good") : "") +
          metric(t("Elapsed", "זמן"), fmt(time / rtt, 1) + " RTT");
        let msg;
        if (!S.running) msg = S.mode === "tcp" ? t("💡 Press Connect. TCP spends one full RTT on the handshake before the first byte of data — then the window decides how many segments may be in flight at once.", "💡 לחץ התחבר. TCP מבזבז RTT שלם על ה-handshake לפני הבייט הראשון של data — ואז ה-window קובע כמה segments יכולים להיות באוויר בבת אחת.")
          : t("💡 UDP: no connection, no handshake, no ACKs. Press send and the first datagram leaves immediately.", "💡 UDP: אין connection, אין handshake, אין ACKs. לחץ שלח והדאטגרם הראשון יוצא מיד.");
        else if (S.mode === "udp") msg = S.done ? t(`📦 ${S.delivered}/${N} arrived and nobody retransmitted the rest — UDP leaves reliability to the app. Perfect for DNS, VoIP, video calls and games (a late packet is useless anyway), and QUIC/HTTP3 rebuilds reliability on top of UDP in user space.`, `📦 ${S.delivered}/${N} הגיעו ואף אחד לא שלח מחדש את השאר — UDP משאיר את האמינות לאפליקציה. מושלם ל-DNS, ל-VoIP, לשיחות וידאו ולמשחקים (packet מאוחר ממילא לא שווה כלום), ו-QUIC/HTTP3 בונה אמינות מעל UDP ב-user space.`)
          : t("📦 Datagrams go out back to back with no handshake. A lost one just vanishes — the sender never knows.", "📦 Datagrams יוצאים אחד אחרי השני בלי handshake. אחד שאבד פשוט נעלם — השולח בכלל לא יודע.");
        else if (S.cs === "SYN_SENT" || (S.cs === "ESTABLISHED" && S.ss !== "ESTABLISHED" && !S.delivered)) msg = t("🤝 3-way handshake: SYN → SYN-ACK → ACK. A full RTT before any data — that's why keep-alive and connection pooling matter (and TLS adds 1 more RTT on top).", "🤝 3-way handshake: SYN ← SYN-ACK ← ACK. RTT שלם לפני כל data — בגלל זה keep-alive ו-connection pooling חשובים (ו-TLS מוסיף עוד RTT מעל).");
        else if (/FIN|TIME_WAIT|CLOSE|LAST/.test(S.cs + S.ss) && !S.done) msg = t("👋 Close: each side sends FIN and gets an ACK. The side that closed first sits in TIME_WAIT for 2×MSL (60s on Linux) so stray old packets can't corrupt a new connection on the same 4-tuple. Thousands of TIME_WAIT sockets on a busy client are normal.", "👋 סגירה: כל צד שולח FIN ומקבל ACK. הצד שסגר ראשון יושב ב-TIME_WAIT למשך 2×MSL (60 שניות ב-Linux) כדי ש-packets ישנים לא ישבשו connection חדש על אותו 4-tuple. אלפי sockets ב-TIME_WAIT על client עמוס זה תקין.");
        else if (S.done) msg = t(`✅ All ${N} segments delivered in order with ${S.retx} retransmission(s), in ${fmt(S.endTick / rtt, 1)} RTT. Now try window = 1 (stop-and-wait) vs 8: throughput ≈ window ÷ RTT. Then switch to UDP.`, `✅ כל ${N} ה-segments הגיעו לפי הסדר עם ${S.retx} retransmissions, תוך ${fmt(S.endTick / rtt, 1)} RTT. עכשיו נסה window = 1 (stop-and-wait) מול 8: throughput ≈ window ÷ RTT. ואז עבור ל-UDP.`);
        else if (S.retx || S.lost) msg = t("🔁 A segment was lost: the receiver keeps ACKing the same number (cumulative ACK) and buffers later segments. 3 duplicate ACKs trigger a fast retransmit; otherwise the RTO timer fires. The app gets bytes only in order — that stall is TCP head-of-line blocking.", "🔁 Segment אבד: הצד המקבל ממשיך לשלוח ACK על אותו מספר (ACK מצטבר) ושומר ב-buffer את ה-segments שאחריו. 3 duplicate ACKs מפעילים fast retransmit; אחרת ה-timer של ה-RTO פוקע. האפליקציה מקבלת bytes רק לפי הסדר — התקיעה הזו היא head-of-line blocking של TCP.");
        else msg = t("🪟 The window (orange) = how many unACKed segments may be in flight. Each ACK slides it forward. Real TCP uses min(receiver window, congestion window) and grows cwnd with slow start.", "🪟 ה-window (כתום) = כמה segments בלי ACK מותר שיהיו באוויר. כל ACK מזיז אותו קדימה. ב-TCP אמיתי זה min(receiver window, congestion window), וה-cwnd גדל עם slow start.");
        $("#lesson").innerHTML = msg;
      };
      $("#go").onclick = () => {
        reset(); S.running = true; paused = false; $("#pause").textContent = "⏸ " + t("Pause", "השהיה");
        if (S.mode === "tcp") { S.cs = "SYN_SENT"; log("client: connect() → sends SYN, SYN_SENT"); send("syn", "c2s", "SYN"); }
        else log("client: sendto() × 12 — no connection needed");
        render();
      };
      $("#pause").onclick = () => { paused = !paused; $("#pause").textContent = paused ? "▶ " + t("Resume", "המשך") : "⏸ " + t("Pause", "השהיה"); };
      $("#proto").onchange = () => { reset(); render(); };
      reset(); render();
      const tick = setInterval(() => { if (paused || !S.running || S.done) return; for (let i = 0; i < +$("#spd").value; i++) step(); render(); }, 80);
      return () => clearInterval(tick);
    }
  };

  // =============== 14. Consistent hashing ring ===============
  I.sims.hashring = {
    icon: "💍", track: "data",
    title: { en: "Consistent hashing ring", he: "Consistent hashing: הטבעת" },
    desc: { en: "Place keys on a hash ring, add and remove nodes, tune virtual nodes. Compare how many keys move with consistent hashing vs naive hash(key) mod N.", he: "מקם keys על טבעת hash, הוסף והסר nodes, כוונן virtual nodes. השווה כמה keys זזים ב-consistent hashing מול hash(key) mod N נאיבי." },
    mount(el, H) {
      const t = T(H);
      const NAMES = "ABCDEFGHIJ".split(""), COLORS = ["#4c6ef5", "#12b886", "#f76707", "#ae3ec9", "#e64980", "#1098ad", "#fab005", "#82c91e", "#7950f2", "#fa5252"];
      el.innerHTML = `<div class="sim-controls">
        ${slider("vn", t("Virtual nodes per node", "Virtual nodes לכל node"), 1, 200, 1, 1)}
        ${slider("keys", t("Keys", "Keys"), 100, 3000, 100, 1000)}
        <button class="btn primary" id="add">➕ ${t("Add node", "הוסף node")}</button>
        <button class="btn small" id="rm">➖ ${t("Remove last node", "הסר את ה-node האחרון")}</button></div>
      <div id="chips" class="row" style="margin-bottom:6px;direction:ltr"></div>
      <p class="muted" style="font-size:.85em;margin:0 0 6px">${t("Tip: click a node chip to remove that specific node (simulates a node crash).", "טיפ: לחץ על node כדי להסיר דווקא אותו (סימולציה של node שקרס).")}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-items:start">
        <div class="sim-stage" style="direction:ltr"><svg id="ring" viewBox="0 0 320 320" style="width:100%;max-width:340px;display:block;margin:auto"></svg></div>
        <div><div id="bars" style="direction:ltr"></div><div class="sim-out" id="out"></div></div></div>
      <div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      const h32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; return h >>> 0; };
      let nodes = ["A", "B", "C", "D"], last = null, keyH = [];
      const buildKeys = () => { keyH = Array.from({ length: +$("#keys").value }, (_, i) => h32("user:" + i)); };
      const ringOf = (ns) => { const vn = +$("#vn").value; const pts = []; ns.forEach(n => { for (let v = 0; v < vn; v++) pts.push({ h: h32(`node-${n}#${v}`), n }); }); return pts.sort((a, b) => a.h - b.h); };
      const ownerRing = (pts, h) => { let lo = 0, hi = pts.length; while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].h < h) lo = m + 1; else hi = m; } return pts[lo === pts.length ? 0 : lo].n; };
      const ownersRing = (ns) => { const pts = ringOf(ns); return keyH.map(h => ownerRing(pts, h)); };
      const ownersMod = (ns) => keyH.map(h => ns[h % ns.length]);
      const change = (newNodes, op) => {
        const r0 = ownersRing(nodes), m0 = ownersMod(nodes), r1 = ownersRing(newNodes), m1 = ownersMod(newNodes);
        const moved = new Set(); let rm = 0, mm = 0;
        r0.forEach((o, i) => { if (o !== r1[i]) { rm++; moved.add(i); } if (m0[i] !== m1[i]) mm++; });
        last = { op, ring: rm / keyH.length * 100, mod: mm / keyH.length * 100, moved, from: nodes.length, to: newNodes.length };
        nodes = newNodes; draw();
      };
      const draw = () => {
        const pts = ringOf(nodes), own = keyH.map(h => ownerRing(pts, h));
        const col = (n) => COLORS[NAMES.indexOf(n)];
        const ang = (h) => h / 4294967296 * 2 * Math.PI - Math.PI / 2;
        const P = (h, r) => [160 + r * Math.cos(ang(h)), 160 + r * Math.sin(ang(h))];
        const bd = css("--border"), txt = css("--text");
        let svg = `<circle cx="160" cy="160" r="120" fill="none" stroke="${bd}" stroke-width="6"/>`;
        const step = Math.max(1, Math.ceil(keyH.length / 600));
        for (let i = 0; i < keyH.length; i += step) {
          const mv = last && last.moved.has(i); const [x, y] = P(keyH[i], mv ? 96 : 106 - (i % 3) * 4);
          svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${mv ? 2.6 : 1.6}" fill="${col(own[i])}"${mv ? ` stroke="${txt}" stroke-width=".7"` : ""}/>`;
        }
        const showLabels = pts.length <= 24;
        pts.forEach(p => { const [x, y] = P(p.h, 120); svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${pts.length > 200 ? 2.5 : 5}" fill="${col(p.n)}" stroke="#fff" stroke-width="1"/>`; if (showLabels) { const [lx, ly] = P(p.h, 138); svg += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${col(p.n)}">${p.n}</text>`; } });
        svg += `<text x="160" y="155" text-anchor="middle" font-size="12" fill="${txt}">hash ring</text><text x="160" y="172" text-anchor="middle" font-size="10" fill="${txt}" opacity=".7">0 … 2³²−1</text>`;
        $("#ring").innerHTML = svg;
        $("#chips").innerHTML = nodes.map(n => `<button class="btn small" data-n="${n}" style="border-color:${col(n)};color:${col(n)}">● node-${n} ✕</button>`).join("");
        el.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { if (nodes.length > 1) change(nodes.filter(x => x !== b.dataset.n), "rm-" + b.dataset.n); });
        const cnt = {}; nodes.forEach(n => cnt[n] = 0); own.forEach(o => cnt[o]++);
        const ideal = keyH.length / nodes.length, mx = Math.max(...Object.values(cnt));
        $("#bars").innerHTML = `<small class="muted">${t("Keys per node (dashed = perfect share)", "Keys לכל node (קו מקווקו = חלוקה מושלמת)")}</small>` + nodes.map(n => `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;font-size:.82em"><span style="width:52px">node-${n}</span><div style="flex:1;height:12px;background:${css("--surface-2")};border-radius:4px;position:relative"><div style="width:${cnt[n] / Math.max(mx, ideal) * 100}%;height:100%;background:${col(n)};border-radius:4px"></div><div style="position:absolute;top:-2px;bottom:-2px;left:${ideal / Math.max(mx, ideal) * 100}%;border-left:2px dashed ${txt}"></div></div><span style="width:44px;text-align:right">${cnt[n]}</span></div>`).join("");
        const imb = mx / ideal;
        $("#out").innerHTML = metric(t("Nodes", "Nodes"), nodes.length) + metric(t("Points on ring", "נקודות על הטבעת"), pts.length) +
          metric(t("Hottest node vs fair share", "ה-node הכי עמוס מול חלק הוגן"), "×" + fmt(imb, 2), imb > 1.5 ? "bad" : imb > 1.15 ? "warn" : "good") +
          (last ? metric(t("Keys moved — ring", "Keys שזזו — טבעת"), fmt(last.ring, 1) + "%", "good") + metric(t("Keys moved — mod N", "Keys שזזו — mod N"), fmt(last.mod, 1) + "%", "bad") : "");
        let msg;
        if (last) msg = t(`🔀 ${last.from} → ${last.to} nodes. Consistent hashing moved ${fmt(last.ring, 1)}% of keys (ideal ≈ 1/${Math.max(last.from, last.to)} = ${fmt(100 / Math.max(last.from, last.to), 1)}%) — only the keys between the changed node's points and their neighbours (outlined dots). hash mod N moved ${fmt(last.mod, 1)}% (≈ 1 − 1/${Math.max(last.from, last.to)}): almost every key changes server — a cache cluster would go cold and the DB gets stampeded.`, `🔀 ${last.from} ← ${last.to} nodes. Consistent hashing הזיז ${fmt(last.ring, 1)}% מה-keys (אידיאלי ≈ 1/${Math.max(last.from, last.to)} = ${fmt(100 / Math.max(last.from, last.to), 1)}%) — רק ה-keys שבין הנקודות של ה-node שהשתנה לשכנים שלו (הנקודות המודגשות). hash mod N הזיז ${fmt(last.mod, 1)}% (≈ 1 − 1/${Math.max(last.from, last.to)}): כמעט כל key עובר שרת — cluster של cache מתקרר וה-DB נרמס.`);
        else msg = t("💡 Each key goes to the first node point clockwise from hash(key). Add or remove a node and compare the two percentages.", "💡 כל key הולך לנקודת ה-node הראשונה עם כיוון השעון מ-hash(key). הוסף או הסר node והשווה בין שני האחוזים.");
        if (+$("#vn").value < 10 && imb > 1.3) msg += "<br>" + t(`⚖️ With ${$("#vn").value} point(s) per node the arcs are uneven — the hottest node holds ×${fmt(imb, 2)} its fair share. Raise virtual nodes: Cassandra uses num_tokens (16 by default since 4.0), Dynamo-style stores and Envoy's ring_hash use many points per host.`, `⚖️ עם ${$("#vn").value} נקודות לכל node הקשתות לא שוות — ה-node הכי עמוס מחזיק פי ${fmt(imb, 2)} מהחלק ההוגן שלו. הגדל את ה-virtual nodes: ב-Cassandra זה num_tokens (ברירת מחדל 16 מאז 4.0), ומערכות בסגנון Dynamo וה-ring_hash של Envoy משתמשים בהרבה נקודות לכל host.`);
        else if (+$("#vn").value >= 50) msg += "<br>" + t("✅ Many virtual nodes → smooth distribution, and when a node dies its load spreads across ALL survivors instead of dumping it on one neighbour. Cost: a bigger ring to keep in memory and gossip.", "✅ הרבה virtual nodes ← חלוקה חלקה, וכש-node מת העומס שלו מתפזר על כל השורדים במקום להיזרק על שכן אחד. המחיר: טבעת גדולה יותר להחזיק בזיכרון ולהפיץ ב-gossip.");
        $("#lesson").innerHTML = msg;
      };
      $("#add").onclick = () => { const n = NAMES.find(x => !nodes.includes(x)); if (n) change(nodes.concat(n), "add-" + n); };
      $("#rm").onclick = () => { if (nodes.length > 1) change(nodes.slice(0, -1), "rm"); };
      $("#vn").oninput = (e) => { $("#vnV").textContent = e.target.value; last = null; draw(); };
      $("#keys").oninput = (e) => { $("#keysV").textContent = e.target.value; buildKeys(); last = null; draw(); };
      buildKeys(); draw();
      return null;
    }
  };

  // =============== 15. B-tree vs LSM ===============
  I.sims.lsm = {
    icon: "🌲", track: "data",
    title: { en: "Storage engines: B-tree vs LSM tree", he: "Storage engines: B-tree מול LSM tree" },
    desc: { en: "Insert keys and watch a B-tree rewrite pages in place while an LSM tree buffers in a memtable, flushes SSTables and compacts them. Compare write amplification and files read per lookup, with and without bloom filters.", he: "הכנס keys וראה איך B-tree כותב דפים מחדש במקום, בזמן ש-LSM tree אוסף ב-memtable, עושה flush ל-SSTables ומריץ compaction. השווה write amplification ומספר קבצים שנקראים ב-lookup, עם ובלי bloom filters." },
    mount(el, H) {
      const t = T(H);
      const PAGE = 4, PAGE_U = 8, FANOUT = 8, L1_FILE = 8, FP = 0.05;
      el.innerHTML = `<div class="sim-controls">
        <button class="btn primary" id="ins1">➕ ${t("Insert 1 key", "הכנס key אחד")}</button>
        <button class="btn small" id="ins20">➕➕ ${t("Insert 20", "הכנס 20")}</button>
        <button class="btn small" id="get">🔍 ${t("Lookup existing key", "חפש key קיים")}</button>
        <button class="btn small" id="miss">❓ ${t("Lookup missing key", "חפש key שלא קיים")}</button>
        <label><span><input type="checkbox" id="bloom" checked> ${t("Bloom filters (5% false positives)", "Bloom filters (5% false positives)")}</span></label>
        ${slider("mem", t("Memtable size (keys)", "גודל memtable (keys)"), 2, 8, 1, 4)}
        ${slider("l0", t("Compact when L0 has N files", "Compaction כש-L0 מגיע ל-N קבצים"), 2, 6, 1, 4)}
        <button class="btn small" id="reset">↺ ${t("Reset", "איפוס")}</button></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px">
        <div class="sim-stage" style="direction:ltr"><b>🌳 B-tree</b> <small class="muted">${t("(update in place, page = 4 keys)", "(עדכון במקום, דף = 4 keys)")}</small><div id="bt" style="margin-top:8px"></div><div class="sim-out" id="btOut"></div></div>
        <div class="sim-stage" style="direction:ltr"><b>🪵 LSM tree</b> <small class="muted">${t("(append, flush, compact)", "(append, flush, compaction)")}</small><div id="ls" style="margin-top:8px"></div><div class="sim-out" id="lsOut"></div></div>
      </div>
      <pre id="log" style="font-size:.78em;max-height:130px;direction:ltr;text-align:left;margin-top:8px"></pre>
      <div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      ["mem", "l0"].forEach(id => $("#" + id).oninput = (e) => $("#" + id + "V").textContent = e.target.value);
      let S;
      const reset = () => {
        S = { keys: new Set(), bt: [[]], btW: 0, btTouch: new Set(), btReads: [], mem: [], l0: [], l1: [], lsW: 0, flushes: 0, comps: 0, lsReads: [], lsTouch: {}, log: [], lastMsg: "", seq: 0 };
        draw();
      };
      const log = (s) => { S.log.push(s); if (S.log.length > 40) S.log.shift(); };
      const height = () => S.bt.length === 1 ? 1 : S.bt.length <= FANOUT ? 2 : 3;
      const leafFor = (k) => { const i = S.bt.findIndex(p => p.length && p[p.length - 1] >= k); return i < 0 ? S.bt.length - 1 : i; };
      const btInsert = (k) => {
        const i = leafFor(k), p = S.bt[i]; p.push(k); p.sort((a, b) => a - b);
        let pages = 1; S.btTouch = new Set([i]);
        if (p.length > PAGE) { const right = p.splice(Math.ceil(p.length / 2)); S.bt.splice(i + 1, 0, right); pages += 1 + (height() > 1 ? 1 : 0); if (S.bt.length === FANOUT + 1) pages += 2; S.btTouch = new Set([i, i + 1]); log(`B-tree: page split → wrote ${pages} pages`); }
        S.btW += 1 + pages * PAGE_U; // WAL record + full pages rewritten
      };
      const flush = () => {
        const f = { keys: S.mem.slice().sort((a, b) => a - b), id: ++S.seq };
        S.l0.unshift(f); S.lsW += f.keys.length; S.flushes++; S.mem = []; S.lsTouch = { ["f" + f.id]: "new" };
        log(`LSM: memtable full → flush SSTable #${f.id} (${f.keys.length} keys) to L0`);
        if (S.l0.length >= +$("#l0").value) {
          const all = [...S.l0.flatMap(x => x.keys), ...S.l1.flatMap(x => x.keys)].sort((a, b) => a - b);
          S.lsW += all.length; S.comps++;
          S.l1 = []; for (let i = 0; i < all.length; i += L1_FILE) S.l1.push({ keys: all.slice(i, i + L1_FILE), id: ++S.seq });
          log(`LSM: compaction — merged ${S.l0.length} L0 files + old L1, rewrote ${all.length} keys into ${S.l1.length} L1 files`);
          S.l0 = []; S.lsTouch = {}; S.l1.forEach(x => S.lsTouch["f" + x.id] = "new");
        }
      };
      const insert = () => {
        if (S.keys.size >= 900) return;
        let k; do { k = 1 + Math.floor(Math.random() * 999); } while (S.keys.has(k));
        S.keys.add(k); btInsert(k);
        S.mem.push(k); S.lsW += 1; S.lsTouch = { mem: "new" };
        if (S.mem.length >= +$("#mem").value) flush();
        return k;
      };
      const lookup = (k) => {
        const bloom = $("#bloom").checked, found = S.keys.has(k);
        const bh = S.keys.size ? height() : 0; S.btReads.push(bh); S.btTouch = new Set(S.keys.size ? [leafFor(k)] : []);
        let files = 0, where = "", skipped = 0; S.lsTouch = {};
        if (S.mem.includes(k)) where = "memtable";
        const probe = (f) => {
          const has = f.keys.includes(k);
          if (bloom && !has && Math.random() >= FP) { skipped++; S.lsTouch["f" + f.id] = "skip"; return false; }
          files++; S.lsTouch["f" + f.id] = has ? "hit" : "read"; return has;
        };
        if (!where) for (const f of S.l0) if (probe(f)) { where = "L0 #" + f.id; break; }
        if (!where) { const f = S.l1.find(x => x.keys.length && x.keys[0] <= k && x.keys[x.keys.length - 1] >= k); if (f && probe(f)) where = "L1 #" + f.id; }
        if (where === "memtable") S.lsTouch.mem = "hit";
        S.lsReads.push(files);
        log(`GET ${k} (${found ? "exists" : "missing"}): B-tree read ${bh} page(s) · LSM read ${files} file(s)${bloom ? `, bloom skipped ${skipped}` : ""}${where ? " → found in " + where : " → not found"}`);
      };
      const box = (keys, st, label, w) => {
        const c = st === "hit" ? css("--good") : st === "read" ? css("--bad") : st === "new" ? css("--accent") : st === "skip" ? css("--muted") : css("--border");
        return `<div style="display:inline-block;vertical-align:top;margin:2px;padding:3px 5px;border:2px ${st === "skip" ? "dashed" : "solid"} ${c};border-radius:6px;font-family:var(--mono);font-size:.72em;min-width:${w || 30}px;opacity:${st === "skip" ? .55 : 1}">${label ? `<small style="opacity:.7">${label}</small><br>` : ""}${keys.length ? keys.join(" ") : "∅"}</div>`;
      };
      const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      const draw = () => {
        const n = S.keys.size;
        const root = S.bt.length > 1 ? `<div style="text-align:center">${box(S.bt.slice(1).map(p => p[0]), "", t("root / index", "root / index"))}</div>` : "";
        $("#bt").innerHTML = root + `<div style="text-align:center">${S.bt.map((p, i) => box(p, S.btTouch.has(i) ? (S.btReads.length && S.lastMsg === "get" ? "hit" : "new") : "", "")).join("")}</div>`;
        const mem = S.mem.slice().sort((a, b) => a - b);
        $("#ls").innerHTML = `<div>${box(mem, S.lsTouch.mem || "", "🧠 memtable (RAM) + WAL", 120)}</div>
          <div style="margin-top:6px"><small class="muted">L0 ${t("(overlapping, newest first)", "(חופפים, החדש ראשון)")}</small><br>${S.l0.map(f => box(f.keys, S.lsTouch["f" + f.id] || "", "SST #" + f.id)).join("") || "<small class='muted'>—</small>"}</div>
          <div style="margin-top:6px"><small class="muted">L1 ${t("(sorted, non-overlapping ranges)", "(ממוינים, טווחים לא חופפים)")}</small><br>${S.l1.map(f => box(f.keys, S.lsTouch["f" + f.id] || "", "SST #" + f.id)).join("") || "<small class='muted'>—</small>"}</div>`;
        const btWA = n ? S.btW / n : 0, lsWA = n ? S.lsW / n : 0;
        $("#btOut").innerHTML = metric(t("Keys", "Keys"), n) + metric(t("Pages", "דפים"), S.bt.length) + metric("Write amp.", "×" + fmt(btWA, 1), btWA > lsWA ? "bad" : "good") +
          metric(t("Pages read / lookup", "דפים לכל lookup"), S.btReads.length ? fmt(S.btReads[S.btReads.length - 1]) + ` (${t("avg", "ממוצע")} ${fmt(avg(S.btReads), 1)})` : "—");
        $("#lsOut").innerHTML = metric(t("Flushes / compactions", "Flushes / compactions"), `${S.flushes} / ${S.comps}`) + metric(t("SSTable files", "קבצי SSTable"), S.l0.length + S.l1.length) + metric("Write amp.", "×" + fmt(lsWA, 1), lsWA > btWA ? "bad" : "good") +
          metric(t("Files read / lookup", "קבצים לכל lookup"), S.lsReads.length ? fmt(S.lsReads[S.lsReads.length - 1]) + ` (${t("avg", "ממוצע")} ${fmt(avg(S.lsReads), 1)})` : "—", S.lsReads.length && S.lsReads[S.lsReads.length - 1] > 2 ? "warn" : "");
        $("#log").textContent = S.log.slice(-8).join("\n") || t("Insert some keys…", "הכנס כמה keys…");
        let msg;
        if (!n) msg = t("💡 Insert keys. Write amplification = bytes physically written ÷ bytes of data inserted (toy units: a key = 1, a 4 KB page = 8).", "💡 הכנס keys. Write amplification = כמה bytes נכתבו פיזית ÷ כמה bytes של data הוכנסו (יחידות צעצוע: key = 1, דף של 4KB = 8).");
        else if (S.lastMsg === "get" && !$("#bloom").checked && S.l0.length > 1) msg = t("🐢 Without bloom filters a lookup must open every overlapping L0 file (newest first), then L1 — read amplification. A missing key is the worst case: every file is checked. Turn bloom filters on.", "🐢 בלי bloom filters, lookup חייב לפתוח כל קובץ חופף ב-L0 (מהחדש לישן) ואז את L1 — read amplification. key שלא קיים זה המקרה הגרוע: בודקים כל קובץ. הדלק bloom filters.");
        else if (S.lastMsg === "get") msg = t("🔍 B-tree: one root-to-leaf path, always ~log(n) pages (and the upper levels sit in cache). LSM: memtable, then each file that might hold the key; a bloom filter answers 'definitely not here' from RAM and skips the disk read (dashed boxes). False positives still cost a read.", "🔍 B-tree: מסלול אחד מה-root ל-leaf, תמיד בערך log(n) דפים (והרמות העליונות יושבות ב-cache). LSM: קודם memtable, ואז כל קובץ שעשוי להכיל את ה-key; bloom filter עונה 'בטוח לא כאן' מה-RAM ומדלג על הקריאה מהדיסק (הקופסאות המקווקוות). False positive עדיין עולה קריאה.");
        else if (S.comps) msg = t("🧹 Compaction rewrote the same keys again — that's where LSM write amplification comes from. In real leveled compaction (RocksDB) it's often 10–30×, but writes are big sequential appends, while the B-tree rewrites a whole 4 KB page (plus WAL) for one small row at a random spot.", "🧹 ה-compaction כתב שוב את אותם keys — משם מגיע ה-write amplification של LSM. ב-leveled compaction אמיתי (RocksDB) זה לרוב 10–30×, אבל הכתיבות הן appends גדולים ורציפים, בזמן שה-B-tree כותב מחדש דף שלם של 4KB (ועוד WAL) בשביל שורה קטנה אחת במקום אקראי.");
        else msg = t("✍️ Each insert: the B-tree finds the right leaf and rewrites that whole page in place (sometimes splitting it). The LSM only appends to the WAL and the in-memory memtable; when full it flushes one sorted, immutable SSTable. Keep inserting to trigger compaction.", "✍️ בכל insert ה-B-tree מוצא את ה-leaf הנכון וכותב מחדש את כל הדף במקום (לפעמים מפצל אותו). ה-LSM רק מוסיף ל-WAL ול-memtable שבזיכרון; כשהוא מתמלא הוא עושה flush ל-SSTable ממוין שלא משתנה. המשך להכניס כדי להפעיל compaction.");
        $("#lesson").innerHTML = msg;
      };
      const pickExisting = () => { const a = [...S.keys]; return a[Math.floor(Math.random() * a.length)]; };
      const pickMissing = () => { let k; do { k = 1 + Math.floor(Math.random() * 999); } while (S.keys.has(k)); return k; };
      $("#ins1").onclick = () => { S.lastMsg = "ins"; const k = insert(); if (k) log(`PUT ${k}`); draw(); };
      $("#ins20").onclick = () => { S.lastMsg = "ins"; for (let i = 0; i < 20; i++) insert(); log("PUT × 20"); draw(); };
      $("#get").onclick = () => { if (!S.keys.size) return; S.lastMsg = "get"; lookup(pickExisting()); draw(); };
      $("#miss").onclick = () => { S.lastMsg = "get"; lookup(pickMissing()); draw(); };
      $("#bloom").onchange = draw;
      $("#reset").onclick = reset;
      reset();
      return null;
    }
  };

  // =============== 16. CAP: network partition ===============
  I.sims.partition = {
    icon: "✂️", track: "data",
    title: { en: "CAP lab: network partition", he: "מעבדת CAP: network partition" },
    desc: { en: "3 replicas, 2 clients. Cut the network, then write from both sides. CP rejects writes on the minority side; AP accepts both and has to reconcile on heal — with last-write-wins or visible conflicts.", he: "3 replicas, 2 clients. חתוך את הרשת וכתוב משני הצדדים. CP דוחה כתיבות בצד של המיעוט; AP מקבל את שתיהן וצריך ליישב כשהרשת חוזרת — עם last-write-wins או קונפליקט גלוי." },
    mount(el, H) {
      const t = T(H);
      el.innerHTML = `<div class="sim-controls">
        <label>${t("Mode", "מצב")}<select id="mode"><option value="cp">CP — ${t("quorum (W=2, R=2 of 3)", "quorum (W=2, R=2 מתוך 3)")}</option><option value="ap">AP — ${t("write to any reachable replica", "כתיבה לכל replica שזמין")}</option></select></label>
        <label id="resL">${t("On heal", "כשהרשת חוזרת")}<select id="res"><option value="lww">Last-write-wins (LWW)</option><option value="sib">${t("Keep both (siblings / conflict)", "שמור את שניהם (siblings / קונפליקט)")}</option></select></label>
        <label id="skewL"><span><input type="checkbox" id="skew"> ${t("C2's clock is 5s behind", "השעון של C2 מפגר ב-5 שניות")}</span></label>
        <button class="btn bad" id="cut">✂️ ${t("Partition the network", "חתוך את הרשת")}</button>
        <button class="btn small" id="reset">↺ ${t("Reset", "איפוס")}</button></div>
      <div class="row" style="margin-bottom:6px">
        <button class="btn small" id="w1">✍️ ${t("C1 writes", "C1 כותב")}</button><button class="btn small" id="r1">👁️ ${t("C1 reads", "C1 קורא")}</button>
        <button class="btn small" id="w2">✍️ ${t("C2 writes", "C2 כותב")}</button><button class="btn small" id="r2">👁️ ${t("C2 reads", "C2 קורא")}</button></div>
      <div class="sim-stage" style="direction:ltr"><svg id="svg" viewBox="0 0 600 220" style="width:100%;height:auto;display:block"></svg></div>
      <div class="sim-out" id="out"></div>
      <h3>📜 ${t("Outcome log", "יומן תוצאות")}</h3><div id="log" style="font-size:.85em;max-height:200px;overflow:auto"></div>
      <div class="sim-lesson" id="lesson"></div>`;
      const $ = (s) => el.querySelector(s);
      let S;
      const reset = () => {
        S = { part: false, rep: [0, 1, 2].map(() => ({ vals: [{ v: "v0", ts: 0, by: "init" }] })), clock: 100, dirty: { A: false, B: false }, c1: 0, c2: 0, acc: 0, rej: 0, lost: 0, conf: 0, stale: 0, log: [], latest: "v0", last: "" };
        draw();
      };
      const side = (r) => r === 2 ? "B" : "A";
      const reach = (c) => !S.part ? [0, 1, 2] : c === 1 ? [0, 1] : [2];
      const add = (cls, en, he) => { S.log.unshift(`<div style="padding:3px 0;border-bottom:1px solid var(--border)"><span style="color:var(--${cls})">●</span> ${t(en, he)}</div>`); if (S.log.length > 30) S.log.pop(); };
      const show = (vals) => vals.map(x => x.v).join(" | ");
      const write = (c) => {
        const R = reach(c), mode = $("#mode").value;
        S.clock += 1 + Math.floor(Math.random() * 3);
        const v = c === 1 ? "A" + (++S.c1) : "B" + (++S.c2);
        const ts = S.clock - (c === 2 && $("#skew").checked ? 5 : 0);
        if (mode === "cp" && R.length < 2) { S.rej++; S.last = "rej"; add("bad", `❌ C${c} write "${v}" REJECTED — only ${R.length}/3 replicas reachable, quorum needs 2. Consistent, but unavailable on this side.`, `❌ הכתיבה של C${c} ("${v}") נדחתה — רק ${R.length}/3 replicas זמינים, quorum צריך 2. עקבי, אבל לא זמין בצד הזה.`); return draw(); }
        R.forEach(i => S.rep[i].vals = [{ v, ts, by: "C" + c }]);
        if (S.part) S.dirty[c === 1 ? "A" : "B"] = true;
        S.acc++; S.latest = v; S.last = "w";
        add("good", `✅ C${c} wrote "${v}" (ts=${ts}) to ${R.map(i => "R" + (i + 1)).join(", ")}${R.length < 3 ? ` — ${3 - R.length} replica(s) unreachable, they don't know` : ""}.`, `✅ C${c} כתב "${v}" (ts=${ts}) ל-${R.map(i => "R" + (i + 1)).join(", ")}${R.length < 3 ? ` — ${3 - R.length} replicas לא זמינים ולא יודעים על זה` : ""}.`);
        draw();
      };
      const read = (c) => {
        const R = reach(c), mode = $("#mode").value;
        if (mode === "cp" && R.length < 2) { S.rej++; S.last = "rej"; add("bad", `❌ C${c} read REJECTED — no quorum (R=2) on this side. Better an error than a stale answer.`, `❌ הקריאה של C${c} נדחתה — אין quorum (R=2) בצד הזה. עדיף שגיאה מתשובה לא עדכנית.`); return draw(); }
        const all = R.flatMap(i => S.rep[i].vals); const maxTs = Math.max(...all.map(x => x.ts));
        const best = R.map(i => S.rep[i].vals).find(vs => vs.some(x => x.ts === maxTs));
        const vals = best.length > 1 ? best : all.filter(x => x.ts === maxTs).slice(0, 1);
        const isStale = vals.length === 1 && vals[0].v !== S.latest;
        if (isStale) S.stale++;
        S.last = isStale ? "stale" : vals.length > 1 ? "sib" : "r";
        add(isStale ? "warn" : vals.length > 1 ? "warn" : "good",
          `👁️ C${c} read "${show(vals)}" from ${R.map(i => "R" + (i + 1)).join(", ")}${isStale ? ` — STALE: the latest write anywhere is "${S.latest}"` : vals.length > 1 ? " — siblings! The app must merge them" : ""}.`,
          `👁️ C${c} קרא "${show(vals)}" מ-${R.map(i => "R" + (i + 1)).join(", ")}${isStale ? ` — לא עדכני: הכתיבה האחרונה במערכת היא "${S.latest}"` : vals.length > 1 ? " — siblings! האפליקציה צריכה למזג אותם" : ""}.`);
        draw();
      };
      const heal = () => {
        S.part = false; const dA = S.dirty.A, dB = S.dirty.B; S.dirty = { A: false, B: false };
        const a = S.rep[0].vals, b = S.rep[2].vals, mode = $("#mode").value;
        const same = show(a) === show(b) && a[0].ts === b[0].ts;
        if (same) { add("good", "🔗 Network healed. All replicas already agree.", "🔗 הרשת חזרה. כל ה-replicas כבר מסכימים."); return draw(); }
        if (mode === "cp" || !(dA && dB)) {
          const win = dB && !dA ? b : a;
          S.rep.forEach(r => r.vals = win.map(x => Object.assign({}, x)));
          add("good", `🔗 Network healed. The side that missed writes catches up → everyone has "${show(win)}". Nothing was lost: only one side accepted writes during the partition.`, `🔗 הרשת חזרה. הצד שפספס כתיבות מתעדכן ← לכולם יש "${show(win)}". שום דבר לא אבד: רק צד אחד קיבל כתיבות בזמן ה-partition.`);
        } else if ($("#res").value === "lww") {
          const win = a[0].ts >= b[0].ts ? a[0] : b[0], lose = win === a[0] ? b[0] : a[0];
          S.rep.forEach(r => r.vals = [Object.assign({}, win)]); S.lost++; S.latest = win.v; S.last = "lost";
          add("bad", `🔗 Healed with LWW: "${win.v}" (ts=${win.ts}) beats "${lose.v}" (ts=${lose.ts}). "${lose.v}" was acknowledged to ${lose.by} and is now SILENTLY LOST.${$("#skew").checked ? " With clock skew the 'last' write may not even be the newest one in real time." : ""}`, `🔗 חזרה עם LWW: "${win.v}" (ts=${win.ts}) מנצח את "${lose.v}" (ts=${lose.ts}). ${lose.by} קיבל אישור על "${lose.v}" — ועכשיו הוא אבד בשקט.${$("#skew").checked ? " עם clock skew הכתיבה ה'אחרונה' אפילו לא בהכרח החדשה ביותר בזמן אמת." : ""}`);
        } else {
          const sib = [a[0], b[0]].map(x => Object.assign({}, x));
          S.rep.forEach(r => r.vals = sib.map(x => Object.assign({}, x))); S.conf++; S.last = "conf";
          add("warn", `🔗 Healed with a CONFLICT: replicas keep both siblings "${a[0].v}" and "${b[0].v}". The next reader must merge (Dynamo shopping cart = union) or use a CRDT; the next write resolves it.`, `🔗 חזרה עם קונפליקט: ה-replicas שומרים את שני ה-siblings ("${a[0].v}" וגם "${b[0].v}"). הקורא הבא צריך למזג (בעגלת הקניות של Dynamo זה union) או להשתמש ב-CRDT; הכתיבה הבאה פותרת אותו.`);
        }
        draw();
      };
      const draw = () => {
        const mode = $("#mode").value, txt = css("--text"), bd = css("--border"), bad = css("--bad"), s2 = css("--surface-2");
        $("#resL").style.display = mode === "ap" ? "" : "none"; $("#skewL").style.display = mode === "ap" ? "" : "none";
        $("#cut").textContent = S.part ? "🔗 " + t("Heal the network", "תקן את הרשת") : "✂️ " + t("Partition the network", "חתוך את הרשת");
        const P = { R1: [230, 50], R2: [230, 170], R3: [400, 110], C1: [70, 110], C2: [540, 110] };
        const link = (a, b, cut) => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="${cut ? bad : bd}" stroke-width="${cut ? 2 : 3}" ${cut ? 'stroke-dasharray="5 5"' : ""}/>`;
        let svg = link("R1", "R2") + link("R1", "R3", S.part) + link("R2", "R3", S.part) + link("C1", "R1") + link("C1", "R2") + link("C2", "R3");
        if (S.part) svg += `<line x1="320" y1="5" x2="320" y2="215" stroke="${bad}" stroke-width="3" stroke-dasharray="10 6"/><text x="320" y="16" text-anchor="middle" font-size="16">✂️</text><text x="150" y="212" text-anchor="middle" font-size="11" fill="${txt}" opacity=".7">${t("side A: majority (2/3)", "צד A: רוב (2/3)")}</text><text x="470" y="212" text-anchor="middle" font-size="11" fill="${txt}" opacity=".7">${t("side B: minority (1/3)", "צד B: מיעוט (1/3)")}</text>`;
        [0, 1, 2].forEach(i => {
          const [x, y] = P["R" + (i + 1)], vals = S.rep[i].vals, conflict = vals.length > 1;
          const minority = S.part && i === 2;
          svg += `<rect x="${x - 55}" y="${y - 26}" width="110" height="52" rx="10" fill="${s2}" stroke="${conflict ? css("--warn") : minority && mode === "cp" ? bad : bd}" stroke-width="2"/>
            <text x="${x}" y="${y - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${txt}">🗄️ R${i + 1}${minority && mode === "cp" ? " 🔒" : ""}</text>
            <text x="${x}" y="${y + 10}" text-anchor="middle" font-size="11" font-family="monospace" fill="${conflict ? css("--warn") : txt}">${show(vals)}</text>
            <text x="${x}" y="${y + 22}" text-anchor="middle" font-size="8.5" fill="${txt}" opacity=".6">ts=${vals.map(v => v.ts).join("|")}</text>`;
        });
        [["C1", 1], ["C2", 2]].forEach(([c]) => { const [x, y] = P[c]; svg += `<circle cx="${x}" cy="${y}" r="26" fill="${css("--accent")}"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">💻 ${c}</text>`; });
        $("#svg").innerHTML = svg;
        $("#log").innerHTML = S.log.join("") || `<span class="muted">${t("Write from C1 and C2, cut the network, write again, then heal.", "כתוב מ-C1 ומ-C2, חתוך את הרשת, כתוב שוב, ואז תקן.")}</span>`;
        $("#out").innerHTML = metric(t("Network", "רשת"), S.part ? t("✂️ partitioned", "✂️ מפוצלת") : t("🔗 healthy", "🔗 תקינה"), S.part ? "bad" : "good") +
          metric(t("Accepted writes", "כתיבות שהתקבלו"), S.acc, "good") + metric(t("Rejected ops", "פעולות שנדחו"), S.rej, S.rej ? "warn" : "") +
          metric(t("Stale reads", "קריאות לא עדכניות"), S.stale, S.stale ? "warn" : "") + metric(t("Lost writes (LWW)", "כתיבות שאבדו (LWW)"), S.lost, S.lost ? "bad" : "") + metric(t("Conflicts", "קונפליקטים"), S.conf, S.conf ? "warn" : "");
        let msg;
        if (!S.part && !S.log.length) msg = t("💡 No partition: every write reaches all 3 replicas, so C and A come for free. CAP only forces a choice WHEN the network splits — press ✂️.", "💡 בלי partition כל כתיבה מגיעה לכל 3 ה-replicas, אז C ו-A באים בחינם. CAP מכריח לבחור רק כשהרשת מתפצלת — לחץ ✂️.");
        else if (S.last === "rej") msg = t("🔒 CP: the minority side can't reach a quorum, so it refuses reads and writes. Clients on side B see errors (unavailable), but nobody ever reads stale or conflicting data. etcd, ZooKeeper, Spanner and MongoDB with majority write concern behave like this.", "🔒 CP: הצד של המיעוט לא מגיע ל-quorum, אז הוא מסרב לקריאות ולכתיבות. ה-clients בצד B רואים שגיאות (לא זמין), אבל אף אחד לא קורא data לא עדכני או סותר. etcd, ZooKeeper, Spanner ו-MongoDB עם majority write concern מתנהגים ככה.");
        else if (S.last === "lost") msg = t("🕳️ LWW 'resolved' the conflict by throwing away an acknowledged write — no error, no alert. Fine for a 'last seen' timestamp, terrible for a bank balance or a shopping cart. Cassandra uses LWW per cell by default.", "🕳️ LWW 'פתר' את הקונפליקט בכך שזרק כתיבה שכבר אושרה — בלי שגיאה ובלי alert. בסדר ל-timestamp של 'נראה לאחרונה', נורא ליתרה בבנק או לעגלת קניות. Cassandra משתמשת ב-LWW לכל cell כברירת מחדל.");
        else if (S.last === "conf" || S.last === "sib") msg = t("🔀 Keeping siblings is honest: the database admits it doesn't know which write is right and hands both to the app (Riak, Dynamo paper) — or you design the data as a CRDT (counters, sets) so merges are automatic.", "🔀 לשמור siblings זה הוגן: ה-DB מודה שהוא לא יודע איזו כתיבה נכונה ומעביר את שתיהן לאפליקציה (Riak, המאמר של Dynamo) — או שמתכננים את ה-data כ-CRDT (counters, sets) כך שהמיזוג אוטומטי.");
        else if (S.part && mode === "ap") msg = t("🌍 AP: both sides keep accepting writes — always available, but the replicas now disagree and reads on the other side are stale. The bill arrives when you heal the network.", "🌍 AP: שני הצדדים ממשיכים לקבל כתיבות — תמיד זמין, אבל ה-replicas כבר לא מסכימים וקריאות בצד השני לא עדכניות. החשבון מגיע כשמתקנים את הרשת.");
        else if (S.part) msg = t("✂️ Partitioned in CP mode: side A still has a quorum (2/3) and keeps working. Now try a write from C2.", "✂️ מפוצל במצב CP: לצד A עדיין יש quorum (2/3) והוא ממשיך לעבוד. עכשיו נסה לכתוב מ-C2.");
        else msg = t("🧠 PACELC: if Partition → choose A or C; Else → choose Latency or Consistency. Even without a partition, waiting for a quorum costs latency.", "🧠 PACELC: אם יש Partition ← בוחרים A או C; אחרת (Else) ← בוחרים Latency או Consistency. גם בלי partition, לחכות ל-quorum עולה ב-latency.");
        $("#lesson").innerHTML = msg;
      };
      $("#cut").onclick = () => { if (S.part) heal(); else { S.part = true; S.last = "cut"; add("bad", "✂️ Network partition: R3 + C2 are cut off from R1 + R2 + C1.", "✂️ Network partition: R3 ו-C2 מנותקים מ-R1, R2 ו-C1."); draw(); } };
      $("#w1").onclick = () => write(1); $("#w2").onclick = () => write(2);
      $("#r1").onclick = () => read(1); $("#r2").onclick = () => read(2);
      $("#mode").onchange = reset; $("#reset").onclick = reset;
      $("#res").onchange = draw; $("#skew").onchange = draw;
      reset();
      return null;
    }
  };
})();
