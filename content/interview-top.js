// Top 50 @ Big Tech: the questions most commonly reported in Senior / Staff / Principal
// interviews for infra, platform, SRE, DevOps and backend roles.
// `companies` = "commonly reported at" (interview-prep write-ups, Glassdoor/Blind reports,
// company interview guides), not a claim about any specific interview.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.topQuestions = window.INFRA.topQuestions || [];

/* =========================== SYSTEM DESIGN (14) =========================== */

INFRA.topQuestions.push({
  id: "top-design-rate-limiter",
  cat: "design",
  level: "senior",
  companies: ["Google", "Amazon", "Stripe", "Cloudflare", "Uber"],
  q: { en: "Design a distributed rate limiter for a public API that handles 1M requests per second.",
       he: "תתכנן rate limiter מבוזר ל-API ציבורי שמקבל מיליון בקשות בשנייה." },
  signal: { en: "Can you pick an algorithm on purpose (token bucket vs sliding window), keep the hot path fast, and reason about what happens when the limiter itself fails?",
            he: "האם אתה בוחר אלגוריתם בכוונה (token bucket מול sliding window), שומר על ה-hot path מהיר, ויודע להסביר מה קורה כשה-limiter עצמו נופל?" },
  outline: {
    en: "<ol><li>Clarify: limit per user / API key / IP? Hard or soft limit? Global or per region? What response (429 + Retry-After)?</li><li>Algorithm: token bucket (allows bursts, 2 numbers per key) vs sliding-window counter (smooth, cheap approximation). Fixed window has a 2x burst at the boundary.</li><li>Placement: in the API gateway / sidecar so every service gets it for free.</li><li>State: Redis cluster sharded by key; atomic check-and-decrement in a Lua script; TTL on keys. ~1M keys x ~100 B = ~100 MB, trivial.</li><li>Latency: one Redis round trip is ~0.5-1 ms in-region; for very hot keys use a local token cache and sync every ~100 ms (accept ~1-5% overshoot).</li><li>Failure mode: if Redis is down, fail open for most APIs (availability) but fail closed for abuse-sensitive ones (login, payments).</li><li>Multi-region: per-region limits with budget split, or async counter replication; strict global limits cost a cross-region round trip (~70 ms+).</li><li>Observability: emit 429 rate per key/tier, and return X-RateLimit-Remaining headers.</li></ol>",
    he: "<ol><li>הבהרות: limit לפי user / API key / IP? limit קשיח או רך? גלובלי או per region? מה מחזירים (429 + Retry-After)?</li><li>אלגוריתם: token bucket (מאפשר bursts, 2 מספרים לכל key) מול sliding-window counter (חלק, קירוב זול). ל-fixed window יש burst כפול בגבול החלון.</li><li>מיקום: ב-API gateway / sidecar, כך שכל service מקבל את זה בחינם.</li><li>State: Redis cluster מחולק לפי key; check-and-decrement אטומי בסקריפט Lua; TTL על ה-keys. מיליון keys כפול ~100 bytes = ~100 MB, זניח.</li><li>Latency: round trip ל-Redis באותו region זה ~0.5-1 ms; ל-keys חמים מאוד מחזיקים token cache מקומי ומסנכרנים כל ~100 ms (מקבלים חריגה של ~1-5%).</li><li>Failure mode: אם Redis נפל, fail open לרוב ה-APIs (זמינות), אבל fail closed ל-APIs רגישים ל-abuse (login, תשלומים).</li><li>Multi-region: limit לכל region עם חלוקת budget, או רפליקציה אסינכרונית של counters; limit גלובלי מדויק עולה round trip בין regions (~70 ms ומעלה).</li><li>Observability: מוציאים metric של 429 לפי key/tier, ומחזירים headers כמו X-RateLimit-Remaining.</li></ol>"
  },
  levelUp: { en: "Staff answers treat the limiter as load-shedding infrastructure: priority tiers, adaptive limits driven by backend health, and how it prevents retry storms, not just a counter per user.",
             he: "תשובת Staff מתייחסת ל-limiter כתשתית load shedding: tiers של עדיפות, limits אדפטיביים לפי בריאות ה-backend, ואיך זה מונע retry storms, לא רק counter לכל משתמש." },
  links: ["#/interview/design/sd-rate-limiter", "#/interview/code/rate-limiter-token-bucket", "#/lesson/arch-resilience"]
});

INFRA.topQuestions.push({
  id: "top-design-distributed-cache",
  cat: "design",
  level: "senior",
  companies: ["Amazon", "Meta", "Google", "Netflix", "Microsoft"],
  q: { en: "Design a distributed cache (like Memcached or Redis Cluster) in front of a database serving 500K reads per second.",
       he: "תתכנן cache מבוזר (בסגנון Memcached או Redis Cluster) מול database שמשרת 500 אלף קריאות בשנייה." },
  signal: { en: "Partitioning, eviction and the consistency story between cache and DB, plus the failure modes that actually take sites down: hot keys, thundering herds and cold caches.",
            he: "חלוקה (partitioning), eviction וסיפור ה-consistency בין ה-cache ל-DB, ובנוסף ה-failure modes שבאמת מפילים אתרים: hot keys, thundering herd ו-cache קר." },
  outline: {
    en: "<ol><li>Clarify: read/write ratio, value size, staleness tolerance, hit-ratio target (e.g. 95%+).</li><li>Sizing: 500K rps, 1 KB values, 200 GB working set means ~10 nodes of 32 GB with headroom; one node does ~100K+ ops/s.</li><li>Partitioning: consistent hashing with virtual nodes (~100-200 per node) so adding a node moves ~1/N of keys.</li><li>Pattern: cache-aside with TTL; on write, update DB then delete the key (not set) to avoid races.</li><li>Eviction: LRU / approximate LRU; mention LFU for skewed workloads.</li><li>Hot keys and stampede: request coalescing (single-flight), jittered TTLs, local L1 cache for the top keys, key replication.</li><li>Availability: replicas per shard; a cold cache after failover can melt the DB, so warm up or rate-limit misses.</li><li>Metrics: hit ratio, p99 latency, evictions/s, memory fragmentation.</li></ol>",
    he: "<ol><li>הבהרות: יחס קריאה/כתיבה, גודל value, כמה staleness מותר, יעד hit ratio (למשל 95% ומעלה).</li><li>Sizing: 500K rps, values של 1 KB, working set של 200 GB, כלומר ~10 nodes של 32 GB עם מרווח; node אחד עושה 100K+ ops/s.</li><li>Partitioning: consistent hashing עם virtual nodes (~100-200 לכל node), כך שהוספת node מזיזה רק ~1/N מה-keys.</li><li>Pattern: cache-aside עם TTL; בכתיבה מעדכנים DB ואז מוחקים את ה-key (לא set) כדי למנוע race.</li><li>Eviction: LRU או LRU מקורב; להזכיר LFU לעומסים מוטים.</li><li>Hot keys ו-stampede: request coalescing (single-flight), TTL עם jitter, L1 cache מקומי ל-keys הכי חמים, שכפול keys.</li><li>זמינות: replicas לכל shard; cache קר אחרי failover יכול להמיס את ה-DB, אז עושים warm-up או rate limit על misses.</li><li>Metrics: hit ratio, p99 latency, evictions/s, memory fragmentation.</li></ol>"
  },
  levelUp: { en: "Staff candidates discuss invalidation at scale (CDC-driven invalidation, lease tokens as in Meta's memcache paper) and what the DB must survive if the cache disappears entirely.",
             he: "מועמד Staff מדבר על invalidation בסקייל (invalidation מבוסס CDC, lease tokens כמו במאמר של Meta על memcache) ועל מה ה-DB צריך לשרוד אם ה-cache נעלם לגמרי." },
  links: ["#/lesson/caching-deep", "#/lesson/redis-deep", "#/lesson/arch-caching", "#/interview/code/consistent-hashing"]
});

INFRA.topQuestions.push({
  id: "top-design-kv-store",
  cat: "design",
  level: "staff",
  companies: ["Amazon", "Google", "Microsoft", "Apple"],
  q: { en: "Design a highly available distributed key-value store (think Dynamo / Cassandra).",
       he: "תתכנן key-value store מבוזר עם זמינות גבוהה (בסגנון Dynamo / Cassandra)." },
  signal: { en: "Do you really understand replication, quorums and the CAP / PACELC trade-offs, and can you explain how the system heals itself after failures?",
            he: "האם אתה באמת מבין replication, quorums ואת ה-trade-offs של CAP / PACELC, ויודע להסביר איך המערכת מרפאת את עצמה אחרי תקלות?" },
  outline: {
    en: "<ol><li>API: get(key), put(key, value); clarify value size (&lt;1 MB), consistency needs and latency target (p99 &lt; 10 ms).</li><li>Partitioning: consistent hashing ring with virtual nodes; preference list of N=3 replicas across AZs.</li><li>Quorums: R + W &gt; N for read-your-writes (e.g. N=3, W=2, R=2); W=1/R=1 for latency at the cost of staleness.</li><li>Conflicts: last-write-wins with timestamps (simple, loses data) vs vector clocks / CRDTs (correct, complex).</li><li>Failure handling: sloppy quorum + hinted handoff for temporary failures; anti-entropy with Merkle trees for permanent divergence; read repair.</li><li>Membership: gossip protocol + failure detection (phi accrual).</li><li>Storage engine: LSM tree (memtable + WAL + SSTables + compaction) for write-heavy loads; bloom filters for reads.</li></ol>",
    he: "<ol><li>API: get(key), put(key, value); להבהיר גודל value (&lt;1 MB), צרכי consistency ויעד latency (p99 &lt; 10 ms).</li><li>Partitioning: טבעת consistent hashing עם virtual nodes; preference list של N=3 replicas על פני AZs.</li><li>Quorums: R + W &gt; N בשביל read-your-writes (למשל N=3, W=2, R=2); W=1/R=1 בשביל latency על חשבון staleness.</li><li>קונפליקטים: last-write-wins עם timestamps (פשוט, מאבד מידע) מול vector clocks / CRDTs (נכון, מורכב).</li><li>טיפול בתקלות: sloppy quorum + hinted handoff לתקלות זמניות; anti-entropy עם Merkle trees לסטייה קבועה; read repair.</li><li>Membership: gossip protocol + failure detection (phi accrual).</li><li>Storage engine: LSM tree (memtable + WAL + SSTables + compaction) לעומסי כתיבה; bloom filters לקריאות.</li></ol>"
  },
  levelUp: { en: "Principal-level answers pick consistency per use case, explain when you'd choose a Raft-based strongly consistent store instead, and cover operability: rebalancing without hurting p99, compaction debt, multi-tenant noisy neighbors.",
             he: "תשובה ברמת Principal בוחרת consistency לפי use case, מסבירה מתי היית בוחר store חזק-עקבי מבוסס Raft במקום, ומכסה תפעול: rebalancing בלי לפגוע ב-p99, חוב compaction, ו-noisy neighbors ב-multi-tenant." },
  links: ["#/lesson/staff-consensus-consistency", "#/lesson/db-replication", "#/lesson/db-cap", "#/lesson/infra-data-structures"]
});

INFRA.topQuestions.push({
  id: "top-design-url-shortener",
  cat: "design",
  level: "senior",
  companies: ["Google", "Amazon", "Microsoft", "Meta"],
  q: { en: "Design a URL shortener like bit.ly.",
       he: "תתכנן שירות קיצור URL כמו bit.ly." },
  signal: { en: "A warm-up: they check structure, back-of-envelope math and whether you go deep on ID generation and the read path instead of drawing boxes.",
            he: "שאלת חימום: בודקים מבנה, חישובי מעטפה, והאם אתה צולל ל-ID generation ול-read path במקום לצייר קופסאות." },
  outline: {
    en: "<ol><li>Requirements: create short link, redirect, optional custom alias and expiry; ~100M new URLs/day, 100:1 read/write.</li><li>Math: ~1.2K writes/s, ~120K reads/s peak; 7 base62 chars = 3.5 trillion codes; 5 years x 36B rows x 500 B = ~18 TB.</li><li>ID generation: counter ranges handed out per server (no collisions, no coordination per request) or hash + collision check; avoid sequential IDs if guessability matters.</li><li>Storage: KV store (DynamoDB / Cassandra) keyed by code.</li><li>Read path: CDN / edge + Redis cache; 80/20 means a small cache gives a high hit ratio. 301 (cacheable) vs 302 (count every click).</li><li>Analytics: emit click events to Kafka asynchronously; never block the redirect.</li><li>Abuse: rate limit creation, scan for malware links.</li></ol>",
    he: "<ol><li>דרישות: יצירת קישור קצר, redirect, alias מותאם ותפוגה כאופציה; ~100 מיליון URLs חדשים ביום, יחס קריאה/כתיבה 100:1.</li><li>חישוב: ~1.2K כתיבות/s, ~120K קריאות/s בשיא; 7 תווי base62 = 3.5 טריליון קודים; 5 שנים x 36 מיליארד שורות x 500 bytes = ~18 TB.</li><li>ID generation: טווחי counter שמחולקים לכל שרת (בלי התנגשויות ובלי תיאום לכל בקשה) או hash + בדיקת התנגשות; להימנע מ-IDs רציפים אם חשוב שלא יהיה ניתן לנחש.</li><li>Storage: KV store (DynamoDB / Cassandra) לפי code.</li><li>Read path: CDN / edge + Redis cache; חוק 80/20 אומר ש-cache קטן נותן hit ratio גבוה. 301 (נשמר ב-cache) מול 302 (סופרים כל קליק).</li><li>Analytics: שולחים click events ל-Kafka אסינכרונית; אף פעם לא חוסמים את ה-redirect.</li><li>Abuse: rate limit על יצירה, סריקת קישורים זדוניים.</li></ol>"
  },
  levelUp: { en: "At Staff level, finish the basics in 10 minutes and spend the rest on multi-region ID allocation, cache stampedes on viral links, and data lifecycle (expiry, GDPR deletion).",
             he: "ברמת Staff מסיימים את הבסיס ב-10 דקות ומשקיעים את השאר ב-ID allocation מרובה regions, cache stampede על קישורים ויראליים, ומחזור חיי המידע (תפוגה, מחיקה לפי GDPR)." },
  links: ["#/interview/design/sd-url-shortener", "#/interview/design/sd-framework", "#/lesson/arch-caching"]
});

INFRA.topQuestions.push({
  id: "top-design-news-feed",
  cat: "design",
  level: "senior",
  companies: ["Meta", "LinkedIn", "Google", "Microsoft"],
  q: { en: "Design the news feed for a social network with 500M daily active users.",
       he: "תתכנן את ה-news feed של רשת חברתית עם 500 מיליון משתמשים פעילים ביום." },
  signal: { en: "The fan-out trade-off (push vs pull vs hybrid) and whether you handle celebrities, ranking and freshness without blowing up storage or latency.",
            he: "ה-trade-off של fan-out (push מול pull מול hybrid), והאם אתה מטפל בסלבריטאים, ranking ו-freshness בלי לפוצץ storage או latency." },
  outline: {
    en: "<ol><li>Scope: post, view feed (ranked or chronological), follow graph; feed load p99 &lt; 200 ms.</li><li>Math: 500M DAU x 10 feed loads = ~60K reads/s average, ~150K peak; ~5K posts/s.</li><li>Fan-out on write: push post IDs into each follower's feed cache (fast reads, expensive for users with 10M followers).</li><li>Fan-out on read: merge followees' recent posts at read time (cheap writes, slow reads).</li><li>Hybrid: push for normal users, pull for celebrities (&gt;~100K followers), merge at read.</li><li>Storage: posts in a sharded DB/KV, feed lists in Redis (store only IDs, ~800 per user), media on object storage + CDN.</li><li>Ranking: candidate generation, then a ranking service with features; cache the ranked page.</li><li>Async: fan-out workers consume a Kafka topic; retries and idempotency.</li></ol>",
    he: "<ol><li>Scope: פרסום פוסט, צפייה ב-feed (מדורג או כרונולוגי), גרף עוקבים; טעינת feed ב-p99 &lt; 200 ms.</li><li>חישוב: 500M DAU x 10 טעינות = ~60K קריאות/s בממוצע, ~150K בשיא; ~5K פוסטים/s.</li><li>Fan-out on write: דוחפים post IDs ל-feed cache של כל עוקב (קריאות מהירות, יקר למשתמש עם 10 מיליון עוקבים).</li><li>Fan-out on read: ממזגים פוסטים אחרונים של מי שעוקבים אחריו בזמן הקריאה (כתיבה זולה, קריאה איטית).</li><li>Hybrid: push למשתמשים רגילים, pull לסלבריטאים (מעל ~100K עוקבים), מיזוג בזמן קריאה.</li><li>Storage: פוסטים ב-DB/KV מחולק, רשימות feed ב-Redis (רק IDs, ~800 למשתמש), מדיה ב-object storage + CDN.</li><li>Ranking: candidate generation ואז ranking service עם features; שומרים את הדף המדורג ב-cache.</li><li>אסינכרוני: fan-out workers צורכים topic ב-Kafka; retries ו-idempotency.</li></ol>"
  },
  levelUp: { en: "Staff answers quantify the cost of each fan-out strategy, design for regional failover of feed caches, and talk about backfill when ranking models or the graph change.",
             he: "תשובת Staff מכמתת את העלות של כל אסטרטגיית fan-out, מתכננת failover אזורי ל-feed caches, ומדברת על backfill כשמודל ה-ranking או הגרף משתנים." },
  links: ["#/interview/design/sd-news-feed", "#/lesson/arch-event-driven", "#/lesson/arch-caching"]
});

