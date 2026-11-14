window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// Data track: streaming, CDC, lakehouse formats, data contracts, data quality (order 40-44)

INFRA.lessons.push({
  id: "data-stream-processing",
  track: "data",
  order: 40,
  icon: "🌊",
  level: 3,
  minutes: 18,
  title: { en: "Stream Processing: Flink, Kafka Streams, Spark", he: "Stream Processing: Flink, Kafka Streams ו-Spark" },
  tldr: {
    en: "A stream processor is a stateful program that never ends: it groups events by event time into windows, uses watermarks to decide when a window is complete, keeps state in RocksDB, and snapshots that state plus the Kafka offsets into consistent checkpoints so a crash replays exactly what is needed.",
    he: "Stream processor הוא תוכנית עם state שלא נגמרת אף פעם: הוא מקבץ events לפי event time לתוך חלונות, משתמש ב-watermarks כדי להחליט מתי חלון הושלם, שומר state ב-RocksDB, ומצלם את ה-state יחד עם ה-offsets של Kafka ל-checkpoint עקבי, כך שאחרי קריסה הוא משחזר בדיוק את מה שצריך."
  },
  analogy: {
    en: "A toll-road accountant gets receipts by mail. Receipts are stamped with the time the car passed (event time), but the mail arrives late and out of order (processing time). He keeps one envelope per car per 5-minute slot (windows and state). He closes the 10:00-10:05 envelope only once the postman says \"nothing older than 10:05 is still on the way\" (the watermark). Every hour he photocopies all open envelopes together with the page number of the mail log he reached (a checkpoint), so if his office burns he restarts from the copy and re-reads the mail from that page.",
    he: "רואה חשבון של כביש אגרה מקבל קבלות בדואר. על כל קבלה חותמת הזמן שבו הרכב עבר (event time), אבל הדואר מגיע באיחור ולא לפי הסדר (processing time). הוא מחזיק מעטפה אחת לכל רכב לכל משבצת של 5 דקות (חלונות ו-state). הוא סוגר את המעטפה של 10:00-10:05 רק כשהדוור אומר \"שום דבר ישן מ-10:05 כבר לא בדרך\" (ה-watermark). כל שעה הוא מצלם את כל המעטפות הפתוחות יחד עם מספר העמוד ביומן הדואר שאליו הגיע (checkpoint), כך שאם המשרד נשרף הוא מתחיל מהצילום וקורא שוב את הדואר מאותו עמוד."
  },
  sections: [
    {
      h: { en: "Three engines, three shapes", he: "שלושה מנועים, שלוש צורות" },
      body: {
        en: `<table>
<tr><th></th><th>Apache Flink</th><th>Kafka Streams</th><th>Spark Structured Streaming</th></tr>
<tr><td>What it is</td><td>A cluster (JobManager + TaskManagers), true record-at-a-time</td><td>A Java library inside your app; no cluster</td><td>Micro-batches on a Spark cluster (default trigger: next batch as soon as the previous ends)</td></tr>
<tr><td>Latency</td><td>ms</td><td>ms</td><td>~100 ms – seconds</td></tr>
<tr><td>Sources/sinks</td><td>Kafka, Kinesis, Pulsar, files, CDC, JDBC, Iceberg…</td><td>Kafka in, Kafka out only</td><td>Kafka, Kinesis, files, Delta/Iceberg</td></tr>
<tr><td>State</td><td>Heap or RocksDB, checkpoints to S3</td><td>RocksDB + changelog topic in Kafka</td><td>HDFS-backed or RocksDB state store in the checkpoint dir</td></tr>
<tr><td>Scale unit</td><td>Parallelism (≤ maxParallelism key groups)</td><td>Input partitions (max instances = partitions)</td><td>Spark executors / shuffle partitions</td></tr>
<tr><td>Exactly-once</td><td>Checkpoints + 2-phase-commit sinks</td><td><code>processing.guarantee=exactly_once_v2</code></td><td>Replayable source + checkpointed offsets + idempotent/transactional sink</td></tr>
</table>
<p>Rule of thumb: <strong>Kafka Streams</strong> when everything is Kafka-to-Kafka and you want to ship it as a normal microservice (scales like any Deployment). <strong>Flink</strong> when you need many sources, huge state (TBs), complex event time or Flink SQL for analysts. <strong>Spark</strong> when the team already lives in Spark/Databricks and seconds of latency are fine.</p>
<blockquote>💡 Real world: Managed options remove most of the cluster pain: Amazon Managed Service for Apache Flink, Confluent Cloud for Flink (Flink SQL over Confluent topics), Databricks for Spark. Self-hosted Flink on Kubernetes almost always means the <strong>Flink Kubernetes Operator</strong> (<code>FlinkDeployment</code> CRD).</blockquote>`,
        he: `<table>
<tr><th></th><th>Apache Flink</th><th>Kafka Streams</th><th>Spark Structured Streaming</th></tr>
<tr><td>מה זה</td><td>קלאסטר (JobManager + TaskManagers), עיבוד אמיתי רשומה-אחר-רשומה</td><td>ספריית Java בתוך האפליקציה שלך; אין קלאסטר</td><td>Micro-batches על קלאסטר Spark (ברירת מחדל: batch הבא מיד כשהקודם נגמר)</td></tr>
<tr><td>Latency</td><td>ms</td><td>ms</td><td>~100 ms עד שניות</td></tr>
<tr><td>Sources/sinks</td><td>Kafka, Kinesis, Pulsar, קבצים, CDC, JDBC, Iceberg…</td><td>רק Kafka פנימה ו-Kafka החוצה</td><td>Kafka, Kinesis, קבצים, Delta/Iceberg</td></tr>
<tr><td>State</td><td>Heap או RocksDB, checkpoints ל-S3</td><td>RocksDB + changelog topic ב-Kafka</td><td>State store מבוסס HDFS או RocksDB בתיקיית ה-checkpoint</td></tr>
<tr><td>יחידת סקייל</td><td>Parallelism (עד maxParallelism של key groups)</td><td>Partitions של הקלט (מקסימום instances = מספר ה-partitions)</td><td>Executors של Spark ו-shuffle partitions</td></tr>
<tr><td>Exactly-once</td><td>Checkpoints + sinks עם 2-phase commit</td><td><code>processing.guarantee=exactly_once_v2</code></td><td>מקור שאפשר לנגן מחדש + offsets ב-checkpoint + sink אידמפוטנטי או טרנזקציוני</td></tr>
</table>
<p>כלל אצבע: <strong>Kafka Streams</strong> כשהכול זה Kafka-to-Kafka ואתה רוצה לשחרר את זה כמיקרו-סרוויס רגיל (עושה סקייל כמו כל Deployment). <strong>Flink</strong> כשיש הרבה מקורות, state ענק (TBs), event time מורכב או Flink SQL בשביל אנליסטים. <strong>Spark</strong> כשהצוות כבר חי ב-Spark או Databricks ושניות של latency זה בסדר.</p>
<blockquote>💡 מהשטח: אופציות מנוהלות מורידות את רוב הכאב של הקלאסטר: Amazon Managed Service for Apache Flink, Confluent Cloud for Flink (Flink SQL מעל topics של Confluent), ו-Databricks בשביל Spark. Flink בניהול עצמי על Kubernetes כמעט תמיד אומר <strong>Flink Kubernetes Operator</strong> (ה-CRD <code>FlinkDeployment</code>).</blockquote>`
      }
    },
    {
      h: { en: "Event time, windows and watermarks", he: "Event time, חלונות ו-watermarks" },
      body: {
        en: `<p><strong>Processing time</strong> = the clock of the machine when the event is processed. <strong>Event time</strong> = the timestamp inside the event (when the card was swiped). A phone that was offline in a tunnel sends a 10:02 event at 10:09. Group by processing time and your "10:00-10:05" counts change every time you replay or lag; group by event time and the answer is deterministic.</p>
<ul>
<li><strong>Tumbling</strong> — fixed, non-overlapping: [10:00,10:05), [10:05,10:10). Every event in exactly one window.</li>
<li><strong>Sliding (hop)</strong> — size 5 min, slide 1 min: each event lands in 5 windows. State and output ×5.</li>
<li><strong>Session</strong> — per key, closes after a gap of inactivity (e.g. 30 min). Window length is data-driven.</li>
</ul>
<p>A <strong>watermark</strong> W(t) is the engine's claim "no more events with event time ≤ t will arrive". It is usually <code>max event time seen − allowed out-of-orderness</code>. When the watermark passes a window's end, the window fires. Events that arrive later are <strong>late data</strong>: dropped by default, or kept with <code>allowedLateness</code> (window re-fires with an update) or routed to a side output.</p>
<pre>-- Flink SQL: watermark declared on the source table
CREATE TABLE payments (
  card_id  STRING,
  amount   DECIMAL(10,2),
  country  STRING,
  ts       TIMESTAMP(3),
  WATERMARK FOR ts AS ts - INTERVAL '30' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'payments',
  'properties.bootstrap.servers' = 'kafka:9092',
  'properties.group.id' = 'fraud-detector',
  'scan.startup.mode' = 'group-offsets',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'http://schema-registry:8081'
);</pre>
<blockquote>⚠️ Production tip: watermarks advance per source partition and the operator takes the <strong>minimum</strong>. One idle Kafka partition (no events) freezes the watermark and no window ever fires. Set <code>'scan.watermark.idle-timeout' = '1 min'</code> (or <code>table.exec.source.idle-timeout</code>) so idle partitions are ignored.</blockquote>`,
        he: `<p><strong>Processing time</strong> = השעון של המכונה ברגע שה-event מעובד. <strong>Event time</strong> = ה-timestamp שבתוך ה-event (מתי העבירו את הכרטיס). טלפון שהיה offline במנהרה שולח ב-10:09 אירוע של 10:02. אם מקבצים לפי processing time, הספירה של "10:00-10:05" משתנה בכל replay או lag; אם מקבצים לפי event time, התשובה דטרמיניסטית.</p>
<ul>
<li><strong>Tumbling</strong> — קבועים ולא חופפים: [10:00,10:05), [10:05,10:10). כל event נמצא בחלון אחד בדיוק.</li>
<li><strong>Sliding (hop)</strong> — גודל 5 דקות, קפיצה של דקה: כל event נכנס ל-5 חלונות. ה-state וה-output פי 5.</li>
<li><strong>Session</strong> — לכל key, נסגר אחרי פער של חוסר פעילות (למשל 30 דקות). אורך החלון נקבע לפי הנתונים.</li>
</ul>
<p><strong>Watermark</strong> W(t) הוא ההצהרה של המנוע: "לא יגיעו יותר events עם event time ≤ t". בדרך כלל זה <code>max event time seen − allowed out-of-orderness</code>. כשה-watermark עובר את סוף החלון, החלון נורה (fires). Events שמגיעים אחר כך הם <strong>late data</strong>: נזרקים כברירת מחדל, או נשמרים עם <code>allowedLateness</code> (החלון נורה שוב עם עדכון), או מנותבים ל-side output.</p>
<pre>-- Flink SQL: watermark declared on the source table
CREATE TABLE payments (
  card_id  STRING,
  amount   DECIMAL(10,2),
  country  STRING,
  ts       TIMESTAMP(3),
  WATERMARK FOR ts AS ts - INTERVAL '30' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'payments',
  'properties.bootstrap.servers' = 'kafka:9092',
  'properties.group.id' = 'fraud-detector',
  'scan.startup.mode' = 'group-offsets',
  'format' = 'avro-confluent',
  'avro-confluent.url' = 'http://schema-registry:8081'
);</pre>
<blockquote>⚠️ טיפ לפרודקשן: watermarks מתקדמים לכל partition של המקור, וה-operator לוקח את ה-<strong>מינימום</strong>. partition אחד של Kafka שאין בו events מקפיא את ה-watermark ואף חלון לא נורה. הגדר <code>'scan.watermark.idle-timeout' = '1 min'</code> (או <code>table.exec.source.idle-timeout</code>) כדי שה-partitions הריקים ייחשבו idle ולא יעכבו.</blockquote>`
      }
    },
    {
      h: { en: "State, checkpoints and exactly-once sinks", he: "State, checkpoints ו-sinks עם exactly-once" },
      body: {
        en: `<p>Counting per card per window means <strong>state</strong>. Flink offers two backends: <code>HashMapStateBackend</code> (objects on the JVM heap: fast, limited by RAM, GC pain above ~10 GB) and <code>EmbeddedRocksDBStateBackend</code> (state on local SSD, only limited by disk, supports <strong>incremental checkpoints</strong> that upload only new SST files).</p>
<p><strong>Checkpoints</strong> use asynchronous barrier snapshotting (Chandy-Lamport): the JobManager injects a barrier into every source; when an operator has seen the barrier on all inputs it snapshots its state; the sources record their Kafka offsets. Result: offsets + all state at one consistent cut. On failure Flink restores the last completed checkpoint and rewinds Kafka to those offsets. <strong>Savepoints</strong> are the same thing triggered manually, in a portable format, for upgrades and rescaling.</p>
<pre># flink-conf / config.yaml
state.backend.type: rocksdb
state.backend.incremental: true
execution.checkpointing.interval: 60s
execution.checkpointing.mode: EXACTLY_ONCE
execution.checkpointing.min-pause: 30s
execution.checkpointing.timeout: 10min
state.checkpoints.dir: s3://flink-state/fraud/checkpoints
state.savepoints.dir: s3://flink-state/fraud/savepoints
execution.checkpointing.externalized-checkpoint-retention: RETAIN_ON_CANCELLATION</pre>
<p>Internal state is exactly-once after restore, but the <strong>outside world</strong> already saw the replayed output. To get end-to-end exactly-once the sink must be either <strong>idempotent</strong> (upsert by key into Postgres/Iceberg) or <strong>transactional</strong>: Flink's <code>KafkaSink</code> with <code>DeliveryGuarantee.EXACTLY_ONCE</code> opens a Kafka transaction per checkpoint and commits it only when the checkpoint completes (two-phase commit). Downstream consumers must use <code>isolation.level=read_committed</code>, and they see results only once per checkpoint interval — that is your added latency.</p>
<blockquote>⚠️ Production tip: the Kafka producer's <code>transaction.timeout.ms</code> must be larger than checkpoint interval + max expected downtime, but it is capped by the broker's <code>transaction.max.timeout.ms</code> (default 15 min). Too short and the broker aborts transactions during a long restart: silent data loss in the output topic.</blockquote>`,
        he: `<p>לספור לכל כרטיס בכל חלון זה <strong>state</strong>. ל-Flink יש שני backends: <code>HashMapStateBackend</code> (אובייקטים על ה-heap של ה-JVM: מהיר, מוגבל ב-RAM, כאב ראש של GC מעל ~10 GB) ו-<code>EmbeddedRocksDBStateBackend</code> (state על SSD מקומי, מוגבל רק בדיסק, ותומך ב-<strong>incremental checkpoints</strong> שמעלים רק קבצי SST חדשים).</p>
<p><strong>Checkpoints</strong> עובדים עם asynchronous barrier snapshotting (Chandy-Lamport): ה-JobManager מזריק barrier לכל source; כש-operator ראה את ה-barrier בכל הכניסות שלו, הוא מצלם את ה-state שלו; ה-sources רושמים את ה-offsets שלהם ב-Kafka. התוצאה: offsets וכל ה-state בחתך עקבי אחד. בכשל Flink משחזר את ה-checkpoint האחרון שהושלם ומחזיר את Kafka לאותם offsets. <strong>Savepoints</strong> הם אותו דבר, אבל מופעלים ידנית ובפורמט נייד, בשביל שדרוגים ו-rescaling.</p>
<pre># flink-conf / config.yaml
state.backend.type: rocksdb
state.backend.incremental: true
execution.checkpointing.interval: 60s
execution.checkpointing.mode: EXACTLY_ONCE
execution.checkpointing.min-pause: 30s
execution.checkpointing.timeout: 10min
state.checkpoints.dir: s3://flink-state/fraud/checkpoints
state.savepoints.dir: s3://flink-state/fraud/savepoints
execution.checkpointing.externalized-checkpoint-retention: RETAIN_ON_CANCELLATION</pre>
<p>ה-state הפנימי הוא exactly-once אחרי שחזור, אבל <strong>העולם החיצוני</strong> כבר ראה את ה-output שנוגן מחדש. כדי לקבל exactly-once מקצה לקצה, ה-sink חייב להיות <strong>אידמפוטנטי</strong> (upsert לפי key לתוך Postgres או Iceberg) או <strong>טרנזקציוני</strong>: ה-<code>KafkaSink</code> של Flink עם <code>DeliveryGuarantee.EXACTLY_ONCE</code> פותח טרנזקציה ב-Kafka לכל checkpoint ועושה לה commit רק כשה-checkpoint מסתיים (two-phase commit). הצרכנים למטה חייבים <code>isolation.level=read_committed</code>, והם רואים תוצאות רק פעם ב-checkpoint interval — זה ה-latency שנוסף לך.</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-<code>transaction.timeout.ms</code> של ה-producer חייב להיות גדול מה-checkpoint interval ועוד זמן ההשבתה המקסימלי הצפוי, אבל הוא חסום על ידי <code>transaction.max.timeout.ms</code> של ה-broker (ברירת מחדל 15 דקות). קצר מדי, וה-broker יבטל טרנזקציות בזמן restart ארוך: איבוד נתונים שקט ב-output topic.</blockquote>`
      }
    },
    {
      h: { en: "Backpressure, scaling and rescaling state", he: "Backpressure, סקייל ו-rescaling של state" },
      body: {
        en: `<p><strong>Backpressure</strong>: when a sink (say, a slow Elasticsearch) can't keep up, Flink's credit-based flow control stops sending buffers upstream, operators fill up, and eventually the source simply reads Kafka slower. Nothing crashes — <strong>consumer lag grows</strong>. The danger is checkpoints: barriers queue behind full buffers, checkpoints time out, and after several failures the job restarts and replays even more. Mitigations: <strong>unaligned checkpoints</strong> (<code>execution.checkpointing.unaligned.enabled: true</code>) and <strong>buffer debloating</strong>.</p>
<p>Find the bottleneck in the Flink UI: the first operator that is <em>busy</em> (busyTimeMsPerSecond near 1000) while its upstream is <em>backpressured</em> is the culprit. Fix that operator (more parallelism, async I/O, batching), not the source.</p>
<p><strong>Rescaling keyed state</strong>: Flink hashes each key into one of <code>maxParallelism</code> <strong>key groups</strong> (fixed for the life of the job's state; default is derived from parallelism, min 128). Rescaling from 8 to 16 tasks = take a savepoint, restart with <code>-p 16</code>, key groups are redistributed. You can never exceed <code>maxParallelism</code> without losing state, so set it explicitly up front (e.g. 720 or 1024).</p>
<pre># Flink: rescale with a savepoint
flink stop --savepointPath s3://flink-state/fraud/savepoints 3f2a9c1e...
flink run -s s3://flink-state/fraud/savepoints/savepoint-3f2a9c-8b1d -p 16 fraud.jar

# Kafka Streams: scaling = more instances, but never more than input partitions
kubectl scale deploy/fraud-streams --replicas=12   # topic has 12 partitions -&gt; max useful</pre>
<blockquote>💡 Real world: in Kafka Streams a new instance must restore its RocksDB from the changelog topic before serving — tens of GBs can take many minutes. Set <code>num.standby.replicas=1</code> so a warm copy exists elsewhere, and use a StatefulSet with persistent volumes so restarts keep local state.</blockquote>`,
        he: `<p><strong>Backpressure</strong>: כש-sink (נגיד Elasticsearch איטי) לא עומד בקצב, ה-flow control מבוסס credits של Flink מפסיק לשלוח buffers מלמעלה, ה-operators מתמלאים, ובסוף ה-source פשוט קורא מ-Kafka לאט יותר. שום דבר לא קורס — <strong>ה-consumer lag גדל</strong>. הסכנה היא ה-checkpoints: ה-barriers עומדים בתור מאחורי buffers מלאים, checkpoints נכשלים ב-timeout, ואחרי כמה כישלונות ה-job עושה restart ומנגן עוד יותר. פתרונות: <strong>unaligned checkpoints</strong> (<code>execution.checkpointing.unaligned.enabled: true</code>) ו-<strong>buffer debloating</strong>.</p>
<p>מוצאים את צוואר הבקבוק ב-UI של Flink: ה-operator הראשון שהוא <em>busy</em> (busyTimeMsPerSecond קרוב ל-1000) בזמן שמי שלפניו <em>backpressured</em> הוא האשם. מתקנים את ה-operator הזה (יותר parallelism, async I/O, batching), לא את ה-source.</p>
<p><strong>Rescaling של keyed state</strong>: Flink עושה hash לכל key לאחת מתוך <code>maxParallelism</code> <strong>key groups</strong> (קבוע לכל חיי ה-state של ה-job; ברירת המחדל נגזרת מה-parallelism, מינימום 128). לעבור מ-8 ל-16 tasks = לקחת savepoint, להפעיל מחדש עם <code>-p 16</code>, וה-key groups מתחלקים מחדש. אי אפשר לעבור את <code>maxParallelism</code> בלי לאבד state, אז קבע אותו מפורשות מההתחלה (למשל 720 או 1024).</p>
<pre># Flink: rescale with a savepoint
flink stop --savepointPath s3://flink-state/fraud/savepoints 3f2a9c1e...
flink run -s s3://flink-state/fraud/savepoints/savepoint-3f2a9c-8b1d -p 16 fraud.jar

# Kafka Streams: scaling = more instances, but never more than input partitions
kubectl scale deploy/fraud-streams --replicas=12   # topic has 12 partitions -&gt; max useful</pre>
<blockquote>💡 מהשטח: ב-Kafka Streams instance חדש חייב לשחזר את ה-RocksDB שלו מה-changelog topic לפני שהוא מתחיל לעבוד — עשרות GB יכולים לקחת הרבה דקות. הגדר <code>num.standby.replicas=1</code> כדי שיהיה עותק חם במקום אחר, והשתמש ב-StatefulSet עם persistent volumes כדי ש-restart ישמור את ה-state המקומי.</blockquote>`
      }
    },
    {
      h: { en: "Worked example: fraud detection in 5-minute windows", he: "דוגמה מלאה: זיהוי הונאות בחלונות של 5 דקות" },
      body: {
        en: `<p>Requirement: flag a card that makes more than 10 payments, or pays from more than 2 countries, within 5 minutes. Input: 40k payments/s on a 48-partition <code>payments</code> topic keyed by <code>card_id</code>.</p>
<pre>-- Flink SQL, window table-valued function (TVF)
INSERT INTO fraud_alerts
SELECT card_id, window_start, window_end,
       COUNT(*)                AS tx_count,
       SUM(amount)             AS total,
       COUNT(DISTINCT country) AS countries
FROM TABLE(
  TUMBLE(TABLE payments, DESCRIPTOR(ts), INTERVAL '5' MINUTES))
GROUP BY card_id, window_start, window_end
HAVING COUNT(*) &gt; 10 OR COUNT(DISTINCT country) &gt; 2;

-- Sliding version (catches bursts that straddle a boundary): 5 min windows every 1 min
-- FROM TABLE(HOP(TABLE payments, DESCRIPTOR(ts), INTERVAL '1' MINUTES, INTERVAL '5' MINUTES))</pre>
<p>Sizing the state: ~3M active cards per 5 minutes × (count + sum + a small set of countries ≈ 100 bytes) ≈ 300 MB per window. Tumbling keeps ~1-2 windows alive (current + waiting for the watermark): fine on heap. The HOP version keeps 5 overlapping windows: ~1.5 GB, still fine, but a 24-hour session window per card would be many GBs → RocksDB.</p>
<p>Latency budget: 30 s out-of-orderness + window length. A burst at 10:00:10 is reported at ~10:05:30 with tumbling, ~10:01:30 at best with hop. If the business needs "block within 2 seconds", windows are the wrong tool: use a keyed process function with per-event state and timers (or a rule engine at authorization time), and keep windows for reporting.</p>
<blockquote>💡 Real world: the late-data choice is a business decision. For fraud, a payment that arrives 10 minutes late is still interesting — route late events to a side output topic that a second job scores, instead of silently dropping them.</blockquote>`,
        he: `<p>הדרישה: לסמן כרטיס שמבצע יותר מ-10 תשלומים, או משלם מיותר מ-2 מדינות, בתוך 5 דקות. קלט: 40k תשלומים בשנייה על topic בשם <code>payments</code> עם 48 partitions ו-key של <code>card_id</code>.</p>
<pre>-- Flink SQL, window table-valued function (TVF)
INSERT INTO fraud_alerts
SELECT card_id, window_start, window_end,
       COUNT(*)                AS tx_count,
       SUM(amount)             AS total,
       COUNT(DISTINCT country) AS countries
FROM TABLE(
  TUMBLE(TABLE payments, DESCRIPTOR(ts), INTERVAL '5' MINUTES))
GROUP BY card_id, window_start, window_end
HAVING COUNT(*) &gt; 10 OR COUNT(DISTINCT country) &gt; 2;

-- Sliding version (catches bursts that straddle a boundary): 5 min windows every 1 min
-- FROM TABLE(HOP(TABLE payments, DESCRIPTOR(ts), INTERVAL '1' MINUTES, INTERVAL '5' MINUTES))</pre>
<p>חישוב גודל ה-state: ~3M כרטיסים פעילים ב-5 דקות × (count + sum + קבוצה קטנה של מדינות ≈ 100 bytes) ≈ 300 MB לחלון. Tumbling מחזיק בחיים 1-2 חלונות (הנוכחי ומי שמחכה ל-watermark): מספיק heap. גרסת ה-HOP מחזיקה 5 חלונות חופפים: ~1.5 GB, עדיין בסדר, אבל session window של 24 שעות לכל כרטיס זה הרבה GB → RocksDB.</p>
<p>תקציב latency: 30 שניות של out-of-orderness ועוד אורך החלון. התפרצות ב-10:00:10 תדווח בערך ב-10:05:30 עם tumbling, ובמקרה הטוב ב-10:01:30 עם hop. אם הביזנס צריך "לחסום תוך 2 שניות", חלונות הם הכלי הלא נכון: משתמשים ב-keyed process function עם state ו-timers לכל event (או rule engine בזמן ה-authorization), ומשאירים את החלונות לדיווח.</p>
<blockquote>💡 מהשטח: ההחלטה מה לעשות עם late data היא החלטה עסקית. בהונאות, תשלום שמגיע באיחור של 10 דקות עדיין מעניין — מנתבים late events ל-side output topic ש-job שני מנקד, במקום לזרוק אותם בשקט.</blockquote>`
      }
    }
  ],
  diagram: "Kafka payments (48 partitions)\n   | offsets + watermark (max ts - 30s)\n   v\n[source x48] -> keyBy(card_id) -> [5-min TUMBLE window, state in RocksDB] -> [KafkaSink EXACTLY_ONCE] -> fraud_alerts\n                         ^ barrier every 60s                         |\n                         +---- checkpoint: offsets + state -> s3://flink-state",
  handsOn: [
    { cmd: "kubectl get flinkdeployment -n streaming && kubectl describe flinkdeployment fraud-detector -n streaming", what: { en: "Check job status, last checkpoint and savepoint info with the Flink Kubernetes Operator.", he: "בדוק סטטוס job, checkpoint ו-savepoint אחרונים עם ה-Flink Kubernetes Operator." } },
    { cmd: "curl -s http://flink-jobmanager:8081/jobs/<job-id>/checkpoints | jq '.latest.completed | {id, state_size, end_to_end_duration}'", what: { en: "Read checkpoint size and duration from the REST API; a duration creeping toward the timeout is an early backpressure signal.", he: "קרא גודל ומשך של checkpoint מה-REST API; משך שזוחל לכיוון ה-timeout הוא סימן מוקדם ל-backpressure." } },
    { cmd: "kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group fraud-detector", what: { en: "Consumer lag per partition. Note: Flink commits offsets to Kafka only for monitoring, on checkpoint; the truth lives in the checkpoint.", he: "Consumer lag לכל partition. שים לב: Flink עושה commit ל-offsets ב-Kafka רק לניטור, בזמן checkpoint; האמת נמצאת ב-checkpoint." } },
    { cmd: "flink stop --savepointPath s3://flink-state/fraud/savepoints <job-id>", what: { en: "Graceful stop with a savepoint before any upgrade or rescale.", he: "עצירה מסודרת עם savepoint לפני כל שדרוג או rescale." } }
  ],
  mnemonic: { en: "\"Stamp, Slot, Shout, Snapshot\": event-time Stamp, window Slot, watermark Shouts \"done\", checkpoint Snapshots offsets + state together.", he: "\"חותמת, משבצת, צעקה, צילום\": חותמת event time, משבצת של חלון, ה-watermark צועק \"סיימנו\", וה-checkpoint מצלם offsets ו-state ביחד." },
  pitfalls: [
    { en: "Windowing by processing time: results change on every replay and backfill, so you can't reproduce yesterday's numbers.", he: "חלונות לפי processing time: התוצאות משתנות בכל replay ו-backfill, ואי אפשר לשחזר את המספרים של אתמול." },
    { en: "One idle partition freezing the watermark: no window fires, dashboards go flat, nobody gets an error. Configure an idle timeout.", he: "partition אחד ריק שמקפיא את ה-watermark: אף חלון לא נורה, הדשבורדים שטוחים, ואף אחד לא מקבל שגיאה. הגדר idle timeout." },
    { en: "Unbounded state: a GROUP BY or join without a window or state TTL grows forever until checkpoints take 20 minutes. Set table.exec.state.ttl or use windowed joins.", he: "State בלי גבול: GROUP BY או join בלי חלון או state TTL גדל לנצח עד ש-checkpoint לוקח 20 דקות. הגדר table.exec.state.ttl או השתמש ב-joins עם חלונות." },
    { en: "Changing operator code without stable uid()s: the savepoint can't map old state to the new operators and the job refuses to start (or you drop state with --allowNonRestoredState).", he: "לשנות קוד של operators בלי uid() קבועים: ה-savepoint לא יודע למפות את ה-state הישן ל-operators החדשים וה-job מסרב לעלות (או שאתה זורק state עם --allowNonRestoredState)." }
  ],
  interview: [
    { q: { en: "How does Flink achieve exactly-once into Kafka, and what does it cost?", he: "איך Flink משיג exactly-once לתוך Kafka, ומה המחיר?" },
      a: { en: "Checkpoint barriers give a consistent cut of source offsets and operator state. The KafkaSink writes inside a Kafka transaction per checkpoint and commits in the notify-checkpoint-complete phase (two-phase commit). Consumers reading read_committed see output only after commit, so latency is at least the checkpoint interval; transaction timeouts must outlive restarts.", he: "ה-barriers של ה-checkpoint נותנים חתך עקבי של offsets ו-state. ה-KafkaSink כותב בתוך טרנזקציה של Kafka לכל checkpoint ועושה commit בשלב ה-notify-checkpoint-complete (two-phase commit). צרכנים עם read_committed רואים output רק אחרי commit, אז ה-latency הוא לפחות ה-checkpoint interval, וה-transaction timeout חייב לשרוד restarts." } },
    { q: { en: "Your windowed job shows no output for an hour but has no errors. What do you check?", he: "ה-job עם החלונות לא מוציא output כבר שעה, אבל אין שגיאות. מה אתה בודק?" },
      a: { en: "The watermark. In the UI, check the current watermark per subtask: an idle or empty partition holds the min watermark back; or events carry a bad future/past timestamp. Fix with source idle-timeout, timestamp sanity filtering, and alert on watermark lag (now - watermark).", he: "את ה-watermark. ב-UI בודקים את ה-watermark הנוכחי לכל subtask: partition ריק או idle מעכב את המינימום; או ש-events מגיעים עם timestamp שגוי בעתיד או בעבר. מתקנים עם idle-timeout ב-source, סינון timestamps לא הגיוניים, ו-alert על watermark lag (now פחות ה-watermark)." } }
  ],
  quiz: [
    { q: { en: "A sliding window of size 10 min with slide 2 min. How many windows does each event belong to?", he: "Sliding window בגודל 10 דקות עם קפיצה של 2 דקות. לכמה חלונות כל event שייך?" },
      options: [ { en: "1", he: "1" }, { en: "2", he: "2" }, { en: "5", he: "5" }, { en: "10", he: "10" } ],
      answer: 2,
      explain: { en: "size / slide = 10 / 2 = 5 overlapping windows, so state and output are 5× a tumbling window.", he: "size / slide = 10 / 2 = 5 חלונות חופפים, אז ה-state וה-output פי 5 מ-tumbling window." } },
    { q: { en: "What does a watermark of 10:05:00 tell the engine?", he: "מה watermark של 10:05:00 אומר למנוע?" },
      options: [ { en: "The wall clock is 10:05:00", he: "השעון של המכונה מראה 10:05:00" }, { en: "No more events with event time ≤ 10:05:00 are expected, so windows ending by then can fire", he: "לא צפויים יותר events עם event time ≤ 10:05:00, אז חלונות שמסתיימים עד אז יכולים לירות" }, { en: "The last checkpoint completed at 10:05:00", he: "ה-checkpoint האחרון הסתיים ב-10:05:00" }, { en: "Kafka retention starts at 10:05:00", he: "ה-retention של Kafka מתחיל ב-10:05:00" } ],
      answer: 1,
      explain: { en: "A watermark is a statement about event-time completeness, not about wall-clock time or checkpoints.", he: "Watermark הוא הצהרה על שלמות לפי event time, לא על שעון הקיר או checkpoints." } },
    { q: { en: "A Kafka Streams app reads a 12-partition topic. You scale it from 12 to 20 pods. What happens?", he: "אפליקציית Kafka Streams קוראת topic עם 12 partitions. אתה מגדיל מ-12 ל-20 pods. מה קורה?" },
      options: [ { en: "Throughput grows ~66%", he: "ה-throughput גדל בכ-66%" }, { en: "8 pods sit idle (they can only be standbys); throughput doesn't grow", he: "8 pods יושבים בלי עבודה (הם יכולים להיות רק standbys); ה-throughput לא גדל" }, { en: "Kafka automatically adds 8 partitions", he: "Kafka מוסיף אוטומטית 8 partitions" }, { en: "The app crashes", he: "האפליקציה קורסת" } ],
      answer: 1,
      explain: { en: "Tasks map to input partitions; with 12 partitions there are 12 active tasks at most. Extra instances only host standby replicas.", he: "Tasks ממופים ל-partitions של הקלט; עם 12 partitions יש לכל היותר 12 tasks פעילים. instances נוספים מחזיקים רק standby replicas." } },
    { q: { en: "Why is RocksDB preferred over heap state for a 2 TB keyed state?", he: "למה מעדיפים RocksDB על פני heap state בשביל keyed state של 2 TB?" },
      options: [ { en: "It's faster per access than the heap", he: "הוא מהיר יותר בכל גישה מה-heap" }, { en: "State lives on local disk (not limited by RAM/GC) and supports incremental checkpoints", he: "ה-state יושב על דיסק מקומי (לא מוגבל ב-RAM או GC) ותומך ב-incremental checkpoints" }, { en: "It removes the need for checkpoints", he: "הוא מבטל את הצורך ב-checkpoints" }, { en: "It replicates state to Kafka automatically", he: "הוא משכפל state ל-Kafka אוטומטית" } ],
      answer: 1,
      explain: { en: "Per access RocksDB is slower (serialization + disk), but it scales past RAM and only uploads changed SST files on each checkpoint.", he: "בכל גישה RocksDB דווקא איטי יותר (serialization ודיסק), אבל הוא עובר את גבול ה-RAM ומעלה רק קבצי SST שהשתנו בכל checkpoint." } }
  ],
  playground: "queue",
  related: ["pr-big-data", "staff-kafka-deep", "staff-exactly-once", "data-cdc-debezium", "data-contracts-schema-registry"]
});

