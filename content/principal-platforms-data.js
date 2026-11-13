window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Principal Engineer Playbook — platforms, big data, backups, privacy */

INFRA.lessons.push({
  id: "pr-platforms",
  track: "principal",
  order: 60,
  icon: "⚖️",
  level: 3,
  minutes: 15,
  title: { en: "Node.js vs Java vs Go vs .NET vs Python vs Rust: Choosing a Platform", he: "Node.js מול Java מול Go מול .NET מול Python מול Rust: בחירת פלטפורמה" },
  tldr: {
    en: "Pick the runtime by workload shape (IO-bound vs CPU-bound), latency/memory budget, startup needs and — most of all — the team that will run it for five years; benchmarks are the tie-breaker, not the decision.",
    he: "בוחרים runtime לפי צורת העומס (IO-bound מול CPU-bound), תקציב latency/זיכרון, צורכי startup, ובעיקר — הצוות שיתחזק את זה חמש שנים; benchmarks הם שובר שוויון, לא ההחלטה."
  },
  analogy: {
    en: "Node.js is one super-fast waiter who never waits at a table — he takes an order, hands it to the kitchen and moves on; great until a customer asks him to cook (CPU work), then the whole restaurant stalls. Java is a big hotel kitchen: slow to open in the morning (JVM warm-up), but once hot it feeds thousands with industrial efficiency. Go is a food truck fleet: small, cheap, starts instantly, every truck the same simple menu. .NET is Java's twin kitchen with a different brand of appliances. Python is the friendly home cook with every recipe book in the world (data/ML libraries) — but only one burner at a time (the GIL). Rust is a Michelin chef: perfect, no waste (no GC), but training takes years.",
    he: "Node.js זה מלצר אחד מהיר במיוחד שאף פעם לא מחכה ליד שולחן — לוקח הזמנה, מעביר למטבח וממשיך הלאה; מעולה עד שלקוח מבקש ממנו לבשל (עבודת CPU), ואז כל המסעדה נתקעת. Java זה מטבח של מלון גדול: לוקח זמן להתחמם בבוקר (JVM warm-up), אבל כשהוא חם הוא מאכיל אלפים ביעילות תעשייתית. Go זה צי של פוד-טראקים: קטנים, זולים, מתניעים מיד, לכולם אותו תפריט פשוט. .NET זה התאום של Java עם מותג מכשירים אחר. Python זה הטבח הביתי החביב עם כל ספרי המתכונים בעולם (ספריות data/ML) — אבל רק להבה אחת בכל פעם (ה-GIL). Rust זה שף מישלן: מושלם, בלי בזבוז (בלי GC), אבל ההכשרה לוקחת שנים."
  },
  sections: [
    {
      h: { en: "Runtime models: the thing that actually differs", he: "מודלי runtime: מה שבאמת שונה" },
      body: {
        en: `<table>
<tr><th>Platform</th><th>Concurrency model</th><th>Memory mgmt</th><th>Compiled to</th></tr>
<tr><td>Node.js</td><td>1 event loop thread + libuv pool (4)</td><td>GC (V8)</td><td>JIT (V8)</td></tr>
<tr><td>Java 21+</td><td>OS threads + virtual threads (Loom)</td><td>GC (G1/ZGC)</td><td>JIT (HotSpot) / native (GraalVM)</td></tr>
<tr><td>Go</td><td>goroutines on M:N scheduler</td><td>GC (concurrent, low pause)</td><td>native binary</td></tr>
<tr><td>.NET 8+</td><td>thread pool + async/await</td><td>GC (gen0/1/2)</td><td>JIT (RyuJIT) / Native AOT</td></tr>
<tr><td>Python</td><td>threads (GIL) / asyncio / processes</td><td>refcount + GC</td><td>bytecode interpreter</td></tr>
<tr><td>Rust</td><td>OS threads / async (tokio)</td><td>ownership, no GC</td><td>native binary</td></tr>
</table>
<p>Everything else — speed, memory, failure modes — follows from this table. A Node service with one blocked event loop serves <em>nobody</em>; a Java service with 200 platform threads blocked on a slow DB serves nobody either, but for a different reason (thread pool exhaustion). Go and Java virtual threads let you write simple blocking code that scales like async.</p>
<blockquote>💡 Real world: "PHP/Ruby" run one request per process/thread (PHP-FPM, Puma). Simple and robust — a crash kills one request — but memory per worker (30–100 MB) caps concurrency per box.</blockquote>`,
        he: `<table>
<tr><th>פלטפורמה</th><th>מודל מקביליות</th><th>ניהול זיכרון</th><th>מקומפל ל-</th></tr>
<tr><td>Node.js</td><td>thread אחד של event loop + libuv pool (4)</td><td>GC (V8)</td><td>JIT (V8)</td></tr>
<tr><td>Java 21+</td><td>OS threads + virtual threads (Loom)</td><td>GC (G1/ZGC)</td><td>JIT (HotSpot) / native (GraalVM)</td></tr>
<tr><td>Go</td><td>goroutines על scheduler מסוג M:N</td><td>GC (concurrent, pauses קצרים)</td><td>native binary</td></tr>
<tr><td>.NET 8+</td><td>thread pool + async/await</td><td>GC (gen0/1/2)</td><td>JIT (RyuJIT) / Native AOT</td></tr>
<tr><td>Python</td><td>threads (GIL) / asyncio / processes</td><td>refcount + GC</td><td>interpreter של bytecode</td></tr>
<tr><td>Rust</td><td>OS threads / async (tokio)</td><td>ownership, בלי GC</td><td>native binary</td></tr>
</table>
<p>כל השאר — מהירות, זיכרון, דרכי כשל — נובע מהטבלה הזאת. שירות Node עם event loop חסום לא משרת <em>אף אחד</em>; שירות Java עם 200 platform threads שתקועים על DB איטי גם לא משרת אף אחד, אבל מסיבה אחרת (מיצוי ה-thread pool). Go ו-virtual threads של Java מאפשרים לכתוב קוד blocking פשוט שמתנהג בסקייל כמו async.</p>
<blockquote>💡 מהשטח: PHP/Ruby מריצים בקשה אחת לכל process/thread (PHP-FPM, Puma). פשוט ועמיד — קריסה הורגת בקשה אחת — אבל זיכרון לכל worker (30–100 MB) מגביל את המקביליות לכל מכונה.</blockquote>`
      }
    },
    {
      h: { en: "Numbers: throughput, latency, startup, memory", he: "מספרים: throughput, latency, startup, זיכרון" },
      body: {
        en: `<p>Ballpark for a simple JSON "hello + one DB call" API on 2 vCPU. Real numbers vary ±2x with framework and tuning — use them for orders of magnitude, not marketing.</p>
<table>
<tr><th>Platform</th><th>req/s (JSON)</th><th>Idle RSS</th><th>Cold start</th><th>p99 risk</th></tr>
<tr><td>Rust (axum)</td><td>150k+</td><td>5–10 MB</td><td>~5 ms</td><td>lowest</td></tr>
<tr><td>Go (net/http)</td><td>100k+</td><td>10–20 MB</td><td>~10 ms</td><td>low</td></tr>
<tr><td>.NET (Kestrel)</td><td>100k+</td><td>50–80 MB</td><td>100–300 ms (AOT ~20)</td><td>GC gen2</td></tr>
<tr><td>Java (Spring Boot)</td><td>50–100k</td><td>150–300 MB</td><td>2–6 s (GraalVM ~50 ms)</td><td>GC, warm-up</td></tr>
<tr><td>Node.js (Fastify)</td><td>30–60k</td><td>40–60 MB</td><td>~100–300 ms</td><td>blocked loop</td></tr>
<tr><td>Python (FastAPI)</td><td>5–15k/worker</td><td>40–80 MB</td><td>0.5–2 s</td><td>GIL, CPU</td></tr>
</table>
<p>Translate to money: 10k req/s at peak needs ~1 Go pod but ~2–4 Python pods (with 4 workers each). At 100 services that difference is real cloud spend — but usually still smaller than one engineer's salary.</p>
<blockquote>⚠️ Production tip: In serverless (Lambda, Cloud Run scale-to-zero) cold start dominates: a 4 s Spring Boot start on every scale-up is user-visible. Use Go/Node/Rust, GraalVM native image, .NET AOT, or SnapStart/min instances.</blockquote>`,
        he: `<p>הערכת סדר גודל ל-API פשוט של "JSON + קריאת DB אחת" על 2 vCPU. מספרים אמיתיים משתנים פי 2 לכל כיוון לפי framework ו-tuning — השתמשו בהם לסדרי גודל, לא לשיווק.</p>
<table>
<tr><th>פלטפורמה</th><th>req/s (JSON)</th><th>RSS במנוחה</th><th>Cold start</th><th>סיכון p99</th></tr>
<tr><td>Rust (axum)</td><td>150k+</td><td>5–10 MB</td><td>~5 ms</td><td>הכי נמוך</td></tr>
<tr><td>Go (net/http)</td><td>100k+</td><td>10–20 MB</td><td>~10 ms</td><td>נמוך</td></tr>
<tr><td>.NET (Kestrel)</td><td>100k+</td><td>50–80 MB</td><td>100–300 ms (AOT ~20)</td><td>GC gen2</td></tr>
<tr><td>Java (Spring Boot)</td><td>50–100k</td><td>150–300 MB</td><td>2–6 s (GraalVM ~50 ms)</td><td>GC, warm-up</td></tr>
<tr><td>Node.js (Fastify)</td><td>30–60k</td><td>40–60 MB</td><td>~100–300 ms</td><td>loop חסום</td></tr>
<tr><td>Python (FastAPI)</td><td>5–15k ל-worker</td><td>40–80 MB</td><td>0.5–2 s</td><td>GIL, CPU</td></tr>
</table>
<p>בתרגום לכסף: 10k req/s בשיא דורשים ~pod אחד של Go אבל ~2–4 pods של Python (עם 4 workers כל אחד). ב-100 שירותים זה הבדל אמיתי בחשבון הענן — אבל בדרך כלל עדיין קטן ממשכורת של מהנדס אחד.</p>
<blockquote>⚠️ טיפ לפרודקשן: ב-serverless (Lambda, Cloud Run עם scale-to-zero) ה-cold start שולט: startup של 4 שניות של Spring Boot בכל scale-up מורגש אצל המשתמש. השתמשו ב-Go/Node/Rust, GraalVM native image, .NET AOT, או SnapStart/min instances.</blockquote>`
      }
    },
    {
      h: { en: "Node.js: where it shines and where it hurts", he: "Node.js: איפה הוא זורח ואיפה הוא כואב" },
      body: {
        en: `<ul>
<li><strong>Shines</strong>: IO-heavy APIs that mostly wait on DBs and other services, BFF/API aggregation, realtime (WebSockets, SSE — one process holds 10k+ idle sockets), SSR for React/Next.js, sharing TypeScript types between frontend and backend, fast iteration and huge npm ecosystem.</li>
<li><strong>Hurts</strong>: CPU-bound work on the main thread — image resizing, big JSON parsing, PDF generation, crypto, ML. 200 ms of CPU = every other request waits 200 ms.</li>
</ul>
<pre>// One CPU-heavy route freezes the whole server
app.get("/report", (req, res) =&gt; {
  const rows = buildHugeReport();   // 800 ms of pure CPU
  res.json(rows);                   // /health also waits 800 ms
});

// Fix: move CPU work off the loop
const { Worker } = require("node:worker_threads");
app.get("/report", (req, res) =&gt; {
  const w = new Worker("./report-worker.js");
  w.once("message", (rows) =&gt; res.json(rows));
});</pre>
<p>Other Node realities: single-threaded per process, so use all cores with multiple pods or the <code>cluster</code> module; <code>--max-old-space-size</code> must match the container limit; npm supply chain (left-pad, event-stream) means lockfiles and audits are mandatory.</p>
<blockquote>💡 Real world: Netflix, PayPal and LinkedIn moved edge/BFF layers to Node for developer speed, while keeping heavy back-end services on the JVM. Polyglot by layer is normal.</blockquote>`,
        he: `<ul>
<li><strong>זורח</strong>: APIs עם הרבה IO שבעיקר מחכים ל-DB ולשירותים אחרים, BFF/אגרגציה של APIs, realtime (WebSockets, SSE — process אחד מחזיק 10k+ sockets רדומים), SSR ל-React/Next.js, שיתוף טיפוסי TypeScript בין frontend ל-backend, איטרציה מהירה ואקוסיסטם npm ענק.</li>
<li><strong>כואב</strong>: עבודת CPU על ה-main thread — שינוי גודל תמונות, parsing של JSON ענק, יצירת PDF, קריפטו, ML. 200 ms של CPU = כל בקשה אחרת מחכה 200 ms.</li>
</ul>
<pre>// One CPU-heavy route freezes the whole server
app.get("/report", (req, res) =&gt; {
  const rows = buildHugeReport();   // 800 ms of pure CPU
  res.json(rows);                   // /health also waits 800 ms
});

// Fix: move CPU work off the loop
const { Worker } = require("node:worker_threads");
app.get("/report", (req, res) =&gt; {
  const w = new Worker("./report-worker.js");
  w.once("message", (rows) =&gt; res.json(rows));
});</pre>
<p>עוד מציאות של Node: single-threaded לכל process, אז כדי לנצל את כל הליבות מריצים כמה pods או את מודול <code>cluster</code>; <code>--max-old-space-size</code> חייב להתאים ל-limit של הקונטיינר; ה-supply chain של npm (left-pad, event-stream) אומר ש-lockfiles ו-audits הם חובה.</p>
<blockquote>💡 מהשטח: Netflix, PayPal ו-LinkedIn העבירו שכבות edge/BFF ל-Node בשביל מהירות פיתוח, והשאירו את שירותי ה-backend הכבדים על JVM. Polyglot לפי שכבה זה נורמלי.</blockquote>`
      }
    },
    {
      h: { en: "The same endpoint in six languages", he: "אותו endpoint בשש שפות" },
      body: {
        en: `<pre>// Node.js (Fastify)
fastify.get("/ping", async () =&gt; ({ ok: true }));

// Go
http.HandleFunc("/ping", func(w http.ResponseWriter,
    r *http.Request) {
  json.NewEncoder(w).Encode(map[string]bool{"ok": true})
})

// Java (Spring Boot)
@GetMapping("/ping")
Map&lt;String, Boolean&gt; ping() { return Map.of("ok", true); }

// C# (.NET minimal API)
app.MapGet("/ping", () =&gt; new { ok = true });

# Python (FastAPI)
@app.get("/ping")
async def ping(): return {"ok": True}

// Rust (axum)
async fn ping() -&gt; Json&lt;Value&gt; { Json(json!({"ok": true})) }</pre>
<p>Notice: the hello-world looks the same everywhere. The differences appear in month 6 — profiling a memory leak, tuning GC, handling 5k concurrent connections, building a 30 MB vs 300 MB image, onboarding a new hire.</p>`,
        he: `<pre>// Node.js (Fastify)
fastify.get("/ping", async () =&gt; ({ ok: true }));

// Go
http.HandleFunc("/ping", func(w http.ResponseWriter,
    r *http.Request) {
  json.NewEncoder(w).Encode(map[string]bool{"ok": true})
})

// Java (Spring Boot)
@GetMapping("/ping")
Map&lt;String, Boolean&gt; ping() { return Map.of("ok", true); }

// C# (.NET minimal API)
app.MapGet("/ping", () =&gt; new { ok = true });

# Python (FastAPI)
@app.get("/ping")
async def ping(): return {"ok": True}

// Rust (axum)
async fn ping() -&gt; Json&lt;Value&gt; { Json(json!({"ok": true})) }</pre>
<p>שימו לב: ה-hello-world נראה אותו דבר בכל מקום. ההבדלים מופיעים בחודש השישי — profiling של memory leak, tuning של GC, טיפול ב-5k חיבורים במקביל, image של 30 MB מול 300 MB, קליטה של עובד חדש.</p>`
      }
    },
    {
      h: { en: "The decision table a principal actually uses", he: "טבלת ההחלטה ש-Principal באמת משתמש בה" },
      body: {
        en: `<table>
<tr><th>If the workload is…</th><th>Lean towards</th></tr>
<tr><td>IO-heavy API, BFF, realtime, full-stack TS team</td><td>Node.js (TypeScript)</td></tr>
<tr><td>Infra tooling, CLIs, proxies, k8s operators, small fast services</td><td>Go</td></tr>
<tr><td>Large domain-heavy enterprise system, big org, mature libs</td><td>Java/Kotlin or .NET</td></tr>
<tr><td>Data, ML, scripting, glue, notebooks</td><td>Python</td></tr>
<tr><td>Hot path where every µs and MB counts, safety-critical, edge</td><td>Rust</td></tr>
<tr><td>Serverless with spiky traffic</td><td>Node / Go / Python (small), or native-compiled JVM/.NET</td></tr>
</table>
<p>Then apply the non-technical filters, which usually win: <strong>what does the team already know and operate?</strong> Every new language costs CI templates, base images, security scanning, observability libs, on-call knowledge and hiring. A principal's default answer is "use the paved road unless the gain is big and measurable".</p>
<blockquote>⚠️ Production tip: Rewriting for speed is rarely the right first move. Profile first — most "slow Node/Python" services are slow because of N+1 queries, missing indexes or no connection pooling, which a rewrite copies faithfully.</blockquote>`,
        he: `<table>
<tr><th>אם העומס הוא…</th><th>נוטים ל-</th></tr>
<tr><td>API עם הרבה IO, BFF, realtime, צוות full-stack ב-TS</td><td>Node.js (TypeScript)</td></tr>
<tr><td>כלי תשתית, CLIs, proxies, k8s operators, שירותים קטנים ומהירים</td><td>Go</td></tr>
<tr><td>מערכת enterprise גדולה עם דומיין כבד, ארגון גדול, ספריות בוגרות</td><td>Java/Kotlin או .NET</td></tr>
<tr><td>Data, ML, סקריפטים, glue, notebooks</td><td>Python</td></tr>
<tr><td>Hot path שבו כל µs ו-MB חשובים, safety-critical, edge</td><td>Rust</td></tr>
<tr><td>Serverless עם תעבורה קופצנית</td><td>Node / Go / Python (קטנים), או JVM/.NET מקומפל native</td></tr>
</table>
<p>אחר כך מפעילים את הפילטרים הלא-טכניים, שבדרך כלל מנצחים: <strong>מה הצוות כבר יודע ומתפעל?</strong> כל שפה חדשה עולה ב-CI templates, base images, סריקות אבטחה, ספריות observability, ידע של on-call וגיוס. התשובה הדיפולטית של Principal: "משתמשים ב-paved road, אלא אם הרווח גדול ומדיד".</p>
<blockquote>⚠️ טיפ לפרודקשן: שכתוב בשביל מהירות הוא כמעט אף פעם לא הצעד הראשון הנכון. קודם profiling — רוב שירותי ה-"Node/Python האיטיים" איטיים בגלל N+1 queries, אינדקסים חסרים או חוסר ב-connection pooling, ושכתוב פשוט מעתיק אותם בנאמנות.</blockquote>`
      }
    }
  ],
  diagram: `Node.js           Java (platform)     Go / Java virtual threads
 [loop] 1 thread   [T][T][T]..[T]       g g g g g g g g (100k)
   |  \\            200 OS threads        \\ | | | | | /
 cb cb cb           1 req = 1 thread      M:N scheduler
 libuv pool(4)      blocked = wasted      -> N OS threads = cores

IO-bound  : Node ~ Go ~ Java-VT ~ .NET async   (all fine)
CPU-bound : Go / Java / .NET / Rust  >>  Node / Python (offload!)`,
  handsOn: [
    { cmd: "node -e \"const t=Date.now();setTimeout(()=>console.log('timer late by',Date.now()-t-10,'ms'),10);const e=Date.now()+500;while(Date.now()<e){}\"", what: { en: "Prove that 500 ms of CPU on the event loop delays a 10 ms timer by ~500 ms.", he: "הוכחה ש-500 ms של CPU על ה-event loop מעכבים timer של 10 ms בכ-500 ms." } },
    { cmd: "docker images --format '{{.Repository}} {{.Size}}' | grep -E 'node|golang|eclipse-temurin|python|dotnet'", what: { en: "Compare base image sizes — a static Go binary on distroless is ~10–20 MB; a JDK image is 300+ MB.", he: "השוו גדלי base images — binary סטטי של Go על distroless הוא ~10–20 MB; image של JDK הוא 300+ MB." } },
    { cmd: "hey -z 20s -c 100 http://localhost:8080/ping", what: { en: "Load-test the same /ping in two platforms; compare req/s and p99, then check RSS with `docker stats`.", he: "בדיקת עומס לאותו /ping בשתי פלטפורמות; השוו req/s ו-p99, ואז בדקו RSS עם `docker stats`." } },
    { cmd: "python -c \"import sys; print(sys.version); print(getattr(sys,'_is_gil_enabled',lambda:True)())\"", what: { en: "Check your Python version and whether the GIL is enabled (3.13+ free-threaded builds print False).", he: "בדקו את גרסת ה-Python והאם ה-GIL פעיל (ב-builds free-threaded של 3.13+ יודפס False)." } }
  ],
  mnemonic: {
    en: "\"Waiter, Hotel, Truck, Twin, Cook, Chef\" — Node waits, Java warms, Go starts, .NET mirrors, Python knows everything, Rust wastes nothing. And: the team beats the benchmark.",
    he: "\"מלצר, מלון, פוד-טראק, תאום, טבח ביתי, שף\" — Node ממתין, Java מתחמם, Go מתניע, .NET משקף, Python יודע הכול, Rust לא מבזבז כלום. ותמיד: הצוות מנצח את ה-benchmark."
  },
  pitfalls: [
    { en: "Choosing a platform from a TechEmpower benchmark — your bottleneck is almost always the database or network, not the language.", he: "לבחור פלטפורמה לפי benchmark של TechEmpower — צוואר הבקבוק כמעט תמיד ה-DB או הרשת, לא השפה." },
    { en: "Running CPU-heavy work on the Node.js event loop or in Python threads (GIL) and wondering why p99 explodes.", he: "להריץ עבודת CPU כבדה על ה-event loop של Node או ב-threads של Python (GIL) ולתהות למה ה-p99 מתפוצץ." },
    { en: "Letting every team pick its own language: 6 stacks = 6× base images, CVE patching, libraries and on-call knowledge.", he: "לתת לכל צוות לבחור שפה משלו: 6 stacks = פי 6 base images, טלאי CVE, ספריות וידע on-call." },
    { en: "Not matching JVM/V8 heap flags to the container memory limit → OOMKilled or wasted memory.", he: "לא להתאים את דגלי ה-heap של JVM/V8 ל-memory limit של הקונטיינר → OOMKilled או זיכרון מבוזבז." }
  ],
  interview: [
    { q: { en: "When would you NOT choose Node.js for a new service?", he: "מתי לא הייתם בוחרים Node.js לשירות חדש?" },
      a: { en: "When the hot path is CPU-bound (image/video processing, heavy computation, compression, ML inference) — a single event loop serializes it and kills tail latency for everyone. Also when the org's paved road and on-call expertise are on another stack and Node brings no clear gain. If we still use Node, I'd isolate CPU work into worker_threads or a separate Go/Rust/Python worker behind a queue.", he: "כשה-hot path הוא CPU-bound (עיבוד תמונה/וידאו, חישוב כבד, דחיסה, ML inference) — event loop יחיד עושה לזה serialization והורג את ה-tail latency לכולם. וגם כשה-paved road של הארגון והמומחיות של ה-on-call הם על stack אחר ו-Node לא מביא רווח ברור. אם בכל זאת Node, הייתי מבודד את עבודת ה-CPU ל-worker_threads או ל-worker נפרד ב-Go/Rust/Python מאחורי תור." } },
    { q: { en: "Your Java service takes 6 s to start and you're moving to scale-to-zero serverless. Options?", he: "שירות ה-Java שלכם עולה ב-6 שניות ואתם עוברים ל-serverless עם scale-to-zero. אפשרויות?" },
      a: { en: "GraalVM native image (≈50 ms start, lower RSS, but reflection config and longer builds), AWS Lambda SnapStart / CRaC checkpoint-restore, trimming the framework (Quarkus/Micronaut), keeping min instances warm (cost), or keeping it on long-running containers if traffic is steady — scale-to-zero isn't free if p99 matters.", he: "GraalVM native image (≈50 ms startup, פחות RSS, אבל קונפיגורציית reflection ו-builds ארוכים), AWS Lambda SnapStart / CRaC checkpoint-restore, להרזות את ה-framework (Quarkus/Micronaut), להשאיר min instances חמים (עלות), או להישאר על קונטיינרים רציפים אם התעבורה יציבה — scale-to-zero לא בחינם אם ה-p99 חשוב." } }
  ],
  quiz: [
    { q: { en: "A Node.js API's p99 jumps to 2 s whenever one specific endpoint generates PDFs. Most likely cause?", he: "ה-p99 של API ב-Node קופץ ל-2 שניות בכל פעם ש-endpoint מסוים מייצר PDFs. הסיבה הסבירה?" },
      options: [ { en: "Too many DB connections", he: "יותר מדי חיבורי DB" }, { en: "CPU work blocking the single event loop", he: "עבודת CPU שחוסמת את ה-event loop היחיד" }, { en: "DNS caching", he: "DNS caching" }, { en: "HTTP/2 multiplexing", he: "HTTP/2 multiplexing" } ],
      answer: 1, explain: { en: "PDF generation is CPU-bound; while it runs on the main thread no other callback runs. Offload to worker_threads or a separate service.", he: "יצירת PDF היא CPU-bound; כל עוד היא רצה על ה-main thread אף callback אחר לא רץ. מעבירים ל-worker_threads או לשירות נפרד." } },
    { q: { en: "Which platform typically has the smallest idle memory and fastest cold start without special tooling?", he: "לאיזו פלטפורמה בדרך כלל יש את זיכרון המנוחה הקטן ביותר וה-cold start המהיר ביותר בלי כלים מיוחדים?" },
      options: [ { en: "Spring Boot on the JVM", he: "Spring Boot על JVM" }, { en: "Python with Django", he: "Python עם Django" }, { en: "Go / Rust native binaries", he: "binaries native של Go / Rust" }, { en: ".NET with JIT", he: ".NET עם JIT" } ],
      answer: 2, explain: { en: "Native binaries with small runtimes start in milliseconds and idle at 5–20 MB.", he: "Binaries native עם runtime קטן עולים במילישניות ויושבים על 5–20 MB במנוחה." } },
    { q: { en: "What do Go goroutines and Java virtual threads have in common?", he: "מה משותף ל-goroutines של Go ול-virtual threads של Java?" },
      options: [ { en: "They disable garbage collection", he: "הם מבטלים garbage collection" }, { en: "Cheap user-space threads multiplexed M:N onto OS threads, so blocking-style code scales", he: "threads זולים ב-user-space שממופים M:N על OS threads, כך שקוד בסגנון blocking מתנהג טוב בסקייל" }, { en: "They only run on one core", he: "הם רצים רק על ליבה אחת" }, { en: "They require async/await keywords", he: "הם דורשים מילות async/await" } ],
      answer: 1, explain: { en: "Both park the lightweight thread on IO and reuse the carrier OS thread — simple code, async-like scalability.", he: "שניהם \"מחנים\" את ה-thread הקל בזמן IO וממחזרים את ה-OS thread הנושא — קוד פשוט, סקיילביליות כמו async." } },
    { q: { en: "A team wants to rewrite a slow Python service in Rust. What should a principal ask first?", he: "צוות רוצה לשכתב שירות Python איטי ל-Rust. מה Principal צריך לשאול קודם?" },
      options: [ { en: "Which Rust web framework is fastest", he: "איזה web framework ב-Rust הכי מהיר" }, { en: "Where does the time actually go (profile) and is the bottleneck in the language at all?", he: "לאן הזמן באמת הולך (profiling), והאם צוואר הבקבוק בכלל בשפה?" }, { en: "Whether Rust has a GIL", he: "האם יש ל-Rust GIL" }, { en: "How many lines the rewrite will have", he: "כמה שורות יהיו בשכתוב" } ],
      answer: 1, explain: { en: "Most slowness is DB/network/algorithmic. Measure before you spend a quarter on a rewrite plus a new stack to operate.", he: "רוב האיטיות היא DB/רשת/אלגוריתמית. מודדים לפני שמשקיעים רבעון בשכתוב ועוד stack לתפעל." } }
  ],
  related: ["pr-event-loop", "pr-concurrency-parallelism", "pr-garbage-collection", "pr-async-await", "cloud-serverless", "cpu"]
});

