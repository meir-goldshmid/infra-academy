window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// Observability (more): Prometheus in production, logging pipelines,
// OpenTelemetry Collector & sampling, runbooks & on-call.
// ---------------------------------------------------------------------------

window.INFRA.lessons.push({
  id: "obs-prometheus-deep",
  track: "observability",
  order: 20,
  icon: "🔥",
  level: 3,
  minutes: 16,
  title: { en: "Prometheus in Production", he: "Prometheus בפרודקשן" },
  tldr: {
    en: "Prometheus pulls metrics from targets it discovers, keeps active series in RAM, and evaluates rules locally; in production you tame it with relabeling, recording rules, strict cardinality limits, an HA pair and remote storage (Thanos/Mimir/VictoriaMetrics) for the long term.",
    he: "Prometheus עושה pull ל-metrics מ-targets שהוא מגלה בעצמו, מחזיק את הסדרות הפעילות ב-RAM ומחשב rules מקומית; בפרודקשן מאלפים אותו עם relabeling, recording rules, גבולות cardinality קשוחים, זוג HA ו-remote storage (Thanos/Mimir/VictoriaMetrics) לטווח הארוך."
  },
  analogy: {
    en: "Prometheus is a meter reader who walks the building every 15 seconds and writes down every meter he finds. Service discovery is the building directory telling him which apartments exist today; relabeling is the clipboard where he decides which meters to skip and how to name them. If a tenant installs a meter per lightbulb (cardinality), his notebook (RAM) fills up and he collapses in the stairwell, along with his twin brother who walks the exact same route (the HA pair).",
    he: "Prometheus הוא קורא מונים שעובר בבניין כל 15 שניות ורושם כל מונה שהוא מוצא. Service discovery זה לוח הדיירים שאומר לו אילו דירות קיימות היום; relabeling זה הלוח שעליו הוא מחליט על אילו מונים לדלג ואיך לקרוא להם. אם דייר מתקין מונה לכל נורה (cardinality), המחברת שלו (RAM) מתמלאת והוא קורס בחדר המדרגות, יחד עם אח התאום שלו שעובר בדיוק באותו מסלול (זוג ה-HA)."
  },
  sections: [
    {
      h: { en: "Scraping, Kubernetes discovery and relabel_configs", he: "Scrape, discovery ב-Kubernetes ו-relabel_configs" },
      body: {
        en: `<p>Every <code>scrape_interval</code> (typically 15-30s) Prometheus sends <code>GET /metrics</code> to each target, parses the text exposition, and appends samples to its head block in memory (plus a WAL on disk). Targets come from <strong>service discovery</strong>: <code>kubernetes_sd_configs</code> watches the API server and turns every pod/endpoint/node into a target with a bag of <code>__meta_kubernetes_*</code> labels.</p>
<p><strong>relabel_configs</strong> run <em>before</em> the scrape, on the target's labels: keep/drop targets, set the address and path, copy metadata into real labels. <strong>metric_relabel_configs</strong> run <em>after</em> the scrape, on every sample: your last line of defense to drop expensive series.</p>
<pre>scrape_configs:
  - job_name: kubernetes-pods
    scrape_interval: 30s
    sample_limit: 50000          # whole scrape fails if a target exposes more
    label_limit: 30
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      # only pods annotated prometheus.io/scrape: "true"
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        regex: "true"
        action: keep
      # honor a custom port annotation
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        regex: ([^:]+)(?::\\d+)?;(\\d+)
        replacement: $1:$2
        target_label: __address__
      # turn metadata into queryable labels
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
    metric_relabel_configs:
      # drop a histogram nobody uses (saves ~12 series per label combo)
      - source_labels: [__name__]
        regex: go_gc_duration_seconds.*
        action: drop
      # strip a label that exploded
      - regex: request_id
        action: labeldrop</pre>
<blockquote>💡 Real world: labels starting with <code>__</code> are dropped after relabeling, so anything you want to query (namespace, pod, team) must be copied to a normal label explicitly. Check the result at <code>/targets</code> and <code>/service-discovery</code> in the Prometheus UI: "before relabeling" vs "after".</blockquote>`,
        he: `<p>בכל <code>scrape_interval</code> (בדרך כלל 15-30 שניות) Prometheus שולח <code>GET /metrics</code> לכל target, מפרסר את פורמט הטקסט ומוסיף את הדגימות ל-head block בזיכרון (ול-WAL על הדיסק). ה-targets מגיעים מ-<strong>service discovery</strong>: <code>kubernetes_sd_configs</code> עושה watch ל-API server והופך כל pod/endpoint/node ל-target עם שק של labels מסוג <code>__meta_kubernetes_*</code>.</p>
<p><strong>relabel_configs</strong> רצים <em>לפני</em> ה-scrape, על ה-labels של ה-target: keep/drop ל-targets, קביעת כתובת ו-path, העתקת metadata ל-labels אמיתיים. <strong>metric_relabel_configs</strong> רצים <em>אחרי</em> ה-scrape, על כל דגימה: קו ההגנה האחרון שלך כדי להפיל סדרות יקרות.</p>
<pre>scrape_configs:
  - job_name: kubernetes-pods
    scrape_interval: 30s
    sample_limit: 50000          # whole scrape fails if a target exposes more
    label_limit: 30
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      # only pods annotated prometheus.io/scrape: "true"
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        regex: "true"
        action: keep
      # honor a custom port annotation
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        regex: ([^:]+)(?::\\d+)?;(\\d+)
        replacement: $1:$2
        target_label: __address__
      # turn metadata into queryable labels
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
    metric_relabel_configs:
      # drop a histogram nobody uses (saves ~12 series per label combo)
      - source_labels: [__name__]
        regex: go_gc_duration_seconds.*
        action: drop
      # strip a label that exploded
      - regex: request_id
        action: labeldrop</pre>
<blockquote>💡 מהשטח: labels שמתחילים ב-<code>__</code> נזרקים אחרי ה-relabeling, אז כל דבר שאתה רוצה לשאול עליו (namespace, pod, team) חייב להיות מועתק במפורש ל-label רגיל. תבדוק את התוצאה ב-<code>/targets</code> וב-<code>/service-discovery</code> ב-UI של Prometheus: "before relabeling" מול "after".</blockquote>`
      }
    },
    {
      h: { en: "prometheus-operator: ServiceMonitor, recording & alerting rules", he: "prometheus-operator: ServiceMonitor, recording rules ו-alerting rules" },
      body: {
        en: `<p>In most clusters you don't hand-edit <code>prometheus.yml</code>. The <strong>prometheus-operator</strong> (shipped in kube-prometheus-stack) generates it from CRDs: a <code>ServiceMonitor</code> says "scrape the endpoints behind Services with these labels", a <code>PrometheusRule</code> holds rules. Teams own their own monitoring next to their Deployment.</p>
<pre>apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: checkout
  namespace: shop
  labels: { release: kube-prometheus-stack }   # must match Prometheus serviceMonitorSelector!
spec:
  selector:
    matchLabels: { app: checkout }
  endpoints:
    - port: http-metrics          # the *name* of the Service port
      interval: 30s
  sampleLimit: 20000</pre>
<p><strong>Recording rules</strong> precompute expensive queries every evaluation interval and store the result as a new, small series. Dashboards and alerts then read 1 series instead of aggregating 40,000. Naming convention: <code>level:metric:operations</code>.</p>
<pre>apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata: { name: checkout-rules, namespace: shop, labels: { release: kube-prometheus-stack } }
spec:
  groups:
    - name: checkout.recording
      interval: 30s
      rules:
        - record: job:http_requests:rate5m
          expr: sum by (job) (rate(http_requests_total[5m]))
        - record: job:http_errors:ratio_rate5m
          expr: |
            sum by (job) (rate(http_requests_total{code=~"5.."}[5m]))
              / sum by (job) (rate(http_requests_total[5m]))
    - name: checkout.alerts
      rules:
        - alert: CheckoutHighErrorRate
          expr: job:http_errors:ratio_rate5m{job="checkout"} &gt; 0.02
          for: 5m
          labels: { severity: critical, team: payments }
          annotations:
            summary: "checkout 5xx ratio {{ $value | humanizePercentage }}"
            runbook_url: https://runbooks.example.com/checkout/high-error-rate</pre>
<blockquote>⚠️ Production tip: the #1 "my ServiceMonitor does nothing" cause is a label mismatch: the ServiceMonitor's labels must match the Prometheus CR's <code>serviceMonitorSelector</code>, its namespace must be in <code>serviceMonitorNamespaceSelector</code>, and <code>port</code> refers to the Service port <em>name</em>, not the number. Validate rules in CI with <code>promtool check rules</code>.</blockquote>`,
        he: `<p>ברוב הקלאסטרים לא עורכים <code>prometheus.yml</code> ביד. ה-<strong>prometheus-operator</strong> (שמגיע עם kube-prometheus-stack) מייצר אותו מ-CRDs: <code>ServiceMonitor</code> אומר "תעשה scrape ל-endpoints שמאחורי Services עם ה-labels האלה", ו-<code>PrometheusRule</code> מחזיק rules. כל צוות מחזיק את ה-monitoring שלו ליד ה-Deployment שלו.</p>
<pre>apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: checkout
  namespace: shop
  labels: { release: kube-prometheus-stack }   # must match Prometheus serviceMonitorSelector!
spec:
  selector:
    matchLabels: { app: checkout }
  endpoints:
    - port: http-metrics          # the *name* of the Service port
      interval: 30s
  sampleLimit: 20000</pre>
<p><strong>Recording rules</strong> מחשבים מראש שאילתות יקרות בכל evaluation interval ושומרים את התוצאה כסדרה חדשה וקטנה. ה-dashboards וה-alerts קוראים אז סדרה אחת במקום לאגרג 40,000. קונבנציית שמות: <code>level:metric:operations</code>.</p>
<pre>apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata: { name: checkout-rules, namespace: shop, labels: { release: kube-prometheus-stack } }
spec:
  groups:
    - name: checkout.recording
      interval: 30s
      rules:
        - record: job:http_requests:rate5m
          expr: sum by (job) (rate(http_requests_total[5m]))
        - record: job:http_errors:ratio_rate5m
          expr: |
            sum by (job) (rate(http_requests_total{code=~"5.."}[5m]))
              / sum by (job) (rate(http_requests_total[5m]))
    - name: checkout.alerts
      rules:
        - alert: CheckoutHighErrorRate
          expr: job:http_errors:ratio_rate5m{job="checkout"} &gt; 0.02
          for: 5m
          labels: { severity: critical, team: payments }
          annotations:
            summary: "checkout 5xx ratio {{ $value | humanizePercentage }}"
            runbook_url: https://runbooks.example.com/checkout/high-error-rate</pre>
<blockquote>⚠️ טיפ לפרודקשן: הסיבה מספר 1 ל-"ה-ServiceMonitor שלי לא עושה כלום" היא אי-התאמה של labels: ה-labels של ה-ServiceMonitor חייבים להתאים ל-<code>serviceMonitorSelector</code> של ה-Prometheus CR, ה-namespace שלו חייב להיות ב-<code>serviceMonitorNamespaceSelector</code>, ו-<code>port</code> מתייחס ל<em>שם</em> של ה-port ב-Service, לא למספר. תבדוק rules ב-CI עם <code>promtool check rules</code>.</blockquote>`
      }
    },
    {
      h: { en: "Alertmanager: routing, grouping, inhibition", he: "Alertmanager: routing, grouping, inhibition" },
      body: {
        en: `<p>Prometheus only decides that an alert is <em>firing</em>. <strong>Alertmanager</strong> decides who hears about it, how often, and bundled with what. It walks a routing tree (first matching child wins unless <code>continue: true</code>), groups alerts by labels, and waits before sending so that 200 pods failing together become one notification.</p>
<pre>route:
  receiver: slack-default
  group_by: [alertname, cluster, namespace]
  group_wait: 30s        # wait for siblings before the first notification
  group_interval: 5m     # min gap before notifying about NEW alerts in a group
  repeat_interval: 4h    # re-notify if still firing
  routes:
    - matchers: [ severity="critical" ]
      receiver: pagerduty-payments
      routes:
        - matchers: [ team="data" ]
          receiver: pagerduty-data
    - matchers: [ severity="warning" ]
      receiver: jira-tickets

inhibit_rules:
  # if the whole cluster is unreachable, don't also page for every service in it
  - source_matchers: [ alertname="ClusterUnreachable" ]
    target_matchers: [ severity=~"warning|critical" ]
    equal: [ cluster ]</pre>
<p><strong>Silences</strong> mute matching alerts for a time window (planned maintenance) via <code>amtool silence add alertname=DiskFull instance=db-3 --duration=2h --comment="resize"</code>. Inhibition is automatic and rule-based; silences are manual and time-boxed.</p>
<blockquote>💡 Real world: run Alertmanager as a 3-replica cluster (gossip on port 9094) and point <em>every</em> Prometheus replica at <em>all</em> Alertmanagers. Both Prometheus replicas send the same alert; Alertmanager deduplicates. Never load-balance Prometheus → Alertmanager through a single Service VIP.</blockquote>`,
        he: `<p>Prometheus רק מחליט שה-alert <em>יורה</em>. <strong>Alertmanager</strong> מחליט מי שומע עליו, כל כמה זמן ובחבילה עם מה. הוא עובר על עץ routing (ה-child הראשון שמתאים מנצח, אלא אם יש <code>continue: true</code>), מקבץ alerts לפי labels, ומחכה לפני שליחה כדי ש-200 פודים שנופלים ביחד יהפכו להתראה אחת.</p>
<pre>route:
  receiver: slack-default
  group_by: [alertname, cluster, namespace]
  group_wait: 30s        # wait for siblings before the first notification
  group_interval: 5m     # min gap before notifying about NEW alerts in a group
  repeat_interval: 4h    # re-notify if still firing
  routes:
    - matchers: [ severity="critical" ]
      receiver: pagerduty-payments
      routes:
        - matchers: [ team="data" ]
          receiver: pagerduty-data
    - matchers: [ severity="warning" ]
      receiver: jira-tickets

inhibit_rules:
  # if the whole cluster is unreachable, don't also page for every service in it
  - source_matchers: [ alertname="ClusterUnreachable" ]
    target_matchers: [ severity=~"warning|critical" ]
    equal: [ cluster ]</pre>
<p><strong>Silences</strong> משתיקים alerts תואמים לחלון זמן (תחזוקה מתוכננת) עם <code>amtool silence add alertname=DiskFull instance=db-3 --duration=2h --comment="resize"</code>. Inhibition הוא אוטומטי ומבוסס חוקים; silence הוא ידני ומוגבל בזמן.</p>
<blockquote>💡 מהשטח: תריץ Alertmanager כ-cluster של 3 רפליקות (gossip על port 9094) ותכוון <em>כל</em> רפליקה של Prometheus ל<em>כל</em> ה-Alertmanagers. שתי רפליקות Prometheus שולחות את אותו alert; Alertmanager עושה dedup. אף פעם אל תעשה load balancing מ-Prometheus ל-Alertmanager דרך VIP של Service אחד.</blockquote>`
      }
    },
    {
      h: { en: "Cardinality management & memory sizing", he: "ניהול cardinality ותכנון זיכרון" },
      body: {
        en: `<p>Prometheus memory is driven by <strong>active series in the head block</strong> (the last ~2-3 hours), not by query load or retention. Plan roughly <strong>4-8 KB of RAM per active series</strong> including ingestion and query headroom: 1M series → ~6-8 GB working set, so give the pod a 12-16 GB limit. Disk is cheap by comparison: ~1.3-2 bytes per sample. 1M series at 30s = 33k samples/s ≈ 2.9B samples/day ≈ <strong>4-6 GB/day</strong>.</p>
<p>Finding the culprit when memory climbs:</p>
<pre># total active series right now (and graph it over 7 days)
prometheus_tsdb_head_series

# top 10 metric names by series count  (expensive: run on a quiet replica)
topk(10, count by (__name__) ({__name__=~".+"}))

# which targets expose the most samples per scrape
topk(10, scrape_samples_scraped)

# which targets added the most NEW series last scrape (churn)
topk(10, scrape_series_added)

# how many distinct values does one label have?
count(count by (path) (http_requests_total{job="checkout"}))</pre>
<p>The UI page <strong>Status → TSDB Status</strong> (API <code>/api/v1/status/tsdb</code>) lists the top metrics by series, top labels by value count and top label-value pairs by memory: usually the culprit jumps out in seconds. Offline: <code>promtool tsdb analyze /prometheus</code>.</p>
<p>Guardrails, from most to least preferred: fix the instrumentation (route template instead of raw path), <code>metric_relabel_configs</code> drop/labeldrop, per-scrape <code>sample_limit</code> / <code>label_limit</code> (scrape fails and <code>up</code> goes to 0 instead of killing Prometheus), and alerts on growth:</p>
<pre>- alert: PrometheusSeriesGrowth
  expr: prometheus_tsdb_head_series / (prometheus_tsdb_head_series offset 1d) &gt; 1.5
  for: 30m</pre>
<blockquote>⚠️ Production tip: churn kills too. A Deployment that rolls 50 pods 20 times a day creates new series for every pod name each rollout; old ones linger in the head block for hours. High churn with <code>pod</code> labels on per-pod histograms is a classic slow OOM.</blockquote>`,
        he: `<p>הזיכרון של Prometheus נקבע לפי <strong>הסדרות הפעילות ב-head block</strong> (בערך 2-3 השעות האחרונות), לא לפי עומס שאילתות ולא לפי retention. תתכנן בערך <strong>4-8 KB של RAM לכל סדרה פעילה</strong> כולל מרווח ל-ingestion ולשאילתות: מיליון סדרות ← בערך 6-8 GB working set, אז תן לפוד limit של 12-16 GB. דיסק זול בהשוואה: בערך 1.3-2 בייט לדגימה. מיליון סדרות כל 30 שניות = 33 אלף דגימות בשנייה ≈ 2.9 מיליארד דגימות ביום ≈ <strong>4-6 GB ביום</strong>.</p>
<p>איך מוצאים את האשם כשהזיכרון מטפס:</p>
<pre># total active series right now (and graph it over 7 days)
prometheus_tsdb_head_series

# top 10 metric names by series count  (expensive: run on a quiet replica)
topk(10, count by (__name__) ({__name__=~".+"}))

# which targets expose the most samples per scrape
topk(10, scrape_samples_scraped)

# which targets added the most NEW series last scrape (churn)
topk(10, scrape_series_added)

# how many distinct values does one label have?
count(count by (path) (http_requests_total{job="checkout"}))</pre>
<p>הדף <strong>Status → TSDB Status</strong> ב-UI (ה-API הוא <code>/api/v1/status/tsdb</code>) מציג את ה-metrics עם הכי הרבה סדרות, את ה-labels עם הכי הרבה ערכים ואת זוגות label-value שתופסים הכי הרבה זיכרון: בדרך כלל האשם קופץ לעין תוך שניות. בלי חיבור לשרת חי: <code>promtool tsdb analyze /prometheus</code>.</p>
<p>מנגנוני הגנה, מהמועדף לפחות מועדף: לתקן את ה-instrumentation (תבנית route במקום path גולמי), drop/labeldrop עם <code>metric_relabel_configs</code>, <code>sample_limit</code> / <code>label_limit</code> לכל scrape (ה-scrape נכשל ו-<code>up</code> יורד ל-0 במקום להרוג את Prometheus), ו-alerts על גדילה:</p>
<pre>- alert: PrometheusSeriesGrowth
  expr: prometheus_tsdb_head_series / (prometheus_tsdb_head_series offset 1d) &gt; 1.5
  for: 30m</pre>
<blockquote>⚠️ טיפ לפרודקשן: גם churn הורג. Deployment שמגלגל 50 פודים 20 פעמים ביום יוצר סדרות חדשות לכל שם פוד בכל rollout; הישנות נשארות ב-head block שעות. Churn גבוה עם label של <code>pod</code> על histograms פר-פוד זה OOM איטי קלאסי.</blockquote>`
      }
    },
    {
      h: { en: "HA pairs, long-term storage, remote_write and federation", he: "זוגות HA, אחסון לטווח ארוך, remote_write ו-federation" },
      body: {
        en: `<p><strong>HA</strong> in Prometheus is simple and dumb: run two identical replicas that scrape the same targets independently, differing only in an external label (<code>replica: a</code> / <code>replica: b</code>). Each has a full copy; Alertmanager deduplicates alerts; the query layer deduplicates series. Note what HA does <em>not</em> protect against: a cardinality bomb OOMs both replicas at the same minute.</p>
<p>Local retention is usually 15d-30d on a single disk. For a global view and a year of history you add a long-term store:</p>
<table>
<tr><th>Option</th><th>How</th><th>Notes</th></tr>
<tr><td>Thanos</td><td>Sidecar uploads 2h blocks to S3/GCS; Querier fans out and dedups by <code>replica</code> label; Compactor downsamples (5m, 1h)</td><td>Keeps Prometheus as-is; many components to run</td></tr>
<tr><td>Grafana Mimir / Cortex</td><td><code>remote_write</code> to a horizontally-scaled, multi-tenant cluster; HA tracker dedups replica pairs</td><td>Scales to 1B+ series; you operate a distributed system (or buy Grafana Cloud)</td></tr>
<tr><td>VictoriaMetrics</td><td><code>remote_write</code> to single-node or cluster VM; PromQL-compatible (MetricsQL)</td><td>Very RAM/disk efficient; simplest to run</td></tr>
<tr><td>Managed</td><td>Amazon Managed Prometheus, Google Managed Prometheus, Azure Monitor managed Prometheus</td><td>Priced per samples ingested + queried: watch cardinality</td></tr>
</table>
<pre>global:
  external_labels: { cluster: prod-eu-1, replica: a }
remote_write:
  - url: https://mimir.example.com/api/v1/push
    queue_config:
      capacity: 10000
      max_shards: 50
      max_samples_per_send: 2000
    write_relabel_configs:            # don't ship debug/high-churn metrics off-box
      - source_labels: [__name__]
        regex: "apiserver_request_duration_seconds_bucket|etcd_.*"
        action: drop</pre>
<p>Watch <code>prometheus_remote_storage_samples_pending</code> and <code>prometheus_remote_storage_highest_timestamp_in_seconds</code> vs <code>prometheus_remote_storage_queue_highest_sent_timestamp_seconds</code>: a growing gap means remote_write is falling behind (the WAL is your only buffer, ~2h).</p>
<p><strong>Federation</strong> (a global Prometheus scraping <code>/federate</code> of the leaf ones) works only for <em>aggregated</em> series. Federating <code>{__name__=~".+"}</code> means one giant scrape that times out, duplicates every series and gives you all of the cardinality with none of the scalability.</p>
<pre>- job_name: federate
  honor_labels: true
  metrics_path: /federate
  params:
    'match[]': [ '{__name__=~"job:.*"}' ]   # only recording-rule outputs</pre>
<blockquote>💡 Real world: a common shape is "Prometheus per cluster (HA pair, 15d local) → remote_write to Mimir or VictoriaMetrics (13 months) → Grafana pointed at the global store", with alerting rules still evaluated locally so alerts keep working when the central store is down.</blockquote>`,
        he: `<p><strong>HA</strong> ב-Prometheus הוא פשוט וטיפש: מריצים שתי רפליקות זהות שעושות scrape לאותם targets באופן עצמאי, ושונות רק ב-external label (<code>replica: a</code> / <code>replica: b</code>). לכל אחת יש עותק מלא; Alertmanager עושה dedup ל-alerts; שכבת השאילתות עושה dedup לסדרות. שים לב ממה HA <em>לא</em> מגן: פצצת cardinality מפילה את שתי הרפליקות באותה דקה בדיוק.</p>
<p>Retention מקומי הוא בדרך כלל 15-30 יום על דיסק אחד. בשביל תמונה גלובלית ושנה של היסטוריה מוסיפים long-term store:</p>
<table>
<tr><th>אפשרות</th><th>איך</th><th>הערות</th></tr>
<tr><td>Thanos</td><td>Sidecar מעלה blocks של שעתיים ל-S3/GCS; ה-Querier פונה לכולם ועושה dedup לפי label של <code>replica</code>; ה-Compactor עושה downsampling (5m, 1h)</td><td>Prometheus נשאר כמו שהוא; הרבה רכיבים להריץ</td></tr>
<tr><td>Grafana Mimir / Cortex</td><td><code>remote_write</code> ל-cluster multi-tenant שגדל אופקית; HA tracker עושה dedup לזוגות רפליקות</td><td>מגיע ל-מיליארד+ סדרות; אתה מתפעל מערכת מבוזרת (או קונה Grafana Cloud)</td></tr>
<tr><td>VictoriaMetrics</td><td><code>remote_write</code> ל-VM בודד או cluster; תואם PromQL (MetricsQL)</td><td>מאוד חסכוני ב-RAM ודיסק; הכי פשוט להריץ</td></tr>
<tr><td>Managed</td><td>Amazon Managed Prometheus, Google Managed Prometheus, Azure Monitor managed Prometheus</td><td>מתומחר לפי דגימות שנכנסות ונשאלות: תשמור על ה-cardinality</td></tr>
</table>
<pre>global:
  external_labels: { cluster: prod-eu-1, replica: a }
remote_write:
  - url: https://mimir.example.com/api/v1/push
    queue_config:
      capacity: 10000
      max_shards: 50
      max_samples_per_send: 2000
    write_relabel_configs:            # don't ship debug/high-churn metrics off-box
      - source_labels: [__name__]
        regex: "apiserver_request_duration_seconds_bucket|etcd_.*"
        action: drop</pre>
<p>תעקוב אחרי <code>prometheus_remote_storage_samples_pending</code> ואחרי הפער בין <code>prometheus_remote_storage_highest_timestamp_in_seconds</code> ל-<code>prometheus_remote_storage_queue_highest_sent_timestamp_seconds</code>: פער שגדל אומר ש-remote_write מפגר (ה-WAL הוא הבאפר היחיד שלך, בערך שעתיים).</p>
<p><strong>Federation</strong> (Prometheus גלובלי שעושה scrape ל-<code>/federate</code> של ה-Prometheus-ים המקומיים) עובד רק לסדרות <em>מאוגרגות</em>. לעשות federation ל-<code>{__name__=~".+"}</code> זה scrape ענק אחד שנופל ב-timeout, משכפל כל סדרה ונותן לך את כל ה-cardinality בלי שום scalability.</p>
<pre>- job_name: federate
  honor_labels: true
  metrics_path: /federate
  params:
    'match[]': [ '{__name__=~"job:.*"}' ]   # only recording-rule outputs</pre>
<blockquote>💡 מהשטח: מבנה נפוץ הוא "Prometheus לכל cluster (זוג HA, 15 יום מקומי) ← remote_write ל-Mimir או VictoriaMetrics (13 חודשים) ← Grafana שמכוון ל-store הגלובלי", כשה-alerting rules עדיין מחושבים מקומית כדי שה-alerts ימשיכו לעבוד גם כשה-store המרכזי למטה.</blockquote>`
      }
    }
  ],
  diagram: `  pods / nodes / exporters  (/metrics)
        ^  scrape every 15-30s (pull)
        |
  +-----+-------------+     +-----+-------------+
  | Prometheus  rep=a |     | Prometheus  rep=b |   identical HA pair
  | SD -> relabel ->  |     | SD -> relabel ->  |
  | head(RAM)+WAL+TSDB|     | head(RAM)+WAL+TSDB|
  | rules (rec/alert) |     | rules (rec/alert) |
  +---+----------+----+     +----+----------+---+
      | alerts   | remote_write  |          |
      v          v               v          v
  Alertmanager x3 (dedup, group, route) -> PagerDuty / Slack / Jira
                 Mimir / Thanos / VictoriaMetrics (13 months) -> Grafana`,
  handsOn: [
    { cmd: "kubectl -n monitoring port-forward svc/prometheus-operated 9090 & curl -s localhost:9090/api/v1/status/tsdb | jq '.data.seriesCountByMetricName[:10]'", what: { en: "Top 10 metrics by series count: the first thing to look at when Prometheus memory grows.", he: "10 ה-metrics עם הכי הרבה סדרות: הדבר הראשון שבודקים כשהזיכרון של Prometheus גדל." } },
    { cmd: "curl -s localhost:9090/api/v1/query --data-urlencode 'query=topk(10, scrape_samples_scraped)' | jq -r '.data.result[] | \"\\(.value[1])  \\(.metric.job) \\(.metric.instance)\"'", what: { en: "Which targets are the heaviest per scrape.", he: "אילו targets הכי כבדים בכל scrape." } },
    { cmd: "promtool check rules rules.yaml && promtool test rules tests.yaml", what: { en: "Lint and unit-test recording/alerting rules in CI before they reach the cluster.", he: "בודקים תקינות ומריצים unit tests ל-recording/alerting rules ב-CI לפני שהם מגיעים לקלאסטר." } },
    { cmd: "amtool --alertmanager.url=http://localhost:9093 config routes test severity=critical team=data", what: { en: "Ask Alertmanager which receiver a given label set would be routed to: test your routing tree without firing a real alert.", he: "שואלים את Alertmanager לאיזה receiver סט labels מסוים ינותב: בודקים את עץ ה-routing בלי להפעיל alert אמיתי." } }
  ],
  mnemonic: {
    en: "\"Discover, Relabel, Scrape, Record, Route.\" And: RAM follows series, disk follows samples, HA doubles both, and cardinality kills both twins at once.",
    he: "\"Discover, Relabel, Scrape, Record, Route.\" ועוד: RAM הולך אחרי סדרות, דיסק הולך אחרי דגימות, HA מכפיל את שניהם, ו-cardinality הורג את שני התאומים באותו רגע."
  },
  pitfalls: [
    { en: "Believing the HA pair protects you from cardinality explosions. Both replicas scrape the same bad target and OOM together.", he: "להאמין שזוג ה-HA מגן עליך מפיצוץ cardinality. שתי הרפליקות עושות scrape לאותו target בעייתי וחוטפות OOM ביחד." },
    { en: "Using relabel_configs to drop a metric. relabel_configs work on targets before the scrape; dropping series needs metric_relabel_configs.", he: "להשתמש ב-relabel_configs כדי להפיל metric. relabel_configs עובדים על targets לפני ה-scrape; כדי להפיל סדרות צריך metric_relabel_configs." },
    { en: "Federating everything into a global Prometheus. Federate only recording-rule aggregates, or use remote_write to a scalable store.", he: "לעשות federation להכל לתוך Prometheus גלובלי. עושים federation רק לאגרגציות של recording rules, או remote_write ל-store שגדל." },
    { en: "Evaluating alerts only in the central long-term store. When it's down or remote_write lags, you're blind exactly when you need alerts.", he: "לחשב alerts רק ב-store המרכזי. כשהוא למטה או ש-remote_write מפגר, אתה עיוור בדיוק כשאתה צריך alerts." }
  ],
  interview: [
    {
      q: { en: "How would you size Prometheus for a cluster with 400 nodes and 8,000 pods?", he: "איך היית עושה sizing ל-Prometheus בקלאסטר עם 400 nodes ו-8,000 פודים?" },
      a: { en: "Estimate active series: node-exporter ~1,000 series/node (400k), kubelet/cAdvisor ~200-400/pod (2-3M), kube-state-metrics ~50/pod (400k), app metrics maybe 300/pod (2.4M) → roughly 5-6M series. At 4-8 KB/series that's 30-45 GB RAM per replica, too big for one instance comfortably, so shard by function (infra vs apps) or use agent mode + remote_write to Mimir/VictoriaMetrics. Then cut: drop unused cAdvisor metrics, recording rules for dashboards, sample_limit per job, and alert on head_series growth.", he: "מעריכים סדרות פעילות: node-exporter בערך 1,000 סדרות ל-node (400 אלף), kubelet/cAdvisor בערך 200-400 לפוד (2-3 מיליון), kube-state-metrics בערך 50 לפוד (400 אלף), metrics של אפליקציות אולי 300 לפוד (2.4 מיליון) ← בערך 5-6 מיליון סדרות. ב-4-8 KB לסדרה זה 30-45 GB RAM לרפליקה, יותר מדי ל-instance אחד בנוחות, אז עושים sharding לפי תפקיד (תשתית מול אפליקציות) או agent mode + remote_write ל-Mimir/VictoriaMetrics. ואז מקצצים: drop ל-metrics לא בשימוש של cAdvisor, recording rules ל-dashboards, sample_limit לכל job, ו-alert על גדילה של head_series." }
    },
    {
      q: { en: "What's the difference between grouping and inhibition in Alertmanager?", he: "מה ההבדל בין grouping ל-inhibition ב-Alertmanager?" },
      a: { en: "Grouping bundles related alerts (same group_by labels) into a single notification, so 200 pod alerts become one message. Inhibition suppresses some alerts entirely while another alert is firing, e.g. mute all service alerts in a cluster when ClusterUnreachable fires for that cluster (matched by equal labels). Grouping reduces message count; inhibition removes symptoms of a known cause.", he: "Grouping מאגד alerts קשורים (אותם labels ב-group_by) להתראה אחת, כך ש-200 alerts של פודים הופכים להודעה אחת. Inhibition מדכא alerts מסוימים לגמרי בזמן ש-alert אחר יורה, למשל משתיק את כל ה-alerts של שירותים בקלאסטר כש-ClusterUnreachable יורה על אותו קלאסטר (התאמה לפי equal labels). Grouping מקטין את מספר ההודעות; inhibition מעלים סימפטומים של סיבה ידועה." }
    }
  ],
  quiz: [
    {
      q: { en: "You need to stop storing a metric that a target exposes. Where do you configure the drop?", he: "אתה צריך להפסיק לשמור metric ש-target חושף. איפה מגדירים את ה-drop?" },
      options: [
        { en: "relabel_configs", he: "relabel_configs" },
        { en: "metric_relabel_configs", he: "metric_relabel_configs" },
        { en: "Alertmanager inhibit_rules", he: "inhibit_rules של Alertmanager" },
        { en: "A recording rule", he: "Recording rule" }
      ],
      answer: 1,
      explain: { en: "metric_relabel_configs run after the scrape on every sample, so they can drop series or labels. relabel_configs run on target labels before the scrape.", he: "metric_relabel_configs רצים אחרי ה-scrape על כל דגימה, ולכן יכולים להפיל סדרות או labels. relabel_configs רצים על ה-labels של ה-target לפני ה-scrape." }
    },
    {
      q: { en: "What mainly determines Prometheus RAM usage?", he: "מה בעיקר קובע את צריכת ה-RAM של Prometheus?" },
      options: [
        { en: "Retention period on disk", he: "תקופת ה-retention על הדיסק" },
        { en: "Number of Grafana users", he: "מספר משתמשי Grafana" },
        { en: "Number of active series in the head block", he: "מספר הסדרות הפעילות ב-head block" },
        { en: "Number of alerting rules", he: "מספר ה-alerting rules" }
      ],
      answer: 2,
      explain: { en: "Active series (and their churn) dominate memory: roughly 4-8 KB each with headroom. Retention mostly affects disk.", he: "סדרות פעילות (וה-churn שלהן) שולטות בזיכרון: בערך 4-8 KB לכל אחת עם מרווח. Retention משפיע בעיקר על הדיסק." }
    },
    {
      q: { en: "Your global Prometheus federates {__name__=~\".+\"} from 12 clusters and keeps timing out. Best fix?", he: "ה-Prometheus הגלובלי שלך עושה federation ל-{__name__=~\".+\"} מ-12 קלאסטרים וכל הזמן נופל ב-timeout. מה התיקון הכי טוב?" },
      options: [
        { en: "Increase scrape_timeout to 5 minutes", he: "להגדיל את scrape_timeout ל-5 דקות" },
        { en: "Federate only recording-rule aggregates (e.g. job:.*) or remote_write to Thanos/Mimir/VictoriaMetrics", he: "לעשות federation רק לאגרגציות של recording rules (למשל job:.*) או remote_write ל-Thanos/Mimir/VictoriaMetrics" },
        { en: "Run the global Prometheus as an HA pair", he: "להריץ את ה-Prometheus הגלובלי כזוג HA" },
        { en: "Lower scrape_interval on the leaf Prometheus servers", he: "להוריד את ה-scrape_interval ב-Prometheus-ים המקומיים" }
      ],
      answer: 1,
      explain: { en: "Federation is for aggregated series only. For full-fidelity global queries use a long-term store built for it.", he: "Federation מיועד רק לסדרות מאוגרגות. לשאילתות גלובליות ברזולוציה מלאה משתמשים ב-store לטווח ארוך שבנוי לזה." }
    },
    {
      q: { en: "Why set sample_limit on a scrape job?", he: "למה להגדיר sample_limit על scrape job?" },
      options: [
        { en: "It makes scrapes faster", he: "זה מאיץ את ה-scrapes" },
        { en: "It compresses samples better on disk", he: "זה דוחס דגימות טוב יותר על הדיסק" },
        { en: "A target exceeding it fails the scrape (up=0) instead of flooding Prometheus with series and OOMing it", he: "target שעובר אותו מכשיל את ה-scrape (up=0) במקום להציף את Prometheus בסדרות ולהפיל אותו ב-OOM" },
        { en: "It limits how many alerts a target can fire", he: "זה מגביל כמה alerts target יכול להפעיל" }
      ],
      answer: 2,
      explain: { en: "sample_limit contains blast radius: one badly instrumented service loses its metrics (and you get an alert on up==0) rather than taking down monitoring for everyone.", he: "sample_limit מגביל את ה-blast radius: שירות אחד עם instrumentation גרוע מאבד את ה-metrics שלו (ואתה מקבל alert על up==0) במקום להפיל את ה-monitoring של כולם." }
    }
  ],
  related: ["obs-metrics", "obs-alerting", "k8s-cluster-observability", "obs-otel-collector", "rel-runbooks-oncall"]
});

