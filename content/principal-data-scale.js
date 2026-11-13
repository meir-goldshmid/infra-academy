window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Principal Engineer Playbook — data & scale: DB landscape, kinds of scaling, CAP/PACELC, clusters */

INFRA.lessons.push({
  id: "pr-db-landscape",
  track: "principal",
  order: 10,
  icon: "🗃️",
  level: 3,
  minutes: 18,
  title: { en: "The Database Landscape: Every Kind of DB and When to Use It", he: "מפת מסדי הנתונים: כל סוג DB ומתי להשתמש בו" },
  tldr: {
    en: "Pick a database by its access pattern, not by hype: relational by default, then add a specialist (KV, document, wide-column, search, time-series, graph, vector, columnar) only when a concrete query shape demands it.",
    he: "בוחרים database לפי דפוס הגישה, לא לפי ההייפ: relational כברירת מחדל, ומוסיפים מומחה (KV, document, wide-column, search, time-series, graph, vector, columnar) רק כשצורת query קונקרטית דורשת את זה."
  },
  analogy: {
    en: "Databases are the tools in a workshop. Postgres is the Swiss-army knife — it does 80% of jobs well. Redis is a sticky-note wall: instant to read, but small and you'd better have a backup. Cassandra is a warehouse of numbered shelves: you can put away millions of boxes per second, but only if you know the shelf number. Elasticsearch is the library catalog: find any book by any word in it. ClickHouse is the accountant's spreadsheet: sum a billion rows in a second, but don't use it to update one cell. Neo4j is the family tree. A vector DB is 'find me songs that feel like this one'. A principal doesn't ask 'which DB is best?' — they ask 'what will I ask this data, how often, and how wrong may the answer be?'",
    he: "מסדי נתונים הם הכלים בסדנה. Postgres הוא האולר השוויצרי — עושה 80% מהעבודות טוב. Redis הוא קיר של פתקים דביקים: קריאה מיידית, אבל קטן — וכדאי שיהיה גיבוי. Cassandra הוא מחסן עם מדפים ממוספרים: אפשר לאחסן מיליוני קופסאות בשנייה, אבל רק אם יודעים את מספר המדף. Elasticsearch הוא קטלוג הספרייה: מוצאים כל ספר לפי כל מילה שבתוכו. ClickHouse הוא האקסל של רואה החשבון: סוכם מיליארד שורות בשנייה, אבל לא משתמשים בו כדי לעדכן תא אחד. Neo4j הוא עץ המשפחה. Vector DB זה 'תמצא לי שירים שמרגישים כמו השיר הזה'. Principal לא שואל 'איזה DB הכי טוב?' — הוא שואל 'מה אשאל את הדאטה הזה, כמה פעמים, וכמה מותר לתשובה לטעות?'"
  },
  sections: [
    {
      h: { en: "The map: 13 families at a glance", he: "המפה: 13 משפחות במבט אחד" },
      body: {
        en: `<table>
<tr><th>Family</th><th>Examples</th><th>Data model</th><th>Sweet spot</th><th>Don't use it for</th></tr>
<tr><td>Relational (OLTP)</td><td>Postgres, MySQL, SQL Server</td><td>Tables, rows, joins, constraints</td><td>Business data with invariants: orders, users, billing</td><td>10 TB of append-only telemetry; full-text search</td></tr>
<tr><td>Distributed SQL / NewSQL</td><td>Spanner, CockroachDB, YugabyteDB, TiDB</td><td>SQL tables auto-sharded + Raft/Paxos replicated</td><td>Global ACID, writes beyond one node, multi-region</td><td>Small apps (latency + cost tax); heavy analytics</td></tr>
<tr><td>Key-value</td><td>Redis, DynamoDB, Memcached, etcd</td><td>key → blob</td><td>Sessions, caches, counters, carts, feature flags, locks</td><td>Ad-hoc queries ("all users in Haifa")</td></tr>
<tr><td>Document</td><td>MongoDB, Couchbase, Firestore, Cosmos DB</td><td>JSON documents, nested</td><td>Aggregates read/written as a whole: product catalog, CMS, user profile</td><td>Many-to-many relations, cross-document transactions everywhere</td></tr>
<tr><td>Wide-column</td><td>Cassandra, ScyllaDB, Bigtable, HBase</td><td>partition key → sorted rows of columns</td><td>Massive write throughput, known access by key: messages, IoT, timelines</td><td>Unknown query patterns, joins, strong cross-row transactions</td></tr>
<tr><td>Graph</td><td>Neo4j, Neptune, Memgraph</td><td>Nodes + edges with properties</td><td>Multi-hop traversals: fraud rings, recommendations, IAM permission graphs</td><td>Simple CRUD; bulk aggregations</td></tr>
<tr><td>Time-series</td><td>Prometheus, TimescaleDB, InfluxDB, VictoriaMetrics</td><td>(series, timestamp) → value</td><td>Metrics, sensor data, downsampling, retention</td><td>High-cardinality per-user data (labels explode)</td></tr>
<tr><td>Search</td><td>Elasticsearch, OpenSearch, Solr, Meilisearch</td><td>Inverted index of documents</td><td>Full-text, fuzzy, facets, log search</td><td>Source of truth; transactional updates</td></tr>
<tr><td>Vector</td><td>pgvector, Pinecone, Milvus, Weaviate, Qdrant</td><td>Embedding vectors + ANN index (HNSW/IVF)</td><td>Semantic search, RAG, "similar items"</td><td>Exact lookups; anything a WHERE clause does</td></tr>
<tr><td>OLAP / columnar</td><td>ClickHouse, BigQuery, Snowflake, Redshift, DuckDB</td><td>Columns stored separately, compressed</td><td>Aggregations over billions of rows, dashboards, BI</td><td>Point updates, high-QPS single-row reads</td></tr>
<tr><td>Object store / lake</td><td>S3, GCS, Azure Blob + Parquet/Iceberg/Delta</td><td>Immutable files + table format</td><td>Cheap infinite storage, data lake, backups, ML datasets</td><td>Low-latency random reads/updates</td></tr>
<tr><td>Ledger / immutable</td><td>QLDB (retired), Postgres append-only + hash chain, TigerBeetle</td><td>Append-only, verifiable history</td><td>Money movements, audit trails</td><td>Mutable state that changes often</td></tr>
<tr><td>Embedded</td><td>SQLite, RocksDB, LevelDB, DuckDB</td><td>A library inside your process</td><td>Mobile/edge, local caches, storage engines inside other DBs</td><td>Many writers across machines</td></tr>
</table>
<blockquote>💡 Real world: Most successful companies run on "Postgres + Redis + S3 + a search index + a warehouse" for years. Discord moved messages Cassandra → ScyllaDB only at trillions of messages; Uber, Shopify and GitHub stayed on MySQL far longer than the internet thought possible.</blockquote>`,
        he: `<table>
<tr><th>משפחה</th><th>דוגמאות</th><th>מודל נתונים</th><th>איפה זה מצטיין</th><th>לא להשתמש בשביל</th></tr>
<tr><td>Relational (OLTP)</td><td>Postgres, MySQL, SQL Server</td><td>טבלאות, שורות, joins, constraints</td><td>דאטה עסקי עם invariants: הזמנות, משתמשים, חיובים</td><td>10 TB של טלמטריה append-only; full-text search</td></tr>
<tr><td>Distributed SQL / NewSQL</td><td>Spanner, CockroachDB, YugabyteDB, TiDB</td><td>טבלאות SQL עם sharding אוטומטי + שכפול Raft/Paxos</td><td>ACID גלובלי, כתיבות מעבר לשרת אחד, multi-region</td><td>אפליקציות קטנות (מס latency ועלות); אנליטיקה כבדה</td></tr>
<tr><td>Key-value</td><td>Redis, DynamoDB, Memcached, etcd</td><td>key → blob</td><td>Sessions, caches, מונים, עגלות, feature flags, locks</td><td>queries אד-הוק ("כל המשתמשים בחיפה")</td></tr>
<tr><td>Document</td><td>MongoDB, Couchbase, Firestore, Cosmos DB</td><td>מסמכי JSON מקוננים</td><td>Aggregates שנקראים ונכתבים כיחידה: קטלוג מוצרים, CMS, פרופיל משתמש</td><td>יחסי many-to-many, טרנזקציות בין מסמכים בכל מקום</td></tr>
<tr><td>Wide-column</td><td>Cassandra, ScyllaDB, Bigtable, HBase</td><td>partition key → שורות ממוינות של עמודות</td><td>throughput כתיבה עצום, גישה ידועה לפי key: הודעות, IoT, timelines</td><td>דפוסי query לא ידועים, joins, טרנזקציות חזקות בין שורות</td></tr>
<tr><td>Graph</td><td>Neo4j, Neptune, Memgraph</td><td>Nodes + edges עם properties</td><td>מעברים בכמה קפיצות: טבעות הונאה, המלצות, גרף הרשאות IAM</td><td>CRUD פשוט; אגרגציות המוניות</td></tr>
<tr><td>Time-series</td><td>Prometheus, TimescaleDB, InfluxDB, VictoriaMetrics</td><td>(series, timestamp) → value</td><td>Metrics, חיישנים, downsampling, retention</td><td>דאטה per-user עם cardinality גבוה (ה-labels מתפוצצים)</td></tr>
<tr><td>Search</td><td>Elasticsearch, OpenSearch, Solr, Meilisearch</td><td>Inverted index של מסמכים</td><td>Full-text, חיפוש fuzzy, facets, חיפוש בלוגים</td><td>מקור אמת; עדכונים טרנזקציוניים</td></tr>
<tr><td>Vector</td><td>pgvector, Pinecone, Milvus, Weaviate, Qdrant</td><td>וקטורי embedding + אינדקס ANN (HNSW/IVF)</td><td>חיפוש סמנטי, RAG, "פריטים דומים"</td><td>lookups מדויקים; כל מה ש-WHERE עושה</td></tr>
<tr><td>OLAP / columnar</td><td>ClickHouse, BigQuery, Snowflake, Redshift, DuckDB</td><td>כל עמודה נשמרת בנפרד ודחוסה</td><td>אגרגציות על מיליארדי שורות, דשבורדים, BI</td><td>עדכוני שורה בודדת, קריאות נקודתיות ב-QPS גבוה</td></tr>
<tr><td>Object store / lake</td><td>S3, GCS, Azure Blob + Parquet/Iceberg/Delta</td><td>קבצים immutable + table format</td><td>אחסון זול ואינסופי, data lake, גיבויים, datasets ל-ML</td><td>קריאות/עדכונים אקראיים ב-latency נמוך</td></tr>
<tr><td>Ledger / immutable</td><td>QLDB (הופסק), Postgres append-only + hash chain, TigerBeetle</td><td>Append-only, היסטוריה ניתנת לאימות</td><td>תנועות כסף, audit trails</td><td>מצב שמשתנה כל הזמן</td></tr>
<tr><td>Embedded</td><td>SQLite, RocksDB, LevelDB, DuckDB</td><td>ספרייה בתוך ה-process</td><td>מובייל/edge, caches מקומיים, storage engines בתוך DBs אחרים</td><td>הרבה כותבים ממכונות שונות</td></tr>
</table>
<blockquote>💡 מהשטח: רוב החברות המצליחות רצות שנים על "Postgres + Redis + S3 + search index + warehouse". Discord העבירו הודעות מ-Cassandra ל-ScyllaDB רק בטריליוני הודעות; Uber, Shopify ו-GitHub נשארו על MySQL הרבה יותר זמן ממה שהאינטרנט חשב שאפשר.</blockquote>`
      }
    },
    {
      h: { en: "Same question, five databases (example queries)", he: "אותה שאלה, חמישה מסדי נתונים (queries לדוגמה)" },
      body: {
        en: `<p>The fastest way to feel the difference is to see each one's "native" query. Notice how each model makes one kind of question trivial and others painful.</p>
<pre>-- Relational (Postgres): invariants + joins
SELECT o.id, SUM(i.qty * i.price_cents) FROM orders o
JOIN order_items i ON i.order_id = o.id
WHERE o.customer_id = 42 GROUP BY o.id;

# Key-value (Redis): O(1) by key, nothing else
SET session:9f2c '{"user":42}' EX 1800
INCR ratelimit:42:2026-11-13T10:05

// Document (MongoDB): the aggregate in one read
db.products.find({ "category": "mugs", "price": { $lt: 50 } })

-- Wide-column (Cassandra CQL): design the table FOR the query
CREATE TABLE messages_by_channel (
  channel_id bigint, bucket int, message_id timeuuid, author bigint, body text,
  PRIMARY KEY ((channel_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
SELECT * FROM messages_by_channel WHERE channel_id=7 AND bucket=202611 LIMIT 50;

// Graph (Cypher): friends-of-friends who bought X
MATCH (me:User {id:42})-[:FRIEND]-&gt;()-[:FRIEND]-&gt;(f)-[:BOUGHT]-&gt;(p:Product {sku:'MUG-1'})
RETURN DISTINCT f LIMIT 20;

-- Time-series (PromQL): p99 latency per service, last 5 minutes
histogram_quantile(0.99, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))

-- Vector (pgvector): 5 nearest documents by cosine distance
SELECT id, title FROM docs ORDER BY embedding &lt;=&gt; '[0.12, -0.03, ...]' LIMIT 5;

-- Columnar (ClickHouse): scan 2B rows, read only 2 columns
SELECT toStartOfHour(ts) h, count() FROM events WHERE ts &gt; now() - INTERVAL 1 DAY GROUP BY h;</pre>
<blockquote>⚠️ Production tip: In Cassandra/DynamoDB you model <em>queries first</em> and duplicate data per query (one table per access pattern). In relational you model <em>entities first</em> and let the planner answer any query. Mixing the mindsets is the #1 cause of NoSQL regret.</blockquote>`,
        he: `<p>הדרך הכי מהירה להרגיש את ההבדל היא לראות את ה-query ה"טבעי" של כל אחד. שימו לב איך כל מודל הופך סוג שאלה אחד לטריוויאלי ואחרים לכואבים.</p>
<pre>-- Relational (Postgres): invariants + joins
SELECT o.id, SUM(i.qty * i.price_cents) FROM orders o
JOIN order_items i ON i.order_id = o.id
WHERE o.customer_id = 42 GROUP BY o.id;

# Key-value (Redis): O(1) by key, nothing else
SET session:9f2c '{"user":42}' EX 1800
INCR ratelimit:42:2026-11-13T10:05

// Document (MongoDB): the aggregate in one read
db.products.find({ "category": "mugs", "price": { $lt: 50 } })

-- Wide-column (Cassandra CQL): design the table FOR the query
CREATE TABLE messages_by_channel (
  channel_id bigint, bucket int, message_id timeuuid, author bigint, body text,
  PRIMARY KEY ((channel_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
SELECT * FROM messages_by_channel WHERE channel_id=7 AND bucket=202611 LIMIT 50;

// Graph (Cypher): friends-of-friends who bought X
MATCH (me:User {id:42})-[:FRIEND]-&gt;()-[:FRIEND]-&gt;(f)-[:BOUGHT]-&gt;(p:Product {sku:'MUG-1'})
RETURN DISTINCT f LIMIT 20;

-- Time-series (PromQL): p99 latency per service, last 5 minutes
histogram_quantile(0.99, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))

-- Vector (pgvector): 5 nearest documents by cosine distance
SELECT id, title FROM docs ORDER BY embedding &lt;=&gt; '[0.12, -0.03, ...]' LIMIT 5;

-- Columnar (ClickHouse): scan 2B rows, read only 2 columns
SELECT toStartOfHour(ts) h, count() FROM events WHERE ts &gt; now() - INTERVAL 1 DAY GROUP BY h;</pre>
<blockquote>⚠️ טיפ לפרודקשן: ב-Cassandra/DynamoDB ממדלים <em>קודם את ה-queries</em> ומשכפלים דאטה לכל query (טבלה לכל access pattern). ב-relational ממדלים <em>קודם ישויות</em> ונותנים ל-planner לענות על כל query. ערבוב בין שתי הגישות הוא הסיבה מספר 1 לחרטה על NoSQL.</blockquote>`
      }
    },
    {
      h: { en: "Under the hood: row vs column, B-tree vs LSM", he: "מתחת למכסה: שורה מול עמודה, B-tree מול LSM" },
      body: {
        en: `<p><strong>Row storage</strong> (Postgres, MySQL): a row's fields sit together on a page. Perfect for "give me order 81 with all its fields" and for updating one row. Terrible for "average price of 2 billion rows" — you read every column of every row from disk.</p>
<p><strong>Column storage</strong> (ClickHouse, BigQuery, Parquet): each column is a separate, heavily compressed file (similar values next to each other compress 5–20×). The average-price query reads one column only, with SIMD vectorized execution. But updating a single row means touching many files — so columnar systems batch inserts and treat updates as rare, heavy operations.</p>
<p><strong>B-tree</strong> (Postgres, MySQL InnoDB, SQL Server): a balanced tree of pages, updated in place. Reads are predictable (3–4 page hops for a billion rows). Random writes cause random I/O and page splits. <em>Read-optimized.</em></p>
<p><strong>LSM tree</strong> (Cassandra, ScyllaDB, RocksDB, HBase, InfluxDB): writes go to an in-memory memtable + commit log, flushed as immutable sorted files (SSTables), merged later by <em>compaction</em>. Writes are sequential and blazing fast; reads may check several files (bloom filters help); compaction costs CPU and disk in the background. <em>Write-optimized.</em></p>
<pre>B-tree write:  find page -&gt; modify in place -&gt; WAL      (random I/O)
LSM write:     append WAL -&gt; memtable -&gt; flush SSTable   (sequential I/O)
LSM read:      memtable -&gt; bloom filter -&gt; SSTable L0..Ln
Amplification: B-tree pays on writes, LSM pays on reads + compaction (space amp ~1.1-2x)</pre>
<blockquote>💡 Real world: When a Cassandra cluster "suddenly" gets slow on reads, check pending compactions and tombstones first (<code>nodetool compactionstats</code>, <code>nodetool tablestats</code>). Deletes in LSM are writes (tombstones) — a queue-like table with heavy deletes is a classic Cassandra anti-pattern.</blockquote>`,
        he: `<p><strong>Row storage</strong> (Postgres, MySQL): השדות של שורה יושבים יחד על page. מושלם ל"תן לי את הזמנה 81 עם כל השדות" ולעדכון שורה אחת. נוראי ל"מחיר ממוצע של 2 מיליארד שורות" — קוראים מהדיסק כל עמודה של כל שורה.</p>
<p><strong>Column storage</strong> (ClickHouse, BigQuery, Parquet): כל עמודה היא קובץ נפרד ודחוס מאוד (ערכים דומים אחד ליד השני נדחסים פי 5–20). ה-query של מחיר ממוצע קורא רק עמודה אחת, עם הרצה וקטורית ב-SIMD. אבל עדכון של שורה בודדת נוגע בהרבה קבצים — לכן מערכות columnar עושות batch ל-inserts ומתייחסות לעדכונים כפעולה נדירה וכבדה.</p>
<p><strong>B-tree</strong> (Postgres, MySQL InnoDB, SQL Server): עץ מאוזן של pages שמתעדכן במקום. קריאות צפויות (3–4 קפיצות page למיליארד שורות). כתיבות אקראיות גורמות ל-I/O אקראי ו-page splits. <em>מותאם לקריאה.</em></p>
<p><strong>LSM tree</strong> (Cassandra, ScyllaDB, RocksDB, HBase, InfluxDB): כתיבות הולכות ל-memtable בזיכרון + commit log, נשפכות לקבצים ממוינים immutable (SSTables), ומתמזגות אחר כך ב-<em>compaction</em>. כתיבות סדרתיות ומהירות מאוד; קריאה עשויה לבדוק כמה קבצים (bloom filters עוזרים); compaction עולה CPU ודיסק ברקע. <em>מותאם לכתיבה.</em></p>
<pre>B-tree write:  find page -&gt; modify in place -&gt; WAL      (random I/O)
LSM write:     append WAL -&gt; memtable -&gt; flush SSTable   (sequential I/O)
LSM read:      memtable -&gt; bloom filter -&gt; SSTable L0..Ln
Amplification: B-tree pays on writes, LSM pays on reads + compaction (space amp ~1.1-2x)</pre>
<blockquote>💡 מהשטח: כשקלאסטר Cassandra נהיה "פתאום" איטי בקריאות, בודקים קודם compactions ממתינים ו-tombstones (<code>nodetool compactionstats</code>, <code>nodetool tablestats</code>). מחיקות ב-LSM הן כתיבות (tombstones) — טבלה שמתנהגת כמו תור עם הרבה מחיקות היא anti-pattern קלאסי ב-Cassandra.</blockquote>`
      }
    },
    {
      h: { en: "Decision flow: which DB for which job", he: "תרשים החלטה: איזה DB לאיזו עבודה" },
      body: {
        en: `<p>Walk the questions top-down. The first "yes" is usually your answer; "no" all the way down means <strong>Postgres</strong>.</p>
<ol>
<li><strong>Is it money or an invariant that must never break</strong> (balance ≥ 0, unique seat)? → relational with transactions (or distributed SQL if one primary can't take the writes).</li>
<li><strong>Is it a cache, session, counter or lock with TTL?</strong> → Redis / Memcached (and accept it can vanish).</li>
<li><strong>Do you need full-text, fuzzy, facets?</strong> → a search index, fed from the source of truth via CDC.</li>
<li><strong>Is it metrics/time-stamped measurements with retention and downsampling?</strong> → time-series DB.</li>
<li><strong>Is it analytics over 100M+ rows</strong> (dashboards, "group by day")? → columnar warehouse (ClickHouse/BigQuery/Snowflake), never your OLTP primary.</li>
<li><strong>Is it &gt;50k writes/s with a known key access pattern</strong> (chat, IoT, feeds)? → wide-column or DynamoDB.</li>
<li><strong>Do queries traverse 3+ hops of relationships?</strong> → graph DB (or recursive CTEs if it's occasional).</li>
<li><strong>"Find similar meaning"?</strong> → vector index; start with pgvector until ~10–50M vectors.</li>
<li><strong>Large files, logs archives, ML datasets?</strong> → object storage + Parquet/Iceberg.</li>
</ol>
<p><strong>Polyglot persistence</strong> = each job gets the right store, with one <em>source of truth</em> and derived copies:</p>
<pre>             writes
 API ───────────────▶ Postgres (source of truth)
                         │ WAL / CDC (Debezium)
                         ▼
                       Kafka ──▶ Elasticsearch (search)
                         │   ──▶ ClickHouse (analytics)
                         │   ──▶ Redis (hot read cache)
                         └──▶ S3/Iceberg (lake, ML)</pre>
<blockquote>⚠️ Production tip: Every extra database is another thing to back up, patch, secure, monitor, upgrade and be on-call for. A principal's default answer is "can Postgres do it well enough for the next 2 years?" — extensions like pgvector, TimescaleDB, PostGIS, pg_partman and full-text search often say yes.</blockquote>`,
        he: `<p>עוברים על השאלות מלמעלה למטה. ה"כן" הראשון הוא בדרך כלל התשובה; "לא" עד הסוף אומר <strong>Postgres</strong>.</p>
<ol>
<li><strong>זה כסף או invariant שאסור שיישבר</strong> (יתרה ≥ 0, מושב ייחודי)? → relational עם טרנזקציות (או distributed SQL אם primary אחד לא עומד בכתיבות).</li>
<li><strong>זה cache, session, מונה או lock עם TTL?</strong> → Redis / Memcached (ולקבל שזה יכול להיעלם).</li>
<li><strong>צריך full-text, fuzzy, facets?</strong> → search index, שמוזן ממקור האמת דרך CDC.</li>
<li><strong>זה metrics/מדידות עם timestamp, retention ו-downsampling?</strong> → time-series DB.</li>
<li><strong>זה אנליטיקה על 100M+ שורות</strong> (דשבורדים, "group by day")? → warehouse עמודתי (ClickHouse/BigQuery/Snowflake), אף פעם לא ה-primary של ה-OLTP.</li>
<li><strong>יותר מ-50k כתיבות בשנייה עם access pattern ידוע לפי key</strong> (צ'אט, IoT, feeds)? → wide-column או DynamoDB.</li>
<li><strong>ה-queries עוברים 3+ קפיצות של יחסים?</strong> → graph DB (או recursive CTEs אם זה מדי פעם).</li>
<li><strong>"תמצא משמעות דומה"?</strong> → vector index; מתחילים עם pgvector עד ~10–50M וקטורים.</li>
<li><strong>קבצים גדולים, ארכיוני לוגים, datasets ל-ML?</strong> → object storage + Parquet/Iceberg.</li>
</ol>
<p><strong>Polyglot persistence</strong> = כל עבודה מקבלת את ה-store הנכון, עם <em>מקור אמת</em> אחד ועותקים נגזרים:</p>
<pre>             writes
 API ───────────────▶ Postgres (source of truth)
                         │ WAL / CDC (Debezium)
                         ▼
                       Kafka ──▶ Elasticsearch (search)
                         │   ──▶ ClickHouse (analytics)
                         │   ──▶ Redis (hot read cache)
                         └──▶ S3/Iceberg (lake, ML)</pre>
<blockquote>⚠️ טיפ לפרודקשן: כל database נוסף הוא עוד דבר לגבות, לעדכן, לאבטח, לנטר, לשדרג ולהיות עליו on-call. תשובת ברירת המחדל של Principal היא "האם Postgres יכול לעשות את זה מספיק טוב לשנתיים הקרובות?" — extensions כמו pgvector, TimescaleDB, PostGIS, pg_partman ו-full-text search אומרים הרבה פעמים כן.</blockquote>`
      }
    },
    {
      h: { en: "Managed vs self-hosted, and the questions to ask any DB", he: "Managed מול self-hosted, והשאלות לשאול כל DB" },
      body: {
        en: `<p>Before you commit to any database, interrogate it like a job candidate:</p>
<ul>
<li><strong>Consistency</strong>: what does a read right after a write return? Per-key or cross-key transactions? (see pr-cap-pacelc)</li>
<li><strong>Scaling unit</strong>: how do I add write capacity? Is resharding online? What's the biggest single partition/document/row?</li>
<li><strong>Failure</strong>: what happens when a node dies — automatic failover in how many seconds, with how much data loss (RPO)?</li>
<li><strong>Operations</strong>: backups + point-in-time restore, major version upgrades without downtime, schema migrations on a 1 TB table.</li>
<li><strong>Cost model</strong>: per node, per GB, per request (DynamoDB RCU/WCU, BigQuery $/TB scanned)? A bad query on BigQuery can cost real money.</li>
<li><strong>Ecosystem</strong>: drivers, CDC support, observability, people who know it (hiring!).</li>
<li><strong>Exit</strong>: how hard is it to leave? Proprietary APIs (DynamoDB, Firestore, Cosmos) vs wire-compatible (Postgres-compatible Aurora/AlloyDB/Neon).</li>
</ul>
<blockquote>💡 Real world: Managed (RDS/Aurora, Cloud SQL, Atlas, Elastic Cloud) costs 20–60% more per vCPU than self-hosting on VMs, but a single DBA salary buys a lot of managed instances. Self-host only when scale makes the premium large or when you need control the provider won't give you.</blockquote>`,
        he: `<p>לפני שמתחייבים ל-database כלשהו, מתחקרים אותו כמו מועמד לעבודה:</p>
<ul>
<li><strong>Consistency</strong>: מה מחזירה קריאה מיד אחרי כתיבה? טרנזקציות per-key או בין keys? (ראו pr-cap-pacelc)</li>
<li><strong>יחידת הסקייל</strong>: איך מוסיפים יכולת כתיבה? האם resharding קורה online? מה ה-partition/מסמך/שורה הכי גדולים?</li>
<li><strong>כשל</strong>: מה קורה כש-node מת — failover אוטומטי תוך כמה שניות, עם כמה איבוד דאטה (RPO)?</li>
<li><strong>תפעול</strong>: גיבויים + point-in-time restore, שדרוג major בלי downtime, schema migrations על טבלה של 1 TB.</li>
<li><strong>מודל עלות</strong>: לפי node, לפי GB, לפי בקשה (DynamoDB RCU/WCU, BigQuery $/TB scanned)? query רע ב-BigQuery יכול לעלות כסף אמיתי.</li>
<li><strong>אקוסיסטם</strong>: drivers, תמיכה ב-CDC, observability, אנשים שמכירים אותו (גיוס!).</li>
<li><strong>יציאה</strong>: כמה קשה לעזוב? APIs קנייניים (DynamoDB, Firestore, Cosmos) מול תאימות wire (Aurora/AlloyDB/Neon תואמי Postgres).</li>
</ul>
<blockquote>💡 מהשטח: Managed (RDS/Aurora, Cloud SQL, Atlas, Elastic Cloud) עולה 20–60% יותר ל-vCPU מאשר self-hosting על VMs, אבל משכורת של DBA אחד קונה הרבה instances מנוהלים. עושים self-host רק כשהסקייל הופך את הפרמיה לגדולה, או כשצריך שליטה שהספק לא נותן.</blockquote>`
      }
    }
  ],
  diagram: `                 Which database?
                       │
   money/invariants? ──┼── yes ─▶ Postgres/MySQL (one primary) ─▶ too many writes? ─▶ Spanner/CockroachDB
                       │
   cache/session/TTL? ─┼── yes ─▶ Redis / Memcached
   full-text search?  ─┼── yes ─▶ Elasticsearch/OpenSearch  (fed by CDC)
   metrics over time? ─┼── yes ─▶ Prometheus / TimescaleDB
   analytics 100M+?   ─┼── yes ─▶ ClickHouse / BigQuery / Snowflake
   huge writes by key?─┼── yes ─▶ Cassandra / ScyllaDB / DynamoDB
   multi-hop graph?   ─┼── yes ─▶ Neo4j
   semantic similarity?┼── yes ─▶ pgvector -> Milvus/Pinecone
   files / lake?      ─┼── yes ─▶ S3 + Parquet/Iceberg
                       └── none ─▶ Postgres`,
  handsOn: [
    { cmd: "docker run -d --name pg -e POSTGRES_PASSWORD=pw -p 5432:5432 pgvector/pgvector:pg16 && docker exec -it pg psql -U postgres -c \"CREATE EXTENSION vector;\"", what: { en: "Spin up Postgres with pgvector — one DB that covers relational, JSONB documents and vector search.", he: "מרימים Postgres עם pgvector — DB אחד שמכסה relational, מסמכי JSONB וחיפוש וקטורי." } },
    { cmd: "docker run -d --name ch -p 8123:8123 clickhouse/clickhouse-server && curl 'http://localhost:8123/?query=SELECT+sum(number)+FROM+numbers(1000000000)'", what: { en: "Feel columnar speed: ClickHouse sums a billion generated numbers in about a second.", he: "מרגישים מהירות עמודתית: ClickHouse סוכם מיליארד מספרים בערך בשנייה." } },
    { cmd: "docker run -d --name redis -p 6379:6379 redis:7 && docker exec -it redis redis-cli SET k v EX 10", what: { en: "Key-value with TTL: the key disappears after 10 seconds (check with TTL k).", he: "Key-value עם TTL: ה-key נעלם אחרי 10 שניות (בודקים עם TTL k)." } },
    { cmd: "psql -U postgres -c \"EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM pg_class WHERE relname = 'pg_type';\"", what: { en: "See how a row-store answers a point query: index scan, a few buffers.", he: "רואים איך row-store עונה על query נקודתי: index scan, מעט buffers." } }
  ],
  mnemonic: {
    en: "\"Postgres until it hurts, then the specialist that removes that exact pain.\" — and every specialist is fed FROM the source of truth, never the other way around.",
    he: "\"Postgres עד שזה כואב, ואז המומחה שמוריד בדיוק את הכאב הזה.\" — וכל מומחה ניזון ממקור האמת, אף פעם לא להפך."
  },
  pitfalls: [
    { en: "Choosing MongoDB/Cassandra 'for scale' at 100 req/s and then rebuilding joins and transactions in application code.", he: "לבחור MongoDB/Cassandra 'בשביל סקייל' ב-100 בקשות לשנייה, ואז לבנות מחדש joins וטרנזקציות בקוד האפליקציה." },
    { en: "Using Elasticsearch or Redis as the source of truth — both can lose acknowledged writes in some failure modes; keep the truth in a durable DB and rebuild derived stores.", he: "להשתמש ב-Elasticsearch או Redis כמקור אמת — שניהם יכולים לאבד כתיבות שאושרו בחלק מתרחישי הכשל; שומרים את האמת ב-DB עמיד ובונים מחדש את ה-stores הנגזרים." },
    { en: "Running analytics dashboards directly on the OLTP primary — one 'SELECT ... GROUP BY' over 500M rows and checkout latency spikes.", he: "להריץ דשבורדים אנליטיים ישירות על ה-primary של ה-OLTP — 'SELECT ... GROUP BY' אחד על 500M שורות וה-latency של ה-checkout קופץ." },
    { en: "High-cardinality labels (user_id, request_id) in a time-series DB — Prometheus memory explodes because every label combination is a new series.", he: "Labels עם cardinality גבוה (user_id, request_id) ב-time-series DB — הזיכרון של Prometheus מתפוצץ כי כל צירוף labels הוא series חדש." }
  ],
  interview: [
    {
      q: { en: "Design storage for a chat app with 1B messages/day. Which databases and why?", he: "תכנן אחסון לאפליקציית צ'אט עם מיליארד הודעות ביום. אילו מסדי נתונים ולמה?" },
      a: { en: "~12k writes/s average, ~50k peak, append-mostly, read by (channel, time desc). That's a wide-column shape: Cassandra/ScyllaDB with partition key (channel_id, time bucket) and clustering by message id desc, so one channel's history is a sequential slice and partitions stay bounded. Users, memberships and billing stay in Postgres (relational invariants). Message search goes to Elasticsearch fed by CDC/Kafka. Attachments in S3 with a CDN. Analytics in ClickHouse/BigQuery. Redis for presence and unread counters.", he: "בערך 12k כתיבות לשנייה בממוצע, ~50k בשיא, בעיקר append, נקרא לפי (channel, זמן יורד). זו צורה של wide-column: Cassandra/ScyllaDB עם partition key של (channel_id, time bucket) ו-clustering לפי message id יורד, כך שההיסטוריה של ערוץ היא פרוסה רציפה וה-partitions נשארים חסומים בגודלם. משתמשים, חברויות בערוצים וחיובים נשארים ב-Postgres (invariants רלציוניים). חיפוש בהודעות הולך ל-Elasticsearch שמוזן מ-CDC/Kafka. קבצים מצורפים ב-S3 עם CDN. אנליטיקה ב-ClickHouse/BigQuery. Redis ל-presence ומוני הודעות שלא נקראו." }
    },
    {
      q: { en: "When is an LSM-tree store a better choice than a B-tree store?", he: "מתי store מבוסס LSM-tree עדיף על store מבוסס B-tree?" },
      a: { en: "When the workload is write-heavy and mostly inserts (logs, metrics, messages, events): LSM turns random writes into sequential appends and compresses well. You pay with read amplification (multiple SSTables, mitigated by bloom filters) and background compaction CPU/IO, plus tombstone pain for deletes. Read-heavy, update-in-place, latency-predictable workloads favor B-trees.", he: "כשה-workload כבד בכתיבות ובעיקר inserts (לוגים, metrics, הודעות, events): LSM הופך כתיבות אקראיות ל-appends סדרתיים ונדחס טוב. משלמים ב-read amplification (כמה SSTables, מתמתן ע\"י bloom filters) וב-CPU/IO של compaction ברקע, ובכאב של tombstones במחיקות. workloads כבדי קריאה, עם עדכון במקום ו-latency צפוי, מעדיפים B-trees." }
    }
  ],
  quiz: [
    {
      q: { en: "Product wants 'search products by any word, with typos and filters by brand/price'. The source of truth is Postgres. Best addition?", he: "המוצר רוצה 'חיפוש מוצרים לפי כל מילה, עם שגיאות כתיב ופילטרים לפי מותג/מחיר'. מקור האמת הוא Postgres. מה הכי נכון להוסיף?" },
      options: [
        { en: "Move the catalog to Cassandra", he: "להעביר את הקטלוג ל-Cassandra" },
        { en: "Elasticsearch/OpenSearch index fed from Postgres via CDC", he: "אינדקס Elasticsearch/OpenSearch שמוזן מ-Postgres דרך CDC" },
        { en: "A Redis hash per product", he: "Redis hash לכל מוצר" },
        { en: "ClickHouse with LIKE '%word%'", he: "ClickHouse עם LIKE '%word%'" }
      ],
      answer: 1,
      explain: { en: "Full-text, fuzzy matching and facets are exactly what an inverted index is for; keep Postgres as truth and stream changes into the search index.", he: "Full-text, התאמה fuzzy ו-facets הם בדיוק מה ש-inverted index נועד לו; Postgres נשאר האמת ומזרימים שינויים לאינדקס החיפוש." }
    },
    {
      q: { en: "Why does a columnar warehouse answer 'SUM(price) over 2B rows' so much faster than Postgres?", he: "למה warehouse עמודתי עונה על 'SUM(price) על 2B שורות' הרבה יותר מהר מ-Postgres?" },
      options: [
        { en: "It caches every query result forever", he: "הוא שומר כל תוצאה ב-cache לנצח" },
        { en: "It reads only the price column, compressed, with vectorized execution", he: "הוא קורא רק את עמודת המחיר, דחוסה, עם הרצה וקטורית" },
        { en: "It skips transactions", he: "הוא מדלג על טרנזקציות" },
        { en: "It uses B-trees instead of heaps", he: "הוא משתמש ב-B-trees במקום heaps" }
      ],
      answer: 1,
      explain: { en: "Column layout means the query touches a tiny fraction of the bytes, compressed 5-20x, processed in SIMD batches.", he: "פריסה עמודתית אומרת שה-query נוגע בחלק זעיר מהבייטים, דחוסים פי 5-20, ומעובדים ב-batches של SIMD." }
    },
    {
      q: { en: "Which workload is the classic anti-pattern for Cassandra?", he: "איזה workload הוא ה-anti-pattern הקלאסי ל-Cassandra?" },
      options: [
        { en: "Time-ordered messages per channel", he: "הודעות ממוינות בזמן לכל ערוץ" },
        { en: "IoT sensor writes by device id", he: "כתיבות חיישני IoT לפי device id" },
        { en: "A work queue with constant inserts and deletes", he: "תור עבודה עם inserts ומחיקות כל הזמן" },
        { en: "User activity timeline", he: "Timeline של פעילות משתמש" }
      ],
      answer: 2,
      explain: { en: "Deletes create tombstones; a queue table accumulates them and reads must scan past thousands of tombstones until compaction — latency explodes.", he: "מחיקות יוצרות tombstones; טבלת תור צוברת אותם וקריאות צריכות לסרוק אלפי tombstones עד ה-compaction — ה-latency מתפוצץ." }
    },
    {
      q: { en: "You need semantic search over 2M documents and already run Postgres. Pragmatic first step?", he: "צריך חיפוש סמנטי על 2M מסמכים וכבר יש Postgres. מה הצעד הראשון הפרגמטי?" },
      options: [
        { en: "Buy a dedicated vector DB cluster", he: "לקנות קלאסטר vector DB ייעודי" },
        { en: "pgvector with an HNSW index", he: "pgvector עם אינדקס HNSW" },
        { en: "Store embeddings in Redis strings and scan them", he: "לשמור embeddings כ-strings ב-Redis ולסרוק" },
        { en: "Neo4j", he: "Neo4j" }
      ],
      answer: 1,
      explain: { en: "At a few million vectors pgvector + HNSW is fast enough, transactional with your data, and adds no new system to operate.", he: "בכמה מיליוני וקטורים pgvector + HNSW מספיק מהיר, טרנזקציוני יחד עם הדאטה שלכם, ולא מוסיף מערכת חדשה לתפעל." }
    }
  ],
  related: ["db-sql-vs-nosql", "db-indexes", "db-sharding", "redis-deep", "staff-postgres-at-scale", "pr-cap-pacelc", "pr-scaling-kinds"]
});