INFRA.lessons.push({
  id: "pr-big-data",
  track: "principal",
  order: 61,
  icon: "🐘",
  level: 3,
  minutes: 16,
  title: { en: "Big Data: Hadoop, Spark, Streaming, Lakehouse", he: "Big Data: Hadoop, Spark, Streaming ו-Lakehouse" },
  tldr: {
    en: "When data no longer fits one machine, you move the computation to the data: split files into blocks, process partitions in parallel (MapReduce → Spark), stream events with event-time windows (Flink), and store everything as columnar files in a lake with table formats (Iceberg/Delta).",
    he: "כשהנתונים כבר לא נכנסים למכונה אחת, מזיזים את החישוב אל הנתונים: מפצלים קבצים לבלוקים, מעבדים partitions במקביל (MapReduce → Spark), מזרימים events עם חלונות לפי event-time (Flink), ושומרים הכול כקבצים עמודתיים ב-lake עם table formats (Iceberg/Delta)."
  },
  analogy: {
    en: "Counting every word in a national library: one librarian would take 50 years. Instead you give each of 1,000 volunteers one shelf (map), each writes a tally sheet, then sorters collect all sheets for the letter A to one table, B to another (shuffle), and each table sums its letter (reduce). Hadoop is that, with the rule that volunteers sit next to their shelf (data locality). Spark is the same volunteers keeping their notes on the desk instead of filing them in the basement between every step (in-memory). Streaming is counting words in books as they arrive by conveyor belt — you must decide when 'the 9:00–9:05 batch' is complete even though some books arrive late (watermarks).",
    he: "לספור כל מילה בספרייה הלאומית: ספרן אחד יעבוד 50 שנה. במקום זה נותנים לכל אחד מ-1,000 מתנדבים מדף אחד (map), כל אחד כותב דף ספירה, ואז ממיינים אוספים את כל הדפים של האות א' לשולחן אחד, ב' לשולחן אחר (shuffle), וכל שולחן סוכם את האות שלו (reduce). Hadoop זה בדיוק זה, עם הכלל שכל מתנדב יושב ליד המדף שלו (data locality). Spark זה אותם מתנדבים שמשאירים את הפתקים על השולחן במקום לתייק אותם במרתף בין כל שלב (in-memory). Streaming זה לספור מילים בספרים שמגיעים על מסוע — צריך להחליט מתי 'המנה של 9:00–9:05' הסתיימה למרות שחלק מהספרים מגיעים באיחור (watermarks)."
  },
  sections: [
    {
      h: { en: "What makes data 'big' — and when it isn't", he: "מה הופך data ל-'big' — ומתי זה לא" },
      body: {
        en: `<p>The classic <strong>Vs</strong>: <strong>Volume</strong> (TBs–PBs), <strong>Velocity</strong> (100k+ events/s), <strong>Variety</strong> (JSON, logs, images, CSV), plus <strong>Veracity</strong> (dirty data) and <strong>Value</strong>. Practical definition: it's big when one machine can't store it, scan it fast enough, or keep up with its arrival rate.</p>
<table>
<tr><th>Size</th><th>Right tool</th></tr>
<tr><td>&lt; 100 GB</td><td>Postgres, DuckDB, pandas/Polars on a laptop</td></tr>
<tr><td>100 GB – 10 TB</td><td>ClickHouse, BigQuery, Snowflake, one big Spark job</td></tr>
<tr><td>10 TB – PBs</td><td>Lake (S3/GCS) + Spark/Trino + Iceberg/Delta</td></tr>
<tr><td>Continuous 100k+ ev/s</td><td>Kafka + Flink / Kafka Streams / Spark Structured Streaming</td></tr>
</table>
<blockquote>💡 Real world: A single modern server has 1–2 TB RAM and 64+ cores; DuckDB scans 1 billion rows in seconds. Many "big data" clusters exist because of 2012 habits. Start small, scale when the numbers force you.</blockquote>`,
        he: `<p>ה-<strong>Vs</strong> הקלאסיים: <strong>Volume</strong> (TBs–PBs), <strong>Velocity</strong> (100k+ events/s), <strong>Variety</strong> (JSON, לוגים, תמונות, CSV), ועוד <strong>Veracity</strong> (data מלוכלך) ו-<strong>Value</strong>. הגדרה מעשית: זה big כשמכונה אחת לא יכולה לאחסן את זה, לסרוק את זה מספיק מהר, או לעמוד בקצב ההגעה.</p>
<table>
<tr><th>גודל</th><th>הכלי הנכון</th></tr>
<tr><td>&lt; 100 GB</td><td>Postgres, DuckDB, pandas/Polars על לפטופ</td></tr>
<tr><td>100 GB – 10 TB</td><td>ClickHouse, BigQuery, Snowflake, job אחד גדול של Spark</td></tr>
<tr><td>10 TB – PBs</td><td>Lake (S3/GCS) + Spark/Trino + Iceberg/Delta</td></tr>
<tr><td>זרם רציף של 100k+ ev/s</td><td>Kafka + Flink / Kafka Streams / Spark Structured Streaming</td></tr>
</table>
<blockquote>💡 מהשטח: שרת מודרני אחד מגיע עם 1–2 TB RAM ו-64+ ליבות; DuckDB סורק מיליארד שורות בשניות. הרבה קלאסטרים של "big data" קיימים בגלל הרגלים מ-2012. מתחילים קטן, ומגדילים כשהמספרים מכריחים.</blockquote>`
      }
    },
    {
      h: { en: "Hadoop: HDFS + MapReduce + YARN", he: "Hadoop: HDFS + MapReduce + YARN" },
      body: {
        en: `<ul>
<li><strong>HDFS</strong>: files split into 128 MB blocks, each replicated <strong>3×</strong> across DataNodes (rack-aware: 2 in one rack, 1 in another). The <strong>NameNode</strong> holds the metadata (which blocks, where) in RAM — the historic single point of failure, later fixed with HA standby + JournalNodes. Small files kill it: 100M tiny files = 100M objects in NameNode memory.</li>
<li><strong>MapReduce</strong>: map (emit key/value) → shuffle &amp; sort by key over the network → reduce (aggregate per key). Every stage writes to disk.</li>
<li><strong>YARN</strong>: the cluster resource manager that schedules containers (it became the "Kubernetes of Hadoop").</li>
</ul>
<pre># Word count — Hadoop Streaming with Python
# mapper.py
import sys
for line in sys.stdin:
    for w in line.split():
        print(f"{w.lower()}\\t1")

# reducer.py (input arrives sorted by key)
import sys
cur, n = None, 0
for line in sys.stdin:
    w, c = line.rstrip().split("\\t")
    if w != cur:
        if cur: print(f"{cur}\\t{n}")
        cur, n = w, 0
    n += int(c)
if cur: print(f"{cur}\\t{n}")</pre>
<p>The big idea that survived: <strong>move compute to data</strong> (schedule the mapper on the node holding the block) and <strong>shared-nothing parallelism</strong>. HDFS itself has mostly been replaced by object storage (S3/GCS/ADLS) which separates storage from compute.</p>`,
        he: `<ul>
<li><strong>HDFS</strong>: קבצים מפוצלים לבלוקים של 128 MB, כל בלוק משוכפל <strong>פי 3</strong> בין DataNodes (rack-aware: 2 ב-rack אחד, 1 באחר). ה-<strong>NameNode</strong> מחזיק את המטא-דאטה (אילו בלוקים, איפה) ב-RAM — ה-SPOF ההיסטורי, שתוקן אחר כך עם standby ב-HA ו-JournalNodes. קבצים קטנים הורגים אותו: 100M קבצים זעירים = 100M אובייקטים בזיכרון של ה-NameNode.</li>
<li><strong>MapReduce</strong>: map (פולט key/value) → shuffle ומיון לפי key על הרשת → reduce (אגרגציה לכל key). כל שלב כותב לדיסק.</li>
<li><strong>YARN</strong>: מנהל המשאבים של הקלאסטר שמתזמן containers (הוא היה ה-"Kubernetes של Hadoop").</li>
</ul>
<pre># Word count — Hadoop Streaming with Python
# mapper.py
import sys
for line in sys.stdin:
    for w in line.split():
        print(f"{w.lower()}\\t1")

# reducer.py (input arrives sorted by key)
import sys
cur, n = None, 0
for line in sys.stdin:
    w, c = line.rstrip().split("\\t")
    if w != cur:
        if cur: print(f"{cur}\\t{n}")
        cur, n = w, 0
    n += int(c)
if cur: print(f"{cur}\\t{n}")</pre>
<p>הרעיון הגדול ששרד: <strong>להזיז את החישוב אל הנתונים</strong> (לתזמן את ה-mapper על ה-node שמחזיק את הבלוק) ו-<strong>shared-nothing parallelism</strong>. HDFS עצמו הוחלף ברובו ב-object storage (S3/GCS/ADLS), שמפריד בין storage ל-compute.</p>`
      }
    },
    {
      h: { en: "Spark: why it replaced MapReduce", he: "Spark: למה הוא החליף את MapReduce" },
      body: {
        en: `<p>Spark builds a <strong>DAG</strong> of transformations, keeps intermediate data <strong>in memory</strong>, and only executes on an action (lazy evaluation). Iterative jobs (ML, graph) went 10–100× faster than disk-bound MapReduce, and the API is SQL/DataFrames instead of hand-written mappers.</p>
<pre>from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.appName("orders").getOrCreate()

orders = spark.read.parquet("s3://lake/orders/")   # lazy
daily = (orders
  .filter(F.col("status") == "PAID")
  .groupBy(F.to_date("created_at").alias("day"), "country")
  .agg(F.sum("total_cents").alias("revenue")))   # still lazy

daily.write.mode("overwrite") \\
  .partitionBy("day").parquet("s3://lake/daily_rev/")  # action</pre>
<p>Key concepts: <strong>partitions</strong> (unit of parallelism — aim for 100–200 MB each), <strong>narrow vs wide</strong> transformations (filter is narrow; groupBy/join cause a <strong>shuffle</strong> over the network — the expensive part), <strong>broadcast join</strong> for a small table, <strong>data skew</strong> (one key with 40% of rows = one task runs for hours; fix with salting or AQE skew join).</p>
<blockquote>⚠️ Production tip: In the Spark UI, look at the stage with the longest task vs the median. Max ≫ median = skew. Too many tiny tasks = too many partitions/small files; call <code>coalesce</code>/<code>repartition</code>.</blockquote>`,
        he: `<p>Spark בונה <strong>DAG</strong> של טרנספורמציות, מחזיק נתוני ביניים <strong>בזיכרון</strong>, ומריץ רק כשיש action (lazy evaluation). Jobs איטרטיביים (ML, גרפים) נהיו מהירים פי 10–100 מ-MapReduce שכבול לדיסק, וה-API הוא SQL/DataFrames במקום mappers שכותבים ביד.</p>
<pre>from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.appName("orders").getOrCreate()

orders = spark.read.parquet("s3://lake/orders/")   # lazy
daily = (orders
  .filter(F.col("status") == "PAID")
  .groupBy(F.to_date("created_at").alias("day"), "country")
  .agg(F.sum("total_cents").alias("revenue")))   # still lazy

daily.write.mode("overwrite") \\
  .partitionBy("day").parquet("s3://lake/daily_rev/")  # action</pre>
<p>מושגי מפתח: <strong>partitions</strong> (יחידת המקביליות — מכוונים ל-100–200 MB כל אחד), טרנספורמציות <strong>narrow מול wide</strong> (filter הוא narrow; groupBy/join גורמים ל-<strong>shuffle</strong> על הרשת — החלק היקר), <strong>broadcast join</strong> לטבלה קטנה, <strong>data skew</strong> (key אחד עם 40% מהשורות = task אחד שרץ שעות; מתקנים עם salting או AQE skew join).</p>
<blockquote>⚠️ טיפ לפרודקשן: ב-Spark UI, הסתכלו על ה-stage עם ה-task הארוך ביותר מול החציון. Max ≫ median = skew. המון tasks זעירים = יותר מדי partitions/קבצים קטנים; קוראים ל-<code>coalesce</code>/<code>repartition</code>.</blockquote>`
      }
    },
    {
      h: { en: "Streaming: event time, windows, watermarks", he: "Streaming: event time, חלונות ו-watermarks" },
      body: {
        en: `<p>Stream processors (Flink, Kafka Streams, Spark Structured Streaming) compute continuously over unbounded data. The hard part is <strong>time</strong>:</p>
<ul>
<li><strong>Event time</strong> (when it happened on the phone) ≠ <strong>processing time</strong> (when it reached the server). A phone offline in a tunnel sends 10-minute-old events.</li>
<li><strong>Windows</strong>: tumbling (fixed 5-min buckets), sliding (5 min every 1 min), session (gap-based, e.g. 30 min of inactivity).</li>
<li><strong>Watermark</strong>: "I believe I've seen all events up to 09:04:30" — lets a window close and emit; events later than the allowed lateness go to a side output.</li>
<li><strong>State + checkpoints</strong>: Flink snapshots operator state (RocksDB) to S3 so a crash resumes exactly-once with Kafka transactions.</li>
</ul>
<pre>-- Flink SQL: revenue per country per 5 minutes, 30 s lateness
CREATE TABLE orders (
  country STRING, total_cents BIGINT, ts TIMESTAMP(3),
  WATERMARK FOR ts AS ts - INTERVAL '30' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'orders', ...);

SELECT window_start, country, SUM(total_cents)
FROM TABLE(TUMBLE(TABLE orders, DESCRIPTOR(ts),
                  INTERVAL '5' MINUTES))
GROUP BY window_start, window_end, country;</pre>
<p><strong>Lambda architecture</strong>: a batch layer (accurate, recomputed nightly) + a speed layer (approximate, real-time) merged at query time — two codebases for the same logic. <strong>Kappa architecture</strong>: one streaming pipeline; to reprocess, replay the Kafka log from the start with the new code. Modern default: Kappa-ish, with the lake as long-term history.</p>`,
        he: `<p>מעבדי stream (Flink, Kafka Streams, Spark Structured Streaming) מחשבים ברציפות על data בלי סוף. החלק הקשה הוא <strong>זמן</strong>:</p>
<ul>
<li><strong>Event time</strong> (מתי זה קרה בטלפון) ≠ <strong>processing time</strong> (מתי זה הגיע לשרת). טלפון שהיה offline במנהרה שולח events בני 10 דקות.</li>
<li><strong>חלונות</strong>: tumbling (דליים קבועים של 5 דקות), sliding (5 דקות כל דקה), session (לפי פער, למשל 30 דקות בלי פעילות).</li>
<li><strong>Watermark</strong>: "אני מאמין שראיתי את כל ה-events עד 09:04:30" — מאפשר לסגור חלון ולפלוט תוצאה; events שמאחרים מעבר ל-lateness המותר הולכים ל-side output.</li>
<li><strong>State + checkpoints</strong>: Flink שומר snapshots של ה-state של האופרטורים (RocksDB) ל-S3, כך שקריסה ממשיכה exactly-once עם Kafka transactions.</li>
</ul>
<pre>-- Flink SQL: revenue per country per 5 minutes, 30 s lateness
CREATE TABLE orders (
  country STRING, total_cents BIGINT, ts TIMESTAMP(3),
  WATERMARK FOR ts AS ts - INTERVAL '30' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'orders', ...);

SELECT window_start, country, SUM(total_cents)
FROM TABLE(TUMBLE(TABLE orders, DESCRIPTOR(ts),
                  INTERVAL '5' MINUTES))
GROUP BY window_start, window_end, country;</pre>
<p><strong>Lambda architecture</strong>: שכבת batch (מדויקת, מחושבת מחדש כל לילה) + שכבת speed (מקורבת, real-time) שמתמזגות בזמן השאילתה — שני codebases לאותה לוגיקה. <strong>Kappa architecture</strong>: pipeline streaming אחד; כדי לעבד מחדש, עושים replay ל-log של Kafka מההתחלה עם הקוד החדש. ברירת המחדל המודרנית: בערך Kappa, עם ה-lake כהיסטוריה ארוכת טווח.</p>`
      }
    },
    {
      h: { en: "Lake, warehouse, lakehouse — and ETL vs ELT", he: "Lake, warehouse, lakehouse — ו-ETL מול ELT" },
      body: {
        en: `<table>
<tr><th></th><th>Data lake</th><th>Warehouse</th><th>Lakehouse</th></tr>
<tr><td>Storage</td><td>files on S3/GCS (any format)</td><td>proprietary managed</td><td>Parquet on S3 + table format</td></tr>
<tr><td>Schema</td><td>on read</td><td>on write</td><td>on write, evolvable</td></tr>
<tr><td>ACID / updates</td><td>no</td><td>yes</td><td>yes (Iceberg, Delta, Hudi)</td></tr>
<tr><td>Examples</td><td>raw S3 bucket</td><td>Snowflake, BigQuery, Redshift</td><td>Databricks, Iceberg + Trino/Spark</td></tr>
</table>
<p><strong>Parquet</strong> is columnar + compressed: a query reading 3 of 80 columns reads ~4% of the bytes; min/max stats per row group let engines skip whole chunks. <strong>Iceberg/Delta</strong> add a transaction log on top: atomic commits, time travel (<code>FOR VERSION AS OF</code>), schema evolution, hidden partitioning, compaction.</p>
<p><strong>ETL</strong> transforms before loading (old: Informatica, custom Spark). <strong>ELT</strong> loads raw first, then transforms inside the warehouse with SQL (Fivetran/Airbyte → dbt). Orchestrate DAGs of jobs with <strong>Airflow</strong>, Dagster or Prefect: dependencies, retries, backfills, SLAs.</p>
<pre>Sizing example: clickstream
 50M users x 40 events/day = 2B events/day ~ 23k ev/s avg, 70k peak
 1 KB JSON each = 2 TB/day raw -&gt; Parquet+zstd ~ 10x = 200 GB/day
 1 year = 73 TB in S3 ~ $1,700/month (standard), less with tiers
 Kafka: 70k ev/s x 1 KB = 70 MB/s -&gt; ~24 partitions, 3 brokers+
 Partition lake by event_date (and maybe hour); target 256 MB files</pre>
<blockquote>⚠️ Production tip: The <strong>small-files problem</strong> is the #1 lake killer — a streaming job writing every 10 s creates 8,640 files/day per partition. Schedule compaction (Iceberg <code>rewrite_data_files</code>, Delta <code>OPTIMIZE</code>).</blockquote>`,
        he: `<table>
<tr><th></th><th>Data lake</th><th>Warehouse</th><th>Lakehouse</th></tr>
<tr><td>אחסון</td><td>קבצים על S3/GCS (כל פורמט)</td><td>managed קנייני</td><td>Parquet על S3 + table format</td></tr>
<tr><td>Schema</td><td>on read</td><td>on write</td><td>on write, ניתן לשינוי</td></tr>
<tr><td>ACID / עדכונים</td><td>לא</td><td>כן</td><td>כן (Iceberg, Delta, Hudi)</td></tr>
<tr><td>דוגמאות</td><td>bucket גולמי ב-S3</td><td>Snowflake, BigQuery, Redshift</td><td>Databricks, Iceberg + Trino/Spark</td></tr>
</table>
<p><strong>Parquet</strong> הוא עמודתי + דחוס: שאילתה שקוראת 3 מתוך 80 עמודות קוראת ~4% מה-bytes; סטטיסטיקות min/max לכל row group מאפשרות למנועים לדלג על chunks שלמים. <strong>Iceberg/Delta</strong> מוסיפים מעליו transaction log: commits אטומיים, time travel (<code>FOR VERSION AS OF</code>), schema evolution, hidden partitioning, compaction.</p>
<p><strong>ETL</strong> מבצע טרנספורמציה לפני הטעינה (הישן: Informatica, Spark מותאם). <strong>ELT</strong> טוען קודם גולמי, ואז מבצע טרנספורמציה בתוך ה-warehouse עם SQL (Fivetran/Airbyte → dbt). מתזמרים DAGs של jobs עם <strong>Airflow</strong>, Dagster או Prefect: תלויות, retries, backfills, SLAs.</p>
<pre>Sizing example: clickstream
 50M users x 40 events/day = 2B events/day ~ 23k ev/s avg, 70k peak
 1 KB JSON each = 2 TB/day raw -&gt; Parquet+zstd ~ 10x = 200 GB/day
 1 year = 73 TB in S3 ~ $1,700/month (standard), less with tiers
 Kafka: 70k ev/s x 1 KB = 70 MB/s -&gt; ~24 partitions, 3 brokers+
 Partition lake by event_date (and maybe hour); target 256 MB files</pre>
<blockquote>⚠️ טיפ לפרודקשן: <strong>בעיית הקבצים הקטנים</strong> היא רוצחת ה-lake מספר 1 — job של streaming שכותב כל 10 שניות יוצר 8,640 קבצים ביום לכל partition. מתזמנים compaction (ב-Iceberg <code>rewrite_data_files</code>, ב-Delta <code>OPTIMIZE</code>).</blockquote>`
      }
    }
  ],
  diagram: `apps/DB --CDC--> Kafka --> Flink (windows, watermarks) --> alerts/dashboards
   |                 \\
   |                  +--> S3 raw (bronze) --Spark/dbt--> silver --> gold
   |                          Parquet + Iceberg/Delta tables
   +--Airbyte/Fivetran (ELT)--> Snowflake/BigQuery --> BI (Looker)

MapReduce:  [split]->map->disk->shuffle/sort->reduce->disk (per step)
Spark:      DAG of stages, intermediate data in memory, shuffle only on wide ops`,
  handsOn: [
    { cmd: "pip install duckdb && python -c \"import duckdb;print(duckdb.sql('select count(*), sum(i) from range(100000000) t(i)'))\"", what: { en: "Feel how far one machine goes: DuckDB aggregates 100M rows in about a second.", he: "תרגישו כמה רחוק מכונה אחת מגיעה: DuckDB מסכם 100M שורות בערך בשנייה." } },
    { cmd: "docker run -it --rm -p 4040:4040 apache/spark-py /opt/spark/bin/pyspark", what: { en: "Start a local PySpark shell, run a groupBy, and open the Spark UI at localhost:4040 to see stages and shuffles.", he: "הריצו PySpark מקומי, תריצו groupBy, ופתחו את Spark UI ב-localhost:4040 כדי לראות stages ו-shuffles." } },
    { cmd: "hdfs fsck /data/events -files -blocks -locations | head -40", what: { en: "On a Hadoop cluster: see how a file is split into blocks and where the 3 replicas live.", he: "בקלאסטר Hadoop: לראות איך קובץ מפוצל לבלוקים ואיפה נמצאים 3 העותקים." } },
    { cmd: "python -c \"import pyarrow.parquet as pq;f=pq.ParquetFile('data.parquet');print(f.metadata);print(f.metadata.row_group(0).column(0).statistics)\"", what: { en: "Inspect a Parquet file's row groups and min/max statistics — the reason column stores skip data so well.", he: "בדקו row groups וסטטיסטיקות min/max של קובץ Parquet — הסיבה ש-column stores מדלגים על data כל כך טוב." } }
  ],
  mnemonic: {
    en: "\"Split, Map, Shuffle, Reduce — then keep it in RAM (Spark), give it time (watermarks), and store it in columns (Parquet).\" Also: small data first — DuckDB before Databricks.",
    he: "\"פצל, מפה, ערבב, צמצם — ואז תשאיר ב-RAM (Spark), תן לזה זמן (watermarks), ותשמור בעמודות (Parquet).\" וגם: data קטן קודם — DuckDB לפני Databricks."
  },
  pitfalls: [
    { en: "Building a Spark/Hadoop cluster for 50 GB of data — a single Postgres/DuckDB/ClickHouse node is faster, cheaper and simpler.", he: "להקים קלאסטר Spark/Hadoop בשביל 50 GB — node אחד של Postgres/DuckDB/ClickHouse מהיר יותר, זול יותר ופשוט יותר." },
    { en: "Using processing time instead of event time for business metrics — late mobile events land in the wrong hour.", he: "להשתמש ב-processing time במקום event time למדדים עסקיים — events מאוחרים ממובייל נוחתים בשעה הלא נכונה." },
    { en: "Ignoring skew: one hot key (a giant customer, null) makes one task run for hours while 199 finish in a minute.", he: "להתעלם מ-skew: key חם אחד (לקוח ענק, null) גורם ל-task אחד לרוץ שעות בזמן ש-199 מסיימים בדקה." },
    { en: "Millions of tiny files from streaming writes without compaction — slow queries and a struggling metadata layer.", he: "מיליוני קבצים זעירים מכתיבות streaming בלי compaction — שאילתות איטיות ושכבת metadata שקורסת." }
  ],
  interview: [
    { q: { en: "Why did Spark replace MapReduce?", he: "למה Spark החליף את MapReduce?" },
      a: { en: "MapReduce writes every stage to disk and forces jobs into map→reduce pairs, so multi-step and iterative jobs chain many disk-bound jobs. Spark plans a whole DAG, pipelines narrow transformations, keeps intermediates in memory, only shuffles on wide operations, and offers SQL/DataFrame APIs with a cost-based optimizer — 10–100× faster for iterative work and far easier to write.", he: "MapReduce כותב כל שלב לדיסק ומכריח jobs לזוגות של map→reduce, אז jobs רב-שלביים ואיטרטיביים משרשרים הרבה jobs שכבולים לדיסק. Spark מתכנן DAG שלם, עושה pipelining לטרנספורמציות narrow, מחזיק נתוני ביניים בזיכרון, עושה shuffle רק בפעולות wide, ומציע API של SQL/DataFrame עם optimizer מבוסס עלות — פי 10–100 מהר יותר לעבודה איטרטיבית והרבה יותר קל לכתוב." } },
    { q: { en: "Design a pipeline for real-time fraud scores plus accurate daily finance reports from the same events.", he: "תכננו pipeline ל-fraud scores בזמן אמת וגם לדוחות כספיים יומיים מדויקים מאותם events." },
      a: { en: "Events via CDC/outbox into Kafka (keyed by account). Flink consumes with event-time windows and keyed state for features and scoring, writing alerts within seconds. The same topic is sunk to S3 as Iceberg tables (bronze); nightly dbt/Spark builds silver/gold finance tables with late data included, reconciled against the ledger DB. One source of truth (the log), two consumers with different latency/accuracy — Kappa-style, with replay for bug fixes.", he: "Events דרך CDC/outbox ל-Kafka (עם key לפי חשבון). Flink צורך עם חלונות event-time ו-keyed state בשביל features ו-scoring, וכותב התראות תוך שניות. אותו topic נשפך ל-S3 כטבלאות Iceberg (bronze); כל לילה dbt/Spark בונים טבלאות silver/gold לכספים כולל data מאוחר, ומבצעים reconciliation מול ה-ledger DB. מקור אמת אחד (ה-log), שני consumers עם latency/דיוק שונים — בסגנון Kappa, עם replay לתיקוני באגים." } }
  ],
  quiz: [
    { q: { en: "HDFS default replication and block size?", he: "ברירות המחדל של replication וגודל בלוק ב-HDFS?" },
      options: [ { en: "2 copies, 4 KB", he: "2 עותקים, 4 KB" }, { en: "3 copies, 128 MB", he: "3 עותקים, 128 MB" }, { en: "1 copy, 1 GB", he: "עותק 1, 1 GB" }, { en: "5 copies, 64 KB", he: "5 עותקים, 64 KB" } ],
      answer: 1, explain: { en: "Large 128 MB blocks keep NameNode metadata small; 3 replicas survive a node and a rack failure.", he: "בלוקים גדולים של 128 MB שומרים על metadata קטן ב-NameNode; 3 עותקים שורדים נפילה של node ושל rack." } },
    { q: { en: "In Spark, which operation triggers a shuffle?", he: "ב-Spark, איזו פעולה גורמת ל-shuffle?" },
      options: [ { en: "filter", he: "filter" }, { en: "select", he: "select" }, { en: "groupBy().agg()", he: "groupBy().agg()" }, { en: "withColumn", he: "withColumn" } ],
      answer: 2, explain: { en: "Wide transformations (groupBy, join, distinct, repartition) must move rows with the same key to the same partition over the network.", he: "טרנספורמציות wide (groupBy, join, distinct, repartition) חייבות להעביר שורות עם אותו key לאותו partition על הרשת." } },
    { q: { en: "What does a watermark tell a stream processor?", he: "מה watermark אומר למעבד stream?" },
      options: [ { en: "The Kafka offset to commit", he: "איזה offset ב-Kafka לעשות לו commit" }, { en: "That events up to time T have (probably) all arrived, so windows ending before T can close", he: "שכל ה-events עד זמן T (כנראה) הגיעו, כך שחלונות שמסתיימים לפני T יכולים להיסגר" }, { en: "The max memory for state", he: "הזיכרון המקסימלי ל-state" }, { en: "The processing-time clock", he: "שעון ה-processing-time" } ],
      answer: 1, explain: { en: "Watermarks trade completeness vs latency for event-time windows; later events become 'late data'.", he: "Watermarks מאזנים בין שלמות ל-latency בחלונות event-time; events שמגיעים אחר כך הופכים ל-'late data'." } },
    { q: { en: "What do Iceberg/Delta add on top of Parquet files in S3?", he: "מה Iceberg/Delta מוסיפים מעל קבצי Parquet ב-S3?" },
      options: [ { en: "Row-based storage", he: "אחסון מבוסס שורות" }, { en: "A transaction log: ACID commits, time travel, schema evolution", he: "Transaction log: commits עם ACID, time travel, schema evolution" }, { en: "A message broker", he: "Message broker" }, { en: "GPU acceleration", he: "האצת GPU" } ],
      answer: 1, explain: { en: "Table formats turn a pile of files into a real table with atomic commits and snapshots — the core of a lakehouse.", he: "Table formats הופכים ערימת קבצים לטבלה אמיתית עם commits אטומיים ו-snapshots — הלב של lakehouse." } }
  ],
  related: ["pr-db-landscape", "pr-queue-kinds", "staff-kafka-deep", "staff-time-ordering", "cloud-storage", "pr-sizing"]
});

