window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Data track (more, part 2): OLAP & columnar warehouses, DynamoDB & Cassandra,
   vector databases, MongoDB in production + glossary + on-call scenario
   ========================================================================= */

/* ------------------------------------------------------------------ 24 */
INFRA.lessons.push({
  id: "db-olap-columnar",
  track: "data",
  order: 24,
  icon: "📊",
  level: 2,
  minutes: 14,
  title: { en: "OLAP & Columnar Warehouses", he: "OLAP ו-Data Warehouses עמודתיים" },
  tldr: {
    en: "OLTP stores rows to touch a few records fast; OLAP stores columns to scan billions of values fast. ClickHouse, BigQuery, Snowflake and Redshift all win by reading only the columns you ask for, compressed, in vectorized batches — and they all bill you for scanning carelessly.",
    he: "OLTP שומר שורות כדי לגעת בכמה רשומות מהר; OLAP שומר עמודות כדי לסרוק מיליארדי ערכים מהר. ClickHouse, BigQuery, Snowflake ו-Redshift מנצחים כי הם קוראים רק את העמודות שביקשת, דחוסות, ב-batches וקטוריים — וכולם גם גובים ממך כסף על סריקה לא זהירה."
  },
  analogy: {
    en: "A row store is a filing cabinet of customer folders: perfect when you need everything about customer #4521. A column store is a set of ledgers, one per field — one book of just prices, one of just dates. To answer 'total revenue in 2025' you open two ledgers and run your finger down them, instead of opening a billion folders to pull one sheet from each.",
    he: "Row store זה ארון תיקים של לקוחות: מושלם כשצריך הכל על לקוח 4521. Column store זה סט של פנקסים, אחד לכל שדה — פנקס רק של מחירים, פנקס רק של תאריכים. כדי לענות על 'סך ההכנסות ב-2025' אתה פותח שני פנקסים ומעביר אצבע לאורכם, במקום לפתוח מיליארד תיקים ולשלוף מכל אחד דף אחד."
  },
  sections: [
    {
      h: { en: "OLTP vs OLAP: two different jobs", he: "OLTP מול OLAP: שתי עבודות שונות" },
      body: {
        en: `<p><strong>OLTP</strong> (Postgres, MySQL, DynamoDB) serves the product: thousands of small transactions per second, each touching a handful of rows by key — "insert this order", "update this balance". Latency target: single-digit milliseconds. <strong>OLAP</strong> serves analysts, dashboards and ML: few queries, each scanning millions to billions of rows and aggregating — "revenue per country per week for 3 years". Latency target: seconds.</p>
<table><tr><th></th><th>OLTP</th><th>OLAP</th></tr>
<tr><td>Query shape</td><td>Point lookups, small writes</td><td>Big scans, GROUP BY, joins</td></tr>
<tr><td>Rows touched</td><td>1-100</td><td>10M-100B</td></tr>
<tr><td>Storage layout</td><td>Row-oriented + B-tree</td><td>Column-oriented, compressed</td></tr>
<tr><td>Writes</td><td>Single-row, transactional</td><td>Batch / append, bulk loads</td></tr>
<tr><td>Examples</td><td>Postgres, MySQL, Aurora</td><td>ClickHouse, BigQuery, Snowflake, Redshift</td></tr></table>
<p>Running analytics on your production Postgres works until it doesn't: one analyst's <code>SELECT country, sum(total) FROM orders GROUP BY 1</code> over 400M rows reads every page of the table, evicts your hot data from shared_buffers and spikes p99 for checkout. That's the moment you get a warehouse.</p>`,
        he: `<p><strong>OLTP</strong> (Postgres, MySQL, DynamoDB) משרת את המוצר: אלפי טרנזקציות קטנות בשנייה, כל אחת נוגעת בכמה שורות לפי מפתח — "תכניס הזמנה", "תעדכן יתרה". יעד latency: מילישניות בודדות. <strong>OLAP</strong> משרת אנליסטים, dashboards ו-ML: מעט queries, כל אחד סורק מיליוני עד מיליארדי שורות ועושה אגרגציה — "הכנסות לפי מדינה לפי שבוע ב-3 שנים". יעד latency: שניות.</p>
<table><tr><th></th><th>OLTP</th><th>OLAP</th></tr>
<tr><td>צורת query</td><td>שליפה לפי מפתח, כתיבות קטנות</td><td>סריקות גדולות, GROUP BY, joins</td></tr>
<tr><td>שורות שנוגעים בהן</td><td>1-100</td><td>מיליונים עד 100 מיליארד</td></tr>
<tr><td>מבנה אחסון</td><td>לפי שורות + B-tree</td><td>לפי עמודות, דחוס</td></tr>
<tr><td>כתיבות</td><td>שורה בודדת, טרנזקציונית</td><td>Batch / append, טעינות גדולות</td></tr>
<tr><td>דוגמאות</td><td>Postgres, MySQL, Aurora</td><td>ClickHouse, BigQuery, Snowflake, Redshift</td></tr></table>
<p>להריץ אנליטיקה על ה-Postgres של פרודקשן עובד עד שזה לא: <code>SELECT country, sum(total) FROM orders GROUP BY 1</code> של אנליסט אחד על 400M שורות קורא כל page בטבלה, מעיף את ה-data החם מ-shared_buffers ומקפיץ את ה-p99 של ה-checkout. זה הרגע שבו מביאים warehouse.</p>`
      }
    },
    {
      h: { en: "Why columns make SUM over 1B rows fast", he: "למה עמודות הופכות SUM על מיליארד שורות למהיר" },
      body: {
        en: `<p>Take a 1B-row <code>events</code> table with 40 columns, ~200 bytes per row = ~200 GB. <code>SELECT sum(amount) FROM events WHERE ts &gt;= '2025-01-01'</code> touches 2 columns.</p>
<ul><li><strong>Read only what you need</strong>: a row store reads all 200 GB; a column store reads <code>amount</code> (8 B × 1B = 8 GB) + <code>ts</code> (8 GB). Already 12× less I/O.</li>
<li><strong>Compression</strong>: values in one column are the same type and often similar — sorted timestamps delta-encode to a byte or two, a <code>country</code> column with 200 distinct values dictionary-encodes to 1 byte, run-length encoding collapses repeats. 5-10× compression is typical, so 16 GB becomes ~2-3 GB on disk.</li>
<li><strong>Skipping</strong>: each block keeps min/max stats (zone maps). Blocks whose <code>ts</code> max is before 2025 are never read.</li>
<li><strong>Vectorized execution</strong>: instead of interpreting one row at a time, the engine processes batches of thousands of values in tight loops that use SIMD instructions (AVX2 sums 4-8 values per instruction) and stay in CPU cache.</li>
<li><strong>Parallelism</strong>: the column is split across cores and nodes (MPP); each sums its slice, then partial sums are merged.</li></ul>
<p>The flip side: updating or deleting a single row is expensive (it lives in 40 separate compressed files), and <code>SELECT *</code> throws away the main advantage.</p>
<blockquote>💡 Real world: a single ClickHouse node routinely scans 1-2 billion rows per second for simple aggregations. The same query on a well-tuned Postgres takes minutes.</blockquote>`,
        he: `<p>ניקח טבלת <code>events</code> עם מיליארד שורות ו-40 עמודות, בערך 200 בייט לשורה = בערך 200 GB. <code>SELECT sum(amount) FROM events WHERE ts &gt;= '2025-01-01'</code> נוגע ב-2 עמודות.</p>
<ul><li><strong>קוראים רק מה שצריך</strong>: row store קורא את כל ה-200 GB; column store קורא את <code>amount</code> (8 בייט × מיליארד = 8 GB) ועוד <code>ts</code> (8 GB). כבר פי 12 פחות I/O.</li>
<li><strong>דחיסה</strong>: ערכים באותה עמודה הם מאותו טיפוס ולרוב דומים — timestamps ממוינים עוברים delta encoding לבייט-שניים, עמודת <code>country</code> עם 200 ערכים שונים עוברת dictionary encoding לבייט אחד, ו-run-length encoding מכווץ חזרות. דחיסה פי 5-10 היא שגרה, אז 16 GB הופכים ל-2-3 GB בדיסק.</li>
<li><strong>דילוג</strong>: כל בלוק שומר סטטיסטיקות min/max (zone maps). בלוקים שה-max של <code>ts</code> בהם לפני 2025 לא נקראים בכלל.</li>
<li><strong>Vectorized execution</strong>: במקום לפרש שורה אחרי שורה, המנוע מעבד batches של אלפי ערכים בלולאות הדוקות שמשתמשות ב-SIMD (AVX2 מחבר 4-8 ערכים בפקודה אחת) ונשארות ב-cache של ה-CPU.</li>
<li><strong>מקביליות</strong>: העמודה מפוצלת בין cores ו-nodes (MPP); כל אחד מסכם את החלק שלו, ואז מאחדים את הסכומים החלקיים.</li></ul>
<p>הצד השני: לעדכן או למחוק שורה בודדת זה יקר (היא יושבת ב-40 קבצים דחוסים נפרדים), ו-<code>SELECT *</code> זורק לפח את היתרון העיקרי.</p>
<blockquote>💡 מהשטח: node בודד של ClickHouse סורק באופן שגרתי 1-2 מיליארד שורות בשנייה באגרגציות פשוטות. אותו query על Postgres מכויל היטב לוקח דקות.</blockquote>`
      }
    },
    {
      h: { en: "ClickHouse: MergeTree, ORDER BY and materialized views", he: "ClickHouse: MergeTree, ORDER BY ו-materialized views" },
      body: {
        en: `<p>ClickHouse is the open-source column store you run yourself (or on ClickHouse Cloud). Its workhorse engine is <strong>MergeTree</strong>:</p>
<pre>CREATE TABLE events
(
    ts          DateTime,
    tenant_id   UInt32,
    event_type  LowCardinality(String),
    user_id     UInt64,
    amount      Decimal(12,2)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (tenant_id, event_type, ts)
TTL ts + INTERVAL 13 MONTH;</pre>
<ul><li><strong>ORDER BY</strong> is the most important decision: data on disk is sorted by it, and ClickHouse keeps a <em>sparse</em> primary index — one entry per granule of 8,192 rows. A query filtering on <code>tenant_id = 42</code> jumps straight to the right granules. Put low-cardinality, always-filtered columns first, the timestamp later.</li>
<li><strong>PARTITION BY</strong> is for data management (drop a month instantly with <code>ALTER TABLE events DROP PARTITION 202401</code>, TTL), not for speed. Too many partitions (e.g. by day for years, or by user) hurts.</li>
<li>Every INSERT creates an immutable <strong>part</strong>; background merges combine parts. Insert in batches (10k-1M rows, roughly one insert per second) or enable <code>async_insert=1</code>. Thousands of tiny inserts per second give you the famous <code>Too many parts (300)</code> error.</li>
<li><strong>Materialized views</strong> are insert triggers: every block inserted into <code>events</code> is aggregated into a target table (often <code>SummingMergeTree</code> or <code>AggregatingMergeTree</code>), so the dashboard reads 50k pre-aggregated rows instead of 5B raw ones.</li></ul>
<pre>CREATE MATERIALIZED VIEW revenue_daily_mv TO revenue_daily AS
SELECT tenant_id, toDate(ts) AS day, sum(amount) AS revenue
FROM events GROUP BY tenant_id, day;</pre>
<blockquote>⚠️ Production tip: UPDATE/DELETE in ClickHouse are "mutations" that rewrite whole parts. Model data as append-only; for upserts use <code>ReplacingMergeTree</code> (dedup happens eventually at merge time, so query with <code>FINAL</code> or <code>argMax</code> when you need exact results).</blockquote>`,
        he: `<p>ClickHouse הוא ה-column store בקוד פתוח שמריצים לבד (או ב-ClickHouse Cloud). מנוע העבודה המרכזי שלו הוא <strong>MergeTree</strong>:</p>
<pre>CREATE TABLE events
(
    ts          DateTime,
    tenant_id   UInt32,
    event_type  LowCardinality(String),
    user_id     UInt64,
    amount      Decimal(12,2)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (tenant_id, event_type, ts)
TTL ts + INTERVAL 13 MONTH;</pre>
<ul><li><strong>ORDER BY</strong> היא ההחלטה הכי חשובה: ה-data בדיסק ממוין לפיה, ו-ClickHouse מחזיק primary index <em>דליל</em> — כניסה אחת לכל granule של 8,192 שורות. query שמסנן על <code>tenant_id = 42</code> קופץ ישר ל-granules הנכונים. שים קודם עמודות עם cardinality נמוך שתמיד מסננים עליהן, ואת ה-timestamp בסוף.</li>
<li><strong>PARTITION BY</strong> נועד לניהול data (מוחקים חודש ברגע עם <code>ALTER TABLE events DROP PARTITION 202401</code>, TTL), לא למהירות. יותר מדי partitions (למשל לפי יום לאורך שנים, או לפי משתמש) פוגע.</li>
<li>כל INSERT יוצר <strong>part</strong> שלא משתנה; merges ברקע מאחדים parts. תכניס ב-batches (10k עד מיליון שורות, בערך insert אחד בשנייה) או תפעיל <code>async_insert=1</code>. אלפי inserts זעירים בשנייה מביאים את השגיאה המפורסמת <code>Too many parts (300)</code>.</li>
<li><strong>Materialized views</strong> הם triggers על insert: כל בלוק שנכנס ל-<code>events</code> עובר אגרגציה לטבלת יעד (לרוב <code>SummingMergeTree</code> או <code>AggregatingMergeTree</code>), כך שה-dashboard קורא 50k שורות מסוכמות מראש במקום 5 מיליארד שורות גולמיות.</li></ul>
<pre>CREATE MATERIALIZED VIEW revenue_daily_mv TO revenue_daily AS
SELECT tenant_id, toDate(ts) AS day, sum(amount) AS revenue
FROM events GROUP BY tenant_id, day;</pre>
<blockquote>⚠️ טיפ לפרודקשן: UPDATE/DELETE ב-ClickHouse הם "mutations" שכותבים מחדש parts שלמים. תמדל את ה-data כ-append-only; ל-upserts השתמש ב-<code>ReplacingMergeTree</code> (ה-dedup קורה בסוף, בזמן merge, אז תשתמש ב-<code>FINAL</code> או ב-<code>argMax</code> כשצריך תוצאה מדויקת).</blockquote>`
      }
    },
    {
      h: { en: "BigQuery, Snowflake, Redshift: the managed trio", he: "BigQuery, Snowflake, Redshift: השלישייה המנוהלת" },
      body: {
        en: `<p><strong>BigQuery</strong> (GCP) is serverless: no clusters, you just query. Compute is measured in <strong>slots</strong> (virtual CPU units). Two pricing models: <em>on-demand</em> — ~$6.25 per TiB <strong>scanned</strong> (first 1 TiB/month free), or <em>capacity</em> (Editions) — you buy slots with autoscaling and pay per slot-hour. Cost control is all about bytes scanned:</p>
<pre>CREATE TABLE analytics.events
PARTITION BY DATE(ts)
CLUSTER BY tenant_id, event_type
OPTIONS (require_partition_filter = TRUE)
AS SELECT * FROM staging.events_raw;</pre>
<p>Partition pruning skips whole days; clustering (up to 4 columns) sorts data inside each partition so block pruning skips more. Always <code>bq query --dry_run</code> to see "This query will process X bytes" first.</p>
<p><strong>Snowflake</strong> separates storage (compressed micro-partitions of ~50-500 MB in S3/GCS/Azure Blob) from compute <strong>virtual warehouses</strong>. Sizes double: XS = 1 credit/hour, S = 2, M = 4, L = 8 … 6XL = 512. Billed per second (60 s minimum), with <code>AUTO_SUSPEND = 60</code>. The killer feature: give ETL, BI and data science <em>separate</em> warehouses over the same data, so a heavy dbt run never slows the CEO dashboard. Also: zero-copy clones and Time Travel.</p>
<p><strong>Redshift</strong> (AWS) started as a classic MPP cluster (leader node + compute nodes), where you choose <code>DISTKEY</code> (how rows spread across nodes — pick the join key to avoid shuffles) and <code>SORTKEY</code> (zone-map pruning). RA3 nodes separate storage into S3-backed managed storage; Redshift Serverless bills in RPU-hours. Spectrum queries Parquet in S3 directly.</p>
<blockquote>💡 Real world: rough rule of thumb — ClickHouse for real-time, user-facing analytics (sub-second dashboards on fresh events); BigQuery/Snowflake for the company warehouse where many teams run SQL; Redshift when you're deep in AWS and want it close to everything else.</blockquote>`,
        he: `<p><strong>BigQuery</strong> (GCP) הוא serverless: אין clusters, פשוט מריצים query. ה-compute נמדד ב-<strong>slots</strong> (יחידות CPU וירטואליות). שני מודלים של תמחור: <em>on-demand</em> — בערך $6.25 לכל TiB <strong>שנסרק</strong> (ה-TiB הראשון בחודש חינם), או <em>capacity</em> (Editions) — קונים slots עם autoscaling ומשלמים לפי slot-hour. שליטה בעלויות זה בעיקר שליטה בכמות הבייטים שנסרקים:</p>
<pre>CREATE TABLE analytics.events
PARTITION BY DATE(ts)
CLUSTER BY tenant_id, event_type
OPTIONS (require_partition_filter = TRUE)
AS SELECT * FROM staging.events_raw;</pre>
<p>Partition pruning מדלג על ימים שלמים; clustering (עד 4 עמודות) ממיין את ה-data בתוך כל partition כך שה-pruning מדלג על עוד בלוקים. תמיד תריץ קודם <code>bq query --dry_run</code> כדי לראות "This query will process X bytes".</p>
<p><strong>Snowflake</strong> מפריד בין storage (micro-partitions דחוסים של בערך 50-500 MB ב-S3/GCS/Azure Blob) לבין compute — <strong>virtual warehouses</strong>. הגדלים מוכפלים: XS = קרדיט אחד לשעה, S = 2, M = 4, L = 8 … 6XL = 512. החיוב לפי שנייה (מינימום 60 שניות), עם <code>AUTO_SUSPEND = 60</code>. הפיצ'ר הרוצח: נותנים ל-ETL, ל-BI ול-data science warehouses <em>נפרדים</em> מעל אותו data, כך שריצת dbt כבדה אף פעם לא מאטה את ה-dashboard של המנכ"ל. ובנוסף: zero-copy clones ו-Time Travel.</p>
<p><strong>Redshift</strong> (AWS) התחיל כ-cluster MPP קלאסי (leader node ו-compute nodes), שבו בוחרים <code>DISTKEY</code> (איך השורות מתפזרות בין ה-nodes — בחר את מפתח ה-join כדי להימנע מ-shuffle) ו-<code>SORTKEY</code> (pruning לפי zone maps). nodes מסוג RA3 מפרידים את ה-storage ל-managed storage מגובה S3; Redshift Serverless מחייב לפי RPU-hours. Spectrum מריץ queries ישירות על Parquet ב-S3.</p>
<blockquote>💡 מהשטח: כלל אצבע גס — ClickHouse לאנליטיקה real-time מול משתמשים (dashboards בפחות משנייה על events טריים); BigQuery/Snowflake ל-warehouse של החברה שבו הרבה צוותים מריצים SQL; Redshift כשאתה עמוק ב-AWS ורוצה אותו קרוב לכל השאר.</blockquote>`
      }
    },
    {
      h: { en: "ETL vs ELT, dbt and the star schema", he: "ETL מול ELT, dbt ו-star schema" },
      body: {
        en: `<p><strong>ETL</strong> (Extract → Transform → Load) transformed data on a separate server (Informatica, Spark jobs) before loading, because warehouse compute was expensive. <strong>ELT</strong> flips it: load raw data first (Fivetran/Airbyte/Debezium CDC → raw tables), then transform <em>inside</em> the warehouse with SQL, because warehouse compute is now elastic and cheap. You keep the raw data, so you can re-transform when logic changes.</p>
<p><strong>dbt</strong> is the standard for the "T": each model is a <code>SELECT</code> in a file, dbt builds the dependency DAG from <code>ref()</code>, materializes tables/views/incremental models, and runs tests (<code>unique</code>, <code>not_null</code>, <code>relationships</code>).</p>
<pre>-- models/marts/fct_orders.sql
{{ config(materialized='incremental', unique_key='order_id') }}
select o.order_id, o.customer_id, d.date_key, o.total_usd
from {{ ref('stg_orders') }} o
join {{ ref('dim_date') }} d on d.date = o.created_at::date
{% if is_incremental() %}
where o.updated_at &gt; (select max(updated_at) from {{ this }})
{% endif %}</pre>
<p>The classic modeling pattern is the <strong>star schema</strong>: a central <em>fact</em> table of events/measures (<code>fct_orders</code>: one row per order, numeric measures, foreign keys) surrounded by <em>dimension</em> tables of descriptive attributes (<code>dim_customer</code>, <code>dim_product</code>, <code>dim_date</code>). Analysts join fact → dimensions and GROUP BY attributes. Columnar engines also love wide, denormalized "one big table" models, which avoid joins entirely.</p>`,
        he: `<p><strong>ETL</strong> (Extract ← Transform ← Load) עשה את הטרנספורמציה בשרת נפרד (Informatica, jobs של Spark) לפני הטעינה, כי compute ב-warehouse היה יקר. <strong>ELT</strong> הופך את הסדר: טוענים קודם data גולמי (Fivetran/Airbyte/CDC עם Debezium ← טבלאות raw), ואז עושים טרנספורמציה <em>בתוך</em> ה-warehouse עם SQL, כי היום ה-compute שם אלסטי וזול. ה-data הגולמי נשמר, אז אפשר להריץ את הטרנספורמציה מחדש כשהלוגיקה משתנה.</p>
<p><strong>dbt</strong> הוא הסטנדרט ל-"T": כל model הוא <code>SELECT</code> בקובץ, dbt בונה את ה-DAG של התלויות מתוך <code>ref()</code>, יוצר טבלאות/views/incremental models, ומריץ טסטים (<code>unique</code>, <code>not_null</code>, <code>relationships</code>).</p>
<pre>-- models/marts/fct_orders.sql
{{ config(materialized='incremental', unique_key='order_id') }}
select o.order_id, o.customer_id, d.date_key, o.total_usd
from {{ ref('stg_orders') }} o
join {{ ref('dim_date') }} d on d.date = o.created_at::date
{% if is_incremental() %}
where o.updated_at &gt; (select max(updated_at) from {{ this }})
{% endif %}</pre>
<p>דפוס המידול הקלאסי הוא <strong>star schema</strong>: טבלת <em>fact</em> מרכזית של אירועים ומדדים (<code>fct_orders</code>: שורה להזמנה, מדדים מספריים, foreign keys) ומסביבה טבלאות <em>dimension</em> עם מאפיינים תיאוריים (<code>dim_customer</code>, <code>dim_product</code>, <code>dim_date</code>). אנליסטים עושים join מה-fact ל-dimensions ו-GROUP BY על המאפיינים. מנועים עמודתיים גם אוהבים מודלים רחבים ו-denormalized של "one big table", שחוסכים joins לגמרי.</p>`
      }
    },
    {
      h: { en: "Cost gotchas that hit real bills", he: "מלכודות עלות שפוגעות בחשבונות אמיתיים" },
      body: {
        en: `<ul><li><strong><code>SELECT *</code> on BigQuery</strong>: you pay for every column of every scanned partition. On a 50 TiB table that's ~$312 per run — and <strong><code>LIMIT 10</code> does not reduce bytes scanned</strong>. Use the table preview, select named columns, filter on the partition column.</li>
<li><strong>A dashboard refreshing every minute</strong> with an on-demand query scanning 200 GB = 288 TB/day ≈ $1,750/day. Pre-aggregate (materialized views, dbt marts) or use BI Engine / result caching.</li>
<li><strong>Snowflake warehouses that never suspend</strong>: a Large (8 credits/h) running 24/7 at ~$3/credit ≈ $17,500/month. Set <code>AUTO_SUSPEND</code> and resource monitors.</li>
<li><strong>Functions on the partition column</strong> (<code>WHERE FORMAT_DATE('%Y', ts) = '2025'</code>) can defeat pruning. Filter on the raw column with a range.</li></ul>
<pre>-- BigQuery guardrail: fail the query instead of billing a surprise
bq query --use_legacy_sql=false --maximum_bytes_billed=100000000000 'SELECT ...'</pre>
<blockquote>⚠️ Production tip: set per-user/per-project custom quotas in BigQuery (e.g. 10 TiB/day) and a billing alert on day one. The classic incident is a Looker explore or a scheduled notebook doing full scans every few minutes over a weekend.</blockquote>`,
        he: `<ul><li><strong><code>SELECT *</code> ב-BigQuery</strong>: משלמים על כל עמודה בכל partition שנסרק. על טבלה של 50 TiB זה בערך $312 לריצה — ו-<strong><code>LIMIT 10</code> לא מקטין את כמות הבייטים שנסרקים</strong>. תשתמש ב-preview של הטבלה, תבחר עמודות בשמן, ותסנן על עמודת ה-partition.</li>
<li><strong>Dashboard שמתרענן כל דקה</strong> עם query on-demand שסורק 200 GB = ‏288 TB ביום ≈ $1,750 ביום. תעשה pre-aggregation (materialized views, marts של dbt) או תשתמש ב-BI Engine / ב-cache של תוצאות.</li>
<li><strong>Warehouses ב-Snowflake שאף פעם לא נכבים</strong>: Large (‏8 קרדיטים לשעה) שרץ 24/7 בערך ב-$3 לקרדיט ≈ $17,500 בחודש. תגדיר <code>AUTO_SUSPEND</code> ו-resource monitors.</li>
<li><strong>פונקציות על עמודת ה-partition</strong> (<code>WHERE FORMAT_DATE('%Y', ts) = '2025'</code>) יכולות לבטל את ה-pruning. תסנן על העמודה עצמה עם טווח.</li></ul>
<pre>-- BigQuery guardrail: fail the query instead of billing a surprise
bq query --use_legacy_sql=false --maximum_bytes_billed=100000000000 'SELECT ...'</pre>
<blockquote>⚠️ טיפ לפרודקשן: תגדיר custom quotas לכל משתמש/פרויקט ב-BigQuery (למשל 10 TiB ביום) ו-billing alert כבר ביום הראשון. התקלה הקלאסית היא explore של Looker או notebook מתוזמן שעושה full scan כל כמה דקות לאורך סוף שבוע.</blockquote>`
      }
    }
  ],
  diagram: `ROW STORE (OLTP)                     COLUMN STORE (OLAP)
 page1: [id|ts|user|amount|...40]     ts.bin     [t1 t2 t3 t4 ...]  delta-encoded
 page2: [id|ts|user|amount|...40]     amount.bin [9.9 12 9.9 ...]   compressed
 SUM(amount) -> read ALL pages        user.bin   (not read)
                                      SUM(amount) -> read 1-2 files, skip blocks by min/max

  Postgres/MySQL --CDC/ELT--> raw tables --dbt--> stg_* --> fct_orders + dim_* --> BI dashboards`,
  handsOn: [
    { cmd: "clickhouse-client -q \"SELECT table, count() parts, formatReadableSize(sum(data_compressed_bytes)) c, formatReadableSize(sum(data_uncompressed_bytes)) u FROM system.parts WHERE active GROUP BY table\"", what: { en: "ClickHouse: see active parts per table and the real compression ratio.", he: "ClickHouse: רואים כמה parts פעילים יש לכל טבלה ומה יחס הדחיסה האמיתי." } },
    { cmd: "clickhouse-client -q \"EXPLAIN indexes = 1 SELECT count() FROM events WHERE tenant_id = 42\"", what: { en: "Check how many granules the primary index lets ClickHouse skip.", he: "בודקים על כמה granules ה-primary index נותן ל-ClickHouse לדלג." } },
    { cmd: "bq query --dry_run --use_legacy_sql=false 'SELECT tenant_id, SUM(amount) FROM analytics.events WHERE DATE(ts) = \"2025-11-01\" GROUP BY 1'", what: { en: "BigQuery: see bytes to be processed before paying — compare with and without the partition filter.", he: "BigQuery: רואים כמה בייטים ייסרקו לפני שמשלמים — השווה עם ובלי סינון על ה-partition." } },
    { cmd: "dbt build --select +fct_orders", what: { en: "dbt: build and test fct_orders and everything upstream of it.", he: "dbt: בונים ובודקים את fct_orders וכל מה שמעליו ב-DAG." } }
  ],
  mnemonic: {
    en: "\"Rows for one, columns for all.\" And the BigQuery rule: \"LIMIT limits rows, not the bill.\"",
    he: "\"שורות בשביל אחד, עמודות בשביל כולם.\" והכלל של BigQuery: \"LIMIT מגביל שורות, לא את החשבון.\""
  },
  pitfalls: [
    { en: "Running heavy analytics on the production OLTP primary (or even a replica that is also a failover target) — it evicts hot pages and can create replication lag.", he: "להריץ אנליטיקה כבדה על ה-primary של ה-OLTP בפרודקשן (או אפילו על replica שהוא גם יעד ל-failover) — זה מעיף pages חמים ויכול לייצר replication lag." },
    { en: "Choosing a ClickHouse ORDER BY that doesn't match the filters (e.g. timestamp first when every query filters by tenant) — the sparse index can't skip anything.", he: "לבחור ORDER BY ב-ClickHouse שלא תואם את הסינונים (למשל timestamp ראשון כשכל query מסנן לפי tenant) — ה-sparse index לא יכול לדלג על כלום." },
    { en: "Streaming single-row inserts into ClickHouse — leads to 'Too many parts' and merge storms. Batch or use async inserts / a Kafka engine table.", he: "להזרים inserts של שורה בודדת ל-ClickHouse — מוביל ל-'Too many parts' ולסערת merges. תעבוד ב-batches או עם async inserts / טבלת Kafka engine." },
    { en: "Assuming LIMIT or a WHERE on a non-partition column makes a BigQuery query cheap — billing is by bytes in the columns and partitions scanned.", he: "להניח ש-LIMIT או WHERE על עמודה שאינה ה-partition הופכים query ב-BigQuery לזול — החיוב הוא לפי הבייטים בעמודות וב-partitions שנסרקו." }
  ],
  interview: [
    {
      q: { en: "Why is a column store faster than a row store for analytics, and when is it worse?", he: "למה column store מהיר יותר מ-row store לאנליטיקה, ומתי הוא גרוע יותר?" },
      a: {
        en: "It reads only referenced columns, compresses them 5-10× because values are homogeneous, skips blocks via min/max stats, and processes values in vectorized SIMD batches across many cores. It's worse for point lookups of whole rows, frequent single-row updates/deletes, and high-rate small transactional writes — every row is spread across many column files.",
        he: "הוא קורא רק את העמודות שמופיעות ב-query, דוחס אותן פי 5-10 כי הערכים הומוגניים, מדלג על בלוקים לפי סטטיסטיקות min/max, ומעבד ערכים ב-batches וקטוריים עם SIMD על הרבה cores. הוא גרוע יותר בשליפה של שורות שלמות לפי מפתח, בעדכונים/מחיקות תכופים של שורה בודדת ובקצב גבוה של כתיבות טרנזקציוניות קטנות — כל שורה מפוזרת על פני הרבה קבצי עמודות."
      }
    },
    {
      q: { en: "A BigQuery bill tripled this month. How do you investigate and prevent it?", he: "החשבון של BigQuery שולש החודש. איך אתה חוקר ומונע את זה?" },
      a: {
        en: "Query INFORMATION_SCHEMA.JOBS_BY_PROJECT ordered by total_bytes_billed to find the top queries/users/service accounts (often a scheduled query or dashboard). Fix with partition + cluster, require_partition_filter, selecting only needed columns, pre-aggregated tables/materialized views. Prevent with maximum_bytes_billed, per-user custom quotas, billing alerts, or move steady workloads to capacity (slot) pricing.",
        he: "מריצים query על INFORMATION_SCHEMA.JOBS_BY_PROJECT ממוין לפי total_bytes_billed כדי למצוא את ה-queries/משתמשים/service accounts המובילים (הרבה פעמים scheduled query או dashboard). מתקנים עם partition ו-cluster, require_partition_filter, בחירה רק של העמודות הנחוצות, וטבלאות מסוכמות/materialized views. מונעים עם maximum_bytes_billed, custom quotas לכל משתמש, billing alerts, או מעבר של עומסים קבועים לתמחור capacity (slots)."
      }
    }
  ],
  quiz: [
    {
      q: { en: "SELECT sum(amount) FROM events over 1B rows and 40 columns. Why is a column store dramatically faster?", he: "SELECT sum(amount) FROM events על מיליארד שורות ו-40 עמודות. למה column store מהיר משמעותית?" },
      options: [
        { en: "It caches every query result in RAM", he: "הוא שומר כל תוצאת query ב-RAM" },
        { en: "It reads only the amount column, compressed, and sums it in vectorized batches", he: "הוא קורא רק את עמודת amount, דחוסה, ומסכם אותה ב-batches וקטוריים" },
        { en: "It uses a B-tree index on amount", he: "הוא משתמש ב-B-tree index על amount" },
        { en: "It skips transactions and locking", he: "הוא מדלג על טרנזקציות ונעילות" }
      ],
      answer: 1,
      explain: { en: "Reading 1 of 40 columns plus 5-10× compression cuts I/O by orders of magnitude, and SIMD over batches keeps the CPU efficient.", he: "קריאה של עמודה אחת מתוך 40 יחד עם דחיסה פי 5-10 חותכת את ה-I/O בסדרי גודל, ו-SIMD על batches שומר את ה-CPU יעיל." }
    },
    {
      q: { en: "On BigQuery on-demand, what happens to cost when you add LIMIT 10 to SELECT * FROM a 5 TiB table?", he: "ב-BigQuery on-demand, מה קורה לעלות כשמוסיפים LIMIT 10 ל-SELECT * על טבלה של 5 TiB?" },
      options: [
        { en: "It drops to almost zero", he: "היא יורדת כמעט לאפס" },
        { en: "It drops by half", he: "היא יורדת בחצי" },
        { en: "Nothing — you're still billed for all bytes in the scanned columns", he: "כלום — עדיין משלמים על כל הבייטים בעמודות שנסרקו" },
        { en: "It's free because results are cached", he: "זה חינם כי התוצאות ב-cache" }
      ],
      answer: 2,
      explain: { en: "Billing is by bytes read from the columns and partitions referenced. LIMIT is applied after the scan. Select fewer columns and filter on the partition column.", he: "החיוב הוא לפי הבייטים שנקראים מהעמודות וה-partitions שמופיעים ב-query. LIMIT מופעל אחרי הסריקה. תבחר פחות עמודות ותסנן על עמודת ה-partition." }
    },
    {
      q: { en: "In ClickHouse MergeTree, what does ORDER BY (tenant_id, ts) primarily control?", he: "ב-MergeTree של ClickHouse, על מה ORDER BY (tenant_id, ts) שולט בעיקר?" },
      options: [
        { en: "A uniqueness constraint on (tenant_id, ts)", he: "אילוץ ייחודיות על (tenant_id, ts)" },
        { en: "The physical sort order on disk and the sparse primary index used to skip granules", he: "סדר המיון הפיזי בדיסק וה-sparse primary index שמשמש לדילוג על granules" },
        { en: "How data is split into partitions for TTL", he: "איך ה-data מתחלק ל-partitions בשביל TTL" },
        { en: "The default order of query results", he: "סדר ברירת המחדל של תוצאות query" }
      ],
      answer: 1,
      explain: { en: "MergeTree has no uniqueness. ORDER BY sorts parts on disk and builds a sparse index (one mark per 8,192 rows), so filters on leading key columns skip most data. PARTITION BY is separate.", he: "ב-MergeTree אין ייחודיות. ORDER BY ממיין את ה-parts בדיסק ובונה sparse index (סימון אחד לכל 8,192 שורות), כך שסינון על עמודות המפתח הראשונות מדלג על רוב ה-data. PARTITION BY זה דבר נפרד." }
    },
    {
      q: { en: "What is Snowflake's main architectural advantage for a company where ETL and BI fight over resources?", he: "מה היתרון הארכיטקטוני המרכזי של Snowflake לחברה שבה ה-ETL וה-BI נלחמים על משאבים?" },
      options: [
        { en: "It stores data in rows for faster joins", he: "הוא שומר data בשורות בשביל joins מהירים יותר" },
        { en: "Separate virtual warehouses (compute) can run over the same shared storage without affecting each other", he: "Virtual warehouses נפרדים (compute) יכולים לרוץ מעל אותו storage משותף בלי להשפיע אחד על השני" },
        { en: "It has no per-second billing", he: "אין בו חיוב לפי שנייה" },
        { en: "It requires choosing a DISTKEY per table", he: "הוא מחייב לבחור DISTKEY לכל טבלה" }
      ],
      answer: 1,
      explain: { en: "Storage and compute are decoupled: give ETL an L warehouse and BI an S warehouse over the same tables; each scales and suspends independently.", he: "Storage ו-compute מופרדים: נותנים ל-ETL warehouse בגודל L ול-BI warehouse בגודל S מעל אותן טבלאות; כל אחד עושה scale ונכבה באופן עצמאי." }
    }
  ],
  related: ["pr-big-data", "pr-db-landscape", "pr-data-modeling", "db-indexes"]
});

