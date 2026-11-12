// Kubernetes track — advanced platform lessons (part A): node autoprovisioning, KEDA, HPA/VPA deep dive,
// Helm deep dive, Argo CD, Argo Rollouts, Kubernetes cost.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 20. Node autoprovisioning: Cluster Autoscaler vs Karpenter vs NAP vs Autopilot
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-node-autoprovisioning",
  track: "kubernetes",
  order: 20,
  icon: "🚜",
  level: 3,
  minutes: 16,
  title: {
    en: "Node Autoprovisioning: Cluster Autoscaler, Karpenter, AKS NAP & GKE Autopilot",
    he: "Node Autoprovisioning: Cluster Autoscaler, Karpenter, AKS NAP ו-GKE Autopilot"
  },
  tldr: {
    en: "Cluster Autoscaler grows pre-defined node groups slowly; Karpenter (and AKS NAP, EKS Auto Mode) reads the Pending pods and buys the exact right-sized instance directly in about a minute, then keeps repacking the cluster to save money.",
    he: "Cluster Autoscaler מגדיל node groups שהגדרת מראש, ולאט. Karpenter (וגם AKS NAP ו-EKS Auto Mode) קורא את ה-Pods שב-Pending וקונה ישירות את ה-instance בגודל המדויק תוך דקה בערך, ואחר כך ממשיך לארוז מחדש את ה-cluster כדי לחסוך כסף."
  },
  analogy: {
    en: "Cluster Autoscaler is a car-rental office with three fixed fleets: compact, sedan, van. When a group of 7 shows up it rents another van from the van fleet, even if two sedans would be cheaper, and the paperwork takes 4 minutes. Karpenter is a fleet manager with access to the whole dealership: it looks at who is waiting (7 people, 2 with wheelchairs, one needs a GPU), picks the cheapest vehicle that fits all of them right now, and later quietly swaps three half-empty cars for one full minibus.",
    he: "Cluster Autoscaler הוא סניף השכרת רכב עם שלושה ציים קבועים: קטן, משפחתי, מסחרית. מגיעה קבוצה של 7? הוא משכיר עוד מסחרית מהצי של המסחריות, גם אם שני רכבים משפחתיים היו זולים יותר, והניירת לוקחת 4 דקות. Karpenter הוא מנהל צי שיש לו גישה לכל המגרש: הוא מסתכל מי מחכה (7 אנשים, שניים עם כיסא גלגלים, אחד צריך GPU), בוחר את הרכב הכי זול שמתאים לכולם עכשיו, ואחר כך בשקט מחליף שלושה רכבים חצי ריקים במיניבוס אחד מלא."
  },
  sections: [
    {
      h: { en: "Cluster Autoscaler: node groups, ASGs and why it's slow", he: "Cluster Autoscaler: node groups, ASGs ולמה הוא איטי" },
      body: {
        en: `<p>The classic <strong>Cluster Autoscaler (CA)</strong> does not create machines. It watches for Pods that the scheduler marked <code>Unschedulable</code>, simulates "would this Pod fit if node group X had one more node?", and then bumps the <em>desired count</em> of a cloud node group: an AWS Auto Scaling Group, an Azure VMSS, a GKE managed instance group. The cloud then boots a VM from the group's launch template.</p>
<ul>
<li><strong>Fixed shapes:</strong> each node group has one instance type (or a short list of same-size types). A Pod requesting 30 GiB in a cluster of <code>m6i.large</code> groups stays Pending forever. Teams end up maintaining 5-15 node groups: general, memory, GPU, spot, per-AZ.</li>
<li><strong>Slow:</strong> CA loop (10s) → ASG API → EC2 launch → bootstrap → kubelet registers → CNI ready. Typically <strong>3-5 minutes</strong> from Pending to Running, more with large images.</li>
<li><strong>Scale-down</strong> is conservative: a node must be under ~50% requested utilization (<code>--scale-down-utilization-threshold=0.5</code>) for 10 minutes (<code>--scale-down-unneeded-time=10m</code>), and all its Pods must be movable.</li>
</ul>
<pre>--expander=least-waste            # pick the group that leaves least idle CPU/mem
--balance-similar-node-groups     # keep per-AZ groups even
--skip-nodes-with-local-storage=false
--max-node-provision-time=15m</pre>
<blockquote>💡 Real world: CA is still the right answer on many on-prem/Cluster API setups and in shops that need very predictable, pre-approved instance types. It's boring and battle-tested — just slow and wasteful.</blockquote>`,
        he: `<p>ה-<strong>Cluster Autoscaler (CA)</strong> הקלאסי לא יוצר מכונות בעצמו. הוא מחפש Pods שה-scheduler סימן כ-<code>Unschedulable</code>, מריץ סימולציה של "האם ה-Pod היה נכנס אם ל-node group X היה עוד node אחד?", ואז מעלה את ה-<em>desired count</em> של node group בענן: Auto Scaling Group ב-AWS, VMSS ב-Azure, managed instance group ב-GKE. הענן מרים VM לפי ה-launch template של הקבוצה.</p>
<ul>
<li><strong>צורות קבועות:</strong> לכל node group יש instance type אחד (או רשימה קצרה של types באותו גודל). Pod שמבקש 30 GiB ב-cluster שיש בו רק קבוצות של <code>m6i.large</code> יישאר Pending לנצח. בסוף צוותים מתחזקים 5-15 node groups: general, memory, GPU, spot, אחת לכל AZ.</li>
<li><strong>איטי:</strong> לולאת CA (כל 10 שניות) → API של ה-ASG → EC2 launch → bootstrap → kubelet נרשם → CNI מוכן. בדרך כלל <strong>3-5 דקות</strong> מ-Pending ל-Running, ויותר עם images כבדים.</li>
<li><strong>Scale-down</strong> שמרני: node צריך להיות מתחת ל-50% בערך מבחינת requests (<code>--scale-down-utilization-threshold=0.5</code>) במשך 10 דקות (<code>--scale-down-unneeded-time=10m</code>), וכל ה-Pods שלו צריכים להיות ניתנים להזזה.</li>
</ul>
<pre>--expander=least-waste            # pick the group that leaves least idle CPU/mem
--balance-similar-node-groups     # keep per-AZ groups even
--skip-nodes-with-local-storage=false
--max-node-provision-time=15m</pre>
<blockquote>💡 מהשטח: CA עדיין התשובה הנכונה בהרבה סביבות on-prem/Cluster API ובארגונים שצריכים instance types צפויים ומאושרים מראש. הוא משעמם ומוכח בקרב – פשוט איטי ובזבזני.</blockquote>`
      }
    },
    {
      h: { en: "Karpenter: NodePool + EC2NodeClass, groupless provisioning", he: "Karpenter: NodePool ו-EC2NodeClass, provisioning בלי node groups" },
      body: {
        en: `<p><strong>Karpenter</strong> (v1 API since 2024, a CNCF/kubernetes-sigs project with providers for AWS and Azure) skips node groups entirely. It watches Pending Pods, batches them for a few seconds, reads their <em>requests, nodeSelectors, affinities, tolerations and topology spread</em>, and calls the EC2 <code>CreateFleet</code> API for the cheapest instance types that satisfy them. A new node is typically <strong>Ready in ~45-60 seconds</strong>. Each launch is tracked by a <strong>NodeClaim</strong> object.</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]       # spot preferred when both allowed
        - key: karpenter.k8s.aws/instance-category
          operator: In
          values: ["c", "m", "r"]
        - key: karpenter.k8s.aws/instance-generation
          operator: Gt
          values: ["5"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64", "arm64"]
      expireAfter: 720h                       # recycle every node after 30 days
  limits: { cpu: "1000", memory: 4000Gi }     # hard ceiling for this pool
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m
    budgets:
      - nodes: "10%"                          # never disrupt more than 10% at once
      - nodes: "0"
        schedule: "0 8 * * mon-fri"           # freeze during business hours
        duration: 10h
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata: { name: default }
spec:
  role: KarpenterNodeRole-prod
  amiSelectorTerms: [ { alias: al2023@latest } ]   # pin a version in prod!
  subnetSelectorTerms:        [ { tags: { karpenter.sh/discovery: prod } } ]
  securityGroupSelectorTerms: [ { tags: { karpenter.sh/discovery: prod } } ]</pre>
<p>The <strong>NodePool</strong> says <em>what</em> is allowed (types, zones, capacity types, limits, disruption rules); the <strong>EC2NodeClass</strong> says <em>how</em> to launch on AWS (AMI, subnets, security groups, IAM role, user data, block devices).</p>`,
        he: `<p><strong>Karpenter</strong> (API v1 מאז 2024, פרויקט kubernetes-sigs עם providers ל-AWS ול-Azure) מוותר לגמרי על node groups. הוא מסתכל על Pods ב-Pending, אוסף אותם לכמה שניות ל-batch, קורא את ה-<em>requests, nodeSelectors, affinities, tolerations ו-topology spread</em> שלהם, וקורא ל-API של EC2 <code>CreateFleet</code> כדי לקנות את ה-instance types הכי זולים שעונים על הדרישות. node חדש בדרך כלל <strong>Ready תוך 45-60 שניות</strong>. כל הרמה כזאת מיוצגת באובייקט <strong>NodeClaim</strong>.</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]       # spot preferred when both allowed
        - key: karpenter.k8s.aws/instance-category
          operator: In
          values: ["c", "m", "r"]
        - key: karpenter.k8s.aws/instance-generation
          operator: Gt
          values: ["5"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64", "arm64"]
      expireAfter: 720h                       # recycle every node after 30 days
  limits: { cpu: "1000", memory: 4000Gi }     # hard ceiling for this pool
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m
    budgets:
      - nodes: "10%"                          # never disrupt more than 10% at once
      - nodes: "0"
        schedule: "0 8 * * mon-fri"           # freeze during business hours
        duration: 10h
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata: { name: default }
spec:
  role: KarpenterNodeRole-prod
  amiSelectorTerms: [ { alias: al2023@latest } ]   # pin a version in prod!
  subnetSelectorTerms:        [ { tags: { karpenter.sh/discovery: prod } } ]
  securityGroupSelectorTerms: [ { tags: { karpenter.sh/discovery: prod } } ]</pre>
<p>ה-<strong>NodePool</strong> אומר <em>מה</em> מותר (types, zones, capacity types, limits, חוקי disruption). ה-<strong>EC2NodeClass</strong> אומר <em>איך</em> מרימים ב-AWS (AMI, subnets, security groups, IAM role, user data, דיסקים).</p>`
      }
    },
    {
      h: { en: "Disruption: consolidation, expiry, drift and budgets", he: "Disruption: consolidation, expiry, drift ו-budgets" },
      body: {
        en: `<p>Provisioning is half the story; Karpenter also <strong>removes and replaces</strong> nodes. Every voluntary disruption cordons the node, respects <strong>PodDisruptionBudgets</strong>, drains, and only then deletes the instance. Reasons:</p>
<ul>
<li><strong>Consolidation</strong> — <code>WhenEmpty</code> deletes nodes with no workload Pods; <code>WhenEmptyOrUnderutilized</code> also tries to delete a node whose Pods fit elsewhere, or <em>replace</em> several nodes with one cheaper one. This is the bin-packing that saves 20-40% versus CA.</li>
<li><strong>Expiration</strong> — <code>expireAfter</code> forces node rotation (fresh AMIs, no long-lived snowflakes). Pair it with <code>terminationGracePeriod</code> so a stuck PDB can't block it forever.</li>
<li><strong>Drift</strong> — if the NodePool/EC2NodeClass changes (new AMI from <code>@latest</code>, new security group, changed requirements), existing nodes are marked drifted and replaced gradually. That's how you roll an AMI upgrade across 300 nodes.</li>
<li><strong>Interruption</strong> — with an SQS queue wired to EventBridge, Karpenter receives the 2-minute <strong>spot interruption</strong> warning, rebalance recommendations and health events and drains proactively.</li>
</ul>
<p><strong>Disruption budgets</strong> cap how many nodes may be disrupted at once (<code>nodes: "10%"</code>) and can block disruption on a cron schedule. Per Pod, the annotation <code>karpenter.sh/do-not-disrupt: "true"</code> protects long batch jobs.</p>
<blockquote>⚠️ Production tip: consolidation constantly evicts Pods. If your Deployments have 1 replica, no PDB, or slow startup, you'll see random brief outages and blame Karpenter. Give every service ≥2 replicas, a PDB, and good readiness probes before enabling <code>WhenEmptyOrUnderutilized</code>.</blockquote>`,
        he: `<p>להרים nodes זה רק חצי מהסיפור – Karpenter גם <strong>מוריד ומחליף</strong> nodes. כל disruption יזום עושה cordon ל-node, מכבד <strong>PodDisruptionBudgets</strong>, עושה drain, ורק אז מוחק את ה-instance. הסיבות:</p>
<ul>
<li><strong>Consolidation</strong> – <code>WhenEmpty</code> מוחק nodes שאין עליהם Pods של workloads. <code>WhenEmptyOrUnderutilized</code> גם מנסה למחוק node שה-Pods שלו נכנסים במקום אחר, או <em>להחליף</em> כמה nodes ב-node אחד זול יותר. זה ה-bin-packing שחוסך 20-40% לעומת CA.</li>
<li><strong>Expiration</strong> – <code>expireAfter</code> מכריח רוטציה של nodes (AMIs טריים, בלי snowflakes שחיים שנה). כדאי לשלב עם <code>terminationGracePeriod</code> כדי ש-PDB תקוע לא יחסום את זה לנצח.</li>
<li><strong>Drift</strong> – אם ה-NodePool או ה-EC2NodeClass משתנים (AMI חדש מ-<code>@latest</code>, security group חדש, requirements אחרים), ה-nodes הקיימים מסומנים כ-drifted ומוחלפים בהדרגה. ככה מגלגלים שדרוג AMI על 300 nodes.</li>
<li><strong>Interruption</strong> – עם SQS queue שמחובר ל-EventBridge, Karpenter מקבל את ההתראה של 2 דקות על <strong>spot interruption</strong>, rebalance recommendations ו-health events, ועושה drain מראש.</li>
</ul>
<p><strong>Disruption budgets</strong> מגבילים כמה nodes מותר להפריע בבת אחת (<code>nodes: "10%"</code>) ויכולים לחסום disruption לפי לוח זמנים ב-cron. ברמת ה-Pod, ה-annotation <code>karpenter.sh/do-not-disrupt: "true"</code> מגן על batch jobs ארוכים.</p>
<blockquote>⚠️ טיפ לפרודקשן: consolidation מפנה Pods כל הזמן. אם ל-Deployments שלך יש replica אחד, אין PDB, או startup איטי – תראה השבתות קצרות ואקראיות ותאשים את Karpenter. תן לכל שירות לפחות 2 replicas, PDB ו-readiness probes טובים לפני שמפעילים <code>WhenEmptyOrUnderutilized</code>.</blockquote>`
      }
    },
    {
      h: { en: "AKS NAP, EKS Auto Mode, GKE NAP and Autopilot — compared", he: "AKS NAP, EKS Auto Mode, GKE NAP ו-Autopilot – השוואה" },
      body: {
        en: `<p>Each cloud now has a "just give me nodes" option:</p>
<ul>
<li><strong>AKS Node Auto Provisioning (NAP)</strong> — managed Karpenter on AKS (the open-source <code>karpenter-provider-azure</code>). You write the same <code>NodePool</code> plus an <code>AKSNodeClass</code> (image family, OS disk size). Requires Azure CNI Overlay with Cilium.</li>
<li><strong>EKS Auto Mode</strong> (since late 2024) — AWS runs Karpenter, the VPC CNI, EBS CSI and load balancer controller for you; you still write NodePools but nodes are AWS-managed Bottlerocket instances with a ~21-day max lifetime.</li>
<li><strong>GKE Node Auto-Provisioning</strong> — an extension of GKE's cluster autoscaler that <em>creates whole new node pools</em> on demand sized for Pending Pods, within cluster-wide CPU/memory limits; <strong>ComputeClasses</strong> let you express priorities (e.g. spot first, then on-demand N2).</li>
<li><strong>GKE Autopilot</strong> — no nodes to manage at all; Google provisions and you pay per Pod <em>requests</em>. Less control (no privileged DaemonSets, restricted node access).</li>
</ul>
<table>
<tr><th>Tool</th><th>Unit it scales</th><th>Instance choice</th><th>Typical time to node</th><th>Consolidation</th></tr>
<tr><td>Cluster Autoscaler</td><td>Node group (ASG/VMSS/MIG)</td><td>Fixed per group</td><td>3-5 min</td><td>Basic scale-down only</td></tr>
<tr><td>Karpenter (AWS)</td><td>Individual NodeClaim</td><td>Any type matching requirements</td><td>~1 min</td><td>Yes, delete + replace</td></tr>
<tr><td>AKS NAP</td><td>NodeClaim (Karpenter)</td><td>Any Azure VM SKU allowed</td><td>~1-2 min</td><td>Yes</td></tr>
<tr><td>EKS Auto Mode</td><td>NodeClaim (managed Karpenter)</td><td>AWS-managed</td><td>~1 min</td><td>Yes</td></tr>
<tr><td>GKE NAP</td><td>Whole node pools</td><td>Machine family chosen per need</td><td>2-4 min</td><td>Via CA scale-down / optimize-utilization</td></tr>
<tr><td>GKE Autopilot</td><td>Pods (nodes hidden)</td><td>Google decides</td><td>~1-3 min</td><td>Google's problem</td></tr>
</table>`,
        he: `<p>היום לכל ענן יש אופציה של "פשוט תביא לי nodes":</p>
<ul>
<li><strong>AKS Node Auto Provisioning (NAP)</strong> – Karpenter מנוהל על AKS (ה-<code>karpenter-provider-azure</code> שהוא open source). כותבים את אותו <code>NodePool</code> ועוד <code>AKSNodeClass</code> (image family, גודל OS disk). דורש Azure CNI Overlay עם Cilium.</li>
<li><strong>EKS Auto Mode</strong> (מסוף 2024) – AWS מריצה בשבילך את Karpenter, ה-VPC CNI, ה-EBS CSI וה-load balancer controller. עדיין כותבים NodePools, אבל ה-nodes הם Bottlerocket מנוהלים ע"י AWS עם אורך חיים מקסימלי של בערך 21 יום.</li>
<li><strong>GKE Node Auto-Provisioning</strong> – הרחבה של ה-cluster autoscaler של GKE ש<em>יוצרת node pools שלמים חדשים</em> לפי הצורך של Pods ב-Pending, בתוך limits של CPU/memory ברמת ה-cluster. <strong>ComputeClasses</strong> נותנים להגדיר סדר עדיפויות (למשל spot קודם, ואז on-demand מסוג N2).</li>
<li><strong>GKE Autopilot</strong> – אין nodes לנהל בכלל. Google מרימה ואתה משלם לפי ה-<em>requests</em> של ה-Pods. פחות שליטה (בלי DaemonSets עם privileged, גישה מוגבלת ל-nodes).</li>
</ul>
<table>
<tr><th>כלי</th><th>יחידת ה-scale</th><th>בחירת instance</th><th>זמן טיפוסי ל-node</th><th>Consolidation</th></tr>
<tr><td>Cluster Autoscaler</td><td>Node group (ASG/VMSS/MIG)</td><td>קבוע לכל קבוצה</td><td>3-5 דק'</td><td>רק scale-down בסיסי</td></tr>
<tr><td>Karpenter (AWS)</td><td>NodeClaim בודד</td><td>כל type שעונה על ה-requirements</td><td>~1 דק'</td><td>כן, מחיקה + החלפה</td></tr>
<tr><td>AKS NAP</td><td>NodeClaim (Karpenter)</td><td>כל VM SKU מותר ב-Azure</td><td>~1-2 דק'</td><td>כן</td></tr>
<tr><td>EKS Auto Mode</td><td>NodeClaim (Karpenter מנוהל)</td><td>מנוהל ע"י AWS</td><td>~1 דק'</td><td>כן</td></tr>
<tr><td>GKE NAP</td><td>Node pools שלמים</td><td>machine family לפי הצורך</td><td>2-4 דק'</td><td>דרך scale-down של CA / optimize-utilization</td></tr>
<tr><td>GKE Autopilot</td><td>Pods (ה-nodes מוסתרים)</td><td>Google מחליטה</td><td>~1-3 דק'</td><td>הבעיה של Google</td></tr>
</table>`
      }
    },
    {
      h: { en: "Debugging: Pods Pending but no node appears", he: "דיבאג: Pods ב-Pending ושום node לא עולה" },
      body: {
        en: `<p>Work outside-in, in this order:</p>
<ol>
<li><strong>Why is the Pod unschedulable?</strong> <code>kubectl describe pod</code> → Events. <code>0/12 nodes are available: 12 Insufficient cpu</code> is normal (that's the trigger). Look for Karpenter's own event: <code>FailedScheduling ... incompatible with nodepool "general"</code>.</li>
<li><strong>Is the request even satisfiable?</strong> A Pod requesting <code>cpu: 96</code> when your NodePool allows only up to <code>xlarge</code> types can never fit. Same for a <code>nodeSelector</code> on a label no NodePool produces, or a toleration missing for a NodePool's <code>taints</code>.</li>
<li><strong>Did Karpenter try?</strong> <code>kubectl get nodeclaims</code>. A NodeClaim stuck with <code>Launched=False</code> means the cloud call failed; one with <code>Registered=False</code> means the instance booted but kubelet never joined (bad user data, wrong security group, node IAM role missing from <code>aws-auth</code>/access entries).</li>
<li><strong>Read the logs:</strong> <code>kubectl logs -n kube-system -l app.kubernetes.io/name=karpenter</code> and grep for <code>InsufficientInstanceCapacity</code> (ICE — AWS has no capacity of that type in that AZ), <code>VcpuLimitExceeded</code> (your account's EC2 vCPU quota), <code>UnauthorizedOperation</code> (controller IAM), or <code>exceeds limits</code> (NodePool <code>limits</code> reached).</li>
<li><strong>Volumes:</strong> a PVC bound to an EBS volume in <code>us-east-1a</code> pins the Pod to that AZ; if the NodePool's subnets exclude it, nothing can be launched.</li>
</ol>
<blockquote>💡 Real world: the #1 fix for ICE is <em>flexibility</em>. Allow 3 categories × 3 generations × 2 architectures × all AZs and Karpenter has 50+ instance types to fall back on. NodePools pinned to a single <code>m5.2xlarge</code> are just a slower Cluster Autoscaler.</blockquote>`,
        he: `<p>עובדים מבחוץ פנימה, בסדר הזה:</p>
<ol>
<li><strong>למה ה-Pod לא נכנס?</strong> <code>kubectl describe pod</code> → Events. ההודעה <code>0/12 nodes are available: 12 Insufficient cpu</code> נורמלית (זה הטריגר). מחפשים את ה-event של Karpenter עצמו: <code>FailedScheduling ... incompatible with nodepool "general"</code>.</li>
<li><strong>האם בכלל אפשר לספק את הבקשה?</strong> Pod שמבקש <code>cpu: 96</code> כשה-NodePool מרשה רק עד <code>xlarge</code> לא ייכנס אף פעם. אותו דבר לגבי <code>nodeSelector</code> על label שאף NodePool לא מייצר, או toleration שחסר ל-<code>taints</code> של NodePool.</li>
<li><strong>האם Karpenter ניסה?</strong> <code>kubectl get nodeclaims</code>. NodeClaim שתקוע עם <code>Launched=False</code> אומר שהקריאה לענן נכשלה. אם הוא עם <code>Registered=False</code> – ה-instance עלה אבל ה-kubelet לא הצטרף (user data שבור, security group לא נכון, node IAM role שחסר ב-<code>aws-auth</code> או ב-access entries).</li>
<li><strong>קוראים לוגים:</strong> <code>kubectl logs -n kube-system -l app.kubernetes.io/name=karpenter</code> ומחפשים <code>InsufficientInstanceCapacity</code> (ICE – ל-AWS אין capacity מה-type הזה ב-AZ הזה), <code>VcpuLimitExceeded</code> (ה-quota של vCPU בחשבון), <code>UnauthorizedOperation</code> (IAM של ה-controller), או <code>exceeds limits</code> (הגעת ל-<code>limits</code> של ה-NodePool).</li>
<li><strong>Volumes:</strong> PVC שקשור ל-EBS volume ב-<code>us-east-1a</code> נועל את ה-Pod ל-AZ הזה. אם ה-subnets של ה-NodePool לא כוללים אותו – אי אפשר להרים כלום.</li>
</ol>
<blockquote>💡 מהשטח: התיקון מספר 1 ל-ICE הוא <em>גמישות</em>. תרשה 3 categories × 3 generations × 2 ארכיטקטורות × כל ה-AZs, ול-Karpenter יש 50+ instance types ליפול אליהם. NodePool שנעול על <code>m5.2xlarge</code> אחד הוא סתם Cluster Autoscaler איטי יותר.</blockquote>`
      }
    }
  ],
  diagram: `Pending Pod (cpu: 3, mem: 6Gi, arch any, spot ok)
        |
        v
 +-------------+  batch ~10s   +----------------------------+
 | kube-sched  |-------------->| Karpenter controller       |
 | Unschedul.  |               |  match NodePool reqs       |
 +-------------+               |  pick cheapest fit types   |
                               +-------------+--------------+
                                             | CreateFleet (spot/OD)
                                             v
                               +----------------------------+
                               | NodeClaim -> EC2 instance  |  ~45-60s
                               | Launched -> Registered ->  |
                               | Initialized -> Ready       |
                               +-------------+--------------+
                                             v
                               Pod bound & Running
 later:  [node A 30%] [node B 25%] --consolidate--> [node C (cheaper) 70%]

 Cluster Autoscaler for comparison:
 Pending -> CA sim -> ASG desired+1 -> EC2 -> join   (3-5 min, fixed type)`,
  handsOn: [
    { cmd: "kubectl get nodepools,ec2nodeclasses", what: { en: "List Karpenter NodePools and AWS node classes, with readiness and current resource usage vs limits.", he: "רשימת ה-NodePools של Karpenter וה-node classes של AWS, עם readiness ושימוש נוכחי מול ה-limits." } },
    { cmd: "kubectl get nodeclaims -o wide", what: { en: "See every node Karpenter launched or is launching: instance type, capacity type, zone, and whether it registered.", he: "לראות כל node ש-Karpenter הרים או מרים עכשיו: instance type, capacity type, zone והאם הוא נרשם." } },
    { cmd: "kubectl describe nodeclaim $(kubectl get nodeclaims -o name | head -1 | cut -d/ -f2)", what: { en: "Read the conditions (Launched/Registered/Initialized) and events of a NodeClaim to find where provisioning stopped.", he: "לקרוא את ה-conditions (Launched/Registered/Initialized) וה-events של NodeClaim כדי למצוא איפה ה-provisioning נעצר." } },
    { cmd: "kubectl logs -n kube-system -l app.kubernetes.io/name=karpenter -c controller --tail=200 | grep -Ei 'error|insufficient|limit|incompatible'", what: { en: "Grep Karpenter logs for capacity errors (ICE), quota/limit problems and incompatible NodePool requirements.", he: "לחפש בלוגים של Karpenter שגיאות capacity (ICE), בעיות quota/limits ו-requirements שלא מתאימים ל-NodePool." } },
    { cmd: "kubectl get nodes -L karpenter.sh/nodepool,node.kubernetes.io/instance-type,karpenter.sh/capacity-type,topology.kubernetes.io/zone", what: { en: "Show nodes with their NodePool, instance type, spot/on-demand and AZ as columns.", he: "להציג nodes עם ה-NodePool, ה-instance type, spot/on-demand וה-AZ כעמודות." } },
    { cmd: "kubectl get events -A --field-selector reason=FailedScheduling --sort-by=.lastTimestamp | tail -20", what: { en: "Find the latest scheduling failures cluster-wide, including Karpenter's 'incompatible with nodepool' messages.", he: "למצוא את כשלי ה-scheduling האחרונים בכל ה-cluster, כולל ההודעות 'incompatible with nodepool' של Karpenter." } },
    { cmd: "kubectl annotate pod my-batch-job-abc12 karpenter.sh/do-not-disrupt=true", what: { en: "Protect a long-running Pod from voluntary disruption (consolidation, drift, expiry) by Karpenter.", he: "להגן על Pod שרץ הרבה זמן מ-disruption יזום (consolidation, drift, expiry) של Karpenter." } },
    { cmd: "aws service-quotas get-service-quota --service-code ec2 --quota-code L-1216C47A", what: { en: "Check your EC2 vCPU quota for on-demand standard instances — a common silent cause of nodes never appearing.", he: "לבדוק את ה-quota של vCPU ל-on-demand standard instances ב-EC2 – סיבה נפוצה ושקטה לזה ש-nodes לא עולים." } }
  ],
  mnemonic: {
    en: "\"CA rents from a fleet, Karpenter buys to fit\". And the disruption trio is C-E-D: Consolidate (save money), Expire (stay fresh), Drift (stay in spec) — all gated by Budgets and PDBs.",
    he: "\"CA שוכר מצי קבוע, Karpenter קונה לפי מידה\". ושלישיית ה-disruption היא C-E-D: Consolidate (לחסוך), Expire (להישאר טרי), Drift (להישאר תואם ל-spec) – והכול מוגבל ע\"י Budgets ו-PDBs."
  },
  pitfalls: [
    { en: "Running Karpenter's own controller on nodes Karpenter manages. If it consolidates its own node away, nothing provisions. Run it on a small managed node group or Fargate.", he: "להריץ את ה-controller של Karpenter על nodes ש-Karpenter עצמו מנהל. אם הוא עושה consolidation ל-node שלו – אף אחד לא מרים nodes. מריצים אותו על managed node group קטן או על Fargate." },
    { en: "Using amiSelectorTerms alias @latest in production. Every new AMI release silently drifts and replaces your entire fleet; pin a version (e.g. al2023@v20251020) and promote it through environments.", he: "להשתמש ב-alias של @latest ב-amiSelectorTerms בפרודקשן. כל AMI חדש שיוצא גורם ל-drift ומחליף בשקט את כל הצי. נועלים גרסה (למשל al2023@v20251020) ומקדמים אותה בין סביבות." },
    { en: "Pods with no requests. Karpenter sizes nodes from requests; a Pod requesting nothing gets packed onto a tiny node and then gets OOM-killed or throttled under real load.", he: "Pods בלי requests. Karpenter קובע גודל nodes לפי requests. Pod שלא מבקש כלום נדחס ל-node קטנטן ואז חוטף OOM או throttling תחת עומס אמיתי." },
    { en: "Running Cluster Autoscaler and Karpenter on the same node groups. They fight: CA scales an ASG while Karpenter consolidates it. Migrate group by group and remove CA's ownership tags.", he: "להריץ Cluster Autoscaler ו-Karpenter על אותם node groups. הם נלחמים: CA מגדיל ASG בזמן ש-Karpenter עושה לו consolidation. מעבירים קבוצה-קבוצה ומורידים את ה-tags של CA." }
  ],
  interview: [
    {
      q: { en: "Why is Karpenter faster and cheaper than Cluster Autoscaler?", he: "למה Karpenter מהיר וזול יותר מ-Cluster Autoscaler?" },
      a: { en: "CA only changes the desired count of pre-defined node groups, so it's limited to their instance types and pays the ASG round-trip (3-5 min). Karpenter reads the Pending Pods' requests and constraints and calls EC2 CreateFleet directly for the cheapest matching type across many families, spot or on-demand, so a node is ready in about a minute and right-sized. It then actively consolidates: deleting or replacing underutilized nodes with cheaper ones, which CA's simple scale-down can't do.", he: "CA רק משנה את ה-desired count של node groups שהוגדרו מראש, ולכן הוא מוגבל ל-instance types שלהם ומשלם את הסיבוב דרך ה-ASG (3-5 דקות). Karpenter קורא את ה-requests וה-constraints של ה-Pods ב-Pending וקורא ל-EC2 CreateFleet ישירות עבור ה-type הכי זול שמתאים, מתוך הרבה families, spot או on-demand – אז node מוכן תוך דקה ובגודל הנכון. אחר כך הוא עושה consolidation אקטיבי: מוחק או מחליף nodes לא מנוצלים ב-nodes זולים יותר, משהו שה-scale-down הפשוט של CA לא יודע לעשות." }
    },
    {
      q: { en: "Pods have been Pending for 10 minutes on a Karpenter cluster. Walk me through your debugging.", he: "Pods ב-Pending כבר 10 דקות ב-cluster עם Karpenter. תעביר אותי בתהליך הדיבאג." },
      a: { en: "1) describe the Pod: are requests/selectors/tolerations satisfiable by any NodePool? 2) kubectl get nodeclaims: none created means Karpenter rejected the Pod (incompatible requirements, NodePool limits reached); one stuck Launched=False means a cloud error; Registered=False means the node can't join. 3) Karpenter logs for ICE, vCPU quota, IAM errors. 4) Check zonal PVCs and subnet/AZ coverage. Fixes: widen instance requirements, raise limits or quotas, fix node IAM/access entries.", he: "1) describe ל-Pod: האם יש NodePool שיכול לספק את ה-requests/selectors/tolerations? 2) kubectl get nodeclaims: אם לא נוצר כלום, Karpenter דחה את ה-Pod (requirements לא תואמים, הגענו ל-limits של ה-NodePool). אם יש אחד תקוע ב-Launched=False – שגיאה מהענן. Registered=False – ה-node לא מצליח להצטרף. 3) לוגים של Karpenter: ICE, quota של vCPU, שגיאות IAM. 4) לבדוק PVCs שנעולים ל-zone וכיסוי subnets/AZ. תיקונים: להרחיב requirements, להעלות limits או quotas, לתקן IAM/access entries של ה-node." }
    },
    {
      q: { en: "How do you stop Karpenter consolidation from causing outages?", he: "איך מונעים מ-consolidation של Karpenter לגרום להשבתות?" },
      a: { en: "Every service gets ≥2 replicas spread across nodes/zones, a PodDisruptionBudget, proper readiness probes and graceful shutdown (preStop + terminationGracePeriodSeconds). On the NodePool, use disruption budgets (e.g. 10% of nodes, 0 during business hours) and consolidateAfter to avoid churn; annotate critical batch Pods with karpenter.sh/do-not-disrupt.", he: "לכל שירות לפחות 2 replicas מפוזרים על nodes/zones, PodDisruptionBudget, readiness probes תקינים ו-graceful shutdown (preStop + terminationGracePeriodSeconds). ב-NodePool משתמשים ב-disruption budgets (למשל 10% מה-nodes, ו-0 בשעות העבודה) וב-consolidateAfter כדי למנוע churn. Pods קריטיים של batch מסמנים עם karpenter.sh/do-not-disrupt." }
    }
  ],
  quiz: [
    {
      q: { en: "Which object tells Karpenter which AMI, subnets and security groups to use on AWS?", he: "איזה אובייקט אומר ל-Karpenter באיזה AMI, subnets ו-security groups להשתמש ב-AWS?" },
      options: [
        { en: "NodePool", he: "NodePool" },
        { en: "EC2NodeClass", he: "EC2NodeClass" },
        { en: "NodeClaim", he: "NodeClaim" },
        { en: "The Auto Scaling Group launch template", he: "ה-launch template של ה-Auto Scaling Group" }
      ],
      answer: 1,
      explain: { en: "NodePool = what is allowed (types, capacity, limits, disruption). EC2NodeClass = how to launch on AWS (AMI, subnets, SGs, role). NodeClaim is a single launched node. Karpenter doesn't use ASGs.", he: "NodePool = מה מותר (types, capacity, limits, disruption). EC2NodeClass = איך מרימים ב-AWS (AMI, subnets, SGs, role). NodeClaim הוא node בודד שהורם. Karpenter לא משתמש ב-ASGs." }
    },
    {
      q: { en: "A NodeClaim shows Launched=True but Registered=False for 10 minutes. Most likely cause?", he: "NodeClaim מראה Launched=True אבל Registered=False כבר 10 דקות. מה הסיבה הסבירה?" },
      options: [
        { en: "AWS has no spot capacity (ICE)", he: "אין ל-AWS capacity של spot (ICE)" },
        { en: "The NodePool CPU limit was reached", he: "הגענו ל-limit של CPU ב-NodePool" },
        { en: "The instance booted but kubelet can't join: node IAM role/access entry, security group or user data problem", he: "ה-instance עלה אבל ה-kubelet לא מצליח להצטרף: בעיה ב-IAM role/access entry של ה-node, ב-security group או ב-user data" },
        { en: "The Pod has too many replicas", he: "ל-Pod יש יותר מדי replicas" }
      ],
      answer: 2,
      explain: { en: "Launched means EC2 created the instance, so ICE and NodePool limits are ruled out (they'd fail before launch). Registration fails when the node can't authenticate or reach the API server.", he: "Launched אומר ש-EC2 יצר את ה-instance, אז ICE ו-limits של NodePool לא רלוונטיים (הם נכשלים לפני launch). Registration נכשל כשה-node לא מצליח לעשות authentication או להגיע ל-API server." }
    },
    {
      q: { en: "What does consolidationPolicy: WhenEmptyOrUnderutilized add over WhenEmpty?", he: "מה WhenEmptyOrUnderutilized מוסיף על WhenEmpty ב-consolidationPolicy?" },
      options: [
        { en: "It also deletes or replaces nodes whose Pods could fit elsewhere or on a cheaper node", he: "הוא גם מוחק או מחליף nodes שה-Pods שלהם יכולים להיכנס במקום אחר או ב-node זול יותר" },
        { en: "It deletes nodes faster, ignoring PDBs", he: "הוא מוחק nodes מהר יותר ומתעלם מ-PDBs" },
        { en: "It only works with on-demand instances", he: "הוא עובד רק עם on-demand instances" },
        { en: "It scales Deployments down when nodes are underutilized", he: "הוא מוריד replicas ב-Deployments כשה-nodes לא מנוצלים" }
      ],
      answer: 0,
      explain: { en: "Underutilized consolidation is real bin-packing: delete a node if its Pods fit elsewhere, or replace N nodes with a cheaper one. It always respects PDBs and never touches replica counts — that's HPA's job.", he: "Consolidation של underutilized זה bin-packing אמיתי: למחוק node אם ה-Pods שלו נכנסים במקום אחר, או להחליף N nodes ב-node זול יותר. הוא תמיד מכבד PDBs ולא נוגע במספר ה-replicas – זה התפקיד של HPA." }
    },
    {
      q: { en: "Which option bills you per Pod resource requests instead of per node?", he: "איזו אופציה מחייבת לפי ה-requests של ה-Pods ולא לפי node?" },
      options: [
        { en: "GKE Node Auto-Provisioning", he: "GKE Node Auto-Provisioning" },
        { en: "AKS NAP", he: "AKS NAP" },
        { en: "Karpenter with spot", he: "Karpenter עם spot" },
        { en: "GKE Autopilot", he: "GKE Autopilot" }
      ],
      answer: 3,
      explain: { en: "Autopilot hides nodes and charges for requested vCPU/memory per Pod. NAP, AKS NAP and Karpenter all create real VMs you pay for whether full or not.", he: "Autopilot מסתיר את ה-nodes ומחייב לפי vCPU/memory שה-Pods ביקשו. NAP, AKS NAP ו-Karpenter יוצרים VMs אמיתיים שמשלמים עליהם בין אם הם מלאים ובין אם לא." }
    }
  ],
  playground: "scheduler",
  related: ["k8s-scheduling", "k8s-autoscaling", "cloud-finops", "k8s-cost"]
});