INFRA.lessons.push({
  id: "data-cdc-debezium",
  track: "data",
  order: 41,
  icon: "🔁",
  level: 3,
  minutes: 18,
  title: { en: "CDC with Debezium in Production", he: "CDC עם Debezium בפרודקשן" },
  tldr: {
    en: "Debezium tails the database's own replication log (Postgres WAL via a logical replication slot, MySQL binlog in ROW format) and turns every committed insert/update/delete into a Kafka event — but an abandoned replication slot will keep WAL forever and fill your primary's disk.",
    he: "Debezium קורא את לוג השכפול של הדאטהבייס עצמו (ה-WAL של Postgres דרך logical replication slot, ה-binlog של MySQL בפורמט ROW) והופך כל insert/update/delete שעבר commit ל-event ב-Kafka — אבל replication slot נטוש ישמור WAL לנצח וימלא את הדיסק של ה-primary."
  },
  analogy: {
    en: "A court stenographer already writes down every word said in the courtroom (the WAL/binlog). Instead of asking each witness to call the newspapers after testifying (dual writes), the newspaper just gets a copy of the stenographer's tape. The catch: the stenographer keeps every tape until the newspaper confirms it has read it. If the newspaper goes bankrupt without telling anyone, tapes pile up until the courtroom is full.",
    he: "קצרנית בבית משפט כבר רושמת כל מילה שנאמרת באולם (ה-WAL או ה-binlog). במקום לבקש מכל עד להתקשר לעיתונים אחרי העדות (dual writes), העיתון פשוט מקבל עותק של הקלטות של הקצרנית. המלכודת: הקצרנית שומרת כל קלטת עד שהעיתון מאשר שקרא אותה. אם העיתון פושט רגל בלי להגיד לאף אחד, הקלטות נערמות עד שהאולם מתמלא."
  },
  sections: [
    {
      h: { en: "Postgres: logical decoding, slots and publications", he: "Postgres: logical decoding, slots ו-publications" },
      body: {
        en: `<p>Postgres writes every change to the <strong>WAL</strong> first. With <code>wal_level = logical</code> the WAL contains enough information to be <strong>logically decoded</strong> into row changes. Three objects matter:</p>
<ul>
<li><strong>Output plugin</strong> — <code>pgoutput</code> (built in since PG 10, the one to use; works on RDS/Aurora/Cloud SQL without extra extensions).</li>
<li><strong>Publication</strong> — which tables are streamed: <code>CREATE PUBLICATION dbz_pub FOR TABLE orders, customers;</code></li>
<li><strong>Replication slot</strong> — a durable bookmark on the server. It remembers the <code>confirmed_flush_lsn</code> of the consumer, and Postgres <strong>will not delete WAL newer than the slot's restart_lsn</strong>, even if the consumer has been gone for a week.</li>
</ul>
<pre># postgresql.conf (RDS: parameter group rds.logical_replication = 1)
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
max_slot_wal_keep_size = 50GB      # PG 13+: safety valve, see below

-- the user Debezium connects as
CREATE ROLE debezium WITH LOGIN REPLICATION PASSWORD '...';
GRANT SELECT ON orders, customers TO debezium;
ALTER TABLE orders REPLICA IDENTITY FULL;   -- full "before" image on UPDATE/DELETE (default: only PK)</pre>
<p>A Debezium change event has <code>op</code> (<code>c</code> create, <code>u</code> update, <code>d</code> delete, <code>r</code> snapshot read), <code>before</code>, <code>after</code> and <code>source</code> (LSN, txId, table, <code>ts_ms</code>). Only <strong>committed</strong> transactions are emitted, in commit order.</p>
<blockquote>⚠️ Production tip: logical slots historically lived only on the primary — after a failover the slot was gone and Debezium had to re-snapshot. PG 17 adds failover slots (<code>failover = true</code> + <code>sync_replication_slots</code> on the standby); Aurora and some managed services have their own variants. Check this before you trust CDC through a failover.</blockquote>`,
        he: `<p>Postgres כותב כל שינוי קודם ל-<strong>WAL</strong>. עם <code>wal_level = logical</code> ה-WAL מכיל מספיק מידע כדי לעשות לו <strong>logical decoding</strong> לשינויי שורות. שלושה אובייקטים חשובים:</p>
<ul>
<li><strong>Output plugin</strong> — <code>pgoutput</code> (מובנה מאז PG 10, זה שמשתמשים בו; עובד על RDS, Aurora ו-Cloud SQL בלי extensions נוספים).</li>
<li><strong>Publication</strong> — אילו טבלאות מוזרמות: <code>CREATE PUBLICATION dbz_pub FOR TABLE orders, customers;</code></li>
<li><strong>Replication slot</strong> — סימנייה עמידה על השרת. היא זוכרת את ה-<code>confirmed_flush_lsn</code> של הצרכן, ו-Postgres <strong>לא ימחק WAL שחדש יותר מה-restart_lsn של ה-slot</strong>, גם אם הצרכן נעלם לשבוע.</li>
</ul>
<pre># postgresql.conf (RDS: parameter group rds.logical_replication = 1)
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
max_slot_wal_keep_size = 50GB      # PG 13+: safety valve, see below

-- the user Debezium connects as
CREATE ROLE debezium WITH LOGIN REPLICATION PASSWORD '...';
GRANT SELECT ON orders, customers TO debezium;
ALTER TABLE orders REPLICA IDENTITY FULL;   -- full "before" image on UPDATE/DELETE (default: only PK)</pre>
<p>ל-change event של Debezium יש <code>op</code> (<code>c</code> יצירה, <code>u</code> עדכון, <code>d</code> מחיקה, <code>r</code> קריאה מה-snapshot), <code>before</code>, <code>after</code> ו-<code>source</code> (LSN, txId, טבלה, <code>ts_ms</code>). רק טרנזקציות שעברו <strong>commit</strong> נשלחות, לפי סדר ה-commit.</p>
<blockquote>⚠️ טיפ לפרודקשן: היסטורית logical slots חיו רק על ה-primary — אחרי failover ה-slot נעלם ו-Debezium היה צריך snapshot מחדש. PG 17 מוסיף failover slots (<code>failover = true</code> ועוד <code>sync_replication_slots</code> על ה-standby); ל-Aurora ולחלק מהשירותים המנוהלים יש גרסאות משלהם. בדוק את זה לפני שאתה סומך על CDC דרך failover.</blockquote>`
      }
    },
    {
      h: { en: "MySQL binlog and the Kafka Connect cluster", he: "ה-binlog של MySQL וקלאסטר Kafka Connect" },
      body: {
        en: `<p>MySQL needs <code>binlog_format=ROW</code> and <code>binlog_row_image=FULL</code> (statement-based binlog contains SQL text, not row values), GTIDs on (<code>gtid_mode=ON</code>, makes failover to a replica resumable), and enough retention (<code>binlog_expire_logs_seconds</code>, e.g. 7 days) to survive a connector outage. Unlike Postgres, MySQL does <em>not</em> hold binlogs for you: if the connector is down longer than retention, the position is gone and you must re-snapshot. Debezium also keeps a <strong>schema history topic</strong> (DDL over time) — it must have infinite retention and 1 partition, or the connector can't restart.</p>
<p>Debezium runs inside <strong>Kafka Connect</strong>, a distributed worker cluster that stores its own state in three compacted Kafka topics:</p>
<pre># connect-distributed.properties
group.id=connect-cdc
config.storage.topic=_connect-configs
offset.storage.topic=_connect-offsets     # source offsets: LSN / binlog file+pos / GTID
status.storage.topic=_connect-status
key.converter=io.confluent.connect.avro.AvroConverter
value.converter=io.confluent.connect.avro.AvroConverter
key.converter.schema.registry.url=http://schema-registry:8081
value.converter.schema.registry.url=http://schema-registry:8081</pre>
<pre>curl -X PUT http://connect:8083/connectors/orders-pg/config \\
  -H 'Content-Type: application/json' -d '{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.hostname": "orders-db.internal",
  "database.port": "5432",
  "database.user": "debezium",
  "database.password": "\${file:/secrets/pg.properties:password}",
  "database.dbname": "orders",
  "topic.prefix": "orders",
  "plugin.name": "pgoutput",
  "slot.name": "debezium_orders",
  "publication.name": "dbz_pub",
  "publication.autocreate.mode": "filtered",
  "table.include.list": "public.orders,public.customers",
  "snapshot.mode": "initial",
  "heartbeat.interval.ms": "10000",
  "heartbeat.action.query": "UPDATE debezium_heartbeat SET ts = now()",
  "signal.data.collection": "public.debezium_signal",
  "tombstones.on.delete": "true"
}'</pre>
<p>Topics are named <code>&lt;topic.prefix&gt;.&lt;schema&gt;.&lt;table&gt;</code>, e.g. <code>orders.public.orders</code>. A Postgres/MySQL connector always runs <strong>one task</strong> (one log reader) — CDC throughput per database is single-threaded by design, typically 5k-50k rows/s depending on row size and converters.</p>`,
        he: `<p>MySQL צריך <code>binlog_format=ROW</code> ו-<code>binlog_row_image=FULL</code> (binlog מבוסס statement מכיל טקסט SQL, לא ערכי שורות), GTIDs דלוקים (<code>gtid_mode=ON</code>, מאפשר להמשיך אחרי failover ל-replica), ו-retention מספיק (<code>binlog_expire_logs_seconds</code>, למשל 7 ימים) כדי לשרוד השבתה של ה-connector. בניגוד ל-Postgres, MySQL <em>לא</em> שומר בשבילך binlogs: אם ה-connector למטה יותר מה-retention, המיקום אבד וצריך snapshot מחדש. Debezium גם מחזיק <strong>schema history topic</strong> (ה-DDL לאורך זמן) — הוא חייב retention אינסופי ו-partition אחד, אחרת ה-connector לא יוכל לעלות מחדש.</p>
<p>Debezium רץ בתוך <strong>Kafka Connect</strong>, קלאסטר מבוזר של workers ששומר את ה-state שלו בשלושה topics עם compaction ב-Kafka:</p>
<pre># connect-distributed.properties
group.id=connect-cdc
config.storage.topic=_connect-configs
offset.storage.topic=_connect-offsets     # source offsets: LSN / binlog file+pos / GTID
status.storage.topic=_connect-status
key.converter=io.confluent.connect.avro.AvroConverter
value.converter=io.confluent.connect.avro.AvroConverter
key.converter.schema.registry.url=http://schema-registry:8081
value.converter.schema.registry.url=http://schema-registry:8081</pre>
<pre>curl -X PUT http://connect:8083/connectors/orders-pg/config \\
  -H 'Content-Type: application/json' -d '{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.hostname": "orders-db.internal",
  "database.port": "5432",
  "database.user": "debezium",
  "database.password": "\${file:/secrets/pg.properties:password}",
  "database.dbname": "orders",
  "topic.prefix": "orders",
  "plugin.name": "pgoutput",
  "slot.name": "debezium_orders",
  "publication.name": "dbz_pub",
  "publication.autocreate.mode": "filtered",
  "table.include.list": "public.orders,public.customers",
  "snapshot.mode": "initial",
  "heartbeat.interval.ms": "10000",
  "heartbeat.action.query": "UPDATE debezium_heartbeat SET ts = now()",
  "signal.data.collection": "public.debezium_signal",
  "tombstones.on.delete": "true"
}'</pre>
<p>שמות ה-topics הם <code>&lt;topic.prefix&gt;.&lt;schema&gt;.&lt;table&gt;</code>, למשל <code>orders.public.orders</code>. connector של Postgres או MySQL תמיד מריץ <strong>task אחד</strong> (קורא לוג אחד) — ה-throughput של CDC לכל דאטהבייס הוא single-threaded בתכנון, בדרך כלל 5k-50k שורות בשנייה, תלוי בגודל השורה וב-converters.</p>`
      }
    },
    {
      h: { en: "Snapshots and schema changes", he: "Snapshots ושינויי סכמה" },
      body: {
        en: `<p>The WAL only has recent changes, so a new connector first needs the existing rows. <strong>Initial snapshot</strong> (<code>snapshot.mode=initial</code>): Debezium creates the slot (pinning a consistent LSN), runs <code>SELECT *</code> on each table inside a repeatable-read transaction, emits <code>op=r</code> events, then streams from the slot's LSN. For a 2 TB database that is hours of reading and, meanwhile, the slot retains all WAL written during the snapshot — size the disk for it.</p>
<p><strong>Incremental snapshot</strong> (DBLog-style watermarking): you insert a signal row and Debezium reads the table in primary-key chunks (default 1024 rows) <em>while streaming continues</em>, deduplicating chunk rows against concurrent changes. It can be paused, resumed, and is how you add a new table to an existing connector or re-sync one table:</p>
<pre>INSERT INTO debezium_signal (id, type, data) VALUES (
  gen_random_uuid()::text, 'execute-snapshot',
  '{"data-collections": ["public.invoices"], "type": "incremental"}');</pre>
<p><strong>Schema changes</strong>: in Postgres, pgoutput sends a relation message with the new columns, Debezium updates the event schema, and with Avro a new version is registered in Schema Registry. Additive changes (new nullable column) flow through. <strong>Dropping or renaming a column, or changing a type, is a breaking change for every consumer</strong> — run it through the same compatibility rules as any public API (expand → migrate → contract). Note: Postgres logical decoding does <em>not</em> emit DDL events; MySQL's binlog does, and Debezium stores them in the schema history topic.</p>
<blockquote>💡 Real world: never call it "just a column rename". A rename upstream broke 14 downstream dbt models at one company; the fix was a contract on the CDC topic plus a CI check that runs the DB migration against Schema Registry compatibility (see the data contracts lesson).</blockquote>`,
        he: `<p>ב-WAL יש רק שינויים אחרונים, אז connector חדש צריך קודם את השורות הקיימות. <strong>Initial snapshot</strong> (<code>snapshot.mode=initial</code>): Debezium יוצר את ה-slot (מקבע LSN עקבי), מריץ <code>SELECT *</code> על כל טבלה בתוך טרנזקציה ב-repeatable read, שולח events עם <code>op=r</code>, ואז מזרים מה-LSN של ה-slot. בדאטהבייס של 2 TB זה שעות של קריאה, ובינתיים ה-slot שומר את כל ה-WAL שנכתב בזמן ה-snapshot — תכנן את הדיסק בהתאם.</p>
<p><strong>Incremental snapshot</strong> (watermarking בסגנון DBLog): אתה מכניס שורת signal ו-Debezium קורא את הטבלה בחתיכות לפי primary key (ברירת מחדל 1024 שורות) <em>בזמן שה-streaming ממשיך</em>, ועושה dedup בין שורות החתיכה לשינויים שקורים במקביל. אפשר לעצור ולהמשיך אותו, וככה מוסיפים טבלה חדשה ל-connector קיים או מסנכרנים מחדש טבלה אחת:</p>
<pre>INSERT INTO debezium_signal (id, type, data) VALUES (
  gen_random_uuid()::text, 'execute-snapshot',
  '{"data-collections": ["public.invoices"], "type": "incremental"}');</pre>
<p><strong>שינויי סכמה</strong>: ב-Postgres ה-pgoutput שולח relation message עם העמודות החדשות, Debezium מעדכן את הסכמה של ה-event, ועם Avro נרשמת גרסה חדשה ב-Schema Registry. שינויים שמוסיפים (עמודה חדשה nullable) עוברים חלק. <strong>מחיקה או שינוי שם של עמודה, או שינוי טיפוס, זה breaking change לכל צרכן</strong> — מעבירים את זה דרך אותם כללי compatibility כמו כל API ציבורי (expand → migrate → contract). שים לב: logical decoding של Postgres <em>לא</em> שולח events של DDL; ה-binlog של MySQL כן, ו-Debezium שומר אותם ב-schema history topic.</p>
<blockquote>💡 מהשטח: אף פעם אל תגיד "זה רק rename לעמודה". rename אחד למעלה שבר 14 מודלים של dbt למטה בחברה אחת; התיקון היה contract על ה-CDC topic ובדיקת CI שמריצה את המיגרציה מול ה-compatibility של Schema Registry (ראה את השיעור על data contracts).</blockquote>`
      }
    },
    {
      h: { en: "The slot-bloat danger: monitoring and guardrails", he: "סכנת ה-slot bloat: ניטור ו-guardrails" },
      body: {
        en: `<p>The #1 Debezium incident: the connector stops (failed task, deleted connector, broken credentials, team forgot it) but the <strong>slot stays</strong>. Postgres retains every WAL segment since the slot's <code>restart_lsn</code>. A primary writing 30 GB of WAL/hour fills a 500 GB volume in well under a day, and a Postgres that can't write WAL <strong>stops accepting writes</strong> (PANIC: could not write to file "pg_wal/..."). A second, quieter version: the connector is healthy but the captured tables are idle while other databases on the same instance write heavily — the slot's position never moves. Fix: heartbeats (<code>heartbeat.action.query</code>) so Debezium has something to confirm.</p>
<pre>SELECT slot_name, plugin, active, active_pid,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))         AS retained_wal,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS consumer_lag,
       wal_status, safe_wal_size
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC;

    slot_name    |  plugin  | active | retained_wal | consumer_lag | wal_status | safe_wal_size
-----------------+----------+--------+--------------+--------------+------------+--------------
 debezium_orders | pgoutput | f      | 412 GB       | 412 GB       | extended   | 8589934592
 debezium_crm    | pgoutput | t      | 96 MB        | 12 kB        | reserved   | 53586690048</pre>
<ul>
<li><strong>Alert</strong> on <code>active = false</code> for &gt; 10 min and on retained WAL &gt; e.g. 20% of disk (postgres_exporter exposes <code>pg_replication_slots</code>; on RDS use the <code>OldestReplicationSlotLag</code> / <code>TransactionLogsDiskUsage</code> CloudWatch metrics).</li>
<li><strong>Cap</strong> with <code>max_slot_wal_keep_size</code> (PG 13+): beyond it the slot is invalidated (<code>wal_status = lost</code>) and Debezium must re-snapshot — painful, but your primary survives.</li>
<li><strong>Drop</strong> abandoned slots deliberately: <code>SELECT pg_drop_replication_slot('debezium_orders');</code> (only when inactive; the consumer will need a new snapshot).</li>
</ul>
<blockquote>⚠️ Production tip: treat each slot as production infrastructure with an owner. Every slot must map to a living connector in Git; a weekly job lists slots with no matching connector.</blockquote>`,
        he: `<p>האינסידנט מספר 1 של Debezium: ה-connector נעצר (task שנכשל, connector שנמחק, credentials שבורים, צוות ששכח ממנו) אבל ה-<strong>slot נשאר</strong>. Postgres שומר כל WAL segment מאז ה-<code>restart_lsn</code> של ה-slot. primary שכותב 30 GB של WAL בשעה ממלא volume של 500 GB בהרבה פחות מיום, ו-Postgres שלא יכול לכתוב WAL <strong>מפסיק לקבל כתיבות</strong> (PANIC: could not write to file "pg_wal/..."). גרסה שנייה, שקטה יותר: ה-connector בריא אבל הטבלאות שהוא קורא שקטות, בזמן שדאטהבייסים אחרים על אותו instance כותבים הרבה — המיקום של ה-slot לא זז אף פעם. התיקון: heartbeats (<code>heartbeat.action.query</code>) כדי של-Debezium יהיה משהו לאשר.</p>
<pre>SELECT slot_name, plugin, active, active_pid,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))         AS retained_wal,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS consumer_lag,
       wal_status, safe_wal_size
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC;

    slot_name    |  plugin  | active | retained_wal | consumer_lag | wal_status | safe_wal_size
-----------------+----------+--------+--------------+--------------+------------+--------------
 debezium_orders | pgoutput | f      | 412 GB       | 412 GB       | extended   | 8589934592
 debezium_crm    | pgoutput | t      | 96 MB        | 12 kB        | reserved   | 53586690048</pre>
<ul>
<li><strong>Alert</strong> על <code>active = false</code> יותר מ-10 דקות ועל WAL שמור מעל, נגיד, 20% מהדיסק (ה-postgres_exporter חושף את <code>pg_replication_slots</code>; ב-RDS משתמשים במטריקות CloudWatch בשם <code>OldestReplicationSlotLag</code> ו-<code>TransactionLogsDiskUsage</code>).</li>
<li><strong>תקרה</strong> עם <code>max_slot_wal_keep_size</code> (PG 13+): מעבר לה ה-slot מבוטל (<code>wal_status = lost</code>) ו-Debezium צריך snapshot מחדש — כואב, אבל ה-primary שורד.</li>
<li><strong>מחיקה</strong> מכוונת של slots נטושים: <code>SELECT pg_drop_replication_slot('debezium_orders');</code> (רק כשהוא לא פעיל; הצרכן יצטרך snapshot חדש).</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: תתייחס לכל slot כתשתית פרודקשן עם בעלים. כל slot חייב להתאים ל-connector חי ב-Git; job שבועי מוציא רשימה של slots בלי connector תואם.</blockquote>`
      }
    },
    {
      h: { en: "Outbox, keys, tombstones and sinks", he: "Outbox, keys, tombstones ו-sinks" },
      body: {
        en: `<p>Raw table CDC leaks your internal schema to every consumer. The <strong>transactional outbox</strong> fixes that: the service writes the business row and an <code>outbox</code> row in the same transaction; Debezium captures only the outbox table and the <strong>Outbox Event Router</strong> SMT turns each row into a clean domain event.</p>
<pre>CREATE TABLE outbox (
  id            uuid PRIMARY KEY,
  aggregatetype text  NOT NULL,   -- "order"   -&gt; topic outbox.event.order
  aggregateid   text  NOT NULL,   -- "o-1042"  -&gt; Kafka message key
  type          text  NOT NULL,   -- "OrderPaid"
  payload       jsonb NOT NULL
);

"transforms": "outbox",
"transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
"transforms.outbox.route.by.field": "aggregatetype",
"transforms.outbox.table.expand.json.payload": "true"</pre>
<p><strong>Ordering &amp; keys</strong>: Kafka orders only within a partition. Debezium keys table events by primary key and outbox events by <code>aggregateid</code>, so all changes to order o-1042 land in the same partition in commit order. Never repartition by another field downstream without understanding you lose that. The outbox row can be deleted right after insert (or by a cleanup job): Debezium already read it from the WAL.</p>
<p><strong>Tombstones</strong>: a delete produces a <code>d</code> event followed by a record with the same key and a <code>null</code> value. On a compacted topic the tombstone lets Kafka eventually remove every message for that key — essential for GDPR deletes and keeping compacted topics small.</p>
<p><strong>Sinks</strong>: Debezium's JDBC sink (<code>insert.mode=upsert</code>, <code>primary.key.mode=record_key</code>, <code>delete.enabled=true</code>) replicates into another DB; the Iceberg Kafka Connect sink or S3 sink feeds the lakehouse; most non-Debezium sinks want a flat row, so add the <code>ExtractNewRecordState</code> SMT (<code>io.debezium.transforms.ExtractNewRecordState</code>) to unwrap <code>after</code>. Delivery is at-least-once: sinks must upsert by key, not blindly append.</p>
<blockquote>💡 Real world: Debezium Server (no Kafka, sends to Kinesis, Pub/Sub, Redis Streams, HTTP) and managed services (AWS DMS, Confluent's managed Debezium connectors, Google Datastream) are valid choices — the slot and WAL rules above are identical.</blockquote>`,
        he: `<p>CDC גולמי על טבלאות חושף את הסכמה הפנימית שלך לכל צרכן. ה-<strong>transactional outbox</strong> פותר את זה: הסרוויס כותב את שורת הביזנס ושורת <code>outbox</code> באותה טרנזקציה; Debezium קורא רק את טבלת ה-outbox, וה-SMT בשם <strong>Outbox Event Router</strong> הופך כל שורה ל-domain event נקי.</p>
<pre>CREATE TABLE outbox (
  id            uuid PRIMARY KEY,
  aggregatetype text  NOT NULL,   -- "order"   -&gt; topic outbox.event.order
  aggregateid   text  NOT NULL,   -- "o-1042"  -&gt; Kafka message key
  type          text  NOT NULL,   -- "OrderPaid"
  payload       jsonb NOT NULL
);

"transforms": "outbox",
"transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
"transforms.outbox.route.by.field": "aggregatetype",
"transforms.outbox.table.expand.json.payload": "true"</pre>
<p><strong>סדר ו-keys</strong>: Kafka שומר סדר רק בתוך partition. Debezium נותן ל-events של טבלה key לפי ה-primary key, ול-events של outbox לפי <code>aggregateid</code>, כך שכל השינויים של הזמנה o-1042 נוחתים באותו partition לפי סדר ה-commit. אל תעשה repartition לפי שדה אחר למטה בלי להבין שאתה מאבד את זה. אפשר למחוק את שורת ה-outbox מיד אחרי ה-insert (או ב-job ניקוי): Debezium כבר קרא אותה מה-WAL.</p>
<p><strong>Tombstones</strong>: מחיקה מייצרת event עם <code>d</code> ואחריו רשומה עם אותו key וערך <code>null</code>. ב-topic עם compaction, ה-tombstone מאפשר ל-Kafka בסוף להסיר כל הודעה של ה-key הזה — קריטי למחיקות GDPR ולשמירה על topics קומפקטיים קטנים.</p>
<p><strong>Sinks</strong>: ה-JDBC sink של Debezium (<code>insert.mode=upsert</code>, <code>primary.key.mode=record_key</code>, <code>delete.enabled=true</code>) משכפל לדאטהבייס אחר; ה-Iceberg Kafka Connect sink או S3 sink מזינים את ה-lakehouse; רוב ה-sinks שאינם של Debezium רוצים שורה שטוחה, אז מוסיפים את ה-SMT בשם <code>ExtractNewRecordState</code> (<code>io.debezium.transforms.ExtractNewRecordState</code>) כדי לחלץ את <code>after</code>. ה-delivery הוא at-least-once: sinks חייבים לעשות upsert לפי key, לא append עיוור.</p>
<blockquote>💡 מהשטח: Debezium Server (בלי Kafka, שולח ל-Kinesis, Pub/Sub, Redis Streams, HTTP) ושירותים מנוהלים (AWS DMS, ה-connectors המנוהלים של Debezium ב-Confluent, Google Datastream) הם בחירות לגיטימיות — הכללים של ה-slot וה-WAL למעלה זהים.</blockquote>`
      }
    }
  ],
  diagram: "app --tx--> [orders + outbox] --WAL--> replication slot (restart_lsn)\n                                               |\n                                               v\n                       Kafka Connect: Debezium PostgresConnector (1 task) --SMT EventRouter-->\n                       topics: orders.public.orders / outbox.event.order  (key = PK / aggregateid)\n                                               |\n                     +-------------------------+-------------------------+\n                     v                         v                         v\n              JDBC sink (upsert)        Iceberg sink (lake)        Flink / services",
  handsOn: [
    { cmd: "psql -c \"SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained, wal_status FROM pg_replication_slots;\"", what: { en: "The single most important CDC health check: inactive slots and retained WAL.", he: "בדיקת הבריאות הכי חשובה של CDC: slots לא פעילים ו-WAL שמור." } },
    { cmd: "curl -s http://connect:8083/connectors/orders-pg/status | jq", what: { en: "Connector and task state (RUNNING / FAILED with stack trace). A FAILED task does not restart by itself.", he: "מצב ה-connector וה-task (RUNNING או FAILED עם stack trace). task שנכשל לא עולה מחדש לבד." } },
    { cmd: "curl -X POST 'http://connect:8083/connectors/orders-pg/restart?includeTasks=true&onlyFailed=true'", what: { en: "Restart only failed tasks after fixing the cause (Kafka 3.0+ API).", he: "להפעיל מחדש רק tasks שנכשלו אחרי שתיקנת את הסיבה (API של Kafka 3.0+)." } },
    { cmd: "kcat -b kafka:9092 -t orders.public.orders -C -o -5 -e -s value=avro -r http://schema-registry:8081 | jq '{op, before, after}'", what: { en: "Read the last 5 change events and inspect op/before/after.", he: "קרא את 5 ה-change events האחרונים ובדוק את op, before ו-after." } }
  ],
  mnemonic: { en: "\"A slot is a promise to remember\": Postgres keeps every WAL byte until someone confirms — so every slot needs an owner and an alarm.", he: "\"slot הוא הבטחה לזכור\": Postgres שומר כל byte של WAL עד שמישהו מאשר — אז לכל slot צריך בעלים ואזעקה." },
  pitfalls: [
    { en: "Deleting a connector but not its replication slot: the slot keeps WAL forever and the primary's disk fills.", he: "למחוק connector בלי למחוק את ה-replication slot שלו: ה-slot שומר WAL לנצח והדיסק של ה-primary מתמלא." },
    { en: "Low-traffic captured tables on a busy instance without heartbeats: the slot never advances even though the connector is 'healthy'.", he: "טבלאות שקטות על instance עמוס בלי heartbeats: ה-slot לא מתקדם אף פעם, למרות שה-connector נראה 'בריא'." },
    { en: "Default REPLICA IDENTITY: UPDATE/DELETE events have only the PK in 'before', so consumers that need old values silently get nulls.", he: "REPLICA IDENTITY ברירת מחדל: ב-events של UPDATE ו-DELETE יש רק את ה-PK ב-'before', וצרכנים שצריכים ערכים ישנים מקבלים nulls בשקט." },
    { en: "MySQL binlog retention shorter than the longest connector outage: position lost, full re-snapshot of a multi-TB database.", he: "Retention של binlog ב-MySQL קצר מההשבתה הארוכה ביותר של ה-connector: המיקום אבד, ו-snapshot מלא מחדש של דאטהבייס של כמה TB." }
  ],
  interview: [
    { q: { en: "Why use CDC + outbox instead of having the service publish to Kafka after committing?", he: "למה להשתמש ב-CDC עם outbox במקום שהסרוויס יפרסם ל-Kafka אחרי ה-commit?" },
      a: { en: "Dual writes aren't atomic: the process can crash between DB commit and Kafka publish (lost event) or publish then roll back (phantom event). With the outbox, the event is part of the DB transaction; Debezium reads the committed WAL, so the event exists iff the business change exists. Delivery is at-least-once, so consumers dedupe by event id.", he: "Dual writes הם לא אטומיים: התהליך יכול לקרוס בין ה-commit ב-DB לפרסום ב-Kafka (event אבד) או לפרסם ואז לעשות rollback (event רפאים). עם outbox, ה-event הוא חלק מהטרנזקציה ב-DB; Debezium קורא את ה-WAL שעבר commit, אז ה-event קיים אם ורק אם השינוי העסקי קיים. ה-delivery הוא at-least-once, אז הצרכנים עושים dedup לפי event id." } },
    { q: { en: "The CDC connector was down for 6 hours. What happened on the database, and how do you recover?", he: "ה-connector של CDC היה למטה 6 שעות. מה קרה בדאטהבייס, ואיך מתאוששים?" },
      a: { en: "Postgres retained 6 hours of WAL behind the slot (check retained_wal vs free disk). Fix the cause, restart the task; Debezium resumes from the stored offset/confirmed LSN, consumers see a burst, no data lost. If the slot was invalidated by max_slot_wal_keep_size (wal_status=lost), recreate it and run a new (incremental) snapshot.", he: "Postgres שמר 6 שעות של WAL מאחורי ה-slot (בדוק retained_wal מול הדיסק הפנוי). מתקנים את הסיבה ומפעילים מחדש את ה-task; Debezium ממשיך מה-offset השמור או מה-LSN שאושר, הצרכנים רואים פרץ, ושום דבר לא אבד. אם ה-slot בוטל בגלל max_slot_wal_keep_size (wal_status=lost), יוצרים אותו מחדש ומריצים snapshot חדש (incremental)." } }
  ],
  quiz: [
    { q: { en: "Debezium's connector has been deleted, but nobody dropped the Postgres slot. What happens?", he: "ה-connector של Debezium נמחק, אבל אף אחד לא מחק את ה-slot ב-Postgres. מה קורה?" },
      options: [ { en: "Postgres drops the slot automatically after 1 hour", he: "Postgres מוחק את ה-slot אוטומטית אחרי שעה" }, { en: "WAL accumulates behind the slot until disk fills (or max_slot_wal_keep_size invalidates it)", he: "WAL מצטבר מאחורי ה-slot עד שהדיסק מתמלא (או ש-max_slot_wal_keep_size מבטל אותו)" }, { en: "Nothing; slots don't retain WAL", he: "כלום; slots לא שומרים WAL" }, { en: "Writes fail immediately", he: "כתיבות נכשלות מיד" } ],
      answer: 1,
      explain: { en: "A slot is a server-side promise to keep WAL from restart_lsn on. Without a cap it grows until the disk is full and Postgres stops accepting writes.", he: "slot הוא הבטחה בצד השרת לשמור WAL מה-restart_lsn והלאה. בלי תקרה הוא גדל עד שהדיסק מלא ו-Postgres מפסיק לקבל כתיבות." } },
    { q: { en: "Which MySQL setting is mandatory for Debezium?", he: "איזו הגדרה של MySQL היא חובה בשביל Debezium?" },
      options: [ { en: "binlog_format=STATEMENT", he: "binlog_format=STATEMENT" }, { en: "binlog_format=ROW", he: "binlog_format=ROW" }, { en: "innodb_flush_log_at_trx_commit=0", he: "innodb_flush_log_at_trx_commit=0" }, { en: "query_cache_type=1", he: "query_cache_type=1" } ],
      answer: 1,
      explain: { en: "Row-based binlog contains actual row values (before/after); statement format contains only SQL text, which can't be decoded into row changes.", he: "binlog מבוסס ROW מכיל את ערכי השורות עצמם (before/after); פורמט statement מכיל רק טקסט SQL, שאי אפשר לפענח לשינויי שורות." } },
    { q: { en: "Why does Debezium emit a tombstone (null value) after a delete event?", he: "למה Debezium שולח tombstone (ערך null) אחרי event של מחיקה?" },
      options: [ { en: "To signal the end of a transaction", he: "כדי לסמן סוף טרנזקציה" }, { en: "So log compaction can eventually remove all records with that key", he: "כדי ש-log compaction יוכל בסוף להסיר את כל הרשומות עם ה-key הזה" }, { en: "To trigger a new snapshot", he: "כדי להפעיל snapshot חדש" }, { en: "Because Avro can't encode deletes", he: "כי Avro לא יודע לקודד מחיקות" } ],
      answer: 1,
      explain: { en: "Compaction keeps the latest value per key; a null latest value marks the key for removal after delete.retention.ms.", he: "Compaction שומר את הערך האחרון לכל key; ערך אחרון null מסמן את ה-key להסרה אחרי delete.retention.ms." } },
    { q: { en: "You need to add one new table to a running connector without stopping streaming. Best option?", he: "צריך להוסיף טבלה חדשה ל-connector שרץ בלי לעצור את ה-streaming. מה הכי טוב?" },
      options: [ { en: "Delete the connector and recreate it with snapshot.mode=initial", he: "למחוק את ה-connector וליצור אותו מחדש עם snapshot.mode=initial" }, { en: "Add it to the include list and send an execute-snapshot signal (incremental snapshot)", he: "להוסיף אותה ל-include list ולשלוח signal של execute-snapshot (incremental snapshot)" }, { en: "pg_dump the table into Kafka by hand", he: "לעשות pg_dump לטבלה ולדחוף ל-Kafka ידנית" }, { en: "Restart Postgres", he: "לעשות restart ל-Postgres" } ],
      answer: 1,
      explain: { en: "Incremental snapshots read the table in PK chunks while streaming continues, deduplicating against concurrent changes.", he: "Incremental snapshots קוראים את הטבלה בחתיכות לפי PK בזמן שה-streaming ממשיך, ועושים dedup מול שינויים מקבילים." } }
  ],
  related: ["staff-exactly-once", "staff-kafka-deep", "db-replication", "staff-postgres-at-scale", "data-stream-processing", "data-contracts-schema-registry"]
});