INFRA.topQuestions.push({
  id: "top-design-chat",
  cat: "design",
  level: "senior",
  companies: ["Meta", "Microsoft", "Amazon", "Uber"],
  q: { en: "Design a chat system like WhatsApp or Messenger: 1:1 and group chats, online presence, delivery receipts.",
       he: "תתכנן מערכת צ'אט כמו WhatsApp או Messenger: שיחות 1:1 וקבוצות, נוכחות online ואישורי מסירה." },
  signal: { en: "Long-lived connections at scale, message ordering and delivery guarantees, and offline handling.",
            he: "חיבורים ארוכים בסקייל, סדר הודעות ו-delivery guarantees, וטיפול במשתמשים offline." },
  outline: {
    en: "<ol><li>Transport: WebSockets to stateless-ish gateway servers; ~500K-1M connections per tuned box, so 100M concurrent users = 100-200 gateways.</li><li>Routing: session registry (user -&gt; gateway) in Redis; chat service looks it up and forwards.</li><li>Ordering: per-conversation sequence number assigned by the conversation's owner shard; clients reorder by it.</li><li>Delivery: at-least-once with client-generated message IDs for dedup; sent / delivered / read acks.</li><li>Storage: messages in a wide-column store (Cassandra / HBase) partitioned by conversation_id, clustered by seq.</li><li>Offline: store, then push notification (APNs/FCM); sync from last seen seq on reconnect.</li><li>Groups: fan-out on write for small groups (&lt;~500), read-time fetch for huge channels.</li><li>Presence: heartbeats every ~30 s, TTL keys; publish changes only to interested contacts.</li></ol>",
    he: "<ol><li>Transport: WebSockets ל-gateway servers כמעט stateless; ~500K-1M חיבורים לשרת מכוונן, אז 100 מיליון משתמשים מחוברים = 100-200 gateways.</li><li>Routing: session registry (user -&gt; gateway) ב-Redis; ה-chat service בודק שם ומעביר.</li><li>סדר: sequence number לכל שיחה שנקבע ע״י ה-shard שאחראי על השיחה; הלקוחות מסדרים לפיו.</li><li>מסירה: at-least-once עם message ID שהלקוח מייצר בשביל dedup; acks של sent / delivered / read.</li><li>Storage: הודעות ב-wide-column store (Cassandra / HBase) מחולק לפי conversation_id וממוין לפי seq.</li><li>Offline: שומרים ואז שולחים push notification (APNs/FCM); בחיבור מחדש מסנכרנים מה-seq האחרון שנראה.</li><li>קבוצות: fan-out on write לקבוצות קטנות (פחות מ-~500), שליפה בזמן קריאה לערוצים ענקיים.</li><li>Presence: heartbeat כל ~30 שניות, keys עם TTL; מפרסמים שינויים רק לאנשי קשר רלוונטיים.</li></ol>"
  },
  levelUp: { en: "Staff answers cover gateway deploys without dropping millions of sockets (connection draining, reconnect jitter), end-to-end encryption implications, and multi-region message routing.",
             he: "תשובת Staff מכסה deploy של gateways בלי להפיל מיליוני sockets (connection draining, jitter בחיבור מחדש), השלכות של end-to-end encryption, ו-routing של הודעות בין regions." },
  links: ["#/interview/design/sd-chat", "#/lesson/net-load-balancing", "#/lesson/staff-time-ordering"]
});

INFRA.topQuestions.push({
  id: "top-design-metrics",
  cat: "design",
  level: "staff",
  companies: ["Datadog", "Google", "Netflix", "Uber"],
  q: { en: "Design a metrics and monitoring system (like Prometheus / Datadog) ingesting 10M data points per second.",
       he: "תתכנן מערכת metrics וניטור (כמו Prometheus / Datadog) שקולטת 10 מיליון data points בשנייה." },
  signal: { en: "Time-series specifics: cardinality, compression, downsampling, and keeping the alerting path reliable when ingestion is behind.",
            he: "הייחודיות של time series: cardinality, דחיסה, downsampling, ושמירה על אמינות מסלול ה-alerting כשה-ingestion מפגר." },
  outline: {
    en: "<ol><li>Clarify: push vs pull, retention (e.g. 15 days raw, 13 months downsampled), query latency, multi-tenant?</li><li>Ingestion: agents batch and push to a stateless ingest tier, then Kafka as a buffer.</li><li>Storage: TSDB partitioned by series hash and time blocks; Gorilla compression gets ~1.4 bytes per point, so 10M pts/s is ~1.2 TB/day raw.</li><li>Cardinality: the real enemy. Per-tenant series limits, reject high-cardinality labels (user_id, request_id).</li><li>Downsampling: 10 s -&gt; 1 min -&gt; 1 h rollups; old blocks to object storage (Thanos/Mimir style).</li><li>Query: fan-out to shards, merge; cache recent results.</li><li>Alerting: rule evaluator separate from dashboards, reading recent in-memory data; alert on missing data too.</li><li>Meta-monitoring: who watches the watcher? A tiny independent stack.</li></ol>",
    he: "<ol><li>הבהרות: push או pull, retention (למשל 15 יום raw, 13 חודשים אחרי downsampling), latency של queries, multi-tenant?</li><li>Ingestion: agents מקבצים ודוחפים ל-ingest tier stateless, ואחר כך Kafka כ-buffer.</li><li>Storage: TSDB מחולק לפי hash של ה-series ובלוקים של זמן; דחיסת Gorilla נותנת ~1.4 bytes לנקודה, כלומר 10M נקודות/s זה ~1.2 TB ביום raw.</li><li>Cardinality: האויב האמיתי. limit על מספר series לכל tenant, חוסמים labels עם cardinality גבוה (user_id, request_id).</li><li>Downsampling: rollups של 10 s -&gt; 1 min -&gt; 1 h; בלוקים ישנים ל-object storage (בסגנון Thanos/Mimir).</li><li>Query: fan-out ל-shards ומיזוג; cache לתוצאות אחרונות.</li><li>Alerting: rule evaluator נפרד מהדשבורדים, קורא נתונים טריים מהזיכרון; מתריעים גם על חוסר נתונים.</li><li>Meta-monitoring: מי שומר על השומר? stack קטן ועצמאי.</li></ol>"
  },
  levelUp: { en: "Principal-level: cost per series as a product lever, tenant isolation (one customer's cardinality explosion must not page everyone), and how logs, traces and metrics correlate.",
             he: "ברמת Principal: עלות לכל series ככלי מוצרי, בידוד tenants (פיצוץ cardinality של לקוח אחד לא יכול להעיר את כולם), ואיך logs, traces ו-metrics מתחברים." },
  links: ["#/interview/design/sd-metrics-platform", "#/interview/design/sd-observability-at-scale", "#/lesson/obs-metrics"]
});

INFRA.topQuestions.push({
  id: "top-design-logging",
  cat: "design",
  level: "senior",
  companies: ["Datadog", "Amazon", "Microsoft", "Cloudflare"],
  q: { en: "Design a centralized logging pipeline for 5,000 services producing 2 TB of logs per day.",
       he: "תתכנן pipeline מרכזי ל-logs עבור 5,000 services שמייצרים 2 TB של logs ביום." },
  signal: { en: "Buffering and backpressure, hot/cold tiering, and cost awareness: logs are usually the most expensive observability signal.",
            he: "Buffering ו-backpressure, חלוקה ל-hot/cold, ומודעות לעלות: logs הם בדרך כלל ה-signal הכי יקר ב-observability." },
  outline: {
    en: "<ol><li>Collection: node agent (Fluent Bit / Vector) tails files, adds k8s metadata, batches and compresses (~5-10x).</li><li>Buffer: Kafka between agents and indexers absorbs spikes and indexer outages; size for hours of retention.</li><li>Processing: parse, enrich, drop debug noise, redact PII before storage.</li><li>Hot tier: indexed search (Elasticsearch/OpenSearch or Loki-style label index) for ~7 days.</li><li>Cold tier: compressed objects in S3/GCS for months, queryable on demand; ~2 TB/day x 90 days compressed is cheap.</li><li>Backpressure: agents buffer to local disk with a cap; drop lowest-priority logs first, never block the app.</li><li>Multi-tenant: per-team quotas and showback so volume has an owner.</li></ol>",
    he: "<ol><li>איסוף: agent על כל node (Fluent Bit / Vector) קורא קבצים, מוסיף metadata של k8s, מקבץ ודוחס (~5-10x).</li><li>Buffer: Kafka בין ה-agents ל-indexers סופג קפיצות ונפילות של indexers; גודל שמחזיק כמה שעות.</li><li>עיבוד: parsing, העשרה, זריקת רעש debug, והסתרת PII לפני שמירה.</li><li>Hot tier: חיפוש עם אינדקס (Elasticsearch/OpenSearch או אינדקס labels בסגנון Loki) לכ-7 ימים.</li><li>Cold tier: אובייקטים דחוסים ב-S3/GCS לחודשים, ניתנים ל-query לפי דרישה; 2 TB ביום x 90 יום דחוס זה זול.</li><li>Backpressure: ה-agents שומרים buffer על דיסק מקומי עם תקרה; זורקים קודם logs בעדיפות נמוכה, ואף פעם לא חוסמים את האפליקציה.</li><li>Multi-tenant: quotas לכל צוות ו-showback, כך שלנפח יש בעלים.</li></ol>"
  },
  levelUp: { en: "Staff answers push structured logging and sampling as org-wide standards, and replace 'log everything' with metrics + traces where they are 10-100x cheaper.",
             he: "תשובת Staff דוחפת structured logging ו-sampling כסטנדרט ארגוני, ומחליפה את 'נרשום הכל' ב-metrics ו-traces במקומות שבהם הם זולים פי 10-100." },
  links: ["#/interview/design/sd-logging-pipeline", "#/lesson/obs-logs", "#/lesson/arch-queues"]
});

INFRA.topQuestions.push({
  id: "top-design-job-scheduler",
  cat: "design",
  level: "staff",
  companies: ["Google", "Amazon", "Netflix", "Uber", "Airbnb"],
  q: { en: "Design a distributed job scheduler (cron at scale) that runs millions of scheduled and one-off jobs per day.",
       he: "תתכנן distributed job scheduler (cron בסקייל) שמריץ מיליוני jobs מתוזמנים וחד-פעמיים ביום." },
  signal: { en: "Exactly-once is a trap: they want leases, idempotency, and a clear answer to 'what if the scheduler node dies mid-job?'.",
            he: "Exactly-once זו מלכודת: רוצים לשמוע על leases, idempotency, ותשובה ברורה ל'מה קורה אם node של ה-scheduler מת באמצע job?'." },
  outline: {
    en: "<ol><li>Clarify: precision (seconds vs minutes), max job runtime, retries, priorities, DAG dependencies?</li><li>Store: jobs table with next_run_at indexed; partition by job_id hash so many scheduler instances share the load.</li><li>Trigger: each partition owner polls due jobs (SELECT ... FOR UPDATE SKIP LOCKED or a time-bucketed queue) and enqueues them.</li><li>Execution: workers pull from a queue; lease with heartbeat (e.g. 30 s); expired lease means another worker can retry.</li><li>Semantics: at-least-once delivery + idempotency keys in the job = effectively-once.</li><li>Thundering herd at :00: add jitter, spread cron at minute 0 across the minute.</li><li>Ops: per-tenant quotas, DLQ after N retries, run history, alert on missed schedules.</li></ol>",
    he: "<ol><li>הבהרות: דיוק (שניות או דקות), זמן ריצה מקסימלי, retries, עדיפויות, תלויות DAG?</li><li>Store: טבלת jobs עם אינדקס על next_run_at; partition לפי hash של job_id כדי שהרבה מופעי scheduler יחלקו את העומס.</li><li>Trigger: הבעלים של כל partition שולף jobs שהגיע זמנם (SELECT ... FOR UPDATE SKIP LOCKED או תור מחולק לפי דליי זמן) ומכניס לתור.</li><li>Execution: workers שולפים מהתור; lease עם heartbeat (למשל 30 שניות); lease שפג אומר ש-worker אחר יכול לנסות שוב.</li><li>סמנטיקה: at-least-once delivery + idempotency keys בתוך ה-job = בפועל effectively-once.</li><li>Thundering herd בשעה עגולה: מוסיפים jitter ומפזרים את כל ה-cron של דקה 0 לאורך הדקה.</li><li>תפעול: quotas לכל tenant, DLQ אחרי N retries, היסטוריית ריצות, alert על תזמונים שהוחמצו.</li></ol>"
  },
  levelUp: { en: "Staff answers separate control plane from data plane, discuss leader election and fencing tokens to avoid two owners, and plan how to migrate thousands of existing crontabs onto it.",
             he: "תשובת Staff מפרידה control plane מ-data plane, מדברת על leader election ו-fencing tokens כדי שלא יהיו שני בעלים, ומתכננת איך להעביר אליו אלפי crontabs קיימים." },
  links: ["#/interview/design/sd-distributed-job-scheduler", "#/lesson/staff-exactly-once", "#/lesson/arch-queues"]
});

INFRA.topQuestions.push({
  id: "top-design-multi-region",
  cat: "design",
  level: "staff",
  companies: ["Netflix", "Amazon", "Google", "Stripe", "Microsoft"],
  q: { en: "Take a single-region service and make it survive the loss of an entire region. Walk me through it.",
       he: "יש service שרץ ב-region אחד. תהפוך אותו לכזה ששורד אובדן של region שלם. תעביר אותי דרך התהליך." },
  signal: { en: "Whether you can turn RPO/RTO targets into a concrete data strategy and an exercised failover, and whether you count the cost.",
            he: "האם אתה יודע לתרגם יעדי RPO/RTO לאסטרטגיית data קונקרטית ול-failover שמתורגל בפועל, והאם אתה סופר את העלות." },
  outline: {
    en: "<ol><li>Start from targets: RPO (data loss allowed) and RTO (downtime allowed) per service tier; they drive everything.</li><li>Options: backup/restore (hours) -&gt; pilot light -&gt; warm standby (minutes) -&gt; active-active (seconds, ~2x cost).</li><li>Stateless tier: deploy everywhere, global LB / GeoDNS with health checks; DNS TTL 30-60 s.</li><li>Data: async replication (RPO = replication lag, seconds) vs sync / consensus across regions (RPO 0, +~70-100 ms per write).</li><li>Active-active writes: partition users by home region, or use CRDTs / conflict resolution; avoid multi-master on the same row.</li><li>Dependencies: every dependency (auth, config, secrets, queues) must be regional too, or the failover fails.</li><li>Capacity: each surviving region needs headroom to absorb the failed one's traffic (N+1).</li><li>Prove it: regular game days and real traffic evacuations.</li></ol>",
    he: "<ol><li>מתחילים מיעדים: RPO (כמה data מותר לאבד) ו-RTO (כמה downtime מותר) לכל tier של service; הם מכתיבים הכל.</li><li>אפשרויות: backup/restore (שעות) -&gt; pilot light -&gt; warm standby (דקות) -&gt; active-active (שניות, פי ~2 בעלות).</li><li>שכבה stateless: פורסים בכל מקום, global LB / GeoDNS עם health checks; DNS TTL של 30-60 שניות.</li><li>Data: replication אסינכרונית (RPO = replication lag, שניות) מול sync / consensus בין regions (RPO 0, תוספת של ~70-100 ms לכל כתיבה).</li><li>כתיבות active-active: לחלק משתמשים לפי home region, או CRDTs / conflict resolution; להימנע מ-multi-master על אותה שורה.</li><li>תלויות: כל תלות (auth, config, secrets, תורים) חייבת להיות אזורית גם היא, אחרת ה-failover נכשל.</li><li>Capacity: כל region ששורד צריך headroom לספוג את התנועה של זה שנפל (N+1).</li><li>להוכיח: game days קבועים ופינוי תנועה אמיתי.</li></ol>"
  },
  levelUp: { en: "Principal answers reason about correlated failure domains (control planes, global config pushes), cell-based architecture to shrink blast radius, and the business case for which tiers get active-active.",
             he: "תשובת Principal מדברת על failure domains מתואמים (control planes, דחיפת config גלובלית), ארכיטקטורת cells כדי להקטין blast radius, וה-business case לאילו tiers מגיע active-active." },
  links: ["#/interview/design/sd-multi-region", "#/lesson/staff-multi-region-data", "#/lesson/rel-bcdr", "#/oncall/region-down"]
});

INFRA.topQuestions.push({
  id: "top-design-cicd",
  cat: "design",
  level: "staff",
  companies: ["Google", "Meta", "Netflix", "Microsoft", "Uber"],
  q: { en: "Design a CI/CD and deployment system for 2,000 engineers shipping hundreds of deploys per day.",
       he: "תתכנן מערכת CI/CD ו-deploy ל-2,000 מהנדסים שמשחררים מאות deploys ביום." },
  signal: { en: "Developer velocity and safety together: fast builds, progressive delivery with automatic rollback, and guardrails that do not need a human gate.",
            he: "מהירות פיתוח ובטיחות יחד: builds מהירים, progressive delivery עם rollback אוטומטי, ו-guardrails שלא צריכים שער אנושי." },
  outline: {
    en: "<ol><li>Goals: commit-to-prod lead time (e.g. &lt; 1 h), change failure rate, MTTR (DORA metrics).</li><li>CI: ephemeral autoscaled runners, remote build cache (Bazel-style), test sharding; target PR feedback &lt; 10 min.</li><li>Artifacts: immutable, signed images (provenance / SBOM) in a registry; build once, promote everywhere.</li><li>CD: GitOps or a deploy orchestrator; environments dev -&gt; staging -&gt; prod.</li><li>Progressive delivery: canary 1% -&gt; 10% -&gt; 50% -&gt; 100% with automated analysis on error rate and latency vs baseline.</li><li>Auto-rollback on SLO burn; deploy freezes when the error budget is exhausted.</li><li>Safety: deploy by zone/cell, never all regions at once; feature flags decouple deploy from release.</li></ol>",
    he: "<ol><li>יעדים: lead time מ-commit ל-prod (למשל פחות משעה), change failure rate, MTTR (מדדי DORA).</li><li>CI: runners זמניים עם autoscaling, remote build cache (בסגנון Bazel), sharding של טסטים; יעד feedback ל-PR בפחות מ-10 דקות.</li><li>Artifacts: images חתומים ובלתי משתנים (provenance / SBOM) ב-registry; build פעם אחת, promote לכל מקום.</li><li>CD: GitOps או deploy orchestrator; סביבות dev -&gt; staging -&gt; prod.</li><li>Progressive delivery: canary של 1% -&gt; 10% -&gt; 50% -&gt; 100% עם ניתוח אוטומטי של error rate ו-latency מול baseline.</li><li>Rollback אוטומטי כשה-SLO נשרף; deploy freeze כשה-error budget נגמר.</li><li>בטיחות: deploy לפי zone/cell, אף פעם לא לכל ה-regions בבת אחת; feature flags מפרידים deploy מ-release.</li></ol>"
  },
  levelUp: { en: "Staff answers treat the pipeline as a product with paved roads and adoption metrics, and design for the monorepo vs polyrepo and supply-chain security trade-offs.",
             he: "תשובת Staff מתייחסת ל-pipeline כמוצר עם paved roads ומדדי אימוץ, ומתכננת את ה-trade-offs של monorepo מול polyrepo ושל אבטחת supply chain." },
  links: ["#/interview/design/sd-ci-cd-platform", "#/lesson/rel-deployments", "#/lesson/k8s-argo-rollouts", "#/lesson/staff-supply-chain"]
});

