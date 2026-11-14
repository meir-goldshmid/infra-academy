window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. Every kind of index
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-index-kinds",
  track: "data",
  order: 30,
  icon: "🗂️",
  level: 3,
  minutes: 16,
  title: { en: "Every Kind of Index (and When Indexes Hurt)", he: "כל סוגי ה-indexes (ומתי index מזיק)" },
  tldr: {
    en: "B-tree is the default for a reason, but GIN, GiST, BRIN, partial, covering and expression indexes each solve a query shape B-tree can't — and every index you add is a tax on every write, so measure usage and build them CONCURRENTLY.",
    he: "B-tree הוא ברירת המחדל מסיבה טובה, אבל GIN, GiST, BRIN, partial, covering ו-expression indexes פותרים כל אחד צורת query ש-B-tree לא יודע לפתור — וכל index שאתה מוסיף הוא מס על כל כתיבה, אז מודדים שימוש ובונים CONCURRENTLY."
  },
  analogy: {
    en: "A library has many catalogs. The alphabetical card catalog (B-tree) finds any title or range of titles. The back-of-book index listing every page a word appears on (GIN) finds 'all books mentioning Kafka'. The map with shelves drawn as areas (GiST) answers 'what's near me'. And the sign on each aisle saying 'books from 1990-1995 here' (BRIN) is one line per aisle but lets you skip 95% of the building — as long as books were shelved in order.",
    he: "בספרייה יש כמה קטלוגים. קטלוג הכרטיסים האלפביתי (B-tree) מוצא כל כותר או טווח כותרים. המפתח בסוף הספר, שמפרט כל עמוד שבו מילה מופיעה (GIN), מוצא \"כל הספרים שמזכירים Kafka\". המפה שבה המדפים מצוירים כאזורים (GiST) עונה על \"מה קרוב אליי\". והשלט בכל מעבר שאומר \"כאן ספרים מ-1990 עד 1995\" (BRIN) הוא שורה אחת לכל מעבר, אבל נותן לך לדלג על 95% מהבניין — בתנאי שהספרים סודרו לפי הסדר."
  },
  sections: [
    {
      h: { en: "B-tree and Hash: the workhorses", he: "B-tree ו-Hash: סוסי העבודה" },
      body: {
        en: `<p>Lesson <code>db-indexes</code> covered how a B-tree works and the leftmost-prefix rule. Going deeper on composite order: the index on <code>(tenant_id, status, created_at)</code> is <em>one</em> sorted list. Equality on a leading column narrows to a contiguous slice; the first <strong>range</strong> column ends the "seek" part and everything after it becomes a filter applied while scanning. So for <code>WHERE tenant_id = 7 AND created_at &gt; now() - interval '1 day' AND status = 'open'</code>, an index on <code>(tenant_id, created_at, status)</code> reads every row of the last day for tenant 7 and filters status, while <code>(tenant_id, status, created_at)</code> seeks straight to the exact slice. In <code>EXPLAIN</code> you see the difference as <code>Index Cond</code> (used for seeking) vs <code>Filter</code> (checked after reading).</p>
<p>Two more B-tree details that matter in production:</p>
<ul><li><strong>Sort direction</strong>: a B-tree can be scanned backwards, so <code>ORDER BY created_at DESC</code> works on an ascending index. But mixed order like <code>ORDER BY a ASC, b DESC</code> needs an index declared <code>(a ASC, b DESC)</code>.</li>
<li><strong>Deduplication</strong> (Postgres 13+) stores repeated keys once, so an index on a low-cardinality column can be 3x smaller than in PG 12.</li></ul>
<p><strong>Hash indexes</strong> store a 32-bit hash of the key: equality only, no ranges, no sorting, no multi-column, no uniqueness. In Postgres they were not WAL-logged (not crash-safe, not replicated) until <strong>version 10</strong>, which is why old blog posts say "never use them". Today they can be smaller than a B-tree for long keys (URLs, tokens) looked up by <code>=</code> only — but the win is usually modest, so B-tree remains the default.</p>
<pre>-- same query, two index types on a 40M-row table of 120-byte URLs
CREATE INDEX idx_url_btree ON links USING btree (url);   -- 5.1 GB
CREATE INDEX idx_url_hash  ON links USING hash  (url);   -- 1.3 GB
-- WHERE url = $1 uses either; WHERE url LIKE 'https://a%' only the btree</pre>`,
        he: `<p>השיעור <code>db-indexes</code> הסביר איך B-tree עובד ואת חוק ה-leftmost prefix. נעמיק בסדר של composite: ה-index על <code>(tenant_id, status, created_at)</code> הוא רשימה ממוינת <em>אחת</em>. שוויון על עמודה מובילה מצמצם לפרוסה רציפה; עמודת ה<strong>טווח</strong> הראשונה מסיימת את חלק ה-"seek", וכל מה שאחריה הופך ל-filter שנבדק תוך כדי סריקה. אז עבור <code>WHERE tenant_id = 7 AND created_at &gt; now() - interval '1 day' AND status = 'open'</code>, index על <code>(tenant_id, created_at, status)</code> קורא את כל השורות של היום האחרון של tenant 7 ומסנן status, בעוד ש-<code>(tenant_id, status, created_at)</code> קופץ ישר לפרוסה המדויקת. ב-<code>EXPLAIN</code> רואים את ההבדל כ-<code>Index Cond</code> (משמש ל-seek) מול <code>Filter</code> (נבדק אחרי הקריאה).</p>
<p>עוד שני פרטים על B-tree שחשובים בפרודקשן:</p>
<ul><li><strong>כיוון מיון</strong>: אפשר לסרוק B-tree אחורה, אז <code>ORDER BY created_at DESC</code> עובד על index עולה. אבל סדר מעורב כמו <code>ORDER BY a ASC, b DESC</code> צריך index שהוגדר <code>(a ASC, b DESC)</code>.</li>
<li><strong>Deduplication</strong> (Postgres 13+) שומר keys חוזרים פעם אחת, כך ש-index על עמודה עם cardinality נמוך יכול להיות קטן פי 3 מאשר ב-PG 12.</li></ul>
<p><strong>Hash index</strong> שומר hash של 32 ביט של ה-key: שוויון בלבד, בלי טווחים, בלי מיון, בלי כמה עמודות, בלי unique. ב-Postgres הם לא נכתבו ל-WAL (לא שרדו crash, לא שוכפלו ל-replicas) עד <strong>גרסה 10</strong>, ולכן פוסטים ישנים אומרים "אף פעם אל תשתמש בהם". היום הם יכולים להיות קטנים מ-B-tree עבור keys ארוכים (URLs, tokens) שמחפשים רק ב-<code>=</code> — אבל הרווח בדרך כלל צנוע, אז B-tree נשאר ברירת המחדל.</p>
<pre>-- same query, two index types on a 40M-row table of 120-byte URLs
CREATE INDEX idx_url_btree ON links USING btree (url);   -- 5.1 GB
CREATE INDEX idx_url_hash  ON links USING hash  (url);   -- 1.3 GB
-- WHERE url = $1 uses either; WHERE url LIKE 'https://a%' only the btree</pre>`
      }
    },
    {
      h: { en: "GIN, GiST, SP-GiST, BRIN: the specialists", he: "GIN, GiST, SP-GiST, BRIN: המומחים" },
      body: {
        en: `<p><strong>GIN (Generalized Inverted Index)</strong> maps each <em>element</em> (a jsonb key/value, an array item, a word) to the list of rows containing it. It's what makes "contains" queries fast:</p>
<pre>CREATE INDEX idx_ev_payload ON events USING gin (payload jsonb_path_ops);
SELECT * FROM events WHERE payload @&gt; '{"type":"refund","country":"IL"}';

CREATE INDEX idx_posts_tags ON posts USING gin (tags);          -- text[]
SELECT * FROM posts WHERE tags &amp;&amp; ARRAY['k8s','postgres'];      -- overlap

CREATE INDEX idx_doc_fts ON docs USING gin (to_tsvector('english', body));
SELECT * FROM docs WHERE to_tsvector('english', body) @@ to_tsquery('vacuum &amp; bloat');

CREATE EXTENSION pg_trgm;                                        -- LIKE '%abc%'
CREATE INDEX idx_users_name_trgm ON users USING gin (name gin_trgm_ops);</pre>
<p><code>jsonb_path_ops</code> supports only <code>@&gt;</code> but is typically 2-3x smaller than the default <code>jsonb_ops</code> (which also supports the key-exists operators <code>?</code>, <code>?|</code>, <code>?&amp;</code>). GIN's cost is on writes: one row can produce dozens of index entries, so Postgres buffers them in a <em>pending list</em> (<code>fastupdate</code>, flushed at <code>gin_pending_list_limit</code> = 4 MB or by vacuum). That makes inserts cheap but occasionally a random insert or query pays for a big flush — a classic source of p99 spikes.</p>
<p><strong>GiST</strong> is a balanced tree of <em>bounding boxes</em> rather than sorted keys, so it answers overlap / containment / nearest-neighbor: PostGIS geometry, range types, and <strong>exclusion constraints</strong> ("no two bookings of the same room overlap"):</p>
<pre>CREATE EXTENSION btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (room_id WITH =, during WITH &amp;&amp;);       -- during is tstzrange
SELECT * FROM shops ORDER BY geom &lt;-&gt; ST_MakePoint(34.78, 32.08) LIMIT 5;  -- KNN</pre>
<p><strong>SP-GiST</strong> (space-partitioned) builds non-balanced structures like quadtrees, k-d trees and radix tries — good for points, IP ranges (<code>inet</code>) and text prefixes where data clusters unevenly.</p>
<p><strong>BRIN (Block Range INdex)</strong> stores only the <em>min/max</em> per range of pages (default <code>pages_per_range = 128</code> = 1 MB of table). For a 2 TB append-only <code>events</code> table where <code>created_at</code> grows with physical position, a B-tree on <code>created_at</code> is ~40 GB; a BRIN is a few MB, and a 1-hour query skips all but a handful of block ranges. It only works when the column is <strong>physically correlated</strong> with row order — check <code>SELECT correlation FROM pg_stats WHERE tablename='events' AND attname='created_at';</code> (near 1.0 = great; near 0 = BRIN is useless). Updates that move rows or bulk backfills of old dates destroy the correlation.</p>`,
        he: `<p><strong>GIN (Generalized Inverted Index)</strong> ממפה כל <em>אלמנט</em> (key/value ב-jsonb, איבר במערך, מילה) לרשימת השורות שמכילות אותו. זה מה שהופך queries של "מכיל" למהירים:</p>
<pre>CREATE INDEX idx_ev_payload ON events USING gin (payload jsonb_path_ops);
SELECT * FROM events WHERE payload @&gt; '{"type":"refund","country":"IL"}';

CREATE INDEX idx_posts_tags ON posts USING gin (tags);          -- text[]
SELECT * FROM posts WHERE tags &amp;&amp; ARRAY['k8s','postgres'];      -- overlap

CREATE INDEX idx_doc_fts ON docs USING gin (to_tsvector('english', body));
SELECT * FROM docs WHERE to_tsvector('english', body) @@ to_tsquery('vacuum &amp; bloat');

CREATE EXTENSION pg_trgm;                                        -- LIKE '%abc%'
CREATE INDEX idx_users_name_trgm ON users USING gin (name gin_trgm_ops);</pre>
<p><code>jsonb_path_ops</code> תומך רק ב-<code>@&gt;</code> אבל בדרך כלל קטן פי 2-3 מ-<code>jsonb_ops</code> הדיפולטי (שתומך גם באופרטורים של קיום key: <code>?</code>, <code>?|</code>, <code>?&amp;</code>). המחיר של GIN הוא בכתיבה: שורה אחת יכולה לייצר עשרות entries ב-index, אז Postgres צובר אותם ב-<em>pending list</em> (<code>fastupdate</code>, שמתרוקן ב-<code>gin_pending_list_limit</code> = 4 MB או ע״י vacuum). זה הופך inserts לזולים, אבל מדי פעם insert או query אקראי משלם על flush גדול — מקור קלאסי ל-spikes ב-p99.</p>
<p><strong>GiST</strong> הוא עץ מאוזן של <em>bounding boxes</em> ולא של keys ממוינים, ולכן הוא עונה על חפיפה / הכלה / השכן הקרוב: גיאומטריה של PostGIS, range types, ו-<strong>exclusion constraints</strong> ("אין שתי הזמנות של אותו חדר שחופפות"):</p>
<pre>CREATE EXTENSION btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (room_id WITH =, during WITH &amp;&amp;);       -- during is tstzrange
SELECT * FROM shops ORDER BY geom &lt;-&gt; ST_MakePoint(34.78, 32.08) LIMIT 5;  -- KNN</pre>
<p><strong>SP-GiST</strong> (space-partitioned) בונה מבנים לא מאוזנים כמו quadtrees, k-d trees ו-radix tries — טוב לנקודות, טווחי IP (<code>inet</code>) ו-prefixes של טקסט, כשה-data מתקבץ בצורה לא אחידה.</p>
<p><strong>BRIN (Block Range INdex)</strong> שומר רק <em>min/max</em> לכל טווח של דפים (ברירת מחדל <code>pages_per_range = 128</code> = 1 MB מהטבלה). בטבלת <code>events</code> של 2 TB שהיא append-only, שבה <code>created_at</code> גדל יחד עם המיקום הפיזי, B-tree על <code>created_at</code> שוקל בערך 40 GB; BRIN שוקל כמה MB, ו-query על שעה אחת מדלג על כל טווחי הבלוקים חוץ מקומץ. זה עובד רק כשהעמודה <strong>מתואמת פיזית</strong> עם סדר השורות — בודקים <code>SELECT correlation FROM pg_stats WHERE tablename='events' AND attname='created_at';</code> (קרוב ל-1.0 = מצוין; קרוב ל-0 = BRIN חסר תועלת). updates שמזיזים שורות או backfill גדול של תאריכים ישנים הורסים את ה-correlation.</p>`
      }
    },
    {
      h: { en: "Partial, covering, expression, unique — shaping the index to the query", he: "Partial, covering, expression, unique — לתפור את ה-index ל-query" },
      body: {
        en: `<p>These are not separate index <em>types</em> — they are options on (mostly) B-trees, and they're where senior engineers win the most:</p>
<pre>-- PARTIAL: index only the rows the hot query touches
CREATE INDEX idx_jobs_pending ON jobs (run_at) WHERE status = 'pending';
-- 200M jobs, 30k pending -&gt; a 1 MB index instead of 6 GB.
-- The query must repeat the predicate: WHERE status = 'pending' AND run_at &lt; now()

-- PARTIAL UNIQUE: soft deletes without breaking uniqueness
CREATE UNIQUE INDEX uq_users_email_live ON users (lower(email)) WHERE deleted_at IS NULL;

-- COVERING (PG 11+): carry extra columns in the leaf, not in the key
CREATE INDEX idx_orders_cust ON orders (customer_id, created_at DESC) INCLUDE (total, status);
-- SELECT created_at,total,status ... WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 20
--   -&gt; Index Only Scan ... Heap Fetches: 0

-- EXPRESSION: index the result of an IMMUTABLE function
CREATE INDEX idx_users_email_lower ON users (lower(email));
CREATE INDEX idx_ev_type ON events ((payload-&gt;&gt;'type'));       -- double parens required</pre>
<p>Precise details people get wrong:</p>
<ul><li>An <strong>Index Only Scan</strong> still visits the heap for any page not marked all-visible in the <em>visibility map</em>. Watch <code>Heap Fetches</code> in <code>EXPLAIN ANALYZE</code>; if it's high, vacuum isn't keeping up and the "covering" index isn't covering.</li>
<li><code>INCLUDE</code> columns can't be used for seeking or sorting, but they don't make the key wider, so the internal pages stay dense. Putting <code>total</code> in the key instead works too, but bloats every level of the tree.</li>
<li>Expression indexes only match if the query uses the <em>exact same expression</em>: an index on <code>lower(email)</code> doesn't help <code>WHERE email ILIKE $1</code>. They also get their own statistics after <code>ANALYZE</code> — a bonus for estimates.</li>
<li>Unique indexes treat NULLs as distinct by default (many rows with <code>NULL</code> allowed). Postgres 15 added <code>UNIQUE NULLS NOT DISTINCT</code>.</li></ul>
<blockquote>💡 Real world: A job queue table polled every 100 ms by 50 workers (<code>SELECT ... WHERE status='pending' ORDER BY run_at LIMIT 10 FOR UPDATE SKIP LOCKED</code>) went from 180 ms to 0.3 ms per poll by replacing an index on <code>(status, run_at)</code> with a partial index on <code>(run_at) WHERE status='pending'</code>. The full index was mostly dead entries from finished jobs.</blockquote>`,
        he: `<p>אלה לא <em>סוגים</em> נפרדים של index — אלה אפשרויות על (בעיקר) B-trees, ודווקא שם מהנדסים בכירים מרוויחים הכי הרבה:</p>
<pre>-- PARTIAL: index only the rows the hot query touches
CREATE INDEX idx_jobs_pending ON jobs (run_at) WHERE status = 'pending';
-- 200M jobs, 30k pending -&gt; a 1 MB index instead of 6 GB.
-- The query must repeat the predicate: WHERE status = 'pending' AND run_at &lt; now()

-- PARTIAL UNIQUE: soft deletes without breaking uniqueness
CREATE UNIQUE INDEX uq_users_email_live ON users (lower(email)) WHERE deleted_at IS NULL;

-- COVERING (PG 11+): carry extra columns in the leaf, not in the key
CREATE INDEX idx_orders_cust ON orders (customer_id, created_at DESC) INCLUDE (total, status);
-- SELECT created_at,total,status ... WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 20
--   -&gt; Index Only Scan ... Heap Fetches: 0

-- EXPRESSION: index the result of an IMMUTABLE function
CREATE INDEX idx_users_email_lower ON users (lower(email));
CREATE INDEX idx_ev_type ON events ((payload-&gt;&gt;'type'));       -- double parens required</pre>
<p>פרטים מדויקים שאנשים מפספסים:</p>
<ul><li><strong>Index Only Scan</strong> עדיין ניגש ל-heap עבור כל דף שלא מסומן all-visible ב-<em>visibility map</em>. שים לב ל-<code>Heap Fetches</code> ב-<code>EXPLAIN ANALYZE</code>; אם הוא גבוה, ה-vacuum לא עומד בקצב וה-index ה"מכסה" לא באמת מכסה.</li>
<li>עמודות ב-<code>INCLUDE</code> לא משמשות ל-seek או למיון, אבל הן לא מרחיבות את ה-key, אז הדפים הפנימיים נשארים דחוסים. לשים את <code>total</code> בתוך ה-key גם עובד, אבל מנפח כל רמה בעץ.</li>
<li>Expression index מתאים רק אם ה-query משתמש <em>בדיוק באותו ביטוי</em>: index על <code>lower(email)</code> לא עוזר ל-<code>WHERE email ILIKE $1</code>. הוא גם מקבל סטטיסטיקות משלו אחרי <code>ANALYZE</code> — בונוס להערכות של ה-planner.</li>
<li>Unique index מתייחס ל-NULLs כשונים כברירת מחדל (מותרות הרבה שורות עם <code>NULL</code>). Postgres 15 הוסיף <code>UNIQUE NULLS NOT DISTINCT</code>.</li></ul>
<blockquote>💡 מהשטח: טבלת job queue ש-50 workers עושים לה poll כל 100 ms (<code>SELECT ... WHERE status='pending' ORDER BY run_at LIMIT 10 FOR UPDATE SKIP LOCKED</code>) ירדה מ-180 ms ל-0.3 ms ל-poll, רק מהחלפת index על <code>(status, run_at)</code> ב-partial index על <code>(run_at) WHERE status='pending'</code>. ה-index המלא היה ברובו entries מתים של jobs שכבר הסתיימו.</blockquote>`
      }
    },
    {
      h: { en: "Clustered vs heap, bitmap scans, and MySQL / Mongo equivalents", he: "Clustered מול heap, bitmap scans, והמקבילות ב-MySQL / Mongo" },
      body: {
        en: `<p><strong>InnoDB is clustered</strong>: the table <em>is</em> a B+tree ordered by the primary key, with full rows in the leaves. Secondary indexes store the <em>PK value</em>, so a secondary lookup is two tree descents (secondary → PK → row). Consequences: a fat PK (e.g. a 36-char UUID string) is copied into every secondary index; and a <strong>random</strong> PK (UUIDv4) inserts into random leaf pages, causing page splits, ~50%-full pages and a working set that no longer fits the buffer pool. Sequential keys (auto-increment, UUIDv7) append to the right edge.</p>
<p><strong>Postgres uses a heap</strong>: rows live wherever there's free space, and <em>every</em> index (including the PK) points to a physical location (<code>ctid</code>). Range scans on a non-correlated index jump randomly around the heap. <code>CLUSTER orders USING idx_orders_cust</code> physically reorders once — but takes an <code>ACCESS EXCLUSIVE</code> lock for the whole rewrite and isn't maintained afterwards (<code>pg_repack</code> does it online).</p>
<p>When a query matches too many rows for an index scan but too few for a seq scan, Postgres uses a <strong>Bitmap Index Scan</strong>: collect matching TIDs, sort them by page, then read each heap page once in physical order. It can also <em>combine</em> indexes:</p>
<pre>Bitmap Heap Scan on orders  (actual rows=8120 loops=1)
  Recheck Cond: ((status = 'open') AND (region = 'eu'))
  Heap Blocks: exact=6210
  -&gt;  BitmapAnd
        -&gt;  Bitmap Index Scan on idx_orders_status  (actual rows=91233)
        -&gt;  Bitmap Index Scan on idx_orders_region  (actual rows=402118)</pre>
<p>If the bitmap exceeds <code>work_mem</code> it becomes <em>lossy</em> (<code>Heap Blocks: exact=... lossy=...</code>), remembering only pages, and every row on those pages is rechecked. A BitmapAnd of two single-column indexes works but is usually slower than one composite index.</p>
<table><tr><th>Need</th><th>Postgres</th><th>MySQL (InnoDB)</th><th>MongoDB</th></tr>
<tr><td>Default</td><td>B-tree</td><td>B+tree (clustered PK)</td><td>B-tree; compound follows ESR</td></tr>
<tr><td>Arrays / docs</td><td>GIN</td><td>multi-valued index on JSON arrays (8.0.17+)</td><td>multikey (automatic on arrays), wildcard</td></tr>
<tr><td>Full text</td><td>GIN + tsvector</td><td>FULLTEXT</td><td>text index / Atlas Search</td></tr>
<tr><td>Geo</td><td>GiST (PostGIS)</td><td>SPATIAL (R-tree)</td><td>2dsphere</td></tr>
<tr><td>Partial</td><td>WHERE clause</td><td>not supported</td><td>partialFilterExpression</td></tr>
<tr><td>Expression</td><td>yes</td><td>functional index (8.0.13+)</td><td>no (store a computed field)</td></tr>
<tr><td>Hash</td><td>hash</td><td>only internal Adaptive Hash Index</td><td>hashed (also for hashed sharding)</td></tr></table>
<p>MySQL 8 also has <strong>invisible indexes</strong> (<code>ALTER TABLE t ALTER INDEX idx INVISIBLE</code>): the optimizer ignores it but it's still maintained — a safe, instantly reversible way to test dropping it. Mongo adds <strong>TTL indexes</strong> that delete expired documents in the background.</p>`,
        he: `<p><strong>InnoDB הוא clustered</strong>: הטבלה <em>היא</em> B+tree ממוין לפי ה-primary key, עם שורות מלאות בעלים. secondary indexes שומרים את <em>ערך ה-PK</em>, אז חיפוש דרך secondary הוא שתי ירידות בעץ (secondary ← PK ← שורה). ההשלכות: PK שמן (למשל UUID כמחרוזת של 36 תווים) מועתק לכל secondary index; ו-PK <strong>אקראי</strong> (UUIDv4) נכנס לדפי עלים אקראיים, גורם ל-page splits, לדפים מלאים רק ב-50% ול-working set שכבר לא נכנס ל-buffer pool. keys סדרתיים (auto-increment, UUIDv7) נכתבים לקצה הימני.</p>
<p><strong>Postgres משתמש ב-heap</strong>: שורות יושבות איפה שיש מקום פנוי, ו<em>כל</em> index (כולל ה-PK) מצביע למיקום פיזי (<code>ctid</code>). סריקת טווח על index שלא מתואם עם הסדר הפיזי קופצת אקראית בכל ה-heap. <code>CLUSTER orders USING idx_orders_cust</code> מסדר פיזית פעם אחת — אבל לוקח lock מסוג <code>ACCESS EXCLUSIVE</code> לכל זמן הכתיבה מחדש, והסדר לא נשמר אחר כך (<code>pg_repack</code> עושה את זה online).</p>
<p>כש-query מתאים ליותר מדי שורות בשביל index scan אבל מעט מדי בשביל seq scan, Postgres משתמש ב-<strong>Bitmap Index Scan</strong>: אוסף את ה-TIDs המתאימים, ממיין לפי דף, ואז קורא כל דף ב-heap פעם אחת לפי הסדר הפיזי. הוא יכול גם <em>לשלב</em> indexes:</p>
<pre>Bitmap Heap Scan on orders  (actual rows=8120 loops=1)
  Recheck Cond: ((status = 'open') AND (region = 'eu'))
  Heap Blocks: exact=6210
  -&gt;  BitmapAnd
        -&gt;  Bitmap Index Scan on idx_orders_status  (actual rows=91233)
        -&gt;  Bitmap Index Scan on idx_orders_region  (actual rows=402118)</pre>
<p>אם ה-bitmap חורג מ-<code>work_mem</code> הוא הופך ל-<em>lossy</em> (<code>Heap Blocks: exact=... lossy=...</code>), זוכר רק דפים, וכל שורה בדפים האלה נבדקת מחדש. BitmapAnd של שני indexes של עמודה אחת עובד, אבל בדרך כלל איטי יותר מ-composite index אחד.</p>
<table><tr><th>צורך</th><th>Postgres</th><th>MySQL (InnoDB)</th><th>MongoDB</th></tr>
<tr><td>ברירת מחדל</td><td>B-tree</td><td>B+tree (PK clustered)</td><td>B-tree; compound לפי ESR</td></tr>
<tr><td>מערכים / מסמכים</td><td>GIN</td><td>multi-valued index על מערכי JSON (8.0.17+)</td><td>multikey (אוטומטי על מערכים), wildcard</td></tr>
<tr><td>Full text</td><td>GIN + tsvector</td><td>FULLTEXT</td><td>text index / Atlas Search</td></tr>
<tr><td>גיאו</td><td>GiST (PostGIS)</td><td>SPATIAL (R-tree)</td><td>2dsphere</td></tr>
<tr><td>Partial</td><td>סעיף WHERE</td><td>לא נתמך</td><td>partialFilterExpression</td></tr>
<tr><td>Expression</td><td>כן</td><td>functional index (8.0.13+)</td><td>לא (שומרים שדה מחושב)</td></tr>
<tr><td>Hash</td><td>hash</td><td>רק Adaptive Hash Index פנימי</td><td>hashed (גם ל-hashed sharding)</td></tr></table>
<p>ב-MySQL 8 יש גם <strong>invisible indexes</strong> (<code>ALTER TABLE t ALTER INDEX idx INVISIBLE</code>): ה-optimizer מתעלם מה-index אבל הוא עדיין מתוחזק — דרך בטוחה, הפיכה מיידית, לבדוק מה קורה אם מוחקים אותו. ב-Mongo יש <strong>TTL indexes</strong> שמוחקים מסמכים שפג תוקפם ברקע.</p>`
      }
    },
    {
      h: { en: "When indexes hurt, and building them without an outage", he: "מתי indexes מזיקים, ואיך בונים אותם בלי outage" },
      body: {
        en: `<p>Every index costs on every <code>INSERT</code>, on <code>DELETE</code> (vacuum must clean it), and on any <code>UPDATE</code> that isn't <strong>HOT</strong>. A HOT (heap-only tuple) update is possible only when <em>no indexed column changes</em> and the new row version fits on the same page — so adding an index on a frequently updated column (<code>last_seen_at</code>) can silently turn 95% HOT updates into 0%, multiplying WAL volume and replica lag. Check <code>n_tup_hot_upd / n_tup_upd</code> in <code>pg_stat_user_tables</code> before and after.</p>
<pre>-- Unused and oversized indexes (reset time matters: see pg_stat_database.stats_reset)
SELECT s.relname AS table, s.indexrelname AS index, s.idx_scan,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0 AND NOT i.indisunique
ORDER BY pg_relation_size(s.indexrelid) DESC LIMIT 10;

 table  |        index         | idx_scan |  size
--------+----------------------+----------+--------
 events | idx_events_session   |        0 | 38 GB
 orders | idx_orders_coupon    |        0 | 4120 MB</pre>
<p>Stats are <strong>per node</strong>: an index with 0 scans on the primary may serve every report on a replica. Unique indexes enforce constraints even with 0 scans — never drop those by this query alone.</p>
<p><strong>Building safely</strong>: plain <code>CREATE INDEX</code> takes a <code>SHARE</code> lock — reads continue, all writes block for the whole build (minutes to hours). <code>CREATE INDEX CONCURRENTLY</code> instead scans the table twice and waits for every transaction that could see old snapshots, so it takes 2-3x longer, can't run inside a transaction block (so not inside most migration frameworks' default transaction), and if it fails or is cancelled it leaves an <strong>INVALID</strong> index that still slows writes:</p>
<pre>SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY idx_orders_coupon;          -- then retry the build
REINDEX INDEX CONCURRENTLY idx_orders_cust;         -- PG 12+: rebuild a bloated index online</pre>
<blockquote>⚠️ Production tip: <code>CREATE INDEX CONCURRENTLY</code> waits for <em>all</em> older transactions to finish — one session stuck "idle in transaction" for 3 hours makes your index build hang for 3 hours. MySQL's equivalent is online DDL (<code>ALGORITHM=INPLACE, LOCK=NONE</code>) or gh-ost / pt-online-schema-change; MongoDB 4.2+ index builds hold an exclusive lock only briefly at the start and end.</blockquote>`,
        he: `<p>כל index עולה על כל <code>INSERT</code>, על <code>DELETE</code> (ה-vacuum צריך לנקות אותו), ועל כל <code>UPDATE</code> שאינו <strong>HOT</strong>. עדכון HOT (heap-only tuple) אפשרי רק כש<em>אף עמודה מאונדקסת לא משתנה</em> וגרסת השורה החדשה נכנסת באותו דף — כך שהוספת index על עמודה שמתעדכנת כל הזמן (<code>last_seen_at</code>) יכולה בשקט להפוך 95% עדכוני HOT ל-0%, להכפיל את נפח ה-WAL ואת ה-replica lag. בודקים <code>n_tup_hot_upd / n_tup_upd</code> ב-<code>pg_stat_user_tables</code> לפני ואחרי.</p>
<pre>-- Unused and oversized indexes (reset time matters: see pg_stat_database.stats_reset)
SELECT s.relname AS table, s.indexrelname AS index, s.idx_scan,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0 AND NOT i.indisunique
ORDER BY pg_relation_size(s.indexrelid) DESC LIMIT 10;

 table  |        index         | idx_scan |  size
--------+----------------------+----------+--------
 events | idx_events_session   |        0 | 38 GB
 orders | idx_orders_coupon    |        0 | 4120 MB</pre>
<p>הסטטיסטיקות הן <strong>לכל node בנפרד</strong>: index עם 0 scans על ה-primary יכול לשרת כל דוח על replica. Unique indexes אוכפים constraint גם עם 0 scans — אף פעם אל תמחק אותם רק לפי ה-query הזה.</p>
<p><strong>בנייה בטוחה</strong>: <code>CREATE INDEX</code> רגיל לוקח lock מסוג <code>SHARE</code> — קריאות ממשיכות, כל הכתיבות חסומות לכל זמן הבנייה (דקות עד שעות). <code>CREATE INDEX CONCURRENTLY</code> סורק את הטבלה פעמיים ומחכה לכל transaction שיכולה לראות snapshots ישנים, אז הוא לוקח פי 2-3 יותר זמן, לא יכול לרוץ בתוך transaction block (כלומר לא בתוך ה-transaction הדיפולטית של רוב כלי ה-migrations), ואם הוא נכשל או בוטל הוא משאיר index <strong>INVALID</strong> שעדיין מאט כתיבות:</p>
<pre>SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY idx_orders_coupon;          -- then retry the build
REINDEX INDEX CONCURRENTLY idx_orders_cust;         -- PG 12+: rebuild a bloated index online</pre>
<blockquote>⚠️ טיפ לפרודקשן: <code>CREATE INDEX CONCURRENTLY</code> מחכה ש<em>כל</em> ה-transactions הישנות יותר יסתיימו — session אחד שתקוע "idle in transaction" שלוש שעות יגרום לבניית ה-index שלך להיתקע שלוש שעות. המקבילה ב-MySQL היא online DDL (<code>ALGORITHM=INPLACE, LOCK=NONE</code>) או gh-ost / pt-online-schema-change; ב-MongoDB 4.2+ בניית index מחזיקה lock בלעדי רק לרגע בהתחלה ובסוף.</blockquote>`
      }
    }
  ],
  diagram: `Which index?                         query shape
  =, <, >, BETWEEN, ORDER BY, LIKE 'a%'  -> B-tree (composite: equality first, range last)
  = only, long keys                      -> Hash (PG 10+ crash-safe)
  jsonb @>, array &&, full-text @@       -> GIN   (fast reads, heavy writes, pending list)
  overlap, nearest, geo, ranges          -> GiST / SP-GiST (exclusion constraints)
  huge append-only, time-correlated      -> BRIN  (MBs instead of tens of GB)
  hot subset of rows                     -> partial   ... WHERE status='pending'
  avoid heap visits                      -> covering  ... INCLUDE (cols)
  lower(email), payload->>'type'         -> expression index

 InnoDB:   PK B+tree [ rows in leaves ]  <- secondary idx stores PK
 Postgres: heap [ rows anywhere ]        <- every idx (incl. PK) stores ctid`,
  handsOn: [
    { cmd: "psql -c \"SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) FROM pg_stat_user_indexes ORDER BY idx_scan, pg_relation_size(indexrelid) DESC LIMIT 15;\"", what: { en: "List the least-used, biggest indexes. Check replicas and stats_reset before dropping anything.", he: "מציג את ה-indexes הכי פחות בשימוש והכי גדולים. בדוק replicas ו-stats_reset לפני שאתה מוחק משהו." } },
    { cmd: "psql -c \"SELECT relname, n_tup_upd, n_tup_hot_upd, round(100.0*n_tup_hot_upd/nullif(n_tup_upd,0),1) AS hot_pct FROM pg_stat_user_tables ORDER BY n_tup_upd DESC LIMIT 10;\"", what: { en: "See which hot tables still get HOT updates — a new index on an updated column drops hot_pct.", he: "רואים אילו טבלאות חמות עדיין מקבלות HOT updates — index חדש על עמודה שמתעדכנת מוריד את hot_pct." } },
    { cmd: "psql -c \"SELECT attname, n_distinct, correlation FROM pg_stats WHERE tablename = 'events';\"", what: { en: "Check physical correlation before choosing BRIN (want close to 1 or -1).", he: "בודקים correlation פיזי לפני שבוחרים BRIN (רוצים קרוב ל-1 או ל-1-)." } },
    { cmd: "psql -c \"CREATE INDEX CONCURRENTLY idx_jobs_pending ON jobs (run_at) WHERE status = 'pending';\" && psql -c \"SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;\"", what: { en: "Build a partial index online, then verify nothing was left INVALID.", he: "בונים partial index online, ואז מוודאים שלא נשאר שום index במצב INVALID." } }
  ],
  mnemonic: {
    en: "\"Tree for order, GIN for contains, GiST for near, BRIN for time — and every index is a write tax.\"",
    he: "\"עץ לסדר, GIN ל'מכיל', GiST ל'קרוב', BRIN לזמן — וכל index הוא מס על כתיבה.\""
  },
  pitfalls: [
    { en: "Adding an index on a frequently updated column kills HOT updates: every update now writes to every index, WAL doubles and replicas lag. Check hot_pct before and after.", he: "index על עמודה שמתעדכנת הרבה הורג HOT updates: כל update כותב עכשיו לכל index, ה-WAL מוכפל וה-replicas מפגרים. בדוק את hot_pct לפני ואחרי." },
    { en: "A cancelled CREATE INDEX CONCURRENTLY leaves an INVALID index that is maintained on every write but never used for reads. Find it in pg_index (indisvalid = false) and drop it.", he: "CREATE INDEX CONCURRENTLY שבוטל משאיר index במצב INVALID שמתוחזק בכל כתיבה אבל אף פעם לא משמש לקריאה. מוצאים אותו ב-pg_index (indisvalid = false) ומוחקים." },
    { en: "BRIN on a column that isn't physically ordered (or after a big backfill of old dates) gives every block range a min/max spanning everything, so nothing is skipped.", he: "BRIN על עמודה שלא מסודרת פיזית (או אחרי backfill גדול של תאריכים ישנים) נותן לכל טווח בלוקים min/max שמכסה הכול, ואז לא מדלגים על כלום." },
    { en: "Random UUIDv4 primary keys in InnoDB scatter inserts across the clustered index: page splits, half-empty pages and a buffer pool that stops fitting the working set. Use UUIDv7 or a bigint.", he: "Primary key מסוג UUIDv4 אקראי ב-InnoDB מפזר inserts על כל ה-clustered index: page splits, דפים חצי ריקים ו-buffer pool שכבר לא מכיל את ה-working set. השתמש ב-UUIDv7 או ב-bigint." }
  ],
  interview: [
    {
      q: { en: "You need fast lookups of events by a key inside a jsonb column and also by 'last 1 hour' on a 3 TB append-only table. Which indexes?", he: "צריך חיפוש מהיר של events לפי key בתוך עמודת jsonb וגם לפי \"השעה האחרונה\" בטבלה append-only של 3 TB. אילו indexes?" },
      a: {
        en: "For a specific known key, an expression B-tree on (payload->>'key') is smallest and fastest; for arbitrary containment queries, GIN with jsonb_path_ops. For the time range, BRIN on created_at (MBs, works because rows are appended in time order — verify correlation in pg_stats) or partition by time. I'd avoid a B-tree on created_at at 3 TB unless queries need exact ordering with small LIMITs.",
        he: "ל-key ספציפי וידוע, expression B-tree על (payload->>'key') הוא הכי קטן ומהיר; ל-queries כלליים של הכלה, GIN עם jsonb_path_ops. לטווח הזמן, BRIN על created_at (כמה MB, עובד כי שורות נכתבות לפי סדר זמן — מאמתים correlation ב-pg_stats) או partitioning לפי זמן. הייתי נמנע מ-B-tree על created_at ב-3 TB, אלא אם ה-queries צריכים סדר מדויק עם LIMIT קטן."
      }
    },
    {
      q: { en: "Explain clustered vs heap tables and one practical consequence of each.", he: "הסבר טבלאות clustered מול heap ותן השלכה מעשית אחת לכל אחת." },
      a: {
        en: "InnoDB stores rows in the PK B+tree, so PK range scans are sequential and secondary indexes hold the PK (fat PKs bloat every index; random PKs cause page splits). Postgres stores rows in an unordered heap and all indexes point to ctids, so PK choice matters less for layout, but range scans on uncorrelated indexes do random heap I/O and updates create new tuple versions that indexes must point to unless they're HOT.",
        he: "InnoDB שומר שורות בתוך ה-B+tree של ה-PK, אז סריקת טווח על ה-PK רציפה ו-secondary indexes מחזיקים את ה-PK (PK שמן מנפח כל index; PK אקראי גורם ל-page splits). Postgres שומר שורות ב-heap לא ממוין וכל ה-indexes מצביעים ל-ctid, אז בחירת ה-PK פחות משנה לפריסה, אבל סריקת טווח על index לא מתואם עושה I/O אקראי ל-heap, ו-updates יוצרים גרסאות שורה חדשות שה-indexes חייבים להצביע עליהן, אלא אם זה HOT."
      }
    },
    {
      q: { en: "How do you safely decide to drop an index?", he: "איך מחליטים בבטחה למחוק index?" },
      a: {
        en: "Check idx_scan in pg_stat_user_indexes on the primary AND every replica, over a window that includes month-end jobs (check stats_reset). Exclude unique/constraint indexes. Look for redundant prefixes. In MySQL make it INVISIBLE first; in Postgres there's no invisible flag, so drop with DROP INDEX CONCURRENTLY and keep the CREATE statement ready to rebuild concurrently.",
        he: "בודקים idx_scan ב-pg_stat_user_indexes על ה-primary וגם על כל replica, לאורך חלון שכולל jobs של סוף חודש (בודקים stats_reset). מוציאים indexes של unique/constraints. מחפשים prefixes כפולים. ב-MySQL קודם הופכים ל-INVISIBLE; ב-Postgres אין דגל כזה, אז מוחקים עם DROP INDEX CONCURRENTLY ומחזיקים את פקודת ה-CREATE מוכנה לבנייה מחדש ב-CONCURRENTLY."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Which index lets WHERE tags && ARRAY['a','b'] (array overlap) avoid a seq scan in Postgres?", he: "איזה index מאפשר ל-WHERE tags && ARRAY['a','b'] (חפיפת מערכים) להימנע מ-seq scan ב-Postgres?" },
      options: [
        { en: "B-tree on tags", he: "B-tree על tags" },
        { en: "GIN on tags", he: "GIN על tags" },
        { en: "BRIN on tags", he: "BRIN על tags" },
        { en: "Hash on tags", he: "Hash על tags" }
      ],
      answer: 1,
      explain: { en: "GIN indexes each array element and supports @>, <@ and && for arrays. B-tree and hash compare whole values; BRIN stores min/max per block range.", he: "GIN מאנדקס כל איבר במערך ותומך ב-@>, <@ ו-&& על מערכים. B-tree ו-hash משווים ערכים שלמים; BRIN שומר min/max לכל טווח בלוקים." }
    },
    {
      q: { en: "Your Index Only Scan shows 'Heap Fetches: 480000'. Most likely cause?", he: "ה-Index Only Scan שלך מראה 'Heap Fetches: 480000'. מה הסיבה הסבירה?" },
      options: [
        { en: "The INCLUDE columns are in the wrong order", he: "עמודות ה-INCLUDE בסדר הלא נכון" },
        { en: "The visibility map is stale because vacuum isn't keeping up", he: "ה-visibility map לא מעודכן כי ה-vacuum לא עומד בקצב" },
        { en: "work_mem is too small", he: "work_mem קטן מדי" },
        { en: "The index is a hash index", he: "ה-index הוא hash" }
      ],
      answer: 1,
      explain: { en: "Index Only Scans skip the heap only for pages marked all-visible. Frequent updates plus lagging vacuum leave pages not-all-visible, forcing heap fetches.", he: "Index Only Scan מדלג על ה-heap רק בדפים שמסומנים all-visible. updates תכופים ו-vacuum שמפגר משאירים דפים לא all-visible, וזה מכריח heap fetches." }
    },
    {
      q: { en: "You cancel a CREATE INDEX CONCURRENTLY halfway. What's left?", he: "ביטלת CREATE INDEX CONCURRENTLY באמצע. מה נשאר?" },
      options: [
        { en: "Nothing — it rolls back cleanly", he: "כלום — הוא עושה rollback נקי" },
        { en: "A partial index usable for half the rows", he: "index חלקי ששמיש לחצי מהשורות" },
        { en: "An INVALID index that is still maintained on writes and must be dropped", he: "index במצב INVALID שעדיין מתוחזק בכתיבות וצריך למחוק אותו" },
        { en: "A table-level lock until the next restart", he: "lock ברמת הטבלה עד ה-restart הבא" }
      ],
      answer: 2,
      explain: { en: "CONCURRENTLY can't run in a transaction, so a failure leaves the catalog entry marked indisvalid = false. It costs write overhead until you DROP INDEX CONCURRENTLY and retry.", he: "CONCURRENTLY לא רץ בתוך transaction, אז כישלון משאיר רשומה בקטלוג עם indisvalid = false. היא עולה ב-overhead על כתיבות עד שעושים DROP INDEX CONCURRENTLY ומנסים שוב." }
    },
    {
      q: { en: "When is BRIN a great choice?", he: "מתי BRIN הוא בחירה מצוינת?" },
      options: [
        { en: "A users table looked up by random email", he: "טבלת users שמחפשים בה לפי email אקראי" },
        { en: "A 2 TB append-only log table queried by recent time ranges", he: "טבלת לוג append-only של 2 TB שמחפשים בה לפי טווחי זמן אחרונים" },
        { en: "A jsonb column queried with @>", he: "עמודת jsonb שמחפשים בה עם @>" },
        { en: "A small lookup table with 500 rows", he: "טבלת lookup קטנה עם 500 שורות" }
      ],
      answer: 1,
      explain: { en: "BRIN stores min/max per block range, so it shines when values correlate with physical order — like timestamps in an append-only table — and costs megabytes instead of tens of gigabytes.", he: "BRIN שומר min/max לכל טווח בלוקים, אז הוא מבריק כשהערכים מתואמים עם הסדר הפיזי — כמו timestamps בטבלה append-only — ועולה מגה-בייטים במקום עשרות גיגה." }
    }
  ],
  related: ["db-indexes", "db-query-debugging", "staff-postgres-at-scale", "db-partitioning", "pr-db-landscape"]
});