INFRA.lessons.push({
  id: "data-lakehouse-formats",
  track: "data",
  order: 42,
  icon: "🏞️",
  level: 3,
  minutes: 17,
  title: { en: "Lakehouse Table Formats: Iceberg, Delta, Hudi", he: "Table formats ל-Lakehouse: Iceberg, Delta ו-Hudi" },
  tldr: {
    en: "A folder of Parquet files is not a table: there are no atomic commits, no safe concurrent writers and no cheap way to find the right files. Table formats add a metadata layer (snapshots → manifests → data files) and a catalog pointer, giving S3 ACID commits, time travel, schema and partition evolution — and they need regular compaction.",
    he: "תיקייה של קבצי Parquet היא לא טבלה: אין commits אטומיים, אין כותבים מקבילים בטוחים, ואין דרך זולה למצוא את הקבצים הנכונים. Table formats מוסיפים שכבת metadata (snapshots → manifests → data files) ומצביע ב-catalog, ונותנים ל-S3 commits עם ACID, time travel, schema evolution ו-partition evolution — והם צריכים compaction קבוע."
  },
  analogy: {
    en: "A warehouse full of boxes (Parquet files) with no inventory system: to find red shirts you open every box, and if two workers restock at the same time, shelves end up half-updated. Iceberg is the inventory ledger at the door: each page (snapshot) lists exactly which boxes make up the stock right now, with notes on what's in each box. Restocking means writing a new page and swapping the bookmark in one move. Want last Tuesday's stock? Read last Tuesday's page.",
    he: "מחסן מלא קופסאות (קבצי Parquet) בלי מערכת מלאי: כדי למצוא חולצות אדומות פותחים כל קופסה, ואם שני עובדים ממלאים מלאי באותו זמן, המדפים נשארים חצי מעודכנים. Iceberg הוא ספר המלאי בכניסה: כל עמוד (snapshot) מפרט בדיוק אילו קופסאות מרכיבות את המלאי עכשיו, עם הערות על מה יש בכל קופסה. למלא מלאי זה לכתוב עמוד חדש ולהזיז את הסימנייה בתנועה אחת. רוצה את המלאי של יום שלישי שעבר? קורא את העמוד של יום שלישי."
  },
  sections: [
    {
      h: { en: "Why Parquet files alone aren't enough", he: "למה קבצי Parquet לבד לא מספיקים" },
      body: {
        en: `<p>The Hive-style lake was <code>s3://lake/events/dt=2026-11-14/part-0001.parquet</code> and a metastore that only knew partition folders. Its problems:</p>
<ul>
<li><strong>No atomicity</strong>: a job writing 200 files that fails at file 120 leaves a half-written partition that readers happily query.</li>
<li><strong>No isolation</strong>: a reader listing the folder during an overwrite sees a mix of old and new files.</li>
<li><strong>Slow planning</strong>: S3 LIST returns 1,000 keys per call; a table with 2M files needs 2,000 sequential LIST calls just to plan a query.</li>
<li><strong>Updates/deletes</strong> (GDPR "delete user 42") mean rewriting whole partitions by hand.</li>
<li><strong>Schema drift</strong>: renaming a column, or files written with different types, breaks readers.</li>
<li><strong>Partitioning leaks to users</strong>: forget <code>WHERE dt = ...</code> and you scan the whole table.</li>
</ul>
<p>A <strong>table format</strong> keeps the data in plain Parquet (or ORC/Avro) but adds metadata files describing which files form the table at each version, plus per-file column statistics (min/max, null counts) for pruning. A single atomic operation — swapping one pointer — commits a new version.</p>
<blockquote>💡 Real world: Iceberg was created at Netflix (2017) because their Hive tables had tens of millions of files and S3 listing alone took minutes; Delta Lake came from Databricks; Hudi from Uber, built for fast upserts of CDC data into the lake.</blockquote>`,
        he: `<p>ה-lake בסגנון Hive היה <code>s3://lake/events/dt=2026-11-14/part-0001.parquet</code> ו-metastore שהכיר רק תיקיות של partitions. הבעיות שלו:</p>
<ul>
<li><strong>אין אטומיות</strong>: job שכותב 200 קבצים ונכשל בקובץ 120 משאיר partition חצי כתוב שקוראים מתשאלים בשמחה.</li>
<li><strong>אין isolation</strong>: קורא שעושה list לתיקייה בזמן overwrite רואה ערבוב של קבצים ישנים וחדשים.</li>
<li><strong>Planning איטי</strong>: S3 LIST מחזיר 1,000 keys לקריאה; טבלה עם 2M קבצים צריכה 2,000 קריאות LIST רצופות רק כדי לתכנן שאילתה.</li>
<li><strong>Updates ו-deletes</strong> (GDPR "תמחק את משתמש 42") אומרים לשכתב partitions שלמים ידנית.</li>
<li><strong>Schema drift</strong>: שינוי שם של עמודה, או קבצים שנכתבו עם טיפוסים שונים, שוברים את הקוראים.</li>
<li><strong>החלוקה ל-partitions דולפת למשתמשים</strong>: שכחת <code>WHERE dt = ...</code> וסרקת את כל הטבלה.</li>
</ul>
<p><strong>Table format</strong> משאיר את הנתונים כ-Parquet רגיל (או ORC/Avro) אבל מוסיף קבצי metadata שמתארים אילו קבצים מרכיבים את הטבלה בכל גרסה, ועוד סטטיסטיקות לכל עמודה בכל קובץ (min/max, ספירת nulls) בשביל pruning. פעולה אטומית אחת — החלפת מצביע אחד — עושה commit לגרסה חדשה.</p>
<blockquote>💡 מהשטח: Iceberg נוצר ב-Netflix (2017) כי לטבלאות ה-Hive שלהם היו עשרות מיליוני קבצים ורק ה-listing ב-S3 לקח דקות; Delta Lake הגיע מ-Databricks; Hudi מ-Uber, ונבנה בשביל upserts מהירים של נתוני CDC לתוך ה-lake.</blockquote>`
      }
    },
    {
      h: { en: "Apache Iceberg: metadata tree, snapshots and time travel", he: "Apache Iceberg: עץ ה-metadata, snapshots ו-time travel" },
      body: {
        en: `<pre>catalog:  db.events -&gt; s3://lake/events/metadata/00042-a1b2.metadata.json
                         |  schema(s) with column IDs, partition spec(s), snapshot list
                         v
           snap-8812 manifest list (Avro)  -- one per snapshot
                         |  manifest path + partition ranges per manifest
                         v
           manifest files (Avro)            -- each lists data/delete files
                         |  path, partition, record count, per-column min/max/nulls
                         v
           data files (Parquet)  +  delete files (position / equality / deletion vectors)</pre>
<p>A <strong>commit</strong>: write new data files → write new manifests → write a new manifest list → write a new <code>metadata.json</code> → ask the catalog to atomically swap the pointer <em>if it still points to the version I started from</em> (optimistic concurrency). If another writer won, retry on top of the new version. Readers always see one complete snapshot.</p>
<p>Query planning reads the manifest list and manifests (a few files), pruning by partition ranges and column min/max — no S3 LIST at all.</p>
<pre>-- Spark SQL
CREATE TABLE lake.db.events (
  event_id STRING, user_id BIGINT, event_ts TIMESTAMP, type STRING, payload STRING)
USING iceberg
PARTITIONED BY (days(event_ts), bucket(16, user_id));     -- hidden partitioning

SELECT count(*) FROM lake.db.events WHERE event_ts &gt;= '2026-11-13';  -- prunes by day, no dt column needed

-- time travel
SELECT * FROM lake.db.events TIMESTAMP AS OF '2026-11-13 08:00:00';
SELECT * FROM lake.db.events VERSION AS OF 8812;
SELECT snapshot_id, committed_at, operation, summary['added-records'] FROM lake.db.events.snapshots;

-- evolution: metadata-only, no data rewrite
ALTER TABLE lake.db.events ADD COLUMN country STRING;
ALTER TABLE lake.db.events RENAME COLUMN type TO event_type;   -- safe: columns are tracked by ID
ALTER TABLE lake.db.events REPLACE PARTITION FIELD days(event_ts) WITH hours(event_ts);  -- new data only</pre>
<p><strong>Hidden partitioning</strong>: the partition value is derived by a transform (<code>days</code>, <code>hours</code>, <code>bucket</code>, <code>truncate</code>) from a real column, so users filter on <code>event_ts</code> and Iceberg prunes; nobody needs to know the layout. <strong>Partition evolution</strong> changes the spec for new data while old files keep the old spec. <strong>Row-level deletes</strong>: copy-on-write (rewrite affected files; fast reads) or merge-on-read (write small delete files; fast writes, readers merge). Spec v3 adds deletion vectors, row lineage and new types (variant, geo).</p>`,
        he: `<pre>catalog:  db.events -&gt; s3://lake/events/metadata/00042-a1b2.metadata.json
                         |  schema(s) with column IDs, partition spec(s), snapshot list
                         v
           snap-8812 manifest list (Avro)  -- one per snapshot
                         |  manifest path + partition ranges per manifest
                         v
           manifest files (Avro)            -- each lists data/delete files
                         |  path, partition, record count, per-column min/max/nulls
                         v
           data files (Parquet)  +  delete files (position / equality / deletion vectors)</pre>
<p><strong>Commit</strong>: כותבים data files חדשים → כותבים manifests חדשים → כותבים manifest list חדש → כותבים <code>metadata.json</code> חדש → מבקשים מה-catalog להחליף את המצביע באופן אטומי <em>אם הוא עדיין מצביע על הגרסה שממנה התחלתי</em> (optimistic concurrency). אם כותב אחר ניצח, מנסים שוב מעל הגרסה החדשה. קוראים תמיד רואים snapshot שלם אחד.</p>
<p>ה-planning של שאילתה קורא את ה-manifest list וה-manifests (כמה קבצים בודדים), ועושה pruning לפי טווחי partitions ו-min/max של עמודות — בלי שום S3 LIST.</p>
<pre>-- Spark SQL
CREATE TABLE lake.db.events (
  event_id STRING, user_id BIGINT, event_ts TIMESTAMP, type STRING, payload STRING)
USING iceberg
PARTITIONED BY (days(event_ts), bucket(16, user_id));     -- hidden partitioning

SELECT count(*) FROM lake.db.events WHERE event_ts &gt;= '2026-11-13';  -- prunes by day, no dt column needed

-- time travel
SELECT * FROM lake.db.events TIMESTAMP AS OF '2026-11-13 08:00:00';
SELECT * FROM lake.db.events VERSION AS OF 8812;
SELECT snapshot_id, committed_at, operation, summary['added-records'] FROM lake.db.events.snapshots;

-- evolution: metadata-only, no data rewrite
ALTER TABLE lake.db.events ADD COLUMN country STRING;
ALTER TABLE lake.db.events RENAME COLUMN type TO event_type;   -- safe: columns are tracked by ID
ALTER TABLE lake.db.events REPLACE PARTITION FIELD days(event_ts) WITH hours(event_ts);  -- new data only</pre>
<p><strong>Hidden partitioning</strong>: ערך ה-partition נגזר מ-transform (<code>days</code>, <code>hours</code>, <code>bucket</code>, <code>truncate</code>) על עמודה אמיתית, כך שמשתמשים מסננים לפי <code>event_ts</code> ו-Iceberg עושה pruning; אף אחד לא צריך להכיר את המבנה. <strong>Partition evolution</strong> משנה את ה-spec לנתונים חדשים, בזמן שקבצים ישנים שומרים את ה-spec הישן. <strong>Row-level deletes</strong>: copy-on-write (משכתבים את הקבצים שהושפעו; קריאות מהירות) או merge-on-read (כותבים delete files קטנים; כתיבות מהירות, והקוראים ממזגים). Spec v3 מוסיף deletion vectors, row lineage וטיפוסים חדשים (variant, geo).</p>`
      }
    },
    {
      h: { en: "Delta Lake, Hudi, and catalogs", he: "Delta Lake, Hudi ו-catalogs" },
      body: {
        en: `<table>
<tr><th></th><th>Iceberg</th><th>Delta Lake</th><th>Hudi</th></tr>
<tr><td>Metadata</td><td>metadata.json → manifest list → manifests</td><td><code>_delta_log/</code> JSON commit per version + Parquet checkpoint every 10 commits</td><td><code>.hoodie/</code> timeline of instants + metadata table</td></tr>
<tr><td>Commit</td><td>Atomic pointer swap in a catalog</td><td>Atomic "create if not exists" of <code>000…N.json</code> (S3 needs conditional writes or a coordinator)</td><td>Timeline instant + locks for multi-writer</td></tr>
<tr><td>Strength</td><td>Engine-neutral, widest ecosystem, hidden partitioning</td><td>Deep Spark/Databricks integration, liquid clustering, OPTIMIZE/ZORDER</td><td>Streaming upserts, record-level index, MOR tables</td></tr>
</table>
<p>The market has converged on Iceberg as the interchange format: Delta's <strong>UniForm</strong> writes Iceberg metadata alongside Delta, and Apache XTable translates between all three.</p>
<p>The <strong>catalog</strong> is what makes a commit atomic and lets engines find tables:</p>
<ul>
<li><strong>Hive Metastore</strong> — legacy, still everywhere.</li>
<li><strong>AWS Glue Data Catalog</strong> — default on AWS; Athena, EMR, Redshift Spectrum read it; also exposes an Iceberg REST endpoint.</li>
<li><strong>Iceberg REST catalog</strong> — an open HTTP spec (<code>GET /v1/namespaces/db/tables/events</code>) so any engine talks to any catalog; implementations: Apache Polaris, Nessie (Git-like branches), Gravitino, Lakekeeper, Snowflake Open Catalog, S3 Tables, Glue.</li>
<li><strong>Unity Catalog</strong> — Databricks' governance catalog (open-sourced 2024), Delta + Iceberg, with permissions and lineage.</li>
</ul>
<blockquote>⚠️ Production tip: the catalog is also your security boundary. Engines that bypass it and read <code>s3://lake/</code> directly skip permissions and can read uncommitted or deleted files. Prefer credential vending (the REST catalog hands short-lived, table-scoped S3 credentials) over broad bucket IAM roles.</blockquote>`,
        he: `<table>
<tr><th></th><th>Iceberg</th><th>Delta Lake</th><th>Hudi</th></tr>
<tr><td>Metadata</td><td>metadata.json → manifest list → manifests</td><td><code>_delta_log/</code> JSON commit לכל גרסה ועוד Parquet checkpoint כל 10 commits</td><td><code>.hoodie/</code> timeline של instants ועוד metadata table</td></tr>
<tr><td>Commit</td><td>החלפה אטומית של מצביע ב-catalog</td><td>יצירה אטומית "רק אם לא קיים" של <code>000…N.json</code> (ב-S3 צריך conditional writes או coordinator)</td><td>Instant ב-timeline ועוד locks לכמה כותבים</td></tr>
<tr><td>חוזקה</td><td>ניטרלי למנועים, האקוסיסטם הכי רחב, hidden partitioning</td><td>אינטגרציה עמוקה עם Spark ו-Databricks, liquid clustering, OPTIMIZE/ZORDER</td><td>Upserts בסטרימינג, record-level index, טבלאות MOR</td></tr>
</table>
<p>השוק התכנס ל-Iceberg כפורמט ההחלפה: ה-<strong>UniForm</strong> של Delta כותב metadata של Iceberg לצד Delta, ו-Apache XTable מתרגם בין שלושתם.</p>
<p>ה-<strong>catalog</strong> הוא מה שהופך commit לאטומי ומאפשר למנועים למצוא טבלאות:</p>
<ul>
<li><strong>Hive Metastore</strong> — legacy, עדיין בכל מקום.</li>
<li><strong>AWS Glue Data Catalog</strong> — ברירת המחדל ב-AWS; Athena, EMR ו-Redshift Spectrum קוראים ממנו; חושף גם endpoint של Iceberg REST.</li>
<li><strong>Iceberg REST catalog</strong> — spec פתוח מעל HTTP (<code>GET /v1/namespaces/db/tables/events</code>) כך שכל מנוע מדבר עם כל catalog; מימושים: Apache Polaris, Nessie (branches בסגנון Git), Gravitino, Lakekeeper, Snowflake Open Catalog, S3 Tables, Glue.</li>
<li><strong>Unity Catalog</strong> — ה-catalog של Databricks לממשל נתונים (קוד פתוח מ-2024), Delta ו-Iceberg, עם הרשאות ו-lineage.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: ה-catalog הוא גם גבול האבטחה שלך. מנועים שעוקפים אותו וקוראים את <code>s3://lake/</code> ישירות מדלגים על הרשאות ויכולים לקרוא קבצים שלא עברו commit או שנמחקו. עדיף credential vending (ה-REST catalog נותן credentials קצרי-חיים ל-S3, מוגבלים לטבלה) על פני IAM roles רחבים לכל ה-bucket.</blockquote>`
      }
    },
    {
      h: { en: "Compaction and the small-files problem", he: "Compaction ובעיית הקבצים הקטנים" },
      body: {
        en: `<p>A streaming writer (Flink, Kafka Connect) commits every 1-5 minutes. 48 parallel writers × 1 commit/min × 1,440 min = <strong>~70,000 files a day</strong>, each a few MB. Every file costs an S3 GET (~$0.0004 per 1,000 and ~10-50 ms of latency), a manifest entry, and Parquet footer parsing. Queries that took 4 s now take 2 minutes. Target <strong>128-512 MB</strong> files.</p>
<pre>-- Iceberg maintenance (Spark procedures), typically scheduled daily/hourly
CALL lake.system.rewrite_data_files(
  table =&gt; 'db.events',
  strategy =&gt; 'sort', sort_order =&gt; 'user_id',
  where =&gt; 'event_ts &gt;= current_date - INTERVAL 2 DAYS',
  options =&gt; map('target-file-size-bytes','536870912', 'min-input-files','5'));

CALL lake.system.rewrite_manifests('db.events');
CALL lake.system.expire_snapshots(table =&gt; 'db.events',
  older_than =&gt; TIMESTAMP '2026-11-07 00:00:00', retain_last =&gt; 50);
CALL lake.system.remove_orphan_files(table =&gt; 'db.events', older_than =&gt; TIMESTAMP '2026-11-11 00:00:00');

-- Delta equivalents
OPTIMIZE events WHERE event_date &gt;= current_date() - 2 ZORDER BY (user_id);
VACUUM events RETAIN 168 HOURS;</pre>
<ul>
<li><strong>Expire snapshots</strong> or storage grows forever: deleted rows are still referenced by old snapshots. Expiring also defines how far back time travel works.</li>
<li><strong>Compaction conflicts</strong>: compaction commits can conflict with a streaming writer's commits on the same partitions; compact partitions that are no longer being written (yesterday), or enable <code>partial-progress.enabled</code>.</li>
<li>Merge-on-read tables accumulate delete files; compaction must also apply them, or reads slow down steadily.</li>
</ul>
<blockquote>💡 Real world: <strong>Amazon S3 Tables</strong> (GA Dec 2024) are "table buckets" that store Iceberg tables with automatic compaction, snapshot expiry and orphan cleanup built in, plus an Iceberg REST endpoint. Managed alternatives: Glue automatic compaction, Databricks predictive optimization, Snowflake-managed Iceberg tables.</blockquote>`,
        he: `<p>כותב סטרימינג (Flink, Kafka Connect) עושה commit כל 1-5 דקות. 48 כותבים במקביל × commit אחד בדקה × 1,440 דקות = <strong>~70,000 קבצים ביום</strong>, כל אחד כמה MB. כל קובץ עולה GET של S3 (~$0.0004 לכל 1,000 ועוד ~10-50 ms של latency), רשומה ב-manifest, ו-parsing של ה-footer של Parquet. שאילתות שלקחו 4 שניות לוקחות עכשיו 2 דקות. היעד: קבצים של <strong>128-512 MB</strong>.</p>
<pre>-- Iceberg maintenance (Spark procedures), typically scheduled daily/hourly
CALL lake.system.rewrite_data_files(
  table =&gt; 'db.events',
  strategy =&gt; 'sort', sort_order =&gt; 'user_id',
  where =&gt; 'event_ts &gt;= current_date - INTERVAL 2 DAYS',
  options =&gt; map('target-file-size-bytes','536870912', 'min-input-files','5'));

CALL lake.system.rewrite_manifests('db.events');
CALL lake.system.expire_snapshots(table =&gt; 'db.events',
  older_than =&gt; TIMESTAMP '2026-11-07 00:00:00', retain_last =&gt; 50);
CALL lake.system.remove_orphan_files(table =&gt; 'db.events', older_than =&gt; TIMESTAMP '2026-11-11 00:00:00');

-- Delta equivalents
OPTIMIZE events WHERE event_date &gt;= current_date() - 2 ZORDER BY (user_id);
VACUUM events RETAIN 168 HOURS;</pre>
<ul>
<li><strong>Expire snapshots</strong>, אחרת האחסון גדל לנצח: שורות שנמחקו עדיין מוחזקות על ידי snapshots ישנים. ה-expire גם קובע כמה אחורה time travel עובד.</li>
<li><strong>התנגשויות של compaction</strong>: commits של compaction יכולים להתנגש ב-commits של כותב סטרימינג על אותם partitions; עושים compaction ל-partitions שכבר לא נכתבים (אתמול), או מפעילים <code>partial-progress.enabled</code>.</li>
<li>טבלאות merge-on-read צוברות delete files; ה-compaction חייב גם להחיל אותם, אחרת הקריאות הולכות ומאטות.</li>
</ul>
<blockquote>💡 מהשטח: <strong>Amazon S3 Tables</strong> (GA בדצמבר 2024) הם "table buckets" ששומרים טבלאות Iceberg עם compaction אוטומטי, expire של snapshots וניקוי orphans מובנים, ועוד endpoint של Iceberg REST. חלופות מנוהלות: automatic compaction של Glue, predictive optimization של Databricks, וטבלאות Iceberg מנוהלות ב-Snowflake.</blockquote>`
      }
    },
    {
      h: { en: "Engines: one table, many readers", he: "מנועים: טבלה אחת, הרבה קוראים" },
      body: {
        en: `<p>The point of an open table format is that storage and compute are decoupled: the same Iceberg table is written by Flink and read by five engines.</p>
<table>
<tr><th>Engine</th><th>Typical role</th></tr>
<tr><td>Spark</td><td>Heavy ETL, MERGE INTO upserts, maintenance procedures</td></tr>
<tr><td>Flink / Kafka Connect</td><td>Streaming ingestion (CDC → Iceberg upserts)</td></tr>
<tr><td>Trino / Starburst</td><td>Interactive SQL across lake + other databases</td></tr>
<tr><td>Athena</td><td>Serverless SQL on AWS, pay $5 per TB scanned</td></tr>
<tr><td>Snowflake, BigQuery, Redshift</td><td>Warehouse engines reading/writing external Iceberg tables</td></tr>
<tr><td>DuckDB</td><td>Single-node analytics on a laptop or Lambda via the <code>iceberg</code> extension</td></tr>
</table>
<pre>-- CDC upsert into Iceberg (Spark), from a staged batch of Debezium changes
MERGE INTO lake.db.customers t
USING (SELECT * FROM staged_changes) s
ON t.id = s.id
WHEN MATCHED AND s.op = 'd' THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED AND s.op != 'd' THEN INSERT *;

-- DuckDB
INSTALL iceberg; LOAD iceberg;
SELECT type, count(*) FROM iceberg_scan('s3://lake/events/metadata/00042-a1b2.metadata.json') GROUP BY 1;</pre>
<blockquote>⚠️ Production tip: "supports Iceberg" varies a lot — some engines read only, some can't do merge-on-read deletes, some lag a spec version. Check the feature matrix (v2 deletes, v3 types, writes, REST catalog) for each engine before you choose table properties like <code>write.delete.mode=merge-on-read</code>.</blockquote>`,
        he: `<p>כל הרעיון של table format פתוח הוא הפרדה בין אחסון לחישוב: אותה טבלת Iceberg נכתבת על ידי Flink ונקראת על ידי חמישה מנועים.</p>
<table>
<tr><th>מנוע</th><th>תפקיד טיפוסי</th></tr>
<tr><td>Spark</td><td>ETL כבד, upserts עם MERGE INTO, פרוצדורות תחזוקה</td></tr>
<tr><td>Flink / Kafka Connect</td><td>Ingestion בסטרימינג (CDC → upserts ל-Iceberg)</td></tr>
<tr><td>Trino / Starburst</td><td>SQL אינטראקטיבי על ה-lake ועל דאטהבייסים אחרים</td></tr>
<tr><td>Athena</td><td>SQL בלי שרתים ב-AWS, משלמים $5 לכל TB שנסרק</td></tr>
<tr><td>Snowflake, BigQuery, Redshift</td><td>מנועי warehouse שקוראים וכותבים טבלאות Iceberg חיצוניות</td></tr>
<tr><td>DuckDB</td><td>אנליטיקה על node אחד, בלפטופ או ב-Lambda, עם ה-extension בשם <code>iceberg</code></td></tr>
</table>
<pre>-- CDC upsert into Iceberg (Spark), from a staged batch of Debezium changes
MERGE INTO lake.db.customers t
USING (SELECT * FROM staged_changes) s
ON t.id = s.id
WHEN MATCHED AND s.op = 'd' THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED AND s.op != 'd' THEN INSERT *;

-- DuckDB
INSTALL iceberg; LOAD iceberg;
SELECT type, count(*) FROM iceberg_scan('s3://lake/events/metadata/00042-a1b2.metadata.json') GROUP BY 1;</pre>
<blockquote>⚠️ טיפ לפרודקשן: "תומך ב-Iceberg" משתנה מאוד — יש מנועים שרק קוראים, יש שלא יודעים deletes של merge-on-read, ויש שמפגרים בגרסת spec. בדוק את טבלת הפיצ'רים (deletes של v2, טיפוסים של v3, כתיבות, REST catalog) לכל מנוע לפני שאתה בוחר table properties כמו <code>write.delete.mode=merge-on-read</code>.</blockquote>`
      }
    }
  ],
  diagram: "Flink/Connect (writes every 1-5 min) --commit--> Catalog (Glue / REST / Unity)\n                                              | pointer -> metadata.json (v42)\n   Spark / Trino / Athena / Snowflake / DuckDB --read snapshot-->  manifest list -> manifests -> Parquet on S3\n   nightly: rewrite_data_files + expire_snapshots + remove_orphan_files",
  handsOn: [
    { cmd: "aws s3 ls s3://lake/events/data/ --recursive --summarize | tail -2", what: { en: "Count objects and total size: average file size below ~32 MB means compaction is overdue.", he: "ספור אובייקטים וגודל כולל: גודל קובץ ממוצע מתחת ל-~32 MB אומר שה-compaction באיחור." } },
    { cmd: "spark-sql -e \"SELECT count(*), avg(file_size_in_bytes)/1048576 AS avg_mb FROM lake.db.events.files\"", what: { en: "Iceberg metadata tables (files, snapshots, manifests, history) let you inspect the table with plain SQL.", he: "ה-metadata tables של Iceberg (files, snapshots, manifests, history) מאפשרים לבדוק את הטבלה עם SQL רגיל." } },
    { cmd: "aws glue get-table --database-name db --name events --query 'Table.Parameters.metadata_location'", what: { en: "See which metadata.json the Glue catalog currently points to.", he: "תראה לאיזה metadata.json ה-catalog של Glue מצביע כרגע." } },
    { cmd: "duckdb -c \"INSTALL iceberg; LOAD iceberg; SELECT count(*) FROM iceberg_scan('s3://lake/events');\"", what: { en: "Query the same table from your laptop with DuckDB, no cluster.", he: "תשאל את אותה טבלה מהלפטופ עם DuckDB, בלי קלאסטר." } }
  ],
  mnemonic: { en: "\"Files are the books, metadata is the library catalog, the catalog pointer is the front desk\" — and someone has to shelve (compact) every night.", he: "\"הקבצים הם הספרים, ה-metadata הוא הקטלוג של הספרייה, והמצביע ב-catalog הוא הדלפק בכניסה\" — ומישהו צריך לסדר את המדפים (compaction) כל לילה." },
  pitfalls: [
    { en: "Streaming into Iceberg without scheduled compaction and snapshot expiry: tens of thousands of tiny files and ever-growing storage.", he: "סטרימינג ל-Iceberg בלי compaction ו-expire של snapshots מתוזמנים: עשרות אלפי קבצים זעירים ואחסון שגדל בלי סוף." },
    { en: "Deleting files with an S3 lifecycle rule or 'aws s3 rm': the metadata still references them and queries fail. Only the table's own maintenance may delete files.", he: "למחוק קבצים עם lifecycle rule של S3 או 'aws s3 rm': ה-metadata עדיין מצביע עליהם והשאילתות נכשלות. רק התחזוקה של הטבלה עצמה רשאית למחוק קבצים." },
    { en: "Over-partitioning (e.g. hours × 1,000 customers): millions of tiny partitions. Partition coarsely and sort/cluster within files.", he: "יותר מדי partitions (למשל שעות × 1,000 לקוחות): מיליוני partitions זעירים. מחלקים גס, וממיינים או עושים clustering בתוך הקבצים." },
    { en: "Assuming GDPR deletes are done after DELETE FROM: old snapshots still hold the rows until expire_snapshots + orphan cleanup run.", he: "להניח שמחיקת GDPR הסתיימה אחרי DELETE FROM: snapshots ישנים עדיין מחזיקים את השורות עד ש-expire_snapshots וניקוי orphans רצים." }
  ],
  interview: [
    { q: { en: "How does Iceberg give ACID on S3, which has no transactions?", he: "איך Iceberg נותן ACID על S3, שאין בו טרנזקציות?" },
      a: { en: "Data and metadata files are immutable and written first; the only mutable thing is the catalog's pointer to the current metadata.json, swapped with compare-and-swap. Readers resolve the pointer once and read an immutable snapshot (isolation); a failed writer leaves only orphan files (atomicity); conflicting writers retry (optimistic concurrency).", he: "קבצי ה-data וה-metadata הם immutable ונכתבים קודם; הדבר היחיד שמשתנה הוא המצביע ב-catalog ל-metadata.json הנוכחי, שמוחלף ב-compare-and-swap. קוראים מפענחים את המצביע פעם אחת וקוראים snapshot שלא משתנה (isolation); כותב שנכשל משאיר רק orphan files (אטומיות); כותבים מתנגשים מנסים שוב (optimistic concurrency)." } },
    { q: { en: "Queries on a streaming-fed Iceberg table got 20× slower over a month. Diagnose.", he: "שאילתות על טבלת Iceberg שמוזנת מסטרימינג נהיו איטיות פי 20 במשך חודש. אבחן." },
      a: { en: "Check the files metadata table: file count and average size (small files), number of manifests, and delete files for MOR tables. Fix with rewrite_data_files (target 512 MB, sorted), rewrite_manifests, expire_snapshots, and schedule them; tune the writer's commit interval.", he: "בודקים את ה-metadata table בשם files: מספר הקבצים והגודל הממוצע (קבצים קטנים), מספר ה-manifests, ו-delete files בטבלאות MOR. מתקנים עם rewrite_data_files (יעד 512 MB, ממוין), rewrite_manifests ו-expire_snapshots, ומתזמנים אותם; מכווננים את ה-commit interval של הכותב." } }
  ],
  quiz: [
    { q: { en: "What makes an Iceberg commit atomic?", he: "מה הופך commit של Iceberg לאטומי?" },
      options: [ { en: "S3 multi-object transactions", he: "טרנזקציות של כמה אובייקטים ב-S3" }, { en: "A compare-and-swap of the table's metadata pointer in the catalog", he: "Compare-and-swap של מצביע ה-metadata של הטבלה ב-catalog" }, { en: "Writing all files into one Parquet file", he: "כתיבת כל הקבצים לקובץ Parquet אחד" }, { en: "A distributed lock held for the whole query", he: "Lock מבוזר שמוחזק לאורך כל השאילתה" } ],
      answer: 1,
      explain: { en: "Everything else is immutable and written beforehand; one atomic pointer swap publishes the new snapshot.", he: "כל השאר immutable ונכתב מראש; החלפה אטומית אחת של מצביע מפרסמת את ה-snapshot החדש." } },
    { q: { en: "With hidden partitioning on days(event_ts), how should users filter?", he: "עם hidden partitioning על days(event_ts), איך משתמשים צריכים לסנן?" },
      options: [ { en: "WHERE event_ts_day = '2026-11-14'", he: "WHERE event_ts_day = '2026-11-14'" }, { en: "WHERE event_ts >= '2026-11-14' — Iceberg derives the partition", he: "WHERE event_ts >= '2026-11-14' — Iceberg גוזר את ה-partition" }, { en: "They must list S3 folders first", he: "הם חייבים לעשות list לתיקיות ב-S3 קודם" }, { en: "Partition filters aren't possible", he: "אי אפשר לסנן לפי partitions" } ],
      answer: 1,
      explain: { en: "The partition value is a transform of a real column, so a filter on the real column is enough for pruning.", he: "ערך ה-partition הוא transform של עמודה אמיתית, אז סינון על העמודה האמיתית מספיק ל-pruning." } },
    { q: { en: "Storage keeps growing even though you delete old rows every day. Most likely cause?", he: "האחסון ממשיך לגדול למרות שאתה מוחק שורות ישנות כל יום. מה הסיבה הכי סבירה?" },
      options: [ { en: "Parquet compression is off", he: "הדחיסה של Parquet כבויה" }, { en: "Snapshots are never expired, so old files are still referenced", he: "אף פעם לא עושים expire ל-snapshots, אז קבצים ישנים עדיין מוחזקים" }, { en: "Too few partitions", he: "מעט מדי partitions" }, { en: "The catalog is Glue", he: "ה-catalog הוא Glue" } ],
      answer: 1,
      explain: { en: "A DELETE creates a new snapshot; the old files remain for time travel until expire_snapshots removes them.", he: "DELETE יוצר snapshot חדש; הקבצים הישנים נשארים בשביל time travel עד ש-expire_snapshots מסיר אותם." } },
    { q: { en: "Which file size should compaction target for analytic scans?", he: "לאיזה גודל קובץ ה-compaction צריך לכוון בשביל סריקות אנליטיות?" },
      options: [ { en: "~1 MB", he: "~1 MB" }, { en: "~8 MB", he: "~8 MB" }, { en: "~128-512 MB", he: "~128-512 MB" }, { en: "~50 GB", he: "~50 GB" } ],
      answer: 2,
      explain: { en: "Large enough to amortize per-file overhead (requests, footers, manifest entries), small enough for parallelism and pruning.", he: "גדול מספיק כדי לפזר את התקורה לכל קובץ (בקשות, footers, רשומות ב-manifest), וקטן מספיק בשביל מקביליות ו-pruning." } }
  ],
  related: ["pr-big-data", "db-olap-columnar", "data-cdc-debezium", "data-stream-processing", "data-quality-observability"]
});