INFRA.lessons.push({
  id: "pr-scaling-kinds",
  track: "principal",
  order: 11,
  icon: "📈",
  level: 3,
  minutes: 18,
  title: { en: "Every Kind of Scaling — and the Order to Apply Them", he: "כל סוגי הסקיילינג — ובאיזה סדר להפעיל אותם" },
  tldr: {
    en: "Scaling is a ladder, not a switch: make the app tier stateless, cache, add read replicas, go async, split by function, and only then partition the data — and know which axis (X clone, Y split, Z partition) each step climbs.",
    he: "סקיילינג הוא סולם, לא מתג: הופכים את שכבת האפליקציה ל-stateless, מוסיפים cache, read replicas, עוברים ל-async, מפצלים לפי פונקציה, ורק אז מחלקים את הדאטה — ויודעים על איזה ציר (X שכפול, Y פיצול, Z חלוקה) כל שלב מטפס."
  },
  analogy: {
    en: "A falafel stand gets popular. Vertical scaling: buy a bigger fryer (works until there is no bigger fryer). Horizontal X-axis: open three identical stands side by side, and a host at the entrance sends each customer to a free one (load balancer). Y-axis: split the work — one counter for falafel, one for drinks, one for payment (microservices). Z-axis: customers with names A–M go to stand 1, N–Z to stand 2 (sharding). Caching: pre-made pitas on the shelf for the most common order. Queue: the ticket machine — at lunch rush you take a number instead of crowding the counter. Cells: whole independent branches in different neighborhoods, so a fire in one doesn't close the chain.",
    he: "דוכן פלאפל נהיה פופולרי. סקיילינג אנכי: קונים מטגנת גדולה יותר (עובד עד שאין מטגנת גדולה יותר). אופקי בציר X: פותחים שלושה דוכנים זהים זה לצד זה, ומארח בכניסה שולח כל לקוח לדוכן פנוי (load balancer). ציר Y: מפצלים את העבודה — דלפק לפלאפל, דלפק לשתייה, דלפק לתשלום (microservices). ציר Z: לקוחות עם שמות א'–כ' לדוכן 1, ל'–ת' לדוכן 2 (sharding). Caching: פיתות מוכנות על המדף להזמנה הכי נפוצה. תור: מכונת המספרים — בעומס של הצהריים לוקחים מספר במקום להצטופף ליד הדלפק. Cells: סניפים עצמאיים לגמרי בשכונות שונות, כך ששריפה באחד לא סוגרת את הרשת."
  },
  sections: [
    {
      h: { en: "Vertical vs horizontal, and the scale cube", he: "אנכי מול אופקי, וקוביית הסקייל" },
      body: {
        en: `<p><strong>Vertical (scale up)</strong>: a bigger machine. Zero code change, keeps strong consistency, and today goes very far — a single large cloud instance has hundreds of vCPUs and multiple TB of RAM; a tuned Postgres on 64 vCPU handles tens of thousands of TPS. Limits: a hard ceiling, price grows super-linearly, and it's still one failure domain (resize = restart).</p>
<p><strong>Horizontal (scale out)</strong>: more machines. Near-unlimited and adds redundancy, but needs statelessness, load balancing, and distributed-systems thinking for anything stateful.</p>
<p>The <strong>AKF scale cube</strong> names the three horizontal axes:</p>
<table>
<tr><th>Axis</th><th>What you do</th><th>Example</th><th>Solves</th><th>Costs</th></tr>
<tr><td><strong>X</strong> — clone</td><td>N identical copies behind an LB</td><td>20 API pods behind an ALB; read replicas</td><td>Throughput of stateless work, HA</td><td>Doesn't help write-heavy data or a huge dataset</td></tr>
<tr><td><strong>Y</strong> — functional split</td><td>Split by verb/noun into services</td><td>checkout, search, catalog as separate services + DBs</td><td>Team scaling, isolate hot features, different tech per job</td><td>Network calls, distributed transactions, ops overhead</td></tr>
<tr><td><strong>Z</strong> — data partition</td><td>Same code, each copy owns a slice of the data</td><td>Shard by tenant_id; per-country deployments</td><td>Dataset and write throughput beyond one node, blast radius</td><td>Cross-shard queries, rebalancing, hot keys</td></tr>
</table>
<blockquote>💡 Real world: Stack Overflow served billions of page views per month for years on a handful of very large SQL Server machines — vertical scaling plus heavy caching. "Scale up first, scale out when you must" is a legitimate principal answer when backed by numbers.</blockquote>`,
        he: `<p><strong>אנכי (scale up)</strong>: מכונה גדולה יותר. אפס שינוי קוד, שומר על consistency חזק, והיום מגיע רחוק מאוד — instance גדול בענן מגיע למאות vCPUs וכמה TB של RAM; Postgres מכוונן על 64 vCPU מטפל בעשרות אלפי TPS. מגבלות: תקרה קשיחה, המחיר עולה יותר מליניארית, וזה עדיין failure domain אחד (שינוי גודל = restart).</p>
<p><strong>אופקי (scale out)</strong>: יותר מכונות. כמעט בלי גבול ומוסיף יתירות, אבל דורש statelessness, load balancing וחשיבה של מערכות מבוזרות לכל דבר עם state.</p>
<p>ה-<strong>AKF scale cube</strong> נותנת שמות לשלושת הצירים האופקיים:</p>
<table>
<tr><th>ציר</th><th>מה עושים</th><th>דוגמה</th><th>פותר</th><th>עולה</th></tr>
<tr><td><strong>X</strong> — שכפול</td><td>N עותקים זהים מאחורי LB</td><td>20 API pods מאחורי ALB; read replicas</td><td>Throughput לעבודה stateless, HA</td><td>לא עוזר לדאטה כבד-כתיבות או ל-dataset ענק</td></tr>
<tr><td><strong>Y</strong> — פיצול פונקציונלי</td><td>מפצלים לפי פעולה/ישות לשירותים</td><td>checkout, search, catalog כשירותים נפרדים + DBs</td><td>סקייל של צוותים, בידוד פיצ'רים חמים, טכנולוגיה שונה לכל עבודה</td><td>קריאות רשת, טרנזקציות מבוזרות, תקורת תפעול</td></tr>
<tr><td><strong>Z</strong> — חלוקת דאטה</td><td>אותו קוד, כל עותק אחראי על פרוסה של הדאטה</td><td>Shard לפי tenant_id; deployment לכל מדינה</td><td>Dataset ו-throughput כתיבה מעבר ל-node אחד, blast radius</td><td>Queries בין shards, rebalancing, hot keys</td></tr>
</table>
<blockquote>💡 מהשטח: Stack Overflow הגישו מיליארדי צפיות בחודש במשך שנים על קומץ מכונות SQL Server גדולות מאוד — סקיילינג אנכי פלוס caching כבד. "קודם scale up, ו-scale out כשחייבים" היא תשובה לגיטימית של Principal, כשהיא מגובה במספרים.</blockquote>`
      }
    },
    {
      h: { en: "The toolbox: stateless tier, caches, replicas, pools, queues", he: "ארגז הכלים: שכבה stateless, caches, replicas, pools, תורים" },
      body: {
        en: `<ul>
<li><strong>Stateless app tier</strong>: no session in memory, no local files. Sessions → Redis or signed JWT cookies; uploads → S3. Now any pod can serve any request, and autoscaling and rolling deploys just work.</li>
<li><strong>Caching layers</strong> (closest to the user wins): browser cache (<code>Cache-Control: max-age=60</code>) → CDN edge (static + cacheable API GETs) → app cache (Redis, in-process LRU) → DB buffer pool. A 95% cache hit ratio cuts DB read load 20×.</li>
<li><strong>Read replicas</strong>: async copies of the primary for reads. Typical lag 10–500 ms → route "read-your-own-writes" paths to the primary for a few seconds after a write.</li>
<li><strong>Connection pooling</strong>: Postgres forks a process per connection (~5–10 MB each); 500 pods × 20 connections = 10,000 connections = dead DB. PgBouncer in transaction mode multiplexes them onto ~100 server connections.</li>
<li><strong>Async + queues</strong>: anything the user doesn't need to wait for (emails, thumbnails, webhooks, reports) goes to a queue. The queue absorbs peaks; workers drain at a steady rate. You size for the <em>average</em>, not the peak.</li>
<li><strong>Precompute</strong>: materialized views, fan-out-on-write feeds, nightly rollups — trade storage and freshness for read speed.</li>
</ul>
<pre># pgbouncer.ini — 10,000 client connections, 100 real ones
[databases]
app = host=10.0.1.5 port=5432 dbname=app
[pgbouncer]
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 100</pre>
<blockquote>⚠️ Production tip: Scaling writes and scaling reads are different problems. Reads: cache + replicas (cheap, almost unlimited). Writes: batch, queue, reduce write amplification (fewer indexes), then partition (expensive, hard to undo). Always ask "is this read-bound or write-bound?" before choosing.</blockquote>`,
        he: `<ul>
<li><strong>שכבת אפליקציה stateless</strong>: בלי session בזיכרון, בלי קבצים מקומיים. Sessions → Redis או JWT cookies חתומים; העלאות → S3. עכשיו כל pod יכול לשרת כל בקשה, ו-autoscaling ו-rolling deploys פשוט עובדים.</li>
<li><strong>שכבות cache</strong> (הקרוב ביותר למשתמש מנצח): cache בדפדפן (<code>Cache-Control: max-age=60</code>) → CDN edge (סטטי + GETs ב-API שאפשר לשמור) → cache באפליקציה (Redis, LRU בזיכרון) → buffer pool של ה-DB. Hit ratio של 95% מוריד את עומס הקריאות על ה-DB פי 20.</li>
<li><strong>Read replicas</strong>: עותקים אסינכרוניים של ה-primary לקריאות. lag טיפוסי 10–500 ms → מנתבים מסלולי "read-your-own-writes" ל-primary לכמה שניות אחרי כתיבה.</li>
<li><strong>Connection pooling</strong>: Postgres מרים process לכל connection (~5–10 MB כל אחד); 500 pods × 20 connections = 10,000 connections = DB מת. PgBouncer ב-transaction mode מרכז אותם ל-~100 connections אמיתיים.</li>
<li><strong>Async + תורים</strong>: כל מה שהמשתמש לא צריך לחכות לו (מיילים, thumbnails, webhooks, דוחות) הולך לתור. התור סופג שיאים; ה-workers מרוקנים בקצב קבוע. מתכננים לממוצע, לא לשיא.</li>
<li><strong>חישוב מראש</strong>: materialized views, feeds עם fan-out-on-write, rollups לילי — מחליפים אחסון ורעננות במהירות קריאה.</li>
</ul>
<pre># pgbouncer.ini — 10,000 client connections, 100 real ones
[databases]
app = host=10.0.1.5 port=5432 dbname=app
[pgbouncer]
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 100</pre>
<blockquote>⚠️ טיפ לפרודקשן: סקיילינג של כתיבות וסקיילינג של קריאות הן בעיות שונות. קריאות: cache + replicas (זול, כמעט בלי גבול). כתיבות: batch, תור, הקטנת write amplification (פחות אינדקסים), ואז partitioning (יקר וקשה להחזיר אחורה). תמיד שואלים "זה read-bound או write-bound?" לפני שבוחרים.</blockquote>`
      }
    },
    {
      h: { en: "Sharding strategies (Z-axis) compared", he: "השוואת אסטרטגיות sharding (ציר Z)" },
      body: {
        en: `<table>
<tr><th>Strategy</th><th>How</th><th>Good</th><th>Bad</th><th>Seen in</th></tr>
<tr><td>Range</td><td>user_id 1–1M → shard A, 1M–2M → B</td><td>Range scans, easy to split</td><td>Hot spots (time-ordered keys all hit the last shard)</td><td>HBase, Bigtable, CockroachDB ranges</td></tr>
<tr><td>Hash</td><td>shard = hash(key) mod N (or consistent hashing)</td><td>Even spread</td><td>Range queries scatter; resharding moves data (consistent hashing moves ~1/N)</td><td>Cassandra, DynamoDB, Redis Cluster</td></tr>
<tr><td>Directory / lookup</td><td>A table maps tenant → shard</td><td>Move one big tenant anywhere; flexible</td><td>The lookup is on the critical path — must be cached and HA</td><td>Many SaaS products</td></tr>
<tr><td>Geo</td><td>EU users → EU shard</td><td>Latency, data residency (GDPR)</td><td>Users who travel or move; uneven regions</td><td>Global SaaS, banks</td></tr>
</table>
<p>Choosing the <strong>shard key</strong> is the decision you'll live with for years. Good keys: high cardinality, evenly distributed, present in almost every query (so queries hit one shard), and aligned with transaction boundaries (a tenant's data together). <code>tenant_id</code> is the classic SaaS choice; watch for "whale" tenants that need their own shard.</p>
<blockquote>💡 Real world: Notion sharded Postgres into 480 logical shards on 32 physical hosts (by workspace_id). Many more logical shards than physical hosts lets you rebalance by moving whole logical shards instead of re-hashing rows.</blockquote>`,
        he: `<table>
<tr><th>אסטרטגיה</th><th>איך</th><th>טוב</th><th>רע</th><th>איפה רואים</th></tr>
<tr><td>Range</td><td>user_id 1–1M → shard A, 1M–2M → B</td><td>Range scans, קל לפצל</td><td>Hot spots (keys לפי זמן נוחתים כולם על ה-shard האחרון)</td><td>HBase, Bigtable, ranges ב-CockroachDB</td></tr>
<tr><td>Hash</td><td>shard = hash(key) mod N (או consistent hashing)</td><td>פיזור אחיד</td><td>Range queries מתפזרים; resharding מזיז דאטה (consistent hashing מזיז ~1/N)</td><td>Cassandra, DynamoDB, Redis Cluster</td></tr>
<tr><td>Directory / lookup</td><td>טבלה שממפה tenant → shard</td><td>אפשר להזיז tenant גדול לכל מקום; גמיש</td><td>ה-lookup ב-critical path — חייב cache ו-HA</td><td>הרבה מוצרי SaaS</td></tr>
<tr><td>Geo</td><td>משתמשי EU → shard ב-EU</td><td>Latency, data residency (GDPR)</td><td>משתמשים שנוסעים או עוברים; אזורים לא מאוזנים</td><td>SaaS גלובלי, בנקים</td></tr>
</table>
<p>בחירת ה-<strong>shard key</strong> היא ההחלטה שתחיו איתה שנים. keys טובים: cardinality גבוה, פיזור אחיד, מופיעים כמעט בכל query (כך ש-queries פוגעים ב-shard אחד), ומיושרים עם גבולות טרנזקציה (הדאטה של tenant ביחד). <code>tenant_id</code> הוא הבחירה הקלאסית ב-SaaS; שימו לב ל-tenants "לווייתנים" שצריכים shard משלהם.</p>
<blockquote>💡 מהשטח: Notion חילקו Postgres ל-480 shards לוגיים על 32 hosts פיזיים (לפי workspace_id). הרבה יותר shards לוגיים מ-hosts פיזיים מאפשר rebalancing ע"י הזזת shards לוגיים שלמים במקום hash מחדש של שורות.</blockquote>`
      }
    },
    {
      h: { en: "Autoscaling, cells and geography", he: "Autoscaling, cells וגאוגרפיה" },
      body: {
        en: `<ul>
<li><strong>Reactive autoscaling</strong>: scale when a metric crosses a target (CPU 60%, RPS per pod, queue lag via KEDA). It lags reality by 1–5 minutes (metrics window + pod start + node provisioning) — so keep headroom.</li>
<li><strong>Scheduled</strong>: known peaks (Black Friday, the 9:00 login storm, end-of-month billing) — scale up at 08:45, not when the alarm fires.</li>
<li><strong>Predictive</strong>: forecasts from history (e.g. AWS predictive scaling). Good for strong daily seasonality.</li>
<li><strong>Cell-based architecture</strong>: N complete, independent copies of the whole stack (app + DB + queue), each serving a subset of customers, with a thin router in front. Scale by adding cells; a bad deploy or poison tenant hurts one cell (e.g. 1/20 of customers), not everyone.</li>
<li><strong>Geographic scaling</strong>: multiple regions for latency (light in fiber needs ~70 ms for a 7,000 km round trip — that's physics) and disaster tolerance. Read-local/write-home is the simplest; multi-region writes need conflict handling (see pr-cap-pacelc).</li>
</ul>
<pre># Kubernetes HPA: scale on RPS per pod, fast up / slow down
spec:
  minReplicas: 6
  maxReplicas: 120
  metrics:
  - type: Pods
    pods: { metric: { name: http_requests_per_second }, target: { type: AverageValue, averageValue: "200" } }
  behavior:
    scaleUp:   { stabilizationWindowSeconds: 0,   policies: [{ type: Percent, value: 100, periodSeconds: 30 }] }
    scaleDown: { stabilizationWindowSeconds: 300, policies: [{ type: Percent, value: 10,  periodSeconds: 60 }] }</pre>`,
        he: `<ul>
<li><strong>Autoscaling ריאקטיבי</strong>: מגדילים כשמטריקה חוצה יעד (CPU 60%, RPS ל-pod, lag של תור דרך KEDA). הוא מפגר אחרי המציאות ב-1–5 דקות (חלון metrics + עליית pod + הקצאת node) — לכן משאירים מרווח.</li>
<li><strong>מתוזמן</strong>: שיאים ידועים (Black Friday, סערת ההתחברויות ב-9:00, חיוב סוף חודש) — מגדילים ב-08:45, לא כשההתראה קופצת.</li>
<li><strong>חזוי</strong>: תחזיות מההיסטוריה (למשל AWS predictive scaling). טוב לעונתיות יומית חזקה.</li>
<li><strong>ארכיטקטורת Cells</strong>: N עותקים שלמים ובלתי תלויים של כל ה-stack (אפליקציה + DB + תור), כל אחד משרת תת-קבוצה של לקוחות, עם router דק מלפנים. מגדילים ע"י הוספת cells; deploy רע או tenant מורעל פוגע ב-cell אחד (למשל 1/20 מהלקוחות), לא בכולם.</li>
<li><strong>סקיילינג גאוגרפי</strong>: כמה regions בשביל latency (אור בסיב צריך ~70 ms ל-round trip של 7,000 ק"מ — זו פיזיקה) ועמידות לאסונות. Read-local/write-home הכי פשוט; כתיבות multi-region צריכות טיפול בקונפליקטים (ראו pr-cap-pacelc).</li>
</ul>
<pre># Kubernetes HPA: scale on RPS per pod, fast up / slow down
spec:
  minReplicas: 6
  maxReplicas: 120
  metrics:
  - type: Pods
    pods: { metric: { name: http_requests_per_second }, target: { type: AverageValue, averageValue: "200" } }
  behavior:
    scaleUp:   { stabilizationWindowSeconds: 0,   policies: [{ type: Percent, value: 100, periodSeconds: 30 }] }
    scaleDown: { stabilizationWindowSeconds: 300, policies: [{ type: Percent, value: 10,  periodSeconds: 60 }] }</pre>`
      }
    },
    {
      h: { en: "The evolution: 1 server to millions, step by step", he: "האבולוציה: משרת אחד למיליונים, שלב אחרי שלב" },
      body: {
        en: `<p>Apply these in order, and move to the next stage only when a measured bottleneck forces you:</p>
<pre>Stage 0  (~100 users)        [app + DB on one VM]
Stage 1  (~10k)              [app] --&gt; [DB]              split tiers, DB on its own box, backups
Stage 2  (~100k)     LB -&gt; [app x N] --&gt; [DB primary]    stateless app, sessions in Redis, CDN for static
Stage 3  (~1M)       LB -&gt; [app x N] -&gt; Redis -&gt; [primary] -&gt; [replica x2]   cache + replicas + PgBouncer
Stage 4  (~5M)       ... + queue -&gt; workers           async everything non-interactive, autoscaling
Stage 5  (~10M+)     Y-split: [checkout+DB] [search+ES] [feed+Cassandra]   functional split, polyglot
Stage 6  (~50M+)     Z-split: shard by tenant/user, logical shards &gt;&gt; physical hosts
Stage 7  (global)    cells x regions, router in front, data residency</pre>
<p><strong>Know the limits of parallelism</strong>: <em>Amdahl's law</em> — if 10% of the work is serial (a global lock, a single DB primary, one coordinator), max speedup is 10× no matter how many servers you add. The <em>Universal Scalability Law</em> adds coherency cost (nodes talking to each other): beyond some N, adding nodes makes throughput <em>go down</em>. That's why chatty clusters and global locks kill scaling.</p>
<pre>Amdahl:  speedup(N) = 1 / (s + (1 - s)/N)        s = serial fraction
         s = 0.05  -&gt; N=16: 9.1x   N=64: 15.4x   N=inf: 20x
USL:     C(N) = N / (1 + a(N-1) + b*N(N-1))      a = contention, b = coherency</pre>
<blockquote>💡 Real world: Instagram reached ~30M users with a tiny team on Postgres + Redis + Memcached + horizontal Django servers — stages 2–4. Most systems never need stage 6; doing it early buys years of complexity for traffic you don't have.</blockquote>`,
        he: `<p>מפעילים לפי הסדר, ועוברים לשלב הבא רק כשצוואר בקבוק שנמדד מכריח:</p>
<pre>Stage 0  (~100 users)        [app + DB on one VM]
Stage 1  (~10k)              [app] --&gt; [DB]              split tiers, DB on its own box, backups
Stage 2  (~100k)     LB -&gt; [app x N] --&gt; [DB primary]    stateless app, sessions in Redis, CDN for static
Stage 3  (~1M)       LB -&gt; [app x N] -&gt; Redis -&gt; [primary] -&gt; [replica x2]   cache + replicas + PgBouncer
Stage 4  (~5M)       ... + queue -&gt; workers           async everything non-interactive, autoscaling
Stage 5  (~10M+)     Y-split: [checkout+DB] [search+ES] [feed+Cassandra]   functional split, polyglot
Stage 6  (~50M+)     Z-split: shard by tenant/user, logical shards &gt;&gt; physical hosts
Stage 7  (global)    cells x regions, router in front, data residency</pre>
<p><strong>להכיר את גבולות המקביליות</strong>: <em>חוק Amdahl</em> — אם 10% מהעבודה סדרתית (lock גלובלי, primary יחיד, coordinator אחד), ה-speedup המקסימלי הוא פי 10, לא משנה כמה שרתים מוסיפים. ה-<em>Universal Scalability Law</em> מוסיף עלות קוהרנטיות (nodes שמדברים אחד עם השני): מעבר ל-N מסוים, הוספת nodes גורמת ל-throughput <em>לרדת</em>. בגלל זה קלאסטרים פטפטנים ו-locks גלובליים הורגים סקיילינג.</p>
<pre>Amdahl:  speedup(N) = 1 / (s + (1 - s)/N)        s = serial fraction
         s = 0.05  -&gt; N=16: 9.1x   N=64: 15.4x   N=inf: 20x
USL:     C(N) = N / (1 + a(N-1) + b*N(N-1))      a = contention, b = coherency</pre>
<blockquote>💡 מהשטח: Instagram הגיעו ל-~30M משתמשים עם צוות קטנטן על Postgres + Redis + Memcached + שרתי Django אופקיים — שלבים 2–4. רוב המערכות אף פעם לא צריכות את שלב 6; לעשות אותו מוקדם קונה שנים של מורכבות בשביל טראפיק שאין לכם.</blockquote>`
      }
    }
  ],
  diagram: `                    AKF Scale Cube
            Z: partition the data (shard by tenant / geo)
            ^
            |       +----------------+
            |      /|               /|
            |     / |   "infinite" / |
            |    +----------------+  |
            |    |  +-------------|--+
            |    | /              | /     Y: split by function
            |    |/               |/         (checkout | search | feed)
            |    +----------------+   ------->
            +------------------------> X: clone N identical copies behind an LB
   origin = one monolith on one server`,
  handsOn: [
    { cmd: "kubectl autoscale deployment api --cpu-percent=60 --min=3 --max=30 && kubectl get hpa -w", what: { en: "Reactive X-axis scaling: watch replicas follow CPU.", he: "סקיילינג ריאקטיבי בציר X: צופים ב-replicas עוקבים אחרי ה-CPU." } },
    { cmd: "psql -h replica -c \"SELECT now() - pg_last_xact_replay_timestamp() AS replica_lag;\"", what: { en: "Measure read-replica lag before routing 'read after write' traffic to it.", he: "מודדים lag של read replica לפני שמנתבים אליו טראפיק של 'קריאה אחרי כתיבה'." } },
    { cmd: "psql -c \"SELECT state, count(*) FROM pg_stat_activity GROUP BY state;\"", what: { en: "Count DB connections by state — the first sign you need PgBouncer.", he: "סופרים connections ל-DB לפי state — הסימן הראשון שצריך PgBouncer." } },
    { cmd: "hey -z 60s -c 200 https://staging.example.com/api/items", what: { en: "Load-test to find the knee of the throughput curve before production finds it for you.", he: "Load test כדי למצוא את נקודת השבירה של עקומת ה-throughput לפני שהפרודקשן ימצא אותה בשבילכם." } }
  ],
  mnemonic: {
    en: "\"Up, Out, Cache, Copy, Queue, Split, Shard, Cell\" — climb the ladder one rung at a time, and only when a measured bottleneck pushes you.",
    he: "\"למעלה, החוצה, Cache, העתק, תור, פצל, Shard, Cell\" — מטפסים בסולם שלב אחד בכל פעם, ורק כשצוואר בקבוק שנמדד דוחף."
  },
  pitfalls: [
    { en: "Sharding before exhausting vertical scale, caching and replicas — you inherit cross-shard queries and rebalancing forever, for traffic you don't have.", he: "לעשות sharding לפני שמיצינו סקייל אנכי, caching ו-replicas — יורשים לנצח queries בין shards ו-rebalancing, בשביל טראפיק שאין." },
    { en: "Autoscaling the app tier without protecting the DB: 10× pods = 10× connections and queries, and the database (which doesn't autoscale) falls over.", he: "Autoscaling לשכבת האפליקציה בלי להגן על ה-DB: פי 10 pods = פי 10 connections ו-queries, וה-database (שלא עושה autoscale) קורס." },
    { en: "A monotonically increasing shard key (timestamp, auto-increment) with range sharding — every write hits the newest shard.", he: "Shard key שעולה באופן מונוטוני (timestamp, auto-increment) עם range sharding — כל כתיבה פוגעת ב-shard החדש ביותר." },
    { en: "Reading from replicas right after writing: the user saves a profile, refreshes, and sees old data — route read-your-writes to the primary.", he: "לקרוא מ-replicas מיד אחרי כתיבה: המשתמש שומר פרופיל, מרענן, ורואה דאטה ישן — מנתבים read-your-writes ל-primary." }
  ],
  interview: [
    {
      q: { en: "Your Postgres primary is at 85% CPU. Walk me through your options in order.", he: "ה-primary של Postgres על 85% CPU. תעבור איתי על האפשרויות לפי הסדר." },
      a: { en: "First measure: pg_stat_statements for top queries by total time — often one missing index or an N+1 is half the load. Then: cache hot reads, move read-only traffic and reports to replicas, add PgBouncer if connection churn burns CPU, push non-interactive writes through a queue and batch them. Then scale the instance up. Only if writes alone exceed the biggest box: functional split (move a table family to its own DB), shard by a key like tenant_id, or move to distributed SQL.", he: "קודם מודדים: pg_stat_statements ל-queries המובילים לפי זמן כולל — הרבה פעמים אינדקס חסר אחד או N+1 הם חצי מהעומס. אחר כך: cache לקריאות חמות, העברת טראפיק read-only ודוחות ל-replicas, PgBouncer אם churn של connections שורף CPU, כתיבות לא-אינטראקטיביות דרך תור עם batching. אחר כך scale up ל-instance. רק אם הכתיבות לבדן עוברות את המכונה הכי גדולה: פיצול פונקציונלי (משפחת טבלאות ל-DB משלה), sharding לפי key כמו tenant_id, או מעבר ל-distributed SQL." }
    },
    {
      q: { en: "What is a cell-based architecture and when is it worth it?", he: "מה זו ארכיטקטורה מבוססת cells ומתי היא שווה את זה?" },
      a: { en: "The whole stack is replicated into independent cells, each owning a subset of customers, with a thin routing layer mapping customer → cell. It caps blast radius (a bad deploy or noisy tenant affects one cell), gives a tested unit of scale (add a cell instead of growing a giant cluster), and enables per-cell staged rollouts. Worth it when outages are very expensive and you're past single-cluster limits; the cost is the router, cross-cell operations (migrating a customer, global reporting) and N copies to operate.", he: "כל ה-stack משוכפל ל-cells עצמאיים, כל אחד אחראי על תת-קבוצת לקוחות, עם שכבת ניתוב דקה שממפה לקוח → cell. זה מגביל blast radius (deploy רע או tenant רועש פוגע ב-cell אחד), נותן יחידת סקייל בדוקה (מוסיפים cell במקום להגדיל קלאסטר ענק), ומאפשר rollout מדורג לפי cell. שווה כשהשבתות יקרות מאוד ועברתם את הגבולות של קלאסטר יחיד; העלות היא ה-router, פעולות בין cells (העברת לקוח, דוחות גלובליים) ו-N עותקים לתפעל." }
    }
  ],
  quiz: [
    {
      q: { en: "Splitting a monolith into checkout, search and catalog services is which axis of the scale cube?", he: "פיצול מונולית לשירותי checkout, search ו-catalog הוא איזה ציר בקוביית הסקייל?" },
      options: [
        { en: "X — clone", he: "X — שכפול" },
        { en: "Y — functional split", he: "Y — פיצול פונקציונלי" },
        { en: "Z — data partition", he: "Z — חלוקת דאטה" },
        { en: "Vertical", he: "אנכי" }
      ],
      answer: 1,
      explain: { en: "Y-axis splits by function; X clones identical copies; Z splits the data among identical copies.", he: "ציר Y מפצל לפי פונקציה; X משכפל עותקים זהים; Z מחלק את הדאטה בין עותקים זהים." }
    },
    {
      q: { en: "15% of a job is serial. What's the maximum speedup with unlimited servers (Amdahl)?", he: "15% מהעבודה סדרתית. מה ה-speedup המקסימלי עם שרתים בלי הגבלה (Amdahl)?" },
      options: [
        { en: "About 6.7×", he: "בערך פי 6.7" },
        { en: "15×", he: "פי 15" },
        { en: "85×", he: "פי 85" },
        { en: "Unlimited", he: "בלי הגבלה" }
      ],
      answer: 0,
      explain: { en: "1 / 0.15 ≈ 6.7. The serial fraction caps the speedup — find and remove the serial part.", he: "1 / 0.15 ≈ 6.7. החלק הסדרתי מגביל את ה-speedup — מוצאים ומסירים את החלק הסדרתי." }
    },
    {
      q: { en: "After scaling API pods from 20 to 200, the database starts refusing connections. Best fix?", he: "אחרי הגדלת ה-API pods מ-20 ל-200, ה-database מתחיל לסרב ל-connections. מה התיקון הכי טוב?" },
      options: [
        { en: "Raise max_connections to 20,000", he: "להעלות את max_connections ל-20,000" },
        { en: "Put a connection pooler (PgBouncer/RDS Proxy) in front and cap per-pod pools", he: "לשים connection pooler (PgBouncer/RDS Proxy) מלפנים ולהגביל את ה-pool לכל pod" },
        { en: "Scale pods back to 20 forever", he: "להחזיר ל-20 pods לתמיד" },
        { en: "Add a read replica", he: "להוסיף read replica" }
      ],
      answer: 1,
      explain: { en: "Postgres connections are processes; thousands of them waste memory and CPU. A pooler multiplexes many clients onto ~100 server connections.", he: "Connections של Postgres הם processes; אלפים מהם מבזבזים זיכרון ו-CPU. Pooler מרכז הרבה clients על ~100 connections לשרת." }
    },
    {
      q: { en: "Which shard key is the worst choice for range sharding an orders table?", he: "איזה shard key הוא הבחירה הגרועה ביותר ל-range sharding של טבלת הזמנות?" },
      options: [
        { en: "tenant_id", he: "tenant_id" },
        { en: "hash(order_id)", he: "hash(order_id)" },
        { en: "created_at timestamp", he: "timestamp של created_at" },
        { en: "region + tenant_id", he: "region + tenant_id" }
      ],
      answer: 2,
      explain: { en: "Time-ordered keys send all new writes to the last range — a permanent hot shard.", he: "Keys לפי זמן שולחים את כל הכתיבות החדשות לטווח האחרון — shard חם לתמיד." }
    }
  ],
  playground: "scaling",
  related: ["arch-scaling", "db-replication", "db-sharding", "k8s-hpa-deep", "staff-cells-blast-radius", "pr-db-landscape", "pr-sizing", "pr-queue-kinds"]
});