// ---------------------------------------------------------------------------
// 21. KEDA: event-driven autoscaling
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-keda",
  track: "kubernetes",
  order: 21,
  icon: "⚡",
  level: 3,
  minutes: 14,
  title: { en: "KEDA: Event-Driven Autoscaling & Scale to Zero", he: "KEDA: Autoscaling מבוסס events ו-Scale to Zero" },
  tldr: {
    en: "KEDA turns 'how much work is waiting' (Kafka lag, SQS depth, a Prometheus query, a cron window) into replicas: it scales 0→1 itself and feeds an HPA it creates for 1→N.",
    he: "KEDA הופך את 'כמה עבודה מחכה' (Kafka lag, עומק SQS, query של Prometheus, חלון cron) למספר replicas: את 0→1 הוא עושה בעצמו, ול-1→N הוא מזין HPA שהוא יוצר."
  },
  analogy: {
    en: "CPU-based HPA is a bakery that hires more bakers only once the current bakers are sweating. KEDA is a bakery manager who looks at the line outside the door: 40 people waiting and each baker serves 10? Call in 4 bakers — before anyone sweats. Line empty at 3 a.m.? Send everyone home and lock the door; the first customer who knocks wakes one baker up.",
    he: "HPA לפי CPU זה מאפייה שמגייסת עוד אופים רק כשהאופים הנוכחיים כבר מזיעים. KEDA זה מנהל מאפייה שמסתכל על התור בחוץ: 40 אנשים מחכים וכל אופה משרת 10? מזמינים 4 אופים – לפני שמישהו מזיע. התור ריק ב-3 בלילה? שולחים את כולם הביתה ונועלים. הלקוח הראשון שדופק בדלת מעיר אופה אחד."
  },
  sections: [
    {
      h: { en: "Why CPU is the wrong signal for consumers", he: "למה CPU הוא האות הלא נכון ל-consumers" },
      body: {
        en: `<p>A queue consumer that waits on I/O (DB writes, HTTP calls) can sit at 15% CPU while 2 million messages pile up in Kafka. HPA on CPU will never scale it. The real signal is the <strong>backlog</strong>: consumer lag, queue length, pending jobs, requests per second. <strong>KEDA</strong> (Kubernetes Event-Driven Autoscaling, a CNCF graduated project) gives you 70+ <em>scalers</em> that read those signals from the source system.</p>
<p>KEDA installs three things:</p>
<ul>
<li><strong>keda-operator</strong> — watches <code>ScaledObject</code>/<code>ScaledJob</code> resources, polls the scalers, handles the 0↔1 transition and creates/updates an HPA.</li>
<li><strong>keda-operator-metrics-apiserver</strong> — registers as the cluster's <code>external.metrics.k8s.io</code> provider, so the HPA can ask "what is the Kafka lag for this ScaledObject?".</li>
<li><strong>admission webhooks</strong> — reject invalid configs, e.g. two ScaledObjects targeting the same Deployment, or a ScaledObject on a workload that already has an HPA.</li>
</ul>
<p>The result: <strong>KEDA is not a replacement for HPA, it is an HPA driver</strong>. Below 1 replica KEDA acts; from 1 to N the standard HPA controller does the math, using metrics KEDA serves.</p>
<blockquote>💡 Real world: classic wins are Kafka/SQS workers that scale to 0 overnight, nightly batch pipelines driven by cron + queue length, and GPU inference workers that are too expensive to idle.</blockquote>`,
        he: `<p>Consumer של תור שמחכה על I/O (כתיבות ל-DB, קריאות HTTP) יכול לשבת על 15% CPU בזמן ש-2 מיליון הודעות נערמות ב-Kafka. HPA לפי CPU לא יעשה לו scale אף פעם. האות האמיתי הוא ה-<strong>backlog</strong>: consumer lag, אורך התור, jobs שמחכים, requests לשנייה. <strong>KEDA</strong> (Kubernetes Event-Driven Autoscaling, פרויקט CNCF graduated) נותן 70+ <em>scalers</em> שקוראים את האותות האלה ישירות ממערכת המקור.</p>
<p>KEDA מתקין שלושה דברים:</p>
<ul>
<li><strong>keda-operator</strong> – עוקב אחרי <code>ScaledObject</code>/<code>ScaledJob</code>, עושה polling ל-scalers, מטפל במעבר 0↔1 ויוצר/מעדכן HPA.</li>
<li><strong>keda-operator-metrics-apiserver</strong> – נרשם כ-provider של <code>external.metrics.k8s.io</code> ב-cluster, כך שה-HPA יכול לשאול "מה ה-Kafka lag של ה-ScaledObject הזה?".</li>
<li><strong>admission webhooks</strong> – דוחים קונפיגורציות לא תקינות, למשל שני ScaledObjects על אותו Deployment, או ScaledObject על workload שכבר יש לו HPA.</li>
</ul>
<p>השורה התחתונה: <strong>KEDA הוא לא תחליף ל-HPA, הוא מנהל HPA</strong>. מתחת ל-replica אחד KEDA פועל בעצמו; מ-1 עד N ה-HPA controller הרגיל עושה את החישוב, עם metrics ש-KEDA מגיש.</p>
<blockquote>💡 מהשטח: הניצחונות הקלאסיים – workers של Kafka/SQS שיורדים ל-0 בלילה, pipelines של batch לילי שמונעים ע"י cron + אורך תור, ו-workers של GPU inference שיקר מדי להשאיר באוויר בלי עבודה.</blockquote>`
      }
    },
    {
      h: { en: "ScaledObject anatomy: Kafka lag example", he: "האנטומיה של ScaledObject: דוגמה עם Kafka lag" },
      body: {
        en: `<pre>apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata: { name: orders-consumer, namespace: orders }
spec:
  scaleTargetRef: { name: orders-consumer }   # a Deployment (or StatefulSet / any /scale)
  pollingInterval: 15        # seconds between scaler checks (default 30)
  cooldownPeriod: 300        # wait before going 1 -&gt; 0 (default 300)
  minReplicaCount: 0         # default 0 = scale to zero allowed
  maxReplicaCount: 24        # = partition count, extra consumers would idle
  fallback: { failureThreshold: 3, replicas: 6 }   # if Kafka is unreachable
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown: { stabilizationWindowSeconds: 120 }
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka-0.kafka:9092,kafka-1.kafka:9092
        consumerGroup: orders-svc
        topic: orders
        lagThreshold: "100"           # target lag per replica
        activationLagThreshold: "10"  # 0 -&gt; 1 only when lag &gt; 10
      authenticationRef: { name: kafka-auth }</pre>
<p>Desired replicas ≈ <code>ceil(totalLag / lagThreshold)</code>: 2,400 messages of lag → 24 Pods. Two thresholds matter: <strong>activation</strong> (is there any work at all? decides 0↔1, owned by KEDA) and the <strong>target</strong> (how much work per replica, used by the HPA for 1↔N).</p>
<p>Other common triggers:</p>
<pre>- type: aws-sqs-queue
  metadata: { queueURL: https://sqs.eu-west-1.amazonaws.com/123456789012/jobs, queueLength: "20", awsRegion: eu-west-1 }
- type: rabbitmq
  metadata: { queueName: emails, mode: QueueLength, value: "50", hostFromEnv: RABBIT_URL }
- type: prometheus
  metadata: { serverAddress: http://prometheus.monitoring:9090, query: sum(rate(http_requests_total{app="api"}[2m])), threshold: "200" }
- type: cron
  metadata: { timezone: Asia/Jerusalem, start: 0 8 * * 0-4, end: 0 20 * * 0-4, desiredReplicas: "10" }</pre>
<p>Multiple triggers = KEDA takes the <strong>max</strong> of all of them, so "at least 10 during work hours, more if the queue grows" is just cron + SQS together.</p>`,
        he: `<pre>apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata: { name: orders-consumer, namespace: orders }
spec:
  scaleTargetRef: { name: orders-consumer }   # a Deployment (or StatefulSet / any /scale)
  pollingInterval: 15        # seconds between scaler checks (default 30)
  cooldownPeriod: 300        # wait before going 1 -&gt; 0 (default 300)
  minReplicaCount: 0         # default 0 = scale to zero allowed
  maxReplicaCount: 24        # = partition count, extra consumers would idle
  fallback: { failureThreshold: 3, replicas: 6 }   # if Kafka is unreachable
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown: { stabilizationWindowSeconds: 120 }
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka-0.kafka:9092,kafka-1.kafka:9092
        consumerGroup: orders-svc
        topic: orders
        lagThreshold: "100"           # target lag per replica
        activationLagThreshold: "10"  # 0 -&gt; 1 only when lag &gt; 10
      authenticationRef: { name: kafka-auth }</pre>
<p>מספר ה-replicas הרצוי ≈ <code>ceil(totalLag / lagThreshold)</code>: lag של 2,400 הודעות → 24 Pods. יש שני thresholds חשובים: <strong>activation</strong> (האם יש עבודה בכלל? מחליט על 0↔1, באחריות KEDA) וה-<strong>target</strong> (כמה עבודה לכל replica, ה-HPA משתמש בו ל-1↔N).</p>
<p>עוד triggers נפוצים:</p>
<pre>- type: aws-sqs-queue
  metadata: { queueURL: https://sqs.eu-west-1.amazonaws.com/123456789012/jobs, queueLength: "20", awsRegion: eu-west-1 }
- type: rabbitmq
  metadata: { queueName: emails, mode: QueueLength, value: "50", hostFromEnv: RABBIT_URL }
- type: prometheus
  metadata: { serverAddress: http://prometheus.monitoring:9090, query: sum(rate(http_requests_total{app="api"}[2m])), threshold: "200" }
- type: cron
  metadata: { timezone: Asia/Jerusalem, start: 0 8 * * 0-4, end: 0 20 * * 0-4, desiredReplicas: "10" }</pre>
<p>כמה triggers ביחד = KEDA לוקח את ה-<strong>max</strong> מכולם. אז "לפחות 10 בשעות העבודה, ויותר אם התור גדל" זה פשוט cron ו-SQS ביחד.</p>`
      }
    },
    {
      h: { en: "Scale to zero, ScaledJob and the HTTP add-on", he: "Scale to zero, ScaledJob וה-HTTP add-on" },
      body: {
        en: `<p><strong>Scale to zero</strong> works because KEDA, not the HPA, owns the bottom of the range (HPA's own minimum is 1). When the activation condition is false for every trigger for <code>cooldownPeriod</code> seconds, KEDA sets replicas to 0. When any trigger becomes active it sets replicas to 1 and the HPA takes over. The price: <strong>cold start</strong>. Pod scheduling + image pull + app boot, and possibly a new node from Karpenter: 5 seconds to 2 minutes before the first message is processed. Fine for async queues, not for user-facing HTTP.</p>
<p><strong>ScaledJob</strong> is the alternative for long, run-to-completion work: instead of scaling a Deployment, KEDA creates <em>Kubernetes Jobs</em>, roughly one per pending message (up to <code>maxReplicaCount</code>). Each Job pulls one message, processes it (a 40-minute video transcode, a ML training step) and exits. No Pod gets killed mid-task by a scale-down, which is the classic problem with long work on a ScaledObject.</p>
<pre>kind: ScaledJob
spec:
  jobTargetRef:
    template: { spec: { containers: [ { name: transcode, image: ghcr.io/acme/transcode:2.3 } ], restartPolicy: Never } }
  maxReplicaCount: 50
  scalingStrategy: { strategy: accurate }   # accounts for jobs already running
  successfulJobsHistoryLimit: 5
  triggers: [ { type: aws-sqs-queue, metadata: { queueURL: ..., queueLength: "1" } } ]</pre>
<p>For HTTP, there is no queue to read, so the <strong>KEDA HTTP add-on</strong> (still beta) puts an <em>interceptor</em> proxy in front of the Service that counts in-flight requests and holds requests while scaling from zero. Many teams instead use a Prometheus RPS trigger with <code>minReplicaCount: 2</code>, or Knative for true request-driven serverless.</p>`,
        he: `<p><strong>Scale to zero</strong> עובד כי KEDA, ולא ה-HPA, אחראי על התחתית (המינימום של HPA עצמו הוא 1). כשתנאי ה-activation שקרי בכל ה-triggers במשך <code>cooldownPeriod</code> שניות, KEDA שם 0 replicas. כש-trigger כלשהו נהיה active הוא שם 1 וה-HPA ממשיך משם. המחיר: <strong>cold start</strong>. scheduling + image pull + עליית האפליקציה, ואולי גם node חדש מ-Karpenter: בין 5 שניות ל-2 דקות עד שההודעה הראשונה מעובדת. מצוין לתורים אסינכרוניים, לא ל-HTTP מול משתמשים.</p>
<p><strong>ScaledJob</strong> הוא האלטרנטיבה לעבודה ארוכה שרצה עד הסוף: במקום לעשות scale ל-Deployment, KEDA יוצר <em>Kubernetes Jobs</em>, בערך אחד לכל הודעה שמחכה (עד <code>maxReplicaCount</code>). כל Job מושך הודעה אחת, מעבד (transcode של 40 דקות לוידאו, שלב של אימון ML) ויוצא. אף Pod לא נהרג באמצע משימה בגלל scale-down – הבעיה הקלאסית כשמריצים עבודה ארוכה על ScaledObject.</p>
<pre>kind: ScaledJob
spec:
  jobTargetRef:
    template: { spec: { containers: [ { name: transcode, image: ghcr.io/acme/transcode:2.3 } ], restartPolicy: Never } }
  maxReplicaCount: 50
  scalingStrategy: { strategy: accurate }   # accounts for jobs already running
  successfulJobsHistoryLimit: 5
  triggers: [ { type: aws-sqs-queue, metadata: { queueURL: ..., queueLength: "1" } } ]</pre>
<p>ב-HTTP אין תור לקרוא ממנו, אז ה-<strong>KEDA HTTP add-on</strong> (עדיין beta) שם proxy בשם <em>interceptor</em> לפני ה-Service, שסופר requests פתוחים ומחזיק אותם בזמן שעולים מאפס. הרבה צוותים מעדיפים trigger של Prometheus לפי RPS עם <code>minReplicaCount: 2</code>, או Knative בשביל serverless אמיתי לפי requests.</p>`
      }
    },
    {
      h: { en: "Authentication: TriggerAuthentication + workload identity", he: "Authentication: TriggerAuthentication ו-workload identity" },
      body: {
        en: `<p>The scaler runs inside <strong>keda-operator</strong>, not inside your app Pod, so it needs its own credentials to read SQS or Kafka. Never put passwords in <code>metadata</code>; use a <code>TriggerAuthentication</code> (namespaced) or <code>ClusterTriggerAuthentication</code>:</p>
<pre>apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata: { name: sqs-auth, namespace: jobs }
spec:
  podIdentity:
    provider: aws                 # EKS Pod Identity / IRSA
    roleArn: arn:aws:iam::123456789012:role/keda-sqs-reader   # optional: assume this role
---
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata: { name: kafka-auth, namespace: orders }
spec:
  secretTargetRef:
    - { parameter: sasl,     name: kafka-creds, key: mechanism }   # e.g. scram_sha512
    - { parameter: username, name: kafka-creds, key: user }
    - { parameter: password, name: kafka-creds, key: password }
    - { parameter: tls,      name: kafka-creds, key: tls }         # "enable"</pre>
<p>Other providers: <code>azure-workload</code> (Entra Workload ID), <code>gcp</code> (GKE Workload Identity), plus <code>hashiCorpVault</code> and <code>azureKeyVault</code> sources. With <code>provider: aws</code> the KEDA operator's own ServiceAccount must have the IAM role (or it assumes <code>roleArn</code>). The old <code>aws-eks</code> provider is deprecated.</p>
<blockquote>⚠️ Production tip: the IAM policy only needs <code>sqs:GetQueueAttributes</code> to read <code>ApproximateNumberOfMessages</code>. Giving the operator <code>sqs:*</code> on <code>*</code> means anyone who can create a ScaledObject in any namespace can probe any queue in your account.</blockquote>`,
        he: `<p>ה-scaler רץ בתוך <strong>keda-operator</strong>, לא בתוך ה-Pod של האפליקציה, ולכן הוא צריך credentials משלו כדי לקרוא מ-SQS או Kafka. אף פעם לא שמים סיסמאות ב-<code>metadata</code> – משתמשים ב-<code>TriggerAuthentication</code> (ברמת namespace) או ב-<code>ClusterTriggerAuthentication</code>:</p>
<pre>apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata: { name: sqs-auth, namespace: jobs }
spec:
  podIdentity:
    provider: aws                 # EKS Pod Identity / IRSA
    roleArn: arn:aws:iam::123456789012:role/keda-sqs-reader   # optional: assume this role
---
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata: { name: kafka-auth, namespace: orders }
spec:
  secretTargetRef:
    - { parameter: sasl,     name: kafka-creds, key: mechanism }   # e.g. scram_sha512
    - { parameter: username, name: kafka-creds, key: user }
    - { parameter: password, name: kafka-creds, key: password }
    - { parameter: tls,      name: kafka-creds, key: tls }         # "enable"</pre>
<p>Providers נוספים: <code>azure-workload</code> (Entra Workload ID), <code>gcp</code> (GKE Workload Identity), ועוד מקורות כמו <code>hashiCorpVault</code> ו-<code>azureKeyVault</code>. עם <code>provider: aws</code> ל-ServiceAccount של ה-KEDA operator עצמו צריך להיות IAM role (או שהוא עושה assume ל-<code>roleArn</code>). ה-provider הישן <code>aws-eks</code> הוא deprecated.</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-IAM policy צריך רק <code>sqs:GetQueueAttributes</code> כדי לקרוא את <code>ApproximateNumberOfMessages</code>. אם נותנים ל-operator הרשאת <code>sqs:*</code> על <code>*</code>, כל מי שיכול ליצור ScaledObject בכל namespace יכול לחטט בכל תור בחשבון.</blockquote>`
      }
    },
    {
      h: { en: "Debugging KEDA: READY, ACTIVE and <unknown>", he: "דיבאג ל-KEDA: READY, ACTIVE ו-<unknown>" },
      body: {
        en: `<pre>$ kubectl get scaledobject -n orders
NAME              SCALETARGETKIND      SCALETARGETNAME   MIN  MAX  READY  ACTIVE  FALLBACK  PAUSED
orders-consumer   apps/v1.Deployment   orders-consumer   0    24   True   True    False     False

$ kubectl get hpa -n orders
NAME                       REFERENCE                    TARGETS            MINPODS MAXPODS REPLICAS
keda-hpa-orders-consumer   Deployment/orders-consumer   1840/100 (avg)     1       24      19</pre>
<ul>
<li><strong>READY=False</strong> — config or auth problem. <code>kubectl describe scaledobject</code> shows the condition message (e.g. <code>error getting scaler: ... AccessDenied</code>).</li>
<li><strong>ACTIVE=False with work in the queue</strong> — activation threshold too high, wrong topic/consumer group, or the consumer group has never committed offsets (Kafka scaler then uses <code>offsetResetPolicy</code>).</li>
<li><strong>HPA target shows <code>&lt;unknown&gt;</code></strong> — the HPA can't read the external metric: the metrics-apiserver Pod is down, another adapter (e.g. prometheus-adapter) already claimed <code>external.metrics.k8s.io</code> (only one can own it!), or a NetworkPolicy blocks the API server → KEDA on port 6443.</li>
<li><strong>Replicas flap</strong> — raise <code>cooldownPeriod</code> and the HPA <code>scaleDown.stabilizationWindowSeconds</code>.</li>
</ul>
<p>The golden rule: <strong>never also create your own HPA</strong> for a workload with a ScaledObject. Two HPAs on one Deployment fight every 15 seconds and the replica count oscillates. To migrate, delete your HPA first, or let KEDA adopt it with the <code>scaledobject.keda.sh/transfer-hpa-ownership: "true"</code> annotation. To freeze scaling during an incident, annotate with <code>autoscaling.keda.sh/paused-replicas: "5"</code>.</p>`,
        he: `<pre>$ kubectl get scaledobject -n orders
NAME              SCALETARGETKIND      SCALETARGETNAME   MIN  MAX  READY  ACTIVE  FALLBACK  PAUSED
orders-consumer   apps/v1.Deployment   orders-consumer   0    24   True   True    False     False

$ kubectl get hpa -n orders
NAME                       REFERENCE                    TARGETS            MINPODS MAXPODS REPLICAS
keda-hpa-orders-consumer   Deployment/orders-consumer   1840/100 (avg)     1       24      19</pre>
<ul>
<li><strong>READY=False</strong> – בעיה בקונפיגורציה או ב-auth. <code>kubectl describe scaledobject</code> מראה את הודעת ה-condition (למשל <code>error getting scaler: ... AccessDenied</code>).</li>
<li><strong>ACTIVE=False למרות שיש עבודה בתור</strong> – activation threshold גבוה מדי, topic או consumer group לא נכונים, או שה-consumer group אף פעם לא עשה commit ל-offsets (ואז ה-scaler של Kafka משתמש ב-<code>offsetResetPolicy</code>).</li>
<li><strong>ה-target ב-HPA מראה <code>&lt;unknown&gt;</code></strong> – ה-HPA לא מצליח לקרוא את ה-external metric: ה-Pod של ה-metrics-apiserver למטה, adapter אחר (למשל prometheus-adapter) כבר תפס את <code>external.metrics.k8s.io</code> (רק אחד יכול להחזיק אותו!), או NetworkPolicy שחוסמת את ה-API server → KEDA בפורט 6443.</li>
<li><strong>ה-replicas קופצים למעלה ולמטה</strong> – מעלים את <code>cooldownPeriod</code> ואת <code>scaleDown.stabilizationWindowSeconds</code> של ה-HPA.</li>
</ul>
<p>חוק הזהב: <strong>אף פעם לא יוצרים HPA משלך</strong> ל-workload שיש לו ScaledObject. שני HPAs על אותו Deployment נלחמים כל 15 שניות ומספר ה-replicas מתנדנד. במעבר – מוחקים קודם את ה-HPA שלך, או נותנים ל-KEDA לאמץ אותו עם ה-annotation <code>scaledobject.keda.sh/transfer-hpa-ownership: "true"</code>. כדי להקפיא scaling באמצע אירוע, מוסיפים <code>autoscaling.keda.sh/paused-replicas: "5"</code>.</p>`
      }
    }
  ],
  diagram: `  Kafka / SQS / RabbitMQ / Prometheus / cron
            ^   poll every pollingInterval (15-30s)
            |
   +--------+---------+        external.metrics.k8s.io
   |  keda-operator   |<------------------------------+
   |  0 <-> 1 (activation)                            |
   +--------+---------+                               |
            | creates/owns                  +---------+-----------+
            v                               | keda metrics-apisrv |
   +------------------+   reads metric      +---------------------+
   | HPA keda-hpa-xxx |---------------------------^
   | 1 <-> N (target) |
   +--------+---------+
            v  /scale
   Deployment orders-consumer: 0 .. 24 replicas

   lag 0 for cooldownPeriod  -> 0 replicas
   lag 2400, lagThreshold 100 -> 24 replicas`,
  handsOn: [
    { cmd: "helm repo add kedacore https://kedacore.github.io/charts && helm upgrade --install keda kedacore/keda -n keda --create-namespace", what: { en: "Install or upgrade KEDA (operator, metrics apiserver, webhooks) with Helm.", he: "להתקין או לשדרג את KEDA (operator, metrics apiserver, webhooks) עם Helm." } },
    { cmd: "kubectl get scaledobjects,scaledjobs,triggerauthentications -A", what: { en: "Inventory every KEDA object in the cluster with READY/ACTIVE/FALLBACK/PAUSED status.", he: "מלאי של כל אובייקטי KEDA ב-cluster עם סטטוס READY/ACTIVE/FALLBACK/PAUSED." } },
    { cmd: "kubectl describe scaledobject orders-consumer -n orders", what: { en: "Read conditions and events: auth errors, scaler errors, why it is or isn't active.", he: "לקרוא conditions ו-events: שגיאות auth, שגיאות scaler, למה הוא active או לא." } },
    { cmd: "kubectl get hpa keda-hpa-orders-consumer -n orders -o yaml", what: { en: "Inspect the HPA KEDA generated: external metric names, targets and behavior.", he: "לבדוק את ה-HPA ש-KEDA יצר: שמות ה-external metrics, ה-targets וה-behavior." } },
    { cmd: "kubectl logs -n keda deploy/keda-operator --tail=100 | grep -i error", what: { en: "Find scaler errors (connection refused, AccessDenied, unknown topic) in the operator logs.", he: "למצוא שגיאות scaler (connection refused, AccessDenied, unknown topic) בלוגים של ה-operator." } },
    { cmd: "kubectl get apiservice v1beta1.external.metrics.k8s.io -o wide", what: { en: "Check who owns the external metrics API and whether it is Available — the cause of &lt;unknown&gt; targets.", he: "לבדוק מי מחזיק את ה-external metrics API והאם הוא Available – הסיבה ל-targets של &lt;unknown&gt;." } },
    { cmd: "kubectl get --raw \"/apis/external.metrics.k8s.io/v1beta1/namespaces/orders/s0-kafka-orders?labelSelector=scaledobject.keda.sh%2Fname%3Dorders-consumer\"", what: { en: "Query the external metric value exactly as the HPA does (metric name comes from the HPA spec).", he: "לשאול את הערך של ה-external metric בדיוק כמו שה-HPA שואל (שם ה-metric לקוח מה-spec של ה-HPA)." } },
    { cmd: "kubectl annotate scaledobject orders-consumer -n orders autoscaling.keda.sh/paused-replicas=5 --overwrite", what: { en: "Freeze the workload at 5 replicas during an incident; remove the annotation to resume.", he: "להקפיא את ה-workload על 5 replicas בזמן אירוע. מוחקים את ה-annotation כדי לחזור." } }
  ],
  mnemonic: {
    en: "\"KEDA wakes, HPA takes\": KEDA owns 0↔1 (activation), HPA owns 1↔N (target). And one workload = one autoscaler — never a ScaledObject plus your own HPA.",
    he: "\"KEDA מעיר, HPA מגדיל\": KEDA אחראי על 0↔1 (activation), ה-HPA על 1↔N (target). ו-workload אחד = autoscaler אחד – אף פעם לא ScaledObject ועוד HPA משלך."
  },
  pitfalls: [
    { en: "Setting maxReplicaCount above the Kafka partition count. Consumers beyond the number of partitions get no assignment and sit idle, burning money and triggering rebalances.", he: "לשים maxReplicaCount גבוה ממספר ה-partitions ב-Kafka. Consumers מעבר למספר ה-partitions לא מקבלים assignment ויושבים בטלים, שורפים כסף וגורמים ל-rebalances." },
    { en: "Using a ScaledObject for long-running tasks. Scale-down kills Pods mid-task; use ScaledJob or a long terminationGracePeriodSeconds with graceful shutdown.", he: "להשתמש ב-ScaledObject למשימות ארוכות. scale-down הורג Pods באמצע משימה. משתמשים ב-ScaledJob, או ב-terminationGracePeriodSeconds ארוך עם graceful shutdown." },
    { en: "Installing KEDA next to prometheus-adapter that also serves external metrics. Only one APIService can own external.metrics.k8s.io; the other's HPAs show &lt;unknown&gt;.", he: "להתקין KEDA ליד prometheus-adapter שגם הוא מגיש external metrics. רק APIService אחד יכול להחזיק את external.metrics.k8s.io, וה-HPAs של השני יראו &lt;unknown&gt;." },
    { en: "Scale-to-zero for latency-sensitive HTTP APIs. The first request after idle waits for scheduling, image pull and boot (often 10-60s); keep minReplicaCount ≥ 1 there.", he: "Scale to zero ל-APIs של HTTP שרגישים ל-latency. ה-request הראשון אחרי שקט מחכה ל-scheduling, image pull ו-boot (הרבה פעמים 10-60 שניות). שם משאירים minReplicaCount של 1 לפחות." }
  ],
  interview: [
    {
      q: { en: "How does KEDA relate to the HPA? Can it replace it?", he: "מה הקשר בין KEDA ל-HPA? הוא מחליף אותו?" },
      a: { en: "KEDA doesn't replace the HPA, it drives it. For each ScaledObject it creates an HPA (keda-hpa-&lt;name&gt;) that uses external metrics served by KEDA's metrics apiserver; the HPA does the 1..N math. KEDA itself handles activation — scaling 0→1 and back to 0 after cooldownPeriod — because HPA's minimum is 1. That's also why you must not create a second HPA on the same workload.", he: "KEDA לא מחליף את ה-HPA, הוא מפעיל אותו. לכל ScaledObject הוא יוצר HPA (keda-hpa-&lt;name&gt;) שמשתמש ב-external metrics שה-metrics apiserver של KEDA מגיש, וה-HPA עושה את החישוב של 1..N. KEDA עצמו מטפל ב-activation – עלייה מ-0 ל-1 וירידה חזרה ל-0 אחרי cooldownPeriod – כי המינימום של HPA הוא 1. בגלל זה גם אסור ליצור HPA שני על אותו workload." }
    },
    {
      q: { en: "Your Kafka consumers are at 20% CPU but lag is growing. How do you autoscale correctly?", he: "ה-consumers של Kafka על 20% CPU אבל ה-lag גדל. איך עושים autoscaling נכון?" },
      a: { en: "CPU is the wrong signal for I/O-bound consumers. Use a KEDA Kafka trigger on the consumer group lag with lagThreshold = messages one Pod can drain in an acceptable time, maxReplicaCount = partition count, an activation threshold, credentials via TriggerAuthentication, and a scale-down stabilization window to avoid rebalance storms. If lag still grows at max replicas, the fix is more partitions or a faster consumer, not more Pods.", he: "CPU הוא אות לא נכון ל-consumers שחסומים על I/O. משתמשים ב-trigger של Kafka ב-KEDA לפי ה-lag של ה-consumer group, עם lagThreshold = כמה הודעות Pod אחד מספיק לרוקן בזמן סביר, maxReplicaCount = מספר ה-partitions, activation threshold, credentials דרך TriggerAuthentication ו-stabilization window ל-scale-down כדי למנוע סערות rebalance. אם ה-lag עדיין גדל ב-max replicas, הפתרון הוא עוד partitions או consumer מהיר יותר, לא עוד Pods." }
    }
  ],
  quiz: [
    {
      q: { en: "Who scales a ScaledObject's Deployment from 0 to 1?", he: "מי מעלה את ה-Deployment של ScaledObject מ-0 ל-1?" },
      options: [
        { en: "The HPA controller, using minReplicas: 0", he: "ה-HPA controller, עם minReplicas: 0" },
        { en: "The keda-operator, when an activation threshold is crossed", he: "ה-keda-operator, כשעוברים activation threshold" },
        { en: "The Cluster Autoscaler", he: "ה-Cluster Autoscaler" },
        { en: "The Kafka broker pushes a webhook", he: "ה-Kafka broker שולח webhook" }
      ],
      answer: 1,
      explain: { en: "HPA can't go below 1 replica (without an alpha feature gate). KEDA handles 0↔1 based on activation, then the HPA it generated handles 1↔N.", he: "HPA לא יכול לרדת מתחת ל-replica אחד (בלי feature gate של alpha). KEDA מטפל ב-0↔1 לפי activation, ואחר כך ה-HPA שהוא יצר מטפל ב-1↔N." }
    },
    {
      q: { en: "kubectl get hpa shows TARGETS <unknown>/100 for a KEDA HPA. What's a likely cause?", he: "kubectl get hpa מראה TARGETS <unknown>/100 ל-HPA של KEDA. מה סיבה סבירה?" },
      options: [
        { en: "The Deployment has no CPU requests", he: "ל-Deployment אין CPU requests" },
        { en: "maxReplicaCount is too low", he: "maxReplicaCount נמוך מדי" },
        { en: "cooldownPeriod is too short", he: "cooldownPeriod קצר מדי" },
        { en: "The external metrics API is down or owned by another adapter like prometheus-adapter", he: "ה-external metrics API למטה או שייך ל-adapter אחר כמו prometheus-adapter" }
      ],
      answer: 3,
      explain: { en: "KEDA uses external metrics, which don't depend on Pod requests. <unknown> means the HPA couldn't fetch the metric — KEDA's metrics apiserver unavailable, or another APIService registered for external.metrics.k8s.io.", he: "KEDA משתמש ב-external metrics, שלא תלויים ב-requests של ה-Pods. <unknown> אומר שה-HPA לא הצליח להביא את ה-metric – ה-metrics apiserver של KEDA לא זמין, או APIService אחר נרשם על external.metrics.k8s.io." }
    },
    {
      q: { en: "Each SQS message triggers a 30-minute video render. Best KEDA resource?", he: "כל הודעה ב-SQS מפעילה render של וידאו שלוקח 30 דקות. איזה משאב KEDA הכי מתאים?" },
      options: [
        { en: "ScaledObject with cooldownPeriod: 1800", he: "ScaledObject עם cooldownPeriod: 1800" },
        { en: "ScaledJob, one Job per message", he: "ScaledJob, Job אחד לכל הודעה" },
        { en: "A plain HPA on CPU", he: "HPA רגיל לפי CPU" },
        { en: "A CronJob every minute", he: "CronJob כל דקה" }
      ],
      answer: 1,
      explain: { en: "ScaledJob creates run-to-completion Jobs, so a scale-down never kills a render halfway. A ScaledObject would scale the Deployment down while Pods are mid-task.", he: "ScaledJob יוצר Jobs שרצים עד הסוף, אז scale-down אף פעם לא הורג render באמצע. ScaledObject היה מוריד את ה-Deployment בזמן ש-Pods באמצע משימה." }
    },
    {
      q: { en: "A ScaledObject has two triggers: cron (desiredReplicas 10, 08:00-20:00) and SQS (would give 25). At 10:00, how many replicas?", he: "ל-ScaledObject יש שני triggers: cron (desiredReplicas 10, בין 08:00 ל-20:00) ו-SQS (שהיה נותן 25). בשעה 10:00, כמה replicas?" },
      options: [
        { en: "10 — cron overrides", he: "10 – ה-cron גובר" },
        { en: "35 — they add up", he: "35 – הם מצטברים" },
        { en: "25 — the maximum of all triggers", he: "25 – המקסימום מכל ה-triggers" },
        { en: "17 — the average", he: "17 – הממוצע" }
      ],
      answer: 2,
      explain: { en: "Like the HPA with multiple metrics, KEDA computes a desired count per trigger and takes the highest (capped by maxReplicaCount).", he: "כמו HPA עם כמה metrics, KEDA מחשב מספר רצוי לכל trigger ולוקח את הגבוה ביותר (עד maxReplicaCount)." }
    }
  ],
  playground: "queue",
  related: ["arch-queues", "arch-brokers", "k8s-autoscaling", "k8s-hpa-deep"]
});