INFRA.topQuestions.push({
  id: "top-design-k8s-platform",
  cat: "design",
  level: "staff",
  companies: ["Google", "Apple", "Nvidia", "Datadog", "Airbnb"],
  q: { en: "Design an internal Kubernetes platform for 300 teams. How many clusters, how is tenancy handled, how do teams onboard?",
       he: "תתכנן פלטפורמת Kubernetes פנימית ל-300 צוותים. כמה clusters, איך מטפלים ב-tenancy, איך צוותים עולים עליה?" },
  signal: { en: "Platform-as-product thinking: cluster topology vs blast radius, multi-tenancy isolation, upgrades and cost, not just kubectl knowledge.",
            he: "חשיבת platform-as-product: טופולוגיית clusters מול blast radius, בידוד multi-tenancy, upgrades ועלות, לא רק ידע ב-kubectl." },
  outline: {
    en: "<ol><li>Topology: few large shared clusters (efficient, bigger blast radius) vs many small ones (isolated, more ops); common answer: per region x per environment, plus dedicated clusters for special workloads (GPU, PCI).</li><li>Tenancy: namespace per team/service, RBAC, ResourceQuotas and LimitRanges, NetworkPolicies default-deny, Pod Security admission.</li><li>Golden path: templates / Helm charts, GitOps (Argo CD) with an app-of-apps per team; self-service onboarding in minutes.</li><li>Policy: admission control (OPA Gatekeeper / Kyverno) for signed images, required labels, no privileged pods.</li><li>Scaling: HPA + cluster autoscaler / Karpenter; requests right-sizing to keep utilization ~50-60%+.</li><li>Day 2: rolling cluster upgrades every ~3-4 months (K8s release cadence), blue/green clusters for risky ones.</li><li>Cost: showback per namespace (requests x price).</li></ol>",
    he: "<ol><li>טופולוגיה: מעט clusters גדולים ומשותפים (יעיל, blast radius גדול) מול הרבה קטנים (מבודד, יותר תפעול); תשובה נפוצה: לכל region x סביבה, ועוד clusters ייעודיים לעומסים מיוחדים (GPU, PCI).</li><li>Tenancy: namespace לכל צוות/service, RBAC, ResourceQuotas ו-LimitRanges, NetworkPolicies של default-deny, Pod Security admission.</li><li>Golden path: templates / Helm charts, GitOps (Argo CD) עם app-of-apps לכל צוות; onboarding עצמאי בדקות.</li><li>Policy: admission control (OPA Gatekeeper / Kyverno) ל-images חתומים, labels חובה, בלי pods privileged.</li><li>Scaling: HPA + cluster autoscaler / Karpenter; right-sizing של requests כדי לשמור על ניצולת של 50-60% ומעלה.</li><li>Day 2: rolling upgrade ל-clusters כל ~3-4 חודשים (קצב השחרורים של K8s), blue/green clusters לשדרוגים מסוכנים.</li><li>עלות: showback לכל namespace (requests x מחיר).</li></ol>"
  },
  levelUp: { en: "Principal answers define the platform's contract (what teams own vs what the platform owns), success metrics like time-to-first-deploy, and a deprecation strategy for old APIs across 300 teams.",
             he: "תשובת Principal מגדירה את החוזה של הפלטפורמה (מה בבעלות הצוותים ומה בבעלות הפלטפורמה), מדדי הצלחה כמו time-to-first-deploy, ואסטרטגיית deprecation ל-APIs ישנים על פני 300 צוותים." },
  links: ["#/interview/design/sd-k8s-platform", "#/lesson/staff-platform-engineering", "#/lesson/k8s-security-policy", "#/lesson/k8s-day2-upgrades"]
});

INFRA.topQuestions.push({
  id: "top-design-message-queue",
  cat: "design",
  level: "staff",
  companies: ["LinkedIn", "Amazon", "Uber", "Microsoft"],
  q: { en: "Design a distributed message queue / log like Kafka.",
       he: "תתכנן message queue / log מבוזר כמו Kafka." },
  signal: { en: "Durability vs latency knobs (acks, replication, fsync), ordering guarantees per partition, and consumer group semantics.",
            he: "הכפתורים של durability מול latency (acks, replication, fsync), הבטחות סדר לכל partition, והסמנטיקה של consumer groups." },
  outline: {
    en: "<ol><li>Model: topics split into partitions; each partition is an append-only log with offsets. Order is guaranteed only within a partition.</li><li>Write path: producer batches by partition key, leader appends to page cache + segment files; sequential IO gives 100s of MB/s per disk.</li><li>Replication: leader + followers, in-sync replica set (ISR); acks=all + min.insync.replicas=2 with RF=3 survives one broker loss without data loss.</li><li>Consumers: consumer groups, one partition per consumer at a time; committed offsets stored in an internal topic.</li><li>Delivery: at-least-once by default; idempotent producer + transactions for exactly-once within the system.</li><li>Retention: by time/size, or log compaction (keep latest value per key).</li><li>Metadata / leader election: a Raft-based controller quorum (KRaft) instead of ZooKeeper.</li><li>Scaling limits: partitions are the unit of parallelism; rebalancing and too many partitions hurt.</li></ol>",
    he: "<ol><li>מודל: topics שמחולקים ל-partitions; כל partition הוא log של append-only עם offsets. הסדר מובטח רק בתוך partition.</li><li>Write path: ה-producer מקבץ לפי partition key, ה-leader כותב ל-page cache ולקבצי segment; IO סדרתי נותן מאות MB/s לדיסק.</li><li>Replication: leader + followers, קבוצת ISR; acks=all + min.insync.replicas=2 עם RF=3 שורד נפילה של broker אחד בלי לאבד מידע.</li><li>Consumers: consumer groups, partition אחד לכל consumer בכל רגע; ה-offsets נשמרים ב-topic פנימי.</li><li>מסירה: at-least-once כברירת מחדל; idempotent producer + transactions בשביל exactly-once בתוך המערכת.</li><li>Retention: לפי זמן/גודל, או log compaction (שומרים את הערך האחרון לכל key).</li><li>Metadata / leader election: controller quorum מבוסס Raft (KRaft) במקום ZooKeeper.</li><li>מגבלות סקייל: partitions הם יחידת המקביליות; rebalancing והרבה מדי partitions כואבים.</li></ol>"
  },
  levelUp: { en: "Staff answers compare log vs queue semantics (Kafka vs SQS/RabbitMQ) for the use case, discuss tiered storage and consumer lag as the key SLO, and how to run it multi-tenant.",
             he: "תשובת Staff משווה בין סמנטיקה של log לתור (Kafka מול SQS/RabbitMQ) לפי ה-use case, מדברת על tiered storage ועל consumer lag כ-SLO המרכזי, ואיך מריצים את זה multi-tenant." },
  links: ["#/interview/design/sd-message-queue", "#/lesson/staff-kafka-deep", "#/lesson/arch-brokers", "#/oncall/kafka-rebalance-storm"]
});

INFRA.topQuestions.push({
  id: "top-design-payments",
  cat: "design",
  level: "staff",
  companies: ["Stripe", "Amazon", "Uber", "Airbnb"],
  q: { en: "Design a payments system that charges customers through external payment processors and never double-charges.",
       he: "תתכנן מערכת תשלומים שמחייבת לקוחות דרך payment processors חיצוניים ואף פעם לא מחייבת פעמיים." },
  signal: { en: "Correctness under failure: idempotency, a double-entry ledger, and reconciliation with systems you do not control.",
            he: "נכונות תחת תקלות: idempotency, ledger של double-entry, ו-reconciliation מול מערכות שאינן בשליטתך." },
  outline: {
    en: "<ol><li>Idempotency keys on every API call (client-generated, stored with the result for ~24 h); retries return the stored response.</li><li>State machine per payment: created -&gt; authorized -&gt; captured -&gt; settled / failed / refunded; transitions persisted before side effects.</li><li>Ledger: append-only double-entry (every movement debits one account and credits another, sum = 0); never UPDATE balances in place.</li><li>Database: strongly consistent relational DB (Postgres / Spanner-class) for the ledger; correctness beats latency.</li><li>External calls: timeouts are 'unknown' not 'failed'; query the processor status before retrying; outbox pattern to publish events.</li><li>Reconciliation: daily (or continuous) diff against processor settlement files; alert on any mismatch.</li><li>Security: PCI scope minimization via tokenization; audit logs.</li></ol>",
    he: "<ol><li>Idempotency keys בכל קריאת API (הלקוח מייצר, נשמרים עם התוצאה ל-~24 שעות); retry מחזיר את התשובה השמורה.</li><li>State machine לכל תשלום: created -&gt; authorized -&gt; captured -&gt; settled / failed / refunded; שומרים את המעבר לפני side effects.</li><li>Ledger: double-entry של append-only (כל תנועה מחייבת חשבון אחד ומזכה אחר, הסכום = 0); אף פעם לא עושים UPDATE ליתרות במקום.</li><li>Database: DB רלציוני חזק-עקבי (Postgres / ברמת Spanner) ל-ledger; נכונות מנצחת latency.</li><li>קריאות חיצוניות: timeout זה 'לא ידוע' ולא 'נכשל'; בודקים סטטוס מול ה-processor לפני retry; outbox pattern לפרסום events.</li><li>Reconciliation: השוואה יומית (או רציפה) מול קבצי settlement של ה-processor; alert על כל אי-התאמה.</li><li>אבטחה: צמצום PCI scope בעזרת tokenization; audit logs.</li></ol>"
  },
  levelUp: { en: "Staff answers design for processor outages (routing across multiple processors), multi-currency and FX, and make reconciliation a first-class product with clear ownership of breaks.",
             he: "תשובת Staff מתכננת לנפילות של processors (routing בין כמה processors), multi-currency ו-FX, והופכת את ה-reconciliation למוצר מרכזי עם בעלות ברורה על פערים." },
  links: ["#/interview/design/sd-payments-ledger", "#/lesson/staff-exactly-once", "#/lesson/db-transactions"]
});

/* =========================== CODING (10) =========================== */

INFRA.topQuestions.push({
  id: "top-code-lru-cache",
  cat: "coding",
  level: "senior",
  companies: ["Amazon", "Google", "Meta", "Microsoft", "Apple"],
  q: { en: "Implement an LRU cache with O(1) get and put.",
       he: "תממש LRU cache עם get ו-put ב-O(1)." },
  signal: { en: "Clean data-structure composition (hash map + doubly linked list), careful pointer handling, and talking through edge cases out loud.",
            he: "הרכבה נקייה של מבני נתונים (hash map + doubly linked list), טיפול זהיר ב-pointers, ודיבור בקול על edge cases." },
  outline: {
    en: "<ol><li>Hash map key -&gt; node gives O(1) lookup.</li><li>Doubly linked list ordered by recency; head = most recent, tail = eviction candidate.</li><li>Sentinel head/tail nodes remove null checks.</li><li>get: lookup, move node to head, return value; -1 if missing.</li><li>put: update + move to head if present; otherwise insert at head and, if over capacity, remove tail and delete it from the map.</li><li>Test: capacity 1, updating an existing key, get after eviction.</li><li>Follow-ups: thread safety (lock or sharded locks), TTL, size in bytes rather than count.</li></ol>",
    he: "<ol><li>Hash map של key -&gt; node נותן lookup ב-O(1).</li><li>Doubly linked list ממוין לפי עדכניות; head = הכי חדש, tail = המועמד ל-eviction.</li><li>Sentinel nodes ל-head/tail חוסכים בדיקות null.</li><li>get: lookup, מזיזים את ה-node ל-head, מחזירים ערך; -1 אם לא קיים.</li><li>put: אם קיים, מעדכנים ומזיזים ל-head; אחרת מכניסים ל-head, ואם עברנו את הקיבולת מסירים את ה-tail ומוחקים אותו מה-map.</li><li>בדיקות: capacity 1, עדכון key קיים, get אחרי eviction.</li><li>Follow-ups: thread safety (lock או locks מחולקים), TTL, גודל בבתים במקום ספירה.</li></ol>"
  },
  levelUp: { en: "Senior+ candidates finish in ~20 minutes and then discuss why real caches use approximate LRU (Redis samples keys) and how to shard the lock for concurrency.",
             he: "מועמד Senior+ מסיים בכ-20 דקות ואז מדבר על למה caches אמיתיים משתמשים ב-LRU מקורב (Redis דוגם keys) ואיך מחלקים את ה-lock בשביל concurrency." },
  links: ["#/interview/code/lru-cache", "#/lesson/caching-deep"]
});

INFRA.topQuestions.push({
  id: "top-code-lfu-cache",
  cat: "coding",
  level: "senior",
  companies: ["Google", "Amazon", "Microsoft"],
  q: { en: "Implement an LFU cache: evict the least frequently used key, breaking ties by least recently used. O(1) per operation.",
       he: "תממש LFU cache: מוציאים את ה-key הכי פחות בשימוש, ובשוויון את זה שהשתמשו בו הכי מזמן. O(1) לכל פעולה." },
  signal: { en: "Can you extend the LRU idea to a harder invariant and maintain the min-frequency pointer correctly?",
            he: "האם אתה יודע להרחיב את הרעיון של LRU ל-invariant קשה יותר ולתחזק נכון את ה-pointer של התדירות המינימלית?" },
  outline: {
    en: "<ol><li>key -&gt; (value, freq) map.</li><li>freq -&gt; ordered set of keys (OrderedDict / linked list) keeps LRU order inside each frequency.</li><li>Track minFreq.</li><li>get: bump the key from freq f to f+1; if bucket f is now empty and f == minFreq, minFreq++.</li><li>put new key: if full, evict the oldest key in bucket minFreq; insert with freq 1 and set minFreq = 1.</li><li>Edge case: capacity 0.</li><li>Discuss: LFU pollution (old popular keys never leave), fixed with frequency decay or TinyLFU / W-TinyLFU (Caffeine).</li></ol>",
    he: "<ol><li>Map של key -&gt; (value, freq).</li><li>Map של freq -&gt; קבוצה ממוינת של keys (OrderedDict / linked list) ששומרת סדר LRU בתוך כל תדירות.</li><li>מחזיקים minFreq.</li><li>get: מקדמים את ה-key מתדירות f ל-f+1; אם הדלי f התרוקן ו-f == minFreq, אז minFreq++.</li><li>put של key חדש: אם מלא, מוציאים את ה-key הכי ישן בדלי minFreq; מכניסים עם freq 1 וקובעים minFreq = 1.</li><li>Edge case: capacity 0.</li><li>לדון: זיהום LFU (keys שהיו פופולריים פעם לא יוצאים), נפתר עם דעיכת תדירות או TinyLFU / W-TinyLFU (Caffeine).</li></ol>"
  },
  levelUp: { en: "Stronger answers connect it to production: when LFU beats LRU (skewed, stable popularity) and why modern caches use admission policies rather than pure LFU.",
             he: "תשובה חזקה יותר מחברת לפרודקשן: מתי LFU מנצח LRU (פופולריות מוטה ויציבה) ולמה caches מודרניים משתמשים ב-admission policies ולא ב-LFU טהור." },
  links: ["#/interview/code/lfu-cache", "#/interview/code/lru-cache", "#/lesson/caching-deep"]
});

INFRA.topQuestions.push({
  id: "top-code-merge-k-sorted",
  cat: "coding",
  level: "senior",
  companies: ["Amazon", "Meta", "Google", "Microsoft"],
  q: { en: "Merge k sorted lists (or k sorted log files) into one sorted output.",
       he: "תמזג k רשימות ממוינות (או k קבצי log ממוינים) לפלט ממוין אחד." },
  signal: { en: "Heap fluency and complexity reasoning, then whether you can stream it when the data does not fit in memory.",
            he: "שליטה ב-heap ובניתוח סיבוכיות, ואז האם אתה יודע לעשות את זה ב-streaming כשהמידע לא נכנס לזיכרון." },
  outline: {
    en: "<ol><li>Naive: concatenate and sort, O(N log N); or merge pairwise one by one, O(N k).</li><li>Min-heap of size k holding (value, list_index, next_pointer).</li><li>Pop smallest, emit, push the next element from the same list.</li><li>Complexity: O(N log k) time, O(k) extra space.</li><li>Alternative: divide and conquer pairwise merging, also O(N log k).</li><li>Tie-break: add an index to tuples so equal values never compare nodes.</li><li>Streaming version: read buffered chunks from each file; this is the merge phase of external sort.</li></ol>",
    he: "<ol><li>נאיבי: לשרשר ולמיין, O(N log N); או למזג זוג אחרי זוג, O(N k).</li><li>Min-heap בגודל k שמחזיק (value, list_index, next_pointer).</li><li>מוציאים את הקטן ביותר, מוציאים לפלט, ומכניסים את האיבר הבא מאותה רשימה.</li><li>סיבוכיות: O(N log k) זמן, O(k) זיכרון נוסף.</li><li>חלופה: divide and conquer עם מיזוג בזוגות, גם O(N log k).</li><li>שבירת שוויון: מוסיפים index ל-tuples כדי שערכים שווים לא ישוו nodes.</li><li>גרסת streaming: קוראים chunks עם buffer מכל קובץ; זה שלב ה-merge של external sort.</li></ol>"
  },
  levelUp: { en: "Bring in the infra link: LSM-tree compaction and log aggregation are exactly this, and discuss what to do when one input stream is slow (backpressure, watermarks).",
             he: "מביאים את הקשר לתשתית: compaction ב-LSM tree ואגרגציית logs הם בדיוק זה, ומדברים על מה עושים כש-stream אחד איטי (backpressure, watermarks)." },
  links: ["#/interview/code/merge-sorted-logs", "#/lesson/infra-data-structures"]
});

