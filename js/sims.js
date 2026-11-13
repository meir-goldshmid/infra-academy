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
    desc: { en: "Pick an algorithm, kill servers, make one slow, turn off health checks — and watch errors and latency.", he: "בחרו אלגוריתם, הפילו שרתים, האטו אחד, כבו health checks — וראו מה קורה ל-errors ול-latency." },
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
      <p class="muted" style="font-size:.88em">${t("Tip: click a server to kill / revive it.", "טיפ: לחצו על שרת כדי להפיל / להחיות אותו.")}</p>
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
        if (down && !$("#hc").checked && recentErr) msg = t("💥 Without health checks the LB keeps sending traffic to a dead server — every Nth request fails. Turn health checks on.", "💥 בלי health checks ה-LB ממשיך לשלוח תעבורה לשרת מת — כל בקשה N נכשלת. הדליקו health checks.");
        else if (down && recentErr) msg = t("⏱️ Health checks remove a dead server only after a few failed probes (~1.5s here). Errors during that window are why probe interval & thresholds matter.", "⏱️ Health checks מוציאים שרת מת רק אחרי כמה בדיקות שנכשלו (~1.5 שניות כאן). השגיאות בחלון הזה הן הסיבה שתדירות הבדיקות והספים חשובים.");
        else if ($("#slow").checked && alg === "rr") msg = t("🐢 Round robin is blind: the slow server gets the same share and its queue explodes. Try Least Connections.", "🐢 Round Robin עיוור: השרת האיטי מקבל אותו נתח והתור שלו מתפוצץ. נסו Least Connections.");
        else if ($("#slow").checked && alg === "lc") msg = t("✅ Least Connections notices the slow server is busy and routes around it.", "✅ Least Connections מזהה שהשרת האיטי עמוס ועוקף אותו.");
        else if (alg === "hash") msg = t("📌 IP hash = stickiness: same client → same server. Great for caches, but load can be uneven and a dead server reshuffles clients.", "📌 IP Hash = דביקות: אותו לקוח → אותו שרת. טוב ל-cache, אבל העומס יכול להיות לא מאוזן ושרת שנופל מערבב לקוחות.");
        else msg = t("Raise the request rate until latency climbs — that's saturation. Then add a server.", "העלו את קצב הבקשות עד שה-latency מטפס — זו רוויה (saturation). ואז הוסיפו שרת.");
        $("#lesson").innerHTML = msg;
      }, 100);
      return () => clearInterval(tick);
    }
  };

  // =============== 2. Requests & limits ===============
  I.sims.resources = {
    icon: "🎛️", track: "kubernetes",
    title: { en: "CPU & memory: requests vs limits", he: "CPU וזיכרון: Requests מול Limits" },
    desc: { en: "Set requests/limits, push load, leak memory. See CPU throttling vs OOMKilled (exit 137) and the QoS class.", he: "קבעו requests/limits, העמיסו, תדליפו זיכרון. ראו CPU throttling מול OOMKilled (exit 137) ומחלקת ה-QoS." },
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
        else if (oomFlash > 0) msg = t("💀 OOMKilled! Memory is incompressible — crossing the memory limit kills the container (exit 137 = 128 + SIGKILL 9). Raise the limit or fix the leak.", "💀 OOMKilled! זיכרון הוא משאב שלא ניתן לדחיסה — חציית ה-limit הורגת את הקונטיינר (exit 137 = 128 + SIGKILL 9). הגדילו limit או תקנו את הדליפה.");
        else if (throttle > 0) msg = t("🐢 CPU is compressible: above the limit you are THROTTLED, not killed. The app survives but latency goes up. Many teams drop CPU limits and keep requests.", "🐢 CPU ניתן לדחיסה: מעל ה-limit עושים לכם THROTTLE, לא הורגים. האפליקציה שורדת אבל ה-latency עולה. הרבה צוותים מוותרים על CPU limits ומשאירים requests.");
        else if (qos === "BestEffort") msg = t("⚠️ BestEffort: no requests/limits → first to be evicted when the node is under memory pressure.", "⚠️ BestEffort: בלי requests/limits → הראשון שמפונה כשיש לחץ זיכרון על ה-node.");
        else msg = t("Try: turn on the leak, or push CPU demand above the limit. Then set request = limit for both to get Guaranteed QoS.", "נסו: הדליקו את הדליפה, או העלו ביקוש CPU מעל ה-limit. אחר כך קבעו request = limit לשניהם כדי לקבל Guaranteed QoS.");
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
    desc: { en: "Producers vs consumers. Watch the backlog grow, add consumers, inject a poison message, enable a DLQ.", he: "Producers מול Consumers. ראו את ה-backlog גדל, הוסיפו consumers, הזריקו poison message, הפעילו DLQ." },
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
        if (stuck) msg = t("☠️ A poison message is retried forever and blocks a consumer. That's why you need a max-retry + Dead Letter Queue — enable it.", "☠️ Poison message מנוסה שוב ושוב לנצח וחוסם consumer. בגלל זה צריך max-retry + Dead Letter Queue — הפעילו.");
        else if (prod > capacity) msg = t(`📈 Incoming (${prod}/s) > capacity (${fmt(capacity, 1)}/s = consumers ÷ processing time). The backlog grows forever. Add consumers or make processing faster. Scale on LAG, not CPU (KEDA does this).`, `📈 נכנס (${prod}/s) > קיבולת (${fmt(capacity, 1)}/s = consumers ÷ זמן עיבוד). ה-backlog יגדל לנצח. הוסיפו consumers או האיצו עיבוד. עושים scale לפי LAG, לא לפי CPU (KEDA עושה את זה).`);
        else if (q.length > 50) msg = t("🧽 Capacity > incoming, so the backlog drains. The queue absorbed the burst — that's the whole point: decoupling producers from consumers.", "🧽 קיבולת > נכנס, אז ה-backlog מתרוקן. התור ספג את הפרץ — זה כל הרעיון: ניתוק producers מ-consumers.");
        else msg = t("Hit 'Traffic burst' and watch the queue absorb it instead of crashing the consumers.", "לחצו 'פרץ תעבורה' ותראו איך התור סופג אותו במקום להפיל את ה-consumers.");
        $("#lesson").innerHTML = msg;
      }, 200);
      return () => clearInterval(tick);
    }
  };

  // =============== 4. SLO / error budget ===============
  I.sims.slo = {
    icon: "🎯", track: "reliability",
    title: { en: "SLO & error budget calculator", he: "מחשבון SLO ו-Error Budget" },
    desc: { en: "How much downtime does 99.9% really allow? Burn your budget with incidents and see when releases freeze.", he: "כמה downtime באמת מותר ב-99.9%? שרפו את התקציב עם תקלות וראו מתי מקפיאים releases." },
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
        if (pct <= 0) msg = t("🧊 Budget exhausted → per the error-budget policy: freeze feature releases, only reliability work ships until the window recovers.", "🧊 התקציב נגמר → לפי מדיניות ה-error budget: מקפיאים פיצ'רים, רק עבודת אמינות עולה עד שהחלון מתאושש.");
        else if (pct < 50) msg = t("⚠️ More than half the budget is gone. Slow down risky deploys, prioritize the postmortem action items.", "⚠️ יותר מחצי מהתקציב נשרף. מאטים deploys מסוכנים, מתעדפים את ה-action items מה-postmortem.");
        else msg = t("💡 Budget left = permission to take risks: ship features, run chaos experiments. 100% is the wrong target — users can't tell 99.99% from 100% but your velocity can.", "💡 תקציב שנשאר = רשות לקחת סיכונים: לשחרר פיצ'רים, להריץ ניסויי chaos. 100% זו מטרה שגויה — משתמשים לא מבחינים בין 99.99% ל-100%, אבל הקצב שלכם כן.");
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
    desc: { en: "Type an IP/prefix, see network vs host bits, ranges, usable IPs (and what AWS reserves). Split into subnets.", he: "הקלידו IP/prefix, ראו ביטים של רשת מול host, טווחים, כתובות שמישות (ומה AWS שומר לעצמו). פצלו ל-subnets." },
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
    desc: { en: "Ordered rules, first match wins, implicit deny at the end. Build rules, fire packets, see which rule hit.", he: "חוקים מסודרים, ההתאמה הראשונה מנצחת, deny מובלע בסוף. בנו חוקים, שלחו packets, ראו איזה חוק תפס." },
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
        <div class="row">${[["10.0.1.25", 5432, t("app → db", "app → db")], ["203.0.113.7", 5432, t("internet → db 😱", "אינטרנט → db 😱")], ["10.0.2.9", 22, t("admin SSH", "SSH של אדמין")], ["198.51.100.4", 443, "HTTPS"]].map(([s, p, l]) => `<button class="btn small" data-s="${s}" data-port="${p}">${l}</button>`).join("")}</div>
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
          <div>${hit === -1 ? t("No rule matched → implicit default deny.", "אף חוק לא תפס → default deny מובלע.") : t(`Rule #${hit + 1} matched first; rules below it were never evaluated.`, `חוק #${hit + 1} תפס ראשון; החוקים שמתחתיו לא נבדקו בכלל.`)}</div>`;
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
    desc: { en: "Deploy pods by CPU request, kill nodes, taint the GPU node, add nodes like the Cluster Autoscaler.", he: "פרסו pods לפי CPU request, הפילו nodes, שימו taint על ה-node עם ה-GPU, הוסיפו nodes כמו Cluster Autoscaler." },
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
        <p class="muted" style="font-size:.88em">${t("Tip: click a node to crash / recover it.", "טיפ: לחצו על node כדי להפיל / לשחזר אותו.")}</p>
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
        if (pend.length && nodes.some(n => !n.up)) msg = t("💀 A node died: its pods were evicted and rescheduled onto the survivors — if there's room. No room → Pending. That's why you keep headroom (N+1).", "💀 Node מת: ה-pods שלו פונו ושובצו מחדש על השורדים — אם יש מקום. אין מקום → Pending. בגלל זה שומרים headroom (N+1).");
        else if (pend.length) msg = t("⏳ Pending = no node has enough UNREQUESTED CPU (or a taint blocks it). Fix: smaller requests, add a node (Cluster Autoscaler does exactly this when it sees Pending pods), or add a toleration.", "⏳ Pending = לאף node אין מספיק CPU שלא הוזמן (או ש-taint חוסם). פתרון: requests קטנים יותר, להוסיף node (ה-Cluster Autoscaler עושה בדיוק את זה כשהוא רואה Pending), או להוסיף toleration.");
        else if ($("#strat").value === "pack") msg = t("📦 Bin-packing fills nodes tightly → fewer nodes, lower cost, but a node failure hurts more pods.", "📦 דחיסה ממלאת nodes עד הסוף → פחות nodes, פחות עלות, אבל נפילת node פוגעת ביותר pods.");
        else msg = t("🌍 Spreading balances load and limits the blast radius of a node failure. Note gpu-1 is tainted: only pods with a matching toleration may land there.", "🌍 פיזור מאזן עומס ומקטין את ה-blast radius של נפילת node. שימו לב: על gpu-1 יש taint — רק pods עם toleration מתאים יכולים לנחות שם.");
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
    desc: { en: "Pick a DR strategy, set business targets, then trigger a disaster. How much data did you lose? How long were you down? What did it cost?", he: "בחרו אסטרטגיית DR, קבעו יעדים עסקיים, ואז הפעילו אסון. כמה מידע איבדתם? כמה זמן הייתם למטה? כמה זה עלה?" },
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
        let msg = okRpo && okRto ? t("✅ Targets met. Now ask: is this strategy over-paying? Pick the CHEAPEST strategy that meets the business RPO/RTO — not the fanciest.", "✅ עמדנו ביעדים. עכשיו שאלו: האם אנחנו משלמים יותר מדי? בוחרים את האסטרטגיה הזולה ביותר שעומדת ב-RPO/RTO העסקי — לא את המפוארת ביותר.")
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
    desc: { en: "Tune cache size and TTL against a realistic (Zipf) traffic pattern. Then flush the cache and watch the database get stampeded.", he: "כווננו גודל cache ו-TTL מול תבנית תעבורה מציאותית (Zipf). אז תרוקנו את ה-cache ותראו את ה-DB נרמס." },
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
        else if (skew < .4) msg = t("🎲 Uniform traffic = no hot keys → caching barely helps unless the cache holds almost everything.", "🎲 תעבורה אחידה = אין מפתחות חמים → cache כמעט לא עוזר אלא אם הוא מחזיק כמעט הכול.");
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
    desc: { en: "A day of traffic in 30 seconds. Tune min/max replicas, target CPU and pod startup time. Fire a spike. Watch errors and cost.", he: "יום של תעבורה ב-30 שניות. כווננו min/max replicas, יעד CPU וזמן עליית pod. שלחו spike. ראו שגיאות ועלות." },
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
        if (!$("#auto").checked) msg = t("🧱 Fixed capacity: either you over-provision for the peak (paying all night) or you drop traffic at peak. Turn HPA on.", "🧱 קיבולת קבועה: או שמקצים ל-peak (ומשלמים כל הלילה) או שזורקים תעבורה ב-peak. הדליקו HPA.");
        else if (d > 0 && starting.length) msg = t("⏳ The autoscaler reacted, but new pods take time to start. Scaling is never instant: lower the target %, keep more min replicas before known events, make startup faster.", "⏳ ה-autoscaler הגיב, אבל pods חדשים לוקחים זמן לעלות. Scaling אף פעם לא מיידי: הורידו את יעד ה-%, החזיקו יותר min replicas לפני אירועים ידועים, קצרו את זמן העלייה.");
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
    desc: { en: "A fake shell with real-looking output. checkout is down — find out why using kubectl, docker and Linux tools. Type 'help'.", he: "Shell מדומה עם פלט שנראה אמיתי. checkout למטה — גלו למה עם kubectl, docker וכלי Linux. הקלידו help." },
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
top · ss -tlnp · dig <host> · curl -v <url> · ping <host> · clear`, `משימה: checkout נכשל. מצאו את שורש הבעיה ואז הקלידו:  answer <cause>
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
# ${t("Note: low 'free' is fine — buff/cache is reclaimable. Look at 'available'. The node is NOT out of memory.", "שימו לב: 'free' נמוך זה בסדר — buff/cache ניתן לשחרור. מסתכלים על 'available'. ל-node יש זיכרון.")}`,
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
+60 XP`, `✅ נכון! v2.4.0 טוען את כל קטלוג המוצרים ל-cache בזיכרון; הוא צריך ~300Mi אבל ה-LIMIT הוא 256Mi → OOMKilled (exit 137) → CrashLoopBackOff.
תיקון מיידי: kubectl rollout undo deploy/checkout  (קודם מייצבים!)
תיקון אמיתי: להגדיל memory request+limit (למשל 512Mi) לפי מדידה, או לא לשמור את כל הקטלוג בזיכרון התהליך (Redis).
+60 XP`), css("--good"));
            if (!found.oom) { found.oom = true; H.addXP(60, "+60 XP 🕵️"); }
          } else print(t("❌ Not it. Hint: look at 'Last State' in kubectl describe.", "❌ לא זה. רמז: הסתכלו על 'Last State' ב-kubectl describe."), css("--bad"));
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
        if (key) print(C[key]()); else print(t(`command not found in this simulator: ${cmd}  (type 'help')`, `הפקודה לא קיימת בסימולטור: ${cmd}  (הקלידו help)`), css("--warn"));
      };
      print(t("📟 PagerDuty: [P1] checkout — 100% of requests failing. You're on call. Type 'help' to start.", "📟 PagerDuty: [P1] checkout — 100% מהבקשות נכשלות. אתה בתורנות. הקלידו help כדי להתחיל."), css("--bad"));
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
    desc: { en: "Same requests, same cache size, three eviction policies side by side. Click keys yourself or play a traffic pattern and see who wins — and when LRU collapses.", he: "אותן בקשות, אותו גודל cache, שלוש מדיניות eviction זו לצד זו. לחצו על מפתחות בעצמכם או הריצו תבנית תעבורה וראו מי מנצח — ומתי LRU קורס." },
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
      <div style="opacity:.75;font-size:.85em">${t("Click a key to request it, or use Play / Step.", "לחצו על מפתח כדי לבקש אותו, או Play / צעד.")}</div>
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
        if (step < 8) msg = t("💡 Each column is the same cache size with a different eviction rule. Click keys or press Play.", "💡 כל עמודה היא אותו גודל cache עם כלל eviction אחר. לחצו על מפתחות או Play.");
        else if (pat === "loop") msg = t("💥 Cyclic scan over N+1 keys: every policy here evicts exactly the key you need next → ~0% hits (LFU too: every key has the same count). A cache 1 slot too small is as bad as no cache. That's why databases use scan-resistant variants (Postgres ring buffers for sequential scans, InnoDB midpoint insertion).", "💥 סריקה מחזורית על N+1 מפתחות: כל המדיניות כאן מוציאות בדיוק את המפתח שיידרש הבא → כ-0% hits (גם LFU: לכל המפתחות אותו מונה). cache שקטן במשבצת אחת גרוע כמו בלי cache. בגלל זה מסדי נתונים משתמשים בגרסאות עמידות לסריקה (ring buffer ב-Postgres ל-seq scan, midpoint insertion ב-InnoDB).");
        else if (pat === "scan") msg = t("🧽 A one-off scan pollutes LRU: it pushes out the hot keys. LFU remembers that A/B/C are popular and keeps them. Modern caches (Caffeine W-TinyLFU, Redis allkeys-lfu) mix recency and frequency.", "🧽 סריקה חד-פעמית 'מזהמת' את LRU: היא דוחפת החוצה את המפתחות החמים. LFU זוכר ש-A/B/C פופולריים ומשאיר אותם. caches מודרניים (Caffeine W-TinyLFU, Redis allkeys-lfu) משלבים recency ו-frequency.");
        else if (pat === "shift") msg = t("🕰️ After the popularity shift, pure LFU clings to yesterday's heroes (A/B have big counters) while LRU adapts fast. That's why real LFU implementations decay counters over time (Redis lfu-decay-time).", "🕰️ אחרי שינוי הפופולריות, LFU טהור נאחז בלהיטים של אתמול (ל-A/B יש מונים גבוהים) בזמן ש-LRU מסתגל מהר. לכן מימושי LFU אמיתיים מדעיכים מונים עם הזמן (lfu-decay-time ב-Redis).");
        else msg = t("📊 With skewed (Zipf) traffic LRU and LFU both beat FIFO; a bigger cache raises the hit ratio with diminishing returns. Interview tip: LRU = hashmap + doubly linked list → O(1) get/put.", "📊 בתעבורה מוטה (Zipf) גם LRU וגם LFU מנצחים את FIFO; cache גדול יותר מעלה את ה-hit ratio עם תשואה פוחתת. טיפ לראיון: LRU = hashmap + רשימה מקושרת דו-כיוונית → get/put ב-O(1).");
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
})();
