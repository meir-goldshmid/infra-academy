// Staff+ platform & security track: service mesh, IDP, zero trust, supply chain, eBPF,
// Postgres at scale, zero-downtime migrations, Terraform at scale.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

(function () {
// Code snippets are language-neutral, so each lesson defines them once and reuses them in en + he.

// ---------------------------------------------------------------------------
// 10. Service mesh
// ---------------------------------------------------------------------------
{
const MESH_MODES = `<pre>SIDECAR (classic Istio, Linkerd)          AMBIENT (Istio, GA since 1.24)
+-----------------------------+            +----------------+   +----------------+
| Pod                         |            | Pod  (app only)|   | Pod  (app only)|
|  app  --&gt;  envoy (L4+L7)   |            +-------+--------+   +--------+-------+
+-----------------------------+                    |  node-level         |
  one proxy per pod                         ztunnel (L4: mTLS, authz, telemetry)
  ~0.2-0.5 vCPU / 1000 rps                          |   optional, per namespace/SA
  50-100 MiB RAM each                       waypoint (Envoy, L7: retries, routing, authz)</pre>`;

const MESH_AMBIENT = `<pre># Enroll a namespace in ambient: no pod restarts, no sidecar injection
istioctl install --set profile=ambient -y
kubectl label namespace shop istio.io/dataplane-mode=ambient

# L4 mTLS is now on. Need L7 (HTTP routing/retries/authz by path)? add a waypoint:
istioctl waypoint apply -n shop --enroll-namespace
kubectl get gateway -n shop
NAME       CLASS            ADDRESS        PROGRAMMED
waypoint   istio-waypoint   10.96.41.12    True

# Enforce strict mTLS mesh-wide (reject plaintext)
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata: { name: default, namespace: istio-system }
spec:
  mtls: { mode: STRICT }</pre>`;

const MESH_SHIFT = `<pre>apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata: { name: checkout, namespace: shop }
spec:
  host: checkout
  subsets:
  - { name: v1, labels: { version: v1 } }
  - { name: v2, labels: { version: v2 } }
  trafficPolicy:
    connectionPool: { http: { http2MaxRequests: 1000, maxRequestsPerConnection: 100 } }
    outlierDetection:            # passive circuit breaking: eject bad endpoints
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata: { name: checkout, namespace: shop }
spec:
  hosts: [checkout]
  http:
  - match: [{ headers: { x-canary: { exact: "1" } } }]   # internal testers always hit v2
    route: [{ destination: { host: checkout, subset: v2 } }]
  - route:
    - { destination: { host: checkout, subset: v1 }, weight: 95 }
    - { destination: { host: checkout, subset: v2 }, weight: 5 }
    timeout: 2s                  # total budget for the call, including retries
    retries:
      attempts: 2
      perTryTimeout: 600ms
      retryOn: connect-failure,refused-stream,unavailable,503</pre>`;

const MESH_GATEWAY_API = `<pre># Same 95/5 split with the vendor-neutral Gateway API (works for Istio, Linkerd, Cilium)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: checkout, namespace: shop }
spec:
  parentRefs: [{ group: "", kind: Service, name: checkout }]   # GAMMA: route attached to a Service
  rules:
  - backendRefs:
    - { name: checkout-v1, port: 8080, weight: 95 }
    - { name: checkout-v2, port: 8080, weight: 5 }</pre>`;

const MESH_RETRY_MATH = `<pre>3 tiers, each retries 2x (3 attempts):
  edge -&gt; api -&gt; orders -&gt; db
  worst case load on db per user request = 3 x 3 x 3 = 27 calls
  during a brownout that is a 27x amplification -&gt; outage

Rule: retry at ONE layer (usually the one closest to the caller),
      budget it (Envoy retry budget / Linkerd retryBudget ~20% extra load),
      perTryTimeout x attempts &lt; overall timeout,
      only retry idempotent requests (GET, or POST with an idempotency key).</pre>`;

INFRA.lessons.push({
  id: "staff-service-mesh",
  track: "staff",
  order: 10,
  icon: "🕸️",
  level: 3,
  minutes: 18,
  title: { en: "Service Mesh at Scale: Istio, Linkerd, Ambient & When Not To", he: "Service Mesh בקנה מידה: Istio, Linkerd, Ambient ומתי לא" },
  tldr: {
    en: "A mesh moves mTLS, retries, timeouts, traffic shifting and golden-signal telemetry out of app code into proxies. Ambient (ztunnel + optional waypoints) cut the per-pod sidecar tax; the real cost is still operational: another control plane, another upgrade train, another place for latency and outages to hide.",
    he: "Mesh מוציא mTLS, retries, timeouts, traffic shifting וטלמטריה של golden signals מקוד האפליקציה אל proxies. Ambient (ztunnel + waypoints אופציונליים) חתך את המס של sidecar לכל pod; המחיר האמיתי עדיין תפעולי: עוד control plane, עוד רכבת שדרוגים, ועוד מקום שבו latency ותקלות מתחבאים."
  },
  analogy: {
    en: "A sidecar mesh gives every employee a personal bodyguard who checks IDs, carries the phone and redials when a call drops — great protection, but you pay a salary per employee. Ambient replaces them with a security desk on every floor (ztunnel) for ID checks, and only hires a concierge (waypoint) for departments that need call routing. Both are pointless if your company is five people in one room.",
    he: "Mesh עם sidecars נותן לכל עובד שומר ראש אישי שבודק תעודות, מחזיק את הטלפון ומחייג שוב כשהשיחה נופלת – הגנה מעולה, אבל משלמים משכורת על כל עובד. Ambient מחליף אותם בעמדת אבטחה בכל קומה (ztunnel) לבדיקת תעודות, ושוכר קונסיירז' (waypoint) רק למחלקות שצריכות ניתוב שיחות. שניהם מיותרים אם החברה היא חמישה אנשים בחדר אחד."
  },
  sections: [
    {
      h: { en: "What a mesh actually buys you (and the data plane options)", he: "מה mesh באמת נותן (ואפשרויות ה-data plane)" },
      body: {
        en: `<p>Strip the marketing and a mesh gives you four things without touching app code: <strong>identity + mTLS</strong> between workloads (SPIFFE IDs like <code>spiffe://cluster.local/ns/shop/sa/checkout</code>, certs rotated every ~24h), <strong>L7 traffic control</strong> (weighted routing, retries, timeouts, outlier detection), <strong>authorization</strong> by workload identity ("only <code>sa/frontend</code> may <code>POST /orders</code>") and <strong>uniform telemetry</strong> (request rate, errors, latency per service pair, plus trace header propagation — the app must still forward <code>traceparent</code>).</p>
${MESH_MODES}
<ul>
<li><strong>Istio sidecar</strong> — Envoy in every pod, injected by a mutating webhook. Most features, most knobs, highest per-pod cost. With native sidecars (Kubernetes SidecarContainers, GA in 1.33) the old "app starts before proxy / Job never finishes" problems are largely gone.</li>
<li><strong>Istio ambient</strong> — a per-node <code>ztunnel</code> (Rust, L4 only) does mTLS via the HBONE tunnel (HTTP CONNECT over mTLS on port 15008). L7 features need a <em>waypoint</em> Envoy, deployed per namespace or service account and scaled like a normal Deployment. You pay for L7 only where you use it.</li>
<li><strong>Linkerd</strong> — sidecar with a purpose-built Rust micro-proxy; smaller feature set, consistently lower overhead and simpler ops. Note the licensing shift: since 2024 open-source stable release artifacts come from Buoyant's distribution (free for small orgs, paid for larger ones), while edge releases stay open — check the current terms before you standardise on it.</li>
<li><strong>Cilium service mesh</strong> — eBPF for L3/L4 + a per-node Envoy for L7, sidecar-free; attractive if Cilium is already your CNI.</li>
</ul>
${MESH_AMBIENT}`,
        he: `<p>אם מורידים את השיווק, mesh נותן ארבעה דברים בלי לגעת בקוד: <strong>identity + mTLS</strong> בין workloads (SPIFFE IDs כמו <code>spiffe://cluster.local/ns/shop/sa/checkout</code>, תעודות שמתחלפות בערך כל 24 שעות), <strong>שליטה בתעבורת L7</strong> (ניתוב משוקלל, retries, timeouts, outlier detection), <strong>authorization</strong> לפי זהות ה-workload ("רק <code>sa/frontend</code> רשאי לעשות <code>POST /orders</code>") ו-<strong>טלמטריה אחידה</strong> (rate, errors, latency לכל זוג שירותים, ו-propagation של trace headers – האפליקציה עדיין חייבת להעביר את <code>traceparent</code> הלאה).</p>
${MESH_MODES}
<ul>
<li><strong>Istio sidecar</strong> – Envoy בכל pod, מוזרק ע״י mutating webhook. הכי הרבה פיצ'רים, הכי הרבה כפתורים, העלות הכי גבוהה לכל pod. עם native sidecars (SidecarContainers של Kubernetes, GA ב-1.33) הבעיות הישנות של "האפליקציה עולה לפני ה-proxy" ו-"Job שלא נגמר לעולם" כמעט נעלמו.</li>
<li><strong>Istio ambient</strong> – <code>ztunnel</code> אחד לכל node (Rust, רק L4) עושה mTLS דרך מנהרת HBONE (HTTP CONNECT מעל mTLS בפורט 15008). פיצ'רים של L7 דורשים <em>waypoint</em> – Envoy שנפרס לכל namespace או service account ועושה scale כמו Deployment רגיל. משלמים על L7 רק איפה שמשתמשים בו.</li>
<li><strong>Linkerd</strong> – sidecar עם micro-proxy ייעודי ב-Rust; פחות פיצ'רים, overhead נמוך יותר באופן עקבי ותפעול פשוט יותר. שימו לב לשינוי הרישוי: מאז 2024 ה-artifacts של גרסאות stable מגיעים מההפצה של Buoyant (חינם לארגונים קטנים, בתשלום לגדולים), בעוד ש-edge releases נשארו פתוחים – תבדקו את התנאים העדכניים לפני שמתקננים עליו.</li>
<li><strong>Cilium service mesh</strong> – eBPF ל-L3/L4 + Envoy אחד לכל node ל-L7, בלי sidecars; אטרקטיבי אם Cilium כבר ה-CNI שלכם.</li>
</ul>
${MESH_AMBIENT}`
      }
    },
    {
      h: { en: "Traffic shifting, retries and timeouts — done right", he: "Traffic shifting, retries ו-timeouts – כמו שצריך" },
      body: {
        en: `<p>The mesh is where progressive delivery becomes cheap: 5% of real traffic to v2, header-based routing for internal testers, automatic ejection of hosts that start returning 5xx. Argo Rollouts and Flagger drive these weights for you based on Prometheus analysis.</p>
${MESH_SHIFT}
<p>Prefer the <strong>Gateway API</strong> (HTTPRoute attached to a Service — the "GAMMA" mesh profile) for new configs: it is portable across Istio, Linkerd and Cilium, so a future mesh swap doesn't mean rewriting every route.</p>
${MESH_GATEWAY_API}
<p>Retries are the most dangerous feature in the mesh. Istio applies a <strong>default retry policy of 2 attempts</strong> to HTTP routes even if you never configured one, and every tier that retries multiplies load on the tier below:</p>
${MESH_RETRY_MATH}
<blockquote>⚠️ Production tip: write a timeout budget top-down. If the edge SLO is p99 &lt; 1s, give the api 800ms, orders 500ms, db 200ms. A downstream timeout that is <em>longer</em> than its caller's is pure waste: the caller has already given up while the callee keeps burning a thread and a DB connection.</blockquote>`,
        he: `<p>ב-mesh, progressive delivery נהיה זול: 5% מהתעבורה האמיתית ל-v2, ניתוב לפי header לבודקים פנימיים, והוצאה אוטומטית של hosts שמתחילים להחזיר 5xx. Argo Rollouts ו-Flagger מזיזים את המשקלים האלה בשבילכם לפי ניתוח של Prometheus.</p>
${MESH_SHIFT}
<p>לקונפיגים חדשים עדיף <strong>Gateway API</strong> (HTTPRoute שמחובר ל-Service – פרופיל ה-mesh שנקרא "GAMMA"): הוא נייד בין Istio, Linkerd ו-Cilium, כך שהחלפת mesh בעתיד לא אומרת לשכתב כל route.</p>
${MESH_GATEWAY_API}
<p>Retries הם הפיצ'ר הכי מסוכן ב-mesh. Istio מפעיל <strong>retry policy ברירת מחדל של 2 ניסיונות</strong> על HTTP routes גם אם מעולם לא הגדרתם, וכל שכבה שעושה retry מכפילה את העומס על השכבה שמתחתיה:</p>
${MESH_RETRY_MATH}
<blockquote>⚠️ טיפ לפרודקשן: כותבים timeout budget מלמעלה למטה. אם ה-SLO ב-edge הוא p99 &lt; 1s, נותנים ל-api 800ms, ל-orders 500ms, ל-db 200ms. timeout של שירות downstream שהוא <em>ארוך</em> יותר משל מי שקורא לו הוא בזבוז נטו: הקורא כבר ויתר, והנקרא ממשיך לשרוף thread ו-connection ל-DB.</blockquote>`
      }
    },
    {
      h: { en: "The bill: CPU, memory, latency and operational load", he: "החשבון: CPU, זיכרון, latency ועומס תפעולי" },
      body: {
        en: `<p>Numbers to have in your head (they vary by version, payload and features, so measure your own):</p>
<table>
<tr><th>Cost</th><th>Sidecar (Envoy)</th><th>Ambient L4 (ztunnel)</th><th>Ambient + waypoint</th></tr>
<tr><td>CPU</td><td>~0.2-0.5 vCPU per 1000 rps per proxy, x2 hops per call</td><td>small, shared per node</td><td>waypoint scales with L7 traffic only</td></tr>
<tr><td>Memory</td><td>50-100 MiB per pod (more with big configs)</td><td>tens of MiB per node</td><td>per waypoint replica</td></tr>
<tr><td>Added latency</td><td>~1-3 ms p99 per hop (two proxies per call)</td><td>sub-ms</td><td>one extra L7 hop</td></tr>
</table>
<p>Do the math: 2,000 pods x 80 MiB = 160 GiB of RAM, and with a typical 100m CPU request each, 200 vCPU reserved just for proxies. That is often 10-20% of a cluster, which is exactly why ambient exists.</p>
<p>The hidden costs matter more than the CPU:</p>
<ul>
<li><strong>Config scale</strong> — by default every sidecar receives config for every service in the mesh. In a 5,000-service cluster that is hundreds of MiB per proxy and slow pushes. Use the Istio <code>Sidecar</code> resource (or <code>discoverySelectors</code>) to scope what each namespace sees.</li>
<li><strong>Upgrades</strong> — the control plane supports a narrow version window; use revision-based canary upgrades (<code>istio.io/rev=1-27</code> labels) and budget a quarterly upgrade train. Sidecar upgrades need pod restarts; ambient ztunnel upgrades restart a DaemonSet that every pod on the node depends on.</li>
<li><strong>Debuggability</strong> — a 503 now has twice as many suspects. Learn <code>istioctl proxy-status</code>, <code>istioctl analyze</code> and Envoy's response flags (<code>UF</code> upstream failure, <code>UO</code> overflow/circuit open, <code>NR</code> no route, <code>URX</code> retry limit exceeded).</li>
</ul>`,
        he: `<p>מספרים שכדאי שיהיו לכם בראש (משתנים לפי גרסה, גודל payload ופיצ'רים – תמדדו אצלכם):</p>
<table>
<tr><th>עלות</th><th>Sidecar (Envoy)</th><th>Ambient L4 (ztunnel)</th><th>Ambient + waypoint</th></tr>
<tr><td>CPU</td><td>בערך 0.2-0.5 vCPU לכל 1000 rps לכל proxy, כפול 2 hops לכל קריאה</td><td>קטן, משותף לכל node</td><td>ה-waypoint גדל רק עם תעבורת L7</td></tr>
<tr><td>זיכרון</td><td>50-100 MiB לכל pod (יותר עם קונפיג גדול)</td><td>עשרות MiB לכל node</td><td>לכל replica של waypoint</td></tr>
<tr><td>Latency נוסף</td><td>בערך 1-3 ms ב-p99 לכל hop (שני proxies לכל קריאה)</td><td>פחות ממילישנייה</td><td>hop נוסף של L7</td></tr>
</table>
<p>תעשו חשבון: 2,000 pods כפול 80 MiB = 160 GiB זיכרון, ועם requests של 100m CPU לכל אחד = 200 vCPU שמוקצים רק ל-proxies. זה הרבה פעמים 10-20% מה-cluster, ובדיוק בגלל זה ambient קיים.</p>
<p>העלויות הנסתרות חשובות יותר מה-CPU:</p>
<ul>
<li><strong>Config scale</strong> – כברירת מחדל כל sidecar מקבל קונפיג של כל השירותים ב-mesh. ב-cluster עם 5,000 שירותים זה מאות MiB לכל proxy ו-pushes איטיים. משתמשים במשאב <code>Sidecar</code> של Istio (או ב-<code>discoverySelectors</code>) כדי לצמצם מה כל namespace רואה.</li>
<li><strong>שדרוגים</strong> – ה-control plane תומך בחלון גרסאות צר; עושים canary upgrades מבוססי revision (labels של <code>istio.io/rev=1-27</code>) ומתקצבים רכבת שדרוגים רבעונית. שדרוג sidecars דורש restart ל-pods; שדרוג ztunnel ב-ambient עושה restart ל-DaemonSet שכל pod על ה-node תלוי בו.</li>
<li><strong>Debuggability</strong> – ל-503 יש עכשיו פי שניים חשודים. תלמדו את <code>istioctl proxy-status</code>, <code>istioctl analyze</code> ואת ה-response flags של Envoy (<code>UF</code> כשל upstream, <code>UO</code> overflow/circuit פתוח, <code>NR</code> אין route, <code>URX</code> עברנו את מגבלת ה-retries).</li>
</ul>`
      }
    },
    {
      h: { en: "The adoption decision: when NOT to run a mesh", he: "החלטת האימוץ: מתי לא להריץ mesh" },
      body: {
        en: `<p>A staff engineer's job here is mostly saying "not yet" with data. Ask which concrete problem you are buying the mesh for:</p>
<table>
<tr><th>Need</th><th>Cheaper alternative first</th></tr>
<tr><td>Encryption in transit (compliance)</td><td>Cilium/WireGuard transparent encryption, or cloud VPC encryption — no L7 needed</td></tr>
<tr><td>Who-can-talk-to-whom</td><td>NetworkPolicy / CiliumNetworkPolicy (L3/L4, even L7 HTTP in Cilium)</td></tr>
<tr><td>Canary releases</td><td>Argo Rollouts with ingress/Gateway API weights at the edge</td></tr>
<tr><td>Retries/timeouts</td><td>Well-configured client libraries (gRPC service config, resilience4j)</td></tr>
<tr><td>Golden signals per service</td><td>OpenTelemetry auto-instrumentation, or Hubble/Beyla (eBPF)</td></tr>
</table>
<p><strong>Adopt</strong> when several of these are true at once: dozens+ of services in many languages, a zero-trust/mTLS mandate with identity-based authz, multi-cluster traffic, and a platform team that can own the mesh as a product. <strong>Don't</strong> when you have a handful of services, one language with a good RPC framework, no one to own upgrades, or latency-critical paths (trading, real-time bidding) where every extra hop shows up in p99.</p>
<blockquote>💡 Real world: the successful pattern is incremental — start with ambient L4 (mTLS + telemetry, zero app restarts), prove value, then add waypoints only for namespaces that need L7 policy or traffic shifting. Have an exit plan: keep routing in Gateway API, keep authz intent documented, so leaving the mesh is a migration, not a rewrite.</blockquote>`,
        he: `<p>התפקיד של staff engineer כאן הוא בעיקר להגיד "עוד לא" עם נתונים. שואלים איזו בעיה קונקרטית קונים את ה-mesh בשבילה:</p>
<table>
<tr><th>צורך</th><th>חלופה זולה יותר שכדאי לבדוק קודם</th></tr>
<tr><td>הצפנה in transit (compliance)</td><td>הצפנה שקופה של Cilium/WireGuard, או הצפנת VPC של הענן – לא צריך L7</td></tr>
<tr><td>מי מדבר עם מי</td><td>NetworkPolicy / CiliumNetworkPolicy (L3/L4, ואפילו HTTP ב-L7 ב-Cilium)</td></tr>
<tr><td>Canary releases</td><td>Argo Rollouts עם משקלים ב-ingress/Gateway API ב-edge</td></tr>
<tr><td>Retries/timeouts</td><td>client libraries מוגדרות טוב (gRPC service config, resilience4j)</td></tr>
<tr><td>Golden signals לכל שירות</td><td>OpenTelemetry auto-instrumentation, או Hubble/Beyla (eBPF)</td></tr>
</table>
<p><strong>מאמצים</strong> כשכמה מאלה נכונים ביחד: עשרות שירותים ומעלה בהרבה שפות, דרישת zero-trust/mTLS עם authz מבוסס זהות, תעבורה multi-cluster, וצוות פלטפורמה שיכול להחזיק את ה-mesh כמוצר. <strong>לא מאמצים</strong> כשיש קומץ שירותים, שפה אחת עם RPC framework טוב, אין מי שיחזיק שדרוגים, או נתיבים קריטיים ל-latency (trading, real-time bidding) שבהם כל hop נוסף מופיע ב-p99.</p>
<blockquote>💡 מהשטח: הדפוס שעובד הוא הדרגתי – מתחילים עם ambient ב-L4 (mTLS + טלמטריה, אפס restarts לאפליקציות), מוכיחים ערך, ואז מוסיפים waypoints רק ל-namespaces שצריכים policy של L7 או traffic shifting. ותחזיקו exit plan: routing ב-Gateway API, כוונות ה-authz מתועדות, כך שיציאה מה-mesh היא מיגרציה ולא שכתוב.</blockquote>`
      }
    }
  ],
  diagram: "client pod --(plaintext)--> ztunnel(node A) ==HBONE mTLS :15008==> [waypoint (L7: retry/route/authz)] ==> ztunnel(node B) --> server pod\nsidecar mode:  app -> envoy ==mTLS==> envoy -> app   (2 proxies per call)",
  handsOn: [
    { cmd: "istioctl x precheck && istioctl install --set profile=ambient -y && kubectl label ns shop istio.io/dataplane-mode=ambient", what: { en: "Install Istio ambient and enroll a namespace — pods get mTLS without restarting.", he: "מתקינים Istio ambient ומצרפים namespace – ה-pods מקבלים mTLS בלי restart." } },
    { cmd: "istioctl ztunnel-config workloads | grep shop", what: { en: "Confirm ztunnel sees the workloads and their protocol (HBONE = in mesh).", he: "מוודאים ש-ztunnel רואה את ה-workloads ואת הפרוטוקול שלהם (HBONE = בתוך ה-mesh)." } },
    { cmd: "kubectl exec deploy/frontend -c istio-proxy -- pilot-agent request GET stats | grep -E 'upstream_rq_retry|outlier'", what: { en: "In sidecar mode, read Envoy counters to see how many retries and ejections are actually happening.", he: "במצב sidecar, קוראים counters של Envoy כדי לראות כמה retries ו-ejections קורים בפועל." } },
    { cmd: "istioctl analyze -A && istioctl proxy-status", what: { en: "Find config errors and proxies that are out of sync with istiod (STALE).", he: "מוצאים שגיאות קונפיג ו-proxies שלא מסונכרנים עם istiod (STALE)." } }
  ],
  mnemonic: { en: "MESH = mTLS, Experiments (traffic shift), Signals (telemetry), Hops (you pay per hop). Retry at ONE layer.", he: "MESH = mTLS, Experiments (traffic shift), Signals (טלמטריה), Hops (משלמים על כל hop). Retry רק בשכבה אחת." },
  pitfalls: [
    { en: "Retries at every layer plus Istio's implicit 2-attempt default: a brownout becomes a 27x retry storm. Set retries explicitly, at one layer, with budgets.", he: "Retries בכל שכבה ועוד ברירת המחדל הסמויה של Istio של 2 ניסיונות: האטה הופכת לסערת retries של פי 27. מגדירים retries במפורש, בשכבה אחת, עם budget." },
    { en: "Turning on STRICT mTLS before every client is in the mesh — plaintext callers (CronJobs, legacy VMs, health checkers) get connection resets. Run PERMISSIVE, watch telemetry for plaintext traffic, then flip.", he: "להדליק STRICT mTLS לפני שכל ה-clients בתוך ה-mesh – קוראים ב-plaintext (CronJobs, VMs ישנים, health checkers) מקבלים connection reset. מריצים PERMISSIVE, מסתכלים בטלמטריה על תעבורת plaintext, ורק אז מחליפים." },
    { en: "Never scoping sidecar config: every proxy holds the whole mesh, memory grows with service count and config pushes take minutes.", he: "לא לצמצם את קונפיג ה-sidecar: כל proxy מחזיק את כל ה-mesh, הזיכרון גדל עם מספר השירותים ו-pushes של קונפיג לוקחים דקות." },
    { en: "Adopting a mesh to get 'observability' when the real gap is app instrumentation — the mesh sees request edges, not why the handler was slow.", he: "לאמץ mesh בשביל 'observability' כשהפער האמיתי הוא instrumentation באפליקציה – ה-mesh רואה את קצוות הבקשה, לא למה ה-handler היה איטי." }
  ],
  interview: [
    {
      q: { en: "Your org has 40 services, mostly Go with gRPC, and security asks for mTLS everywhere. Would you adopt Istio?", he: "בארגון 40 שירותים, רובם Go עם gRPC, והאבטחה מבקשת mTLS בכל מקום. הייתם מאמצים Istio?" },
      a: { en: "Separate the requirement from the tool. mTLS-everywhere alone can be met by Cilium transparent encryption or Istio ambient L4 only — no sidecars, no L7. gRPC already gives good retries/deadlines via service config. I'd propose ambient L4 (identity-based mTLS + telemetry, enroll namespace by namespace, no restarts), define success metrics (percent of traffic mTLS, p99 delta under 1ms, zero incidents from the mesh), assign an owning team and upgrade cadence, and defer waypoints until a concrete L7 need — canaries or path-level authz — appears. I'd reject full sidecar Istio as the first step: 40 services don't justify the operational surface.", he: "מפרידים בין הדרישה לכלי. mTLS בכל מקום לבד אפשר להשיג עם הצפנה שקופה של Cilium או Istio ambient ב-L4 בלבד – בלי sidecars, בלי L7. gRPC כבר נותן retries ו-deadlines טובים דרך service config. הייתי מציע ambient L4 (mTLS מבוסס זהות + טלמטריה, צירוף namespace אחרי namespace, בלי restarts), מגדיר מדדי הצלחה (אחוז תעבורה ב-mTLS, תוספת p99 מתחת ל-1ms, אפס תקלות בגלל ה-mesh), ממנה צוות בעלים וקצב שדרוגים, ודוחה waypoints עד שיש צורך L7 קונקרטי – canaries או authz לפי path. הייתי דוחה Istio מלא עם sidecars כצעד ראשון: 40 שירותים לא מצדיקים את המשטח התפעולי." }
    },
    {
      q: { en: "After enabling the mesh, p99 latency of a 6-hop request path rose by 15ms. How do you investigate?", he: "אחרי הפעלת ה-mesh, ה-p99 של נתיב בקשה עם 6 hops עלה ב-15ms. איך חוקרים?" },
      a: { en: "6 hops x 2 proxies = 12 proxy traversals; ~1ms each at p99 is plausible, so first quantify per hop with the mesh's own metrics (istio_request_duration_milliseconds on source vs destination reporter) and traces. Then look for amplifiers: proxy CPU throttling (sidecar CPU limits too low — check container_cpu_cfs_throttled), retries hiding failures (URX/retry counters), connection pool limits queueing (UO flags), TLS handshakes from no connection reuse, and huge xDS configs. Fixes: remove CPU limits on proxies or raise them, scope config, tune pools, collapse chatty hops, or move hot paths to ambient L4 where per-hop overhead is sub-millisecond.", he: "6 hops כפול 2 proxies = 12 מעברים דרך proxy; בערך 1ms לכל אחד ב-p99 זה סביר, אז קודם מכמתים לכל hop עם המטריקות של ה-mesh עצמו (istio_request_duration_milliseconds מצד ה-source מול ה-destination) ו-traces. אחר כך מחפשים מגבירים: CPU throttling של ה-proxy (limits נמוכים מדי ל-sidecar – בודקים container_cpu_cfs_throttled), retries שמסתירים כשלים (counters של URX/retry), מגבלות connection pool שגורמות לתור (flags של UO), TLS handshakes בגלל שאין reuse של connections, וקונפיגי xDS ענקיים. תיקונים: להוריד או להגדיל CPU limits ל-proxies, לצמצם קונפיג, לכוונן pools, לאחד hops פטפטניים, או להעביר נתיבים חמים ל-ambient L4 שבו ה-overhead לכל hop מתחת למילישנייה." }
    },
    {
      q: { en: "Sidecar vs ambient: what do you lose with ambient?", he: "Sidecar מול ambient: מה מפסידים ב-ambient?" },
      a: { en: "L7 is no longer co-located with the workload: it runs in a shared waypoint, so L7 policy is enforced at the destination side and the waypoint is a new scaling/availability unit (and shared fate for the namespace). ztunnel is a per-node shared component, so a ztunnel bug or upgrade affects all pods on that node — a different blast radius than per-pod sidecars. Some advanced Envoy features and EnvoyFilter customisations aren't equivalent, and multi-cluster and VM support matured later than in sidecar mode. You gain much lower resource cost, no pod restarts on mesh upgrades, and simpler onboarding.", he: "L7 כבר לא יושב ליד ה-workload: הוא רץ ב-waypoint משותף, כך ש-policy של L7 נאכף בצד היעד וה-waypoint הוא יחידת scale וזמינות חדשה (וגורל משותף לכל ה-namespace). ztunnel הוא רכיב משותף לכל node, אז באג או שדרוג שלו משפיעים על כל ה-pods ב-node – blast radius שונה מ-sidecar לכל pod. חלק מהפיצ'רים המתקדמים של Envoy והתאמות EnvoyFilter אינם שקולים, ותמיכה ב-multi-cluster וב-VMs הבשילה מאוחר יותר מאשר במצב sidecar. מרוויחים עלות משאבים נמוכה בהרבה, בלי restarts ל-pods בשדרוגי mesh, ו-onboarding פשוט יותר." }
    }
  ],
  quiz: [
    {
      q: { en: "In Istio ambient mode, which component provides L7 features such as HTTP retries and path-based authorization?", he: "במצב ambient של Istio, איזה רכיב מספק פיצ'רים של L7 כמו HTTP retries ו-authorization לפי path?" },
      options: [
        { en: "ztunnel", he: "ztunnel" },
        { en: "A waypoint proxy (Envoy) deployed per namespace or service account", he: "Waypoint proxy (Envoy) שנפרס לכל namespace או service account" },
        { en: "kube-proxy", he: "kube-proxy" },
        { en: "The istio-cni DaemonSet", he: "ה-DaemonSet של istio-cni" }
      ], answer: 1,
      explain: { en: "ztunnel is L4 only (mTLS, L4 authz, telemetry). L7 processing happens in an optional waypoint Envoy that you deploy where needed.", he: "ztunnel הוא L4 בלבד (mTLS, authz של L4, טלמטריה). עיבוד L7 קורה ב-waypoint Envoy אופציונלי שפורסים רק איפה שצריך." }
    },
    {
      q: { en: "Edge, api and orders each retry failed calls 2 times (3 attempts). During a DB brownout, how many DB calls can one user request generate in the worst case?", he: "edge, api ו-orders עושים כל אחד 2 retries (3 ניסיונות). בזמן האטה של ה-DB, כמה קריאות ל-DB יכולה ליצור בקשת משתמש אחת במקרה הגרוע?" },
      options: [
        { en: "3", he: "3" },
        { en: "6", he: "6" },
        { en: "9", he: "9" },
        { en: "27", he: "27" }
      ], answer: 3,
      explain: { en: "Retries multiply across tiers: 3 x 3 x 3 = 27. Retry at one layer with a budget.", he: "Retries מוכפלים בין שכבות: 3 x 3 x 3 = 27. עושים retry בשכבה אחת עם budget." }
    },
    {
      q: { en: "The only requirement is 'encrypt all pod-to-pod traffic'. What is usually the lowest-cost answer?", he: "הדרישה היחידה היא 'להצפין את כל התעבורה בין pods'. מה בדרך כלל התשובה הזולה ביותר?" },
      options: [
        { en: "Istio with sidecars everywhere", he: "Istio עם sidecars בכל מקום" },
        { en: "Transparent encryption (Cilium WireGuard) or an L4-only ambient mesh", he: "הצפנה שקופה (Cilium WireGuard) או ambient mesh ב-L4 בלבד" },
        { en: "Rewrite all services to use TLS libraries", he: "לשכתב את כל השירותים לשימוש בספריות TLS" },
        { en: "NetworkPolicy deny-all", he: "NetworkPolicy של deny-all" }
      ], answer: 1,
      explain: { en: "Encryption alone needs no L7 proxy. Node-level WireGuard or ztunnel gives it at a fraction of the sidecar cost. NetworkPolicy restricts but does not encrypt.", he: "הצפנה לבד לא צריכה proxy של L7. WireGuard ברמת node או ztunnel נותנים אותה בשבריר מעלות sidecar. NetworkPolicy מגביל אבל לא מצפין." }
    },
    {
      q: { en: "A client's timeout is 1s and its downstream service's timeout to the DB is 5s. What is the problem?", he: "ל-client יש timeout של 1s ולשירות ה-downstream שלו יש timeout של 5s מול ה-DB. מה הבעיה?" },
      options: [
        { en: "None, longer downstream timeouts are safer", he: "אין, timeouts ארוכים יותר ב-downstream בטוחים יותר" },
        { en: "Work continues for up to 4s after the caller gave up, wasting threads and connections", he: "העבודה ממשיכה עד 4s אחרי שהקורא ויתר, ומבזבזת threads ו-connections" },
        { en: "The mesh will reject the config", he: "ה-mesh ידחה את הקונפיג" },
        { en: "It disables mTLS", he: "זה מבטל את ה-mTLS" }
      ], answer: 1,
      explain: { en: "Timeouts should shrink as you go deeper. A downstream timeout longer than the caller's produces orphaned work that piles up during incidents.", he: "Timeouts צריכים להתקצר ככל שיורדים לעומק. timeout ב-downstream שארוך משל הקורא מייצר עבודה יתומה שנערמת בזמן תקלות." }
    }
  ],
  related: ["k8s-security-policy", "k8s-argo-rollouts", "arch-resilience", "net-isolation", "staff-ebpf-cilium", "staff-zero-trust-secrets"]
});
}

// ---------------------------------------------------------------------------
// 11. Platform engineering
// ---------------------------------------------------------------------------
{
const IDP_LAYERS = `<pre>  Developer interfaces   Backstage portal | CLI | PR-based (GitOps repo) | API
  -------------------------------------------------------------------------
  Golden paths           templates: "Go gRPC service", "Python worker", "static site"
                         = repo + CI + Dockerfile + Helm/Kustomize + dashboards + alerts + SLO
  -------------------------------------------------------------------------
  Platform APIs          Crossplane / Terraform modules / operators:
                         "give me a Postgres", "give me a queue", "give me a namespace"
  -------------------------------------------------------------------------
  Guardrails             admission policy, quotas, cost labels, workload identity, scanning
  -------------------------------------------------------------------------
  Infrastructure         clusters, networks, accounts, registries, secrets backends</pre>`;

const IDP_CATALOG = `<pre># catalog-info.yaml at the root of every repo: the service's identity card
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payments-api
  description: Card authorisation and capture
  annotations:
    github.com/project-slug: acme/payments-api
    backstage.io/techdocs-ref: dir:.
    pagerduty.com/service-id: P1AB2CD
    argocd/app-name: payments-api-prod
  tags: [go, grpc, pci]
spec:
  type: service
  lifecycle: production
  owner: group:team-payments        # ownership is the most valuable field in the catalog
  system: payments
  providesApis: [payments-v1]
  dependsOn: [resource:payments-db, component:fraud-scoring]</pre>`;

const IDP_TEMPLATE = `<pre># Backstage Software Template (scaffolder): the golden path as code
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata: { name: go-grpc-service, title: Go gRPC service (golden path) }
spec:
  owner: group:platform
  type: service
  parameters:
  - title: Service
    required: [name, owner]
    properties:
      name:  { type: string, pattern: '^[a-z][a-z0-9-]{2,30}$' }
      owner: { type: string, ui:field: OwnerPicker }
      tier:  { type: string, enum: [tier1, tier2, tier3], default: tier2 }
  steps:
  - id: fetch
    action: fetch:template
    input: { url: ./skeleton, values: { name: "\${{ parameters.name }}", owner: "\${{ parameters.owner }}" } }
  - id: publish
    action: publish:github
    input: { repoUrl: "github.com?owner=acme&amp;repo=\${{ parameters.name }}", defaultBranch: main }
  - id: register
    action: catalog:register
    input: { repoContentsUrl: "\${{ steps.publish.output.repoContentsUrl }}", catalogInfoPath: /catalog-info.yaml }</pre>`;

const IDP_TENANCY = `<pre># Namespace-as-a-service: what the platform stamps out per team (via template or operator)
apiVersion: v1
kind: ResourceQuota
metadata: { name: team-quota, namespace: team-payments }
spec:
  hard: { requests.cpu: "40", requests.memory: 80Gi, limits.memory: 120Gi, pods: "300",
          services.loadbalancers: "0", persistentvolumeclaims: "20" }
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: team-payments }
spec: { podSelector: {}, policyTypes: [Ingress] }
---
# + LimitRange defaults, RoleBinding of the team's IdP group to "edit",
#   PSA label enforce=restricted, cost-center labels, Argo CD AppProject scoped to this namespace

# vcluster: a virtual control plane inside a host namespace
vcluster create team-ml --namespace vc-team-ml
vcluster connect team-ml      # kubeconfig now points at the virtual API server
kubectl get crds              # tenant can install its own CRDs/operators without touching the host</pre>`;

INFRA.lessons.push({
  id: "staff-platform-engineering",
  track: "staff",
  order: 11,
  icon: "🛤️",
  level: 3,
  minutes: 17,
  title: { en: "Platform Engineering: IDPs, Golden Paths & Multi-Tenancy", he: "Platform Engineering: IDP, Golden Paths ו-Multi-Tenancy" },
  tldr: {
    en: "An Internal Developer Platform is a product whose customers are your engineers: paved golden paths (repo + CI + deploy + observability in minutes), self-service APIs behind guardrails, a catalog that knows who owns what, and a tenancy model chosen per isolation need — measured by adoption and DORA, not by how many tools you installed.",
    he: "Internal Developer Platform הוא מוצר שהלקוחות שלו הם המהנדסים שלכם: golden paths סלולים (repo + CI + deploy + observability תוך דקות), APIs של self-service מאחורי guardrails, catalog שיודע מי הבעלים של מה, ומודל tenancy שנבחר לפי צורך הבידוד – ונמדד ב-adoption וב-DORA, לא בכמה כלים התקנתם."
  },
  analogy: {
    en: "A city planner doesn't forbid walking on the grass; she paves the paths people already walk, adds lights and signs, and the grass survives on its own. A golden path is the paved route: so much easier than the alternative that nobody needs a policy to force it. Ticket-ops is the opposite: a guard at every junction asking you to fill a form.",
    he: "מתכננת עיר לא אוסרת ללכת על הדשא; היא סוללת את השבילים שאנשים כבר הולכים בהם, מוסיפה תאורה ושילוט, והדשא שורד מעצמו. Golden path הוא השביל הסלול: כל כך יותר קל מהאלטרנטיבה שאף אחד לא צריך policy כדי להכריח אותו. Ticket-ops זה ההפך: שומר בכל צומת שמבקש למלא טופס."
  },
  sections: [
    {
      h: { en: "What an IDP is (and isn't)", he: "מה זה IDP (ומה לא)" },
      body: {
        en: `<p>An <strong>Internal Developer Platform</strong> is the sum of tools, APIs and paved workflows that let a product team go from idea to production — and operate it — without filing tickets. It is <em>not</em> "we installed Backstage". A portal is just one interface; the value is in the layers beneath it:</p>
${IDP_LAYERS}
<p>The core idea from <em>Team Topologies</em>: the platform team exists to reduce the <strong>cognitive load</strong> of stream-aligned teams. If every team must understand Karpenter, IRSA, Argo CD sync waves and Prometheus recording rules to ship a service, you've built a toolbox, not a platform.</p>
<ul>
<li><strong>Golden path</strong> — an opinionated, supported, end-to-end route for a common case. Optional but so convenient that 80%+ of new services choose it. Off-path is allowed, but then the team owns the extra support.</li>
<li><strong>Self-service with guardrails</strong> — developers can create a database or namespace in minutes because policy (quotas, admission rules, cost labels, encryption defaults) is enforced automatically, not by a reviewer.</li>
<li><strong>Thinnest viable platform</strong> — start with a wiki page and a template repo if that solves the pain. Build abstractions only where you see repeated toil.</li>
</ul>
<blockquote>⚠️ Production tip: avoid the leaky "abstraction over Kubernetes" trap. A custom 30-field YAML that compiles into a Deployment hides nothing when the pod crashloops at 3 AM. Good abstractions hide <em>decisions</em> (which node pool, which IAM wiring, which dashboards), not <em>debugging</em>.</blockquote>`,
        he: `<p><strong>Internal Developer Platform</strong> הוא סך הכלים, ה-APIs וה-workflows הסלולים שמאפשרים לצוות מוצר להגיע מרעיון לפרודקשן – ולתפעל את זה – בלי לפתוח tickets. זה <em>לא</em> "התקנו Backstage". פורטל הוא רק ממשק אחד; הערך נמצא בשכבות שמתחתיו:</p>
${IDP_LAYERS}
<p>הרעיון המרכזי מ-<em>Team Topologies</em>: צוות הפלטפורמה קיים כדי להוריד את ה-<strong>cognitive load</strong> של צוותי המוצר. אם כל צוות צריך להבין Karpenter, IRSA, sync waves של Argo CD ו-recording rules של Prometheus כדי להעלות שירות, בניתם ארגז כלים, לא פלטפורמה.</p>
<ul>
<li><strong>Golden path</strong> – מסלול מקצה לקצה, דעתני ונתמך, למקרה נפוץ. אופציונלי, אבל כל כך נוח ש-80%+ מהשירותים החדשים בוחרים בו. מותר לצאת מהמסלול, אבל אז הצוות לוקח על עצמו את התמיכה הנוספת.</li>
<li><strong>Self-service עם guardrails</strong> – מפתחים יכולים ליצור database או namespace תוך דקות, כי ה-policy (quotas, חוקי admission, cost labels, הצפנה כברירת מחדל) נאכף אוטומטית, לא ע״י reviewer.</li>
<li><strong>Thinnest viable platform</strong> – אם דף wiki ו-template repo פותרים את הכאב, מתחילים משם. בונים אבסטרקציות רק איפה שרואים toil חוזר.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: היזהרו ממלכודת ה-"אבסטרקציה מעל Kubernetes" שדולפת. YAML מותאם עם 30 שדות שמתקמפל ל-Deployment לא מסתיר כלום כשה-pod עושה crashloop בשלוש בלילה. אבסטרקציות טובות מסתירות <em>החלטות</em> (איזה node pool, איזה חיווט IAM, אילו dashboards), לא <em>דיבאגינג</em>.</blockquote>`
      }
    },
    {
      h: { en: "Backstage: catalog first, templates second", he: "Backstage: קודם catalog, אחר כך templates" },
      body: {
        en: `<p><strong>Backstage</strong> (Spotify, CNCF incubating) is a framework for building a developer portal: a <em>software catalog</em>, <em>software templates</em> (scaffolder), <em>TechDocs</em> (docs-as-code) and a plugin ecosystem (Argo CD, PagerDuty, Kubernetes, cost, scorecards). Commercial alternatives — Port, Cortex, OpsLevel, Roadie (hosted Backstage) — trade flexibility for much less engineering effort.</p>
${IDP_CATALOG}
<p>The catalog is the foundation: ownership, dependencies, on-call and docs in one graph. That alone answers incident questions like "who owns the service calling <code>payments-db</code>?" Then templates turn the golden path into one click:</p>
${IDP_TEMPLATE}
<blockquote>💡 Real world: Backstage is a React + Node.js app you must build, upgrade (monthly releases) and staff — expect at least 1-2 engineers ongoing for a serious deployment. Teams that fail with it usually launched a portal with an empty, stale catalog. Auto-ingest <code>catalog-info.yaml</code> from all repos, fail CI when it is missing, and use scorecards (has owner, has runbook, has SLO, on latest base image) to keep it alive.</blockquote>`,
        he: `<p><strong>Backstage</strong> (של Spotify, ב-CNCF בשלב incubating) הוא framework לבניית developer portal: <em>software catalog</em>, <em>software templates</em> (scaffolder), <em>TechDocs</em> (docs-as-code) ו-ecosystem של plugins (Argo CD, PagerDuty, Kubernetes, עלויות, scorecards). חלופות מסחריות – Port, Cortex, OpsLevel, Roadie (Backstage מנוהל) – מחליפות גמישות בהרבה פחות עבודת הנדסה.</p>
${IDP_CATALOG}
<p>ה-catalog הוא היסוד: ownership, תלויות, on-call ותיעוד בגרף אחד. רק זה כבר עונה על שאלות בזמן תקלה כמו "מי הבעלים של השירות שקורא ל-<code>payments-db</code>?". אחר כך ה-templates הופכים את ה-golden path לקליק אחד:</p>
${IDP_TEMPLATE}
<blockquote>💡 מהשטח: Backstage הוא אפליקציית React + Node.js שצריך לבנות, לשדרג (releases חודשיים) ולאייש – תצפו לפחות ל-1-2 מהנדסים באופן שוטף להטמעה רצינית. צוותים שנכשלים איתו בדרך כלל השיקו פורטל עם catalog ריק ולא מעודכן. תעשו ingest אוטומטי של <code>catalog-info.yaml</code> מכל ה-repos, תכשילו CI כשהוא חסר, ותשתמשו ב-scorecards (יש owner, יש runbook, יש SLO, על base image עדכני) כדי לשמור אותו חי.</blockquote>`
      }
    },
    {
      h: { en: "Multi-tenancy on Kubernetes: namespace vs vcluster vs cluster-per-tenant", he: "Multi-tenancy ב-Kubernetes: namespace מול vcluster מול cluster לכל tenant" },
      body: {
        en: `<p>The tenancy model is one of the most expensive decisions to reverse. Choose by isolation need and trust level, not by fashion:</p>
<table>
<tr><th></th><th>Namespace per tenant</th><th>vcluster (virtual cluster)</th><th>Cluster per tenant</th></tr>
<tr><td>Isolation</td><td>Soft: shared API server, CRDs, nodes, kernel</td><td>Own API server/etcd (or SQLite/k8s-backed), shared nodes &amp; kernel</td><td>Hard: separate control plane, nodes, often account</td></tr>
<tr><td>Tenant can install CRDs/operators</td><td>No (cluster-scoped)</td><td>Yes, inside the virtual cluster</td><td>Yes</td></tr>
<tr><td>Cost per tenant</td><td>~zero</td><td>a few hundred MiB + small CPU for the virtual control plane</td><td>control plane fee (EKS ~$73/month) + system add-ons per cluster</td></tr>
<tr><td>Ops burden</td><td>Lowest</td><td>Medium (sync quirks, version per vcluster)</td><td>Highest: N upgrades, N sets of add-ons — needs fleet tooling</td></tr>
<tr><td>Fits</td><td>Internal teams that trust each other</td><td>Dev/preview envs, CI, teams needing own CRDs</td><td>Untrusted/regulated tenants, noisy neighbours, per-customer SaaS isolation</td></tr>
</table>
${IDP_TENANCY}
<p>Namespace tenancy only works with the full kit: ResourceQuota + LimitRange, default-deny NetworkPolicy, PSA <code>restricted</code>, RBAC bound to IdP groups, Argo CD AppProjects limiting destinations, and dedicated node pools (taints) for noisy or sensitive tenants. Shared kernel means a container escape is a cross-tenant breach; for truly hostile code add sandboxed runtimes (gVisor, Kata) or separate clusters.</p>`,
        he: `<p>מודל ה-tenancy הוא אחת ההחלטות היקרות ביותר לשנות אחורה. בוחרים לפי צורך הבידוד ורמת האמון, לא לפי אופנה:</p>
<table>
<tr><th></th><th>Namespace לכל tenant</th><th>vcluster (cluster וירטואלי)</th><th>Cluster לכל tenant</th></tr>
<tr><td>בידוד</td><td>רך: API server, CRDs, nodes ו-kernel משותפים</td><td>API server/etcd משלו (או SQLite/מגובה k8s), nodes ו-kernel משותפים</td><td>קשיח: control plane, nodes ולרוב גם account נפרדים</td></tr>
<tr><td>ה-tenant יכול להתקין CRDs/operators</td><td>לא (cluster-scoped)</td><td>כן, בתוך ה-cluster הווירטואלי</td><td>כן</td></tr>
<tr><td>עלות לכל tenant</td><td>בערך אפס</td><td>כמה מאות MiB ו-CPU קטן ל-control plane הווירטואלי</td><td>תשלום על control plane (EKS בערך $73 לחודש) + system add-ons לכל cluster</td></tr>
<tr><td>עומס תפעולי</td><td>הכי נמוך</td><td>בינוני (quirks של sync, גרסה לכל vcluster)</td><td>הכי גבוה: N שדרוגים, N סטים של add-ons – צריך fleet tooling</td></tr>
<tr><td>מתאים ל</td><td>צוותים פנימיים שסומכים זה על זה</td><td>סביבות dev/preview, CI, צוותים שצריכים CRDs משלהם</td><td>tenants לא אמינים/רגולטוריים, noisy neighbours, בידוד לכל לקוח ב-SaaS</td></tr>
</table>
${IDP_TENANCY}
<p>Tenancy לפי namespace עובד רק עם הערכה המלאה: ResourceQuota + LimitRange, NetworkPolicy של default-deny, PSA <code>restricted</code>, RBAC שמחובר לקבוצות מה-IdP, AppProjects של Argo CD שמגבילים יעדים, ו-node pools ייעודיים (taints) ל-tenants רועשים או רגישים. Kernel משותף אומר ש-container escape הוא פריצה בין tenants; לקוד באמת עוין מוסיפים sandboxed runtimes (gVisor, Kata) או clusters נפרדים.</p>`
      }
    },
    {
      h: { en: "Platform as a product: metrics that matter", he: "Platform as a product: המדדים שחשובים" },
      body: {
        en: `<p>A platform without users is a cost center. Run it like a product: user research (shadow a team shipping their first service), a public roadmap, SLOs for the platform itself, deprecation policy, and metrics on three levels:</p>
<ul>
<li><strong>Delivery outcomes (DORA)</strong> — deployment frequency, lead time for changes (commit to prod), change failure rate, and failed-deployment recovery time (the renamed MTTR). Recent DORA reports also track <em>rework rate</em> (unplanned deploys to fix user-facing issues). Measure per team, compare golden-path vs off-path services.</li>
<li><strong>Adoption</strong> — % of services on the golden path, % on the latest template version, time-to-first-deploy for a new service (target: under a day, ideally under an hour), number of tickets to the platform team per month (should go <em>down</em>).</li>
<li><strong>Experience</strong> — quarterly developer survey / NPS, SPACE-style satisfaction, top-3 friction points.</li>
</ul>
<pre>Before IDP                        After 9 months (golden path)
time to first prod deploy: 3 wks  -&gt; 45 min
platform tickets / month:  220    -&gt; 60
deploys / service / week:  1.5    -&gt; 9
change failure rate:       18%    -&gt; 7%  (standard canary + auto-rollback in template)
services on golden path:   0%     -&gt; 72%</pre>
<blockquote>💡 Real world: mandates kill platforms. If teams must be forced onto the path, the path is worse than what they have. Win the next three teams one at a time, publish their before/after numbers, and let adoption pull. Keep an "escape hatch" (raw Helm/Terraform) so power users don't fork the platform out of frustration.</blockquote>`,
        he: `<p>פלטפורמה בלי משתמשים היא cost center. מריצים אותה כמו מוצר: מחקר משתמשים (ללוות צוות שמעלה את השירות הראשון שלו), roadmap פומבי, SLOs לפלטפורמה עצמה, מדיניות deprecation, ומדדים בשלוש רמות:</p>
<ul>
<li><strong>תוצאות delivery (DORA)</strong> – deployment frequency, lead time for changes (מ-commit לפרודקשן), change failure rate, ו-failed-deployment recovery time (ה-MTTR בשם החדש). דוחות DORA האחרונים עוקבים גם אחרי <em>rework rate</em> (deploys לא מתוכננים לתיקון בעיות שמשתמשים רואים). מודדים לכל צוות, ומשווים שירותים על ה-golden path מול כאלה שמחוצה לו.</li>
<li><strong>Adoption</strong> – % שירותים על ה-golden path, % על הגרסה העדכנית של ה-template, time-to-first-deploy לשירות חדש (יעד: פחות מיום, באידיאל פחות משעה), מספר tickets לצוות הפלטפורמה בחודש (צריך <em>לרדת</em>).</li>
<li><strong>חוויה</strong> – סקר מפתחים רבעוני / NPS, שביעות רצון בסגנון SPACE, שלוש נקודות החיכוך המובילות.</li>
</ul>
<pre>Before IDP                        After 9 months (golden path)
time to first prod deploy: 3 wks  -&gt; 45 min
platform tickets / month:  220    -&gt; 60
deploys / service / week:  1.5    -&gt; 9
change failure rate:       18%    -&gt; 7%  (standard canary + auto-rollback in template)
services on golden path:   0%     -&gt; 72%</pre>
<blockquote>💡 מהשטח: חובות (mandates) הורגים פלטפורמות. אם צריך להכריח צוותים לעלות על המסלול, המסלול גרוע ממה שיש להם. מנצחים את שלושת הצוותים הבאים אחד אחד, מפרסמים את מספרי ה-before/after שלהם, ונותנים ל-adoption למשוך. משאירים "escape hatch" (Helm/Terraform גולמי) כדי ש-power users לא יעשו fork לפלטפורמה מתוך תסכול.</blockquote>`
      }
    }
  ],
  diagram: "dev --(Backstage template)--> new repo [code + CI + Dockerfile + chart + catalog-info]\n   --> CI (build, scan, sign) --> GitOps repo --> Argo CD --> namespace (quota, netpol, PSA, IAM)\n   --> dashboards + alerts + SLO auto-created --> catalog shows owner/on-call/docs",
  handsOn: [
    { cmd: "npx @backstage/create-app@latest && cd my-portal && yarn start", what: { en: "Spin up a local Backstage instance and register a catalog-info.yaml from one of your repos.", he: "מרימים Backstage מקומי ורושמים catalog-info.yaml מאחד ה-repos שלכם." } },
    { cmd: "vcluster create dev-alice -n vc-dev-alice && vcluster connect dev-alice -- kubectl get ns", what: { en: "Create a virtual cluster inside a host namespace and see it behaves like a full cluster.", he: "יוצרים cluster וירטואלי בתוך namespace של ה-host ורואים שהוא מתנהג כמו cluster מלא." } },
    { cmd: "kubectl describe resourcequota -n team-payments", what: { en: "See how much of the team's quota is used — the guardrail behind namespace self-service.", he: "רואים כמה מה-quota של הצוות בשימוש – ה-guardrail שמאחורי self-service של namespaces." } },
    { cmd: "gh api repos/acme/payments-api/deployments --paginate -q '.[].created_at' | cut -c1-10 | sort | uniq -c | tail", what: { en: "A quick-and-dirty deployment frequency count from GitHub deployments, a first DORA data point.", he: "ספירה מהירה ומלוכלכת של deployment frequency מתוך GitHub deployments – נקודת נתונים ראשונה ל-DORA." } }
  ],
  mnemonic: { en: "PAVE: Product mindset, Adoption over mandate, Visible ownership (catalog), Escape hatch.", he: "PAVE: Product mindset, Adoption ולא כפייה, Visible ownership (catalog), Escape hatch." },
  pitfalls: [
    { en: "Launching a portal before solving a real pain: a pretty Backstage with a stale catalog and no golden path gets abandoned in a quarter.", he: "להשיק פורטל לפני שפותרים כאב אמיתי: Backstage יפה עם catalog לא מעודכן ובלי golden path ננטש תוך רבעון." },
    { en: "Abstractions that hide debugging instead of decisions — developers end up learning both Kubernetes and your DSL.", he: "אבסטרקציות שמסתירות דיבאגינג במקום החלטות – המפתחים נאלצים ללמוד גם Kubernetes וגם את ה-DSL שלכם." },
    { en: "Picking namespace tenancy for untrusted tenants: shared kernel, shared CRDs and shared API server limits make it soft isolation only.", he: "לבחור tenancy לפי namespace ל-tenants לא אמינים: kernel משותף, CRDs משותפים ו-API server משותף הופכים את זה לבידוד רך בלבד." },
    { en: "Golden path templates that are copied once and never updated: add a template version label and a scorecard so drift from the path is visible.", he: "Templates של golden path שמועתקים פעם אחת ולא מתעדכנים לעולם: מוסיפים label של גרסת template ו-scorecard כדי שסטייה מהמסלול תהיה גלויה." }
  ],
  interview: [
    {
      q: { en: "You're asked to build an IDP for 300 engineers. What do you do in the first 90 days?", he: "מבקשים מכם לבנות IDP ל-300 מהנדסים. מה עושים ב-90 הימים הראשונים?" },
      a: { en: "Weeks 1-3: discovery — interview 8-10 teams, shadow a new-service creation end to end, mine the ticket queue to find the top toil (usually: new service setup, environments, DB provisioning, access requests), and baseline DORA and time-to-first-deploy. Weeks 4-8: ship the thinnest slice of one golden path for the most common service type with a pilot team — template repo, CI, GitOps deploy, default dashboards/alerts — using existing tools. Weeks 9-12: measure the pilot vs baseline, fix friction, add a catalog with ownership auto-ingested, and publish a roadmap. I would explicitly not start by choosing a portal or building a custom abstraction layer.", he: "שבועות 1-3: discovery – ראיונות עם 8-10 צוותים, ליווי של יצירת שירות חדש מקצה לקצה, ניתוח תור ה-tickets כדי למצוא את ה-toil המוביל (בדרך כלל: הקמת שירות חדש, סביבות, הקצאת DB, בקשות גישה), ומדידת baseline של DORA ו-time-to-first-deploy. שבועות 4-8: מוציאים את הפרוסה הכי דקה של golden path אחד לסוג השירות הנפוץ ביותר עם צוות pilot – template repo, CI, deploy ב-GitOps, dashboards/alerts ברירת מחדל – עם כלים קיימים. שבועות 9-12: מודדים את ה-pilot מול ה-baseline, מתקנים חיכוכים, מוסיפים catalog עם ownership שנאסף אוטומטית, ומפרסמים roadmap. במפורש לא הייתי מתחיל מבחירת פורטל או מבניית שכבת אבסטרקציה מותאמת." }
    },
    {
      q: { en: "A SaaS company wants per-customer isolation on Kubernetes for 400 enterprise customers. Namespace, vcluster or cluster per customer?", he: "חברת SaaS רוצה בידוד לכל לקוח ב-Kubernetes ל-400 לקוחות enterprise. namespace, vcluster או cluster לכל לקוח?" },
      a: { en: "It depends on the threat model and contracts. 400 clusters means 400 control planes (~$29k/month on EKS just for control planes) plus 400 upgrade cycles — only viable with strong fleet automation (Cluster API, Argo CD ApplicationSets) and only if contracts demand hard isolation. A tiered model is common: namespace-per-customer on shared clusters with dedicated node pools, NetworkPolicy, per-tenant quotas and workload identity for the standard tier; vcluster when customers need their own CRDs/API semantics; dedicated clusters (or accounts) for regulated customers that pay for it. Also design cell-based sharding: many mid-size clusters each hosting N tenants, so blast radius is bounded and you can move a noisy tenant.", he: "תלוי ב-threat model ובחוזים. 400 clusters זה 400 control planes (בערך $29k לחודש ב-EKS רק על control planes) ועוד 400 מחזורי שדרוג – אפשרי רק עם אוטומציית fleet חזקה (Cluster API, ApplicationSets של Argo CD) ורק אם החוזים דורשים בידוד קשיח. מודל שכבות נפוץ: namespace לכל לקוח על clusters משותפים עם node pools ייעודיים, NetworkPolicy, quotas לכל tenant ו-workload identity לשכבה הסטנדרטית; vcluster כשלקוחות צריכים CRDs/סמנטיקת API משלהם; clusters (או accounts) ייעודיים ללקוחות רגולטוריים שמשלמים על זה. ובנוסף מתכננים sharding מבוסס cells: הרבה clusters בינוניים שכל אחד מארח N tenants, כך שה-blast radius חסום ואפשר להזיז tenant רועש." }
    },
    {
      q: { en: "How do you prove the platform team is worth its headcount?", he: "איך מוכיחים שצוות הפלטפורמה שווה את ה-headcount שלו?" },
      a: { en: "Translate platform metrics into business terms. Engineering hours saved: (old setup time - new setup time) x services created per year, plus ticket volume reduction x average handling time. Reliability: change failure rate and recovery time for golden-path vs off-path services. Cost: infra savings from standardised right-sizing and spot/consolidation defaults. Risk: % of services meeting security baselines (signed images, workload identity, no static keys). Pair numbers with developer survey trends. If a capability has low adoption after two quarters, deprecate it — showing you kill things is part of credibility.", he: "מתרגמים מדדי פלטפורמה למונחים עסקיים. שעות הנדסה שנחסכו: (זמן הקמה ישן פחות חדש) כפול שירותים שנוצרים בשנה, ועוד ירידה בנפח tickets כפול זמן טיפול ממוצע. אמינות: change failure rate ו-recovery time לשירותים על ה-golden path מול שירותים מחוצה לו. עלות: חיסכון בתשתית מ-right-sizing סטנדרטי וברירות מחדל של spot/consolidation. סיכון: % שירותים שעומדים ב-baseline אבטחה (images חתומים, workload identity, בלי מפתחות סטטיים). מצמידים למספרים את מגמות סקר המפתחים. ואם יכולת מסוימת עם adoption נמוך אחרי שני רבעונים – עושים לה deprecation; להראות שאתם גם הורגים דברים זה חלק מהאמינות." }
    }
  ],
  quiz: [
    {
      q: { en: "What is the defining property of a good golden path?", he: "מה התכונה המגדירה של golden path טוב?" },
      options: [
        { en: "It is mandatory and enforced by admission policy", he: "הוא חובה ונאכף ע״י admission policy" },
        { en: "It is optional but so much easier that most teams choose it", he: "הוא אופציונלי, אבל כל כך יותר קל שרוב הצוותים בוחרים בו" },
        { en: "It hides Kubernetes completely", he: "הוא מסתיר את Kubernetes לגמרי" },
        { en: "It is implemented in Backstage", he: "הוא ממומש ב-Backstage" }
      ], answer: 1,
      explain: { en: "Golden paths win by convenience, not mandate. Guardrails (security, cost) are enforced everywhere; the path itself is the easy choice.", he: "Golden paths מנצחים בנוחות, לא בכפייה. ה-guardrails (אבטחה, עלות) נאכפים בכל מקום; המסלול עצמו הוא הבחירה הקלה." }
    },
    {
      q: { en: "A team needs to install its own operator with cluster-scoped CRDs, but you don't want to give them a whole cluster. Best fit?", he: "צוות צריך להתקין operator משלו עם CRDs ב-scope של cluster, אבל לא רוצים לתת לו cluster שלם. מה הכי מתאים?" },
      options: [
        { en: "A namespace with admin RoleBinding", he: "Namespace עם RoleBinding של admin" },
        { en: "A vcluster", he: "vcluster" },
        { en: "A dedicated node pool", he: "Node pool ייעודי" },
        { en: "A ResourceQuota exception", he: "חריגה ב-ResourceQuota" }
      ], answer: 1,
      explain: { en: "CRDs are cluster-scoped, so namespace-level admin can't install them. A vcluster gives the tenant its own API server where it can, while sharing host nodes.", he: "CRDs הם cluster-scoped, אז admin ברמת namespace לא יכול להתקין אותם. vcluster נותן ל-tenant API server משלו שבו הוא יכול, תוך שיתוף ה-nodes של ה-host." }
    },
    {
      q: { en: "Which is NOT one of the four classic DORA metrics?", he: "מה מהבאים אינו אחד מארבעת מדדי DORA הקלאסיים?" },
      options: [
        { en: "Deployment frequency", he: "Deployment frequency" },
        { en: "Lead time for changes", he: "Lead time for changes" },
        { en: "Code coverage", he: "Code coverage" },
        { en: "Change failure rate", he: "Change failure rate" }
      ], answer: 2,
      explain: { en: "The four are deployment frequency, lead time for changes, change failure rate and failed-deployment recovery time. Code coverage is not a delivery outcome.", he: "הארבעה הם deployment frequency, lead time for changes, change failure rate ו-failed-deployment recovery time. Code coverage אינו תוצאת delivery." }
    },
    {
      q: { en: "Ticket volume to the platform team grew 40% after launching the IDP. What is the most likely reading?", he: "נפח ה-tickets לצוות הפלטפורמה גדל ב-40% אחרי השקת ה-IDP. מה הפרשנות הסבירה ביותר?" },
      options: [
        { en: "Success — more people use the platform", he: "הצלחה – יותר אנשים משתמשים בפלטפורמה" },
        { en: "Self-service is leaking: the paths are incomplete or confusing, and humans fill the gaps", he: "ה-self-service דולף: המסלולים לא שלמים או מבלבלים, ובני אדם ממלאים את הפערים" },
        { en: "DORA metrics are wrong", he: "מדדי DORA שגויים" },
        { en: "Need more Backstage plugins", he: "צריך עוד plugins ל-Backstage" }
      ], answer: 1,
      explain: { en: "A working self-service platform reduces tickets. Rising tickets means humans are still in the loop; categorise them and turn the top categories into self-service.", he: "פלטפורמת self-service שעובדת מורידה tickets. עלייה אומרת שבני אדם עדיין בלולאה; מסווגים אותם והופכים את הקטגוריות המובילות ל-self-service." }
    }
  ],
  related: ["k8s-namespaces-rbac", "k8s-argocd", "k8s-helm-gitops", "cloud-cicd", "k8s-cost", "staff-terraform-at-scale"]
});
}

// ---------------------------------------------------------------------------
// 12. Zero trust, workload identity & secrets
// ---------------------------------------------------------------------------
{
const ZT_WI = `<pre># --- AWS: EKS Pod Identity (no OIDC provider per cluster, no SA annotation) ---
aws eks create-pod-identity-association --cluster-name prod \\
  --namespace payments --service-account payments-api \\
  --role-arn arn:aws:iam::111122223333:role/payments-api
# role trust policy principal: { "Service": "pods.eks.amazonaws.com" },
# actions sts:AssumeRole + sts:TagSession; session tags (cluster, namespace, SA)
# enable ABAC: one role, access scoped by aws:PrincipalTag/kubernetes-namespace

# --- AWS: IRSA (older, still everywhere; also works off-EKS with self-managed OIDC) ---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payments-api
  namespace: payments
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/payments-api

# --- Azure: Workload Identity (federated credential on a managed identity) ---
az identity federated-credential create --name payments-api \\
  --identity-name id-payments --resource-group rg-prod \\
  --issuer "$(az aks show -g rg-prod -n prod --query oidcIssuerProfile.issuerUrl -o tsv)" \\
  --subject system:serviceaccount:payments:payments-api
# SA annotation azure.workload.identity/client-id: &lt;client-id&gt;
# pod label     azure.workload.identity/use: "true"

# --- GCP: Workload Identity Federation for GKE (grant the KSA directly, no GSA needed) ---
gcloud projects add-iam-policy-binding acme-prod --role roles/cloudsql.client \\
  --member "principal://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/acme-prod.svc.id.goog/subject/ns/payments/sa/payments-api"</pre>`;

const ZT_GHA = `<pre># .github/workflows/deploy.yml: no AWS keys stored anywhere
permissions:
  id-token: write          # allow the job to request a GitHub OIDC token
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: prod      # binds the token's sub claim to this environment
    steps:
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::111122223333:role/gha-deploy-prod
        aws-region: eu-west-1
    - run: aws sts get-caller-identity     # temporary creds, ~1h

# Trust policy on gha-deploy-prod: the sub condition is the whole security model
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:acme/payments-api:environment:prod"
    }
  }
}</pre>`;

const ZT_VAULT = `<pre># Vault database secrets engine: every pod gets its own short-lived Postgres user
vault secrets enable database
vault write database/config/orders \\
  plugin_name=postgresql-database-plugin \\
  connection_url="postgresql://{{username}}:{{password}}@orders-db:5432/orders" \\
  username=vault_admin password=... allowed_roles=orders-ro
vault write -force database/rotate-root/orders     # now only Vault knows the admin password

vault write database/roles/orders-ro db_name=orders default_ttl=1h max_ttl=24h \\
  creation_statements="CREATE ROLE \\"{{name}}\\" LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';
                       GRANT SELECT ON ALL TABLES IN SCHEMA public TO \\"{{name}}\\";"

$ vault read database/creds/orders-ro
Key                Value
lease_id           database/creds/orders-ro/7f3kQ2...
lease_duration     1h
lease_renewable    true
password           A1a-xQ9...
username           v-k8s-orders-ro-Xb12...

vault lease renew  database/creds/orders-ro/7f3kQ2...       # extend up to max_ttl
vault lease revoke -prefix database/creds/orders-ro/        # incident: kill every issued cred now

# Pods authenticate with their ServiceAccount token (no secret zero):
vault write auth/kubernetes/role/orders bound_service_account_names=orders \\
  bound_service_account_namespaces=shop token_policies=orders-ro token_ttl=20m</pre>`;

const ZT_ESO = `<pre>apiVersion: external-secrets.io/v1
kind: ClusterSecretStore
metadata: { name: aws-sm }
spec:
  provider:
    aws:
      service: SecretsManager
      region: eu-west-1
      auth: { jwt: { serviceAccountRef: { name: external-secrets, namespace: external-secrets } } }
---
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: stripe, namespace: payments }
spec:
  refreshInterval: 1h                 # picks up rotations; also forceable via annotation
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target: { name: stripe, creationPolicy: Owner }
  data:
  - secretKey: STRIPE_API_KEY
    remoteRef: { key: prod/payments/stripe, property: api_key }</pre>`;

const ZT_SPIFFE = `<pre>SPIFFE ID:   spiffe://acme.internal/ns/payments/sa/payments-api
X.509-SVID:  short-lived cert (default ~1h in SPIRE) with that ID in the URI SAN
JWT-SVID:    signed JWT with sub = SPIFFE ID, for L7 / cross-cloud calls

SPIRE server (CA, registration entries) &lt;-- node attestation (AWS IID, k8s PSAT, TPM)
SPIRE agent  (per node)                 &lt;-- workload attestation (k8s ns/sa/pod labels, unix uid)
workload  --Workload API (unix socket)--&gt; gets SVID + trust bundle, auto-rotated</pre>`;

INFRA.lessons.push({
  id: "staff-zero-trust-secrets",
  track: "staff",
  order: 12,
  icon: "🔐",
  level: 3,
  minutes: 19,
  title: { en: "Zero Trust, Workload Identity & Secrets at Scale", he: "Zero Trust, Workload Identity וסודות בקנה מידה" },
  tldr: {
    en: "Stop distributing long-lived secrets. Give every workload a cryptographic identity (cloud workload identity, SPIFFE), exchange it for short-lived credentials (OIDC federation, Vault dynamic secrets), sync the few remaining static secrets from one store (ESO), and make rotation a non-event you rehearse.",
    he: "מפסיקים להפיץ סודות ארוכי-חיים. נותנים לכל workload זהות קריפטוגרפית (cloud workload identity, SPIFFE), מחליפים אותה ב-credentials קצרי-חיים (OIDC federation, Vault dynamic secrets), מסנכרנים את מעט הסודות הסטטיים שנשארו מ-store אחד (ESO), והופכים rotation לאירוע שגרתי שמתרגלים."
  },
  analogy: {
    en: "Old security is a castle with one gate: once inside, you're trusted, and the master key is copied onto a hundred keychains. Zero trust is a hotel: your face is checked at the desk (identity), you get a key card that opens only your room and expires at checkout (short-lived, scoped credential), and losing it is a non-event — the desk just issues a new one and the old card dies.",
    he: "אבטחה ישנה היא טירה עם שער אחד: ברגע שאתה בפנים סומכים עליך, ומפתח המאסטר משוכפל למאה צרורות. Zero trust הוא מלון: בודקים את הפנים שלך בקבלה (identity), מקבלים כרטיס שפותח רק את החדר שלך ופג ב-checkout (credential קצר-חיים ומוגבל), ואיבוד שלו הוא לא אירוע – הקבלה מנפיקה חדש והכרטיס הישן מת."
  },
  sections: [
    {
      h: { en: "Zero trust in practice: identity is the new perimeter", he: "Zero trust בפועל: הזהות היא ה-perimeter החדש" },
      body: {
        en: `<p>Zero trust (NIST SP 800-207) means no implicit trust from network location: every request is authenticated, authorized and encrypted based on <strong>identity + context</strong>, with least privilege and continuous verification. For infra that translates into concrete controls:</p>
<ul>
<li><strong>Humans</strong>: SSO + phishing-resistant MFA (FIDO2/passkeys), identity-aware proxies instead of VPN (Google BeyondCorp/IAP, Cloudflare Access, Teleport, Tailscale), just-in-time elevated access with expiry and audit.</li>
<li><strong>Workloads</strong>: each service has its own identity (Kubernetes SA → cloud role, SPIFFE ID), mTLS between services, authz by identity, not by IP.</li>
<li><strong>Machines/CI</strong>: OIDC federation — CI proves who it is with a signed token, cloud trades it for 15-60 minute credentials. No access keys in CI secrets.</li>
<li><strong>Secrets</strong>: short TTLs, one source of truth, automatic rotation, every read audited.</li>
</ul>
<p>The metric that matters: <strong>number of long-lived credentials in existence</strong> (IAM user access keys, SA JSON keys, static DB passwords, PATs). Track it like a burn-down. Leaked static keys remain one of the most common root causes of cloud breaches; a credential that expires in an hour is a much smaller prize.</p>
<blockquote>⚠️ Production tip: enforce it with org policy, not good intentions — AWS SCP denying <code>iam:CreateAccessKey</code>, GCP org policy <code>iam.disableServiceAccountKeyCreation</code>, Azure policy against client secrets on app registrations. Exceptions go through a reviewed, expiring allow-list.</blockquote>`,
        he: `<p>Zero trust (NIST SP 800-207) אומר שאין אמון מובלע בגלל מיקום ברשת: כל בקשה עוברת authentication, authorization והצפנה לפי <strong>זהות + הקשר</strong>, עם least privilege ואימות מתמשך. בתשתיות זה מתורגם לבקרות קונקרטיות:</p>
<ul>
<li><strong>בני אדם</strong>: SSO + MFA עמיד ל-phishing (FIDO2/passkeys), identity-aware proxies במקום VPN (Google BeyondCorp/IAP, Cloudflare Access, Teleport, Tailscale), גישה מוגברת just-in-time עם תפוגה ו-audit.</li>
<li><strong>Workloads</strong>: לכל שירות זהות משלו (Kubernetes SA → role בענן, SPIFFE ID), mTLS בין שירותים, authz לפי זהות ולא לפי IP.</li>
<li><strong>מכונות/CI</strong>: OIDC federation – ה-CI מוכיח מי הוא עם token חתום, והענן מחליף אותו ב-credentials ל-15-60 דקות. בלי access keys ב-secrets של ה-CI.</li>
<li><strong>סודות</strong>: TTLs קצרים, מקור אמת אחד, rotation אוטומטי, וכל קריאה עוברת audit.</li>
</ul>
<p>המדד שחשוב: <strong>מספר ה-credentials ארוכי-החיים שקיימים</strong> (access keys של IAM users, מפתחות JSON של SA, סיסמאות DB סטטיות, PATs). עוקבים אחריו כמו burn-down. מפתחות סטטיים שדלפו הם עדיין אחד ה-root causes הנפוצים ביותר לפריצות ענן; credential שפג תוך שעה הוא שלל קטן בהרבה.</p>
<blockquote>⚠️ טיפ לפרודקשן: אוכפים את זה עם org policy, לא עם כוונות טובות – SCP ב-AWS שחוסם <code>iam:CreateAccessKey</code>, org policy ב-GCP <code>iam.disableServiceAccountKeyCreation</code>, Azure policy נגד client secrets על app registrations. חריגים עוברים דרך allow-list עם review ותאריך תפוגה.</blockquote>`
      }
    },
    {
      h: { en: "Workload identity on all three clouds", he: "Workload identity בשלושת העננים" },
      body: {
        en: `<p>Same idea everywhere: the Kubernetes API server signs a projected ServiceAccount token (a JWT with <code>sub=system:serviceaccount:ns:sa</code>, short-lived, audience-bound); the cloud trusts that issuer and exchanges the JWT for temporary credentials. The SDK's default credential chain picks it up from env vars and a mounted token file — no code change.</p>
${ZT_WI}
<table>
<tr><th></th><th>EKS Pod Identity</th><th>IRSA</th><th>Azure WI</th><th>GKE WIF</th></tr>
<tr><td>Trust setup</td><td>association via EKS API + agent DaemonSet</td><td>IAM OIDC provider per cluster</td><td>federated credential per (issuer, subject)</td><td>built-in pool PROJECT.svc.id.goog</td></tr>
<tr><td>Scale limit to watch</td><td>associations per cluster</td><td>trust policy size; OIDC providers per account</td><td>federated credentials per identity (20)</td><td>IAM policy bindings size</td></tr>
<tr><td>Reuse a role across clusters</td><td>easy, no trust policy edit</td><td>edit trust policy per cluster</td><td>one credential per cluster issuer</td><td>same pool per project</td></tr>
</table>
<blockquote>💡 Real world: in a 50-cluster fleet, IRSA's "add every new cluster's OIDC issuer to every role's trust policy" becomes the bottleneck — the trust policy hits its size limit. That operational pain is exactly what EKS Pod Identity removes. Migrate role by role; both can coexist in the same cluster.</blockquote>`,
        he: `<p>אותו רעיון בכל מקום: ה-API server של Kubernetes חותם על projected ServiceAccount token (JWT עם <code>sub=system:serviceaccount:ns:sa</code>, קצר-חיים, מוגבל ל-audience); הענן סומך על ה-issuer הזה ומחליף את ה-JWT ב-credentials זמניים. ה-default credential chain של ה-SDK מרים את זה ממשתני סביבה ומקובץ token שמוצמד ל-pod – בלי שינוי קוד.</p>
${ZT_WI}
<table>
<tr><th></th><th>EKS Pod Identity</th><th>IRSA</th><th>Azure WI</th><th>GKE WIF</th></tr>
<tr><td>הקמת אמון</td><td>association דרך EKS API + agent DaemonSet</td><td>IAM OIDC provider לכל cluster</td><td>federated credential לכל (issuer, subject)</td><td>pool מובנה PROJECT.svc.id.goog</td></tr>
<tr><td>מגבלת scale לשים לב אליה</td><td>associations לכל cluster</td><td>גודל trust policy; OIDC providers לכל account</td><td>federated credentials לכל identity (20)</td><td>גודל IAM policy bindings</td></tr>
<tr><td>שימוש חוזר ב-role בין clusters</td><td>קל, בלי לערוך trust policy</td><td>עריכת trust policy לכל cluster</td><td>credential אחד לכל issuer של cluster</td><td>אותו pool לכל project</td></tr>
</table>
<blockquote>💡 מהשטח: ב-fleet של 50 clusters, ה-"להוסיף את ה-OIDC issuer של כל cluster חדש ל-trust policy של כל role" של IRSA הופך לצוואר בקבוק – ה-trust policy מגיע למגבלת הגודל. בדיוק את הכאב התפעולי הזה EKS Pod Identity מעלים. מעבירים role אחרי role; שניהם יכולים לחיות יחד באותו cluster.</blockquote>`
      }
    },
    {
      h: { en: "OIDC federation from CI: kill the deploy keys", he: "OIDC federation מה-CI: להרוג את מפתחות ה-deploy" },
      body: {
        en: `<p>GitHub Actions, GitLab CI, Buildkite, CircleCI and Azure DevOps all mint OIDC tokens per job. The cloud validates signature, issuer and claims, then issues credentials for that one job.</p>
${ZT_GHA}
<p>The <code>sub</code> condition <em>is</em> the security boundary. Common mistakes: <code>StringLike "repo:acme/*"</code> (any repo in the org — including a fork-happy intern's test repo — can deploy prod), or matching on a branch when PR workflows from forks can run. Bind production roles to a GitHub <strong>environment</strong> with required reviewers and branch protection, so the token for <code>environment:prod</code> can only be minted after approval. GCP (Workload Identity Federation pools with an attribute condition like <code>assertion.repository_owner=='acme'</code>) and Azure (federated credentials on an app registration or managed identity) follow the same pattern.</p>`,
        he: `<p>GitHub Actions, GitLab CI, Buildkite, CircleCI ו-Azure DevOps כולם מנפיקים OIDC tokens לכל job. הענן מאמת חתימה, issuer ו-claims, ואז מנפיק credentials לאותו job בלבד.</p>
${ZT_GHA}
<p>תנאי ה-<code>sub</code> <em>הוא</em> גבול האבטחה. טעויות נפוצות: <code>StringLike "repo:acme/*"</code> (כל repo בארגון – כולל repo בדיקות של מתמחה – יכול לעשות deploy לפרודקשן), או התאמה לפי branch כשאפשר להריץ workflows של PRs מ-forks. קושרים roles של פרודקשן ל-<strong>environment</strong> של GitHub עם required reviewers ו-branch protection, כך שה-token של <code>environment:prod</code> יכול להיות מונפק רק אחרי אישור. GCP (Workload Identity Federation pools עם attribute condition כמו <code>assertion.repository_owner=='acme'</code>) ו-Azure (federated credentials על app registration או managed identity) עובדים באותה תבנית.</p>`
      }
    },
    {
      h: { en: "Vault, External Secrets Operator and SPIFFE/SPIRE", he: "Vault, External Secrets Operator ו-SPIFFE/SPIRE" },
      body: {
        en: `<p><strong>HashiCorp Vault</strong> (BSL-licensed since 2023, now part of IBM; <strong>OpenBao</strong> is the open-source fork under the Linux Foundation) shines at <em>dynamic secrets</em>: credentials created on demand, unique per consumer, with a <strong>lease</strong> that expires or is revoked.</p>
${ZT_VAULT}
<p>Unique credentials per pod mean the DB audit log tells you exactly which pod ran a query, and an incident response is one <code>revoke -prefix</code>. The price: Vault is now tier-0 — run it HA (integrated Raft storage, 3 or 5 nodes), auto-unseal with cloud KMS, and plan for "Vault down": cached leases keep running apps alive, new pods can't start.</p>
<p><strong>External Secrets Operator</strong> is the pragmatic bridge for static secrets (third-party API keys): the source of truth stays in AWS Secrets Manager / Azure Key Vault / GCP Secret Manager / Vault, and ESO syncs it into a Kubernetes Secret on a schedule, authenticating with workload identity.</p>
${ZT_ESO}
<p><strong>SPIFFE/SPIRE</strong> gives workloads a platform-neutral identity across Kubernetes, VMs and clouds — useful when a mesh's built-in CA isn't enough (multi-cluster, VMs, cross-org federation). Istio and Linkerd already issue SPIFFE-format IDs; SPIRE is the standalone implementation.</p>
${ZT_SPIFFE}
<p><strong>Rotation</strong>: design every consumer for two valid credentials at once (dual secrets / overlap window), reload without restart (watch file, or Reloader/stakater to roll pods on Secret change), and rehearse — a rotation you've never done is a future outage.</p>`,
        he: `<p><strong>HashiCorp Vault</strong> (ברישיון BSL מאז 2023, היום חלק מ-IBM; <strong>OpenBao</strong> הוא ה-fork הפתוח תחת Linux Foundation) מצטיין ב-<em>dynamic secrets</em>: credentials שנוצרים לפי דרישה, ייחודיים לכל צרכן, עם <strong>lease</strong> שפג או מבוטל.</p>
${ZT_VAULT}
<p>Credentials ייחודיים לכל pod אומרים שה-audit log של ה-DB מספר בדיוק איזה pod הריץ שאילתה, ותגובה לאירוע היא <code>revoke -prefix</code> אחד. המחיר: Vault נהיה tier-0 – מריצים אותו HA (Raft storage מובנה, 3 או 5 nodes), auto-unseal עם KMS של הענן, ומתכננים ל-"Vault למטה": leases שכבר נשמרו מחזיקים אפליקציות רצות בחיים, pods חדשים לא יכולים לעלות.</p>
<p><strong>External Secrets Operator</strong> הוא הגשר הפרגמטי לסודות סטטיים (API keys של צד שלישי): מקור האמת נשאר ב-AWS Secrets Manager / Azure Key Vault / GCP Secret Manager / Vault, ו-ESO מסנכרן אותו ל-Secret של Kubernetes לפי לוח זמנים, עם authentication דרך workload identity.</p>
${ZT_ESO}
<p><strong>SPIFFE/SPIRE</strong> נותן ל-workloads זהות נייטרלית לפלטפורמה על פני Kubernetes, VMs ועננים – שימושי כשה-CA המובנה של ה-mesh לא מספיק (multi-cluster, VMs, federation בין ארגונים). Istio ו-Linkerd כבר מנפיקים IDs בפורמט SPIFFE; SPIRE הוא המימוש העצמאי.</p>
${ZT_SPIFFE}
<p><strong>Rotation</strong>: מתכננים כל צרכן לשני credentials תקפים במקביל (dual secrets / חלון חפיפה), reload בלי restart (watch על הקובץ, או Reloader של stakater שמגלגל pods כשה-Secret משתנה), ומתרגלים – rotation שמעולם לא עשיתם הוא outage עתידי.</p>`
      }
    }
  ],
  diagram: "pod (SA token, JWT, aud=sts) --> cloud STS: verify issuer/sub --> temp creds (1h)\nGitHub job (OIDC token, sub=repo:acme/api:environment:prod) --> AssumeRoleWithWebIdentity --> deploy\npod --k8s auth--> Vault --> dynamic DB user (lease 1h) --> Postgres (revoke on incident)",
  handsOn: [
    { cmd: "kubectl exec deploy/payments-api -- sh -c 'cat /var/run/secrets/eks.amazonaws.com/serviceaccount/token | cut -d. -f2 | base64 -d 2>/dev/null; echo'", what: { en: "Decode the projected token's payload (IRSA path) — check iss, sub, aud and exp.", he: "מפענחים את ה-payload של ה-projected token (נתיב IRSA) – בודקים iss, sub, aud ו-exp." } },
    { cmd: "aws iam list-users --query 'Users[].UserName' --output text | xargs -n1 aws iam list-access-keys --user-name", what: { en: "Inventory long-lived IAM access keys — the burn-down list for zero trust.", he: "מלאי של IAM access keys ארוכי-חיים – רשימת ה-burn-down ל-zero trust." } },
    { cmd: "vault read database/creds/orders-ro && vault list sys/leases/lookup/database/creds/orders-ro", what: { en: "Issue a dynamic DB credential and list active leases for the role.", he: "מנפיקים credential דינמי ל-DB ומציגים את ה-leases הפעילים של ה-role." } },
    { cmd: "kubectl get externalsecret -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,READY:.status.conditions[0].status,REFRESHED:.status.refreshTime", what: { en: "Find ExternalSecrets that failed to sync before an app restarts with a stale secret.", he: "מוצאים ExternalSecrets שנכשלו בסנכרון לפני שאפליקציה עולה מחדש עם סוד ישן." } }
  ],
  mnemonic: { en: "WISE: Who are you (identity), Issue short-lived, Single source of truth, Exercise rotation.", he: "WISE: Who are you (זהות), Issue קצר-חיים, Single source of truth, Exercise rotation (לתרגל)." },
  pitfalls: [
    { en: "OIDC trust with a wildcard sub (repo:acme/*) — any repo or fork workflow in the org can assume the production role.", he: "אמון OIDC עם sub עם wildcard (repo:acme/*) – כל repo או workflow מ-fork בארגון יכולים לקחת את ה-role של פרודקשן." },
    { en: "Putting secrets in Git 'encrypted' with base64 Kubernetes Secrets — base64 is encoding, not encryption. Use ESO/Sealed Secrets/SOPS and enable etcd encryption with KMS.", he: "לשים סודות ב-Git 'מוצפנים' כ-Secrets של Kubernetes ב-base64 – base64 זה קידוד, לא הצפנה. משתמשים ב-ESO/Sealed Secrets/SOPS ומפעילים הצפנת etcd עם KMS." },
    { en: "Vault as a single point of failure with 24h leases and no caching plan: when Vault is down at lease expiry, everything fails at once.", he: "Vault כ-single point of failure עם leases של 24 שעות ובלי תוכנית caching: כש-Vault למטה בזמן תפוגת ה-lease, הכל נופל בבת אחת." },
    { en: "Rotating a secret that apps read only at startup: the new value sits in the Secret, pods keep the old one until the old one is revoked — then they all fail.", he: "לעשות rotation לסוד שאפליקציות קוראות רק בעלייה: הערך החדש יושב ב-Secret, ה-pods ממשיכים עם הישן עד שהישן מבוטל – ואז כולם נופלים." }
  ],
  interview: [
    {
      q: { en: "A static AWS access key with admin rights leaked to a public repo 20 minutes ago. Walk through your response and the long-term fix.", he: "Access key סטטי של AWS עם הרשאות admin דלף ל-repo ציבורי לפני 20 דקות. תעברו על התגובה ועל התיקון לטווח ארוך." },
      a: { en: "Contain first: deactivate the key (not delete — keep it for forensics), attach an explicit deny-all policy to the user, and revoke active sessions (deny on aws:TokenIssueTime older than now for roles it may have assumed). Investigate with CloudTrail by access key ID across all regions: new IAM users/keys/roles, EC2 in odd regions (crypto mining), S3 GetObject bursts, changes to CloudTrail itself. Eradicate any persistence found. Long term: remove IAM users with keys entirely — CI via OIDC federation, humans via SSO with short sessions, workloads via Pod Identity; SCP denying access-key creation; secret scanning with push protection; and a metric of remaining static credentials reported monthly.", he: "קודם מכילים: מבטלים את המפתח (deactivate, לא delete – שומרים לפורנזיקה), מצמידים ל-user policy של deny-all מפורש, ומבטלים sessions פעילים (deny על aws:TokenIssueTime ישן מעכשיו ל-roles שאולי הוא לקח). חוקרים ב-CloudTrail לפי access key ID בכל ה-regions: IAM users/keys/roles חדשים, EC2 ב-regions מוזרים (כריית קריפטו), פרצי S3 GetObject, שינויים ב-CloudTrail עצמו. מנקים כל persistence שנמצא. לטווח ארוך: מעלימים IAM users עם מפתחות לגמרי – CI דרך OIDC federation, בני אדם דרך SSO עם sessions קצרים, workloads דרך Pod Identity; SCP שחוסם יצירת access keys; secret scanning עם push protection; ומדד של credentials סטטיים שנשארו שמדווח כל חודש." }
    },
    {
      q: { en: "Vault dynamic secrets vs External Secrets Operator syncing from a cloud secret manager — how do you choose?", he: "Vault dynamic secrets מול External Secrets Operator שמסנכרן מ-secret manager של הענן – איך בוחרים?" },
      a: { en: "They solve different problems. If the target system supports it (databases, cloud IAM, PKI), dynamic secrets beat any static secret: unique per consumer, short TTL, instant revocation. But Vault is a tier-0 system you must run, scale and secure, and apps need lease renewal logic or an agent. ESO + a managed secret manager is cheap to operate and fits third-party API keys that can't be dynamic, with rotation done by the provider (e.g. Secrets Manager rotation Lambdas). Many orgs run both: managed store + ESO by default, Vault (or OpenBao) for DB credentials and internal PKI where the risk justifies it. And for cloud resources, prefer workload identity — no secret at all beats any secret.", he: "הם פותרים בעיות שונות. אם מערכת היעד תומכת (databases, cloud IAM, PKI), dynamic secrets עדיפים על כל סוד סטטי: ייחודי לכל צרכן, TTL קצר, ביטול מיידי. אבל Vault הוא מערכת tier-0 שצריך להריץ, להגדיל ולאבטח, ואפליקציות צריכות לוגיקה של חידוש lease או agent. ESO + secret manager מנוהל זול לתפעול ומתאים ל-API keys של צד שלישי שלא יכולים להיות דינמיים, עם rotation שהספק עושה (למשל Lambdas של rotation ב-Secrets Manager). הרבה ארגונים מריצים את שניהם: store מנוהל + ESO כברירת מחדל, Vault (או OpenBao) ל-credentials של DB ול-PKI פנימי איפה שהסיכון מצדיק. ולמשאבי ענן מעדיפים workload identity – אין סוד בכלל עדיף על כל סוד." }
    },
    {
      q: { en: "Design secret rotation for a DB password used by 30 services without downtime.", he: "תתכננו rotation לסיסמת DB שמשמשת 30 שירותים בלי downtime." },
      a: { en: "First question why 30 services share one password — split into per-service roles, ideally dynamic. For the rotation itself use the two-credential pattern: create user_b (or a second password slot), publish it to the secret store, let ESO/agents sync and apps hot-reload or roll (track which pods use which credential via pg_stat_activity.usename), wait until all connections use the new one, then revoke the old one. Automate it, make it periodic (e.g. every 30 days), and alert when any consumer still uses the old credential before revocation. Connection pools must recycle connections (max lifetime) or old sessions survive revocation.", he: "קודם שואלים למה 30 שירותים חולקים סיסמה אחת – מפצלים ל-roles לכל שירות, באידיאל דינמיים. ל-rotation עצמו משתמשים בתבנית שני ה-credentials: יוצרים user_b (או slot שני לסיסמה), מפרסמים ל-secret store, נותנים ל-ESO/agents לסנכרן ולאפליקציות לעשות hot-reload או roll (עוקבים איזה pod משתמש באיזה credential דרך pg_stat_activity.usename), מחכים שכל ה-connections על החדש, ורק אז מבטלים את הישן. עושים את זה אוטומטי ומחזורי (למשל כל 30 יום), ומתריעים כשצרכן כלשהו עדיין משתמש בישן לפני הביטול. Connection pools חייבים למחזר connections (max lifetime), אחרת sessions ישנים שורדים את הביטול." }
    }
  ],
  quiz: [
    {
      q: { en: "In a GitHub Actions → AWS OIDC trust policy, which condition prevents other repositories from assuming the role?", he: "ב-trust policy של OIDC מ-GitHub Actions ל-AWS, איזה תנאי מונע מ-repos אחרים לקחת את ה-role?" },
      options: [
        { en: "aud = sts.amazonaws.com", he: "aud = sts.amazonaws.com" },
        { en: "sub = repo:acme/payments-api:environment:prod", he: "sub = repo:acme/payments-api:environment:prod" },
        { en: "The OIDC provider thumbprint", he: "ה-thumbprint של ה-OIDC provider" },
        { en: "permissions: id-token: write", he: "permissions: id-token: write" }
      ], answer: 1,
      explain: { en: "aud is the same for every GitHub workflow targeting AWS. The sub claim identifies repo + ref/environment and is the actual authorization boundary.", he: "aud זהה לכל workflow של GitHub שפונה ל-AWS. ה-claim של sub מזהה repo + ref/environment והוא גבול ה-authorization האמיתי." }
    },
    {
      q: { en: "What makes a Vault dynamic database secret safer than a static password in a secret manager?", he: "מה הופך dynamic database secret של Vault לבטוח יותר מסיסמה סטטית ב-secret manager?" },
      options: [
        { en: "It is encrypted with AES-256", he: "הוא מוצפן ב-AES-256" },
        { en: "It is unique per consumer, expires with its lease and can be revoked instantly", he: "הוא ייחודי לכל צרכן, פג עם ה-lease שלו ואפשר לבטל אותו מיד" },
        { en: "It never needs network access", he: "הוא אף פעם לא צריך גישת רשת" },
        { en: "Kubernetes can't read it", he: "Kubernetes לא יכול לקרוא אותו" }
      ], answer: 1,
      explain: { en: "Uniqueness gives attribution, TTL limits the value of a leak, and lease revocation gives a one-command incident response.", he: "ייחודיות נותנת שיוך, TTL מגביל את ערך הדליפה, וביטול lease נותן תגובה לאירוע בפקודה אחת." }
    },
    {
      q: { en: "Your fleet is 60 EKS clusters and IRSA trust policies keep hitting size limits. What is the natural fix?", he: "ה-fleet שלכם הוא 60 clusters של EKS ו-trust policies של IRSA כל הזמן נתקעים במגבלות גודל. מה התיקון הטבעי?" },
      options: [
        { en: "Create one IAM user per cluster", he: "ליצור IAM user לכל cluster" },
        { en: "Move to EKS Pod Identity associations, which don't need per-cluster OIDC entries in trust policies", he: "לעבור ל-associations של EKS Pod Identity, שלא צריכים רשומת OIDC לכל cluster ב-trust policies" },
        { en: "Use node instance roles for all pods", he: "להשתמש ב-instance roles של ה-nodes לכל ה-pods" },
        { en: "Store access keys in ExternalSecrets", he: "לשמור access keys ב-ExternalSecrets" }
      ], answer: 1,
      explain: { en: "Pod Identity trusts the pods.eks.amazonaws.com service principal; associations live in the EKS API, so roles are reusable across clusters without trust policy edits. Node roles would give every pod the union of permissions.", he: "Pod Identity סומך על ה-service principal של pods.eks.amazonaws.com; ה-associations חיים ב-EKS API, אז roles ניתנים לשימוש חוזר בין clusters בלי לערוך trust policy. Node roles היו נותנים לכל pod את איחוד ההרשאות." }
    },
    {
      q: { en: "What is a SPIFFE ID?", he: "מה זה SPIFFE ID?" },
      options: [
        { en: "A Kubernetes ServiceAccount token", he: "Token של ServiceAccount ב-Kubernetes" },
        { en: "A URI like spiffe://trust-domain/path identifying a workload, carried in an X.509 or JWT SVID", he: "URI כמו spiffe://trust-domain/path שמזהה workload, ונישא ב-SVID מסוג X.509 או JWT" },
        { en: "A Vault lease identifier", he: "מזהה של lease ב-Vault" },
        { en: "An AWS IAM role ARN", he: "ARN של IAM role ב-AWS" }
      ], answer: 1,
      explain: { en: "SPIFFE standardises workload identity as a URI inside short-lived SVIDs; SPIRE, Istio and Linkerd issue them.", he: "SPIFFE מתקנן workload identity כ-URI בתוך SVIDs קצרי-חיים; SPIRE, Istio ו-Linkerd מנפיקים אותם." }
    }
  ],
  related: ["cloud-iam-security", "k8s-security-policy", "k8s-config", "cloud-cicd", "staff-supply-chain", "staff-service-mesh"]
});
}

// ---------------------------------------------------------------------------
// 13. Software supply chain security
// ---------------------------------------------------------------------------
{
const SC_FLOW = `<pre>source ──► build ──► artifact ──► registry ──► deploy (admission) ──► runtime
  │          │          │             │              │
  │          │          ├─ SBOM (syft)│              ├─ verify signature identity
  │          │          ├─ scan (trivy/grype)        ├─ verify provenance (SLSA)
  │          ├─ provenance: who/what/how built       ├─ verify SBOM/vuln attestation
  │          └─ ephemeral, isolated runner           └─ reject tags, require digests
  └─ signed commits, branch protection, 2-person review, pinned deps</pre>`;

const SC_SBOM = `<pre># SBOM: what is inside the image (packages, versions, licenses, PURLs)
syft ghcr.io/acme/api@sha256:9b2f... -o spdx-json=sbom.spdx.json -o cyclonedx-json=sbom.cdx.json

# Scan the image (or the SBOM) and fail CI on fixable HIGH/CRITICAL
trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 ghcr.io/acme/api@sha256:9b2f...
grype sbom:./sbom.spdx.json --fail-on high --only-fixed

ghcr.io/acme/api (debian 12.7)
Total: 3 (HIGH: 2, CRITICAL: 1)
| Library   | Vulnerability  | Severity | Installed | Fixed     |
| libssl3   | CVE-2024-XXXXX | CRITICAL | 3.0.14-1  | 3.0.15-1  |
...

# Triage tooling: VEX statements mark CVEs "not_affected" (e.g. vulnerable code not reachable)
trivy image --vex ./vex.openvex.json ghcr.io/acme/api@sha256:9b2f...</pre>`;

const SC_SIGN = `<pre># .github/workflows/release.yml: keyless signing, SBOM + provenance attestations
permissions: { id-token: write, contents: read, packages: write, attestations: write }
steps:
- id: build
  uses: docker/build-push-action@v6
  with: { push: true, tags: "ghcr.io/acme/api:\${{ github.ref_name }}" }
- uses: sigstore/cosign-installer@v3
- run: |
    IMG=ghcr.io/acme/api@\${{ steps.build.outputs.digest }}
    cosign sign --yes "$IMG"                         # Fulcio cert from the job's OIDC identity, logged in Rekor
    syft "$IMG" -o spdx-json=sbom.json
    cosign attest --yes --type spdxjson --predicate sbom.json "$IMG"
- uses: actions/attest-build-provenance@v2          # SLSA provenance via GitHub artifact attestations
  with: { subject-name: ghcr.io/acme/api, subject-digest: "\${{ steps.build.outputs.digest }}", push-to-registry: true }

# Verify: pin WHO signed (workflow identity) and WHICH issuer, not just "is signed"
cosign verify ghcr.io/acme/api@sha256:9b2f... \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\
  --certificate-identity-regexp '^https://github.com/acme/api/\\.github/workflows/release\\.yml@refs/tags/v[0-9.]+$'

gh attestation verify oci://ghcr.io/acme/api@sha256:9b2f... --owner acme</pre>`;

const SC_KYVERNO = `<pre>apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: verify-acme-images }
spec:
  webhookTimeoutSeconds: 15
  rules:
  - name: signed-by-release-workflow
    match: { any: [{ resources: { kinds: [Pod] } }] }
    verifyImages:
    - imageReferences: ["ghcr.io/acme/*"]
      failureAction: Enforce            # start with Audit
      mutateDigest: true                # rewrite tag -&gt; digest in the admitted pod
      verifyDigest: true
      attestors:
      - entries:
        - keyless:
            issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "^https://github.com/acme/.+/\\\\.github/workflows/release\\\\.yml@refs/tags/v.*$"
            rekor: { url: https://rekor.sigstore.dev }
      attestations:
      - type: https://slsa.dev/provenance/v1
        attestors: [{ entries: [{ keyless: { issuer: https://token.actions.githubusercontent.com,
                                              subjectRegExp: "^https://github.com/acme/.+$" } }] }]
        conditions:
        - all:
          - key: "{{ buildDefinition.externalParameters.workflow.repository }}"
            operator: Equals
            value: "https://github.com/acme/api"</pre>`;

const SC_PIN = `<pre># Dockerfile: base image pinned by digest (tag kept as a comment for humans/Renovate)
FROM golang:1.25@sha256:2c8b...a91f AS build
FROM gcr.io/distroless/static-debian12@sha256:7e5c...0d3a

# GitHub Actions: pin third-party actions to a full commit SHA (tags are mutable)
- uses: tj-actions/changed-files@a1b2c3d4e5f60718293a4b5c6d7e8f9012345678  # v46.0.1

# Lockfiles + hash checking
pip install --require-hashes -r requirements.txt
npm ci            # fails if package-lock.json and package.json disagree
go mod verify     # checks module hashes against go.sum</pre>`;

INFRA.lessons.push({
  id: "staff-supply-chain",
  track: "staff",
  order: 13,
  icon: "⛓️",
  level: 3,
  minutes: 18,
  title: { en: "Software Supply Chain: SBOM, Signing, SLSA & Admission", he: "Software Supply Chain: SBOM, חתימות, SLSA ו-Admission" },
  tldr: {
    en: "Know what's in it (SBOM), know it's not vulnerable (scan + VEX), know who built it and how (signed SLSA provenance), and refuse to run anything that can't prove all three (admission verifyImages on digests). Pin every dependency by digest or hash — tags are mutable promises.",
    he: "יודעים מה יש בפנים (SBOM), יודעים שזה לא פגיע (סריקה + VEX), יודעים מי בנה ואיך (SLSA provenance חתום), ומסרבים להריץ כל דבר שלא מוכיח את שלושתם (admission verifyImages על digests). מצמידים כל תלות לפי digest או hash – tags הם הבטחות שאפשר לשנות."
  },
  analogy: {
    en: "Food safety. The ingredients label is the SBOM. The health inspection is the vulnerability scan. The sealed packaging with a tamper-evident sticker from a certified factory is the signature plus provenance. And the supermarket that refuses any delivery without the seal and certificate is your admission controller. A label alone doesn't stop someone from swapping the contents in the truck.",
    he: "בטיחות מזון. רשימת הרכיבים היא ה-SBOM. ביקורת משרד הבריאות היא סריקת הפגיעויות. האריזה האטומה עם מדבקת \"נפתח = נפגע\" ממפעל מוסמך היא החתימה וה-provenance. והסופר שמסרב לכל משלוח בלי חותם ותעודה הוא ה-admission controller. תווית לבד לא מונעת ממישהו להחליף את התכולה במשאית."
  },
  sections: [
    {
      h: { en: "The threat model: every arrow is an attack surface", he: "ה-threat model: כל חץ הוא משטח תקיפה" },
      body: {
        en: `<p>Supply chain attacks hit the steps between a developer's intent and what runs in prod: compromised dependencies (event-stream, the xz-utils backdoor in 2024, malicious npm/PyPI typosquats), compromised build systems (SolarWinds, Codecov's bash uploader), hijacked CI actions (tj-actions/changed-files in 2025 had its tags repointed to a commit that dumped CI secrets), and registry tampering (a tag repointed to a malicious image).</p>
${SC_FLOW}
<p>The controls map to the arrows: SBOM + scanning for <em>what's inside</em>, signing for <em>integrity + who</em>, provenance for <em>how and from which source</em>, admission for <em>enforcement</em>, pinning for <em>immutability</em>. Each alone is weak — a signed image built from a poisoned dependency is still poisoned.</p>`,
        he: `<p>מתקפות supply chain פוגעות בצעדים שבין הכוונה של המפתח למה שרץ בפרודקשן: תלויות שנפרצו (event-stream, ה-backdoor ב-xz-utils ב-2024, typosquats זדוניים ב-npm/PyPI), מערכות build שנפרצו (SolarWinds, ה-bash uploader של Codecov), CI actions שנחטפו (ב-tj-actions/changed-files ב-2025 ה-tags הוזזו ל-commit שהדפיס את סודות ה-CI), ושינוי ב-registry (tag שהוזז ל-image זדוני).</p>
${SC_FLOW}
<p>הבקרות ממופות לחצים: SBOM + סריקה בשביל <em>מה יש בפנים</em>, חתימה בשביל <em>שלמות + מי</em>, provenance בשביל <em>איך ומאיזה source</em>, admission בשביל <em>אכיפה</em>, ו-pinning בשביל <em>immutability</em>. כל אחד לבד חלש – image חתום שנבנה מתלות מורעלת עדיין מורעל.</p>`
      }
    },
    {
      h: { en: "SBOMs and vulnerability scanning without drowning", he: "SBOMs וסריקת פגיעויות בלי לטבוע" },
      body: {
        en: `<p>An <strong>SBOM</strong> (SPDX or CycloneDX) lists every component with a package URL (<code>pkg:deb/debian/libssl3@3.0.14-1</code>). Its real value shows on day zero of the next Log4Shell: "which running images contain log4j-core 2.14?" becomes a query over stored SBOMs instead of a week of grepping.</p>
${SC_SBOM}
<p>Scanning policy that teams can live with:</p>
<ul>
<li>Block in CI only on <strong>fixable</strong> HIGH/CRITICAL in <em>new</em> images; report the rest. Blocking on unfixable CVEs teaches people to disable the scanner.</li>
<li><strong>Rescan continuously</strong> what is running — a clean image today has CVEs next month. Trivy Operator or your registry's scanner (ECR enhanced scanning, Artifact Registry, ACR with Defender) do this.</li>
<li>Shrink the surface: distroless/chiseled/Wolfi-style minimal base images routinely cut CVE counts from hundreds to near zero; the cheapest vulnerability to triage is the package you don't ship.</li>
<li>Use <strong>VEX</strong> to record triage decisions ("not_affected: vulnerable_code_not_in_execute_path") so the same CVE isn't re-litigated in every repo.</li>
<li>SLA by severity: e.g. CRITICAL fixable within 7 days, HIGH within 30, tracked as a metric.</li>
</ul>`,
        he: `<p><strong>SBOM</strong> (בפורמט SPDX או CycloneDX) מפרט כל רכיב עם package URL (<code>pkg:deb/debian/libssl3@3.0.14-1</code>). הערך האמיתי שלו מתגלה ביום אפס של ה-Log4Shell הבא: "אילו images שרצים מכילים log4j-core 2.14?" הופך לשאילתה על SBOMs שמורים במקום שבוע של grep.</p>
${SC_SBOM}
<p>מדיניות סריקה שצוותים יכולים לחיות איתה:</p>
<ul>
<li>חוסמים ב-CI רק על HIGH/CRITICAL <strong>שיש להם תיקון</strong> ב-images <em>חדשים</em>; את השאר מדווחים. חסימה על CVEs בלי תיקון מלמדת אנשים לכבות את הסורק.</li>
<li><strong>סורקים מחדש באופן רציף</strong> את מה שרץ – image נקי היום יקבל CVEs בחודש הבא. Trivy Operator או הסורק של ה-registry (ECR enhanced scanning, Artifact Registry, ACR עם Defender) עושים את זה.</li>
<li>מקטינים את המשטח: base images מינימליים בסגנון distroless/chiseled/Wolfi מורידים באופן שגרתי את מספר ה-CVEs ממאות לכמעט אפס; הפגיעות הכי זולה לטפל בה היא החבילה שלא שולחים.</li>
<li>משתמשים ב-<strong>VEX</strong> כדי לתעד החלטות triage ("not_affected: vulnerable_code_not_in_execute_path"), כדי שאותו CVE לא יידון מחדש בכל repo.</li>
<li>SLA לפי חומרה: למשל CRITICAL עם תיקון תוך 7 ימים, HIGH תוך 30, ונמדד כמדד.</li>
</ul>`
      }
    },
    {
      h: { en: "Signing with Sigstore (keyless) and SLSA provenance", he: "חתימה עם Sigstore (keyless) ו-SLSA provenance" },
      body: {
        en: `<p><strong>Keyless signing</strong> removes the hardest part of signing — protecting a private key. cosign generates an ephemeral key pair, proves the CI job's OIDC identity to <strong>Fulcio</strong>, which issues a ~10-minute certificate binding the key to that identity (e.g. the workflow file and ref), signs the image digest, and records everything in the <strong>Rekor</strong> transparency log. The private key is thrown away; verification relies on the certificate identity + the log.</p>
${SC_SIGN}
<p><strong>SLSA</strong> (Supply-chain Levels for Software Artifacts) v1.x defines a Build track:</p>
<table>
<tr><th>Level</th><th>Requirement</th><th>Stops</th></tr>
<tr><td>Build L1</td><td>Provenance exists (how it was built)</td><td>Mistakes, unknown origin</td></tr>
<tr><td>Build L2</td><td>Hosted build platform generates and signs provenance</td><td>Tampering after the build</td></tr>
<tr><td>Build L3</td><td>Hardened platform: isolated, ephemeral builds; signing keys unreachable from user build steps</td><td>Tampering during the build, forged provenance</td></tr>
</table>
<p>GitHub artifact attestations on GitHub-hosted runners or the SLSA GitHub generator (reusable workflows) get you to L2-L3 quickly. Later SLSA versions add a Source track (branch protection, review requirements) — check the current spec for the exact level names.</p>
<blockquote>⚠️ Production tip: "verify that it's signed" is meaningless with keyless — anyone with a GitHub account can sign anything. Always verify the <em>identity</em> (exact workflow path, ref pattern) and the <em>issuer</em>.</blockquote>`,
        he: `<p><strong>Keyless signing</strong> מוריד את החלק הכי קשה בחתימה – הגנה על private key. cosign מייצר זוג מפתחות זמני, מוכיח ל-<strong>Fulcio</strong> את זהות ה-OIDC של ה-job ב-CI, ו-Fulcio מנפיק תעודה לכ-10 דקות שקושרת את המפתח לזהות הזאת (למשל קובץ ה-workflow וה-ref), חותם על ה-digest של ה-image, ורושם הכל ב-transparency log של <strong>Rekor</strong>. ה-private key נזרק; האימות נשען על זהות התעודה + ה-log.</p>
${SC_SIGN}
<p><strong>SLSA</strong> (Supply-chain Levels for Software Artifacts) בגרסה v1.x מגדיר Build track:</p>
<table>
<tr><th>רמה</th><th>דרישה</th><th>מה זה עוצר</th></tr>
<tr><td>Build L1</td><td>קיים provenance (איך זה נבנה)</td><td>טעויות, מקור לא ידוע</td></tr>
<tr><td>Build L2</td><td>פלטפורמת build מנוהלת מייצרת וחותמת על ה-provenance</td><td>שינוי אחרי ה-build</td></tr>
<tr><td>Build L3</td><td>פלטפורמה מוקשחת: builds מבודדים וזמניים; מפתחות החתימה לא נגישים מצעדי ה-build של המשתמש</td><td>שינוי בזמן ה-build, provenance מזויף</td></tr>
</table>
<p>GitHub artifact attestations על runners מנוהלים של GitHub או ה-SLSA GitHub generator (reusable workflows) מביאים ל-L2-L3 מהר. גרסאות SLSA מאוחרות יותר מוסיפות Source track (branch protection, דרישות review) – תבדקו את ה-spec העדכני לשמות הרמות המדויקים.</p>
<blockquote>⚠️ טיפ לפרודקשן: "לוודא שזה חתום" חסר משמעות ב-keyless – כל מי שיש לו חשבון GitHub יכול לחתום על כל דבר. תמיד מאמתים את ה-<em>identity</em> (נתיב ה-workflow המדויק, תבנית ה-ref) ואת ה-<em>issuer</em>.</blockquote>`
      }
    },
    {
      h: { en: "Enforcement at admission and pinning by digest", he: "אכיפה ב-admission ו-pinning לפי digest" },
      body: {
        en: `<p>Signatures nobody checks are decoration. Enforce at the cluster edge with Kyverno <code>verifyImages</code>, the Sigstore policy-controller, or OPA Gatekeeper with an external data provider (e.g. Ratify). Kyverno can also rewrite tags to the verified digest, so what runs is exactly what was verified:</p>
${SC_KYVERNO}
<p>Roll out like any admission policy: Audit mode, a dashboard of violations by namespace, fix pipelines, then Enforce namespace by namespace. Set <code>webhookTimeoutSeconds</code> sensibly — signature verification calls registries and Rekor, and a slow webhook delays every pod creation. Have a documented break-glass (a labelled namespace excluded, audited) for incidents.</p>
<p><strong>Pin everything by immutable reference</strong> — tags, branches and "latest" can be repointed:</p>
${SC_PIN}
<p>Pinning without updating freezes vulnerabilities in place, so pair it with Renovate/Dependabot, which bump the digest and SHA in PRs with changelogs — and let your CI (scan + tests) gate the merge.</p>`,
        he: `<p>חתימות שאף אחד לא בודק הן קישוט. אוכפים בכניסה ל-cluster עם <code>verifyImages</code> של Kyverno, ה-policy-controller של Sigstore, או OPA Gatekeeper עם external data provider (למשל Ratify). Kyverno יכול גם לשכתב tags ל-digest המאומת, כך שמה שרץ הוא בדיוק מה שאומת:</p>
${SC_KYVERNO}
<p>מגלגלים כמו כל admission policy: מצב Audit, dashboard של הפרות לפי namespace, מתקנים pipelines, ואז Enforce namespace אחרי namespace. מגדירים <code>webhookTimeoutSeconds</code> בהיגיון – אימות חתימה פונה ל-registries ול-Rekor, ו-webhook איטי מעכב כל יצירת pod. מחזיקים break-glass מתועד (namespace עם label שמוחרג, עם audit) לזמן תקלה.</p>
<p><strong>מצמידים הכל לפי reference שלא משתנה</strong> – tags, branches ו-"latest" אפשר להזיז:</p>
${SC_PIN}
<p>Pinning בלי עדכונים מקפיא פגיעויות במקום, אז מצמידים לזה Renovate/Dependabot, שמעלים את ה-digest וה-SHA ב-PRs עם changelogs – ונותנים ל-CI (סריקה + טסטים) לשמור על ה-merge.</p>`
      }
    }
  ],
  diagram: "git (signed, reviewed) -> CI (ephemeral runner, OIDC) -> image@sha256 -> [cosign sign | SBOM attest | SLSA provenance] -> Rekor log\nkubectl apply -> Kyverno verifyImages (identity+issuer+provenance) -> mutate tag->digest -> admitted | denied",
  handsOn: [
    { cmd: "syft nginx:1.27 -o table | head -20 && trivy image --severity CRITICAL,HIGH --ignore-unfixed nginx:1.27", what: { en: "See what's inside a popular image and which fixable HIGH/CRITICAL CVEs it carries.", he: "רואים מה יש בתוך image פופולרי ואילו CVEs ב-HIGH/CRITICAL עם תיקון הוא נושא." } },
    { cmd: "cosign verify ghcr.io/sigstore/cosign/cosign:latest --certificate-oidc-issuer https://token.actions.githubusercontent.com --certificate-identity-regexp '^https://github.com/sigstore/cosign/' | jq '.[0].optional'", what: { en: "Verify a real keyless signature and inspect the identity claims inside the certificate.", he: "מאמתים חתימת keyless אמיתית ובוחנים את ה-claims של הזהות בתוך התעודה." } },
    { cmd: "crane digest nginx:1.27 && docker buildx imagetools inspect nginx:1.27", what: { en: "Resolve a tag to its immutable digest (and per-platform manifests) for pinning.", he: "מתרגמים tag ל-digest הקבוע שלו (ול-manifests לכל פלטפורמה) בשביל pinning." } },
    { cmd: "kubectl get policyreport -A -o custom-columns=NS:.metadata.namespace,PASS:.summary.pass,FAIL:.summary.fail", what: { en: "During Audit rollout, see which namespaces would be blocked by verifyImages.", he: "בזמן rollout במצב Audit, רואים אילו namespaces היו נחסמים ע״י verifyImages." } }
  ],
  mnemonic: { en: "Know it, Sign it, Prove it, Gate it, Pin it.", he: "לדעת (SBOM), לחתום, להוכיח (provenance), לחסום (admission), להצמיד (digest)." },
  pitfalls: [
    { en: "Verifying only that a signature exists: with keyless, any GitHub user can sign. Pin issuer + exact workflow identity.", he: "לאמת רק שקיימת חתימה: ב-keyless כל משתמש GitHub יכול לחתום. מצמידים issuer + זהות workflow מדויקת." },
    { en: "Signing the tag instead of the digest, or deploying by tag after verifying: a repointed tag bypasses everything. Sign and deploy digests.", he: "לחתום על ה-tag במקום על ה-digest, או לעשות deploy לפי tag אחרי האימות: tag שהוזז עוקף הכל. חותמים ועושים deploy ל-digests." },
    { en: "Failing builds on every CVE including unfixable ones: teams add --exit-code 0 and the program dies. Gate on fixable, track the rest with SLAs.", he: "להכשיל builds על כל CVE כולל כאלה בלי תיקון: צוותים מוסיפים --exit-code 0 והתוכנית מתה. חוסמים על מה שניתן לתיקון, ועוקבים אחרי השאר עם SLAs." },
    { en: "Pinning third-party GitHub Actions by tag (@v4): tags are mutable, and a hijacked action runs with your CI secrets.", he: "להצמיד GitHub Actions של צד שלישי לפי tag (@v4): tags ניתנים לשינוי, ו-action שנחטף רץ עם סודות ה-CI שלכם." }
  ],
  interview: [
    {
      q: { en: "Leadership asks: 'Are we SLSA L3?' after an industry incident. How do you assess and plan?", he: "ההנהלה שואלת אחרי אירוע בתעשייה: 'אנחנו ב-SLSA L3?'. איך מעריכים ומתכננים?" },
      a: { en: "Inventory build paths first — usually there are many (GitHub Actions, a Jenkins box, developers pushing from laptops). Score each against Build L1-L3: does provenance exist, is it generated and signed by the platform, are builds ephemeral and isolated with signing material out of reach of user steps. Typical plan: (1) block pushes to prod registries except from CI identities, (2) move builds to hosted ephemeral runners with OIDC, (3) generate signed provenance (GitHub attestations or SLSA generator) — quick L2/L3 for most repos, (4) enforce at admission in Audit then Enforce, (5) then the source side: branch protection, required reviews, pinned actions. Report % of production images with verified provenance as the KPI, not a binary yes/no.", he: "קודם עושים מלאי של נתיבי build – בדרך כלל יש הרבה (GitHub Actions, שרת Jenkins, מפתחים שדוחפים מהלפטופ). מדרגים כל אחד מול Build L1-L3: האם יש provenance, האם הפלטפורמה מייצרת וחותמת אותו, האם ה-builds זמניים ומבודדים עם חומר החתימה מחוץ להישג של צעדי המשתמש. תוכנית טיפוסית: (1) לחסום push ל-registries של פרודקשן חוץ מזהויות CI, (2) להעביר builds ל-runners מנוהלים וזמניים עם OIDC, (3) לייצר provenance חתום (GitHub attestations או SLSA generator) – L2/L3 מהיר לרוב ה-repos, (4) לאכוף ב-admission במצב Audit ואז Enforce, (5) ואז צד ה-source: branch protection, reviews חובה, actions מוצמדים. מדווחים כ-KPI את % ה-images בפרודקשן עם provenance מאומת, לא כן/לא בינארי." }
    },
    {
      q: { en: "A critical CVE in a base library is announced. How do you find out within an hour what is affected in production?", he: "מתפרסם CVE קריטי בספרייה בסיסית. איך יודעים תוך שעה מה מושפע בפרודקשן?" },
      a: { en: "Get the set of running image digests from the clusters (kubectl get pods -A -o jsonpath on .status.containerStatuses[*].imageID, or from an inventory like Trivy Operator / the registry). Join those digests with stored SBOMs (attested in the registry or in a DB like Dependency-Track/GUAC) and query for the package PURL and vulnerable version range. Output: list of services, owners from the catalog, and whether a fixed base image exists. Then: rebuild via automated base-image bump PRs, prioritise internet-facing services, and use admission policy to block new deploys of the vulnerable digests. Without SBOMs, you are rescanning every image under pressure.", he: "לוקחים את רשימת ה-image digests שרצים מה-clusters (kubectl get pods -A -o jsonpath על .status.containerStatuses[*].imageID, או ממלאי כמו Trivy Operator / ה-registry). מצליבים את ה-digests עם SBOMs שמורים (attested ב-registry או ב-DB כמו Dependency-Track/GUAC) ומחפשים את ה-PURL של החבילה וטווח הגרסאות הפגיע. התוצר: רשימת שירותים, בעלים מה-catalog, והאם קיים base image מתוקן. אחר כך: build מחדש דרך PRs אוטומטיים של העלאת base image, עדיפות לשירותים שחשופים לאינטרנט, ו-admission policy שחוסם deploys חדשים של ה-digests הפגיעים. בלי SBOMs, סורקים מחדש כל image תחת לחץ." }
    },
    {
      q: { en: "Kyverno or Sigstore policy-controller or Gatekeeper for image verification?", he: "Kyverno, policy-controller של Sigstore או Gatekeeper לאימות images?" },
      a: { en: "If Kyverno is already your policy engine, use its verifyImages: one engine, policy reports, digest mutation and attestation conditions in YAML. Sigstore policy-controller is purpose-built and minimal — good if you want only signature policy without a general engine. Gatekeeper needs an external data provider such as Ratify for signatures, which adds a moving part; choose it if Rego/OPA is your org standard. Whatever you choose: HA replicas, PDB, sensible failurePolicy and timeouts, exclusions for kube-system, caching of verification results, and an audit-first rollout.", he: "אם Kyverno כבר מנוע ה-policy שלכם, משתמשים ב-verifyImages שלו: מנוע אחד, policy reports, מוטציה ל-digest ותנאים על attestations ב-YAML. ה-policy-controller של Sigstore בנוי ייעודית ומינימלי – טוב אם רוצים רק policy של חתימות בלי מנוע כללי. Gatekeeper צריך external data provider כמו Ratify לחתימות, וזה עוד חלק נע; בוחרים בו אם Rego/OPA הוא הסטנדרט הארגוני. מה שלא תבחרו: replicas ל-HA, PDB, failurePolicy ו-timeouts הגיוניים, החרגה ל-kube-system, caching של תוצאות אימות, ו-rollout שמתחיל ב-audit." }
    }
  ],
  quiz: [
    {
      q: { en: "In keyless cosign signing, what binds the signature to the CI workflow?", he: "בחתימת keyless של cosign, מה קושר את החתימה ל-workflow של ה-CI?" },
      options: [
        { en: "A long-lived private key stored in GitHub secrets", he: "Private key ארוך-חיים ששמור ב-GitHub secrets" },
        { en: "A short-lived Fulcio certificate issued for the job's OIDC identity, recorded in Rekor", he: "תעודת Fulcio קצרת-חיים שהונפקה לזהות ה-OIDC של ה-job ונרשמה ב-Rekor" },
        { en: "The image tag", he: "ה-tag של ה-image" },
        { en: "The SBOM", he: "ה-SBOM" }
      ], answer: 1,
      explain: { en: "Fulcio issues a ~10-minute cert containing the OIDC identity; the signature and cert go to the Rekor transparency log, so verification checks identity, not a stored key.", he: "Fulcio מנפיק תעודה לכ-10 דקות שמכילה את זהות ה-OIDC; החתימה והתעודה נכנסות ל-transparency log של Rekor, כך שהאימות בודק זהות ולא מפתח שמור." }
    },
    {
      q: { en: "Which SLSA Build level first requires that the hosted build platform generates and signs provenance?", he: "איזו רמת SLSA Build היא הראשונה שדורשת שפלטפורמת build מנוהלת תייצר ותחתום על ה-provenance?" },
      options: [
        { en: "L0", he: "L0" },
        { en: "L1", he: "L1" },
        { en: "L2", he: "L2" },
        { en: "L4", he: "L4" }
      ], answer: 2,
      explain: { en: "L1: provenance exists. L2: hosted platform, signed provenance. L3: hardened, isolated builds. SLSA v1.0 dropped the old L4.", he: "L1: יש provenance. L2: פלטפורמה מנוהלת, provenance חתום. L3: builds מוקשחים ומבודדים. SLSA v1.0 הוריד את L4 הישן." }
    },
    {
      q: { en: "Why pin a third-party GitHub Action to a full commit SHA rather than @v4?", he: "למה להצמיד GitHub Action של צד שלישי ל-SHA מלא של commit ולא ל-@v4?" },
      options: [
        { en: "SHAs run faster", he: "SHAs רצים מהר יותר" },
        { en: "Tags can be repointed to malicious code; a SHA is immutable", he: "אפשר להזיז tags לקוד זדוני; SHA לא משתנה" },
        { en: "GitHub requires it", he: "GitHub דורש את זה" },
        { en: "It enables OIDC", he: "זה מפעיל OIDC" }
      ], answer: 1,
      explain: { en: "Mutable tags were exactly the vector in the tj-actions/changed-files compromise. Pin SHAs and let Renovate/Dependabot bump them.", he: "Tags שניתנים לשינוי היו בדיוק הווקטור בפריצה של tj-actions/changed-files. מצמידים SHAs ונותנים ל-Renovate/Dependabot לעדכן אותם." }
    },
    {
      q: { en: "A team's CI fails daily on unfixable CVEs in their base image. Best policy change?", he: "ה-CI של צוות נכשל כל יום על CVEs בלי תיקון ב-base image שלו. מה שינוי המדיניות הנכון?" },
      options: [
        { en: "Disable scanning for that team", he: "לכבות סריקה לצוות הזה" },
        { en: "Gate only on fixable HIGH/CRITICAL, track others with SLAs/VEX, and move to a minimal base image", he: "לחסום רק על HIGH/CRITICAL עם תיקון, לעקוב אחרי השאר עם SLAs/VEX, ולעבור ל-base image מינימלי" },
        { en: "Block on all severities to force the issue", he: "לחסום על כל החומרות כדי לכפות" },
        { en: "Scan only once a quarter", he: "לסרוק רק פעם ברבעון" }
      ], answer: 1,
      explain: { en: "Blocking on things teams can't fix destroys trust in the gate. Gate on actionable findings, shrink the surface, and track residual risk.", he: "חסימה על דברים שצוותים לא יכולים לתקן הורסת את האמון ב-gate. חוסמים על ממצאים שאפשר לפעול עליהם, מקטינים את המשטח ועוקבים אחרי הסיכון שנשאר." }
    }
  ],
  related: ["k8s-security-policy", "container-security", "docker-images", "cloud-cicd", "staff-zero-trust-secrets"]
});
}

// ---------------------------------------------------------------------------
// 14. eBPF, Cilium, runtime security, perf tracing
// ---------------------------------------------------------------------------
{
const EB_MODEL = `<pre>user space                         kernel
-----------                        ------------------------------------------------
bpftrace / cilium / tetragon       verifier: bounded loops, no bad memory access,
   | load bytecode (bpf syscall)   ---&gt;      program must terminate  -&gt;  JIT to native
   |                                attach to a hook:
   |                                  kprobe/kretprobe   any kernel function
   |                                  tracepoint         stable kernel events (syscalls, sched)
   |                                  uprobe             user-space function (libssl, JVM)
   |                                  XDP                NIC driver, before sk_buff (DDoS drop)
   |                                  tc / cgroup        packet in/out per pod (Cilium datapath)
   |                                  LSM                security decisions (deny exec/open)
   &lt;--- read results via BPF maps (hash, array, ring buffer) / perf events</pre>`;

const EB_KPR = `<pre># Cilium as CNI with kube-proxy replacement (Helm values)
kubeProxyReplacement: true
k8sServiceHost: api.prod.internal     # must reach the API server without kube-proxy
k8sServicePort: 443
routingMode: native                    # no VXLAN overlay, pod IPs routable in the VPC
bpf: { masquerade: true }
hubble: { relay: { enabled: true }, ui: { enabled: true } }
encryption: { enabled: true, type: wireguard }   # optional transparent node-to-node encryption

$ cilium status | grep -E 'KubeProxyReplacement|Encryption'
KubeProxyReplacement:    True   [eth0 10.0.12.34 (Direct Routing)]
Encryption:              Wireguard   [NodeEncryption: Disabled, cilium_wg0 (Pubkey: ..., Port: 51871, Peers: 41)]

# kube-proxy (iptables): service lookup walks chains, cost grows with Services x endpoints;
#   full rule resyncs at 10k+ Services take seconds and burn CPU on every node.
# eBPF: O(1) hash-map lookup per connection, socket-level LB (connect() rewritten to the
#   backend, no per-packet NAT for in-cluster traffic), incremental map updates.</pre>`;

const EB_POLICY = `<pre>apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata: { name: orders-api-l7, namespace: shop }
spec:
  endpointSelector: { matchLabels: { app: orders-api } }
  ingress:
  - fromEndpoints: [{ matchLabels: { app: frontend } }]
    toPorts:
    - ports: [{ port: "8080", protocol: TCP }]
      rules:
        http:
        - { method: GET,  path: "/orders/.*" }
        - { method: POST, path: "/orders" }      # DELETE /orders/42 from frontend -&gt; 403
  egress:
  - toFQDNs: [{ matchName: api.stripe.com }]    # DNS-aware egress allow-list
    toPorts: [{ ports: [{ port: "443", protocol: TCP }] }]
  - toEndpoints: [{ matchLabels: { "k8s:io.kubernetes.pod.namespace": kube-system, k8s-app: kube-dns } }]
    toPorts: [{ ports: [{ port: "53", protocol: ANY }], rules: { dns: [{ matchPattern: "*" }] } }]

$ hubble observe -n shop --verdict DROPPED --last 5
Nov 12 09:14:02.118: shop/frontend-7d9 (ID:4211) -&gt; shop/orders-api-5c8 (ID:9921) http-request DROPPED (HTTP/1.1 DELETE http://orders-api:8080/orders/42)
Nov 12 09:14:05.402: shop/orders-api-5c8 (ID:9921) &lt;&gt; 52.1.2.3:443 policy-verdict:none EGRESS DENIED (TCP Flags: SYN)</pre>`;

const EB_RUNTIME = `<pre># Tetragon TracingPolicy: kill any process in a container that writes to /etc
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata: { name: block-etc-writes }
spec:
  kprobes:
  - call: security_file_permission
    syscall: false
    args: [{ index: 0, type: file }, { index: 1, type: int }]
    selectors:
    - matchArgs:
      - { index: 0, operator: Prefix, values: ["/etc/"] }
      - { index: 1, operator: Equal, values: ["2"] }        # MAY_WRITE
      matchActions: [{ action: Sigkill }]                   # enforced in-kernel, synchronously

# Falco rule: detect (alert), don't block
- rule: Shell in container
  desc: interactive shell spawned inside a container
  condition: spawned_process and container and proc.name in (bash, sh, zsh) and proc.tty != 0
  output: "shell in container (user=%user.name pod=%k8s.pod.name ns=%k8s.ns.name cmd=%proc.cmdline)"
  priority: WARNING</pre>`;

const EB_PERF = `<pre># BCC tools (package bpfcc-tools on Ubuntu: names end in -bpfcc)
execsnoop        # every exec(): catches short-lived processes top never shows
opensnoop -p 4242   # files a process opens (missing config? wrong path?)
biolatency -D 10 1  # block I/O latency histogram per disk
runqlat 10 1        # CPU run-queue latency: are threads waiting for a CPU?
tcpretrans          # TCP retransmits with addresses: network loss, not app slowness
tcplife             # TCP sessions with duration and bytes
offcputime -p 4242 10   # where threads block (locks, I/O) instead of running

# bpftrace one-liners
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { @[comm] = count(); }'
bpftrace -e 'kprobe:vfs_read { @start[tid] = nsecs; }
             kretprobe:vfs_read /@start[tid]/ { @us = hist((nsecs - @start[tid]) / 1000); delete(@start[tid]); }'
bpftrace -e 'profile:hz:99 /pid == 4242/ { @[ustack] = count(); }'   # on-CPU flame graph input

$ runqlat 10 1
     usecs        : count  distribution
       0 -&gt; 1     : 2112   |*****                       |
       2 -&gt; 3     : 9801   |************************    |
      ...
    4096 -&gt; 8191  : 3420   |********                    |   &lt;- 4-8 ms waits: CPU saturation / throttling</pre>`;

INFRA.lessons.push({
  id: "staff-ebpf-cilium",
  track: "staff",
  order: 14,
  icon: "🐝",
  level: 3,
  minutes: 18,
  title: { en: "eBPF in Production: Cilium, Runtime Security & Perf Tracing", he: "eBPF בפרודקשן: Cilium, Runtime Security ו-Perf Tracing" },
  tldr: {
    en: "eBPF runs verified, sandboxed programs inside the Linux kernel at hooks (syscalls, network, functions) with near-native speed. It powers Cilium's kube-proxy-free networking and L7 policy with Hubble flow visibility, Tetragon/Falco runtime security, and bpftrace/BCC tools that answer 'why is it slow?' on a live production box without restarts.",
    he: "eBPF מריץ תוכניות מאומתות ומבודדות בתוך ה-kernel של Linux על hooks (syscalls, רשת, פונקציות) במהירות כמעט native. הוא מניע את הרשת בלי kube-proxy ואת ה-policy ב-L7 של Cilium עם נראות flows של Hubble, את ה-runtime security של Tetragon/Falco, ואת כלי bpftrace/BCC שעונים על 'למה זה איטי?' על מכונת פרודקשן חיה בלי restarts."
  },
  analogy: {
    en: "The kernel is a busy highway. Before eBPF, to watch traffic you either rebuilt the road (kernel modules — one bug crashes everything) or stood outside reading the news (logs). eBPF lets you install certified smart cameras and toll gates at any junction: an inspector (the verifier) checks each device can't block or damage the road before it's bolted on, and the devices report to a dashboard (maps) or close a lane instantly.",
    he: "ה-kernel הוא כביש מהיר עמוס. לפני eBPF, כדי לצפות בתנועה או שבנית מחדש את הכביש (kernel modules – באג אחד מפיל הכל) או שעמדת בחוץ וקראת חדשות (logs). eBPF מאפשר להתקין מצלמות חכמות ושערי אגרה מאושרים בכל צומת: מפקח (ה-verifier) בודק שכל מכשיר לא יכול לחסום או להזיק לכביש לפני שמבריגים אותו, והמכשירים מדווחים ל-dashboard (maps) או סוגרים נתיב מיד."
  },
  sections: [
    {
      h: { en: "What eBPF is, mechanically", he: "מה זה eBPF, מכנית" },
      body: {
        en: `<p>eBPF programs are small bytecode programs loaded via the <code>bpf()</code> syscall. The <strong>verifier</strong> proves they terminate and only touch memory they're allowed to; then they're JIT-compiled to native code and attached to a hook. State and results live in <strong>maps</strong> shared with user space. <strong>CO-RE</strong> (compile once, run everywhere) with kernel <strong>BTF</strong> type info lets one binary run across kernel versions.</p>
${EB_MODEL}
<ul>
<li><strong>Safety</strong>: unlike a kernel module, a buggy eBPF program is rejected at load time instead of panicking the node. It's not risk-free (verifier bugs, CPU cost of hot hooks), but it's production-grade.</li>
<li><strong>Kernel versions matter</strong>: features arrive per kernel release. Use a modern LTS kernel (5.15+/6.x; check your CNI's documented minimum) — managed node images (Bottlerocket, AL2023, COS, Ubuntu) are fine; ancient RHEL 7-era kernels are not.</li>
<li><strong>Privileges</strong>: loading programs needs <code>CAP_BPF</code> + <code>CAP_PERFMON</code>/<code>CAP_NET_ADMIN</code> (or root). Any pod that can load eBPF can see everything on the node — treat eBPF agents as privileged, trusted components.</li>
</ul>`,
        he: `<p>תוכניות eBPF הן תוכניות bytecode קטנות שנטענות דרך ה-syscall <code>bpf()</code>. ה-<strong>verifier</strong> מוכיח שהן מסתיימות ונוגעות רק בזיכרון שמותר להן; אחר כך הן עוברות JIT לקוד native ומחוברות ל-hook. ה-state והתוצאות חיים ב-<strong>maps</strong> שמשותפים עם user space. <strong>CO-RE</strong> (compile once, run everywhere) יחד עם מידע הטיפוסים <strong>BTF</strong> של ה-kernel מאפשרים לבינארי אחד לרוץ על פני גרסאות kernel.</p>
${EB_MODEL}
<ul>
<li><strong>בטיחות</strong>: בניגוד ל-kernel module, תוכנית eBPF עם באג נדחית בזמן הטעינה במקום להפיל את ה-node ב-panic. זה לא נטול סיכון (באגים ב-verifier, עלות CPU של hooks חמים), אבל זה ברמת פרודקשן.</li>
<li><strong>גרסאות kernel חשובות</strong>: פיצ'רים מגיעים לפי release של ה-kernel. משתמשים ב-kernel LTS מודרני (5.15+/6.x; תבדקו את המינימום המתועד של ה-CNI) – images מנוהלים ל-nodes (Bottlerocket, AL2023, COS, Ubuntu) בסדר; kernels עתיקים מתקופת RHEL 7 לא.</li>
<li><strong>הרשאות</strong>: טעינת תוכניות דורשת <code>CAP_BPF</code> + <code>CAP_PERFMON</code>/<code>CAP_NET_ADMIN</code> (או root). כל pod שיכול לטעון eBPF רואה הכל על ה-node – מתייחסים ל-agents של eBPF כרכיבים privileged ומהימנים.</li>
</ul>`
      }
    },
    {
      h: { en: "Cilium: kube-proxy replacement, L7 policy and Hubble", he: "Cilium: החלפת kube-proxy, policy ב-L7 ו-Hubble" },
      body: {
        en: `<p><strong>Cilium</strong> (CNCF graduated) is the eBPF-native CNI. It is the dataplane behind GKE Dataplane V2 and Azure CNI Powered by Cilium, and a common choice on EKS and self-managed clusters.</p>
${EB_KPR}
<p>At small scale kube-proxy (iptables, or the newer nftables mode, GA in Kubernetes 1.33) is fine. At thousands of Services the eBPF path wins on update latency, node CPU and connection setup. Identity-based policy is the other big idea: Cilium assigns a numeric <strong>security identity</strong> per label set, so policy doesn't depend on ever-changing pod IPs.</p>
${EB_POLICY}
<p>L3/L4 policy is enforced purely in eBPF. L7 rules (HTTP, gRPC, Kafka, DNS) redirect matching traffic to a per-node Envoy — powerful, but it adds proxy latency and CPU only for the flows you select. <strong>Hubble</strong> exposes every flow with verdicts and L7 metadata; <code>hubble observe</code> is the fastest answer to "is NetworkPolicy dropping my traffic?", and its metrics give per-service golden signals without app instrumentation.</p>
<blockquote>⚠️ Production tip: migrating CNI on a live cluster is the riskiest part. Prefer building a new node pool / cluster with Cilium and shifting workloads, or use Cilium's documented per-node migration mode. Remove kube-proxy only after verifying <code>KubeProxyReplacement: True</code> on every node, and keep NodePort/HostPort/externalTrafficPolicy behaviours in your test plan.</blockquote>`,
        he: `<p><strong>Cilium</strong> (CNCF graduated) הוא ה-CNI ה-native ל-eBPF. הוא ה-dataplane שמאחורי GKE Dataplane V2 ו-Azure CNI Powered by Cilium, ובחירה נפוצה ב-EKS וב-clusters בניהול עצמי.</p>
${EB_KPR}
<p>בקנה מידה קטן kube-proxy (iptables, או מצב nftables החדש, GA ב-Kubernetes 1.33) בסדר גמור. באלפי Services מסלול ה-eBPF מנצח ב-latency של עדכונים, ב-CPU של ה-node ובהקמת connections. הרעיון הגדול השני הוא policy מבוסס זהות: Cilium מקצה <strong>security identity</strong> מספרית לכל סט labels, כך שה-policy לא תלוי בכתובות IP של pods שמשתנות כל הזמן.</p>
${EB_POLICY}
<p>Policy של L3/L4 נאכף כולו ב-eBPF. חוקי L7 (HTTP, gRPC, Kafka, DNS) מפנים את התעבורה המתאימה ל-Envoy אחד לכל node – חזק, אבל מוסיף latency ו-CPU של proxy רק ל-flows שבחרתם. <strong>Hubble</strong> חושף כל flow עם verdict ו-metadata של L7; <code>hubble observe</code> הוא התשובה הכי מהירה ל-"האם NetworkPolicy מפיל לי תעבורה?", והמטריקות שלו נותנות golden signals לכל שירות בלי instrumentation באפליקציה.</p>
<blockquote>⚠️ טיפ לפרודקשן: החלפת CNI ב-cluster חי היא החלק המסוכן ביותר. עדיף לבנות node pool / cluster חדש עם Cilium ולהעביר workloads, או להשתמש במצב ה-migration המתועד של Cilium לכל node. מורידים את kube-proxy רק אחרי שמוודאים <code>KubeProxyReplacement: True</code> בכל node, ומכניסים לתוכנית הבדיקות את ההתנהגות של NodePort/HostPort/externalTrafficPolicy.</blockquote>`
      }
    },
    {
      h: { en: "Runtime security: Tetragon vs Falco", he: "Runtime security: Tetragon מול Falco" },
      body: {
        en: `<p>Admission control decides what may start; runtime security watches what it actually does. Both tools hook syscalls and kernel functions with eBPF and enrich events with Kubernetes metadata (pod, namespace, labels, image):</p>
${EB_RUNTIME}
<table>
<tr><th></th><th>Falco (CNCF graduated)</th><th>Tetragon (Cilium project)</th></tr>
<tr><td>Main mode</td><td>Detection: rules over a syscall event stream, rich default ruleset</td><td>Observability + <em>enforcement</em>: filtering and actions (Sigkill, override return) in-kernel</td></tr>
<tr><td>Output</td><td>Alerts to Falcosidekick → Slack, SIEM, PagerDuty</td><td>JSON events (process exec tree, network, file), export to SIEM</td></tr>
<tr><td>Strength</td><td>Mature rules for common attack patterns</td><td>Low overhead filtering in kernel, can stop the action synchronously</td></tr>
</table>
<p>Enforcing (killing processes) is powerful and dangerous: a too-broad policy kills your own package manager during a debug session or a legitimate init script. Run detection for weeks, baseline normal behaviour per workload, then enforce narrowly (e.g. "no writes to /etc, no exec of shells in payment pods").</p>`,
        he: `<p>Admission control מחליט מה מותר להתחיל; runtime security מסתכל מה זה עושה בפועל. שני הכלים מתחברים ל-syscalls ולפונקציות kernel עם eBPF ומעשירים את האירועים ב-metadata של Kubernetes (pod, namespace, labels, image):</p>
${EB_RUNTIME}
<table>
<tr><th></th><th>Falco (CNCF graduated)</th><th>Tetragon (פרויקט של Cilium)</th></tr>
<tr><td>מצב עיקרי</td><td>זיהוי: חוקים על זרם אירועי syscalls, סט חוקים ברירת מחדל עשיר</td><td>Observability + <em>אכיפה</em>: סינון ופעולות (Sigkill, override return) בתוך ה-kernel</td></tr>
<tr><td>פלט</td><td>Alerts ל-Falcosidekick → Slack, SIEM, PagerDuty</td><td>אירועי JSON (עץ exec של תהליכים, רשת, קבצים), ייצוא ל-SIEM</td></tr>
<tr><td>חוזקה</td><td>חוקים בשלים לדפוסי תקיפה נפוצים</td><td>סינון ב-kernel עם overhead נמוך, יכול לעצור את הפעולה באופן סינכרוני</td></tr>
</table>
<p>אכיפה (הריגת תהליכים) חזקה ומסוכנת: policy רחב מדי יהרוג את ה-package manager שלכם באמצע session דיבאג או init script לגיטימי. מריצים זיהוי כמה שבועות, בונים baseline של התנהגות נורמלית לכל workload, ורק אז אוכפים בצורה צרה (למשל "בלי כתיבה ל-/etc, בלי exec של shells ב-pods של payments").</p>`
      }
    },
    {
      h: { en: "Performance debugging with BCC and bpftrace", he: "דיבאג ביצועים עם BCC ו-bpftrace" },
      body: {
        en: `<p>When metrics say "p99 is up" but not why, eBPF tools give kernel-level truth on a live box, with overhead usually in the low single-digit percent (measure before running high-frequency probes on hot paths). Brendan Gregg's workflow: start with the 60-second checklist (uptime, vmstat, iostat, sar), then reach for targeted tools:</p>
${EB_PERF}
<p>Inside Kubernetes run them from a privileged debug pod on the node (<code>kubectl debug node/ip-10-0-1-5 -it --image=quay.io/iovisor/bpftrace --profile=sysadmin</code>, or an image with bcc), or use Inspektor Gadget which wraps these as <code>kubectl gadget</code> commands with pod/namespace filters. Continuous profilers (Parca, Pyroscope, Grafana Beyla/OTel eBPF profiler) use the same mechanism always-on, giving fleet-wide flame graphs for a few percent CPU.</p>
<blockquote>💡 Real world: a classic find — p99 spikes every 30s on a Java service; <code>offcputime</code> shows threads blocked in <code>futex</code> under a logging lock, and <code>biolatency</code> shows 200ms writes when the log volume flushes to an EBS volume hitting its IOPS limit. No app metric would have shown that chain.</blockquote>`,
        he: `<p>כשהמטריקות אומרות "ה-p99 עלה" אבל לא למה, כלי eBPF נותנים אמת ברמת ה-kernel על מכונה חיה, עם overhead שבדרך כלל של אחוזים בודדים (תמדדו לפני שמריצים probes בתדירות גבוהה על נתיבים חמים). ה-workflow של Brendan Gregg: מתחילים מצ'קליסט 60 השניות (uptime, vmstat, iostat, sar), ואז שולפים כלים ממוקדים:</p>
${EB_PERF}
<p>בתוך Kubernetes מריצים אותם מ-debug pod עם הרשאות על ה-node (<code>kubectl debug node/ip-10-0-1-5 -it --image=quay.io/iovisor/bpftrace --profile=sysadmin</code>, או image עם bcc), או משתמשים ב-Inspektor Gadget שעוטף אותם כפקודות <code>kubectl gadget</code> עם סינון לפי pod/namespace. Continuous profilers (Parca, Pyroscope, Grafana Beyla/OTel eBPF profiler) משתמשים באותו מנגנון כל הזמן, ונותנים flame graphs לכל ה-fleet בעלות של כמה אחוזי CPU.</p>
<blockquote>💡 מהשטח: ממצא קלאסי – p99 קופץ כל 30 שניות בשירות Java; <code>offcputime</code> מראה threads שחסומים ב-<code>futex</code> על lock של logging, ו-<code>biolatency</code> מראה כתיבות של 200ms כשנפח הלוגים נשטף ל-volume של EBS שמגיע למגבלת ה-IOPS שלו. שום מטריקה של האפליקציה לא הייתה מראה את השרשרת הזאת.</blockquote>`
      }
    }
  ],
  diagram: "pod A --connect()--> [eBPF sock LB: svc VIP -> backend IP, O(1) map] --> tc/eBPF policy (identity 4211 -> 9921 allowed?) --> [L7 rule? -> node Envoy] --> pod B\n                                   \\--> Hubble flow log (verdict, L7 method/path)",
  handsOn: [
    { cmd: "cilium status --wait && cilium connectivity test --test-namespace cilium-test", what: { en: "Check Cilium health and run the built-in end-to-end connectivity and policy test suite.", he: "בודקים את בריאות Cilium ומריצים את חבילת בדיקות ה-connectivity וה-policy המובנית." } },
    { cmd: "hubble observe -n shop --verdict DROPPED -f", what: { en: "Stream dropped flows live while you reproduce a 'connection timed out' — see which policy direction blocks it.", he: "צופים ב-flows שנדחו בזמן אמת בזמן שמשחזרים 'connection timed out' – רואים איזה כיוון policy חוסם." } },
    { cmd: "sudo bpftrace -e 'tracepoint:syscalls:sys_enter_execve { printf(\"%s -> %s\\n\", comm, str(args->filename)); }'", what: { en: "Print every exec on the node — find the cron job or sidecar spawning thousands of short processes.", he: "מדפיסים כל exec על ה-node – מוצאים את ה-cron job או ה-sidecar שמוליד אלפי תהליכים קצרים." } },
    { cmd: "sudo bpftool prog show | head -20 && sudo bpftool map show | head", what: { en: "List eBPF programs and maps loaded on the node (Cilium, Tetragon, profilers) — know what runs in your kernel.", he: "מציגים את תוכניות וה-maps של eBPF שטעונים על ה-node (Cilium, Tetragon, profilers) – לדעת מה רץ לכם ב-kernel." } }
  ],
  mnemonic: { en: "eBPF = Verify, JIT, Hook, Map. Cilium = see (Hubble), route (no kube-proxy), guard (identity policy).", he: "eBPF = Verify, JIT, Hook, Map. Cilium = לראות (Hubble), לנתב (בלי kube-proxy), לשמור (policy מבוסס זהות)." },
  pitfalls: [
    { en: "Assuming any kernel works: missing BTF or old kernels silently disable features or force fallbacks. Pin node images and test kernel upgrades with your CNI.", he: "להניח שכל kernel עובד: BTF חסר או kernels ישנים מבטלים פיצ'רים בשקט או מכריחים fallbacks. מצמידים node images ובודקים שדרוגי kernel יחד עם ה-CNI." },
    { en: "Turning on L7 policy everywhere: every L7-matched flow goes through a node Envoy, adding latency and CPU. Use L7 only where you need path/method control.", he: "להפעיל policy של L7 בכל מקום: כל flow שתואם L7 עובר דרך Envoy של ה-node, ומוסיף latency ו-CPU. משתמשים ב-L7 רק איפה שצריך שליטה לפי path/method." },
    { en: "Enforcing Tetragon kill policies without a baseline: you will kill legitimate processes in production.", he: "לאכוף policies של הריגה ב-Tetragon בלי baseline: תהרגו תהליכים לגיטימיים בפרודקשן." },
    { en: "Running high-frequency kprobes on hot kernel functions on a loaded box: the tracing itself becomes the latency problem.", he: "להריץ kprobes בתדירות גבוהה על פונקציות kernel חמות במכונה עמוסה: ה-tracing עצמו הופך לבעיית ה-latency." }
  ],
  interview: [
    {
      q: { en: "Should we replace kube-proxy with Cilium's eBPF datapath on our 300-node cluster with 4,000 Services?", he: "האם להחליף את kube-proxy ב-datapath של eBPF של Cilium ב-cluster שלנו עם 300 nodes ו-4,000 Services?" },
      a: { en: "Gather evidence first: iptables rule count per node (iptables-save | wc -l), kube-proxy sync latency metrics, node CPU spent in kube-proxy, connection setup latency. At 4,000 Services with many endpoints these are often measurably bad, and eBPF gives O(1) lookups, socket-level LB and faster updates — plus Hubble and identity policy as a bonus. Costs: CNI migration risk, team skills, kernel requirements, and a new tier-0 component. I'd also evaluate kube-proxy nftables mode as a lower-risk improvement. If going Cilium: new node pools with Cilium, canary workloads, a tested rollback, and an explicit test matrix for NodePort, externalTrafficPolicy, hostNetwork pods and DNS.", he: "קודם אוספים ראיות: מספר חוקי iptables לכל node (iptables-save | wc -l), מטריקות sync latency של kube-proxy, CPU של ה-node שהולך על kube-proxy, latency של הקמת connections. ב-4,000 Services עם הרבה endpoints אלה לרוב גרועים באופן מדיד, ו-eBPF נותן lookups ב-O(1), LB ברמת socket ועדכונים מהירים יותר – ועוד Hubble ו-policy מבוסס זהות כבונוס. עלויות: סיכון מיגרציית CNI, ידע בצוות, דרישות kernel, ורכיב tier-0 חדש. הייתי בודק גם את מצב nftables של kube-proxy כשיפור עם סיכון נמוך יותר. אם הולכים על Cilium: node pools חדשים עם Cilium, workloads ב-canary, rollback שנבדק, ומטריצת בדיקות מפורשת ל-NodePort, externalTrafficPolicy, pods עם hostNetwork ו-DNS." }
    },
    {
      q: { en: "A service's p99 doubled but CPU and memory look normal. How would eBPF tools help?", he: "ה-p99 של שירות הוכפל אבל ה-CPU והזיכרון נראים תקינים. איך כלי eBPF יעזרו?" },
      a: { en: "'CPU looks normal' as an average hides scheduling delay: runqlat shows if threads wait for a CPU (noisy neighbours, CFS throttling). offcputime shows where threads block — locks, I/O, network. biolatency/biosnoop reveal slow disks; tcpretrans and tcp connect latency reveal packet loss or SYN backlog issues; execsnoop catches unexpected process storms; and a profile of user stacks shows if GC or a hot function changed. Each tool narrows the layer — CPU scheduling, storage, network, or the app — in minutes, without redeploying anything.", he: "'CPU נראה תקין' כממוצע מסתיר עיכוב scheduling: runqlat מראה אם threads מחכים ל-CPU (noisy neighbours, CFS throttling). offcputime מראה איפה threads נחסמים – locks, I/O, רשת. biolatency/biosnoop חושפים דיסקים איטיים; tcpretrans ו-latency של tcp connect חושפים איבוד packets או בעיות ב-SYN backlog; execsnoop תופס סערות תהליכים לא צפויות; ו-profile של user stacks מראה אם GC או פונקציה חמה השתנו. כל כלי מצמצם את השכבה – scheduling של CPU, אחסון, רשת או האפליקציה – תוך דקות, בלי deploy מחדש." }
    },
    {
      q: { en: "Is eBPF-based observability a replacement for OpenTelemetry instrumentation?", he: "האם observability מבוסס eBPF מחליף instrumentation של OpenTelemetry?" },
      a: { en: "It's a strong complement, not a full replacement. eBPF gives zero-code coverage: L4/L7 golden signals per service pair, DNS, TCP health, profiles, even HTTP spans by parsing protocols (Beyla, Pixie, Hubble). It struggles with business context (tenant, order id), encrypted traffic unless hooking TLS libraries via uprobes, async context propagation across queues, and custom spans inside a request. Use eBPF for baseline coverage across every workload on day one, and OTel SDKs where you need business semantics and deep traces.", he: "זו השלמה חזקה, לא החלפה מלאה. eBPF נותן כיסוי בלי קוד: golden signals של L4/L7 לכל זוג שירותים, DNS, בריאות TCP, profiles, ואפילו spans של HTTP ע״י פענוח פרוטוקולים (Beyla, Pixie, Hubble). הוא מתקשה עם הקשר עסקי (tenant, order id), תעבורה מוצפנת אלא אם מתחברים לספריות TLS דרך uprobes, העברת context אסינכרונית דרך תורים, ו-spans מותאמים בתוך בקשה. משתמשים ב-eBPF לכיסוי בסיס של כל workload מהיום הראשון, וב-SDKs של OTel איפה שצריך סמנטיקה עסקית ו-traces עמוקים." }
    }
  ],
  quiz: [
    {
      q: { en: "What prevents a buggy eBPF program from crashing the kernel?", he: "מה מונע מתוכנית eBPF עם באג להפיל את ה-kernel?" },
      options: [
        { en: "It runs in user space", he: "היא רצה ב-user space" },
        { en: "The in-kernel verifier rejects unsafe programs at load time", he: "ה-verifier בתוך ה-kernel דוחה תוכניות לא בטוחות בזמן הטעינה" },
        { en: "Containers isolate it", he: "קונטיינרים מבודדים אותה" },
        { en: "It's interpreted by bpftrace", he: "bpftrace מפרש אותה" }
      ], answer: 1,
      explain: { en: "The verifier checks termination, memory safety and allowed helpers before the program is JIT-compiled and attached.", he: "ה-verifier בודק סיום, בטיחות זיכרון ו-helpers מותרים לפני שהתוכנית עוברת JIT ומחוברת." }
    },
    {
      q: { en: "In Cilium, which rules cause traffic to pass through the node's Envoy proxy?", he: "ב-Cilium, אילו חוקים גורמים לתעבורה לעבור דרך ה-Envoy של ה-node?" },
      options: [
        { en: "All L3/L4 NetworkPolicies", he: "כל ה-NetworkPolicies של L3/L4" },
        { en: "L7 rules such as HTTP method/path or DNS/FQDN matching", he: "חוקי L7 כמו HTTP method/path או התאמת DNS/FQDN" },
        { en: "kube-proxy replacement", he: "החלפת kube-proxy" },
        { en: "WireGuard encryption", he: "הצפנת WireGuard" }
      ], answer: 1,
      explain: { en: "L3/L4 enforcement is pure eBPF. L7 rules redirect the selected flows to a proxy (Envoy; DNS rules go through Cilium's DNS proxy).", he: "אכיפת L3/L4 היא eBPF טהור. חוקי L7 מפנים את ה-flows שנבחרו ל-proxy (Envoy; חוקי DNS עוברים דרך ה-DNS proxy של Cilium)." }
    },
    {
      q: { en: "Which tool shows how long threads wait for a CPU after becoming runnable?", he: "איזה כלי מראה כמה זמן threads מחכים ל-CPU אחרי שהם הופכים ל-runnable?" },
      options: [
        { en: "biolatency", he: "biolatency" },
        { en: "runqlat", he: "runqlat" },
        { en: "tcpretrans", he: "tcpretrans" },
        { en: "opensnoop", he: "opensnoop" }
      ], answer: 1,
      explain: { en: "runqlat histograms scheduler run-queue latency — the direct signal of CPU saturation or contention.", he: "runqlat מציג היסטוגרמה של run-queue latency של ה-scheduler – האות הישיר ל-CPU saturation או תחרות." }
    },
    {
      q: { en: "Main difference between Falco and Tetragon?", he: "מה ההבדל העיקרי בין Falco ל-Tetragon?" },
      options: [
        { en: "Falco only works on VMs", he: "Falco עובד רק על VMs" },
        { en: "Falco focuses on detection/alerting; Tetragon can also enforce in-kernel (e.g. Sigkill)", he: "Falco מתמקד בזיהוי/התראות; Tetragon יכול גם לאכוף בתוך ה-kernel (למשל Sigkill)" },
        { en: "Tetragon doesn't use eBPF", he: "Tetragon לא משתמש ב-eBPF" },
        { en: "They are identical", he: "הם זהים" }
      ], answer: 1,
      explain: { en: "Both use eBPF for visibility; Tetragon's selectors and actions can block or kill synchronously in the kernel, while Falco is primarily a detection engine.", he: "שניהם משתמשים ב-eBPF לנראות; ה-selectors וה-actions של Tetragon יכולים לחסום או להרוג באופן סינכרוני ב-kernel, בעוד Falco הוא בעיקר מנוע זיהוי." }
    }
  ],
  related: ["k8s-security-policy", "net-isolation", "linux-performance-60s", "staff-service-mesh", "k8s-troubleshooting-playbook"]
});
}

// ---------------------------------------------------------------------------
// 15. PostgreSQL at scale
// ---------------------------------------------------------------------------
{
const PG_MVCC = `<pre>UPDATE orders SET status='paid' WHERE id=42;   -- in txid 9001

heap page:
  (xmin=8000, xmax=9001)  id=42 status=new    &lt;- old version, now dead once 9001 commits
  (xmin=9001, xmax=0)     id=42 status=paid   &lt;- new version (new tuple, index entries too unless HOT)

A snapshot taken by a txn that started before 9001 still sees status=new.
The dead tuple can only be removed when NO running txn could still see it:
  oldest xmin horizon = min(oldest running txn, replication slots, hot_standby_feedback)
One idle-in-transaction session open for 6 hours = 6 hours of garbage nobody can vacuum.</pre>`;

const PG_VACUUM = `<pre>-- Who needs vacuum, and is autovacuum keeping up?
SELECT relname, n_live_tup, n_dead_tup,
       round(100.0*n_dead_tup/nullif(n_live_tup+n_dead_tup,0),1) AS dead_pct,
       last_autovacuum, autovacuum_count
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 5;

  relname | n_live_tup | n_dead_tup | dead_pct |       last_autovacuum
 ---------+------------+------------+----------+------------------------------
  events  |  412000000 |   61000000 |     12.9 | 2026-11-09 03:12:44+00
  orders  |   38000000 |     900000 |      2.3 | 2026-11-12 08:55:01+00

-- Default trigger: dead &gt; 50 + 0.2 * live  -&gt; events waits for ~82M dead rows. Tune per table:
ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.01,
                        autovacuum_vacuum_insert_scale_factor = 0.01,  -- insert-only tables (PG13+)
                        autovacuum_vacuum_cost_limit = 2000);

-- Global knobs commonly raised on big boxes (postgresql.conf)
autovacuum_max_workers = 6            # default 3
autovacuum_vacuum_cost_limit = 2000   # default -1 =&gt; vacuum_cost_limit 200: very gentle
maintenance_work_mem / autovacuum_work_mem = 1GB
idle_in_transaction_session_timeout = '5min'   # kill the horizon-holders</pre>`;

const PG_WRAP = `<pre>-- XIDs are 32-bit: ~2.1 billion "in the past" visible at any time. Freezing marks old rows as
-- visible-to-all so their xid can be reused. Watch the age:
SELECT datname, age(datfrozenxid) AS xid_age,
       round(100.0*age(datfrozenxid)/2147483647, 1) AS pct_to_wraparound
FROM pg_database ORDER BY 2 DESC;

  datname | xid_age    | pct_to_wraparound
  app     | 1480000000 | 68.9            &lt;- page someone NOW

SELECT c.oid::regclass, age(c.relfrozenxid), pg_size_pretty(pg_total_relation_size(c.oid))
FROM pg_class c WHERE c.relkind IN ('r','m','t') ORDER BY 2 DESC LIMIT 5;

milestones:
  200M  autovacuum_freeze_max_age: anti-wraparound autovacuum starts (can't be cancelled by locks)
  1.6B  vacuum_failsafe_age (PG14+): vacuum drops cost delay and skips index cleanup to finish
  ~40M left: WARNING in logs on every txn
  ~3M left:  database stops assigning new XIDs -&gt; writes fail until a manual VACUUM completes</pre>`;

const PG_POOL = `<pre># pgbouncer.ini
[databases]
app = host=10.0.3.10 port=5432 dbname=app
[pgbouncer]
pool_mode = transaction        # server conn returned to pool at COMMIT/ROLLBACK
max_client_conn = 10000        # cheap: client sockets
default_pool_size = 40         # expensive: real Postgres backends per (db,user)
reserve_pool_size = 10
server_lifetime = 3600
max_prepared_statements = 200  # PgBouncer 1.21+: protocol-level prepared stmts in txn mode

-- Breaks in transaction mode (state lives on a server conn you no longer own):
--   SET search_path / SET statement_timeout (use SET LOCAL or role/db defaults)
--   session advisory locks (pg_advisory_lock), LISTEN/NOTIFY, temp tables across txns,
--   WITH HOLD cursors

$ psql -p 6432 pgbouncer -c 'SHOW POOLS;'
 database | cl_active | cl_waiting | sv_active | sv_idle | maxwait
 app      |      1850 |        240 |        40 |       0 |       3   &lt;- clients queueing 3s: pool too small or slow queries</pre>`;

const PG_REPL = `<pre>-- On the primary
SELECT application_name, client_addr, state, sync_state,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS replay_gap,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;

-- On a replica
SELECT now() - pg_last_xact_replay_timestamp() AS replay_delay;   -- misleading when primary is idle

-- Slots retain WAL until consumed: an abandoned slot fills the primary's disk
SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
-- PG13+: max_slot_wal_keep_size = '100GB' caps it (slot gets invalidated instead of disk full)</pre>`;

const PG_LOCKS = `<pre>-- Who blocks whom, right now
SELECT a.pid, pg_blocking_pids(a.pid) AS blocked_by, a.wait_event_type, a.state,
       now() - a.xact_start AS xact_age, left(a.query, 70) AS query
FROM pg_stat_activity a
WHERE cardinality(pg_blocking_pids(a.pid)) &gt; 0 OR a.state = 'idle in transaction'
ORDER BY xact_age DESC;

-- The classic outage: a "fast" DDL queues behind a long SELECT, and every query queues behind the DDL
-- session 1: long report        SELECT ... FROM orders ...           (AccessShareLock, 20 min)
-- session 2: migration          ALTER TABLE orders ADD COLUMN x int; (wants AccessExclusiveLock -&gt; waits)
-- sessions 3..N: app traffic    SELECT * FROM orders WHERE id=...    (queue behind session 2!)
-- Fix: always
SET lock_timeout = '3s';   -- fail fast and retry instead of freezing the table
SET statement_timeout = '15min';

-- Top queries by total time (pg_stat_statements must be in shared_preload_libraries)
SELECT queryid, calls, round(total_exec_time) AS total_ms, round(mean_exec_time, 2) AS mean_ms,
       rows, round(100.0*shared_blks_hit/nullif(shared_blks_hit+shared_blks_read,0),1) AS hit_pct,
       left(query, 60)
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;</pre>`;

const PG_EXPLAIN = `<pre>EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE customer_id = 7731 AND status = 'open';

Seq Scan on orders  (cost=0.00..912345.00 rows=12 width=96) (actual time=0.041..2873.112 rows=9 loops=1)
  Filter: ((customer_id = 7731) AND (status = 'open'))
  Rows Removed by Filter: 37999991
  Buffers: shared hit=40211 read=402113          &lt;- ~3.4 GB touched for 9 rows
Planning Time: 0.120 ms
Execution Time: 2873.201 ms

CREATE INDEX CONCURRENTLY orders_customer_open_idx ON orders (customer_id) WHERE status = 'open';

Index Scan using orders_customer_open_idx on orders (actual time=0.031..0.058 rows=9 loops=1)
  Index Cond: (customer_id = 7731)
  Buffers: shared hit=5
Execution Time: 0.081 ms
-- Read: estimated vs actual rows (bad stats -&gt; ANALYZE / extended statistics),
--       loops x time for nested loops, Buffers read (disk) vs hit (cache), Sort Method: external merge (work_mem).</pre>`;

INFRA.lessons.push({
  id: "staff-postgres-at-scale",
  track: "staff",
  order: 15,
  icon: "🐘",
  level: 3,
  minutes: 20,
  title: { en: "PostgreSQL at Scale: MVCC, Vacuum, Pooling, Replication & Locks", he: "PostgreSQL בקנה מידה: MVCC, Vacuum, Pooling, Replication ו-Locks" },
  tldr: {
    en: "Postgres never updates in place: every UPDATE writes a new row version, and vacuum must clean up — unless a long transaction pins the horizon. Most large-scale Postgres incidents are one of five things: bloat/autovacuum lag, XID wraparound, connection exhaustion, replication lag/slots, or a lock queue behind DDL. Know the queries that detect each.",
    he: "Postgres אף פעם לא מעדכן במקום: כל UPDATE כותב גרסת שורה חדשה, ו-vacuum צריך לנקות – אלא אם טרנזקציה ארוכה מקבעת את ה-horizon. רוב התקלות של Postgres בקנה מידה גדול הן אחד מחמישה: bloat/פיגור של autovacuum, XID wraparound, מיצוי connections, replication lag/slots, או תור locks מאחורי DDL. תכירו את השאילתות שמזהות כל אחד."
  },
  analogy: {
    en: "MVCC is a library that never erases a book: every edit prints a new edition and shelves it next to the old one, so readers who started with the old edition can finish. Vacuum is the librarian who removes editions nobody can still be reading. One reader who fell asleep in the reading room for six hours (an idle transaction) blocks the librarian from clearing anything newer than his book — and the shelves overflow.",
    he: "MVCC זו ספרייה שאף פעם לא מוחקת ספר: כל עריכה מדפיסה מהדורה חדשה ומניחה אותה ליד הישנה, כדי שקוראים שהתחילו עם הישנה יוכלו לסיים. Vacuum הוא הספרן שמוציא מהדורות שאף אחד כבר לא יכול לקרוא. קורא אחד שנרדם באולם הקריאה לשש שעות (טרנזקציה idle) מונע מהספרן לפנות כל דבר חדש יותר מהספר שלו – והמדפים עולים על גדותיהם."
  },
  sections: [
    {
      h: { en: "MVCC, vacuum and bloat", he: "MVCC, vacuum ו-bloat" },
      body: {
        en: `<p>Every row version carries <code>xmin</code> (creating txid) and <code>xmax</code> (deleting/updating txid). Readers use a snapshot to decide visibility, so readers never block writers. The cost: UPDATE = INSERT new version + mark old dead, and index entries are added too unless it's a <strong>HOT</strong> update (no indexed column changed and free space on the same page — set <code>fillfactor=80-90</code> on hot update-heavy tables to make room).</p>
${PG_MVCC}
<p><strong>Autovacuum</strong> reclaims dead tuples for reuse (it does not shrink files), updates the visibility map (enabling index-only scans) and freezes old rows. The default trigger — 20% of the table dead — is fine for 10k rows and terrible for 400M rows.</p>
${PG_VACUUM}
<p><strong>Bloat</strong> is space held by dead tuples or emptied pages. It inflates I/O, cache misses and backup size. Plain VACUUM makes space reusable; returning it to the OS needs <code>VACUUM FULL</code> (AccessExclusive lock, rewrites table — an outage on big tables) or <strong>pg_repack</strong>/pg_squeeze online. Better: prevent it with per-table autovacuum tuning, short transactions and partitioning (drop old partitions instead of DELETE).</p>`,
        he: `<p>כל גרסת שורה נושאת <code>xmin</code> (ה-txid שיצר) ו-<code>xmax</code> (ה-txid שמחק/עדכן). קוראים משתמשים ב-snapshot כדי להחליט מה גלוי, כך שקוראים אף פעם לא חוסמים כותבים. המחיר: UPDATE = INSERT של גרסה חדשה + סימון הישנה כמתה, ונוספות גם רשומות אינדקס אלא אם זה עדכון <strong>HOT</strong> (שום עמודה מאונדקסת לא השתנתה ויש מקום פנוי באותו page – מגדירים <code>fillfactor=80-90</code> בטבלאות עם הרבה updates כדי להשאיר מקום).</p>
${PG_MVCC}
<p><strong>Autovacuum</strong> משחרר dead tuples לשימוש חוזר (הוא לא מקטין קבצים), מעדכן את ה-visibility map (מה שמאפשר index-only scans) ועושה freeze לשורות ישנות. טריגר ברירת המחדל – 20% מהטבלה מתים – בסדר ל-10k שורות ונוראי ל-400M שורות.</p>
${PG_VACUUM}
<p><strong>Bloat</strong> הוא מקום שמוחזק ע״י dead tuples או pages שהתרוקנו. הוא מנפח I/O, cache misses וגודל גיבויים. VACUUM רגיל הופך את המקום לזמין לשימוש חוזר; כדי להחזיר אותו למערכת ההפעלה צריך <code>VACUUM FULL</code> (lock מסוג AccessExclusive, כותב את הטבלה מחדש – outage בטבלאות גדולות) או <strong>pg_repack</strong>/pg_squeeze אונליין. עדיף: למנוע מראש עם כוונון autovacuum לכל טבלה, טרנזקציות קצרות ו-partitioning (לעשות drop ל-partitions ישנים במקום DELETE).</p>`
      }
    },
    {
      h: { en: "Transaction ID wraparound: the slow-motion outage", he: "Transaction ID wraparound: ה-outage בהילוך איטי" },
      body: {
        en: `<p>Transaction IDs are 32-bit and compared modulo 2^32, so only ~2.1 billion transactions can be "in the past". Rows older than that must be <strong>frozen</strong> or they'd suddenly appear to be in the future (invisible = data loss). Postgres protects itself by escalating — and finally refusing writes:</p>
${PG_WRAP}
<p>A write-heavy system burning 5,000 txid/s consumes 432M XIDs per day; you have days, not months, if freezing stalls. What stalls it: a long-running transaction or forgotten prepared transaction, an inactive replication slot, <code>hot_standby_feedback</code> from a replica with long queries, or autovacuum too throttled to finish a multi-TB table.</p>
<blockquote>⚠️ Production tip: alert on <code>age(datfrozenxid)</code> above ~40-50% of 2^31 (well past the 200M routine trigger, but early enough to act calmly), and on the oldest transaction age in <code>pg_stat_activity</code>. If you're near the cliff: kill horizon holders, drop dead slots, then run a manual <code>VACUUM (FREEZE, VERBOSE)</code> on the oldest tables — without <code>FULL</code>.</blockquote>`,
        he: `<p>Transaction IDs הם 32-bit ומושווים מודולו 2^32, כך שרק כ-2.1 מיליארד טרנזקציות יכולות להיות "בעבר". שורות ישנות מזה חייבות לעבור <strong>freeze</strong>, אחרת הן פתאום ייראו כאילו הן בעתיד (בלתי נראות = אובדן מידע). Postgres מגן על עצמו בהסלמה – ובסוף מסרב לכתיבות:</p>
${PG_WRAP}
<p>מערכת עם הרבה כתיבות ששורפת 5,000 txid בשנייה צורכת 432M XIDs ביום; יש לכם ימים, לא חודשים, אם ה-freeze נתקע. מה תוקע אותו: טרנזקציה ארוכה או prepared transaction שנשכחה, replication slot לא פעיל, <code>hot_standby_feedback</code> מ-replica עם שאילתות ארוכות, או autovacuum שמוגבל מדי בשביל לסיים טבלה של כמה TB.</p>
<blockquote>⚠️ טיפ לפרודקשן: מתריעים על <code>age(datfrozenxid)</code> מעל 40-50% מ-2^31 בערך (הרבה אחרי הטריגר השגרתי של 200M, אבל מוקדם מספיק כדי לפעול ברוגע), ועל גיל הטרנזקציה הכי ישנה ב-<code>pg_stat_activity</code>. אם אתם קרובים לצוק: הורגים את מי שמחזיק את ה-horizon, מוחקים slots מתים, ואז מריצים ידנית <code>VACUUM (FREEZE, VERBOSE)</code> על הטבלאות הכי ישנות – בלי <code>FULL</code>.</blockquote>`
      }
    },
    {
      h: { en: "Connections and pooling (PgBouncer)", he: "Connections ו-pooling (PgBouncer)" },
      body: {
        en: `<p>Each Postgres connection is a forked OS process with its own memory (typically a few MB idle, much more with large <code>work_mem</code> sorts or many cached plans). Thousands of connections cause memory pressure and snapshot/lock-manager contention long before the CPU is busy. With 200 pods x 20-connection app pools you already have 4,000 connections. Throughput usually peaks around a small multiple of CPU cores of <em>active</em> queries.</p>
${PG_POOL}
<table>
<tr><th>pool_mode</th><th>Server conn held for</th><th>Multiplexing</th><th>Caveat</th></tr>
<tr><td>session</td><td>whole client session</td><td>none (just reuse)</td><td>fully compatible</td></tr>
<tr><td>transaction</td><td>one transaction</td><td>high: 10,000 clients → 40 backends</td><td>no session state (SET, advisory locks, LISTEN)</td></tr>
<tr><td>statement</td><td>one statement</td><td>highest</td><td>multi-statement transactions forbidden</td></tr>
</table>
<p>Managed alternatives: RDS Proxy, Azure Flexible Server's built-in PgBouncer, and Cloud SQL's managed connection pooling; also PgCat/Odyssey/Supavisor for sharding-aware or multi-tenant pooling. Run PgBouncer close to the app (sidecar or per-node) or as a central HA tier behind a Service — the central tier is easier to cap globally.</p>`,
        he: `<p>כל connection ל-Postgres הוא תהליך OS שעבר fork עם זיכרון משלו (בדרך כלל כמה MB כשהוא idle, והרבה יותר עם sorts גדולים של <code>work_mem</code> או הרבה plans ב-cache). אלפי connections גורמים ל-memory pressure ולתחרות ב-snapshot וב-lock manager הרבה לפני שה-CPU עסוק. עם 200 pods כפול pool של 20 connections באפליקציה כבר יש 4,000 connections. ה-throughput בדרך כלל מגיע לשיא סביב כפולה קטנה של מספר ה-cores בשאילתות <em>פעילות</em>.</p>
${PG_POOL}
<table>
<tr><th>pool_mode</th><th>ה-connection לשרת מוחזק למשך</th><th>Multiplexing</th><th>הסתייגות</th></tr>
<tr><td>session</td><td>כל ה-session של ה-client</td><td>אין (רק reuse)</td><td>תואם לחלוטין</td></tr>
<tr><td>transaction</td><td>טרנזקציה אחת</td><td>גבוה: 10,000 clients → 40 backends</td><td>בלי session state (SET, advisory locks, LISTEN)</td></tr>
<tr><td>statement</td><td>statement אחד</td><td>הכי גבוה</td><td>טרנזקציות עם כמה statements אסורות</td></tr>
</table>
<p>חלופות מנוהלות: RDS Proxy, ה-PgBouncer המובנה ב-Azure Flexible Server, ו-managed connection pooling של Cloud SQL; וגם PgCat/Odyssey/Supavisor ל-pooling שמודע ל-sharding או multi-tenant. מריצים PgBouncer קרוב לאפליקציה (sidecar או לכל node) או כשכבה מרכזית ב-HA מאחורי Service – בשכבה מרכזית קל יותר להגביל גלובלית.</p>`
      }
    },
    {
      h: { en: "Replicas, replication lag and lock contention", he: "Replicas, replication lag ותחרות על locks" },
      body: {
        en: `<p>Streaming replicas apply WAL asynchronously by default, so reads from replicas are <strong>eventually consistent</strong>: a user who just saved a profile and reads from a replica may see the old one. Patterns: route read-your-writes to the primary for N seconds after a write, or wait for the replica to pass the write's LSN (<code>pg_last_wal_replay_lsn()</code> &gt;= the commit LSN).</p>
${PG_REPL}
<p>Replica queries conflict with WAL replay (vacuum removed rows the query needs). After <code>max_standby_streaming_delay</code> (default 30s) Postgres cancels the query: <em>"canceling statement due to conflict with recovery"</em>. <code>hot_standby_feedback=on</code> stops the cancellations but makes the replica's long queries hold back vacuum on the primary — bloat moves to the primary. Separate OLTP replicas from analytics replicas (or use logical replication / CDC into a warehouse).</p>
<p><strong>Locks</strong> are where "it was a 50ms migration" becomes a 20-minute outage — the lock queue is FIFO:</p>
${PG_LOCKS}
<p>And always read the plan with real numbers, not guesses:</p>
${PG_EXPLAIN}`,
        he: `<p>Replicas של streaming מחילים WAL באופן אסינכרוני כברירת מחדל, כך שקריאות מ-replicas הן <strong>eventually consistent</strong>: משתמש ששמר עכשיו פרופיל וקורא מ-replica עלול לראות את הישן. דפוסים: לנתב read-your-writes ל-primary למשך N שניות אחרי כתיבה, או לחכות שה-replica יעבור את ה-LSN של הכתיבה (<code>pg_last_wal_replay_lsn()</code> &gt;= ה-LSN של ה-commit).</p>
${PG_REPL}
<p>שאילתות על replica מתנגשות עם החלת ה-WAL (vacuum מחק שורות שהשאילתה צריכה). אחרי <code>max_standby_streaming_delay</code> (ברירת מחדל 30s) Postgres מבטל את השאילתה: <em>"canceling statement due to conflict with recovery"</em>. <code>hot_standby_feedback=on</code> מפסיק את הביטולים, אבל גורם לשאילתות הארוכות של ה-replica לעכב את ה-vacuum ב-primary – ה-bloat עובר ל-primary. מפרידים replicas של OLTP מ-replicas של אנליטיקה (או משתמשים ב-logical replication / CDC ל-warehouse).</p>
<p><strong>Locks</strong> הם המקום שבו "זו הייתה מיגרציה של 50ms" הופכת ל-outage של 20 דקות – תור ה-locks הוא FIFO:</p>
${PG_LOCKS}
<p>ותמיד קוראים את ה-plan עם מספרים אמיתיים, לא ניחושים:</p>
${PG_EXPLAIN}`
      }
    }
  ],
  diagram: "app pods (10k client conns) -> PgBouncer (txn mode, 40 server conns) -> primary --WAL--> replica-oltp (lag < 1s)\n                                                                          \\--WAL--> replica-analytics (hot_standby_feedback off)\nlong txn / idle-in-txn / stale slot -> holds xmin horizon -> vacuum can't clean -> bloat + XID age grows",
  handsOn: [
    { cmd: "psql -c \"SELECT pid, now()-xact_start AS age, state, left(query,50) FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY age DESC LIMIT 5;\"", what: { en: "Find the oldest open transactions — the usual cause of bloat and stuck freezing.", he: "מוצאים את הטרנזקציות הפתוחות הכי ישנות – הסיבה הרגילה ל-bloat ול-freeze תקוע." } },
    { cmd: "psql -c \"SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;\"", what: { en: "Check XID age per database; graph it and alert well before 1 billion.", he: "בודקים XID age לכל database; מציגים בגרף ומתריעים הרבה לפני מיליארד." } },
    { cmd: "psql -c \"CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\" -c \"SELECT calls, round(mean_exec_time,1) mean_ms, left(query,60) FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;\"", what: { en: "Rank queries by total time — optimise the top 3 before buying a bigger instance.", he: "מדרגים שאילתות לפי זמן כולל – מייעלים את שלוש המובילות לפני שקונים instance גדול יותר." } },
    { cmd: "pgbench -i -s 50 bench && pgbench -c 200 -j 8 -T 60 -p 5432 bench; pgbench -c 200 -j 8 -T 60 -p 6432 bench", what: { en: "Compare TPS with 200 clients direct vs through PgBouncer in transaction mode.", he: "משווים TPS עם 200 clients ישירות מול דרך PgBouncer במצב transaction." } }
  ],
  mnemonic: { en: "The five Postgres fires: Bloat, Wraparound, Connections, Lag, Locks. Almost every one traces back to a long transaction.", he: "חמש השריפות של Postgres: Bloat, Wraparound, Connections, Lag, Locks. כמעט כולן מתחילות מטרנזקציה ארוכה." },
  pitfalls: [
    { en: "Leaving autovacuum defaults on 100M+ row tables: 20% scale factor means tens of millions of dead rows before it even starts, then a slow throttled run.", he: "להשאיר את ברירות המחדל של autovacuum בטבלאות של 100M+ שורות: scale factor של 20% אומר עשרות מיליוני שורות מתות לפני שהוא בכלל מתחיל, ואז ריצה איטית ומוגבלת." },
    { en: "Running DDL without lock_timeout: a blocked ALTER TABLE queues every subsequent query on that table behind it.", he: "להריץ DDL בלי lock_timeout: ALTER TABLE חסום מכניס כל שאילתה שבאה אחריו על הטבלה לתור מאחוריו." },
    { en: "Switching PgBouncer to transaction mode without auditing session state: SET search_path, advisory locks and LISTEN silently misbehave.", he: "להעביר PgBouncer למצב transaction בלי לבדוק session state: SET search_path, advisory locks ו-LISTEN מתנהגים לא נכון בשקט." },
    { en: "Forgotten logical replication slots (old CDC connector): WAL piles up until the primary's disk is full.", he: "Logical replication slots שנשכחו (CDC connector ישן): ה-WAL נערם עד שהדיסק של ה-primary מתמלא." }
  ],
  interview: [
    {
      q: { en: "Disk usage on a 2 TB Postgres primary grows 50 GB/day while row counts are flat. Diagnose.", he: "השימוש בדיסק ב-primary של Postgres בגודל 2TB גדל ב-50GB ביום, בזמן שמספר השורות קבוע. תאבחנו." },
      a: { en: "Flat rows + growing disk = either bloat or retained WAL. Check pg_replication_slots for inactive slots retaining WAL, and pg_wal size. Then dead tuples per table (pg_stat_user_tables) and what holds the xmin horizon: oldest xact_start in pg_stat_activity, idle in transaction sessions, pg_prepared_xacts, backend_xmin of replicas with hot_standby_feedback. Fix the holder first (timeouts, drop slot, cap with max_slot_wal_keep_size), let autovacuum catch up with per-table tuning and more workers/cost limit, then reclaim existing bloat online with pg_repack. Prevent with alerts on oldest transaction age and slot retention.", he: "שורות קבועות + דיסק שגדל = או bloat או WAL שנשמר. בודקים pg_replication_slots ל-slots לא פעילים שמחזיקים WAL, ואת הגודל של pg_wal. אחר כך dead tuples לכל טבלה (pg_stat_user_tables) ומה מחזיק את ה-xmin horizon: ה-xact_start הכי ישן ב-pg_stat_activity, sessions במצב idle in transaction, pg_prepared_xacts, ה-backend_xmin של replicas עם hot_standby_feedback. קודם מתקנים את המחזיק (timeouts, drop ל-slot, הגבלה עם max_slot_wal_keep_size), נותנים ל-autovacuum להדביק את הפער עם כוונון לכל טבלה ועוד workers/cost limit, ואז משחררים את ה-bloat הקיים אונליין עם pg_repack. מונעים עם התראות על גיל הטרנזקציה הכי ישנה ועל WAL שנשמר ב-slots." }
    },
    {
      q: { en: "Your app scales from 50 to 500 pods for a sale. What happens to Postgres and how do you design for it?", he: "האפליקציה עולה מ-50 ל-500 pods בשביל מבצע. מה קורה ל-Postgres ואיך מתכננים לזה?" },
      a: { en: "With per-pod pools of 10, connections go from 500 to 5,000 — beyond max_connections, or under it but with memory pressure and contention that cuts throughput. Design: a pooler tier (PgBouncer transaction mode or RDS Proxy) so client connections are decoupled from server connections sized to cores; small per-pod pools; HPA max tied to DB capacity, not just CPU; offload reads to replicas with read-your-writes handling; cache hot reads; and load test the sale with realistic connection counts. Also set statement_timeout and pool acquire timeouts so overload fails fast instead of queuing forever.", he: "עם pool של 10 לכל pod, ה-connections עולים מ-500 ל-5,000 – מעבר ל-max_connections, או מתחת אבל עם memory pressure ותחרות שמורידים את ה-throughput. תכנון: שכבת pooler (PgBouncer במצב transaction או RDS Proxy) כך ש-connections של clients מנותקים מ-connections לשרת שמוגדרים לפי מספר ה-cores; pools קטנים לכל pod; ה-max של HPA קשור לקיבולת ה-DB, לא רק ל-CPU; העברת קריאות ל-replicas עם טיפול ב-read-your-writes; cache לקריאות חמות; ו-load test למבצע עם מספרי connections מציאותיים. וגם statement_timeout ו-timeouts לקבלת connection מה-pool, כך שעומס יתר נכשל מהר במקום לחכות בתור לנצח." }
    },
    {
      q: { en: "When would you choose partitioning, and what does it cost?", he: "מתי הייתם בוחרים ב-partitioning, ומה זה עולה?" },
      a: { en: "For very large, time-series-like tables (events, audit logs) where most queries filter by the partition key and retention is by age: dropping a monthly partition is instant and creates no bloat, vacuum and index maintenance work per partition, and partition pruning skips irrelevant data. Costs: queries without the partition key scan all partitions; unique constraints must include the partition key; too many partitions (thousands) slow planning; and you need automation (pg_partman) to create future partitions. It's not a substitute for indexes, and it doesn't scale writes beyond one node — that's sharding (Citus, app-level).", he: "לטבלאות גדולות מאוד בסגנון time-series (events, audit logs) שבהן רוב השאילתות מסננות לפי מפתח ה-partition וה-retention הוא לפי גיל: drop ל-partition חודשי הוא מיידי ולא יוצר bloat, עבודת vacuum ותחזוקת אינדקסים היא לכל partition, ו-partition pruning מדלג על מידע לא רלוונטי. עלויות: שאילתות בלי מפתח ה-partition סורקות את כל ה-partitions; unique constraints חייבים לכלול את מפתח ה-partition; יותר מדי partitions (אלפים) מאטים את ה-planning; וצריך אוטומציה (pg_partman) ליצירת partitions עתידיים. זה לא תחליף לאינדקסים, וזה לא מגדיל כתיבות מעבר ל-node אחד – בשביל זה יש sharding (Citus, ברמת האפליקציה)." }
    }
  ],
  quiz: [
    {
      q: { en: "Why can a single 'idle in transaction' session cause table bloat across the database?", he: "למה session אחד במצב 'idle in transaction' יכול לגרום ל-bloat בטבלאות בכל ה-database?" },
      options: [
        { en: "It holds an AccessExclusive lock", he: "הוא מחזיק lock מסוג AccessExclusive" },
        { en: "It pins the xmin horizon, so vacuum can't remove tuples that died after its snapshot", he: "הוא מקבע את ה-xmin horizon, כך ש-vacuum לא יכול להסיר tuples שמתו אחרי ה-snapshot שלו" },
        { en: "It consumes all connections", he: "הוא צורך את כל ה-connections" },
        { en: "It disables autovacuum", he: "הוא מכבה את autovacuum" }
      ], answer: 1,
      explain: { en: "Dead tuples are removable only if no running snapshot could see them. The oldest snapshot defines the horizon for every table.", he: "Dead tuples ניתנים להסרה רק אם אף snapshot רץ לא יכול לראות אותם. ה-snapshot הכי ישן מגדיר את ה-horizon לכל הטבלאות." }
    },
    {
      q: { en: "What happens when a database gets within a few million XIDs of wraparound?", he: "מה קורה כש-database מגיע למרחק של כמה מיליוני XIDs מ-wraparound?" },
      options: [
        { en: "Postgres silently wraps around and old rows disappear", he: "Postgres עושה wraparound בשקט ושורות ישנות נעלמות" },
        { en: "It stops assigning new transaction IDs: writes fail until vacuum freezes old rows", he: "הוא מפסיק להקצות transaction IDs חדשים: כתיבות נכשלות עד ש-vacuum עושה freeze לשורות ישנות" },
        { en: "It switches to 64-bit XIDs automatically", he: "הוא עובר אוטומטית ל-XIDs של 64-bit" },
        { en: "Replicas take over", he: "ה-replicas משתלטים" }
      ], answer: 1,
      explain: { en: "To protect data, Postgres refuses new XIDs near the limit. Recovery means a (possibly long) manual VACUUM of the oldest tables.", he: "כדי להגן על המידע, Postgres מסרב ל-XIDs חדשים ליד הגבול. ההתאוששות היא VACUUM ידני (שעלול להיות ארוך) לטבלאות הכי ישנות." }
    },
    {
      q: { en: "Which feature breaks under PgBouncer transaction pooling?", he: "איזה פיצ'ר נשבר תחת PgBouncer במצב transaction pooling?" },
      options: [
        { en: "Multi-statement transactions", he: "טרנזקציות עם כמה statements" },
        { en: "Session-level SET and pg_advisory_lock", he: "SET ברמת session ו-pg_advisory_lock" },
        { en: "SELECT queries", he: "שאילתות SELECT" },
        { en: "COMMIT", he: "COMMIT" }
      ], answer: 1,
      explain: { en: "Your next transaction may run on a different server connection, so session state disappears. Use SET LOCAL, role/database defaults and transaction-level advisory locks.", he: "הטרנזקציה הבאה שלכם עשויה לרוץ על connection אחר לשרת, כך ש-session state נעלם. משתמשים ב-SET LOCAL, ברירות מחדל לפי role/database ו-advisory locks ברמת טרנזקציה." }
    },
    {
      q: { en: "An ALTER TABLE ADD COLUMN (metadata-only) caused a 10-minute outage. Most likely cause?", he: "ALTER TABLE ADD COLUMN (שינוי metadata בלבד) גרם ל-outage של 10 דקות. מה הסיבה הסבירה ביותר?" },
      options: [
        { en: "It rewrote the whole table", he: "הוא כתב מחדש את כל הטבלה" },
        { en: "It waited for AccessExclusiveLock behind a long query, and all later queries queued behind it", he: "הוא חיכה ל-AccessExclusiveLock מאחורי שאילתה ארוכה, וכל השאילתות שאחריו נכנסו לתור מאחוריו" },
        { en: "Autovacuum was running", he: "Autovacuum רץ" },
        { en: "The replica lagged", he: "ה-replica פיגר" }
      ], answer: 1,
      explain: { en: "Lock requests queue FIFO. Use lock_timeout (a few seconds) and retry, so the DDL gives up instead of blocking the table.", he: "בקשות lock נכנסות לתור FIFO. משתמשים ב-lock_timeout (כמה שניות) ו-retry, כך שה-DDL מוותר במקום לחסום את הטבלה." }
    }
  ],
  related: ["db-operations", "db-replication", "db-indexes", "db-transactions", "staff-zero-downtime-migrations"]
});
}

// ---------------------------------------------------------------------------
// 16. Zero-downtime migrations
// ---------------------------------------------------------------------------
{
const ZD_PHASES = `<pre>Rename users.fullname -&gt; users.display_name, zero downtime:

 phase  schema                         app version                     reversible?
 1 EXPAND   ADD COLUMN display_name    v1 (ignores it)                 yes (drop column)
 2 DUAL     -                          v2 writes BOTH, reads fullname  yes (deploy v1)
 3 BACKFILL batch copy old -&gt; new      v2                              yes
 4 SWITCH   -                          v3 reads display_name (flag),   yes (flip flag back;
                                          still writes both            both columns current)
 5 STOP     -                          v4 writes only display_name     harder: fullname goes stale
 6 CONTRACT DROP COLUMN fullname       v4                              no (restore from backup)
        ^ days/weeks later, after v1-v3 can no longer be deployed anywhere</pre>`;

const ZD_PG = `<pre>-- Every DDL session in a migration tool should start with:
SET lock_timeout = '3s';            -- fail fast instead of queueing the table (retry with backoff)
SET statement_timeout = '0';        -- (only for long CONCURRENTLY/VALIDATE steps)

-- SAFE (metadata-only in PG11+): nullable column, or constant/non-volatile default
ALTER TABLE users ADD COLUMN display_name text;
ALTER TABLE users ADD COLUMN tier text NOT NULL DEFAULT 'free';

-- UNSAFE: full table rewrite + AccessExclusive for the duration
ALTER TABLE users ALTER COLUMN id TYPE bigint;            -- use new column + backfill + swap
ALTER TABLE users ADD COLUMN token uuid DEFAULT gen_random_uuid();  -- volatile default rewrites

-- NOT NULL without a long lock: constraint NOT VALID, validate (weaker lock), then SET NOT NULL
ALTER TABLE users ADD CONSTRAINT display_name_nn CHECK (display_name IS NOT NULL) NOT VALID;
ALTER TABLE users VALIDATE CONSTRAINT display_name_nn;    -- SHARE UPDATE EXCLUSIVE: reads+writes continue
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL; -- PG12+: uses the valid CHECK, no scan
ALTER TABLE users DROP CONSTRAINT display_name_nn;

-- Foreign keys the same way
ALTER TABLE orders ADD CONSTRAINT orders_user_fk FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_user_fk;

-- Indexes: never plain CREATE INDEX on a hot table (blocks writes for the whole build)
CREATE INDEX CONCURRENTLY users_display_name_idx ON users (display_name);
-- cannot run inside a transaction block; takes ~2-3x longer; waits for old txns to finish.
-- On failure it leaves an INVALID index that still costs writes:
SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY users_display_name_idx;   -- then retry
-- Unique constraint without blocking: build unique index concurrently, then attach
ALTER TABLE users ADD CONSTRAINT users_email_uq UNIQUE USING INDEX users_email_uq_idx;</pre>`;

const ZD_BACKFILL = `<pre># Batched, resumable, throttled backfill (keyset pagination, not OFFSET)
last_id=0
while :; do
  last_id=$(psql -Atq -v ON_ERROR_STOP=1 -c "
    WITH batch AS (
      SELECT id FROM users
      WHERE id &gt; $last_id AND display_name IS NULL
      ORDER BY id LIMIT 5000)
    UPDATE users u SET display_name = u.fullname
    FROM batch WHERE u.id = batch.id
    RETURNING u.id" | sort -n | tail -1)
  [ -z "$last_id" ] &amp;&amp; break
  echo "up to id=$last_id"; sleep 0.2      # throttle: watch replica lag + p99 while it runs
done

guard rails while backfilling:
  - batch 1k-10k rows, each its own short transaction (vacuum can keep up, locks are brief)
  - pause automatically if replica lag &gt; 5s or DB CPU &gt; 70%
  - idempotent (WHERE display_name IS NULL), so it can be killed and resumed
  - for 100M+ rows estimate: 5,000 rows / 0.3 s  ~= 60M rows/hour</pre>`;

const ZD_MYSQL = `<pre># MySQL: many ALTERs are INSTANT/INPLACE in 8.0+, check first:
ALTER TABLE users ADD COLUMN display_name VARCHAR(255), ALGORITHM=INSTANT;   -- errors if not possible

# gh-ost: triggerless, copies rows + tails the binlog, cut-over via atomic rename
gh-ost --host=db-replica-1 --database=app --table=users \\
  --alter="MODIFY id BIGINT NOT NULL AUTO_INCREMENT" \\
  --chunk-size=2000 --max-load=Threads_running=25 --critical-load=Threads_running=60 \\
  --max-lag-millis=1500 --postpone-cut-over-flag-file=/tmp/ghost.postpone \\
  --allow-on-master --execute
# throttle/pause/resume live via its unix socket: echo throttle | nc -U /tmp/gh-ost.app.users.sock

# pt-online-schema-change: trigger-based copy, works where binlog access is hard; triggers add write load
pt-online-schema-change --alter "ADD INDEX idx_email (email)" D=app,t=users \\
  --max-load Threads_running=25 --critical-load Threads_running=60 --chunk-size 2000 --execute</pre>`;

const ZD_DUAL = `<pre>// Moving orders from the monolith DB to a new orders-service store
func (r *Repo) SaveOrder(ctx context.Context, o Order) error {
    if err := r.legacy.Save(ctx, o); err != nil {      // source of truth (phase 1-2)
        return err
    }
    if flags.Enabled(ctx, "orders.dual_write") {
        if err := r.next.Save(ctx, o); err != nil {
            metrics.Inc("orders_dual_write_errors")    // never fail the user request here
            outbox.Enqueue(ctx, "orders.resync", o.ID) // repair asynchronously
        }
    }
    return nil
}

func (r *Repo) GetOrder(ctx context.Context, id string) (Order, error) {
    o, err := r.legacy.Get(ctx, id)
    if flags.Enabled(ctx, "orders.shadow_read") {      // sample e.g. 5% of reads
        go func() {
            n, _ := r.next.Get(context.Background(), id)
            if !equal(o, n) { metrics.Inc("orders_shadow_mismatch"); log.Warn("diff", "id", id) }
        }()
    }
    return o, err
}
// Cut over when mismatch rate ~0 for days. Flip "orders.read_from_next" per tenant / percentage.</pre>`;

INFRA.lessons.push({
  id: "staff-zero-downtime-migrations",
  track: "staff",
  order: 16,
  icon: "🔀",
  level: 3,
  minutes: 18,
  title: { en: "Zero-Downtime Schema & Data Migrations", he: "מיגרציות סכמה ונתונים ב-Zero Downtime" },
  tldr: {
    en: "Never make a breaking change in one step. Expand the schema compatibly, make the code tolerate both shapes, backfill in small throttled batches, switch reads behind a flag, and contract only when no running or rollback-able version needs the old shape. Every step must be independently deployable and reversible — and every DDL needs a lock_timeout.",
    he: "אף פעם לא עושים שינוי שובר בצעד אחד. מרחיבים את הסכמה באופן תואם, גורמים לקוד לסבול את שתי הצורות, עושים backfill ב-batches קטנים ומווסתים, מעבירים קריאות מאחורי flag, ומכווצים רק כשאף גרסה שרצה או שאפשר לחזור אליה לא צריכה את הצורה הישנה. כל צעד חייב להיות ניתן ל-deploy ולהחזרה באופן עצמאי – ולכל DDL צריך lock_timeout."
  },
  analogy: {
    en: "Replacing a bridge on a busy highway. You don't close it and rebuild: you build the new bridge next to the old one (expand), open both and split traffic (dual write), move lanes over a few at a time while watching the traffic cameras (backfill + flagged reads), and only demolish the old bridge after weeks of nobody using it (contract). At every stage you can send cars back to the old bridge.",
    he: "החלפת גשר בכביש מהיר עמוס. לא סוגרים ובונים מחדש: בונים את הגשר החדש ליד הישן (expand), פותחים את שניהם ומפצלים תנועה (dual write), מעבירים נתיבים כמה בכל פעם תוך כדי צפייה במצלמות התנועה (backfill + קריאות מאחורי flag), והורסים את הגשר הישן רק אחרי שבועות שאף אחד לא משתמש בו (contract). בכל שלב אפשר להחזיר מכוניות לגשר הישן."
  },
  sections: [
    {
      h: { en: "Why one-step migrations break: rolling deploys and rollbacks", he: "למה מיגרציות בצעד אחד נשברות: rolling deploys ו-rollbacks" },
      body: {
        en: `<p>During a rolling deploy, old and new versions run <em>at the same time</em> against the same database — for minutes, or for days with canaries and multiple regions. And a rollback puts the old code back on the new schema. So every schema state must be compatible with at least two adjacent app versions. Renaming a column in one migration breaks whichever version doesn't know the new name.</p>
${ZD_PHASES}
<p>The <strong>expand/contract</strong> (parallel change) pattern turns one risky change into several boring ones. Rules of thumb:</p>
<ul>
<li>Schema migrations run <em>separately</em> from app deploys (a pipeline step or job before the rollout), and are always backward-compatible with the currently running version.</li>
<li>Additive first: new columns nullable or with constant defaults, new tables, new indexes concurrently.</li>
<li>Destructive last, delayed: drop columns/tables only after the code that used them is gone from every environment and the rollback window has passed. ORMs that <code>SELECT *</code> into strict structs can crash on dropped columns — deploy "stop reading it" before "drop it".</li>
</ul>`,
        he: `<p>במהלך rolling deploy, הגרסה הישנה והחדשה רצות <em>באותו זמן</em> מול אותו database – לכמה דקות, או לכמה ימים עם canaries וכמה regions. ו-rollback מחזיר את הקוד הישן על הסכמה החדשה. אז כל מצב סכמה חייב להיות תואם לפחות לשתי גרסאות אפליקציה צמודות. שינוי שם של עמודה במיגרציה אחת שובר את הגרסה שלא מכירה את השם החדש.</p>
${ZD_PHASES}
<p>התבנית של <strong>expand/contract</strong> (parallel change) הופכת שינוי מסוכן אחד לכמה שינויים משעממים. כללי אצבע:</p>
<ul>
<li>מיגרציות סכמה רצות <em>בנפרד</em> מ-deploy של האפליקציה (צעד ב-pipeline או job לפני ה-rollout), ותמיד תואמות לאחור לגרסה שרצה כרגע.</li>
<li>קודם תוספות: עמודות חדשות nullable או עם default קבוע, טבלאות חדשות, אינדקסים חדשים ב-CONCURRENTLY.</li>
<li>הרסני אחרון, ובאיחור: מוחקים עמודות/טבלאות רק אחרי שהקוד שהשתמש בהן נעלם מכל הסביבות וחלון ה-rollback עבר. ORMs שעושים <code>SELECT *</code> לתוך structs קשיחים יכולים לקרוס על עמודות שנמחקו – עושים deploy של "להפסיק לקרוא" לפני "למחוק".</li>
</ul>`
      }
    },
    {
      h: { en: "Safe DDL in PostgreSQL", he: "DDL בטוח ב-PostgreSQL" },
      body: {
        en: `<p>The danger in DDL is rarely the work itself — it's the lock. Most <code>ALTER TABLE</code> forms take <strong>AccessExclusiveLock</strong>, which conflicts even with SELECT, and the lock queue is FIFO: one blocked ALTER freezes the table for everyone behind it.</p>
${ZD_PG}
<p>Linters catch these before review: <strong>squawk</strong> for raw SQL migrations, <code>strong_migrations</code> (Rails), <code>django-pg-zero-downtime-migrations</code>, Atlas lint. Make them a required CI check — humans don't reliably remember which ALTER forms rewrite the table.</p>
<blockquote>⚠️ Production tip: test migrations against a production-sized copy (restore of a snapshot) and time them. "It took 40ms in staging" means nothing when staging has 10,000 rows and prod has 400 million.</blockquote>`,
        he: `<p>הסכנה ב-DDL היא כמעט אף פעם לא העבודה עצמה – היא ה-lock. רוב הצורות של <code>ALTER TABLE</code> לוקחות <strong>AccessExclusiveLock</strong>, שמתנגש אפילו עם SELECT, ותור ה-locks הוא FIFO: ALTER חסום אחד מקפיא את הטבלה לכל מי שמאחוריו.</p>
${ZD_PG}
<p>Linters תופסים את אלה לפני ה-review: <strong>squawk</strong> למיגרציות SQL גולמיות, <code>strong_migrations</code> (Rails), <code>django-pg-zero-downtime-migrations</code>, Atlas lint. הופכים אותם ל-check חובה ב-CI – בני אדם לא זוכרים באופן אמין אילו צורות ALTER כותבות את הטבלה מחדש.</p>
<blockquote>⚠️ טיפ לפרודקשן: בודקים מיגרציות מול עותק בגודל פרודקשן (שחזור של snapshot) ומודדים זמן. "זה לקח 40ms ב-staging" לא אומר כלום כשב-staging יש 10,000 שורות ובפרודקשן 400 מיליון.</blockquote>`
      }
    },
    {
      h: { en: "Backfills and online schema change tools", he: "Backfills וכלי online schema change" },
      body: {
        en: `<p>One giant <code>UPDATE users SET display_name = fullname</code> on 200M rows is a single multi-hour transaction: it holds row locks, generates a WAL tsunami that lags every replica, doubles the table size in dead tuples and pins the vacuum horizon. Backfill in small, idempotent, throttled batches:</p>
${ZD_BACKFILL}
<p>On MySQL, where many DDLs historically copied the table, use the online schema change tools (or check if INSTANT applies first):</p>
${ZD_MYSQL}
<p>gh-ost is generally preferred at scale because it avoids triggers and can be throttled, paused and postponed at cut-over; pt-osc is simpler and works where you can't read the binlog. Both need extra disk for the full shadow copy of the table.</p>`,
        he: `<p><code>UPDATE users SET display_name = fullname</code> ענק אחד על 200M שורות הוא טרנזקציה אחת של כמה שעות: היא מחזיקה row locks, מייצרת צונאמי של WAL שגורם לפיגור בכל replica, מכפילה את גודל הטבלה ב-dead tuples ומקבעת את ה-horizon של vacuum. עושים backfill ב-batches קטנים, idempotent ומווסתים:</p>
${ZD_BACKFILL}
<p>ב-MySQL, שבו הרבה DDLs היסטורית העתיקו את הטבלה, משתמשים בכלי online schema change (או בודקים קודם אם INSTANT רלוונטי):</p>
${ZD_MYSQL}
<p>בקנה מידה גדול בדרך כלל מעדיפים gh-ost כי הוא נמנע מ-triggers ואפשר לווסת, לעצור ולדחות אותו בשלב ה-cut-over; pt-osc פשוט יותר ועובד איפה שאי אפשר לקרוא את ה-binlog. שניהם צריכים דיסק נוסף לעותק הצל המלא של הטבלה.</p>`
      }
    },
    {
      h: { en: "Data store moves: dual writes, shadow reads, flags and rollback plans", he: "העברת data store: dual writes, shadow reads, flags ותוכניות rollback" },
      body: {
        en: `<p>Moving data between systems (monolith DB → service DB, MySQL → Postgres, self-hosted → managed) follows the same expand/contract arc, with verification in the middle:</p>
${ZD_DUAL}
<ul>
<li><strong>Dual writes</strong> in application code are not atomic across two stores — one write can succeed and the other fail. Treat the new store as a follower: repair through an outbox/queue, or better, use <strong>CDC</strong> (Debezium reading the WAL/binlog) to stream changes, which gives ordering and doesn't depend on every code path remembering to dual-write.</li>
<li><strong>Shadow reads</strong> compare results without serving them; a mismatch rate dashboard is your go/no-go signal.</li>
<li><strong>Feature flags</strong> make the cut-over gradual (1% of tenants → 10% → 100%) and the rollback a config change instead of a deploy.</li>
<li><strong>Rollback plan</strong>, written before you start: for each phase, how to go back, how long it takes, and the point of no return. Keep reverse sync (new → old) running for a while after cut-over so rollback doesn't lose writes made on the new store.</li>
</ul>
<blockquote>💡 Real world: the riskiest moment is the step you can't undo — dropping the old column or stopping reverse sync. Put it on the calendar weeks later, behind a checklist: no reads of the old path in metrics for 14 days, backups verified, owner sign-off.</blockquote>`,
        he: `<p>העברת מידע בין מערכות (DB של המונוליט → DB של שירות, MySQL → Postgres, self-hosted → מנוהל) הולכת באותה קשת של expand/contract, עם אימות באמצע:</p>
${ZD_DUAL}
<ul>
<li><strong>Dual writes</strong> בקוד האפליקציה אינם אטומיים בין שני stores – כתיבה אחת יכולה להצליח והשנייה להיכשל. מתייחסים ל-store החדש כ-follower: מתקנים דרך outbox/תור, או עדיף, משתמשים ב-<strong>CDC</strong> (Debezium שקורא את ה-WAL/binlog) כדי להזרים שינויים, מה שנותן סדר ולא תלוי בזה שכל נתיב קוד יזכור לעשות dual write.</li>
<li><strong>Shadow reads</strong> משווים תוצאות בלי להגיש אותן; dashboard של שיעור mismatch הוא אות ה-go/no-go שלכם.</li>
<li><strong>Feature flags</strong> הופכים את ה-cut-over להדרגתי (1% מה-tenants → 10% → 100%) ואת ה-rollback לשינוי קונפיג במקום deploy.</li>
<li><strong>תוכנית rollback</strong>, כתובה לפני שמתחילים: לכל שלב, איך חוזרים, כמה זמן זה לוקח, ומהי נקודת האל-חזור. משאירים reverse sync (חדש → ישן) רץ לזמן מה אחרי ה-cut-over, כדי ש-rollback לא יאבד כתיבות שנעשו ב-store החדש.</li>
</ul>
<blockquote>💡 מהשטח: הרגע הכי מסוכן הוא הצעד שאי אפשר לבטל – מחיקת העמודה הישנה או עצירת ה-reverse sync. שמים אותו ביומן כמה שבועות אחר כך, מאחורי checklist: אין קריאות לנתיב הישן במטריקות כבר 14 יום, גיבויים אומתו, ה-owner חתם.</blockquote>`
      }
    }
  ],
  diagram: "expand (add col/table, CONCURRENTLY) -> dual write (old=truth) -> backfill (batches, throttled) -> shadow read (diff=0?)\n  -> flip read flag 1%..100% -> stop old writes -> [wait rollback window] -> contract (drop)\n  every arrow: deployable alone, reversible until the last one",
  handsOn: [
    { cmd: "psql -c \"SET lock_timeout='3s'; ALTER TABLE users ADD COLUMN display_name text;\"", what: { en: "Run a metadata-only DDL safely: if a long query holds the table, it fails in 3s instead of freezing traffic.", he: "מריצים DDL של metadata בלבד בבטחה: אם שאילתה ארוכה מחזיקה את הטבלה, הוא נכשל תוך 3 שניות במקום להקפיא תעבורה." } },
    { cmd: "psql -c \"CREATE INDEX CONCURRENTLY idx_users_dn ON users(display_name);\" && psql -c \"SELECT indexrelid::regclass, indisvalid FROM pg_index WHERE NOT indisvalid;\"", what: { en: "Build an index without blocking writes, then confirm no INVALID leftovers.", he: "בונים אינדקס בלי לחסום כתיבות, ואז מוודאים שלא נשארו שאריות INVALID." } },
    { cmd: "squawk migrations/*.sql", what: { en: "Lint SQL migrations for table rewrites, missing CONCURRENTLY and unsafe NOT NULL changes.", he: "עושים lint למיגרציות SQL על כתיבה מחדש של טבלאות, CONCURRENTLY חסר ושינויי NOT NULL לא בטוחים." } },
    { cmd: "psql -c \"SELECT pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) FROM pg_stat_replication;\"", what: { en: "Watch replica lag while a backfill runs; pause the backfill when it climbs.", he: "צופים ב-replica lag בזמן שה-backfill רץ; עוצרים את ה-backfill כשהוא מטפס." } }
  ],
  mnemonic: { en: "Expand, Migrate, Contract — and 'add fast, drop slow'. No DDL without lock_timeout.", he: "Expand, Migrate, Contract – ו-'להוסיף מהר, למחוק לאט'. אין DDL בלי lock_timeout." },
  pitfalls: [
    { en: "Running migrations inside the app's startup (every pod races to migrate): use one job/pipeline step, with a lock, before the rollout.", he: "להריץ מיגרציות בעליית האפליקציה (כל pod מתחרה על המיגרציה): משתמשים ב-job/צעד pipeline אחד, עם lock, לפני ה-rollout." },
    { en: "Plain CREATE INDEX on a hot table: it blocks writes for the whole build — minutes to hours.", he: "CREATE INDEX רגיל על טבלה חמה: הוא חוסם כתיבות לכל זמן הבנייה – דקות עד שעות." },
    { en: "Dropping a column in the same release that stops using it: the still-running old pods (and any rollback) crash.", he: "למחוק עמודה באותו release שמפסיק להשתמש בה: ה-pods הישנים שעדיין רצים (וכל rollback) קורסים." },
    { en: "One-shot backfill UPDATE of millions of rows: replica lag, WAL explosion, bloat and a horizon that blocks vacuum.", he: "UPDATE חד-פעמי של backfill על מיליוני שורות: replica lag, פיצוץ של WAL, bloat ו-horizon שחוסם את vacuum." }
  ],
  interview: [
    {
      q: { en: "Change orders.id from int to bigint on a 1.5-billion-row Postgres table that's at 75% of int max, with no downtime.", he: "לשנות את orders.id מ-int ל-bigint בטבלת Postgres של 1.5 מיליארד שורות שנמצאת ב-75% מהמקסימום של int, בלי downtime." },
      a: { en: "ALTER COLUMN TYPE rewrites the table under AccessExclusive — hours of outage — so: add id_new bigint (nullable, instant); a trigger copies id to id_new on insert/update; backfill existing rows in throttled keyset batches watching replica lag; build a unique index concurrently on id_new; also migrate every FK column referencing it (orders_items.order_id) the same way. Cut-over in one short transaction with lock_timeout: lock table, final sync check, rename columns, swap the sequence ownership and default, attach the PK using the prebuilt index, recreate FKs as NOT VALID then validate. App code must not care about the column type (use int64 already). Practise on a restored copy, have the rollback (rename back) scripted, and calculate runway: at the current insert rate, how many weeks until 2^31 — that sets the urgency.", he: "ALTER COLUMN TYPE כותב את הטבלה מחדש תחת AccessExclusive – שעות של outage – אז: מוסיפים id_new bigint (nullable, מיידי); trigger מעתיק את id ל-id_new ב-insert/update; backfill לשורות קיימות ב-batches של keyset מווסתים תוך מעקב אחרי replica lag; בונים unique index ב-CONCURRENTLY על id_new; וגם מעבירים כל עמודת FK שמפנה אליה (orders_items.order_id) באותה דרך. Cut-over בטרנזקציה קצרה אחת עם lock_timeout: lock על הטבלה, בדיקת סנכרון אחרונה, שינוי שמות עמודות, העברת הבעלות וה-default של ה-sequence, חיבור ה-PK עם האינדקס שנבנה מראש, ויצירת FKs מחדש כ-NOT VALID ואז validate. קוד האפליקציה לא צריך להיות תלוי בסוג העמודה (כבר להשתמש ב-int64). מתרגלים על עותק משוחזר, ה-rollback (rename בחזרה) כתוב כסקריפט, ומחשבים runway: בקצב ה-inserts הנוכחי, כמה שבועות עד 2^31 – זה קובע את הדחיפות." }
    },
    {
      q: { en: "You're moving the orders domain out of a shared monolith database into its own service and store. Outline the migration and the go/no-go criteria.", he: "מוציאים את ה-domain של orders מ-database משותף של מונוליט לשירות ו-store משלו. תארו את המיגרציה ואת קריטריוני ה-go/no-go." },
      a: { en: "First, own the interface: route all orders access in the monolith through one module/API, killing direct joins from other domains (often the longest step). Then stand up the new store, stream changes via CDC (Debezium) from the old tables so the new store is a continuously updated follower, and backfill history. Enable shadow reads from the new service and track mismatch rate and latency. Flip reads by tenant percentage behind a flag; then flip writes so the new service is the source of truth, with reverse CDC back to the old tables for rollback and for remaining legacy readers. Go/no-go per step: mismatch rate under an agreed threshold (ideally zero unexplained) for N days, p99 within SLO, error budget healthy, rollback rehearsed. Only after legacy readers are gone and the window passes: stop reverse sync and drop old tables.", he: "קודם משתלטים על הממשק: מנתבים כל גישה ל-orders במונוליט דרך מודול/API אחד, והורגים joins ישירים מ-domains אחרים (לרוב השלב הכי ארוך). אחר כך מקימים את ה-store החדש, מזרימים שינויים דרך CDC (Debezium) מהטבלאות הישנות כך שה-store החדש הוא follower שמתעדכן כל הזמן, ועושים backfill להיסטוריה. מפעילים shadow reads מהשירות החדש ועוקבים אחרי שיעור mismatch ו-latency. מעבירים קריאות לפי אחוז tenants מאחורי flag; אחר כך מעבירים כתיבות כך שהשירות החדש הוא מקור האמת, עם reverse CDC חזרה לטבלאות הישנות בשביל rollback ובשביל קוראי legacy שנשארו. Go/no-go לכל שלב: שיעור mismatch מתחת לסף מוסכם (באידיאל אפס בלי הסבר) במשך N ימים, p99 בתוך ה-SLO, error budget בריא, rollback שתורגל. רק אחרי שקוראי ה-legacy נעלמו והחלון עבר: עוצרים את ה-reverse sync ומוחקים את הטבלאות הישנות." }
    },
    {
      q: { en: "Should schema migrations run automatically on deploy?", he: "האם מיגרציות סכמה צריכות לרוץ אוטומטית ב-deploy?" },
      a: { en: "Additive, linted, backward-compatible migrations: yes, automatically, as a separate pipeline step (or Kubernetes Job / Argo CD PreSync hook) before the app rollout, with one runner holding a migration lock and lock_timeout set. That keeps environments consistent and avoids human error. Destructive or long-running changes (drops, type changes, large backfills, gh-ost runs) should be explicit, scheduled operations with a human owner, monitoring and a rollback plan — not something that happens as a side effect of merging a PR. Enforce the split with a migration linter that fails CI on destructive operations unless an explicit annotation and approval exist.", he: "מיגרציות שהן תוספות, עברו lint ותואמות לאחור: כן, אוטומטית, כצעד נפרד ב-pipeline (או Kubernetes Job / PreSync hook של Argo CD) לפני ה-rollout של האפליקציה, עם runner אחד שמחזיק migration lock ו-lock_timeout מוגדר. זה שומר על סביבות עקביות ומונע טעויות אנוש. שינויים הרסניים או ארוכים (drops, שינויי סוג, backfills גדולים, ריצות gh-ost) צריכים להיות פעולות מפורשות ומתוזמנות עם owner אנושי, ניטור ותוכנית rollback – לא משהו שקורה כתופעת לוואי של merge ל-PR. אוכפים את ההפרדה עם migration linter שמכשיל CI על פעולות הרסניות אלא אם יש annotation ואישור מפורשים." }
    }
  ],
  quiz: [
    {
      q: { en: "In expand/contract, when is it safe to drop the old column?", he: "ב-expand/contract, מתי בטוח למחוק את העמודה הישנה?" },
      options: [
        { en: "In the same release that adds the new column", he: "באותו release שמוסיף את העמודה החדשה" },
        { en: "As soon as the backfill finishes", he: "ברגע שה-backfill מסתיים" },
        { en: "After no running or rollback-able app version reads or writes it", he: "אחרי שאף גרסת אפליקציה שרצה או שאפשר לחזור אליה לא קוראת או כותבת אותה" },
        { en: "Never, columns are cheap", he: "אף פעם, עמודות זולות" }
      ], answer: 2,
      explain: { en: "Contract is last and delayed: old pods during a rolling deploy and rollbacks must still work.", he: "ה-contract הוא אחרון ובאיחור: pods ישנים בזמן rolling deploy ו-rollbacks חייבים להמשיך לעבוד." }
    },
    {
      q: { en: "Which statement is true about CREATE INDEX CONCURRENTLY in Postgres?", he: "איזו טענה נכונה לגבי CREATE INDEX CONCURRENTLY ב-Postgres?" },
      options: [
        { en: "It's faster than a normal CREATE INDEX", he: "הוא מהיר יותר מ-CREATE INDEX רגיל" },
        { en: "It can run inside a transaction with other DDL", he: "אפשר להריץ אותו בתוך טרנזקציה עם DDL אחר" },
        { en: "It doesn't block writes, but if it fails it leaves an INVALID index you must drop", he: "הוא לא חוסם כתיבות, אבל אם הוא נכשל הוא משאיר אינדקס INVALID שצריך למחוק" },
        { en: "It requires an AccessExclusive lock for its duration", he: "הוא דורש lock מסוג AccessExclusive לכל משך הריצה" }
      ], answer: 2,
      explain: { en: "CONCURRENTLY is slower, can't run in a transaction block, avoids blocking writes, and leaves an invalid index on failure.", he: "CONCURRENTLY איטי יותר, לא יכול לרוץ בתוך transaction block, נמנע מחסימת כתיבות, ומשאיר אינדקס invalid כשהוא נכשל." }
    },
    {
      q: { en: "How do you add NOT NULL to a large existing column with minimal locking (PG12+)?", he: "איך מוסיפים NOT NULL לעמודה קיימת גדולה עם מינימום locking (PG12+)?" },
      options: [
        { en: "ALTER COLUMN SET NOT NULL directly", he: "ALTER COLUMN SET NOT NULL ישירות" },
        { en: "Add CHECK (col IS NOT NULL) NOT VALID, VALIDATE it, then SET NOT NULL (uses the constraint, no full scan)", he: "להוסיף CHECK (col IS NOT NULL) NOT VALID, לעשות לו VALIDATE, ואז SET NOT NULL (משתמש ב-constraint, בלי סריקה מלאה)" },
        { en: "VACUUM FULL first", he: "קודם VACUUM FULL" },
        { en: "Recreate the table", he: "ליצור את הטבלה מחדש" }
      ], answer: 1,
      explain: { en: "VALIDATE takes a weaker lock that allows reads and writes; SET NOT NULL then skips the scan because a valid CHECK proves it.", he: "VALIDATE לוקח lock חלש יותר שמאפשר קריאות וכתיבות; SET NOT NULL אחר כך מדלג על הסריקה כי CHECK תקף מוכיח את זה." }
    },
    {
      q: { en: "Why is CDC often preferred over application-level dual writes when moving data to a new store?", he: "למה CDC מועדף לעיתים קרובות על פני dual writes ברמת האפליקציה בהעברת מידע ל-store חדש?" },
      options: [
        { en: "CDC is always cheaper", he: "CDC תמיד זול יותר" },
        { en: "It captures every committed change in order from the log, without relying on every code path to dual-write", he: "הוא תופס כל שינוי שעבר commit לפי הסדר מתוך ה-log, בלי להסתמך על כך שכל נתיב קוד יעשה dual write" },
        { en: "It makes writes atomic across both stores synchronously", he: "הוא הופך כתיבות לאטומיות בין שני ה-stores באופן סינכרוני" },
        { en: "It removes the need for backfill", he: "הוא מבטל את הצורך ב-backfill" }
      ], answer: 1,
      explain: { en: "Dual writes can partially fail and miss code paths (scripts, admin tools). CDC reads the WAL/binlog, so ordering and completeness come from the database itself; it's still asynchronous.", he: "Dual writes יכולים להיכשל חלקית ולפספס נתיבי קוד (סקריפטים, כלי admin). CDC קורא את ה-WAL/binlog, כך שהסדר והשלמות מגיעים מה-database עצמו; זה עדיין אסינכרוני." }
    }
  ],
  related: ["db-operations", "db-transactions", "rel-deployments", "k8s-argocd", "staff-postgres-at-scale"]
});
}

// ---------------------------------------------------------------------------
// 17. Terraform at scale
// ---------------------------------------------------------------------------
{
const TF_LAYOUT = `<pre>infra-live/                                   one state per (env x region x component)
  modules/ -&gt; separate repo(s), versioned        e.g. prod/eu-west-1/network/terraform.tfstate
  prod/
    eu-west-1/
      network/      backend.tf  main.tf          VPC, subnets, TGW      changes: rare,  risk: huge
      eks/          ...                          cluster, node pools    changes: monthly
      data/         ...                          RDS, ElastiCache       changes: rare, prevent_destroy
      apps/payments/ ...                         IAM roles, queues      changes: daily, risk: small
  staging/ ...

One monolithic state (2,000 resources):        Split states (~50-300 resources each):
  plan: 6-10 min, refresh hits API rate limits   plan: 20-60 s
  one lock: every team waits                     teams work in parallel
  a typo can plan destroy of the VPC             blast radius = one component</pre>`;

const TF_BACKEND = `<pre>terraform {
  required_version = "&gt;= 1.10"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 6.0" }   # lock file pins exact version + hashes
  }
  backend "s3" {
    bucket       = "acme-tfstate-prod"         # versioning ON, SSE-KMS, public access blocked
    key          = "prod/eu-west-1/network/terraform.tfstate"
    region       = "eu-west-1"
    use_lockfile = true                        # S3-native locking (1.10+); DynamoDB locking is deprecated
    encrypt      = true
  }
}

# Read another component's outputs instead of sharing state
data "terraform_remote_state" "network" {
  backend = "s3"
  config  = { bucket = "acme-tfstate-prod", key = "prod/eu-west-1/network/terraform.tfstate", region = "eu-west-1" }
}
# (looser coupling: publish IDs to SSM Parameter Store and read them with a data source)

# Consume modules by immutable version
module "vpc" {
  source  = "app.terraform.io/acme/vpc/aws"     # private registry
  version = "3.4.1"                             # or "~&gt; 3.4" in non-prod
}
module "queue" {
  source = "git::https://github.com/acme/tf-modules.git//sqs?ref=v2.7.0"
}</pre>`;

const TF_REFACTOR = `<pre># Adopt an existing resource (TF 1.5+): plan shows "will be imported", fully reviewable
import {
  to = aws_s3_bucket.logs
  id = "acme-prod-logs"
}
# terraform plan -generate-config-out=generated.tf   # draft HCL for it

# Rename / move into a module without destroy+create
moved {
  from = aws_security_group.web
  to   = module.web.aws_security_group.this
}

# Stop managing without destroying (TF 1.7+)
removed {
  from = aws_db_instance.legacy
  lifecycle { destroy = false }
}

resource "aws_db_instance" "orders" {
  # ...
  lifecycle {
    prevent_destroy = true                   # plan fails if anything would delete it
    ignore_changes  = [engine_version]       # managed by AWS minor auto-upgrades
  }
}</pre>`;

const TF_DRIFT = `<pre># Nightly drift detection per state (CI matrix over all root modules)
terraform plan -refresh-only -detailed-exitcode -lock=false -no-color &gt; drift.txt
# exit 0 = no changes, 1 = error, 2 = drift detected -&gt; open an issue / Slack the owning team

$ terraform plan -refresh-only
  # aws_security_group.web has changed
  ~ resource "aws_security_group" "web" {
      ~ ingress = [
          + { cidr_blocks = ["0.0.0.0/0"], from_port = 22, to_port = 22, protocol = "tcp" },  # clicked in console
        ]
    }</pre>`;

const TF_ATLANTIS = `<pre># atlantis.yaml (repo root)
version: 3
automerge: false
parallel_plan: true
projects:
- name: prod-network
  dir: prod/eu-west-1/network
  workspace: default
  autoplan: { when_modified: ["*.tf", "../../../modules/**/*.tf"], enabled: true }
  apply_requirements: [approved, mergeable, undiverged]
  workflow: prod
workflows:
  prod:
    plan:
      steps:
      - init
      - plan
      - run: terraform show -json $PLANFILE &gt; plan.json
      - run: conftest test --policy /policies plan.json      # OPA on the plan
      - run: checkov -f plan.json --framework terraform_plan --quiet

PR comment flow:
  push      -&gt; Atlantis: autoplan, posts plan output + policy results, holds the project lock
  reviewer  -&gt; approves (CODEOWNERS: network team for prod/*/network)
  author    -&gt; comments "atlantis apply -p prod-network"
  Atlantis  -&gt; applies the SAVED plan, comments result, then the PR is merged</pre>`;

const TF_POLICY = `<pre># policies/terraform.rego (conftest / OPA against terraform show -json)
package main
import rego.v1

deny contains msg if {
  rc := input.resource_changes[_]
  rc.type == "aws_s3_bucket_public_access_block"
  rc.change.after.block_public_acls == false
  msg := sprintf("%s: public ACLs must be blocked", [rc.address])
}

deny contains msg if {
  rc := input.resource_changes[_]
  "delete" in rc.change.actions
  startswith(rc.type, "aws_db_")
  msg := sprintf("%s: deleting a database requires the break-glass workflow", [rc.address])
}

warn contains msg if {
  rc := input.resource_changes[_]
  rc.change.after.tags != null
  not rc.change.after.tags["cost-center"]
  msg := sprintf("%s: missing cost-center tag", [rc.address])
}</pre>`;

INFRA.lessons.push({
  id: "staff-terraform-at-scale",
  track: "staff",
  order: 17,
  icon: "🏗️",
  level: 3,
  minutes: 19,
  title: { en: "Terraform at Scale: State, Modules, Drift, PR Workflows & Policy", he: "Terraform בקנה מידה: State, מודולים, Drift, PR Workflows ו-Policy" },
  tldr: {
    en: "At scale, Terraform problems are organisational: split state by blast radius and change rate, version modules like APIs, run every plan/apply through a PR workflow (Atlantis, HCP Terraform, Spacelift) with policy-as-code on the plan JSON, detect drift nightly, and refactor with import/moved/removed blocks instead of state surgery. OpenTofu is a drop-in-compatible fork worth evaluating.",
    he: "בקנה מידה, הבעיות של Terraform הן ארגוניות: מפצלים state לפי blast radius וקצב שינויים, מנהלים גרסאות למודולים כמו ל-APIs, מעבירים כל plan/apply דרך PR workflow (Atlantis, HCP Terraform, Spacelift) עם policy-as-code על ה-JSON של ה-plan, מזהים drift כל לילה, ועושים refactor עם בלוקים של import/moved/removed במקום ניתוחים ב-state. OpenTofu הוא fork תואם שכדאי לבחון."
  },
  analogy: {
    en: "State files are the land registry of your cloud. One registry book for the whole country means every clerk waits for the same book and one coffee spill ruins everything. Split it per district (component/env) and clerks work in parallel, a spill ruins one district. The PR workflow is the notary: no change to the registry without a signed, reviewed deed (the saved plan), and the zoning laws (policy-as-code) are checked automatically before the stamp.",
    he: "קבצי state הם הטאבו של הענן שלכם. ספר טאבו אחד לכל המדינה אומר שכל פקיד מחכה לאותו ספר, וכוס קפה אחת שנשפכת הורסת הכל. מפצלים לפי מחוז (component/env) והפקידים עובדים במקביל, ונזק הורס מחוז אחד. ה-PR workflow הוא הנוטריון: אין שינוי בטאבו בלי שטר חתום ונבדק (ה-plan השמור), וחוקי התכנון והבנייה (policy-as-code) נבדקים אוטומטית לפני החותמת."
  },
  sections: [
    {
      h: { en: "State layout and blast radius", he: "מבנה ה-state ו-blast radius" },
      body: {
        en: `<p>Every <code>terraform apply</code> can touch anything in its state. So the state boundary <em>is</em> your blast radius, your lock granularity and your plan time. Split along three axes: <strong>environment</strong> (prod never shares state with staging), <strong>region</strong>, and <strong>component by change rate and risk</strong> (network and data change rarely and are catastrophic to break; app resources change daily).</p>
${TF_LAYOUT}
<ul>
<li>Target 50-300 resources per state as a heuristic; a plan over a few minutes kills PR feedback loops and hits provider API rate limits.</li>
<li>Prefer directories per environment over CLI workspaces for prod separation — workspaces share backend config and code, making "oops, wrong workspace" too easy. Workspaces fit identical ephemeral copies (preview envs).</li>
<li>Pass data between states via <code>terraform_remote_state</code> or, with looser coupling, published outputs (SSM parameters, tags + data sources). Every cross-state link is a deploy-order dependency — keep the graph shallow.</li>
<li>Terragrunt (or HCP Terraform Stacks / Terramate) keeps many root modules DRY: shared backend generation, dependency ordering, <code>run --all</code> across components.</li>
</ul>`,
        he: `<p>כל <code>terraform apply</code> יכול לגעת בכל דבר ב-state שלו. אז הגבול של ה-state <em>הוא</em> ה-blast radius שלכם, הרזולוציה של ה-lock וזמן ה-plan. מפצלים לאורך שלושה צירים: <strong>סביבה</strong> (prod אף פעם לא חולק state עם staging), <strong>region</strong>, ו-<strong>רכיב לפי קצב שינוי וסיכון</strong> (רשת ו-data משתנים לעיתים רחוקות וקטסטרופליים כשנשברים; משאבי אפליקציה משתנים כל יום).</p>
${TF_LAYOUT}
<ul>
<li>כהיוריסטיקה, מכוונים ל-50-300 משאבים לכל state; plan של יותר מכמה דקות הורג את לולאת הפידבק ב-PR ונתקע ב-rate limits של ה-API של ה-provider.</li>
<li>להפרדת prod עדיפות תיקיות לכל סביבה על פני CLI workspaces – workspaces חולקים קונפיג backend וקוד, וזה הופך את "אופס, workspace לא נכון" לקל מדי. Workspaces מתאימים לעותקים זהים וזמניים (סביבות preview).</li>
<li>מעבירים מידע בין states דרך <code>terraform_remote_state</code> או, עם צימוד רופף יותר, outputs שמפורסמים (SSM parameters, tags + data sources). כל קישור בין states הוא תלות בסדר ה-deploy – שומרים על גרף רדוד.</li>
<li>Terragrunt (או HCP Terraform Stacks / Terramate) שומר הרבה root modules בלי חזרות: יצירת backend משותפת, סדר תלויות, <code>run --all</code> על פני רכיבים.</li>
</ul>`
      }
    },
    {
      h: { en: "Remote state, locking and module versioning", he: "Remote state, locking וגרסאות למודולים" },
      body: {
        en: `<p>State contains secrets in plain text (DB passwords, generated keys) and is the source of truth for what Terraform owns. Treat it as tier-0 data: encrypted, versioned (to roll back a corrupted state), access limited to the CI identity plus a break-glass role, and locked during writes.</p>
${TF_BACKEND}
<p>Modules are APIs consumed by other teams, so version them that way: semantic versioning, a CHANGELOG, a breaking change = major bump with a <code>moved</code>-block migration path, and automated tests (<code>terraform test</code> with <code>.tftest.hcl</code>, or Terratest) that create real resources in a sandbox account. Prod pins exact versions; Renovate opens PRs to bump them, and the plan in that PR shows the real effect.</p>
<blockquote>⚠️ Production tip: commit <code>.terraform.lock.hcl</code> and include hashes for every platform your CI and engineers use (<code>terraform providers lock -platform=linux_amd64 -platform=darwin_arm64</code>). Unpinned providers are how a Monday-morning plan suddenly wants to replace 40 resources.</blockquote>`,
        he: `<p>ה-state מכיל סודות ב-plain text (סיסמאות DB, מפתחות שנוצרו) והוא מקור האמת למה ש-Terraform מחזיק. מתייחסים אליו כמידע tier-0: מוצפן, עם versioning (כדי לחזור מ-state פגום), גישה מוגבלת לזהות ה-CI ועוד role של break-glass, ונעול בזמן כתיבות.</p>
${TF_BACKEND}
<p>מודולים הם APIs שצוותים אחרים צורכים, אז מנהלים להם גרסאות בהתאם: semantic versioning, CHANGELOG, שינוי שובר = העלאת major עם מסלול מיגרציה של בלוקי <code>moved</code>, וטסטים אוטומטיים (<code>terraform test</code> עם <code>.tftest.hcl</code>, או Terratest) שיוצרים משאבים אמיתיים ב-sandbox account. Prod מצמיד גרסאות מדויקות; Renovate פותח PRs כדי להעלות אותן, וה-plan באותו PR מראה את ההשפעה האמיתית.</p>
<blockquote>⚠️ טיפ לפרודקשן: עושים commit ל-<code>.terraform.lock.hcl</code> וכוללים hashes לכל פלטפורמה שה-CI והמהנדסים משתמשים בה (<code>terraform providers lock -platform=linux_amd64 -platform=darwin_arm64</code>). Providers לא מוצמדים זה איך ש-plan של יום שני בבוקר פתאום רוצה להחליף 40 משאבים.</blockquote>`
      }
    },
    {
      h: { en: "Refactoring safely and detecting drift", he: "Refactor בטוח וזיהוי drift" },
      body: {
        en: `<p>Large codebases need constant refactoring — splitting states, moving resources into modules, adopting click-ops resources. Do it declaratively so it shows up in the plan and gets reviewed, instead of running <code>terraform state mv</code> by hand against prod:</p>
${TF_REFACTOR}
<p>Splitting a monolithic state: in the new root module add <code>import</code> blocks for the resources, and in the old one <code>removed { lifecycle { destroy = false } }</code>; apply new then old; both plans must show zero creates/destroys besides the import/forget.</p>
<p><strong>Drift</strong> — reality changed outside Terraform (console hotfixes, other tools, provider defaults). Detect it continuously, not at the next unrelated PR when someone's plan suddenly wants to revert a hotfix:</p>
${TF_DRIFT}
<p>For each drift, decide: codify it (it was a legit hotfix), revert it (apply), or move ownership (some fields should be <code>ignore_changes</code>, e.g. autoscaling desired counts). Prevent click-ops by making prod console access read-only by default with just-in-time elevation.</p>`,
        he: `<p>קוד בסיס גדול צריך refactor כל הזמן – פיצול states, העברת משאבים למודולים, אימוץ משאבים שנוצרו ב-click-ops. עושים את זה באופן דקלרטיבי כדי שזה יופיע ב-plan ויעבור review, במקום להריץ <code>terraform state mv</code> ידנית מול prod:</p>
${TF_REFACTOR}
<p>פיצול state מונוליטי: ב-root module החדש מוסיפים בלוקי <code>import</code> למשאבים, ובישן <code>removed { lifecycle { destroy = false } }</code>; עושים apply לחדש ואז לישן; שני ה-plans חייבים להראות אפס creates/destroys מלבד ה-import/forget.</p>
<p><strong>Drift</strong> – המציאות השתנתה מחוץ ל-Terraform (hotfixes בקונסול, כלים אחרים, ברירות מחדל של ה-provider). מזהים אותו באופן רציף, לא ב-PR הבא שלא קשור כשה-plan של מישהו פתאום רוצה לבטל hotfix:</p>
${TF_DRIFT}
<p>לכל drift מחליטים: לקודד אותו (זה היה hotfix לגיטימי), לבטל אותו (apply), או להעביר בעלות (חלק מהשדות צריכים להיות <code>ignore_changes</code>, למשל desired count של autoscaling). מונעים click-ops ע״י גישה לקונסול של prod שהיא read-only כברירת מחדל, עם הרשאות מוגברות just-in-time.</p>`
      }
    },
    {
      h: { en: "PR workflows, policy-as-code and OpenTofu", he: "PR workflows, policy-as-code ו-OpenTofu" },
      body: {
        en: `<p>Nobody should run <code>terraform apply</code> from a laptop against prod. A PR-driven workflow gives review of the actual plan, an audit trail, locking per project, and credentials that live only in the runner (via OIDC federation):</p>
${TF_ATLANTIS}
<table>
<tr><th></th><th>Atlantis</th><th>HCP Terraform (ex-Terraform Cloud)</th><th>Spacelift / env0 / Scalr</th></tr>
<tr><td>Model</td><td>Self-hosted, open source, PR comments</td><td>SaaS (or Terraform Enterprise), workspaces, VCS-driven runs</td><td>SaaS, stacks, multi-IaC (TF, OpenTofu, Pulumi, CFN)</td></tr>
<tr><td>Policy</td><td>bring your own (conftest, Checkov) in custom workflow steps</td><td>Sentinel or OPA policy sets, built in</td><td>OPA (Rego) built in at plan/approve/push stages</td></tr>
<tr><td>Trade-off</td><td>cheap, flexible, you run and secure it</td><td>managed, priced per managed resource; Terraform only</td><td>rich features (drift, stack dependencies), vendor cost</td></tr>
</table>
<p><strong>Policy-as-code</strong> runs against the plan JSON, so it judges the <em>change</em>, not just static code: block public buckets, deletes of databases, instance types outside an allow-list, missing tags. Static scanners (Checkov, Trivy config, tfsec rules now in Trivy) catch misconfigurations in HCL earlier, in the developer's PR.</p>
${TF_POLICY}
<p><strong>OpenTofu</strong> forked from Terraform 1.5 after HashiCorp moved Terraform to the BSL in August 2023; it is under the Linux Foundation, MPL-licensed, and largely compatible with Terraform configs and providers. It has added features of its own, such as client-side state encryption, early variable evaluation in backend and module source blocks, and for_each on provider configurations. The two are diverging slowly, so pick one per codebase. Reasons to switch: licensing/vendor-neutrality requirements, or wanting those features; reasons to wait: reliance on HCP Terraform features or newer Terraform-only language features.</p>`,
        he: `<p>אף אחד לא אמור להריץ <code>terraform apply</code> מהלפטופ מול prod. Workflow מבוסס PR נותן review ל-plan האמיתי, audit trail, locking לכל project, ו-credentials שחיים רק ב-runner (דרך OIDC federation):</p>
${TF_ATLANTIS}
<table>
<tr><th></th><th>Atlantis</th><th>HCP Terraform (לשעבר Terraform Cloud)</th><th>Spacelift / env0 / Scalr</th></tr>
<tr><td>מודל</td><td>Self-hosted, קוד פתוח, תגובות ב-PR</td><td>SaaS (או Terraform Enterprise), workspaces, ריצות מבוססות VCS</td><td>SaaS, stacks, multi-IaC (TF, OpenTofu, Pulumi, CFN)</td></tr>
<tr><td>Policy</td><td>מביאים לבד (conftest, Checkov) בצעדי workflow מותאמים</td><td>Sentinel או OPA policy sets, מובנה</td><td>OPA (Rego) מובנה בשלבי plan/approve/push</td></tr>
<tr><td>Trade-off</td><td>זול, גמיש, אתם מריצים ומאבטחים</td><td>מנוהל, תמחור לפי משאב מנוהל; רק Terraform</td><td>פיצ'רים עשירים (drift, תלויות בין stacks), עלות ספק</td></tr>
</table>
<p><strong>Policy-as-code</strong> רץ מול ה-JSON של ה-plan, כך שהוא שופט את ה-<em>שינוי</em> ולא רק קוד סטטי: חוסם buckets ציבוריים, מחיקת databases, instance types מחוץ ל-allow-list, tags חסרים. סורקים סטטיים (Checkov, Trivy config, חוקי tfsec שעברו ל-Trivy) תופסים misconfigurations ב-HCL מוקדם יותר, ב-PR של המפתח.</p>
${TF_POLICY}
<p><strong>OpenTofu</strong> עשה fork מ-Terraform 1.5 אחרי ש-HashiCorp העבירה את Terraform ל-BSL באוגוסט 2023; הוא תחת Linux Foundation, ברישיון MPL, ותואם ברובו לקונפיגים ול-providers של Terraform. הוא הוסיף פיצ'רים משלו, כמו הצפנת state בצד ה-client, הערכה מוקדמת של משתנים בבלוקי backend ו-module source, ו-for_each על קונפיגורציות של providers. השניים מתפצלים לאט, אז בוחרים אחד לכל codebase. סיבות לעבור: דרישות רישוי/נייטרליות ספק, או רצון בפיצ'רים האלה; סיבות לחכות: תלות בפיצ'רים של HCP Terraform או בפיצ'רי שפה חדשים שקיימים רק ב-Terraform.</p>`
      }
    }
  ],
  diagram: "PR (HCL change) -> CI: fmt/validate/tflint/checkov -> plan (OIDC creds) -> plan.json -> OPA/Sentinel -> plan comment\n  -> CODEOWNERS approve -> apply saved plan (project lock) -> merge\nnightly: plan -refresh-only -detailed-exitcode per state -> exit 2 -> drift issue to owning team",
  handsOn: [
    { cmd: "terraform state list | wc -l && time terraform plan -lock=false -refresh=true > /dev/null", what: { en: "Measure resources per state and plan time — the two numbers that tell you whether to split.", he: "מודדים משאבים לכל state וזמן plan – שני המספרים שאומרים אם צריך לפצל." } },
    { cmd: "terraform plan -refresh-only -detailed-exitcode; echo \"exit=$?\"", what: { en: "Detect drift without changing anything: exit 2 means reality differs from state.", he: "מזהים drift בלי לשנות כלום: exit 2 אומר שהמציאות שונה מה-state." } },
    { cmd: "terraform plan -out=tfplan && terraform show -json tfplan > plan.json && conftest test plan.json --policy policies/", what: { en: "Evaluate OPA policies against the actual planned changes.", he: "מריצים OPA policies מול השינויים המתוכננים בפועל." } },
    { cmd: "terraform plan -generate-config-out=generated.tf", what: { en: "With an import block in place, let Terraform draft the HCL for an existing click-ops resource.", he: "כשיש בלוק import, נותנים ל-Terraform לכתוב טיוטת HCL למשאב קיים שנוצר ב-click-ops." } }
  ],
  mnemonic: { en: "SLiM PaD: Split state, Lock it, Modules versioned, PR workflow, audit with policy, Drift nightly.", he: "SLiM PaD: Split state, Lock, Modules עם גרסאות, PR workflow, audit עם policy, Drift כל לילה." },
  pitfalls: [
    { en: "One giant state for everything: 10-minute plans, constant lock contention, and an innocent PR that can destroy the VPC.", he: "State ענק אחד לכל דבר: plans של 10 דקות, תחרות מתמדת על ה-lock, ו-PR תמים שיכול למחוק את ה-VPC." },
    { en: "Applying a fresh plan instead of the reviewed saved plan: what gets applied may differ from what was approved if anything changed in between.", he: "לעשות apply ל-plan חדש במקום ל-plan השמור שעבר review: מה שמוחל עלול להיות שונה ממה שאושר אם משהו השתנה בינתיים." },
    { en: "terraform state mv/rm by hand on prod: unreviewed, unrepeatable, easy to orphan resources. Use moved/import/removed blocks.", he: "terraform state mv/rm ידני על prod: בלי review, לא ניתן לשחזור, וקל להשאיר משאבים יתומים. משתמשים בבלוקי moved/import/removed." },
    { en: "Module consumers on 'main' branch refs: an upstream refactor silently changes every environment's next plan.", he: "צרכני מודולים שמפנים ל-branch של main: refactor ב-upstream משנה בשקט את ה-plan הבא של כל סביבה." }
  ],
  interview: [
    {
      q: { en: "You inherit one Terraform state with 3,000 resources across all environments; plans take 15 minutes and teams queue on the lock. Plan the fix.", he: "ירשתם state אחד של Terraform עם 3,000 משאבים בכל הסביבות; plans לוקחים 15 דקות וצוותים מחכים בתור ל-lock. תכננו את התיקון." },
      a: { en: "Target layout first: env x region x component, sized by change rate and blast radius, with owners (CODEOWNERS) per directory. Freeze big changes, back up the state (bucket versioning plus a copy). Migrate one component at a time, starting with the most frequently changed (app resources) to relieve the lock fastest: new root module with import blocks for its resources, old module with removed{destroy=false}; both plans must show only imports/forgets. Replace in-state references with remote_state or published outputs. Put each new state behind the PR workflow with policy checks and nightly drift detection. Measure success: plan time per state under 1-2 minutes, lock wait near zero, change failure rate for infra PRs.", he: "קודם מבנה יעד: env x region x component, בגודל לפי קצב שינוי ו-blast radius, עם בעלים (CODEOWNERS) לכל תיקייה. מקפיאים שינויים גדולים, מגבים את ה-state (versioning ב-bucket ועוד עותק). מעבירים רכיב אחד בכל פעם, ומתחילים מזה שמשתנה הכי הרבה (משאבי אפליקציה) כדי לשחרר את ה-lock הכי מהר: root module חדש עם בלוקי import למשאבים שלו, ובמודול הישן removed{destroy=false}; שני ה-plans חייבים להראות רק imports/forgets. מחליפים הפניות בתוך ה-state ב-remote_state או ב-outputs מפורסמים. כל state חדש עובר דרך ה-PR workflow עם בדיקות policy וזיהוי drift לילי. מודדים הצלחה: זמן plan לכל state מתחת ל-1-2 דקות, המתנה ל-lock קרובה לאפס, change failure rate ל-PRs של תשתית." }
    },
    {
      q: { en: "Atlantis, HCP Terraform or Spacelift for a 150-engineer company — how do you decide?", he: "Atlantis, HCP Terraform או Spacelift לחברה של 150 מהנדסים – איך מחליטים?" },
      a: { en: "Criteria: who operates it (Atlantis is a stateful service you must run, secure and upgrade — it holds powerful cloud credentials), cost model (HCP Terraform prices per managed resource, which grows fast with many small resources; Spacelift/env0 per seat/worker), policy needs (built-in OPA/Sentinel vs bring your own), multi-IaC (OpenTofu, Pulumi, CloudFormation), drift detection and stack dependencies out of the box, private workers for network access to private APIs, and licensing stance on OpenTofu. For a 150-engineer org with a capable platform team and cost sensitivity, Atlantis + conftest + a nightly drift job is very workable; if the team is thin or compliance needs rich RBAC/audit, a managed product buys time. Either way, keep the repo layout and policies tool-agnostic so you can switch.", he: "קריטריונים: מי מתפעל (Atlantis הוא שירות stateful שצריך להריץ, לאבטח ולשדרג – והוא מחזיק credentials חזקים לענן), מודל עלות (HCP Terraform מתמחר לפי משאב מנוהל, שגדל מהר עם הרבה משאבים קטנים; Spacelift/env0 לפי seat/worker), צורכי policy (OPA/Sentinel מובנה מול להביא לבד), multi-IaC (OpenTofu, Pulumi, CloudFormation), זיהוי drift ותלויות בין stacks מהקופסה, private workers לגישת רשת ל-APIs פרטיים, ועמדת הרישוי לגבי OpenTofu. לארגון של 150 מהנדסים עם צוות פלטפורמה חזק ורגישות לעלות, Atlantis + conftest + job לילי של drift עובד מצוין; אם הצוות דליל או שה-compliance דורש RBAC/audit עשירים, מוצר מנוהל קונה זמן. בכל מקרה, שומרים את מבנה ה-repo וה-policies בלתי תלויים בכלי כדי שאפשר יהיה להחליף." }
    },
    {
      q: { en: "Should we migrate from Terraform to OpenTofu?", he: "האם לעבור מ-Terraform ל-OpenTofu?" },
      a: { en: "Frame it as risk and value, not ideology. Check: is the BSL a real legal or vendor-risk issue for us (it mostly restricts offering competing hosted services)? Do we depend on HCP Terraform features or Terraform-only language features released after the fork? Do we want OpenTofu-only features such as state encryption? Migration from a 1.5-1.6 era codebase is usually mechanical — swap the binary in CI, run plans that should show no changes, keep the provider lock files — but it's a one-way door as features diverge. I'd pilot on a few non-prod states, verify tooling (Atlantis, Renovate, linters, IDE) supports it, set a decision deadline, and pick one engine per repo rather than mixing.", he: "מסגרים את זה כסיכון וערך, לא כאידיאולוגיה. בודקים: האם ה-BSL הוא בעיה משפטית או סיכון ספק אמיתי אצלנו (הוא בעיקר מגביל הצעת שירותים מתחרים מנוהלים)? האם אנחנו תלויים בפיצ'רים של HCP Terraform או בפיצ'רי שפה שיצאו רק ב-Terraform אחרי ה-fork? האם אנחנו רוצים פיצ'רים שקיימים רק ב-OpenTofu כמו הצפנת state? מיגרציה מ-codebase מתקופת 1.5-1.6 היא בדרך כלל מכנית – מחליפים את הבינארי ב-CI, מריצים plans שאמורים להראות אפס שינויים, שומרים את ה-lock files של ה-providers – אבל זו דלת חד-כיוונית ככל שהפיצ'רים מתפצלים. הייתי עושה pilot על כמה states שאינם prod, מוודא שהכלים (Atlantis, Renovate, linters, IDE) תומכים, קובע דדליין להחלטה, ובוחר מנוע אחד לכל repo במקום לערבב." }
    }
  ],
  quiz: [
    {
      q: { en: "What does terraform plan -detailed-exitcode return when drift or changes are detected?", he: "מה מחזיר terraform plan -detailed-exitcode כשמזוהים drift או שינויים?" },
      options: [
        { en: "0", he: "0" },
        { en: "1", he: "1" },
        { en: "2", he: "2" },
        { en: "3", he: "3" }
      ], answer: 2,
      explain: { en: "0 = no changes, 1 = error, 2 = succeeded with changes. Drift jobs alert on 2.", he: "0 = אין שינויים, 1 = שגיאה, 2 = הצליח עם שינויים. Jobs של drift מתריעים על 2." }
    },
    {
      q: { en: "You want to move aws_security_group.web into module.web without destroying it. Best approach?", he: "רוצים להעביר את aws_security_group.web לתוך module.web בלי למחוק אותו. מה הגישה הטובה?" },
      options: [
        { en: "Delete and re-create it", he: "למחוק וליצור מחדש" },
        { en: "A moved block from the old address to the new one, reviewed in the plan", he: "בלוק moved מהכתובת הישנה לחדשה, שעובר review ב-plan" },
        { en: "terraform taint", he: "terraform taint" },
        { en: "Edit the state JSON by hand", he: "לערוך את ה-JSON של ה-state ידנית" }
      ], answer: 1,
      explain: { en: "moved blocks (TF 1.1+) refactor addresses declaratively; the plan shows the move with no destroy/create.", he: "בלוקי moved (TF 1.1+) עושים refactor לכתובות באופן דקלרטיבי; ה-plan מראה את ההעברה בלי destroy/create." }
    },
    {
      q: { en: "Why run OPA/Sentinel against the plan JSON rather than only scanning HCL?", he: "למה להריץ OPA/Sentinel מול ה-JSON של ה-plan ולא רק לסרוק HCL?" },
      options: [
        { en: "HCL can't be parsed", he: "אי אפשר לפרסר HCL" },
        { en: "The plan shows resolved values and actions (create/update/delete), so policies can judge the actual change", he: "ה-plan מראה ערכים פתורים ופעולות (create/update/delete), כך ש-policies יכולים לשפוט את השינוי בפועל" },
        { en: "It's faster", he: "זה מהיר יותר" },
        { en: "Plans don't contain secrets", he: "Plans לא מכילים סודות" }
      ], answer: 1,
      explain: { en: "Variables, module outputs and defaults are resolved in the plan, and actions like delete are explicit — e.g. 'no deletes of databases' is only checkable there.", he: "משתנים, outputs של מודולים וברירות מחדל פתורים ב-plan, ופעולות כמו delete מפורשות – למשל 'אין מחיקת databases' אפשר לבדוק רק שם." }
    },
    {
      q: { en: "Since Terraform 1.10, how can the S3 backend lock state without DynamoDB?", he: "מאז Terraform 1.10, איך ה-backend של S3 יכול לנעול state בלי DynamoDB?" },
      options: [
        { en: "It can't; DynamoDB is required", he: "הוא לא יכול; DynamoDB חובה" },
        { en: "use_lockfile = true, using S3 conditional writes for a lock object", he: "use_lockfile = true, שמשתמש ב-conditional writes של S3 לאובייקט lock" },
        { en: "By enabling bucket versioning", he: "ע״י הפעלת versioning ב-bucket" },
        { en: "With -lock=false", he: "עם -lock=false" }
      ], answer: 1,
      explain: { en: "S3-native locking writes a .tflock object with conditional writes; DynamoDB-based locking is deprecated. Versioning is for recovery, not locking.", he: "Locking native של S3 כותב אובייקט .tflock עם conditional writes; locking מבוסס DynamoDB הוא deprecated. Versioning נועד לשחזור, לא לנעילה." }
    }
  ],
  related: ["cloud-iac", "cloud-cicd", "cloud-iam-security", "staff-platform-engineering", "staff-zero-trust-secrets"]
});
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  ["Ambient mesh (ztunnel)", "Istio's sidecar-less data plane: a per-node ztunnel provides L4 mTLS and authz via HBONE tunnels, and optional per-namespace waypoint proxies add L7 features.", "ה-data plane של Istio בלי sidecars: ztunnel לכל node מספק mTLS ו-authz של L4 דרך מנהרות HBONE, ו-waypoint proxies אופציונליים לכל namespace מוסיפים פיצ'רים של L7.", "staff-service-mesh"],
  ["Internal Developer Platform (IDP)", "The self-service layer of tools, APIs and golden paths a platform team runs as a product so product teams can build, deploy and operate without tickets.", "שכבת ה-self-service של כלים, APIs ו-golden paths שצוות פלטפורמה מריץ כמוצר, כדי שצוותי מוצר יוכלו לבנות, לעשות deploy ולתפעל בלי tickets.", "staff-platform-engineering"],
  ["Golden path", "An opinionated, supported, end-to-end way to build and ship a common type of service — optional, but easier than any alternative.", "דרך דעתנית ונתמכת מקצה לקצה לבנות ולשלוח סוג נפוץ של שירות – אופציונלית, אבל קלה יותר מכל אלטרנטיבה.", "staff-platform-engineering"],
  ["vcluster", "A virtual Kubernetes cluster: its own API server and data store running inside a host namespace, syncing pods to the host's nodes.", "Cluster וירטואלי של Kubernetes: API server ו-data store משלו שרצים בתוך namespace של ה-host, ומסנכרנים pods ל-nodes של ה-host.", "staff-platform-engineering"],
  ["DORA metrics", "Delivery performance metrics: deployment frequency, lead time for changes, change failure rate and failed-deployment recovery time.", "מדדי ביצועי delivery: deployment frequency, lead time for changes, change failure rate ו-failed-deployment recovery time.", "staff-platform-engineering"],
  ["SPIFFE / SPIRE", "SPIFFE standardises workload identity as a URI (spiffe://domain/path) in short-lived X.509/JWT SVIDs; SPIRE is the server/agent implementation that attests and issues them.", "SPIFFE מתקנן זהות workload כ-URI (spiffe://domain/path) בתוך SVIDs קצרי-חיים מסוג X.509/JWT; SPIRE הוא מימוש ה-server/agent שמאמת ומנפיק אותם.", "staff-zero-trust-secrets"],
  ["Dynamic secret", "A credential generated on demand per consumer (e.g. by Vault) with a lease that expires or can be revoked, instead of a shared static password.", "Credential שנוצר לפי דרישה לכל צרכן (למשל ע״י Vault) עם lease שפג או שאפשר לבטל, במקום סיסמה סטטית משותפת.", "staff-zero-trust-secrets"],
  ["External Secrets Operator", "Kubernetes operator that syncs secrets from AWS/Azure/GCP secret managers or Vault into Kubernetes Secrets on a refresh interval.", "Operator של Kubernetes שמסנכרן סודות מ-secret managers של AWS/Azure/GCP או מ-Vault ל-Secrets של Kubernetes לפי refresh interval.", "staff-zero-trust-secrets"],
  ["SBOM", "Software Bill of Materials — a machine-readable list (SPDX/CycloneDX) of every component and version inside an artifact.", "Software Bill of Materials – רשימה קריאה למכונה (SPDX/CycloneDX) של כל רכיב וגרסה בתוך artifact.", "staff-supply-chain"],
  ["SLSA", "Supply-chain Levels for Software Artifacts — a framework whose Build levels (L1-L3) require increasingly trustworthy, signed provenance and hardened builds.", "Supply-chain Levels for Software Artifacts – framework שרמות ה-Build שלו (L1-L3) דורשות provenance חתום ואמין יותר ו-builds מוקשחים.", "staff-supply-chain"],
  ["Keyless signing", "Sigstore signing where an ephemeral key is certified by Fulcio for an OIDC identity and recorded in the Rekor transparency log, so no long-lived key exists.", "חתימה ב-Sigstore שבה מפתח זמני מקבל תעודה מ-Fulcio לזהות OIDC ונרשם ב-transparency log של Rekor, כך שאין מפתח ארוך-חיים.", "staff-supply-chain"],
  ["eBPF", "A Linux kernel technology for running verified, sandboxed programs at kernel hooks (syscalls, network, functions) for networking, security and tracing.", "טכנולוגיה ב-kernel של Linux להרצת תוכניות מאומתות ומבודדות על hooks של ה-kernel (syscalls, רשת, פונקציות) לרשת, אבטחה ו-tracing.", "staff-ebpf-cilium"],
  ["Transaction ID wraparound", "PostgreSQL's 32-bit XID limit: rows must be frozen by vacuum before ~2.1 billion transactions pass, or the database stops accepting writes.", "מגבלת ה-XID של 32-bit ב-PostgreSQL: vacuum חייב לעשות freeze לשורות לפני שעוברות כ-2.1 מיליארד טרנזקציות, אחרת ה-database מפסיק לקבל כתיבות.", "staff-postgres-at-scale"],
  ["gh-ost", "GitHub's triggerless online schema change tool for MySQL: copies rows into a shadow table, tails the binlog, then cuts over with an atomic rename.", "כלי online schema change של GitHub ל-MySQL בלי triggers: מעתיק שורות לטבלת צל, עוקב אחרי ה-binlog, ואז עושה cut-over עם rename אטומי.", "staff-zero-downtime-migrations"],
  ["moved block", "Terraform/OpenTofu HCL block that records an address change (rename, move into a module) so the plan moves state instead of destroying and recreating.", "בלוק HCL של Terraform/OpenTofu שמתעד שינוי כתובת (שינוי שם, העברה למודול) כך שה-plan מזיז state במקום למחוק וליצור מחדש.", "staff-terraform-at-scale"],
  ["OpenTofu", "Open-source (MPL) fork of Terraform under the Linux Foundation, created after Terraform's 2023 move to the BSL; largely config- and provider-compatible.", "Fork בקוד פתוח (MPL) של Terraform תחת Linux Foundation, שנוצר אחרי המעבר של Terraform ל-BSL ב-2023; תואם ברובו בקונפיג וב-providers.", "staff-terraform-at-scale"],
].forEach(function (g) {
  window.INFRA.glossary.push({ term: g[0], track: "staff", def: { en: g[1], he: g[2] }, lesson: g[3] });
});
})();