window.INFRA.lessons.push({
  id: "obs-logging-pipeline",
  track: "observability",
  order: 21,
  icon: "🪵",
  level: 3,
  minutes: 15,
  title: { en: "Logging Pipelines at Scale", he: "Logging pipelines בסקייל" },
  tldr: {
    en: "A node agent (Fluent Bit, Vector or OTel Collector) tails container logs, parses and enriches them, buffers through backend hiccups and ships them to Loki, Elasticsearch/OpenSearch or a cloud service; at scale the real work is controlling volume and cost: drop, sample, redact, tier and archive.",
    he: "Agent על כל node (Fluent Bit, Vector או OTel Collector) קורא את הלוגים של הקונטיינרים, מפרסר ומעשיר אותם, עושה buffering כשה-backend מגמגם ושולח ל-Loki, Elasticsearch/OpenSearch או שירות ענן; בסקייל העבודה האמיתית היא שליטה בנפח ובעלות: drop, sampling, redaction, tiers וארכוב."
  },
  analogy: {
    en: "A logging pipeline is a city's mail system. Every building has a mailroom clerk (the DaemonSet agent) who collects envelopes, stamps the address (Kubernetes metadata), staples multi-page letters together (multiline), and keeps a storage room for when the trucks are late (buffer). Loki is a warehouse that only labels boxes by street and building, and you open boxes to search; Elasticsearch reads and indexes every word of every letter, so it finds anything instantly but needs a building ten times bigger. Junk mail goes in the shredder before it ever reaches the warehouse.",
    he: "Logging pipeline זה מערכת הדואר של עיר. בכל בניין יש פקיד בחדר הדואר (ה-agent ב-DaemonSet) שאוסף מעטפות, מטביע כתובת (metadata של Kubernetes), מהדק מכתבים של כמה עמודים (multiline), ומחזיק מחסן למקרה שהמשאיות מאחרות (buffer). Loki הוא מחסן שמסמן ארגזים רק לפי רחוב ובניין, וכדי לחפש פותחים ארגזים; Elasticsearch קורא ומאנדקס כל מילה בכל מכתב, אז הוא מוצא הכל מיד אבל צריך בניין גדול פי עשרה. דואר זבל הולך לגורסה לפני שהוא בכלל מגיע למחסן."
  },
  sections: [
    {
      h: { en: "The shape: stdout → node agent → (aggregator) → backend", he: "המבנה: stdout ← agent על ה-node ← (aggregator) ← backend" },
      body: {
        en: `<p>In Kubernetes, apps write to stdout/stderr. The container runtime writes each line to <code>/var/log/pods/&lt;ns&gt;_&lt;pod&gt;_&lt;uid&gt;/&lt;container&gt;/0.log</code> (symlinked from <code>/var/log/containers/</code>) in CRI format: <code>2026-11-14T09:12:03.512Z stdout F {"level":"info",...}</code>. The kubelet rotates these files at <code>containerLogMaxSize</code> (default 10Mi) keeping <code>containerLogMaxFiles</code> (default 5).</p>
<p>A <strong>DaemonSet agent</strong> on every node tails those files, adds Kubernetes metadata (namespace, pod, labels) from the API server, and ships:</p>
<table>
<tr><th>Agent</th><th>Written in</th><th>Typical footprint</th><th>Strengths</th></tr>
<tr><td>Fluent Bit</td><td>C</td><td>~20-60 MB RAM</td><td>The default in EKS/AKS/GKE add-ons, huge plugin set</td></tr>
<tr><td>Vector</td><td>Rust</td><td>~50-150 MB</td><td>VRL transform language, strong buffering, also works as aggregator</td></tr>
<tr><td>OTel Collector</td><td>Go</td><td>~100-200 MB</td><td>One agent for logs, metrics and traces; OTLP end to end</td></tr>
</table>
<pre>[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    Exclude_Path      /var/log/containers/*_kube-system_*.log
    multiline.parser  cri
    Tag               kube.*
    DB                /var/fluent-bit/state/flb_kube.db   # remembers file offsets across restarts
    Mem_Buf_Limit     50MB
    storage.type      filesystem

[FILTER]
    Name                kubernetes
    Match               kube.*
    Merge_Log           On          # parse JSON log body into fields
    Keep_Log            Off
    Labels              On
    Annotations         Off</pre>
<p>At higher volumes add an <strong>aggregator tier</strong> (Vector or OTel Collector Deployment, or Kafka) between agents and backend: it absorbs backend outages, centralizes redaction/routing rules, and keeps per-node agents thin.</p>
<blockquote>💡 Real world: the file-offset DB (<code>DB</code> in Fluent Bit, <code>data_dir</code> in Vector, <code>storage</code> extension for the OTel filelog receiver) must live on a hostPath. Without it, every agent restart either re-ships the last 50 MB of every file (duplicates) or skips to the end (loss).</blockquote>`,
        he: `<p>ב-Kubernetes אפליקציות כותבות ל-stdout/stderr. ה-container runtime כותב כל שורה ל-<code>/var/log/pods/&lt;ns&gt;_&lt;pod&gt;_&lt;uid&gt;/&lt;container&gt;/0.log</code> (עם symlink מ-<code>/var/log/containers/</code>) בפורמט CRI: <code>2026-11-14T09:12:03.512Z stdout F {"level":"info",...}</code>. ה-kubelet עושה rotation לקבצים ב-<code>containerLogMaxSize</code> (ברירת מחדל 10Mi) ושומר <code>containerLogMaxFiles</code> (ברירת מחדל 5).</p>
<p><strong>Agent ב-DaemonSet</strong> על כל node קורא את הקבצים האלה, מוסיף metadata של Kubernetes (namespace, pod, labels) מה-API server, ושולח:</p>
<table>
<tr><th>Agent</th><th>כתוב ב-</th><th>צריכה טיפוסית</th><th>חוזקות</th></tr>
<tr><td>Fluent Bit</td><td>C</td><td>בערך 20-60 MB RAM</td><td>ברירת המחדל ב-add-ons של EKS/AKS/GKE, המון plugins</td></tr>
<tr><td>Vector</td><td>Rust</td><td>בערך 50-150 MB</td><td>שפת ה-transform VRL, buffering חזק, עובד גם כ-aggregator</td></tr>
<tr><td>OTel Collector</td><td>Go</td><td>בערך 100-200 MB</td><td>Agent אחד ללוגים, metrics ו-traces; OTLP מקצה לקצה</td></tr>
</table>
<pre>[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    Exclude_Path      /var/log/containers/*_kube-system_*.log
    multiline.parser  cri
    Tag               kube.*
    DB                /var/fluent-bit/state/flb_kube.db   # remembers file offsets across restarts
    Mem_Buf_Limit     50MB
    storage.type      filesystem

[FILTER]
    Name                kubernetes
    Match               kube.*
    Merge_Log           On          # parse JSON log body into fields
    Keep_Log            Off
    Labels              On
    Annotations         Off</pre>
<p>בנפחים גבוהים מוסיפים <strong>שכבת aggregator</strong> (Deployment של Vector או OTel Collector, או Kafka) בין ה-agents ל-backend: היא סופגת נפילות של ה-backend, מרכזת את חוקי ה-redaction וה-routing, ושומרת את ה-agents על ה-nodes רזים.</p>
<blockquote>💡 מהשטח: ה-DB של ה-offsets (<code>DB</code> ב-Fluent Bit, <code>data_dir</code> ב-Vector, extension של <code>storage</code> ל-filelog receiver של OTel) חייב לשבת על hostPath. בלעדיו, כל ריסטארט של ה-agent או שולח מחדש את ה-50 MB האחרונים של כל קובץ (כפילויות) או קופץ לסוף (אובדן).</blockquote>`
      }
    },
    {
      h: { en: "Parsing, multiline and structure at the source", he: "Parsing, multiline ומבנה כבר במקור" },
      body: {
        en: `<p>The cheapest parsing is the parsing you don't do: <strong>emit JSON from the app</strong> (<code>{"ts":"...","level":"error","msg":"...","trace_id":"..."}</code>). Then the agent only merges fields. Regex parsing of free-text logs at 50k lines/s burns real CPU on every node.</p>
<p><strong>Multiline</strong>: a Java stack trace is 40 lines on stdout but one event. Without multiline handling each line becomes its own log record, search for the exception finds a fragment, and line counts (and bills) explode.</p>
<pre>[MULTILINE_PARSER]
    name          java_stack
    type          regex
    flush_timeout 1000
    # a new record starts with a timestamp; "at ..." / "Caused by" lines continue it
    rule  "start_state"  "/^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}/"  "cont"
    rule  "cont"         "/^\\s+(at|\\.{3})\\s|^Caused by:/"         "cont"

[FILTER]
    Name                  multiline
    Match                 kube.*
    multiline.key_content log
    multiline.parser      java_stack, go, python</pre>
<p>Vector equivalent: a <code>reduce</code> transform or the <code>multiline</code> option on the <code>file</code>/<code>kubernetes_logs</code> source. OTel Collector: <code>multiline: { line_start_pattern: '^\\d{4}-' }</code> on the filelog receiver.</p>
<blockquote>⚠️ Production tip: the best multiline fix is in the app: a JSON logger serializes the whole stack trace into one <code>"stack"</code> field. Agent-side multiline is a regex guess that breaks the day someone changes the log format.</blockquote>`,
        he: `<p>ה-parsing הכי זול הוא זה שלא עושים: <strong>תוציא JSON מהאפליקציה</strong> (<code>{"ts":"...","level":"error","msg":"...","trace_id":"..."}</code>). ככה ה-agent רק ממזג שדות. Parsing עם regex ללוגים בטקסט חופשי ב-50 אלף שורות בשנייה שורף CPU אמיתי על כל node.</p>
<p><strong>Multiline</strong>: stack trace של Java זה 40 שורות ב-stdout אבל אירוע אחד. בלי טיפול ב-multiline כל שורה הופכת לרשומה נפרדת, חיפוש של ה-exception מוצא חתיכה, ומספר השורות (והחשבון) מתפוצץ.</p>
<pre>[MULTILINE_PARSER]
    name          java_stack
    type          regex
    flush_timeout 1000
    # a new record starts with a timestamp; "at ..." / "Caused by" lines continue it
    rule  "start_state"  "/^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}/"  "cont"
    rule  "cont"         "/^\\s+(at|\\.{3})\\s|^Caused by:/"         "cont"

[FILTER]
    Name                  multiline
    Match                 kube.*
    multiline.key_content log
    multiline.parser      java_stack, go, python</pre>
<p>המקבילה ב-Vector: transform של <code>reduce</code> או האופציה <code>multiline</code> על ה-source של <code>file</code>/<code>kubernetes_logs</code>. ב-OTel Collector: <code>multiline: { line_start_pattern: '^\\d{4}-' }</code> על ה-filelog receiver.</p>
<blockquote>⚠️ טיפ לפרודקשן: התיקון הכי טוב ל-multiline הוא באפליקציה: JSON logger מסדר את כל ה-stack trace לתוך שדה <code>"stack"</code> אחד. Multiline בצד ה-agent זה ניחוש עם regex שנשבר ביום שמישהו משנה את פורמט הלוג.</blockquote>`
      }
    },
    {
      h: { en: "Buffering and backpressure: what happens when the backend is slow", he: "Buffering ו-backpressure: מה קורה כשה-backend איטי" },
      body: {
        en: `<p>Backends hiccup: Elasticsearch rejects bulk requests with <code>429 es_rejected_execution_exception</code>, Loki returns <code>429 rate limit exceeded</code> per tenant, CloudWatch throttles <code>PutLogEvents</code>. The agent must hold data somewhere and slow down its inputs. That is <strong>backpressure</strong>, and you choose what gives.</p>
<ul>
<li><strong>Memory buffer only</strong>: fast, but limited and lost on agent restart. Fluent Bit with <code>Mem_Buf_Limit 50MB</code> <em>pauses</em> the tail input when full.</li>
<li><strong>Filesystem buffer</strong>: survives restarts, holds hours of logs. Fluent Bit <code>storage.type filesystem</code> + <code>storage.total_limit_size 5G</code> per output.</li>
<li><strong>When full</strong>: block (stop reading, risk losing lines when kubelet rotates the file away underneath you) or drop (keep reading, discard oldest/newest). Vector makes it explicit:</li>
</ul>
<pre>sinks:
  loki:
    type: loki
    inputs: [redact]
    endpoint: http://loki-gateway.logging:80
    labels: { namespace: "{{ kubernetes.pod_namespace }}", app: "{{ kubernetes.pod_labels.app }}" }
    encoding: { codec: json }
    buffer:
      type: disk
      max_size: 5368709120     # 5 GiB on the node
      when_full: block         # or drop_newest for non-critical streams
    request:
      retry_max_duration_secs: 3600</pre>
<p>Do the math: a node producing 2 MB/s of logs fills a 5 GiB buffer in ~43 minutes of backend outage. And "block" upstream means the kubelet keeps rotating: a pod writing 10 MB/min with 5 x 10Mi files gives you only ~5 minutes before unread data is deleted.</p>
<blockquote>💡 Real world: put Kafka (or Kinesis/Event Hubs) between agents and the indexer when log loss is unacceptable. The agent only needs Kafka to be up; indexers consume at their own pace and you can replay after an Elasticsearch outage.</blockquote>`,
        he: `<p>Backends מגמגמים: Elasticsearch דוחה bulk requests עם <code>429 es_rejected_execution_exception</code>, Loki מחזיר <code>429 rate limit exceeded</code> לכל tenant, CloudWatch עושה throttling ל-<code>PutLogEvents</code>. ה-agent חייב להחזיק את המידע איפשהו ולהאט את ה-inputs שלו. זה <strong>backpressure</strong>, ואתה בוחר מה מוותרים.</p>
<ul>
<li><strong>רק buffer בזיכרון</strong>: מהיר, אבל מוגבל והולך לאיבוד בריסטארט של ה-agent. Fluent Bit עם <code>Mem_Buf_Limit 50MB</code> <em>עוצר</em> את ה-tail input כשהוא מלא.</li>
<li><strong>Buffer על דיסק</strong>: שורד ריסטארטים, מחזיק שעות של לוגים. ב-Fluent Bit: <code>storage.type filesystem</code> + <code>storage.total_limit_size 5G</code> לכל output.</li>
<li><strong>כשהוא מלא</strong>: block (מפסיקים לקרוא, וסיכון לאבד שורות כשה-kubelet עושה rotation לקובץ מתחתיך) או drop (ממשיכים לקרוא, זורקים את הישן/חדש). Vector עושה את זה מפורש:</li>
</ul>
<pre>sinks:
  loki:
    type: loki
    inputs: [redact]
    endpoint: http://loki-gateway.logging:80
    labels: { namespace: "{{ kubernetes.pod_namespace }}", app: "{{ kubernetes.pod_labels.app }}" }
    encoding: { codec: json }
    buffer:
      type: disk
      max_size: 5368709120     # 5 GiB on the node
      when_full: block         # or drop_newest for non-critical streams
    request:
      retry_max_duration_secs: 3600</pre>
<p>תעשה את החשבון: node שמייצר 2 MB/s של לוגים ממלא buffer של 5 GiB תוך בערך 43 דקות של נפילת backend. ו-"block" למעלה אומר שה-kubelet ממשיך לעשות rotation: פוד שכותב 10 MB לדקה עם 5 קבצים של 10Mi נותן לך רק בערך 5 דקות לפני שמידע שלא נקרא נמחק.</p>
<blockquote>💡 מהשטח: שים Kafka (או Kinesis/Event Hubs) בין ה-agents ל-indexer כשאובדן לוגים לא מקובל. ה-agent צריך רק ש-Kafka יהיה למעלה; ה-indexers צורכים בקצב שלהם ואפשר לעשות replay אחרי נפילה של Elasticsearch.</blockquote>`
      }
    },
    {
      h: { en: "Loki vs Elasticsearch/OpenSearch vs cloud: how they index and what they cost", he: "Loki מול Elasticsearch/OpenSearch מול ענן: איך הם מאנדקסים וכמה זה עולה" },
      body: {
        en: `<p><strong>Loki</strong> indexes only a small set of <em>labels</em> per stream (namespace, app, level) and stores compressed chunks of raw lines in object storage. Queries pick streams by label, then grep chunks in parallel. Ingest and storage are cheap; "find this string across all apps for 30 days" is slow and expensive.</p>
<pre># LogQL: errors in checkout in the last hour, parsed as JSON, slow ones only
{namespace="shop", app="checkout"} |= "error" | json | duration_ms &gt; 500

# metric from logs: 5xx per second per route
sum by (route) (rate({app="checkout"} | json | status &gt;= 500 [5m]))</pre>
<p>Loki rule #1: <strong>labels are for low-cardinality routing, content is for filtering</strong>. Never make <code>user_id</code>, <code>trace_id</code> or <code>pod</code> IP a label: each unique combination is a separate stream with its own chunks and index entries. Aim for streams in the thousands to tens of thousands, not millions.</p>
<p><strong>Elasticsearch/OpenSearch</strong> builds an inverted index of every token: arbitrary full-text search in milliseconds, aggregations on any field, but indexing costs CPU and the index plus replicas take roughly 1-1.5x the raw size (more with replicas), on fast disks, with JVM heaps to tune. Use ILM/ISM to roll hot → warm → cold → delete.</p>
<table>
<tr><th>Option</th><th>Indexes</th><th>Rough list price (verify, varies by region/contract)</th><th>Best for</th></tr>
<tr><td>Loki (self-hosted on S3)</td><td>Labels only</td><td>S3 ~$0.023/GB-month + compute; often &lt; $0.10 per GB ingested all-in</td><td>Kubernetes app logs, high volume, label-driven debugging</td></tr>
<tr><td>Elasticsearch / OpenSearch</td><td>Every token</td><td>Mostly compute + SSD; self-managed commonly $0.50-$1.50 per GB ingested at 30d retention</td><td>Security analytics, full-text search, ad-hoc aggregations</td></tr>
<tr><td>AWS CloudWatch Logs</td><td>Full-text scan (Logs Insights)</td><td>$0.50/GB ingest (Standard), $0.25/GB (Infrequent Access), $0.03/GB-month storage, $0.005/GB scanned</td><td>AWS-native, low ops, moderate volume</td></tr>
<tr><td>Azure Log Analytics</td><td>KQL over columnar store</td><td>Analytics logs ~$2.30/GB pay-as-you-go (31 days included), Basic/Auxiliary tiers much cheaper with query fees; commitment tiers discount</td><td>Azure-native, Sentinel</td></tr>
</table>
<blockquote>⚠️ Production tip: the bill is almost always <em>ingest volume</em>, not storage. 1 TB/day into Log Analytics Analytics tier at list price is ~$70k/month; the same into CloudWatch Standard is ~$15k/month. Cutting 40% of debug/health-check noise at the agent is worth more than any backend tuning.</blockquote>`,
        he: `<p><strong>Loki</strong> מאנדקס רק סט קטן של <em>labels</em> לכל stream (namespace, app, level) ושומר chunks דחוסים של השורות הגולמיות ב-object storage. שאילתה בוחרת streams לפי labels, ואז עושה grep על ה-chunks במקביל. ingest ואחסון זולים; "תמצא את המחרוזת הזו בכל האפליקציות ב-30 יום האחרונים" זה איטי ויקר.</p>
<pre># LogQL: errors in checkout in the last hour, parsed as JSON, slow ones only
{namespace="shop", app="checkout"} |= "error" | json | duration_ms &gt; 500

# metric from logs: 5xx per second per route
sum by (route) (rate({app="checkout"} | json | status &gt;= 500 [5m]))</pre>
<p>חוק מספר 1 ב-Loki: <strong>labels הם ל-routing עם cardinality נמוך, התוכן הוא לסינון</strong>. אף פעם אל תהפוך <code>user_id</code>, <code>trace_id</code> או IP של <code>pod</code> ל-label: כל צירוף ייחודי הוא stream נפרד עם chunks ורשומות index משלו. תכוון לאלפים עד עשרות אלפי streams, לא מיליונים.</p>
<p><strong>Elasticsearch/OpenSearch</strong> בונה inverted index לכל token: חיפוש full-text שרירותי במילישניות, אגרגציות על כל שדה, אבל האינדוקס עולה CPU וה-index בערך 1-1.5 מהגודל הגולמי (יותר עם רפליקות), על דיסקים מהירים, עם JVM heaps לכוונן. משתמשים ב-ILM/ISM כדי לגלגל hot ← warm ← cold ← delete.</p>
<table>
<tr><th>אפשרות</th><th>מה מאונדקס</th><th>מחיר מחירון בערך (תבדוק, משתנה לפי region וחוזה)</th><th>הכי מתאים ל-</th></tr>
<tr><td>Loki (self-hosted על S3)</td><td>רק labels</td><td>S3 בערך $0.023 ל-GB לחודש + compute; לרוב פחות מ-$0.10 ל-GB שנכנס, הכל כלול</td><td>לוגים של אפליקציות ב-Kubernetes, נפח גבוה, דיבאג לפי labels</td></tr>
<tr><td>Elasticsearch / OpenSearch</td><td>כל token</td><td>בעיקר compute + SSD; self-managed בדרך כלל $0.50-$1.50 ל-GB שנכנס עם retention של 30 יום</td><td>Security analytics, חיפוש full-text, אגרגציות אד-הוק</td></tr>
<tr><td>AWS CloudWatch Logs</td><td>סריקת full-text (Logs Insights)</td><td>$0.50 ל-GB ingest (Standard), $0.25 ל-GB (Infrequent Access), $0.03 ל-GB לחודש אחסון, $0.005 ל-GB שנסרק</td><td>AWS-native, מעט תפעול, נפח בינוני</td></tr>
<tr><td>Azure Log Analytics</td><td>KQL על store עמודתי</td><td>Analytics logs בערך $2.30 ל-GB ב-pay-as-you-go (31 יום כלולים), tiers של Basic/Auxiliary הרבה יותר זולים עם תשלום על שאילתות; commitment tiers נותנים הנחה</td><td>Azure-native, Sentinel</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: החשבון כמעט תמיד הוא <em>נפח ה-ingest</em>, לא האחסון. 1 TB ביום ל-Log Analytics ב-Analytics tier במחיר מחירון זה בערך $70k לחודש; אותו דבר ל-CloudWatch Standard זה בערך $15k לחודש. לחתוך 40% מרעש ה-debug וה-health checks ב-agent שווה יותר מכל כיוונון של ה-backend.</blockquote>`
      }
    },
    {
      h: { en: "Cost and compliance: drop, sample, redact, tier, archive, separate audit", he: "עלות ו-compliance: drop, sampling, redaction, tiers, ארכוב והפרדת audit" },
      body: {
        en: `<p>Order of operations in the pipeline, as early as possible (ideally in the agent):</p>
<ol>
<li><strong>Drop</strong> what nobody reads: DEBUG in prod, kube-probe health checks, successful <code>GET /healthz</code> access logs. Typical savings: 30-60% of volume.</li>
<li><strong>Sample</strong> high-volume, low-value INFO (keep 1 in 10 successful access logs; keep 100% of WARN/ERROR).</li>
<li><strong>Redact</strong> PII and secrets before data leaves the node: once an email or card number sits in 3 replicas and an S3 archive, deleting it for a GDPR request is a project.</li>
<li><strong>Route</strong> by type to different backends and retentions.</li>
</ol>
<pre>transforms:
  drop_noise:
    type: filter
    inputs: [k8s]
    condition: '.level != "debug" &amp;&amp; !match(string(.message) ?? "", r"kube-probe|GET /healthz")'
  sample_access:
    type: sample
    inputs: [drop_noise]
    rate: 10                          # keep 1 in 10 ...
    exclude: '.level == "error" || .level == "warn" || (.status ?? 0) &gt;= 500'
  redact:
    type: remap
    inputs: [sample_access]
    source: |
      .message = redact(string!(.message), filters: [r'\\b[\\w.+-]+@[\\w-]+\\.[\\w.]+\\b', r'\\b(?:\\d[ -]?){13,16}\\b'])
      del(.authorization)</pre>
<p><strong>Retention tiers</strong>: hot and searchable 7-14 days (that's where 95% of queries land), warm/cheaper 30-90 days, then archive compressed to S3 (gzip/zstd shrinks JSON logs 8-15x) with lifecycle to Glacier Instant/Flexible Retrieval for 1-7 years. Rehydrate on demand (Athena over S3, Loki/Elastic restore) when an investigation needs it.</p>
<p><strong>Audit logs are different</strong>: Kubernetes API audit, CloudTrail, database access, admin actions. Separate pipeline, <em>never</em> sampled or dropped, written to an append-only destination (S3 Object Lock in compliance mode, separate account), with retention driven by regulation (SOC 2, PCI DSS: 1 year with 3 months immediately available) and access restricted to security.</p>
<blockquote>💡 Real world: put a per-namespace volume dashboard (bytes/day by namespace from the agent's own metrics, e.g. <code>fluentbit_output_proc_bytes_total</code> or <code>vector_component_sent_event_bytes_total</code>) in front of every team. Showback ends the "one service logs every request body at INFO" problem faster than any policy.</blockquote>`,
        he: `<p>סדר הפעולות ב-pipeline, כמה שיותר מוקדם (אידיאלית ב-agent):</p>
<ol>
<li><strong>Drop</strong> למה שאף אחד לא קורא: DEBUG בפרודקשן, health checks של kube-probe, access logs של <code>GET /healthz</code> מוצלחים. חיסכון טיפוסי: 30-60% מהנפח.</li>
<li><strong>Sampling</strong> ל-INFO עם נפח גבוה וערך נמוך (שומרים 1 מכל 10 access logs מוצלחים; שומרים 100% מ-WARN/ERROR).</li>
<li><strong>Redaction</strong> ל-PII ולסודות לפני שהמידע יוצא מה-node: ברגע שמייל או מספר כרטיס יושבים ב-3 רפליקות ובארכיון ב-S3, למחוק אותם בגלל בקשת GDPR זה פרויקט.</li>
<li><strong>Routing</strong> לפי סוג ל-backends ו-retentions שונים.</li>
</ol>
<pre>transforms:
  drop_noise:
    type: filter
    inputs: [k8s]
    condition: '.level != "debug" &amp;&amp; !match(string(.message) ?? "", r"kube-probe|GET /healthz")'
  sample_access:
    type: sample
    inputs: [drop_noise]
    rate: 10                          # keep 1 in 10 ...
    exclude: '.level == "error" || .level == "warn" || (.status ?? 0) &gt;= 500'
  redact:
    type: remap
    inputs: [sample_access]
    source: |
      .message = redact(string!(.message), filters: [r'\\b[\\w.+-]+@[\\w-]+\\.[\\w.]+\\b', r'\\b(?:\\d[ -]?){13,16}\\b'])
      del(.authorization)</pre>
<p><strong>Retention tiers</strong>: hot וניתן לחיפוש 7-14 יום (שם נוחתות 95% מהשאילתות), warm וזול יותר 30-90 יום, ואז ארכוב דחוס ל-S3 (gzip/zstd מכווצים לוגים ב-JSON פי 8-15) עם lifecycle ל-Glacier Instant/Flexible Retrieval ל-1-7 שנים. מחזירים לחיים לפי דרישה (Athena על S3, restore ב-Loki/Elastic) כשחקירה צריכה את זה.</p>
<p><strong>Audit logs זה סיפור אחר</strong>: Kubernetes API audit, CloudTrail, גישה ל-DB, פעולות admin. Pipeline נפרד, <em>אף פעם</em> בלי sampling או drop, נכתב ליעד append-only (S3 Object Lock ב-compliance mode, account נפרד), עם retention שנקבע לפי רגולציה (SOC 2, PCI DSS: שנה, מתוכה 3 חודשים זמינים מיד) וגישה מוגבלת לצוות ה-security.</p>
<blockquote>💡 מהשטח: תשים מול כל צוות dashboard של נפח לפי namespace (בייטים ביום לפי namespace מה-metrics של ה-agent עצמו, למשל <code>fluentbit_output_proc_bytes_total</code> או <code>vector_component_sent_event_bytes_total</code>). Showback פותר את הבעיה של "שירות אחד מלגלג כל request body ב-INFO" מהר יותר מכל policy.</blockquote>`
      }
    }
  ],
  diagram: `  node 1..N
  [app pods] -> stdout -> /var/log/containers/*.log  (kubelet rotates 10Mi x5)
                                 |
                       DaemonSet agent (Fluent Bit / Vector / OTel)
                       tail -> parse/multiline -> k8s metadata
                       -> drop debug -> sample -> redact PII
                       -> disk buffer (backpressure)
                                 |
                  (optional) Kafka / aggregator tier
            +--------------------+--------------------+------------------+
            v                    v                    v                  v
      Loki (labels,        Elasticsearch/        CloudWatch /       Audit pipeline
      chunks on S3)        OpenSearch (FTS)      Log Analytics      (no sampling,
            |                    |                                   S3 Object Lock)
            +---- hot 7-14d -> warm 30-90d -> S3 archive / Glacier 1-7y`,
  handsOn: [
    { cmd: "kubectl -n logging logs ds/fluent-bit --tail=50 | grep -Ei 'retry|error|pause|chunk'", what: { en: "Look for retries, paused inputs and buffer overflow messages: the first signs of backpressure.", he: "מחפשים retries, inputs שנעצרו והודעות על buffer מלא: הסימנים הראשונים ל-backpressure." } },
    { cmd: "kubectl -n logging port-forward ds/fluent-bit 2020 & curl -s localhost:2020/api/v1/metrics/prometheus | grep -E 'output_(retries|dropped|errors)'", what: { en: "Fluent Bit's own metrics: retries_failed and dropped_records tell you whether logs are being lost.", he: "ה-metrics של Fluent Bit עצמו: retries_failed ו-dropped_records אומרים לך אם לוגים הולכים לאיבוד." } },
    { cmd: "logcli query '{namespace=\"shop\", app=\"checkout\"} |= \"error\" | json | status >= 500' --since=1h --limit=20", what: { en: "Run a LogQL query from the terminal against Loki.", he: "מריצים שאילתת LogQL מהטרמינל מול Loki." } },
    { cmd: "logcli series '{namespace=\"shop\"}' --analyze-labels --since=1h", what: { en: "See how many streams each label creates in Loki: catch a high-cardinality label before it hurts.", he: "רואים כמה streams כל label יוצר ב-Loki: תופסים label עם cardinality גבוה לפני שהוא כואב." } }
  ],
  mnemonic: {
    en: "\"Tail, Tag, Trim, Tier.\" Tail the files, tag with metadata, trim (drop, sample, redact) at the edge, tier the storage. In Loki: labels route, content filters.",
    he: "\"Tail, Tag, Trim, Tier.\" קוראים את הקבצים, מתייגים עם metadata, מקצצים (drop, sampling, redaction) בקצה, ומחלקים את האחסון ל-tiers. ב-Loki: labels מנתבים, התוכן מסנן."
  },
  pitfalls: [
    { en: "Putting trace_id, user_id or pod IP as Loki labels. Millions of tiny streams, a bloated index and 429s from the ingesters.", he: "לשים trace_id, user_id או IP של פוד כ-labels ב-Loki. מיליוני streams קטנטנים, index נפוח ו-429 מה-ingesters." },
    { en: "Memory-only buffers with no offset DB on hostPath. Every agent restart or backend outage silently loses or duplicates logs.", he: "Buffers רק בזיכרון בלי DB של offsets על hostPath. כל ריסטארט של ה-agent או נפילה של ה-backend מאבדים או משכפלים לוגים בשקט." },
    { en: "Sampling or dropping audit logs together with app logs. Audit needs its own unsampled, immutable pipeline.", he: "לעשות sampling או drop ל-audit logs יחד עם לוגים של אפליקציות. Audit צריך pipeline משלו, בלי sampling ובלתי ניתן לשינוי." },
    { en: "Redacting PII only in the backend UI (masking at query time). The raw data is still stored, replicated and archived.", he: "לעשות redaction ל-PII רק ב-UI של ה-backend (masking בזמן שאילתה). המידע הגולמי עדיין שמור, משוכפל ומאורכב." }
  ],
  interview: [
    {
      q: { en: "Your logging bill doubled in a month. How do you approach it?", he: "החשבון על לוגים הוכפל בחודש. איך אתה ניגש לזה?" },
      a: { en: "Measure first: bytes/day by namespace, app and level from the agent's metrics or the backend's usage tables. Usually 3-5 sources make 80% of volume (debug left on, access logs for health checks, request bodies logged, a crash loop spamming stack traces). Then fix at the edge: drop debug and probe noise in the agent, sample successful access logs, fix the chatty apps, move rarely queried streams to a cheaper tier (CloudWatch Infrequent Access, Log Analytics Basic), shorten hot retention and archive to S3. Add per-team showback and an alert on daily volume growth.", he: "קודם מודדים: בייטים ביום לפי namespace, אפליקציה ו-level מה-metrics של ה-agent או מטבלאות השימוש של ה-backend. בדרך כלל 3-5 מקורות מייצרים 80% מהנפח (debug שנשאר דלוק, access logs של health checks, request bodies בלוג, crash loop שמציף stack traces). ואז מתקנים בקצה: drop ל-debug ולרעש של probes ב-agent, sampling ל-access logs מוצלחים, תיקון האפליקציות הפטפטניות, העברת streams שכמעט לא נשאלים ל-tier זול (CloudWatch Infrequent Access, Log Analytics Basic), קיצור ה-hot retention וארכוב ל-S3. מוסיפים showback לכל צוות ו-alert על גדילה בנפח היומי." }
    },
    {
      q: { en: "Loki or Elasticsearch for Kubernetes application logs?", he: "Loki או Elasticsearch ללוגים של אפליקציות ב-Kubernetes?" },
      a: { en: "Default to Loki (or a managed equivalent) when debugging is label-driven ('show me checkout errors in prod-eu in the last hour') and volume is high: it's an order of magnitude cheaper because it only indexes labels and stores chunks in object storage. Choose Elasticsearch/OpenSearch when you need fast full-text search across everything, rich aggregations on arbitrary fields, or a SIEM use case. Many orgs run both: Loki for app logs, OpenSearch/SIEM for security and audit.", he: "ברירת המחדל היא Loki (או מקבילה managed) כשהדיבאג מונחה labels ('תראה לי שגיאות של checkout ב-prod-eu בשעה האחרונה') והנפח גבוה: זה זול בסדר גודל כי הוא מאנדקס רק labels ושומר chunks ב-object storage. בוחרים Elasticsearch/OpenSearch כשצריך חיפוש full-text מהיר על הכל, אגרגציות עשירות על שדות שרירותיים, או use case של SIEM. הרבה ארגונים מריצים את שניהם: Loki ללוגים של אפליקציות, OpenSearch/SIEM ל-security ו-audit." }
    }
  ],
  quiz: [
    {
      q: { en: "Which field is a good Loki label?", he: "איזה שדה הוא label טוב ב-Loki?" },
      options: [
        { en: "trace_id", he: "trace_id" },
        { en: "namespace", he: "namespace" },
        { en: "user_id", he: "user_id" },
        { en: "request path with IDs, e.g. /orders/98123", he: "request path עם IDs, למשל /orders/98123" }
      ],
      answer: 1,
      explain: { en: "Labels define streams and must be low-cardinality. High-cardinality values belong in the log content and are filtered with |= or | json.", he: "Labels מגדירים streams וחייבים להיות עם cardinality נמוך. ערכים עם cardinality גבוה שייכים לתוכן הלוג ומסננים אותם עם |= או | json." }
    },
    {
      q: { en: "Elasticsearch is returning 429s for 30 minutes. With a memory-only buffer and Mem_Buf_Limit, what does Fluent Bit do?", he: "Elasticsearch מחזיר 429 כבר 30 דקות. עם buffer רק בזיכרון ו-Mem_Buf_Limit, מה Fluent Bit עושה?" },
      options: [
        { en: "Writes the overflow to /tmp automatically", he: "כותב את העודף ל-/tmp אוטומטית" },
        { en: "Pauses the tail input when the limit is hit; if kubelet rotates files away meanwhile, those lines are lost", he: "עוצר את ה-tail input כשמגיעים ל-limit; אם ה-kubelet עושה rotation לקבצים בינתיים, השורות האלה הולכות לאיבוד" },
        { en: "Switches to Loki", he: "עובר ל-Loki" },
        { en: "Nothing, Elasticsearch buffers on its side", he: "כלום, Elasticsearch עושה buffering בצד שלו" }
      ],
      answer: 1,
      explain: { en: "That's backpressure with a memory buffer: input pauses, and kubelet log rotation (10Mi x 5 by default) eventually deletes unread data. Use a filesystem buffer and/or Kafka for durability.", he: "זה backpressure עם buffer בזיכרון: ה-input נעצר, וה-rotation של ה-kubelet (ברירת מחדל 10Mi x 5) בסוף מוחק מידע שלא נקרא. משתמשים ב-buffer על דיסק ו/או Kafka בשביל עמידות." }
    },
    {
      q: { en: "Where should PII redaction happen?", he: "איפה צריך לקרות ה-redaction של PII?" },
      options: [
        { en: "In the Grafana/Kibana UI at query time", he: "ב-UI של Grafana/Kibana בזמן השאילתה" },
        { en: "Only in the S3 archive", he: "רק בארכיון ב-S3" },
        { en: "As early as possible: in the app or the node agent, before data is shipped and replicated", he: "כמה שיותר מוקדם: באפליקציה או ב-agent על ה-node, לפני שהמידע נשלח ומשוכפל" },
        { en: "It isn't needed if the backend is encrypted at rest", he: "לא צריך אם ה-backend מוצפן at rest" }
      ],
      answer: 2,
      explain: { en: "Once PII is stored, it's replicated, backed up and archived. Encryption at rest doesn't stop anyone with query access from reading it.", he: "ברגע ש-PII נשמר, הוא משוכפל, מגובה ומאורכב. הצפנה at rest לא מונעת ממי שיש לו גישת שאילתה לקרוא אותו." }
    },
    {
      q: { en: "What usually dominates a managed logging bill (CloudWatch, Log Analytics, Datadog)?", he: "מה בדרך כלל שולט בחשבון של שירות לוגים managed (CloudWatch, Log Analytics, Datadog)?" },
      options: [
        { en: "Ingested GB", he: "כמות ה-GB שנכנסת (ingest)" },
        { en: "Number of dashboards", he: "מספר ה-dashboards" },
        { en: "Long-term S3 archive", he: "הארכיון לטווח ארוך ב-S3" },
        { en: "Number of agents", he: "מספר ה-agents" }
      ],
      answer: 0,
      explain: { en: "Ingest pricing (e.g. $0.50/GB CloudWatch Standard, ~$2.30/GB Log Analytics Analytics) dwarfs storage ($0.03/GB-month) and S3 archive. Reduce volume at the source.", he: "תמחור ה-ingest (למשל $0.50 ל-GB ב-CloudWatch Standard, בערך $2.30 ל-GB ב-Log Analytics Analytics) מגמד את האחסון ($0.03 ל-GB לחודש) ואת הארכיון ב-S3. מקטינים נפח במקור." }
    }
  ],
  related: ["obs-logs", "obs-otel-collector", "obs-traces", "pr-privacy", "cloud-finops"]
});