INFRA.lessons.push({
  id: "data-contracts-schema-registry",
  track: "data",
  order: 43,
  icon: "📜",
  level: 2,
  minutes: 15,
  title: { en: "Data Contracts & Schema Registry", he: "Data Contracts ו-Schema Registry" },
  tldr: {
    en: "Events are a public API: a schema registry stores every version of every topic's schema and rejects incompatible changes at produce time, and a data contract adds what schemas can't say — owner, meaning, SLAs and quality rules — enforced in CI before the change ships.",
    he: "Events הם API ציבורי: schema registry שומר כל גרסה של הסכמה של כל topic ודוחה שינויים לא תואמים בזמן ה-produce, ו-data contract מוסיף את מה שסכמה לא יודעת להגיד — בעלים, משמעות, SLAs וכללי איכות — ונאכף ב-CI לפני שהשינוי יוצא."
  },
  analogy: {
    en: "A power socket standard. The registry is the standards office: you may add a new socket shape only if every existing plug still fits (compatibility). The data contract is the label on the wall: who installed it, 230 V not 110 V, and which electrician to call when it sparks. Without either, every appliance manufacturer finds out about a change when their product catches fire.",
    he: "תקן של שקע חשמל. ה-registry הוא מכון התקנים: מותר להוסיף צורת שקע חדשה רק אם כל תקע קיים עדיין נכנס (compatibility). ה-data contract הוא המדבקה על הקיר: מי התקין, 230 V ולא 110 V, ולאיזה חשמלאי להתקשר כשיש ניצוצות. בלי שניהם, כל יצרן מכשירים מגלה על שינוי כשהמוצר שלו עולה באש."
  },
  sections: [
    {
      h: { en: "Avro, Protobuf, JSON Schema and the wire format", he: "Avro, Protobuf, JSON Schema ופורמט ה-wire" },
      body: {
        en: `<table>
<tr><th></th><th>Avro</th><th>Protobuf</th><th>JSON Schema</th></tr>
<tr><td>Encoding</td><td>Binary, no field names; reader needs the writer's schema</td><td>Binary, fields identified by number tags</td><td>Plain JSON text</td></tr>
<tr><td>Size (typical event)</td><td>~40-60% of JSON</td><td>~40-60% of JSON</td><td>100%</td></tr>
<tr><td>Evolution</td><td>Defaults + resolution rules between writer/reader schemas</td><td>Never reuse tag numbers; unknown fields ignored</td><td>Weakest: <code>additionalProperties</code> makes rules tricky</td></tr>
<tr><td>Sweet spot</td><td>Kafka/CDC (Debezium default with registry), lakes</td><td>Teams already on gRPC, polyglot services</td><td>Low volume, human-readable, browser clients</td></tr>
</table>
<p>With Confluent-compatible serializers every Kafka message starts with a 5-byte header: <code>0x00</code> (magic byte) + a 4-byte <strong>schema ID</strong>. The consumer fetches schema ID 1187 from the registry once, caches it, and decodes. The schema is stored once, not in every message.</p>
<pre>{
  "type": "record", "name": "OrderPaid", "namespace": "com.shop.orders",
  "fields": [
    {"name": "order_id",    "type": "string"},
    {"name": "amount_cents","type": "long"},
    {"name": "currency",    "type": {"type": "enum", "name": "Currency",
                                     "symbols": ["ILS","USD","EUR","UNKNOWN"], "default": "UNKNOWN"}},
    {"name": "coupon",      "type": ["null","string"], "default": null},
    {"name": "paid_at",     "type": {"type": "long", "logicalType": "timestamp-millis"}}
  ]
}</pre>
<p><strong>Registries</strong>: Confluent Schema Registry (the de facto API), Apicurio Registry (Red Hat, open source, Confluent-compatible API), AWS Glue Schema Registry (own serializers, integrates with MSK/Kinesis), Azure Event Hubs schema registry. Subjects follow <code>TopicNameStrategy</code> by default: <code>orders-value</code>, <code>orders-key</code>.</p>`,
        he: `<table>
<tr><th></th><th>Avro</th><th>Protobuf</th><th>JSON Schema</th></tr>
<tr><td>קידוד</td><td>בינארי, בלי שמות שדות; הקורא צריך את הסכמה של הכותב</td><td>בינארי, שדות מזוהים לפי מספרי tag</td><td>טקסט JSON רגיל</td></tr>
<tr><td>גודל (event טיפוסי)</td><td>~40-60% מ-JSON</td><td>~40-60% מ-JSON</td><td>100%</td></tr>
<tr><td>Evolution</td><td>Defaults וכללי resolution בין סכמת הכותב לסכמת הקורא</td><td>אף פעם לא ממחזרים מספרי tag; שדות לא מוכרים מתעלמים מהם</td><td>הכי חלש: <code>additionalProperties</code> מסבך את הכללים</td></tr>
<tr><td>איפה זה מתאים</td><td>Kafka ו-CDC (ברירת המחדל של Debezium עם registry), lakes</td><td>צוותים שכבר על gRPC, סרוויסים בכמה שפות</td><td>Volume נמוך, קריא לבני אדם, לקוחות דפדפן</td></tr>
</table>
<p>עם serializers תואמי Confluent כל הודעה ב-Kafka מתחילה ב-header של 5 bytes: <code>0x00</code> (magic byte) ועוד <strong>schema ID</strong> של 4 bytes. הצרכן מביא את schema ID 1187 מה-registry פעם אחת, שומר ב-cache, ומפענח. הסכמה נשמרת פעם אחת, לא בכל הודעה.</p>
<pre>{
  "type": "record", "name": "OrderPaid", "namespace": "com.shop.orders",
  "fields": [
    {"name": "order_id",    "type": "string"},
    {"name": "amount_cents","type": "long"},
    {"name": "currency",    "type": {"type": "enum", "name": "Currency",
                                     "symbols": ["ILS","USD","EUR","UNKNOWN"], "default": "UNKNOWN"}},
    {"name": "coupon",      "type": ["null","string"], "default": null},
    {"name": "paid_at",     "type": {"type": "long", "logicalType": "timestamp-millis"}}
  ]
}</pre>
<p><strong>Registries</strong>: Confluent Schema Registry (ה-API הדה-פקטו), Apicurio Registry (של Red Hat, קוד פתוח, API תואם Confluent), AWS Glue Schema Registry (serializers משלו, אינטגרציה עם MSK ו-Kinesis), ו-schema registry של Azure Event Hubs. ה-subjects הולכים לפי <code>TopicNameStrategy</code> כברירת מחדל: <code>orders-value</code>, <code>orders-key</code>.</p>`
      }
    },
    {
      h: { en: "Compatibility modes: safe vs breaking changes", he: "מצבי compatibility: שינויים בטוחים מול שוברים" },
      body: {
        en: `<table>
<tr><th>Mode</th><th>Guarantee</th><th>Allowed (Avro)</th><th>Deploy order</th></tr>
<tr><td><strong>BACKWARD</strong> (Confluent default)</td><td>New schema can read data written with the previous one</td><td>Delete a field; add a field <em>with a default</em></td><td>Consumers first, then producers</td></tr>
<tr><td><strong>FORWARD</strong></td><td>Old schema can read data written with the new one</td><td>Add a field; delete a field <em>that had a default</em></td><td>Producers first, then consumers</td></tr>
<tr><td><strong>FULL</strong></td><td>Both</td><td>Add or delete only fields with defaults</td><td>Any order</td></tr>
<tr><td><strong>*_TRANSITIVE</strong></td><td>Same, checked against <em>all</em> previous versions, not just the last</td><td></td><td>Needed when consumers replay old data (Kafka retention, lakes)</td></tr>
<tr><td><strong>NONE</strong></td><td>No checks</td><td>Anything</td><td>Don't, outside dev</td></tr>
</table>
<p>Examples against the <code>OrderPaid</code> schema above:</p>
<ul>
<li>✅ Add <code>{"name":"channel","type":["null","string"],"default":null}</code> — compatible under FULL.</li>
<li>❌ Add <code>{"name":"channel","type":"string"}</code> without default — breaks BACKWARD: the new reader can't fill it for old records.</li>
<li>❌ Change <code>amount_cents</code> from <code>long</code> to <code>string</code> — breaks everything. (<code>int</code> → <code>long</code> is a legal Avro promotion: BACKWARD-safe.)</li>
<li>❌ Rename <code>coupon</code> → <code>promo_code</code> — a delete + add; use an Avro <code>aliases</code> entry or treat as breaking.</li>
<li>⚠️ Add enum symbol <code>GBP</code> — BACKWARD-safe, but old readers fail on it unless the enum has a <code>default</code> (that's why <code>UNKNOWN</code> is there).</li>
<li>Protobuf: never change or reuse a field number; delete with <code>reserved 4; reserved "coupon";</code>.</li>
</ul>
<pre># set FULL_TRANSITIVE for one subject
curl -X PUT -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
  --data '{"compatibility": "FULL_TRANSITIVE"}' http://schema-registry:8081/config/orders-value

# test a candidate schema without registering it
curl -X POST -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
  --data @order-paid-v8.json \\
  'http://schema-registry:8081/compatibility/subjects/orders-value/versions?verbose=true'
{"is_compatible": false, "messages": ["READER_FIELD_MISSING_DEFAULT_VALUE: channel"]}</pre>
<blockquote>⚠️ Production tip: set <code>auto.register.schemas=false</code> (and <code>use.latest.version=true</code>) on production producers. Otherwise any service can register a new schema version on its first send — the registry becomes a log of accidents, not a gate.</blockquote>`,
        he: `<table>
<tr><th>מצב</th><th>הבטחה</th><th>מותר (Avro)</th><th>סדר deploy</th></tr>
<tr><td><strong>BACKWARD</strong> (ברירת המחדל ב-Confluent)</td><td>הסכמה החדשה יכולה לקרוא נתונים שנכתבו עם הקודמת</td><td>למחוק שדה; להוסיף שדה <em>עם default</em></td><td>קודם צרכנים, אחר כך producers</td></tr>
<tr><td><strong>FORWARD</strong></td><td>הסכמה הישנה יכולה לקרוא נתונים שנכתבו עם החדשה</td><td>להוסיף שדה; למחוק שדה <em>שהיה לו default</em></td><td>קודם producers, אחר כך צרכנים</td></tr>
<tr><td><strong>FULL</strong></td><td>שניהם</td><td>להוסיף או למחוק רק שדות עם defaults</td><td>בכל סדר</td></tr>
<tr><td><strong>*_TRANSITIVE</strong></td><td>אותו דבר, נבדק מול <em>כל</em> הגרסאות הקודמות, לא רק האחרונה</td><td></td><td>נדרש כשצרכנים מנגנים נתונים ישנים (retention של Kafka, lakes)</td></tr>
<tr><td><strong>NONE</strong></td><td>אין בדיקות</td><td>הכול</td><td>לא, מחוץ ל-dev</td></tr>
</table>
<p>דוגמאות מול סכמת <code>OrderPaid</code> שלמעלה:</p>
<ul>
<li>✅ להוסיף <code>{"name":"channel","type":["null","string"],"default":null}</code> — תואם גם ב-FULL.</li>
<li>❌ להוסיף <code>{"name":"channel","type":"string"}</code> בלי default — שובר BACKWARD: הקורא החדש לא יכול למלא אותו ברשומות ישנות.</li>
<li>❌ לשנות את <code>amount_cents</code> מ-<code>long</code> ל-<code>string</code> — שובר הכול. (<code>int</code> → <code>long</code> זה promotion חוקי ב-Avro: בטוח ל-BACKWARD.)</li>
<li>❌ שינוי שם <code>coupon</code> → <code>promo_code</code> — זה מחיקה ועוד הוספה; משתמשים ב-<code>aliases</code> של Avro או מתייחסים לזה כשובר.</li>
<li>⚠️ להוסיף ל-enum את <code>GBP</code> — בטוח ל-BACKWARD, אבל קוראים ישנים נכשלים עליו אלא אם ל-enum יש <code>default</code> (בגלל זה <code>UNKNOWN</code> שם).</li>
<li>Protobuf: אף פעם לא משנים או ממחזרים מספר שדה; מוחקים עם <code>reserved 4; reserved "coupon";</code>.</li>
</ul>
<pre># set FULL_TRANSITIVE for one subject
curl -X PUT -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
  --data '{"compatibility": "FULL_TRANSITIVE"}' http://schema-registry:8081/config/orders-value

# test a candidate schema without registering it
curl -X POST -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
  --data @order-paid-v8.json \\
  'http://schema-registry:8081/compatibility/subjects/orders-value/versions?verbose=true'
{"is_compatible": false, "messages": ["READER_FIELD_MISSING_DEFAULT_VALUE: channel"]}</pre>
<blockquote>⚠️ טיפ לפרודקשן: הגדר <code>auto.register.schemas=false</code> (ו-<code>use.latest.version=true</code>) ב-producers של פרודקשן. אחרת כל סרוויס יכול לרשום גרסת סכמה חדשה בשליחה הראשונה שלו — וה-registry הופך ליומן של תאונות, לא לשער.</blockquote>`
      }
    },
    {
      h: { en: "Data contracts: what a schema can't say", he: "Data contracts: מה שסכמה לא יודעת להגיד" },
      body: {
        en: `<p>A schema says <code>amount_cents</code> is a <code>long</code>. It doesn't say it's in cents (not shekels), never negative, includes VAT, that the topic is owned by the payments team, or that 99% of events arrive within 60 s. A <strong>data contract</strong> is a versioned, machine-readable agreement between a producer and its consumers:</p>
<pre># contracts/orders-paid.yaml  (Open Data Contract Standard–style, lives next to the producer's code)
apiVersion: v3.0.0
kind: DataContract
id: orders.order-paid
version: 2.1.0
status: active
owner: team-payments            # who gets paged
contact: "#payments-oncall"
schema:
  - name: OrderPaid
    physicalName: orders.order-paid.v2     # Kafka topic
    properties:
      - name: amount_cents
        logicalType: integer
        description: "Total incl. VAT, in minor units of currency"
        quality:
          - type: sql
            query: "SELECT count(*) FROM {object} WHERE amount_cents &lt; 0"
            mustBe: 0
      - name: currency
        logicalType: string
        quality: [{ type: library, rule: validValues, validValues: [ILS, USD, EUR, UNKNOWN] }]
slaProperties:
  - property: latency           # event time -&gt; available in topic
    value: 60
    unit: s
  - property: retention
    value: 30
    unit: d
  - property: frequency
    value: continuous
classification: confidential    # no card numbers, no PII beyond customer_id</pre>
<p>The key shift is <strong>ownership</strong>: the producing team owns the contract and breaking it is an incident on their side, not a mystery for the analytics team three weeks later. Consumers register their dependency (so the producer knows who to notify).</p>
<blockquote>💡 Real world: Confluent Schema Registry now stores contract metadata and rules next to the schema (<code>metadata</code> + <code>ruleSet</code> with CEL data-quality rules, e.g. <code>message.amount_cents &gt;= 0</code>, and migration rules), enforced by the serializers. Open tooling: the Open Data Contract Standard (ODCS, Linux Foundation's Bitol project) and the <code>datacontract</code> CLI.</blockquote>`,
        he: `<p>סכמה אומרת ש-<code>amount_cents</code> הוא <code>long</code>. היא לא אומרת שזה באגורות (לא בשקלים), אף פעם לא שלילי, כולל מע"מ, שה-topic שייך לצוות התשלומים, או ש-99% מה-events מגיעים תוך 60 שניות. <strong>Data contract</strong> הוא הסכם עם גרסאות, שמכונה יכולה לקרוא, בין producer לצרכנים שלו:</p>
<pre># contracts/orders-paid.yaml  (Open Data Contract Standard–style, lives next to the producer's code)
apiVersion: v3.0.0
kind: DataContract
id: orders.order-paid
version: 2.1.0
status: active
owner: team-payments            # who gets paged
contact: "#payments-oncall"
schema:
  - name: OrderPaid
    physicalName: orders.order-paid.v2     # Kafka topic
    properties:
      - name: amount_cents
        logicalType: integer
        description: "Total incl. VAT, in minor units of currency"
        quality:
          - type: sql
            query: "SELECT count(*) FROM {object} WHERE amount_cents &lt; 0"
            mustBe: 0
      - name: currency
        logicalType: string
        quality: [{ type: library, rule: validValues, validValues: [ILS, USD, EUR, UNKNOWN] }]
slaProperties:
  - property: latency           # event time -&gt; available in topic
    value: 60
    unit: s
  - property: retention
    value: 30
    unit: d
  - property: frequency
    value: continuous
classification: confidential    # no card numbers, no PII beyond customer_id</pre>
<p>השינוי המהותי הוא <strong>ownership</strong>: הצוות שמייצר הוא הבעלים של ה-contract, ולשבור אותו זה אינסידנט אצלו, לא תעלומה לצוות האנליטיקה שלושה שבועות אחר כך. הצרכנים רושמים את התלות שלהם (כדי שה-producer יידע את מי לעדכן).</p>
<blockquote>💡 מהשטח: Confluent Schema Registry שומר היום metadata וכללים של contract לצד הסכמה (<code>metadata</code> ועוד <code>ruleSet</code> עם כללי data quality ב-CEL, למשל <code>message.amount_cents &gt;= 0</code>, וכללי migration), וה-serializers אוכפים אותם. כלים פתוחים: Open Data Contract Standard (ODCS, פרויקט Bitol של Linux Foundation) וה-CLI בשם <code>datacontract</code>.</blockquote>`
      }
    },
    {
      h: { en: "Enforcement in CI and versioning topics", he: "אכיפה ב-CI וגרסאות של topics" },
      body: {
        en: `<p>The registry check at produce time is the last line of defense — by then the deploy is live and producing fails. Move it left: the PR that changes a schema or a DB migration on a CDC table must fail CI.</p>
<pre># .github/workflows/contracts.yml
name: data-contracts
on: [pull_request]
jobs:
  compat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Schema compatibility vs production registry
        run: |
          for f in schemas/*.avsc; do
            subject="$(basename "$f" .avsc)-value"
            jq -n --rawfile s "$f" '{schema: $s}' &gt; /tmp/req.json
            curl -sf -u "$SR_KEY:$SR_SECRET" -X POST \\
              -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
              --data @/tmp/req.json \\
              "$SR_URL/compatibility/subjects/$subject/versions/latest" \\
              | jq -e '.is_compatible' || { echo "BREAKING: $f"; exit 1; }
          done
      - name: Contract lint + breaking-change check
        run: |
          pip install datacontract-cli
          datacontract lint contracts/orders-paid.yaml
          datacontract breaking contracts/orders-paid.yaml origin/main:contracts/orders-paid.yaml</pre>
<p>For Protobuf, <code>buf breaking --against '.git#branch=main'</code> does the same. Register schemas from CI (the pipeline is the only identity allowed to write), never from apps.</p>
<p><strong>When you really must break</strong>: create a new topic with a major version (<code>orders.order-paid.v2</code>), dual-publish (or bridge v1 → v2 with a small stream job), migrate consumers one by one using the contract's consumer list, watch v1 consumer-group lag hit zero and stay idle, then set a sunset date and delete v1. Same expand → migrate → contract rhythm as a database migration.</p>
<blockquote>⚠️ Production tip: never "fix" a bad schema by deleting the subject version in the registry. Messages already in Kafka still carry that schema ID; consumers that try to fetch it later will fail to deserialize. Soft-delete only, and only when no data references it.</blockquote>`,
        he: `<p>הבדיקה של ה-registry בזמן produce היא קו ההגנה האחרון — בשלב הזה ה-deploy כבר חי וה-produce נכשל. מזיזים אותה שמאלה: PR שמשנה סכמה או מיגרציה של DB על טבלה עם CDC חייב להיכשל ב-CI.</p>
<pre># .github/workflows/contracts.yml
name: data-contracts
on: [pull_request]
jobs:
  compat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Schema compatibility vs production registry
        run: |
          for f in schemas/*.avsc; do
            subject="$(basename "$f" .avsc)-value"
            jq -n --rawfile s "$f" '{schema: $s}' &gt; /tmp/req.json
            curl -sf -u "$SR_KEY:$SR_SECRET" -X POST \\
              -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
              --data @/tmp/req.json \\
              "$SR_URL/compatibility/subjects/$subject/versions/latest" \\
              | jq -e '.is_compatible' || { echo "BREAKING: $f"; exit 1; }
          done
      - name: Contract lint + breaking-change check
        run: |
          pip install datacontract-cli
          datacontract lint contracts/orders-paid.yaml
          datacontract breaking contracts/orders-paid.yaml origin/main:contracts/orders-paid.yaml</pre>
<p>ב-Protobuf, <code>buf breaking --against '.git#branch=main'</code> עושה אותו דבר. רושמים סכמות מה-CI (ה-pipeline הוא הזהות היחידה שמורשית לכתוב), אף פעם לא מהאפליקציות.</p>
<p><strong>כשבאמת חייבים לשבור</strong>: יוצרים topic חדש עם major version (<code>orders.order-paid.v2</code>), מפרסמים לשניהם (או מגשרים v1 → v2 עם stream job קטן), מעבירים צרכנים אחד-אחד לפי רשימת הצרכנים ב-contract, מחכים שה-lag של ה-consumer groups על v1 יגיע לאפס ויישאר בלי פעילות, ואז קובעים תאריך sunset ומוחקים את v1. אותו קצב של expand → migrate → contract כמו במיגרציה של דאטהבייס.</p>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם אל "תתקן" סכמה גרועה על ידי מחיקת גרסת ה-subject ב-registry. הודעות שכבר ב-Kafka עדיין נושאות את ה-schema ID הזה; צרכנים שינסו להביא אותו מאוחר יותר ייכשלו ב-deserialization. רק soft-delete, ורק כשאין נתונים שמפנים אליו.</blockquote>`
      }
    }
  ],
  diagram: "PR (schema / migration / contract) --CI--> compat check vs registry + datacontract breaking\n        | merge\n        v\nCI registers schema v8 --> Schema Registry (orders-value, FULL_TRANSITIVE)\nproducer (auto.register=false) --[0x00|id=1187|avro bytes]--> Kafka --> consumer fetches id 1187 (cached)",
  handsOn: [
    { cmd: "curl -s http://schema-registry:8081/subjects/orders-value/versions", what: { en: "List all registered versions of a subject.", he: "רשימת כל הגרסאות הרשומות של subject." } },
    { cmd: "curl -s http://schema-registry:8081/config/orders-value?defaultToGlobal=true", what: { en: "See the effective compatibility mode for the subject.", he: "תראה את מצב ה-compatibility שבפועל חל על ה-subject." } },
    { cmd: "kcat -b kafka:9092 -t orders -C -c 1 -f '%s' | head -c 5 | xxd", what: { en: "Look at the 5-byte header: magic byte 00 + 4-byte schema ID.", he: "תסתכל על ה-header של 5 bytes: magic byte 00 ועוד schema ID של 4 bytes." } },
    { cmd: "buf breaking proto --against '.git#branch=main'", what: { en: "Protobuf breaking-change check in CI (field numbers, types, removed fields).", he: "בדיקת breaking changes ל-Protobuf ב-CI (מספרי שדות, טיפוסים, שדות שנמחקו)." } }
  ],
  mnemonic: { en: "\"BACKWARD = new reads old, so upgrade readers first; FORWARD = old reads new, so upgrade writers first.\" And: defaults on everything.", he: "\"BACKWARD = החדש קורא את הישן, אז קודם משדרגים קוראים; FORWARD = הישן קורא את החדש, אז קודם משדרגים כותבים.\" ועוד: defaults על הכול." },
  pitfalls: [
    { en: "auto.register.schemas=true in production: the first deploy of a buggy producer registers the breaking schema itself.", he: "auto.register.schemas=true בפרודקשן: ה-deploy הראשון של producer עם באג רושם בעצמו את הסכמה השוברת." },
    { en: "Using BACKWARD (non-transitive) on topics that are replayed from the beginning: v3 is compatible with v2 but not with v1 data still in the topic or lake.", he: "להשתמש ב-BACKWARD (לא transitive) על topics שמנגנים מההתחלה: v3 תואם ל-v2 אבל לא לנתונים של v1 שעדיין ב-topic או ב-lake." },
    { en: "Treating CDC topics as internal: a DB column rename becomes a breaking change for every consumer of the raw table topic. Put CDC tables under the same contract checks or publish via an outbox.", he: "להתייחס ל-CDC topics כפנימיים: rename של עמודה ב-DB הופך ל-breaking change לכל צרכן של ה-topic של הטבלה הגולמית. שים טבלאות CDC תחת אותן בדיקות contract או פרסם דרך outbox." },
    { en: "Semantic changes that pass every schema check: switching amount from shekels to agorot keeps the type long. Only contracts with semantics + quality rules catch this.", he: "שינויים סמנטיים שעוברים כל בדיקת סכמה: מעבר של amount משקלים לאגורות משאיר את הטיפוס long. רק contracts עם סמנטיקה וכללי איכות תופסים את זה." }
  ],
  interview: [
    { q: { en: "A team wants to add a required field to an event. How do you roll it out?", he: "צוות רוצה להוסיף שדה חובה ל-event. איך מגלגלים את זה?" },
      a: { en: "Add it as optional with a default (compatible under FULL), deploy producers to populate it, verify via a contract quality check that ~100% of new events have it, then move consumers to rely on it. If it truly must be non-null for old data too, that's a new major version topic with a backfill.", he: "מוסיפים אותו כאופציונלי עם default (תואם ב-FULL), עושים deploy ל-producers שימלאו אותו, מוודאים עם בדיקת איכות ב-contract שכ-100% מה-events החדשים מכילים אותו, ואז מעבירים את הצרכנים להסתמך עליו. אם הוא באמת חייב להיות non-null גם לנתונים ישנים, זה topic חדש עם major version ועם backfill." } },
    { q: { en: "What is in a data contract that is not in a schema?", he: "מה יש ב-data contract שאין בסכמה?" },
      a: { en: "Ownership and on-call contact, semantics (units, meaning, PII classification), quality rules (ranges, uniqueness, valid values), SLAs (freshness/latency, availability, retention), versioning and deprecation policy, and the list of consumers.", he: "בעלות ואיש קשר ב-on-call, סמנטיקה (יחידות, משמעות, סיווג PII), כללי איכות (טווחים, ייחודיות, ערכים מותרים), SLAs (freshness או latency, זמינות, retention), מדיניות גרסאות ו-deprecation, ורשימת הצרכנים." } }
  ],
  quiz: [
    { q: { en: "Under BACKWARD compatibility, which change is allowed?", he: "תחת BACKWARD compatibility, איזה שינוי מותר?" },
      options: [ { en: "Add a field without a default", he: "להוסיף שדה בלי default" }, { en: "Add a field with a default", he: "להוסיף שדה עם default" }, { en: "Change a field from long to string", he: "לשנות שדה מ-long ל-string" }, { en: "Reuse a deleted field's name with a different type", he: "למחזר שם של שדה שנמחק עם טיפוס אחר" } ],
      answer: 1,
      explain: { en: "The new reader must decode old records; a default lets it fill the missing field.", he: "הקורא החדש חייב לפענח רשומות ישנות; default מאפשר לו למלא את השדה החסר." } },
    { q: { en: "With BACKWARD compatibility, which side do you deploy first?", he: "עם BACKWARD compatibility, איזה צד עושים לו deploy קודם?" },
      options: [ { en: "Producers", he: "Producers" }, { en: "Consumers", he: "צרכנים" }, { en: "Both at the exact same time", he: "שניהם בדיוק באותו רגע" }, { en: "Order doesn't matter", he: "הסדר לא משנה" } ],
      answer: 1,
      explain: { en: "BACKWARD guarantees new readers handle old data, so upgrade consumers first; old producers keep writing data they can read.", he: "BACKWARD מבטיח שקוראים חדשים מטפלים בנתונים ישנים, אז קודם משדרגים צרכנים; producers ישנים ממשיכים לכתוב נתונים שהם יודעים לקרוא." } },
    { q: { en: "What do the first 5 bytes of a Confluent-serialized Kafka message contain?", he: "מה יש ב-5 ה-bytes הראשונים של הודעת Kafka שעברה serialization של Confluent?" },
      options: [ { en: "The full schema JSON", he: "ה-JSON המלא של הסכמה" }, { en: "Magic byte 0 + 4-byte schema ID", he: "Magic byte 0 ועוד schema ID של 4 bytes" }, { en: "Topic name hash", he: "Hash של שם ה-topic" }, { en: "CRC checksum", he: "CRC checksum" } ],
      answer: 1,
      explain: { en: "Consumers look up the schema by ID in the registry and cache it.", he: "הצרכנים מחפשים את הסכמה לפי ה-ID ב-registry ושומרים אותה ב-cache." } },
    { q: { en: "Why add a default symbol (e.g. UNKNOWN) to an Avro enum?", he: "למה להוסיף symbol ברירת מחדל (למשל UNKNOWN) ל-enum של Avro?" },
      options: [ { en: "It makes messages smaller", he: "זה מקטין את ההודעות" }, { en: "So old readers don't fail when producers add new symbols", he: "כדי שקוראים ישנים לא ייכשלו כש-producers מוסיפים symbols חדשים" }, { en: "Avro requires it", he: "Avro מחייב את זה" }, { en: "It enables compaction", he: "זה מאפשר compaction" } ],
      answer: 1,
      explain: { en: "An unknown symbol resolves to the enum default instead of throwing, which keeps adding symbols forward-compatible.", he: "Symbol לא מוכר מתורגם ל-default של ה-enum במקום לזרוק שגיאה, וכך הוספת symbols נשארת forward-compatible." } }
  ],
  related: ["staff-kafka-deep", "data-cdc-debezium", "data-quality-observability", "data-stream-processing", "staff-zero-downtime-migrations"]
});