// ---------------------------------------------------------------------------
// 22. HPA v2 internals + VPA + in-place resize
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-hpa-deep",
  track: "kubernetes",
  order: 22,
  icon: "🎚️",
  level: 3,
  minutes: 15,
  title: { en: "HPA & VPA Deep Dive: the Formula, Custom Metrics, behavior & In-Place Resize", he: "HPA ו-VPA לעומק: הנוסחה, custom metrics, behavior ו-In-Place Resize" },
  tldr: {
    en: "HPA computes ceil(replicas × current/target) every 15s from requests-relative metrics, tuned by behavior policies; VPA fixes the requests themselves — use them on different signals, never both on CPU.",
    he: "HPA מחשב ceil(replicas × current/target) כל 15 שניות לפי metrics יחסיים ל-requests, ומכויל ע\"י מדיניות behavior. VPA מתקן את ה-requests עצמם – משתמשים בהם על אותות שונים, אף פעם לא שניהם על CPU."
  },
  analogy: {
    en: "HPA is a thermostat that adds or removes radiators; VPA is the engineer who decides how big each radiator should be. If both react to the same room temperature, the engineer shrinks the radiators because 'they're barely working', the thermostat sees the room cooling and adds more small radiators, and you end up with 40 tiny heaters and a huge bill. The behavior block is the thermostat's hysteresis: don't switch off the second the room is warm.",
    he: "HPA הוא תרמוסטט שמוסיף או מוריד רדיאטורים. VPA הוא המהנדס שמחליט כמה גדול צריך להיות כל רדיאטור. אם שניהם מגיבים לאותה טמפרטורה בחדר, המהנדס מקטין את הרדיאטורים כי 'הם בקושי עובדים', התרמוסטט רואה שהחדר מתקרר ומוסיף עוד רדיאטורים קטנים, ובסוף יש לך 40 תנורים קטנטנים וחשבון ענק. ה-behavior הוא ההיסטרזיס של התרמוסטט: לא מכבים ברגע שהחדר התחמם."
  },
  sections: [
    {
      h: { en: "The algorithm, precisely", he: "האלגוריתם, בדיוק" },
      body: {
        en: `<p>Every <strong>15 seconds</strong> (<code>--horizontal-pod-autoscaler-sync-period</code>) the HPA controller in kube-controller-manager does, per metric:</p>
<pre>desiredReplicas = ceil( currentReplicas × currentMetricValue / desiredMetricValue )

example: 4 pods, avg CPU 180% of requests, target 60%
         ceil(4 × 180/60) = 12 pods</pre>
<ul>
<li><strong>Utilization is relative to requests</strong>, not limits or node size. A Pod requesting 100m and using 300m is at 300%.</li>
<li><strong>Tolerance:</strong> if the ratio is within 0.9-1.1 nothing happens (global 10%; per-HPA tolerance is arriving as a newer feature).</li>
<li><strong>Multiple metrics:</strong> compute a desired count for each, take the <strong>maximum</strong>.</li>
<li><strong>Not-ready and missing Pods</strong> are treated conservatively: when scaling up, Pods without metrics count as 0% usage; when scaling down, as 100%. Pods still starting (first 5 min for CPU, <code>--horizontal-pod-autoscaler-cpu-initialization-period</code>) are ignored if not Ready, so a JVM's startup CPU spike doesn't trigger scale-up.</li>
<li>Result is clamped to <code>[minReplicas, maxReplicas]</code>, then shaped by <code>behavior</code>.</li>
</ul>
<p>Metric types in <code>autoscaling/v2</code>: <strong>Resource</strong> (Pod-average CPU/memory), <strong>ContainerResource</strong> (one container only — ignores the sidecar, GA in 1.30), <strong>Pods</strong> (custom per-Pod metric like requests/sec, averaged), <strong>Object</strong> (one metric on another object, e.g. Ingress RPS), <strong>External</strong> (anything outside the cluster, e.g. queue depth).</p>
<blockquote>💡 Real world: memory is a poor HPA metric for most runtimes. JVM, Go and Node rarely release heap after load drops, so the HPA scales up and never scales back down.</blockquote>`,
        he: `<p>כל <strong>15 שניות</strong> (<code>--horizontal-pod-autoscaler-sync-period</code>) ה-HPA controller שבתוך kube-controller-manager מחשב, לכל metric:</p>
<pre>desiredReplicas = ceil( currentReplicas × currentMetricValue / desiredMetricValue )

example: 4 pods, avg CPU 180% of requests, target 60%
         ceil(4 × 180/60) = 12 pods</pre>
<ul>
<li><strong>Utilization יחסי ל-requests</strong>, לא ל-limits ולא לגודל ה-node. Pod שמבקש 100m ומשתמש ב-300m נמצא על 300%.</li>
<li><strong>Tolerance:</strong> אם היחס בין 0.9 ל-1.1 לא קורה כלום (10% גלובלי; tolerance לכל HPA בנפרד מגיע כפיצ'ר חדש יותר).</li>
<li><strong>כמה metrics:</strong> מחשבים מספר רצוי לכל אחד ולוקחים את ה-<strong>מקסימום</strong>.</li>
<li><strong>Pods לא-Ready או בלי metrics</strong> מטופלים בשמרנות: ב-scale-up, Pod בלי metrics נחשב 0%. ב-scale-down – 100%. Pods שעדיין עולים (5 הדקות הראשונות ל-CPU, <code>--horizontal-pod-autoscaler-cpu-initialization-period</code>) לא נספרים אם הם לא Ready, כדי שה-CPU spike של JVM בזמן עלייה לא יגרום ל-scale-up.</li>
<li>התוצאה נחתכת לטווח <code>[minReplicas, maxReplicas]</code> ואז עוברת עיצוב ע"י <code>behavior</code>.</li>
</ul>
<p>סוגי metrics ב-<code>autoscaling/v2</code>: <strong>Resource</strong> (ממוצע CPU/memory ל-Pod), <strong>ContainerResource</strong> (קונטיינר אחד בלבד – מתעלם מה-sidecar, GA ב-1.30), <strong>Pods</strong> (custom metric לכל Pod כמו requests/sec, בממוצע), <strong>Object</strong> (metric אחד על אובייקט אחר, למשל RPS של Ingress), <strong>External</strong> (כל דבר מחוץ ל-cluster, למשל עומק תור).</p>
<blockquote>💡 מהשטח: memory הוא metric גרוע ל-HPA ברוב ה-runtimes. JVM, Go ו-Node כמעט לא משחררים heap אחרי שהעומס יורד, אז ה-HPA עולה ולא יורד אף פעם.</blockquote>`
      }
    },
    {
      h: { en: "Where metrics come from: metrics-server vs prometheus-adapter", he: "מאיפה מגיעים ה-metrics: metrics-server מול prometheus-adapter" },
      body: {
        en: `<p>The HPA never scrapes anything itself. It queries three aggregated APIs on the API server:</p>
<table>
<tr><th>API</th><th>Served by</th><th>Used for</th></tr>
<tr><td><code>metrics.k8s.io</code></td><td>metrics-server (reads kubelet/cAdvisor every 15s)</td><td>Resource / ContainerResource (CPU, memory), <code>kubectl top</code></td></tr>
<tr><td><code>custom.metrics.k8s.io</code></td><td>prometheus-adapter, KEDA, Datadog cluster agent…</td><td>Pods / Object metrics</td></tr>
<tr><td><code>external.metrics.k8s.io</code></td><td>KEDA, prometheus-adapter, cloud adapters</td><td>External metrics</td></tr>
</table>
<p>To scale on HTTP requests per second with <strong>prometheus-adapter</strong>, you write a rule that turns a PromQL series into a per-Pod metric:</p>
<pre># prometheus-adapter values.yaml
rules:
  custom:
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources: { overrides: { namespace: {resource: namespace}, pod: {resource: pod} } }
      name: { matches: "^(.*)_total$", as: "\${1}_per_second" }
      metricsQuery: 'sum(rate(&lt;&lt;.Series&gt;&gt;{&lt;&lt;.LabelMatchers&gt;&gt;}[2m])) by (&lt;&lt;.GroupBy&gt;&gt;)'
---
# HPA
metrics:
  - type: Pods
    pods:
      metric: { name: http_requests_per_second }
      target: { type: AverageValue, averageValue: "50" }   # 50 RPS per Pod</pre>
<blockquote>⚠️ Production tip: prometheus-adapter is in low-maintenance mode and its config is notoriously fiddly. In 2025-2026 many teams use KEDA's <code>prometheus</code> trigger instead — same PromQL, simpler YAML. Whichever you choose, only <em>one</em> component can serve <code>external.metrics.k8s.io</code>.</blockquote>`,
        he: `<p>ה-HPA אף פעם לא עושה scrape לבד. הוא שואל שלושה aggregated APIs דרך ה-API server:</p>
<table>
<tr><th>API</th><th>מי מגיש</th><th>בשביל מה</th></tr>
<tr><td><code>metrics.k8s.io</code></td><td>metrics-server (קורא מ-kubelet/cAdvisor כל 15 שניות)</td><td>Resource / ContainerResource (CPU, memory), <code>kubectl top</code></td></tr>
<tr><td><code>custom.metrics.k8s.io</code></td><td>prometheus-adapter, KEDA, Datadog cluster agent…</td><td>Pods / Object metrics</td></tr>
<tr><td><code>external.metrics.k8s.io</code></td><td>KEDA, prometheus-adapter, adapters של עננים</td><td>External metrics</td></tr>
</table>
<p>כדי לעשות scale לפי requests לשנייה עם <strong>prometheus-adapter</strong>, כותבים rule שהופך סדרה של PromQL ל-metric לכל Pod:</p>
<pre># prometheus-adapter values.yaml
rules:
  custom:
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources: { overrides: { namespace: {resource: namespace}, pod: {resource: pod} } }
      name: { matches: "^(.*)_total$", as: "\${1}_per_second" }
      metricsQuery: 'sum(rate(&lt;&lt;.Series&gt;&gt;{&lt;&lt;.LabelMatchers&gt;&gt;}[2m])) by (&lt;&lt;.GroupBy&gt;&gt;)'
---
# HPA
metrics:
  - type: Pods
    pods:
      metric: { name: http_requests_per_second }
      target: { type: AverageValue, averageValue: "50" }   # 50 RPS per Pod</pre>
<blockquote>⚠️ טיפ לפרודקשן: prometheus-adapter נמצא במצב תחזוקה נמוכה והקונפיגורציה שלו ידועה כמעצבנת. ב-2025-2026 הרבה צוותים עוברים ל-trigger של <code>prometheus</code> ב-KEDA – אותו PromQL, YAML פשוט יותר. מה שלא תבחר, רק רכיב <em>אחד</em> יכול להגיש את <code>external.metrics.k8s.io</code>.</blockquote>`
      }
    },
    {
      h: { en: "behavior: stabilization windows and scaling policies", he: "behavior: stabilization windows ו-scaling policies" },
      body: {
        en: `<p>Without tuning, HPA scales up instantly and scales down after a 5-minute look-back. The <code>behavior</code> field lets you shape both directions:</p>
<pre>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 4
  maxReplicas: 60
  metrics:
    - type: ContainerResource
      containerResource: { name: cpu, container: api, target: { type: Utilization, averageUtilization: 65 } }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      selectPolicy: Max
      policies:
        - { type: Percent, value: 100, periodSeconds: 30 }   # at most double every 30s
        - { type: Pods,    value: 8,   periodSeconds: 30 }   # or +8 pods, whichever is more
    scaleDown:
      stabilizationWindowSeconds: 600                        # use the highest recommendation of last 10 min
      selectPolicy: Min
      policies:
        - { type: Percent, value: 10, periodSeconds: 60 }    # shed at most 10%/min</pre>
<ul>
<li><strong>stabilizationWindowSeconds</strong> — the HPA remembers its recommendations over this window; for scale-down it uses the <em>highest</em> one, so a 2-minute dip doesn't remove Pods. Defaults: 0s up, 300s down.</li>
<li><strong>policies</strong> — rate limits per <code>periodSeconds</code>. <code>selectPolicy: Max</code> picks the policy allowing the biggest change, <code>Min</code> the smallest, <code>Disabled</code> turns that direction off entirely.</li>
<li>Default scale-up: max(100%, 4 Pods) every 15s. Default scale-down: 100% every 15s after the 300s window.</li>
</ul>
<blockquote>💡 Real world: for spiky traffic (flash sales, push notifications) the usual recipe is aggressive scale-up, slow scale-down (10-15 min window, 10%/min), and <code>minReplicas</code> sized for the normal peak — because new Pods plus new nodes take 1-3 minutes to absorb load.</blockquote>`,
        he: `<p>בלי כיוונון, HPA עולה מיד ויורד אחרי מבט לאחור של 5 דקות. השדה <code>behavior</code> נותן לעצב את שני הכיוונים:</p>
<pre>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 4
  maxReplicas: 60
  metrics:
    - type: ContainerResource
      containerResource: { name: cpu, container: api, target: { type: Utilization, averageUtilization: 65 } }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      selectPolicy: Max
      policies:
        - { type: Percent, value: 100, periodSeconds: 30 }   # at most double every 30s
        - { type: Pods,    value: 8,   periodSeconds: 30 }   # or +8 pods, whichever is more
    scaleDown:
      stabilizationWindowSeconds: 600                        # use the highest recommendation of last 10 min
      selectPolicy: Min
      policies:
        - { type: Percent, value: 10, periodSeconds: 60 }    # shed at most 10%/min</pre>
<ul>
<li><strong>stabilizationWindowSeconds</strong> – ה-HPA זוכר את ההמלצות שלו לאורך החלון הזה. ב-scale-down הוא לוקח את ה-<em>גבוהה</em> ביותר, כך שירידה של 2 דקות לא מורידה Pods. ברירות מחדל: 0 שניות למעלה, 300 למטה.</li>
<li><strong>policies</strong> – הגבלת קצב לכל <code>periodSeconds</code>. <code>selectPolicy: Max</code> בוחר את ה-policy שמרשה את השינוי הכי גדול, <code>Min</code> את הכי קטן, ו-<code>Disabled</code> מכבה את הכיוון הזה לגמרי.</li>
<li>ברירת מחדל ל-scale-up: הגדול מבין 100% ו-4 Pods כל 15 שניות. ל-scale-down: 100% כל 15 שניות אחרי חלון של 300 שניות.</li>
</ul>
<blockquote>💡 מהשטח: לטראפיק קופצני (מבצעים, push notifications) המתכון הרגיל הוא scale-up אגרסיבי, scale-down איטי (חלון של 10-15 דקות, 10% לדקה), ו-<code>minReplicas</code> שמתאים לשיא הרגיל – כי Pods חדשים ועוד nodes חדשים לוקחים 1-3 דקות עד שהם סופגים עומס.</blockquote>`
      }
    },
    {
      h: { en: "Why isn't my HPA scaling?", he: "למה ה-HPA שלי לא עושה scale?" },
      body: {
        en: `<pre>$ kubectl get hpa api
NAME  REFERENCE        TARGETS               MINPODS  MAXPODS  REPLICAS
api   Deployment/api   cpu: &lt;unknown&gt;/65%   4        60       4

$ kubectl describe hpa api
Conditions:
  AbleToScale     True    SucceededGetScale
  ScalingActive   False   FailedGetResourceMetric  the HPA was unable to compute the replica
                          count: failed to get cpu utilization: missing request for cpu in container "istio-proxy"
  ScalingLimited  False   DesiredWithinRange</pre>
<p>The usual suspects, in order of frequency:</p>
<ol>
<li><strong>Missing requests</strong> → <code>&lt;unknown&gt;</code>. Utilization is a percentage of requests; if <em>any</em> container (including an injected sidecar) has no CPU request, Resource-type CPU utilization can't be computed. Fix the requests, or use <code>ContainerResource</code> on the app container.</li>
<li><strong>metrics-server broken</strong> — <code>kubectl top pods</code> fails; check <code>kubectl get apiservice v1beta1.metrics.k8s.io</code> (often kubelet TLS: <code>--kubelet-insecure-tls</code> on kind/minikube).</li>
<li><strong>ScalingLimited True / TooManyReplicas</strong> — you're at <code>maxReplicas</code>. Raise it, or find why load isn't spread.</li>
<li><strong>Metric is fine, but Pods are Pending</strong> — HPA did scale; the cluster has no room. That's a node autoscaler problem.</li>
<li><strong>Someone else owns replicas</strong> — a GitOps tool reapplying <code>spec.replicas</code> from Git every sync and fighting the HPA. Remove <code>replicas</code> from the manifest or have Argo CD ignore it.</li>
<li><strong>Within tolerance</strong> — 64% vs target 65% won't move.</li>
</ol>`,
        he: `<pre>$ kubectl get hpa api
NAME  REFERENCE        TARGETS               MINPODS  MAXPODS  REPLICAS
api   Deployment/api   cpu: &lt;unknown&gt;/65%   4        60       4

$ kubectl describe hpa api
Conditions:
  AbleToScale     True    SucceededGetScale
  ScalingActive   False   FailedGetResourceMetric  the HPA was unable to compute the replica
                          count: failed to get cpu utilization: missing request for cpu in container "istio-proxy"
  ScalingLimited  False   DesiredWithinRange</pre>
<p>החשודים הרגילים, לפי סדר שכיחות:</p>
<ol>
<li><strong>חסרים requests</strong> → <code>&lt;unknown&gt;</code>. Utilization זה אחוז מה-requests. אם ל-<em>קונטיינר כלשהו</em> (כולל sidecar שהוזרק) אין CPU request, אי אפשר לחשב CPU utilization מסוג Resource. מתקנים את ה-requests, או משתמשים ב-<code>ContainerResource</code> על קונטיינר האפליקציה.</li>
<li><strong>metrics-server שבור</strong> – <code>kubectl top pods</code> נכשל. בודקים <code>kubectl get apiservice v1beta1.metrics.k8s.io</code> (הרבה פעמים TLS מול ה-kubelet: <code>--kubelet-insecure-tls</code> ב-kind/minikube).</li>
<li><strong>ScalingLimited True / TooManyReplicas</strong> – הגעת ל-<code>maxReplicas</code>. מעלים אותו, או מבינים למה העומס לא מתפזר.</li>
<li><strong>ה-metric תקין אבל ה-Pods ב-Pending</strong> – ה-HPA כן עשה scale, פשוט אין מקום ב-cluster. זו בעיה של ה-node autoscaler.</li>
<li><strong>מישהו אחר שולט ב-replicas</strong> – כלי GitOps שמחיל מחדש את <code>spec.replicas</code> מ-Git בכל sync ונלחם ב-HPA. מוחקים את <code>replicas</code> מה-manifest או מגדירים ל-Argo CD להתעלם ממנו.</li>
<li><strong>בתוך ה-tolerance</strong> – 64% מול target של 65% לא יזיז כלום.</li>
</ol>`
      }
    },
    {
      h: { en: "VPA modes, in-place resize, and Goldilocks", he: "מצבי VPA, in-place resize ו-Goldilocks" },
      body: {
        en: `<p>The <strong>Vertical Pod Autoscaler</strong> (a separate add-on: recommender + updater + admission webhook) watches actual usage history (8 days by default) and computes <code>target</code>, <code>lowerBound</code>, <code>upperBound</code> requests per container. <code>updatePolicy.updateMode</code> decides what it does with them:</p>
<ul>
<li><strong>Off</strong> — only writes recommendations into <code>status</code>. Safest; perfect for rightsizing reports.</li>
<li><strong>Initial</strong> — sets requests only when a Pod is created; never touches running Pods.</li>
<li><strong>Recreate</strong> — evicts Pods whose requests drift far from the recommendation (respecting PDBs). The old <code>Auto</code> value behaves like this and is being deprecated.</li>
<li><strong>InPlaceOrRecreate</strong> — newer VPA versions resize running Pods in place using the Kubernetes <strong>in-place Pod resize</strong> feature (beta and on by default in 1.33, GA in 1.35), falling back to eviction when the node has no room.</li>
</ul>
<pre>kubectl patch pod api-7d9f-xk2p --subresource resize --patch \
  '{"spec":{"containers":[{"name":"api","resources":{"requests":{"cpu":"800m"},"limits":{"cpu":"1500m"}}}]}}'
# container spec: resizePolicy: [{resourceName: memory, restartPolicy: RestartContainer}]</pre>
<p><strong>Never run VPA (Recreate/InPlace) and HPA on the same CPU or memory metric.</strong> HPA target is a % of requests; VPA changes requests. VPA raises requests → utilization % drops → HPA removes Pods → each Pod is busier → VPA raises again. They chase each other. Safe combos: HPA on RPS/queue lag + VPA on CPU/memory; or VPA in <code>Off</code> mode feeding recommendations to humans.</p>
<p><strong>Goldilocks</strong> (Fairwinds) automates the Off-mode approach: label a namespace <code>goldilocks.fairwinds.com/enabled=true</code> and it creates an Off-mode VPA for every Deployment and shows a dashboard of recommended requests/limits per container.</p>`,
        he: `<p>ה-<strong>Vertical Pod Autoscaler</strong> (add-on נפרד: recommender + updater + admission webhook) עוקב אחרי היסטוריית השימוש האמיתית (8 ימים כברירת מחדל) ומחשב <code>target</code>, <code>lowerBound</code> ו-<code>upperBound</code> של requests לכל קונטיינר. <code>updatePolicy.updateMode</code> קובע מה הוא עושה איתם:</p>
<ul>
<li><strong>Off</strong> – רק כותב המלצות ל-<code>status</code>. הכי בטוח, מושלם לדוחות rightsizing.</li>
<li><strong>Initial</strong> – קובע requests רק כש-Pod נוצר. אף פעם לא נוגע ב-Pods שרצים.</li>
<li><strong>Recreate</strong> – עושה evict ל-Pods שה-requests שלהם רחוקים מההמלצה (ומכבד PDBs). הערך הישן <code>Auto</code> מתנהג כמוהו ונמצא בתהליך deprecation.</li>
<li><strong>InPlaceOrRecreate</strong> – גרסאות VPA חדשות משנות גודל ל-Pods שרצים בלי restart, בעזרת הפיצ'ר <strong>in-place Pod resize</strong> של Kubernetes (beta ופעיל כברירת מחדל ב-1.33, GA ב-1.35), ונופלות חזרה ל-eviction אם אין מקום ב-node.</li>
</ul>
<pre>kubectl patch pod api-7d9f-xk2p --subresource resize --patch \
  '{"spec":{"containers":[{"name":"api","resources":{"requests":{"cpu":"800m"},"limits":{"cpu":"1500m"}}}]}}'
# container spec: resizePolicy: [{resourceName: memory, restartPolicy: RestartContainer}]</pre>
<p><strong>אף פעם לא מריצים VPA (Recreate/InPlace) ו-HPA על אותו metric של CPU או memory.</strong> ה-target של HPA הוא אחוז מה-requests, ו-VPA משנה את ה-requests. VPA מעלה requests → אחוז ה-utilization יורד → HPA מוריד Pods → כל Pod עמוס יותר → VPA מעלה שוב. הם רודפים אחד אחרי השני. שילובים בטוחים: HPA לפי RPS/queue lag ו-VPA על CPU/memory, או VPA במצב <code>Off</code> שמזין המלצות לבני אדם.</p>
<p><strong>Goldilocks</strong> (של Fairwinds) עושה אוטומציה לגישת ה-Off: שמים על namespace את ה-label <code>goldilocks.fairwinds.com/enabled=true</code>, והוא יוצר VPA במצב Off לכל Deployment ומציג dashboard עם requests/limits מומלצים לכל קונטיינר.</p>`
      }
    }
  ],
  diagram: `             every 15s
 metrics-server ----metrics.k8s.io----+
 prometheus-adapter --custom.metrics--+--> HPA controller
 KEDA ------------external.metrics----+     |
                                            | per metric:
                                            |  ceil(replicas x current/target)
                                            |  take MAX over metrics
                                            |  skip if |ratio-1| <= 0.1
                                            |  clamp [min,max]
                                            |  behavior: window + policies
                                            v
                                     Deployment /scale

 VPA:  usage history --> recommender --> target requests
                         updater: Off | Initial | Recreate | InPlaceOrRecreate

 DON'T:  HPA(cpu %) <--fights--> VPA(cpu requests)
 DO:     HPA(rps / lag)  +  VPA(cpu, memory)`,
  handsOn: [
    { cmd: "kubectl get hpa -A -o wide", what: { en: "Every HPA with current vs target metrics, min/max and replicas — spot &lt;unknown&gt; targets fast.", he: "כל ה-HPAs עם metrics נוכחי מול target, min/max ו-replicas – למצוא מהר targets של &lt;unknown&gt;." } },
    { cmd: "kubectl describe hpa api", what: { en: "Read AbleToScale / ScalingActive / ScalingLimited conditions and recent scaling events with their reasons.", he: "לקרוא את ה-conditions AbleToScale / ScalingActive / ScalingLimited ואת אירועי ה-scaling האחרונים עם הסיבות." } },
    { cmd: "kubectl get apiservices | grep -E 'metrics.k8s.io|custom.metrics|external.metrics'", what: { en: "Check that the metrics APIs exist and are Available, and which service backs each one.", he: "לבדוק שה-metrics APIs קיימים ו-Available, ואיזה service עומד מאחורי כל אחד." } },
    { cmd: "kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/default/pods/*/http_requests_per_second | jq .", what: { en: "Query a custom metric the same way the HPA does, to verify prometheus-adapter rules.", he: "לשאול custom metric בדיוק כמו ה-HPA, כדי לוודא שה-rules של prometheus-adapter עובדים." } },
    { cmd: "kubectl autoscale deployment api --cpu-percent=65 --min=4 --max=60", what: { en: "Create a basic CPU HPA imperatively (then export with -o yaml and add behavior).", he: "ליצור HPA בסיסי לפי CPU בצורה אימפרטיבית (ואז לייצא עם -o yaml ולהוסיף behavior)." } },
    { cmd: "kubectl get vpa api -o jsonpath='{.status.recommendation.containerRecommendations}' | jq .", what: { en: "Print VPA's target / lowerBound / upperBound requests per container.", he: "להדפיס את ה-target / lowerBound / upperBound של VPA לכל קונטיינר." } },
    { cmd: "kubectl label namespace shop goldilocks.fairwinds.com/enabled=true", what: { en: "Turn on Goldilocks recommendations (Off-mode VPAs) for every workload in a namespace.", he: "להפעיל המלצות Goldilocks (VPAs במצב Off) לכל ה-workloads ב-namespace." } },
    { cmd: "kubectl get pod api-7d9f-xk2p -o jsonpath='{.status.containerStatuses[0].resources}'", what: { en: "See the resources actually applied to a running container — differs from spec during an in-place resize.", he: "לראות את המשאבים שבאמת מוחלים על קונטיינר שרץ – שונה מה-spec בזמן in-place resize." } }
  ],
  mnemonic: {
    en: "\"Ceil, Max, Clamp, Calm\": ceil(replicas × current/target) per metric, take the Max, Clamp to min/max, Calm it with behavior. And: HPA counts Pods, VPA sizes Pods — never let them argue about CPU.",
    he: "\"עיגול, מקסימום, חיתוך, הרגעה\": ceil(replicas × current/target) לכל metric, לוקחים מקסימום, חותכים ל-min/max ומרגיעים עם behavior. ו: HPA סופר Pods, VPA מודד Pods – אסור לתת להם להתווכח על CPU."
  },
  pitfalls: [
    { en: "A sidecar without CPU requests (service mesh proxy, log shipper) breaks Resource CPU utilization for the whole Pod → &lt;unknown&gt;. Use ContainerResource or set sidecar requests.", he: "Sidecar בלי CPU requests (proxy של service mesh, log shipper) שובר את ה-CPU utilization מסוג Resource לכל ה-Pod → &lt;unknown&gt;. משתמשים ב-ContainerResource או נותנים requests ל-sidecar." },
    { en: "Keeping spec.replicas in the Deployment manifest managed by GitOps. Every sync resets the count and fights the HPA. Remove the field once an HPA exists.", he: "להשאיר spec.replicas ב-manifest של Deployment שמנוהל ב-GitOps. כל sync מאפס את המספר ונלחם ב-HPA. מוחקים את השדה ברגע שיש HPA." },
    { en: "Setting a 90% CPU target. New Pods need 1-3 minutes to absorb load, so you're saturated before help arrives. 50-70% leaves headroom for the reaction time.", he: "לשים target של 90% CPU. Pods חדשים צריכים 1-3 דקות עד שהם סופגים עומס, אז אתה רווי לפני שהעזרה מגיעה. 50-70% משאיר מרווח לזמן התגובה." },
    { en: "VPA in Recreate mode on a single-replica Deployment without a PDB: every recommendation change is a full outage while the Pod restarts.", he: "VPA במצב Recreate על Deployment עם replica אחד ובלי PDB: כל שינוי בהמלצה הוא השבתה מלאה בזמן שה-Pod עולה מחדש." }
  ],
  interview: [
    {
      q: { en: "Explain the HPA algorithm and how scale-down is protected from flapping.", he: "תסביר את האלגוריתם של HPA ואיך scale-down מוגן מתנודות." },
      a: { en: "Every 15s, for each metric: desired = ceil(current replicas × current value / target value); with multiple metrics take the max; ignore changes within 10% tolerance; clamp to min/max. Flapping is prevented by the scale-down stabilization window (default 300s): the HPA uses the highest recommendation seen in that window, so short dips don't remove Pods. Scaling policies further cap the rate, e.g. at most 10% of Pods per minute.", he: "כל 15 שניות, לכל metric: desired = ceil(replicas נוכחי × ערך נוכחי / ערך target). עם כמה metrics לוקחים מקסימום, מתעלמים משינויים בתוך tolerance של 10%, וחותכים ל-min/max. תנודות נמנעות ע\"י ה-stabilization window של scale-down (ברירת מחדל 300 שניות): ה-HPA לוקח את ההמלצה הגבוהה ביותר בחלון, כך שירידות קצרות לא מורידות Pods. Scaling policies מגבילים עוד יותר את הקצב, למשל עד 10% מה-Pods לדקה." }
    },
    {
      q: { en: "Can you use VPA and HPA together?", he: "אפשר להשתמש ב-VPA ו-HPA ביחד?" },
      a: { en: "Not on the same resource metric. HPA's CPU target is a percentage of requests and VPA changes requests, so they create a feedback loop. Safe patterns: HPA on a custom/external metric (RPS, queue lag) with VPA managing CPU/memory requests; or VPA in Off mode (or Goldilocks) only for recommendations that you apply via Git. With in-place resize GA, InPlaceOrRecreate makes VPA far less disruptive, but the conflict rule still holds.", he: "לא על אותו resource metric. ה-target של HPA ל-CPU הוא אחוז מה-requests, ו-VPA משנה את ה-requests, אז נוצר feedback loop. דפוסים בטוחים: HPA לפי custom/external metric (RPS, queue lag) ו-VPA שמנהל requests של CPU/memory; או VPA במצב Off (או Goldilocks) רק בשביל המלצות שמחילים דרך Git. עם in-place resize ב-GA, מצב InPlaceOrRecreate הופך את VPA להרבה פחות מפריע, אבל חוק ההתנגשות עדיין בתוקף." }
    },
    {
      q: { en: "kubectl get hpa shows &lt;unknown&gt; for CPU. What do you check?", he: "kubectl get hpa מראה &lt;unknown&gt; ב-CPU. מה בודקים?" },
      a: { en: "describe the HPA and read ScalingActive's message. Typical causes: a container without CPU requests (often an injected sidecar), metrics-server down or its APIService unavailable (kubectl top pods fails), Pods not Ready yet, or a wrong scaleTargetRef/selector. Fix requests or switch to ContainerResource; fix metrics-server.", he: "describe ל-HPA וקוראים את ההודעה של ScalingActive. סיבות נפוצות: קונטיינר בלי CPU requests (הרבה פעמים sidecar שהוזרק), metrics-server למטה או שה-APIService שלו לא זמין (kubectl top pods נכשל), Pods שעוד לא Ready, או scaleTargetRef/selector לא נכון. מתקנים requests או עוברים ל-ContainerResource, ומתקנים את metrics-server." }
    }
  ],
  quiz: [
    {
      q: { en: "4 replicas, average CPU 150% of requests, target 50%. What does HPA want?", he: "4 replicas, ממוצע CPU של 150% מה-requests, target של 50%. מה ה-HPA ירצה?" },
      options: [
        { en: "12", he: "12" },
        { en: "8", he: "8" },
        { en: "6", he: "6" },
        { en: "16", he: "16" }
      ],
      answer: 0,
      explain: { en: "ceil(4 × 150/50) = 12, subject to maxReplicas and the scale-up policies (default allows doubling or +4 every 15s, so it may take a few cycles).", he: "ceil(4 × 150/50) = 12, בכפוף ל-maxReplicas ול-scale-up policies (ברירת המחדל מרשה הכפלה או +4 כל 15 שניות, אז זה יכול לקחת כמה סבבים)." }
    },
    {
      q: { en: "What does scaleDown.stabilizationWindowSeconds: 600 do?", he: "מה עושה scaleDown.stabilizationWindowSeconds: 600?" },
      options: [
        { en: "Waits 600s after every scale-up before any scale-down is allowed", he: "מחכה 600 שניות אחרי כל scale-up לפני שמותר scale-down" },
        { en: "Scales down using the highest recommendation computed in the last 10 minutes", he: "עושה scale-down לפי ההמלצה הגבוהה ביותר שחושבה ב-10 הדקות האחרונות" },
        { en: "Removes at most 600 Pods per window", he: "מוריד עד 600 Pods לכל חלון" },
        { en: "Polls metrics every 600s", he: "בודק metrics כל 600 שניות" }
      ],
      answer: 1,
      explain: { en: "The stabilization window is a rolling look-back: for scale-down the HPA picks the max recommendation in the window, so replicas only drop after load has stayed low for the whole window.", he: "ה-stabilization window הוא מבט לאחור מתגלגל: ב-scale-down ה-HPA בוחר את ההמלצה המקסימלית בחלון, כך שה-replicas יורדים רק אחרי שהעומס נשאר נמוך לאורך כל החלון." }
    },
    {
      q: { en: "Which VPA mode never changes running or new Pods?", he: "איזה מצב של VPA אף פעם לא משנה Pods שרצים או חדשים?" },
      options: [
        { en: "Initial", he: "Initial" },
        { en: "Recreate", he: "Recreate" },
        { en: "Off", he: "Off" },
        { en: "InPlaceOrRecreate", he: "InPlaceOrRecreate" }
      ],
      answer: 2,
      explain: { en: "Off only publishes recommendations in status. Initial applies them to new Pods, Recreate evicts, InPlaceOrRecreate resizes live Pods.", he: "Off רק מפרסם המלצות ב-status. Initial מחיל אותן על Pods חדשים, Recreate עושה evict, ו-InPlaceOrRecreate משנה גודל ל-Pods חיים." }
    },
    {
      q: { en: "HPA on CPU shows <unknown>; kubectl top pods works fine. Most likely cause?", he: "HPA לפי CPU מראה <unknown>, ו-kubectl top pods עובד מצוין. מה הסיבה הסבירה?" },
      options: [
        { en: "metrics-server is down", he: "metrics-server למטה" },
        { en: "A container in the Pod (e.g. a sidecar) has no CPU request", he: "לקונטיינר ב-Pod (למשל sidecar) אין CPU request" },
        { en: "maxReplicas reached", he: "הגענו ל-maxReplicas" },
        { en: "The stabilization window is too long", he: "ה-stabilization window ארוך מדי" }
      ],
      answer: 1,
      explain: { en: "top working proves metrics-server is fine. Utilization needs requests for every container; a sidecar without them makes the percentage uncomputable. maxReplicas shows as ScalingLimited, not <unknown>.", he: "זה ש-top עובד מוכיח ש-metrics-server תקין. Utilization צריך requests לכל קונטיינר, ו-sidecar בלי requests הופך את האחוז לבלתי ניתן לחישוב. maxReplicas מופיע כ-ScalingLimited, לא כ-<unknown>." }
    }
  ],
  playground: "scaling",
  related: ["k8s-autoscaling", "k8s-resources", "k8s-keda", "k8s-cost"]
});