window.INFRA.lessons.push({
  id: "obs-otel-collector",
  track: "observability",
  order: 22,
  icon: "🛰️",
  level: 3,
  minutes: 15,
  title: { en: "OpenTelemetry Collector & Sampling", he: "OpenTelemetry Collector ו-sampling" },
  tldr: {
    en: "The OTel Collector is a vendor-neutral telemetry router: receivers → processors → exporters per signal; run it as a node agent for local enrichment and as a gateway for tail sampling, auth and fan-out, always with memory_limiter first and batch near the end.",
    he: "ה-OTel Collector הוא router ל-telemetry שלא קשור לאף vendor: receivers ← processors ← exporters לכל סוג סיגנל; מריצים אותו כ-agent על כל node להעשרה מקומית וכ-gateway ל-tail sampling, אימות ו-fan-out, ותמיד עם memory_limiter ראשון ו-batch קרוב לסוף."
  },
  analogy: {
    en: "The Collector is an airport hub. Receivers are the arrival gates (OTLP, Prometheus, filelog), processors are security, passport control and baggage tagging (memory_limiter, k8sattributes, batch), exporters are departure gates to any airline (Tempo, Datadog, Jaeger, S3). Tail sampling is the customs officer who waits until the whole family has landed before deciding who gets a closer look: which only works if the whole family lands at the same hub.",
    he: "ה-Collector הוא שדה תעופה מרכזי. Receivers הם שערי הנחיתה (OTLP, Prometheus, filelog), processors הם הביטחון, ביקורת הדרכונים ותיוג המזוודות (memory_limiter, k8sattributes, batch), ו-exporters הם שערי היציאה לכל חברת תעופה (Tempo, Datadog, Jaeger, S3). Tail sampling זה איש המכס שמחכה שכל המשפחה תנחת לפני שהוא מחליט את מי לבדוק יותר לעומק: וזה עובד רק אם כל המשפחה נוחתת באותו שדה."
  },
  sections: [
    {
      h: { en: "The pipeline model", he: "מודל ה-pipeline" },
      body: {
        en: `<p>A Collector config declares components, then wires them into <strong>pipelines</strong> per signal (traces, metrics, logs). Nothing runs unless it's listed under <code>service.pipelines</code>. <strong>Connectors</strong> (e.g. <code>spanmetrics</code>) act as an exporter of one pipeline and a receiver of another.</p>
<pre>receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }
  prometheus:
    config:
      scrape_configs:
        - job_name: app
          kubernetes_sd_configs: [ { role: pod } ]

processors:
  memory_limiter: { check_interval: 1s, limit_percentage: 80, spike_limit_percentage: 25 }
  k8sattributes: {}
  resourcedetection: { detectors: [env, eks, ec2, system], timeout: 2s }
  batch: { send_batch_size: 8192, send_batch_max_size: 10000, timeout: 200ms }

connectors:
  spanmetrics: {}          # RED metrics computed from 100% of spans

exporters:
  otlp/tempo: { endpoint: tempo-distributor.observability:4317, tls: { insecure: true } }
  prometheusremotewrite: { endpoint: http://mimir.observability/api/v1/push }
  otlphttp/vendor:
    endpoint: https://otlp.vendor.example
    headers: { api-key: "\${env:VENDOR_API_KEY}" }
    sending_queue: { enabled: true, num_consumers: 10, queue_size: 5000 }
    retry_on_failure: { enabled: true, max_elapsed_time: 300s }

service:
  pipelines:
    traces:
      receivers:  [otlp]
      processors: [memory_limiter, k8sattributes, resourcedetection, batch]
      exporters:  [otlp/tempo, spanmetrics]
    metrics:
      receivers:  [otlp, prometheus, spanmetrics]
      processors: [memory_limiter, k8sattributes, batch]
      exporters:  [prometheusremotewrite]</pre>
<p>Ship the <code>otelcol-contrib</code> distribution (or build a slim one with <code>ocb</code>, the OpenTelemetry Collector Builder): core <code>otelcol</code> lacks k8sattributes, tail_sampling and most vendor exporters.</p>
<blockquote>💡 Real world: the Collector exposes its own metrics on <code>:8888</code>. Alert on <code>otelcol_exporter_send_failed_spans</code>, <code>otelcol_exporter_queue_size</code> approaching <code>otelcol_exporter_queue_capacity</code>, and <code>otelcol_processor_refused_spans</code> (memory_limiter pushing back).</blockquote>`,
        he: `<p>קונפיג של Collector מצהיר על רכיבים, ואז מחבר אותם ל-<strong>pipelines</strong> לכל סוג סיגנל (traces, metrics, logs). שום דבר לא רץ אם הוא לא מופיע תחת <code>service.pipelines</code>. <strong>Connectors</strong> (למשל <code>spanmetrics</code>) משמשים כ-exporter של pipeline אחד וכ-receiver של אחר.</p>
<pre>receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }
  prometheus:
    config:
      scrape_configs:
        - job_name: app
          kubernetes_sd_configs: [ { role: pod } ]

processors:
  memory_limiter: { check_interval: 1s, limit_percentage: 80, spike_limit_percentage: 25 }
  k8sattributes: {}
  resourcedetection: { detectors: [env, eks, ec2, system], timeout: 2s }
  batch: { send_batch_size: 8192, send_batch_max_size: 10000, timeout: 200ms }

connectors:
  spanmetrics: {}          # RED metrics computed from 100% of spans

exporters:
  otlp/tempo: { endpoint: tempo-distributor.observability:4317, tls: { insecure: true } }
  prometheusremotewrite: { endpoint: http://mimir.observability/api/v1/push }
  otlphttp/vendor:
    endpoint: https://otlp.vendor.example
    headers: { api-key: "\${env:VENDOR_API_KEY}" }
    sending_queue: { enabled: true, num_consumers: 10, queue_size: 5000 }
    retry_on_failure: { enabled: true, max_elapsed_time: 300s }

service:
  pipelines:
    traces:
      receivers:  [otlp]
      processors: [memory_limiter, k8sattributes, resourcedetection, batch]
      exporters:  [otlp/tempo, spanmetrics]
    metrics:
      receivers:  [otlp, prometheus, spanmetrics]
      processors: [memory_limiter, k8sattributes, batch]
      exporters:  [prometheusremotewrite]</pre>
<p>תשתמש בהפצה <code>otelcol-contrib</code> (או תבנה הפצה רזה עם <code>ocb</code>, ה-OpenTelemetry Collector Builder): ב-<code>otelcol</code> הבסיסי אין k8sattributes, tail_sampling ורוב ה-exporters של vendors.</p>
<blockquote>💡 מהשטח: ה-Collector חושף metrics משלו על <code>:8888</code>. תעשה alert על <code>otelcol_exporter_send_failed_spans</code>, על <code>otelcol_exporter_queue_size</code> שמתקרב ל-<code>otelcol_exporter_queue_capacity</code>, ועל <code>otelcol_processor_refused_spans</code> (ה-memory_limiter דוחף אחורה).</blockquote>`
      }
    },
    {
      h: { en: "Agent vs gateway deployment", he: "פריסת agent מול gateway" },
      body: {
        en: `<table>
<tr><th></th><th>Agent (DaemonSet / sidecar)</th><th>Gateway (Deployment + HPA)</th></tr>
<tr><td>Where</td><td>One per node, apps send to the node IP (<code>status.hostIP</code>:4317)</td><td>Central pool behind a Service, per cluster or region</td></tr>
<tr><td>Jobs</td><td>Receive OTLP locally, hostmetrics, filelog, kubelet stats, k8sattributes enrichment, first batching</td><td>Tail sampling, auth/API keys, redaction, routing and fan-out to multiple backends, cross-cluster aggregation</td></tr>
<tr><td>Why</td><td>Cheap hop (no cross-AZ), apps offload quickly, node-level context</td><td>One place for secrets and policy; enough memory to hold traces for sampling decisions</td></tr>
</table>
<pre># app Deployment: send to the node-local agent
env:
  - name: NODE_IP
    valueFrom: { fieldRef: { fieldPath: status.hostIP } }
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(NODE_IP):4317
  - name: OTEL_SERVICE_NAME
    value: checkout
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: deployment.environment=prod,service.version=1.42.0</pre>
<p>The <strong>OpenTelemetry Operator</strong> manages <code>OpenTelemetryCollector</code> CRs (mode: daemonset / deployment / statefulset / sidecar) and can auto-inject SDKs via the <code>Instrumentation</code> CR plus an annotation like <code>instrumentation.opentelemetry.io/inject-java: "true"</code>.</p>
<blockquote>⚠️ Production tip: a gateway behind a normal Kubernetes Service breaks tail sampling: spans of one trace land on different replicas, and each sees only fragments. Use a two-tier gateway: tier 1 with the <code>loadbalancing</code> exporter (<code>routing_key: traceID</code>, resolver: k8s or DNS on a headless Service) → tier 2 replicas that run <code>tail_sampling</code>.</blockquote>`,
        he: `<table>
<tr><th></th><th>Agent (DaemonSet / sidecar)</th><th>Gateway (Deployment + HPA)</th></tr>
<tr><td>איפה</td><td>אחד לכל node, האפליקציות שולחות ל-IP של ה-node (<code>status.hostIP</code>:4317)</td><td>Pool מרכזי מאחורי Service, לכל cluster או region</td></tr>
<tr><td>תפקידים</td><td>קבלת OTLP מקומית, hostmetrics, filelog, kubelet stats, העשרה עם k8sattributes, batching ראשוני</td><td>Tail sampling, אימות ו-API keys, redaction, routing ו-fan-out לכמה backends, אגרגציה בין קלאסטרים</td></tr>
<tr><td>למה</td><td>Hop זול (בלי cross-AZ), האפליקציות מתפנות מהר, הקשר ברמת ה-node</td><td>מקום אחד לסודות ול-policy; מספיק זיכרון להחזיק traces עד החלטת ה-sampling</td></tr>
</table>
<pre># app Deployment: send to the node-local agent
env:
  - name: NODE_IP
    valueFrom: { fieldRef: { fieldPath: status.hostIP } }
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(NODE_IP):4317
  - name: OTEL_SERVICE_NAME
    value: checkout
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: deployment.environment=prod,service.version=1.42.0</pre>
<p>ה-<strong>OpenTelemetry Operator</strong> מנהל CRs של <code>OpenTelemetryCollector</code> (mode: daemonset / deployment / statefulset / sidecar) ויודע להזריק SDKs אוטומטית דרך ה-CR של <code>Instrumentation</code> יחד עם annotation כמו <code>instrumentation.opentelemetry.io/inject-java: "true"</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: gateway מאחורי Service רגיל של Kubernetes שובר tail sampling: ה-spans של trace אחד נוחתים על רפליקות שונות, וכל אחת רואה רק חתיכות. משתמשים ב-gateway בשתי שכבות: שכבה 1 עם ה-exporter של <code>loadbalancing</code> (<code>routing_key: traceID</code>, resolver של k8s או DNS על headless Service) ← רפליקות בשכבה 2 שמריצות <code>tail_sampling</code>.</blockquote>`
      }
    },
    {
      h: { en: "memory_limiter, batch and not losing data", he: "memory_limiter, batch ואיך לא לאבד מידע" },
      body: {
        en: `<p><strong>memory_limiter</strong> must be the <em>first</em> processor in every pipeline. It checks heap usage every <code>check_interval</code>; above the soft limit (<code>limit - spike_limit</code>) it refuses new data (receivers return errors / gRPC <code>RESOURCE_EXHAUSTED</code>, so SDKs retry), above the hard limit it forces GC. With <code>limit_percentage: 80</code> and <code>spike_limit_percentage: 25</code> in a 2 GiB container: soft limit ≈ 1.1 GiB, hard ≈ 1.6 GiB. Also set <code>GOMEMLIMIT</code> to ~80% of the container limit so the Go GC works before the kernel OOM-kills.</p>
<p><strong>batch</strong> goes <em>after</em> filtering/sampling processors (no point batching what you'll drop) and before exporters. It cuts per-request overhead dramatically: 8192 spans per export instead of thousands of tiny RPCs. <code>timeout: 200ms</code> bounds the added latency.</p>
<p>Exporters have their own <strong>sending_queue</strong> (in-memory by default) and <strong>retry_on_failure</strong> with exponential backoff. For durability across Collector restarts, back the queue with the <code>file_storage</code> extension:</p>
<pre>extensions:
  file_storage: { directory: /var/lib/otelcol/queue }
exporters:
  otlp/tempo:
    endpoint: tempo:4317
    sending_queue: { enabled: true, storage: file_storage, queue_size: 10000 }
service:
  extensions: [file_storage]</pre>
<blockquote>💡 Real world: recommended processor order: <code>memory_limiter → (k8sattributes, resourcedetection) → (filter, transform, redaction) → (tail_sampling) → batch</code>. Getting memory_limiter wrong (last, or missing) is how a traffic spike turns into a crash-looping Collector and dropped telemetry exactly during the incident you need it for.</blockquote>`,
        he: `<p><strong>memory_limiter</strong> חייב להיות ה-processor ה<em>ראשון</em> בכל pipeline. הוא בודק את ה-heap בכל <code>check_interval</code>; מעל ה-soft limit (<code>limit - spike_limit</code>) הוא מסרב לקבל מידע חדש (ה-receivers מחזירים שגיאות / gRPC <code>RESOURCE_EXHAUSTED</code>, אז ה-SDKs עושים retry), ומעל ה-hard limit הוא מכריח GC. עם <code>limit_percentage: 80</code> ו-<code>spike_limit_percentage: 25</code> בקונטיינר של 2 GiB: soft limit ≈ 1.1 GiB, hard ≈ 1.6 GiB. תגדיר גם <code>GOMEMLIMIT</code> לבערך 80% מה-limit של הקונטיינר כדי שה-GC של Go יעבוד לפני שה-kernel עושה OOM kill.</p>
<p><strong>batch</strong> בא <em>אחרי</em> processors של סינון ו-sampling (אין טעם לעשות batch למה שתזרוק) ולפני ה-exporters. הוא מוריד דרמטית את ה-overhead לכל request: 8192 spans בכל export במקום אלפי RPCs קטנים. <code>timeout: 200ms</code> מגביל את ה-latency שהוא מוסיף.</p>
<p>ל-exporters יש <strong>sending_queue</strong> משלהם (בזיכרון כברירת מחדל) ו-<strong>retry_on_failure</strong> עם exponential backoff. בשביל עמידות בריסטארט של ה-Collector, מגבים את התור עם ה-extension של <code>file_storage</code>:</p>
<pre>extensions:
  file_storage: { directory: /var/lib/otelcol/queue }
exporters:
  otlp/tempo:
    endpoint: tempo:4317
    sending_queue: { enabled: true, storage: file_storage, queue_size: 10000 }
service:
  extensions: [file_storage]</pre>
<blockquote>💡 מהשטח: הסדר המומלץ של ה-processors: <code>memory_limiter → (k8sattributes, resourcedetection) → (filter, transform, redaction) → (tail_sampling) → batch</code>. לטעות ב-memory_limiter (אחרון, או חסר) זה בדיוק איך ש-spike בתעבורה הופך ל-Collector ב-crash loop ול-telemetry שהולך לאיבוד בדיוק באירוע שאתה צריך אותו.</blockquote>`
      }
    },
    {
      h: { en: "Head vs tail sampling", he: "Head sampling מול tail sampling" },
      body: {
        en: `<p><strong>Head sampling</strong> decides at the root span, before anything is known about the outcome, and propagates the decision via the <code>sampled</code> flag in <code>traceparent</code>. Cheap, stateless, consistent across services, but blind: at 5% you keep only 5% of your errors too.</p>
<pre># SDK env vars: sample 10% of new traces, respect the parent's decision
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1</pre>
<p><strong>Tail sampling</strong> buffers all spans of a trace in the Collector for <code>decision_wait</code>, then decides with full knowledge: keep every error, every slow trace, and a small random slice of the rest.</p>
<pre>processors:
  tail_sampling:
    decision_wait: 10s          # wait for late spans of the trace
    num_traces: 200000          # traces held in memory at once
    expected_new_traces_per_sec: 5000
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 500 }
      - name: vip-tenants
        type: string_attribute
        string_attribute: { key: tenant.tier, values: [enterprise] }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }</pre>
<p>Policies are OR-ed: a trace is kept if any policy says sample (use <code>and</code> / <code>composite</code> policies for more complex logic). Memory math: 5,000 new traces/s × 10s wait × ~20 spans × ~1 KB ≈ <strong>1 GB</strong> of buffered spans per replica if traffic is not split: size accordingly.</p>
<blockquote>⚠️ Production tip: compute RED metrics (rate, errors, duration) <em>before</em> sampling, e.g. with the <code>spanmetrics</code> connector on the agent or in tier 1. Metrics derived after a 5% sample are wrong by design. Many teams combine both: head sampling at 25-50% in SDKs to cap volume, then tail sampling in the gateway.</blockquote>`,
        he: `<p><strong>Head sampling</strong> מחליט ב-root span, לפני שידוע משהו על התוצאה, ומעביר את ההחלטה הלאה דרך הדגל <code>sampled</code> ב-<code>traceparent</code>. זול, בלי state, עקבי בין שירותים, אבל עיוור: ב-5% אתה שומר גם רק 5% מהשגיאות שלך.</p>
<pre># SDK env vars: sample 10% of new traces, respect the parent's decision
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1</pre>
<p><strong>Tail sampling</strong> מחזיק בזיכרון של ה-Collector את כל ה-spans של trace למשך <code>decision_wait</code>, ואז מחליט עם כל המידע: שומר כל שגיאה, כל trace איטי, ופרוסה רנדומלית קטנה מהשאר.</p>
<pre>processors:
  tail_sampling:
    decision_wait: 10s          # wait for late spans of the trace
    num_traces: 200000          # traces held in memory at once
    expected_new_traces_per_sec: 5000
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 500 }
      - name: vip-tenants
        type: string_attribute
        string_attribute: { key: tenant.tier, values: [enterprise] }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }</pre>
<p>בין ה-policies יש OR: trace נשמר אם policy כלשהו אומר sample (ללוגיקה מורכבת יותר יש policies של <code>and</code> / <code>composite</code>). חשבון זיכרון: 5,000 traces חדשים בשנייה × 10 שניות המתנה × בערך 20 spans × בערך 1 KB ≈ <strong>1 GB</strong> של spans בבאפר לרפליקה אם התעבורה לא מפוצלת: תתכנן בהתאם.</p>
<blockquote>⚠️ טיפ לפרודקשן: תחשב RED metrics (rate, errors, duration) <em>לפני</em> ה-sampling, למשל עם ה-connector של <code>spanmetrics</code> ב-agent או בשכבה 1. Metrics שנגזרים אחרי sample של 5% שגויים מעצם ההגדרה. הרבה צוותים משלבים: head sampling של 25-50% ב-SDKs כדי להגביל נפח, ואז tail sampling ב-gateway.</blockquote>`
      }
    },
    {
      h: { en: "Resource detection, k8sattributes, exemplars and vendor neutrality", he: "Resource detection, k8sattributes, exemplars ו-vendor neutrality" },
      body: {
        en: `<p>Telemetry is only useful if you can tell <em>where</em> it came from. <strong>resourcedetection</strong> adds cloud/host attributes (<code>cloud.provider</code>, <code>cloud.region</code>, <code>host.id</code>, <code>k8s.cluster.name</code> on EKS/GKE/AKS). <strong>k8sattributes</strong> maps the sender's pod IP (or <code>k8s.pod.uid</code>) to Kubernetes metadata via the API server:</p>
<pre>processors:
  k8sattributes:
    auth_type: serviceAccount
    passthrough: false
    filter: { node_from_env_var: K8S_NODE_NAME }   # agent: only watch pods on this node
    extract:
      metadata: [k8s.namespace.name, k8s.pod.name, k8s.deployment.name, k8s.node.name, container.image.tag]
      labels:
        - { tag_name: team, key: team, from: pod }
    pod_association:
      - sources: [ { from: resource_attribute, name: k8s.pod.ip } ]
      - sources: [ { from: connection } ]</pre>
<p>It needs a ClusterRole with <code>get/watch/list</code> on pods, namespaces and replicasets. In a gateway behind an agent, the connection IP is the agent's, so the agent must do the enrichment (or set <code>passthrough: true</code> on the agent to forward the pod IP).</p>
<p><strong>Exemplars</strong> attach a trace ID to a metric sample, so a spike on a latency histogram links to an actual slow trace. In OpenMetrics exposition it looks like:</p>
<pre>http_request_duration_seconds_bucket{le="0.5"} 9381 # {trace_id="4bf92f3577b34da6a3ce929d0e0e4736"} 0.47 1731571200.123</pre>
<p>Enable storage with Prometheus <code>--enable-feature=exemplar-storage</code> (and scrape with OpenMetrics negotiation), or let spanmetrics/OTLP carry them to Mimir; in Grafana, turn on exemplars on the panel and link the data source to Tempo/Jaeger. Click a dot on the p99 graph → open that trace.</p>
<p><strong>Vendor neutrality</strong>: apps speak OTLP to the Collector, never to a vendor SDK. Switching from Datadog to Grafana Cloud or Honeycomb (or sending to both during a migration) is a Collector config change, not a code change across 200 services.</p>
<blockquote>💡 Real world: semantic conventions matter as much as the pipe. Agree on <code>service.name</code>, <code>service.version</code>, <code>deployment.environment</code> everywhere: they are the join keys between metrics, logs and traces in every backend.</blockquote>`,
        he: `<p>Telemetry שימושי רק אם אפשר לדעת <em>מאיפה</em> הוא הגיע. <strong>resourcedetection</strong> מוסיף attributes של ענן ו-host (<code>cloud.provider</code>, <code>cloud.region</code>, <code>host.id</code>, <code>k8s.cluster.name</code> ב-EKS/GKE/AKS). <strong>k8sattributes</strong> ממפה את ה-IP של הפוד ששלח (או <code>k8s.pod.uid</code>) ל-metadata של Kubernetes דרך ה-API server:</p>
<pre>processors:
  k8sattributes:
    auth_type: serviceAccount
    passthrough: false
    filter: { node_from_env_var: K8S_NODE_NAME }   # agent: only watch pods on this node
    extract:
      metadata: [k8s.namespace.name, k8s.pod.name, k8s.deployment.name, k8s.node.name, container.image.tag]
      labels:
        - { tag_name: team, key: team, from: pod }
    pod_association:
      - sources: [ { from: resource_attribute, name: k8s.pod.ip } ]
      - sources: [ { from: connection } ]</pre>
<p>הוא צריך ClusterRole עם <code>get/watch/list</code> על pods, namespaces ו-replicasets. ב-gateway שמאחורי agent, ה-IP של החיבור הוא של ה-agent, אז ה-agent חייב לעשות את ההעשרה (או להגדיר <code>passthrough: true</code> ב-agent כדי להעביר את ה-IP של הפוד).</p>
<p><strong>Exemplars</strong> מצמידים trace ID לדגימה של metric, כך ש-spike ב-histogram של latency מקושר ל-trace איטי אמיתי. בפורמט OpenMetrics זה נראה כך:</p>
<pre>http_request_duration_seconds_bucket{le="0.5"} 9381 # {trace_id="4bf92f3577b34da6a3ce929d0e0e4736"} 0.47 1731571200.123</pre>
<p>מפעילים אחסון עם <code>--enable-feature=exemplar-storage</code> ב-Prometheus (ו-scrape עם OpenMetrics), או נותנים ל-spanmetrics/OTLP להעביר אותם ל-Mimir; ב-Grafana מדליקים exemplars בפאנל ומקשרים את ה-data source ל-Tempo/Jaeger. לוחצים על נקודה בגרף ה-p99 ← נפתח ה-trace הזה.</p>
<p><strong>Vendor neutrality</strong>: האפליקציות מדברות OTLP עם ה-Collector, אף פעם לא עם SDK של vendor. מעבר מ-Datadog ל-Grafana Cloud או Honeycomb (או שליחה לשניהם בזמן מיגרציה) זה שינוי בקונפיג של ה-Collector, לא שינוי קוד ב-200 שירותים.</p>
<blockquote>💡 מהשטח: ה-semantic conventions חשובים כמו הצנרת. תסכים על <code>service.name</code>, <code>service.version</code>, <code>deployment.environment</code> בכל מקום: הם מפתחות ה-join בין metrics, לוגים ו-traces בכל backend.</blockquote>`
      }
    }
  ],
  diagram: `  app pods (OTel SDK, OTLP)          node: hostmetrics, filelog
        |  -> $(NODE_IP):4317               |
        v                                   v
  +------------------- AGENT (DaemonSet) -------------------+
  | memory_limiter -> k8sattributes -> resourcedetection    |
  | -> spanmetrics (RED from 100% of spans) -> batch        |
  +-----------------------------+---------------------------+
                                | OTLP
        GATEWAY tier 1: loadbalancing exporter (routing_key: traceID)
                                |  all spans of a trace -> same replica
        GATEWAY tier 2: memory_limiter -> tail_sampling
                        (errors | latency>500ms | 5% baseline) -> batch
                 +--------------+--------------+
                 v              v              v
              Tempo         Mimir/Prom      Vendor (Datadog, Honeycomb...)
  Grafana: p99 panel --exemplar trace_id--> Tempo trace view`,
  handsOn: [
    { cmd: "otelcol-contrib validate --config=collector.yaml", what: { en: "Validate a Collector config (unknown components, unwired pipelines) before deploying it.", he: "בודקים קונפיג של Collector (רכיבים לא מוכרים, pipelines לא מחוברים) לפני שפורסים אותו." } },
    { cmd: "kubectl -n observability port-forward ds/otel-agent 8888 & curl -s localhost:8888/metrics | grep -E 'otelcol_(exporter_(send_failed|queue_size)|processor_refused)'", what: { en: "Collector self-metrics: failed sends, queue fill and memory_limiter refusals.", he: "ה-metrics של ה-Collector עצמו: שליחות שנכשלו, מילוי התור וסירובים של ה-memory_limiter." } },
    { cmd: "kubectl -n observability port-forward deploy/otel-gateway 55679 & curl -s localhost:55679/debug/tracez | head -40", what: { en: "zpages extension: live view of pipelines and recent spans inside the Collector (enable the zpages extension first).", he: "ה-extension של zpages: תצוגה חיה של ה-pipelines וה-spans האחרונים בתוך ה-Collector (צריך להפעיל קודם את zpages)." } },
    { cmd: "OTEL_TRACES_SAMPLER=parentbased_traceidratio OTEL_TRACES_SAMPLER_ARG=0.1 OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 java -javaagent:opentelemetry-javaagent.jar -jar app.jar", what: { en: "Run a Java app with the auto-instrumentation agent and 10% head sampling.", he: "מריצים אפליקציית Java עם ה-agent של auto-instrumentation ו-head sampling של 10%." } }
  ],
  mnemonic: {
    en: "\"Receive, Protect, Enrich, Decide, Batch, Export.\" Memory_limiter first, batch last. Tail sampling needs the whole trace in one place, and metrics must be counted before you sample.",
    he: "\"Receive, Protect, Enrich, Decide, Batch, Export.\" memory_limiter ראשון, batch אחרון. Tail sampling צריך את כל ה-trace במקום אחד, ואת ה-metrics סופרים לפני שעושים sampling."
  },
  pitfalls: [
    { en: "Running tail_sampling on a gateway Deployment behind a plain Service. Spans of one trace hit different replicas and decisions are made on fragments.", he: "להריץ tail_sampling על Deployment של gateway מאחורי Service רגיל. ה-spans של trace אחד מגיעים לרפליקות שונות וההחלטות מתקבלות על חתיכות." },
    { en: "Putting memory_limiter last or omitting it. A spike OOM-kills the Collector, and with in-memory queues all buffered telemetry is gone.", he: "לשים את memory_limiter אחרון או לוותר עליו. Spike הורג את ה-Collector ב-OOM, ועם תורים בזיכרון כל ה-telemetry שבבאפר נעלם." },
    { en: "Deriving error rates and latency from sampled traces. Use spanmetrics before sampling or app-side metrics.", he: "לגזור error rates ו-latency מ-traces אחרי sampling. משתמשים ב-spanmetrics לפני ה-sampling או ב-metrics מהאפליקציה." },
    { en: "Running k8sattributes only in a gateway that receives from agents: every span gets the agent pod's metadata instead of the app's.", he: "להריץ k8sattributes רק ב-gateway שמקבל מ-agents: כל span מקבל את ה-metadata של הפוד של ה-agent במקום של האפליקציה." }
  ],
  interview: [
    {
      q: { en: "Design trace sampling for 50k requests/s where you must keep all errors and slow requests.", he: "תתכנן trace sampling ל-50 אלף requests בשנייה כשחייבים לשמור את כל השגיאות וה-requests האיטיים." },
      a: { en: "Head sampling alone can't guarantee errors are kept, so use tail sampling in a gateway. Agents (DaemonSet) receive OTLP, enrich with k8sattributes and compute spanmetrics on 100% of spans for accurate RED metrics. They export to tier-1 gateways running the loadbalancing exporter keyed on traceID, so all spans of a trace reach the same tier-2 replica. Tier 2 runs memory_limiter → tail_sampling (status_code ERROR, latency > SLO threshold, 1-5% probabilistic) → batch → backend. Size tier 2 for traces/s × decision_wait × spans × bytes, autoscale on CPU/memory, and optionally add 50% head sampling in SDKs if cost requires it (accepting you'd then keep only half the errors).", he: "Head sampling לבד לא יכול להבטיח ששגיאות יישמרו, אז משתמשים ב-tail sampling ב-gateway. ה-agents (DaemonSet) מקבלים OTLP, מעשירים עם k8sattributes ומחשבים spanmetrics על 100% מה-spans בשביל RED metrics מדויקים. הם שולחים ל-gateways בשכבה 1 שמריצים את ה-exporter של loadbalancing לפי traceID, כך שכל ה-spans של trace מגיעים לאותה רפליקה בשכבה 2. שכבה 2 מריצה memory_limiter ← tail_sampling (status_code ERROR, latency מעל סף ה-SLO, 1-5% probabilistic) ← batch ← backend. עושים sizing לשכבה 2 לפי traces בשנייה × decision_wait × spans × bytes, autoscaling לפי CPU/זיכרון, ואופציונלית head sampling של 50% ב-SDKs אם העלות מחייבת (בידיעה שאז נשמרות רק חצי מהשגיאות)." }
    },
    {
      q: { en: "Why put a Collector between apps and the vendor instead of using the vendor's agent/SDK directly?", he: "למה לשים Collector בין האפליקציות ל-vendor במקום להשתמש ישירות ב-agent או ב-SDK של ה-vendor?" },
      a: { en: "Vendor neutrality (switch or dual-ship by config), central policy (redaction, attribute filtering, sampling, cost control), secrets kept out of apps, retries and buffering offloaded from app processes, consistent enrichment (k8s/cloud attributes), and one standard (OTLP + semantic conventions) across languages. The cost is another component to operate and monitor.", he: "Vendor neutrality (להחליף או לשלוח לשניים דרך קונפיג), policy מרכזי (redaction, סינון attributes, sampling, שליטה בעלות), סודות שלא יושבים באפליקציות, retries ו-buffering שיורדים מתהליכי האפליקציה, העשרה עקבית (attributes של k8s וענן), ותקן אחד (OTLP + semantic conventions) בכל השפות. המחיר: עוד רכיב לתפעל ולנטר." }
    }
  ],
  quiz: [
    {
      q: { en: "Which processor should come first in every Collector pipeline?", he: "איזה processor צריך להיות ראשון בכל pipeline של Collector?" },
      options: [
        { en: "batch", he: "batch" },
        { en: "tail_sampling", he: "tail_sampling" },
        { en: "memory_limiter", he: "memory_limiter" },
        { en: "k8sattributes", he: "k8sattributes" }
      ],
      answer: 2,
      explain: { en: "memory_limiter must see data first so it can refuse ingestion before the process runs out of memory. batch goes near the end.", he: "memory_limiter חייב לראות את המידע ראשון כדי שיוכל לסרב לקבל אותו לפני שלתהליך נגמר הזיכרון. batch בא קרוב לסוף." }
    },
    {
      q: { en: "With head sampling at 5%, what fraction of error traces do you keep?", he: "עם head sampling של 5%, איזה חלק מה-traces עם שגיאות נשמר?" },
      options: [
        { en: "100%, errors are always kept", he: "100%, שגיאות תמיד נשמרות" },
        { en: "About 5%, the decision is made before the outcome is known", he: "בערך 5%, ההחלטה מתקבלת לפני שהתוצאה ידועה" },
        { en: "0%", he: "0%" },
        { en: "50%", he: "50%" }
      ],
      answer: 1,
      explain: { en: "Head sampling decides at the root span, so it's blind to errors and latency. Tail sampling is how you keep all errors.", he: "Head sampling מחליט ב-root span, אז הוא עיוור לשגיאות ול-latency. Tail sampling זו הדרך לשמור את כל השגיאות." }
    },
    {
      q: { en: "Your tail-sampling gateway has 6 replicas behind a ClusterIP Service and traces look broken. Fix?", he: "ל-gateway של ה-tail sampling יש 6 רפליקות מאחורי Service מסוג ClusterIP, וה-traces נראים שבורים. מה התיקון?" },
      options: [
        { en: "Increase decision_wait to 60s", he: "להגדיל את decision_wait ל-60 שניות" },
        { en: "Scale down to 1 replica permanently", he: "לרדת לרפליקה אחת לתמיד" },
        { en: "Add a tier using the loadbalancing exporter with routing_key traceID in front of the sampling replicas", he: "להוסיף שכבה עם ה-exporter של loadbalancing עם routing_key של traceID לפני רפליקות ה-sampling" },
        { en: "Switch the Service to NodePort", he: "להחליף את ה-Service ל-NodePort" }
      ],
      answer: 2,
      explain: { en: "All spans of a trace must reach the same replica. The loadbalancing exporter hashes traceID over the sampling replicas (discovered via a headless Service or k8s resolver).", he: "כל ה-spans של trace חייבים להגיע לאותה רפליקה. ה-exporter של loadbalancing עושה hash ל-traceID על רפליקות ה-sampling (שמתגלות דרך headless Service או resolver של k8s)." }
    },
    {
      q: { en: "What does an exemplar give you?", he: "מה exemplar נותן לך?" },
      options: [
        { en: "A trace ID attached to a metric sample, so you can jump from a latency spike to a real trace", he: "Trace ID שמוצמד לדגימה של metric, כך שאפשר לקפוץ מ-spike של latency ל-trace אמיתי" },
        { en: "A compressed copy of all logs", he: "עותק דחוס של כל הלוגים" },
        { en: "A sampling policy", he: "Policy של sampling" },
        { en: "A template for dashboards", he: "תבנית ל-dashboards" }
      ],
      answer: 0,
      explain: { en: "Exemplars link metrics to traces: a dot on a histogram panel carries the trace_id of one request that fell in that bucket.", he: "Exemplars מקשרים metrics ל-traces: נקודה בפאנל של histogram נושאת את ה-trace_id של request אחד שנפל ב-bucket הזה." }
    }
  ],
  related: ["obs-traces", "obs-metrics", "obs-logging-pipeline", "obs-prometheus-deep", "k8s-cluster-observability"]
});