// ---------------------------------------------------------------------------
// 2. Debugging slow queries & locks
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-query-debugging",
  track: "data",
  order: 31,
  icon: "🔬",
  level: 3,
  minutes: 17,
  title: { en: "Debugging Slow Queries & Locks", he: "דיבאג של queries איטיים ו-locks" },
  tldr: {
    en: "Find the query that eats the most total time (pg_stat_statements), read its real plan with EXPLAIN (ANALYZE, BUFFERS) looking for estimate-vs-actual gaps, and when everything is slow at once, it's usually not a query but a lock — find the blocker with pg_blocking_pids before you restart anything.",
    he: "מוצאים את ה-query שאוכל הכי הרבה זמן כולל (pg_stat_statements), קוראים את ה-plan האמיתי שלו עם EXPLAIN (ANALYZE, BUFFERS) ומחפשים פערים בין הערכה למציאות, וכשהכול איטי בבת אחת — זה בדרך כלל לא query אלא lock: מוצאים את החוסם עם pg_blocking_pids לפני שעושים restart למשהו."
  },
  analogy: {
    en: "A traffic jam on the highway. One slow truck (a bad query) slows its own lane; you find it by watching which lane moves least. But when every lane stops dead at once, it's not a slow car — it's a single car stopped at the toll booth with its driver gone for coffee (idle in transaction), and a tow truck (ALTER TABLE) waiting behind it that won't let anyone pass. You don't fix that by adding lanes; you find the abandoned car.",
    he: "פקק בכביש המהיר. משאית אחת איטית (query גרוע) מאטה את הנתיב שלה; מוצאים אותה לפי הנתיב שזז הכי לאט. אבל כשכל הנתיבים נעצרים בבת אחת — זו לא מכונית איטית, זו מכונית אחת שעומדת בתא האגרה והנהג שלה הלך לקנות קפה (idle in transaction), ומאחוריה גרר (ALTER TABLE) שמחכה ולא נותן לאף אחד לעבור. את זה לא פותרים בהוספת נתיבים; מוצאים את המכונית הנטושה."
  },
  sections: [
    {
      h: { en: "Step 1: find the query that matters (pg_stat_statements)", he: "שלב 1: מוצאים את ה-query שבאמת חשוב (pg_stat_statements)" },
      body: {
        en: `<p><code>pg_stat_statements</code> normalizes queries (literals become <code>$1</code>) and aggregates per shape. It needs <code>shared_preload_libraries = 'pg_stat_statements'</code> (a restart; it's preloaded by default on RDS, Cloud SQL and Azure) and <code>CREATE EXTENSION pg_stat_statements;</code>. Sort by <strong>total</strong> time, not mean:</p>
<pre>SELECT round(total_exec_time/1000) AS total_s, calls,
       round(mean_exec_time::numeric,2) AS mean_ms, rows,
       round(100.0*shared_blks_hit/nullif(shared_blks_hit+shared_blks_read,0),1) AS hit_pct,
       left(query,70) AS query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;

 total_s |  calls   | mean_ms |   rows    | hit_pct |                 query
---------+----------+---------+-----------+---------+---------------------------------------
   41230 | 18200331 |    2.27 |  18200331 |    99.9 | SELECT * FROM carts WHERE user_id = $1
   29977 |     1204 | 24898.0 |      1204 |    61.3 | SELECT date_trunc($1, created_at), sum
   11506 |  9100883 |    1.26 | 455044150 |    99.8 | SELECT * FROM cart_items WHERE cart_id
    6020 |   402118 |   14.97 |    402118 |    92.0 | UPDATE inventory SET qty = qty - $1 WH</pre>
<p>How to read it: row 1 is cheap per call but called 18M times — shave 1 ms and you save 5 hours of DB time per day (a cache, or fewer calls). Row 2 is a 25 s report with 61% buffer hits — reading from disk; move it to a replica or fix its plan. Row 3 returns 50 rows per call (455M / 9.1M) — look for N+1. Reset with <code>SELECT pg_stat_statements_reset();</code> after a fix to measure cleanly.</p>
<p>The <strong>N+1 signature</strong>: one query shape with huge <code>calls</code> and tiny <code>mean_ms</code>, whose call count moves in lockstep with another query's rows. In traces it's a waterfall of 50 identical spans. Fix it in the ORM (eager loading / <code>WHERE id = ANY($1)</code>), not in the database.</p>
<p>For the plan of a slow query that you can't reproduce by hand, use <strong>auto_explain</strong>, which logs the plan of any statement over a threshold:</p>
<pre>session_preload_libraries = 'auto_explain'     # or shared_preload_libraries
auto_explain.log_min_duration = '500ms'
auto_explain.log_analyze = on                  # real row counts (adds timing overhead)
auto_explain.log_buffers = on
auto_explain.log_timing = off                  # keep row counts, drop most of the overhead
auto_explain.sample_rate = 0.1                 # explain 10% of qualifying statements</pre>`,
        he: `<p><code>pg_stat_statements</code> מנרמל queries (ערכים קבועים הופכים ל-<code>$1</code>) ומאגד לפי צורה. הוא צריך <code>shared_preload_libraries = 'pg_stat_statements'</code> (restart; ב-RDS, Cloud SQL ו-Azure הוא טעון כברירת מחדל) ו-<code>CREATE EXTENSION pg_stat_statements;</code>. ממיינים לפי זמן <strong>כולל</strong>, לא ממוצע:</p>
<pre>SELECT round(total_exec_time/1000) AS total_s, calls,
       round(mean_exec_time::numeric,2) AS mean_ms, rows,
       round(100.0*shared_blks_hit/nullif(shared_blks_hit+shared_blks_read,0),1) AS hit_pct,
       left(query,70) AS query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;

 total_s |  calls   | mean_ms |   rows    | hit_pct |                 query
---------+----------+---------+-----------+---------+---------------------------------------
   41230 | 18200331 |    2.27 |  18200331 |    99.9 | SELECT * FROM carts WHERE user_id = $1
   29977 |     1204 | 24898.0 |      1204 |    61.3 | SELECT date_trunc($1, created_at), sum
   11506 |  9100883 |    1.26 | 455044150 |    99.8 | SELECT * FROM cart_items WHERE cart_id
    6020 |   402118 |   14.97 |    402118 |    92.0 | UPDATE inventory SET qty = qty - $1 WH</pre>
<p>איך קוראים את זה: שורה 1 זולה לכל קריאה אבל נקראת 18 מיליון פעם — תוריד 1 ms ותחסוך 5 שעות זמן DB ביום (cache, או פחות קריאות). שורה 2 היא דוח של 25 שניות עם 61% buffer hits — קורא מהדיסק; תעביר אותו ל-replica או תתקן את ה-plan. שורה 3 מחזירה 50 שורות לקריאה (455M / 9.1M) — חפש N+1. אחרי תיקון עושים <code>SELECT pg_stat_statements_reset();</code> כדי למדוד נקי.</p>
<p><strong>החתימה של N+1</strong>: צורת query אחת עם <code>calls</code> ענק ו-<code>mean_ms</code> זעיר, שמספר הקריאות שלה זז יחד עם מספר השורות של query אחר. ב-traces זה מפל של 50 spans זהים. מתקנים ב-ORM (eager loading / <code>WHERE id = ANY($1)</code>), לא ב-DB.</p>
<p>בשביל ה-plan של query איטי שאתה לא מצליח לשחזר ידנית, משתמשים ב-<strong>auto_explain</strong>, שכותב ללוג את ה-plan של כל statement מעל סף:</p>
<pre>session_preload_libraries = 'auto_explain'     # or shared_preload_libraries
auto_explain.log_min_duration = '500ms'
auto_explain.log_analyze = on                  # real row counts (adds timing overhead)
auto_explain.log_buffers = on
auto_explain.log_timing = off                  # keep row counts, drop most of the overhead
auto_explain.sample_rate = 0.1                 # explain 10% of qualifying statements</pre>`
      }
    },
    {
      h: { en: "Step 2: read the real plan — estimates vs actuals", he: "שלב 2: קוראים את ה-plan האמיתי — הערכות מול מציאות" },
      body: {
        en: `<p>Every plan node shows <code>rows=</code> twice: the planner's <em>estimate</em> and the <em>actual</em>. The single most useful skill is spotting where they diverge by 10x or more — every bad join choice above that node follows from it. Also remember <code>actual time</code> and <code>rows</code> are <strong>per loop</strong>: multiply by <code>loops</code>.</p>
<pre>EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, c.email FROM orders o JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'pending' AND o.region = 'eu';

Nested Loop  (cost=1.13..58.40 rows=3 width=40)
             (actual time=0.05..41822.7 rows=48210 loops=1)
  Buffers: shared hit=190330 read=151204
  -&gt;  Index Scan using idx_orders_status on orders o
        (cost=0.56..24.1 rows=3 width=16) (actual time=0.03..2210.4 rows=48210 loops=1)
        Index Cond: (status = 'pending')
        Filter: (region = 'eu')
        Rows Removed by Filter: 912044
  -&gt;  Index Scan using customers_pkey on customers c
        (cost=0.56..8.58 rows=1 width=32) (actual time=0.81..0.82 rows=1 loops=48210)
Planning Time: 0.4 ms
Execution Time: 41860.1 ms</pre>
<p>Diagnosis: the planner expected <strong>3</strong> pending EU orders and got <strong>48,210</strong> — a 16,000x miss. With 3 rows a Nested Loop (3 PK lookups) is perfect; with 48k it's 48k random lookups, 0.82 ms each, 151k pages read from disk. Had it known, it would have picked a Hash Join. Two separate causes are visible: <code>status</code> statistics are stale (a backlog of pending orders built up since the last ANALYZE), and <code>status</code> and <code>region</code> are <em>correlated</em>, but the planner multiplies their selectivities as if independent.</p>
<p>Other things to look for in a plan:</p>
<ul><li><code>Rows Removed by Filter</code> much larger than rows returned → missing or wrong-order index.</li>
<li><code>Sort Method: external merge Disk: 812MB</code> → sort spilled; raise <code>work_mem</code> for that session or add an index providing the order.</li>
<li><code>Buffers: read=</code> high vs <code>hit=</code> → cold data from disk (or a working set larger than RAM).</li>
<li>Huge <code>Planning Time</code> → too many partitions not pruned, or a giant <code>IN</code> list.</li></ul>
<blockquote>⚠️ Production tip: <code>EXPLAIN ANALYZE</code> <em>executes</em> the statement. For an <code>UPDATE</code>/<code>DELETE</code>, wrap it: <code>BEGIN; EXPLAIN ANALYZE UPDATE ...; ROLLBACK;</code> — and remember it still takes row locks while it runs. Paste big plans into explain.dalibo.com or explain.depesz.com to find the expensive node fast.</blockquote>`,
        he: `<p>כל node ב-plan מראה <code>rows=</code> פעמיים: ה<em>הערכה</em> של ה-planner וה<em>מציאות</em>. המיומנות הכי שימושית היא לזהות איפה הן מתרחקות פי 10 ויותר — כל בחירת join גרועה מעל אותו node נובעת מזה. וזכור ש-<code>actual time</code> ו-<code>rows</code> הם <strong>לכל loop</strong>: מכפילים ב-<code>loops</code>.</p>
<pre>EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, c.email FROM orders o JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'pending' AND o.region = 'eu';

Nested Loop  (cost=1.13..58.40 rows=3 width=40)
             (actual time=0.05..41822.7 rows=48210 loops=1)
  Buffers: shared hit=190330 read=151204
  -&gt;  Index Scan using idx_orders_status on orders o
        (cost=0.56..24.1 rows=3 width=16) (actual time=0.03..2210.4 rows=48210 loops=1)
        Index Cond: (status = 'pending')
        Filter: (region = 'eu')
        Rows Removed by Filter: 912044
  -&gt;  Index Scan using customers_pkey on customers c
        (cost=0.56..8.58 rows=1 width=32) (actual time=0.81..0.82 rows=1 loops=48210)
Planning Time: 0.4 ms
Execution Time: 41860.1 ms</pre>
<p>אבחנה: ה-planner ציפה ל-<strong>3</strong> הזמנות pending באירופה וקיבל <strong>48,210</strong> — פספוס של פי 16,000. עם 3 שורות, Nested Loop (שלושה חיפושי PK) מושלם; עם 48 אלף זה 48 אלף קפיצות אקראיות, 0.82 ms כל אחת, 151 אלף דפים מהדיסק. אילו ידע, היה בוחר Hash Join. רואים כאן שתי סיבות נפרדות: הסטטיסטיקות של <code>status</code> ישנות (הצטבר backlog של הזמנות pending מאז ה-ANALYZE האחרון), ו-<code>status</code> ו-<code>region</code> <em>מתואמות</em>, אבל ה-planner מכפיל את ה-selectivity שלהן כאילו הן בלתי תלויות.</p>
<p>עוד דברים לחפש ב-plan:</p>
<ul><li><code>Rows Removed by Filter</code> הרבה יותר גדול מהשורות שחזרו ← index חסר או בסדר עמודות לא נכון.</li>
<li><code>Sort Method: external merge Disk: 812MB</code> ← המיון גלש לדיסק; הגדל <code>work_mem</code> ל-session הזה או הוסף index שנותן את הסדר.</li>
<li><code>Buffers: read=</code> גבוה ביחס ל-<code>hit=</code> ← data קר מהדיסק (או working set גדול מה-RAM).</li>
<li><code>Planning Time</code> ענק ← יותר מדי partitions שלא עברו pruning, או רשימת <code>IN</code> ענקית.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: <code>EXPLAIN ANALYZE</code> <em>מריץ</em> את ה-statement. עבור <code>UPDATE</code>/<code>DELETE</code> עוטפים: <code>BEGIN; EXPLAIN ANALYZE UPDATE ...; ROLLBACK;</code> — וזכור שהוא עדיין לוקח row locks בזמן הריצה. plans גדולים מדביקים ב-explain.dalibo.com או explain.depesz.com כדי למצוא מהר את ה-node היקר.</blockquote>`
      }
    },
    {
      h: { en: "Statistics: the planner is only as smart as its stats", he: "סטטיסטיקות: ה-planner חכם בדיוק כמו הסטטיסטיקות שלו" },
      body: {
        en: `<p>The planner estimates from <code>pg_statistic</code> (readable via <code>pg_stats</code>): null fraction, distinct count, the most common values with their frequencies, and a histogram — sampled from <code>300 × default_statistics_target</code> rows (100 → 30,000 rows). Autovacuum re-analyzes a table after <code>autovacuum_analyze_scale_factor</code> (10%) of rows change. On a 500M-row table that's 50M changes — days of drift during which "pending" might go from 0.001% to 5% of rows.</p>
<pre>-- what the planner believes
SELECT most_common_vals, most_common_freqs, n_distinct
FROM pg_stats WHERE tablename = 'orders' AND attname = 'status';
SELECT last_analyze, last_autoanalyze, n_mod_since_analyze
FROM pg_stat_user_tables WHERE relname = 'orders';

ANALYZE orders;                                          -- seconds, takes no blocking lock
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;  -- bigger sample for skewed cols
ALTER TABLE orders SET (autovacuum_analyze_scale_factor = 0.01);  -- re-analyze every 1%

-- teach it that columns are correlated (PG 10+; mcv in 12+)
CREATE STATISTICS orders_status_region (dependencies, mcv) ON status, region FROM orders;
ANALYZE orders;</pre>
<p>When does this bite? After a big bulk load or <code>pg_restore</code> (no stats at all until analyze — always run <code>ANALYZE</code> or <code>vacuumdb --analyze-in-stages</code> after a restore or a major upgrade with <code>pg_upgrade</code>, which does not carry stats over before PG 18); with "moving" values like <code>created_at &gt; now() - '5 min'</code> where the newest values are past the histogram's top; and with parameterized queries that switch to a <strong>generic plan</strong> after 5 executions (<code>plan_cache_mode</code>) — fine for uniform data, terrible for skewed tenants.</p>
<blockquote>💡 Real world: "The query got slow overnight with no deploy" is very often a plan flip: data crossed a threshold, stats changed, and the planner switched Hash Join → Nested Loop. Compare the plan now vs the one auto_explain logged yesterday; the fix is usually better stats, not a hint.</blockquote>`,
        he: `<p>ה-planner מעריך לפי <code>pg_statistic</code> (נקרא דרך <code>pg_stats</code>): אחוז NULLs, מספר ערכים שונים, הערכים הנפוצים והתדירות שלהם, ו-histogram — שנדגמים מ-<code>300 × default_statistics_target</code> שורות (100 ← 30,000 שורות). Autovacuum עושה analyze מחדש לטבלה אחרי ש-<code>autovacuum_analyze_scale_factor</code> (10%) מהשורות השתנו. בטבלה של 500 מיליון שורות זה 50 מיליון שינויים — ימים של סטייה, שבהם "pending" יכול לעבור מ-0.001% ל-5% מהשורות.</p>
<pre>-- what the planner believes
SELECT most_common_vals, most_common_freqs, n_distinct
FROM pg_stats WHERE tablename = 'orders' AND attname = 'status';
SELECT last_analyze, last_autoanalyze, n_mod_since_analyze
FROM pg_stat_user_tables WHERE relname = 'orders';

ANALYZE orders;                                          -- seconds, takes no blocking lock
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;  -- bigger sample for skewed cols
ALTER TABLE orders SET (autovacuum_analyze_scale_factor = 0.01);  -- re-analyze every 1%

-- teach it that columns are correlated (PG 10+; mcv in 12+)
CREATE STATISTICS orders_status_region (dependencies, mcv) ON status, region FROM orders;
ANALYZE orders;</pre>
<p>מתי זה נושך? אחרי bulk load גדול או <code>pg_restore</code> (אין סטטיסטיקות בכלל עד analyze — תמיד מריצים <code>ANALYZE</code> או <code>vacuumdb --analyze-in-stages</code> אחרי restore או major upgrade עם <code>pg_upgrade</code>, שלא מעביר סטטיסטיקות לפני PG 18); עם ערכים "זזים" כמו <code>created_at &gt; now() - '5 min'</code> שבהם הערכים החדשים נמצאים מעבר לקצה ה-histogram; ועם queries עם פרמטרים שעוברים ל-<strong>generic plan</strong> אחרי 5 הרצות (<code>plan_cache_mode</code>) — בסדר ל-data אחיד, נוראי ל-tenants מוטים.</p>
<blockquote>💡 מהשטח: "ה-query נהיה איטי בלילה בלי deploy" הוא הרבה פעמים plan flip: ה-data עבר סף, הסטטיסטיקות השתנו, וה-planner החליף Hash Join ב-Nested Loop. משווים את ה-plan של עכשיו לזה ש-auto_explain כתב אתמול; התיקון הוא בדרך כלל סטטיסטיקות טובות יותר, לא hint.</blockquote>`
      }
    },
    {
      h: { en: "Locks: when everything is slow at once", he: "Locks: כשהכול איטי בבת אחת" },
      body: {
        en: `<p>The signature of a lock pile-up: DB CPU <em>drops</em>, active connections climb to the pool limit, and every query touching one table times out. Find the tree of who blocks whom:</p>
<pre>SELECT pid, pg_blocking_pids(pid) AS blocked_by, state,
       wait_event_type || ':' || wait_event AS waiting_on,
       now() - xact_start AS xact_age, left(query, 60) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) &gt; 0
   OR pid IN (SELECT unnest(pg_blocking_pids(pid)) FROM pg_stat_activity)
ORDER BY xact_start;

  pid  | blocked_by |        state        |   waiting_on    | xact_age |                 query
-------+------------+---------------------+-----------------+----------+--------------------------------------
 18211 | {}         | idle in transaction | Client:ClientRead | 00:47:12 | SELECT * FROM orders WHERE id = 991
 20544 | {18211}    | active              | Lock:relation   | 00:02:03 | ALTER TABLE orders ADD COLUMN note text
 20561 | {20544}    | active              | Lock:relation   | 00:02:01 | SELECT * FROM orders WHERE customer_id
 20577 | {20544}    | active              | Lock:relation   | 00:02:01 | UPDATE orders SET status = $1 WHERE id
   ... 380 more rows blocked_by {20544}</pre>
<p>Read it bottom-up. Hundreds of ordinary queries are blocked by <strong>20544</strong>, the <code>ALTER TABLE</code>. The ALTER needs <code>ACCESS EXCLUSIVE</code>, and it's blocked by <strong>18211</strong> — a session that ran a <code>SELECT</code> 47 minutes ago inside a transaction and never committed, still holding <code>ACCESS SHARE</code>. Postgres's lock queue is <strong>fair</strong>: once the ALTER is waiting, every new request that conflicts with it (even a plain <code>SELECT</code>) queues <em>behind</em> it. So a 1 ms metadata change plus one forgotten transaction equals a full outage.</p>
<pre>SELECT pg_cancel_backend(20544);     -- cancel the ALTER: queue drains instantly
SELECT pg_terminate_backend(18211);  -- kill the idle-in-transaction root (rolls it back)</pre>
<p>Prevent it with timeouts (per role or in the migration session):</p>
<pre>SET lock_timeout = '3s';                        -- DDL gives up instead of queueing everyone
SET statement_timeout = '15min';                -- cap runaway queries
ALTER ROLE app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE app SET statement_timeout = '30s';</pre>
<p>Then retry the DDL in a loop with backoff until it gets its lock in a quiet moment. Remember the row-level counterpart too: <code>UPDATE</code>s on the same hot row (a counter, an inventory row) serialize on <code>Lock:transactionid</code> — the fix there is design (sharded counters, queueing), not timeouts.</p>`,
        he: `<p>החתימה של הצטברות locks: ה-CPU של ה-DB <em>יורד</em>, ה-connections הפעילים מטפסים עד גבול ה-pool, וכל query שנוגע בטבלה אחת נופל על timeout. מוצאים את העץ של מי חוסם את מי:</p>
<pre>SELECT pid, pg_blocking_pids(pid) AS blocked_by, state,
       wait_event_type || ':' || wait_event AS waiting_on,
       now() - xact_start AS xact_age, left(query, 60) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) &gt; 0
   OR pid IN (SELECT unnest(pg_blocking_pids(pid)) FROM pg_stat_activity)
ORDER BY xact_start;

  pid  | blocked_by |        state        |   waiting_on    | xact_age |                 query
-------+------------+---------------------+-----------------+----------+--------------------------------------
 18211 | {}         | idle in transaction | Client:ClientRead | 00:47:12 | SELECT * FROM orders WHERE id = 991
 20544 | {18211}    | active              | Lock:relation   | 00:02:03 | ALTER TABLE orders ADD COLUMN note text
 20561 | {20544}    | active              | Lock:relation   | 00:02:01 | SELECT * FROM orders WHERE customer_id
 20577 | {20544}    | active              | Lock:relation   | 00:02:01 | UPDATE orders SET status = $1 WHERE id
   ... 380 more rows blocked_by {20544}</pre>
<p>קוראים מלמטה למעלה. מאות queries רגילים חסומים ע״י <strong>20544</strong>, ה-<code>ALTER TABLE</code>. ה-ALTER צריך <code>ACCESS EXCLUSIVE</code>, והוא חסום ע״י <strong>18211</strong> — session שהריץ <code>SELECT</code> לפני 47 דקות בתוך transaction ואף פעם לא עשה commit, ועדיין מחזיק <code>ACCESS SHARE</code>. תור ה-locks של Postgres הוא <strong>הוגן</strong>: ברגע שה-ALTER מחכה, כל בקשה חדשה שמתנגשת איתו (אפילו <code>SELECT</code> רגיל) נעמדת בתור <em>מאחוריו</em>. אז שינוי metadata של 1 ms ועוד transaction אחת שנשכחה = outage מלא.</p>
<pre>SELECT pg_cancel_backend(20544);     -- cancel the ALTER: queue drains instantly
SELECT pg_terminate_backend(18211);  -- kill the idle-in-transaction root (rolls it back)</pre>
<p>מונעים את זה עם timeouts (לכל role או ב-session של ה-migration):</p>
<pre>SET lock_timeout = '3s';                        -- DDL gives up instead of queueing everyone
SET statement_timeout = '15min';                -- cap runaway queries
ALTER ROLE app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE app SET statement_timeout = '30s';</pre>
<p>ואז מריצים את ה-DDL שוב בלולאה עם backoff עד שהוא תופס את ה-lock ברגע שקט. זכור גם את המקבילה ברמת השורה: <code>UPDATE</code>s על אותה שורה חמה (counter, שורת מלאי) עומדים בתור על <code>Lock:transactionid</code> — שם הפתרון הוא design (sharded counters, תור), לא timeouts.</p>`
      }
    },
    {
      h: { en: "MySQL tooling, and the on-call playbook", he: "הכלים של MySQL, וה-playbook ל-on-call" },
      body: {
        en: `<p>MySQL has the same ideas under different names:</p>
<pre># slow log (my.cnf or SET GLOBAL)
slow_query_log = ON
long_query_time = 0.25
log_queries_not_using_indexes = ON     # noisy; enable briefly
$ pt-query-digest /var/log/mysql/slow.log | head -40   # aggregate like pg_stat_statements

-- top statements by total latency (performance_schema / sys)
SELECT digest_text, count_star, round(sum_timer_wait/1e12) AS total_s
FROM performance_schema.events_statements_summary_by_digest
ORDER BY sum_timer_wait DESC LIMIT 5;

SELECT * FROM sys.innodb_lock_waits\\G       -- row-lock waits: who blocks whom
SHOW ENGINE INNODB STATUS\\G                 -- LATEST DETECTED DEADLOCK, TRANSACTIONS
SHOW PROCESSLIST;  -- "Waiting for table metadata lock" = the ALTER pile-up, MySQL edition
SELECT * FROM sys.schema_unused_indexes;</pre>
<p>Key MySQL facts: row-lock waits time out after <code>innodb_lock_wait_timeout</code> = <strong>50 s</strong>, but metadata-lock waits use <code>lock_wait_timeout</code>, which defaults to <strong>31,536,000 s (one year)</strong> — so set it to a few seconds in migration sessions. <code>EXPLAIN ANALYZE</code> exists since 8.0.18; <code>EXPLAIN FORMAT=TREE</code> gives Postgres-like output.</p>
<p><strong>The playbook</strong> when "the DB is slow":</p>
<ol><li><strong>Is it everyone or one query?</strong> DB CPU high → expensive queries; CPU low + connections maxed → locks or pool exhaustion; IOPS at the cap → disk-bound (see Performance Insights / wait events).</li>
<li><strong>Locks first</strong> (it's the fastest to fix): run the blocker query. Cancel the DDL or terminate the idle-in-transaction root. Don't restart the DB — it kills everything and comes back with a cold cache.</li>
<li><strong>Top queries</strong>: <code>pg_stat_statements</code> by total time, compare with a baseline snapshot. New entry at the top → recent deploy (roll back). Same query, higher mean → plan flip or data growth.</li>
<li><strong>Plan</strong>: <code>EXPLAIN (ANALYZE, BUFFERS)</code> on a replica or in a rolled-back transaction; find the first 10x estimate miss.</li>
<li><strong>Fix the cause</strong>: <code>ANALYZE</code> / extended statistics, an index built <code>CONCURRENTLY</code>, rewrite, or fix N+1 in code.</li>
<li><strong>Prevent</strong>: timeouts per role, auto_explain on, a migration linter (squawk, strong_migrations) that rejects DDL without <code>lock_timeout</code>, alert on <code>max(now() - xact_start)</code>.</li></ol>`,
        he: `<p>ב-MySQL יש את אותם רעיונות בשמות אחרים:</p>
<pre># slow log (my.cnf or SET GLOBAL)
slow_query_log = ON
long_query_time = 0.25
log_queries_not_using_indexes = ON     # noisy; enable briefly
$ pt-query-digest /var/log/mysql/slow.log | head -40   # aggregate like pg_stat_statements

-- top statements by total latency (performance_schema / sys)
SELECT digest_text, count_star, round(sum_timer_wait/1e12) AS total_s
FROM performance_schema.events_statements_summary_by_digest
ORDER BY sum_timer_wait DESC LIMIT 5;

SELECT * FROM sys.innodb_lock_waits\\G       -- row-lock waits: who blocks whom
SHOW ENGINE INNODB STATUS\\G                 -- LATEST DETECTED DEADLOCK, TRANSACTIONS
SHOW PROCESSLIST;  -- "Waiting for table metadata lock" = the ALTER pile-up, MySQL edition
SELECT * FROM sys.schema_unused_indexes;</pre>
<p>עובדות מפתח ב-MySQL: המתנה ל-row lock נופלת אחרי <code>innodb_lock_wait_timeout</code> = <strong>50 שניות</strong>, אבל המתנה ל-metadata lock משתמשת ב-<code>lock_wait_timeout</code>, שברירת המחדל שלו היא <strong>31,536,000 שניות (שנה!)</strong> — אז קובעים אותו לכמה שניות ב-sessions של migrations. <code>EXPLAIN ANALYZE</code> קיים מאז 8.0.18; <code>EXPLAIN FORMAT=TREE</code> נותן פלט דומה ל-Postgres.</p>
<p><strong>ה-playbook</strong> כש"ה-DB איטי":</p>
<ol><li><strong>זה כולם או query אחד?</strong> CPU של ה-DB גבוה ← queries יקרים; CPU נמוך + connections בתקרה ← locks או מיצוי pool; IOPS בתקרה ← חסום על דיסק (תסתכל ב-Performance Insights / wait events).</li>
<li><strong>קודם locks</strong> (הכי מהיר לתקן): מריצים את ה-query של החוסמים. מבטלים את ה-DDL או הורגים את ה-root שתקוע idle in transaction. לא עושים restart ל-DB — זה הורג הכול וחוזר עם cache קר.</li>
<li><strong>Top queries</strong>: <code>pg_stat_statements</code> לפי זמן כולל, משווים ל-snapshot של baseline. רשומה חדשה בראש ← deploy אחרון (rollback). אותו query עם ממוצע גבוה יותר ← plan flip או גידול ב-data.</li>
<li><strong>Plan</strong>: <code>EXPLAIN (ANALYZE, BUFFERS)</code> על replica או בתוך transaction שעושה rollback; מוצאים את פספוס ההערכה הראשון של פי 10.</li>
<li><strong>מתקנים את הסיבה</strong>: <code>ANALYZE</code> / extended statistics, index שנבנה <code>CONCURRENTLY</code>, שכתוב, או תיקון N+1 בקוד.</li>
<li><strong>מונעים</strong>: timeouts לכל role, auto_explain דולק, migration linter (squawk, strong_migrations) שדוחה DDL בלי <code>lock_timeout</code>, alert על <code>max(now() - xact_start)</code>.</li></ol>`
      }
    }
  ],
  diagram: `"The DB is slow"
   |
   +-- CPU low, conns maxed, one table frozen?  --> LOCKS
   |      pg_stat_activity + pg_blocking_pids
   |      [idle in tx 47min] <- [ALTER waits ACCESS EXCLUSIVE] <- [380 queries queued]
   |      cancel ALTER / terminate root -> lock_timeout + retry, idle_in_tx timeout
   |
   +-- CPU high / IO high?                      --> QUERIES
          pg_stat_statements ORDER BY total_exec_time
          EXPLAIN (ANALYZE, BUFFERS): est rows=3 vs actual rows=48210 -> stats!
          ANALYZE / CREATE STATISTICS / index CONCURRENTLY / fix N+1`,
  handsOn: [
    { cmd: "psql -c \"SELECT pid, pg_blocking_pids(pid) AS blocked_by, state, wait_event_type, now()-xact_start AS age, left(query,50) FROM pg_stat_activity WHERE state <> 'idle' ORDER BY xact_start NULLS LAST;\"", what: { en: "See every non-idle session, oldest transaction first, with who blocks it.", he: "רואים כל session שאינו idle, ה-transaction הכי ישנה ראשונה, ומי חוסם אותו." } },
    { cmd: "psql -c \"SELECT calls, round(total_exec_time) AS total_ms, round(mean_exec_time::numeric,2) AS mean_ms, left(query,60) FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;\"", what: { en: "Top 10 query shapes by total DB time.", he: "10 צורות ה-query המובילות לפי זמן DB כולל." } },
    { cmd: "psql -c \"BEGIN; EXPLAIN (ANALYZE, BUFFERS) UPDATE orders SET status='x' WHERE id=1; ROLLBACK;\"", what: { en: "Get a real plan for a write without keeping its effect.", he: "מקבלים plan אמיתי לכתיבה בלי להשאיר את התוצאה שלה." } },
    { cmd: "psql -c \"SET lock_timeout='3s'; ALTER TABLE orders ADD COLUMN note text;\"", what: { en: "The safe-DDL habit: fail in 3 s instead of freezing the table.", he: "ההרגל של DDL בטוח: נכשל תוך 3 שניות במקום להקפיא את הטבלה." } },
    { cmd: "mysql -e \"SELECT * FROM sys.innodb_lock_waits\\G; SHOW ENGINE INNODB STATUS\\G\" | less", what: { en: "MySQL: current row-lock waits and the last detected deadlock.", he: "MySQL: המתנות ל-row locks כרגע וה-deadlock האחרון שזוהה." } }
  ],
  mnemonic: {
    en: "\"Total, not mean. Actual, not estimate. Blocker, not victim.\"",
    he: "\"כולל, לא ממוצע. מציאות, לא הערכה. החוסם, לא הקורבן.\""
  },
  pitfalls: [
    { en: "Killing the hundreds of waiting queries instead of the one blocker — they just reconnect and queue again behind the same ALTER.", he: "להרוג את מאות ה-queries שמחכים במקום את החוסם האחד — הם פשוט מתחברים שוב ונעמדים שוב בתור מאחורי אותו ALTER." },
    { en: "Running EXPLAIN ANALYZE on a heavy DELETE in production 'just to see the plan' — it actually deletes. Use plain EXPLAIN, or BEGIN ... ROLLBACK.", he: "להריץ EXPLAIN ANALYZE על DELETE כבד בפרודקשן \"רק כדי לראות את ה-plan\" — הוא באמת מוחק. השתמש ב-EXPLAIN רגיל, או ב-BEGIN ... ROLLBACK." },
    { en: "Sorting pg_stat_statements by mean time: you optimize a nightly 30 s report while a 2 ms query called 20M times a day eats 10x more DB time.", he: "למיין את pg_stat_statements לפי זמן ממוצע: אתה מייעל דוח לילי של 30 שניות בזמן ש-query של 2 ms שנקרא 20 מיליון פעם ביום אוכל פי 10 יותר זמן DB." },
    { en: "Forgetting ANALYZE after pg_restore, a bulk load or a major upgrade: the planner runs blind and picks nested loops over millions of rows.", he: "לשכוח ANALYZE אחרי pg_restore, bulk load או major upgrade: ה-planner עובד עיוור ובוחר nested loops על מיליוני שורות." }
  ],
  interview: [
    {
      q: { en: "All API endpoints touching the orders table time out, DB CPU is 15%. Walk me through the first five minutes.", he: "כל ה-endpoints שנוגעים בטבלת orders נופלים על timeout, ה-CPU של ה-DB ב-15%. תעביר אותי דרך חמש הדקות הראשונות." },
      a: {
        en: "Low CPU plus timeouts on one table smells like a lock queue, not load. Query pg_stat_activity with pg_blocking_pids to build the blocking tree. Typically an ALTER TABLE waiting for ACCESS EXCLUSIVE behind a long or idle-in-transaction session, with everything else queued behind the ALTER. Cancel the ALTER (instant relief), terminate the root if it's stuck, then rerun the migration with lock_timeout and retries, and set idle_in_transaction_session_timeout so it can't recur.",
        he: "CPU נמוך ו-timeouts על טבלה אחת מריח כמו תור locks, לא עומס. מריצים query על pg_stat_activity עם pg_blocking_pids ובונים את עץ החסימות. בדרך כלל זה ALTER TABLE שמחכה ל-ACCESS EXCLUSIVE מאחורי session ארוך או idle in transaction, וכל השאר בתור מאחורי ה-ALTER. מבטלים את ה-ALTER (הקלה מיידית), הורגים את ה-root אם הוא תקוע, ואז מריצים את ה-migration שוב עם lock_timeout ו-retries, ומגדירים idle_in_transaction_session_timeout כדי שזה לא יחזור."
      }
    },
    {
      q: { en: "An EXPLAIN ANALYZE shows a Nested Loop with estimated rows=5 and actual rows=200000. What happened and how do you fix it?", he: "EXPLAIN ANALYZE מראה Nested Loop עם הערכה של rows=5 ובפועל rows=200000. מה קרה ואיך מתקנים?" },
      a: {
        en: "The planner underestimated the outer side, so it chose a nested loop that's ideal for 5 rows and disastrous for 200k. Causes: stale stats (run ANALYZE, lower the analyze scale factor), skewed values needing a higher statistics target, or correlated predicates (CREATE STATISTICS with dependencies/mcv). Verify by re-running EXPLAIN after the fix; the plan should switch to a hash join.",
        he: "ה-planner העריך בחסר את הצד החיצוני, אז בחר nested loop שאידיאלי ל-5 שורות והרסני ל-200 אלף. סיבות: סטטיסטיקות ישנות (ANALYZE, להוריד את ה-analyze scale factor), ערכים מוטים שצריכים statistics target גבוה יותר, או תנאים מתואמים (CREATE STATISTICS עם dependencies/mcv). מאמתים בהרצה חוזרת של EXPLAIN אחרי התיקון; ה-plan אמור לעבור ל-hash join."
      }
    }
  ],
  quiz: [
    {
      q: { en: "An ALTER TABLE ADD COLUMN (metadata-only, 1 ms) caused a 10-minute outage. The most likely mechanism?", he: "ALTER TABLE ADD COLUMN (metadata בלבד, 1 ms) גרם ל-outage של 10 דקות. מה המנגנון הסביר?" },
      options: [
        { en: "It rewrote the whole table", he: "הוא כתב מחדש את כל הטבלה" },
        { en: "It waited for ACCESS EXCLUSIVE behind a long transaction, and all new queries queued behind it", he: "הוא חיכה ל-ACCESS EXCLUSIVE מאחורי transaction ארוכה, וכל ה-queries החדשים נעמדו בתור מאחוריו" },
        { en: "It filled the WAL disk", he: "הוא מילא את דיסק ה-WAL" },
        { en: "Autovacuum blocked it", he: "Autovacuum חסם אותו" }
      ],
      answer: 1,
      explain: { en: "Postgres lock queues are FIFO for conflicting requests: the waiting ALTER blocks every later SELECT/UPDATE on the table. lock_timeout makes it give up fast.", he: "תורי ה-locks ב-Postgres הם FIFO לבקשות מתנגשות: ה-ALTER שמחכה חוסם כל SELECT/UPDATE מאוחר יותר על הטבלה. lock_timeout גורם לו לוותר מהר." }
    },
    {
      q: { en: "In pg_stat_statements, which query should you usually optimize first?", he: "ב-pg_stat_statements, איזה query בדרך כלל כדאי לייעל ראשון?" },
      options: [
        { en: "The one with the highest mean_exec_time", he: "זה עם ה-mean_exec_time הכי גבוה" },
        { en: "The one with the highest total_exec_time", he: "זה עם ה-total_exec_time הכי גבוה" },
        { en: "The one with the most rows", he: "זה עם הכי הרבה rows" },
        { en: "The most recent one", he: "האחרון שרץ" }
      ],
      answer: 1,
      explain: { en: "Total time = calls × mean: it's the share of DB capacity the query consumes. A cheap query called millions of times often dominates.", he: "זמן כולל = calls × mean: זה החלק מקיבולת ה-DB שה-query צורך. query זול שנקרא מיליוני פעמים בדרך כלל שולט." }
    },
    {
      q: { en: "Which session state is a common hidden root blocker?", he: "איזה state של session הוא חוסם שורש נסתר נפוץ?" },
      options: [
        { en: "idle", he: "idle" },
        { en: "active", he: "active" },
        { en: "idle in transaction", he: "idle in transaction" },
        { en: "disabled", he: "disabled" }
      ],
      answer: 2,
      explain: { en: "An open transaction keeps every lock it took (and holds back vacuum) while doing nothing. idle_in_transaction_session_timeout kills such sessions automatically.", he: "transaction פתוחה מחזיקה כל lock שהיא לקחה (ומעכבת את ה-vacuum) בלי לעשות כלום. idle_in_transaction_session_timeout הורג sessions כאלה אוטומטית." }
    },
    {
      q: { en: "In MySQL, why does an online-schema migration sometimes hang for a very long time without erroring?", he: "ב-MySQL, למה migration של schema לפעמים נתקע לזמן ארוך מאוד בלי שגיאה?" },
      options: [
        { en: "innodb_lock_wait_timeout is infinite", he: "innodb_lock_wait_timeout אינסופי" },
        { en: "Metadata-lock waits use lock_wait_timeout, which defaults to one year", he: "המתנה ל-metadata lock משתמשת ב-lock_wait_timeout, שברירת המחדל שלו היא שנה" },
        { en: "The slow log is full", he: "ה-slow log מלא" },
        { en: "performance_schema is disabled", he: "performance_schema כבוי" }
      ],
      answer: 1,
      explain: { en: "lock_wait_timeout (MDL) defaults to 31,536,000 seconds. Set it to a few seconds in migration sessions; innodb_lock_wait_timeout (50 s) only covers row locks.", he: "lock_wait_timeout (MDL) ברירת המחדל שלו 31,536,000 שניות. קובעים אותו לכמה שניות ב-sessions של migrations; innodb_lock_wait_timeout (50 שניות) מכסה רק row locks." }
    }
  ],
  related: ["db-indexes", "db-index-kinds", "db-transactions", "db-operations", "staff-postgres-at-scale", "staff-zero-downtime-migrations"]
});