// ---------------------------------------------------------------------------
// 23. Helm deep dive
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-helm-deep",
  track: "kubernetes",
  order: 23,
  icon: "⛵",
  level: 3,
  minutes: 16,
  title: { en: "Helm Deep Dive: Charts, Templating, Releases & Debugging", he: "Helm לעומק: Charts, Templating, Releases ודיבאג" },
  tldr: {
    en: "A chart is a Go-templated package of manifests; a release is one installed, versioned instance of it stored as a Secret — render it, diff it, upgrade atomically, and roll back by revision.",
    he: "Chart הוא חבילה של manifests עם Go templates. Release הוא מופע מותקן אחד שלו עם גרסאות, שנשמר כ-Secret – מרנדרים, עושים diff, משדרגים בצורה אטומית, ועושים rollback לפי revision."
  },
  analogy: {
    en: "A Helm chart is a recipe with blanks: 'add ___ cups of flour'. values.yaml is the default shopping list, your -f prod.yaml is the head chef's notes, and --set is a sticky note slapped on at the last second — the sticky note always wins. Every time you cook (install/upgrade), Helm photographs the dish and files it in a numbered album (release history), so 'make it like Tuesday's' is just helm rollback 7.",
    he: "Chart של Helm הוא מתכון עם חורים: 'להוסיף ___ כוסות קמח'. values.yaml הוא רשימת הקניות הדיפולטית, ה-<code>-f prod.yaml</code> שלך הוא ההערות של השף הראשי, ו-<code>--set</code> הוא פתק דביק שמדביקים ברגע האחרון – הפתק הדביק תמיד מנצח. בכל פעם שמבשלים (install/upgrade), Helm מצלם את המנה ומתייק אותה באלבום ממוספר (release history), אז 'תעשה כמו ביום שלישי' זה פשוט helm rollback 7."
  },
  sections: [
    {
      h: { en: "Chart anatomy", he: "האנטומיה של Chart" },
      body: {
        en: `<pre>payments/
├── Chart.yaml          # name, version (chart), appVersion (app), dependencies
├── Chart.lock          # pinned dependency versions (helm dependency update)
├── values.yaml         # defaults — the chart's public API
├── values.schema.json  # optional JSON Schema: helm fails fast on bad values
├── charts/             # vendored subcharts (.tgz)
├── templates/
│   ├── _helpers.tpl    # named templates (define), never rendered alone
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   ├── tests/test-connection.yaml   # helm test
│   └── NOTES.txt       # printed after install: "your app is at ..."
└── .helmignore</pre>
<pre># Chart.yaml
apiVersion: v2
name: payments
version: 1.14.2        # bump on ANY chart change (SemVer)
appVersion: "3.8.0"    # the app image version; informational / default tag
type: application      # or "library" (only helpers, no manifests)
dependencies:
  - name: postgresql
    version: "16.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled</pre>
<p>Two versions, two meanings: <code>version</code> is the <em>package</em> (bump it whenever templates or defaults change), <code>appVersion</code> is the software inside. Treat <code>values.yaml</code> as an API contract: every key documented, safe defaults, and a <code>values.schema.json</code> so <code>replicaCount: "three"</code> fails at <code>helm install</code> instead of at 3 a.m.</p>
<blockquote>💡 Real world: Helm 4 (released late 2025) keeps chart API v2 compatibility, switches to server-side apply for new installs, and adds WebAssembly plugins. Most of what follows applies to Helm 3 and 4 alike; a few flags were renamed (e.g. <code>--atomic</code> → <code>--rollback-on-failure</code>, <code>--force</code> → <code>--force-replace</code>).</blockquote>`,
        he: `<pre>payments/
├── Chart.yaml          # name, version (chart), appVersion (app), dependencies
├── Chart.lock          # pinned dependency versions (helm dependency update)
├── values.yaml         # defaults — the chart's public API
├── values.schema.json  # optional JSON Schema: helm fails fast on bad values
├── charts/             # vendored subcharts (.tgz)
├── templates/
│   ├── _helpers.tpl    # named templates (define), never rendered alone
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   ├── tests/test-connection.yaml   # helm test
│   └── NOTES.txt       # printed after install: "your app is at ..."
└── .helmignore</pre>
<pre># Chart.yaml
apiVersion: v2
name: payments
version: 1.14.2        # bump on ANY chart change (SemVer)
appVersion: "3.8.0"    # the app image version; informational / default tag
type: application      # or "library" (only helpers, no manifests)
dependencies:
  - name: postgresql
    version: "16.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled</pre>
<p>שתי גרסאות, שתי משמעויות: <code>version</code> זו ה<em>חבילה</em> (מעלים בכל שינוי ב-templates או ב-defaults), ו-<code>appVersion</code> זו התוכנה שבפנים. מתייחסים ל-<code>values.yaml</code> כמו לחוזה API: כל key מתועד, defaults בטוחים, ו-<code>values.schema.json</code> כדי ש-<code>replicaCount: "three"</code> ייכשל ב-<code>helm install</code> ולא ב-3 בלילה.</p>
<blockquote>💡 מהשטח: Helm 4 (יצא בסוף 2025) שומר על תאימות ל-chart API v2, עובר ל-server-side apply בהתקנות חדשות ומוסיף plugins ב-WebAssembly. רוב מה שבהמשך נכון גם ל-Helm 3 וגם ל-4; כמה flags שינו שם (למשל <code>--atomic</code> → <code>--rollback-on-failure</code>, ו-<code>--force</code> → <code>--force-replace</code>).</blockquote>`
      }
    },
    {
      h: { en: "Go templating you'll actually use", he: "ה-Go templating שבאמת תשתמש בו" },
      body: {
        en: `<pre># templates/_helpers.tpl
{{- define "payments.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-payments
  labels:
    {{- include "payments.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount | default 2 }}
  {{- end }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          env:
            - name: DB_HOST
              value: {{ required "database.host is required" .Values.database.host | quote }}
            {{- range $k, $v := .Values.extraEnv }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}</pre>
<ul>
<li><code>{{-</code> / <code>-}}</code> trim whitespace left/right — most YAML bugs are whitespace bugs.</li>
<li><strong>include</strong> (not <code>template</code>) renders a named template into a string you can pipe to <code>nindent</code>.</li>
<li><strong>toYaml | nindent N</strong> dumps a whole values sub-tree at the right indentation.</li>
<li><strong>required</strong> fails rendering with a clear message; <strong>default</strong> fills a fallback; <strong>quote</strong> prevents <code>"true"</code>/<code>"0123"</code> becoming bool/number.</li>
<li><strong>range</strong> iterates lists/maps; inside it <code>.</code> changes — use <code>$</code> for the root context.</li>
<li>The <code>checksum/config</code> annotation restarts Pods when the ConfigMap changes — a classic pattern.</li>
</ul>`,
        he: `<pre># templates/_helpers.tpl
{{- define "payments.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-payments
  labels:
    {{- include "payments.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount | default 2 }}
  {{- end }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          env:
            - name: DB_HOST
              value: {{ required "database.host is required" .Values.database.host | quote }}
            {{- range $k, $v := .Values.extraEnv }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}</pre>
<ul>
<li><code>{{-</code> / <code>-}}</code> חותכים whitespace משמאל/מימין – רוב הבאגים ב-YAML הם באגים של רווחים.</li>
<li><strong>include</strong> (ולא <code>template</code>) מרנדר named template למחרוזת שאפשר להעביר ב-pipe ל-<code>nindent</code>.</li>
<li><strong>toYaml | nindent N</strong> שופך תת-עץ שלם של values באינדנטציה הנכונה.</li>
<li><strong>required</strong> מכשיל את הרינדור עם הודעה ברורה. <strong>default</strong> נותן ערך גיבוי. <strong>quote</strong> מונע מ-<code>"true"</code>/<code>"0123"</code> להפוך ל-bool/מספר.</li>
<li><strong>range</strong> עובר על lists/maps. בתוכו ה-<code>.</code> משתנה – משתמשים ב-<code>$</code> בשביל ה-root context.</li>
<li>ה-annotation <code>checksum/config</code> עושה restart ל-Pods כשה-ConfigMap משתנה – דפוס קלאסי.</li>
</ul>`
      }
    },
    {
      h: { en: "Values precedence and the release lifecycle", he: "סדר עדיפויות של values ומחזור החיים של release" },
      body: {
        en: `<p>Values merge from lowest to highest priority:</p>
<ol>
<li>chart's <code>values.yaml</code> (and subcharts' own defaults)</li>
<li>parent chart values for a subchart (under the key <code>postgresql:</code>, or <code>global:</code>)</li>
<li><code>-f base.yaml -f prod.yaml</code> — in order, <strong>the last file wins</strong></li>
<li><code>--set</code>, <code>--set-string</code>, <code>--set-file</code>, <code>--set-json</code> — highest</li>
</ol>
<p>Maps are deep-merged; <strong>lists are replaced</strong>, never merged. Setting a key to <code>null</code> deletes a default.</p>
<pre>helm upgrade --install payments ./payments \
  -n payments --create-namespace \
  -f values/base.yaml -f values/prod.yaml \
  --set image.tag=3.8.1 \
  --atomic --wait --timeout 10m \
  --history-max 20

helm history payments -n payments
REVISION  UPDATED                   STATUS      CHART           APP VERSION  DESCRIPTION
11        Mon Nov 10 09:12:03 2026  superseded  payments-1.14.1 3.8.0        Upgrade complete
12        Wed Nov 12 14:40:51 2026  deployed    payments-1.14.2 3.8.1        Upgrade complete

helm rollback payments 11 -n payments --wait     # creates revision 13 = copy of 11
helm uninstall payments -n payments --keep-history</pre>
<ul>
<li><code>upgrade --install</code> is idempotent — the only command you need in CI.</li>
<li><code>--wait</code> blocks until Deployments are available; <code>--atomic</code> (Helm 4: <code>--rollback-on-failure</code>) also rolls back automatically if the wait times out.</li>
<li>Each revision is stored as a Secret <code>sh.helm.release.v1.payments.v12</code> in the release namespace (gzipped, base64). <code>--history-max</code> caps how many are kept (default 10).</li>
<li>Rollback never goes "back in time"; it creates a new revision from an old one.</li>
</ul>`,
        he: `<p>ה-values מתמזגים מהעדיפות הנמוכה לגבוהה:</p>
<ol>
<li>ה-<code>values.yaml</code> של ה-chart (וה-defaults של ה-subcharts)</li>
<li>values של ה-parent chart בשביל subchart (תחת key כמו <code>postgresql:</code>, או <code>global:</code>)</li>
<li><code>-f base.yaml -f prod.yaml</code> – לפי הסדר, <strong>הקובץ האחרון מנצח</strong></li>
<li><code>--set</code>, <code>--set-string</code>, <code>--set-file</code>, <code>--set-json</code> – הכי גבוה</li>
</ol>
<p>Maps מתמזגים לעומק, אבל <strong>lists מוחלפים</strong>, אף פעם לא ממוזגים. אם שמים <code>null</code> על key – מוחקים את ה-default.</p>
<pre>helm upgrade --install payments ./payments \
  -n payments --create-namespace \
  -f values/base.yaml -f values/prod.yaml \
  --set image.tag=3.8.1 \
  --atomic --wait --timeout 10m \
  --history-max 20

helm history payments -n payments
REVISION  UPDATED                   STATUS      CHART           APP VERSION  DESCRIPTION
11        Mon Nov 10 09:12:03 2026  superseded  payments-1.14.1 3.8.0        Upgrade complete
12        Wed Nov 12 14:40:51 2026  deployed    payments-1.14.2 3.8.1        Upgrade complete

helm rollback payments 11 -n payments --wait     # creates revision 13 = copy of 11
helm uninstall payments -n payments --keep-history</pre>
<ul>
<li><code>upgrade --install</code> הוא אידמפוטנטי – הפקודה היחידה שצריך ב-CI.</li>
<li><code>--wait</code> מחכה עד שה-Deployments זמינים. <code>--atomic</code> (ב-Helm 4: <code>--rollback-on-failure</code>) גם עושה rollback אוטומטי אם ה-wait נגמר ב-timeout.</li>
<li>כל revision נשמר כ-Secret בשם <code>sh.helm.release.v1.payments.v12</code> ב-namespace של ה-release (gzip + base64). <code>--history-max</code> מגביל כמה נשמרים (ברירת מחדל 10).</li>
<li>Rollback לא "חוזר בזמן" – הוא יוצר revision חדש מתוך revision ישן.</li>
</ul>`
      }
    },
    {
      h: { en: "Hooks, dependencies and OCI registries", he: "Hooks, dependencies ו-OCI registries" },
      body: {
        en: `<p><strong>Hooks</strong> are normal manifests with an annotation that makes Helm run them at a lifecycle point instead of as part of the release:</p>
<pre>apiVersion: batch/v1
kind: Job
metadata:
  name: payments-db-migrate
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "-5"                     # lower runs first
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers: [ { name: migrate, image: "ghcr.io/acme/payments:3.8.1", args: ["migrate", "up"] } ]</pre>
<p>Hook points: <code>pre/post-install</code>, <code>pre/post-upgrade</code>, <code>pre/post-delete</code>, <code>pre/post-rollback</code>, <code>test</code>. Helm waits for hook Jobs to complete; a failing pre-upgrade hook fails the upgrade before any app manifest changes. Hook resources are <em>not</em> tracked as part of the release, so without a delete policy they pile up (and the next run fails with "already exists").</p>
<p><strong>Dependencies</strong> are declared in Chart.yaml; <code>helm dependency update</code> downloads them into <code>charts/</code> and writes <code>Chart.lock</code>. Turn them on/off with <code>condition</code>, pass values under the subchart's name, and share values via <code>global:</code>.</p>
<p><strong>OCI registries</strong> are now the default way to distribute charts — the same ECR/ACR/GAR/GHCR/Harbor you use for images:</p>
<pre>helm package ./payments                         # payments-1.14.2.tgz
helm push payments-1.14.2.tgz oci://ghcr.io/acme/charts
helm upgrade --install payments oci://ghcr.io/acme/charts/payments --version 1.14.2
helm show values oci://ghcr.io/acme/charts/payments --version 1.14.2</pre>`,
        he: `<p><strong>Hooks</strong> הם manifests רגילים עם annotation שגורם ל-Helm להריץ אותם בנקודה מסוימת במחזור החיים, ולא כחלק מה-release:</p>
<pre>apiVersion: batch/v1
kind: Job
metadata:
  name: payments-db-migrate
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "-5"                     # lower runs first
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers: [ { name: migrate, image: "ghcr.io/acme/payments:3.8.1", args: ["migrate", "up"] } ]</pre>
<p>נקודות ה-hook: <code>pre/post-install</code>, <code>pre/post-upgrade</code>, <code>pre/post-delete</code>, <code>pre/post-rollback</code>, <code>test</code>. Helm מחכה ש-Jobs של hook יסתיימו. hook של pre-upgrade שנכשל מכשיל את ה-upgrade לפני שאף manifest של האפליקציה משתנה. משאבי hook <em>לא</em> נספרים כחלק מה-release, אז בלי delete policy הם נערמים (והריצה הבאה נכשלת עם "already exists").</p>
<p><strong>Dependencies</strong> מוגדרים ב-Chart.yaml. <code>helm dependency update</code> מוריד אותם ל-<code>charts/</code> וכותב <code>Chart.lock</code>. מדליקים/מכבים עם <code>condition</code>, מעבירים values תחת השם של ה-subchart, ומשתפים values דרך <code>global:</code>.</p>
<p><strong>OCI registries</strong> הם היום הדרך הסטנדרטית להפיץ charts – אותם ECR/ACR/GAR/GHCR/Harbor שמשמשים ל-images:</p>
<pre>helm package ./payments                         # payments-1.14.2.tgz
helm push payments-1.14.2.tgz oci://ghcr.io/acme/charts
helm upgrade --install payments oci://ghcr.io/acme/charts/payments --version 1.14.2
helm show values oci://ghcr.io/acme/charts/payments --version 1.14.2</pre>`
      }
    },
    {
      h: { en: "Debugging Helm, 'another operation is in progress', helmfile, Kustomize", he: "דיבאג ל-Helm, 'another operation is in progress', helmfile ו-Kustomize" },
      body: {
        en: `<p><strong>Debug ladder</strong>, cheapest first:</p>
<ol>
<li><code>helm lint ./payments -f values/prod.yaml</code> — syntax, schema, best practices.</li>
<li><code>helm template payments ./payments -f values/prod.yaml --debug</code> — render locally, no cluster. <code>--show-only templates/deployment.yaml</code> to focus.</li>
<li><code>helm upgrade --install ... --dry-run=server</code> — render <em>and</em> validate against the live API server (CRDs exist? admission webhooks pass? <code>lookup</code> works).</li>
<li><code>helm diff upgrade payments ./payments -f values/prod.yaml</code> (helm-diff plugin) — the exact change a PR would make. Put it in CI.</li>
<li><code>helm get manifest|values|hooks payments --revision 12</code> — what was <em>actually</em> applied.</li>
</ol>
<p><strong>"Error: UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress"</strong> — a previous run was killed mid-flight (CI job cancelled, timeout) and the latest release Secret is stuck in <code>pending-upgrade</code>/<code>pending-install</code>. Fix:</p>
<pre>helm history payments -n payments           # last row: pending-upgrade
helm rollback payments &lt;last-deployed-rev&gt; -n payments
# if there is no good revision (stuck first install):
kubectl delete secret -n payments sh.helm.release.v1.payments.v13   # the pending one only</pre>
<p><strong>helmfile</strong> manages many releases declaratively: one <code>helmfile.yaml</code> lists releases, repos, per-environment values, and dependencies (<code>needs:</code>); <code>helmfile diff</code> / <code>helmfile apply</code> run only what changed. Great for bootstrapping a cluster's add-ons (ingress, cert-manager, KEDA, Karpenter) — though many teams now let Argo CD own that.</p>
<table>
<tr><th></th><th>Helm</th><th>Kustomize</th></tr>
<tr><td>Model</td><td>Templates + values</td><td>Plain YAML + overlays/patches</td></tr>
<tr><td>Packaging & versions</td><td>Yes (charts, OCI, SemVer)</td><td>No (git refs)</td></tr>
<tr><td>Release state / rollback</td><td>Yes (Secrets, history)</td><td>No (kubectl/GitOps does it)</td></tr>
<tr><td>Best for</td><td>Distributing software to others</td><td>Tweaking your own manifests per env</td></tr>
</table>
<p>They combine: Argo CD and <code>kustomize --enable-helm</code> can inflate a chart, then patch it.</p>`,
        he: `<p><strong>סולם הדיבאג</strong>, מהזול ליקר:</p>
<ol>
<li><code>helm lint ./payments -f values/prod.yaml</code> – syntax, schema, best practices.</li>
<li><code>helm template payments ./payments -f values/prod.yaml --debug</code> – רינדור מקומי, בלי cluster. עם <code>--show-only templates/deployment.yaml</code> כדי להתמקד.</li>
<li><code>helm upgrade --install ... --dry-run=server</code> – רינדור <em>וגם</em> ולידציה מול ה-API server החי (ה-CRDs קיימים? ה-admission webhooks עוברים? <code>lookup</code> עובד).</li>
<li><code>helm diff upgrade payments ./payments -f values/prod.yaml</code> (plugin של helm-diff) – השינוי המדויק ש-PR יעשה. שמים את זה ב-CI.</li>
<li><code>helm get manifest|values|hooks payments --revision 12</code> – מה <em>באמת</em> הוחל.</li>
</ol>
<p><strong>"Error: UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress"</strong> – ריצה קודמת נהרגה באמצע (job ב-CI בוטל, timeout), וה-Secret של ה-release האחרון תקוע ב-<code>pending-upgrade</code>/<code>pending-install</code>. תיקון:</p>
<pre>helm history payments -n payments           # last row: pending-upgrade
helm rollback payments &lt;last-deployed-rev&gt; -n payments
# if there is no good revision (stuck first install):
kubectl delete secret -n payments sh.helm.release.v1.payments.v13   # the pending one only</pre>
<p><strong>helmfile</strong> מנהל הרבה releases בצורה דקלרטיבית: קובץ <code>helmfile.yaml</code> אחד מגדיר releases, repos, values לכל סביבה ותלויות (<code>needs:</code>), ו-<code>helmfile diff</code> / <code>helmfile apply</code> מריצים רק מה שהשתנה. מצוין ל-bootstrap של ה-add-ons של cluster (ingress, cert-manager, KEDA, Karpenter) – אם כי היום הרבה צוותים נותנים ל-Argo CD לנהל את זה.</p>
<table>
<tr><th></th><th>Helm</th><th>Kustomize</th></tr>
<tr><td>מודל</td><td>Templates + values</td><td>YAML רגיל + overlays/patches</td></tr>
<tr><td>אריזה וגרסאות</td><td>כן (charts, OCI, SemVer)</td><td>לא (git refs)</td></tr>
<tr><td>State של release / rollback</td><td>כן (Secrets, history)</td><td>לא (kubectl/GitOps עושים את זה)</td></tr>
<tr><td>הכי מתאים ל</td><td>להפיץ תוכנה לאחרים</td><td>להתאים manifests שלך לכל סביבה</td></tr>
</table>
<p>הם משתלבים: Argo CD ו-<code>kustomize --enable-helm</code> יכולים לרנדר chart ואז לעשות לו patch.</p>`
      }
    }
  ],
  diagram: `values precedence (low -> high):
  chart values.yaml -> parent/global -> -f a.yaml -> -f b.yaml -> --set

 Chart (.tgz / oci://)  +  values
          |
          v  helm template (Go templates + Sprig)
   rendered manifests
          |  helm upgrade --install --atomic --wait
          v
   API server  <---  pre-upgrade hook Job (db migrate) runs first
          |
          v
   Secret sh.helm.release.v1.payments.v12  (status: deployed)
   history: v10 superseded | v11 superseded | v12 deployed
   helm rollback payments 11  ==>  v13 (copy of v11)

   stuck?  vN = pending-upgrade  -> rollback / delete that Secret`,
  handsOn: [
    { cmd: "helm create payments && tree payments", what: { en: "Scaffold a chart and inspect the standard layout (Chart.yaml, values.yaml, templates/, _helpers.tpl, NOTES.txt).", he: "ליצור שלד של chart ולראות את המבנה הסטנדרטי (Chart.yaml, values.yaml, templates/, _helpers.tpl, NOTES.txt)." } },
    { cmd: "helm template payments ./payments -f values/prod.yaml --set image.tag=3.8.1 --debug --show-only templates/deployment.yaml", what: { en: "Render one template locally with your values to debug templating and indentation.", he: "לרנדר template אחד מקומית עם ה-values שלך כדי לדבג templating ואינדנטציה." } },
    { cmd: "helm lint ./payments -f values/prod.yaml --strict", what: { en: "Lint the chart against your real values; --strict turns warnings into failures for CI.", he: "לעשות lint ל-chart מול ה-values האמיתיים. --strict הופך warnings לכשלונות ב-CI." } },
    { cmd: "helm plugin install https://github.com/databus23/helm-diff && helm diff upgrade payments ./payments -n payments -f values/prod.yaml", what: { en: "Install helm-diff and preview exactly what an upgrade would change in the cluster.", he: "להתקין את helm-diff ולראות מראש מה בדיוק upgrade ישנה ב-cluster." } },
    { cmd: "helm upgrade --install payments ./payments -n payments --create-namespace -f values/prod.yaml --atomic --wait --timeout 10m", what: { en: "Idempotent CI deploy that waits for readiness and auto-rolls back on failure.", he: "deploy אידמפוטנטי ל-CI שמחכה ל-readiness ועושה rollback אוטומטי בכישלון." } },
    { cmd: "helm history payments -n payments && helm get values payments -n payments --revision 11", what: { en: "List revisions with status, then see the exact values a past revision used.", he: "לראות את רשימת ה-revisions עם status, ואז את ה-values המדויקים של revision ישן." } },
    { cmd: "kubectl get secrets -n payments -l owner=helm,name=payments -L status,version", what: { en: "See Helm's release Secrets and spot a stuck pending-upgrade revision.", he: "לראות את ה-Secrets של ה-releases של Helm ולמצוא revision שתקוע ב-pending-upgrade." } },
    { cmd: "helm push payments-1.14.2.tgz oci://ghcr.io/acme/charts", what: { en: "Publish a packaged chart to an OCI registry (log in first with helm registry login).", he: "לפרסם chart ארוז ל-OCI registry (קודם helm registry login)." } }
  ],
  mnemonic: {
    en: "\"Lint, Template, Dry-run, Diff\" before every upgrade (LTDD). And values precedence is \"defaults → files → set\": the later and more specific always wins.",
    he: "\"Lint, Template, Dry-run, Diff\" לפני כל upgrade (LTDD). וסדר העדיפויות של values הוא \"defaults ← קבצים ← set\": המאוחר והספציפי יותר תמיד מנצח."
  },
  pitfalls: [
    { en: "Expecting -f files to merge lists. Lists are replaced wholesale — an env-specific tolerations list silently drops the base ones. Use maps keyed by name where you can.", he: "לצפות שקבצי <code>-f</code> ימזגו lists. Lists מוחלפים בשלמותם – רשימת tolerations ספציפית לסביבה מעיפה בשקט את אלה מה-base. איפה שאפשר משתמשים ב-maps עם מפתח לפי שם." },
    { en: "Shipping CRDs in templates/. Helm installs CRDs in crds/ once and never upgrades or deletes them; CRDs in templates/ get deleted on uninstall along with every custom resource. Manage CRDs deliberately (separate chart or GitOps).", he: "לשים CRDs ב-templates/. Helm מתקין CRDs מתיקיית crds/ פעם אחת ואף פעם לא משדרג או מוחק אותם. CRDs ב-templates/ נמחקים ב-uninstall ביחד עם כל ה-custom resources. מנהלים CRDs בכוונה (chart נפרד או GitOps)." },
    { en: "Cancelling a CI job during helm upgrade. The release is left in pending-upgrade and every next deploy fails with 'another operation is in progress'. Use --atomic/--timeout and don't hard-kill.", he: "לבטל job ב-CI באמצע helm upgrade. ה-release נשאר ב-pending-upgrade וכל deploy אחרי זה נכשל עם 'another operation is in progress'. משתמשים ב-<code>--atomic</code>/<code>--timeout</code> ולא הורגים בכוח." },
    { en: "Putting secrets in values.yaml in Git or passing them with --set. They end up base64'd in release Secrets and in shell history. Use External Secrets/SOPS (helm-secrets) instead.", he: "לשים secrets ב-values.yaml ב-Git או להעביר אותם עם <code>--set</code>. הם נשמרים ב-base64 בתוך ה-Secrets של ה-release ובהיסטוריית ה-shell. משתמשים ב-External Secrets או SOPS (helm-secrets)." }
  ],
  interview: [
    {
      q: { en: "Where does Helm 3 store release state, and how does rollback work?", he: "איפה Helm 3 שומר את ה-state של release, ואיך rollback עובד?" },
      a: { en: "There's no Tiller anymore; each revision is a Secret (sh.helm.release.v1.NAME.vN) in the release's namespace containing the rendered manifest, values and chart metadata, gzipped and base64'd. rollback N renders nothing new: it takes revision N's stored manifest, applies it with a three-way merge against the live state, and records it as a new revision. history-max limits how many Secrets are kept.", he: "כבר אין Tiller. כל revision הוא Secret (sh.helm.release.v1.NAME.vN) ב-namespace של ה-release, שמכיל את ה-manifest המרונדר, ה-values וה-metadata של ה-chart, ב-gzip ו-base64. rollback N לא מרנדר כלום מחדש: הוא לוקח את ה-manifest השמור של revision N, מחיל אותו עם three-way merge מול ה-state החי, ורושם את זה כ-revision חדש. history-max מגביל כמה Secrets נשמרים." }
    },
    {
      q: { en: "Your pipeline fails with 'another operation is in progress'. What happened and how do you fix it safely?", he: "ה-pipeline נכשל עם 'another operation is in progress'. מה קרה ואיך מתקנים בבטחה?" },
      a: { en: "A previous helm operation was interrupted, leaving the latest release Secret in a pending-* status, which Helm treats as a lock. Check helm history; if a deployed revision exists, helm rollback to it (this clears the lock and returns to known-good). For a stuck first install, delete only the pending release Secret (or uninstall). Then prevent it: --atomic, sane --timeout, serialize deploys per release in CI.", he: "פעולת helm קודמת נקטעה והשאירה את ה-Secret של ה-release האחרון בסטטוס pending-*, ש-Helm מתייחס אליו כמו נעילה. בודקים helm history; אם יש revision במצב deployed, עושים helm rollback אליו (זה משחרר את הנעילה ומחזיר למצב תקין). בהתקנה ראשונה שנתקעה, מוחקים רק את ה-Secret של ה-pending (או uninstall). ואז מונעים: <code>--atomic</code>, <code>--timeout</code> הגיוני, ו-deploys סדרתיים לכל release ב-CI." }
    },
    {
      q: { en: "Helm or Kustomize?", he: "Helm או Kustomize?" },
      a: { en: "Helm when you need to package and version something configurable for many consumers (third-party apps, an internal platform chart used by 50 services), with hooks and release history. Kustomize when you own the YAML and need small per-environment differences without a templating language. In GitOps setups the cluster state lives in Git and Argo CD/Flux handle rollback, so many teams use upstream Helm charts plus Kustomize overlays for their own apps.", he: "Helm כשצריך לארוז ולתת גרסאות למשהו קונפיגורבילי להרבה צרכנים (אפליקציות צד שלישי, chart פלטפורמה פנימי שמשמש 50 שירותים), עם hooks והיסטוריית releases. Kustomize כשה-YAML שלך ואתה צריך הבדלים קטנים בין סביבות בלי שפת templates. בסביבות GitOps ה-state של ה-cluster יושב ב-Git ו-Argo CD/Flux מטפלים ב-rollback, אז הרבה צוותים משתמשים ב-Helm charts מ-upstream ו-Kustomize overlays לאפליקציות שלהם." }
    }
  ],
  quiz: [
    {
      q: { en: "helm upgrade -f base.yaml -f prod.yaml --set replicaCount=5. base sets 2, prod sets 3. Result?", he: "helm upgrade -f base.yaml -f prod.yaml --set replicaCount=5. ב-base יש 2, ב-prod יש 3. מה התוצאה?" },
      options: [
        { en: "2", he: "2" },
        { en: "3", he: "3" },
        { en: "5", he: "5" },
        { en: "Error: conflicting values", he: "שגיאה: values סותרים" }
      ],
      answer: 2,
      explain: { en: "--set beats all files; among files, the last -f wins. Chart defaults are lowest.", he: "<code>--set</code> גובר על כל הקבצים. בין הקבצים, ה-<code>-f</code> האחרון מנצח. ה-defaults של ה-chart הכי נמוכים." }
    },
    {
      q: { en: "What does --atomic add to helm upgrade?", he: "מה <code>--atomic</code> מוסיף ל-helm upgrade?" },
      options: [
        { en: "It locks the namespace so nobody else can deploy", he: "נועל את ה-namespace כך שאף אחד אחר לא יכול לעשות deploy" },
        { en: "It waits for readiness and automatically rolls back if the upgrade fails or times out", he: "מחכה ל-readiness ועושה rollback אוטומטי אם ה-upgrade נכשל או נגמר ב-timeout" },
        { en: "It applies all manifests in a single etcd transaction", he: "מחיל את כל ה-manifests בטרנזקציה אחת של etcd" },
        { en: "It skips hooks", he: "מדלג על hooks" }
      ],
      answer: 1,
      explain: { en: "Kubernetes has no multi-object transactions. --atomic implies --wait and triggers a rollback on failure (renamed --rollback-on-failure in Helm 4).", he: "ב-Kubernetes אין טרנזקציות על כמה אובייקטים. <code>--atomic</code> כולל <code>--wait</code> ומפעיל rollback בכישלון (ב-Helm 4 השם הוא <code>--rollback-on-failure</code>)." }
    },
    {
      q: { en: "Which command validates rendered manifests against the live cluster's API (CRDs, admission) without changing anything?", he: "איזו פקודה בודקת manifests מרונדרים מול ה-API של ה-cluster החי (CRDs, admission) בלי לשנות כלום?" },
      options: [
        { en: "helm template", he: "helm template" },
        { en: "helm lint", he: "helm lint" },
        { en: "helm upgrade --install --dry-run=server", he: "helm upgrade --install --dry-run=server" },
        { en: "helm get manifest", he: "helm get manifest" }
      ],
      answer: 2,
      explain: { en: "template and lint are fully offline. --dry-run=server sends the objects to the API server in dry-run mode, so schemas, CRDs and admission webhooks are checked.", he: "template ו-lint עובדים לגמרי offline. <code>--dry-run=server</code> שולח את האובייקטים ל-API server במצב dry-run, אז נבדקים schemas, CRDs ו-admission webhooks." }
    },
    {
      q: { en: "You ran helm rollback payments 11 while at revision 12. What is the new current revision number?", he: "הרצת helm rollback payments 11 כשהיית ב-revision 12. מה מספר ה-revision הנוכחי החדש?" },
      options: [
        { en: "13", he: "13" },
        { en: "12", he: "12" },
        { en: "11", he: "11" },
        { en: "10", he: "10" }
      ],
      answer: 0,
      explain: { en: "Rollback creates a new revision (13) whose content equals revision 11. History is append-only.", he: "Rollback יוצר revision חדש (13) שהתוכן שלו זהה ל-revision 11. ההיסטוריה היא append-only." }
    }
  ],
  related: ["k8s-helm-gitops", "k8s-argocd"]
});

