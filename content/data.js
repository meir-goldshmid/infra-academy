window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// =====================================================================
// Track: data — databases, indexes, transactions, replication, sharding,
// CAP, backups, operations
// =====================================================================

INFRA.lessons.push({
  id: "db-sql-vs-nosql",
  track: "data",
  order: 1,
  icon: "🗄️",
  level: 1,
  minutes: 10,
  title: { en: "SQL vs NoSQL: Picking the Right Database", he: "SQL מול NoSQL: איך בוחרים database" },
  tldr: {
    en: "Start with Postgres unless your access pattern screams otherwise; every other database is a specialist that trades flexibility for one superpower.",
    he: "מתחילים עם Postgres, אלא אם ה-access pattern שלכם צועק אחרת. כל database אחר הוא מומחה שמוותר על גמישות בשביל כוח-על אחד."
  },
  analogy: {
    en: "A relational DB is a Swiss Army knife: it does everything well enough. Redis is a scalpel, Cassandra is a conveyor belt, Neo4j is a spiderweb, Elasticsearch is a librarian with a photographic memory. You don't perform surgery with a Swiss Army knife — but you also don't open a can of beans with a scalpel.",
    he: "DB רלציוני הוא אולר שוויצרי: עושה הכול טוב מספיק. Redis הוא אזמל מנתחים, Cassandra היא מסוע במפעל, Neo4j היא קורי עכביש, ו-Elasticsearch היא ספרנית עם זיכרון צילומי. לא עושים ניתוח עם אולר — אבל גם לא פותחים קופסת שימורים עם אזמל."
  },
  sections: [
    {
      h: { en: "Relational (SQL): the default for a reason", he: "רלציוני (SQL): ברירת המחדל, ובצדק" },
      body: {
        en: `<p><strong>PostgreSQL</strong> and <strong>MySQL</strong> store data in tables with a fixed schema, enforce relationships with foreign keys, and give you <strong>ACID transactions</strong> and a query language (SQL) that can answer questions you didn't anticipate when you designed the schema. That last part is the killer feature: with <code>JOIN</code>, <code>GROUP BY</code> and ad-hoc filters, you don't need to know every query up front.</p>
<p>Modern Postgres also does JSON (<code>jsonb</code> with GIN indexes), full-text search, geospatial (PostGIS), and even vectors (pgvector). A single well-tuned Postgres on a decent box handles tens of thousands of transactions per second and multiple TB of data — far more than most startups will ever need.</p>
<blockquote>💡 Real world: "We need NoSQL to scale" is said far more often than it's true. Many unicorns ran on a single primary Postgres + read replicas for years. Choose NoSQL for a specific access pattern, not for vibes.</blockquote>`,
        he: `<p><strong>PostgreSQL</strong> ו-<strong>MySQL</strong> שומרים data בטבלאות עם schema קבוע, אוכפים קשרים עם foreign keys, ונותנים <strong>ACID transactions</strong> ושפת שאילתות (SQL) שיודעת לענות על שאלות שלא חשבתם עליהן כשתכננתם את ה-schema. זה הקטע הכי חזק: עם <code>JOIN</code>, <code>GROUP BY</code> ופילטרים אד-הוק, לא צריך לדעת מראש כל query.</p>
<p>Postgres מודרני עושה גם JSON (<code>jsonb</code> עם GIN index), full-text search, גיאו (PostGIS) ואפילו וקטורים (pgvector). Postgres אחד מכויל טוב על מכונה סבירה מחזיק עשרות אלפי טרנזקציות בשנייה וכמה TB של data — הרבה יותר ממה שרוב הסטארטאפים יצטרכו אי פעם.</p>
<blockquote>💡 מהשטח: "אנחנו צריכים NoSQL כדי לעשות scale" נאמר הרבה יותר פעמים ממה שזה נכון. הרבה יוניקורנים רצו שנים על primary אחד של Postgres ועוד כמה read replicas. בוחרים NoSQL בגלל access pattern ספציפי, לא בגלל vibe.</blockquote>`
      }
    },
    {
      h: { en: "Document & key-value: MongoDB, DynamoDB, Redis", he: "Document ו-key-value: MongoDB, DynamoDB, Redis" },
      body: {
        en: `<p><strong>Document stores</strong> (MongoDB, Couchbase) store JSON-like documents. Great when an entity is naturally a tree (an order with its line items) and you read it whole. Schema is flexible — which is a feature on day 1 and a liability on day 500 when you have 7 shapes of "user".</p>
<p><strong>Key-value stores</strong> do one thing: <code>GET key</code> / <code>PUT key value</code>, blazing fast. <strong>Redis</strong> is in-memory (sub-millisecond, ~100k+ ops/sec per core) and adds data structures: lists, sets, sorted sets (leaderboards!), streams, TTLs. Use it for caching, sessions, rate limiting, locks. <strong>DynamoDB</strong> is a managed, durable key-value/document store with single-digit-ms latency at any scale — but you must design around your access patterns up front (partition key + sort key), because queries outside them are expensive scans.</p>
<blockquote>⚠️ Production tip: Redis is not a primary database by default. With default persistence settings you can lose the last second(s) of writes on crash. Treat it as a cache unless you've deliberately configured AOF and replication.</blockquote>`,
        he: `<p><strong>Document stores</strong> (MongoDB, Couchbase) שומרים מסמכים בסגנון JSON. מעולה כשישות היא בטבעה עץ (הזמנה עם כל השורות שלה) וקוראים אותה בשלמותה. ה-schema גמיש — פיצ'ר ביום 1, ובעיה ביום 500 כשיש לכם 7 צורות שונות של "user".</p>
<p><strong>Key-value stores</strong> עושים דבר אחד: <code>GET key</code> / <code>PUT key value</code>, ממש מהר. <strong>Redis</strong> יושב בזיכרון (תת-מילישנייה, 100k+ פעולות בשנייה לליבה) ומוסיף מבני נתונים: lists, sets, sorted sets (טבלאות ניקוד!), streams ו-TTL. משתמשים בו ל-cache, sessions, rate limiting ו-locks. <strong>DynamoDB</strong> הוא key-value/document מנוהל ועמיד, עם latency של מילישניות בודדות בכל scale — אבל חייבים לתכנן מראש סביב ה-access patterns (partition key + sort key), כי query מחוץ להם הופך ל-scan יקר.</p>
<blockquote>⚠️ טיפ לפרודקשן: Redis הוא לא database ראשי כברירת מחדל. עם הגדרות persistence דיפולטיות אפשר לאבד את השנייה-שתיים האחרונות של כתיבות בקריסה. תתייחסו אליו כ-cache, אלא אם הגדרתם בכוונה AOF ו-replication.</blockquote>`
      }
    },
    {
      h: { en: "Wide-column, graph, time-series, search", he: "Wide-column, graph, time-series, search" },
      body: {
        en: `<p><strong>Wide-column</strong> (Cassandra, ScyllaDB, HBase, Bigtable): masterless, built for <em>massive write throughput</em> across many nodes and data centers — IoT events, messaging inboxes, activity feeds. You model one table per query; no joins, limited ad-hoc queries.</p>
<p><strong>Graph</strong> (Neo4j, Neptune): relationships are first-class. "Friends of friends who like jazz" is a multi-way self-join in SQL but a quick traversal in Cypher: <code>MATCH (me)-[:FRIEND*2]-&gt;(f)-[:LIKES]-&gt;(:Genre {name:'jazz'})</code>. Fraud rings, recommendations, permissions graphs.</p>
<p><strong>Time-series</strong> (InfluxDB, Prometheus TSDB, TimescaleDB): append-mostly data keyed by timestamp, heavy compression, downsampling and retention policies. Metrics and sensor data.</p>
<p><strong>Search</strong> (Elasticsearch/OpenSearch): inverted indexes for full-text search, fuzzy matching, relevance scoring and log analytics. It's a <em>secondary</em> index fed from your source of truth — not where your only copy of data should live.</p>`,
        he: `<p><strong>Wide-column</strong> (Cassandra, ScyllaDB, HBase, Bigtable): בלי master, בנוי ל-<em>write throughput מטורף</em> על פני הרבה nodes ו-data centers — אירועי IoT, תיבות הודעות, activity feeds. ממדלים טבלה אחת לכל query; אין joins, ו-query אד-הוק מוגבל.</p>
<p><strong>Graph</strong> (Neo4j, Neptune): הקשרים הם אזרח ראשון. "חברים של חברים שאוהבים ג'אז" זה כמה self-joins ב-SQL, אבל traversal קליל ב-Cypher: <code>MATCH (me)-[:FRIEND*2]-&gt;(f)-[:LIKES]-&gt;(:Genre {name:'jazz'})</code>. טבעות הונאה, המלצות, גרפים של הרשאות.</p>
<p><strong>Time-series</strong> (InfluxDB, Prometheus TSDB, TimescaleDB): data שרובו append לפי timestamp, דחיסה אגרסיבית, downsampling ו-retention policies. מטריקות ונתוני חיישנים.</p>
<p><strong>Search</strong> (Elasticsearch/OpenSearch): inverted index ל-full-text search, התאמה מקורבת (fuzzy), דירוג רלוונטיות ו-log analytics. זה index <em>משני</em> שמוזן מה-source of truth — לא המקום היחיד שבו ה-data שלכם צריך לחיות.</p>`
      }
    },
    {
      h: { en: "Comparison table", he: "טבלת השוואה" },
      body: {
        en: `<table>
<tr><th>Type</th><th>Examples</th><th>Superpower</th><th>Weakness</th></tr>
<tr><td>Relational</td><td>Postgres, MySQL</td><td>Joins, ACID, ad-hoc queries</td><td>Horizontal write scaling is hard</td></tr>
<tr><td>Document</td><td>MongoDB</td><td>Flexible nested docs</td><td>Cross-doc joins/consistency</td></tr>
<tr><td>Key-value</td><td>Redis, DynamoDB</td><td>Ultra-fast lookups by key</td><td>Anything not by key</td></tr>
<tr><td>Wide-column</td><td>Cassandra</td><td>Huge write throughput, multi-DC</td><td>Query-first modeling, no joins</td></tr>
<tr><td>Graph</td><td>Neo4j</td><td>Deep relationship traversal</td><td>Bulk aggregations, sharding</td></tr>
<tr><td>Time-series</td><td>InfluxDB, Prometheus</td><td>Compression, time-window queries</td><td>Updates, high-cardinality labels</td></tr>
<tr><td>Search</td><td>Elasticsearch</td><td>Full-text, relevance, facets</td><td>Not a source of truth</td></tr>
</table>
<p>Real systems are <strong>polyglot</strong>: Postgres as source of truth, Redis as cache, Elasticsearch for search, Prometheus for metrics.</p>`,
        he: `<table>
<tr><th>סוג</th><th>דוגמאות</th><th>כוח-על</th><th>חולשה</th></tr>
<tr><td>רלציוני</td><td>Postgres, MySQL</td><td>Joins, ACID, query אד-הוק</td><td>קשה לעשות scale אופקי לכתיבות</td></tr>
<tr><td>Document</td><td>MongoDB</td><td>מסמכים מקוננים וגמישים</td><td>Joins ועקביות בין מסמכים</td></tr>
<tr><td>Key-value</td><td>Redis, DynamoDB</td><td>שליפה לפי key במהירות שיא</td><td>כל מה שלא לפי key</td></tr>
<tr><td>Wide-column</td><td>Cassandra</td><td>Write throughput עצום, multi-DC</td><td>ממדלים לפי query, אין joins</td></tr>
<tr><td>Graph</td><td>Neo4j</td><td>Traversal עמוק על קשרים</td><td>אגרגציות גדולות, sharding</td></tr>
<tr><td>Time-series</td><td>InfluxDB, Prometheus</td><td>דחיסה, שאילתות על חלונות זמן</td><td>עדכונים, labels עם cardinality גבוה</td></tr>
<tr><td>Search</td><td>Elasticsearch</td><td>Full-text, רלוונטיות, facets</td><td>לא source of truth</td></tr>
</table>
<p>מערכות אמיתיות הן <strong>polyglot</strong>: Postgres כ-source of truth, Redis כ-cache, Elasticsearch לחיפוש, Prometheus למטריקות.</p>`
      }
    },
    {
      h: { en: "How to choose: 4 questions", he: "איך בוחרים: 4 שאלות" },
      body: {
        en: `<ol>
<li><strong>What are my access patterns?</strong> Do I know every query up front (→ KV/wide-column fine) or will product ask new questions weekly (→ SQL)?</li>
<li><strong>How much consistency do I need?</strong> Money, inventory, bookings → ACID transactions. Like counters, view counts → eventual is fine.</li>
<li><strong>What's the shape and size?</strong> Relationships everywhere → relational or graph. 1M writes/sec of append-only events → Cassandra or a TSDB.</li>
<li><strong>Who will operate it?</strong> A managed Postgres your team understands beats a self-hosted Cassandra cluster nobody can debug at 3 AM.</li>
</ol>
<blockquote>💡 Real world: Discord moved messages from MongoDB to Cassandra (and later ScyllaDB) because they had trillions of append-heavy messages read by channel+time — a textbook wide-column pattern. Their user/guild metadata? Still relational-friendly data.</blockquote>`,
        he: `<ol>
<li><strong>מה ה-access patterns?</strong> אני יודע כל query מראש (→ KV/wide-column בסדר) או שהפרודקט ישאל שאלות חדשות כל שבוע (→ SQL)?</li>
<li><strong>כמה consistency צריך?</strong> כסף, מלאי, הזמנות → ACID transactions. מוני לייקים וצפיות → eventual מספיק.</li>
<li><strong>מה הצורה והגודל?</strong> קשרים בכל מקום → רלציוני או graph. מיליון כתיבות בשנייה של אירועים append-only → Cassandra או TSDB.</li>
<li><strong>מי יתפעל את זה?</strong> Postgres מנוהל שהצוות מבין עדיף על cluster של Cassandra self-hosted שאף אחד לא יודע לדבג בשלוש לפנות בוקר.</li>
</ol>
<blockquote>💡 מהשטח: Discord העבירו הודעות מ-MongoDB ל-Cassandra (ואחר כך ל-ScyllaDB) כי היו להם טריליוני הודעות append-heavy שנקראות לפי ערוץ+זמן — pattern קלאסי של wide-column. ה-metadata של משתמשים ושרתים? עדיין data שמתאים לרלציוני.</blockquote>`
      }
    }
  ],
  diagram: `                  Need joins / ad-hoc queries / ACID?
                         /                  \\
                       yes                   no
                        |                     |
                 Postgres / MySQL     Known access pattern?
                                     /     |      |      \\
                                by key  by time  text  relationships
                                  |       |       |         |
                           Redis/Dynamo  TSDB   Elastic   Neo4j
                                  |
                     huge write volume, multi-DC? -> Cassandra`,
  handsOn: [
    { cmd: "docker run -d --name pg -e POSTGRES_PASSWORD=pw -p 5432:5432 postgres:16", what: { en: "Spin up a local Postgres to play with.", he: "מרימים Postgres מקומי לשחק איתו." } },
    { cmd: "docker run -d --name redis -p 6379:6379 redis:7 && docker exec -it redis redis-cli ZADD board 100 alice 250 bob && docker exec -it redis redis-cli ZREVRANGE board 0 -1 WITHSCORES", what: { en: "Build a leaderboard with a Redis sorted set in two commands.", he: "בונים leaderboard עם sorted set של Redis בשתי פקודות." } },
    { cmd: "docker exec -it pg psql -U postgres -c \"SELECT '{\\\"tags\\\":[\\\"a\\\",\\\"b\\\"]}'::jsonb -> 'tags' ->> 0;\"", what: { en: "See that Postgres speaks JSON natively with jsonb operators.", he: "רואים ש-Postgres מדבר JSON באופן טבעי עם אופרטורים של jsonb." } }
  ],
  mnemonic: {
    en: "\"Postgres first, specialists by proof.\" And the 7 types: Really Dull Kids Write Great Tiny Stories — Relational, Document, Key-value, Wide-column, Graph, Time-series, Search.",
    he: "\"Postgres קודם, מומחים רק עם הוכחה.\" ו-7 הסוגים לפי הסדר: RDKWGTS — Relational, Document, Key-value, Wide-column, Graph, Time-series, Search. באנגלית: Really Dull Kids Write Great Tiny Stories."
  },
  pitfalls: [
    { en: "Choosing MongoDB 'because schemaless is faster to build' and then reimplementing joins, transactions and schema validation in application code.", he: "לבחור ב-MongoDB \"כי בלי schema מפתחים מהר יותר\" ואז לממש מחדש joins, טרנזקציות ו-schema validation בקוד האפליקציה." },
    { en: "Using Elasticsearch as the only store of data. It's near-real-time, has no multi-document transactions, and reindexing is a pain — keep the truth elsewhere.", he: "להשתמש ב-Elasticsearch כמקום היחיד של ה-data. הוא near-real-time, אין לו טרנזקציות על כמה מסמכים, ו-reindex זה כאב ראש — ה-source of truth צריך לשבת במקום אחר." },
    { en: "Designing a DynamoDB or Cassandra table like a SQL table and discovering that every new screen needs a full scan or a new table.", he: "לתכנן טבלה ב-DynamoDB או Cassandra כמו טבלת SQL ולגלות שכל מסך חדש דורש full scan או טבלה חדשה." },
    { en: "Adding a new database for every feature. Each one is another thing to back up, monitor, upgrade and secure.", he: "להוסיף database חדש לכל פיצ'ר. כל אחד הוא עוד משהו לגבות, לנטר, לשדרג ולאבטח." }
  ],
  interview: [
    {
      q: { en: "When would you NOT choose a relational database?", he: "מתי לא הייתם בוחרים database רלציוני?" },
      a: {
        en: "When the access pattern is narrow and known, and the scale or latency needs exceed what a single primary gives: e.g. massive append-only writes across regions (Cassandra), sub-ms key lookups (Redis), deep relationship traversal (graph), full-text relevance (Elasticsearch), or metrics with retention/downsampling (TSDB). Otherwise SQL's flexibility and ACID usually win.",
        he: "כשה-access pattern צר וידוע, וה-scale או ה-latency עוברים את מה ש-primary אחד נותן: למשל כתיבות append-only מסיביות על פני regions (Cassandra), שליפות key בתת-מילישנייה (Redis), traversal עמוק על קשרים (graph), רלוונטיות ב-full-text (Elasticsearch), או מטריקות עם retention ו-downsampling (TSDB). אחרת, הגמישות וה-ACID של SQL בדרך כלל מנצחים."
      }
    },
    {
      q: { en: "What does 'schemaless' really mean?", he: "מה באמת המשמעות של \"schemaless\"?" },
      a: {
        en: "Schema-on-read instead of schema-on-write. The schema still exists — it just lives implicitly in your application code, so the DB won't stop bad data. You trade enforcement for flexibility.",
        he: "Schema-on-read במקום schema-on-write. ה-schema עדיין קיים — הוא פשוט חי באופן מובלע בקוד האפליקציה, אז ה-DB לא יעצור data לא תקין. מחליפים אכיפה בגמישות."
      }
    }
  ],
  quiz: [
    {
      q: { en: "You need a real-time leaderboard of top 100 players updated thousands of times per second. Best fit?", he: "צריך leaderboard בזמן אמת של 100 השחקנים המובילים, שמתעדכן אלפי פעמים בשנייה. מה הכי מתאים?" },
      options: [
        { en: "Postgres with ORDER BY score LIMIT 100 on every request", he: "Postgres עם ORDER BY score LIMIT 100 בכל בקשה" },
        { en: "Redis sorted set (ZADD / ZREVRANGE)", he: "Redis sorted set (ZADD / ZREVRANGE)" },
        { en: "Elasticsearch with a score field", he: "Elasticsearch עם שדה score" },
        { en: "Neo4j with a SCORED relationship", he: "Neo4j עם קשר SCORED" }
      ],
      answer: 1,
      explain: { en: "Sorted sets keep members ordered by score in memory with O(log N) updates — a leaderboard is their poster child. Postgres can work at small scale but thousands of updates/sec plus sorts is wasteful.", he: "Sorted set שומר איברים ממוינים לפי score בזיכרון עם עדכון ב-O(log N) — leaderboard זה ה-use case הקלאסי שלו. Postgres יעבוד ב-scale קטן, אבל אלפי עדכונים בשנייה פלוס מיון זה בזבוז." }
    },
    {
      q: { en: "Why is Elasticsearch usually NOT your source of truth?", he: "למה Elasticsearch בדרך כלל לא ה-source of truth?" },
      options: [
        { en: "It can't store JSON", he: "הוא לא יודע לשמור JSON" },
        { en: "It's too slow for reads", he: "הוא איטי מדי בקריאות" },
        { en: "It's near-real-time, lacks multi-doc transactions, and is typically rebuilt from a primary store", he: "הוא near-real-time, אין לו טרנזקציות על כמה מסמכים, ובדרך כלל בונים אותו מחדש מ-store ראשי" },
        { en: "It only supports one node", he: "הוא תומך רק ב-node אחד" }
      ],
      answer: 2,
      explain: { en: "Search engines are optimized for querying, not for transactional guarantees. Treat them as a derived index fed via CDC or an outbox/queue.", he: "מנועי חיפוש מותאמים לשאילתות, לא להבטחות טרנזקציוניות. מתייחסים אליהם כ-index נגזר שמוזן דרך CDC או outbox/queue." }
    },
    {
      q: { en: "Biggest risk of designing a DynamoDB table without knowing access patterns?", he: "מה הסיכון הכי גדול בתכנון טבלת DynamoDB בלי לדעת את ה-access patterns?" },
      options: [
        { en: "Queries outside the key design become expensive full-table scans", he: "שאילתות מחוץ לתכנון ה-keys הופכות ל-full table scans יקרים" },
        { en: "DynamoDB will refuse to create the table", he: "DynamoDB יסרב ליצור את הטבלה" },
        { en: "Data will be lost on restart", he: "ה-data יימחק באתחול" },
        { en: "It will automatically convert to SQL", he: "הוא יומר אוטומטית ל-SQL" }
      ],
      answer: 0,
      explain: { en: "DynamoDB is fast only along partition key / sort key (and GSIs). Anything else is a Scan that reads (and bills) every item.", he: "DynamoDB מהיר רק לאורך partition key / sort key (ו-GSIs). כל השאר זה Scan שקורא (ומחייב על) כל item." }
    },
    {
      q: { en: "A fraud team asks: 'which accounts share a device with an account that shares a card with a known fraudster?' Most natural fit?", he: "צוות fraud שואל: \"אילו חשבונות חולקים מכשיר עם חשבון שחולק כרטיס עם נוכל ידוע?\" מה הכי טבעי?" },
      options: [
        { en: "Time-series DB", he: "Time-series DB" },
        { en: "Key-value store", he: "Key-value store" },
        { en: "Wide-column store", he: "Wide-column store" },
        { en: "Graph database", he: "Graph database" }
      ],
      answer: 3,
      explain: { en: "Multi-hop relationship questions are what graph DBs traverse efficiently; in SQL it's a chain of self-joins that gets slower with each hop.", he: "שאלות על קשרים בכמה קפיצות זה בדיוק מה ש-graph DB עושה traversal יעיל עליו; ב-SQL זו שרשרת self-joins שמאטה עם כל קפיצה." }
    }
  ],
  related: ["db-indexes", "db-cap", "arch-caching"]
});

