// Track: observability — metrics, logs, traces, golden signals, alerting, dashboards
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

window.INFRA.lessons.push({
  id: "obs-intro",
  track: "observability",
  order: 1,
  icon: "🔭",
  level: 1,
  minutes: 8,
  title: { en: "Monitoring vs Observability", he: "Monitoring מול Observability" },
  tldr: {
    en: "Monitoring answers questions you thought of in advance; observability lets you answer questions you never imagined, using metrics, logs, traces (and profiles/events).",
    he: "Monitoring עונה על שאלות שחשבת עליהן מראש; Observability מאפשר לענות על שאלות שלא דמיינת שתצטרך לשאול – בעזרת metrics, logs, traces (ו-profiles/events)."
  },
  analogy: {
    en: "Monitoring is your car's dashboard: a fuel gauge and a check-engine light for problems the engineers predicted. Observability is the mechanic plugging a diagnostic computer into the OBD port and asking 'why does it shudder only at 80 km/h going uphill when it rains?'. A doctor works the same way: vital signs (metrics) say something is wrong, the patient's story (logs) gives context, and the MRI (traces) shows exactly where it hurts.",
    he: "Monitoring זה לוח השעונים של האוטו: מד דלק ונורת check-engine – לבעיות שהמהנדסים צפו מראש. Observability זה המכונאי שמחבר מחשב דיאגנוסטיקה לשקע ה-OBD ושואל 'למה הוא רועד רק ב-80 קמ\"ש בעלייה כשיורד גשם?'. רופא עובד בדיוק ככה: מדדים חיוניים (metrics) אומרים שמשהו לא בסדר, הסיפור של המטופל (logs) נותן הקשר, וה-MRI (traces) מראה בדיוק איפה כואב."
  },
  sections: [
    {
      h: { en: "Known unknowns vs unknown unknowns", he: "Known unknowns מול unknown unknowns" },
      body: {
        en: `<p><strong>Monitoring</strong> is checking predefined health signals: "is CPU above 90%?", "is the error rate above 1%?", "is the disk 85% full?". It works great for <em>known unknowns</em> — failure modes you already know can happen, you just don't know <em>when</em>.</p>
<p><strong>Observability</strong> is a property of the system: how well you can understand its internal state from the outside, <em>without shipping new code</em>. It targets <em>unknown unknowns</em>: "checkout is slow only for iOS users in Germany who have more than 20 items in the cart." No one wrote an alert for that. You find it by slicing high-cardinality telemetry (user, region, version, endpoint) interactively.</p>
<p>The two are not rivals. Monitoring tells you <strong>that</strong> something is broken; observability helps you find <strong>why</strong>. In a microservices world, where one request touches 15 services, the "why" is where you spend 90% of incident time.</p>
<blockquote>💡 Real world: a quick test for observability — during an incident, can you answer a brand-new question in under 5 minutes without deploying a debug log line? If the answer is "let's add a log and redeploy", you have monitoring, not observability.</blockquote>`,
        he: `<p><strong>Monitoring</strong> זה בדיקה של סימני בריאות מוגדרים מראש: "ה-CPU מעל 90%?", "ה-error rate מעל 1%?", "הדיסק מלא ב-85%?". זה עובד מצוין ל-<em>known unknowns</em> – תקלות שאתה יודע שיכולות לקרות, רק לא יודע <em>מתי</em>.</p>
<p><strong>Observability</strong> זו תכונה של המערכת: עד כמה אפשר להבין את המצב הפנימי שלה מבחוץ, <em>בלי לשחרר קוד חדש</em>. המטרה היא <em>unknown unknowns</em>: "ה-checkout איטי רק למשתמשי iOS בגרמניה שיש להם יותר מ-20 פריטים בעגלה". אף אחד לא כתב alert על זה. מוצאים את זה כשחותכים telemetry עם high cardinality (משתמש, אזור, גרסה, endpoint) בצורה אינטראקטיבית.</p>
<p>הם לא מתחרים. Monitoring אומר לך <strong>ש</strong>משהו שבור; observability עוזר לך להבין <strong>למה</strong>. בעולם של microservices, שבו request אחד עובר ב-15 שירותים, ה"למה" זה איפה שהולכים 90% מזמן התקלה.</p>
<blockquote>💡 מהשטח: מבחן מהיר ל-observability – באמצע תקלה, אתה מצליח לענות על שאלה חדשה לגמרי בפחות מ-5 דקות, בלי לעשות deploy לשורת לוג? אם התשובה היא "בוא נוסיף לוג ונעלה גרסה", יש לך monitoring, לא observability.</blockquote>`
      }
    },
    {
      h: { en: "The three pillars (plus two)", he: "שלושת העמודים (ועוד שניים)" },
      body: {
        en: `<ul>
<li><strong>Metrics</strong> — numbers over time, cheap and aggregated: <code>http_requests_total{code="500"}</code>. Great for alerting and trends. Bad at "which user?".</li>
<li><strong>Logs</strong> — timestamped events with rich detail: <code>{"level":"error","msg":"payment declined","order":"A-981"}</code>. Great for context. Expensive at scale.</li>
<li><strong>Traces</strong> — the path of one request across services, broken into timed spans. Great for "where did the 2 seconds go?".</li>
<li><strong>Profiles</strong> (the "4th pillar") — continuous CPU/memory profiling (Pyroscope, Parca, Datadog Profiler) showing <em>which function</em> burns the CPU. Flame graphs in production.</li>
<li><strong>Events</strong> — discrete changes: deploys, config flips, feature flags, autoscaling. Overlaying "deploy v2.3.1" on a latency graph solves a shocking share of incidents.</li>
</ul>
<p>The magic is in <strong>linking</strong> them: a metric spike → exemplar → trace → the logs with the same <code>trace_id</code>. Three disconnected tools are three haystacks; linked, they are a map.</p>
<blockquote>⚠️ Production tip: always annotate deploys on your dashboards. "What changed?" is the #1 incident question, and the answer is usually "we deployed 12 minutes ago".</blockquote>`,
        he: `<ul>
<li><strong>Metrics</strong> – מספרים לאורך זמן, זולים ומאוגרגים: <code>http_requests_total{code="500"}</code>. מעולים ל-alerting ולמגמות. גרועים בשאלה "איזה משתמש?".</li>
<li><strong>Logs</strong> – אירועים עם timestamp והרבה פרטים: <code>{"level":"error","msg":"payment declined","order":"A-981"}</code>. מעולים להקשר. יקרים בסקייל.</li>
<li><strong>Traces</strong> – המסלול של request בודד בין שירותים, מחולק ל-spans עם זמנים. מעולים לשאלה "לאן הלכו ה-2 שניות?".</li>
<li><strong>Profiles</strong> (ה"עמוד הרביעי") – continuous profiling של CPU/זיכרון (Pyroscope, Parca, Datadog Profiler) שמראה <em>איזו פונקציה</em> שורפת CPU. Flame graphs בפרודקשן.</li>
<li><strong>Events</strong> – שינויים בדידים: deploys, שינויי קונפיג, feature flags, autoscaling. לשים "deploy v2.3.1" על גרף ה-latency פותר כמות מביכה של תקלות.</li>
</ul>
<p>הקסם הוא ב<strong>חיבור</strong> ביניהם: קפיצה ב-metric ← exemplar ← trace ← הלוגים עם אותו <code>trace_id</code>. שלושה כלים מנותקים זה שלוש ערימות שחת; מחוברים – זו מפה.</p>
<blockquote>⚠️ טיפ לפרודקשן: תמיד תסמנו deploys על הדשבורדים (annotations). "מה השתנה?" זו השאלה מספר 1 בתקלה, והתשובה בדרך כלל "עשינו deploy לפני 12 דקות".</blockquote>`
      }
    },
    {
      h: { en: "The toolchain landscape", he: "מפת הכלים" },
      body: {
        en: `<table>
<tr><th>Signal</th><th>Open source</th><th>SaaS / cloud-native</th></tr>
<tr><td>Metrics</td><td>Prometheus (+ Thanos/Mimir/VictoriaMetrics for long-term)</td><td>Datadog, New Relic, CloudWatch Metrics, Azure Monitor Metrics</td></tr>
<tr><td>Logs</td><td>Loki, ELK (Elasticsearch + Logstash + Kibana), OpenSearch</td><td>Datadog Logs, CloudWatch Logs, Azure Log Analytics (KQL), Splunk</td></tr>
<tr><td>Traces</td><td>Jaeger, Grafana Tempo, Zipkin</td><td>Datadog APM, New Relic, AWS X-Ray, Application Insights</td></tr>
<tr><td>Visualization</td><td>Grafana</td><td>Built into each vendor</td></tr>
<tr><td>Instrumentation</td><td colspan="2">OpenTelemetry — vendor-neutral SDKs + Collector, exports to all of the above</td></tr>
</table>
<p>The classic open-source combo is the "LGTM" stack: <strong>L</strong>oki, <strong>G</strong>rafana, <strong>T</strong>empo, <strong>M</strong>imir. SaaS (Datadog, New Relic) trades money for zero ops and great correlation out of the box. Cloud-native tools (CloudWatch, Azure Monitor) are "free to start" and already wired to your managed services, but get pricey and clunky for cross-cloud views.</p>
<blockquote>💡 Real world: instrument with OpenTelemetry regardless of backend. Switching from Datadog to Grafana Cloud then becomes a Collector config change instead of a 6-month re-instrumentation project.</blockquote>`,
        he: `<table>
<tr><th>סיגנל</th><th>Open source</th><th>SaaS / cloud-native</th></tr>
<tr><td>Metrics</td><td>Prometheus (+ Thanos/Mimir/VictoriaMetrics לשמירה ארוכה)</td><td>Datadog, New Relic, CloudWatch Metrics, Azure Monitor Metrics</td></tr>
<tr><td>Logs</td><td>Loki, ELK (Elasticsearch + Logstash + Kibana), OpenSearch</td><td>Datadog Logs, CloudWatch Logs, Azure Log Analytics (KQL), Splunk</td></tr>
<tr><td>Traces</td><td>Jaeger, Grafana Tempo, Zipkin</td><td>Datadog APM, New Relic, AWS X-Ray, Application Insights</td></tr>
<tr><td>ויזואליזציה</td><td>Grafana</td><td>מובנה אצל כל ספק</td></tr>
<tr><td>Instrumentation</td><td colspan="2">OpenTelemetry – SDKs ו-Collector ניטרליים, מייצאים לכל מה שלמעלה</td></tr>
</table>
<p>הקומבו הקלאסי בקוד פתוח נקרא "LGTM": <strong>L</strong>oki, <strong>G</strong>rafana, <strong>T</strong>empo, <strong>M</strong>imir. SaaS (Datadog, New Relic) מחליף כסף באפס תפעול ו-correlation מעולה מהקופסה. הכלים של הענן (CloudWatch, Azure Monitor) "חינמיים להתחלה" וכבר מחוברים לשירותים המנוהלים שלך, אבל נהיים יקרים ומסורבלים כשצריך תמונה חוצת-עננים.</p>
<blockquote>💡 מהשטח: תעשו instrumentation עם OpenTelemetry לא משנה מה ה-backend. ככה מעבר מ-Datadog ל-Grafana Cloud הוא שינוי קונפיג ב-Collector ולא פרויקט re-instrumentation של חצי שנה.</blockquote>`
      }
    },
    {
      h: { en: "How the pillars work together in an incident", he: "איך העמודים עובדים ביחד בתקלה" },
      body: {
        en: `<p>A typical 3 AM flow:</p>
<ol>
<li><strong>Alert (metrics)</strong>: "checkout SLO burning 14x". You know <em>something</em> is wrong and how bad.</li>
<li><strong>Dashboard (metrics)</strong>: p99 latency jumped from 300ms to 4s at 02:47, only on <code>POST /checkout</code>, only pods running v2.3.1. Deploy annotation at 02:45. Suspicious.</li>
<li><strong>Trace</strong>: click an exemplar on the latency graph. The waterfall shows 3.8s spent in a span <code>SELECT * FROM coupons WHERE ...</code>.</li>
<li><strong>Logs</strong>: filter by that <code>trace_id</code>: <code>"slow query: 3812ms, rows_examined=4.1M"</code>. The new version dropped an index hint.</li>
<li><strong>Profile</strong> (optional): confirms CPU on the DB is in a full table scan.</li>
</ol>
<p>Metrics narrow down <em>when and where</em>, traces narrow down <em>which hop</em>, logs explain <em>what exactly happened</em>. Each step reduces the search space by 10-100x.</p>
<blockquote>💡 Real world: teams with linked telemetry routinely cut MTTR (mean time to recovery) from hours to minutes. The tooling cost is usually smaller than one bad outage.</blockquote>`,
        he: `<p>תהליך טיפוסי ב-3 לפנות בוקר:</p>
<ol>
<li><strong>Alert (metrics)</strong>: "ה-SLO של checkout נשרף פי 14". אתה יודע ש<em>משהו</em> שבור וכמה זה חמור.</li>
<li><strong>דשבורד (metrics)</strong>: ה-p99 latency קפץ מ-300ms ל-4s ב-02:47, רק על <code>POST /checkout</code>, רק בפודים שמריצים v2.3.1. יש annotation של deploy ב-02:45. חשוד.</li>
<li><strong>Trace</strong>: לוחצים על exemplar בגרף ה-latency. ה-waterfall מראה 3.8s בתוך span של <code>SELECT * FROM coupons WHERE ...</code>.</li>
<li><strong>Logs</strong>: מסננים לפי ה-<code>trace_id</code>: <code>"slow query: 3812ms, rows_examined=4.1M"</code>. הגרסה החדשה איבדה index hint.</li>
<li><strong>Profile</strong> (אופציונלי): מאשר שה-CPU של ה-DB עסוק ב-full table scan.</li>
</ol>
<p>Metrics מצמצמים <em>מתי ואיפה</em>, traces מצמצמים <em>באיזה hop</em>, logs מסבירים <em>מה בדיוק קרה</em>. כל שלב מקטין את מרחב החיפוש פי 10-100.</p>
<blockquote>💡 מהשטח: צוותים עם telemetry מקושר מורידים MTTR (זמן ממוצע להתאוששות) משעות לדקות. עלות הכלים בדרך כלל קטנה יותר מתקלה רצינית אחת.</blockquote>`
      }
    }
  ],
  diagram: `  ALERT (metrics) -> DASHBOARD (when/where) -> TRACE (which hop) -> LOGS (what exactly)
       |                     |                         |                    |
   "it's broken"      "p99 up on /checkout"     "3.8s in coupons DB"  "rows_examined=4.1M"`,
  handsOn: [
    { cmd: "docker run -d --name prom -p 9090:9090 prom/prometheus", what: { en: "Start Prometheus; open http://localhost:9090 and query 'up' — it scrapes itself out of the box.", he: "מרימים Prometheus; פותחים http://localhost:9090 ומריצים את השאילתה 'up' – הוא עושה scrape לעצמו כבר מהקופסה." } },
    { cmd: "curl -s localhost:9090/metrics | head -40", what: { en: "See the raw text exposition format: HELP/TYPE lines and samples with labels. This is all a 'metric' really is.", he: "רואים את פורמט הטקסט הגולמי: שורות HELP/TYPE ודגימות עם labels. זה כל מה ש-metric באמת הוא." } },
    { cmd: "docker run -d --name grafana -p 3000:3000 grafana/grafana", what: { en: "Start Grafana (admin/admin), add Prometheus as a data source (http://host.docker.internal:9090) and build your first graph.", he: "מרימים Grafana (admin/admin), מוסיפים את Prometheus כ-data source (http://host.docker.internal:9090) ובונים את הגרף הראשון." } }
  ],
  mnemonic: {
    en: "\"Monitoring says THAT, observability says WHY.\" And the pillars, MLT-PE: Metrics alert, Logs explain, Traces locate, Profiles pinpoint, Events reveal what changed.",
    he: "\"Monitoring אומר ש-, Observability אומר למה.\" והעמודים, MLT-PE: Metrics מתריעים, Logs מסבירים, Traces ממקמים, Profiles מצביעים על הפונקציה, Events חושפים מה השתנה."
  },
  pitfalls: [
    { en: "Buying three tools that don't share IDs. If logs don't carry trace_id and metrics don't have exemplars, you're doing manual timestamp-matching across browser tabs at 3 AM.", he: "לקנות שלושה כלים שלא חולקים מזהים. אם בלוגים אין trace_id ול-metrics אין exemplars, אתה עושה התאמת timestamps ידנית בין טאבים ב-3 בלילה." },
    { en: "Thinking 'we have 400 dashboards, so we're observable'. Dashboards only answer the questions someone asked when building them.", he: "לחשוב 'יש לנו 400 דשבורדים אז יש לנו observability'. דשבורד עונה רק על השאלות שמישהו שאל כשהוא בנה אותו." },
    { en: "Logging everything 'just in case' instead of instrumenting properly — the log bill becomes larger than the compute bill.", he: "ללוגג הכל 'ליתר ביטחון' במקום לעשות instrumentation נכון – חשבון הלוגים נהיה גדול מחשבון ה-compute." }
  ],
  interview: [
    {
      q: { en: "What's the difference between monitoring and observability?", he: "מה ההבדל בין monitoring ל-observability?" },
      a: { en: "Monitoring is watching predefined signals for known failure modes (known unknowns) and alerting on them. Observability is the ability to ask arbitrary new questions about system state from its telemetry without changing code — essential for unknown unknowns in distributed systems. Monitoring is something you do; observability is a property the system has, achieved through rich, correlated, high-cardinality metrics, logs and traces.", he: "Monitoring זה מעקב אחרי סיגנלים מוגדרים מראש לתקלות מוכרות (known unknowns) והתרעה עליהן. Observability זו היכולת לשאול שאלות חדשות ושרירותיות על מצב המערכת מתוך ה-telemetry שלה בלי לשנות קוד – קריטי ל-unknown unknowns במערכות מבוזרות. Monitoring זה משהו שעושים; observability זו תכונה של המערכת, שמשיגים עם metrics, logs ו-traces עשירים, מקושרים ועם high cardinality." }
    },
    {
      q: { en: "When would you use a metric vs a log vs a trace?", he: "מתי תשתמש ב-metric, מתי בלוג ומתי ב-trace?" },
      a: { en: "Metrics for cheap aggregate trends and alerting (error rate, p99). Logs for detailed context of individual events (the exception, the payload ID). Traces to see latency breakdown and causality across services for a single request. In practice: metric fires the alert, trace locates the slow hop, log explains the failure.", he: "Metrics למגמות מאוגרגות זולות ול-alerting (error rate, p99). Logs להקשר מפורט של אירוע בודד (ה-exception, מזהה ה-payload). Traces כדי לראות פירוק latency וסיבתיות בין שירותים עבור request בודד. בפועל: ה-metric מקפיץ את ה-alert, ה-trace ממקם את ה-hop האיטי, הלוג מסביר את הכשל." }
    }
  ],
  quiz: [
    {
      q: { en: "Checkout is slow only for one customer segment nobody predicted. Which capability do you need most?", he: "ה-checkout איטי רק לסגמנט לקוחות אחד שאף אחד לא צפה. איזו יכולת הכי חסרה לך?" },
      options: [
        { en: "A new static threshold alert on average latency", he: "alert חדש עם סף קבוע על latency ממוצע" },
        { en: "Observability: slicing high-cardinality telemetry by arbitrary dimensions", he: "Observability: חיתוך telemetry עם high cardinality לפי מימדים שרירותיים" },
        { en: "A bigger CPU dashboard", he: "דשבורד CPU גדול יותר" },
        { en: "Higher log retention", he: "retention ארוך יותר ללוגים" }
      ],
      answer: 1,
      explain: { en: "It's an unknown unknown — no predefined alert covers it. You need to explore by user/region/version dimensions interactively.", he: "זה unknown unknown – אף alert מוגדר מראש לא מכסה את זה. צריך לחקור אינטראקטיבית לפי מימדים כמו משתמש/אזור/גרסה." }
    },
    {
      q: { en: "Which signal is best for answering 'which of 12 services added the 2 seconds?'", he: "איזה סיגנל הכי מתאים לשאלה 'איזה מ-12 השירותים הוסיף את ה-2 שניות?'" },
      options: [
        { en: "Metrics", he: "Metrics" },
        { en: "Logs", he: "Logs" },
        { en: "Traces", he: "Traces" },
        { en: "Events", he: "Events" }
      ],
      answer: 2,
      explain: { en: "A trace shows the timed span tree of one request across all services, so the slow hop is visible at a glance in the waterfall.", he: "Trace מראה את עץ ה-spans עם הזמנים של request אחד בכל השירותים, אז ה-hop האיטי קופץ לעין ב-waterfall." }
    },
    {
      q: { en: "What makes three observability tools far more useful together?", he: "מה הופך שלושה כלי observability להרבה יותר שימושיים ביחד?" },
      options: [
        { en: "Running them all on the same Kubernetes cluster", he: "להריץ את כולם על אותו cluster של Kubernetes" },
        { en: "Using the same color theme on every dashboard", he: "להשתמש באותה ערכת צבעים בכל הדשבורדים" },
        { en: "Buying them all from one vendor", he: "לקנות את כולם מאותו ספק" },
        { en: "Shared correlation IDs (trace_id in logs, exemplars on metrics)", he: "מזהי correlation משותפים (trace_id בלוגים, exemplars על metrics)" }
      ],
      answer: 3,
      explain: { en: "Correlation is what lets you jump from a metric spike to the exact trace and its logs. One vendor helps, but it's the shared IDs that do the work.", he: "Correlation זה מה שמאפשר לקפוץ מקפיצה ב-metric ל-trace המדויק וללוגים שלו. ספק אחד עוזר, אבל המזהים המשותפים הם שעושים את העבודה." }
    }
  ],
  related: ["obs-metrics", "obs-logs", "obs-traces", "obs-golden-signals"]
});