/* ------------------------------------------------------------------ 25 */
INFRA.lessons.push({
  id: "db-wide-column-kv",
  track: "data",
  order: 25,
  icon: "🗝️",
  level: 3,
  minutes: 15,
  title: { en: "DynamoDB & Cassandra in Practice", he: "DynamoDB ו-Cassandra בפרקטיקה" },
  tldr: {
    en: "In DynamoDB and Cassandra the partition key decides which machine serves a request, so you design keys around your access patterns before writing any code — get it right and you scale linearly; get it wrong and one hot key throttles the whole table.",
    he: "ב-DynamoDB וב-Cassandra ה-partition key קובע איזו מכונה משרתת בקשה, אז מתכננים את המפתחות סביב ה-access patterns לפני שכותבים שורת קוד — אם תעשה את זה נכון, תקבל scale ליניארי; אם תטעה, מפתח חם אחד יעשה throttle לכל הטבלה."
  },
  analogy: {
    en: "Think of a huge post office with hundreds of sorting windows. The partition key is the ZIP code: it decides which window handles your letter, and each window has a fixed speed. If every letter in the country is addressed to the same ZIP code, one clerk drowns while 299 sit idle — no matter how many windows you open.",
    he: "תחשוב על סניף דואר ענק עם מאות אשנבים. ה-partition key הוא המיקוד: הוא קובע איזה אשנב מטפל במכתב, ולכל אשנב יש קצב קבוע. אם כל המכתבים בארץ ממוענים לאותו מיקוד, פקיד אחד טובע ו-299 יושבים בטל — לא משנה כמה אשנבים תפתח."
  },
  sections: [
    {
      h: { en: "Partition key + sort key: the only index you get for free", he: "Partition key ו-sort key: ה-index היחיד שמקבלים בחינם" },
      body: {
        en: `<p>Both systems hash the <strong>partition key</strong> to place data on a partition/node. Inside a partition, items are stored sorted by the <strong>sort key</strong> (DynamoDB) / <strong>clustering columns</strong> (Cassandra). That gives you exactly two efficient operations:</p>
<ul><li><strong>Get by full key</strong>: <code>PK = 'USER#42' AND SK = 'PROFILE'</code> — O(1), single-digit ms.</li>
<li><strong>Range query inside one partition</strong>: <code>PK = 'USER#42' AND SK BETWEEN 'ORDER#2025-01' AND 'ORDER#2025-12'</code> — sorted, paginated (DynamoDB returns max 1 MB per page).</li></ul>
<p>Anything else — filter by a non-key attribute, query across partitions — is a <strong>Scan</strong> (reads the whole table, pays for every byte) or needs a secondary index. A <code>FilterExpression</code> in DynamoDB is applied <em>after</em> reading, so you still pay RCUs for the items it discards.</p>
<p>Hard limits worth memorizing (DynamoDB): item size 400 KB; a physical partition serves up to <strong>3,000 RCU and 1,000 WCU</strong> per second and holds ~10 GB. Cassandra: keep partitions under ~100 MB and ~100k rows, or reads, compaction and repair suffer.</p>`,
        he: `<p>שתי המערכות מפעילות hash על ה-<strong>partition key</strong> כדי להחליט על איזה partition/node ה-data יושב. בתוך partition, ה-items שמורים ממוינים לפי ה-<strong>sort key</strong> (DynamoDB) / ה-<strong>clustering columns</strong> (Cassandra). זה נותן בדיוק שתי פעולות יעילות:</p>
<ul><li><strong>שליפה לפי מפתח מלא</strong>: <code>PK = 'USER#42' AND SK = 'PROFILE'</code> — O(1), מילישניות בודדות.</li>
<li><strong>Range query בתוך partition אחד</strong>: <code>PK = 'USER#42' AND SK BETWEEN 'ORDER#2025-01' AND 'ORDER#2025-12'</code> — ממוין, עם pagination (DynamoDB מחזיר לכל היותר 1 MB לעמוד).</li></ul>
<p>כל דבר אחר — סינון לפי attribute שאינו מפתח, query על פני partitions — הוא <strong>Scan</strong> (קורא את כל הטבלה ומשלם על כל בייט) או דורש secondary index. <code>FilterExpression</code> ב-DynamoDB מופעל <em>אחרי</em> הקריאה, אז אתה עדיין משלם RCUs על ה-items שהוא זורק.</p>
<p>מגבלות קשיחות ששווה לזכור (DynamoDB): גודל item עד 400 KB; partition פיזי משרת עד <strong>3,000 RCU ו-1,000 WCU</strong> בשנייה ומחזיק בערך 10 GB. Cassandra: תשמור partitions מתחת ל-100 MB ובערך 100k שורות, אחרת הקריאות, ה-compaction וה-repair סובלים.</p>`
      }
    },
    {
      h: { en: "Access-pattern-first modeling & single-table design", he: "מידול לפי access patterns ו-single-table design" },
      body: {
        en: `<p>In SQL you normalize and figure out queries later. Here it's reversed: <strong>list every access pattern first</strong>, with its frequency, then design keys so each pattern is one Query.</p>
<pre>Access patterns (e-commerce):
 1. Get customer profile              PK=CUST#c1        SK=PROFILE
 2. List customer's orders, newest    PK=CUST#c1        SK begins_with ORDER#   (ScanIndexForward=false)
 3. Get order + its line items        PK=ORDER#o9       SK begins_with (ITEM# | META)
 4. Orders by status (ops dashboard)  GSI1PK=STATUS#PENDING#&lt;shard&gt;  GSI1SK=2025-11-14T10:00Z</pre>
<p><strong>Single-table design</strong> puts all entity types in one table with generic <code>PK</code>/<code>SK</code> attributes and type prefixes, so related items share a partition and one Query returns a customer and their recent orders ("pre-joined"). Pros: fewer round trips, one table to provision and monitor. Cons: harder to read, harder to evolve when new access patterns appear, analytics need an export (S3 export / Streams to a warehouse). Many teams use a few tables per bounded context instead — it's a tool, not a religion.</p>
<p>Cassandra's version is "one table per query": you deliberately duplicate data into <code>orders_by_customer</code> and <code>orders_by_status</code> and write to both (often with a logged <code>BATCH</code> for atomicity across tables).</p>`,
        he: `<p>ב-SQL עושים נרמול ומבינים את ה-queries אחר כך. כאן זה הפוך: <strong>קודם רושמים כל access pattern</strong>, עם התדירות שלו, ואז מתכננים מפתחות כך שכל pattern הוא Query אחד.</p>
<pre>Access patterns (e-commerce):
 1. Get customer profile              PK=CUST#c1        SK=PROFILE
 2. List customer's orders, newest    PK=CUST#c1        SK begins_with ORDER#   (ScanIndexForward=false)
 3. Get order + its line items        PK=ORDER#o9       SK begins_with (ITEM# | META)
 4. Orders by status (ops dashboard)  GSI1PK=STATUS#PENDING#&lt;shard&gt;  GSI1SK=2025-11-14T10:00Z</pre>
<p><strong>Single-table design</strong> שם את כל סוגי הישויות בטבלה אחת עם attributes גנריים <code>PK</code>/<code>SK</code> ו-prefixes לפי סוג, כך שישויות קשורות חולקות partition ו-Query אחד מחזיר לקוח ואת ההזמנות האחרונות שלו ("pre-joined"). יתרונות: פחות round trips, טבלה אחת לעשות לה provisioning ומוניטורינג. חסרונות: קשה יותר לקריאה, קשה יותר להתפתח כשמופיעים access patterns חדשים, ואנליטיקה דורשת export (S3 export / Streams ל-warehouse). הרבה צוותים מעדיפים כמה טבלאות לכל bounded context — זה כלי, לא דת.</p>
<p>הגרסה של Cassandra היא "טבלה לכל query": משכפלים data בכוונה ל-<code>orders_by_customer</code> ול-<code>orders_by_status</code> וכותבים לשתיהן (לרוב עם <code>BATCH</code> מסוג logged בשביל אטומיות בין הטבלאות).</p>`
      }
    },
    {
      h: { en: "Capacity math, hot partitions, GSIs/LSIs and Streams", he: "חישובי capacity, hot partitions, GSIs/LSIs ו-Streams" },
      body: {
        en: `<p><strong>RCU/WCU</strong>: 1 WCU = one write/s of up to 1 KB. 1 RCU = one strongly consistent read/s of up to 4 KB, or two eventually consistent reads. Transactional reads/writes cost 2×. Sizes round up.</p>
<pre>500 writes/s of 2.5 KB items      -&gt; 500 x ceil(2.5/1) = 1,500 WCU
2,000 eventually-consistent reads/s of 6 KB -&gt; 2,000 x ceil(6/4) / 2 = 2,000 RCU
On-demand (us-east-1, ~$0.625 per million WRU / ~$0.125 per million RRU):
  1,500 WRU/s x 2.6M s/month = 3.9B WRU -&gt; ~$2,440/month for writes
Provisioned at ~$0.00065 per WCU-hour: 1,500 x 730 h -&gt; ~$712/month (before autoscaling headroom)</pre>
<p>Rule of thumb: on-demand for spiky/unknown traffic and new tables; provisioned + autoscaling (target 70%) for steady load — it's typically several times cheaper at constant utilization.</p>
<p><strong>Hot partitions</strong>: table-level capacity is spread across partitions, but one key can never exceed 3,000 RCU / 1,000 WCU. <strong>Adaptive capacity</strong> instantly lends unused capacity to hot partitions and can isolate a hot item onto its own partition ("split for heat") — but a <em>single</em> item key that needs 5,000 writes/s still throttles. Fix with <strong>write sharding</strong>: <code>PK = 'COUNTER#likes#' + random(0..9)</code>, then sum the 10 on read. Use <strong>CloudWatch Contributor Insights</strong> to find the top keys.</p>
<p><strong>Secondary indexes</strong>:</p>
<ul><li><strong>GSI</strong> — any partition/sort key, created anytime, eventually consistent only, own capacity (20 per table by default). If a GSI throttles, <em>writes to the base table throttle too</em> (back-pressure). A low-cardinality GSI key (e.g. <code>status</code>) is a hot partition waiting to happen.</li>
<li><strong>LSI</strong> — same partition key, different sort key, must be defined at table creation, supports strong reads, max 5, and caps each item collection at 10 GB.</li></ul>
<p><strong>DynamoDB Streams</strong>: an ordered (per item) change log kept 24 hours — trigger Lambda for outbox/event publishing, maintain aggregates, replicate to OpenSearch, or feed Global Tables.</p>`,
        he: `<p><strong>RCU/WCU</strong>: ‏1 WCU = כתיבה אחת בשנייה של עד 1 KB. ‏1 RCU = קריאה strongly consistent אחת בשנייה של עד 4 KB, או שתי קריאות eventually consistent. קריאות/כתיבות טרנזקציוניות עולות פי 2. הגדלים מעוגלים כלפי מעלה.</p>
<pre>500 writes/s of 2.5 KB items      -&gt; 500 x ceil(2.5/1) = 1,500 WCU
2,000 eventually-consistent reads/s of 6 KB -&gt; 2,000 x ceil(6/4) / 2 = 2,000 RCU
On-demand (us-east-1, ~$0.625 per million WRU / ~$0.125 per million RRU):
  1,500 WRU/s x 2.6M s/month = 3.9B WRU -&gt; ~$2,440/month for writes
Provisioned at ~$0.00065 per WCU-hour: 1,500 x 730 h -&gt; ~$712/month (before autoscaling headroom)</pre>
<p>כלל אצבע: on-demand לתעבורה קופצנית/לא ידועה ולטבלאות חדשות; provisioned עם autoscaling (יעד 70%) לעומס יציב — בניצולת קבועה זה בדרך כלל זול פי כמה.</p>
<p><strong>Hot partitions</strong>: ה-capacity ברמת הטבלה מתחלק בין ה-partitions, אבל מפתח אחד אף פעם לא יעבור 3,000 RCU / 1,000 WCU. <strong>Adaptive capacity</strong> מלווה מיד capacity לא מנוצל ל-partitions חמים ויכול לבודד item חם ל-partition משלו ("split for heat") — אבל מפתח של item <em>בודד</em> שצריך 5,000 כתיבות בשנייה עדיין יקבל throttle. הפתרון הוא <strong>write sharding</strong>: <code>PK = 'COUNTER#likes#' + random(0..9)</code>, ובקריאה מסכמים את ה-10. השתמש ב-<strong>CloudWatch Contributor Insights</strong> כדי למצוא את המפתחות המובילים.</p>
<p><strong>Secondary indexes</strong>:</p>
<ul><li><strong>GSI</strong> — כל partition/sort key שתרצה, אפשר ליצור בכל זמן, רק eventually consistent, עם capacity משלו (20 לטבלה כברירת מחדל). אם GSI מקבל throttle, <em>גם הכתיבות לטבלת הבסיס מקבלות throttle</em> (back-pressure). מפתח GSI עם cardinality נמוך (למשל <code>status</code>) הוא hot partition שמחכה לקרות.</li>
<li><strong>LSI</strong> — אותו partition key, sort key אחר, חייב להיות מוגדר ביצירת הטבלה, תומך בקריאות strong, מקסימום 5, ומגביל כל item collection ל-10 GB.</li></ul>
<p><strong>DynamoDB Streams</strong>: change log מסודר (לכל item) שנשמר 24 שעות — מפעילים Lambda בשביל outbox/פרסום events, תחזוקת אגרגציות, שכפול ל-OpenSearch, או בשביל Global Tables.</p>`
      }
    },
    {
      h: { en: "Cassandra: the ring, replication and consistency levels", he: "Cassandra: ה-ring, replication ו-consistency levels" },
      body: {
        en: `<p>Cassandra is masterless: every node is equal, placed on a <strong>token ring</strong> via consistent hashing (with vnodes — <code>num_tokens: 16</code> by default in 4.x). A partition key hashes (Murmur3) to a token; the next <strong>RF</strong> nodes clockwise (respecting racks/DCs with <code>NetworkTopologyStrategy</code>) hold replicas. Any node can be the <strong>coordinator</strong> for a request.</p>
<pre>CREATE KEYSPACE shop WITH replication =
  {'class': 'NetworkTopologyStrategy', 'eu-west': 3, 'us-east': 3};</pre>
<p>Consistency is chosen <strong>per query</strong>:</p>
<table><tr><th>Level</th><th>Replicas that must answer (RF=3)</th><th>Use</th></tr>
<tr><td>ONE</td><td>1</td><td>Fast, may read stale data</td></tr>
<tr><td>QUORUM</td><td>⌊ΣRF/2⌋+1 across all DCs (4 of 6)</td><td>Strong, but pays cross-DC latency</td></tr>
<tr><td>LOCAL_QUORUM</td><td>2 of 3 in the local DC</td><td>The production default for multi-DC</td></tr>
<tr><td>ALL</td><td>3</td><td>Any one node down = failure. Avoid.</td></tr></table>
<p>The rule: if <strong>R + W &gt; N</strong>, a read is guaranteed to overlap the latest acknowledged write. With RF=3, LOCAL_QUORUM reads + LOCAL_QUORUM writes = 2 + 2 &gt; 3, and you survive one node down per DC. Write ONE + read ONE (1 + 1 ≤ 3) is eventually consistent.</p>
<p>When a replica is down, the coordinator stores <strong>hints</strong> (default <code>max_hint_window</code> 3 h) and replays them when it returns; read repair fixes divergence seen during reads. Anything else needs <strong>anti-entropy repair</strong>.</p>`,
        he: `<p>ב-Cassandra אין master: כל ה-nodes שווים, ממוקמים על <strong>token ring</strong> בעזרת consistent hashing (עם vnodes — <code>num_tokens: 16</code> כברירת מחדל ב-4.x). ה-partition key עובר hash (Murmur3) ל-token; ה-<strong>RF</strong> nodes הבאים עם כיוון השעון (תוך התחשבות ב-racks/DCs עם <code>NetworkTopologyStrategy</code>) מחזיקים את ה-replicas. כל node יכול להיות ה-<strong>coordinator</strong> של בקשה.</p>
<pre>CREATE KEYSPACE shop WITH replication =
  {'class': 'NetworkTopologyStrategy', 'eu-west': 3, 'us-east': 3};</pre>
<p>ה-consistency נבחר <strong>לכל query</strong>:</p>
<table><tr><th>Level</th><th>כמה replicas חייבים לענות (RF=3)</th><th>שימוש</th></tr>
<tr><td>ONE</td><td>1</td><td>מהיר, עלול לקרוא data ישן</td></tr>
<tr><td>QUORUM</td><td>⌊ΣRF/2⌋+1 על פני כל ה-DCs (4 מתוך 6)</td><td>חזק, אבל משלם latency בין DCs</td></tr>
<tr><td>LOCAL_QUORUM</td><td>2 מתוך 3 ב-DC המקומי</td><td>ברירת המחדל בפרודקשן ל-multi-DC</td></tr>
<tr><td>ALL</td><td>3</td><td>node אחד למטה = כישלון. להימנע.</td></tr></table>
<p>הכלל: אם <strong>R + W &gt; N</strong>, מובטח שקריאה תחפוף לכתיבה האחרונה שאושרה. עם RF=3, קריאות LOCAL_QUORUM וכתיבות LOCAL_QUORUM נותנות 2 + 2 &gt; 3, ואתה שורד node אחד למטה בכל DC. כתיבה ב-ONE וקריאה ב-ONE (‏1 + 1 ≤ 3) זה eventually consistent.</p>
<p>כש-replica למטה, ה-coordinator שומר <strong>hints</strong> (ברירת מחדל <code>max_hint_window</code> של 3 שעות) ומריץ אותם כשהוא חוזר; read repair מתקן פערים שמתגלים בזמן קריאה. כל השאר דורש <strong>anti-entropy repair</strong>.</p>`
      }
    },
    {
      h: { en: "Tombstones, gc_grace_seconds and repair", he: "Tombstones, gc_grace_seconds ו-repair" },
      body: {
        en: `<p>Cassandra's storage is an LSM tree of immutable SSTables, so a DELETE can't erase data in place — it writes a <strong>tombstone</strong> marker. Tombstones are only purged by compaction after <code>gc_grace_seconds</code> (default 864000 = <strong>10 days</strong>).</p>
<p>Why the wait? If a replica was down during the delete and missed the tombstone, and the other replicas purge it, the stale replica later "resurrects" the deleted data (<strong>zombie data</strong>). So the iron rule: <strong>run a full repair on every node within gc_grace_seconds</strong> (tools: Cassandra Reaper, or <code>nodetool repair -pr</code> on each node on a schedule).</p>
<p>Tombstone performance trap: a queue-like table (insert, process, delete) or a wide partition with frequent deletes makes reads scan thousands of tombstones. You'll see <code>Read 120 live rows and 45000 tombstone cells</code> warnings (threshold 1,000) and, past 100,000, <code>TombstoneOverwhelmingException</code> — the query fails. Also: inserting <code>null</code> columns writes tombstones; TTLs become tombstones when they expire. Fix with better modeling (time-bucketed partitions you drop whole), TWCS compaction for TTL'd time series, and never using Cassandra as a queue.</p>
<pre>$ nodetool status shop
Datacenter: eu-west
--  Address     Load      Tokens  Owns   Host ID   Rack
UN  10.0.1.11   412 GiB   16      33.4%  9f3c...   1a
UN  10.0.2.12   405 GiB   16      33.2%  1b7e...   1b
DN  10.0.3.13   398 GiB   16      33.4%  c2d1...   1c   &lt;- Down/Normal</pre>
<blockquote>⚠️ Production tip: after adding nodes, run <code>nodetool cleanup</code> on the old nodes to drop data they no longer own. Watch <code>nodetool tablehistograms</code> for partition size outliers and <code>nodetool compactionstats</code> for pending compactions — a growing backlog means disk and read latency trouble ahead.</blockquote>`,
        he: `<p>ה-storage של Cassandra הוא LSM tree של SSTables שלא משתנים, אז DELETE לא יכול למחוק data במקום — הוא כותב סימון <strong>tombstone</strong>. Tombstones נמחקים רק ב-compaction אחרי <code>gc_grace_seconds</code> (ברירת מחדל 864000 = <strong>10 ימים</strong>).</p>
<p>למה לחכות? אם replica היה למטה בזמן המחיקה ופספס את ה-tombstone, וה-replicas האחרים מוחקים אותו, ה-replica המיושן "יחיה מחדש" את ה-data שנמחק (<strong>zombie data</strong>). אז כלל הברזל: <strong>תריץ full repair על כל node בתוך gc_grace_seconds</strong> (כלים: Cassandra Reaper, או <code>nodetool repair -pr</code> על כל node לפי לו"ז).</p>
<p>מלכודת ביצועים של tombstones: טבלה שמתנהגת כמו queue (insert, עיבוד, delete) או partition רחב עם מחיקות תכופות גורמים לקריאות לסרוק אלפי tombstones. תראה אזהרות כמו <code>Read 120 live rows and 45000 tombstone cells</code> (סף של 1,000), ומעל 100,000 — <code>TombstoneOverwhelmingException</code> וה-query נכשל. בנוסף: insert של עמודות <code>null</code> כותב tombstones; TTL הופך ל-tombstone כשהוא פג. מתקנים עם מידול טוב יותר (partitions לפי חלון זמן שמוחקים בשלמותם), compaction מסוג TWCS ל-time series עם TTL, ולעולם לא משתמשים ב-Cassandra כ-queue.</p>
<pre>$ nodetool status shop
Datacenter: eu-west
--  Address     Load      Tokens  Owns   Host ID   Rack
UN  10.0.1.11   412 GiB   16      33.4%  9f3c...   1a
UN  10.0.2.12   405 GiB   16      33.2%  1b7e...   1b
DN  10.0.3.13   398 GiB   16      33.4%  c2d1...   1c   &lt;- Down/Normal</pre>
<blockquote>⚠️ טיפ לפרודקשן: אחרי שמוסיפים nodes, תריץ <code>nodetool cleanup</code> על ה-nodes הישנים כדי למחוק data שכבר לא שייך להם. תעקוב אחרי <code>nodetool tablehistograms</code> בשביל partitions חריגים בגודלם ואחרי <code>nodetool compactionstats</code> בשביל compactions ממתינים — backlog שגדל אומר שבעיות דיסק ו-latency בקריאות בדרך.</blockquote>`
      }
    }
  ],
  diagram: `DynamoDB                                   Cassandra ring (RF=3)
 hash(PK) -> partition                          N1
 +-----------+ +-----------+ +-----------+    /    \\
 | P1 3k RCU | | P2 HOT!!  | | P3        |  N6      N2   <- key K: hash -> token between N1,N2
 | 1k WCU    | | throttled | |           |  |        |      replicas = N2, N3, N4
 +-----------+ +-----------+ +-----------+  N5      N3
   items sorted by SK inside a partition      \\    /
                                                N4
 R + W > N  ->  LOCAL_QUORUM(2) + LOCAL_QUORUM(2) > 3`,
  handsOn: [
    { cmd: "aws dynamodb query --table-name shop --key-condition-expression \"PK = :pk AND begins_with(SK, :o)\" --expression-attribute-values '{\":pk\":{\"S\":\"CUST#c1\"},\":o\":{\"S\":\"ORDER#\"}}' --no-scan-index-forward --return-consumed-capacity TOTAL", what: { en: "Query a customer's orders newest-first and see how many RCUs it consumed.", he: "Query על ההזמנות של לקוח מהחדשה לישנה, ולראות כמה RCUs זה צרך." } },
    { cmd: "aws dynamodb update-contributor-insights --table-name shop --contributor-insights-action ENABLE", what: { en: "Turn on Contributor Insights to see the most accessed and most throttled partition keys.", he: "מפעילים Contributor Insights כדי לראות את ה-partition keys הכי נגישים והכי מקבלים throttle." } },
    { cmd: "nodetool status && nodetool tablestats shop.orders | grep -Ei 'partition maximum|tombstones'", what: { en: "Cassandra: node states (UN/DN), max partition size and tombstones per read slice.", he: "Cassandra: מצב ה-nodes (‏UN/DN), גודל ה-partition המקסימלי ו-tombstones לכל קריאה." } },
    { cmd: "cqlsh -e \"CONSISTENCY LOCAL_QUORUM; TRACING ON; SELECT * FROM shop.orders_by_customer WHERE customer_id = 42 LIMIT 20;\"", what: { en: "Run a query with LOCAL_QUORUM and tracing to see which replicas answered and how long each step took.", he: "מריצים query עם LOCAL_QUORUM ו-tracing כדי לראות אילו replicas ענו וכמה זמן לקח כל שלב." } }
  ],
  mnemonic: {
    en: "\"Patterns before tables, keys before code.\" For Cassandra: \"R + W > N, or you'll read it again.\" And \"Repair before ten\" — repair within gc_grace (10 days) or the dead come back.",
    he: "\"Patterns לפני טבלאות, מפתחות לפני קוד.\" ל-Cassandra: \"R + W > N, אחרת תקרא ישן.\" ו-\"Repair לפני עשר\" — repair בתוך gc_grace (‏10 ימים), אחרת המתים חוזרים."
  },
  pitfalls: [
    { en: "Low-cardinality partition keys (date, status, country, a single tenant that's 80% of traffic) — all traffic lands on a few partitions and throttles despite plenty of table capacity.", he: "Partition keys עם cardinality נמוך (תאריך, status, מדינה, tenant אחד שהוא 80% מהתעבורה) — כל התעבורה נוחתת על כמה partitions ומקבלת throttle למרות שיש המון capacity בטבלה." },
    { en: "Using Scan + FilterExpression in a request path — it reads (and bills) the whole table and gets slower as data grows.", he: "להשתמש ב-Scan עם FilterExpression בנתיב של בקשה — זה קורא (ומחייב על) כל הטבלה ונהיה איטי יותר ככל שה-data גדל." },
    { en: "Under-provisioning a GSI: when the GSI throttles, base-table writes are throttled too.", he: "לתת ל-GSI פחות מדי capacity: כשה-GSI מקבל throttle, גם הכתיבות לטבלת הבסיס מקבלות throttle." },
    { en: "Never running Cassandra repair, or running it less often than gc_grace_seconds — deleted data comes back from the dead.", he: "לא להריץ repair ב-Cassandra, או להריץ אותו בתדירות נמוכה מ-gc_grace_seconds — data שנמחק חוזר מהמתים." }
  ],
  interview: [
    {
      q: { en: "How would you model a 'like counter' for a viral post that gets 20,000 likes per second in DynamoDB?", he: "איך תמדל ב-DynamoDB 'מונה לייקים' לפוסט ויראלי שמקבל 20,000 לייקים בשנייה?" },
      a: {
        en: "A single item caps at 1,000 WCU, so shard the counter: N items like POST#p1#COUNT#0..49 (50 × 1,000 > 20k, with headroom), increment a random shard with UpdateItem ADD, and read by BatchGetItem-ing all shards and summing (cache the total for a few seconds). Alternatively buffer in a stream/queue and apply aggregated increments every second. Dedupe who-liked separately in a PK=POST#p1, SK=USER#u item with a conditional put.",
        he: "item בודד מוגבל ל-1,000 WCU, אז עושים sharding למונה: N items כמו POST#p1#COUNT#0..49 (‏50 × 1,000 > 20k, עם מרווח), מעלים shard אקראי עם UpdateItem ADD, וקוראים עם BatchGetItem על כל ה-shards ומסכמים (עם cache לסכום לכמה שניות). חלופה: לאגור ב-stream/queue ולהחיל increments מסוכמים כל שנייה. את ה-dedupe של מי עשה לייק שומרים בנפרד ב-item של PK=POST#p1, SK=USER#u עם conditional put."
      }
    },
    {
      q: { en: "In Cassandra with RF=3 in two DCs, which consistency levels would you use and why?", he: "ב-Cassandra עם RF=3 בשני DCs, באילו consistency levels תשתמש ולמה?" },
      a: {
        en: "LOCAL_QUORUM for both reads and writes: 2 + 2 > 3 gives read-your-writes within the DC, tolerates one node down per DC, and avoids cross-DC round trips on the request path. Cross-DC replication still happens asynchronously. Use EACH_QUORUM or QUORUM only where you truly need cross-DC strong consistency and accept the latency; avoid ALL.",
        he: "LOCAL_QUORUM גם לקריאות וגם לכתיבות: 2 + 2 > 3 נותן read-your-writes בתוך ה-DC, סובל node אחד למטה בכל DC, ונמנע מ-round trips בין DCs בנתיב הבקשה. השכפול בין ה-DCs עדיין קורה אסינכרונית. EACH_QUORUM או QUORUM רק איפה שבאמת צריך consistency חזק בין DCs ומוכנים לשלם ב-latency; להימנע מ-ALL."
      }
    }
  ],
  quiz: [
    {
      q: { en: "A DynamoDB table has 40,000 WCU provisioned but throttles at ~1,000 writes/s. Most likely cause?", he: "לטבלת DynamoDB יש 40,000 WCU אבל היא מקבלת throttle בערך ב-1,000 כתיבות בשנייה. מה הסיבה הסבירה ביותר?" },
      options: [
        { en: "The table needs to be on-demand", he: "הטבלה צריכה לעבור ל-on-demand" },
        { en: "Writes concentrate on one partition key, which caps at ~1,000 WCU", he: "הכתיבות מתרכזות ב-partition key אחד, שמוגבל לבערך 1,000 WCU" },
        { en: "Items are larger than 400 KB", he: "ה-items גדולים מ-400 KB" },
        { en: "Streams are enabled", he: "Streams מופעלים" }
      ],
      answer: 1,
      explain: { en: "A single partition key can't exceed 1,000 WCU / 3,000 RCU regardless of table capacity. Find it with Contributor Insights and spread writes (write sharding, better key).", he: "Partition key בודד לא יכול לעבור 1,000 WCU / 3,000 RCU בלי קשר ל-capacity של הטבלה. מוצאים אותו עם Contributor Insights ומפזרים את הכתיבות (write sharding, מפתח טוב יותר)." }
    },
    {
      q: { en: "How many WCU do 300 writes/s of 3.5 KB items need (standard, non-transactional)?", he: "כמה WCU צריך בשביל 300 כתיבות בשנייה של items בגודל 3.5 KB (רגיל, לא טרנזקציוני)?" },
      options: [
        { en: "300", he: "300" },
        { en: "1,050", he: "1,050" },
        { en: "1,200", he: "1,200" },
        { en: "2,400", he: "2,400" }
      ],
      answer: 2,
      explain: { en: "Each write rounds up to 1 KB units: ceil(3.5) = 4 WCU per write × 300 = 1,200 WCU. Transactional would be 2,400.", he: "כל כתיבה מעוגלת ליחידות של 1 KB: ceil(3.5) = 4 WCU לכתיבה × 300 = 1,200 WCU. טרנזקציוני היה 2,400." }
    },
    {
      q: { en: "Cassandra, RF=3. Which combination guarantees reads see the latest acknowledged write?", he: "Cassandra, ‏RF=3. איזה שילוב מבטיח שקריאות יראו את הכתיבה האחרונה שאושרה?" },
      options: [
        { en: "Write ONE, read ONE", he: "כתיבה ב-ONE, קריאה ב-ONE" },
        { en: "Write ONE, read QUORUM", he: "כתיבה ב-ONE, קריאה ב-QUORUM" },
        { en: "Write QUORUM, read QUORUM", he: "כתיבה ב-QUORUM, קריאה ב-QUORUM" },
        { en: "Write ANY, read ONE", he: "כתיבה ב-ANY, קריאה ב-ONE" }
      ],
      answer: 2,
      explain: { en: "R + W > N: 2 + 2 = 4 > 3, so the read set always overlaps the write set. ONE + QUORUM = 1 + 2 = 3, not > 3.", he: "R + W > N: ‏2 + 2 = 4 > 3, כך שקבוצת הקריאה תמיד חופפת לקבוצת הכתיבה. ONE + QUORUM = 1 + 2 = 3, לא גדול מ-3." }
    },
    {
      q: { en: "Why must Cassandra repair complete within gc_grace_seconds?", he: "למה repair ב-Cassandra חייב להסתיים בתוך gc_grace_seconds?" },
      options: [
        { en: "Otherwise SSTables can't be compacted at all", he: "אחרת אי אפשר לעשות compaction ל-SSTables בכלל" },
        { en: "A replica that missed a delete may resurrect the data after other replicas purge the tombstone", he: "Replica שפספס מחיקה עלול להחיות את ה-data אחרי שה-replicas האחרים מחקו את ה-tombstone" },
        { en: "Hints expire and the node is removed from the ring", he: "ה-hints פגים וה-node מוצא מה-ring" },
        { en: "The commit log fills the disk", he: "ה-commit log ממלא את הדיסק" }
      ],
      answer: 1,
      explain: { en: "Repair propagates tombstones to all replicas before they become purgeable; skipping it causes zombie data.", he: "Repair מפיץ את ה-tombstones לכל ה-replicas לפני שמותר למחוק אותם; לדלג עליו גורם ל-zombie data." }
    }
  ],
  related: ["db-sharding", "db-cap", "db-sql-vs-nosql", "pr-db-landscape", "pr-data-modeling"]
});