INFRA.topQuestions.push({
  id: "top-code-top-k",
  cat: "coding",
  level: "senior",
  companies: ["Amazon", "Meta", "Google", "Datadog", "Cloudflare"],
  q: { en: "Given a stream of requests, return the top K most frequent IPs (or words / products).",
       he: "בהינתן stream של בקשות, תחזיר את K כתובות ה-IP (או מילים / מוצרים) הכי נפוצות." },
  signal: { en: "Choosing between sort, heap and bucket sort with correct complexity, and knowing the approximate answer at real scale.",
            he: "בחירה בין sort, heap ו-bucket sort עם סיבוכיות נכונה, והיכרות עם הפתרון המקורב בסקייל אמיתי." },
  outline: {
    en: "<ol><li>Count with a hash map: O(N).</li><li>Min-heap of size K over (count, key): O(M log K) where M = distinct keys.</li><li>Bucket sort by frequency: O(N) when counts are bounded by N.</li><li>Quickselect: O(M) average.</li><li>Streaming / huge cardinality: Count-Min Sketch + heap (Heavy Hitters), or Space-Saving algorithm; memory is fixed, error is bounded.</li><li>Distributed: local top-K per node is NOT exact when merged; send counts (or sketches, which merge) to an aggregator.</li><li>Sliding window (top-K in last 5 min): bucketed counts per minute, subtract expired buckets.</li></ol>",
    he: "<ol><li>ספירה עם hash map: O(N).</li><li>Min-heap בגודל K על (count, key): O(M log K) כש-M = מספר keys שונים.</li><li>Bucket sort לפי תדירות: O(N) כשהספירות חסומות ע״י N.</li><li>Quickselect: O(M) בממוצע.</li><li>Streaming / cardinality עצום: Count-Min Sketch + heap (Heavy Hitters), או Space-Saving algorithm; זיכרון קבוע, שגיאה חסומה.</li><li>מבוזר: top-K מקומי לכל node הוא לא מדויק אחרי מיזוג; שולחים counts (או sketches, שאפשר למזג) ל-aggregator.</li><li>חלון נע (top-K ב-5 הדקות האחרונות): ספירות בדליים של דקה, ומחסירים דליים שפגו.</li></ol>"
  },
  levelUp: { en: "Staff-level follow-up is 'design top-K for a CDN / trending topics in real time' - answer with sketches, windowing and a merge tree, and state the accuracy you trade.",
             he: "ה-follow-up ברמת Staff הוא 'תתכנן top-K ל-CDN / נושאים חמים בזמן אמת' - עונים עם sketches, windowing ו-merge tree, ואומרים במפורש איזה דיוק מוותרים." },
  links: ["#/interview/code/top-k-frequent-ips", "#/lesson/infra-data-structures"]
});

INFRA.topQuestions.push({
  id: "top-code-course-schedule",
  cat: "coding",
  level: "senior",
  companies: ["Google", "Amazon", "Meta", "Uber", "Airbnb"],
  q: { en: "Course Schedule: given prerequisites, can all courses be finished, and in what order? (aka service deploy order / build dependency order)",
       he: "Course Schedule: בהינתן דרישות קדם, האם אפשר לסיים את כל הקורסים ובאיזה סדר? (כלומר סדר deploy של services / סדר build של תלויות)" },
  signal: { en: "Graph modelling plus topological sort, and clean cycle detection.",
            he: "מידול כגרף, topological sort וזיהוי מעגלים נקי." },
  outline: {
    en: "<ol><li>Model: directed graph, edge prereq -&gt; course; build adjacency list + in-degree array.</li><li>Kahn's algorithm: queue all in-degree 0 nodes, pop, append to order, decrement neighbors.</li><li>If order length &lt; n, there is a cycle: impossible.</li><li>Alternative: DFS with 3 colors (white / gray / black); a gray-to-gray edge means a cycle.</li><li>Complexity: O(V + E).</li><li>Variant: return all nodes that can run in parallel per 'wave' (levels of Kahn's queue) - that is how build systems parallelize.</li></ol>",
    he: "<ol><li>מודל: גרף מכוון, קשת prereq -&gt; course; בונים adjacency list ומערך in-degree.</li><li>אלגוריתם Kahn: מכניסים לתור את כל ה-nodes עם in-degree 0, מוציאים, מוסיפים לסדר, ומורידים את ה-in-degree של השכנים.</li><li>אם אורך הסדר קטן מ-n, יש מעגל: אי אפשר.</li><li>חלופה: DFS עם 3 צבעים (לבן / אפור / שחור); קשת מאפור לאפור = מעגל.</li><li>סיבוכיות: O(V + E).</li><li>וריאציה: להחזיר את כל ה-nodes שאפשר להריץ במקביל בכל 'גל' (הרמות של התור של Kahn) - ככה מערכות build מקבילות עבודה.</li></ol>"
  },
  levelUp: { en: "Connect it to real systems: Terraform's dependency graph, Bazel, Helm/Argo sync waves, and how you would report the cycle (print the actual path) to a user.",
             he: "לחבר למערכות אמיתיות: גרף התלויות של Terraform, Bazel, sync waves של Helm/Argo, ואיך היית מדווח למשתמש על המעגל (להדפיס את המסלול עצמו)." },
  links: ["#/interview/code/course-schedule-deploy-order", "#/interview/code/alien-dependency-resolver"]
});

INFRA.topQuestions.push({
  id: "top-code-number-of-islands",
  cat: "coding",
  level: "senior",
  companies: ["Amazon", "Google", "Microsoft", "Meta"],
  q: { en: "Number of Islands: count connected groups of 1s in a grid. Then: what if cells are added one at a time?",
       he: "Number of Islands: לספור קבוצות מחוברות של 1 ב-grid. ואז: מה אם תאים מתווספים אחד-אחד?" },
  signal: { en: "BFS/DFS fluency, then whether you reach for Union-Find when the problem becomes dynamic.",
            he: "שליטה ב-BFS/DFS, ואז האם אתה מגיע ל-Union-Find כשהבעיה הופכת לדינמית." },
  outline: {
    en: "<ol><li>Scan the grid; on each unvisited land cell, increment count and flood-fill (BFS with a queue, or DFS).</li><li>Mark visited in place or with a set; 4-directional neighbors.</li><li>Complexity: O(R x C) time; BFS queue up to O(min(R, C)) wide, recursive DFS can hit recursion limits on a 1000x1000 grid - prefer iterative.</li><li>Follow-up 'Number of Islands II' (cells added online): Union-Find with path compression + union by rank, near O(1) amortized per add.</li><li>Union-Find also solves: redundant connection, accounts merge, network connectivity, Kruskal's MST.</li></ol>",
    he: "<ol><li>סורקים את ה-grid; על כל תא יבשה שלא ביקרנו בו, מגדילים את המונה ועושים flood-fill (BFS עם תור, או DFS).</li><li>מסמנים ביקור במקום או עם set; שכנים ב-4 כיוונים.</li><li>סיבוכיות: O(R x C) זמן; תור ה-BFS ברוחב עד O(min(R, C)), ו-DFS רקורסיבי יכול להיתקע ב-recursion limit על grid של 1000x1000 - עדיף איטרטיבי.</li><li>Follow-up 'Number of Islands II' (תאים מתווספים online): Union-Find עם path compression + union by rank, כמעט O(1) amortized לכל הוספה.</li><li>Union-Find פותר גם: redundant connection, accounts merge, קישוריות רשת, Kruskal MST.</li></ol>"
  },
  levelUp: { en: "Show breadth: explain when BFS vs Union-Find is the right tool and map it to infra (network segments / partitions detection, grouping alerts by connected components).",
             he: "להראות רוחב: להסביר מתי BFS ומתי Union-Find הם הכלי הנכון ולמפות לתשתית (זיהוי segments / partitions ברשת, קיבוץ alerts לפי רכיבים קשירים)." },
  links: ["#/interview/code/number-of-islands-network-segments", "#/interview/code/network-delay-time"]
});

INFRA.topQuestions.push({
  id: "top-code-meeting-rooms",
  cat: "coding",
  level: "senior",
  companies: ["Google", "Meta", "Amazon", "Uber"],
  q: { en: "Meeting Rooms II: given time intervals, what is the minimum number of rooms (servers) needed?",
       he: "Meeting Rooms II: בהינתן אינטרוולים של זמן, מה המספר המינימלי של חדרים (שרתים) שצריך?" },
  signal: { en: "Interval patterns: sort + heap or sweep line, and getting the boundary condition (end == start) right.",
            he: "דפוסי אינטרוולים: sort + heap או sweep line, ודיוק בתנאי הגבול (end == start)." },
  outline: {
    en: "<ol><li>Sort intervals by start time.</li><li>Min-heap of end times of rooms in use.</li><li>For each meeting: if heap top end &lt;= start, pop (reuse room); push this end.</li><li>Answer = max heap size (or final size). O(n log n).</li><li>Sweep line alternative: +1 at start, -1 at end, sort events (ends before starts at the same time), track the running max.</li><li>Related: Merge Intervals (maintenance windows), Insert Interval, Employee Free Time.</li></ol>",
    he: "<ol><li>ממיינים אינטרוולים לפי זמן התחלה.</li><li>Min-heap של זמני סיום של חדרים תפוסים.</li><li>לכל פגישה: אם הסיום בראש ה-heap &lt;= התחלה, מוציאים (משתמשים שוב בחדר); מכניסים את הסיום הנוכחי.</li><li>התשובה = הגודל המקסימלי של ה-heap. O(n log n).</li><li>חלופת sweep line: +1 בהתחלה, -1 בסיום, ממיינים events (סיומים לפני התחלות באותו זמן), ועוקבים אחרי המקסימום הרץ.</li><li>קשורות: Merge Intervals (חלונות תחזוקה), Insert Interval, Employee Free Time.</li></ol>"
  },
  levelUp: { en: "Tie it to capacity planning: peak concurrency of jobs or connections is the same computation, and ask what the interviewer wants for overlapping-at-boundary semantics.",
             he: "לקשור ל-capacity planning: concurrency מקסימלי של jobs או חיבורים זה אותו חישוב, ולשאול את המראיין מה הסמנטיקה של חפיפה בגבול." },
  links: ["#/interview/code/min-meeting-rooms-servers", "#/interview/code/merge-intervals-maintenance"]
});

INFRA.topQuestions.push({
  id: "top-code-median-stream",
  cat: "coding",
  level: "senior",
  companies: ["Google", "Amazon", "Apple", "Microsoft"],
  q: { en: "Find the median of a data stream (e.g. live latency samples).",
       he: "למצוא את החציון של stream של נתונים (למשל דגימות latency חיות)." },
  signal: { en: "The two-heaps trick, invariant maintenance, and knowing what real monitoring systems do instead.",
            he: "הטריק של שני heaps, תחזוקת invariant, וידיעה מה מערכות ניטור אמיתיות עושות במקום." },
  outline: {
    en: "<ol><li>Max-heap for the lower half, min-heap for the upper half.</li><li>Insert into the max-heap, move its top to the min-heap, rebalance so sizes differ by at most 1.</li><li>Median = top of the bigger heap, or the average of both tops.</li><li>O(log n) add, O(1) median, O(n) memory.</li><li>Sliding-window median: needs deletion - lazy deletion with a hash map, or a sorted list.</li><li>At scale: you cannot keep all samples; percentiles come from histograms / t-digest / HDR histogram with bounded error. And never average p99s across hosts.</li></ol>",
    he: "<ol><li>Max-heap לחצי התחתון, min-heap לחצי העליון.</li><li>מכניסים ל-max-heap, מעבירים את הראש שלו ל-min-heap, ומאזנים כך שהגדלים שונים לכל היותר ב-1.</li><li>חציון = הראש של ה-heap הגדול, או ממוצע שני הראשים.</li><li>O(log n) להוספה, O(1) לחציון, O(n) זיכרון.</li><li>חציון בחלון נע: צריך מחיקה - lazy deletion עם hash map, או sorted list.</li><li>בסקייל: אי אפשר לשמור את כל הדגימות; percentiles מגיעים מ-histograms / t-digest / HDR histogram עם שגיאה חסומה. ואף פעם לא עושים ממוצע של p99 בין hosts.</li></ol>"
  },
  levelUp: { en: "Strong candidates volunteer the production answer (mergeable histograms) and explain why p99 is what users feel, not the median.",
             he: "מועמדים חזקים מביאים מיוזמתם את התשובה מהפרודקשן (histograms שאפשר למזג) ומסבירים למה p99 זה מה שהמשתמשים מרגישים, לא החציון." },
  links: ["#/interview/code/median-from-stream", "#/interview/code/kth-largest-latency-stream", "#/lesson/obs-metrics"]
});

INFRA.topQuestions.push({
  id: "top-code-word-ladder",
  cat: "coding",
  level: "senior",
  companies: ["Amazon", "Google", "Meta", "LinkedIn"],
  q: { en: "Word Ladder: shortest transformation sequence from beginWord to endWord, changing one letter at a time. (Shortest path in an implicit graph.)",
       he: "Word Ladder: רצף הטרנספורמציות הקצר ביותר מ-beginWord ל-endWord, כשמשנים אות אחת בכל צעד. (מסלול קצר בגרף מרומז.)" },
  signal: { en: "Recognizing shortest-path-in-unweighted-graph means BFS, generating neighbors efficiently, and knowing when to switch to Dijkstra.",
            he: "לזהות שמסלול קצר בגרף בלי משקלים = BFS, לייצר שכנים ביעילות, ולדעת מתי לעבור ל-Dijkstra." },
  outline: {
    en: "<ol><li>Nodes = words, edges = one-letter difference; never build the full graph up front.</li><li>BFS from beginWord with a visited set; level count = answer.</li><li>Neighbor generation: for each position try 26 letters (O(L x 26) per word), or precompute wildcard buckets like h*t -&gt; [hot, hit].</li><li>Bidirectional BFS: expand the smaller frontier; cuts the search dramatically.</li><li>Complexity: O(N x L^2) with string building.</li><li>Weighted edges (latency between nodes)? Use Dijkstra with a heap - see Network Delay Time.</li></ol>",
    he: "<ol><li>Nodes = מילים, קשתות = הבדל של אות אחת; לא בונים את כל הגרף מראש.</li><li>BFS מ-beginWord עם visited set; מספר הרמות = התשובה.</li><li>יצירת שכנים: לכל מיקום מנסים 26 אותיות (O(L x 26) למילה), או מחשבים מראש דליים עם wildcard כמו h*t -&gt; [hot, hit].</li><li>Bidirectional BFS: מרחיבים את ה-frontier הקטן יותר; מקצר את החיפוש משמעותית.</li><li>סיבוכיות: O(N x L^2) כולל בניית מחרוזות.</li><li>קשתות עם משקל (latency בין nodes)? Dijkstra עם heap - ראו Network Delay Time.</li></ol>"
  },
  levelUp: { en: "Explain the general pattern ('state space + BFS') so you can apply it to any unseen variant, e.g. minimal config changes to reach a target state.",
             he: "להסביר את הדפוס הכללי ('מרחב מצבים + BFS') כך שאפשר להפעיל אותו על כל וריאציה חדשה, למשל מספר שינויי config מינימלי כדי להגיע למצב יעד." },
  links: ["#/interview/code/network-delay-time", "#/interview/code/coding-playbook"]
});

INFRA.topQuestions.push({
  id: "top-code-rate-limiter",
  cat: "coding",
  level: "senior",
  companies: ["Stripe", "Google", "Uber", "Cloudflare", "Amazon"],
  q: { en: "Code a rate limiter: allow at most N requests per user per window. Then make it a sliding window. (Also asked as 'Design Hit Counter'.)",
       he: "תכתוב rate limiter: לכל היותר N בקשות למשתמש בחלון זמן. ואז תהפוך אותו ל-sliding window. (נשאל גם כ-'Design Hit Counter'.)" },
  signal: { en: "Practical coding: clean class design, time handling, memory bounds, and thread safety, all under time pressure.",
            he: "קוד פרקטי: עיצוב class נקי, טיפול בזמן, גבולות זיכרון ו-thread safety, הכל תחת לחץ זמן." },
  outline: {
    en: "<ol><li>Fixed window: counter per (user, window_start); simple, 2x burst at boundaries.</li><li>Sliding log: deque of timestamps per user; pop older than now - window; O(N) memory per user.</li><li>Sliding window counter: current + previous bucket weighted by overlap; O(1) memory, ~good enough.</li><li>Token bucket: tokens refill at rate r up to capacity b; compute lazily on each call from elapsed time - no background thread.</li><li>Inject a clock for testability; use monotonic time.</li><li>Concurrency: per-key lock or atomic compare-and-swap; evict idle users to bound memory.</li><li>Distributed version: move state to Redis with an atomic Lua script.</li></ol>",
    he: "<ol><li>Fixed window: counter לכל (user, window_start); פשוט, burst כפול בגבולות.</li><li>Sliding log: deque של timestamps לכל משתמש; מוציאים את מה שישן מ-now - window; זיכרון O(N) למשתמש.</li><li>Sliding window counter: הדלי הנוכחי + הקודם משוקלל לפי החפיפה; זיכרון O(1), מספיק טוב.</li><li>Token bucket: tokens מתמלאים בקצב r עד קיבולת b; מחשבים בעצלות בכל קריאה לפי הזמן שעבר - בלי thread ברקע.</li><li>מזריקים clock בשביל טסטים; משתמשים בזמן מונוטוני.</li><li>Concurrency: lock לכל key או compare-and-swap אטומי; מוציאים משתמשים לא פעילים כדי להגביל זיכרון.</li><li>גרסה מבוזרת: מעבירים את ה-state ל-Redis עם סקריפט Lua אטומי.</li></ol>"
  },
  levelUp: { en: "Bridge coding and design in one breath: state the accuracy/memory trade-off of each algorithm and what changes when the limiter is shared across 100 hosts.",
             he: "לחבר קוד ותכנון במשפט אחד: לומר את ה-trade-off של דיוק/זיכרון של כל אלגוריתם ומה משתנה כשה-limiter משותף ל-100 hosts." },
  links: ["#/interview/code/rate-limiter-token-bucket", "#/interview/code/sliding-window-rate-limiter", "#/interview/code/design-hit-counter-distributed"]
});

/* =========================== INFRA / SRE DEEP-DIVE (12) =========================== */