window.INFRA.lessons.push({
  id: "obs-metrics",
  track: "observability",
  order: 2,
  icon: "📈",
  level: 2,
  minutes: 12,
  title: { en: "Metrics, PromQL & Why Averages Lie", he: "Metrics, PromQL ולמה ממוצע משקר" },
  tldr: {
    en: "A metric is a named time series identified by labels; use counters + rate() for throughput, histograms for latency percentiles, and guard label cardinality with your life.",
    he: "Metric זו סדרת זמן עם שם שמזוהה לפי labels; משתמשים ב-counters עם rate() ל-throughput, ב-histograms לאחוזוני latency, ושומרים על ה-cardinality של ה-labels כמו על הנשמה."
  },
  analogy: {
    en: "A counter is your car's odometer: it only goes up, and the interesting number is how fast it's climbing (speed = rate). A gauge is the fuel needle: up and down, the current value matters. A histogram is a speed camera that sorts every passing car into buckets (<50, <90, <120 km/h) so you can say '99% of cars drove under 110'. Labels are the license plate details that let you split by make, color and city — and if you label by the driver's ID number, the camera's hard disk explodes.",
    he: "Counter זה מד הקילומטרים של האוטו: רק עולה, והמספר המעניין זה כמה מהר הוא מטפס (מהירות = rate). Gauge זה מחוג הדלק: עולה ויורד, מה שחשוב זה הערך הנוכחי. Histogram זו מצלמת מהירות שממיינת כל רכב לדליים (מתחת ל-50, ל-90, ל-120 קמ\"ש) כדי שתוכל להגיד '99% מהרכבים נסעו מתחת ל-110'. Labels הם הפרטים בלוחית הרישוי שמאפשרים לפצל לפי יצרן, צבע ועיר – ואם תעשה label לפי תעודת הזהות של הנהג, הדיסק של המצלמה מתפוצץ."
  },
  sections: [
    {
      h: { en: "Time series & labels", he: "סדרות זמן ו-labels" },
      body: {
        en: `<p>A metric sample is just <code>(name, labels, timestamp, value)</code>. Every unique combination of name + label values is its own <strong>time series</strong>:</p>
<pre>http_requests_total{service="checkout", method="POST", code="200"}  184223
http_requests_total{service="checkout", method="POST", code="500"}     312
http_requests_total{service="cart",     method="GET",  code="200"}  992011</pre>
<p>That's three series. Labels are what make metrics queryable: you can sum across all codes, filter by service, or group by method. Prometheus stores each series as a compressed stream of (timestamp, float64) pairs — roughly 1-2 bytes per sample on disk thanks to Gorilla-style delta encoding.</p>
<p>Naming conventions matter: <code>&lt;namespace&gt;_&lt;what&gt;_&lt;unit&gt;</code>, base units (seconds, bytes), and <code>_total</code> suffix for counters. So <code>http_request_duration_seconds</code>, not <code>RequestLatencyMs</code>.</p>
<blockquote>💡 Real world: a metric is the cheapest signal you have. A counter incremented a billion times a day still costs the same as one incremented once — it's one series, sampled every 15s.</blockquote>`,
        he: `<p>דגימת metric היא בסך הכל <code>(name, labels, timestamp, value)</code>. כל צירוף ייחודי של שם + ערכי labels הוא <strong>time series</strong> נפרד:</p>
<pre>http_requests_total{service="checkout", method="POST", code="200"}  184223
http_requests_total{service="checkout", method="POST", code="500"}     312
http_requests_total{service="cart",     method="GET",  code="200"}  992011</pre>
<p>אלה שלוש סדרות. ה-labels הם מה שהופך metrics לניתנים לשאילתה: אפשר לסכום על כל הקודים, לסנן לפי service או לקבץ לפי method. Prometheus שומר כל סדרה כזרם דחוס של זוגות (timestamp, float64) – בערך 1-2 בייט לדגימה על הדיסק בזכות delta encoding בסגנון Gorilla.</p>
<p>קונבנציות שמות חשובות: <code>&lt;namespace&gt;_&lt;what&gt;_&lt;unit&gt;</code>, יחידות בסיס (שניות, בייטים), וסיומת <code>_total</code> ל-counters. כלומר <code>http_request_duration_seconds</code>, לא <code>RequestLatencyMs</code>.</p>
<blockquote>💡 מהשטח: metric הוא הסיגנל הכי זול שיש לך. Counter שמקודם מיליארד פעם ביום עולה בדיוק כמו counter שמקודם פעם אחת – זו סדרה אחת, שנדגמת כל 15 שניות.</blockquote>`
      }
    },
    {
      h: { en: "Counter, gauge, histogram, summary", he: "Counter, gauge, histogram, summary" },
      body: {
        en: `<table>
<tr><th>Type</th><th>Behaviour</th><th>Examples</th><th>Query with</th></tr>
<tr><td>Counter</td><td>Only goes up (resets to 0 on restart)</td><td>requests, errors, bytes sent</td><td><code>rate()</code>, <code>increase()</code></td></tr>
<tr><td>Gauge</td><td>Goes up and down</td><td>memory in use, queue depth, temperature</td><td>raw value, <code>avg_over_time()</code></td></tr>
<tr><td>Histogram</td><td>Counts observations into cumulative buckets (<code>le</code> = less-or-equal)</td><td>request latency, response size</td><td><code>histogram_quantile()</code></td></tr>
<tr><td>Summary</td><td>Client computes quantiles itself</td><td>latency in legacy libs</td><td>read <code>{quantile="0.99"}</code></td></tr>
</table>
<p>A histogram exposes <code>_bucket{le="0.1"}</code>, <code>_bucket{le="0.5"}</code>, ..., <code>_sum</code> and <code>_count</code>. Because buckets are plain counters, you can <strong>sum them across 50 pods</strong> and compute a fleet-wide p99. A summary's quantiles can't be aggregated — averaging ten pods' p99 values is mathematically meaningless.</p>
<blockquote>⚠️ Production tip: prefer histograms over summaries. Pick buckets around your SLO (e.g. if SLO is 300ms, have buckets at 0.1, 0.25, 0.3, 0.5, 1) — percentiles are interpolated inside buckets, so precision lives where the buckets are. Prometheus native histograms remove most of this pain.</blockquote>`,
        he: `<table>
<tr><th>סוג</th><th>התנהגות</th><th>דוגמאות</th><th>שואלים עם</th></tr>
<tr><td>Counter</td><td>רק עולה (מתאפס ל-0 בריסטארט)</td><td>requests, errors, bytes sent</td><td><code>rate()</code>, <code>increase()</code></td></tr>
<tr><td>Gauge</td><td>עולה ויורד</td><td>זיכרון בשימוש, עומק תור, טמפרטורה</td><td>ערך גולמי, <code>avg_over_time()</code></td></tr>
<tr><td>Histogram</td><td>סופר תצפיות לדליים מצטברים (<code>le</code> = קטן-או-שווה)</td><td>latency של requests, גודל response</td><td><code>histogram_quantile()</code></td></tr>
<tr><td>Summary</td><td>הקליינט מחשב quantiles בעצמו</td><td>latency בספריות ישנות</td><td>קוראים <code>{quantile="0.99"}</code></td></tr>
</table>
<p>Histogram חושף <code>_bucket{le="0.1"}</code>, <code>_bucket{le="0.5"}</code>, ..., <code>_sum</code> ו-<code>_count</code>. בגלל שהדליים הם counters רגילים, אפשר <strong>לסכום אותם על 50 פודים</strong> ולחשב p99 של כל הצי. את ה-quantiles של summary אי אפשר לאגרג – ממוצע של ה-p99 של עשרה פודים הוא חסר משמעות מתמטית.</p>
<blockquote>⚠️ טיפ לפרודקשן: תעדיפו histograms על summaries. תבחרו buckets סביב ה-SLO (למשל אם ה-SLO הוא 300ms, שיהיו buckets ב-0.1, 0.25, 0.3, 0.5, 1) – האחוזונים מחושבים באינטרפולציה בתוך הדליים, אז הדיוק נמצא איפה שהדליים נמצאים. Native histograms של Prometheus פותרים את רוב הכאב הזה.</blockquote>`
      }
    },
    {
      h: { en: "rate() and PromQL you'll actually use", he: "rate() ו-PromQL שבאמת תשתמש בו" },
      body: {
        en: `<p>A raw counter (<code>184223</code>) is useless — it depends on when the process started. What you want is <strong>per-second rate</strong> over a window. <code>rate()</code> also handles counter resets when pods restart.</p>
<pre># Requests per second, per service (5-minute window)
sum by (service) (rate(http_requests_total[5m]))

# Error ratio (0.0 - 1.0) for checkout
sum(rate(http_requests_total{service="checkout", code=~"5.."}[5m]))
  /
sum(rate(http_requests_total{service="checkout"}[5m]))

# p99 latency across all pods
histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket{service="checkout"}[5m])))

# Total requests in the last 24h
sum(increase(http_requests_total[24h]))

# Pods using more than 90% of their memory limit
container_memory_working_set_bytes / on(pod, container)
  kube_pod_container_resource_limits{resource="memory"} &gt; 0.9</pre>
<p>Golden rule: <strong>rate first, then sum</strong>. <code>sum(rate(x[5m]))</code> is right; <code>rate(sum(x)[5m])</code> breaks counter-reset detection. And keep the range at least 4x the scrape interval (15s scrape → <code>[1m]</code> minimum).</p>
<blockquote>💡 Real world: <code>irate()</code> uses only the last two samples — spiky and great for "right now" debugging, terrible for alerts. Alerts use <code>rate()</code>.</blockquote>`,
        he: `<p>Counter גולמי (<code>184223</code>) חסר תועלת – הוא תלוי מתי התהליך עלה. מה שרוצים זה <strong>קצב לשנייה</strong> לאורך חלון זמן. <code>rate()</code> גם מטפל באיפוס של counters כשפודים עושים ריסטארט.</p>
<pre># Requests per second, per service (5-minute window)
sum by (service) (rate(http_requests_total[5m]))

# Error ratio (0.0 - 1.0) for checkout
sum(rate(http_requests_total{service="checkout", code=~"5.."}[5m]))
  /
sum(rate(http_requests_total{service="checkout"}[5m]))

# p99 latency across all pods
histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket{service="checkout"}[5m])))

# Total requests in the last 24h
sum(increase(http_requests_total[24h]))

# Pods using more than 90% of their memory limit
container_memory_working_set_bytes / on(pod, container)
  kube_pod_container_resource_limits{resource="memory"} &gt; 0.9</pre>
<p>כלל זהב: <strong>קודם rate, אחר כך sum</strong>. <code>sum(rate(x[5m]))</code> נכון; <code>rate(sum(x)[5m])</code> שובר את הזיהוי של איפוס counters. ותשמרו על חלון של לפחות פי 4 מה-scrape interval (scrape כל 15 שניות ← מינימום <code>[1m]</code>).</p>
<blockquote>💡 מהשטח: <code>irate()</code> משתמש רק בשתי הדגימות האחרונות – קופצני ומעולה לדיבאג של "עכשיו", גרוע ל-alerts. ב-alerts משתמשים ב-<code>rate()</code>.</blockquote>`
      }
    },
    {
      h: { en: "Percentiles vs averages: why the average lies", he: "אחוזונים מול ממוצע: למה הממוצע משקר" },
      body: {
        en: `<p>100 requests: 98 take 50ms, 2 take 5 seconds. The <strong>average is 149ms</strong> — looks healthy. The <strong>p99 is 5s</strong> — 1 in 50 users is staring at a spinner. Averages hide the tail, and the tail is where users rage-quit.</p>
<ul>
<li><strong>p50</strong> (median): the typical experience.</li>
<li><strong>p95 / p99</strong>: the "bad but common" experience. Your SLO usually lives here.</li>
<li><strong>p99.9 / max</strong>: outliers — GC pauses, cold caches, retries.</li>
</ul>
<p>Tail latency compounds: if a page makes 100 backend calls in parallel, and each has a 1% chance of being slow, then <code>1 - 0.99^100 ≈ 63%</code> of page loads hit at least one slow call. Your p99 becomes your users' median.</p>
<p>Also: <strong>you can't average percentiles</strong>. avg(p99 of pod A, p99 of pod B) is not the p99 of the service. Aggregate the histogram buckets, then compute the quantile.</p>
<blockquote>⚠️ Production tip: always graph p50, p95 and p99 together. A rising p99 with a flat p50 means "some requests" (one slow dependency, one bad node); everything rising together means "the whole system" (saturation).</blockquote>`,
        he: `<p>100 requests: 98 לוקחים 50ms, 2 לוקחים 5 שניות. ה-<strong>ממוצע הוא 149ms</strong> – נראה בריא. ה-<strong>p99 הוא 5 שניות</strong> – משתמש אחד מכל 50 בוהה בספינר. ממוצע מחביא את הזנב, והזנב זה בדיוק איפה שמשתמשים עוזבים בעצבים.</p>
<ul>
<li><strong>p50</strong> (חציון): החוויה הטיפוסית.</li>
<li><strong>p95 / p99</strong>: החוויה ה"רעה אבל נפוצה". ה-SLO בדרך כלל יושב פה.</li>
<li><strong>p99.9 / max</strong>: חריגים – GC pauses, cache קר, retries.</li>
</ul>
<p>Tail latency מצטבר: אם דף עושה 100 קריאות backend במקביל, ולכל אחת יש סיכוי של 1% להיות איטית, אז <code>1 - 0.99^100 ≈ 63%</code> מטעינות הדף יפגשו לפחות קריאה איטית אחת. ה-p99 שלך הופך לחציון של המשתמשים.</p>
<p>ועוד: <strong>אי אפשר לעשות ממוצע לאחוזונים</strong>. ממוצע של ה-p99 של פוד A ושל פוד B הוא לא ה-p99 של השירות. מאגרגים את ה-buckets של ה-histogram, ורק אז מחשבים quantile.</p>
<blockquote>⚠️ טיפ לפרודקשן: תמיד תציגו p50, p95 ו-p99 על אותו גרף. p99 שעולה כש-p50 שטוח אומר "חלק מה-requests" (dependency איטי אחד, node בעייתי אחד); הכל עולה ביחד אומר "כל המערכת" (saturation).</blockquote>`
      }
    },
    {
      h: { en: "Cardinality explosions", he: "פיצוץ cardinality" },
      body: {
        en: `<p><strong>Cardinality</strong> = number of unique time series. It's the product of label values: <code>5 endpoints × 4 methods × 6 status codes × 30 pods = 3,600 series</code>. Fine. Now someone adds <code>user_id</code> with 1M users: <strong>3.6 billion</strong> potential series. Prometheus keeps active series in memory (a few KB each), so it OOMs, and your SaaS bill (often priced per custom metric/series) gets a new digit.</p>
<p>Labels that explode: <code>user_id</code>, <code>email</code>, <code>request_id</code>, <code>trace_id</code>, full URL paths (<code>/orders/98123</code>), raw error messages, timestamps. Labels that are fine: <code>service</code>, <code>route</code> template (<code>/orders/:id</code>), <code>method</code>, <code>status_class</code>, <code>region</code>, <code>version</code>.</p>
<pre># Find your top 10 metrics by series count
topk(10, count by (__name__) ({__name__=~".+"}))</pre>
<blockquote>💡 Real world: per-user detail belongs in logs and traces (high cardinality is their job). Metrics are for aggregates. If you truly need high-cardinality analytics, use a tool built for it (Honeycomb, ClickHouse) rather than abusing Prometheus labels.</blockquote>`,
        he: `<p><strong>Cardinality</strong> = מספר ה-time series הייחודיות. זו המכפלה של ערכי ה-labels: <code>5 endpoints × 4 methods × 6 status codes × 30 pods = 3,600 series</code>. בסדר גמור. עכשיו מישהו מוסיף <code>user_id</code> עם מיליון משתמשים: <strong>3.6 מיליארד</strong> סדרות פוטנציאליות. Prometheus מחזיק סדרות פעילות בזיכרון (כמה KB כל אחת), אז הוא חוטף OOM, וחשבון ה-SaaS (שלרוב מתומחר לפי custom metric/series) מקבל עוד ספרה.</p>
<p>Labels שמתפוצצים: <code>user_id</code>, <code>email</code>, <code>request_id</code>, <code>trace_id</code>, נתיבי URL מלאים (<code>/orders/98123</code>), הודעות שגיאה גולמיות, timestamps. Labels שבסדר: <code>service</code>, תבנית route (<code>/orders/:id</code>), <code>method</code>, <code>status_class</code>, <code>region</code>, <code>version</code>.</p>
<pre># Find your top 10 metrics by series count
topk(10, count by (__name__) ({__name__=~".+"}))</pre>
<blockquote>💡 מהשטח: פירוט ברמת משתמש שייך ללוגים ול-traces (high cardinality זה התפקיד שלהם). Metrics הם לאגרגציות. אם באמת צריך אנליטיקה עם high cardinality, תשתמשו בכלי שבנוי לזה (Honeycomb, ClickHouse) במקום להתעלל ב-labels של Prometheus.</blockquote>`
      }
    },
    {
      h: { en: "Pull vs push", he: "Pull מול push" },
      body: {
        en: `<p><strong>Pull (Prometheus)</strong>: your app exposes <code>GET /metrics</code> in plain text; Prometheus discovers targets (e.g. Kubernetes pods via service discovery) and scrapes them every 15-30s. Bonus: the synthetic <code>up</code> metric tells you instantly when a target can't be scraped — "is it down?" comes for free.</p>
<pre>scrape_configs:
  - job_name: checkout
    scrape_interval: 15s
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: checkout
        action: keep</pre>
<p><strong>Push (StatsD, Datadog agent, OTLP, CloudWatch PutMetricData)</strong>: the app sends metrics to a collector. Works through firewalls/NAT, fits short-lived jobs and serverless (a Lambda that lives 200ms can't wait to be scraped). Prometheus's answer for batch jobs is the Pushgateway — but use it only for jobs, never as a general push proxy.</p>
<blockquote>⚠️ Production tip: with pull, absence is detectable (<code>up == 0</code>). With push, silence looks like "everything is fine". Add an <code>absent()</code> alert or heartbeat metric for anything critical that pushes.</blockquote>`,
        he: `<p><strong>Pull (Prometheus)</strong>: האפליקציה חושפת <code>GET /metrics</code> בטקסט פשוט; Prometheus מגלה targets (למשל פודים ב-Kubernetes דרך service discovery) ועושה להם scrape כל 15-30 שניות. בונוס: ה-metric הסינתטי <code>up</code> אומר לך מיד כשאי אפשר לעשות scrape ל-target – "האם הוא למטה?" מגיע בחינם.</p>
<pre>scrape_configs:
  - job_name: checkout
    scrape_interval: 15s
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: checkout
        action: keep</pre>
<p><strong>Push (StatsD, Datadog agent, OTLP, CloudWatch PutMetricData)</strong>: האפליקציה שולחת metrics ל-collector. עובד דרך firewalls/NAT, מתאים ל-jobs קצרי חיים ול-serverless (Lambda שחיה 200ms לא יכולה לחכות ל-scrape). הפתרון של Prometheus ל-batch jobs הוא Pushgateway – אבל רק ל-jobs, אף פעם לא כ-proxy כללי ל-push.</p>
<blockquote>⚠️ טיפ לפרודקשן: ב-pull אפשר לזהות היעדר (<code>up == 0</code>). ב-push, שקט נראה כמו "הכל בסדר". תוסיפו alert עם <code>absent()</code> או heartbeat metric לכל דבר קריטי שעושה push.</blockquote>`
      }
    }
  ],
  diagram: `Histogram buckets (cumulative)  for 100 requests:
  le=0.05  |##################################################  98
  le=0.1   |##################################################  98
  le=1     |##################################################  98
  le=5     |################################################### 100
  le=+Inf  |################################################### 100
  avg = 149ms (looks fine)        p99 = ~5s (users suffer)`,
  handsOn: [
    { cmd: "curl -s localhost:9090/metrics | grep -E '^# (HELP|TYPE)' | head -20", what: { en: "See metric types declared in the exposition format (counter, gauge, histogram, summary).", he: "רואים את סוגי ה-metrics שמוצהרים בפורמט החשיפה (counter, gauge, histogram, summary)." } },
    { cmd: "curl -s 'localhost:9090/api/v1/query' --data-urlencode 'query=sum by (code) (rate(prometheus_http_requests_total[5m]))'", what: { en: "Run a real rate() query through the HTTP API — the same API Grafana uses.", he: "מריצים שאילתת rate() אמיתית דרך ה-HTTP API – אותו API ש-Grafana משתמש בו." } },
    { cmd: "curl -s 'localhost:9090/api/v1/query' --data-urlencode 'query=histogram_quantile(0.99, sum by (le) (rate(prometheus_http_request_duration_seconds_bucket[5m])))'", what: { en: "Compute a p99 from histogram buckets on Prometheus's own HTTP handler.", he: "מחשבים p99 מתוך buckets של histogram על ה-HTTP handler של Prometheus עצמו." } },
    { cmd: "curl -s localhost:9090/api/v1/status/tsdb | head -c 1500", what: { en: "TSDB stats: number of series and the labels with the highest cardinality — your first stop when memory climbs.", he: "סטטיסטיקות TSDB: מספר הסדרות וה-labels עם ה-cardinality הכי גבוה – התחנה הראשונה כשהזיכרון מטפס." } }
  ],
  mnemonic: {
    en: "\"Counters Climb, Gauges Go both ways, Histograms Hold buckets.\" And for queries: \"Rate before you Sum, or your graph goes dumb.\" Never label by anything you'd find in a phone book.",
    he: "\"Counter רק מטפס, Gauge הולך לשני הכיוונים, Histogram מחזיק דליים.\" ולשאילתות: \"קודם rate ואז sum, אחרת הגרף מטומטם.\" לעולם אל תעשו label על משהו שהייתם מוצאים בספר טלפונים."
  },
  pitfalls: [
    { en: "Alerting on average latency. The average can stay flat while p99 goes from 300ms to 5s for 2% of users.", he: "לעשות alert על latency ממוצע. הממוצע יכול להישאר שטוח בזמן שה-p99 קופץ מ-300ms ל-5 שניות עבור 2% מהמשתמשים." },
    { en: "Putting user_id, request_id or raw URL paths in labels — cardinality explosion, Prometheus OOM, five-figure SaaS bill.", he: "לשים user_id, request_id או נתיבי URL גולמיים ב-labels – פיצוץ cardinality, OOM ל-Prometheus, וחשבון SaaS עם חמש ספרות." },
    { en: "Graphing a raw counter or doing rate(sum(...)) — you'll see sawtooth drops at every pod restart.", he: "להציג counter גולמי או לעשות rate(sum(...)) – תראו נפילות בצורת מסור בכל ריסטארט של פוד." },
    { en: "Averaging p99s across pods or regions. Aggregate buckets with sum by (le), then histogram_quantile.", he: "לעשות ממוצע ל-p99 בין פודים או אזורים. מאגרגים buckets עם sum by (le), ורק אז histogram_quantile." }
  ],
  interview: [
    {
      q: { en: "Why use a histogram rather than a summary for latency?", he: "למה להשתמש ב-histogram ולא ב-summary ל-latency?" },
      a: { en: "Histogram buckets are counters, so they can be aggregated across instances and the quantile computed server-side for any group (service, region). Summary quantiles are pre-computed per instance and can't be meaningfully combined. Trade-off: histogram quantiles are estimates interpolated within buckets, so buckets must be chosen around the SLO thresholds (or use native histograms).", he: "ה-buckets של histogram הם counters, אז אפשר לאגרג אותם בין instances ולחשב quantile בצד השרת לכל קבוצה (service, region). ה-quantiles של summary מחושבים מראש לכל instance ואי אפשר לשלב אותם בצורה משמעותית. ה-trade-off: quantiles של histogram הם הערכה עם אינטרפולציה בתוך ה-buckets, אז צריך לבחור buckets סביב ספי ה-SLO (או להשתמש ב-native histograms)." }
    },
    {
      q: { en: "Our Prometheus memory doubled overnight. What do you check?", he: "הזיכרון של Prometheus הוכפל בלילה. מה אתה בודק?" },
      a: { en: "Cardinality. Check /api/v1/status/tsdb or run topk(10, count by (__name__)({__name__=~\".+\"})) to find which metric and which label grew. Usual suspects: a new deploy added a label like user_id or an unbounded path, or pod churn (many short-lived pods each creating new series). Fix by dropping/relabeling the label with metric_relabel_configs and fixing the instrumentation.", he: "Cardinality. בודקים את /api/v1/status/tsdb או מריצים topk(10, count by (__name__)({__name__=~\".+\"})) כדי למצוא איזה metric ואיזה label גדלו. החשודים הרגילים: deploy חדש הוסיף label כמו user_id או path לא חסום, או churn של פודים (הרבה פודים קצרי חיים שכל אחד יוצר סדרות חדשות). מתקנים עם drop/relabel של ה-label דרך metric_relabel_configs ותיקון ה-instrumentation." }
    }
  ],
  quiz: [
    {
      q: { en: "98 requests take 50ms and 2 take 5s. What does the average (~149ms) hide?", he: "98 requests לוקחים 50ms ו-2 לוקחים 5 שניות. מה הממוצע (~149ms) מחביא?" },
      options: [
        { en: "Nothing — 149ms is an accurate summary", he: "כלום – 149ms זה סיכום מדויק" },
        { en: "That the p99 is about 5 seconds", he: "שה-p99 הוא בערך 5 שניות" },
        { en: "That the p50 is 5 seconds", he: "שה-p50 הוא 5 שניות" },
        { en: "That throughput dropped", he: "שה-throughput ירד" }
      ],
      answer: 1,
      explain: { en: "The average blends the slow tail into a healthy-looking number. The p99 shows that the slowest 1-2% wait 5s.", he: "הממוצע מערבב את הזנב האיטי למספר שנראה בריא. ה-p99 מראה שה-1-2% האיטיים מחכים 5 שניות." }
    },
    {
      q: { en: "Which PromQL correctly gives requests/sec across all pods?", he: "איזו שאילתת PromQL נותנת נכון requests לשנייה על כל הפודים?" },
      options: [
        { en: "rate(sum(http_requests_total)[5m])", he: "rate(sum(http_requests_total)[5m])" },
        { en: "sum(http_requests_total) / 300", he: "sum(http_requests_total) / 300" },
        { en: "sum(rate(http_requests_total[5m]))", he: "sum(rate(http_requests_total[5m]))" },
        { en: "avg(irate(http_requests_total[5m]))", he: "avg(irate(http_requests_total[5m]))" }
      ],
      answer: 2,
      explain: { en: "Rate each counter first (handling resets), then sum. rate(sum()) breaks reset detection; dividing the raw total gives lifetime totals; avg gives per-pod, not total.", he: "קודם rate לכל counter (כולל טיפול באיפוסים), ואז sum. rate(sum()) שובר זיהוי איפוסים; חלוקת הסכום הגולמי נותנת סך מאז העלייה; avg נותן ממוצע לפוד, לא סך הכל." }
    },
    {
      q: { en: "Which label is most likely to cause a cardinality explosion?", he: "איזה label הכי סביר שיגרום לפיצוץ cardinality?" },
      options: [
        { en: "status_code", he: "status_code" },
        { en: "region", he: "region" },
        { en: "route=\"/orders/:id\"", he: "route=\"/orders/:id\"" },
        { en: "session_id", he: "session_id" }
      ],
      answer: 3,
      explain: { en: "session_id is unbounded — every session creates new series. The others have a small, bounded set of values.", he: "session_id לא חסום – כל session יוצר סדרות חדשות. לאחרים יש קבוצה קטנה וחסומה של ערכים." }
    },
    {
      q: { en: "A nightly batch job runs 40 seconds. How should it report metrics to Prometheus?", he: "Batch job לילי רץ 40 שניות. איך הוא צריך לדווח metrics ל-Prometheus?" },
      options: [
        { en: "Push to a Pushgateway at the end of the run", he: "push ל-Pushgateway בסוף הריצה" },
        { en: "Expose /metrics and hope a scrape happens during the 40 seconds", he: "לחשוף /metrics ולקוות שיהיה scrape בתוך ה-40 שניות" },
        { en: "Write metrics to the application log only", he: "לכתוב את ה-metrics רק ללוג של האפליקציה" },
        { en: "Lower the global scrape interval to 1s", he: "להוריד את ה-scrape interval הגלובלי לשנייה אחת" }
      ],
      answer: 0,
      explain: { en: "Short-lived jobs may die before being scraped; Pushgateway holds their final metrics for Prometheus to scrape. A 1s global interval would multiply load for everything.", he: "Jobs קצרי חיים יכולים למות לפני שעושים להם scrape; Pushgateway מחזיק את ה-metrics הסופיים שלהם עד ש-Prometheus יבוא לקחת. Interval גלובלי של שנייה יכפיל את העומס על הכל." }
    }
  ],
  related: ["obs-golden-signals", "obs-traces", "obs-dashboards", "cpu", "memory"]
});