INFRA.lessons.push({
  id: "pr-cap-pacelc",
  track: "principal",
  order: 12,
  icon: "⚖️",
  level: 3,
  minutes: 17,
  title: { en: "CAP, PACELC and the Consistency Ladder — Choosing per Feature", he: "CAP, PACELC וסולם ה-Consistency — בחירה לפי פיצ'ר" },
  tldr: {
    en: "Partitions will happen, so CAP really asks 'during a partition, refuse (CP) or answer possibly stale (AP)?'; PACELC adds the everyday question 'when healthy, pay latency for consistency or not?' — and you answer it per feature, not per company.",
    he: "Partitions יקרו, אז CAP בעצם שואל 'בזמן partition — לסרב (CP) או לענות עם מידע אולי ישן (AP)?'; PACELC מוסיף את השאלה היומיומית 'כשהכול תקין — לשלם latency בשביל consistency או לא?' — ועונים עליה לפי פיצ'ר, לא לפי חברה."
  },
  analogy: {
    en: "Two bank branches share one ledger over a phone line. The line is cut (partition). A customer asks branch B to withdraw ₪1,000. CP branch: 'Sorry, I can't confirm your balance with headquarters — come back later.' (correct but unavailable). AP branch: 'Sure, here's the cash' (available, but if the same customer withdraws at branch A too, the account goes negative). PACELC is the normal day: even with the line working, calling HQ before every withdrawal takes 2 minutes — do you wait (consistency) or trust the local copy (latency)? Likes on a post: trust the local copy. Account balance: call HQ.",
    he: "שני סניפי בנק חולקים ספר חשבונות אחד דרך קו טלפון. הקו נקטע (partition). לקוח מבקש בסניף B למשוך ₪1,000. סניף CP: 'מצטער, אני לא יכול לאמת את היתרה מול ההנהלה — תחזור אחר כך.' (נכון אבל לא זמין). סניף AP: 'בטח, הנה הכסף' (זמין, אבל אם אותו לקוח מושך גם בסניף A, החשבון נכנס למינוס). PACELC זה יום רגיל: גם כשהקו עובד, להתקשר להנהלה לפני כל משיכה לוקח 2 דקות — מחכים (consistency) או סומכים על העותק המקומי (latency)? לייקים על פוסט: סומכים על העותק המקומי. יתרת חשבון: מתקשרים להנהלה."
  },
  sections: [
    {
      h: { en: "CAP, stated correctly", he: "CAP, בניסוח הנכון" },
      body: {
        en: `<p>CAP: in a distributed data store, when a <strong>network partition (P)</strong> happens, you must choose between <strong>Consistency (C)</strong> — every read sees the latest write (linearizability) — and <strong>Availability (A)</strong> — every request to a non-failed node gets a non-error response.</p>
<ul>
<li><strong>"Pick 2 of 3" is misleading.</strong> You can't opt out of partitions in a distributed system (switches fail, GC pauses look like partitions, cloud AZ links flap). So the real choice is <em>CP or AP when P happens</em>. "CA" only exists on a single node.</li>
<li><strong>CP</strong>: the minority side refuses writes (and often reads). etcd, ZooKeeper, Consul, Spanner, CockroachDB, MongoDB with majority concerns, HBase.</li>
<li><strong>AP</strong>: every side keeps answering and reconciles later (last-write-wins, vector clocks, CRDTs). Cassandra/ScyllaDB and DynamoDB at default settings, Riak, CouchDB, DNS.</li>
<li>CAP's C and A are <em>very strict</em> definitions. Most real systems are neither perfectly C nor perfectly A — they sit somewhere on a spectrum and are tunable.</li>
</ul>
<blockquote>💡 Real world: In a partition, a 3-node etcd cluster with 1 node isolated keeps working on the 2-node majority; the isolated node rejects writes. That's CP in action — and why Kubernetes' API server can't write when etcd loses quorum.</blockquote>`,
        he: `<p>CAP: ב-data store מבוזר, כשקורה <strong>network partition (P)</strong>, חייבים לבחור בין <strong>Consistency (C)</strong> — כל קריאה רואה את הכתיבה האחרונה (linearizability) — לבין <strong>Availability (A)</strong> — כל בקשה ל-node שלא נפל מקבלת תשובה שאינה שגיאה.</p>
<ul>
<li><strong>"בחר 2 מתוך 3" זה מטעה.</strong> אי אפשר לוותר על partitions במערכת מבוזרת (switches נופלים, GC pauses נראים כמו partitions, קישורים בין AZs מהבהבים). אז הבחירה האמיתית היא <em>CP או AP כש-P קורה</em>. "CA" קיים רק על node אחד.</li>
<li><strong>CP</strong>: הצד של המיעוט מסרב לכתיבות (ולרוב גם לקריאות). etcd, ZooKeeper, Consul, Spanner, CockroachDB, MongoDB עם majority concerns, HBase.</li>
<li><strong>AP</strong>: כל צד ממשיך לענות ומיישב אחר כך (last-write-wins, vector clocks, CRDTs). Cassandra/ScyllaDB ו-DynamoDB בהגדרות ברירת מחדל, Riak, CouchDB, DNS.</li>
<li>ה-C וה-A של CAP הם הגדרות <em>מאוד קשוחות</em>. רוב המערכות האמיתיות לא C מושלם ולא A מושלם — הן יושבות על ספקטרום וניתנות לכיוונון.</li>
</ul>
<blockquote>💡 מהשטח: ב-partition, קלאסטר etcd של 3 nodes שבו node אחד מבודד ממשיך לעבוד על הרוב של 2 nodes; ה-node המבודד דוחה כתיבות. זה CP בפעולה — ובגלל זה ה-API server של Kubernetes לא יכול לכתוב כש-etcd מאבד quorum.</blockquote>`
      }
    },
    {
      h: { en: "PACELC: the trade-off you pay every day", he: "PACELC: הטרייד-אוף שמשלמים כל יום" },
      body: {
        en: `<p>Partitions are rare; latency is constant. <strong>PACELC</strong>: if <strong>P</strong>artition → choose <strong>A</strong> or <strong>C</strong>; <strong>E</strong>lse (normal operation) → choose <strong>L</strong>atency or <strong>C</strong>onsistency. Strong consistency means waiting for replicas (a quorum round trip, maybe cross-region: 60–150 ms) on every write or read.</p>
<table>
<tr><th>System</th><th>On Partition</th><th>Else</th><th>Class</th></tr>
<tr><td>Cassandra / ScyllaDB (default ONE/LOCAL_QUORUM)</td><td>A</td><td>L</td><td>PA/EL</td></tr>
<tr><td>DynamoDB (eventually consistent reads)</td><td>A</td><td>L</td><td>PA/EL</td></tr>
<tr><td>MongoDB (majority write/read concern)</td><td>C</td><td>C</td><td>PC/EC</td></tr>
<tr><td>Spanner, CockroachDB, YugabyteDB</td><td>C</td><td>C</td><td>PC/EC</td></tr>
<tr><td>etcd, ZooKeeper, Consul</td><td>C</td><td>C</td><td>PC/EC</td></tr>
<tr><td>Postgres primary + async replicas</td><td>C on primary (failover may lose recent writes)</td><td>L for replica reads</td><td>PC/EL-ish</td></tr>
<tr><td>Redis Cluster (async replication)</td><td>A-ish (may lose acked writes)</td><td>L</td><td>PA/EL</td></tr>
</table>
<blockquote>⚠️ Production tip: "Strongly consistent across regions" sounds great until the product sees +120 ms on every checkout write. Spanner hides some of it with TrueTime and leader placement; you still pay physics. Ask: does <em>this</em> feature need it?</blockquote>`,
        he: `<p>Partitions נדירים; latency קבוע. <strong>PACELC</strong>: אם יש <strong>P</strong>artition → בוחרים <strong>A</strong> או <strong>C</strong>; <strong>E</strong>lse (פעולה רגילה) → בוחרים <strong>L</strong>atency או <strong>C</strong>onsistency. Consistency חזק אומר לחכות ל-replicas (round trip של quorum, אולי בין regions: 60–150 ms) בכל כתיבה או קריאה.</p>
<table>
<tr><th>מערכת</th><th>ב-Partition</th><th>אחרת</th><th>סיווג</th></tr>
<tr><td>Cassandra / ScyllaDB (ברירת מחדל ONE/LOCAL_QUORUM)</td><td>A</td><td>L</td><td>PA/EL</td></tr>
<tr><td>DynamoDB (קריאות eventually consistent)</td><td>A</td><td>L</td><td>PA/EL</td></tr>
<tr><td>MongoDB (majority write/read concern)</td><td>C</td><td>C</td><td>PC/EC</td></tr>
<tr><td>Spanner, CockroachDB, YugabyteDB</td><td>C</td><td>C</td><td>PC/EC</td></tr>
<tr><td>etcd, ZooKeeper, Consul</td><td>C</td><td>C</td><td>PC/EC</td></tr>
<tr><td>Postgres primary + async replicas</td><td>C על ה-primary (failover עלול לאבד כתיבות אחרונות)</td><td>L לקריאות מ-replica</td><td>בערך PC/EL</td></tr>
<tr><td>Redis Cluster (שכפול אסינכרוני)</td><td>בערך A (עלול לאבד כתיבות שאושרו)</td><td>L</td><td>PA/EL</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: "Strongly consistent בין regions" נשמע מעולה עד שהמוצר רואה +120 ms על כל כתיבה של checkout. Spanner מסתיר חלק מזה עם TrueTime ומיקום leaders; עדיין משלמים את הפיזיקה. שואלים: האם <em>הפיצ'ר הזה</em> צריך את זה?</blockquote>`
      }
    },
    {
      h: { en: "The consistency ladder, with analogies", he: "סולם ה-consistency, עם אנלוגיות" },
      body: {
        en: `<p>From strongest (slowest, least available) to weakest (fastest, most available):</p>
<table>
<tr><th>Model</th><th>Guarantee</th><th>Analogy</th><th>Needed for</th></tr>
<tr><td><strong>Linearizable</strong></td><td>Behaves like one copy; once a write is acked, every later read anywhere sees it</td><td>One whiteboard in one room</td><td>Locks, leader election, unique usernames, balances</td></tr>
<tr><td><strong>Sequential</strong></td><td>Everyone sees the same order of operations, not necessarily real-time</td><td>A TV broadcast with a delay — same show, same order, a few seconds late</td><td>Replicated logs</td></tr>
<tr><td><strong>Causal</strong></td><td>Cause before effect: you never see a reply before the question</td><td>WhatsApp group: replies always appear after the message they quote</td><td>Comments, chat, collaborative apps</td></tr>
<tr><td><strong>Read-your-writes</strong></td><td>You always see your own updates</td><td>You change your profile photo and immediately see the new one (others may lag)</td><td>Profile edits, settings, posting</td></tr>
<tr><td><strong>Monotonic reads</strong></td><td>You never go back in time</td><td>The scoreboard never shows 2–1 after you saw 3–1</td><td>Feeds, dashboards behind load-balanced replicas</td></tr>
<tr><td><strong>Eventual</strong></td><td>If writes stop, replicas converge</td><td>Gossip in a village — everyone will know by tomorrow</td><td>Likes, view counters, DNS, recommendations</td></tr>
</table>
<p>Read-your-writes and monotonic reads are <em>session guarantees</em> — cheap to implement with sticky sessions, routing to the primary for N seconds after a write, or carrying a version/LSN token the replica must reach before answering.</p>`,
        he: `<p>מהחזק ביותר (הכי איטי, הכי פחות זמין) לחלש ביותר (הכי מהיר, הכי זמין):</p>
<table>
<tr><th>מודל</th><th>הבטחה</th><th>אנלוגיה</th><th>צריך בשביל</th></tr>
<tr><td><strong>Linearizable</strong></td><td>מתנהג כמו עותק אחד; ברגע שכתיבה אושרה, כל קריאה אחריה בכל מקום רואה אותה</td><td>לוח מחיק אחד בחדר אחד</td><td>Locks, leader election, שמות משתמש ייחודיים, יתרות</td></tr>
<tr><td><strong>Sequential</strong></td><td>כולם רואים את אותו סדר פעולות, לא בהכרח בזמן אמת</td><td>שידור טלוויזיה בהשהיה — אותה תוכנית, אותו סדר, כמה שניות באיחור</td><td>לוגים משוכפלים</td></tr>
<tr><td><strong>Causal</strong></td><td>סיבה לפני תוצאה: אף פעם לא רואים תשובה לפני השאלה</td><td>קבוצת WhatsApp: תגובות תמיד מופיעות אחרי ההודעה שהן מצטטות</td><td>תגובות, צ'אט, אפליקציות שיתופיות</td></tr>
<tr><td><strong>Read-your-writes</strong></td><td>תמיד רואים את העדכונים של עצמכם</td><td>מחליפים תמונת פרופיל ומיד רואים את החדשה (אחרים אולי באיחור)</td><td>עריכת פרופיל, הגדרות, פרסום</td></tr>
<tr><td><strong>Monotonic reads</strong></td><td>אף פעם לא חוזרים אחורה בזמן</td><td>לוח התוצאות לא מראה 2–1 אחרי שראיתם 3–1</td><td>Feeds, דשבורדים מאחורי replicas עם load balancing</td></tr>
<tr><td><strong>Eventual</strong></td><td>אם הכתיבות נעצרות, ה-replicas מתכנסים</td><td>רכילות בכפר — עד מחר כולם יידעו</td><td>לייקים, מוני צפיות, DNS, המלצות</td></tr>
</table>
<p>Read-your-writes ו-monotonic reads הן <em>הבטחות session</em> — זולות למימוש עם sticky sessions, ניתוב ל-primary ל-N שניות אחרי כתיבה, או העברת token של version/LSN שה-replica חייב להגיע אליו לפני שהוא עונה.</p>`
      }
    },
    {
      h: { en: "Quorums: R + W > N, and tunable consistency", he: "Quorums: R + W > N, ו-consistency שניתן לכוונן" },
      body: {
        en: `<p>With <strong>N</strong> replicas, a write waits for <strong>W</strong> acks and a read queries <strong>R</strong> replicas. If <strong>R + W &gt; N</strong>, every read set overlaps every write set in at least one replica, so the read sees the latest write (with caveats: sloppy quorums, concurrent writes, clock-based conflict resolution).</p>
<table>
<tr><th>N</th><th>W</th><th>R</th><th>Overlap?</th><th>Behavior</th></tr>
<tr><td>3</td><td>2</td><td>2</td><td>yes (4 &gt; 3)</td><td>Classic QUORUM/QUORUM: consistent, tolerates 1 node down for both reads and writes</td></tr>
<tr><td>3</td><td>3</td><td>1</td><td>yes</td><td>Fast reads, but any one node down blocks writes</td></tr>
<tr><td>3</td><td>1</td><td>1</td><td>no</td><td>Fastest, most available, may read stale data</td></tr>
<tr><td>5</td><td>3</td><td>3</td><td>yes</td><td>Tolerates 2 nodes down</td></tr>
</table>
<pre>-- Cassandra: consistency is chosen per query
CONSISTENCY LOCAL_QUORUM;
UPDATE accounts SET plan = 'pro' WHERE id = 42;       -- waits for 2 of 3 in local DC
CONSISTENCY ONE;
SELECT likes FROM post_stats WHERE post_id = 9;       -- any replica, fastest

# DynamoDB: per read
aws dynamodb get-item --table-name Accounts --key '{"id":{"S":"42"}}' --consistent-read</pre>
<blockquote>💡 Real world: LOCAL_QUORUM is the sweet spot in multi-DC Cassandra — strong-ish inside the region, no cross-ocean wait. EACH_QUORUM makes every write wait for a majority in every DC: correct and painfully slow.</blockquote>`,
        he: `<p>עם <strong>N</strong> replicas, כתיבה מחכה ל-<strong>W</strong> אישורים וקריאה שואלת <strong>R</strong> replicas. אם <strong>R + W &gt; N</strong>, כל קבוצת קריאה חופפת לכל קבוצת כתיבה לפחות ב-replica אחד, כך שהקריאה רואה את הכתיבה האחרונה (עם הסתייגויות: sloppy quorums, כתיבות במקביל, יישוב קונפליקטים לפי שעון).</p>
<table>
<tr><th>N</th><th>W</th><th>R</th><th>חפיפה?</th><th>התנהגות</th></tr>
<tr><td>3</td><td>2</td><td>2</td><td>כן (4 &gt; 3)</td><td>QUORUM/QUORUM קלאסי: עקבי, שורד node אחד למטה גם לקריאה וגם לכתיבה</td></tr>
<tr><td>3</td><td>3</td><td>1</td><td>כן</td><td>קריאות מהירות, אבל כל node אחד שנופל חוסם כתיבות</td></tr>
<tr><td>3</td><td>1</td><td>1</td><td>לא</td><td>הכי מהיר, הכי זמין, עלול לקרוא דאטה ישן</td></tr>
<tr><td>5</td><td>3</td><td>3</td><td>כן</td><td>שורד 2 nodes למטה</td></tr>
</table>
<pre>-- Cassandra: consistency is chosen per query
CONSISTENCY LOCAL_QUORUM;
UPDATE accounts SET plan = 'pro' WHERE id = 42;       -- waits for 2 of 3 in local DC
CONSISTENCY ONE;
SELECT likes FROM post_stats WHERE post_id = 9;       -- any replica, fastest

# DynamoDB: per read
aws dynamodb get-item --table-name Accounts --key '{"id":{"S":"42"}}' --consistent-read</pre>
<blockquote>💡 מהשטח: LOCAL_QUORUM הוא ה-sweet spot ב-Cassandra עם כמה DCs — די חזק בתוך ה-region, בלי לחכות מעבר לאוקיינוס. EACH_QUORUM גורם לכל כתיבה לחכות לרוב בכל DC: נכון ואיטי עד כאב.</blockquote>`
      }
    },
    {
      h: { en: "ACID vs BASE, isolation levels, and choosing per feature", he: "ACID מול BASE, רמות isolation, ובחירה לפי פיצ'ר" },
      body: {
        en: `<p><strong>ACID</strong> (Atomic, Consistent, Isolated, Durable) is about transactions on one database; <strong>BASE</strong> (Basically Available, Soft state, Eventually consistent) is the AP philosophy. Note: the "C" in ACID (invariants hold) is <em>not</em> the "C" in CAP (linearizability).</p>
<table>
<tr><th>Isolation level</th><th>Prevents</th><th>Still allows</th><th>Default in</th></tr>
<tr><td>Read committed</td><td>Dirty reads</td><td>Non-repeatable reads, lost updates, write skew</td><td>Postgres, SQL Server, Oracle</td></tr>
<tr><td>Repeatable read / snapshot</td><td>+ non-repeatable reads (Postgres: + lost updates)</td><td>Write skew (two doctors both go off-call)</td><td>MySQL InnoDB</td></tr>
<tr><td>Serializable</td><td>Everything — as if one at a time</td><td>Nothing, but you must retry serialization failures</td><td>CockroachDB, Spanner</td></tr>
</table>
<p><strong>Choose per feature</strong> — one product, many consistency needs:</p>
<table>
<tr><th>Feature</th><th>Need</th><th>Implementation</th></tr>
<tr><td>Bank balance / payment</td><td>Linearizable + serializable</td><td>Single-primary SQL, <code>SELECT ... FOR UPDATE</code> or serializable tx, idempotency keys</td></tr>
<tr><td>Inventory "last item"</td><td>Strong on the counter</td><td>Conditional update: <code>UPDATE stock SET n=n-1 WHERE sku=? AND n&gt;0</code></td></tr>
<tr><td>Shopping cart</td><td>Available, merge conflicts</td><td>AP store, union-merge (Dynamo paper), read-your-writes for the user</td></tr>
<tr><td>Likes / views counter</td><td>Eventual</td><td>Redis INCR or CRDT counter, async rollups</td></tr>
<tr><td>Username uniqueness</td><td>Linearizable</td><td>Unique constraint on one primary or a consensus store</td></tr>
<tr><td>Social feed</td><td>Causal / monotonic</td><td>Fan-out with versioning, sticky reads</td></tr>
</table>`,
        he: `<p><strong>ACID</strong> (Atomic, Consistent, Isolated, Durable) עוסק בטרנזקציות על database אחד; <strong>BASE</strong> (Basically Available, Soft state, Eventually consistent) הוא הפילוסופיה של AP. שימו לב: ה-"C" ב-ACID (ה-invariants נשמרים) <em>אינו</em> ה-"C" ב-CAP (linearizability).</p>
<table>
<tr><th>רמת isolation</th><th>מונעת</th><th>עדיין מאפשרת</th><th>ברירת מחדל ב-</th></tr>
<tr><td>Read committed</td><td>Dirty reads</td><td>Non-repeatable reads, lost updates, write skew</td><td>Postgres, SQL Server, Oracle</td></tr>
<tr><td>Repeatable read / snapshot</td><td>+ non-repeatable reads (ב-Postgres: + lost updates)</td><td>Write skew (שני רופאים יוצאים יחד מתורנות)</td><td>MySQL InnoDB</td></tr>
<tr><td>Serializable</td><td>הכול — כאילו אחד אחרי השני</td><td>כלום, אבל חייבים retry על serialization failures</td><td>CockroachDB, Spanner</td></tr>
</table>
<p><strong>בוחרים לפי פיצ'ר</strong> — מוצר אחד, הרבה צרכי consistency:</p>
<table>
<tr><th>פיצ'ר</th><th>צורך</th><th>מימוש</th></tr>
<tr><td>יתרת חשבון / תשלום</td><td>Linearizable + serializable</td><td>SQL עם primary יחיד, <code>SELECT ... FOR UPDATE</code> או tx serializable, idempotency keys</td></tr>
<tr><td>מלאי "הפריט האחרון"</td><td>חזק על המונה</td><td>עדכון מותנה: <code>UPDATE stock SET n=n-1 WHERE sku=? AND n&gt;0</code></td></tr>
<tr><td>עגלת קניות</td><td>זמין, מיזוג קונפליקטים</td><td>Store AP, מיזוג union (מאמר Dynamo), read-your-writes למשתמש</td></tr>
<tr><td>מונה לייקים / צפיות</td><td>Eventual</td><td>Redis INCR או CRDT counter, rollups אסינכרוניים</td></tr>
<tr><td>ייחודיות שם משתמש</td><td>Linearizable</td><td>Unique constraint על primary אחד או store של קונצנזוס</td></tr>
<tr><td>Feed חברתי</td><td>Causal / monotonic</td><td>Fan-out עם versioning, קריאות sticky</td></tr>
</table>`
      }
    }
  ],
  diagram: `        partition between DC-A and DC-B
   clients ─▶ [A1 A2]   ╳╳╳╳╳   [B1]  ◀─ clients
              majority           minority
   CP: A side serves; B1 returns errors (or read-only)
   AP: both sides serve; conflicts merged later (LWW / vector clocks / CRDT)

   PACELC:   Partition? ── yes ─▶ A or C
                 └──── no (Else) ─▶ Latency or Consistency

   quorum overlap N=3, W=2, R=2:   write {r1,r2}   read {r2,r3}  -> r2 has the latest`,
  handsOn: [
    { cmd: "docker run -d --name c1 cassandra:5 && docker exec -it c1 cqlsh -e \"CONSISTENCY;\"", what: { en: "Start Cassandra and see the session consistency level; switch with CONSISTENCY QUORUM.", he: "מרימים Cassandra ורואים את רמת ה-consistency של ה-session; מחליפים עם CONSISTENCY QUORUM." } },
    { cmd: "aws dynamodb get-item --table-name Accounts --key '{\"id\":{\"S\":\"42\"}}' --consistent-read", what: { en: "Strongly consistent DynamoDB read — costs 2× the read capacity of an eventual read.", he: "קריאה strongly consistent ב-DynamoDB — עולה פי 2 read capacity מקריאה eventual." } },
    { cmd: "psql -c \"SHOW default_transaction_isolation;\" -c \"BEGIN ISOLATION LEVEL SERIALIZABLE; SELECT 1; COMMIT;\"", what: { en: "Check Postgres' default isolation and run a serializable transaction.", he: "בודקים את ה-isolation ברירת המחדל של Postgres ומריצים טרנזקציה serializable." } },
    { cmd: "etcdctl endpoint status --cluster -w table", what: { en: "See leader, raft term and index on a CP store — the minority side can't make progress.", he: "רואים leader, raft term ו-index ב-store מסוג CP — הצד של המיעוט לא יכול להתקדם." } }
  ],
  mnemonic: {
    en: "\"When the line is cut: refuse or guess (C or A). When the line is fine: wait or guess (C or L).\" Money waits; likes guess.",
    he: "\"כשהקו נקטע: לסרב או לנחש (C או A). כשהקו תקין: לחכות או לנחש (C או L).\" כסף מחכה; לייקים מנחשים."
  },
  pitfalls: [
    { en: "Saying 'we chose CA' for a distributed system — partitions aren't optional; you only choose behavior during them.", he: "להגיד 'בחרנו CA' למערכת מבוזרת — partitions הם לא אופציונליים; בוחרים רק את ההתנהגות בזמנם." },
    { en: "Assuming Postgres 'is ACID so it's consistent' while reading from async replicas — those reads are eventually consistent.", he: "להניח ש-Postgres 'הוא ACID ולכן consistent' בזמן שקוראים מ-replicas אסינכרוניים — הקריאות האלה eventually consistent." },
    { en: "Using last-write-wins with wall clocks across nodes: clock skew silently discards newer writes.", he: "להשתמש ב-last-write-wins עם שעוני קיר בין nodes: clock skew זורק בשקט כתיבות חדשות יותר." },
    { en: "Picking one consistency level for the whole product instead of per feature — either everything is slow or money is wrong.", he: "לבחור רמת consistency אחת לכל המוצר במקום לפי פיצ'ר — או שהכול איטי או שהכסף לא נכון." }
  ],
  interview: [
    {
      q: { en: "Is DynamoDB CP or AP?", he: "DynamoDB הוא CP או AP?" },
      a: { en: "It's tunable, so the honest answer is 'per operation'. Default reads are eventually consistent (PA/EL). Strongly consistent reads and conditional writes/transactions within a region behave CP — during a partition they may fail rather than return stale data. Global tables replicate asynchronously with last-writer-wins across regions, so cross-region it's AP. Then pick per feature.", he: "הוא ניתן לכוונון, אז התשובה הכנה היא 'לפי פעולה'. קריאות ברירת המחדל eventually consistent (PA/EL). קריאות strongly consistent וכתיבות מותנות/טרנזקציות בתוך region מתנהגות CP — ב-partition הן עלולות להיכשל במקום להחזיר דאטה ישן. Global tables משכפלות אסינכרונית עם last-writer-wins בין regions, אז בין regions זה AP. ואז בוחרים לפי פיצ'ר." }
    },
    {
      q: { en: "A user updates their address and the next page shows the old one. Explain and fix.", he: "משתמש מעדכן כתובת והעמוד הבא מראה את הישנה. הסבר ותקן." },
      a: { en: "A read-your-writes violation: the write went to the primary, the next read hit an async replica that's behind. Fixes: route that user's reads to the primary for a few seconds after a write (session flag/cookie), or pass the commit LSN and have the replica wait until it has replayed it, or read critical profile data from the primary. Don't make all reads go to the primary — that kills the scaling benefit.", he: "הפרה של read-your-writes: הכתיבה הלכה ל-primary, והקריאה הבאה הגיעה ל-replica אסינכרוני שמפגר. תיקונים: לנתב את הקריאות של המשתמש ל-primary לכמה שניות אחרי כתיבה (flag/cookie ב-session), או להעביר את ה-LSN של ה-commit ולגרום ל-replica לחכות עד שהוא עשה לו replay, או לקרוא דאטה קריטי של פרופיל מה-primary. לא מעבירים את כל הקריאות ל-primary — זה הורג את יתרון הסקייל." }
    }
  ],
  quiz: [
    {
      q: { en: "N=3 replicas. Which (W, R) gives strongly consistent quorum reads while tolerating one node down for both reads and writes?", he: "N=3 replicas. איזה (W, R) נותן קריאות quorum עקביות ושורד node אחד למטה גם לקריאה וגם לכתיבה?" },
      options: [
        { en: "W=1, R=1", he: "W=1, R=1" },
        { en: "W=2, R=2", he: "W=2, R=2" },
        { en: "W=3, R=1", he: "W=3, R=1" },
        { en: "W=1, R=2", he: "W=1, R=2" }
      ],
      answer: 1,
      explain: { en: "2+2 > 3 guarantees overlap, and each needs only 2 of 3 nodes. W=3 blocks writes when any node is down.", he: "2+2 > 3 מבטיח חפיפה, וכל אחד צריך רק 2 מתוך 3. W=3 חוסם כתיבות כשכל node נופל." }
    },
    {
      q: { en: "What does the 'ELC' in PACELC describe?", he: "מה מתאר ה-'ELC' ב-PACELC?" },
      options: [
        { en: "Error, Logging, Cost", he: "Error, Logging, Cost" },
        { en: "Else (no partition): trade Latency vs Consistency", he: "אחרת (בלי partition): טרייד-אוף בין Latency ל-Consistency" },
        { en: "Eventual, Linear, Causal consistency", he: "Eventual, Linear, Causal consistency" },
        { en: "Elastic Load Control", he: "Elastic Load Control" }
      ],
      answer: 1,
      explain: { en: "Even with a healthy network, stronger consistency means waiting for more replicas — higher latency.", he: "גם כשהרשת תקינה, consistency חזק יותר אומר לחכות ליותר replicas — latency גבוה יותר." }
    },
    {
      q: { en: "Two on-call doctors each check 'is someone else on call?' and both go off-call. Which anomaly, and which isolation prevents it?", he: "שני רופאים תורנים בודקים כל אחד 'יש עוד מישהו בתורנות?' ושניהם יוצאים. איזו אנומליה, ואיזה isolation מונע אותה?" },
      options: [
        { en: "Dirty read; read committed", he: "Dirty read; read committed" },
        { en: "Write skew; serializable", he: "Write skew; serializable" },
        { en: "Lost update; read uncommitted", he: "Lost update; read uncommitted" },
        { en: "Phantom; none can", he: "Phantom; אף אחד לא יכול" }
      ],
      answer: 1,
      explain: { en: "Both read the same snapshot and write different rows — write skew. Snapshot isolation allows it; serializable (or explicit locking) prevents it.", he: "שניהם קוראים את אותו snapshot וכותבים שורות שונות — write skew. Snapshot isolation מאפשר את זה; serializable (או locking מפורש) מונע." }
    },
    {
      q: { en: "Which feature can safely use eventual consistency?", he: "איזה פיצ'ר יכול להשתמש בבטחה ב-eventual consistency?" },
      options: [
        { en: "Wallet balance before a withdrawal", he: "יתרת ארנק לפני משיכה" },
        { en: "Unique username registration", he: "רישום שם משתמש ייחודי" },
        { en: "View counter on a video", he: "מונה צפיות על סרטון" },
        { en: "Distributed lock for a cron job", he: "Lock מבוזר ל-cron job" }
      ],
      answer: 2,
      explain: { en: "A view count that's a few seconds behind harms nobody; the other three break correctness if stale.", he: "מונה צפיות שמפגר בכמה שניות לא מזיק לאף אחד; שלושת האחרים נשברים אם הם ישנים." }
    }
  ],
  related: ["db-cap", "db-transactions", "db-replication", "staff-consensus-consistency", "staff-multi-region-data", "pr-clusters", "pr-db-landscape", "pr-idempotency"]
});