// ---------------------------------------------------------------------------
// 3. Table partitioning
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-partitioning",
  track: "data",
  order: 32,
  icon: "🗃️",
  level: 3,
  minutes: 15,
  title: { en: "Table Partitioning (vs Sharding)", he: "Partitioning של טבלאות (מול sharding)" },
  tldr: {
    en: "Partitioning splits one big table into many smaller tables on the same server so queries prune irrelevant partitions and retention becomes DROP instead of DELETE; it doesn't add capacity like sharding does, and the partition key must appear in your queries and in every unique constraint.",
    he: "Partitioning מפצל טבלה אחת גדולה להרבה טבלאות קטנות על אותו שרת, כך ש-queries עושים pruning ל-partitions לא רלוונטיים ו-retention הופך ל-DROP במקום DELETE; זה לא מוסיף קיבולת כמו sharding, וה-partition key חייב להופיע ב-queries שלך ובכל unique constraint."
  },
  analogy: {
    en: "An accounting firm keeps one giant binder of all invoices since 2015. Splitting it into one binder per month — on the same shelf — makes 'show March 2026' fast and lets you shred 2015 by throwing out whole binders. But it's still one shelf in one office: if the office is too small, you need a second office (sharding). And a question like 'all invoices for client X' still means opening every binder, unless client is how you split.",
    he: "משרד רואי חשבון מחזיק קלסר ענק אחד של כל החשבוניות מאז 2015. לפצל אותו לקלסר לכל חודש — על אותו מדף — הופך את \"תראה לי את מרץ 2026\" למהיר ונותן לגרוס את 2015 ע״י זריקת קלסרים שלמים. אבל זה עדיין מדף אחד במשרד אחד: אם המשרד קטן מדי, צריך משרד שני (sharding). ושאלה כמו \"כל החשבוניות של לקוח X\" עדיין אומרת לפתוח כל קלסר — אלא אם פיצלת לפי לקוח."
  },
  sections: [
    {
      h: { en: "Partitioning vs sharding: one node vs many", he: "Partitioning מול sharding: node אחד מול הרבה" },
      body: {
        en: `<p>Lesson <code>db-sharding</code> introduced the distinction; here's the precise version:</p>
<table><tr><th></th><th>Partitioning</th><th>Sharding</th></tr>
<tr><td>Where</td><td>One database server, one catalog</td><td>Many servers, each owns a subset</td></tr>
<tr><td>Adds CPU/RAM/IOPS?</td><td>No — same machine</td><td>Yes — that's the point</td></tr>
<tr><td>Transactions, FKs, JOINs</td><td>Normal, ACID across partitions</td><td>Cross-shard = distributed (2PC / sagas)</td></tr>
<tr><td>Routing</td><td>The planner, automatically</td><td>App, proxy (Vitess) or extension (Citus)</td></tr>
<tr><td>Main wins</td><td>Pruning, cheap retention, smaller indexes, per-partition maintenance</td><td>Write throughput, storage beyond one box</td></tr></table>
<p>Partitioning solves <strong>manageability</strong> problems of a big table: a 4 TB table whose vacuum takes 30 hours, whose indexes don't fit in RAM, and whose daily retention <code>DELETE</code> creates 200M dead tuples. It does not make a CPU-bound primary faster. The two compose: Citus shards a table across workers, and each shard can itself be partitioned by time.</p>
<blockquote>💡 Real world: The usual trigger isn't query speed — it's retention and vacuum. "We must keep 90 days of events and the nightly DELETE runs for 6 hours and bloats the table" is the textbook case for monthly or daily partitions.</blockquote>`,
        he: `<p>השיעור <code>db-sharding</code> הציג את ההבחנה; הנה הגרסה המדויקת:</p>
<table><tr><th></th><th>Partitioning</th><th>Sharding</th></tr>
<tr><td>איפה</td><td>שרת DB אחד, catalog אחד</td><td>הרבה שרתים, כל אחד מחזיק חלק</td></tr>
<tr><td>מוסיף CPU/RAM/IOPS?</td><td>לא — אותה מכונה</td><td>כן — זה כל העניין</td></tr>
<tr><td>Transactions, FKs, JOINs</td><td>רגיל, ACID בין partitions</td><td>בין shards = מבוזר (2PC / sagas)</td></tr>
<tr><td>ניתוב</td><td>ה-planner, אוטומטית</td><td>האפליקציה, proxy (Vitess) או extension (Citus)</td></tr>
<tr><td>הרווח העיקרי</td><td>Pruning, retention זול, indexes קטנים, תחזוקה לכל partition</td><td>throughput של כתיבה, storage מעבר לקופסה אחת</td></tr></table>
<p>Partitioning פותר בעיות <strong>ניהול</strong> של טבלה גדולה: טבלה של 4 TB שה-vacuum שלה לוקח 30 שעות, שה-indexes שלה לא נכנסים ל-RAM, ושה-<code>DELETE</code> היומי של ה-retention שלה יוצר 200 מיליון dead tuples. הוא לא הופך primary שחסום על CPU למהיר יותר. השניים משתלבים: Citus עושה sharding לטבלה על פני workers, וכל shard יכול בעצמו להיות מחולק ל-partitions לפי זמן.</p>
<blockquote>💡 מהשטח: הטריגר הרגיל הוא לא מהירות queries — זה retention ו-vacuum. "אנחנו חייבים לשמור 90 יום של events וה-DELETE הלילי רץ 6 שעות ומנפח את הטבלה" זה מקרה ספר הלימוד ל-partitions חודשיים או יומיים.</blockquote>`
      }
    },
    {
      h: { en: "Range, list, hash: real Postgres DDL", he: "Range, list, hash: DDL אמיתי ב-Postgres" },
      body: {
        en: `<p>Declarative partitioning exists since Postgres 10 (hash partitioning, default partitions and PKs on partitioned tables since 11). The parent holds no data; each partition is a real table.</p>
<pre>-- RANGE: time series, the 90% case
CREATE TABLE events (
  id         bigint GENERATED ALWAYS AS IDENTITY,
  tenant_id  int         NOT NULL,
  created_at timestamptz NOT NULL,
  payload    jsonb,
  PRIMARY KEY (id, created_at)              -- must include the partition key!
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_11 PARTITION OF events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');   -- lower inclusive, upper exclusive
CREATE TABLE events_default PARTITION OF events DEFAULT; -- catches strays (keep it empty!)

CREATE INDEX ON events (tenant_id, created_at);  -- creates a matching index on every partition

-- LIST: discrete values (region, tier)
CREATE TABLE accounts (...) PARTITION BY LIST (region);
CREATE TABLE accounts_eu PARTITION OF accounts FOR VALUES IN ('eu-west','eu-central');

-- HASH: spread evenly when there's no natural range (PG 11+)
CREATE TABLE sessions (...) PARTITION BY HASH (user_id);
CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 16, REMAINDER 0);
-- ... p1..p15</pre>
<p>You can sub-partition (range by month, then hash by tenant), but every level multiplies the partition count. Inserts whose key has no partition fail with <code>ERROR: no partition of relation "events" found for row</code> — which is why pre-creating future partitions matters. A <code>DEFAULT</code> partition prevents that error but has a trap: when you later create a partition for a range, Postgres must scan the default partition to make sure no rows belong to the new range, under a lock.</p>
<p>Hash partitioning is for spreading I/O and vacuum work, not for pruning by range; changing the modulus later means rewriting everything. It's also the closest single-node analogue of hash sharding.</p>`,
        he: `<p>Declarative partitioning קיים מאז Postgres 10 (hash partitioning, default partitions ו-PK על טבלאות מחולקות מאז 11). ה-parent לא מחזיק data; כל partition הוא טבלה אמיתית.</p>
<pre>-- RANGE: time series, the 90% case
CREATE TABLE events (
  id         bigint GENERATED ALWAYS AS IDENTITY,
  tenant_id  int         NOT NULL,
  created_at timestamptz NOT NULL,
  payload    jsonb,
  PRIMARY KEY (id, created_at)              -- must include the partition key!
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_11 PARTITION OF events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');   -- lower inclusive, upper exclusive
CREATE TABLE events_default PARTITION OF events DEFAULT; -- catches strays (keep it empty!)

CREATE INDEX ON events (tenant_id, created_at);  -- creates a matching index on every partition

-- LIST: discrete values (region, tier)
CREATE TABLE accounts (...) PARTITION BY LIST (region);
CREATE TABLE accounts_eu PARTITION OF accounts FOR VALUES IN ('eu-west','eu-central');

-- HASH: spread evenly when there's no natural range (PG 11+)
CREATE TABLE sessions (...) PARTITION BY HASH (user_id);
CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 16, REMAINDER 0);
-- ... p1..p15</pre>
<p>אפשר לעשות sub-partitioning (range לפי חודש, ואז hash לפי tenant), אבל כל רמה מכפילה את מספר ה-partitions. inserts שאין partition ל-key שלהם נכשלים עם <code>ERROR: no partition of relation "events" found for row</code> — ולכן חשוב ליצור מראש partitions עתידיים. partition מסוג <code>DEFAULT</code> מונע את השגיאה אבל יש בו מלכודת: כשאתה יוצר אחר כך partition לטווח, Postgres חייב לסרוק את ה-default כדי לוודא שאין בו שורות ששייכות לטווח החדש — תחת lock.</p>
<p>Hash partitioning נועד לפזר I/O ועבודת vacuum, לא ל-pruning לפי טווח; לשנות את ה-modulus אחר כך אומר לכתוב הכול מחדש. זו גם האנלוגיה הכי קרובה, על node אחד, ל-hash sharding.</p>`
      }
    },
    {
      h: { en: "Pruning, partition-wise joins, and global uniqueness", he: "Pruning, partition-wise joins, ו-uniqueness גלובלי" },
      body: {
        en: `<p><strong>Partition pruning</strong> removes partitions that can't match. It happens at plan time for constants and at execution time (PG 11+) for parameters and stable functions like <code>now()</code>:</p>
<pre>EXPLAIN SELECT count(*) FROM events WHERE created_at &gt;= now() - interval '1 day';
 Aggregate
   -&gt;  Append
         Subplans Removed: 34                       &lt;-- runtime pruning worked
         -&gt;  Index Only Scan using events_2026_11_created_at_idx on events_2026_11</pre>
<p>Pruning does <strong>not</strong> happen when:</p>
<ul><li>The query doesn't filter on the partition key: <code>WHERE tenant_id = 7</code> on a table partitioned by time scans all 36 partitions (36 index lookups, 36x planning work).</li>
<li>The key is wrapped in an expression: <code>WHERE date_trunc('day', created_at) = '2026-11-14'</code> or <code>WHERE created_at::date = ...</code>. Rewrite as a range: <code>created_at &gt;= '2026-11-14' AND created_at &lt; '2026-11-15'</code>.</li>
<li><code>enable_partition_pruning</code> is off, or a type mismatch blocks it (comparing timestamptz with a text parameter through a cast on the column).</li>
<li>The filter comes from a join (<code>JOIN dates d ON e.created_at = d.day WHERE d.flag</code>): runtime pruning only happens for nested loop parameters, not for hash joins.</li></ul>
<p><strong>Partition-wise joins and aggregates</strong>: if two tables are partitioned identically (same key, same bounds) and joined on the key, Postgres can join partition-to-partition instead of building one giant hash table. Both <code>enable_partitionwise_join</code> and <code>enable_partitionwise_aggregate</code> are <strong>off by default</strong> because they increase planning time; turn them on per session for analytics.</p>
<p><strong>Uniqueness</strong>: Postgres has no global indexes. A <code>PRIMARY KEY</code> or <code>UNIQUE</code> constraint must include all partition key columns, because each partition enforces it locally. So "email is unique across all of <code>users</code>" can't be enforced if users is partitioned by <code>created_at</code>. Options: partition by the unique key instead, keep a small non-partitioned lookup table (<code>user_emails(email PRIMARY KEY, user_id)</code>), or rely on globally unique generated ids (identity/UUIDv7) and accept <code>(id, created_at)</code> as the PK. Foreign keys <em>referencing</em> a partitioned table are supported since PG 12, but they need that composite key.</p>
<blockquote>⚠️ Production tip: Count the cost of unpruned queries. A query that touches 1,000 partitions has to plan and lock all 1,000 (each partition and each of its indexes needs a lock), which overflows the per-backend fast-path lock slots and causes <code>LWLock:LockManager</code> contention at high QPS. Keep partitions in the hundreds, not tens of thousands, and make every hot query filter on the key.</blockquote>`,
        he: `<p><strong>Partition pruning</strong> מוציא partitions שלא יכולים להתאים. זה קורה בזמן ה-planning לקבועים, ובזמן הריצה (PG 11+) לפרמטרים ולפונקציות stable כמו <code>now()</code>:</p>
<pre>EXPLAIN SELECT count(*) FROM events WHERE created_at &gt;= now() - interval '1 day';
 Aggregate
   -&gt;  Append
         Subplans Removed: 34                       &lt;-- runtime pruning worked
         -&gt;  Index Only Scan using events_2026_11_created_at_idx on events_2026_11</pre>
<p>Pruning <strong>לא</strong> קורה כש:</p>
<ul><li>ה-query לא מסנן לפי ה-partition key: <code>WHERE tenant_id = 7</code> על טבלה שמחולקת לפי זמן סורק את כל 36 ה-partitions (36 חיפושים ב-index, פי 36 עבודת planning).</li>
<li>ה-key עטוף בביטוי: <code>WHERE date_trunc('day', created_at) = '2026-11-14'</code> או <code>WHERE created_at::date = ...</code>. כותבים מחדש כטווח: <code>created_at &gt;= '2026-11-14' AND created_at &lt; '2026-11-15'</code>.</li>
<li><code>enable_partition_pruning</code> כבוי, או אי-התאמה של טיפוסים חוסמת אותו (השוואה של timestamptz לפרמטר טקסט דרך cast על העמודה).</li>
<li>הסינון מגיע מ-join (<code>JOIN dates d ON e.created_at = d.day WHERE d.flag</code>): runtime pruning קורה רק לפרמטרים של nested loop, לא ל-hash joins.</li></ul>
<p><strong>Partition-wise joins ו-aggregates</strong>: אם שתי טבלאות מחולקות באופן זהה (אותו key, אותם גבולות) ומחוברות לפי ה-key, Postgres יכול לעשות join של partition מול partition במקום לבנות hash table ענק אחד. גם <code>enable_partitionwise_join</code> וגם <code>enable_partitionwise_aggregate</code> <strong>כבויים כברירת מחדל</strong> כי הם מגדילים את זמן ה-planning; מדליקים אותם ל-session של analytics.</p>
<p><strong>Uniqueness</strong>: ב-Postgres אין global indexes. <code>PRIMARY KEY</code> או <code>UNIQUE</code> חייבים לכלול את כל עמודות ה-partition key, כי כל partition אוכף אותם מקומית. אז "email ייחודי בכל טבלת <code>users</code>" לא ניתן לאכיפה אם users מחולקת לפי <code>created_at</code>. אפשרויות: לחלק לפי ה-key הייחודי, להחזיק טבלת lookup קטנה לא מחולקת (<code>user_emails(email PRIMARY KEY, user_id)</code>), או לסמוך על ids ייחודיים גלובלית (identity/UUIDv7) ולקבל את <code>(id, created_at)</code> כ-PK. Foreign keys ש<em>מצביעים</em> לטבלה מחולקת נתמכים מאז PG 12, אבל הם צריכים את ה-key המורכב הזה.</p>
<blockquote>⚠️ טיפ לפרודקשן: תחשב את המחיר של queries בלי pruning. query שנוגע ב-1,000 partitions צריך לתכנן ולנעול את כל ה-1,000 (כל partition וכל index שלו צריכים lock), וזה גולש מעבר ל-slots של fast-path locks לכל backend וגורם לתחרות על <code>LWLock:LockManager</code> ב-QPS גבוה. תחזיק partitions במאות, לא בעשרות אלפים, ותדאג שכל query חם יסנן לפי ה-key.</blockquote>`
      }
    },
    {
      h: { en: "Retention, pg_partman, and choosing key & size", he: "Retention, pg_partman, ובחירת key וגודל" },
      body: {
        en: `<p><strong>Retention by DROP vs DELETE</strong>: deleting 30 days of a 3B-row table (~250M rows) writes 250M dead tuples, generates tens of GB of WAL (replicas lag), and leaves bloat that vacuum must clean for hours — while the table never shrinks on disk. Dropping a partition is a catalog operation: milliseconds, no WAL for the data, disk space returned immediately.</p>
<pre>ALTER TABLE events DETACH PARTITION events_2026_08 CONCURRENTLY;  -- PG 14+, no long lock on parent
DROP TABLE events_2026_08;            -- or: pg_dump it to S3 first, then drop</pre>
<p><strong>pg_partman</strong> automates creating future partitions and dropping old ones (v5 syntax):</p>
<pre>CREATE EXTENSION pg_partman SCHEMA partman;
SELECT partman.create_parent(
  p_parent_table =&gt; 'public.events',
  p_control      =&gt; 'created_at',
  p_interval     =&gt; '1 day',
  p_premake      =&gt; 7);              -- always keep 7 future partitions ready
UPDATE partman.part_config
   SET retention = '90 days', retention_keep_table = false
 WHERE parent_table = 'public.events';
-- run maintenance hourly: pg_partman_bgw background worker, or pg_cron:
SELECT cron.schedule('@hourly', $$CALL partman.run_maintenance_proc()$$);</pre>
<p>Monitor it: if maintenance silently stops, you'll hit "no partition found" errors the day premake runs out — alert on "newest partition upper bound - now() &lt; 2 days".</p>
<p><strong>Choosing the key</strong>: it must be (1) in the <code>WHERE</code> of your hot queries, (2) the axis you expire data on, and (3) immutable — updating the key moves the row between partitions (a delete + insert). <code>created_at</code> fits almost every event/log/audit table. <strong>Choosing the size</strong>: aim for partitions of roughly a few GB to ~50 GB, and a total count in the tens to low hundreds. 1 TB/month → daily partitions (~33 GB each). 20 GB/month → monthly. Thousands of tiny daily partitions make planning slower than the scan you saved.</p>`,
        he: `<p><strong>Retention ע״י DROP מול DELETE</strong>: מחיקה של 30 יום מטבלה של 3 מיליארד שורות (בערך 250 מיליון שורות) כותבת 250 מיליון dead tuples, מייצרת עשרות GB של WAL (ה-replicas מפגרים), ומשאירה bloat שה-vacuum צריך לנקות שעות — והטבלה אף פעם לא מתכווצת בדיסק. מחיקת partition היא פעולת catalog: מילישניות, בלי WAL ל-data, והמקום בדיסק חוזר מיד.</p>
<pre>ALTER TABLE events DETACH PARTITION events_2026_08 CONCURRENTLY;  -- PG 14+, no long lock on parent
DROP TABLE events_2026_08;            -- or: pg_dump it to S3 first, then drop</pre>
<p><strong>pg_partman</strong> עושה אוטומציה ליצירת partitions עתידיים ולמחיקת ישנים (תחביר v5):</p>
<pre>CREATE EXTENSION pg_partman SCHEMA partman;
SELECT partman.create_parent(
  p_parent_table =&gt; 'public.events',
  p_control      =&gt; 'created_at',
  p_interval     =&gt; '1 day',
  p_premake      =&gt; 7);              -- always keep 7 future partitions ready
UPDATE partman.part_config
   SET retention = '90 days', retention_keep_table = false
 WHERE parent_table = 'public.events';
-- run maintenance hourly: pg_partman_bgw background worker, or pg_cron:
SELECT cron.schedule('@hourly', $$CALL partman.run_maintenance_proc()$$);</pre>
<p>תנטר את זה: אם ה-maintenance מפסיק בשקט, תקבל שגיאות "no partition found" ביום שה-premake נגמר — alert על "הגבול העליון של ה-partition החדש ביותר פחות now() קטן מיומיים".</p>
<p><strong>בחירת ה-key</strong>: הוא חייב להיות (1) ב-<code>WHERE</code> של ה-queries החמים, (2) הציר שלפיו data פג תוקף, ו-(3) קבוע — עדכון ה-key מעביר את השורה בין partitions (delete + insert). <code>created_at</code> מתאים כמעט לכל טבלת events/logs/audit. <strong>בחירת הגודל</strong>: כוון ל-partitions בסדר גודל של כמה GB עד בערך 50 GB, ולמספר כולל של עשרות עד מאות בודדות. 1 TB לחודש ← partitions יומיים (בערך 33 GB כל אחד). 20 GB לחודש ← חודשיים. אלפי partitions יומיים קטנטנים הופכים את ה-planning לאיטי יותר מהסריקה שחסכת.</p>`
      }
    },
    {
      h: { en: "MySQL, BigQuery, ClickHouse — and migrating a live table", he: "MySQL, BigQuery, ClickHouse — והעברה של טבלה חיה" },
      body: {
        en: `<p><strong>MySQL</strong> supports <code>RANGE</code>, <code>LIST</code>, <code>HASH</code> and <code>KEY</code> partitioning, up to 8,192 partitions. Same uniqueness rule, stricter: <em>every</em> unique key (including the PK) must include all partitioning columns, and partitioned InnoDB tables can't have foreign keys at all. Retention is <code>ALTER TABLE logs DROP PARTITION p2026_08;</code> and <code>EXCHANGE PARTITION</code> swaps a partition with a plain table instantly (great for bulk loads and archiving).</p>
<p><strong>BigQuery</strong> partitions by a DATE/TIMESTAMP column, ingestion time, or integer range (up to 10,000 partitions per table), and <em>clusters</em> within a partition by up to 4 columns. Since you pay per byte scanned, pruning is a cost control: set <code>require_partition_filter = true</code> so a query without a date filter fails instead of scanning 40 TB (~$250 at on-demand pricing).</p>
<p><strong>ClickHouse</strong>: <code>PARTITION BY toYYYYMM(ts)</code> is for data management (drop, move to cold storage, TTL); the <code>ORDER BY</code> sorting key is what makes queries fast. Over-partitioning (e.g. by user id) creates too many small parts and triggers <code>Too many parts</code> insert errors — monthly or daily is the norm.</p>
<p><strong>Migrating an existing 2 TB table online</strong> (Postgres): you can't <code>ALTER TABLE ... PARTITION BY</code> in place. The low-downtime pattern:</p>
<pre>-- 1. Prove the old data fits one range without a long lock
ALTER TABLE events ADD CONSTRAINT events_legacy_range
  CHECK (created_at &gt;= '2015-01-01' AND created_at &lt; '2026-12-01') NOT VALID;
ALTER TABLE events VALIDATE CONSTRAINT events_legacy_range;  -- scans, but allows reads+writes

-- 2. Swap in one short transaction (with lock_timeout + retry)
BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE events RENAME TO events_legacy;
CREATE TABLE events (LIKE events_legacy INCLUDING DEFAULTS) PARTITION BY RANGE (created_at);
ALTER TABLE events ATTACH PARTITION events_legacy
  FOR VALUES FROM ('2015-01-01') TO ('2026-12-01');   -- skips the scan: CHECK already proves it
CREATE TABLE events_2026_12 PARTITION OF events FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
COMMIT;
-- 3. New rows land in new partitions; the legacy one ages out and is dropped
--    after the retention window (or is moved out in batches into proper partitions).</pre>
<p>Watch the details: indexes and the PK must be created on the parent (the legacy partition's matching indexes get attached), the PK must now include <code>created_at</code>, and sequences/identity must keep working. The alternatives — logical replication into a new partitioned table and a cutover, or batch-copying with triggers — take longer but avoid one giant legacy partition.</p>`,
        he: `<p><strong>MySQL</strong> תומך ב-partitioning מסוג <code>RANGE</code>, <code>LIST</code>, <code>HASH</code> ו-<code>KEY</code>, עד 8,192 partitions. אותו חוק uniqueness, רק קשוח יותר: <em>כל</em> unique key (כולל ה-PK) חייב לכלול את כל עמודות ה-partitioning, וטבלאות InnoDB מחולקות לא יכולות להחזיק foreign keys בכלל. Retention זה <code>ALTER TABLE logs DROP PARTITION p2026_08;</code>, ו-<code>EXCHANGE PARTITION</code> מחליף partition בטבלה רגילה באופן מיידי (מצוין ל-bulk loads ולארכוב).</p>
<p><strong>BigQuery</strong> מחלק לפי עמודת DATE/TIMESTAMP, זמן ingestion, או טווח של integer (עד 10,000 partitions לטבלה), ועושה <em>clustering</em> בתוך partition לפי עד 4 עמודות. מכיוון שמשלמים לפי bytes שנסרקו, pruning הוא בקרת עלויות: מגדירים <code>require_partition_filter = true</code> כדי ש-query בלי סינון תאריך ייכשל במקום לסרוק 40 TB (בערך $250 במחיר on-demand).</p>
<p><strong>ClickHouse</strong>: <code>PARTITION BY toYYYYMM(ts)</code> נועד לניהול data (מחיקה, העברה ל-cold storage, TTL); ה-sorting key ב-<code>ORDER BY</code> הוא מה שהופך queries למהירים. over-partitioning (למשל לפי user id) יוצר יותר מדי parts קטנים וגורם לשגיאות insert של <code>Too many parts</code> — חודשי או יומי זה הנורמה.</p>
<p><strong>להעביר טבלה קיימת של 2 TB ל-partitions online</strong> (Postgres): אי אפשר לעשות <code>ALTER TABLE ... PARTITION BY</code> במקום. הדפוס עם מינימום downtime:</p>
<pre>-- 1. Prove the old data fits one range without a long lock
ALTER TABLE events ADD CONSTRAINT events_legacy_range
  CHECK (created_at &gt;= '2015-01-01' AND created_at &lt; '2026-12-01') NOT VALID;
ALTER TABLE events VALIDATE CONSTRAINT events_legacy_range;  -- scans, but allows reads+writes

-- 2. Swap in one short transaction (with lock_timeout + retry)
BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE events RENAME TO events_legacy;
CREATE TABLE events (LIKE events_legacy INCLUDING DEFAULTS) PARTITION BY RANGE (created_at);
ALTER TABLE events ATTACH PARTITION events_legacy
  FOR VALUES FROM ('2015-01-01') TO ('2026-12-01');   -- skips the scan: CHECK already proves it
CREATE TABLE events_2026_12 PARTITION OF events FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
COMMIT;
-- 3. New rows land in new partitions; the legacy one ages out and is dropped
--    after the retention window (or is moved out in batches into proper partitions).</pre>
<p>שים לב לפרטים: indexes וה-PK צריכים להיווצר על ה-parent (ה-indexes התואמים של ה-partition הישן מצורפים אליהם), ה-PK חייב עכשיו לכלול את <code>created_at</code>, ו-sequences/identity צריכים להמשיך לעבוד. החלופות — logical replication לטבלה מחולקת חדשה ו-cutover, או העתקה ב-batches עם triggers — לוקחות יותר זמן אבל חוסכות partition ישן אחד ענק.</p>`
      }
    }
  ],
  diagram: `                 events  (parent, PARTITION BY RANGE created_at, no data)
   +---------------+---------------+---------------+---------------+
   | events_2026_08| events_2026_09| events_2026_10| events_2026_11|  + premade 12, 01 ...
   |   DROP  <--   |               |               |   hot, in RAM |
   +---------------+---------------+---------------+---------------+
   WHERE created_at >= now()-'1 day'  -> Subplans Removed: 3 (pruned)
   WHERE tenant_id = 7                -> scans all partitions (no pruning)

 Partitioning: 1 server, N tables     Sharding: N servers (see db-sharding)
   [ PG primary: p1 p2 p3 p4 ]          [PG A: t1-t100] [PG B: t101-t200] ...`,
  handsOn: [
    { cmd: "psql -c \"SELECT inhrelid::regclass AS partition, pg_size_pretty(pg_total_relation_size(inhrelid)) AS size FROM pg_inherits WHERE inhparent = 'events'::regclass ORDER BY 1;\"", what: { en: "List all partitions of a table with their sizes.", he: "מציג את כל ה-partitions של טבלה עם הגדלים שלהם." } },
    { cmd: "psql -c \"EXPLAIN SELECT count(*) FROM events WHERE created_at >= now() - interval '1 day';\"", what: { en: "Confirm pruning: look for 'Subplans Removed' or only recent partitions in the plan.", he: "מוודאים pruning: מחפשים 'Subplans Removed' או רק partitions אחרונים ב-plan." } },
    { cmd: "psql -c \"EXPLAIN SELECT count(*) FROM events WHERE created_at::date = current_date;\"", what: { en: "See pruning fail when the key is wrapped in a cast — every partition appears.", he: "רואים את ה-pruning נכשל כשה-key עטוף ב-cast — כל ה-partitions מופיעים." } },
    { cmd: "psql -c \"SELECT parent_table, partition_interval, premake, retention FROM partman.part_config;\"", what: { en: "Check pg_partman's configuration for each managed table.", he: "בודקים את התצורה של pg_partman לכל טבלה מנוהלת." } }
  ],
  mnemonic: {
    en: "\"Partition to forget, shard to grow.\" Partitions make old data cheap to drop; shards make the system bigger.",
    he: "\"Partition כדי לשכוח, shard כדי לגדול.\" Partitions הופכים data ישן לזול למחיקה; shards הופכים את המערכת לגדולה יותר."
  },
  pitfalls: [
    { en: "Partitioning by time when most queries filter by tenant_id: nothing prunes, every query hits every partition, and things get slower than the unpartitioned table.", he: "לחלק לפי זמן כשרוב ה-queries מסננים לפי tenant_id: שום דבר לא נחתך, כל query פוגע בכל partition, והכול נהיה איטי יותר מהטבלה הלא מחולקת." },
    { en: "Forgetting to pre-create future partitions (or pg_partman maintenance silently stopping): at midnight on the 1st, every insert fails with 'no partition of relation found for row'.", he: "לשכוח ליצור מראש partitions עתידיים (או ש-maintenance של pg_partman מפסיק בשקט): בחצות ב-1 לחודש, כל insert נכשל עם 'no partition of relation found for row'." },
    { en: "Expecting a global UNIQUE (email, order_number) on a table partitioned by date — Postgres requires the partition key in every unique constraint.", he: "לצפות ל-UNIQUE גלובלי (email, order_number) בטבלה שמחולקת לפי תאריך — Postgres דורש את ה-partition key בכל unique constraint." },
    { en: "Creating thousands of tiny partitions: planning time and lock-manager overhead exceed what pruning saves.", he: "ליצור אלפי partitions זעירים: זמן ה-planning וה-overhead של ה-lock manager עולים על מה שה-pruning חוסך." }
  ],
  interview: [
    {
      q: { en: "When would you partition rather than shard, and vice versa?", he: "מתי תעשה partitioning ולא sharding, ולהפך?" },
      a: {
        en: "Partition when one server still has enough CPU/RAM/IOPS but the table is unmanageable: slow vacuum, expensive retention deletes, indexes too big, queries naturally filtered by time. Shard when a single primary can't handle the write rate or storage, or for tenant isolation across machines. Partitioning keeps ACID and JOINs for free; sharding costs cross-shard transactions and resharding complexity, so partition first and shard only when forced.",
        he: "Partitioning כשלשרת אחד עדיין יש מספיק CPU/RAM/IOPS אבל הטבלה בלתי ניתנת לניהול: vacuum איטי, מחיקות retention יקרות, indexes גדולים מדי, queries שמסננים באופן טבעי לפי זמן. Sharding כש-primary אחד לא עומד בקצב הכתיבה או ב-storage, או לבידוד tenants בין מכונות. Partitioning שומר ACID ו-JOINs בחינם; sharding עולה ב-transactions בין shards ובמורכבות של resharding, אז קודם partitioning, ו-sharding רק כשאין ברירה."
      }
    },
    {
      q: { en: "How do you convert a live 2 TB Postgres table to a partitioned one with minimal downtime?", he: "איך הופכים טבלת Postgres חיה של 2 TB לטבלה מחולקת עם downtime מינימלי?" },
      a: {
        en: "Add a NOT VALID CHECK constraint covering the existing date range and VALIDATE it online. Then in a short transaction with lock_timeout: rename the old table, create the partitioned parent, ATTACH the old table as one partition (the CHECK lets Postgres skip the validation scan), and create future partitions. New data flows into proper partitions; the legacy partition expires by retention or is split off in batches. Alternatively, logical replication into a new partitioned table and a quick cutover.",
        he: "מוסיפים CHECK constraint מסוג NOT VALID שמכסה את טווח התאריכים הקיים ועושים לו VALIDATE online. אחר כך ב-transaction קצרה עם lock_timeout: משנים את שם הטבלה הישנה, יוצרים parent מחולק, עושים ATTACH לטבלה הישנה כ-partition אחד (ה-CHECK נותן ל-Postgres לדלג על סריקת האימות), ויוצרים partitions עתידיים. data חדש זורם ל-partitions הנכונים; ה-partition הישן פג תוקף לפי retention או מפוצל ב-batches. חלופה: logical replication לטבלה מחולקת חדשה ו-cutover מהיר."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Which query will NOT get partition pruning on a table partitioned by RANGE (created_at)?", he: "איזה query לא יקבל partition pruning בטבלה שמחולקת לפי RANGE (created_at)?" },
      options: [
        { en: "WHERE created_at >= '2026-11-01' AND created_at &lt; '2026-11-02'", he: "WHERE created_at >= '2026-11-01' AND created_at &lt; '2026-11-02'" },
        { en: "WHERE created_at >= now() - interval '1 hour'", he: "WHERE created_at >= now() - interval '1 hour'" },
        { en: "WHERE date_trunc('day', created_at) = '2026-11-01'", he: "WHERE date_trunc('day', created_at) = '2026-11-01'" },
        { en: "WHERE created_at = $1 (prepared statement)", he: "WHERE created_at = $1 (prepared statement)" }
      ],
      answer: 2,
      explain: { en: "Wrapping the partition key in a function hides it from the pruning logic. now() and parameters are pruned at execution time (PG 11+); rewrite the function as a range.", he: "עטיפה של ה-partition key בפונקציה מסתירה אותו מלוגיקת ה-pruning. now() ופרמטרים נחתכים בזמן ריצה (PG 11+); כותבים מחדש את הפונקציה כטווח." }
    },
    {
      q: { en: "Why is DROP of a partition better than DELETE for retention?", he: "למה DROP של partition עדיף על DELETE ל-retention?" },
      options: [
        { en: "DELETE is not transactional", he: "DELETE לא טרנזקציוני" },
        { en: "DROP is a catalog operation: no dead tuples, little WAL, disk freed immediately", he: "DROP היא פעולת catalog: בלי dead tuples, מעט WAL, הדיסק משתחרר מיד" },
        { en: "DELETE can't use indexes", he: "DELETE לא יכול להשתמש ב-indexes" },
        { en: "DROP also compresses the remaining partitions", he: "DROP גם דוחס את ה-partitions שנשארו" }
      ],
      answer: 1,
      explain: { en: "A big DELETE creates millions of dead tuples, floods WAL and replicas, and leaves bloat for vacuum. Dropping a partition removes the files in milliseconds.", he: "DELETE גדול יוצר מיליוני dead tuples, מציף את ה-WAL וה-replicas, ומשאיר bloat ל-vacuum. מחיקת partition מסירה את הקבצים במילישניות." }
    },
    {
      q: { en: "What does partitioning NOT give you, compared to sharding?", he: "מה partitioning לא נותן לך, בהשוואה ל-sharding?" },
      options: [
        { en: "Smaller per-partition indexes", he: "indexes קטנים יותר לכל partition" },
        { en: "Cheap retention", he: "retention זול" },
        { en: "More CPU, RAM and IOPS for writes", he: "יותר CPU, RAM ו-IOPS לכתיבות" },
        { en: "Pruning for queries on the key", he: "Pruning ל-queries לפי ה-key" }
      ],
      answer: 2,
      explain: { en: "All partitions live on the same server, so total capacity is unchanged. Only sharding spreads load across machines.", he: "כל ה-partitions יושבים על אותו שרת, אז הקיבולת הכוללת לא משתנה. רק sharding מפזר עומס בין מכונות." }
    }
  ],
  related: ["db-sharding", "db-index-kinds", "db-query-debugging", "staff-postgres-at-scale", "db-operations"]
});