window.INFRA.lessons.push({
  id: "obs-logs",
  track: "observability",
  order: 3,
  icon: "📜",
  level: 2,
  minutes: 11,
  title: { en: "Logs That Actually Help at 3 AM", he: "לוגים שבאמת עוזרים ב-3 בלילה" },
  tldr: {
    en: "Log structured JSON with a request/trace ID on every line, at the right level, without secrets or PII — and budget for it, because logs are the most expensive pillar.",
    he: "כותבים לוגים כ-JSON מובנה, עם request/trace ID בכל שורה, ברמה הנכונה, בלי סודות ובלי PII – ומתקצבים את זה, כי לוגים הם העמוד הכי יקר."
  },
  analogy: {
    en: "Logs are an airplane's black box. Free-text logs are a pilot mumbling into a tape recorder: technically everything is there, but good luck finding 'the moment the left engine overheated'. Structured logs are a flight data recorder: every entry has the same labeled fields (time, altitude, engine_temp, flight_id), so investigators can query 'all entries where engine_temp > 900 on flight LY001' in seconds.",
    he: "לוגים הם הקופסה השחורה של המטוס. לוגים בטקסט חופשי זה טייס שממלמל לטייפ: טכנית הכל שם, אבל בהצלחה למצוא 'את הרגע שהמנוע השמאלי התחמם'. לוגים מובנים זה flight data recorder: לכל רשומה יש אותם שדות מתויגים (זמן, גובה, engine_temp, flight_id), אז החוקרים יכולים לשאול 'כל הרשומות שבהן engine_temp מעל 900 בטיסה LY001' תוך שניות."
  },
  sections: [
    {
      h: { en: "Structured JSON logs", he: "לוגים מובנים ב-JSON" },
      body: {
        en: `<p>Compare:</p>
<pre>2026-11-12 09:14:03 ERROR Payment failed for user 8812 order A-981 after 842ms (stripe: card_declined)</pre>
<pre>{"ts":"2026-11-12T09:14:03.512Z","level":"error","service":"checkout","version":"2.3.1",
 "trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","request_id":"req-7f3a",
 "msg":"payment failed","user_id":"u_8812","order_id":"A-981",
 "provider":"stripe","error_code":"card_declined","latency_ms":842}</pre>
<p>The first is for humans reading one line. The second is for machines querying millions. With JSON you can ask "count errors by <code>error_code</code> for <code>provider=stripe</code> in the last hour" without writing a fragile regex. Keep the <code>msg</code> constant ("payment failed") and put variables in fields — that makes grouping by message possible.</p>
<pre># Loki (LogQL)
{service="checkout"} | json | level="error" | latency_ms &gt; 500

# CloudWatch Logs Insights
fields @timestamp, error_code | filter level="error" | stats count() by error_code</pre>
<blockquote>💡 Real world: use your language's structured logger (zap/zerolog in Go, structlog in Python, pino in Node, Logback JSON encoder in Java) and log to <strong>stdout</strong>. In containers, the platform collects stdout — never write log files inside the container.</blockquote>`,
        he: `<p>תשוו:</p>
<pre>2026-11-12 09:14:03 ERROR Payment failed for user 8812 order A-981 after 842ms (stripe: card_declined)</pre>
<pre>{"ts":"2026-11-12T09:14:03.512Z","level":"error","service":"checkout","version":"2.3.1",
 "trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","request_id":"req-7f3a",
 "msg":"payment failed","user_id":"u_8812","order_id":"A-981",
 "provider":"stripe","error_code":"card_declined","latency_ms":842}</pre>
<p>הראשון מיועד לבן אדם שקורא שורה אחת. השני מיועד למכונה ששואלת על מיליונים. עם JSON אפשר לשאול "ספור errors לפי <code>error_code</code> עבור <code>provider=stripe</code> בשעה האחרונה" בלי לכתוב regex שביר. תשאירו את ה-<code>msg</code> קבוע ("payment failed") ותשימו את המשתנים בשדות – ככה אפשר לקבץ לפי הודעה.</p>
<pre># Loki (LogQL)
{service="checkout"} | json | level="error" | latency_ms &gt; 500

# CloudWatch Logs Insights
fields @timestamp, error_code | filter level="error" | stats count() by error_code</pre>
<blockquote>💡 מהשטח: תשתמשו ב-structured logger של השפה (zap/zerolog ב-Go, structlog בפייתון, pino ב-Node, Logback JSON encoder ב-Java) ותכתבו ל-<strong>stdout</strong>. בקונטיינרים הפלטפורמה אוספת את ה-stdout – אף פעם לא כותבים קבצי לוג בתוך הקונטיינר.</blockquote>`
      }
    },
    {
      h: { en: "Log levels and what (not) to log", he: "רמות לוג ומה (לא) ללוגג" },
      body: {
        en: `<table>
<tr><th>Level</th><th>Meaning</th><th>Example</th></tr>
<tr><td>ERROR</td><td>A request/operation failed and someone may need to act</td><td>payment provider returned 500 after 3 retries</td></tr>
<tr><td>WARN</td><td>Unexpected but handled; might become an error</td><td>retry 1/3, cache miss storm, deprecated API used</td></tr>
<tr><td>INFO</td><td>Business-relevant milestones</td><td>order placed, server started on :8080</td></tr>
<tr><td>DEBUG</td><td>Developer detail, off in prod by default</td><td>SQL text, parsed config, branch decisions</td></tr>
</table>
<p><strong>Do log</strong>: request/trace ID, user or tenant ID (pseudonymous), operation, outcome, duration, error type + stack trace, version.</p>
<p><strong>Never log</strong>: passwords, tokens, API keys, <code>Authorization</code> headers, session cookies, full credit-card numbers (PCI-DSS!), and avoid raw PII (emails, phone numbers, ID numbers, addresses) — under GDPR, a log line is personal data with retention and deletion obligations.</p>
<blockquote>⚠️ Production tip: the classic leak is <code>logger.info("request", req)</code> dumping the whole request object including headers. Use an allow-list of fields or a redaction middleware, and add a CI check (e.g. gitleaks-style regexes) on sample log output.</blockquote>`,
        he: `<table>
<tr><th>רמה</th><th>משמעות</th><th>דוגמה</th></tr>
<tr><td>ERROR</td><td>request/פעולה נכשלה ואולי מישהו צריך לפעול</td><td>ספק התשלומים החזיר 500 אחרי 3 retries</td></tr>
<tr><td>WARN</td><td>לא צפוי אבל טופל; עלול להפוך ל-error</td><td>retry 1/3, סערת cache misses, שימוש ב-API שהוצא משימוש</td></tr>
<tr><td>INFO</td><td>אבני דרך עסקיות</td><td>הזמנה בוצעה, השרת עלה על 8080</td></tr>
<tr><td>DEBUG</td><td>פרטים למפתחים, כבוי בפרודקשן כברירת מחדל</td><td>טקסט SQL, קונפיג אחרי parsing, החלטות branch</td></tr>
</table>
<p><strong>כן ללוגג</strong>: request/trace ID, מזהה משתמש או tenant (פסאודונימי), הפעולה, התוצאה, משך, סוג השגיאה + stack trace, גרסה.</p>
<p><strong>אף פעם לא ללוגג</strong>: סיסמאות, טוקנים, API keys, headers של <code>Authorization</code>, session cookies, מספרי כרטיס אשראי מלאים (PCI-DSS!), ולהימנע מ-PII גולמי (מיילים, טלפונים, תעודות זהות, כתובות) – לפי GDPR, שורת לוג היא מידע אישי עם חובות retention ומחיקה.</p>
<blockquote>⚠️ טיפ לפרודקשן: הדליפה הקלאסית היא <code>logger.info("request", req)</code> שזורק את כל אובייקט ה-request כולל ה-headers. תשתמשו ב-allow-list של שדות או ב-middleware של redaction, ותוסיפו בדיקה ב-CI (regexes בסגנון gitleaks) על דוגמת פלט לוגים.</blockquote>`
      }
    },
    {
      h: { en: "Correlation IDs: stitching the story together", he: "Correlation IDs: לתפור את הסיפור ביחד" },
      body: {
        en: `<p>One user click → API gateway → checkout → payments → fraud-check → DB. That's five services writing logs, interleaved with thousands of other requests. Without a shared ID you're matching timestamps by eye.</p>
<p>The fix: generate an ID at the edge (or reuse the incoming one), pass it in a header to every downstream call, and put it in <strong>every</strong> log line. Today the standard is the W3C <code>traceparent</code> header — its trace ID doubles as the correlation ID, so logs and traces join for free.</p>
<pre># one query → the whole journey across services
{namespace="prod"} | json | trace_id="4bf92f3577b34da6a3ce929d0e0e4736"</pre>
<p>Implementation: put the ID in request-scoped context (Go <code>context.Context</code>, Java MDC, Python <code>contextvars</code>, Node <code>AsyncLocalStorage</code>) and have the logger add it automatically. If a developer has to remember to pass it manually, 30% of log lines won't have it.</p>
<blockquote>💡 Real world: return the request ID to the client in a response header (<code>X-Request-Id</code>) and show it on error pages. When support gets "it broke!" with an ID attached, debugging takes 2 minutes instead of 2 days.</blockquote>`,
        he: `<p>קליק אחד של משתמש ← API gateway ← checkout ← payments ← fraud-check ← DB. אלה חמישה שירותים שכותבים לוגים, מעורבבים עם אלפי requests אחרים. בלי ID משותף אתה מתאים timestamps בעיניים.</p>
<p>הפתרון: מייצרים ID בכניסה (או משתמשים בזה שהגיע), מעבירים אותו ב-header לכל קריאה downstream, ושמים אותו ב<strong>כל</strong> שורת לוג. היום הסטנדרט הוא ה-header של W3C <code>traceparent</code> – ה-trace ID שלו משמש גם כ-correlation ID, אז לוגים ו-traces מתחברים בחינם.</p>
<pre># one query → the whole journey across services
{namespace="prod"} | json | trace_id="4bf92f3577b34da6a3ce929d0e0e4736"</pre>
<p>מימוש: שמים את ה-ID ב-context ברמת ה-request (ב-Go <code>context.Context</code>, ב-Java MDC, בפייתון <code>contextvars</code>, ב-Node <code>AsyncLocalStorage</code>) והלוגר מוסיף אותו אוטומטית. אם מפתח צריך לזכור להעביר אותו ידנית, ל-30% משורות הלוג לא יהיה אותו.</p>
<blockquote>💡 מהשטח: תחזירו את ה-request ID ללקוח ב-header של התשובה (<code>X-Request-Id</code>) ותציגו אותו בדפי שגיאה. כשהתמיכה מקבלת "זה נשבר!" עם ID מצורף, הדיבאג לוקח 2 דקות במקום יומיים.</blockquote>`
      }
    },
    {
      h: { en: "The log pipeline: agent → collector → storage → query", he: "ה-pipeline של הלוגים: agent ← collector ← storage ← query" },
      body: {
        en: `<ol>
<li><strong>Emit</strong>: app writes JSON to stdout. The container runtime writes it to <code>/var/log/containers/*.log</code> on the node.</li>
<li><strong>Agent</strong> (DaemonSet, one per node): Fluent Bit, Vector, Promtail/Grafana Alloy, OTel Collector, Datadog Agent. Tails files, adds Kubernetes metadata (pod, namespace, labels), buffers.</li>
<li><strong>Collector / aggregator</strong> (optional): Logstash, Vector, OTel Collector, Kafka as a buffer. Parses, redacts PII, drops noise, samples, routes (errors to hot storage, debug to S3).</li>
<li><strong>Storage</strong>: Elasticsearch/OpenSearch (full-text inverted index — fast search, expensive), Loki (indexes only labels, stores chunks in object storage — cheap, slower for needle-in-haystack), CloudWatch Logs, Azure Log Analytics.</li>
<li><strong>Query</strong>: Kibana / OpenSearch Dashboards, Grafana (LogQL), Logs Insights, KQL.</li>
</ol>
<blockquote>⚠️ Production tip: the agent must have a disk buffer and backpressure. When the backend is down for 20 minutes, a memory-only agent either drops logs or gets OOMKilled — exactly during the incident when you need them most.</blockquote>`,
        he: `<ol>
<li><strong>Emit</strong>: האפליקציה כותבת JSON ל-stdout. ה-container runtime כותב אותו ל-<code>/var/log/containers/*.log</code> על ה-node.</li>
<li><strong>Agent</strong> (DaemonSet, אחד לכל node): Fluent Bit, Vector, Promtail/Grafana Alloy, OTel Collector, Datadog Agent. עושה tail לקבצים, מוסיף metadata של Kubernetes (pod, namespace, labels), עושה buffering.</li>
<li><strong>Collector / aggregator</strong> (אופציונלי): Logstash, Vector, OTel Collector, Kafka כבאפר. עושה parsing, מסיר PII, זורק רעש, עושה sampling, מנתב (errors ל-hot storage, debug ל-S3).</li>
<li><strong>Storage</strong>: Elasticsearch/OpenSearch (אינדקס הפוך full-text – חיפוש מהיר, יקר), Loki (מאנדקס רק labels, שומר chunks ב-object storage – זול, איטי יותר בחיפוש מחט בערימת שחת), CloudWatch Logs, Azure Log Analytics.</li>
<li><strong>Query</strong>: Kibana / OpenSearch Dashboards, Grafana (LogQL), Logs Insights, KQL.</li>
</ol>
<blockquote>⚠️ טיפ לפרודקשן: ל-agent חייב להיות buffer על דיסק ו-backpressure. כשה-backend למטה 20 דקות, agent שמחזיק רק בזיכרון או זורק לוגים או חוטף OOMKill – בדיוק באמצע התקלה, כשהכי צריך אותם.</blockquote>`
      }
    },
    {
      h: { en: "Retention, cost & sampling", he: "Retention, עלויות ו-sampling" },
      body: {
        en: `<p>Do the math before the bill does it for you: 200 pods × 10 lines/s × 500 bytes = <strong>1 MB/s ≈ 86 GB/day ≈ 2.6 TB/month</strong>. At ~$0.50/GB ingestion (CloudWatch Logs list price) that's ~$1,300/month <em>before</em> storage and queries. Datadog/Splunk-style indexing can cost several times more.</p>
<p>Levers, in order of impact:</p>
<ul>
<li><strong>Don't emit noise</strong>: health-check access logs (<code>GET /healthz 200</code> every 5s × 200 pods = 3.4M useless lines/day), per-item loops, DEBUG in prod.</li>
<li><strong>Tiered retention</strong>: 7-14 days hot & searchable, 90 days in cheap object storage, 1+ year archive only for audit/compliance logs.</li>
<li><strong>Sampling</strong>: keep 100% of errors and warnings, 1-10% of successful INFO request logs. Sample by trace ID so you keep <em>whole</em> requests, not random fragments.</li>
<li><strong>Metrics instead of logs</strong>: if you only ever <code>count()</code> a log line, it should be a counter.</li>
</ul>
<blockquote>💡 Real world: a common surprise is that a single chatty library (an HTTP client logging every retry at INFO) produces 40% of total volume. Run a "top log patterns by volume" query monthly.</blockquote>`,
        he: `<p>תעשו את החשבון לפני שהחשבונית תעשה אותו בשבילכם: 200 פודים × 10 שורות לשנייה × 500 בייט = <strong>1 MB/s ≈ 86 GB ליום ≈ 2.6 TB לחודש</strong>. ב-~0.50$ ל-GB ingestion (מחירון CloudWatch Logs) זה ~1,300$ לחודש <em>לפני</em> אחסון ושאילתות. אינדוקס בסגנון Datadog/Splunk יכול לעלות פי כמה.</p>
<p>המנופים, לפי סדר השפעה:</p>
<ul>
<li><strong>לא לייצר רעש</strong>: access logs של health checks (<code>GET /healthz 200</code> כל 5 שניות × 200 פודים = 3.4 מיליון שורות מיותרות ביום), לולאות שמלוגגות כל פריט, DEBUG בפרודקשן.</li>
<li><strong>Retention בשכבות</strong>: 7-14 ימים hot וניתן לחיפוש, 90 יום ב-object storage זול, שנה+ ארכיון רק ללוגי audit/compliance.</li>
<li><strong>Sampling</strong>: שומרים 100% מה-errors וה-warnings, 1-10% מלוגי INFO של requests מוצלחים. עושים sampling לפי trace ID כדי לשמור requests <em>שלמים</em>, לא שברים אקראיים.</li>
<li><strong>Metrics במקום לוגים</strong>: אם אתם רק עושים <code>count()</code> על שורת לוג, היא צריכה להיות counter.</li>
</ul>
<blockquote>💡 מהשטח: הפתעה נפוצה היא שספרייה פטפטנית אחת (HTTP client שמלוגג כל retry ב-INFO) מייצרת 40% מכל הנפח. תריצו פעם בחודש שאילתת "top log patterns by volume".</blockquote>`
      }
    }
  ],
  diagram: `[app stdout JSON] -> /var/log/containers/*.log
        -> [agent: Fluent Bit / Vector / Alloy (DaemonSet, disk buffer)]
        -> [collector: parse, redact PII, sample, route]
        -> hot: Loki / OpenSearch (7-14d)  |  cold: S3 / Blob (90d+)
        -> query: Grafana (LogQL) / Kibana / Logs Insights / KQL`,
  handsOn: [
    { cmd: "kubectl logs deploy/checkout --since=10m | jq -c 'select(.level==\"error\") | {ts, msg, trace_id, error_code}'", what: { en: "Filter structured logs locally with jq — only works because they're JSON.", he: "מסננים לוגים מובנים מקומית עם jq – עובד רק כי הם JSON." } },
    { cmd: "kubectl logs deploy/checkout --since=1h | jq -r '.msg' | sort | uniq -c | sort -rn | head", what: { en: "Find your noisiest log messages — the first step of any log-cost diet.", he: "מוצאים את הודעות הלוג הכי רועשות – הצעד הראשון בכל דיאטת עלויות לוגים." } },
    { cmd: "curl -si -H 'X-Request-Id: test-123' http://localhost:8080/api/orders | grep -i request-id", what: { en: "Check your service echoes the request ID back — then grep your logs for 'test-123'.", he: "בודקים שהשירות מחזיר את ה-request ID – ואז מחפשים 'test-123' בלוגים." } }
  ],
  mnemonic: {
    en: "\"JSON, ID, no PII.\" Every log line: structured, correlated, clean. And for cost: \"If you only count it, make it a metric.\"",
    he: "\"JSON, ID, בלי PII.\" כל שורת לוג: מובנית, מקושרת, נקייה. ולעלויות: \"אם רק סופרים את זה – זה צריך להיות metric.\""
  },
  pitfalls: [
    { en: "Logging the whole request/response object — leaks Authorization headers, tokens and PII into a system with broad read access and long retention.", he: "ללוגג את כל אובייקט ה-request/response – מדליף headers של Authorization, טוקנים ו-PII למערכת שיש לה הרשאות קריאה רחבות ו-retention ארוך." },
    { en: "Putting variables inside the message string ('Payment failed for user 8812') — impossible to group or count by message.", he: "לשים משתנים בתוך ה-message ('Payment failed for user 8812') – אי אפשר לקבץ או לספור לפי הודעה." },
    { en: "Everything at ERROR. If 5,000 'errors' a minute are normal, nobody notices the one that matters.", he: "הכל ב-ERROR. אם 5,000 'שגיאות' בדקה זה נורמלי, אף אחד לא שם לב לזאת שחשובה." },
    { en: "Random per-line sampling — you keep the gateway log but drop the DB log of the same request. Sample per trace.", he: "Sampling אקראי לכל שורה – שומרים את הלוג של ה-gateway אבל זורקים את לוג ה-DB של אותו request. עושים sampling לפי trace." }
  ],
  interview: [
    {
      q: { en: "How would you reduce a $40k/month logging bill without losing debuggability?", he: "איך תוריד חשבון לוגים של 40 אלף דולר בחודש בלי לאבד יכולת דיבאג?" },
      a: { en: "Measure first: top patterns and services by volume. Then drop pure noise (health checks, debug), convert count-only logs to metrics, keep 100% errors but sample successful request logs per trace (1-10%), tier retention (hot 7-14d, cold object storage), and consider cheaper storage (Loki/object store) for high-volume low-value streams. Enforce it with collector-level rules so it doesn't regress.", he: "קודם מודדים: ה-patterns והשירותים הכי גדולים בנפח. אחר כך זורקים רעש טהור (health checks, debug), ממירים לוגים שרק סופרים ל-metrics, שומרים 100% errors אבל עושים sampling ללוגי requests מוצלחים לפי trace (1-10%), retention בשכבות (hot 7-14 יום, cold ב-object storage), ושוקלים אחסון זול יותר (Loki/object store) לזרמים עם הרבה נפח ומעט ערך. אוכפים את זה בחוקים ב-collector כדי שזה לא יחזור." }
    },
    {
      q: { en: "What's a correlation ID and how do you make sure it's everywhere?", he: "מה זה correlation ID ואיך מוודאים שהוא בכל מקום?" },
      a: { en: "A unique ID for one request, generated at the edge and propagated via headers (ideally W3C traceparent) to all downstream services and async messages. You guarantee coverage by storing it in request-scoped context and injecting it automatically through logging middleware/MDC and HTTP/queue client interceptors — never relying on developers to pass it manually.", he: "ID ייחודי ל-request אחד, שנוצר בכניסה ומועבר דרך headers (רצוי W3C traceparent) לכל השירותים downstream ולהודעות אסינכרוניות. מבטיחים כיסוי כששומרים אותו ב-context ברמת ה-request ומזריקים אותו אוטומטית דרך middleware של לוגים/MDC ו-interceptors של HTTP/queue clients – בלי להסתמך על כך שמפתחים יעבירו אותו ידנית." }
    }
  ],
  quiz: [
    {
      q: { en: "Which log line is best for production querying?", he: "איזו שורת לוג הכי טובה לשאילתות בפרודקשן?" },
      options: [
        { en: "ERROR: Payment failed for user 8812 after 842ms", he: "ERROR: Payment failed for user 8812 after 842ms" },
        { en: "{\"level\":\"error\",\"msg\":\"payment failed\",\"user_id\":\"u_8812\",\"latency_ms\":842,\"trace_id\":\"4bf9...\"}", he: "{\"level\":\"error\",\"msg\":\"payment failed\",\"user_id\":\"u_8812\",\"latency_ms\":842,\"trace_id\":\"4bf9...\"}" },
        { en: "{\"level\":\"error\",\"msg\":\"Payment failed for user 8812 after 842ms\"}", he: "{\"level\":\"error\",\"msg\":\"Payment failed for user 8812 after 842ms\"}" },
        { en: "{\"level\":\"error\",\"request\":{...full request with headers...}}", he: "{\"level\":\"error\",\"request\":{...full request with headers...}}" }
      ],
      answer: 1,
      explain: { en: "Constant message, variables as fields, and a trace_id. Option 3 is JSON but still buries data in the message; option 4 leaks headers.", he: "הודעה קבועה, משתנים כשדות, ו-trace_id. אופציה 3 היא JSON אבל עדיין קוברת מידע בתוך ההודעה; אופציה 4 מדליפה headers." }
    },
    {
      q: { en: "Your log agent keeps logs only in memory. The backend is down for 20 minutes. What happens?", he: "ה-log agent שלכם מחזיק לוגים רק בזיכרון. ה-backend למטה 20 דקות. מה קורה?" },
      options: [
        { en: "Logs are dropped or the agent gets OOMKilled", he: "לוגים נזרקים או שה-agent חוטף OOMKill" },
        { en: "Kubernetes automatically re-sends them later", he: "Kubernetes שולח אותם מחדש אוטומטית אחר כך" },
        { en: "The app blocks until the backend is back", he: "האפליקציה נחסמת עד שה-backend חוזר" },
        { en: "Nothing — stdout is persisted forever on the node", he: "כלום – stdout נשמר לנצח על ה-node" }
      ],
      answer: 0,
      explain: { en: "Without a disk buffer the agent can't hold 20 minutes of logs. Node log files are rotated (often ~10MB per container), so they're not a long-term safety net either.", he: "בלי buffer על דיסק ה-agent לא יכול להחזיק 20 דקות של לוגים. קבצי הלוג על ה-node עוברים rotation (לרוב ~10MB לקונטיינר), אז גם הם לא רשת ביטחון לטווח ארוך." }
    },
    {
      q: { en: "You need to keep log costs down but still debug failures. Best sampling strategy?", he: "צריך להוריד עלויות לוגים אבל עדיין לדבג כשלים. מה אסטרטגיית ה-sampling הכי טובה?" },
      options: [
        { en: "Randomly keep 10% of all lines", he: "לשמור באקראי 10% מכל השורות" },
        { en: "Keep only ERROR lines, drop everything else forever", he: "לשמור רק שורות ERROR ולזרוק את כל השאר לתמיד" },
        { en: "Keep all errors/warnings, sample successful requests by trace ID", he: "לשמור את כל ה-errors/warnings, ולעשות sampling ל-requests מוצלחים לפי trace ID" },
        { en: "Lower retention to 1 day", he: "להוריד retention ליום אחד" }
      ],
      answer: 2,
      explain: { en: "Failures are rare and precious — keep them all. Sampling by trace ID keeps complete request stories instead of random fragments.", he: "כשלים נדירים ויקרים – שומרים את כולם. Sampling לפי trace ID שומר סיפורים שלמים של requests במקום שברים אקראיים." }
    }
  ],
  related: ["obs-traces", "obs-intro", "k8s-debugging", "rel-incident-management"]
});