// ---------------------------------------------------------------------------
// 24. Argo CD in depth
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-argocd",
  track: "kubernetes",
  order: 24,
  icon: "🐙",
  level: 3,
  minutes: 17,
  title: { en: "Argo CD in Depth: Applications, Sync, ApplicationSets & Troubleshooting", he: "Argo CD לעומק: Applications, Sync, ApplicationSets ופתרון תקלות" },
  tldr: {
    en: "Argo CD continuously compares what Git says with what the cluster has, shows Sync and Health status per resource, and — with automated sync, prune and self-heal — makes the cluster converge on Git, across many apps and clusters.",
    he: "Argo CD משווה כל הזמן בין מה ש-Git אומר לבין מה שיש ב-cluster, מציג סטטוס Sync ו-Health לכל משאב, ועם automated sync, prune ו-self-heal גורם ל-cluster להתכנס למה שב-Git – על פני הרבה אפליקציות ו-clusters."
  },
  analogy: {
    en: "Argo CD is a building inspector who carries the architect's blueprints (Git). Every few minutes she walks through the building (the cluster) and marks each room: matches the blueprint (Synced) or not (OutOfSync), and whether the room actually works — lights on, water running (Healthy) or not (Degraded). With self-heal on, she doesn't just write a report: if a tenant knocked down a wall without a permit, she rebuilds it that afternoon. The only way to change the building is to change the blueprints.",
    he: "Argo CD היא מפקחת בנייה שמחזיקה את התוכניות של האדריכל (Git). כל כמה דקות היא עוברת בבניין (ה-cluster) ומסמנת כל חדר: תואם לתוכנית (Synced) או לא (OutOfSync), והאם החדר באמת עובד – יש חשמל, יש מים (Healthy) או לא (Degraded). עם self-heal היא לא רק כותבת דוח: אם דייר הפיל קיר בלי היתר, היא בונה אותו מחדש עוד באותו יום. הדרך היחידה לשנות את הבניין היא לשנות את התוכניות."
  },
  sections: [
    {
      h: { en: "The Application CRD and sync policy", he: "ה-CRD של Application ו-sync policy" },
      body: {
        en: `<p>Argo CD runs in the cluster as: <strong>repo-server</strong> (clones Git, renders Helm/Kustomize/plain YAML), <strong>application-controller</strong> (compares desired vs live, syncs), <strong>argocd-server</strong> (UI/API/SSO), plus Redis and the ApplicationSet controller. Each unit of deployment is an <code>Application</code>:</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payments-prod
  namespace: argocd
  finalizers: [ resources-finalizer.argocd.argoproj.io ]   # delete app =&gt; delete its resources
spec:
  project: payments
  source:
    repoURL: https://github.com/acme/deploy.git
    targetRevision: main
    path: apps/payments/overlays/prod          # Kustomize detected automatically
    # helm: { valueFiles: [values-prod.yaml] } # for a chart path / chart repo
  destination:
    name: prod-eu-1                            # a registered cluster
    namespace: payments
  syncPolicy:
    automated:
      prune: true        # delete resources removed from Git
      selfHeal: true     # revert manual kubectl edits
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
      - PruneLast=true
    retry: { limit: 5, backoff: { duration: 10s, factor: 2, maxDuration: 3m } }
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers: [ /spec/replicas ]         # HPA owns replicas</pre>
<ul>
<li>Argo CD polls Git every ~3 minutes by default; configure a <strong>Git webhook</strong> for near-instant syncs.</li>
<li><strong>automated</strong> alone syncs new commits. <strong>prune</strong> deletes what you removed from Git (off by default — safety). <strong>selfHeal</strong> re-syncs when the <em>cluster</em> drifts, not just when Git changes.</li>
</ul>`,
        he: `<p>Argo CD רץ בתוך ה-cluster כ: <strong>repo-server</strong> (עושה clone ל-Git, מרנדר Helm/Kustomize/YAML רגיל), <strong>application-controller</strong> (משווה desired מול live ועושה sync), <strong>argocd-server</strong> (UI/API/SSO), ועוד Redis וה-ApplicationSet controller. כל יחידת deploy היא <code>Application</code>:</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payments-prod
  namespace: argocd
  finalizers: [ resources-finalizer.argocd.argoproj.io ]   # delete app =&gt; delete its resources
spec:
  project: payments
  source:
    repoURL: https://github.com/acme/deploy.git
    targetRevision: main
    path: apps/payments/overlays/prod          # Kustomize detected automatically
    # helm: { valueFiles: [values-prod.yaml] } # for a chart path / chart repo
  destination:
    name: prod-eu-1                            # a registered cluster
    namespace: payments
  syncPolicy:
    automated:
      prune: true        # delete resources removed from Git
      selfHeal: true     # revert manual kubectl edits
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
      - PruneLast=true
    retry: { limit: 5, backoff: { duration: 10s, factor: 2, maxDuration: 3m } }
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers: [ /spec/replicas ]         # HPA owns replicas</pre>
<ul>
<li>Argo CD עושה polling ל-Git כל ~3 דקות כברירת מחדל. מגדירים <strong>Git webhook</strong> בשביל sync כמעט מיידי.</li>
<li><strong>automated</strong> לבד עושה sync לקומיטים חדשים. <strong>prune</strong> מוחק מה שהוצאת מ-Git (כבוי כברירת מחדל – בטיחות). <strong>selfHeal</strong> עושה sync מחדש כשה-<em>cluster</em> זז מה-state, לא רק כש-Git משתנה.</li>
</ul>`
      }
    },
    {
      h: { en: "Sync vs Health, sync waves and hooks", he: "Sync מול Health, sync waves ו-hooks" },
      body: {
        en: `<p>Two independent statuses, often confused:</p>
<ul>
<li><strong>Sync status</strong> — does live match Git? <code>Synced</code> / <code>OutOfSync</code>.</li>
<li><strong>Health status</strong> — is it working? <code>Healthy</code>, <code>Progressing</code> (rollout in progress, LB not ready), <code>Degraded</code> (e.g. Deployment exceeded progressDeadlineSeconds, Pods crash-looping), <code>Suspended</code>, <code>Missing</code>, <code>Unknown</code>. Built-in checks exist for core kinds; CRDs need a custom Lua health check or they are always "Healthy".</li>
</ul>
<p>An app can be Synced + Degraded (you deployed a broken image exactly as Git says) or OutOfSync + Healthy (someone scaled it by hand).</p>
<p><strong>Ordering</strong> within one sync: phases <code>PreSync → Sync → PostSync</code> (and <code>SyncFail</code>), and within each phase <strong>sync waves</strong> from low to high. Argo CD waits for each wave to be <em>healthy</em> before starting the next:</p>
<pre>metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"          # namespaces, CRDs, secrets first
---
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation,HookSucceeded
---
# PostSync hook: smoke test / Slack notification</pre>
<blockquote>💡 Real world: Argo CD renders Helm charts with <code>helm template</code> and applies them itself — so <code>helm list</code> shows nothing and Helm hooks are mapped to Argo hooks (<code>pre-install</code> → PreSync, etc.). Don't run <code>helm upgrade</code> by hand on an Argo-managed app; self-heal will undo it.</blockquote>`,
        he: `<p>שני סטטוסים בלתי תלויים, שהרבה מבלבלים ביניהם:</p>
<ul>
<li><strong>Sync status</strong> – האם ה-live תואם ל-Git? <code>Synced</code> / <code>OutOfSync</code>.</li>
<li><strong>Health status</strong> – האם זה עובד? <code>Healthy</code>, <code>Progressing</code> (rollout באמצע, LB עוד לא מוכן), <code>Degraded</code> (למשל Deployment שעבר את progressDeadlineSeconds, Pods ב-crash loop), <code>Suspended</code>, <code>Missing</code>, <code>Unknown</code>. יש בדיקות מובנות ל-kinds הבסיסיים; CRDs צריכים health check מותאם ב-Lua, אחרת הם תמיד "Healthy".</li>
</ul>
<p>אפליקציה יכולה להיות Synced + Degraded (עשית deploy ל-image שבור בדיוק כמו ש-Git אומר) או OutOfSync + Healthy (מישהו עשה scale ידני).</p>
<p><strong>סדר</strong> בתוך sync אחד: phases של <code>PreSync → Sync → PostSync</code> (ועוד <code>SyncFail</code>), ובתוך כל phase – <strong>sync waves</strong> מהנמוך לגבוה. Argo CD מחכה שכל wave יהיה <em>healthy</em> לפני שהוא מתחיל את הבא:</p>
<pre>metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"          # namespaces, CRDs, secrets first
---
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation,HookSucceeded
---
# PostSync hook: smoke test / Slack notification</pre>
<blockquote>💡 מהשטח: Argo CD מרנדר Helm charts עם <code>helm template</code> ומחיל אותם בעצמו – לכן <code>helm list</code> לא מראה כלום, ו-Helm hooks ממופים ל-Argo hooks (<code>pre-install</code> → PreSync וכו'). אל תריץ <code>helm upgrade</code> ידנית על אפליקציה שמנוהלת ע"י Argo – ה-self-heal יבטל את זה.</blockquote>`
      }
    },
    {
      h: { en: "App-of-apps vs ApplicationSet, multi-cluster, projects", he: "App-of-apps מול ApplicationSet, multi-cluster ו-projects" },
      body: {
        en: `<p><strong>App-of-apps</strong>: one root Application points to a folder full of Application manifests. Simple and explicit, but you still hand-write one file per app per cluster. <strong>ApplicationSet</strong> generates Applications from a template plus <em>generators</em>:</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: platform-addons, namespace: argocd }
spec:
  goTemplate: true
  generators:
    - matrix:
        generators:
          - git:
              repoURL: https://github.com/acme/platform.git
              revision: main
              directories: [ { path: "addons/*" } ]           # one per add-on folder
          - clusters:
              selector: { matchLabels: { env: prod } }        # every prod cluster
  template:
    metadata: { name: "{{.path.basename}}-{{.name}}" }
    spec:
      project: platform
      source: { repoURL: https://github.com/acme/platform.git, targetRevision: main, path: "{{.path.path}}" }
      destination: { server: "{{.server}}", namespace: "{{.path.basename}}" }
      syncPolicy: { automated: { prune: true, selfHeal: true }, syncOptions: [CreateNamespace=true] }</pre>
<p>Generators: <strong>list</strong>, <strong>clusters</strong> (registered clusters, by label), <strong>git</strong> (directories or JSON/YAML files), <strong>matrix</strong> (cartesian product), <strong>merge</strong>, <strong>scmProvider</strong> (every repo in a GitHub org), <strong>pullRequest</strong> (preview environments per PR). Add a new cluster with label <code>env=prod</code> and it gets all 12 add-ons automatically.</p>
<p><strong>Multi-cluster</strong>: <code>argocd cluster add &lt;kube-context&gt;</code> stores credentials as a Secret labelled <code>argocd.argoproj.io/secret-type: cluster</code>. Hub-and-spoke (one Argo CD, many clusters) gives one pane of glass; one Argo CD per cluster limits blast radius. <strong>AppProjects</strong> are the multi-tenancy boundary: allowed source repos, destination clusters/namespaces, and which cluster-scoped kinds a team may create. RBAC in <code>argocd-rbac-cm</code> maps SSO groups to roles:</p>
<pre>p, role:payments-dev, applications, sync, payments/*, allow
p, role:payments-dev, applications, get,  payments/*, allow
g, acme:payments-team, role:payments-dev</pre>`,
        he: `<p><strong>App-of-apps</strong>: Application אחד (root) מצביע על תיקייה מלאה ב-manifests של Applications. פשוט ומפורש, אבל עדיין כותבים ביד קובץ לכל אפליקציה בכל cluster. <strong>ApplicationSet</strong> מייצר Applications מתוך template ו-<em>generators</em>:</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: platform-addons, namespace: argocd }
spec:
  goTemplate: true
  generators:
    - matrix:
        generators:
          - git:
              repoURL: https://github.com/acme/platform.git
              revision: main
              directories: [ { path: "addons/*" } ]           # one per add-on folder
          - clusters:
              selector: { matchLabels: { env: prod } }        # every prod cluster
  template:
    metadata: { name: "{{.path.basename}}-{{.name}}" }
    spec:
      project: platform
      source: { repoURL: https://github.com/acme/platform.git, targetRevision: main, path: "{{.path.path}}" }
      destination: { server: "{{.server}}", namespace: "{{.path.basename}}" }
      syncPolicy: { automated: { prune: true, selfHeal: true }, syncOptions: [CreateNamespace=true] }</pre>
<p>Generators: <strong>list</strong>, <strong>clusters</strong> (clusters רשומים, לפי label), <strong>git</strong> (תיקיות או קבצי JSON/YAML), <strong>matrix</strong> (מכפלה קרטזית), <strong>merge</strong>, <strong>scmProvider</strong> (כל repo בארגון GitHub), <strong>pullRequest</strong> (סביבת preview לכל PR). מוסיפים cluster חדש עם label <code>env=prod</code> והוא מקבל את כל 12 ה-add-ons אוטומטית.</p>
<p><strong>Multi-cluster</strong>: <code>argocd cluster add &lt;kube-context&gt;</code> שומר credentials כ-Secret עם ה-label <code>argocd.argoproj.io/secret-type: cluster</code>. Hub-and-spoke (Argo CD אחד, הרבה clusters) נותן מסך אחד לכל; Argo CD לכל cluster מקטין את ה-blast radius. <strong>AppProjects</strong> הם גבול ה-multi-tenancy: מאילו repos מותר למשוך, לאילו clusters/namespaces מותר לפרוס, ואילו kinds ברמת cluster צוות יכול ליצור. ה-RBAC ב-<code>argocd-rbac-cm</code> ממפה קבוצות SSO ל-roles:</p>
<pre>p, role:payments-dev, applications, sync, payments/*, allow
p, role:payments-dev, applications, get,  payments/*, allow
g, acme:payments-team, role:payments-dev</pre>`
      }
    },
    {
      h: { en: "Secrets and image updates in a GitOps world", he: "Secrets ועדכוני images בעולם של GitOps" },
      body: {
        en: `<p>Everything in Git — except plaintext secrets. Three mainstream patterns:</p>
<table>
<tr><th>Tool</th><th>What's in Git</th><th>How it becomes a Secret</th><th>Trade-off</th></tr>
<tr><td><strong>Sealed Secrets</strong></td><td><code>SealedSecret</code> encrypted with the cluster's public key (<code>kubeseal</code>)</td><td>In-cluster controller decrypts</td><td>Simple; per-cluster keys, rotation is manual</td></tr>
<tr><td><strong>External Secrets Operator</strong></td><td><code>ExternalSecret</code> = a pointer ("key prod/payments/db")</td><td>Operator fetches from AWS Secrets Manager / Vault / Azure Key Vault / GCP SM and syncs a Secret, refreshes on interval</td><td>Most common in 2025-2026; secret lives in a real vault with audit &amp; rotation</td></tr>
<tr><td><strong>SOPS</strong></td><td>YAML with values encrypted by KMS/age</td><td>Decrypted at render time (KSOPS, helm-secrets) in repo-server, or by Flux natively</td><td>Diffable; repo-server needs KMS access</td></tr>
</table>
<pre>apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: payments-db, namespace: payments }
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target: { name: payments-db }
  data:
    - secretKey: password
      remoteRef: { key: prod/payments/db, property: password }</pre>
<p><strong>Image updates</strong>: either CI commits the new tag to the deploy repo (most common, fully auditable), or <strong>Argo CD Image Updater</strong> watches a registry, picks the newest tag by strategy (semver, newest-build, digest) and writes it back to Git (or as a parameter override). Write-back to Git keeps Git the source of truth.</p>
<blockquote>⚠️ Production tip: avoid plugins that inject secrets <em>while rendering manifests</em> (e.g. argocd-vault-plugin): the plaintext lands in repo-server's cache and in the UI's diff. Prefer ESO, where Argo CD only ever sees a pointer.</blockquote>`,
        he: `<p>הכול ב-Git – חוץ מ-secrets בטקסט גלוי. שלושה דפוסים מרכזיים:</p>
<table>
<tr><th>כלי</th><th>מה יש ב-Git</th><th>איך זה הופך ל-Secret</th><th>Trade-off</th></tr>
<tr><td><strong>Sealed Secrets</strong></td><td><code>SealedSecret</code> מוצפן במפתח הציבורי של ה-cluster (<code>kubeseal</code>)</td><td>controller בתוך ה-cluster מפענח</td><td>פשוט; מפתחות לכל cluster, רוטציה ידנית</td></tr>
<tr><td><strong>External Secrets Operator</strong></td><td><code>ExternalSecret</code> = מצביע ("key prod/payments/db")</td><td>ה-operator מושך מ-AWS Secrets Manager / Vault / Azure Key Vault / GCP SM, מסנכרן ל-Secret ומרענן כל interval</td><td>הנפוץ ביותר ב-2025-2026; ה-secret יושב ב-vault אמיתי עם audit ורוטציה</td></tr>
<tr><td><strong>SOPS</strong></td><td>YAML שהערכים בו מוצפנים עם KMS/age</td><td>מפוענח בזמן רינדור (KSOPS, helm-secrets) ב-repo-server, או נייטיב ב-Flux</td><td>אפשר לעשות diff; ה-repo-server צריך גישה ל-KMS</td></tr>
</table>
<pre>apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: payments-db, namespace: payments }
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target: { name: payments-db }
  data:
    - secretKey: password
      remoteRef: { key: prod/payments/db, property: password }</pre>
<p><strong>עדכוני images</strong>: או שה-CI עושה commit ל-tag החדש ב-deploy repo (הכי נפוץ, עם audit מלא), או ש-<strong>Argo CD Image Updater</strong> עוקב אחרי registry, בוחר את ה-tag החדש לפי אסטרטגיה (semver, newest-build, digest) וכותב אותו חזרה ל-Git (או כ-parameter override). Write-back ל-Git שומר על Git כמקור האמת.</p>
<blockquote>⚠️ טיפ לפרודקשן: להימנע מ-plugins שמזריקים secrets <em>בזמן רינדור ה-manifests</em> (כמו argocd-vault-plugin): הטקסט הגלוי נוחת ב-cache של ה-repo-server וב-diff של ה-UI. עדיף ESO, שבו Argo CD רואה רק מצביע.</blockquote>`
      }
    },
    {
      h: { en: "Troubleshooting and Argo CD vs Flux", he: "פתרון תקלות ו-Argo CD מול Flux" },
      body: {
        en: `<ul>
<li><strong>OutOfSync forever, yet sync "succeeds"</strong> — something mutates the object after apply: a mutating webhook (Istio injection), defaulted fields, an HPA changing replicas, a controller adding annotations. Inspect with <code>argocd app diff</code>; fix with <code>ignoreDifferences</code> (+ <code>RespectIgnoreDifferences=true</code>) or <code>ServerSideApply=true</code>.</li>
<li><strong>ComparisonError / Unknown</strong> — the repo-server can't render: bad Helm values, missing chart repo credentials, Kustomize error. The message is in <code>argocd app get</code>; reproduce locally with <code>helm template</code>/<code>kustomize build</code>.</li>
<li><strong>Degraded</strong> — drill into the unhealthy child: usually a Deployment past its progress deadline (CrashLoopBackOff, ImagePullBackOff). Argo is the messenger; debug the Pod.</li>
<li><strong>Stuck Progressing</strong> — an Ingress/Service waiting for a load balancer address, or a CRD with a custom health check that never reports healthy.</li>
<li><strong>Sync stuck "Running"</strong> — a hook Job that never finishes, or a wave waiting on an unhealthy resource. <code>argocd app terminate-op</code>, fix, re-sync.</li>
<li><strong>App won't delete</strong> — its <code>resources-finalizer</code> is waiting on a resource that itself has a stuck finalizer. Fix the child; remove the finalizer only as a last resort.</li>
<li><strong>Webhook not firing</strong> — <code>argocd app get --refresh</code> (or <code>--hard-refresh</code> to bypass the manifest cache).</li>
</ul>
<table>
<tr><th></th><th>Argo CD</th><th>Flux</th></tr>
<tr><td>Model</td><td>Application CRD, central controller + rich UI</td><td>Toolkit of controllers: GitRepository/OCIRepository, Kustomization, HelmRelease</td></tr>
<tr><td>Helm</td><td>Renders with helm template; no Helm releases</td><td>Real Helm releases via helm-controller (helm history works)</td></tr>
<tr><td>Multi-tenancy</td><td>AppProjects + SSO RBAC</td><td>Kubernetes RBAC / service account impersonation per Kustomization</td></tr>
<tr><td>Fleet</td><td>ApplicationSet generators</td><td>Kustomize overlays + per-cluster Flux bootstrap</td></tr>
<tr><td>Image automation</td><td>Image Updater (add-on)</td><td>Built-in image reflector/automation controllers</td></tr>
<tr><td>Typical fit</td><td>Platform teams wanting a UI and self-service</td><td>Git-only, CLI-driven, lightweight per-cluster setups</td></tr>
</table>`,
        he: `<ul>
<li><strong>OutOfSync לנצח, למרות שה-sync "מצליח"</strong> – משהו משנה את האובייקט אחרי ה-apply: mutating webhook (הזרקה של Istio), שדות שמקבלים default, HPA שמשנה replicas, controller שמוסיף annotations. בודקים עם <code>argocd app diff</code>, ומתקנים עם <code>ignoreDifferences</code> (+ <code>RespectIgnoreDifferences=true</code>) או <code>ServerSideApply=true</code>.</li>
<li><strong>ComparisonError / Unknown</strong> – ה-repo-server לא מצליח לרנדר: values שבורים ב-Helm, חסרים credentials ל-chart repo, שגיאת Kustomize. ההודעה מופיעה ב-<code>argocd app get</code>; משחזרים מקומית עם <code>helm template</code>/<code>kustomize build</code>.</li>
<li><strong>Degraded</strong> – נכנסים לילד הלא-בריא: בדרך כלל Deployment שעבר את ה-progress deadline (CrashLoopBackOff, ImagePullBackOff). Argo רק השליח – מדבגים את ה-Pod.</li>
<li><strong>תקוע ב-Progressing</strong> – Ingress/Service שמחכה לכתובת של load balancer, או CRD עם health check מותאם שאף פעם לא מדווח healthy.</li>
<li><strong>Sync תקוע ב-"Running"</strong> – hook Job שלא נגמר, או wave שמחכה למשאב לא בריא. <code>argocd app terminate-op</code>, מתקנים, ועושים sync שוב.</li>
<li><strong>אפליקציה לא נמחקת</strong> – ה-<code>resources-finalizer</code> שלה מחכה למשאב שבעצמו תקוע על finalizer. מתקנים את הילד; מורידים את ה-finalizer רק כמוצא אחרון.</li>
<li><strong>ה-webhook לא עובד</strong> – <code>argocd app get --refresh</code> (או <code>--hard-refresh</code> כדי לעקוף את ה-cache של ה-manifests).</li>
</ul>
<table>
<tr><th></th><th>Argo CD</th><th>Flux</th></tr>
<tr><td>מודל</td><td>CRD של Application, controller מרכזי ו-UI עשיר</td><td>ערכת controllers: GitRepository/OCIRepository, Kustomization, HelmRelease</td></tr>
<tr><td>Helm</td><td>מרנדר עם helm template, בלי Helm releases</td><td>Helm releases אמיתיים דרך helm-controller (helm history עובד)</td></tr>
<tr><td>Multi-tenancy</td><td>AppProjects + RBAC עם SSO</td><td>RBAC של Kubernetes / impersonation של service account לכל Kustomization</td></tr>
<tr><td>צי clusters</td><td>generators של ApplicationSet</td><td>Kustomize overlays + bootstrap של Flux לכל cluster</td></tr>
<tr><td>אוטומציית images</td><td>Image Updater (תוסף)</td><td>controllers מובנים של image reflector/automation</td></tr>
<tr><td>מתאים ל</td><td>צוותי פלטפורמה שרוצים UI ו-self-service</td><td>הקמות קלות, Git-only ו-CLI, לכל cluster בנפרד</td></tr>
</table>`
      }
    }
  ],
  diagram: `   dev --PR--> Git (deploy repo) --webhook / poll ~3m--+
                                                      v
 +---------------------------- argocd ns -----------------------------+
 | repo-server: clone + helm template / kustomize build               |
 |        | desired manifests                                         |
 |        v                                                           |
 | application-controller: diff(desired, live)                        |
 |    Sync:  Synced | OutOfSync      Health: Healthy|Progressing|Degraded
 |    sync: PreSync hooks -> wave -1 -> wave 0 -> wave 1 -> PostSync  |
 +--------+-----------------------------+-----------------------------+
          | apply (SSA)                 | apply
          v                             v
   cluster prod-eu-1              cluster prod-us-1   (ApplicationSet:
   selfHeal reverts kubectl edit                        clusters x addons)`,
  handsOn: [
    { cmd: "argocd login argocd.example.com --sso && argocd app list -o wide", what: { en: "Log in via SSO and list every Application with sync status, health, project and destination.", he: "להתחבר עם SSO ולראות את כל ה-Applications עם sync status, health, project ו-destination." } },
    { cmd: "argocd app get payments-prod --refresh --show-operation", what: { en: "Force a Git refresh and show the per-resource tree, conditions and the current sync operation.", he: "לכפות refresh מ-Git ולראות את עץ המשאבים, ה-conditions ופעולת ה-sync הנוכחית." } },
    { cmd: "argocd app diff payments-prod", what: { en: "Show the exact diff between Git and live — the first step for 'why is it OutOfSync?'.", he: "להציג את ה-diff המדויק בין Git ל-live – הצעד הראשון ל'למה זה OutOfSync?'." } },
    { cmd: "argocd app sync payments-prod --prune --timeout 300", what: { en: "Trigger a sync manually, deleting resources that were removed from Git.", he: "להפעיל sync ידני, כולל מחיקת משאבים שהוסרו מ-Git." } },
    { cmd: "argocd app history payments-prod && argocd app rollback payments-prod 41", what: { en: "List previous syncs with Git revisions and roll back to one (automated sync must be disabled first).", he: "לראות את ה-syncs הקודמים עם ה-revisions ב-Git ולעשות rollback לאחד מהם (צריך לכבות automated sync קודם)." } },
    { cmd: "argocd app terminate-op payments-prod", what: { en: "Abort a sync stuck on a hook or a wave that never becomes healthy.", he: "לעצור sync שתקוע על hook או על wave שלא נהיה healthy." } },
    { cmd: "kubectl get applications,applicationsets -n argocd", what: { en: "See Argo CD objects as plain Kubernetes resources (useful without the CLI or UI).", he: "לראות את האובייקטים של Argo CD כמשאבי Kubernetes רגילים (שימושי בלי CLI או UI)." } },
    { cmd: "kubectl logs -n argocd deploy/argocd-repo-server --tail=100 | grep -i error", what: { en: "Find rendering errors (Helm/Kustomize, repo auth) behind ComparisonError.", he: "למצוא שגיאות רינדור (Helm/Kustomize, auth ל-repo) שעומדות מאחורי ComparisonError." } }
  ],
  mnemonic: {
    en: "\"Sync = same as Git, Health = actually works\" — two different questions. And the automated trio: Automated (follow Git), Prune (delete what Git deleted), Self-heal (undo what humans did): APS.",
    he: "\"Sync = זהה ל-Git, Health = באמת עובד\" – שתי שאלות שונות. והשלישייה האוטומטית: Automated (לעקוב אחרי Git), Prune (למחוק מה ש-Git מחק), Self-heal (לבטל מה שבני אדם עשו): APS."
  },
  pitfalls: [
    { en: "Leaving spec.replicas in Git with an HPA and selfHeal on. Argo resets replicas every sync and the HPA scales again — endless churn. Remove the field or ignoreDifferences on /spec/replicas.", he: "להשאיר spec.replicas ב-Git כשיש HPA ו-selfHeal דולק. Argo מאפס את ה-replicas בכל sync וה-HPA מגדיל שוב – churn אינסופי. מוחקים את השדה או מגדירים ignoreDifferences על /spec/replicas." },
    { en: "Turning on prune for an app whose path was accidentally emptied or mis-pointed (wrong targetRevision). Argo will happily delete everything. Protect critical resources with the Prune=false sync option and review ApplicationSet changes carefully.", he: "להדליק prune לאפליקציה שה-path שלה התרוקן בטעות או מצביע למקום לא נכון (targetRevision שגוי). Argo ימחק הכול בשמחה. מגינים על משאבים קריטיים עם sync option של Prune=false, ובודקים בזהירות שינויים ב-ApplicationSet." },
    { en: "Deleting an Application without understanding its finalizer. With resources-finalizer, all workloads are deleted too; without it, they're orphaned. Know which you want before kubectl delete application.", he: "למחוק Application בלי להבין את ה-finalizer שלו. עם resources-finalizer – כל ה-workloads נמחקים גם. בלעדיו – הם נשארים יתומים. תדע מה אתה רוצה לפני kubectl delete application." },
    { en: "Giving every team the default project. It allows any repo, any cluster, any namespace, including cluster-scoped kinds — one Application can overwrite another team's namespace. Create an AppProject per team.", he: "לתת לכל הצוותים את ה-project של default. הוא מרשה כל repo, כל cluster, כל namespace, כולל kinds ברמת cluster – Application אחד יכול לדרוס namespace של צוות אחר. יוצרים AppProject לכל צוות." }
  ],
  interview: [
    {
      q: { en: "What's the difference between Sync status and Health status? Give an example of each mismatch.", he: "מה ההבדל בין Sync status ל-Health status? תן דוגמה לכל סוג של אי-התאמה." },
      a: { en: "Sync compares live objects with the rendered Git manifests; Health evaluates whether the resources are functioning (Deployment available, Pods running, LB provisioned). Synced + Degraded: you committed a bad image tag, live matches Git exactly but Pods crash. OutOfSync + Healthy: someone kubectl-scaled a Deployment; it works but differs from Git — selfHeal would revert it.", he: "Sync משווה בין האובייקטים החיים ל-manifests המרונדרים מ-Git. Health בודק אם המשאבים מתפקדים (Deployment זמין, Pods רצים, LB הוקם). Synced + Degraded: עשית commit ל-tag שבור – ה-live זהה ל-Git אבל ה-Pods קורסים. OutOfSync + Healthy: מישהו עשה kubectl scale ל-Deployment – זה עובד אבל שונה מ-Git, ו-selfHeal יחזיר את זה." }
    },
    {
      q: { en: "How would you deploy 15 platform add-ons to 30 clusters with Argo CD?", he: "איך היית פורס 15 add-ons של פלטפורמה ל-30 clusters עם Argo CD?" },
      a: { en: "An ApplicationSet with a matrix generator: a git directories generator over addons/* crossed with a clusters generator selecting by labels (env, region). Per-cluster values come from cluster Secret labels/annotations or a git files generator. Use sync waves for ordering (CRDs and cert-manager before dependents), an AppProject for platform, progressive rollout across clusters (ApplicationSet progressive syncs or separate sets per env), and ESO for secrets.", he: "ApplicationSet עם matrix generator: git directories generator על addons/* כפול clusters generator שבוחר לפי labels (env, region). values לכל cluster מגיעים מ-labels/annotations של ה-Secret של ה-cluster או מ-git files generator. משתמשים ב-sync waves לסדר (CRDs ו-cert-manager לפני מי שתלוי בהם), AppProject לפלטפורמה, פריסה הדרגתית בין clusters (progressive syncs של ApplicationSet או sets נפרדים לכל סביבה), ו-ESO בשביל secrets." }
    },
    {
      q: { en: "An app is OutOfSync right after every successful sync. How do you debug it?", he: "אפליקציה חוזרת ל-OutOfSync מיד אחרי כל sync מוצלח. איך מדבגים?" },
      a: { en: "Run argocd app diff to see which fields differ. Typically a mutating admission webhook, API-server defaulting, an HPA/VPA, or another controller writes to fields that are also in Git. Either stop managing the field in Git, add ignoreDifferences (with RespectIgnoreDifferences so sync doesn't overwrite it), or enable ServerSideApply so field ownership is respected.", he: "מריצים argocd app diff כדי לראות אילו שדות שונים. בדרך כלל זה mutating admission webhook, defaults של ה-API server, HPA/VPA או controller אחר שכותב לשדות שנמצאים גם ב-Git. או שמפסיקים לנהל את השדה ב-Git, או מוסיפים ignoreDifferences (עם RespectIgnoreDifferences כדי שה-sync לא ידרוס), או מפעילים ServerSideApply כדי שה-field ownership יכובד." }
    }
  ],
  quiz: [
    {
      q: { en: "Someone runs kubectl edit on a Deployment managed by Argo CD with automated sync but selfHeal: false. What happens?", he: "מישהו מריץ kubectl edit על Deployment שמנוהל ע\"י Argo CD עם automated sync אבל selfHeal: false. מה קורה?" },
      options: [
        { en: "Argo CD reverts it within seconds", he: "Argo CD מחזיר את זה תוך שניות" },
        { en: "The app shows OutOfSync; the change stays until the next Git commit triggers a sync", he: "האפליקציה מוצגת כ-OutOfSync, והשינוי נשאר עד שקומיט חדש ב-Git יפעיל sync" },
        { en: "Argo CD deletes the Deployment", he: "Argo CD מוחק את ה-Deployment" },
        { en: "The edit is rejected by Argo CD's webhook", he: "ה-edit נדחה ע\"י webhook של Argo CD" }
      ],
      answer: 1,
      explain: { en: "Automated sync reacts to Git changes. Only selfHeal reacts to live drift. Argo CD has no admission webhook blocking edits by default.", he: "Automated sync מגיב לשינויים ב-Git. רק selfHeal מגיב ל-drift ב-live. ל-Argo CD אין כברירת מחדל admission webhook שחוסם edits." }
    },
    {
      q: { en: "Resources in sync-wave \"-1\", \"0\" and \"5\". In what order are they applied?", he: "משאבים ב-sync-wave \"-1\", \"0\" ו-\"5\". באיזה סדר הם מוחלים?" },
      options: [
        { en: "5, 0, -1", he: "5, 0, -1" },
        { en: "-1, 0, 5 — each wave waits for the previous to be healthy", he: "-1, 0, 5 – כל wave מחכה שהקודם יהיה healthy" },
        { en: "All in parallel; waves only affect deletion", he: "הכול במקביל; waves משפיעים רק על מחיקה" },
        { en: "Alphabetically by kind", he: "לפי סדר אלפביתי של kind" }
      ],
      answer: 1,
      explain: { en: "Lower waves go first, and Argo CD waits for health before the next wave. On pruning/deletion the order is reversed.", he: "Waves נמוכים קודם, ו-Argo CD מחכה ל-health לפני ה-wave הבא. במחיקה/prune הסדר הפוך." }
    },
    {
      q: { en: "Which ApplicationSet generator creates a preview environment for every open GitHub PR?", he: "איזה generator של ApplicationSet יוצר סביבת preview לכל PR פתוח ב-GitHub?" },
      options: [
        { en: "clusters", he: "clusters" },
        { en: "list", he: "list" },
        { en: "pullRequest", he: "pullRequest" },
        { en: "git directories", he: "git directories" }
      ],
      answer: 2,
      explain: { en: "The pullRequest generator polls the SCM for open PRs and exposes branch/number/sha to the template; the Application is removed when the PR closes.", he: "ה-pullRequest generator בודק ב-SCM אילו PRs פתוחים ומעביר branch/number/sha ל-template. ה-Application נמחק כשה-PR נסגר." }
    },
    {
      q: { en: "Why does helm list show nothing for a chart deployed by Argo CD?", he: "למה helm list לא מראה כלום עבור chart שנפרס ע\"י Argo CD?" },
      options: [
        { en: "Argo CD stores releases in a different namespace", he: "Argo CD שומר releases ב-namespace אחר" },
        { en: "It's a permissions issue with the helm CLI", he: "זו בעיית הרשאות של ה-helm CLI" },
        { en: "Helm releases are deleted after every sync", he: "Helm releases נמחקים אחרי כל sync" },
        { en: "Argo CD renders the chart with helm template and applies plain manifests itself", he: "Argo CD מרנדר את ה-chart עם helm template ומחיל manifests רגילים בעצמו" }
      ],
      answer: 3,
      explain: { en: "Argo CD uses Helm only as a renderer, so no release Secrets exist. Flux's helm-controller, by contrast, performs real Helm installs.", he: "Argo CD משתמש ב-Helm רק כ-renderer, אז אין Secrets של release. ה-helm-controller של Flux, לעומת זאת, עושה התקנות Helm אמיתיות." }
    }
  ],
  related: ["k8s-helm-gitops", "k8s-helm-deep", "k8s-argo-rollouts"]
});