/* ------------------------------------------------------------------ 26 */
INFRA.lessons.push({
  id: "db-vector",
  track: "data",
  order: 26,
  icon: "🧭",
  level: 3,
  minutes: 14,
  title: { en: "Vector Databases & Embeddings", he: "Vector Databases ו-Embeddings" },
  tldr: {
    en: "An embedding turns text or images into a vector where 'similar meaning' means 'close in space'; a vector DB finds the nearest vectors fast using approximate indexes like HNSW — trading a little recall for 100× lower latency — and your real problems will be memory sizing, metadata filters and re-embedding.",
    he: "Embedding הופך טקסט או תמונה לוקטור שבו 'משמעות דומה' = 'קרוב במרחב'; vector DB מוצא את הוקטורים הקרובים מהר בעזרת indexes משוערים כמו HNSW — מוותר על קצת recall בשביל latency נמוך פי 100 — והבעיות האמיתיות שלך יהיו חישובי זיכרון, סינון לפי metadata ו-re-embedding."
  },
  analogy: {
    en: "Imagine a giant map where every document is a pin, placed so that documents about similar things sit near each other — all 'refund policy' pins in one neighborhood, 'Kubernetes networking' in another. A search drops a new pin for your question and asks 'who are my nearest neighbors?' HNSW is like a highway system: you take the motorway to the right city, then side streets to the exact block, instead of measuring the distance to every pin on the map.",
    he: "תדמיין מפה ענקית שבה כל מסמך הוא נעץ, ממוקם כך שמסמכים על נושאים דומים יושבים קרוב — כל הנעצים של 'מדיניות החזרים' בשכונה אחת, 'רשתות ב-Kubernetes' בשכונה אחרת. חיפוש נועץ נעץ חדש בשביל השאלה שלך ושואל 'מי השכנים הכי קרובים שלי?'. HNSW זה כמו מערכת כבישים: נוסעים בכביש מהיר לעיר הנכונה, ואז ברחובות צדדיים לבלוק המדויק, במקום למדוד את המרחק לכל נעץ במפה."
  },
  sections: [
    {
      h: { en: "Embeddings and similarity metrics", he: "Embeddings ומדדי דמיון" },
      body: {
        en: `<p>An <strong>embedding model</strong> maps input (a sentence, a code chunk, an image) to a fixed-length vector of floats — e.g. 1536 dimensions for OpenAI <code>text-embedding-3-small</code>, 1024 for many open models (BGE, E5), 384 for <code>all-MiniLM-L6-v2</code>. The model is trained so semantically similar inputs land close together: "how do I get my money back" lands near "refund policy" even with zero shared words.</p>
<p>"Close" needs a metric — use the one the model was trained for:</p>
<ul><li><strong>Cosine similarity</strong>: angle between vectors, ignores length. The default for text models.</li>
<li><strong>Dot product</strong> (inner product): angle × lengths. On <em>normalized</em> vectors (length 1) it equals cosine and is cheaper — many providers return normalized vectors.</li>
<li><strong>L2 / Euclidean</strong>: straight-line distance. Common for image models and some classic ML.</li></ul>
<p>Vectors from <strong>different models are not comparable</strong> — not even two versions of the same model. A query embedded with model B against documents embedded with model A returns garbage, silently.</p>
<blockquote>💡 Real world: most "vector DB" workloads are RAG — chunk documents (e.g. 300-800 tokens with overlap), embed chunks, store vector + text + metadata, then at query time embed the question, retrieve top-k (5-20), optionally rerank, and send to the LLM.</blockquote>`,
        he: `<p><strong>מודל embedding</strong> ממפה קלט (משפט, קטע קוד, תמונה) לוקטור באורך קבוע של מספרים — למשל 1536 ממדים ב-<code>text-embedding-3-small</code> של OpenAI, ‏1024 בהרבה מודלים פתוחים (BGE, E5), ‏384 ב-<code>all-MiniLM-L6-v2</code>. המודל מאומן כך שקלטים דומים במשמעות נוחתים קרוב: "איך אני מקבל את הכסף בחזרה" נוחת ליד "מדיניות החזרים" גם בלי אף מילה משותפת.</p>
<p>"קרוב" צריך מדד — תשתמש בזה שהמודל אומן עליו:</p>
<ul><li><strong>Cosine similarity</strong>: הזווית בין הוקטורים, מתעלם מהאורך. ברירת המחדל למודלי טקסט.</li>
<li><strong>Dot product</strong> (inner product): זווית × אורכים. על וקטורים <em>מנורמלים</em> (אורך 1) הוא שווה ל-cosine וזול יותר — הרבה ספקים מחזירים וקטורים מנורמלים.</li>
<li><strong>L2 / Euclidean</strong>: מרחק בקו ישר. נפוץ במודלי תמונה ובחלק מה-ML הקלאסי.</li></ul>
<p>וקטורים <strong>ממודלים שונים לא ברי השוואה</strong> — אפילו לא שתי גרסאות של אותו מודל. query שעבר embedding במודל B מול מסמכים שעברו embedding במודל A מחזיר זבל, בשקט.</p>
<blockquote>💡 מהשטח: רוב העומסים של "vector DB" הם RAG — מחלקים מסמכים ל-chunks (למשל 300-800 tokens עם חפיפה), עושים embedding ל-chunks, שומרים וקטור + טקסט + metadata, ובזמן query עושים embedding לשאלה, שולפים top-k ‏(5-20), אולי עושים rerank, ושולחים ל-LLM.</blockquote>`
      }
    },
    {
      h: { en: "Exact kNN vs ANN: HNSW and IVF/PQ", he: "kNN מדויק מול ANN: ‏HNSW ו-IVF/PQ" },
      body: {
        en: `<p><strong>Exact kNN</strong> compares the query to every vector: 1M × 1536 multiply-adds ≈ 1.5 GFLOP per query — fine at 50k vectors, too slow at 10M with hundreds of QPS. So we use <strong>ANN</strong> (approximate nearest neighbor) indexes that return "almost" the true top-k, measured by <strong>recall@k</strong> (fraction of the true top-k returned; 0.95-0.99 is a typical target).</p>
<p><strong>HNSW</strong> (Hierarchical Navigable Small World) — a multi-layer proximity graph. Top layers are sparse "highways", bottom layer contains every vector. Search greedily walks from the top down toward the query. Parameters:</p>
<ul><li><code>M</code> — links per node (typ. 16-64). Higher = better recall, more memory.</li>
<li><code>ef_construction</code> — candidate list size while building (typ. 64-400). Higher = better graph, slower build.</li>
<li><code>ef_search</code> — candidate list size at query time (≥ k, typ. 40-200). The <strong>runtime knob</strong> for recall vs latency.</li></ul>
<p>HNSW gives the best recall/latency, but lives in RAM, builds slowly and handles deletes awkwardly.</p>
<p><strong>IVF</strong> (inverted file) clusters vectors into <code>nlist</code> buckets (k-means); a query scans only the closest <code>nprobe</code> buckets. Faster to build, less memory, lower recall at the same speed. <strong>PQ</strong> (product quantization) compresses each vector, e.g. 1536 floats (6 KB) → 96 bytes, so billions fit in RAM, at a recall cost (usually fixed by re-scoring top candidates with full vectors). Also: scalar quantization (float32 → int8, 4× smaller) and binary quantization (32×).</p>
<pre>Typical shape (1M vectors, 768-1536 dims, one node):
 exact scan          recall 1.00   ~100-500 ms
 HNSW ef_search=40   recall ~0.95  ~1-3 ms
 HNSW ef_search=200  recall ~0.99  ~5-10 ms</pre>`,
        he: `<p><strong>kNN מדויק</strong> משווה את ה-query לכל וקטור: מיליון × 1536 פעולות כפל-חיבור ≈ ‏1.5 GFLOP ל-query — בסדר ב-50k וקטורים, איטי מדי ב-10M עם מאות QPS. לכן משתמשים ב-indexes של <strong>ANN</strong> (approximate nearest neighbor) שמחזירים "כמעט" את ה-top-k האמיתי, ומודדים אותם ב-<strong>recall@k</strong> (החלק מה-top-k האמיתי שהוחזר; ‏0.95-0.99 הוא יעד נפוץ).</p>
<p><strong>HNSW</strong> (Hierarchical Navigable Small World) — גרף קרבה רב-שכבתי. השכבות העליונות הן "כבישים מהירים" דלילים, והשכבה התחתונה מכילה כל וקטור. החיפוש הולך בצורה greedy מלמעלה למטה לכיוון ה-query. פרמטרים:</p>
<ul><li><code>M</code> — מספר קישורים לכל node (בדרך כלל 16-64). גבוה יותר = recall טוב יותר, יותר זיכרון.</li>
<li><code>ef_construction</code> — גודל רשימת המועמדים בזמן הבנייה (בדרך כלל 64-400). גבוה יותר = גרף טוב יותר, בנייה איטית יותר.</li>
<li><code>ef_search</code> — גודל רשימת המועמדים בזמן query (לפחות k, בדרך כלל 40-200). זה <strong>הכפתור בזמן ריצה</strong> בין recall ל-latency.</li></ul>
<p>HNSW נותן את היחס הכי טוב בין recall ל-latency, אבל יושב ב-RAM, נבנה לאט ומתמודד לא טוב עם מחיקות.</p>
<p><strong>IVF</strong> (inverted file) מחלק את הוקטורים ל-<code>nlist</code> דליים (k-means); query סורק רק את <code>nprobe</code> הדליים הקרובים. מהיר יותר לבנייה, פחות זיכרון, recall נמוך יותר באותה מהירות. <strong>PQ</strong> (product quantization) דוחס כל וקטור, למשל 1536 floats ‏(6 KB) ← ‏96 בייט, כך שמיליארדים נכנסים ל-RAM, במחיר של recall (שבדרך כלל מתקנים עם re-scoring של המועמדים המובילים עם הוקטורים המלאים). יש גם scalar quantization ‏(float32 ← int8, פי 4 קטן יותר) ו-binary quantization (פי 32).</p>
<pre>Typical shape (1M vectors, 768-1536 dims, one node):
 exact scan          recall 1.00   ~100-500 ms
 HNSW ef_search=40   recall ~0.95  ~1-3 ms
 HNSW ef_search=200  recall ~0.99  ~5-10 ms</pre>`
      }
    },
    {
      h: { en: "pgvector: vectors next to your data", he: "pgvector: וקטורים ליד ה-data שלך" },
      body: {
        en: `<p>If you already run Postgres, <strong>pgvector</strong> is usually the right first step: vectors live with your rows, you get transactions, joins, backups and RLS for free.</p>
<pre>CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE doc_chunks (
  id          bigserial PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  doc_id      bigint NOT NULL,
  content     text   NOT NULL,
  embedding   vector(1536) NOT NULL,
  model       text   NOT NULL DEFAULT 'text-embedding-3-small'
);

-- HNSW index for cosine distance (build can take a while: raise maintenance_work_mem)
SET maintenance_work_mem = '8GB';
CREATE INDEX CONCURRENTLY doc_chunks_emb_hnsw
  ON doc_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Query: top 10 nearest chunks for one tenant
SET hnsw.ef_search = 100;
SELECT id, content, 1 - (embedding &lt;=&gt; $1) AS cosine_similarity
FROM doc_chunks
WHERE tenant_id = 42
ORDER BY embedding &lt;=&gt; $1
LIMIT 10;</pre>
<p>Operators: <code>&lt;-&gt;</code> L2 distance, <code>&lt;=&gt;</code> cosine distance, <code>&lt;#&gt;</code> negative inner product. The <code>ORDER BY</code> must use the same operator as the index opclass, with a <code>LIMIT</code>, or the planner won't use the index. Alternatives: <code>ivfflat</code> (<code>WITH (lists = 1000)</code>, set <code>ivfflat.probes</code>; build it <em>after</em> loading data), and <code>halfvec</code> (float16) to halve memory — the <code>vector</code> type indexes up to 2,000 dims, <code>halfvec</code> up to 4,000.</p>
<blockquote>⚠️ Production tip: check <code>EXPLAIN ANALYZE</code> shows <code>Index Scan using doc_chunks_emb_hnsw</code>. Postgres works well up to roughly tens of millions of vectors per node; beyond that, or at very high QPS, dedicated engines with quantization and sharding pull ahead.</blockquote>`,
        he: `<p>אם כבר יש לך Postgres, <strong>pgvector</strong> הוא בדרך כלל הצעד הראשון הנכון: הוקטורים יושבים עם השורות שלך, ומקבלים בחינם טרנזקציות, joins, גיבויים ו-RLS.</p>
<pre>CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE doc_chunks (
  id          bigserial PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  doc_id      bigint NOT NULL,
  content     text   NOT NULL,
  embedding   vector(1536) NOT NULL,
  model       text   NOT NULL DEFAULT 'text-embedding-3-small'
);

-- HNSW index for cosine distance (build can take a while: raise maintenance_work_mem)
SET maintenance_work_mem = '8GB';
CREATE INDEX CONCURRENTLY doc_chunks_emb_hnsw
  ON doc_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Query: top 10 nearest chunks for one tenant
SET hnsw.ef_search = 100;
SELECT id, content, 1 - (embedding &lt;=&gt; $1) AS cosine_similarity
FROM doc_chunks
WHERE tenant_id = 42
ORDER BY embedding &lt;=&gt; $1
LIMIT 10;</pre>
<p>אופרטורים: <code>&lt;-&gt;</code> מרחק L2, ‏<code>&lt;=&gt;</code> מרחק cosine, ‏<code>&lt;#&gt;</code> inner product שלילי. ה-<code>ORDER BY</code> חייב להשתמש באותו אופרטור כמו ה-opclass של ה-index, עם <code>LIMIT</code>, אחרת ה-planner לא ישתמש ב-index. חלופות: <code>ivfflat</code> (<code>WITH (lists = 1000)</code>, מגדירים <code>ivfflat.probes</code>; בונים אותו <em>אחרי</em> טעינת ה-data), ו-<code>halfvec</code> ‏(float16) כדי לחצות את הזיכרון — הטיפוס <code>vector</code> מאפשר index עד 2,000 ממדים, ו-<code>halfvec</code> עד 4,000.</p>
<blockquote>⚠️ טיפ לפרודקשן: תבדוק ש-<code>EXPLAIN ANALYZE</code> מראה <code>Index Scan using doc_chunks_emb_hnsw</code>. Postgres עובד טוב עד בערך עשרות מיליוני וקטורים ל-node; מעבר לזה, או ב-QPS גבוה מאוד, מנועים ייעודיים עם quantization ו-sharding מתחילים להוביל.</blockquote>`
      }
    },
    {
      h: { en: "Dedicated engines, memory math and metadata filtering", he: "מנועים ייעודיים, חישובי זיכרון וסינון לפי metadata" },
      body: {
        en: `<p>Options: <strong>Pinecone</strong> (fully managed, serverless), <strong>Qdrant</strong> (Rust, strong filtering, quantization), <strong>Weaviate</strong> (built-in vectorizer modules, hybrid search), <strong>Milvus</strong> (distributed, GPU indexes, billions of vectors), and <strong>OpenSearch/Elasticsearch kNN</strong> (HNSW via Lucene/FAISS, great if you already run it for keyword search and logs). Choose by scale, filtering needs, ops appetite and whether you need keyword search in the same engine.</p>
<p><strong>Memory sizing</strong> — do this before choosing hardware:</p>
<pre>1M vectors x 1536 dims x 4 bytes (float32) = 6.14 GB raw
+ HNSW graph, M=16: ~2*M links x 4-8 B per vector  ~= 0.15-0.3 GB
+ metadata, payload, OS/page cache headroom
=&gt; plan ~10 GB RAM for 1M x 1536 in HNSW
10M vectors -&gt; ~61 GB raw; with int8 quantization ~15 GB; with binary ~2 GB (+ rescoring)</pre>
<p><strong>Metadata filtering is the classic pitfall.</strong> "Top 10 similar chunks <em>where tenant_id = 42</em>":</p>
<ul><li><strong>Post-filtering</strong>: the ANN returns its top <code>ef_search</code> (say 100) candidates, then the filter drops non-matching ones. If tenant 42 is 0.1% of the data, you get 0 results or 2 instead of 10. In pgvector before 0.8 this is exactly what happens; 0.8+ adds <code>SET hnsw.iterative_scan = relaxed_order</code> to keep scanning.</li>
<li><strong>Pre-filtering / filter-aware traversal</strong> (Qdrant, Weaviate, Pinecone, OpenSearch efficient filtering): the filter is applied during graph traversal. Better, but very selective filters can still hurt latency or recall.</li>
<li>For multi-tenant SaaS, a <strong>partition/namespace/collection per tenant</strong> (or a partial index per big tenant) often beats a global filter.</li></ul>`,
        he: `<p>אפשרויות: <strong>Pinecone</strong> (מנוהל לגמרי, serverless), <strong>Qdrant</strong> (Rust, סינון חזק, quantization), <strong>Weaviate</strong> (מודולים מובנים ל-vectorizing, hybrid search), <strong>Milvus</strong> (מבוזר, indexes על GPU, מיליארדי וקטורים), ו-<strong>kNN של OpenSearch/Elasticsearch</strong> (HNSW דרך Lucene/FAISS, מעולה אם כבר מריצים אותו לחיפוש מילולי ולוגים). בוחרים לפי scale, צורכי סינון, כמה ops אתה מוכן לקחת, והאם צריך חיפוש מילולי באותו מנוע.</p>
<p><strong>חישוב זיכרון</strong> — תעשה את זה לפני שבוחרים חומרה:</p>
<pre>1M vectors x 1536 dims x 4 bytes (float32) = 6.14 GB raw
+ HNSW graph, M=16: ~2*M links x 4-8 B per vector  ~= 0.15-0.3 GB
+ metadata, payload, OS/page cache headroom
=&gt; plan ~10 GB RAM for 1M x 1536 in HNSW
10M vectors -&gt; ~61 GB raw; with int8 quantization ~15 GB; with binary ~2 GB (+ rescoring)</pre>
<p><strong>סינון לפי metadata הוא המלכודת הקלאסית.</strong> "10 ה-chunks הכי דומים <em>where tenant_id = 42</em>":</p>
<ul><li><strong>Post-filtering</strong>: ה-ANN מחזיר את <code>ef_search</code> המועמדים המובילים שלו (נגיד 100), ואז הסינון זורק את מי שלא מתאים. אם tenant 42 הוא 0.1% מה-data, תקבל 0 תוצאות או 2 במקום 10. ב-pgvector לפני 0.8 זה בדיוק מה שקורה; מ-0.8 יש <code>SET hnsw.iterative_scan = relaxed_order</code> שממשיך לסרוק.</li>
<li><strong>Pre-filtering / סינון בזמן המעבר על הגרף</strong> (Qdrant, Weaviate, Pinecone, efficient filtering של OpenSearch): הסינון מופעל תוך כדי המעבר על הגרף. עדיף, אבל סינונים מאוד סלקטיביים עדיין יכולים לפגוע ב-latency או ב-recall.</li>
<li>ב-SaaS מרובה tenants, <strong>partition/namespace/collection לכל tenant</strong> (או partial index לכל tenant גדול) הרבה פעמים עדיף על סינון גלובלי.</li></ul>`
      }
    },
    {
      h: { en: "Re-embedding and hybrid search", he: "Re-embedding ו-hybrid search" },
      body: {
        en: `<p><strong>Changing the embedding model means re-embedding everything.</strong> Plan it like a schema migration:</p>
<ol><li>Store <code>model</code> (name + version) on every row, and the source text, so you can re-embed without re-crawling.</li>
<li>Add a new column/collection (<code>embedding_v2 vector(1024)</code>), backfill in batches respecting the provider's rate limits (10M chunks × 500 tokens = 5B tokens — at ~$0.02 per 1M tokens that's ~$100, but at 1M tokens/min it's ~3.5 days).</li>
<li>Build the index, evaluate recall/answer quality offline on a golden set, then switch reads with a flag, keep the old index for rollback, finally drop it.</li></ol>
<p><strong>Hybrid search</strong>: pure vector search is weak on exact tokens — error codes (<code>ERR_7781</code>), SKUs, names, rare acronyms. Keyword search (BM25) nails those but misses paraphrases. Run both and fuse the ranked lists, commonly with <strong>Reciprocal Rank Fusion</strong>: <code>score(d) = Σ 1 / (60 + rank_i(d))</code>. Then optionally apply a cross-encoder <strong>reranker</strong> on the top 50 to pick the final 5-10. OpenSearch, Elasticsearch, Weaviate, Qdrant and Postgres (tsvector + pgvector) all support this.</p>
<blockquote>💡 Real world: in most RAG systems, better chunking, hybrid retrieval and a reranker improve answer quality far more than switching vector databases.</blockquote>`,
        he: `<p><strong>להחליף מודל embedding אומר לעשות re-embedding לכל ה-data.</strong> מתכננים את זה כמו schema migration:</p>
<ol><li>שומרים <code>model</code> (שם + גרסה) על כל שורה, וגם את טקסט המקור, כדי שאפשר יהיה לעשות re-embedding בלי לסרוק הכל מחדש.</li>
<li>מוסיפים עמודה/collection חדשה (<code>embedding_v2 vector(1024)</code>), עושים backfill ב-batches בהתאם ל-rate limits של הספק (10M chunks × 500 tokens = 5B tokens — בערך $0.02 למיליון tokens זה בערך $100, אבל ב-מיליון tokens לדקה זה בערך 3.5 ימים).</li>
<li>בונים את ה-index, מעריכים recall ואיכות תשובות offline על golden set, ואז מעבירים את הקריאות עם flag, משאירים את ה-index הישן ל-rollback, ובסוף מוחקים אותו.</li></ol>
<p><strong>Hybrid search</strong>: חיפוש וקטורי טהור חלש ב-tokens מדויקים — קודי שגיאה (<code>ERR_7781</code>), מק"טים, שמות, ראשי תיבות נדירים. חיפוש מילולי (BM25) תופס אותם אבל מפספס ניסוחים אחרים. מריצים את שניהם וממזגים את הרשימות המדורגות, לרוב עם <strong>Reciprocal Rank Fusion</strong>: <code>score(d) = Σ 1 / (60 + rank_i(d))</code>. ואז אפשר להפעיל <strong>reranker</strong> מסוג cross-encoder על 50 המובילים כדי לבחור את 5-10 הסופיים. OpenSearch, Elasticsearch, Weaviate, Qdrant ו-Postgres ‏(tsvector + pgvector) תומכים בזה.</p>
<blockquote>💡 מהשטח: ברוב מערכות ה-RAG, chunking טוב יותר, hybrid retrieval ו-reranker משפרים את איכות התשובות הרבה יותר ממעבר ל-vector database אחר.</blockquote>`
      }
    }
  ],
  diagram: `INGEST:  docs -> chunk (500 tok) -> embedding model -> [0.12, -0.03, ... x1536] -> vector DB (+ text, tenant_id, model)
QUERY:   question -> same model -> vector q
                     |-> ANN (HNSW, ef_search=100) top 50 --+
                     |-> BM25 keyword top 50 ---------------+--> RRF fuse -> rerank -> top 8 -> LLM

HNSW layers:   L2:  A ---------------- F            (few nodes, long jumps)
               L1:  A ----- C ----- F ----- H
               L0:  A-B-C-D-E-F-G-H-I-J-K ... all   (greedy walk to nearest)`,
  handsOn: [
    { cmd: "psql -c \"CREATE EXTENSION IF NOT EXISTS vector; SELECT extversion FROM pg_extension WHERE extname='vector';\"", what: { en: "Install pgvector and check its version (0.8+ has iterative index scans for filtered queries).", he: "מתקינים pgvector ובודקים גרסה (מ-0.8 יש iterative index scans ל-queries עם סינון)." } },
    { cmd: "psql -c \"SET hnsw.ef_search = 40; EXPLAIN ANALYZE SELECT id FROM doc_chunks ORDER BY embedding <=> (SELECT embedding FROM doc_chunks WHERE id = 1) LIMIT 10;\"", what: { en: "Confirm the HNSW index is used and measure latency; repeat with ef_search = 200 and compare.", he: "מוודאים שה-HNSW index בשימוש ומודדים latency; חוזרים עם ef_search = 200 ומשווים." } },
    { cmd: "psql -c \"SELECT pg_size_pretty(pg_relation_size('doc_chunks_emb_hnsw')) AS index_size, pg_size_pretty(pg_total_relation_size('doc_chunks')) AS table_total;\"", what: { en: "See how much space the vector index really takes versus your back-of-envelope math.", he: "רואים כמה מקום ה-index הוקטורי באמת תופס לעומת החישוב על דף הממחטה." } },
    { cmd: "curl -s localhost:6333/collections/docs/points/search -H 'Content-Type: application/json' -d '{\"vector\":[0.1,0.2,0.3,0.4],\"limit\":5,\"filter\":{\"must\":[{\"key\":\"tenant_id\",\"match\":{\"value\":42}}]},\"params\":{\"hnsw_ef\":128}}'", what: { en: "Qdrant: a filtered vector search with a per-query ef (use a real-dimension vector in practice).", he: "Qdrant: חיפוש וקטורי עם סינון ו-ef לכל query (בפועל שולחים וקטור בממד האמיתי)." } }
  ],
  mnemonic: {
    en: "\"Same model in, same model out.\" HNSW knobs: \"M for memory, ef for effort.\" And sizing: \"N × dims × 4, then add some more.\"",
    he: "\"אותו מודל נכנס, אותו מודל יוצא.\" הכפתורים של HNSW: \"M לזיכרון, ef למאמץ.\" וחישוב גודל: \"N × ממדים × 4, ועוד קצת.\""
  },
  pitfalls: [
    { en: "Mixing embeddings from different models or versions in one index — similarity scores become meaningless, with no error.", he: "לערבב embeddings ממודלים או גרסאות שונים באותו index — ציוני הדמיון הופכים לחסרי משמעות, בלי שום שגיאה." },
    { en: "Post-filtering a selective metadata filter (one tenant out of thousands) — queries return fewer than k results or the wrong ones.", he: "Post-filtering עם סינון metadata סלקטיבי (tenant אחד מתוך אלפים) — ה-queries מחזירים פחות מ-k תוצאות או תוצאות לא נכונות." },
    { en: "Sizing RAM from the raw vectors only and forgetting graph overhead, payloads, replicas and index build memory — the node OOMs or falls back to disk.", he: "לחשב RAM רק לפי הוקטורים הגולמיים ולשכוח את ה-overhead של הגרף, payloads, replicas והזיכרון של בניית ה-index — ה-node נופל ב-OOM או נופל לדיסק." },
    { en: "Using the wrong distance operator (L2 index, cosine query) — the planner skips the index and does a full scan.", he: "להשתמש באופרטור מרחק לא נכון (index של L2, query של cosine) — ה-planner מדלג על ה-index ועושה full scan." }
  ],
  interview: [
    {
      q: { en: "How would you size and choose infrastructure for 50M document chunks with 1024-dim embeddings at 200 QPS?", he: "איך תחשב ותבחר תשתית ל-50M chunks עם embeddings של 1024 ממדים ב-200 QPS?" },
      a: {
        en: "Raw: 50M × 1024 × 4 B ≈ 205 GB, plus HNSW graph (~10-15 GB at M=16) and payloads. That's beyond a comfortable single Postgres node, so either a dedicated engine (Qdrant/Milvus/OpenSearch) sharded across 3-4 nodes with replicas, or quantization (int8 ≈ 51 GB, or binary + rescoring). Benchmark recall@10 vs p99 on real queries while tuning ef_search; design tenant filtering up front (namespaces or filter-aware HNSW); store model version for future re-embedding.",
        he: "גולמי: 50M × 1024 × 4 בייט ≈ ‏205 GB, ועוד גרף HNSW (בערך 10-15 GB ב-M=16) ו-payloads. זה מעבר ל-node בודד ונוח של Postgres, אז או מנוע ייעודי (Qdrant/Milvus/OpenSearch) עם sharding על 3-4 nodes ו-replicas, או quantization ‏(int8 ≈ ‏51 GB, או binary + rescoring). מריצים benchmark של recall@10 מול p99 על queries אמיתיים תוך כדי כיוונון ef_search; מתכננים מראש סינון לפי tenant (namespaces או HNSW שמודע לסינון); ושומרים את גרסת המודל בשביל re-embedding עתידי."
      }
    },
    {
      q: { en: "Users complain RAG answers miss exact error codes. What do you change?", he: "משתמשים מתלוננים שתשובות ה-RAG מפספסות קודי שגיאה מדויקים. מה אתה משנה?" },
      a: {
        en: "Add hybrid retrieval: BM25/keyword search alongside vectors, fused with RRF, then a cross-encoder reranker. Also check chunking (codes split across chunks?), and that queries and docs use the same embedding model. Measure with a labeled eval set (recall@k, answer accuracy) before and after.",
        he: "מוסיפים hybrid retrieval: חיפוש BM25/מילולי לצד הוקטורים, ממוזגים עם RRF, ואז reranker מסוג cross-encoder. בנוסף בודקים את ה-chunking (קודים נחתכים בין chunks?), ושה-queries והמסמכים עוברים embedding באותו מודל. מודדים עם eval set מתויג (recall@k, דיוק תשובות) לפני ואחרי."
      }
    }
  ],
  quiz: [
    {
      q: { en: "How much raw memory do 1M float32 embeddings of 1536 dimensions take?", he: "כמה זיכרון גולמי תופסים מיליון embeddings מסוג float32 עם 1536 ממדים?" },
      options: [
        { en: "~1.5 GB", he: "בערך 1.5 GB" },
        { en: "~6 GB", he: "בערך 6 GB" },
        { en: "~24 GB", he: "בערך 24 GB" },
        { en: "~600 MB", he: "בערך 600 MB" }
      ],
      answer: 1,
      explain: { en: "1,000,000 × 1536 × 4 bytes = 6.14 GB, before index graph overhead and payloads.", he: "1,000,000 × 1536 × 4 בייט = ‏6.14 GB, לפני ה-overhead של גרף ה-index וה-payloads." }
    },
    {
      q: { en: "Which HNSW parameter can you tune per query to trade latency for recall?", he: "איזה פרמטר של HNSW אפשר לכוונן לכל query כדי להחליף latency ב-recall?" },
      options: [
        { en: "M", he: "M" },
        { en: "ef_construction", he: "ef_construction" },
        { en: "ef_search", he: "ef_search" },
        { en: "The vector dimension", he: "ממד הוקטור" }
      ],
      answer: 2,
      explain: { en: "M and ef_construction are fixed at build time. ef_search (hnsw.ef_search in pgvector, hnsw_ef in Qdrant) controls the candidate list at query time.", he: "M ו-ef_construction נקבעים בזמן הבנייה. ef_search ‏(hnsw.ef_search ב-pgvector, ‏hnsw_ef ב-Qdrant) שולט ברשימת המועמדים בזמן ה-query." }
    },
    {
      q: { en: "A filtered vector query (WHERE tenant_id = 42) returns only 2 results instead of 10. Most likely reason?", he: "query וקטורי עם סינון (WHERE tenant_id = 42) מחזיר רק 2 תוצאות במקום 10. מה הסיבה הסבירה ביותר?" },
      options: [
        { en: "The embedding model is down", he: "מודל ה-embedding למטה" },
        { en: "Post-filtering: the ANN returned its top candidates, and most belonged to other tenants", he: "Post-filtering: ה-ANN החזיר את המועמדים המובילים שלו, ורובם שייכים ל-tenants אחרים" },
        { en: "Cosine similarity can't be used with filters", he: "אי אפשר להשתמש ב-cosine similarity עם סינונים" },
        { en: "The table needs VACUUM", he: "הטבלה צריכה VACUUM" }
      ],
      answer: 1,
      explain: { en: "The index finds ~ef_search nearest candidates globally, then the filter removes non-matching rows. Use filter-aware search, iterative scans (pgvector 0.8+), or per-tenant partitions/indexes.", he: "ה-index מוצא בערך ef_search מועמדים קרובים באופן גלובלי, ואז הסינון מוחק את השורות שלא מתאימות. השתמש בחיפוש שמודע לסינון, ב-iterative scans ‏(pgvector 0.8+), או ב-partitions/indexes לכל tenant." }
    },
    {
      q: { en: "You upgrade from embedding model v1 to v2. What must happen to existing vectors?", he: "שדרגת ממודל embedding גרסה 1 לגרסה 2. מה חייב לקרות לוקטורים הקיימים?" },
      options: [
        { en: "Nothing, vectors are model-independent", he: "כלום, הוקטורים לא תלויים במודל" },
        { en: "Only the index needs a REINDEX", he: "רק ה-index צריך REINDEX" },
        { en: "All documents must be re-embedded with v2 before queries embedded with v2 are compared to them", he: "כל המסמכים חייבים לעבור re-embedding עם v2 לפני שמשווים אליהם queries שעברו embedding ב-v2" },
        { en: "Normalize the old vectors and keep them", he: "לנרמל את הוקטורים הישנים ולהשאיר אותם" }
      ],
      answer: 2,
      explain: { en: "Different models define different vector spaces. Backfill v2 embeddings side by side, evaluate, switch reads, then drop v1.", he: "מודלים שונים מגדירים מרחבים וקטוריים שונים. עושים backfill ל-embeddings של v2 במקביל, מעריכים, מעבירים את הקריאות, ואז מוחקים את v1." }
    }
  ],
  related: ["pr-ai-systems-design", "db-indexes", "pr-db-landscape", "db-sql-vs-nosql"]
});