window.INFRA.lessons.push({
  id: "obs-traces",
  track: "observability",
  order: 4,
  icon: "🧵",
  level: 3,
  minutes: 13,
  title: { en: "Distributed Tracing & OpenTelemetry", he: "Distributed Tracing ו-OpenTelemetry" },
  tldr: {
    en: "A trace is a tree of timed spans for one request across services, stitched together by a propagated traceparent header; OpenTelemetry is the vendor-neutral standard to produce and ship them.",
    he: "Trace הוא עץ של spans עם זמנים עבור request אחד בין שירותים, שנתפר ביחד בעזרת header של traceparent שמועבר הלאה; OpenTelemetry הוא הסטנדרט הניטרלי לייצר ולשלוח אותם."
  },
  analogy: {
    en: "A trace is a parcel tracking page. The package (request) gets one tracking number (trace ID). Every warehouse it passes (service) adds a scan with arrival and departure times (span). When the parcel is 3 days late you don't call every warehouse — you open the tracking page and see it sat in the Ashdod hub for 2.5 days. The traceparent header is the barcode sticker: if one warehouse peels it off, the trail goes cold.",
    he: "Trace זה דף מעקב משלוח. החבילה (request) מקבלת מספר מעקב אחד (trace ID). כל מחסן שהיא עוברת בו (service) מוסיף סריקה עם זמן הגעה ויציאה (span). כשהחבילה מאחרת ב-3 ימים לא מתקשרים לכל מחסן – פותחים את דף המעקב ורואים שהיא ישבה במרכז הלוגיסטי באשדוד יומיים וחצי. ה-header של traceparent הוא מדבקת הברקוד: אם מחסן אחד מקלף אותה, השובל נעלם."
  },
  sections: [
    {
      h: { en: "Traces and spans", he: "Traces ו-spans" },
      body: {
        en: `<p>A <strong>span</strong> is one unit of work: name, start time, duration, status, attributes, and a parent. A <strong>trace</strong> is all spans sharing one trace ID, forming a tree.</p>
<pre>span: name="POST /checkout"  service=api-gateway
      trace_id=4bf92f3577b34da6a3ce929d0e0e4736  span_id=00f067aa0ba902b7  parent=none
      start=09:14:03.100  duration=2.41s  status=OK
      attributes: http.request.method=POST, http.route=/checkout,
                  http.response.status_code=200, user.tier=gold</pre>
<p>Span kinds: <code>SERVER</code> (handling an incoming request), <code>CLIENT</code> (outgoing call), <code>PRODUCER</code>/<code>CONSUMER</code> (messaging), <code>INTERNAL</code>. A client span in service A and the server span in service B for the same call both exist — the gap between them is network + queueing time.</p>
<p>Spans also carry <strong>events</strong> (timestamped notes like "exception thrown" with stack trace) and <strong>links</strong> (to other traces, e.g. a batch consumer processing 100 messages from 100 different traces).</p>
<blockquote>💡 Real world: attributes are where high cardinality is welcome — <code>user.id</code>, <code>order.id</code>, <code>tenant</code>, <code>feature_flag.variant</code>. That's exactly what lets you answer "is it slow only for tenant X?".</blockquote>`,
        he: `<p><strong>Span</strong> הוא יחידת עבודה אחת: שם, זמן התחלה, משך, סטטוס, attributes, ו-parent. <strong>Trace</strong> הוא כל ה-spans שחולקים trace ID אחד, ויוצרים עץ.</p>
<pre>span: name="POST /checkout"  service=api-gateway
      trace_id=4bf92f3577b34da6a3ce929d0e0e4736  span_id=00f067aa0ba902b7  parent=none
      start=09:14:03.100  duration=2.41s  status=OK
      attributes: http.request.method=POST, http.route=/checkout,
                  http.response.status_code=200, user.tier=gold</pre>
<p>סוגי span: <code>SERVER</code> (טיפול ב-request נכנס), <code>CLIENT</code> (קריאה יוצאת), <code>PRODUCER</code>/<code>CONSUMER</code> (messaging), <code>INTERNAL</code>. לאותה קריאה קיימים גם client span בשירות A וגם server span בשירות B – הפער ביניהם הוא זמן רשת + המתנה בתור.</p>
<p>Spans נושאים גם <strong>events</strong> (הערות עם timestamp כמו "exception thrown" עם stack trace) ו-<strong>links</strong> (ל-traces אחרים, למשל consumer שמעבד batch של 100 הודעות מ-100 traces שונים).</p>
<blockquote>💡 מהשטח: ב-attributes high cardinality זה דבר מבורך – <code>user.id</code>, <code>order.id</code>, <code>tenant</code>, <code>feature_flag.variant</code>. זה בדיוק מה שמאפשר לענות על "זה איטי רק ל-tenant X?".</blockquote>`
      }
    },
    {
      h: { en: "Context propagation: the traceparent header", he: "Context propagation: ה-header של traceparent" },
      body: {
        en: `<p>Tracing only works if every hop passes the context along. The W3C Trace Context standard defines:</p>
<pre>traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             |  |                                |                '- flags (01 = sampled)
             |  |                                '- parent span id (16 hex)
             |  '- trace id (32 hex, same for the whole request)
             '- version
tracestate: vendor-specific key=values (optional)
baggage: tenant=acme,region=eu   (W3C Baggage: app-level key/values)</pre>
<p>Service A receives the header, creates a child span, and when it calls service B it sends a <em>new</em> traceparent with the same trace ID but its own span ID as parent. OpenTelemetry auto-instrumentation does this for HTTP and gRPC clients/servers.</p>
<p>Where it breaks: async boundaries. Kafka/SQS/RabbitMQ messages need the context injected into message headers/attributes; thread pools and callbacks need the context carried over; a proxy or legacy service that drops unknown headers severs the trace into two orphans.</p>
<blockquote>⚠️ Production tip: if your traces look "short" (gateway span with no children) the propagation is broken somewhere. Check that every service uses the same propagator (W3C tracecontext, not a mix of B3 and W3C).</blockquote>`,
        he: `<p>Tracing עובד רק אם כל hop מעביר את ה-context הלאה. הסטנדרט W3C Trace Context מגדיר:</p>
<pre>traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             |  |                                |                '- flags (01 = sampled)
             |  |                                '- parent span id (16 hex)
             |  '- trace id (32 hex, same for the whole request)
             '- version
tracestate: vendor-specific key=values (optional)
baggage: tenant=acme,region=eu   (W3C Baggage: app-level key/values)</pre>
<p>שירות A מקבל את ה-header, יוצר child span, וכשהוא קורא לשירות B הוא שולח traceparent <em>חדש</em> עם אותו trace ID אבל עם ה-span ID שלו בתור parent. ה-auto-instrumentation של OpenTelemetry עושה את זה ל-HTTP ול-gRPC בצד הלקוח והשרת.</p>
<p>איפה זה נשבר: גבולות אסינכרוניים. הודעות Kafka/SQS/RabbitMQ צריכות שיזריקו את ה-context ל-headers/attributes של ההודעה; thread pools ו-callbacks צריכים להעביר את ה-context; proxy או שירות legacy שזורק headers לא מוכרים חותך את ה-trace לשני יתומים.</p>
<blockquote>⚠️ טיפ לפרודקשן: אם ה-traces שלכם נראים "קצרים" (span של gateway בלי ילדים) ה-propagation שבור איפשהו. תבדקו שכל השירותים משתמשים באותו propagator (W3C tracecontext, לא ערבוב של B3 ו-W3C).</blockquote>`
      }
    },
    {
      h: { en: "Reading a waterfall", he: "איך קוראים waterfall" },
      body: {
        en: `<pre>POST /checkout (gateway)          |==========================================| 2410ms
  auth.verify (auth)               |==|                                         80ms
  GET /cart (cart)                    |====|                                    150ms
    redis GET cart:u_8812               |=|                                      4ms
  POST /charge (payments)                  |==============================|   1900ms
    SELECT coupons (postgres)              |===========================|      1750ms  &lt;-- !
    stripe.charge (HTTP)                                               |==|    140ms
  kafka.produce order.created                                              |  12ms</pre>
<p>How to read it:</p>
<ul>
<li><strong>Find the critical path</strong>: the chain of spans that determines total duration. Here: gateway → payments → the coupons query.</li>
<li><strong>Self time vs child time</strong>: payments took 1900ms but 1750ms is the SQL child — payments itself is innocent.</li>
<li><strong>Sequential vs parallel</strong>: auth and cart run one after another; if independent, running them in parallel saves 80ms.</li>
<li><strong>Gaps</strong>: empty space inside a parent with no child span = un-instrumented work, GC pauses, or waiting on a lock/connection pool.</li>
<li><strong>N+1 pattern</strong>: 200 tiny identical DB spans in a row = a loop doing one query per item.</li>
</ul>
<blockquote>💡 Real world: the most common trace finding isn't an exotic bug — it's an N+1 query or a sequential chain of calls that could be parallel. Traces make them impossible to miss.</blockquote>`,
        he: `<pre>POST /checkout (gateway)          |==========================================| 2410ms
  auth.verify (auth)               |==|                                         80ms
  GET /cart (cart)                    |====|                                    150ms
    redis GET cart:u_8812               |=|                                      4ms
  POST /charge (payments)                  |==============================|   1900ms
    SELECT coupons (postgres)              |===========================|      1750ms  &lt;-- !
    stripe.charge (HTTP)                                               |==|    140ms
  kafka.produce order.created                                              |  12ms</pre>
<p>איך קוראים את זה:</p>
<ul>
<li><strong>מוצאים את ה-critical path</strong>: שרשרת ה-spans שקובעת את המשך הכולל. כאן: gateway ← payments ← שאילתת ה-coupons.</li>
<li><strong>Self time מול child time</strong>: payments לקח 1900ms אבל 1750ms מזה זה ה-SQL שמתחתיו – payments עצמו חף מפשע.</li>
<li><strong>סדרתי מול מקבילי</strong>: auth ו-cart רצים אחד אחרי השני; אם הם בלתי תלויים, הרצה במקביל חוסכת 80ms.</li>
<li><strong>חורים</strong>: רווח ריק בתוך parent בלי child span = עבודה בלי instrumentation, GC pauses, או המתנה ל-lock/connection pool.</li>
<li><strong>תבנית N+1</strong>: 200 spans זהים וקטנים של DB ברצף = לולאה שעושה שאילתה לכל פריט.</li>
</ul>
<blockquote>💡 מהשטח: הממצא הכי נפוץ ב-traces הוא לא באג אקזוטי – זו שאילתת N+1 או שרשרת קריאות סדרתית שיכלה להיות מקבילית. Traces הופכים אותן לבלתי אפשריות לפספס.</blockquote>`
      }
    },
    {
      h: { en: "Sampling: head vs tail", he: "Sampling: head מול tail" },
      body: {
        en: `<p>At 10,000 req/s with 30 spans each, keeping everything is 300k spans/s — expensive. So we sample.</p>
<p><strong>Head sampling</strong>: the decision is made at the root when the trace starts (e.g. keep 5% by trace-ID ratio) and propagated via the <code>01</code> flag so all services agree. Cheap and simple, but blind: it decides <em>before</em> knowing if the request will fail or be slow — so 95% of your errors are thrown away.</p>
<p><strong>Tail sampling</strong>: keep everything briefly, decide <em>after</em> the trace completes. Done in the OTel Collector:</p>
<pre>processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: keep-errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: keep-slow
        type: latency
        latency: { threshold_ms: 2000 }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }</pre>
<p>Cost: the collector must buffer all spans of a trace in memory, and all spans of one trace must reach the <em>same</em> collector instance (use a load-balancing exporter keyed by trace ID).</p>
<blockquote>⚠️ Production tip: compute RED metrics from spans <em>before</em> sampling (e.g. the spanmetrics connector), otherwise your request rates and error rates will be off by 20x.</blockquote>`,
        he: `<p>ב-10,000 requests לשנייה עם 30 spans לכל אחד, לשמור הכל זה 300 אלף spans לשנייה – יקר. אז עושים sampling.</p>
<p><strong>Head sampling</strong>: ההחלטה מתקבלת ב-root כשה-trace מתחיל (למשל לשמור 5% לפי יחס של trace ID) ומועברת דרך ה-flag <code>01</code> כדי שכל השירותים יסכימו. זול ופשוט, אבל עיוור: הוא מחליט <em>לפני</em> שידוע אם ה-request ייכשל או יהיה איטי – אז 95% מה-errors שלך נזרקים לפח.</p>
<p><strong>Tail sampling</strong>: שומרים הכל לזמן קצר ומחליטים <em>אחרי</em> שה-trace הסתיים. נעשה ב-OTel Collector:</p>
<pre>processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: keep-errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: keep-slow
        type: latency
        latency: { threshold_ms: 2000 }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }</pre>
<p>המחיר: ה-collector צריך להחזיק בזיכרון את כל ה-spans של trace, וכל ה-spans של trace אחד חייבים להגיע ל<em>אותו</em> instance של collector (משתמשים ב-load-balancing exporter לפי trace ID).</p>
<blockquote>⚠️ טיפ לפרודקשן: תחשבו RED metrics מתוך ה-spans <em>לפני</em> ה-sampling (למשל עם ה-spanmetrics connector), אחרת ה-request rate וה-error rate שלכם יהיו מוטים פי 20.</blockquote>`
      }
    },
    {
      h: { en: "OpenTelemetry: SDK, Collector, OTLP", he: "OpenTelemetry: SDK, Collector, OTLP" },
      body: {
        en: `<p><strong>OpenTelemetry (OTel)</strong> is the CNCF standard for producing telemetry — traces, metrics and logs — independent of the backend.</p>
<ul>
<li><strong>API + SDK</strong>: libraries per language. <strong>Auto-instrumentation</strong> (Java agent, Python <code>opentelemetry-instrument</code>, .NET, Node) patches HTTP servers/clients, DB drivers, Kafka clients — traces with zero code changes. Add manual spans for business logic.</li>
<li><strong>OTLP</strong>: the wire protocol. gRPC on port <strong>4317</strong>, HTTP/protobuf on <strong>4318</strong>.</li>
<li><strong>Collector</strong>: a pipeline of <em>receivers → processors → exporters</em>. Usually an agent per node plus a gateway tier. It batches, retries, redacts, tail-samples and fans out to Tempo/Jaeger/Datadog/whatever.</li>
<li><strong>Semantic conventions</strong>: standard attribute names (<code>http.request.method</code>, <code>db.system</code>, <code>service.name</code>) so dashboards work across languages and vendors.</li>
</ul>
<pre>export OTEL_SERVICE_NAME=checkout
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
export OTEL_TRACES_SAMPLER=parentbased_traceidratio
export OTEL_TRACES_SAMPLER_ARG=0.1
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod,service.version=2.3.1</pre>
<blockquote>💡 Real world: <code>parentbased_*</code> samplers respect the upstream decision. Without it, each service flips its own coin and you get traces with random holes in them.</blockquote>`,
        he: `<p><strong>OpenTelemetry (OTel)</strong> הוא הסטנדרט של CNCF לייצור telemetry – traces, metrics ולוגים – בלי תלות ב-backend.</p>
<ul>
<li><strong>API + SDK</strong>: ספריות לכל שפה. <strong>Auto-instrumentation</strong> (Java agent, בפייתון <code>opentelemetry-instrument</code>, .NET, Node) מתקן בזמן ריצה שרתי/לקוחות HTTP, דרייברים של DB, לקוחות Kafka – traces בלי לשנות שורת קוד. מוסיפים spans ידניים ללוגיקה העסקית.</li>
<li><strong>OTLP</strong>: פרוטוקול התקשורת. gRPC בפורט <strong>4317</strong>, HTTP/protobuf בפורט <strong>4318</strong>.</li>
<li><strong>Collector</strong>: pipeline של <em>receivers ← processors ← exporters</em>. בדרך כלל agent על כל node ועוד שכבת gateway. עושה batching, retries, redaction, tail sampling ומפזר ל-Tempo/Jaeger/Datadog/מה שרוצים.</li>
<li><strong>Semantic conventions</strong>: שמות attributes סטנדרטיים (<code>http.request.method</code>, <code>db.system</code>, <code>service.name</code>) כדי שדשבורדים יעבדו בין שפות וספקים.</li>
</ul>
<pre>export OTEL_SERVICE_NAME=checkout
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
export OTEL_TRACES_SAMPLER=parentbased_traceidratio
export OTEL_TRACES_SAMPLER_ARG=0.1
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod,service.version=2.3.1</pre>
<blockquote>💡 מהשטח: samplers מסוג <code>parentbased_*</code> מכבדים את ההחלטה מ-upstream. בלי זה, כל שירות מטיל מטבע משלו ומקבלים traces עם חורים אקראיים.</blockquote>`
      }
    },
    {
      h: { en: "Exemplars: from a metric spike to the exact trace", he: "Exemplars: מקפיצה ב-metric ישר ל-trace המדויק" },
      body: {
        en: `<p>Metrics tell you "p99 jumped to 4s at 02:47". Traces hold the details. <strong>Exemplars</strong> bridge them: when the SDK records a latency observation into a histogram bucket, it attaches a sample trace ID to that bucket.</p>
<pre>http_request_duration_seconds_bucket{le="5",route="/checkout"} 10442 # {trace_id="4bf92f3577b34da6a3ce929d0e0e4736"} 3.81 1731402423.1</pre>
<p>In Grafana, exemplars appear as dots on the latency graph; click a dot in the spike → you're in Tempo/Jaeger looking at a real 3.81s request from that exact minute. No guessing which trace to open.</p>
<p>Requirements: OpenMetrics exposition format, Prometheus started with <code>--enable-feature=exemplar-storage</code> (or a backend that supports them, like Mimir), and an SDK that records exemplars when a span is active (OTel does by default for sampled spans).</p>
<blockquote>💡 Real world: the full loop is metrics → (exemplar) → trace → (trace_id) → logs, plus trace → (span metrics) → metrics. Grafana calls this "correlations"; Datadog does it automatically. Once you've used it, grepping logs by timestamp feels like the stone age.</blockquote>`,
        he: `<p>Metrics אומרים לך "ה-p99 קפץ ל-4 שניות ב-02:47". ה-traces מחזיקים את הפרטים. <strong>Exemplars</strong> מגשרים ביניהם: כשה-SDK רושם תצפית latency לתוך bucket של histogram, הוא מצמיד ל-bucket הזה trace ID לדוגמה.</p>
<pre>http_request_duration_seconds_bucket{le="5",route="/checkout"} 10442 # {trace_id="4bf92f3577b34da6a3ce929d0e0e4736"} 3.81 1731402423.1</pre>
<p>ב-Grafana ה-exemplars מופיעים כנקודות על גרף ה-latency; לוחצים על נקודה בתוך הקפיצה ← אתם ב-Tempo/Jaeger מסתכלים על request אמיתי של 3.81 שניות מאותה דקה בדיוק. בלי לנחש איזה trace לפתוח.</p>
<p>דרישות: פורמט חשיפה OpenMetrics, Prometheus שעלה עם <code>--enable-feature=exemplar-storage</code> (או backend שתומך בזה, כמו Mimir), ו-SDK שרושם exemplars כשיש span פעיל (OTel עושה את זה כברירת מחדל ל-spans שנבחרו ב-sampling).</p>
<blockquote>💡 מהשטח: הלולאה המלאה היא metrics ← (exemplar) ← trace ← (trace_id) ← logs, ועוד trace ← (span metrics) ← metrics. ב-Grafana זה נקרא "correlations"; Datadog עושה את זה אוטומטית. אחרי שמשתמשים בזה פעם אחת, לחפש בלוגים לפי timestamp מרגיש כמו תקופת האבן.</blockquote>`
      }
    }
  ],
  diagram: `[svc A + OTel SDK] --traceparent--> [svc B + OTel SDK] --kafka hdr--> [svc C]
        |  OTLP :4317                |                              |
        v                            v                              v
   [OTel Collector agent per node] -> [Collector gateway: tail_sampling, batch]
                                            -> Tempo / Jaeger / Datadog
                                            -> spanmetrics -> Prometheus (exemplars -> trace)`,
  handsOn: [
    { cmd: "docker run -d --name jaeger -p 16686:16686 -p 4317:4317 -p 4318:4318 jaegertracing/all-in-one:latest", what: { en: "Run Jaeger with an OTLP receiver; UI at http://localhost:16686.", he: "מריצים Jaeger עם OTLP receiver; ה-UI ב-http://localhost:16686." } },
    { cmd: "pip install opentelemetry-distro opentelemetry-exporter-otlp && opentelemetry-bootstrap -a install", what: { en: "Install Python OTel auto-instrumentation for whatever libraries (Flask, requests, psycopg) you have installed.", he: "מתקינים auto-instrumentation של OTel לפייתון לכל הספריות שמותקנות אצלכם (Flask, requests, psycopg)." } },
    { cmd: "OTEL_SERVICE_NAME=demo OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 opentelemetry-instrument python app.py", what: { en: "Run your app with zero code changes, hit a few endpoints, then find the traces in Jaeger.", he: "מריצים את האפליקציה בלי לשנות קוד, שולחים כמה requests, ומוצאים את ה-traces ב-Jaeger." } },
    { cmd: "curl -H 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' http://localhost:5000/", what: { en: "Inject your own trace context and search Jaeger for trace ID 4bf92f... — proof that propagation works.", he: "מזריקים trace context משלכם ומחפשים ב-Jaeger את ה-trace ID 4bf92f... – הוכחה שה-propagation עובד." } }
  ],
  mnemonic: {
    en: "\"One trace, many spans, one barcode passed hand to hand.\" traceparent = Version-Trace-Parent-Flags: \"Very Tired Parcels Fly.\" Head decides blind; Tail decides with hindsight.",
    he: "\"Trace אחד, הרבה spans, ברקוד אחד שעובר מיד ליד.\" traceparent = Version-Trace-Parent-Flags. Head מחליט בעיניים עצומות; Tail מחליט בדיעבד."
  },
  pitfalls: [
    { en: "Broken propagation across queues or a header-stripping proxy — you get two orphan traces instead of one story.", he: "Propagation שבור דרך תורים או proxy שמוריד headers – מקבלים שני traces יתומים במקום סיפור אחד." },
    { en: "Head sampling at 1% and then wondering why you can never find the trace of the failed request.", he: "Head sampling של 1% ואז לתהות למה אף פעם לא מוצאים את ה-trace של ה-request שנכשל." },
    { en: "Computing request/error rates from sampled traces — numbers are off by the sampling factor. Derive metrics before sampling.", he: "לחשב request/error rates מתוך traces אחרי sampling – המספרים מוטים לפי יחס ה-sampling. מפיקים metrics לפני ה-sampling." },
    { en: "Inconsistent service.name values ('checkout', 'checkout-svc', 'Checkout') splitting one service into three in the UI.", he: "ערכי service.name לא עקביים ('checkout', 'checkout-svc', 'Checkout') שמפצלים שירות אחד לשלושה ב-UI." }
  ],
  interview: [
    {
      q: { en: "Head vs tail sampling — trade-offs?", he: "Head מול tail sampling – מה ה-trade-offs?" },
      a: { en: "Head sampling decides at trace start, propagates the decision, and is cheap and stateless — but can't prefer errors or slow requests since the outcome is unknown. Tail sampling decides after the trace completes, so you can keep 100% of errors and slow traces plus a baseline — but the collector must buffer full traces in memory and route all spans of a trace to the same instance, which adds cost and complexity. Many teams combine: light head sampling to cap volume, tail sampling for smart selection.", he: "Head sampling מחליט בתחילת ה-trace, מעביר את ההחלטה הלאה, זול ו-stateless – אבל לא יכול להעדיף errors או requests איטיים כי התוצאה עוד לא ידועה. Tail sampling מחליט אחרי שה-trace הסתיים, אז אפשר לשמור 100% מה-errors וה-traces האיטיים ועוד baseline – אבל ה-collector צריך להחזיק traces שלמים בזיכרון ולנתב את כל ה-spans של trace לאותו instance, מה שמוסיף עלות ומורכבות. הרבה צוותים משלבים: head sampling קל כדי להגביל נפח, ו-tail sampling לבחירה חכמה." }
    },
    {
      q: { en: "How does a trace survive a hop through Kafka?", he: "איך trace שורד מעבר דרך Kafka?" },
      a: { en: "The producer's instrumentation injects the trace context (traceparent) into the Kafka record headers and creates a PRODUCER span. The consumer extracts it and creates a CONSUMER span — either as a child or, for batch consumption, with span links to each message's context. OTel's Kafka instrumentations do this automatically; custom consumers must call the propagator's extract explicitly.", he: "ה-instrumentation של ה-producer מזריק את ה-trace context (traceparent) ל-headers של רשומת Kafka ויוצר PRODUCER span. ה-consumer מחלץ אותו ויוצר CONSUMER span – כ-child, או במקרה של צריכה ב-batch, עם span links ל-context של כל הודעה. ה-instrumentations של OTel ל-Kafka עושים את זה אוטומטית; consumers מותאמים אישית חייבים לקרוא ל-extract של ה-propagator במפורש." }
    }
  ],
  quiz: [
    {
      q: { en: "In 'traceparent: 00-4bf92f...4736-00f067aa0ba902b7-01', what is 00f067aa0ba902b7?", he: "ב-'traceparent: 00-4bf92f...4736-00f067aa0ba902b7-01', מה זה 00f067aa0ba902b7?" },
      options: [
        { en: "The trace ID", he: "ה-trace ID" },
        { en: "The sampling flag", he: "ה-flag של ה-sampling" },
        { en: "The parent span ID of the caller", he: "ה-span ID של ה-parent (מי שקרא)" },
        { en: "The tenant ID from baggage", he: "ה-tenant ID מתוך ה-baggage" }
      ],
      answer: 2,
      explain: { en: "Format is version-traceid(32 hex)-parentid(16 hex)-flags. The 16-hex field is the caller's span ID.", he: "הפורמט הוא version-traceid(32 hex)-parentid(16 hex)-flags. השדה של 16 תווי hex הוא ה-span ID של מי שקרא." }
    },
    {
      q: { en: "You want to keep every error trace but only 5% of successful ones. What do you need?", he: "רוצים לשמור כל trace של error אבל רק 5% מהמוצלחים. מה צריך?" },
      options: [
        { en: "Head sampling at 5%", he: "Head sampling של 5%" },
        { en: "Tail sampling in the Collector", he: "Tail sampling ב-Collector" },
        { en: "A higher OTLP batch size", he: "Batch size גדול יותר ב-OTLP" },
        { en: "Exemplars", he: "Exemplars" }
      ],
      answer: 1,
      explain: { en: "Only tail sampling sees the outcome (status, latency) before deciding. Head sampling at 5% would discard 95% of errors too.", he: "רק tail sampling רואה את התוצאה (סטטוס, latency) לפני שהוא מחליט. Head sampling של 5% יזרוק גם 95% מה-errors." }
    },
    {
      q: { en: "A waterfall shows payments=1900ms with a 1750ms SELECT child span. Where should you focus?", he: "ה-waterfall מראה payments=1900ms עם child span של SELECT שלוקח 1750ms. במה כדאי להתמקד?" },
      options: [
        { en: "The SQL query (indexes, plan, locks)", he: "שאילתת ה-SQL (אינדקסים, plan, locks)" },
        { en: "Payments service CPU", he: "ה-CPU של שירות ה-payments" },
        { en: "The gateway's timeout settings", he: "הגדרות ה-timeout של ה-gateway" },
        { en: "Network between gateway and payments", he: "הרשת בין ה-gateway ל-payments" }
      ],
      answer: 0,
      explain: { en: "Payments' self time is only ~150ms; the critical path runs through the query. Fix the query, not the service.", he: "ה-self time של payments הוא רק ~150ms; ה-critical path עובר דרך השאילתה. מתקנים את השאילתה, לא את השירות." }
    },
    {
      q: { en: "What lets you click a dot on a latency graph and land on a specific trace?", he: "מה מאפשר ללחוץ על נקודה בגרף latency ולנחות על trace ספציפי?" },
      options: [
        { en: "Baggage", he: "Baggage" },
        { en: "Span links", he: "Span links" },
        { en: "Log correlation IDs", he: "Correlation IDs בלוגים" },
        { en: "Exemplars", he: "Exemplars" }
      ],
      answer: 3,
      explain: { en: "Exemplars attach sample trace IDs to histogram buckets, so metric points link directly to traces.", he: "Exemplars מצמידים trace IDs לדוגמה ל-buckets של histogram, כך שנקודות ב-metric מקושרות ישירות ל-traces." }
    }
  ],
  related: ["obs-logs", "obs-metrics", "obs-intro"]
});