window.INFRA.lessons.push({
  id: "rel-runbooks-oncall",
  track: "reliability",
  order: 20,
  icon: "📟",
  level: 2,
  minutes: 14,
  title: { en: "Runbooks & On-Call That Works", he: "Runbooks ו-on-call שבאמת עובד" },
  tldr: {
    en: "Every page links to a runbook that tells a tired engineer at 3am what's broken, how bad it is, how to confirm it, how to stop the bleeding and whom to call; on-call stays sustainable when you design rotations, measure pages per shift, and keep turning runbook steps into scripts and safe automation.",
    he: "כל page מקושר ל-runbook שאומר למהנדס עייף ב-3 לפנות בוקר מה שבור, כמה זה חמור, איך לאמת, איך לעצור את הדימום ולמי להתקשר; on-call נשאר בר-קיימא כשמתכננים רוטציות, מודדים pages למשמרת, וכל הזמן הופכים צעדים ב-runbook לסקריפטים ולאוטומציה בטוחה."
  },
  analogy: {
    en: "A runbook is the emergency card in an airplane cockpit. Pilots are experts, yet when an engine fails they don't improvise from memory: they pull the checklist for exactly that failure, run it step by step, and know when to declare an emergency to ATC (escalation). On-call is the crew roster: two pilots per flight (primary/secondary), mandatory rest between shifts, and a debrief after every incident that updates the cards.",
    he: "Runbook זה כרטיס החירום בתא הטייס. הטייסים מומחים, ובכל זאת כשמנוע נכשל הם לא מאלתרים מהזיכרון: הם שולפים את הצ'קליסט בדיוק לתקלה הזו, מריצים אותו צעד אחרי צעד, ויודעים מתי להכריז על מצב חירום מול הבקרה (escalation). On-call זה סידור הצוות: שני טייסים בכל טיסה (primary/secondary), מנוחה חובה בין משמרות, ותחקיר אחרי כל אירוע שמעדכן את הכרטיסים."
  },
  sections: [
    {
      h: { en: "Anatomy of a good runbook (full example)", he: "האנטומיה של runbook טוב (דוגמה מלאה)" },
      body: {
        en: `<p>A runbook is written for the <strong>least-context person who might be paged</strong>: a new hire, at 03:00, half asleep, who has never touched this service. It is not architecture documentation. Fixed sections, copy-pasteable commands, expected output, and clear decision points.</p>
<pre># CheckoutHighErrorRate
Owner: payments-team   Last reviewed: 2026-10-02   Severity: critical (pages)
Dashboard: https://grafana.example.com/d/checkout   Alert rule: rules/checkout.yaml

## Symptom
5xx ratio on checkout-api &gt; 2% for 5 minutes (normal: &lt; 0.1%).

## Impact
Customers cannot pay. ~$1,800 revenue per minute at peak. Customer-facing: open
an incident in #inc and assign an Incident Commander if not resolved in 15 min.

## Diagnosis (in this order)
1. Did something change?   kubectl -n shop rollout history deploy/checkout-api
                           (also: #deploys channel, feature-flag audit log)
2. Which pods / AZs?       kubectl -n shop get pods -l app=checkout-api -o wide
3. Which error?            logcli query '{app="checkout-api"} | json | status &gt;= 500' --since=15m --limit=20
4. Dependencies?           Dashboard row "Dependencies": payment-gateway p99, postgres connections
   - payment-gateway 5xx too  -&gt; go to "Upstream provider down"
   - DB connections at max    -&gt; go to "Connection pool exhausted"

## Mitigation
A. Bad deploy in the last 2h:  kubectl -n shop rollout undo deploy/checkout-api
   Verify: error ratio &lt; 0.5% within 5 min on the dashboard.
B. One AZ bad: cordon its nodes: kubectl cordon -l topology.kubernetes.io/zone=eu-west-1b
C. Upstream provider down: enable fallback provider flag "payments.fallback=adyen"
D. Connection pool exhausted: scale down the batch job: kubectl -n shop scale deploy/reconciler --replicas=0

## Escalation
No improvement after 15 min, or data corruption suspected:
page payments secondary (PagerDuty "payments-escalation"), then the EM.
Provider issue: Adyen support +31-20-xxx, account ID in 1Password "Adyen prod".

## Rollback / undo
Undo B with kubectl uncordon. Undo C by setting the flag back after provider recovers.
Never run DB migrations backwards during the incident without the DB owner.

## History
2026-08-14 bad config map (INC-482), 2026-03-02 provider outage (INC-311)</pre>
<blockquote>💡 Real world: the most valuable line in most runbooks is "Did something change?" Roughly 70% of production incidents follow a change (deploy, config, flag, infra). Put the "how to see recent changes" commands at step 1.</blockquote>`,
        he: `<p>Runbook נכתב עבור <strong>האדם עם הכי מעט הקשר שעלול לקבל page</strong>: עובד חדש, ב-03:00, חצי ישן, שמעולם לא נגע בשירות הזה. זה לא תיעוד ארכיטקטורה. סעיפים קבועים, פקודות שאפשר להעתיק, output צפוי, ונקודות החלטה ברורות.</p>
<pre># CheckoutHighErrorRate
Owner: payments-team   Last reviewed: 2026-10-02   Severity: critical (pages)
Dashboard: https://grafana.example.com/d/checkout   Alert rule: rules/checkout.yaml

## Symptom
5xx ratio on checkout-api &gt; 2% for 5 minutes (normal: &lt; 0.1%).

## Impact
Customers cannot pay. ~$1,800 revenue per minute at peak. Customer-facing: open
an incident in #inc and assign an Incident Commander if not resolved in 15 min.

## Diagnosis (in this order)
1. Did something change?   kubectl -n shop rollout history deploy/checkout-api
                           (also: #deploys channel, feature-flag audit log)
2. Which pods / AZs?       kubectl -n shop get pods -l app=checkout-api -o wide
3. Which error?            logcli query '{app="checkout-api"} | json | status &gt;= 500' --since=15m --limit=20
4. Dependencies?           Dashboard row "Dependencies": payment-gateway p99, postgres connections
   - payment-gateway 5xx too  -&gt; go to "Upstream provider down"
   - DB connections at max    -&gt; go to "Connection pool exhausted"

## Mitigation
A. Bad deploy in the last 2h:  kubectl -n shop rollout undo deploy/checkout-api
   Verify: error ratio &lt; 0.5% within 5 min on the dashboard.
B. One AZ bad: cordon its nodes: kubectl cordon -l topology.kubernetes.io/zone=eu-west-1b
C. Upstream provider down: enable fallback provider flag "payments.fallback=adyen"
D. Connection pool exhausted: scale down the batch job: kubectl -n shop scale deploy/reconciler --replicas=0

## Escalation
No improvement after 15 min, or data corruption suspected:
page payments secondary (PagerDuty "payments-escalation"), then the EM.
Provider issue: Adyen support +31-20-xxx, account ID in 1Password "Adyen prod".

## Rollback / undo
Undo B with kubectl uncordon. Undo C by setting the flag back after provider recovers.
Never run DB migrations backwards during the incident without the DB owner.

## History
2026-08-14 bad config map (INC-482), 2026-03-02 provider outage (INC-311)</pre>
<blockquote>💡 מהשטח: השורה הכי שווה ברוב ה-runbooks היא "Did something change?". בערך 70% מהתקלות בפרודקשן באות אחרי שינוי (deploy, קונפיג, flag, תשתית). תשים את הפקודות של "איך רואים שינויים אחרונים" בצעד 1.</blockquote>`
      }
    },
    {
      h: { en: "Every alert links to a runbook; paging vs ticket", he: "כל alert מקושר ל-runbook; page מול ticket" },
      body: {
        en: `<p>Rule: <strong>no runbook, no page</strong>. Put the link in the alert itself so it lands in PagerDuty/Opsgenie/Slack, and enforce it in CI:</p>
<pre>annotations:
  summary: "checkout-api 5xx ratio {{ $value | humanizePercentage }} (&gt; 2%)"
  description: "Namespace {{ $labels.namespace }}, started firing 5m ago."
  runbook_url: "https://runbooks.example.com/payments/checkout-high-error-rate"
  dashboard: "https://grafana.example.com/d/checkout?var-ns={{ $labels.namespace }}"

# CI guard: fail if any critical alert lacks a runbook_url
yq '.spec.groups[].rules[] | select(.labels.severity == "critical" and .annotations.runbook_url == null) | .alert' rules/*.yaml</pre>
<p><strong>Page or ticket?</strong> Page a human only if the alert is <em>urgent</em> (users are hurting or will be within hours), <em>actionable</em> (there's something a human can do now) and <em>real</em> (symptom-based, not "CPU at 85%").</p>
<table>
<tr><th>Signal</th><th>Route</th><th>Example</th></tr>
<tr><td>SLO fast burn (e.g. 14.4x for 1h)</td><td>Page (critical)</td><td>Checkout availability burning 2% of monthly budget per hour</td></tr>
<tr><td>SLO slow burn (e.g. 1x over 3 days)</td><td>Ticket (next business day)</td><td>Latency budget slowly eroding</td></tr>
<tr><td>Disk 80% full, fills in 9 days</td><td>Ticket</td><td><code>predict_linear(node_filesystem_avail_bytes[6h], 4*3600) &lt; 0</code> pages; 80% doesn't</td></tr>
<tr><td>Cause-based, no user impact</td><td>Dashboard / ticket</td><td>One pod restarted, a node's CPU high</td></tr>
</table>
<blockquote>⚠️ Production tip: review every page in a weekly on-call review: "Was it actionable? Did the runbook help? Should it be a ticket, auto-remediated, or deleted?" Pages that were ignored three times are training your team to ignore pages.</blockquote>`,
        he: `<p>כלל: <strong>אין runbook, אין page</strong>. שמים את הלינק בתוך ה-alert עצמו כדי שיגיע ל-PagerDuty/Opsgenie/Slack, ואוכפים את זה ב-CI:</p>
<pre>annotations:
  summary: "checkout-api 5xx ratio {{ $value | humanizePercentage }} (&gt; 2%)"
  description: "Namespace {{ $labels.namespace }}, started firing 5m ago."
  runbook_url: "https://runbooks.example.com/payments/checkout-high-error-rate"
  dashboard: "https://grafana.example.com/d/checkout?var-ns={{ $labels.namespace }}"

# CI guard: fail if any critical alert lacks a runbook_url
yq '.spec.groups[].rules[] | select(.labels.severity == "critical" and .annotations.runbook_url == null) | .alert' rules/*.yaml</pre>
<p><strong>Page או ticket?</strong> מעירים בן אדם רק אם ה-alert <em>דחוף</em> (משתמשים סובלים או יסבלו תוך שעות), <em>ניתן לפעולה</em> (יש משהו שבן אדם יכול לעשות עכשיו) ו<em>אמיתי</em> (מבוסס סימפטום, לא "CPU ב-85%").</p>
<table>
<tr><th>סיגנל</th><th>ניתוב</th><th>דוגמה</th></tr>
<tr><td>SLO fast burn (למשל 14.4x לשעה)</td><td>Page (critical)</td><td>ה-availability של checkout שורף 2% מהתקציב החודשי בשעה</td></tr>
<tr><td>SLO slow burn (למשל 1x על פני 3 ימים)</td><td>Ticket (יום העבודה הבא)</td><td>תקציב ה-latency נשחק לאט</td></tr>
<tr><td>דיסק מלא ב-80%, יתמלא בעוד 9 ימים</td><td>Ticket</td><td><code>predict_linear(node_filesystem_avail_bytes[6h], 4*3600) &lt; 0</code> מעיר; 80% לא</td></tr>
<tr><td>מבוסס סיבה, בלי השפעה על משתמשים</td><td>Dashboard / ticket</td><td>פוד אחד עשה ריסטארט, CPU גבוה על node</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: תעבור על כל page ב-on-call review שבועי: "האם הוא היה ניתן לפעולה? ה-runbook עזר? צריך להפוך אותו ל-ticket, לאוטומציה, או למחוק?" Pages שהתעלמו מהם שלוש פעמים מאמנים את הצוות שלך להתעלם מ-pages.</blockquote>`
      }
    },
    {
      h: { en: "Rotation design, handoffs and escalation policies", he: "תכנון רוטציה, handoff ו-escalation policies" },
      body: {
        en: `<p><strong>Primary / secondary</strong>: primary gets the page; secondary is the backup if primary doesn't acknowledge, and the second pair of hands in big incidents. Typical shift: one week, handoff on a weekday morning (never Friday night or Monday 09:00 when deploys pile up).</p>
<p><strong>Team size</strong>: with a weekly rotation, 6-8 engineers means on-call every 6-8 weeks (primary) which is sustainable; fewer than 5 burns people out. Google SRE's guideline: at least 8 people for a single-site 24/7 rotation, or 6 per site for two sites.</p>
<p><strong>Follow-the-sun</strong>: two or three sites split the day so nobody is paged at night, e.g. Tel Aviv 07:00-19:00 IST and San Francisco 09:00-21:00 PT covering the rest. Requires real handoffs and similar skill on both sides; otherwise one site becomes the "real" on-call.</p>
<pre>Handoff note (posted in #oncall at every shift change)
- Open incidents: INC-517 (checkout latency, mitigated, RCA pending, owner: Dana)
- Silences active: DiskFull db-3 until Thu 12:00 (resize in progress, JIRA OPS-221)
- Noisy alerts this week: KafkaConsumerLag on reconciler (7 pages, not actionable -&gt; OPS-230)
- Risky changes upcoming: Postgres 16 upgrade Wed 10:00
- Pages: 9 (2 at night). Toil: manual cert renewal for legacy LB.</pre>
<p><strong>Escalation policy</strong> (PagerDuty/Opsgenie): defines who is notified if nobody acknowledges.</p>
<pre>Level 1: payments primary      -&gt; notify by push + SMS, then phone call after 2 min
         escalate if not acknowledged in 5 min
Level 2: payments secondary    -&gt; escalate if not acknowledged in 10 min
Level 3: engineering manager + incident-commander rotation
Repeat policy 2 times, then page the head of engineering</pre>
<blockquote>💡 Real world: escalation is also a <em>human</em> decision. Teach on-call to escalate by impact and time, not ego: "Customer-facing and no clear mitigation after 15-20 minutes → page secondary / declare an incident." Nobody is ever blamed for escalating early.</blockquote>`,
        he: `<p><strong>Primary / secondary</strong>: ה-primary מקבל את ה-page; ה-secondary הוא הגיבוי אם ה-primary לא עושה ack, והזוג ידיים השני באירועים גדולים. משמרת טיפוסית: שבוע, handoff באמצע שבוע בבוקר (אף פעם לא שישי בלילה ולא ראשון ב-09:00 כשה-deploys נערמים).</p>
<p><strong>גודל צוות</strong>: ברוטציה שבועית, 6-8 מהנדסים זה on-call פעם ב-6-8 שבועות (primary), וזה בר-קיימא; פחות מ-5 שורף אנשים. ההנחיה של Google SRE: לפחות 8 אנשים לרוטציה 24/7 באתר אחד, או 6 לכל אתר כשיש שניים.</p>
<p><strong>Follow-the-sun</strong>: שניים או שלושה אתרים מחלקים את היממה כך שאף אחד לא מקבל page בלילה, למשל תל אביב 07:00-19:00 שעון ישראל וסן פרנסיסקו 09:00-21:00 שעון פסיפיק שמכסה את השאר. זה דורש handoffs אמיתיים ורמת ידע דומה בשני הצדדים; אחרת אתר אחד הופך ל-on-call ה"אמיתי".</p>
<pre>Handoff note (posted in #oncall at every shift change)
- Open incidents: INC-517 (checkout latency, mitigated, RCA pending, owner: Dana)
- Silences active: DiskFull db-3 until Thu 12:00 (resize in progress, JIRA OPS-221)
- Noisy alerts this week: KafkaConsumerLag on reconciler (7 pages, not actionable -&gt; OPS-230)
- Risky changes upcoming: Postgres 16 upgrade Wed 10:00
- Pages: 9 (2 at night). Toil: manual cert renewal for legacy LB.</pre>
<p><strong>Escalation policy</strong> (PagerDuty/Opsgenie): מגדיר מי מקבל התראה אם אף אחד לא עושה ack.</p>
<pre>Level 1: payments primary      -&gt; notify by push + SMS, then phone call after 2 min
         escalate if not acknowledged in 5 min
Level 2: payments secondary    -&gt; escalate if not acknowledged in 10 min
Level 3: engineering manager + incident-commander rotation
Repeat policy 2 times, then page the head of engineering</pre>
<blockquote>💡 מהשטח: escalation זו גם החלטה <em>אנושית</em>. תלמד את ה-on-call לעשות escalation לפי השפעה וזמן, לא לפי אגו: "משפיע על לקוחות ואין mitigation ברור אחרי 15-20 דקות ← page ל-secondary / להכריז על incident." אף אחד אף פעם לא מואשם על escalation מוקדם.</blockquote>`
      }
    },
    {
      h: { en: "Measuring on-call health", he: "מדידת הבריאות של ה-on-call" },
      body: {
        en: `<p>What you don't measure becomes folklore ("on-call was fine this week"). Track per rotation, every week:</p>
<table>
<tr><th>Metric</th><th>Healthy target</th><th>Why</th></tr>
<tr><td>Pages per shift (12h)</td><td>≤ 2 incidents (Google SRE guideline)</td><td>Each real incident needs time for mitigation, RCA and follow-up</td></tr>
<tr><td>Night pages (22:00-07:00)</td><td>~0-1 per week</td><td>Sleep loss directly degrades judgement and retention</td></tr>
<tr><td>% actionable pages</td><td>&gt; 80-90%</td><td>Non-actionable pages cause alert fatigue</td></tr>
<tr><td>MTTA (time to acknowledge)</td><td>&lt; 5 min</td><td>Shows paging works (phones, escalation)</td></tr>
<tr><td>Repeat offenders</td><td>Top 5 alerts by count, reviewed weekly</td><td>A handful of alerts usually cause most pages</td></tr>
<tr><td>Toil / interrupt time</td><td>&lt; 50% of on-call time (SRE cap)</td><td>The rest goes to fixing causes</td></tr>
</table>
<p>Data sources: PagerDuty/Opsgenie analytics or API, plus Alertmanager's own metrics. A quick look at which alerts fire most:</p>
<pre># Alerts that fired most over the last 7 days (from Prometheus' ALERTS series)
topk(10, sum by (alertname) (changes(ALERTS_FOR_STATE[7d])))

# PagerDuty: incidents for a service last week
curl -s -H "Authorization: Token token=$PD_TOKEN" \\
  "https://api.pagerduty.com/incidents?since=2026-11-07&amp;until=2026-11-14&amp;service_ids[]=PXXXXXX&amp;limit=100" \\
  | jq '[.incidents[] | {t: .created_at, title: .title, urgency: .urgency}]'</pre>
<blockquote>⚠️ Production tip: make on-call health a team-level SLO with consequences. If the rotation exceeds its page budget two weeks in a row, the next sprint's top priority is reducing pages, exactly like an error-budget policy for reliability.</blockquote>`,
        he: `<p>מה שלא מודדים הופך לפולקלור ("ה-on-call היה בסדר השבוע"). עוקבים לכל רוטציה, כל שבוע:</p>
<table>
<tr><th>מדד</th><th>יעד בריא</th><th>למה</th></tr>
<tr><td>Pages למשמרת (12 שעות)</td><td>עד 2 incidents (ההנחיה של Google SRE)</td><td>כל incident אמיתי צריך זמן ל-mitigation, RCA ו-follow-up</td></tr>
<tr><td>Pages בלילה (22:00-07:00)</td><td>בערך 0-1 בשבוע</td><td>חוסר שינה פוגע ישירות בשיקול הדעת וב-retention של אנשים</td></tr>
<tr><td>% pages ניתנים לפעולה</td><td>מעל 80-90%</td><td>Pages שאי אפשר לפעול עליהם יוצרים alert fatigue</td></tr>
<tr><td>MTTA (זמן עד ack)</td><td>פחות מ-5 דקות</td><td>מראה שה-paging עובד (טלפונים, escalation)</td></tr>
<tr><td>עבריינים חוזרים</td><td>5 ה-alerts הכי נפוצים, נסקרים כל שבוע</td><td>קומץ alerts בדרך כלל אחראי לרוב ה-pages</td></tr>
<tr><td>Toil / זמן הפרעות</td><td>פחות מ-50% מזמן ה-on-call (התקרה של SRE)</td><td>השאר הולך לתיקון הסיבות</td></tr>
</table>
<p>מקורות מידע: ה-analytics או ה-API של PagerDuty/Opsgenie, וה-metrics של Alertmanager עצמו. מבט מהיר על אילו alerts יורים הכי הרבה:</p>
<pre># Alerts that fired most over the last 7 days (from Prometheus' ALERTS series)
topk(10, sum by (alertname) (changes(ALERTS_FOR_STATE[7d])))

# PagerDuty: incidents for a service last week
curl -s -H "Authorization: Token token=$PD_TOKEN" \\
  "https://api.pagerduty.com/incidents?since=2026-11-07&amp;until=2026-11-14&amp;service_ids[]=PXXXXXX&amp;limit=100" \\
  | jq '[.incidents[] | {t: .created_at, title: .title, urgency: .urgency}]'</pre>
<blockquote>⚠️ טיפ לפרודקשן: תהפוך את הבריאות של ה-on-call ל-SLO ברמת הצוות עם השלכות. אם הרוטציה חורגת מתקציב ה-pages שבועיים ברצף, העדיפות הראשונה בספרינט הבא היא להוריד pages, בדיוק כמו error budget policy לאמינות.</blockquote>`
      }
    },
    {
      h: { en: "From document to script to auto-remediation, and keeping runbooks fresh", he: "ממסמך לסקריפט לאוטו-רמדיאציה, ואיך שומרים runbooks עדכניים" },
      body: {
        en: `<p>Runbooks mature through levels. Each step removes human typing at 3am:</p>
<ol>
<li><strong>Prose</strong>: "check whether the queue is backed up". Better than nothing.</li>
<li><strong>Copy-paste commands</strong> with expected output and decision points.</li>
<li><strong>Script / one-click action</strong>: <code>./runbooks/checkout/diagnose.sh</code> gathers rollout history, pod status, top errors and dependency health in one go; Rundeck, AWS Systems Manager Automation, Azure Automation, or Slack-bot buttons run mitigations with audit logs.</li>
<li><strong>Auto-remediation</strong>: the alert triggers the action itself (Alertmanager webhook → automation, Kubernetes operators, StackStorm). Example: disk &gt; 90% on a log volume → rotate and compress logs, then notify.</li>
</ol>
<pre>#!/usr/bin/env bash
# runbooks/checkout/diagnose.sh: read-only, safe to run anytime
set -euo pipefail
NS=shop; APP=checkout-api
echo "== recent rollouts";   kubectl -n $NS rollout history deploy/$APP | tail -5
echo "== pods";              kubectl -n $NS get pods -l app=$APP -o wide
echo "== restarts / OOM";    kubectl -n $NS get pods -l app=$APP \\
  -o custom-columns=POD:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount,REASON:.status.containerStatuses[0].lastState.terminated.reason
echo "== top errors (15m)";  logcli query "{app=\\"$APP\\"} | json | status &gt;= 500" --since=15m --limit=200 -q \\
  | jq -r '.error // .msg' | sort | uniq -c | sort -rn | head</pre>
<p>Guardrails for auto-remediation: idempotent actions, a rate limit (max N runs per hour, then page a human), a kill switch, every action logged to the incident channel, and still an alert if the automation fires repeatedly: auto-remediation hides chronic problems if nobody looks.</p>
<p><strong>Keeping runbooks fresh</strong>: store them in git next to the alert rules (same PR changes both), an owner and <code>Last reviewed</code> date on each, a quarterly review of runbooks older than 6 months, "update the runbook" as a standard postmortem action item, and game days where someone follows a runbook literally on staging: every step that fails becomes a fix.</p>
<blockquote>💡 Real world: the best test of a runbook is to have the newest person on the team follow it during a game day, without help. Wherever they get stuck is exactly where the 3am engineer will get stuck.</blockquote>`,
        he: `<p>Runbooks מתבגרים בשלבים. כל שלב מוריד הקלדה אנושית ב-3 לפנות בוקר:</p>
<ol>
<li><strong>פרוזה</strong>: "תבדוק אם התור עמוס". עדיף מכלום.</li>
<li><strong>פקודות להעתקה</strong> עם output צפוי ונקודות החלטה.</li>
<li><strong>סקריפט / פעולה בלחיצה</strong>: <code>./runbooks/checkout/diagnose.sh</code> אוסף היסטוריית rollouts, סטטוס פודים, השגיאות הנפוצות ובריאות ה-dependencies בבת אחת; Rundeck, AWS Systems Manager Automation, Azure Automation או כפתורים של Slack bot מריצים mitigations עם audit log.</li>
<li><strong>Auto-remediation</strong>: ה-alert מפעיל את הפעולה בעצמו (webhook של Alertmanager ← אוטומציה, Kubernetes operators, StackStorm). דוגמה: דיסק מעל 90% ב-volume של לוגים ← rotation ודחיסה של הלוגים, ואז התראה.</li>
</ol>
<pre>#!/usr/bin/env bash
# runbooks/checkout/diagnose.sh: read-only, safe to run anytime
set -euo pipefail
NS=shop; APP=checkout-api
echo "== recent rollouts";   kubectl -n $NS rollout history deploy/$APP | tail -5
echo "== pods";              kubectl -n $NS get pods -l app=$APP -o wide
echo "== restarts / OOM";    kubectl -n $NS get pods -l app=$APP \\
  -o custom-columns=POD:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount,REASON:.status.containerStatuses[0].lastState.terminated.reason
echo "== top errors (15m)";  logcli query "{app=\\"$APP\\"} | json | status &gt;= 500" --since=15m --limit=200 -q \\
  | jq -r '.error // .msg' | sort | uniq -c | sort -rn | head</pre>
<p>מעקות בטיחות ל-auto-remediation: פעולות idempotent, rate limit (מקסימום N הרצות בשעה, ואז page לבן אדם), kill switch, כל פעולה נרשמת בערוץ ה-incident, ועדיין alert אם האוטומציה יורה שוב ושוב: auto-remediation מחביא בעיות כרוניות אם אף אחד לא מסתכל.</p>
<p><strong>איך שומרים runbooks עדכניים</strong>: מחזיקים אותם ב-git ליד ה-alert rules (אותו PR משנה את שניהם), owner ותאריך <code>Last reviewed</code> על כל אחד, סקירה רבעונית של runbooks שלא נגעו בהם יותר מחצי שנה, "לעדכן את ה-runbook" כ-action item קבוע בכל postmortem, ו-game days שבהם מישהו מבצע runbook מילה במילה על staging: כל צעד שנכשל הופך לתיקון.</p>
<blockquote>💡 מהשטח: המבחן הכי טוב ל-runbook הוא לתת לאדם הכי חדש בצוות לבצע אותו ב-game day, בלי עזרה. איפה שהוא נתקע זה בדיוק איפה שהמהנדס של 3 לפנות בוקר ייתקע.</blockquote>`
      }
    }
  ],
  diagram: `  alert fires (symptom, SLO burn) --runbook_url--> RUNBOOK
        |                                            Symptom / Impact
        v                                            Diagnosis cmds
  Alertmanager -> PagerDuty escalation policy        Mitigation A/B/C
        |   L1 primary   (ack in 5 min?)  --no-->    Escalation
        |   L2 secondary (ack in 10 min?) --no-->    Rollback / undo
        |   L3 EM + Incident Commander
        v
  mitigate -> postmortem -> action items:
     update runbook | fix alert | script it | auto-remediate
  weekly on-call review: pages/shift, night pages, % actionable, top 5 noisy alerts`,
  handsOn: [
    { cmd: "yq '.spec.groups[].rules[] | select(.alert != null and .annotations.runbook_url == null) | .alert' manifests/rules/*.yaml", what: { en: "List every alert that has no runbook_url: make this a failing CI check.", he: "מציגים כל alert שאין לו runbook_url: תהפוך את זה לבדיקת CI שנכשלת." } },
    { cmd: "amtool --alertmanager.url=http://localhost:9093 alert query -o extended | head -20", what: { en: "See what is firing right now with all labels and annotations, including runbook links.", he: "רואים מה יורה עכשיו עם כל ה-labels וה-annotations, כולל הלינקים ל-runbooks." } },
    { cmd: "curl -s 'localhost:9090/api/v1/query' --data-urlencode 'query=topk(10, sum by (alertname) (changes(ALERTS_FOR_STATE[7d])))' | jq -r '.data.result[] | \"\\(.value[1])  \\(.metric.alertname)\"'", what: { en: "Rough top-10 noisiest alerts over the last week: start your on-call review here.", he: "הערכה גסה של 10 ה-alerts הכי רועשים בשבוע האחרון: תתחיל את ה-on-call review מכאן." } },
    { cmd: "git log --since='6 months ago' --name-only --format='' -- runbooks/ | sort -u > fresh.txt; ls runbooks/**/*.md | grep -vxFf fresh.txt", what: { en: "Find runbooks nobody touched in 6 months: candidates for the quarterly review (run with bash globstar on).", he: "מוצאים runbooks שאף אחד לא נגע בהם חצי שנה: מועמדים לסקירה הרבעונית (להריץ ב-bash עם globstar)." } }
  ],
  mnemonic: {
    en: "\"SIDMER\": Symptom, Impact, Diagnose, Mitigate, Escalate, Rollback. And: no runbook, no page; doc → script → automation.",
    he: "\"SIDMER\": Symptom, Impact, Diagnose, Mitigate, Escalate, Rollback. ועוד: אין runbook, אין page; מסמך ← סקריפט ← אוטומציה."
  },
  pitfalls: [
    { en: "Runbooks written as architecture docs (\"checkout is a Go service that...\"). At 3am you need commands and decisions, not history.", he: "Runbooks שנכתבים כמו תיעוד ארכיטקטורה (\"checkout הוא שירות ב-Go ש...\"). ב-3 לפנות בוקר צריך פקודות והחלטות, לא היסטוריה." },
    { en: "Paging on causes (CPU 85%, one pod restarted) instead of symptoms. Non-actionable pages train people to ignore the pager.", he: "להעיר על סיבות (CPU ב-85%, פוד אחד עשה ריסטארט) במקום על סימפטומים. Pages שאי אפשר לפעול עליהם מאמנים אנשים להתעלם מה-pager." },
    { en: "A rotation of 3-4 people for 24/7. They are on-call every 3-4 weeks plus covering vacations, and burn out within a year.", he: "רוטציה של 3-4 אנשים ל-24/7. הם ב-on-call כל 3-4 שבועות ועוד מכסים חופשות, ונשרפים תוך שנה." },
    { en: "Auto-remediation without rate limits or visibility. It silently restarts the same service 400 times a day and hides a real leak.", he: "Auto-remediation בלי rate limits ובלי נראות. היא עושה ריסטארט בשקט לאותו שירות 400 פעם ביום ומחביאה דליפה אמיתית." }
  ],
  interview: [
    {
      q: { en: "Your team gets 25 pages a week and people are burning out. What do you do?", he: "הצוות שלך מקבל 25 pages בשבוע ואנשים נשרפים. מה אתה עושה?" },
      a: { en: "Measure: export a month of pages, group by alert, mark actionable or not, and note night pages. Usually 3-5 alerts cause most of it. For each: delete if never actionable, downgrade to ticket if not urgent, convert cause-based alerts to SLO burn-rate alerts, tune thresholds/for durations, add grouping/inhibition, or automate the fix. Fix top recurring root causes as sprint work. Set a page budget (e.g. ≤ 2 per shift) reviewed weekly, ensure every remaining page has a runbook, and check rotation size and follow-the-sun options.", he: "מודדים: מוציאים חודש של pages, מקבצים לפי alert, מסמנים אם היה ניתן לפעולה, ורושמים pages בלילה. בדרך כלל 3-5 alerts אחראים לרוב. לכל אחד: מוחקים אם אף פעם לא היה ניתן לפעולה, מורידים ל-ticket אם לא דחוף, הופכים alerts מבוססי סיבה ל-SLO burn-rate alerts, מכווננים ספים ו-for, מוסיפים grouping/inhibition, או עושים אוטומציה לתיקון. מתקנים את ה-root causes החוזרים כעבודה בספרינט. קובעים תקציב pages (למשל עד 2 למשמרת) שנסקר כל שבוע, מוודאים שלכל page שנשאר יש runbook, ובודקים את גודל הרוטציה ואפשרויות follow-the-sun." }
    },
    {
      q: { en: "What makes a runbook good?", he: "מה הופך runbook לטוב?" },
      a: { en: "It's written for the least-context responder: clear symptom and user impact, ordered diagnosis steps with copy-pasteable commands and expected output, decision points leading to specific mitigations, explicit escalation criteria and contacts, how to undo each mitigation, links to dashboards and past incidents, plus an owner and last-reviewed date. It lives next to the alert, is updated after every incident, and parts of it are progressively scripted.", he: "הוא נכתב עבור מי שמגיע עם הכי מעט הקשר: סימפטום והשפעה על משתמשים ברורים, צעדי אבחון מסודרים עם פקודות להעתקה ו-output צפוי, נקודות החלטה שמובילות ל-mitigations ספציפיים, קריטריונים ואנשי קשר מפורשים ל-escalation, איך לבטל כל mitigation, לינקים ל-dashboards ולאירועי עבר, ו-owner ותאריך סקירה אחרון. הוא יושב ליד ה-alert, מתעדכן אחרי כל incident, וחלקים ממנו הופכים בהדרגה לסקריפטים." }
    }
  ],
  quiz: [
    {
      q: { en: "Which alert should page a human at night?", he: "איזה alert צריך להעיר בן אדם בלילה?" },
      options: [
        { en: "CPU on one node above 85% for 10 minutes", he: "CPU על node אחד מעל 85% במשך 10 דקות" },
        { en: "Checkout SLO burning error budget at 14x for the last hour", he: "ה-SLO של checkout שורף error budget בקצב 14x בשעה האחרונה" },
        { en: "Disk 75% full, projected to fill in 3 weeks", he: "דיסק מלא ב-75%, צפוי להתמלא בעוד 3 שבועות" },
        { en: "One pod restarted once", he: "פוד אחד עשה ריסטארט פעם אחת" }
      ],
      answer: 1,
      explain: { en: "Pages must be urgent, actionable and symptom-based. A fast SLO burn means users are hurting now; the others are tickets or dashboard items.", he: "Pages חייבים להיות דחופים, ניתנים לפעולה ומבוססי סימפטום. SLO fast burn אומר שמשתמשים סובלים עכשיו; השאר הם tickets או פריטים ב-dashboard." }
    },
    {
      q: { en: "What's the most useful first diagnosis step in most runbooks?", he: "מה צעד האבחון הראשון הכי שימושי ברוב ה-runbooks?" },
      options: [
        { en: "Restart all pods", he: "לעשות ריסטארט לכל הפודים" },
        { en: "Read the architecture doc", he: "לקרוא את מסמך הארכיטקטורה" },
        { en: "Check what changed recently (deploys, config, flags, infra)", he: "לבדוק מה השתנה לאחרונה (deploys, קונפיג, flags, תשתית)" },
        { en: "Open a vendor support ticket", he: "לפתוח ticket לתמיכה של ה-vendor" }
      ],
      answer: 2,
      explain: { en: "Most incidents follow a change, and rolling back that change is often the fastest mitigation.", he: "רוב התקלות באות אחרי שינוי, ו-rollback של השינוי הוא לרוב ה-mitigation הכי מהיר." }
    },
    {
      q: { en: "Google SRE's guideline for sustainable on-call load is roughly:", he: "ההנחיה של Google SRE לעומס on-call בר-קיימא היא בערך:" },
      options: [
        { en: "At most 2 incidents per 12-hour shift", he: "לכל היותר 2 incidents למשמרת של 12 שעות" },
        { en: "At most 20 pages per shift", he: "לכל היותר 20 pages למשמרת" },
        { en: "Zero pages ever", he: "אפס pages אף פעם" },
        { en: "As many as needed if they're acknowledged quickly", he: "כמה שצריך, כל עוד עושים ack מהר" }
      ],
      answer: 0,
      explain: { en: "Each real incident needs time for mitigation, root-cause analysis and follow-up; more than ~2 per shift means no time to fix causes.", he: "כל incident אמיתי צריך זמן ל-mitigation, לניתוח root cause ול-follow-up; יותר מבערך 2 למשמרת אומר שאין זמן לתקן סיבות." }
    },
    {
      q: { en: "Which is a must-have guardrail for auto-remediation?", he: "איזה מעקה בטיחות חובה ל-auto-remediation?" },
      options: [
        { en: "Running it only on Fridays", he: "להריץ אותה רק בימי שישי" },
        { en: "Rate limit plus a kill switch, with every action logged and repeated runs escalating to a human", he: "Rate limit ו-kill switch, כשכל פעולה נרשמת והרצות חוזרות מגיעות לבן אדם" },
        { en: "Disabling the related alert", he: "לכבות את ה-alert הקשור" },
        { en: "Giving it cluster-admin so it never fails", he: "לתת לה cluster-admin כדי שאף פעם לא תיכשל" }
      ],
      answer: 1,
      explain: { en: "Automation must be bounded and visible; otherwise it loops forever and hides chronic problems.", he: "אוטומציה חייבת להיות מוגבלת וגלויה; אחרת היא רצה בלולאה לנצח ומחביאה בעיות כרוניות." }
    }
  ],
  playground: "slo",
  related: ["obs-alerting", "rel-incident-management", "rel-error-budgets", "flow-alert-to-postmortem", "staff-large-incidents"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  ["Recording rule", "A Prometheus rule that precomputes an expensive PromQL expression on a schedule and stores the result as a new, cheap time series (e.g. job:http_requests:rate5m).", "Rule ב-Prometheus שמחשב מראש ביטוי PromQL יקר לפי לוח זמנים ושומר את התוצאה כ-time series חדש וזול (למשל job:http_requests:rate5m).", "obs-prometheus-deep"],
  ["ServiceMonitor", "A prometheus-operator CRD that tells Prometheus which Services' endpoints to scrape, on which port and interval.", "CRD של prometheus-operator שאומר ל-Prometheus ל-endpoints של אילו Services לעשות scrape, באיזה port ובאיזה interval.", "obs-prometheus-deep"],
  ["remote_write", "Prometheus feature that streams samples from its WAL to a remote store (Mimir, Thanos Receive, VictoriaMetrics, managed Prometheus) for long-term, global storage.", "יכולת של Prometheus להזרים דגימות מה-WAL שלו ל-store מרוחק (Mimir, Thanos Receive, VictoriaMetrics, Prometheus מנוהל) לאחסון גלובלי לטווח ארוך.", "obs-prometheus-deep"],
  ["Backpressure", "A downstream system signaling it can't keep up, forcing upstream to buffer, slow down or drop data instead of overwhelming it.", "מערכת downstream שמאותתת שהיא לא עומדת בקצב, ומכריחה את ה-upstream לעשות buffering, להאט או לזרוק מידע במקום להציף אותה.", "obs-logging-pipeline"],
  ["LogQL", "Grafana Loki's query language: a label selector picks streams, then filters and parsers (|=, | json) process lines, optionally turned into metrics with rate().", "שפת השאילתות של Grafana Loki: label selector בוחר streams, ואז filters ו-parsers (|=, | json) מעבדים שורות, ואפשר להפוך אותן ל-metrics עם rate().", "obs-logging-pipeline"],
  ["Fluent Bit", "Lightweight C log/metrics agent, usually run as a DaemonSet to tail container logs, enrich them with Kubernetes metadata and ship them.", "Agent קליל ב-C ללוגים ו-metrics, בדרך כלל רץ כ-DaemonSet כדי לקרוא לוגים של קונטיינרים, להעשיר אותם ב-metadata של Kubernetes ולשלוח אותם.", "obs-logging-pipeline"],
  ["OpenTelemetry Collector", "Vendor-neutral process that receives, processes and exports telemetry via configurable pipelines of receivers, processors and exporters.", "תהליך שלא קשור לאף vendor שמקבל, מעבד ושולח telemetry דרך pipelines של receivers, processors ו-exporters שניתנים להגדרה.", "obs-otel-collector"],
  ["memory_limiter", "OTel Collector processor that refuses incoming data and forces GC when memory crosses soft/hard limits; must be first in every pipeline.", "Processor ב-OTel Collector שמסרב לקבל מידע ומכריח GC כשהזיכרון עובר את ה-soft/hard limits; חייב להיות ראשון בכל pipeline.", "obs-otel-collector"],
  ["k8sattributes processor", "OTel Collector processor that maps telemetry from a pod IP/UID to Kubernetes metadata (namespace, pod, deployment, labels) via the API server.", "Processor ב-OTel Collector שממפה telemetry מ-IP/UID של פוד ל-metadata של Kubernetes (namespace, pod, deployment, labels) דרך ה-API server.", "obs-otel-collector"],
  ["Escalation policy", "Ordered rules in a paging tool defining who is notified next, and after how long, if an alert isn't acknowledged.", "חוקים מסודרים בכלי ה-paging שמגדירים מי מקבל התראה הבאה, ואחרי כמה זמן, אם לא עושים ack ל-alert.", "rel-runbooks-oncall"],
  ["Follow-the-sun", "An on-call model where teams in different time zones cover their daytime hours, so nobody is paged at night.", "מודל on-call שבו צוותים באזורי זמן שונים מכסים את שעות היום שלהם, כך שאף אחד לא מקבל page בלילה.", "rel-runbooks-oncall"],
  ["Auto-remediation", "Automation triggered by an alert that performs a known fix (restart, scale, clean up) with guardrails like rate limits and a kill switch.", "אוטומציה שמופעלת על ידי alert ומבצעת תיקון ידוע (ריסטארט, scale, ניקוי) עם מעקות בטיחות כמו rate limits ו-kill switch.", "rel-runbooks-oncall"]
].forEach(([term, en, he, lesson]) =>
  window.INFRA.glossary.push({ term, track: lesson.startsWith("rel-") ? "reliability" : "observability", def: { en, he }, lesson }));

// ---------------------------------------------------------------------------
// Scenario: Prometheus OOM from a cardinality explosion
// ---------------------------------------------------------------------------
(function () {
  const t = (en, he) => ({ en, he });
  const c = (en, he, next, score, fen, fhe) => ({ label: { en, he }, next, score, feedback: { en: fen, he: fhe } });

  window.INFRA.scenarios.push({
    id: "prometheus-cardinality-oom",
    icon: "💥",
    title: t("Prometheus OOM: both replicas down", "Prometheus ב-OOM: שתי הרפליקות למטה"),
    start: "s1",
    steps: {
      s1: {
        text: t("16:40. The dead man's switch alert (Watchdog) stopped arriving and Grafana dashboards show 'No data'. Both Prometheus replicas look unhealthy. Your monitoring is blind.",
                "16:40. ה-alert של ה-dead man's switch (Watchdog) הפסיק להגיע וה-dashboards ב-Grafana מראים 'No data'. שתי הרפליקות של Prometheus נראות לא בריאות. ה-monitoring שלך עיוור."),
        data: `$ kubectl -n monitoring get pods -l app.kubernetes.io/name=prometheus
NAME                  READY   STATUS             RESTARTS      AGE
prometheus-k8s-0      1/2     CrashLoopBackOff   6 (40s ago)   21d
prometheus-k8s-1      1/2     CrashLoopBackOff   6 (55s ago)   21d

$ kubectl -n monitoring describe pod prometheus-k8s-0 | grep -A3 'Last State'
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137`,
        choices: [
          c("Check what changed: series count history on the meta-monitoring Prometheus and recent deploys", "לבדוק מה השתנה: היסטוריית מספר הסדרות ב-Prometheus של ה-meta-monitoring ו-deploys אחרונים", "s2", 15,
            "Right. Two identical replicas dying together means the input changed, not the pods. Find what changed.",
            "נכון. שתי רפליקות זהות שמתות ביחד אומר שה-input השתנה, לא הפודים. תמצא מה השתנה."),
          c("Double the memory limit from 16Gi to 32Gi and see", "להכפיל את ה-memory limit מ-16Gi ל-32Gi ולראות", "s2", 5,
            "It may buy time, but you're treating the symptom. If series keep growing, 32Gi dies too, and you still don't know why.",
            "זה אולי יקנה זמן, אבל אתה מטפל בסימפטום. אם הסדרות ממשיכות לגדול, גם 32Gi ימות, ועדיין אין לך מושג למה."),
          c("Delete the PVCs so Prometheus starts clean", "למחוק את ה-PVCs כדי ש-Prometheus יעלה נקי", "lose", -20,
            "You just deleted 21 days of metrics on both replicas, and whatever is causing the growth is still there.",
            "הרגע מחקת 21 יום של metrics בשתי הרפליקות, ומה שגורם לגדילה עדיין שם.")
        ]
      },
      s2: {
        text: t("A small meta-monitoring Prometheus scrapes the main ones. Head series jumped sharply after 14:05. The #deploys channel shows payments-api v2.31 went out at 14:02.",
                "Prometheus קטן של meta-monitoring עושה scrape ל-Prometheus-ים הראשיים. ה-head series קפצו בחדות אחרי 14:05. בערוץ #deploys רואים ש-payments-api v2.31 עלה ב-14:02."),
        data: `prometheus_tsdb_head_series{pod="prometheus-k8s-0"}
  13:00   1,210,442
  14:00   1,224,901
  14:30   4,870,115
  15:30   8,932,660
  16:20   9,804,377   (last sample before OOM)

container_memory_working_set_bytes{pod="prometheus-k8s-0"}  15.8Gi / limit 16Gi`,
        choices: [
          c("Find which metric and label exploded (TSDB status / topk by __name__ on the meta replica, or the last good data)", "למצוא איזה metric ואיזה label התפוצצו (TSDB status / topk לפי __name__ ב-meta, או הנתונים האחרונים שעבדו)", "s3", 15,
            "Yes. You need the exact metric and label to drop it surgically.",
            "כן. אתה צריך את ה-metric וה-label המדויקים כדי להפיל אותם בצורה כירורגית."),
          c("Restart both Prometheus pods again", "לעשות ריסטארט לשתי הרפליקות שוב", "s2", -5,
            "They're already restarting every few minutes. Another restart changes nothing.",
            "הם כבר עושים ריסטארט כל כמה דקות. עוד ריסטארט לא משנה כלום.")
        ]
      },
      s3: {
        text: t("You bump one replica to 40Gi just long enough to query it. The culprit is obvious.",
                "אתה מעלה רפליקה אחת ל-40Gi רק מספיק זמן כדי לשאול אותה. האשם ברור."),
        data: `topk(5, count by (__name__) ({__name__=~".+"}))
  http_request_duration_seconds_bucket   7,104,220
  http_requests_total                      612,880
  container_memory_working_set_bytes        41,002
  ...

count(count by (path) (http_request_duration_seconds_bucket{job="payments-api"}))
  402,117

sample: http_request_duration_seconds_bucket{job="payments-api",
        path="/v1/payments/pi_3Q8x2LkT9vZ/confirm", le="0.25"}`,
        choices: [
          c("Add metric_relabel_configs (or ServiceMonitor metricRelabelings) to drop that metric for payments-api now, and open a P1 for the team to use the route template", "להוסיף metric_relabel_configs (או metricRelabelings ב-ServiceMonitor) כדי להפיל את ה-metric הזה ל-payments-api עכשיו, ולפתוח P1 לצוות לעבור לתבנית route", "s4", 15,
            "Fast, surgical and reversible. You lose one service's latency histogram for a few hours instead of all monitoring.",
            "מהיר, כירורגי והפיך. אתה מאבד histogram של latency לשירות אחד לכמה שעות במקום את כל ה-monitoring."),
          c("Ask the payments team to roll back v2.31", "לבקש מצוות payments לעשות rollback ל-v2.31", "s4", 10,
            "Valid, but it depends on another team and rolls back their features. The relabel fix is in your hands and immediate; do both if you can.",
            "לגיטימי, אבל זה תלוי בצוות אחר ומגלגל אחורה את הפיצ'רים שלהם. התיקון עם relabel בידיים שלך ומיידי; אם אפשר, תעשה את שניהם."),
          c("Drop all metrics from the payments namespace", "להפיל את כל ה-metrics מה-namespace של payments", "s4", -5,
            "Works, but you just blinded yourself on the payment system, including its SLO alerts. Way too wide.",
            "עובד, אבל הרגע עיוורת את עצמך על מערכת התשלומים, כולל ה-SLO alerts שלה. רחב מדי.")
        ]
      },
      s4: {
        text: t("The relabel config is live: new scrapes no longer ingest the bad series. But on restart with the 16Gi limit, the pods still OOM during startup.",
                "ה-relabel config באוויר: scrapes חדשים כבר לא מכניסים את הסדרות הבעייתיות. אבל בעלייה עם limit של 16Gi, הפודים עדיין חוטפים OOM בזמן ה-startup."),
        data: `$ kubectl -n monitoring logs prometheus-k8s-1 -c prometheus --previous | tail -3
ts=2026-11-14T15:12:44Z level=info component=tsdb msg="Replaying WAL, this may take a while"
ts=2026-11-14T15:13:31Z level=info component=tsdb msg="WAL segment loaded" segment=1184 maxSegment=1291
(no more output)

$ du -sh /prometheus/wal   # on the volume
11G`,
        choices: [
          c("Temporarily raise the memory limit so the WAL (which still contains the 9.8M series) can replay; the series will age out of the head after compaction, then lower it again", "להעלות זמנית את ה-memory limit כדי שה-WAL (שעדיין מכיל את 9.8 מיליון הסדרות) יוכל לעשות replay; הסדרות ייצאו מה-head אחרי compaction, ואז להוריד שוב", "s5", 15,
            "Correct: the WAL replays every series created in the last ~2-3h. Give it room once, it compacts, and memory drops back to normal.",
            "נכון: ה-WAL עושה replay לכל סדרה שנוצרה בשעתיים-שלוש האחרונות. נותנים לו מקום פעם אחת, הוא עושה compaction, והזיכרון חוזר לנורמלי."),
          c("Delete only the wal/ directory on one replica and keep the other's intact", "למחוק רק את תיקיית wal/ ברפליקה אחת ולהשאיר את השנייה שלמה", "s5", 5,
            "Acceptable trade-off under pressure: you lose ~2-3h of not-yet-compacted data on that replica, but the other replica (or remote_write) still has it. Not ideal, not a disaster.",
            "Trade-off סביר תחת לחץ: אתה מאבד בערך 2-3 שעות של מידע שעוד לא עבר compaction ברפליקה הזו, אבל לרפליקה השנייה (או ל-remote_write) עדיין יש אותו. לא אידיאלי, לא אסון."),
          c("Wipe both volumes completely", "למחוק את שני ה-volumes לגמרי", "lose", -20,
            "The cause is already fixed; wiping both replicas throws away three weeks of history for nothing.",
            "הסיבה כבר תוקנה; למחוק את שתי הרפליקות זה לזרוק שלושה שבועות של היסטוריה בשביל כלום.")
        ]
      },
      s5: {
        text: t("17:35. Both replicas are up, head series back to 1.23M, memory at 7Gi. Watchdog is flowing again. How do you make sure this never takes monitoring down again?",
                "17:35. שתי הרפליקות למעלה, ה-head series חזרו ל-1.23 מיליון, הזיכרון ב-7Gi. ה-Watchdog זורם שוב. איך אתה מוודא שזה לא יפיל את ה-monitoring שוב לעולם?"),
        data: `prometheus_tsdb_head_series            1,231,880
container_memory_working_set_bytes     7.1Gi / limit 16Gi
up{job="payments-api"}                 1`,
        choices: [
          c("Add sampleLimit/labelLimit per ServiceMonitor, an alert on head-series growth (>50%/day), a CI lint for unbounded labels, and a postmortem with a runbook for this alert", "להוסיף sampleLimit/labelLimit לכל ServiceMonitor, alert על גדילה של head series (מעל 50% ביום), lint ב-CI ל-labels לא חסומים, ו-postmortem עם runbook ל-alert הזה", "win", 20,
            "Defense in depth: a bad target now fails its own scrape (up=0) instead of killing Prometheus, and you get warned hours before an OOM.",
            "הגנה לעומק: target בעייתי עכשיו מכשיל רק את ה-scrape של עצמו (up=0) במקום להרוג את Prometheus, ואתה מקבל אזהרה שעות לפני OOM."),
          c("Just keep the memory limit at 40Gi permanently", "פשוט להשאיר את ה-memory limit על 40Gi לתמיד", "lose", -10,
            "That only raises the ceiling. The next unbounded label (or the next team) blows through 40Gi too, and you pay for idle RAM in the meantime.",
            "זה רק מעלה את התקרה. ה-label הלא חסום הבא (או הצוות הבא) יעבור גם את ה-40Gi, ובינתיים אתה משלם על RAM שעומד בטל.")
        ]
      },
      win: {
        text: t("Monitoring restored in under an hour with minimal data loss, the root cause (raw payment IDs in a path label) fixed by the team, and guardrails in place: sample limits, growth alerts, CI lint and a new runbook. The postmortem is blameless and short.",
                "ה-monitoring חזר תוך פחות משעה עם אובדן מידע מינימלי, ה-root cause (מזהי תשלום גולמיים ב-label של path) תוקן על ידי הצוות, ויש מעקות בטיחות: sample limits, alerts על גדילה, lint ב-CI ו-runbook חדש. ה-postmortem blameless וקצר."),
        end: "win"
      },
      lose: {
        text: t("Monitoring is either gone for weeks of history or will fall over again soon: the next cardinality bomb will hit both HA replicas at the same minute, exactly like today. Cardinality needs limits and alerts, not bigger pods or empty disks.",
                "או שה-monitoring איבד שבועות של היסטוריה, או שהוא ייפול שוב בקרוב: פצצת ה-cardinality הבאה תפגע בשתי רפליקות ה-HA באותה דקה, בדיוק כמו היום. Cardinality צריך limits ו-alerts, לא פודים גדולים יותר או דיסקים ריקים."),
        end: "lose"
      }
    },
    lessons: ["obs-prometheus-deep", "obs-metrics", "rel-runbooks-oncall"]
  });
})();
