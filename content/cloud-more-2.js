window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Cloud cost & operations, part 2: spot in production, commitments & ARM,
   data transfer costs, object storage at scale, engineer access to prod
   ========================================================================= */

(function () {
const t = (en, he) => ({ en, he });
const c = (enL, heL, next, score, enF, heF) => ({ label: t(enL, heL), next, score, feedback: t(enF, heF) });

/* ---------------------------------------------------------------- 1. Spot */
window.INFRA.lessons.push({
  id: "cloud-spot-instances",
  track: "cloud",
  order: 70,
  icon: "🎰",
  level: 3,
  minutes: 14,
  title: t("Spot / Preemptible Instances in Production", "Spot ו-Preemptible ב-production"),
  tldr: t(
    "Spot capacity is 60-90% cheaper because the cloud can take it back with 2 minutes' notice on AWS and ~30 seconds on GCP/Azure. It works in production when the workload is stateless or checkpointed, the fleet is diversified across many instance types and AZs, allocation is capacity-aware, termination is handled gracefully, and on-demand is a guaranteed fallback.",
    "קיבולת Spot זולה ב-60-90% כי הענן יכול לקחת אותה בחזרה עם התראה של 2 דקות ב-AWS ובערך 30 שניות ב-GCP וב-Azure. זה עובד ב-production כשה-workload הוא stateless או עושה checkpoint, כשמפזרים את ה-fleet על הרבה סוגי instance ו-AZs, כשה-allocation מתחשב בקיבולת, כשמטפלים ב-termination בצורה מסודרת, וכש-on-demand מחכה כ-fallback מובטח."
  ),
  analogy: t(
    "Spot is flying standby. The seat is a fraction of the price, but if a full-fare passenger shows up you're off the plane — politely, with a two-minute warning. Smart standby travellers list themselves on ten flights to three cities, carry only hand luggage (no local state), and keep a full-price ticket in their pocket for the one trip that can't slip.",
    "Spot זה לטוס standby. המושב עולה חלק קטן מהמחיר, אבל אם מגיע נוסע שמשלם מחיר מלא — מורידים אותך מהמטוס, בנימוס, עם התראה של שתי דקות. נוסע standby חכם נרשם לעשר טיסות לשלוש ערים, לוקח רק תיק יד (בלי state מקומי), ושומר בכיס כרטיס במחיר מלא לנסיעה האחת שאסור לפספס."
  ),
  sections: [
    {
      h: t("What spot really is, per provider", "מה זה Spot באמת, לפי ספק"),
      body: t(
`<p>Spot is the provider's <strong>unused capacity</strong>, sold at a discount on the condition that it can be reclaimed when on-demand customers need it. You don't bid anymore (AWS dropped bidding in 2017); the price moves slowly with long-term supply and demand, and the real risk is <strong>interruption</strong>, not price.</p>
<table>
<tr><th></th><th>AWS EC2 Spot</th><th>GCP Spot VMs</th><th>Azure Spot VMs</th></tr>
<tr><td>Typical discount</td><td>up to ~90% (usually 60-80%)</td><td>60-91%</td><td>up to ~90%</td></tr>
<tr><td>Notice</td><td><strong>2 minutes</strong> (+ earlier "rebalance recommendation")</td><td><strong>30 seconds</strong> (ACPI soft-off)</td><td><strong>30 seconds</strong> (Scheduled Events: <code>Preempt</code>)</td></tr>
<tr><td>Signal</td><td>IMDS <code>/latest/meta-data/spot/instance-action</code>, EventBridge "EC2 Spot Instance Interruption Warning"</td><td>Metadata <code>instance/preempted</code>, shutdown script</td><td>IMDS <code>/metadata/scheduledevents</code></td></tr>
<tr><td>On reclaim</td><td>terminate (default), stop or hibernate</td><td>stop or delete</td><td>deallocate or delete (eviction policy)</td></tr>
<tr><td>Max runtime</td><td>none</td><td>none (legacy "preemptible" had 24 h)</td><td>none</td></tr>
</table>
<p>Interruption rates differ hugely by pool. The AWS <strong>Spot Instance Advisor</strong> shows the historical frequency bucket per instance type and region (&lt;5%, 5-10% … &gt;20% per month). A "pool" is <em>instance type × AZ</em> — <code>m6i.xlarge</code> in <code>use1-az1</code> and in <code>use1-az2</code> are two different pools with independent capacity.</p>
<blockquote>💡 Real world: interruptions come in waves. When a big customer launches thousands of on-demand <code>c6i</code> in one AZ, every spot <code>c6i</code> there can be reclaimed within minutes. If your whole fleet is one pool, you lose the whole fleet at once — that's a design bug, not bad luck.</blockquote>`,
`<p>Spot זו <strong>קיבולת לא מנוצלת</strong> של הספק, שנמכרת בהנחה בתנאי שאפשר לקחת אותה בחזרה כשלקוחות on-demand צריכים אותה. כבר לא עושים bidding (ב-AWS ביטלו את זה ב-2017); המחיר זז לאט לפי היצע וביקוש לטווח ארוך, והסיכון האמיתי הוא <strong>interruption</strong>, לא המחיר.</p>
<table>
<tr><th></th><th>AWS EC2 Spot</th><th>GCP Spot VMs</th><th>Azure Spot VMs</th></tr>
<tr><td>הנחה טיפוסית</td><td>עד ~90% (בדרך כלל 60-80%)</td><td>60-91%</td><td>עד ~90%</td></tr>
<tr><td>התראה</td><td><strong>2 דקות</strong> (+ "rebalance recommendation" מוקדם יותר)</td><td><strong>30 שניות</strong> (ACPI soft-off)</td><td><strong>30 שניות</strong> (Scheduled Events: <code>Preempt</code>)</td></tr>
<tr><td>איך יודעים</td><td>IMDS <code>/latest/meta-data/spot/instance-action</code>, EventBridge "EC2 Spot Instance Interruption Warning"</td><td>Metadata <code>instance/preempted</code>, shutdown script</td><td>IMDS <code>/metadata/scheduledevents</code></td></tr>
<tr><td>מה קורה בלקיחה</td><td>terminate (ברירת מחדל), stop או hibernate</td><td>stop או delete</td><td>deallocate או delete (eviction policy)</td></tr>
<tr><td>זמן ריצה מקסימלי</td><td>אין</td><td>אין (ל-"preemptible" הישן היה 24 שעות)</td><td>אין</td></tr>
</table>
<p>שיעור ה-interruptions שונה מאוד בין pools. ה-<strong>Spot Instance Advisor</strong> של AWS מראה את התדירות ההיסטורית לכל סוג instance ו-region (&lt;5%, 5-10% … &gt;20% בחודש). "Pool" זה <em>סוג instance × AZ</em> — <code>m6i.xlarge</code> ב-<code>use1-az1</code> וב-<code>use1-az2</code> הם שני pools שונים עם קיבולת נפרדת.</p>
<blockquote>💡 Real world: interruptions מגיעים בגלים. כשלקוח גדול מרים אלפי <code>c6i</code> ב-on-demand ב-AZ אחד, כל ה-<code>c6i</code> שלך ב-Spot שם יכולים להילקח תוך דקות. אם כל ה-fleet שלך יושב על pool אחד, אתה מאבד את כולו בבת אחת — זה באג בתכנון, לא חוסר מזל.</blockquote>`)
    },
    {
      h: t("Diversification and capacity-aware allocation", "פיזור ו-allocation שמתחשב בקיבולת"),
      body: t(
`<p>The single most important spot rule: <strong>be flexible</strong>. Ask for 10-15+ instance types across all AZs, sized by vCPU/memory rather than by exact type. Then let the provider choose the pools least likely to be interrupted.</p>
<table>
<tr><th>AWS allocation strategy</th><th>What it does</th><th>Verdict</th></tr>
<tr><td><code>lowest-price</code></td><td>Cheapest pools first</td><td>Highest interruption rate — avoid for services</td></tr>
<tr><td><code>capacity-optimized</code></td><td>Pools with the most spare capacity</td><td>Fewest interruptions</td></tr>
<tr><td><code>price-capacity-optimized</code></td><td>Deepest pools, then cheapest among them</td><td><strong>Recommended default</strong> today</td></tr>
</table>
<p>An Auto Scaling group with a mixed instances policy — 2 on-demand as a floor, the rest 100% spot across many types:</p>
<pre>"MixedInstancesPolicy": {
  "InstancesDistribution": {
    "OnDemandBaseCapacity": 2,
    "OnDemandPercentageAboveBaseCapacity": 0,
    "SpotAllocationStrategy": "price-capacity-optimized"
  },
  "LaunchTemplate": {
    "LaunchTemplateSpecification": { "LaunchTemplateName": "web", "Version": "$Latest" },
    "Overrides": [
      { "InstanceRequirements": {
          "VCpuCount": { "Min": 4, "Max": 8 },
          "MemoryMiB": { "Min": 16384, "Max": 32768 },
          "CpuManufacturers": ["intel", "amd"],
          "InstanceGenerations": ["current"] } }
    ]
  }
}
"CapacityRebalance": true</pre>
<p><code>InstanceRequirements</code> (attribute-based selection) automatically includes new instance families as they launch. <code>CapacityRebalance</code> launches a replacement when AWS sends a rebalance recommendation, often well before the 2-minute warning.</p>
<blockquote>⚠️ Production tip: diversification also means <em>sizes</em>. If your pods need 6 GiB, a fleet of <code>xlarge</code>-only (16 GiB) bins badly; allow <code>large</code> to <code>4xlarge</code> and let the scheduler pack.</blockquote>`,
`<p>החוק הכי חשוב ב-Spot: <strong>להיות גמיש</strong>. מבקשים 10-15+ סוגי instance בכל ה-AZs, לפי גודל vCPU וזיכרון ולא לפי סוג מדויק. ואז נותנים לספק לבחור את ה-pools שהכי פחות סביר שיילקחו.</p>
<table>
<tr><th>אסטרטגיית allocation ב-AWS</th><th>מה היא עושה</th><th>שורה תחתונה</th></tr>
<tr><td><code>lowest-price</code></td><td>קודם ה-pools הזולים</td><td>הכי הרבה interruptions — לא לסרוויסים</td></tr>
<tr><td><code>capacity-optimized</code></td><td>pools עם הכי הרבה קיבולת פנויה</td><td>הכי מעט interruptions</td></tr>
<tr><td><code>price-capacity-optimized</code></td><td>ה-pools העמוקים, ומתוכם הזולים</td><td><strong>ברירת המחדל המומלצת</strong> היום</td></tr>
</table>
<p>Auto Scaling group עם mixed instances policy — 2 on-demand כרצפה, וכל השאר 100% Spot על הרבה סוגים:</p>
<pre>"MixedInstancesPolicy": {
  "InstancesDistribution": {
    "OnDemandBaseCapacity": 2,
    "OnDemandPercentageAboveBaseCapacity": 0,
    "SpotAllocationStrategy": "price-capacity-optimized"
  },
  "LaunchTemplate": {
    "LaunchTemplateSpecification": { "LaunchTemplateName": "web", "Version": "$Latest" },
    "Overrides": [
      { "InstanceRequirements": {
          "VCpuCount": { "Min": 4, "Max": 8 },
          "MemoryMiB": { "Min": 16384, "Max": 32768 },
          "CpuManufacturers": ["intel", "amd"],
          "InstanceGenerations": ["current"] } }
    ]
  }
}
"CapacityRebalance": true</pre>
<p><code>InstanceRequirements</code> (בחירה לפי מאפיינים) מכניס אוטומטית משפחות instance חדשות כשהן יוצאות. <code>CapacityRebalance</code> מרים מחליף כש-AWS שולח rebalance recommendation, הרבה פעמים הרבה לפני ההתראה של 2 הדקות.</p>
<blockquote>⚠️ Production tip: פיזור זה גם <em>גדלים</em>. אם ה-Pod-ים שלך צריכים 6 GiB, fleet של <code>xlarge</code> בלבד (16 GiB) נארז רע; תאפשר מ-<code>large</code> עד <code>4xlarge</code> ותן ל-scheduler לארוז.</blockquote>`)
    },
    {
      h: t("Spot in Kubernetes: Karpenter, node pools, fallback", "Spot ב-Kubernetes: Karpenter, node pools ו-fallback"),
      body: t(
`<p><strong>Karpenter</strong> (EKS, and AKS via NAP) is the most spot-friendly autoscaler: when a NodePool allows both capacity types, it prefers spot, uses price-capacity-optimized across every allowed type, and <strong>falls back to on-demand automatically</strong> when spot is unavailable (InsufficientInstanceCapacity).</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      requirements:
        - { key: karpenter.sh/capacity-type, operator: In, values: ["spot", "on-demand"] }
        - { key: kubernetes.io/arch, operator: In, values: ["amd64", "arm64"] }
        - { key: karpenter.k8s.aws/instance-category, operator: In, values: ["c", "m", "r"] }
        - { key: karpenter.k8s.aws/instance-generation, operator: Gt, values: ["5"] }
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets: [ { nodes: "10%" } ]</pre>
<p>Configure Karpenter's <strong>interruption queue</strong> (SQS fed by EventBridge rules for spot warnings, rebalance, scheduled maintenance and state changes). Karpenter then cordons and drains the node and pre-launches a replacement — you do <em>not</em> also need the Node Termination Handler.</p>
<p>Without Karpenter:</p>
<ul>
<li><strong>EKS managed node groups</strong> with <code>capacityType: SPOT</code> use capacity-optimized and drain on rebalance automatically. Use several node groups or many types per group.</li>
<li><strong>Self-managed ASGs</strong>: run <strong>AWS Node Termination Handler</strong> (queue mode via SQS is preferred over the IMDS DaemonSet mode).</li>
<li><strong>GKE</strong>: <code>gcloud container node-pools create spot --spot</code>; nodes get label <code>cloud.google.com/gke-spot=true</code>. Graceful node shutdown gives regular pods only ~15 s of the 30 s.</li>
<li><strong>AKS</strong>: <code>az aks nodepool add --priority Spot --eviction-policy Delete --spot-max-price -1</code>; nodes get taint <code>kubernetes.azure.com/scalesetpriority=spot:NoSchedule</code>, so pods need a matching toleration.</li>
</ul>
<blockquote>⚠️ Production tip: keep critical singletons (CoreDNS, ingress controllers, Karpenter itself, operators) on a small on-demand pool. Losing your ingress and your autoscaler in the same interruption wave is how a 2-minute notice becomes a 20-minute outage.</blockquote>`,
`<p><strong>Karpenter</strong> (ב-EKS, וב-AKS דרך NAP) הוא ה-autoscaler הכי ידידותי ל-Spot: כש-NodePool מאפשר את שני סוגי הקיבולת, הוא מעדיף Spot, משתמש ב-price-capacity-optimized על כל הסוגים המותרים, ו<strong>נופל אוטומטית ל-on-demand</strong> כשאין Spot (InsufficientInstanceCapacity).</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      requirements:
        - { key: karpenter.sh/capacity-type, operator: In, values: ["spot", "on-demand"] }
        - { key: kubernetes.io/arch, operator: In, values: ["amd64", "arm64"] }
        - { key: karpenter.k8s.aws/instance-category, operator: In, values: ["c", "m", "r"] }
        - { key: karpenter.k8s.aws/instance-generation, operator: Gt, values: ["5"] }
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets: [ { nodes: "10%" } ]</pre>
<p>תגדיר ל-Karpenter <strong>interruption queue</strong> (תור SQS שמקבל מ-EventBridge התראות Spot, rebalance, תחזוקה מתוזמנת ושינויי state). אז Karpenter עושה cordon ו-drain ל-node ומרים מחליף מראש — <em>לא</em> צריך בנוסף את ה-Node Termination Handler.</p>
<p>בלי Karpenter:</p>
<ul>
<li><strong>EKS managed node groups</strong> עם <code>capacityType: SPOT</code> משתמשים ב-capacity-optimized ועושים drain אוטומטי ב-rebalance. תשתמש בכמה node groups או בהרבה סוגים בכל אחד.</li>
<li><strong>ASGs שאתה מנהל לבד</strong>: תריץ את <strong>AWS Node Termination Handler</strong> (עדיף queue mode דרך SQS על פני DaemonSet שקורא מ-IMDS).</li>
<li><strong>GKE</strong>: <code>gcloud container node-pools create spot --spot</code>; ה-nodes מקבלים label <code>cloud.google.com/gke-spot=true</code>. ה-graceful node shutdown נותן ל-Pod-ים רגילים רק ~15 שניות מתוך ה-30.</li>
<li><strong>AKS</strong>: <code>az aks nodepool add --priority Spot --eviction-policy Delete --spot-max-price -1</code>; ה-nodes מקבלים taint <code>kubernetes.azure.com/scalesetpriority=spot:NoSchedule</code>, אז Pod-ים צריכים toleration מתאים.</li>
</ul>
<blockquote>⚠️ Production tip: תשאיר singletons קריטיים (CoreDNS, ingress controllers, את Karpenter עצמו, operators) על pool קטן של on-demand. לאבד את ה-ingress ואת ה-autoscaler באותו גל interruptions — ככה התראה של 2 דקות הופכת ל-outage של 20 דקות.</blockquote>`)
    },
    {
      h: t("Which workloads fit — and handling termination", "אילו workloads מתאימים — ואיך מטפלים ב-termination"),
      body: t(
`<table>
<tr><th>Great fit</th><th>Fit with care</th><th>Keep off spot</th></tr>
<tr><td>Stateless web/API with 3+ replicas, CI runners, batch/ETL with checkpoints, queue workers, dev/test, rendering, ML training with checkpoints</td><td>Kafka consumers (rebalance storms), Spark executors (not the driver), stateful sets with fast replica rebuild</td><td>Single-replica anything, databases primaries, ZooKeeper/etcd quorum members, long jobs that can't checkpoint, licensed software tied to a host</td></tr>
</table>
<p>A graceful spot termination in Kubernetes is the same as any node drain, just with a hard deadline:</p>
<ol>
<li>Signal arrives (IMDS/EventBridge) → handler <strong>cordons</strong> the node and <strong>drains</strong> it via the Eviction API.</li>
<li>Eviction respects <strong>PodDisruptionBudgets</strong> — but the VM dies at T+120 s regardless. A PDB that blocks the drain only means pods die uncleanly.</li>
<li>Pod gets <code>SIGTERM</code> → <code>preStop</code> hook → app stops accepting, finishes in-flight work → exits within <code>terminationGracePeriodSeconds</code>.</li>
<li>Endpoints are removed; the LB deregisters the target (set ALB deregistration delay ≤ ~60 s, not the 300 s default).</li>
</ol>
<pre>spec:
  terminationGracePeriodSeconds: 60      # must fit inside the notice (AWS 120 s, GCP/Azure ~30 s)
  containers:
  - name: api
    lifecycle:
      preStop: { exec: { command: ["sleep", "10"] } }   # let endpoints/LB catch up
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: api }
spec: { maxUnavailable: 1, selector: { matchLabels: { app: api } } }</pre>
<p>For batch: <strong>checkpoint</strong> every few minutes to S3/GCS (Spark, PyTorch <code>torch.save</code>, custom offsets), make tasks idempotent, and retry. Spread replicas with <code>topologySpreadConstraints</code> on <code>topology.kubernetes.io/zone</code> and on <code>karpenter.sh/capacity-type</code> so one wave can't take every replica.</p>`,
`<table>
<tr><th>מתאים מצוין</th><th>מתאים בזהירות</th><th>להרחיק מ-Spot</th></tr>
<tr><td>Web/API stateless עם 3+ replicas, CI runners, batch/ETL עם checkpoints, queue workers, dev/test, rendering, אימון ML עם checkpoints</td><td>Kafka consumers (סערות rebalance), Spark executors (לא ה-driver), stateful sets שבונים replica מהר</td><td>כל דבר עם replica אחת, primary של DB, חברי quorum של ZooKeeper/etcd, jobs ארוכים בלי checkpoint, תוכנה עם רישיון שקשור ל-host</td></tr>
</table>
<p>Termination מסודר של Spot ב-Kubernetes זה בדיוק כמו drain רגיל של node, רק עם deadline קשיח:</p>
<ol>
<li>מגיע signal (IMDS/EventBridge) ← ה-handler עושה <strong>cordon</strong> ל-node ו-<strong>drain</strong> דרך ה-Eviction API.</li>
<li>ה-eviction מכבד <strong>PodDisruptionBudgets</strong> — אבל ה-VM מת ב-T+120 שניות בכל מקרה. PDB שחוסם את ה-drain רק אומר שה-Pod-ים ימותו בצורה לא נקייה.</li>
<li>ה-Pod מקבל <code>SIGTERM</code> → <code>preStop</code> hook ← האפליקציה מפסיקה לקבל בקשות, מסיימת עבודה פתוחה ← יוצאת בתוך <code>terminationGracePeriodSeconds</code>.</li>
<li>ה-endpoints יורדים; ה-LB מוריד את ה-target (תגדיר ב-ALB deregistration delay של עד ~60 שניות, לא 300 של ברירת המחדל).</li>
</ol>
<pre>spec:
  terminationGracePeriodSeconds: 60      # must fit inside the notice (AWS 120 s, GCP/Azure ~30 s)
  containers:
  - name: api
    lifecycle:
      preStop: { exec: { command: ["sleep", "10"] } }   # let endpoints/LB catch up
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: api }
spec: { maxUnavailable: 1, selector: { matchLabels: { app: api } } }</pre>
<p>ל-batch: עושים <strong>checkpoint</strong> כל כמה דקות ל-S3/GCS (Spark, <code>torch.save</code> של PyTorch, offsets משלך), כותבים tasks אידמפוטנטיים, ועושים retry. תפזר replicas עם <code>topologySpreadConstraints</code> על <code>topology.kubernetes.io/zone</code> ועל <code>karpenter.sh/capacity-type</code>, כדי שגל אחד לא ייקח את כל ה-replicas.</p>`)
    },
    {
      h: t("Savings math and the on-demand fallback", "חשבון החיסכון וה-fallback ל-on-demand"),
      body: t(
`<p>Worked example (us-east-1, illustrative — check current pricing): 60 × <code>m6i.xlarge</code> at ~$0.192/h on-demand = <strong>~$8,410/month</strong>. Spot for the same pools typically lands at ~$0.06-0.08/h.</p>
<table>
<tr><th>Mix</th><th>Monthly</th><th>Saving</th></tr>
<tr><td>100% on-demand</td><td>~$8,410</td><td>—</td></tr>
<tr><td>20% on-demand floor (covered by a Savings Plan) + 80% spot @ $0.07</td><td>~$1,350 + ~$2,450 ≈ $3,800</td><td>~55%</td></tr>
<tr><td>Same, but spot unavailable 10% of hours → on-demand fallback</td><td>≈ $4,400</td><td>~48%</td></tr>
</table>
<p>Budget for the fallback: <strong>the capacity you need must always be buyable</strong>, even if at on-demand price. Things that break fallback:</p>
<ul>
<li>A NodePool/ASG that allows <em>only</em> spot — pods sit <code>Pending</code> during a capacity crunch.</li>
<li>On-demand <strong>vCPU service quotas</strong> sized for the 20% floor, not for 100% — request quota for the worst case.</li>
<li>Pinning to one AZ or one instance family.</li>
</ul>
<blockquote>💡 Real world: teams that run 70-90% of their stateless EKS capacity on spot with Karpenter commonly report compute bills down 50-70%, with interruption-caused errors invisible in SLOs — because each interruption is just a routine drain of ~1-3% of nodes.</blockquote>
<p>Measure it: track <code>karpenter_nodeclaims_disrupted_total{reason="interruption"}</code> (or ASG <code>EC2 Instance Terminate</code> events), the spot share of vCPU-hours, and 5xx/latency around interruption timestamps.</p>`,
`<p>דוגמה מחושבת (us-east-1, להמחשה — תבדוק מחירים עדכניים): 60 × <code>m6i.xlarge</code> ב-~$0.192 לשעה on-demand = <strong>~$8,410 לחודש</strong>. Spot לאותם pools יוצא בדרך כלל ~$0.06-0.08 לשעה.</p>
<table>
<tr><th>תמהיל</th><th>לחודש</th><th>חיסכון</th></tr>
<tr><td>100% on-demand</td><td>~$8,410</td><td>—</td></tr>
<tr><td>רצפה של 20% on-demand (מכוסה ב-Savings Plan) + 80% Spot ב-$0.07</td><td>~$1,350 + ~$2,450 ≈ $3,800</td><td>~55%</td></tr>
<tr><td>אותו דבר, אבל אין Spot ב-10% מהשעות ← fallback ל-on-demand</td><td>≈ $4,400</td><td>~48%</td></tr>
</table>
<p>תתכנן תקציב ל-fallback: <strong>הקיבולת שאתה צריך חייבת תמיד להיות זמינה לקנייה</strong>, גם אם במחיר on-demand. מה שובר fallback:</p>
<ul>
<li>NodePool/ASG שמאפשר <em>רק</em> Spot — Pod-ים תקועים ב-<code>Pending</code> כשאין קיבולת.</li>
<li><strong>Service quotas של vCPU</strong> ל-on-demand שמותאמות לרצפה של 20%, לא ל-100% — תבקש quota לתרחיש הגרוע.</li>
<li>נעילה ל-AZ אחד או למשפחת instance אחת.</li>
</ul>
<blockquote>💡 Real world: צוותים שמריצים 70-90% מהקיבולת ה-stateless שלהם ב-EKS על Spot עם Karpenter מדווחים הרבה פעמים על ירידה של 50-70% בחשבון ה-compute, בלי ששגיאות מ-interruptions מופיעות ב-SLOs — כי כל interruption הוא בסך הכל drain שגרתי של ~1-3% מה-nodes.</blockquote>
<p>תמדוד: <code>karpenter_nodeclaims_disrupted_total{reason="interruption"}</code> (או אירועי <code>EC2 Instance Terminate</code> של ASG), את החלק של Spot מתוך שעות ה-vCPU, ו-5xx/latency סביב זמני ה-interruptions.</p>`)
    }
  ],
  diagram: "EventBridge (spot warning / rebalance) -> SQS -> Karpenter\n   Karpenter: launch replacement -> cordon -> drain (PDB) -> SIGTERM -> preStop -> exit\n   T+0s .................................................. T+120s VM terminated",
  handsOn: [
    { cmd: "curl -s -H \"X-aws-ec2-metadata-token: $(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')\" http://169.254.169.254/latest/meta-data/spot/instance-action",
      what: t("On a spot instance: 404 means no interruption scheduled; JSON {\"action\":\"terminate\",\"time\":...} means you have ~2 minutes.", "על instance של Spot: 404 אומר שאין interruption מתוכנן; JSON עם action ו-time אומר שיש לך בערך 2 דקות.") },
    { cmd: "aws ec2 describe-spot-price-history --instance-types m6i.xlarge m7i.xlarge c6i.2xlarge --product-descriptions Linux/UNIX --start-time $(date -u +%Y-%m-%dT%H:%M:%S) --query 'SpotPriceHistory[].[AvailabilityZone,InstanceType,SpotPrice]' --output table",
      what: t("Current spot price per pool (type × AZ). Compare with on-demand to see the real discount.", "מחיר Spot נוכחי לכל pool (סוג × AZ). תשווה ל-on-demand כדי לראות את ההנחה האמיתית.") },
    { cmd: "aws ec2 get-spot-placement-scores --instance-types m6i.xlarge m6a.xlarge m7i.xlarge --target-capacity 50 --region-names us-east-1 --single-availability-zone",
      what: t("Spot placement score (1-10): how likely a request for 50 instances succeeds per AZ. Low scores = add more types.", "Spot placement score (1-10): כמה סביר שבקשה ל-50 instances תצליח בכל AZ. ציון נמוך = תוסיף עוד סוגים.") },
    { cmd: "kubectl get nodes -L karpenter.sh/capacity-type,node.kubernetes.io/instance-type,topology.kubernetes.io/zone",
      what: t("See the spot/on-demand mix, instance types and zones of your nodes at a glance.", "לראות במבט אחד את התמהיל של Spot מול on-demand, סוגי instance ו-zones של ה-nodes.") },
    { cmd: "aws fis start-experiment --experiment-template-id EXT1a2b3c4d5e6f7  # template uses action aws:ec2:send-spot-instance-interruptions",
      what: t("Use AWS Fault Injection Service (action aws:ec2:send-spot-instance-interruptions) to rehearse a real interruption in staging.", "תשתמש ב-AWS Fault Injection Service (action aws:ec2:send-spot-instance-interruptions) כדי לתרגל interruption אמיתי ב-staging.") }
  ],
  mnemonic: t("Spot = FLEX: Flexible types, Lots of AZs, Exit gracefully (drain in 2 min / 30 s), X-fallback to on-demand.", "Spot = FLEX: Flexible types, Lots of AZs, Exit gracefully (drain ב-2 דקות או 30 שניות), X-fallback ל-on-demand."),
  pitfalls: [
    t("One instance type in one AZ: a single capacity event wipes the whole fleet. Diversify across 10+ types and all AZs.", "סוג instance אחד ב-AZ אחד: אירוע קיבולת אחד מוחק את כל ה-fleet. תפזר על 10+ סוגים וכל ה-AZs."),
    t("terminationGracePeriodSeconds: 300 on spot nodes. The VM dies at 120 s (30 s on GCP/Azure) no matter what Kubernetes thinks.", "terminationGracePeriodSeconds: 300 על nodes של Spot. ה-VM מת אחרי 120 שניות (30 ב-GCP וב-Azure) לא משנה מה Kubernetes חושב."),
    t("Spot-only NodePools with no on-demand fallback and on-demand quota sized for the floor — capacity crunch = Pending pods = outage.", "NodePools של Spot בלבד בלי fallback ל-on-demand, ו-quota של on-demand שמתאים רק לרצפה — מחסור בקיבולת = Pod-ים ב-Pending = outage."),
    t("Running Karpenter's interruption handling AND Node Termination Handler together: two controllers fighting over the same node.", "להריץ גם את הטיפול ב-interruptions של Karpenter וגם את Node Termination Handler: שני controllers שרבים על אותו node.")
  ],
  interview: [
    { q: t("How would you move a stateless EKS service to spot safely?", "איך היית מעביר סרוויס stateless ב-EKS ל-Spot בבטחה?"),
      a: t("Karpenter NodePool with capacity-type [spot, on-demand] and 10+ instance types across all AZs (price-capacity-optimized), interruption queue enabled; app has 3+ replicas, a PDB, topology spread across zones and capacity types, graceful SIGTERM handling with grace period under 120 s; critical controllers on on-demand; rehearse with FIS; watch SLO burn during interruption events; raise on-demand quotas for full fallback.", "NodePool של Karpenter עם capacity-type [spot, on-demand] ו-10+ סוגי instance בכל ה-AZs (price-capacity-optimized), עם interruption queue; לאפליקציה 3+ replicas, PDB, topology spread על zones ועל סוגי קיבולת, טיפול מסודר ב-SIGTERM עם grace period מתחת ל-120 שניות; controllers קריטיים על on-demand; תרגול עם FIS; מעקב אחרי SLO burn בזמן interruptions; הגדלת quotas של on-demand ל-fallback מלא.") },
    { q: t("Why is capacity-optimized usually better than lowest-price, even though it costs more per hour?", "למה capacity-optimized בדרך כלל עדיף על lowest-price, למרות שהוא יקר יותר לשעה?"),
      a: t("The cheapest pools are cheap because they're shallow, so they're interrupted most. Each interruption costs churn: cold caches, rescheduling, retries, sometimes errors. Price-capacity-optimized picks deep pools first and then the cheapest of those — a few cents more per hour for far fewer disruptions.", "ה-pools הכי זולים זולים כי הם רדודים, ולכן נלקחים הכי הרבה. כל interruption עולה ב-churn: caches קרים, rescheduling, retries, ולפעמים שגיאות. price-capacity-optimized בוחר קודם pools עמוקים ורק אז את הזולים מתוכם — כמה סנטים יותר לשעה תמורת הרבה פחות הפרעות.") }
  ],
  quiz: [
    { q: t("How much notice does AWS give before reclaiming a spot instance, versus GCP and Azure?", "כמה זמן התראה נותן AWS לפני שהוא לוקח instance של Spot, לעומת GCP ו-Azure?"),
      options: [t("30 s on all three", "30 שניות בכולם"), t("2 minutes on AWS, ~30 s on GCP and Azure", "2 דקות ב-AWS, בערך 30 שניות ב-GCP וב-Azure"), t("5 minutes on AWS, 2 minutes elsewhere", "5 דקות ב-AWS, 2 דקות באחרים"), t("No notice anywhere", "אין התראה באף אחד")],
      answer: 1, explain: t("AWS: 2-minute interruption warning (plus an optional earlier rebalance recommendation). GCP Spot VMs and Azure Spot VMs: about 30 seconds.", "ב-AWS: התראת interruption של 2 דקות (ולפעמים rebalance recommendation מוקדם יותר). ב-GCP Spot VMs וב-Azure Spot VMs: בערך 30 שניות.") },
    { q: t("Your spot fleet keeps losing most nodes at once. What's the most likely design fix?", "ה-fleet שלך ב-Spot מאבד את רוב ה-nodes בבת אחת שוב ושוב. מה תיקון התכנון הכי סביר?"),
      options: [t("Raise the max spot price", "להעלות את המחיר המקסימלי ל-Spot"), t("Switch to lowest-price allocation", "לעבור ל-allocation של lowest-price"), t("Diversify across many instance types and all AZs with price-capacity-optimized", "לפזר על הרבה סוגי instance וכל ה-AZs עם price-capacity-optimized"), t("Increase terminationGracePeriodSeconds", "להגדיל את terminationGracePeriodSeconds")],
      answer: 2, explain: t("Correlated loss means you're concentrated in few pools. More pools (type × AZ) plus capacity-aware allocation spreads the risk. Max price rarely matters since bidding ended.", "אובדן מתואם אומר שאתה מרוכז בכמה pools בודדים. יותר pools (סוג × AZ) ו-allocation שמתחשב בקיבולת מפזרים את הסיכון. המחיר המקסימלי כמעט לא משנה מאז שה-bidding בוטל.") },
    { q: t("Which workload should stay OFF spot?", "איזה workload צריך להישאר מחוץ ל-Spot?"),
      options: [t("CI runners", "CI runners"), t("A 3-member etcd quorum", "quorum של etcd עם 3 חברים"), t("Stateless API with 6 replicas", "API stateless עם 6 replicas"), t("A Spark job that checkpoints to S3", "Spark job שעושה checkpoint ל-S3")],
      answer: 1, explain: t("Losing 2 of 3 quorum members in one interruption wave loses quorum — writes stop. Quorum systems and single-replica stateful services belong on on-demand.", "איבוד 2 מתוך 3 חברי quorum בגל interruptions אחד מאבד את ה-quorum — הכתיבות נעצרות. מערכות quorum וסרוויסים stateful עם replica אחת שייכים ל-on-demand.") },
    { q: t("A PDB with minAvailable equal to the replica count is set on a spot workload. What happens on interruption?", "על workload ב-Spot מוגדר PDB עם minAvailable ששווה למספר ה-replicas. מה קורה ב-interruption?"),
      options: [t("AWS delays the interruption until the PDB allows it", "AWS דוחה את ה-interruption עד שה-PDB מאשר"), t("The drain is blocked, and the pod is killed uncleanly when the VM terminates", "ה-drain נחסם, וה-Pod נהרג בצורה לא נקייה כשה-VM נכבה"), t("Karpenter switches the node to on-demand in place", "Karpenter הופך את ה-node ל-on-demand במקום"), t("The pod migrates live to another node", "ה-Pod עובר live ל-node אחר")],
      answer: 1, explain: t("The cloud doesn't know about PDBs. An overly strict PDB just blocks graceful eviction; the VM still dies at the deadline.", "הענן לא יודע מה זה PDB. PDB קשוח מדי רק חוסם eviction מסודר; ה-VM עדיין מת ב-deadline.") }
  ],
  playground: "scheduler",
  related: ["cloud-finops", "k8s-cost", "k8s-node-autoprovisioning", "k8s-scheduling", "k8s-day2-upgrades", "cloud-commitments"]
});

window.INFRA.glossary.push(
  { term: "Spot interruption notice", track: "cloud", def: t("The warning before a spot VM is reclaimed: 2 minutes on AWS (IMDS spot/instance-action, EventBridge), ~30 seconds on GCP and Azure.", "ההתראה לפני ש-VM של Spot נלקח: 2 דקות ב-AWS (IMDS spot/instance-action, EventBridge), בערך 30 שניות ב-GCP וב-Azure."), lesson: "cloud-spot-instances" },
  { term: "Price-capacity-optimized", track: "cloud", def: t("AWS spot allocation strategy that picks the pools with the most spare capacity, then the cheapest among them — fewer interruptions than lowest-price.", "אסטרטגיית allocation של Spot ב-AWS שבוחרת את ה-pools עם הכי הרבה קיבולת פנויה, ומתוכם את הזולים — פחות interruptions מ-lowest-price."), lesson: "cloud-spot-instances" },
  { term: "Node Termination Handler", track: "cloud", def: t("AWS controller that watches spot/rebalance/maintenance events and cordons and drains the Kubernetes node before the VM goes away. Not needed with Karpenter's interruption queue.", "Controller של AWS שמאזין לאירועי Spot, rebalance ותחזוקה ועושה cordon ו-drain ל-node ב-Kubernetes לפני שה-VM נעלם. לא צריך אותו עם ה-interruption queue של Karpenter."), lesson: "cloud-spot-instances" }
);

/* ------------------------------------------------------- 2. Commitments */
window.INFRA.lessons.push({
  id: "cloud-commitments",
  track: "cloud",
  order: 71,
  icon: "📜",
  level: 3,
  minutes: 14,
  title: t("Commitments & Pricing Models: Savings Plans, RIs, CUDs and ARM", "התחייבויות ומודלי תמחור: Savings Plans, RIs, CUDs ו-ARM"),
  tldr: t(
    "Right-size first, then commit to the steady baseline you'll run anyway (Savings Plans / CUDs / reservations, 30-72% off), keep the variable part on spot or on-demand, and switch to ARM (Graviton, Axion, Cobalt) for another ~20% per unit of work. Watch two numbers: coverage (how much usage is committed) and utilization (how much of the commitment you actually use).",
    "קודם עושים right-sizing, אחר כך מתחייבים על ה-baseline היציב שתריץ בכל מקרה (Savings Plans, CUDs, reservations, הנחה של 30-72%), משאירים את החלק המשתנה על Spot או on-demand, ועוברים ל-ARM (Graviton, Axion, Cobalt) בשביל עוד ~20% ליחידת עבודה. עוקבים אחרי שני מספרים: coverage (כמה מהשימוש מכוסה בהתחייבות) ו-utilization (כמה מההתחייבות אתה באמת מנצל)."
  ),
  analogy: t(
    "Commitments are a gym membership versus paying per visit. If you go four times a week, the annual plan is a steal; if you sign up in January and stop in February, you've paid for a year of nothing. A smart commuter buys a monthly train pass for the daily ride (the baseline), pays per ride for the occasional trip (on-demand), and grabs last-minute discount seats for flexible travel (spot).",
    "התחייבות זה מנוי לחדר כושר מול תשלום לפי כניסה. אם אתה הולך ארבע פעמים בשבוע, מנוי שנתי זה מציאה; אם נרשמת בינואר והפסקת בפברואר — שילמת על שנה של כלום. נוסע חכם קונה חופשי-חודשי לרכבת לנסיעה היומית (ה-baseline), משלם לפי נסיעה על טיולים מזדמנים (on-demand), ותופס מושבים בהנחה של הרגע האחרון לנסיעות גמישות (Spot)."
  ),
  sections: [
    {
      h: t("The menu: what each provider sells", "התפריט: מה כל ספק מוכר"),
      body: t(
`<table>
<tr><th>Instrument</th><th>Commit to</th><th>Max discount*</th><th>Flexibility</th></tr>
<tr><td><strong>AWS Compute Savings Plan</strong></td><td>$/hour of spend, 1 or 3 years</td><td>~66%</td><td>Any EC2 family, size, region, OS + Fargate + Lambda</td></tr>
<tr><td><strong>AWS EC2 Instance Savings Plan</strong></td><td>$/hour for one family in one region (e.g. m7g in eu-west-1)</td><td>~72%</td><td>Any size/OS/AZ within that family</td></tr>
<tr><td><strong>AWS Reserved Instances</strong></td><td>Specific instance attributes</td><td>~72% (Standard)</td><td>Today mainly for <strong>RDS, ElastiCache, OpenSearch, Redshift</strong>; AWS also added Database Savings Plans — check what covers your engines</td></tr>
<tr><td><strong>GCP resource-based CUD</strong></td><td>vCPU + memory of a machine series in a region</td><td>~55% (up to ~70% memory-optimized)</td><td>Any shape in that series/region</td></tr>
<tr><td><strong>GCP spend-based (flexible) CUD</strong></td><td>$/hour of compute spend</td><td>~28% (1y) / ~46% (3y)</td><td>Across series and regions</td></tr>
<tr><td>GCP Sustained Use Discounts</td><td>Nothing — automatic</td><td>up to ~30% on some series (N1/N2)</td><td>Applied when a VM runs most of the month</td></tr>
<tr><td><strong>Azure Reservations</strong></td><td>VM size/family in a region</td><td>~72%</td><td>Instance size flexibility within the group; exchangeable</td></tr>
<tr><td><strong>Azure Savings Plan for compute</strong></td><td>$/hour, 1 or 3 years</td><td>~65%</td><td>Across VM families and regions, plus some PaaS compute</td></tr>
</table>
<p>*Maximums are for 3-year, all-upfront on the friendliest SKUs. A typical 1-year no-upfront Compute Savings Plan is closer to <strong>25-30%</strong>. Check current pricing — the rates change by family and region.</p>
<p><strong>Payment options</strong> (AWS): all upfront, partial upfront, no upfront. Upfront adds only a few percentage points; most finance teams prefer no-upfront unless cash is cheap.</p>
<blockquote>💡 Real world: Savings Plans apply automatically every hour to the usage with the highest discount first. You don't "attach" them to instances — which is exactly why they survive migrations, resizes and Karpenter churn far better than old-style RIs.</blockquote>`,
`<table>
<tr><th>מכשיר</th><th>מתחייבים על</th><th>הנחה מקסימלית*</th><th>גמישות</th></tr>
<tr><td><strong>AWS Compute Savings Plan</strong></td><td>$ לשעה של הוצאה, 1 או 3 שנים</td><td>~66%</td><td>כל משפחת EC2, גודל, region, OS + Fargate + Lambda</td></tr>
<tr><td><strong>AWS EC2 Instance Savings Plan</strong></td><td>$ לשעה למשפחה אחת ב-region אחד (למשל m7g ב-eu-west-1)</td><td>~72%</td><td>כל גודל, OS ו-AZ בתוך המשפחה</td></tr>
<tr><td><strong>AWS Reserved Instances</strong></td><td>מאפייני instance ספציפיים</td><td>~72% (Standard)</td><td>היום בעיקר ל-<strong>RDS, ElastiCache, OpenSearch, Redshift</strong>; AWS הוסיפו גם Database Savings Plans — תבדוק מה מכסה את ה-engines שלך</td></tr>
<tr><td><strong>GCP resource-based CUD</strong></td><td>vCPU וזיכרון של machine series ב-region</td><td>~55% (עד ~70% ב-memory-optimized)</td><td>כל shape באותה series ו-region</td></tr>
<tr><td><strong>GCP spend-based (flexible) CUD</strong></td><td>$ לשעה של הוצאת compute</td><td>~28% (שנה) / ~46% (3 שנים)</td><td>בין series ובין regions</td></tr>
<tr><td>GCP Sustained Use Discounts</td><td>כלום — אוטומטי</td><td>עד ~30% בחלק מה-series (N1/N2)</td><td>חל כש-VM רץ רוב החודש</td></tr>
<tr><td><strong>Azure Reservations</strong></td><td>גודל או משפחת VM ב-region</td><td>~72%</td><td>גמישות גודל בתוך הקבוצה; אפשר להחליף</td></tr>
<tr><td><strong>Azure Savings Plan for compute</strong></td><td>$ לשעה, 1 או 3 שנים</td><td>~65%</td><td>בין משפחות VM ו-regions, וגם חלק מה-PaaS compute</td></tr>
</table>
<p>*המקסימום הוא ל-3 שנים, all upfront, על ה-SKUs הכי נוחים. Compute Savings Plan טיפוסי לשנה בלי upfront קרוב יותר ל-<strong>25-30%</strong>. תבדוק מחירים עדכניים — התעריפים משתנים לפי משפחה ו-region.</p>
<p><strong>אפשרויות תשלום</strong> (AWS): all upfront, partial upfront, no upfront. תשלום מראש מוסיף רק כמה נקודות אחוז; רוב צוותי הכספים מעדיפים no upfront אלא אם הכסף זול.</p>
<blockquote>💡 Real world: Savings Plans חלים אוטומטית כל שעה על השימוש עם ההנחה הכי גבוהה קודם. לא "מצמידים" אותם ל-instances — וזו בדיוק הסיבה שהם שורדים מיגרציות, שינויי גודל ו-churn של Karpenter הרבה יותר טוב מ-RIs בסגנון הישן.</blockquote>`)
    },
    {
      h: t("Coverage vs utilization, and the layering strategy", "Coverage מול utilization, ואסטרטגיית השכבות"),
      body: t(
`<ul>
<li><strong>Coverage</strong> = committed-rate usage ÷ total eligible usage. Low coverage = you're overpaying on-demand for steady load.</li>
<li><strong>Utilization</strong> = commitment actually consumed ÷ commitment purchased. Below 100% = you're paying for nothing. Unused Savings Plan hours are <strong>lost forever</strong> — they don't roll over.</li>
</ul>
<p>You want utilization ≈ 100% and coverage around <strong>70-85% of the baseline</strong>, not 100% of peak. Layer it like a cake, cheapest-but-most-rigid at the bottom:</p>
<pre>  usage ▲
        │        /\    /\        ← peaks: on-demand (or spot)
        │  /\/\_/  \/\/  \/\     ← daily variable: spot / on-demand
        │━━━━━━━━━━━━━━━━━━━━━   ← flexible layer: Compute SP / spend-based CUD / Azure SP
        │███████████████████     ← rigid core: EC2 Instance SP / resource CUD / reservation
        └────────────────────▶ time (look at the MINIMUM of the last 30-60 days)</pre>
<ol>
<li><strong>Rigid core</strong>: what you're certain about for 1-3 years (e.g. the always-on DB fleet, a family you've standardized on).</li>
<li><strong>Flexible layer</strong>: Compute Savings Plans — survive family changes and the ARM migration you're planning.</li>
<li><strong>Variable</strong>: spot for fault-tolerant work, on-demand for the rest.</li>
</ol>
<blockquote>⚠️ Production tip: buy in <strong>tranches</strong> (e.g. every month or quarter, a slice) instead of one big purchase. Commitments then expire on a rolling schedule, and you're never stuck with a huge 3-year bet the month after a re-architecture.</blockquote>`,
`<ul>
<li><strong>Coverage</strong> = שימוש בתעריף התחייבות ÷ כל השימוש שזכאי. Coverage נמוך = אתה משלם on-demand ביוקר על עומס יציב.</li>
<li><strong>Utilization</strong> = כמה מההתחייבות נוצל בפועל ÷ כמה נקנה. מתחת ל-100% = אתה משלם על כלום. שעות Savings Plan שלא נוצלו <strong>הולכות לאיבוד</strong> — הן לא עוברות הלאה.</li>
</ul>
<p>אתה רוצה utilization של ≈ 100% ו-coverage של בערך <strong>70-85% מה-baseline</strong>, לא 100% מה-peak. בונים את זה בשכבות כמו עוגה, הכי זול והכי קשיח למטה:</p>
<pre>  usage ▲
        │        /\    /\        ← peaks: on-demand (or spot)
        │  /\/\_/  \/\/  \/\     ← daily variable: spot / on-demand
        │━━━━━━━━━━━━━━━━━━━━━   ← flexible layer: Compute SP / spend-based CUD / Azure SP
        │███████████████████     ← rigid core: EC2 Instance SP / resource CUD / reservation
        └────────────────────▶ time (look at the MINIMUM of the last 30-60 days)</pre>
<ol>
<li><strong>ליבה קשיחה</strong>: מה שאתה בטוח בו ל-1-3 שנים (למשל ה-fleet של ה-DB שתמיד דולק, משפחה שכבר עשית עליה סטנדרטיזציה).</li>
<li><strong>שכבה גמישה</strong>: Compute Savings Plans — שורדים החלפת משפחה ואת המיגרציה ל-ARM שאתה מתכנן.</li>
<li><strong>משתנה</strong>: Spot לעבודה שסובלת תקלות, on-demand לשאר.</li>
</ol>
<blockquote>⚠️ Production tip: תקנה ב-<strong>מנות</strong> (למשל פרוסה כל חודש או רבעון) במקום רכישה אחת גדולה. ככה ההתחייבויות פגות בלוח זמנים מתגלגל, ואתה אף פעם לא תקוע עם הימור ענק ל-3 שנים חודש אחרי שינוי ארכיטקטורה.</blockquote>`)
    },
    {
      h: t("Break-even math, worked", "חשבון break-even, דוגמה מלאה"),
      body: t(
`<p>The core rule: a commitment with discount <code>d</code> beats on-demand if the covered capacity runs more than <code>(1 − d)</code> of the hours. At 30% off, you need it busy &gt; 70% of the time; at 60% off (3-year), just &gt; 40%.</p>
<p>Example (illustrative prices — check current pricing): your fleet's on-demand compute spend over the last 60 days had a <strong>floor of $40/hour</strong> and averages $55/hour.</p>
<table>
<tr><th>Option</th><th>Math</th><th>Monthly (730 h)</th></tr>
<tr><td>All on-demand</td><td>$55 × 730</td><td>$40,150</td></tr>
<tr><td>Commit $28/h (1y Compute SP, ~30% off) — covers $40/h of on-demand-equivalent usage</td><td>$28 × 730 + ($55 − $40) × 730</td><td>$20,440 + $10,950 = <strong>$31,390</strong> (−22%)</td></tr>
<tr><td>Over-commit $42/h — covers $60/h, more than you ever use</td><td>$42 × 730, utilization ~92% at average, ~67% at the floor</td><td>$30,660, but you lose money every off-peak hour; any downsizing makes it worse</td></tr>
</table>
<p>Note that a Savings Plan commitment is expressed in <em>discounted</em> dollars: $28/h of commitment buys ~$40/h of on-demand-priced usage at 30% off.</p>
<p>Risk check before signing a 3-year deal: is there a migration (containers → serverless, x86 → ARM, region move) on the roadmap? If yes, prefer the flexible instrument even at a lower discount. The 6% you give up is cheaper than 30 months of unused commitment.</p>
<blockquote>💡 Real world: AWS Cost Explorer → Savings Plans → <em>Recommendations</em> computes this for a 7/30/60-day lookback. Treat it as an upper bound: it assumes the past repeats and doesn't know you're about to right-size.</blockquote>`,
`<p>החוק המרכזי: התחייבות עם הנחה <code>d</code> משתלמת יותר מ-on-demand אם הקיבולת המכוסה רצה יותר מ-<code>(1 − d)</code> מהשעות. בהנחה של 30% צריך שהיא תהיה עסוקה &gt; 70% מהזמן; בהנחה של 60% (3 שנים), מספיק &gt; 40%.</p>
<p>דוגמה (מחירים להמחשה — תבדוק מחירים עדכניים): הוצאת ה-compute ב-on-demand של ה-fleet שלך ב-60 הימים האחרונים הייתה עם <strong>רצפה של $40 לשעה</strong> וממוצע של $55 לשעה.</p>
<table>
<tr><th>אפשרות</th><th>חישוב</th><th>לחודש (730 שעות)</th></tr>
<tr><td>הכל on-demand</td><td>$55 × 730</td><td>$40,150</td></tr>
<tr><td>התחייבות של $28 לשעה (Compute SP לשנה, ~30% הנחה) — מכסה $40 לשעה של שימוש במחיר on-demand</td><td>$28 × 730 + ($55 − $40) × 730</td><td>$20,440 + $10,950 = <strong>$31,390</strong> (−22%)</td></tr>
<tr><td>התחייבות יתר של $42 לשעה — מכסה $60 לשעה, יותר ממה שאתה משתמש אי פעם</td><td>$42 × 730, utilization של ~92% בממוצע, ~67% ברצפה</td><td>$30,660, אבל אתה מפסיד כסף בכל שעת שפל; כל הקטנה רק מחמירה</td></tr>
</table>
<p>שים לב שהתחייבות של Savings Plan נמדדת בדולרים <em>אחרי הנחה</em>: התחייבות של $28 לשעה קונה ~$40 לשעה של שימוש במחיר on-demand בהנחה של 30%.</p>
<p>בדיקת סיכון לפני שחותמים על 3 שנים: יש מיגרציה ב-roadmap (containers ל-serverless, x86 ל-ARM, מעבר region)? אם כן, תעדיף את המכשיר הגמיש גם בהנחה נמוכה יותר. ה-6% שאתה מוותר עליהם זולים יותר מ-30 חודשים של התחייבות לא מנוצלת.</p>
<blockquote>💡 Real world: ב-AWS Cost Explorer ← Savings Plans ← <em>Recommendations</em> מחשבים את זה לפי lookback של 7/30/60 ימים. תתייחס לזה כחסם עליון: זה מניח שהעבר חוזר ולא יודע שאתה עומד לעשות right-sizing.</blockquote>`)
    },
    {
      h: t("Right-size first, then commit", "קודם right-sizing, אחר כך התחייבות"),
      body: t(
`<p>Committing before right-sizing locks in waste for 1-3 years. Order of operations:</p>
<ol>
<li><strong>Kill idle</strong>: unattached EBS volumes, old snapshots, stopped-but-paid resources, idle load balancers, dev environments running nights and weekends (scheduling dev to 50 h/week saves ~70%).</li>
<li><strong>Right-size</strong>: AWS Compute Optimizer, Azure Advisor, GCP Recommender, or for Kubernetes VPA recommendations / Kubecost. Typical finding: p95 CPU under 20% on half the fleet.</li>
<li><strong>Modernize</strong>: newer generations (m5 → m7i/m7g) are usually cheaper per unit of work; gp2 → gp3 saves ~20% on EBS.</li>
<li><strong>Then commit</strong> to the new, lower floor.</li>
</ol>
<pre># AWS: right-sizing findings for EC2
aws compute-optimizer get-ec2-instance-recommendations \
  --query 'instanceRecommendations[].[instanceArn,finding,currentInstanceType,recommendationOptions[0].instanceType]' \
  --output table

# Savings Plans utilization and coverage for last month
aws ce get-savings-plans-utilization --time-period Start=2026-10-01,End=2026-11-01
aws ce get-savings-plans-coverage   --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY</pre>
<blockquote>⚠️ Production tip: the commitment purchase is a <strong>finance + engineering</strong> decision. Share the plan (amount, term, expected coverage, roadmap risks) with the teams whose services make up the baseline — they're the ones who might accidentally make it obsolete.</blockquote>`,
`<p>התחייבות לפני right-sizing נועלת בזבוז ל-1-3 שנים. סדר הפעולות:</p>
<ol>
<li><strong>להרוג idle</strong>: EBS volumes לא מחוברים, snapshots ישנים, משאבים שעצורים אבל משלמים עליהם, load balancers ריקים, סביבות dev שרצות בלילות ובסופי שבוע (תזמון dev ל-50 שעות בשבוע חוסך ~70%).</li>
<li><strong>Right-sizing</strong>: AWS Compute Optimizer, Azure Advisor, GCP Recommender, או ב-Kubernetes המלצות VPA / Kubecost. ממצא טיפוסי: CPU ב-p95 מתחת ל-20% בחצי מה-fleet.</li>
<li><strong>מודרניזציה</strong>: דורות חדשים (m5 ל-m7i/m7g) בדרך כלל זולים יותר ליחידת עבודה; מעבר מ-gp2 ל-gp3 חוסך ~20% ב-EBS.</li>
<li><strong>ואז מתחייבים</strong> על הרצפה החדשה והנמוכה יותר.</li>
</ol>
<pre># AWS: right-sizing findings for EC2
aws compute-optimizer get-ec2-instance-recommendations \
  --query 'instanceRecommendations[].[instanceArn,finding,currentInstanceType,recommendationOptions[0].instanceType]' \
  --output table

# Savings Plans utilization and coverage for last month
aws ce get-savings-plans-utilization --time-period Start=2026-10-01,End=2026-11-01
aws ce get-savings-plans-coverage   --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY</pre>
<blockquote>⚠️ Production tip: רכישת התחייבות היא החלטה של <strong>כספים + הנדסה</strong>. תשתף את התוכנית (סכום, תקופה, coverage צפוי, סיכונים ב-roadmap) עם הצוותים שהסרוויסים שלהם מרכיבים את ה-baseline — הם אלה שעלולים להפוך אותה למיותרת בלי לשים לב.</blockquote>`)
    },
    {
      h: t("ARM: Graviton, Axion, Cobalt — price-performance and migration", "ARM: Graviton, Axion, Cobalt — מחיר מול ביצועים ומיגרציה"),
      body: t(
`<p>ARM instances are typically <strong>~15-20% cheaper per hour</strong> than the x86 equivalent, and AWS claims up to <strong>40% better price-performance</strong> for Graviton. Example (us-east-1, check current pricing): <code>m7i.xlarge</code> ~$0.2016/h vs <code>m7g.xlarge</code> ~$0.1632/h (−19%), and for many Go/Java/Node workloads the Graviton box also does more requests per second. GCP has <strong>Axion</strong> (C4A), Azure has <strong>Cobalt 100</strong> (Dpsv6/Epsv6).</p>
<p>Migration steps:</p>
<ol>
<li><strong>Inventory blockers</strong>: native binaries, old base images with no arm64 variant, Python wheels/JNI libs without aarch64 builds, x86-only agents (security/APM).</li>
<li><strong>Build multi-arch images</strong> — one tag, a manifest list with both architectures:
<pre>docker buildx create --use --name multi
docker buildx build --platform linux/amd64,linux/arm64 \
  -t 1234.dkr.ecr.us-east-1.amazonaws.com/api:1.42 --push .
docker buildx imagetools inspect 1234.dkr.ecr.us-east-1.amazonaws.com/api:1.42</pre>
Emulated (QEMU) arm64 builds are slow — use native ARM CI runners (GitHub <code>ubuntu-24.04-arm</code>, CodeBuild ARM, Graviton self-hosted).</li>
<li><strong>Canary</strong>: let Karpenter allow both arches (<code>kubernetes.io/arch In [amd64, arm64]</code>), or pin 10% of replicas with a <code>nodeSelector: kubernetes.io/arch: arm64</code> Deployment; compare latency, errors, CPU per request.</li>
<li><strong>Roll out</strong> service by service, then re-plan commitments: an EC2 Instance SP for <code>m7i</code> won't cover <code>m7g</code> — another reason the flexible Compute SP belongs in the middle layer.</li>
</ol>
<blockquote>💡 Real world: managed services are the cheapest ARM wins — RDS/Aurora, ElastiCache, OpenSearch and Lambda on Graviton are a config change with no image rebuild, often ~10-20% cheaper.</blockquote>`,
`<p>Instances של ARM בדרך כלל <strong>זולים ב-~15-20% לשעה</strong> מהמקבילה ב-x86, ו-AWS טוענים לעד <strong>40% יותר price-performance</strong> ב-Graviton. דוגמה (us-east-1, תבדוק מחירים עדכניים): <code>m7i.xlarge</code> ב-~$0.2016 לשעה מול <code>m7g.xlarge</code> ב-~$0.1632 לשעה (−19%), ובהרבה workloads של Go, Java ו-Node ה-Graviton גם מטפל ביותר בקשות בשנייה. ל-GCP יש <strong>Axion</strong> (C4A), ול-Azure יש <strong>Cobalt 100</strong> (Dpsv6/Epsv6).</p>
<p>שלבי המיגרציה:</p>
<ol>
<li><strong>מיפוי חסמים</strong>: בינאריים native, base images ישנים בלי גרסת arm64, Python wheels או ספריות JNI בלי build ל-aarch64, agents שעובדים רק על x86 (אבטחה/APM).</li>
<li><strong>בניית images רב-ארכיטקטורה</strong> — tag אחד, manifest list עם שתי הארכיטקטורות:
<pre>docker buildx create --use --name multi
docker buildx build --platform linux/amd64,linux/arm64 \
  -t 1234.dkr.ecr.us-east-1.amazonaws.com/api:1.42 --push .
docker buildx imagetools inspect 1234.dkr.ecr.us-east-1.amazonaws.com/api:1.42</pre>
build של arm64 באמולציה (QEMU) איטי — תשתמש ב-CI runners של ARM (ב-GitHub <code>ubuntu-24.04-arm</code>, CodeBuild ARM, או Graviton שאתה מנהל).</li>
<li><strong>Canary</strong>: תן ל-Karpenter לאפשר את שתי הארכיטקטורות (<code>kubernetes.io/arch In [amd64, arm64]</code>), או תצמיד 10% מה-replicas עם Deployment שיש לו <code>nodeSelector: kubernetes.io/arch: arm64</code>; תשווה latency, שגיאות ו-CPU לבקשה.</li>
<li><strong>Rollout</strong> סרוויס אחרי סרוויס, ואז תכנון מחדש של ההתחייבויות: EC2 Instance SP על <code>m7i</code> לא יכסה <code>m7g</code> — עוד סיבה שה-Compute SP הגמיש שייך לשכבה האמצעית.</li>
</ol>
<blockquote>💡 Real world: השירותים המנוהלים הם הניצחונות הכי זולים ב-ARM — RDS/Aurora, ElastiCache, OpenSearch ו-Lambda על Graviton זה שינוי config בלי לבנות image מחדש, והרבה פעמים זול ב-~10-20%.</blockquote>`)
    }
  ],
  handsOn: [
    { cmd: "aws ce get-savings-plans-purchase-recommendation --savings-plans-type COMPUTE_SP --term-in-years ONE_YEAR --payment-option NO_UPFRONT --lookback-period-in-days THIRTY_DAYS",
      what: t("AWS's own recommendation: hourly commitment, estimated savings and expected utilization for a 1-year Compute SP.", "ההמלצה של AWS עצמם: התחייבות לשעה, חיסכון משוער ו-utilization צפוי ל-Compute SP לשנה.") },
    { cmd: "aws ce get-savings-plans-utilization --time-period Start=2026-10-01,End=2026-11-01",
      what: t("Is the commitment you already bought fully used? Anything below ~98% deserves a look.", "האם ההתחייבות שכבר קנית מנוצלת במלואה? כל דבר מתחת ל-~98% שווה בדיקה.") },
    { cmd: "aws compute-optimizer get-ec2-instance-recommendations --query 'instanceRecommendations[?finding==`OVER_PROVISIONED`].[currentInstanceType,recommendationOptions[0].instanceType]' --output table",
      what: t("Over-provisioned instances and the suggested smaller type — do this before committing.", "Instances עם הקצאת יתר והסוג הקטן שמוצע — לעשות את זה לפני שמתחייבים.") },
    { cmd: "docker buildx build --platform linux/amd64,linux/arm64 -t REGISTRY/app:TAG --push . && docker buildx imagetools inspect REGISTRY/app:TAG",
      what: t("Build and push a multi-arch image, then verify the manifest lists both linux/amd64 and linux/arm64.", "לבנות ולדחוף image רב-ארכיטקטורה, ולוודא שה-manifest מכיל גם linux/amd64 וגם linux/arm64.") },
    { cmd: "gcloud compute commitments list --format='table(name,region,plan,status,endTimestamp)'",
      what: t("GCP: list CUDs with plan (12/36 months) and end dates so renewals don't surprise you.", "GCP: רשימת CUDs עם plan (12 או 36 חודשים) ותאריכי סיום, כדי שחידושים לא יפתיעו אותך.") }
  ],
  mnemonic: t("Size, then sign, then switch: right-size → commit to the floor (not the peak) → move to ARM. Coverage says 'how much is covered', utilization says 'how much is wasted'.", "קודם מידה, אחר כך חתימה, ואז החלפה: right-sizing ← התחייבות על הרצפה (לא על ה-peak) ← מעבר ל-ARM. Coverage אומר כמה מכוסה, utilization אומר כמה מתבזבז."),
  pitfalls: [
    t("Committing to peak or average instead of the floor — utilization drops below 100% every quiet hour, and unused hours are gone.", "להתחייב על ה-peak או על הממוצע במקום על הרצפה — ה-utilization יורד מתחת ל-100% בכל שעה שקטה, ושעות לא מנוצלות הולכות לאיבוד."),
    t("Buying a 3-year EC2 Instance SP for m6i right before migrating to Graviton — it won't cover the new family.", "לקנות EC2 Instance SP ל-3 שנים על m6i רגע לפני מעבר ל-Graviton — הוא לא יכסה את המשפחה החדשה."),
    t("Forgetting that Savings Plans don't cover RDS/ElastiCache/OpenSearch the same way — those need RIs or the newer database-specific plans.", "לשכוח ש-Savings Plans לא מכסים RDS/ElastiCache/OpenSearch באותה צורה — הם צריכים RIs או את התוכניות החדשות שמיועדות ל-databases."),
    t("Multi-arch image with an x86-only sidecar or init container: the Pod lands on ARM and fails with 'exec format error'.", "Image רב-ארכיטקטורה עם sidecar או init container שקיים רק ל-x86: ה-Pod נוחת על ARM ונופל עם 'exec format error'.")
  ],
  interview: [
    { q: t("Compute Savings Plan or EC2 Instance Savings Plan?", "Compute Savings Plan או EC2 Instance Savings Plan?"),
      a: t("Instance SP gives ~6-10 points more discount but locks family+region. Use it only for a core you're sure about for the whole term. For everything else — especially with Karpenter churn, an ARM migration or Fargate/Lambda usage — the Compute SP survives change. Typical answer: small rigid core in Instance SP, bigger flexible layer in Compute SP, buy in tranches.", "Instance SP נותן ~6-10 נקודות הנחה יותר אבל נועל משפחה ו-region. משתמשים בו רק לליבה שאתה בטוח בה לכל התקופה. לכל השאר — במיוחד עם churn של Karpenter, מיגרציה ל-ARM או שימוש ב-Fargate/Lambda — ה-Compute SP שורד שינויים. תשובה טיפוסית: ליבה קשיחה קטנה ב-Instance SP, שכבה גמישה גדולה יותר ב-Compute SP, וקנייה במנות.") },
    { q: t("Utilization is 100% but coverage is 40%. What does it mean and what do you do?", "ה-utilization הוא 100% אבל ה-coverage הוא 40%. מה זה אומר ומה עושים?"),
      a: t("You use everything you bought, but most steady usage is still paying on-demand. Check the usage floor over 30-60 days after right-sizing, and buy an additional tranche up to ~70-85% of that floor. If the uncovered part is spiky, it may belong on spot instead.", "אתה מנצל את כל מה שקנית, אבל רוב השימוש היציב עדיין משלם on-demand. תבדוק את רצפת השימוש ב-30-60 ימים אחרי right-sizing, ותקנה מנה נוספת עד ~70-85% מהרצפה הזו. אם החלק שלא מכוסה הוא קוצני, אולי הוא שייך ל-Spot.") }
  ],
  quiz: [
    { q: t("A 1-year commitment gives 30% off. Above what share of hours must the covered capacity run to break even?", "התחייבות לשנה נותנת 30% הנחה. מעל איזה אחוז מהשעות הקיבולת המכוסה צריכה לרוץ כדי להגיע ל-break-even?"),
      options: [t("30%", "30%"), t("50%", "50%"), t("70%", "70%"), t("100%", "100%")],
      answer: 2, explain: t("Break-even when usage share > 1 − discount = 70%. Below that, on-demand would have been cheaper.", "Break-even כשאחוז השימוש > 1 פחות ההנחה = 70%. מתחת לזה, on-demand היה זול יותר.") },
    { q: t("Which AWS instrument still covers your planned move from m6i to Graviton m7g and some Fargate tasks?", "איזה מכשיר של AWS ימשיך לכסות את המעבר המתוכנן מ-m6i ל-Graviton m7g ועוד כמה tasks של Fargate?"),
      options: [t("Standard Reserved Instance for m6i", "Standard Reserved Instance ל-m6i"), t("EC2 Instance Savings Plan for m6i", "EC2 Instance Savings Plan ל-m6i"), t("Compute Savings Plan", "Compute Savings Plan"), t("Spot block", "Spot block")],
      answer: 2, explain: t("Compute SPs apply across families, regions and OS, plus Fargate and Lambda. The other two are tied to the m6i family.", "Compute SP חל בין משפחות, regions ו-OS, וגם על Fargate ו-Lambda. השניים האחרים קשורים למשפחת m6i.") },
    { q: t("What does Savings Plan 'utilization' measure?", "מה מודד 'utilization' של Savings Plan?"),
      options: [t("CPU usage of covered instances", "ניצול CPU של ה-instances המכוסים"), t("Share of eligible usage billed at the committed rate", "החלק מהשימוש הזכאי שמחויב בתעריף ההתחייבות"), t("Share of the purchased commitment actually consumed", "החלק מההתחייבות שנקנתה שנוצל בפועל"), t("Discount percentage vs on-demand", "אחוז ההנחה לעומת on-demand")],
      answer: 2, explain: t("Utilization = consumed ÷ purchased commitment (waste indicator). Option B is coverage.", "Utilization = מה שנוצל ÷ ההתחייבות שנקנתה (מדד בזבוז). אפשרות ב' זה coverage.") },
    { q: t("A Pod using a multi-arch image crashes on ARM nodes with 'exec format error'. Most likely cause?", "Pod עם image רב-ארכיטקטורה קורס על nodes של ARM עם 'exec format error'. מה הסיבה הכי סבירה?"),
      options: [t("Graviton doesn't support containers", "Graviton לא תומך ב-containers"), t("A sidecar or init container image is amd64-only", "ה-image של sidecar או init container קיים רק ל-amd64"), t("The node is out of memory", "ל-node נגמר הזיכרון"), t("kube-proxy is misconfigured", "kube-proxy מוגדר לא נכון")],
      answer: 1, explain: t("Every container in the Pod needs an arm64 variant. Check with docker buildx imagetools inspect for each image.", "כל container ב-Pod צריך גרסת arm64. בודקים עם docker buildx imagetools inspect לכל image.") }
  ],
  related: ["cloud-finops", "k8s-cost", "cloud-spot-instances", "k8s-node-autoprovisioning", "docker-images", "rel-capacity-planning"]
});

window.INFRA.glossary.push(
  { term: "Reserved Instance (RI)", track: "cloud", def: t("A 1- or 3-year commitment to specific instance attributes for up to ~72% off; on AWS now mostly used for RDS, ElastiCache, OpenSearch and Redshift.", "התחייבות ל-1 או 3 שנים על מאפייני instance ספציפיים בהנחה של עד ~72%; ב-AWS היום משתמשים בזה בעיקר ל-RDS, ElastiCache, OpenSearch ו-Redshift."), lesson: "cloud-commitments" },
  { term: "Committed Use Discount (CUD)", track: "cloud", def: t("GCP's commitment: resource-based (vCPU/memory of a machine series in a region) or spend-based ($/hour across services), 1 or 3 years.", "ההתחייבות של GCP: resource-based (vCPU וזיכרון של machine series ב-region) או spend-based ($ לשעה בין שירותים), לשנה או 3 שנים."), lesson: "cloud-commitments" },
  { term: "Commitment utilization vs coverage", track: "cloud", def: t("Utilization = share of purchased commitment actually used (waste). Coverage = share of eligible usage billed at committed rates (missed savings).", "Utilization = החלק מההתחייבות שנקנתה שבאמת נוצל (בזבוז). Coverage = החלק מהשימוש הזכאי שמחויב בתעריף התחייבות (חיסכון שפספסת)."), lesson: "cloud-commitments" },
  { term: "Graviton", track: "cloud", def: t("AWS's ARM-based CPUs (m7g, c8g, r8g…), typically ~20% cheaper per hour than x86 equivalents with better price-performance; needs multi-arch images.", "המעבדים מבוססי ARM של AWS (m7g, c8g, r8g…), בדרך כלל זולים ב-~20% לשעה מהמקבילים ב-x86 עם price-performance טוב יותר; צריך images רב-ארכיטקטורה."), lesson: "cloud-commitments" }
);

/* ------------------------------------------------- 3. Data transfer costs */
window.INFRA.lessons.push({
  id: "cloud-data-transfer-costs",
  track: "cloud",
  order: 72,
  icon: "🚚",
  level: 3,
  minutes: 14,
  title: t("Data Transfer & Egress Costs: the Hidden Bill", "עלויות Data Transfer ו-Egress: החשבון הנסתר"),
  tldr: t(
    "In the cloud, data going in is free and almost everything else costs per GB: internet egress (~$0.09/GB), cross-AZ ($0.01/GB each way), inter-region (~$0.02/GB) and NAT gateway processing ($0.045/GB on top). Fix it with free S3/DynamoDB gateway endpoints, zone-aware routing for chatty paths, CDN offload, and by finding the flows in CUR and VPC flow logs.",
    "בענן, נתונים שנכנסים הם בחינם וכמעט כל השאר עולה לפי GB: egress לאינטרנט (~$0.09 ל-GB), בין AZs ($0.01 ל-GB לכל כיוון), בין regions (~$0.02 ל-GB) ו-processing של NAT gateway ($0.045 ל-GB על הדרך). מתקנים עם gateway endpoints בחינם ל-S3 ול-DynamoDB, routing שמודע ל-zone לנתיבים פטפטנים, offload ל-CDN, ומציאת ה-flows ב-CUR וב-VPC flow logs."
  ),
  analogy: t(
    "The cloud is a city where entering is free but every bridge has a toll booth. Walking inside your own neighborhood (same AZ) is free. Crossing to the next neighborhood (another AZ) costs a coin each way, driving to another city (region) costs more, and leaving the country (internet) costs most. The NAT gateway is a private toll road you built yourself — and it charges you per kilogram of cargo, even when the destination was next door all along.",
    "הענן הוא עיר שהכניסה אליה בחינם אבל על כל גשר יש עמדת אגרה. ללכת בתוך השכונה שלך (אותו AZ) זה בחינם. לעבור לשכונה הבאה (AZ אחר) עולה מטבע לכל כיוון, לנסוע לעיר אחרת (region) עולה יותר, ולצאת מהמדינה (אינטרנט) הכי יקר. ה-NAT gateway הוא כביש אגרה פרטי שבנית בעצמך — והוא גובה ממך לפי קילו מטען, גם כשהיעד היה כל הזמן בבית ממול."
  ),
  sections: [
    {
      h: t("The price map (AWS, illustrative)", "מפת המחירים (AWS, להמחשה)"),
      body: t(
`<table>
<tr><th>Path</th><th>Typical price (us-east-1, check current pricing)</th><th>Billing line (usage type)</th></tr>
<tr><td>Internet → AWS (ingress)</td><td>free</td><td>—</td></tr>
<tr><td>Same AZ, private IP</td><td>free</td><td>—</td></tr>
<tr><td><strong>Cross-AZ</strong> in a region</td><td>$0.01/GB <strong>out + $0.01/GB in</strong> = $0.02/GB effective</td><td><code>DataTransfer-Regional-Bytes</code></td></tr>
<tr><td>Inter-region</td><td>~$0.02/GB (varies by pair)</td><td><code>USE1-EUW1-AWS-Out-Bytes</code></td></tr>
<tr><td><strong>Internet egress</strong></td><td>~$0.09/GB first 10 TB/month, sliding down to ~$0.05 (100 GB/month free)</td><td><code>DataTransfer-Out-Bytes</code></td></tr>
<tr><td><strong>NAT gateway</strong></td><td>$0.045/h per gateway + <strong>$0.045/GB processed</strong> (both directions), plus normal transfer charges</td><td><code>NatGateway-Hours</code>, <code>NatGateway-Bytes</code></td></tr>
<tr><td>Interface endpoint / PrivateLink</td><td>~$0.01/h per AZ + ~$0.01/GB processed</td><td><code>VpcEndpoint-Hours</code>, <code>VpcEndpoint-Bytes</code></td></tr>
<tr><td>Gateway endpoint (S3, DynamoDB)</td><td><strong>free</strong></td><td>—</td></tr>
<tr><td>Transit Gateway</td><td>~$0.05/h per attachment + $0.02/GB processed</td><td><code>TransitGateway-Bytes</code></td></tr>
<tr><td>AWS origin → CloudFront</td><td>free; CloudFront → viewers from ~$0.085/GB, cheaper at volume</td><td><code>CloudFront-Out-Bytes</code></td></tr>
</table>
<p>Other clouds: GCP charges ~$0.01/GB between zones in a region and has similar per-GB Cloud NAT processing; Azure's egress is ~$0.087/GB and NAT Gateway also bills per GB processed. Cross-zone billing rules differ by provider — check current pricing.</p>
<blockquote>💡 Real world: two facts surprise everyone. (1) A public IP of an instance in the same region is <em>not</em> "same AZ, free" — traffic to a public or Elastic IP is billed like cross-AZ even when it's next door. (2) NLB with cross-zone load balancing enabled bills cross-AZ data; ALB cross-zone is free.</blockquote>`,
`<table>
<tr><th>נתיב</th><th>מחיר טיפוסי (us-east-1, תבדוק מחירים עדכניים)</th><th>שורה בחשבון (usage type)</th></tr>
<tr><td>אינטרנט ← AWS (ingress)</td><td>בחינם</td><td>—</td></tr>
<tr><td>אותו AZ, IP פרטי</td><td>בחינם</td><td>—</td></tr>
<tr><td><strong>בין AZs</strong> באותו region</td><td>$0.01 ל-GB <strong>ביציאה + $0.01 ל-GB בכניסה</strong> = $0.02 ל-GB בפועל</td><td><code>DataTransfer-Regional-Bytes</code></td></tr>
<tr><td>בין regions</td><td>~$0.02 ל-GB (משתנה לפי הזוג)</td><td><code>USE1-EUW1-AWS-Out-Bytes</code></td></tr>
<tr><td><strong>Egress לאינטרנט</strong></td><td>~$0.09 ל-GB ב-10 TB הראשונים בחודש, ויורד עד ~$0.05 (100 GB בחודש בחינם)</td><td><code>DataTransfer-Out-Bytes</code></td></tr>
<tr><td><strong>NAT gateway</strong></td><td>$0.045 לשעה לכל gateway + <strong>$0.045 לכל GB שעובר</strong> (בשני הכיוונים), ועוד חיובי transfer רגילים</td><td><code>NatGateway-Hours</code>, <code>NatGateway-Bytes</code></td></tr>
<tr><td>Interface endpoint / PrivateLink</td><td>~$0.01 לשעה לכל AZ + ~$0.01 לכל GB שעובר</td><td><code>VpcEndpoint-Hours</code>, <code>VpcEndpoint-Bytes</code></td></tr>
<tr><td>Gateway endpoint (S3, DynamoDB)</td><td><strong>בחינם</strong></td><td>—</td></tr>
<tr><td>Transit Gateway</td><td>~$0.05 לשעה לכל attachment + $0.02 לכל GB שעובר</td><td><code>TransitGateway-Bytes</code></td></tr>
<tr><td>Origin ב-AWS ← CloudFront</td><td>בחינם; מ-CloudFront לגולשים מ-~$0.085 ל-GB, זול יותר בנפחים</td><td><code>CloudFront-Out-Bytes</code></td></tr>
</table>
<p>עננים אחרים: GCP גובה ~$0.01 ל-GB בין zones באותו region ויש לו processing לפי GB גם ב-Cloud NAT; ב-Azure ה-egress הוא ~$0.087 ל-GB וגם NAT Gateway מחייב לפי GB שעובר. כללי החיוב בין zones שונים בין הספקים — תבדוק מחירים עדכניים.</p>
<blockquote>💡 Real world: שתי עובדות מפתיעות את כולם. (1) IP ציבורי של instance באותו region הוא <em>לא</em> "אותו AZ, בחינם" — תעבורה ל-IP ציבורי או Elastic IP מחויבת כמו בין AZs גם כשהיא בבית ממול. (2) NLB עם cross-zone load balancing מופעל מחייב data בין AZs; ב-ALB ה-cross-zone בחינם.</blockquote>`)
    },
    {
      h: t("Worked examples: where the money hides", "דוגמאות מחושבות: איפה הכסף מתחבא"),
      body: t(
`<p><strong>1. Images and S3 through NAT.</strong> A 200-node EKS cluster in private subnets. Each node pulls ~5 GB of images/day (churn from Karpenter + deploys), and batch jobs read 20 TB/month from S3 — all via 3 NAT gateways.</p>
<pre>image pulls : 200 × 5 GB × 30   = 30 TB
S3 reads    :                     20 TB
NAT bytes   : 50,000 GB × $0.045  = $2,250 / month
NAT hours   : 3 × 730 × $0.045    = $   99 / month
Fix         : S3 gateway endpoint (free) + ECR interface endpoints
              (ecr.api, ecr.dkr; layers come from S3 → gateway endpoint)
After       : ~$0 for S3; ECR endpoint hours 2 × 3 AZ × 730 × $0.01 ≈ $44
              + processed bytes on the endpoint (~$0.01/GB) ≈ $300</pre>
<p><strong>2. Chatty cross-AZ microservices.</strong> Service A calls B with 2 MB responses at 400 rps; pods spread evenly across 3 AZs, so ~2/3 of calls cross an AZ.</p>
<pre>400 req/s × 2 MB        = 800 MB/s
× 2,592,000 s/month     ≈ 2,074 TB ≈ 2.07 PB/month
cross-AZ share 2/3      ≈ 1,383 TB = 1,383,000 GB
× $0.02/GB              ≈ $27,600 / month</pre>
<p>That's a real-world-sized number for one hot path. Compressing responses (gzip/zstd, ~5-10× on JSON) and zone-aware routing usually cut it by an order of magnitude.</p>
<p><strong>3. Kafka replication.</strong> RF=3 across 3 AZs: every 1 GB produced crosses AZs twice for replication, plus consumer reads from leaders in other AZs. 100 TB/month produced ≈ 200 TB replication + ~67 TB consumer cross-AZ ≈ <strong>~$5,300/month</strong>. Fetch-from-follower (KIP-392, <code>client.rack</code> + <code>replica.selector.class=RackAwareReplicaSelector</code>) removes the consumer part.</p>`,
`<p><strong>1. Images ו-S3 דרך NAT.</strong> Cluster של EKS עם 200 nodes ב-subnets פרטיים. כל node מושך ~5 GB של images ביום (churn של Karpenter + deploys), ו-batch jobs קוראים 20 TB בחודש מ-S3 — הכל דרך 3 NAT gateways.</p>
<pre>image pulls : 200 × 5 GB × 30   = 30 TB
S3 reads    :                     20 TB
NAT bytes   : 50,000 GB × $0.045  = $2,250 / month
NAT hours   : 3 × 730 × $0.045    = $   99 / month
Fix         : S3 gateway endpoint (free) + ECR interface endpoints
              (ecr.api, ecr.dkr; layers come from S3 → gateway endpoint)
After       : ~$0 for S3; ECR endpoint hours 2 × 3 AZ × 730 × $0.01 ≈ $44
              + processed bytes on the endpoint (~$0.01/GB) ≈ $300</pre>
<p><strong>2. Microservices פטפטנים בין AZs.</strong> סרוויס A קורא ל-B עם תשובות של 2 MB ב-400 rps; ה-Pod-ים מפוזרים שווה על 3 AZs, אז ~2/3 מהקריאות חוצות AZ.</p>
<pre>400 req/s × 2 MB        = 800 MB/s
× 2,592,000 s/month     ≈ 2,074 TB ≈ 2.07 PB/month
cross-AZ share 2/3      ≈ 1,383 TB = 1,383,000 GB
× $0.02/GB              ≈ $27,600 / month</pre>
<p>זה מספר בגודל אמיתי לנתיב חם אחד. דחיסת תשובות (gzip/zstd, פי 5-10 על JSON) ו-routing שמודע ל-zone בדרך כלל חותכים את זה בסדר גודל.</p>
<p><strong>3. רפליקציה של Kafka.</strong> RF=3 על 3 AZs: כל 1 GB שנכתב חוצה AZ פעמיים לרפליקציה, ועוד קריאות של consumers מ-leaders ב-AZs אחרים. 100 TB בחודש שנכתבים ≈ 200 TB רפליקציה + ~67 TB של consumers בין AZs ≈ <strong>~$5,300 לחודש</strong>. Fetch-from-follower (KIP-392, <code>client.rack</code> + <code>replica.selector.class=RackAwareReplicaSelector</code>) מוריד את החלק של ה-consumers.</p>`)
    },
    {
      h: t("Endpoints: gateway, interface, PrivateLink", "Endpoints: gateway, interface ו-PrivateLink"),
      body: t(
`<p><strong>Gateway endpoints</strong> (S3 and DynamoDB only) are route-table entries — free, no hourly fee, no per-GB fee. There's almost no reason not to have them in every VPC:</p>
<pre>aws ec2 create-vpc-endpoint --vpc-id vpc-0abc \
  --vpc-endpoint-type Gateway \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-priv-a rtb-priv-b rtb-priv-c</pre>
<p><strong>Interface endpoints</strong> (PrivateLink) put an ENI per AZ in your subnets for ECR, STS, CloudWatch Logs, Secrets Manager, SQS, and third-party SaaS. They cost ~$0.01/h <em>per AZ</em> ≈ <strong>$22/month per endpoint in 3 AZs</strong> plus ~$0.01/GB. Cheaper than NAT ($0.045/GB) once traffic is more than a couple of TB/month per service — but 15 endpoints × 40 VPCs ≈ $13,000/month of hourly fees alone.</p>
<ul>
<li>Centralize interface endpoints in a <strong>shared-services VPC</strong> with Route 53 private hosted zones shared to spokes — but Transit Gateway adds $0.02/GB, so keep high-volume services (ECR, S3) local.</li>
<li>Only create endpoints for services with real volume. CloudWatch Logs and ECR are usually worth it; a rarely-used API is not.</li>
<li>For S3, prefer the <strong>gateway</strong> endpoint; the S3 interface endpoint exists for on-prem/peered access and costs per GB.</li>
</ul>
<blockquote>⚠️ Production tip: a gateway endpoint only helps traffic to buckets <strong>in the same region</strong>. Pulling from a bucket in another region still goes via NAT and pays inter-region transfer. Also check bucket policies — <code>aws:SourceVpce</code> conditions are a good way to force the endpoint path.</blockquote>`,
`<p><strong>Gateway endpoints</strong> (רק ל-S3 ול-DynamoDB) הם רשומות ב-route table — בחינם, בלי תשלום לשעה ובלי תשלום ל-GB. אין כמעט סיבה לא להחזיק אותם בכל VPC:</p>
<pre>aws ec2 create-vpc-endpoint --vpc-id vpc-0abc \
  --vpc-endpoint-type Gateway \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-priv-a rtb-priv-b rtb-priv-c</pre>
<p><strong>Interface endpoints</strong> (PrivateLink) שמים ENI בכל AZ ב-subnets שלך עבור ECR, STS, CloudWatch Logs, Secrets Manager, SQS ו-SaaS של צד שלישי. הם עולים ~$0.01 לשעה <em>לכל AZ</em> ≈ <strong>$22 לחודש לכל endpoint ב-3 AZs</strong> ועוד ~$0.01 ל-GB. זול יותר מ-NAT ($0.045 ל-GB) ברגע שהתעבורה מעל כמה TB בחודש לשירות — אבל 15 endpoints × 40 VPCs ≈ $13,000 בחודש רק על השעות.</p>
<ul>
<li>תרכז interface endpoints ב-<strong>shared-services VPC</strong> עם Route 53 private hosted zones שמשותפים ל-spokes — אבל Transit Gateway מוסיף $0.02 ל-GB, אז תשאיר שירותים עם נפח גבוה (ECR, S3) מקומיים.</li>
<li>תיצור endpoints רק לשירותים עם נפח אמיתי. CloudWatch Logs ו-ECR בדרך כלל שווים את זה; API שכמעט לא בשימוש — לא.</li>
<li>ל-S3 תעדיף את ה-endpoint מסוג <strong>gateway</strong>; ה-interface endpoint של S3 קיים לגישה מ-on-prem או מ-VPC מחובר, ועולה לפי GB.</li>
</ul>
<blockquote>⚠️ Production tip: gateway endpoint עוזר רק לתעבורה ל-buckets <strong>באותו region</strong>. משיכה מ-bucket ב-region אחר עדיין עוברת דרך NAT ומשלמת transfer בין regions. תבדוק גם bucket policies — תנאי <code>aws:SourceVpce</code> הם דרך טובה להכריח את הנתיב דרך ה-endpoint.</blockquote>`)
    },
    {
      h: t("Zone-aware routing vs HA, and CDN offload", "Routing שמודע ל-zone מול HA, ו-offload ל-CDN"),
      body: t(
`<p>Keeping traffic inside an AZ saves money and latency (~0.1-0.3 ms less per hop), but over-pinning to one AZ kills HA. Middle ground: <strong>prefer</strong> same-zone, <strong>fail over</strong> cross-zone.</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: orders }
spec:
  selector: { app: orders }
  ports: [ { port: 80, targetPort: 8080 } ]
  trafficDistribution: PreferClose     # GA in Kubernetes 1.33; newer versions add PreferSameZone
# older clusters: annotation service.kubernetes.io/topology-mode: Auto</pre>
<ul>
<li>Requires replicas in <strong>every</strong> zone (topology spread), otherwise one zone's pods get all of that zone's traffic and overload.</li>
<li>Service meshes do the same with locality-aware load balancing (Istio <code>localityLbSetting</code>, outlier detection for failover).</li>
<li>Don't zone-pin databases or Kafka leaders — use read replicas per AZ, fetch-from-follower, and accept cross-AZ for writes.</li>
</ul>
<p><strong>CDN offload</strong>: origin → CloudFront is free, and CloudFront → users is cheaper per GB than EC2/S3 → internet, with volume tiers and commit discounts. A 90% cache hit ratio on 200 TB/month of downloads moves 180 TB off origin egress. Put large static assets, downloads and images behind the CDN with long <code>Cache-Control</code> and versioned file names.</p>
<blockquote>💡 Real world: "multi-AZ everything" is right for availability, but each design should ask "which hops cross AZs, and how many GB/month?" A 30-second back-of-envelope in a design review regularly saves five figures a month.</blockquote>`,
`<p>להשאיר תעבורה בתוך AZ חוסך כסף ו-latency (~0.1-0.3 ms פחות לכל hop), אבל הצמדת יתר ל-AZ אחד הורגת HA. דרך האמצע: <strong>להעדיף</strong> אותו zone, ו<strong>לעבור</strong> ל-zone אחר בתקלה.</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: orders }
spec:
  selector: { app: orders }
  ports: [ { port: 80, targetPort: 8080 } ]
  trafficDistribution: PreferClose     # GA in Kubernetes 1.33; newer versions add PreferSameZone
# older clusters: annotation service.kubernetes.io/topology-mode: Auto</pre>
<ul>
<li>דורש replicas ב-<strong>כל</strong> zone (topology spread), אחרת ה-Pod-ים של zone אחד מקבלים את כל התעבורה של ה-zone שלהם ונחנקים.</li>
<li>Service meshes עושים אותו דבר עם locality-aware load balancing (ב-Istio <code>localityLbSetting</code>, ו-outlier detection ל-failover).</li>
<li>לא מצמידים ל-zone databases או leaders של Kafka — משתמשים ב-read replicas בכל AZ, ב-fetch-from-follower, ומקבלים חציית AZ בכתיבות.</li>
</ul>
<p><strong>Offload ל-CDN</strong>: מה-origin ל-CloudFront בחינם, ומ-CloudFront למשתמשים זול יותר ל-GB מאשר מ-EC2 או S3 לאינטרנט, עם מדרגות נפח והנחות התחייבות. Cache hit ratio של 90% על 200 TB בחודש של הורדות מוריד 180 TB מה-egress של ה-origin. תשים assets סטטיים גדולים, הורדות ותמונות מאחורי ה-CDN עם <code>Cache-Control</code> ארוך ושמות קבצים עם גרסה.</p>
<blockquote>💡 Real world: "multi-AZ לכל דבר" נכון לזמינות, אבל כל תכנון צריך לשאול "אילו hops חוצים AZ, וכמה GB בחודש?" הערכה של 30 שניות ב-design review חוסכת באופן קבוע חמש ספרות בחודש.</blockquote>`)
    },
    {
      h: t("Finding it: Cost Explorer, CUR and VPC flow logs", "למצוא את זה: Cost Explorer, CUR ו-VPC flow logs"),
      body: t(
`<p><strong>Step 1 — which line?</strong> Cost Explorer, group by <em>Usage type</em>, filter service EC2-Other. Look for <code>NatGateway-Bytes</code>, <code>DataTransfer-Regional-Bytes</code>, <code>DataTransfer-Out-Bytes</code>, <code>*-AWS-Out-Bytes</code>.</p>
<p><strong>Step 2 — which resource?</strong> Query the Cost and Usage Report (CUR 2.0 via Data Exports) in Athena:</p>
<pre>SELECT line_item_resource_id,
       line_item_usage_type,
       SUM(line_item_usage_amount)    AS gb,
       SUM(line_item_unblended_cost)  AS usd
FROM   cur2
WHERE  billing_period = '2026-10'
  AND  (line_item_usage_type LIKE '%NatGateway-Bytes%'
     OR line_item_usage_type LIKE '%DataTransfer-Regional-Bytes%')
GROUP  BY 1, 2
ORDER  BY usd DESC
LIMIT  20;</pre>
<p><strong>Step 3 — which flows?</strong> VPC flow logs on the NAT gateway's ENI (custom format with <code>pkt-srcaddr pkt-dstaddr bytes flow-direction az-id</code>), then top talkers:</p>
<pre>SELECT pkt_srcaddr, pkt_dstaddr, SUM(bytes)/1e9 AS gb
FROM   vpc_flow_logs
WHERE  interface_id = 'eni-0nat1234'   -- the NAT gateway ENI
  AND  day = '2026/10/15'
GROUP  BY 1, 2 ORDER BY gb DESC LIMIT 20;</pre>
<p>Map destination IPs to services: S3 and ECR prefixes come from <code>ip-ranges.json</code> (<code>"service": "S3"</code>), or join with the AWS-managed prefix list <code>pl-63a5400a</code> (S3 in us-east-1). Source IPs map to pods via your CNI (on EKS with the VPC CNI, pod IPs are VPC IPs).</p>
<blockquote>⚠️ Production tip: set an <strong>AWS Cost Anomaly Detection</strong> monitor per linked account and per service with an absolute threshold (e.g. +$200/day). NAT and transfer spikes then reach Slack in a day, not on the invoice 30 days later.</blockquote>`,
`<p><strong>שלב 1 — איזו שורה?</strong> ב-Cost Explorer, group by <em>Usage type</em>, עם פילטר על השירות EC2-Other. מחפשים <code>NatGateway-Bytes</code>, <code>DataTransfer-Regional-Bytes</code>, <code>DataTransfer-Out-Bytes</code>, <code>*-AWS-Out-Bytes</code>.</p>
<p><strong>שלב 2 — איזה משאב?</strong> שאילתה על ה-Cost and Usage Report (CUR 2.0 דרך Data Exports) ב-Athena:</p>
<pre>SELECT line_item_resource_id,
       line_item_usage_type,
       SUM(line_item_usage_amount)    AS gb,
       SUM(line_item_unblended_cost)  AS usd
FROM   cur2
WHERE  billing_period = '2026-10'
  AND  (line_item_usage_type LIKE '%NatGateway-Bytes%'
     OR line_item_usage_type LIKE '%DataTransfer-Regional-Bytes%')
GROUP  BY 1, 2
ORDER  BY usd DESC
LIMIT  20;</pre>
<p><strong>שלב 3 — אילו flows?</strong> VPC flow logs על ה-ENI של ה-NAT gateway (פורמט מותאם עם <code>pkt-srcaddr pkt-dstaddr bytes flow-direction az-id</code>), ואז ה-top talkers:</p>
<pre>SELECT pkt_srcaddr, pkt_dstaddr, SUM(bytes)/1e9 AS gb
FROM   vpc_flow_logs
WHERE  interface_id = 'eni-0nat1234'   -- the NAT gateway ENI
  AND  day = '2026/10/15'
GROUP  BY 1, 2 ORDER BY gb DESC LIMIT 20;</pre>
<p>ממפים IPs של יעד לשירותים: טווחים של S3 ו-ECR מגיעים מ-<code>ip-ranges.json</code> (<code>"service": "S3"</code>), או עושים join עם ה-prefix list המנוהל של AWS <code>pl-63a5400a</code> (S3 ב-us-east-1). IPs של מקור ממפים ל-Pod-ים דרך ה-CNI (ב-EKS עם VPC CNI, ה-IPs של ה-Pod-ים הם IPs של ה-VPC).</p>
<blockquote>⚠️ Production tip: תגדיר monitor של <strong>AWS Cost Anomaly Detection</strong> לכל linked account ולכל שירות עם סף מוחלט (למשל +$200 ביום). ככה קפיצות ב-NAT וב-transfer מגיעות ל-Slack תוך יום, לא בחשבונית 30 יום אחר כך.</blockquote>`)
    }
  ],
  diagram: "pod (private subnet) --x--> NAT GW ($0.045/GB) --> IGW --> S3 / ECR\npod (private subnet) -------> S3 gateway endpoint (free) -----> S3\npod AZ-a <---- $0.01/GB each way ----> pod AZ-b",
  handsOn: [
    { cmd: "aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY --metrics UnblendedCost UsageQuantity --group-by Type=DIMENSION,Key=USAGE_TYPE --filter '{\"Dimensions\":{\"Key\":\"SERVICE\",\"Values\":[\"EC2 - Other\"]}}'",
      what: t("Break 'EC2 - Other' into usage types: NatGateway-Bytes, DataTransfer-Regional-Bytes, EBS and friends.", "לפרק את 'EC2 - Other' ל-usage types: NatGateway-Bytes, DataTransfer-Regional-Bytes, EBS וחברים.") },
    { cmd: "aws ec2 describe-vpc-endpoints --filters Name=vpc-id,Values=vpc-0abc --query 'VpcEndpoints[].[VpcEndpointType,ServiceName,State]' --output table",
      what: t("Does this VPC have the free S3/DynamoDB gateway endpoints? Which interface endpoints are you paying hourly for?", "האם ל-VPC הזה יש את ה-gateway endpoints בחינם ל-S3 ול-DynamoDB? על אילו interface endpoints אתה משלם לפי שעה?") },
    { cmd: "aws cloudwatch get-metric-statistics --namespace AWS/NATGateway --metric-name BytesOutToDestination --dimensions Name=NatGatewayId,Value=nat-0abc --start-time 2026-11-13T00:00:00Z --end-time 2026-11-14T00:00:00Z --period 3600 --statistics Sum",
      what: t("Hourly bytes through a NAT gateway. Spikes that match deploy times point at image pulls.", "בייטים לשעה דרך NAT gateway. קפיצות שמתאימות לזמני deploy מצביעות על משיכת images.") },
    { cmd: "aws ec2 create-flow-logs --resource-type NetworkInterface --resource-ids eni-0nat1234 --traffic-type ALL --log-destination-type s3 --log-destination arn:aws:s3:::flowlogs-bucket --log-format '${pkt-srcaddr} ${pkt-dstaddr} ${bytes} ${flow-direction} ${az-id}'",
      what: t("Flow logs on the NAT ENI with the fields you need to find top talkers (query them with Athena).", "Flow logs על ה-ENI של ה-NAT עם השדות שצריך כדי למצוא top talkers (שואלים עליהם ב-Athena).") }
  ],
  mnemonic: t("In is free, out costs, across costs twice, and NAT taxes everything that passes. Gateway endpoints for S3 are the free bridge.", "כניסה בחינם, יציאה עולה, חצייה עולה פעמיים, ו-NAT גובה מס על כל מה שעובר. Gateway endpoint ל-S3 הוא הגשר החינמי."),
  pitfalls: [
    t("Private subnets with no S3 gateway endpoint: every S3 GET and every ECR layer download pays $0.045/GB NAT processing.", "Subnets פרטיים בלי S3 gateway endpoint: כל GET ל-S3 וכל הורדת layer מ-ECR משלמים $0.045 ל-GB על NAT processing."),
    t("Calling a service via its public DNS/Elastic IP from inside the same region — billed as public/cross-AZ traffic, and through NAT too.", "לקרוא לסרוויס דרך ה-DNS הציבורי או ה-Elastic IP שלו מתוך אותו region — מחויב כתעבורה ציבורית/בין AZs, וגם עובר דרך NAT."),
    t("One NAT gateway for all AZs to 'save money': cross-AZ charges to reach it, plus a single point of failure. Use one per AZ.", "NAT gateway אחד לכל ה-AZs כדי 'לחסוך': חיובים בין AZs כדי להגיע אליו, ועוד single point of failure. תשתמש באחד לכל AZ."),
    t("Pinning everything to one AZ to avoid cross-AZ fees — you trade a few hundred dollars for an outage during the next AZ incident.", "להצמיד הכל ל-AZ אחד כדי להימנע מחיובים בין AZs — אתה מחליף כמה מאות דולרים ב-outage בתקלת ה-AZ הבאה.")
  ],
  interview: [
    { q: t("The bill's 'EC2-Other' line doubled. How do you investigate?", "השורה 'EC2-Other' בחשבון הוכפלה. איך אתה חוקר?"),
      a: t("Cost Explorer by usage type to find which line (NAT bytes, regional transfer, EBS). CUR in Athena for the resource ID (which NAT gateway/ENI). VPC flow logs on that ENI for top source/destination pairs, map destinations via ip-ranges.json and sources to pods. Typical fix: S3 gateway endpoint, ECR interface endpoints, image caching, zone-aware routing; then add Cost Anomaly Detection.", "Cost Explorer לפי usage type כדי למצוא איזו שורה (NAT bytes, transfer אזורי, EBS). CUR ב-Athena בשביל ה-resource ID (איזה NAT gateway או ENI). VPC flow logs על ה-ENI הזה בשביל זוגות מקור-יעד מובילים, מיפוי יעדים דרך ip-ranges.json ומקורות ל-Pod-ים. תיקון טיפוסי: S3 gateway endpoint, ECR interface endpoints, caching של images, routing שמודע ל-zone; ואז להוסיף Cost Anomaly Detection.") },
    { q: t("How do you reduce cross-AZ cost without hurting availability?", "איך מורידים עלות בין AZs בלי לפגוע בזמינות?"),
      a: t("Prefer same-zone with automatic failover (trafficDistribution PreferClose, mesh locality LB), keep replicas in all zones, compress payloads, use fetch-from-follower for Kafka consumers and per-AZ read replicas — but keep data replication and writes multi-AZ.", "להעדיף אותו zone עם failover אוטומטי (trafficDistribution PreferClose, locality LB ב-mesh), להחזיק replicas בכל ה-zones, לדחוס payloads, להשתמש ב-fetch-from-follower ל-Kafka consumers וב-read replicas בכל AZ — אבל להשאיר את רפליקציית הנתונים והכתיבות multi-AZ.") }
  ],
  quiz: [
    { q: t("What does an S3 gateway VPC endpoint cost?", "כמה עולה S3 gateway VPC endpoint?"),
      options: [t("$0.01/h per AZ + $0.01/GB", "$0.01 לשעה לכל AZ + $0.01 ל-GB"), t("Free", "בחינם"), t("$0.045/GB like NAT", "$0.045 ל-GB כמו NAT"), t("$0.02/GB like Transit Gateway", "$0.02 ל-GB כמו Transit Gateway")],
      answer: 1, explain: t("Gateway endpoints (S3, DynamoDB) are route-table targets with no hourly or per-GB charge. Interface endpoints are the paid ones.", "Gateway endpoints (S3, DynamoDB) הם יעדים ב-route table בלי חיוב לשעה ובלי חיוב ל-GB. ה-interface endpoints הם אלה שעולים כסף.") },
    { q: t("Pods in AZ-a send 10 TB/month to pods in AZ-b over private IPs. Roughly what's the AWS transfer cost?", "Pod-ים ב-AZ-a שולחים 10 TB בחודש ל-Pod-ים ב-AZ-b על IPs פרטיים. מה בערך עלות ה-transfer ב-AWS?"),
      options: [t("$0", "$0"), t("~$100", "~$100"), t("~$200", "~$200"), t("~$900", "~$900")],
      answer: 2, explain: t("$0.01/GB out of AZ-a plus $0.01/GB into AZ-b = $0.02/GB × 10,000 GB ≈ $200.", "$0.01 ל-GB ביציאה מ-AZ-a ועוד $0.01 ל-GB בכניסה ל-AZ-b = $0.02 ל-GB × 10,000 GB ≈ $200.") },
    { q: t("What is required for trafficDistribution: PreferClose to work safely?", "מה נדרש כדי ש-trafficDistribution: PreferClose יעבוד בבטחה?"),
      options: [t("A single-AZ cluster", "Cluster ב-AZ אחד"), t("Replicas spread across every zone that sends traffic", "Replicas מפוזרים בכל zone ששולח תעבורה"), t("A NAT gateway per pod", "NAT gateway לכל Pod"), t("Disabling kube-proxy", "לכבות את kube-proxy")],
      answer: 1, explain: t("Same-zone preference only works if each zone has enough endpoints; otherwise one zone's few pods take all its traffic.", "העדפת אותו zone עובדת רק אם בכל zone יש מספיק endpoints; אחרת המעט Pod-ים של zone אחד מקבלים את כל התעבורה שלו.") },
    { q: t("Which tool tells you WHICH source and destination IPs generate NAT gateway bytes?", "איזה כלי אומר לך אילו IPs של מקור ויעד מייצרים את הבייטים ב-NAT gateway?"),
      options: [t("Cost Explorer", "Cost Explorer"), t("VPC flow logs on the NAT gateway ENI", "VPC flow logs על ה-ENI של ה-NAT gateway"), t("CloudTrail", "CloudTrail"), t("Trusted Advisor", "Trusted Advisor")],
      answer: 1, explain: t("Cost Explorer/CUR show which line and resource; flow logs show per-flow bytes. CloudTrail logs API calls, not packets.", "Cost Explorer ו-CUR מראים איזו שורה ואיזה משאב; flow logs מראים בייטים לכל flow. CloudTrail מתעד קריאות API, לא packets.") }
  ],
  related: ["cloud-finops", "net-vpc", "net-nat-conntrack", "net-proxies-cdn", "k8s-cost", "staff-kafka-deep", "cloud-storage-lifecycle"]
});

window.INFRA.glossary.push(
  { term: "Gateway endpoint (S3/DynamoDB)", track: "cloud", def: t("A free VPC endpoint implemented as a route-table entry that sends S3/DynamoDB traffic privately, bypassing the NAT gateway and its per-GB processing fee.", "VPC endpoint בחינם שממומש כרשומה ב-route table ושולח תעבורה ל-S3 או DynamoDB באופן פרטי, בלי לעבור ב-NAT gateway ובלי ה-processing fee שלו לפי GB."), lesson: "cloud-data-transfer-costs" },
  { term: "Cross-AZ data transfer", track: "cloud", def: t("Traffic between availability zones in one region; on AWS ~$0.01/GB charged on each side ($0.02/GB effective). Often the biggest hidden line for chatty services and replication.", "תעבורה בין availability zones באותו region; ב-AWS ~$0.01 ל-GB בכל צד ($0.02 ל-GB בפועל). הרבה פעמים השורה הנסתרת הכי גדולה בסרוויסים פטפטנים וברפליקציה."), lesson: "cloud-data-transfer-costs" },
  { term: "Cost and Usage Report (CUR)", track: "cloud", def: t("AWS's line-item billing export (CUR 2.0 via Data Exports) to S3, queried with Athena to attribute cost to usage types and resource IDs.", "ה-export של החשבון ב-AWS ברמת שורה (CUR 2.0 דרך Data Exports) ל-S3, ששואלים עליו ב-Athena כדי לשייך עלות ל-usage types ול-resource IDs."), lesson: "cloud-data-transfer-costs" }
);

/* --------------------------------------------- 4. Object storage at scale */
window.INFRA.lessons.push({
  id: "cloud-storage-lifecycle",
  track: "cloud",
  order: 73,
  icon: "🗄️",
  level: 3,
  minutes: 15,
  title: t("Object Storage at Scale: Classes, Lifecycle, Versioning, Replication", "Object Storage בקנה מידה: classes, lifecycle, versioning ו-replication"),
  tldr: t(
    "Pick the storage class by access pattern, automate moves with lifecycle rules, and respect the traps: minimum storage durations, retrieval fees, per-object transition costs and the 128 KB minimum. Versioning without noncurrent expiration is a slow leak. S3 is strongly consistent, scales per prefix (3,500 writes / 5,500 reads per second), and huge deletes belong to lifecycle rules, not scripts.",
    "בוחרים storage class לפי דפוס הגישה, מעבירים אוטומטית עם lifecycle rules, ונזהרים מהמלכודות: minimum storage duration, retrieval fees, עלות transition לכל אובייקט ומינימום של 128 KB. Versioning בלי expiration ל-noncurrent זו דליפה איטית. S3 הוא strongly consistent, גדל לפי prefix (3,500 כתיבות / 5,500 קריאות בשנייה), ומחיקות ענק שייכות ל-lifecycle rules, לא לסקריפטים."
  ),
  analogy: t(
    "Object storage classes are a warehouse with three floors and a basement. The ground floor (Standard) is pricey but you grab anything instantly. Upstairs (IA) rent is cheaper but every trip to fetch a box costs a porter fee, and you must keep boxes there at least a month. The basement (Glacier/Archive) is almost free — but retrieval means booking a forklift hours in advance, and leaving early still bills the full minimum stay. Lifecycle rules are the night shift moving boxes downstairs by age.",
    "ה-storage classes הם מחסן עם שלוש קומות ומרתף. קומת הקרקע (Standard) יקרה אבל אתה לוקח כל דבר מיד. למעלה (IA) השכירות זולה יותר, אבל כל פעם שמביאים קרטון משלמים לסבל, וחייבים להשאיר קרטונים שם לפחות חודש. המרתף (Glacier/Archive) כמעט בחינם — אבל שליפה אומרת להזמין מלגזה שעות מראש, ועזיבה מוקדמת עדיין מחויבת על כל תקופת המינימום. Lifecycle rules הם משמרת הלילה שמורידה קרטונים למטה לפי גיל."
  ),
  sections: [
    {
      h: t("Storage classes across clouds", "Storage classes בין העננים"),
      body: t(
`<table>
<tr><th>AWS S3 class</th><th>~$/GB-month (us-east-1)</th><th>Min duration</th><th>Retrieval</th><th>Use for</th></tr>
<tr><td>Standard</td><td>$0.023</td><td>—</td><td>free, ms</td><td>Hot data</td></tr>
<tr><td>Intelligent-Tiering</td><td>$0.023 → $0.0125 → $0.004 automatically</td><td>—</td><td>free (+ $0.0025 per 1,000 objects monitoring)</td><td>Unknown/changing access</td></tr>
<tr><td>Standard-IA</td><td>$0.0125</td><td>30 days</td><td>$0.01/GB, ms</td><td>Monthly access, backups</td></tr>
<tr><td>One Zone-IA</td><td>$0.01</td><td>30 days</td><td>$0.01/GB</td><td>Re-creatable copies (single AZ!)</td></tr>
<tr><td>Glacier Instant Retrieval</td><td>$0.004</td><td>90 days</td><td>$0.03/GB, ms</td><td>Quarterly access, medical images</td></tr>
<tr><td>Glacier Flexible Retrieval</td><td>$0.0036</td><td>90 days</td><td>minutes to 12 h, restore first</td><td>Archives, DR copies</td></tr>
<tr><td>Glacier Deep Archive</td><td>$0.00099</td><td>180 days</td><td>12-48 h, restore first</td><td>Compliance, 7-10 year retention</td></tr>
</table>
<p>Prices illustrative — check current pricing. IA and Glacier IR also bill a <strong>minimum 128 KB per object</strong>; Glacier Flexible/Deep Archive add ~40 KB of metadata overhead per object (32 KB billed at Glacier rate + 8 KB at Standard).</p>
<table>
<tr><th>Azure Blob tier</th><th>Min duration</th><th>GCS class</th><th>Min duration</th></tr>
<tr><td>Hot</td><td>—</td><td>Standard</td><td>—</td></tr>
<tr><td>Cool</td><td>30 days</td><td>Nearline</td><td>30 days</td></tr>
<tr><td>Cold</td><td>90 days</td><td>Coldline</td><td>90 days</td></tr>
<tr><td>Archive (offline, rehydrate up to ~15 h; high priority &lt;1 h for small blobs)</td><td>180 days</td><td>Archive (still ms latency, but high retrieval fee)</td><td>365 days</td></tr>
</table>
<p>GCS <strong>Autoclass</strong> and S3 Intelligent-Tiering are the "don't make me guess" options; Azure has lifecycle management rules with <code>daysAfterLastAccessTimeGreaterThan</code> when last-access tracking is on.</p>`,
`<table>
<tr><th>Class ב-AWS S3</th><th>~$ ל-GB לחודש (us-east-1)</th><th>זמן מינימום</th><th>שליפה</th><th>מתאים ל</th></tr>
<tr><td>Standard</td><td>$0.023</td><td>—</td><td>בחינם, ms</td><td>נתונים חמים</td></tr>
<tr><td>Intelligent-Tiering</td><td>$0.023 ← $0.0125 ← $0.004 אוטומטית</td><td>—</td><td>בחינם (+ $0.0025 לכל 1,000 אובייקטים על monitoring)</td><td>גישה לא ידועה או משתנה</td></tr>
<tr><td>Standard-IA</td><td>$0.0125</td><td>30 יום</td><td>$0.01 ל-GB, ms</td><td>גישה חודשית, גיבויים</td></tr>
<tr><td>One Zone-IA</td><td>$0.01</td><td>30 יום</td><td>$0.01 ל-GB</td><td>עותקים שאפשר לייצר מחדש (AZ אחד!)</td></tr>
<tr><td>Glacier Instant Retrieval</td><td>$0.004</td><td>90 יום</td><td>$0.03 ל-GB, ms</td><td>גישה רבעונית, הדמיות רפואיות</td></tr>
<tr><td>Glacier Flexible Retrieval</td><td>$0.0036</td><td>90 יום</td><td>דקות עד 12 שעות, צריך restore קודם</td><td>ארכיונים, עותקי DR</td></tr>
<tr><td>Glacier Deep Archive</td><td>$0.00099</td><td>180 יום</td><td>12-48 שעות, צריך restore קודם</td><td>Compliance, שמירה של 7-10 שנים</td></tr>
</table>
<p>מחירים להמחשה — תבדוק מחירים עדכניים. IA ו-Glacier IR מחייבים גם <strong>מינימום של 128 KB לאובייקט</strong>; Glacier Flexible ו-Deep Archive מוסיפים ~40 KB של metadata לכל אובייקט (32 KB בתעריף Glacier ו-8 KB בתעריף Standard).</p>
<table>
<tr><th>Tier ב-Azure Blob</th><th>זמן מינימום</th><th>Class ב-GCS</th><th>זמן מינימום</th></tr>
<tr><td>Hot</td><td>—</td><td>Standard</td><td>—</td></tr>
<tr><td>Cool</td><td>30 יום</td><td>Nearline</td><td>30 יום</td></tr>
<tr><td>Cold</td><td>90 יום</td><td>Coldline</td><td>90 יום</td></tr>
<tr><td>Archive (offline, rehydrate עד ~15 שעות; high priority פחות משעה לקבצים קטנים)</td><td>180 יום</td><td>Archive (עדיין latency של ms, אבל retrieval fee גבוה)</td><td>365 יום</td></tr>
</table>
<p><strong>Autoclass</strong> של GCS ו-Intelligent-Tiering של S3 הם האפשרויות של "אל תכריח אותי לנחש"; ב-Azure יש lifecycle management rules עם <code>daysAfterLastAccessTimeGreaterThan</code> כש-last-access tracking מופעל.</p>`)
    },
    {
      h: t("Lifecycle rules and the cost traps", "Lifecycle rules ומלכודות העלות"),
      body: t(
`<p>A production-grade lifecycle config for a logs bucket with versioning:</p>
<pre>{
  "Rules": [
    {
      "ID": "logs-tiering",
      "Filter": { "Prefix": "logs/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30,  "StorageClass": "STANDARD_IA" },
        { "Days": 90,  "StorageClass": "GLACIER_IR" },
        { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
      ],
      "Expiration": { "Days": 2555 },
      "NoncurrentVersionTransitions": [ { "NoncurrentDays": 30, "StorageClass": "GLACIER_IR" } ],
      "NoncurrentVersionExpiration": { "NoncurrentDays": 90, "NewerNoncurrentVersions": 3 }
    },
    {
      "ID": "hygiene",
      "Filter": {},
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 },
      "Expiration": { "ExpiredObjectDeleteMarker": true }
    }
  ]
}</pre>
<pre>aws s3api put-bucket-lifecycle-configuration --bucket acme-logs --lifecycle-configuration file://lifecycle.json</pre>
<p>The traps, with numbers:</p>
<ul>
<li><strong>Transition requests cost money per object</strong>: ~$0.01 per 1,000 to IA, ~$0.02 to Glacier IR, ~$0.05 per 1,000 to Deep Archive. 2 billion 20 KB log objects → Deep Archive = <strong>$100,000</strong> in transitions to save only ~$450/month once the ~40 KB per-object metadata overhead is counted — an ~18-year break-even. Aggregate small files first (compact into 100 MB+ Parquet/gzip).</li>
<li><strong>Small objects in IA</strong>: a 4 KB object is billed as 128 KB — 32× the size. S3 lifecycle no longer transitions objects under 128 KB by default, but manual <code>--storage-class</code> uploads still bite.</li>
<li><strong>Minimum duration</strong>: deleting or overwriting a Deep Archive object after 10 days still bills 180 days. Don't put churny data in cold tiers.</li>
<li><strong>Retrieval</strong>: restoring 50 TB from Glacier Flexible (standard tier ~$0.01/GB) is ~$500 plus requests — and hours. Bulk tier is cheaper and slower. Test your DR restore time, not just the price.</li>
</ul>
<blockquote>💡 Real world: Intelligent-Tiering is usually the best default for mixed data ≥128 KB per object — no retrieval fees, no minimum duration. It doesn't help billions of tiny objects: objects under 128 KB are never monitored or moved, so they stay at the frequent-tier price.</blockquote>`,
`<p>Lifecycle config ברמת production ל-bucket של לוגים עם versioning:</p>
<pre>{
  "Rules": [
    {
      "ID": "logs-tiering",
      "Filter": { "Prefix": "logs/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30,  "StorageClass": "STANDARD_IA" },
        { "Days": 90,  "StorageClass": "GLACIER_IR" },
        { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
      ],
      "Expiration": { "Days": 2555 },
      "NoncurrentVersionTransitions": [ { "NoncurrentDays": 30, "StorageClass": "GLACIER_IR" } ],
      "NoncurrentVersionExpiration": { "NoncurrentDays": 90, "NewerNoncurrentVersions": 3 }
    },
    {
      "ID": "hygiene",
      "Filter": {},
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 },
      "Expiration": { "ExpiredObjectDeleteMarker": true }
    }
  ]
}</pre>
<pre>aws s3api put-bucket-lifecycle-configuration --bucket acme-logs --lifecycle-configuration file://lifecycle.json</pre>
<p>המלכודות, עם מספרים:</p>
<ul>
<li><strong>בקשות transition עולות כסף לכל אובייקט</strong>: ~$0.01 לכל 1,000 ל-IA, ~$0.02 ל-Glacier IR, ~$0.05 לכל 1,000 ל-Deep Archive. 2 מיליארד אובייקטים של לוגים בגודל 20 KB ← Deep Archive = <strong>$100,000</strong> על transitions כדי לחסוך רק ~$450 בחודש אחרי ה-overhead של ~40 KB metadata לכל אובייקט — break-even של ~18 שנה. קודם מאחדים קבצים קטנים (compaction ל-Parquet או gzip של 100 MB+).</li>
<li><strong>אובייקטים קטנים ב-IA</strong>: אובייקט של 4 KB מחויב כ-128 KB — פי 32 מהגודל. Lifecycle של S3 כבר לא מעביר כברירת מחדל אובייקטים מתחת ל-128 KB, אבל העלאות ידניות עם <code>--storage-class</code> עדיין נושכות.</li>
<li><strong>Minimum duration</strong>: מחיקה או דריסה של אובייקט ב-Deep Archive אחרי 10 ימים עדיין מחויבת על 180 יום. לא שמים נתונים שמשתנים הרבה ב-tiers קרים.</li>
<li><strong>שליפה</strong>: restore של 50 TB מ-Glacier Flexible (standard tier ~$0.01 ל-GB) זה ~$500 ועוד requests — ושעות. Bulk tier זול יותר ואיטי יותר. תבדוק את זמן ה-restore ב-DR, לא רק את המחיר.</li>
</ul>
<blockquote>💡 Real world: Intelligent-Tiering הוא בדרך כלל ברירת המחדל הכי טובה לנתונים מעורבים עם אובייקטים של 128 KB ומעלה — בלי retrieval fees, בלי minimum duration. הוא לא עוזר למיליארדים של אובייקטים זעירים: אובייקטים מתחת ל-128 KB לא מנוטרים ולא זזים, אז הם נשארים במחיר של ה-frequent tier.</blockquote>`)
    },
    {
      h: t("Versioning, delete markers and Object Lock", "Versioning, delete markers ו-Object Lock"),
      body: t(
`<ul>
<li><strong>Versioning</strong> keeps every overwrite and turns DELETE into a <em>delete marker</em> — your undo button against bad deploys and ransomware. But every version is billed. A bucket rewritten daily keeps growing forever unless you add <code>NoncurrentVersionExpiration</code>.</li>
<li><strong>Delete markers</strong> pile up after expiration; <code>ExpiredObjectDeleteMarker: true</code> cleans the ones with no versions behind them. Many delete markers slow down LIST.</li>
<li><strong>MFA Delete</strong> (root-only to configure) requires an MFA code to permanently delete versions — rarely used now; Object Lock is the modern answer.</li>
<li><strong>Object Lock</strong> (WORM, requires versioning): <em>Governance</em> mode — users with <code>s3:BypassGovernanceRetention</code> can override; <em>Compliance</em> mode — nobody, not even root, can delete before the retain-until date. Plus <em>legal hold</em> with no expiry. Use compliance mode for backups you must survive a compromised admin; test on a small bucket first — you cannot shorten it.</li>
</ul>
<pre>aws s3api put-bucket-versioning --bucket acme-backups --versioning-configuration Status=Enabled
aws s3api put-object-lock-configuration --bucket acme-backups \
  --object-lock-configuration '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"COMPLIANCE","Days":35}}}'
aws s3api list-object-versions --bucket acme-backups --prefix db/ --max-items 5</pre>
<blockquote>⚠️ Production tip: "we enabled versioning and the bill went up 4×" is common for buckets with frequent overwrites (state files, caches, build artifacts). Use S3 Storage Lens to see noncurrent bytes per bucket, and add noncurrent expiration the same day you enable versioning.</blockquote>`,
`<ul>
<li><strong>Versioning</strong> שומר כל דריסה והופך DELETE ל-<em>delete marker</em> — כפתור ה-undo שלך מול deploys גרועים ו-ransomware. אבל כל גרסה מחויבת. Bucket שנכתב מחדש כל יום ממשיך לגדול לנצח אם לא מוסיפים <code>NoncurrentVersionExpiration</code>.</li>
<li><strong>Delete markers</strong> מצטברים אחרי expiration; <code>ExpiredObjectDeleteMarker: true</code> מנקה את אלה שאין מאחוריהם גרסאות. הרבה delete markers מאטים LIST.</li>
<li><strong>MFA Delete</strong> (רק root יכול להגדיר) דורש קוד MFA כדי למחוק גרסאות לצמיתות — כמעט לא בשימוש היום; Object Lock הוא התשובה המודרנית.</li>
<li><strong>Object Lock</strong> (WORM, דורש versioning): מצב <em>Governance</em> — משתמשים עם <code>s3:BypassGovernanceRetention</code> יכולים לעקוף; מצב <em>Compliance</em> — אף אחד, אפילו לא root, לא יכול למחוק לפני תאריך ה-retain-until. ובנוסף <em>legal hold</em> בלי תאריך תפוגה. תשתמש ב-compliance mode לגיבויים שחייבים לשרוד admin שנפרץ; תבדוק קודם על bucket קטן — אי אפשר לקצר את זה.</li>
</ul>
<pre>aws s3api put-bucket-versioning --bucket acme-backups --versioning-configuration Status=Enabled
aws s3api put-object-lock-configuration --bucket acme-backups \
  --object-lock-configuration '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"COMPLIANCE","Days":35}}}'
aws s3api list-object-versions --bucket acme-backups --prefix db/ --max-items 5</pre>
<blockquote>⚠️ Production tip: "הפעלנו versioning והחשבון עלה פי 4" זה סיפור נפוץ ב-buckets עם דריסות תכופות (state files, caches, build artifacts). תשתמש ב-S3 Storage Lens כדי לראות noncurrent bytes לכל bucket, ותוסיף noncurrent expiration באותו יום שאתה מפעיל versioning.</blockquote>`)
    },
    {
      h: t("Requests, prefixes, consistency", "Requests, prefixes ו-consistency"),
      body: t(
`<ul>
<li><strong>Request pricing</strong> (S3 Standard, illustrative): PUT/COPY/POST/LIST ~$0.005 per 1,000; GET ~$0.0004 per 1,000. A service doing 2,000 PUT/s of tiny objects = 5.2 billion PUTs/month ≈ <strong>$26,000/month in requests</strong> — far more than the storage. Batch small writes.</li>
<li><strong>Throughput per prefix</strong>: at least <strong>3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD per second per partitioned prefix</strong>. S3 splits hot prefixes automatically, but while scaling you get <code>503 SlowDown</code> — retry with exponential backoff (SDKs do). Spreading keys across prefixes (<code>logs/2026/11/14/shard=07/…</code>) multiplies the ceiling. Random hash prefixes are no longer required.</li>
<li><strong>Consistency</strong>: since December 2020, S3 is <strong>strongly consistent</strong> for PUT, DELETE and LIST — a read after a successful write returns the new object, and LIST shows it. No more "eventually consistent overwrite" bugs. What's still not atomic: there's no rename (copy + delete), and concurrent writers to one key are last-writer-wins unless you use conditional writes (<code>If-None-Match: *</code>, <code>If-Match: &lt;etag&gt;</code>).</li>
<li><strong>Large objects</strong>: multipart upload for &gt;100 MB (parts 5 MB-5 GB, up to 10,000 parts, 5 TB max object); byte-range GETs for parallel downloads.</li>
</ul>
<blockquote>💡 Real world: GCS and Azure Blob are also strongly consistent for object operations. The "list after write might miss it" folklore is from old S3 and old HDFS connectors — but stale caches in your own layer (CDN, client-side) still exist.</blockquote>`,
`<ul>
<li><strong>תמחור requests</strong> (S3 Standard, להמחשה): PUT/COPY/POST/LIST ~$0.005 לכל 1,000; GET ~$0.0004 לכל 1,000. סרוויס שעושה 2,000 PUT בשנייה של אובייקטים זעירים = 5.2 מיליארד PUTs בחודש ≈ <strong>$26,000 בחודש על requests</strong> — הרבה יותר מהאחסון. תאחד כתיבות קטנות.</li>
<li><strong>Throughput לכל prefix</strong>: לפחות <strong>3,500 PUT/COPY/POST/DELETE ו-5,500 GET/HEAD בשנייה לכל prefix מחולק</strong>. S3 מפצל prefixes חמים אוטומטית, אבל בזמן ההתרחבות מקבלים <code>503 SlowDown</code> — עושים retry עם exponential backoff (ה-SDKs עושים את זה). פיזור keys על prefixes (<code>logs/2026/11/14/shard=07/…</code>) מכפיל את התקרה. כבר לא חובה prefixes של hash אקראי.</li>
<li><strong>Consistency</strong>: מאז דצמבר 2020, S3 הוא <strong>strongly consistent</strong> ל-PUT, DELETE ו-LIST — קריאה אחרי כתיבה מוצלחת מחזירה את האובייקט החדש, ו-LIST מראה אותו. נגמרו הבאגים של "overwrite שהוא eventually consistent". מה שעדיין לא אטומי: אין rename (copy + delete), וכותבים מקבילים לאותו key הם last-writer-wins אלא אם משתמשים ב-conditional writes (<code>If-None-Match: *</code>, <code>If-Match: &lt;etag&gt;</code>).</li>
<li><strong>אובייקטים גדולים</strong>: multipart upload מעל 100 MB (חלקים של 5 MB עד 5 GB, עד 10,000 חלקים, אובייקט מקסימלי 5 TB); byte-range GETs להורדות מקבילות.</li>
</ul>
<blockquote>💡 Real world: גם GCS ו-Azure Blob הם strongly consistent בפעולות על אובייקטים. הפולקלור של "LIST אחרי כתיבה אולי יפספס" מגיע מ-S3 הישן ומ-connectors ישנים של HDFS — אבל caches ישנים בשכבה שלך (CDN, client-side) עדיין קיימים.</blockquote>`)
    },
    {
      h: t("Replication and deleting at scale", "Replication ומחיקה בקנה מידה"),
      body: t(
`<p><strong>Replication</strong> — CRR (cross-region) for DR/latency/compliance, SRR (same-region) for log aggregation or copying to another account:</p>
<ul>
<li>Versioning required on <strong>both</strong> buckets; an IAM role for S3 to assume; KMS keys must be allowed in the destination.</li>
<li>Replicates <strong>new</strong> objects only — use <strong>S3 Batch Replication</strong> for existing ones.</li>
<li>Delete markers aren't replicated unless you enable delete marker replication; permanent version deletes are never replicated (protection against malicious deletes).</li>
<li><strong>Replication Time Control</strong>: 99.99% of objects within 15 minutes, with metrics — extra cost per GB.</li>
<li>Cost = destination storage + inter-region transfer (~$0.02/GB) + replication PUT requests. Replicating 500 TB to another region once ≈ $10,000 in transfer alone.</li>
</ul>
<p><strong>Deleting a billion objects</strong>: don't write a script that LISTs and DELETEs — LIST costs, it takes days, and versions/markers remain. Instead:</p>
<ol>
<li>Add a lifecycle rule: <code>Expiration</code> (current) + <code>NoncurrentVersionExpiration</code> (1 day) + <code>ExpiredObjectDeleteMarker</code> + <code>AbortIncompleteMultipartUpload</code>.</li>
<li>Wait — lifecycle expiration is asynchronous (typically within a day or two; objects stop being billed once eligible). Expiration actions have no request charge.</li>
<li>Remember early-deletion charges for IA/Glacier objects still inside their minimum duration.</li>
<li>For a targeted set (from S3 Inventory), use S3 Batch Operations, or <code>DeleteObjects</code> with up to 1,000 keys per call.</li>
</ol>`,
`<p><strong>Replication</strong> — CRR (בין regions) ל-DR, latency או compliance, SRR (באותו region) לאיחוד לוגים או העתקה ל-account אחר:</p>
<ul>
<li>Versioning חובה ב-<strong>שני</strong> ה-buckets; IAM role ש-S3 עושה לו assume; מפתחות KMS צריכים להיות מורשים ביעד.</li>
<li>משכפל רק אובייקטים <strong>חדשים</strong> — לאובייקטים קיימים משתמשים ב-<strong>S3 Batch Replication</strong>.</li>
<li>Delete markers לא משוכפלים אלא אם מפעילים delete marker replication; מחיקות קבועות של גרסאות אף פעם לא משוכפלות (הגנה מפני מחיקות זדוניות).</li>
<li><strong>Replication Time Control</strong>: 99.99% מהאובייקטים תוך 15 דקות, עם metrics — עלות נוספת לכל GB.</li>
<li>עלות = אחסון ביעד + transfer בין regions (~$0.02 ל-GB) + requests של PUT לשכפול. שכפול חד-פעמי של 500 TB ל-region אחר ≈ $10,000 רק על transfer.</li>
</ul>
<p><strong>מחיקה של מיליארד אובייקטים</strong>: לא כותבים סקריפט שעושה LIST ו-DELETE — LIST עולה כסף, זה לוקח ימים, וגרסאות ו-markers נשארים. במקום זה:</p>
<ol>
<li>מוסיפים lifecycle rule: <code>Expiration</code> (לגרסה הנוכחית) + <code>NoncurrentVersionExpiration</code> (יום אחד) + <code>ExpiredObjectDeleteMarker</code> + <code>AbortIncompleteMultipartUpload</code>.</li>
<li>מחכים — expiration של lifecycle הוא אסינכרוני (בדרך כלל תוך יום-יומיים; אובייקטים מפסיקים להיות מחויבים כשהם זכאים). לפעולות expiration אין חיוב על requests.</li>
<li>זוכרים את חיובי המחיקה המוקדמת לאובייקטים ב-IA או Glacier שעדיין בתוך זמן המינימום שלהם.</li>
<li>לקבוצה ממוקדת (מתוך S3 Inventory), משתמשים ב-S3 Batch Operations, או ב-<code>DeleteObjects</code> עם עד 1,000 keys לקריאה.</li>
</ol>`)
    }
  ],
  handsOn: [
    { cmd: "aws s3api get-bucket-lifecycle-configuration --bucket acme-logs",
      what: t("Read the current lifecycle rules. 'NoSuchLifecycleConfiguration' on a big versioned bucket is a red flag.", "לקרוא את ה-lifecycle rules הנוכחיים. 'NoSuchLifecycleConfiguration' על bucket גדול עם versioning זה דגל אדום.") },
    { cmd: "aws s3api list-multipart-uploads --bucket acme-logs --query 'length(Uploads)'",
      what: t("Count incomplete multipart uploads — invisible in 'ls' but billed until aborted.", "לספור multipart uploads שלא הושלמו — לא רואים אותם ב-'ls' אבל משלמים עליהם עד שעושים להם abort.") },
    { cmd: "aws cloudwatch get-metric-statistics --namespace AWS/S3 --metric-name BucketSizeBytes --dimensions Name=BucketName,Value=acme-logs Name=StorageType,Value=StandardIAStorage --start-time 2026-11-12T00:00:00Z --end-time 2026-11-14T00:00:00Z --period 86400 --statistics Average",
      what: t("Daily bucket size per storage class (change StorageType: StandardStorage, GlacierInstantRetrievalStorage, DeepArchiveStorage…).", "גודל ה-bucket היומי לכל storage class (תשנה את StorageType: StandardStorage, GlacierInstantRetrievalStorage, DeepArchiveStorage…).") },
    { cmd: "aws s3api restore-object --bucket acme-archive --key db/2024-01-01.dump --restore-request '{\"Days\":3,\"GlacierJobParameters\":{\"Tier\":\"Bulk\"}}'",
      what: t("Start a restore from Glacier Flexible/Deep Archive (Bulk = cheapest, slowest). Check progress with head-object → Restore header.", "להתחיל restore מ-Glacier Flexible או Deep Archive (Bulk = הכי זול והכי איטי). בודקים התקדמות עם head-object ← כותרת Restore.") },
    { cmd: "gsutil lifecycle get gs://acme-logs  # or: az storage account management-policy show -g rg --account-name acmelogs",
      what: t("Same check on GCS and Azure Blob lifecycle policies.", "אותה בדיקה על lifecycle policies ב-GCS וב-Azure Blob.") }
  ],
  mnemonic: t("MRS-T traps of cold storage: Minimum duration, Retrieval fees, Small objects (128 KB), Transition cost per object.", "MRS-T, המלכודות של אחסון קר: Minimum duration, Retrieval fees, Small objects (128 KB), Transition לכל אובייקט."),
  pitfalls: [
    t("Lifecycle-transitioning billions of tiny objects to Glacier: per-object transition fees and metadata overhead exceed years of savings. Compact first.", "להעביר ב-lifecycle מיליארדים של אובייקטים זעירים ל-Glacier: עלות ה-transition לכל אובייקט וה-overhead של metadata עולים על שנים של חיסכון. קודם compaction."),
    t("Versioning on, no NoncurrentVersionExpiration: an overwritten 1 TB dataset becomes 30 TB after a month of daily rewrites.", "Versioning מופעל בלי NoncurrentVersionExpiration: dataset של 1 TB שנדרס כל יום הופך ל-30 TB אחרי חודש."),
    t("Planning DR on Glacier Deep Archive without testing restore time — 12-48 hours before the first byte is back.", "לתכנן DR על Glacier Deep Archive בלי לבדוק זמן restore — 12-48 שעות עד שהבייט הראשון חוזר."),
    t("Enabling Object Lock in compliance mode with a long default retention 'to be safe' — nobody can delete those objects or shorten it, including you.", "להפעיל Object Lock במצב compliance עם retention ברירת מחדל ארוך 'ליתר ביטחון' — אף אחד לא יכול למחוק את האובייקטים או לקצר את זה, כולל אתה.")
  ],
  interview: [
    { q: t("Design storage for 5 PB of application logs, queried heavily for 7 days, rarely for 90 days, kept 7 years for compliance.", "תתכנן אחסון ל-5 PB של לוגים של אפליקציה, עם שאילתות כבדות ל-7 ימים, נדירות עד 90 יום, ושמירה של 7 שנים ל-compliance."),
      a: t("Write compacted, partitioned Parquet (dt=/hour=) objects of 128 MB+ to S3 Standard; lifecycle to Standard-IA at 30 days (or Intelligent-Tiering), Glacier IR at 90, Deep Archive at 365, expire at 7 years; Object Lock compliance on the archive prefix if regulators require WORM; query recent data with Athena/Trino using partition pruning. Watch transition counts (big objects keep them low) and restore-time requirements for audits.", "לכתוב Parquet דחוס ומחולק (dt=/hour=) באובייקטים של 128 MB+ ל-S3 Standard; lifecycle ל-Standard-IA אחרי 30 יום (או Intelligent-Tiering), Glacier IR אחרי 90, Deep Archive אחרי 365, ו-expiration אחרי 7 שנים; Object Lock במצב compliance על ה-prefix של הארכיון אם הרגולטור דורש WORM; שאילתות על נתונים עדכניים עם Athena/Trino ו-partition pruning. לעקוב אחרי כמות ה-transitions (אובייקטים גדולים שומרים אותה נמוכה) ודרישות זמן ה-restore לביקורות.") },
    { q: t("Clients get 503 SlowDown from S3. What's happening and what do you do?", "Clients מקבלים 503 SlowDown מ-S3. מה קורה ומה עושים?"),
      a: t("Request rate on one prefix exceeds what its partition currently serves (3,500 writes / 5,500 reads per second per prefix) while S3 scales. Retry with exponential backoff and jitter, spread keys over more prefixes, batch small writes, and put a cache/CDN in front of hot reads.", "קצב הבקשות על prefix אחד עובר את מה שה-partition שלו משרת כרגע (3,500 כתיבות / 5,500 קריאות בשנייה לכל prefix) בזמן ש-S3 מתרחב. עושים retry עם exponential backoff ו-jitter, מפזרים keys על יותר prefixes, מאחדים כתיבות קטנות, ושמים cache או CDN מול קריאות חמות.") }
  ],
  quiz: [
    { q: t("You upload an object to Glacier Deep Archive and delete it after 30 days. How long are you billed for?", "העלית אובייקט ל-Glacier Deep Archive ומחקת אותו אחרי 30 יום. על כמה זמן אתה מחויב?"),
      options: [t("30 days", "30 יום"), t("90 days", "90 יום"), t("180 days", "180 יום"), t("365 days", "365 יום")],
      answer: 2, explain: t("Deep Archive has a 180-day minimum storage duration; early deletion is charged for the remainder.", "ל-Deep Archive יש minimum storage duration של 180 יום; מחיקה מוקדמת מחויבת על היתרה.") },
    { q: t("Since 2020, what consistency does S3 provide for a GET right after a successful PUT of a new version?", "מאז 2020, איזו consistency נותן S3 ל-GET מיד אחרי PUT מוצלח של גרסה חדשה?"),
      options: [t("Eventual — may return the old version", "Eventual — עלול להחזיר את הגרסה הישנה"), t("Strong — returns the new version", "Strong — מחזיר את הגרסה החדשה"), t("Only consistent within one AZ", "Consistent רק בתוך AZ אחד"), t("Consistent only with versioning enabled", "Consistent רק כש-versioning מופעל")],
      answer: 1, explain: t("S3 has offered strong read-after-write consistency for PUT, DELETE and LIST since December 2020, at no extra cost.", "מאז דצמבר 2020 S3 נותן strong read-after-write consistency ל-PUT, DELETE ו-LIST, בלי עלות נוספת.") },
    { q: t("A versioned bucket keeps growing although the app 'deletes' old files. What's missing?", "Bucket עם versioning ממשיך לגדול למרות שהאפליקציה 'מוחקת' קבצים ישנים. מה חסר?"),
      options: [t("Replication", "Replication"), t("NoncurrentVersionExpiration (and ExpiredObjectDeleteMarker)", "NoncurrentVersionExpiration (ו-ExpiredObjectDeleteMarker)"), t("Transfer Acceleration", "Transfer Acceleration"), t("A gateway endpoint", "Gateway endpoint")],
      answer: 1, explain: t("With versioning, DELETE only adds a delete marker; old versions remain billed until a noncurrent expiration rule removes them.", "עם versioning, DELETE רק מוסיף delete marker; הגרסאות הישנות ממשיכות להיות מחויבות עד ש-rule של noncurrent expiration מוחק אותן.") },
    { q: t("Which is the best default for objects ≥128 KB with unknown, changing access patterns?", "מה ברירת המחדל הכי טובה לאובייקטים של 128 KB ומעלה עם דפוס גישה לא ידוע ומשתנה?"),
      options: [t("Standard-IA", "Standard-IA"), t("One Zone-IA", "One Zone-IA"), t("S3 Intelligent-Tiering", "S3 Intelligent-Tiering"), t("Glacier Flexible Retrieval", "Glacier Flexible Retrieval")],
      answer: 2, explain: t("Intelligent-Tiering moves objects between tiers by observed access, with no retrieval fees or minimum duration; only a small per-object monitoring fee.", "Intelligent-Tiering מעביר אובייקטים בין tiers לפי הגישה בפועל, בלי retrieval fees ובלי minimum duration; רק monitoring fee קטן לכל אובייקט.") }
  ],
  related: ["cloud-storage", "cloud-finops", "db-backups", "pr-backups-strategy", "rel-bcdr", "cloud-data-transfer-costs"]
});

window.INFRA.glossary.push(
  { term: "S3 Intelligent-Tiering", track: "cloud", def: t("S3 storage class that moves each object between frequent, infrequent and archive-instant tiers by its real access, with no retrieval fees; small monitoring fee per object of 128 KB or more, smaller objects stay in the frequent tier.", "Storage class של S3 שמעביר כל אובייקט בין tiers של frequent, infrequent ו-archive instant לפי הגישה בפועל, בלי retrieval fees; monitoring fee קטן לכל אובייקט של 128 KB ומעלה, ואובייקטים קטנים יותר נשארים ב-frequent."), lesson: "cloud-storage-lifecycle" },
  { term: "Lifecycle rule", track: "cloud", def: t("Bucket policy that transitions objects to colder classes or expires them by age, prefix or tag — including noncurrent versions, delete markers and incomplete multipart uploads.", "מדיניות על bucket שמעבירה אובייקטים ל-classes קרים יותר או מוחקת אותם לפי גיל, prefix או tag — כולל גרסאות noncurrent, delete markers ו-multipart uploads שלא הושלמו."), lesson: "cloud-storage-lifecycle" },
  { term: "Minimum storage duration", track: "cloud", def: t("The minimum days an object is billed in a cold class even if deleted earlier: e.g. S3 IA 30, Glacier IR/Flexible 90, Deep Archive 180, GCS Archive 365.", "מספר הימים המינימלי שאובייקט מחויב ב-class קר גם אם נמחק קודם: למשל S3 IA 30, Glacier IR/Flexible 90, Deep Archive 180, GCS Archive 365."), lesson: "cloud-storage-lifecycle" }
);

/* ------------------------------------------- 5. Engineer access to prod */
window.INFRA.lessons.push({
  id: "cloud-engineer-access",
  track: "cloud",
  order: 74,
  icon: "🛂",
  level: 3,
  minutes: 14,
  title: t("Engineer Access to Production: Bastion-less, Just-in-Time, Audited", "גישת מהנדסים ל-production: בלי bastion, just-in-time, עם audit"),
  tldr: t(
    "No inbound port 22, no static SSH keys, no long-lived access keys. Engineers sign in with SSO, get short-lived credentials, reach machines through an identity-aware tunnel (SSM Session Manager, Azure Bastion, GCP IAP, Teleport, Boundary), elevate to write access just-in-time with approval and a ticket, and every session is recorded. A sealed, alarmed break-glass path covers the day SSO is down.",
    "בלי port 22 פתוח מבחוץ, בלי מפתחות SSH סטטיים, בלי access keys ארוכי-טווח. מהנדסים מתחברים עם SSO, מקבלים credentials קצרי-חיים, מגיעים למכונות דרך tunnel שמודע לזהות (SSM Session Manager, Azure Bastion, GCP IAP, Teleport, Boundary), מקבלים הרשאות כתיבה just-in-time עם אישור וטיקט, וכל session מוקלט. מסלול break-glass חתום ועם התראות מכסה את היום שבו ה-SSO למטה."
  ),
  analogy: t(
    "The old way is giving every engineer a copy of the building's master key and hoping nobody loses one. The modern way is a front desk: you show your badge (SSO + MFA), the guard calls your manager for anything sensitive (approval), you get a visitor pass that expires at 18:00 (short-lived credentials), a camera follows you around (session recording), and in the glass box by the door there's one emergency key — breaking the glass sets off an alarm everyone hears.",
    "השיטה הישנה היא לתת לכל מהנדס עותק של מפתח המאסטר של הבניין ולקוות שאף אחד לא יאבד אותו. השיטה המודרנית היא דלפק קבלה: אתה מראה תג (SSO + MFA), השומר מתקשר למנהל שלך על כל דבר רגיש (אישור), אתה מקבל כרטיס מבקר שפג ב-18:00 (credentials קצרי-חיים), מצלמה עוקבת אחריך (הקלטת session), ובקופסת הזכוכית ליד הדלת יש מפתח חירום אחד — שבירת הזכוכית מפעילה אזעקה שכולם שומעים."
  ),
  sections: [
    {
      h: t("Why bastions and static keys are the problem", "למה bastions ומפתחות סטטיים הם הבעיה"),
      body: t(
`<p>The classic setup — a public bastion on port 22 plus <code>~/.ssh/authorized_keys</code> on every host — fails in predictable ways:</p>
<ul>
<li><strong>Keys outlive people</strong>: an engineer leaves; their key is still on 400 hosts and in a few laptops' backups. Nobody can answer "who can log in to prod?"</li>
<li><strong>Shared accounts</strong>: everyone is <code>ec2-user</code> or <code>ubuntu</code>; logs show <em>a</em> login, not <em>who</em>.</li>
<li><strong>Exposed surface</strong>: the bastion is internet-facing, needs patching, and is a lateral-movement jump point into every subnet.</li>
<li><strong>No session record</strong>: you know someone connected at 03:12, not that they ran <code>DROP TABLE</code>.</li>
<li><strong>Long-lived cloud keys</strong>: <code>AKIA…</code> keys in <code>~/.aws/credentials</code> are the #1 source of cloud breaches (leaked to git, laptops, CI logs).</li>
</ul>
<p>The target state has four properties: <strong>identity-based</strong> (SSO user, not a key), <strong>short-lived</strong> (minutes to hours), <strong>least privilege by default, elevated just-in-time</strong>, and <strong>fully audited</strong> (who, when, why, what they typed).</p>
<blockquote>💡 Real world: the fastest win is usually SSM Session Manager (or IAP / Azure Bastion) replacing the bastion, plus closing port 22 in every security group. It's a few days of work and removes an entire class of findings from every pentest report.</blockquote>`,
`<p>ה-setup הקלאסי — bastion ציבורי על port 22 ועוד <code>~/.ssh/authorized_keys</code> על כל host — נכשל בדרכים צפויות:</p>
<ul>
<li><strong>מפתחות חיים יותר מאנשים</strong>: מהנדס עוזב; המפתח שלו עדיין על 400 hosts ובגיבויים של כמה לפטופים. אף אחד לא יכול לענות על "מי יכול להתחבר ל-prod?"</li>
<li><strong>חשבונות משותפים</strong>: כולם <code>ec2-user</code> או <code>ubuntu</code>; הלוגים מראים <em>שמישהו</em> התחבר, לא <em>מי</em>.</li>
<li><strong>שטח חשוף</strong>: ה-bastion פונה לאינטרנט, צריך patching, והוא נקודת קפיצה ל-lateral movement לכל subnet.</li>
<li><strong>אין הקלטה של ה-session</strong>: אתה יודע שמישהו התחבר ב-03:12, לא שהוא הריץ <code>DROP TABLE</code>.</li>
<li><strong>מפתחות ענן ארוכי-טווח</strong>: מפתחות <code>AKIA…</code> ב-<code>~/.aws/credentials</code> הם המקור מספר 1 לפריצות ענן (דולפים ל-git, ללפטופים, ללוגים של CI).</li>
</ul>
<p>למצב היעד יש ארבע תכונות: <strong>מבוסס זהות</strong> (משתמש SSO, לא מפתח), <strong>קצר-חיים</strong> (דקות עד שעות), <strong>least privilege כברירת מחדל, הרשאות מוגברות just-in-time</strong>, ו-<strong>audit מלא</strong> (מי, מתי, למה, ומה הוא הקליד).</p>
<blockquote>💡 Real world: הניצחון הכי מהיר הוא בדרך כלל SSM Session Manager (או IAP, או Azure Bastion) במקום ה-bastion, ועוד סגירת port 22 בכל security group. זה כמה ימי עבודה, ומוריד קטגוריה שלמה של ממצאים מכל דוח pentest.</blockquote>`)
    },
    {
      h: t("Bastion-less access per cloud", "גישה בלי bastion בכל ענן"),
      body: t(
`<p><strong>AWS Systems Manager Session Manager</strong>: the SSM agent on the instance opens an <em>outbound</em> HTTPS connection; no inbound ports, no keys. Needs the instance role policy <code>AmazonSSMManagedInstanceCore</code> and a path to the <code>ssm</code>, <code>ssmmessages</code> and <code>ec2messages</code> endpoints (NAT or interface endpoints).</p>
<pre># shell
aws ssm start-session --target i-0abc123def456

# port-forward to a private RDS through the instance
aws ssm start-session --target i-0abc123def456 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["orders.cluster-xyz.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}'

# keep using ssh/scp, tunnelled over SSM (~/.ssh/config)
Host i-*
  ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters portNumber=%p"</pre>
<p>Session logs go to S3/CloudWatch (configure in Session Manager preferences, KMS-encrypt them), and CloudTrail records <code>StartSession</code> with the SSO identity. IAM can scope by tag: allow <code>ssm:StartSession</code> only where <code>ssm:resourceTag/team = \${aws:PrincipalTag/team}</code>. <strong>EC2 Instance Connect Endpoint</strong> is the alternative when you want real SSH with IAM-pushed, 60-second keys.</p>
<p><strong>Azure Bastion</strong>: a managed PaaS in an <code>AzureBastionSubnet</code>; RDP/SSH over TLS from the portal or native client (Standard SKU+), with Entra ID login to VMs and session recording on Premium.</p>
<pre>az network bastion ssh --name prod-bastion --resource-group rg-hub \
  --target-resource-id /subscriptions/…/virtualMachines/vm-orders-1 --auth-type AAD</pre>
<p><strong>GCP Identity-Aware Proxy (IAP) TCP forwarding</strong>: allow ingress only from <code>35.235.240.0/20</code>, grant <code>roles/iap.tunnelResourceAccessor</code>, and combine with <strong>OS Login</strong> so Linux users map to Google identities.</p>
<pre>gcloud compute ssh vm-orders-1 --zone europe-west1-b --tunnel-through-iap
gcloud compute start-iap-tunnel db-proxy 5432 --local-host-port=localhost:15432 --zone europe-west1-b</pre>`,
`<p><strong>AWS Systems Manager Session Manager</strong>: ה-SSM agent על ה-instance פותח חיבור HTTPS <em>יוצא</em>; בלי ports נכנסים, בלי מפתחות. צריך את ה-policy <code>AmazonSSMManagedInstanceCore</code> על ה-role של ה-instance ונתיב ל-endpoints של <code>ssm</code>, <code>ssmmessages</code> ו-<code>ec2messages</code> (NAT או interface endpoints).</p>
<pre># shell
aws ssm start-session --target i-0abc123def456

# port-forward to a private RDS through the instance
aws ssm start-session --target i-0abc123def456 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["orders.cluster-xyz.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}'

# keep using ssh/scp, tunnelled over SSM (~/.ssh/config)
Host i-*
  ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters portNumber=%p"</pre>
<p>לוגים של sessions נשלחים ל-S3 או CloudWatch (מגדירים ב-preferences של Session Manager, ומצפינים ב-KMS), ו-CloudTrail מתעד <code>StartSession</code> עם זהות ה-SSO. ב-IAM אפשר להגביל לפי tag: לאפשר <code>ssm:StartSession</code> רק איפה ש-<code>ssm:resourceTag/team = \${aws:PrincipalTag/team}</code>. <strong>EC2 Instance Connect Endpoint</strong> היא האלטרנטיבה כשרוצים SSH אמיתי עם מפתחות שנדחפים דרך IAM ותקפים ל-60 שניות.</p>
<p><strong>Azure Bastion</strong>: PaaS מנוהל ב-<code>AzureBastionSubnet</code>; RDP/SSH מעל TLS מה-portal או מ-native client (מ-Standard SKU ומעלה), עם התחברות ל-VMs דרך Entra ID והקלטת sessions ב-Premium.</p>
<pre>az network bastion ssh --name prod-bastion --resource-group rg-hub \
  --target-resource-id /subscriptions/…/virtualMachines/vm-orders-1 --auth-type AAD</pre>
<p><strong>GCP Identity-Aware Proxy (IAP) TCP forwarding</strong>: מאפשרים ingress רק מ-<code>35.235.240.0/20</code>, נותנים <code>roles/iap.tunnelResourceAccessor</code>, ומשלבים עם <strong>OS Login</strong> כדי שמשתמשי Linux ימופו לזהויות של Google.</p>
<pre>gcloud compute ssh vm-orders-1 --zone europe-west1-b --tunnel-through-iap
gcloud compute start-iap-tunnel db-proxy 5432 --local-host-port=localhost:15432 --zone europe-west1-b</pre>`)
    },
    {
      h: t("Short-lived credentials via SSO, and kubectl", "Credentials קצרי-חיים דרך SSO, ו-kubectl"),
      body: t(
`<p>Humans should never hold <code>AKIA…</code> keys. Use the IdP (Okta, Entra ID, Google) → <strong>IAM Identity Center</strong> (AWS) / Entra ID (Azure) / Cloud Identity (GCP), with permission sets per account and SCIM provisioning so leavers lose access automatically.</p>
<pre>aws configure sso            # once: start URL, region, account, permission set
aws sso login --profile prod-readonly
aws sts get-caller-identity --profile prod-readonly
# → arn:aws:sts::111122223333:assumed-role/AWSReservedSSO_ReadOnly_ab12/dana@acme.com</pre>
<p>Session duration is 1-12 hours (set on the permission set). Default to <strong>read-only</strong> in prod; write roles come through JIT (next section).</p>
<p><strong>kubectl via SSO</strong> — no static kubeconfig tokens or shared certs:</p>
<ul>
<li><strong>EKS</strong>: access entries map IAM principals (including SSO roles) to Kubernetes permissions — no more <code>aws-auth</code> ConfigMap.
<pre>aws eks create-access-entry --cluster-name prod \
  --principal-arn arn:aws:iam::111122223333:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_SRE_ab12
aws eks associate-access-policy --cluster-name prod \
  --principal-arn arn:aws:iam::111122223333:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_SRE_ab12 \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy --access-scope type=cluster
aws eks update-kubeconfig --name prod --profile prod-sre</pre></li>
<li><strong>AKS</strong>: Entra ID integration + Azure RBAC; disable local accounts (<code>az aks update --disable-local-accounts</code>) and use <code>kubelogin convert-kubeconfig -l azurecli</code>.</li>
<li><strong>GKE</strong>: IAM + <code>gke-gcloud-auth-plugin</code>; Google Groups for RBAC.</li>
<li><strong>Self-managed</strong>: kube-apiserver OIDC (<code>--oidc-issuer-url</code> or the structured <code>AuthenticationConfiguration</code>) with the <code>kubectl oidc-login</code> plugin; map IdP groups to RoleBindings.</li>
</ul>
<blockquote>⚠️ Production tip: bind Kubernetes RBAC to <strong>groups</strong>, never individual users. Then joining/leaving the "sre-oncall" group in the IdP is the only change needed — and access reviews are a group membership report.</blockquote>`,
`<p>לבני אדם אסור להחזיק מפתחות <code>AKIA…</code>. משתמשים ב-IdP (Okta, Entra ID, Google) ← <strong>IAM Identity Center</strong> (AWS) / Entra ID (Azure) / Cloud Identity (GCP), עם permission sets לכל account ו-SCIM provisioning כדי שמי שעוזב יאבד גישה אוטומטית.</p>
<pre>aws configure sso            # once: start URL, region, account, permission set
aws sso login --profile prod-readonly
aws sts get-caller-identity --profile prod-readonly
# → arn:aws:sts::111122223333:assumed-role/AWSReservedSSO_ReadOnly_ab12/dana@acme.com</pre>
<p>אורך ה-session הוא 1-12 שעות (מוגדר על ה-permission set). ברירת המחדל ב-prod היא <strong>read-only</strong>; roles של כתיבה מגיעים דרך JIT (בסעיף הבא).</p>
<p><strong>kubectl דרך SSO</strong> — בלי tokens סטטיים ב-kubeconfig ובלי certs משותפים:</p>
<ul>
<li><strong>EKS</strong>: access entries ממפים IAM principals (כולל roles של SSO) להרשאות ב-Kubernetes — בלי ה-ConfigMap של <code>aws-auth</code>.
<pre>aws eks create-access-entry --cluster-name prod \
  --principal-arn arn:aws:iam::111122223333:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_SRE_ab12
aws eks associate-access-policy --cluster-name prod \
  --principal-arn arn:aws:iam::111122223333:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_SRE_ab12 \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy --access-scope type=cluster
aws eks update-kubeconfig --name prod --profile prod-sre</pre></li>
<li><strong>AKS</strong>: אינטגרציה עם Entra ID + Azure RBAC; מכבים local accounts (<code>az aks update --disable-local-accounts</code>) ומשתמשים ב-<code>kubelogin convert-kubeconfig -l azurecli</code>.</li>
<li><strong>GKE</strong>: IAM + <code>gke-gcloud-auth-plugin</code>; Google Groups ל-RBAC.</li>
<li><strong>מנוהל לבד</strong>: OIDC ב-kube-apiserver (<code>--oidc-issuer-url</code> או ה-<code>AuthenticationConfiguration</code> המובנה) עם ה-plugin <code>kubectl oidc-login</code>; ממפים groups מה-IdP ל-RoleBindings.</li>
</ul>
<blockquote>⚠️ Production tip: תקשור RBAC של Kubernetes ל-<strong>groups</strong>, אף פעם לא למשתמשים בודדים. ככה הצטרפות או עזיבה של ה-group ‏"sre-oncall" ב-IdP היא השינוי היחיד שצריך — ו-access review הוא דוח חברות ב-group.</blockquote>`)
    },
    {
      h: t("Just-in-time privileged access, Teleport and Boundary", "גישה מוגברת just-in-time, Teleport ו-Boundary"),
      body: t(
`<p><strong>JIT access</strong>: nobody has standing write/admin in prod. You request a role for a duration, with a reason (incident or ticket), someone approves (or auto-approve for on-call during an active incident), access expires on its own, and the whole thing is logged.</p>
<table>
<tr><th>Tool</th><th>Scope</th><th>Notes</th></tr>
<tr><td>Entra <strong>PIM</strong> (Azure)</td><td>Azure roles, Entra roles, groups</td><td>Eligible vs active assignments, max activation hours, approval, MFA on activation</td></tr>
<tr><td>GCP <strong>Privileged Access Manager</strong></td><td>IAM roles on projects/folders</td><td>Entitlements with max duration and approvers</td></tr>
<tr><td>AWS IAM Identity Center + <strong>TEAM</strong> (open-source AWS solution) or third-party (Okta, ConductorOne, Opal…)</td><td>Permission sets per account</td><td>Temporarily assigns a permission set, then removes it</td></tr>
<tr><td><strong>Teleport</strong></td><td>SSH, Kubernetes, DBs, web apps, RDP</td><td>Short-lived certs, access requests, session recording and playback</td></tr>
<tr><td><strong>HashiCorp Boundary</strong></td><td>TCP targets (SSH, DB, k8s)</td><td>Identity-based sessions; credential brokering/injection from Vault so users never see the password</td></tr>
</table>
<pre># Teleport: login, request elevation, use it
tsh login --proxy=teleport.acme.com --auth=okta
tsh request create --roles=prod-db-admin --reason="INC-4821 stuck migration"
tsh login --request-id=8f2c…          # after approval; certificate valid e.g. 1h
tsh ssh dana@orders-db-1
tsh kube login prod-eu &amp;&amp; kubectl get pods -n orders
tsh db connect orders-pg --db-user=readonly

# Boundary
boundary authenticate oidc
boundary connect ssh -target-id ttcp_1234567890</pre>
<p>Recordings matter for investigations and compliance (SOC 2, ISO 27001, PCI DSS require attributable admin access). Teleport records the PTY stream (and with enhanced recording, the syscalls via eBPF); <code>kubectl exec</code> sessions through it are recorded too.</p>
<blockquote>💡 Real world: make the safe path the <em>fastest</em> path. If JIT approval takes 20 minutes at 3 AM, engineers will hoard standing access. Auto-approve for the on-call rotation with an incident link, and require a human approver only outside incidents.</blockquote>`,
`<p><strong>גישת JIT</strong>: לאף אחד אין הרשאות כתיבה או admin קבועות ב-prod. מבקשים role לזמן מוגבל, עם סיבה (incident או טיקט), מישהו מאשר (או אישור אוטומטי ל-on-call בזמן incident פעיל), הגישה פגה מעצמה, והכל מתועד.</p>
<table>
<tr><th>כלי</th><th>היקף</th><th>הערות</th></tr>
<tr><td><strong>PIM</strong> של Entra (Azure)</td><td>Azure roles, Entra roles, groups</td><td>Eligible מול active assignments, מקסימום שעות הפעלה, אישור, MFA בהפעלה</td></tr>
<tr><td><strong>Privileged Access Manager</strong> של GCP</td><td>IAM roles על projects ו-folders</td><td>Entitlements עם זמן מקסימלי ומאשרים</td></tr>
<tr><td>AWS IAM Identity Center + <strong>TEAM</strong> (פתרון open-source של AWS) או צד שלישי (Okta, ConductorOne, Opal…)</td><td>Permission sets לכל account</td><td>מצמיד permission set זמנית, ואז מסיר אותו</td></tr>
<tr><td><strong>Teleport</strong></td><td>SSH, Kubernetes, DBs, web apps, RDP</td><td>Certs קצרי-חיים, access requests, הקלטה וניגון של sessions</td></tr>
<tr><td><strong>HashiCorp Boundary</strong></td><td>יעדי TCP (SSH, DB, k8s)</td><td>Sessions מבוססי זהות; credential brokering/injection מ-Vault כך שהמשתמש אף פעם לא רואה את הסיסמה</td></tr>
</table>
<pre># Teleport: login, request elevation, use it
tsh login --proxy=teleport.acme.com --auth=okta
tsh request create --roles=prod-db-admin --reason="INC-4821 stuck migration"
tsh login --request-id=8f2c…          # after approval; certificate valid e.g. 1h
tsh ssh dana@orders-db-1
tsh kube login prod-eu &amp;&amp; kubectl get pods -n orders
tsh db connect orders-pg --db-user=readonly

# Boundary
boundary authenticate oidc
boundary connect ssh -target-id ttcp_1234567890</pre>
<p>הקלטות חשובות לחקירות ול-compliance (SOC 2, ISO 27001 ו-PCI DSS דורשים גישת admin שאפשר לשייך לאדם). Teleport מקליט את ה-PTY stream (וב-enhanced recording גם את ה-syscalls דרך eBPF); גם sessions של <code>kubectl exec</code> שעוברים דרכו מוקלטים.</p>
<blockquote>💡 Real world: תדאג שהדרך הבטוחה תהיה הדרך ה<em>מהירה</em>. אם אישור JIT לוקח 20 דקות ב-3 בלילה, מהנדסים יאגרו הרשאות קבועות. אישור אוטומטי לרוטציית ה-on-call עם לינק ל-incident, ומאשר אנושי רק מחוץ ל-incidents.</blockquote>`)
    },
    {
      h: t("Break-glass, audit, and removing SSH keys for good", "Break-glass, audit, והסרת מפתחות SSH לתמיד"),
      body: t(
`<p><strong>Break-glass</strong> is for when the normal path is down (IdP outage, SSO misconfiguration, region issue with Identity Center):</p>
<ul>
<li>1-2 emergency IAM users (or Entra cloud-only accounts) per org, excluded from conditional access that depends on the IdP, with <strong>hardware MFA</strong> keys stored in a safe; passwords split or in a sealed vault.</li>
<li>An alarm on <em>any</em> use: EventBridge rule on <code>ConsoleLogin</code>/<code>AssumeRole</code> for that principal → page security + post to the incident channel. Root account the same.</li>
<li>Tested quarterly (a scheduled drill that expects the alarm), and credentials rotated after every real use.</li>
</ul>
<pre>{
  "source": ["aws.signin"],
  "detail-type": ["AWS Console Sign In via CloudTrail"],
  "detail": { "userIdentity": { "arn": ["arn:aws:iam::111122223333:user/breakglass-1"] } }
}</pre>
<p><strong>Audit</strong>: CloudTrail organization trail (management events, plus data events for sensitive buckets) to a locked log-archive account; Session Manager/Teleport recordings in WORM storage; Kubernetes audit logs; quarterly access reviews generated from IdP groups.</p>
<p><strong>Removing static SSH keys</strong> — a migration checklist:</p>
<ol>
<li>Install/verify SSM agent (or IAP/OS Login, Azure Entra login) on all hosts; confirm everyone can connect the new way.</li>
<li>Launch templates and AMIs without <code>KeyName</code>; remove keys from <code>authorized_keys</code> via config management.</li>
<li>Remove port 22 from security groups; enforce with AWS Config <code>restricted-ssh</code> or an SCP/OPA policy; alert on <code>0.0.0.0/0:22</code>.</li>
<li>Deny <code>ec2:CreateKeyPair</code>/<code>ImportKeyPair</code> via SCP except for a break-glass role.</li>
<li>Delete IAM users' access keys for humans; alert on <code>CreateAccessKey</code>.</li>
</ol>
<blockquote>⚠️ Production tip: keep the serial console (EC2 Serial Console, Azure Serial Console, GCP serial port) available but locked to break-glass roles — when networking or the agent is broken, it's the only way in.</blockquote>`,
`<p><strong>Break-glass</strong> מיועד למצב שבו המסלול הרגיל למטה (תקלה ב-IdP, הגדרת SSO שגויה, בעיית region עם Identity Center):</p>
<ul>
<li>1-2 משתמשי IAM לחירום (או חשבונות cloud-only ב-Entra) לכל ארגון, מוחרגים מ-conditional access שתלוי ב-IdP, עם מפתחות <strong>MFA חומרתיים</strong> בכספת; סיסמאות מפוצלות או ב-vault חתום.</li>
<li>התראה על <em>כל</em> שימוש: EventBridge rule על <code>ConsoleLogin</code>/<code>AssumeRole</code> של ה-principal הזה ← page לאבטחה + הודעה בערוץ ה-incident. אותו דבר ל-root account.</li>
<li>נבדק כל רבעון (תרגיל מתוזמן שמצפה להתראה), וה-credentials מוחלפים אחרי כל שימוש אמיתי.</li>
</ul>
<pre>{
  "source": ["aws.signin"],
  "detail-type": ["AWS Console Sign In via CloudTrail"],
  "detail": { "userIdentity": { "arn": ["arn:aws:iam::111122223333:user/breakglass-1"] } }
}</pre>
<p><strong>Audit</strong>: CloudTrail organization trail (management events, ועוד data events ל-buckets רגישים) ל-account של log-archive נעול; הקלטות של Session Manager או Teleport באחסון WORM; audit logs של Kubernetes; access reviews רבעוניים שנוצרים מ-groups ב-IdP.</p>
<p><strong>הסרת מפתחות SSH סטטיים</strong> — checklist למיגרציה:</p>
<ol>
<li>להתקין או לוודא SSM agent (או IAP/OS Login, או Entra login ב-Azure) על כל ה-hosts; לוודא שכולם מצליחים להתחבר בדרך החדשה.</li>
<li>Launch templates ו-AMIs בלי <code>KeyName</code>; להסיר מפתחות מ-<code>authorized_keys</code> דרך config management.</li>
<li>להסיר port 22 מה-security groups; לאכוף עם AWS Config <code>restricted-ssh</code> או SCP/OPA; התראה על <code>0.0.0.0/0:22</code>.</li>
<li>לחסום <code>ec2:CreateKeyPair</code>/<code>ImportKeyPair</code> ב-SCP חוץ מ-role של break-glass.</li>
<li>למחוק access keys של משתמשי IAM אנושיים; התראה על <code>CreateAccessKey</code>.</li>
</ol>
<blockquote>⚠️ Production tip: תשאיר את ה-serial console (EC2 Serial Console, Azure Serial Console, serial port ב-GCP) זמין אבל נעול ל-roles של break-glass — כשהרשת או ה-agent שבורים, זו הדרך היחידה להיכנס.</blockquote>`)
    }
  ],
  diagram: "engineer --SSO+MFA--> IdP --> short-lived creds (1-12h)\n   |-- read-only by default\n   |-- JIT request (reason + approval) --> write role, expires\n   '--> SSM / IAP / Bastion / Teleport (outbound agent, no port 22) --> host / k8s / DB\n             '--> session recording + CloudTrail --> WORM log archive",
  handsOn: [
    { cmd: "aws ssm describe-instance-information --query 'InstanceInformationList[].[InstanceId,PingStatus,AgentVersion,PlatformName]' --output table",
      what: t("Which instances are reachable via Session Manager (PingStatus Online)? Any missing ones still depend on SSH.", "אילו instances זמינים דרך Session Manager (PingStatus Online)? מה שחסר עדיין תלוי ב-SSH.") },
    { cmd: "aws ec2 describe-security-groups --filters Name=ip-permission.from-port,Values=22 Name=ip-permission.cidr,Values=0.0.0.0/0 --query 'SecurityGroups[].[GroupId,GroupName]' --output table",
      what: t("Find security groups that still open SSH to the whole internet.", "למצוא security groups שעדיין פותחים SSH לכל האינטרנט.") },
    { cmd: "aws iam generate-credential-report && aws iam get-credential-report --query Content --output text | base64 -d | cut -d, -f1,9,10,11 | column -t -s,",
      what: t("List IAM users with active access keys and when they were last rotated/used — human users shouldn't have any.", "רשימת משתמשי IAM עם access keys פעילים ומתי הוחלפו או נוצלו לאחרונה — למשתמשים אנושיים לא אמורים להיות כאלה.") },
    { cmd: "kubectl auth whoami && kubectl auth can-i --list -n orders",
      what: t("Check which identity kubectl uses (should be your SSO user/role, not a shared cert) and what it may do.", "לבדוק באיזו זהות kubectl משתמש (אמור להיות משתמש או role של SSO, לא cert משותף) ומה מותר לה לעשות.") },
    { cmd: "gcloud compute ssh vm-orders-1 --zone europe-west1-b --tunnel-through-iap --dry-run",
      what: t("Show the exact IAP tunnel command GCP would run — no public IP or open port needed on the VM.", "להראות את פקודת ה-IAP tunnel המדויקת ש-GCP יריץ — בלי IP ציבורי ובלי port פתוח על ה-VM.") }
  ],
  mnemonic: t("SAFE access: SSO identity, Approval for elevation (JIT), Fleeting credentials, Everything recorded. Break-glass rings an alarm.", "גישה SAFE: SSO identity, Approval להרשאות מוגברות (JIT), Fleeting credentials, Everything recorded. Break-glass מפעיל אזעקה."),
  pitfalls: [
    t("Replacing the bastion with SSM but leaving port 22 open and keys on hosts 'just in case' — you added a path instead of removing one.", "להחליף את ה-bastion ב-SSM אבל להשאיר port 22 פתוח ומפתחות על ה-hosts 'ליתר ביטחון' — הוספת נתיב במקום להסיר אחד."),
    t("Break-glass account that depends on the IdP it's meant to bypass, or that nobody has tested in a year — the safe is locked when you need it.", "חשבון break-glass שתלוי ב-IdP שהוא אמור לעקוף, או שאף אחד לא בדק אותו שנה — הכספת נעולה בדיוק כשצריך אותה."),
    t("JIT so slow that people keep standing admin 'for emergencies' — measure time-to-access and auto-approve on-call during incidents.", "JIT כל כך איטי שאנשים שומרים admin קבוע 'למקרי חירום' — תמדוד time-to-access ותאשר אוטומטית ל-on-call בזמן incidents."),
    t("Session Manager logs disabled or writable by the same role that connects — the audit trail can be erased by the person it's meant to watch.", "לוגים של Session Manager כבויים, או ניתנים לכתיבה ע\"י אותו role שמתחבר — מי שה-audit אמור לעקוב אחריו יכול למחוק אותו.")
  ],
  interview: [
    { q: t("Design production access for 150 engineers across 40 AWS accounts and 12 EKS clusters.", "תתכנן גישה ל-production ל-150 מהנדסים על 40 accounts של AWS ו-12 clusters של EKS."),
      a: t("IdP groups → IAM Identity Center permission sets via SCIM; read-only by default in prod; JIT elevation (TEAM or a commercial tool) with ticket/incident reason and auto-approve for on-call; SSM Session Manager for hosts with logs to a locked log-archive account, port 22 closed and KeyName banned via SCP; EKS access entries mapping SSO roles to view/edit policies, RBAC bound to groups; CloudTrail org trail; two break-glass users with hardware MFA and EventBridge alarms, tested quarterly; quarterly access reviews.", "Groups ב-IdP ← permission sets ב-IAM Identity Center דרך SCIM; read-only כברירת מחדל ב-prod; הרשאות מוגברות ב-JIT (TEAM או כלי מסחרי) עם סיבה מטיקט או incident ואישור אוטומטי ל-on-call; SSM Session Manager ל-hosts עם לוגים ל-account נעול של log-archive, port 22 סגור ו-KeyName חסום ב-SCP; EKS access entries שממפים roles של SSO ל-policies של view/edit, ו-RBAC שקשור ל-groups; CloudTrail org trail; שני משתמשי break-glass עם MFA חומרתי והתראות EventBridge, שנבדקים כל רבעון; access reviews רבעוניים.") },
    { q: t("SSO is down during an incident. How do engineers get in, and how do you keep that safe?", "ה-SSO למטה באמצע incident. איך מהנדסים נכנסים, ואיך שומרים על זה בטוח?"),
      a: t("Through break-glass: pre-created emergency principals independent of the IdP, hardware MFA in a safe, use triggers an immediate page and incident-channel post, actions are logged by CloudTrail, credentials rotated afterwards and a review of everything done. Ideally a two-person rule to open the safe.", "דרך break-glass: principals לחירום שנוצרו מראש ולא תלויים ב-IdP, MFA חומרתי בכספת, שימוש מפעיל page מיידי והודעה בערוץ ה-incident, הפעולות מתועדות ב-CloudTrail, וה-credentials מוחלפים אחר כך עם סקירה של כל מה שנעשה. אידיאלית, כלל של שני אנשים לפתיחת הכספת.") }
  ],
  quiz: [
    { q: t("Why does SSM Session Manager not need inbound port 22?", "למה SSM Session Manager לא צריך port 22 נכנס?"),
      options: [t("It uses UDP instead", "הוא משתמש ב-UDP במקום"), t("The agent on the instance opens an outbound HTTPS connection to the SSM service", "ה-agent על ה-instance פותח חיבור HTTPS יוצא לשירות SSM"), t("It goes through the Internet Gateway on port 443 inbound", "הוא עובר דרך ה-Internet Gateway על port 443 נכנס"), t("It uses the EC2 serial console", "הוא משתמש ב-EC2 serial console")],
      answer: 1, explain: t("The SSM agent dials out (via NAT or VPC interface endpoints for ssm/ssmmessages/ec2messages); sessions are brokered over that channel, authorized by IAM.", "ה-SSM agent מתחבר החוצה (דרך NAT או VPC interface endpoints של ssm/ssmmessages/ec2messages); ה-sessions עוברים בערוץ הזה, ומאושרים ע\"י IAM.") },
    { q: t("What makes access 'just-in-time'?", "מה הופך גישה ל-'just-in-time'?"),
      options: [t("Engineers get admin on day one", "מהנדסים מקבלים admin ביום הראשון"), t("Elevated rights are requested for a limited time, with a reason and approval, and expire automatically", "הרשאות מוגברות מתבקשות לזמן מוגבל, עם סיבה ואישור, ופגות אוטומטית"), t("Passwords are rotated yearly", "סיסמאות מוחלפות פעם בשנה"), t("SSH keys are generated per engineer", "מפתחות SSH נוצרים לכל מהנדס")],
      answer: 1, explain: t("JIT removes standing privilege: access exists only for the window it's needed, and every grant is attributable.", "JIT מבטל הרשאות קבועות: הגישה קיימת רק בחלון הזמן שצריך אותה, וכל הענקה אפשר לשייך לאדם.") },
    { q: t("Which is a correct break-glass practice?", "מה מהבאים הוא נוהל break-glass נכון?"),
      options: [t("Store the credentials in the team wiki for quick access", "לשמור את ה-credentials ב-wiki של הצוות לגישה מהירה"), t("Make the break-glass account log in through the corporate IdP", "לגרום לחשבון ה-break-glass להתחבר דרך ה-IdP של הארגון"), t("Hardware MFA in a safe, an alarm on every use, and a quarterly test", "MFA חומרתי בכספת, התראה על כל שימוש, ובדיקה רבעונית"), t("Use it for routine deploys so it stays tested", "להשתמש בו ל-deploys שגרתיים כדי שיישאר בדוק")],
      answer: 2, explain: t("Break-glass must work when the IdP doesn't, be hard to use casually, and be loud when used.", "Break-glass חייב לעבוד כשה-IdP לא עובד, להיות קשה לשימוש סתמי, ולהיות רועש כשמשתמשים בו.") },
    { q: t("On EKS, what replaces the aws-auth ConfigMap for mapping SSO roles to cluster permissions?", "ב-EKS, מה מחליף את ה-ConfigMap של aws-auth למיפוי roles של SSO להרשאות ב-cluster?"),
      options: [t("EKS access entries + access policies", "EKS access entries + access policies"), t("Static kubeconfig tokens", "Tokens סטטיים ב-kubeconfig"), t("Security groups for pods", "Security groups for pods"), t("IRSA", "IRSA")],
      answer: 0, explain: t("Access entries map IAM principals to Kubernetes groups or managed access policies via the EKS API. IRSA/Pod Identity are for workloads, not humans.", "Access entries ממפים IAM principals ל-groups של Kubernetes או ל-access policies מנוהלים דרך ה-API של EKS. IRSA ו-Pod Identity מיועדים ל-workloads, לא לבני אדם.") }
  ],
  related: ["cloud-iam-security", "cloud-landing-zones", "cloud-secrets-management", "linux-ssh-remote", "net-isolation", "k8s-namespaces-rbac", "staff-zero-trust-secrets", "pr-data-security"]
});

window.INFRA.glossary.push(
  { term: "SSM Session Manager", track: "cloud", def: t("AWS Systems Manager feature for shell and port-forwarding sessions to instances via an outbound agent — no inbound ports, no SSH keys, IAM-authorized and logged.", "יכולת של AWS Systems Manager ל-sessions של shell ו-port forwarding ל-instances דרך agent שמתחבר החוצה — בלי ports נכנסים, בלי מפתחות SSH, עם הרשאות IAM ולוגים."), lesson: "cloud-engineer-access" },
  { term: "Just-in-time access (JIT)", track: "cloud", def: t("Granting privileged roles only on request, for a limited time, with a reason and approval, expiring automatically — no standing admin.", "הענקת roles מוגברים רק לפי בקשה, לזמן מוגבל, עם סיבה ואישור, ופקיעה אוטומטית — בלי admin קבוע."), lesson: "cloud-engineer-access" },
  { term: "Identity-Aware Proxy (IAP)", track: "cloud", def: t("GCP service that authorizes access to apps and VMs by user identity; IAP TCP forwarding gives SSH/RDP to VMs without public IPs or open ports.", "שירות של GCP שמאשר גישה לאפליקציות ול-VMs לפי זהות המשתמש; IAP TCP forwarding נותן SSH/RDP ל-VMs בלי IP ציבורי ובלי ports פתוחים."), lesson: "cloud-engineer-access" }
);

/* -------------------------------------------------------------- Scenario */
window.INFRA.scenarios.push({
  id: "nat-gateway-bill-shock",
  icon: "💸",
  title: t("The NAT gateway ate the budget", "ה-NAT gateway אכל את התקציב"),
  start: "s1",
  steps: {
    s1: {
      text: t("Monday 09:30. Finance pings the platform channel: last month's AWS bill for the prod account is $31,800 instead of the usual ~$19,000. Nothing obviously changed — no new services, traffic flat. Your manager asks you to find it today.",
              "יום שני 09:30. מכספים כותבים בערוץ של הפלטפורמה: החשבון של AWS בחודש שעבר ל-account של prod הוא $31,800 במקום ה-~$19,000 הרגילים. שום דבר לא השתנה בבירור — אין סרוויסים חדשים, התעבורה שטוחה. המנהל שלך מבקש שתמצא את זה היום."),
      data: `Cost Explorer — prod (111122223333), Oct vs Sep, group by SERVICE
SERVICE                     SEP        OCT       DELTA
EC2 - Other              $2,940    $14,610   +$11,670
Amazon EC2 (compute)     $9,880    $10,120     +$240
Amazon RDS               $3,410    $3,420       +$10
Amazon S3                $1,150    $1,180       +$30`,
      choices: [
        c("Drill into 'EC2 - Other' grouped by usage type", "לצלול ל-'EC2 - Other' עם group by לפי usage type", "s2", 15,
          "Right: 'EC2 - Other' is a bucket for NAT, EBS, transfer and more — usage type tells you which.",
          "נכון: 'EC2 - Other' זה דלי של NAT, EBS, transfer ועוד — ה-usage type אומר לך מה מהם."),
        c("Buy a bigger Savings Plan to bring the bill down", "לקנות Savings Plan גדול יותר כדי להוריד את החשבון", "s1b", -10,
          "Compute barely moved. Savings Plans don't cover NAT or data transfer at all.",
          "ה-compute כמעט לא זז. Savings Plans בכלל לא מכסים NAT או data transfer."),
        c("Assume it's a billing error and open an AWS support case", "להניח שזו טעות בחיוב ולפתוח case ב-AWS support", "s1b", -5,
          "Billing errors are rare; a sudden jump in one line is almost always real usage.",
          "טעויות חיוב נדירות; קפיצה פתאומית בשורה אחת היא כמעט תמיד שימוש אמיתי.")
      ]
    },
    s1b: {
      text: t("A week later, AWS support politely confirms the charges are correct usage. Meanwhile the daily run-rate is still ~$390/day above normal. Back to the data.",
              "שבוע אחרי, AWS support מאשרים בנימוס שהחיובים הם שימוש תקין. בינתיים קצב ההוצאה היומי עדיין ~$390 ביום מעל הרגיל. חוזרים לנתונים."),
      choices: [
        c("Drill into 'EC2 - Other' by usage type", "לצלול ל-'EC2 - Other' לפי usage type", "s2", 5,
          "Better late than never — another week of waste is already on the bill.",
          "עדיף מאוחר מאשר אף פעם — עוד שבוע של בזבוז כבר על החשבון.")
      ]
    },
    s2: {
      text: t("The usage-type breakdown is unambiguous.", "הפירוק לפי usage type חד-משמעי."),
      data: `EC2 - Other, Oct, group by USAGE_TYPE
USAGE_TYPE                          QTY           COST
USE1-NatGateway-Bytes          241,300 GB    $10,858
USE1-NatGateway-Hours            2,232 h        $100
USE1-DataTransfer-Regional-Bytes 61,000 GB      $610
USE1-EBS:VolumeUsage.gp3        ...           $2,140
(Sep NatGateway-Bytes: 18,900 GB  $850)`,
      choices: [
        c("Find which NAT gateway and which flows: CUR by resource ID, then VPC flow logs on its ENI", "למצוא איזה NAT gateway ואילו flows: CUR לפי resource ID, ואז VPC flow logs על ה-ENI שלו", "s3", 15,
          "Exactly: line → resource → flows.",
          "בדיוק: שורה ← משאב ← flows."),
        c("Delete the NAT gateways — private subnets don't need internet", "למחוק את ה-NAT gateways — subnets פרטיים לא צריכים אינטרנט", "lose", -25,
          "Pods lose access to ECR, STS, external APIs and package mirrors. Image pulls fail, new nodes can't join, deploys break. You caused an outage to fix a bill.",
          "ה-Pod-ים מאבדים גישה ל-ECR, ל-STS, ל-APIs חיצוניים ול-package mirrors. משיכת images נכשלת, nodes חדשים לא מצטרפים, deploys נשברים. גרמת ל-outage כדי לתקן חשבון."),
        c("Move all workloads into public subnets with public IPs", "להעביר את כל ה-workloads ל-subnets ציבוריים עם IPs ציבוריים", "s2b", -10,
          "Removes NAT fees but exposes every node to the internet and adds $0.005/h per public IPv4. A security regression to dodge a config fix.",
          "מוריד את חיובי ה-NAT אבל חושף כל node לאינטרנט ומוסיף $0.005 לשעה לכל public IPv4. נסיגה באבטחה כדי להתחמק מתיקון config.")
      ]
    },
    s2b: {
      text: t("The security team blocks the change in review within an hour. You still don't know what's generating 240 TB.",
              "צוות האבטחה חוסם את השינוי ב-review תוך שעה. אתה עדיין לא יודע מה מייצר 240 TB."),
      choices: [
        c("Go find the flows behind the NAT bytes", "ללכת למצוא את ה-flows שמאחורי הבייטים של ה-NAT", "s3", 5,
          "Measure first, then change.",
          "קודם מודדים, אחר כך משנים.")
      ]
    },
    s3: {
      text: t("CUR shows 92% of the bytes on nat-0b7e… in us-east-1a/b/c equally. You enable flow logs on the NAT ENIs and query the top destinations, then match the IPs against ip-ranges.json.",
              "ה-CUR מראה ש-92% מהבייטים על nat-0b7e… ב-us-east-1a/b/c באופן שווה. אתה מפעיל flow logs על ה-ENIs של ה-NAT, שואל על היעדים המובילים, ומתאים את ה-IPs מול ip-ranges.json."),
      data: `Top destinations through NAT, 24h (Athena on flow logs)
dst_prefix           service (ip-ranges.json)     GB/day
52.216.0.0/15        S3  us-east-1                 5,410
3.5.0.0/19           S3  us-east-1                 1,020
54.231.0.0/16        S3  us-east-1                   640
44.x / 3.x           ECR api (via ecr.dkr)            85
others                                               210
-- sources: pods of deployment 'ml-feature-builder' (new nightly job, started Oct 3)
-- plus every new node pulling 3-6 GB images (ECR layers are served from S3)`,
      choices: [
        c("Add an S3 gateway endpoint to the private route tables, then ECR interface endpoints", "להוסיף S3 gateway endpoint ל-route tables הפרטיים, ואחר כך ECR interface endpoints", "s4", 20,
          "The S3 gateway endpoint is free and takes S3 (including ECR layer downloads) off the NAT path immediately.",
          "ה-S3 gateway endpoint בחינם ומוריד את S3 (כולל הורדות layers מ-ECR) מנתיב ה-NAT מיד."),
        c("Tell the ML team to stop the nightly job", "להגיד לצוות ה-ML לעצור את ה-job הלילי", "s3b", 0,
          "It's a legitimate workload. The problem is the network path, not the job.",
          "זה workload לגיטימי. הבעיה היא נתיב הרשת, לא ה-job."),
        c("Route S3 traffic through a Transit Gateway to the shared-services VPC", "לנתב את תעבורת S3 דרך Transit Gateway ל-shared-services VPC", "s3b", -5,
          "TGW processing is $0.02/GB — cheaper than NAT but far from the free gateway endpoint, and more moving parts.",
          "ה-processing ב-TGW הוא $0.02 ל-GB — זול מ-NAT אבל רחוק מה-gateway endpoint החינמי, ועם יותר חלקים זזים.")
      ]
    },
    s3b: {
      text: t("The ML lead pushes back: the job feeds the recommendations model, and the TGW plan needs a two-week network change window. Your manager asks for the simplest fix that can ship today.",
              "ה-lead של ML מתנגד: ה-job מזין את מודל ההמלצות, ותוכנית ה-TGW דורשת חלון שינויי רשת של שבועיים. המנהל שלך מבקש את התיקון הכי פשוט שאפשר לשחרר היום."),
      choices: [
        c("S3 gateway endpoint on the private route tables", "S3 gateway endpoint על ה-route tables הפרטיים", "s4", 10,
          "Free, a single Terraform resource, no app changes.",
          "בחינם, resource אחד ב-Terraform, בלי שינויים באפליקציה.")
      ]
    },
    s4: {
      text: t("You add aws_vpc_endpoint (type Gateway, service s3) to the three private route tables via Terraform. Within an hour NAT bytes drop sharply. Before closing, what else do you do?",
              "אתה מוסיף aws_vpc_endpoint (מסוג Gateway, שירות s3) לשלושת ה-route tables הפרטיים דרך Terraform. תוך שעה הבייטים ב-NAT צונחים. לפני שסוגרים, מה עוד אתה עושה?"),
      data: `CloudWatch AWS/NATGateway BytesOutToDestination (sum per hour, all 3 NATs)
before : ~280 GB/h   (nightly peak 900 GB/h)
after  : ~11 GB/h    (nightly peak 30 GB/h)
projected NatGateway-Bytes: ~$360/month (was ~$10,900)`,
      choices: [
        c("Add a Cost Anomaly Detection monitor, a NAT-bytes CloudWatch alarm, make the S3 endpoint part of the VPC module, and write a short postmortem", "להוסיף monitor של Cost Anomaly Detection, alarm ב-CloudWatch על בייטים ב-NAT, להכניס את ה-S3 endpoint למודול ה-VPC, ולכתוב postmortem קצר", "win", 20,
          "You fixed this account and made sure every future VPC gets the endpoint and every future spike pages within a day.",
          "תיקנת את ה-account הזה ווידאת שכל VPC עתידי יקבל את ה-endpoint ושכל קפיצה עתידית תקפיץ התראה תוך יום."),
        c("Nothing — the graph is down, close the ticket", "כלום — הגרף ירד, סוגרים את הטיקט", "s5", 0,
          "Fixed today, but the next VPC created from the old module repeats it, and nobody notices for 30 days again.",
          "תוקן היום, אבל ה-VPC הבא שייווצר מהמודול הישן יחזור על זה, ושוב אף אחד לא ישים לב 30 יום.")
      ]
    },
    s5: {
      text: t("Two months later, the new eu-west-1 VPC (created from the old Terraform module) shows the same pattern: +$7,000 on the bill before anyone notices.",
              "חודשיים אחר כך, ה-VPC החדש ב-eu-west-1 (שנוצר מהמודול הישן של Terraform) מראה את אותו דפוס: +$7,000 בחשבון לפני שמישהו שם לב."),
      choices: [
        c("Fix the module, add anomaly detection and NAT-bytes alarms org-wide", "לתקן את המודול, להוסיף anomaly detection ו-alarms על בייטים ב-NAT בכל הארגון", "win", 5,
          "Same fix, learned the expensive way. Guardrails beat heroics.",
          "אותו תיקון, נלמד בדרך היקרה. Guardrails עדיפים על גבורה.")
      ]
    },
    win: { text: t("Bill back to ~$19,500/month, the endpoint is a default in the VPC module, and anomaly alerts reach Slack within 24 hours. Lesson: in the cloud, the network path is a line item — and the cheapest fix (a free gateway endpoint) was one resource away.",
                   "החשבון חזר ל-~$19,500 בחודש, ה-endpoint הוא ברירת מחדל במודול ה-VPC, והתראות על חריגות מגיעות ל-Slack תוך 24 שעות. הלקח: בענן, נתיב הרשת הוא שורה בחשבון — והתיקון הכי זול (gateway endpoint בחינם) היה במרחק resource אחד."), end: "win" },
    lose: { text: t("Deleting the NAT gateways broke image pulls and outbound calls; new nodes stayed NotReady and a deploy failed halfway. You rolled back after 40 minutes of partial outage — and the bill problem is still unsolved. Measure the flows first, then change the path.",
                    "מחיקת ה-NAT gateways שברה משיכת images וקריאות יוצאות; nodes חדשים נשארו NotReady ו-deploy נכשל באמצע. עשית rollback אחרי 40 דקות של outage חלקי — ובעיית החשבון עדיין לא נפתרה. קודם מודדים את ה-flows, אחר כך משנים את הנתיב."), end: "lose" }
  },
  lessons: ["cloud-data-transfer-costs", "cloud-finops", "net-vpc", "net-nat-conntrack"]
});

})();