// ---------------------------------------------------------------------------
// 25. Argo Rollouts: progressive delivery (+ Argo Workflows / Events)
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-argo-rollouts",
  track: "kubernetes",
  order: 25,
  icon: "🚦",
  level: 3,
  minutes: 16,
  title: { en: "Argo Rollouts: Canary, Blue-Green & Automated Analysis", he: "Argo Rollouts: Canary, Blue-Green ו-Analysis אוטומטי" },
  tldr: {
    en: "Argo Rollouts replaces the Deployment's all-or-nothing rolling update with stepped canary or blue-green releases that shift real traffic, query Prometheus at each step, and abort automatically when metrics go bad.",
    he: "Argo Rollouts מחליף את ה-rolling update של Deployment (הכול או כלום) בשחרורי canary או blue-green בשלבים, שמזיזים טראפיק אמיתי, שואלים את Prometheus בכל שלב ועושים abort אוטומטי כשה-metrics מתקלקלים."
  },
  analogy: {
    en: "A new recipe in a restaurant chain. A Deployment's rolling update swaps the recipe in every branch one after another and hopes. A canary serves the new dish to 5% of customers, has a food critic (AnalysisTemplate) check the complaint rate for 10 minutes, then 25%, 50%, 100% — and if complaints spike, every branch instantly goes back to the old menu. Blue-green cooks the full new menu in a second kitchen, lets the staff taste it (preview service), then flips which kitchen serves the dining room.",
    he: "מתכון חדש ברשת מסעדות. rolling update של Deployment מחליף את המתכון בכל סניף אחד אחרי השני ומקווה לטוב. Canary מגיש את המנה החדשה ל-5% מהלקוחות, שולח מבקר אוכל (AnalysisTemplate) לבדוק את כמות התלונות 10 דקות, ואז 25%, 50%, 100% – ואם התלונות קופצות, כל הסניפים חוזרים מיד לתפריט הישן. Blue-green מבשל את כל התפריט החדש במטבח שני, נותן לצוות לטעום (preview service), ואז מחליף איזה מטבח משרת את האולם."
  },
  sections: [
    {
      h: { en: "Why Deployments aren't enough", he: "למה Deployment לא מספיק" },
      body: {
        en: `<p>A Deployment's <code>RollingUpdate</code> only knows <em>readiness</em>. If the new version passes its readiness probe but returns 3% HTTP 500s, or doubles p99 latency, Kubernetes happily rolls it to 100%. There's no pause for observation, no traffic percentage independent of Pod count, and no automatic rollback based on business metrics.</p>
<p><strong>Argo Rollouts</strong> adds a <code>Rollout</code> CRD (a drop-in replacement for Deployment — same Pod template — or a <code>workloadRef</code> pointing at an existing Deployment) and a controller that manages two ReplicaSets, <em>stable</em> and <em>canary</em>, through explicit steps:</p>
<ul>
<li><strong>Canary</strong> — gradually shift a percentage of traffic to the new version, pausing and analysing between steps.</li>
<li><strong>Blue-green</strong> — run the full new version side by side, test it via a preview Service, then switch all traffic at once (fast rollback by switching back).</li>
<li><strong>Analysis</strong> — <code>AnalysisTemplate</code>s run queries against Prometheus, Datadog, CloudWatch, New Relic, Wavefront, a web endpoint or a Kubernetes Job, and decide pass/fail.</li>
</ul>
<p>Without a traffic router, canary weight is approximated by replica ratio (1 of 10 Pods ≈ 10%). With a <strong>traffic router</strong> (NGINX Ingress, Istio, AWS ALB, Traefik, Gateway API via plugin, SMI) you get precise weights — 1% traffic with 2 canary Pods — and header-based routing for internal testers.</p>
<blockquote>💡 Real world: the payoff is MTTR. A bad release that would have hit 100% of users for 20 minutes now hits 5% for 2 minutes, and the rollback happens before a human even opens the dashboard.</blockquote>`,
        he: `<p>ה-<code>RollingUpdate</code> של Deployment מכיר רק <em>readiness</em>. אם הגרסה החדשה עוברת את ה-readiness probe אבל מחזירה 3% של HTTP 500, או מכפילה את ה-p99 latency, Kubernetes ימשיך בשמחה עד 100%. אין עצירה לתצפית, אין אחוז טראפיק שלא תלוי במספר ה-Pods, ואין rollback אוטומטי לפי metrics עסקיים.</p>
<p><strong>Argo Rollouts</strong> מוסיף CRD בשם <code>Rollout</code> (תחליף ישיר ל-Deployment – אותו Pod template – או <code>workloadRef</code> שמצביע על Deployment קיים) ו-controller שמנהל שני ReplicaSets, <em>stable</em> ו-<em>canary</em>, דרך שלבים מפורשים:</p>
<ul>
<li><strong>Canary</strong> – מעבירים בהדרגה אחוז מהטראפיק לגרסה החדשה, עם עצירות וניתוח בין השלבים.</li>
<li><strong>Blue-green</strong> – מריצים את הגרסה החדשה במלואה לצד הישנה, בודקים אותה דרך preview Service, ואז מעבירים את כל הטראפיק בבת אחת (rollback מהיר = להחליף בחזרה).</li>
<li><strong>Analysis</strong> – <code>AnalysisTemplate</code>-ים מריצים queries מול Prometheus, Datadog, CloudWatch, New Relic, Wavefront, web endpoint או Kubernetes Job, ומחליטים pass/fail.</li>
</ul>
<p>בלי traffic router, ה-weight של ה-canary מוערך לפי יחס ה-replicas (Pod אחד מתוך 10 ≈ 10%). עם <strong>traffic router</strong> (NGINX Ingress, Istio, AWS ALB, Traefik, Gateway API דרך plugin, SMI) מקבלים weights מדויקים – 1% מהטראפיק עם 2 Pods של canary – ו-routing לפי headers לבודקים פנימיים.</p>
<blockquote>💡 מהשטח: התמורה היא MTTR. שחרור גרוע שהיה פוגע ב-100% מהמשתמשים במשך 20 דקות פוגע עכשיו ב-5% למשך 2 דקות, וה-rollback קורה לפני שבן אדם בכלל פתח את ה-dashboard.</blockquote>`
      }
    },
    {
      h: { en: "Canary steps with traffic routing", he: "שלבי Canary עם traffic routing" },
      body: {
        en: `<pre>apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: checkout }
spec:
  replicas: 10
  revisionHistoryLimit: 3
  selector: { matchLabels: { app: checkout } }
  template:              # identical to a Deployment's Pod template
    metadata: { labels: { app: checkout } }
    spec: { containers: [ { name: app, image: ghcr.io/acme/checkout:4.2.0, ports: [ { containerPort: 8080 } ] } ] }
  strategy:
    canary:
      stableService: checkout-stable
      canaryService: checkout-canary
      trafficRouting:
        nginx: { stableIngress: checkout }       # controller creates checkout-canary ingress w/ weight
        # istio: { virtualService: { name: checkout, routes: [primary] } }
      analysis:                                   # background analysis for the whole rollout
        templates: [ { templateName: success-rate } ]
        startingStep: 1
        args: [ { name: service, value: checkout-canary } ]
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - setWeight: 25
        - pause: { duration: 10m }
        - analysis:                               # inline gate: must pass to continue
            templates: [ { templateName: p99-latency } ]
        - setWeight: 50
        - pause: {}                               # wait for a human: kubectl argo rollouts promote
        - setWeight: 100</pre>
<p>Flow: on a new image, Rollouts creates the canary ReplicaSet, sets ingress weight 5%, waits, and so on. Background analysis runs continuously from step 1; an inline <code>analysis</code> step blocks until its AnalysisRun completes. A <code>pause: {}</code> with no duration waits indefinitely for <code>promote</code>. If any analysis fails, the Rollout <strong>aborts</strong>: weight goes back to 0, the canary scales down, status becomes <code>Degraded</code>. The stable version never stopped serving.</p>
<p>With the <strong>Gateway API plugin</strong> (<code>argoproj-labs/gatewayAPI</code>) the router edits <code>HTTPRoute</code> backendRef weights — the forward-looking choice as Ingress NGINX is retired.</p>`,
        he: `<pre>apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: checkout }
spec:
  replicas: 10
  revisionHistoryLimit: 3
  selector: { matchLabels: { app: checkout } }
  template:              # identical to a Deployment's Pod template
    metadata: { labels: { app: checkout } }
    spec: { containers: [ { name: app, image: ghcr.io/acme/checkout:4.2.0, ports: [ { containerPort: 8080 } ] } ] }
  strategy:
    canary:
      stableService: checkout-stable
      canaryService: checkout-canary
      trafficRouting:
        nginx: { stableIngress: checkout }       # controller creates checkout-canary ingress w/ weight
        # istio: { virtualService: { name: checkout, routes: [primary] } }
      analysis:                                   # background analysis for the whole rollout
        templates: [ { templateName: success-rate } ]
        startingStep: 1
        args: [ { name: service, value: checkout-canary } ]
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - setWeight: 25
        - pause: { duration: 10m }
        - analysis:                               # inline gate: must pass to continue
            templates: [ { templateName: p99-latency } ]
        - setWeight: 50
        - pause: {}                               # wait for a human: kubectl argo rollouts promote
        - setWeight: 100</pre>
<p>הזרימה: כשמגיע image חדש, Rollouts יוצר את ה-ReplicaSet של ה-canary, שם weight של 5% ב-ingress, מחכה, וכן הלאה. ה-analysis ברקע רץ ברציפות משלב 1; שלב <code>analysis</code> inline חוסם עד שה-AnalysisRun שלו מסתיים. <code>pause: {}</code> בלי duration מחכה בלי הגבלה ל-<code>promote</code>. אם analysis כלשהו נכשל, ה-Rollout עושה <strong>abort</strong>: ה-weight חוזר ל-0, ה-canary יורד, והסטטוס הופך ל-<code>Degraded</code>. הגרסה היציבה לא הפסיקה לשרת לרגע.</p>
<p>עם <strong>ה-plugin של Gateway API</strong> (<code>argoproj-labs/gatewayAPI</code>) ה-router משנה את ה-weights של backendRef ב-<code>HTTPRoute</code> – הבחירה לעתיד, כש-Ingress NGINX יוצא לפנסיה.</p>`
      }
    },
    {
      h: { en: "AnalysisTemplate: turning metrics into a verdict", he: "AnalysisTemplate: להפוך metrics לפסק דין" },
      body: {
        en: `<pre>apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  args: [ { name: service } ]
  metrics:
    - name: success-rate
      interval: 1m             # measure every minute
      count: 10                # 10 measurements (background: until rollout ends if omitted)
      failureLimit: 2          # 3rd failed measurement =&gt; Failed =&gt; abort
      successCondition: result[0] &gt;= 0.99
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service}}",code!~"5.."}[2m]))
            /
            sum(rate(http_requests_total{service="{{args.service}}"}[2m]))</pre>
<ul>
<li>Each run creates an <strong>AnalysisRun</strong> with measurements: <code>Successful</code>, <code>Failed</code>, <code>Inconclusive</code> (neither condition matched — the Rollout pauses for a human), or <code>Error</code> (query failed; <code>consecutiveErrorLimit</code>, default 4).</li>
<li><strong>Compare canary to stable</strong>, not to a fixed number, when traffic varies: query both services and require <code>canary_error_rate &lt;= stable_error_rate * 1.2</code>. Or use <code>Experiment</code>s to spin up a baseline and canary with identical traffic.</li>
<li><strong>Low traffic is the enemy</strong>: at 5% of 20 RPS, the canary gets one request per second; two 500s look like a 3% error rate. Require a minimum request count in the query, or pause longer.</li>
<li><code>ClusterAnalysisTemplate</code> shares templates across namespaces; platform teams publish a standard "golden signals" gate.</li>
</ul>
<blockquote>⚠️ Production tip: test your failure path. Deploy a deliberately broken image (returns 500 on 10% of requests) to staging and verify the Rollout actually aborts. A typo in the PromQL that returns an empty vector makes <code>result[0]</code> error out — and nobody notices until the day it matters.</blockquote>`,
        he: `<pre>apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  args: [ { name: service } ]
  metrics:
    - name: success-rate
      interval: 1m             # measure every minute
      count: 10                # 10 measurements (background: until rollout ends if omitted)
      failureLimit: 2          # 3rd failed measurement =&gt; Failed =&gt; abort
      successCondition: result[0] &gt;= 0.99
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service}}",code!~"5.."}[2m]))
            /
            sum(rate(http_requests_total{service="{{args.service}}"}[2m]))</pre>
<ul>
<li>כל ריצה יוצרת <strong>AnalysisRun</strong> עם measurements: <code>Successful</code>, <code>Failed</code>, <code>Inconclusive</code> (אף תנאי לא התקיים – ה-Rollout נעצר לבן אדם), או <code>Error</code> (ה-query נכשל; <code>consecutiveErrorLimit</code>, ברירת מחדל 4).</li>
<li><strong>משווים canary ל-stable</strong>, ולא למספר קבוע, כשהטראפיק משתנה: שואלים את שני ה-services ודורשים <code>canary_error_rate &lt;= stable_error_rate * 1.2</code>. או משתמשים ב-<code>Experiment</code> כדי להרים baseline ו-canary עם טראפיק זהה.</li>
<li><strong>טראפיק נמוך הוא האויב</strong>: ב-5% מתוך 20 RPS, ה-canary מקבל request אחד בשנייה; שני 500 נראים כמו 3% שגיאות. דורשים מינימום requests ב-query, או מחכים יותר זמן.</li>
<li><code>ClusterAnalysisTemplate</code> משתף templates בין namespaces; צוותי פלטפורמה מפרסמים gate סטנדרטי של "golden signals".</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: תבדקו את מסלול הכישלון. עושים deploy ל-image שבור בכוונה (מחזיר 500 על 10% מה-requests) ב-staging ומוודאים שה-Rollout באמת עושה abort. שגיאת כתיב ב-PromQL שמחזירה vector ריק גורמת ל-<code>result[0]</code> להיכשל – ואף אחד לא שם לב עד היום שזה באמת חשוב.</blockquote>`
      }
    },
    {
      h: { en: "Blue-green, the kubectl plugin, and Flagger", he: "Blue-green, ה-plugin של kubectl ו-Flagger" },
      body: {
        en: `<pre>strategy:
  blueGreen:
    activeService: checkout            # production traffic
    previewService: checkout-preview   # testers / smoke tests hit the new version
    autoPromotionEnabled: false        # wait for promote
    prePromotionAnalysis:  { templates: [ { templateName: smoke-tests } ] }
    postPromotionAnalysis: { templates: [ { templateName: success-rate } ], args: [ { name: service, value: checkout } ] }
    scaleDownDelaySeconds: 600         # keep old (blue) Pods 10 min for instant rollback</pre>
<p>Blue-green needs 2× capacity during the release but makes the switch atomic — good for apps that can't run two versions under mixed traffic (schema-sensitive clients, websockets). The controller flips the Services' selectors to the new ReplicaSet's <code>rollouts-pod-template-hash</code>.</p>
<pre>kubectl argo rollouts get rollout checkout --watch     # live tree: steps, weights, analysis runs
kubectl argo rollouts promote checkout                 # continue past a pause
kubectl argo rollouts promote checkout --full          # skip remaining steps
kubectl argo rollouts abort checkout                   # back to stable, status Degraded
kubectl argo rollouts retry rollout checkout           # retry after an abort
kubectl argo rollouts undo checkout                    # roll back to previous revision
kubectl argo rollouts set image checkout app=ghcr.io/acme/checkout:4.2.1
kubectl argo rollouts dashboard                        # local UI on :3100</pre>
<p><strong>Flagger</strong> (Flux family, CNCF) is the main alternative. Instead of replacing your Deployment, you keep a normal Deployment and add a <code>Canary</code> resource; Flagger generates <code>-primary</code> and <code>-canary</code> copies, manages the mesh/ingress weights (Istio, Linkerd, App Mesh, NGINX, Contour, Gloo, Gateway API), and runs <code>MetricTemplate</code> checks plus webhooks (load tests). Choose Argo Rollouts if you're on Argo CD and want explicit step lists and its UI; Flagger if you're on Flux or want to keep stock Deployments.</p>`,
        he: `<pre>strategy:
  blueGreen:
    activeService: checkout            # production traffic
    previewService: checkout-preview   # testers / smoke tests hit the new version
    autoPromotionEnabled: false        # wait for promote
    prePromotionAnalysis:  { templates: [ { templateName: smoke-tests } ] }
    postPromotionAnalysis: { templates: [ { templateName: success-rate } ], args: [ { name: service, value: checkout } ] }
    scaleDownDelaySeconds: 600         # keep old (blue) Pods 10 min for instant rollback</pre>
<p>Blue-green צריך פי 2 capacity בזמן השחרור, אבל ההחלפה אטומית – מתאים לאפליקציות שלא יכולות להריץ שתי גרסאות תחת טראפיק מעורב (clients רגישים ל-schema, websockets). ה-controller מחליף את ה-selectors של ה-Services ל-<code>rollouts-pod-template-hash</code> של ה-ReplicaSet החדש.</p>
<pre>kubectl argo rollouts get rollout checkout --watch     # live tree: steps, weights, analysis runs
kubectl argo rollouts promote checkout                 # continue past a pause
kubectl argo rollouts promote checkout --full          # skip remaining steps
kubectl argo rollouts abort checkout                   # back to stable, status Degraded
kubectl argo rollouts retry rollout checkout           # retry after an abort
kubectl argo rollouts undo checkout                    # roll back to previous revision
kubectl argo rollouts set image checkout app=ghcr.io/acme/checkout:4.2.1
kubectl argo rollouts dashboard                        # local UI on :3100</pre>
<p><strong>Flagger</strong> (ממשפחת Flux, CNCF) הוא האלטרנטיבה העיקרית. במקום להחליף את ה-Deployment, משאירים Deployment רגיל ומוסיפים משאב <code>Canary</code>; Flagger מייצר עותקים <code>-primary</code> ו-<code>-canary</code>, מנהל את ה-weights ב-mesh/ingress (Istio, Linkerd, App Mesh, NGINX, Contour, Gloo, Gateway API), ומריץ בדיקות <code>MetricTemplate</code> ועוד webhooks (load tests). בוחרים Argo Rollouts אם אתם על Argo CD ורוצים רשימת steps מפורשת וה-UI שלו; Flagger אם אתם על Flux או רוצים להשאיר Deployments רגילים.</p>`
      }
    },
    {
      h: { en: "The rest of the Argo family: Workflows and Events", he: "שאר משפחת Argo: Workflows ו-Events" },
      body: {
        en: `<p><strong>Argo Workflows</strong> is a Kubernetes-native workflow engine: each step runs as a Pod, steps form a sequence or a <strong>DAG</strong>, outputs pass between steps as parameters or artifacts (S3/GCS/MinIO). Used for CI pipelines, data processing and ML (Kubeflow Pipelines runs on it). Key objects: <code>Workflow</code>, reusable <code>WorkflowTemplate</code>, scheduled <code>CronWorkflow</code>.</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata: { generateName: train- }
spec:
  entrypoint: pipeline
  templates:
    - name: pipeline
      dag:
        tasks:
          - { name: extract,  template: run, arguments: { parameters: [ { name: cmd, value: extract } ] } }
          - { name: features, template: run, dependencies: [extract], arguments: { parameters: [ { name: cmd, value: features } ] } }
          - { name: train,    template: run, dependencies: [features], arguments: { parameters: [ { name: cmd, value: train } ] } }
          - { name: report,   template: run, dependencies: [extract], arguments: { parameters: [ { name: cmd, value: report } ] } }
    - name: run
      inputs: { parameters: [ { name: cmd } ] }
      container: { image: ghcr.io/acme/ml:1.9, args: ["{{inputs.parameters.cmd}}"] }</pre>
<p><strong>Argo Events</strong> is the trigger layer: an <code>EventSource</code> (GitHub webhook, SQS, Kafka, S3, cron, calendar) publishes to an <code>EventBus</code> (NATS JetStream), and a <code>Sensor</code> with dependencies and filters fires <em>triggers</em> — create a Workflow, a Job, an Argo Rollout, an HTTP call. Typical combo: "file lands in S3 → Sensor → Workflow DAG → results to a bucket".</p>
<p>So the family is: <strong>CD</strong> (what runs), <strong>Rollouts</strong> (how it's released), <strong>Workflows</strong> (jobs/pipelines), <strong>Events</strong> (what kicks things off).</p>`,
        he: `<p><strong>Argo Workflows</strong> הוא מנוע workflows נייטיב ל-Kubernetes: כל שלב רץ כ-Pod, השלבים יוצרים רצף או <strong>DAG</strong>, ו-outputs עוברים בין שלבים כ-parameters או artifacts (S3/GCS/MinIO). משמש ל-CI pipelines, עיבוד דאטה ו-ML (Kubeflow Pipelines רץ עליו). האובייקטים המרכזיים: <code>Workflow</code>, <code>WorkflowTemplate</code> לשימוש חוזר, ו-<code>CronWorkflow</code> מתוזמן.</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata: { generateName: train- }
spec:
  entrypoint: pipeline
  templates:
    - name: pipeline
      dag:
        tasks:
          - { name: extract,  template: run, arguments: { parameters: [ { name: cmd, value: extract } ] } }
          - { name: features, template: run, dependencies: [extract], arguments: { parameters: [ { name: cmd, value: features } ] } }
          - { name: train,    template: run, dependencies: [features], arguments: { parameters: [ { name: cmd, value: train } ] } }
          - { name: report,   template: run, dependencies: [extract], arguments: { parameters: [ { name: cmd, value: report } ] } }
    - name: run
      inputs: { parameters: [ { name: cmd } ] }
      container: { image: ghcr.io/acme/ml:1.9, args: ["{{inputs.parameters.cmd}}"] }</pre>
<p><strong>Argo Events</strong> היא שכבת הטריגרים: <code>EventSource</code> (GitHub webhook, SQS, Kafka, S3, cron, calendar) מפרסם ל-<code>EventBus</code> (NATS JetStream), ו-<code>Sensor</code> עם dependencies ו-filters מפעיל <em>triggers</em> – ליצור Workflow, Job, Argo Rollout או קריאת HTTP. שילוב טיפוסי: "קובץ נוחת ב-S3 → Sensor → DAG של Workflow → תוצאות ל-bucket".</p>
<p>אז המשפחה היא: <strong>CD</strong> (מה רץ), <strong>Rollouts</strong> (איך משחררים), <strong>Workflows</strong> (jobs/pipelines), <strong>Events</strong> (מה מתניע את הכול).</p>`
      }
    }
  ],
  diagram: `                      Ingress / VirtualService / HTTPRoute
 users ----------------->  weights:  stable 95%  |  canary 5%
                                 |                      |
                     checkout-stable svc        checkout-canary svc
                                 |                      |
                       RS stable (v4.1, 10)      RS canary (v4.2, 1)

 steps:  setWeight 5 -> pause 5m -> 25 -> pause 10m -> [analysis p99] -> 50 -> pause{} -> 100
                     \______ background AnalysisRun: success-rate every 1m ______/
                                         |
                       result[0] >= 0.99 ?  yes -> continue
                                            no x3 -> ABORT: weight 0, canary scaled down,
                                                     Rollout Degraded, stable untouched`,
  handsOn: [
    { cmd: "kubectl create namespace argo-rollouts && kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml", what: { en: "Install the Argo Rollouts controller and CRDs.", he: "להתקין את ה-controller וה-CRDs של Argo Rollouts." } },
    { cmd: "kubectl argo rollouts get rollout checkout --watch", what: { en: "Live view of a rollout: current step, canary weight, ReplicaSets and AnalysisRuns.", he: "תצוגה חיה של rollout: השלב הנוכחי, ה-weight של ה-canary, ה-ReplicaSets וה-AnalysisRuns." } },
    { cmd: "kubectl argo rollouts set image checkout app=ghcr.io/acme/checkout:4.2.1", what: { en: "Start a new canary by changing the image (in GitOps, commit the tag instead).", he: "להתחיל canary חדש ע\"י שינוי ה-image (ב-GitOps עושים commit ל-tag במקום)." } },
    { cmd: "kubectl argo rollouts promote checkout", what: { en: "Continue past an indefinite pause step (manual approval gate).", he: "להמשיך אחרי pause בלי הגבלת זמן (שער אישור ידני)." } },
    { cmd: "kubectl argo rollouts abort checkout && kubectl argo rollouts retry rollout checkout", what: { en: "Abort back to stable immediately; later retry the same revision after a fix.", he: "לעשות abort מיד חזרה ל-stable; אחר כך retry לאותו revision אחרי תיקון." } },
    { cmd: "kubectl get analysisruns -n default --sort-by=.metadata.creationTimestamp && kubectl describe analysisrun $(kubectl get analysisruns -o name | tail -1 | cut -d/ -f2)", what: { en: "Inspect the latest AnalysisRun's measurements to see exactly why a canary failed.", he: "לבדוק את ה-measurements של ה-AnalysisRun האחרון ולראות בדיוק למה canary נכשל." } },
    { cmd: "kubectl argo rollouts dashboard", what: { en: "Open the local Rollouts UI on http://localhost:3100.", he: "לפתוח את ה-UI המקומי של Rollouts ב-http://localhost:3100." } },
    { cmd: "argo submit -n argo --watch https://raw.githubusercontent.com/argoproj/argo-workflows/main/examples/dag-diamond.yaml", what: { en: "Run a sample Argo Workflows DAG and watch its steps execute as Pods.", he: "להריץ DAG לדוגמה של Argo Workflows ולצפות בשלבים רצים כ-Pods." } }
  ],
  mnemonic: {
    en: "\"Weigh, Wait, Weigh-in\": setWeight, pause, analysis — repeat until 100. Canary = dimmer switch, blue-green = light switch.",
    he: "\"מזיזים, מחכים, שוקלים\": setWeight, pause, analysis – וחוזר חלילה עד 100. Canary = דימר, blue-green = מתג."
  },
  pitfalls: [
    { en: "Analysing a canary that gets almost no traffic. At 5% of a low-RPS service, a single error is a huge percentage, or the query returns no data. Add a minimum-traffic condition and pause long enough.", he: "לנתח canary שכמעט לא מקבל טראפיק. ב-5% משירות עם RPS נמוך, שגיאה בודדת היא אחוז ענק, או שה-query לא מחזיר דאטה. מוסיפים תנאי של מינימום טראפיק ומחכים מספיק זמן." },
    { en: "Using a canary without a traffic router and expecting setWeight: 5 with 3 replicas. Rollouts can only approximate by Pod count, so 5% becomes 1 of 3 Pods ≈ 33%.", he: "להשתמש ב-canary בלי traffic router ולצפות ש-setWeight: 5 עם 3 replicas יעבוד. Rollouts יכול רק להעריך לפי מספר Pods, אז 5% הופך ל-Pod אחד מתוך 3 ≈ 33%." },
    { en: "Breaking DB schema compatibility. Canary and blue-green both run old and new versions at the same time against the same database; migrations must be backward compatible (expand/contract).", he: "לשבור תאימות של schema ב-DB. גם canary וגם blue-green מריצים גרסה ישנה וחדשה באותו זמן מול אותו DB; migrations חייבים להיות backward compatible (expand/contract)." },
    { en: "Letting Argo CD fight the Rollout. Argo CD needs to know Rollout health (built in) and should not manage the weights on the canary Ingress/VirtualService that the Rollouts controller mutates — ignoreDifferences on those fields.", he: "לתת ל-Argo CD להילחם ב-Rollout. Argo CD צריך להכיר את ה-health של Rollout (מובנה), ואסור לו לנהל את ה-weights ב-Ingress/VirtualService של ה-canary שה-controller של Rollouts משנה – ignoreDifferences על השדות האלה." }
  ],
  interview: [
    {
      q: { en: "How does Argo Rollouts decide to roll back a canary automatically?", he: "איך Argo Rollouts מחליט לעשות rollback אוטומטי ל-canary?" },
      a: { en: "Through AnalysisRuns created from AnalysisTemplates — either in the background during the whole rollout or as inline steps. Each metric runs a provider query (e.g. Prometheus success rate) every interval and evaluates successCondition/failureCondition. When failed measurements exceed failureLimit (or errors exceed consecutiveErrorLimit), the AnalysisRun fails, the Rollout aborts: traffic weight returns to 0, the canary ReplicaSet scales down, and the Rollout is marked Degraded while stable keeps serving.", he: "דרך AnalysisRuns שנוצרים מ-AnalysisTemplates – או ברקע לאורך כל ה-rollout או כשלבים inline. כל metric מריץ query מול provider (למשל success rate ב-Prometheus) כל interval ובודק successCondition/failureCondition. כשמספר ה-measurements שנכשלו עובר את failureLimit (או שהשגיאות עוברות את consecutiveErrorLimit), ה-AnalysisRun נכשל וה-Rollout עושה abort: ה-weight חוזר ל-0, ה-ReplicaSet של ה-canary יורד, וה-Rollout מסומן Degraded בזמן שה-stable ממשיך לשרת." }
    },
    {
      q: { en: "Canary or blue-green — when would you choose each?", he: "Canary או blue-green – מתי בוחרים כל אחד?" },
      a: { en: "Canary when you want to limit blast radius and validate with real traffic gradually, have enough traffic for statistical signal, and a traffic router for precise weights. Blue-green when the app can't tolerate mixed versions serving users simultaneously, you need a full pre-production test against the real environment, or you want an instant flip back — at the cost of 2× capacity during the release.", he: "Canary כשרוצים להגביל את ה-blast radius ולאמת בהדרגה עם טראפיק אמיתי, יש מספיק טראפיק לאות סטטיסטי, ויש traffic router ל-weights מדויקים. Blue-green כשהאפליקציה לא סובלת שתי גרסאות שמשרתות משתמשים במקביל, צריך בדיקה מלאה מול הסביבה האמיתית לפני החשיפה, או רוצים החלפה חזרה מיידית – במחיר של פי 2 capacity בזמן השחרור." }
    }
  ],
  quiz: [
    {
      q: { en: "What does a canary step <code>pause: {}</code> (no duration) do?", he: "מה עושה שלב canary של <code>pause: {}</code> (בלי duration)?" },
      options: [
        { en: "Pauses for the default 30 seconds", he: "עוצר ל-30 שניות של ברירת מחדל" },
        { en: "Waits indefinitely until someone runs promote", he: "מחכה בלי הגבלה עד שמישהו מריץ promote" },
        { en: "Skips to the next step immediately", he: "מדלג מיד לשלב הבא" },
        { en: "Aborts the rollout", he: "עושה abort ל-rollout" }
      ],
      answer: 1,
      explain: { en: "An empty pause is a manual gate: the Rollout stays Paused until kubectl argo rollouts promote (or the UI/API).", he: "pause ריק הוא שער ידני: ה-Rollout נשאר Paused עד kubectl argo rollouts promote (או דרך ה-UI/API)." }
    },
    {
      q: { en: "An AnalysisRun with failureLimit: 2 gets 3 failed measurements. Result?", he: "ל-AnalysisRun עם failureLimit: 2 יש 3 measurements שנכשלו. מה התוצאה?" },
      options: [
        { en: "Inconclusive; the Rollout continues", he: "Inconclusive; ה-Rollout ממשיך" },
        { en: "The AnalysisRun fails and the Rollout aborts back to stable", he: "ה-AnalysisRun נכשל וה-Rollout עושה abort חזרה ל-stable" },
        { en: "The Rollout pauses for 2 minutes and retries", he: "ה-Rollout עוצר ל-2 דקות ומנסה שוב" },
        { en: "Nothing until count is reached", he: "כלום עד שמגיעים ל-count" }
      ],
      answer: 1,
      explain: { en: "failureLimit is the number of failures tolerated; exceeding it fails the run immediately, which aborts the Rollout.", he: "failureLimit הוא מספר הכישלונות שנסבלים; חריגה ממנו מכשילה את הריצה מיד, וזה גורם ל-abort של ה-Rollout." }
    },
    {
      q: { en: "Without any traffic router, how does setWeight: 20 work on a 10-replica Rollout?", he: "בלי traffic router בכלל, איך setWeight: 20 עובד ב-Rollout עם 10 replicas?" },
      options: [
        { en: "It fails validation", he: "הוא נכשל בולידציה" },
        { en: "kube-proxy sends exactly 20% via iptables weights", he: "kube-proxy שולח בדיוק 20% דרך weights ב-iptables" },
        { en: "Traffic is split by request headers", he: "הטראפיק מתחלק לפי headers" },
        { en: "About 2 canary Pods and 8 stable Pods behind the same Service, so roughly 20%", he: "בערך 2 Pods של canary ו-8 של stable מאחורי אותו Service, אז בערך 20%" }
      ],
      answer: 3,
      explain: { en: "Basic canary approximates weight via replica counts behind one Service. Precise percentages and header routing require a traffic router.", he: "Canary בסיסי מעריך את ה-weight לפי מספר ה-replicas מאחורי Service אחד. אחוזים מדויקים ו-routing לפי headers דורשים traffic router." }
    },
    {
      q: { en: "Which tool keeps your normal Deployment and generates <code>-primary</code>/<code>-canary</code> copies?", he: "איזה כלי משאיר את ה-Deployment הרגיל שלך ומייצר עותקים של <code>-primary</code>/<code>-canary</code>?" },
      options: [
        { en: "Argo Rollouts", he: "Argo Rollouts" },
        { en: "Flagger", he: "Flagger" },
        { en: "Argo Workflows", he: "Argo Workflows" },
        { en: "KEDA", he: "KEDA" }
      ],
      answer: 1,
      explain: { en: "Flagger wraps a standard Deployment with a Canary CR. Argo Rollouts uses its own Rollout CRD (or workloadRef to a Deployment it scales to zero).", he: "Flagger עוטף Deployment רגיל עם Canary CR. Argo Rollouts משתמש ב-CRD משלו בשם Rollout (או workloadRef ל-Deployment שהוא מוריד ל-0)." }
    }
  ],
  related: ["rel-deployments", "k8s-argocd", "k8s-deployments"]
});