INFRA.lessons.push({
  id: "data-quality-observability",
  track: "data",
  order: 44,
  icon: "🔬",
  level: 2,
  minutes: 16,
  title: { en: "Data Quality & Pipeline Observability", he: "Data Quality ו-observability ל-pipelines" },
  tldr: {
    en: "Bad data fails silently: the job is green and the dashboard is wrong. Monitor the data itself (freshness, volume, schema, distribution, lineage), test it where it's produced (dbt tests, Soda/GX), make every pipeline idempotent so retries and backfills are safe, and handle bad data like any other incident.",
    he: "נתונים גרועים נכשלים בשקט: ה-job ירוק והדשבורד שגוי. מנטרים את הנתונים עצמם (freshness, volume, schema, distribution, lineage), בודקים אותם במקום שבו הם נוצרים (dbt tests, Soda או GX), הופכים כל pipeline לאידמפוטנטי כדי ש-retries ו-backfills יהיו בטוחים, ומטפלים בנתונים גרועים כמו בכל אינסידנט אחר."
  },
  analogy: {
    en: "A water utility doesn't only check that the pumps are running (job succeeded) — it samples the water: is it arriving on time (freshness), the usual volume, the right pipes (schema), clean (distribution), and if it's contaminated, which reservoir did it come from and which neighborhoods drank it (lineage). And it can flush and refill a section without poisoning the rest (idempotent backfill).",
    he: "תאגיד מים לא בודק רק שהמשאבות עובדות (ה-job הצליח) — הוא לוקח דגימות מהמים: האם הם מגיעים בזמן (freshness), בכמות הרגילה, בצינורות הנכונים (schema), נקיים (distribution), ואם יש זיהום, מאיזה מאגר זה הגיע ואילו שכונות שתו (lineage). והוא יכול לשטוף ולמלא מחדש קטע אחד בלי להרעיל את השאר (backfill אידמפוטנטי)."
  },
  sections: [
    {
      h: { en: "The five signals of data health", he: "חמשת הסיגנלים של בריאות נתונים" },
      body: {
        en: `<table>
<tr><th>Signal</th><th>Question</th><th>Typical check</th></tr>
<tr><td><strong>Freshness</strong></td><td>Is the latest data recent enough?</td><td><code>now() - max(updated_at) &lt; 2h</code></td></tr>
<tr><td><strong>Volume</strong></td><td>Did we get roughly the expected number of rows?</td><td>Today's rows within ±3σ of the same weekday over 4 weeks</td></tr>
<tr><td><strong>Schema</strong></td><td>Did columns/types change?</td><td>Column added/dropped/retyped vs last run or contract</td></tr>
<tr><td><strong>Distribution</strong></td><td>Are the values sane?</td><td>Null rate, % negative, distinct count, mean/percentiles, accepted values</td></tr>
<tr><td><strong>Lineage</strong></td><td>Where did it come from, who consumes it?</td><td>Upstream/downstream graph to find root cause and blast radius</td></tr>
</table>
<p>Pipeline observability (job duration, success, retries, consumer lag) is necessary but not sufficient: the classic incident is a job that "succeeds" in 3 minutes because the upstream export was empty, overwrites yesterday's good table with nothing, and the CFO's revenue dashboard shows ₪0.</p>
<blockquote>💡 Real world: freshness is the highest-value single check. In most data teams, the majority of "the dashboard is wrong" tickets are actually "the data is stale" — a late upstream, a stuck slot, a paused DAG. Alert on it per critical table, with a threshold derived from the business SLA, not a guess.</blockquote>`,
        he: `<table>
<tr><th>סיגנל</th><th>שאלה</th><th>בדיקה טיפוסית</th></tr>
<tr><td><strong>Freshness</strong></td><td>האם הנתונים האחרונים טריים מספיק?</td><td><code>now() - max(updated_at) &lt; 2h</code></td></tr>
<tr><td><strong>Volume</strong></td><td>האם קיבלנו בערך את מספר השורות הצפוי?</td><td>השורות של היום בטווח ±3σ מאותו יום בשבוע ב-4 השבועות האחרונים</td></tr>
<tr><td><strong>Schema</strong></td><td>האם עמודות או טיפוסים השתנו?</td><td>עמודה שנוספה, נמחקה או שינתה טיפוס מול הריצה הקודמת או ה-contract</td></tr>
<tr><td><strong>Distribution</strong></td><td>האם הערכים הגיוניים?</td><td>אחוז nulls, אחוז שליליים, distinct count, ממוצע ו-percentiles, ערכים מותרים</td></tr>
<tr><td><strong>Lineage</strong></td><td>מאיפה זה הגיע, ומי צורך את זה?</td><td>גרף upstream ו-downstream כדי למצוא root cause ו-blast radius</td></tr>
</table>
<p>Observability של ה-pipeline (משך job, הצלחה, retries, consumer lag) הכרחי אבל לא מספיק: האינסידנט הקלאסי הוא job ש"מצליח" ב-3 דקות כי ה-export מלמעלה היה ריק, דורס את הטבלה הטובה של אתמול בכלום, והדשבורד של ההכנסות של ה-CFO מראה ₪0.</p>
<blockquote>💡 מהשטח: freshness היא הבדיקה הבודדת עם הערך הכי גבוה. ברוב צוותי הדאטה, רוב הטיקטים של "הדשבורד שגוי" הם בעצם "הנתונים לא עדכניים" — upstream שאיחר, slot תקוע, DAG מושהה. שים alert על זה לכל טבלה קריטית, עם סף שנגזר מה-SLA העסקי, לא מניחוש.</blockquote>`
      }
    },
    {
      h: { en: "Tests: dbt, Soda, Great Expectations", he: "בדיקות: dbt, Soda ו-Great Expectations" },
      body: {
        en: `<pre># models/marts/schema.yml  (dbt 1.8+: "data_tests:"; older versions use "tests:")
sources:
  - name: orders_cdc
    loaded_at_field: _ingested_at
    freshness:
      warn_after:  {count: 1, period: hour}
      error_after: {count: 3, period: hour}
    tables: [{ name: orders }]

models:
  - name: fct_orders
    data_tests:
      - dbt_utils.recency: {datepart: hour, field: created_at, interval: 3}
    columns:
      - name: order_id
        data_tests: [unique, not_null]
      - name: customer_id
        data_tests:
          - relationships: {to: ref('dim_customers'), field: customer_id}
      - name: status
        data_tests:
          - accepted_values: {values: [placed, paid, shipped, refunded]}
      - name: amount_cents
        data_tests:
          - dbt_utils.accepted_range: {min_value: 0, config: {severity: error, store_failures: true}}</pre>
<pre>dbt source freshness            # writes target/sources.json, non-zero exit on error_after
dbt build --select fct_orders+  # run + test the model and everything downstream, in DAG order</pre>
<p><code>dbt build</code> stops downstream models when a test with <code>severity: error</code> fails — that's a <strong>circuit breaker</strong>: bad data stays in staging instead of reaching the dashboard. Use <code>warn</code> for soft signals.</p>
<pre># Soda (SodaCL) — checks.yml, runnable against Postgres/Snowflake/BigQuery/Spark
checks for fct_orders:
  - freshness(created_at) &lt; 2h
  - row_count between 80000 and 200000
  - missing_count(customer_id) = 0
  - duplicate_count(order_id) = 0
  - invalid_percent(currency) &lt; 0.1%:
      valid values: [ILS, USD, EUR]
  - anomaly detection for row_count</pre>
<p><strong>Great Expectations (GX)</strong> does the same with Python "expectations" (<code>ExpectColumnValuesToNotBeNull</code>, <code>ExpectColumnValuesToBeBetween</code>) grouped into suites and run by checkpoints, with HTML "data docs". Pick one framework per platform; the value is in coverage of critical tables, not tool choice.</p>`,
        he: `<pre># models/marts/schema.yml  (dbt 1.8+: "data_tests:"; older versions use "tests:")
sources:
  - name: orders_cdc
    loaded_at_field: _ingested_at
    freshness:
      warn_after:  {count: 1, period: hour}
      error_after: {count: 3, period: hour}
    tables: [{ name: orders }]

models:
  - name: fct_orders
    data_tests:
      - dbt_utils.recency: {datepart: hour, field: created_at, interval: 3}
    columns:
      - name: order_id
        data_tests: [unique, not_null]
      - name: customer_id
        data_tests:
          - relationships: {to: ref('dim_customers'), field: customer_id}
      - name: status
        data_tests:
          - accepted_values: {values: [placed, paid, shipped, refunded]}
      - name: amount_cents
        data_tests:
          - dbt_utils.accepted_range: {min_value: 0, config: {severity: error, store_failures: true}}</pre>
<pre>dbt source freshness            # writes target/sources.json, non-zero exit on error_after
dbt build --select fct_orders+  # run + test the model and everything downstream, in DAG order</pre>
<p><code>dbt build</code> עוצר מודלים למטה כשבדיקה עם <code>severity: error</code> נכשלת — זה <strong>circuit breaker</strong>: נתונים גרועים נשארים ב-staging במקום להגיע לדשבורד. השתמש ב-<code>warn</code> לסיגנלים רכים.</p>
<pre># Soda (SodaCL) — checks.yml, runnable against Postgres/Snowflake/BigQuery/Spark
checks for fct_orders:
  - freshness(created_at) &lt; 2h
  - row_count between 80000 and 200000
  - missing_count(customer_id) = 0
  - duplicate_count(order_id) = 0
  - invalid_percent(currency) &lt; 0.1%:
      valid values: [ILS, USD, EUR]
  - anomaly detection for row_count</pre>
<p><strong>Great Expectations (GX)</strong> עושה אותו דבר עם "expectations" ב-Python (<code>ExpectColumnValuesToNotBeNull</code>, <code>ExpectColumnValuesToBeBetween</code>) שמקובצות ל-suites ורצות דרך checkpoints, עם "data docs" ב-HTML. בחר framework אחד לפלטפורמה; הערך הוא בכיסוי של הטבלאות הקריטיות, לא בבחירת הכלי.</p>`
      }
    },
    {
      h: { en: "Anomaly detection and lineage with OpenLineage", he: "זיהוי אנומליות ו-lineage עם OpenLineage" },
      body: {
        en: `<p>Static thresholds rot ("row_count &gt; 80,000" is wrong on Saturdays and wrong after the business doubles). Anomaly detection compares to history with seasonality:</p>
<pre>-- volume anomaly: today vs the same weekday over the last 4 weeks
WITH daily AS (
  SELECT date_trunc('day', created_at) AS d, count(*) AS n
  FROM fct_orders WHERE created_at &gt;= current_date - 35 GROUP BY 1)
SELECT t.n AS today, avg(h.n) AS baseline, stddev(h.n) AS sd,
       (t.n - avg(h.n)) / nullif(stddev(h.n), 0) AS z
FROM daily t JOIN daily h
  ON extract(dow FROM h.d) = extract(dow FROM t.d) AND h.d &lt; t.d
WHERE t.d = current_date - 1
GROUP BY t.n;      -- alert if |z| &gt; 3</pre>
<p>Managed tools (Monte Carlo, Bigeye, Elementary for dbt, Soda Cloud, Databricks Lakehouse Monitoring) do this per table automatically, with ML on seasonality.</p>
<p><strong>Lineage</strong> answers "the revenue table is wrong — which upstream broke, and what else is affected?". <strong>OpenLineage</strong> is the open standard: each job run emits <code>START</code>/<code>COMPLETE</code>/<code>FAIL</code> events naming its inputs and outputs (with optional column-level lineage facets). Airflow (<code>apache-airflow-providers-openlineage</code>), Spark, Flink and dbt (<code>dbt-ol</code>) have integrations; Marquez is the reference backend, and DataHub, OpenMetadata and cloud catalogs consume it.</p>
<pre>{
  "eventType": "COMPLETE",
  "eventTime": "2026-11-14T03:12:44Z",
  "run": {"runId": "0193a1c2-7d1e-7c4a-9b1f-1d6e2a9b0f11"},
  "job": {"namespace": "airflow-prod", "name": "daily_revenue.build_fct_orders"},
  "inputs":  [{"namespace": "postgres://orders-db:5432", "name": "orders.public.orders"}],
  "outputs": [{"namespace": "snowflake://acme", "name": "ANALYTICS.MARTS.FCT_ORDERS"}],
  "producer": "https://github.com/OpenLineage/OpenLineage/tree/1.24.0/integration/airflow"
}</pre>`,
        he: `<p>ספים סטטיים מתיישנים ("row_count &gt; 80,000" שגוי בשבת ושגוי אחרי שהביזנס מכפיל את עצמו). זיהוי אנומליות משווה להיסטוריה עם עונתיות:</p>
<pre>-- volume anomaly: today vs the same weekday over the last 4 weeks
WITH daily AS (
  SELECT date_trunc('day', created_at) AS d, count(*) AS n
  FROM fct_orders WHERE created_at &gt;= current_date - 35 GROUP BY 1)
SELECT t.n AS today, avg(h.n) AS baseline, stddev(h.n) AS sd,
       (t.n - avg(h.n)) / nullif(stddev(h.n), 0) AS z
FROM daily t JOIN daily h
  ON extract(dow FROM h.d) = extract(dow FROM t.d) AND h.d &lt; t.d
WHERE t.d = current_date - 1
GROUP BY t.n;      -- alert if |z| &gt; 3</pre>
<p>כלים מנוהלים (Monte Carlo, Bigeye, Elementary ל-dbt, Soda Cloud, Databricks Lakehouse Monitoring) עושים את זה לכל טבלה אוטומטית, עם ML על עונתיות.</p>
<p><strong>Lineage</strong> עונה על "טבלת ההכנסות שגויה — איזה upstream נשבר, ומה עוד מושפע?". <strong>OpenLineage</strong> הוא הסטנדרט הפתוח: כל ריצה של job שולחת events של <code>START</code>, <code>COMPLETE</code> או <code>FAIL</code> עם שמות ה-inputs וה-outputs שלה (ואופציונלית facets של lineage ברמת עמודה). ל-Airflow (<code>apache-airflow-providers-openlineage</code>), Spark, Flink ו-dbt (<code>dbt-ol</code>) יש אינטגרציות; Marquez הוא ה-backend הרפרנסי, ו-DataHub, OpenMetadata וה-catalogs של העננים צורכים אותו.</p>
<pre>{
  "eventType": "COMPLETE",
  "eventTime": "2026-11-14T03:12:44Z",
  "run": {"runId": "0193a1c2-7d1e-7c4a-9b1f-1d6e2a9b0f11"},
  "job": {"namespace": "airflow-prod", "name": "daily_revenue.build_fct_orders"},
  "inputs":  [{"namespace": "postgres://orders-db:5432", "name": "orders.public.orders"}],
  "outputs": [{"namespace": "snowflake://acme", "name": "ANALYTICS.MARTS.FCT_ORDERS"}],
  "producer": "https://github.com/OpenLineage/OpenLineage/tree/1.24.0/integration/airflow"
}</pre>`
      }
    },
    {
      h: { en: "Orchestrators, idempotency and safe backfills", he: "Orchestrators, אידמפוטנטיות ו-backfills בטוחים" },
      body: {
        en: `<p><strong>Airflow</strong> schedules DAGs of tasks per <em>data interval</em>; <strong>Dagster</strong> models <em>assets</em> (tables) with partitions, asset checks and freshness policies built in. Both retry tasks — which is only safe if the task is <strong>idempotent</strong>: running it twice for the same interval gives the same result.</p>
<pre># Airflow 2.x/3.x
@dag(schedule="@daily", start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
     catchup=False, max_active_runs=1,
     default_args={"retries": 3, "retry_delay": timedelta(minutes=5),
                   "retry_exponential_backoff": True,
                   "execution_timeout": timedelta(hours=1)})
def daily_revenue():
    @task
    def build(data_interval_start=None, data_interval_end=None):
        # idempotent: replace exactly this interval's partition, never "append what's new"
        run_sql("""
          DELETE FROM fct_revenue WHERE day = %(day)s;
          INSERT INTO fct_revenue
          SELECT %(day)s, sum(amount_cents) FROM orders
          WHERE paid_at &gt;= %(start)s AND paid_at &lt; %(end)s;""",
          day=data_interval_start.date(), start=data_interval_start, end=data_interval_end)
    build()</pre>
<p>Idempotency patterns: <strong>partition overwrite</strong> (<code>INSERT OVERWRITE</code>, Spark <code>partitionOverwriteMode=dynamic</code>, Iceberg <code>overwritePartitions()</code>), <strong>MERGE on a natural key</strong>, delete+insert in one transaction. Anti-patterns: <code>INSERT ... SELECT WHERE ts &gt; now() - interval '1 day'</code> (depends on when it runs), appending without dedup, using <code>now()</code> instead of the interval boundaries.</p>
<p><strong>SLAs</strong>: Airflow 2's <code>sla=</code> was removed in Airflow 3; 3.1 introduces <strong>Deadline Alerts</strong>. Many teams instead alert on the <em>output</em> (freshness check on the table) — it catches every cause, including "the DAG was paused".</p>
<p><strong>Backfills done safely</strong>:</p>
<ol>
<li>Prove the task is idempotent and uses interval boundaries, not <code>now()</code>.</li>
<li>Write to a branch/staging first: Iceberg <strong>Write-Audit-Publish</strong> (write to a branch, run tests, then fast-forward <code>main</code>), or a <code>_backfill</code> table you swap in.</li>
<li>Limit concurrency (<code>max_active_runs</code>, pools) — 365 parallel runs will flatten the source DB and the warehouse budget.</li>
<li>Run oldest → newest, so cumulative tables (SCD2, running totals) stay correct, then run downstream models.</li>
<li>Announce it: dashboards will move; consumers should know which dates changed.</li>
</ol>
<pre># Airflow 3
airflow backfill create --dag-id daily_revenue --from-date 2026-10-01 --to-date 2026-10-31 --max-active-runs 4
# Airflow 2
airflow dags backfill -s 2026-10-01 -e 2026-10-31 daily_revenue</pre>`,
        he: `<p><strong>Airflow</strong> מתזמן DAGs של tasks לכל <em>data interval</em>; <strong>Dagster</strong> ממדל <em>assets</em> (טבלאות) עם partitions, asset checks ו-freshness policies מובנים. שניהם עושים retry ל-tasks — וזה בטוח רק אם ה-task <strong>אידמפוטנטי</strong>: להריץ אותו פעמיים על אותו interval נותן אותה תוצאה.</p>
<pre># Airflow 2.x/3.x
@dag(schedule="@daily", start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),
     catchup=False, max_active_runs=1,
     default_args={"retries": 3, "retry_delay": timedelta(minutes=5),
                   "retry_exponential_backoff": True,
                   "execution_timeout": timedelta(hours=1)})
def daily_revenue():
    @task
    def build(data_interval_start=None, data_interval_end=None):
        # idempotent: replace exactly this interval's partition, never "append what's new"
        run_sql("""
          DELETE FROM fct_revenue WHERE day = %(day)s;
          INSERT INTO fct_revenue
          SELECT %(day)s, sum(amount_cents) FROM orders
          WHERE paid_at &gt;= %(start)s AND paid_at &lt; %(end)s;""",
          day=data_interval_start.date(), start=data_interval_start, end=data_interval_end)
    build()</pre>
<p>דפוסים של אידמפוטנטיות: <strong>partition overwrite</strong> (<code>INSERT OVERWRITE</code>, ב-Spark <code>partitionOverwriteMode=dynamic</code>, ב-Iceberg <code>overwritePartitions()</code>), <strong>MERGE לפי natural key</strong>, ו-delete+insert בטרנזקציה אחת. אנטי-דפוסים: <code>INSERT ... SELECT WHERE ts &gt; now() - interval '1 day'</code> (תלוי מתי זה רץ), append בלי dedup, ושימוש ב-<code>now()</code> במקום בגבולות ה-interval.</p>
<p><strong>SLAs</strong>: ה-<code>sla=</code> של Airflow 2 הוסר ב-Airflow 3; גרסה 3.1 מציגה <strong>Deadline Alerts</strong>. הרבה צוותים שמים alert דווקא על ה-<em>output</em> (בדיקת freshness על הטבלה) — זה תופס כל סיבה, כולל "ה-DAG היה מושהה".</p>
<p><strong>Backfills בצורה בטוחה</strong>:</p>
<ol>
<li>להוכיח שה-task אידמפוטנטי ומשתמש בגבולות ה-interval, לא ב-<code>now()</code>.</li>
<li>לכתוב קודם ל-branch או ל-staging: <strong>Write-Audit-Publish</strong> של Iceberg (כותבים ל-branch, מריצים בדיקות, ואז עושים fast-forward ל-<code>main</code>), או טבלת <code>_backfill</code> שמחליפים אליה.</li>
<li>להגביל מקביליות (<code>max_active_runs</code>, pools) — 365 ריצות במקביל ישטחו את ה-DB של המקור ואת התקציב של ה-warehouse.</li>
<li>להריץ מהישן לחדש, כדי שטבלאות מצטברות (SCD2, סכומים רצים) יישארו נכונות, ואז להריץ את המודלים שלמטה.</li>
<li>להודיע: דשבורדים יזוזו; הצרכנים צריכים לדעת אילו תאריכים השתנו.</li>
</ol>
<pre># Airflow 3
airflow backfill create --dag-id daily_revenue --from-date 2026-10-01 --to-date 2026-10-31 --max-active-runs 4
# Airflow 2
airflow dags backfill -s 2026-10-01 -e 2026-10-31 daily_revenue</pre>`
      }
    },
    {
      h: { en: "Handling a bad-data incident", he: "טיפול באינסידנט של נתונים גרועים" },
      body: {
        en: `<p>Treat it exactly like a production outage — with a severity, an incident commander and a timeline. The playbook:</p>
<ol>
<li><strong>Detect &amp; declare</strong>: who noticed (a check, or worse, the CEO)? Open an incident channel; severity depends on consumers (billing, ML features, regulatory reports &gt; internal dashboards).</li>
<li><strong>Stop the bleeding</strong>: pause the downstream DAGs/consumers (circuit breaker) so bad rows don't spread into features, emails, invoices. Mark affected dashboards "data under investigation".</li>
<li><strong>Scope with lineage</strong>: which tables, which partitions/dates, which consumers. Query the time-travel snapshot to compare good vs bad.</li>
<li><strong>Fix the source</strong>: upstream bug, schema change, duplicate replay, timezone shift. Add the test that would have caught it <em>before</em> repairing.</li>
<li><strong>Repair</strong>: roll back the table (<code>CALL lake.system.rollback_to_snapshot('db.fct_orders', 8790)</code>, Snowflake <code>UNDROP</code>/Time Travel, Delta <code>RESTORE TABLE ... TO VERSION AS OF</code>), then an idempotent backfill of the affected intervals, then downstream.</li>
<li><strong>Notify consumers</strong> of what was wrong, for which dates, and whether they need to re-pull (ML models trained on bad data may need retraining).</li>
<li><strong>Postmortem</strong>: blameless, with action items: the missing check, the missing contract, the non-idempotent step.</li>
</ol>
<blockquote>⚠️ Production tip: the most expensive bad-data incidents are the ones that reach <em>external</em> systems: emails sent, invoices issued, ad bids placed, ML models deployed. Put the strongest gates (error-severity tests, WAP) right before every system that acts on data, not only at ingestion.</blockquote>`,
        he: `<p>מתייחסים לזה בדיוק כמו להשבתה בפרודקשן — עם severity, incident commander ו-timeline. ה-playbook:</p>
<ol>
<li><strong>זיהוי והכרזה</strong>: מי שם לב (בדיקה, או גרוע יותר, ה-CEO)? פותחים ערוץ אינסידנט; ה-severity תלוי בצרכנים (חיוב, features של ML, דוחות רגולטוריים &gt; דשבורדים פנימיים).</li>
<li><strong>לעצור את הדימום</strong>: משהים את ה-DAGs והצרכנים למטה (circuit breaker) כדי ששורות גרועות לא יתפשטו ל-features, מיילים וחשבוניות. מסמנים את הדשבורדים המושפעים "נתונים בבדיקה".</li>
<li><strong>מיפוי עם lineage</strong>: אילו טבלאות, אילו partitions ותאריכים, אילו צרכנים. מתשאלים את ה-snapshot של time travel כדי להשוות טוב מול גרוע.</li>
<li><strong>לתקן את המקור</strong>: באג למעלה, שינוי סכמה, replay כפול, הזזה של timezone. מוסיפים את הבדיקה שהייתה תופסת את זה <em>לפני</em> התיקון.</li>
<li><strong>תיקון הנתונים</strong>: rollback לטבלה (<code>CALL lake.system.rollback_to_snapshot('db.fct_orders', 8790)</code>, ב-Snowflake <code>UNDROP</code> או Time Travel, ב-Delta <code>RESTORE TABLE ... TO VERSION AS OF</code>), ואז backfill אידמפוטנטי של ה-intervals שהושפעו, ואז כל מה שלמטה.</li>
<li><strong>לעדכן את הצרכנים</strong> מה היה שגוי, באילו תאריכים, והאם הם צריכים למשוך מחדש (מודלים של ML שאומנו על נתונים גרועים אולי צריכים אימון מחדש).</li>
<li><strong>Postmortem</strong>: blameless, עם action items: הבדיקה שחסרה, ה-contract שחסר, השלב שלא היה אידמפוטנטי.</li>
</ol>
<blockquote>⚠️ טיפ לפרודקשן: האינסידנטים הכי יקרים של נתונים גרועים הם אלה שמגיעים למערכות <em>חיצוניות</em>: מיילים שנשלחו, חשבוניות שהונפקו, הצעות מחיר לפרסומות, מודלים של ML שעלו. שים את השערים החזקים ביותר (בדיקות עם severity של error, WAP) ממש לפני כל מערכת שפועלת על נתונים, לא רק ב-ingestion.</blockquote>`
      }
    }
  ],
  diagram: "sources --CDC/ELT--> staging --dbt build (tests = circuit breaker)--> marts --> dashboards / ML / invoices\n   |                      |                         |\n   +--- OpenLineage events (START/COMPLETE/FAIL, inputs/outputs) ---> lineage graph (Marquez / DataHub)\n   freshness + volume + schema + distribution checks ---> alerts ---> on-call (bad-data incident playbook)",
  handsOn: [
    { cmd: "dbt source freshness && dbt build --select state:modified+ --defer --state prod-artifacts/", what: { en: "Check source freshness, then build and test only changed models and their downstream (slim CI).", he: "בדוק freshness של המקורות, ואז בנה ובדוק רק מודלים שהשתנו ומה שתלוי בהם (slim CI)." } },
    { cmd: "soda scan -d snowflake_prod -c configuration.yml checks/fct_orders.yml", what: { en: "Run SodaCL checks against a production table.", he: "הרץ בדיקות SodaCL מול טבלה בפרודקשן." } },
    { cmd: "airflow tasks test daily_revenue build 2026-11-13", what: { en: "Run one task for a given logical date without recording state — run it twice and compare results to prove idempotency.", he: "הרץ task אחד לתאריך לוגי נתון בלי לשמור state — הרץ פעמיים והשווה תוצאות כדי להוכיח אידמפוטנטיות." } },
    { cmd: "spark-sql -e \"SELECT snapshot_id, committed_at, operation, summary['added-records'], summary['deleted-records'] FROM lake.db.fct_orders.snapshots ORDER BY committed_at DESC LIMIT 10\"", what: { en: "Find the snapshot where the bad write landed, before rolling back.", he: "מצא את ה-snapshot שבו נחתה הכתיבה הגרועה, לפני rollback." } }
  ],
  mnemonic: { en: "\"Fresh, Full, Formed, Fair, Followed\" — freshness, volume, schema, distribution, lineage. And: a green job is not good data.", he: "\"טרי, מלא, מבנה, הגיוני, מקור\" — freshness, volume, schema, distribution, lineage. ועוד: job ירוק זה לא נתונים טובים." },
  pitfalls: [
    { en: "Monitoring only job success: an empty upstream file produces a successful run that overwrites good data with nothing.", he: "לנטר רק הצלחה של jobs: קובץ ריק מלמעלה מייצר ריצה מוצלחת שדורסת נתונים טובים בכלום." },
    { en: "Non-idempotent tasks with retries=3: one network blip triples yesterday's revenue.", he: "Tasks לא אידמפוטנטיים עם retries=3: תקלת רשת אחת משלשת את ההכנסות של אתמול." },
    { en: "Using now() instead of data_interval_start/end: backfills compute today's data 365 times.", he: "להשתמש ב-now() במקום ב-data_interval_start/end: ה-backfill מחשב את הנתונים של היום 365 פעמים." },
    { en: "Hundreds of warn-level tests nobody reads: alert fatigue. Few, owned, error-level tests on critical tables beat 2,000 ignored ones.", he: "מאות בדיקות ברמת warn שאף אחד לא קורא: alert fatigue. מעט בדיקות ברמת error עם בעלים על טבלאות קריטיות עדיפות על 2,000 שמתעלמים מהן." }
  ],
  interview: [
    { q: { en: "What does 'idempotent pipeline' mean concretely, and how do you implement it?", he: "מה זה 'pipeline אידמפוטנטי' בפועל, ואיך מממשים את זה?" },
      a: { en: "Re-running a task for the same data interval yields the same final state. Implement with deterministic inputs (interval boundaries, not now()), and outputs that replace rather than append: partition overwrite, MERGE on a natural key, or delete+insert in one transaction; dedupe streams by event id.", he: "להריץ מחדש task על אותו data interval נותן אותו מצב סופי. מממשים עם קלטים דטרמיניסטיים (גבולות ה-interval, לא now()), ו-outputs שמחליפים במקום להוסיף: partition overwrite, MERGE לפי natural key, או delete+insert בטרנזקציה אחת; ובסטרימים עושים dedup לפי event id." } },
    { q: { en: "The finance dashboard shows a 40% drop yesterday. Walk through your response.", he: "הדשבורד של הכספים מראה ירידה של 40% אתמול. תעבור על התגובה שלך." },
      a: { en: "Check freshness first (is yesterday complete?), then volume per source via lineage to find where rows went missing, compare snapshots with time travel. Pause downstream consumers acting on it, fix the cause (late upstream, stuck CDC slot, filter bug), add the missing check, roll back or idempotently backfill the date range, rerun downstream, notify finance with what changed.", he: "קודם בודקים freshness (האם אתמול שלם?), ואז volume לכל מקור דרך ה-lineage כדי למצוא איפה נעלמו שורות, ומשווים snapshots עם time travel. משהים צרכנים למטה שפועלים על זה, מתקנים את הסיבה (upstream שאיחר, CDC slot תקוע, באג בפילטר), מוסיפים את הבדיקה שחסרה, עושים rollback או backfill אידמפוטנטי לטווח התאריכים, מריצים מחדש את מה שלמטה, ומעדכנים את הכספים מה השתנה." } }
  ],
  quiz: [
    { q: { en: "A daily job succeeds but the output table is empty because the upstream export was empty. Which check catches it first?", he: "job יומי מצליח אבל טבלת ה-output ריקה כי ה-export מלמעלה היה ריק. איזו בדיקה תופסת את זה ראשונה?" },
      options: [ { en: "Job success rate", he: "אחוז הצלחה של jobs" }, { en: "Volume check (row count vs baseline)", he: "בדיקת volume (מספר שורות מול baseline)" }, { en: "Schema check", he: "בדיקת סכמה" }, { en: "CPU usage of the worker", he: "צריכת CPU של ה-worker" } ],
      answer: 1,
      explain: { en: "The job ran fine and the schema didn't change; only the row count reveals that nothing arrived.", he: "ה-job רץ בסדר והסכמה לא השתנתה; רק מספר השורות חושף ששום דבר לא הגיע." } },
    { q: { en: "Which task is idempotent?", he: "איזה task הוא אידמפוטנטי?" },
      options: [ { en: "INSERT INTO t SELECT * FROM src WHERE ts > now() - interval '1 day'", he: "INSERT INTO t SELECT * FROM src WHERE ts > now() - interval '1 day'" }, { en: "Append all new files found in the bucket", he: "להוסיף את כל הקבצים החדשים שנמצאו ב-bucket" }, { en: "Overwrite partition day=D with rows where ts is in [D, D+1)", he: "לדרוס את partition day=D עם שורות שבהן ts בטווח [D, D+1)" }, { en: "Increment a counter table by today's count", he: "להגדיל טבלת מונה בספירה של היום" } ],
      answer: 2,
      explain: { en: "It depends only on the interval and replaces its output; running it twice yields the same table.", he: "הוא תלוי רק ב-interval ומחליף את ה-output שלו; להריץ אותו פעמיים נותן אותה טבלה." } },
    { q: { en: "What is OpenLineage?", he: "מה זה OpenLineage?" },
      options: [ { en: "A dashboard tool", he: "כלי דשבורדים" }, { en: "An open standard for job-run events describing inputs and outputs, used to build lineage graphs", he: "סטנדרט פתוח ל-events של ריצות jobs שמתארים inputs ו-outputs, ומשמש לבניית גרפי lineage" }, { en: "A schema registry", he: "Schema registry" }, { en: "An Airflow executor", he: "Executor של Airflow" } ],
      answer: 1,
      explain: { en: "Integrations in Airflow, Spark, Flink and dbt emit START/COMPLETE/FAIL events; backends like Marquez or DataHub build the graph.", he: "אינטגרציות ב-Airflow, Spark, Flink ו-dbt שולחות events של START, COMPLETE ו-FAIL; backends כמו Marquez או DataHub בונים את הגרף." } },
    { q: { en: "In a bad-data incident, what comes right after declaring it?", he: "באינסידנט של נתונים גרועים, מה בא מיד אחרי ההכרזה?" },
      options: [ { en: "Start a full backfill immediately", he: "להתחיל backfill מלא מיד" }, { en: "Pause downstream consumers so bad data stops spreading", he: "להשהות צרכנים למטה כדי שהנתונים הגרועים יפסיקו להתפשט" }, { en: "Write the postmortem", he: "לכתוב את ה-postmortem" }, { en: "Delete the table", he: "למחוק את הטבלה" } ],
      answer: 1,
      explain: { en: "Stop the bleeding first; backfilling before the cause is fixed just reproduces the bad data.", he: "קודם עוצרים את הדימום; backfill לפני שהסיבה תוקנה רק משחזר את הנתונים הגרועים." } }
  ],
  related: ["db-olap-columnar", "data-lakehouse-formats", "data-contracts-schema-registry", "obs-alerting", "pr-idempotency"]
});