INFRA.lessons.push({
  id: "pr-backups-strategy",
  track: "principal",
  order: 62,
  icon: "💾",
  level: 3,
  minutes: 15,
  title: { en: "Backup Strategy Like a Principal: 3-2-1-1-0, PITR, Immutability, Restore Drills", he: "אסטרטגיית גיבוי כמו Principal: 3-2-1-1-0, PITR, אי-שינוי ותרגולי שחזור" },
  tldr: {
    en: "A backup strategy is defined by the restore you can prove: map every data store to an RPO/RTO, keep 3 copies on 2 media with 1 off-site, 1 immutable and 0 restore errors — and drill the restore on a schedule.",
    he: "אסטרטגיית גיבוי מוגדרת לפי השחזור שאפשר להוכיח: ממפים כל מאגר נתונים ל-RPO/RTO, שומרים 3 עותקים על 2 מדיות, 1 מחוץ לאתר, 1 immutable ו-0 שגיאות שחזור — ומתרגלים שחזור לפי לוח זמנים."
  },
  analogy: {
    en: "Backups are a parachute. Nobody cares how beautifully it was folded — only whether it opens. RAID and replicas are a second engine: great when one engine dies, useless when the pilot (a bad migration, ransomware, rm -rf) flies the plane into the ground, because both engines obey the same pilot. An immutable off-site copy is the parachute locked in a box the pilot himself can't open.",
    he: "גיבויים הם מצנח. לאף אחד לא אכפת כמה יפה הוא קופל — רק אם הוא נפתח. RAID ו-replicas הם מנוע שני: מעולה כשמנוע אחד מת, חסר תועלת כשהטייס (מיגרציה גרועה, ransomware, rm -rf) מטיס את המטוס לקרקע, כי שני המנועים מצייתים לאותו טייס. עותק immutable מחוץ לאתר הוא מצנח נעול בקופסה שאפילו הטייס עצמו לא יכול לפתוח."
  },
  sections: [
    {
      h: { en: "Replication is not backup — the threat model", he: "Replication זה לא גיבוי — מודל האיומים" },
      body: {
        en: `<table>
<tr><th>Threat</th><th>Replica / RAID</th><th>Snapshot, same account</th><th>Immutable off-site backup</th></tr>
<tr><td>Disk/node dies</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td>AZ/region outage</td><td>✅ (if cross-region)</td><td>❌ (same region)</td><td>✅</td></tr>
<tr><td>Bad migration / DELETE without WHERE</td><td>❌ replicated instantly</td><td>✅</td><td>✅</td></tr>
<tr><td>Ransomware / stolen admin creds</td><td>❌</td><td>❌ attacker deletes them</td><td>✅</td></tr>
<tr><td>Silent corruption found 3 weeks later</td><td>❌</td><td>depends on retention</td><td>✅ with long retention</td></tr>
</table>
<p>The <strong>3-2-1-1-0</strong> rule: <strong>3</strong> copies of data, on <strong>2</strong> different media/services, <strong>1</strong> off-site (other region/account), <strong>1</strong> offline or immutable, <strong>0</strong> errors in verified restores.</p>
<blockquote>💡 Real world: GitLab 2017 — an engineer ran <code>rm -rf</code> on the primary DB directory; 5 backup mechanisms turned out to be broken or never configured. They restored from a staging copy 6 hours old. The lesson everybody quotes: an untested backup is a hope, not a backup.</blockquote>`,
        he: `<table>
<tr><th>איום</th><th>Replica / RAID</th><th>Snapshot באותו account</th><th>גיבוי immutable מחוץ לאתר</th></tr>
<tr><td>דיסק/node מת</td><td>✅</td><td>✅</td><td>✅</td></tr>
<tr><td>נפילת AZ/region</td><td>✅ (אם cross-region)</td><td>❌ (אותו region)</td><td>✅</td></tr>
<tr><td>מיגרציה גרועה / DELETE בלי WHERE</td><td>❌ משוכפל מיד</td><td>✅</td><td>✅</td></tr>
<tr><td>Ransomware / גניבת credentials של admin</td><td>❌</td><td>❌ התוקף מוחק אותם</td><td>✅</td></tr>
<tr><td>השחתה שקטה שמתגלה אחרי 3 שבועות</td><td>❌</td><td>תלוי ב-retention</td><td>✅ עם retention ארוך</td></tr>
</table>
<p>כלל <strong>3-2-1-1-0</strong>: <strong>3</strong> עותקים של הנתונים, על <strong>2</strong> מדיות/שירותים שונים, <strong>1</strong> מחוץ לאתר (region/account אחר), <strong>1</strong> offline או immutable, <strong>0</strong> שגיאות בשחזורים מאומתים.</p>
<blockquote>💡 מהשטח: GitLab ב-2017 — מהנדס הריץ <code>rm -rf</code> על תיקיית ה-DB הראשי; 5 מנגנוני גיבוי התבררו כשבורים או שאף פעם לא הוגדרו. הם שחזרו מעותק staging בן 6 שעות. הלקח שכולם מצטטים: גיבוי שלא נבדק הוא תקווה, לא גיבוי.</blockquote>`
      }
    },
    {
      h: { en: "Kinds of backups: full, incremental, differential, snapshot, logical, physical", he: "סוגי גיבוי: full, incremental, differential, snapshot, לוגי, פיזי" },
      body: {
        en: `<table>
<tr><th>Kind</th><th>What</th><th>Restore needs</th><th>Trade-off</th></tr>
<tr><td>Full</td><td>everything</td><td>1 set</td><td>slow, big</td></tr>
<tr><td>Incremental</td><td>changes since last backup (any)</td><td>full + every incr.</td><td>small/fast backup, slower restore</td></tr>
<tr><td>Differential</td><td>changes since last full</td><td>full + latest diff</td><td>grows daily, simpler restore</td></tr>
<tr><td>Snapshot</td><td>block-level copy-on-write (EBS, LVM, ZFS)</td><td>1 snapshot</td><td>instant, but crash-consistent only</td></tr>
<tr><td>Logical</td><td>SQL/JSON dump (pg_dump, mongodump)</td><td>replay statements</td><td>portable across versions, slow for TBs</td></tr>
<tr><td>Physical</td><td>data files + WAL (pgBackRest, XtraBackup)</td><td>copy files back</td><td>fast for TBs, same major version</td></tr>
</table>
<p><strong>Crash-consistent</strong> = like pulling the power cord (the DB will run recovery). <strong>Application-consistent</strong> = the DB flushed/froze first (fsfreeze, VSS on Windows, <code>pg_backup_start</code>). For databases prefer the DB's own physical backup tool over raw disk snapshots.</p>`,
        he: `<table>
<tr><th>סוג</th><th>מה</th><th>מה צריך לשחזור</th><th>Trade-off</th></tr>
<tr><td>Full</td><td>הכול</td><td>סט אחד</td><td>איטי, גדול</td></tr>
<tr><td>Incremental</td><td>שינויים מאז הגיבוי האחרון (כל סוג)</td><td>full + כל ה-incr.</td><td>גיבוי קטן ומהיר, שחזור איטי יותר</td></tr>
<tr><td>Differential</td><td>שינויים מאז ה-full האחרון</td><td>full + ה-diff האחרון</td><td>גדל כל יום, שחזור פשוט יותר</td></tr>
<tr><td>Snapshot</td><td>העתק ברמת בלוק עם copy-on-write (EBS, LVM, ZFS)</td><td>snapshot אחד</td><td>מיידי, אבל רק crash-consistent</td></tr>
<tr><td>לוגי</td><td>dump של SQL/JSON (pg_dump, mongodump)</td><td>הרצה מחדש של פקודות</td><td>נייד בין גרסאות, איטי ל-TBs</td></tr>
<tr><td>פיזי</td><td>קבצי data + WAL (pgBackRest, XtraBackup)</td><td>להעתיק את הקבצים חזרה</td><td>מהיר ל-TBs, אותה major version</td></tr>
</table>
<p><strong>Crash-consistent</strong> = כמו לשלוף את כבל החשמל (ה-DB יריץ recovery). <strong>Application-consistent</strong> = ה-DB עשה flush/הוקפא קודם (fsfreeze, VSS ב-Windows, <code>pg_backup_start</code>). ל-databases עדיף את כלי הגיבוי הפיזי של ה-DB עצמו על פני snapshots גולמיים של דיסק.</p>`
      }
    },
    {
      h: { en: "Point-in-time recovery (PITR) with WAL", he: "Point-in-time recovery (PITR) עם WAL" },
      body: {
        en: `<p>A nightly full backup gives RPO = 24 h. Add continuous <strong>WAL archiving</strong> (every committed change shipped to object storage) and you can restore to <em>any second</em> — e.g. 14:31:59, one second before someone ran the bad <code>UPDATE</code> at 14:32.</p>
<pre># pgBackRest: weekly full, daily diff, WAL continuous
# /etc/pgbackrest/pgbackrest.conf
[global]
repo1-type=s3
repo1-s3-bucket=acme-pg-backups
repo1-retention-full=4
repo1-cipher-type=aes-256-cbc
[main]
pg1-path=/var/lib/postgresql/16/main

# postgresql.conf
archive_mode = on
archive_command = 'pgbackrest --stanza=main archive-push %p'

pgbackrest --stanza=main --type=full backup
pgbackrest --stanza=main --type=diff backup
pgbackrest --stanza=main info

# Restore to just before the incident
pgbackrest --stanza=main --delta \\
  --type=time "--target=2026-11-13 14:31:59+02" \\
  --target-action=promote restore</pre>
<p>WAL-G and Barman do the same; managed DBs (RDS, Cloud SQL, Azure Flexible Server) give PITR with a retention window (1–35 days) — but they restore into a <em>new</em> instance, so practice the DNS/connection-string switch too.</p>
<blockquote>⚠️ Production tip: Monitor <code>pg_stat_archiver.failed_count</code> and the age of the last archived WAL. A silently failing archive_command means your RPO is quietly growing to "last full backup" — and pg_wal fills the disk.</blockquote>`,
        he: `<p>גיבוי full כל לילה נותן RPO = 24 שעות. מוסיפים <strong>WAL archiving</strong> רציף (כל שינוי שעשה commit נשלח ל-object storage) ואפשר לשחזר ל-<em>כל שנייה</em> — למשל 14:31:59, שנייה לפני שמישהו הריץ את ה-<code>UPDATE</code> הגרוע ב-14:32.</p>
<pre># pgBackRest: weekly full, daily diff, WAL continuous
# /etc/pgbackrest/pgbackrest.conf
[global]
repo1-type=s3
repo1-s3-bucket=acme-pg-backups
repo1-retention-full=4
repo1-cipher-type=aes-256-cbc
[main]
pg1-path=/var/lib/postgresql/16/main

# postgresql.conf
archive_mode = on
archive_command = 'pgbackrest --stanza=main archive-push %p'

pgbackrest --stanza=main --type=full backup
pgbackrest --stanza=main --type=diff backup
pgbackrest --stanza=main info

# Restore to just before the incident
pgbackrest --stanza=main --delta \\
  --type=time "--target=2026-11-13 14:31:59+02" \\
  --target-action=promote restore</pre>
<p>WAL-G ו-Barman עושים אותו דבר; DBs מנוהלים (RDS, Cloud SQL, Azure Flexible Server) נותנים PITR עם חלון retention (1–35 ימים) — אבל משחזרים ל-instance <em>חדש</em>, אז תתרגלו גם את המעבר של DNS/connection string.</p>
<blockquote>⚠️ טיפ לפרודקשן: תנטרו את <code>pg_stat_archiver.failed_count</code> ואת הגיל של ה-WAL האחרון שנשמר בארכיון. archive_command שנכשל בשקט אומר שה-RPO שלכם גדל בשקט ל-"גיבוי ה-full האחרון" — ו-pg_wal ממלא את הדיסק.</blockquote>`
      }
    },
    {
      h: { en: "Immutability, isolation and retention", he: "Immutability, בידוד ו-retention" },
      body: {
        en: `<ul>
<li><strong>Object Lock / WORM</strong>: S3 Object Lock in <em>compliance</em> mode (nobody, not even root, can delete before the date), Azure immutable blob policies, GCS bucket lock. This is the ransomware answer.</li>
<li><strong>Separate account + separate credentials</strong>: backups copied into a dedicated "vault" account (AWS Backup vault lock, cross-account copy). Production admins can't delete them.</li>
<li><strong>Encryption + key backup</strong>: backups encrypted with KMS keys — and the keys themselves must survive (multi-region keys, documented escrow). Losing the key = losing the backup.</li>
<li><strong>Retention: GFS</strong> (grandfather-father-son): daily for 14 days, weekly for 8 weeks, monthly for 12 months, yearly for 7 years (only if compliance requires). Balance against privacy: a deleted user lives on in backups (see crypto-shredding in the privacy lesson).</li>
</ul>
<pre># Kubernetes: Velero backs up API objects + PV snapshots
velero schedule create nightly \\
  --schedule="0 2 * * *" --ttl 720h \\
  --include-namespaces payments,orders
velero backup describe nightly-20261113020000 --details
velero restore create \\
  --from-backup nightly-20261113020000 \\
  --namespace-mappings payments:payments-restore</pre>
<blockquote>💡 Real world: In most ransomware incidents the attackers first find and delete backups using the same domain admin / cloud root they already own. Isolation (different account, different identity, MFA delete, Object Lock) is what separates "restore in 2 days" from "pay".</blockquote>`,
        he: `<ul>
<li><strong>Object Lock / WORM</strong>: S3 Object Lock במצב <em>compliance</em> (אף אחד, אפילו לא root, לא יכול למחוק לפני התאריך), immutable blob policies ב-Azure, bucket lock ב-GCS. זו התשובה ל-ransomware.</li>
<li><strong>Account נפרד + credentials נפרדים</strong>: גיבויים מועתקים ל-account ייעודי של "כספת" (AWS Backup vault lock, cross-account copy). ה-admins של פרודקשן לא יכולים למחוק אותם.</li>
<li><strong>הצפנה + גיבוי מפתחות</strong>: גיבויים מוצפנים עם מפתחות KMS — והמפתחות עצמם חייבים לשרוד (multi-region keys, escrow מתועד). לאבד את המפתח = לאבד את הגיבוי.</li>
<li><strong>Retention: GFS</strong> (סבא-אבא-בן): יומי ל-14 יום, שבועי ל-8 שבועות, חודשי ל-12 חודשים, שנתי ל-7 שנים (רק אם רגולציה דורשת). צריך לאזן מול פרטיות: משתמש שנמחק ממשיך לחיות בגיבויים (ראו crypto-shredding בשיעור על פרטיות).</li>
</ul>
<pre># Kubernetes: Velero backs up API objects + PV snapshots
velero schedule create nightly \\
  --schedule="0 2 * * *" --ttl 720h \\
  --include-namespaces payments,orders
velero backup describe nightly-20261113020000 --details
velero restore create \\
  --from-backup nightly-20261113020000 \\
  --namespace-mappings payments:payments-restore</pre>
<blockquote>💡 מהשטח: ברוב אירועי ה-ransomware התוקפים קודם מוצאים ומוחקים גיבויים בעזרת אותו domain admin / cloud root שכבר בידיהם. בידוד (account אחר, זהות אחרת, MFA delete, Object Lock) הוא מה שמבדיל בין "משחזרים ביומיים" לבין "משלמים".</blockquote>`
      }
    },
    {
      h: { en: "The plan: inventory, RPO/RTO mapping, drills, cost", he: "התוכנית: מלאי, מיפוי RPO/RTO, תרגולים ועלות" },
      body: {
        en: `<table>
<tr><th>Asset</th><th>RPO</th><th>RTO</th><th>Mechanism</th></tr>
<tr><td>Payments Postgres</td><td>&lt; 1 min</td><td>30 min</td><td>PITR (WAL) + cross-region replica + vault copy</td></tr>
<tr><td>User uploads (S3)</td><td>0</td><td>hours</td><td>versioning + CRR + Object Lock</td></tr>
<tr><td>Redis cache</td><td>n/a</td><td>minutes</td><td>none — rebuild from source</td></tr>
<tr><td>Kafka topics</td><td>minutes</td><td>1 h</td><td>MirrorMaker 2 / sink to S3</td></tr>
<tr><td>K8s manifests</td><td>0</td><td>1 h</td><td>Git (GitOps) + Velero for PVs/secrets</td></tr>
<tr><td>Terraform state, secrets, DNS, CI config</td><td>daily</td><td>hours</td><td>versioned bucket, Vault snapshots, zone exports</td></tr>
</table>
<p>Things people forget to back up: <strong>Terraform state</strong>, <strong>Vault/KMS keys</strong>, <strong>DNS zone</strong> records, <strong>IdP/SSO config</strong>, CI/CD pipelines and their secrets, SaaS data (Jira, Google Workspace, GitHub org), and the <strong>restore runbook</strong> — stored somewhere that is not the system that's down.</p>
<p><strong>Restore drills</strong>: automate a weekly job that restores the latest backup into an isolated environment, runs checksums/row counts/app smoke tests, records the time taken (your <em>real</em> RTO) and alerts on failure. Do a full DR game day twice a year.</p>
<p><strong>Cost</strong>: 10 TB DB, daily diff ~3%, 30-day retention ≈ 4 fulls (40 TB) + 30 diffs (9 TB) ≈ 49 TB raw → compressed ~20 TB → S3 Standard-IA ≈ $250/month; yearly copies in Glacier cost pennies. Backups are cheap; downtime and lost data aren't.</p>`,
        he: `<table>
<tr><th>נכס</th><th>RPO</th><th>RTO</th><th>מנגנון</th></tr>
<tr><td>Postgres של תשלומים</td><td>&lt; 1 min</td><td>30 min</td><td>PITR (WAL) + replica ב-region אחר + עותק בכספת</td></tr>
<tr><td>קבצים שמשתמשים העלו (S3)</td><td>0</td><td>שעות</td><td>versioning + CRR + Object Lock</td></tr>
<tr><td>Redis cache</td><td>לא רלוונטי</td><td>דקות</td><td>אין — בונים מחדש מהמקור</td></tr>
<tr><td>Kafka topics</td><td>דקות</td><td>שעה</td><td>MirrorMaker 2 / sink ל-S3</td></tr>
<tr><td>K8s manifests</td><td>0</td><td>שעה</td><td>Git (GitOps) + Velero ל-PVs/secrets</td></tr>
<tr><td>Terraform state, secrets, DNS, קונפיג CI</td><td>יומי</td><td>שעות</td><td>bucket עם versioning, snapshots של Vault, export של zones</td></tr>
</table>
<p>דברים שאנשים שוכחים לגבות: <strong>Terraform state</strong>, <strong>מפתחות Vault/KMS</strong>, רשומות ה-<strong>DNS zone</strong>, <strong>קונפיג IdP/SSO</strong>, pipelines של CI/CD וה-secrets שלהם, data ב-SaaS (Jira, Google Workspace, GitHub org), וה-<strong>runbook לשחזור</strong> — שמור במקום שהוא לא המערכת שנפלה.</p>
<p><strong>תרגולי שחזור</strong>: אוטומציה של job שבועי שמשחזר את הגיבוי האחרון לסביבה מבודדת, מריץ checksums/ספירת שורות/smoke tests של האפליקציה, רושם כמה זמן זה לקח (ה-RTO <em>האמיתי</em> שלכם) ומתריע על כשל. Game day מלא של DR פעמיים בשנה.</p>
<p><strong>עלות</strong>: DB של 10 TB, diff יומי ~3%, retention של 30 יום ≈ 4 fulls (40 TB) + 30 diffs (9 TB) ≈ 49 TB גולמי → דחוס ~20 TB → S3 Standard-IA ≈ $250 לחודש; עותקים שנתיים ב-Glacier עולים אגורות. גיבויים זולים; downtime ונתונים שאבדו — לא.</p>`
      }
    }
  ],
  diagram: `prod account                       backup-vault account (separate creds)
 Postgres --WAL stream---------->  S3 bucket (Object Lock, compliance 35d)
    |   \\--nightly full/diff-----^        |
    |                                     +--CRR--> other region (Glacier yearly)
 replica (other AZ) = HA, NOT a backup
 EBS/PV --Velero / AWS Backup---->  vault (vault lock)

 weekly drill: restore -> isolated env -> row counts + smoke tests
               -> record real RTO -> alert on failure`,
  handsOn: [
    { cmd: "pgbackrest --stanza=main info", what: { en: "List backup sets, their sizes and the WAL range you can restore to.", he: "הצגת סטים של גיבוי, הגדלים שלהם וטווח ה-WAL שאליו אפשר לשחזר." } },
    { cmd: "psql -c \"select archived_count, failed_count, last_archived_time, now()-last_archived_time as lag from pg_stat_archiver;\"", what: { en: "Check WAL archiving health — a growing failed_count or a big lag means PITR is broken.", he: "בדיקת בריאות ה-WAL archiving — failed_count שגדל או lag גדול אומר שה-PITR שבור." } },
    { cmd: "aws s3api get-object-lock-configuration --bucket acme-pg-backups", what: { en: "Verify the backup bucket has Object Lock in COMPLIANCE mode with a retention period.", he: "וידוא שב-bucket של הגיבויים יש Object Lock במצב COMPLIANCE עם תקופת retention." } },
    { cmd: "velero backup get && velero restore create --from-backup nightly-20261113020000 --namespace-mappings app:app-drill", what: { en: "Run a Kubernetes restore drill into a separate namespace.", he: "הרצת תרגול שחזור של Kubernetes ל-namespace נפרד." } }
  ],
  mnemonic: {
    en: "\"3-2-1-1-0\": three copies, two media, one off-site, one immutable, zero restore errors. And: \"Nobody wants backups — everybody wants restores.\"",
    he: "\"3-2-1-1-0\": שלושה עותקים, שתי מדיות, אחד מחוץ לאתר, אחד immutable, אפס שגיאות שחזור. וגם: \"אף אחד לא רוצה גיבויים — כולם רוצים שחזורים.\""
  },
  pitfalls: [
    { en: "Treating replicas, RAID or multi-AZ as backups — they faithfully replicate DROP TABLE and ransomware encryption.", he: "להתייחס ל-replicas, RAID או multi-AZ כגיבויים — הם משכפלים בנאמנות DROP TABLE והצפנת ransomware." },
    { en: "Backups in the same account with the same admin credentials — the attacker (or a bad script) deletes them first.", he: "גיבויים באותו account עם אותם credentials של admin — התוקף (או סקריפט גרוע) מוחק אותם ראשונים." },
    { en: "Never testing restores, so the real RTO is unknown and the backup may be corrupt, partial or encrypted with a lost key.", he: "לא לבדוק שחזורים אף פעם, ולכן ה-RTO האמיתי לא ידוע והגיבוי עלול להיות מושחת, חלקי או מוצפן במפתח שאבד." },
    { en: "Forgetting non-database state: Terraform state, secrets, DNS, IdP config, SaaS data.", he: "לשכוח state שהוא לא DB: Terraform state, secrets, DNS, קונפיג IdP, data ב-SaaS." }
  ],
  interview: [
    { q: { en: "Ransomware encrypted production and the attacker had cloud admin. How should your backup design have saved you?", he: "Ransomware הצפין את הפרודקשן והתוקף החזיק cloud admin. איך תכנון הגיבוי היה אמור להציל אתכם?" },
      a: { en: "Backups copied to a separate vault account with separate identities and break-glass access only; S3 Object Lock in compliance mode / vault lock so even root can't delete within retention; encryption keys that also survive (separate KMS, multi-region); retention long enough to predate the intrusion (attackers dwell for weeks); and a practiced restore runbook into a clean environment with rotated credentials. Plus alerts on mass deletion and backup-policy changes.", he: "גיבויים שמועתקים ל-account כספת נפרד עם זהויות נפרדות וגישת break-glass בלבד; S3 Object Lock במצב compliance / vault lock כך שאפילו root לא יכול למחוק בתוך ה-retention; מפתחות הצפנה שגם הם שורדים (KMS נפרד, multi-region); retention ארוך מספיק כדי לכסות את התקופה שלפני החדירה (תוקפים מסתובבים שבועות); ו-runbook שחזור מתורגל לסביבה נקייה עם credentials מסובבים. ובנוסף התראות על מחיקה המונית ועל שינויים ב-backup policy." } },
    { q: { en: "How do you know your backups work?", he: "איך אתם יודעים שהגיבויים עובדים?" },
      a: { en: "Because we restore them automatically and regularly: a scheduled job restores the latest backup (and a random older one) into an isolated environment, validates checksums, row counts against production, schema version and an app smoke test, measures restore duration against the RTO, and pages on failure. Plus monitoring of backup success, WAL archive lag and backup age, and a semi-annual full DR game day.", he: "כי אנחנו משחזרים אותם באופן אוטומטי וקבוע: job מתוזמן משחזר את הגיבוי האחרון (ועוד אחד ישן אקראי) לסביבה מבודדת, מאמת checksums, ספירת שורות מול פרודקשן, גרסת schema ו-smoke test של האפליקציה, מודד את משך השחזור מול ה-RTO, ומעיר מישהו אם נכשל. ובנוסף ניטור של הצלחת הגיבויים, lag של WAL archive וגיל הגיבוי, ו-game day מלא של DR פעמיים בשנה." } }
  ],
  quiz: [
    { q: { en: "Someone ran UPDATE without WHERE at 14:32. Which mechanism lets you recover the state at 14:31:59?", he: "מישהו הריץ UPDATE בלי WHERE ב-14:32. איזה מנגנון מאפשר לשחזר את המצב ב-14:31:59?" },
      options: [ { en: "A synchronous replica", he: "Replica סינכרוני" }, { en: "RAID 10", he: "RAID 10" }, { en: "Base backup + continuous WAL archive (PITR)", he: "Base backup + WAL archive רציף (PITR)" }, { en: "A nightly logical dump", he: "Dump לוגי כל לילה" } ],
      answer: 2, explain: { en: "PITR replays WAL on top of a base backup up to a target timestamp; replicas already applied the bad update.", he: "PITR מריץ WAL מעל base backup עד timestamp יעד; ה-replicas כבר החילו את העדכון הגרוע." } },
    { q: { en: "In 3-2-1-1-0, what is the second '1'?", he: "ב-3-2-1-1-0, מה ה-'1' השני?" },
      options: [ { en: "One full backup per week", he: "גיבוי full אחד בשבוע" }, { en: "One immutable or offline copy", he: "עותק אחד immutable או offline" }, { en: "One restore per year", he: "שחזור אחד בשנה" }, { en: "One region", he: "Region אחד" } ],
      answer: 1, explain: { en: "An immutable/air-gapped copy is the defense against ransomware and admin-credential compromise.", he: "עותק immutable/air-gapped הוא ההגנה מפני ransomware ופריצה ל-credentials של admin." } },
    { q: { en: "Which kind needs the full backup plus EVERY subsequent piece to restore?", he: "איזה סוג צריך את ה-full ועוד כל חלק שאחריו כדי לשחזר?" },
      options: [ { en: "Differential", he: "Differential" }, { en: "Incremental", he: "Incremental" }, { en: "Logical dump", he: "Dump לוגי" }, { en: "Snapshot", he: "Snapshot" } ],
      answer: 1, explain: { en: "Incremental captures changes since the last backup of any kind, so the chain must be complete; differential only needs full + latest diff.", he: "Incremental שומר שינויים מאז הגיבוי האחרון מכל סוג, אז השרשרת חייבת להיות שלמה; differential צריך רק full + ה-diff האחרון." } },
    { q: { en: "What is the best evidence of your real RTO?", he: "מה הראיה הטובה ביותר ל-RTO האמיתי שלכם?" },
      options: [ { en: "The vendor's SLA", he: "ה-SLA של הספק" }, { en: "The backup job duration", he: "משך ה-job של הגיבוי" }, { en: "Measured duration of regular automated restore drills", he: "משך מדוד של תרגולי שחזור אוטומטיים קבועים" }, { en: "The size of the backup", he: "גודל הגיבוי" } ],
      answer: 2, explain: { en: "Only an actual end-to-end restore, including app validation and the traffic switch, measures RTO.", he: "רק שחזור אמיתי מקצה לקצה, כולל ולידציה של האפליקציה והעברת תעבורה, מודד RTO." } }
  ],
  playground: "dr",
  related: ["db-backups", "rel-bcdr", "pr-privacy", "cloud-storage", "staff-postgres-at-scale", "k8s-day2-upgrades"]
});