window.INFRA.lessons.push({
  id: "obs-golden-signals",
  track: "observability",
  order: 5,
  icon: "🥇",
  level: 2,
  minutes: 10,
  title: { en: "Golden Signals, RED & USE", he: "Golden Signals, RED ו-USE" },
  tldr: {
    en: "For any user-facing service watch Latency, Traffic, Errors and Saturation; use RED (Rate, Errors, Duration) for services and USE (Utilization, Saturation, Errors) for resources.",
    he: "לכל שירות שפונה למשתמשים עוקבים אחרי Latency, Traffic, Errors ו-Saturation; משתמשים ב-RED (Rate, Errors, Duration) לשירותים וב-USE (Utilization, Saturation, Errors) למשאבים."
  },
  analogy: {
    en: "Think of a restaurant. Latency: how long until food reaches the table. Traffic: how many customers walk in per hour. Errors: how many dishes are sent back. Saturation: how full the kitchen is — when every burner is on and orders pile up on the rail, latency is about to explode even though nothing has 'failed' yet. RED is the waiter's view (orders, complaints, wait time); USE is the chef's view of each burner and oven.",
    he: "תחשבו על מסעדה. Latency: כמה זמן עד שהאוכל מגיע לשולחן. Traffic: כמה לקוחות נכנסים בשעה. Errors: כמה מנות חוזרות למטבח. Saturation: כמה המטבח מלא – כשכל הלהבות דולקות וההזמנות נערמות על המסילה, ה-latency עומד להתפוצץ למרות שעוד כלום לא 'נכשל'. RED זו נקודת המבט של המלצר (הזמנות, תלונות, זמן המתנה); USE זו נקודת המבט של השף על כל להבה ותנור."
  },
  sections: [
    {
      h: { en: "The four golden signals", he: "ארבעת ה-golden signals" },
      body: {
        en: `<p>From Google's SRE book: if you can only measure four things about a user-facing system, measure these.</p>
<ul>
<li><strong>Latency</strong> — time to serve a request, as percentiles (p50/p95/p99). Separate successful from failed latency: a 500 returned in 2ms makes your latency look <em>better</em> while users suffer.</li>
<li><strong>Traffic</strong> — demand: requests/s, messages/s, concurrent sessions, transactions/s. Context for everything else (errors at 10 req/s ≠ errors at 10k req/s).</li>
<li><strong>Errors</strong> — rate of failed requests: explicit (5xx), implicit (200 with wrong content), and policy (succeeded but slower than 1s = failure by SLO).</li>
<li><strong>Saturation</strong> — how "full" the most constrained resource is: CPU throttling, memory near limit, thread/connection pool usage, queue depth, disk I/O wait. It's the <em>leading</em> indicator: it rises before latency and errors do.</li>
</ul>
<blockquote>💡 Real world: most incidents show up first in saturation (pool at 100%, queue growing), then in latency, and finally in errors. Watching only errors means you're always the last to know.</blockquote>`,
        he: `<p>מתוך ספר ה-SRE של Google: אם אפשר למדוד רק ארבעה דברים במערכת שפונה למשתמשים, תמדדו את אלה.</p>
<ul>
<li><strong>Latency</strong> – זמן טיפול ב-request, באחוזונים (p50/p95/p99). מפרידים בין latency של הצלחות לשל כשלונות: 500 שחוזר תוך 2ms גורם ל-latency להיראות <em>טוב יותר</em> בזמן שהמשתמשים סובלים.</li>
<li><strong>Traffic</strong> – הביקוש: requests לשנייה, הודעות לשנייה, sessions במקביל, טרנזקציות לשנייה. נותן הקשר לכל השאר (errors ב-10 req/s זה לא כמו errors ב-10 אלף).</li>
<li><strong>Errors</strong> – קצב ה-requests שנכשלו: מפורשים (5xx), מרומזים (200 עם תוכן שגוי), ולפי מדיניות (הצליח אבל לקח יותר משנייה = כשל לפי ה-SLO).</li>
<li><strong>Saturation</strong> – כמה "מלא" המשאב הכי מוגבל: CPU throttling, זיכרון קרוב ל-limit, ניצולת thread/connection pool, עומק תור, I/O wait בדיסק. זה ה-indicator ה<em>מקדים</em>: הוא עולה לפני ש-latency ו-errors עולים.</li>
</ul>
<blockquote>💡 מהשטח: רוב התקלות מופיעות קודם ב-saturation (pool ב-100%, תור שגדל), אחר כך ב-latency, ורק בסוף ב-errors. מי שמסתכל רק על errors תמיד יודע אחרון.</blockquote>`
      }
    },
    {
      h: { en: "RED for services", he: "RED לשירותים" },
      body: {
        en: `<p><strong>RED</strong> (Tom Wilkie) is golden signals trimmed for request-driven microservices: <strong>R</strong>ate, <strong>E</strong>rrors, <strong>D</strong>uration. Every service gets the same three panels, so any engineer can read any service's dashboard.</p>
<pre># Rate: requests per second per route
sum by (route) (rate(http_requests_total{service="checkout"}[5m]))

# Errors: fraction of 5xx
sum(rate(http_requests_total{service="checkout", code=~"5.."}[5m]))
  / sum(rate(http_requests_total{service="checkout"}[5m]))

# Duration: p99 per route
histogram_quantile(0.99, sum by (le, route)
  (rate(http_request_duration_seconds_bucket{service="checkout"}[5m])))</pre>
<p>RED works for anything request-shaped: HTTP, gRPC, a Kafka consumer (rate = messages processed/s, errors = failed/DLQ'd messages, duration = processing time per message). For consumers, add <strong>lag</strong> — it's their saturation.</p>
<blockquote>⚠️ Production tip: 4xx are usually the client's fault and shouldn't page you — but a sudden spike of 401/403 after a deploy is very much your fault. Track 4xx separately rather than ignoring them.</blockquote>`,
        he: `<p><strong>RED</strong> (של Tom Wilkie) זה golden signals מצומצם ל-microservices שמונעים על ידי requests: <strong>R</strong>ate, <strong>E</strong>rrors, <strong>D</strong>uration. כל שירות מקבל את אותם שלושה פאנלים, כך שכל מהנדס יכול לקרוא את הדשבורד של כל שירות.</p>
<pre># Rate: requests per second per route
sum by (route) (rate(http_requests_total{service="checkout"}[5m]))

# Errors: fraction of 5xx
sum(rate(http_requests_total{service="checkout", code=~"5.."}[5m]))
  / sum(rate(http_requests_total{service="checkout"}[5m]))

# Duration: p99 per route
histogram_quantile(0.99, sum by (le, route)
  (rate(http_request_duration_seconds_bucket{service="checkout"}[5m])))</pre>
<p>RED עובד לכל דבר בצורת request: HTTP, gRPC, Kafka consumer (rate = הודעות שעובדו לשנייה, errors = הודעות שנכשלו/הלכו ל-DLQ, duration = זמן עיבוד להודעה). ל-consumers מוסיפים <strong>lag</strong> – זה ה-saturation שלהם.</p>
<blockquote>⚠️ טיפ לפרודקשן: 4xx הם בדרך כלל אשמת הלקוח ולא צריכים להעיר אתכם – אבל קפיצה פתאומית של 401/403 אחרי deploy היא בהחלט אשמתכם. תעקבו אחרי 4xx בנפרד במקום להתעלם מהם.</blockquote>`
      }
    },
    {
      h: { en: "USE for resources", he: "USE למשאבים" },
      body: {
        en: `<p><strong>USE</strong> (Brendan Gregg): for every resource — CPU, memory, disk, network, connection pools — check <strong>U</strong>tilization (% busy), <strong>S</strong>aturation (queued work it can't serve yet), <strong>E</strong>rrors.</p>
<table>
<tr><th>Resource</th><th>Utilization</th><th>Saturation</th><th>Errors</th></tr>
<tr><td>CPU</td><td><code>1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))</code></td><td>run-queue / load per core, PSI, container throttling</td><td>rare (MCE)</td></tr>
<tr><td>Memory</td><td>working set / limit</td><td>swapping, major page faults, OOMKills</td><td>OOM events</td></tr>
<tr><td>Disk</td><td><code>rate(node_disk_io_time_seconds_total[5m])</code></td><td>I/O queue length, iowait</td><td>device errors</td></tr>
<tr><td>Network</td><td>bytes/s vs link speed</td><td>drops, retransmits</td><td>interface errors</td></tr>
<tr><td>DB pool</td><td>active / max connections</td><td>threads waiting for a connection</td><td>acquire timeouts</td></tr>
</table>
<pre># Container CPU throttling ratio (saturation that "100% CPU" never shows)
sum by (pod) (rate(container_cpu_cfs_throttled_periods_total[5m]))
  / sum by (pod) (rate(container_cpu_cfs_periods_total[5m]))</pre>
<blockquote>💡 Real world: utilization can lie. A pod at 40% average CPU can be throttled 30% of the time because it bursts within 100ms CFS periods. Saturation metrics (throttling, PSI) catch what utilization averages smooth away.</blockquote>`,
        he: `<p><strong>USE</strong> (של Brendan Gregg): לכל משאב – CPU, זיכרון, דיסק, רשת, connection pools – בודקים <strong>U</strong>tilization (אחוז עסוק), <strong>S</strong>aturation (עבודה שממתינה בתור ועוד לא קיבלה שירות), <strong>E</strong>rrors.</p>
<table>
<tr><th>משאב</th><th>Utilization</th><th>Saturation</th><th>Errors</th></tr>
<tr><td>CPU</td><td><code>1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))</code></td><td>run-queue / load לכל core, PSI, throttling של קונטיינרים</td><td>נדיר (MCE)</td></tr>
<tr><td>זיכרון</td><td>working set / limit</td><td>swap, major page faults, OOMKills</td><td>אירועי OOM</td></tr>
<tr><td>דיסק</td><td><code>rate(node_disk_io_time_seconds_total[5m])</code></td><td>אורך תור I/O, iowait</td><td>שגיאות התקן</td></tr>
<tr><td>רשת</td><td>bytes/s מול מהירות הקו</td><td>drops, retransmits</td><td>שגיאות interface</td></tr>
<tr><td>DB pool</td><td>חיבורים פעילים / מקסימום</td><td>threads שמחכים לחיבור</td><td>acquire timeouts</td></tr>
</table>
<pre># Container CPU throttling ratio (saturation that "100% CPU" never shows)
sum by (pod) (rate(container_cpu_cfs_throttled_periods_total[5m]))
  / sum by (pod) (rate(container_cpu_cfs_periods_total[5m]))</pre>
<blockquote>💡 מהשטח: utilization יכול לשקר. פוד עם 40% CPU בממוצע יכול להיות ב-throttling ב-30% מהזמן כי הוא עושה bursts בתוך תקופות CFS של 100ms. מדדי saturation (throttling, PSI) תופסים את מה שממוצעי utilization מחליקים.</blockquote>`
      }
    },
    {
      h: { en: "Putting it together: which method when?", he: "לחבר הכל: איזו שיטה מתי?" },
      body: {
        en: `<p>Use them as layers, top-down:</p>
<ol>
<li><strong>Golden signals / SLO</strong> at the user edge (load balancer, API gateway): "are users hurting?" This is what pages.</li>
<li><strong>RED per service</strong>: "which service is hurting, and on which route?"</li>
<li><strong>USE per resource</strong> behind that service: "why — what's exhausted?" CPU throttling, DB pool, disk, a downstream's rate limit.</li>
</ol>
<p>Example: p99 on <code>/checkout</code> jumps (golden). RED shows <code>payments</code> duration up but its rate is flat (not a traffic spike). USE on payments shows the DB connection pool at 50/50 with 120 threads waiting — saturation. Root cause: a slow query holding connections longer. Three hops, five minutes.</p>
<blockquote>⚠️ Production tip: watch traffic and latency together. Latency rising with traffic = capacity problem (scale). Latency rising with <em>flat</em> traffic = something got slower (deploy, dependency, data growth) — scaling out may make it worse by adding more DB connections.</blockquote>`,
        he: `<p>משתמשים בהן כשכבות, מלמעלה למטה:</p>
<ol>
<li><strong>Golden signals / SLO</strong> בקצה של המשתמש (load balancer, API gateway): "המשתמשים סובלים?" זה מה שמעיר אנשים.</li>
<li><strong>RED לכל שירות</strong>: "איזה שירות סובל, ובאיזה route?"</li>
<li><strong>USE לכל משאב</strong> מאחורי השירות: "למה – מה נגמר?" CPU throttling, DB pool, דיסק, rate limit של dependency.</li>
</ol>
<p>דוגמה: ה-p99 של <code>/checkout</code> קופץ (golden). RED מראה שה-duration של <code>payments</code> עלה אבל ה-rate שלו שטוח (זה לא קפיצת traffic). USE על payments מראה שה-connection pool ל-DB ב-50/50 עם 120 threads שמחכים – saturation. סיבת שורש: שאילתה איטית שמחזיקה חיבורים יותר זמן. שלושה צעדים, חמש דקות.</p>
<blockquote>⚠️ טיפ לפרודקשן: תסתכלו על traffic ו-latency ביחד. Latency שעולה יחד עם traffic = בעיית קיבולת (scale). Latency שעולה כשה-traffic <em>שטוח</em> = משהו נהיה איטי (deploy, dependency, גידול בדאטה) – scale out עלול רק להחמיר כי הוא מוסיף עוד חיבורים ל-DB.</blockquote>`
      }
    }
  ],
  diagram: `          USERS
            |
   [Golden signals @ edge: Latency, Traffic, Errors, Saturation]  <- pages
            |
   [RED per service: Rate, Errors, Duration]                       <- which service/route
            |
   [USE per resource: Utilization, Saturation, Errors]             <- why (CPU, pool, disk)`,
  handsOn: [
    { cmd: "docker run -d --name node-exporter -p 9100:9100 prom/node-exporter", what: { en: "Run node_exporter to get USE metrics for your machine (node_cpu_seconds_total, node_disk_*, node_pressure_*).", he: "מריצים node_exporter כדי לקבל מדדי USE למכונה (node_cpu_seconds_total, node_disk_*, node_pressure_*)." } },
    { cmd: "curl -s localhost:9100/metrics | grep -E '^node_(load1|pressure_cpu)'", what: { en: "See load average and PSI (pressure stall information) — direct saturation signals.", he: "רואים load average ו-PSI (pressure stall information) – סיגנלים ישירים של saturation." } },
    { cmd: "kubectl top pods -n prod --sort-by=cpu", what: { en: "Quick utilization view per pod; compare with throttling metrics to see where 'low CPU' still means saturated.", he: "מבט מהיר על utilization לכל פוד; משווים עם מדדי throttling כדי לראות איפה 'CPU נמוך' עדיין אומר saturation." } }
  ],
  mnemonic: {
    en: "Golden signals = \"LETS\" go: Latency, Errors, Traffic, Saturation. Services are RED (Rate, Errors, Duration); resources get USEd (Utilization, Saturation, Errors). RED for the waiter, USE for the kitchen.",
    he: "Golden signals = \"LETS\" go: Latency, Errors, Traffic, Saturation. שירותים הם RED (Rate, Errors, Duration); משאבים עושים בהם USE (Utilization, Saturation, Errors). RED למלצר, USE למטבח."
  },
  pitfalls: [
    { en: "Mixing failed and successful latency — fast errors make p99 look better during an outage.", he: "לערבב latency של הצלחות וכשלונות – errors מהירים גורמים ל-p99 להיראות טוב יותר באמצע תקלה." },
    { en: "Watching CPU utilization only. Throttling, pool exhaustion and queue depth are saturation signals that utilization hides.", he: "להסתכל רק על CPU utilization. Throttling, מיצוי pool ועומק תור הם סיגנלים של saturation ש-utilization מסתיר." },
    { en: "Reading error rate without traffic: 50% errors on 2 requests at 4 AM is not the same incident as 5% on 10k req/s.", he: "לקרוא error rate בלי traffic: 50% errors על 2 requests ב-4 לפנות בוקר זו לא אותה תקלה כמו 5% על 10 אלף req/s." }
  ],
  interview: [
    {
      q: { en: "What's the difference between RED and USE, and when do you use each?", he: "מה ההבדל בין RED ל-USE, ומתי משתמשים בכל אחת?" },
      a: { en: "RED (Rate, Errors, Duration) describes a request-driven service from the caller's perspective — what users experience. USE (Utilization, Saturation, Errors) describes a resource (CPU, disk, pool) — whether it's the bottleneck. Use RED to find which service is unhealthy, then USE on that service's resources to find why.", he: "RED (Rate, Errors, Duration) מתאר שירות מבוסס requests מנקודת המבט של מי שקורא לו – מה המשתמשים חווים. USE (Utilization, Saturation, Errors) מתאר משאב (CPU, דיסק, pool) – האם הוא צוואר הבקבוק. משתמשים ב-RED כדי למצוא איזה שירות לא בריא, ואז ב-USE על המשאבים של השירות הזה כדי להבין למה." }
    },
    {
      q: { en: "Why is saturation called a leading indicator?", he: "למה saturation נקרא indicator מקדים?" },
      a: { en: "Because queues fill before requests fail. When a pool, CPU or queue nears capacity, work starts waiting — latency rises first, and errors (timeouts) come later. Alerting or autoscaling on saturation buys time to act before users see errors.", he: "כי תורים מתמלאים לפני ש-requests נכשלים. כש-pool, CPU או תור מתקרבים לקיבולת, עבודה מתחילה לחכות – קודם עולה ה-latency, וה-errors (timeouts) מגיעים אחר כך. Alerting או autoscaling על saturation קונה זמן לפעול לפני שמשתמשים רואים errors." }
    }
  ],
  quiz: [
    {
      q: { en: "Which is NOT one of the four golden signals?", he: "מה מהבאים הוא לא אחד מארבעת ה-golden signals?" },
      options: [
        { en: "Saturation", he: "Saturation" },
        { en: "Traffic", he: "Traffic" },
        { en: "Availability", he: "Availability" },
        { en: "Latency", he: "Latency" }
      ],
      answer: 2,
      explain: { en: "The four are Latency, Traffic, Errors, Saturation. Availability is derived from errors (and usually expressed as an SLO).", he: "הארבעה הם Latency, Traffic, Errors, Saturation. Availability נגזר מה-errors (ובדרך כלל מבוטא כ-SLO)." }
    },
    {
      q: { en: "A pod shows 40% average CPU but p99 latency is bad. Which USE signal should you check?", he: "פוד מראה 40% CPU בממוצע אבל ה-p99 latency גרוע. איזה סיגנל USE לבדוק?" },
      options: [
        { en: "CPU throttling ratio (saturation)", he: "יחס CPU throttling (saturation)" },
        { en: "Disk utilization", he: "Disk utilization" },
        { en: "Network interface errors", he: "שגיאות interface ברשת" },
        { en: "Request rate", he: "Request rate" }
      ],
      answer: 0,
      explain: { en: "Bursty workloads hit the CFS quota within 100ms periods; average utilization hides it, throttling reveals it.", he: "עומסים עם bursts נתקעים ב-CFS quota בתוך תקופות של 100ms; ה-utilization הממוצע מסתיר את זה, ה-throttling חושף." }
    },
    {
      q: { en: "Latency rises while traffic is flat. Most likely?", he: "ה-latency עולה בזמן שה-traffic שטוח. מה הכי סביר?" },
      options: [
        { en: "Need to scale out — more traffic than capacity", he: "צריך scale out – יש יותר traffic מקיבולת" },
        { en: "The monitoring system is broken", he: "מערכת הניטור שבורה" },
        { en: "Users have a slower internet connection", he: "למשתמשים יש אינטרנט איטי יותר" },
        { en: "Something got slower: a deploy, a dependency, or data growth", he: "משהו נהיה איטי: deploy, dependency, או גידול בדאטה" }
      ],
      answer: 3,
      explain: { en: "Same demand, slower service = a change in the system, not in load. Scaling out may not help and can overload shared dependencies.", he: "אותו ביקוש, שירות איטי יותר = שינוי במערכת, לא בעומס. Scale out עלול לא לעזור ואפילו להעמיס dependencies משותפים." }
    }
  ],
  related: ["obs-metrics", "obs-alerting", "obs-dashboards", "cpu", "memory", "rel-sli-slo-sla"]
});