// ---------- Glossary ----------
INFRA.glossary.push(
  { term: "Event time", track: "data", def: { en: "The timestamp inside an event (when it happened), as opposed to processing time (when a machine handles it); event-time windows give deterministic results on replay.", he: "ה-timestamp שבתוך ה-event (מתי זה קרה), בניגוד ל-processing time (מתי מכונה מטפלת בו); חלונות לפי event time נותנים תוצאות דטרמיניסטיות ב-replay." }, lesson: "data-stream-processing" },
  { term: "Savepoint", track: "data", def: { en: "A manually triggered, portable snapshot of a Flink job's state and source offsets, used to upgrade code or change parallelism without losing state.", he: "צילום נייד שמופעל ידנית של ה-state וה-offsets של job ב-Flink, שמשמש לשדרוג קוד או לשינוי parallelism בלי לאבד state." }, lesson: "data-stream-processing" },
  { term: "Session window", track: "data", def: { en: "A per-key window that stays open while events keep arriving and closes after a gap of inactivity (e.g. 30 min), so its length is driven by the data.", he: "חלון לכל key שנשאר פתוח כל עוד מגיעים events ונסגר אחרי פער של חוסר פעילות (למשל 30 דקות), כך שהאורך שלו נקבע לפי הנתונים." }, lesson: "data-stream-processing" },
  { term: "CDC (Change Data Capture)", track: "data", def: { en: "Streaming every committed insert/update/delete from a database by reading its replication log (Postgres WAL, MySQL binlog), e.g. with Debezium.", he: "הזרמה של כל insert/update/delete שעבר commit מדאטהבייס על ידי קריאת לוג השכפול שלו (ה-WAL של Postgres, ה-binlog של MySQL), למשל עם Debezium." }, lesson: "data-cdc-debezium" },
  { term: "Replication slot", track: "data", def: { en: "A Postgres server-side bookmark for a replication consumer; Postgres retains all WAL after the slot's restart_lsn, so an abandoned slot can fill the disk.", he: "סימנייה בצד השרת של Postgres בשביל צרכן שכפול; Postgres שומר את כל ה-WAL אחרי ה-restart_lsn של ה-slot, אז slot נטוש יכול למלא את הדיסק." }, lesson: "data-cdc-debezium" },
  { term: "Kafka Connect", track: "data", def: { en: "Kafka's framework for running source and sink connectors (e.g. Debezium, JDBC, S3) on a distributed worker cluster that stores configs, offsets and status in Kafka topics.", he: "ה-framework של Kafka להרצת connectors של source ו-sink (למשל Debezium, JDBC, S3) על קלאסטר מבוזר של workers ששומר configs, offsets וסטטוס ב-topics של Kafka." }, lesson: "data-cdc-debezium" },
  { term: "Hidden partitioning", track: "data", def: { en: "Iceberg feature where partition values are derived by transforms (days, hours, bucket, truncate) of real columns, so queries filter on the column and get pruning automatically.", he: "פיצ'ר של Iceberg שבו ערכי ה-partition נגזרים מ-transforms (days, hours, bucket, truncate) של עמודות אמיתיות, כך ששאילתות מסננות לפי העמודה ומקבלות pruning אוטומטית." }, lesson: "data-lakehouse-formats" },
  { term: "Time travel", track: "data", def: { en: "Querying a table as it was at an earlier snapshot or timestamp (Iceberg, Delta, Snowflake), possible until old snapshots are expired.", he: "תשאול טבלה כפי שהייתה ב-snapshot או ב-timestamp קודם (Iceberg, Delta, Snowflake), אפשרי עד שעושים expire ל-snapshots הישנים." }, lesson: "data-lakehouse-formats" },
  { term: "REST catalog", track: "data", def: { en: "The open Iceberg REST catalog API that lets any engine discover tables and commit atomically against any catalog implementation (Polaris, Glue, S3 Tables, Nessie).", he: "ה-API הפתוח של Iceberg REST catalog שמאפשר לכל מנוע לגלות טבלאות ולעשות commit אטומי מול כל מימוש של catalog (Polaris, Glue, S3 Tables, Nessie)." }, lesson: "data-lakehouse-formats" },
  { term: "Schema Registry", track: "data", def: { en: "A service storing versioned schemas per subject (e.g. orders-value) and enforcing compatibility; messages carry a 4-byte schema ID instead of the schema.", he: "שירות ששומר סכמות עם גרסאות לכל subject (למשל orders-value) ואוכף compatibility; ההודעות נושאות schema ID של 4 bytes במקום את הסכמה." }, lesson: "data-contracts-schema-registry" },
  { term: "Backward compatibility (schemas)", track: "data", def: { en: "A new schema version can read data written with the previous one (add fields with defaults, delete fields); deploy consumers before producers.", he: "גרסת סכמה חדשה יכולה לקרוא נתונים שנכתבו עם הקודמת (להוסיף שדות עם defaults, למחוק שדות); עושים deploy לצרכנים לפני ה-producers." }, lesson: "data-contracts-schema-registry" },
  { term: "Data contract", track: "data", def: { en: "A versioned, machine-readable agreement between a data producer and its consumers: schema plus owner, semantics, quality rules and SLAs, enforced in CI.", he: "הסכם עם גרסאות שמכונה יכולה לקרוא, בין producer של נתונים לצרכנים שלו: סכמה ועוד בעלים, סמנטיקה, כללי איכות ו-SLAs, שנאכף ב-CI." }, lesson: "data-contracts-schema-registry" },
  { term: "Data freshness", track: "data", def: { en: "How recent the newest data in a table is (now − max(loaded_at)); the single most valuable data-quality alert.", he: "כמה עדכניים הנתונים הכי חדשים בטבלה (now − max(loaded_at)); ה-alert הבודד הכי שימושי באיכות נתונים." }, lesson: "data-quality-observability" },
  { term: "OpenLineage", track: "data", def: { en: "Open standard for job-run events (START/COMPLETE/FAIL with inputs and outputs) emitted by Airflow, Spark, Flink and dbt to build lineage graphs.", he: "סטנדרט פתוח ל-events של ריצות jobs (START/COMPLETE/FAIL עם inputs ו-outputs) שנשלחים מ-Airflow, Spark, Flink ו-dbt כדי לבנות גרפי lineage." }, lesson: "data-quality-observability" },
  { term: "Write-Audit-Publish (WAP)", track: "data", def: { en: "Pattern of writing new data to a branch or staging table, running quality checks, and only then publishing it atomically to consumers (e.g. Iceberg branches).", he: "דפוס שבו כותבים נתונים חדשים ל-branch או לטבלת staging, מריצים בדיקות איכות, ורק אז מפרסמים אותם באופן אטומי לצרכנים (למשל branches של Iceberg)." }, lesson: "data-quality-observability" }
);