INFRA.topQuestions.push({
  id: "top-infra-type-url",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Amazon", "Microsoft", "Cloudflare", "Apple"],
  q: { en: "What happens, in as much detail as you can, when you type https://www.example.com into a browser and press Enter?",
       he: "מה קורה, בכמה שיותר פירוט, כשמקלידים https://www.example.com בדפדפן ולוחצים Enter?" },
  signal: { en: "Breadth across the stack and the ability to go arbitrarily deep wherever the interviewer pokes (DNS, TCP, TLS, LB, kernel).",
            he: "רוחב לאורך כל ה-stack, והיכולת לצלול לעומק בכל מקום שהמראיין נוגע (DNS, TCP, TLS, LB, kernel)." },
  outline: {
    en: "<ol><li>URL parsing, HSTS check, browser cache / service worker.</li><li>DNS: browser cache -&gt; OS (stub resolver, /etc/hosts) -&gt; recursive resolver -&gt; root -&gt; .com TLD -&gt; authoritative; answer cached for its TTL. Often a CNAME to a CDN.</li><li>TCP 3-way handshake (SYN, SYN-ACK, ACK) = 1 RTT; ARP / routing to the default gateway underneath.</li><li>TLS 1.3: 1 RTT (ClientHello with key share, server cert + Finished); SNI picks the cert; cert chain validated. HTTP/3 uses QUIC over UDP and merges transport + TLS.</li><li>HTTP request hits CDN edge (cache hit?) -&gt; L4/L7 load balancer -&gt; reverse proxy -&gt; app server -&gt; cache / DB.</li><li>Response: status, headers (cache-control, compression), body.</li><li>Browser: parse HTML, fetch CSS/JS/images (reusing the connection), build DOM/CSSOM, layout, paint.</li></ol>",
    he: "<ol><li>Parsing של ה-URL, בדיקת HSTS, cache של הדפדפן / service worker.</li><li>DNS: cache של הדפדפן -&gt; מערכת ההפעלה (stub resolver, /etc/hosts) -&gt; recursive resolver -&gt; root -&gt; TLD של .com -&gt; authoritative; התשובה נשמרת לפי ה-TTL. לרוב CNAME ל-CDN.</li><li>TCP 3-way handshake (SYN, SYN-ACK, ACK) = RTT אחד; מתחת לזה ARP / routing ל-default gateway.</li><li>TLS 1.3: RTT אחד (ClientHello עם key share, תעודת שרת + Finished); SNI בוחר את התעודה; אימות שרשרת התעודות. HTTP/3 משתמש ב-QUIC מעל UDP ומאחד transport ו-TLS.</li><li>בקשת HTTP מגיעה ל-CDN edge (cache hit?) -&gt; load balancer של L4/L7 -&gt; reverse proxy -&gt; app server -&gt; cache / DB.</li><li>תשובה: status, headers (cache-control, דחיסה), body.</li><li>הדפדפן: parsing של HTML, הבאת CSS/JS/תמונות (על אותו חיבור), בניית DOM/CSSOM, layout, paint.</li></ol>"
  },
  levelUp: { en: "Senior+ candidates steer toward their specialty and go deep (e.g. anycast + BGP at the CDN, SYN queues, TLS session resumption, connection pooling on the backend) and name where it typically breaks.",
             he: "מועמדי Senior+ מכוונים לתחום ההתמחות שלהם וצוללים (למשל anycast + BGP ב-CDN, תורי SYN, TLS session resumption, connection pooling ב-backend) ואומרים איפה זה בדרך כלל נשבר." },
  links: ["#/lesson/net-dns", "#/lesson/net-http-tls", "#/lesson/net-osi-tcpip", "#/lesson/net-proxies-cdn"]
});

INFRA.topQuestions.push({
  id: "top-infra-debug-latency",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Netflix", "Meta", "Datadog", "Amazon"],
  q: { en: "p99 latency of a critical service doubled 30 minutes ago. Walk me through how you debug it.",
       he: "ה-p99 latency של service קריטי הוכפל לפני 30 דקות. תעביר אותי דרך תהליך ה-debug." },
  signal: { en: "A structured method under pressure: mitigate first, then narrow down with data (what changed, where in the request path), not random guessing.",
            he: "שיטה מובנית תחת לחץ: קודם mitigation, ואז צמצום עם נתונים (מה השתנה, איפה במסלול הבקשה), לא ניחושים אקראיים." },
  outline: {
    en: "<ol><li>Scope the blast radius: all endpoints or one? all hosts / AZs or some? all customers?</li><li>What changed: deploys, config/flag flips, traffic mix, dependency deploys, infra events (correlate timestamps).</li><li>Mitigate first if users are hurting: roll back, shift traffic, scale out.</li><li>Golden signals per hop: traffic, errors, latency, saturation; distributed traces to find which span grew.</li><li>Resource level (USE): CPU (incl. throttling in containers), memory / GC pauses, disk IO wait, network retransmits, connection-pool waits.</li><li>Dependencies: slow DB queries (new query plan?), cache hit ratio drop, downstream timeouts + retries amplifying load.</li><li>Confirm the fix with the same metric, then a postmortem with action items.</li></ol>",
    he: "<ol><li>להבין את ה-blast radius: כל ה-endpoints או אחד? כל ה-hosts / AZs או חלק? כל הלקוחות?</li><li>מה השתנה: deploys, שינויי config/flags, תמהיל תנועה, deploys של תלויות, אירועי תשתית (להצליב timestamps).</li><li>קודם mitigation אם משתמשים נפגעים: rollback, הסטת תנועה, scale out.</li><li>Golden signals לכל hop: traffic, errors, latency, saturation; distributed traces כדי למצוא איזה span גדל.</li><li>רמת משאבים (USE): CPU (כולל throttling ב-containers), זיכרון / GC pauses, IO wait בדיסק, retransmits ברשת, המתנה ל-connection pool.</li><li>תלויות: queries איטיות ב-DB (query plan חדש?), ירידה ב-cache hit ratio, timeouts ב-downstream + retries שמגבירים עומס.</li><li>לאמת את התיקון באותו metric, ואז postmortem עם action items.</li></ol>"
  },
  levelUp: { en: "Staff answers explain tail-latency mechanics (queueing near saturation, fan-out amplification, GC) and end with systemic fixes: hedged requests, timeouts budgets, load shedding, better alerts.",
             he: "תשובת Staff מסבירה את המכניקה של tail latency (queueing ליד רוויה, הגברה של fan-out, GC) ומסיימת בתיקונים מערכתיים: hedged requests, timeout budgets, load shedding, alerts טובים יותר." },
  links: ["#/lesson/obs-golden-signals", "#/lesson/obs-traces", "#/lesson/staff-queueing-tail-latency", "#/lesson/linux-performance-60s"]
});

INFRA.topQuestions.push({
  id: "top-infra-crashloop",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Datadog", "Nvidia", "Airbnb"],
  q: { en: "A pod is in CrashLoopBackOff right after a deploy. How do you troubleshoot it?",
       he: "Pod נמצא ב-CrashLoopBackOff מיד אחרי deploy. איך אתה עושה troubleshooting?" },
  signal: { en: "Hands-on Kubernetes fluency: knowing which command reveals which cause, and understanding the restart backoff mechanics.",
            he: "שליטה מעשית ב-Kubernetes: לדעת איזו פקודה חושפת איזו סיבה, ולהבין את מנגנון ה-backoff של ה-restarts." },
  outline: {
    en: "<ol><li>CrashLoopBackOff = the container keeps exiting; kubelet restarts with exponential backoff 10 s -&gt; 20 s -&gt; ... capped at 5 min.</li><li>kubectl describe pod: Last State, exit code, reason, events.</li><li>Exit 137 + OOMKilled -&gt; memory limit too low or leak; exit 1 -&gt; app error; 127 -&gt; command not found; 143 -&gt; SIGTERM.</li><li>kubectl logs --previous to see the crashed container's output.</li><li>Common causes: missing config / secret / env var, bad image or entrypoint, DB unreachable at startup, liveness probe killing a slow-starting app (use a startupProbe).</li><li>Debug: kubectl debug with an ephemeral container, or run the image locally with the same env.</li><li>Mitigate: roll back the Deployment (kubectl rollout undo) while you fix it.</li></ol>",
    he: "<ol><li>CrashLoopBackOff = ה-container ממשיך לצאת; ה-kubelet מפעיל מחדש עם backoff אקספוננציאלי 10 s -&gt; 20 s -&gt; ... עד תקרה של 5 דקות.</li><li>kubectl describe pod: Last State, exit code, reason, events.</li><li>Exit 137 + OOMKilled -&gt; memory limit נמוך מדי או leak; exit 1 -&gt; שגיאת אפליקציה; 127 -&gt; פקודה לא נמצאה; 143 -&gt; SIGTERM.</li><li>kubectl logs --previous כדי לראות את הפלט של ה-container שקרס.</li><li>סיבות נפוצות: config / secret / env var חסר, image או entrypoint שגוי, DB לא נגיש ב-startup, liveness probe שהורג אפליקציה שעולה לאט (להשתמש ב-startupProbe).</li><li>Debug: kubectl debug עם ephemeral container, או להריץ את ה-image מקומית עם אותה סביבה.</li><li>Mitigation: rollback ל-Deployment (kubectl rollout undo) בזמן שמתקנים.</li></ol>"
  },
  levelUp: { en: "Staff-level: how to prevent it platform-wide - progressive rollouts that halt on crash loops, admission checks for probes/limits, and alerts on restart rate rather than on pod status.",
             he: "ברמת Staff: איך מונעים את זה ברמת הפלטפורמה - rollouts הדרגתיים שנעצרים על crash loops, בדיקות admission ל-probes/limits, ו-alerts על קצב restarts ולא על סטטוס pod." },
  links: ["#/oncall/oom-crashloop", "#/lesson/k8s-debugging", "#/lesson/k8s-troubleshooting-playbook", "#/lesson/k8s-probes"]
});

INFRA.topQuestions.push({
  id: "top-infra-slow-cpu-low",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Meta", "Netflix", "Amazon"],
  q: { en: "A service is slow, but CPU is at 15% and memory looks fine. What could be going on?",
       he: "Service איטי, אבל ה-CPU על 15% והזיכרון נראה תקין. מה יכול לקרות?" },
  signal: { en: "Understanding that most latency is waiting, not computing: locks, IO, pools, downstream calls, throttling.",
            he: "להבין שרוב ה-latency זה המתנה, לא חישוב: locks, IO, pools, קריאות ל-downstream, throttling." },
  outline: {
    en: "<ol><li>The work is blocked, not busy. Find what it waits on.</li><li>Downstream: slow DB / API; traces show a long span. Retries hide it.</li><li>Pool exhaustion: DB connection pool or HTTP client pool maxed; threads queue for a connection (check pool wait time metrics).</li><li>Thread pool / event loop: all workers blocked on sync IO; a single-threaded event loop blocked by one slow callback.</li><li>Locks: contention or a DB row lock; thread dumps (jstack) show many threads WAITING on the same monitor.</li><li>CPU throttling: container hitting its CFS quota while average CPU looks low (check nr_throttled).</li><li>Disk / network: iowait, fsync latency, packet loss + TCP retransmits, DNS lookups timing out (5 s resolver timeout is a classic).</li><li>Tools: traces, thread dumps, vmstat / iostat / ss, pool metrics.</li></ol>",
    he: "<ol><li>העבודה חסומה, לא עסוקה. צריך למצוא על מה היא מחכה.</li><li>Downstream: DB / API איטי; traces מראים span ארוך. retries מסתירים את זה.</li><li>מיצוי pool: ה-connection pool של ה-DB או של ה-HTTP client מלא; threads מחכים בתור לחיבור (לבדוק metrics של pool wait time).</li><li>Thread pool / event loop: כל ה-workers חסומים על IO סינכרוני; event loop עם thread יחיד שנתקע בגלל callback איטי אחד.</li><li>Locks: contention או row lock ב-DB; thread dumps (jstack) מראים הרבה threads ב-WAITING על אותו monitor.</li><li>CPU throttling: ה-container מגיע ל-CFS quota שלו בזמן שה-CPU הממוצע נראה נמוך (לבדוק nr_throttled).</li><li>דיסק / רשת: iowait, latency של fsync, packet loss + TCP retransmits, DNS lookups שעושים timeout (timeout של 5 שניות ב-resolver זו קלאסיקה).</li><li>כלים: traces, thread dumps, vmstat / iostat / ss, metrics של pools.</li></ol>"
  },
  levelUp: { en: "Staff candidates bring Little's Law (concurrency = throughput x latency) to size pools and explain how a slow dependency propagates into a cascading failure without CPU ever rising.",
             he: "מועמד Staff מביא את Little's Law (concurrency = throughput x latency) כדי לקבוע גודל pools, ומסביר איך תלות איטית מתגלגלת ל-cascading failure בלי שה-CPU יעלה אף פעם." },
  links: ["#/oncall/db-connections", "#/lesson/staff-queueing-tail-latency", "#/lesson/k8s-resources", "#/lesson/processes-linux"]
});

INFRA.topQuestions.push({
  id: "top-infra-alerting-slos",
  cat: "infra",
  level: "staff",
  companies: ["Google", "Netflix", "Datadog", "Microsoft"],
  q: { en: "How would you design SLOs and alerting for a service so that on-call gets paged only for things that matter?",
       he: "איך היית מתכנן SLOs ו-alerting ל-service כך שה-on-call יקבל page רק על דברים שחשובים?" },
  signal: { en: "SRE maturity: user-centric SLIs, error budgets as a decision tool, and burn-rate alerting instead of threshold noise.",
            he: "בגרות SRE: SLIs ממוקדי משתמש, error budgets ככלי החלטה, ו-alerting לפי burn rate במקום רעש של thresholds." },
  outline: {
    en: "<ol><li>SLIs from the user's perspective: availability (good requests / valid requests) and latency (% of requests &lt; 300 ms), measured at the LB or client.</li><li>SLO: e.g. 99.9% over 30 days = ~43 minutes of error budget.</li><li>Page on symptoms, not causes: CPU high is a ticket at most; users failing is a page.</li><li>Multi-window burn-rate alerts: page if burning 14.4x over 1 h (and 5 min confirms) = 2% of budget gone; ticket at 6x over 6 h, 1x over 3 days.</li><li>Every page must be actionable and have a runbook; review pages weekly, delete noisy ones.</li><li>Error budget policy: when exhausted, freeze risky launches and prioritize reliability work.</li><li>Dependency SLOs must be tighter than yours.</li></ol>",
    he: "<ol><li>SLIs מנקודת המבט של המשתמש: availability (בקשות טובות / בקשות תקפות) ו-latency (אחוז הבקשות מתחת ל-300 ms), נמדד ב-LB או אצל הלקוח.</li><li>SLO: למשל 99.9% על 30 יום = ~43 דקות של error budget.</li><li>Page על סימפטומים, לא על סיבות: CPU גבוה זה לכל היותר ticket; משתמשים שנכשלים זה page.</li><li>Multi-window burn-rate alerts: page אם שורפים פי 14.4 על שעה (ו-5 דקות מאשרות) = 2% מה-budget נעלם; ticket על פי 6 ב-6 שעות, ופי 1 ב-3 ימים.</li><li>כל page חייב להיות actionable ועם runbook; סוקרים pages כל שבוע ומוחקים רועשים.</li><li>Error budget policy: כשנגמר, מקפיאים launches מסוכנים ומתעדפים עבודת reliability.</li><li>ה-SLOs של התלויות חייבים להיות הדוקים משלך.</li></ol>"
  },
  levelUp: { en: "Principal answers drive SLO adoption across an org: negotiating targets with product, tying budgets to release policy, and measuring on-call health (pages per shift, time to resolve).",
             he: "תשובת Principal מובילה אימוץ SLOs בארגון שלם: משא ומתן על יעדים עם מוצר, קישור budgets למדיניות שחרור, ומדידת בריאות ה-on-call (pages למשמרת, זמן לפתרון)." },
  links: ["#/lesson/rel-sli-slo-sla", "#/lesson/rel-error-budgets", "#/lesson/obs-alerting"]
});

INFRA.topQuestions.push({
  id: "top-infra-dns-outage",
  cat: "infra",
  level: "senior",
  companies: ["Cloudflare", "Amazon", "Google", "Meta"],
  q: { en: "Users report the site is down for some of them. You suspect DNS. How do you confirm it and what do you do?",
       he: "משתמשים מדווחים שהאתר למטה אצל חלק מהם. אתה חושד ב-DNS. איך מאמתים ומה עושים?" },
  signal: { en: "Deep DNS understanding (caching, TTLs, resolvers vs authoritative) and practical debugging with dig.",
            he: "הבנה עמוקה של DNS (caching, TTLs, resolvers מול authoritative) ו-debug מעשי עם dig." },
  outline: {
    en: "<ol><li>Partial impact + DNS suspicion: different resolvers / regions see different answers or NXDOMAIN / SERVFAIL.</li><li>dig example.com @8.8.8.8 and @1.1.1.1 vs dig +trace to see the delegation chain; dig @ns1.provider directly to query authoritative.</li><li>Check: a recent record change, expired domain, broken DNSSEC signature (SERVFAIL on validating resolvers only), NS delegation mismatch, provider outage.</li><li>Inside clusters: CoreDNS overloaded, ndots:5 causing 5x queries, conntrack races on UDP.</li><li>Fix the record / roll back; but caches hold the old answer until TTL expires - you cannot purge the internet.</li><li>Negative caching: NXDOMAIN cached per SOA minimum TTL.</li><li>Prevention: low TTL (60 s) before planned changes, secondary DNS provider, monitoring from multiple vantage points.</li></ol>",
    he: "<ol><li>פגיעה חלקית + חשד ל-DNS: resolvers / regions שונים רואים תשובות שונות או NXDOMAIN / SERVFAIL.</li><li>dig example.com @8.8.8.8 ו-@1.1.1.1 לעומת dig +trace כדי לראות את שרשרת ה-delegation; dig @ns1.provider ישירות כדי לשאול את ה-authoritative.</li><li>לבדוק: שינוי record אחרון, דומיין שפג, חתימת DNSSEC שבורה (SERVFAIL רק ב-resolvers שמאמתים), חוסר התאמה ב-NS delegation, תקלה אצל הספק.</li><li>בתוך clusters: CoreDNS בעומס, ndots:5 שגורם לפי 5 queries, races של conntrack על UDP.</li><li>לתקן את ה-record / rollback; אבל caches מחזיקים את התשובה הישנה עד שה-TTL פג - אי אפשר לנקות את האינטרנט.</li><li>Negative caching: NXDOMAIN נשמר לפי ה-minimum TTL של ה-SOA.</li><li>מניעה: TTL נמוך (60 שניות) לפני שינויים מתוכננים, ספק DNS משני, ניטור מכמה נקודות תצפית.</li></ol>"
  },
  levelUp: { en: "Staff answers treat DNS as a critical dependency: change management with staged rollouts, multi-provider authoritative DNS, and resilient clients (cache last-known-good, stale-while-revalidate).",
             he: "תשובת Staff מתייחסת ל-DNS כתלות קריטית: ניהול שינויים עם rollout מדורג, authoritative DNS אצל כמה ספקים, ולקוחות עמידים (cache של last-known-good, stale-while-revalidate)." },
  links: ["#/oncall/dns-outage", "#/lesson/net-dns", "#/lesson/net-troubleshooting"]
});

