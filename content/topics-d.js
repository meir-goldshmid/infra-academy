// Topics D: System design patterns catalog, Windows Server & Active Directory for infra engineers
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. System Design Patterns Catalog
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "sd-patterns-catalog",
  track: "principal",
  order: 170,
  icon: "🧱",
  level: 3,
  minutes: 18,
  title: { en: "System Design Patterns Catalog", he: "קטלוג ה-patterns של System Design" },
  tldr: {
    en: "Every interview design is a remix of ~18 building blocks. Know each one's trigger (when it fits), its price (the trade-off you accept) and the designs where it shows up — then a new question becomes \"which blocks, and why\" instead of a blank whiteboard.",
    he: "כל שאלת design בראיון היא רמיקס של בערך 18 אבני בניין. אם אתה מכיר לכל אחת את הטריגר (מתי היא מתאימה), את המחיר (ה-trade-off שאתה מקבל על עצמך) ובאילו designs היא מופיעה — שאלה חדשה הופכת ל\"אילו אבנים ולמה\" במקום ללוח ריק."
  },
  analogy: {
    en: "A chess master doesn't calculate every move from scratch — they recognize openings and tactics (fork, pin, skewer) and spend their thinking time on what's unique in this position. Patterns are your openings: \"celebrity user → hybrid fan-out\", \"double-charge risk → idempotency key\", \"flash sale → queue + waiting room\". The interview rewards recognizing them fast and then arguing the trade-off out loud.",
    he: "שחמטאי אמן לא מחשב כל מהלך מאפס — הוא מזהה פתיחות וטקטיקות (מזלג, ריתוק) ומשקיע את זמן החשיבה במה שייחודי בעמדה הזאת. ה-patterns הם הפתיחות שלך: \"משתמש סלבריטי ← fan-out היברידי\", \"סכנת חיוב כפול ← idempotency key\", \"מבצע בזק ← תור + חדר המתנה\". הראיון מתגמל זיהוי מהיר ואז הסבר בקול של ה-trade-off."
  },
  sections: [
    {
      h: { en: "How to use this catalog (and what it is not)", he: "איך להשתמש בקטלוג הזה (ומה הוא לא)" },
      body: {
        en: `<p>The process — clarify, requirements, estimates, API, data model, high-level design, deep dives — lives in the design case <code>sd-framework</code>. This lesson is the toolbox you reach into during the <strong>high-level design</strong> and <strong>deep dive</strong> steps. For each pattern you get three things:</p>
<ul>
<li><strong>Trigger</strong> — the requirement or number that should make you think of it (\"read:write 100:1\", \"must never double-charge\", \"one key gets 30% of traffic\").</li>
<li><strong>Price</strong> — what it costs: extra latency, extra storage, eventual consistency, operational complexity. Naming the price is what separates senior answers from buzzword lists.</li>
<li><strong>Where it shows up</strong> — design cases in this app that lean on it, so you can see it in context.</li>
</ul>
<blockquote>💡 Real world: interviewers rarely ask \"do you know CQRS?\". They give you a symptom — \"the balance query is slow and locks the ledger table\" — and wait to see if you reach for the right block and say what it costs.</blockquote>`,
        he: `<p>התהליך עצמו — הבהרה, דרישות, הערכות, API, מודל נתונים, high-level design, deep dives — נמצא ב-design case ‏<code>sd-framework</code>. השיעור הזה הוא ארגז הכלים שאתה שולף ממנו בשלבי ה-<strong>high-level design</strong> וה-<strong>deep dive</strong>. לכל pattern תקבל שלושה דברים:</p>
<ul>
<li><strong>טריגר</strong> — הדרישה או המספר שאמורים להזכיר לך אותו (\"יחס read:write של 100:1\", \"אסור לחייב פעמיים אף פעם\", \"key אחד מקבל 30% מהתנועה\").</li>
<li><strong>מחיר</strong> — מה זה עולה: latency נוסף, אחסון נוסף, eventual consistency, מורכבות תפעולית. לקרוא למחיר בשם זה מה שמבדיל תשובה של senior מרשימת buzzwords.</li>
<li><strong>איפה זה מופיע</strong> — design cases באפליקציה שנשענים עליו, כדי שתראה אותו בהקשר.</li>
</ul>
<blockquote>💡 מהשטח: מראיינים כמעט אף פעם לא שואלים \"אתה מכיר CQRS?\". הם נותנים סימפטום — \"ה-query של היתרה איטי ונועל את טבלת ה-ledger\" — ומחכים לראות אם תשלוף את האבן הנכונה ותגיד כמה היא עולה.</blockquote>`
      }
    },
    {
      h: { en: "Data-path patterns: fan-out, caching, sharding, consistent hashing, precomputation", he: "Patterns של מסלול הנתונים: fan-out, ‏caching, ‏sharding, ‏consistent hashing, חישוב מראש" },
      body: {
        en: `<table>
<tr><th>Pattern</th><th>Trigger</th><th>Price</th></tr>
<tr><td><strong>Fan-out on write</strong> (push: write each post into every follower's inbox)</td><td>Read-heavy timelines; reads must be ~10 ms; most users have &lt; 10k followers</td><td>Write amplification: one post by a 50M-follower account = 50M inbox writes. Wasted work for inactive followers</td></tr>
<tr><td><strong>Fan-out on read</strong> (pull: merge followees' posts at read time)</td><td>Celebrities, rarely-read feeds, cheap writes matter</td><td>Read latency = merge of N sources; hot read path</td></tr>
<tr><td><strong>Hybrid</strong></td><td>Real social graphs (power-law follower counts)</td><td>Two code paths. Typical cutoff: push below ~10k-100k followers, pull above</td></tr>
<tr><td><strong>Cache-aside</strong> (app reads cache, on miss reads DB and fills)</td><td>Read:write ≥ 10:1, tolerates seconds of staleness</td><td>Stale reads until TTL/invalidation; thundering herd on hot-key expiry (use request coalescing / jittered TTL)</td></tr>
<tr><td><strong>Write-through / write-behind</strong></td><td>Cache must never be stale (write-through) or writes must be absorbed fast (write-behind)</td><td>Write-through adds write latency; write-behind can lose acknowledged writes on cache crash</td></tr>
<tr><td><strong>Sharding by key</strong></td><td>Data or write QPS exceeds one node (e.g. &gt; ~2-5 TB or &gt; ~10k writes/s on one Postgres)</td><td>Cross-shard queries and transactions get hard; key choice is a one-way door</td></tr>
<tr><td><strong>Consistent hashing</strong> (+ virtual nodes)</td><td>Nodes join/leave often; you want to move only ~1/N of keys on change</td><td>More complex than <code>hash % N</code>; still needs vnodes (100-256 per node) for balance</td></tr>
<tr><td><strong>Precomputation / materialized views</strong></td><td>The same expensive aggregate is read far more than its inputs change (top-K, leaderboards, rollups)</td><td>Freshness lag; storage; a pipeline to keep views correct and rebuildable</td></tr>
</table>
<p><strong>Sharding key and hot keys.</strong> Pick the key that (1) appears in your hottest query's WHERE clause so it hits one shard, (2) has high cardinality, (3) spreads writes evenly over time. <code>user_id</code> is usually good; <code>created_at</code> is a classic trap (all writes go to the newest shard); <code>country</code> is too coarse. For hot keys (a celebrity, a flash-sale SKU, one Kafka partition key): split the key (<code>sku#0..sku#15</code> and sum on read), cache it in-process, or route it to a dedicated shard.</p>
<pre>hot-key split for a counter:
  write: INCR views:{video_id}:{rand(0..15)}
  read:  SUM(GET views:{video_id}:0 .. views:{video_id}:15)   -- 16x read cost, 16x write spread</pre>
<blockquote>⚠️ Production tip: consistent hashing moves ~1/N of keys when one of N nodes changes; <code>hash % N</code> going from 10 to 11 nodes remaps ~91% of keys — a cache cold-start that can take your DB down. Play with it in the <code>hashring</code> simulator.</blockquote>`,
        he: `<table>
<tr><th>Pattern</th><th>טריגר</th><th>מחיר</th></tr>
<tr><td><strong>Fan-out on write</strong> (push: כותבים כל פוסט ל-inbox של כל follower)</td><td>Timelines עם הרבה קריאות; קריאה צריכה להיות ~10ms; לרוב המשתמשים פחות מ-10k followers</td><td>Write amplification: פוסט אחד של חשבון עם 50M followers זה 50M כתיבות ל-inbox. עבודה מבוזבזת על followers לא פעילים</td></tr>
<tr><td><strong>Fan-out on read</strong> (pull: ממזגים את הפוסטים בזמן הקריאה)</td><td>סלבריטאים, feeds שכמעט לא נקראים, כשכתיבה זולה חשובה</td><td>Latency של קריאה = מיזוג של N מקורות; מסלול קריאה חם</td></tr>
<tr><td><strong>היברידי</strong></td><td>גרפים חברתיים אמיתיים (התפלגות power-law של followers)</td><td>שני מסלולי קוד. סף טיפוסי: push מתחת ל-10k-100k followers בערך, pull מעל</td></tr>
<tr><td><strong>Cache-aside</strong> (האפליקציה קוראת מה-cache, ב-miss קוראת מה-DB וממלאת)</td><td>יחס read:write של 10:1 ומעלה, אפשר לסבול כמה שניות של מידע ישן</td><td>קריאות ישנות עד TTL או invalidation; thundering herd כש-key חם פג (פתרון: request coalescing או TTL עם jitter)</td></tr>
<tr><td><strong>Write-through / write-behind</strong></td><td>ה-cache אסור שיהיה ישן (write-through) או שצריך לספוג כתיבות מהר (write-behind)</td><td>Write-through מוסיף latency לכתיבה; write-behind יכול לאבד כתיבות שכבר אושרו אם ה-cache נופל</td></tr>
<tr><td><strong>Sharding לפי key</strong></td><td>הנתונים או ה-QPS של הכתיבות גדולים מ-node אחד (למשל יותר מ-2-5TB או יותר מ-10k כתיבות בשנייה על Postgres אחד)</td><td>Queries ו-transactions בין shard-ים נהיים קשים; בחירת ה-key היא one-way door</td></tr>
<tr><td><strong>Consistent hashing</strong> (+ virtual nodes)</td><td>Nodes מצטרפים ועוזבים הרבה; רוצים להזיז רק בערך 1/N מה-keys בכל שינוי</td><td>מורכב יותר מ-<code>hash % N</code>; עדיין צריך vnodes ‏(100-256 לכל node) בשביל איזון</td></tr>
<tr><td><strong>חישוב מראש / materialized views</strong></td><td>אותו aggregate יקר נקרא הרבה יותר ממה שהקלט שלו משתנה (top-K, ‏leaderboards, ‏rollups)</td><td>פיגור ב-freshness; אחסון; pipeline שישמור על ה-views נכונים וניתנים לבנייה מחדש</td></tr>
</table>
<p><strong>מפתח ה-sharding ו-hot keys.</strong> תבחר key ש-(1) מופיע ב-WHERE של ה-query הכי חם שלך כדי שיפגע ב-shard אחד, (2) עם cardinality גבוה, (3) מפזר כתיבות באופן אחיד לאורך זמן. <code>user_id</code> בדרך כלל טוב; <code>created_at</code> זו מלכודת קלאסית (כל הכתיבות הולכות ל-shard הכי חדש); <code>country</code> גס מדי. ל-hot keys (סלבריטי, SKU במבצע בזק, partition key אחד ב-Kafka): מפצלים את ה-key ‏(<code>sku#0..sku#15</code> וסוכמים בקריאה), שומרים אותו ב-cache בתוך התהליך, או מנתבים אותו ל-shard ייעודי.</p>
<pre>hot-key split for a counter:
  write: INCR views:{video_id}:{rand(0..15)}
  read:  SUM(GET views:{video_id}:0 .. views:{video_id}:15)   -- 16x read cost, 16x write spread</pre>
<blockquote>⚠️ טיפ לפרודקשן: consistent hashing מזיז בערך 1/N מה-keys כש-node אחד מתוך N משתנה; מעבר של <code>hash % N</code> מ-10 ל-11 nodes ממפה מחדש בערך 91% מה-keys — cold start של ה-cache שיכול להפיל לך את ה-DB. תשחק עם זה בסימולטור <code>hashring</code>.</blockquote>`
      }
    },
    {
      h: { en: "Correctness patterns: single writer, outbox/CDC, idempotency, sagas, CQRS", he: "Patterns של נכונות: single writer, ‏outbox/CDC, ‏idempotency, ‏sagas, ‏CQRS" },
      body: {
        en: `<ul>
<li><strong>Leader election / single writer.</strong> Trigger: exactly one actor may do X (run the 09:00 cron, own a partition, assign IDs). Use a lease in etcd/ZooKeeper/Consul or a DB row lock, and pass a <strong>fencing token</strong> (monotonic lease epoch) to the storage layer so a paused ex-leader can't write. Price: failover gap = lease TTL (typically 10-15 s), and throughput of one node per key range.</li>
<li><strong>Queue-based load leveling.</strong> Trigger: bursty input (10x spikes), slow or flaky downstream (transcoding, email providers, webhooks). The queue absorbs the spike; consumers drain at a steady rate. Price: async = the user gets 202 Accepted, not the result; you now need DLQs, retries and lag alerts.</li>
<li><strong>Transactional outbox / CDC.</strong> Trigger: \"write to the DB <em>and</em> publish an event\" — the dual-write problem. Write the business row and an <code>outbox</code> row in one local transaction; a relay (or Debezium reading the WAL) publishes it. Price: at-least-once delivery (consumers must dedupe), a relay to operate, ~100 ms-seconds of lag.</li>
<li><strong>Idempotency keys.</strong> Trigger: any retried non-idempotent operation — payments, bookings, sends. Client sends <code>Idempotency-Key: 8f1c…</code>; server stores <code>(key, request_hash, response)</code> with a unique constraint for 24 h-7 days and replays the stored response. Price: a storage lookup on every write; you must define what \"same request\" means.</li>
<li><strong>Sagas.</strong> Trigger: one business action spans several services that each own their DB (reserve seat → charge card → issue ticket). Each step has a compensating action (release seat, refund). Orchestrated (a coordinator / Temporal workflow) or choreographed (events). Price: no isolation — other readers see intermediate states; compensations can fail and need retries too.</li>
<li><strong>CQRS.</strong> Trigger: the write model (normalized, transactional) and read model (denormalized, searchable, aggregated) want different shapes or scale 100x differently. Commands go to the write store; events/CDC build one or more read stores (Elasticsearch, Redis, a balance table). Price: read-after-write is eventual — plan \"read your own writes\" (route the writer to the primary for a few seconds, or return the new state in the command response).</li>
</ul>
<pre>-- outbox in one transaction (Postgres)
BEGIN;
  INSERT INTO payments(id, account_id, amount_cents, status) VALUES ($1, $2, 4999, 'captured');
  INSERT INTO outbox(id, aggregate_id, type, payload) VALUES (gen_random_uuid(), $1, 'PaymentCaptured', $3);
COMMIT;
-- Debezium connector reads the WAL and publishes outbox rows to Kafka topic payments.events</pre>
<blockquote>💡 Real world: outbox + idempotent consumer is how most \"exactly-once\" claims really work: at-least-once delivery, deduplicated by an event id on the consumer side. Say it that way in the interview.</blockquote>`,
        he: `<ul>
<li><strong>Leader election / single writer.</strong> טריגר: בדיוק שחקן אחד מורשה לעשות X (להריץ את ה-cron של 09:00, להחזיק partition, להקצות IDs). משתמשים ב-lease ב-etcd/ZooKeeper/Consul או ב-row lock ב-DB, ומעבירים <strong>fencing token</strong> (epoch עולה של ה-lease) לשכבת האחסון כדי ש-leader קודם שנתקע לא יוכל לכתוב. מחיר: חור ב-failover שווה ל-TTL של ה-lease (בדרך כלל 10-15 שניות), ו-throughput של node אחד לכל טווח keys.</li>
<li><strong>Queue-based load leveling.</strong> טריגר: קלט בהתפרצויות (קפיצות פי 10), downstream איטי או לא יציב (transcoding, ספקי מייל, webhooks). התור סופג את הקפיצה; ה-consumers מרוקנים בקצב קבוע. מחיר: אסינכרוני = המשתמש מקבל 202 Accepted ולא את התוצאה; עכשיו צריך DLQ, ‏retries והתראות על lag.</li>
<li><strong>Transactional outbox / CDC.</strong> טריגר: \"לכתוב ל-DB <em>וגם</em> לפרסם event\" — בעיית ה-dual write. כותבים את השורה העסקית ושורת <code>outbox</code> באותה transaction מקומית; relay (או Debezium שקורא את ה-WAL) מפרסם אותה. מחיר: delivery של at-least-once (ה-consumers חייבים לעשות dedupe), ‏relay שצריך לתפעל, ובין 100ms לכמה שניות של lag.</li>
<li><strong>Idempotency keys.</strong> טריגר: כל פעולה לא-idempotent שעושים לה retry — תשלומים, הזמנות, שליחות. הלקוח שולח <code>Idempotency-Key: 8f1c…</code>; השרת שומר <code>(key, request_hash, response)</code> עם unique constraint ל-24 שעות עד 7 ימים ומחזיר שוב את התשובה השמורה. מחיר: lookup באחסון על כל כתיבה; צריך להגדיר מה זה \"אותה בקשה\".</li>
<li><strong>Sagas.</strong> טריגר: פעולה עסקית אחת שעוברת בכמה שירותים שלכל אחד DB משלו (שמירת מושב ← חיוב כרטיס ← הנפקת כרטיס). לכל שלב יש פעולה מפצה (שחרור מושב, החזר כספי). Orchestrated (מתאם או workflow ב-Temporal) או choreographed (events). מחיר: אין isolation — קוראים אחרים רואים מצבי ביניים; גם פעולות מפצות יכולות להיכשל וצריכות retries.</li>
<li><strong>CQRS.</strong> טריגר: מודל הכתיבה (מנורמל, טרנזקציוני) ומודל הקריאה (denormalized, ניתן לחיפוש, מסוכם) רוצים צורות שונות או גדלים בסדרי גודל שונים. Commands הולכים ל-store של הכתיבה; events או CDC בונים store קריאה אחד או יותר (Elasticsearch, ‏Redis, טבלת יתרות). מחיר: read-after-write הוא eventual — תתכנן \"read your own writes\" (לנתב את הכותב ל-primary לכמה שניות, או להחזיר את המצב החדש בתשובה ל-command).</li>
</ul>
<pre>-- outbox in one transaction (Postgres)
BEGIN;
  INSERT INTO payments(id, account_id, amount_cents, status) VALUES ($1, $2, 4999, 'captured');
  INSERT INTO outbox(id, aggregate_id, type, payload) VALUES (gen_random_uuid(), $1, 'PaymentCaptured', $3);
COMMIT;
-- Debezium connector reads the WAL and publishes outbox rows to Kafka topic payments.events</pre>
<blockquote>💡 מהשטח: outbox יחד עם consumer שהוא idempotent זה איך שרוב הטענות על \"exactly-once\" באמת עובדות: delivery של at-least-once, עם dedupe לפי event id בצד ה-consumer. תגיד את זה ככה בראיון.</blockquote>`
      }
    },
    {
      h: { en: "Scale & edge patterns: approximate counting, geo indexing, presigned uploads, rate limiting, backpressure, multi-region, cells", he: "Patterns של scale ו-edge: ספירה מקורבת, אינדקס גיאוגרפי, presigned uploads, ‏rate limiting, ‏backpressure, ‏multi-region, ‏cells" },
      body: {
        en: `<ul>
<li><strong>Approximate counting.</strong> <em>HyperLogLog</em> counts distinct items (unique visitors, unique IPs) in ~12 KB per counter with ~0.81% standard error (Redis <code>PFADD</code>/<code>PFCOUNT</code>), and HLLs merge — so per-minute sketches roll up to per-day. <em>Count-Min Sketch</em> estimates per-item frequency in fixed memory (it only over-counts), paired with a min-heap for heavy hitters / top-K. <em>Bloom filter</em> answers \"have I seen this URL?\" with no false negatives. Price: answers are approximate — not for billing.</li>
<li><strong>Geo indexing.</strong> Turn 2-D lat/lng into 1-D cells you can index: geohash (prefix = area; 6 chars ≈ 1.2 km × 0.6 km), Google S2 or Uber H3 (hexagons, uniform neighbors), or a quadtree in memory. Query = your cell + its 8 neighbors, then exact-distance filter. Price: cell-size tuning; dense cities need finer cells than deserts; moving objects (drivers every 4 s) need an in-memory index, not a B-tree.</li>
<li><strong>Presigned direct-to-storage uploads.</strong> API issues a short-lived URL (5-15 min) scoped to one object key; the client PUTs bytes straight to S3/GCS; an object-created event triggers processing. Your API servers never proxy gigabytes. Price: you validate after upload (size, type, malware scan), use multipart for &gt; 100 MB, and clean up abandoned uploads with a lifecycle rule.</li>
<li><strong>Rate limiting.</strong> Token bucket (bursts allowed) or sliding window (smooth), keyed per user / API key / IP, enforced at the gateway with a shared counter (Redis + Lua) or locally with approximate global sync. Price: an extra hop or eventual accuracy; decide fail-open vs fail-closed when the limiter store is down.</li>
<li><strong>Backpressure &amp; load shedding.</strong> Bounded queues everywhere; when full, slow the producer (TCP window, Kafka consumer pause, HTTP 429 with <code>Retry-After</code>) or drop the least valuable work first (prefetch, analytics) to keep the critical path alive. Price: some requests fail on purpose — which is the point; unbounded queues just convert overload into latency and OOM.</li>
<li><strong>Multi-region active-passive vs active-active.</strong> Active-passive: one region takes writes, async replication, RPO = replication lag (seconds), RTO = minutes of failover. Active-active: both take writes — needs conflict handling (per-key home region, CRDTs, LWW) and costs ~2x. Price either way: cross-region RTT of 60-150 ms on any synchronous step.</li>
<li><strong>Cells.</strong> Split the whole stack into N identical, independent copies, each serving a slice of customers, behind a thin routing layer. A bad deploy or poison tenant hurts 1/N of users. Price: a cell router, per-cell capacity planning, and cross-cell features (global search, admin views) become harder.</li>
</ul>
<pre># presigned upload (AWS CLI shown; SDKs do the same for PUT)
aws s3 presign s3://uploads-prod/u/42/video.mp4 --expires-in 900
https://uploads-prod.s3.eu-west-1.amazonaws.com/u/42/video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&amp;X-Amz-Expires=900&amp;X-Amz-Signature=…

# HyperLogLog in Redis
127.0.0.1:6379&gt; PFADD uv:2026-11-14 user:1 user:2 user:3 user:2
(integer) 1
127.0.0.1:6379&gt; PFCOUNT uv:2026-11-14
(integer) 3</pre>`,
        he: `<ul>
<li><strong>ספירה מקורבת.</strong> <em>HyperLogLog</em> סופר פריטים ייחודיים (מבקרים ייחודיים, IPs ייחודיים) בכ-12KB לכל מונה עם שגיאת תקן של כ-0.81% ‏(ב-Redis: ‏<code>PFADD</code>/<code>PFCOUNT</code>), ו-HLL-ים מתמזגים — אז sketches לכל דקה מתגלגלים ליום שלם. <em>Count-Min Sketch</em> מעריך תדירות לכל פריט בזיכרון קבוע (הוא רק סופר יותר, אף פעם לא פחות), ובשילוב עם min-heap נותן heavy hitters ו-top-K. <em>Bloom filter</em> עונה על \"ראיתי כבר את ה-URL הזה?\" בלי false negatives. מחיר: התשובות מקורבות — לא מתאים ל-billing.</li>
<li><strong>אינדקס גיאוגרפי.</strong> הופכים lat/lng דו-ממדי לתאים חד-ממדיים שאפשר לאנדקס: geohash ‏(prefix = אזור; 6 תווים ≈ 1.2 על 0.6 ק\"מ), ‏S2 של Google או H3 של Uber (משושים, שכנים אחידים), או quadtree בזיכרון. Query = התא שלך ועוד 8 השכנים, ואז סינון לפי מרחק מדויק. מחיר: כיוונון גודל התא; ערים צפופות צריכות תאים קטנים יותר ממדבר; אובייקטים זזים (נהגים כל 4 שניות) צריכים אינדקס בזיכרון, לא B-tree.</li>
<li><strong>Presigned uploads ישירות לאחסון.</strong> ה-API מנפיק URL קצר-מועד (5-15 דקות) שמוגבל ל-object key אחד; הלקוח עושה PUT לבייטים ישר ל-S3/GCS; event של object-created מפעיל את העיבוד. שרתי ה-API שלך אף פעם לא מעבירים דרכם ג'יגה-בייטים. מחיר: הבדיקה מגיעה אחרי ההעלאה (גודל, סוג, סריקת malware), צריך multipart מעל 100MB, ולנקות העלאות נטושות עם lifecycle rule.</li>
<li><strong>Rate limiting.</strong> Token bucket (מאפשר bursts) או sliding window (חלק), לפי משתמש / API key / IP, נאכף ב-gateway עם מונה משותף (Redis + Lua) או מקומית עם סנכרון גלובלי מקורב. מחיר: hop נוסף או דיוק eventual; צריך להחליט fail-open מול fail-closed כשה-store של ה-limiter למטה.</li>
<li><strong>Backpressure ו-load shedding.</strong> תורים חסומים בגודל בכל מקום; כשהם מלאים, מאטים את ה-producer ‏(TCP window, ‏pause ל-consumer של Kafka, ‏HTTP 429 עם <code>Retry-After</code>) או זורקים קודם את העבודה הכי פחות חשובה (prefetch, ‏analytics) כדי שהמסלול הקריטי ישרוד. מחיר: חלק מהבקשות נכשלות בכוונה — וזה בדיוק העניין; תורים בלי גבול רק הופכים עומס ל-latency ול-OOM.</li>
<li><strong>Multi-region: ‏active-passive מול active-active.</strong> Active-passive: אזור אחד מקבל כתיבות, replication אסינכרוני, ‏RPO = ה-lag של ה-replication (שניות), ‏RTO = דקות של failover. Active-active: שניהם מקבלים כתיבות — צריך טיפול בקונפליקטים (home region לכל key, ‏CRDTs, ‏LWW) וזה עולה בערך פי 2. המחיר בשני המקרים: RTT בין אזורים של 60-150ms על כל שלב סינכרוני.</li>
<li><strong>Cells.</strong> מפצלים את כל ה-stack ל-N עותקים זהים ובלתי תלויים, שכל אחד משרת פלח של לקוחות, מאחורי שכבת ניתוב דקה. Deploy גרוע או tenant רעיל פוגעים ב-1/N מהמשתמשים. מחיר: cell router, תכנון capacity לכל cell, ופיצ'רים שחוצים cells (חיפוש גלובלי, מסכי admin) נהיים קשים יותר.</li>
</ul>
<pre># presigned upload (AWS CLI shown; SDKs do the same for PUT)
aws s3 presign s3://uploads-prod/u/42/video.mp4 --expires-in 900
https://uploads-prod.s3.eu-west-1.amazonaws.com/u/42/video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&amp;X-Amz-Expires=900&amp;X-Amz-Signature=…

# HyperLogLog in Redis
127.0.0.1:6379&gt; PFADD uv:2026-11-14 user:1 user:2 user:3 user:2
(integer) 1
127.0.0.1:6379&gt; PFCOUNT uv:2026-11-14
(integer) 3</pre>`
      }
    },
    {
      h: { en: "The big map: pattern → design cases that use it", he: "המפה הגדולה: pattern ← ה-design cases שמשתמשים בו" },
      body: {
        en: `<table>
<tr><th>Pattern</th><th>Design cases (Interview → System design)</th></tr>
<tr><td>Fan-out on write / read / hybrid</td><td><code>sd-news-feed</code>, <code>sd-chat</code> (group delivery), <code>sd-notification-system</code>, <code>sd-webhook-delivery</code></td></tr>
<tr><td>Cache-aside / write-through</td><td><code>sd-url-shortener</code>, <code>sd-distributed-cache</code>, <code>sd-news-feed</code>, <code>sd-feature-flags-config</code>, <code>sd-typeahead</code>, <code>sd-cdn</code></td></tr>
<tr><td>Sharding key &amp; hot keys</td><td><code>sd-kv-store</code>, <code>sd-chat</code>, <code>sd-message-queue</code>, <code>sd-metrics-platform</code>, <code>sd-leaderboard</code>, <code>sd-ticket-booking</code></td></tr>
<tr><td>Consistent hashing</td><td><code>sd-distributed-cache</code>, <code>sd-kv-store</code>, <code>sd-object-storage</code>, <code>sd-cdn</code>, <code>sd-web-crawler</code> (host → worker)</td></tr>
<tr><td>Leader election / single writer</td><td><code>sd-distributed-job-scheduler</code>, <code>sd-message-queue</code>, <code>sd-kv-store</code>, <code>sd-id-generator</code>, <code>sd-collab-docs</code></td></tr>
<tr><td>Queue-based load leveling</td><td><code>sd-notification-system</code>, <code>sd-logging-pipeline</code>, <code>sd-video-streaming</code>, <code>sd-web-crawler</code>, <code>sd-webhook-delivery</code>, <code>sd-ci-cd-platform</code></td></tr>
<tr><td>Outbox / CDC</td><td><code>sd-payments-ledger</code>, <code>sd-search-service</code>, <code>sd-notification-system</code>, <code>sd-webhook-delivery</code></td></tr>
<tr><td>Idempotency keys</td><td><code>sd-payments-ledger</code>, <code>sd-ticket-booking</code>, <code>sd-webhook-delivery</code>, <code>sd-notification-system</code>, <code>sd-file-sync</code></td></tr>
<tr><td>Sagas</td><td><code>sd-payments-ledger</code>, <code>sd-ticket-booking</code></td></tr>
<tr><td>CQRS</td><td><code>sd-search-service</code>, <code>sd-payments-ledger</code>, <code>sd-news-feed</code>, <code>sd-ad-click-aggregation</code></td></tr>
<tr><td>Precomputation / materialized views</td><td><code>sd-news-feed</code>, <code>sd-top-k-trending</code>, <code>sd-leaderboard</code>, <code>sd-typeahead</code>, <code>sd-metrics-platform</code>, <code>sd-ad-click-aggregation</code></td></tr>
<tr><td>Approximate counting (HLL, Count-Min, Bloom)</td><td><code>sd-top-k-trending</code>, <code>sd-ad-click-aggregation</code>, <code>sd-web-crawler</code>, <code>sd-observability-at-scale</code></td></tr>
<tr><td>Geo indexing</td><td><code>sd-proximity-service</code></td></tr>
<tr><td>Presigned direct uploads</td><td><code>sd-video-streaming</code>, <code>sd-file-sync</code>, <code>sd-object-storage</code>, <code>sd-chat</code> (media), <code>sd-git-hosting</code> (LFS)</td></tr>
<tr><td>Rate limiting</td><td><code>sd-rate-limiter</code>, <code>sd-ai-chat-platform</code> (token budgets), <code>sd-web-crawler</code> (politeness), <code>sd-auth-sso</code> (login throttling), <code>sd-webhook-delivery</code></td></tr>
<tr><td>Backpressure &amp; load shedding</td><td><code>sd-message-queue</code>, <code>sd-logging-pipeline</code>, <code>sd-observability-at-scale</code>, <code>sd-ai-chat-platform</code>, <code>sd-ticket-booking</code> (waiting room)</td></tr>
<tr><td>Multi-region active-active / passive</td><td><code>sd-multi-region</code>, <code>sd-payments-ledger</code>, <code>sd-auth-sso</code>, <code>sd-secrets-manager</code>, <code>sd-kv-store</code></td></tr>
<tr><td>Cells</td><td><code>sd-k8s-platform</code>, <code>sd-ai-chat-platform</code>, <code>sd-multi-region</code>, <code>sd-observability-at-scale</code></td></tr>
</table>
<p>Read it the other way, too: <code>sd-payments-ledger</code> alone uses outbox, idempotency, sagas, CQRS and active-passive — which is why it's a senior question.</p>`,
        he: `<table>
<tr><th>Pattern</th><th>Design cases ‏(Interview ← System design)</th></tr>
<tr><td>Fan-out on write / read / היברידי</td><td><code>sd-news-feed</code>, <code>sd-chat</code> (שליחה לקבוצות), <code>sd-notification-system</code>, <code>sd-webhook-delivery</code></td></tr>
<tr><td>Cache-aside / write-through</td><td><code>sd-url-shortener</code>, <code>sd-distributed-cache</code>, <code>sd-news-feed</code>, <code>sd-feature-flags-config</code>, <code>sd-typeahead</code>, <code>sd-cdn</code></td></tr>
<tr><td>מפתח sharding ו-hot keys</td><td><code>sd-kv-store</code>, <code>sd-chat</code>, <code>sd-message-queue</code>, <code>sd-metrics-platform</code>, <code>sd-leaderboard</code>, <code>sd-ticket-booking</code></td></tr>
<tr><td>Consistent hashing</td><td><code>sd-distributed-cache</code>, <code>sd-kv-store</code>, <code>sd-object-storage</code>, <code>sd-cdn</code>, <code>sd-web-crawler</code> (host ← worker)</td></tr>
<tr><td>Leader election / single writer</td><td><code>sd-distributed-job-scheduler</code>, <code>sd-message-queue</code>, <code>sd-kv-store</code>, <code>sd-id-generator</code>, <code>sd-collab-docs</code></td></tr>
<tr><td>Queue-based load leveling</td><td><code>sd-notification-system</code>, <code>sd-logging-pipeline</code>, <code>sd-video-streaming</code>, <code>sd-web-crawler</code>, <code>sd-webhook-delivery</code>, <code>sd-ci-cd-platform</code></td></tr>
<tr><td>Outbox / CDC</td><td><code>sd-payments-ledger</code>, <code>sd-search-service</code>, <code>sd-notification-system</code>, <code>sd-webhook-delivery</code></td></tr>
<tr><td>Idempotency keys</td><td><code>sd-payments-ledger</code>, <code>sd-ticket-booking</code>, <code>sd-webhook-delivery</code>, <code>sd-notification-system</code>, <code>sd-file-sync</code></td></tr>
<tr><td>Sagas</td><td><code>sd-payments-ledger</code>, <code>sd-ticket-booking</code></td></tr>
<tr><td>CQRS</td><td><code>sd-search-service</code>, <code>sd-payments-ledger</code>, <code>sd-news-feed</code>, <code>sd-ad-click-aggregation</code></td></tr>
<tr><td>חישוב מראש / materialized views</td><td><code>sd-news-feed</code>, <code>sd-top-k-trending</code>, <code>sd-leaderboard</code>, <code>sd-typeahead</code>, <code>sd-metrics-platform</code>, <code>sd-ad-click-aggregation</code></td></tr>
<tr><td>ספירה מקורבת (HLL, ‏Count-Min, ‏Bloom)</td><td><code>sd-top-k-trending</code>, <code>sd-ad-click-aggregation</code>, <code>sd-web-crawler</code>, <code>sd-observability-at-scale</code></td></tr>
<tr><td>אינדקס גיאוגרפי</td><td><code>sd-proximity-service</code></td></tr>
<tr><td>Presigned uploads ישירים</td><td><code>sd-video-streaming</code>, <code>sd-file-sync</code>, <code>sd-object-storage</code>, <code>sd-chat</code> (מדיה), <code>sd-git-hosting</code> ‏(LFS)</td></tr>
<tr><td>Rate limiting</td><td><code>sd-rate-limiter</code>, <code>sd-ai-chat-platform</code> (תקציבי tokens), <code>sd-web-crawler</code> (politeness), <code>sd-auth-sso</code> (הגבלת ניסיונות login), <code>sd-webhook-delivery</code></td></tr>
<tr><td>Backpressure ו-load shedding</td><td><code>sd-message-queue</code>, <code>sd-logging-pipeline</code>, <code>sd-observability-at-scale</code>, <code>sd-ai-chat-platform</code>, <code>sd-ticket-booking</code> (חדר המתנה)</td></tr>
<tr><td>Multi-region ‏active-active / passive</td><td><code>sd-multi-region</code>, <code>sd-payments-ledger</code>, <code>sd-auth-sso</code>, <code>sd-secrets-manager</code>, <code>sd-kv-store</code></td></tr>
<tr><td>Cells</td><td><code>sd-k8s-platform</code>, <code>sd-ai-chat-platform</code>, <code>sd-multi-region</code>, <code>sd-observability-at-scale</code></td></tr>
</table>
<p>תקרא את הטבלה גם בכיוון ההפוך: <code>sd-payments-ledger</code> לבד משתמש ב-outbox, ‏idempotency, ‏sagas, ‏CQRS ו-active-passive — ובגלל זה זו שאלה של senior.</p>`
      }
    },
    {
      h: { en: "Which questions to ask to choose a pattern", he: "אילו שאלות לשאול כדי לבחור pattern" },
      body: {
        en: `<table>
<tr><th>Ask</th><th>If the answer is…</th><th>Reach for</th></tr>
<tr><td>What's the read:write ratio?</td><td>≥ 10:1 and staleness OK</td><td>Cache-aside, read replicas, precomputed views, fan-out on write</td></tr>
<tr><td>Is the access skewed? Who is the biggest key?</td><td>Top key &gt; ~1% of traffic</td><td>Hot-key splitting, local cache, hybrid fan-out, dedicated shard</td></tr>
<tr><td>Can the user wait for the result?</td><td>Yes (seconds-minutes)</td><td>Queue-based load leveling, 202 + status endpoint / webhook</td></tr>
<tr><td>What happens if this runs twice?</td><td>Money moves, a seat is double-sold, a message is sent twice</td><td>Idempotency keys, unique constraints, dedupe by event id</td></tr>
<tr><td>Does one action touch several databases/services?</td><td>Yes</td><td>Outbox/CDC for events; saga with compensations for the business flow</td></tr>
<tr><td>Must exactly one thing do it?</td><td>Yes (cron, partition owner, ID ranges)</td><td>Leader election with lease + fencing token</td></tr>
<tr><td>Is an exact answer required?</td><td>No (dashboards, trending, uniques)</td><td>HLL, Count-Min + heap, Bloom filter, sampling</td></tr>
<tr><td>Are the bytes big (&gt; 1 MB)?</td><td>Yes</td><td>Presigned direct-to-storage, multipart, CDN in front</td></tr>
<tr><td>What happens at 10x load?</td><td>Something queues unbounded or melts</td><td>Rate limits at the edge, bounded queues, load shedding by priority</td></tr>
<tr><td>What's the RPO/RTO and blast-radius budget?</td><td>RPO seconds, RTO minutes / \"one bad deploy may hit ≤ 5% of users\"</td><td>Active-passive multi-region / cells (and only then active-active)</td></tr>
</table>
<blockquote>⚠️ Production tip: every pattern you add is a moving part someone pages on. A strong answer names the pattern <em>and</em> the simpler thing it beat: \"one Postgres with read replicas carries us to ~50k reads/s; we shard only when writes pass ~10k/s\".</blockquote>`,
        he: `<table>
<tr><th>תשאל</th><th>אם התשובה היא…</th><th>תשלוף</th></tr>
<tr><td>מה יחס ה-read:write?</td><td>10:1 ומעלה ומידע ישן זה בסדר</td><td>Cache-aside, ‏read replicas, ‏views מחושבים מראש, ‏fan-out on write</td></tr>
<tr><td>הגישה מוטה? מי ה-key הכי גדול?</td><td>ה-key המוביל מקבל יותר מ-1% מהתנועה</td><td>פיצול hot key, ‏cache מקומי, ‏fan-out היברידי, ‏shard ייעודי</td></tr>
<tr><td>המשתמש יכול לחכות לתוצאה?</td><td>כן (שניות עד דקות)</td><td>Queue-based load leveling, ‏202 עם endpoint של סטטוס או webhook</td></tr>
<tr><td>מה קורה אם זה רץ פעמיים?</td><td>כסף זז, מושב נמכר פעמיים, הודעה נשלחת פעמיים</td><td>Idempotency keys, ‏unique constraints, ‏dedupe לפי event id</td></tr>
<tr><td>פעולה אחת נוגעת בכמה DBs או שירותים?</td><td>כן</td><td>Outbox/CDC בשביל ה-events; ‏saga עם פעולות מפצות בשביל התהליך העסקי</td></tr>
<tr><td>בדיוק דבר אחד צריך לעשות את זה?</td><td>כן (cron, בעלים של partition, טווחי IDs)</td><td>Leader election עם lease ו-fencing token</td></tr>
<tr><td>צריך תשובה מדויקת?</td><td>לא (dashboards, ‏trending, ייחודיים)</td><td>HLL, ‏Count-Min עם heap, ‏Bloom filter, ‏sampling</td></tr>
<tr><td>הבייטים גדולים (מעל 1MB)?</td><td>כן</td><td>Presigned ישירות לאחסון, ‏multipart, ‏CDN מלפנים</td></tr>
<tr><td>מה קורה בעומס פי 10?</td><td>משהו נכנס לתור בלי גבול או נמס</td><td>Rate limits ב-edge, תורים חסומים, ‏load shedding לפי עדיפות</td></tr>
<tr><td>מה ה-RPO/RTO ומה תקציב ה-blast radius?</td><td>RPO של שניות, ‏RTO של דקות / \"deploy גרוע יפגע לכל היותר ב-5% מהמשתמשים\"</td><td>Multi-region ‏active-passive / ‏cells (ורק אחר כך active-active)</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: כל pattern שאתה מוסיף הוא עוד חלק זז שמישהו יקבל עליו page. תשובה חזקה נותנת שם ל-pattern <em>וגם</em> לפתרון הפשוט יותר שהוא ניצח: \"Postgres אחד עם read replicas מחזיק אותנו עד בערך 50k קריאות בשנייה; עושים sharding רק כשהכתיבות עוברות בערך 10k בשנייה\".</blockquote>`
      }
    }
  ],
  diagram: `             requirement / number                 pattern
  read:write 100:1, staleness ok     ->  cache-aside + read replicas
  power-law followers                ->  hybrid fan-out
  "never charge twice"               ->  idempotency key + unique constraint
  DB write + publish event           ->  transactional outbox / CDC
  spans 3 services                   ->  saga (+ compensations)
  10x bursts, slow downstream        ->  queue-based load leveling
  "how many unique / top-K"          ->  HyperLogLog / Count-Min + heap
  big files                          ->  presigned direct-to-storage
  overload                           ->  rate limit + bounded queues + shed
  blast radius <= 1/N                ->  cells`,
  handsOn: [
    { cmd: "redis-cli PFADD uv:today u1 u2 u3 u2 && redis-cli PFCOUNT uv:today && redis-cli MEMORY USAGE uv:today",
      what: { en: "HyperLogLog: count distinct users; the key stays tiny even with millions of members (dense encoding is ~12 KB).", he: "HyperLogLog: ספירת משתמשים ייחודיים; ה-key נשאר קטן גם עם מיליוני איברים (בקידוד dense זה בערך 12KB)." } },
    { cmd: "aws s3 presign s3://my-bucket/uploads/test.bin --expires-in 300",
      what: { en: "Generate a presigned URL (GET by default with the CLI) and look at the X-Amz-Expires and signature query parameters.", he: "ליצור presigned URL ‏(ב-CLI ברירת המחדל היא GET) ולהסתכל על הפרמטרים X-Amz-Expires והחתימה." } },
    { cmd: "psql -c \"CREATE TABLE idem(key text PRIMARY KEY, req_hash text, response jsonb, created_at timestamptz default now()); INSERT INTO idem(key, req_hash) VALUES ('k1','h1') ON CONFLICT (key) DO NOTHING RETURNING key;\"",
      what: { en: "The core of an idempotency store: the second INSERT with the same key returns no row, so you replay the stored response instead of re-executing.", he: "הלב של store ל-idempotency: ה-INSERT השני עם אותו key לא מחזיר שורה, אז מחזירים את התשובה השמורה במקום להריץ שוב." } },
    { cmd: "python3 -c \"import geohash2 as g; print(g.encode(32.0853, 34.7818, precision=6))\"",
      what: { en: "Geohash for Tel Aviv at precision 6 (pip install geohash2). Nearby points share the prefix — that's what you index.", he: "Geohash של תל אביב ברמת דיוק 6 ‏(pip install geohash2). נקודות קרובות חולקות את ה-prefix — את זה מאנדקסים." } }
  ],
  mnemonic: {
    en: "Trigger → Pattern → Price. If you can't name the price, you haven't chosen the pattern — you've just said its name.",
    he: "טריגר ← Pattern ← מחיר. אם אתה לא יכול להגיד את המחיר, לא בחרת pattern — רק אמרת את השם שלו."
  },
  pitfalls: [
    { en: "Pattern stuffing: drawing Kafka, CQRS, sagas and cells for a 1,000 QPS CRUD app. Interviewers read it as not understanding cost. Start simple, add a pattern only when a number forces it.",
      he: "דחיסת patterns: לצייר Kafka, ‏CQRS, ‏sagas ו-cells לאפליקציית CRUD של 1,000 QPS. מראיינים קוראים את זה כחוסר הבנה של עלות. תתחיל פשוט, ותוסיף pattern רק כשמספר מכריח אותך." },
    { en: "Choosing a shard key by what's convenient to write (timestamp, auto-increment id) instead of what the hottest read filters on — every query becomes scatter-gather.",
      he: "לבחור shard key לפי מה שנוח לכתוב (timestamp, ‏id עולה) במקום לפי מה שה-read הכי חם מסנן עליו — כל query הופך ל-scatter-gather." },
    { en: "Saying \"exactly-once\" about a queue. Delivery is at-least-once; effects are made once by idempotent consumers. Interviewers probe this.",
      he: "להגיד \"exactly-once\" על תור. ה-delivery הוא at-least-once; האפקט קורה פעם אחת בזכות consumers שהם idempotent. מראיינים בודקים את זה." },
    { en: "Leader election without fencing: a GC-paused leader wakes up after its lease expired and still writes. The lease alone doesn't protect storage.",
      he: "Leader election בלי fencing: ‏leader שנתקע ב-GC מתעורר אחרי שה-lease שלו פג ועדיין כותב. ה-lease לבד לא מגן על האחסון." }
  ],
  interview: [
    { q: { en: "Design a timeline for 300M users where some accounts have 100M followers. How do you deliver posts?", he: "תתכנן timeline ל-300M משתמשים שחלק מהחשבונות שלהם עם 100M followers. איך אתה מעביר פוסטים?" },
      a: { en: "Hybrid fan-out. Normal accounts: fan-out on write into per-user inbox lists in Redis (cap ~800 ids each) via a queue of fan-out workers, so reads are one list fetch. Accounts above a threshold (~100k followers) are not pushed; at read time I merge the inbox with recent posts of the celebrities you follow (a small, cached set). Skip inactive users (no login in 30 days) during push and rebuild their inbox lazily. Price: two code paths and a merge step, but it caps write amplification and keeps p99 read latency flat.",
           he: "Fan-out היברידי. חשבונות רגילים: ‏fan-out on write לרשימות inbox לכל משתמש ב-Redis (עד בערך 800 ids לכל אחד) דרך תור של fan-out workers, כך שקריאה היא שליפה של רשימה אחת. חשבונות מעל סף (בערך 100k followers) לא נדחפים; בזמן הקריאה אני ממזג את ה-inbox עם הפוסטים האחרונים של הסלבריטאים שאתה עוקב אחריהם (קבוצה קטנה שנמצאת ב-cache). משתמשים לא פעילים (בלי login ב-30 יום) מדלגים עליהם ב-push ובונים להם inbox מחדש בעצלות. מחיר: שני מסלולי קוד ושלב מיזוג, אבל זה מגביל את ה-write amplification ושומר על p99 קריאה שטוח." } },
    { q: { en: "Your order service writes to Postgres and publishes OrderCreated to Kafka. Sometimes the event is missing. Why, and how do you fix it?", he: "שירות ההזמנות שלך כותב ל-Postgres ומפרסם OrderCreated ל-Kafka. לפעמים ה-event חסר. למה, ואיך מתקנים?" },
      a: { en: "Dual write: the process can crash (or Kafka can time out) after COMMIT and before publish, or publish succeeds and the transaction rolls back. Fix with a transactional outbox: insert the event row in the same transaction, and have a relay or Debezium (reading the WAL) publish it. Delivery becomes at-least-once, so consumers dedupe by event id. Monitor relay lag and replication slot size.",
           he: "Dual write: התהליך יכול ליפול (או ש-Kafka יעשה timeout) אחרי ה-COMMIT ולפני הפרסום, או שהפרסום מצליח וה-transaction עושה rollback. התיקון: transactional outbox — מכניסים את שורת ה-event באותה transaction, ו-relay או Debezium (שקורא את ה-WAL) מפרסם אותה. ה-delivery נהיה at-least-once, אז ה-consumers עושים dedupe לפי event id. מנטרים את ה-lag של ה-relay ואת הגודל של ה-replication slot." } },
    { q: { en: "When would you choose active-passive over active-active multi-region?", he: "מתי תבחר multi-region של active-passive על פני active-active?" },
      a: { en: "When the data needs a single source of truth (balances, inventory, unique usernames) and the business accepts an RPO of seconds and an RTO of minutes. Active-active only pays off if writes must be local in every region and you can resolve conflicts (per-key home region, CRDTs) — it roughly doubles cost and complexity. Many systems go active-active for stateless reads and keep writes active-passive per partition.",
           he: "כשהנתונים צריכים מקור אמת יחיד (יתרות, מלאי, שמות משתמש ייחודיים) והעסק מקבל RPO של שניות ו-RTO של דקות. Active-active משתלם רק אם הכתיבות חייבות להיות מקומיות בכל אזור ואתה יודע לפתור קונפליקטים (home region לכל key, ‏CRDTs) — זה בערך מכפיל את העלות והמורכבות. הרבה מערכות עושות active-active לקריאות stateless ומשאירות את הכתיבות active-passive לכל partition." } }
  ],
  quiz: [
    { q: { en: "A counter for one viral video gets 200k increments/s and melts its Redis shard. Best first fix?", he: "מונה של סרטון ויראלי אחד מקבל 200k הגדלות בשנייה ומפיל את ה-shard שלו ב-Redis. מה התיקון הראשון הכי טוב?" },
      options: [
        { en: "Move the counter to Postgres with SERIALIZABLE isolation", he: "להעביר את המונה ל-Postgres עם isolation של SERIALIZABLE" },
        { en: "Split the key into N sub-keys, write to a random one, sum on read", he: "לפצל את ה-key ל-N תתי-keys, לכתוב לאחד אקראי ולסכום בקריאה" },
        { en: "Switch from consistent hashing to hash % N", he: "לעבור מ-consistent hashing ל-hash % N" },
        { en: "Add a read replica to the shard", he: "להוסיף read replica ל-shard" }
      ],
      answer: 1,
      explain: { en: "It's a hot write key. Splitting spreads writes over N shards at the cost of N reads (or a periodic rollup). Replicas don't help writes; rehashing still sends one key to one node.", he: "זה hot key של כתיבה. פיצול מפזר את הכתיבות על N shard-ים במחיר של N קריאות (או rollup תקופתי). Replicas לא עוזרים לכתיבות; שינוי ה-hashing עדיין שולח key אחד ל-node אחד." } },
    { q: { en: "You need daily unique visitors per page for 50M pages, approximate is fine. What fits?", he: "צריך מבקרים ייחודיים יומיים לכל עמוד, ל-50M עמודים, ומספיק בקירוב. מה מתאים?" },
      options: [
        { en: "A SET of user ids per page in Redis", he: "SET של user ids לכל עמוד ב-Redis" },
        { en: "Count-Min Sketch per page", he: "Count-Min Sketch לכל עמוד" },
        { en: "HyperLogLog per page per day", he: "HyperLogLog לכל עמוד לכל יום" },
        { en: "A Bloom filter per page", he: "Bloom filter לכל עמוד" }
      ],
      answer: 2,
      explain: { en: "HLL counts distinct elements in ≤ 12 KB with ~0.81% error and merges across days. A SET grows with every user; Count-Min estimates frequency, not cardinality; a Bloom filter answers membership.", he: "HLL סופר איברים ייחודיים בפחות מ-12KB עם שגיאה של כ-0.81%, ומתמזג בין ימים. SET גדל עם כל משתמש; ‏Count-Min מעריך תדירות ולא cardinality; ‏Bloom filter עונה על שייכות." } },
    { q: { en: "Booking a trip reserves a flight (service A), a hotel (service B) and charges a card (service C), each with its own DB. Which pattern coordinates it?", he: "הזמנת טיול שומרת טיסה (שירות A), מלון (שירות B) ומחייבת כרטיס (שירות C), לכל אחד DB משלו. איזה pattern מתאם את זה?" },
      options: [
        { en: "A distributed 2PC transaction across the three databases", he: "Transaction מבוזרת של 2PC על שלושת ה-DBs" },
        { en: "A saga with compensating actions (cancel flight, release hotel, refund)", he: "Saga עם פעולות מפצות (ביטול טיסה, שחרור מלון, החזר כספי)" },
        { en: "Cache-aside in front of each service", he: "Cache-aside לפני כל שירות" },
        { en: "Consistent hashing of the booking id", he: "Consistent hashing של ה-booking id" }
      ],
      answer: 1,
      explain: { en: "Independent services and third parties rarely support 2PC, and it blocks on coordinator failure. A saga runs local steps and compensates on failure, accepting visible intermediate states.", he: "שירותים עצמאיים וצדדים שלישיים כמעט אף פעם לא תומכים ב-2PC, והוא נתקע כשהמתאם נופל. Saga מריצה צעדים מקומיים ומפצה בכישלון, ומקבלת על עצמה מצבי ביניים גלויים." } },
    { q: { en: "Why do presigned uploads matter for a video platform?", he: "למה presigned uploads חשובים לפלטפורמת וידאו?" },
      options: [
        { en: "They encrypt the video end to end", he: "הם מצפינים את הווידאו מקצה לקצה" },
        { en: "They make uploads idempotent automatically", he: "הם הופכים העלאות ל-idempotent אוטומטית" },
        { en: "Clients send bytes straight to object storage, so API servers don't proxy gigabytes", he: "הלקוחות שולחים את הבייטים ישר ל-object storage, כך ששרתי ה-API לא מעבירים דרכם ג'יגה-בייטים" },
        { en: "They remove the need for a CDN", he: "הם מבטלים את הצורך ב-CDN" }
      ],
      answer: 2,
      explain: { en: "The API only signs a short-lived, single-key URL; storage absorbs the bandwidth. You still validate after upload and use a CDN for playback.", he: "ה-API רק חותם על URL קצר-מועד ל-key אחד; האחסון סופג את רוחב הפס. עדיין בודקים אחרי ההעלאה, ומשתמשים ב-CDN לצפייה." } }
  ],
  playground: "hashring",
  related: ["arch-caching", "caching-deep", "db-sharding", "db-partitioning", "pr-idempotency", "data-cdc-debezium", "pr-rate-limiters", "staff-overload-metastable", "staff-cells-blast-radius", "staff-multi-region-data", "staff-exactly-once", "pr-cloud-patterns", "arch-queues"]
});

