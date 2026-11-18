window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. Time-series databases
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-time-series",
  track: "data",
  order: 34,
  icon: "📈",
  level: 2,
  minutes: 13,
  title: { en: "Time-Series Databases", he: "Time-Series Databases – מסדי נתונים לסדרות זמן" },
  tldr: {
    en: "A TSDB stores (metric + labels, timestamp, value) points append-only, compresses them to ~1.3 bytes/sample and queries by time range — and the thing that kills it is not data volume but the number of unique label combinations (cardinality).",
    he: "TSDB שומר נקודות של (metric + labels, timestamp, value) ב-append-only, דוחס אותן לבערך 1.3 bytes ל-sample ומחפש לפי טווחי זמן — ומה שהורג אותו זה לא נפח ה-data אלא מספר הצירופים הייחודיים של labels (cardinality)."
  },
  analogy: {
    en: "A TSDB is a hospital heart monitor wall. Each patient (series) has its own strip of paper that only ever moves forward; nobody edits yesterday's strip, and nurses ask 'show me bed 12 for the last hour', never 'find every patient whose heartbeat was 72'. Add a new bed and you add a whole new strip printer — add a label like user_id and you just ordered a million printers.",
    he: "TSDB זה קיר המוניטורים בטיפול נמרץ. לכל מטופל (series) יש סרט נייר משלו שרק מתקדם קדימה; אף אחד לא עורך את הסרט של אתמול, והאחיות שואלות \"תראה לי את מיטה 12 בשעה האחרונה\", אף פעם לא \"מצא כל מטופל שהדופק שלו היה 72\". מוסיף מיטה — מוסיף מדפסת סרט שלמה. מוסיף label כמו user_id — הזמנת עכשיו מיליון מדפסות."
  },
  sections: [
    {
      h: { en: "The data model and why Postgres-as-is struggles", he: "מודל ה-data ולמה Postgres רגיל מתקשה" },
      body: {
        en: `<p>Every point is <strong>series identity + timestamp + value</strong>. The identity is a metric name plus a set of labels (tags):</p>
<pre>http_requests_total{service="checkout", method="POST", status="500", pod="checkout-7d9f-abc12"}  @1763130000  =&gt; 48213</pre>
<p>A <strong>series</strong> is one unique combination of name + labels. Workload shape: millions of tiny writes per second, almost all for "now"; never updated; read as ranges (<code>last 6h</code>) and aggregated (<code>rate</code>, <code>avg by service</code>); old data is downsampled then deleted.</p>
<p>A general-purpose row store fights this: one row per sample = ~50-100 bytes with tuple header + index entries (vs ~1.3 bytes in a TSDB), a B-tree index that grows forever, <code>DELETE</code> of old data creating bloat and VACUUM work, and no native <code>rate()</code> over counter resets. At 1M samples/s that is 86 billion rows per day.</p>
<table><tr><th></th><th>OLTP DB</th><th>TSDB</th></tr>
<tr><td>Writes</td><td>random, updates</td><td>append-only, "now"</td></tr>
<tr><td>Storage/sample</td><td>~50-100 B</td><td>~1-2 B</td></tr>
<tr><td>Retention</td><td>DELETE (bloat)</td><td>drop whole block/chunk (free)</td></tr>
<tr><td>Query</td><td>point lookups, joins</td><td>range scans + aggregation</td></tr></table>`,
        he: `<p>כל נקודה היא <strong>זהות series + timestamp + value</strong>. הזהות היא שם metric ועוד סט של labels (tags):</p>
<pre>http_requests_total{service="checkout", method="POST", status="500", pod="checkout-7d9f-abc12"}  @1763130000  =&gt; 48213</pre>
<p><strong>Series</strong> הוא צירוף ייחודי אחד של שם + labels. צורת ה-workload: מיליוני כתיבות קטנטנות בשנייה, כמעט כולן ל"עכשיו"; אף פעם לא מעדכנים; קוראים טווחים (<code>last 6h</code>) ומאגרגים (<code>rate</code>, <code>avg by service</code>); data ישן עובר downsampling ואז נמחק.</p>
<p>Row store כללי נלחם בזה: שורה ל-sample = בערך 50-100 bytes עם ה-tuple header וה-index entries (מול בערך 1.3 bytes ב-TSDB), B-tree index שגדל לנצח, <code>DELETE</code> של data ישן שיוצר bloat ועבודת VACUUM, ואין <code>rate()</code> מובנה שמבין איפוס של counter. ב-1M samples לשנייה זה 86 מיליארד שורות ביום.</p>
<table><tr><th></th><th>OLTP DB</th><th>TSDB</th></tr>
<tr><td>כתיבות</td><td>אקראיות, updates</td><td>append-only, "עכשיו"</td></tr>
<tr><td>Storage ל-sample</td><td>בערך 50-100 B</td><td>בערך 1-2 B</td></tr>
<tr><td>Retention</td><td>DELETE (bloat)</td><td>זורקים block/chunk שלם (בחינם)</td></tr>
<tr><td>Query</td><td>point lookups, joins</td><td>range scans + אגרגציה</td></tr></table>`
      }
    },
    {
      h: { en: "Inside Prometheus TSDB: head, WAL, 2h blocks, Gorilla", he: "בתוך ה-TSDB של Prometheus: head, WAL, בלוקים של 2h, Gorilla" },
      body: {
        en: `<ul><li><strong>Head block</strong> — the last ~2-3 hours live in memory. Each active series has an in-memory chunk; a chunk holds up to 120 samples (30 min at a 15s scrape) and is then cut and memory-mapped to disk (<code>chunks_head/</code>).</li>
<li><strong>WAL</strong> — every sample is first appended to <code>wal/</code> in 128 MB segments, so a crash loses nothing; on restart Prometheus replays it (that is why a big Prometheus takes minutes to become ready).</li>
<li><strong>Persistent blocks</strong> — every 2h the head is compacted into an immutable block directory: <code>chunks/</code>, an <code>index</code> (label → posting list of series IDs, an inverted index) and <code>meta.json</code>.</li>
<li><strong>Compaction</strong> — background merges 2h blocks into larger ones (up to 10% of retention, max 31 days). Retention = delete whole block directories: O(1), no bloat.</li></ul>
<p><strong>Gorilla compression</strong> (Facebook, 2015): timestamps are stored as <em>delta-of-delta</em> — with a steady 15s scrape the delta-of-delta is 0, encoded in 1 bit. Values are XORed with the previous value; a slowly changing gauge shares most bits, so only the few meaningful bits are written. Result: <strong>~1.3 bytes per sample</strong> instead of 16.</p>
<pre>prometheus_tsdb_head_series          1,840,221     # active series (THE number to watch)
prometheus_tsdb_head_samples_appended_total  rate =&gt; 122k/s
prometheus_tsdb_compactions_failed_total     0

disk ≈ retention_s × samples/s × 1.3 B
     = 15d (1,296,000 s) × 122,000 × 1.3 ≈ 205 GB</pre>
<blockquote>💡 Real world: memory, not disk, is what tips Prometheus over. Budget roughly 3-4 KB of RAM per active head series (plus query overhead): 2M series ≈ 8 GB just for the head. That is why a cardinality spike shows up as OOMKilled Prometheus pods.</blockquote>`,
        he: `<ul><li><strong>Head block</strong> — השעתיים-שלוש האחרונות חיות בזיכרון. לכל series פעיל יש chunk בזיכרון; chunk מחזיק עד 120 samples (30 דקות ב-scrape של 15s) ואז נחתך וממופה לדיסק (<code>chunks_head/</code>).</li>
<li><strong>WAL</strong> — כל sample נכתב קודם ל-<code>wal/</code> ב-segments של 128 MB, כך ש-crash לא מאבד כלום; ב-restart הוא מריץ אותו מחדש (בגלל זה Prometheus גדול לוקח דקות עד שהוא ready).</li>
<li><strong>בלוקים קבועים</strong> — כל שעתיים ה-head עובר compaction לתיקיית block שלא משתנה: <code>chunks/</code>, <code>index</code> (label ← posting list של series IDs, בעצם inverted index) ו-<code>meta.json</code>.</li>
<li><strong>Compaction</strong> — ברקע ממזג בלוקים של 2h לבלוקים גדולים יותר (עד 10% מה-retention, מקסימום 31 יום). Retention = מוחקים תיקיות block שלמות: O(1), בלי bloat.</li></ul>
<p><strong>דחיסת Gorilla</strong> (Facebook, 2015): timestamps נשמרים כ-<em>delta-of-delta</em> — ב-scrape קבוע של 15s ה-delta-of-delta הוא 0, ומקודד בביט אחד. ערכים עוברים XOR עם הערך הקודם; gauge שמשתנה לאט חולק את רוב הביטים, אז נכתבים רק המעטים שמשנים. התוצאה: <strong>בערך 1.3 bytes ל-sample</strong> במקום 16.</p>
<pre>prometheus_tsdb_head_series          1,840,221     # active series (THE number to watch)
prometheus_tsdb_head_samples_appended_total  rate =&gt; 122k/s
prometheus_tsdb_compactions_failed_total     0

disk ≈ retention_s × samples/s × 1.3 B
     = 15d (1,296,000 s) × 122,000 × 1.3 ≈ 205 GB</pre>
<blockquote>💡 מהשטח: הזיכרון, לא הדיסק, הוא מה שמפיל את Prometheus. תתקצב בערך 3-4 KB של RAM לכל series פעיל ב-head (ועוד overhead של queries): 2M series ≈ 8 GB רק ל-head. בגלל זה קפיצת cardinality נראית כמו Pods של Prometheus ב-OOMKilled.</blockquote>`
      }
    },
    {
      h: { en: "InfluxDB, TimescaleDB and the long-term storage layer", he: "InfluxDB, TimescaleDB ושכבת ה-long-term storage" },
      body: {
        en: `<p><strong>InfluxDB</strong> — push-based, its own line protocol. 1.x/2.x use the TSM engine (LSM-like) with an in-memory series index that suffers at high cardinality; InfluxDB 3 was rewritten on Apache Arrow + DataFusion + Parquet in object storage, aimed at high cardinality and SQL.</p>
<pre>cpu,host=web1,region=eu-west-1 usage_user=12.5,usage_system=3.1 1763130000000000000</pre>
<p><strong>TimescaleDB</strong> — a Postgres extension. You keep SQL, joins with business tables, and Postgres tooling. A <strong>hypertable</strong> looks like one table but is automatically partitioned into <strong>chunks</strong> by time; retention drops whole chunks, native compression turns old chunks columnar (often 90%+ smaller), and <strong>continuous aggregates</strong> are incrementally refreshed materialized views.</p>
<pre>CREATE TABLE metrics (time timestamptz NOT NULL, device_id int, temp double precision);
SELECT create_hypertable('metrics', by_range('time', INTERVAL '1 day'));

CREATE MATERIALIZED VIEW metrics_1h WITH (timescaledb.continuous) AS
  SELECT time_bucket('1 hour', time) AS bucket, device_id, avg(temp), max(temp)
  FROM metrics GROUP BY bucket, device_id;

SELECT add_continuous_aggregate_policy('metrics_1h',
  start_offset =&gt; INTERVAL '3 hours', end_offset =&gt; INTERVAL '1 hour',
  schedule_interval =&gt; INTERVAL '30 minutes');
SELECT add_compression_policy('metrics', INTERVAL '7 days');
SELECT add_retention_policy('metrics', INTERVAL '90 days');   -- drops chunks</pre>
<p><strong>Long-term Prometheus</strong>: a single Prometheus is one node with local disk and ~15 days of retention. For a year of metrics across 20 clusters you add:</p>
<ul><li><strong>Thanos</strong> — a sidecar uploads each 2h block to S3/GCS; Store Gateway serves old blocks; Querier fans out and dedups HA pairs; Compactor downsamples (5m resolution after 40h, 1h after 10d).</li>
<li><strong>Grafana Mimir</strong> (Cortex successor) — Prometheus <code>remote_write</code>s to a horizontally sharded cluster backed by object storage; multi-tenant, built for 100M+ series.</li>
<li><strong>VictoriaMetrics</strong> — single binary or cluster, very RAM/disk efficient, PromQL-compatible MetricsQL; a popular cheaper drop-in.</li></ul>`,
        he: `<p><strong>InfluxDB</strong> — push-based, עם line protocol משלו. גרסאות 1.x/2.x משתמשות במנוע TSM (דומה ל-LSM) עם series index בזיכרון שסובל ב-cardinality גבוה; InfluxDB 3 נכתב מחדש על Apache Arrow + DataFusion + Parquet ב-object storage, ומכוון ל-cardinality גבוה ול-SQL.</p>
<pre>cpu,host=web1,region=eu-west-1 usage_user=12.5,usage_system=3.1 1763130000000000000</pre>
<p><strong>TimescaleDB</strong> — extension של Postgres. נשאר לך SQL, joins עם טבלאות עסקיות וכל הכלים של Postgres. <strong>Hypertable</strong> נראית כמו טבלה אחת אבל מחולקת אוטומטית ל-<strong>chunks</strong> לפי זמן; retention זורק chunks שלמים, דחיסה מובנית הופכת chunks ישנים ל-columnar (לרוב קטן ביותר מ-90%), ו-<strong>continuous aggregates</strong> הם materialized views שמתרעננים באופן incremental.</p>
<pre>CREATE TABLE metrics (time timestamptz NOT NULL, device_id int, temp double precision);
SELECT create_hypertable('metrics', by_range('time', INTERVAL '1 day'));

CREATE MATERIALIZED VIEW metrics_1h WITH (timescaledb.continuous) AS
  SELECT time_bucket('1 hour', time) AS bucket, device_id, avg(temp), max(temp)
  FROM metrics GROUP BY bucket, device_id;

SELECT add_continuous_aggregate_policy('metrics_1h',
  start_offset =&gt; INTERVAL '3 hours', end_offset =&gt; INTERVAL '1 hour',
  schedule_interval =&gt; INTERVAL '30 minutes');
SELECT add_compression_policy('metrics', INTERVAL '7 days');
SELECT add_retention_policy('metrics', INTERVAL '90 days');   -- drops chunks</pre>
<p><strong>Prometheus לטווח ארוך</strong>: Prometheus בודד הוא node אחד עם דיסק מקומי ובערך 15 יום retention. בשביל שנה של metrics מ-20 clusters מוסיפים:</p>
<ul><li><strong>Thanos</strong> — sidecar מעלה כל block של 2h ל-S3/GCS; Store Gateway מגיש בלוקים ישנים; Querier עושה fan-out ו-dedup לזוגות HA; Compactor עושה downsampling (רזולוציה של 5m אחרי 40h, שעה אחרי 10 ימים).</li>
<li><strong>Grafana Mimir</strong> (היורש של Cortex) — Prometheus עושה <code>remote_write</code> ל-cluster מחולק אופקית על object storage; multi-tenant, בנוי ל-100M+ series.</li>
<li><strong>VictoriaMetrics</strong> — בינארי בודד או cluster, חסכוני מאוד ב-RAM ובדיסק, MetricsQL תואם PromQL; תחליף זול ופופולרי.</li></ul>`
      }
    },
    {
      h: { en: "Downsampling and retention tiers", he: "Downsampling ושכבות retention" },
      body: {
        en: `<p>Nobody needs 15-second resolution from 11 months ago. A typical policy:</p>
<table><tr><th>Age</th><th>Resolution</th><th>Where</th></tr>
<tr><td>0-15 days</td><td>raw (15s)</td><td>Prometheus local / hot</td></tr>
<tr><td>15-90 days</td><td>5 min</td><td>object storage</td></tr>
<tr><td>90 days - 2 years</td><td>1 hour</td><td>object storage</td></tr></table>
<p>Downsampling keeps <em>aggregates</em> per bucket (Thanos stores count, sum, min, max and counter for each 5m/1h window) so <code>avg</code>, <code>max</code> and <code>rate</code> still work. You lose spikes shorter than the bucket: a 20-second latency spike disappears inside a 1h average.</p>
<blockquote>⚠️ Production tip: recording rules are cheap downsampling you control. Precompute <code>job:http_requests:rate5m</code> instead of making every dashboard aggregate 400k raw series on load — dashboards go from 12s to 200ms.</blockquote>`,
        he: `<p>אף אחד לא צריך רזולוציה של 15 שניות מלפני 11 חודשים. מדיניות טיפוסית:</p>
<table><tr><th>גיל</th><th>רזולוציה</th><th>איפה</th></tr>
<tr><td>0-15 ימים</td><td>raw (15s)</td><td>Prometheus מקומי / hot</td></tr>
<tr><td>15-90 ימים</td><td>5 דקות</td><td>object storage</td></tr>
<tr><td>90 ימים עד שנתיים</td><td>שעה</td><td>object storage</td></tr></table>
<p>Downsampling שומר <em>אגרגטים</em> לכל bucket (Thanos שומר count, sum, min, max ו-counter לכל חלון של 5m/1h) כך ש-<code>avg</code>, <code>max</code> ו-<code>rate</code> עדיין עובדים. מה שהולך לאיבוד זה spikes קצרים מה-bucket: spike של latency של 20 שניות נעלם בתוך ממוצע של שעה.</p>
<blockquote>⚠️ טיפ לפרודקשן: recording rules הם downsampling זול שאתה שולט בו. תחשב מראש <code>job:http_requests:rate5m</code> במקום שכל dashboard יאגרג 400k series גולמיים בטעינה — dashboards יורדים מ-12 שניות ל-200ms.</blockquote>`
      }
    },
    {
      h: { en: "Cardinality explosion: the math", he: "פיצוץ cardinality: המתמטיקה" },
      body: {
        en: `<p>Series count is the <strong>product</strong> of label value counts, not the sum:</p>
<pre>http_request_duration_seconds_bucket
  service   20
  endpoint  50
  method     4
  status     8
  pod       30   (per service)
  le        12   (histogram buckets)

20 × 50 × 4 × 8 × 30 × 12 = 11,520,000 series   (already too many!)

add user_id (50,000 active users)  ×50,000  = 576 billion  → dead</pre>
<p>Real culprits: <code>user_id</code>, <code>request_id</code>, raw URL paths (<code>/orders/98123</code> instead of <code>/orders/:id</code>), error message text, pod names under fast autoscaling or CrashLoop churn (each new pod = new series; old ones linger until head compaction).</p>
<pre># top 10 metrics by series count
topk(10, count by (__name__) ({__name__=~".+"}))

# which label is exploding on one metric
count(count by (path) (http_requests_total))</pre>
<p>Fixes: drop/relabel at scrape (<code>metric_relabel_configs</code> with <code>action: labeldrop</code>), normalize paths in the instrumentation, set <code>sample_limit</code> per scrape job so one bad deploy cannot take Prometheus down, and put high-cardinality detail in <strong>logs/traces</strong> (with exemplars linking the two) instead of labels.</p>
<p><strong>Choosing</strong>: infra/k8s metrics → Prometheus + (Thanos | Mimir | VictoriaMetrics). IoT/business time series that must join relational data → TimescaleDB. Push-based sensors/events with SQL → InfluxDB 3 or ClickHouse. Managed and done → Amazon Managed Prometheus, Grafana Cloud, Azure Monitor managed Prometheus.</p>`,
        he: `<p>מספר ה-series הוא <strong>המכפלה</strong> של מספר הערכים בכל label, לא הסכום:</p>
<pre>http_request_duration_seconds_bucket
  service   20
  endpoint  50
  method     4
  status     8
  pod       30   (per service)
  le        12   (histogram buckets)

20 × 50 × 4 × 8 × 30 × 12 = 11,520,000 series   (already too many!)

add user_id (50,000 active users)  ×50,000  = 576 billion  → dead</pre>
<p>האשמים האמיתיים: <code>user_id</code>, <code>request_id</code>, נתיבי URL גולמיים (<code>/orders/98123</code> במקום <code>/orders/:id</code>), טקסט של הודעות שגיאה, שמות Pods ב-autoscaling מהיר או ב-churn של CrashLoop (כל Pod חדש = series חדש; הישנים נשארים עד ה-compaction של ה-head).</p>
<pre># top 10 metrics by series count
topk(10, count by (__name__) ({__name__=~".+"}))

# which label is exploding on one metric
count(count by (path) (http_requests_total))</pre>
<p>תיקונים: לזרוק/לעשות relabel ב-scrape (<code>metric_relabel_configs</code> עם <code>action: labeldrop</code>), לנרמל נתיבים כבר ב-instrumentation, להגדיר <code>sample_limit</code> לכל scrape job כדי ש-deploy רע אחד לא יפיל את Prometheus, ולשים פירוט עם cardinality גבוה ב-<strong>logs/traces</strong> (עם exemplars שמקשרים ביניהם) במקום ב-labels.</p>
<p><strong>איך בוחרים</strong>: metrics של infra/k8s ← Prometheus + (Thanos | Mimir | VictoriaMetrics). IoT או סדרות זמן עסקיות שצריכות join עם data רלציוני ← TimescaleDB. חיישנים/אירועים ב-push עם SQL ← InfluxDB 3 או ClickHouse. רוצה managed וזהו ← Amazon Managed Prometheus, Grafana Cloud, Azure Monitor managed Prometheus.</p>`
      }
    }
  ],
  diagram: `scrape / remote_write
        |
        v
  +-------------- Prometheus TSDB ---------------+
  |  WAL (128MB segments)  <- every sample first |
  |  HEAD (memory, ~2-3h) chunks of 120 samples  |
  |        | every 2h                            |
  |        v                                     |
  |  [block 2h][block 2h][block 2h] -> compaction|
  |  [ block 6h/18h/... up to 10% retention ]    |
  +-------------------|--------------------------+
                      | sidecar upload / remote_write
                      v
     S3 / GCS  (Thanos / Mimir / VictoriaMetrics)
     raw 15s -> 5m (after 40h) -> 1h (after 10d)

  series = 20 svc x 50 endpoint x 4 method x 8 status x 30 pod x 12 le = 11.5M`,
  handsOn: [
    { cmd: "curl -s localhost:9090/api/v1/status/tsdb | jq '.data.headStats, .data.seriesCountByMetricName[:5]'", what: { en: "Prometheus built-in cardinality report: head series count and the top metrics by series.", he: "דוח cardinality מובנה של Prometheus: מספר ה-series ב-head וה-metrics עם הכי הרבה series." } },
    { cmd: "promtool tsdb analyze /prometheus", what: { en: "Offline analysis of a TSDB directory: highest-cardinality labels, label pairs and churn.", he: "ניתוח offline של תיקיית TSDB: ה-labels עם ה-cardinality הכי גבוה, זוגות labels ו-churn." } },
    { cmd: "ls -lh /prometheus/ /prometheus/wal | head -30", what: { en: "See the real layout: ULID-named 2h block directories, chunks_head and WAL segments.", he: "תראה את המבנה האמיתי: תיקיות block של 2h עם שמות ULID, chunks_head ו-segments של ה-WAL." } },
    { cmd: "psql -c \"SELECT hypertable_name, chunk_name, range_start, is_compressed FROM timescaledb_information.chunks ORDER BY range_start DESC LIMIT 5;\"", what: { en: "TimescaleDB: list the newest chunks of your hypertables and whether they are compressed.", he: "TimescaleDB: מציג את ה-chunks החדשים ב-hypertables ואם הם דחוסים." } }
  ],
  mnemonic: {
    en: "\"Labels multiply, they don't add.\" Every label you add is a multiplication sign in front of your RAM bill. IDs go in logs, categories go in labels.",
    he: "\"Labels מכפילים, לא מחברים.\" כל label שאתה מוסיף הוא סימן כפל לפני חשבון ה-RAM שלך. מזהים הולכים ל-logs, קטגוריות הולכות ל-labels."
  },
  pitfalls: [
    { en: "Putting user_id, request_id or raw URL paths into labels — series count explodes and Prometheus OOMs within hours of the deploy.", he: "לשים user_id, request_id או נתיבי URL גולמיים ב-labels — מספר ה-series מתפוצץ ו-Prometheus נופל ל-OOM תוך שעות מה-deploy." },
    { en: "Treating one Prometheus as long-term storage by setting retention to 1 year on a local disk — one node, no HA, restarts replaying a huge WAL and queries over months that time out.", he: "להשתמש ב-Prometheus בודד כ-long-term storage עם retention של שנה על דיסק מקומי — node אחד, בלי HA, restarts שמריצים WAL ענק ו-queries על חודשים שנגמרים ב-timeout." },
    { en: "Alerting on downsampled data — a 1h average hides the 3-minute outage your SLO actually cares about. Alert on raw recent data.", he: "לעשות alerting על data אחרי downsampling — ממוצע של שעה מסתיר את ה-outage של 3 דקות שה-SLO באמת אכפת לו ממנו. Alerts רק על data גולמי ועדכני." },
    { en: "Storing metrics in a plain Postgres table with DELETE-based retention — constant bloat, autovacuum storms and a B-tree that never shrinks. Use partitions/hypertables and drop chunks.", he: "לשמור metrics בטבלת Postgres רגילה עם retention מבוסס DELETE — bloat קבוע, סערות autovacuum ו-B-tree שאף פעם לא קטן. תשתמש ב-partitions/hypertables ותזרוק chunks." }
  ],
  interview: [
    {
      q: { en: "Prometheus memory went from 6 GB to 28 GB after yesterday's deploy and it keeps getting OOMKilled. What do you do?", he: "הזיכרון של Prometheus עלה מ-6 GB ל-28 GB אחרי ה-deploy של אתמול והוא נופל ל-OOMKilled שוב ושוב. מה אתה עושה?" },
      a: {
        en: "It's cardinality until proven otherwise. Check prometheus_tsdb_head_series and /api/v1/status/tsdb (or promtool tsdb analyze on the data dir if it won't start) to find the metric and label that exploded — typically a new label like path or user_id. Immediate mitigation: metric_relabel_configs to drop the label or the metric for that job, plus sample_limit so it can't recur; temporarily raise memory so the WAL replay completes. Long term: fix the instrumentation (route templates, not raw paths), add a cardinality alert, and review new metrics in code review.",
        he: "זה cardinality עד שיוכח אחרת. בודקים prometheus_tsdb_head_series ו-/api/v1/status/tsdb (או promtool tsdb analyze על תיקיית ה-data אם הוא לא עולה) כדי למצוא איזה metric ו-label התפוצצו — בדרך כלל label חדש כמו path או user_id. מיטיגציה מיידית: metric_relabel_configs שזורק את ה-label או את ה-metric ל-job הזה, ועוד sample_limit כדי שזה לא יחזור; מעלים זיכרון זמנית כדי שה-replay של ה-WAL יסתיים. לטווח ארוך: מתקנים את ה-instrumentation (route templates, לא נתיבים גולמיים), מוסיפים alert על cardinality, ובודקים metrics חדשים ב-code review."
      }
    },
    {
      q: { en: "Why is a TSDB so much smaller on disk than storing the same samples in MySQL?", he: "למה TSDB קטן כל כך על הדיסק לעומת שמירת אותם samples ב-MySQL?" },
      a: {
        en: "Because it stores per-series columns of (timestamp, value) instead of rows. Series labels are stored once in an index, not per sample. Timestamps use delta-of-delta (regular scrapes compress to ~1 bit) and values use XOR encoding (Gorilla), giving ~1.3 bytes per sample vs ~50-100 bytes per row with tuple headers and secondary index entries. Retention is dropping whole files, so there is no fragmentation.",
        he: "כי הוא שומר עמודות של (timestamp, value) לכל series במקום שורות. ה-labels של ה-series נשמרים פעם אחת ב-index, לא בכל sample. Timestamps נשמרים ב-delta-of-delta (scrape קבוע נדחס לבערך ביט אחד) והערכים ב-XOR encoding (Gorilla), וזה נותן בערך 1.3 bytes ל-sample מול 50-100 bytes לשורה עם tuple headers ו-secondary index entries. ו-retention זה לזרוק קבצים שלמים, אז אין פרגמנטציה."
      }
    }
  ],
  quiz: [
    {
      q: { en: "A histogram metric has labels service(10), endpoint(40), status(5) and 10 buckets (le). How many series?", he: "ל-histogram יש labels של service(10), endpoint(40), status(5) ו-10 buckets (le). כמה series יש?" },
      options: [
        { en: "65", he: "65" },
        { en: "2,000", he: "2,000" },
        { en: "20,000", he: "20,000" },
        { en: "4,000,000", he: "4,000,000" }
      ],
      answer: 2,
      explain: { en: "Series multiply: 10 × 40 × 5 × 10 = 20,000 (and real histograms add _sum and _count series on top).", he: "Series מוכפלים: 10 × 40 × 5 × 10 = 20,000 (ובפועל histogram מוסיף גם series של _sum ו-_count)." }
    },
    {
      q: { en: "Why does deleting data past retention cost almost nothing in Prometheus or TimescaleDB?", he: "למה מחיקת data אחרי ה-retention כמעט לא עולה כלום ב-Prometheus או ב-TimescaleDB?" },
      options: [
        { en: "They run DELETE in a background thread", he: "הם מריצים DELETE ב-thread ברקע" },
        { en: "Data is partitioned by time, so whole blocks/chunks are dropped as files", he: "ה-data מחולק לפי זמן, אז זורקים blocks/chunks שלמים כקבצים" },
        { en: "Old data is compressed to zero bytes", he: "data ישן נדחס לאפס bytes" },
        { en: "They never delete data", he: "הם אף פעם לא מוחקים data" }
      ],
      answer: 1,
      explain: { en: "Time partitioning (2h blocks, hypertable chunks) turns retention into dropping a directory or a table — no row-by-row deletes, no bloat, no vacuum.", he: "חלוקה לפי זמן (בלוקים של 2h, chunks של hypertable) הופכת retention לזריקת תיקייה או טבלה — בלי מחיקה שורה-שורה, בלי bloat, בלי vacuum." }
    },
    {
      q: { en: "What does Gorilla compression exploit to store timestamps in about 1 bit?", he: "על מה דחיסת Gorilla מסתמכת כדי לשמור timestamps בבערך ביט אחד?" },
      options: [
        { en: "Timestamps are rounded to the nearest hour", he: "Timestamps מעוגלים לשעה הקרובה" },
        { en: "Regular scrape intervals make the delta-of-delta zero", he: "Scrape במרווחים קבועים הופך את ה-delta-of-delta לאפס" },
        { en: "Timestamps are not stored at all", he: "Timestamps לא נשמרים בכלל" },
        { en: "It uses gzip on every sample", he: "הוא עושה gzip לכל sample" }
      ],
      answer: 1,
      explain: { en: "With a steady 15s interval, deltas are all 15 and the delta-of-delta is 0, encoded as a single '0' bit. Values use XOR with the previous value.", he: "במרווח קבוע של 15s כל ה-deltas הם 15 וה-delta-of-delta הוא 0, שמקודד כביט '0' אחד. הערכים עוברים XOR עם הערך הקודם." }
    },
    {
      q: { en: "You need 2 years of metrics from 15 Kubernetes clusters with global queries. Best fit?", he: "צריך שנתיים של metrics מ-15 clusters של Kubernetes עם queries גלובליים. מה הכי מתאים?" },
      options: [
        { en: "One Prometheus per cluster with retention=730d", he: "Prometheus אחד לכל cluster עם retention=730d" },
        { en: "Prometheus + Thanos/Mimir/VictoriaMetrics on object storage with downsampling", he: "Prometheus + Thanos/Mimir/VictoriaMetrics על object storage עם downsampling" },
        { en: "A Postgres table per cluster", he: "טבלת Postgres לכל cluster" },
        { en: "Elasticsearch with one index per metric", he: "Elasticsearch עם index לכל metric" }
      ],
      answer: 1,
      explain: { en: "Long-term, global, HA metrics is exactly what Thanos/Mimir/VictoriaMetrics add: cheap object storage, downsampling, a global query layer and dedup.", he: "Metrics לטווח ארוך, גלובליים ועם HA זה בדיוק מה ש-Thanos/Mimir/VictoriaMetrics מוסיפים: object storage זול, downsampling, שכבת query גלובלית ו-dedup." }
    }
  ],
  related: ["obs-metrics", "db-sql-vs-nosql", "obs-dashboards", "db-storage-engines"]
});