INFRA.lessons.push({
  id: "pr-privacy",
  track: "principal",
  order: 63,
  icon: "🕵️",
  level: 3,
  minutes: 16,
  title: { en: "Privacy by Design: PII, GDPR, Erasure, Crypto-Shredding", he: "Privacy by Design: PII, GDPR, מחיקה ו-Crypto-Shredding" },
  tldr: {
    en: "Personal data is a liability, not an asset: collect the minimum, know exactly where every field lives, encrypt and tokenize it, keep it only as long as the purpose needs, and design deletion (including logs and backups) on day one.",
    he: "מידע אישי הוא התחייבות, לא נכס: אוספים את המינימום, יודעים בדיוק איפה כל שדה יושב, מצפינים ועושים לו tokenization, שומרים רק כל עוד המטרה דורשת, ומתכננים מחיקה (כולל לוגים וגיבויים) מהיום הראשון."
  },
  analogy: {
    en: "Personal data is like radioactive material in a lab. Useful for a specific purpose, dangerous to hold, regulated by law. You keep a ledger of every gram and every room it's in (data inventory), you only order what the experiment needs (minimization), you store it in lead boxes (encryption) behind badge-controlled doors (access control + audit), and when the half-life is over you dispose of it properly (retention + deletion). Spilling it (a breach) has a mandatory report deadline. A developer who logs full request bodies is someone carrying uranium in his coat pocket.",
    he: "מידע אישי הוא כמו חומר רדיואקטיבי במעבדה. שימושי למטרה ספציפית, מסוכן להחזיק, ומוסדר בחוק. מנהלים פנקס של כל גרם ובאיזה חדר הוא נמצא (data inventory), מזמינים רק מה שהניסוי צריך (minimization), שומרים בקופסאות עופרת (הצפנה) מאחורי דלתות עם תג (בקרת גישה + audit), וכשזמן מחצית החיים נגמר מסלקים אותו כמו שצריך (retention + מחיקה). דליפה (breach) מחייבת דיווח עד מועד קבוע. מפתח שעושה log לכל ה-request body הוא מישהו שמסתובב עם אורניום בכיס המעיל."
  },
  sections: [
    {
      h: { en: "Classify first: what is personal data?", he: "קודם מסווגים: מה זה מידע אישי?" },
      body: {
        en: `<table>
<tr><th>Class</th><th>Examples</th><th>Handling</th></tr>
<tr><td>Public</td><td>marketing pages, public docs</td><td>none special</td></tr>
<tr><td>Internal</td><td>service configs, metrics</td><td>auth required</td></tr>
<tr><td>PII (personal)</td><td>name, email, phone, IP, device ID, cookie ID, location</td><td>encrypt, access-log, retention</td></tr>
<tr><td>Sensitive / special</td><td>ID number (Teudat Zehut), health (PHI), biometrics, religion, sexual orientation, children's data</td><td>field-level encryption, strict need-to-know, DPIA</td></tr>
<tr><td>PCI</td><td>card number (PAN), CVV</td><td>don't store — tokenize via the payment provider</td></tr>
<tr><td>Secrets</td><td>passwords, API keys</td><td>hash (argon2/bcrypt) or vault, never logged</td></tr>
</table>
<p>Under GDPR, <strong>personal data</strong> is anything relating to an identifiable person — including IP addresses, cookie IDs and "anonymous" user IDs that can be joined back. If you can link it to a person with reasonable effort, it's personal.</p>
<p>Build a <strong>data inventory</strong> (record of processing): for every store, which fields, which class, purpose, legal basis, retention, who has access, which vendors receive it. Tag columns in the schema/catalog (e.g. <code>COMMENT ON COLUMN users.phone IS 'pii:contact'</code>, or a data catalog like DataHub/Collibra) so tooling can enforce it.</p>`,
        he: `<table>
<tr><th>סיווג</th><th>דוגמאות</th><th>טיפול</th></tr>
<tr><td>ציבורי</td><td>דפי שיווק, מסמכים ציבוריים</td><td>שום דבר מיוחד</td></tr>
<tr><td>פנימי</td><td>קונפיגים של שירותים, מטריקות</td><td>נדרשת הזדהות</td></tr>
<tr><td>PII (אישי)</td><td>שם, מייל, טלפון, IP, device ID, cookie ID, מיקום</td><td>הצפנה, לוג גישה, retention</td></tr>
<tr><td>רגיש / מיוחד</td><td>תעודת זהות, בריאות (PHI), ביומטריה, דת, נטייה מינית, מידע על ילדים</td><td>הצפנה ברמת שדה, need-to-know קשיח, DPIA</td></tr>
<tr><td>PCI</td><td>מספר כרטיס (PAN), CVV</td><td>לא שומרים — tokenization דרך ספק התשלומים</td></tr>
<tr><td>Secrets</td><td>סיסמאות, API keys</td><td>hash (argon2/bcrypt) או vault, אף פעם לא ב-log</td></tr>
</table>
<p>לפי GDPR, <strong>מידע אישי</strong> הוא כל דבר שקשור לאדם שניתן לזהות — כולל כתובות IP, cookie IDs ו-user IDs "אנונימיים" שאפשר לחבר בחזרה. אם אפשר לקשר את זה לאדם במאמץ סביר, זה אישי.</p>
<p>בונים <strong>data inventory</strong> (רשומת עיבוד): לכל מאגר — אילו שדות, איזה סיווג, מטרה, בסיס חוקי, retention, למי יש גישה, ואילו ספקים מקבלים את זה. מתייגים עמודות ב-schema/catalog (למשל <code>COMMENT ON COLUMN users.phone IS 'pii:contact'</code>, או data catalog כמו DataHub/Collibra) כדי שכלים יוכלו לאכוף.</p>`
      }
    },
    {
      h: { en: "The law in one screen: GDPR, CCPA, Israel's Amendment 13", he: "החוק במסך אחד: GDPR, CCPA ותיקון 13 בישראל" },
      body: {
        en: `<ul>
<li><strong>Principles (GDPR Art. 5)</strong>: lawfulness &amp; transparency, <strong>purpose limitation</strong> (data collected for shipping can't silently become ad targeting), <strong>data minimization</strong>, accuracy, <strong>storage limitation</strong>, integrity &amp; confidentiality, accountability.</li>
<li><strong>Legal bases</strong>: consent, contract, legal obligation, vital interest, public task, legitimate interest. Consent must be freely given, specific, revocable — no pre-ticked boxes.</li>
<li><strong>Data subject rights</strong>: access (export everything about me), rectification, <strong>erasure</strong> ("right to be forgotten"), portability (machine-readable), objection, restriction. Respond within <strong>1 month</strong>.</li>
<li><strong>Breach notification</strong>: to the regulator within <strong>72 hours</strong> of awareness; to affected people "without undue delay" if high risk.</li>
<li><strong>Fines</strong>: up to €20M or 4% of global annual turnover.</li>
<li><strong>CCPA/CPRA (California)</strong>: right to know, delete, opt out of "sale/sharing", "Do Not Sell" link.</li>
<li><strong>Israel — Privacy Protection Law, Amendment 13 (in force Aug 2025)</strong>: broadened definitions closer to GDPR, much larger administrative fines from the Privacy Protection Authority, DPO requirement for certain organizations, plus the existing 2017 Data Security Regulations (security levels, access control, logging, incident reporting).</li>
<li><strong>Data residency / transfers</strong>: EU data leaving the EU needs an adequacy decision (Israel has one) or SCCs; some sectors (health, government, finance) require in-country storage.</li>
</ul>
<blockquote>⚠️ Production tip: This is not legal advice and details change — involve your DPO/legal team. Your job as an engineer is to make compliance <em>possible and cheap</em>: inventory, deletion APIs, audit logs, region pinning.</blockquote>`,
        he: `<ul>
<li><strong>עקרונות (GDPR סעיף 5)</strong>: חוקיות ושקיפות, <strong>צמצום מטרה</strong> (מידע שנאסף למשלוח לא יכול להפוך בשקט לטירגוט פרסומות), <strong>מזעור נתונים</strong>, דיוק, <strong>הגבלת שמירה</strong>, שלמות וסודיות, אחריותיות.</li>
<li><strong>בסיסים חוקיים</strong>: הסכמה, חוזה, חובה חוקית, אינטרס חיוני, משימה ציבורית, אינטרס לגיטימי. הסכמה חייבת להיות חופשית, ספציפית, וניתנת לביטול — בלי תיבות מסומנות מראש.</li>
<li><strong>זכויות נושא המידע</strong>: עיון (ייצוא כל מה שיש עליי), תיקון, <strong>מחיקה</strong> ("הזכות להישכח"), ניידות (פורמט קריא למכונה), התנגדות, הגבלה. עונים תוך <strong>חודש</strong>.</li>
<li><strong>דיווח על דליפה</strong>: לרגולטור תוך <strong>72 שעות</strong> מרגע הידיעה; לאנשים שנפגעו "ללא דיחוי מיותר" אם הסיכון גבוה.</li>
<li><strong>קנסות</strong>: עד 20 מיליון אירו או 4% מהמחזור השנתי העולמי.</li>
<li><strong>CCPA/CPRA (קליפורניה)</strong>: הזכות לדעת, למחוק, ולבחור לא להשתתף ב-"מכירה/שיתוף", לינק "Do Not Sell".</li>
<li><strong>ישראל — חוק הגנת הפרטיות, תיקון 13 (בתוקף מאוגוסט 2025)</strong>: הגדרות רחבות יותר וקרובות ל-GDPR, קנסות מנהליים גבוהים בהרבה מהרשות להגנת הפרטיות, חובת ממונה הגנת פרטיות (DPO) לארגונים מסוימים, ובנוסף תקנות אבטחת מידע מ-2017 שכבר קיימות (רמות אבטחה, בקרת גישה, לוגים, דיווח על אירועים).</li>
<li><strong>Data residency / העברות</strong>: מידע של אירופאים שיוצא מה-EU צריך החלטת adequacy (לישראל יש) או SCCs; סקטורים מסוימים (בריאות, ממשלה, פיננסים) דורשים אחסון בתוך המדינה.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: זה לא ייעוץ משפטי והפרטים משתנים — תערבו את ה-DPO/המחלקה המשפטית. התפקיד שלכם כמהנדסים הוא להפוך compliance ל-<em>אפשרי וזול</em>: inventory, APIs למחיקה, audit logs, נעיצה ל-region.</blockquote>`
      }
    },
    {
      h: { en: "Implementing erasure across DBs, logs, analytics and backups", he: "מימוש מחיקה ב-DBs, לוגים, אנליטיקה וגיבויים" },
      body: {
        en: `<p>"Delete user 42" must reach every copy: primary DB, read replicas, caches, search index, data lake, analytics/CRM vendors, logs, and backups. Pattern: an <strong>erasure workflow</strong> driven by an event.</p>
<pre>POST /privacy/erasure {userId: 42}   -&gt; 202, ticket er-881
  emit UserErasureRequested(42)       (outbox -&gt; Kafka)
  -&gt; users-svc:   delete/anonymize rows, keep orders with
                  user_id=NULL for tax (legal obligation)
  -&gt; search-svc:  delete doc user:42
  -&gt; lake job:    Iceberg DELETE WHERE user_id=42 + expire
                  snapshots + rewrite files
  -&gt; vendors:     call Mixpanel/Segment/Zendesk deletion APIs
  -&gt; kms:         DESTROY per-user data key  (crypto-shred)
  each service acks; orchestrator tracks; SLA 30 days</pre>
<p><strong>Crypto-shredding</strong> solves backups and immutable logs: encrypt each user's sensitive fields with a <strong>per-user data key</strong> (envelope encryption — data key wrapped by a KMS master key). To erase, destroy the key: every copy in every backup becomes unreadable ciphertext, without rewriting a single backup.</p>
<pre>-- per-user key table (keys wrapped by KMS)
user_keys(user_id PK, wrapped_dek BYTEA, destroyed_at)
-- sensitive columns stored encrypted with that DEK
users(id, email_enc BYTEA, phone_enc BYTEA,
      email_hash TEXT)   -- HMAC for lookups / uniqueness</pre>
<blockquote>💡 Real world: Pseudonymize event streams at the source — put a stable random <code>subject_id</code> in events instead of email/phone, and keep the mapping in one service. Erasing the mapping cuts the link for the whole lake.</blockquote>`,
        he: `<p>"תמחק את משתמש 42" חייב להגיע לכל עותק: DB ראשי, read replicas, caches, search index, data lake, ספקי אנליטיקה/CRM, לוגים וגיבויים. התבנית: <strong>erasure workflow</strong> שמונע על ידי event.</p>
<pre>POST /privacy/erasure {userId: 42}   -&gt; 202, ticket er-881
  emit UserErasureRequested(42)       (outbox -&gt; Kafka)
  -&gt; users-svc:   delete/anonymize rows, keep orders with
                  user_id=NULL for tax (legal obligation)
  -&gt; search-svc:  delete doc user:42
  -&gt; lake job:    Iceberg DELETE WHERE user_id=42 + expire
                  snapshots + rewrite files
  -&gt; vendors:     call Mixpanel/Segment/Zendesk deletion APIs
  -&gt; kms:         DESTROY per-user data key  (crypto-shred)
  each service acks; orchestrator tracks; SLA 30 days</pre>
<p><strong>Crypto-shredding</strong> פותר את בעיית הגיבויים והלוגים ה-immutable: מצפינים את השדות הרגישים של כל משתמש עם <strong>data key פר-משתמש</strong> (envelope encryption — ה-data key עטוף במפתח master של KMS). כדי למחוק, משמידים את המפתח: כל עותק בכל גיבוי הופך ל-ciphertext שאי אפשר לקרוא, בלי לשכתב אף גיבוי.</p>
<pre>-- per-user key table (keys wrapped by KMS)
user_keys(user_id PK, wrapped_dek BYTEA, destroyed_at)
-- sensitive columns stored encrypted with that DEK
users(id, email_enc BYTEA, phone_enc BYTEA,
      email_hash TEXT)   -- HMAC for lookups / uniqueness</pre>
<blockquote>💡 מהשטח: עושים pseudonymization ל-event streams כבר במקור — שמים ב-events <code>subject_id</code> אקראי ויציב במקום מייל/טלפון, ושומרים את המיפוי בשירות אחד. מחיקת המיפוי חותכת את הקשר לכל ה-lake.</blockquote>`
      }
    },
    {
      h: { en: "Protecting data: encryption, tokenization, pseudonymization vs anonymization", he: "הגנה על המידע: הצפנה, tokenization, פסאודונימיזציה מול אנונימיזציה" },
      body: {
        en: `<ul>
<li><strong>In transit</strong>: TLS 1.2+/1.3 everywhere, mTLS between services.</li>
<li><strong>At rest</strong>: disk/volume encryption (KMS) — protects against stolen disks, <em>not</em> against an attacker with DB credentials.</li>
<li><strong>Field-level / application-level encryption</strong>: the app encrypts specific columns (ID number, health data) so DBAs, backups and SQL-injection dumps see only ciphertext.</li>
<li><strong>Tokenization</strong>: replace the value with a random token; the real value lives in a hardened vault (Stripe tokens for cards keep you out of most PCI scope).</li>
<li><strong>Pseudonymization</strong>: replace identifiers with keyed hashes or IDs — still personal data under GDPR because it's reversible with the key/mapping.</li>
<li><strong>Anonymization</strong>: irreversible — then GDPR no longer applies. Much harder than it looks.</li>
</ul>
<p>Re-identification is easy: Latanya Sweeney showed that <strong>ZIP code + birth date + gender</strong> uniquely identifies ~87% of Americans; the Netflix Prize "anonymous" ratings were de-anonymized by joining with IMDb reviews; AOL's search logs exposed users by their queries. Techniques: <strong>k-anonymity</strong> (every record indistinguishable from ≥ k−1 others — generalize age to ranges, ZIP to 3 digits), <strong>differential privacy</strong> (add calibrated noise to aggregates — used by Apple, the US Census).</p>
<pre># Redact PII before it reaches logs (Python logging filter)
import logging, re
EMAIL = re.compile(r"[\\w.+-]+@[\\w-]+\\.[\\w.]+")
PHONE = re.compile(r"\\+?\\d[\\d -]{7,}\\d")
class Redact(logging.Filter):
    def filter(self, rec):
        msg = str(rec.msg)
        msg = EMAIL.sub("[email]", msg)
        rec.msg = PHONE.sub("[phone]", msg)
        return True
logging.getLogger().addFilter(Redact())</pre>
<blockquote>⚠️ Production tip: Logs are the #1 PII leak — request bodies, headers with tokens, SQL with parameters, exception messages with emails. Log IDs, not values; allow-list fields in structured logs; set log retention (e.g. 30 days) shorter than DB retention.</blockquote>`,
        he: `<ul>
<li><strong>בתעבורה</strong>: TLS 1.2+/1.3 בכל מקום, mTLS בין שירותים.</li>
<li><strong>במנוחה</strong>: הצפנת דיסק/volume (KMS) — מגינה מפני דיסקים גנובים, <em>לא</em> מפני תוקף עם credentials של ה-DB.</li>
<li><strong>הצפנה ברמת שדה / אפליקציה</strong>: האפליקציה מצפינה עמודות ספציפיות (ת"ז, מידע רפואי), כך ש-DBAs, גיבויים ו-dumps של SQL injection רואים רק ciphertext.</li>
<li><strong>Tokenization</strong>: מחליפים את הערך ב-token אקראי; הערך האמיתי יושב ב-vault מוקשח (tokens של Stripe לכרטיסים מוציאים אתכם מרוב ה-scope של PCI).</li>
<li><strong>Pseudonymization</strong>: מחליפים מזהים ב-hashes עם מפתח או ב-IDs — עדיין מידע אישי לפי GDPR כי זה הפיך עם המפתח/המיפוי.</li>
<li><strong>Anonymization</strong>: בלתי הפיך — ואז GDPR כבר לא חל. הרבה יותר קשה ממה שזה נראה.</li>
</ul>
<p>זיהוי מחדש קל: Latanya Sweeney הראתה ש-<strong>מיקוד + תאריך לידה + מגדר</strong> מזהים באופן ייחודי ~87% מהאמריקאים; הדירוגים ה"אנונימיים" של Netflix Prize זוהו מחדש בחיבור לביקורות ב-IMDb; לוגי החיפוש של AOL חשפו משתמשים לפי השאילתות שלהם. טכניקות: <strong>k-anonymity</strong> (כל רשומה לא ניתנת להבחנה מלפחות k−1 אחרות — מכלילים גיל לטווחים, מיקוד ל-3 ספרות), <strong>differential privacy</strong> (מוסיפים רעש מכויל לאגרגציות — Apple ומפקד האוכלוסין האמריקאי משתמשים בזה).</p>
<pre># Redact PII before it reaches logs (Python logging filter)
import logging, re
EMAIL = re.compile(r"[\\w.+-]+@[\\w-]+\\.[\\w.]+")
PHONE = re.compile(r"\\+?\\d[\\d -]{7,}\\d")
class Redact(logging.Filter):
    def filter(self, rec):
        msg = str(rec.msg)
        msg = EMAIL.sub("[email]", msg)
        rec.msg = PHONE.sub("[phone]", msg)
        return True
logging.getLogger().addFilter(Redact())</pre>
<blockquote>⚠️ טיפ לפרודקשן: לוגים הם מקור דליפת ה-PII מספר 1 — request bodies, headers עם tokens, SQL עם פרמטרים, הודעות exception עם מיילים. עושים log ל-IDs, לא לערכים; allow-list של שדות ב-structured logs; retention של לוגים (למשל 30 יום) קצר יותר מה-retention של ה-DB.</blockquote>`
      }
    },
    {
      h: { en: "Privacy by design checklist for a new system", he: "צ'קליסט Privacy by Design למערכת חדשה" },
      body: {
        en: `<ol>
<li><strong>DPIA</strong> (Data Protection Impact Assessment) for anything sensitive, large-scale or new tech (face recognition, profiling, children).</li>
<li>Minimize: do we need birth date, or just "over 18"? Full address, or city? Store the minimum, derive the rest.</li>
<li>Inventory and tag every PII field; block new PII columns in CI without a classification tag.</li>
<li>Retention per data type, enforced by jobs (TTL indexes, partition drops, S3 lifecycle) — not by policy documents.</li>
<li>Access: least privilege, just-in-time access to prod data, <strong>audit log of who read which record</strong> (and alerts on bulk reads).</li>
<li>Deletion and export APIs built and tested end-to-end, including vendors and crypto-shredding for backups.</li>
<li>Non-prod uses synthetic or masked data — never a raw production dump on a laptop.</li>
<li>Vendors: DPA signed, list of sub-processors, region of processing, deletion on termination.</li>
<li>Region pinning: EU users' data in EU regions if required; know your cross-border flows.</li>
<li>Breach runbook: who decides, how to scope (audit logs!), the 72-hour clock, communication templates.</li>
</ol>
<blockquote>💡 Real world: Most fines are not for sophisticated hacks — they're for keeping data too long, unsecured S3 buckets, missing consent and ignoring access/erasure requests. Boring hygiene is the whole game.</blockquote>`,
        he: `<ol>
<li><strong>DPIA</strong> (הערכת השפעה על פרטיות) לכל דבר רגיש, בהיקף גדול או טכנולוגיה חדשה (זיהוי פנים, פרופיילינג, ילדים).</li>
<li>מזעור: צריך תאריך לידה, או רק "מעל 18"? כתובת מלאה, או עיר? שומרים את המינימום וגוזרים את השאר.</li>
<li>Inventory ותיוג של כל שדה PII; חוסמים ב-CI עמודות PII חדשות בלי תגית סיווג.</li>
<li>Retention לכל סוג מידע, נאכף על ידי jobs (TTL indexes, הורדת partitions, S3 lifecycle) — לא על ידי מסמכי מדיניות.</li>
<li>גישה: least privilege, גישת just-in-time ל-data של פרודקשן, <strong>audit log של מי קרא איזו רשומה</strong> (והתראות על קריאות המוניות).</li>
<li>APIs למחיקה וייצוא שנבנו ונבדקו מקצה לקצה, כולל ספקים ו-crypto-shredding לגיבויים.</li>
<li>סביבות שאינן פרודקשן משתמשות ב-data סינתטי או ממוסך — אף פעם לא dump גולמי של פרודקשן על לפטופ.</li>
<li>ספקים: DPA חתום, רשימת sub-processors, region של העיבוד, מחיקה בסיום ההתקשרות.</li>
<li>נעיצה ל-region: data של משתמשי EU ב-regions של EU אם נדרש; להכיר את הזרימות חוצות הגבולות.</li>
<li>Runbook לדליפה: מי מחליט, איך קובעים היקף (audit logs!), שעון ה-72 שעות, תבניות תקשורת.</li>
</ol>
<blockquote>💡 מהשטח: רוב הקנסות הם לא על פריצות מתוחכמות — הם על שמירת מידע יותר מדי זמן, buckets פתוחים ב-S3, חוסר הסכמה והתעלמות מבקשות עיון/מחיקה. היגיינה משעממת היא כל הסיפור.</blockquote>`
      }
    }
  ],
  diagram: `collect (minimize) -> classify/tag -> store (encrypt, tokenize, region)
     -> use (purpose-bound, least privilege, audit log)
     -> share (DPA vendors, pseudonymized events)
     -> retain (TTL, lifecycle) -> delete (erasure workflow + crypto-shred)

 user 42 data key (KMS-wrapped) --encrypts--> DB rows, lake files, backups
 destroy key  ==>  every copy everywhere = unreadable ciphertext`,
  handsOn: [
    { cmd: "grep -rEn '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}' /var/log/app/ | head", what: { en: "Hunt for email addresses leaking into your application logs.", he: "חיפוש כתובות מייל שדולפות ללוגים של האפליקציה." } },
    { cmd: "psql -c \"select table_name, column_name from information_schema.columns where column_name ~* '(email|phone|ssn|id_number|birth|address|ip)'\"", what: { en: "First pass of a data inventory: find columns that probably hold PII.", he: "מעבר ראשון של data inventory: למצוא עמודות שכנראה מחזיקות PII." } },
    { cmd: "aws kms schedule-key-deletion --key-id alias/user-42-dek --pending-window-in-days 7", what: { en: "Crypto-shredding with KMS (illustrative — at scale you destroy wrapped per-user DEKs in your own table, not one KMS key per user).", he: "Crypto-shredding עם KMS (להמחשה — בסקייל משמידים DEKs עטופים פר-משתמש בטבלה שלכם, לא מפתח KMS לכל משתמש)." } },
    { cmd: "aws s3api get-public-access-block --bucket my-user-uploads", what: { en: "Verify public access is blocked on buckets holding personal data — the most common breach cause.", he: "וידוא שגישה ציבורית חסומה ב-buckets שמחזיקים מידע אישי — הגורם הנפוץ ביותר לדליפות." } }
  ],
  mnemonic: {
    en: "\"Collect less, know where, lock it, log access, let it die.\" And: if you can't delete it, you shouldn't have stored it.",
    he: "\"אוספים פחות, יודעים איפה, נועלים, רושמים גישה, נותנים לזה למות.\" וגם: אם אי אפשר למחוק את זה, לא היה צריך לשמור את זה."
  },
  pitfalls: [
    { en: "Logging full request bodies, headers or SQL parameters — PII and tokens end up in a log system with broad access and long retention.", he: "לעשות log ל-request bodies מלאים, headers או פרמטרים של SQL — PII ו-tokens נוחתים במערכת לוגים עם גישה רחבה ו-retention ארוך." },
    { en: "Calling hashed emails 'anonymous' — an unsalted SHA-256 of an email is reversible by hashing a list of known emails.", he: "לקרוא למיילים שעברו hash 'אנונימיים' — SHA-256 בלי salt של מייל הפיך פשוט על ידי hash לרשימת מיילים ידועים." },
    { en: "Implementing 'delete' only in the primary DB, forgetting search indexes, caches, the lake, vendors and backups.", he: "לממש 'מחיקה' רק ב-DB הראשי, ולשכוח search indexes, caches, ה-lake, ספקים וגיבויים." },
    { en: "Copying production data to dev/staging or laptops for debugging.", he: "להעתיק data של פרודקשן ל-dev/staging או ללפטופים בשביל דיבאג." }
  ],
  interview: [
    { q: { en: "How do you honor a GDPR erasure request when you have 35 days of immutable backups?", he: "איך מכבדים בקשת מחיקה לפי GDPR כשיש 35 יום של גיבויים immutable?" },
      a: { en: "Two accepted approaches. (1) Crypto-shredding: sensitive fields are encrypted with a per-user data key; destroying the key makes every backup copy unreadable for that user immediately. (2) Documented process: backups are kept out of active use, expire within the stated retention, and if a restore happens, the erasure log is replayed before the data goes live. In both cases the live systems, indexes, lake and vendors are erased via an event-driven workflow with tracking and an SLA.", he: "שתי גישות מקובלות. (1) Crypto-shredding: השדות הרגישים מוצפנים עם data key פר-משתמש; השמדת המפתח הופכת כל עותק בגיבוי לבלתי קריא עבור המשתמש הזה מיד. (2) תהליך מתועד: גיבויים לא בשימוש פעיל, פגים בתוך ה-retention המוצהר, ואם קורה שחזור — מריצים מחדש את ה-erasure log לפני שה-data עולה לאוויר. בשני המקרים המערכות החיות, האינדקסים, ה-lake והספקים נמחקים דרך workflow מונחה events עם מעקב ו-SLA." } },
    { q: { en: "Product wants to share 'anonymized' user data with a partner for analytics. What do you check?", he: "המוצר רוצה לשתף data 'אנונימי' של משתמשים עם שותף לאנליטיקה. מה אתם בודקים?" },
      a: { en: "Whether it's truly anonymous or just pseudonymous: remove direct identifiers, then look at quasi-identifiers (ZIP, birth date, gender, rare attributes, precise location/time) that allow joins; apply k-anonymity/generalization or share only aggregates with differential privacy and minimum group sizes. Plus a legal basis and DPA, purpose limitation in the contract, DPIA if large-scale, and prefer giving the partner query access to aggregates over shipping row-level data.", he: "האם זה באמת אנונימי או רק פסאודונימי: מסירים מזהים ישירים, ואז בודקים quasi-identifiers (מיקוד, תאריך לידה, מגדר, תכונות נדירות, מיקום/זמן מדויקים) שמאפשרים joins; מפעילים k-anonymity/הכללה או משתפים רק אגרגציות עם differential privacy וגדלי קבוצה מינימליים. ובנוסף בסיס חוקי ו-DPA, הגבלת מטרה בחוזה, DPIA אם זה בהיקף גדול, ועדיף לתת לשותף גישת שאילתות לאגרגציות על פני שליחת data ברמת שורה." } }
  ],
  quiz: [
    { q: { en: "Under GDPR, is an IP address personal data?", he: "לפי GDPR, האם כתובת IP היא מידע אישי?" },
      options: [ { en: "Never", he: "אף פעם" }, { en: "Generally yes — it can identify a person when combined with other data", he: "בדרך כלל כן — היא יכולה לזהות אדם בשילוב עם מידע אחר" }, { en: "Only IPv6", he: "רק IPv6" }, { en: "Only if stored for more than a year", he: "רק אם נשמרת יותר משנה" } ],
      answer: 1, explain: { en: "Online identifiers like IPs and cookie IDs are listed as personal data when they relate to an identifiable person.", he: "מזהים מקוונים כמו IP ו-cookie IDs נחשבים מידע אישי כשהם מתייחסים לאדם שניתן לזהות." } },
    { q: { en: "What is crypto-shredding?", he: "מה זה crypto-shredding?" },
      options: [ { en: "Overwriting disks 7 times", he: "דריסת דיסקים 7 פעמים" }, { en: "Destroying the per-user encryption key so all copies of their data become unreadable", he: "השמדת מפתח ההצפנה פר-משתמש כך שכל העותקים של המידע שלו הופכים לבלתי קריאים" }, { en: "Compressing backups", he: "דחיסת גיבויים" }, { en: "Hashing passwords", he: "Hash לסיסמאות" } ],
      answer: 1, explain: { en: "It deletes logically everywhere at once — including immutable backups — by removing the ability to decrypt.", he: "זה מוחק לוגית בכל מקום בבת אחת — כולל גיבויים immutable — על ידי ביטול היכולת לפענח." } },
    { q: { en: "How long do you have to notify the regulator of a personal data breach under GDPR?", he: "כמה זמן יש להודיע לרגולטור על דליפת מידע אישי לפי GDPR?" },
      options: [ { en: "24 hours", he: "24 שעות" }, { en: "72 hours from becoming aware", he: "72 שעות מרגע הידיעה" }, { en: "30 days", he: "30 יום" }, { en: "Only if data was sold", he: "רק אם המידע נמכר" } ],
      answer: 1, explain: { en: "72 hours — which is why breach runbooks and audit logs must exist before the incident.", he: "72 שעות — ולכן runbooks לדליפה ו-audit logs חייבים להתקיים לפני האירוע." } },
    { q: { en: "Replacing emails with a keyed HMAC in your analytics events is…", he: "החלפת מיילים ב-HMAC עם מפתח ב-events של האנליטיקה היא…" },
      options: [ { en: "Anonymization — GDPR no longer applies", he: "אנונימיזציה — GDPR כבר לא חל" }, { en: "Pseudonymization — still personal data, but lower risk", he: "פסאודונימיזציה — עדיין מידע אישי, אבל בסיכון נמוך יותר" }, { en: "Encryption at rest", he: "הצפנה במנוחה" }, { en: "Tokenization by the card network", he: "Tokenization על ידי רשת הכרטיסים" } ],
      answer: 1, explain: { en: "Whoever holds the key can re-link it, so it remains personal data — a good safeguard, not an exemption.", he: "מי שמחזיק את המפתח יכול לקשר מחדש, אז זה נשאר מידע אישי — אמצעי הגנה טוב, לא פטור." } }
  ],
  related: ["pr-backups-strategy", "cloud-iam-security", "staff-zero-trust-secrets", "obs-logs", "pr-observability-plan", "pr-architect-questions"]
});