// ---------------------------------------------------------------------------
// 2. Windows Server & Active Directory for Infra Engineers
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "windows-active-directory",
  track: "foundations",
  order: 50,
  icon: "🪟",
  level: 2,
  minutes: 18,
  title: { en: "Windows Server & Active Directory for Infra Engineers", he: "Windows Server ו-Active Directory למהנדסי תשתיות" },
  tldr: {
    en: "Active Directory is a replicated LDAP directory + Kerberos KDC + DNS that holds every user, computer and policy in a Windows shop. If DNS, time or replication break, authentication breaks — and whoever owns a domain controller owns the company.",
    he: "Active Directory הוא directory של LDAP משוכפל + ‏KDC של Kerberos + ‏DNS, שמחזיק כל משתמש, מחשב ו-policy בארגון Windows. אם ה-DNS, השעון או ה-replication נשברים, ה-authentication נשבר — ומי שמחזיק domain controller מחזיק את כל החברה."
  },
  analogy: {
    en: "AD is a country's passport office. The forest is the country (the real border), domains are states, OUs are the folders on the clerk's desk. Domain controllers are the offices — every office has a full copy of the citizen registry and can issue papers. Kerberos is the passport + visa system: you prove yourself once at the office and get a passport (TGT), then show it to get a visa (service ticket) for each building. Visas carry a timestamp, so if your watch is 6 minutes off, every guard turns you away.",
    he: "AD זה משרד הפנים של מדינה. ה-forest הוא המדינה (הגבול האמיתי), ה-domains הם מחוזות, ה-OUs הם התיקיות על השולחן של הפקיד. ה-domain controllers הם הלשכות — בכל לשכה יש עותק מלא של מרשם האוכלוסין והיא יכולה להנפיק מסמכים. Kerberos הוא מערכת הדרכון והוויזה: אתה מוכיח את עצמך פעם אחת בלשכה ומקבל דרכון (TGT), ואז מציג אותו כדי לקבל ויזה (service ticket) לכל בניין. על הוויזות יש חותמת זמן, אז אם השעון שלך זז ב-6 דקות, כל שומר מחזיר אותך."
  },
  sections: [
    {
      h: { en: "The building blocks: forest, domain, OU, DC, FSMO, DNS", he: "אבני הבניין: ‏forest, ‏domain, ‏OU, ‏DC, ‏FSMO, ‏DNS" },
      body: {
        en: `<ul>
<li><strong>Forest</strong> — the security boundary. One schema, one global catalog, transitive trust between its domains. A compromised domain admin in any domain can usually reach the whole forest.</li>
<li><strong>Domain</strong> (<code>corp.example.com</code>) — an administrative and replication partition with its own password policy defaults and Domain Admins group.</li>
<li><strong>OU</strong> (Organizational Unit) — a container for delegating admin rights and linking Group Policy. Not a security principal: you can't grant permissions <em>to</em> an OU.</li>
<li><strong>Domain Controller (DC)</strong> — a Windows Server running AD DS. Multi-master: any DC accepts writes and replicates. Run at least 2 per domain, per site that needs local logons.</li>
</ul>
<p><strong>FSMO roles</strong> — the few operations that must be single-master:</p>
<table>
<tr><th>Role</th><th>Scope</th><th>What breaks if it's down</th></tr>
<tr><td>Schema Master</td><td>Forest</td><td>Schema extensions (Exchange, Entra Connect prep) — rare</td></tr>
<tr><td>Domain Naming Master</td><td>Forest</td><td>Adding/removing domains — rare</td></tr>
<tr><td>PDC Emulator</td><td>Domain</td><td>Domain <strong>time source</strong>, password-change urgency, account lockout processing, default GPO editing target — you notice within minutes</td></tr>
<tr><td>RID Master</td><td>Domain</td><td>DCs hand out SIDs from 500-RID pools; when a DC's pool runs out, new users/computers fail</td></tr>
<tr><td>Infrastructure Master</td><td>Domain</td><td>Cross-domain group membership references go stale</td></tr>
</table>
<p><strong>DNS is AD's nervous system.</strong> Clients find DCs through SRV records like <code>_ldap._tcp.dc._msdcs.corp.example.com</code> and <code>_kerberos._tcp.corp.example.com</code>, stored in AD-integrated zones. Every domain member must use DC (or DC-forwarding) DNS servers — pointing a member at <code>8.8.8.8</code> is the #1 cause of \"domain not found\". Forward external names with forwarders or conditional forwarders.</p>
<pre>PS&gt; netdom query fsmo
Schema master               DC01.corp.example.com
Domain naming master        DC01.corp.example.com
PDC                         DC01.corp.example.com
RID pool manager            DC02.corp.example.com
Infrastructure master       DC02.corp.example.com
The command completed successfully.

PS&gt; nltest /dsgetdc:corp.example.com
           DC: \\\\DC02.corp.example.com
      Address: \\\\10.0.1.11
     Dom Name: corp.example.com
  Forest Name: corp.example.com
 Dc Site Name: TLV
Our Site Name: TLV
        Flags: GC DS LDAP KDC TIMESERV WRITABLE DNS_DC DNS_DOMAIN DNS_FOREST CLOSE_SITE FULL_SECRET WS DS_8 DS_9 DS_10</pre>
<p>Ports to open between members and DCs: DNS 53, Kerberos 88 (TCP/UDP), RPC endpoint mapper 135 + dynamic 49152-65535, LDAP 389, SMB 445 (SYSVOL/GPO), kpasswd 464, LDAPS 636, Global Catalog 3268/3269, NTP 123/UDP.</p>`,
        he: `<ul>
<li><strong>Forest</strong> — גבול האבטחה. Schema אחד, ‏global catalog אחד, ‏trust טרנזיטיבי בין ה-domains שלו. Domain admin שנפרץ בכל domain בדרך כלל יכול להגיע לכל ה-forest.</li>
<li><strong>Domain</strong> ‏(<code>corp.example.com</code>) — מחיצה אדמיניסטרטיבית ושל replication, עם ברירות מחדל משלה למדיניות סיסמאות וקבוצת Domain Admins משלה.</li>
<li><strong>OU</strong> ‏(Organizational Unit) — קונטיינר להאצלת הרשאות admin ולקישור Group Policy. הוא לא security principal: אי אפשר לתת הרשאות <em>ל</em>-OU.</li>
<li><strong>Domain Controller ‏(DC)</strong> — Windows Server שמריץ AD DS. ‏Multi-master: כל DC מקבל כתיבות ומשכפל. תריץ לפחות 2 לכל domain, בכל site שצריך בו login מקומי.</li>
</ul>
<p><strong>תפקידי FSMO</strong> — הפעולות הבודדות שחייבות להיות single-master:</p>
<table>
<tr><th>תפקיד</th><th>Scope</th><th>מה נשבר אם הוא למטה</th></tr>
<tr><td>Schema Master</td><td>Forest</td><td>הרחבות schema ‏(Exchange, הכנה ל-Entra Connect) — נדיר</td></tr>
<tr><td>Domain Naming Master</td><td>Forest</td><td>הוספה או הסרה של domains — נדיר</td></tr>
<tr><td>PDC Emulator</td><td>Domain</td><td><strong>מקור הזמן</strong> של ה-domain, דחיפות בשינויי סיסמה, עיבוד account lockout, יעד ברירת המחדל לעריכת GPO — מרגישים את זה תוך דקות</td></tr>
<tr><td>RID Master</td><td>Domain</td><td>ה-DCs מחלקים SIDs מתוך pools של 500 RIDs; כשה-pool של DC נגמר, יצירת משתמשים ומחשבים חדשים נכשלת</td></tr>
<tr><td>Infrastructure Master</td><td>Domain</td><td>הפניות לחברות בקבוצות בין domains נהיות לא מעודכנות</td></tr>
</table>
<p><strong>DNS הוא מערכת העצבים של AD.</strong> לקוחות מוצאים DCs דרך רשומות SRV כמו <code>_ldap._tcp.dc._msdcs.corp.example.com</code> ו-<code>_kerberos._tcp.corp.example.com</code>, שנשמרות ב-zones שמשולבים ב-AD. כל מחשב ב-domain חייב להשתמש בשרתי DNS של ה-DCs (או כאלה שמעבירים אליהם) — להפנות מחשב ל-<code>8.8.8.8</code> זו הסיבה מספר 1 ל-\"domain not found\". שמות חיצוניים מעבירים עם forwarders או conditional forwarders.</p>
<pre>PS&gt; netdom query fsmo
Schema master               DC01.corp.example.com
Domain naming master        DC01.corp.example.com
PDC                         DC01.corp.example.com
RID pool manager            DC02.corp.example.com
Infrastructure master       DC02.corp.example.com
The command completed successfully.

PS&gt; nltest /dsgetdc:corp.example.com
           DC: \\\\DC02.corp.example.com
      Address: \\\\10.0.1.11
     Dom Name: corp.example.com
  Forest Name: corp.example.com
 Dc Site Name: TLV
Our Site Name: TLV
        Flags: GC DS LDAP KDC TIMESERV WRITABLE DNS_DC DNS_DOMAIN DNS_FOREST CLOSE_SITE FULL_SECRET WS DS_8 DS_9 DS_10</pre>
<p>פורטים שצריך לפתוח בין המחשבים ל-DCs: ‏DNS 53, ‏Kerberos 88 ‏(TCP/UDP), ‏RPC endpoint mapper 135 ועוד הטווח הדינמי 49152-65535, ‏LDAP 389, ‏SMB 445 ‏(SYSVOL/GPO), ‏kpasswd 464, ‏LDAPS 636, ‏Global Catalog 3268/3269, ‏NTP 123/UDP.</p>`
      }
    },
    {
      h: { en: "Authentication: Kerberos vs NTLM, LDAP vs LDAPS", he: "Authentication: ‏Kerberos מול NTLM, ‏LDAP מול LDAPS" },
      body: {
        en: `<p><strong>Kerberos</strong> (default since Windows 2000):</p>
<ol>
<li><strong>AS-REQ/AS-REP</strong>: at logon the client proves it knows the password (pre-auth: a timestamp encrypted with a key derived from it) and gets a <strong>TGT</strong> encrypted with the <code>krbtgt</code> account's key. Default lifetime 10 h, renewable for 7 days.</li>
<li><strong>TGS-REQ/TGS-REP</strong>: to reach <code>HTTP/intranet.corp.example.com</code> the client shows the TGT and gets a <strong>service ticket</strong> encrypted with the service account's key (found via its SPN).</li>
<li><strong>AP-REQ</strong>: the client hands the ticket to the service, which decrypts it locally — no DC round-trip, mutual authentication possible.</li>
</ol>
<p>Every step carries timestamps; the default maximum tolerated clock skew is <strong>5 minutes</strong>. Clock drift = <code>KRB_AP_ERR_SKEW</code> = mass logon failures. Kerberos also needs <em>names</em>: connect by IP address and Windows falls back to NTLM.</p>
<p><strong>NTLM</strong> is a challenge-response protocol: the server asks the DC to verify the response (pass-through). No mutual authentication, the NT hash is a password equivalent (pass-the-hash), and it is relayable (NTLM relay to LDAP/SMB/AD CS). Microsoft declared all NTLM versions <strong>deprecated in 2024</strong>; NTLMv1 is removed in Windows 11 24H2 / Windows Server 2025, and features like IAKerb and a local KDC are meant to cover NTLM's remaining fallbacks. Start by auditing: enable \"Network security: Restrict NTLM: Audit\" policies and watch event 8004 on DCs to see who still uses it.</p>
<p><strong>LDAP vs LDAPS</strong>: LDAP on 389 with a simple bind sends the password in clear text. Use LDAPS (636, TLS with a cert on each DC) or StartTLS, and enforce LDAP signing + channel binding (Windows Server 2025 requires signing by default on new deployments). For apps: bind with a dedicated read-only account and query the Global Catalog (3268/3269) for forest-wide searches.</p>
<pre>$ ldapsearch -H ldaps://dc01.corp.example.com -D "svc-ldap@corp.example.com" -W \\
    -b "DC=corp,DC=example,DC=com" "(sAMAccountName=alice)" memberOf
dn: CN=Alice Levi,OU=Engineering,OU=Users,DC=corp,DC=example,DC=com
memberOf: CN=sg-k8s-admins,OU=Groups,DC=corp,DC=example,DC=com

PS&gt; klist
Cached Tickets: (2)
#0&gt;  Client: alice @ CORP.EXAMPLE.COM
     Server: krbtgt/CORP.EXAMPLE.COM @ CORP.EXAMPLE.COM
     KerbTicket Encryption Type: AES-256-CTS-HMAC-SHA1-96
     Start Time: 11/14/2026 8:01:12 (local)
     End Time:   11/14/2026 18:01:12 (local)
     Renew Time: 11/21/2026 8:01:12 (local)</pre>`,
        he: `<p><strong>Kerberos</strong> (ברירת המחדל מאז Windows 2000):</p>
<ol>
<li><strong>AS-REQ/AS-REP</strong>: ב-logon הלקוח מוכיח שהוא יודע את הסיסמה (pre-auth: חותמת זמן מוצפנת במפתח שנגזר ממנה) ומקבל <strong>TGT</strong> שמוצפן במפתח של חשבון <code>krbtgt</code>. תוקף ברירת מחדל 10 שעות, עם חידוש עד 7 ימים.</li>
<li><strong>TGS-REQ/TGS-REP</strong>: כדי להגיע ל-<code>HTTP/intranet.corp.example.com</code> הלקוח מציג את ה-TGT ומקבל <strong>service ticket</strong> שמוצפן במפתח של חשבון השירות (שנמצא לפי ה-SPN שלו).</li>
<li><strong>AP-REQ</strong>: הלקוח מעביר את ה-ticket לשירות, שמפענח אותו מקומית — בלי סבב מול ה-DC, ואפשר mutual authentication.</li>
</ol>
<p>בכל שלב יש חותמות זמן; ה-clock skew המקסימלי שנסבל כברירת מחדל הוא <strong>5 דקות</strong>. סטייה בשעון = <code>KRB_AP_ERR_SKEW</code> = כשלי login המוניים. Kerberos גם צריך <em>שמות</em>: אם מתחברים לפי כתובת IP, ‏Windows נופל חזרה ל-NTLM.</p>
<p><strong>NTLM</strong> הוא פרוטוקול challenge-response: השרת מבקש מה-DC לאמת את התשובה (pass-through). אין mutual authentication, ה-NT hash שקול לסיסמה (pass-the-hash), ואפשר לעשות לו relay ‏(NTLM relay ל-LDAP/SMB/AD CS). מיקרוסופט הכריזה על כל גרסאות NTLM כ-<strong>deprecated ב-2024</strong>; ‏NTLMv1 הוסר ב-Windows 11 24H2 וב-Windows Server 2025, ופיצ'רים כמו IAKerb ו-local KDC אמורים לכסות את ה-fallbacks שנשארו ל-NTLM. תתחיל ב-audit: תפעיל את ה-policies של \"Network security: Restrict NTLM: Audit\" ותעקוב אחרי event 8004 ב-DCs כדי לראות מי עוד משתמש בו.</p>
<p><strong>LDAP מול LDAPS</strong>: ‏LDAP על 389 עם simple bind שולח את הסיסמה בטקסט גלוי. תשתמש ב-LDAPS ‏(636, ‏TLS עם תעודה על כל DC) או StartTLS, ותאכוף LDAP signing ו-channel binding ‏(Windows Server 2025 דורש signing כברירת מחדל בהתקנות חדשות). לאפליקציות: bind עם חשבון read-only ייעודי, וחיפושים על כל ה-forest מול ה-Global Catalog ‏(3268/3269).</p>
<pre>$ ldapsearch -H ldaps://dc01.corp.example.com -D "svc-ldap@corp.example.com" -W \\
    -b "DC=corp,DC=example,DC=com" "(sAMAccountName=alice)" memberOf
dn: CN=Alice Levi,OU=Engineering,OU=Users,DC=corp,DC=example,DC=com
memberOf: CN=sg-k8s-admins,OU=Groups,DC=corp,DC=example,DC=com

PS&gt; klist
Cached Tickets: (2)
#0&gt;  Client: alice @ CORP.EXAMPLE.COM
     Server: krbtgt/CORP.EXAMPLE.COM @ CORP.EXAMPLE.COM
     KerbTicket Encryption Type: AES-256-CTS-HMAC-SHA1-96
     Start Time: 11/14/2026 8:01:12 (local)
     End Time:   11/14/2026 18:01:12 (local)
     Renew Time: 11/21/2026 8:01:12 (local)</pre>`
      }
    },
    {
      h: { en: "Group Policy, service accounts & gMSA, replication & sites", he: "Group Policy, חשבונות שירות ו-gMSA, ‏replication ו-sites" },
      body: {
        en: `<p><strong>Group Policy</strong> pushes settings (security baselines, drive maps, firewall, LAPS) to computers and users. A GPO = an object in AD + files in <code>SYSVOL</code>. Processing order <strong>LSDOU</strong>: Local → Site → Domain → OU (nested OUs last); the last one applied wins unless a link is <em>Enforced</em>; <em>Block Inheritance</em> on an OU stops parent links (except enforced ones). Members refresh every 90 min ± up to 30 min random offset; DCs every 5 min. Debug with <code>gpresult /h report.html</code> and <code>gpupdate /force</code>.</p>
<p><strong>Service accounts.</strong> The classic anti-pattern: a user account <code>svc-sql</code> with a password that never expires, set in 2014, in Domain Admins. Use <strong>gMSA</strong> (group Managed Service Account): AD generates a 240-byte random password, rotates it every 30 days by default, and only computers in <code>PrincipalsAllowedToRetrieveManagedPassword</code> can fetch it. Works for services, scheduled tasks, IIS app pools — and Windows containers on AKS.</p>
<pre>PS&gt; Add-KdsRootKey -EffectiveImmediately          # once per forest; wait ~10 h for replication before use
PS&gt; New-ADServiceAccount -Name gmsa-web -DNSHostName gmsa-web.corp.example.com \`
      -PrincipalsAllowedToRetrieveManagedPassword "sg-web-servers"
PS&gt; Install-ADServiceAccount gmsa-web             # on each web server
PS&gt; Test-ADServiceAccount gmsa-web
True
# configure the service to log on as CORP\\gmsa-web$ with an empty password</pre>
<p><strong>Replication &amp; sites.</strong> AD is multi-master; each change gets an <strong>USN</strong> and replicates per attribute. <em>Sites</em> map subnets to physical locations so clients find a nearby DC and replication respects WAN links. Intra-site replication is change-notified (~15 s); inter-site follows a schedule (default every 180 min, minimum 15). The KCC builds the topology. Deleted objects linger as tombstones for 180 days — a DC offline longer than that must not come back (lingering objects). SYSVOL replicates with DFSR. Never restore a DC from a VM snapshot without VM-GenerationID support: you risk <strong>USN rollback</strong>.</p>
<pre>PS&gt; repadmin /replsummary
Source DSA          largest delta    fails/total %   error
 DC01                     08m:12s    0 /  10    0
 DC02                     07m:55s    0 /  10    0
 DC03-LON              02h:41m:03s    5 /   5  100  (1722) The RPC server is unavailable.</pre>`,
        he: `<p><strong>Group Policy</strong> דוחף הגדרות (security baselines, מיפוי כוננים, firewall, ‏LAPS) למחשבים ולמשתמשים. GPO = אובייקט ב-AD + קבצים ב-<code>SYSVOL</code>. סדר העיבוד <strong>LSDOU</strong>: ‏Local ← Site ← Domain ← OU ‏(OUs מקוננים אחרונים); האחרון שהוחל מנצח, אלא אם link מסומן <em>Enforced</em>; ‏<em>Block Inheritance</em> על OU עוצר links מההורים (חוץ מ-enforced). מחשבים מתרעננים כל 90 דקות ועוד היסט אקראי של עד 30 דקות; ‏DCs כל 5 דקות. דיבאג עם <code>gpresult /h report.html</code> ו-<code>gpupdate /force</code>.</p>
<p><strong>חשבונות שירות.</strong> ה-anti-pattern הקלאסי: חשבון משתמש <code>svc-sql</code> עם סיסמה שלא פגה אף פעם, שהוגדרה ב-2014, בתוך Domain Admins. תשתמש ב-<strong>gMSA</strong> ‏(group Managed Service Account): ה-AD מייצר סיסמה אקראית של 240 בייטים, מחליף אותה כל 30 יום כברירת מחדל, ורק מחשבים שב-<code>PrincipalsAllowedToRetrieveManagedPassword</code> יכולים לשלוף אותה. עובד לשירותים, ‏scheduled tasks, ‏app pools של IIS — וגם ל-Windows containers ב-AKS.</p>
<pre>PS&gt; Add-KdsRootKey -EffectiveImmediately          # once per forest; wait ~10 h for replication before use
PS&gt; New-ADServiceAccount -Name gmsa-web -DNSHostName gmsa-web.corp.example.com \`
      -PrincipalsAllowedToRetrieveManagedPassword "sg-web-servers"
PS&gt; Install-ADServiceAccount gmsa-web             # on each web server
PS&gt; Test-ADServiceAccount gmsa-web
True
# configure the service to log on as CORP\\gmsa-web$ with an empty password</pre>
<p><strong>Replication ו-sites.</strong> ‏AD הוא multi-master; כל שינוי מקבל <strong>USN</strong> ומשוכפל ברמת attribute. ‏<em>Sites</em> ממפים subnets למיקומים פיזיים, כדי שלקוחות ימצאו DC קרוב וה-replication יכבד את קווי ה-WAN. Replication בתוך site עובד עם change notification ‏(בערך 15 שניות); בין sites לפי לוח זמנים (ברירת מחדל כל 180 דקות, מינימום 15). ה-KCC בונה את הטופולוגיה. אובייקטים שנמחקו נשארים כ-tombstones ל-180 יום — DC שהיה offline יותר מזה אסור שיחזור (lingering objects). ‏SYSVOL משוכפל עם DFSR. אף פעם אל תשחזר DC מ-snapshot של VM בלי תמיכה ב-VM-GenerationID: אתה מסתכן ב-<strong>USN rollback</strong>.</p>
<pre>PS&gt; repadmin /replsummary
Source DSA          largest delta    fails/total %   error
 DC01                     08m:12s    0 /  10    0
 DC02                     07m:55s    0 /  10    0
 DC03-LON              02h:41m:03s    5 /   5  100  (1722) The RPC server is unavailable.</pre>`
      }
    },
    {
      h: { en: "Entra ID vs on-prem AD, hybrid identity, and joining Linux", he: "Entra ID מול AD מקומי, זהות היברידית, וצירוף Linux" },
      body: {
        en: `<table>
<tr><th></th><th>AD DS (on-prem)</th><th>Microsoft Entra ID (formerly Azure AD)</th></tr>
<tr><td>Protocols</td><td>Kerberos, NTLM, LDAP</td><td>OIDC, OAuth 2.0, SAML, SCIM</td></tr>
<tr><td>Structure</td><td>Forest / domains / OUs</td><td>Flat tenant; administrative units, groups</td></tr>
<tr><td>Device policy</td><td>Group Policy</td><td>Intune (MDM), Conditional Access</td></tr>
<tr><td>Where it lives</td><td>Your DCs</td><td>Microsoft-run SaaS</td></tr>
<tr><td>Good for</td><td>File shares, legacy apps, Windows logon on LAN</td><td>SaaS SSO, MFA, cloud apps, Azure RBAC</td></tr>
</table>
<p>Entra ID is <em>not</em> \"AD in the cloud\": no LDAP, no Kerberos for arbitrary servers, no GPO. If you need those in Azure, either run DCs on VMs or use Entra Domain Services (managed, limited).</p>
<p><strong>Hybrid</strong>: <em>Entra Connect Sync</em> (or the lighter <em>Entra Cloud Sync</em>) copies users/groups from AD to Entra ID every 30 min. Sign-in options: <strong>Password Hash Sync</strong> (a hash of the NT hash is synced; simplest, works if on-prem is down — Microsoft's recommendation), <strong>Pass-through Authentication</strong> (agents validate against on-prem DCs), or <strong>federation</strong> with AD FS (most complex; many orgs are migrating off it). The Entra Connect server holds powerful sync credentials — treat it as Tier 0.</p>
<p><strong>Joining Linux to AD</strong> with realmd + SSSD (RHEL/Ubuntu):</p>
<pre>$ sudo dnf install -y realmd sssd adcli krb5-workstation oddjob-mkhomedir samba-common-tools
$ realm discover corp.example.com
corp.example.com
  type: kerberos
  realm-name: CORP.EXAMPLE.COM
  domain-name: corp.example.com
  configured: no
  server-software: active-directory
  client-software: sssd
$ sudo realm join -U admin.alice corp.example.com
$ sudo realm permit -g sg-linux-admins@corp.example.com
$ id alice@corp.example.com
uid=1286401103(alice@corp.example.com) gid=1286400513(domain users@corp.example.com) groups=...,1286412104(sg-linux-admins@corp.example.com)

# /etc/sssd/sssd.conf (excerpt)
[domain/corp.example.com]
id_provider = ad
access_provider = ad
use_fully_qualified_names = False
fallback_homedir = /home/%u
ad_gpo_access_control = enforcing</pre>
<blockquote>💡 Real world: Linux joined to AD needs the same three things Windows does — DC DNS (<code>dig SRV _ldap._tcp.corp.example.com</code> must answer), synced time (chrony), and Kerberos ports open. Most \"realm join failed\" tickets are one of those.</blockquote>`,
        he: `<table>
<tr><th></th><th>AD DS (מקומי)</th><th>Microsoft Entra ID (לשעבר Azure AD)</th></tr>
<tr><td>פרוטוקולים</td><td>Kerberos, ‏NTLM, ‏LDAP</td><td>OIDC, ‏OAuth 2.0, ‏SAML, ‏SCIM</td></tr>
<tr><td>מבנה</td><td>Forest / domains / OUs</td><td>Tenant שטוח; administrative units, קבוצות</td></tr>
<tr><td>מדיניות מכשירים</td><td>Group Policy</td><td>Intune ‏(MDM), ‏Conditional Access</td></tr>
<tr><td>איפה זה רץ</td><td>ה-DCs שלך</td><td>SaaS שמיקרוסופט מריצה</td></tr>
<tr><td>טוב בשביל</td><td>File shares, אפליקציות legacy, ‏login ל-Windows ברשת המקומית</td><td>SSO ל-SaaS, ‏MFA, אפליקציות ענן, ‏Azure RBAC</td></tr>
</table>
<p>Entra ID הוא <em>לא</em> \"AD בענן\": אין LDAP, אין Kerberos לשרתים שרירותיים, אין GPO. אם צריך את אלה ב-Azure, או שמריצים DCs על VMs או שמשתמשים ב-Entra Domain Services (מנוהל, מוגבל).</p>
<p><strong>היברידי</strong>: ‏<em>Entra Connect Sync</em> (או <em>Entra Cloud Sync</em> הקל יותר) מעתיק משתמשים וקבוצות מ-AD ל-Entra ID כל 30 דקות. אפשרויות sign-in: ‏<strong>Password Hash Sync</strong> (מסונכרן hash של ה-NT hash; הכי פשוט, עובד גם כשהמקומי למטה — ההמלצה של מיקרוסופט), ‏<strong>Pass-through Authentication</strong> (agents מאמתים מול ה-DCs המקומיים), או <strong>federation</strong> עם AD FS (הכי מורכב; הרבה ארגונים עוברים ממנו). שרת ה-Entra Connect מחזיק credentials חזקים של סנכרון — תתייחס אליו כ-Tier 0.</p>
<p><strong>צירוף Linux ל-AD</strong> עם realmd ו-SSSD ‏(RHEL/Ubuntu):</p>
<pre>$ sudo dnf install -y realmd sssd adcli krb5-workstation oddjob-mkhomedir samba-common-tools
$ realm discover corp.example.com
corp.example.com
  type: kerberos
  realm-name: CORP.EXAMPLE.COM
  domain-name: corp.example.com
  configured: no
  server-software: active-directory
  client-software: sssd
$ sudo realm join -U admin.alice corp.example.com
$ sudo realm permit -g sg-linux-admins@corp.example.com
$ id alice@corp.example.com
uid=1286401103(alice@corp.example.com) gid=1286400513(domain users@corp.example.com) groups=...,1286412104(sg-linux-admins@corp.example.com)

# /etc/sssd/sssd.conf (excerpt)
[domain/corp.example.com]
id_provider = ad
access_provider = ad
use_fully_qualified_names = False
fallback_homedir = /home/%u
ad_gpo_access_control = enforcing</pre>
<blockquote>💡 מהשטח: Linux שמצורף ל-AD צריך את אותם שלושה דברים ש-Windows צריך — DNS של ה-DCs ‏(<code>dig SRV _ldap._tcp.corp.example.com</code> חייב לענות), שעון מסונכרן (chrony), ופורטים של Kerberos פתוחים. רוב הטיקטים של \"realm join failed\" הם אחד מהשלושה.</blockquote>`
      }
    },
    {
      h: { en: "Attacks, the tiering model, PowerShell essentials, Windows containers", he: "התקפות, מודל ה-tiering, ‏PowerShell בסיסי, ‏Windows containers" },
      body: {
        en: `<table>
<tr><th>Attack</th><th>How it works</th><th>Defense</th></tr>
<tr><td><strong>Kerberoasting</strong></td><td>Any domain user can request a service ticket for any SPN; the ticket is encrypted with the service account's password hash → crack it offline (RC4 tickets crack fast)</td><td>gMSA (240-byte random passwords), 25+ char passwords on remaining accounts, disable RC4 / require AES, alert on bursts of event 4769 with encryption type 0x17</td></tr>
<tr><td><strong>Pass-the-hash</strong></td><td>Steal an NT hash from LSASS memory, authenticate with NTLM without ever knowing the password; move laterally with the same local admin password everywhere</td><td>Windows LAPS (unique local admin passwords), Credential Guard, Protected Users group, restrict NTLM, no Domain Admin logons to workstations</td></tr>
<tr><td><strong>Golden ticket</strong></td><td>With the <code>krbtgt</code> hash (via DCSync or DC compromise) forge TGTs for anyone, valid for years</td><td>Protect Tier 0; detect DCSync (replication requests from non-DCs); after compromise reset <code>krbtgt</code> <strong>twice</strong>, ~10 h+ apart</td></tr>
</table>
<p><strong>Tiering model</strong> (Microsoft's Enterprise Access Model): Tier 0 = identity control plane (DCs, AD CS, Entra Connect, the admins of those), Tier 1 = servers/apps, Tier 2 = workstations. Rule: credentials from a higher tier never touch a lower-tier machine. Use separate admin accounts per tier and Privileged Access Workstations.</p>
<p><strong>PowerShell essentials</strong> (RSAT ActiveDirectory module):</p>
<pre>Get-ADUser alice -Properties LastLogonDate,PasswordLastSet,LockedOut,memberOf
Search-ADAccount -LockedOut | Select-Object Name,LastLogonDate
Unlock-ADAccount alice
Get-ADUser -Filter 'ServicePrincipalName -like "*"' -Properties ServicePrincipalName   # kerberoastable list
Get-ADComputer -Filter 'OperatingSystem -like "*2012*"' | Measure-Object               # EOL servers
Get-ADGroupMember "Domain Admins" -Recursive
dcdiag /v /c /e /q              # all DCs, errors only
repadmin /showrepl DC03-LON
nltest /sc_verify:corp.example.com      # computer's secure channel to the domain
Test-ComputerSecureChannel -Repair      # fix "trust relationship ... failed"
w32tm /query /status            # time source and offset</pre>
<p><strong>Windows containers &amp; AKS.</strong> Images: <code>mcr.microsoft.com/windows/servercore:ltsc2022</code> (~1.5 GB compressed) or <code>nanoserver:ltsc2022</code> (~120 MB, no PowerShell/.NET Framework). With process isolation the container's OS build must match the host's (ltsc2022 on Server 2022); Hyper-V isolation relaxes that. On AKS, Windows runs in additional node pools (the system pool must be Linux), pool names are ≤ 6 chars, and you pin workloads with <code>nodeSelector: kubernetes.io/os: windows</code>. Windows Pods can use gMSA via a credential spec for AD auth to SQL Server or file shares.</p>
<blockquote>⚠️ Production tip: check whether your AKS Windows node images are still supported before an upgrade — Windows Server 2019 pools are being retired, so plan moves to 2022/2025 and rebuild images on the matching LTSC base.</blockquote>`,
        he: `<table>
<tr><th>התקפה</th><th>איך זה עובד</th><th>הגנה</th></tr>
<tr><td><strong>Kerberoasting</strong></td><td>כל משתמש ב-domain יכול לבקש service ticket לכל SPN; ה-ticket מוצפן ב-hash של הסיסמה של חשבון השירות ← שוברים אותו offline ‏(tickets של RC4 נשברים מהר)</td><td>gMSA ‏(סיסמאות אקראיות של 240 בייטים), סיסמאות של 25 תווים ומעלה לחשבונות שנשארו, ביטול RC4 ודרישת AES, התראה על התפרצויות של event 4769 עם encryption type 0x17</td></tr>
<tr><td><strong>Pass-the-hash</strong></td><td>גונבים NT hash מהזיכרון של LSASS, עושים authentication עם NTLM בלי לדעת את הסיסמה; זזים לרוחב עם אותה סיסמת local admin בכל המחשבים</td><td>Windows LAPS ‏(סיסמת local admin ייחודית לכל מחשב), ‏Credential Guard, קבוצת Protected Users, הגבלת NTLM, אין login של Domain Admin לתחנות עבודה</td></tr>
<tr><td><strong>Golden ticket</strong></td><td>עם ה-hash של <code>krbtgt</code> ‏(דרך DCSync או פריצה ל-DC) מזייפים TGT לכל אחד, שתקף לשנים</td><td>להגן על Tier 0; לזהות DCSync ‏(בקשות replication ממחשבים שאינם DCs); אחרי פריצה לאפס את <code>krbtgt</code> <strong>פעמיים</strong>, בהפרש של 10 שעות ומעלה</td></tr>
</table>
<p><strong>מודל ה-tiering</strong> ‏(Enterprise Access Model של מיקרוסופט): ‏Tier 0 = מישור השליטה של הזהויות (DCs, ‏AD CS, ‏Entra Connect, וה-admins שלהם), ‏Tier 1 = שרתים ואפליקציות, ‏Tier 2 = תחנות עבודה. הכלל: credentials מ-tier גבוה אף פעם לא נוגעים במכונה של tier נמוך יותר. חשבון admin נפרד לכל tier, ו-Privileged Access Workstations.</p>
<p><strong>PowerShell בסיסי</strong> ‏(המודול ActiveDirectory של RSAT):</p>
<pre>Get-ADUser alice -Properties LastLogonDate,PasswordLastSet,LockedOut,memberOf
Search-ADAccount -LockedOut | Select-Object Name,LastLogonDate
Unlock-ADAccount alice
Get-ADUser -Filter 'ServicePrincipalName -like "*"' -Properties ServicePrincipalName   # kerberoastable list
Get-ADComputer -Filter 'OperatingSystem -like "*2012*"' | Measure-Object               # EOL servers
Get-ADGroupMember "Domain Admins" -Recursive
dcdiag /v /c /e /q              # all DCs, errors only
repadmin /showrepl DC03-LON
nltest /sc_verify:corp.example.com      # computer's secure channel to the domain
Test-ComputerSecureChannel -Repair      # fix "trust relationship ... failed"
w32tm /query /status            # time source and offset</pre>
<p><strong>Windows containers ו-AKS.</strong> Images: ‏<code>mcr.microsoft.com/windows/servercore:ltsc2022</code> ‏(בערך 1.5GB דחוס) או <code>nanoserver:ltsc2022</code> ‏(בערך 120MB, בלי PowerShell ובלי ‎.NET Framework). ב-process isolation ה-build של מערכת ההפעלה בקונטיינר חייב להתאים ל-host ‏(ltsc2022 על Server 2022); ‏Hyper-V isolation מקל על זה. ב-AKS, ‏Windows רץ ב-node pools נוספים (ה-system pool חייב להיות Linux), שמות ה-pools עד 6 תווים, ומצמידים workloads עם <code>nodeSelector: kubernetes.io/os: windows</code>. Pod-ים של Windows יכולים להשתמש ב-gMSA דרך credential spec בשביל auth מול AD ל-SQL Server או ל-file shares.</p>
<blockquote>⚠️ טיפ לפרודקשן: לפני upgrade תבדוק שה-node images של Windows ב-AKS עדיין נתמכים — pools של Windows Server 2019 יוצאים משימוש, אז תתכנן מעבר ל-2022/2025 ותבנה מחדש את ה-images על בסיס ה-LTSC המתאים.</blockquote>`
      }
    }
  ],
  diagram: `        forest: corp.example.com  (security boundary)
        +-------------------------------------------------+
        | domain corp.example.com                         |
        |   DC01 (PDC, Schema, DomNaming) <-> DC02 (RID)  |   site TLV
        |        ^  AD-integrated DNS, SYSVOL (DFSR)       |
        |        |  inter-site replication (180 min)      |
        |   DC03-LON ------------------------------------  |   site LON
        |   OUs: Users / Servers / Workstations (GPO links)|
        +-------------------------------------------------+
  client --AS-REQ--> KDC (any DC) --TGT--> client --TGS-REQ--> KDC --ticket--> client --AP-REQ--> service
  AD --Entra Connect (every 30 min)--> Entra ID --OIDC/SAML--> SaaS apps`,
  handsOn: [
    { cmd: "nltest /dsgetdc:corp.example.com",
      what: { en: "Which DC did this machine locate, in which site, and does it hold KDC/TIMESERV/GC flags.", he: "איזה DC המחשב הזה מצא, באיזה site, והאם יש לו את הדגלים KDC/TIMESERV/GC." } },
    { cmd: "w32tm /query /source && w32tm /stripchart /computer:dc01.corp.example.com /samples:5 /dataonly",
      what: { en: "Where this machine gets time from, and its live offset to a DC. Anything near 300 s is a Kerberos outage waiting to happen.", he: "מאיפה המחשב הזה מקבל זמן, ומה ה-offset החי שלו מול DC. כל דבר שמתקרב ל-300 שניות הוא תקלת Kerberos שמחכה לקרות." } },
    { cmd: "repadmin /replsummary && dcdiag /e /q",
      what: { en: "Forest-wide replication health and DC diagnostics, errors only. Run it weekly, not just during incidents.", he: "בריאות ה-replication בכל ה-forest ודיאגנוסטיקה של ה-DCs, רק שגיאות. תריץ את זה כל שבוע, לא רק בתקלות." } },
    { cmd: "realm discover corp.example.com && kinit alice@CORP.EXAMPLE.COM && klist",
      what: { en: "From a Linux box: discover the domain via DNS SRV records and get a real Kerberos TGT from AD.", he: "ממכונת Linux: לגלות את ה-domain דרך רשומות DNS SRV ולקבל TGT אמיתי של Kerberos מ-AD." } }
  ],
  mnemonic: {
    en: "AD lives on DNS, Time and Replication — \"DTR\": if logons break, check DNS, then Time (5 minutes), then Replication. And Tier 0 is the crown jewels.",
    he: "AD חי על DNS, ‏Time ו-Replication ‏(\"DTR\"): כש-logins נשברים, תבדוק DNS, אחר כך שעון (5 דקות), ואחר כך replication. ו-Tier 0 הם יהלומי הכתר."
  },
  pitfalls: [
    { en: "Pointing domain members (or DCs themselves) at public DNS. SRV lookups fail, logons fall back to cached credentials, GPOs stop applying — and nothing looks obviously broken until a password change.",
      he: "להפנות מחשבים ב-domain (או את ה-DCs עצמם) ל-DNS ציבורי. חיפושי ה-SRV נכשלים, ה-logins נופלים ל-credentials שמורים, ה-GPOs מפסיקים לחול — ושום דבר לא נראה שבור באופן ברור עד שינוי הסיסמה הבא." },
    { en: "Letting the hypervisor set DC time (Hyper-V/VMware time sync) instead of the PDC Emulator → external NTP hierarchy. A host move or bad host clock shifts the DC by minutes and Kerberos fails domain-wide.",
      he: "לתת ל-hypervisor לקבוע את השעון של ה-DC ‏(time sync של Hyper-V/VMware) במקום ההיררכיה של PDC Emulator ← NTP חיצוני. מעבר host או שעון host שגוי מזיזים את ה-DC בדקות ו-Kerberos נכשל בכל ה-domain." },
    { en: "Restoring a DC from a VM snapshot or cloning one. Without VM-GenerationID safeguards this causes USN rollback — silent, permanent replication divergence. Restore AD via system-state backup or rebuild the DC.",
      he: "לשחזר DC מ-snapshot של VM או לשכפל אחד. בלי ההגנות של VM-GenerationID זה גורם ל-USN rollback — פיצול שקט וקבוע ב-replication. משחזרים AD מגיבוי system state, או בונים את ה-DC מחדש." },
    { en: "Service accounts with SPNs, old passwords and admin rights. They are the first thing Kerberoasting finds. Move them to gMSA or at least long random passwords with AES only.",
      he: "חשבונות שירות עם SPNs, סיסמאות ישנות והרשאות admin. הם הדבר הראשון ש-Kerberoasting מוצא. תעביר אותם ל-gMSA, או לפחות לסיסמאות אקראיות ארוכות עם AES בלבד." }
  ],
  interview: [
    { q: { en: "Users report \"The trust relationship between this workstation and the primary domain failed\". What happened and how do you fix it?", he: "משתמשים מדווחים \"The trust relationship between this workstation and the primary domain failed\". מה קרה ואיך מתקנים?" },
      a: { en: "The computer account's password (rotated by the machine every 30 days) no longer matches what AD has — typically after restoring the VM from an old snapshot, reimaging with the same name, or an object deleted/reset in AD. Verify with nltest /sc_verify:corp.example.com. Fix by logging in with a local admin and running Test-ComputerSecureChannel -Repair -Credential (or Reset-ComputerMachinePassword), or rejoin as a last resort. Prevent it by not reverting domain members to old snapshots.",
           he: "הסיסמה של חשבון המחשב (שהמחשב מחליף כל 30 יום) כבר לא תואמת למה שיש ב-AD — בדרך כלל אחרי שחזור VM מ-snapshot ישן, התקנה מחדש עם אותו שם, או אובייקט שנמחק או אופס ב-AD. מאמתים עם nltest /sc_verify:corp.example.com. מתקנים ב-login עם local admin והרצה של Test-ComputerSecureChannel -Repair -Credential ‏(או Reset-ComputerMachinePassword), או צירוף מחדש כמוצא אחרון. מונעים את זה בכך שלא מחזירים מחשבים ב-domain ל-snapshots ישנים." } },
    { q: { en: "Why is NTLM being deprecated, and how would you get rid of it in a 5,000-machine domain?", he: "למה NTLM יוצא משימוש, ואיך היית נפטר ממנו ב-domain של 5,000 מחשבים?" },
      a: { en: "NTLM has no mutual authentication, its hashes are password-equivalent (pass-the-hash), and it can be relayed to LDAP/SMB/AD CS. Plan: enable NTLM auditing on DCs and servers (event 8004 etc.), collect to a SIEM, group by source and target, fix root causes (access by IP or CNAME without SPN, apps hard-coded to NTLM, non-domain devices), kill NTLMv1 first, then restrict NTLM per server with exceptions lists, and finally deny domain-wide. Enforce SMB and LDAP signing meanwhile to blunt relay.",
           he: "ל-NTLM אין mutual authentication, ה-hashes שלו שקולים לסיסמה (pass-the-hash), ואפשר לעשות לו relay ל-LDAP/SMB/AD CS. תוכנית: להפעיל audit של NTLM על ה-DCs והשרתים (event 8004 וכו'), לאסוף ל-SIEM, לקבץ לפי מקור ויעד, לתקן שורשים (גישה לפי IP או CNAME בלי SPN, אפליקציות שמקודדות ל-NTLM, מכשירים שלא ב-domain), להרוג קודם את NTLMv1, אחר כך להגביל NTLM לכל שרת עם רשימת חריגים, ובסוף לחסום בכל ה-domain. בינתיים לאכוף SMB signing ו-LDAP signing כדי לנטרל relay." } },
    { q: { en: "What's the difference between Entra ID and Active Directory, and how do they connect?", he: "מה ההבדל בין Entra ID ל-Active Directory, ואיך הם מתחברים?" },
      a: { en: "AD DS is an on-prem directory with Kerberos/NTLM/LDAP, OUs and Group Policy. Entra ID is a cloud identity provider speaking OIDC/OAuth/SAML, with Conditional Access and Intune instead of GPO — no LDAP or Kerberos for your servers. Entra Connect Sync (or Cloud Sync) synchronizes users and groups from AD to Entra, with Password Hash Sync, Pass-through Auth or federation for sign-in. PHS is simplest and keeps cloud sign-in working when on-prem is down.",
           he: "AD DS הוא directory מקומי עם Kerberos/NTLM/LDAP, ‏OUs ו-Group Policy. ‏Entra ID הוא identity provider בענן שמדבר OIDC/OAuth/SAML, עם Conditional Access ו-Intune במקום GPO — בלי LDAP ובלי Kerberos לשרתים שלך. Entra Connect Sync ‏(או Cloud Sync) מסנכרן משתמשים וקבוצות מ-AD ל-Entra, עם Password Hash Sync, ‏Pass-through Auth או federation ל-sign-in. ‏PHS הכי פשוט ושומר על sign-in לענן גם כשהמקומי למטה." } }
  ],
  quiz: [
    { q: { en: "Which FSMO role is the authoritative time source for a domain?", he: "איזה תפקיד FSMO הוא מקור הזמן הסמכותי של domain?" },
      options: [
        { en: "RID Master", he: "RID Master" },
        { en: "PDC Emulator", he: "PDC Emulator" },
        { en: "Schema Master", he: "Schema Master" },
        { en: "Infrastructure Master", he: "Infrastructure Master" }
      ],
      answer: 1,
      explain: { en: "Members sync from DCs, DCs from the PDC Emulator of their domain, and the forest-root PDC Emulator syncs from external NTP. Keep hypervisor time sync away from DCs.", he: "המחשבים מסתנכרנים מה-DCs, ה-DCs מה-PDC Emulator של ה-domain שלהם, וה-PDC Emulator של ה-forest root מסתנכרן מ-NTP חיצוני. תרחיק את ה-time sync של ה-hypervisor מה-DCs." } },
    { q: { en: "What is the default maximum clock skew Kerberos tolerates in AD?", he: "מה ה-clock skew המקסימלי ש-Kerberos סובל כברירת מחדל ב-AD?" },
      options: [
        { en: "30 seconds", he: "30 שניות" },
        { en: "5 minutes", he: "5 דקות" },
        { en: "15 minutes", he: "15 דקות" },
        { en: "1 hour", he: "שעה" }
      ],
      answer: 1,
      explain: { en: "\"Maximum tolerance for computer clock synchronization\" defaults to 5 minutes. Beyond it, KDCs and services reject tickets with KRB_AP_ERR_SKEW.", he: "\"Maximum tolerance for computer clock synchronization\" הוא 5 דקות כברירת מחדל. מעבר לזה, ה-KDCs והשירותים דוחים tickets עם KRB_AP_ERR_SKEW." } },
    { q: { en: "An attacker with a normal domain user requests tickets for all accounts with SPNs and cracks them offline. What is this, and the best structural fix?", he: "תוקף עם משתמש domain רגיל מבקש tickets לכל החשבונות עם SPNs ושובר אותם offline. מה זה, ומה התיקון המבני הכי טוב?" },
      options: [
        { en: "Golden ticket; reset krbtgt", he: "Golden ticket; לאפס את krbtgt" },
        { en: "Pass-the-hash; enable LAPS", he: "Pass-the-hash; להפעיל LAPS" },
        { en: "Kerberoasting; move service accounts to gMSA and disable RC4", he: "Kerberoasting; להעביר חשבונות שירות ל-gMSA ולבטל RC4" },
        { en: "NTLM relay; enable LDAPS", he: "NTLM relay; להפעיל LDAPS" }
      ],
      answer: 2,
      explain: { en: "Kerberoasting abuses the fact that service tickets are encrypted with the service account's password-derived key. gMSA passwords are 240 random bytes — not crackable — and AES-only removes the fast RC4 path.", he: "Kerberoasting מנצל את זה ש-service tickets מוצפנים במפתח שנגזר מהסיסמה של חשבון השירות. הסיסמאות של gMSA הן 240 בייטים אקראיים — אי אפשר לשבור אותן — ו-AES בלבד מבטל את המסלול המהיר של RC4." } },
    { q: { en: "Which statement about Microsoft Entra ID is true?", he: "איזו טענה על Microsoft Entra ID נכונה?" },
      options: [
        { en: "It is AD DS hosted by Microsoft, with LDAP and Group Policy", he: "זה AD DS שמיקרוסופט מארחת, עם LDAP ו-Group Policy" },
        { en: "It uses OIDC/OAuth/SAML; Entra Connect syncs identities from on-prem AD", he: "הוא משתמש ב-OIDC/OAuth/SAML; ‏Entra Connect מסנכרן זהויות מ-AD המקומי" },
        { en: "It requires AD FS federation to work with on-prem AD", he: "הוא חייב federation של AD FS כדי לעבוד עם AD מקומי" },
        { en: "Linux servers can join it with realm join", he: "שרתי Linux יכולים להצטרף אליו עם realm join" }
      ],
      answer: 1,
      explain: { en: "Entra ID is a cloud IdP, not a domain. Hybrid uses Entra Connect with PHS, PTA or federation (federation is optional). realm join targets AD DS (or Entra Domain Services), not Entra ID itself.", he: "Entra ID הוא IdP בענן, לא domain. היברידי משתמש ב-Entra Connect עם PHS, ‏PTA או federation ‏(federation זה אופציונלי). realm join מכוון ל-AD DS ‏(או Entra Domain Services), לא ל-Entra ID עצמו." } }
  ],
  related: ["net-dns", "pr-auth", "flow-login-sso", "pr-time-timestamps", "staff-time-ordering", "cloud-iam-security", "staff-zero-trust-secrets", "linux-permissions-users", "vms", "pr-security-ops"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
INFRA.glossary.push(
  { term: "Fan-out on write", track: "principal",
    def: { en: "Push model: when an item is written, copy it into every recipient's inbox/timeline up front so reads are a single lookup. Cheap reads, expensive writes for users with many followers.",
           he: "מודל push: כשפריט נכתב, מעתיקים אותו מראש ל-inbox או ל-timeline של כל נמען, כך שקריאה היא lookup אחד. קריאות זולות, כתיבות יקרות למשתמשים עם הרבה followers." },
    lesson: "sd-patterns-catalog" },
  { term: "Geohash", track: "principal",
    def: { en: "Encodes latitude/longitude into a base-32 string where a shared prefix means a nearby area (6 chars ≈ 1.2 km × 0.6 km), so proximity search becomes a prefix/range query on the cell plus its 8 neighbors.",
           he: "מקודד lat/lng למחרוזת base-32 שבה prefix משותף אומר אזור קרוב (6 תווים ≈ 1.2 על 0.6 ק\"מ), כך שחיפוש קרבה הופך ל-query של prefix או טווח על התא ועל 8 השכנים שלו." },
    lesson: "sd-patterns-catalog" },
  { term: "Queue-based load leveling", track: "principal",
    def: { en: "Put a queue between bursty producers and a slower downstream so consumers drain at a steady, sustainable rate; spikes become backlog (and lag) instead of overload. Costs async responses, DLQs and lag monitoring.",
           he: "שמים תור בין producers עם התפרצויות לבין downstream איטי יותר, כך שה-consumers מרוקנים בקצב קבוע ובר-קיימא; קפיצות הופכות ל-backlog ‏(ו-lag) במקום לעומס יתר. המחיר: תשובות אסינכרוניות, ‏DLQ וניטור lag." },
    lesson: "sd-patterns-catalog" },
  { term: "Kerberos", track: "foundations",
    def: { en: "Ticket-based authentication protocol used by Active Directory: a KDC issues a TGT at logon and service tickets per SPN; services verify tickets locally. Requires clocks within 5 minutes and DNS names.",
           he: "פרוטוקול authentication מבוסס tickets ש-Active Directory משתמש בו: ‏KDC מנפיק TGT ב-logon ו-service tickets לכל SPN; השירותים מאמתים את ה-tickets מקומית. דורש שעונים בטווח של 5 דקות ושמות DNS." },
    lesson: "windows-active-directory" },
  { term: "FSMO roles", track: "foundations",
    def: { en: "The five single-master operations in AD: Schema Master and Domain Naming Master (per forest), PDC Emulator, RID Master and Infrastructure Master (per domain). The PDC Emulator is also the domain's time source.",
           he: "חמש הפעולות ה-single-master ב-AD: ‏Schema Master ו-Domain Naming Master ‏(לכל forest), ‏PDC Emulator, ‏RID Master ו-Infrastructure Master ‏(לכל domain). ה-PDC Emulator הוא גם מקור הזמן של ה-domain." },
    lesson: "windows-active-directory" },
  { term: "gMSA (group Managed Service Account)", track: "foundations",
    def: { en: "AD service account whose 240-byte random password is generated and rotated by AD (every 30 days by default) and retrievable only by allowed computers. Removes static service passwords and defeats Kerberoasting.",
           he: "חשבון שירות ב-AD שהסיסמה שלו (240 בייטים אקראיים) נוצרת ומוחלפת על ידי ה-AD ‏(כל 30 יום כברירת מחדל), ורק מחשבים מורשים יכולים לשלוף אותה. מבטל סיסמאות שירות סטטיות ומנטרל Kerberoasting." },
    lesson: "windows-active-directory" }
);

// ---------------------------------------------------------------------------
// Scenario: Kerberos clock skew
// ---------------------------------------------------------------------------
INFRA.scenarios.push({
  id: "kerberos-clock-skew",
  icon: "🕰️",
  title: { en: "Nobody can log in: the 7-minute clock", he: "אף אחד לא מצליח להתחבר: השעון של 7 הדקות" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Monday 08:20. The helpdesk queue explodes: users in the TLV office can't map file shares, the intranet (IIS, Windows auth) prompts for passwords in a loop, and the SQL Server jobs that use AD service accounts are failing. Remote users on Entra-only SaaS apps are fine. Over the weekend the virtualization team moved VMs to new Hyper-V hosts. Where do you start?",
        he: "יום שני 08:20. התור של ה-helpdesk מתפוצץ: משתמשים במשרד בתל אביב לא מצליחים למפות file shares, ה-intranet ‏(IIS עם Windows auth) מבקש סיסמה בלולאה, וה-jobs של SQL Server שמשתמשים בחשבונות שירות של AD נכשלים. משתמשים מרוחקים באפליקציות SaaS שעובדות רק עם Entra בסדר. בסוף השבוע צוות הווירטואליזציה העביר VMs ל-hosts חדשים של Hyper-V. מאיפה אתה מתחיל?"
      },
      data: `Helpdesk tickets (last 30 min): 142
  "\\\\fs01\\share is not accessible. The system cannot contact a domain controller..."
  intranet: HTTP 401 loop (Negotiate)
SQL Agent: Login failed for user 'CORP\\svc-etl'. Reason: ... (KDC error)
Change log (weekend): CHG-8812 "Live-migrate cluster HV-A -> HV-B (DC02, FS01, SQL01, 40 VMs)"`,
      choices: [
        { label: { en: "Check the DCs' health and the Security/System event logs on a failing client and on a DC", he: "לבדוק את הבריאות של ה-DCs ואת ה-event logs של Security ו-System על לקוח שנכשל ועל DC" }, next: "s2", score: 10,
          feedback: { en: "Good: auth is failing broadly, and the auth path runs through the DCs. Logs tell you which Kerberos error it is.", he: "טוב: ה-auth נכשל באופן רחב, ומסלול ה-auth עובר דרך ה-DCs. ה-logs יגידו לך איזו שגיאת Kerberos זו." } },
        { label: { en: "Reset the passwords of svc-etl and the affected users", he: "לאפס את הסיסמאות של svc-etl ושל המשתמשים שנפגעו" }, next: "s1b", score: -10,
          feedback: { en: "Hundreds of users don't forget their passwords at once. Resetting service passwords breaks every service that still has the old one cached.", he: "מאות משתמשים לא שוכחים את הסיסמה שלהם באותו רגע. איפוס סיסמאות שירות שובר כל שירות שעדיין מחזיק את הישנה." } },
        { label: { en: "Roll back the Hyper-V migration immediately", he: "להחזיר מיד את המיגרציה של Hyper-V אחורה" }, next: "s1b", score: -5,
          feedback: { en: "A suspicious change is a good lead, but a blind rollback of 40 VMs during business hours is risky and you don't yet know what broke.", he: "שינוי חשוד זה כיוון טוב, אבל rollback עיוור של 40 VMs בשעות העבודה מסוכן, ועוד אין לך מושג מה נשבר." } }
      ]
    },
    s1b: {
      text: {
        en: "30 minutes later nothing improved; now svc-etl is also locked out on some servers because they keep trying the old password. The CIO is on the bridge.",
        he: "אחרי 30 דקות שום דבר לא השתפר; עכשיו svc-etl גם נעול בחלק מהשרתים כי הם ממשיכים לנסות את הסיסמה הישנה. ה-CIO על ה-bridge."
      },
      choices: [
        { label: { en: "Stop guessing and read the event logs on a client and a DC", he: "להפסיק לנחש ולקרוא את ה-event logs על לקוח ועל DC" }, next: "s2", score: 0,
          feedback: { en: "Back on track, with an extra lockout to clean up later.", he: "חזרת למסלול, עם lockout נוסף שתצטרך לנקות אחר כך." } }
      ]
    },
    s2: {
      text: {
        en: "dcdiag shows no replication or DNS errors. On DC02 and on failing clients you find these events. What do they tell you?",
        he: "dcdiag לא מראה שגיאות replication או DNS. על DC02 ועל לקוחות שנכשלים אתה מוצא את ה-events האלה. מה הם אומרים לך?"
      },
      data: `DC02  Security  4771  Kerberos pre-authentication failed.
        Account Name: alice   Client Address: ::ffff:10.0.20.57
        Failure Code: 0x25    (KRB_AP_ERR_SKEW: clock skew too great)
CLIENT System  Kerberos  Event 4:  The Kerberos client received a KRB_AP_ERR_SKEW error ...
DC02  System  Microsoft-Windows-Time-Service  Event 37:
        The time provider NtpClient is currently receiving valid time data from VM IC Time Synchronization Provider
CLIENT> net time \\\\DC01   Current time at \\\\DC01 is 11/17/2026 8:23:10 AM
CLIENT> net time \\\\DC02   Current time at \\\\DC02 is 11/17/2026 8:30:14 AM`,
      choices: [
        { label: { en: "Kerberos is rejecting tickets because DC02's clock is ~7 minutes ahead (> 5-minute tolerance); compare time sources", he: "Kerberos דוחה tickets כי השעון של DC02 מקדים בערך ב-7 דקות (מעל הסבולת של 5 דקות); להשוות את מקורות הזמן" }, next: "s3", score: 10,
          feedback: { en: "Exactly. 0x25 = KRB_AP_ERR_SKEW. Users whose DC locator picks DC02 fail; those hitting DC01 mostly work.", he: "בדיוק. 0x25 = KRB_AP_ERR_SKEW. משתמשים שה-DC locator שלהם בוחר ב-DC02 נכשלים; אלה שמגיעים ל-DC01 ברובם עובדים." } },
        { label: { en: "It's a replication issue, force a full sync with repadmin /syncall /AdeP", he: "זו בעיית replication, לכפות סנכרון מלא עם repadmin /syncall /AdeP" }, next: "lose", score: -10,
          feedback: { en: "Replication was healthy, and syncing doesn't fix time. Meanwhile the outage continues.", he: "ה-replication היה תקין, וסנכרון לא מתקן שעון. בינתיים התקלה נמשכת." } }
      ]
    },
    s3: {
      text: {
        en: "You check the time configuration on both DCs and the Hyper-V hosts.",
        he: "אתה בודק את הגדרות הזמן על שני ה-DCs ועל ה-hosts של Hyper-V."
      },
      data: `DC01 (PDC Emulator)> w32tm /query /source
time.cloudflare.com,0x8
DC02> w32tm /query /source
VM IC Time Synchronization Provider
DC02> w32tm /stripchart /computer:DC01 /samples:3 /dataonly
08:31:02, -424.1180372s
08:31:04, -424.1192210s
08:31:06, -424.1201544s
HV-B07 (host of DC02)> w32tm /query /status
Source: Local CMOS Clock     Stratum: 1    Last Successful Sync Time: unspecified`,
      choices: [
        { label: { en: "Root cause: DC02 takes time from its new Hyper-V host, whose clock is wrong. Disable the VM IC time provider on DC02 and sync it from the domain hierarchy", he: "שורש הבעיה: DC02 לוקח זמן מה-host החדש של Hyper-V, שהשעון שלו שגוי. לבטל את ה-VM IC time provider על DC02 ולסנכרן אותו מההיררכיה של ה-domain" }, next: "s4", score: 10,
          feedback: { en: "Right. DCs must follow the PDC Emulator; the PDC follows external NTP. Hypervisor time sync on a DC overrides that silently.", he: "נכון. DCs חייבים ללכת אחרי ה-PDC Emulator; ה-PDC הולך אחרי NTP חיצוני. Time sync של hypervisor על DC עוקף את זה בשקט." } },
        { label: { en: "Set DC02's clock by hand with Set-Date and move on", he: "לכוון את השעון של DC02 ידנית עם Set-Date ולהמשיך הלאה" }, next: "s3b", score: -5,
          feedback: { en: "It helps for a few minutes — then the Hyper-V integration service pulls it back to the host's wrong time.", he: "זה עוזר לכמה דקות — ואז ה-integration service של Hyper-V מושך אותו חזרה לשעה השגויה של ה-host." } }
      ]
    },
    s3b: {
      text: {
        en: "Logons recover for 4 minutes, then fail again. w32tm on DC02 shows the offset is back to -424 s. The host keeps winning.",
        he: "ה-logins מתאוששים ל-4 דקות, ואז נכשלים שוב. w32tm על DC02 מראה שה-offset חזר ל-424- שניות. ה-host ממשיך לנצח."
      },
      choices: [
        { label: { en: "Disable the VM IC time provider on DC02 and resync from the domain hierarchy", he: "לבטל את ה-VM IC time provider על DC02 ולסנכרן מחדש מההיררכיה של ה-domain" }, next: "s4", score: 0,
          feedback: { en: "Now you're fixing the cause instead of the symptom.", he: "עכשיו אתה מתקן את הסיבה ולא את הסימפטום." } }
      ]
    },
    s4: {
      text: {
        en: "You run the fix on DC02. The offset drops to under 1 s. Logons on DC02 start succeeding, but some users still get password prompts and SQL jobs still fail for a few minutes. What now?",
        he: "אתה מריץ את התיקון על DC02. ה-offset יורד מתחת לשנייה. ה-logins מול DC02 מתחילים להצליח, אבל חלק מהמשתמשים עדיין מקבלים בקשת סיסמה וה-jobs של SQL עדיין נכשלים לכמה דקות. מה עכשיו?"
      },
      data: `DC02> reg add HKLM\\SYSTEM\\CurrentControlSet\\Services\\W32Time\\TimeProviders\\VMICTimeProvider /v Enabled /t REG_DWORD /d 0 /f
DC02> w32tm /config /syncfromflags:domhier /update
DC02> net stop w32time && net start w32time && w32tm /resync /rediscover
DC02> w32tm /query /source
DC01.corp.example.com
DC02> w32tm /stripchart /computer:DC01 /samples:2 /dataonly
08:44:40, +00.0021133s
08:44:42, +00.0019807s`,
      choices: [
        { label: { en: "Check member servers that also synced from the bad host (FS01, SQL01) and purge stale tickets: klist purge / restart affected services", he: "לבדוק שרתים שגם הם סונכרנו מה-host הבעייתי (FS01, ‏SQL01) ולנקות tickets ישנים: ‏klist purge או restart לשירותים שנפגעו" }, next: "s5", score: 10,
          feedback: { en: "Yes: other VMs on HV-B inherited the same wrong time, and clients hold failed/negative state until retry or ticket refresh.", he: "כן: VMs אחרים על HV-B ירשו את אותה שעה שגויה, ולקוחות מחזיקים מצב כשל עד retry או רענון ticket." } },
        { label: { en: "Declare the incident resolved — the DC is fixed", he: "להכריז שהתקלה נפתרה — ה-DC תוקן" }, next: "lose", score: -10,
          feedback: { en: "FS01 and SQL01 on the same hosts are still 7 minutes off; Kerberos to them keeps failing and users reopen tickets an hour later.", he: "FS01 ו-SQL01 על אותם hosts עדיין זזים ב-7 דקות; ‏Kerberos מולם ממשיך להיכשל והמשתמשים פותחים טיקטים מחדש אחרי שעה." } }
      ]
    },
    s5: {
      text: {
        en: "FS01 and SQL01 were also 7 minutes ahead (domain members use the Hyper-V provider too, but they correct from the DC once DC02 is right). After w32tm /resync on them and klist purge on a few clients, everything works. How do you keep this from happening again?",
        he: "גם FS01 ו-SQL01 הקדימו ב-7 דקות (גם מחשבים ב-domain משתמשים ב-provider של Hyper-V, אבל הם מתקנים את עצמם מה-DC כש-DC02 תקין). אחרי w32tm /resync עליהם ו-klist purge על כמה לקוחות, הכל עובד. איך אתה מונע את זה בפעם הבאה?"
      },
      choices: [
        { label: { en: "GPO/WMI-filtered setting disabling VMIC time on all DCs, NTP on every Hyper-V host, an alert on |offset| > 60 s vs the PDC, and a time check in the host-migration runbook", he: "GPO עם WMI filter שמבטל את ה-VMIC time בכל ה-DCs, ‏NTP על כל host של Hyper-V, התראה כש-offset מול ה-PDC עולה על 60 שניות, ובדיקת שעון ב-runbook של מיגרציית hosts" }, next: "win", score: 10,
          feedback: { en: "Fix the class of problem: config as policy, a monitor well below the 300 s cliff, and a change-process check.", he: "מתקנים את כל סוג הבעיה: הגדרה כ-policy, ניטור הרבה מתחת לצוק של 300 שניות, ובדיקה בתהליך השינויים." } },
        { label: { en: "Raise the Kerberos maximum clock skew to 30 minutes so this can't happen", he: "להעלות את ה-clock skew המקסימלי של Kerberos ל-30 דקות כדי שזה לא יקרה" }, next: "lose", score: -10,
          feedback: { en: "That widens the replay window for stolen tickets and only hides the next, bigger drift. Fix time, don't loosen security.", he: "זה מרחיב את חלון ה-replay ל-tickets גנובים ורק מסתיר את הסטייה הבאה, הגדולה יותר. מתקנים את השעון, לא מחלישים את האבטחה." } }
      ]
    },
    win: {
      text: {
        en: "Resolved in 35 minutes. The postmortem's action items: VMIC time disabled on all DCs via GPO, NTP configured on every Hyper-V host, a Prometheus/SCOM alert at 60 s offset, and \"verify w32tm offset on DCs\" added to the migration checklist. Root cause in one line: a DC took its time from a hypervisor with an unsynced CMOS clock.",
        he: "נפתר תוך 35 דקות. ה-action items מה-postmortem: ‏VMIC time מבוטל בכל ה-DCs דרך GPO, ‏NTP מוגדר על כל host של Hyper-V, התראה ב-Prometheus/SCOM על offset של 60 שניות, ו-\"לבדוק offset של w32tm על ה-DCs\" נוסף ל-checklist של מיגרציות. שורש הבעיה בשורה אחת: DC לקח את השעה שלו מ-hypervisor עם שעון CMOS לא מסונכרן."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The outage drags on past noon. Later analysis shows DC02 was 7 minutes ahead because it synced time from its new Hyper-V host — the Kerberos 5-minute tolerance did the rest. Lesson: when AD auth fails broadly, check DNS, then time (w32tm, event 4771 code 0x25), then replication.",
        he: "התקלה נמשכת עד אחרי הצהריים. בניתוח מאוחר יותר מתברר ש-DC02 הקדים ב-7 דקות כי הוא סנכרן את השעה מה-host החדש של Hyper-V — והסבולת של 5 דקות של Kerberos עשתה את השאר. הלקח: כש-auth של AD נכשל באופן רחב, בודקים DNS, אחר כך שעון (w32tm, ‏event 4771 עם קוד 0x25), ואחר כך replication."
      },
      end: "lose"
    }
  },
  lessons: ["windows-active-directory", "pr-time-timestamps", "staff-time-ordering", "net-dns"]
});