/* ------------------------------------------------------------------ 27 */
INFRA.lessons.push({
  id: "db-mongodb",
  track: "data",
  order: 27,
  icon: "🍃",
  level: 2,
  minutes: 14,
  title: { en: "MongoDB in Production", he: "MongoDB בפרודקשן" },
  tldr: {
    en: "MongoDB stores JSON-like documents shaped around how your app reads them; in production you live by replica sets (elections, oplog window), write/read concerns, explain() and indexes, bounded document design, and a shard key you can't easily take back.",
    he: "MongoDB שומר מסמכים דמויי JSON בצורה שמתאימה לאיך שהאפליקציה קוראת אותם; בפרודקשן אתה חי לפי replica sets (בחירות, oplog window), write/read concerns, ‏explain() ו-indexes, תכנון מסמכים חסומים בגודל, ו-shard key שקשה מאוד לחזור ממנו."
  },
  analogy: {
    en: "A relational database is IKEA: every part in its own labeled bin, and you assemble the furniture (JOIN) every time someone wants to sit. MongoDB ships the chair already assembled — great when people always want the whole chair, painful when someone asks 'give me every left leg in the warehouse' or the chair keeps growing new legs forever.",
    he: "Database רלציוני זה איקאה: כל חלק בתא משלו עם תווית, ומרכיבים את הרהיט (JOIN) כל פעם שמישהו רוצה לשבת. MongoDB שולח את הכיסא כבר מורכב — מעולה כשאנשים תמיד רוצים את כל הכיסא, כואב כשמישהו מבקש 'תביא לי את כל הרגליים השמאליות במחסן' או כשלכיסא צומחות רגליים חדשות בלי סוף."
  },
  sections: [
    {
      h: { en: "The document model and when it fits", he: "מודל המסמכים ומתי הוא מתאים" },
      body: {
        en: `<p>Data is stored as <strong>BSON documents</strong> in collections, with nested objects and arrays, no fixed schema (but you can enforce one with <code>$jsonSchema</code> validation). A document is the unit of atomicity: updates to a single document are atomic even across nested fields; multi-document ACID transactions exist (since 4.0 / sharded 4.2) but are slower and limited to 60 s by default.</p>
<pre>{
  _id: ObjectId("6553..."),
  customerId: 4521,
  status: "PAID",
  createdAt: ISODate("2025-11-14T10:02:11Z"),
  shipping: { city: "Tel Aviv", zip: "6100000" },
  items: [ { sku: "KB-01", qty: 1, price: 349 }, { sku: "MS-07", qty: 2, price: 99 } ],
  total: 547
}</pre>
<p><strong>Fits well</strong>: aggregates read and written as a unit (an order with its lines, a product catalog with varied attributes per category, user profiles, CMS content, event payloads with evolving shape). <strong>Fits badly</strong>: heavy many-to-many relationships, ad-hoc joins and reporting across entities, strict multi-entity invariants (ledgers). <code>$lookup</code> exists, but if every query needs it you're writing a relational app in the wrong database.</p>`,
        he: `<p>ה-data נשמר כ-<strong>מסמכי BSON</strong> בתוך collections, עם אובייקטים ומערכים מקוננים, בלי schema קבוע (אבל אפשר לאכוף אחד עם ולידציה של <code>$jsonSchema</code>). מסמך הוא יחידת האטומיות: עדכון של מסמך בודד הוא אטומי גם על שדות מקוננים; יש טרנזקציות ACID על כמה מסמכים (מ-4.0, וב-sharded מ-4.2) אבל הן איטיות יותר ומוגבלות ל-60 שניות כברירת מחדל.</p>
<pre>{
  _id: ObjectId("6553..."),
  customerId: 4521,
  status: "PAID",
  createdAt: ISODate("2025-11-14T10:02:11Z"),
  shipping: { city: "Tel Aviv", zip: "6100000" },
  items: [ { sku: "KB-01", qty: 1, price: 349 }, { sku: "MS-07", qty: 2, price: 99 } ],
  total: 547
}</pre>
<p><strong>מתאים טוב</strong>: aggregates שנקראים ונכתבים כיחידה (הזמנה עם השורות שלה, קטלוג מוצרים עם מאפיינים שונים לכל קטגוריה, פרופילי משתמשים, תוכן CMS, payloads של events שהמבנה שלהם מתפתח). <strong>מתאים רע</strong>: הרבה קשרי many-to-many, joins ודוחות אד-הוק על פני ישויות, אינווריאנטים קשיחים בין כמה ישויות (ledgers). <code>$lookup</code> קיים, אבל אם כל query צריך אותו, אתה כותב אפליקציה רלציונית ב-database הלא נכון.</p>`
      }
    },
    {
      h: { en: "Replica sets: elections and the oplog window", he: "Replica sets: בחירות ו-oplog window" },
      body: {
        en: `<p>Production MongoDB is a <strong>replica set</strong>: one primary takes all writes, secondaries replicate (typically 3 data-bearing members across 3 AZs). Every write is recorded in the <strong>oplog</strong> (<code>local.oplog.rs</code>, a capped collection) and secondaries tail and apply it.</p>
<p><strong>Elections</strong>: members heartbeat every 2 s; if the primary is unreachable for <code>electionTimeoutMillis</code> (10 s default), a secondary calls a Raft-style election and needs a <strong>majority</strong> of voting members. Typical failover: ~10-15 s, during which writes fail — drivers with <code>retryWrites=true</code> (default) retry once on the new primary. With 2 data nodes you need an arbiter (or better, a third data node); with an even split across 2 data centers, losing the bigger one means no primary.</p>
<p>The <strong>oplog window</strong> is how much time the capped oplog covers. If a secondary is offline (or lagging) longer than the window, the entries it needs are gone and it must do a full <strong>initial sync</strong> — copying the entire data set, hours for TBs.</p>
<pre>rs0:PRIMARY&gt; rs.printReplicationInfo()
configured oplog size:   51200 MB
log length start to end: 38.6 hrs
oplog first event time:  Thu Nov 13 2025 07:12:44
oplog last event time:   Fri Nov 14 2025 21:48:30

rs0:PRIMARY&gt; rs.printSecondaryReplicationInfo()
source: mongo-2:27017
  syncedTo: Fri Nov 14 2025 21:48:29
  1 secs (0 hrs) behind the primary</pre>
<blockquote>⚠️ Production tip: keep the oplog window comfortably longer than your longest maintenance (24-72 h is common). A bulk migration that rewrites millions of docs can shrink a 2-day window to 2 hours. Resize online with <code>db.adminCommand({replSetResizeOplog: 1, size: 102400})</code> (MB).</blockquote>`,
        he: `<p>MongoDB בפרודקשן הוא <strong>replica set</strong>: primary אחד מקבל את כל הכתיבות, ו-secondaries משכפלים (בדרך כלל 3 חברים עם data על פני 3 AZs). כל כתיבה נרשמת ב-<strong>oplog</strong> (<code>local.oplog.rs</code>, ‏capped collection) וה-secondaries קוראים אותו ומחילים.</p>
<p><strong>בחירות</strong>: החברים שולחים heartbeat כל 2 שניות; אם ה-primary לא זמין במשך <code>electionTimeoutMillis</code> (‏10 שניות כברירת מחדל), secondary יוזם בחירות בסגנון Raft וצריך <strong>רוב</strong> של החברים המצביעים. failover טיפוסי: בערך 10-15 שניות, שבמהלכן כתיבות נכשלות — drivers עם <code>retryWrites=true</code> (ברירת המחדל) מנסים שוב פעם אחת על ה-primary החדש. עם 2 nodes של data צריך arbiter (או עדיף, node שלישי עם data); עם חלוקה זוגית בין 2 data centers, נפילה של הגדול מביניהם אומרת שאין primary.</p>
<p>ה-<strong>oplog window</strong> הוא כמה זמן ה-oplog המוגבל מכסה. אם secondary מנותק (או מפגר) יותר זמן מה-window, הרשומות שהוא צריך כבר נמחקו והוא חייב לעשות <strong>initial sync</strong> מלא — העתקה של כל ה-data, שעות כשמדובר ב-TBs.</p>
<pre>rs0:PRIMARY&gt; rs.printReplicationInfo()
configured oplog size:   51200 MB
log length start to end: 38.6 hrs
oplog first event time:  Thu Nov 13 2025 07:12:44
oplog last event time:   Fri Nov 14 2025 21:48:30

rs0:PRIMARY&gt; rs.printSecondaryReplicationInfo()
source: mongo-2:27017
  syncedTo: Fri Nov 14 2025 21:48:29
  1 secs (0 hrs) behind the primary</pre>
<blockquote>⚠️ טיפ לפרודקשן: תשמור על oplog window ארוך בהרבה מהתחזוקה הכי ארוכה שלך (24-72 שעות זה נפוץ). migration גדול שכותב מחדש מיליוני מסמכים יכול לכווץ window של יומיים לשעתיים. משנים גודל online עם <code>db.adminCommand({replSetResizeOplog: 1, size: 102400})</code> (ב-MB).</blockquote>`
      }
    },
    {
      h: { en: "Write concern, read concern, read preference", he: "Write concern, ‏read concern, ‏read preference" },
      body: {
        en: `<p>Three dials decide durability and consistency — per operation, per collection or in the connection string:</p>
<ul><li><strong>Write concern</strong> — when is a write acknowledged? <code>w:1</code> = primary has it in memory (lost if the primary dies before replicating — it gets <em>rolled back</em> on rejoin). <code>w:"majority"</code> = a majority of members have it, survives failover; default since 5.0. <code>j:true</code> = journaled to disk. <code>wtimeout</code> bounds the wait.</li>
<li><strong>Read concern</strong> — what data may a read see? <code>local</code> (default; may see data later rolled back), <code>majority</code> (only majority-committed data), <code>linearizable</code> (reads reflect all prior majority writes; primary only, slow), <code>snapshot</code> (transactions).</li>
<li><strong>Read preference</strong> — which member serves reads? <code>primary</code> (default), <code>primaryPreferred</code>, <code>secondary</code>, <code>secondaryPreferred</code>, <code>nearest</code>; add <code>maxStalenessSeconds</code> (≥ 90) to skip lagging secondaries.</li></ul>
<pre>mongodb://app:***@mongo-1,mongo-2,mongo-3/shop?replicaSet=rs0
  &amp;w=majority&amp;readConcernLevel=majority&amp;retryWrites=true
  &amp;readPreference=primary&amp;maxPoolSize=100</pre>
<p>Reading from secondaries does <em>not</em> give you read-your-writes (they lag), and secondaries apply the same writes as the primary, so they're not "free" capacity. Use them for analytics/reporting, or <code>nearest</code> for geo-local reads that tolerate staleness. Causally consistent sessions give read-your-writes across members when combined with majority concerns.</p>`,
        he: `<p>שלושה חוגים קובעים durability ו-consistency — לכל פעולה, לכל collection או ב-connection string:</p>
<ul><li><strong>Write concern</strong> — מתי כתיבה מאושרת? <code>w:1</code> = ל-primary יש אותה בזיכרון (הולכת לאיבוד אם ה-primary מת לפני השכפול — היא עוברת <em>rollback</em> כשהוא חוזר). <code>w:"majority"</code> = לרוב החברים יש אותה, שורדת failover; ברירת מחדל מ-5.0. <code>j:true</code> = נכתבה ל-journal בדיסק. <code>wtimeout</code> מגביל את זמן ההמתנה.</li>
<li><strong>Read concern</strong> — איזה data קריאה רשאית לראות? <code>local</code> (ברירת מחדל; עלולה לראות data שיעבור rollback אחר כך), <code>majority</code> (רק data שאושר ע"י רוב), <code>linearizable</code> (קריאות משקפות את כל כתיבות ה-majority הקודמות; רק מה-primary, איטי), <code>snapshot</code> (טרנזקציות).</li>
<li><strong>Read preference</strong> — איזה חבר משרת קריאות? <code>primary</code> (ברירת מחדל), <code>primaryPreferred</code>, <code>secondary</code>, <code>secondaryPreferred</code>, <code>nearest</code>; מוסיפים <code>maxStalenessSeconds</code> (לפחות 90) כדי לדלג על secondaries שמפגרים.</li></ul>
<pre>mongodb://app:***@mongo-1,mongo-2,mongo-3/shop?replicaSet=rs0
  &amp;w=majority&amp;readConcernLevel=majority&amp;retryWrites=true
  &amp;readPreference=primary&amp;maxPoolSize=100</pre>
<p>קריאה מ-secondaries <em>לא</em> נותנת read-your-writes (הם מפגרים), וה-secondaries מחילים את אותן כתיבות כמו ה-primary, אז הם לא capacity "בחינם". השתמש בהם לאנליטיקה/דוחות, או ב-<code>nearest</code> לקריאות מקומיות גיאוגרפית שסובלות data קצת ישן. Causally consistent sessions נותנים read-your-writes בין חברים כשמשלבים אותם עם majority concerns.</p>`
      }
    },
    {
      h: { en: "Indexes, explain() and schema design", he: "Indexes, ‏explain() ותכנון schema" },
      body: {
        en: `<p>Without an index, a query is a <strong>COLLSCAN</strong> — every document read. The tool is <code>explain("executionStats")</code>: compare <code>nReturned</code> with <code>totalKeysExamined</code> and <code>totalDocsExamined</code>. Ideal ratio ≈ 1:1:1.</p>
<pre>db.orders.find({ customerId: 4521, status: "PAID" })
         .sort({ createdAt: -1 }).limit(20)
         .explain("executionStats")
// before: stage COLLSCAN, totalDocsExamined: 8,412,330, nReturned: 20, 6,900 ms
db.orders.createIndex({ customerId: 1, status: 1, createdAt: -1 })
// after:  stage IXSCAN -&gt; FETCH, totalKeysExamined: 20, totalDocsExamined: 20, 1 ms</pre>
<p>Compound index order follows the <strong>ESR rule</strong>: <strong>E</strong>quality fields first, then <strong>S</strong>ort fields, then <strong>R</strong>ange fields. Watch for <code>SORT</code> stages in memory (100 MB limit before spilling/failing). Every index costs RAM (WiredTiger cache, default 50% of (RAM − 1 GB)) and write amplification — drop unused ones (<code>$indexStats</code>).</p>
<p><strong>Embed vs reference</strong>:</p>
<ul><li><strong>Embed</strong> when data is read together, owned by the parent and bounded (order lines, addresses).</li>
<li><strong>Reference</strong> when it's shared, large, independently updated, or unbounded (comments on a viral post, events of a device).</li>
<li>Hard limit: <strong>16 MB per document</strong>. Long before that, <strong>unbounded arrays</strong> hurt: every push rewrites a growing document, multikey indexes explode, and the working set bloats. Use the <em>bucket pattern</em> (one doc per device per hour with ≤ 200 readings) or a separate collection.</li></ul>`,
        he: `<p>בלי index, query הוא <strong>COLLSCAN</strong> — כל מסמך נקרא. הכלי הוא <code>explain("executionStats")</code>: משווים את <code>nReturned</code> ל-<code>totalKeysExamined</code> ול-<code>totalDocsExamined</code>. היחס האידיאלי ≈ ‏1:1:1.</p>
<pre>db.orders.find({ customerId: 4521, status: "PAID" })
         .sort({ createdAt: -1 }).limit(20)
         .explain("executionStats")
// before: stage COLLSCAN, totalDocsExamined: 8,412,330, nReturned: 20, 6,900 ms
db.orders.createIndex({ customerId: 1, status: 1, createdAt: -1 })
// after:  stage IXSCAN -&gt; FETCH, totalKeysExamined: 20, totalDocsExamined: 20, 1 ms</pre>
<p>סדר השדות ב-compound index לפי <strong>כלל ESR</strong>: קודם שדות <strong>E</strong>quality, אחר כך שדות <strong>S</strong>ort, ובסוף שדות <strong>R</strong>ange. שים לב לשלבי <code>SORT</code> בזיכרון (מגבלה של 100 MB לפני spill/כישלון). כל index עולה RAM ‏(WiredTiger cache, ברירת מחדל 50% מ-(RAM פחות 1 GB)) ו-write amplification — תמחק indexes שלא בשימוש (<code>$indexStats</code>).</p>
<p><strong>Embed מול reference</strong>:</p>
<ul><li><strong>Embed</strong> כשה-data נקרא ביחד, שייך להורה וחסום בגודל (שורות הזמנה, כתובות).</li>
<li><strong>Reference</strong> כשהוא משותף, גדול, מתעדכן בנפרד או לא חסום (תגובות על פוסט ויראלי, events של מכשיר).</li>
<li>מגבלה קשיחה: <strong>16 MB למסמך</strong>. הרבה לפני זה, <strong>מערכים לא חסומים</strong> כואבים: כל push כותב מחדש מסמך שהולך וגדל, multikey indexes מתפוצצים, וה-working set מתנפח. השתמש ב-<em>bucket pattern</em> (מסמך אחד לכל מכשיר לכל שעה עם עד 200 מדידות) או ב-collection נפרד.</li></ul>`
      }
    },
    {
      h: { en: "Sharding: shard keys, chunks and the balancer", he: "Sharding: ‏shard keys, ‏chunks וה-balancer" },
      body: {
        en: `<p>A sharded cluster = <strong>mongos</strong> routers + a <strong>config server</strong> replica set (metadata) + N <strong>shards</strong> (each a replica set). Data is split by the <strong>shard key</strong> into <strong>chunks</strong> (ranges; default max 128 MB since 6.0), and the <strong>balancer</strong> moves chunks between shards to even them out.</p>
<pre>sh.enableSharding("shop")
sh.shardCollection("shop.orders", { customerId: "hashed" })   // even writes, no range scans on key
// or ranged compound:
sh.shardCollection("shop.events", { tenantId: 1, ts: 1 })     // targeted per-tenant ranges</pre>
<p>A good shard key has <strong>high cardinality</strong>, <strong>even frequency</strong>, is <strong>not monotonically increasing</strong> (an <code>ObjectId</code> or timestamp alone sends every insert to the "last" chunk on one shard), and appears in most queries so mongos can <em>target</em> one shard instead of <strong>scatter-gather</strong> to all.</p>
<p><strong>Jumbo chunks</strong>: if one shard key value (e.g. <code>tenantId: "acme"</code> with 40% of data) exceeds the chunk size, the chunk can't be split and the balancer can't move it — that shard fills up. Fix by refining the key with a suffix (<code>refineCollectionShardKey</code> to <code>{tenantId: 1, orderId: 1}</code>, 4.4+) or <code>reshardCollection</code> (5.0+, online but heavy: needs ~1.2× collection size free and takes hours).</p>
<blockquote>💡 Real world: shard later than you think. A single replica set on good NVMe handles several TB and tens of thousands of ops/s. When you do shard, pick the key from your top 3 queries — changing it later is a multi-hour, I/O-heavy operation.</blockquote>`,
        he: `<p>Sharded cluster = נתבי <strong>mongos</strong> + replica set של <strong>config servers</strong> (metadata) + ‏N <strong>shards</strong> (כל אחד replica set). ה-data מחולק לפי ה-<strong>shard key</strong> ל-<strong>chunks</strong> (טווחים; מקסימום 128 MB כברירת מחדל מ-6.0), וה-<strong>balancer</strong> מזיז chunks בין shards כדי לאזן.</p>
<pre>sh.enableSharding("shop")
sh.shardCollection("shop.orders", { customerId: "hashed" })   // even writes, no range scans on key
// or ranged compound:
sh.shardCollection("shop.events", { tenantId: 1, ts: 1 })     // targeted per-tenant ranges</pre>
<p>Shard key טוב הוא עם <strong>cardinality גבוה</strong>, <strong>תדירות אחידה</strong>, <strong>לא עולה באופן מונוטוני</strong> (<code>ObjectId</code> או timestamp לבד שולחים כל insert ל-chunk ה"אחרון" על shard אחד), ומופיע ברוב ה-queries כדי ש-mongos יוכל <em>לכוון</em> ל-shard אחד במקום <strong>scatter-gather</strong> לכולם.</p>
<p><strong>Jumbo chunks</strong>: אם ערך shard key אחד (למשל <code>tenantId: "acme"</code> עם 40% מה-data) עובר את גודל ה-chunk, אי אפשר לפצל את ה-chunk וה-balancer לא יכול להזיז אותו — ה-shard הזה מתמלא. מתקנים עם עידון המפתח עם סיומת (<code>refineCollectionShardKey</code> ל-<code>{tenantId: 1, orderId: 1}</code>, מ-4.4) או <code>reshardCollection</code> (מ-5.0, online אבל כבד: צריך בערך פי 1.2 מגודל ה-collection פנוי ולוקח שעות).</p>
<blockquote>💡 מהשטח: תעשה sharding מאוחר יותר ממה שאתה חושב. replica set בודד על NVMe טוב מחזיק כמה TB ועשרות אלפי פעולות בשנייה. כשכבר עושים sharding, בוחרים את המפתח מתוך 3 ה-queries המובילים — לשנות אותו אחר כך זו פעולה של שעות עם הרבה I/O.</blockquote>`
      }
    },
    {
      h: { en: "Common production issues", he: "תקלות פרודקשן נפוצות" },
      body: {
        en: `<ul><li><strong>Missing index after a feature launch</strong>: CPU 100%, slow query log full of <code>COLLSCAN</code>. Find with the profiler (<code>db.setProfilingLevel(1, { slowms: 100 })</code>) or Atlas Performance Advisor; build indexes (non-blocking since 4.2, but still I/O heavy — off-peak).</li>
<li><strong>Working set &gt; RAM</strong>: WiredTiger cache eviction, disk reads spike, latency jumps from 2 ms to 200 ms. Check <code>db.serverStatus().wiredTiger.cache</code> ("bytes currently in the cache" vs max, pages read into cache).</li>
<li><strong>Connection storms</strong>: 200 pods × <code>maxPoolSize=100</code> = 20,000 connections, ~1 MB each on the server. Cap pool size per pod; Atlas tiers have hard connection limits.</li>
<li><strong>Replication lag</strong> from bulk writes or a slow secondary disk — with <code>w:"majority"</code> it shows up as slow writes; with <code>w:1</code> as stale secondary reads and a rollback risk.</li>
<li><strong>Elections during deploys/maintenance</strong>: apps without retryable writes or with stale drivers throw errors for 10-15 s. Use <code>rs.stepDown()</code> for planned switchovers and test that clients ride through.</li>
<li><strong>Long-running <code>$regex</code>/<code>$where</code> queries</strong> — kill with <code>db.currentOp()</code> + <code>db.killOp(opid)</code>; set <code>maxTimeMS</code> on application queries.</li></ul>`,
        he: `<ul><li><strong>Index חסר אחרי השקת פיצ'ר</strong>: CPU על 100%, ה-slow query log מלא ב-<code>COLLSCAN</code>. מוצאים עם ה-profiler (<code>db.setProfilingLevel(1, { slowms: 100 })</code>) או עם Performance Advisor של Atlas; בונים indexes (לא חוסם מ-4.2, אבל עדיין כבד ב-I/O — מחוץ לשעות שיא).</li>
<li><strong>Working set גדול מה-RAM</strong>: eviction מה-cache של WiredTiger, קריאות דיסק קופצות, ה-latency קופץ מ-2 ms ל-200 ms. בודקים את <code>db.serverStatus().wiredTiger.cache</code> ‏("bytes currently in the cache" מול המקסימום, pages read into cache).</li>
<li><strong>סערת connections</strong>: ‏200 pods × <code>maxPoolSize=100</code> = ‏20,000 connections, בערך 1 MB כל אחד בשרת. מגבילים את גודל ה-pool לכל pod; ל-tiers של Atlas יש מגבלות connections קשיחות.</li>
<li><strong>Replication lag</strong> בגלל כתיבות bulk או דיסק איטי ב-secondary — עם <code>w:"majority"</code> זה נראה ככתיבות איטיות; עם <code>w:1</code> כקריאות ישנות מ-secondaries וסיכון ל-rollback.</li>
<li><strong>בחירות בזמן deploys/תחזוקה</strong>: אפליקציות בלי retryable writes או עם drivers ישנים זורקות שגיאות במשך 10-15 שניות. השתמש ב-<code>rs.stepDown()</code> ל-switchover מתוכנן ותבדוק שה-clients עוברים את זה בשלום.</li>
<li><strong>Queries ארוכים של <code>$regex</code>/<code>$where</code></strong> — הורגים עם <code>db.currentOp()</code> ו-<code>db.killOp(opid)</code>; מגדירים <code>maxTimeMS</code> על ה-queries של האפליקציה.</li></ul>`
      }
    }
  ],
  diagram: `            app (driver: w=majority, retryWrites)
                  |
          +-------+--------+                        sharded:
          v                v                        app -> mongos -> config RS (chunk map)
   [ PRIMARY ] --oplog--> [ SECONDARY ] (AZ-b)                 |--> shard A (RS)  chunks [minKey..c100)
   (AZ-a)      \\--oplog--> [ SECONDARY ] (AZ-c)               |--> shard B (RS)  chunks [c100..c900)
        heartbeat 2s; no primary for 10s -> election (majority)  \\-> shard C (RS)  chunks [c900..maxKey]
        oplog window = time covered by the capped oplog            balancer moves chunks; jumbo can't move`,
  handsOn: [
    { cmd: "mongosh --eval 'rs.status().members.map(m => ({name: m.name, state: m.stateStr, health: m.health, lagSec: m.optimeDate ? Math.round((new Date() - m.optimeDate)/1000) : null}))'", what: { en: "See every replica set member, its state (PRIMARY/SECONDARY) and roughly how far behind it is.", he: "רואים כל חבר ב-replica set, את המצב שלו (PRIMARY/SECONDARY) ובערך כמה הוא מפגר." } },
    { cmd: "mongosh --eval 'rs.printReplicationInfo()'", what: { en: "Check the oplog size and window ('log length start to end').", he: "בודקים את הגודל וה-window של ה-oplog ‏('log length start to end')." } },
    { cmd: "mongosh shop --eval 'db.orders.find({customerId: 4521}).sort({createdAt: -1}).limit(20).explain(\"executionStats\").executionStats'", what: { en: "Compare nReturned vs totalKeysExamined vs totalDocsExamined; look for COLLSCAN.", he: "משווים nReturned מול totalKeysExamined מול totalDocsExamined; מחפשים COLLSCAN." } },
    { cmd: "mongosh --eval 'sh.status(); db.getSiblingDB(\"shop\").orders.getShardDistribution()'", what: { en: "On mongos: see chunk distribution per shard, balancer state and jumbo chunks.", he: "על mongos: רואים את חלוקת ה-chunks לכל shard, מצב ה-balancer ו-jumbo chunks." } }
  ],
  mnemonic: {
    en: "\"Majority or it didn't happen.\" Index order: \"ESR — Equality, Sort, Range.\" Shard key: \"High, even, not rising.\"",
    he: "\"Majority, אחרת זה לא קרה.\" סדר ב-index: \"ESR — Equality, Sort, Range.\" ו-shard key: \"גבוה, אחיד, לא עולה\" (cardinality גבוה, תדירות אחידה, לא מונוטוני)."
  },
  pitfalls: [
    { en: "Using w:1 for important writes — on failover, writes not yet replicated are rolled back and lost from the application's point of view.", he: "להשתמש ב-w:1 לכתיבות חשובות — ב-failover, כתיבות שעוד לא שוכפלו עוברות rollback והולכות לאיבוד מבחינת האפליקציה." },
    { en: "Unbounded arrays inside a document (all comments, all events) — documents grow toward 16 MB, updates slow down and multikey indexes bloat.", he: "מערכים לא חסומים בתוך מסמך (כל התגובות, כל ה-events) — מסמכים גדלים לכיוון 16 MB, עדכונים מאטים ו-multikey indexes מתנפחים." },
    { en: "Sharding on a monotonically increasing key (ObjectId, timestamp) — all inserts hit one shard; or on a low-cardinality key — jumbo chunks that can't be balanced.", he: "Sharding על מפתח שעולה באופן מונוטוני (ObjectId, timestamp) — כל ה-inserts פוגעים ב-shard אחד; או על מפתח עם cardinality נמוך — jumbo chunks שאי אפשר לאזן." },
    { en: "An oplog window shorter than your longest planned maintenance — a secondary down for a night needs a full initial sync.", he: "oplog window קצר מהתחזוקה המתוכננת הכי ארוכה — secondary שהיה למטה לילה אחד צריך initial sync מלא." }
  ],
  interview: [
    {
      q: { en: "What happens to a write acknowledged with w:1 if the primary crashes right after?", he: "מה קורה לכתיבה שאושרה עם w:1 אם ה-primary קורס מיד אחרי?" },
      a: {
        en: "If no secondary replicated it, a secondary without that write is elected. When the old primary rejoins, it rolls back writes that the new primary doesn't have, writing them to a rollback directory. The client was told 'success' but the data is effectively lost. w:'majority' prevents this because a majority-acknowledged write survives any election.",
        he: "אם אף secondary לא שכפל אותה, נבחר secondary שאין לו את הכתיבה. כשה-primary הישן חוזר, הוא עושה rollback לכתיבות שאין ל-primary החדש, וכותב אותן לתיקיית rollback. ה-client קיבל 'הצלחה' אבל ה-data בפועל אבד. w:'majority' מונע את זה כי כתיבה שאושרה ע\"י רוב שורדת כל בחירות."
      }
    },
    {
      q: { en: "How do you choose a shard key for a multi-tenant SaaS 'events' collection?", he: "איך תבחר shard key ל-collection של 'events' ב-SaaS מרובה tenants?" },
      a: {
        en: "Start from the queries: almost all filter by tenant and time range. {tenantId: 1, ts: 1} targets one shard per tenant query, but a huge tenant or the monotonically increasing ts within a tenant can create hot/jumbo chunks. Better: {tenantId: 1, bucket/hashed suffix or eventId: 1} for even distribution while keeping tenant targeting, or hashed tenantId if tenants are similar size. Validate with cardinality/frequency analysis (analyzeShardKey in 7.0+) before committing.",
        he: "מתחילים מה-queries: כמעט כולם מסננים לפי tenant וטווח זמן. ‏{tenantId: 1, ts: 1} מכוון ל-shard אחד לכל query של tenant, אבל tenant ענק או ts שעולה מונוטונית בתוך tenant יכולים ליצור chunks חמים/jumbo. עדיף: ‏{tenantId: 1, bucket/סיומת hashed או eventId: 1} לפיזור אחיד תוך שמירה על כיוון לפי tenant, או tenantId מסוג hashed אם ה-tenants בגודל דומה. מאמתים עם ניתוח cardinality ותדירות (analyzeShardKey מ-7.0) לפני שמתחייבים."
      }
    }
  ],
  quiz: [
    {
      q: { en: "A secondary was offline for 20 hours. rs.printReplicationInfo() shows 'log length start to end: 9 hrs'. What happens when it returns?", he: "Secondary היה מנותק 20 שעות. rs.printReplicationInfo() מראה 'log length start to end: 9 hrs'. מה קורה כשהוא חוזר?" },
      options: [
        { en: "It catches up from the oplog in a few minutes", he: "הוא משלים מה-oplog תוך כמה דקות" },
        { en: "It becomes primary", he: "הוא הופך ל-primary" },
        { en: "It needs a full initial sync because the oplog no longer has the entries it missed", he: "הוא צריך initial sync מלא כי ב-oplog כבר אין את הרשומות שהוא פספס" },
        { en: "It rolls back the primary", he: "הוא עושה rollback ל-primary" }
      ],
      answer: 2,
      explain: { en: "The oplog window (9 h) is shorter than the outage (20 h), so the secondary is 'too stale' and must resync all data. Size the oplog for your longest expected outage.", he: "ה-oplog window ‏(9 שעות) קצר מזמן הנפילה (20 שעות), אז ה-secondary 'ישן מדי' וחייב לסנכרן את כל ה-data מחדש. תגדיר את ה-oplog לפי הנפילה הארוכה ביותר שאתה מצפה לה." }
    },
    {
      q: { en: "Which write concern guarantees an acknowledged write survives a primary failover?", he: "איזה write concern מבטיח שכתיבה שאושרה תשרוד failover של ה-primary?" },
      options: [
        { en: "w: 0", he: "w: 0" },
        { en: "w: 1", he: "w: 1" },
        { en: "w: \"majority\"", he: "w: \"majority\"" },
        { en: "j: false", he: "j: false" }
      ],
      answer: 2,
      explain: { en: "Only a majority-acknowledged write is guaranteed to be on any member that can win an election.", he: "רק כתיבה שאושרה ע\"י רוב מובטחת להימצא על כל חבר שיכול לנצח בבחירות." }
    },
    {
      q: { en: "Query: find({status: 'PAID', customerId: 7}).sort({createdAt: -1}) plus a range on total. Best compound index by ESR?", he: "Query: ‏find({status: 'PAID', customerId: 7}).sort({createdAt: -1}) ועוד טווח על total. מה ה-compound index הכי טוב לפי ESR?" },
      options: [
        { en: "{ total: 1, createdAt: -1, customerId: 1, status: 1 }", he: "{ total: 1, createdAt: -1, customerId: 1, status: 1 }" },
        { en: "{ customerId: 1, status: 1, createdAt: -1, total: 1 }", he: "{ customerId: 1, status: 1, createdAt: -1, total: 1 }" },
        { en: "{ createdAt: -1, customerId: 1, status: 1, total: 1 }", he: "{ createdAt: -1, customerId: 1, status: 1, total: 1 }" },
        { en: "{ total: 1 }", he: "{ total: 1 }" }
      ],
      answer: 1,
      explain: { en: "Equality fields (customerId, status) first, then the Sort field (createdAt), then the Range field (total) — avoids an in-memory sort and keeps the scan tight.", he: "קודם שדות ה-Equality ‏(customerId, status), אחר כך שדה ה-Sort ‏(createdAt), ובסוף שדה ה-Range ‏(total) — נמנעים מ-sort בזיכרון ושומרים על סריקה הדוקה." }
    },
    {
      q: { en: "Why is sharding on { createdAt: 1 } a bad idea for a write-heavy collection?", he: "למה sharding על { createdAt: 1 } הוא רעיון רע ל-collection עם הרבה כתיבות?" },
      options: [
        { en: "Dates can't be shard keys", he: "אי אפשר להשתמש בתאריכים כ-shard key" },
        { en: "Monotonically increasing values send every new insert to the last chunk on a single shard", he: "ערכים שעולים מונוטונית שולחים כל insert חדש ל-chunk האחרון על shard בודד" },
        { en: "It creates too many chunks", he: "זה יוצר יותר מדי chunks" },
        { en: "Range queries on createdAt become impossible", he: "Range queries על createdAt הופכים לבלתי אפשריים" }
      ],
      answer: 1,
      explain: { en: "All new values fall in the [last, maxKey) range, so one shard takes all inserts while the balancer keeps moving old chunks. Use a hashed key or a compound key with a high-cardinality prefix.", he: "כל הערכים החדשים נופלים בטווח [האחרון, maxKey), כך ש-shard אחד מקבל את כל ה-inserts בזמן שה-balancer מזיז chunks ישנים. השתמש במפתח hashed או במפתח מורכב עם prefix בעל cardinality גבוה." }
    }
  ],
  related: ["db-replication", "db-sharding", "db-indexes", "db-sql-vs-nosql", "pr-data-modeling"]
});