INFRA.lessons.push({
  id: "db-indexes",
  track: "data",
  order: 2,
  icon: "📇",
  level: 2,
  minutes: 11,
  title: { en: "Indexes: Making Queries Fast", he: "Indexes: איך שאילתות נהיות מהירות" },
  tldr: {
    en: "An index is a sorted copy of some columns pointing back to rows; it turns a full table scan (O(n)) into a tree lookup (O(log n)) — and charges you on every write.",
    he: "Index הוא עותק ממוין של כמה עמודות שמצביע חזרה לשורות; הוא הופך full table scan (O(n)) לחיפוש בעץ (O(log n)) — וגובה מחיר על כל כתיבה."
  },
  analogy: {
    en: "A phone book sorted by (last name, first name). Finding 'Cohen, Dana' is instant. Finding everyone named 'Dana' regardless of last name? You're reading the whole book. That's composite index column order in one sentence.",
    he: "ספר טלפונים ממוין לפי (שם משפחה, שם פרטי). למצוא את \"כהן, דנה\" — מיידי. למצוא את כל ה\"דנה\" בלי קשר לשם המשפחה? קוראים את כל הספר. זה כל הסיפור של סדר עמודות ב-composite index במשפט אחד."
  },
  sections: [
    {
      h: { en: "What a B-tree index actually is", he: "מה זה בעצם B-tree index" },
      body: {
        en: `<p>Most DB indexes (Postgres, MySQL InnoDB) are <strong>B-trees</strong>: balanced, wide trees where each node is a disk page (8 KB in Postgres, 16 KB in InnoDB) holding hundreds of sorted keys. Because the fan-out is so wide, a table with 100 million rows needs only ~3-4 levels. So a lookup costs ~4 page reads instead of reading millions of pages.</p>
<p>Leaf entries hold the key plus a pointer to the row (a TID in Postgres; the primary key in InnoDB secondary indexes). Because keys are sorted, B-trees serve <code>=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>, <code>ORDER BY</code> and prefix <code>LIKE 'abc%'</code> — but not <code>LIKE '%abc'</code>.</p>
<p>Other types exist for special cases: <strong>Hash</strong> (equality only), <strong>GIN</strong> (jsonb, arrays, full-text), <strong>GiST</strong> (geo, ranges), <strong>BRIN</strong> (huge, naturally ordered tables like append-only logs).</p>`,
        he: `<p>רוב ה-indexes ב-DB (Postgres, MySQL InnoDB) הם <strong>B-trees</strong>: עצים מאוזנים ורחבים שבהם כל node הוא דף בדיסק (8 KB ב-Postgres, 16 KB ב-InnoDB) עם מאות keys ממוינים. בגלל ה-fan-out הרחב, טבלה עם 100 מיליון שורות צריכה רק 3-4 רמות. כלומר חיפוש עולה בערך 4 קריאות דף במקום מיליוני דפים.</p>
<p>בעלים יש את ה-key ומצביע לשורה (TID ב-Postgres; ה-primary key ב-secondary indexes של InnoDB). כי ה-keys ממוינים, B-tree משרת <code>=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>, <code>ORDER BY</code> ו-<code>LIKE 'abc%'</code> עם prefix — אבל לא <code>LIKE '%abc'</code>.</p>
<p>יש עוד סוגים למקרים מיוחדים: <strong>Hash</strong> (שוויון בלבד), <strong>GIN</strong> (jsonb, מערכים, full-text), <strong>GiST</strong> (גיאו, טווחים), <strong>BRIN</strong> (טבלאות ענקיות שממוינות באופן טבעי, כמו לוגים append-only).</p>`
      }
    },
    {
      h: { en: "Composite indexes: order is everything", he: "Composite index: הסדר הוא הכול" },
      body: {
        en: `<p>An index on <code>(tenant_id, status, created_at)</code> is sorted by tenant, then status within tenant, then time. It can serve:</p>
<ul><li><code>WHERE tenant_id = 7</code> ✅</li><li><code>WHERE tenant_id = 7 AND status = 'open'</code> ✅</li><li><code>WHERE tenant_id = 7 AND status = 'open' ORDER BY created_at DESC LIMIT 20</code> ✅ (no sort needed!)</li><li><code>WHERE status = 'open'</code> ❌ — skips the leftmost column</li></ul>
<p>This is the <strong>leftmost prefix rule</strong>. Rules of thumb: put <strong>equality</strong> columns first, then the <strong>range/sort</strong> column last. Among equality columns, put the one your queries always include first. A range condition (<code>created_at &gt; ...</code>) "stops" the index from being used efficiently for columns after it.</p>
<blockquote>💡 Real world: A <strong>covering index</strong> includes every column the query needs (Postgres: <code>CREATE INDEX ... INCLUDE (amount)</code>), enabling an <em>Index Only Scan</em> that never touches the table. That's often a 10x win on hot queries.</blockquote>`,
        he: `<p>Index על <code>(tenant_id, status, created_at)</code> ממוין לפי tenant, בתוכו לפי status, ובתוכו לפי זמן. הוא יכול לשרת:</p>
<ul><li><code>WHERE tenant_id = 7</code> ✅</li><li><code>WHERE tenant_id = 7 AND status = 'open'</code> ✅</li><li><code>WHERE tenant_id = 7 AND status = 'open' ORDER BY created_at DESC LIMIT 20</code> ✅ (בלי מיון בכלל!)</li><li><code>WHERE status = 'open'</code> ❌ — מדלג על העמודה השמאלית</li></ul>
<p>זה <strong>חוק ה-leftmost prefix</strong>. כלל אצבע: עמודות <strong>שוויון</strong> קודם, ועמודת <strong>טווח/מיון</strong> בסוף. בין עמודות השוויון, שימו ראשונה את זו שתמיד מופיעה ב-queries. תנאי טווח (<code>created_at &gt; ...</code>) "עוצר" את השימוש היעיל ב-index לעמודות שאחריו.</p>
<blockquote>💡 מהשטח: <strong>Covering index</strong> כולל את כל העמודות שה-query צריך (ב-Postgres: <code>CREATE INDEX ... INCLUDE (amount)</code>), וזה מאפשר <em>Index Only Scan</em> שלא נוגע בטבלה בכלל. על queries חמים זה הרבה פעמים שיפור של פי 10.</blockquote>`
      }
    },
    {
      h: { en: "EXPLAIN: ask the planner what it's doing", he: "EXPLAIN: שואלים את ה-planner מה הוא עושה" },
      body: {
        en: `<p>Never guess — measure. <code>EXPLAIN ANALYZE</code> runs the query and shows the real plan with timings:</p>
<pre>EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42;

Seq Scan on orders  (cost=0.00..185432.00 rows=12 width=96)
                    (actual time=0.03..812.4 rows=11 loops=1)
  Filter: (customer_id = 42)
  Rows Removed by Filter: 9999989
Execution Time: 812.6 ms</pre>
<p>"Seq Scan" + "Rows Removed by Filter: 9,999,989" = reading 10M rows to return 11. Add <code>CREATE INDEX CONCURRENTLY idx_orders_customer ON orders(customer_id);</code> and it becomes <code>Index Scan using idx_orders_customer ... Execution Time: 0.08 ms</code>. 10,000x.</p>
<p>Note: a seq scan isn't always bad. If a query returns a large fraction of a table, scanning sequentially is cheaper than millions of random index lookups, and the planner knows it. Watch for estimates (<code>rows=12</code>) wildly off from actuals — that means stale stats; run <code>ANALYZE</code>.</p>`,
        he: `<p>לא מנחשים — מודדים. <code>EXPLAIN ANALYZE</code> מריץ את ה-query ומראה את ה-plan האמיתי עם זמנים:</p>
<pre>EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42;

Seq Scan on orders  (cost=0.00..185432.00 rows=12 width=96)
                    (actual time=0.03..812.4 rows=11 loops=1)
  Filter: (customer_id = 42)
  Rows Removed by Filter: 9999989
Execution Time: 812.6 ms</pre>
<p>"Seq Scan" ועוד "Rows Removed by Filter: 9,999,989" = קוראים 10 מיליון שורות כדי להחזיר 11. מוסיפים <code>CREATE INDEX CONCURRENTLY idx_orders_customer ON orders(customer_id);</code> וזה הופך ל-<code>Index Scan using idx_orders_customer ... Execution Time: 0.08 ms</code>. פי 10,000.</p>
<p>שימו לב: seq scan זה לא תמיד רע. אם ה-query מחזיר חלק גדול מהטבלה, סריקה רציפה זולה יותר ממיליוני קפיצות אקראיות דרך ה-index, וה-planner יודע את זה. חפשו הערכות (<code>rows=12</code>) שרחוקות מאוד מהמספרים האמיתיים — זה אומר סטטיסטיקות ישנות; הריצו <code>ANALYZE</code>.</p>`
      }
    },
    {
      h: { en: "N+1 queries and the slow query log", he: "N+1 queries וה-slow query log" },
      body: {
        en: `<p>The <strong>N+1 problem</strong>: your ORM loads 50 posts (1 query), then lazily loads each post's author (50 queries). Each is "fast" (1 ms), but 51 round trips at ~0.5-1 ms network each plus overhead turns a page into 100 ms+. Indexes don't fix it — batching does: <code>SELECT * FROM users WHERE id = ANY($1)</code>, or ORM eager loading (<code>includes</code>, <code>select_related</code>, <code>JOIN FETCH</code>).</p>
<p>To find what's actually slow, turn on the <strong>slow query log</strong>: Postgres <code>log_min_duration_statement = 250</code> (ms), MySQL <code>slow_query_log=ON, long_query_time=0.25</code>. Even better, Postgres's <code>pg_stat_statements</code> aggregates by query shape, so you can sort by <em>total</em> time — a 2 ms query called 5M times/day often matters more than a 3 s report run once.</p>
<blockquote>⚠️ Production tip: On a busy table, plain <code>CREATE INDEX</code> blocks writes for the whole build. Use <code>CREATE INDEX CONCURRENTLY</code> (Postgres) or online DDL / <code>ALGORITHM=INPLACE, LOCK=NONE</code> (MySQL).</blockquote>`,
        he: `<p><strong>בעיית N+1</strong>: ה-ORM טוען 50 פוסטים (query אחד), ואז טוען lazy את הכותב של כל פוסט (50 queries). כל אחד "מהיר" (1 ms), אבל 51 הלוך-חזור של חצי עד מילישנייה ברשת ועוד overhead הופכים דף ל-100 ms ומעלה. Index לא פותר את זה — batching פותר: <code>SELECT * FROM users WHERE id = ANY($1)</code>, או eager loading ב-ORM (<code>includes</code>, <code>select_related</code>, <code>JOIN FETCH</code>).</p>
<p>כדי למצוא מה באמת איטי, מדליקים <strong>slow query log</strong>: ב-Postgres <code>log_min_duration_statement = 250</code> (ms), ב-MySQL <code>slow_query_log=ON, long_query_time=0.25</code>. עוד יותר טוב: <code>pg_stat_statements</code> של Postgres מאגד לפי צורת ה-query, כך שאפשר למיין לפי זמן <em>כולל</em> — query של 2 ms שרץ 5 מיליון פעם ביום חשוב בדרך כלל יותר מדוח של 3 שניות שרץ פעם אחת.</p>
<blockquote>⚠️ טיפ לפרודקשן: על טבלה עמוסה, <code>CREATE INDEX</code> רגיל חוסם כתיבות לאורך כל הבנייה. משתמשים ב-<code>CREATE INDEX CONCURRENTLY</code> (Postgres) או online DDL / <code>ALGORITHM=INPLACE, LOCK=NONE</code> (MySQL).</blockquote>`
      }
    },
    {
      h: { en: "The write cost: indexes aren't free", he: "המחיר בכתיבה: indexes זה לא בחינם" },
      body: {
        en: `<p>Every <code>INSERT</code> must update <em>every</em> index on the table; every <code>UPDATE</code> of an indexed column does too (and in Postgres, any update that can't be HOT touches all indexes). A table with 12 indexes can make writes several times slower, bloat disk, and push the working set out of RAM so reads get slower too.</p>
<p>Practical hygiene:</p>
<ul><li>Find unused indexes: <code>SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;</code> (check on replicas too before dropping!).</li><li>Remove redundant ones: <code>(a)</code> is redundant if <code>(a, b)</code> exists.</li><li>Use <strong>partial indexes</strong> for skewed data: <code>CREATE INDEX ON jobs(created_at) WHERE status = 'pending';</code> — tiny and exactly what the worker queue needs.</li><li>Low-cardinality columns alone (<code>is_active</code> boolean) are usually poor index candidates.</li></ul>`,
        he: `<p>כל <code>INSERT</code> חייב לעדכן <em>כל</em> index על הטבלה; כל <code>UPDATE</code> לעמודה מאונדקסת גם (וב-Postgres, update שלא יכול להיות HOT נוגע בכל ה-indexes). טבלה עם 12 indexes יכולה להאט כתיבות פי כמה, לנפח את הדיסק, ולדחוף את ה-working set החוצה מה-RAM — כך שגם הקריאות מאטות.</p>
<p>היגיינה פרקטית:</p>
<ul><li>מוצאים indexes שלא בשימוש: <code>SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;</code> (בודקים גם על ה-replicas לפני שמוחקים!).</li><li>מורידים כפולים: <code>(a)</code> מיותר אם קיים <code>(a, b)</code>.</li><li>משתמשים ב-<strong>partial index</strong> ל-data מוטה: <code>CREATE INDEX ON jobs(created_at) WHERE status = 'pending';</code> — קטנטן ובדיוק מה שה-worker queue צריך.</li><li>עמודות עם cardinality נמוך לבד (boolean כמו <code>is_active</code>) הן בדרך כלל מועמדות גרועות ל-index.</li></ul>`
      }
    }
  ],
  diagram: `               B-tree index on orders(customer_id)
                       [ 500 | 1000 ]                <- root (1 page)
                 /           |            \\
        [100|250|400]  [600|750|900]  [1200|1500]    <- internal pages
          /   |                 \\
   [..41,42,43..]  ...      [..1499,1500..]         <- leaf pages (sorted keys)
        |
        +--> row pointer --> heap page #88231 (the actual row)

   10M rows -> ~3-4 page reads per lookup, vs ~185,000 pages for a Seq Scan`,
  handsOn: [
    { cmd: "psql -c \"CREATE TABLE t AS SELECT g AS id, (random()*100000)::int AS customer_id FROM generate_series(1,5000000) g; ANALYZE t;\"", what: { en: "Create a 5M-row test table.", he: "יוצרים טבלת בדיקה עם 5 מיליון שורות." } },
    { cmd: "psql -c \"EXPLAIN ANALYZE SELECT * FROM t WHERE customer_id = 42;\"", what: { en: "See the Seq Scan and its timing.", he: "רואים את ה-Seq Scan ואת הזמן שלו." } },
    { cmd: "psql -c \"CREATE INDEX CONCURRENTLY ON t(customer_id);\" && psql -c \"EXPLAIN ANALYZE SELECT * FROM t WHERE customer_id = 42;\"", what: { en: "Add the index and watch it flip to an Index/Bitmap scan, orders of magnitude faster.", he: "מוסיפים index ורואים שזה מתחלף ל-Index/Bitmap scan, מהיר בסדרי גודל." } },
    { cmd: "psql -c \"SELECT calls, round(total_exec_time) total_ms, query FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;\"", what: { en: "Find the queries eating the most total DB time (needs the pg_stat_statements extension).", he: "מוצאים את ה-queries שאוכלים הכי הרבה זמן DB מצטבר (צריך את ה-extension pg_stat_statements)." } }
  ],
  mnemonic: {
    en: "\"Equality first, range last, every index taxes the write.\" Or: ESR — Equality, Sort, Range — the order for composite index columns.",
    he: "\"שוויון בהתחלה, טווח בסוף, וכל index גובה מס על כתיבה.\" או: ESR — Equality, Sort, Range — הסדר של עמודות ב-composite index."
  },
  pitfalls: [
    { en: "Wrapping an indexed column in a function: WHERE lower(email) = 'x' or WHERE created_at::date = '2024-01-01' can't use a plain index on that column. Use an expression index or rewrite as a range.", he: "לעטוף עמודה מאונדקסת בפונקציה: WHERE lower(email) = 'x' או WHERE created_at::date = '2024-01-01' לא יכולים להשתמש ב-index רגיל על העמודה. משתמשים ב-expression index או כותבים מחדש כטווח." },
    { en: "Implicit type casts: comparing a varchar column to a number (WHERE phone = 0501234567 in MySQL) silently disables the index.", he: "המרות טיפוס מובלעות: השוואה של עמודת varchar למספר (WHERE phone = 0501234567 ב-MySQL) מנטרלת את ה-index בשקט." },
    { en: "Indexing every column 'just in case' — writes crawl and most of those indexes are never used.", he: "לאנדקס כל עמודה \"ליתר ביטחון\" — הכתיבות זוחלות ורוב ה-indexes האלה לא נמצאים בשימוש אף פעם." },
    { en: "Testing on a 1,000-row dev DB where everything is fast, then shipping a query that seq-scans 50M rows in production.", he: "לבדוק על DB של פיתוח עם 1,000 שורות שבו הכול מהיר, ואז לשחרר query שעושה seq scan על 50 מיליון שורות בפרודקשן." }
  ],
  interview: [
    {
      q: { en: "You have an index on (a, b). Will WHERE b = 5 use it?", he: "יש index על (a, b). האם WHERE b = 5 ישתמש בו?" },
      a: {
        en: "Generally not efficiently — the index is sorted by a first, so b values are scattered. Some engines can do a full index scan or a 'skip scan' (MySQL 8, Oracle, newer Postgres) when a has few distinct values, but you shouldn't rely on it. Create an index leading with b if that query matters.",
        he: "בדרך כלל לא ביעילות — ה-index ממוין קודם לפי a, אז ערכי b מפוזרים. מנועים מסוימים יכולים לעשות full index scan או \"skip scan\" (MySQL 8, Oracle, גרסאות Postgres חדשות) כשיש ל-a מעט ערכים שונים, אבל לא כדאי לסמוך על זה. אם ה-query חשוב, יוצרים index שמתחיל ב-b."
      }
    },
    {
      q: { en: "A query got slow overnight with no code change. What do you check?", he: "query נהיה איטי בין לילה בלי שינוי קוד. מה בודקים?" },
      a: {
        en: "EXPLAIN ANALYZE to see if the plan changed (e.g. index scan → seq scan), stale statistics (run ANALYZE), data growth crossing a planner threshold, table/index bloat (vacuum), lock contention (pg_stat_activity / pg_locks), and resource saturation — CPU, IOPS, a cold cache after a restart or failover.",
        he: "EXPLAIN ANALYZE כדי לראות אם ה-plan השתנה (למשל index scan → seq scan), סטטיסטיקות ישנות (להריץ ANALYZE), גידול ב-data שעבר סף של ה-planner, bloat בטבלה או ב-index (vacuum), תחרות על locks (pg_stat_activity / pg_locks), ורוויה של משאבים — CPU, IOPS, cache קר אחרי restart או failover."
      }
    },
    {
      q: { en: "How do you fix an N+1 problem?", he: "איך פותרים בעיית N+1?" },
      a: {
        en: "Batch the child lookups into one query (WHERE id IN (...) / = ANY), use a JOIN, or use the ORM's eager loading. Detect it with query counting in tests, APM traces showing repeated identical queries, or tools like Bullet (Rails) / nplusone (Django).",
        he: "מאגדים את השליפות של הילדים ל-query אחד (WHERE id IN (...) / = ANY), משתמשים ב-JOIN, או ב-eager loading של ה-ORM. מזהים את זה עם ספירת queries בטסטים, traces ב-APM שמראים queries זהים חוזרים, או כלים כמו Bullet (Rails) / nplusone (Django)."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Index on (tenant_id, created_at). Which query benefits MOST?", he: "Index על (tenant_id, created_at). איזה query נהנה הכי הרבה?" },
      options: [
        { en: "WHERE created_at > now() - interval '1 day'", he: "WHERE created_at > now() - interval '1 day'" },
        { en: "WHERE tenant_id = 9 ORDER BY created_at DESC LIMIT 50", he: "WHERE tenant_id = 9 ORDER BY created_at DESC LIMIT 50" },
        { en: "WHERE tenant_id <> 9", he: "WHERE tenant_id <> 9" },
        { en: "WHERE lower(name) = 'acme'", he: "WHERE lower(name) = 'acme'" }
      ],
      answer: 1,
      explain: { en: "Equality on the leading column plus ORDER BY the second column: the DB walks the index backwards and stops after 50 rows — no sort, no scan.", he: "שוויון על העמודה הראשונה ועוד ORDER BY על השנייה: ה-DB הולך על ה-index אחורה ועוצר אחרי 50 שורות — בלי מיון ובלי scan." }
    },
    {
      q: { en: "EXPLAIN shows 'Seq Scan' on a 20-row lookup table. What should you do?", he: "EXPLAIN מראה 'Seq Scan' על טבלת lookup של 20 שורות. מה עושים?" },
      options: [
        { en: "Add an index immediately", he: "מוסיפים index מיד" },
        { en: "Force index usage with a hint", he: "מכריחים שימוש ב-index עם hint" },
        { en: "Nothing — the whole table fits in one page; a scan is the cheapest plan", he: "כלום — כל הטבלה נכנסת בדף אחד; scan זה ה-plan הכי זול" },
        { en: "Partition the table", he: "עושים partitioning לטבלה" }
      ],
      answer: 2,
      explain: { en: "Seq scans on tiny tables (or queries returning a large fraction of rows) are correct. Worry when 'Rows Removed by Filter' is huge relative to rows returned.", he: "Seq scan על טבלאות קטנטנות (או queries שמחזירים חלק גדול מהשורות) זה נכון. דואגים כש-'Rows Removed by Filter' עצום ביחס לשורות שחזרו." }
    },
    {
      q: { en: "A page makes 1 query for 100 orders, then 100 queries for each order's customer. Best fix?", he: "דף עושה query אחד ל-100 הזמנות, ואז 100 queries ללקוח של כל הזמנה. מה התיקון הכי טוב?" },
      options: [
        { en: "Add an index on customers.id", he: "להוסיף index על customers.id" },
        { en: "Increase the DB connection pool size", he: "להגדיל את ה-connection pool" },
        { en: "Add a read replica", he: "להוסיף read replica" },
        { en: "Fetch all customers in one query (IN / JOIN / eager load)", he: "לשלוף את כל הלקוחות ב-query אחד (IN / JOIN / eager load)" }
      ],
      answer: 3,
      explain: { en: "This is N+1. customers.id is already the PK (indexed); the cost is 100 round trips. Batching collapses it to 2 queries.", he: "זה N+1. customers.id כבר PK (מאונדקס); המחיר הוא 100 הלוך-חזור. Batching מצמצם את זה ל-2 queries." }
    },
    {
      q: { en: "Why might adding a 9th index to a hot table hurt overall performance?", he: "למה index תשיעי על טבלה חמה יכול לפגוע בביצועים הכוללים?" },
      options: [
        { en: "Every insert/update must maintain it, adding write I/O and memory pressure", he: "כל insert/update צריך לתחזק אותו, וזה מוסיף write I/O ולחץ על הזיכרון" },
        { en: "Databases support at most 8 indexes per table", he: "Databases תומכים בעד 8 indexes לטבלה" },
        { en: "Indexes make SELECTs slower", he: "Indexes מאטים SELECTs" },
        { en: "Indexes disable transactions", he: "Indexes מבטלים טרנזקציות" }
      ],
      answer: 0,
      explain: { en: "Indexes are a read optimization paid for by writes, disk and buffer cache. Keep only the ones your workload uses.", he: "Indexes הם אופטימיזציה לקריאה שמשלמים עליה בכתיבות, בדיסק וב-buffer cache. שומרים רק את אלה שה-workload באמת משתמש בהם." }
    }
  ],
  related: ["db-sql-vs-nosql", "db-transactions", "storage-io", "db-operations"]
});

INFRA.lessons.push({
  id: "db-transactions",
  track: "data",
  order: 3,
  icon: "🔒",
  level: 2,
  minutes: 12,
  title: { en: "Transactions, Isolation & Locks", he: "טרנזקציות, isolation ו-locks" },
  tldr: {
    en: "A transaction makes a group of changes all-or-nothing; the isolation level decides how much concurrent transactions can see of each other's mess.",
    he: "טרנזקציה הופכת קבוצת שינויים ל\"הכול או כלום\"; ה-isolation level קובע כמה טרנזקציות במקביל רואות מהבלגן אחת של השנייה."
  },
  analogy: {
    en: "A bank transfer is a magic trick: money leaves account A and appears in account B, and the audience must never see the moment when it's in neither. Isolation levels decide how thick the curtain is — a cheap curtain lets people peek mid-trick.",
    he: "העברה בנקאית היא קסם: הכסף יוצא מחשבון A ומופיע בחשבון B, והקהל אסור שיראה את הרגע שבו הוא לא נמצא באף אחד מהם. ה-isolation level קובע כמה עבה הווילון — וילון זול נותן לאנשים להציץ באמצע הטריק."
  },
  sections: [
    {
      h: { en: "ACID, without the buzzword fog", he: "ACID, בלי ערפל של באזוורדים" },
      body: {
        en: `<ul><li><strong>Atomicity</strong> — all statements commit or none do. Crash mid-transfer? It's rolled back.</li><li><strong>Consistency</strong> — constraints (FKs, CHECK, UNIQUE) hold before and after. Mostly <em>your</em> job via schema design.</li><li><strong>Isolation</strong> — concurrent transactions behave as if (somewhat) alone. The tunable one.</li><li><strong>Durability</strong> — once COMMIT returns, it survives a crash. Implemented with a write-ahead log (WAL) flushed with <code>fsync</code>.</li></ul>
<pre>BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- or ROLLBACK;</pre>
<blockquote>💡 Real world: Durability has a dial. Postgres <code>synchronous_commit = off</code> or MySQL <code>innodb_flush_log_at_trx_commit = 2</code> trade up to ~1 s of committed writes on a crash for big throughput gains. Fine for analytics events, terrible for payments.</blockquote>`,
        he: `<ul><li><strong>Atomicity</strong> — כל הפקודות עושות commit או אף אחת. קריסה באמצע העברה? מתבצע rollback.</li><li><strong>Consistency</strong> — אילוצים (FK, CHECK, UNIQUE) מתקיימים לפני ואחרי. בעיקר <em>האחריות שלכם</em> דרך תכנון ה-schema.</li><li><strong>Isolation</strong> — טרנזקציות במקביל מתנהגות כאילו הן (פחות או יותר) לבד. זה הפרמטר שמכווננים.</li><li><strong>Durability</strong> — ברגע ש-COMMIT חזר, זה שורד קריסה. ממומש עם write-ahead log (WAL) שנכתב לדיסק עם <code>fsync</code>.</li></ul>
<pre>BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- or ROLLBACK;</pre>
<blockquote>💡 מהשטח: ל-Durability יש כפתור. <code>synchronous_commit = off</code> ב-Postgres או <code>innodb_flush_log_at_trx_commit = 2</code> ב-MySQL מחליפים עד כשנייה של כתיבות שכבר אושרו (במקרה קריסה) בשיפור throughput גדול. בסדר לאירועי אנליטיקס, נורא לתשלומים.</blockquote>`
      }
    },
    {
      h: { en: "The anomalies: what can go wrong", he: "האנומליות: מה יכול להשתבש" },
      body: {
        en: `<ul><li><strong>Dirty read</strong> — T1 reads T2's <em>uncommitted</em> change; T2 rolls back; T1 acted on data that never existed.</li><li><strong>Non-repeatable read</strong> — T1 reads row X = 100, T2 commits X = 50, T1 reads X again and gets 50. Same row, different answer.</li><li><strong>Phantom read</strong> — T1 runs <code>SELECT count(*) WHERE status='open'</code> → 10; T2 inserts a new open row; T1 re-runs → 11. New rows "appear".</li><li><strong>Lost update</strong> — both read balance 100, both write 100 + 10. Final: 110, not 120. The classic read-modify-write bug.</li><li><strong>Write skew</strong> — two doctors each check "at least 2 on call?", both see yes, both go off call → zero on call. Each wrote a different row, so no row conflict detected.</li></ul>
<p>Lost updates are the one developers hit most. Fix with an atomic update (<code>SET balance = balance + 10</code>), <code>SELECT ... FOR UPDATE</code>, or optimistic locking (<code>WHERE version = 7</code>).</p>`,
        he: `<ul><li><strong>Dirty read</strong> — T1 קורא שינוי <em>שלא עשה commit</em> של T2; T2 עושה rollback; T1 פעל על data שמעולם לא היה קיים.</li><li><strong>Non-repeatable read</strong> — T1 קורא שורה X = 100, T2 עושה commit ל-X = 50, T1 קורא שוב ומקבל 50. אותה שורה, תשובה אחרת.</li><li><strong>Phantom read</strong> — T1 מריץ <code>SELECT count(*) WHERE status='open'</code> → 10; T2 מכניס שורה פתוחה חדשה; T1 מריץ שוב → 11. שורות חדשות "מופיעות".</li><li><strong>Lost update</strong> — שניהם קוראים balance של 100, שניהם כותבים 100 + 10. התוצאה: 110 ולא 120. באג read-modify-write קלאסי.</li><li><strong>Write skew</strong> — שני רופאים בודקים "יש לפחות 2 בתורנות?", שניהם רואים שכן, שניהם יוצאים מהתורנות → אפס בתורנות. כל אחד כתב שורה אחרת, אז לא זוהה קונפליקט.</li></ul>
<p>Lost update זו האנומליה שמפתחים נתקלים בה הכי הרבה. פותרים עם update אטומי (<code>SET balance = balance + 10</code>), <code>SELECT ... FOR UPDATE</code>, או optimistic locking (<code>WHERE version = 7</code>).</p>`
      }
    },
    {
      h: { en: "Isolation levels vs anomalies", he: "Isolation levels מול אנומליות" },
      body: {
        en: `<table>
<tr><th>Level</th><th>Dirty</th><th>Non-repeatable</th><th>Phantom</th></tr>
<tr><td>Read Uncommitted</td><td>possible</td><td>possible</td><td>possible</td></tr>
<tr><td>Read Committed</td><td>no</td><td>possible</td><td>possible</td></tr>
<tr><td>Repeatable Read</td><td>no</td><td>no</td><td>possible*</td></tr>
<tr><td>Serializable</td><td>no</td><td>no</td><td>no</td></tr>
</table>
<p>Defaults matter: <strong>Postgres = Read Committed</strong>, <strong>MySQL InnoDB = Repeatable Read</strong>. *In practice, Postgres's Repeatable Read (snapshot isolation) also blocks phantoms, and InnoDB uses gap/next-key locks to prevent many of them. Neither prevents write skew — only Serializable does.</p>
<p>Serializable isn't free: Postgres's SSI will abort transactions with <code>ERROR: could not serialize access</code> (SQLSTATE 40001), so your code <strong>must retry</strong>. That's the deal: correctness for retries.</p>`,
        he: `<table>
<tr><th>Level</th><th>Dirty</th><th>Non-repeatable</th><th>Phantom</th></tr>
<tr><td>Read Uncommitted</td><td>אפשרי</td><td>אפשרי</td><td>אפשרי</td></tr>
<tr><td>Read Committed</td><td>לא</td><td>אפשרי</td><td>אפשרי</td></tr>
<tr><td>Repeatable Read</td><td>לא</td><td>לא</td><td>אפשרי*</td></tr>
<tr><td>Serializable</td><td>לא</td><td>לא</td><td>לא</td></tr>
</table>
<p>הדיפולטים חשובים: <strong>Postgres = Read Committed</strong>, <strong>MySQL InnoDB = Repeatable Read</strong>. *בפועל, Repeatable Read של Postgres (snapshot isolation) חוסם גם phantoms, ו-InnoDB משתמש ב-gap/next-key locks כדי למנוע את רובם. אף אחד מהם לא מונע write skew — רק Serializable.</p>
<p>Serializable לא בחינם: ה-SSI של Postgres יעשה abort לטרנזקציות עם <code>ERROR: could not serialize access</code> (SQLSTATE 40001), אז הקוד שלכם <strong>חייב לעשות retry</strong>. זה הדיל: נכונות תמורת retries.</p>`
      }
    },
    {
      h: { en: "Locks and deadlocks", he: "Locks ו-deadlocks" },
      body: {
        en: `<p>Writers take <strong>row locks</strong>; a second writer on the same row waits. <code>SELECT ... FOR UPDATE</code> takes the lock explicitly; <code>FOR UPDATE SKIP LOCKED</code> lets job-queue workers grab different rows without blocking each other — a great pattern for a Postgres-backed queue.</p>
<p>A <strong>deadlock</strong>: T1 locks row A then wants B; T2 locks B then wants A. Both would wait forever — so the DB detects the cycle (Postgres checks after <code>deadlock_timeout</code> = 1 s) and kills one with <code>ERROR: deadlock detected</code>.</p>
<p>Prevention: <strong>lock in a consistent order</strong> (e.g. always lower account id first), keep transactions short, and never hold a transaction open while calling an external API.</p>
<blockquote>⚠️ Production tip: Set <code>lock_timeout</code> (e.g. 5s) and <code>idle_in_transaction_session_timeout</code> in Postgres. One forgotten "idle in transaction" session can hold locks for hours and block VACUUM cleanup, causing bloat across the whole DB.</blockquote>`,
        he: `<p>כותבים לוקחים <strong>row locks</strong>; כותב שני על אותה שורה מחכה. <code>SELECT ... FOR UPDATE</code> לוקח את ה-lock במפורש; <code>FOR UPDATE SKIP LOCKED</code> מאפשר ל-workers של job queue לתפוס שורות שונות בלי לחסום אחד את השני — pattern מעולה ל-queue מעל Postgres.</p>
<p><strong>Deadlock</strong>: T1 נועל שורה A ואז רוצה את B; T2 נועל את B ואז רוצה את A. שניהם היו מחכים לנצח — אז ה-DB מזהה את המעגל (Postgres בודק אחרי <code>deadlock_timeout</code> = שנייה) והורג אחד מהם עם <code>ERROR: deadlock detected</code>.</p>
<p>מניעה: <strong>נועלים בסדר עקבי</strong> (למשל תמיד את ה-id הנמוך קודם), שומרים טרנזקציות קצרות, ואף פעם לא מחזיקים טרנזקציה פתוחה בזמן קריאה ל-API חיצוני.</p>
<blockquote>⚠️ טיפ לפרודקשן: הגדירו <code>lock_timeout</code> (למשל 5s) ו-<code>idle_in_transaction_session_timeout</code> ב-Postgres. session אחד שנשכח במצב "idle in transaction" יכול להחזיק locks שעות ולחסום את הניקוי של VACUUM, מה שגורם ל-bloat בכל ה-DB.</blockquote>`
      }
    },
    {
      h: { en: "MVCC: readers don't block writers", he: "MVCC: קוראים לא חוסמים כותבים" },
      body: {
        en: `<p>Postgres, MySQL InnoDB and Oracle use <strong>Multi-Version Concurrency Control</strong>. An UPDATE doesn't overwrite a row in place; it creates a new <em>version</em>. Each transaction reads from a <strong>snapshot</strong> — the versions committed as of its start (Repeatable Read) or statement start (Read Committed). So a long report query reads a consistent picture while writers keep going, and nobody waits.</p>
<p>The bill comes later: old versions must be cleaned up. Postgres does it with <strong>VACUUM</strong> (autovacuum); InnoDB with purge of the undo log. A transaction open for 6 hours pins the oldest snapshot, so nothing newer than it can be cleaned — dead tuples pile up and queries slow down. Postgres also needs vacuum to prevent <em>transaction ID wraparound</em>, which in the worst case forces the DB to stop accepting writes until it's vacuumed.</p>`,
        he: `<p>Postgres, MySQL InnoDB ו-Oracle משתמשים ב-<strong>Multi-Version Concurrency Control</strong>. UPDATE לא דורס שורה במקום; הוא יוצר <em>גרסה</em> חדשה. כל טרנזקציה קוראת מ-<strong>snapshot</strong> — הגרסאות שעשו commit נכון לתחילתה (Repeatable Read) או לתחילת ה-statement (Read Committed). כך דוח ארוך קורא תמונה עקבית בזמן שהכותבים ממשיכים, ואף אחד לא מחכה.</p>
<p>החשבון מגיע אחר כך: צריך לנקות גרסאות ישנות. Postgres עושה את זה עם <strong>VACUUM</strong> (autovacuum); InnoDB עם purge של ה-undo log. טרנזקציה פתוחה 6 שעות "מצמידה" את ה-snapshot הכי ישן, אז שום דבר חדש ממנו לא מתנקה — dead tuples נערמים וה-queries מאטים. Postgres צריך vacuum גם כדי למנוע <em>transaction ID wraparound</em>, שבמקרה הגרוע גורם ל-DB להפסיק לקבל כתיבות עד שעושים vacuum.</p>`
      }
    }
  ],
  diagram: `  Deadlock:
     T1: LOCK row A ----------> wants row B  (waits for T2)
                                    ^   |
                                    |   v
     T2: LOCK row B ----------> wants row A  (waits for T1)
     => cycle detected -> DB aborts one: "ERROR: deadlock detected"

  MVCC:
     row id=1:  v1 (balance=100, xmin=500)  <- snapshot taken at xid 510 sees this
                v2 (balance= 50, xmin=520)  <- snapshot taken at xid 530 sees this
     VACUUM removes v1 once no snapshot older than 520 exists`,
  handsOn: [
    { cmd: "psql -c \"SHOW default_transaction_isolation;\"", what: { en: "Check your DB's default isolation level (Postgres: read committed).", he: "בודקים את ה-isolation level הדיפולטי (ב-Postgres: read committed)." } },
    { cmd: "# Terminal 1: BEGIN; UPDATE accounts SET balance=0 WHERE id=1;\n# Terminal 2: SELECT balance FROM accounts WHERE id=1;   -- old value, no dirty read\n# Terminal 2: UPDATE accounts SET balance=5 WHERE id=1;  -- blocks until T1 commits", what: { en: "Open two psql sessions and watch MVCC (read sees old version) and row locks (writer waits).", he: "פותחים שני sessions של psql ורואים MVCC (קריאה רואה גרסה ישנה) ו-row locks (כותב מחכה)." } },
    { cmd: "psql -c \"SELECT pid, state, now()-xact_start AS age, query FROM pg_stat_activity WHERE state <> 'idle' ORDER BY age DESC;\"", what: { en: "Find long-running and idle-in-transaction sessions — the usual suspects for lock pileups and bloat.", he: "מוצאים sessions ארוכים ו-idle in transaction — החשודים הרגילים בהצטברות locks וב-bloat." } }
  ],
  mnemonic: {
    en: "Anomalies by severity: \"Dirty, Non-repeat, Phantom\" = \"DNP: Do Not Peek\". Each isolation level removes one more peek, left to right.",
    he: "האנומליות לפי חומרה: \"Dirty, Non-repeat, Phantom\" = \"DNP: Do Not Peek\" — אל תציץ. כל isolation level מוריד עוד הצצה אחת, משמאל לימין."
  },
  pitfalls: [
    { en: "Read-modify-write in application code (read balance, add in Python, write back) under Read Committed → lost updates. Use atomic SQL or FOR UPDATE.", he: "Read-modify-write בקוד האפליקציה (קוראים balance, מחברים ב-Python, כותבים חזרה) תחת Read Committed → lost updates. משתמשים ב-SQL אטומי או FOR UPDATE." },
    { en: "Calling an HTTP API inside a DB transaction: the API takes 30 s, your row locks are held for 30 s, and everything queues behind them.", he: "לקרוא ל-HTTP API בתוך טרנזקציה: ה-API לוקח 30 שניות, ה-row locks מוחזקים 30 שניות, והכול נערם מאחוריהם." },
    { en: "Switching to SERIALIZABLE without adding retry logic — users now see random 40001 errors.", he: "לעבור ל-SERIALIZABLE בלי להוסיף retry — עכשיו המשתמשים רואים שגיאות 40001 אקראיות." },
    { en: "Assuming the same isolation level name means the same behavior across Postgres and MySQL. It doesn't — read the docs for your engine.", he: "להניח שאותו שם של isolation level אומר אותה התנהגות ב-Postgres וב-MySQL. זה לא — קראו את התיעוד של המנוע שלכם." }
  ],
  interview: [
    {
      q: { en: "How would you prevent two users from booking the last seat?", he: "איך מונעים משני משתמשים להזמין את המושב האחרון?" },
      a: {
        en: "Make the check-and-write atomic: a conditional update (UPDATE seats SET booked_by = $1 WHERE id = $2 AND booked_by IS NULL, then check rows affected = 1), or SELECT ... FOR UPDATE in a transaction, or a UNIQUE constraint on (flight, seat) in the bookings table so the DB rejects the duplicate. Optimistic locking with a version column also works.",
        he: "הופכים את ה\"בדוק-וכתוב\" לאטומי: update מותנה (UPDATE seats SET booked_by = $1 WHERE id = $2 AND booked_by IS NULL, ובודקים ש-rows affected = 1), או SELECT ... FOR UPDATE בתוך טרנזקציה, או UNIQUE constraint על (flight, seat) בטבלת ההזמנות כך שה-DB ידחה את הכפילות. גם optimistic locking עם עמודת version עובד."
      }
    },
    {
      q: { en: "What is MVCC and what's its main operational cost?", he: "מה זה MVCC ומה המחיר התפעולי העיקרי שלו?" },
      a: {
        en: "Each write creates a new row version; readers use snapshots so they don't block writers. The cost is garbage: dead versions must be vacuumed/purged, and long-running transactions prevent cleanup, causing bloat and slower queries.",
        he: "כל כתיבה יוצרת גרסה חדשה של השורה; קוראים משתמשים ב-snapshots ולכן לא חוסמים כותבים. המחיר הוא זבל: צריך לעשות vacuum/purge לגרסאות מתות, וטרנזקציות ארוכות מונעות ניקוי — מה שגורם ל-bloat ול-queries איטיים יותר."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Two requests each run: SELECT stock → 1; UPDATE SET stock = 0; both succeed and two units are sold. Which anomaly?", he: "שתי בקשות מריצות: SELECT stock → 1; UPDATE SET stock = 0; שתיהן מצליחות ונמכרו שתי יחידות. איזו אנומליה?" },
      options: [
        { en: "Dirty read", he: "Dirty read" },
        { en: "Lost update", he: "Lost update" },
        { en: "Phantom read", he: "Phantom read" },
        { en: "Deadlock", he: "Deadlock" }
      ],
      answer: 1,
      explain: { en: "Classic read-modify-write race: both read the same value and overwrite. Use UPDATE ... SET stock = stock - 1 WHERE stock > 0.", he: "מרוץ read-modify-write קלאסי: שתיהן קוראות אותו ערך ודורסות. משתמשים ב-UPDATE ... SET stock = stock - 1 WHERE stock > 0." }
    },
    {
      q: { en: "Default isolation level in PostgreSQL?", he: "מה ה-isolation level הדיפולטי ב-PostgreSQL?" },
      options: [
        { en: "Serializable", he: "Serializable" },
        { en: "Repeatable Read", he: "Repeatable Read" },
        { en: "Read Committed", he: "Read Committed" },
        { en: "Read Uncommitted", he: "Read Uncommitted" }
      ],
      answer: 2,
      explain: { en: "Postgres defaults to Read Committed; MySQL InnoDB defaults to Repeatable Read. (Postgres treats Read Uncommitted as Read Committed anyway.)", he: "Postgres דיפולטי ב-Read Committed; MySQL InnoDB ב-Repeatable Read. (Postgres ממילא מתייחס ל-Read Uncommitted כמו ל-Read Committed.)" }
    },
    {
      q: { en: "Best way to reduce deadlocks between transfer transactions?", he: "מה הדרך הכי טובה לצמצם deadlocks בין טרנזקציות של העברות?" },
      options: [
        { en: "Always lock accounts in a consistent order (e.g. by id)", he: "תמיד לנעול חשבונות בסדר עקבי (למשל לפי id)" },
        { en: "Increase deadlock_timeout to 60 s", he: "להגדיל את deadlock_timeout ל-60 שניות" },
        { en: "Use Read Uncommitted", he: "להשתמש ב-Read Uncommitted" },
        { en: "Add more indexes", he: "להוסיף עוד indexes" }
      ],
      answer: 0,
      explain: { en: "Deadlocks need a cycle; a global lock order makes cycles impossible. A longer timeout just makes deadlocks hurt longer.", he: "Deadlock צריך מעגל; סדר נעילה גלובלי הופך מעגל לבלתי אפשרי. timeout ארוך יותר רק גורם ל-deadlock לכאוב יותר זמן." }
    },
    {
      q: { en: "Your Postgres tables keep bloating despite autovacuum. Most likely cause?", he: "הטבלאות ב-Postgres ממשיכות להתנפח למרות autovacuum. מה הסיבה הכי סבירה?" },
      options: [
        { en: "Too many indexes", he: "יותר מדי indexes" },
        { en: "Isolation level is Read Committed", he: "ה-isolation level הוא Read Committed" },
        { en: "Disk is SSD instead of HDD", he: "הדיסק SSD ולא HDD" },
        { en: "A long-running or idle-in-transaction session is holding an old snapshot", he: "session ארוך או idle in transaction מחזיק snapshot ישן" }
      ],
      answer: 3,
      explain: { en: "Vacuum can't remove versions that an old snapshot might still need. Find it in pg_stat_activity and kill it; set idle_in_transaction_session_timeout.", he: "Vacuum לא יכול למחוק גרסאות ש-snapshot ישן עוד עלול להצטרך. מוצאים אותו ב-pg_stat_activity והורגים; מגדירים idle_in_transaction_session_timeout." }
    }
  ],
  related: ["db-indexes", "db-replication", "db-cap"]
});

INFRA.lessons.push({
  id: "db-replication",
  track: "data",
  order: 4,
  icon: "🪞",
  level: 2,
  minutes: 11,
  title: { en: "Replication: Primaries, Replicas & Lag", he: "Replication: primary, replicas ו-lag" },
  tldr: {
    en: "Replication copies every write from a primary to replicas for read scaling and failover; the price is lag (async) or latency (sync), and failover is where the dragons live.",
    he: "Replication מעתיק כל כתיבה מה-primary ל-replicas בשביל scale של קריאות ו-failover; המחיר הוא lag (async) או latency (sync), ו-failover זה המקום שבו גרים הדרקונים."
  },
  analogy: {
    en: "The primary is a teacher writing on the board; replicas are students copying into notebooks. Ask a student a question and they might be one line behind. If the teacher faints, a student takes over — but if two students both think they're the new teacher, the class gets two contradicting lessons. That's split brain.",
    he: "ה-primary הוא מורה שכותבת על הלוח; ה-replicas הם תלמידים שמעתיקים למחברת. שואלים תלמיד — הוא אולי שורה אחת מאחור. אם המורה מתעלפת, תלמיד מחליף אותה — אבל אם שני תלמידים חושבים שהם המורה החדשה, הכיתה מקבלת שני שיעורים סותרים. זה split brain."
  },
  sections: [
    {
      h: { en: "How it works: shipping the log", he: "איך זה עובד: שולחים את ה-log" },
      body: {
        en: `<p>Every write on the primary is first recorded in a log — the <strong>WAL</strong> in Postgres, the <strong>binlog</strong> in MySQL, the <strong>oplog</strong> in MongoDB. Replicas stream that log and replay it, ending up with the same data. Postgres <em>physical</em> streaming replication ships byte-level WAL (replica is an exact copy, read-only); <em>logical</em> replication ships row changes, allowing different major versions, subsets of tables, or CDC into Kafka (Debezium).</p>
<p>Why replicate?</p>
<ul><li><strong>High availability</strong> — promote a replica if the primary dies.</li><li><strong>Read scaling</strong> — send reports, search indexing and read-heavy endpoints to replicas.</li><li><strong>Geo locality</strong> — a replica in eu-west serves European reads at 5 ms instead of 90 ms.</li><li><strong>Backups</strong> — take backups from a replica so the primary isn't loaded.</li></ul>
<p>Replication does <em>not</em> scale writes: every replica must still apply every write.</p>`,
        he: `<p>כל כתיבה ב-primary נרשמת קודם ב-log — <strong>WAL</strong> ב-Postgres, <strong>binlog</strong> ב-MySQL, <strong>oplog</strong> ב-MongoDB. ה-replicas מזרימים את ה-log הזה ומריצים אותו מחדש, וכך מגיעים לאותו data. Streaming replication <em>פיזי</em> ב-Postgres שולח WAL ברמת בייטים (ה-replica הוא עותק מדויק, read-only); replication <em>לוגי</em> שולח שינויים ברמת שורה, מה שמאפשר major versions שונות, רק חלק מהטבלאות, או CDC ל-Kafka (Debezium).</p>
<p>למה לעשות replication?</p>
<ul><li><strong>High availability</strong> — עושים promote ל-replica אם ה-primary מת.</li><li><strong>Scale לקריאות</strong> — שולחים דוחות, אינדוקס לחיפוש ו-endpoints כבדי קריאה ל-replicas.</li><li><strong>קרבה גיאוגרפית</strong> — replica ב-eu-west משרת קריאות מאירופה ב-5 ms במקום 90 ms.</li><li><strong>גיבויים</strong> — לוקחים backup מ-replica כדי לא להעמיס על ה-primary.</li></ul>
<p>Replication <em>לא</em> עושה scale לכתיבות: כל replica עדיין צריך להריץ כל כתיבה.</p>`
      }
    },
    {
      h: { en: "Sync vs async: the core trade-off", he: "Sync מול async: ה-trade-off המרכזי" },
      body: {
        en: `<p><strong>Asynchronous</strong> (default in Postgres and MySQL): the primary commits locally and returns to the client immediately; replicas catch up "soon". Fast, but if the primary dies before shipping the last writes, those committed writes are <strong>lost</strong> after failover (RPO &gt; 0).</p>
<p><strong>Synchronous</strong>: the primary waits until at least one replica confirms before acknowledging COMMIT. Zero data loss on failover to that replica, but every commit pays a network round trip (~0.5-2 ms in-region, 30-100 ms cross-region), and if the sync replica is down, writes <em>stall</em>. Postgres: <code>synchronous_standby_names = 'ANY 1 (r1, r2)'</code> — wait for any one of two, so a single replica outage doesn't stop writes.</p>
<p><strong>Semi-sync</strong> (MySQL): wait for a replica to <em>receive</em> the event, not apply it. A middle ground.</p>
<blockquote>💡 Real world: AWS RDS Multi-AZ uses synchronous replication to a standby in another AZ (that's why failover loses no committed data), while RDS read replicas are async. Two different features for two different jobs.</blockquote>`,
        he: `<p><strong>Asynchronous</strong> (דיפולט ב-Postgres וב-MySQL): ה-primary עושה commit מקומי ומחזיר תשובה ללקוח מיד; ה-replicas משלימים "בקרוב". מהיר, אבל אם ה-primary מת לפני ששלח את הכתיבות האחרונות, הכתיבות האלה — שכבר אושרו — <strong>הולכות לאיבוד</strong> אחרי failover (RPO &gt; 0).</p>
<p><strong>Synchronous</strong>: ה-primary מחכה שלפחות replica אחד יאשר לפני שהוא מאשר COMMIT. אפס איבוד data ב-failover ל-replica הזה, אבל כל commit משלם הלוך-חזור ברשת (0.5-2 ms באותו region, 30-100 ms בין regions), ואם ה-replica הסינכרוני נופל, הכתיבות <em>נתקעות</em>. ב-Postgres: <code>synchronous_standby_names = 'ANY 1 (r1, r2)'</code> — מחכים לאחד מתוך שניים, כך שנפילה של replica אחד לא עוצרת כתיבות.</p>
<p><strong>Semi-sync</strong> (MySQL): מחכים שה-replica <em>יקבל</em> את האירוע, לא שיריץ אותו. דרך אמצע.</p>
<blockquote>💡 מהשטח: RDS Multi-AZ של AWS משתמש ב-replication סינכרוני ל-standby ב-AZ אחר (לכן failover לא מאבד data שאושר), בעוד ש-read replicas של RDS הם async. שני פיצ'רים שונים לשתי משימות שונות.</blockquote>`
      }
    },
    {
      h: { en: "Replication lag & read-your-writes", he: "Replication lag ו-read-your-writes" },
      body: {
        en: `<p>With async replicas, lag is usually milliseconds — but under a big batch update, a long-running query on the replica, or a slow disk, it can grow to seconds or minutes. The classic bug: user updates their profile (write → primary), page reloads (read → replica), and the old name shows. "Did my save fail?" — cue support ticket.</p>
<p>Fixes for <strong>read-your-writes consistency</strong>:</p>
<ul><li>Route a user's reads to the primary for N seconds after they write (sticky-to-primary).</li><li>Track the write's log position (Postgres LSN / MySQL GTID) and only read from a replica that has replayed past it.</li><li>Read the critical stuff (balances, permissions) from the primary always.</li></ul>
<p>Monitor lag: Postgres <code>SELECT now() - pg_last_xact_replay_timestamp();</code> on the replica, or <code>pg_stat_replication.replay_lag</code> on the primary; MySQL <code>SHOW REPLICA STATUS</code> → <code>Seconds_Behind_Source</code>. Alert at a threshold your product can tolerate (e.g. &gt; 30 s).</p>`,
        he: `<p>עם replicas אסינכרוניים, ה-lag בדרך כלל מילישניות — אבל תחת batch update גדול, query ארוך על ה-replica או דיסק איטי, הוא יכול לגדול לשניות או דקות. הבאג הקלאסי: משתמש מעדכן פרופיל (כתיבה → primary), הדף נטען מחדש (קריאה → replica), והשם הישן מופיע. "השמירה נכשלה?" — והנה טיקט לתמיכה.</p>
<p>פתרונות ל-<strong>read-your-writes consistency</strong>:</p>
<ul><li>מנתבים את הקריאות של משתמש ל-primary למשך N שניות אחרי שכתב (sticky-to-primary).</li><li>שומרים את מיקום הכתיבה ב-log (LSN ב-Postgres / GTID ב-MySQL) וקוראים רק מ-replica שכבר עבר אותו.</li><li>דברים קריטיים (יתרות, הרשאות) תמיד קוראים מה-primary.</li></ul>
<p>מנטרים lag: ב-Postgres <code>SELECT now() - pg_last_xact_replay_timestamp();</code> על ה-replica, או <code>pg_stat_replication.replay_lag</code> על ה-primary; ב-MySQL <code>SHOW REPLICA STATUS</code> → <code>Seconds_Behind_Source</code>. מתריעים בסף שהמוצר יכול לסבול (למשל &gt; 30 שניות).</p>`
      }
    },
    {
      h: { en: "Failover and split brain", he: "Failover ו-split brain" },
      body: {
        en: `<p><strong>Failover</strong> = detect primary is dead → pick the most up-to-date replica → promote it → repoint clients (DNS, VIP, proxy) → fence the old primary. Tools: Patroni (Postgres, uses etcd/Consul for leader election), Orchestrator / MySQL Group Replication, or your cloud's managed failover (RDS Multi-AZ: typically 60-120 s).</p>
<p>The hard part is <strong>"is it really dead?"</strong> A network partition makes a healthy primary <em>look</em> dead. If you promote a replica while the old primary still accepts writes, you get <strong>split brain</strong>: two primaries, diverging data, and a painful manual merge.</p>
<p>Defenses: a <strong>consensus/quorum</strong> for leader election (majority of 3 or 5 votes, so only one side of a partition can win), <strong>fencing</strong> (STONITH — "shoot the other node in the head": cut its power, revoke its storage, or have it demote itself when it loses its lease), and an odd number of voters.</p>
<blockquote>⚠️ Production tip: Practice failover in a game day. The first time you run it should not be during a real outage at 3 AM — and measure how long apps take to reconnect, not just how long promotion takes.</blockquote>`,
        he: `<p><strong>Failover</strong> = מזהים שה-primary מת → בוחרים את ה-replica הכי מעודכן → עושים לו promote → מפנים את הלקוחות (DNS, VIP, proxy) → עושים fencing ל-primary הישן. כלים: Patroni (Postgres, עם etcd/Consul לבחירת leader), Orchestrator / MySQL Group Replication, או ה-failover המנוהל של הענן (RDS Multi-AZ: בדרך כלל 60-120 שניות).</p>
<p>החלק הקשה הוא <strong>"הוא באמת מת?"</strong>. network partition גורם ל-primary בריא <em>להיראות</em> מת. אם עושים promote ל-replica בזמן שה-primary הישן עדיין מקבל כתיבות, מקבלים <strong>split brain</strong>: שני primaries, data שמתפצל, ו-merge ידני כואב.</p>
<p>הגנות: <strong>consensus/quorum</strong> לבחירת leader (רוב של 3 או 5 קולות, כך שרק צד אחד של ה-partition יכול לנצח), <strong>fencing</strong> (STONITH — "Shoot The Other Node In The Head": מנתקים לו חשמל, שוללים גישה ל-storage, או שהוא עושה לעצמו demote כשה-lease פג), ומספר אי-זוגי של מצביעים.</p>
<blockquote>⚠️ טיפ לפרודקשן: תתרגלו failover ב-game day. הפעם הראשונה שאתם מריצים את זה לא צריכה להיות בתקלה אמיתית בשלוש לפנות בוקר — ותמדדו כמה זמן לוקח לאפליקציות להתחבר מחדש, לא רק כמה זמן לוקח ה-promote.</blockquote>`
      }
    },
    {
      h: { en: "Multi-primary: tempting, tricky", he: "Multi-primary: מפתה ומסובך" },
      body: {
        en: `<p><strong>Multi-primary</strong> (multi-master) lets several nodes accept writes — e.g. one per region for low-latency writes everywhere. The catch is <strong>write conflicts</strong>: a user edits their email in Tel Aviv and in Frankfurt at the same moment. Who wins?</p>
<ul><li><strong>Last-write-wins</strong> by timestamp — simple, silently drops data, and clocks drift.</li><li><strong>CRDTs</strong> — data types that merge deterministically (counters, sets). Great for specific cases.</li><li><strong>Avoid conflicts</strong> — route each user/tenant to a "home" region, so a given row has one writer.</li></ul>
<p>Examples: MySQL Group Replication (multi-primary mode), Galera, Cassandra/DynamoDB global tables (LWW), CockroachDB/Spanner (consensus per range — strongly consistent, pays latency instead). Rule: use single-primary unless you have a concrete, measured reason not to.</p>`,
        he: `<p><strong>Multi-primary</strong> (multi-master) מאפשר לכמה nodes לקבל כתיבות — למשל אחד בכל region בשביל כתיבות עם latency נמוך בכל מקום. הקאץ' הוא <strong>קונפליקטים בכתיבה</strong>: משתמש משנה את האימייל בתל אביב ובפרנקפורט באותו רגע. מי מנצח?</p>
<ul><li><strong>Last-write-wins</strong> לפי timestamp — פשוט, מוחק data בשקט, והשעונים זזים.</li><li><strong>CRDTs</strong> — טיפוסי נתונים שמתמזגים באופן דטרמיניסטי (מונים, סטים). מעולה למקרים ספציפיים.</li><li><strong>להימנע מקונפליקטים</strong> — מנתבים כל user/tenant ל-region "בית", כך שלכל שורה יש כותב אחד.</li></ul>
<p>דוגמאות: MySQL Group Replication (במצב multi-primary), Galera, global tables של Cassandra/DynamoDB (LWW), CockroachDB/Spanner (consensus לכל range — strongly consistent, משלמים ב-latency במקום). הכלל: single-primary, אלא אם יש סיבה קונקרטית ומדודה.</p>`
      }
    }
  ],
  diagram: `          writes                          reads
  app ------------> [ PRIMARY ] ---WAL stream---> [ replica 1 ]  <--- reports
                        |       \\
                        |        \\--WAL stream--> [ replica 2 ]  <--- API reads
                        |
                  sync? waits for ACK          async? returns immediately
                                                  (lag = data at risk)

  Failover:  primary X  ->  leader election (etcd/quorum)  ->  promote replica 1
             -> fence old primary (STONITH)  ->  repoint DNS/proxy`,
  handsOn: [
    { cmd: "psql -c \"SELECT client_addr, state, sync_state, replay_lag FROM pg_stat_replication;\"", what: { en: "On the primary: list replicas, sync/async mode and how far behind they are.", he: "על ה-primary: רשימת replicas, מצב sync/async וכמה הם מפגרים." } },
    { cmd: "psql -h replica -c \"SELECT pg_is_in_recovery(), now() - pg_last_xact_replay_timestamp() AS lag;\"", what: { en: "On a replica: confirm it's a replica and measure lag in time.", he: "על replica: מוודאים שזה replica ומודדים lag בזמן." } },
    { cmd: "mysql -e 'SHOW REPLICA STATUS\\G' | grep -E 'Running|Seconds_Behind'", what: { en: "MySQL: check replication threads are running and the lag.", he: "MySQL: בודקים שה-threads של ה-replication רצים ומה ה-lag." } },
    { cmd: "patronictl -c /etc/patroni.yml list && patronictl -c /etc/patroni.yml switchover", what: { en: "With Patroni: view the cluster and perform a planned, graceful switchover.", he: "עם Patroni: רואים את ה-cluster ומבצעים switchover מתוכנן ומסודר." } }
  ],
  mnemonic: {
    en: "\"Async is fast and forgetful; sync is slow and faithful.\" And for failover: \"Elect, Promote, Fence, Repoint\" — EPFR, \"Every Primary Fears Replacement\".",
    he: "\"Async מהיר ושכחן; sync איטי ונאמן.\" ול-failover: \"Elect, Promote, Fence, Repoint\" — EPFR, \"Every Primary Fears Replacement\" — כל primary מפחד שיחליפו אותו."
  },
  pitfalls: [
    { en: "Sending all reads to replicas without handling lag — users see their own changes 'disappear'.", he: "לשלוח את כל הקריאות ל-replicas בלי לטפל ב-lag — משתמשים רואים את השינויים שלהם \"נעלמים\"." },
    { en: "Treating a replica as a backup. A DROP TABLE replicates to every replica within milliseconds. Replication protects against hardware failure, not human error.", he: "להתייחס ל-replica כאל backup. DROP TABLE משוכפל לכל ה-replicas תוך מילישניות. Replication מגן מפני כשל חומרה, לא מפני טעות אנוש." },
    { en: "Using a single synchronous replica: when it goes down, all writes on the primary hang.", he: "replica סינכרוני יחיד: כשהוא נופל, כל הכתיבות ב-primary נתקעות." },
    { en: "Apps caching the primary's IP or holding stale connections, so they keep hitting the dead/demoted node long after failover.", he: "אפליקציות ששומרות את ה-IP של ה-primary או מחזיקות connections ישנים, וממשיכות לפנות ל-node המת או ה-demoted הרבה אחרי ה-failover." }
  ],
  interview: [
    {
      q: { en: "What's the difference in RPO impact between sync and async replication?", he: "מה ההבדל בהשפעה על RPO בין replication סינכרוני לאסינכרוני?" },
      a: {
        en: "Sync: a commit is acknowledged only after a replica has it, so failover to that replica loses nothing (RPO ≈ 0), at the cost of commit latency and availability coupling. Async: commits return immediately; anything not yet shipped when the primary dies is lost (RPO = current lag).",
        he: "Sync: commit מאושר רק אחרי שה-replica קיבל אותו, אז failover ל-replica הזה לא מאבד כלום (RPO ≈ 0), במחיר של latency ב-commit ותלות בזמינות ה-replica. Async: commits חוזרים מיד; כל מה שלא נשלח כשה-primary מת הולך לאיבוד (RPO = ה-lag הנוכחי)."
      }
    },
    {
      q: { en: "How do you prevent split brain?", he: "איך מונעים split brain?" },
      a: {
        en: "Use quorum-based leader election (etcd/Consul/Raft with an odd number of voters) so only the majority side can elect a primary; use leases so a primary that loses contact with the quorum demotes itself; and fence the old primary (STONITH, revoke network/storage) before promoting a new one.",
        he: "בחירת leader מבוססת quorum (etcd/Consul/Raft עם מספר אי-זוגי של מצביעים) כך שרק צד הרוב יכול לבחור primary; leases כך ש-primary שמאבד קשר עם ה-quorum עושה לעצמו demote; ו-fencing ל-primary הישן (STONITH, ניתוק רשת/storage) לפני promote של חדש."
      }
    }
  ],
  quiz: [
    {
      q: { en: "A user saves a setting and immediately sees the old value. Writes go to the primary, reads to an async replica. What's this?", he: "משתמש שומר הגדרה ומיד רואה את הערך הישן. כתיבות ל-primary, קריאות ל-replica אסינכרוני. מה זה?" },
      options: [
        { en: "A deadlock", he: "Deadlock" },
        { en: "Split brain", he: "Split brain" },
        { en: "Replication lag violating read-your-writes", he: "Replication lag שמפר read-your-writes" },
        { en: "A dirty read", he: "Dirty read" }
      ],
      answer: 2,
      explain: { en: "The replica hasn't replayed the write yet. Route that user's reads to the primary briefly, or wait for the replica to reach the write's LSN/GTID.", he: "ה-replica עוד לא הריץ את הכתיבה. מנתבים את הקריאות של המשתמש ל-primary לזמן קצר, או מחכים שה-replica יגיע ל-LSN/GTID של הכתיבה." }
    },
    {
      q: { en: "Someone runs DELETE FROM orders without WHERE on the primary. What do the replicas give you?", he: "מישהו מריץ DELETE FROM orders בלי WHERE על ה-primary. מה ה-replicas נותנים לכם?" },
      options: [
        { en: "Nothing — they replicated the delete within milliseconds", he: "כלום — הם שכפלו את ה-delete תוך מילישניות" },
        { en: "A full copy of the orders you can restore from", he: "עותק מלא של ההזמנות שאפשר לשחזר ממנו" },
        { en: "Automatic rollback of the delete", he: "Rollback אוטומטי של ה-delete" },
        { en: "Protection, because replicas are read-only", he: "הגנה, כי replicas הם read-only" }
      ],
      answer: 0,
      explain: { en: "Replicas faithfully copy mistakes. You need backups + PITR (or a deliberately delayed replica, e.g. recovery_min_apply_delay = '1h').", he: "Replicas מעתיקים טעויות בנאמנות. צריך backups + PITR (או replica מושהה בכוונה, למשל recovery_min_apply_delay = '1h')." }
    },
    {
      q: { en: "Why do HA clusters use 3 (not 2) nodes for leader election?", he: "למה clusters של HA משתמשים ב-3 nodes (ולא 2) לבחירת leader?" },
      options: [
        { en: "To triple read throughput", he: "כדי לשלש את ה-throughput של הקריאות" },
        { en: "So a majority (2 of 3) can still decide during a partition, avoiding split brain", he: "כדי שרוב (2 מתוך 3) עדיין יוכל להחליט בזמן partition, וכך להימנע מ-split brain" },
        { en: "Because Postgres requires exactly 3 replicas", he: "כי Postgres דורש בדיוק 3 replicas" },
        { en: "To make synchronous replication faster", he: "כדי להאיץ replication סינכרוני" }
      ],
      answer: 1,
      explain: { en: "With 2 nodes, a partition leaves 1 vs 1 — no majority, or worse, both promote. With 3, only the side with 2 can win.", he: "עם 2 nodes, partition משאיר 1 מול 1 — אין רוב, או גרוע יותר, שניהם עושים promote. עם 3, רק הצד עם 2 יכול לנצח." }
    },
    {
      q: { en: "Your only synchronous replica crashes. What happens to writes on the primary (strict sync mode)?", he: "ה-replica הסינכרוני היחיד קורס. מה קורה לכתיבות ב-primary (במצב sync קשיח)?" },
      options: [
        { en: "They speed up", he: "הן מואצות" },
        { en: "They're silently dropped", he: "הן נזרקות בשקט" },
        { en: "They go to the replica's disk directly", he: "הן נכתבות ישירות לדיסק של ה-replica" },
        { en: "COMMITs hang waiting for an acknowledgement that never comes", he: "COMMITs נתקעים בהמתנה לאישור שלא מגיע" }
      ],
      answer: 3,
      explain: { en: "That's the availability cost of sync replication. Use 'ANY 1 (r1, r2)' with two candidates so one failure doesn't freeze writes.", he: "זה מחיר הזמינות של replication סינכרוני. משתמשים ב-'ANY 1 (r1, r2)' עם שני מועמדים כך שכשל אחד לא מקפיא כתיבות." }
    }
  ],
  playground: "dr",
  related: ["db-transactions", "db-cap", "db-backups", "rel-bcdr"]
});

INFRA.lessons.push({
  id: "db-sharding",
  track: "data",
  order: 5,
  icon: "🧩",
  level: 3,
  minutes: 12,
  title: { en: "Partitioning & Sharding", he: "Partitioning ו-sharding" },
  tldr: {
    en: "Sharding splits one dataset across many database servers by a shard key; it scales writes and storage, but a bad key creates hot shards and cross-shard queries, and resharding is open-heart surgery.",
    he: "Sharding מפצל dataset אחד על פני הרבה שרתי DB לפי shard key; זה עושה scale לכתיבות ול-storage, אבל key גרוע יוצר hot shards ו-queries בין shards, ו-resharding זה ניתוח לב פתוח."
  },
  analogy: {
    en: "One post office can't handle the whole country, so you open branches by ZIP code. Mail for a ZIP goes to exactly one branch — fast. But if one ZIP is Tel Aviv's busiest office tower, that branch drowns while the others nap (hot shard). And 'count all letters nationwide' means calling every branch (scatter-gather).",
    he: "סניף דואר אחד לא יכול לשרת את כל המדינה, אז פותחים סניפים לפי מיקוד. דואר למיקוד מסוים הולך לסניף אחד בדיוק — מהיר. אבל אם מיקוד אחד הוא מגדל המשרדים הכי עמוס בתל אביב, הסניף הזה טובע בזמן שהאחרים מנמנמים (hot shard). ו\"תספרו את כל המכתבים בארץ\" אומר להתקשר לכל הסניפים (scatter-gather)."
  },
  sections: [
    {
      h: { en: "Partitioning vs sharding", he: "Partitioning מול sharding" },
      body: {
        en: `<p><strong>Partitioning</strong> splits a big table into pieces <em>inside one database server</em>. Postgres declarative partitioning:</p>
<pre>CREATE TABLE events (id bigint, created_at timestamptz, payload jsonb)
  PARTITION BY RANGE (created_at);
CREATE TABLE events_2025_06 PARTITION OF events
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');</pre>
<p>Queries filtered by date touch only relevant partitions (<em>partition pruning</em>), and retention becomes <code>DROP TABLE events_2024_01</code> — instant, instead of a <code>DELETE</code> of 200M rows that bloats everything.</p>
<p><strong>Sharding</strong> (horizontal partitioning across machines) puts different rows on <em>different servers</em>. Now you scale writes, storage and memory beyond one box — but you also lose cross-shard JOINs, cross-shard transactions (without 2PC), global unique constraints and simple backups.</p>
<blockquote>💡 Real world: Before sharding, exhaust the cheaper options: bigger instance (a 64-vCPU, 512 GB box is very capable), read replicas, caching, archiving old data, partitioning. Sharding is a one-way door that adds complexity to every future feature.</blockquote>`,
        he: `<p><strong>Partitioning</strong> מפצל טבלה גדולה לחלקים <em>בתוך שרת DB אחד</em>. partitioning דקלרטיבי ב-Postgres:</p>
<pre>CREATE TABLE events (id bigint, created_at timestamptz, payload jsonb)
  PARTITION BY RANGE (created_at);
CREATE TABLE events_2025_06 PARTITION OF events
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');</pre>
<p>Queries עם פילטר על תאריך נוגעים רק ב-partitions הרלוונטיים (<em>partition pruning</em>), ו-retention הופך ל-<code>DROP TABLE events_2024_01</code> — מיידי, במקום <code>DELETE</code> של 200 מיליון שורות שמנפח הכול.</p>
<p><strong>Sharding</strong> (partitioning אופקי בין מכונות) שם שורות שונות על <em>שרתים שונים</em>. עכשיו יש scale לכתיבות, ל-storage ולזיכרון מעבר למכונה אחת — אבל מאבדים JOINs בין shards, טרנזקציות בין shards (בלי 2PC), unique constraints גלובליים וגיבויים פשוטים.</p>
<blockquote>💡 מהשטח: לפני sharding, ממצים את האפשרויות הזולות: instance גדול יותר (מכונה עם 64 vCPU ו-512 GB זה המון), read replicas, caching, ארכוב data ישן, partitioning. Sharding זו דלת חד-כיוונית שמוסיפה מורכבות לכל פיצ'ר עתידי.</blockquote>`
      }
    },
    {
      h: { en: "Choosing a shard key (and avoiding hot shards)", he: "בחירת shard key (והימנעות מ-hot shards)" },
      body: {
        en: `<p>The shard key decides which shard owns a row. A good key has:</p>
<ul><li><strong>High cardinality</strong> — millions of distinct values, not 5.</li><li><strong>Even distribution</strong> of data <em>and traffic</em>.</li><li><strong>Query locality</strong> — most queries include the key, so they hit one shard.</li></ul>
<p>For B2B SaaS, <code>tenant_id</code> is the classic: all of a tenant's data lives together, so joins within a tenant still work. Danger: one whale customer with 40% of traffic becomes a <strong>hot shard</strong>. Mitigate by giving big tenants dedicated shards or using a compound key (<code>tenant_id, user_id</code>).</p>
<p>Bad keys: <code>country</code> (low cardinality, skewed), <code>created_at</code> with range sharding (all new writes hammer the newest shard), a celebrity's <code>user_id</code> in a social feed (the "Justin Bieber problem").</p>
<blockquote>⚠️ Production tip: Monitor per-shard QPS, CPU and size, not just cluster averages. An average of 30% CPU can hide one shard at 98%.</blockquote>`,
        he: `<p>ה-shard key קובע איזה shard מחזיק שורה. key טוב הוא עם:</p>
<ul><li><strong>Cardinality גבוה</strong> — מיליוני ערכים שונים, לא 5.</li><li><strong>פיזור אחיד</strong> של data <em>וגם של traffic</em>.</li><li><strong>Query locality</strong> — רוב ה-queries כוללים את ה-key, אז הם פוגעים ב-shard אחד.</li></ul>
<p>ב-SaaS של B2B, <code>tenant_id</code> הוא הקלאסי: כל ה-data של tenant יושב יחד, אז joins בתוך tenant עדיין עובדים. הסכנה: לקוח לווייתן אחד עם 40% מה-traffic הופך ל-<strong>hot shard</strong>. מתמודדים עם shards ייעודיים ללקוחות גדולים או key מורכב (<code>tenant_id, user_id</code>).</p>
<p>Keys גרועים: <code>country</code> (cardinality נמוך, מוטה), <code>created_at</code> עם range sharding (כל הכתיבות החדשות דופקות את ה-shard החדש), <code>user_id</code> של סלב בפיד חברתי ("בעיית ג'סטין ביבר").</p>
<blockquote>⚠️ טיפ לפרודקשן: מנטרים QPS, CPU וגודל לכל shard, לא רק ממוצע של ה-cluster. ממוצע של 30% CPU יכול להסתיר shard אחד על 98%.</blockquote>`
      }
    },
    {
      h: { en: "Range vs hash sharding", he: "Range מול hash sharding" },
      body: {
        en: `<p><strong>Range sharding</strong>: shard 1 = keys A-F, shard 2 = G-M, ... Range scans are efficient (<code>WHERE id BETWEEN ...</code> hits one or two shards) and splitting a hot range is natural. But sequential keys (timestamps, auto-increment ids) send all new writes to the last shard. Used by HBase, Bigtable, CockroachDB, MongoDB ranged sharding.</p>
<p><strong>Hash sharding</strong>: <code>shard = hash(key) % N</code>. Spreads writes evenly even for sequential keys, but range queries must scatter to all shards. And the naive <code>% N</code> has a nasty property: change N from 4 to 5 and about <strong>80% of keys move</strong>. Used by Cassandra (with consistent hashing), DynamoDB, Redis Cluster (16,384 hash slots).</p>
<p><strong>Directory/lookup sharding</strong>: a mapping table says "tenant 42 → shard 7". Maximum flexibility (move one tenant at a time), at the cost of an extra lookup and a critical metadata service. Vitess and many in-house SaaS setups use variants of this.</p>`,
        he: `<p><strong>Range sharding</strong>: shard 1 = keys A-F, shard 2 = G-M, ... range scans יעילים (<code>WHERE id BETWEEN ...</code> פוגע ב-shard אחד או שניים) ופיצול של טווח חם הוא טבעי. אבל keys רציפים (timestamps, auto-increment) שולחים את כל הכתיבות החדשות ל-shard האחרון. בשימוש ב-HBase, Bigtable, CockroachDB, MongoDB ranged sharding.</p>
<p><strong>Hash sharding</strong>: <code>shard = hash(key) % N</code>. מפזר כתיבות באופן אחיד גם ל-keys רציפים, אבל range queries חייבים לפנות לכל ה-shards. וה-<code>% N</code> הנאיבי מגיע עם תכונה מגעילה: משנים N מ-4 ל-5 ובערך <strong>80% מה-keys זזים</strong>. בשימוש ב-Cassandra (עם consistent hashing), DynamoDB, Redis Cluster (16,384 hash slots).</p>
<p><strong>Directory/lookup sharding</strong>: טבלת מיפוי אומרת "tenant 42 → shard 7". גמישות מקסימלית (מזיזים tenant אחד בכל פעם), במחיר של lookup נוסף ושירות metadata קריטי. Vitess והרבה מערכות SaaS פנימיות משתמשים בגרסאות של זה.</p>`
      }
    },
    {
      h: { en: "Consistent hashing: moving only 1/N", he: "Consistent hashing: מזיזים רק 1/N" },
      body: {
        en: `<p>Picture a ring of hash values from 0 to 2^32. Each node is placed at several points on the ring (<strong>virtual nodes</strong>, e.g. 256 per server). A key is hashed onto the ring and walks clockwise to the first node it meets — that's its owner.</p>
<p>Add a 5th node: it takes over only the arcs right before its points, so only ~<strong>1/5 of keys move</strong> (vs ~80% with modulo). Remove a node: only its keys move, to their clockwise neighbors. Virtual nodes smooth the distribution and let a bigger machine own more points.</p>
<p>Where you'll meet it: Cassandra and DynamoDB partitioning, Riak, memcached client libraries (ketama), load balancers doing sticky routing (Envoy's ring hash / Maglev), CDNs mapping objects to cache servers.</p>`,
        he: `<p>תדמיינו טבעת של ערכי hash מ-0 עד 2^32. כל node ממוקם בכמה נקודות על הטבעת (<strong>virtual nodes</strong>, למשל 256 לכל שרת). key עובר hash לנקודה על הטבעת והולך עם כיוון השעון עד ל-node הראשון שהוא פוגש — זה הבעלים שלו.</p>
<p>מוסיפים node חמישי: הוא לוקח רק את הקשתות שממש לפני הנקודות שלו, אז רק בערך <strong>1/5 מה-keys זזים</strong> (לעומת 80% עם modulo). מורידים node: רק ה-keys שלו זזים, לשכנים עם כיוון השעון. Virtual nodes מחליקים את הפיזור ומאפשרים למכונה גדולה יותר להחזיק יותר נקודות.</p>
<p>איפה תפגשו את זה: partitioning ב-Cassandra וב-DynamoDB, Riak, ספריות client של memcached (ketama), load balancers עם ניתוב sticky (ring hash / Maglev ב-Envoy), CDNs שממפים אובייקטים לשרתי cache.</p>`
      }
    },
    {
      h: { en: "Resharding pain and cross-shard queries", he: "הכאב של resharding ו-queries בין shards" },
      body: {
        en: `<p><strong>Resharding</strong> — moving data while the app keeps running — is the hardest operation in this lesson. Typical playbook: (1) start copying a key range to the new shard, (2) stream ongoing changes (CDC/logical replication), (3) verify counts and checksums, (4) briefly block writes for that range and flip the routing, (5) delete the old copy later. Tools like Vitess (<code>MoveTables</code>/<code>Reshard</code>), the Citus rebalancer and MongoDB's balancer automate this; homemade solutions take quarters.</p>
<p><strong>Cross-shard queries</strong>: "top 10 products across all tenants" must <em>scatter-gather</em> — query every shard, merge results. Latency = slowest shard. Better: maintain a separate analytics store (warehouse via CDC) for global queries, and keep OLTP queries single-shard.</p>
<p>Also plan for <strong>global IDs</strong>: auto-increment per shard collides. Use UUIDv7/ULID or Snowflake-style IDs (timestamp + shard + sequence).</p>`,
        he: `<p><strong>Resharding</strong> — הזזת data בזמן שהאפליקציה ממשיכה לרוץ — זו הפעולה הכי קשה בשיעור הזה. ה-playbook הטיפוסי: (1) מתחילים להעתיק טווח keys ל-shard החדש, (2) מזרימים שינויים שוטפים (CDC/logical replication), (3) מאמתים ספירות ו-checksums, (4) חוסמים כתיבות לטווח לרגע קט ומחליפים את הניתוב, (5) מוחקים את העותק הישן אחר כך. כלים כמו Vitess (<code>MoveTables</code>/<code>Reshard</code>), ה-rebalancer של Citus וה-balancer של MongoDB עושים את זה אוטומטית; פתרונות ביתיים לוקחים רבעונים.</p>
<p><strong>Queries בין shards</strong>: "10 המוצרים המובילים בכל ה-tenants" חייב לעשות <em>scatter-gather</em> — query לכל shard ומיזוג תוצאות. ה-latency = ה-shard הכי איטי. עדיף: store אנליטי נפרד (warehouse דרך CDC) ל-queries גלובליים, ולשמור את ה-OLTP על shard יחיד.</p>
<p>תכננו גם <strong>IDs גלובליים</strong>: auto-increment לכל shard מתנגש. משתמשים ב-UUIDv7/ULID או IDs בסגנון Snowflake (timestamp + shard + sequence).</p>`
      }
    }
  ],
  diagram: `  Consistent hashing ring (4 nodes, keys walk clockwise):

                 0 / 2^32
                    |
            D  .----+----.  A
              /           \\        key k1 -> hashes here -> walks to B
             |             |   *k1
              \\           /
            C  '----+----'  B

  Add node E between A and B -> only keys in arc (A..E] move to E (~1/N)
  With hash % N, changing N from 4 to 5 moves ~80% of all keys`,
  handsOn: [
    { cmd: "node -e \"const h=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);let m=0;for(let i=0;i<100000;i++){const k='user'+i;if(h(k)%4!==h(k)%5)m++}console.log((m/1000).toFixed(1)+'% of keys move going 4->5 shards with modulo')\"", what: { en: "Prove to yourself how many keys move with naive modulo sharding.", he: "מוכיחים לעצמכם כמה keys זזים עם modulo sharding נאיבי." } },
    { cmd: "psql -c \"EXPLAIN SELECT count(*) FROM events WHERE created_at >= '2025-06-01' AND created_at < '2025-07-01';\"", what: { en: "On a partitioned table, see partition pruning: only one partition appears in the plan.", he: "על טבלה עם partitions, רואים partition pruning: רק partition אחד מופיע ב-plan." } },
    { cmd: "redis-cli -c CLUSTER KEYSLOT user:42 && redis-cli -c CLUSTER KEYSLOT '{user:42}:cart'", what: { en: "Redis Cluster: see which of 16,384 slots a key maps to; hash tags {...} force related keys into the same slot.", he: "Redis Cluster: רואים לאיזה slot מתוך 16,384 key ממופה; hash tags {...} מכריחים keys קשורים לאותו slot." } }
  ],
  mnemonic: {
    en: "Good shard key = \"CEL\": Cardinality high, Even spread, Locality of queries. And: \"Shard last, shard once, shard by who-asks.\"",
    he: "Shard key טוב = \"CEL\": Cardinality גבוה, Even — פיזור אחיד, Locality של queries. ו: \"עושים shard אחרון, פעם אחת, ולפי מי ששואל.\""
  },
  pitfalls: [
    { en: "Sharding by timestamp or auto-increment with range sharding → every write hits the newest shard.", he: "Sharding לפי timestamp או auto-increment עם range sharding → כל כתיבה פוגעת ב-shard החדש ביותר." },
    { en: "Picking a shard key most queries don't include → nearly every request becomes a scatter-gather across all shards.", he: "לבחור shard key שרוב ה-queries לא כוללים → כמעט כל בקשה הופכת ל-scatter-gather על כל ה-shards." },
    { en: "Using hash % N and then needing to add shards: a near-total data reshuffle.", he: "להשתמש ב-hash % N ואז להצטרך להוסיף shards: ערבוב כמעט מוחלט של כל ה-data." },
    { en: "Sharding prematurely at 50 GB because 'we'll need it eventually' — paying complexity tax for years before it pays off.", he: "לעשות sharding מוקדם מדי ב-50 GB כי \"בסוף נצטרך\" — משלמים מס מורכבות שנים לפני שזה מחזיר את עצמו." }
  ],
  interview: [
    {
      q: { en: "How would you shard a multi-tenant SaaS database, and what about one huge tenant?", he: "איך הייתם עושים sharding ל-DB של SaaS מרובה tenants, ומה עם tenant ענק אחד?" },
      a: {
        en: "Shard by tenant_id via a directory (tenant → shard map) so most queries are single-shard and tenants can be moved individually. Put whales on dedicated shards, or sub-shard them by a second key (tenant_id, user_id). Use global IDs (UUIDv7/Snowflake), and keep cross-tenant analytics in a warehouse fed by CDC.",
        he: "Sharding לפי tenant_id דרך directory (מיפוי tenant → shard) כך שרוב ה-queries הם על shard יחיד ואפשר להזיז tenants אחד-אחד. לווייתנים מקבלים shards ייעודיים, או sub-sharding לפי key שני (tenant_id, user_id). IDs גלובליים (UUIDv7/Snowflake), ואנליטיקס בין tenants ב-warehouse שמוזן מ-CDC."
      }
    },
    {
      q: { en: "Explain consistent hashing and why virtual nodes exist.", he: "הסבירו consistent hashing ולמה יש virtual nodes." },
      a: {
        en: "Nodes and keys hash onto a ring; each key belongs to the next node clockwise. Adding/removing a node moves only the keys in its adjacent arc (~1/N). With few physical points, arcs are uneven; virtual nodes place each server at many points, evening out load and allowing weighting by capacity.",
        he: "Nodes ו-keys עוברים hash לטבעת; כל key שייך ל-node הבא עם כיוון השעון. הוספה/הסרה של node מזיזה רק את ה-keys בקשת הסמוכה (~1/N). עם מעט נקודות פיזיות, הקשתות לא שוות; virtual nodes ממקמים כל שרת בהרבה נקודות, מאזנים את העומס ומאפשרים משקל לפי קיבולת."
      }
    }
  ],
  quiz: [
    {
      q: { en: "You range-shard an events table by created_at. What happens?", he: "עשיתם range sharding לטבלת events לפי created_at. מה קורה?" },
      options: [
        { en: "Writes spread evenly across all shards", he: "הכתיבות מתפזרות באופן אחיד על כל ה-shards" },
        { en: "All new writes land on the newest shard — a hot shard", he: "כל הכתיבות החדשות נוחתות על ה-shard החדש — hot shard" },
        { en: "Queries by time must scatter to all shards", he: "Queries לפי זמן חייבים לפנות לכל ה-shards" },
        { en: "Resharding becomes unnecessary", he: "Resharding נהיה מיותר" }
      ],
      answer: 1,
      explain: { en: "Monotonic keys plus range sharding concentrate writes at the tail. Time queries are actually efficient here — it's write balance that suffers.", he: "Keys מונוטוניים עם range sharding מרכזים כתיבות בזנב. דווקא queries לפי זמן יעילים פה — מה שנפגע זה איזון הכתיבות." }
    },
    {
      q: { en: "With consistent hashing and 10 nodes, adding an 11th moves roughly what share of keys?", he: "עם consistent hashing ו-10 nodes, הוספת node 11 מזיזה בערך איזה חלק מה-keys?" },
      options: [
        { en: "~91%", he: "~91%" },
        { en: "~50%", he: "~50%" },
        { en: "~9%", he: "~9%" },
        { en: "0% — keys never move", he: "0% — keys אף פעם לא זזים" }
      ],
      answer: 2,
      explain: { en: "The new node takes ~1/11 of the ring. With modulo hashing, ~10/11 ≈ 91% would move — that's the whole point.", he: "ה-node החדש לוקח בערך 1/11 מהטבעת. עם modulo hashing, ~10/11 ≈ 91% היו זזים — וזה כל הרעיון." }
    },
    {
      q: { en: "What does partitioning (single server) give you that's especially useful for time-series retention?", he: "מה partitioning (בשרת יחיד) נותן שמועיל במיוחד ל-retention של time-series?" },
      options: [
        { en: "Dropping a whole old partition instantly instead of a massive DELETE", he: "מחיקה מיידית של partition ישן שלם במקום DELETE ענק" },
        { en: "Cross-server write scaling", he: "Scale לכתיבות בין שרתים" },
        { en: "Automatic replication to other regions", he: "Replication אוטומטי ל-regions אחרים" },
        { en: "Global unique IDs", he: "IDs גלובליים ייחודיים" }
      ],
      answer: 0,
      explain: { en: "DROP/DETACH PARTITION is a metadata operation; DELETE of hundreds of millions of rows generates huge WAL and bloat.", he: "DROP/DETACH PARTITION זו פעולת metadata; DELETE של מאות מיליוני שורות מייצר המון WAL ו-bloat." }
    },
    {
      q: { en: "Cluster CPU averages 35%, but p99 latency is terrible for some customers. Likely culprit?", he: "ממוצע ה-CPU ב-cluster הוא 35%, אבל ה-p99 latency נורא אצל חלק מהלקוחות. מה החשוד?" },
      options: [
        { en: "Too many shards", he: "יותר מדי shards" },
        { en: "Consistent hashing is enabled", he: "Consistent hashing מופעל" },
        { en: "Missing global IDs", he: "חסרים IDs גלובליים" },
        { en: "A hot shard — one shard is saturated while others idle", he: "Hot shard — shard אחד ברוויה בזמן שהשאר בטלים" }
      ],
      answer: 3,
      explain: { en: "Averages hide skew. Look at per-shard metrics; move or split the hot tenant/key range.", he: "ממוצעים מסתירים הטיה. מסתכלים על מטריקות לכל shard; מזיזים או מפצלים את ה-tenant או טווח ה-keys החם." }
    }
  ],
  related: ["db-replication", "db-cap", "db-sql-vs-nosql"]
});

INFRA.lessons.push({
  id: "db-cap",
  track: "data",
  order: 6,
  icon: "⚖️",
  level: 3,
  minutes: 10,
  title: { en: "CAP, PACELC & Consistency", he: "CAP, PACELC ו-consistency" },
  tldr: {
    en: "When the network splits, a distributed DB must choose: refuse some requests (consistency) or answer with possibly stale data (availability). And even when the network is fine, it trades latency for consistency.",
    he: "כשהרשת מתפצלת, DB מבוזר חייב לבחור: לסרב לחלק מהבקשות (consistency) או לענות עם data שאולי לא עדכני (availability). וגם כשהרשת תקינה, הוא מחליף latency ב-consistency."
  },
  analogy: {
    en: "Two bank branches share a ledger by phone. The phone line goes dead. A customer wants to withdraw. The branch says either 'Sorry, can't verify your balance right now' (CP) or 'Sure, here's cash' and risks an overdraft when the line comes back (AP). There's no third option where the phone magically works.",
    he: "שני סניפי בנק מסנכרנים פנקס בטלפון. הקו נופל. לקוח רוצה למשוך כסף. הסניף אומר או \"סליחה, אני לא יכול לאמת את היתרה כרגע\" (CP) או \"בטח, הנה מזומן\" ומסתכן במשיכת יתר כשהקו יחזור (AP). אין אפשרות שלישית שבה הטלפון עובד בנס."
  },
  sections: [
    {
      h: { en: "CAP in plain words", he: "CAP במילים פשוטות" },
      body: {
        en: `<ul><li><strong>C — Consistency</strong> (linearizability): every read sees the latest committed write, as if there were one copy.</li><li><strong>A — Availability</strong>: every request to a non-failed node gets a (non-error) response.</li><li><strong>P — Partition tolerance</strong>: the system keeps working when messages between nodes are lost.</li></ul>
<p>The popular "pick 2 of 3" is misleading. In a distributed system, partitions <em>will</em> happen (switch failures, AZ isolation, GC pauses that look like death). So P isn't optional; the real statement is: <strong>during a partition, choose C or A</strong>.</p>
<ul><li><strong>CP</strong>: the minority side refuses writes/reads. etcd, ZooKeeper, Consul, Spanner, a Postgres cluster with quorum-based failover, MongoDB with majority concerns.</li><li><strong>AP</strong>: both sides keep answering and reconcile later. Cassandra and DynamoDB in their default modes, DNS, CouchDB.</li></ul>`,
        he: `<ul><li><strong>C — Consistency</strong> (linearizability): כל קריאה רואה את הכתיבה האחרונה שעשתה commit, כאילו יש עותק אחד.</li><li><strong>A — Availability</strong>: כל בקשה ל-node שלא קרס מקבלת תשובה (לא שגיאה).</li><li><strong>P — Partition tolerance</strong>: המערכת ממשיכה לעבוד כשהודעות בין nodes הולכות לאיבוד.</li></ul>
<p>ה"בחרו 2 מתוך 3" הפופולרי מטעה. במערכת מבוזרת partitions <em>יקרו</em> (כשל ב-switch, בידוד של AZ, GC pause שנראה כמו מוות). אז P זה לא אופציונלי; הניסוח האמיתי: <strong>בזמן partition, בוחרים C או A</strong>.</p>
<ul><li><strong>CP</strong>: הצד של המיעוט מסרב לכתיבות/קריאות. etcd, ZooKeeper, Consul, Spanner, cluster של Postgres עם failover מבוסס quorum, MongoDB עם majority concerns.</li><li><strong>AP</strong>: שני הצדדים ממשיכים לענות ומתיישבים אחר כך. Cassandra ו-DynamoDB במצב הדיפולטי, DNS, CouchDB.</li></ul>`
      }
    },
    {
      h: { en: "PACELC: the part CAP forgets", he: "PACELC: החלק ש-CAP שוכח" },
      body: {
        en: `<p>Partitions are rare. What about the other 99.99% of the time? <strong>PACELC</strong>: <em>if Partition → choose Availability or Consistency; Else → choose Latency or Consistency.</em></p>
<p>Even with a healthy network, strong consistency means coordinating replicas before answering — waiting for a quorum or a leader in another AZ/region. That costs milliseconds per operation (cross-region: 50-150 ms). Eventual consistency answers from the nearest replica immediately.</p>
<table>
<tr><th>System</th><th>PACELC</th></tr>
<tr><td>DynamoDB / Cassandra (default)</td><td>PA/EL — available and fast, eventually consistent</td></tr>
<tr><td>Spanner / CockroachDB</td><td>PC/EC — consistent always, pays latency</td></tr>
<tr><td>MongoDB (majority writes)</td><td>Roughly PC/EC, tunable</td></tr>
<tr><td>Postgres primary + async replicas</td><td>Reads on primary: consistent; on replicas: EL</td></tr>
</table>
<blockquote>💡 Real world: Many systems are <em>tunable per request</em>. DynamoDB lets you pass <code>ConsistentRead=true</code> (2x the read cost); Cassandra lets you choose <code>CONSISTENCY QUORUM</code> vs <code>ONE</code> per query.</blockquote>`,
        he: `<p>Partitions הם נדירים. מה עם 99.99% מהזמן האחר? <strong>PACELC</strong>: <em>אם Partition → בוחרים Availability או Consistency; Else (אחרת) → בוחרים Latency או Consistency.</em></p>
<p>גם ברשת תקינה, strong consistency אומר תיאום בין replicas לפני שעונים — מחכים ל-quorum או ל-leader ב-AZ/region אחר. זה עולה מילישניות לכל פעולה (בין regions: 50-150 ms). Eventual consistency עונה מה-replica הקרוב מיד.</p>
<table>
<tr><th>מערכת</th><th>PACELC</th></tr>
<tr><td>DynamoDB / Cassandra (דיפולט)</td><td>PA/EL — זמין ומהיר, eventually consistent</td></tr>
<tr><td>Spanner / CockroachDB</td><td>PC/EC — עקבי תמיד, משלם ב-latency</td></tr>
<tr><td>MongoDB (majority writes)</td><td>בערך PC/EC, ניתן לכיוונון</td></tr>
<tr><td>Postgres primary + async replicas</td><td>קריאה מה-primary: עקבית; מה-replicas: EL</td></tr>
</table>
<blockquote>💡 מהשטח: הרבה מערכות <em>ניתנות לכיוונון לכל בקשה</em>. DynamoDB מאפשר <code>ConsistentRead=true</code> (פי 2 בעלות הקריאה); Cassandra מאפשר לבחור <code>CONSISTENCY QUORUM</code> מול <code>ONE</code> לכל query.</blockquote>`
      }
    },
    {
      h: { en: "Strong vs eventual (and the useful middle)", he: "Strong מול eventual (והאמצע השימושי)" },
      body: {
        en: `<p><strong>Strong consistency</strong>: after a write is acknowledged, all readers see it. Needed for: account balances, inventory decrements, unique username claims, distributed locks, leader election.</p>
<p><strong>Eventual consistency</strong>: if writes stop, all replicas <em>eventually</em> converge — typically within milliseconds, but no upper bound is promised. Fine for: like counts, view counters, recommendation feeds, product catalog caches, DNS.</p>
<p>The useful middle-ground models (often good enough and cheaper):</p>
<ul><li><strong>Read-your-writes</strong> — you always see your own updates.</li><li><strong>Monotonic reads</strong> — you never see time go backwards (pin a user to one replica).</li><li><strong>Causal consistency</strong> — if B was caused by A (a reply to a comment), everyone sees A before B.</li></ul>
<p>Ask the product question: "What's the worst thing that happens if a user sees data 2 seconds old?" If the answer is "nothing", don't pay for strong.</p>`,
        he: `<p><strong>Strong consistency</strong>: אחרי שכתיבה אושרה, כל הקוראים רואים אותה. נחוץ ל: יתרות חשבון, הורדת מלאי, תפיסת username ייחודי, distributed locks, בחירת leader.</p>
<p><strong>Eventual consistency</strong>: אם הכתיבות נעצרות, כל ה-replicas <em>בסוף</em> מתכנסים — בדרך כלל תוך מילישניות, אבל אין הבטחה לחסם עליון. בסדר ל: ספירת לייקים, מוני צפיות, פידים של המלצות, cache של קטלוג מוצרים, DNS.</p>
<p>המודלים של האמצע השימושי (הרבה פעמים מספיקים וזולים יותר):</p>
<ul><li><strong>Read-your-writes</strong> — תמיד רואים את העדכונים של עצמכם.</li><li><strong>Monotonic reads</strong> — אף פעם לא רואים את הזמן חוזר אחורה (מצמידים משתמש ל-replica אחד).</li><li><strong>Causal consistency</strong> — אם B נגרם בגלל A (תגובה לתגובה), כולם רואים את A לפני B.</li></ul>
<p>שואלים את שאלת המוצר: "מה הדבר הכי גרוע שקורה אם משתמש רואה data בן 2 שניות?" אם התשובה היא "כלום", לא משלמים על strong.</p>`
      }
    },
    {
      h: { en: "Quorums: R + W > N", he: "Quorums: R + W > N" },
      body: {
        en: `<p>In leaderless systems (Cassandra, Dynamo-style stores, Riak), each key is stored on <strong>N</strong> replicas. A write succeeds when <strong>W</strong> replicas ack; a read queries <strong>R</strong> replicas and takes the newest version.</p>
<p>If <strong>R + W &gt; N</strong>, every read set overlaps every write set in at least one replica — so a read always sees the latest acknowledged write (assuming no sloppy-quorum tricks and correct conflict resolution).</p>
<ul><li>N=3, W=2, R=2 → 4 &gt; 3 ✅ the classic QUORUM/QUORUM. Tolerates 1 node down for both reads and writes.</li><li>N=3, W=1, R=1 → 2 ≤ 3 ❌ fastest, may read stale data.</li><li>N=3, W=3, R=1 → fast reads, but a single node down blocks all writes.</li></ul>
<p>In Cassandra: <code>CONSISTENCY LOCAL_QUORUM;</code> keeps the quorum inside the local DC, avoiding cross-region latency on every request.</p>
<blockquote>⚠️ Production tip: R+W&gt;N is about <em>overlap</em>, not magic. Clock-based last-write-wins can still drop a concurrent write. If two writers race on the same key, you need conditional writes (Cassandra LWT / DynamoDB ConditionExpression) or a single writer.</blockquote>`,
        he: `<p>במערכות בלי leader (Cassandra, stores בסגנון Dynamo, Riak), כל key נשמר על <strong>N</strong> replicas. כתיבה מצליחה כש-<strong>W</strong> replicas מאשרים; קריאה פונה ל-<strong>R</strong> replicas ולוקחת את הגרסה החדשה ביותר.</p>
<p>אם <strong>R + W &gt; N</strong>, כל קבוצת קריאה חופפת לכל קבוצת כתיבה לפחות ב-replica אחד — אז קריאה תמיד רואה את הכתיבה האחרונה שאושרה (בהנחה שאין טריקים של sloppy quorum ושיישוב הקונפליקטים נכון).</p>
<ul><li>N=3, W=2, R=2 → 4 &gt; 3 ✅ ה-QUORUM/QUORUM הקלאסי. שורד node אחד למטה גם בקריאה וגם בכתיבה.</li><li>N=3, W=1, R=1 → 2 ≤ 3 ❌ הכי מהיר, עלול לקרוא data ישן.</li><li>N=3, W=3, R=1 → קריאות מהירות, אבל node אחד שנופל חוסם את כל הכתיבות.</li></ul>
<p>ב-Cassandra: <code>CONSISTENCY LOCAL_QUORUM;</code> שומר את ה-quorum בתוך ה-DC המקומי, וחוסך latency בין regions בכל בקשה.</p>
<blockquote>⚠️ טיפ לפרודקשן: R+W&gt;N עוסק ב<em>חפיפה</em>, לא בקסם. last-write-wins מבוסס שעון עדיין יכול להפיל כתיבה מקבילה. אם שני כותבים מתחרים על אותו key, צריך conditional writes (LWT ב-Cassandra / ConditionExpression ב-DynamoDB) או כותב יחיד.</blockquote>`
      }
    }
  ],
  diagram: `  N = 3 replicas of key "cart:42"

     write W=2:   [R1 new]  [R2 new]  [R3 old]   (R3 missed it)
     read  R=2:             [R2 new]  [R3 old]
                               ^
                    overlap guaranteed since R + W = 4 > N = 3
                    -> newest version (from R2) wins

  PACELC:   Partition?  -- yes -->  Availability  vs  Consistency
                        -- no  -->  Latency       vs  Consistency`,
  handsOn: [
    { cmd: "cqlsh -e \"CONSISTENCY QUORUM; SELECT * FROM shop.carts WHERE user_id = 42;\"", what: { en: "Cassandra: run a query at QUORUM consistency (try ONE vs ALL and compare behavior while stopping a node).", he: "Cassandra: מריצים query ב-QUORUM (נסו ONE מול ALL ותשוו התנהגות תוך כדי שעוצרים node)." } },
    { cmd: "aws dynamodb get-item --table-name Orders --key '{\"pk\":{\"S\":\"order#1\"}}' --consistent-read", what: { en: "DynamoDB: force a strongly consistent read (costs 2x read capacity).", he: "DynamoDB: מכריחים קריאה strongly consistent (עולה פי 2 ב-read capacity)." } },
    { cmd: "etcdctl endpoint status --cluster -w table", what: { en: "See a CP system: etcd shows the leader and raft term; stop 2 of 3 members and writes are refused.", he: "רואים מערכת CP: etcd מציג את ה-leader וה-raft term; עוצרים 2 מתוך 3 חברים והכתיבות נדחות." } }
  ],
  mnemonic: {
    en: "\"If Partitioned: Available or Consistent; Else: Latency or Consistent\" — PAC-ELC, \"Pac-Man ELeCts\": even Pac-Man must choose between eating fast and eating right. Quorum: \"Readers + Writers must outnumber the Nodes.\"",
    he: "\"אם יש Partition — Available או Consistent; אחרת (Else) — Latency או Consistent\" — PAC-ELC, \"פקמן בוחר\": אפילו פקמן צריך לבחור בין לאכול מהר לבין לאכול נכון. Quorum: \"קוראים + כותבים חייבים להיות יותר מה-Nodes.\""
  },
  pitfalls: [
    { en: "Saying 'we chose CA' for a distributed system. Partitions aren't a choice; a 'CA' system just behaves undefined when one happens.", he: "להגיד \"בחרנו CA\" על מערכת מבוזרת. Partitions זה לא בחירה; מערכת \"CA\" פשוט מתנהגת באופן לא מוגדר כשזה קורה." },
    { en: "Using eventual consistency for something that must be unique or never negative (usernames, inventory, balances).", he: "להשתמש ב-eventual consistency למשהו שחייב להיות ייחודי או לא שלילי לעולם (usernames, מלאי, יתרות)." },
    { en: "Setting QUORUM across regions in Cassandra and wondering why every request takes 100 ms. Use LOCAL_QUORUM.", he: "להגדיר QUORUM בין regions ב-Cassandra ולתהות למה כל בקשה לוקחת 100 ms. משתמשים ב-LOCAL_QUORUM." },
    { en: "Confusing CAP's C (linearizability) with ACID's C (constraints hold). Same letter, different idea.", he: "לבלבל בין ה-C של CAP (linearizability) ל-C של ACID (אילוצים מתקיימים). אותה אות, רעיון אחר." }
  ],
  interview: [
    {
      q: { en: "Is MongoDB CP or AP?", he: "MongoDB זה CP או AP?" },
      a: {
        en: "It depends on configuration — which is the real lesson. With a single primary per replica set, majority write concern and majority/linearizable read concern, it behaves CP (the minority side can't elect a primary). With w:1 and reads from secondaries, you get AP-like behavior with possible stale reads and rollback of unreplicated writes.",
        he: "תלוי בקונפיגורציה — וזה השיעור האמיתי. עם primary יחיד לכל replica set, write concern של majority ו-read concern של majority/linearizable, הוא מתנהג CP (הצד של המיעוט לא יכול לבחור primary). עם w:1 וקריאות מ-secondaries, מקבלים התנהגות כמו AP עם קריאות ישנות אפשריות ו-rollback של כתיבות שלא שוכפלו."
      }
    },
    {
      q: { en: "N=5. Pick R and W for fast reads while staying consistent.", he: "N=5. בחרו R ו-W לקריאות מהירות תוך שמירה על consistency." },
      a: {
        en: "Need R + W > 5. For the fastest reads, R=1 and W=5 — but one node down blocks writes. A balanced choice is W=4, R=2 (tolerates 1 down for writes, 3 for reads) or the symmetric W=3, R=3 tolerating 2 down for both.",
        he: "צריך R + W > 5. לקריאות הכי מהירות, R=1 ו-W=5 — אבל node אחד שנופל חוסם כתיבות. בחירה מאוזנת היא W=4, R=2 (שורד 1 למטה בכתיבות, 3 בקריאות) או הסימטרי W=3, R=3 ששורד 2 למטה בשניהם."
      }
    }
  ],
  quiz: [
    {
      q: { en: "N=3, W=1, R=1. What do you get?", he: "N=3, W=1, R=1. מה מקבלים?" },
      options: [
        { en: "Strong consistency", he: "Strong consistency" },
        { en: "Lowest latency, but reads may be stale", he: "Latency הכי נמוך, אבל קריאות עלולות להיות ישנות" },
        { en: "Writes fail if any node is down", he: "כתיבות נכשלות אם node כלשהו למטה" },
        { en: "Split brain is impossible", he: "Split brain בלתי אפשרי" }
      ],
      answer: 1,
      explain: { en: "R+W = 2, not > 3, so read and write sets may not overlap. Fast and available, eventually consistent.", he: "R+W = 2, לא גדול מ-3, אז קבוצות הקריאה והכתיבה לא בהכרח חופפות. מהיר וזמין, eventually consistent." }
    },
    {
      q: { en: "During a network partition, etcd's minority side rejects writes. etcd is choosing...", he: "בזמן network partition, הצד של המיעוט ב-etcd דוחה כתיבות. etcd בוחר ב..." },
      options: [
        { en: "Consistency over availability (CP)", he: "Consistency על פני availability (CP)" },
        { en: "Availability over consistency (AP)", he: "Availability על פני consistency (AP)" },
        { en: "Latency over consistency (EL)", he: "Latency על פני consistency (EL)" },
        { en: "CA — no trade-off", he: "CA — בלי trade-off" }
      ],
      answer: 0,
      explain: { en: "Raft requires a majority. The minority would rather fail than risk two leaders and divergent data — exactly what you want for Kubernetes state.", he: "Raft דורש רוב. המיעוט מעדיף להיכשל מאשר להסתכן בשני leaders ו-data מתפצל — בדיוק מה שרוצים ל-state של Kubernetes." }
    },
    {
      q: { en: "What does the 'ELC' in PACELC describe?", he: "מה ה-'ELC' ב-PACELC מתאר?" },
      options: [
        { en: "Error, Leader, Commit phases", he: "שלבי Error, Leader, Commit" },
        { en: "Eventual Log Compaction", he: "Eventual Log Compaction" },
        { en: "Else (no partition): trade Latency vs Consistency", he: "Else (אין partition): trade-off בין Latency ל-Consistency" },
        { en: "Elastic Load Capacity", he: "Elastic Load Capacity" }
      ],
      answer: 2,
      explain: { en: "In normal operation, strong consistency needs coordination round trips; skipping them is faster but may return stale data.", he: "בפעולה רגילה, strong consistency דורש סבבי תיאום ברשת; לוותר עליהם מהיר יותר אבל עלול להחזיר data ישן." }
    },
    {
      q: { en: "Which feature most needs strong consistency?", he: "איזה פיצ'ר הכי צריך strong consistency?" },
      options: [
        { en: "Video view counter", he: "מונה צפיות בסרטון" },
        { en: "'People also bought' recommendations", he: "המלצות \"אנשים קנו גם\"" },
        { en: "Product description cache", he: "Cache של תיאור מוצר" },
        { en: "Claiming a unique username at signup", he: "תפיסת username ייחודי בהרשמה" }
      ],
      answer: 3,
      explain: { en: "Two users must never both get 'dana'. The others tolerate a few seconds of staleness without harm.", he: "אסור ששני משתמשים יקבלו את 'dana'. האחרים סובלים כמה שניות של חוסר עדכניות בלי נזק." }
    }
  ],
  related: ["db-replication", "db-sharding", "db-transactions", "db-sql-vs-nosql"]
});

INFRA.lessons.push({
  id: "db-backups",
  track: "data",
  order: 7,
  icon: "💾",
  level: 2,
  minutes: 11,
  title: { en: "Backups, PITR & Restores", he: "Backups, PITR ושחזורים" },
  tldr: {
    en: "Backups only exist if restores work: combine full backups with continuous WAL/binlog archiving for point-in-time recovery, keep 3-2-1 copies with one immutable, and test restores on a schedule.",
    he: "Backups קיימים רק אם השחזור עובד: משלבים full backups עם ארכוב רציף של WAL/binlog בשביל point-in-time recovery, שומרים 3-2-1 עותקים כשאחד immutable, ובודקים שחזורים לפי לוח זמנים."
  },
  analogy: {
    en: "A full backup is a photo of your apartment. The WAL is a security camera recording every change since the photo. PITR = 'take the photo, then fast-forward the tape to 14:31:59, one second before the toddler drew on the wall'. A replica is a twin apartment — great if yours burns down, useless if the toddler draws in both at once.",
    he: "Full backup הוא תמונה של הדירה. ה-WAL הוא מצלמת אבטחה שמקליטה כל שינוי מאז התמונה. PITR = \"לוקחים את התמונה ומריצים את הסרט קדימה עד 14:31:59, שנייה לפני שהפעוט צייר על הקיר\". Replica היא דירת תאומה — מעולה אם שלכם נשרפת, חסרת תועלת אם הפעוט מצייר בשתיהן באותו רגע."
  },
  sections: [
    {
      h: { en: "Full, incremental, differential, snapshots", he: "Full, incremental, differential, snapshots" },
      body: {
        en: `<ul><li><strong>Full</strong>: everything, every time. Simple restore, slow and big. 2 TB nightly = 2 TB nightly.</li><li><strong>Incremental</strong>: only what changed since the <em>last backup of any kind</em>. Smallest and fastest to take, but restore = full + every incremental in order (one broken link breaks the chain).</li><li><strong>Differential</strong>: what changed since the <em>last full</em>. Grows during the week; restore = full + latest differential only.</li></ul>
<p><strong>Logical</strong> backups (<code>pg_dump</code>, <code>mysqldump</code>) export SQL — portable across versions, great for a single table or migration, but slow to restore at TB scale (rebuilding indexes takes hours). <strong>Physical</strong> backups (<code>pg_basebackup</code>, pgBackRest, Percona XtraBackup) copy data files — fast restore, same major version only.</p>
<p><strong>Storage snapshots</strong> (EBS, Azure Disk, LVM, ZFS) are near-instant, copy-on-write, and incremental at the block level. For a DB they must be <em>crash-consistent</em> at minimum — fine for Postgres/InnoDB thanks to WAL recovery — but snapshot all volumes atomically if data and WAL live on different disks.</p>`,
        he: `<ul><li><strong>Full</strong>: הכול, כל פעם. שחזור פשוט, איטי וגדול. 2 TB כל לילה = 2 TB כל לילה.</li><li><strong>Incremental</strong>: רק מה שהשתנה מאז <em>ה-backup האחרון מכל סוג</em>. הכי קטן ומהיר לייצור, אבל שחזור = full ועוד כל ה-incrementals לפי הסדר (חוליה שבורה אחת שוברת את השרשרת).</li><li><strong>Differential</strong>: מה שהשתנה מאז <em>ה-full האחרון</em>. גדל במהלך השבוע; שחזור = full ועוד ה-differential האחרון בלבד.</li></ul>
<p>Backups <strong>לוגיים</strong> (<code>pg_dump</code>, <code>mysqldump</code>) מייצאים SQL — ניידים בין גרסאות, מעולים לטבלה בודדת או למיגרציה, אבל איטיים בשחזור ב-scale של TB (בניית indexes מחדש לוקחת שעות). Backups <strong>פיזיים</strong> (<code>pg_basebackup</code>, pgBackRest, Percona XtraBackup) מעתיקים קבצי data — שחזור מהיר, רק לאותה major version.</p>
<p><strong>Storage snapshots</strong> (EBS, Azure Disk, LVM, ZFS) כמעט מיידיים, copy-on-write ו-incremental ברמת הבלוק. ל-DB הם חייבים להיות לפחות <em>crash-consistent</em> — בסדר ל-Postgres/InnoDB בזכות WAL recovery — אבל צריך snapshot אטומי לכל ה-volumes אם ה-data וה-WAL על דיסקים שונים.</p>`
      }
    },
    {
      h: { en: "PITR: rewind to 14:31:59", he: "PITR: מחזירים ל-14:31:59" },
      body: {
        en: `<p><strong>Point-in-time recovery</strong> = base backup + continuous archive of the transaction log (Postgres WAL, MySQL binlog). To recover, restore the base backup, then replay the log up to an exact moment — just before the bad <code>DELETE</code>.</p>
<pre># Postgres (pgBackRest) - restore to just before the incident
pgbackrest --stanza=main --type=time \
  --target="2025-06-12 14:31:59+00" --target-action=promote restore

# MySQL - replay binlog up to a moment
mysqlbinlog --stop-datetime="2025-06-12 14:31:59" binlog.000412 | mysql</pre>
<p>Your <strong>RPO</strong> becomes "how often WAL is archived" (seconds to ~1 min with <code>archive_timeout = 60</code>), instead of "since last night's backup". Your <strong>RTO</strong> = time to fetch the base backup + replay all WAL since it. Replaying a week of WAL can take hours — that's why you take fulls/differentials regularly.</p>
<blockquote>💡 Real world: Managed DBs give you PITR as a checkbox — RDS keeps 1-35 days of retention and restores to any second into a <em>new</em> instance. Know that it creates a new endpoint; your runbook must cover repointing apps.</blockquote>`,
        he: `<p><strong>Point-in-time recovery</strong> = base backup ועוד ארכוב רציף של ה-transaction log (WAL ב-Postgres, binlog ב-MySQL). כדי לשחזר, משחזרים את ה-base backup ואז מריצים את ה-log עד רגע מדויק — ממש לפני ה-<code>DELETE</code> הרע.</p>
<pre># Postgres (pgBackRest) - restore to just before the incident
pgbackrest --stanza=main --type=time \
  --target="2025-06-12 14:31:59+00" --target-action=promote restore

# MySQL - replay binlog up to a moment
mysqlbinlog --stop-datetime="2025-06-12 14:31:59" binlog.000412 | mysql</pre>
<p>ה-<strong>RPO</strong> הופך ל"כל כמה זמן ה-WAL מאורכב" (שניות עד דקה עם <code>archive_timeout = 60</code>), במקום "מאז ה-backup של אתמול בלילה". ה-<strong>RTO</strong> = זמן הבאת ה-base backup ועוד הרצת כל ה-WAL מאז. הרצה של שבוע WAL יכולה לקחת שעות — לכן לוקחים fulls/differentials באופן קבוע.</p>
<blockquote>💡 מהשטח: DBs מנוהלים נותנים PITR בתור checkbox — RDS שומר retention של 1-35 ימים ומשחזר לכל שנייה לתוך instance <em>חדש</em>. שימו לב שזה יוצר endpoint חדש; ה-runbook חייב לכסות הפניה מחדש של האפליקציות.</blockquote>`
      }
    },
    {
      h: { en: "The 3-2-1 rule and immutable backups", he: "חוק 3-2-1 ו-backups שאי אפשר לשנות" },
      body: {
        en: `<p><strong>3-2-1</strong>: keep <strong>3</strong> copies of data, on <strong>2</strong> different media/storage types, with <strong>1</strong> off-site (another region or account). Modern extension: <strong>3-2-1-1-0</strong> — plus <strong>1</strong> immutable/offline copy and <strong>0</strong> errors in restore verification.</p>
<p>Why immutable? Ransomware gangs (and angry insiders, and buggy scripts) go after backups <em>first</em>. If the same admin credentials that can drop the DB can also delete the backups, you have one copy, not three. Defenses:</p>
<ul><li><strong>Object Lock / WORM</strong>: S3 Object Lock in <em>compliance mode</em>, Azure immutable blob storage, GCS bucket lock — nobody, not even root, can delete before retention expires.</li><li><strong>Separate account</strong>: copy backups to a dedicated "vault" AWS account / subscription with different credentials (AWS Backup Vault Lock).</li><li><strong>Encryption</strong> with keys you can still access if the main account is compromised.</li></ul>
<blockquote>⚠️ Production tip: Backups contain all your PII. Encrypt them, restrict access, and apply the same retention/deletion obligations (GDPR "right to be forgotten" is a real headache for long-retention backups — document your policy).</blockquote>`,
        he: `<p><strong>3-2-1</strong>: שומרים <strong>3</strong> עותקים של ה-data, על <strong>2</strong> סוגי מדיה/storage שונים, כש-<strong>1</strong> מחוץ לאתר (region או account אחר). ההרחבה המודרנית: <strong>3-2-1-1-0</strong> — ועוד עותק <strong>1</strong> immutable/offline ו-<strong>0</strong> שגיאות באימות שחזור.</p>
<p>למה immutable? כנופיות ransomware (וגם עובדים כועסים וסקריפטים עם באגים) הולכים קודם כל על ה-backups. אם אותם credentials של admin שיכולים להפיל את ה-DB יכולים גם למחוק את ה-backups, יש לכם עותק אחד, לא שלושה. הגנות:</p>
<ul><li><strong>Object Lock / WORM</strong>: S3 Object Lock ב-<em>compliance mode</em>, Azure immutable blob storage, GCS bucket lock — אף אחד, אפילו לא root, לא יכול למחוק לפני שה-retention נגמר.</li><li><strong>Account נפרד</strong>: מעתיקים backups ל-account/subscription ייעודי של "כספת" עם credentials אחרים (AWS Backup Vault Lock).</li><li><strong>הצפנה</strong> עם מפתחות שעדיין נגישים גם אם ה-account הראשי נפרץ.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: ב-backups יש את כל ה-PII שלכם. מצפינים, מגבילים גישה, ומחילים את אותן חובות retention ומחיקה (ה"זכות להישכח" של GDPR היא כאב ראש אמיתי ב-backups עם retention ארוך — תתעדו את המדיניות).</blockquote>`
      }
    },
    {
      h: { en: "A backup you never restored is a hope", he: "Backup שמעולם לא שוחזר הוא תקווה" },
      body: {
        en: `<p>Classic horror stories share a pattern: backups "ran successfully" for months but were empty, corrupt, missing a tablespace, encrypted with a lost key, or so slow to restore that the RTO was days. GitLab's 2017 incident: an engineer deleted the production DB directory; of their five backup/replication mechanisms, <em>none</em> worked cleanly, and they restored from a 6-hour-old staging snapshot copied by luck.</p>
<p>Make restores boring:</p>
<ul><li><strong>Automate restore tests</strong> — weekly job restores the latest backup to a scratch instance, runs sanity queries (row counts, latest <code>created_at</code>), records duration, then destroys it.</li><li><strong>Measure RTO for real</strong> — "restore of 2 TB took 3h40m" is a number you can put in an SLO; "we have backups" is not.</li><li><strong>Alert on missing backups and WAL archive failures</strong> (<code>pg_stat_archiver.failed_count</code>), not just on errors.</li><li><strong>Practice single-table recovery</strong> — the most common real request is "restore just the <code>invoices</code> rows a bug deleted yesterday".</li></ul>`,
        he: `<p>סיפורי האימה הקלאסיים חולקים pattern: ה-backups "רצו בהצלחה" חודשים אבל היו ריקים, פגומים, בלי tablespace, מוצפנים עם מפתח שאבד, או כל כך איטיים לשחזור שה-RTO היה ימים. האירוע של GitLab ב-2017: מהנדס מחק את תיקיית ה-DB של פרודקשן; מתוך חמישה מנגנוני backup/replication, <em>אף אחד</em> לא עבד נקי, והם שחזרו מ-snapshot של staging בן 6 שעות שהועתק במקרה.</p>
<p>הופכים שחזורים לשגרה משעממת:</p>
<ul><li><strong>טסטים אוטומטיים לשחזור</strong> — job שבועי משחזר את ה-backup האחרון ל-instance זמני, מריץ queries לבדיקת שפיות (ספירות שורות, ה-<code>created_at</code> האחרון), רושם משך, ומשמיד אותו.</li><li><strong>מודדים RTO אמיתי</strong> — "שחזור של 2 TB לקח 3:40 שעות" זה מספר שאפשר להכניס ל-SLO; "יש לנו backups" זה לא.</li><li><strong>מתריעים על backups חסרים ועל כשלים בארכוב WAL</strong> (<code>pg_stat_archiver.failed_count</code>), לא רק על שגיאות.</li><li><strong>מתרגלים שחזור של טבלה בודדת</strong> — הבקשה האמיתית הכי נפוצה היא "תשחזרו רק את שורות ה-<code>invoices</code> שבאג מחק אתמול".</li></ul>`
      }
    }
  ],
  diagram: `  Sun        Mon   Tue   Wed   Thu   Fri   Sat
  [FULL]     [i]   [i]   [i]   [i]   [i]   [i]     incremental: restore = FULL+Mon+...+day
  [FULL]     [d1]  [d2]  [d3]  [d4]  [d5]  [d6]    differential: restore = FULL + latest d

  PITR:
  [base backup 02:00] --WAL--WAL--WAL--WAL--X(14:32 DROP TABLE)
                       replay ----------> stop at 14:31:59, promote

  3-2-1-1-0:  3 copies | 2 media | 1 off-site | 1 immutable | 0 restore errors`,
  handsOn: [
    { cmd: "pg_dump -Fc -d shop -f shop.dump && pg_restore -l shop.dump | head", what: { en: "Take a compressed logical backup and list its contents.", he: "לוקחים backup לוגי דחוס ומציגים את התוכן שלו." } },
    { cmd: "pg_restore -d shop_restore -t invoices shop.dump", what: { en: "Restore a single table from a logical dump into a scratch DB — the most common real-life restore.", he: "משחזרים טבלה בודדת מ-dump לוגי ל-DB זמני — השחזור הכי נפוץ בחיים האמיתיים." } },
    { cmd: "psql -c \"SELECT archived_count, failed_count, last_archived_time, last_failed_time FROM pg_stat_archiver;\"", what: { en: "Check that WAL archiving (the backbone of PITR) is actually working.", he: "בודקים שארכוב ה-WAL (עמוד השדרה של PITR) באמת עובד." } },
    { cmd: "aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier prod --target-db-instance-identifier prod-restore --restore-time 2025-06-12T14:31:59Z", what: { en: "RDS PITR: restore to an exact second into a new instance.", he: "PITR ב-RDS: שחזור לשנייה מדויקת לתוך instance חדש." } }
  ],
  mnemonic: {
    en: "\"3-2-1-1-0: three copies, two media, one far away, one locked away, zero surprises.\" And the golden rule: \"Schrödinger's backup — it's both working and broken until you restore it.\"",
    he: "\"3-2-1-1-0: שלושה עותקים, שתי מדיות, אחד רחוק, אחד נעול, אפס הפתעות.\" וחוק הזהב: \"ה-backup של שרדינגר — הוא גם עובד וגם שבור, עד שמשחזרים אותו.\""
  },
  pitfalls: [
    { en: "Counting replicas or RAID as backups. They faithfully replicate DROP TABLE and ransomware encryption.", he: "לספור replicas או RAID כ-backups. הם משכפלים בנאמנות DROP TABLE והצפנה של ransomware." },
    { en: "Backups stored in the same account/region with the same credentials as production — one compromise or one region outage takes both.", he: "Backups באותו account/region עם אותם credentials כמו פרודקשן — פריצה אחת או נפילת region אחת לוקחת את שניהם." },
    { en: "WAL archiving silently failing for weeks (full bucket, expired credentials) — PITR window is actually zero.", he: "ארכוב WAL שנכשל בשקט שבועות (bucket מלא, credentials שפגו) — חלון ה-PITR בפועל הוא אפס." },
    { en: "Never timing a restore, then discovering during an incident that 4 TB from cold storage takes 14 hours.", he: "אף פעם לא למדוד שחזור, ואז לגלות באמצע אירוע ש-4 TB מ-cold storage לוקחים 14 שעות." }
  ],
  interview: [
    {
      q: { en: "Someone ran a bad UPDATE at 14:32 that corrupted a column in prod. Walk through recovery.", he: "מישהו הריץ UPDATE רע ב-14:32 שהשחית עמודה בפרודקשן. תעברו על השחזור." },
      a: {
        en: "Stop the bleeding (disable the job/feature). Don't overwrite prod. PITR-restore to a new instance at 14:31:59. Extract the affected column/rows from the restored copy, and carefully merge them back into prod (UPDATE ... FROM restored data), preserving legitimate writes made after 14:32. Verify, then post-mortem: why could this UPDATE run unreviewed?",
        he: "עוצרים את הדימום (מכבים את ה-job או הפיצ'ר). לא דורסים את פרודקשן. עושים PITR ל-instance חדש ל-14:31:59. מחלצים את העמודה או השורות שנפגעו מהעותק המשוחזר, וממזגים בזהירות חזרה לפרודקשן (UPDATE ... FROM מה-data המשוחזר), תוך שמירה על כתיבות לגיטימיות אחרי 14:32. מאמתים, ואז post-mortem: איך ה-UPDATE הזה רץ בלי review?"
      }
    },
    {
      q: { en: "How do you protect backups from ransomware?", he: "איך מגינים על backups מ-ransomware?" },
      a: {
        en: "Immutable storage (S3 Object Lock compliance mode / Vault Lock), copies in a separate account with separate credentials and MFA, least-privilege so prod roles can write but not delete backups, an offline/air-gapped copy for crown jewels, and regular restore tests to prove they're usable.",
        he: "Storage שלא ניתן לשינוי (S3 Object Lock ב-compliance mode / Vault Lock), עותקים ב-account נפרד עם credentials ו-MFA נפרדים, least-privilege כך שתפקידי פרודקשן יכולים לכתוב אבל לא למחוק backups, עותק offline/air-gapped ל\"יהלומי הכתר\", וטסטים קבועים לשחזור שמוכיחים שהם שמישים."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Nightly full backup at 02:00 plus continuous WAL archiving. Bad DELETE at 15:00. Best possible recovery point?", he: "Full backup כל לילה ב-02:00 ועוד ארכוב WAL רציף. DELETE רע ב-15:00. מה נקודת השחזור הכי טובה?" },
      options: [
        { en: "02:00 today", he: "02:00 היום" },
        { en: "02:00 yesterday", he: "02:00 אתמול" },
        { en: "Just before 15:00, via PITR", he: "ממש לפני 15:00, עם PITR" },
        { en: "Only the latest replica state", he: "רק המצב האחרון של ה-replica" }
      ],
      answer: 2,
      explain: { en: "Base backup + WAL replay lets you stop at any moment up to the last archived WAL — seconds before the incident.", he: "Base backup ועוד הרצת WAL מאפשרים לעצור בכל רגע עד ה-WAL האחרון שאורכב — שניות לפני האירוע." }
    },
    {
      q: { en: "Restore from a differential backup requires...", he: "שחזור מ-differential backup דורש..." },
      options: [
        { en: "The last full + every differential since", he: "ה-full האחרון ועוד כל ה-differentials מאז" },
        { en: "The last full + the latest differential only", he: "ה-full האחרון ועוד ה-differential האחרון בלבד" },
        { en: "Only the latest differential", he: "רק ה-differential האחרון" },
        { en: "Every incremental since the beginning of time", he: "כל ה-incrementals מתחילת הזמן" }
      ],
      answer: 1,
      explain: { en: "Each differential contains all changes since the last full, so only the newest is needed. Incrementals need the whole chain.", he: "כל differential מכיל את כל השינויים מאז ה-full האחרון, אז צריך רק את החדש ביותר. incrementals צריכים את כל השרשרת." }
    },
    {
      q: { en: "Which control best defends backups against an attacker with stolen prod admin credentials?", he: "איזה מנגנון הכי מגן על backups מתוקף עם credentials גנובים של admin בפרודקשן?" },
      options: [
        { en: "Taking backups more often", he: "לקחת backups יותר תכוף" },
        { en: "Storing backups on faster SSDs", he: "לשמור backups על SSD מהיר יותר" },
        { en: "Adding more read replicas", he: "להוסיף עוד read replicas" },
        { en: "Immutable (Object Lock) copies in a separate account", he: "עותקים immutable (Object Lock) ב-account נפרד" }
      ],
      answer: 3,
      explain: { en: "If the attacker's credentials can't delete or modify the copies, and retention can't be shortened, the backups survive.", he: "אם ה-credentials של התוקף לא יכולים למחוק או לשנות את העותקים, ואי אפשר לקצר את ה-retention, ה-backups שורדים." }
    }
  ],
  playground: "dr",
  related: ["rel-bcdr", "db-replication", "storage-io", "k8s-storage"]
});

INFRA.lessons.push({
  id: "db-operations",
  track: "data",
  order: 8,
  icon: "🛠️",
  level: 2,
  minutes: 12,
  title: { en: "Running Databases in Production", he: "להריץ databases בפרודקשן" },
  tldr: {
    en: "Most DB outages are self-inflicted: connection storms, locking migrations, full disks. Pool connections, migrate with expand/contract, prefer managed DBs, and watch a handful of key metrics.",
    he: "רוב ה-outages של DB הם עבודה עצמית: סערות connections, migrations שנועלים, דיסקים מלאים. עושים pooling ל-connections, migrations עם expand/contract, מעדיפים DB מנוהל, ומנטרים חופן מטריקות מפתח."
  },
  analogy: {
    en: "A database is a popular restaurant kitchen. Connections are seats: give every passer-by their own chair and the room jams (pooling = a host seating people efficiently). Migrations are renovating while serving dinner: build the new counter first, move people over, then tear down the old one — never knock out the wall mid-service.",
    he: "Database הוא מטבח של מסעדה פופולרית. Connections הם כיסאות: תנו לכל עובר אורח כיסא משלו והחדר נתקע (pooling = מארחת שמושיבה אנשים ביעילות). Migrations זה שיפוץ תוך כדי הגשת ארוחת ערב: בונים קודם את הדלפק החדש, מעבירים אנשים, ורק אז מפרקים את הישן — אף פעם לא שוברים קיר באמצע משמרת."
  },
  sections: [
    {
      h: { en: "Connection pooling and pool math", he: "Connection pooling וחשבון ה-pool" },
      body: {
        en: `<p>In Postgres every connection is a separate OS process using ~5-10 MB RAM plus per-query <code>work_mem</code>. <code>max_connections</code> defaults to 100. Now do the math: 40 Kubernetes pods × an app pool of 20 = <strong>800 connections</strong>. The DB spends its time context-switching, memory runs out, and new pods during a deploy get <code>FATAL: sorry, too many clients already</code>.</p>
<p>Fix in two layers: a modest <strong>app-side pool</strong> (HikariCP, SQLAlchemy, pgx) and a <strong>server-side pooler</strong> like <strong>PgBouncer</strong> (or RDS Proxy, pgcat, ProxySQL for MySQL) that multiplexes thousands of client connections onto a few dozen real ones. In <code>pool_mode = transaction</code>, a server connection is borrowed only for the duration of a transaction.</p>
<p>How big should the real pool be? Far smaller than you think. A good start: <strong>connections ≈ (CPU cores × 2) + effective disk spindles</strong> — e.g. ~20-30 for a 16-vCPU DB. More active connections than cores just queue inside the DB with more overhead.</p>
<blockquote>⚠️ Production tip: PgBouncer transaction mode breaks session state: <code>SET</code> variables, advisory locks, <code>LISTEN</code>, and (before PgBouncer 1.21) named prepared statements. Check your driver settings before flipping it on.</blockquote>`,
        he: `<p>ב-Postgres כל connection הוא process נפרד של מערכת ההפעלה שצורך 5-10 MB RAM ועוד <code>work_mem</code> לכל query. <code>max_connections</code> דיפולטי הוא 100. עכשיו חשבון: 40 pods ב-Kubernetes × pool באפליקציה של 20 = <strong>800 connections</strong>. ה-DB מבלה את הזמן ב-context switching, הזיכרון נגמר, ו-pods חדשים בזמן deploy מקבלים <code>FATAL: sorry, too many clients already</code>.</p>
<p>מתקנים בשתי שכבות: <strong>pool צנוע באפליקציה</strong> (HikariCP, SQLAlchemy, pgx) ו-<strong>pooler בצד השרת</strong> כמו <strong>PgBouncer</strong> (או RDS Proxy, pgcat, ProxySQL ל-MySQL) שממלטפלקס אלפי connections של לקוחות על כמה עשרות אמיתיים. ב-<code>pool_mode = transaction</code>, connection לשרת מושאל רק למשך טרנזקציה.</p>
<p>כמה גדול צריך להיות ה-pool האמיתי? הרבה יותר קטן ממה שחושבים. נקודת התחלה טובה: <strong>connections ≈ (ליבות CPU × 2) + מספר הדיסקים האפקטיבי</strong> — למשל 20-30 ל-DB עם 16 vCPU. יותר connections פעילים מליבות פשוט עומדים בתור בתוך ה-DB עם יותר overhead.</p>
<blockquote>⚠️ טיפ לפרודקשן: transaction mode של PgBouncer שובר state של session: משתני <code>SET</code>, advisory locks, <code>LISTEN</code>, ו-(לפני PgBouncer 1.21) prepared statements עם שם. בדקו את הגדרות ה-driver לפני שמדליקים.</blockquote>`
      }
    },
    {
      h: { en: "Zero-downtime migrations: expand / contract", he: "Migrations בלי downtime: expand / contract" },
      body: {
        en: `<p>During a rolling deploy, old and new app versions run <em>at the same time</em> against the same schema. So every migration must be compatible with both. Renaming <code>users.name</code> → <code>full_name</code> in one step breaks the old pods instantly. Instead:</p>
<ol><li><strong>Expand</strong>: add <code>full_name</code> (nullable). Deploy code that writes both columns.</li><li><strong>Backfill</strong>: copy old rows in small batches (e.g. 5,000 rows per transaction, with a pause) to avoid long locks and replication lag.</li><li><strong>Switch reads</strong>: deploy code reading <code>full_name</code>.</li><li><strong>Contract</strong>: stop writing <code>name</code>, then drop it in a later release.</li></ol>
<p>Lock dangers: in Postgres, even a fast <code>ALTER TABLE</code> needs an <code>ACCESS EXCLUSIVE</code> lock; if a long query holds a conflicting lock, your ALTER waits — and every query behind it queues too. Always <code>SET lock_timeout = '3s';</code> before DDL and retry. Use <code>CREATE INDEX CONCURRENTLY</code>, add constraints as <code>NOT VALID</code> then <code>VALIDATE CONSTRAINT</code> separately. For huge MySQL tables, use gh-ost or pt-online-schema-change.</p>`,
        he: `<p>בזמן rolling deploy, הגרסה הישנה והחדשה של האפליקציה רצות <em>במקביל</em> מול אותו schema. אז כל migration חייב להתאים לשתיהן. שינוי שם <code>users.name</code> → <code>full_name</code> בצעד אחד שובר את ה-pods הישנים מיד. במקום זה:</p>
<ol><li><strong>Expand</strong>: מוסיפים את <code>full_name</code> (nullable). עושים deploy לקוד שכותב לשתי העמודות.</li><li><strong>Backfill</strong>: מעתיקים שורות ישנות ב-batches קטנים (למשל 5,000 שורות לטרנזקציה, עם הפסקה) כדי להימנע מ-locks ארוכים ומ-replication lag.</li><li><strong>החלפת קריאות</strong>: deploy לקוד שקורא מ-<code>full_name</code>.</li><li><strong>Contract</strong>: מפסיקים לכתוב ל-<code>name</code>, ומוחקים אותו ב-release מאוחר יותר.</li></ol>
<p>סכנות lock: ב-Postgres, אפילו <code>ALTER TABLE</code> מהיר צריך lock מסוג <code>ACCESS EXCLUSIVE</code>; אם query ארוך מחזיק lock מתנגש, ה-ALTER מחכה — וכל query שמגיע אחריו נעמד בתור גם. תמיד <code>SET lock_timeout = '3s';</code> לפני DDL ועושים retry. משתמשים ב-<code>CREATE INDEX CONCURRENTLY</code>, מוסיפים constraints כ-<code>NOT VALID</code> ואז <code>VALIDATE CONSTRAINT</code> בנפרד. לטבלאות MySQL ענקיות, gh-ost או pt-online-schema-change.</p>`
      }
    },
    {
      h: { en: "Managed (RDS / Cloud SQL / Azure SQL) vs self-hosted", he: "מנוהל (RDS / Cloud SQL / Azure SQL) מול self-hosted" },
      body: {
        en: `<p><strong>Managed</strong> services (AWS RDS &amp; Aurora, Google Cloud SQL &amp; AlloyDB, Azure SQL Database &amp; Azure Database for PostgreSQL) handle provisioning, patching, automated backups + PITR, Multi-AZ failover, monitoring and storage autoscaling. You give up superuser access, some extensions and kernel tuning, and pay roughly 1.5-3x the raw VM cost.</p>
<p><strong>Self-hosted</strong> (on VMs or Kubernetes with operators like CloudNativePG, Zalando, Percona) gives full control and lower raw cost — but <em>you</em> own failover, backups, upgrades, security patches and the 3 AM pages. On Kubernetes, you also own storage behavior (PVs, StorageClass, volume expansion).</p>
<table>
<tr><th></th><th>Managed</th><th>Self-hosted</th></tr>
<tr><td>Time to production</td><td>Minutes</td><td>Days-weeks</td></tr>
<tr><td>Backups/PITR/failover</td><td>Built in</td><td>You build &amp; test</td></tr>
<tr><td>Control / extensions</td><td>Limited</td><td>Full</td></tr>
<tr><td>Cost at large scale</td><td>Higher</td><td>Lower (+ people cost)</td></tr>
</table>
<blockquote>💡 Real world: For most teams, the DBA-hours saved make managed the cheaper option. Self-host when you have DB expertise in-house and a concrete need (cost at very large scale, unsupported extensions, strict on-prem requirements).</blockquote>`,
        he: `<p>שירותים <strong>מנוהלים</strong> (AWS RDS ו-Aurora, Google Cloud SQL ו-AlloyDB, Azure SQL Database ו-Azure Database for PostgreSQL) מטפלים ב-provisioning, patching, backups אוטומטיים + PITR, failover של Multi-AZ, ניטור ו-autoscaling של storage. מוותרים על superuser, על חלק מה-extensions ועל כיוונון kernel, ומשלמים בערך פי 1.5-3 מעלות ה-VM הגולמית.</p>
<p><strong>Self-hosted</strong> (על VMs או על Kubernetes עם operators כמו CloudNativePG, Zalando, Percona) נותן שליטה מלאה ועלות גולמית נמוכה יותר — אבל <em>אתם</em> אחראים ל-failover, backups, שדרוגים, security patches וההתראות בשלוש לפנות בוקר. ב-Kubernetes אתם אחראים גם להתנהגות ה-storage (PVs, StorageClass, הגדלת volume).</p>
<table>
<tr><th></th><th>מנוהל</th><th>Self-hosted</th></tr>
<tr><td>זמן עד פרודקשן</td><td>דקות</td><td>ימים-שבועות</td></tr>
<tr><td>Backups/PITR/failover</td><td>מובנה</td><td>אתם בונים ובודקים</td></tr>
<tr><td>שליטה / extensions</td><td>מוגבל</td><td>מלא</td></tr>
<tr><td>עלות ב-scale גדול</td><td>גבוהה יותר</td><td>נמוכה יותר (+ עלות אנשים)</td></tr>
</table>
<blockquote>💡 מהשטח: לרוב הצוותים, שעות ה-DBA שנחסכות הופכות את המנוהל לאופציה הזולה יותר. עושים self-host כשיש מומחיות DB בבית וצורך קונקרטי (עלות ב-scale מאוד גדול, extensions לא נתמכים, דרישות on-prem קשיחות).</blockquote>`
      }
    },
    {
      h: { en: "The DB metrics that actually matter", he: "המטריקות של DB שבאמת חשובות" },
      body: {
        en: `<ul><li><strong>Query latency p50/p95/p99</strong> and <strong>throughput (QPS/TPS)</strong> — from <code>pg_stat_statements</code> or the app's DB spans.</li><li><strong>Connections</strong>: active vs idle vs max; <em>waiting clients</em> in PgBouncer (<code>cl_waiting</code>) — a leading indicator of pool exhaustion.</li><li><strong>CPU, memory, IOPS, disk throughput &amp; latency</strong> — and on cloud volumes, <em>burst credits</em> (gp2 / burstable instances fall off a cliff when credits hit 0).</li><li><strong>Disk free space</strong> — a full disk stops writes cold. Alert at 80% and on the <em>growth trend</em> (predict_linear).</li><li><strong>Cache hit ratio</strong> — Postgres buffer hits should be &gt; 99% for OLTP: <code>sum(blks_hit) / sum(blks_hit + blks_read)</code> from <code>pg_stat_database</code>.</li><li><strong>Replication lag</strong>, <strong>locks waiting / deadlocks</strong>, <strong>long-running transactions</strong>, <strong>dead tuples / bloat</strong>, and <strong>transaction ID age</strong> (wraparound protection).</li></ul>
<p>Export with postgres_exporter / mysqld_exporter to Prometheus, or use CloudWatch / Performance Insights on RDS.</p>`,
        he: `<ul><li><strong>Query latency p50/p95/p99</strong> ו-<strong>throughput (QPS/TPS)</strong> — מ-<code>pg_stat_statements</code> או מה-spans של ה-DB באפליקציה.</li><li><strong>Connections</strong>: פעילים מול idle מול max; <em>לקוחות ממתינים</em> ב-PgBouncer (<code>cl_waiting</code>) — אינדיקטור מקדים למיצוי ה-pool.</li><li><strong>CPU, זיכרון, IOPS, throughput ו-latency של דיסק</strong> — ובענן, <em>burst credits</em> (gp2 ו-instances מסוג burstable נופלים מצוק כשה-credits מגיעים ל-0).</li><li><strong>מקום פנוי בדיסק</strong> — דיסק מלא עוצר כתיבות לגמרי. מתריעים ב-80% ועל <em>מגמת הגידול</em> (predict_linear).</li><li><strong>Cache hit ratio</strong> — ב-Postgres ה-buffer hits צריכים להיות &gt; 99% ל-OLTP: <code>sum(blks_hit) / sum(blks_hit + blks_read)</code> מ-<code>pg_stat_database</code>.</li><li><strong>Replication lag</strong>, <strong>locks ממתינים / deadlocks</strong>, <strong>טרנזקציות ארוכות</strong>, <strong>dead tuples / bloat</strong>, ו-<strong>גיל ה-transaction ID</strong> (הגנה מ-wraparound).</li></ul>
<p>מייצאים עם postgres_exporter / mysqld_exporter ל-Prometheus, או משתמשים ב-CloudWatch / Performance Insights ב-RDS.</p>`
      }
    }
  ],
  diagram: `  Without pooler:                       With PgBouncer (transaction mode):
  40 pods x 20 conns = 800  --->  DB    40 pods x 20 = 800 --> [PgBouncer] --25--> DB
  (800 processes, RAM gone)            (800 cheap client conns)   (25 real backends)

  Expand / contract rename name -> full_name:
  v1: [name]            v2: [name, full_name]  write both   backfill in batches
  v3: read full_name    v4: stop writing name               v5: DROP COLUMN name`,
  handsOn: [
    { cmd: "psql -c \"SELECT state, count(*) FROM pg_stat_activity GROUP BY state;\"", what: { en: "See how many connections are active vs idle vs idle-in-transaction right now.", he: "רואים כמה connections פעילים, idle או idle in transaction כרגע." } },
    { cmd: "psql -p 6432 -U pgbouncer pgbouncer -c 'SHOW POOLS;'", what: { en: "PgBouncer admin console: watch cl_active, cl_waiting and sv_active per pool.", he: "קונסולת הניהול של PgBouncer: מסתכלים על cl_active, cl_waiting ו-sv_active לכל pool." } },
    { cmd: "psql -c \"SET lock_timeout = '3s'; ALTER TABLE users ADD COLUMN full_name text;\"", what: { en: "Safe DDL habit: fail fast instead of queueing every query behind your ALTER.", he: "הרגל DDL בטוח: נכשלים מהר במקום לתקוע כל query מאחורי ה-ALTER." } },
    { cmd: "psql -c \"SELECT datname, round(100.0*blks_hit/nullif(blks_hit+blks_read,0),2) AS hit_pct, xact_commit, deadlocks FROM pg_stat_database;\"", what: { en: "Quick health check: cache hit ratio, commits and deadlocks per database.", he: "בדיקת בריאות מהירה: cache hit ratio, commits ו-deadlocks לכל database." } }
  ],
  mnemonic: {
    en: "\"Pool it, Expand it, Contract it, Watch it.\" And for pool size: \"Cores times two, plus the disks — more than that just adds the risks.\"",
    he: "\"Pool, Expand, Contract, Watch.\" ולגודל ה-pool: \"ליבות כפול שתיים, ועוד הדיסקים — יותר מזה זה רק סיכונים.\""
  },
  pitfalls: [
    { en: "Scaling app pods without thinking about DB connections: autoscaler goes 10 → 60 pods and the DB hits max_connections exactly during the traffic spike.", he: "לעשות scale ל-pods בלי לחשוב על connections ל-DB: ה-autoscaler עולה מ-10 ל-60 pods וה-DB מגיע ל-max_connections בדיוק בזמן ה-spike." },
    { en: "Running a migration that rewrites a big table (changing a column type, adding a column with a volatile default) during business hours — table locked for 40 minutes.", he: "להריץ migration שכותב מחדש טבלה גדולה (שינוי טיפוס עמודה, הוספת עמודה עם default וולטילי) בשעות פעילות — הטבלה נעולה 40 דקות." },
    { en: "Backfilling 50M rows in one UPDATE: huge lock duration, WAL spike, replicas lagging by minutes.", he: "Backfill של 50 מיליון שורות ב-UPDATE אחד: lock ארוך, קפיצה ב-WAL, replicas עם lag של דקות." },
    { en: "Alerting on disk at 95% only — by the time anyone wakes up, the DB is read-only.", he: "להתריע על דיסק רק ב-95% — עד שמישהו מתעורר, ה-DB כבר read-only." }
  ],
  interview: [
    {
      q: { en: "Your app gets 'too many connections' during deploys. Diagnose and fix.", he: "האפליקציה מקבלת 'too many connections' בזמן deploys. תאבחנו ותתקנו." },
      a: {
        en: "During a rolling deploy, old and new pods coexist, temporarily doubling connections (pods × pool size). Fix: put PgBouncer/RDS Proxy in front, shrink per-pod pools, set maxSurge sensibly, make sure old pods close pools on SIGTERM, and size max_connections for the pooler, not for every client.",
        he: "בזמן rolling deploy, pods ישנים וחדשים חיים יחד, וזה מכפיל זמנית את ה-connections (pods × גודל pool). התיקון: PgBouncer/RDS Proxy מלפנים, הקטנת ה-pool לכל pod, maxSurge הגיוני, לוודא ש-pods ישנים סוגרים את ה-pool ב-SIGTERM, ולתכנן את max_connections ל-pooler ולא לכל לקוח."
      }
    },
    {
      q: { en: "How do you rename a column with zero downtime?", he: "איך משנים שם של עמודה בלי downtime?" },
      a: {
        en: "Expand/contract: add the new column, dual-write, backfill in batches, switch reads, stop writing the old column, drop it in a later release. Each step is backward compatible with the previous app version, so rolling deploys and rollbacks are safe.",
        he: "Expand/contract: מוסיפים עמודה חדשה, כותבים לשתיהן, backfill ב-batches, מחליפים קריאות, מפסיקים לכתוב לישנה, ומוחקים אותה ב-release מאוחר יותר. כל שלב תואם לאחור לגרסת האפליקציה הקודמת, כך ש-rolling deploys ו-rollbacks בטוחים."
      }
    },
    {
      q: { en: "Which 5 DB metrics would you put on the first dashboard?", he: "אילו 5 מטריקות DB הייתם שמים ב-dashboard הראשון?" },
      a: {
        en: "Query latency p99 (plus top queries by total time), connections used vs max (and pooler wait queue), CPU/IOPS saturation, free disk with growth trend, and replication lag. Close runners-up: lock waits/deadlocks and oldest transaction age.",
        he: "Query latency p99 (ועוד ה-queries המובילים לפי זמן כולל), connections בשימוש מול max (ותור ההמתנה ב-pooler), רוויה של CPU/IOPS, מקום פנוי בדיסק עם מגמת גידול, ו-replication lag. מקומות קרובים: המתנות ל-locks / deadlocks וגיל הטרנזקציה הכי ישנה."
      }
    }
  ],
  quiz: [
    {
      q: { en: "50 pods, each with a pool of 20, against Postgres with max_connections=200. What happens at full load?", he: "50 pods, לכל אחד pool של 20, מול Postgres עם max_connections=200. מה קורה בעומס מלא?" },
      options: [
        { en: "Postgres queues the extra 800 connections automatically", he: "Postgres שם אוטומטית בתור את 800 ה-connections העודפים" },
        { en: "Connections beyond 200 are refused with 'too many clients'", he: "Connections מעבר ל-200 נדחים עם 'too many clients'" },
        { en: "Postgres raises max_connections dynamically", he: "Postgres מעלה את max_connections באופן דינמי" },
        { en: "Nothing — idle connections don't count", he: "כלום — connections idle לא נספרים" }
      ],
      answer: 1,
      explain: { en: "1,000 potential connections vs a hard limit of 200 (idle ones count too). A pooler like PgBouncer is the standard fix.", he: "1,000 connections אפשריים מול גבול קשיח של 200 (גם idle נספרים). Pooler כמו PgBouncer הוא הפתרון הסטנדרטי." }
    },
    {
      q: { en: "First step of an expand/contract migration to rename a column?", he: "מה הצעד הראשון ב-migration של expand/contract לשינוי שם עמודה?" },
      options: [
        { en: "ALTER TABLE ... RENAME COLUMN", he: "ALTER TABLE ... RENAME COLUMN" },
        { en: "Drop the old column", he: "למחוק את העמודה הישנה" },
        { en: "Add the new column and dual-write to both", he: "להוסיף עמודה חדשה ולכתוב לשתיהן" },
        { en: "Take the site down for maintenance", he: "להוריד את האתר ל-maintenance" }
      ],
      answer: 2,
      explain: { en: "Expand first so old and new code both work. RENAME in one step breaks old pods still running during the rollout.", he: "קודם expand, כך שגם הקוד הישן וגם החדש עובדים. RENAME בצעד אחד שובר pods ישנים שעדיין רצים בזמן ה-rollout." }
    },
    {
      q: { en: "An ALTER TABLE is waiting for a lock behind a 20-minute report query, and now all app queries on that table are stuck. Best prevention?", he: "ALTER TABLE מחכה ל-lock מאחורי query של דוח שרץ 20 דקות, ועכשיו כל ה-queries של האפליקציה על הטבלה תקועים. מה המניעה הכי טובה?" },
      options: [
        { en: "SET lock_timeout before DDL so it fails fast and retries", he: "SET lock_timeout לפני DDL כך שהוא ייכשל מהר ויעשה retry" },
        { en: "Increase max_connections", he: "להגדיל את max_connections" },
        { en: "Use Read Uncommitted isolation", he: "להשתמש ב-isolation של Read Uncommitted" },
        { en: "Add an index on the table first", he: "להוסיף קודם index לטבלה" }
      ],
      answer: 0,
      explain: { en: "The waiting ACCESS EXCLUSIVE request blocks everyone queued behind it. lock_timeout makes the ALTER give up quickly instead of causing an outage.", he: "בקשת ה-ACCESS EXCLUSIVE הממתינה חוסמת את כל מי שבתור אחריה. lock_timeout גורם ל-ALTER לוותר מהר במקום לגרום ל-outage." }
    },
    {
      q: { en: "Which is the strongest reason to pick a managed DB like RDS over self-hosting?", he: "מה הסיבה החזקה ביותר לבחור DB מנוהל כמו RDS על פני self-hosting?" },
      options: [
        { en: "It's always cheaper per vCPU", he: "הוא תמיד זול יותר לכל vCPU" },
        { en: "It gives you superuser and any extension", he: "הוא נותן superuser וכל extension" },
        { en: "It never has downtime", he: "אין לו אף פעם downtime" },
        { en: "Backups, PITR, patching and failover come built in and tested", he: "Backups, PITR, patching ו-failover מגיעים מובנים ובדוקים" }
      ],
      answer: 3,
      explain: { en: "Managed DBs cost more per vCPU and restrict superuser, and they still have maintenance windows and failovers. What you buy is the operational toil.", he: "DBs מנוהלים עולים יותר לכל vCPU ומגבילים superuser, ועדיין יש להם חלונות תחזוקה ו-failovers. מה שקונים זה את העבודה התפעולית." }
    }
  ],
  related: ["db-indexes", "db-transactions", "obs-metrics", "k8s-storage", "storage-io"]
});

// ---------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------
[
  ["ACID", "Atomicity, Consistency, Isolation, Durability — the guarantees of a database transaction.", "Atomicity, Consistency, Isolation, Durability — ההבטחות של טרנזקציה ב-database.", "db-transactions"],
  ["OLTP vs OLAP", "OLTP = many small transactional reads/writes (orders, logins); OLAP = big analytical scans and aggregations (warehouses).", "OLTP = הרבה קריאות/כתיבות טרנזקציוניות קטנות (הזמנות, התחברויות); OLAP = סריקות ואגרגציות אנליטיות גדולות (warehouses).", "db-sql-vs-nosql"],
  ["Wide-column store", "A NoSQL model (Cassandra, Bigtable) storing rows by partition key across many nodes, optimized for massive writes and query-first modeling.", "מודל NoSQL (Cassandra, Bigtable) ששומר שורות לפי partition key על הרבה nodes, מותאם לכתיבות מסיביות ולמידול לפי query.", "db-sql-vs-nosql"],
  ["Time-series database", "A DB optimized for timestamped, append-mostly data with compression, downsampling and retention (Prometheus TSDB, InfluxDB).", "DB שמותאם ל-data עם timestamp שרובו append, עם דחיסה, downsampling ו-retention (Prometheus TSDB, InfluxDB).", "db-sql-vs-nosql"],
  ["B-tree index", "A balanced, sorted tree of keys pointing to rows; turns lookups and range scans into ~log(n) page reads.", "עץ מאוזן וממוין של keys שמצביעים לשורות; הופך חיפושים ו-range scans לבערך log(n) קריאות דף.", "db-indexes"],
  ["Composite index", "An index on several columns; usable only for a leftmost prefix of its columns (equality first, range last).", "Index על כמה עמודות; שמיש רק ל-prefix שמאלי של העמודות (שוויון קודם, טווח בסוף).", "db-indexes"],
  ["Covering index", "An index containing every column a query needs, enabling an index-only scan without touching the table.", "Index שמכיל את כל העמודות שה-query צריך, ומאפשר index-only scan בלי לגעת בטבלה.", "db-indexes"],
  ["EXPLAIN ANALYZE", "Runs a query and shows the actual execution plan, row counts and timings — the first tool for slow queries.", "מריץ query ומציג את ה-execution plan בפועל, ספירות שורות וזמנים — הכלי הראשון ל-queries איטיים.", "db-indexes"],
  ["N+1 query", "Loading a list with 1 query then each item's relation with N more queries; fixed by batching or eager loading.", "טעינת רשימה ב-query אחד ואז של הקשר של כל פריט ב-N queries נוספים; פותרים עם batching או eager loading.", "db-indexes"],
  ["Isolation level", "How much concurrent transactions see of each other: Read Uncommitted, Read Committed, Repeatable Read, Serializable.", "כמה טרנזקציות במקביל רואות אחת את השנייה: Read Uncommitted, Read Committed, Repeatable Read, Serializable.", "db-transactions"],
  ["Deadlock", "Two transactions each waiting for a lock the other holds; the DB detects the cycle and aborts one.", "שתי טרנזקציות שכל אחת מחכה ל-lock שהשנייה מחזיקה; ה-DB מזהה את המעגל ועושה abort לאחת.", "db-transactions"],
  ["MVCC", "Multi-Version Concurrency Control: writes create new row versions so readers use snapshots and don't block writers; old versions need vacuum.", "Multi-Version Concurrency Control: כתיבות יוצרות גרסאות חדשות של שורות כך שקוראים משתמשים ב-snapshots ולא חוסמים כותבים; גרסאות ישנות צריכות vacuum.", "db-transactions"],
  ["WAL", "Write-Ahead Log: every change is logged durably before data files change; used for crash recovery, replication and PITR (MySQL: binlog/redo log).", "Write-Ahead Log: כל שינוי נרשם באופן עמיד לפני שקבצי ה-data משתנים; משמש ל-crash recovery, replication ו-PITR (ב-MySQL: binlog/redo log).", "db-replication"],
  ["Read replica", "A copy of the primary that applies its log and serves read-only queries; usually asynchronous.", "עותק של ה-primary שמריץ את ה-log שלו ומשרת queries לקריאה בלבד; בדרך כלל אסינכרוני.", "db-replication"],
  ["Replication lag", "How far a replica is behind the primary, in time or bytes; causes stale reads.", "כמה replica מפגר אחרי ה-primary, בזמן או בבייטים; גורם לקריאות ישנות.", "db-replication"],
  ["Failover", "Promoting a replica to primary when the primary fails, then repointing clients.", "Promote של replica ל-primary כשה-primary נופל, ואז הפניית הלקוחות מחדש.", "db-replication"],
  ["Split brain", "Two nodes both believing they are primary and accepting writes, causing divergent data; prevented by quorum and fencing.", "שני nodes שחושבים ששניהם primary ומקבלים כתיבות, מה שגורם ל-data מתפצל; מונעים עם quorum ו-fencing.", "db-replication"],
  ["Sharding", "Splitting a dataset across multiple database servers by a shard key to scale writes and storage.", "פיצול dataset על פני כמה שרתי DB לפי shard key כדי לעשות scale לכתיבות ול-storage.", "db-sharding"],
  ["Shard key", "The attribute that decides which shard owns a row; needs high cardinality, even spread and query locality.", "התכונה שקובעת איזה shard מחזיק שורה; צריך cardinality גבוה, פיזור אחיד ו-locality של queries.", "db-sharding"],
  ["Hot shard", "A shard receiving disproportionate traffic or data because of a skewed key, bottlenecking the cluster.", "Shard שמקבל traffic או data באופן לא פרופורציונלי בגלל key מוטה, והופך לצוואר בקבוק של ה-cluster.", "db-sharding"],
  ["Consistent hashing", "Mapping keys and nodes onto a hash ring so adding/removing a node moves only ~1/N of keys.", "מיפוי keys ו-nodes על טבעת hash כך שהוספה/הסרה של node מזיזה רק בערך 1/N מה-keys.", "db-sharding"],
  ["CAP theorem", "During a network partition, a distributed system must choose consistency or availability.", "בזמן network partition, מערכת מבוזרת חייבת לבחור בין consistency ל-availability.", "db-cap"],
  ["PACELC", "Extends CAP: if Partition, choose A or C; Else, choose Latency or Consistency.", "הרחבה של CAP: אם יש Partition, בוחרים A או C; אחרת (Else), בוחרים Latency או Consistency.", "db-cap"],
  ["Eventual consistency", "Replicas converge to the same value if writes stop, but reads may be stale meanwhile.", "Replicas מתכנסים לאותו ערך אם הכתיבות נעצרות, אבל בינתיים קריאות עלולות להיות ישנות.", "db-cap"],
  ["Quorum (R + W > N)", "With N replicas, reading R and writing W where R + W > N guarantees reads overlap the latest write.", "עם N replicas, קריאה מ-R וכתיבה ל-W כש-R + W > N מבטיחות שקריאות חופפות לכתיבה האחרונה.", "db-cap"],
  ["PITR", "Point-in-time recovery: restore a base backup and replay the WAL/binlog up to an exact moment.", "Point-in-time recovery: משחזרים base backup ומריצים את ה-WAL/binlog עד רגע מדויק.", "db-backups"],
  ["3-2-1 rule", "3 copies of data, on 2 media types, 1 off-site; modern form 3-2-1-1-0 adds one immutable copy and zero restore errors.", "3 עותקים של data, על 2 סוגי מדיה, 1 מחוץ לאתר; הגרסה המודרנית 3-2-1-1-0 מוסיפה עותק immutable אחד ואפס שגיאות שחזור.", "db-backups"],
  ["Immutable backup", "A backup that cannot be modified or deleted until retention expires (S3 Object Lock, WORM), protecting against ransomware.", "Backup שאי אפשר לשנות או למחוק עד שה-retention נגמר (S3 Object Lock, WORM), ומגן מפני ransomware.", "db-backups"],
  ["PgBouncer", "A lightweight Postgres connection pooler that multiplexes many client connections onto few server connections.", "Connection pooler קליל ל-Postgres שממלטפלקס הרבה connections של לקוחות על מעט connections לשרת.", "db-operations"],
  ["Expand/contract migration", "Zero-downtime schema change: add new structure, dual-write, backfill, switch reads, then remove the old structure.", "שינוי schema בלי downtime: מוסיפים מבנה חדש, כותבים לשניהם, backfill, מחליפים קריאות, ואז מסירים את הישן.", "db-operations"]
].forEach(([term, en, he, lesson]) => INFRA.glossary.push({ term, track: "data", def: { en, he }, lesson }));