INFRA.lessons.push({
  id: "pr-clusters",
  track: "principal",
  order: 13,
  icon: "🕸️",
  level: 3,
  minutes: 17,
  title: { en: "Clusters: Kinds, Membership, Quorum, Split Brain and Fencing", he: "קלאסטרים: סוגים, חברות, Quorum, Split Brain ו-Fencing" },
  tldr: {
    en: "A cluster is a group of machines pretending to be one: decide who leads (election), who is alive (failure detection), who may write (quorum + fencing), and how data is split and copied (shards + replicas) — and always run an odd number of voters.",
    he: "קלאסטר הוא קבוצת מכונות שמעמידות פנים שהן אחת: מחליטים מי מוביל (election), מי חי (failure detection), למי מותר לכתוב (quorum + fencing), ואיך הדאטה מחולק ומשוכפל (shards + replicas) — ותמיד מריצים מספר אי-זוגי של מצביעים."
  },
  analogy: {
    en: "A cluster is a band on tour. Active-passive: the lead singer performs, the understudy waits backstage and jumps in if the singer collapses. Active-active: three singers share the songs. Leader election: the band votes who calls the setlist tonight — majority wins, and with 4 members a 2–2 tie means no setlist, so bands keep an odd number of voters. Heartbeats: everyone glances at each other every few seconds; if the drummer hasn't moved for 10 seconds, he's 'suspected dead'. Split brain: the stage is split by a curtain and both halves elect a lead singer — two shows on one stage. Fencing: the sound engineer cuts the mic of the old lead singer the moment a new one is elected.",
    he: "קלאסטר הוא להקה בסיבוב הופעות. Active-passive: הזמר הראשי מופיע, המחליף מחכה מאחורי הקלעים וקופץ פנימה אם הזמר מתמוטט. Active-active: שלושה זמרים מתחלקים בשירים. Leader election: הלהקה מצביעה מי קובע את רשימת השירים הערב — הרוב מנצח, ועם 4 חברים תיקו של 2–2 אומר שאין רשימה, אז להקות שומרות על מספר אי-זוגי של מצביעים. Heartbeats: כולם מעיפים מבט אחד על השני כל כמה שניות; אם המתופף לא זז 10 שניות, הוא 'חשוד כמת'. Split brain: הבמה מחולקת בווילון ושני החצאים בוחרים זמר ראשי — שתי הופעות על במה אחת. Fencing: איש הסאונד מנתק את המיקרופון של הזמר הקודם ברגע שנבחר חדש."
  },
  sections: [
    {
      h: { en: "Kinds of clusters", he: "סוגי קלאסטרים" },
      body: {
        en: `<table>
<tr><th>Kind</th><th>Goal</th><th>How</th><th>Examples</th></tr>
<tr><td><strong>HA, active-passive</strong></td><td>Survive a node failure</td><td>One node serves, a standby takes over (VIP move, DNS flip, promotion)</td><td>Postgres primary + standby with Patroni, Pacemaker/Corosync, RDS Multi-AZ</td></tr>
<tr><td><strong>HA, active-active</strong></td><td>Availability + capacity</td><td>All nodes serve; state is shared or partitioned</td><td>Stateless API pods, Cassandra, Galera (careful), CDN POPs</td></tr>
<tr><td><strong>Load-balanced</strong></td><td>Throughput</td><td>An LB spreads stateless requests</td><td>Nginx/ALB in front of app servers, Node.js cluster/PM2</td></tr>
<tr><td><strong>Compute / HPC / batch</strong></td><td>Run many jobs or one huge parallel job</td><td>A scheduler places work on nodes</td><td>Kubernetes, Slurm, Spark, Ray, GPU training clusters</td></tr>
<tr><td><strong>Storage / data</strong></td><td>Hold more data than one disk, durably</td><td>Sharding + replication</td><td>Ceph, HDFS, Kafka, Elasticsearch, Redis Cluster, MinIO</td></tr>
<tr><td><strong>Coordination</strong></td><td>Small, strongly consistent metadata</td><td>Consensus (Raft/ZAB/Paxos)</td><td>etcd, ZooKeeper, Consul</td></tr>
</table>
<p>Data clusters also differ by <strong>replication topology</strong>:</p>
<ul>
<li><strong>Leader/follower (single-leader)</strong>: all writes to the leader, followers copy its log. Simple, consistent on the leader; failover is the hard part. Postgres, MySQL, MongoDB replica sets, Kafka partitions, Redis.</li>
<li><strong>Multi-leader</strong>: several nodes accept writes (often one per region) and exchange changes — conflicts are inevitable. MySQL group replication, CouchDB, multi-region active-active setups.</li>
<li><strong>Leaderless</strong>: client writes to several replicas, quorums decide (R + W &gt; N), read repair + anti-entropy fix drift. Cassandra, ScyllaDB, Riak, original Dynamo.</li>
</ul>`,
        he: `<table>
<tr><th>סוג</th><th>מטרה</th><th>איך</th><th>דוגמאות</th></tr>
<tr><td><strong>HA, active-passive</strong></td><td>לשרוד נפילת node</td><td>Node אחד משרת, standby לוקח פיקוד (העברת VIP, החלפת DNS, promotion)</td><td>Postgres primary + standby עם Patroni, Pacemaker/Corosync, RDS Multi-AZ</td></tr>
<tr><td><strong>HA, active-active</strong></td><td>זמינות + קיבולת</td><td>כל ה-nodes משרתים; ה-state משותף או מחולק</td><td>API pods ללא state, Cassandra, Galera (בזהירות), POPs של CDN</td></tr>
<tr><td><strong>Load-balanced</strong></td><td>Throughput</td><td>LB מפזר בקשות stateless</td><td>Nginx/ALB מול שרתי אפליקציה, Node.js cluster/PM2</td></tr>
<tr><td><strong>Compute / HPC / batch</strong></td><td>להריץ הרבה jobs או job מקבילי ענק אחד</td><td>Scheduler ממקם עבודה על nodes</td><td>Kubernetes, Slurm, Spark, Ray, קלאסטרי GPU לאימון</td></tr>
<tr><td><strong>Storage / data</strong></td><td>להחזיק יותר דאטה מדיסק אחד, באופן עמיד</td><td>Sharding + replication</td><td>Ceph, HDFS, Kafka, Elasticsearch, Redis Cluster, MinIO</td></tr>
<tr><td><strong>Coordination</strong></td><td>מטא-דאטה קטן ועקבי מאוד</td><td>קונצנזוס (Raft/ZAB/Paxos)</td><td>etcd, ZooKeeper, Consul</td></tr>
</table>
<p>קלאסטרי דאטה נבדלים גם ב-<strong>טופולוגיית השכפול</strong>:</p>
<ul>
<li><strong>Leader/follower (single-leader)</strong>: כל הכתיבות ל-leader, ה-followers מעתיקים את ה-log שלו. פשוט, עקבי על ה-leader; ה-failover הוא החלק הקשה. Postgres, MySQL, MongoDB replica sets, partitions של Kafka, Redis.</li>
<li><strong>Multi-leader</strong>: כמה nodes מקבלים כתיבות (לרוב אחד לכל region) ומחליפים שינויים — קונפליקטים בלתי נמנעים. MySQL group replication, CouchDB, הקמות active-active בין regions.</li>
<li><strong>Leaderless</strong>: ה-client כותב לכמה replicas, quorums מכריעים (R + W &gt; N), read repair ו-anti-entropy מתקנים סטיות. Cassandra, ScyllaDB, Riak, ה-Dynamo המקורי.</li>
</ul>`
      }
    },
    {
      h: { en: "Membership and failure detection", he: "חברות בקלאסטר וזיהוי כשלים" },
      body: {
        en: `<p>The cluster must agree on "who's in". You can never be <em>sure</em> a node is dead — a slow node, a GC pause and a network drop all look identical from outside. So detectors trade speed vs false alarms.</p>
<ul>
<li><strong>Heartbeats + timeout</strong>: "no heartbeat for 10 s → dead". Simple. Short timeout = fast failover + flapping; long = slow recovery. Kubernetes marks a node NotReady after ~40 s of missed kubelet leases.</li>
<li><strong>Gossip</strong> (SWIM protocol): each node pings a few random peers per second and spreads what it learned, epidemic-style. Scales to thousands of nodes with O(log N) propagation. Cassandra, Consul/Serf, Redis Cluster bus, memberlist.</li>
<li><strong>Phi accrual detector</strong>: instead of a yes/no timeout, outputs a suspicion level φ from the history of heartbeat intervals — adapts to a jittery network. Cassandra (<code>phi_convict_threshold: 8</code>), Akka.</li>
<li><strong>Leases</strong>: a node holds a time-bounded lease (e.g. 15 s) in a CP store and must renew it; if it can't renew, it must stop acting as leader <em>before</em> the lease expires.</li>
</ul>
<blockquote>⚠️ Production tip: A 30-second stop-the-world GC pause on a "leader" is indistinguishable from death. When it wakes up it still believes it's the leader — that's exactly why you need fencing (below), not just timeouts.</blockquote>`,
        he: `<p>הקלאסטר צריך להסכים "מי בפנים". אי אפשר אף פעם להיות <em>בטוחים</em> ש-node מת — node איטי, GC pause ונפילת רשת נראים זהים מבחוץ. אז גלאים מתפשרים בין מהירות לאזעקות שווא.</p>
<ul>
<li><strong>Heartbeats + timeout</strong>: "אין heartbeat 10 שניות → מת". פשוט. timeout קצר = failover מהיר + קפיצות הלוך-חזור; ארוך = התאוששות איטית. Kubernetes מסמן node כ-NotReady אחרי ~40 שניות של leases חסרים מה-kubelet.</li>
<li><strong>Gossip</strong> (פרוטוקול SWIM): כל node עושה ping לכמה peers אקראיים כל שנייה ומפיץ את מה שלמד, כמו מגפה. מתרחב לאלפי nodes עם התפשטות O(log N). Cassandra, Consul/Serf, ה-bus של Redis Cluster, memberlist.</li>
<li><strong>Phi accrual detector</strong>: במקום timeout של כן/לא, מוציא רמת חשד φ מתוך היסטוריית המרווחים בין heartbeats — מסתגל לרשת עם jitter. Cassandra (<code>phi_convict_threshold: 8</code>), Akka.</li>
<li><strong>Leases</strong>: node מחזיק lease מוגבל בזמן (למשל 15 שניות) ב-store מסוג CP וחייב לחדש אותו; אם הוא לא מצליח לחדש, הוא חייב להפסיק לפעול כ-leader <em>לפני</em> שה-lease פג.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: GC pause של 30 שניות שעוצר הכול על "leader" לא ניתן להבחנה ממוות. כשהוא מתעורר הוא עדיין חושב שהוא ה-leader — בדיוק בגלל זה צריך fencing (למטה), לא רק timeouts.</blockquote>`
      }
    },
    {
      h: { en: "Quorum, odd numbers and leader election", he: "Quorum, מספרים אי-זוגיים ו-leader election" },
      body: {
        en: `<p>A <strong>quorum</strong> is a strict majority: ⌊N/2⌋ + 1. Two majorities always overlap, so two leaders can't both win an election in the same term. That's the core of <strong>Raft</strong> (etcd, Consul, CockroachDB, Kafka KRaft) and ZAB (ZooKeeper).</p>
<table>
<tr><th>Voters (N)</th><th>Quorum</th><th>Failures tolerated</th><th>Note</th></tr>
<tr><td>1</td><td>1</td><td>0</td><td>Dev only</td></tr>
<tr><td>2</td><td>2</td><td>0</td><td>Worse than 1: twice the chance of failure, same tolerance</td></tr>
<tr><td>3</td><td>2</td><td>1</td><td>Standard production minimum</td></tr>
<tr><td>4</td><td>3</td><td>1</td><td>No better than 3, slower writes</td></tr>
<tr><td>5</td><td>3</td><td>2</td><td>Survive a failure during maintenance</td></tr>
<tr><td>7</td><td>4</td><td>3</td><td>Rarely worth it — every write waits for 4</td></tr>
</table>
<p><strong>Raft election in one breath</strong>: followers wait a randomized timeout (150–300 ms); the first to time out becomes a candidate, increments the <em>term</em>, votes for itself and asks others; a node votes once per term and only for a candidate whose log is at least as up to date; a majority makes it leader; it sends heartbeats to suppress new elections. Writes commit when a majority has them in their log.</p>
<p><strong>Placement matters</strong>: 3 etcd members in 3 AZs survive an AZ loss; 3 members in 2 AZs (2+1) die if the AZ with 2 goes down. For two data centers, put a tie-breaker (witness/arbiter) in a third location.</p>
<blockquote>💡 Real world: Kubernetes control planes run 3 or 5 etcd members, never 2 or 4. MongoDB replica sets use an arbiter to break ties cheaply; Redis Sentinel needs a quorum of sentinels (run 3) to agree before failover.</blockquote>`,
        he: `<p><strong>Quorum</strong> הוא רוב מוחלט: ⌊N/2⌋ + 1. שני רובים תמיד חופפים, כך ששני leaders לא יכולים לנצח שניהם בבחירות באותו term. זה הלב של <strong>Raft</strong> (etcd, Consul, CockroachDB, Kafka KRaft) ו-ZAB (ZooKeeper).</p>
<table>
<tr><th>מצביעים (N)</th><th>Quorum</th><th>כשלים שנסבלים</th><th>הערה</th></tr>
<tr><td>1</td><td>1</td><td>0</td><td>רק לפיתוח</td></tr>
<tr><td>2</td><td>2</td><td>0</td><td>גרוע מ-1: פי 2 סיכוי לכשל, אותה סבילות</td></tr>
<tr><td>3</td><td>2</td><td>1</td><td>המינימום הסטנדרטי לפרודקשן</td></tr>
<tr><td>4</td><td>3</td><td>1</td><td>לא טוב יותר מ-3, כתיבות איטיות יותר</td></tr>
<tr><td>5</td><td>3</td><td>2</td><td>שורד כשל בזמן תחזוקה</td></tr>
<tr><td>7</td><td>4</td><td>3</td><td>לעתים רחוקות שווה — כל כתיבה מחכה ל-4</td></tr>
</table>
<p><strong>בחירות Raft בנשימה אחת</strong>: followers מחכים timeout אקראי (150–300 ms); הראשון שה-timeout שלו פג הופך ל-candidate, מעלה את ה-<em>term</em>, מצביע לעצמו ומבקש מהאחרים; node מצביע פעם אחת לכל term ורק ל-candidate שה-log שלו מעודכן לפחות כמו שלו; רוב הופך אותו ל-leader; הוא שולח heartbeats כדי למנוע בחירות חדשות. כתיבות עושות commit כשרוב מחזיק אותן ב-log.</p>
<p><strong>המיקום חשוב</strong>: 3 חברי etcd ב-3 AZs שורדים נפילת AZ; 3 חברים ב-2 AZs (2+1) מתים אם ה-AZ עם ה-2 נופל. לשני data centers שמים מכריע (witness/arbiter) במיקום שלישי.</p>
<blockquote>💡 מהשטח: Control planes של Kubernetes מריצים 3 או 5 חברי etcd, אף פעם לא 2 או 4. MongoDB replica sets משתמשים ב-arbiter כדי להכריע תיקו בזול; Redis Sentinel צריך quorum של sentinels (מריצים 3) שיסכימו לפני failover.</blockquote>`
      }
    },
    {
      h: { en: "Split brain and fencing", he: "Split brain ו-fencing" },
      body: {
        en: `<p><strong>Split brain</strong>: two nodes both believe they're the leader and both accept writes — divergent data that someone must reconcile by hand (or lose). Causes: a network partition with no quorum rule, a failover script that promotes the standby while the old primary is merely slow, a paused leader that wakes up.</p>
<ul>
<li><strong>Quorum</strong>: only the majority side may elect/serve. Prevents most cases.</li>
<li><strong>STONITH</strong> ("Shoot The Other Node In The Head"): before promoting, forcibly power off the old primary via IPMI/cloud API. Brutal and effective (Pacemaker).</li>
<li><strong>Fencing tokens</strong>: every new leader/lock holder gets a monotonically increasing number (Raft term, ZooKeeper zxid, etcd revision). The storage layer rejects writes carrying a token lower than the highest it has seen. The woken-up old leader with token 33 is refused because 34 already wrote.</li>
<li><strong>Leases with safety margin</strong>: the leader stops serving at lease-expiry minus clock-drift margin.</li>
</ul>
<pre>Lock service grants:   client A token=33 ... A pauses (GC 40s) ... lease expires
                       client B token=34 -&gt; storage.write(x, token=34)   OK, max=34
A wakes up:            storage.write(y, token=33)  -&gt; REJECTED (33 &lt; 34)</pre>
<blockquote>⚠️ Production tip: A Redis-based lock (even Redlock) gives you a lease but no fencing token by default — fine for efficiency ("don't run the cron twice, usually"), unsafe for correctness ("never double-charge"). For correctness use etcd/ZooKeeper/DB row locks with fencing.</blockquote>`,
        he: `<p><strong>Split brain</strong>: שני nodes חושבים ששניהם ה-leader ושניהם מקבלים כתיבות — דאטה שמתפצל שמישהו צריך ליישב ידנית (או לאבד). גורמים: network partition בלי חוק quorum, סקריפט failover שמקדם את ה-standby כשה-primary הישן רק איטי, leader מושהה שמתעורר.</p>
<ul>
<li><strong>Quorum</strong>: רק צד הרוב רשאי לבחור/לשרת. מונע את רוב המקרים.</li>
<li><strong>STONITH</strong> ("Shoot The Other Node In The Head"): לפני promotion, מכבים בכוח את ה-primary הישן דרך IPMI/API של הענן. ברוטלי ויעיל (Pacemaker).</li>
<li><strong>Fencing tokens</strong>: כל leader/מחזיק lock חדש מקבל מספר שעולה מונוטונית (Raft term, ZooKeeper zxid, etcd revision). שכבת האחסון דוחה כתיבות עם token נמוך מהגבוה ביותר שראתה. ה-leader הישן שהתעורר עם token 33 נדחה כי 34 כבר כתב.</li>
<li><strong>Leases עם מרווח ביטחון</strong>: ה-leader מפסיק לשרת בזמן פקיעת ה-lease פחות מרווח ל-clock drift.</li>
</ul>
<pre>Lock service grants:   client A token=33 ... A pauses (GC 40s) ... lease expires
                       client B token=34 -&gt; storage.write(x, token=34)   OK, max=34
A wakes up:            storage.write(y, token=33)  -&gt; REJECTED (33 &lt; 34)</pre>
<blockquote>⚠️ טיפ לפרודקשן: Lock מבוסס Redis (גם Redlock) נותן lease אבל בלי fencing token כברירת מחדל — מתאים ליעילות ("לא להריץ את ה-cron פעמיים, בדרך כלל"), לא בטוח לנכונות ("לעולם לא לחייב פעמיים"). לנכונות משתמשים ב-etcd/ZooKeeper/row locks ב-DB עם fencing.</blockquote>`
      }
    },
    {
      h: { en: "Sharding + replication in real clusters", he: "Sharding + replication בקלאסטרים אמיתיים" },
      body: {
        en: `<table>
<tr><th>System</th><th>Split unit</th><th>Replication</th><th>Who decides</th><th>Gotcha</th></tr>
<tr><td>Redis Cluster</td><td>16,384 hash slots: <code>CRC16(key) mod 16384</code></td><td>Async primary → replica per slot range</td><td>Gossip bus + majority of primaries vote failover</td><td>Multi-key ops need <code>{hash tags}</code>; acked writes can be lost on failover</td></tr>
<tr><td>Kafka</td><td>Topic partitions</td><td>Leader + followers; ISR (in-sync replicas)</td><td>Controller (KRaft quorum)</td><td><code>acks=all</code> + <code>min.insync.replicas=2</code> with RF=3, or you can lose data</td></tr>
<tr><td>Elasticsearch</td><td>Primary shards (fixed at index creation)</td><td>Replica shards on other nodes</td><td>Elected master (3 master-eligible nodes)</td><td>Too many small shards kill the heap; aim ~10–50 GB/shard</td></tr>
<tr><td>Cassandra</td><td>Token ranges on a hash ring (vnodes)</td><td>RF per keyspace, per DC</td><td>Leaderless, gossip</td><td>Wide partitions &gt; 100 MB hurt; run repairs</td></tr>
<tr><td>Kubernetes</td><td>Nodes run pods</td><td>ReplicaSets for workloads; etcd for state</td><td>etcd Raft, controllers with leader-election leases</td><td>etcd needs fast disks (fsync latency &lt; 10 ms)</td></tr>
<tr><td>Node.js cluster / PM2</td><td>Processes on one machine</td><td>None — stateless workers</td><td>Primary process forks one worker per core</td><td>In-memory sessions/caches aren't shared between workers</td></tr>
</table>
<pre># Node.js: use all 8 cores on one box (a "cluster" in miniature)
const cluster = require('node:cluster'); const os = require('node:os');
if (cluster.isPrimary) { os.cpus().forEach(() =&gt; cluster.fork());
  cluster.on('exit', () =&gt; cluster.fork()); }        // self-healing
else { require('./server'); }                       // all workers share port 3000
# or simply:  pm2 start server.js -i max</pre>`,
        he: `<table>
<tr><th>מערכת</th><th>יחידת חלוקה</th><th>שכפול</th><th>מי מחליט</th><th>מלכודת</th></tr>
<tr><td>Redis Cluster</td><td>16,384 hash slots: <code>CRC16(key) mod 16384</code></td><td>אסינכרוני primary → replica לכל טווח slots</td><td>Gossip bus + רוב ה-primaries מצביעים על failover</td><td>פעולות על כמה keys צריכות <code>{hash tags}</code>; כתיבות שאושרו עלולות ללכת לאיבוד ב-failover</td></tr>
<tr><td>Kafka</td><td>Partitions של topic</td><td>Leader + followers; ISR (in-sync replicas)</td><td>Controller (quorum של KRaft)</td><td><code>acks=all</code> + <code>min.insync.replicas=2</code> עם RF=3, אחרת אפשר לאבד דאטה</td></tr>
<tr><td>Elasticsearch</td><td>Primary shards (קבוע ביצירת האינדקס)</td><td>Replica shards על nodes אחרים</td><td>Master נבחר (3 nodes שמתאימים ל-master)</td><td>יותר מדי shards קטנים הורגים את ה-heap; מכוונים ל-~10–50 GB ל-shard</td></tr>
<tr><td>Cassandra</td><td>טווחי tokens על hash ring (vnodes)</td><td>RF לכל keyspace, לכל DC</td><td>Leaderless, gossip</td><td>Partitions רחבים מעל 100 MB כואבים; מריצים repairs</td></tr>
<tr><td>Kubernetes</td><td>Nodes מריצים pods</td><td>ReplicaSets ל-workloads; etcd ל-state</td><td>Raft של etcd, controllers עם leases של leader election</td><td>etcd צריך דיסקים מהירים (latency של fsync מתחת ל-10 ms)</td></tr>
<tr><td>Node.js cluster / PM2</td><td>Processes על מכונה אחת</td><td>אין — workers ללא state</td><td>ה-process הראשי מפצל worker לכל core</td><td>Sessions/caches בזיכרון לא משותפים בין workers</td></tr>
</table>
<pre># Node.js: use all 8 cores on one box (a "cluster" in miniature)
const cluster = require('node:cluster'); const os = require('node:os');
if (cluster.isPrimary) { os.cpus().forEach(() =&gt; cluster.fork());
  cluster.on('exit', () =&gt; cluster.fork()); }        // self-healing
else { require('./server'); }                       // all workers share port 3000
# or simply:  pm2 start server.js -i max</pre>`
      }
    }
  ],
  diagram: `   AZ-a              AZ-b              AZ-c
 [etcd-1 L] <────> [etcd-2 F] <────> [etcd-3 F]      quorum = 2 of 3, survives 1 AZ loss
     │ term=7, heartbeats every 100ms
     ▼
 partition isolates etcd-1:
 [etcd-1 (old L, minority)]   ╳   [etcd-2 L term=8] <─> [etcd-3 F]
   writes rejected (no quorum)      majority elects new leader
 storage accepts only fencing token >= 8  ->  old leader's late writes refused`,
  handsOn: [
    { cmd: "etcdctl --endpoints=$EPS endpoint status -w table && etcdctl --endpoints=$EPS member list -w table", what: { en: "See which member is leader, the raft term, and DB size per member.", he: "רואים מי ה-leader, ה-raft term וגודל ה-DB לכל member." } },
    { cmd: "redis-cli -c -p 7000 cluster info && redis-cli -p 7000 cluster keyslot user:{42}:cart", what: { en: "Check Redis Cluster health and which hash slot a key lands in (hash tags keep related keys together).", he: "בודקים בריאות Redis Cluster ולאיזה hash slot key נוחת (hash tags שומרים keys קשורים יחד)." } },
    { cmd: "kafka-topics.sh --bootstrap-server localhost:9092 --describe --under-replicated-partitions", what: { en: "Find Kafka partitions whose followers fell out of the ISR — your durability is degraded there.", he: "מוצאים partitions ב-Kafka שה-followers שלהם נפלו מה-ISR — שם העמידות שלכם נפגעה." } },
    { cmd: "curl -s localhost:9200/_cluster/health?pretty && curl -s 'localhost:9200/_cat/shards?v&s=store:desc' | head", what: { en: "Elasticsearch cluster status (green/yellow/red) and the biggest shards.", he: "סטטוס קלאסטר Elasticsearch (green/yellow/red) וה-shards הכי גדולים." } },
    { cmd: "nodetool status && nodetool describecluster", what: { en: "Cassandra ring view: UN = Up/Normal, ownership per node, schema agreement.", he: "תמונת ה-ring של Cassandra: UN = Up/Normal, בעלות לכל node, הסכמה על ה-schema." } }
  ],
  mnemonic: {
    en: "\"Odd voters, majority rules, fence the old king.\" 3 survive 1, 5 survive 2 — and a paused leader is a zombie until a fencing token proves otherwise.",
    he: "\"מצביעים אי-זוגיים, הרוב קובע, מגדרים את המלך הישן.\" 3 שורדים 1, 5 שורדים 2 — ו-leader מושהה הוא זומבי עד ש-fencing token מוכיח אחרת."
  },
  pitfalls: [
    { en: "Running 2 or 4 consensus members — you pay for extra nodes and get no extra fault tolerance (and 2 is worse than 1).", he: "להריץ 2 או 4 חברי קונצנזוס — משלמים על nodes נוספים ולא מקבלים סבילות נוספת (ו-2 גרוע מ-1)." },
    { en: "Automatic failover based only on a timeout, with no fencing — a slow primary plus a promoted standby equals split brain and divergent writes.", he: "Failover אוטומטי שמבוסס רק על timeout, בלי fencing — primary איטי ועוד standby שקודם שווה split brain וכתיבות שמתפצלות." },
    { en: "Placing all 3 quorum members in two AZs (2+1) — losing the wrong AZ loses quorum.", he: "למקם את 3 חברי ה-quorum בשני AZs (2+1) — נפילה של ה-AZ הלא נכון מאבדת quorum." },
    { en: "Treating Node.js cluster workers as sharing memory: rate-limit counters or sessions kept in-process are per worker, not per server.", he: "להתייחס ל-workers של Node.js cluster כאילו הם חולקים זיכרון: מוני rate-limit או sessions בתוך ה-process הם לכל worker, לא לכל שרת." }
  ],
  interview: [
    {
      q: { en: "Why do consensus clusters use an odd number of nodes?", he: "למה קלאסטרי קונצנזוס משתמשים במספר אי-זוגי של nodes?" },
      a: { en: "Quorum is a strict majority (N/2 + 1). Going from 3 to 4 raises the quorum from 2 to 3, so you still tolerate only 1 failure while adding a node that can fail and making every write wait for one more ack. Odd sizes maximize fault tolerance per node. An odd number also avoids a symmetric split (2–2) in which neither side has a majority.", he: "Quorum הוא רוב מוחלט (N/2 + 1). מעבר מ-3 ל-4 מעלה את ה-quorum מ-2 ל-3, כך שעדיין סובלים רק כשל אחד, ומוסיפים node שיכול ליפול וגורמים לכל כתיבה לחכות לעוד אישור. גדלים אי-זוגיים ממקסמים סבילות לכל node. מספר אי-זוגי גם מונע פיצול סימטרי (2–2) שבו לאף צד אין רוב." }
    },
    {
      q: { en: "How do you prevent split brain in a Postgres primary/standby setup?", he: "איך מונעים split brain בהקמה של Postgres primary/standby?" },
      a: { en: "Never let failover be decided by the two DB nodes alone. Use a manager like Patroni that holds the leader key in a consensus store (etcd/Consul) with a TTL lease: the primary must keep renewing it, and if it can't (it's partitioned from the majority) it demotes itself to read-only. The standby is promoted only after acquiring the key. Add fencing — the old primary is stopped or its VIP/endpoint removed (STONITH or the cloud API), and clients connect via a service endpoint that follows the leader key. Use synchronous replication for zero data loss if the latency is acceptable.", he: "לא נותנים לשני ה-nodes של ה-DB להחליט על failover לבד. משתמשים במנהל כמו Patroni שמחזיק את ה-leader key ב-store של קונצנזוס (etcd/Consul) עם lease ו-TTL: ה-primary חייב לחדש אותו כל הזמן, ואם הוא לא מצליח (הוא מנותק מהרוב) הוא מוריד את עצמו ל-read-only. ה-standby מקודם רק אחרי שהשיג את ה-key. מוסיפים fencing — ה-primary הישן נעצר או שה-VIP/endpoint שלו מוסר (STONITH או API של הענן), וה-clients מתחברים דרך service endpoint שעוקב אחרי ה-leader key. שכפול סינכרוני לאפס איבוד דאטה, אם ה-latency מקובל." }
    }
  ],
  quiz: [
    {
      q: { en: "A 5-member etcd cluster. How many members can fail while it still accepts writes?", he: "קלאסטר etcd עם 5 חברים. כמה חברים יכולים ליפול והוא עדיין מקבל כתיבות?" },
      options: [
        { en: "1", he: "1" },
        { en: "2", he: "2" },
        { en: "3", he: "3" },
        { en: "4", he: "4" }
      ],
      answer: 1,
      explain: { en: "Quorum is 3 of 5, so 2 can be down.", he: "ה-quorum הוא 3 מתוך 5, אז 2 יכולים להיות למטה." }
    },
    {
      q: { en: "An old leader wakes from a 40 s GC pause and tries to write. What reliably stops it?", he: "Leader ישן מתעורר מ-GC pause של 40 שניות ומנסה לכתוב. מה עוצר אותו באמינות?" },
      options: [
        { en: "A longer heartbeat timeout", he: "Heartbeat timeout ארוך יותר" },
        { en: "A fencing token checked by the storage layer", he: "Fencing token שנבדק בשכבת האחסון" },
        { en: "Retrying the write", he: "Retry לכתיבה" },
        { en: "Adding a fourth node", he: "הוספת node רביעי" }
      ],
      answer: 1,
      explain: { en: "The storage rejects writes whose token is lower than the newest it has seen, regardless of what the zombie leader believes.", he: "האחסון דוחה כתיבות עם token נמוך מהחדש ביותר שראה, לא משנה מה ה-leader הזומבי חושב." }
    },
    {
      q: { en: "Which replication topology does Cassandra use?", he: "באיזו טופולוגיית שכפול Cassandra משתמש?" },
      options: [
        { en: "Single-leader", he: "Single-leader" },
        { en: "Multi-leader per region", he: "Multi-leader לכל region" },
        { en: "Leaderless with quorums", he: "Leaderless עם quorums" },
        { en: "Primary with synchronous standby", he: "Primary עם standby סינכרוני" }
      ],
      answer: 2,
      explain: { en: "Any replica accepts the write; consistency comes from R/W quorums, read repair and anti-entropy repair.", he: "כל replica מקבל את הכתיבה; ה-consistency מגיע מ-quorums של R/W, read repair ו-anti-entropy repair." }
    },
    {
      q: { en: "Why does Redis Cluster need {hash tags} for MULTI or MGET on several keys?", he: "למה Redis Cluster צריך {hash tags} ל-MULTI או MGET על כמה keys?" },
      options: [
        { en: "Hash tags encrypt the keys", he: "Hash tags מצפינים את ה-keys" },
        { en: "Multi-key operations must hit one hash slot; tags force related keys into the same slot", he: "פעולות על כמה keys חייבות לפגוע ב-hash slot אחד; tags מכריחים keys קשורים לאותו slot" },
        { en: "They increase the TTL", he: "הם מאריכים את ה-TTL" },
        { en: "They enable synchronous replication", he: "הם מפעילים שכפול סינכרוני" }
      ],
      answer: 1,
      explain: { en: "Only the part inside {} is hashed, so user:{42}:cart and user:{42}:profile share a slot and node.", he: "רק החלק בתוך {} עובר hash, כך ש-user:{42}:cart ו-user:{42}:profile חולקים slot ו-node." }
    }
  ],
  related: ["staff-consensus-consistency", "db-replication", "rel-ha", "staff-kafka-deep", "redis-deep", "k8s-architecture", "pr-cap-pacelc", "pr-scaling-kinds", "pr-singletons"]
});