/* ---------------------------------------------------------------- glossary */
INFRA.glossary.push(
  { term: "OLAP", track: "data", def: { en: "Online Analytical Processing: workloads that scan and aggregate large volumes of data (dashboards, reports), served by columnar warehouses.", he: "Online Analytical Processing: עומסים שסורקים ומסכמים כמויות גדולות של data (dashboards, דוחות), ומשורתים ע\"י warehouses עמודתיים." }, lesson: "db-olap-columnar" },
  { term: "MergeTree", track: "data", def: { en: "ClickHouse's core table engine: immutable sorted parts merged in the background, with a sparse primary index defined by ORDER BY.", he: "מנוע הטבלאות המרכזי של ClickHouse: parts ממוינים שלא משתנים ומתמזגים ברקע, עם sparse primary index שמוגדר ע\"י ORDER BY." }, lesson: "db-olap-columnar" },
  { term: "Star schema", track: "data", def: { en: "Warehouse model with a central fact table of measures joined to surrounding dimension tables of descriptive attributes.", he: "מודל warehouse עם טבלת fact מרכזית של מדדים שמתחברת לטבלאות dimension מסביב עם מאפיינים תיאוריים." }, lesson: "db-olap-columnar" },
  { term: "Hot partition", track: "data", def: { en: "A partition key receiving a disproportionate share of traffic, hitting per-partition limits (DynamoDB: 1,000 WCU / 3,000 RCU) while the rest of the cluster is idle.", he: "Partition key שמקבל חלק לא פרופורציונלי מהתעבורה ונתקע במגבלות ל-partition (ב-DynamoDB: ‏1,000 WCU / 3,000 RCU) בזמן ששאר ה-cluster בטל." }, lesson: "db-wide-column-kv" },
  { term: "Tombstone", track: "data", def: { en: "A deletion marker in LSM-based stores like Cassandra; purged only after gc_grace_seconds, and expensive to read past in large numbers.", he: "סימון מחיקה במערכות מבוססות LSM כמו Cassandra; נמחק רק אחרי gc_grace_seconds, ויקר לקרוא דרך הרבה כאלה." }, lesson: "db-wide-column-kv" },
  { term: "GSI (Global Secondary Index)", track: "data", def: { en: "A DynamoDB index with its own partition/sort key and capacity, eventually consistent; if it throttles, base-table writes throttle too.", he: "Index ב-DynamoDB עם partition/sort key ו-capacity משלו, eventually consistent; אם הוא מקבל throttle, גם הכתיבות לטבלת הבסיס מקבלות throttle." }, lesson: "db-wide-column-kv" },
  { term: "HNSW", track: "data", def: { en: "Hierarchical Navigable Small World: a layered graph index for approximate nearest-neighbor vector search, tuned with M, ef_construction and ef_search.", he: "Hierarchical Navigable Small World: index מבוסס גרף רב-שכבתי לחיפוש וקטורי approximate nearest-neighbor, מכוונן עם M, ‏ef_construction ו-ef_search." }, lesson: "db-vector" },
  { term: "ANN (Approximate Nearest Neighbor)", track: "data", def: { en: "Vector search that returns almost the true nearest neighbors, trading a bit of recall for orders-of-magnitude lower latency than exact kNN.", he: "חיפוש וקטורי שמחזיר כמעט את השכנים הקרובים האמיתיים, ומוותר על קצת recall בשביל latency נמוך בסדרי גודל לעומת kNN מדויק." }, lesson: "db-vector" },
  { term: "Recall@k", track: "data", def: { en: "The fraction of the true top-k results that a search returns in its top k; the main quality metric for ANN indexes and retrieval.", he: "החלק מתוך ה-top-k האמיתי שהחיפוש מחזיר ב-k התוצאות שלו; מדד האיכות המרכזי ל-indexes של ANN ול-retrieval." }, lesson: "db-vector" },
  { term: "Oplog", track: "data", def: { en: "MongoDB's capped operations log on the primary that secondaries tail to replicate; its time span is the oplog window.", he: "ה-log המוגבל בגודל של פעולות ב-primary של MongoDB, שה-secondaries קוראים כדי לשכפל; טווח הזמן שהוא מכסה הוא ה-oplog window." }, lesson: "db-mongodb" },
  { term: "Write concern", track: "data", def: { en: "MongoDB setting for when a write is acknowledged: w:1 (primary only) or w:'majority' (survives failover), optionally j:true for journaling.", he: "הגדרה ב-MongoDB שקובעת מתי כתיבה מאושרת: w:1 (רק ה-primary) או w:'majority' (שורדת failover), ואופציונלית j:true לכתיבה ל-journal." }, lesson: "db-mongodb" },
  { term: "Jumbo chunk", track: "data", def: { en: "A MongoDB chunk larger than the max chunk size that can't be split (single shard-key value) and so can't be moved by the balancer.", he: "Chunk ב-MongoDB שגדול מגודל ה-chunk המקסימלי ואי אפשר לפצל אותו (ערך shard key יחיד), ולכן ה-balancer לא יכול להזיז אותו." }, lesson: "db-mongodb" }
);