// ---------- Scenario ----------
INFRA.scenarios.push({
  id: "replication-slot-disk-full",
  icon: "💽",
  title: { en: "The Debezium slot that ate the primary", he: "ה-slot של Debezium שאכל את ה-primary" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "03:40. PagerDuty: orders-db primary disk at 91% and climbing ~4%/hour. Write latency is normal for now. Nothing was deployed tonight. The data team decommissioned the old 'orders-cdc' Kafka Connect cluster last week.",
        he: "03:40. PagerDuty: הדיסק של ה-primary של orders-db ב-91% ועולה בכ-4% בשעה. ה-latency של כתיבות כרגע תקין. לא היה deploy הלילה. צוות הדאטה פירק בשבוע שעבר את קלאסטר ה-Kafka Connect הישן בשם 'orders-cdc'."
      },
      data: "$ df -h /var/lib/postgresql\nFilesystem      Size  Used Avail Use%\n/dev/nvme1n1    1.0T  912G   88G  91%\n\n$ du -sh /var/lib/postgresql/16/main/{base,pg_wal}\n402G  base\n498G  pg_wal",
      choices: [
        { label: { en: "pg_wal is bigger than the data. Check replication slots", he: "ה-pg_wal גדול מהנתונים. בדוק replication slots" }, next: "s2", score: 10,
          feedback: { en: "Right instinct: huge pg_wal almost always means something is preventing WAL recycling — a slot, failing archiving, or a huge max_wal_size.", he: "אינסטינקט נכון: pg_wal ענק כמעט תמיד אומר שמשהו מונע מיחזור של WAL — slot, archiving שנכשל, או max_wal_size ענק." } },
        { label: { en: "Delete old files in pg_wal to free space quickly", he: "למחוק קבצים ישנים ב-pg_wal כדי לפנות מקום מהר" }, next: "lose", score: -20,
          feedback: { en: "Never delete WAL by hand. Postgres may still need those segments for crash recovery; you can corrupt the cluster.", he: "אף פעם לא מוחקים WAL ידנית. Postgres אולי עדיין צריך את ה-segments האלה ל-crash recovery; אתה יכול להשחית את הקלאסטר." } },
        { label: { en: "Run VACUUM FULL on the biggest tables", he: "להריץ VACUUM FULL על הטבלאות הכי גדולות" }, next: "s2", score: -5,
          feedback: { en: "VACUUM FULL rewrites tables, needs extra space and writes even more WAL. Wrong direction; you lost 20 minutes.", he: "VACUUM FULL משכתב טבלאות, צריך מקום נוסף וכותב עוד יותר WAL. כיוון לא נכון; הפסדת 20 דקות." } }
      ]
    },
    s2: {
      text: {
        en: "You query pg_replication_slots.",
        he: "אתה מתשאל את pg_replication_slots."
      },
      data: "    slot_name     |  plugin  | slot_type | active | retained_wal | wal_status\n------------------+----------+-----------+--------+--------------+-----------\n debezium_orders  | pgoutput | logical   | f      | 471 GB       | extended\n debezium_billing | pgoutput | logical   | t      | 64 MB        | reserved\n replica_az_b     |          | physical  | t      | 16 MB        | reserved\n\n$ psql -c 'SHOW max_slot_wal_keep_size'\n -1",
      choices: [
        { label: { en: "Confirm debezium_orders has no living consumer before touching it", he: "לוודא של-debezium_orders אין צרכן חי לפני שנוגעים בו" }, next: "s3", score: 10,
          feedback: { en: "Good: dropping a slot that someone still uses forces a full re-snapshot for them. Thirty seconds of checking is cheap.", he: "טוב: מחיקה של slot שמישהו עדיין משתמש בו מכריחה אותו ל-snapshot מלא מחדש. 30 שניות של בדיקה זה זול." } },
        { label: { en: "Drop all logical slots to be safe", he: "למחוק את כל ה-logical slots ליתר ביטחון" }, next: "s3", score: -10,
          feedback: { en: "You also killed debezium_billing, which was healthy. Billing CDC now needs a full re-snapshot of a 300 GB database tomorrow.", he: "הרגת גם את debezium_billing, שהיה בריא. ה-CDC של billing צריך עכשיו snapshot מלא מחדש לדאטהבייס של 300 GB מחר." } }
      ]
    },
    s3: {
      text: {
        en: "The connectors API on the new Connect cluster shows only 'billing-pg'. The data team's migration doc says orders CDC was moved to an outbox-based connector with a new slot, 'dbz_orders_outbox' — which doesn't exist on this server. Disk is now 93%.",
        he: "ה-API של ה-connectors בקלאסטר ה-Connect החדש מראה רק את 'billing-pg'. מסמך המיגרציה של צוות הדאטה אומר שה-CDC של orders עבר ל-connector מבוסס outbox עם slot חדש בשם 'dbz_orders_outbox' — שלא קיים על השרת הזה. הדיסק עכשיו ב-93%."
      },
      data: "$ curl -s http://connect-v2:8083/connectors\n[\"billing-pg\"]\n\n$ curl -s http://connect-v2:8083/connectors/billing-pg/status | jq -r .connector.state\nRUNNING",
      choices: [
        { label: { en: "Page the data team's on-call, and meanwhile drop the abandoned slot: SELECT pg_drop_replication_slot('debezium_orders')", he: "להעיר את ה-on-call של צוות הדאטה, ובינתיים למחוק את ה-slot הנטוש: SELECT pg_drop_replication_slot('debezium_orders')" }, next: "s4", score: 15,
          feedback: { en: "The slot is inactive and its connector no longer exists. At 4%/hour you have ~1.5 hours; dropping it is the right call, and the data team must know their orders CDC was never actually cut over.", he: "ה-slot לא פעיל וה-connector שלו כבר לא קיים. ב-4% לשעה יש לך בערך שעה וחצי; למחוק אותו זו ההחלטה הנכונה, וצוות הדאטה חייב לדעת שה-CDC של orders בעצם אף פעם לא עבר." } },
        { label: { en: "Wait until the data team wakes up at 09:00 to decide", he: "לחכות שצוות הדאטה יתעורר ב-09:00 כדי שיחליטו" }, next: "lose", score: -20,
          feedback: { en: "At 4%/hour the disk fills around 05:30. Postgres PANICs on WAL write failure and every order write fails.", he: "ב-4% לשעה הדיסק מתמלא בערך ב-05:30. Postgres נכנס ל-PANIC כשכתיבת WAL נכשלת וכל כתיבה של הזמנה נכשלת." } },
        { label: { en: "Grow the EBS volume to 2 TB and go back to sleep", he: "להגדיל את ה-EBS volume ל-2 TB ולחזור לישון" }, next: "s4", score: 0,
          feedback: { en: "Buys time (and online resize works), but the slot will fill 2 TB too, and EBS volumes can't shrink back. It's a mitigation, not a fix.", he: "קונה זמן (וה-resize אונליין עובד), אבל ה-slot ימלא גם 2 TB, ואי אפשר להקטין EBS volume בחזרה. זה mitigation, לא תיקון." } }
      ]
    },
    s4: {
      text: {
        en: "The slot is gone. Within a few minutes, the next checkpoints recycle old WAL. Disk drops to 41%. The data team on-call confirms: the new outbox connector was never deployed to production — orders CDC has been silently missing for 8 days.",
        he: "ה-slot נמחק. תוך כמה דקות, ה-checkpoints הבאים ממחזרים WAL ישן. הדיסק יורד ל-41%. ה-on-call של צוות הדאטה מאשר: ה-connector החדש של outbox אף פעם לא עלה לפרודקשן — ה-CDC של orders חסר בשקט כבר 8 ימים."
      },
      data: "$ df -h /var/lib/postgresql\n/dev/nvme1n1    1.0T  418G  606G  41%\n\nlake.db.orders: max(_ingested_at) = 2026-11-06 22:14:03",
      choices: [
        { label: { en: "Deploy the outbox connector with snapshot.mode=initial for orders and an incremental snapshot for the gap; open a data incident for 8 days of missing orders downstream", he: "לעשות deploy ל-connector של outbox עם snapshot.mode=initial ל-orders ו-incremental snapshot לפער; לפתוח אינסידנט נתונים על 8 ימים של הזמנות חסרות למטה" }, next: "s5", score: 10,
          feedback: { en: "Snapshots rebuild the missing state; the data incident makes sure downstream dashboards and models are told and backfilled.", he: "ה-snapshots בונים מחדש את ה-state החסר; אינסידנט הנתונים דואג שהדשבורדים והמודלים למטה יעודכנו ויקבלו backfill." } },
        { label: { en: "Recreate the old slot so the old connector can resume where it stopped", he: "ליצור מחדש את ה-slot הישן כדי שה-connector הישן ימשיך מאיפה שעצר" }, next: "s5", score: -5,
          feedback: { en: "A new slot starts at the current LSN; the 8 days of WAL are gone. Resuming 'where it stopped' is impossible — you still need a snapshot.", he: "slot חדש מתחיל מה-LSN הנוכחי; 8 הימים של ה-WAL נעלמו. להמשיך 'מאיפה שעצר' זה בלתי אפשרי — עדיין צריך snapshot." } }
      ]
    },
    s5: {
      text: {
        en: "CDC is flowing again. What guardrails do you put in the postmortem so this never happens silently again?",
        he: "ה-CDC זורם שוב. אילו guardrails אתה מכניס ל-postmortem כדי שזה לא יקרה שוב בשקט?"
      },
      choices: [
        { label: { en: "max_slot_wal_keep_size=100GB, alerts on inactive slots >10 min and retained WAL >20% of disk, heartbeats on connectors, freshness checks on lake.db.orders, and a decommission checklist that includes dropping slots", he: "max_slot_wal_keep_size=100GB, alerts על slots לא פעילים מעל 10 דקות ועל WAL שמור מעל 20% מהדיסק, heartbeats ב-connectors, בדיקות freshness על lake.db.orders, ו-checklist לפירוק שכולל מחיקת slots" }, next: "win", score: 15,
          feedback: { en: "Database protected by a cap, the slot watched directly, and the data watched downstream: the 8-day silent gap would have been an alert within 3 hours.", he: "הדאטהבייס מוגן בתקרה, ה-slot מנוטר ישירות, והנתונים מנוטרים למטה: הפער השקט של 8 ימים היה הופך ל-alert תוך 3 שעות." } },
        { label: { en: "Just add a disk-usage alert at 80%", he: "רק להוסיף alert על שימוש בדיסק ב-80%" }, next: "win", score: 0,
          feedback: { en: "Better than nothing, but it fires late, at night, and says nothing about the 8 days of missing data downstream.", he: "עדיף מכלום, אבל הוא יורה מאוחר, בלילה, ולא אומר כלום על 8 הימים של נתונים חסרים למטה." } }
      ]
    },
    win: {
      text: {
        en: "Primary saved with ~1 hour to spare, zero write downtime, and an 8-day silent data gap turned into a tracked incident with a backfill. The slot is now a monitored, owned piece of infrastructure.",
        he: "ה-primary ניצל עם בערך שעה רזרבה, אפס השבתה של כתיבות, ופער נתונים שקט של 8 ימים הפך לאינסידנט מנוהל עם backfill. ה-slot הוא עכשיו תשתית מנוטרת עם בעלים."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "05:31: 'PANIC: could not write to file \"pg_wal/xlogtemp.4121\": No space left on device'. The primary is down, order writes fail for 50 minutes while you resize the volume and recover. The root cause was one forgotten replication slot.",
        he: "05:31: 'PANIC: could not write to file \"pg_wal/xlogtemp.4121\": No space left on device'. ה-primary למטה, כתיבות של הזמנות נכשלות 50 דקות בזמן שאתה מגדיל את ה-volume ומשחזר. ה-root cause היה replication slot אחד שנשכח."
      },
      end: "lose"
    }
  },
  lessons: ["data-cdc-debezium", "data-quality-observability", "staff-postgres-at-scale"]
});
