window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.designs = window.INFRA.designs || [];

/* ------------------------------------------------------------------ */
/* 1. The framework itself                                             */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-framework", icon: "🧭", level: 1,
  title: {
    en: "How to answer any system design question",
    he: "איך עונים על כל שאלת System Design"
  },
  prompt: {
    en: "\"You have 45 minutes. Design X.\" — Before any specific product, learn the repeatable process strong candidates use: clarify → requirements → estimates → API → data model → high-level design → deep dives → wrap-up.",
    he: "\"יש לך 45 דקות. תתכנן את X.\" — לפני כל מוצר ספציפי, תלמד את התהליך שחוזר על עצמו אצל מועמדים חזקים: הבהרה → דרישות → הערכות → API → מודל נתונים → High-level design → Deep dives → סיכום."
  },
  clarify: [
    { en: "Who are the users and what is the core use case? (\"Is this consumer-facing or internal? Mobile, web, or both?\") — scope it to 2-3 features you will actually design.",
      he: "מי המשתמשים ומה ה-use case המרכזי? (\"זה מוצר לצרכנים או כלי פנימי? מובייל, web או שניהם?\") — תצמצם ל-2-3 פיצ'רים שאתה באמת הולך לתכנן." },
    { en: "What scale? DAU, requests per user per day, data size per item, growth over 5 years. If the interviewer says \"you decide\", state a number out loud and write it down.",
      he: "באיזה scale מדובר? DAU, כמה בקשות למשתמש ביום, גודל כל פריט, צמיחה ל-5 שנים. אם המראיין אומר \"תחליט אתה\" — תגיד מספר בקול ותכתוב אותו על הלוח." },
    { en: "Read-heavy or write-heavy? What is the read:write ratio? This single answer drives caching, replication and storage choices.",
      he: "המערכת read-heavy או write-heavy? מה היחס בין קריאות לכתיבות? התשובה הזאת לבד קובעת החלטות על caching, replication ואחסון." },
    { en: "Consistency vs availability: is it OK if a user sees stale data for a few seconds? Is losing a write ever acceptable?",
      he: "Consistency מול availability: זה בסדר שמשתמש יראה מידע לא עדכני לכמה שניות? מותר אי פעם לאבד כתיבה?" },
    { en: "Latency and availability targets: e.g. p99 &lt; 200 ms, 99.9% vs 99.99% — and single region or global?",
      he: "יעדי latency ו-availability: למשל p99 &lt; 200ms, ‏99.9% מול 99.99% — ואזור אחד או גלובלי?" },
    { en: "What is explicitly out of scope? (auth, billing, analytics, admin UI) — saying it out loud saves 10 minutes.",
      he: "מה במפורש מחוץ ל-scope? (auth, billing, analytics, ממשק admin) — להגיד את זה בקול חוסך 10 דקות." }
  ],
  functional: [
    { en: "Write 3-5 bullet user stories: \"User can X\". Get the interviewer to nod before moving on.",
      he: "תכתוב 3-5 user stories קצרים: \"משתמש יכול X\". תקבל הנהון מהמראיין לפני שממשיכים." },
    { en: "Mark which ones you will design deeply and which are \"nice to have\" you will only mention.",
      he: "תסמן אילו מהם תתכנן לעומק ואילו הם nice-to-have שרק תזכיר." },
    { en: "Prefer verbs that map to API calls (create, get, list, update, subscribe) — the API section then writes itself.",
      he: "תעדיף פעלים שמתורגמים ישר ל-API calls ‏(create, get, list, update, subscribe) — ככה חלק ה-API כותב את עצמו." }
  ],
  nonFunctional: [
    { en: "Scale: concrete numbers (100M DAU, 10K writes/s) — never \"a lot\".",
      he: "Scale: מספרים קונקרטיים (100M DAU, ‏10K writes/s) — אף פעם לא \"הרבה\"." },
    { en: "Latency: name a percentile (p50/p99), not an average.",
      he: "Latency: תנקוב באחוזון (p50/p99), לא בממוצע." },
    { en: "Availability: nines translate to downtime — 99.9% ≈ 43 min/month, 99.99% ≈ 4.3 min/month.",
      he: "Availability: ה-nines מתורגמים ל-downtime — ‏99.9% ≈ 43 דקות בחודש, 99.99% ≈ 4.3 דקות בחודש." },
    { en: "Consistency model per data type: strong for money/inventory, eventual for likes/feeds/counters.",
      he: "מודל consistency לכל סוג מידע: strong לכסף ומלאי, eventual ללייקים, פידים ו-counters." },
    { en: "Durability, security/privacy, and cost — mention them; seniors are expected to.",
      he: "Durability, אבטחה/פרטיות ועלות — תזכיר אותם; ממועמדים בכירים מצפים לזה." }
  ],
  estimates: {
    en: `<p><strong>Estimation cheat sheet</strong> — memorize these, then round aggressively. The goal is the right order of magnitude, not precision.</p>
<table>
<tr><th>Powers of 2</th><th>≈</th><th>Name</th></tr>
<tr><td>2^10</td><td>1 thousand</td><td>1 KB</td></tr>
<tr><td>2^20</td><td>1 million</td><td>1 MB</td></tr>
<tr><td>2^30</td><td>1 billion</td><td>1 GB</td></tr>
<tr><td>2^40</td><td>1 trillion</td><td>1 TB</td></tr>
<tr><td>2^50</td><td>1 quadrillion</td><td>1 PB</td></tr>
</table>
<ul>
<li><strong>Seconds per day</strong> = 86,400 ≈ <strong>10^5</strong>. Seconds per month ≈ 2.5 × 10^6. Seconds per year ≈ 3 × 10^7.</li>
<li><strong>QPS from DAU</strong>: 1M requests/day ≈ 12 QPS. So 100M DAU × 10 req/day = 10^9 / 10^5 = <strong>10K QPS average</strong>; peak ≈ 2-3× average → ~25K QPS.</li>
<li><strong>Storage</strong>: items/day × size × retention. 10M writes/day × 1 KB = 10 GB/day → × 365 × 5 ≈ 18 TB in 5 years (× 3 replicas ≈ 55 TB).</li>
<li><strong>Bandwidth</strong>: QPS × payload. 10K QPS × 100 KB = 1 GB/s ≈ 8 Gbps egress.</li>
</ul>
<table>
<tr><th>Typical throughput (one box, rough)</th><th>Order of magnitude</th></tr>
<tr><td>Stateless web/API server (Go/Java, simple logic)</td><td>1K-10K QPS</td></tr>
<tr><td>Postgres/MySQL single primary</td><td>~5K-10K simple writes/s, 10K-50K indexed reads/s</td></tr>
<tr><td>Redis single node</td><td>~100K ops/s</td></tr>
<tr><td>Kafka broker</td><td>~100 MB/s+ per broker, millions msgs/s per cluster</td></tr>
<tr><td>Cassandra node</td><td>~10K-20K writes/s</td></tr>
</table>
<table>
<tr><th>Latency numbers</th><th>Approx.</th></tr>
<tr><td>L1 cache / main memory reference</td><td>1 ns / 100 ns</td></tr>
<tr><td>Read 1 MB sequentially from RAM</td><td>~10 µs (modern: even less)</td></tr>
<tr><td>SSD random read</td><td>~100 µs</td></tr>
<tr><td>Round trip within a datacenter / AZ</td><td>~0.5 ms</td></tr>
<tr><td>Read 1 MB sequentially from SSD</td><td>~1 ms</td></tr>
<tr><td>HDD seek</td><td>~10 ms</td></tr>
<tr><td>Cross-region round trip (US East ↔ West)</td><td>~60-80 ms</td></tr>
<tr><td>Transatlantic round trip</td><td>~80-150 ms</td></tr>
</table>
<blockquote>💡 Say the arithmetic out loud: "100M DAU, 10 requests each, that's 10^9 a day, divided by 10^5 seconds, 10K QPS, peak 30K — so one DB won't do writes at that rate, we need caching or sharding." The conclusion is what gets graded.</blockquote>`,
    he: `<p><strong>דף עזר להערכות</strong> — תשנן את זה ואז תעגל באגרסיביות. המטרה היא סדר הגודל הנכון, לא דיוק.</p>
<table>
<tr><th>חזקות של 2</th><th>≈</th><th>שם</th></tr>
<tr><td>2^10</td><td>אלף</td><td>1 KB</td></tr>
<tr><td>2^20</td><td>מיליון</td><td>1 MB</td></tr>
<tr><td>2^30</td><td>מיליארד</td><td>1 GB</td></tr>
<tr><td>2^40</td><td>טריליון</td><td>1 TB</td></tr>
<tr><td>2^50</td><td>קוודריליון</td><td>1 PB</td></tr>
</table>
<ul>
<li><strong>שניות ביום</strong> = 86,400 ≈ <strong>10^5</strong>. שניות בחודש ≈ 2.5 × 10^6. שניות בשנה ≈ 3 × 10^7.</li>
<li><strong>QPS מ-DAU</strong>: מיליון בקשות ביום ≈ 12 QPS. אז 100M DAU × 10 בקשות ביום = 10^9 / 10^5 = <strong>10K QPS בממוצע</strong>; peak ≈ פי 2-3 → בערך 25K QPS.</li>
<li><strong>אחסון</strong>: פריטים ליום × גודל × retention. ‏10M כתיבות ביום × 1KB = ‏10GB ביום → × 365 × 5 ≈ 18TB ב-5 שנים (× 3 replicas ≈ 55TB).</li>
<li><strong>Bandwidth</strong>: QPS × גודל payload. ‏10K QPS × 100KB = ‏1GB/s ≈ 8Gbps של egress.</li>
</ul>
<table>
<tr><th>Throughput טיפוסי (שרת אחד, בערך)</th><th>סדר גודל</th></tr>
<tr><td>שרת web/API stateless ‏(Go/Java, לוגיקה פשוטה)</td><td>1K-10K QPS</td></tr>
<tr><td>Postgres/MySQL עם primary יחיד</td><td>~5K-10K כתיבות פשוטות לשנייה, 10K-50K קריאות עם אינדקס</td></tr>
<tr><td>Redis node יחיד</td><td>~100K ops/s</td></tr>
<tr><td>Kafka broker</td><td>~100MB/s ומעלה ל-broker, מיליוני הודעות לשנייה ל-cluster</td></tr>
<tr><td>Cassandra node</td><td>~10K-20K writes/s</td></tr>
</table>
<table>
<tr><th>מספרי latency</th><th>בערך</th></tr>
<tr><td>L1 cache / גישה ל-RAM</td><td>1ns / 100ns</td></tr>
<tr><td>קריאת 1MB רציף מ-RAM</td><td>~10µs (היום אפילו פחות)</td></tr>
<tr><td>קריאה רנדומלית מ-SSD</td><td>~100µs</td></tr>
<tr><td>Round trip בתוך datacenter / AZ</td><td>~0.5ms</td></tr>
<tr><td>קריאת 1MB רציף מ-SSD</td><td>~1ms</td></tr>
<tr><td>Seek בדיסק HDD</td><td>~10ms</td></tr>
<tr><td>Round trip בין regions ‏(US East ↔ West)</td><td>~60-80ms</td></tr>
<tr><td>Round trip טרנס-אטלנטי</td><td>~80-150ms</td></tr>
</table>
<blockquote>💡 תגיד את החשבון בקול: "100M DAU, עשר בקשות כל אחד, זה 10^9 ביום, חלקי 10^5 שניות, 10K QPS, ב-peak ‏30K — אז DB אחד לא יחזיק את הכתיבות, צריך caching או sharding." המסקנה היא מה שמקבל ציון.</blockquote>`
  },
  api: `The framework's "API" = the 45-minute timing plan:

 0-5   min  Clarify scope, users, scale, constraints
 5-10  min  Functional + non-functional requirements (write them down)
10-15  min  Back-of-envelope: QPS (avg+peak), storage, bandwidth
15-20  min  API (REST/gRPC endpoints) + data model
20-30  min  High-level diagram, walk one request end-to-end
30-40  min  Deep dives (2-3) — interviewer usually picks one
40-45  min  Wrap-up: bottlenecks, trade-offs, monitoring, what's next

API template to write on the board:
  POST /v1/{resource}            -> 201 {id}
  GET  /v1/{resource}/{id}       -> 200 {...}
  GET  /v1/{resource}?cursor=..  -> 200 {items[], next_cursor}
  Headers: Authorization, Idempotency-Key (for writes)`,
  dataModel: `Pick storage per access pattern, not per habit:

  Need joins / transactions / strong consistency -> Postgres/MySQL
  Huge write volume, key-based access, time-series -> Cassandra / DynamoDB
  Hot key-value, counters, sessions, rate limits   -> Redis
  Blobs (images, video, logs archive)              -> S3 / GCS + CDN
  Full-text search                                  -> Elasticsearch / OpenSearch
  Async work / decoupling / replay                  -> Kafka / SQS / RabbitMQ

For each table write: name(PK, key fields, index) + "access pattern: get by X, list by Y sorted by Z"`,
  diagram: `   The canonical skeleton (start here, then specialize):

   Client (web/mobile)
        |
        v
   DNS -> CDN (static, media)
        |
        v
   Load Balancer (L7)  /  API Gateway (auth, rate limit)
        |
        v
   +-----------------------+        +------------------+
   | Stateless app servers | -----> |  Cache (Redis)   |
   | (autoscaled)          |        +------------------+
   +-----------------------+
        |            |
        |            +-----> Queue (Kafka/SQS) ---> Workers
        v                                              |
   +-----------------+                                 v
   | Primary DB      | --replication--> Read replicas  Object storage (S3)
   | (sharded later) |
   +-----------------+

   Cross-cutting: metrics, logs, traces, alerts (SLOs)`,
  deepDives: [
    {
      h: { en: "What interviewers actually grade", he: "על מה המראיינים באמת נותנים ציון" },
      body: {
        en: `<p>Most companies use a rubric with roughly four axes. Knowing it lets you "show your work" on each one.</p>
<table>
<tr><th>Axis</th><th>What a strong signal looks like</th></tr>
<tr><td>Problem navigation</td><td>Asks clarifying questions, scopes down, drives the conversation without waiting to be led.</td></tr>
<tr><td>Solution design</td><td>A working end-to-end design first, then improvements. Components justified by requirements.</td></tr>
<tr><td>Technical depth</td><td>Can go deep on at least one area: DB internals, caching invalidation, consistency, queues semantics.</td></tr>
<tr><td>Trade-offs &amp; communication</td><td>Names alternatives and why one was chosen; numbers back claims; checks in with the interviewer.</td></tr>
</table>
<p>For senior/staff levels the bar adds: operational thinking (deploys, monitoring, failure modes, cost) and recognizing what <em>not</em> to build.</p>
<blockquote>💡 Every component you draw should answer "which requirement forced this?" If you cannot answer, erase it.</blockquote>`,
        he: `<p>רוב החברות עובדות עם rubric של בערך ארבעה צירים. כשמכירים אותו, אפשר "להראות עבודה" בכל אחד מהם.</p>
<table>
<tr><th>ציר</th><th>איך נראה סיגנל חזק</th></tr>
<tr><td>ניווט בבעיה</td><td>שואל שאלות הבהרה, מצמצם scope, מוביל את השיחה בלי לחכות שיובילו אותו.</td></tr>
<tr><td>תכנון הפתרון</td><td>קודם design שעובד end-to-end, ואז שיפורים. כל רכיב מוצדק בדרישה.</td></tr>
<tr><td>עומק טכני</td><td>יודע לרדת לעומק לפחות בתחום אחד: DB internals, cache invalidation, consistency, סמנטיקה של queues.</td></tr>
<tr><td>Trade-offs ותקשורת</td><td>מציג אלטרנטיבות ולמה בחר אחת; מגבה טענות במספרים; בודק מול המראיין שהוא איתו.</td></tr>
</table>
<p>ב-senior/staff הרף עולה: חשיבה תפעולית (deploys, monitoring, failure modes, עלות) והיכולת לזהות מה <em>לא</em> לבנות.</p>
<blockquote>💡 כל רכיב שאתה מצייר צריך לענות על "איזו דרישה הכריחה אותו?" אם אין לך תשובה — תמחק אותו.</blockquote>`
      }
    },
    {
      h: { en: "Common mistakes that sink candidates", he: "טעויות נפוצות שמפילות מועמדים" },
      body: {
        en: `<ul>
<li><strong>Jumping to the diagram</strong> in minute 1. You end up designing the wrong system. Spend 5 minutes on clarification, always.</li>
<li><strong>Buzzword soup</strong>: "Kafka, Kubernetes, microservices, Cassandra" with no reason. Interviewers probe: "why Cassandra here?" — have the access-pattern answer ready.</li>
<li><strong>Estimates with no conclusion</strong>. Computing 18 TB is pointless unless you say "so it fits in one sharded Postgres cluster" or "so we need object storage".</li>
<li><strong>Going deep too early</strong> on one component and never finishing the end-to-end flow.</li>
<li><strong>Silence</strong>. Think out loud; the interviewer grades reasoning, not just the final picture.</li>
<li><strong>Ignoring failure</strong>: no word on what happens when the cache, a DB primary, or a whole AZ dies.</li>
<li><strong>Fighting the interviewer's hint</strong>. If they ask "what about hot keys?" it's a gift — follow it.</li>
<li><strong>Over-engineering for 10^9 users</strong> when you agreed on 10^6. Design for the stated scale plus ~10×, and say how you'd evolve.</li>
</ul>`,
        he: `<ul>
<li><strong>לקפוץ לדיאגרמה</strong> בדקה הראשונה. בסוף מתכננים את המערכת הלא נכונה. תמיד 5 דקות של הבהרה.</li>
<li><strong>מרק של buzzwords</strong>: "Kafka, Kubernetes, microservices, Cassandra" בלי סיבה. המראיין ישאל "למה Cassandra פה?" — תחזיק מוכנה תשובה שמבוססת על access pattern.</li>
<li><strong>הערכות בלי מסקנה</strong>. לחשב 18TB זה חסר ערך אם לא אומרים "אז זה נכנס ב-Postgres cluster עם sharding" או "אז צריך object storage".</li>
<li><strong>לצלול לעומק מוקדם מדי</strong> ברכיב אחד ולא לסגור אף פעם את ה-flow מקצה לקצה.</li>
<li><strong>שתיקה</strong>. תחשוב בקול; מעריכים את דרך החשיבה, לא רק את התמונה הסופית.</li>
<li><strong>להתעלם מכשלים</strong>: אף מילה על מה קורה כשה-cache, ה-primary של ה-DB או AZ שלם נופלים.</li>
<li><strong>להתווכח עם רמז של המראיין</strong>. אם הוא שואל "ומה עם hot keys?" — זו מתנה, תלך איתה.</li>
<li><strong>Over-engineering ל-10^9 משתמשים</strong> כשסיכמתם על 10^6. תתכנן ל-scale שסוכם פלוס בערך פי 10, ותגיד איך המערכת תתפתח.</li>
</ul>`
      }
    },
    {
      h: { en: "How to run the deep-dive phase", he: "איך מנהלים את שלב ה-deep dives" },
      body: {
        en: `<p>After the high-level design works end-to-end, <strong>offer a menu</strong>: "The interesting parts are (a) the hot-key problem in the cache, (b) sharding the write path, (c) failure handling in the queue. Which would you like?" This shows you see the hard parts and lets the interviewer steer to what they grade.</p>
<p>For each deep dive use the same mini-structure:</p>
<ol>
<li><strong>Problem</strong> — with a number: "at 30K writes/s a single Postgres primary saturates".</li>
<li><strong>Options</strong> — 2-3 alternatives (vertical scale, read replicas, sharding by user_id, switch to Cassandra).</li>
<li><strong>Choice + trade-off</strong> — "shard by user_id via consistent hashing; we lose cross-user joins, acceptable because…"</li>
<li><strong>Failure mode</strong> — what breaks and how you'd detect it (metric/alert).</li>
</ol>
<blockquote>⚠️ Standard deep-dive topics to have rehearsed: caching (cache-aside, TTL, stampede), sharding &amp; hot keys, replication lag, queue semantics (at-least-once + idempotency), rate limiting, multi-region, observability/SLOs.</blockquote>`,
        he: `<p>אחרי שה-high-level design עובד מקצה לקצה, <strong>תציע תפריט</strong>: "החלקים המעניינים הם (א) בעיית ה-hot key ב-cache, (ב) sharding של מסלול הכתיבה, (ג) טיפול בכשלים ב-queue. על מה תרצה שנרחיב?" ככה אתה מראה שאתה מזהה את החלקים הקשים, ונותן למראיין לכוון למה שהוא בודק.</p>
<p>לכל deep dive תשתמש באותו מבנה קטן:</p>
<ol>
<li><strong>הבעיה</strong> — עם מספר: "ב-30K writes/s, primary יחיד של Postgres נחנק".</li>
<li><strong>אפשרויות</strong> — 2-3 אלטרנטיבות (scale אנכי, read replicas, sharding לפי user_id, מעבר ל-Cassandra).</li>
<li><strong>בחירה + trade-off</strong> — "sharding לפי user_id עם consistent hashing; מאבדים joins בין משתמשים, וזה בסדר כי…"</li>
<li><strong>Failure mode</strong> — מה נשבר ואיך תזהה את זה (metric/alert).</li>
</ol>
<blockquote>⚠️ נושאי deep dive שכדאי לתרגל מראש: caching ‏(cache-aside, TTL, stampede), sharding ו-hot keys, replication lag, סמנטיקה של queues ‏(at-least-once + idempotency), rate limiting, multi-region, observability ו-SLOs.</blockquote>`
      }
    },
    {
      h: { en: "The wrap-up: finish like a senior", he: "הסיכום: לסיים כמו סניור" },
      body: {
        en: `<p>Save the last 3-5 minutes. A strong wrap-up covers:</p>
<ul>
<li><strong>Recap in one breath</strong>: "Writes go through the API to Postgres sharded by user_id, reads are served 95% from Redis, media from S3 behind a CDN."</li>
<li><strong>Bottlenecks and next steps</strong>: "At 10× scale the fan-out workers become the bottleneck; I'd move to a hybrid push/pull model."</li>
<li><strong>Monitoring</strong>: the 3-4 SLIs you would put on a dashboard (availability, p99 latency, queue lag, cache hit ratio) and the SLO you'd alert on.</li>
<li><strong>Operations</strong>: how you'd deploy safely (canary), backups/DR, and the most likely 3 AM page.</li>
<li><strong>Trade-offs you consciously made</strong>, e.g. eventual consistency on counters.</li>
</ul>
<blockquote>💡 Ending with "here is how I'd know it's healthy in production" is the single strongest signal for DevOps/SRE roles.</blockquote>`,
        he: `<p>תשאיר את 3-5 הדקות האחרונות. סיכום חזק כולל:</p>
<ul>
<li><strong>Recap בנשימה אחת</strong>: "כתיבות עוברות דרך ה-API ל-Postgres עם sharding לפי user_id, ‏95% מהקריאות מוגשות מ-Redis, מדיה מ-S3 מאחורי CDN."</li>
<li><strong>צווארי בקבוק והצעדים הבאים</strong>: "בפי 10 scale ה-fan-out workers יהיו צוואר הבקבוק; הייתי עובר למודל היברידי push/pull."</li>
<li><strong>Monitoring</strong>: ה-3-4 SLIs שהיית שם על dashboard ‏(availability, ‏p99 latency, ‏queue lag, ‏cache hit ratio) וה-SLO שעליו תתריע.</li>
<li><strong>תפעול</strong>: איך עושים deploy בבטחה (canary), backups ו-DR, ומה ה-page הכי סביר בשלוש בלילה.</li>
<li><strong>Trade-offs שלקחת במודע</strong>, למשל eventual consistency על counters.</li>
</ul>
<blockquote>💡 לסיים ב"ככה אני אדע שהמערכת בריאה ב-production" — זה הסיגנל הכי חזק שיש לתפקידי DevOps/SRE.</blockquote>`
      }
    }
  ],
  tradeoffs: [
    { en: "Breadth vs depth: a complete simple design beats a brilliant half-design. Finish end-to-end first, then deepen.",
      he: "רוחב מול עומק: design פשוט ושלם עדיף על חצי design מבריק. קודם תסגור מקצה לקצה, אחר כך תעמיק." },
    { en: "SQL vs NoSQL: choose by access pattern and consistency needs, not hype. \"Postgres until proven otherwise\" is a defensible default.",
      he: "SQL מול NoSQL: בוחרים לפי access pattern ודרישות consistency, לא לפי הייפ. \"Postgres עד שיוכח אחרת\" זו ברירת מחדל שאפשר להגן עליה." },
    { en: "Consistency vs latency/availability (CAP/PACELC): be explicit per data type which side you pick.",
      he: "Consistency מול latency/availability ‏(CAP/PACELC): תגיד במפורש לכל סוג מידע לאיזה צד הלכת." },
    { en: "Sync vs async: queues add resilience and smooth spikes but add eventual consistency, ordering and duplicate-handling work.",
      he: "Sync מול async: queues מוסיפים resilience ומחליקים spikes, אבל מביאים איתם eventual consistency, בעיות סדר וטיפול בכפילויות." },
    { en: "Build vs buy: managed services (SQS, DynamoDB, RDS) cut ops cost; self-hosting gives control and sometimes lower unit cost at scale.",
      he: "Build מול buy: שירותים מנוהלים (SQS, DynamoDB, RDS) חוסכים תפעול; self-hosting נותן שליטה ולפעמים עלות ליחידה נמוכה יותר ב-scale." }
  ],
  followUps: [
    { q: { en: "The interviewer says: \"Just assume whatever scale you want.\" What do you do?",
           he: "המראיין אומר: \"תניח איזה scale שבא לך.\" מה עושים?" },
      a: { en: "Pick a realistic, specific number and justify it (\"let's say 50M DAU, similar to a mid-size social app\"), write it on the board, and derive QPS/storage from it. Then mention which design decisions would change at 10× or 0.1×. Refusing to choose, or choosing \"infinite\", both read as weak.",
           he: "בוחרים מספר ריאלי וספציפי ומצדיקים אותו (\"נניח 50M DAU, כמו אפליקציה חברתית בינונית\"), כותבים על הלוח וגוזרים ממנו QPS ואחסון. אחר כך מציינים אילו החלטות היו משתנות בפי 10 או בעשירית. לסרב לבחור, או לבחור \"אינסוף\" — שניהם נראים חלש." } },
    { q: { en: "You realize halfway through that your data model is wrong. Restart or patch?",
           he: "באמצע הראיון אתה מבין שמודל הנתונים שלך שגוי. מתחילים מחדש או מתקנים?" },
      a: { en: "Say it explicitly: \"I see a problem — listing by follower requires a scatter-gather across shards. Let me change the partition key to X.\" Correcting yourself with a reason is a positive signal (self-review). Patch the affected parts only; don't wipe the board.",
           he: "אומרים את זה במפורש: \"אני רואה בעיה — רשימה לפי follower דורשת scatter-gather על כל ה-shards. אני משנה את ה-partition key ל-X.\" לתקן את עצמך עם נימוק זה סיגנל חיובי (self-review). מתקנים רק את מה שהושפע; לא מוחקים את כל הלוח." } },
    { q: { en: "\"Why not just use microservices for everything?\"",
           he: "\"למה לא פשוט microservices לכל דבר?\"" },
      a: { en: "Microservices buy independent deploys and scaling per team at the cost of network hops, distributed failure modes, data consistency across services, and heavy platform/observability investment. For an interview design I'd split only along clear scaling or ownership boundaries (e.g. a write-heavy ingestion service vs a read-heavy query service) and keep the rest together.",
           he: "Microservices קונים deploy ו-scaling עצמאיים לכל צוות, במחיר של network hops, כשלים מבוזרים, consistency בין שירותים והשקעה כבדה ב-platform ו-observability. ב-design בראיון הייתי מפצל רק לאורך גבולות ברורים של scaling או ownership (למשל שירות ingestion כבד-כתיבות מול שירות query כבד-קריאות) ומשאיר את השאר יחד." } },
    { q: { en: "How do you handle an interviewer who keeps interrupting with new requirements?",
           he: "איך מתמודדים עם מראיין שכל הזמן קוטע עם דרישות חדשות?" },
      a: { en: "That is usually deliberate — they're testing adaptability. Acknowledge, assess impact on the current design (\"this adds a strong-consistency requirement to payments only, so I'll isolate that path in Postgres with transactions\"), update the diagram, and keep moving. Ask whether it replaces or adds to earlier scope if time is tight.",
           he: "זה בדרך כלל מכוון — בודקים גמישות. מאשרים, מעריכים את ההשפעה על ה-design הנוכחי (\"זה מוסיף דרישת strong consistency רק לתשלומים, אז אבודד את המסלול הזה ב-Postgres עם transactions\"), מעדכנים את הדיאגרמה וממשיכים. אם הזמן לחוץ — שואלים אם זה מחליף או מוסיף ל-scope הקודם." } }
  ],
  related: ["arch-scaling", "arch-caching", "db-sql-vs-nosql", "db-cap", "rel-sli-slo-sla"]
});

/* ------------------------------------------------------------------ */
/* 2. URL shortener                                                    */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-url-shortener", icon: "🔗", level: 1,
  title: { en: "Design a URL shortener (bit.ly)", he: "תכנון URL shortener ‏(bit.ly)" },
  prompt: {
    en: "Design a service like bit.ly: users submit a long URL and get a short link; anyone opening the short link is redirected to the original URL.",
    he: "תתכנן שירות כמו bit.ly: משתמש שולח URL ארוך ומקבל לינק קצר; כל מי שפותח את הלינק הקצר מופנה ל-URL המקורי."
  },
  clarify: [
    { en: "Scale: how many new URLs per day and how many redirects? (assume 100M new/day, 100:1 read:write)",
      he: "Scale: כמה URLs חדשים ביום וכמה redirects? (נניח 100M חדשים ביום, יחס 100:1 קריאות לכתיבות)" },
    { en: "Can users choose a custom alias? Do links expire?",
      he: "משתמשים יכולים לבחור alias מותאם? ללינקים יש תוקף?" },
    { en: "How short must the code be? Are characters limited to [a-zA-Z0-9]?",
      he: "כמה קצר הקוד צריך להיות? רק תווים מ-[a-zA-Z0-9]?" },
    { en: "Do we need click analytics (counts, geo, referrer)? Real-time or daily?",
      he: "צריך analytics על קליקים (כמות, geo, referrer)? בזמן אמת או יומי?" },
    { en: "Same long URL submitted twice — same short code or a new one?",
      he: "אותו URL ארוך שנשלח פעמיים — אותו קוד או קוד חדש?" },
    { en: "301 (permanent, cached by browsers) or 302 (temporary, every click hits us)?",
      he: "301 (קבוע, נשמר ב-cache של הדפדפן) או 302 (זמני, כל קליק מגיע אלינו)?" }
  ],
  functional: [
    { en: "Create a short URL from a long URL (optional custom alias and expiry).",
      he: "יצירת URL קצר מ-URL ארוך (עם alias מותאם ותוקף, אופציונלי)." },
    { en: "Redirect a short URL to the original URL.",
      he: "Redirect מה-URL הקצר ל-URL המקורי." },
    { en: "Basic click analytics per link (eventually consistent).",
      he: "Analytics בסיסי על קליקים לכל לינק (eventually consistent)." },
    { en: "Owner can delete/disable a link.",
      he: "הבעלים יכול למחוק או להשבית לינק." }
  ],
  nonFunctional: [
    { en: "Redirect latency p99 &lt; 50 ms server-side; it's on the critical path of every click.",
      he: "Latency של redirect ב-p99 מתחת ל-50ms בצד השרת; זה על המסלול הקריטי של כל קליק." },
    { en: "High availability for redirects (99.99%) — a dead link breaks every place it was shared.",
      he: "Availability גבוה ל-redirects ‏(99.99%) — לינק מת שובר כל מקום שבו הוא שותף." },
    { en: "Codes must be unique and not easily guessable/enumerable.",
      he: "הקודים חייבים להיות ייחודיים ולא קלים לניחוש או enumeration." },
    { en: "Durable: a created link must never be lost for its lifetime (years).",
      he: "Durable: לינק שנוצר אסור שילך לאיבוד לאורך כל חייו (שנים)." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Writes</strong>: 100M new URLs/day ÷ 10^5 s ≈ <strong>1,200 writes/s</strong> avg, ~3K/s peak.</li>
<li><strong>Reads</strong>: 100:1 → 10^10 redirects/day ÷ 10^5 ≈ <strong>115K redirects/s</strong> avg, ~300K/s peak.</li>
<li><strong>Storage</strong>: ~500 bytes per record (long URL ~200 B + metadata) × 100M/day = 50 GB/day → × 365 × 5 ≈ <strong>90 TB</strong> over 5 years (before replication). Too big for one node, fine for a sharded KV store.</li>
<li><strong>Code length</strong>: total links in 5 years = 100M × 365 × 5 ≈ 1.8 × 10^11. Base62 with 7 chars = 62^7 ≈ 3.5 × 10^12 → 7 chars is enough with ~20× headroom.</li>
<li><strong>Cache</strong>: traffic is Zipfian — ~20% of links get ~80% of clicks. Caching the hot 20% of one day's reads: 10^10 × 0.2 distinct-ish × 500 B is an overestimate; in practice a few hundred GB of Redis (e.g. 10 × 64 GB nodes) gives a 90%+ hit ratio.</li>
<li><strong>Bandwidth</strong>: a redirect response is ~500 B → 115K × 500 B ≈ 60 MB/s. Trivial.</li>
</ul>
<blockquote>💡 Conclusion: the problem is read QPS and latency, not storage complexity. Design = cache-first redirect path + a simple unique-ID generator on writes.</blockquote>`,
    he: `<ul>
<li><strong>כתיבות</strong>: ‏100M URLs חדשים ביום ÷ 10^5 שניות ≈ <strong>1,200 writes/s</strong> בממוצע, ~3K/s ב-peak.</li>
<li><strong>קריאות</strong>: ‏100:1 → ‏10^10 redirects ביום ÷ 10^5 ≈ <strong>115K redirects/s</strong> בממוצע, ~300K/s ב-peak.</li>
<li><strong>אחסון</strong>: ~500 בייט לרשומה (URL ארוך ~200B + metadata) × 100M ביום = 50GB ביום → × 365 × 5 ≈ <strong>90TB</strong> ב-5 שנים (לפני replication). גדול מדי ל-node אחד, מצוין ל-KV store עם sharding.</li>
<li><strong>אורך הקוד</strong>: סך הלינקים ב-5 שנים = 100M × 365 × 5 ≈ 1.8 × 10^11. ‏Base62 עם 7 תווים = 62^7 ≈ 3.5 × 10^12 → ‏7 תווים מספיקים עם מרווח של בערך פי 20.</li>
<li><strong>Cache</strong>: התעבורה Zipfian — ‏~20% מהלינקים מקבלים ~80% מהקליקים. בפועל כמה מאות GB של Redis (למשל 10 nodes של 64GB) נותנים hit ratio מעל 90%.</li>
<li><strong>Bandwidth</strong>: תשובת redirect היא ~500B → ‏115K × 500B ≈ 60MB/s. זניח.</li>
</ul>
<blockquote>💡 המסקנה: הבעיה היא read QPS ו-latency, לא מורכבות אחסון. ה-design = מסלול redirect שמתחיל מ-cache + מחולל ID ייחודי ופשוט לכתיבות.</blockquote>`
  },
  api: `POST /api/v1/urls
     Headers: Authorization, Idempotency-Key
     Body: {long_url, custom_alias?, expires_at?}
  -> 201 {code: "aZ3kP9q", short_url: "https://sho.rt/aZ3kP9q", expires_at}
  -> 409 if custom_alias taken

GET /{code}
  -> 302 Location: <long_url>      (or 301 if analytics not needed)
  -> 404 not found / 410 expired

DELETE /api/v1/urls/{code}         -> 204
GET    /api/v1/urls/{code}/stats   -> 200 {clicks, by_country[], by_day[]}`,
  dataModel: `urls  (KV / DynamoDB / Cassandra, partition key = code)
  code        PK  (7-char base62)
  long_url        text
  owner_id        (secondary index or separate table owner_links(owner_id, created_at, code))
  created_at, expires_at (TTL), is_active

id_ranges (Postgres or ZooKeeper/etcd) -- for the range-based ID allocator
  service_instance, range_start, range_end

clicks (Kafka topic -> ClickHouse / BigQuery for analytics)
  code, ts, country, referrer, user_agent_family`,
  diagram: `                 +---------+
  Browser ------>|  CDN /  |  (optional edge cache of hot redirects)
                 |  Edge   |
                 +----+----+
                      |
                 +----v----+
                 |   LB    |
                 +----+----+
          +-----------+------------+
          |                        |
   +------v-------+        +-------v-------+
   | Write API    |        | Redirect svc  |----click event----> Kafka --> Analytics
   | (create)     |        | (GET /{code}) |                              (ClickHouse)
   +--+--------+--+        +---+-------+---+
      |        |               |  miss |
      |   +----v------+   hit  |       |
      |   | ID ranges |  +-----v--+    |
      |   | (etcd/PG) |  | Redis  |    |
      |   +-----------+  +--------+    |
      |                                |
   +--v--------------------------------v--+
   |  KV store: DynamoDB / Cassandra      |
   |  partition key = code, RF=3          |
   +--------------------------------------+`,
  deepDives: [
    {
      h: { en: "Generating short codes: hash vs counter vs random", he: "יצירת קודים קצרים: hash מול counter מול random" },
      body: {
        en: `<table>
<tr><th>Approach</th><th>How</th><th>Pros / cons</th></tr>
<tr><td>Hash (MD5/SHA of URL), take 7 chars</td><td>base62(md5(url))[0:7]</td><td>Deterministic (dedup for free) but collisions must be checked and resolved (append salt, retry). Extra read on every write.</td></tr>
<tr><td>Global counter → base62</td><td>Single DB sequence</td><td>No collisions, but a single point of contention and codes are sequential (enumerable).</td></tr>
<tr><td><strong>Range allocation</strong></td><td>Each app server leases a block of 1M IDs from etcd/Postgres, hands them out from memory</td><td>No coordination per request, no collisions. Lose at most one unused block on crash. Shuffle bits (e.g. a Feistel cipher / bijective scramble) to make codes non-sequential.</td></tr>
<tr><td>Random 7 chars</td><td>crypto random + insert-if-not-exists</td><td>Simple, non-guessable; collision probability low while the space is sparse (1.8e11 / 3.5e12 ≈ 5%), conditional write handles it.</td></tr>
</table>
<p>My pick: <strong>range allocation + bijective scramble</strong>, or random + conditional put (DynamoDB <code>attribute_not_exists(code)</code>) if simplicity matters more.</p>`,
        he: `<table>
<tr><th>גישה</th><th>איך</th><th>יתרונות / חסרונות</th></tr>
<tr><td>Hash ‏(MD5/SHA של ה-URL), לוקחים 7 תווים</td><td>base62(md5(url))[0:7]</td><td>דטרמיניסטי (dedup בחינם), אבל חייבים לבדוק ולפתור collisions (להוסיף salt ולנסות שוב). עוד קריאה בכל כתיבה.</td></tr>
<tr><td>Counter גלובלי → base62</td><td>Sequence אחד ב-DB</td><td>אין collisions, אבל נקודת contention אחת והקודים רציפים (אפשר לעשות enumeration).</td></tr>
<tr><td><strong>הקצאת טווחים</strong></td><td>כל שרת אפליקציה "שוכר" בלוק של מיליון IDs מ-etcd/Postgres ומחלק מהזיכרון</td><td>אין תיאום בכל בקשה, אין collisions. ב-crash מאבדים לכל היותר בלוק שלא נוצל. עושים shuffle לביטים (Feistel cipher / ערבוב bijective) כדי שהקודים לא יהיו רציפים.</td></tr>
<tr><td>7 תווים רנדומליים</td><td>crypto random + insert-if-not-exists</td><td>פשוט, לא ניתן לניחוש; ההסתברות ל-collision נמוכה כל עוד המרחב דליל (1.8e11 / 3.5e12 ≈ 5%), ו-conditional write מטפל בזה.</td></tr>
</table>
<p>הבחירה שלי: <strong>הקצאת טווחים + ערבוב bijective</strong>, או random + conditional put ‏(DynamoDB <code>attribute_not_exists(code)</code>) אם פשטות חשובה יותר.</p>`
      }
    },
    {
      h: { en: "The redirect path: caching for 300K QPS", he: "מסלול ה-redirect: caching ל-300K QPS" },
      body: {
        en: `<p>The redirect service is stateless; scale it horizontally behind the LB. Per request: look up <code>code</code> in Redis (cache-aside). On miss, read from the KV store and populate Redis with a TTL (e.g. 24h). Mappings are effectively immutable, so invalidation is only needed on delete/disable — publish a delete event and <code>DEL</code> the key.</p>
<ul>
<li>Use <strong>Redis Cluster</strong> sharded by key; ~100K ops/s per node → 4-6 primaries for 300K peak, with replicas for HA.</li>
<li>Add an <strong>in-process LRU</strong> (e.g. 100K entries per pod) for the very hottest links — removes a network hop and absorbs viral spikes on a single key.</li>
<li><strong>Negative caching</strong>: cache "not found" for 60s to stop bots scanning random codes from hammering the DB.</li>
<li>Optionally serve redirects from the <strong>CDN edge</strong> with <code>Cache-Control: max-age=300</code> — but then clicks are not counted unless you use edge logs.</li>
</ul>
<blockquote>💡 With a 95% cache hit ratio, the KV store sees only 5% × 300K = 15K reads/s — comfortable for a 6-node Cassandra or DynamoDB on-demand.</blockquote>`,
        he: `<p>שירות ה-redirect הוא stateless; עושים לו scale אופקי מאחורי ה-LB. בכל בקשה: מחפשים את ה-<code>code</code> ב-Redis ‏(cache-aside). ב-miss קוראים מה-KV store ומכניסים ל-Redis עם TTL (למשל 24 שעות). המיפויים בפועל immutable, אז invalidation נדרש רק במחיקה או השבתה — מפרסמים delete event ועושים <code>DEL</code> למפתח.</p>
<ul>
<li><strong>Redis Cluster</strong> עם sharding לפי מפתח; ~100K ops/s ל-node → ‏4-6 primaries ל-300K ב-peak, עם replicas בשביל HA.</li>
<li>להוסיף <strong>LRU בתוך התהליך</strong> (למשל 100K רשומות לכל pod) ללינקים הכי חמים — חוסך network hop וסופג spikes ויראליים על מפתח בודד.</li>
<li><strong>Negative caching</strong>: לשמור "לא נמצא" ל-60 שניות כדי שבוטים שסורקים קודים רנדומליים לא יפציצו את ה-DB.</li>
<li>אפשר גם להגיש redirects מה-<strong>CDN edge</strong> עם <code>Cache-Control: max-age=300</code> — אבל אז הקליקים לא נספרים, אלא אם משתמשים ב-edge logs.</li>
</ul>
<blockquote>💡 עם hit ratio של 95%, ה-KV store רואה רק 5% × 300K = ‏15K reads/s — בנוח ל-Cassandra של 6 nodes או ל-DynamoDB on-demand.</blockquote>`
      }
    },
    {
      h: { en: "Storage choice and sharding", he: "בחירת אחסון ו-sharding" },
      body: {
        en: `<p>Access pattern is pure key lookup by <code>code</code>, no joins, ~90 TB over 5 years, high read rate. That's a textbook fit for a <strong>wide-column / KV store</strong>: DynamoDB (managed, auto-partitioning, native TTL) or Cassandra (partition key = code, RF=3, <code>LOCAL_QUORUM</code> reads/writes).</p>
<p>Postgres can work too: shard by <code>hash(code) % N</code> with Citus or app-level routing; 90 TB ÷ 2 TB per shard ≈ 45 shards. Fine, but more operational burden than DynamoDB for this shape.</p>
<p>Why not shard by <code>owner_id</code>? Because the hot path (redirect) only knows the code. "List my links" is served by a secondary table <code>owner_links(owner_id, created_at, code)</code> — denormalization is fine here.</p>
<blockquote>⚠️ Expiry: use native TTL (DynamoDB TTL / Cassandra TTL) rather than a cron that deletes billions of rows. Check <code>expires_at</code> on read too, since TTL deletion is lazy.</blockquote>`,
        he: `<p>ה-access pattern הוא lookup נקי לפי <code>code</code>, בלי joins, ~90TB ב-5 שנים, קצב קריאה גבוה. זה בדיוק המקרה ל-<strong>wide-column / KV store</strong>: ‏DynamoDB (מנוהל, auto-partitioning, TTL מובנה) או Cassandra ‏(partition key = code, ‏RF=3, קריאות וכתיבות ב-<code>LOCAL_QUORUM</code>).</p>
<p>גם Postgres יכול לעבוד: sharding לפי <code>hash(code) % N</code> עם Citus או routing ברמת האפליקציה; ‏90TB ÷ 2TB ל-shard ≈ 45 shards. אפשרי, אבל יותר עבודה תפעולית מ-DynamoDB לצורה כזאת.</p>
<p>למה לא sharding לפי <code>owner_id</code>? כי המסלול החם (redirect) מכיר רק את הקוד. "תראה לי את הלינקים שלי" מוגש מטבלה משנית <code>owner_links(owner_id, created_at, code)</code> — denormalization זה לגיטימי פה.</p>
<blockquote>⚠️ תוקף: להשתמש ב-TTL מובנה (DynamoDB TTL / Cassandra TTL) ולא ב-cron שמוחק מיליארדי שורות. לבדוק <code>expires_at</code> גם בקריאה, כי מחיקת TTL היא lazy.</blockquote>`
      }
    },
    {
      h: { en: "Analytics without slowing redirects", he: "Analytics בלי להאט את ה-redirects" },
      body: {
        en: `<p>Never write a counter to the DB synchronously on each click — 115K increments/s on hot rows is a contention disaster. Instead the redirect service emits a click event <strong>asynchronously</strong> (fire-and-forget to a local buffer → Kafka). If Kafka is slow, drop or sample the event; the redirect must not wait.</p>
<ul>
<li>Kafka topic partitioned by <code>code</code>; ~115K msgs/s × 200 B ≈ 23 MB/s — a small cluster.</li>
<li>Consumers (Flink / Kafka Streams) aggregate per code per minute and write to <strong>ClickHouse</strong> or BigQuery; the stats API reads aggregates.</li>
<li>Bot filtering and unique-visitor estimates (HyperLogLog) happen in the stream job.</li>
</ul>
<p>This is also why <strong>302 vs 301</strong> matters: 301 is cached by browsers, so repeat clicks never reach you — cheaper but undercounted. Products that sell analytics (bit.ly) use 302.</p>`,
        he: `<p>אף פעם לא כותבים counter ל-DB באופן סינכרוני בכל קליק — ‏115K increments בשנייה על שורות חמות זה אסון של contention. במקום זה, שירות ה-redirect שולח click event <strong>אסינכרונית</strong> (fire-and-forget ל-buffer מקומי → Kafka). אם Kafka איטי — מפילים או עושים sampling ל-event; ה-redirect לא מחכה.</p>
<ul>
<li>Kafka topic עם partitions לפי <code>code</code>; ‏~115K הודעות בשנייה × 200B ≈ 23MB/s — cluster קטן.</li>
<li>Consumers ‏(Flink / Kafka Streams) מאגרגים לכל קוד לכל דקה וכותבים ל-<strong>ClickHouse</strong> או BigQuery; ה-API של הסטטיסטיקות קורא אגרגציות.</li>
<li>סינון בוטים והערכת מבקרים ייחודיים (HyperLogLog) קורים ב-stream job.</li>
</ul>
<p>בגלל זה גם <strong>302 מול 301</strong> חשוב: 301 נשמר ב-cache של הדפדפן, אז קליקים חוזרים לא מגיעים אליך — זול יותר אבל ספירה חסרה. מוצרים שמוכרים analytics ‏(bit.ly) משתמשים ב-302.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "301 vs 302: 301 reduces load and latency for repeat visitors; 302 keeps every click visible for analytics and lets you change/disable the target.",
      he: "301 מול 302: ‏301 מוריד עומס ו-latency למבקרים חוזרים; 302 משאיר כל קליק גלוי ל-analytics ומאפשר לשנות או להשבית את היעד." },
    { en: "Dedup identical long URLs: saves storage but needs an extra index (hash(long_url) → code) and leaks that someone else shortened the same URL. Usually skip it per user.",
      he: "Dedup ל-URLs ארוכים זהים: חוסך אחסון אבל דורש אינדקס נוסף (hash(long_url) → code) ומדליף שמישהו אחר קיצר את אותו URL. בדרך כלל מוותרים, או עושים רק per-user." },
    { en: "Sequential IDs are simple but enumerable; scrambling or random codes cost a little complexity but prevent scraping all links.",
      he: "IDs רציפים פשוטים אבל ניתנים ל-enumeration; ערבוב או קודים רנדומליים עולים קצת מורכבות אבל מונעים scraping של כל הלינקים." },
    { en: "Managed KV (DynamoDB) vs self-run Cassandra: managed wins on ops; Cassandra can be cheaper at very high steady throughput.",
      he: "KV מנוהל (DynamoDB) מול Cassandra בניהול עצמי: המנוהל מנצח בתפעול; Cassandra יכול לצאת זול יותר ב-throughput גבוה ויציב." }
  ],
  followUps: [
    { q: { en: "A link goes viral: 1M clicks/s on a single code. What breaks?",
           he: "לינק הופך לויראלי: מיליון קליקים בשנייה על קוד אחד. מה נשבר?" },
      a: { en: "One Redis shard holds that key and caps at ~100K ops/s — a hot key. Fixes: in-process LRU cache in every redirect pod (absorbs nearly all of it), CDN edge caching for that code, or replicate hot keys with suffixes (code#1..#N) and read a random replica. Analytics: Kafka partition by code also becomes hot — partition clicks by random key and aggregate downstream.",
           he: "Shard אחד של Redis מחזיק את המפתח ומוגבל ל-~100K ops/s — hot key. פתרונות: LRU בתוך התהליך בכל pod של redirect (סופג כמעט הכל), caching ב-CDN edge לקוד הזה, או שכפול מפתחות חמים עם סיומות (code#1..#N) וקריאה מעותק רנדומלי. ב-analytics גם ה-partition של Kafka לפי code נהיה חם — עושים partitioning לקליקים לפי מפתח רנדומלי ומאגרגים בהמשך." } },
    { q: { en: "How do you stop the service being used for phishing/malware links?",
           he: "איך מונעים שימוש בשירות ללינקים של phishing ו-malware?" },
      a: { en: "On create: check against Google Safe Browsing / internal blocklists asynchronously, rate-limit per user/IP, require auth for high volume. On redirect: links flagged later get is_active=false and the cache key is deleted; serve an interstitial warning page. Keep an abuse-report endpoint.",
           he: "ביצירה: בדיקה מול Google Safe Browsing ו-blocklists פנימיים באופן אסינכרוני, rate limiting לפי משתמש/IP, חובת auth לנפח גבוה. ב-redirect: לינקים שמסומנים בדיעבד מקבלים is_active=false ומוחקים את המפתח מה-cache; מגישים דף אזהרה ביניים. ומחזיקים endpoint לדיווח על abuse." } },
    { q: { en: "How would you make it multi-region?",
           he: "איך היית הופך את זה ל-multi-region?" },
      a: { en: "Redirects are read-only and tolerate eventual consistency, so replicate the KV store globally (DynamoDB Global Tables / Cassandra multi-DC) and route users via GeoDNS/anycast to the nearest region. Writes can go to any region as long as code generation is collision-free across regions — give each region its own ID range prefix. A just-created link may 404 in another region for ~1s; mitigate by falling back to the origin region on miss.",
           he: "Redirects הם read-only וסובלים eventual consistency, אז משכפלים את ה-KV store גלובלית (DynamoDB Global Tables / Cassandra multi-DC) ומנתבים משתמשים עם GeoDNS/anycast ל-region הקרוב. כתיבות יכולות להגיע לכל region כל עוד יצירת הקודים בלי collisions בין regions — כל region מקבל prefix משלו בטווח ה-IDs. לינק שנוצר הרגע יכול להחזיר 404 ב-region אחר לבערך שנייה; מטפלים בזה ב-fallback ל-region המקורי ב-miss." } },
    { q: { en: "What would you monitor and alert on?",
           he: "מה היית מנטר ועל מה היית מתריע?" },
      a: { en: "SLIs: redirect success rate (non-5xx, excluding legit 404) and redirect p99 latency, measured at the LB. SLO e.g. 99.99% / p99 &lt; 50 ms with burn-rate alerts. Supporting: Redis hit ratio (a drop predicts DB overload), KV store throttling/latency, ID-range allocator health, Kafka producer error rate, and a synthetic probe clicking a known link every minute from several regions.",
           he: "SLIs: אחוז redirects מוצלחים (בלי 5xx, לא כולל 404 לגיטימי) ו-p99 latency של redirect, נמדד ב-LB. ‏SLO למשל 99.99% ו-p99 &lt; 50ms עם burn-rate alerts. בנוסף: hit ratio של Redis (ירידה חוזה עומס על ה-DB), throttling ו-latency של ה-KV store, בריאות מקצה ה-ID ranges, error rate של ה-Kafka producer, ו-synthetic probe שלוחץ על לינק ידוע כל דקה מכמה regions." } }
  ],
  related: ["arch-caching", "db-sharding", "db-sql-vs-nosql", "net-proxies-cdn", "net-load-balancing"]
});

/* ------------------------------------------------------------------ */
/* 3. Distributed rate limiter                                         */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-rate-limiter", icon: "🚦", level: 2,
  title: { en: "Design a distributed rate limiter", he: "תכנון rate limiter מבוזר" },
  prompt: {
    en: "Design a rate limiter for a public API served by hundreds of stateless servers. Example rule: each API key may make 1,000 requests per minute; excess requests get HTTP 429.",
    he: "תתכנן rate limiter ל-API ציבורי שמוגש ממאות שרתים stateless. חוק לדוגמה: כל API key רשאי לבצע 1,000 בקשות בדקה; בקשות מעבר לזה מקבלות HTTP 429."
  },
  clarify: [
    { en: "What do we limit by — API key, user ID, IP, endpoint, or combinations? Different tiers per plan?",
      he: "לפי מה מגבילים — API key, ‏user ID, ‏IP, ‏endpoint או שילובים? Tiers שונים לפי תוכנית?" },
    { en: "How precise must it be? Is allowing 1,010 instead of 1,000 in a burst acceptable?",
      he: "כמה מדויק זה צריך להיות? זה בסדר לאפשר 1,010 במקום 1,000 ב-burst?" },
    { en: "Do we allow bursts (token bucket) or require a smooth rate?",
      he: "מאפשרים bursts ‏(token bucket) או דורשים קצב חלק?" },
    { en: "Scale: total QPS and number of distinct keys? (assume 500K QPS, 10M keys)",
      he: "Scale: כמה QPS בסך הכל וכמה מפתחות שונים? (נניח 500K QPS, ‏10M מפתחות)" },
    { en: "If the limiter's datastore is down — fail open (allow) or fail closed (reject)?",
      he: "אם ה-datastore של ה-limiter נופל — fail open (לאפשר) או fail closed (לחסום)?" },
    { en: "Single region or global limits across regions?",
      he: "Region אחד, או limits גלובליים על פני כמה regions?" }
  ],
  functional: [
    { en: "Enforce configurable limits per key/rule (e.g. 1,000/min per API key, 10/s per IP on /login).",
      he: "אכיפה של limits ניתנים להגדרה לכל מפתח/חוק (למשל 1,000 בדקה ל-API key, ‏10 בשנייה ל-IP על /login)." },
    { en: "Return 429 with Retry-After and X-RateLimit-Limit/Remaining/Reset headers.",
      he: "להחזיר 429 עם Retry-After וה-headers ‏X-RateLimit-Limit/Remaining/Reset." },
    { en: "Rules can be changed without redeploying the gateway.",
      he: "אפשר לשנות חוקים בלי לעשות redeploy ל-gateway." },
    { en: "Expose metrics on throttled requests per key/rule.",
      he: "לחשוף metrics על בקשות שנחסמו לכל מפתח/חוק." }
  ],
  nonFunctional: [
    { en: "Added latency ≤ 1-2 ms p99 — it sits in front of every request.",
      he: "תוספת latency של עד 1-2ms ב-p99 — זה יושב לפני כל בקשה." },
    { en: "Highly available; the limiter must never become the reason the API is down.",
      he: "Availability גבוה; ה-limiter לעולם לא יכול להיות הסיבה שה-API למטה." },
    { en: "Accurate across hundreds of servers (shared state, not per-server counters).",
      he: "מדויק על פני מאות שרתים (state משותף, לא counters לכל שרת)." },
    { en: "Scale to 500K+ checks/s and 10M active keys.",
      he: "Scale של 500K+ בדיקות בשנייה ו-10M מפתחות פעילים." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Checks</strong>: 500K QPS → 500K Redis ops/s (one Lua script call each). At ~100K ops/s per Redis node → <strong>~6-10 shards</strong> in a Redis Cluster, plus replicas.</li>
<li><strong>Memory (token bucket)</strong>: per key we store tokens + last_refill ≈ 2 fields; with key name and Redis overhead ≈ <strong>~100 bytes</strong>. 10M keys × 100 B = <strong>1 GB</strong>. Tiny.</li>
<li><strong>Memory (sliding window log)</strong>: stores every timestamp. A key at 1,000 req/min keeps up to 1,000 entries × ~30 B in a sorted set ≈ 30 KB/key. 10M keys × 30 KB = <strong>300 GB</strong>. That's why the log variant is rarely used at scale.</li>
<li><strong>Latency budget</strong>: Redis in the same AZ ≈ 0.3-0.5 ms RTT + ~50 µs script → ~1 ms p99. Fits the budget; cross-region Redis (60 ms) would not.</li>
<li><strong>Rule config</strong>: maybe thousands of rules, a few MB — cached in each gateway's memory, refreshed every 10-30 s.</li>
</ul>`,
    he: `<ul>
<li><strong>בדיקות</strong>: ‏500K QPS → ‏500K פעולות Redis בשנייה (קריאה אחת ל-Lua script לכל בקשה). ב-~100K ops/s ל-node של Redis → <strong>~6-10 shards</strong> ב-Redis Cluster, ועוד replicas.</li>
<li><strong>זיכרון (token bucket)</strong>: לכל מפתח שומרים tokens + last_refill ≈ שני שדות; עם שם המפתח וה-overhead של Redis ≈ <strong>~100 בייט</strong>. ‏10M מפתחות × 100B = <strong>1GB</strong>. קטן מאוד.</li>
<li><strong>זיכרון (sliding window log)</strong>: שומר כל timestamp. מפתח של 1,000 בקשות בדקה מחזיק עד 1,000 רשומות × ~30B ב-sorted set ≈ ‏30KB למפתח. ‏10M מפתחות × 30KB = <strong>300GB</strong>. בגלל זה כמעט לא משתמשים בגרסת ה-log ב-scale.</li>
<li><strong>תקציב latency</strong>: Redis באותו AZ ≈ ‏0.3-0.5ms RTT + ~50µs ל-script → בערך 1ms ב-p99. נכנס בתקציב; Redis ב-region אחר (60ms) לא היה נכנס.</li>
<li><strong>קונפיגורציית חוקים</strong>: אולי אלפי חוקים, כמה MB — נשמרים בזיכרון של כל gateway ומתרעננים כל 10-30 שניות.</li>
</ul>`
  },
  api: `Internal check API (if run as a sidecar/service; usually a library in the gateway):

  POST /v1/ratelimit/check
    {domain: "public-api", descriptors: [{key:"api_key", value:"k_123"}, {key:"route", value:"/search"}], hits: 1}
  -> 200 {allowed: true,  limit: 1000, remaining: 412, reset_ms: 23000}
  -> 200 {allowed: false, limit: 1000, remaining: 0,   retry_after_ms: 1800}

Client-facing behaviour:
  HTTP 429 Too Many Requests
  Retry-After: 2
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1731400000

Admin:
  PUT /v1/rules/{rule_id}  {match:{api_key_tier:"free"}, limit:1000, window:"60s", algo:"token_bucket", burst:200}`,
  dataModel: `Rules (Postgres or config repo -> pushed to gateways):
  rules(rule_id PK, domain, match_json, algo, limit, window_s, burst, enabled, updated_at)

Counters (Redis Cluster, in-memory, TTL'd):
  Token bucket:   HASH  rl:{api_key}:{rule}   -> {tokens: float, ts: ms}     TTL = 2 x window
  Fixed window:   STRING rl:{api_key}:{rule}:{window_start} -> count          TTL = window
  Sliding counter: two fixed-window keys (current + previous) -> weighted estimate

  {api_key} in braces = Redis Cluster hash tag, so all keys for one client land on one shard.`,
  diagram: `   Client
     |
     v
  +--------------------+
  |  CDN / WAF          |  coarse per-IP limits, DDoS (L3/L4/L7)
  +---------+----------+
            |
  +---------v----------+     rules (cached in memory,
  |  API Gateway fleet  |<--- refreshed every 30s) ---+  Rules DB /
  |  (Envoy/Kong/NGINX) |                              |  config repo
  |  rate-limit filter  |                              +-------------
  +----+----------+----+
       |          |  EVALSHA token_bucket.lua (~1 ms)
       |     +----v-------------------------------+
       |     |  Redis Cluster (6-10 shards, RF=2) |
       |     |  same AZ / region as gateways      |
       |     +------------------------------------+
       |  allowed
       v
  +--------------------+
  | Backend services   |  (optional local per-instance limiter
  +--------------------+   as a last line of defense)

  429s + decisions -> metrics (Prometheus) -> dashboards/alerts`,
  deepDives: [
    {
      h: { en: "Algorithms: token bucket vs sliding window", he: "אלגוריתמים: token bucket מול sliding window" },
      body: {
        en: `<table>
<tr><th>Algorithm</th><th>Memory/key</th><th>Behavior</th></tr>
<tr><td>Fixed window counter</td><td>1 int</td><td>Simple <code>INCR</code>+<code>EXPIRE</code>. Flaw: 2× burst at the boundary (1,000 at 0:59 + 1,000 at 1:00).</td></tr>
<tr><td>Sliding window log</td><td>N timestamps</td><td>Exact, but memory ∝ limit. Good only for small limits (e.g. 5 logins/min).</td></tr>
<tr><td>Sliding window counter</td><td>2 ints</td><td>Estimate = current + previous × (overlap fraction). ~1% error, cheap. Used by Cloudflare.</td></tr>
<tr><td><strong>Token bucket</strong></td><td>2 numbers</td><td>Bucket of capacity B refilled at rate r. Allows controlled bursts up to B, average rate r. Used by AWS API Gateway, Stripe, Envoy.</td></tr>
<tr><td>Leaky bucket</td><td>queue</td><td>Smooths output to a constant rate; good for shaping traffic to a fragile downstream, adds queueing delay.</td></tr>
</table>
<p>For a public API I'd pick <strong>token bucket</strong>: clients get a predictable average with some burst tolerance, it's O(1) memory, and refill is computed lazily on each request (<code>tokens = min(B, tokens + (now - ts) × r)</code>) — no background refill job.</p>`,
        he: `<table>
<tr><th>אלגוריתם</th><th>זיכרון למפתח</th><th>התנהגות</th></tr>
<tr><td>Fixed window counter</td><td>int אחד</td><td>פשוט: <code>INCR</code>+<code>EXPIRE</code>. החיסרון: burst כפול בגבול החלון (1,000 ב-0:59 ועוד 1,000 ב-1:00).</td></tr>
<tr><td>Sliding window log</td><td>N timestamps</td><td>מדויק, אבל הזיכרון פרופורציונלי ל-limit. טוב רק ל-limits קטנים (למשל 5 התחברויות בדקה).</td></tr>
<tr><td>Sliding window counter</td><td>שני ints</td><td>הערכה = נוכחי + קודם × (חלק החפיפה). שגיאה של ~1%, זול. Cloudflare משתמשים בזה.</td></tr>
<tr><td><strong>Token bucket</strong></td><td>שני מספרים</td><td>דלי בקיבולת B שמתמלא בקצב r. מאפשר bursts מבוקרים עד B, וקצב ממוצע r. בשימוש ב-AWS API Gateway, ‏Stripe, ‏Envoy.</td></tr>
<tr><td>Leaky bucket</td><td>queue</td><td>מחליק את היציאה לקצב קבוע; טוב ל-shaping מול downstream שביר, מוסיף השהיית תור.</td></tr>
</table>
<p>ל-API ציבורי הייתי בוחר <strong>token bucket</strong>: הלקוחות מקבלים ממוצע צפוי עם סובלנות ל-bursts, הזיכרון O(1), וה-refill מחושב lazily בכל בקשה (<code>tokens = min(B, tokens + (now - ts) × r)</code>) — בלי job רקע שממלא.</p>`
      }
    },
    {
      h: { en: "Atomicity: Redis + Lua", he: "אטומיות: Redis + Lua" },
      body: {
        en: `<p>The naive approach — <code>GET</code> tokens, compute in the app, <code>SET</code> tokens — has a race: two gateways read 1 token simultaneously and both allow. Fix: run read-compute-write <strong>atomically inside Redis</strong> with a Lua script (Redis executes scripts single-threaded, so no interleaving).</p>
<pre>-- KEYS[1]=bucket  ARGV: capacity, rate_per_ms, now_ms, cost
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local cap, rate, now, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4])
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) * rate)
local allowed = 0
if tokens &gt;= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate) * 2)
return {allowed, tokens}</pre>
<ul>
<li>Load once with <code>SCRIPT LOAD</code>, call with <code>EVALSHA</code> — one round trip.</li>
<li>Use Redis server time (<code>TIME</code>) or tolerate small gateway clock skew; skew only shifts refill slightly.</li>
<li>The <code>PEXPIRE</code> means idle keys vanish — memory scales with <em>active</em> keys.</li>
</ul>`,
        he: `<p>הגישה הנאיבית — <code>GET</code> ל-tokens, חישוב באפליקציה, <code>SET</code> — כוללת race: שני gateways קוראים token אחד באותו רגע ושניהם מאשרים. הפתרון: להריץ קריאה-חישוב-כתיבה <strong>באופן אטומי בתוך Redis</strong> עם Lua script (Redis מריץ scripts ב-thread יחיד, אז אין שזירה).</p>
<pre>-- KEYS[1]=bucket  ARGV: capacity, rate_per_ms, now_ms, cost
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local cap, rate, now, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4])
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) * rate)
local allowed = 0
if tokens &gt;= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate) * 2)
return {allowed, tokens}</pre>
<ul>
<li>טוענים פעם אחת עם <code>SCRIPT LOAD</code> וקוראים עם <code>EVALSHA</code> — round trip אחד.</li>
<li>משתמשים בזמן של שרת Redis ‏(<code>TIME</code>) או סובלים clock skew קטן בין gateways; skew רק מזיז קצת את ה-refill.</li>
<li>ה-<code>PEXPIRE</code> גורם למפתחות לא פעילים להיעלם — הזיכרון גדל רק לפי מפתחות <em>פעילים</em>.</li>
</ul>`
      }
    },
    {
      h: { en: "Where to place the limiter", he: "איפה ממקמים את ה-limiter" },
      body: {
        en: `<p>Rate limiting is layered, each layer protecting against something different:</p>
<ol>
<li><strong>Edge (CDN/WAF — Cloudflare, AWS WAF)</strong>: coarse per-IP limits and DDoS protection. Stops floods before they cost you compute.</li>
<li><strong>API gateway (Envoy global rate limit service, Kong, NGINX + Redis)</strong>: the main business limits — per API key, per plan tier, per route. One place, consistent headers, rules managed centrally.</li>
<li><strong>Service-level / in-process</strong>: concurrency limits and load shedding to protect a specific downstream (e.g. max 200 in-flight DB queries), adaptive limits (Netflix concurrency-limits).</li>
</ol>
<p>Putting business limits inside each microservice duplicates logic and makes headers inconsistent; putting everything at the edge loses knowledge of API keys and plans. The gateway is the sweet spot.</p>
<blockquote>💡 Distinguish <strong>rate limiting</strong> (fairness/quotas per client) from <strong>load shedding</strong> (protecting the system when overloaded regardless of who's calling). Seniors mention both.</blockquote>`,
        he: `<p>Rate limiting בנוי בשכבות, וכל שכבה מגינה מפני משהו אחר:</p>
<ol>
<li><strong>Edge ‏(CDN/WAF — Cloudflare, ‏AWS WAF)</strong>: limits גסים לפי IP והגנת DDoS. עוצר הצפות לפני שהן עולות לך ב-compute.</li>
<li><strong>API gateway ‏(Envoy global rate limit service, ‏Kong, ‏NGINX + Redis)</strong>: ה-limits העסקיים העיקריים — לפי API key, לפי tier של התוכנית, לפי route. מקום אחד, headers עקביים, חוקים מנוהלים מרכזית.</li>
<li><strong>ברמת השירות / in-process</strong>: concurrency limits ו-load shedding כדי להגן על downstream ספציפי (למשל מקסימום 200 שאילתות DB במקביל), adaptive limits ‏(Netflix concurrency-limits).</li>
</ol>
<p>לשים limits עסקיים בתוך כל microservice משכפל לוגיקה ויוצר headers לא עקביים; לשים הכל ב-edge מאבד את ההיכרות עם API keys ותוכניות. ה-gateway הוא ה-sweet spot.</p>
<blockquote>💡 תבחין בין <strong>rate limiting</strong> (הוגנות ומכסות לכל לקוח) לבין <strong>load shedding</strong> (הגנה על המערכת בעומס, בלי קשר למי קורא). סניורים מזכירים את שניהם.</blockquote>`
      }
    },
    {
      h: { en: "Failure modes and hot keys", he: "Failure modes ו-hot keys" },
      body: {
        en: `<ul>
<li><strong>Redis down or slow</strong>: wrap the call in a tight timeout (e.g. 5 ms) and a circuit breaker. Default to <strong>fail open</strong> for a general API (availability of the product beats perfect quotas), but keep a <strong>local in-memory fallback limiter</strong> per gateway (limit ÷ number of gateways) so abuse is still bounded. Fail closed only for security-sensitive limits like login attempts or OTP sends.</li>
<li><strong>Redis failover</strong>: replica promotion may lose a few hundred ms of counter updates — acceptable; counters are soft state.</li>
<li><strong>Hot key</strong>: one huge customer at 50K req/s lands on one shard. Options: local token pre-fetch (each gateway grabs a batch of 100 tokens and spends them locally — fewer Redis calls, slight inaccuracy), or split the key into N sub-buckets each with limit/N.</li>
<li><strong>Network cost</strong>: if 1 ms per request is too much, use an <strong>async/approximate</strong> mode: gateways count locally and sync deltas to Redis every 100 ms; trade up to ~10% overshoot for zero hot-path latency.</li>
</ul>`,
        he: `<ul>
<li><strong>Redis למטה או איטי</strong>: עוטפים את הקריאה ב-timeout הדוק (למשל 5ms) וב-circuit breaker. ברירת מחדל ל-API כללי היא <strong>fail open</strong> (זמינות המוצר חשובה יותר ממכסות מושלמות), אבל מחזיקים <strong>limiter מקומי בזיכרון</strong> בכל gateway כ-fallback ‏(limit ÷ מספר ה-gateways), כך שה-abuse עדיין חסום. ‏Fail closed רק ל-limits רגישים לאבטחה כמו ניסיונות login או שליחת OTP.</li>
<li><strong>Failover של Redis</strong>: קידום replica עלול לאבד כמה מאות ms של עדכוני counters — מקובל; counters הם soft state.</li>
<li><strong>Hot key</strong>: לקוח ענק אחד ב-50K בקשות בשנייה נוחת על shard אחד. אפשרויות: pre-fetch מקומי של tokens (כל gateway לוקח batch של 100 tokens ומוציא אותם מקומית — פחות קריאות ל-Redis, קצת אי-דיוק), או פיצול המפתח ל-N sub-buckets כל אחד עם limit/N.</li>
<li><strong>עלות רשת</strong>: אם 1ms לבקשה זה יותר מדי, עוברים למצב <strong>אסינכרוני/משוער</strong>: ה-gateways סופרים מקומית ומסנכרנים deltas ל-Redis כל 100ms; משלמים ב-overshoot של עד ~10% ומקבלים אפס latency במסלול החם.</li>
</ul>`
      }
    }
  ],
  tradeoffs: [
    { en: "Accuracy vs latency: centralized Redis check is accurate (~1 ms); local counters with periodic sync are free on the hot path but overshoot.",
      he: "דיוק מול latency: בדיקה מרכזית ב-Redis מדויקת (~1ms); counters מקומיים עם סנכרון תקופתי חינמיים במסלול החם אבל עושים overshoot." },
    { en: "Fail open vs fail closed: open protects availability, closed protects backends and security. Choose per rule.",
      he: "Fail open מול fail closed: ‏open מגן על availability, ‏closed מגן על ה-backends ועל אבטחה. בוחרים לכל חוק בנפרד." },
    { en: "Token bucket allows bursts (friendly to clients, harder on backends); leaky bucket / sliding window gives smoother load.",
      he: "Token bucket מאפשר bursts (ידידותי ללקוחות, קשה יותר על ה-backends); ‏leaky bucket או sliding window נותנים עומס חלק יותר." },
    { en: "Global limits across regions need cross-region coordination (slow); usually split the quota per region (e.g. 60/40) and accept imprecision.",
      he: "Limits גלובליים בין regions דורשים תיאום חוצה regions (איטי); בדרך כלל מחלקים את המכסה לכל region (למשל 60/40) ומקבלים אי-דיוק." }
  ],
  followUps: [
    { q: { en: "How would you enforce a global limit for a customer hitting both US and EU regions?",
           he: "איך היית אוכף limit גלובלי ללקוח שפונה גם ל-US וגם ל-EU?" },
      a: { en: "Synchronous cross-region checks add ~80 ms — unacceptable. Options: (1) static split of the quota per region based on historical traffic; (2) each region enforces locally and asynchronously gossips its consumption to the others every ~1s, adjusting local allowances (eventually consistent, small overshoot); (3) pin the customer's API key to a home region. Most real systems do (1) or (2).",
           he: "בדיקה סינכרונית בין regions מוסיפה ~80ms — לא מקובל. אפשרויות: (1) חלוקה סטטית של המכסה בין regions לפי תעבורה היסטורית; (2) כל region אוכף מקומית ומפיץ אסינכרונית את הצריכה שלו לאחרים כל ~שנייה, ומתאים את ההקצאה המקומית (eventually consistent, ‏overshoot קטן); (3) לקבע את ה-API key של הלקוח ל-home region. רוב המערכות האמיתיות עושות (1) או (2)." } },
    { q: { en: "A client complains they got 429s while staying under 1,000/min. Why might that happen?",
           he: "לקוח מתלונן שהוא קיבל 429 למרות שהוא מתחת ל-1,000 בדקה. למה זה יכול לקרות?" },
      a: { en: "Their requests were bursty: token bucket with burst capacity 200 refuses a 500-request spike even if the minute total is under 1,000. Or several rules matched (per-route limit stricter than per-key), retries from their SDK doubled traffic, or clock/window alignment differs from how they count. Fix: return which rule fired in a header, document burst, expose X-RateLimit-Remaining so clients can pace.",
           he: "הבקשות שלהם הגיעו ב-bursts: ‏token bucket עם קיבולת burst של 200 דוחה spike של 500 בקשות גם אם הסך לדקה מתחת ל-1,000. או שכמה חוקים תפסו (limit לפי route מחמיר יותר מלפי key), retries מה-SDK שלהם הכפילו תעבורה, או שיישור החלונות שונה מאיך שהם סופרים. הפתרון: להחזיר ב-header איזה חוק הופעל, לתעד את ה-burst ולחשוף X-RateLimit-Remaining כדי שהלקוחות יוכלו לווסת." } },
    { q: { en: "Why not just use the rate-limit plugin of NGINX with local counters?",
           he: "למה לא פשוט להשתמש ב-plugin של rate limit ב-NGINX עם counters מקומיים?" },
      a: { en: "NGINX limit_req keeps state per instance. With 100 gateways and a round-robin LB, a client effectively gets 100× the limit (or limit/100 if you divide), and autoscaling changes the math constantly. It's fine as a coarse per-IP protection layer, not for accurate per-customer quotas. For those you need shared state (Redis) or consistent-hash routing of each key to one gateway.",
           he: "limit_req של NGINX מחזיק state לכל instance. עם 100 gateways ו-LB ב-round-robin, לקוח מקבל בפועל פי 100 מה-limit (או limit/100 אם מחלקים), ו-autoscaling משנה את החשבון כל הזמן. זה מצוין כשכבת הגנה גסה לפי IP, לא למכסות מדויקות ללקוח. בשביל זה צריך state משותף (Redis) או routing עם consistent hash של כל key ל-gateway אחד." } },
    { q: { en: "How do you test and roll out a new, stricter limit safely?",
           he: "איך בודקים ומשיקים limit חדש ומחמיר יותר בבטחה?" },
      a: { en: "Shadow mode first: evaluate the new rule, emit metrics/logs of would-be 429s, but don't enforce. Look at which customers would be affected, notify them, then enforce gradually (percentage of keys or one tier at a time) with a kill switch in the rules config. Alert on a sudden spike in 429 rate per rule.",
           he: "קודם shadow mode: מחשבים את החוק החדש, מוציאים metrics ו-logs על 429 שהיו קורים, אבל לא אוכפים. בודקים אילו לקוחות היו נפגעים, מודיעים להם, ואז אוכפים בהדרגה (אחוז מה-keys או tier אחד בכל פעם) עם kill switch בקונפיגורציית החוקים. ומתריעים על קפיצה פתאומית ב-429 rate לכל חוק." } }
  ],
  related: ["arch-api-gateway", "arch-resilience", "arch-caching", "net-proxies-cdn", "obs-metrics"]
});

// ---------------------------------------------------------------- 4. Notification system
window.INFRA.designs.push({
  id: "sd-notification-system", icon: "🔔", level: 2,
  title: { en: "Notification System (push, email, SMS)", he: "מערכת Notifications (push, email, SMS)" },
  prompt: {
    en: "Design a notification service that other teams call to send push notifications, emails and SMS to our users. It must handle both transactional messages (password reset, order shipped) and large marketing campaigns.",
    he: "תתכנן notification service ששאר הצוותים בחברה קוראים לו כדי לשלוח push, email ו-SMS למשתמשים. הוא צריך לתמוך גם בהודעות transactional (איפוס סיסמה, ההזמנה נשלחה) וגם בקמפיינים שיווקיים גדולים."
  },
  clarify: [
    { en: "Which channels are in scope: iOS/Android push, email, SMS, in-app? Do we build delivery ourselves or use providers (APNs, FCM, SES/SendGrid, Twilio)?", he: "אילו ערוצים ב-scope: push ל-iOS/Android, email, SMS, in-app? אנחנו בונים delivery בעצמנו או עובדים מול providers (APNs, FCM, SES/SendGrid, Twilio)?" },
    { en: "What volume? Daily notifications, and how big is the largest campaign blast (e.g. 50M users at once)?", he: "מה ה-volume? כמה הודעות ביום, וכמה גדול הקמפיין הכי גדול (למשל 50M משתמשים בבת אחת)?" },
    { en: "Latency expectations per type? An OTP must arrive in seconds; a weekly digest can take an hour.", he: "מה ה-latency הנדרש לכל סוג? OTP חייב להגיע תוך שניות, digest שבועי יכול לקחת שעה." },
    { en: "Do we own user preferences (opt-out, quiet hours, per-category settings) and legal compliance (unsubscribe links, GDPR)?", he: "אנחנו אחראים על user preferences (opt-out, quiet hours, הגדרות לפי קטגוריה) ועל compliance (קישור unsubscribe, GDPR)?" },
    { en: "Is at-least-once acceptable, or is a duplicate SMS/charge a real problem? Do callers need delivery status back?", he: "at-least-once מספיק, או ש-SMS כפול זו בעיה אמיתית? הצוותים הקוראים צריכים לקבל delivery status בחזרה?" },
    { en: "Do we need templating and localization, or do callers send the final rendered text?", he: "צריך templating ו-localization, או שהקוראים שולחים טקסט סופי?" }
  ],
  functional: [
    { en: "Send API: callers send (user_id or segment, template, params, priority, idempotency key); we resolve channels and devices.", he: "Send API: הקורא שולח (user_id או segment, template, params, priority, idempotency key) ואנחנו מחליטים על ערוצים ומכשירים." },
    { en: "Respect user preferences: opt-outs per channel and category, quiet hours by timezone, frequency caps.", he: "לכבד user preferences: opt-out לפי ערוץ וקטגוריה, quiet hours לפי timezone, frequency caps." },
    { en: "Templating with localization; scheduled sends and campaign blasts to segments.", he: "Templates עם localization; שליחה מתוזמנת וקמפיינים ל-segments." },
    { en: "Track status per message (queued, sent, delivered, opened, failed) and expose it via API/webhooks.", he: "מעקב status לכל הודעה (queued, sent, delivered, opened, failed) וחשיפה דרך API/webhooks." },
    { en: "Device token registry: register/unregister push tokens, clean up invalid ones.", he: "רישום device tokens: register/unregister ל-push tokens וניקוי tokens לא תקפים." }
  ],
  nonFunctional: [
    { en: "Scale: ~500M notifications/day, campaign bursts up to ~80K/s.", he: "Scale: בערך 500M הודעות ביום, bursts של קמפיינים עד ~80K/s." },
    { en: "Latency: P99 &lt; 5s from API to provider for high-priority (OTP); best-effort minutes for bulk.", he: "Latency: P99 מתחת ל-5 שניות מה-API עד ל-provider בהודעות high-priority (OTP); לבאלק מספיק דקות." },
    { en: "Reliability: no message lost once accepted (durable queue); effectively-once to the user via idempotency.", he: "Reliability: אף הודעה לא הולכת לאיבוד אחרי שקיבלנו אותה (queue עמיד); effectively-once למשתמש בעזרת idempotency." },
    { en: "Isolation: a marketing blast must never delay password resets; one slow provider must not block others.", he: "Isolation: קמפיין שיווקי אסור שיעכב איפוס סיסמה; provider איטי אחד לא חוסם את השאר." },
    { en: "Availability 99.95% for the ingest API; graceful degradation if a provider is down.", he: "Availability של 99.95% ל-ingest API; degradation מסודר כש-provider נופל." }
  ],
  estimates: {
    en: `<p><strong>Throughput.</strong> 500M notifications/day ÷ 86,400 s ≈ <strong>5,800/s average</strong>. Daily peak ~3x ≈ 17K/s. A campaign to 50M users drained in 10 minutes = 50,000,000 ÷ 600 ≈ <strong>83K/s</strong> — this burst, not the average, sizes the workers and the provider quotas.</p>
<p><strong>Channel mix (assume).</strong> 70% push (350M), 25% email (125M), 5% SMS (25M). SMS at ~$0.01-0.05 each = $250K-1.25M/day — SMS is a <em>cost</em> problem, so dedup and preference checks are money.</p>
<p><strong>Storage.</strong> A notification log row ≈ 500 B (ids, channel, status, timestamps, template id, params). 500M × 500 B = <strong>250 GB/day</strong>; 30 days hot ≈ 7.5 TB → Cassandra/DynamoDB, older rows to S3. Preferences: 200M users × ~1 KB = 200 GB, read-heavy → cache in Redis. Device tokens: 200M users × 2 devices × 200 B = 80 GB.</p>
<p><strong>Kafka.</strong> 83K msg/s × 1 KB payload ≈ 83 MB/s ingress at peak — a modest cluster (each broker handles ~100+ MB/s), partitions sized for consumer parallelism: e.g. 200 partitions on the bulk push topic.</p>
<p><strong>Provider limits.</strong> APNs/FCM are effectively high-throughput over HTTP/2 multiplexed connections; SES/SendGrid and Twilio have per-account rate limits (e.g. hundreds-thousands/s) — our workers must rate-limit <em>outbound</em> to stay under quota.</p>`,
    he: `<p><strong>Throughput.</strong> 500M הודעות ביום ÷ 86,400 שניות ≈ <strong>5,800 בשנייה בממוצע</strong>. Peak יומי בערך פי 3 ≈ 17K/s. קמפיין ל-50M משתמשים שצריך להתרוקן תוך 10 דקות = 50,000,000 ÷ 600 ≈ <strong>83K/s</strong> — ה-burst הזה, לא הממוצע, קובע כמה workers ואיזה quota צריך מול ה-providers.</p>
<p><strong>חלוקה לערוצים (הנחה).</strong> 70% push (350M), 25% email (125M), 5% SMS (25M). SMS עולה ~$0.01-0.05 ליחידה = $250K עד $1.25M ביום — כלומר SMS זו בעיית <em>עלות</em>, ו-dedup ובדיקת preferences חוסכים כסף אמיתי.</p>
<p><strong>Storage.</strong> שורת log להודעה ≈ 500 B. 500M × 500 B = <strong>250 GB ביום</strong>; 30 יום hot ≈ 7.5 TB → Cassandra/DynamoDB, ומה שישן ל-S3. Preferences: 200M משתמשים × 1 KB = 200 GB, הרבה קריאות → cache ב-Redis. Device tokens: 200M × 2 מכשירים × 200 B = 80 GB.</p>
<p><strong>Kafka.</strong> 83K הודעות/s × 1 KB ≈ 83 MB/s ב-peak — קלאסטר צנוע (broker מחזיק 100+ MB/s בקלות). את מספר ה-partitions קובעים לפי ה-parallelism של ה-consumers, למשל 200 partitions ל-topic של bulk push.</p>
<p><strong>מגבלות providers.</strong> APNs/FCM מחזיקים throughput גבוה על HTTP/2 multiplexing; ל-SES/SendGrid ול-Twilio יש rate limits לכל account — ה-workers שלנו חייבים לעשות rate limiting <em>יוצא</em> כדי לא לחרוג מה-quota.</p>`
  },
  api: `POST /v1/notifications
  Idempotency-Key: 7f3a...
  {user_id | segment_id, template_id, params{}, category, priority: high|normal|bulk,
   channels?: [push,email,sms], send_at?}
  -> 202 {notification_id, status: "queued"}

GET  /v1/notifications/{id}            -> {id, per_channel_status[], attempts}
POST /v1/campaigns {segment_id, template_id, send_at, throttle_per_sec}
                                       -> 202 {campaign_id}
PUT  /v1/users/{id}/preferences {category -> {push, email, sms}, quiet_hours, tz}
POST /v1/users/{id}/devices {platform: ios|android, token, app_version}
DELETE /v1/users/{id}/devices/{token}
Webhook -> caller: {notification_id, channel, status, ts}`,
  dataModel: `notifications (Cassandra, PK notification_id, TTL 30d)
  notification_id, idempotency_key, caller, user_id, template_id, params,
  category, priority, created_at

deliveries (Cassandra, PK (notification_id), CK channel)
  channel, provider, provider_msg_id, status, attempts, last_error, updated_at

idempotency (Redis SETNX key=caller:idem_key -> notification_id, TTL 24h)

preferences (Postgres, cached in Redis)
  user_id PK, tz, quiet_start, quiet_end, opt_outs jsonb  {marketing:{sms:false}}

devices (Postgres / DynamoDB)
  user_id, token PK, platform, app_version, last_seen, invalid_at

templates (Postgres) template_id, version, locale, channel, subject, body`,
  diagram: `  Callers (orders, auth, marketing)
        |
        v
 +----------------+   SETNX idem key   +-------+
 | Notification   |------------------->| Redis |
 | API (stateless)|                    +-------+
 +-------+--------+
         | validate, persist, enqueue
         v
 +-------------------------------- Kafka -----------------------------+
 |  notify.high      notify.normal      notify.bulk   (by priority)   |
 +-------+-----------------+------------------+-----------------------+
         v                 v                  v
 +-------------------------------------------------+
 | Router workers: load prefs (Redis/Postgres),     |
 | quiet hours, freq caps, render template,         |
 | fan out per channel                              |
 +----+-------------------+-------------------+-----+
      v                   v                   v
  push.q              email.q              sms.q        (Kafka topics)
      |                   |                   |
 +----v-----+        +----v-----+        +----v-----+
 | Push     |        | Email    |        | SMS      |   outbound rate limit,
 | senders  |        | senders  |        | senders  |   retries w/ backoff,
 +----+-----+        +----+-----+        +----+-----+   circuit breakers
      v                   v                   v
  APNs / FCM         SES / SendGrid       Twilio / backup SMS
      |                   |                   |
      +-------- delivery callbacks / webhooks-+
                          v
              Status updater -> Cassandra -> webhooks to callers
      retries exhausted -> DLQ topic -> alert + manual replay`,
  deepDives: [
    {
      h: { en: "Priority isolation: don't let marketing starve OTPs", he: "Isolation לפי priority: שהשיווק לא ירעיב את ה-OTP" },
      body: {
        en: `<p>The single most important design choice is <strong>separate queues and worker pools per priority</strong>. If a 50M-user campaign and a password reset share one Kafka topic, the reset sits behind 50M messages — minutes of lag for a user staring at a login screen.</p>
<ul><li><code>notify.high</code>: OTP, security alerts, transactional. Small, always over-provisioned worker pool, alert on consumer lag &gt; a few seconds.</li>
<li><code>notify.normal</code>: social and product notifications.</li>
<li><code>notify.bulk</code>: campaigns, consumed with a deliberate throttle (e.g. 80K/s) so we don't blow provider quotas.</li></ul>
<p>Isolation must also apply per <em>channel</em> downstream: if Twilio is slow, SMS workers back up but push and email keep flowing. Separate topics plus separate consumer groups give you bulkheads for free.</p>
<blockquote>💡 Real world: many companies also use separate provider accounts/sub-accounts for transactional vs marketing email, so a spam complaint spike from a campaign doesn't hurt the sender reputation of password-reset emails.</blockquote>`,
        he: `<p>ההחלטה הכי חשובה בתכנון היא <strong>queues ו-worker pools נפרדים לכל priority</strong>. אם קמפיין ל-50M משתמשים ואיפוס סיסמה יושבים על אותו topic ב-Kafka, האיפוס מחכה מאחורי 50M הודעות — דקות של lag למשתמש שבוהה במסך login.</p>
<ul><li><code>notify.high</code>: OTP, התראות אבטחה, transactional. pool קטן עם over-provisioning קבוע, ו-alert כשה-consumer lag עובר כמה שניות.</li>
<li><code>notify.normal</code>: התראות סושיאל ומוצר.</li>
<li><code>notify.bulk</code>: קמפיינים, נצרכים עם throttle מכוון (נגיד 80K/s) כדי לא לשרוף את ה-quota מול ה-providers.</li></ul>
<p>אותו isolation צריך גם ברמת ה-<em>channel</em>: אם Twilio איטי, ה-SMS workers נערמים אבל push ו-email ממשיכים לזרום. topics נפרדים עם consumer groups נפרדים נותנים bulkheads כמעט בחינם.</p>
<blockquote>💡 מהשטח: הרבה חברות מחזיקות גם accounts נפרדים אצל ספק ה-email ל-transactional ול-marketing, כדי שגל spam complaints מקמפיין לא יפגע ב-sender reputation של מיילי איפוס הסיסמה.</blockquote>`
      }
    },
    {
      h: { en: "Retries, idempotency and avoiding duplicates", he: "Retries, idempotency ואיך נמנעים מכפילויות" },
      body: {
        en: `<p>Kafka consumers give <strong>at-least-once</strong>: a worker can send to Twilio, crash before committing the offset, and the message is redelivered. Defense in layers:</p>
<ul><li><strong>Ingest:</strong> callers send an <code>Idempotency-Key</code>; API does <code>SET key notification_id NX EX 86400</code> in Redis. Retry from the caller returns the same id instead of a second message.</li>
<li><strong>Send:</strong> before calling a provider, worker checks the delivery row: if status is already <code>sent</code>, skip. Write <code>sending</code> → call provider → write <code>sent</code> with <code>provider_msg_id</code>. Some providers accept our id as a dedup key (e.g. FCM collapse keys, email Message-ID).</li>
<li><strong>Retry policy:</strong> exponential backoff with jitter (1s, 4s, 16s, 1m, 5m), only on retryable errors (5xx, 429, timeouts). 4xx like invalid token are permanent: mark failed and deactivate the token.</li>
<li><strong>DLQ:</strong> after N attempts, park the message in a dead-letter topic, alert, allow replay.</li></ul>
<p>Retries use delay topics (<code>retry.1m</code>, <code>retry.5m</code>) rather than sleeping in the consumer, so a stuck message doesn't block the partition.</p>`,
        he: `<p>Consumers של Kafka נותנים <strong>at-least-once</strong>: worker יכול לשלוח ל-Twilio, ליפול לפני commit של ה-offset, וההודעה תגיע שוב. ההגנה בשכבות:</p>
<ul><li><strong>Ingest:</strong> הקוראים שולחים <code>Idempotency-Key</code>; ה-API עושה <code>SET key notification_id NX EX 86400</code> ב-Redis. retry של הקורא מחזיר את אותו id במקום הודעה שנייה.</li>
<li><strong>שליחה:</strong> לפני הקריאה ל-provider ה-worker בודק את שורת ה-delivery: אם כבר <code>sent</code> — מדלגים. כותבים <code>sending</code> → קוראים ל-provider → כותבים <code>sent</code> עם ה-<code>provider_msg_id</code>. חלק מה-providers מקבלים מאיתנו מפתח dedup (collapse key ב-FCM, Message-ID במייל).</li>
<li><strong>Retry policy:</strong> exponential backoff עם jitter (1s, 4s, 16s, 1m, 5m), רק על שגיאות retryable (5xx, 429, timeouts). 4xx כמו invalid token זה סופי: מסמנים failed ומבטלים את ה-token.</li>
<li><strong>DLQ:</strong> אחרי N ניסיונות שמים ב-dead-letter topic, מקפיצים alert ומאפשרים replay.</li></ul>
<p>את ה-retries עושים עם delay topics (<code>retry.1m</code>, <code>retry.5m</code>) ולא עם sleep בתוך ה-consumer, כדי שהודעה תקועה לא תחסום את כל ה-partition.</p>`
      }
    },
    {
      h: { en: "User preferences, quiet hours and frequency caps", he: "User preferences, quiet hours ו-frequency caps" },
      body: {
        en: `<p>Every message passes through the router, which reads preferences — at 17K-83K/s that cannot be a Postgres query per message. Preferences live in Postgres (source of truth, rarely written) and are cached in Redis with write-through invalidation; hit ratio is ~99% because the same users get many notifications.</p>
<ul><li><strong>Opt-outs</strong> per (category, channel). Transactional/security categories are non-optional — legally and product-wise.</li>
<li><strong>Quiet hours</strong>: if it's 02:00 in the user's timezone and the message isn't urgent, don't drop it — reschedule it into a delayed queue for 08:00 local.</li>
<li><strong>Frequency caps</strong>: e.g. max 3 marketing pushes/day. Implement as a Redis counter <code>INCR cap:user:marketing:2026-11-12</code> with a TTL, checked in the router.</li>
<li><strong>Campaigns</strong> resolve the segment into user ids in batches (a Spark/SQL job writes ids to a topic) instead of one giant in-memory list.</li></ul>
<blockquote>⚠️ Production tip: the unsubscribe link must work even if the rest of the system is down — compliance (CAN-SPAM, GDPR) cares more about that than about delivery.</blockquote>`,
        he: `<p>כל הודעה עוברת דרך ה-router שקורא preferences — ב-17K-83K בשנייה אי אפשר לעשות query ל-Postgres על כל הודעה. ה-preferences יושבים ב-Postgres (source of truth, כמעט לא משתנים) ו-cached ב-Redis עם invalidation בכתיבה; ה-hit ratio בערך 99% כי אותם משתמשים מקבלים הרבה הודעות.</p>
<ul><li><strong>Opt-outs</strong> לפי (קטגוריה, ערוץ). קטגוריות transactional/אבטחה אי אפשר לכבות — גם משפטית וגם מוצרית.</li>
<li><strong>Quiet hours</strong>: אם עכשיו 02:00 אצל המשתמש וההודעה לא דחופה, לא זורקים אותה — מתזמנים אותה מחדש ב-delayed queue ל-08:00 לפי השעון שלו.</li>
<li><strong>Frequency caps</strong>: למשל מקסימום 3 push שיווקיים ביום. counter ב-Redis <code>INCR cap:user:marketing:2026-11-12</code> עם TTL, נבדק ב-router.</li>
<li><strong>קמפיינים</strong> מפרקים את ה-segment ל-user ids ב-batches (job של Spark/SQL שכותב ל-topic) ולא רשימה ענקית בזיכרון.</li></ul>
<blockquote>⚠️ טיפ מפרודקשן: קישור ה-unsubscribe חייב לעבוד גם כששאר המערכת למטה — ל-compliance (CAN-SPAM, GDPR) זה חשוב יותר מה-delivery עצמו.</blockquote>`
      }
    },
    {
      h: { en: "Provider failures, failover and observability", he: "נפילות של providers, failover ו-observability" },
      body: {
        en: `<p>Third-party providers are our biggest failure source. Each sender wraps its provider in a <strong>circuit breaker</strong> and an outbound <strong>token-bucket rate limiter</strong> sized to the account quota.</p>
<ul><li><strong>SMS/email failover:</strong> keep a secondary provider (Twilio → Vonage, SES → SendGrid). When the breaker opens on the primary, high-priority messages go to the secondary; bulk just waits.</li>
<li><strong>Invalid tokens:</strong> APNs returns 410 Unregistered, FCM returns UNREGISTERED — deactivate those tokens, otherwise ~10-20% of push volume becomes wasted calls over time.</li>
<li><strong>Delivery receipts:</strong> email/SMS providers report delivered/bounced via webhooks; ingest them into a topic and update Cassandra asynchronously.</li></ul>
<table><tr><th>SLI</th><th>Example SLO</th></tr>
<tr><td>High-priority API → provider accepted</td><td>99% &lt; 5 s</td></tr>
<tr><td>Accepted messages eventually sent or explicitly failed</td><td>99.99%</td></tr>
<tr><td>Consumer lag on notify.high</td><td>alert if &gt; 10 s</td></tr></table>
<p>Dashboards per channel/provider: send rate, error rate by code, p99 provider latency, DLQ size, and SMS spend per hour (a cost anomaly is often the first sign of a bug or abuse).</p>`,
        he: `<p>ה-providers החיצוניים הם מקור הנפילות הכי גדול שלנו. כל sender עוטף את ה-provider שלו ב-<strong>circuit breaker</strong> וב-<strong>token bucket rate limiter</strong> יוצא שמכויל ל-quota של ה-account.</p>
<ul><li><strong>Failover ל-SMS/email:</strong> מחזיקים provider משני (Twilio → Vonage, SES → SendGrid). כשה-breaker נפתח על הראשי, הודעות high-priority עוברות למשני; bulk פשוט מחכה.</li>
<li><strong>Tokens לא תקפים:</strong> APNs מחזיר 410 Unregistered ו-FCM מחזיר UNREGISTERED — מבטלים את ה-tokens האלה, אחרת עם הזמן 10-20% מה-push הופכים לקריאות מבוזבזות.</li>
<li><strong>Delivery receipts:</strong> ה-providers מדווחים delivered/bounced ב-webhooks; מכניסים אותם ל-topic ומעדכנים את Cassandra באופן אסינכרוני.</li></ul>
<table><tr><th>SLI</th><th>SLO לדוגמה</th></tr>
<tr><td>High-priority מה-API עד accepted אצל ה-provider</td><td>99% מתחת ל-5 שניות</td></tr>
<tr><td>הודעות שהתקבלו ונשלחו בסוף או נכשלו במפורש</td><td>99.99%</td></tr>
<tr><td>Consumer lag על notify.high</td><td>alert מעל 10 שניות</td></tr></table>
<p>Dashboards לפי channel/provider: קצב שליחה, error rate לפי קוד, p99 latency של ה-provider, גודל ה-DLQ, והוצאות SMS לשעה (אנומליה בעלות היא הרבה פעמים הסימן הראשון לבאג או ל-abuse).</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Kafka vs SQS/RabbitMQ: Kafka gives replay, huge throughput and ordering per partition; SQS gives per-message visibility timeouts and delays out of the box with zero ops. Either works — say why.", he: "Kafka מול SQS/RabbitMQ: Kafka נותן replay, throughput עצום וסדר לכל partition; SQS נותן visibility timeout ו-delay להודעה בודדת בלי שום ops. שניהם עובדים — העיקר להסביר למה בחרת." },
    { en: "At-least-once + idempotency instead of exactly-once: true exactly-once across an external SMS API is impossible; we minimize duplicates and accept a rare double push.", he: "At-least-once + idempotency במקום exactly-once: exactly-once אמיתי מול API חיצוני של SMS לא אפשרי; מצמצמים כפילויות ומקבלים push כפול נדיר." },
    { en: "Rendering templates in the router (central, consistent, cacheable) vs in callers (simpler service, but every team reinvents localization).", he: "Rendering של templates ב-router (מרכזי, עקבי, ניתן ל-cache) מול אצל הקוראים (שירות פשוט יותר, אבל כל צוות ממציא localization מחדש)." },
    { en: "Throttling campaigns protects quotas and downstream app servers (users tapping a push all at once = thundering herd) at the cost of slower campaign completion.", he: "Throttling לקמפיינים שומר על ה-quota ועל שרתי האפליקציה (כל המשתמשים לוחצים על ה-push באותו רגע = thundering herd), במחיר של קמפיין שמסתיים לאט יותר." }
  ],
  followUps: [
    {
      q: { en: "A campaign push goes to 50M users and the app backend falls over when they all open the app. What do you do?", he: "קמפיין push יוצא ל-50M משתמשים וה-backend של האפליקציה קורס כשכולם פותחים אותה. מה עושים?" },
      a: { en: "That's a self-inflicted thundering herd. Throttle the send rate to what the backend can absorb (e.g. if 5% tap within a minute, 80K/s sends = 4K extra sessions/s — size it), spread by timezone and randomized jitter, pre-warm caches for the deep-linked content, and coordinate with autoscaling (scale up before the campaign). The campaign API should take a throttle_per_sec parameter, owned by the platform team, not the marketer.", he: "זה thundering herd שעשינו לעצמנו. מגבילים את קצב השליחה למה שה-backend מסוגל לספוג (אם 5% לוחצים תוך דקה, 80K/s שליחות = 4K sessions נוספים בשנייה — מתכננים לפי זה), מפזרים לפי timezone עם jitter אקראי, מחממים cache לתוכן שה-deep link מוביל אליו, ומתאמים עם ה-autoscaling (scale up לפני הקמפיין). ל-API של הקמפיין צריך פרמטר throttle_per_sec שה-platform team שולט בו, לא איש השיווק." }
    },
    {
      q: { en: "How do you guarantee a user never receives the same SMS twice?", he: "איך מבטיחים שמשתמש אף פעם לא יקבל את אותו SMS פעמיים?" },
      a: { en: "You can't fully guarantee it: if the worker calls Twilio and times out, we don't know whether it was sent. We reduce it: idempotency key at ingest, a 'sending' state checked before calling, a provider-side idempotency/dedup where supported, and on ambiguous timeouts for SMS we prefer NOT to retry low-value messages (at-most-once) while OTPs retry (a duplicate OTP is harmless, a missing one blocks login). Choosing per-category delivery semantics is the senior answer.", he: "אי אפשר להבטיח לגמרי: אם ה-worker קרא ל-Twilio וקיבל timeout, אנחנו לא יודעים אם זה נשלח. מצמצמים: idempotency key ב-ingest, state של 'sending' שנבדק לפני הקריאה, dedup בצד ה-provider איפה שנתמך, ובמקרה של timeout עמום ב-SMS מעדיפים לא לעשות retry להודעות בעלות ערך נמוך (at-most-once) בעוד ש-OTP כן עושה retry (OTP כפול לא מזיק, OTP חסר חוסם login). לבחור delivery semantics לפי קטגוריה — זו התשובה הסניורית." }
    },
    {
      q: { en: "Kafka partitions by user_id or randomly? Does ordering matter?", he: "Partition ב-Kafka לפי user_id או רנדומלי? סדר בכלל חשוב?" },
      a: { en: "For most notifications ordering barely matters, so random/round-robin gives the best load spread. But keying by user_id gives per-user ordering and lets a single consumer enforce frequency caps without races — at the cost of hot partitions for very active users. A common compromise: key by user_id on notify.normal (social, where 'X liked' then 'X unliked' ordering matters), random on bulk.", he: "לרוב ההתראות הסדר כמעט לא משנה, אז random/round-robin נותן פיזור עומס הכי טוב. אבל key לפי user_id נותן סדר לכל משתמש ומאפשר ל-consumer אחד לאכוף frequency caps בלי race conditions — במחיר של hot partitions למשתמשים מאוד פעילים. פשרה נפוצה: key לפי user_id ב-notify.normal (סושיאל, שם הסדר חשוב), ו-random ב-bulk." }
    },
    {
      q: { en: "How would you make the service survive a full region outage?", he: "איך השירות שורד נפילה של region שלם?" },
      a: { en: "Run the stateless API, routers and senders active-active in two regions behind GSLB; each region has its own Kafka cluster (cross-region replication with MirrorMaker only for the status/log stream). Idempotency keys must be global — use DynamoDB global tables or accept a small duplicate window during failover. Preferences are read-mostly, so async replicas in each region are fine. Messages in the dead region's Kafka are delayed until recovery unless replicated — acceptable for bulk, so high-priority callers should retry to the healthy region.", he: "מריצים את ה-API, ה-routers וה-senders (כולם stateless) active-active בשני regions מאחורי GSLB; לכל region קלאסטר Kafka משלו (replication בין regions עם MirrorMaker רק לזרם ה-status/log). ה-idempotency keys צריכים להיות גלובליים — DynamoDB global tables, או לקבל חלון קטן של כפילויות בזמן failover. Preferences הם בעיקר קריאה, אז async replicas בכל region זה מספיק. הודעות שתקועות ב-Kafka של ה-region שנפל יתעכבו עד שיחזור — מקובל ל-bulk, ולכן קוראים של high-priority צריכים לעשות retry ל-region הבריא." }
    }
  ],
  related: ["arch-queues", "arch-brokers", "arch-resilience", "arch-event-driven", "arch-caching", "rel-sli-slo-sla"]
});

// ---------------------------------------------------------------- 5. Chat
window.INFRA.designs.push({
  id: "sd-chat", icon: "💬", level: 2,
  title: { en: "Chat / Messaging App (WhatsApp-like)", he: "אפליקציית צ'אט (בסגנון WhatsApp)" },
  prompt: {
    en: "Design a messaging app like WhatsApp: 1:1 and group chats, online presence, and sent/delivered/read receipts. Messages must arrive in real time and work for users who are offline.",
    he: "תתכנן אפליקציית הודעות כמו WhatsApp: צ'אטים 1:1 וקבוצות, presence (מחובר/לא מחובר), ואישורי sent/delivered/read. הודעות צריכות להגיע ב-real time ולעבוד גם למשתמשים שכרגע offline."
  },
  clarify: [
    { en: "Scale: how many DAU and messages per user per day? Max group size?", he: "Scale: כמה DAU וכמה הודעות למשתמש ביום? מה גודל קבוצה מקסימלי?" },
    { en: "Text only, or media (images, video, voice)? Media changes storage and bandwidth completely.", he: "רק טקסט, או גם media (תמונות, וידאו, הודעות קוליות)? media משנה לגמרי את ה-storage וה-bandwidth." },
    { en: "Do we store message history on the server forever, or only until delivered (WhatsApp-style)? Multi-device sync?", he: "שומרים היסטוריה בשרת לתמיד, או רק עד שנמסרה (כמו WhatsApp)? צריך sync בין כמה מכשירים?" },
    { en: "End-to-end encryption required? (It means the server can't read or search content.)", he: "צריך end-to-end encryption? (המשמעות: השרת לא יכול לקרוא או לחפש בתוכן.)" },
    { en: "Ordering guarantee: per conversation only, or global? Is presence 'last seen' needed for groups too?", he: "סדר הודעות: רק בתוך שיחה, או גלובלי? צריך presence/'last seen' גם בקבוצות?" }
  ],
  functional: [
    { en: "Send/receive 1:1 and group messages (groups up to ~1,000 members) in real time.", he: "שליחה וקבלה של הודעות 1:1 ובקבוצות (עד ~1,000 חברים) ב-real time." },
    { en: "Offline delivery: messages queue for offline users and are delivered on reconnect, plus a push notification.", he: "Offline delivery: הודעות נשמרות למשתמש offline ונמסרות כשהוא מתחבר, יחד עם push notification." },
    { en: "Receipts: sent (server ack), delivered (recipient device ack), read.", he: "אישורים: sent (ack מהשרת), delivered (ack מהמכשיר של הנמען), read." },
    { en: "Presence: online / last seen, typing indicators.", he: "Presence: online / last seen, ואינדיקציית 'מקליד'." },
    { en: "Message history sync when a user opens a conversation or adds a device.", he: "Sync של היסטוריית הודעות כשפותחים שיחה או מוסיפים מכשיר." }
  ],
  nonFunctional: [
    { en: "Scale: 500M DAU, ~20B messages/day, ~250M concurrent connections at peak.", he: "Scale: 500M DAU, בערך 20B הודעות ביום, ~250M חיבורים פתוחים ב-peak." },
    { en: "Low latency: P99 &lt; 300 ms end-to-end when both users are online in the same region.", he: "Latency נמוך: P99 מתחת ל-300ms מקצה לקצה כששני המשתמשים online באותו region." },
    { en: "Durability: once the server acks 'sent', the message is never lost.", he: "Durability: ברגע שהשרת החזיר 'sent', ההודעה לא הולכת לאיבוד אף פעם." },
    { en: "Ordering: messages in a conversation appear in the same order on all devices.", he: "סדר: הודעות בתוך שיחה מופיעות באותו סדר בכל המכשירים." },
    { en: "High availability over strong global consistency; presence can be eventually consistent.", he: "High availability על פני consistency גלובלי חזק; presence יכול להיות eventually consistent." }
  ],
  estimates: {
    en: `<p><strong>Messages.</strong> 500M DAU × 40 messages/day = <strong>20B messages/day</strong>. 20 × 10^9 ÷ 86,400 ≈ <strong>230K msg/s average</strong>, peak ~2x ≈ <strong>500K msg/s</strong>. Group messages fan out: if the average delivered copies per message is ~3, outbound deliveries ≈ 1.5M/s at peak.</p>
<p><strong>Connections.</strong> ~50% of DAU online at peak = <strong>250M concurrent WebSocket connections</strong>. A tuned gateway (epoll, Go/Erlang/Netty, ~10-20 KB memory per idle connection) holds ~200K-500K connections; at 250K/box that's 250M ÷ 250K = <strong>1,000 gateway servers</strong>, plus 30% headroom for deploys and failures. (WhatsApp famously ran ~2M connections per Erlang server.) Heartbeats: 250M ÷ 30 s interval ≈ 8M pings/s — cheap but non-zero.</p>
<p><strong>Storage.</strong> A text message ≈ 100 B body + ~100 B metadata = 200 B. 20B × 200 B = <strong>4 TB/day</strong>, ≈ 1.5 PB/year if we keep history (×3 replication = 4.5 PB). Media is separate: if 5% of messages carry a 200 KB image, that's 1B × 200 KB = 200 TB/day in S3 behind a CDN — media dominates.</p>
<p><strong>Bandwidth.</strong> 500K msg/s × 200 B ≈ 100 MB/s in; with fan-out ~300 MB/s out — trivial compared to media.</p>`,
    he: `<p><strong>הודעות.</strong> 500M DAU × 40 הודעות ביום = <strong>20B הודעות ביום</strong>. 20 × 10^9 ÷ 86,400 ≈ <strong>230K הודעות בשנייה בממוצע</strong>, peak בערך פי 2 ≈ <strong>500K/s</strong>. בקבוצות יש fan-out: אם בממוצע כל הודעה נמסרת ל-3 מכשירים, ה-deliveries היוצאים ≈ 1.5M/s ב-peak.</p>
<p><strong>חיבורים.</strong> ~50% מה-DAU online ב-peak = <strong>250M חיבורי WebSocket במקביל</strong>. gateway מכויל (epoll, Go/Erlang/Netty, בערך 10-20 KB זיכרון לחיבור idle) מחזיק 200K-500K חיבורים; ב-250K לשרת זה 250M ÷ 250K = <strong>1,000 שרתי gateway</strong>, ועוד 30% headroom ל-deploys ונפילות. (WhatsApp הריצו בזמנו ~2M חיבורים לשרת Erlang.) Heartbeats: 250M ÷ 30 שניות ≈ 8M pings בשנייה — זול, אבל לא אפס.</p>
<p><strong>Storage.</strong> הודעת טקסט ≈ 100 B תוכן + ~100 B metadata = 200 B. 20B × 200 B = <strong>4 TB ביום</strong>, ≈ 1.5 PB בשנה אם שומרים היסטוריה (×3 replication = 4.5 PB). Media זה סיפור נפרד: אם 5% מההודעות כוללות תמונה של 200 KB, זה 1B × 200 KB = 200 TB ביום ב-S3 מאחורי CDN — ה-media שולט בעלויות.</p>
<p><strong>Bandwidth.</strong> 500K הודעות/s × 200 B ≈ 100 MB/s נכנס; עם fan-out ~300 MB/s יוצא — זניח לעומת media.</p>`
  },
  api: `WebSocket wss://chat.example.com/ws   (auth: JWT on connect)

client -> server frames:
  {type:"send", client_msg_id, conv_id, body|media_ref}
  {type:"ack", conv_id, up_to_seq}                 // delivered
  {type:"read", conv_id, up_to_seq}
  {type:"typing", conv_id}
  {type:"ping"}
server -> client frames:
  {type:"sent", client_msg_id, conv_id, seq, ts}   // server ack
  {type:"msg", conv_id, seq, sender_id, body, ts}
  {type:"receipt", conv_id, user_id, delivered_seq|read_seq}
  {type:"presence", user_id, online, last_seen}

REST:
GET  /v1/conversations/{id}/messages?after_seq=1200&limit=50
POST /v1/media -> {upload_url (pre-signed S3), media_ref}
POST /v1/groups {name, members[]}   PUT /v1/groups/{id}/members`,
  dataModel: `messages (Cassandra)
  PK conv_id, CK seq DESC
  seq bigint, msg_id uuid, sender_id, body blob, media_ref, ts
  -- one partition per conversation (bucket by month for huge groups)

conversations (Postgres/Cassandra)
  conv_id PK, type 1:1|group, members[], last_seq

user_inbox / sync state (Cassandra)
  PK user_id, CK conv_id -> delivered_seq, read_seq

session registry (Redis)
  user:{id}:devices -> {device_id: gateway_host}  TTL refreshed by heartbeat

presence (Redis)  presence:{user_id} -> online | last_seen_ts   TTL 60s
devices (Postgres) user_id, device_id, push_token, platform`,
  diagram: `  Mobile / Web clients
      |  WebSocket (TLS)
      v
 +-----------+        L4 LB (sticky per connection)
 |  LB       |
 +-----+-----+
       v
 +-----------------+   register user->gateway   +----------------+
 | Gateway fleet   |--------------------------->| Redis: session |
 | (~1000 nodes,   |                            | + presence     |
 |  holds sockets) |                            +----------------+
 +----+------^-----+
      | send |  deliver
      v      |
 +-----------------+  1. assign seq (per conv)
 | Chat service    |  2. persist  ------------> Cassandra (messages)
 | (stateless)     |  3. ack 'sent' to sender
 +--------+--------+  4. publish
          v
 +--------------------- Kafka (topic: msgs, key=conv_id) --------+
          v
 +-----------------+  lookup recipients' gateways in Redis
 | Fan-out workers |------> online: RPC to gateway -> socket push
 +--------+--------+------> offline: Notification service -> APNs/FCM
          |
  Media: client -> pre-signed URL -> S3 -> CDN (message carries media_ref)`,
  deepDives: [
    {
      h: { en: "Connection layer: WebSockets at 250M connections", he: "שכבת החיבורים: WebSockets ב-250M חיבורים" },
      body: {
        en: `<p>Real-time delivery needs a persistent connection. Options: short polling (wasteful), long polling (works, but reconnect overhead per message), <strong>WebSocket</strong> (full-duplex, one TCP+TLS connection) — the standard choice; MQTT is also used on mobile for its tiny overhead.</p>
<ul><li><strong>Gateways are stateful</strong> (they own sockets) but hold no business logic. They register <code>user:device → gateway_host</code> in Redis on connect and refresh it with heartbeats (TTL 60 s), so a dead gateway's entries expire.</li>
<li><strong>Load balancer:</strong> L4 (TCP) LB, long idle timeouts, and connection-count-based balancing — round-robin on new connections is fine because connections are long-lived.</li>
<li><strong>Deploys</strong> are the hard part: draining 250K sockets at once causes a reconnect storm. Drain gradually, send clients a 'reconnect elsewhere' frame, and make clients reconnect with exponential backoff + jitter.</li></ul>
<blockquote>⚠️ Production tip: tune kernel limits — <code>ulimit -n</code> (file descriptors), <code>net.ipv4.ip_local_port_range</code>, and TCP memory — or a gateway will die at ~65K connections long before CPU is the bottleneck.</blockquote>`,
        he: `<p>מסירה ב-real time דורשת חיבור קבוע. האפשרויות: short polling (בזבזני), long polling (עובד, אבל overhead של reconnect על כל הודעה), <strong>WebSocket</strong> (full-duplex על חיבור TCP+TLS אחד) — הבחירה הסטנדרטית; במובייל משתמשים לפעמים גם ב-MQTT בגלל ה-overhead הקטן.</p>
<ul><li><strong>ה-gateways הם stateful</strong> (הם מחזיקים sockets) אבל בלי business logic. ב-connect הם רושמים ב-Redis <code>user:device → gateway_host</code> ומרעננים עם heartbeats (TTL של 60 שניות), כך שרשומות של gateway מת פגות לבד.</li>
<li><strong>Load balancer:</strong> L4 (TCP) עם idle timeouts ארוכים, ואיזון לפי מספר חיבורים — round-robin על חיבורים חדשים מספיק כי החיבורים ארוכים.</li>
<li><strong>Deploys</strong> זה החלק הקשה: לנתק 250K sockets בבת אחת יוצר reconnect storm. עושים drain הדרגתי, שולחים ל-client frame של 'תתחבר למקום אחר', והקליינטים עושים reconnect עם exponential backoff + jitter.</li></ul>
<blockquote>⚠️ טיפ מפרודקשן: לכוונן את ה-limits של ה-kernel — <code>ulimit -n</code> (file descriptors), <code>net.ipv4.ip_local_port_range</code> וזיכרון TCP — אחרת gateway ימות ב-~65K חיבורים הרבה לפני שה-CPU הוא צוואר הבקבוק.</blockquote>`
      }
    },
    {
      h: { en: "Message ordering and IDs", he: "סדר הודעות ו-IDs" },
      body: {
        en: `<p>Wall-clock timestamps from clients can't be trusted (skewed clocks), and even server clocks drift between machines. The robust approach: <strong>a monotonically increasing sequence number per conversation</strong>, assigned by the server.</p>
<ul><li>Route all writes for a conversation to the same place (Kafka key = <code>conv_id</code>, or a chat-service shard owning that conv) and use an atomic counter, e.g. Redis <code>INCR conv:{id}:seq</code> or a Cassandra LWT, to assign <code>seq</code>.</li>
<li>Store messages with clustering key <code>seq</code>; clients render by seq and detect gaps ("I have 1200, got 1203 → fetch 1201-1202").</li>
<li>The client generates a <code>client_msg_id</code> (UUID) so a resend after a network blip is deduplicated: the server maps it to the already-assigned seq.</li></ul>
<p>We only promise ordering <em>within a conversation</em> — global ordering would require a single sequencer for 500K msg/s, a pointless bottleneck. For IDs that are globally unique and roughly time-sortable, use Snowflake-style IDs (timestamp + machine id + counter).</p>`,
        he: `<p>אי אפשר לסמוך על timestamps מהקליינט (שעונים לא מסונכרנים), ואפילו שעונים של שרתים זזים אחד מהשני. הגישה החסינה: <strong>sequence number עולה לכל שיחה</strong>, שהשרת מקצה.</p>
<ul><li>מנתבים את כל הכתיבות של שיחה לאותו מקום (Kafka key = <code>conv_id</code>, או shard של chat service שאחראי על השיחה) ומשתמשים ב-counter אטומי, למשל <code>INCR conv:{id}:seq</code> ב-Redis או LWT ב-Cassandra, כדי להקצות <code>seq</code>.</li>
<li>שומרים הודעות עם clustering key של <code>seq</code>; הקליינט מציג לפי seq ומזהה חורים ("יש לי 1200, הגיע 1203 → תביא 1201-1202").</li>
<li>הקליינט מייצר <code>client_msg_id</code> (UUID) כך ששליחה חוזרת אחרי ניתוק רגעי עוברת dedup: השרת ממפה אותה ל-seq שכבר הוקצה.</li></ul>
<p>אנחנו מבטיחים סדר רק <em>בתוך שיחה</em> — סדר גלובלי ידרוש sequencer יחיד ל-500K הודעות בשנייה, צוואר בקבוק מיותר. ל-IDs ייחודיים גלובלית שממוינים בערך לפי זמן משתמשים ב-Snowflake IDs (timestamp + machine id + counter).</p>`
      }
    },
    {
      h: { en: "Delivery flow, receipts and offline users", he: "Flow של מסירה, receipts ומשתמשים offline" },
      body: {
        en: `<p>The send path, step by step:</p>
<ol><li>Sender's gateway forwards to chat service → assign seq → <strong>write to Cassandra</strong> (quorum) → reply <code>sent</code> (single tick). Persist before ack, so 'sent' means durable.</li>
<li>Publish to Kafka; fan-out worker looks up each recipient device in the Redis session registry.</li>
<li><strong>Online:</strong> RPC to that gateway, which pushes over the socket. Client acks → we update <code>delivered_seq</code> and send a receipt back to the sender (double tick).</li>
<li><strong>Offline:</strong> send a push notification via the notification service. On reconnect the client calls sync: "give me everything after my last <code>delivered_seq</code> for each conversation".</li></ol>
<p>Receipts are <strong>cumulative watermarks</strong> (<code>read up_to_seq=1250</code>), not one event per message — this cuts receipt traffic by an order of magnitude, especially in groups. For groups of 1,000, per-member read receipts get noisy; show aggregated "read by 37" and compute on demand.</p>
<blockquote>💡 Real world: WhatsApp deletes messages from the server once all recipient devices acked delivery — the phone is the source of truth. That shrinks storage dramatically but makes multi-device sync harder.</blockquote>`,
        he: `<p>ה-flow של שליחה, צעד אחרי צעד:</p>
<ol><li>ה-gateway של השולח מעביר ל-chat service → מקצה seq → <strong>כותב ל-Cassandra</strong> (quorum) → מחזיר <code>sent</code> (וי אחד). קודם persist ואז ack, כך ש-'sent' אומר שההודעה שמורה.</li>
<li>Publish ל-Kafka; fan-out worker מחפש כל מכשיר של הנמען ב-session registry ב-Redis.</li>
<li><strong>Online:</strong> RPC ל-gateway הרלוונטי שדוחף ב-socket. הקליינט מחזיר ack → מעדכנים <code>delivered_seq</code> ושולחים receipt לשולח (שני וי).</li>
<li><strong>Offline:</strong> שולחים push דרך ה-notification service. ב-reconnect הקליינט עושה sync: "תביא לי כל מה שאחרי ה-<code>delivered_seq</code> שלי בכל שיחה".</li></ol>
<p>ה-receipts הם <strong>watermarks מצטברים</strong> (<code>read up_to_seq=1250</code>), לא event לכל הודעה — זה חותך את התעבורה בסדר גודל, במיוחד בקבוצות. בקבוצה של 1,000 read receipts לכל חבר זה רעש; מציגים "נקרא ע״י 37" ומחשבים on demand.</p>
<blockquote>💡 מהשטח: WhatsApp מוחקים הודעות מהשרת ברגע שכל המכשירים של הנמענים אישרו delivery — הטלפון הוא ה-source of truth. זה מקטין את ה-storage דרמטית אבל מסבך sync בין כמה מכשירים.</blockquote>`
      }
    },
    {
      h: { en: "Presence at scale and group fan-out", he: "Presence ב-scale ו-fan-out בקבוצות" },
      body: {
        en: `<p><strong>Presence</strong> looks simple but is a write amplification trap. If every online/offline change is pushed to all contacts, a user with 500 contacts flapping on a bad mobile network generates thousands of events. Techniques:</p>
<ul><li>Store presence in Redis with a TTL refreshed by heartbeats; offline = key expired → <code>last_seen</code>.</li>
<li><strong>Debounce</strong>: only publish 'offline' after ~30 s without heartbeat, absorbing reconnect flaps.</li>
<li><strong>Pull, don't push</strong>: subscribe to presence only for the contacts currently visible on screen (open chat or chat list), and fetch on demand.</li></ul>
<p><strong>Group fan-out:</strong> a message to a 1,000-member group means 1,000 deliveries. We store the message <em>once</em> in the conversation partition (fan-out on read for storage) and only fan out lightweight delivery notifications to online members' gateways (fan-out on write for delivery). Typing indicators in big groups are rate-limited or dropped — they're ephemeral, never persisted, and losing one is fine.</p>`,
        he: `<p><strong>Presence</strong> נראה פשוט אבל זו מלכודת של write amplification. אם כל שינוי online/offline נדחף לכל אנשי הקשר, משתמש עם 500 אנשי קשר שמתנדנד ברשת סלולרית גרועה מייצר אלפי events. טכניקות:</p>
<ul><li>שומרים presence ב-Redis עם TTL שמתרענן ב-heartbeats; offline = ה-key פג → <code>last_seen</code>.</li>
<li><strong>Debounce</strong>: מפרסמים 'offline' רק אחרי ~30 שניות בלי heartbeat, וככה בולעים reconnect flaps.</li>
<li><strong>Pull, לא push</strong>: נרשמים ל-presence רק של אנשי הקשר שכרגע מוצגים במסך (שיחה פתוחה או רשימת צ'אטים), ומביאים on demand.</li></ul>
<p><strong>Fan-out בקבוצות:</strong> הודעה לקבוצה של 1,000 חברים = 1,000 deliveries. שומרים את ההודעה <em>פעם אחת</em> ב-partition של השיחה (fan-out on read ל-storage) ועושים fan-out רק להתראות delivery קלות ל-gateways של החברים שמחוברים (fan-out on write ל-delivery). Typing indicators בקבוצות גדולות עוברים rate limit או נזרקים — הם ephemeral, לא נשמרים, ולאבד אחד זה לא נורא.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Cassandra/HBase for messages (write-heavy, partition per conversation, linear scale) vs Postgres (easier queries/transactions but painful sharding at 4 TB/day).", he: "Cassandra/HBase להודעות (כבד בכתיבות, partition לשיחה, scale לינארי) מול Postgres (שאילתות וטרנזקציות נוחות יותר, אבל sharding כואב ב-4 TB ביום)." },
    { en: "Keep history server-side (multi-device, search, backups) vs delete after delivery (privacy, much less storage, harder multi-device).", he: "לשמור היסטוריה בשרת (multi-device, חיפוש, גיבוי) מול למחוק אחרי delivery (פרטיות, הרבה פחות storage, multi-device קשה יותר)." },
    { en: "Per-conversation ordering instead of global ordering: scalable, and users only perceive order inside a chat.", he: "סדר לכל שיחה במקום סדר גלובלי: עושה scale, ומשתמשים ממילא מרגישים סדר רק בתוך צ'אט." },
    { en: "End-to-end encryption improves privacy but removes server-side search, moderation and easy multi-device history.", he: "End-to-end encryption משפר פרטיות אבל מבטל חיפוש בצד השרת, moderation ו-history פשוט בין מכשירים." }
  ],
  followUps: [
    {
      q: { en: "A gateway server crashes with 250K connected users. What happens to in-flight messages?", he: "שרת gateway קורס עם 250K משתמשים מחוברים. מה קורה להודעות שבדרך?" },
      a: { en: "Clients detect the dropped socket and reconnect (with jittered backoff) to other gateways, which re-register them in Redis. Messages are already durable in Cassandra before being pushed, so nothing is lost: any message pushed but not acked is simply re-fetched via sync from the client's last delivered_seq. Stale Redis registry entries expire via TTL; fan-out workers that RPC to the dead host get an error and fall back to push notification. The real risk is the reconnect storm — 250K TLS handshakes at once — so keep spare capacity and jitter.", he: "הקליינטים מזהים שה-socket נפל ועושים reconnect (עם backoff ו-jitter) ל-gateways אחרים, שרושמים אותם מחדש ב-Redis. ההודעות כבר שמורות ב-Cassandra לפני שנדחפו, אז שום דבר לא אובד: הודעה שנדחפה ולא קיבלה ack פשוט תגיע שוב ב-sync מה-delivered_seq האחרון של הקליינט. רשומות ישנות ב-Redis פגות לפי TTL; fan-out workers שמנסים RPC ל-host המת מקבלים שגיאה ועוברים ל-push. הסיכון האמיתי הוא reconnect storm — 250K TLS handshakes בבת אחת — ולכן צריך capacity פנוי ו-jitter." }
    },
    {
      q: { en: "How do you handle users in different regions chatting with each other?", he: "איך מטפלים במשתמשים מ-regions שונים שמדברים זה עם זה?" },
      a: { en: "Each user connects to their nearest region. A conversation has a 'home region' that owns sequencing and storage (e.g. where it was created or where most members are). The sender's region forwards the write to the home region (one cross-region hop, ~70-150 ms), and fan-out delivers to recipients' regions via cross-region Kafka/RPC. This keeps per-conversation ordering simple without global consensus. Alternative: multi-region Cassandra with LOCAL_QUORUM writes and per-region seq — but then ordering across regions gets messy.", he: "כל משתמש מתחבר ל-region הקרוב. לכל שיחה יש 'home region' שאחראי על ה-sequencing וה-storage (למשל איפה שנוצרה או איפה שרוב החברים). ה-region של השולח מעביר את הכתיבה ל-home region (hop אחד בין regions, ~70-150ms), וה-fan-out מוסר ל-regions של הנמענים דרך Kafka/RPC בין regions. ככה הסדר בתוך שיחה נשאר פשוט בלי consensus גלובלי. אלטרנטיבה: Cassandra multi-region עם LOCAL_QUORUM ו-seq לכל region — אבל אז הסדר בין regions מתבלגן." }
    },
    {
      q: { en: "A 100K-member broadcast channel posts a message. Same design?", he: "ערוץ broadcast עם 100K חברים מפרסם הודעה. אותו תכנון?" },
      a: { en: "No — per-member fan-out (100K deliveries, 100K receipt watermarks) per post is wasteful. Treat it like a feed: store once, push a lightweight 'channel X has new seq N' only to currently-online members (or let clients poll/pull when they open the channel), drop per-member delivered/read receipts in favor of view counters, and throttle notifications. It's the celebrity problem from news feeds — switch from fan-out-on-write to fan-out-on-read above a size threshold.", he: "לא — fan-out לכל חבר (100K deliveries ו-100K watermarks) על כל פוסט זה בזבוז. מתייחסים לזה כמו feed: שומרים פעם אחת, דוחפים רק התראה קלה 'בערוץ X יש seq N חדש' לחברים שמחוברים כרגע (או שהקליינט עושה pull כשהוא פותח את הערוץ), מוותרים על receipts לכל חבר לטובת view counters, ועושים throttle ל-notifications. זו בעיית ה-celebrity מ-news feed — מעל סף גודל עוברים מ-fan-out on write ל-fan-out on read." }
    }
  ],
  related: ["net-load-balancing", "arch-brokers", "db-sharding", "db-sql-vs-nosql", "arch-event-driven", "db-cap"]
});

// ---------------------------------------------------------------- 6. News feed
window.INFRA.designs.push({
  id: "sd-news-feed", icon: "📰", level: 2,
  title: { en: "News Feed (Twitter/Instagram home timeline)", he: "News Feed (ה-home timeline של Twitter/Instagram)" },
  prompt: {
    en: "Design the home feed for a social network: users follow other users, post content, and see a feed of posts from the people they follow, newest or ranked first.",
    he: "תתכנן את ה-home feed של רשת חברתית: משתמשים עוקבים אחרי משתמשים אחרים, מפרסמים פוסטים, ורואים feed של פוסטים ממי שהם עוקבים אחריו, לפי זמן או לפי ranking."
  },
  clarify: [
    { en: "Scale: DAU, posts per day, average and max follower counts (are there celebrities with 100M followers)?", he: "Scale: כמה DAU, כמה פוסטים ביום, מה ממוצע ומקסימום עוקבים (יש סלבס עם 100M עוקבים)?" },
    { en: "Chronological or ranked feed? If ranked, is there an ML ranking service we call, or do we design it?", he: "Feed כרונולוגי או עם ranking? אם ranking, יש ML ranking service קיים שקוראים לו, או שאנחנו מתכננים אותו?" },
    { en: "How fresh must it be? Is it OK if a new post appears in followers' feeds after a few seconds?", he: "כמה טרי זה צריך להיות? זה בסדר שפוסט חדש יופיע אצל העוקבים אחרי כמה שניות?" },
    { en: "Content types: text, images, video? (Media served via CDN, out of the feed path.)", he: "סוגי תוכן: טקסט, תמונות, וידאו? (media מוגש מ-CDN, מחוץ ל-path של ה-feed.)" },
    { en: "Do we need likes/comments counts in the feed, and how fresh must those counters be?", he: "צריך מספרי likes/comments בתוך ה-feed, וכמה עדכניים הם חייבים להיות?" }
  ],
  functional: [
    { en: "Create a post (text + media references).", he: "יצירת פוסט (טקסט + הפניות ל-media)." },
    { en: "Follow / unfollow users.", he: "Follow / unfollow למשתמשים." },
    { en: "Get home feed: paginated posts from followed accounts, ranked or reverse-chronological.", he: "קבלת home feed: פוסטים ממי שאני עוקב אחריו, עם pagination, לפי ranking או מהחדש לישן." },
    { en: "Show engagement counts (likes, comments) on each post.", he: "הצגת engagement counts (likes, comments) בכל פוסט." }
  ],
  nonFunctional: [
    { en: "Read-heavy: feed reads outnumber posts ~100:1. Feed load P99 &lt; 200 ms.", he: "Read-heavy: קריאות feed מול פוסטים בערך 100:1. טעינת feed ב-P99 מתחת ל-200ms." },
    { en: "Scale: 300M DAU, 50M posts/day, average 300 follows, celebrities up to 100M followers.", he: "Scale: 300M DAU, 50M פוסטים ביום, ממוצע 300 follows, סלבס עד 100M עוקבים." },
    { en: "Eventual consistency is fine: a post may take a few seconds to show up; availability over consistency.", he: "Eventual consistency זה בסדר: פוסט יכול להופיע אחרי כמה שניות; availability עדיף על consistency." },
    { en: "Highly available — a broken feed is the whole product being down.", he: "High availability — feed שבור זה כל המוצר למטה." }
  ],
  estimates: {
    en: `<p><strong>Reads.</strong> 300M DAU × 10 feed loads/day = 3B/day ÷ 86,400 ≈ <strong>35K feed reads/s</strong> average, peak ~3x ≈ <strong>100K/s</strong>. Each load returns ~20 posts.</p>
<p><strong>Writes.</strong> 50M posts/day ÷ 86,400 ≈ <strong>580 posts/s</strong> (peak ~2K/s). Tiny — but fan-out on write multiplies it: 50M × 300 avg followers = <strong>15B feed inserts/day ≈ 175K/s</strong>. One celebrity post with 100M followers alone = 100M inserts — at 1M inserts/s that's 100 seconds of the whole cluster's capacity for one post. That's why celebrities need special handling.</p>
<p><strong>Feed cache.</strong> Keep the latest 500 post ids per user. Entry = post_id (8 B) + author_id (8 B) = 16 B → 500 × 16 B = 8 KB/user. Only active users: 300M × 8 KB = <strong>2.4 TB</strong> in Redis (with overhead ~2x → ~5 TB) ≈ 80 nodes of 64 GB — reasonable. Inactive users get no precomputed feed; rebuild on login.</p>
<p><strong>Posts storage.</strong> 50M × 1 KB (text + metadata) = 50 GB/day → ~18 TB/year, fine for sharded MySQL/Cassandra. Media: if 30% have a 500 KB image = 15M × 500 KB = 7.5 TB/day into S3 + CDN.</p>
<p><strong>Hydration.</strong> 100K feed reads/s × 20 posts = 2M post lookups/s — must be served from a post cache (Memcached/Redis), not the DB.</p>`,
    he: `<p><strong>קריאות.</strong> 300M DAU × 10 טעינות feed ביום = 3B ביום ÷ 86,400 ≈ <strong>35K קריאות feed בשנייה</strong> בממוצע, peak בערך פי 3 ≈ <strong>100K/s</strong>. כל טעינה מחזירה ~20 פוסטים.</p>
<p><strong>כתיבות.</strong> 50M פוסטים ביום ÷ 86,400 ≈ <strong>580 פוסטים בשנייה</strong> (peak ~2K/s). זניח — אבל fan-out on write מכפיל את זה: 50M × 300 עוקבים בממוצע = <strong>15B הכנסות ל-feeds ביום ≈ 175K/s</strong>. פוסט אחד של סלב עם 100M עוקבים = 100M inserts — ב-1M inserts בשנייה זה 100 שניות של כל הקלאסטר בשביל פוסט אחד. בגלל זה סלבס צריכים טיפול מיוחד.</p>
<p><strong>Feed cache.</strong> שומרים 500 post ids אחרונים לכל משתמש. רשומה = post_id (8 B) + author_id (8 B) = 16 B → 500 × 16 B = 8 KB למשתמש. רק משתמשים פעילים: 300M × 8 KB = <strong>2.4 TB</strong> ב-Redis (עם overhead פי 2 → ~5 TB) ≈ 80 nodes של 64 GB — סביר. למשתמשים לא פעילים לא מחשבים feed מראש; בונים מחדש ב-login.</p>
<p><strong>Storage לפוסטים.</strong> 50M × 1 KB = 50 GB ביום → ~18 TB בשנה, בסדר גמור ל-MySQL/Cassandra עם sharding. Media: אם ל-30% יש תמונה של 500 KB = 15M × 500 KB = 7.5 TB ביום ל-S3 + CDN.</p>
<p><strong>Hydration.</strong> 100K קריאות feed/s × 20 פוסטים = 2M lookups של פוסטים בשנייה — חייב להגיע מ-post cache (Memcached/Redis), לא מה-DB.</p>`
  },
  api: `POST /v1/posts {text, media_ids[]}            -> 201 {post_id}
GET  /v1/feed?cursor=<opaque>&limit=20        -> 200 {posts[], next_cursor}
     posts[i] = {post_id, author{id,name,avatar_url}, text, media_urls[],
                 like_count, comment_count, created_at}
POST   /v1/users/{id}/follow                  -> 204
DELETE /v1/users/{id}/follow                  -> 204
POST   /v1/posts/{id}/like                    -> 204
GET  /v1/users/{id}/posts?cursor=...          (profile timeline)`,
  dataModel: `posts (sharded MySQL or Cassandra, shard by post_id)
  post_id (Snowflake, time-sortable) PK, author_id, text, media_ids, created_at

user_posts (Cassandra) PK author_id, CK post_id DESC   -- author timeline

follows (sharded MySQL / graph store)
  followers: PK followee_id -> follower_id   (who to fan out to)
  following: PK follower_id -> followee_id   (who I follow, for pull)

feed cache (Redis sorted set / list, per user)
  feed:{user_id} -> ZSET score=post_id/rank, member=post_id   (cap 500)

post cache (Memcached) post:{id} -> serialized post
counters (Redis, async flushed) likes:{post_id}
users (MySQL) user_id, name, avatar, follower_count, is_celebrity`,
  diagram: `                      +-------------+
   Clients  --------> | API Gateway | ---> CDN (images/video)
                      +------+------+
             POST /posts     |      GET /feed
          +------------------+-------------------+
          v                                      v
  +---------------+                      +---------------+
  | Post service  |                      | Feed service  |
  +-------+-------+                      +---+-------+---+
          | write                            |       | 1. read feed:{uid} ids
          v                                  |       v
   Posts DB (sharded)                        |   Redis feed cache
          |                                  |       ^
          | publish post_created             |       | 2. merge celeb posts
          v                                  |   (pull from user_posts)
     +---------+                             |
     |  Kafka  |                             | 3. hydrate posts + counts
     +----+----+                             v
          v                           Memcached post cache
  +------------------+                       |
  | Fan-out workers  |                       v 4. rank (optional ML svc)
  | - followers of   |                    response
  |   author (graph) |
  | - skip celebs    |
  | - ZADD feed:{f}  |------> Redis feed cache
  +------------------+`,
  deepDives: [
    {
      h: { en: "Fan-out on write vs fan-out on read", he: "Fan-out on write מול fan-out on read" },
      body: {
        en: `<p>This is the heart of the question — state both and pick a hybrid.</p>
<table><tr><th></th><th>Fan-out on write (push)</th><th>Fan-out on read (pull)</th></tr>
<tr><td>When a post is created</td><td>Insert post_id into every follower's feed cache</td><td>Just store it in the author's timeline</td></tr>
<tr><td>Feed read</td><td>One Redis read, very fast</td><td>Query N followees, merge-sort — slow for 300+ follows</td></tr>
<tr><td>Cost</td><td>Huge write amplification; wasted on inactive users</td><td>Heavy read amplification at 100K reads/s</td></tr>
<tr><td>Breaks on</td><td>Celebrities (100M inserts)</td><td>Users following thousands</td></tr></table>
<p><strong>Hybrid (what Twitter did):</strong> push for normal authors; for authors above a threshold (say 100K followers), <em>don't fan out</em>. At read time, the feed service fetches the precomputed feed and merges in recent posts from the handful of celebrities the user follows (each served from a hot, heavily cached <code>user_posts</code>). Also skip fan-out to inactive users (no login in 30 days) and rebuild their feed lazily on next login.</p>`,
        he: `<p>זה לב השאלה — מציגים את שתי הגישות ובוחרים hybrid.</p>
<table><tr><th></th><th>Fan-out on write (push)</th><th>Fan-out on read (pull)</th></tr>
<tr><td>כשנוצר פוסט</td><td>מכניסים post_id ל-feed cache של כל עוקב</td><td>רק שומרים ב-timeline של הכותב</td></tr>
<tr><td>קריאת feed</td><td>קריאה אחת מ-Redis, מהיר מאוד</td><td>Query ל-N נעקבים ו-merge sort — איטי עם 300+ follows</td></tr>
<tr><td>עלות</td><td>Write amplification עצום; מבוזבז על משתמשים לא פעילים</td><td>Read amplification כבד ב-100K קריאות בשנייה</td></tr>
<tr><td>נשבר כש</td><td>סלבס (100M inserts)</td><td>משתמשים שעוקבים אחרי אלפים</td></tr></table>
<p><strong>Hybrid (מה ש-Twitter עשו):</strong> push לכותבים רגילים; לכותבים מעל סף (נגיד 100K עוקבים) <em>לא עושים fan-out</em>. בזמן קריאה ה-feed service מביא את ה-feed המחושב ועושה merge עם הפוסטים האחרונים של הסלבס הבודדים שהמשתמש עוקב אחריהם (כל אחד מגיע מ-<code>user_posts</code> חם שיושב ב-cache). בנוסף לא עושים fan-out למשתמשים לא פעילים (בלי login 30 יום) ובונים להם feed בעצלות ב-login הבא.</p>`
      }
    },
    {
      h: { en: "The feed cache and hydration", he: "ה-feed cache ו-hydration" },
      body: {
        en: `<p>The feed cache stores <strong>only IDs</strong>, never full posts. Why: a post edited or deleted would otherwise need updating in millions of feeds, and IDs are 16 B vs ~1 KB.</p>
<ul><li><code>feed:{uid}</code> is a Redis sorted set (score = post_id, which is time-sortable as a Snowflake) capped with <code>ZREMRANGEBYRANK</code> at 500 entries. Older pages fall back to pull from the DB — rare, since few users scroll past 500.</li>
<li><strong>Hydration:</strong> take 20 ids → multi-get from Memcached <code>post:{id}</code> (hit ratio 95%+ because recent posts are hot) → multi-get authors from a user cache → get counters. Fan these calls out in parallel; the slowest dependency defines P99.</li>
<li><strong>Pagination</strong> uses a cursor (last seen post_id/score), not offsets — new posts arriving at the top would shift offsets and cause duplicates.</li>
<li><strong>Deletes/blocks:</strong> filter at read time (check post tombstone, check block list) rather than scrubbing every feed.</li></ul>
<blockquote>💡 Real world: replicate hot celebrity posts across several cache nodes (or use a local in-process cache) — one viral post can make a single Memcached shard a hot key.</blockquote>`,
        he: `<p>ה-feed cache שומר <strong>רק IDs</strong>, אף פעם לא פוסטים מלאים. למה: אחרת פוסט שנערך או נמחק היה צריך עדכון במיליוני feeds, ו-ID זה 16 B לעומת ~1 KB.</p>
<ul><li><code>feed:{uid}</code> הוא sorted set ב-Redis (score = post_id, שהוא Snowflake וממוין לפי זמן) עם תקרה של 500 בעזרת <code>ZREMRANGEBYRANK</code>. עמודים ישנים יותר נופלים ל-pull מה-DB — נדיר, מעט משתמשים גוללים מעבר ל-500.</li>
<li><strong>Hydration:</strong> לוקחים 20 ids → multi-get מ-Memcached <code>post:{id}</code> (hit ratio של 95%+ כי פוסטים חדשים חמים) → multi-get של כותבים מ-user cache → counters. מריצים את הקריאות במקביל; ה-dependency הכי איטי קובע את ה-P99.</li>
<li><strong>Pagination</strong> עם cursor (ה-post_id/score האחרון שנראה), לא offset — פוסטים חדשים שנכנסים למעלה היו מזיזים את ה-offsets ויוצרים כפילויות.</li>
<li><strong>מחיקות/חסימות:</strong> מסננים בזמן קריאה (בדיקת tombstone, בדיקת block list) במקום לנקות כל feed.</li></ul>
<blockquote>💡 מהשטח: משכפלים פוסטים חמים של סלבס על כמה cache nodes (או local in-process cache) — פוסט ויראלי אחד יכול להפוך shard יחיד של Memcached ל-hot key.</blockquote>`
      }
    },
    {
      h: { en: "Ranking and the ranking cache", he: "Ranking וה-ranking cache" },
      body: {
        en: `<p>Most modern feeds are ranked, not chronological. A practical two-stage pipeline:</p>
<ol><li><strong>Candidate generation:</strong> the ~500 ids from the feed cache + celebrity posts + maybe recommended posts.</li>
<li><strong>Scoring:</strong> an ML model (features: author affinity, post age, engagement velocity, media type) scores candidates. Scoring 500 candidates per request × 100K req/s = 50M scores/s — too expensive to do on every refresh.</li></ol>
<p>So we cache the result: <strong>ranked feed cache</strong> <code>ranked:{uid}</code> with a short TTL (e.g. 5-15 min) or invalidated when enough new candidates arrive. Page 2 is served from the same ranked snapshot so the order doesn't shuffle while the user scrolls. On pull-to-refresh, re-rank only new candidates and merge them on top.</p>
<ul><li>Fallback: if the ranking service is slow or down, serve reverse-chronological from the ID cache — degraded but working (a classic graceful degradation).</li>
<li>Feature data (affinity scores) is precomputed offline in batch (Spark) and served from a key-value store.</li></ul>`,
        he: `<p>רוב ה-feeds היום עם ranking, לא כרונולוגיים. pipeline פרקטי בשני שלבים:</p>
<ol><li><strong>Candidate generation:</strong> ~500 ה-ids מה-feed cache + פוסטים של סלבס + אולי פוסטים מומלצים.</li>
<li><strong>Scoring:</strong> מודל ML (features: affinity לכותב, גיל הפוסט, קצב engagement, סוג media) נותן ציון למועמדים. 500 מועמדים לבקשה × 100K בקשות בשנייה = 50M ציונים בשנייה — יקר מדי לחשב בכל refresh.</li></ol>
<p>אז עושים cache לתוצאה: <strong>ranked feed cache</strong> <code>ranked:{uid}</code> עם TTL קצר (5-15 דקות) או invalidation כשמצטברים מספיק מועמדים חדשים. עמוד 2 מוגש מאותו snapshot מדורג כדי שהסדר לא יקפוץ בזמן גלילה. ב-pull-to-refresh מדרגים רק את המועמדים החדשים ומכניסים אותם למעלה.</p>
<ul><li>Fallback: אם ה-ranking service איטי או למטה, מגישים כרונולוגי מה-ID cache — degraded אבל עובד (graceful degradation קלאסי).</li>
<li>Feature data (affinity scores) מחושב מראש offline ב-batch (Spark) ומוגש מ-key-value store.</li></ul>`
      }
    },
    {
      h: { en: "Counters, hot keys and failure modes", he: "Counters, hot keys ו-failure modes" },
      body: {
        en: `<p><strong>Like counters:</strong> a viral post can get 50K likes/s. Doing <code>UPDATE posts SET likes = likes + 1</code> on one row serializes on a row lock. Instead: <code>INCR</code> in Redis (sharded counters <code>likes:{post}:{0..15}</code> for the hottest posts), and flush aggregated deltas to the DB every few seconds. The feed shows an approximate count — nobody notices 1,204,331 vs 1,204,350.</p>
<p><strong>Failure modes to mention:</strong></p>
<ul><li><strong>Redis feed node lost:</strong> feeds on it are rebuilt on demand by pulling from followees (slower for those users, not down). Use replicas to avoid the cold-rebuild storm.</li>
<li><strong>Fan-out lag:</strong> Kafka consumer lag grows after a burst → posts appear late. Monitor lag as an SLI ("95% of posts in followers' feeds within 10 s") and autoscale workers on lag.</li>
<li><strong>Thundering herd on cache miss</strong> for a viral post: use request coalescing (single-flight) so only one request hits the DB.</li></ul>
<p>Core SLOs: feed P99 latency &lt; 200 ms, feed availability 99.95%, fan-out freshness 10 s.</p>`,
        he: `<p><strong>Like counters:</strong> פוסט ויראלי יכול לקבל 50K likes בשנייה. <code>UPDATE posts SET likes = likes + 1</code> על שורה אחת מסתדר בתור על row lock. במקום זה: <code>INCR</code> ב-Redis (sharded counters <code>likes:{post}:{0..15}</code> לפוסטים הכי חמים), ו-flush של הדלתאות המצטברות ל-DB כל כמה שניות. ה-feed מציג מספר מקורב — אף אחד לא שם לב ל-1,204,331 מול 1,204,350.</p>
<p><strong>Failure modes ששווה להזכיר:</strong></p>
<ul><li><strong>Node של Redis feed נפל:</strong> ה-feeds שעליו נבנים מחדש on demand ב-pull מהנעקבים (איטי יותר למשתמשים האלה, לא down). Replicas מונעים rebuild storm קר.</li>
<li><strong>Fan-out lag:</strong> ה-consumer lag ב-Kafka גדל אחרי burst → פוסטים מופיעים באיחור. מנטרים את ה-lag כ-SLI ("95% מהפוסטים מופיעים אצל העוקבים תוך 10 שניות") ועושים autoscale ל-workers לפי lag.</li>
<li><strong>Thundering herd ב-cache miss</strong> על פוסט ויראלי: request coalescing (single-flight) כך שרק בקשה אחת מגיעה ל-DB.</li></ul>
<p>SLOs מרכזיים: feed P99 latency מתחת ל-200ms, availability של 99.95%, freshness של fan-out תוך 10 שניות.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Hybrid fan-out adds complexity (two code paths, a celebrity threshold to tune) but is the only approach that handles both average users and 100M-follower accounts.", he: "Fan-out היברידי מוסיף מורכבות (שני code paths וסף סלבס שצריך לכוונן) אבל זו הגישה היחידה שמטפלת גם במשתמש ממוצע וגם בחשבונות עם 100M עוקבים." },
    { en: "Storing only IDs in feed caches costs an extra hydration hop but makes edits/deletes cheap and memory 50x smaller.", he: "לשמור רק IDs ב-feed cache עולה hop נוסף של hydration, אבל הופך עריכה/מחיקה לזולות והזיכרון קטן פי 50." },
    { en: "Eventual consistency (a post shows up seconds later, counts are approximate) buys availability and massive write throughput.", he: "Eventual consistency (פוסט מופיע אחרי כמה שניות, counts מקורבים) קונה availability ו-throughput כתיבה עצום." },
    { en: "Caching ranked results makes the feed cheaper and stable during scrolling, at the cost of slightly stale ranking.", he: "Cache לתוצאות ה-ranking הופך את ה-feed לזול ויציב בגלילה, במחיר של ranking קצת לא עדכני." }
  ],
  followUps: [
    {
      q: { en: "A user unfollows someone. What happens to that person's posts already in their feed cache?", he: "משתמש עושה unfollow למישהו. מה קורה לפוסטים שלו שכבר נמצאים ב-feed cache?" },
      a: { en: "Two options: (1) async cleanup — a job scans feed:{uid} and ZREMs posts by that author (we store author_id with each entry exactly to make this possible); (2) filter at read time against the current following set. In practice do both: read-time filtering for immediate correctness, async cleanup to keep the cache tidy. The same read-time filter handles blocks and deleted posts.", he: "שתי אפשרויות: (1) ניקוי אסינכרוני — job שעובר על feed:{uid} ועושה ZREM לפוסטים של אותו כותב (בדיוק בשביל זה שומרים author_id בכל רשומה); (2) סינון בזמן קריאה מול ה-following set הנוכחי. בפועל עושים את שניהם: סינון בקריאה לנכונות מיידית, וניקוי אסינכרוני כדי שה-cache יישאר נקי. אותו סינון מטפל גם בחסימות ובפוסטים שנמחקו." }
    },
    {
      q: { en: "Where exactly do you put the celebrity threshold, and what about a user who suddenly goes viral?", he: "איפה בדיוק שמים את סף הסלבס, ומה עם משתמש שפתאום הופך ויראלי?" },
      a: { en: "Pick it from the cost model: fan-out cost is linear in followers, pull cost is per-reader. Around 10K-100K followers is typical, tuned with metrics (fan-out lag, read latency). Store an is_celebrity flag updated by a periodic job based on follower_count, with hysteresis (e.g. become celeb at 100K, revert below 80K) so accounts don't flip-flop. A user who crosses it is just pulled from then on; posts already fanned out stay — the merge dedups by post_id.", he: "בוחרים לפי מודל עלות: עלות fan-out לינארית במספר העוקבים, ועלות pull היא לכל קורא. בדרך כלל 10K-100K עוקבים, ומכווננים לפי metrics (fan-out lag, read latency). שומרים flag של is_celebrity שמתעדכן ב-job תקופתי לפי follower_count, עם hysteresis (נהיים סלב ב-100K, חוזרים מתחת ל-80K) כדי שחשבונות לא יקפצו הלוך-חזור. מי שחוצה את הסף פשוט עובר ל-pull מאותו רגע; פוסטים שכבר עברו fan-out נשארים — ה-merge עושה dedup לפי post_id." }
    },
    {
      q: { en: "How do you shard the follows graph, and which side do you shard by?", he: "איך עושים sharding לגרף ה-follows, ולפי איזה צד?" },
      a: { en: "Keep two tables because the access patterns differ: followers-of (shard by followee_id) is used by fan-out ('who do I push to?'), following-of (shard by follower_id) is used by pull/merge ('which celebs does this user follow?'). Each write updates both (async via an event is fine). Sharding by followee means a celebrity's follower list is one huge partition — split it into sub-buckets (followee_id, bucket) so fan-out workers can process it in parallel.", he: "מחזיקים שתי טבלאות כי ה-access patterns שונים: followers-of (shard לפי followee_id) משמש את ה-fan-out ('למי אני דוחף?'), ו-following-of (shard לפי follower_id) משמש את ה-pull/merge ('אחרי אילו סלבס המשתמש עוקב?'). כל כתיבה מעדכנת את שתיהן (אסינכרוני דרך event זה בסדר). shard לפי followee אומר שרשימת העוקבים של סלב היא partition ענק — מפצלים ל-sub-buckets (followee_id, bucket) כדי שה-fan-out workers יעבדו עליה במקביל." }
    }
  ],
  related: ["arch-caching", "db-sharding", "arch-queues", "arch-event-driven", "db-replication", "arch-scaling"]
});
window.INFRA.designs.push({
  id: "sd-metrics-platform", icon: "📈", level: 3,
  title: { en: "Design a Metrics & Monitoring Platform (Prometheus/Datadog-like)", he: "תכנון פלטפורמת Metrics וניטור (בסגנון Prometheus/Datadog)" },
  prompt: {
    en: "Design an internal monitoring system for our company: every service and host emits metrics, engineers build dashboards and define alerts. It should replace our collection of per-team Prometheus servers.",
    he: "תתכנן מערכת ניטור פנימית לחברה: כל service וכל host שולחים metrics, מהנדסים בונים dashboards ומגדירים alerts. המערכת צריכה להחליף את אוסף שרתי ה-Prometheus שכל צוות מריץ לעצמו."
  },
  clarify: [
    { en: "How many hosts/containers and how many active time series do we expect? (Cardinality is the real scale unit, not hosts.)", he: "כמה hosts/containers ובעיקר כמה active time series? (ה-cardinality היא יחידת הסקייל האמיתית, לא מספר השרתים.)" },
    { en: "Pull (scrape) or push? Do we need to support short-lived jobs and serverless?", he: "Pull (scrape) או push? צריך לתמוך ב-jobs קצרים וב-serverless?" },
    { en: "What resolution and retention: 15s raw for how long, and do we need a year of history for capacity planning?", he: "איזו רזולוציה ו-retention: כמה זמן שומרים raw ב-15 שניות, וצריך שנה אחורה בשביל capacity planning?" },
    { en: "Is this metrics only, or also logs and traces? (Scope it to metrics.)", he: "רק metrics, או גם logs ו-traces? (נגדיר scope ל-metrics בלבד.)" },
    { en: "Multi-tenant? Do teams need isolation and per-team quotas?", he: "Multi-tenant? צוותים צריכים בידוד ו-quotas לכל צוות?" },
    { en: "How fast must alerts fire after a condition becomes true, and what is the availability target of the alerting path itself?", he: "תוך כמה זמן alert צריך לירות אחרי שהתנאי מתקיים, ומה יעד ה-availability של מסלול ה-alerting עצמו?" }
  ],
  functional: [
    { en: "Ingest metrics (counters, gauges, histograms) with labels from ~10k hosts and their containers.", he: "קליטת metrics (counters, gauges, histograms) עם labels מכ-10k hosts וה-containers שלהם." },
    { en: "Query with a PromQL-like language for dashboards (Grafana) and ad-hoc investigation.", he: "Query בשפה בסגנון PromQL ל-dashboards (Grafana) ולחקירות אד-הוק." },
    { en: "Evaluate alert rules continuously and route notifications (PagerDuty, Slack) with dedup, grouping and silences.", he: "הערכה רציפה של alert rules וניתוב התראות (PagerDuty, Slack) עם dedup, grouping ו-silences." },
    { en: "Long-term storage with downsampling for trend/capacity queries.", he: "Long-term storage עם downsampling לשאילתות מגמה ו-capacity." }
  ],
  nonFunctional: [
    { en: "Scale: ~50M active series, ~3.3M samples/sec, growing 2x per year.", he: "סקייל: כ-50M active series, כ-3.3M samples לשנייה, גדילה פי 2 בשנה." },
    { en: "Alerting path availability 99.99% — monitoring must be more available than what it monitors.", he: "Availability של מסלול ה-alerting: 99.99%. מערכת הניטור חייבת להיות זמינה יותר ממה שהיא מנטרת." },
    { en: "Dashboard queries over last 1h: p99 under 1s; 30-day queries: under 10s.", he: "שאילתות dashboard על השעה האחרונה: p99 מתחת לשנייה; שאילתות של 30 יום: מתחת ל-10 שניות." },
    { en: "Write path tolerates losing a few seconds of data; never blocks the services being monitored.", he: "מסלול הכתיבה יכול לסבול איבוד של כמה שניות דאטה, אבל אסור לו לחסום את השירותים שמנוטרים." },
    { en: "Per-tenant isolation: one team's cardinality explosion must not take down everyone.", he: "בידוד בין tenants: פיצוץ cardinality של צוות אחד לא יכול להפיל את כולם." }
  ],
  estimates: {
    en: `<p><strong>Series:</strong> 10,000 hosts × ~5,000 series each (node exporter + containers + app metrics) = <strong>50M active series</strong>.</p>
<p><strong>Ingest rate:</strong> scrape every 15s → 50M / 15 ≈ <strong>3.3M samples/sec</strong>.</p>
<p><strong>Bytes:</strong> Gorilla-style compression (delta-of-delta timestamps + XOR floats) gives ~1.3 bytes/sample. 3.3M × 1.3 ≈ 4.3 MB/s → × 86,400 ≈ <strong>~375 GB/day</strong> compressed. Network ingest before compression (~100 bytes/sample on the wire incl. labels, snappy-compressed remote_write ~10x) ≈ 33 MB/s — easy.</p>
<p><strong>Raw retention 15 days:</strong> 375 GB × 15 ≈ 5.6 TB; × 3 replicas ≈ <strong>17 TB</strong> on local SSD across the ingester/storage fleet.</p>
<p><strong>Downsampled 1 year:</strong> 5-minute rollups = 20× fewer points, but each stores min/max/sum/count (~4 values) → ~5× smaller than raw ≈ 75 GB/day × 365 ≈ <strong>27 TB</strong> in S3 (cheap, ~$600/month).</p>
<p><strong>Memory:</strong> the head block (last ~2h) keeps every active series in RAM: ~3-4 KB/series incl. index → 50M × 4 KB ≈ <strong>200 GB RAM</strong>, ×3 replication = 600 GB → e.g. 20 ingesters × 32 GB. This is why cardinality, not sample rate, sizes the cluster.</p>
<p><strong>Alerts:</strong> 20,000 rules evaluated every 30s ≈ 670 rule evaluations/sec — mostly hitting the in-memory head.</p>`,
    he: `<p><strong>Series:</strong> 10,000 hosts × בערך 5,000 series לכל אחד (node exporter + containers + metrics של האפליקציה) = <strong>50M active series</strong>.</p>
<p><strong>קצב קליטה:</strong> scrape כל 15 שניות → 50M / 15 ≈ <strong>3.3M samples לשנייה</strong>.</p>
<p><strong>בייטים:</strong> דחיסה בסגנון Gorilla (delta-of-delta על timestamps ו-XOR על הערכים) נותנת כ-1.3 בייט ל-sample. 3.3M × 1.3 ≈ 4.3 MB/s → × 86,400 ≈ <strong>כ-375 GB ביום</strong> דחוס. התעבורה ברשת (remote_write עם snappy) בערך 33 MB/s – לא סיפור.</p>
<p><strong>Retention של raw ל-15 יום:</strong> 375 GB × 15 ≈ 5.6 TB; × 3 replicas ≈ <strong>17 TB</strong> על SSD מקומי ב-fleet.</p>
<p><strong>Downsampled לשנה:</strong> rollups של 5 דקות = פי 20 פחות נקודות, אבל כל נקודה מחזיקה min/max/sum/count (כ-4 ערכים) → בערך פי 5 קטן מ-raw ≈ 75 GB ביום × 365 ≈ <strong>27 TB</strong> ב-S3 (זול, בערך 600$ לחודש).</p>
<p><strong>זיכרון:</strong> ה-head block (השעתיים האחרונות) מחזיק כל active series ב-RAM: בערך 3-4 KB ל-series כולל אינדקס → 50M × 4 KB ≈ <strong>200 GB RAM</strong>, × 3 replication = 600 GB → למשל 20 ingesters עם 32 GB. בגלל זה cardinality, ולא קצב ה-samples, הוא מה שקובע את גודל הקלאסטר.</p>
<p><strong>Alerts:</strong> 20,000 rules שמוערכים כל 30 שניות ≈ 670 הערכות לשנייה, רובן על ה-head שבזיכרון.</p>`
  },
  api: `# Write (Prometheus remote_write compatible, protobuf + snappy)
POST /api/v1/push            headers: X-Scope-OrgID: team-payments
  body: [{labels:{__name__,job,instance,...}, samples:[{ts,value}]}]  -> 204 | 429 (over quota)

# Read (PromQL)
GET /api/v1/query?query=sum(rate(http_requests_total{job="api"}[5m]))&time=...
GET /api/v1/query_range?query=...&start=...&end=...&step=30s
GET /api/v1/series?match[]=up{job="api"}
GET /api/v1/labels  |  GET /api/v1/label/{name}/values

# Rules & alerts
PUT /api/v1/rules/{namespace}/{group}   (YAML rule group)
GET /api/v1/alerts
POST /alertmanager/api/v2/silences {matchers, startsAt, endsAt, comment}`,
  dataModel: `series identity = metric name + sorted label set
  series_id = hash(labels)            e.g. http_requests_total{job="api",method="GET",code="200"}

In-memory head (per ingester, last ~2h):
  series: series_id -> {labels, chunk[] }   chunk = ~120 samples Gorilla-compressed
  inverted index: label=value -> postings list of series_ids (sorted)

Block (immutable, uploaded to S3 every 2h):
  /tenant/block-ULID/
    chunks/000001        compressed samples
    index                 symbols, series, postings, label index
    meta.json             minTime, maxTime, resolution(raw|5m|1h), compaction level

Rules/alerts metadata (Postgres): rule_groups(tenant, namespace, name, yaml, interval)
Alertmanager state: silences + notification log, gossiped between replicas`,
  diagram: `   [hosts / pods]
   node_exporter, app /metrics
          |  scrape (pull, 15s)
          v
  +------------------+     remote_write (push)      +------------------+
  | Agent per node / |  -------------------------->  |   Distributors   |  (stateless, auth,
  | per cluster      |   batched, snappy, retries    |  rate limit/quota|   validate, hash)
  | (Prom agent/OTel)|                               +--------+---------+
  +------------------+                                        | consistent hash(series), RF=3
                                                              v
                                         +-------------------------------------+
                                         | Ingesters (stateful, WAL on SSD,    |
                                         |  2h in-memory head, ring membership)|
                                         +----------------+--------------------+
                                                          | flush 2h blocks
                                                          v
                         +-----------+           +-------------------+
                         | Compactor |<--------->|  S3 object store  |
                         | dedup,    |           |  blocks raw/5m/1h |
                         | downsample|           +---------+---------+
                         +-----------+                     |
                                                  +--------+--------+
  [Grafana] --> [Query frontend] --> [Queriers] --+ store-gateways  |
                (split by day, cache)  |          +-----------------+
                                       +--> ingesters (recent data)
  [Ruler] --(PromQL every 30s)--> Queriers ;  Ruler --> [Alertmanager x3, gossip] --> PagerDuty/Slack
  [Meta-monitoring: separate small Prometheus watches the platform + dead-man's switch]`,
  deepDives: [
    {
      h: { en: "Cardinality is the scaling unit (and the #1 outage cause)", he: "Cardinality היא יחידת הסקייל (והגורם מספר 1 לנפילות)" },
      body: {
        en: `<p>Every unique label combination is a new series with its own RAM and index entries. One developer adding <code>user_id</code> or <code>request_path</code> as a label can turn 1,000 series into 10M in minutes, OOM-killing ingesters and dropping data for <em>every</em> tenant.</p>
<ul>
<li><strong>Per-tenant limits at the distributor:</strong> max active series, max samples/sec, max labels per series, max label value length. Reject with 429 and a clear error metric instead of falling over.</li>
<li><strong>Per-metric limits:</strong> cap series per metric name so one bad metric is dropped, not the whole tenant.</li>
<li><strong>Visibility:</strong> expose top-N metrics by series count per tenant (cardinality explorer) so teams can fix themselves.</li>
<li><strong>Relabeling at the agent:</strong> drop high-cardinality labels and unused metrics before they hit the wire — cheapest place to cut.</li>
</ul>
<blockquote>💡 Real world: in most companies, 20% of metrics produce 80% of series, and a large share of them are never queried. A "unused metrics" report based on query logs often cuts cost 30-50%.</blockquote>`,
        he: `<p>כל צירוף ייחודי של labels הוא series חדש עם RAM ורשומות אינדקס משלו. מפתח אחד שמוסיף <code>user_id</code> או <code>request_path</code> כ-label יכול להפוך 1,000 series ל-10M תוך דקות, לגרום ל-OOMKill של ה-ingesters ולאבד דאטה של <em>כל</em> ה-tenants.</p>
<ul>
<li><strong>Limits לכל tenant ב-distributor:</strong> מקסימום active series, samples לשנייה, labels ל-series ואורך ערך label. דוחים עם 429 ו-metric שגיאה ברור, במקום לקרוס.</li>
<li><strong>Limits לכל metric:</strong> תקרה על series לכל שם metric, כך שנזרק רק ה-metric הבעייתי ולא כל ה-tenant.</li>
<li><strong>שקיפות:</strong> לחשוף top-N של metrics לפי כמות series לכל tenant (cardinality explorer) כדי שצוותים יתקנו בעצמם.</li>
<li><strong>Relabeling ב-agent:</strong> לזרוק labels עם cardinality גבוה ו-metrics שלא בשימוש עוד לפני שהם יוצאים לרשת – המקום הכי זול לחתוך.</li>
</ul>
<blockquote>💡 מהשטח: ברוב החברות 20% מה-metrics מייצרים 80% מה-series, וחלק גדול מהם אף אחד לא שואל עליהם. דוח "unused metrics" שמבוסס על query logs חותך לרוב 30-50% מהעלות.</blockquote>`
      }
    },
    {
      h: { en: "Write path: sharding, replication and the WAL", he: "מסלול הכתיבה: sharding, replication וה-WAL" },
      body: {
        en: `<p>Distributors are stateless: they authenticate, enforce limits, and hash each series (tenant + labels) onto a <strong>consistent hash ring</strong> of ingesters, writing to 3 of them. A write succeeds on quorum (2/3), so one ingester can die or roll without data loss.</p>
<p>Each ingester appends to a <strong>WAL</strong> on local SSD before acknowledging, keeps the last ~2h in an in-memory head, and every 2h cuts an immutable block and uploads it to S3. On restart it replays the WAL — this is why rolling ingesters is slow (minutes per pod) and must be done one at a time.</p>
<ul>
<li>Sharding by series (not by tenant) spreads a big tenant across all ingesters; shuffle-sharding gives each tenant a subset of ingesters to limit blast radius.</li>
<li>Three replicas produce three copies of every block; the <strong>compactor</strong> merges and deduplicates them in S3, so the long-term cost is ~1×, not 3×.</li>
<li>Agents buffer in a local WAL too, so a 10-minute platform outage means delayed data, not lost data.</li>
</ul>`,
        he: `<p>ה-distributors הם stateless: הם עושים authentication, אוכפים limits, ועושים hash לכל series (tenant + labels) על <strong>consistent hash ring</strong> של ingesters, וכותבים ל-3 מהם. כתיבה מצליחה ב-quorum (2 מתוך 3), כך ש-ingester אחד יכול למות או לעבור rollout בלי לאבד דאטה.</p>
<p>כל ingester כותב קודם ל-<strong>WAL</strong> על SSD מקומי ורק אז מחזיר ack, מחזיק את השעתיים האחרונות ב-head בזיכרון, וכל שעתיים חותך block שלא משתנה ומעלה אותו ל-S3. ב-restart הוא עושה replay ל-WAL – ולכן rollout של ingesters איטי (דקות לכל pod) וחייב להיות אחד-אחד.</p>
<ul>
<li>Sharding לפי series (ולא לפי tenant) מפזר tenant גדול על כל ה-ingesters; shuffle-sharding נותן לכל tenant תת-קבוצה של ingesters כדי להגביל את ה-blast radius.</li>
<li>שלושה replicas מייצרים שלושה עותקים של כל block; ה-<strong>compactor</strong> ממזג ועושה dedup ב-S3, כך שהעלות לטווח ארוך היא בערך פי 1 ולא פי 3.</li>
<li>גם ה-agents שומרים buffer ב-WAL מקומי, אז השבתה של 10 דקות בפלטפורמה פירושה דאטה באיחור, לא דאטה אבוד.</li>
</ul>`
      }
    },
    {
      h: { en: "Read path: query frontend, caching and downsampling", he: "מסלול הקריאה: query frontend, caching ו-downsampling" },
      body: {
        en: `<p>A dashboard showing 30 days of <code>rate()</code> at 15s resolution would touch 172,800 points per series — wasteful when the screen has ~1,000 pixels. The read path fixes this in layers:</p>
<table>
<tr><th>Layer</th><th>What it does</th></tr>
<tr><td>Query frontend</td><td>Splits long ranges into 1-day sub-queries run in parallel; aligns step to cache boundaries; queues per tenant for fairness.</td></tr>
<tr><td>Results cache (Memcached/Redis)</td><td>Caches each day's sub-result; refreshing a dashboard only recomputes the last partial day.</td></tr>
<tr><td>Downsampling</td><td>Compactor builds 5m and 1h rollups; queries with step ≥ 5m auto-select them. Raw kept 15 days, 5m kept 1 year.</td></tr>
<tr><td>Store-gateway</td><td>Serves S3 blocks with index-header and chunk caches so queries don't do thousands of S3 GETs.</td></tr>
</table>
<p>Recent data (last 2h) comes from ingesters; older from store-gateways; queriers merge and dedup. Recording rules precompute expensive aggregations (e.g. per-service p99) so dashboards read one cheap series instead of aggregating 50k.</p>`,
        he: `<p>Dashboard שמציג 30 יום של <code>rate()</code> ברזולוציה של 15 שניות נוגע ב-172,800 נקודות לכל series – בזבוז כשבמסך יש בערך 1,000 פיקסלים. מסלול הקריאה פותר את זה בשכבות:</p>
<table>
<tr><th>שכבה</th><th>מה היא עושה</th></tr>
<tr><td>Query frontend</td><td>מפצל טווחים ארוכים לתת-שאילתות של יום שרצות במקביל; מיישר את ה-step לגבולות cache; תור לכל tenant בשביל הוגנות.</td></tr>
<tr><td>Results cache (Memcached/Redis)</td><td>שומר את התוצאה של כל יום; רענון dashboard מחשב מחדש רק את היום האחרון החלקי.</td></tr>
<tr><td>Downsampling</td><td>ה-compactor בונה rollups של 5 דקות ושל שעה; שאילתות עם step של 5 דקות ומעלה בוחרות אותם אוטומטית. Raw נשמר 15 יום, 5m נשמר שנה.</td></tr>
<tr><td>Store-gateway</td><td>מגיש blocks מ-S3 עם cache ל-index-header ול-chunks, כדי ששאילתה לא תעשה אלפי GETs ל-S3.</td></tr>
</table>
<p>דאטה טרי (שעתיים אחרונות) מגיע מה-ingesters, ישן יותר מה-store-gateways, וה-queriers ממזגים ועושים dedup. Recording rules מחשבים מראש אגרגציות יקרות (למשל p99 לכל service) כך שה-dashboard קורא series זול אחד במקום לאגרג 50k.</p>`
      }
    },
    {
      h: { en: "Alerting path: HA without duplicate pages", he: "מסלול ה-alerting: HA בלי pages כפולים" },
      body: {
        en: `<p>The alerting path must survive what it alerts on. The <strong>ruler</strong> shards rule groups across replicas (hash ring) and evaluates PromQL every 30s; a <code>for: 5m</code> clause prevents flapping. Firing alerts go to <strong>Alertmanager</strong> running as 3 replicas that gossip silences and a notification log; every ruler sends to all replicas, and the gossip ensures only one page goes out.</p>
<ul>
<li><strong>Grouping:</strong> 200 pods failing becomes one notification "HighErrorRate service=checkout (200 instances)".</li>
<li><strong>Inhibition:</strong> if "cluster down" fires, suppress the 500 dependent alerts.</li>
<li><strong>Dead man's switch:</strong> an always-firing "Watchdog" alert sent to an external service (e.g. healthchecks/PagerDuty heartbeat); if it stops arriving, the external side pages — this catches "the monitoring itself is dead".</li>
<li><strong>Meta-monitoring:</strong> a small independent Prometheus (different cluster/region) scrapes the platform's own components.</li>
</ul>
<blockquote>⚠️ Production tip: alert on symptoms (SLO burn rate), not causes (CPU 80%). Multi-window burn-rate alerts (1h + 5m) catch fast burns quickly and slow burns without noise.</blockquote>`,
        he: `<p>מסלול ה-alerting חייב לשרוד את מה שהוא מתריע עליו. ה-<strong>ruler</strong> מפזר rule groups בין replicas (hash ring) ומריץ PromQL כל 30 שניות; סעיף <code>for: 5m</code> מונע flapping. Alerts שיורים הולכים ל-<strong>Alertmanager</strong> שרץ ב-3 replicas שעושים gossip ל-silences ול-notification log; כל ruler שולח לכל ה-replicas, וה-gossip מבטיח שיוצא רק page אחד.</p>
<ul>
<li><strong>Grouping:</strong> 200 pods שנופלים הופכים להתראה אחת "HighErrorRate service=checkout (200 instances)".</li>
<li><strong>Inhibition:</strong> אם "cluster down" יורה, משתיקים את 500 ה-alerts שתלויים בו.</li>
<li><strong>Dead man's switch:</strong> alert בשם "Watchdog" שיורה תמיד ונשלח לשירות חיצוני (heartbeat ב-PagerDuty או healthchecks); אם הוא מפסיק להגיע, הצד החיצוני מעיר מישהו – ככה תופסים מצב ש"הניטור עצמו מת".</li>
<li><strong>Meta-monitoring:</strong> Prometheus קטן ועצמאי (בקלאסטר/region אחר) שעושה scrape לרכיבים של הפלטפורמה עצמה.</li>
</ul>
<blockquote>⚠️ טיפ מה-production: תתריעו על סימפטומים (SLO burn rate), לא על סיבות (CPU 80%). Burn-rate alerts עם שני חלונות (1h + 5m) תופסים שריפה מהירה מהר ושריפה איטית בלי רעש.</blockquote>`
      }
    }
  ],
  tradeoffs: [
    { en: "Pull vs push: pull gives free up-detection (the 'up' metric) and central control of scrape rate; push works for short-lived jobs, serverless and NAT'd networks. Hybrid wins: scrape locally with an agent, push (remote_write) to the central store.", he: "Pull מול push: pull נותן זיהוי up/down בחינם (ה-metric 'up') ושליטה מרכזית בקצב; push מתאים ל-jobs קצרים, serverless ורשתות מאחורי NAT. ההיברידי מנצח: scrape מקומי עם agent, ו-push (remote_write) לאחסון המרכזי." },
    { en: "Build vs buy: Mimir/Thanos/VictoriaMetrics self-hosted is cheaper at 50M series but costs a team of 2-4 engineers; Datadog is zero-ops but bills per custom metric and gets very expensive with high cardinality.", he: "Build מול buy: Mimir/Thanos/VictoriaMetrics בהוסטינג עצמי זול יותר ב-50M series אבל עולה צוות של 2-4 מהנדסים; Datadog זה zero-ops אבל מחייב לפי custom metric ונהיה יקר מאוד עם cardinality גבוה." },
    { en: "Availability over consistency on writes: accept quorum writes and occasional small gaps rather than blocking producers; monitoring data is approximate by nature.", he: "Availability על פני consistency בכתיבה: מקבלים quorum writes וחורים קטנים מדי פעם במקום לחסום את מי שכותב; דאטה של ניטור הוא מטבעו קירוב." },
    { en: "Downsampling saves storage and query time but loses detail: a 30-second spike disappears in a 1h average — so store max alongside avg.", he: "Downsampling חוסך אחסון וזמן שאילתה אבל מאבד פירוט: spike של 30 שניות נעלם בממוצע של שעה – ולכן שומרים max לצד avg." }
  ],
  followUps: [
    {
      q: { en: "A team pushes a deploy that adds a request_id label. What happens and how does your system protect itself?", he: "צוות עושה deploy שמוסיף label של request_id. מה קורה ואיך המערכת מגינה על עצמה?" },
      a: { en: "Series count for that tenant climbs by thousands per second. The distributor's per-tenant active-series limit trips, new series are rejected with 429 while existing series keep flowing, and a 'discarded samples' metric alerts the platform team and the owning team. Shuffle-sharding keeps the damage on that tenant's ingester subset. Long-term fix: relabel rule dropping the label at the agent, plus a CI lint on metric definitions. Ask yourself whether the real need is tracing or logs — request_id belongs there.", he: "כמות ה-series של ה-tenant עולה באלפים לשנייה. ה-limit של active series ב-distributor נתפס, series חדשים נדחים עם 429 בזמן שהקיימים ממשיכים לזרום, ו-metric של 'discarded samples' מתריע לצוות הפלטפורמה ולצוות הבעלים. Shuffle-sharding משאיר את הנזק על תת-הקבוצה של ה-ingesters של אותו tenant. תיקון לטווח ארוך: relabel rule שזורק את ה-label ב-agent, ו-lint ב-CI על הגדרות metrics. ושווה לשאול – request_id שייך ל-tracing או ל-logs, לא ל-metrics." }
    },
    {
      q: { en: "How do you compute a p99 latency across 300 pods correctly?", he: "איך מחשבים p99 latency נכון על פני 300 pods?" },
      a: { en: "You cannot average percentiles — the mean of 300 p99s is meaningless. Each pod exposes a histogram (bucket counters); you sum the bucket rates across pods and then compute the quantile: histogram_quantile(0.99, sum by (le) (rate(http_duration_seconds_bucket[5m]))). Accuracy depends on bucket boundaries, so put boundaries around your SLO threshold. Native/exponential histograms improve accuracy with fewer series.", he: "אי אפשר לעשות ממוצע של percentiles – ממוצע של 300 ערכי p99 הוא חסר משמעות. כל pod חושף histogram (counters לכל bucket); סוכמים את ה-rate של ה-buckets על פני ה-pods ורק אז מחשבים quantile: histogram_quantile(0.99, sum by (le) (rate(http_duration_seconds_bucket[5m]))). הדיוק תלוי בגבולות ה-buckets, אז שמים גבולות סביב סף ה-SLO. Native/exponential histograms משפרים דיוק עם פחות series." }
    },
    {
      q: { en: "The S3 region is down. What still works?", he: "ה-region של S3 נפל. מה עדיין עובד?" },
      a: { en: "Ingestion and the last ~2h of queries keep working from ingesters (WAL on local disk); alerting keeps working because almost all rules look at recent data. Block uploads fail and retry, so ingesters must have disk headroom for several hours of blocks. Historical dashboards fail or show partial data — the query should return a warning, not silently drop. For critical environments, replicate the bucket cross-region (S3 CRR) and run meta-monitoring outside the region.", he: "קליטה ושאילתות על השעתיים האחרונות ממשיכות לעבוד מה-ingesters (WAL על דיסק מקומי); ה-alerting ממשיך לעבוד כי כמעט כל ה-rules מסתכלים על דאטה טרי. העלאת blocks נכשלת ועושה retry, ולכן ל-ingesters צריך מקום בדיסק לכמה שעות של blocks. Dashboards היסטוריים נכשלים או מציגים דאטה חלקי – השאילתה צריכה להחזיר warning ולא להעלים בשקט. לסביבות קריטיות: replication של ה-bucket ל-region אחר (S3 CRR) ו-meta-monitoring מחוץ ל-region." }
    },
    {
      q: { en: "How would you cut the monthly bill by 40% without losing alerting quality?", he: "איך היית חותך 40% מהחשבון החודשי בלי לפגוע באיכות ה-alerting?" },
      a: { en: "Measure first: rank metrics by series count and join with query logs. Drop never-queried metrics and high-cardinality labels at the agent; raise scrape interval from 15s to 30s for infra metrics (halves samples); shorten raw retention from 15 to 7 days since 5m rollups cover older dashboards; move to recording rules for heavy dashboards; and charge back usage per team so owners care. Alerts mostly use recent data on a handful of SLO series, so they are unaffected.", he: "קודם מודדים: מדרגים metrics לפי כמות series ומצליבים עם query logs. זורקים ב-agent metrics שאף אחד לא שואל ו-labels עם cardinality גבוה; מעלים scrape interval מ-15 ל-30 שניות ל-metrics של infra (חצי מה-samples); מקצרים retention של raw מ-15 ל-7 ימים כי rollups של 5 דקות מכסים dashboards ישנים; עוברים ל-recording rules ל-dashboards כבדים; ועושים chargeback לפי צוות כדי שלבעלים יהיה אכפת. ה-alerts משתמשים בעיקר בדאטה טרי על כמה series של SLO, אז הם לא נפגעים." }
    }
  ],
  related: ["obs-metrics", "obs-alerting", "rel-sli-slo-sla", "db-sharding", "db-replication", "cloud-storage", "rel-ha"]
});

window.INFRA.designs.push({
  id: "sd-logging-pipeline", icon: "🪵", level: 3,
  title: { en: "Design a Centralized Logging Pipeline for 1,000 Services", he: "תכנון Logging Pipeline מרכזי ל-1,000 services" },
  prompt: {
    en: "We run about 1,000 microservices on Kubernetes across several clusters. Design a centralized logging platform so engineers can search logs during incidents, keep them for compliance, and not bankrupt the company.",
    he: "יש לנו בערך 1,000 microservices על Kubernetes בכמה קלאסטרים. תתכנן פלטפורמת logging מרכזית כך שמהנדסים יוכלו לחפש logs בזמן תקלות, לשמור אותם בשביל compliance, ובלי לפשוט את הרגל של החברה."
  },
  clarify: [
    { en: "What is the total log volume per day, and how bursty is it (incidents can 10x logs)?", he: "מה נפח ה-logs הכולל ביום, וכמה הוא bursty (בתקלה ה-logs יכולים לקפוץ פי 10)?" },
    { en: "What are the search patterns: full-text grep across everything, or mostly 'logs for service X, pod Y, last hour'?", he: "מה דפוסי החיפוש: full-text על הכל, או בעיקר 'logs של service X, pod Y, בשעה האחרונה'?" },
    { en: "Retention requirements: how long must logs be searchable fast vs just retrievable for audit (e.g. 1 year, 7 years)?", he: "דרישות retention: כמה זמן logs צריכים להיות ניתנים לחיפוש מהיר, וכמה רק לשליפה לצורך audit (שנה? 7 שנים?)." },
    { en: "Are logs structured (JSON) or free text? Can we enforce a schema?", he: "ה-logs מובנים (JSON) או טקסט חופשי? אפשר לאכוף schema?" },
    { en: "Any PII or secrets in logs, and data-residency rules (GDPR)?", he: "יש PII או secrets ב-logs, וחוקי data residency (GDPR)?" },
    { en: "Is losing some debug logs acceptable? Are audit logs a separate, lossless stream?", he: "מותר לאבד חלק מה-debug logs? Audit logs הם stream נפרד שאסור לאבד?" }
  ],
  functional: [
    { en: "Collect stdout/stderr and files from all pods and nodes, enriched with k8s metadata (cluster, namespace, service, pod, version).", he: "איסוף stdout/stderr וקבצים מכל ה-pods וה-nodes, עם העשרה ב-metadata של k8s (cluster, namespace, service, pod, version)." },
    { en: "Search and filter by labels and time, plus full-text, with live tail during incidents.", he: "חיפוש וסינון לפי labels וזמן, plus full-text, עם live tail בזמן תקלות." },
    { en: "Tiered retention: hot searchable (7 days), warm (30 days), cold archive (1+ year).", he: "Retention בשכבות: hot לחיפוש (7 ימים), warm (30 יום), cold archive (שנה ומעלה)." },
    { en: "Derive metrics and alerts from logs (e.g. count of ERROR per service).", he: "גזירת metrics ו-alerts מ-logs (למשל כמות ERROR לכל service)." },
    { en: "Correlate with traces via trace_id.", he: "קישור ל-traces דרך trace_id." }
  ],
  nonFunctional: [
    { en: "Ingest ~1M lines/sec sustained, 5M/sec bursts, ~43 TB/day raw.", he: "קליטה של כ-1M שורות לשנייה ברציפות, bursts של 5M לשנייה, כ-43 TB ביום raw." },
    { en: "End-to-end latency (emit → searchable) under 30 seconds at p99.", he: "Latency מקצה לקצה (כתיבה ← אפשר לחפש) מתחת ל-30 שניות ב-p99." },
    { en: "Logging must never take down or slow the application; backpressure ends in dropping, not blocking.", he: "Logging לעולם לא מפיל או מאט את האפליקציה; backpressure נגמר ב-drop, לא בחסימה." },
    { en: "Search over the last hour returns in under 5 seconds for a single service.", he: "חיפוש על השעה האחרונה ל-service בודד חוזר תוך פחות מ-5 שניות." },
    { en: "Cost target: well under the cost of the infrastructure being logged.", he: "יעד עלות: הרבה מתחת לעלות התשתית שעליה עושים logging." }
  ],
  estimates: {
    en: `<p><strong>Volume:</strong> 1,000 services × ~10 pods × ~100 lines/sec = <strong>1M lines/sec</strong>. Average line ~500 bytes (JSON + metadata) → 500 MB/s → × 86,400 ≈ <strong>43 TB/day raw</strong>.</p>
<p><strong>Kafka buffer:</strong> 500 MB/s in, zstd compression ~4× → 125 MB/s on disk. 24h retention × RF=3: 125 MB × 86,400 × 3 ≈ <strong>32 TB</strong> across brokers. At ~50 MB/s write per partition comfortably, ~200 partitions; ~12 brokers with 4 TB NVMe each.</p>
<p><strong>Full-text index (Elasticsearch/OpenSearch) for everything, 7 days:</strong> index size ≈ 1× raw, + 1 replica → 43 × 7 × 2 ≈ <strong>600 TB of SSD</strong>. At ~$0.10/GB-month for EBS gp3 alone that is ~$60k/month before compute — the reason to avoid indexing everything.</p>
<p><strong>Label-indexed + object storage (Loki/ClickHouse style):</strong> compressed chunks ~10× → 4.3 TB/day in S3. 30 days ≈ 130 TB × $0.023 ≈ <strong>$3k/month</strong>. 1 year in Glacier Instant/Deep Archive: 1.6 PB × $0.004 ≈ $6.4k/month, or ~$1.6k on Deep Archive.</p>
<p><strong>Query math:</strong> "service X, last 1h" = 1/1000 of volume ≈ 43 TB/24/1000 ≈ 1.8 GB raw → ~180 MB compressed — scannable in seconds by 20 parallel queriers. Full-text across <em>all</em> services for 1h = 1.8 TB raw — this is where you need either an index or a lot of parallel compute.</p>`,
    he: `<p><strong>נפח:</strong> 1,000 services × בערך 10 pods × בערך 100 שורות לשנייה = <strong>1M שורות לשנייה</strong>. שורה ממוצעת כ-500 בייט (JSON + metadata) → 500 MB/s → × 86,400 ≈ <strong>43 TB ביום raw</strong>.</p>
<p><strong>Kafka כ-buffer:</strong> 500 MB/s נכנס, דחיסת zstd בערך פי 4 → 125 MB/s לדיסק. Retention של 24 שעות × RF=3: 125 MB × 86,400 × 3 ≈ <strong>32 TB</strong> על כל ה-brokers. בערך 200 partitions (כ-50 MB/s בנוחות לכל partition בשיא), וכ-12 brokers עם 4 TB NVMe כל אחד.</p>
<p><strong>Full-text index (Elasticsearch/OpenSearch) על הכל ל-7 ימים:</strong> גודל האינדקס ≈ פי 1 מה-raw, + replica → 43 × 7 × 2 ≈ <strong>600 TB של SSD</strong>. ב-0.10$ ל-GB לחודש על EBS gp3 בלבד זה כ-60k$ לחודש לפני compute – וזו הסיבה לא לאנדקס הכל.</p>
<p><strong>Index רק על labels + object storage (בסגנון Loki/ClickHouse):</strong> chunks דחוסים פי 10 → 4.3 TB ביום ב-S3. 30 יום ≈ 130 TB × 0.023$ ≈ <strong>3k$ לחודש</strong>. שנה ב-Glacier: 1.6 PB × 0.004$ ≈ 6.4k$ לחודש, או כ-1.6k$ ב-Deep Archive.</p>
<p><strong>חשבון שאילתות:</strong> "service X, שעה אחרונה" = 1/1000 מהנפח ≈ 43 TB/24/1000 ≈ 1.8 GB raw → כ-180 MB דחוס – 20 queriers במקביל סורקים את זה בשניות. Full-text על <em>כל</em> ה-services לשעה = 1.8 TB raw – פה צריך או אינדקס או הרבה compute מקבילי.</p>`
  },
  api: `# Collection is not an API: agents tail /var/log/pods/*/*.log on each node.

# Query API
GET  /api/v1/logs/query_range?query={cluster="prod-eu",service="checkout"} |= "timeout" | json | level="error"
         &start=...&end=...&limit=1000&direction=backward   -> {streams:[{labels, entries:[{ts,line}]}]}
GET  /api/v1/logs/tail?query={service="checkout"}            (WebSocket, live tail)
GET  /api/v1/logs/labels  |  /api/v1/logs/label/{name}/values

# Archive retrieval (async, for audits)
POST /api/v1/archive/restore {query, start, end} -> 202 {job_id}
GET  /api/v1/archive/restore/{job_id}            -> {status, result_url}

# Admin
PUT  /api/v1/tenants/{team}/limits {ingest_mb_s, retention_days, sampling:{debug:0.1}}`,
  dataModel: `Log event (JSON, enforced by logging library):
  {ts, level, service, version, cluster, namespace, pod, node, trace_id, span_id, msg, ...fields}

Kafka: topic logs.<tier>  (logs.critical, logs.default, logs.debug)
  key = service/pod (keeps a pod's lines ordered in one partition)

Stream (Loki-style): unique label set {cluster, namespace, service, level}  (LOW cardinality!)
  index: (tenant, labels hash, day) -> list of chunk refs   (in BoltDB/TSDB index or DynamoDB)
  chunk: ~1-2 MB compressed lines of one stream for a time window -> S3 object

Alternative hot store (ClickHouse):
  logs(ts DateTime64, service LowCardinality(String), level LowCardinality(String),
       pod String, trace_id String, msg String, attrs Map(String,String))
  ENGINE MergeTree PARTITION BY toDate(ts) ORDER BY (service, level, ts)  TTL ts + 30 DAY TO VOLUME 's3'`,
  diagram: `  Node (x5,000)
  +------------------------------+
  | pods -> stdout -> /var/log/  |
  | Fluent Bit / Vector DaemonSet|  parse, add k8s metadata, redact PII,
  | (disk buffer, rate limit)    |  drop/sample debug, batch+compress
  +--------------+---------------+
                 | TLS
                 v
        +------------------+   topics: logs.critical / logs.default / logs.debug
        |  Kafka (RF=3,    |   24h retention = replay buffer for downstream outages
        |  ~200 partitions)|
        +---+---------+----+-------------------+
            |         |                        |
            v         v                        v
   +-----------+  +--------------+     +-----------------+
   | Indexers  |  | Log->metrics |     | Archiver        |
   | (Loki     |  | (count errors|     | Parquet/zstd -> |
   | ingesters |  |  -> Prom)    |     | S3 Glacier, 1y+ |
   | or CH)    |  +--------------+     +-----------------+
   +-----+-----+
         | chunks + index
         v
   +-----------+      +-----------------------+
   |  S3 (hot/ |<-----| Queriers (parallel,   |<--- Grafana / UI / CLI
   |  warm 30d)|      | cache, per-tenant QoS)|     (search, live tail, trace_id link)
   +-----------+      +-----------------------+`,
  deepDives: [
    {
      h: { en: "The agent: never hurt the app, buffer, enrich, redact", he: "ה-agent: לא לפגוע באפליקציה, buffer, העשרה, redaction" },
      body: {
        en: `<p>Apps write to stdout; the container runtime writes to <code>/var/log/pods</code>; a DaemonSet agent (Fluent Bit or Vector — small, fast, written in C/Rust) tails those files. Because the app only writes to a local file, a pipeline outage <strong>never blocks the app</strong>.</p>
<ul>
<li><strong>Disk buffer:</strong> if Kafka is unreachable, the agent spools to local disk (e.g. 5 GB cap) and resumes from its file offsets. When the buffer fills, it drops lowest-priority logs first (debug before error).</li>
<li><strong>Enrichment:</strong> attach cluster, namespace, service, pod, image version from the kubelet/API — engineers filter by these labels.</li>
<li><strong>Redaction:</strong> regex/structured masking for emails, card numbers, tokens <em>before</em> data leaves the node — it is much harder to delete PII from an archive later.</li>
<li><strong>Per-pod rate limits:</strong> a pod stuck in a tight error loop writing 50k lines/sec gets throttled and a "logs dropped" counter is emitted.</li>
</ul>
<blockquote>⚠️ Watch out: log rotation by kubelet (default 10 MB) can rotate faster than a lagging agent reads, silently losing lines. Monitor agent lag and dropped bytes.</blockquote>`,
        he: `<p>אפליקציות כותבות ל-stdout; ה-container runtime כותב ל-<code>/var/log/pods</code>; agent שרץ כ-DaemonSet (Fluent Bit או Vector – קטנים ומהירים, כתובים ב-C/Rust) עושה tail לקבצים. בגלל שהאפליקציה כותבת רק לקובץ מקומי, תקלה ב-pipeline <strong>אף פעם לא חוסמת את האפליקציה</strong>.</p>
<ul>
<li><strong>Disk buffer:</strong> אם Kafka לא זמין, ה-agent שומר לדיסק המקומי (למשל תקרה של 5 GB) וממשיך מה-offsets בקבצים. כשה-buffer מתמלא, הוא זורק קודם את מה שהכי פחות חשוב (debug לפני error).</li>
<li><strong>העשרה:</strong> מוסיפים cluster, namespace, service, pod וגרסת image מה-kubelet/API – לפי ה-labels האלה מהנדסים מסננים.</li>
<li><strong>Redaction:</strong> masking של מיילים, מספרי כרטיס ו-tokens <em>לפני</em> שהדאטה יוצא מה-node – הרבה יותר קשה למחוק PII מ-archive אחר כך.</li>
<li><strong>Rate limit לכל pod:</strong> pod שתקוע בלולאת שגיאות וכותב 50k שורות לשנייה מקבל throttle, ויוצא counter של "logs dropped".</li>
</ul>
<blockquote>⚠️ שימו לב: log rotation של ה-kubelet (ברירת מחדל 10 MB) יכול לסובב קבצים מהר יותר ממה ש-agent מפגר קורא, ושורות נעלמות בשקט. תנטרו lag של ה-agent ו-dropped bytes.</blockquote>`
      }
    },
    {
      h: { en: "Why Kafka in the middle", he: "למה Kafka באמצע" },
      body: {
        en: `<p>Shipping agents straight into Elasticsearch works until the first incident: logs spike 10×, the indexers slow down, agents back up, and you lose exactly the logs you need. Kafka decouples producers from consumers:</p>
<ul>
<li><strong>Absorbs bursts:</strong> brokers write sequentially at hundreds of MB/s; indexers consume at their own pace and catch up after the spike.</li>
<li><strong>Replay:</strong> 24h retention lets you re-index after a bad parser deploy or an indexer outage — no data loss.</li>
<li><strong>Fan-out:</strong> the same stream feeds the indexer, the archiver, log-derived metrics and security (SIEM) via separate consumer groups.</li>
<li><strong>Priority:</strong> separate topics (critical/default/debug) let you give critical logs dedicated consumers and drop debug under pressure.</li>
</ul>
<p>Partition key = pod/service keeps one pod's lines ordered. Key metric: <strong>consumer lag</strong> per group, converted to seconds — that is your "time to searchable" SLI.</p>
<blockquote>💡 For smaller setups, Kafka can be replaced by Vector/Fluentd aggregators with disk buffers, or a managed service (Kinesis, Pub/Sub) — same role, less ops.</blockquote>`,
        he: `<p>לשלוח מה-agents ישר ל-Elasticsearch עובד עד התקלה הראשונה: ה-logs קופצים פי 10, ה-indexers מאטים, ה-agents נתקעים, ואתה מאבד בדיוק את ה-logs שאתה צריך. Kafka מנתק בין ה-producers ל-consumers:</p>
<ul>
<li><strong>בולע bursts:</strong> ה-brokers כותבים סדרתית במאות MB לשנייה; ה-indexers צורכים בקצב שלהם ומדביקים פער אחרי ה-spike.</li>
<li><strong>Replay:</strong> retention של 24 שעות מאפשר re-index אחרי deploy של parser שבור או נפילה של indexer – בלי לאבד דאטה.</li>
<li><strong>Fan-out:</strong> אותו stream מזין את ה-indexer, ה-archiver, metrics שנגזרים מ-logs ו-security (SIEM), כל אחד ב-consumer group משלו.</li>
<li><strong>עדיפויות:</strong> topics נפרדים (critical/default/debug) מאפשרים לתת ל-critical consumers ייעודיים ולזרוק debug בעומס.</li>
</ul>
<p>Partition key = pod/service שומר על סדר השורות של pod. ה-metric המרכזי: <strong>consumer lag</strong> לכל group, מתורגם לשניות – זה ה-SLI של "זמן עד שאפשר לחפש".</p>
<blockquote>💡 בסטאפים קטנים אפשר להחליף את Kafka ב-aggregators של Vector/Fluentd עם disk buffer, או בשירות מנוהל (Kinesis, Pub/Sub) – אותו תפקיד, פחות ops.</blockquote>`
      }
    },
    {
      h: { en: "Indexing vs object storage: the core cost decision", he: "Indexing מול object storage: החלטת העלות המרכזית" },
      body: {
        en: `<table>
<tr><th></th><th>Full-text index (Elasticsearch/OpenSearch)</th><th>Label index + chunks in S3 (Loki)</th><th>Columnar (ClickHouse)</th></tr>
<tr><td>Ingest cost</td><td>High: inverted index on every token, CPU-heavy</td><td>Low: compress and upload</td><td>Medium</td></tr>
<tr><td>Storage</td><td>~1-1.5× raw on SSD</td><td>~0.1× raw on S3</td><td>~0.1-0.2× raw, can tier to S3</td></tr>
<tr><td>Needle search across all services</td><td>Fast (ms-s)</td><td>Slow: brute-force scan</td><td>Fast with skip indexes/bloom filters</td></tr>
<tr><td>Aggregations</td><td>OK</td><td>Limited</td><td>Excellent (SQL)</td></tr>
</table>
<p>Most incident queries start from "which service and when" — that is exactly what labels give you. A pragmatic answer: label-indexed storage (Loki or ClickHouse) for the bulk, plus a <strong>small full-text index</strong> only for the streams that need it (security/audit, or the 3 days of error-level logs). Keep labels low-cardinality: <code>service</code>, <code>level</code>, <code>namespace</code> — never <code>user_id</code> or <code>trace_id</code> as a label; those are searched as content with bloom filters.</p>`,
        he: `<table>
<tr><th></th><th>Full-text index (Elasticsearch/OpenSearch)</th><th>Index על labels + chunks ב-S3 (Loki)</th><th>עמודתי (ClickHouse)</th></tr>
<tr><td>עלות קליטה</td><td>גבוהה: inverted index על כל token, כבד ב-CPU</td><td>נמוכה: דוחסים ומעלים</td><td>בינונית</td></tr>
<tr><td>אחסון</td><td>פי 1-1.5 מה-raw על SSD</td><td>בערך 0.1 מה-raw ב-S3</td><td>0.1-0.2 מה-raw, אפשר tiering ל-S3</td></tr>
<tr><td>חיפוש מחט על כל ה-services</td><td>מהיר (ms עד שניות)</td><td>איטי: סריקה ב-brute force</td><td>מהיר עם skip indexes/bloom filters</td></tr>
<tr><td>אגרגציות</td><td>סביר</td><td>מוגבל</td><td>מצוין (SQL)</td></tr>
</table>
<p>רוב השאילתות בתקלה מתחילות מ"איזה service ומתי" – וזה בדיוק מה ש-labels נותנים. תשובה פרגמטית: אחסון עם index על labels (Loki או ClickHouse) לרוב הנפח, ועוד <strong>full-text index קטן</strong> רק ל-streams שצריכים את זה (security/audit, או 3 ימים של logs ברמת error). שומרים על labels עם cardinality נמוך: <code>service</code>, <code>level</code>, <code>namespace</code> – לעולם לא <code>user_id</code> או <code>trace_id</code> כ-label; אותם מחפשים כתוכן עם bloom filters.</p>`
      }
    },
    {
      h: { en: "Retention tiers and cost controls", he: "שכבות retention ובקרת עלויות" },
      body: {
        en: `<p>Log value decays fast: 90% of queries hit the last 24h. Design storage to match:</p>
<ul>
<li><strong>Hot (0-7 days):</strong> SSD cache + recent chunks, fast queries, query result cache.</li>
<li><strong>Warm (7-30 days):</strong> S3 Standard only, queried directly with more parallelism, slower is fine.</li>
<li><strong>Cold (30 days - 7 years):</strong> archiver writes Parquet + zstd to S3 Glacier via lifecycle rules; retrieval is an async restore job for audits.</li>
</ul>
<p>Cost levers, in order of impact:</p>
<ol>
<li><strong>Don't produce it:</strong> sample debug/info at the agent (e.g. keep 10% of 2xx access logs, 100% of errors).</li>
<li><strong>Per-team quotas and chargeback:</strong> show each team its GB/day and dollars; behavior changes overnight.</li>
<li><strong>Turn repetitive logs into metrics:</strong> "request served in 12ms" × 1M/sec belongs in a histogram, not in logs.</li>
<li><strong>Different retention per tier:</strong> debug 3 days, default 30 days, audit 7 years.</li>
</ol>
<blockquote>💡 GDPR "right to be forgotten" is painful in immutable archives — redact at the edge, or encrypt per-tenant keys so deleting a key deletes the data (crypto-shredding).</blockquote>`,
        he: `<p>הערך של log דועך מהר: 90% מהשאילתות נוגעות ב-24 השעות האחרונות. מתכננים את האחסון בהתאם:</p>
<ul>
<li><strong>Hot (0-7 ימים):</strong> cache על SSD + chunks טריים, שאילתות מהירות, results cache.</li>
<li><strong>Warm (7-30 יום):</strong> רק S3 Standard, שואלים ישירות עם יותר מקביליות, איטי יותר זה בסדר.</li>
<li><strong>Cold (30 יום עד 7 שנים):</strong> ה-archiver כותב Parquet + zstd ל-S3 Glacier דרך lifecycle rules; שליפה היא restore job אסינכרוני ל-audits.</li>
</ul>
<p>מנופי עלות, לפי סדר השפעה:</p>
<ol>
<li><strong>לא לייצר מלכתחילה:</strong> sampling של debug/info ב-agent (למשל לשמור 10% מ-access logs של 2xx, ו-100% מה-errors).</li>
<li><strong>Quotas ו-chargeback לכל צוות:</strong> מראים לכל צוות כמה GB ביום וכמה דולר; ההתנהגות משתנה בין לילה.</li>
<li><strong>להפוך logs חוזרים ל-metrics:</strong> "request served in 12ms" פי מיליון לשנייה שייך ל-histogram, לא ל-logs.</li>
<li><strong>Retention שונה לכל שכבה:</strong> debug ל-3 ימים, default ל-30, audit ל-7 שנים.</li>
</ol>
<blockquote>💡 "הזכות להישכח" של GDPR כואבת ב-archive שלא משתנה – עושים redaction בקצה, או מצפינים עם מפתח לכל tenant כך שמחיקת המפתח מוחקת את הדאטה (crypto-shredding).</blockquote>`
      }
    }
  ],
  tradeoffs: [
    { en: "Full-text indexing everything gives the best search UX but costs ~10-20× more than label-indexed object storage at 43 TB/day.", he: "Full-text indexing על הכל נותן את חוויית החיפוש הכי טובה, אבל ב-43 TB ביום עולה פי 10-20 מ-object storage עם index על labels." },
    { en: "At-least-once delivery through Kafka means rare duplicates in search results; exactly-once would cost throughput for little value. Audit logs may justify idempotent keys.", he: "At-least-once דרך Kafka אומר כפילויות נדירות בתוצאות; exactly-once יעלה ב-throughput בשביל ערך קטן. ב-audit logs אולי מוצדק להשתמש ב-idempotency keys." },
    { en: "Dropping/sampling under pressure protects the platform and the apps but can lose evidence — mitigate with priorities (never sample errors or audit).", he: "Drop/sampling בעומס מגן על הפלטפורמה ועל האפליקציות אבל עלול לאבד ראיות – מצמצמים עם עדיפויות (לעולם לא sampling על errors או audit)." },
    { en: "Self-hosted (Kafka + Loki/ClickHouse) is far cheaper at this scale than Splunk/Datadog per-GB pricing, but needs a dedicated platform team and on-call.", he: "Self-hosted (Kafka + Loki/ClickHouse) הרבה יותר זול בסקייל הזה מתמחור לפי GB של Splunk/Datadog, אבל דורש צוות פלטפורמה ייעודי ו-on-call." }
  ],
  followUps: [
    {
      q: { en: "During a major incident, log volume jumps 10× and searches time out exactly when people need them. What do you do?", he: "בזמן תקלה גדולה נפח ה-logs קופץ פי 10, והחיפושים עושים timeout בדיוק כשצריכים אותם. מה עושים?" },
      a: { en: "Kafka absorbs the ingest spike; indexers fall behind, so consumer lag grows — autoscale indexers on lag (KEDA) and prioritize the critical/error topic. On the read side, isolate query capacity from ingest (separate queriers), enforce per-query limits and per-tenant fairness so one huge regex can't starve everyone, and give the incident team a reserved query pool. Prevention: per-pod rate limits at the agent stop one crash-looping service from creating the 10×.", he: "Kafka בולע את ה-spike בקליטה; ה-indexers מפגרים וה-consumer lag גדל – עושים autoscale ל-indexers לפי lag (KEDA) ונותנים עדיפות ל-topic של critical/error. בצד הקריאה: מפרידים capacity של שאילתות מקליטה (queriers נפרדים), אוכפים limits לכל שאילתה והוגנות בין tenants כך ש-regex ענק אחד לא ירעיב את כולם, ונותנים לצוות התקלה pool שאילתות שמור. מניעה: rate limit לכל pod ב-agent מונע מ-service אחד ב-crash loop לייצר את ה-פי 10." }
    },
    {
      q: { en: "Someone logged credit card numbers for two weeks. How do you clean up?", he: "מישהו כתב מספרי כרטיסי אשראי ל-logs במשך שבועיים. איך מנקים?" },
      a: { en: "Stop the bleed: hotfix the service and add an agent redaction rule (Luhn-matching regex) immediately. Then find affected data: the streams for that service in the time window. Hot/warm chunks: rewrite or delete those chunks (Loki/ClickHouse support deletes by selector/partition); Kafka: wait out the 24h retention or delete the topic segments; archive: if crypto-shredding per tenant/day is in place, rotate the key; otherwise restore, rewrite and re-upload. Notify security/compliance — this is a PCI incident. Prevent with redaction by default and a CI check for logging of sensitive fields.", he: "קודם עוצרים את הדימום: hotfix ל-service וכלל redaction ב-agent (regex עם בדיקת Luhn) מיד. אחר כך מאתרים את הדאטה: ה-streams של אותו service בחלון הזמן. ב-hot/warm: כותבים מחדש או מוחקים את ה-chunks (Loki ו-ClickHouse תומכים במחיקה לפי selector/partition); ב-Kafka: מחכים ל-retention של 24 שעות או מוחקים segments; ב-archive: אם יש crypto-shredding לפי tenant/יום – מסובבים את המפתח, אחרת restore, כתיבה מחדש והעלאה. מעדכנים security/compliance – זה אירוע PCI. מונעים עם redaction כברירת מחדל ובדיקת CI על logging של שדות רגישים." }
    },
    {
      q: { en: "How do you guarantee audit logs are never lost, while regular logs can be dropped?", he: "איך מבטיחים ש-audit logs לעולם לא הולכים לאיבוד, בזמן ש-logs רגילים מותר לזרוק?" },
      a: { en: "Separate the path. Audit events are written by the app to a durable producer (Kafka with acks=all, min.insync.replicas=2, idempotent producer) or a local outbox table, not via stdout scraping. The topic has its own consumers that write to S3 with Object Lock (WORM) for tamper-evidence. Monitor end-to-end with sequence numbers per producer to detect gaps. Regular logs keep the cheap best-effort path.", he: "מפרידים את המסלול. אירועי audit נכתבים מהאפליקציה ל-producer עמיד (Kafka עם acks=all, min.insync.replicas=2, idempotent producer) או לטבלת outbox מקומית, לא דרך tail של stdout. ל-topic יש consumers משלו שכותבים ל-S3 עם Object Lock (WORM) כדי שאי אפשר יהיה לשנות. מנטרים מקצה לקצה עם sequence numbers לכל producer כדי לזהות חורים. ה-logs הרגילים נשארים במסלול ה-best-effort הזול." }
    }
  ],
  related: ["obs-logs", "obs-traces", "arch-brokers", "arch-queues", "cloud-storage", "obs-metrics", "db-backups"]
});

window.INFRA.designs.push({
  id: "sd-ci-cd-platform", icon: "🚀", level: 3,
  title: { en: "Design an Internal CI/CD Platform for 500 Engineers", he: "תכנון פלטפורמת CI/CD פנימית ל-500 מהנדסים" },
  prompt: {
    en: "Our 500 engineers complain that CI is slow, flaky and expensive, and deploys are scary. Design an internal CI/CD platform: from git push to safely running in production on Kubernetes.",
    he: "500 המהנדסים שלנו מתלוננים ש-CI איטי, flaky ויקר, ושה-deploys מפחידים. תתכנן פלטפורמת CI/CD פנימית: מ-git push ועד ריצה בטוחה ב-production על Kubernetes."
  },
  clarify: [
    { en: "Monorepo or many repos? Which languages and build tools (Bazel, Gradle, npm, Go)?", he: "Monorepo או הרבה repos? אילו שפות וכלי build (Bazel, Gradle, npm, Go)?" },
    { en: "How many pushes/PRs per day, and what are current build times and the target (e.g. PR feedback under 10 min)?", he: "כמה pushes/PRs ביום, מה זמני ה-build היום ומה היעד (למשל feedback על PR תוך 10 דקות)?" },
    { en: "Where do we deploy: one or many k8s clusters, regions, environments (dev/staging/prod)?", he: "לאן עושים deploy: קלאסטר אחד או הרבה, regions, סביבות (dev/staging/prod)?" },
    { en: "Build vs buy: are GitHub Actions / GitLab CI acceptable with self-hosted runners, or must it be fully in-house?", he: "Build מול buy: GitHub Actions / GitLab CI עם self-hosted runners זה בסדר, או חייב להיות in-house לגמרי?" },
    { en: "Compliance needs: audit trail of who deployed what, approvals for prod, signed artifacts (SOC2, supply chain)?", he: "דרישות compliance: audit trail של מי עשה deploy למה, אישורים ל-prod, artifacts חתומים (SOC2, supply chain)?" }
  ],
  functional: [
    { en: "Trigger pipelines on push/PR/tag; run build, test, lint, security scan steps defined as code in the repo.", he: "הפעלת pipelines על push/PR/tag; הרצת שלבי build, test, lint, security scan שמוגדרים כקוד ב-repo." },
    { en: "Autoscaling, isolated build runners (Linux containers, some macOS/GPU).", he: "Build runners מבודדים עם autoscaling (Linux containers, וקצת macOS/GPU)." },
    { en: "Store immutable, signed artifacts (container images, packages) with provenance.", he: "אחסון artifacts חתומים ובלתי משתנים (container images, packages) עם provenance." },
    { en: "Progressive deploys (canary) to multiple clusters with automatic analysis and one-click/automatic rollback.", he: "Deploys הדרגתיים (canary) לכמה קלאסטרים עם ניתוח אוטומטי ו-rollback אוטומטי או בלחיצה." },
    { en: "Visibility: pipeline status, logs, flaky test tracking, DORA metrics.", he: "שקיפות: סטטוס pipelines, logs, מעקב flaky tests, מדדי DORA." }
  ],
  nonFunctional: [
    { en: "PR feedback p50 under 10 min, p90 under 20 min; queue wait under 1 min at peak.", he: "Feedback על PR ב-p50 מתחת ל-10 דקות, p90 מתחת ל-20; המתנה בתור מתחת לדקה בשיא." },
    { en: "CI control plane 99.9% during work hours; deploy path must work even when CI is degraded (to ship a hotfix).", he: "Control plane של CI ב-99.9% בשעות העבודה; מסלול ה-deploy חייב לעבוד גם כש-CI במצב degraded (כדי להוציא hotfix)." },
    { en: "Isolation and security: untrusted PR code must not reach prod secrets; artifacts are reproducible and signed.", he: "בידוד ואבטחה: קוד של PR לא אמין לא מגיע ל-secrets של prod; artifacts הם reproducible וחתומים." },
    { en: "Cost-efficient: scale to near zero at night and weekends.", he: "יעילות עלות: לרדת כמעט לאפס בלילות ובסופי שבוע." }
  ],
  estimates: {
    en: `<p><strong>Pipelines:</strong> 500 engineers × ~5 pushes/day = 2,500 pipeline runs/day, each fanning out to ~10 jobs → <strong>25,000 jobs/day</strong>.</p>
<p><strong>Peak concurrency:</strong> work happens in ~8 hours → 3,100 jobs/hour average; peak hour (after stand-up, before release cut) ~3× → ~9,400 jobs/hour. Average job 10 min → Little's law: concurrency = 9,400/60 × 10 ≈ <strong>1,560 concurrent jobs</strong>. At 4 vCPU / 8 GB each → ~6,200 vCPU at peak, near 0 at night.</p>
<p><strong>Compute cost:</strong> 25,000 jobs × 10 min × 4 vCPU ≈ 1M vCPU-minutes/day ≈ 16,700 vCPU-hours/day. On spot at ~$0.01/vCPU-h ≈ $170/day (~$5k/month); on-demand ~3× that. Always-on fleet sized for peak would be 6,200 × 24 × $0.04 ≈ $6k/day — autoscaling is the whole game.</p>
<p><strong>Artifacts:</strong> 2,500 runs × ~1 image × ~500 MB = 1.25 TB/day logical, but layer dedup leaves maybe ~10% new layers → ~125 GB/day. 30-day retention for non-release builds ≈ 4 TB; releases kept forever (small).</p>
<p><strong>Cache traffic:</strong> 25,000 jobs × ~1 GB of dependencies = 25 TB/day if downloaded from the internet each time — a local cache/proxy (Artifactory/Nexus, S3-backed build cache) in the same AZ turns this into fast LAN reads and removes npm/Maven rate-limit failures.</p>`,
    he: `<p><strong>Pipelines:</strong> 500 מהנדסים × בערך 5 pushes ביום = 2,500 ריצות pipeline ביום, כל אחת מתפצלת לכ-10 jobs → <strong>25,000 jobs ביום</strong>.</p>
<p><strong>מקביליות בשיא:</strong> העבודה מתרכזת בכ-8 שעות → 3,100 jobs בשעה בממוצע; שעת שיא (אחרי ה-stand-up, לפני release cut) בערך פי 3 → כ-9,400 jobs בשעה. Job ממוצע 10 דקות → לפי Little's law: מקביליות = 9,400/60 × 10 ≈ <strong>1,560 jobs במקביל</strong>. עם 4 vCPU ו-8 GB לכל אחד → כ-6,200 vCPU בשיא, וכמעט 0 בלילה.</p>
<p><strong>עלות compute:</strong> 25,000 jobs × 10 דקות × 4 vCPU ≈ מיליון vCPU-דקות ביום ≈ 16,700 vCPU-שעות ביום. על spot בכ-0.01$ ל-vCPU-שעה ≈ 170$ ביום (כ-5k$ לחודש); on-demand בערך פי 3. Fleet קבוע בגודל השיא היה 6,200 × 24 × 0.04$ ≈ 6k$ ביום – autoscaling זה כל הסיפור.</p>
<p><strong>Artifacts:</strong> 2,500 ריצות × בערך image אחד × כ-500 MB = 1.25 TB ביום לוגי, אבל dedup של layers משאיר אולי 10% layers חדשים → כ-125 GB ביום. Retention של 30 יום ל-builds שאינם release ≈ 4 TB; releases נשמרים לתמיד (קטן).</p>
<p><strong>תעבורת cache:</strong> 25,000 jobs × בערך 1 GB של dependencies = 25 TB ביום אם מורידים כל פעם מהאינטרנט – cache/proxy מקומי (Artifactory/Nexus, build cache על S3) באותו AZ הופך את זה לקריאות LAN מהירות ומעלים כשלים של rate limit מ-npm/Maven.</p>`
  },
  api: `# Webhook from Git (GitHub/GitLab)
POST /hooks/git {repo, ref, sha, event: push|pull_request|tag}  -> 202

# Pipelines
POST /api/v1/pipelines {repo, sha, ref, trigger}            -> 201 {pipeline_id}
GET  /api/v1/pipelines/{id}                                  -> {status, jobs:[{id,name,status,runner,duration}]}
GET  /api/v1/jobs/{id}/logs?follow=true                      (stream)
POST /api/v1/jobs/{id}/retry

# Runner protocol (pull model, runners call the scheduler)
POST /api/v1/runners/claim {labels:[linux,4cpu], runner_id}  -> {job spec, short-lived token} | 204

# Deploys
POST /api/v1/deployments {service, image_digest, env, strategy: canary} -> 201 {deployment_id}
POST /api/v1/deployments/{id}/promote | /rollback
GET  /api/v1/services/{svc}/history?env=prod`,
  dataModel: `pipelines(id PK, repo, sha, ref, trigger, status, created_at, finished_at)
jobs(id PK, pipeline_id FK, name, needs[], runner_labels[], status, attempt,
     runner_id, started_at, finished_at, log_uri, cache_key)
test_results(job_id, test_name, status, duration_ms)   -> flaky detection (same sha, pass+fail)
artifacts(digest PK sha256, repo, sha, type, size, signature, sbom_uri, provenance_uri, created_at)
deployments(id PK, service, env, cluster, image_digest, strategy, status, started_by,
            approved_by, started_at, canary_step, analysis_result)
Job queue: Postgres (SELECT ... FOR UPDATE SKIP LOCKED) or Redis streams, partitioned by runner label
Logs: chunked to S3, live tail via Redis pub/sub
Desired state for deploys: Git repo "env-config" (GitOps) per cluster`,
  diagram: `  dev --push--> [GitHub/GitLab] --webhook--> +--------------------+
                                             | CI API + Scheduler | <--> [Postgres: pipelines/jobs]
                                             | (parse .ci.yaml,   |
                                             |  build DAG, queue) |
                                             +---------+----------+
                                                       | queue per label (linux-4cpu, gpu, macos)
                                    +------------------+-------------------+
                                    v                                      v
                    +-------------------------------+          +------------------+
                    | Runner pool on k8s (spot)     |          | macOS / GPU pool |
                    | ephemeral pod per job,        |          | (small, reserved)|
                    | Karpenter/cluster-autoscaler  |          +------------------+
                    | scale on queue depth          |
                    +---+-----------+-----------+---+
                        |           |           |
                        v           v           v
             [Remote build cache] [Dependency proxy] [Logs -> S3]
              (Bazel/Gradle, S3)   (Artifactory/Nexus)
                        |
                        v  push image by digest, sign (cosign), SBOM
                 +----------------------+
                 | Registry (ECR/Harbor)|
                 +----------+-----------+
                            | CD: update image digest in env-config repo (GitOps)
                            v
                 +----------------------+      metrics/SLOs      +-------------+
                 | Argo CD + Argo       | <--------------------- | Prometheus  |
                 | Rollouts per cluster |  canary 5%->25%->100%  +-------------+
                 +----------------------+  auto-rollback on SLO breach
                    prod-eu   prod-us   staging`,
  deepDives: [
    {
      h: { en: "Runners: ephemeral, isolated, autoscaled on queue depth", he: "Runners: זמניים, מבודדים, autoscaling לפי עומק התור" },
      body: {
        en: `<p>Each job runs in a <strong>fresh, ephemeral pod</strong> (or Firecracker microVM for stronger isolation) that is destroyed afterwards. This kills the classic "works on runner 7 because someone left a file there" flakiness and stops a malicious PR from persisting on a shared host.</p>
<ul>
<li><strong>Pull model:</strong> runners claim jobs from the scheduler (outbound only), so runners can sit in private subnets without inbound firewall holes.</li>
<li><strong>Autoscaling:</strong> scale on <em>queue depth and wait time</em>, not CPU. KEDA reads pending jobs per label → pods; Karpenter provisions spot nodes in ~60s. Keep a small warm pool (e.g. 50 runners) in work hours to hide node startup.</li>
<li><strong>Spot interruptions:</strong> CI is retry-friendly; the scheduler marks interrupted jobs and requeues automatically (attempt+1), without counting it as a test failure.</li>
<li><strong>Trust tiers:</strong> PRs from forks run in a pool with no secrets and no network to internal systems; main-branch and release pipelines run in a separate pool with OIDC-issued, short-lived cloud credentials.</li>
</ul>
<blockquote>⚠️ Docker-in-Docker with privileged pods is a container escape waiting to happen. Prefer rootless builders (BuildKit rootless, Kaniko) or microVMs.</blockquote>`,
        he: `<p>כל job רץ ב-<strong>pod חדש וזמני</strong> (או Firecracker microVM לבידוד חזק יותר) שנהרס בסוף. זה הורג את ה-flakiness הקלאסי של "עובד על runner 7 כי מישהו השאיר שם קובץ", ומונע מ-PR זדוני להשתרש על host משותף.</p>
<ul>
<li><strong>Pull model:</strong> ה-runners מושכים jobs מה-scheduler (רק outbound), כך שהם יכולים לשבת ב-private subnets בלי לפתוח חורים ב-firewall.</li>
<li><strong>Autoscaling:</strong> לפי <em>עומק התור וזמן ההמתנה</em>, לא לפי CPU. KEDA קורא כמה jobs ממתינים לכל label → pods; Karpenter מרים spot nodes תוך כדקה. מחזיקים warm pool קטן (למשל 50 runners) בשעות העבודה כדי להסתיר את זמן עליית ה-node.</li>
<li><strong>Spot interruptions:</strong> CI סובל retry בקלות; ה-scheduler מסמן jobs שנקטעו ומכניס אותם שוב לתור (attempt+1), בלי לספור את זה ככישלון טסט.</li>
<li><strong>רמות אמון:</strong> PRs מ-forks רצים ב-pool בלי secrets ובלי גישת רשת למערכות פנימיות; pipelines של main ו-release רצים ב-pool נפרד עם credentials קצרי-חיים שמונפקים דרך OIDC.</li>
</ul>
<blockquote>⚠️ Docker-in-Docker עם privileged pods זה container escape שמחכה לקרות. עדיף builders בלי root (BuildKit rootless, Kaniko) או microVMs.</blockquote>`
      }
    },
    {
      h: { en: "Caching: the biggest lever on build time", he: "Caching: המנוף הכי גדול על זמן ה-build" },
      body: {
        en: `<p>Ephemeral runners start cold, so caching must be remote. Layers of cache, from cheapest to most powerful:</p>
<table>
<tr><th>Cache</th><th>Saves</th><th>How</th></tr>
<tr><td>Dependency proxy</td><td>npm/Maven/PyPI downloads, rate limits</td><td>Artifactory/Nexus in the same region</td></tr>
<tr><td>Dependency cache by lockfile hash</td><td>npm install, go mod download</td><td>key = hash(package-lock.json), tarball in S3</td></tr>
<tr><td>Docker layer cache</td><td>Rebuilding base layers</td><td>BuildKit <code>--cache-from</code> registry, order Dockerfile from least to most changing</td></tr>
<tr><td>Remote build/test cache</td><td>Recompiling and re-running unchanged targets</td><td>Bazel/Gradle remote cache keyed by content hash of inputs</td></tr>
</table>
<p>In a monorepo, the big win is <strong>only building what changed</strong>: compute affected targets from the dependency graph and skip the rest. Teams commonly go from 40-minute "build everything" to 5-8 minutes.</p>
<p>Cache correctness matters more than hit rate: keys must include every input (toolchain version, env, OS); a poisoned or stale cache produces green builds of broken code. Measure hit ratio per job and alert when it drops.</p>`,
        he: `<p>Runners זמניים מתחילים קרים, אז ה-cache חייב להיות מרוחק. שכבות של cache, מהזולה לחזקה:</p>
<table>
<tr><th>Cache</th><th>מה חוסך</th><th>איך</th></tr>
<tr><td>Dependency proxy</td><td>הורדות npm/Maven/PyPI, rate limits</td><td>Artifactory/Nexus באותו region</td></tr>
<tr><td>Cache של dependencies לפי hash של lockfile</td><td>npm install, go mod download</td><td>key = hash(package-lock.json), tarball ב-S3</td></tr>
<tr><td>Docker layer cache</td><td>בנייה מחדש של base layers</td><td>BuildKit עם <code>--cache-from</code> מה-registry, ולסדר את ה-Dockerfile מהפחות משתנה ליותר</td></tr>
<tr><td>Remote build/test cache</td><td>קומפילציה והרצה מחדש של targets שלא השתנו</td><td>Remote cache של Bazel/Gradle לפי hash של כל ה-inputs</td></tr>
</table>
<p>ב-monorepo הניצחון הגדול הוא <strong>לבנות רק מה שהשתנה</strong>: מחשבים affected targets מגרף התלויות ומדלגים על השאר. צוותים עוברים בדרך כלל מ-40 דקות של "בנה הכל" ל-5-8 דקות.</p>
<p>נכונות ה-cache חשובה יותר מה-hit rate: ה-key חייב לכלול כל input (גרסת toolchain, env, OS); cache מורעל או ישן מייצר builds ירוקים לקוד שבור. מודדים hit ratio לכל job ומתריעים כשהוא יורד.</p>`
      }
    },
    {
      h: { en: "Artifacts and supply chain: build once, promote by digest", he: "Artifacts ו-supply chain: בונים פעם אחת, מקדמים לפי digest" },
      body: {
        en: `<p>The rule: <strong>build once, deploy the same bytes everywhere</strong>. The image built from commit <code>abc123</code> is pushed once, referenced by its immutable <code>sha256</code> digest, and that exact digest is promoted dev → staging → prod. Never rebuild for prod and never deploy <code>:latest</code>.</p>
<ul>
<li><strong>Signing:</strong> sign images with cosign (Sigstore) using keyless OIDC identity of the pipeline; an admission controller (Kyverno/Gatekeeper) in prod rejects unsigned images or images not built by the trusted pipeline.</li>
<li><strong>Provenance and SBOM:</strong> attach SLSA provenance (which repo, commit, builder) and an SBOM (Syft); scan with Trivy/Grype and block critical CVEs by policy.</li>
<li><strong>Storage:</strong> registry backed by S3 (ECR/Harbor), replicated to each deploy region so pulls are local; lifecycle rules delete untagged PR images after 30 days, release images kept.</li>
</ul>
<blockquote>💡 When a CVE like Log4Shell hits, SBOMs let you answer "which running services contain log4j 2.14?" in minutes instead of days.</blockquote>`,
        he: `<p>הכלל: <strong>בונים פעם אחת, מריצים את אותם בייטים בכל מקום</strong>. ה-image שנבנה מ-commit <code>abc123</code> נדחף פעם אחת, מזוהה לפי ה-digest הקבוע שלו (<code>sha256</code>), ובדיוק ה-digest הזה מקודם dev → staging → prod. לעולם לא בונים מחדש בשביל prod ולעולם לא עושים deploy ל-<code>:latest</code>.</p>
<ul>
<li><strong>חתימה:</strong> חותמים images עם cosign (Sigstore) בעזרת זהות OIDC של ה-pipeline (keyless); admission controller (Kyverno/Gatekeeper) ב-prod דוחה images לא חתומים או כאלה שלא נבנו ב-pipeline המהימן.</li>
<li><strong>Provenance ו-SBOM:</strong> מצרפים SLSA provenance (איזה repo, commit, builder) ו-SBOM (Syft); סורקים עם Trivy/Grype וחוסמים CVEs קריטיים לפי policy.</li>
<li><strong>אחסון:</strong> registry על S3 (ECR/Harbor), עם replication לכל region של deploy כדי שה-pull יהיה מקומי; lifecycle rules מוחקים images של PRs בלי tag אחרי 30 יום, images של release נשמרים.</li>
</ul>
<blockquote>💡 כשנוחת CVE כמו Log4Shell, SBOMs מאפשרים לענות על "אילו services שרצים עכשיו כוללים log4j 2.14?" בדקות במקום בימים.</blockquote>`
      }
    },
    {
      h: { en: "Deploys: GitOps, canary analysis and rollback", he: "Deploys: GitOps, ניתוח canary ו-rollback" },
      body: {
        en: `<p>CD is decoupled from CI: CI's last step only commits the new digest to an <strong>env-config Git repo</strong>. Argo CD in each cluster pulls and reconciles. Benefits: Git is the audit trail (who changed what, approved by whom), clusters don't need inbound CI credentials, and if CI is down you can still deploy a hotfix by editing the config repo.</p>
<p><strong>Progressive delivery with Argo Rollouts:</strong></p>
<ol>
<li>Deploy canary to 5% of traffic (via service mesh or ingress weights).</li>
<li>Automated analysis for 10 min: compare canary vs stable on error rate, p99 latency, saturation from Prometheus.</li>
<li>Pass → 25% → 50% → 100%. Fail → automatic abort, traffic back to stable in seconds.</li>
<li>Roll cluster by cluster / region by region (prod-eu, then prod-us) to cap blast radius.</li>
</ol>
<p><strong>Rollback</strong> = point back to the previous digest (still in the registry, still cached on nodes), so it takes seconds. The hard part is <em>data</em>: DB migrations must be backward compatible (expand → migrate → contract), so the old version can run against the new schema.</p>`,
        he: `<p>ה-CD מנותק מה-CI: השלב האחרון של CI רק עושה commit ל-digest החדש ב-<strong>Git repo של env-config</strong>. Argo CD בכל קלאסטר מושך ועושה reconcile. היתרונות: Git הוא ה-audit trail (מי שינה מה ומי אישר), לקלאסטרים לא צריך credentials נכנסים מה-CI, ואם CI למטה עדיין אפשר להוציא hotfix בעריכת ה-config repo.</p>
<p><strong>Progressive delivery עם Argo Rollouts:</strong></p>
<ol>
<li>Deploy של canary ל-5% מהתעבורה (דרך weights ב-service mesh או ב-ingress).</li>
<li>ניתוח אוטומטי במשך 10 דקות: משווים canary מול stable על error rate, p99 latency ו-saturation מ-Prometheus.</li>
<li>עבר → 25% → 50% → 100%. נכשל → abort אוטומטי, התעבורה חוזרת ל-stable תוך שניות.</li>
<li>מתקדמים קלאסטר אחרי קלאסטר / region אחרי region (prod-eu ואז prod-us) כדי להגביל blast radius.</li>
</ol>
<p><strong>Rollback</strong> = להצביע חזרה על ה-digest הקודם (עדיין ב-registry ועדיין ב-cache על ה-nodes), אז זה לוקח שניות. החלק הקשה הוא <em>הדאטה</em>: DB migrations חייבות להיות backward compatible (expand → migrate → contract), כדי שהגרסה הישנה תוכל לרוץ מול ה-schema החדש.</p>`
      }
    },
    {
      h: { en: "Flaky tests and platform observability", he: "Flaky tests ו-observability של הפלטפורמה" },
      body: {
        en: `<p>At 25,000 jobs/day, a 1% flaky rate means 250 red builds a day that waste engineer time and teach people to click "retry" blindly. Treat flakiness as a platform metric:</p>
<ul>
<li>Store per-test results; a test that both passed and failed on the <strong>same commit</strong> is flaky by definition.</li>
<li>Auto-quarantine: flaky tests still run but don't block merges; open a ticket to the owning team (CODEOWNERS) with failure rate.</li>
<li>Retry only at test level, max once, and record it — never silently.</li>
</ul>
<p><strong>SLIs for the platform itself:</strong> queue wait time p90, PR pipeline duration p50/p90, infra-caused failure rate (runner died, cache unavailable — distinct from test failures), cache hit ratio, cost per pipeline. And <strong>DORA metrics</strong> for the org: deployment frequency, lead time for changes, change failure rate, time to restore — derived from the deployments table.</p>
<blockquote>💡 Publishing a weekly "slowest 10 pipelines" and "top flaky tests" leaderboard often does more than any infrastructure change.</blockquote>`,
        he: `<p>ב-25,000 jobs ביום, שיעור flaky של 1% זה 250 builds אדומים ביום שמבזבזים זמן של מהנדסים ומלמדים אנשים ללחוץ "retry" בעיניים עצומות. מתייחסים ל-flakiness כמדד של הפלטפורמה:</p>
<ul>
<li>שומרים תוצאה לכל טסט; טסט שגם עבר וגם נכשל על <strong>אותו commit</strong> הוא flaky בהגדרה.</li>
<li>Quarantine אוטומטי: טסטים flaky עדיין רצים אבל לא חוסמים merge; נפתח ticket לצוות הבעלים (CODEOWNERS) עם שיעור הכישלון.</li>
<li>Retry רק ברמת הטסט, מקסימום פעם אחת, ומתועד – אף פעם לא בשקט.</li>
</ul>
<p><strong>SLIs לפלטפורמה עצמה:</strong> זמן המתנה בתור p90, משך pipeline של PR ב-p50/p90, שיעור כישלונות שנגרמו מתשתית (runner מת, cache לא זמין – בנפרד מכישלון טסטים), cache hit ratio, עלות לכל pipeline. ו-<strong>DORA metrics</strong> לארגון: deployment frequency, lead time for changes, change failure rate, time to restore – נגזרים מטבלת ה-deployments.</p>
<blockquote>💡 לפרסם כל שבוע "10 ה-pipelines הכי איטיים" ו-"top flaky tests" עושה לא פעם יותר מכל שינוי תשתית.</blockquote>`
      }
    }
  ],
  tradeoffs: [
    { en: "Buy (GitHub Actions/GitLab) + self-hosted autoscaling runners covers 90% of needs; a fully custom CI engine is rarely worth it. Invest in runners, caching and CD instead.", he: "Buy (GitHub Actions/GitLab) עם self-hosted runners ו-autoscaling מכסה 90% מהצרכים; מנוע CI מותאם לגמרי כמעט אף פעם לא שווה את זה. משקיעים ב-runners, caching ו-CD." },
    { en: "Ephemeral runners give isolation and reproducibility but lose local caches — you pay back with remote caches and warm pools.", he: "Runners זמניים נותנים בידוד ו-reproducibility אבל מאבדים cache מקומי – מחזירים את זה עם remote caches ו-warm pools." },
    { en: "Spot instances cut CI compute ~70% but add interruptions; fine for PR jobs with auto-retry, not for long release pipelines or deploy steps.", he: "Spot instances חותכים כ-70% מעלות ה-compute של CI אבל מוסיפים קטיעות; מתאים ל-jobs של PR עם retry אוטומטי, לא ל-pipelines ארוכים של release או לשלבי deploy." },
    { en: "GitOps (pull) gives audit and drift correction but adds latency (sync interval) and another repo; push-based deploys are simpler but need prod credentials in CI.", he: "GitOps (pull) נותן audit ותיקון drift אבל מוסיף latency (sync interval) ועוד repo; deploy מבוסס push פשוט יותר אבל דורש credentials של prod בתוך ה-CI." },
    { en: "Automatic canary rollback catches regressions fast but needs good metrics; with low traffic services, statistical analysis is noisy — use longer windows or synthetic traffic.", he: "Rollback אוטומטי ב-canary תופס רגרסיות מהר אבל דורש metrics טובים; ב-services עם מעט תעבורה הניתוח הסטטיסטי רועש – משתמשים בחלונות ארוכים יותר או ב-synthetic traffic." }
  ],
  followUps: [
    {
      q: { en: "A canary looks healthy for 10 minutes, goes to 100%, and an hour later corrupts data. What failed and how do you design against it?", he: "Canary נראה בריא 10 דקות, עולה ל-100%, ושעה אחר כך משחית דאטה. מה נכשל ואיך מתכננים נגד זה?" },
      a: { en: "The analysis only measured fast signals (errors, latency) — data corruption is a slow, semantic failure. Mitigations: add business/data-quality metrics to canary analysis (orders per minute, reconciliation checks), bake times at each step (hours for risky services), feature flags so the new code path can be turned off without redeploy, backward-compatible migrations so rollback is safe, and point-in-time recovery for the DB. Rollback stops new damage; repairing the data needs PITR or a correction job from an event log.", he: "הניתוח מדד רק סיגנלים מהירים (errors, latency) – השחתת דאטה היא כשל איטי וסמנטי. מה עושים: מוסיפים ל-canary analysis metrics עסקיים ובדיקות איכות דאטה (הזמנות לדקה, reconciliation), bake time בכל שלב (שעות ל-services מסוכנים), feature flags כדי לכבות את הקוד החדש בלי redeploy, migrations שהן backward compatible כדי ש-rollback יהיה בטוח, ו-point-in-time recovery ל-DB. Rollback עוצר נזק חדש; תיקון הדאטה דורש PITR או job תיקון מתוך event log." }
    },
    {
      q: { en: "How do you stop a malicious pull request from stealing production secrets?", he: "איך מונעים מ-pull request זדוני לגנוב secrets של production?" },
      a: { en: "PR pipelines (especially from forks) run in an untrusted runner pool with no secrets, no access to internal networks, and ephemeral pods. Prod credentials are never stored in CI: deploy jobs on main get short-lived cloud credentials via OIDC federation, scoped by repo + branch + environment, and prod deploys go through GitOps so CI never touches the cluster directly. Require review before workflows from forks run, protect workflow files with CODEOWNERS, and pin third-party actions to commit SHAs.", he: "Pipelines של PR (במיוחד מ-forks) רצים ב-pool של runners לא מהימן, בלי secrets, בלי גישה לרשתות פנימיות, ובתוך pods זמניים. Credentials של prod לא נשמרים ב-CI בכלל: jobs של deploy מ-main מקבלים credentials קצרי-חיים דרך OIDC federation, מוגבלים לפי repo + branch + environment, ו-deploy ל-prod עובר דרך GitOps כך ש-CI לא נוגע בקלאסטר ישירות. דורשים review לפני ש-workflows מ-forks רצים, מגינים על קבצי workflow עם CODEOWNERS, ועושים pin ל-actions חיצוניים לפי commit SHA." }
    },
    {
      q: { en: "Monday 10:00, queue wait jumps to 15 minutes. Walk me through debugging.", he: "יום שני ב-10:00, זמן ההמתנה בתור קופץ ל-15 דקות. תעביר אותי בדיבוג." },
      a: { en: "Check the dashboards in order: queued jobs per runner label (is it one label, e.g. macOS, or all?); autoscaler — are pods Pending, and why (Karpenter can't get spot capacity in the AZ, hit an account vCPU quota, IP exhaustion in the subnet); node startup time (image pulls of a huge runner image); scheduler health (DB lock contention on the jobs table). Common fixes: diversify instance types and AZs for spot, fall back to on-demand, raise quotas, pre-pull runner images, larger warm pool for Monday morning via scheduled scaling.", he: "עוברים על ה-dashboards לפי סדר: jobs בתור לפי runner label (זה label אחד, למשל macOS, או הכל?); ה-autoscaler – יש pods ב-Pending, ולמה (Karpenter לא מקבל spot capacity ב-AZ, נגמרה quota של vCPU בחשבון, נגמרו IPs ב-subnet); זמן עליית node (pull של runner image ענק); בריאות ה-scheduler (lock contention על טבלת ה-jobs ב-DB). תיקונים נפוצים: לגוון instance types ו-AZs ל-spot, fallback ל-on-demand, להעלות quotas, pre-pull ל-runner images, ו-warm pool גדול יותר ביום שני בבוקר עם scheduled scaling." }
    }
  ],
  related: ["cloud-cicd", "rel-deployments", "k8s-autoscaling", "cloud-storage", "arch-queues", "rel-sli-slo-sla", "obs-metrics"]
});
window.INFRA.designs.push({
  id: "sd-multi-region", icon: "🌍", level: 3,
  title: { en: "Multi-region DR for an e-commerce app", he: "DR רב-אזורי לאפליקציית e-commerce" },
  prompt: {
    en: "Our e-commerce platform runs entirely in us-east-1: Kubernetes, a Postgres primary with one replica, Redis, S3 for images. Last month a regional outage took us down for 6 hours. Design how this system survives the loss of an entire region.",
    he: "פלטפורמת ה-e-commerce שלנו רצה כולה ב-us-east-1: Kubernetes, Postgres primary עם replica אחד, Redis ו-S3 לתמונות. בחודש שעבר תקלה אזורית הפילה אותנו ל-6 שעות. תתכנן איך המערכת שורדת אובדן של region שלם."
  },
  clarify: [
    { en: "What RPO and RTO does the business accept? (e.g. lose at most 1 minute of orders, back within 15 minutes?)", he: "איזה RPO ו-RTO הביזנס מוכן לקבל? (למשל לאבד לכל היותר דקה של הזמנות, ולחזור תוך 15 דקות?)" },
    { en: "Which flows are critical during an outage — browsing and checkout only, or also admin, reports, recommendations?", he: "אילו flows קריטיים בזמן outage — רק browsing ו-checkout, או גם admin, דוחות והמלצות?" },
    { en: "What is the budget appetite: is running a second region at full size (roughly 2x infra cost) acceptable?", he: "מה התקציב? האם להריץ region שני בגודל מלא (בערך פי 2 בעלות התשתית) זה אופציה?" },
    { en: "Where are users? Mostly one continent, or global (which also argues for active-active for latency)?", he: "איפה המשתמשים? בעיקר ביבשת אחת, או גלובלי (מה שגם מצדיק active-active בגלל latency)?" },
    { en: "Are there third-party dependencies (payment provider, tax service) that are themselves single-region?", he: "יש תלויות צד שלישי (ספק תשלומים, שירות מיסים) שבעצמן יושבות ב-region אחד?" },
    { en: "Any data residency constraints (GDPR) limiting where data can be replicated?", he: "יש מגבלות data residency (GDPR) שמגבילות לאן מותר לשכפל דאטה?" }
  ],
  functional: [
    { en: "Users can browse, add to cart and check out even when the primary region is completely down.", he: "משתמשים יכולים לגלוש, להוסיף לעגלה ולבצע checkout גם כשה-region הראשי למטה לגמרי." },
    { en: "Failover can be triggered (manually with one command, or automatically) and failback is possible after recovery.", he: "אפשר להפעיל failover (ידנית בפקודה אחת או אוטומטית), ואפשר לעשות failback אחרי ההתאוששות." },
    { en: "No order that was confirmed to a customer is lost or double-charged.", he: "אף הזמנה שאושרה ללקוח לא הולכת לאיבוד ולא מחויבת פעמיים." },
    { en: "DR is tested regularly with game days, not only on paper.", he: "ה-DR נבדק באופן קבוע ב-game days, לא רק על הנייר." }
  ],
  nonFunctional: [
    { en: "RPO ≤ 1 minute for orders/payments, ≤ 15 minutes for catalog; RTO ≤ 15 minutes.", he: "RPO של עד דקה להזמנות ותשלומים, עד 15 דקות לקטלוג; RTO של עד 15 דקות." },
    { en: "Availability target 99.95% per month (~22 minutes of downtime budget).", he: "יעד זמינות 99.95% בחודש (בערך 22 דקות error budget)." },
    { en: "Steady-state latency must not degrade: no synchronous cross-region calls on the hot path.", he: "אסור ש-latency במצב רגיל ייפגע: אין קריאות סינכרוניות בין regions ב-hot path." },
    { en: "Cost overhead for DR roughly 30-60% of current infra, not 100%+, unless the business pays for active-active.", he: "תוספת עלות ל-DR בסביבות 30-60% מהתשתית הנוכחית, לא 100% ומעלה, אלא אם הביזנס משלם על active-active." }
  ],
  estimates: {
    en: `<p><strong>Traffic:</strong> 5M daily users, ~50 page views each = 250M requests/day ÷ 86,400 ≈ <strong>3,000 RPS avg</strong>, peak ×3 ≈ 9,000 RPS (Black Friday ×10 = 30,000 RPS). Orders: 200k/day ≈ 2.3 writes/s avg, peak ~25/s — the write path is tiny; reads dominate.</p>
<p><strong>Database:</strong> Postgres 2 TB, WAL generation ~20 GB/day ≈ 230 KB/s average, peaks ~5 MB/s during batch jobs. Cross-region replication bandwidth is therefore trivial (&lt; 50 Mbps), and inter-region RTT us-east-1 ↔ us-west-2 ≈ 65 ms. Async replica lag typically &lt; 1 s → RPO well under 1 minute.</p>
<p><strong>Why not synchronous?</strong> A synchronous commit adds one RTT (≈65 ms) to every transaction. At 25 orders/s that is fine, but every write (carts, sessions, inventory) would pay it — so keep async globally and protect orders with idempotency + reconciliation.</p>
<p><strong>Object storage:</strong> 50 TB of images with S3 Cross-Region Replication: ~$0.02/GB transfer → initial copy ≈ $1,000, then only daily deltas (~50 GB/day ≈ $1/day).</p>
<p><strong>Cost of warm standby:</strong> current compute ~$80k/month. Standby at 25% compute ($20k) + full-size DB replica ($6k) + replicated storage ($1.2k) ≈ <strong>$27k/month ≈ 34% overhead</strong>. Active-active at full size ≈ +100%.</p>
<p><strong>RTO budget:</strong> detect 2-3 min + decide 2-5 min + promote DB 1-2 min + scale standby from 25% to 100% (Karpenter nodes ~2-3 min) + DNS TTL 60 s ≈ <strong>10-14 min</strong>, inside the 15-minute target.</p>`,
    he: `<p><strong>תעבורה:</strong> 5M משתמשים ביום, ~50 צפיות בדף לכל אחד = 250M בקשות ביום ÷ 86,400 ≈ <strong>3,000 RPS בממוצע</strong>, peak פי 3 ≈ 9,000 RPS (בבלאק פריידי פי 10 = 30,000 RPS). הזמנות: 200k ביום ≈ 2.3 כתיבות בשנייה בממוצע, peak בערך 25 לשנייה — מסלול הכתיבה זעיר, הקריאות שולטות.</p>
<p><strong>DB:</strong> Postgres של 2 TB, נוצר ~20 GB של WAL ביום ≈ 230 KB/s בממוצע, peaks של ~5 MB/s בזמן batch jobs. כלומר רוחב הפס לרפליקציה בין regions זניח (&lt; 50 Mbps), וה-RTT בין us-east-1 ל-us-west-2 הוא בערך 65 ms. ה-lag של replica אסינכרוני בדרך כלל מתחת לשנייה → RPO הרבה מתחת לדקה.</p>
<p><strong>למה לא סינכרוני?</strong> commit סינכרוני מוסיף RTT אחד (≈65 ms) לכל טרנזקציה. ל-25 הזמנות בשנייה זה בסדר, אבל כל כתיבה (עגלות, sessions, מלאי) תשלם את זה — אז נשארים אסינכרוניים ומגינים על הזמנות עם idempotency ו-reconciliation.</p>
<p><strong>Object storage:</strong> 50 TB תמונות עם S3 Cross-Region Replication: בערך $0.02 ל-GB העברה → העתקה ראשונית ≈ $1,000, ואז רק דלתות יומיות (~50 GB ביום ≈ $1 ליום).</p>
<p><strong>עלות warm standby:</strong> compute היום בערך $80k בחודש. standby ב-25% compute ($20k) + DB replica בגודל מלא ($6k) + storage משוכפל ($1.2k) ≈ <strong>$27k בחודש ≈ 34% תוספת</strong>. active-active בגודל מלא ≈ פי 2.</p>
<p><strong>תקציב RTO:</strong> זיהוי 2-3 דק' + החלטה 2-5 דק' + promote ל-DB דקה-שתיים + scale של ה-standby מ-25% ל-100% (nodes של Karpenter ~2-3 דק') + DNS TTL של 60 שניות ≈ <strong>10-14 דקות</strong>, בתוך יעד ה-15.</p>`
  },
  api: `# Ops / control-plane API (the app API is unchanged)
POST /dr/v1/failover   {target_region, reason, force?}   -> 202 {run_id}
GET  /dr/v1/runs/{run_id}                                -> {steps:[{name,status,ts}]}
POST /dr/v1/failback   {target_region}                   -> 202 {run_id}
GET  /dr/v1/status     -> {active_region, replica_lag_s, standby_capacity_pct, last_drill}

# Health endpoint used by DNS / GSLB health checks
GET  /healthz/deep  -> 200 {db:"ok", cache:"ok", region:"us-east-1"} | 503`,
  dataModel: `orders(order_id UUID PK, user_id, status, total, idempotency_key UNIQUE, region_origin, created_at)
payments(payment_id PK, order_id FK, provider_ref UNIQUE, status, amount)
inventory(sku PK, available, reserved, version)
-- Replication:
--  Postgres primary (us-east-1) --async streaming/WAL--> standby (us-west-2)
--  S3 bucket --CRR--> replica bucket;  Redis: NOT replicated (rebuilt / warmed)
dr_state (in DynamoDB global table or Route 53 ARC): {active_region, fenced_regions[], epoch}`,
  diagram: `                     Users
                       |
            Route 53 / GSLB (health checks, TTL 60s)
              |                              :
      (active) |                              : (standby, 0% traffic)
   +-----------v------------+     +-----------v------------+
   |  us-east-1 (primary)   |     |  us-west-2 (warm)      |
   |  CDN origin / ALB      |     |  ALB                   |
   |  EKS: app @ 100%       |     |  EKS: app @ 25%        |
   |  Redis (cache only)    |     |  Redis (empty/warming) |
   |  Postgres PRIMARY  ----+-WAL-+-> Postgres STANDBY     |
   |  S3 images  ----------+-CRR-+-> S3 replica            |
   |  Kafka (events) ------+-MM2-+-> Kafka (mirror)        |
   +------------------------+     +------------------------+
                 |                            |
                 +---- payment provider (multi-region) ----+

  Failover runbook: fence east -> promote west DB -> scale west to 100%
                    -> flip DNS -> reconcile orders/payments`,
  deepDives: [
    {
      h: { en: "Choosing the DR strategy: backup/restore vs pilot light vs warm standby vs active-active", he: "בחירת אסטרטגיית DR: backup/restore מול pilot light מול warm standby מול active-active" },
      body: {
        en: `<table><tr><th>Strategy</th><th>RTO</th><th>RPO</th><th>Cost</th></tr>
<tr><td>Backup &amp; restore</td><td>hours</td><td>hours (last snapshot)</td><td>+5%</td></tr>
<tr><td>Pilot light (DB replica only)</td><td>30-60 min</td><td>seconds</td><td>+10-15%</td></tr>
<tr><td>Warm standby (scaled-down stack)</td><td>10-15 min</td><td>seconds</td><td>+30-40%</td></tr>
<tr><td>Active-active</td><td>~0-2 min</td><td>~0 to seconds</td><td>+100% and complexity</td></tr></table>
<p>With RTO 15 min and RPO 1 min, <strong>warm standby</strong> is the sweet spot: Postgres streaming replica, S3 CRR, Kafka MirrorMaker 2, and the full Kubernetes deployment (same Helm/ArgoCD manifests) running at 25% replicas so it is <em>continuously proven to work</em>. Pilot light looks cheaper but the "nobody ever ran it" stack is where DR plans die: missing IAM roles, stale AMIs, quota limits.</p>
<blockquote>💡 Real world: request service quota increases (EC2 vCPUs, ELBs, IPs) in the standby region <em>now</em>. During a real us-east-1 event, everyone else is scaling into us-west-2 too.</blockquote>`,
        he: `<table><tr><th>אסטרטגיה</th><th>RTO</th><th>RPO</th><th>עלות</th></tr>
<tr><td>Backup &amp; restore</td><td>שעות</td><td>שעות (snapshot אחרון)</td><td>+5%</td></tr>
<tr><td>Pilot light (רק DB replica)</td><td>30-60 דק'</td><td>שניות</td><td>+10-15%</td></tr>
<tr><td>Warm standby (stack מוקטן)</td><td>10-15 דק'</td><td>שניות</td><td>+30-40%</td></tr>
<tr><td>Active-active</td><td>~0-2 דק'</td><td>~0 עד שניות</td><td>+100% ועוד מורכבות</td></tr></table>
<p>עם RTO של 15 דקות ו-RPO של דקה, <strong>warm standby</strong> הוא ה-sweet spot: Postgres streaming replica, S3 CRR, Kafka MirrorMaker 2, וכל ה-deployment של Kubernetes (אותם manifests של Helm/ArgoCD) רץ ב-25% replicas, כך שהוא <em>מוכח כעובד כל הזמן</em>. Pilot light נראה זול יותר, אבל stack ש"אף אחד לא הריץ" זה בדיוק המקום שבו תוכניות DR מתות: IAM roles חסרים, AMIs ישנים, quota limits.</p>
<blockquote>💡 מהשטח: תבקשו הגדלת service quotas (vCPUs של EC2, ELBs, IPs) ב-region ה-standby <em>עכשיו</em>. בזמן אירוע אמיתי ב-us-east-1 כל העולם מנסה לעשות scale ל-us-west-2 באותו רגע.</blockquote>`
      }
    },
    {
      h: { en: "Data replication and the split-brain problem", he: "רפליקציה של דאטה ובעיית ה-split-brain" },
      body: {
        en: `<p>The stateless tier is easy; <strong>state is the whole problem</strong>. Per store:</p>
<ul><li><strong>Postgres:</strong> async physical streaming replica in us-west-2 (or Aurora Global Database, typical lag &lt; 1 s, managed promote ~1 min). Alert on <code>replica_lag_seconds &gt; 30</code> — lag <em>is</em> your live RPO.</li>
<li><strong>S3:</strong> CRR with Replication Time Control (99.99% of objects within 15 min). Catalog images tolerate that.</li>
<li><strong>Redis:</strong> treat as cache only, not replicated. After failover it starts cold → protect the DB with request coalescing and pre-warm the top 10k product keys.</li>
<li><strong>Kafka:</strong> MirrorMaker 2 with offset translation so consumers resume roughly where they left off; consumers must be idempotent because some messages will replay.</li></ul>
<p>The dangerous moment is a <em>partial</em> outage: east is unreachable from the health checker but still alive and accepting writes. If west is promoted too, you have two primaries — split-brain. Fix with <strong>fencing</strong>: before promoting, flip a flag in a control plane outside both regions (Route 53 Application Recovery Controller, or a DynamoDB global table with an epoch number) that east's app checks and turns read-only; also revoke east's DB security group.</p>`,
        he: `<p>ה-tier ה-stateless קל; <strong>ה-state הוא כל הבעיה</strong>. לפי store:</p>
<ul><li><strong>Postgres:</strong> streaming replica פיזי אסינכרוני ב-us-west-2 (או Aurora Global Database, lag טיפוסי מתחת לשנייה, promote מנוהל של כדקה). alert על <code>replica_lag_seconds &gt; 30</code> — ה-lag <em>הוא</em> ה-RPO החי שלכם.</li>
<li><strong>S3:</strong> CRR עם Replication Time Control (99.99% מהאובייקטים תוך 15 דקות). לתמונות קטלוג זה מספיק.</li>
<li><strong>Redis:</strong> מתייחסים אליו כ-cache בלבד, בלי רפליקציה. אחרי failover הוא מתחיל קר → מגינים על ה-DB עם request coalescing ועושים pre-warm ל-10k מפתחות המוצר החמים.</li>
<li><strong>Kafka:</strong> MirrorMaker 2 עם offset translation כדי שה-consumers ימשיכו בערך מאיפה שהפסיקו; ה-consumers חייבים להיות idempotent כי חלק מההודעות יחזרו.</li></ul>
<p>הרגע המסוכן הוא outage <em>חלקי</em>: ה-health checker לא רואה את east, אבל east עדיין חי ומקבל כתיבות. אם עושים promote גם ל-west, יש שני primaries — split-brain. הפתרון הוא <strong>fencing</strong>: לפני ה-promote, משנים flag ב-control plane שיושב מחוץ לשני ה-regions (Route 53 Application Recovery Controller, או DynamoDB global table עם מספר epoch) שה-app ב-east בודק ועובר ל-read-only; ובנוסף סוגרים את ה-security group של ה-DB ב-east.</p>`
      }
    },
    {
      h: { en: "Traffic failover: DNS, GSLB and the TTL trap", he: "העברת תעבורה: DNS, GSLB ומלכודת ה-TTL" },
      body: {
        en: `<p>Options to move users: <strong>DNS failover</strong> (Route 53 failover records + health checks), <strong>anycast/global load balancer</strong> (AWS Global Accelerator, Cloudflare LB, GCP global LB) or the CDN switching origins.</p>
<ul><li>DNS: set TTL to 60 s, but expect a long tail — some resolvers and JVMs (<code>networkaddress.cache.ttl</code>) cache longer; 95% of traffic moves in ~2-5 min, the last few % can take much longer.</li>
<li>Global Accelerator / anycast: static IPs, failover in ~30 s without DNS caching issues. Better RTO, extra cost.</li>
<li>CDN origin failover (CloudFront origin groups): great for static and cacheable GETs, but checkout POSTs still need a healthy origin.</li></ul>
<p>Health checks must be <strong>deep but not fragile</strong>: <code>/healthz/deep</code> verifies DB and cache connectivity, yet a single bad dependency should not flap the whole region. Most teams keep the <em>decision</em> to fail over human (one-click runbook) and automate the <em>execution</em>, because automatic regional failover on a false positive causes a worse outage than the one it avoids.</p>`,
        he: `<p>אפשרויות להזיז משתמשים: <strong>DNS failover</strong> (רשומות failover ב-Route 53 + health checks), <strong>anycast / global load balancer</strong> (AWS Global Accelerator, Cloudflare LB, GCP global LB), או שה-CDN מחליף origin.</p>
<ul><li>DNS: TTL של 60 שניות, אבל צריך לצפות ל-long tail — חלק מה-resolvers וגם JVMs (<code>networkaddress.cache.ttl</code>) שומרים יותר זמן; 95% מהתעבורה זזה תוך 2-5 דקות, האחוזים האחרונים יכולים לקחת הרבה יותר.</li>
<li>Global Accelerator / anycast: IPs סטטיים, failover תוך ~30 שניות בלי בעיות DNS caching. RTO טוב יותר, עלות נוספת.</li>
<li>CDN origin failover (origin groups ב-CloudFront): מצוין לסטטי ול-GETs שנכנסים ל-cache, אבל POST של checkout עדיין צריך origin בריא.</li></ul>
<p>ה-health checks צריכים להיות <strong>עמוקים אבל לא שבירים</strong>: <code>/healthz/deep</code> בודק חיבור ל-DB ול-cache, אבל תלות אחת דפוקה לא אמורה להפיל region שלם. רוב הצוותים משאירים את <em>ההחלטה</em> על failover אנושית (runbook בלחיצה אחת) ומבצעים אוטומטית את <em>הביצוע</em>, כי failover אזורי אוטומטי על false positive יוצר outage גרוע יותר מזה שהוא בא למנוע.</p>`
      }
    },
    {
      h: { en: "Protecting orders: idempotency and post-failover reconciliation", he: "הגנה על הזמנות: idempotency ו-reconciliation אחרי failover" },
      body: {
        en: `<p>With async replication, the last ~1 s of commits in east may never reach west. The business rule "no confirmed order is lost or double-charged" is met by design, not by replication:</p>
<ul><li>Every checkout carries an <strong>idempotency key</strong> generated by the client; the payment provider (Stripe etc.) is called with the same key, so a retry from west after failover does not charge twice.</li>
<li>Order confirmation emails go out via an outbox table → Kafka, so an order that was lost in the DB also never sent its email.</li>
<li>After failover, a <strong>reconciliation job</strong> pulls the payment provider's list of successful charges for the outage window and compares with orders in the new primary. Missing orders are re-created from the provider data; orphaned charges are refunded.</li>
<li>When east comes back, never just "re-attach" it: its unreplicated tail (the "lost" writes) is extracted with logical decoding for review, then east is rebuilt as a fresh replica of west.</li></ul>
<blockquote>⚠️ Production tip: the payment provider is a hidden single point of truth — and also a hidden SPOF. Check its own multi-region story.</blockquote>`,
        he: `<p>ברפליקציה אסינכרונית, השנייה האחרונה של commits ב-east עלולה לא להגיע ל-west לעולם. את הכלל העסקי "אף הזמנה מאושרת לא אובדת או מחויבת פעמיים" משיגים ב-design, לא ברפליקציה:</p>
<ul><li>כל checkout נושא <strong>idempotency key</strong> שנוצר בצד הלקוח; ספק התשלומים (Stripe וכו') נקרא עם אותו key, כך ש-retry מ-west אחרי failover לא יחייב פעמיים.</li>
<li>מיילים של אישור הזמנה יוצאים דרך טבלת outbox → Kafka, כך שהזמנה שנאבדה ב-DB גם לא שלחה מייל.</li>
<li>אחרי failover רץ <strong>reconciliation job</strong> שמושך מספק התשלומים את רשימת החיובים המוצלחים בחלון ה-outage ומשווה מול ההזמנות ב-primary החדש. הזמנות חסרות נוצרות מחדש מהדאטה של הספק; חיובים יתומים מקבלים refund.</li>
<li>כש-east חוזר, אף פעם לא פשוט "מחברים אותו בחזרה": את הזנב שלא שוכפל (הכתיבות ה"אבודות") שולפים עם logical decoding לבדיקה, ואז בונים את east מחדש כ-replica טרי של west.</li></ul>
<blockquote>⚠️ טיפ מה-production: ספק התשלומים הוא single source of truth נסתר — וגם SPOF נסתר. תבדקו מה הסיפור ה-multi-region שלו.</blockquote>`
      }
    },
    {
      h: { en: "Testing DR: game days, chaos and observability", he: "בדיקת DR: game days, chaos ו-observability" },
      body: {
        en: `<p>An untested DR plan is a hope. Build a ladder of tests:</p>
<ol><li><strong>Continuous:</strong> the standby serves synthetic traffic (canaries hitting west's ALB directly) and 1-5% real read traffic via weighted DNS — proves the stack works every day.</li>
<li><strong>Monthly:</strong> promote a <em>clone</em> of the replica and run the full test suite against it; measure promote time.</li>
<li><strong>Quarterly game day:</strong> real failover in production during low traffic: fence east, promote west, flip DNS, run for an hour, fail back. Record actual RTO/RPO per step.</li>
<li><strong>Chaos:</strong> AWS FIS to block east's network paths and see whether alerts and the runbook behave.</li></ol>
<p>Dashboards you need: replica lag (live RPO), standby capacity %, DNS traffic share per region, checkout success rate per region, and a "DR readiness" SLO (e.g. last successful drill &lt; 90 days, config drift between regions = 0 via ArgoCD sync status).</p>`,
        he: `<p>תוכנית DR שלא נבדקה היא תקווה. בונים סולם של בדיקות:</p>
<ol><li><strong>רציף:</strong> ה-standby משרת synthetic traffic (canaries שפונים ישירות ל-ALB של west) ו-1-5% מתעבורת הקריאה האמיתית דרך weighted DNS — מוכיח כל יום שה-stack עובד.</li>
<li><strong>חודשי:</strong> עושים promote ל-<em>clone</em> של ה-replica ומריצים עליו את כל ה-test suite; מודדים זמן promote.</li>
<li><strong>Game day רבעוני:</strong> failover אמיתי ב-production בשעות שפל: fencing ל-east, promote ל-west, החלפת DNS, רצים שעה, failback. מתעדים RTO/RPO בפועל לכל שלב.</li>
<li><strong>Chaos:</strong> AWS FIS כדי לחסום נתיבי רשת של east ולראות אם ה-alerts וה-runbook מתנהגים כמו שצריך.</li></ol>
<p>Dashboards שצריך: replica lag (ה-RPO החי), אחוז קיבולת ב-standby, חלוקת תעבורת DNS לפי region, אחוז הצלחת checkout לפי region, ו-SLO של "DR readiness" (למשל drill מוצלח אחרון לפני פחות מ-90 יום, ו-config drift בין regions = 0 לפי סטטוס ה-sync של ArgoCD).</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Warm standby vs active-active: warm standby costs ~35% more and accepts ~10-15 min RTO; active-active gives near-zero RTO and better latency but needs conflict-free data design (per-user home region, CRDTs or globally consistent DBs like Spanner/CockroachDB) and doubles cost.", he: "Warm standby מול active-active: warm standby עולה בערך 35% יותר ומקבל RTO של 10-15 דקות; active-active נותן RTO כמעט אפס ו-latency טוב יותר, אבל דורש design של דאטה בלי קונפליקטים (home region לכל משתמש, CRDTs, או DB גלובלי כמו Spanner/CockroachDB) ומכפיל עלות." },
    { en: "Async vs sync cross-region replication: async keeps write latency low but loses up to the replica lag on failover; sync gives RPO 0 but adds ~65 ms per commit and couples availability of both regions.", he: "רפליקציה אסינכרונית מול סינכרונית: אסינכרונית שומרת על latency כתיבה נמוך אבל מאבדת עד גודל ה-lag ב-failover; סינכרונית נותנת RPO אפס אבל מוסיפה ~65 ms לכל commit ומצמידה את הזמינות של שני ה-regions." },
    { en: "Automatic vs manual failover: automatic minimizes RTO but risks flapping and split-brain on false positives; manual decision + automated execution is the common compromise.", he: "Failover אוטומטי מול ידני: אוטומטי ממזער RTO אבל מסתכן ב-flapping ו-split-brain על false positives; החלטה ידנית עם ביצוע אוטומטי זו הפשרה הנפוצה." },
    { en: "DNS failover vs anycast/Global Accelerator: DNS is cheap and simple but suffers from resolver caching; anycast fails over in seconds but adds cost and a new vendor dependency.", he: "DNS failover מול anycast/Global Accelerator: DNS זול ופשוט אבל סובל מ-caching של resolvers; anycast עושה failover תוך שניות אבל מוסיף עלות ותלות בספק נוסף." }
  ],
  followUps: [
    {
      q: { en: "The health check says us-east-1 is down, but your engineers in Slack say the app looks fine for them. What do you do?", he: "ה-health check אומר ש-us-east-1 למטה, אבל המהנדסים ב-Slack אומרים שאצלם האפליקציה נראית תקינה. מה עושים?" },
      a: { en: "This is exactly why the decision is human-gated. Check from multiple vantage points (synthetic probes from 3+ regions, real-user error rate from CDN logs, checkout success rate). If only the checker's path is broken, do nothing. If the region is partially degraded (e.g. one AZ, or a dependency like the regional S3), prefer zonal evacuation or feature degradation over a full regional failover, which itself carries risk and data loss up to replica lag. Fail over only when customer-facing SLIs are burning budget fast and recovery ETA from the provider is longer than our RTO.", he: "בדיוק בגלל זה ההחלטה מגודרת אנושית. בודקים מכמה נקודות מבט (synthetic probes מ-3+ regions, אחוז שגיאות של משתמשים אמיתיים מלוגים של ה-CDN, אחוז הצלחת checkout). אם רק הנתיב של ה-checker שבור — לא עושים כלום. אם ה-region פגוע חלקית (AZ אחד, או תלות כמו S3 האזורי), עדיף evacuation של zone או degradation של פיצ'רים על פני failover אזורי מלא, שבעצמו מסוכן ומאבד דאטה עד גודל ה-lag. עושים failover רק כשה-SLIs מול הלקוח שורפים budget מהר וה-ETA של הספק ארוך מה-RTO שלנו." }
    },
    {
      q: { en: "The business now wants RPO = 0 for payments. How?", he: "עכשיו הביזנס רוצה RPO = 0 לתשלומים. איך?" },
      a: { en: "Don't make the whole DB synchronous. Options: (1) isolate the payments/order ledger into a small store with synchronous replication to a nearby region or a quorum across 3 regions (Aurora/Spanner/CockroachDB with a 3-region quorum, ~30-70 ms extra per write — acceptable at 25 writes/s); (2) treat the payment provider as the source of truth and reconcile from it, which gives effective RPO 0 for money even if our DB lags; (3) write-ahead the intent to a multi-region durable log (Kafka with cross-region acks or DynamoDB global tables) before confirming to the user. In practice (2) + idempotency keys is the cheapest robust answer.", he: "לא הופכים את כל ה-DB לסינכרוני. אפשרויות: (1) לבודד את ה-ledger של תשלומים/הזמנות ל-store קטן עם רפליקציה סינכרונית ל-region קרוב או quorum על פני 3 regions (Aurora/Spanner/CockroachDB עם quorum של 3 regions, תוספת של ~30-70 ms לכתיבה — סביר ב-25 כתיבות בשנייה); (2) להתייחס לספק התשלומים כ-source of truth ולעשות ממנו reconciliation, מה שנותן RPO אפקטיבי של אפס על כסף גם אם ה-DB שלנו בפיגור; (3) לכתוב את ה-intent קודם ל-log עמיד multi-region (Kafka עם acks בין regions או DynamoDB global tables) לפני שמאשרים למשתמש. בפועל (2) יחד עם idempotency keys זו התשובה הזולה והחזקה ביותר." }
    },
    {
      q: { en: "How do you prevent the two regions' configurations from drifting apart over months?", he: "איך מונעים מהקונפיגורציה של שני ה-regions להיסחף אחד מהשני לאורך חודשים?" },
      a: { en: "Everything as code from one source: Terraform modules instantiated per region with only region-specific variables, ArgoCD ApplicationSets deploying the same manifests to both clusters, the same container image digests. Add drift detection (terraform plan in CI nightly, ArgoCD OutOfSync alerts), keep standby receiving a small slice of real traffic so breakage is noticed, and make the DR drill part of the release calendar. Secrets and feature flags are the usual forgotten drift — replicate them (Secrets Manager multi-region replicas).", he: "הכל as code ממקור אחד: מודולי Terraform שמופעלים לכל region עם משתנים ספציפיים בלבד, ApplicationSets של ArgoCD שפורסים את אותם manifests לשני ה-clusters, ואותם image digests. מוסיפים drift detection (terraform plan ב-CI כל לילה, alerts על OutOfSync ב-ArgoCD), דואגים שה-standby יקבל פרוסה קטנה של תעבורה אמיתית כדי ששבירה תתגלה, והופכים את ה-DR drill לחלק מלוח השחרורים. Secrets ו-feature flags הם ה-drift שבדרך כלל שוכחים — משכפלים אותם (replicas multi-region ב-Secrets Manager)." }
    },
    {
      q: { en: "Users are global and the CEO asks for active-active. What changes in the data layer?", he: "המשתמשים גלובליים וה-CEO מבקש active-active. מה משתנה בשכבת הדאטה?" },
      a: { en: "Partition ownership: give each user a home region (by geography) and route their writes there; reads can be served locally from replicas. Shared, contended data such as inventory needs either a single global owner per SKU, a globally consistent DB (Spanner/CockroachDB, paying cross-region latency on those writes), or allocating stock quotas per region and rebalancing asynchronously. Carts and sessions can use last-writer-wins (DynamoDB global tables). On region loss, users' home region is reassigned — which is the same fencing + reconciliation problem, just per partition instead of global.", he: "חלוקת בעלות: לכל משתמש מגדירים home region (לפי גיאוגרפיה) ומנתבים את הכתיבות שלו לשם; קריאות יכולות להיות מוגשות מקומית מ-replicas. דאטה משותף ותחרותי כמו מלאי צריך או owner גלובלי יחיד לכל SKU, או DB עקבי גלובלית (Spanner/CockroachDB, ומשלמים latency בין regions על הכתיבות האלה), או חלוקת מכסות מלאי לכל region עם איזון אסינכרוני. עגלות ו-sessions יכולים לעבוד עם last-writer-wins (DynamoDB global tables). כשמאבדים region, מעבירים את ה-home region של המשתמשים — שזו אותה בעיית fencing ו-reconciliation, רק לפי partition במקום גלובלית." }
    }
  ],
  related: ["rel-bcdr", "rel-ha", "db-replication", "db-cap", "net-dns", "net-load-balancing", "db-backups", "rel-sli-slo-sla"]
});

window.INFRA.designs.push({
  id: "sd-video-streaming", icon: "🎬", level: 3,
  title: { en: "Video streaming platform (YouTube / Netflix)", he: "פלטפורמת וידאו סטרימינג (YouTube / Netflix)" },
  prompt: {
    en: "Design a video platform where creators upload videos and millions of viewers watch them on phones, laptops and TVs with smooth playback.",
    he: "תתכנן פלטפורמת וידאו שבה יוצרים מעלים סרטונים ומיליוני צופים צופים בהם בטלפון, במחשב ובטלוויזיה עם ניגון חלק."
  },
  clarify: [
    { en: "User-generated (YouTube: many uploads, long tail) or curated catalog (Netflix: few titles, huge views per title)?", he: "תוכן של משתמשים (YouTube: המון העלאות, long tail) או קטלוג אוצר (Netflix: מעט כותרים, המון צפיות לכל אחד)?" },
    { en: "Scale: daily active viewers, uploads per day, average video length?", he: "סקייל: כמה צופים פעילים ביום, כמה העלאות ביום, מה אורך ממוצע של וידאו?" },
    { en: "Is live streaming in scope, or only video on demand?", he: "Live streaming בסקופ, או רק video on demand?" },
    { en: "Which devices and max resolution (4K, HDR)? Do we need DRM?", he: "אילו מכשירים ומה הרזולוציה המקסימלית (4K, HDR)? צריך DRM?" },
    { en: "Are search, recommendations, comments in scope, or focus on upload → playback?", he: "חיפוש, המלצות ותגובות בסקופ, או להתמקד ב-upload → playback?" },
    { en: "How fast must an uploaded video become watchable?", he: "תוך כמה זמן וידאו שהועלה צריך להיות זמין לצפייה?" }
  ],
  functional: [
    { en: "Creators upload large video files (up to several GB) with resumable upload.", he: "יוצרים מעלים קבצי וידאו גדולים (עד כמה GB) עם upload שאפשר לחדש." },
    { en: "The system transcodes each video to multiple resolutions/bitrates and codecs for adaptive streaming.", he: "המערכת עושה transcoding לכל וידאו לכמה רזולוציות/bitrates ו-codecs ל-adaptive streaming." },
    { en: "Viewers play videos with adaptive bitrate (HLS/DASH), seek, and resume where they stopped.", he: "צופים מנגנים עם adaptive bitrate (HLS/DASH), קופצים בזמן, וממשיכים מאיפה שעצרו." },
    { en: "Video metadata (title, status, view counts) is visible and searchable.", he: "המטא-דאטה של הסרטון (כותרת, סטטוס, מספר צפיות) מוצגת וניתנת לחיפוש." }
  ],
  nonFunctional: [
    { en: "Playback start time &lt; 2 s at p95, rebuffering ratio &lt; 0.5% of watch time.", he: "זמן התחלת ניגון &lt; 2 שניות ב-p95, rebuffering ratio &lt; 0.5% מזמן הצפייה." },
    { en: "Video becomes playable within ~5-10 minutes of upload for a 10-minute video.", he: "וידאו של 10 דקות זמין לצפייה תוך ~5-10 דקות מההעלאה." },
    { en: "Uploaded originals are never lost (11 nines durability).", he: "קבצי המקור שהועלו לעולם לא אובדים (durability של 11 תשיעיות)." },
    { en: "Playback availability 99.99%; metadata can be eventually consistent (view counts may lag).", he: "זמינות ניגון 99.99%; המטא-דאטה יכולה להיות eventually consistent (מונה צפיות יכול לפגר)." },
    { en: "Egress cost is the dominant cost — design must minimize origin bandwidth.", he: "עלות ה-egress היא העלות הדומיננטית — ה-design חייב למזער רוחב פס מה-origin." }
  ],
  estimates: {
    en: `<p><strong>Viewing:</strong> 100M DAU × 5 videos × 6 min avg = 3B minutes/day. Concurrency: 3B min ÷ 1,440 min/day ≈ 2M average concurrent streams, peak (evening) ×2.5 ≈ <strong>5M concurrent streams</strong>.</p>
<p><strong>Bandwidth:</strong> average delivered bitrate ~3 Mbps (mix of 480p-1080p on mobile/desktop). 5M × 3 Mbps = <strong>15 Tbps peak egress</strong>. This is why a CDN (plus ISP-embedded caches like Netflix Open Connect) is not optional — no origin serves 15 Tbps. With 98% CDN hit ratio, origin sees 2% ≈ 300 Gbps.</p>
<p><strong>Uploads:</strong> 500k videos/day × avg 300 MB raw = 150 TB/day of originals → ≈ 1.7 GB/s ingest (≈ 14 Gbps).</p>
<p><strong>Storage:</strong> encoded ladder (~6 renditions × 2 codecs H.264 + AV1) ≈ 1.5× original size → 150 TB × 2.5 (original + renditions) ≈ <strong>375 TB/day ≈ 135 PB/year</strong>. Hence lifecycle: move originals to S3 Glacier after 30 days, drop rarely-watched renditions (re-transcode on demand).</p>
<p><strong>Transcoding compute:</strong> 500k videos × 7 min avg = 3.5M minutes/day of video. Encoding a full ladder costs ~1 CPU-hour per video-minute for software AV1/H.264 combined → 3.5M CPU-hours/day ÷ 24 ≈ <strong>146k vCPUs steady</strong> → use spot instances, GPUs/ASICs (YouTube uses custom VCUs), and encode AV1 only for popular videos.</p>
<p><strong>Metadata:</strong> 500k new rows/day, tiny. View-count writes: 500M views/day ÷ 86,400 ≈ 6k/s → aggregate in Kafka/stream processor, not per-view DB updates.</p>`,
    he: `<p><strong>צפייה:</strong> 100M DAU × 5 סרטונים × 6 דקות בממוצע = 3B דקות ביום. מקביליות: 3B דקות ÷ 1,440 דקות ביממה ≈ 2M streams במקביל בממוצע, peak (ערב) פי 2.5 ≈ <strong>5M streams במקביל</strong>.</p>
<p><strong>רוחב פס:</strong> bitrate ממוצע שנמסר ~3 Mbps (תמהיל של 480p-1080p במובייל ובדסקטופ). 5M × 3 Mbps = <strong>15 Tbps egress ב-peak</strong>. בגלל זה CDN (ועוד caches שיושבים אצל ספקי האינטרנט, כמו Netflix Open Connect) הוא לא אופציונלי — שום origin לא מגיש 15 Tbps. עם hit ratio של 98% ב-CDN, ה-origin רואה 2% ≈ 300 Gbps.</p>
<p><strong>העלאות:</strong> 500k סרטונים ביום × 300 MB גולמי בממוצע = 150 TB ביום של מקורות → ≈ 1.7 GB/s ingest (≈ 14 Gbps).</p>
<p><strong>אחסון:</strong> ה-ladder המקודד (~6 renditions × 2 codecs, H.264 + AV1) ≈ פי 1.5 מגודל המקור → 150 TB × 2.5 (מקור + renditions) ≈ <strong>375 TB ביום ≈ 135 PB בשנה</strong>. לכן lifecycle: מעבירים מקורות ל-S3 Glacier אחרי 30 יום, ומוחקים renditions של סרטונים שכמעט לא נצפים (re-transcode on demand).</p>
<p><strong>Compute ל-transcoding:</strong> 500k סרטונים × 7 דקות בממוצע = 3.5M דקות וידאו ביום. קידוד ladder מלא עולה ~שעת CPU לכל דקת וידאו (AV1 + H.264 בתוכנה) → 3.5M שעות CPU ביום ÷ 24 ≈ <strong>146k vCPUs באופן קבוע</strong> → משתמשים ב-spot instances, ב-GPUs/ASICs (YouTube משתמשים ב-VCUs ייעודיים), ומקודדים AV1 רק לסרטונים פופולריים.</p>
<p><strong>מטא-דאטה:</strong> 500k שורות חדשות ביום, זניח. כתיבות של מונה צפיות: 500M צפיות ביום ÷ 86,400 ≈ 6k לשנייה → מאגרגים ב-Kafka/stream processor, לא update ל-DB על כל צפייה.</p>`
  },
  api: `POST /v1/videos {title, description, size_bytes, content_type}
     -> 201 {video_id, upload_id, part_urls:[presigned S3 multipart URLs]}
PUT  <presigned part url>  (client uploads 8-64 MB chunks directly to S3)
POST /v1/videos/{id}/complete {upload_id, parts:[{n, etag}]} -> 202 {status:"processing"}
GET  /v1/videos/{id} -> {title, status: uploading|processing|ready|failed, duration, thumbnails, manifest_url}
GET  /v1/videos/{id}/play -> {manifest_url: "https://cdn.example.com/v/{id}/master.m3u8?token=..."}
     (signed URL / DRM license URL, expires in ~6h)
GET  https://cdn.example.com/v/{id}/1080p/seg_00042.m4s   (served by CDN)
POST /v1/videos/{id}/progress {position_s}   (resume point, batched every 10-30s)`,
  dataModel: `videos(video_id PK, owner_id, title, description, status, duration_s,
       original_key, created_at, published_at)          -- Postgres/MySQL, sharded by video_id
renditions(video_id, rendition PK(video_id,rendition), codec, height, bitrate_kbps,
           manifest_key, size_bytes, status)
transcode_jobs(job_id PK, video_id, chunk_idx, profile, state, attempts, worker_id, updated_at)
watch_progress(user_id, video_id, position_s, updated_at) -- Cassandra/DynamoDB, PK user_id
view_counts(video_id, count)                              -- aggregated from Kafka, Redis + DB
Object storage layout (S3):
  originals/{video_id}/source.mp4
  encoded/{video_id}/{codec}_{height}p/seg_00001.m4s ... + playlist.m3u8
  encoded/{video_id}/master.m3u8`,
  diagram: `Creator                                                      Viewers (5M concurrent)
   |  1. POST /videos  -> presigned URLs                           |
   v                                                               v
 API GW --> Video API (metadata DB: Postgres)            CDN edge / ISP caches (98% hit)
   |  2. multipart upload direct                                   | miss
   v                                                               v
 S3 originals --(event)--> Kafka "video.uploaded"           Origin shield --> S3 encoded/
                              |                                     ^
                              v                                     |
                     Transcode orchestrator                         |
                     (split into 4s-10s chunks, DAG)                |
                              |                                     |
               +--------------+--------------+                      |
               v              v              v                      |
          Workers (spot / GPU, k8s Jobs) x thousands                |
          ffmpeg: 240p..4K, H.264 / AV1, thumbnails ---> writes ----+
                              |
                              v
                Packager (HLS/DASH manifests, DRM) -> status=ready
                              |
                     Kafka "video.ready" -> search index, notifications`,
  deepDives: [
    {
      h: { en: "Upload path: resumable, direct-to-storage", he: "מסלול ההעלאה: resumable וישירות ל-storage" },
      body: {
        en: `<p>Never stream multi-GB uploads through your API servers — they would tie up connections and memory for minutes. Instead the API creates the metadata row (status=<code>uploading</code>) and returns <strong>presigned S3 multipart upload URLs</strong>. The client uploads 8-64 MB parts in parallel straight to S3 (or to the nearest edge with S3 Transfer Acceleration); a failed part is just retried, so a dropped mobile connection does not restart a 2 GB upload.</p>
<ul><li>On <code>complete</code>, S3 assembles the object and emits an event (S3 → EventBridge/SQS → Kafka <code>video.uploaded</code>).</li>
<li>Validate early: ffprobe the file for duration/codec, run content-safety and copyright fingerprinting (Content ID-style) in parallel with transcoding.</li>
<li>Incomplete multipart uploads cost money forever — add a lifecycle rule to abort them after 7 days.</li></ul>
<p>Originals are the only irreplaceable data: S3 Standard with versioning and cross-region replication, moved to Glacier Instant/Deep Archive after 30 days. Everything else can be regenerated.</p>`,
        he: `<p>אף פעם לא מזרימים העלאות של כמה GB דרך שרתי ה-API — זה יתפוס connections וזיכרון לדקות. במקום זה ה-API יוצר את שורת המטא-דאטה (status=<code>uploading</code>) ומחזיר <strong>presigned URLs ל-S3 multipart upload</strong>. ה-client מעלה parts של 8-64 MB במקביל ישירות ל-S3 (או ל-edge הקרוב עם S3 Transfer Acceleration); part שנכשל פשוט נשלח שוב, כך שחיבור מובייל שנפל לא מתחיל מחדש העלאה של 2 GB.</p>
<ul><li>ב-<code>complete</code>, S3 מרכיב את האובייקט ומוציא event (S3 → EventBridge/SQS → Kafka <code>video.uploaded</code>).</li>
<li>מוודאים מוקדם: ffprobe על הקובץ לבדיקת אורך ו-codec, ומריצים בדיקות content-safety ו-fingerprinting לזכויות יוצרים (בסגנון Content ID) במקביל ל-transcoding.</li>
<li>Multipart uploads שלא הושלמו עולים כסף לנצח — מוסיפים lifecycle rule שמבטל אותם אחרי 7 ימים.</li></ul>
<p>קבצי המקור הם הדאטה היחיד שאי אפשר לשחזר: S3 Standard עם versioning ו-cross-region replication, ומעבר ל-Glacier Instant/Deep Archive אחרי 30 יום. כל השאר אפשר לייצר מחדש.</p>`
      }
    },
    {
      h: { en: "Transcoding pipeline: chunked, parallel, retryable", he: "Pipeline ה-transcoding: מחולק ל-chunks, מקבילי, ועם retries" },
      body: {
        en: `<p>Transcoding a 60-minute 4K video sequentially into 8 renditions could take hours. Instead, model it as a <strong>DAG</strong>:</p>
<ol><li><strong>Split</strong> the original at keyframes into ~10 s chunks (ffmpeg segment).</li>
<li><strong>Fan out</strong> one task per (chunk × rendition) to a work queue (Kafka/SQS) — a 10-min video = 60 chunks × 8 profiles = 480 independent tasks.</li>
<li>Workers (Kubernetes Jobs on spot instances, autoscaled by queue depth via KEDA) encode and write each chunk to S3.</li>
<li><strong>Merge/package</strong> when all chunks of a rendition are done: generate HLS/DASH playlists, thumbnails, DRM encryption (Widevine/FairPlay via CMAF).</li></ol>
<p>Each task is idempotent (output key is deterministic), so spot interruptions just cause a retry; the orchestrator (Temporal, Step Functions, or a state table) tracks <code>transcode_jobs</code> with attempts and moves poison inputs to a DLQ. Prioritize: publish 360p/720p H.264 first so the video is watchable in minutes, then encode 1080p/4K and AV1 at lower priority, and AV1 only once a video crosses a view threshold — that is where compute money goes furthest.</p>`,
        he: `<p>Transcoding סדרתי של סרטון 4K באורך שעה ל-8 renditions יכול לקחת שעות. במקום זה ממדלים אותו כ-<strong>DAG</strong>:</p>
<ol><li><strong>Split</strong> של המקור ב-keyframes ל-chunks של ~10 שניות (ffmpeg segment).</li>
<li><strong>Fan out</strong> של task לכל (chunk × rendition) לתור עבודה (Kafka/SQS) — סרטון של 10 דקות = 60 chunks × 8 פרופילים = 480 tasks בלתי תלויים.</li>
<li>Workers (Kubernetes Jobs על spot instances, עם autoscaling לפי עומק התור דרך KEDA) מקודדים וכותבים כל chunk ל-S3.</li>
<li><strong>Merge/package</strong> כשכל ה-chunks של rendition מוכנים: יוצרים playlists של HLS/DASH, thumbnails, הצפנת DRM (Widevine/FairPlay דרך CMAF).</li></ol>
<p>כל task הוא idempotent (ה-output key דטרמיניסטי), אז spot interruption רק גורם ל-retry; ה-orchestrator (Temporal, Step Functions או טבלת state) עוקב אחרי <code>transcode_jobs</code> עם מונה attempts ומעביר קלטים "מורעלים" ל-DLQ. סדרי עדיפויות: קודם מוציאים 360p/720p ב-H.264 כדי שהסרטון יהיה צפיה תוך דקות, אחר כך 1080p/4K ו-AV1 בעדיפות נמוכה, ו-AV1 רק כשסרטון עובר סף צפיות — שם הכסף על compute מחזיר הכי הרבה.</p>`
      }
    },
    {
      h: { en: "Adaptive bitrate streaming (HLS/DASH)", he: "Adaptive bitrate streaming (HLS/DASH)" },
      body: {
        en: `<p>The player never downloads "the video"; it downloads a <strong>master manifest</strong> listing renditions, then per-rendition playlists of 2-6 s segments. A typical ladder:</p>
<table><tr><th>Rendition</th><th>Bitrate (H.264)</th></tr>
<tr><td>240p</td><td>0.4 Mbps</td></tr><tr><td>480p</td><td>1.2 Mbps</td></tr>
<tr><td>720p</td><td>3 Mbps</td></tr><tr><td>1080p</td><td>5-6 Mbps</td></tr><tr><td>4K</td><td>15-20 Mbps</td></tr></table>
<p>The player measures throughput and buffer level after each segment and switches rendition at segment boundaries (buffer-based algorithms like BOLA). Startup trick: begin with a low rendition for a fast first frame, then step up. Shorter segments = faster adaptation and startup but more requests and worse compression; 4 s is a common compromise. Netflix goes further with <strong>per-title / per-shot encoding</strong>: a cartoon looks perfect at 1080p with 2 Mbps, an action movie needs 6 Mbps — tuning the ladder per title saves ~20-30% bandwidth, which at 15 Tbps is enormous money.</p>`,
        he: `<p>ה-player אף פעם לא מוריד "את הסרטון"; הוא מוריד <strong>master manifest</strong> שמפרט את ה-renditions, ואז playlist לכל rendition עם segments של 2-6 שניות. ladder טיפוסי:</p>
<table><tr><th>Rendition</th><th>Bitrate (H.264)</th></tr>
<tr><td>240p</td><td>0.4 Mbps</td></tr><tr><td>480p</td><td>1.2 Mbps</td></tr>
<tr><td>720p</td><td>3 Mbps</td></tr><tr><td>1080p</td><td>5-6 Mbps</td></tr><tr><td>4K</td><td>15-20 Mbps</td></tr></table>
<p>ה-player מודד throughput ורמת buffer אחרי כל segment ומחליף rendition בגבולות segments (אלגוריתמים מבוססי buffer כמו BOLA). טריק ל-startup: מתחילים ב-rendition נמוך כדי לקבל frame ראשון מהר, ואז עולים. segments קצרים = התאמה ו-startup מהירים יותר אבל יותר requests ודחיסה פחות טובה; 4 שניות זו פשרה נפוצה. Netflix הולכים רחוק יותר עם <strong>per-title / per-shot encoding</strong>: סרט מצויר נראה מושלם ב-1080p עם 2 Mbps, סרט אקשן צריך 6 Mbps — כיוונון ה-ladder לכל כותר חוסך 20-30% רוחב פס, וב-15 Tbps זה המון כסף.</p>`
      }
    },
    {
      h: { en: "CDN strategy: hit ratio, origin shield and the long tail", he: "אסטרטגיית CDN: hit ratio, origin shield וה-long tail" },
      body: {
        en: `<p>Egress is the #1 cost, so the CDN design matters more than any database choice.</p>
<ul><li><strong>Tiered caching:</strong> edge PoPs → regional <strong>origin shield</strong> → S3. The shield collapses thousands of edge misses for the same segment into one origin fetch (request coalescing), protecting S3 and cutting cost.</li>
<li><strong>Popularity is power-law:</strong> ~10% of videos get ~90% of views. Popular content stays hot at edges naturally; for Netflix-style catalogs, <em>proactively push</em> tomorrow's popular titles to ISP-embedded appliances overnight (Open Connect) when links are idle.</li>
<li><strong>Long tail:</strong> a video watched once a month will always miss the edge — that is fine, it is served from the shield/S3 at slightly higher startup latency.</li>
<li><strong>Multi-CDN</strong> (e.g. Akamai + CloudFront + Fastly) with client-side or DNS steering based on real-user measurements — for both resilience and price negotiation.</li>
<li><strong>Security:</strong> signed URLs/cookies with short expiry and DRM for premium content; segment URLs are cacheable because the token is validated at the edge, not baked into the cache key.</li></ul>`,
        he: `<p>Egress הוא העלות מספר 1, אז ה-design של ה-CDN חשוב יותר מכל בחירת DB.</p>
<ul><li><strong>Tiered caching:</strong> edge PoPs → <strong>origin shield</strong> אזורי → S3. ה-shield מכווץ אלפי misses של edges על אותו segment ל-fetch אחד מה-origin (request coalescing), מגן על S3 וחוסך כסף.</li>
<li><strong>פופולריות מתפלגת לפי power-law:</strong> ~10% מהסרטונים מקבלים ~90% מהצפיות. תוכן פופולרי נשאר חם ב-edges באופן טבעי; בקטלוג בסגנון Netflix <em>דוחפים מראש</em> את הכותרים שיהיו פופולריים מחר למכשירים שיושבים אצל ה-ISPs בלילה (Open Connect), כשהלינקים פנויים.</li>
<li><strong>Long tail:</strong> סרטון שנצפה פעם בחודש תמיד יפספס את ה-edge — וזה בסדר, הוא מוגש מה-shield/S3 עם startup קצת יותר איטי.</li>
<li><strong>Multi-CDN</strong> (למשל Akamai + CloudFront + Fastly) עם ניתוב בצד ה-client או ב-DNS לפי מדידות של משתמשים אמיתיים — גם לחוסן וגם למשא ומתן על מחיר.</li>
<li><strong>אבטחה:</strong> signed URLs/cookies עם תפוגה קצרה ו-DRM לתוכן פרימיום; ה-URLs של ה-segments נשארים cacheable כי ה-token נבדק ב-edge ולא נכנס ל-cache key.</li></ul>`
      }
    },
    {
      h: { en: "Observability: measuring quality of experience", he: "Observability: מדידת quality of experience" },
      body: {
        en: `<p>Server metrics (CDN 5xx, origin latency) are necessary but miss what users feel. The real SLIs come from <strong>client-side telemetry</strong> (players beacon every ~30 s to a collector → Kafka → Flink/ClickHouse):</p>
<ul><li><strong>Video start time</strong> (p50/p95) and <strong>video start failures</strong>.</li>
<li><strong>Rebuffering ratio</strong> = stall time ÷ watch time; target &lt; 0.5%.</li>
<li><strong>Average bitrate</strong> delivered and % of time at HD.</li>
<li>Exits before video start (users giving up).</li></ul>
<p>Slice everything by CDN, ISP, country, device and app version — a rebuffering spike limited to one ISP on one CDN is a peering problem, and multi-CDN steering can route around it automatically. Pipeline SLIs: time from upload-complete to playable (p95 &lt; 10 min), transcode failure rate, queue depth/age. Alert on queue age, not depth: 1M queued tasks with 50k workers may be fine, a 30-minute-old oldest task is not.</p>`,
        he: `<p>מטריקות שרת (5xx ב-CDN, latency של ה-origin) נחוצות אבל מפספסות את מה שהמשתמש מרגיש. ה-SLIs האמיתיים מגיעים מ-<strong>טלמטריה בצד ה-client</strong> (ה-players שולחים beacon כל ~30 שניות ל-collector → Kafka → Flink/ClickHouse):</p>
<ul><li><strong>Video start time</strong> (p50/p95) ו-<strong>video start failures</strong>.</li>
<li><strong>Rebuffering ratio</strong> = זמן תקיעה ÷ זמן צפייה; יעד &lt; 0.5%.</li>
<li><strong>Bitrate ממוצע</strong> שנמסר ואחוז הזמן ב-HD.</li>
<li>יציאות לפני תחילת הסרטון (משתמשים שוויתרו).</li></ul>
<p>חותכים הכל לפי CDN, ISP, מדינה, מכשיר וגרסת אפליקציה — קפיצה ב-rebuffering שמוגבלת ל-ISP אחד על CDN אחד היא בעיית peering, ו-multi-CDN steering יכול לעקוף אותה אוטומטית. SLIs של ה-pipeline: זמן מסיום upload עד playable (p95 &lt; 10 דקות), אחוז כשלונות transcode, עומק וגיל התור. עושים alert על גיל התור, לא על העומק: מיליון tasks בתור עם 50k workers יכול להיות תקין, task הכי ישן בן 30 דקות — לא.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Pre-transcode full ladder vs just-in-time: encoding everything up front gives instant playback at every quality but wastes compute/storage on the long tail; JIT or lazy AV1 saves money but adds latency for the first viewer of a rare rendition.", he: "Transcode מראש של ה-ladder המלא מול just-in-time: לקודד הכל מראש נותן ניגון מיידי בכל איכות אבל מבזבז compute ו-storage על ה-long tail; JIT או AV1 עצל חוסכים כסף אבל מוסיפים latency לצופה הראשון של rendition נדיר." },
    { en: "Segment length: 2 s segments adapt faster and start quicker (important for live), 6-10 s segments compress better and mean fewer CDN requests.", he: "אורך segment: segments של 2 שניות מסתגלים מהר יותר ומתחילים מהר יותר (חשוב ל-live), segments של 6-10 שניות נדחסים טוב יותר ויוצרים פחות requests ל-CDN." },
    { en: "Codec choice: H.264 plays everywhere; AV1/HEVC cut bitrate 30-50% but cost 5-10x more to encode and lack support on older devices — so serve both and decide per video popularity.", he: "בחירת codec: H.264 עובד בכל מקום; AV1/HEVC חוסכים 30-50% ב-bitrate אבל עולים פי 5-10 בקידוד ולא נתמכים במכשירים ישנים — לכן מגישים את שניהם ומחליטים לפי פופולריות הסרטון." },
    { en: "Own CDN/ISP appliances vs commercial CDN: building Open Connect-style infra pays off only at massive scale; commercial multi-CDN is faster to market and elastic.", he: "CDN עצמי/מכשירים אצל ISPs מול CDN מסחרי: לבנות תשתית בסגנון Open Connect משתלם רק בסקייל עצום; multi-CDN מסחרי מהיר יותר להגיע איתו לשוק וגמיש." }
  ],
  followUps: [
    {
      q: { en: "A celebrity uploads a video and 10M people hit play in the first minute. What breaks and how do you handle it?", he: "סלב מעלה סרטון ו-10M אנשים לוחצים play בדקה הראשונה. מה נשבר ואיך מתמודדים?" },
      a: { en: "The cold-cache thundering herd: every edge PoP misses simultaneously on the same first segments. Origin shield with request coalescing turns that into one fetch per shield per segment; additionally pre-warm by pushing the first ~30 s of every rendition to edges when the video is published (we know it's coming for big creators). The metadata/manifest endpoint is cached with short TTL at the CDN too. View counting goes through Kafka with approximate aggregation, so the DB never sees 10M writes. Make sure the transcode finished before publish — schedule premieres so publishing is gated on status=ready.", he: "Thundering herd על cache קר: כל ה-edge PoPs מפספסים בו-זמנית את אותם segments ראשונים. origin shield עם request coalescing הופך את זה ל-fetch אחד לכל shield לכל segment; בנוסף עושים pre-warm — דוחפים את ~30 השניות הראשונות של כל rendition ל-edges ברגע הפרסום (ליוצרים גדולים אנחנו יודעים שזה מגיע). גם ה-endpoint של המטא-דאטה וה-manifest נשמר ב-CDN עם TTL קצר. ספירת הצפיות עוברת דרך Kafka עם אגרגציה מקורבת, כך שה-DB לא רואה 10M כתיבות. ומוודאים שה-transcode הסתיים לפני הפרסום — premieres מתוזמנים כך שהפרסום מותנה ב-status=ready." }
    },
    {
      q: { en: "How would you add live streaming?", he: "איך היית מוסיף live streaming?" },
      a: { en: "Ingest via RTMP/SRT/WebRTC to regional ingest servers; a real-time transcoder (GPU) produces the ladder on the fly; a packager emits low-latency HLS/CMAF with 1-2 s parts; manifests are updated every segment, so the CDN caches segments long but playlists for ~1 s. Latency budget: standard HLS ≈ 15-30 s, LL-HLS ≈ 2-5 s, WebRTC &lt; 1 s (but costly to fan out). Redundancy: dual ingest paths and a standby transcoder per stream because there is no retry — a lost second of live is lost forever. Record segments to S3 to create the VOD afterward.", he: "Ingest דרך RTMP/SRT/WebRTC לשרתי ingest אזוריים; transcoder בזמן אמת (GPU) מייצר את ה-ladder on the fly; packager מוציא low-latency HLS/CMAF עם parts של 1-2 שניות; ה-manifests מתעדכנים כל segment, אז ה-CDN שומר segments הרבה זמן אבל playlists רק ~שנייה. תקציב latency: HLS רגיל ≈ 15-30 שניות, LL-HLS ≈ 2-5 שניות, WebRTC מתחת לשנייה (אבל יקר ל-fan-out). שרידות: שני נתיבי ingest ו-transcoder בהמתנה לכל stream, כי אין retry — שנייה של live שאבדה, אבדה לתמיד. מקליטים את ה-segments ל-S3 כדי לייצר VOD אחר כך." }
    },
    {
      q: { en: "Storage is growing 135 PB/year. The CFO wants it halved. What do you do?", he: "ה-storage גדל ב-135 PB בשנה. ה-CFO רוצה לחתוך בחצי. מה עושים?" },
      a: { en: "Measure access patterns first: most renditions of long-tail videos are never requested. (1) Lifecycle originals to Deep Archive (~$1/TB-month vs ~$23 Standard) after transcoding + 30 days; (2) for videos with &lt; N views in 90 days, delete 4K/1440p and AV1 renditions and regenerate on demand from 1080p mezzanine or the archived original; (3) store renditions in S3 Intelligent-Tiering; (4) use per-title encoding to reduce bitrate (and size) per rendition; (5) dedupe re-uploads by content fingerprint. Together these easily exceed 50% because the tail dominates bytes but not views.", he: "קודם מודדים דפוסי גישה: רוב ה-renditions של סרטוני long tail אף פעם לא מתבקשים. (1) lifecycle של המקורות ל-Deep Archive (~$1 ל-TB בחודש מול ~$23 ב-Standard) אחרי transcode + 30 יום; (2) לסרטונים עם פחות מ-N צפיות ב-90 יום, מוחקים renditions של 4K/1440p ו-AV1 ומייצרים מחדש on demand מ-mezzanine של 1080p או מהמקור בארכיון; (3) שומרים renditions ב-S3 Intelligent-Tiering; (4) per-title encoding שמקטין bitrate (וגודל) לכל rendition; (5) dedupe של העלאות חוזרות לפי content fingerprint. ביחד זה עובר בקלות 50%, כי ה-tail שולט בבייטים, לא בצפיות." }
    }
  ],
  related: ["net-proxies-cdn", "cloud-storage", "arch-queues", "arch-event-driven", "k8s-autoscaling", "arch-caching", "obs-metrics", "db-sharding"]
});

window.INFRA.designs.push({
  id: "sd-distributed-job-scheduler", icon: "⏰", level: 3,
  title: { en: "Distributed job scheduler (cron at scale)", he: "Job scheduler מבוזר (cron בסקייל)" },
  prompt: {
    en: "Teams across the company run cron jobs on random VMs, and when a VM dies jobs silently stop. Design a distributed job scheduler that runs millions of scheduled and one-off jobs reliably.",
    he: "צוותים בכל החברה מריצים cron jobs על VMs רנדומליים, וכש-VM מת ה-jobs פשוט מפסיקים בשקט. תתכנן job scheduler מבוזר שמריץ מיליוני jobs מתוזמנים וחד-פעמיים בצורה אמינה."
  },
  clarify: [
    { en: "How many job definitions and how many executions per day? What is the peak — do many jobs fire at the same second (e.g. midnight)?", he: "כמה הגדרות jobs וכמה הרצות ביום? מה ה-peak — הרבה jobs יורים באותה שנייה (למשל בחצות)?" },
    { en: "What does a job do: call an HTTP endpoint / publish a message, or run arbitrary containers with long durations?", he: "מה ה-job עושה: קורא ל-HTTP endpoint / מפרסם הודעה, או מריץ containers שרירותיים לאורך זמן?" },
    { en: "Required timing precision — within 1 second, or is within a minute fine?", he: "מה דיוק התזמון הנדרש — שנייה, או שדקה זה בסדר?" },
    { en: "Semantics: is at-least-once acceptable if jobs are idempotent, or do some jobs need effectively-once (e.g. billing)?", he: "סמנטיקה: at-least-once מקובל אם ה-jobs idempotent, או שחלק צריכים effectively-once (למשל billing)?" },
    { en: "If the scheduler is down for 10 minutes, should missed runs be caught up, skipped, or only the latest run?", he: "אם ה-scheduler נפל ל-10 דקות, הריצות שפוספסו צריכות להשלים, לדלג, או רק הריצה האחרונה?" },
    { en: "Do we need dependencies between jobs (DAGs like Airflow) or just independent schedules?", he: "צריך תלויות בין jobs (DAGs כמו Airflow) או רק לוחות זמנים בלתי תלויים?" }
  ],
  functional: [
    { en: "Create/update/delete jobs with a cron expression, a one-off time, or a delay; time zones supported.", he: "יצירה/עדכון/מחיקה של jobs עם cron expression, זמן חד-פעמי או delay; עם תמיכה ב-time zones." },
    { en: "Execute each scheduled run once (at-least-once delivery + idempotency keys → effectively once), with retries and backoff.", he: "להריץ כל ריצה מתוזמנת פעם אחת (at-least-once + idempotency keys → effectively once), עם retries ו-backoff." },
    { en: "Per-job policies: timeout, max retries, concurrency (allow / forbid overlap), misfire policy.", he: "מדיניות לכל job: timeout, מקסימום retries, concurrency (לאפשר / לאסור חפיפה), misfire policy." },
    { en: "Execution history, logs and alerting on failures or missed runs.", he: "היסטוריית הרצות, לוגים, ו-alerts על כשלונות או ריצות שפוספסו." }
  ],
  nonFunctional: [
    { en: "Scale: 10M job definitions, ~100M executions/day, bursts of 500k jobs in the same second.", he: "סקייל: 10M הגדרות jobs, ~100M הרצות ביום, bursts של 500k jobs באותה שנייה." },
    { en: "Trigger accuracy: p99 within 2 s of the scheduled time.", he: "דיוק טריגר: p99 בתוך 2 שניות מהזמן המתוזמן." },
    { en: "No single point of failure; losing any node or an AZ must not lose or duplicate scheduled runs (beyond at-least-once).", he: "אין single point of failure; אובדן של node או AZ לא אמור לאבד או לשכפל ריצות מתוזמנות (מעבר ל-at-least-once)." },
    { en: "Multi-tenant fairness: one team's 1M jobs must not starve others.", he: "הוגנות multi-tenant: מיליון jobs של צוות אחד לא אמורים להרעיב אחרים." }
  ],
  estimates: {
    en: `<p><strong>Throughput:</strong> 100M executions/day ÷ 86,400 ≈ <strong>1,160 triggers/s average</strong>. But cron is spiky: humans love <code>0 * * * *</code> and <code>0 0 * * *</code>. Assume 5% of daily runs fire at the top of the hour → 5M ÷ 24 ≈ 200k in one second, worst case (midnight UTC) ~500k/s.</p>
<p><strong>Storage:</strong> job definitions 10M × 1 KB = 10 GB — fits in one Postgres, but we shard for write throughput. Execution history: 100M/day × 500 B = 50 GB/day → 30-day retention = 1.5 TB → time-partitioned table or Cassandra/ClickHouse with TTL.</p>
<p><strong>Scheduler work:</strong> each trigger = read due job + write execution row + enqueue + update <code>next_run_at</code> ≈ 3-4 DB writes. 1,160/s × 4 ≈ 5k writes/s average, ~2M writes/s at the midnight spike → impossible for one DB in one second, so we <strong>pre-load</strong>: a minute ahead, schedulers fetch jobs due in the next 60 s into an in-memory timing wheel, spreading DB reads over a minute (500k ÷ 60 ≈ 8.3k rows/s).</p>
<p><strong>Workers:</strong> if average run = 30 s, concurrency = 1,160 × 30 ≈ 35k jobs running at once on average (Little's law L = λ × W). With 50 concurrent jobs per worker pod → ~700 pods average, autoscale to several thousand on spikes — or ask tenants to add jitter.</p>`,
    he: `<p><strong>Throughput:</strong> 100M הרצות ביום ÷ 86,400 ≈ <strong>1,160 טריגרים בשנייה בממוצע</strong>. אבל cron מאוד קוצני: בני אדם אוהבים <code>0 * * * *</code> ו-<code>0 0 * * *</code>. נניח ש-5% מהריצות היומיות יורות בתחילת שעה → 5M ÷ 24 ≈ 200k בשנייה אחת, ובמקרה הגרוע (חצות UTC) ~500k בשנייה.</p>
<p><strong>אחסון:</strong> הגדרות jobs: 10M × 1 KB = 10 GB — נכנס ל-Postgres אחד, אבל עושים sharding בשביל throughput של כתיבות. היסטוריית הרצות: 100M ביום × 500 B = 50 GB ביום → retention של 30 יום = 1.5 TB → טבלה עם partitions לפי זמן, או Cassandra/ClickHouse עם TTL.</p>
<p><strong>עבודת ה-scheduler:</strong> כל טריגר = קריאת ה-job + כתיבת שורת execution + enqueue + עדכון <code>next_run_at</code> ≈ 3-4 כתיבות ל-DB. 1,160 בשנייה × 4 ≈ 5k כתיבות בשנייה בממוצע, ~2M בשנייה ב-spike של חצות → בלתי אפשרי ל-DB אחד בשנייה אחת, אז עושים <strong>pre-load</strong>: דקה מראש, ה-schedulers מושכים את ה-jobs של 60 השניות הבאות ל-timing wheel בזיכרון, ומפזרים את הקריאות מה-DB על דקה (500k ÷ 60 ≈ 8.3k שורות בשנייה).</p>
<p><strong>Workers:</strong> אם ריצה ממוצעת = 30 שניות, המקביליות = 1,160 × 30 ≈ 35k jobs רצים במקביל בממוצע (Little's law L = λ × W). עם 50 jobs במקביל לכל worker pod → ~700 pods בממוצע, autoscaling לכמה אלפים ב-spikes — או לבקש מהצוותים להוסיף jitter.</p>`
  },
  api: `POST   /v1/jobs {name, schedule:"0 */5 * * *" | run_at | delay_s, tz:"Asia/Jerusalem",
                 target:{type:"http"|"kafka"|"container", ...}, payload,
                 timeout_s, max_retries, concurrency:"forbid"|"allow", misfire:"skip"|"run_once"|"catch_up"}
       -> 201 {job_id, next_run_at}
GET    /v1/jobs/{job_id}               -> job + next_run_at + last_status
PATCH  /v1/jobs/{job_id} {paused:true} -> 200
DELETE /v1/jobs/{job_id}               -> 204
POST   /v1/jobs/{job_id}/trigger       -> 202 {execution_id}   (manual run)
GET    /v1/jobs/{job_id}/executions?limit=50 -> [{execution_id, scheduled_for, started_at, status, attempt}]
# Worker protocol (internal)
POST /internal/executions/{id}/heartbeat   POST /internal/executions/{id}/complete {status, output_ref}`,
  dataModel: `jobs(job_id PK, tenant_id, shard_id, schedule, tz, target JSONB, payload,
     next_run_at, paused, timeout_s, max_retries, concurrency, misfire, version)
  INDEX (shard_id, next_run_at) WHERE NOT paused
executions(execution_id PK, job_id, scheduled_for, attempt, state:
           pending|queued|running|succeeded|failed|timed_out,
           worker_id, lease_until, started_at, finished_at, error)
  UNIQUE (job_id, scheduled_for)        -- dedupe key: one execution per (job, tick)
shard_leases(shard_id PK, owner_scheduler, fencing_token, expires_at)   -- or etcd/ZooKeeper
Queues: Kafka topic "executions.ready" partitioned by tenant/job_id (or per-tenant SQS queues)`,
  diagram: `   Clients / CI / UI
          |
     Job API (stateless) ----> Jobs DB (Postgres, sharded by job_id -> 1024 logical shards)
                                    ^          ^
         etcd / ZooKeeper           |          | 1. every 10s: SELECT due in next 60s
     (shard leases + fencing)       |          |    WHERE shard_id IN (my shards)
          ^   ^   ^                 |          |
          |   |   |          +------+----------+------+
     +----+---+---+----+     | Scheduler-1 | Scheduler-2 | Scheduler-3 |
     | lease shards     |    | timing wheel, owns shards 0-341 ...     |
     +------------------+    +----------------+------------------------+
                                              | 2. at tick: INSERT execution
                                              |    (UNIQUE job_id,scheduled_for)
                                              v    3. enqueue
                                   Kafka "executions.ready" (per-tenant partitions)
                                              |
                       +----------------------+----------------------+
                       v                      v                      v
                  Worker pool A          Worker pool B          Worker pool C
                  (heartbeat lease, run HTTP / container, report result)
                                              |
                        Reaper: lease expired -> retry w/ backoff -> DLQ after max`,
  deepDives: [
    {
      h: { en: "Finding due jobs efficiently: polling, timing wheels and pre-loading", he: "למצוא jobs שהגיע זמנם ביעילות: polling, timing wheels ו-pre-loading" },
      body: {
        en: `<p>The naive design — every second <code>SELECT * FROM jobs WHERE next_run_at &lt;= now()</code> — works at 1k jobs and collapses at 10M: full scans, lock contention, and a midnight spike of 500k rows.</p>
<ul><li>Store <code>next_run_at</code> (computed from cron + time zone at write time and after each run) with an index on <code>(shard_id, next_run_at)</code>.</li>
<li>Each scheduler, every ~10 s, loads jobs due in the next 60 s for <em>its</em> shards into an in-memory <strong>hierarchical timing wheel</strong> (like Kafka's purgatory / Netty's HashedWheelTimer): O(1) insert and fire.</li>
<li>Jobs created with a near-term time go straight to the owning scheduler (or are picked up by the next 10 s poll).</li>
<li>Alternative at smaller scale: a Redis sorted set with score = next_run_at, consumers doing <code>ZRANGEBYSCORE</code> + atomic claim via Lua — simple, but Redis then holds critical state and needs AOF + replication.</li></ul>
<p>Then compute the next <code>next_run_at</code> and write it back in the same transaction that inserts the execution row, so a crash can never "forget" the following run.</p>`,
        he: `<p>ה-design הנאיבי — כל שנייה <code>SELECT * FROM jobs WHERE next_run_at &lt;= now()</code> — עובד ב-1k jobs וקורס ב-10M: full scans, lock contention, ו-spike של 500k שורות בחצות.</p>
<ul><li>שומרים <code>next_run_at</code> (שמחושב מה-cron וה-time zone בזמן הכתיבה ואחרי כל ריצה) עם index על <code>(shard_id, next_run_at)</code>.</li>
<li>כל scheduler, כל ~10 שניות, טוען את ה-jobs של 60 השניות הבאות עבור ה-shards <em>שלו</em> ל-<strong>hierarchical timing wheel</strong> בזיכרון (כמו ה-purgatory של Kafka או HashedWheelTimer של Netty): הכנסה ו-fire ב-O(1).</li>
<li>Jobs שנוצרו עם זמן קרוב נשלחים ישר ל-scheduler הבעלים (או נאספים ב-poll הבא של 10 שניות).</li>
<li>חלופה בסקייל קטן יותר: Redis sorted set עם score = next_run_at, ו-consumers שעושים <code>ZRANGEBYSCORE</code> + claim אטומי דרך Lua — פשוט, אבל אז Redis מחזיק state קריטי וצריך AOF ורפליקציה.</li></ul>
<p>אחר כך מחשבים את ה-<code>next_run_at</code> הבא וכותבים אותו באותה טרנזקציה שמכניסה את שורת ה-execution, כך שקריסה לעולם לא "תשכח" את הריצה הבאה.</p>`
      }
    },
    {
      h: { en: "Sharding schedulers and leader election with fencing", he: "Sharding של schedulers ו-leader election עם fencing" },
      body: {
        en: `<p>One leader scheduler is simple but caps throughput and makes failover a full stop. Instead, split jobs into <strong>1024 logical shards</strong> (<code>hash(job_id) % 1024</code>) and let N scheduler instances each own a subset via <strong>leases in etcd/ZooKeeper</strong> (or Kubernetes Lease objects).</p>
<ul><li>A scheduler that stops renewing its lease (crash, GC pause, partition) loses its shards after the TTL (~10 s); others pick them up and reload their due jobs. That is the failover time for those shards.</li>
<li>The classic bug: scheduler A pauses for 20 s in GC, its lease expires, B takes the shard, A wakes up and fires jobs too → duplicates. Fix with a <strong>fencing token</strong>: each lease grant increments a number; A's DB writes include it (<code>UPDATE ... WHERE shard_owner_token = :token</code>) and are rejected when stale.</li>
<li>Logical shards (many more than nodes) make rebalancing cheap — moving shard 517 is just a lease handover, no data movement.</li></ul>
<blockquote>💡 Real world: this is how many internal schedulers work (e.g. Airbnb's, Dropbox's ATF); Kubernetes CronJob controller uses a single leader-elected controller because its scale is much smaller.</blockquote>`,
        he: `<p>Scheduler מוביל יחיד זה פשוט, אבל מגביל throughput והופך failover לעצירה מלאה. במקום זה מחלקים את ה-jobs ל-<strong>1024 shards לוגיים</strong> (<code>hash(job_id) % 1024</code>) ונותנים ל-N מופעי scheduler להחזיק כל אחד חלק מהם דרך <strong>leases ב-etcd/ZooKeeper</strong> (או אובייקטי Lease של Kubernetes).</p>
<ul><li>Scheduler שמפסיק לחדש את ה-lease (קריסה, GC pause, partition) מאבד את ה-shards שלו אחרי ה-TTL (~10 שניות); אחרים לוקחים אותם וטוענים מחדש את ה-jobs שהגיע זמנם. זה זמן ה-failover ל-shards האלה.</li>
<li>הבאג הקלאסי: scheduler A נתקע 20 שניות ב-GC, ה-lease שלו פג, B לוקח את ה-shard, A מתעורר ויורה jobs גם הוא → כפילויות. הפתרון: <strong>fencing token</strong> — כל הענקת lease מגדילה מספר; הכתיבות של A ל-DB כוללות אותו (<code>UPDATE ... WHERE shard_owner_token = :token</code>) ונדחות כשהוא ישן.</li>
<li>Shards לוגיים (הרבה יותר מ-nodes) הופכים rebalancing לזול — להעביר את shard 517 זה רק העברת lease, בלי להזיז דאטה.</li></ul>
<blockquote>💡 מהשטח: ככה עובדים הרבה schedulers פנימיים (למשל של Airbnb, ה-ATF של Dropbox); ה-controller של Kubernetes CronJob משתמש ב-controller יחיד עם leader election כי הסקייל שלו הרבה יותר קטן.</blockquote>`
      }
    },
    {
      h: { en: "\"Exactly-once-ish\": at-least-once + idempotency", he: "\"Exactly-once בערך\": at-least-once + idempotency" },
      body: {
        en: `<p>True exactly-once execution of an external side effect is impossible across a network: a worker can finish the job and crash before reporting success. So we build <strong>at-least-once with deduplication at every step</strong>:</p>
<ol><li><strong>Trigger dedupe:</strong> <code>UNIQUE(job_id, scheduled_for)</code> on executions. Two schedulers racing on the same tick → one INSERT wins.</li>
<li><strong>Dispatch:</strong> the queue may redeliver; the worker claims the execution with <code>UPDATE executions SET state='running', worker_id=?, lease_until=now()+60s WHERE id=? AND state='queued'</code> — conditional update = only one claimer.</li>
<li><strong>Execution:</strong> the worker heartbeats to extend the lease. If it dies, a reaper sees <code>lease_until</code> expired and re-queues with attempt+1.</li>
<li><strong>Side effect:</strong> we pass <code>execution_id</code> as an <strong>idempotency key</strong> to the target (HTTP header <code>Idempotency-Key</code>). The target is responsible for making the effect happen once — e.g. a billing job stores processed keys in its own DB in the same transaction as the charge.</li></ol>
<p>Be honest with the interviewer: "the scheduler guarantees at-least-once and gives you a stable key; effectively-once is a contract with the job owner."</p>`,
        he: `<p>הרצה exactly-once אמיתית של side effect חיצוני היא בלתי אפשרית על גבי רשת: worker יכול לסיים את ה-job ולקרוס לפני שדיווח הצלחה. לכן בונים <strong>at-least-once עם dedupe בכל שלב</strong>:</p>
<ol><li><strong>Dedupe בטריגר:</strong> <code>UNIQUE(job_id, scheduled_for)</code> על executions. שני schedulers שמתחרים על אותו tick → רק INSERT אחד מצליח.</li>
<li><strong>Dispatch:</strong> התור יכול לשלוח שוב; ה-worker תופס את ה-execution עם <code>UPDATE executions SET state='running', worker_id=?, lease_until=now()+60s WHERE id=? AND state='queued'</code> — update מותנה = רק תופס אחד.</li>
<li><strong>הרצה:</strong> ה-worker שולח heartbeats שמאריכים את ה-lease. אם הוא מת, reaper רואה ש-<code>lease_until</code> פג ומכניס שוב לתור עם attempt+1.</li>
<li><strong>Side effect:</strong> מעבירים את <code>execution_id</code> כ-<strong>idempotency key</strong> ליעד (header של HTTP בשם <code>Idempotency-Key</code>). היעד אחראי לכך שהאפקט יקרה פעם אחת — למשל job של billing שומר את ה-keys שעובדו ב-DB שלו באותה טרנזקציה של החיוב.</li></ol>
<p>תהיו כנים עם המראיין: "ה-scheduler מבטיח at-least-once ונותן key יציב; effectively-once זה חוזה עם הבעלים של ה-job."</p>`
      }
    },
    {
      h: { en: "Retries, misfires, overlap and the thundering herd", he: "Retries, misfires, חפיפות וה-thundering herd" },
      body: {
        en: `<ul><li><strong>Retries:</strong> exponential backoff with jitter (e.g. 10 s, 30 s, 90 s… capped), max attempts per job, then DLQ + alert to the owning team. Distinguish retryable (5xx, timeout) from permanent (4xx) errors.</li>
<li><strong>Misfire policy:</strong> after an outage, a job scheduled every minute has 10 missed ticks. <code>skip</code> (run next tick only), <code>run_once</code> (one catch-up run — the usual default, like k8s <code>startingDeadlineSeconds</code>), or <code>catch_up</code> (all missed ticks — needed for per-hour billing aggregations).</li>
<li><strong>Overlap:</strong> <code>concurrency=forbid</code> means the scheduler checks "is a previous execution still running?" before dispatching; otherwise long jobs pile up and eat the worker pool.</li>
<li><strong>Midnight herd:</strong> 500k jobs at 00:00:00. Mitigate with optional deterministic jitter (<code>hash(job_id) % window</code>, like Jenkins' <code>H</code> syntax), per-tenant rate limits and queues so one tenant cannot monopolize workers, and pre-scaled worker pools before known peaks (scheduled scaling).</li></ul>`,
        he: `<ul><li><strong>Retries:</strong> exponential backoff עם jitter (למשל 10 שניות, 30, 90… עם תקרה), מקסימום ניסיונות לכל job, ואז DLQ + alert לצוות הבעלים. מבדילים בין שגיאות שאפשר לנסות שוב (5xx, timeout) לבין קבועות (4xx).</li>
<li><strong>Misfire policy:</strong> אחרי outage, ל-job שרץ כל דקה יש 10 ticks שפוספסו. <code>skip</code> (רק ה-tick הבא), <code>run_once</code> (ריצת השלמה אחת — ברירת המחדל הנפוצה, כמו <code>startingDeadlineSeconds</code> ב-k8s), או <code>catch_up</code> (כל ה-ticks שפוספסו — נחוץ לאגרגציות billing לפי שעה).</li>
<li><strong>חפיפה:</strong> <code>concurrency=forbid</code> אומר שה-scheduler בודק "האם execution קודם עדיין רץ?" לפני dispatch; אחרת jobs ארוכים נערמים ואוכלים את ה-worker pool.</li>
<li><strong>ה-herd של חצות:</strong> 500k jobs ב-00:00:00. מקלים עם jitter דטרמיניסטי אופציונלי (<code>hash(job_id) % window</code>, כמו תחביר <code>H</code> של Jenkins), rate limits ותורים לכל tenant כדי שצוות אחד לא ישתלט על ה-workers, ו-worker pools שעושים scale מראש לפני peaks ידועים (scheduled scaling).</li></ul>`
      }
    },
    {
      h: { en: "Observability: detecting jobs that silently didn't run", he: "Observability: לזהות jobs שבשקט לא רצו" },
      body: {
        en: `<p>The original pain was <em>silent</em> failure, so the most important signal is about absence, not errors.</p>
<ul><li><strong>Scheduler SLIs:</strong> trigger lag = actual_dispatch − scheduled_for (p99 &lt; 2 s), % of ticks dispatched, shard ownership gaps (any shard without an owner for &gt; 30 s pages on-call).</li>
<li><strong>Queue:</strong> age of oldest ready execution per tenant, not just depth.</li>
<li><strong>Per-job:</strong> last success timestamp. Owners set an expectation (“must succeed at least once every 26 h”) and we alert when <code>time() - last_success &gt; threshold</code> — a dead man's switch, like Prometheus' <code>absent()</code> or Healthchecks.io.</li>
<li><strong>Self-check canary:</strong> a synthetic job every minute per shard; if it does not run, the scheduler itself is broken.</li></ul>
<p>Expose execution history and logs per job in the UI (logs stored in the logging pipeline with <code>execution_id</code> as a field, traces propagated into the job via <code>traceparent</code>). Platform SLO example: 99.9% of scheduled runs dispatched within 5 s, measured monthly.</p>`,
        he: `<p>הכאב המקורי היה כשל <em>שקט</em>, אז הסיגנל הכי חשוב הוא על היעדרות, לא על שגיאות.</p>
<ul><li><strong>SLIs של ה-scheduler:</strong> trigger lag = actual_dispatch − scheduled_for (p99 &lt; 2 שניות), אחוז ה-ticks שנשלחו, חורים בבעלות על shards (כל shard בלי בעלים יותר מ-30 שניות מעיר את ה-on-call).</li>
<li><strong>תור:</strong> הגיל של ה-execution הכי ישן שמוכן לכל tenant, לא רק עומק.</li>
<li><strong>לכל job:</strong> timestamp של ההצלחה האחרונה. הבעלים מגדירים ציפייה ("חייב להצליח לפחות פעם ב-26 שעות") ואנחנו מתריעים כש-<code>time() - last_success &gt; threshold</code> — dead man's switch, כמו <code>absent()</code> של Prometheus או Healthchecks.io.</li>
<li><strong>Canary לבדיקה עצמית:</strong> job סינתטי כל דקה לכל shard; אם הוא לא רץ — ה-scheduler עצמו שבור.</li></ul>
<p>חושפים היסטוריית הרצות ולוגים לכל job ב-UI (הלוגים נשמרים ב-logging pipeline עם <code>execution_id</code> כשדה, ו-traces מועברים לתוך ה-job דרך <code>traceparent</code>). דוגמה ל-SLO של הפלטפורמה: 99.9% מהריצות המתוזמנות נשלחות תוך 5 שניות, נמדד חודשית.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Single leader vs sharded schedulers: a single leader (Kubernetes CronJob, Quartz cluster) is simple and correct but limits throughput and failover is total; sharding scales horizontally at the cost of lease/fencing complexity.", he: "Leader יחיד מול schedulers עם sharding: leader יחיד (Kubernetes CronJob, Quartz cluster) פשוט ונכון אבל מגביל throughput וה-failover טוטאלי; sharding מתרחב אופקית במחיר מורכבות של leases ו-fencing." },
    { en: "DB polling vs Redis sorted sets vs Kafka delayed topics: Postgres gives transactions and durability but needs careful indexing; Redis is fast but holds critical state in memory; Kafka has no native per-message delay, so delays are bucketed topics.", he: "Polling ל-DB מול Redis sorted sets מול delayed topics ב-Kafka: Postgres נותן טרנזקציות ו-durability אבל דורש indexing זהיר; Redis מהיר אבל מחזיק state קריטי בזיכרון; ל-Kafka אין delay מובנה לכל הודעה, אז delays ממומשים עם topics לפי buckets." },
    { en: "At-least-once vs at-most-once: at-least-once (plus idempotency) never loses runs but may duplicate; at-most-once never duplicates but silently drops runs on crashes — choose per job.", he: "At-least-once מול at-most-once: at-least-once (עם idempotency) לא מאבד ריצות אבל עלול לשכפל; at-most-once לא משכפל אבל מפיל ריצות בשקט בקריסות — בוחרים לכל job." },
    { en: "Build vs buy: Temporal, Airflow, AWS EventBridge Scheduler or Kubernetes CronJobs cover many needs; a custom scheduler is justified only for scale, latency or multi-tenancy needs they don't meet.", he: "Build מול buy: Temporal, Airflow, AWS EventBridge Scheduler או Kubernetes CronJobs מכסים הרבה צרכים; scheduler מותאם מוצדק רק לסקייל, latency או multi-tenancy שהם לא מספקים." }
  ],
  followUps: [
    {
      q: { en: "How do you handle daylight saving time for a job set to 02:30 Asia/Jerusalem?", he: "איך מטפלים ב-שעון קיץ ל-job שמוגדר ל-02:30 Asia/Jerusalem?" },
      a: { en: "Store the schedule with its IANA time zone, never as a fixed UTC offset, and compute next_run_at in that zone with a proper library (tzdata kept updated — governments change DST rules with short notice). On spring-forward, 02:30 doesn't exist: define policy (run at 03:00, i.e. the next valid instant — what most cron implementations do). On fall-back, 01:30 happens twice: run once (first occurrence) by deduping on the local wall-clock tick, not UTC. Always show users next run times in UI so surprises are visible.", he: "שומרים את ה-schedule עם ה-time zone של IANA, אף פעם לא כ-offset קבוע מ-UTC, ומחשבים next_run_at באותו אזור עם ספרייה תקינה (tzdata מעודכן — ממשלות משנות חוקי שעון קיץ בהתראה קצרה, ובישראל זה קרה לא פעם). במעבר לשעון קיץ, 02:30 לא קיים: מגדירים policy (להריץ ב-03:00, כלומר הרגע התקין הבא — מה שרוב מימושי ה-cron עושים). במעבר לשעון חורף, 01:30 קורה פעמיים: מריצים פעם אחת (ההופעה הראשונה) בעזרת dedupe לפי ה-tick בשעון המקומי, לא UTC. ותמיד מציגים למשתמש ב-UI את זמני הריצה הבאים כדי שהפתעות יהיו גלויות." }
    },
    {
      q: { en: "The Jobs DB primary fails over and the replica was 5 seconds behind. What happens?", he: "ה-primary של Jobs DB עושה failover וה-replica היה 5 שניות מאחור. מה קורה?" },
      a: { en: "Up to 5 s of writes are lost: some executions inserted and dispatched won't exist in the new primary, and some next_run_at updates revert. Schedulers reload and see those ticks as due again → they re-dispatch with the same (job_id, scheduled_for) and therefore the same deterministic execution_id. Workers/targets that honor the idempotency key dedupe it. This is why the execution id must be derived from (job_id, scheduled_for), not a random UUID. If even that is unacceptable, use synchronous replication (or a consensus store like CockroachDB/Spanner) for the jobs DB — affordable since write volume is moderate.", he: "עד 5 שניות של כתיבות אובדות: חלק מה-executions שהוכנסו ונשלחו לא יהיו קיימים ב-primary החדש, וחלק מעדכוני next_run_at יחזרו אחורה. ה-schedulers טוענים מחדש ורואים את ה-ticks האלה כ-due שוב → שולחים מחדש עם אותו (job_id, scheduled_for) ולכן עם אותו execution_id דטרמיניסטי. workers ויעדים שמכבדים את ה-idempotency key עושים dedupe. בגלל זה ה-execution id חייב להיגזר מ-(job_id, scheduled_for) ולא להיות UUID רנדומלי. אם גם זה לא מקובל, משתמשים ברפליקציה סינכרונית (או store מבוסס consensus כמו CockroachDB/Spanner) ל-jobs DB — זה בר השגה כי נפח הכתיבות מתון." }
    },
    {
      q: { en: "One tenant creates 2M jobs that all run every minute and each takes 5 minutes. How do you protect the platform?", he: "צוות אחד יוצר 2M jobs שכולם רצים כל דקה וכל אחד לוקח 5 דקות. איך מגינים על הפלטפורמה?" },
      a: { en: "Little's law: 2M/min × 5 min = 10M concurrent executions — impossible. Enforce quotas at the API (max jobs, max executions/min, max concurrency per tenant) and reject with a clear error. At runtime, per-tenant queues/partitions with weighted fair scheduling across tenants, so the noisy tenant's backlog only grows its own queue; concurrency=forbid by default prevents overlap pile-ups; and per-tenant dashboards + cost showback make the owner fix their design (probably one batch job processing 2M items, not 2M jobs).", he: "Little's law: 2M לדקה × 5 דקות = 10M הרצות במקביל — בלתי אפשרי. אוכפים quotas ב-API (מקסימום jobs, מקסימום הרצות לדקה, מקסימום concurrency לכל tenant) ודוחים עם שגיאה ברורה. ב-runtime: תורים/partitions לכל tenant עם weighted fair scheduling בין tenants, כך שה-backlog של ה-tenant הרועש מגדיל רק את התור שלו; concurrency=forbid כברירת מחדל מונע הצטברות חפיפות; ו-dashboards לכל tenant עם cost showback גורמים לבעלים לתקן את ה-design (כנראה batch job אחד שמעבד 2M פריטים, לא 2M jobs)." }
    }
  ],
  related: ["arch-queues", "arch-resilience", "db-sharding", "db-replication", "db-indexes", "db-cap", "obs-alerting", "k8s-autoscaling"]
});