INFRA.glossary.push(
  { term: "Event loop (Node.js)", track: "principal", def: { en: "Node's single-threaded scheduler that runs callbacks; great for IO concurrency, blocked by CPU-heavy work.", he: "ה-scheduler החד-thread של Node שמריץ callbacks; מעולה למקביליות IO, נחסם על ידי עבודת CPU כבדה." }, lesson: "pr-platforms" },
  { term: "Virtual threads", track: "principal", def: { en: "Java 21 lightweight threads multiplexed onto OS threads, so blocking-style code scales to huge concurrency.", he: "Threads קלים ב-Java 21 שממופים על OS threads, כך שקוד בסגנון blocking מגיע למקביליות עצומה." }, lesson: "pr-platforms" },
  { term: "HDFS", track: "principal", def: { en: "Hadoop's distributed file system: 128 MB blocks replicated 3× across DataNodes, metadata in the NameNode.", he: "מערכת הקבצים המבוזרת של Hadoop: בלוקים של 128 MB משוכפלים פי 3 בין DataNodes, metadata ב-NameNode." }, lesson: "pr-big-data" },
  { term: "MapReduce", track: "principal", def: { en: "Batch model: map emits key/values, shuffle groups by key, reduce aggregates each key — every stage on disk.", he: "מודל batch: map פולט key/value, shuffle מקבץ לפי key, reduce מסכם כל key — כל שלב על דיסק." }, lesson: "pr-big-data" },
  { term: "Watermark", track: "principal", def: { en: "A stream processor's estimate that all events up to time T have arrived, allowing event-time windows to close.", he: "הערכה של מעבד stream שכל ה-events עד זמן T הגיעו, מה שמאפשר לסגור חלונות event-time." }, lesson: "pr-big-data" },
  { term: "Lakehouse", track: "principal", def: { en: "Data lake files (Parquet on object storage) plus a table format (Iceberg/Delta) giving ACID, time travel and schema evolution.", he: "קבצי data lake (Parquet על object storage) ועוד table format (Iceberg/Delta) שנותן ACID, time travel ו-schema evolution." }, lesson: "pr-big-data" },
  { term: "3-2-1-1-0", track: "principal", def: { en: "Backup rule: 3 copies, 2 media, 1 off-site, 1 immutable/offline, 0 errors in verified restores.", he: "כלל גיבוי: 3 עותקים, 2 מדיות, 1 מחוץ לאתר, 1 immutable/offline, 0 שגיאות בשחזורים מאומתים." }, lesson: "pr-backups-strategy" },
  { term: "Object Lock (WORM)", track: "principal", def: { en: "Storage setting that prevents deleting or overwriting objects until a retention date — the main ransomware defense for backups.", he: "הגדרת אחסון שמונעת מחיקה או דריסה של אובייקטים עד תאריך retention — ההגנה המרכזית של גיבויים מפני ransomware." }, lesson: "pr-backups-strategy" },
  { term: "Crypto-shredding", track: "principal", def: { en: "Erasing data by destroying the key that encrypts it, making every copy (including backups) unreadable.", he: "מחיקת מידע על ידי השמדת המפתח שמצפין אותו, כך שכל עותק (כולל גיבויים) הופך לבלתי קריא." }, lesson: "pr-privacy" },
  { term: "Pseudonymization", track: "principal", def: { en: "Replacing identifiers with tokens/keyed hashes; reversible with the key, so still personal data under GDPR.", he: "החלפת מזהים ב-tokens או hashes עם מפתח; הפיך עם המפתח, ולכן עדיין מידע אישי לפי GDPR." }, lesson: "pr-privacy" }
);