/* ---------------------------------------------------------------- scenario */
(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  INFRA.scenarios.push({
    id: "dynamodb-hot-partition",
    icon: "🌡️",
    title: t("Black Friday: DynamoDB throttles with capacity to spare", "Black Friday: ‏DynamoDB עושה throttle כשיש capacity בשפע"),
    start: "s1",
    steps: {
      s1: {
        text: t("Black Friday, 10:03. PagerDuty: 'order-service 5xx &gt; 8%'. Logs are full of ProvisionedThroughputExceededException from the orders table. Someone in Slack says 'just bump the WCU'. You open CloudWatch.",
                "Black Friday, ‏10:03. PagerDuty: 'order-service 5xx &gt; 8%'. הלוגים מלאים ב-ProvisionedThroughputExceededException מטבלת orders. מישהו ב-Slack כותב 'פשוט תעלו WCU'. אתה פותח את CloudWatch."),
        data: `Table: orders   (provisioned, autoscaling target 70%)
Metric (1-min)                    10:00    10:01    10:02    10:03
ProvisionedWriteCapacityUnits     10,000   10,000   10,000   10,000
ConsumedWriteCapacityUnits         1,180    1,210    1,195    1,204
WriteThrottleEvents                3,912    6,480    7,233    7,810
SuccessfulRequestLatency PutItem   6 ms     9 ms     11 ms    12 ms`,
        choices: [
          c("Raise provisioned WCU to 40,000 right away", "להעלות מיד את ה-WCU ל-40,000", "s2b", -5,
            "The table is using 12% of its capacity and still throttling. More table capacity won't help a single overloaded partition — and it costs money.",
            "הטבלה משתמשת ב-12% מה-capacity שלה ועדיין מקבלת throttle. עוד capacity לטבלה לא יעזור ל-partition בודד שעמוס — וזה עולה כסף."),
          c("Consumed is ~12% of provisioned yet throttling — suspect a hot partition and look at Contributor Insights", "Consumed הוא בערך 12% מה-provisioned ועדיין יש throttle — לחשוד ב-hot partition ולהסתכל ב-Contributor Insights", "s2", 15,
            "Exactly. Throttling far below table capacity is the signature of a hot key: ~1,000-1,200 WCU is right at the per-partition limit.",
            "בדיוק. Throttle הרבה מתחת ל-capacity של הטבלה הוא החתימה של מפתח חם: ‏1,000-1,200 WCU זה בדיוק המגבלה ל-partition."),
          c("Restart the order-service pods", "לעשות restart לפודים של order-service", "s2b", -10,
            "The pods are healthy; DynamoDB is rejecting their writes. Restarting drops in-flight orders and changes nothing.",
            "הפודים בריאים; DynamoDB דוחה את הכתיבות שלהם. restart מפיל הזמנות באמצע ולא משנה כלום.")
        ]
      },
      s2b: {
        text: t("10:09. Nothing improved. Throttle events keep climbing and the checkout error rate is now 11%. The incident commander asks what's really going on.",
                "10:09. שום דבר לא השתפר. ה-throttle events ממשיכים לעלות ושיעור השגיאות ב-checkout הוא עכשיו 11%. ה-incident commander שואל מה באמת קורה."),
        data: `ProvisionedWriteCapacityUnits   40,000
ConsumedWriteCapacityUnits       1,221
WriteThrottleEvents              8,904
order-service: "ProvisionedThroughputExceededException: Throughput exceeds the current capacity for one or more partitions"`,
        choices: [
          c("Read the error carefully: 'one or more partitions'. Enable Contributor Insights and find the key", "לקרוא את השגיאה בעיון: 'one or more partitions'. להפעיל Contributor Insights ולמצוא את המפתח", "s2", 5,
            "Better late than never. The error message literally says partitions, not table.",
            "עדיף מאוחר מאשר אף פעם. הודעת השגיאה אומרת במפורש partitions, לא table."),
          c("Switch the table to on-demand and go back to sleep", "להעביר את הטבלה ל-on-demand ולחזור לישון", "lose", -15,
            "On-demand has the same per-partition limits. The hot key keeps throttling and orders keep failing.",
            "ל-on-demand יש את אותן מגבלות ל-partition. המפתח החם ממשיך לקבל throttle וההזמנות ממשיכות להיכשל.")
        ]
      },
      s2: {
        text: t("Contributor Insights shows the top partition keys for writes. The table key design is PK = ORDERDAY#&lt;date&gt;, SK = &lt;orderId&gt; — chosen so the ops team could 'list today's orders' with one Query.",
                "Contributor Insights מראה את ה-partition keys המובילים בכתיבות. תכנון המפתח של הטבלה הוא PK = ORDERDAY#&lt;date&gt;, ‏SK = &lt;orderId&gt; — נבחר כדי שצוות ה-ops יוכל 'להציג את ההזמנות של היום' עם Query אחד."),
        data: `Contributor Insights — DynamoDBContributorInsights-PKC-orders (throttled + consumed writes)
Rank  Partition key              Share of writes   Throttled
1     ORDERDAY#2026-11-27        96.8%             7,744 /min
2     ORDERDAY#2026-11-26         2.1%                 0
3     ORDERDAY#2026-11-25         0.4%                 0`,
        choices: [
          c("Write-shard the key: PK = ORDERDAY#&lt;date&gt;#&lt;0..19&gt; chosen by hash(orderId) % 20; reads query all 20 shards in parallel", "לעשות write sharding למפתח: ‏PK = ORDERDAY#&lt;date&gt;#&lt;0..19&gt; לפי hash(orderId) % 20; קריאות עושות Query על כל 20 ה-shards במקביל", "s3", 15,
            "Right fix. 20 shards × 1,000 WCU = up to 20,000 WCU of headroom for the day. Deterministic suffix from orderId lets you still GetItem by order.",
            "הפתרון הנכון. ‏20 shards × 1,000 WCU = עד 20,000 WCU של מרווח ליום. סיומת דטרמיניסטית מ-orderId מאפשרת עדיין GetItem לפי הזמנה."),
          c("Put a Redis cache in front of DynamoDB", "לשים Redis cache לפני DynamoDB", "s2c", -5,
            "A cache helps reads. This is a write hot spot — every order still has to be written.",
            "Cache עוזר לקריאות. זה hot spot של כתיבות — כל הזמנה עדיין חייבת להיכתב."),
          c("Wait for adaptive capacity to fix it automatically", "לחכות ש-adaptive capacity יתקן את זה לבד", "s2c", -5,
            "Adaptive capacity can split a hot partition by sort-key range, but every new orderId for today lands in the same partition key; at peak you're still far above what one key can sustain, and you're losing orders while hoping.",
            "Adaptive capacity יכול לפצל partition חם לפי טווחי sort key, אבל כל orderId חדש של היום נוחת באותו partition key; בשיא אתה עדיין הרבה מעל מה שמפתח אחד יכול להחזיק, ואתה מאבד הזמנות בזמן שאתה מקווה.")
        ]
      },
      s2c: {
        text: t("10:20. Still throttling, and the CFO is now in the incident channel. You need a change that actually spreads the writes.",
                "10:20. עדיין יש throttle, וה-CFO כבר בערוץ של התקלה. אתה צריך שינוי שבאמת מפזר את הכתיבות."),
        choices: [
          c("Ship the write-sharded key behind a feature flag (new writes only)", "להעלות את המפתח עם ה-write sharding מאחורי feature flag (רק לכתיבות חדשות)", "s3", 5,
            "Good. New writes spread across 20 partition keys; the read path queries both old and new formats for today.",
            "טוב. כתיבות חדשות מתפזרות על 20 partition keys; נתיב הקריאה עושה Query גם על הפורמט הישן וגם על החדש להיום."),
          c("Drop the ORDERDAY key and Scan the table for the ops dashboard", "לוותר על מפתח ה-ORDERDAY ולעשות Scan לטבלה בשביל ה-dashboard של ops", "lose", -15,
            "Scanning a multi-hundred-GB table every refresh burns read capacity, slows to minutes and throttles the reads checkout depends on.",
            "Scan לטבלה של מאות GB בכל רענון שורף read capacity, לוקח דקות ועושה throttle לקריאות שה-checkout תלוי בהן.")
        ]
      },
      s3: {
        text: t("10:31. The sharded key is live. Base-table WriteThrottleEvents drop to almost zero... then climb again. CloudWatch now shows a different resource.",
                "10:31. המפתח עם ה-sharding באוויר. ה-WriteThrottleEvents של טבלת הבסיס יורדים כמעט לאפס... ואז עולים שוב. CloudWatch מראה עכשיו resource אחר."),
        data: `Metric (1-min)                              10:30    10:31    10:32    10:33
orders  WriteThrottleEvents                 7,620      140      910    2,480
GSI by-status  ConsumedWriteCapacityUnits     998    1,004    1,001      999
GSI by-status  WriteThrottleEvents          4,100    6,900    7,400    7,950
GSI key: GSI1PK = status   (values: PENDING | PAID | SHIPPED)`,
        choices: [
          c("The GSI keyed on status is a 3-value hot partition and back-pressures base writes — shard the GSI key too (STATUS#PAID#&lt;0..19&gt;)", "ה-GSI שממופתח לפי status הוא hot partition עם 3 ערכים ועושה back-pressure לכתיבות לבסיס — לעשות sharding גם למפתח ה-GSI ‏(STATUS#PAID#&lt;0..19&gt;)", "s4", 15,
            "Spot on. A throttled GSI throttles base-table writes. A low-cardinality GSI key is the same bug in another place.",
            "בול. GSI שמקבל throttle עושה throttle לכתיבות של טבלת הבסיס. מפתח GSI עם cardinality נמוך הוא אותו באג במקום אחר."),
          c("Increase the GSI's provisioned WCU", "להעלות את ה-WCU של ה-GSI", "s3b", 0,
            "The GSI is consuming ~1,000 WCU — the single-partition ceiling. More GSI capacity won't help one hot key, same as before.",
            "ה-GSI צורך בערך 1,000 WCU — התקרה של partition בודד. עוד capacity ל-GSI לא יעזור למפתח חם אחד, בדיוק כמו קודם."),
          c("Ignore it — GSIs are async so they can't affect writes", "להתעלם — GSIs הם async אז הם לא יכולים להשפיע על כתיבות", "lose", -15,
            "Wrong: when a GSI can't keep up, DynamoDB throttles writes on the base table to protect it. Orders start failing again.",
            "לא נכון: כש-GSI לא עומד בקצב, DynamoDB עושה throttle לכתיבות בטבלת הבסיס כדי להגן עליו. ההזמנות מתחילות להיכשל שוב.")
        ]
      },
      s3b: {
        text: t("10:38. GSI capacity is at 20,000 WCU, consumption is still pinned at ~1,000 and base writes are still throttled.",
                "10:38. ה-capacity של ה-GSI על 20,000 WCU, הצריכה עדיין תקועה על בערך 1,000 והכתיבות לבסיס עדיין מקבלות throttle."),
        choices: [
          c("Shard the GSI partition key as well, and write the ops 'pending orders' view against 20 shards", "לעשות sharding גם ל-partition key של ה-GSI, ולכתוב את התצוגה של 'הזמנות ממתינות' ל-ops מול 20 shards", "s4", 5,
            "Yes — same pattern, same fix.",
            "כן — אותו דפוס, אותו פתרון."),
          c("Delete the GSI permanently in the middle of the peak", "למחוק את ה-GSI לצמיתות באמצע השיא", "s4", -5,
            "It stops the throttling, but the ops team just lost their fulfillment view during the busiest day. Works, at a real cost — and recreating a GSI on a big table takes hours.",
            "זה עוצר את ה-throttle, אבל צוות ה-ops איבד את תצוגת ה-fulfillment ביום הכי עמוס. עובד, במחיר אמיתי — ויצירה מחדש של GSI על טבלה גדולה לוקחת שעות.")
        ]
      },
      s4: {
        text: t("10:52. Throttling is gone, 5xx back under 0.1%. Orders are flowing at 9,000 writes/s. Time to make sure this never happens again.",
                "10:52. ה-throttle נעלם, ה-5xx חזר מתחת ל-0.1%. הזמנות זורמות ב-9,000 כתיבות בשנייה. הגיע הזמן לוודא שזה לא יקרה שוב."),
        data: `orders  WriteThrottleEvents  0
GSI by-status WriteThrottleEvents  0
Top partition key share (Contributor Insights): 5.3% (ORDERDAY#2026-11-27#14)`,
        choices: [
          c("Postmortem: key-design review for every table/GSI against peak traffic, CloudWatch alarm on throttle events + Contributor Insights always on, load test with Black Friday volume", "Postmortem: סקירת תכנון מפתחות לכל טבלה ו-GSI מול תעבורת שיא, CloudWatch alarm על throttle events ו-Contributor Insights תמיד פעיל, load test בנפח של Black Friday", "win", 15,
            "That's how an incident turns into a better system: fix the class of bug, add detection, and rehearse the peak.",
            "ככה תקלה הופכת למערכת טובה יותר: מתקנים את סוג הבאג, מוסיפים זיהוי, ומתרגלים את השיא."),
          c("Close the incident — it's fixed", "לסגור את התקלה — זה תוקן", "win", 0,
            "It's fixed today. Without a review, the next low-cardinality key will page someone else next year.",
            "זה תוקן היום. בלי סקירה, המפתח הבא עם cardinality נמוך יעיר מישהו אחר בשנה הבאה.")
        ]
      },
      win: {
        text: t("Incident resolved. You recognized the hot-partition signature (throttling far below table capacity), spread writes with write sharding, caught the low-cardinality GSI back-pressure, and turned it into lasting guardrails.",
                "התקלה נפתרה. זיהית את החתימה של hot partition (throttle הרבה מתחת ל-capacity של הטבלה), פיזרת את הכתיבות עם write sharding, תפסת את ה-back-pressure של GSI עם cardinality נמוך, והפכת את זה ל-guardrails קבועים."),
        end: "win"
      },
      lose: {
        text: t("Orders kept failing through the peak hour. Lesson: per-partition limits (1,000 WCU / 3,000 RCU) apply in both provisioned and on-demand modes, and to GSIs too. Throttling with spare table capacity means a hot key — fix the key design, not the capacity number.",
                "הזמנות המשיכו להיכשל לאורך שעת השיא. הלקח: המגבלות ל-partition ‏(1,000 WCU / 3,000 RCU) חלות גם ב-provisioned וגם ב-on-demand, וגם על GSIs. Throttle כשיש capacity פנוי בטבלה אומר מפתח חם — מתקנים את תכנון המפתח, לא את מספר ה-capacity."),
        end: "lose"
      }
    },
    lessons: ["db-wide-column-kv", "db-sharding"]
  });
})();