INFRA.topQuestions.push({
  id: "top-infra-zero-downtime-migration",
  cat: "infra",
  level: "staff",
  companies: ["Stripe", "Uber", "Airbnb", "Meta", "LinkedIn"],
  q: { en: "How do you rename a column (or change a schema) on a 2 TB production table with zero downtime?",
       he: "איך משנים שם לעמודה (או סכמה) בטבלה של 2 TB בפרודקשן בלי downtime?" },
  signal: { en: "Expand-and-contract discipline, awareness of locking behavior, and safe backfills with rollback at every step.",
            he: "משמעת של expand-and-contract, הבנה של התנהגות locks, ו-backfills בטוחים עם rollback בכל שלב." },
  outline: {
    en: "<ol><li>Never rename in place: old code would break mid-deploy. Use expand / migrate / contract.</li><li>Expand: add the new nullable column (metadata-only in modern Postgres / MySQL; set lock_timeout so DDL never queues behind long transactions).</li><li>Dual-write: deploy code that writes both columns, still reads the old.</li><li>Backfill in small batches (e.g. 1-10K rows per batch, throttled on replication lag), idempotent and resumable.</li><li>Verify: compare counts / checksums; then switch reads to the new column behind a flag.</li><li>Contract: stop writing the old column, wait a release, then drop it.</li><li>Big rewrites: online schema-change tools (gh-ost, pt-online-schema-change, pg_repack); create indexes CONCURRENTLY.</li></ol>",
    he: "<ol><li>לעולם לא משנים שם במקום: קוד ישן יישבר באמצע deploy. משתמשים ב-expand / migrate / contract.</li><li>Expand: מוסיפים עמודה חדשה nullable (רק metadata ב-Postgres / MySQL מודרניים; מגדירים lock_timeout כדי שה-DDL לא ייתקע בתור מאחורי טרנזקציות ארוכות).</li><li>Dual-write: deploy של קוד שכותב לשתי העמודות ועדיין קורא מהישנה.</li><li>Backfill ב-batches קטנים (למשל 1-10K שורות ל-batch, עם throttling לפי replication lag), idempotent ואפשר להמשיך מאמצע.</li><li>אימות: השוואת counts / checksums; ואז מעבירים קריאות לעמודה החדשה מאחורי flag.</li><li>Contract: מפסיקים לכתוב לעמודה הישנה, מחכים release אחד, ואז מוחקים אותה.</li><li>שכתובים גדולים: כלים ל-online schema change (gh-ost, pt-online-schema-change, pg_repack); יצירת אינדקסים עם CONCURRENTLY.</li></ol>"
  },
  levelUp: { en: "Staff answers generalize it into a migration framework for hundreds of services (lint rules for dangerous DDL, automated backfill tooling) and cover moving data between whole datastores with shadow reads.",
             he: "תשובת Staff הופכת את זה ל-framework של מיגרציות למאות services (lint rules ל-DDL מסוכן, כלי backfill אוטומטי) ומכסה העברת מידע בין datastores שלמים עם shadow reads." },
  links: ["#/lesson/staff-zero-downtime-migrations", "#/lesson/staff-postgres-at-scale", "#/lesson/db-operations"]
});

INFRA.topQuestions.push({
  id: "top-infra-disk-full",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Amazon", "Meta", "Apple"],
  q: { en: "You get paged at 3am: disk 100% full on a production host. What do you do?",
       he: "מקבלים page ב-3 בלילה: דיסק 100% מלא על host בפרודקשן. מה עושים?" },
  signal: { en: "Calm, safe Linux operations: stop the bleeding without destroying evidence, and know the classic gotchas (deleted-but-open files, inodes).",
            he: "תפעול Linux רגוע ובטוח: לעצור את הדימום בלי להשמיד ראיות, ולהכיר את המלכודות הקלאסיות (קבצים שנמחקו אבל עדיין פתוחים, inodes)." },
  outline: {
    en: "<ol><li>Assess impact: is the service failing? Can you drain the host from the LB and deal with it calmly?</li><li>df -h to find the filesystem; df -i too - inodes can be exhausted with free space.</li><li>du -xh --max-depth=1 / | sort -h (stay on one filesystem) to find the culprit; usually logs, core dumps, temp files, container images.</li><li>Deleted but still open: df says full but du disagrees -&gt; lsof +L1; the space is freed only when the process closes it (restart it, or truncate via /proc/PID/fd/N).</li><li>Free space safely: truncate (not rm) active log files, compress / move old logs, docker / crictl image prune.</li><li>Root cause: missing log rotation, debug logging left on, runaway job; fix logrotate / retention.</li><li>Prevent: alert on predicted fill (e.g. full in 4 h based on rate), not just 90%.</li></ol>",
    he: "<ol><li>הערכת השפעה: ה-service נכשל? אפשר להוציא את ה-host מה-LB ולטפל ברוגע?</li><li>df -h כדי למצוא את ה-filesystem; גם df -i - inodes יכולים להיגמר כשיש עוד מקום.</li><li>du -xh --max-depth=1 / | sort -h (בלי לחצות filesystems) כדי למצוא את האשם; לרוב logs, core dumps, קבצים זמניים, container images.</li><li>נמחק אבל עדיין פתוח: df אומר מלא אבל du לא מסכים -&gt; lsof +L1; המקום מתפנה רק כשהתהליך סוגר את הקובץ (restart, או truncate דרך /proc/PID/fd/N).</li><li>לפנות מקום בבטחה: truncate (לא rm) לקבצי log פעילים, לדחוס / להעביר logs ישנים, docker / crictl image prune.</li><li>Root cause: חסר log rotation, debug logging שנשאר דלוק, job שיצא משליטה; לתקן logrotate / retention.</li><li>מניעה: alert על מילוי צפוי (למשל יתמלא בעוד 4 שעות לפי הקצב), לא רק על 90%.</li></ol>"
  },
  levelUp: { en: "Staff answers make it a non-event: immutable hosts that get replaced, logs shipped off-box, separate volumes for data vs logs, and predictive alerts across the fleet.",
             he: "תשובת Staff הופכת את זה ללא-אירוע: hosts בלתי משתנים שפשוט מוחלפים, logs שנשלחים החוצה מהמכונה, volumes נפרדים ל-data ול-logs, ו-alerts חזויים על כל הצי." },
  links: ["#/lesson/linux-disks-storage", "#/oncall/k8s-node-diskpressure", "#/lesson/linux-toolkit"]
});

INFRA.topQuestions.push({
  id: "top-infra-load-average",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Netflix", "Meta", "Amazon"],
  q: { en: "Load average on a Linux box is 40 on an 8-core machine, but CPU is mostly idle. Explain.",
       he: "ה-load average במכונת Linux עם 8 ליבות הוא 40, אבל ה-CPU כמעט idle. תסביר." },
  signal: { en: "Real understanding of Linux internals: what load average counts (including D state) and how to find the blocked resource.",
            he: "הבנה אמיתית של ה-internals של Linux: מה load average סופר (כולל D state) ואיך מוצאים את המשאב החוסם." },
  outline: {
    en: "<ol><li>Linux load average = runnable (R) + uninterruptible sleep (D) tasks, averaged over 1/5/15 min. Not just CPU.</li><li>High load + idle CPU = many tasks in D state, almost always waiting on IO.</li><li>Confirm: vmstat 1 (b column = blocked, wa = iowait), ps -eo state,pid,cmd | grep '^D'.</li><li>Find the device: iostat -xz 1 (await, %util, queue size); pidstat -d for the processes.</li><li>Classic causes: slow / saturated disk or EBS volume burst credits exhausted, hung NFS mount, swap storm, kernel lock contention.</li><li>cat /proc/PID/stack (or wchan) shows where a D-state task is stuck.</li><li>Fix the IO source; for NFS consider soft/timeo mount options.</li></ol>",
    he: "<ol><li>Load average ב-Linux = משימות runnable (R) + uninterruptible sleep (D), ממוצע על 1/5/15 דקות. לא רק CPU.</li><li>Load גבוה + CPU idle = הרבה משימות ב-D state, כמעט תמיד מחכות ל-IO.</li><li>לאמת: vmstat 1 (עמודת b = blocked, wa = iowait), ps -eo state,pid,cmd | grep '^D'.</li><li>למצוא את ההתקן: iostat -xz 1 (await, %util, גודל תור); pidstat -d לתהליכים.</li><li>סיבות קלאסיות: דיסק איטי / רווי או ש-burst credits של EBS נגמרו, NFS mount תקוע, swap storm, contention על lock בקרנל.</li><li>cat /proc/PID/stack (או wchan) מראה איפה משימה ב-D state תקועה.</li><li>לתקן את מקור ה-IO; ל-NFS לשקול mount options של soft/timeo.</li></ol>"
  },
  levelUp: { en: "Go further with PSI (/proc/pressure/io, cpu, memory) as the modern, more precise saturation signal, and explain why load average is a poor alerting metric.",
             he: "ללכת רחוק יותר עם PSI (/proc/pressure/io, cpu, memory) כסיגנל רוויה מודרני ומדויק יותר, ולהסביר למה load average הוא metric גרוע ל-alerting." },
  links: ["#/lesson/linux-performance-60s", "#/lesson/storage-io", "#/lesson/cpu"]
});

INFRA.topQuestions.push({
  id: "top-infra-k8s-scheduling",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Nvidia", "Datadog", "Apple"],
  q: { en: "How does Kubernetes decide where a pod runs? And why might a pod stay Pending?",
       he: "איך Kubernetes מחליט איפה pod ירוץ? ולמה pod יכול להישאר ב-Pending?" },
  signal: { en: "Control-plane understanding (API server, scheduler, kubelet) and practical knowledge of the constraints that block scheduling.",
            he: "הבנה של ה-control plane (API server, scheduler, kubelet) וידע מעשי על האילוצים שחוסמים scheduling." },
  outline: {
    en: "<ol><li>Flow: kubectl -&gt; API server -&gt; etcd; scheduler watches unscheduled pods, picks a node, writes the binding; kubelet on that node starts containers.</li><li>Filter phase: node has enough allocatable CPU/memory for requests (not limits), node selector / affinity match, taints tolerated, ports free, volume zone constraints.</li><li>Score phase: spread, resource balance, image locality, preferred affinity; highest score wins.</li><li>Pending causes: Insufficient cpu/memory, untolerated taint, PVC bound to another zone, affinity impossible, quota exceeded.</li><li>Debug: kubectl describe pod -&gt; Events (FailedScheduling explains exactly which filter failed).</li><li>Autoscaler (Cluster Autoscaler / Karpenter) reacts to Pending pods by adding nodes.</li><li>Priority and preemption: higher-priority pods can evict lower ones.</li></ol>",
    he: "<ol><li>זרימה: kubectl -&gt; API server -&gt; etcd; ה-scheduler צופה ב-pods שלא שובצו, בוחר node וכותב binding; ה-kubelet על ה-node מפעיל את ה-containers.</li><li>שלב Filter: ל-node יש מספיק CPU/memory allocatable ל-requests (לא ל-limits), התאמת node selector / affinity, taints שיש להם toleration, ports פנויים, אילוצי zone של volumes.</li><li>שלב Score: פיזור, איזון משאבים, image locality, affinity מועדף; הציון הגבוה מנצח.</li><li>סיבות ל-Pending: Insufficient cpu/memory, taint בלי toleration, PVC שקשור ל-zone אחר, affinity בלתי אפשרי, חריגה מ-quota.</li><li>Debug: kubectl describe pod -&gt; Events (FailedScheduling מסביר בדיוק איזה filter נכשל).</li><li>Autoscaler (Cluster Autoscaler / Karpenter) מגיב ל-pods ב-Pending ומוסיף nodes.</li><li>Priority ו-preemption: pods בעדיפות גבוהה יכולים לפנות pods בעדיפות נמוכה.</li></ol>"
  },
  levelUp: { en: "Staff answers cover topology spread for zone resilience, bin-packing vs spreading for cost, GPU scheduling (device plugins, gang scheduling) and scheduler throughput at 5,000+ nodes.",
             he: "תשובת Staff מכסה topology spread לעמידות בין zones, bin-packing מול פיזור לטובת עלות, scheduling של GPU (device plugins, gang scheduling) ו-throughput של ה-scheduler ב-5,000+ nodes." },
  links: ["#/lesson/k8s-scheduling", "#/lesson/k8s-architecture", "#/oncall/k8s-pending-karpenter"]
});

INFRA.topQuestions.push({
  id: "top-infra-tcp-time-wait",
  cat: "infra",
  level: "senior",
  companies: ["Google", "Cloudflare", "Meta", "Amazon"],
  q: { en: "Explain the TCP handshake and connection teardown. A host has 30,000 sockets in TIME_WAIT and outbound connections are failing - why, and what do you do?",
       he: "תסביר את ה-TCP handshake ואת סגירת החיבור. ל-host יש 30,000 sockets ב-TIME_WAIT וחיבורים יוצאים נכשלים - למה, ומה עושים?" },
  signal: { en: "Protocol-level depth and the ability to connect TCP state to a real production failure (ephemeral port exhaustion).",
            he: "עומק ברמת הפרוטוקול, והיכולת לחבר את ה-state של TCP לתקלה אמיתית בפרודקשן (מיצוי ephemeral ports)." },
  outline: {
    en: "<ol><li>Open: SYN -&gt; SYN-ACK -&gt; ACK (1 RTT); server keeps half-open connections in the SYN queue, completed ones in the accept queue (backlog).</li><li>Close: FIN / ACK each way; the side that closes first enters TIME_WAIT for 2 x MSL (60 s on Linux).</li><li>TIME_WAIT exists so late packets from an old connection are not accepted by a new one with the same 4-tuple.</li><li>Problem: a client opening many short connections to the same dest IP:port exhausts ephemeral ports (~28K by default, 32768-60999).</li><li>Fix the cause: connection reuse / keep-alive / pooling.</li><li>Mitigations: widen ip_local_port_range, net.ipv4.tcp_tw_reuse=1 for outbound, more destination IPs. Never use the removed tcp_tw_recycle.</li><li>Inspect: ss -s, ss -tan state time-wait | wc -l.</li></ol>",
    he: "<ol><li>פתיחה: SYN -&gt; SYN-ACK -&gt; ACK (RTT אחד); השרת מחזיק חיבורים חצי-פתוחים ב-SYN queue, ומושלמים ב-accept queue (backlog).</li><li>סגירה: FIN / ACK לכל כיוון; הצד שסוגר ראשון נכנס ל-TIME_WAIT ל-2 x MSL (60 שניות ב-Linux).</li><li>TIME_WAIT קיים כדי שפקטות מאחרות מחיבור ישן לא יתקבלו בחיבור חדש עם אותו 4-tuple.</li><li>הבעיה: client שפותח הרבה חיבורים קצרים לאותו IP:port יעד ממצה את ה-ephemeral ports (~28K כברירת מחדל, 32768-60999).</li><li>לתקן את הסיבה: שימוש חוזר בחיבורים / keep-alive / pooling.</li><li>Mitigations: להרחיב את ip_local_port_range, net.ipv4.tcp_tw_reuse=1 לחיבורים יוצאים, יותר IPs ביעד. לעולם לא tcp_tw_recycle, שהוסר.</li><li>בדיקה: ss -s, ss -tan state time-wait | wc -l.</li></ol>"
  },
  levelUp: { en: "Go deeper on SYN floods and SYN cookies, accept-queue overflow under load (listen backlog, somaxconn), and conntrack table exhaustion on NAT gateways / k8s nodes.",
             he: "לצלול ל-SYN floods ו-SYN cookies, גלישת accept queue תחת עומס (listen backlog, somaxconn), ומיצוי טבלת conntrack ב-NAT gateways / nodes של k8s." },
  links: ["#/lesson/net-osi-tcpip", "#/lesson/linux-networking-commands", "#/lesson/net-troubleshooting"]
});

INFRA.topQuestions.push({
  id: "top-infra-capacity-planning",
  cat: "infra",
  level: "staff",
  companies: ["Amazon", "Netflix", "Uber", "Stripe"],
  q: { en: "Black Friday is in 6 weeks and we expect 5x normal peak traffic. How do you prepare?",
       he: "Black Friday בעוד 6 שבועות ואנחנו מצפים לפי 5 מהשיא הרגיל. איך מתכוננים?" },
  signal: { en: "Turning a business forecast into concrete capacity, finding the real bottleneck with load tests, and planning graceful degradation.",
            he: "לתרגם תחזית עסקית ל-capacity קונקרטי, למצוא את צוואר הבקבוק האמיתי עם load tests, ולתכנן graceful degradation." },
  outline: {
    en: "<ol><li>Forecast: last year's peak x growth x marketing plan; agree on a number with headroom (plan for 5x, test to ~7x).</li><li>Map the critical path (browse, cart, checkout, payment) and every dependency, including third parties.</li><li>Load test in production-like conditions (or prod with synthetic traffic) to find the first bottleneck; fix, repeat. Usually DB, connection limits or a third-party API quota.</li><li>Pre-scale: autoscaling is too slow for a minute-zero spike; pre-warm instances, LBs, caches. Request cloud quota increases weeks ahead.</li><li>Data tier: read replicas, caching, move non-critical writes async (queues).</li><li>Degradation plan: feature flags to shed non-essential features (recommendations, reviews), queue-based waiting room, load shedding by priority.</li><li>Change freeze in the final week, war room with runbooks and dashboards, then a post-event review.</li></ol>",
    he: "<ol><li>תחזית: השיא של שנה שעברה x צמיחה x תוכנית שיווק; מסכימים על מספר עם headroom (מתכננים לפי 5, בודקים עד ~פי 7).</li><li>ממפים את המסלול הקריטי (browse, cart, checkout, payment) וכל תלות, כולל צדדים שלישיים.</li><li>Load test בתנאים דומים לפרודקשן (או בפרודקשן עם תנועה סינתטית) כדי למצוא את צוואר הבקבוק הראשון; מתקנים וחוזרים. לרוב DB, מגבלות חיבורים או quota של API חיצוני.</li><li>Pre-scale: autoscaling איטי מדי לקפיצה בדקה הראשונה; מחממים מראש instances, LBs, caches. מבקשים הגדלת quotas בענן שבועות מראש.</li><li>שכבת data: read replicas, caching, הפיכת כתיבות לא קריטיות לאסינכרוניות (תורים).</li><li>תוכנית degradation: feature flags לכיבוי פיצ'רים לא חיוניים (המלצות, ביקורות), waiting room מבוסס תור, load shedding לפי עדיפות.</li><li>Change freeze בשבוע האחרון, war room עם runbooks ודשבורדים, ואחר כך סקירה אחרי האירוע.</li></ol>"
  },
  levelUp: { en: "Principal answers frame it as a cross-org program with owners per dependency, explicit cost trade-offs (reserved vs on-demand), and a capacity model that is reused every year instead of a one-off fire drill.",
             he: "תשובת Principal ממסגרת את זה כתוכנית חוצת-ארגון עם בעלים לכל תלות, trade-offs מפורשים של עלות (reserved מול on-demand), ומודל capacity שחוזר כל שנה במקום תרגיל כיבוי שריפות חד-פעמי." },
  links: ["#/lesson/rel-capacity-planning", "#/lesson/arch-scaling", "#/lesson/k8s-autoscaling", "#/lesson/staff-overload-metastable"]
});