window.INFRA.lessons.push({
  id: "obs-alerting",
  track: "observability",
  order: 6,
  icon: "🚨",
  level: 3,
  minutes: 13,
  title: { en: "Alerting Without Burning Out", he: "Alerting בלי לשרוף את הצוות" },
  tldr: {
    en: "Page only on user-visible symptoms that need a human now (ideally SLO burn rate), route everything else to tickets, attach a runbook to every alert, and treat alert noise as a bug.",
    he: "מעירים רק על סימפטומים שהמשתמשים רואים ושדורשים בן אדם עכשיו (רצוי SLO burn rate), כל השאר הולך לטיקטים, לכל alert מצמידים runbook, ומתייחסים לרעש ב-alerts כמו לבאג."
  },
  analogy: {
    en: "A good alert is a smoke detector: it goes off when there's actual smoke in the room, not when the oven is warm. A bad alerting setup is a car alarm in a parking lot — it goes off so often that everyone ignores it, including on the day someone actually steals the car. And a page without a runbook is a fire alarm in a building with no exit signs.",
    he: "Alert טוב הוא גלאי עשן: הוא מצפצף כשיש עשן אמיתי בחדר, לא כשהתנור חם. מערך alerting גרוע הוא אזעקת רכב בחניון – היא מצפצפת כל כך הרבה שכולם מתעלמים, כולל ביום שבאמת גונבים את האוטו. ו-page בלי runbook זו אזעקת אש בבניין בלי שלטי יציאה."
  },
  sections: [
    {
      h: { en: "Symptoms, not causes", he: "סימפטומים, לא סיבות" },
      body: {
        en: `<p><strong>Cause-based alerts</strong>: "CPU &gt; 80%", "pod restarted", "disk 75%", "replica lag &gt; 5s". They fire constantly while users are fine, and stay silent for failures nobody predicted.</p>
<p><strong>Symptom-based alerts</strong>: "checkout error rate is eating the error budget", "p99 of /search &gt; 1s for 10 minutes", "no orders processed in 15 minutes". They fire when <em>users</em> are hurting, regardless of the cause — including causes you never imagined.</p>
<p>Causes still matter — as <strong>dashboard panels and tickets</strong>, and as the investigation path after a symptom fires. A few causes deserve proactive alerts because they predict an outage with long lead time and no symptom yet: disk will be full in 4 hours (<code>predict_linear(node_filesystem_avail_bytes[6h], 4*3600) &lt; 0</code>), TLS cert expires in 14 days, backups failed.</p>
<blockquote>💡 Real world: teams that delete most of their cause-based pages and replace them with SLO alerts typically see <em>fewer</em> pages and <em>faster</em> detection of real incidents. Noise doesn't make you safer; it makes you slower.</blockquote>`,
        he: `<p><strong>Alerts מבוססי סיבה</strong>: "CPU מעל 80%", "פוד עשה ריסטארט", "דיסק ב-75%", "replica lag מעל 5 שניות". הם קופצים כל הזמן בזמן שלמשתמשים הכל בסדר, ושותקים בכשלים שאף אחד לא צפה.</p>
<p><strong>Alerts מבוססי סימפטום</strong>: "ה-error rate של checkout אוכל את ה-error budget", "p99 של /search מעל שנייה במשך 10 דקות", "אף הזמנה לא עובדה ב-15 דקות". הם קופצים כש<em>המשתמשים</em> סובלים, לא משנה מה הסיבה – כולל סיבות שלא דמיינתם.</p>
<p>הסיבות עדיין חשובות – כ<strong>פאנלים בדשבורד וכטיקטים</strong>, וכמסלול החקירה אחרי שסימפטום קפץ. כמה סיבות כן מצדיקות alert יזום כי הן חוזות תקלה עם זמן התראה ארוך ועוד בלי סימפטום: הדיסק יתמלא בעוד 4 שעות (<code>predict_linear(node_filesystem_avail_bytes[6h], 4*3600) &lt; 0</code>), תעודת TLS פגה בעוד 14 יום, גיבויים נכשלו.</p>
<blockquote>💡 מהשטח: צוותים שמוחקים את רוב ה-pages מבוססי הסיבה ומחליפים אותם ב-SLO alerts בדרך כלל רואים <em>פחות</em> pages וזיהוי <em>מהיר</em> יותר של תקלות אמיתיות. רעש לא הופך אתכם בטוחים יותר; הוא הופך אתכם איטיים יותר.</blockquote>`
      }
    },
    {
      h: { en: "Page vs ticket, alert fatigue & runbooks", he: "Page מול טיקט, alert fatigue ו-runbooks" },
      body: {
        en: `<p>Every alert must pass the test: <strong>is it urgent, actionable, and user-impacting?</strong></p>
<ul>
<li><strong>Page</strong> (PagerDuty/Opsgenie, wakes a human): users are affected now or will be within hours, and a human must act. Target: fewer than ~2 pages per on-call shift.</li>
<li><strong>Ticket</strong> (Jira/Slack channel, next business day): slow budget burn, cert expiring in 14 days, one replica down of three.</li>
<li><strong>Nothing / dashboard only</strong>: informational. If nobody acts on it, delete the alert.</li>
</ul>
<p><strong>Alert fatigue</strong> is when people get so many non-actionable alerts that they ack without reading. It's how real incidents get missed. Measure it: pages per week, % of pages with no action taken, % auto-resolved within 5 minutes (flapping).</p>
<p>Every page needs a <strong>runbook link</strong> in its annotations: what this alert means, the dashboard to open, the first 3 checks, how to mitigate (rollback, scale, failover), who to escalate to.</p>
<pre>annotations:
  summary: "checkout is burning its 30d error budget 14x faster than allowed"
  runbook_url: "https://wiki.example.com/runbooks/checkout-slo-burn"
  dashboard: "https://grafana.example.com/d/checkout-slo"</pre>
<blockquote>⚠️ Production tip: hold a weekly 15-minute alert review. For each page ask "was it actionable?" If not, tune it, downgrade to ticket, or delete it. Alerts rot like code.</blockquote>`,
        he: `<p>כל alert חייב לעבור את המבחן: <strong>האם הוא דחוף, ניתן לפעולה, ומשפיע על משתמשים?</strong></p>
<ul>
<li><strong>Page</strong> (PagerDuty/Opsgenie, מעיר בן אדם): משתמשים מושפעים עכשיו או יושפעו תוך שעות, ובן אדם חייב לפעול. יעד: פחות מ-~2 pages למשמרת on-call.</li>
<li><strong>טיקט</strong> (Jira/ערוץ Slack, יום העבודה הבא): שריפת budget איטית, תעודה שפגה בעוד 14 יום, replica אחת מתוך שלוש למטה.</li>
<li><strong>כלום / רק דשבורד</strong>: אינפורמטיבי. אם אף אחד לא פועל בעקבותיו, מוחקים את ה-alert.</li>
</ul>
<p><strong>Alert fatigue</strong> זה כשאנשים מקבלים כל כך הרבה alerts לא רלוונטיים שהם עושים ack בלי לקרוא. ככה מפספסים תקלות אמיתיות. מודדים את זה: pages בשבוע, אחוז ה-pages שלא נעשתה בעקבותיהם שום פעולה, אחוז שנפתרו לבד תוך 5 דקות (flapping).</p>
<p>לכל page צריך <strong>קישור ל-runbook</strong> ב-annotations: מה ה-alert אומר, איזה דשבורד לפתוח, 3 הבדיקות הראשונות, איך עושים mitigation (rollback, scale, failover), ולמי עושים escalation.</p>
<pre>annotations:
  summary: "checkout is burning its 30d error budget 14x faster than allowed"
  runbook_url: "https://wiki.example.com/runbooks/checkout-slo-burn"
  dashboard: "https://grafana.example.com/d/checkout-slo"</pre>
<blockquote>⚠️ טיפ לפרודקשן: תקיימו סקירת alerts שבועית של 15 דקות. על כל page שואלים "היה אפשר לפעול בעקבותיו?" אם לא – מכווננים, מורידים לטיקט, או מוחקים. Alerts נרקבים כמו קוד.</blockquote>`
      }
    },
    {
      h: { en: "Multi-window, multi-burn-rate SLO alerts", he: "SLO alerts עם כמה חלונות וכמה burn rates" },
      body: {
        en: `<p>SLO 99.9% over 30 days → error budget = 0.1% of requests (~43 minutes of full outage). <strong>Burn rate</strong> = how fast you consume it: burn rate 1 uses exactly the budget in 30 days; burn rate 14.4 uses <strong>2% of the monthly budget in 1 hour</strong> (14.4 × 1h / 720h).</p>
<table>
<tr><th>Severity</th><th>Burn rate</th><th>Long window</th><th>Short window</th><th>Budget consumed</th></tr>
<tr><td>Page</td><td>14.4</td><td>1h</td><td>5m</td><td>2%</td></tr>
<tr><td>Page</td><td>6</td><td>6h</td><td>30m</td><td>5%</td></tr>
<tr><td>Ticket</td><td>1</td><td>3d</td><td>6h</td><td>10%</td></tr>
</table>
<p>Why two windows? The <strong>long window</strong> proves the problem is significant (no paging for a 30-second blip). The <strong>short window</strong> proves it's <em>still happening</em>, so the alert resets quickly after you fix it instead of firing for another hour.</p>
<pre>- alert: CheckoutErrorBudgetFastBurn
  expr: |
    (
      sum(rate(http_requests_total{service="checkout",code=~"5.."}[1h]))
        / sum(rate(http_requests_total{service="checkout"}[1h])) &gt; (14.4 * 0.001)
    )
    and
    (
      sum(rate(http_requests_total{service="checkout",code=~"5.."}[5m]))
        / sum(rate(http_requests_total{service="checkout"}[5m])) &gt; (14.4 * 0.001)
    )
  for: 2m
  labels:
    severity: page
    team: payments</pre>
<blockquote>💡 Real world: tools like Sloth or Pyrra generate these rules (with recording rules for efficiency) from a short SLO spec. Don't hand-write 12 PromQL expressions per service.</blockquote>`,
        he: `<p>SLO של 99.9% על 30 יום ← error budget = 0.1% מה-requests (~43 דקות של השבתה מלאה). <strong>Burn rate</strong> = כמה מהר שורפים אותו: burn rate של 1 מנצל בדיוק את ה-budget ב-30 יום; burn rate של 14.4 מנצל <strong>2% מה-budget החודשי בשעה אחת</strong> (14.4 × 1h / 720h).</p>
<table>
<tr><th>חומרה</th><th>Burn rate</th><th>חלון ארוך</th><th>חלון קצר</th><th>Budget שנוצל</th></tr>
<tr><td>Page</td><td>14.4</td><td>1h</td><td>5m</td><td>2%</td></tr>
<tr><td>Page</td><td>6</td><td>6h</td><td>30m</td><td>5%</td></tr>
<tr><td>טיקט</td><td>1</td><td>3d</td><td>6h</td><td>10%</td></tr>
</table>
<p>למה שני חלונות? ה<strong>חלון הארוך</strong> מוכיח שהבעיה משמעותית (לא מעירים על blip של 30 שניות). ה<strong>חלון הקצר</strong> מוכיח שזה <em>עדיין קורה</em>, כך שה-alert מתאפס מהר אחרי שתיקנתם במקום להמשיך לצפצף עוד שעה.</p>
<pre>- alert: CheckoutErrorBudgetFastBurn
  expr: |
    (
      sum(rate(http_requests_total{service="checkout",code=~"5.."}[1h]))
        / sum(rate(http_requests_total{service="checkout"}[1h])) &gt; (14.4 * 0.001)
    )
    and
    (
      sum(rate(http_requests_total{service="checkout",code=~"5.."}[5m]))
        / sum(rate(http_requests_total{service="checkout"}[5m])) &gt; (14.4 * 0.001)
    )
  for: 2m
  labels:
    severity: page
    team: payments</pre>
<blockquote>💡 מהשטח: כלים כמו Sloth או Pyrra מייצרים את החוקים האלה (כולל recording rules ליעילות) מתוך הגדרת SLO קצרה. אל תכתבו ידנית 12 ביטויי PromQL לכל שירות.</blockquote>`
      }
    },
    {
      h: { en: "Alertmanager: routing, grouping, inhibition, silences", he: "Alertmanager: routing, grouping, inhibition, silences" },
      body: {
        en: `<p>Prometheus evaluates rules; <strong>Alertmanager</strong> decides who gets told, how, and how often.</p>
<pre>route:
  receiver: slack-default
  group_by: [alertname, service]
  group_wait: 30s        # wait to batch related alerts into one notification
  group_interval: 5m     # min time between updates for the same group
  repeat_interval: 4h    # re-notify if still firing
  routes:
    - matchers: [severity="page"]
      receiver: pagerduty-oncall
    - matchers: [team="data"]
      receiver: slack-data-team

inhibit_rules:
  - source_matchers: [alertname="ClusterUnreachable"]
    target_matchers: [severity=~"warning|page"]
    equal: [cluster]</pre>
<ul>
<li><strong>Grouping</strong>: 200 pods failing → one notification "200 alerts for service=checkout", not 200 phone calls.</li>
<li><strong>Inhibition</strong>: if the whole cluster is unreachable, suppress the 300 downstream alerts it caused.</li>
<li><strong>Silences</strong>: temporary mutes for planned maintenance or a known issue: <code>amtool silence add service=checkout --duration=2h --comment="DB migration, ticket OPS-412"</code>. Always set an expiry and a comment.</li>
</ul>
<blockquote>⚠️ Production tip: Alertmanager itself can fail silently. Add a "Watchdog" / dead man's switch alert that always fires and is sent to an external service (e.g. healthchecks.io, PagerDuty heartbeat) which pages you when it <em>stops</em> arriving.</blockquote>`,
        he: `<p>Prometheus מעריך את החוקים; <strong>Alertmanager</strong> מחליט למי להודיע, איך, וכמה פעמים.</p>
<pre>route:
  receiver: slack-default
  group_by: [alertname, service]
  group_wait: 30s        # wait to batch related alerts into one notification
  group_interval: 5m     # min time between updates for the same group
  repeat_interval: 4h    # re-notify if still firing
  routes:
    - matchers: [severity="page"]
      receiver: pagerduty-oncall
    - matchers: [team="data"]
      receiver: slack-data-team

inhibit_rules:
  - source_matchers: [alertname="ClusterUnreachable"]
    target_matchers: [severity=~"warning|page"]
    equal: [cluster]</pre>
<ul>
<li><strong>Grouping</strong>: 200 פודים נופלים ← הודעה אחת "200 alerts עבור service=checkout", לא 200 שיחות טלפון.</li>
<li><strong>Inhibition</strong>: אם כל ה-cluster לא נגיש, משתיקים את 300 ה-alerts שנגרמו בעקבותיו.</li>
<li><strong>Silences</strong>: השתקה זמנית לתחזוקה מתוכננת או לבעיה ידועה: <code>amtool silence add service=checkout --duration=2h --comment="DB migration, ticket OPS-412"</code>. תמיד עם תפוגה ועם הערה.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: גם Alertmanager יכול ליפול בשקט. תוסיפו alert מסוג "Watchdog" / dead man's switch שתמיד דולק ונשלח לשירות חיצוני (למשל healthchecks.io, PagerDuty heartbeat) שמעיר אתכם כשהוא <em>מפסיק</em> להגיע.</blockquote>`
      }
    },
    {
      h: { en: "On-call hygiene", he: "היגיינת on-call" },
      body: {
        en: `<ul>
<li><strong>Sustainable rotation</strong>: at least 6-8 engineers per rotation so each person is on call ~1 week in 6-8. Follow-the-sun across time zones if you can — nobody should be paged at 3 AM every week.</li>
<li><strong>Clear escalation</strong>: primary → secondary after 5-10 minutes without ack → team lead/incident commander.</li>
<li><strong>Handoff</strong>: a short note at the end of each shift — what fired, what's still open, which silences are active.</li>
<li><strong>Every page gets a follow-up</strong>: fix the root cause, improve the runbook, or tune the alert. The goal is that the same page never surprises anyone twice.</li>
<li><strong>Protect the on-call person</strong>: lighter sprint load during on-call, comp time after a bad night, and blameless postmortems for anything significant.</li>
<li><strong>Test the pipeline</strong>: regularly fire a synthetic test page end-to-end. Discovering your PagerDuty integration key expired during a real outage is a classic.</li>
</ul>
<blockquote>💡 Real world: Google's SRE guideline is at most ~2 incidents per 12-hour shift; beyond that, quality of response drops and burnout climbs. If your rotation exceeds it, alert reduction is a top-priority engineering task, not a "nice to have".</blockquote>`,
        he: `<ul>
<li><strong>רוטציה בת-קיימא</strong>: לפחות 6-8 מהנדסים ברוטציה כך שכל אחד ב-on-call בערך שבוע מתוך 6-8. Follow-the-sun בין אזורי זמן אם אפשר – אף אחד לא אמור לקום ב-3 בלילה כל שבוע.</li>
<li><strong>Escalation ברור</strong>: primary ← secondary אחרי 5-10 דקות בלי ack ← ראש צוות/incident commander.</li>
<li><strong>Handoff</strong>: פתק קצר בסוף כל משמרת – מה קפץ, מה עדיין פתוח, אילו silences פעילים.</li>
<li><strong>כל page מקבל follow-up</strong>: מתקנים את סיבת השורש, משפרים את ה-runbook, או מכווננים את ה-alert. המטרה היא שאותו page לא יפתיע אף אחד פעמיים.</li>
<li><strong>שומרים על התורן</strong>: עומס ספרינט קל יותר בזמן on-call, יום חופש אחרי לילה רע, ו-postmortems בלי האשמות (blameless) על כל דבר משמעותי.</li>
<li><strong>בודקים את ה-pipeline</strong>: מדי פעם מקפיצים page סינתטי מקצה לקצה. לגלות שה-integration key של PagerDuty פג באמצע השבתה אמיתית – קלאסיקה.</li>
</ul>
<blockquote>💡 מהשטח: ההנחיה של Google SRE היא לכל היותר ~2 תקלות למשמרת של 12 שעות; מעבר לזה איכות התגובה יורדת וה-burnout מטפס. אם הרוטציה שלכם מעל זה, הפחתת alerts היא משימת הנדסה בעדיפות עליונה, לא "nice to have".</blockquote>`
      }
    }
  ],
  diagram: `Prometheus rules --firing--> Alertmanager
                               |-- group_by [alertname, service]
                               |-- inhibit (ClusterUnreachable mutes downstream)
                               |-- silences (maintenance, with expiry)
                               |-- route severity=page --> PagerDuty --> on-call (runbook link)
                               '-- route default      --> Slack / ticket`,
  handsOn: [
    { cmd: "promtool check rules slo-alerts.yaml", what: { en: "Validate alert rule syntax before deploying — broken rules fail silently otherwise.", he: "מאמתים את התחביר של חוקי ה-alert לפני deploy – אחרת חוקים שבורים נכשלים בשקט." } },
    { cmd: "amtool config routes test --config.file=alertmanager.yml severity=page team=payments service=checkout", what: { en: "See which receiver an alert with these labels would reach — test routing without waking anyone.", he: "רואים לאיזה receiver יגיע alert עם ה-labels האלה – בודקים routing בלי להעיר אף אחד." } },
    { cmd: "amtool silence add service=checkout --duration=2h --comment='DB migration OPS-412' --alertmanager.url=http://localhost:9093", what: { en: "Create a silence with an expiry and a reason; list them with 'amtool silence query'.", he: "יוצרים silence עם תפוגה וסיבה; רואים את כולם עם 'amtool silence query'." } },
    { cmd: "curl -s localhost:9090/api/v1/alerts | jq '.data.alerts[] | {name: .labels.alertname, state}'", what: { en: "List currently pending/firing alerts straight from Prometheus.", he: "רשימת ה-alerts שכרגע pending/firing ישירות מ-Prometheus." } }
  ],
  mnemonic: {
    en: "Page only if it's \"UAU\": Urgent, Actionable, User-impacting. Burn-rate cheat sheet: \"14.4 in an hour, 6 in six, 1 in three days — page, page, ticket.\" No runbook, no page.",
    he: "מעירים רק אם זה \"דנ\"מ\": דחוף, ניתן לפעולה, משפיע על משתמשים. שליף burn rate: \"14.4 בשעה, 6 בשש, 1 בשלושה ימים – page, page, טיקט.\" אין runbook – אין page."
  },
  pitfalls: [
    { en: "Paging on CPU > 80% or single pod restarts — fires constantly while users are fine, trains people to ignore pages.", he: "להעיר על CPU מעל 80% או ריסטארט של פוד בודד – קופץ כל הזמן כשלמשתמשים הכל בסדר, ומלמד אנשים להתעלם מ-pages." },
    { en: "Static thresholds with no 'for:' duration — every 20-second blip pages someone, then auto-resolves (flapping).", he: "ספים קבועים בלי 'for:' – כל blip של 20 שניות מעיר מישהו ואז נפתר לבד (flapping)." },
    { en: "Silences without expiry — the 'temporary' mute from March is still hiding a real outage in November.", he: "Silences בלי תפוגה – ההשתקה ה'זמנית' ממרץ עדיין מסתירה השבתה אמיתית בנובמבר." },
    { en: "No dead man's switch — when Prometheus or Alertmanager is down, silence looks like health.", he: "בלי dead man's switch – כש-Prometheus או Alertmanager למטה, שקט נראה כמו בריאות." }
  ],
  interview: [
    {
      q: { en: "Explain multi-window multi-burn-rate alerting.", he: "תסביר alerting עם multi-window multi-burn-rate." },
      a: { en: "You alert on how fast the error budget is being consumed rather than on a raw error threshold. Several tiers: e.g. 14.4x over 1h (2% of a 30-day budget) and 6x over 6h page; 1x over 3d opens a ticket. Each tier requires both a long window (significance, avoids blips) and a short window ~1/12 of it (still happening, fast reset). This gives fast detection of severe outages, catches slow burns, and drastically cuts false pages.", he: "עושים alert על כמה מהר ה-error budget נשרף במקום על סף error גולמי. כמה דרגות: למשל 14.4x על שעה (2% מ-budget של 30 יום) ו-6x על 6 שעות מעירים; 1x על 3 ימים פותח טיקט. כל דרגה דורשת גם חלון ארוך (משמעותיות, מונע blips) וגם חלון קצר של ~1/12 ממנו (עדיין קורה, איפוס מהיר). זה נותן זיהוי מהיר של השבתות חמורות, תופס שריפות איטיות, ומוריד דרמטית pages שקריים." }
    },
    {
      q: { en: "Your team gets 40 pages a week. What do you do?", he: "הצוות שלך מקבל 40 pages בשבוע. מה עושים?" },
      a: { en: "Pull the page history and classify each: actionable or not, user impact or not, duplicate/flapping. Delete or downgrade non-actionable ones to tickets, add 'for' durations and grouping/inhibition for storms, replace cause-based pages with SLO burn-rate alerts, and fix the top recurring root causes. Make it a tracked engineering goal (e.g. under 2 pages per shift) with a weekly alert review.", he: "מושכים את היסטוריית ה-pages ומסווגים כל אחד: ניתן לפעולה או לא, השפעה על משתמשים או לא, כפול/flapping. מוחקים או מורידים לטיקט את מה שלא ניתן לפעולה, מוסיפים 'for' ו-grouping/inhibition לסערות, מחליפים pages מבוססי סיבה ב-SLO burn-rate alerts, ומתקנים את סיבות השורש החוזרות הכי נפוצות. הופכים את זה ליעד הנדסי במעקב (למשל פחות מ-2 pages למשמרת) עם סקירת alerts שבועית." }
    }
  ],
  quiz: [
    {
      q: { en: "Which alert should page the on-call engineer at 3 AM?", he: "איזה alert צריך להעיר את התורן ב-3 בלילה?" },
      options: [
        { en: "Node CPU above 85% for 5 minutes", he: "CPU של node מעל 85% במשך 5 דקות" },
        { en: "One of 12 replicas restarted", he: "אחת מ-12 ה-replicas עשתה ריסטארט" },
        { en: "Checkout error budget burning at 14x over 1h and 5m", he: "ה-error budget של checkout נשרף פי 14 בחלון של שעה ו-5 דקות" },
        { en: "TLS certificate expires in 14 days", he: "תעודת TLS פגה בעוד 14 יום" }
      ],
      answer: 2,
      explain: { en: "Only the burn-rate alert is urgent, actionable and user-impacting. The cert is a ticket; CPU and one restart are causes that may not hurt anyone.", he: "רק ה-burn-rate alert דחוף, ניתן לפעולה ומשפיע על משתמשים. התעודה זה טיקט; CPU וריסטארט בודד הם סיבות שאולי לא פוגעות באף אחד." }
    },
    {
      q: { en: "With a 99.9% 30-day SLO, burn rate 14.4 sustained for 1 hour consumes roughly how much of the budget?", he: "עם SLO של 99.9% על 30 יום, burn rate של 14.4 לאורך שעה צורך בערך כמה מה-budget?" },
      options: [
        { en: "2%", he: "2%" },
        { en: "14.4%", he: "14.4%" },
        { en: "0.1%", he: "0.1%" },
        { en: "50%", he: "50%" }
      ],
      answer: 0,
      explain: { en: "14.4 × 1h / 720h ≈ 0.02 = 2% of the monthly budget.", he: "14.4 × 1h / 720h ≈ 0.02 = 2% מה-budget החודשי." }
    },
    {
      q: { en: "Why does a burn-rate alert use a short window in addition to the long one?", he: "למה burn-rate alert משתמש גם בחלון קצר בנוסף לארוך?" },
      options: [
        { en: "To reduce Prometheus CPU usage", he: "כדי להוריד את צריכת ה-CPU של Prometheus" },
        { en: "To confirm the problem is still ongoing so the alert resets quickly after a fix", he: "כדי לוודא שהבעיה עדיין קורה כך שה-alert יתאפס מהר אחרי תיקון" },
        { en: "To page twice as often", he: "כדי להעיר פי שניים" },
        { en: "Because the long window can't detect errors", he: "כי החלון הארוך לא מסוגל לזהות errors" }
      ],
      answer: 1,
      explain: { en: "The long window would keep firing for up to an hour after recovery; the short window stops the alert once errors actually stop.", he: "החלון הארוך היה ממשיך לצפצף עד שעה אחרי ההתאוששות; החלון הקצר מפסיק את ה-alert ברגע שה-errors באמת נעצרים." }
    },
    {
      q: { en: "The whole cluster is unreachable and 300 service alerts fire. Which Alertmanager feature should prevent the storm?", he: "כל ה-cluster לא נגיש ו-300 alerts של שירותים קופצים. איזה פיצ'ר של Alertmanager אמור למנוע את הסערה?" },
      options: [
        { en: "repeat_interval", he: "repeat_interval" },
        { en: "Silences", he: "Silences" },
        { en: "Receivers", he: "Receivers" },
        { en: "Inhibition rules", he: "Inhibition rules" }
      ],
      answer: 3,
      explain: { en: "Inhibition suppresses dependent alerts while a higher-level source alert (ClusterUnreachable) is firing. Silences are manual and time-boxed.", he: "Inhibition משתיק alerts תלויים כל עוד alert מקור ברמה גבוהה יותר (ClusterUnreachable) פעיל. Silences הם ידניים ומוגבלים בזמן." }
    }
  ],
  playground: "slo",
  related: ["rel-sli-slo-sla", "rel-error-budgets", "rel-incident-management", "obs-golden-signals", "obs-dashboards"]
});