// ---------------------------------------------------------------------------
// 2. Restore runbook
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-restore-runbook",
  track: "data",
  order: 35,
  icon: "🛟",
  level: 3,
  minutes: 15,
  title: { en: "Restoring from Backup: the Runbook", he: "שחזור מ-Backup: ה-Runbook" },
  tldr: {
    en: "Restore side-by-side into a NEW target, never over prod; replay logs to a precise, timezone-explicit point; verify with counts, checksums and a smoke test; then cut over (swap endpoint or merge rows back) — and write down how long it really took.",
    he: "משחזרים side-by-side ל-target חדש, אף פעם לא על פרודקשן; מריצים logs לנקודה מדויקת עם timezone מפורש; מאמתים עם ספירות, checksums ו-smoke test; ואז עושים cutover (מחליפים endpoint או ממזגים שורות חזרה) — ורושמים כמה זמן זה באמת לקח."
  },
  analogy: {
    en: "Restoring is like a surgeon re-attaching a finger: you don't operate on the patient while running to the fridge. You prepare a clean table next to him (side-by-side target), check the finger is the right one and still alive (verify), and only then connect it (cutover). Operating directly on prod with an untested backup is surgery with your eyes closed.",
    he: "שחזור זה כמו מנתח שמחבר אצבע: לא מנתחים את המטופל תוך כדי ריצה למקרר. מכינים שולחן נקי לידו (target ב-side-by-side), בודקים שזו האצבע הנכונה ושהיא עוד חיה (verify), ורק אז מחברים (cutover). לשחזר ישירות על פרודקשן עם backup שלא נבדק זה ניתוח בעיניים עצומות."
  },
  sections: [
    {
      h: { en: "Step 0: stop the bleeding, pick the target, start the clock", he: "שלב 0: לעצור את הדימום, לבחור target, להפעיל שעון" },
      body: {
        en: `<p>Before any command:</p>
<ol><li><strong>Stop the damage</strong> — disable the bad job, feature flag or migration. Restoring while the bug still writes is pointless.</li>
<li><strong>Find the exact bad moment</strong> — from app logs, <code>pg_stat_statements</code>, audit log, or by decoding the binlog/WAL. Write it in <strong>UTC with an explicit offset</strong>: <code>2026-11-14 12:31:59+00</code>.</li>
<li><strong>Choose the target — never the production instance.</strong> Restore <em>side-by-side</em> into a new instance/database. Prod may still hold good data written after the incident, and a failed restore over prod turns a partial outage into total loss.</li>
<li><strong>Pick the cutover strategy now</strong>: (a) <em>swap</em> — point apps to the restored instance and accept losing post-incident writes or replay them; (b) <em>merge</em> — copy only the damaged rows/tables back into prod. Small blast radius (one table, some rows) → merge. Whole DB corrupted / ransomware → swap.</li>
<li><strong>Start a timer and an incident channel.</strong> The real RTO is a number you will want for the postmortem.</li></ol>
<blockquote>⚠️ Production tip: also pause anything that deletes backups or WAL — lifecycle rules, <code>pgbackrest expire</code>, binlog purge (<code>binlog_expire_logs_seconds</code>). The segment you need tomorrow may be scheduled for deletion tonight.</blockquote>`,
        he: `<p>לפני כל פקודה:</p>
<ol><li><strong>לעצור את הנזק</strong> — לכבות את ה-job הרע, ה-feature flag או ה-migration. אין טעם לשחזר כשהבאג עדיין כותב.</li>
<li><strong>למצוא את הרגע הרע המדויק</strong> — מ-logs של האפליקציה, <code>pg_stat_statements</code>, audit log, או מפענוח של ה-binlog/WAL. לכתוב אותו ב-<strong>UTC עם offset מפורש</strong>: <code>2026-11-14 12:31:59+00</code>.</li>
<li><strong>לבחור target — אף פעם לא את ה-instance של פרודקשן.</strong> משחזרים <em>side-by-side</em> ל-instance או DB חדש. בפרודקשן אולי עדיין יש data טוב שנכתב אחרי האירוע, ושחזור כושל על פרודקשן הופך outage חלקי לאובדן מוחלט.</li>
<li><strong>לבחור עכשיו אסטרטגיית cutover</strong>: (a) <em>swap</em> — מפנים את האפליקציות ל-instance המשוחזר ומקבלים אובדן של כתיבות מאחרי האירוע או מריצים אותן מחדש; (b) <em>merge</em> — מעתיקים רק את השורות/טבלאות שנפגעו חזרה לפרודקשן. Blast radius קטן (טבלה אחת, כמה שורות) ← merge. כל ה-DB פגוע / ransomware ← swap.</li>
<li><strong>להפעיל טיימר ולפתוח ערוץ אירוע.</strong> ה-RTO האמיתי הוא מספר שתרצה ב-postmortem.</li></ol>
<blockquote>⚠️ טיפ לפרודקשן: תעצור גם כל דבר שמוחק backups או WAL — lifecycle rules, <code>pgbackrest expire</code>, purge של binlog (<code>binlog_expire_logs_seconds</code>). ה-segment שתצטרך מחר אולי מתוזמן למחיקה הלילה.</blockquote>`
      }
    },
    {
      h: { en: "Postgres: pg_restore and base backup + PITR", he: "Postgres: pg_restore ו-base backup + PITR" },
      body: {
        en: `<p><strong>Logical dump</strong> (small DB, single table, cross-version):</p>
<pre># roles/grants are NOT in pg_dump - restore globals first
psql -h restore-host -f globals.sql            # from: pg_dumpall --globals-only
createdb -h restore-host shop_restore
pg_restore -h restore-host -d shop_restore -j 8 --no-owner shop_2026-11-14.dump

# only one table, data only, into an existing schema
pg_restore -d shop_restore -t orders --data-only shop_2026-11-14.dump</pre>
<p><strong>Physical + PITR</strong> (Postgres 12+). Restore the base backup to an empty data dir on a new host, tell Postgres how to fetch WAL and where to stop:</p>
<pre># 1. lay down the base backup (pg_basebackup -Ft -z output, or pgbackrest/wal-g)
mkdir -p /var/lib/postgresql/16/main &amp;&amp; cd /var/lib/postgresql/16/main
tar xzf /backups/base_2026-11-14_0200/base.tar.gz
tar xzf /backups/base_2026-11-14_0200/pg_wal.tar.gz -C pg_wal

# 2. postgresql.auto.conf
restore_command        = 'cp /wal_archive/%f %p'      # or: wal-g wal-fetch %f %p
recovery_target_time   = '2026-11-14 12:31:59+00'     # ALWAYS with offset
recovery_target_inclusive = false
recovery_target_action = 'pause'                       # inspect before promoting

# 3. signal recovery and start
touch recovery.signal
pg_ctl -D /var/lib/postgresql/16/main start
tail -f log/postgresql-*.log</pre>
<pre>LOG:  starting point-in-time recovery to 2026-11-14 12:31:59+00
LOG:  restored log file "000000010000004A00000016" from archive
LOG:  recovery stopping before commit of transaction 9182231, time 2026-11-14 12:32:04.118+00
LOG:  pausing at the end of recovery
HINT: Execute pg_wal_replay_resume() to promote.</pre>
<p>With <code>pause</code> you can connect read-only, check the data, and if the target was too early or late, stop, change <code>recovery_target_time</code> and restart (you can move forward, not backward — going earlier means restoring the base backup again). Happy? <code>SELECT pg_wal_replay_resume();</code> promotes it.</p>
<blockquote>💡 Real world: with pgBackRest the whole thing is one command — <code>pgbackrest --stanza=main --type=time --target="2026-11-14 12:31:59+00" --target-action=pause --delta restore</code>. Know both: the tool hides the mechanics until the mechanics break.</blockquote>`,
        he: `<p><strong>Dump לוגי</strong> (DB קטן, טבלה בודדת, בין גרסאות):</p>
<pre># roles/grants are NOT in pg_dump - restore globals first
psql -h restore-host -f globals.sql            # from: pg_dumpall --globals-only
createdb -h restore-host shop_restore
pg_restore -h restore-host -d shop_restore -j 8 --no-owner shop_2026-11-14.dump

# only one table, data only, into an existing schema
pg_restore -d shop_restore -t orders --data-only shop_2026-11-14.dump</pre>
<p><strong>פיזי + PITR</strong> (Postgres 12+). משחזרים את ה-base backup לתיקיית data ריקה ב-host חדש, ואומרים ל-Postgres איך להביא WAL ואיפה לעצור:</p>
<pre># 1. lay down the base backup (pg_basebackup -Ft -z output, or pgbackrest/wal-g)
mkdir -p /var/lib/postgresql/16/main &amp;&amp; cd /var/lib/postgresql/16/main
tar xzf /backups/base_2026-11-14_0200/base.tar.gz
tar xzf /backups/base_2026-11-14_0200/pg_wal.tar.gz -C pg_wal

# 2. postgresql.auto.conf
restore_command        = 'cp /wal_archive/%f %p'      # or: wal-g wal-fetch %f %p
recovery_target_time   = '2026-11-14 12:31:59+00'     # ALWAYS with offset
recovery_target_inclusive = false
recovery_target_action = 'pause'                       # inspect before promoting

# 3. signal recovery and start
touch recovery.signal
pg_ctl -D /var/lib/postgresql/16/main start
tail -f log/postgresql-*.log</pre>
<pre>LOG:  starting point-in-time recovery to 2026-11-14 12:31:59+00
LOG:  restored log file "000000010000004A00000016" from archive
LOG:  recovery stopping before commit of transaction 9182231, time 2026-11-14 12:32:04.118+00
LOG:  pausing at the end of recovery
HINT: Execute pg_wal_replay_resume() to promote.</pre>
<p>עם <code>pause</code> אפשר להתחבר ב-read-only, לבדוק את ה-data, ואם ה-target מוקדם או מאוחר מדי — לעצור, לשנות את <code>recovery_target_time</code> ולהפעיל מחדש (אפשר להתקדם קדימה, לא אחורה — ללכת מוקדם יותר אומר לשחזר את ה-base backup מחדש). מרוצה? <code>SELECT pg_wal_replay_resume();</code> עושה promote.</p>
<blockquote>💡 מהשטח: עם pgBackRest כל זה פקודה אחת — <code>pgbackrest --stanza=main --type=time --target="2026-11-14 12:31:59+00" --target-action=pause --delta restore</code>. תכיר את שתי הדרכים: הכלי מסתיר את המכניקה עד שהמכניקה נשברת.</blockquote>`
      }
    },
    {
      h: { en: "MySQL (XtraBackup + binlog) and managed PITR", he: "MySQL (XtraBackup + binlog) ו-PITR מנוהל" },
      body: {
        en: `<pre># 1. prepare (apply redo log) and copy back on the NEW server, mysqld stopped
xtrabackup --prepare   --target-dir=/backups/full_2026-11-14
xtrabackup --copy-back --target-dir=/backups/full_2026-11-14 --datadir=/var/lib/mysql
chown -R mysql:mysql /var/lib/mysql &amp;&amp; systemctl start mysqld

# 2. where did the backup end?
cat /backups/full_2026-11-14/xtrabackup_binlog_info
binlog.000411   73422189

# 3. find the bad statement's position
mysqlbinlog --base64-output=decode-rows -vv binlog.000412 | grep -n -B5 "DELETE FROM \`orders\`"
# at 18833102  ... #261114 12:32:04 server id 1  end_log_pos 18833391

# 4. replay up to (not including) it
mysqlbinlog --start-position=73422189 binlog.000411 binlog.000412 \
  --stop-position=18833102 | mysql -u root -p</pre>
<p>Note: <code>--start-position</code> applies to the first file and <code>--stop-position</code> to the last. Positions are more precise than <code>--stop-datetime</code> (one-second granularity, many transactions per second).</p>
<p><strong>Managed PITR always creates a new instance</strong> — your job is the rest:</p>
<pre># AWS RDS - specify network &amp; params, or you get defaults!
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier shop-prod \
  --target-db-instance-identifier shop-restore-1114 \
  --restore-time 2026-11-14T12:31:59Z \
  --db-subnet-group-name prod-db-subnets \
  --vpc-security-group-ids sg-0a1b2c3d \
  --db-parameter-group-name shop-pg16
aws rds wait db-instance-available --db-instance-identifier shop-restore-1114
# Aurora: restore-db-cluster-to-point-in-time creates a cluster with NO instances -
#         then create-db-instance --db-cluster-identifier ... to add a writer

# Azure Database for PostgreSQL flexible server
az postgres flexible-server restore -g rg-prod --name shop-restore-1114 \
  --source-server shop-prod --restore-time "2026-11-14T12:31:59Z"

# Google Cloud SQL
gcloud sql instances clone shop-prod shop-restore-1114 \
  --point-in-time '2026-11-14T12:31:59Z'</pre>
<p>Then: cut over by updating the DNS CNAME / secret / connection string to the new endpoint (a private CNAME like <code>db.shop.internal</code> makes this a one-line change), or rename instances. Re-create what PITR does not copy: alarms, read replicas, IAM auth mappings, deletion protection, backup retention, tags.</p>`,
        he: `<pre># 1. prepare (apply redo log) and copy back on the NEW server, mysqld stopped
xtrabackup --prepare   --target-dir=/backups/full_2026-11-14
xtrabackup --copy-back --target-dir=/backups/full_2026-11-14 --datadir=/var/lib/mysql
chown -R mysql:mysql /var/lib/mysql &amp;&amp; systemctl start mysqld

# 2. where did the backup end?
cat /backups/full_2026-11-14/xtrabackup_binlog_info
binlog.000411   73422189

# 3. find the bad statement's position
mysqlbinlog --base64-output=decode-rows -vv binlog.000412 | grep -n -B5 "DELETE FROM \`orders\`"
# at 18833102  ... #261114 12:32:04 server id 1  end_log_pos 18833391

# 4. replay up to (not including) it
mysqlbinlog --start-position=73422189 binlog.000411 binlog.000412 \
  --stop-position=18833102 | mysql -u root -p</pre>
<p>שים לב: <code>--start-position</code> חל על הקובץ הראשון ו-<code>--stop-position</code> על האחרון. Positions מדויקים יותר מ-<code>--stop-datetime</code> (רזולוציה של שנייה, והרבה טרנזקציות בכל שנייה).</p>
<p><strong>PITR מנוהל תמיד יוצר instance חדש</strong> — כל השאר עליך:</p>
<pre># AWS RDS - specify network &amp; params, or you get defaults!
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier shop-prod \
  --target-db-instance-identifier shop-restore-1114 \
  --restore-time 2026-11-14T12:31:59Z \
  --db-subnet-group-name prod-db-subnets \
  --vpc-security-group-ids sg-0a1b2c3d \
  --db-parameter-group-name shop-pg16
aws rds wait db-instance-available --db-instance-identifier shop-restore-1114
# Aurora: restore-db-cluster-to-point-in-time creates a cluster with NO instances -
#         then create-db-instance --db-cluster-identifier ... to add a writer

# Azure Database for PostgreSQL flexible server
az postgres flexible-server restore -g rg-prod --name shop-restore-1114 \
  --source-server shop-prod --restore-time "2026-11-14T12:31:59Z"

# Google Cloud SQL
gcloud sql instances clone shop-prod shop-restore-1114 \
  --point-in-time '2026-11-14T12:31:59Z'</pre>
<p>ואז: cutover על ידי עדכון ה-DNS CNAME / ה-secret / ה-connection string ל-endpoint החדש (CNAME פרטי כמו <code>db.shop.internal</code> הופך את זה לשינוי של שורה), או rename ל-instances. ליצור מחדש את מה ש-PITR לא מעתיק: alarms, read replicas, מיפויי IAM auth, deletion protection, backup retention, tags.</p>`
      }
    },
    {
      h: { en: "Single rows, S3 objects and Kubernetes (Velero)", he: "שורות בודדות, אובייקטים ב-S3 ו-Kubernetes (Velero)" },
      body: {
        en: `<p><strong>Merge a few rows back</strong> — the most common real restore. Never "dump the whole restored DB over prod"; copy only what was damaged, without clobbering newer writes:</p>
<pre>-- on prod: attach the restored copy
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
CREATE SERVER restore_srv FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'shop-restore-1114.internal', dbname 'shop');
CREATE USER MAPPING FOR CURRENT_USER SERVER restore_srv OPTIONS (user 'restore_ro', password '...');
IMPORT FOREIGN SCHEMA public LIMIT TO (orders) FROM SERVER restore_srv INTO restore;

BEGIN;
INSERT INTO public.orders SELECT * FROM restore.orders
  WHERE created_at &lt; '2026-11-14 12:32:00+00'
ON CONFLICT (id) DO NOTHING;          -- keep anything written after the incident
-- check the count matches what you expect, THEN:
COMMIT;</pre>
<p><strong>S3</strong> (requires versioning enabled <em>before</em> the incident). A "deleted" object in a versioned bucket is just hidden behind a delete marker:</p>
<pre>aws s3api list-object-versions --bucket invoices-prod --prefix 2026/11/inv-8812.pdf
# remove the delete marker -&gt; previous version is current again
aws s3api delete-object --bucket invoices-prod --key 2026/11/inv-8812.pdf --version-id "DM_VERSION_ID"
# or restore an overwritten object to an older version
aws s3api copy-object --bucket invoices-prod --key 2026/11/inv-8812.pdf \
  --copy-source "invoices-prod/2026/11/inv-8812.pdf?versionId=OLD_VERSION_ID"
# Glacier Flexible: Expedited 1-5 min, Standard 3-5 h; Deep Archive: Standard up to 12 h, Bulk up to 48 h
aws s3api restore-object --bucket archive --key db/base.tar.gz \
  --restore-request '{"Days":3,"GlacierJobParameters":{"Tier":"Standard"}}'</pre>
<p>For a mass deletion, script it over <code>list-object-versions</code>, or use S3 Batch Operations; restoring millions of objects takes hours.</p>
<p><strong>Kubernetes (Velero)</strong> — restore into a new namespace first:</p>
<pre>velero backup get
velero restore create shop-1114 --from-backup nightly-20261114020000 \
  --include-namespaces shop --namespace-mappings shop:shop-restore
velero restore describe shop-1114 --details      # warnings/errors per resource
kubectl -n shop-restore get pvc,pods</pre>
<p>Velero restores manifests; volume data only comes back if the backup included CSI snapshots or file-system backup (Kopia). Objects that already exist are skipped by default, not overwritten — another reason to restore into a mapped namespace.</p>`,
        he: `<p><strong>למזג כמה שורות חזרה</strong> — השחזור הכי נפוץ במציאות. אף פעם לא "לשפוך את כל ה-DB המשוחזר על פרודקשן"; מעתיקים רק את מה שנפגע, בלי לדרוס כתיבות חדשות יותר:</p>
<pre>-- on prod: attach the restored copy
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
CREATE SERVER restore_srv FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'shop-restore-1114.internal', dbname 'shop');
CREATE USER MAPPING FOR CURRENT_USER SERVER restore_srv OPTIONS (user 'restore_ro', password '...');
IMPORT FOREIGN SCHEMA public LIMIT TO (orders) FROM SERVER restore_srv INTO restore;

BEGIN;
INSERT INTO public.orders SELECT * FROM restore.orders
  WHERE created_at &lt; '2026-11-14 12:32:00+00'
ON CONFLICT (id) DO NOTHING;          -- keep anything written after the incident
-- check the count matches what you expect, THEN:
COMMIT;</pre>
<p><strong>S3</strong> (דורש versioning שהופעל <em>לפני</em> האירוע). אובייקט "מחוק" ב-bucket עם versioning פשוט מוסתר מאחורי delete marker:</p>
<pre>aws s3api list-object-versions --bucket invoices-prod --prefix 2026/11/inv-8812.pdf
# remove the delete marker -&gt; previous version is current again
aws s3api delete-object --bucket invoices-prod --key 2026/11/inv-8812.pdf --version-id "DM_VERSION_ID"
# or restore an overwritten object to an older version
aws s3api copy-object --bucket invoices-prod --key 2026/11/inv-8812.pdf \
  --copy-source "invoices-prod/2026/11/inv-8812.pdf?versionId=OLD_VERSION_ID"
# Glacier Flexible: Expedited 1-5 min, Standard 3-5 h; Deep Archive: Standard up to 12 h, Bulk up to 48 h
aws s3api restore-object --bucket archive --key db/base.tar.gz \
  --restore-request '{"Days":3,"GlacierJobParameters":{"Tier":"Standard"}}'</pre>
<p>במחיקה המונית — סקריפט מעל <code>list-object-versions</code>, או S3 Batch Operations; שחזור של מיליוני אובייקטים לוקח שעות.</p>
<p><strong>Kubernetes (Velero)</strong> — קודם משחזרים ל-namespace חדש:</p>
<pre>velero backup get
velero restore create shop-1114 --from-backup nightly-20261114020000 \
  --include-namespaces shop --namespace-mappings shop:shop-restore
velero restore describe shop-1114 --details      # warnings/errors per resource
kubectl -n shop-restore get pvc,pods</pre>
<p>Velero משחזר manifests; ה-data של ה-volumes חוזר רק אם ה-backup כלל CSI snapshots או file-system backup (Kopia). אובייקטים שכבר קיימים מדולגים כברירת מחדל, לא נדרסים — עוד סיבה לשחזר ל-namespace ממופה.</p>`
      }
    },
    {
      h: { en: "Verify, cut over, communicate, measure", he: "לאמת, cutover, לתקשר, למדוד" },
      body: {
        en: `<p>"The restore command exited 0" proves nothing. Verify in layers:</p>
<pre>-- 1. are you even in the right database?  (restores into 'postgres' are a classic)
SELECT current_database(), pg_is_in_recovery(), now();

-- 2. counts and freshness vs expectations / prod
SELECT count(*), max(created_at) FROM orders;        -- 1,284,331 | 2026-11-14 12:31:58+00
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;

-- 3. integrity
-- pg_amcheck --all -j 4      (B-tree / heap corruption checks)

-- 4. content checksum of a critical table, compare with a known-good source
SELECT md5(string_agg(id::text || ':' || total::text, ',' ORDER BY id)) FROM orders WHERE id &lt; 100000;</pre>
<p>Then an <strong>app smoke test</strong> against the restored instance: log in, load an order, place a test order in a sandbox tenant. Extensions (<code>postgis</code>, <code>pg_trgm</code>), roles, grants, sequences (<code>setval</code> after data-only loads!) and scheduled jobs are the usual missing pieces.</p>
<p><strong>Cutover</strong>: freeze writes (maintenance mode), final merge or endpoint swap, flush connection pools (PgBouncer <code>RECONNECT</code> / rolling restart), watch error rate and latency for 30 minutes, keep the old prod instance <em>untouched</em> for days as forensic evidence and fallback.</p>
<p><strong>Communicate</strong> every 30 min in the incident channel: what is lost (data window), ETA, what users see. After: record the actual RTO broken down — "fetch base backup 38 min, WAL replay 1h52m, verify 25 min, cutover 12 min = 3h07m" — and compare to the RTO you promised.</p>
<p><strong>Classic failure modes</strong>:</p>
<ul><li><strong>Missing WAL segment</strong> — <code>could not open file "...4A00000017"</code>: archive gap, recovery cannot continue past it. Check <code>pg_stat_archiver.failed_count</code>; the file may still be in prod's <code>pg_wal/</code>.</li>
<li><strong>Wrong timezone</strong> — a target without offset is read in the server's <code>TimeZone</code>; "14:31" Israel time read as UTC lands 2 hours <em>after</em> the DELETE, and your restore faithfully contains it.</li>
<li><strong>Succeeds but empty</strong> — restored into the wrong database, dumped the wrong DB, or a backup job that has been producing 0-byte files for months.</li>
<li><strong>Encryption key lost</strong> — backups encrypted with a KMS key that was scheduled for deletion, or a GPG passphrase only one person knew.</li>
<li><strong>Extensions / roles missing</strong> — <code>ERROR: role "app_rw" does not exist</code>, <code>type "geometry" does not exist</code>. Restore globals and install extensions first.</li></ul>`,
        he: `<p>"פקודת השחזור החזירה 0" לא מוכיחה כלום. מאמתים בשכבות:</p>
<pre>-- 1. are you even in the right database?  (restores into 'postgres' are a classic)
SELECT current_database(), pg_is_in_recovery(), now();

-- 2. counts and freshness vs expectations / prod
SELECT count(*), max(created_at) FROM orders;        -- 1,284,331 | 2026-11-14 12:31:58+00
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;

-- 3. integrity
-- pg_amcheck --all -j 4      (B-tree / heap corruption checks)

-- 4. content checksum of a critical table, compare with a known-good source
SELECT md5(string_agg(id::text || ':' || total::text, ',' ORDER BY id)) FROM orders WHERE id &lt; 100000;</pre>
<p>ואז <strong>smoke test של האפליקציה</strong> מול ה-instance המשוחזר: login, טעינת הזמנה, הזמנת בדיקה ב-tenant של sandbox. Extensions (<code>postgis</code>, <code>pg_trgm</code>), roles, grants, sequences (<code>setval</code> אחרי טעינת data-only!) ו-jobs מתוזמנים הם החלקים שבדרך כלל חסרים.</p>
<p><strong>Cutover</strong>: מקפיאים כתיבות (maintenance mode), merge אחרון או החלפת endpoint, מרעננים connection pools (ב-PgBouncer <code>RECONNECT</code> / rolling restart), עוקבים אחרי error rate ו-latency 30 דקות, ומשאירים את ה-instance הישן של פרודקשן <em>בלי לגעת בו</em> כמה ימים, כראיה פורנזית וכ-fallback.</p>
<p><strong>לתקשר</strong> כל 30 דקות בערוץ האירוע: מה אבד (חלון ה-data), ETA, מה המשתמשים רואים. אחרי זה: לרשום את ה-RTO האמיתי מפורק — "הבאת base backup 38 דקות, WAL replay שעה ו-52 דקות, אימות 25 דקות, cutover 12 דקות = 3:07 שעות" — ולהשוות ל-RTO שהבטחת.</p>
<p><strong>תקלות קלאסיות</strong>:</p>
<ul><li><strong>WAL segment חסר</strong> — <code>could not open file "...4A00000017"</code>: חור בארכוב, ה-recovery לא יכול להמשיך אחריו. בודקים <code>pg_stat_archiver.failed_count</code>; ייתכן שהקובץ עדיין נמצא ב-<code>pg_wal/</code> של פרודקשן.</li>
<li><strong>Timezone שגוי</strong> — target בלי offset נקרא לפי ה-<code>TimeZone</code> של השרת; "14:31" שעון ישראל שנקרא כ-UTC נוחת שעתיים <em>אחרי</em> ה-DELETE, והשחזור שלך מכיל אותו בנאמנות.</li>
<li><strong>מצליח אבל ריק</strong> — שוחזר ל-database הלא נכון, נעשה dump ל-DB הלא נכון, או job של backup שמייצר קבצים של 0 bytes כבר חודשים.</li>
<li><strong>מפתח ההצפנה אבד</strong> — backups מוצפנים עם KMS key שתוזמן למחיקה, או passphrase של GPG שרק אדם אחד ידע.</li>
<li><strong>Extensions / roles חסרים</strong> — <code>ERROR: role "app_rw" does not exist</code>, <code>type "geometry" does not exist</code>. קודם משחזרים globals ומתקינים extensions.</li></ul>`
      }
    }
  ],
  diagram: `  incident 12:32:04 UTC  (DELETE FROM orders)
        |
  [0] stop the job / feature flag     start timer, open #inc channel
        |
  [1] new target  ---------------------------------  prod (keep running, don't touch)
      base backup 02:00 + WAL replay -> stop 12:31:59+00, pause
        |
  [2] verify: current_database(), count(*), max(created_at), pg_amcheck, smoke test
        |
  [3] cutover:
      small blast radius -> MERGE rows back into prod (ON CONFLICT DO NOTHING)
      whole DB bad       -> SWAP endpoint (CNAME db.shop.internal -> restore)
        |
  [4] measure real RTO, keep old instance for forensics, postmortem`,
  handsOn: [
    { cmd: "psql -c \"SELECT archived_count, failed_count, last_archived_wal, last_failed_wal FROM pg_stat_archiver;\"", what: { en: "Before you need PITR: confirm there is no gap in WAL archiving (failed_count, last_failed_wal).", he: "לפני שאתה צריך PITR: מוודא שאין חור בארכוב ה-WAL (failed_count, last_failed_wal)." } },
    { cmd: "pg_restore -l shop.dump | grep -E 'TABLE DATA|EXTENSION' | head", what: { en: "Peek inside a dump: is the table data there and which extensions it expects — before a 2-hour restore.", he: "מציץ לתוך dump: האם ה-data של הטבלה שם ואילו extensions הוא מצפה להם — לפני שחזור של שעתיים." } },
    { cmd: "mysqlbinlog --base64-output=decode-rows -vv --start-datetime='2026-11-14 12:30:00' binlog.000412 | less", what: { en: "Decode row-based binlog events around the incident to find the exact bad position.", he: "מפענח אירועי binlog מבוססי row סביב האירוע כדי למצוא את ה-position הרע המדויק." } },
    { cmd: "aws s3api list-object-versions --bucket invoices-prod --prefix 2026/11/ --query 'DeleteMarkers[?IsLatest].[Key,VersionId]' --output text | head", what: { en: "Find objects hidden by a delete marker — removing the marker restores them.", he: "מוצא אובייקטים שמוסתרים על ידי delete marker — הסרת ה-marker משחזרת אותם." } },
    { cmd: "velero restore create --from-backup nightly-20261114020000 --include-namespaces shop --namespace-mappings shop:shop-restore", what: { en: "Restore a namespace side-by-side into a new namespace instead of over the live one.", he: "משחזר namespace בצורת side-by-side ל-namespace חדש במקום על החי." } }
  ],
  mnemonic: {
    en: "\"STOP - SIDE - STAMP - CHECK - SWAP\": stop the damage, restore side-by-side, stamp the target in UTC with offset, check (counts, checksums, smoke test), swap or merge — and time every step.",
    he: "\"עצור - לצד - חותמת - בדוק - החלף\": עוצרים את הנזק, משחזרים side-by-side, חותמת זמן ב-UTC עם offset, בודקים (ספירות, checksums, smoke test), מחליפים או ממזגים — ומודדים כל שלב."
  },
  pitfalls: [
    { en: "Restoring over the production instance. If the restore fails or targets the wrong time, you just destroyed the only copy that had the post-incident writes.", he: "לשחזר על ה-instance של פרודקשן. אם השחזור נכשל או מכוון לזמן הלא נכון, הרגע השמדת את העותק היחיד שהיו בו הכתיבות מאחרי האירוע." },
    { en: "recovery_target_time without a UTC offset — interpreted in the server's TimeZone, often landing hours after the bad statement.", he: "recovery_target_time בלי offset של UTC — מתפרש לפי ה-TimeZone של השרת, ולרוב נוחת שעות אחרי הפקודה הרעה." },
    { en: "Forgetting what managed PITR does not carry over: security groups, parameter groups, replicas, alarms, deletion protection — the restored instance is reachable by nobody or by everybody.", he: "לשכוח מה PITR מנוהל לא מעביר: security groups, parameter groups, replicas, alarms, deletion protection — ה-instance המשוחזר נגיש לאף אחד או לכולם." },
    { en: "Failing over to a replica to 'undo' a bad DELETE — replicas replicated the DELETE milliseconds later. Only a backup + log replay goes back in time.", he: "לעשות failover ל-replica כדי \"לבטל\" DELETE רע — ה-replicas שכפלו את ה-DELETE כמה מילישניות אחרי. רק backup + replay של logs חוזרים אחורה בזמן." }
  ],
  interview: [
    {
      q: { en: "A migration dropped a column in prod 40 minutes ago; the app has been writing new orders since. How do you restore without losing those orders?", he: "Migration מחקה עמודה בפרודקשן לפני 40 דקות; האפליקציה כותבת הזמנות חדשות מאז. איך אתה משחזר בלי לאבד את ההזמנות האלה?" },
      a: {
        en: "Stop the migration path and anything depending on the column. PITR into a new instance just before the migration's commit (find it in the logs, express it in UTC with offset, use pause). Verify the column and counts. Don't swap — that would lose 40 minutes of orders. Instead re-add the column in prod (nullable), then backfill it from the restored copy via postgres_fdw joined on primary key; rows created after the drop get the default or are fixed by the app. Verify, then keep the restored instance for a few days and run a postmortem on why the migration wasn't expand/contract.",
        he: "עוצרים את ה-migration וכל מה שתלוי בעמודה. PITR ל-instance חדש ממש לפני ה-commit של ה-migration (מוצאים ב-logs, כותבים ב-UTC עם offset, משתמשים ב-pause). מאמתים את העמודה והספירות. לא עושים swap — זה יאבד 40 דקות של הזמנות. במקום זה מוסיפים מחדש את העמודה בפרודקשן (nullable), ואז ממלאים אותה מהעותק המשוחזר דרך postgres_fdw עם join על ה-primary key; שורות שנוצרו אחרי המחיקה מקבלות default או מתוקנות על ידי האפליקציה. מאמתים, משאירים את ה-instance המשוחזר כמה ימים ועושים postmortem למה ה-migration לא היה expand/contract."
      }
    },
    {
      q: { en: "Your PITR restore stops with 'could not open file 000000010000004A00000017'. What happened and what are your options?", he: "ה-PITR שלך נעצר עם 'could not open file 000000010000004A00000017'. מה קרה ומה האפשרויות?" },
      a: {
        en: "There's a gap in the WAL archive — archive_command failed for that segment (full bucket, expired credentials) or a lifecycle rule deleted it. Options: check pg_stat_archiver on prod and look for the file in prod's pg_wal or on a replica, copy it into the archive and resume; otherwise you can only recover up to the last consistent point before the gap (data loss), or start from a newer base backup taken after the gap if one exists and is still before the target. Then fix archiving alerts.",
        he: "יש חור בארכיון ה-WAL — ה-archive_command נכשל על ה-segment הזה (bucket מלא, credentials שפגו) או ש-lifecycle rule מחק אותו. אפשרויות: לבדוק pg_stat_archiver בפרודקשן ולחפש את הקובץ ב-pg_wal של פרודקשן או על replica, להעתיק לארכיון ולהמשיך; אחרת אפשר לשחזר רק עד הנקודה העקבית האחרונה לפני החור (אובדן data), או להתחיל מ-base backup חדש יותר שנלקח אחרי החור אם יש כזה והוא עדיין לפני ה-target. ואחר כך לתקן alerts על הארכוב."
      }
    }
  ],
  quiz: [
    {
      q: { en: "A bad DELETE hit one table 20 minutes ago; the rest of the DB is fine and still taking writes. Best cutover?", he: "DELETE רע פגע בטבלה אחת לפני 20 דקות; שאר ה-DB תקין ועדיין מקבל כתיבות. מה ה-cutover הכי טוב?" },
      options: [
        { en: "Restore the whole DB over prod from last night's backup", he: "לשחזר את כל ה-DB על פרודקשן מה-backup של אתמול בלילה" },
        { en: "PITR to a new instance and swap the endpoint", he: "PITR ל-instance חדש ולהחליף endpoint" },
        { en: "PITR to a new instance and merge the deleted rows back into prod", he: "PITR ל-instance חדש ולמזג את השורות שנמחקו חזרה לפרודקשן" },
        { en: "Fail over to the read replica", he: "לעשות failover ל-read replica" }
      ],
      answer: 2,
      explain: { en: "Small blast radius → merge. Swapping loses 20 minutes of legitimate writes in every other table; the replica already has the DELETE.", he: "Blast radius קטן ← merge. Swap מאבד 20 דקות של כתיבות לגיטימיות בכל שאר הטבלאות; ב-replica כבר יש את ה-DELETE." }
    },
    {
      q: { en: "Server TimeZone is UTC. The DELETE ran at 14:32 Israel time (UTC+2). You set recovery_target_time = '2026-11-14 14:31:00'. Result?", he: "ה-TimeZone של השרת הוא UTC. ה-DELETE רץ ב-14:32 שעון ישראל (UTC+2). הגדרת recovery_target_time = '2026-11-14 14:31:00'. מה התוצאה?" },
      options: [
        { en: "Perfect restore one minute before the DELETE", he: "שחזור מושלם דקה לפני ה-DELETE" },
        { en: "Recovery goes to 14:31 UTC, two hours after the DELETE — the data is still gone", he: "ה-recovery מגיע ל-14:31 UTC, שעתיים אחרי ה-DELETE — ה-data עדיין חסר" },
        { en: "Postgres rejects the setting", he: "Postgres דוחה את ההגדרה" },
        { en: "It restores to 12:31 UTC automatically", he: "הוא משחזר אוטומטית ל-12:31 UTC" }
      ],
      answer: 1,
      explain: { en: "Without an offset the time is read in the server's TimeZone (UTC). 14:31 UTC = 16:31 Israel, after the DELETE at 12:32 UTC. Always write '2026-11-14 12:31:00+00'.", he: "בלי offset הזמן נקרא לפי ה-TimeZone של השרת (UTC). 14:31 UTC = 16:31 בישראל, אחרי ה-DELETE שהיה ב-12:32 UTC. תמיד לכתוב '2026-11-14 12:31:00+00'." }
    },
    {
      q: { en: "You run aws rds restore-db-instance-to-point-in-time. What does it NOT do for you?", he: "הרצת aws rds restore-db-instance-to-point-in-time. מה זה לא עושה בשבילך?" },
      options: [
        { en: "Replay transaction logs to the requested second", he: "להריץ transaction logs עד השנייה המבוקשת" },
        { en: "Create a new DB instance", he: "ליצור DB instance חדש" },
        { en: "Repoint your applications to the new endpoint", he: "להפנות את האפליקציות ל-endpoint החדש" },
        { en: "Use the automated backups of the source instance", he: "להשתמש ב-automated backups של ה-instance המקורי" }
      ],
      answer: 2,
      explain: { en: "Managed PITR always produces a new instance with a new endpoint. Repointing apps (CNAME, secret, config), and re-creating replicas/alarms, is your runbook's job.", he: "PITR מנוהל תמיד יוצר instance חדש עם endpoint חדש. להפנות את האפליקציות (CNAME, secret, config) וליצור מחדש replicas/alarms — זה התפקיד של ה-runbook שלך." }
    },
    {
      q: { en: "pg_restore finished without errors but the app shows no data. Most likely first check?", he: "pg_restore הסתיים בלי שגיאות אבל האפליקציה לא מציגה data. מה הבדיקה הראשונה הכי סבירה?" },
      options: [
        { en: "Run VACUUM FULL", he: "להריץ VACUUM FULL" },
        { en: "Check current_database() and the connection string — you may have restored into another database", he: "לבדוק current_database() ואת ה-connection string — ייתכן ששחזרת ל-database אחר" },
        { en: "Increase shared_buffers", he: "להגדיל את shared_buffers" },
        { en: "Rebuild all indexes", he: "לבנות מחדש את כל ה-indexes" }
      ],
      answer: 1,
      explain: { en: "'Succeeds but empty' is usually the wrong target DB (e.g. restored into 'postgres') or the app pointing elsewhere. Then check counts and whether the dump itself had data (pg_restore -l).", he: "\"מצליח אבל ריק\" זה בדרך כלל DB יעד שגוי (למשל שוחזר ל-'postgres') או אפליקציה שמצביעה למקום אחר. אחר כך בודקים ספירות והאם ב-dump עצמו היה data (pg_restore -l)." }
    }
  ],
  playground: "dr",
  related: ["db-backups", "pr-backups-strategy", "rel-bcdr", "db-replication", "db-operations"]
});