/* =========================== BEHAVIORAL (8) =========================== */

INFRA.topQuestions.push({
  id: "top-beh-conflict",
  cat: "behavioral",
  level: "senior",
  companies: ["Amazon", "Meta", "Google", "Microsoft"],
  q: { en: "Tell me about a time you had a strong disagreement with a colleague or another team. How did you resolve it?",
       he: "ספר על פעם שהיתה לך מחלוקת חזקה עם עמית או עם צוות אחר. איך זה נפתר?" },
  signal: { en: "Can you disagree with data and respect, separate people from problems, and reach an outcome that is good for the business rather than winning the argument?",
            he: "האם אתה יודע לחלוק עם נתונים ובכבוד, להפריד בין אנשים לבעיות, ולהגיע לתוצאה שטובה לעסק ולא רק לנצח בוויכוח?" },
  outline: {
    en: "<ol><li>Use STAR: Situation, Task, Action, Result; ~2-3 minutes, 60%+ of the time on Action.</li><li>Pick a real technical disagreement with stakes (e.g. build a new service vs extend an existing one), not a personality clash.</li><li>Show you first understood their position and constraints (1:1, asked questions).</li><li>Show how you used data: a prototype, a benchmark, a cost estimate, a design doc with options.</li><li>Explain how the decision was made (who decided, what criteria) and how the relationship came out.</li><li>Result with numbers, plus what you learned and would do differently.</li></ol>",
    he: "<ol><li>משתמשים ב-STAR: Situation, Task, Action, Result; ~2-3 דקות, יותר מ-60% מהזמן על Action.</li><li>לבחור מחלוקת טכנית אמיתית עם השלכות (למשל לבנות service חדש מול להרחיב קיים), לא התנגשות אישית.</li><li>להראות שקודם הבנת את העמדה והאילוצים שלהם (1:1, שאלת שאלות).</li><li>להראות איך השתמשת בנתונים: prototype, benchmark, הערכת עלות, design doc עם אפשרויות.</li><li>להסביר איך התקבלה ההחלטה (מי החליט, לפי אילו קריטריונים) ואיך יצאה מזה מערכת היחסים.</li><li>תוצאה עם מספרים, ומה למדת ומה היית עושה אחרת.</li></ol>"
  },
  levelUp: { en: "At Staff+, the conflict is cross-org (competing roadmaps, platform vs product team) and you resolved it by changing the decision process or alignment, not just one decision.",
             he: "ב-Staff+ המחלוקת היא חוצת ארגון (roadmaps מתחרים, צוות פלטפורמה מול צוות מוצר) ופתרת אותה בכך ששינית את תהליך ההחלטה או את ה-alignment, לא רק החלטה אחת." },
  links: ["#/interview/behavioral", "#/lesson/staff-influence"]
});

INFRA.topQuestions.push({
  id: "top-beh-failure",
  cat: "behavioral",
  level: "senior",
  companies: ["Amazon", "Google", "Netflix", "Microsoft"],
  q: { en: "Tell me about a time you failed or caused a production incident.",
       he: "ספר על פעם שנכשלת או שגרמת לתקלה בפרודקשן." },
  signal: { en: "Ownership without blame-shifting, a blameless learning mindset, and evidence that the lesson changed the system, not just you.",
            he: "Ownership בלי להעביר אשמה, גישת blameless של למידה, והוכחה שהלקח שינה את המערכת ולא רק אותך." },
  outline: {
    en: "<ol><li>Choose a real failure with real impact (a bad deploy, a missed dependency, a wrong estimate); a fake 'I work too hard' answer is a red flag.</li><li>Own it in the first sentence: 'I shipped a config change that ...'.</li><li>Describe detection and mitigation: how fast, what you did first (rollback before root cause).</li><li>Root cause with depth (5 whys), including why safeguards did not catch it.</li><li>Systemic fixes: tests, canaries, guardrails, runbooks - and their measurable effect.</li><li>What you personally do differently now.</li></ol>",
    he: "<ol><li>לבחור כישלון אמיתי עם השפעה אמיתית (deploy רע, תלות שפוספסה, הערכה שגויה); תשובה מזויפת בסגנון 'אני עובד קשה מדי' היא דגל אדום.</li><li>לקחת אחריות במשפט הראשון: 'אני שחררתי שינוי config ש...'.</li><li>לתאר זיהוי ו-mitigation: כמה מהר, מה עשית קודם (rollback לפני root cause).</li><li>Root cause לעומק (5 whys), כולל למה ה-safeguards לא תפסו.</li><li>תיקונים מערכתיים: טסטים, canaries, guardrails, runbooks - וההשפעה המדידה שלהם.</li><li>מה אתה עושה אחרת היום באופן אישי.</li></ol>"
  },
  levelUp: { en: "Staff+ stories show you changed how the org handles failure: postmortem culture, a new release safety mechanism adopted by many teams, or a class of incidents eliminated.",
             he: "סיפורי Staff+ מראים ששינית את הדרך שבה הארגון מתמודד עם כישלון: תרבות postmortem, מנגנון בטיחות שחרור שאומץ ע״י הרבה צוותים, או חיסול של סוג שלם של תקלות." },
  links: ["#/interview/behavioral", "#/lesson/rel-incident-management", "#/lesson/staff-large-incidents"]
});

INFRA.topQuestions.push({
  id: "top-beh-ownership",
  cat: "behavioral",
  level: "senior",
  companies: ["Amazon", "Stripe", "Meta", "Netflix"],
  q: { en: "Tell me about a time you took on something outside your area of responsibility because it needed to be done.",
       he: "ספר על פעם שלקחת על עצמך משהו מחוץ לתחום האחריות שלך כי מישהו היה צריך לעשות אותו." },
  signal: { en: "Amazon's 'Ownership' principle: do you act like an owner of the outcome, think long term, and avoid 'that's not my job'?",
            he: "עקרון ה-'Ownership' של Amazon: האם אתה מתנהג כבעלים של התוצאה, חושב לטווח ארוך, ונמנע מ'זה לא התפקיד שלי'?" },
  outline: {
    en: "<ol><li>Situation: a gap nobody owned (flaky CI, an orphaned service, missing on-call runbooks, recurring alerts).</li><li>Why it mattered: quantify the cost (hours lost per week, incidents, customer impact).</li><li>Action: how you raised it, got buy-in, balanced it with your own commitments.</li><li>Make it sustainable: found a long-term owner, documented, automated.</li><li>Result with numbers (e.g. CI flake rate from 15% to 2%).</li></ol>",
    he: "<ol><li>Situation: פער שאף אחד לא היה הבעלים שלו (CI לא יציב, service יתום, חסרים runbooks ל-on-call, alerts חוזרים).</li><li>למה זה היה חשוב: לכמת את העלות (שעות שהולכות לאיבוד בשבוע, תקלות, השפעה על לקוחות).</li><li>Action: איך העלית את זה, השגת buy-in, ואיזנת מול ההתחייבויות שלך.</li><li>להפוך את זה לבר-קיימא: מצאת בעלים לטווח ארוך, תיעדת, עשית אוטומציה.</li><li>תוצאה עם מספרים (למשל flake rate ב-CI ירד מ-15% ל-2%).</li></ol>"
  },
  levelUp: { en: "Staff+ ownership spans teams: you noticed an org-level gap (e.g. no one owned cost or reliability of a shared dependency) and created the structure that owns it now.",
             he: "Ownership ברמת Staff+ חוצה צוותים: זיהית פער ברמת הארגון (למשל אף אחד לא היה אחראי על עלות או reliability של תלות משותפת) ויצרת את המבנה שאחראי עליו עכשיו." },
  links: ["#/interview/behavioral", "#/lesson/staff-production-readiness"]
});

INFRA.topQuestions.push({
  id: "top-beh-dive-deep",
  cat: "behavioral",
  level: "senior",
  companies: ["Amazon", "Datadog", "Google", "Cloudflare"],
  q: { en: "Tell me about the hardest technical problem you debugged. How did you get to the root cause?",
       he: "ספר על הבעיה הטכנית הכי קשה שעשית לה debug. איך הגעת ל-root cause?" },
  signal: { en: "'Dive Deep': real technical depth, a scientific method (hypothesis, measure, eliminate), and persistence when metrics and anecdotes disagree.",
            he: "'Dive Deep': עומק טכני אמיתי, שיטה מדעית (השערה, מדידה, שלילה), והתמדה כשה-metrics והסיפורים לא מסתדרים." },
  outline: {
    en: "<ol><li>Pick a problem with a satisfying root cause (kernel / network / concurrency / GC / clock skew bug) that was hard because the obvious answers were wrong.</li><li>Set the stakes: impact and why others had given up or misdiagnosed.</li><li>Walk through hypotheses and how you tested each one (tools: tcpdump, perf, strace, flame graphs, traces).</li><li>The breakthrough: the specific data point that cracked it.</li><li>Fix + how you verified it and prevented recurrence (test, alert, upstream patch).</li><li>Keep it understandable: the interviewer may not know your stack.</li></ol>",
    he: "<ol><li>לבחור בעיה עם root cause מספק (באג בקרנל / רשת / concurrency / GC / clock skew) שהיתה קשה כי התשובות המתבקשות היו שגויות.</li><li>להציג את מה שעמד על הכף: ההשפעה, ולמה אחרים ויתרו או אבחנו לא נכון.</li><li>לעבור על ההשערות ואיך בדקת כל אחת (כלים: tcpdump, perf, strace, flame graphs, traces).</li><li>הפריצה: נקודת המידע הספציפית שפיצחה את זה.</li><li>תיקון + איך אימתת ומנעת חזרה (טסט, alert, patch ל-upstream).</li><li>לשמור על זה מובן: יכול להיות שהמראיין לא מכיר את ה-stack שלך.</li></ol>"
  },
  levelUp: { en: "Staff+ answers show leverage from the investigation: a tool, technique or observability improvement that made the next 50 investigations faster for everyone.",
             he: "תשובות Staff+ מראות מינוף מהחקירה: כלי, טכניקה או שיפור observability שהאיץ את 50 החקירות הבאות לכולם." },
  links: ["#/interview/behavioral", "#/lesson/linux-performance-60s", "#/lesson/net-troubleshooting"]
});

INFRA.topQuestions.push({
  id: "top-beh-disagree-commit",
  cat: "behavioral",
  level: "senior",
  companies: ["Amazon", "Meta", "Netflix", "Microsoft"],
  q: { en: "Tell me about a time you disagreed with a decision from your manager or leadership, but committed to it anyway.",
       he: "ספר על פעם שלא הסכמת עם החלטה של המנהל או של ההנהלה, אבל התחייבת אליה בכל זאת." },
  signal: { en: "'Have Backbone; Disagree and Commit': did you push back clearly with data, and then execute fully without sabotage or 'I told you so'?",
            he: "'Have Backbone; Disagree and Commit': האם התנגדת בבירור עם נתונים, ואז ביצעת עד הסוף בלי חבלה ובלי 'אמרתי לכם'?" },
  outline: {
    en: "<ol><li>The decision and why you disagreed - specific, technical or business reasons.</li><li>How you voiced it: in the right forum, with data, proposing alternatives and stating the risks in writing.</li><li>The decision stood: show you understood the reasons (context you did not have, timelines, strategy).</li><li>How you committed: delivered fully, mitigated the risks you had flagged.</li><li>Outcome - either way is fine - and what you learned about when to escalate vs commit.</li></ol>",
    he: "<ol><li>ההחלטה ולמה לא הסכמת - סיבות ספציפיות, טכניות או עסקיות.</li><li>איך הבעת את זה: בפורום הנכון, עם נתונים, עם הצעת חלופות וכתיבת הסיכונים.</li><li>ההחלטה נשארה: להראות שהבנת את הסיבות (הקשר שלא היה לך, לוחות זמנים, אסטרטגיה).</li><li>איך התחייבת: ביצעת עד הסוף, צמצמת את הסיכונים שהצפת.</li><li>תוצאה - כל כיוון בסדר - ומה למדת על מתי להסלים ומתי להתחייב.</li></ol>"
  },
  levelUp: { en: "At Staff+, show the opposite side too: a time you made a call others disagreed with, and how you created space for dissent and earned their commitment.",
             he: "ב-Staff+ להראות גם את הצד השני: פעם שקיבלת החלטה שאחרים לא הסכימו איתה, ואיך יצרת מקום להתנגדות והשגת את המחויבות שלהם." },
  links: ["#/interview/behavioral", "#/lesson/staff-influence"]
});

INFRA.topQuestions.push({
  id: "top-beh-biggest-impact",
  cat: "behavioral",
  level: "senior",
  companies: ["Meta", "Google", "Amazon", "Apple", "Uber"],
  q: { en: "What is the project you are most proud of? What was your specific contribution and impact?",
       he: "על איזה פרויקט אתה הכי גאה? מה היתה התרומה הספציפית שלך ומה ההשפעה?" },
  signal: { en: "Scope and impact calibrated to the level: they listen for 'I' vs 'we', the size of the problem, and measurable outcomes.",
            he: "היקף והשפעה מכוילים לרמה: מקשיבים ל'אני' מול 'אנחנו', לגודל הבעיה, ולתוצאות מדידות." },
  outline: {
    en: "<ol><li>Pick the project whose scope matches the level you are interviewing for.</li><li>Context in 30 seconds: the problem, why it mattered to the business.</li><li>Your role precisely: what you designed, decided, built, convinced people of. Say 'I' for your parts.</li><li>The hardest part and the key trade-off you made.</li><li>Impact with numbers: latency -40%, cost -$1.2M/yr, incidents -70%, adoption by 30 teams.</li><li>Be ready for drill-downs: the interviewer will go 3-4 levels deep on any claim.</li></ol>",
    he: "<ol><li>לבחור פרויקט שההיקף שלו מתאים לרמה שאליה אתה מתראיין.</li><li>הקשר ב-30 שניות: הבעיה, ולמה היא היתה חשובה לעסק.</li><li>התפקיד שלך בדיוק: מה תכננת, החלטת, בנית, שכנעת. להגיד 'אני' על החלקים שלך.</li><li>החלק הכי קשה וה-trade-off המרכזי שבחרת.</li><li>השפעה עם מספרים: latency ירד ב-40%, עלות ירדה ב-1.2 מיליון דולר בשנה, תקלות ירדו ב-70%, אימוץ ע״י 30 צוותים.</li><li>להיות מוכן לצלילות: המראיין ירד 3-4 רמות לעומק על כל טענה.</li></ol>"
  },
  levelUp: { en: "Staff/Principal stories show multi-team or org-wide impact, that you identified the problem (not just solved an assigned one), and that the result outlived your involvement.",
             he: "סיפורי Staff/Principal מראים השפעה רב-צוותית או ארגונית, שאתה זיהית את הבעיה (ולא רק פתרת משהו שהוקצה לך), ושהתוצאה המשיכה לחיות גם אחרי שעזבת אותה." },
  links: ["#/interview/behavioral", "#/lesson/staff-interview-loop"]
});

INFRA.topQuestions.push({
  id: "top-beh-ambiguity",
  cat: "behavioral",
  level: "staff",
  companies: ["Google", "Meta", "Microsoft", "Amazon"],
  q: { en: "Tell me about a project that started with a very ambiguous problem. How did you bring clarity?",
       he: "ספר על פרויקט שהתחיל מבעיה מאוד עמומה. איך יצרת בהירות?" },
  signal: { en: "Can you define the problem, not just solve a defined one: framing, gathering data, choosing what not to do, and creating a plan others can follow.",
            he: "האם אתה יודע להגדיר את הבעיה, לא רק לפתור בעיה מוגדרת: מסגור, איסוף נתונים, בחירה מה לא לעשות, ויצירת תוכנית שאחרים יכולים ללכת אחריה." },
  outline: {
    en: "<ol><li>The ambiguity: vague goal ('make the platform more reliable', 'reduce cloud cost'), no owner, conflicting opinions.</li><li>How you gathered signal: incident data, user interviews, cost breakdowns, talking to stakeholders.</li><li>How you framed it: problem statement, success metrics, explicit non-goals.</li><li>Decision doc with options and trade-offs; how you got alignment.</li><li>Iterative delivery: small first milestone to validate the direction.</li><li>Result and what you would frame differently.</li></ol>",
    he: "<ol><li>העמימות: מטרה מעורפלת ('לשפר את ה-reliability של הפלטפורמה', 'להוריד עלויות ענן'), אין בעלים, דעות סותרות.</li><li>איך אספת סיגנל: נתוני תקלות, ראיונות משתמשים, פירוק עלויות, שיחות עם stakeholders.</li><li>איך מסגרת: problem statement, מדדי הצלחה, non-goals מפורשים.</li><li>מסמך החלטה עם אפשרויות ו-trade-offs; איך השגת alignment.</li><li>Delivery איטרטיבי: milestone ראשון קטן כדי לאמת את הכיוון.</li><li>תוצאה, ומה היית ממסגר אחרת.</li></ol>"
  },
  levelUp: { en: "Principal-level ambiguity is multi-year and org-wide; the story should show you set a direction that several teams adopted and that you managed risk while information was incomplete.",
             he: "עמימות ברמת Principal היא רב-שנתית וארגונית; הסיפור צריך להראות שקבעת כיוון שכמה צוותים אימצו, ושניהלת סיכון כשהמידע עוד היה חלקי." },
  links: ["#/interview/behavioral", "#/lesson/staff-design-docs"]
});