window.INFRA.lessons.push({
  id: "obs-dashboards",
  track: "observability",
  order: 7,
  icon: "📊",
  level: 2,
  minutes: 10,
  title: { en: "Designing & Reading Dashboards", he: "לעצב ולקרוא דשבורדים" },
  tldr: {
    en: "A good dashboard tells a top-down story — SLO → golden signals → resources — answers one question per row, and gets you from 'something's wrong' to 'where' in under a minute.",
    he: "דשבורד טוב מספר סיפור מלמעלה למטה – SLO ← golden signals ← משאבים – עונה על שאלה אחת בכל שורה, ומביא אותך מ'משהו לא בסדר' ל'איפה' תוך פחות מדקה."
  },
  analogy: {
    en: "A dashboard is a newspaper front page, not a phone book. The headline (SLO: are users OK?) is huge at the top; below are the main stories (traffic, errors, latency); the small print (CPU per node, GC pauses) is on the inside pages you open only when a headline sends you there. A 'dashboard of dashboards' with 80 panels is a phone book: technically all the information is there, and nobody can find anything at 3 AM.",
    he: "דשבורד הוא עמוד ראשי של עיתון, לא ספר טלפונים. הכותרת הראשית (SLO: למשתמשים טוב?) ענקית למעלה; מתחתיה הכתבות המרכזיות (traffic, errors, latency); האותיות הקטנות (CPU לכל node, GC pauses) בעמודים הפנימיים שפותחים רק כשכותרת שולחת אותך לשם. 'דשבורד של דשבורדים' עם 80 פאנלים זה ספר טלפונים: טכנית כל המידע שם, ואף אחד לא מוצא כלום ב-3 בלילה."
  },
  sections: [
    {
      h: { en: "Top-down layout: SLO → golden signals → resources", he: "פריסה מלמעלה למטה: SLO ← golden signals ← משאבים" },
      body: {
        en: `<p>Design every service dashboard in the same order, so anyone can read any of them:</p>
<ol>
<li><strong>Row 1 — "Are users OK?"</strong>: SLO compliance (99.94% vs 99.9% target), error budget remaining (62%), current burn rate. Big stat panels, green/red.</li>
<li><strong>Row 2 — Golden signals / RED</strong>: traffic (req/s), error ratio, latency p50/p95/p99 — all on the same time axis, with deploy annotations.</li>
<li><strong>Row 3 — Dependencies</strong>: RED of downstream calls (DB, cache, payments API, Kafka lag).</li>
<li><strong>Row 4 — Resources (USE)</strong>: CPU + throttling, memory vs limit, pod restarts, connection pools, GC. Collapsed by default.</li>
</ol>
<p>Use template variables (<code>$service</code>, <code>$env</code>, <code>$region</code>) so one dashboard serves 40 services instead of 40 copy-pasted ones that drift apart. Define dashboards as code (Grafana JSON in git, Jsonnet/Grafonnet, Terraform) so they're reviewed and restorable.</p>
<blockquote>💡 Real world: the "5-second test" — a new on-call engineer opens the dashboard and within 5 seconds can say "healthy" or "not healthy". If they need to scroll or interpret 12 panels to know, the top row is wrong.</blockquote>`,
        he: `<p>מעצבים כל דשבורד שירות באותו סדר, כדי שכל אחד יוכל לקרוא כל דשבורד:</p>
<ol>
<li><strong>שורה 1 – "למשתמשים טוב?"</strong>: עמידה ב-SLO (99.94% מול יעד של 99.9%), כמה error budget נשאר (62%), ה-burn rate הנוכחי. פאנלים גדולים של stat, ירוק/אדום.</li>
<li><strong>שורה 2 – Golden signals / RED</strong>: traffic (req/s), יחס errors, latency p50/p95/p99 – הכל על אותו ציר זמן, עם annotations של deploys.</li>
<li><strong>שורה 3 – Dependencies</strong>: RED של קריאות downstream (DB, cache, API של תשלומים, Kafka lag).</li>
<li><strong>שורה 4 – משאבים (USE)</strong>: CPU + throttling, זיכרון מול limit, ריסטארטים של פודים, connection pools, GC. מקופל כברירת מחדל.</li>
</ol>
<p>משתמשים ב-template variables (<code>$service</code>, <code>$env</code>, <code>$region</code>) כדי שדשבורד אחד ישרת 40 שירותים במקום 40 העתקים שמתרחקים זה מזה. מגדירים דשבורדים כקוד (Grafana JSON ב-git, Jsonnet/Grafonnet, Terraform) כדי שיעברו review ויהיה אפשר לשחזר אותם.</p>
<blockquote>💡 מהשטח: "מבחן 5 השניות" – מהנדס on-call חדש פותח את הדשבורד ותוך 5 שניות יכול להגיד "בריא" או "לא בריא". אם הוא צריך לגלול או לפרש 12 פאנלים כדי לדעת, השורה העליונה לא נכונה.</blockquote>`
      }
    },
    {
      h: { en: "Choosing the right panel: heatmaps & friends", he: "לבחור את הפאנל הנכון: heatmaps וחברים" },
      body: {
        en: `<table>
<tr><th>Question</th><th>Panel</th></tr>
<tr><td>Is it OK right now?</td><td>Stat / gauge with thresholds (SLO %, budget left)</td></tr>
<tr><td>How does it change over time?</td><td>Time series (rates, ratios, percentiles)</td></tr>
<tr><td>What does the whole latency distribution look like?</td><td><strong>Heatmap</strong> of histogram buckets</td></tr>
<tr><td>Which pods/routes are worst?</td><td>Table or bar gauge with <code>topk(10, ...)</code></td></tr>
<tr><td>What happened and when?</td><td>Annotations (deploys, flags) + logs panel</td></tr>
</table>
<p>A <strong>latency heatmap</strong> plots time on X, latency buckets on Y, and color = number of requests. It shows things percentiles hide: <strong>bimodal</strong> distributions (two bands — e.g. cache hits at 5ms and misses at 300ms), a new band appearing after a deploy, or a slow "smear" upward as a pool saturates.</p>
<pre># Grafana heatmap query (format: Heatmap)
sum by (le) (increase(http_request_duration_seconds_bucket{service="$service"}[$__rate_interval]))</pre>
<blockquote>⚠️ Production tip: label units and keep Y-axes honest. A graph auto-scaled from 99.95% to 100% makes a 0.01% wobble look like a cliff. Set axis min/max for ratios and always show the SLO threshold as a line.</blockquote>`,
        he: `<table>
<tr><th>שאלה</th><th>פאנל</th></tr>
<tr><td>זה בסדר עכשיו?</td><td>Stat / gauge עם ספים (SLO %, budget שנשאר)</td></tr>
<tr><td>איך זה משתנה לאורך זמן?</td><td>Time series (rates, יחסים, אחוזונים)</td></tr>
<tr><td>איך נראית כל התפלגות ה-latency?</td><td><strong>Heatmap</strong> של buckets מה-histogram</td></tr>
<tr><td>אילו פודים/routes הכי גרועים?</td><td>טבלה או bar gauge עם <code>topk(10, ...)</code></td></tr>
<tr><td>מה קרה ומתי?</td><td>Annotations (deploys, flags) + פאנל לוגים</td></tr>
</table>
<p><strong>Heatmap של latency</strong> מציג זמן על ציר X, buckets של latency על ציר Y, והצבע = מספר ה-requests. הוא מראה דברים שאחוזונים מסתירים: התפלגות <strong>דו-שיאית</strong> (שתי רצועות – למשל cache hits ב-5ms ו-misses ב-300ms), רצועה חדשה שמופיעה אחרי deploy, או "מריחה" איטית כלפי מעלה כש-pool מגיע ל-saturation.</p>
<pre># Grafana heatmap query (format: Heatmap)
sum by (le) (increase(http_request_duration_seconds_bucket{service="$service"}[$__rate_interval]))</pre>
<blockquote>⚠️ טיפ לפרודקשן: תרשמו יחידות ותשמרו על צירי Y הוגנים. גרף עם auto-scale מ-99.95% ל-100% הופך תנודה של 0.01% למצוק. תקבעו min/max לצירים של יחסים ותמיד תציגו את סף ה-SLO כקו.</blockquote>`
      }
    },
    {
      h: { en: "Reading the patterns: saturation vs errors", he: "לקרוא את הדפוסים: saturation מול errors" },
      body: {
        en: `<table>
<tr><th>What you see</th><th>Likely story</th></tr>
<tr><td>Latency climbs slowly, then errors spike; traffic flat</td><td>Saturation: pool/queue filling until timeouts. Check USE on the service and its DB.</td></tr>
<tr><td>Latency and traffic rise together</td><td>Capacity: demand exceeds supply. Check autoscaling, limits.</td></tr>
<tr><td>Errors jump instantly, latency <em>drops</em></td><td>Fast-failing: bad deploy, dependency refusing connections, auth broken. Look at the deploy annotation.</td></tr>
<tr><td>Traffic drops sharply, errors 0</td><td>Requests aren't reaching you: DNS, LB, upstream outage. Silence is a symptom!</td></tr>
<tr><td>Sawtooth memory, restarts at each peak</td><td>Memory leak → OOMKill loop.</td></tr>
<tr><td>Spikes every hour on the hour</td><td>Cron job, cache expiry, batch import, or backups.</td></tr>
</table>
<p>Always compare against a baseline: Grafana's time shift (<code>offset 1w</code> in PromQL) overlays last week's same hour. "Is 3,000 req/s normal for a Tuesday 10 AM?" is unanswerable without it.</p>
<pre>sum(rate(http_requests_total{service="checkout"}[5m]))
sum(rate(http_requests_total{service="checkout"}[5m] offset 1w))</pre>
<blockquote>💡 Real world: "traffic dropped to zero and nothing alerted" is a famous outage pattern. Error-ratio alerts are blind when there are no requests — add a low-traffic alert compared to the same time last week.</blockquote>`,
        he: `<table>
<tr><th>מה רואים</th><th>הסיפור הסביר</th></tr>
<tr><td>Latency מטפס לאט, ואז errors קופצים; traffic שטוח</td><td>Saturation: pool/תור מתמלא עד timeouts. בודקים USE על השירות ועל ה-DB.</td></tr>
<tr><td>Latency ו-traffic עולים ביחד</td><td>קיבולת: הביקוש עולה על ההיצע. בודקים autoscaling ו-limits.</td></tr>
<tr><td>Errors קופצים מיד, latency <em>יורד</em></td><td>Fast-failing: deploy רע, dependency שמסרב לחיבורים, auth שבור. מסתכלים על ה-annotation של ה-deploy.</td></tr>
<tr><td>Traffic צונח בחדות, errors אפס</td><td>ה-requests לא מגיעים אליכם: DNS, LB, תקלה ב-upstream. שקט הוא סימפטום!</td></tr>
<tr><td>זיכרון בצורת מסור, ריסטארט בכל שיא</td><td>Memory leak ← לולאת OOMKill.</td></tr>
<tr><td>קפיצות כל שעה עגולה</td><td>Cron job, תפוגת cache, batch import, או גיבויים.</td></tr>
</table>
<p>תמיד משווים ל-baseline: ה-time shift של Grafana (<code>offset 1w</code> ב-PromQL) מציג את אותה שעה בשבוע שעבר. "3,000 req/s זה נורמלי ליום שלישי ב-10 בבוקר?" – בלי זה אי אפשר לענות.</p>
<pre>sum(rate(http_requests_total{service="checkout"}[5m]))
sum(rate(http_requests_total{service="checkout"}[5m] offset 1w))</pre>
<blockquote>💡 מהשטח: "ה-traffic ירד לאפס ושום דבר לא התריע" זה דפוס השבתה מפורסם. Alerts על יחס errors עיוורים כשאין requests – תוסיפו alert על traffic נמוך בהשוואה לאותה שעה בשבוע שעבר.</blockquote>`
      }
    },
    {
      h: { en: "Correlation ≠ causation", he: "Correlation זה לא causation" },
      body: {
        en: `<p>During an incident, <em>everything</em> looks guilty: CPU is up, GC is up, the DB has more connections, the cache hit rate dropped. Most of these are <strong>effects</strong>, not causes. When requests slow down, more of them are in flight at once → more threads → more memory → more GC → more CPU. The graphs move together because they share one root cause.</p>
<p>How to avoid chasing ghosts:</p>
<ul>
<li><strong>Which moved first?</strong> Zoom into the minute it started. The earliest change is usually closer to the cause.</li>
<li><strong>What changed?</strong> Deploys, config, feature flags, traffic mix, a dependency's status page.</li>
<li><strong>Is it everywhere or one slice?</strong> One AZ, one version, one tenant → split by label.</li>
<li><strong>Test the hypothesis</strong>: roll back, shift traffic, disable the flag. If the symptom goes away, you've found it; if not, keep looking.</li>
</ul>
<blockquote>⚠️ Production tip: mitigate first, explain later. If the graphs line up with a deploy, roll back <em>before</em> you've proven causation. Rollback is cheap; 40 minutes of debate during an outage isn't.</blockquote>`,
        he: `<p>באמצע תקלה <em>הכל</em> נראה אשם: ה-CPU עלה, ה-GC עלה, ל-DB יש יותר חיבורים, ה-cache hit rate ירד. רוב אלה <strong>תוצאות</strong>, לא סיבות. כש-requests מאטים, יותר מהם נמצאים באוויר במקביל ← יותר threads ← יותר זיכרון ← יותר GC ← יותר CPU. הגרפים זזים ביחד כי יש להם סיבת שורש אחת משותפת.</p>
<p>איך לא לרדוף אחרי רוחות:</p>
<ul>
<li><strong>מה זז ראשון?</strong> עושים zoom לדקה שבה זה התחיל. השינוי המוקדם ביותר בדרך כלל קרוב יותר לסיבה.</li>
<li><strong>מה השתנה?</strong> Deploys, קונפיג, feature flags, תמהיל traffic, דף הסטטוס של dependency.</li>
<li><strong>זה בכל מקום או בפרוסה אחת?</strong> AZ אחד, גרסה אחת, tenant אחד ← מפצלים לפי label.</li>
<li><strong>בודקים את ההשערה</strong>: rollback, הסטת traffic, כיבוי ה-flag. אם הסימפטום נעלם – מצאתם; אם לא – ממשיכים לחפש.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: קודם mitigation, אחר כך הסברים. אם הגרפים מתיישרים עם deploy, עושים rollback <em>לפני</em> שהוכחתם סיבתיות. Rollback זה זול; 40 דקות של ויכוח באמצע השבתה – לא.</blockquote>`
      }
    },
    {
      h: { en: "Anti-patterns: the dashboard of dashboards", he: "Anti-patterns: הדשבורד של הדשבורדים" },
      body: {
        en: `<ul>
<li><strong>The wall of 80 panels</strong>: every metric anyone ever wanted, no hierarchy. It loads slowly, hammers Prometheus, and nobody knows where to look. Split into an overview + drill-down dashboards linked by data links.</li>
<li><strong>Dashboard sprawl</strong>: 600 dashboards, 400 untouched for a year, five named "checkout-new-FINAL-v2". Use folders, ownership tags, and delete what's unused (Grafana shows view stats).</li>
<li><strong>Averages everywhere</strong>: "avg latency" and "avg CPU" across the fleet hide the one sick pod. Show percentiles and <code>topk</code>/<code>max</code>.</li>
<li><strong>Vanity metrics</strong>: total registered users, uptime counters — feel good, don't help in incidents.</li>
<li><strong>Staring as monitoring</strong>: a TV dashboard is not an alert. If something matters, alert on it; dashboards are for diagnosis.</li>
<li><strong>Hand-crafted snowflakes</strong>: edited in the UI, never saved to git, lost when the Grafana pod's disk is gone.</li>
</ul>
<blockquote>💡 Real world: the best on-call teams have ~3 dashboards they actually use: a global service overview (one row per service, red/green), a per-service RED template, and a per-cluster USE view. Everything else is a drill-down.</blockquote>`,
        he: `<ul>
<li><strong>קיר של 80 פאנלים</strong>: כל metric שמישהו אי פעם רצה, בלי היררכיה. נטען לאט, מפציץ את Prometheus, ואף אחד לא יודע לאן להסתכל. מפצלים לסקירה כללית + דשבורדי drill-down שמקושרים ב-data links.</li>
<li><strong>Dashboard sprawl</strong>: 600 דשבורדים, 400 לא נפתחו שנה, חמישה בשם "checkout-new-FINAL-v2". משתמשים בתיקיות, תגיות בעלות, ומוחקים מה שלא בשימוש (Grafana מציג סטטיסטיקות צפייה).</li>
<li><strong>ממוצעים בכל מקום</strong>: "avg latency" ו-"avg CPU" על כל הצי מסתירים את הפוד החולה האחד. מציגים אחוזונים ו-<code>topk</code>/<code>max</code>.</li>
<li><strong>Vanity metrics</strong>: סך המשתמשים הרשומים, מוני uptime – מרגיש טוב, לא עוזר בתקלה.</li>
<li><strong>בהייה במקום ניטור</strong>: דשבורד על מסך טלוויזיה הוא לא alert. אם משהו חשוב – עושים עליו alert; דשבורדים הם לאבחון.</li>
<li><strong>פתיתי שלג בעבודת יד</strong>: נערכו ב-UI, לא נשמרו ב-git, ונעלמו ביום שהדיסק של הפוד של Grafana הלך.</li>
</ul>
<blockquote>💡 מהשטח: לצוותי on-call הכי טובים יש ~3 דשבורדים שהם באמת משתמשים בהם: סקירה גלובלית של שירותים (שורה לכל שירות, אדום/ירוק), תבנית RED לכל שירות, ותצוגת USE לכל cluster. כל השאר זה drill-down.</blockquote>`
      }
    }
  ],
  diagram: `+-------------------------------------------------------------+
| ROW 1  SLO 99.94% (target 99.9) | Budget left 62% | Burn 0.8x |  <- 5-second test
+-------------------------------------------------------------+
| ROW 2  req/s        | error %        | p50/p95/p99  (+deploys) |  <- RED / golden
+-------------------------------------------------------------+
| ROW 3  DB / cache / payments API / Kafka lag (RED)            |  <- dependencies
+-------------------------------------------------------------+
| ROW 4  [collapsed] CPU+throttle | mem/limit | pools | GC      |  <- USE
+-------------------------------------------------------------+`,
  handsOn: [
    { cmd: "docker run -d --name grafana -p 3000:3000 grafana/grafana", what: { en: "Start Grafana, then Dashboards → New → Import → ID 1860 ('Node Exporter Full') to see a big community dashboard — and notice how hard it is to read at a glance.", he: "מרימים Grafana, ואז Dashboards ← New ← Import ← ID 1860 ('Node Exporter Full') כדי לראות דשבורד קהילתי גדול – ולשים לב כמה קשה לקרוא אותו במבט אחד." } },
    { cmd: "curl -s -u admin:admin 'http://localhost:3000/api/search?type=dash-db' | jq '.[] | {title, uid}'", what: { en: "List dashboards via the API — the first step to exporting them into git as code.", he: "רשימת דשבורדים דרך ה-API – הצעד הראשון לייצא אותם ל-git כקוד." } },
    { cmd: "curl -s -u admin:admin http://localhost:3000/api/dashboards/uid/YOUR_UID | jq '.dashboard' > checkout-dashboard.json", what: { en: "Export a dashboard's JSON model so it can be reviewed and provisioned from git.", he: "מייצאים את ה-JSON של דשבורד כדי שיעבור review ויוקם מ-git." } }
  ],
  mnemonic: {
    en: "\"Headline, Story, Fine print\": SLO on top, golden signals in the middle, resources at the bottom. And during incidents: \"First mover, what changed, which slice, test it.\"",
    he: "\"כותרת, כתבה, אותיות קטנות\": SLO למעלה, golden signals באמצע, משאבים למטה. ובתקלה: \"מי זז ראשון, מה השתנה, איזו פרוסה, תבדוק.\""
  },
  pitfalls: [
    { en: "Auto-scaled Y axes on ratio panels — tiny wobbles look like disasters, real disasters look like wobbles.", he: "צירי Y עם auto-scale בפאנלים של יחסים – תנודות קטנטנות נראות כמו אסון, ואסונות אמיתיים נראים כמו תנודה." },
    { en: "Blaming the first scary graph you see (CPU, GC) — it's often an effect of the real cause upstream.", he: "להאשים את הגרף המפחיד הראשון שרואים (CPU, GC) – לרוב זו תוצאה של הסיבה האמיתית ב-upstream." },
    { en: "No deploy annotations — you lose the single most useful clue in most incidents.", he: "בלי annotations של deploys – מאבדים את הרמז הכי שימושי ברוב התקלות." },
    { en: "Treating a wall-mounted dashboard as alerting — nobody is watching it at 3 AM.", he: "להתייחס לדשבורד על הקיר כאל alerting – אף אחד לא מסתכל עליו ב-3 בלילה." }
  ],
  interview: [
    {
      q: { en: "How would you design a dashboard for a new service?", he: "איך היית מעצב דשבורד לשירות חדש?" },
      a: { en: "Top-down: first row answers 'are users OK?' with SLO compliance, error budget and burn rate. Second row is RED — request rate, error ratio, latency percentiles with deploy annotations. Third row covers dependencies. Last, collapsed, USE for resources (CPU and throttling, memory vs limit, pools). Templated by service/env, stored as code in git, with links to traces/logs and the runbook.", he: "מלמעלה למטה: השורה הראשונה עונה על 'למשתמשים טוב?' עם עמידה ב-SLO, error budget ו-burn rate. השורה השנייה היא RED – request rate, יחס errors, אחוזוני latency עם annotations של deploys. השורה השלישית מכסה dependencies. אחרונה ומקופלת – USE למשאבים (CPU ו-throttling, זיכרון מול limit, pools). עם template לפי service/env, שמור כקוד ב-git, עם קישורים ל-traces/לוגים ול-runbook." }
    },
    {
      q: { en: "Errors spiked but latency went down. What does that suggest?", he: "ה-errors קפצו אבל ה-latency ירד. מה זה מרמז?" },
      a: { en: "Requests are failing fast — e.g. a bad deploy throwing immediately, a dependency refusing connections, a circuit breaker open, or auth rejecting. Fast failures pull latency percentiles down. Check deploy annotations and split latency by success/failure.", he: "Requests נכשלים מהר – למשל deploy רע שזורק exception מיד, dependency שמסרב לחיבורים, circuit breaker פתוח, או auth שדוחה. כשלים מהירים מורידים את אחוזוני ה-latency. בודקים annotations של deploys ומפצלים latency לפי הצלחה/כשל." }
    }
  ],
  quiz: [
    {
      q: { en: "What belongs in the top row of a service dashboard?", he: "מה צריך להיות בשורה העליונה של דשבורד שירות?" },
      options: [
        { en: "CPU and memory per node", he: "CPU וזיכרון לכל node" },
        { en: "SLO compliance, error budget left and burn rate", he: "עמידה ב-SLO, error budget שנשאר ו-burn rate" },
        { en: "A list of all pods", he: "רשימה של כל הפודים" },
        { en: "Total registered users", he: "סך המשתמשים הרשומים" }
      ],
      answer: 1,
      explain: { en: "The top row should answer 'are users OK?' in 5 seconds. Resources go at the bottom; registered users is a vanity metric.", he: "השורה העליונה צריכה לענות על 'למשתמשים טוב?' תוך 5 שניות. משאבים הולכים למטה; משתמשים רשומים זה vanity metric." }
    },
    {
      q: { en: "A latency heatmap shows two distinct horizontal bands at ~5ms and ~300ms. Most likely?", he: "Heatmap של latency מראה שתי רצועות אופקיות נפרדות ב-~5ms וב-~300ms. מה הכי סביר?" },
      options: [
        { en: "The histogram buckets are misconfigured", he: "ה-buckets של ה-histogram מוגדרים לא נכון" },
        { en: "Network packet loss", he: "איבוד packets ברשת" },
        { en: "Cache hits vs cache misses (bimodal distribution)", he: "Cache hits מול cache misses (התפלגות דו-שיאית)" },
        { en: "Prometheus scrape failures", he: "כשלים ב-scrape של Prometheus" }
      ],
      answer: 2,
      explain: { en: "Two bands means two populations of requests; a fast path and a slow path, classically cache hit vs miss. Percentiles would blur this.", he: "שתי רצועות = שתי אוכלוסיות של requests; מסלול מהיר ומסלול איטי, קלאסית cache hit מול miss. אחוזונים היו מטשטשים את זה." }
    },
    {
      q: { en: "During an incident CPU, GC, memory and DB connections all rose together. Best next step?", he: "באמצע תקלה CPU, GC, זיכרון וחיבורי DB עלו כולם ביחד. מה הצעד הבא הכי טוב?" },
      options: [
        { en: "Find which moved first and what changed (deploys, flags) at that time", he: "למצוא מה זז ראשון ומה השתנה (deploys, flags) באותו זמן" },
        { en: "Double the CPU limits immediately", he: "להכפיל מיד את ה-CPU limits" },
        { en: "Tune GC settings", he: "לכוונן את הגדרות ה-GC" },
        { en: "Add more DB connections to the pool", he: "להוסיף עוד חיבורים ל-DB pool" }
      ],
      answer: 0,
      explain: { en: "Correlated metrics are often all effects of one cause. The earliest mover and the most recent change point to it; the other options treat symptoms.", he: "Metrics שזזים ביחד הם לרוב כולם תוצאות של סיבה אחת. מה שזז ראשון והשינוי האחרון מצביעים עליה; שאר האופציות מטפלות בסימפטומים." }
    }
  ],
  related: ["obs-golden-signals", "obs-alerting", "obs-metrics", "k8s-debugging", "rel-sli-slo-sla"]
});