// ---------------------------------------------------------------------------
// 3. Storage engines
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-storage-engines",
  track: "data",
  order: 36,
  icon: "⚙️",
  level: 3,
  minutes: 14,
  playground: "lsm",
  title: { en: "Storage Engines: B-tree vs LSM", he: "Storage Engines: B-tree מול LSM" },
  tldr: {
    en: "B-trees update pages in place (great reads, random writes); LSM trees append to a memtable and merge sorted files later (great writes, compaction debt) — and amplification (write, read, space) explains most 'mysterious' database behavior in production.",
    he: "B-trees מעדכנים דפים במקום (קריאות מעולות, כתיבות אקראיות); LSM trees כותבים ל-memtable וממזגים קבצים ממוינים אחר כך (כתיבות מעולות, חוב של compaction) — ו-amplification (כתיבה, קריאה, מקום) מסביר את רוב ההתנהגויות ה\"מסתוריות\" של DBs בפרודקשן."
  },
  analogy: {
    en: "A B-tree is a library where every new book is shelved in its exact alphabetical spot right away — finding is instant, but shelving means walking to a random aisle each time. An LSM tree is a library that throws new books into a returns bin, sorts the bin into a small pile every evening, and on weekends merges piles into big sorted shelves. Returning is instant; finding a book may mean checking the bin and several piles — unless a sign (bloom filter) tells you 'not in this pile'.",
    he: "B-tree זו ספרייה שבה כל ספר חדש מסודר מיד במקום האלפביתי המדויק שלו — מציאה מיידית, אבל סידור אומר ללכת למעבר אקראי כל פעם. LSM tree זו ספרייה שזורקת ספרים חדשים לסל החזרות, כל ערב ממיינת את הסל לערימה קטנה, ובסופי שבוע ממזגת ערימות למדפים גדולים וממוינים. החזרה מיידית; מציאת ספר אולי דורשת לבדוק את הסל וכמה ערימות — אלא אם שלט (bloom filter) אומר לך \"לא בערימה הזו\"."
  },
  sections: [
    {
      h: { en: "The common base: WAL, fsync, pages and the buffer pool", he: "הבסיס המשותף: WAL, fsync, דפים ו-buffer pool" },
      body: {
        en: `<p>Every durable engine follows one rule: <strong>write the intent to a sequential log and fsync it before acknowledging the commit</strong>. That log is the WAL (Postgres), redo log (InnoDB) or commit log (Cassandra). Data files can be updated lazily later; after a crash the log is replayed.</p>
<p><code>fsync()</code> is the expensive part: it forces the OS page cache to stable storage. A cloud SSD does a few thousand fsyncs/s; a laptop NVMe with a volatile cache "does" 100k by lying. That is why commit latency is ~0.5-2 ms on EBS gp3 and why <strong>group commit</strong> (many transactions share one fsync) matters.</p>
<pre># Postgres
synchronous_commit = on        # fsync WAL before COMMIT returns (default)
wal_sync_method = fdatasync
full_page_writes = on          # protect against torn 8KB pages

# MySQL InnoDB
innodb_flush_log_at_trx_commit = 1   # fsync redo per commit (durable)
                               # 2 = write per commit, fsync ~1/s (lose ~1s on OS crash)
                               # 0 = lose ~1s even on mysqld crash
sync_binlog = 1</pre>
<p>Data lives in fixed-size <strong>pages</strong>: 8 KB in Postgres, 16 KB in InnoDB. Hot pages are cached in the <strong>buffer pool</strong>: <code>shared_buffers</code> (typically ~25% of RAM, the rest left to the OS page cache) or <code>innodb_buffer_pool_size</code> (50-75% of RAM, InnoDB bypasses the OS cache with O_DIRECT). A modified ("dirty") page is written back at checkpoint; the WAL covers it until then.</p>`,
        he: `<p>כל מנוע עמיד עוקב אחרי חוק אחד: <strong>לכתוב את הכוונה ל-log סדרתי ולעשות לו fsync לפני שמאשרים את ה-commit</strong>. ה-log הזה הוא ה-WAL (Postgres), ה-redo log (InnoDB) או ה-commit log (Cassandra). את קבצי ה-data אפשר לעדכן בעצלות אחר כך; אחרי crash מריצים את ה-log מחדש.</p>
<p><code>fsync()</code> הוא החלק היקר: הוא מכריח את ה-page cache של מערכת ההפעלה לכתוב ל-storage יציב. SSD בענן עושה כמה אלפי fsyncs בשנייה; NVMe של לפטופ עם cache נדיף "עושה" 100k כי הוא משקר. בגלל זה latency של commit הוא בערך 0.5-2ms על EBS gp3, ובגלל זה <strong>group commit</strong> (הרבה טרנזקציות חולקות fsync אחד) חשוב.</p>
<pre># Postgres
synchronous_commit = on        # fsync WAL before COMMIT returns (default)
wal_sync_method = fdatasync
full_page_writes = on          # protect against torn 8KB pages

# MySQL InnoDB
innodb_flush_log_at_trx_commit = 1   # fsync redo per commit (durable)
                               # 2 = write per commit, fsync ~1/s (lose ~1s on OS crash)
                               # 0 = lose ~1s even on mysqld crash
sync_binlog = 1</pre>
<p>ה-data יושב ב-<strong>דפים</strong> בגודל קבוע: 8 KB ב-Postgres, 16 KB ב-InnoDB. דפים חמים נשמרים ב-<strong>buffer pool</strong>: <code>shared_buffers</code> (בדרך כלל בערך 25% מה-RAM, השאר נשאר ל-page cache של ה-OS) או <code>innodb_buffer_pool_size</code> (50-75% מה-RAM, InnoDB עוקף את ה-cache של ה-OS עם O_DIRECT). דף ששונה ("dirty") נכתב חזרה ב-checkpoint; עד אז ה-WAL מכסה אותו.</p>`
      }
    },
    {
      h: { en: "B-tree engines: Postgres and InnoDB", he: "מנועי B-tree: Postgres ו-InnoDB" },
      body: {
        en: `<p>A B+tree keeps keys sorted in pages linked as a shallow tree. With ~300-500 keys per page, <strong>1 billion rows fit in 3-4 levels</strong> — the top levels are always in memory, so a lookup is ~1 disk read. An insert finds the leaf page and modifies it <em>in place</em>; a full page splits into two.</p>
<ul><li><strong>InnoDB</strong>: the table <em>is</em> a B+tree clustered on the primary key; secondary indexes store the PK, so a secondary lookup is two tree walks. A random PK (UUIDv4) means inserts land on random leaf pages → constant page splits, half-empty pages, buffer pool thrash. Sequential PKs (auto-increment, UUIDv7) append to the right edge.</li>
<li><strong>Postgres</strong>: rows live in an unordered <em>heap</em>; every index (B-tree by default) points to a tuple location (ctid). MVCC writes a new tuple version on every UPDATE and leaves the old one for VACUUM — that is the source of bloat and of autovacuum load. HOT updates avoid touching indexes when no indexed column changes and the page has free space (tune <code>fillfactor</code>).</li></ul>
<p>Cost profile: reads are predictable (log N pages), writes are <strong>random I/O</strong> — changing 100 bytes dirties a whole 8/16 KB page, and the first change after a checkpoint also writes the full page image into the WAL. Write amplification of 10-100x per small row update is normal.</p>`,
        he: `<p>B+tree שומר מפתחות ממוינים בדפים שמחוברים כעץ רדוד. עם בערך 300-500 מפתחות לדף, <strong>מיליארד שורות נכנסות ב-3-4 רמות</strong> — הרמות העליונות תמיד בזיכרון, אז lookup זה בערך קריאת דיסק אחת. Insert מוצא את דף העלה ומשנה אותו <em>במקום</em>; דף מלא מתפצל לשניים.</p>
<ul><li><strong>InnoDB</strong>: הטבלה <em>היא</em> B+tree שמסודר (clustered) לפי ה-primary key; secondary indexes שומרים את ה-PK, אז lookup דרך secondary זה שני מעברים על עצים. PK אקראי (UUIDv4) אומר ש-inserts נוחתים על דפי עלים אקראיים ← page splits כל הזמן, דפים חצי ריקים, buffer pool שמתחלף בלי הפסקה. PKs סדרתיים (auto-increment, UUIDv7) מוסיפים לקצה הימני.</li>
<li><strong>Postgres</strong>: השורות יושבות ב-<em>heap</em> לא ממוין; כל index (B-tree כברירת מחדל) מצביע על מיקום של tuple (ctid). MVCC כותב גרסת tuple חדשה בכל UPDATE ומשאיר את הישנה ל-VACUUM — זה המקור של bloat ושל העומס של autovacuum. HOT updates נמנעים מלגעת ב-indexes כשאף עמודה עם index לא השתנתה ויש מקום פנוי בדף (מכווננים <code>fillfactor</code>).</li></ul>
<p>פרופיל העלויות: קריאות צפויות (log N דפים), כתיבות הן <strong>random I/O</strong> — שינוי של 100 bytes מלכלך דף שלם של 8/16 KB, והשינוי הראשון אחרי checkpoint כותב גם את תמונת הדף המלאה ל-WAL. Write amplification של פי 10-100 על update של שורה קטנה זה נורמלי.</p>`
      }
    },
    {
      h: { en: "LSM trees: memtable, SSTables, compaction, bloom filters", he: "LSM trees: memtable, SSTables, compaction, bloom filters" },
      body: {
        en: `<ol><li>Write → append to the commit log (WAL) → insert into the <strong>memtable</strong> (sorted in-memory structure, usually a skiplist). Acknowledge. No random I/O at all.</li>
<li>Memtable full (e.g. 64 MB) → frozen and flushed as an immutable, sorted <strong>SSTable</strong> file. Updates and deletes are just newer entries; a delete writes a <strong>tombstone</strong>.</li>
<li><strong>Compaction</strong> merges SSTables in the background (merge-sort), keeps the newest version of each key, drops overwritten values and expired tombstones.</li>
<li>Read → check memtable, then SSTables newest to oldest. Each SSTable has a <strong>bloom filter</strong> (~10 bits/key gives ~1% false positives) that answers "definitely not here" without a disk read, plus a sparse index for "where in the file".</li></ol>
<table><tr><th>Strategy</th><th>How</th><th>Write amp</th><th>Space amp</th><th>Read amp</th></tr>
<tr><td><strong>Leveled</strong> (RocksDB default, Cassandra LCS)</td><td>L0 then L1..Ln, each level ~10x bigger, non-overlapping key ranges per level</td><td>high (10-30x)</td><td>low (~1.1x)</td><td>low (≈1 file per level)</td></tr>
<tr><td><strong>Size-tiered</strong> (Cassandra STCS default)</td><td>merge ~4 similar-size SSTables into one bigger</td><td>low</td><td>high: a big compaction temporarily needs as much free disk as its input (keep ~50% free)</td><td>higher (key may be in many files)</td></tr>
<tr><td><strong>Time-window</strong> (TWCS)</td><td>one bucket per time window, then never touched</td><td>very low</td><td>low</td><td>low for recent-time queries</td></tr></table>
<p><strong>The RUM conjecture</strong>: you can optimize two of Read, Update (write) and Memory/space amplification, never all three. B-tree favors reads; leveled LSM favors reads+space at the cost of writes; size-tiered favors writes.</p>`,
        he: `<ol><li>כתיבה ← append ל-commit log (WAL) ← הכנסה ל-<strong>memtable</strong> (מבנה ממוין בזיכרון, בדרך כלל skiplist). אישור. בלי שום random I/O.</li>
<li>Memtable מלא (למשל 64 MB) ← מוקפא ונכתב לדיסק כקובץ <strong>SSTable</strong> ממוין שלא משתנה. Updates ו-deletes הם פשוט רשומות חדשות יותר; delete כותב <strong>tombstone</strong>.</li>
<li><strong>Compaction</strong> ממזג SSTables ברקע (merge-sort), שומר את הגרסה החדשה של כל מפתח, זורק ערכים שנדרסו ו-tombstones שפג תוקפם.</li>
<li>קריאה ← בודקים את ה-memtable, ואז SSTables מהחדש לישן. לכל SSTable יש <strong>bloom filter</strong> (בערך 10 ביטים למפתח נותנים בערך 1% false positives) שעונה "בטוח לא כאן" בלי קריאת דיסק, ועוד sparse index ל"איפה בקובץ".</li></ol>
<table><tr><th>אסטרטגיה</th><th>איך</th><th>Write amp</th><th>Space amp</th><th>Read amp</th></tr>
<tr><td><strong>Leveled</strong> (ברירת המחדל של RocksDB, LCS ב-Cassandra)</td><td>L0 ואז L1..Ln, כל רמה גדולה פי 10 בערך, טווחי מפתחות לא חופפים בכל רמה</td><td>גבוה (פי 10-30)</td><td>נמוך (בערך 1.1)</td><td>נמוך (בערך קובץ אחד לרמה)</td></tr>
<tr><td><strong>Size-tiered</strong> (ברירת המחדל STCS ב-Cassandra)</td><td>ממזגים בערך 4 SSTables בגודל דומה לאחד גדול</td><td>נמוך</td><td>גבוה: compaction גדול צריך זמנית מקום פנוי כמו הקלט שלו (משאירים בערך 50% פנוי)</td><td>גבוה יותר (מפתח יכול להיות בהרבה קבצים)</td></tr>
<tr><td><strong>Time-window</strong> (TWCS)</td><td>bucket לכל חלון זמן, ואז לא נוגעים בו יותר</td><td>נמוך מאוד</td><td>נמוך</td><td>נמוך ל-queries על זמן אחרון</td></tr></table>
<p><strong>ה-RUM conjecture</strong>: אפשר לאפטם שניים מתוך Read, Update (כתיבה) ו-Memory/space amplification, אף פעם לא את שלושתם. B-tree מעדיף קריאות; LSM מסוג leveled מעדיף קריאות ומקום על חשבון כתיבות; size-tiered מעדיף כתיבות.</p>`
      }
    },
    {
      h: { en: "Who uses what", he: "מי משתמש במה" },
      body: {
        en: `<table><tr><th>Engine</th><th>Structure</th><th>Notes</th></tr>
<tr><td>PostgreSQL</td><td>heap + B-tree indexes</td><td>MVCC in the heap → VACUUM; 8 KB pages</td></tr>
<tr><td>MySQL InnoDB</td><td>clustered B+tree</td><td>16 KB pages, undo log for MVCC, doublewrite buffer</td></tr>
<tr><td>SQLite, SQL Server, Oracle</td><td>B-tree</td><td>classic in-place engines</td></tr>
<tr><td>MongoDB WiredTiger</td><td>B-tree (LSM optional, rarely used)</td><td>document store on a B-tree</td></tr>
<tr><td>RocksDB / LevelDB</td><td>LSM (leveled)</td><td>embedded; under MyRocks, TiKV, Kafka Streams state stores; CockroachDB moved to Pebble, its Go RocksDB-like LSM</td></tr>
<tr><td>Cassandra</td><td>LSM</td><td>STCS default, LCS/TWCS options (UCS in 5.0)</td></tr>
<tr><td>ScyllaDB</td><td>LSM (C++ Cassandra rewrite)</td><td>shard-per-core, incremental compaction (ICS) to cut space amp</td></tr>
<tr><td>HBase, Bigtable</td><td>LSM</td><td>the original Bigtable paper design</td></tr></table>`,
        he: `<table><tr><th>מנוע</th><th>מבנה</th><th>הערות</th></tr>
<tr><td>PostgreSQL</td><td>heap + B-tree indexes</td><td>MVCC בתוך ה-heap ← VACUUM; דפים של 8 KB</td></tr>
<tr><td>MySQL InnoDB</td><td>clustered B+tree</td><td>דפים של 16 KB, undo log בשביל MVCC, doublewrite buffer</td></tr>
<tr><td>SQLite, SQL Server, Oracle</td><td>B-tree</td><td>מנועים קלאסיים שמעדכנים במקום</td></tr>
<tr><td>MongoDB WiredTiger</td><td>B-tree (LSM אופציונלי, כמעט לא בשימוש)</td><td>document store מעל B-tree</td></tr>
<tr><td>RocksDB / LevelDB</td><td>LSM (leveled)</td><td>embedded; מתחת ל-MyRocks, TiKV, state stores של Kafka Streams; CockroachDB עבר ל-Pebble, LSM דמוי RocksDB שכתוב ב-Go</td></tr>
<tr><td>Cassandra</td><td>LSM</td><td>STCS כברירת מחדל, אופציות LCS/TWCS (UCS בגרסה 5.0)</td></tr>
<tr><td>ScyllaDB</td><td>LSM (Cassandra שנכתב מחדש ב-C++)</td><td>shard-per-core, incremental compaction (ICS) כדי להוריד space amp</td></tr>
<tr><td>HBase, Bigtable</td><td>LSM</td><td>העיצוב המקורי ממאמר ה-Bigtable</td></tr></table>`
      }
    },
    {
      h: { en: "How this explains production behavior", he: "איך זה מסביר התנהגות בפרודקשן" },
      body: {
        en: `<ul><li><strong>"Cassandra disk is 55% full and the team panics"</strong> — with STCS a major compaction can temporarily double the space of the files it merges. Running out of disk mid-compaction stops compaction, SSTable count climbs, reads slow down: a death spiral.</li>
<li><strong>"Reads got slow but nothing changed"</strong> — LSM compaction is falling behind (pending compactions climbing), so each read touches more SSTables. Or a tombstone-heavy partition: Cassandra warns at 1,000 tombstones scanned per query and aborts at 100,000 (<code>tombstone_failure_threshold</code>); tombstones live at least <code>gc_grace_seconds</code> (10 days default).</li>
<li><strong>"RocksDB write stalls"</strong> — too many L0 files (slowdown at 20, stop at 36 by default) because compaction can't keep up with ingest; latency spikes in waves.</li>
<li><strong>"Postgres table is 40 GB but holds 8 GB of data"</strong> — MVCC dead tuples (bloat) from heavy updates and autovacuum that can't keep up or is blocked by a long-running transaction.</li>
<li><strong>"MySQL insert rate collapsed after switching to UUID keys"</strong> — clustered B+tree + random keys = page splits and buffer pool misses. UUIDv7 or a bigint PK fixes it.</li>
<li><strong>"Commit latency doubled after moving to a different disk"</strong> — fsync latency. Check <code>pg_stat_wal</code> (<code>wal_sync_time</code>) or <code>iostat -x</code> w_await on the WAL device.</li></ul>
<blockquote>💡 Real world: choose LSM for write-heavy, append-mostly, key-value-ish workloads (events, time series, messaging, counters) and B-tree for mixed OLTP with range scans, secondary indexes and transactions. Then size disk and IOPS for compaction, not only for data.</blockquote>`,
        he: `<ul><li><strong>"הדיסק של Cassandra ב-55% והצוות בפאניקה"</strong> — עם STCS, compaction גדול יכול זמנית להכפיל את המקום של הקבצים שהוא ממזג. אם נגמר הדיסק באמצע compaction, ה-compaction נעצר, מספר ה-SSTables עולה והקריאות מאטות: ספירלת מוות.</li>
<li><strong>"הקריאות האטו אבל כלום לא השתנה"</strong> — ה-compaction של ה-LSM מפגר (pending compactions עולים), אז כל קריאה נוגעת ביותר SSTables. או partition עמוס ב-tombstones: Cassandra מזהיר ב-1,000 tombstones שנסרקו ב-query ומבטל ב-100,000 (<code>tombstone_failure_threshold</code>); tombstones חיים לפחות <code>gc_grace_seconds</code> (10 ימים כברירת מחדל).</li>
<li><strong>"RocksDB עושה write stalls"</strong> — יותר מדי קבצים ב-L0 (האטה ב-20, עצירה ב-36 כברירת מחדל) כי ה-compaction לא עומד בקצב ה-ingest; קפיצות latency בגלים.</li>
<li><strong>"טבלת Postgres שוקלת 40 GB אבל יש בה 8 GB של data"</strong> — dead tuples של MVCC (bloat) מהרבה updates ו-autovacuum שלא עומד בקצב או חסום על ידי טרנזקציה ארוכה.</li>
<li><strong>"קצב ה-inserts ב-MySQL קרס אחרי מעבר למפתחות UUID"</strong> — clustered B+tree + מפתחות אקראיים = page splits ו-misses ב-buffer pool. UUIDv7 או PK מסוג bigint פותר.</li>
<li><strong>"ה-latency של commit הוכפל אחרי מעבר לדיסק אחר"</strong> — latency של fsync. בודקים <code>pg_stat_wal</code> (<code>wal_sync_time</code>) או את w_await ב-<code>iostat -x</code> על דיסק ה-WAL.</li></ul>
<blockquote>💡 מהשטח: בוחרים LSM ל-workloads כבדי כתיבה, בעיקר append, בסגנון key-value (אירועים, time series, messaging, counters), ו-B-tree ל-OLTP מעורב עם range scans, secondary indexes וטרנזקציות. ואז מתכננים דיסק ו-IOPS גם ל-compaction, לא רק ל-data.</blockquote>`
      }
    }
  ],
  diagram: `B-TREE (Postgres / InnoDB)                LSM TREE (RocksDB / Cassandra)
                                           write -> WAL (append) -> MEMTABLE (RAM, sorted)
            [root]                                                     | flush (64MB)
         /    |    \\                                                  v
     [int]  [int]  [int]      in-place      L0: [sst][sst][sst]   (overlapping)
     / | \\                    update of           | compaction
  [leaf][leaf][leaf] <- 8/16KB page         L1: [sst|sst|sst]          10x
                                            L2: [sst|sst|sst|sst|...]  10x
  read: 3-4 page hops                       read: memtable -> bloom? -> L0..Ln
  write: random page I/O + WAL              write: sequential, pays later in compaction

  RUM: pick 2 of  Read amp | Update(write) amp | Memory/space amp`,
  handsOn: [
    { cmd: "psql -c \"SELECT relname, n_live_tup, n_dead_tup, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 5;\"", what: { en: "See MVCC dead tuples (the B-tree/heap engine's debt) and whether autovacuum keeps up.", he: "רואה dead tuples של MVCC (החוב של מנוע ה-heap/B-tree) והאם autovacuum עומד בקצב." } },
    { cmd: "nodetool tablestats shop.events | grep -E 'SSTable count|Space used|Bloom filter false ratio|Tombstone'", what: { en: "Cassandra: SSTables per table, space, bloom filter false-positive ratio, tombstones scanned.", he: "Cassandra: כמה SSTables לכל טבלה, מקום, יחס false positives של bloom filter, tombstones שנסרקו." } },
    { cmd: "nodetool compactionstats -H", what: { en: "Pending compactions — the LSM debt counter. Climbing steadily means reads will degrade.", he: "Pending compactions — מונה החוב של ה-LSM. עלייה קבועה אומרת שהקריאות יידרדרו." } },
    { cmd: "mysql -e \"SHOW ENGINE INNODB STATUS\\G\" | grep -A12 'BUFFER POOL AND MEMORY'", what: { en: "InnoDB buffer pool size, free/dirty pages and hit rate.", he: "גודל ה-buffer pool של InnoDB, דפים פנויים/מלוכלכים ו-hit rate." } },
    { cmd: "iostat -x 1 5", what: { en: "Watch w_await and %util on the WAL/data disks — fsync latency is commit latency.", he: "עוקב אחרי w_await ו-%util על דיסקי ה-WAL וה-data — latency של fsync הוא latency של commit." } }
  ],
  mnemonic: {
    en: "\"B-tree pays at write time, LSM pays later with interest (compaction).\" And RUM: Read, Update, Memory — pick two.",
    he: "\"B-tree משלם בזמן הכתיבה, LSM משלם אחר כך עם ריבית (compaction).\" ו-RUM: Read, Update, Memory — בוחרים שניים."
  },
  pitfalls: [
    { en: "Running Cassandra/STCS disks above ~50-60% full — a big compaction has no room, compaction stops and reads degrade until the node falls over.", he: "להריץ דיסקים של Cassandra/STCS מעל בערך 50-60% — ל-compaction גדול אין מקום, ה-compaction נעצר והקריאות מידרדרות עד שה-node נופל." },
    { en: "Using deletes as a queue in an LSM store (insert, process, delete) — tombstones pile up and every read scans thousands of them.", he: "להשתמש ב-deletes כתור ב-LSM store (insert, עיבוד, delete) — tombstones נערמים וכל קריאה סורקת אלפים מהם." },
    { en: "Random UUIDv4 primary keys on InnoDB — clustered index page splits, larger indexes and much lower insert throughput than sequential keys.", he: "Primary keys מסוג UUIDv4 אקראי על InnoDB — page splits ב-clustered index, indexes גדולים יותר ו-throughput של inserts נמוך בהרבה ממפתחות סדרתיים." },
    { en: "Disabling fsync (fsync=off, innodb_flush_log_at_trx_commit=0) for a benchmark and forgetting it in prod — the first power loss corrupts or loses committed data.", he: "לכבות fsync (fsync=off, innodb_flush_log_at_trx_commit=0) בשביל benchmark ולשכוח את זה בפרודקשן — הנפילה הראשונה של חשמל משחיתה או מאבדת data שכבר עשה commit." }
  ],
  interview: [
    {
      q: { en: "Why do LSM trees handle writes better than B-trees, and what do they pay for it?", he: "למה LSM trees מתמודדים עם כתיבות טוב יותר מ-B-trees, ועל מה הם משלמים?" },
      a: {
        en: "LSM turns every write into a sequential WAL append plus an in-memory insert; disk writes happen as large sequential flushes, so no random page I/O at commit time. The bill comes later: compaction rewrites the data several times (write amplification 10-30x for leveled), reads may check several SSTables (mitigated by bloom filters and leveled compaction), and space amplification (obsolete versions, tombstones, compaction headroom). Compaction also competes for disk I/O with foreground traffic, causing latency waves.",
        he: "LSM הופך כל כתיבה ל-append סדרתי ל-WAL ועוד insert בזיכרון; כתיבות לדיסק קורות כ-flushes גדולים וסדרתיים, אז אין random page I/O בזמן commit. החשבון מגיע אחר כך: compaction כותב את ה-data מחדש כמה פעמים (write amplification של פי 10-30 ב-leveled), קריאות אולי בודקות כמה SSTables (מתמתן עם bloom filters ו-leveled compaction), ו-space amplification (גרסאות ישנות, tombstones, מרווח ל-compaction). ה-compaction גם מתחרה על I/O של הדיסק עם התעבורה הרגילה, וזה יוצר גלים של latency."
      }
    },
    {
      q: { en: "What does innodb_flush_log_at_trx_commit=2 trade, exactly?", he: "על מה בדיוק innodb_flush_log_at_trx_commit=2 מוותר?" },
      a: {
        en: "With 1, InnoDB writes and fsyncs the redo log on every commit — fully durable. With 2, it writes to the OS page cache on every commit but fsyncs about once per second: a mysqld crash loses nothing (the OS still has the data), but an OS crash or power loss can lose up to ~1 second of committed transactions. You gain much lower commit latency and higher throughput. Acceptable for some replicas or rebuildable data, usually not for a primary holding payments.",
        he: "עם 1, InnoDB כותב ועושה fsync ל-redo log בכל commit — עמיד לגמרי. עם 2, הוא כותב ל-page cache של ה-OS בכל commit אבל עושה fsync בערך פעם בשנייה: crash של mysqld לא מאבד כלום (ל-OS עדיין יש את ה-data), אבל crash של ה-OS או נפילת חשמל יכולים לאבד עד בערך שנייה של טרנזקציות שעשו commit. מרוויחים latency של commit נמוך בהרבה ו-throughput גבוה יותר. סביר ל-replicas מסוימים או ל-data שאפשר לבנות מחדש, בדרך כלל לא ל-primary שמחזיק תשלומים."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Which compaction strategy needs the most free disk headroom?", he: "איזו אסטרטגיית compaction צריכה הכי הרבה מרווח דיסק פנוי?" },
      options: [
        { en: "Leveled", he: "Leveled" },
        { en: "Size-tiered", he: "Size-tiered" },
        { en: "Time-window", he: "Time-window" },
        { en: "B-tree page splits", he: "Page splits של B-tree" }
      ],
      answer: 1,
      explain: { en: "Size-tiered merges large similar-sized SSTables into one; until the merge finishes both input and output exist, so a big compaction can temporarily need as much free space as its input — hence the ~50% free rule.", he: "Size-tiered ממזג SSTables גדולים בגודל דומה לאחד; עד שהמיזוג נגמר גם הקלט וגם הפלט קיימים, אז compaction גדול יכול לצטרך זמנית מקום פנוי כמו הקלט שלו — מכאן הכלל של בערך 50% פנוי." }
    },
    {
      q: { en: "What does a bloom filter on an SSTable tell you?", he: "מה bloom filter על SSTable אומר לך?" },
      options: [
        { en: "The exact offset of a key in the file", he: "את ה-offset המדויק של מפתח בקובץ" },
        { en: "That a key is definitely NOT in the file, or MAYBE is", he: "שמפתח בטוח לא בקובץ, או אולי כן" },
        { en: "That a key is definitely in the file", he: "שמפתח בטוח נמצא בקובץ" },
        { en: "How many versions of a key exist", he: "כמה גרסאות של מפתח קיימות" }
      ],
      answer: 1,
      explain: { en: "Bloom filters have no false negatives but some false positives (~1% at 10 bits/key), so they let reads skip SSTables that cannot contain the key.", he: "ל-bloom filters אין false negatives אבל יש קצת false positives (בערך 1% ב-10 ביטים למפתח), אז הם מאפשרים לקריאות לדלג על SSTables שלא יכולים להכיל את המפתח." }
    },
    {
      q: { en: "A Postgres table that gets millions of UPDATEs per hour keeps growing although the row count is stable. Why?", he: "טבלת Postgres שמקבלת מיליוני UPDATEs בשעה ממשיכה לגדול למרות שמספר השורות יציב. למה?" },
      options: [
        { en: "B-tree page splits", he: "Page splits של B-tree" },
        { en: "MVCC writes new tuple versions; dead tuples accumulate faster than (auto)vacuum reclaims them", he: "MVCC כותב גרסאות tuple חדשות; dead tuples מצטברים מהר יותר ממה ש-(auto)vacuum מפנה" },
        { en: "WAL files are stored inside the table", he: "קבצי WAL נשמרים בתוך הטבלה" },
        { en: "Compaction is falling behind", he: "ה-compaction מפגר" }
      ],
      answer: 1,
      explain: { en: "Postgres updates are delete+insert of tuple versions in the heap. If autovacuum is too slow or blocked by a long transaction, bloat grows. Compaction is an LSM concept.", he: "UPDATE ב-Postgres הוא delete+insert של גרסאות tuple ב-heap. אם autovacuum איטי מדי או חסום על ידי טרנזקציה ארוכה, ה-bloat גדל. Compaction זה מושג של LSM." }
    },
    {
      q: { en: "Why do InnoDB tables with random UUIDv4 primary keys insert slower than with auto-increment keys?", he: "למה טבלאות InnoDB עם primary keys מסוג UUIDv4 אקראי מכניסות שורות לאט יותר מאשר עם auto-increment?" },
      options: [
        { en: "UUIDs are longer strings to parse", he: "UUIDs הם מחרוזות ארוכות לפענוח" },
        { en: "The table is clustered on the PK, so random keys hit random leaf pages, causing page splits and cache misses", he: "הטבלה מסודרת (clustered) לפי ה-PK, אז מפתחות אקראיים פוגעים בדפי עלים אקראיים וגורמים ל-page splits ו-cache misses" },
        { en: "InnoDB fsyncs twice for UUIDs", he: "InnoDB עושה fsync פעמיים ל-UUIDs" },
        { en: "Bloom filters don't work with UUIDs", he: "Bloom filters לא עובדים עם UUIDs" }
      ],
      answer: 1,
      explain: { en: "Sequential keys append to the right-most leaf (hot in cache); random keys scatter writes across the whole B+tree. UUIDv7 keeps uniqueness while being time-ordered.", he: "מפתחות סדרתיים מוסיפים לעלה הימני ביותר (חם ב-cache); מפתחות אקראיים מפזרים כתיבות על כל ה-B+tree. UUIDv7 שומר על ייחודיות ובנוסף מסודר לפי זמן." }
    }
  ],
  related: ["db-indexes", "infra-data-structures", "db-replication", "pr-db-landscape", "db-sql-vs-nosql"]
});