INFRA.glossary.push(
  { term: "LSM tree", track: "principal", def: { en: "Write-optimized storage: writes go to an in-memory memtable and are flushed as immutable sorted files merged by compaction (Cassandra, RocksDB).", he: "אחסון מותאם לכתיבה: כתיבות נכנסות ל-memtable בזיכרון ונשפכות לקבצים ממוינים immutable שמתמזגים ב-compaction (Cassandra, RocksDB)." }, lesson: "pr-db-landscape" },
  { term: "Columnar storage", track: "principal", def: { en: "Each column is stored and compressed separately, so analytics read only the columns they need (ClickHouse, BigQuery, Parquet).", he: "כל עמודה נשמרת ונדחסת בנפרד, כך שאנליטיקה קוראת רק את העמודות שהיא צריכה (ClickHouse, BigQuery, Parquet)." }, lesson: "pr-db-landscape" },
  { term: "Polyglot persistence", track: "principal", def: { en: "Using different databases for different jobs, with one source of truth feeding derived stores (search, cache, warehouse) via CDC.", he: "שימוש ב-databases שונים לעבודות שונות, עם מקור אמת אחד שמזין stores נגזרים (חיפוש, cache, warehouse) דרך CDC." }, lesson: "pr-db-landscape" },
  { term: "Scale cube (AKF)", track: "principal", def: { en: "Three axes of scaling: X = clone identical copies, Y = split by function, Z = partition the data.", he: "שלושה צירי סקיילינג: X = שכפול עותקים זהים, Y = פיצול לפי פונקציה, Z = חלוקת הדאטה." }, lesson: "pr-scaling-kinds" },
  { term: "Amdahl's law", track: "principal", def: { en: "Max speedup from parallelism is limited by the serial fraction: 1 / serial share (10% serial → at most 10×).", he: "ה-speedup המקסימלי ממקביליות מוגבל ע\"י החלק הסדרתי: 1 / החלק הסדרתי (10% סדרתי → לכל היותר פי 10)." }, lesson: "pr-scaling-kinds" },
  { term: "PACELC", track: "principal", def: { en: "If Partition: Availability vs Consistency; Else: Latency vs Consistency — CAP extended to normal operation.", he: "אם יש Partition: Availability מול Consistency; אחרת: Latency מול Consistency — הרחבה של CAP לפעולה רגילה." }, lesson: "pr-cap-pacelc" },
  { term: "Read-your-writes", track: "principal", def: { en: "Session guarantee that a user always sees their own updates, even when reads go to lagging replicas.", he: "הבטחת session שמשתמש תמיד רואה את העדכונים של עצמו, גם כשקריאות הולכות ל-replicas שמפגרים." }, lesson: "pr-cap-pacelc" },
  { term: "Write skew", track: "principal", def: { en: "Anomaly where two transactions read the same data and write different rows, together breaking an invariant; prevented by serializable isolation.", he: "אנומליה שבה שתי טרנזקציות קוראות את אותו דאטה וכותבות שורות שונות, ויחד שוברות invariant; serializable isolation מונע אותה." }, lesson: "pr-cap-pacelc" },
  { term: "Fencing token", track: "principal", def: { en: "A monotonically increasing number given to each new leader/lock holder; storage rejects writes with an older token, stopping zombie leaders.", he: "מספר שעולה מונוטונית שניתן לכל leader/מחזיק lock חדש; האחסון דוחה כתיבות עם token ישן יותר, וכך עוצר leaders זומביים." }, lesson: "pr-clusters" },
  { term: "Gossip protocol", track: "principal", def: { en: "Nodes periodically exchange membership/state with random peers so information spreads epidemically in O(log N) rounds (Cassandra, Consul).", he: "Nodes מחליפים מדי פעם מידע על חברות/state עם peers אקראיים, כך שהמידע מתפשט כמו מגפה ב-O(log N) סבבים (Cassandra, Consul)." }, lesson: "pr-clusters" }
);