// ---------------- Glossary ----------------
[
  ["Observability", "The ability to understand a system's internal state from its external outputs (telemetry) and answer new questions without shipping new code.", "היכולת להבין את המצב הפנימי של מערכת מתוך הפלטים החיצוניים שלה (telemetry) ולענות על שאלות חדשות בלי לשחרר קוד חדש.", "obs-intro"],
  ["Monitoring", "Watching predefined signals and thresholds for known failure modes, and alerting on them.", "מעקב אחרי סיגנלים וספים מוגדרים מראש לתקלות מוכרות, והתרעה עליהן.", "obs-intro"],
  ["Continuous profiling", "Always-on, low-overhead sampling of CPU/memory usage by function in production, shown as flame graphs.", "דגימה רציפה ובתקורה נמוכה של שימוש ב-CPU/זיכרון לפי פונקציה בפרודקשן, מוצגת כ-flame graphs.", "obs-intro"],
  ["Time series", "A sequence of (timestamp, value) samples identified by a metric name plus a unique set of label values.", "רצף של דגימות (timestamp, value) שמזוהה לפי שם metric ועוד צירוף ייחודי של ערכי labels.", "obs-metrics"],
  ["Counter", "A metric that only increases (resetting on restart); query it with rate() or increase().", "Metric שרק עולה (ומתאפס בריסטארט); שואלים עליו עם rate() או increase().", "obs-metrics"],
  ["Gauge", "A metric whose value can go up and down, like memory in use or queue depth.", "Metric שהערך שלו יכול לעלות ולרדת, כמו זיכרון בשימוש או עומק תור.", "obs-metrics"],
  ["Histogram", "A metric that counts observations into cumulative buckets, allowing aggregatable percentile estimates via histogram_quantile().", "Metric שסופר תצפיות לתוך buckets מצטברים, ומאפשר הערכת אחוזונים שניתנת לאגרגציה עם histogram_quantile().", "obs-metrics"],
  ["Percentile (p99)", "The value below which a given percentage of observations fall; p99 latency = 99% of requests were faster.", "הערך שמתחתיו נמצא אחוז מסוים מהתצפיות; p99 latency = 99% מה-requests היו מהירים יותר.", "obs-metrics"],
  ["Cardinality", "The number of unique time series a metric produces — the product of its label values. High cardinality kills metric backends.", "מספר ה-time series הייחודיות ש-metric מייצר – המכפלה של ערכי ה-labels. High cardinality הורג backends של metrics.", "obs-metrics"],
  ["PromQL", "Prometheus's query language for selecting and aggregating time series, e.g. sum(rate(http_requests_total[5m])).", "שפת השאילתות של Prometheus לבחירה ואגרגציה של time series, למשל sum(rate(http_requests_total[5m])).", "obs-metrics"],
  ["Structured logging", "Emitting logs as machine-parseable key/value records (usually JSON) instead of free text.", "כתיבת לוגים כרשומות key/value שמכונה יכולה לפרסר (בדרך כלל JSON) במקום טקסט חופשי.", "obs-logs"],
  ["Correlation ID", "A unique ID attached to one request and propagated to all services and log lines so its full journey can be reconstructed.", "מזהה ייחודי שמוצמד ל-request אחד ומועבר לכל השירותים ושורות הלוג כדי שאפשר יהיה לשחזר את כל המסלול שלו.", "obs-logs"],
  ["Log retention", "How long logs are kept in each storage tier (hot, cold, archive); a major cost and compliance lever.", "כמה זמן שומרים לוגים בכל שכבת אחסון (hot, cold, archive); מנוף מרכזי לעלויות ול-compliance.", "obs-logs"],
  ["Span", "One timed unit of work in a trace, with a name, duration, status, attributes and parent span.", "יחידת עבודה אחת עם זמן בתוך trace, עם שם, משך, סטטוס, attributes ו-parent span.", "obs-traces"],
  ["Trace", "The tree of spans sharing one trace ID, representing a single request's path through a distributed system.", "עץ ה-spans שחולקים trace ID אחד, ומייצג את המסלול של request בודד במערכת מבוזרת.", "obs-traces"],
  ["traceparent", "The W3C Trace Context HTTP header carrying version, trace ID, parent span ID and sampling flags between services.", "ה-header של W3C Trace Context שמעביר בין שירותים את הגרסה, ה-trace ID, ה-parent span ID ו-flags של sampling.", "obs-traces"],
  ["Tail sampling", "Deciding which traces to keep after they complete (e.g. all errors and slow traces), usually in the OTel Collector.", "החלטה אילו traces לשמור אחרי שהם הסתיימו (למשל כל ה-errors וה-traces האיטיים), בדרך כלל ב-OTel Collector.", "obs-traces"],
  ["Head sampling", "Deciding at the start of a trace whether to record it, then propagating that decision downstream.", "החלטה בתחילת ה-trace האם להקליט אותו, והעברת ההחלטה הלאה downstream.", "obs-traces"],
  ["OpenTelemetry", "The CNCF vendor-neutral standard (APIs, SDKs, Collector, OTLP) for generating and exporting traces, metrics and logs.", "הסטנדרט הניטרלי של CNCF (APIs, SDKs, Collector, OTLP) לייצור וייצוא של traces, metrics ולוגים.", "obs-traces"],
  ["OTLP", "OpenTelemetry Protocol for shipping telemetry; gRPC on port 4317, HTTP on 4318.", "הפרוטוקול של OpenTelemetry לשליחת telemetry; gRPC בפורט 4317, HTTP בפורט 4318.", "obs-traces"],
  ["Exemplar", "A sample trace ID attached to a metric data point (e.g. a histogram bucket), linking metrics directly to traces.", "Trace ID לדוגמה שמוצמד לנקודת מידע של metric (למשל bucket של histogram), ומקשר metrics ישירות ל-traces.", "obs-traces"],
  ["Golden signals", "Latency, Traffic, Errors and Saturation — the four key signals for user-facing systems (Google SRE).", "Latency, Traffic, Errors ו-Saturation – ארבעת הסיגנלים המרכזיים למערכות שפונות למשתמשים (Google SRE).", "obs-golden-signals"],
  ["RED method", "Rate, Errors, Duration — the standard three metrics for every request-driven service.", "Rate, Errors, Duration – שלושת ה-metrics הסטנדרטיים לכל שירות שמונע על ידי requests.", "obs-golden-signals"],
  ["USE method", "Utilization, Saturation, Errors — a checklist for every resource (CPU, memory, disk, network, pools).", "Utilization, Saturation, Errors – צ'קליסט לכל משאב (CPU, זיכרון, דיסק, רשת, pools).", "obs-golden-signals"],
  ["Saturation", "How full a resource is, typically visible as queued or waiting work; a leading indicator of latency and errors.", "כמה משאב מלא, בדרך כלל נראה כעבודה שממתינה בתור; indicator מקדים של latency ו-errors.", "obs-golden-signals"],
  ["Burn rate", "How fast an error budget is being consumed relative to the SLO; 1 = exactly on budget, 14.4 = 2% of a 30-day budget per hour.", "כמה מהר ה-error budget נשרף ביחס ל-SLO; 1 = בדיוק לפי התקציב, 14.4 = 2% מ-budget של 30 יום בשעה.", "obs-alerting"],
  ["Alert fatigue", "Desensitization caused by too many noisy or non-actionable alerts, leading responders to miss real incidents.", "קהות חושים שנגרמת מיותר מדי alerts רועשים או לא ניתנים לפעולה, שגורמת לתורנים לפספס תקלות אמיתיות.", "obs-alerting"],
  ["Runbook", "A document linked from an alert explaining what it means, how to diagnose it and how to mitigate it.", "מסמך שמקושר מ-alert ומסביר מה הוא אומר, איך מאבחנים ואיך עושים mitigation.", "obs-alerting"],
  ["Alertmanager", "Prometheus component that deduplicates, groups, routes, inhibits and silences alerts before notifying receivers.", "רכיב של Prometheus שעושה dedup, grouping, routing, inhibition ו-silencing ל-alerts לפני שליחה ל-receivers.", "obs-alerting"],
  ["Heatmap", "A panel showing the full latency distribution over time (time × bucket, color = count), revealing bimodal patterns percentiles hide.", "פאנל שמציג את כל התפלגות ה-latency לאורך זמן (זמן × bucket, צבע = כמות), וחושף דפוסים דו-שיאיים שאחוזונים מסתירים.", "obs-dashboards"]
].forEach(([term, en, he, lesson]) =>
  window.INFRA.glossary.push({ term, track: "observability", def: { en, he }, lesson }));