// ---------------------------------------------------------------------------
// 4. Managed databases in the cloud
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-managed-cloud",
  track: "data",
  order: 33,
  icon: "☁️",
  level: 3,
  minutes: 16,
  title: { en: "Managed Databases: RDS, Aurora, Cloud SQL, AlloyDB, Azure", he: "Databases מנוהלים: RDS, Aurora, Cloud SQL, AlloyDB, Azure" },
  tldr: {
    en: "Managed databases take over hardware, patching, backups and failover — not schema, queries, indexes, connection counts or cost. Know the architecture behind the brand (Aurora's 6-way quorum storage vs RDS's standby), the real failover times, and the bills nobody budgets for: IOPS, cross-AZ traffic, snapshots and extended support.",
    he: "Databases מנוהלים לוקחים על עצמם חומרה, patching, backups ו-failover — לא schema, queries, indexes, מספר connections או עלות. תכיר את הארכיטקטורה שמאחורי המותג (ה-storage עם quorum של 6 עותקים ב-Aurora מול ה-standby של RDS), את זמני ה-failover האמיתיים, ואת החשבונות שאף אחד לא מתקצב: IOPS, תעבורה בין AZs, snapshots ו-extended support."
  },
  analogy: {
    en: "Renting a serviced apartment instead of owning a house. Cleaning, repairs and the building's backup generator are someone else's job. But the landlord doesn't tell you to stop leaving every light on (bad queries), won't stop you from inviting 2,000 guests into a 100-person flat (connections), and the minibar charges arrive at the end of the month (IOPS, transfer, snapshots).",
    he: "לשכור דירה עם שירותי מלון במקום להחזיק בית. ניקיון, תיקונים והגנרטור של הבניין הם בעיה של מישהו אחר. אבל בעל הבית לא יגיד לך להפסיק להשאיר את כל האורות דולקים (queries גרועים), לא ימנע ממך להזמין 2,000 אורחים לדירה של 100 (connections), והחיובים על המיני-בר מגיעים בסוף החודש (IOPS, תעבורה, snapshots)."
  },
  sections: [
    {
      h: { en: "What's managed — and what's still your job", he: "מה מנוהל — ומה עדיין התפקיד שלך" },
      body: {
        en: `<table><tr><th>The provider does</th><th>You still own</th></tr>
<tr><td>Hardware, OS, DB engine install &amp; minor patches</td><td>Schema, indexes, query plans, migrations</td></tr>
<tr><td>Automated backups + PITR (retention 1-35 days on RDS)</td><td>Testing restores; cross-region/account copies; long-term retention</td></tr>
<tr><td>Standby + automatic failover</td><td>Apps that reconnect and retry; DNS TTL handling</td></tr>
<tr><td>Storage provisioning, autoscaling</td><td>Bloat, vacuum tuning, table growth, IOPS sizing</td></tr>
<tr><td>Metrics and dashboards</td><td>Alerts, connection limits, pooling, timeouts</td></tr>
<tr><td>Major-version upgrade <em>mechanism</em></td><td>Deciding when, testing, extension compatibility</td></tr></table>
<p>What you give up: no superuser (on RDS you get <code>rds_superuser</code>, not <code>postgres</code>), no OS shell, only allow-listed extensions, some parameters locked, and limited control over the exact failover/upgrade timing.</p>
<p>The five Postgres offerings compared (MySQL variants exist for RDS, Aurora, Cloud SQL and Azure):</p>
<table><tr><th>Service</th><th>Architecture</th><th>HA failover (typical)</th><th>Read scaling</th></tr>
<tr><td>Amazon RDS for PostgreSQL</td><td>Postgres on EC2 + EBS. Multi-AZ instance = sync block-level standby (not readable)</td><td>~60-120 s</td><td>Up to 15 async read replicas (own storage each)</td></tr>
<tr><td>RDS Multi-AZ DB cluster</td><td>Writer + 2 readable standbys in 3 AZs, semi-sync, local NVMe for WAL</td><td>typically under 35 s</td><td>The 2 standbys serve reads</td></tr>
<tr><td>Amazon Aurora PostgreSQL</td><td>Compute separated from a shared, distributed log-structured storage layer</td><td>~30 s (often less with RDS Proxy / smart drivers)</td><td>Up to 15 replicas on the same storage, lag usually under 100 ms</td></tr>
<tr><td>Cloud SQL for PostgreSQL</td><td>VM + regional persistent disk replicated to a 2nd zone</td><td>~60 s; Enterprise Plus advertises sub-second maintenance downtime</td><td>Read replicas, cross-region replicas</td></tr>
<tr><td>AlloyDB</td><td>Disaggregated storage (Google's), Postgres compute + columnar engine for analytics</td><td>under 60 s</td><td>Read pool instances on shared storage</td></tr>
<tr><td>Azure Database for PostgreSQL Flexible Server</td><td>VM + managed disk; zone-redundant HA keeps a sync standby in another zone</td><td>~60-120 s</td><td>Up to 5 read replicas</td></tr></table>
<blockquote>💡 Real world: Failover time is not just the database. After Multi-AZ promotes the standby, the endpoint's DNS record flips; an app with JVM DNS caching (<code>networkaddress.cache.ttl</code> unset/forever) or a pool that never validates connections keeps talking to the dead IP for minutes. Measure failover from the <em>client's</em> point of view by forcing one: <code>aws rds reboot-db-instance --force-failover</code>.</blockquote>`,
        he: `<table><tr><th>הספק עושה</th><th>אתה עדיין אחראי על</th></tr>
<tr><td>חומרה, OS, התקנת המנוע ו-patches קטנים</td><td>Schema, indexes, query plans, migrations</td></tr>
<tr><td>Backups אוטומטיים + PITR (retention של 1-35 ימים ב-RDS)</td><td>בדיקת restores; עותקים ל-region/account אחר; שמירה לטווח ארוך</td></tr>
<tr><td>Standby + failover אוטומטי</td><td>אפליקציות שמתחברות מחדש ועושות retry; טיפול ב-DNS TTL</td></tr>
<tr><td>הקצאת storage ו-autoscaling</td><td>Bloat, כיוונון vacuum, גידול טבלאות, תכנון IOPS</td></tr>
<tr><td>מטריקות ו-dashboards</td><td>Alerts, מגבלות connections, pooling, timeouts</td></tr>
<tr><td>ה<em>מנגנון</em> של major upgrade</td><td>להחליט מתי, לבדוק, תאימות של extensions</td></tr></table>
<p>על מה אתה מוותר: אין superuser (ב-RDS אתה מקבל <code>rds_superuser</code>, לא <code>postgres</code>), אין shell למערכת ההפעלה, רק extensions מרשימה מאושרת, חלק מהפרמטרים נעולים, ושליטה מוגבלת בתזמון המדויק של failover ו-upgrades.</p>
<p>חמשת שירותי ה-Postgres בהשוואה (גרסאות MySQL קיימות ב-RDS, Aurora, Cloud SQL ו-Azure):</p>
<table><tr><th>שירות</th><th>ארכיטקטורה</th><th>Failover טיפוסי</th><th>Scale לקריאות</th></tr>
<tr><td>Amazon RDS for PostgreSQL</td><td>Postgres על EC2 + EBS. Multi-AZ instance = standby סינכרוני ברמת הבלוק (לא קריא)</td><td>בערך 60-120 שניות</td><td>עד 15 read replicas אסינכרוניים (storage נפרד לכל אחד)</td></tr>
<tr><td>RDS Multi-AZ DB cluster</td><td>Writer ועוד 2 standbys קריאים ב-3 AZs, semi-sync, NVMe מקומי ל-WAL</td><td>בדרך כלל פחות מ-35 שניות</td><td>2 ה-standbys משרתים קריאות</td></tr>
<tr><td>Amazon Aurora PostgreSQL</td><td>Compute מופרד משכבת storage משותפת, מבוזרת ומבוססת log</td><td>בערך 30 שניות (לרוב פחות עם RDS Proxy / smart drivers)</td><td>עד 15 replicas על אותו storage, lag בדרך כלל מתחת ל-100 ms</td></tr>
<tr><td>Cloud SQL for PostgreSQL</td><td>VM + regional persistent disk משוכפל ל-zone שני</td><td>בערך 60 שניות; Enterprise Plus מבטיח downtime של פחות משנייה ב-maintenance</td><td>Read replicas, replicas בין regions</td></tr>
<tr><td>AlloyDB</td><td>Storage מופרד (של Google), compute של Postgres + columnar engine ל-analytics</td><td>פחות מ-60 שניות</td><td>Read pool instances על storage משותף</td></tr>
<tr><td>Azure Database for PostgreSQL Flexible Server</td><td>VM + managed disk; zone-redundant HA מחזיק standby סינכרוני ב-zone אחר</td><td>בערך 60-120 שניות</td><td>עד 5 read replicas</td></tr></table>
<blockquote>💡 מהשטח: זמן failover זה לא רק ה-DB. אחרי ש-Multi-AZ מקדם את ה-standby, רשומת ה-DNS של ה-endpoint מתחלפת; אפליקציה עם DNS caching של JVM (<code>networkaddress.cache.ttl</code> לא מוגדר / לנצח) או pool שאף פעם לא בודק connections ממשיכה לדבר עם ה-IP המת דקות. מודדים failover מנקודת המבט של ה<em>client</em> ע״י הפעלה יזומה: <code>aws rds reboot-db-instance --force-failover</code>.</blockquote>`
      }
    },
    {
      h: { en: "Aurora's storage: 6 copies, 3 AZs, quorum 4/6", he: "ה-storage של Aurora: 6 עותקים, 3 AZs, quorum של 4/6" },
      body: {
        en: `<p>Aurora's key idea: <strong>the log is the database</strong>. The writer doesn't write data pages to disk; it ships only WAL/redo records to a distributed storage fleet, which applies them to pages on its own. Storage is split into 10 GB <em>protection groups</em>, each replicated <strong>6 times across 3 AZs</strong> (2 per AZ).</p>
<ul><li><strong>Write quorum 4/6</strong>: a commit is durable once 4 of the 6 copies acknowledge. Lose a whole AZ (2 copies) and writes continue.</li>
<li><strong>Read quorum 3/6</strong> (used for repair; normal reads go to one up-to-date copy). Lose an AZ <em>plus</em> one more node and data is still readable and repairable.</li>
<li>Segments are re-replicated from peers in seconds, so the window of reduced redundancy is short.</li></ul>
<p>Consequences you can use: replicas read the same storage, so adding one doesn't copy terabytes and lag is typically under 100 ms; there's no checkpoint/full-page-write I/O on the writer; storage grows automatically in 10 GB steps up to 128 TiB and you pay for what's used; and crash recovery doesn't replay a long WAL tail, so restart is fast. <strong>Aurora Global Database</strong> replicates storage to up to 5 secondary regions with typical lag under 1 s (RPO ≈ 1 s, managed failover ~1 min).</p>
<pre>$ aws rds describe-db-clusters --db-cluster-identifier prod-pg \\
    --query 'DBClusters[0].DBClusterMembers[].[DBInstanceIdentifier,IsClusterWriter]' --output text
prod-pg-1   True
prod-pg-2   False
prod-pg-3   False
# Endpoints: prod-pg.cluster-xxxx...      -&gt; always the writer
#            prod-pg.cluster-ro-xxxx...   -&gt; load-balanced across readers (DNS round-robin)</pre>
<p><strong>Billing</strong>: Aurora Standard charges per I/O request (on the order of $0.20 per million in us-east-1); <strong>Aurora I/O-Optimized</strong> drops I/O charges for higher instance and storage prices — it usually wins once I/O is more than ~25% of the Aurora bill. <strong>Aurora Serverless v2</strong> scales compute in 0.5 ACU steps (1 ACU ≈ 2 GiB RAM) and can now auto-pause to 0 ACU when idle — great for dev and spiky workloads, more expensive than provisioned for steady 24/7 load.</p>`,
        he: `<p>הרעיון המרכזי של Aurora: <strong>ה-log הוא ה-database</strong>. ה-writer לא כותב דפי data לדיסק; הוא שולח רק רשומות WAL/redo לצי storage מבוזר, שמחיל אותן על הדפים בעצמו. ה-storage מחולק ל-<em>protection groups</em> של 10 GB, וכל אחד משוכפל <strong>6 פעמים על פני 3 AZs</strong> (2 בכל AZ).</p>
<ul><li><strong>Write quorum של 4/6</strong>: commit שורד ברגע ש-4 מתוך 6 העותקים אישרו. אם AZ שלם נופל (2 עותקים) — הכתיבות ממשיכות.</li>
<li><strong>Read quorum של 3/6</strong> (משמש לתיקון; קריאות רגילות הולכות לעותק אחד מעודכן). אם נופל AZ <em>ועוד</em> node אחד, ה-data עדיין קריא וניתן לשחזור.</li>
<li>Segments משוכפלים מחדש מעמיתים תוך שניות, אז חלון היתירות המופחתת קצר.</li></ul>
<p>השלכות שאפשר לנצל: ה-replicas קוראים את אותו storage, אז הוספת replica לא מעתיקה טרה-בייטים וה-lag בדרך כלל מתחת ל-100 ms; אין I/O של checkpoint/full-page-writes על ה-writer; ה-storage גדל אוטומטית בצעדים של 10 GB עד 128 TiB ומשלמים על מה שבשימוש; ו-crash recovery לא מריץ מחדש זנב ארוך של WAL, אז ה-restart מהיר. <strong>Aurora Global Database</strong> משכפל storage לעד 5 regions משניים עם lag טיפוסי מתחת לשנייה (RPO ≈ שנייה, failover מנוהל בערך דקה).</p>
<pre>$ aws rds describe-db-clusters --db-cluster-identifier prod-pg \\
    --query 'DBClusters[0].DBClusterMembers[].[DBInstanceIdentifier,IsClusterWriter]' --output text
prod-pg-1   True
prod-pg-2   False
prod-pg-3   False
# Endpoints: prod-pg.cluster-xxxx...      -&gt; always the writer
#            prod-pg.cluster-ro-xxxx...   -&gt; load-balanced across readers (DNS round-robin)</pre>
<p><strong>חיוב</strong>: Aurora Standard גובה לפי בקשת I/O (בסדר גודל של $0.20 למיליון ב-us-east-1); <strong>Aurora I/O-Optimized</strong> מבטל את חיובי ה-I/O תמורת מחיר גבוה יותר ל-instance ול-storage — בדרך כלל משתלם ברגע שה-I/O הוא יותר מבערך 25% מחשבון ה-Aurora. <strong>Aurora Serverless v2</strong> עושה scale ל-compute בצעדים של 0.5 ACU (ACU אחד ≈ 2 GiB RAM) ויכול היום לעשות auto-pause ל-0 ACU כשהוא idle — מצוין ל-dev ולעומסים קופצניים, יקר יותר מ-provisioned לעומס יציב 24/7.</p>`
      }
    },
    {
      h: { en: "Parameters, storage & IOPS, maintenance and major upgrades", he: "פרמטרים, storage ו-IOPS, maintenance ו-major upgrades" },
      body: {
        en: `<p><strong>Parameter groups</strong> (RDS/Aurora; "flags" on Cloud SQL, "server parameters" on Azure) replace <code>postgresql.conf</code>. <em>Dynamic</em> parameters apply immediately; <em>static</em> ones (<code>shared_buffers</code>, <code>max_connections</code>, <code>shared_preload_libraries</code>) show <code>pending-reboot</code> until you restart. Defaults are formulas: RDS sets <code>shared_buffers = {DBInstanceClassMemory/32768}</code> (in 8 KB pages, i.e. ~25% of RAM) and <code>max_connections</code> from memory too — so changing the instance class changes them. Never edit the <code>default.*</code> group; create your own, version it in Terraform.</p>
<p><strong>Storage on RDS</strong> (not Aurora): <code>gp3</code> gives a baseline of 3,000 IOPS and 125 MiB/s regardless of size below 400 GiB; for Postgres/MySQL at 400 GiB and above, RDS stripes volumes and the baseline becomes 12,000 IOPS and 500 MiB/s, and you can buy more independently of size. <code>io1</code>/<code>io2</code> provision IOPS explicitly (up to 256,000 on io2 for large instances). The instance class also has its own EBS bandwidth cap — a small instance can't use the IOPS you paid for. Watch <code>ReadIOPS + WriteIOPS</code> against the limit and <code>DiskQueueDepth</code>.</p>
<p><strong>Storage autoscaling</strong> grows the volume when free space is under 10% for 5 minutes (minimum +10%/5 GiB), up to a max you set, and then not again for ~6 hours. Storage can <strong>never shrink</strong> on RDS — a one-off 2 TB bloat stays on the bill until you migrate to a new instance.</p>
<p><strong>Maintenance windows</strong>: a weekly 30-minute slot where minor version patches and OS updates may apply (with a failover on Multi-AZ). <strong>Major upgrades</strong> (PG 15 → 17) in place run <code>pg_upgrade</code> with downtime of roughly 10-30+ minutes depending on object count, and stats must be rebuilt afterwards. The safer path is <strong>RDS Blue/Green Deployments</strong>:</p>
<pre>aws rds create-blue-green-deployment --blue-green-deployment-name pg17-upgrade \\
  --source arn:aws:rds:eu-west-1:123456789012:db:prod-pg \\
  --target-engine-version 17.2 --target-db-parameter-group-name prod-pg17
# green = copy kept in sync by logical replication; test it, ANALYZE it, then:
aws rds switchover-blue-green-deployment --blue-green-deployment-identifier bgd-xxxx \\
  --switchover-timeout 300
# switchover: blocks writes, waits for green to catch up, swaps endpoints -- usually under a minute</pre>
<p>Logical replication has caveats: DDL isn't replicated (freeze schema changes), sequences are synced at switchover, and tables without a primary key are a problem. Cloud SQL and Azure have their own in-place major upgrade flows; Cloud SQL Enterprise Plus and AlloyDB minimize maintenance downtime.</p>
<blockquote>⚠️ Production tip: AWS charges <strong>Extended Support</strong> when you stay on a major version after its end of standard support — on the order of $0.10 per vCPU-hour for the first two years (roughly doubling in year 3). For a 64-vCPU writer plus two replicas that's about $140k per year for doing nothing. Track engine EOL dates like certificate expiry.</blockquote>`,
        he: `<p><strong>Parameter groups</strong> (RDS/Aurora; "flags" ב-Cloud SQL, "server parameters" ב-Azure) מחליפים את <code>postgresql.conf</code>. פרמטרים <em>דינמיים</em> נכנסים לתוקף מיד; <em>סטטיים</em> (<code>shared_buffers</code>, <code>max_connections</code>, <code>shared_preload_libraries</code>) מראים <code>pending-reboot</code> עד שעושים restart. ברירות המחדל הן נוסחאות: RDS קובע <code>shared_buffers = {DBInstanceClassMemory/32768}</code> (בדפים של 8 KB, כלומר בערך 25% מה-RAM) וגם את <code>max_connections</code> לפי זיכרון — אז שינוי של ה-instance class משנה אותם. אף פעם לא עורכים את ה-group מסוג <code>default.*</code>; יוצרים אחד משלך ומנהלים אותו ב-Terraform.</p>
<p><strong>Storage ב-RDS</strong> (לא Aurora): <code>gp3</code> נותן baseline של 3,000 IOPS ו-125 MiB/s בלי קשר לגודל מתחת ל-400 GiB; ב-Postgres/MySQL מ-400 GiB ומעלה, RDS עושה striping לכמה volumes וה-baseline הופך ל-12,000 IOPS ו-500 MiB/s, ואפשר לקנות עוד בנפרד מהגודל. <code>io1</code>/<code>io2</code> מקצים IOPS במפורש (עד 256,000 ב-io2 ל-instances גדולים). גם ל-instance class יש תקרת רוחב פס EBS משלו — instance קטן לא יכול לנצל את ה-IOPS ששילמת עליהם. עוקבים אחרי <code>ReadIOPS + WriteIOPS</code> מול הגבול ואחרי <code>DiskQueueDepth</code>.</p>
<p><strong>Storage autoscaling</strong> מגדיל את ה-volume כשהמקום הפנוי מתחת ל-10% במשך 5 דקות (מינימום +10% או 5 GiB), עד מקסימום שאתה קובע, ואז לא שוב במשך בערך 6 שעות. ב-RDS ה-storage <strong>אף פעם לא מתכווץ</strong> — bloat חד-פעמי של 2 TB נשאר בחשבון עד שאתה עובר ל-instance חדש.</p>
<p><strong>Maintenance windows</strong>: חלון שבועי של 30 דקות שבו patches של minor version ועדכוני OS יכולים להיכנס (עם failover ב-Multi-AZ). <strong>Major upgrades</strong> (PG 15 ← 17) במקום מריצים <code>pg_upgrade</code> עם downtime של בערך 10-30 דקות ויותר, תלוי במספר האובייקטים, ואחר כך צריך לבנות מחדש סטטיסטיקות. הדרך הבטוחה יותר היא <strong>RDS Blue/Green Deployments</strong>:</p>
<pre>aws rds create-blue-green-deployment --blue-green-deployment-name pg17-upgrade \\
  --source arn:aws:rds:eu-west-1:123456789012:db:prod-pg \\
  --target-engine-version 17.2 --target-db-parameter-group-name prod-pg17
# green = copy kept in sync by logical replication; test it, ANALYZE it, then:
aws rds switchover-blue-green-deployment --blue-green-deployment-identifier bgd-xxxx \\
  --switchover-timeout 300
# switchover: blocks writes, waits for green to catch up, swaps endpoints -- usually under a minute</pre>
<p>ל-logical replication יש הסתייגויות: DDL לא משוכפל (מקפיאים שינויי schema), sequences מסונכרנים ב-switchover, וטבלאות בלי primary key הן בעיה. ל-Cloud SQL ול-Azure יש תהליכי major upgrade משלהם; Cloud SQL Enterprise Plus ו-AlloyDB מצמצמים את ה-downtime של maintenance.</p>
<blockquote>⚠️ טיפ לפרודקשן: AWS גובה <strong>Extended Support</strong> כשנשארים על major version אחרי סוף ה-standard support — בסדר גודל של $0.10 ל-vCPU לשעה בשנתיים הראשונות (ובערך כפול בשנה השלישית). ל-writer של 64 vCPU ועוד שני replicas זה בערך $140k בשנה על כלום. עוקבים אחרי תאריכי EOL של המנוע כמו אחרי תפוגת certificates.</blockquote>`
      }
    },
    {
      h: { en: "RDS Proxy, Performance Insights, and the cost traps", he: "RDS Proxy, Performance Insights, ומלכודות העלות" },
      body: {
        en: `<p><strong>RDS Proxy</strong> is a managed connection pooler in front of RDS/Aurora: thousands of client connections (Lambdas, many pods) multiplexed onto a small pool, IAM auth / Secrets Manager integration, and it holds client connections during a failover and reconnects to the new writer — AWS cites up to 66% faster failover for apps behind it. Two gotchas: <strong>pinning</strong> — session state (<code>SET</code> outside a transaction, temp tables, advisory locks, prepared statements in some drivers) pins a client to one backend connection, silently killing the multiplexing (check the <code>DatabaseConnectionsCurrentlySessionPinned</code> metric); and price — billed per vCPU (or ACU) of the database behind it, every hour. PgBouncer on k8s or on the app side (see <code>db-operations</code>) is the free alternative; Cloud SQL now has managed connection pooling and Azure Flexible Server ships built-in PgBouncer.</p>
<p><strong>Performance Insights</strong> (being folded into CloudWatch Database Insights) plots <strong>DB load in Average Active Sessions (AAS)</strong>, sliced by wait event, SQL, user and host. Compare AAS with vCPU count: AAS 3 on 8 vCPUs is healthy; AAS 40 with most of it <code>Lock:relation</code> or <code>LWLock:BufferMapping</code> or <code>IO:DataFileRead</code> tells you exactly which playbook to open. Cloud SQL has Query Insights; Azure has Query Store / Query Performance Insight. These complement — not replace — <code>pg_stat_statements</code>.</p>
<p><strong>Cost traps</strong> nobody budgets for:</p>
<ul><li><strong>Cross-AZ traffic</strong>: app pods in AZ-a talking to a writer in AZ-b pay ~$0.01/GB in each direction. A chatty service doing 50 TB/month of query results = ~$1,000/month in transfer alone. Replication traffic for Multi-AZ is not billed, but your own cross-AZ replicas and clients are.</li>
<li><strong>IOPS</strong>: provisioned io1/io2 IOPS are billed whether used or not; Aurora Standard's per-request I/O on a scan-heavy workload can exceed the instance cost.</li>
<li><strong>Snapshots</strong>: automated backup storage is free up to 100% of the DB size per region; manual snapshots are kept forever and billed, and cross-region copies are billed again plus transfer.</li>
<li><strong>Idle replicas and oversized instances</strong>: a db.r6g.8xlarge replica nobody reads from is ~$3.5k/month. Reserved Instances (or Database Savings Plans where offered) cut 30-60% for steady load.</li>
<li><strong>Extended support</strong> for old major versions (previous section) and <strong>Performance Insights long retention</strong> (free tier is 7 days).</li></ul>`,
        he: `<p><strong>RDS Proxy</strong> הוא connection pooler מנוהל לפני RDS/Aurora: אלפי connections של clients (Lambdas, הרבה pods) מרובבים על pool קטן, אינטגרציה עם IAM auth / Secrets Manager, והוא מחזיק את ה-connections של ה-clients בזמן failover ומתחבר מחדש ל-writer החדש — AWS מדברים על failover מהיר בעד 66% לאפליקציות שמאחוריו. שתי מלכודות: <strong>pinning</strong> — session state (<code>SET</code> מחוץ ל-transaction, temp tables, advisory locks, prepared statements בחלק מה-drivers) נועץ client ל-connection אחד מאחור ומבטל בשקט את הריבוב (בודקים את המטריקה <code>DatabaseConnectionsCurrentlySessionPinned</code>); ומחיר — חיוב לפי vCPU (או ACU) של ה-DB שמאחוריו, כל שעה. PgBouncer על k8s או בצד האפליקציה (ראה <code>db-operations</code>) הוא החלופה החינמית; ל-Cloud SQL יש היום managed connection pooling ו-Azure Flexible Server מגיע עם PgBouncer מובנה.</p>
<p><strong>Performance Insights</strong> (שמשתלב עכשיו לתוך CloudWatch Database Insights) מציג <strong>DB load ב-Average Active Sessions (AAS)</strong>, מפולח לפי wait event, SQL, user ו-host. משווים AAS למספר ה-vCPUs: AAS של 3 על 8 vCPUs זה בריא; AAS של 40 שרובו <code>Lock:relation</code> או <code>LWLock:BufferMapping</code> או <code>IO:DataFileRead</code> אומר לך בדיוק איזה playbook לפתוח. ב-Cloud SQL יש Query Insights; ב-Azure יש Query Store / Query Performance Insight. הם משלימים את <code>pg_stat_statements</code>, לא מחליפים אותו.</p>
<p><strong>מלכודות עלות</strong> שאף אחד לא מתקצב:</p>
<ul><li><strong>תעבורה בין AZs</strong>: pods ב-AZ-a שמדברים עם writer ב-AZ-b משלמים בערך $0.01 ל-GB בכל כיוון. שירות פטפטן שמעביר 50 TB בחודש של תוצאות queries = בערך $1,000 בחודש רק על תעבורה. תעבורת השכפול של Multi-AZ לא מחויבת, אבל ה-replicas וה-clients שלך בין AZs כן.</li>
<li><strong>IOPS</strong>: IOPS מוקצים ב-io1/io2 מחויבים בין אם משתמשים בהם או לא; ה-I/O לפי בקשה של Aurora Standard בעומס עם הרבה סריקות יכול לעבור את מחיר ה-instance.</li>
<li><strong>Snapshots</strong>: storage של backups אוטומטיים חינם עד 100% מגודל ה-DB לכל region; snapshots ידניים נשמרים לנצח ומחויבים, ועותקים ל-region אחר מחויבים שוב ועוד תעבורה.</li>
<li><strong>Replicas מיותרים ו-instances גדולים מדי</strong>: replica מסוג db.r6g.8xlarge שאף אחד לא קורא ממנו עולה בערך $3.5k בחודש. Reserved Instances (או Database Savings Plans איפה שזמין) חוסכים 30-60% לעומס יציב.</li>
<li><strong>Extended support</strong> לגרסאות major ישנות (הסעיף הקודם) ו-<strong>retention ארוך של Performance Insights</strong> (ה-free tier הוא 7 ימים).</li></ul>`
      }
    },
    {
      h: { en: "When to self-host on Kubernetes (CloudNativePG & co.)", he: "מתי לעשות self-host על Kubernetes (CloudNativePG וחברים)" },
      body: {
        en: `<p>Running Postgres yourself used to mean pets on VMs. Kubernetes operators changed that: <strong>CloudNativePG</strong> (CNCF project), Zalando's postgres-operator, Crunchy PGO, and Percona operators for MySQL/Mongo encode failover, backups and upgrades as a controller loop.</p>
<pre>apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: orders-pg }
spec:
  instances: 3                         # 1 primary + 2 streaming replicas, spread by anti-affinity
  imageName: ghcr.io/cloudnative-pg/postgresql:17.2
  storage: { size: 500Gi, storageClass: local-nvme }
  postgresql:
    parameters: { shared_buffers: "16GB", max_connections: "300" }
  backup:
    barmanObjectStore:                 # base backups + continuous WAL archive to S3 = PITR
      destinationPath: s3://pg-backups/orders
      s3Credentials: { inheritFromIAMRole: true }
    retentionPolicy: "30d"
---
apiVersion: postgresql.cnpg.io/v1
kind: Pooler                           # managed PgBouncer in front of the cluster
metadata: { name: orders-pg-rw }
spec: { cluster: { name: orders-pg }, instances: 2, type: rw,
        pgbouncer: { poolMode: transaction } }</pre>
<p><strong>Self-host when</strong>: the database bill dominates and you have the skills (managed is often 2-3x the cost of equivalent compute; local NVMe gives IOPS no EBS volume matches at that price); you need superuser, custom extensions or specific versions; you run on-prem, multi-cloud, or air-gapped; or you need many small per-tenant databases. <strong>Stay managed when</strong>: you don't have at least two people who can debug replication, WAL archiving and failover at 3 AM; the DB is a small part of the bill; or compliance teams want the provider's certifications.</p>
<blockquote>⚠️ Production tip: An operator automates the happy path, not judgment. You still own: testing restores from object storage monthly, PodDisruptionBudgets so node drains don't take out the primary and replica at once, storage that survives node loss (local NVMe means the replica must re-clone if the node dies — size the network for it), and monitoring of WAL archive lag. "Operator installed" is not "DBA team replaced".</blockquote>`,
        he: `<p>להריץ Postgres בעצמך היה פעם אומר pets על VMs. ה-operators של Kubernetes שינו את זה: <strong>CloudNativePG</strong> (פרויקט CNCF), ה-postgres-operator של Zalando, Crunchy PGO, ו-operators של Percona ל-MySQL/Mongo מקודדים failover, backups ו-upgrades כ-controller loop.</p>
<pre>apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata: { name: orders-pg }
spec:
  instances: 3                         # 1 primary + 2 streaming replicas, spread by anti-affinity
  imageName: ghcr.io/cloudnative-pg/postgresql:17.2
  storage: { size: 500Gi, storageClass: local-nvme }
  postgresql:
    parameters: { shared_buffers: "16GB", max_connections: "300" }
  backup:
    barmanObjectStore:                 # base backups + continuous WAL archive to S3 = PITR
      destinationPath: s3://pg-backups/orders
      s3Credentials: { inheritFromIAMRole: true }
    retentionPolicy: "30d"
---
apiVersion: postgresql.cnpg.io/v1
kind: Pooler                           # managed PgBouncer in front of the cluster
metadata: { name: orders-pg-rw }
spec: { cluster: { name: orders-pg }, instances: 2, type: rw,
        pgbouncer: { poolMode: transaction } }</pre>
<p><strong>Self-host כש</strong>: החשבון על ה-DB דומיננטי ויש לך את הידע (מנוהל עולה הרבה פעמים פי 2-3 מ-compute שווה ערך; NVMe מקומי נותן IOPS שאף EBS volume לא מתקרב אליהם במחיר הזה); אתה צריך superuser, extensions מותאמים או גרסאות ספציפיות; אתה רץ on-prem, multi-cloud או air-gapped; או שאתה צריך הרבה DBs קטנים לכל tenant. <strong>תישאר מנוהל כש</strong>: אין לך לפחות שני אנשים שיודעים לדבג replication, WAL archiving ו-failover ב-3 בלילה; ה-DB הוא חלק קטן מהחשבון; או שצוותי ה-compliance רוצים את ההסמכות של הספק.</p>
<blockquote>⚠️ טיפ לפרודקשן: Operator עושה אוטומציה ל-happy path, לא לשיקול דעת. אתה עדיין אחראי על: בדיקת restores מה-object storage כל חודש, PodDisruptionBudgets כדי ש-drain של nodes לא יוריד את ה-primary וה-replica ביחד, storage ששורד נפילה של node (NVMe מקומי אומר שה-replica צריך לעשות re-clone אם ה-node מת — תכנן את הרשת בהתאם), וניטור של lag בארכוב ה-WAL. "התקנו operator" זה לא "החלפנו את צוות ה-DBA".</blockquote>`
      }
    }
  ],
  diagram: `RDS Multi-AZ (instance)                 Aurora
  AZ-a [primary]--sync EBS-->AZ-b [standby]   AZ-a [writer]  AZ-b [reader]  AZ-c [reader]
       (standby not readable)                         \\  redo log only  /
  failover ~60-120s, DNS flip              +------------------------------------+
                                           | shared storage, 10 GB groups x 6   |
                                           |  AZ-a: c1 c2  AZ-b: c3 c4  AZ-c: c5 c6 |
                                           |  write quorum 4/6, read quorum 3/6 |
                                           +------------------------------------+
                                            failover ~30s, readers lag < 100 ms`,
  handsOn: [
    { cmd: "aws rds describe-db-instances --query 'DBInstances[].[DBInstanceIdentifier,Engine,EngineVersion,DBInstanceClass,MultiAZ,StorageType,Iops,AllocatedStorage]' --output table", what: { en: "Inventory: engine versions (EOL risk), Multi-AZ, storage type and IOPS per instance.", he: "מלאי: גרסאות מנוע (סיכון EOL), Multi-AZ, סוג storage ו-IOPS לכל instance." } },
    { cmd: "aws rds describe-db-parameters --db-parameter-group-name prod-pg17 --query \"Parameters[?ApplyMethod=='pending-reboot' && Source=='user'].[ParameterName,ParameterValue]\" --output table", what: { en: "Find your customized static parameters that need a reboot to apply.", he: "מוצא את הפרמטרים הסטטיים שהגדרת ושצריכים reboot כדי להיכנס לתוקף." } },
    { cmd: "aws rds reboot-db-instance --db-instance-identifier staging-pg --force-failover", what: { en: "Force a Multi-AZ failover on staging and measure how long your app actually errors.", he: "מפעיל failover יזום של Multi-AZ על staging ומודד כמה זמן האפליקציה שלך באמת מחזירה שגיאות." } },
    { cmd: "kubectl cnpg status orders-pg", what: { en: "CloudNativePG plugin: primary, replicas, replication lag and WAL archiving status.", he: "ה-plugin של CloudNativePG: primary, replicas, replication lag ומצב ארכוב ה-WAL." } }
  ],
  mnemonic: {
    en: "\"They manage the box, you manage the queries — and the bill.\" Aurora: \"six copies, three zones, four to write.\"",
    he: "\"הם מנהלים את הקופסה, אתה מנהל את ה-queries — ואת החשבון.\" Aurora: \"שישה עותקים, שלושה zones, ארבעה לכתיבה.\""
  },
  pitfalls: [
    { en: "Assuming Multi-AZ standby (RDS instance) serves reads — it doesn't. You need read replicas or the Multi-AZ DB cluster / Aurora for readable standbys.", he: "להניח שה-standby של Multi-AZ (RDS instance) משרת קריאות — הוא לא. צריך read replicas או Multi-AZ DB cluster / Aurora בשביל standbys קריאים." },
    { en: "Upgrading the major version in place without testing extensions and without ANALYZE afterwards: 20 minutes of downtime, then an hour of terrible plans.", he: "לעשות major upgrade במקום בלי לבדוק extensions ובלי ANALYZE אחר כך: 20 דקות downtime, ואז שעה של plans נוראיים." },
    { en: "Letting storage autoscaling absorb a bloat or a runaway log table: RDS storage never shrinks, so you pay for the peak forever.", he: "לתת ל-storage autoscaling לבלוע bloat או טבלת לוג שיצאה משליטה: ב-RDS ה-storage אף פעם לא מתכווץ, אז אתה משלם על השיא לנצח." },
    { en: "Putting RDS Proxy in front of an ORM that sets session parameters on every connection: every client gets pinned and you pay for a proxy that doesn't pool.", he: "לשים RDS Proxy לפני ORM שמגדיר פרמטרים של session בכל connection: כל client ננעץ ואתה משלם על proxy שלא עושה pooling." }
  ],
  interview: [
    {
      q: { en: "Explain why Aurora survives an AZ outage without losing writes, and what still fails over.", he: "הסבר למה Aurora שורד נפילת AZ בלי לאבד כתיבות, ומה עדיין עושה failover." },
      a: {
        en: "Storage keeps 6 copies of each 10 GB segment, 2 per AZ, and a write commits at 4/6 acks — losing an AZ leaves 4 copies, so writes continue and no committed data is lost. But compute is a single writer instance: if it was in the failed AZ, Aurora promotes a reader in another AZ (typically ~30 s), and clients must reconnect to the cluster endpoint. Having at least one replica in a different AZ is what makes failover fast; without it Aurora must create a new instance.",
        he: "ה-storage מחזיק 6 עותקים של כל segment של 10 GB, 2 בכל AZ, וכתיבה עושה commit ב-4/6 אישורים — נפילת AZ משאירה 4 עותקים, אז הכתיבות ממשיכות ושום data שעשה commit לא אובד. אבל ה-compute הוא writer instance יחיד: אם הוא היה ב-AZ שנפל, Aurora מקדם reader ב-AZ אחר (בדרך כלל בערך 30 שניות), וה-clients חייבים להתחבר מחדש ל-cluster endpoint. מה שהופך את ה-failover למהיר זה לפחות replica אחד ב-AZ אחר; בלעדיו Aurora צריך ליצור instance חדש."
      }
    },
    {
      q: { en: "Your team asks to move from RDS to Postgres on Kubernetes to save money. What do you ask?", he: "הצוות שלך מבקש לעבור מ-RDS ל-Postgres על Kubernetes כדי לחסוך. מה אתה שואל?" },
      a: {
        en: "How big is the DB bill really versus the engineering time? Who is on-call for replication, WAL archive and failover issues, and have they done a restore drill? Which operator (CloudNativePG?), which storage (local NVMe vs network volumes) and what happens on node loss? How are backups tested and PITR proven? What are the RPO/RTO targets vs Multi-AZ today? And can we get most of the savings with right-sizing, Reserved Instances, gp3 instead of io1, and deleting idle replicas first?",
        he: "כמה באמת גדול החשבון על ה-DB מול זמן ההנדסה? מי on-call לבעיות של replication, ארכוב WAL ו-failover, והאם הם עשו תרגיל restore? איזה operator (CloudNativePG?), איזה storage (NVMe מקומי מול network volumes) ומה קורה כש-node נופל? איך בודקים backups ומוכיחים PITR? מה יעדי ה-RPO/RTO מול Multi-AZ היום? והאם אפשר להשיג את רוב החיסכון קודם עם right-sizing, Reserved Instances, gp3 במקום io1 ומחיקת replicas מיותרים?"
      }
    }
  ],
  quiz: [
    {
      q: { en: "In Aurora's storage layer, how many copies must acknowledge a write?", he: "בשכבת ה-storage של Aurora, כמה עותקים צריכים לאשר כתיבה?" },
      options: [
        { en: "2 of 3", he: "2 מתוך 3" },
        { en: "4 of 6", he: "4 מתוך 6" },
        { en: "3 of 6", he: "3 מתוך 6" },
        { en: "6 of 6", he: "6 מתוך 6" }
      ],
      answer: 1,
      explain: { en: "6 copies across 3 AZs, write quorum 4, read quorum 3. Losing a full AZ (2 copies) still leaves a write quorum.", he: "6 עותקים על פני 3 AZs, write quorum של 4, read quorum של 3. נפילת AZ שלם (2 עותקים) עדיין משאירה write quorum." }
    },
    {
      q: { en: "What's the safest way to do a Postgres major-version upgrade on RDS with minimal downtime?", he: "מה הדרך הבטוחה ביותר לעשות major upgrade ל-Postgres ב-RDS עם downtime מינימלי?" },
      options: [
        { en: "Modify the instance in place during the maintenance window", he: "לשנות את ה-instance במקום בחלון ה-maintenance" },
        { en: "Blue/Green Deployment: green on the new version synced by logical replication, test, then switchover", he: "Blue/Green Deployment: green על הגרסה החדשה שמסונכרן ב-logical replication, בדיקה, ואז switchover" },
        { en: "Restore a snapshot onto the new version and point the app at it", he: "לשחזר snapshot לגרסה החדשה ולהפנות אליו את האפליקציה" },
        { en: "Promote a read replica on the new version", he: "לקדם read replica על הגרסה החדשה" }
      ],
      answer: 1,
      explain: { en: "Blue/Green keeps a tested copy in sync and switches endpoints in about a minute. In-place runs pg_upgrade with longer downtime; a snapshot restore loses writes made after the snapshot.", he: "Blue/Green מחזיק עותק בדוק ומסונכרן ומחליף endpoints בערך בדקה. במקום מריץ pg_upgrade עם downtime ארוך יותר; שחזור snapshot מאבד כתיבות שקרו אחרי ה-snapshot." }
    },
    {
      q: { en: "Your RDS gp3 volume is 200 GiB. What's the baseline IOPS?", he: "ה-volume שלך ב-RDS הוא gp3 של 200 GiB. מה ה-baseline של IOPS?" },
      options: [
        { en: "600 (3 IOPS per GiB)", he: "600 (3 IOPS ל-GiB)" },
        { en: "3,000", he: "3,000" },
        { en: "12,000", he: "12,000" },
        { en: "Unlimited, it bursts", he: "ללא הגבלה, הוא עושה burst" }
      ],
      answer: 1,
      explain: { en: "gp3 gives 3,000 IOPS / 125 MiB/s baseline independent of size; on RDS Postgres/MySQL volumes of 400 GiB+ get 12,000 IOPS. 3 IOPS/GiB was gp2's model.", he: "gp3 נותן baseline של 3,000 IOPS ו-125 MiB/s בלי תלות בגודל; ב-RDS Postgres/MySQL, volumes של 400 GiB ומעלה מקבלים 12,000 IOPS. 3 IOPS ל-GiB זה המודל של gp2." }
    },
    {
      q: { en: "Why might RDS Proxy fail to reduce backend connections for your app?", he: "למה RDS Proxy עלול לא להוריד את מספר ה-connections מאחור עבור האפליקציה שלך?" },
      options: [
        { en: "It only works with MySQL", he: "הוא עובד רק עם MySQL" },
        { en: "Session state (SET, temp tables, advisory locks) pins clients to dedicated connections", he: "Session state (SET, temp tables, advisory locks) נועץ clients ל-connections ייעודיים" },
        { en: "It requires Aurora Serverless", he: "הוא דורש Aurora Serverless" },
        { en: "It disables TLS", he: "הוא מבטל TLS" }
      ],
      answer: 1,
      explain: { en: "Pinned sessions can't be multiplexed. Watch DatabaseConnectionsCurrentlySessionPinned and remove per-session SETs or move them inside transactions.", he: "Sessions נעוצים לא ניתנים לריבוב. עוקבים אחרי DatabaseConnectionsCurrentlySessionPinned ומורידים SETs ברמת session או מעבירים אותם לתוך transactions." }
    }
  ],
  playground: "dr",
  related: ["db-operations", "db-replication", "db-backups", "staff-postgres-at-scale", "k8s-operators-crds", "cloud-finops"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
INFRA.glossary.push(
  { term: "GIN index", track: "data", def: { en: "Inverted index mapping each element (jsonb key/value, array item, word) to the rows containing it; powers @>, && and full-text search in Postgres.", he: "Inverted index שממפה כל אלמנט (key/value ב-jsonb, איבר במערך, מילה) לשורות שמכילות אותו; מאחורי @>, && ו-full-text search ב-Postgres." }, lesson: "db-index-kinds" },
  { term: "BRIN index", track: "data", def: { en: "Block Range INdex: stores min/max per range of table pages; megabytes in size, effective only when values correlate with physical row order (e.g. timestamps in append-only tables).", he: "Block Range INdex: שומר min/max לכל טווח של דפים בטבלה; שוקל מגה-בייטים, ויעיל רק כשהערכים מתואמים עם הסדר הפיזי של השורות (למשל timestamps בטבלאות append-only)." }, lesson: "db-index-kinds" },
  { term: "Partial index", track: "data", def: { en: "An index with a WHERE clause covering only a subset of rows (e.g. status = 'pending'); tiny and fast, used only by queries that repeat the predicate.", he: "Index עם סעיף WHERE שמכסה רק חלק מהשורות (למשל status = 'pending'); קטנטן ומהיר, ומשמש רק queries שחוזרים על התנאי." }, lesson: "db-index-kinds" },
  { term: "pg_stat_statements", track: "data", def: { en: "Postgres extension that aggregates execution stats per normalized query shape (calls, total/mean time, rows, buffer hits) — the first stop for finding what eats DB time.", he: "Extension של Postgres שמאגד סטטיסטיקות ריצה לכל צורת query מנורמלת (calls, זמן כולל/ממוצע, rows, buffer hits) — התחנה הראשונה למצוא מה אוכל זמן DB." }, lesson: "db-query-debugging" },
  { term: "Idle in transaction", track: "data", def: { en: "A session that opened a transaction and is doing nothing while still holding its locks and snapshot; a classic hidden blocker. Capped by idle_in_transaction_session_timeout.", he: "Session שפתח transaction ולא עושה כלום, אבל עדיין מחזיק את ה-locks וה-snapshot שלו; חוסם נסתר קלאסי. מוגבל ע״י idle_in_transaction_session_timeout." }, lesson: "db-query-debugging" },
  { term: "lock_timeout", track: "data", def: { en: "Postgres setting that aborts a statement if it waits longer than N for a lock; set it before DDL so a waiting ALTER fails fast instead of queueing all traffic behind it.", he: "הגדרה ב-Postgres שמבטלת statement אם הוא מחכה ל-lock יותר מ-N; קובעים אותה לפני DDL כדי ש-ALTER שמחכה ייכשל מהר במקום לתקוע את כל התעבורה מאחוריו." }, lesson: "db-query-debugging" },
  { term: "Partition pruning", track: "data", def: { en: "The planner/executor skipping partitions that can't match the WHERE clause on the partition key; shown as fewer partitions or 'Subplans Removed' in EXPLAIN.", he: "ה-planner/executor מדלג על partitions שלא יכולים להתאים לסעיף ה-WHERE על ה-partition key; מופיע כפחות partitions או 'Subplans Removed' ב-EXPLAIN." }, lesson: "db-partitioning" },
  { term: "pg_partman", track: "data", def: { en: "Postgres extension that automates creating future partitions (premake) and dropping or detaching old ones by a retention policy.", he: "Extension של Postgres שעושה אוטומציה ליצירת partitions עתידיים (premake) ולמחיקה או ניתוק של ישנים לפי מדיניות retention." }, lesson: "db-partitioning" },
  { term: "Aurora", track: "data", def: { en: "AWS's MySQL/Postgres-compatible database with compute separated from a shared storage layer that keeps 6 copies across 3 AZs (write quorum 4/6).", he: "ה-database של AWS שתואם MySQL/Postgres, עם compute מופרד משכבת storage משותפת ששומרת 6 עותקים על פני 3 AZs (write quorum של 4/6)." }, lesson: "db-managed-cloud" },
  { term: "RDS Proxy", track: "data", def: { en: "Managed connection pooler for RDS/Aurora that multiplexes many client connections and holds them through failover; session state can pin clients and defeat pooling.", he: "Connection pooler מנוהל ל-RDS/Aurora שמרבב הרבה connections של clients ומחזיק אותם לאורך failover; session state יכול לנעוץ clients ולבטל את ה-pooling." }, lesson: "db-managed-cloud" },
  { term: "CloudNativePG", track: "data", def: { en: "Kubernetes operator (CNCF project) that runs Postgres clusters with automated failover, PgBouncer poolers and backups/PITR to object storage.", he: "Operator ל-Kubernetes (פרויקט CNCF) שמריץ clusters של Postgres עם failover אוטומטי, poolers של PgBouncer ו-backups/PITR ל-object storage." }, lesson: "db-managed-cloud" }
);

// ---------------------------------------------------------------------------
// Scenario: migration lock outage
// ---------------------------------------------------------------------------
INFRA.scenarios.push({
  id: "migration-lock-outage",
  icon: "🔒",
  title: { en: "A 1 ms migration took down checkout", he: "Migration של מילישנייה הפיל את ה-checkout" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "14:02. A deploy just started; its migration step adds a nullable column to orders. Two minutes later PagerDuty fires: checkout error rate 92%, p99 latency 30 s (the app's statement timeout). Every endpoint touching orders is failing; the rest of the site is fine.",
        he: "14:02. deploy בדיוק התחיל; שלב ה-migration שלו מוסיף עמודה nullable לטבלת orders. שתי דקות אחר כך PagerDuty מצלצל: error rate של ה-checkout ב-92%, p99 latency של 30 שניות (ה-statement timeout של האפליקציה). כל endpoint שנוגע ב-orders נכשל; שאר האתר בסדר."
      },
      data: "Grafana / RDS:\n  CPUUtilization        14%   (normal: 55%)\n  DatabaseConnections   498 / 500\n  ReadIOPS              low\napp logs:\n  ERROR canceling statement due to statement timeout\n  ERROR HikariPool-1 - Connection is not available, request timed out after 30000ms\ndeploy log:\n  [migrate] ALTER TABLE orders ADD COLUMN gift_note text;   ... (still running)",
      choices: [
        { label: { en: "Check pg_stat_activity for who is blocking whom", he: "לבדוק ב-pg_stat_activity מי חוסם את מי" }, next: "s2", score: 20, feedback: { en: "Right instinct: CPU dropped while connections maxed out on one table — that's a lock queue, not load.", he: "אינסטינקט נכון: ה-CPU ירד בזמן שה-connections בתקרה על טבלה אחת — זה תור locks, לא עומס." } },
        { label: { en: "Scale the DB to a bigger instance class", he: "להגדיל את ה-DB ל-instance class גדול יותר" }, next: "s1b", score: 0, feedback: { en: "CPU is at 14%. Resizing triggers a failover and doesn't remove whatever is holding the lock.", he: "ה-CPU ב-14%. שינוי גודל גורם ל-failover ולא מסיר את מה שמחזיק את ה-lock." } },
        { label: { en: "Restart all the app pods to free connections", he: "לעשות restart לכל ה-pods של האפליקציה כדי לשחרר connections" }, next: "s1b", score: 0, feedback: { en: "New pods open new connections that immediately queue behind the same lock.", he: "Pods חדשים פותחים connections חדשים שמיד נעמדים בתור מאחורי אותו lock." } }
      ]
    },
    s1b: {
      text: {
        en: "14:09. Things got worse. The resize/restart churned every connection, and within seconds the new ones were stuck again. Checkout has been down 7 minutes and the incident channel is filling up. You decide to actually look inside the database.",
        he: "14:09. המצב החמיר. ה-resize/restart ניער את כל ה-connections, ותוך שניות החדשים שוב נתקעו. ה-checkout למטה כבר 7 דקות וערוץ ה-incident מתמלא. אתה מחליט סוף סוף להסתכל בתוך ה-DB."
      },
      choices: [
        { label: { en: "Query pg_stat_activity with pg_blocking_pids", he: "להריץ query על pg_stat_activity עם pg_blocking_pids" }, next: "s2", score: 5, feedback: { en: "Better late than never — always look before you act.", he: "מוטב מאוחר מאשר אף פעם — תמיד מסתכלים לפני שפועלים." } },
        { label: { en: "Reboot the database", he: "לעשות reboot ל-DB" }, next: "lose", score: 0, feedback: { en: "A reboot kills everything, comes back with a cold cache, and the deploy pipeline retries the same migration into the same trap.", he: "Reboot הורג הכול, חוזר עם cache קר, וה-pipeline של ה-deploy מנסה שוב את אותו migration לתוך אותה מלכודת." } }
      ]
    },
    s2: {
      text: {
        en: "You run the blocking-tree query. The picture is clear.",
        he: "אתה מריץ את ה-query של עץ החסימות. התמונה ברורה."
      },
      data: "  pid  | blocked_by |        state        | wait_event      | xact_age | query\n-------+------------+---------------------+-----------------+----------+---------------------------------------------\n  7731 | {}         | idle in transaction | ClientRead      | 01:12:40 | SELECT o.*, c.* FROM orders o JOIN customers c ...\n  9120 | {7731}     | active              | Lock:relation   | 00:03:02 | ALTER TABLE orders ADD COLUMN gift_note text\n  9133 | {9120}     | active              | Lock:relation   | 00:02:59 | SELECT * FROM orders WHERE id = $1\n  9141 | {9120}     | active              | Lock:relation   | 00:02:58 | INSERT INTO orders (customer_id, total, ...)\n  ... 471 more rows with blocked_by = {9120}\n\nusename for 7731: analytics_ro   application_name: jupyter-notebook",
      choices: [
        { label: { en: "Cancel the ALTER (pid 9120) first to drain the queue", he: "קודם לבטל את ה-ALTER (pid 9120) כדי לרוקן את התור" }, next: "s3", score: 20, feedback: { en: "Fastest relief: the 471 queries aren't waiting for 7731 — they're waiting behind the ALTER. Cancel it and they all proceed.", he: "ההקלה הכי מהירה: 471 ה-queries לא מחכים ל-7731 — הם מחכים מאחורי ה-ALTER. מבטלים אותו וכולם ממשיכים." } },
        { label: { en: "Terminate the idle-in-transaction session (pid 7731)", he: "להרוג את ה-session שתקוע idle in transaction (pid 7731)" }, next: "s3b", score: 10, feedback: { en: "This also unblocks things — the ALTER gets its lock and runs in 1 ms — but you're letting a migration run mid-incident without understanding it. Cancelling the ALTER is the more controlled move.", he: "גם זה משחרר — ה-ALTER מקבל את ה-lock ורץ ב-1 ms — אבל אתה נותן ל-migration לרוץ באמצע incident בלי להבין אותו. ביטול ה-ALTER הוא המהלך המבוקר יותר." } },
        { label: { en: "Terminate all 471 waiting queries", he: "להרוג את כל 471 ה-queries שמחכים" }, next: "s1b", score: 0, feedback: { en: "They're victims, not the cause. The app reconnects and they queue behind the same ALTER within a second.", he: "הם קורבנות, לא הסיבה. האפליקציה מתחברת מחדש והם נעמדים בתור מאחורי אותו ALTER תוך שנייה." } }
      ]
    },
    s3: {
      text: {
        en: "SELECT pg_cancel_backend(9120); — within 2 seconds connections drop from 498 to 140 and checkout recovers. The deploy's migration step failed (good: the app version that needs the column didn't roll out). But pid 7731 is still idle in transaction, 72 minutes old.",
        he: "SELECT pg_cancel_backend(9120); — תוך 2 שניות ה-connections יורדים מ-498 ל-140 וה-checkout מתאושש. שלב ה-migration ב-deploy נכשל (טוב: גרסת האפליקציה שצריכה את העמודה לא עלתה). אבל pid 7731 עדיין idle in transaction, בן 72 דקות."
      },
      choices: [
        { label: { en: "Terminate 7731, tell the analyst, then retry the migration with lock_timeout and retries", he: "להרוג את 7731, לעדכן את האנליסט, ואז לנסות שוב את ה-migration עם lock_timeout ו-retries" }, next: "s4", score: 20, feedback: { en: "Remove the root cause, then make the migration safe to retry.", he: "מסירים את סיבת השורש, ואז הופכים את ה-migration לבטוח לניסיון חוזר." } },
        { label: { en: "Just re-run the deploy as-is now that the queue is empty", he: "פשוט להריץ שוב את ה-deploy כמו שהוא, עכשיו שהתור ריק" }, next: "lose", score: 0, feedback: { en: "7731 is still holding ACCESS SHARE. The ALTER queues behind it again and checkout goes down a second time.", he: "7731 עדיין מחזיק ACCESS SHARE. ה-ALTER שוב נעמד בתור מאחוריו וה-checkout נופל בפעם השנייה." } }
      ]
    },
    s3b: {
      text: {
        en: "SELECT pg_terminate_backend(7731); — the ALTER grabs its lock, finishes in 2 ms, and the queue drains. Checkout recovers at 14:06. It worked, but the deploy continues rolling out automatically while you're still investigating.",
        he: "SELECT pg_terminate_backend(7731); — ה-ALTER תופס את ה-lock, מסיים ב-2 ms, והתור מתרוקן. ה-checkout מתאושש ב-14:06. זה עבד, אבל ה-deploy ממשיך להתגלגל אוטומטית בזמן שאתה עדיין חוקר."
      },
      choices: [
        { label: { en: "Let it finish, then fix the process so it can't happen again", he: "לתת לו לסיים, ואז לתקן את התהליך כדי שזה לא יקרה שוב" }, next: "s4", score: 10, feedback: { en: "Fine outcome. Next time, cancel the DDL first so you choose when it runs.", he: "תוצאה סבירה. בפעם הבאה, קודם מבטלים את ה-DDL כדי שאתה תבחר מתי הוא ירוץ." } }
      ]
    },
    s4: {
      text: {
        en: "Service is healthy. Time to make sure this class of incident can't recur. What's the most important set of changes?",
        he: "השירות בריא. הזמן לוודא שסוג ה-incident הזה לא יחזור. מה סט השינויים הכי חשוב?"
      },
      data: "Postmortem timeline:\n  12:50  analyst opens notebook, runs SELECT in autocommit=off, goes to lunch\n  14:02  migration ALTER TABLE orders ... waits for ACCESS EXCLUSIVE\n  14:02+ every new query on orders queues behind the ALTER\n  14:05  ALTER cancelled -> recovery",
      choices: [
        { label: { en: "lock_timeout + retry in every migration, idle_in_transaction_session_timeout on all roles, analytics on a replica, a migration linter in CI", he: "lock_timeout + retry בכל migration, idle_in_transaction_session_timeout על כל ה-roles, analytics על replica, ו-migration linter ב-CI" }, next: "win", score: 20, feedback: { en: "Defense in depth: the DDL fails fast, forgotten transactions die automatically, humans stop touching the primary, and CI rejects unsafe migrations.", he: "הגנה בשכבות: ה-DDL נכשל מהר, transactions שנשכחו מתות אוטומטית, בני אדם מפסיקים לגעת ב-primary, וה-CI דוחה migrations לא בטוחים." } },
        { label: { en: "Only run migrations at 3 AM from now on", he: "מעכשיו להריץ migrations רק ב-3 בלילה" }, next: "lose", score: 0, feedback: { en: "A forgotten transaction or a nightly batch job holds locks at 3 AM too — and now nobody is awake to notice.", he: "Transaction שנשכחה או batch job לילי מחזיקים locks גם ב-3 בלילה — ועכשיו אף אחד לא ער כדי לשים לב." } },
        { label: { en: "Raise max_connections to 2000 so there's headroom", he: "להעלות את max_connections ל-2000 כדי שיהיה מרווח" }, next: "lose", score: 0, feedback: { en: "More connections just means more queries piled up behind the same lock, plus more memory pressure.", he: "יותר connections זה פשוט יותר queries שנערמים מאחורי אותו lock, ועוד לחץ על הזיכרון." } }
      ]
    },
    win: {
      text: {
        en: "Resolved in 3 minutes of impact. The migration was re-run with SET lock_timeout = '3s' in a retry loop and succeeded on the second attempt. idle_in_transaction_session_timeout = 60s is now set for every role, the analytics team uses a read replica, and squawk in CI blocks any migration without lock_timeout. Lesson: a fast DDL is only safe if it can't wait.",
        he: "נפתר עם 3 דקות השפעה. ה-migration הורץ שוב עם SET lock_timeout = '3s' בלולאת retry והצליח בניסיון השני. idle_in_transaction_session_timeout = 60s מוגדר עכשיו לכל role, צוות ה-analytics עובד על read replica, ו-squawk ב-CI חוסם כל migration בלי lock_timeout. הלקח: DDL מהיר בטוח רק אם הוא לא יכול לחכות."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "Checkout went down again (or never fully recovered). The root cause — a 70-minute idle-in-transaction session plus a DDL with no lock_timeout — is still in place. Lesson: in a lock pile-up, find the blocker tree first, cancel the waiting DDL, kill the idle root, and add timeouts so it can't recur.",
        he: "ה-checkout נפל שוב (או אף פעם לא התאושש לגמרי). סיבת השורש — session שתקוע idle in transaction 70 דקות ועוד DDL בלי lock_timeout — עדיין במקום. הלקח: בהצטברות locks, קודם מוצאים את עץ החוסמים, מבטלים את ה-DDL שמחכה, הורגים את ה-root שתקוע, ומוסיפים timeouts כדי שזה לא יחזור."
      },
      end: "lose"
    }
  },
  lessons: ["db-query-debugging", "db-operations", "staff-postgres-at-scale", "staff-zero-downtime-migrations"]
});