INFRA.topQuestions.push({
  id: "top-beh-mentoring",
  cat: "behavioral",
  level: "staff",
  companies: ["Google", "Meta", "Microsoft", "Amazon", "LinkedIn"],
  q: { en: "Tell me about someone you mentored. How did you help them grow?",
       he: "ספר על מישהו שליווית כמנטור. איך עזרת לו לצמוח?" },
  signal: { en: "Senior+ engineers multiply others: do you grow people deliberately (tailored, measurable) rather than just answering their questions?",
            he: "מהנדסי Senior+ מכפילים אחרים: האם אתה מצמיח אנשים באופן מכוון (מותאם ומדיד) ולא רק עונה על שאלות?" },
  outline: {
    en: "<ol><li>The person and their starting point (new grad, a strong engineer stuck at a level, someone moving into SRE).</li><li>How you identified their gap: observation, feedback, their own goals.</li><li>What you did: stretch project with a safety net, design review coaching, letting them lead an incident or a design doc.</li><li>How you adjusted when something did not work.</li><li>Outcome: promotion, now owns a system, mentors others.</li><li>What you learned about mentoring.</li></ol>",
    he: "<ol><li>האדם ונקודת הפתיחה שלו (בוגר טרי, מהנדס חזק שתקוע ברמה, מישהו שעובר ל-SRE).</li><li>איך זיהית את הפער: תצפית, פידבק, המטרות שלו עצמו.</li><li>מה עשית: פרויקט מאתגר עם רשת ביטחון, ליווי ב-design reviews, לתת לו להוביל תקלה או design doc.</li><li>איך התאמת כשמשהו לא עבד.</li><li>תוצאה: קידום, הוא עכשיו בעלים של מערכת, הוא מלווה אחרים.</li><li>מה למדת על mentoring.</li></ol>"
  },
  levelUp: { en: "Staff+ answers scale it beyond individuals: an onboarding program, an on-call training rotation, or a design-review culture that raised the level of a whole group.",
             he: "תשובות Staff+ מרחיבות מעבר לאנשים בודדים: תוכנית onboarding, רוטציית הכשרה ל-on-call, או תרבות design review שהעלתה את הרמה של קבוצה שלמה." },
  links: ["#/interview/behavioral", "#/lesson/staff-influence"]
});

/* =========================== LEADERSHIP / STAFF+ (6) =========================== */

INFRA.topQuestions.push({
  id: "top-lead-technical-direction",
  cat: "leadership",
  level: "principal",
  companies: ["Google", "Meta", "Amazon", "Microsoft", "Netflix"],
  q: { en: "Tell me about a time you set the technical direction for multiple teams. How did you decide, and how did you get people to follow?",
       he: "ספר על פעם שקבעת את הכיוון הטכני לכמה צוותים. איך החלטת, ואיך גרמת לאנשים ללכת אחריך?" },
  signal: { en: "Strategy, not just architecture: diagnosing the real problem, making explicit bets, and turning a vision into a roadmap that survives contact with reality.",
            he: "אסטרטגיה, לא רק ארכיטקטורה: לאבחן את הבעיה האמיתית, לעשות הימורים מפורשים, ולהפוך חזון ל-roadmap ששורד את המציאות." },
  outline: {
    en: "<ol><li>Diagnosis: the problem that spanned teams (e.g. 5 deployment systems, rising incident rate, cloud cost growing 2x faster than revenue).</li><li>How you built the picture: data, interviews, an inventory of the current state.</li><li>The strategy doc: guiding principles, the 2-3 big bets, what you explicitly will NOT do.</li><li>Alignment: pre-wiring key stakeholders 1:1 before the big review, adjusting based on feedback.</li><li>Execution: phased roadmap with milestones, teams owning pieces, metrics to track.</li><li>Results and how the direction evolved as you learned.</li></ol>",
    he: "<ol><li>אבחון: הבעיה שחצתה צוותים (למשל 5 מערכות deploy, קצב תקלות עולה, עלות ענן שגדלה פי 2 מהר יותר מההכנסות).</li><li>איך בנית את התמונה: נתונים, ראיונות, מיפוי של המצב הקיים.</li><li>מסמך האסטרטגיה: עקרונות מנחים, 2-3 ההימורים הגדולים, ומה במפורש לא עושים.</li><li>Alignment: pre-wiring של stakeholders מרכזיים ב-1:1 לפני הסקירה הגדולה, והתאמה לפי פידבק.</li><li>ביצוע: roadmap בשלבים עם milestones, צוותים שאחראים על חלקים, ומדדים למעקב.</li><li>תוצאות, ואיך הכיוון התפתח ככל שלמדתם.</li></ol>"
  },
  levelUp: { en: "Principal answers tie the direction to business strategy over 2-3 years, show how you handled the teams that lost something, and how you measured whether the bet paid off.",
             he: "תשובת Principal קושרת את הכיוון לאסטרטגיה העסקית ל-2-3 שנים, מראה איך טיפלת בצוותים שהפסידו משהו, ואיך מדדת אם ההימור השתלם." },
  links: ["#/lesson/staff-tech-strategy", "#/lesson/staff-design-docs", "#/interview/behavioral"]
});

INFRA.topQuestions.push({
  id: "top-lead-influence",
  cat: "leadership",
  level: "staff",
  companies: ["Google", "Meta", "Stripe", "Netflix", "Microsoft"],
  q: { en: "Tell me about a time you had to influence a team or leader you had no authority over.",
       he: "ספר על פעם שהיית צריך להשפיע על צוות או מנהל שלא היתה לך סמכות עליהם." },
  signal: { en: "Staff engineers lead without a reporting line: trust, understanding others' incentives, and making the right thing the easy thing.",
            he: "מהנדסי Staff מובילים בלי קו דיווח: אמון, הבנת התמריצים של אחרים, והפיכת הדבר הנכון לדבר הקל." },
  outline: {
    en: "<ol><li>The ask: you needed another team to change something (adopt a standard, fix a reliability issue, prioritize your dependency).</li><li>Understand their incentives and constraints: what is on their roadmap, what they are measured on.</li><li>Make it a win for them: reduce their cost (you write the first PR, provide tooling), tie it to their goals.</li><li>Use data and shared forums (design reviews, SLO reviews) rather than escalation; escalate only as a last, transparent step.</li><li>Outcome and the relationship afterwards.</li></ol>",
    he: "<ol><li>הבקשה: היית צריך שצוות אחר ישנה משהו (יאמץ סטנדרט, יתקן בעיית reliability, יתעדף תלות שלך).</li><li>להבין את התמריצים והאילוצים שלהם: מה ב-roadmap שלהם, על מה הם נמדדים.</li><li>להפוך את זה לניצחון שלהם: להוריד להם עלות (אתה כותב את ה-PR הראשון, מספק tooling), לקשור למטרות שלהם.</li><li>להשתמש בנתונים ובפורומים משותפים (design reviews, SLO reviews) ולא בהסלמה; להסלים רק כצעד אחרון ושקוף.</li><li>תוצאה, ומה מצב מערכת היחסים אחרי.</li></ol>"
  },
  levelUp: { en: "Principal-level influence changes org mechanisms (an architecture review process, a paved road everyone adopts), so the right behavior happens without you in the room.",
             he: "השפעה ברמת Principal משנה מנגנונים ארגוניים (תהליך architecture review, paved road שכולם מאמצים), כך שההתנהגות הנכונה קורית גם כשאתה לא בחדר." },
  links: ["#/lesson/staff-influence", "#/interview/behavioral"]
});

INFRA.topQuestions.push({
  id: "top-lead-build-vs-buy",
  cat: "leadership",
  level: "staff",
  companies: ["Amazon", "Netflix", "Datadog", "Uber", "Airbnb"],
  q: { en: "How do you decide whether to build an internal system or buy / adopt an existing product (managed service, open source, vendor)? Give an example.",
       he: "איך מחליטים אם לבנות מערכת פנימית או לקנות / לאמץ מוצר קיים (managed service, open source, vendor)? תן דוגמה." },
  signal: { en: "Business judgment: total cost of ownership, strategic differentiation, and the long tail of operating what you build.",
            he: "שיקול דעת עסקי: עלות בעלות כוללת (TCO), בידול אסטרטגי, והזנב הארוך של תפעול מה שבונים." },
  outline: {
    en: "<ol><li>Is it core to our differentiation? If not, default to buy / managed.</li><li>TCO over 3 years: licenses or cloud bill vs engineers to build AND operate (on-call, upgrades, security patches). One engineer is ~$250-400K/yr fully loaded.</li><li>Fit: requirements a product cannot meet (scale, compliance, latency, data residency).</li><li>Risk: vendor lock-in, vendor viability, exit strategy (open standards like OpenTelemetry, Terraform, Kubernetes APIs).</li><li>Time to value: buying usually wins months.</li><li>Example with numbers and a review date - decisions should be revisited as scale changes.</li></ol>",
    he: "<ol><li>האם זה ליבת הבידול שלנו? אם לא, ברירת המחדל היא לקנות / managed.</li><li>TCO על 3 שנים: רישיונות או חשבון ענן מול מהנדסים שבונים וגם מתפעלים (on-call, upgrades, patches אבטחה). מהנדס אחד עולה ~250-400 אלף דולר בשנה כולל הכל.</li><li>התאמה: דרישות שמוצר לא יכול לעמוד בהן (סקייל, compliance, latency, data residency).</li><li>סיכון: vendor lock-in, יציבות הספק, אסטרטגיית יציאה (סטנדרטים פתוחים כמו OpenTelemetry, Terraform, Kubernetes APIs).</li><li>Time to value: קנייה בדרך כלל חוסכת חודשים.</li><li>דוגמה עם מספרים ותאריך לבחינה מחדש - החלטות צריך לבחון שוב כשהסקייל משתנה.</li></ol>"
  },
  levelUp: { en: "Principal answers frame it as a portfolio decision across the org and include the 'build later' trigger: the cost or scale threshold at which you will revisit.",
             he: "תשובת Principal ממסגרת את זה כהחלטת portfolio ברמת הארגון וכוללת את הטריגר ל'נבנה אחר כך': סף העלות או הסקייל שבו בוחנים מחדש." },
  links: ["#/lesson/staff-platform-engineering", "#/lesson/cloud-finops", "#/lesson/staff-tech-strategy"]
});

INFRA.topQuestions.push({
  id: "top-lead-migration",
  cat: "leadership",
  level: "staff",
  companies: ["Uber", "Stripe", "Airbnb", "LinkedIn", "Meta"],
  q: { en: "Tell me about a large migration you led (e.g. to Kubernetes, a new database, a new cloud). How did you get it done?",
       he: "ספר על מיגרציה גדולה שהובלת (למשל ל-Kubernetes, ל-database חדש, לענן חדש). איך הבאת אותה לסיום?" },
  signal: { en: "Most migrations stall at 80%: they look for incremental, reversible steps, making the new path easier than the old one, and finishing the long tail.",
            he: "רוב המיגרציות נתקעות ב-80%: מחפשים צעדים הדרגתיים והפיכים, הפיכת המסלול החדש לקל יותר מהישן, וסגירת הזנב הארוך." },
  outline: {
    en: "<ol><li>Why migrate: the business case in numbers (cost, incidents, velocity), and the cost of NOT migrating.</li><li>Plan: inventory, classify by risk/complexity, migrate easy wins first to build confidence and tooling.</li><li>Make it cheap for teams: automation, codemods, the platform team does most of the work.</li><li>Safety: dual-run / shadow traffic, gradual traffic shift, rollback at every step.</li><li>Track progress publicly (dashboard of % migrated), deadlines with exceptions process.</li><li>The long tail: dedicated effort, deprecation dates, finally turning off the old system.</li><li>Results and lessons.</li></ol>",
    he: "<ol><li>למה מיגרציה: ה-business case במספרים (עלות, תקלות, velocity), ומה עולה לא לעשות אותה.</li><li>תכנון: מיפוי, סיווג לפי סיכון/מורכבות, להתחיל מהקלים כדי לבנות ביטחון ו-tooling.</li><li>להפוך את זה לזול לצוותים: אוטומציה, codemods, צוות הפלטפורמה עושה את רוב העבודה.</li><li>בטיחות: dual-run / shadow traffic, הסטת תנועה הדרגתית, rollback בכל שלב.</li><li>מעקב התקדמות פומבי (דשבורד של % שעבר), deadlines עם תהליך חריגות.</li><li>הזנב הארוך: מאמץ ייעודי, תאריכי deprecation, ובסוף לכבות את המערכת הישנה.</li><li>תוצאות ולקחים.</li></ol>"
  },
  levelUp: { en: "Principal answers discuss sequencing across many migrations at once (migration fatigue), funding the long tail, and how the migration changed the org's capability, not just the stack.",
             he: "תשובת Principal מדברת על תזמון בין הרבה מיגרציות במקביל (migration fatigue), מימון הזנב הארוך, ואיך המיגרציה שינתה את היכולת של הארגון ולא רק את ה-stack." },
  links: ["#/lesson/staff-migrations-at-scale", "#/lesson/staff-zero-downtime-migrations", "#/interview/behavioral"]
});

INFRA.topQuestions.push({
  id: "top-lead-reverse-decision",
  cat: "leadership",
  level: "principal",
  companies: ["Amazon", "Google", "Netflix", "Meta"],
  q: { en: "Tell me about a significant technical decision you made that turned out to be wrong. What would you do differently?",
       he: "ספר על החלטה טכנית משמעותית שקיבלת והתבררה כשגויה. מה היית עושה אחרת?" },
  signal: { en: "Self-awareness and judgment: did you notice early, reverse decisively, and improve how decisions are made (one-way vs two-way doors)?",
            he: "מודעות עצמית ושיקול דעת: האם שמת לב מוקדם, הפכת את ההחלטה בנחישות, ושיפרת את הדרך שבה מקבלים החלטות (one-way מול two-way doors)?" },
  outline: {
    en: "<ol><li>A real decision with real cost (chose a datastore, split into microservices too early, built instead of bought).</li><li>Why it seemed right at the time: the information and constraints you had.</li><li>The signals it was wrong and how long it took you to see them (be honest).</li><li>How you reversed or contained it: cost of the reversal, communication to stakeholders.</li><li>What changed in your decision process: reversibility analysis, kill criteria defined up front, smaller experiments before one-way doors.</li></ol>",
    he: "<ol><li>החלטה אמיתית עם עלות אמיתית (בחירת datastore, פיצול ל-microservices מוקדם מדי, לבנות במקום לקנות).</li><li>למה היא נראתה נכונה אז: המידע והאילוצים שהיו לך.</li><li>הסימנים שהיא שגויה, וכמה זמן לקח לך לראות אותם (בכנות).</li><li>איך הפכת או הכלת אותה: עלות ההיפוך, תקשורת ל-stakeholders.</li><li>מה השתנה בתהליך קבלת ההחלטות שלך: ניתוח הפיכות, kill criteria שמוגדרים מראש, ניסויים קטנים לפני one-way doors.</li></ol>"
  },
  levelUp: { en: "Principal answers own a decision with org-level blast radius and show you built mechanisms (decision records, review checkpoints) that make the whole org better at reversing course.",
             he: "תשובת Principal לוקחת אחריות על החלטה עם blast radius ארגוני ומראה שבנית מנגנונים (decision records, נקודות בדיקה) שעוזרים לכל הארגון לשנות כיוון טוב יותר." },
  links: ["#/lesson/staff-design-docs", "#/lesson/staff-tech-strategy", "#/interview/behavioral"]
});

INFRA.topQuestions.push({
  id: "top-lead-raise-bar",
  cat: "leadership",
  level: "principal",
  companies: ["Amazon", "Google", "Meta", "Microsoft"],
  q: { en: "How have you raised the engineering bar in your organization - in quality, reliability or hiring?",
       he: "איך העלית את רף ההנדסה בארגון שלך - באיכות, ב-reliability או בגיוס?" },
  signal: { en: "Leverage: do you improve standards through scalable mechanisms (reviews, readiness checks, hiring calibration) rather than heroics?",
            he: "מינוף: האם אתה משפר סטנדרטים דרך מנגנונים שגדלים (reviews, readiness checks, כיול גיוס) ולא דרך גבורה אישית?" },
  outline: {
    en: "<ol><li>The gap: e.g. inconsistent launches causing incidents, weak design reviews, uneven hiring decisions.</li><li>The mechanism you introduced: production readiness review checklist, design review forum, SLO requirement for tier-1 services, structured interview rubrics / bar-raiser-style calibration.</li><li>How you made it lightweight enough that teams adopted it rather than routed around it.</li><li>How you measured impact (incidents per launch, review turnaround, hire quality / regretted attrition).</li><li>How it sustained without you: other owners, automation, part of the culture.</li></ol>",
    he: "<ol><li>הפער: למשל launches לא עקביים שגורמים לתקלות, design reviews חלשים, החלטות גיוס לא אחידות.</li><li>המנגנון שהכנסת: checklist ל-production readiness review, פורום design review, דרישת SLO ל-services ב-tier 1, rubrics מובנים לראיונות / כיול בסגנון bar raiser.</li><li>איך הפכת אותו לקליל מספיק כדי שצוותים יאמצו אותו ולא יעקפו אותו.</li><li>איך מדדת השפעה (תקלות ל-launch, זמן תגובה ל-reviews, איכות גיוס / regretted attrition).</li><li>איך זה המשיך בלעדיך: בעלים אחרים, אוטומציה, חלק מהתרבות.</li></ol>"
  },
  levelUp: { en: "The Principal bar is setting standards beyond your org (company-wide guidance, an internal tech talk series, an industry-visible practice) while staying pragmatic about cost.",
             he: "הרף של Principal הוא לקבוע סטנדרטים מעבר לארגון שלך (הנחיות לכל החברה, סדרת tech talks פנימית, פרקטיקה שנראית בתעשייה) תוך שמירה על פרגמטיות לגבי עלות." },
  links: ["#/lesson/staff-production-readiness", "#/lesson/staff-interview-loop", "#/interview/behavioral"]
});