// ---------------------------------------------------------------------------
// 26. Kubernetes cost
// ---------------------------------------------------------------------------
window.INFRA.lessons.push({
  id: "k8s-cost",
  track: "kubernetes",
  order: 26,
  icon: "💸",
  level: 3,
  minutes: 15,
  title: { en: "Kubernetes Cost: Requests, Idle Capacity, OpenCost & Rightsizing", he: "עלויות ב-Kubernetes: Requests, Capacity בטל, OpenCost ו-Rightsizing" },
  tldr: {
    en: "You pay for nodes, nodes are sized by requests, not usage — so cost work is shrinking requests to reality (rightsizing), shrinking nodes to requests (bin-packing, consolidation), and buying the remaining capacity cheaper (spot, ARM, commitments).",
    he: "משלמים על nodes, וגודל ה-nodes נקבע לפי requests ולא לפי שימוש – אז עבודת עלויות היא לכווץ requests למציאות (rightsizing), לכווץ nodes ל-requests (bin-packing, consolidation), ולקנות את מה שנשאר בזול (spot, ARM, התחייבויות)."
  },
  analogy: {
    en: "A cluster is a hotel that charges by the room, not by how much you sleep. Every team books rooms (requests) 'just in case', so the hotel builds more floors (nodes). Most rooms sit empty at night (usage 20%), and half of each floor is never booked at all (idle capacity). Cutting the bill means three things: guests book only the rooms they use, the hotel closes empty floors, and the rest of the rooms are rented at last-minute prices (spot).",
    he: "Cluster הוא מלון שמחייב לפי חדר, לא לפי כמה ישנת. כל צוות מזמין חדרים (requests) 'ליתר ביטחון', אז המלון בונה עוד קומות (nodes). רוב החדרים ריקים בלילה (שימוש של 20%), וחצי מכל קומה בכלל לא מוזמן (capacity בטל). להוריד את החשבון זה שלושה דברים: אורחים מזמינים רק חדרים שהם משתמשים בהם, המלון סוגר קומות ריקות, ואת שאר החדרים משכירים במחירי הרגע האחרון (spot)."
  },
  sections: [
    {
      h: { en: "Requests drive cost, not usage", he: "Requests קובעים את העלות, לא השימוש" },
      body: {
        en: `<p>The scheduler places Pods by <strong>requests</strong>. The node autoscaler adds nodes when requests don't fit. The cloud bills you for <strong>nodes</strong>. Actual CPU usage barely enters the equation. Think in three layers:</p>
<pre>Provisioned  ████████████████████████████████  160 vCPU  (20 × m6i.2xlarge)  ≈ $5,600/mo on-demand
Requested    ████████████████████░░░░░░░░░░░░  100 vCPU  -&gt; 60 vCPU idle = slack (bin-packing problem)
Used         ██████░░░░░░░░░░░░░░░░░░░░░░░░░░   30 vCPU  -&gt; 70 vCPU unused requests (rightsizing problem)

Cluster efficiency = used / provisioned = 30/160 ≈ 19%   (typical industry range: 15-35%)</pre>
<ul>
<li><strong>Idle / slack capacity</strong> (provisioned − requested): fragments too small for any Pod, DaemonSet overhead, over-sized nodes, scale-down too conservative. Fixed by better bin-packing: Karpenter consolidation, fewer node shapes, right node sizes.</li>
<li><strong>Over-requesting</strong> (requested − used): a Pod requests 2 CPU "because the template said so" and uses 150m. Fixed by rightsizing requests.</li>
</ul>
<p>Memory works the same way, and is usually the binding constraint: a node "full" on memory requests at 40% CPU usage means you're paying for CPU nobody can schedule onto.</p>
<blockquote>💡 Real world: in most FinOps reviews, the biggest single lever is not spot or reservations — it's rightsizing requests. Halving requests on the 20 biggest Deployments routinely cuts 25-40% of node spend once consolidation removes the freed nodes.</blockquote>`,
        he: `<p>ה-scheduler ממקם Pods לפי <strong>requests</strong>. ה-node autoscaler מוסיף nodes כשה-requests לא נכנסים. הענן מחייב אותך על <strong>nodes</strong>. השימוש האמיתי ב-CPU כמעט לא נכנס למשוואה. חושבים בשלוש שכבות:</p>
<pre>Provisioned  ████████████████████████████████  160 vCPU  (20 × m6i.2xlarge)  ≈ $5,600/mo on-demand
Requested    ████████████████████░░░░░░░░░░░░  100 vCPU  -&gt; 60 vCPU idle = slack (bin-packing problem)
Used         ██████░░░░░░░░░░░░░░░░░░░░░░░░░░   30 vCPU  -&gt; 70 vCPU unused requests (rightsizing problem)

Cluster efficiency = used / provisioned = 30/160 ≈ 19%   (typical industry range: 15-35%)</pre>
<ul>
<li><strong>Capacity בטל / slack</strong> (provisioned פחות requested): שאריות קטנות מדי לכל Pod, overhead של DaemonSets, nodes גדולים מדי, scale-down שמרני מדי. מתקנים עם bin-packing טוב יותר: consolidation של Karpenter, פחות צורות של nodes, גדלי nodes נכונים.</li>
<li><strong>Over-requesting</strong> (requested פחות used): Pod מבקש 2 CPU "כי ככה היה ב-template" ומשתמש ב-150m. מתקנים עם rightsizing ל-requests.</li>
</ul>
<p>Memory עובד אותו דבר, ובדרך כלל הוא האילוץ שתוקע: node "מלא" ב-memory requests כשה-CPU על 40% אומר שאתה משלם על CPU שאי אפשר לשבץ עליו כלום.</p>
<blockquote>💡 מהשטח: ברוב סקירות ה-FinOps, המנוף הכי גדול הוא לא spot ולא reservations – אלא rightsizing של requests. חצייה של ה-requests ב-20 ה-Deployments הגדולים חותכת באופן קבוע 25-40% מהוצאות ה-nodes, ברגע שה-consolidation מוריד את ה-nodes שהתפנו.</blockquote>`
      }
    },
    {
      h: { en: "Measuring it: OpenCost, Kubecost and cloud-native allocation", he: "למדוד: OpenCost, Kubecost ו-allocation נייטיב של העננים" },
      body: {
        en: `<p>The cloud bill says "EC2: $48,210". Nobody can act on that. You need <strong>allocation</strong>: cost per namespace, team, Deployment.</p>
<ul>
<li><strong>OpenCost</strong> (CNCF incubating, open source) reads node prices from cloud pricing APIs (or your billing export for real discounts), joins with Prometheus usage data, and allocates each node's hourly cost to Pods by <code>max(request, usage)</code> for CPU, memory and GPU, plus PVs and load balancers. Idle cost is shown separately or spread across tenants.</li>
<li><strong>Kubecost</strong> (owned by IBM since 2024) is built on the same model and adds multi-cluster views, savings recommendations, alerts and budget reports.</li>
<li><strong>Cloud-native options</strong>: AWS split cost allocation data for EKS in the Cost and Usage Report, GKE cost allocation in billing export, AKS cost analysis add-on. Good for finance; less granular for engineers.</li>
</ul>
<pre># OpenCost API: cost per namespace for the last 7 days
kubectl port-forward -n opencost svc/opencost 9003:9003 &amp;
curl -s "http://localhost:9003/allocation/compute?window=7d&amp;aggregate=namespace&amp;accumulate=true" \
  | jq '.data[0] | to_entries[] | {ns: .key, cost: .value.totalCost, cpuEff: .value.cpuEfficiency}'</pre>
<p><strong>Showback</strong> (report cost per team) comes before <strong>chargeback</strong> (bill it to their budget). Both depend on consistent labels: enforce <code>team</code>, <code>app</code>, <code>env</code>, <code>cost-center</code> on every workload with an admission policy (Kyverno/Gatekeeper/ValidatingAdmissionPolicy), and aggregate by label in OpenCost.</p>
<blockquote>⚠️ Production tip: shared costs (system namespaces, monitoring, ingress, idle) can be 20-30% of the bill. Decide upfront how to split them — proportional to requests is the most defensible — or teams will argue about the report instead of reducing their spend.</blockquote>`,
        he: `<p>החשבון של הענן אומר "EC2: $48,210". אף אחד לא יכול לפעול על זה. צריך <strong>allocation</strong>: עלות לכל namespace, צוות, Deployment.</p>
<ul>
<li><strong>OpenCost</strong> (CNCF incubating, open source) קורא מחירי nodes מה-pricing APIs של הענן (או מה-billing export בשביל ההנחות האמיתיות), מצליב עם נתוני שימוש מ-Prometheus, ומחלק את העלות השעתית של כל node ל-Pods לפי <code>max(request, usage)</code> ל-CPU, memory ו-GPU, ועוד PVs ו-load balancers. עלות ה-idle מוצגת בנפרד או מתחלקת בין הדיירים.</li>
<li><strong>Kubecost</strong> (בבעלות IBM מאז 2024) בנוי על אותו מודל ומוסיף תצוגה של multi-cluster, המלצות חיסכון, התראות ודוחות תקציב.</li>
<li><strong>אופציות נייטיב של העננים</strong>: split cost allocation data ל-EKS ב-Cost and Usage Report של AWS, GKE cost allocation ב-billing export, ו-add-on של cost analysis ב-AKS. טוב לכספים, פחות גרנולרי למהנדסים.</li>
</ul>
<pre># OpenCost API: cost per namespace for the last 7 days
kubectl port-forward -n opencost svc/opencost 9003:9003 &amp;
curl -s "http://localhost:9003/allocation/compute?window=7d&amp;aggregate=namespace&amp;accumulate=true" \
  | jq '.data[0] | to_entries[] | {ns: .key, cost: .value.totalCost, cpuEff: .value.cpuEfficiency}'</pre>
<p><strong>Showback</strong> (לדווח עלות לכל צוות) בא לפני <strong>chargeback</strong> (לחייב את התקציב שלהם). שניהם תלויים ב-labels עקביים: אוכפים <code>team</code>, <code>app</code>, <code>env</code>, <code>cost-center</code> על כל workload עם admission policy (Kyverno/Gatekeeper/ValidatingAdmissionPolicy), ומקבצים לפי label ב-OpenCost.</p>
<blockquote>⚠️ טיפ לפרודקשן: עלויות משותפות (namespaces של מערכת, monitoring, ingress, idle) יכולות להיות 20-30% מהחשבון. מחליטים מראש איך מחלקים אותן – באופן יחסי ל-requests זה הכי קל להגן עליו – אחרת הצוותים יתווכחו על הדוח במקום להוריד הוצאות.</blockquote>`
      }
    },
    {
      h: { en: "Rightsizing requests with VPA recommendations", he: "Rightsizing ל-requests עם המלצות של VPA" },
      body: {
        en: `<p>Rightsizing is a loop, not a one-off: <strong>observe → recommend → apply via Git → verify → repeat monthly</strong>.</p>
<ol>
<li><strong>Observe</strong> at least 1-2 weeks including peak days. Use VPA in <code>Off</code> mode (or Goldilocks) for per-container recommendations, or PromQL directly:
<pre># p95 CPU usage per container over 14 days (cores)
quantile_over_time(0.95,
  rate(container_cpu_usage_seconds_total{namespace="shop",container!=""}[5m])[14d:5m])
# max memory working set over 14 days (bytes)
max_over_time(container_memory_working_set_bytes{namespace="shop",container!=""}[14d])</pre></li>
<li><strong>Recommend</strong>: CPU request ≈ p95 usage + 10-20% headroom; memory request = memory limit ≈ peak working set + 15-25%. For HPA-scaled services remember the HPA target is a % of the new request — retune it together.</li>
<li><strong>Apply via Git</strong>, a few services at a time, and watch throttling (<code>container_cpu_cfs_throttled_periods_total</code>), OOMKills and latency SLOs.</li>
</ol>
<p><strong>CPU limits</strong> are a cost/performance debate: many platform teams set CPU requests but no CPU limits (CPU is compressible; limits cause CFS throttling even on an idle node) while always setting memory limit = request. Others keep CPU limits for noisy-neighbor isolation in multi-tenant clusters. Either way, a <code>LimitRange</code> with default requests stops "no requests at all" Pods, which are both unbillable and dangerous.</p>
<blockquote>💡 Real world: Java services are the classic over-requesters: -Xmx sized for an old VM, 4 Gi requests, 900 Mi working set. Setting <code>-XX:MaxRAMPercentage=75</code> and letting the container memory request drive heap size often frees a third of a cluster's memory.</blockquote>`,
        he: `<p>Rightsizing זו לולאה, לא פעולה חד-פעמית: <strong>לצפות → להמליץ → להחיל דרך Git → לוודא → לחזור כל חודש</strong>.</p>
<ol>
<li><strong>לצפות</strong> לפחות שבוע-שבועיים, כולל ימי שיא. משתמשים ב-VPA במצב <code>Off</code> (או Goldilocks) להמלצות לכל קונטיינר, או ישירות ב-PromQL:
<pre># p95 CPU usage per container over 14 days (cores)
quantile_over_time(0.95,
  rate(container_cpu_usage_seconds_total{namespace="shop",container!=""}[5m])[14d:5m])
# max memory working set over 14 days (bytes)
max_over_time(container_memory_working_set_bytes{namespace="shop",container!=""}[14d])</pre></li>
<li><strong>להמליץ</strong>: CPU request ≈ p95 של השימוש + 10-20% מרווח. memory request = memory limit ≈ שיא ה-working set + 15-25%. בשירותים עם HPA זוכרים שה-target של ה-HPA הוא אחוז מה-request החדש – מכווננים את שניהם ביחד.</li>
<li><strong>להחיל דרך Git</strong>, כמה שירותים בכל פעם, ולעקוב אחרי throttling (<code>container_cpu_cfs_throttled_periods_total</code>), OOMKills ו-SLOs של latency.</li>
</ol>
<p><strong>CPU limits</strong> הם ויכוח של עלות מול ביצועים: הרבה צוותי פלטפורמה שמים CPU requests בלי CPU limits (CPU הוא compressible; limits גורמים ל-CFS throttling גם על node ריק), ותמיד שמים memory limit = request. אחרים משאירים CPU limits לבידוד מ-noisy neighbors ב-clusters עם הרבה דיירים. בכל מקרה, <code>LimitRange</code> עם requests דיפולטיים עוצר Pods "בלי requests בכלל", שגם אי אפשר לחייב עליהם וגם מסוכנים.</p>
<blockquote>💡 מהשטח: שירותי Java הם ה-over-requesters הקלאסיים: Xmx שנקבע ל-VM ישן, requests של 4 Gi ו-working set של 900 Mi. הגדרה של <code>-XX:MaxRAMPercentage=75</code> ולתת ל-memory request של הקונטיינר לקבוע את גודל ה-heap משחררת הרבה פעמים שליש מה-memory של cluster.</blockquote>`
      }
    },
    {
      h: { en: "Buying capacity cheaper: spot, consolidation, ARM, commitments", he: "לקנות capacity בזול: spot, consolidation, ARM והתחייבויות" },
      body: {
        en: `<ul>
<li><strong>Spot</strong> — 60-90% off on-demand, reclaimable with a 2-minute warning on AWS (about 30 seconds on GCP and Azure). Safe for stateless services with ≥2 replicas, a <strong>PodDisruptionBudget</strong>, <code>topologySpreadConstraints</code> across zones, fast startup and graceful shutdown; also for CI runners and batch. Not for single-replica databases or Kafka brokers.</li>
<li><strong>Diversify</strong> — spot pools dry up per instance type per AZ. A Karpenter NodePool allowing 30+ types uses AWS's price-capacity-optimized allocation and falls back to on-demand automatically when spot is unavailable.</li>
<li><strong>Consolidation</strong> — Karpenter's <code>WhenEmptyOrUnderutilized</code> continuously replaces half-empty nodes with fewer, cheaper ones. Combined with rightsizing it's where the savings materialize: smaller requests only save money once nodes are actually removed.</li>
<li><strong>ARM (Graviton / Ampere / Axion)</strong> — typically 20-40% better price-performance. Build multi-arch images (<code>docker buildx --platform linux/amd64,linux/arm64</code>) and let the NodePool allow both architectures.</li>
<li><strong>Commitments</strong> — Savings Plans / Reserved Instances / CUDs for the steady baseline (e.g. the 40% of capacity that never scales down), spot for the burst, on-demand for the rest.</li>
</ul>
<pre>apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: checkout }
spec:
  maxUnavailable: 1            # consolidation and spot drains go one Pod at a time
  selector: { matchLabels: { app: checkout } }</pre>
<blockquote>⚠️ Production tip: a PDB with <code>maxUnavailable: 0</code> (or <code>minAvailable</code> equal to replicas) blocks every drain forever: consolidation stops, node expiry stalls, upgrades hang. Audit for "impossible" PDBs with <code>kubectl get pdb -A</code> and look for <code>ALLOWED DISRUPTIONS 0</code>.</blockquote>`,
        he: `<ul>
<li><strong>Spot</strong> – 60-90% הנחה מ-on-demand, ויכולים לקחת אותו בחזרה עם התראה של 2 דקות ב-AWS (כ-30 שניות ב-GCP וב-Azure). בטוח לשירותים stateless עם לפחות 2 replicas, <strong>PodDisruptionBudget</strong>, <code>topologySpreadConstraints</code> בין zones, startup מהיר ו-graceful shutdown; וגם ל-CI runners ו-batch. לא ל-DB עם replica אחד ולא ל-Kafka brokers.</li>
<li><strong>לגוון</strong> – pools של spot מתייבשים לפי instance type ולפי AZ. NodePool של Karpenter שמרשה 30+ types משתמש ב-allocation של price-capacity-optimized של AWS ונופל אוטומטית ל-on-demand כשאין spot.</li>
<li><strong>Consolidation</strong> – ה-<code>WhenEmptyOrUnderutilized</code> של Karpenter מחליף ברציפות nodes חצי ריקים במעט nodes זולים יותר. ביחד עם rightsizing זה המקום שבו החיסכון קורה בפועל: requests קטנים יותר חוסכים כסף רק כש-nodes באמת יורדים.</li>
<li><strong>ARM (Graviton / Ampere / Axion)</strong> – בדרך כלל 20-40% יותר טוב ב-price-performance. בונים images ל-multi-arch (<code>docker buildx --platform linux/amd64,linux/arm64</code>) ונותנים ל-NodePool להרשות את שתי הארכיטקטורות.</li>
<li><strong>התחייבויות</strong> – Savings Plans / Reserved Instances / CUDs ל-baseline הקבוע (למשל ה-40% מה-capacity שאף פעם לא יורד), spot לקפיצות, ו-on-demand לשאר.</li>
</ul>
<pre>apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: checkout }
spec:
  maxUnavailable: 1            # consolidation and spot drains go one Pod at a time
  selector: { matchLabels: { app: checkout } }</pre>
<blockquote>⚠️ טיפ לפרודקשן: PDB עם <code>maxUnavailable: 0</code> (או <code>minAvailable</code> ששווה למספר ה-replicas) חוסם כל drain לנצח: ה-consolidation נעצר, ה-expiry של nodes נתקע, שדרוגים נתקעים. עושים audit ל-PDBs "בלתי אפשריים" עם <code>kubectl get pdb -A</code> ומחפשים <code>ALLOWED DISRUPTIONS 0</code>.</blockquote>`
      }
    },
    {
      h: { en: "Cluster cost anti-patterns", he: "Anti-patterns של עלויות ב-cluster" },
      body: {
        en: `<table>
<tr><th>Anti-pattern</th><th>Why it costs</th><th>Fix</th></tr>
<tr><td>Copy-pasted requests (every service: 1 CPU / 2 Gi)</td><td>Requests unrelated to reality; nodes sized for fiction</td><td>VPA/Goldilocks recommendations, rightsizing loop</td></tr>
<tr><td>Many tiny clusters (one per team/env)</td><td>Control plane (~$73/mo each on EKS/GKE standard), duplicated add-ons, no shared bin-packing</td><td>Fewer, multi-tenant clusters with namespaces + quotas</td></tr>
<tr><td>Small nodes with heavy DaemonSets</td><td>Logging + monitoring + mesh + CNI agents can take 0.5-1 vCPU per node</td><td>Larger nodes, trim DaemonSets</td></tr>
<tr><td>Dev/staging running 24/7</td><td>~70% of hours nobody is working</td><td>Scale to zero at night (KEDA cron, kube-downscaler), ephemeral PR envs</td></tr>
<tr><td>Cross-AZ chatter</td><td>~$0.01/GB each direction between AZs on AWS adds up for chatty services</td><td>Topology-aware routing, keep replicas of talkers co-located</td></tr>
<tr><td>Everything via NAT gateway</td><td>~$0.045/GB processing for image pulls and S3 traffic</td><td>VPC endpoints for ECR/S3, pull-through cache</td></tr>
<tr><td>Orphans</td><td>Released PVs, unattached disks, idle LoadBalancer Services, old snapshots</td><td>Weekly orphan report, reclaimPolicy reviews</td></tr>
<tr><td>Observability explosion</td><td>High-cardinality metrics and debug logs cost more than the app</td><td>Drop labels, sample, retention tiers</td></tr>
</table>
<p>Make cost a normal engineering metric: show cost per namespace next to SLOs in the team dashboard, review the top 10 movers weekly, and give every team a <code>ResourceQuota</code> that matches its budget.</p>`,
        he: `<table>
<tr><th>Anti-pattern</th><th>למה זה עולה כסף</th><th>תיקון</th></tr>
<tr><td>requests בהעתק-הדבק (כל שירות: 1 CPU / 2 Gi)</td><td>requests שלא קשורים למציאות; nodes בגודל של דמיון</td><td>המלצות VPA/Goldilocks, לולאת rightsizing</td></tr>
<tr><td>הרבה clusters קטנים (אחד לכל צוות/סביבה)</td><td>control plane (~$73 לחודש כל אחד ב-EKS/GKE standard), add-ons כפולים, אין bin-packing משותף</td><td>פחות clusters, multi-tenant, עם namespaces ו-quotas</td></tr>
<tr><td>nodes קטנים עם DaemonSets כבדים</td><td>logging + monitoring + mesh + CNI agents יכולים לקחת 0.5-1 vCPU לכל node</td><td>nodes גדולים יותר, לקצץ DaemonSets</td></tr>
<tr><td>Dev/staging שרצים 24/7</td><td>~70% מהשעות אף אחד לא עובד</td><td>Scale to zero בלילה (KEDA cron, kube-downscaler), סביבות PR זמניות</td></tr>
<tr><td>תעבורה בין AZs</td><td>~$0.01 ל-GB לכל כיוון בין AZs ב-AWS, מצטבר בשירותים פטפטנים</td><td>Topology-aware routing, לשים replicas של שירותים שמדברים הרבה קרוב</td></tr>
<tr><td>הכול דרך NAT gateway</td><td>~$0.045 ל-GB עיבוד על image pulls ותעבורה ל-S3</td><td>VPC endpoints ל-ECR/S3, pull-through cache</td></tr>
<tr><td>יתומים</td><td>PVs במצב Released, דיסקים לא מחוברים, Services של LoadBalancer בלי שימוש, snapshots ישנים</td><td>דוח יתומים שבועי, בדיקת reclaimPolicy</td></tr>
<tr><td>פיצוץ של observability</td><td>metrics עם cardinality גבוה ו-debug logs עולים יותר מהאפליקציה</td><td>להוריד labels, sampling, שכבות retention</td></tr>
</table>
<p>הופכים עלות ל-metric הנדסי רגיל: מציגים עלות לכל namespace ליד ה-SLOs ב-dashboard של הצוות, עוברים כל שבוע על 10 השינויים הגדולים, ונותנים לכל צוות <code>ResourceQuota</code> שמתאים לתקציב שלו.</p>`
      }
    }
  ],
  diagram: `  $$$ cloud bill = nodes x hours x price
            ^
  Provisioned capacity  [##########################------]  <- idle/slack: fix with
            ^                                                  consolidation, bin-packing
  Requested (scheduler) [##################--------]        <- over-request: fix with
            ^                                                  rightsizing (VPA/Goldilocks)
  Used (actual)         [######]
                                                              cheaper units: spot (-70%),
  OpenCost: node $/h  -> split by max(request, usage)         ARM (-20%), Savings Plans
            -> namespace / team label -> showback -> chargeback`,
  handsOn: [
    { cmd: "kubectl top pods -A --sort-by=cpu | head -20", what: { en: "Top CPU consumers right now — compare with their requests to spot over-requesting.", he: "הצרכנים הגדולים של CPU כרגע – משווים ל-requests שלהם כדי למצוא over-requesting." } },
    { cmd: "kubectl describe nodes | grep -A8 'Allocated resources'", what: { en: "Per node: requested vs allocatable CPU/memory — shows slack and which resource is the binding constraint.", he: "לכל node: requested מול allocatable של CPU/memory – מראה slack ואיזה משאב הוא האילוץ." } },
    { cmd: "kubectl get pods -A -o custom-columns='NS:.metadata.namespace,POD:.metadata.name,CPU_REQ:.spec.containers[*].resources.requests.cpu,MEM_REQ:.spec.containers[*].resources.requests.memory'", what: { en: "List requests for every Pod to find copy-pasted values and Pods with no requests at all.", he: "רשימת requests לכל Pod כדי למצוא ערכים מועתקים ו-Pods בלי requests בכלל." } },
    { cmd: "helm install opencost opencost/opencost -n opencost --create-namespace --set opencost.prometheus.internal.serviceName=prometheus-server --set opencost.prometheus.internal.namespaceName=monitoring", what: { en: "Install OpenCost pointing at your in-cluster Prometheus (add the repo first: helm repo add opencost https://opencost.github.io/opencost-helm-chart).", he: "להתקין OpenCost שמצביע על ה-Prometheus בתוך ה-cluster (קודם מוסיפים repo: helm repo add opencost https://opencost.github.io/opencost-helm-chart)." } },
    { cmd: "curl -s 'http://localhost:9003/allocation/compute?window=7d&aggregate=label:team&accumulate=true' | jq '.data[0] | map_values(.totalCost)'", what: { en: "Showback: 7-day cost per team label from the OpenCost API (after port-forwarding svc/opencost 9003).", he: "Showback: עלות של 7 ימים לכל label של team מה-API של OpenCost (אחרי port-forward ל-svc/opencost 9003)." } },
    { cmd: "kubectl get pdb -A", what: { en: "Find PDBs with ALLOWED DISRUPTIONS 0 that silently block consolidation, spot drains and upgrades.", he: "למצוא PDBs עם ALLOWED DISRUPTIONS 0 שחוסמים בשקט consolidation, drains של spot ושדרוגים." } },
    { cmd: "kubectl get pv | grep -E 'Released|Available'; kubectl get svc -A --field-selector spec.type=LoadBalancer", what: { en: "Orphan hunt: PVs nobody uses and every LoadBalancer Service (each one is a billed cloud LB).", he: "ציד יתומים: PVs שאף אחד לא משתמש בהם וכל ה-Services מסוג LoadBalancer (כל אחד הוא LB בענן שמחייבים עליו)." } },
    { cmd: "kubectl get nodes -L karpenter.sh/capacity-type,node.kubernetes.io/instance-type,kubernetes.io/arch", what: { en: "See the spot/on-demand and ARM/x86 mix of your fleet at a glance.", he: "לראות במבט אחד את התמהיל של spot/on-demand ו-ARM/x86 בצי." } }
  ],
  mnemonic: {
    en: "\"Shrink, Pack, Buy cheap\": shrink requests to usage (rightsize), pack Pods onto fewer nodes (consolidate), buy what's left cheaper (spot, ARM, commitments). You pay for what you reserve, not what you use.",
    he: "\"לכווץ, לארוז, לקנות בזול\": לכווץ requests לשימוש (rightsize), לארוז Pods על פחות nodes (consolidate), ולקנות את מה שנשאר בזול (spot, ARM, התחייבויות). משלמים על מה ששומרים, לא על מה שמשתמשים."
  },
  pitfalls: [
    { en: "Rightsizing requests without consolidation. Smaller requests leave the same nodes half-empty; the bill only drops when the autoscaler removes nodes.", he: "לעשות rightsizing ל-requests בלי consolidation. requests קטנים יותר משאירים את אותם nodes חצי ריקים; החשבון יורד רק כשה-autoscaler מוריד nodes." },
    { en: "Cutting memory requests to average usage. Memory isn't compressible: a spike above the limit is an OOMKill, not a slowdown. Size memory to peak plus headroom.", he: "להוריד memory requests לשימוש הממוצע. Memory הוא לא compressible: קפיצה מעל ה-limit היא OOMKill, לא האטה. מגדירים memory לפי השיא ועוד מרווח." },
    { en: "Putting everything on spot. A spot capacity crunch can reclaim many nodes at once; keep critical singletons and a baseline of each tier on on-demand, and spread spot across many types.", he: "לשים הכול על spot. מחסור ב-spot יכול לקחת הרבה nodes בבת אחת; משאירים singletons קריטיים ו-baseline מכל שכבה על on-demand, ומפזרים spot על הרבה types." },
    { en: "Reporting cost without labels. Without enforced team/app labels, half the spend lands in '__unallocated__' and nobody owns it.", he: "לדווח עלויות בלי labels. בלי labels של team/app שנאכפים, חצי מההוצאה נוחתת ב-'__unallocated__' ואף אחד לא אחראי עליה." }
  ],
  interview: [
    {
      q: { en: "Our cluster's average CPU usage is 18% but the bill keeps growing. Where do you look?", he: "ממוצע ה-CPU ב-cluster שלנו הוא 18% אבל החשבון ממשיך לגדול. איפה אתה מסתכל?" },
      a: { en: "Usage doesn't drive cost; requests and node count do. Compare provisioned vs requested vs used: if requested is close to provisioned, it's over-requesting — rightsize with VPA/Goldilocks recommendations. If provisioned is far above requested, it's slack — check node shapes, DaemonSet overhead, blocked scale-down (PDBs with 0 disruptions, do-not-disrupt, local storage), and enable Karpenter consolidation. Then attribute with OpenCost by namespace/team, and finally buy cheaper capacity: spot for stateless, ARM, Savings Plans for the baseline.", he: "שימוש לא קובע עלות; requests ומספר ה-nodes קובעים. משווים provisioned מול requested מול used: אם requested קרוב ל-provisioned – זה over-requesting, עושים rightsizing עם המלצות VPA/Goldilocks. אם provisioned הרבה מעל requested – זה slack, בודקים צורות של nodes, overhead של DaemonSets, scale-down חסום (PDBs עם 0 disruptions, do-not-disrupt, local storage), ומפעילים consolidation של Karpenter. אחר כך משייכים עלויות עם OpenCost לפי namespace/team, ולבסוף קונים capacity זול יותר: spot ל-stateless, ARM, ו-Savings Plans ל-baseline." }
    },
    {
      q: { en: "How does OpenCost allocate a node's cost to Pods?", he: "איך OpenCost מחלק את העלות של node בין Pods?" },
      a: { en: "It derives an hourly price per vCPU, GiB of memory and GPU for each node from the cloud price list (or billing data), then charges each Pod max(request, usage) of each resource for the time it ran. The unallocated remainder of every node is reported as idle, which can be shown separately or shared proportionally. PVs, load balancers and network can be added, and results are aggregated by namespace, controller or label.", he: "הוא גוזר מחיר שעתי ל-vCPU, ל-GiB של memory ול-GPU לכל node מתוך מחירון הענן (או נתוני billing), ואז מחייב כל Pod לפי max(request, usage) של כל משאב לזמן שהוא רץ. מה שנשאר לא מוקצה בכל node מדווח כ-idle, שאפשר להציג בנפרד או לחלק באופן יחסי. אפשר להוסיף PVs, load balancers ורשת, והתוצאות מקובצות לפי namespace, controller או label." }
    }
  ],
  quiz: [
    {
      q: { en: "A Pod requests 2 CPU and uses 200m on average. For scheduling and node cost it counts as:", he: "Pod מבקש 2 CPU ומשתמש בממוצע ב-200m. מבחינת scheduling ועלות nodes הוא נחשב:" },
      options: [
        { en: "200m", he: "200m" },
        { en: "2 CPU", he: "2 CPU" },
        { en: "Its CPU limit", he: "ה-CPU limit שלו" },
        { en: "1.1 CPU (the average of request and usage)", he: "1.1 CPU (ממוצע של request ו-usage)" }
      ],
      answer: 1,
      explain: { en: "The scheduler reserves the request on the node, and autoscalers add nodes based on requests. OpenCost likewise charges max(request, usage) = 2 CPU.", he: "ה-scheduler שומר את ה-request על ה-node, וה-autoscalers מוסיפים nodes לפי requests. גם OpenCost מחייב max(request, usage) = 2 CPU." }
    },
    {
      q: { en: "You halved requests on many services but the bill didn't change. Most likely why?", he: "חצית requests בהרבה שירותים אבל החשבון לא השתנה. למה, ככל הנראה?" },
      options: [
        { en: "The cloud bills by usage, which didn't change", he: "הענן מחייב לפי שימוש, שלא השתנה" },
        { en: "Nodes weren't removed — scale-down/consolidation is off or blocked (e.g. by PDBs with 0 allowed disruptions)", he: "nodes לא הורדו – scale-down/consolidation כבוי או חסום (למשל ע\"י PDBs עם 0 allowed disruptions)" },
        { en: "Requests only matter for memory", he: "requests רלוונטיים רק ל-memory" },
        { en: "You need to restart the kubelet", he: "צריך לעשות restart ל-kubelet" }
      ],
      answer: 1,
      explain: { en: "Savings materialize only when freed capacity turns into fewer nodes. Check autoscaler scale-down settings, Karpenter consolidation, and anything blocking drains.", he: "החיסכון קורה רק כשה-capacity שהתפנה הופך לפחות nodes. בודקים את הגדרות ה-scale-down של ה-autoscaler, consolidation של Karpenter, וכל דבר שחוסם drains." }
    },
    {
      q: { en: "Which workload is the worst fit for spot nodes?", he: "איזה workload הכי פחות מתאים ל-spot nodes?" },
      options: [
        { en: "A stateless API with 6 replicas and a PDB", he: "API stateless עם 6 replicas ו-PDB" },
        { en: "CI build runners", he: "CI build runners" },
        { en: "A KEDA-scaled queue worker", he: "Queue worker שעושה scale עם KEDA" },
        { en: "A single-replica primary database", he: "Primary database עם replica אחד" }
      ],
      answer: 3,
      explain: { en: "Spot can be reclaimed with ~2 minutes' notice. A single stateful primary would mean a failover or outage each time; the others tolerate losing a Pod.", he: "Spot יכול להילקח עם התראה של בערך 2 דקות. Primary stateful בודד אומר failover או השבתה בכל פעם; האחרים סובלים בקלות איבוד של Pod." }
    },
    {
      q: { en: "Cluster: 160 vCPU provisioned, 100 vCPU requested, 30 vCPU used. Which statement is right?", he: "Cluster: 160 vCPU provisioned, 100 vCPU requested, 30 vCPU used. איזו טענה נכונה?" },
      options: [
        { en: "60 vCPU is idle slack (bin-packing problem) and 70 vCPU is over-requested (rightsizing problem)", he: "60 vCPU הם slack בטל (בעיית bin-packing) ו-70 vCPU הם over-requested (בעיית rightsizing)" },
        { en: "130 vCPU are wasted only because of over-requesting", he: "130 vCPU מבוזבזים רק בגלל over-requesting" },
        { en: "Efficiency is 62%", he: "היעילות היא 62%" },
        { en: "Spot would fix all the waste", he: "Spot יפתור את כל הבזבוז" }
      ],
      answer: 0,
      explain: { en: "Provisioned − requested = 60 slack; requested − used = 70 over-request; efficiency = 30/160 ≈ 19%. Spot makes each unit cheaper but doesn't remove waste.", he: "provisioned פחות requested = 60 slack; requested פחות used = 70 over-request; יעילות = 30/160 ≈ 19%. Spot מוזיל כל יחידה אבל לא מעלים בזבוז." }
    }
  ],
  playground: "resources",
  related: ["cloud-finops", "k8s-node-autoprovisioning", "k8s-hpa-deep", "k8s-resources"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  { term: "NodePool", def: { en: "Karpenter resource declaring what nodes may be created: allowed instance types, zones, capacity types, taints, limits and disruption rules.", he: "משאב של Karpenter שמגדיר אילו nodes מותר ליצור: instance types, zones, capacity types, taints, limits וחוקי disruption." }, lesson: "k8s-node-autoprovisioning" },
  { term: "EC2NodeClass", def: { en: "Karpenter AWS resource describing how to launch nodes: AMI, subnets, security groups, IAM role, user data, disks.", he: "משאב AWS של Karpenter שמתאר איך להרים nodes: AMI, subnets, security groups, IAM role, user data ודיסקים." }, lesson: "k8s-node-autoprovisioning" },
  { term: "NodeClaim", def: { en: "Karpenter object representing one requested node through its lifecycle: Launched, Registered, Initialized, Ready.", he: "אובייקט של Karpenter שמייצג node אחד שהתבקש לאורך מחזור החיים שלו: Launched, Registered, Initialized, Ready." }, lesson: "k8s-node-autoprovisioning" },
  { term: "Consolidation", def: { en: "Karpenter disruption that deletes empty nodes or replaces underutilized ones with fewer/cheaper nodes, respecting PDBs and budgets.", he: "Disruption של Karpenter שמוחק nodes ריקים או מחליף nodes לא מנוצלים במעט nodes זולים יותר, תוך כיבוד PDBs ו-budgets." }, lesson: "k8s-node-autoprovisioning" },
  { term: "NAP (Node Auto Provisioning)", def: { en: "Managed autoprovisioning: on AKS it's managed Karpenter with AKSNodeClass; on GKE it auto-creates node pools sized for Pending Pods.", he: "Autoprovisioning מנוהל: ב-AKS זה Karpenter מנוהל עם AKSNodeClass; ב-GKE זה יוצר אוטומטית node pools בגודל שמתאים ל-Pods ב-Pending." }, lesson: "k8s-node-autoprovisioning" },
  { term: "GKE Autopilot", def: { en: "GKE mode where Google manages all nodes and you pay per Pod resource requests.", he: "מצב של GKE שבו Google מנהלת את כל ה-nodes ומשלמים לפי ה-requests של ה-Pods." }, lesson: "k8s-node-autoprovisioning" },
  { term: "ScaledObject", def: { en: "KEDA resource binding a Deployment/StatefulSet to triggers, with min/max replicas, polling interval and cooldown.", he: "משאב KEDA שמחבר Deployment/StatefulSet ל-triggers, עם min/max replicas, polling interval ו-cooldown." }, lesson: "k8s-keda" },
  { term: "Scale to zero", def: { en: "Running 0 replicas when there is no work and activating to 1 when an event arrives, trading idle cost for cold-start latency.", he: "להריץ 0 replicas כשאין עבודה ולעלות ל-1 כשמגיע event – מחליפים עלות של זמן בטל ב-latency של cold start." }, lesson: "k8s-keda" },
  { term: "prometheus-adapter", def: { en: "Serves Prometheus queries as custom/external metrics APIs so the HPA can scale on them.", he: "מגיש queries של Prometheus כ-custom/external metrics APIs כדי שה-HPA יוכל לעשות scale לפיהם." }, lesson: "k8s-hpa-deep" },
  { term: "Stabilization window", def: { en: "HPA behavior setting: the look-back period whose most conservative recommendation is used, preventing replica flapping (default 300s for scale-down).", he: "הגדרת behavior של HPA: תקופת מבט לאחור שממנה נלקחת ההמלצה השמרנית ביותר, כדי למנוע תנודות ב-replicas (ברירת מחדל 300 שניות ל-scale-down)." }, lesson: "k8s-hpa-deep" },
  { term: "VPA", def: { en: "Vertical Pod Autoscaler: recommends or applies container requests from usage history; modes Off, Initial, Recreate, InPlaceOrRecreate.", he: "Vertical Pod Autoscaler: ממליץ על requests לקונטיינרים או מחיל אותם לפי היסטוריית שימוש; מצבים Off, Initial, Recreate, InPlaceOrRecreate." }, lesson: "k8s-hpa-deep" },
  { term: "Helm release", def: { en: "One installed instance of a chart with versioned revisions, stored as Secrets in its namespace; supports upgrade, history and rollback.", he: "מופע מותקן אחד של chart עם revisions ממוספרים, שנשמר כ-Secrets ב-namespace שלו; תומך ב-upgrade, history ו-rollback." }, lesson: "k8s-helm-deep" },
  { term: "values.yaml", def: { en: "A chart's default configuration and public API; overridden by -f files (last wins) and then --set.", he: "הקונפיגורציה הדיפולטית וה-API הציבורי של chart; נדרס ע\"י קבצי -f (האחרון מנצח) ואז ע\"י --set." }, lesson: "k8s-helm-deep" },
  { term: "Helm hook", def: { en: "A manifest annotated with helm.sh/hook to run at a lifecycle point (pre-upgrade, post-install…), e.g. a DB migration Job.", he: "Manifest עם annotation של helm.sh/hook שרץ בנקודה במחזור החיים (pre-upgrade, post-install…), למשל Job של DB migration." }, lesson: "k8s-helm-deep" },
  { term: "helmfile", def: { en: "Declarative spec for many Helm releases across environments, with diff/apply of only what changed.", he: "הגדרה דקלרטיבית של הרבה Helm releases על פני סביבות, עם diff/apply רק למה שהשתנה." }, lesson: "k8s-helm-deep" },
  { term: "Argo CD", def: { en: "GitOps controller that continuously syncs Kubernetes clusters to manifests in Git and reports sync and health status.", he: "GitOps controller שמסנכרן ברציפות clusters של Kubernetes ל-manifests ב-Git ומדווח סטטוס sync ו-health." }, lesson: "k8s-argocd" },
  { term: "Argo CD Application", def: { en: "CRD mapping a Git source (path/chart + revision) to a destination cluster/namespace with a sync policy.", he: "CRD שממפה מקור ב-Git (path/chart + revision) ל-cluster/namespace יעד עם sync policy." }, lesson: "k8s-argocd" },
  { term: "Sync wave", def: { en: "Argo CD annotation ordering resources within a sync; lower waves apply first and must be healthy before the next.", he: "Annotation של Argo CD שקובע סדר משאבים בתוך sync; waves נמוכים מוחלים קודם וצריכים להיות healthy לפני הבא." }, lesson: "k8s-argocd" },
  { term: "ApplicationSet", def: { en: "Argo CD controller/CRD that templates many Applications from generators (list, clusters, git, matrix, pullRequest).", he: "Controller/CRD של Argo CD שמייצר הרבה Applications מ-template בעזרת generators (list, clusters, git, matrix, pullRequest)." }, lesson: "k8s-argocd" },
  { term: "Self-heal", def: { en: "Argo CD sync option that automatically reverts manual changes in the cluster back to the Git state.", he: "אופציית sync של Argo CD שמחזירה אוטומטית שינויים ידניים ב-cluster למצב שב-Git." }, lesson: "k8s-argocd" },
  { term: "Argo Rollouts", def: { en: "Progressive delivery controller providing canary and blue-green strategies with traffic shifting and metric-based analysis.", he: "Controller של progressive delivery שנותן אסטרטגיות canary ו-blue-green עם הזזת טראפיק ו-analysis לפי metrics." }, lesson: "k8s-argo-rollouts" },
  { term: "AnalysisTemplate", def: { en: "Argo Rollouts resource defining metric queries and success/failure conditions used to promote or abort a rollout.", he: "משאב של Argo Rollouts שמגדיר queries של metrics ותנאי הצלחה/כישלון שלפיהם מקדמים או עושים abort ל-rollout." }, lesson: "k8s-argo-rollouts" },
  { term: "Flagger", def: { en: "Flux-family progressive delivery operator that wraps a normal Deployment with a Canary resource and automates traffic shifting and analysis.", he: "Operator של progressive delivery ממשפחת Flux שעוטף Deployment רגיל במשאב Canary ועושה אוטומציה להזזת טראפיק ול-analysis." }, lesson: "k8s-argo-rollouts" },
  { term: "OpenCost", def: { en: "CNCF open-source tool that allocates Kubernetes and cloud costs to namespaces, workloads and labels using max(request, usage).", he: "כלי open source של CNCF שמשייך עלויות Kubernetes וענן ל-namespaces, workloads ו-labels לפי max(request, usage)." }, lesson: "k8s-cost" },
  { term: "Showback", def: { en: "Reporting each team's share of infrastructure cost (by namespace/labels) without billing it; the step before chargeback.", he: "דיווח על החלק של כל צוות בעלויות התשתית (לפי namespace/labels) בלי לחייב אותו בפועל; השלב שלפני chargeback." }, lesson: "k8s-cost" }
].forEach(g => window.INFRA.glossary.push(Object.assign({ track: "kubernetes" }, g)));