// ---------------------------------------------------------------------------
// 4. Search engines
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "db-search-engines",
  track: "data",
  order: 37,
  icon: "🔎",
  level: 2,
  minutes: 14,
  title: { en: "Search Engines: Elasticsearch & OpenSearch", he: "מנועי חיפוש: Elasticsearch ו-OpenSearch" },
  tldr: {
    en: "Elasticsearch/OpenSearch is an inverted index split into Lucene segments across shards: size shards at 10-50 GB, control mappings, understand that writes become searchable only after refresh (~1s), and keep it a derived copy fed from your real database.",
    he: "Elasticsearch/OpenSearch הוא inverted index שמחולק ל-segments של Lucene על פני shards: מכוונים shards ל-10-50 GB, שולטים ב-mappings, מבינים שכתיבות נהיות ניתנות לחיפוש רק אחרי refresh (בערך שנייה), ומשאירים אותו עותק נגזר שמוזן מה-DB האמיתי."
  },
  analogy: {
    en: "An inverted index is the index at the back of a textbook: instead of reading every page to find 'Kubernetes', you look up the word and get page numbers 12, 87, 203. Lucene segments are printed appendices — you never edit a printed one, you print a new one and occasionally rebind several into one volume (merge).",
    he: "Inverted index זה האינדקס בסוף ספר לימוד: במקום לקרוא כל עמוד כדי למצוא 'Kubernetes', מחפשים את המילה ומקבלים עמודים 12, 87, 203. Segments של Lucene הם נספחים מודפסים — אף פעם לא עורכים נספח מודפס, מדפיסים חדש ומדי פעם כורכים כמה מהם לכרך אחד (merge)."
  },
  sections: [
    {
      h: { en: "Inverted index, analyzers and mappings", he: "Inverted index, analyzers ו-mappings" },
      body: {
        en: `<p>A relational index maps row → value. An <strong>inverted index</strong> maps <strong>term → posting list</strong> (doc IDs, frequencies, positions):</p>
<pre>doc1: "Pod stuck in CrashLoopBackOff"
doc2: "Pod pending: insufficient cpu"

term              postings
pod           -&gt;  [1, 2]
stuck         -&gt;  [1]
crashloopbackoff -&gt; [1]
pending       -&gt;  [2]
insufficient  -&gt;  [2]
cpu           -&gt;  [2]</pre>
<p>Terms come from an <strong>analyzer</strong>: character filters (strip HTML) → <strong>tokenizer</strong> (split into tokens) → token filters (lowercase, stop words, stemming "running"→"run", synonyms). The same analyzer runs on the query, so "PODS" matches "pod".</p>
<p>A <strong>mapping</strong> is the schema: <code>text</code> fields are analyzed for full-text search; <code>keyword</code> fields are stored as one exact term for filters, aggregations and sorting (backed by doc values on disk). Get this wrong and either search or aggregations break.</p>
<pre>PUT orders
{ "settings": { "number_of_shards": 3, "number_of_replicas": 1, "refresh_interval": "1s" },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "title":    { "type": "text", "analyzer": "english",
                    "fields": { "raw": { "type": "keyword" } } },
      "status":   { "type": "keyword" },
      "total":    { "type": "scaled_float", "scaling_factor": 100 },
      "created":  { "type": "date" },
      "attrs":    { "type": "flattened" }
  } } }</pre>
<p><strong>Mapping explosion</strong>: with dynamic mapping on, every new JSON key becomes a field in the cluster state. Log lines with user-generated keys (<code>headers.x-custom-123</code>) create thousands of fields; the default limit <code>index.mapping.total_fields.limit</code> = 1000 then rejects documents, and huge cluster state slows the master. Use <code>"dynamic": "strict"</code> (or <code>false</code>) and the <code>flattened</code> type for arbitrary key/value bags. Changing a field's type requires a <strong>reindex</strong> into a new index (behind an alias).</p>`,
        he: `<p>Index רלציוני ממפה שורה ← ערך. <strong>Inverted index</strong> ממפה <strong>term → posting list</strong> (doc IDs, תדירויות, מיקומים):</p>
<pre>doc1: "Pod stuck in CrashLoopBackOff"
doc2: "Pod pending: insufficient cpu"

term              postings
pod           -&gt;  [1, 2]
stuck         -&gt;  [1]
crashloopbackoff -&gt; [1]
pending       -&gt;  [2]
insufficient  -&gt;  [2]
cpu           -&gt;  [2]</pre>
<p>ה-terms מגיעים מ-<strong>analyzer</strong>: character filters (מורידים HTML) ← <strong>tokenizer</strong> (פיצול ל-tokens) ← token filters (lowercase, stop words, stemming של "running"←"run", synonyms). אותו analyzer רץ גם על ה-query, אז "PODS" תואם ל-"pod".</p>
<p><strong>Mapping</strong> זה ה-schema: שדות <code>text</code> עוברים ניתוח בשביל full-text search; שדות <code>keyword</code> נשמרים כ-term מדויק אחד בשביל filters, aggregations ומיון (מגובים ב-doc values על הדיסק). טועים בזה — והחיפוש או ה-aggregations נשברים.</p>
<pre>PUT orders
{ "settings": { "number_of_shards": 3, "number_of_replicas": 1, "refresh_interval": "1s" },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "title":    { "type": "text", "analyzer": "english",
                    "fields": { "raw": { "type": "keyword" } } },
      "status":   { "type": "keyword" },
      "total":    { "type": "scaled_float", "scaling_factor": 100 },
      "created":  { "type": "date" },
      "attrs":    { "type": "flattened" }
  } } }</pre>
<p><strong>Mapping explosion</strong>: כש-dynamic mapping דלוק, כל מפתח JSON חדש הופך לשדה ב-cluster state. שורות log עם מפתחות שמשתמשים יוצרים (<code>headers.x-custom-123</code>) יוצרות אלפי שדות; ה-limit הדיפולטי <code>index.mapping.total_fields.limit</code> = 1000 מתחיל לדחות מסמכים, ו-cluster state ענק מאט את ה-master. משתמשים ב-<code>"dynamic": "strict"</code> (או <code>false</code>) ובטיפוס <code>flattened</code> לשקיות key/value שרירותיות. שינוי טיפוס של שדה דורש <strong>reindex</strong> ל-index חדש (מאחורי alias).</p>`
      }
    },
    {
      h: { en: "Lucene segments, refresh, flush and merges", he: "Segments של Lucene, refresh, flush ו-merges" },
      body: {
        en: `<p>Each shard is a Lucene index made of immutable <strong>segments</strong>. The write path:</p>
<ol><li>Document → in-memory indexing buffer + appended to the <strong>translog</strong> (the durability log; fsynced per request by default, <code>index.translog.durability: request</code>).</li>
<li><strong>Refresh</strong> (default every 1s) writes the buffer as a new small segment into the OS cache and opens it for search. That is why ES is <em>near-real-time</em>: a document you just indexed is invisible to search for up to 1 second. (Indices with no searches for 30s skip scheduled refreshes — <code>index.search.idle.after</code>.)</li>
<li><strong>Flush</strong> = Lucene commit: fsync segments to disk and trim the translog.</li>
<li><strong>Merges</strong>: many small segments are merged into bigger ones in the background. Deletes and updates only mark docs as deleted (an update = delete + new doc); space is reclaimed at merge time.</li></ol>
<pre># bulk load 2 billion docs faster: no refreshes, no replicas, then restore
PUT logs-reindex/_settings { "index": { "refresh_interval": "-1", "number_of_replicas": 0 } }
# ... _bulk in 5-15 MB batches ...
PUT logs-reindex/_settings { "index": { "refresh_interval": "1s", "number_of_replicas": 1 } }

# read-only old index: merge down to 1 segment (never on indices still being written)
POST logs-2026.10/_forcemerge?max_num_segments=1</pre>
<blockquote>⚠️ Production tip: "I indexed it but GET-search returns nothing" in a test is refresh, not a bug. In tests use <code>?refresh=wait_for</code>; in production don't set <code>refresh=true</code> on every write — it creates a tiny segment per request and merges eat your CPU.</blockquote>`,
        he: `<p>כל shard הוא Lucene index שבנוי מ-<strong>segments</strong> שלא משתנים. מסלול הכתיבה:</p>
<ol><li>מסמך ← indexing buffer בזיכרון + append ל-<strong>translog</strong> (ה-log של העמידות; עושים לו fsync בכל request כברירת מחדל, <code>index.translog.durability: request</code>).</li>
<li><strong>Refresh</strong> (ברירת מחדל כל שנייה) כותב את ה-buffer כ-segment קטן וחדש ל-cache של ה-OS ופותח אותו לחיפוש. בגלל זה ES הוא <em>near-real-time</em>: מסמך שהרגע עשית לו index לא נראה בחיפוש עד שנייה. (Indices שלא חיפשו בהם 30 שניות מדלגים על refreshes מתוזמנים — <code>index.search.idle.after</code>.)</li>
<li><strong>Flush</strong> = commit של Lucene: fsync ל-segments בדיסק וקיצוץ ה-translog.</li>
<li><strong>Merges</strong>: הרבה segments קטנים ממוזגים לגדולים יותר ברקע. Deletes ו-updates רק מסמנים מסמכים כמחוקים (update = delete + מסמך חדש); המקום מתפנה בזמן ה-merge.</li></ol>
<pre># bulk load 2 billion docs faster: no refreshes, no replicas, then restore
PUT logs-reindex/_settings { "index": { "refresh_interval": "-1", "number_of_replicas": 0 } }
# ... _bulk in 5-15 MB batches ...
PUT logs-reindex/_settings { "index": { "refresh_interval": "1s", "number_of_replicas": 1 } }

# read-only old index: merge down to 1 segment (never on indices still being written)
POST logs-2026.10/_forcemerge?max_num_segments=1</pre>
<blockquote>⚠️ טיפ לפרודקשן: "עשיתי index אבל החיפוש לא מחזיר כלום" בטסט זה refresh, לא באג. בטסטים משתמשים ב-<code>?refresh=wait_for</code>; בפרודקשן לא שמים <code>refresh=true</code> על כל כתיבה — זה יוצר segment קטנטן לכל request וה-merges אוכלים לך את ה-CPU.</blockquote>`
      }
    },
    {
      h: { en: "Shards and replicas: sizing", he: "Shards ו-replicas: sizing" },
      body: {
        en: `<p>An index is split into <strong>primary shards</strong> (fixed at creation; change only via <code>_split</code>, <code>_shrink</code> or reindex) and each primary has N <strong>replicas</strong> on other nodes (HA + read throughput). Every shard costs heap, file handles and cluster-state entries, and every search fans out to one copy of every shard.</p>
<ul><li><strong>Target 10-50 GB per shard</strong> (search-heavy: lower end; logs: up to 50 GB) and under ~200M documents per shard.</li>
<li>Thousands of tiny shards (daily indices × 5 shards × 3 years) is the most common ES performance problem — "oversharding". The older rule of thumb: at most ~20 shards per GB of JVM heap.</li>
<li>JVM heap: ≤ 50% of RAM (the rest is OS cache for segments) and below ~31 GB to keep compressed object pointers.</li></ul>
<pre>Sizing example: 200 GB/day of logs, 30 days hot, 1 replica
  primary data:  200 GB × 30 = 6 TB      × 2 (replica) = 12 TB on disk
  + ~15% overhead, keep disk under the 85% watermark  → ~16 TB raw disk
  shards: 200 GB/day ÷ 40 GB ≈ 5 primaries per daily index (or rollover at 40 GB)
          5 × 30 days × 2 copies = 300 shards  → fine for 6-8 data nodes</pre>`,
        he: `<p>Index מחולק ל-<strong>primary shards</strong> (נקבע ביצירה; משנים רק עם <code>_split</code>, <code>_shrink</code> או reindex) ולכל primary יש N <strong>replicas</strong> על nodes אחרים (HA ו-throughput של קריאות). כל shard עולה heap, file handles ורשומות ב-cluster state, וכל חיפוש עושה fan-out לעותק אחד של כל shard.</p>
<ul><li><strong>יעד: 10-50 GB ל-shard</strong> (כבד חיפושים: הקצה הנמוך; logs: עד 50 GB) ופחות מבערך 200M מסמכים ל-shard.</li>
<li>אלפי shards קטנטנים (indices יומיים × 5 shards × 3 שנים) זו בעיית הביצועים הכי נפוצה ב-ES — "oversharding". כלל האצבע הישן: לכל היותר בערך 20 shards לכל GB של JVM heap.</li>
<li>JVM heap: עד 50% מה-RAM (השאר הוא OS cache בשביל ה-segments) ומתחת לבערך 31 GB כדי לשמור על compressed object pointers.</li></ul>
<pre>Sizing example: 200 GB/day of logs, 30 days hot, 1 replica
  primary data:  200 GB × 30 = 6 TB      × 2 (replica) = 12 TB on disk
  + ~15% overhead, keep disk under the 85% watermark  → ~16 TB raw disk
  shards: 200 GB/day ÷ 40 GB ≈ 5 primaries per daily index (or rollover at 40 GB)
          5 × 30 days × 2 copies = 300 shards  → fine for 6-8 data nodes</pre>`
      }
    },
    {
      h: { en: "Cluster health red / yellow / green and how to fix each", he: "Cluster health אדום / צהוב / ירוק ואיך מתקנים כל אחד" },
      body: {
        en: `<table><tr><th>Status</th><th>Meaning</th><th>Impact</th></tr>
<tr><td>🟢 green</td><td>all primaries and replicas assigned</td><td>none</td></tr>
<tr><td>🟡 yellow</td><td>all primaries assigned, ≥1 replica unassigned</td><td>search/write work, but reduced redundancy</td></tr>
<tr><td>🔴 red</td><td>≥1 primary unassigned</td><td>data in that shard unavailable; writes to it fail</td></tr></table>
<pre>GET _cluster/health?filter_path=status,unassigned_shards,number_of_nodes
GET _cat/shards?v&amp;h=index,shard,prirep,state,node,unassigned.reason&amp;s=state
GET _cluster/allocation/explain          # THE command: tells you why, in English
GET _cat/allocation?v                    # disk per node vs watermarks</pre>
<p><strong>Yellow</strong> causes &amp; fixes:</p>
<ul><li>Single-node cluster with <code>number_of_replicas: 1</code> — a replica can never sit on the same node as its primary. Add a node or set replicas to 0 (dev only).</li>
<li>Disk <strong>watermarks</strong>: low 85% (no new shards allocated to the node), high 90% (shards moved away), flood stage 95% (indices with a shard there become read-only: <code>index.blocks.read_only_allow_delete</code>; since 7.4 auto-released once usage drops below the high watermark). Free disk, delete old indices, add nodes.</li>
<li>Node restarted — replicas recover automatically after <code>index.unassigned.node_left.delayed_timeout</code> (1m). Just watch.</li></ul>
<p><strong>Red</strong> causes &amp; fixes:</p>
<ul><li>Node holding the only copy of a primary is down → bring it back; data returns with it.</li>
<li>Allocation failed after retries (corruption, max_retries reached) → fix the cause, then <code>POST _cluster/reroute?retry_failed=true</code>.</li>
<li>All copies truly lost → restore that index from a snapshot (<code>POST _snapshot/repo/snap/_restore</code>), or as a last resort <code>allocate_stale_primary</code> / <code>allocate_empty_primary</code> via reroute with <code>accept_data_loss: true</code> — you lose data, so try snapshots first.</li></ul>`,
        he: `<table><tr><th>סטטוס</th><th>משמעות</th><th>השפעה</th></tr>
<tr><td>🟢 green</td><td>כל ה-primaries וה-replicas מוקצים</td><td>אין</td></tr>
<tr><td>🟡 yellow</td><td>כל ה-primaries מוקצים, לפחות replica אחד לא מוקצה</td><td>חיפוש וכתיבה עובדים, אבל פחות redundancy</td></tr>
<tr><td>🔴 red</td><td>לפחות primary אחד לא מוקצה</td><td>ה-data ב-shard הזה לא זמין; כתיבות אליו נכשלות</td></tr></table>
<pre>GET _cluster/health?filter_path=status,unassigned_shards,number_of_nodes
GET _cat/shards?v&amp;h=index,shard,prirep,state,node,unassigned.reason&amp;s=state
GET _cluster/allocation/explain          # THE command: tells you why, in English
GET _cat/allocation?v                    # disk per node vs watermarks</pre>
<p><strong>Yellow</strong> — סיבות ותיקונים:</p>
<ul><li>Cluster של node אחד עם <code>number_of_replicas: 1</code> — replica אף פעם לא יכול לשבת על אותו node כמו ה-primary שלו. מוסיפים node או שמים replicas על 0 (רק ב-dev).</li>
<li><strong>Watermarks</strong> של דיסק: low ב-85% (לא מקצים shards חדשים ל-node), high ב-90% (מזיזים shards משם), flood stage ב-95% (indices עם shard שם נהיים read-only: <code>index.blocks.read_only_allow_delete</code>; מאז 7.4 משתחרר אוטומטית כשהשימוש יורד מתחת ל-high watermark). מפנים דיסק, מוחקים indices ישנים, מוסיפים nodes.</li>
<li>Node עשה restart — ה-replicas מתאוששים לבד אחרי <code>index.unassigned.node_left.delayed_timeout</code> (דקה). פשוט עוקבים.</li></ul>
<p><strong>Red</strong> — סיבות ותיקונים:</p>
<ul><li>ה-node שמחזיק את העותק היחיד של primary נפל ← מחזירים אותו; ה-data חוזר איתו.</li>
<li>ההקצאה נכשלה אחרי retries (corruption, הגיע ל-max_retries) ← מתקנים את הסיבה, ואז <code>POST _cluster/reroute?retry_failed=true</code>.</li>
<li>כל העותקים באמת אבדו ← משחזרים את ה-index מ-snapshot (<code>POST _snapshot/repo/snap/_restore</code>), או כמוצא אחרון <code>allocate_stale_primary</code> / <code>allocate_empty_primary</code> דרך reroute עם <code>accept_data_loss: true</code> — מאבדים data, אז קודם מנסים snapshots.</li></ul>`
      }
    },
    {
      h: { en: "Relevance (BM25), ILM, and why search is not your primary DB", he: "Relevance (BM25), ILM, ולמה מנוע חיפוש הוא לא ה-DB הראשי" },
      body: {
        en: `<p><strong>BM25</strong> (default since ES 5 / Lucene 6) scores a document per query term by: <em>term frequency</em> with saturation (the 10th "kubernetes" adds little; <code>k1 = 1.2</code>), <em>inverse document frequency</em> (rare terms weigh more than "the"), and <em>field length normalization</em> (a match in a 5-word title beats one in a 5,000-word body; <code>b = 0.75</code>). Tune with field boosts (<code>title^3</code>), <code>function_score</code> (recency, popularity) and use <code>_explain</code> to see why a doc ranked where it did. Filters (<code>bool.filter</code>) don't score and are cached — put exact conditions there, not in <code>must</code>.</p>
<p><strong>ILM</strong> (Index Lifecycle Management; OpenSearch calls it ISM) automates time-based indices with a data stream:</p>
<pre>PUT _ilm/policy/logs
{ "policy": { "phases": {
  "hot":    { "actions": { "rollover": { "max_primary_shard_size": "50gb", "max_age": "1d" } } },
  "warm":   { "min_age": "7d",  "actions": { "shrink": { "number_of_shards": 1 }, "forcemerge": { "max_num_segments": 1 } } },
  "cold":   { "min_age": "30d", "actions": { "searchable_snapshot": { "snapshot_repository": "s3-repo" } } },
  "delete": { "min_age": "90d", "actions": { "delete": {} } } } } }</pre>
<p>Hot nodes: fast NVMe, all writes. Warm: bigger cheaper disks, read-only. Cold/frozen: data backed by snapshots in S3, slow but cheap.</p>
<p><strong>Not a primary database</strong>: no multi-document transactions, near-real-time visibility, mapping changes need a reindex, and a red cluster can lose acknowledged writes in edge cases. Treat it as a <em>derived, rebuildable projection</em>:</p>
<ul><li><strong>CDC</strong>: Postgres/MySQL → Debezium → Kafka → sink connector / consumer → ES (idempotent upserts by primary key, use the source version with <code>version_type=external</code> to avoid out-of-order overwrites).</li>
<li><strong>Transactional outbox</strong>: write the row + an outbox event in one DB transaction; a relay publishes it and an indexer updates ES. Never "write to DB, then write to ES" in the request — the second write will eventually fail and the two drift.</li>
<li>Always keep a <strong>full reindex</strong> path (from the DB into a new index, then flip the alias) — it is your recovery plan and your mapping-migration plan.</li></ul>`,
        he: `<p><strong>BM25</strong> (ברירת המחדל מאז ES 5 / Lucene 6) נותן ניקוד למסמך לכל term ב-query לפי: <em>term frequency</em> עם רוויה (ה-"kubernetes" העשירי מוסיף מעט; <code>k1 = 1.2</code>), <em>inverse document frequency</em> (terms נדירים שוקלים יותר מ-"the"), ו-<em>נרמול לפי אורך השדה</em> (התאמה בכותרת של 5 מילים מנצחת התאמה בגוף של 5,000 מילים; <code>b = 0.75</code>). מכווננים עם boosts לשדות (<code>title^3</code>), <code>function_score</code> (עדכניות, פופולריות) ומשתמשים ב-<code>_explain</code> כדי לראות למה מסמך דורג איפה שדורג. Filters (<code>bool.filter</code>) לא נותנים ניקוד ונשמרים ב-cache — שם שמים תנאים מדויקים, לא ב-<code>must</code>.</p>
<p><strong>ILM</strong> (Index Lifecycle Management; ב-OpenSearch זה נקרא ISM) מנהל אוטומטית indices מבוססי זמן עם data stream:</p>
<pre>PUT _ilm/policy/logs
{ "policy": { "phases": {
  "hot":    { "actions": { "rollover": { "max_primary_shard_size": "50gb", "max_age": "1d" } } },
  "warm":   { "min_age": "7d",  "actions": { "shrink": { "number_of_shards": 1 }, "forcemerge": { "max_num_segments": 1 } } },
  "cold":   { "min_age": "30d", "actions": { "searchable_snapshot": { "snapshot_repository": "s3-repo" } } },
  "delete": { "min_age": "90d", "actions": { "delete": {} } } } } }</pre>
<p>Hot nodes: NVMe מהיר, כל הכתיבות. Warm: דיסקים גדולים וזולים, read-only. Cold/frozen: data שמגובה ב-snapshots ב-S3, איטי אבל זול.</p>
<p><strong>לא DB ראשי</strong>: אין טרנזקציות על כמה מסמכים, הנראות היא near-real-time, שינוי mapping דורש reindex, ו-cluster אדום יכול במקרי קצה לאבד כתיבות שכבר אושרו. מתייחסים אליו כ-<em>projection נגזר שאפשר לבנות מחדש</em>:</p>
<ul><li><strong>CDC</strong>: Postgres/MySQL ← Debezium ← Kafka ← sink connector / consumer ← ES (upserts אידמפוטנטיים לפי primary key, עם הגרסה מהמקור ו-<code>version_type=external</code> כדי שכתיבה שהגיעה באיחור לא תדרוס חדשה).</li>
<li><strong>Transactional outbox</strong>: כותבים את השורה ואירוע outbox באותה טרנזקציה ב-DB; relay מפרסם אותו ו-indexer מעדכן את ES. אף פעם לא "כותבים ל-DB ואז כותבים ל-ES" בתוך ה-request — הכתיבה השנייה תיכשל מתישהו והשניים יתרחקו.</li>
<li>תמיד שומרים מסלול של <strong>reindex מלא</strong> (מה-DB ל-index חדש, ואז מעבירים את ה-alias) — זו תוכנית ההתאוששות שלך וגם תוכנית המיגרציה של ה-mappings.</li></ul>`
      }
    }
  ],
  diagram: `  Postgres --(WAL)--> Debezium --> Kafka --> indexer --> Elasticsearch (alias: orders)
                                                              |
         index "orders-v3"  =  3 primary shards  x  1 replica
         node A: P0 R1       node B: P1 R2       node C: P2 R0
                    |
         each shard = Lucene index:
         write -> buffer + translog --refresh 1s--> new segment (searchable)
                                    --flush-------> fsync segments, trim translog
         [seg][seg][seg][seg] --merge--> [  big seg  ]   (deletes purged here)

  health: green = all assigned | yellow = replica missing | red = PRIMARY missing`,
  handsOn: [
    { cmd: "curl -s 'localhost:9200/_cluster/health?pretty'", what: { en: "Cluster status, active/unassigned shards, nodes — your first look during an incident.", he: "סטטוס ה-cluster, shards פעילים/לא מוקצים, nodes — המבט הראשון באירוע." } },
    { cmd: "curl -s 'localhost:9200/_cluster/allocation/explain?pretty'", what: { en: "Ask the cluster why a shard is unassigned (disk watermark, same-node replica, failed allocation...).", he: "שואל את ה-cluster למה shard לא מוקצה (watermark של דיסק, replica על אותו node, הקצאה שנכשלה...)." } },
    { cmd: "curl -s 'localhost:9200/_cat/indices?v&s=store.size:desc&h=index,health,pri,rep,docs.count,store.size' | head", what: { en: "Biggest indices with shard counts — spot oversharding or a 300 GB single shard.", he: "ה-indices הכי גדולים עם מספר ה-shards — מזהה oversharding או shard בודד של 300 GB." } },
    { cmd: "curl -s -XPOST 'localhost:9200/_analyze?pretty' -H 'Content-Type: application/json' -d '{\"analyzer\":\"english\",\"text\":\"Pods are Running again\"}'", what: { en: "See exactly which tokens an analyzer produces — the root of most 'why doesn't it match' questions.", he: "רואה בדיוק אילו tokens ה-analyzer מייצר — השורש של רוב שאלות ה\"למה זה לא תואם\"." } },
    { cmd: "curl -s 'localhost:9200/_cat/segments/orders?v' | head", what: { en: "Lucene segments per shard: count, size, deleted docs waiting for a merge.", he: "Segments של Lucene לכל shard: כמות, גודל, מסמכים מחוקים שמחכים ל-merge." } }
  ],
  mnemonic: {
    en: "\"Search is a mirror, not the source.\" And the colors: green = all good, yellow = a backup copy is missing, red = real data is missing.",
    he: "\"מנוע חיפוש הוא מראה, לא המקור.\" והצבעים: ירוק = הכול טוב, צהוב = עותק גיבוי חסר, אדום = data אמיתי חסר."
  },
  pitfalls: [
    { en: "Oversharding: daily indices with 5 shards each for 3 years = thousands of tiny shards that waste heap and slow every search. Use rollover by size (~40-50 GB).", he: "Oversharding: indices יומיים עם 5 shards כל אחד במשך 3 שנים = אלפי shards קטנטנים שמבזבזים heap ומאטים כל חיפוש. תשתמש ב-rollover לפי גודל (בערך 40-50 GB)." },
    { en: "Leaving dynamic mapping on for logs with arbitrary keys — mapping explosion, rejected documents at 1000 fields, a bloated cluster state.", he: "להשאיר dynamic mapping דלוק ל-logs עם מפתחות שרירותיים — mapping explosion, מסמכים נדחים ב-1000 שדות, cluster state נפוח." },
    { en: "Using Elasticsearch as the system of record with dual writes from the app — it drifts from the DB and there is no clean way to rebuild it.", he: "להשתמש ב-Elasticsearch כ-system of record עם dual writes מהאפליקציה — הוא מתרחק מה-DB ואין דרך נקייה לבנות אותו מחדש." },
    { en: "Ignoring disk watermarks: at 95% indices go read-only and ingestion silently backs up in Logstash/Kafka.", he: "להתעלם מ-watermarks של דיסק: ב-95% ה-indices נהיים read-only וה-ingestion נערם בשקט ב-Logstash/Kafka." }
  ],
  interview: [
    {
      q: { en: "The cluster is red at 3 AM. Walk me through it.", he: "ה-cluster אדום ב-3 בלילה. תעבור איתי על זה." },
      a: {
        en: "Red means at least one primary shard is unassigned, so part of the data is unavailable. GET _cluster/health to see how many, _cat/shards filtered on UNASSIGNED to see which indices, then _cluster/allocation/explain for the reason. If a node left, get it back (its disk has the data) — replicas will heal. If allocation failed after max retries, fix the cause (disk, corruption) and reroute?retry_failed=true. If the index is a daily log index and all copies are gone, decide with the owner: restore from snapshot, or accept loss for that index. Only then consider allocate_stale_primary with accept_data_loss. Afterwards: why was there no replica on another node/AZ?",
        he: "אדום אומר שלפחות primary shard אחד לא מוקצה, אז חלק מה-data לא זמין. GET _cluster/health כדי לראות כמה, _cat/shards עם סינון על UNASSIGNED כדי לראות אילו indices, ואז _cluster/allocation/explain בשביל הסיבה. אם node נפל — מחזירים אותו (ה-data בדיסק שלו) וה-replicas יתאוששו. אם ההקצאה נכשלה אחרי max retries — מתקנים את הסיבה (דיסק, corruption) ו-reroute?retry_failed=true. אם זה index יומי של logs וכל העותקים אבדו, מחליטים עם הבעלים: שחזור מ-snapshot, או קבלת האובדן ל-index הזה. רק אז שוקלים allocate_stale_primary עם accept_data_loss. אחר כך: למה לא היה replica על node/AZ אחר?"
      }
    },
    {
      q: { en: "How do you keep product search in Elasticsearch in sync with Postgres?", he: "איך שומרים חיפוש מוצרים ב-Elasticsearch מסונכרן עם Postgres?" },
      a: {
        en: "Postgres is the source of truth. Use CDC (Debezium reading the WAL into Kafka) or a transactional outbox; an indexer consumes events and upserts documents by product ID with external versioning so reordering can't overwrite newer data. Deletes become delete events. Monitor lag (Kafka consumer lag, and doc counts vs DB). Keep a full reindex job that builds a new index from Postgres and flips an alias — used for mapping changes and to recover from drift.",
        he: "Postgres הוא מקור האמת. משתמשים ב-CDC (Debezium שקורא את ה-WAL ל-Kafka) או ב-transactional outbox; indexer צורך אירועים ועושה upsert למסמכים לפי product ID עם external versioning, כדי ששינוי סדר לא ידרוס data חדש יותר. Deletes הופכים לאירועי delete. מנטרים lag (consumer lag ב-Kafka, וספירת מסמכים מול ה-DB). שומרים job של reindex מלא שבונה index חדש מ-Postgres ומעביר alias — משמש לשינויי mapping ולהתאוששות מסטייה."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Your cluster is yellow. What is true?", he: "ה-cluster שלך צהוב. מה נכון?" },
      options: [
        { en: "Some data is unavailable for search", he: "חלק מה-data לא זמין לחיפוש" },
        { en: "All primaries are assigned but at least one replica is not", he: "כל ה-primaries מוקצים אבל לפחות replica אחד לא" },
        { en: "The master node is down", he: "ה-master node נפל" },
        { en: "Indexing is blocked", he: "ה-indexing חסום" }
      ],
      answer: 1,
      explain: { en: "Yellow = full data available, reduced redundancy. Red is the one where a primary (real data) is missing.", he: "צהוב = כל ה-data זמין, פחות redundancy. אדום זה המצב שבו primary (data אמיתי) חסר." }
    },
    {
      q: { en: "A test indexes a document and immediately searches for it — sometimes it's not found. Why?", he: "טסט עושה index למסמך ומיד מחפש אותו — לפעמים הוא לא נמצא. למה?" },
      options: [
        { en: "The translog was not fsynced", he: "לא נעשה fsync ל-translog" },
        { en: "The document becomes searchable only after the next refresh (default 1s)", he: "המסמך נהיה ניתן לחיפוש רק אחרי ה-refresh הבא (ברירת מחדל שנייה)" },
        { en: "The replica wasn't assigned", he: "ה-replica לא הוקצה" },
        { en: "BM25 gave it a score of zero", he: "BM25 נתן לו ניקוד אפס" }
      ],
      answer: 1,
      explain: { en: "Elasticsearch is near-real-time: refresh opens new segments for search. Use ?refresh=wait_for in tests instead of forcing refresh on every production write.", he: "Elasticsearch הוא near-real-time: ה-refresh פותח segments חדשים לחיפוש. בטסטים משתמשים ב-?refresh=wait_for במקום לכפות refresh על כל כתיבה בפרודקשן." }
    },
    {
      q: { en: "You ingest 120 GB/day of logs. Which daily index layout is most sensible?", he: "אתה מכניס 120 GB של logs ביום. איזה מבנה index יומי הכי הגיוני?" },
      options: [
        { en: "1 primary shard of 120 GB", he: "Primary shard אחד של 120 GB" },
        { en: "3 primaries (~40 GB each) or rollover at ~40-50 GB per shard", he: "3 primaries (בערך 40 GB כל אחד) או rollover בבערך 40-50 GB ל-shard" },
        { en: "120 primaries of 1 GB", he: "120 primaries של GB אחד" },
        { en: "Number of shards doesn't matter", he: "מספר ה-shards לא משנה" }
      ],
      answer: 1,
      explain: { en: "Aim for 10-50 GB per shard. 120 GB shards recover and rebalance slowly; 1 GB shards waste heap and slow searches (oversharding).", he: "היעד הוא 10-50 GB ל-shard. Shards של 120 GB מתאוששים ומתאזנים לאט; shards של GB אחד מבזבזים heap ומאטים חיפושים (oversharding)." }
    },
    {
      q: { en: "Why should a 'status' field used for filters and aggregations be mapped as keyword rather than text?", he: "למה שדה 'status' שמשמש ל-filters ול-aggregations צריך להיות ממופה כ-keyword ולא כ-text?" },
      options: [
        { en: "keyword fields are analyzed into many tokens", he: "שדות keyword מנותחים להרבה tokens" },
        { en: "keyword stores the exact value as one term with doc values, ideal for exact filters, aggregations and sorting", he: "keyword שומר את הערך המדויק כ-term אחד עם doc values, אידיאלי ל-filters מדויקים, aggregations ומיון" },
        { en: "text fields cannot be stored", he: "שדות text לא יכולים להישמר" },
        { en: "keyword fields use BM25 scoring", he: "שדות keyword משתמשים בניקוד BM25" }
      ],
      answer: 1,
      explain: { en: "text is analyzed (split, lowercased) for full-text search and has no doc values by default; keyword keeps 'PAYMENT_FAILED' intact for term filters and terms aggregations.", he: "text עובר ניתוח (פיצול, lowercase) בשביל full-text search ואין לו doc values כברירת מחדל; keyword שומר את 'PAYMENT_FAILED' שלם בשביל term filters ו-terms aggregations." }
    }
  ],
  related: ["db-indexes", "db-storage-engines", "arch-event-driven", "staff-exactly-once", "obs-logs"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  ["Head block", "Prometheus' in-memory block holding the most recent ~2-3 hours of samples, protected by the WAL and compacted into a persistent 2h block.", "ה-block בזיכרון של Prometheus שמחזיק את השעתיים-שלוש האחרונות של samples, מוגן על ידי ה-WAL ועובר compaction ל-block קבוע של 2h.", "db-time-series"],
  ["Downsampling", "Reducing old time-series data to coarser resolution (e.g. 5m, 1h aggregates) to cut storage and speed up long-range queries, at the cost of short spikes.", "הורדת רזולוציה של data ישן בסדרות זמן (למשל אגרגטים של 5m או שעה) כדי לחסוך storage ולהאיץ queries על טווחים ארוכים, במחיר של spikes קצרים.", "db-time-series"],
  ["Hypertable", "TimescaleDB table that is automatically partitioned by time into chunks, so retention and compression work per chunk.", "טבלה של TimescaleDB שמחולקת אוטומטית לפי זמן ל-chunks, כך ש-retention ודחיסה עובדים לכל chunk.", "db-time-series"],
  ["Side-by-side restore", "Restoring a backup into a new instance or database next to production instead of over it, so prod stays intact for comparison, merge-back and fallback.", "שחזור backup ל-instance או DB חדש ליד פרודקשן במקום עליו, כך שפרודקשן נשאר שלם להשוואה, למיזוג חזרה ול-fallback.", "db-restore-runbook"],
  ["recovery_target_time", "Postgres setting that tells point-in-time recovery when to stop replaying WAL; always specify it with an explicit UTC offset.", "הגדרה של Postgres שאומרת ל-point-in-time recovery מתי להפסיק להריץ WAL; תמיד מגדירים אותה עם offset מפורש של UTC.", "db-restore-runbook"],
  ["Binlog position", "Byte offset inside a MySQL binary log file; replaying with mysqlbinlog --stop-position stops exactly before a bad statement.", "Offset בבתים בתוך קובץ binary log של MySQL; replay עם mysqlbinlog --stop-position עוצר בדיוק לפני פקודה רעה.", "db-restore-runbook"],
  ["Write amplification", "Bytes physically written to disk divided by bytes the application wrote; caused by page rewrites (B-tree) or compaction (LSM).", "כמות הבתים שנכתבה פיזית לדיסק חלקי כמות הבתים שהאפליקציה כתבה; נגרם משכתוב דפים (B-tree) או מ-compaction (LSM).", "db-storage-engines"],
  ["SSTable", "Sorted String Table: an immutable, sorted on-disk file produced by flushing an LSM memtable and later merged by compaction.", "Sorted String Table: קובץ ממוין שלא משתנה על הדיסק, שנוצר מ-flush של memtable ב-LSM ואחר כך ממוזג ב-compaction.", "db-storage-engines"],
  ["Buffer pool", "The database's in-memory cache of data pages (shared_buffers in Postgres, innodb_buffer_pool_size in InnoDB).", "ה-cache בזיכרון של ה-DB לדפי data (shared_buffers ב-Postgres, innodb_buffer_pool_size ב-InnoDB).", "db-storage-engines"],
  ["Inverted index", "Index that maps each term to the list of documents containing it — the core data structure of full-text search engines.", "Index שממפה כל term לרשימת המסמכים שמכילים אותו — מבנה הנתונים המרכזי של מנועי full-text search.", "db-search-engines"],
  ["Lucene segment", "Immutable mini-index inside an Elasticsearch/OpenSearch shard; created on refresh and merged in the background.", "מיני-index שלא משתנה בתוך shard של Elasticsearch/OpenSearch; נוצר ב-refresh וממוזג ברקע.", "db-search-engines"],
  ["BM25", "Default relevance scoring in Lucene: term frequency with saturation, inverse document frequency and field-length normalization.", "אלגוריתם הניקוד הדיפולטי ב-Lucene: term frequency עם רוויה, inverse document frequency ונרמול לפי אורך השדה.", "db-search-engines"]
].forEach(([term, en, he, lesson]) => INFRA.glossary.push({ term, track: "data", def: { en, he }, lesson }));

// ---------------------------------------------------------------------------
// On-call scenario
// ---------------------------------------------------------------------------
(function () {
  const t = (en, he) => ({ en, he });
  const c = (en, he, next, score, fen, fhe) => ({ label: t(en, he), next, score, feedback: t(fen, fhe) });
  INFRA.scenarios.push({
    id: "restore-gone-wrong",
    icon: "🛟",
    title: t("The restore that almost made it worse", "השחזור שכמעט החמיר את המצב"),
    start: "s1",
    steps: {
      s1: {
        text: t("14:41 Israel time. A support engineer ran a cleanup script against prod instead of staging. The orders table is empty. Checkout still works and new orders are being written. Postgres 16 on a VM, nightly base backups at 02:00 UTC, WAL archived to S3.",
                "14:41 שעון ישראל. מהנדס support הריץ סקריפט ניקוי על פרודקשן במקום על staging. טבלת orders ריקה. ה-checkout עדיין עובד והזמנות חדשות נכתבות. Postgres 16 על VM, base backups כל לילה ב-02:00 UTC, WAL מאורכב ל-S3."),
        data: `shop=# SELECT count(*) FROM orders;
 count
-------
    37
psql log: 2026-11-14 12:32:04.118 UTC [88231] LOG: statement: DELETE FROM orders;
replica lag: 0.2s`,
        choices: [
          c("Stop the script, then PITR-restore into a NEW instance side-by-side", "לעצור את הסקריפט, ואז PITR ל-instance חדש בצורת side-by-side", "s2", 20,
            "Right: stop the damage, keep prod (it has the 37 new orders), restore next to it.",
            "נכון: עוצרים את הנזק, משאירים את פרודקשן (יש בו את 37 ההזמנות החדשות), ומשחזרים לידו."),
          c("Fail over to the replica — it should still have the data", "לעשות failover ל-replica — אמור להיות לו עדיין את ה-data", "lose", -20,
            "Replica lag is 0.2s. The replica deleted the rows 0.2 seconds after the primary. Replicas are not backups.",
            "ה-replica lag הוא 0.2 שניות. ה-replica מחק את השורות 0.2 שניות אחרי ה-primary. Replicas הם לא backups."),
          c("Stop Postgres on prod and restore last night's backup over it", "לעצור את Postgres בפרודקשן ולשחזר עליו את ה-backup של אתמול בלילה", "lose", -25,
            "You just took checkout down and wiped the new orders and every other table's writes since 02:00 UTC. Never restore over prod.",
            "הרגע הפלת את ה-checkout ומחקת את ההזמנות החדשות ואת כל הכתיבות לשאר הטבלאות מאז 02:00 UTC. אף פעם לא משחזרים על פרודקשן.")
        ]
      },
      s2: {
        text: t("New VM is up with the 02:00 UTC base backup laid down. You write postgresql.auto.conf. The restore host's TimeZone is UTC. Which recovery target?",
                "VM חדש למעלה עם ה-base backup של 02:00 UTC פרוש. אתה כותב את postgresql.auto.conf. ה-TimeZone של שרת השחזור הוא UTC. איזה recovery target?"),
        data: `restore_command = 'wal-g wal-fetch %f %p'
recovery_target_action = 'pause'
recovery_target_time = ???`,
        choices: [
          c("'2026-11-14 12:32:00+00'", "'2026-11-14 12:32:00+00'", "s3", 20,
            "Explicit UTC offset, four seconds before the DELETE at 12:32:04 UTC. And 'pause' lets you inspect before promoting.",
            "Offset מפורש של UTC, ארבע שניות לפני ה-DELETE שהיה ב-12:32:04 UTC. ו-'pause' מאפשר לבדוק לפני promote."),
          c("'2026-11-14 14:32:00' (the time on everyone's clock)", "'2026-11-14 14:32:00' (השעה שעל השעון של כולם)", "s2b", -10,
            "No offset → read in the server's TimeZone (UTC). 14:32 UTC is two hours AFTER the DELETE.",
            "בלי offset ← נקרא לפי ה-TimeZone של השרת (UTC). 14:32 UTC זה שעתיים אחרי ה-DELETE.")
        ]
      },
      s2b: {
        text: t("Recovery pauses. You check: SELECT count(*) FROM orders returns 12. The DELETE was replayed. Since you used 'pause', nothing was promoted.",
                "ה-recovery נעצר. אתה בודק: SELECT count(*) FROM orders מחזיר 12. ה-DELETE הורץ. בגלל שהשתמשת ב-'pause', כלום לא עבר promote."),
        choices: [
          c("Re-lay the base backup and restart with '2026-11-14 12:32:00+00'", "לפרוש מחדש את ה-base backup ולהתחיל שוב עם '2026-11-14 12:32:00+00'", "s3", 5,
            "Correct fix. Recovery can't go backward, so you restart from the base backup. It cost you 40 minutes.",
            "התיקון הנכון. Recovery לא יכול ללכת אחורה, אז מתחילים שוב מה-base backup. זה עלה לך 40 דקות.")
        ]
      },
      s3: {
        text: t("Recovery stops early with an error.", "ה-recovery נעצר מוקדם עם שגיאה."),
        data: `LOG:  restored log file "000000010000004A00000016" from archive
ERROR: wal-g: archive object 000000010000004A00000017 not found
LOG:  redo done at 4A/16FFFF28 system usage: ...
FATAL: recovery ended before configured recovery target was reached`,
        choices: [
          c("Check pg_stat_archiver on prod and look for the segment in prod's pg_wal/", "לבדוק pg_stat_archiver בפרודקשן ולחפש את ה-segment ב-pg_wal/ של פרודקשן", "s4", 20,
            "pg_stat_archiver shows failed_count=3 for that segment (S3 credentials rotated at 09:00). The file is still in prod's pg_wal because Postgres keeps WAL until it's archived. You upload it and restart recovery.",
            "pg_stat_archiver מראה failed_count=3 על ה-segment הזה (ה-credentials של S3 הוחלפו ב-09:00). הקובץ עדיין ב-pg_wal של פרודקשן כי Postgres שומר WAL עד שהוא מאורכב. אתה מעלה אותו ומתחיל את ה-recovery שוב."),
          c("Promote what you have — it's close enough", "לעשות promote למה שיש — זה מספיק קרוב", "lose", -15,
            "The gap starts at 09:14 UTC. You'd lose 3+ hours of every table's writes and still not have the orders between 09:14 and 12:32.",
            "החור מתחיל ב-09:14 UTC. היית מאבד יותר מ-3 שעות של כתיבות בכל הטבלאות, ועדיין לא היו לך ההזמנות בין 09:14 ל-12:32.")
        ]
      },
      s4: {
        text: t("Recovery paused at the target. You connect and check.", "ה-recovery נעצר ב-target. אתה מתחבר ובודק."),
        data: `$ psql -h restore-vm -U postgres
postgres=# SELECT count(*) FROM orders;
ERROR:  relation "orders" does not exist
postgres=# SELECT current_database();
 current_database
------------------
 postgres`,
        choices: [
          c("Connect to the right database: \\c shop and re-check", "להתחבר ל-database הנכון: \\c shop ולבדוק שוב", "s5", 15,
            "You were in the default 'postgres' DB. In shop: count = 1,284,331, max(created_at) = 12:31:58 UTC. The data is there.",
            "היית ב-DB הדיפולטי 'postgres'. ב-shop: count = 1,284,331, max(created_at) = 12:31:58 UTC. ה-data שם."),
          c("Declare the backup broken and escalate to the vendor", "להכריז שה-backup שבור ולהסלים לספק", "lose", -10,
            "Classic 'restore succeeds but looks empty'. Always check current_database() before panicking.",
            "המקרה הקלאסי של \"השחזור הצליח אבל נראה ריק\". תמיד בודקים current_database() לפני פאניקה.")
        ]
      },
      s5: {
        text: t("Restored data verified. Prod now has 412 new orders written since the incident. How do you bring the data back?",
                "ה-data המשוחזר אומת. בפרודקשן יש עכשיו 412 הזמנות חדשות שנכתבו מאז האירוע. איך מחזירים את ה-data?"),
        choices: [
          c("Merge: postgres_fdw from prod, INSERT ... SELECT ... ON CONFLICT (id) DO NOTHING in one transaction, check counts, then COMMIT",
            "Merge: postgres_fdw מפרודקשן, INSERT ... SELECT ... ON CONFLICT (id) DO NOTHING בטרנזקציה אחת, לבדוק ספירות, ואז COMMIT", "s6", 20,
            "Only the damaged table, no clobbering. 1,284,331 rows inserted, 412 new orders untouched. Don't forget to check the orders_id_seq is ahead of max(id).",
            "רק הטבלה שנפגעה, בלי לדרוס. 1,284,331 שורות נכנסו, 412 ההזמנות החדשות לא נגעו בהן. לא לשכוח לבדוק ש-orders_id_seq גבוה מ-max(id)."),
          c("Promote the restore and swap the app's connection string to it", "לעשות promote לשחזור ולהחליף את ה-connection string של האפליקציה אליו", "lose", -10,
            "You lose the 412 new orders and every write to every other table since 12:32. Swap is for when the whole DB is bad, not one table.",
            "מאבדים את 412 ההזמנות החדשות ואת כל הכתיבות לשאר הטבלאות מאז 12:32. Swap מתאים כשכל ה-DB פגוע, לא טבלה אחת.")
        ]
      },
      s6: {
        text: t("Orders are back and checkout is healthy. It's 17:58. What do you do before closing the incident?",
                "ההזמנות חזרו וה-checkout בריא. השעה 17:58. מה אתה עושה לפני שסוגר את האירוע?"),
        choices: [
          c("Post a summary with real RTO (3h17m) and data impact, keep the restore VM for a few days, open action items: archiving alert, prod/staging credential separation, restore drills",
            "לפרסם סיכום עם RTO אמיתי (3:17 שעות) והשפעה על ה-data, להשאיר את ה-VM של השחזור כמה ימים, לפתוח action items: alert על ארכוב, הפרדת credentials בין prod ל-staging, תרגולי שחזור", "win", 15,
            "That's how incidents turn into fixes: the WAL-archiving gap and the 40-minute timezone detour would both have been caught by a monthly restore drill.",
            "ככה אירועים הופכים לתיקונים: החור בארכוב ה-WAL והעיכוב של 40 דקות בגלל ה-timezone היו נתפסים בתרגול שחזור חודשי."),
          c("Delete the restore VM to save cost and go home", "למחוק את ה-VM של השחזור כדי לחסוך כסף וללכת הביתה", "s6b", -5,
            "The fix holds, but you threw away forensic evidence and learned nothing for next time.",
            "התיקון מחזיק, אבל זרקת ראיות פורנזיות ולא למדת כלום לפעם הבאה.")
        ]
      },
      s6b: {
        text: t("Two days later finance finds 3 orders with wrong totals and asks to compare against the pre-incident state. The restore VM is gone.",
                "יומיים אחר כך הכספים מוצאים 3 הזמנות עם סכומים שגויים ומבקשים להשוות למצב שלפני האירוע. ה-VM של השחזור כבר לא קיים."),
        choices: [
          c("Restore again to the same target and write the postmortem properly this time", "לשחזר שוב לאותו target ולכתוב את ה-postmortem כמו שצריך הפעם", "win", 5,
            "Recovered, at the cost of another 3 hours. Keep restored copies until the incident is fully closed.",
            "התאוששת, במחיר של עוד 3 שעות. שומרים עותקים משוחזרים עד שהאירוע נסגר לגמרי.")
        ]
      },
      win: {
        text: t("Incident resolved: zero orders lost, prod never touched by the restore, and the action items fix the real causes (archiving gap, shared credentials, no restore drills).",
                "האירוע נפתר: אפס הזמנות אבדו, השחזור לא נגע בפרודקשן אף פעם, וה-action items מתקנים את הסיבות האמיתיות (חור בארכוב, credentials משותפים, אין תרגולי שחזור)."),
        end: "win"
      },
      lose: {
        text: t("The recovery made things worse: more data lost or a longer outage. Remember: stop the damage, restore side-by-side, explicit UTC target, verify, then merge or swap.",
                "השחזור החמיר את המצב: יותר data אבד או outage ארוך יותר. תזכור: עוצרים את הנזק, משחזרים side-by-side, target ב-UTC מפורש, מאמתים, ואז merge או swap."),
        end: "lose"
      }
    },
    lessons: ["db-restore-runbook", "db-backups", "pr-backups-strategy"]
  });
})();
