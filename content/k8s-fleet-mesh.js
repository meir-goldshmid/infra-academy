window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ==================================================================
   Kubernetes fleet operations, multi-cluster GitOps, Istio in production,
   API gateways. Senior / platform level.
   ================================================================== */

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "k8s-fleet-upgrades",
  track: "kubernetes",
  order: 51,
  icon: "🚢",
  level: 3,
  minutes: 16,
  title: { en: "Fleet Upgrades: Upgrading 50 Clusters Without an Outage", he: "שדרוג צי: איך משדרגים 50 clusters בלי תקלה" },
  tldr: {
    en: "A fleet upgrade is a release pipeline, not a maintenance window: detect removed APIs before you start, upgrade control plane then add-ons then nodes, roll in waves (dev, canary cluster, region by region) with soak time and automated gates, and remember there is no rollback for a control plane, only roll forward or fail over to another cluster.",
    he: "שדרוג של צי clusters הוא release pipeline, לא חלון תחזוקה. קודם מאתרים APIs שעומדים להימחק. אחר כך משדרגים control plane, אחריו add-ons ובסוף nodes. מתגלגלים בגלים: dev, cluster קנרית, ואז region אחרי region, עם זמן soak ו-gates אוטומטיים. ותזכור: ל-control plane אין rollback. יש רק להמשיך קדימה או להעביר תעבורה ל-cluster אחר."
  },
  analogy: {
    en: "Think of an airline replacing the engines on 50 planes. You never ground the whole fleet on the same night. One plane flies empty test flights first, then a few short domestic routes, then the long-haul fleet one hub at a time, and a plane that lands with a warning light stops the program. And once an engine is swapped mid-air there is no putting the old one back: you land somewhere safe and fix forward.",
    he: "תחשוב על חברת תעופה שמחליפה מנועים ב-50 מטוסים. אף אחד לא מקרקע את כל הצי באותו לילה. קודם מטוס אחד עושה טיסות מבחן ריקות, אחר כך כמה קווים פנימיים קצרים, ורק אז הצי הבינלאומי, hub אחרי hub. מטוס שנוחת עם נורת אזהרה עוצר את כל התוכנית. ומנוע שהוחלף לא חוזר אחורה: נוחתים במקום בטוח ומתקנים קדימה."
  },
  sections: [
    {
      h: { en: "The rules you cannot break: version skew and upgrade order", he: "החוקים שאסור לשבור: version skew וסדר השדרוג" },
      body: {
        en: `<p>The Kubernetes version skew policy decides what order is even legal:</p>
<table>
<tr><th>Component</th><th>Allowed skew vs kube-apiserver</th></tr>
<tr><td>kube-apiserver (HA)</td><td>Instances may differ by 1 minor during the upgrade itself</td></tr>
<tr><td>controller-manager, scheduler</td><td>Same or 1 minor <strong>older</strong>, never newer</td></tr>
<tr><td>kubelet, kube-proxy</td><td>Up to 3 minors older (since 1.28; it was 2 before), never newer</td></tr>
<tr><td>kubectl</td><td>±1 minor</td></tr>
</table>
<p>Two consequences. First, the control plane always goes first, and only <strong>one minor at a time</strong>: 1.31 to 1.33 is two separate upgrades. Second, nodes may lag, which buys you time but not forever: if nodes sit on N-3 you cannot upgrade the control plane again until they catch up.</p>
<p>The order per cluster is therefore fixed:</p>
<ol>
<li><strong>Pre-flight</strong>: deprecated-API scan, add-on compatibility, PDB audit, capacity headroom.</li>
<li><strong>Control plane</strong> (on EKS: <code>aws eks update-cluster-version</code>, managed by AWS, apiserver stays available).</li>
<li><strong>Add-ons</strong> that must match the new minor: VPC CNI, CoreDNS, kube-proxy, EBS CSI, plus your own (Karpenter, AWS Load Balancer Controller, cert-manager, the mesh, the CNI policy engine).</li>
<li><strong>Nodes</strong>: new AMI per Kubernetes minor, rolled by Karpenter drift or managed node group updates.</li>
<li><strong>Post-flight</strong>: smoke tests, SLO check, soak.</li>
</ol>
<pre>aws eks update-cluster-version --name prod-euw1-a --kubernetes-version 1.34
aws eks describe-update --name prod-euw1-a --update-id &lt;id&gt;     # InProgress -&gt; Successful
aws eks describe-addon-versions --addon-name vpc-cni --kubernetes-version 1.34 \\
  --query 'addons[].addonVersions[?compatibilities[0].defaultVersion==\`true\`].addonVersion'</pre>
<blockquote>⚠️ Production tip: an EKS control plane cannot be downgraded. Once 1.34 is live, the only "rollback" is fixing forward or moving traffic to a cluster that is still on 1.33. Every other decision in this lesson follows from that one fact.</blockquote>`,
        he: `<p>ה-version skew policy של Kubernetes קובע איזה סדר בכלל חוקי:</p>
<table>
<tr><th>רכיב</th><th>skew מותר מול kube-apiserver</th></tr>
<tr><td>kube-apiserver (HA)</td><td>מופעים יכולים להיות בהפרש minor אחד בזמן השדרוג עצמו</td></tr>
<tr><td>controller-manager, scheduler</td><td>אותה גרסה או minor אחד <strong>ישן</strong> יותר, אף פעם לא חדש יותר</td></tr>
<tr><td>kubelet, kube-proxy</td><td>עד 3 minors אחורה (מאז 1.28; לפני זה 2), אף פעם לא חדש יותר</td></tr>
<tr><td>kubectl</td><td>±1 minor</td></tr>
</table>
<p>יש לזה שתי השלכות. קודם כל, ה-control plane תמיד ראשון, ורק <strong>minor אחד בכל פעם</strong>. מעבר מ-1.31 ל-1.33 הוא שני שדרוגים נפרדים. שנית, ה-nodes יכולים לפגר. זה קונה לך זמן, אבל לא לנצח: אם ה-nodes על N-3, אי אפשר לשדרג שוב את ה-control plane עד שהם יתעדכנו.</p>
<p>לכן הסדר בכל cluster קבוע:</p>
<ol>
<li><strong>Pre-flight</strong>: סריקת APIs שהוצאו משימוש, תאימות add-ons, בדיקת PDBs, מרווח קיבולת.</li>
<li><strong>Control plane</strong>: ב-EKS זה <code>aws eks update-cluster-version</code>. AWS מנהלים את זה, וה-apiserver נשאר זמין.</li>
<li><strong>Add-ons</strong> שחייבים להתאים ל-minor החדש: VPC CNI, CoreDNS, kube-proxy, EBS CSI, וגם שלך: Karpenter, AWS Load Balancer Controller, cert-manager, ה-mesh, מנוע ה-network policy.</li>
<li><strong>Nodes</strong>: AMI חדש לכל minor של Kubernetes, מתגלגל דרך drift של Karpenter או עדכון של managed node group.</li>
<li><strong>Post-flight</strong>: smoke tests, בדיקת SLO, soak.</li>
</ol>
<pre>aws eks update-cluster-version --name prod-euw1-a --kubernetes-version 1.34
aws eks describe-update --name prod-euw1-a --update-id &lt;id&gt;     # InProgress -&gt; Successful
aws eks describe-addon-versions --addon-name vpc-cni --kubernetes-version 1.34 \\
  --query 'addons[].addonVersions[?compatibilities[0].defaultVersion==\`true\`].addonVersion'</pre>
<blockquote>⚠️ Production tip: אי אפשר לעשות downgrade ל-control plane של EKS. ברגע ש-1.34 באוויר, ה"rollback" היחיד הוא לתקן קדימה או להעביר תעבורה ל-cluster שעדיין על 1.33. כל שאר ההחלטות בשיעור הזה נובעות מהעובדה הזאת.</blockquote>`
      }
    },
    {
      h: { en: "Finding removed APIs before they find you", he: "למצוא APIs שנמחקו לפני שהם מוצאים אותך" },
      body: {
        en: `<p>The classic upgrade outage is not the control plane, it is a manifest that uses an API version the new apiserver no longer serves (<code>policy/v1beta1</code> PodSecurityPolicy, <code>flowcontrol.apiserver.k8s.io/v1beta3</code>, old <code>autoscaling/v2beta2</code>). The upgrade succeeds, then the next deploy or Helm upgrade fails, or an operator stops reconciling. Use four signals, because each one has a blind spot:</p>
<table>
<tr><th>Tool</th><th>What it sees</th><th>Blind spot</th></tr>
<tr><td><strong>apiserver metric</strong> <code>apiserver_requested_deprecated_apis</code></td><td>Live clients calling deprecated APIs, with a <code>removed_release</code> label</td><td>Only clients that called since the last apiserver restart; a monthly CronJob may be missed</td></tr>
<tr><td><strong>EKS upgrade insights</strong> (<code>aws eks list-insights</code>)</td><td>Deprecated API calls from audit logs (last 30 days), add-on and kubelet skew problems</td><td>Refreshed periodically, not instantly</td></tr>
<tr><td><strong>kubent</strong> (kube-no-trouble)</td><td>Objects in the cluster and in Helm release secrets</td><td>Only what is deployed right now</td></tr>
<tr><td><strong>pluto</strong></td><td>Files in Git and rendered Helm charts</td><td>Needs to run in CI on the source of truth</td></tr>
</table>
<pre># who is still calling an API that 1.34 will not serve?
kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis
# apiserver_requested_deprecated_apis{group="flowcontrol.apiserver.k8s.io",removed_release="1.32",resource="flowschemas",version="v1beta3"} 1

kubent --target-version 1.34
pluto detect-helm -owide --target-versions k8s=v1.34.0
pluto detect-files -d ./gitops/ --target-versions k8s=v1.34.0</pre>
<p>Recent EKS versions run the insights checks as part of <code>update-cluster-version</code> and refuse to start if a check is in ERROR, unless you pass <code>--force</code> (check the current docs for your version). Treat <code>--force</code> as a page to a senior engineer, not as a flag.</p>
<blockquote>💡 Real world: the metric names the API but not the caller. To find who, read the audit log: requests to deprecated APIs carry the annotation <code>k8s.io/deprecated: "true"</code> together with the user agent and the ServiceAccount, which usually points straight at an old operator or a forgotten CI job.</blockquote>`,
        he: `<p>התקלה הקלאסית בשדרוג היא לא ה-control plane. היא manifest שמשתמש בגרסת API שה-apiserver החדש כבר לא מגיש: <code>policy/v1beta1</code> של PodSecurityPolicy, <code>flowcontrol.apiserver.k8s.io/v1beta3</code>, או <code>autoscaling/v2beta2</code> הישן. השדרוג מצליח, ואז ה-deploy הבא או Helm upgrade נכשל, או ש-operator מפסיק לעשות reconcile. תשתמש בארבעה סימנים, כי לכל אחד יש נקודה עיוורת:</p>
<table>
<tr><th>כלי</th><th>מה הוא רואה</th><th>נקודה עיוורת</th></tr>
<tr><td><strong>metric של ה-apiserver</strong> <code>apiserver_requested_deprecated_apis</code></td><td>clients חיים שקוראים ל-APIs שהוצאו משימוש, עם label בשם <code>removed_release</code></td><td>רק clients שקראו מאז ה-restart האחרון של ה-apiserver. CronJob חודשי יכול להתפספס</td></tr>
<tr><td><strong>EKS upgrade insights</strong> (<code>aws eks list-insights</code>)</td><td>קריאות ל-APIs ישנים מתוך ה-audit logs של 30 הימים האחרונים, ובעיות skew של add-ons ו-kubelet</td><td>מתרענן מדי פעם, לא בזמן אמת</td></tr>
<tr><td><strong>kubent</strong> (kube-no-trouble)</td><td>אובייקטים ב-cluster וב-secrets של Helm releases</td><td>רק מה שמותקן כרגע</td></tr>
<tr><td><strong>pluto</strong></td><td>קבצים ב-Git ו-Helm charts מרונדרים</td><td>צריך להריץ אותו ב-CI על ה-source of truth</td></tr>
</table>
<pre># who is still calling an API that 1.34 will not serve?
kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis
# apiserver_requested_deprecated_apis{group="flowcontrol.apiserver.k8s.io",removed_release="1.32",resource="flowschemas",version="v1beta3"} 1

kubent --target-version 1.34
pluto detect-helm -owide --target-versions k8s=v1.34.0
pluto detect-files -d ./gitops/ --target-versions k8s=v1.34.0</pre>
<p>בגרסאות EKS עדכניות, הפקודה <code>update-cluster-version</code> מריצה את בדיקות ה-insights ומסרבת להתחיל אם בדיקה במצב ERROR, אלא אם מעבירים <code>--force</code> (בדוק ב-docs העדכניים לגרסה שלך). תתייחס ל-<code>--force</code> כמו לקריאה למהנדס בכיר, לא כמו לעוד flag.</p>
<blockquote>💡 Real world: ה-metric אומר איזה API, אבל לא מי קורא לו. כדי למצוא את הקורא, תקרא את ה-audit log. בקשות ל-APIs ישנים מסומנות ב-annotation בשם <code>k8s.io/deprecated: "true"</code>, יחד עם ה-user agent וה-ServiceAccount. בדרך כלל זה מצביע ישר על operator ישן או על job נשכח ב-CI.</blockquote>`
      }
    },
    {
      h: { en: "In-place vs blue/green clusters", he: "In-place מול blue/green clusters" },
      body: {
        en: `<table>
<tr><th></th><th>In-place upgrade</th><th>Blue/green cluster</th></tr>
<tr><td>How</td><td>Upgrade the existing control plane, then roll nodes</td><td>Build a new cluster on N+1 (or N+2), deploy everything via GitOps, shift traffic with weighted DNS or a global LB, delete the old one</td></tr>
<tr><td>Rollback</td><td>None for the control plane; nodes can be rolled back to the old AMI only while the old minor is still within skew</td><td>Real: shift the weight back</td></tr>
<tr><td>Cost</td><td>Low</td><td>Double capacity during the overlap; new IPs, new OIDC issuer, new Pod Identity / IRSA trust</td></tr>
<tr><td>Hard parts</td><td>PDBs blocking drains, add-on compatibility</td><td>Stateful workloads (PVs are zonal EBS volumes), in-cluster queues, webhooks registered by external systems, caches warming up</td></tr>
<tr><td>Fits</td><td>Most clusters, most of the time</td><td>Skipping several minors, changing CNI/IP layout, stateless edge clusters, clusters that are cattle</td></tr>
</table>
<p>Mature platforms do both: in-place for the normal one-minor cadence, blue/green when the change is bigger than a version (new VPC CIDRs, moving to Auto Mode, a CNI swap). Blue/green only works if the cluster is truly reproducible from Git: if anyone ran <code>kubectl apply</code> by hand, the green cluster is missing it.</p>
<pre># weighted shift between blue (1.33) and green (1.34) clusters
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '{
 "Changes":[{"Action":"UPSERT","ResourceRecordSet":{
   "Name":"api.example.com","Type":"A","SetIdentifier":"green","Weight":10,
   "AliasTarget":{"HostedZoneId":"Z32O12XQLNTSW2","DNSName":"green-alb.eu-west-1.elb.amazonaws.com","EvaluateTargetHealth":true}}}]}'</pre>`,
        he: `<table>
<tr><th></th><th>שדרוג in-place</th><th>Blue/green cluster</th></tr>
<tr><td>איך</td><td>משדרגים את ה-control plane הקיים, ואז מגלגלים nodes</td><td>בונים cluster חדש על N+1 (או N+2), פורסים הכל דרך GitOps, מעבירים תעבורה עם weighted DNS או global LB, ומוחקים את הישן</td></tr>
<tr><td>Rollback</td><td>אין ל-control plane. את ה-nodes אפשר להחזיר ל-AMI הישן רק כל עוד ה-minor הישן בתוך ה-skew</td><td>אמיתי: מחזירים את המשקל</td></tr>
<tr><td>עלות</td><td>נמוכה</td><td>קיבולת כפולה בזמן החפיפה. IPs חדשים, OIDC issuer חדש, trust חדש ל-Pod Identity או IRSA</td></tr>
<tr><td>החלקים הקשים</td><td>PDBs שחוסמים drain, תאימות add-ons</td><td>workloads עם state (PVs הם EBS volumes שיושבים ב-zone אחד), queues בתוך ה-cluster, webhooks שמערכות חיצוניות רשמו, caches שצריכים להתחמם</td></tr>
<tr><td>מתאים ל</td><td>רוב ה-clusters, רוב הזמן</td><td>דילוג על כמה minors, שינוי CNI או תכנון IPs, edge clusters בלי state, clusters שהם cattle</td></tr>
</table>
<p>פלטפורמות בוגרות עושות את שניהם. In-place לקצב הרגיל של minor אחד בכל פעם, ו-blue/green כשהשינוי גדול מגרסה: CIDRs חדשים ל-VPC, מעבר ל-Auto Mode, החלפת CNI. Blue/green עובד רק אם ה-cluster באמת ניתן לשחזור מ-Git. אם מישהו הריץ <code>kubectl apply</code> ידני, זה יחסר ב-cluster הירוק.</p>
<pre># weighted shift between blue (1.33) and green (1.34) clusters
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '{
 "Changes":[{"Action":"UPSERT","ResourceRecordSet":{
   "Name":"api.example.com","Type":"A","SetIdentifier":"green","Weight":10,
   "AliasTarget":{"HostedZoneId":"Z32O12XQLNTSW2","DNSName":"green-alb.eu-west-1.elb.amazonaws.com","EvaluateTargetHealth":true}}}]}'</pre>`
      }
    },
    {
      h: { en: "Waves, cohorts, soak and gates", he: "גלים, cohorts, soak ו-gates" },
      body: {
        en: `<p>With 50 clusters, you are not upgrading clusters, you are running a progressive rollout where the unit is a cluster. A typical wave plan:</p>
<table>
<tr><th>Wave</th><th>Clusters</th><th>Soak before next wave</th></tr>
<tr><td>0</td><td>Platform sandbox (yours, disposable)</td><td>Until e2e suite is green</td></tr>
<tr><td>1</td><td>All dev clusters</td><td>2-3 working days (real developer traffic)</td></tr>
<tr><td>2</td><td>Staging + one <strong>canary prod cluster</strong> (smallest region, real traffic)</td><td>3-7 days, must cross a weekly peak</td></tr>
<tr><td>3</td><td>Prod, one region at a time, never two clusters serving the same users at once</td><td>24-48 h per region</td></tr>
<tr><td>4</td><td>Stragglers: special clusters (GPU, PCI, single-tenant)</td><td>Per owner</td></tr>
</table>
<p>Clusters join a wave through <strong>labels</strong>, not through a spreadsheet: <code>fleet.example.com/wave: "2"</code> on the Argo CD cluster secret, the Terraform workspace and the cost tags. The same label drives the upgrade pipeline, the add-on rollout and the dashboards.</p>
<p><strong>Gates</strong> between waves must be automatic and boring: control plane update status Successful, all add-ons ACTIVE, zero Pods in <code>CrashLoopBackOff</code>/<code>Pending</code> beyond baseline, apiserver 5xx and latency within SLO, error budget burn rate below threshold, no new deprecated-API calls. A human approves the start of wave 3; the system halts on its own.</p>
<pre># ApplicationSet that installs a pinned add-on version only on wave &lt;= 2 clusters
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: karpenter, namespace: argocd }
spec:
  goTemplate: true
  generators:
  - clusters:
      selector:
        matchExpressions:
        - { key: fleet.example.com/wave, operator: In, values: ["0","1","2"] }
      values: { chartVersion: "1.8.1" }        # example version
  template:
    metadata: { name: 'karpenter-{{.name}}' }
    spec:
      project: platform
      source:
        repoURL: oci://public.ecr.aws/karpenter
        chart: karpenter
        targetRevision: '{{.values.chartVersion}}'
      destination: { server: '{{.server}}', namespace: kube-system }
      syncPolicy: { automated: { prune: true, selfHeal: true } }</pre>
<p>Promoting the next wave is a one-line PR that widens the selector: reviewable, auditable, revertible.</p>`,
        he: `<p>עם 50 clusters אתה כבר לא משדרג clusters. אתה מריץ progressive rollout שבו היחידה היא cluster. תוכנית גלים טיפוסית:</p>
<table>
<tr><th>גל</th><th>Clusters</th><th>Soak לפני הגל הבא</th></tr>
<tr><td>0</td><td>Sandbox של הפלטפורמה (שלך, חד-פעמי)</td><td>עד שה-e2e suite ירוק</td></tr>
<tr><td>1</td><td>כל ה-clusters של dev</td><td>2-3 ימי עבודה (תעבורה אמיתית של מפתחים)</td></tr>
<tr><td>2</td><td>Staging ועוד <strong>cluster קנרית אחד ב-prod</strong> (ה-region הכי קטן, תעבורה אמיתית)</td><td>3-7 ימים, חייב לעבור peak שבועי</td></tr>
<tr><td>3</td><td>Prod, region אחד בכל פעם. אף פעם לא שני clusters שמשרתים אותם משתמשים במקביל</td><td>24-48 שעות לכל region</td></tr>
<tr><td>4</td><td>המאסף: clusters מיוחדים (GPU, PCI, single-tenant)</td><td>לפי הבעלים</td></tr>
</table>
<p>Cluster נכנס לגל דרך <strong>labels</strong>, לא דרך גיליון אקסל. למשל <code>fleet.example.com/wave: "2"</code> על ה-cluster secret של Argo CD, על ה-workspace של Terraform ועל תגיות העלות. אותו label מניע את pipeline השדרוג, את פריסת ה-add-ons ואת ה-dashboards.</p>
<p><strong>ה-gates</strong> בין הגלים צריכים להיות אוטומטיים ומשעממים: סטטוס העדכון של ה-control plane הוא Successful, כל ה-add-ons במצב ACTIVE, אין Pods ב-<code>CrashLoopBackOff</code> או <code>Pending</code> מעבר ל-baseline, שגיאות 5xx ו-latency של ה-apiserver בתוך ה-SLO, קצב שריפת ה-error budget מתחת לסף, ואין קריאות חדשות ל-APIs ישנים. בן אדם מאשר את תחילת גל 3. המערכת עוצרת לבד.</p>
<pre># ApplicationSet that installs a pinned add-on version only on wave &lt;= 2 clusters
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: karpenter, namespace: argocd }
spec:
  goTemplate: true
  generators:
  - clusters:
      selector:
        matchExpressions:
        - { key: fleet.example.com/wave, operator: In, values: ["0","1","2"] }
      values: { chartVersion: "1.8.1" }        # example version
  template:
    metadata: { name: 'karpenter-{{.name}}' }
    spec:
      project: platform
      source:
        repoURL: oci://public.ecr.aws/karpenter
        chart: karpenter
        targetRevision: '{{.values.chartVersion}}'
      destination: { server: '{{.server}}', namespace: kube-system }
      syncPolicy: { automated: { prune: true, selfHeal: true } }</pre>
<p>קידום לגל הבא הוא PR של שורה אחת שמרחיב את ה-selector. אפשר לעשות לו review, יש לו audit, ואפשר לעשות לו revert.</p>`
      }
    },
    {
      h: { en: "Rolling nodes: Karpenter drift, expiry and PDBs", he: "גלגול nodes: drift ו-expiry של Karpenter, ו-PDBs" },
      body: {
        en: `<p>After the control plane moves to 1.34, an <code>EC2NodeClass</code> that selects AMIs by alias (for example <code>al2023@latest</code>) resolves to the 1.34 AMI. Karpenter sees existing nodes no longer match and marks them <strong>Drifted</strong>, then replaces them, respecting disruption budgets. <code>expireAfter</code> guarantees no node lives forever even if nothing drifts.</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      expireAfter: 720h                 # 30 days max node age
      terminationGracePeriod: 24h       # force-finish a drain stuck on a PDB after 24h
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets:
    - nodes: "10%"                      # at most 10% of nodes disrupted at once
    - nodes: "0"                        # and none during business-hours peak
      schedule: "0 8 * * mon-fri"
      duration: 10h
      reasons: [Drifted, Underutilized]</pre>
<p><strong>PDBs are the usual blocker.</strong> A PDB with <code>minAvailable: 100%</code>, or <code>maxUnavailable: 0</code>, or a single-replica Deployment with <code>minAvailable: 1</code>, makes eviction impossible. The drain waits forever, the wave stalls, and someone is tempted to <code>--disable-eviction</code>. Audit before the wave:</p>
<pre>kubectl get pdb -A -o json | jq -r '.items[] | select(.status.disruptionsAllowed==0)
  | "\\(.metadata.namespace)/\\(.metadata.name) allowed=0 healthy=\\(.status.currentHealthy)"'
kubectl get nodeclaims -o custom-columns=NAME:.metadata.name,DRIFT:.status.conditions[?(@.type==\\"Drifted\\")].status</pre>
<p><code>terminationGracePeriod</code> is the policy decision made in calm times: "after 24 h we evict anyway". Publish it so app teams know a bad PDB delays them a day, it does not block the fleet.</p>
<blockquote>⚠️ Production tip: roll nodes per zone and watch for capacity, not just correctness. 10% of 400 nodes is 40 new instances requested at once; in a tight AZ that becomes <code>InsufficientInstanceCapacity</code> and Pending Pods. Give NodePools several instance families.</blockquote>`,
        he: `<p>אחרי שה-control plane עובר ל-1.34, <code>EC2NodeClass</code> שבוחר AMI לפי alias (למשל <code>al2023@latest</code>) מצביע על ה-AMI של 1.34. Karpenter רואה שה-nodes הקיימים כבר לא תואמים, מסמן אותם <strong>Drifted</strong>, ומחליף אותם תוך כיבוד ה-disruption budgets. ה-<code>expireAfter</code> מבטיח שאף node לא יחיה לנצח, גם אם אין drift.</p>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: general }
spec:
  template:
    spec:
      expireAfter: 720h                 # 30 days max node age
      terminationGracePeriod: 24h       # force-finish a drain stuck on a PDB after 24h
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets:
    - nodes: "10%"                      # at most 10% of nodes disrupted at once
    - nodes: "0"                        # and none during business-hours peak
      schedule: "0 8 * * mon-fri"
      duration: 10h
      reasons: [Drifted, Underutilized]</pre>
<p><strong>PDBs הם החוסם הרגיל.</strong> PDB עם <code>minAvailable: 100%</code>, או <code>maxUnavailable: 0</code>, או Deployment עם replica אחד ו-<code>minAvailable: 1</code>, הופכים eviction לבלתי אפשרי. ה-drain מחכה לנצח, הגל נתקע, ומישהו מתפתה להריץ <code>--disable-eviction</code>. תבדוק לפני הגל:</p>
<pre>kubectl get pdb -A -o json | jq -r '.items[] | select(.status.disruptionsAllowed==0)
  | "\\(.metadata.namespace)/\\(.metadata.name) allowed=0 healthy=\\(.status.currentHealthy)"'
kubectl get nodeclaims -o custom-columns=NAME:.metadata.name,DRIFT:.status.conditions[?(@.type==\\"Drifted\\")].status</pre>
<p>ה-<code>terminationGracePeriod</code> הוא החלטת מדיניות שמקבלים בזמן רגוע: "אחרי 24 שעות מפנים בכל מקרה". תפרסם את זה, כדי שצוותי האפליקציה ידעו ש-PDB גרוע מעכב אותם ביום, הוא לא חוסם את כל הצי.</p>
<blockquote>⚠️ Production tip: תגלגל nodes לפי zone ותסתכל על קיבולת, לא רק על נכונות. 10% מ-400 nodes זה 40 instances חדשים בבת אחת. ב-AZ צפוף זה הופך ל-<code>InsufficientInstanceCapacity</code> ול-Pods במצב Pending. תן ל-NodePools כמה משפחות של instances.</blockquote>`
      }
    },
    {
      h: { en: "Rollback realities and the add-on matrix", he: "המציאות של rollback ומטריצת ה-add-ons" },
      body: {
        en: `<p>What can actually go back:</p>
<ul>
<li><strong>Control plane</strong>: no. Plan for fix-forward or cluster failover.</li>
<li><strong>Add-ons</strong>: usually yes, to a version that still supports the new minor. Keep the previous version pinned in Git so revert is one commit.</li>
<li><strong>Nodes</strong>: yes, roll back the AMI, as long as the old kubelet is within skew (it is, since it was N-1).</li>
<li><strong>Workload manifests</strong> that you migrated to new API versions: yes, through Git.</li>
</ul>
<p>Keep an <strong>add-on compatibility matrix</strong> in the repo, one row per add-on, one column per Kubernetes minor, with the minimum and tested versions. The upgrade pipeline reads it and refuses to start if a cell is empty. Typical offenders: the mesh (Istio supports a fixed window of Kubernetes minors per release), the CNI policy engine, the CSI drivers, admission webhooks, and anything with <code>failurePolicy: Fail</code> whose Pods may not schedule during the node roll.</p>
<pre># add-ons.yaml (example)
k8s_1.33: { vpc-cni: v1.20.x, coredns: v1.12.x, karpenter: "1.6+", istio: "1.26-1.28" }
k8s_1.34: { vpc-cni: v1.20.x, coredns: v1.12.x, karpenter: "1.7+", istio: "1.27-1.28" }   # verify against vendor docs</pre>
<blockquote>💡 Real world: budget the cadence. Kubernetes ships about 3 minors a year and EKS standard support is 14 months, so a fleet that upgrades once a year falls into extended support (6x control plane price) and has to do two minors back to back. A steady quarterly cadence is cheaper than a yearly scramble.</blockquote>`,
        he: `<p>מה באמת אפשר להחזיר אחורה:</p>
<ul>
<li><strong>Control plane</strong>: לא. תתכנן fix-forward או failover ל-cluster אחר.</li>
<li><strong>Add-ons</strong>: בדרך כלל כן, לגרסה שעדיין תומכת ב-minor החדש. תשאיר את הגרסה הקודמת נעוצה ב-Git, כך שה-revert הוא commit אחד.</li>
<li><strong>Nodes</strong>: כן, מחזירים את ה-AMI, כל עוד ה-kubelet הישן בתוך ה-skew. הוא בתוכו, כי הוא היה N-1.</li>
<li><strong>Manifests</strong> שהעברת לגרסאות API חדשות: כן, דרך Git.</li>
</ul>
<p>תחזיק <strong>מטריצת תאימות של add-ons</strong> ב-repo: שורה לכל add-on, עמודה לכל minor של Kubernetes, עם הגרסה המינימלית והגרסה שנבדקה. ה-pipeline של השדרוג קורא אותה ומסרב להתחיל אם יש תא ריק. החשודים הקבועים: ה-mesh (כל גרסה של Istio תומכת בחלון קבוע של minors), מנוע ה-network policy, דרייברי CSI, admission webhooks, וכל דבר עם <code>failurePolicy: Fail</code> שה-Pods שלו אולי לא יעלו בזמן גלגול ה-nodes.</p>
<pre># add-ons.yaml (example)
k8s_1.33: { vpc-cni: v1.20.x, coredns: v1.12.x, karpenter: "1.6+", istio: "1.26-1.28" }
k8s_1.34: { vpc-cni: v1.20.x, coredns: v1.12.x, karpenter: "1.7+", istio: "1.27-1.28" }   # verify against vendor docs</pre>
<blockquote>💡 Real world: תתקצב את הקצב. Kubernetes מוציא בערך 3 minors בשנה, וה-standard support של EKS הוא 14 חודשים. צי שמשדרג פעם בשנה נופל ל-extended support (מחיר control plane פי 6) ונאלץ לעשות שני minors ברצף. קצב קבוע של פעם ברבעון זול יותר מריצה מטורפת פעם בשנה.</blockquote>`
      }
    }
  ],
  diagram: `wave 0: sandbox ──gate──► wave 1: dev x12 ──soak 3d──► wave 2: staging + prod-canary (ap-south) ──soak 7d──►
wave 3: prod eu-west ──24h──► prod us-east ──24h──► prod us-west ──► wave 4: GPU / PCI
per cluster:  pre-flight (kubent, insights, PDB audit) → control plane N+1 → add-ons → nodes (Karpenter drift) → smoke + SLO gate`,
  handsOn: [
    { cmd: "aws eks list-insights --cluster-name prod-euw1-a --filter kubernetesVersions=1.34", what: { en: "List EKS upgrade insights (deprecated API usage, add-on and kubelet skew) for the target version before you start.", he: "מציג את ה-upgrade insights של EKS (שימוש ב-APIs ישנים, skew של add-ons ו-kubelet) לגרסת היעד, לפני שמתחילים." } },
    { cmd: "kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis", what: { en: "See which deprecated APIs live clients still call, and in which release each will be removed.", he: "מראה לאילו APIs ישנים clients חיים עדיין קוראים, ובאיזו גרסה כל אחד מהם יימחק." } },
    { cmd: "pluto detect-files -d ./gitops --target-versions k8s=v1.34.0 -owide", what: { en: "Scan the Git source of truth for manifests that use removed API versions, so CI fails before the cluster does.", he: "סורק את ה-source of truth ב-Git ומחפש manifests עם גרסאות API שנמחקו, כדי שה-CI ייכשל לפני שה-cluster ייכשל." } },
    { cmd: "kubectl get pdb -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,ALLOWED:.status.disruptionsAllowed | awk '$3==0'", what: { en: "Find PDBs that currently allow zero disruptions; these will stall node drains during the roll.", he: "מוצא PDBs שכרגע מאפשרים אפס disruptions. הם אלה שיתקעו את ה-drain בזמן הגלגול." } },
    { cmd: "kubectl get nodes -L karpenter.sh/nodepool -o custom-columns=NAME:.metadata.name,KUBELET:.status.nodeInfo.kubeletVersion", what: { en: "Track the node roll: how many nodes still run the old kubelet version.", he: "עוקב אחרי גלגול ה-nodes: כמה nodes עדיין מריצים את ה-kubelet הישן." } }
  ],
  mnemonic: {
    en: "\"Scan, Brain, Add, Nodes, Soak\": scan APIs, control plane (the brain), add-ons, nodes, soak. And the brain never goes backwards.",
    he: "\"סורקים, מוח, תוספים, nodes, soak\": סורקים APIs, משדרגים את ה-control plane (המוח), add-ons, nodes, ואז soak. והמוח אף פעם לא חוזר אחורה."
  },
  pitfalls: [
    { en: "Trusting only the deprecated-API metric. It resets on apiserver restart and misses a monthly CronJob or an operator that only writes the old API on rare events. Combine it with audit-log based insights and pluto in CI.", he: "לסמוך רק על ה-metric של APIs ישנים. הוא מתאפס ב-restart של ה-apiserver ומפספס CronJob חודשי או operator שכותב את ה-API הישן רק באירועים נדירים. תשלב אותו עם insights מבוססי audit log ועם pluto ב-CI." },
    { en: "Upgrading two production regions in the same wave. If the new version has a bug, you lost your failover target at the same time you needed it.", he: "לשדרג שני regions של prod באותו גל. אם יש באג בגרסה החדשה, איבדת את יעד ה-failover בדיוק כשהיית צריך אותו." },
    { en: "Letting nodes lag 3 minors because \"skew allows it\". You then cannot upgrade the control plane until nodes catch up, and the forced catch-up happens under extended-support pressure.", he: "לתת ל-nodes לפגר 3 minors כי \"ה-skew מרשה\". אחרי זה אי אפשר לשדרג את ה-control plane עד שה-nodes יתעדכנו, וההשלמה הכפויה קורית תחת לחץ של extended support." },
    { en: "No soak across a peak. A version that is fine on a quiet Tuesday can fail on Friday's batch peak (new apiserver defaults, changed APF limits, a slower webhook).", he: "בלי soak שעובר peak. גרסה שעובדת מצוין ביום שלישי שקט יכולה ליפול ב-peak של batch ביום שישי: defaults חדשים ב-apiserver, מגבלות APF ששונו, webhook איטי יותר." }
  ],
  interview: [
    {
      q: { en: "You own 50 EKS clusters across 4 regions. Walk me through how you upgrade them from 1.33 to 1.34.", he: "יש לך 50 clusters של EKS בארבעה regions. תסביר איך אתה משדרג אותם מ-1.33 ל-1.34." },
      a: {
        en: "Start with readiness: deprecated APIs from three sources (apiserver metric, EKS insights from audit logs, pluto on Git), the add-on matrix for 1.34, PDBs with zero allowed disruptions, and capacity headroom for the node roll. Then waves driven by cluster labels: sandbox, all dev, staging plus one small prod canary cluster with real traffic, then prod one region at a time, special clusters last. Per cluster: control plane, then add-ons via ApplicationSets pinned per wave, then nodes via Karpenter drift with a disruption budget and terminationGracePeriod. Gates are automated: update status, add-on health, Pod health versus baseline, apiserver and app SLOs, burn rate. The key point: the control plane cannot be downgraded, so the safety net is never having all regions on the new version until it soaked, and keeping traffic failover between regions tested.",
        he: "מתחילים במוכנות: APIs ישנים משלושה מקורות (ה-metric של ה-apiserver, ה-insights של EKS מה-audit logs, ו-pluto על Git), מטריצת ה-add-ons ל-1.34, PDBs עם אפס disruptions מותרים, ומרווח קיבולת לגלגול ה-nodes. אחר כך גלים שמונעים על ידי labels של clusters: sandbox, כל ה-dev, staging ועוד cluster קנרית קטן ב-prod עם תעבורה אמיתית, ואז prod, region אחד בכל פעם, ו-clusters מיוחדים בסוף. בכל cluster: control plane, אחריו add-ons דרך ApplicationSets שנעוצים לפי גל, ואז nodes דרך drift של Karpenter עם disruption budget ו-terminationGracePeriod. ה-gates אוטומטיים: סטטוס העדכון, בריאות ה-add-ons, בריאות Pods מול baseline, SLOs של ה-apiserver ושל האפליקציות, burn rate. הנקודה המרכזית: אי אפשר לעשות downgrade ל-control plane. לכן רשת הביטחון היא לא לשים את כל ה-regions על הגרסה החדשה לפני שהיא עברה soak, ולשמור על failover בין regions שבאמת נבדק."
      }
    },
    {
      q: { en: "When would you choose blue/green clusters over in-place upgrades?", he: "מתי תבחר ב-blue/green clusters במקום שדרוג in-place?" },
      a: {
        en: "When the change is bigger than one minor or touches things in-place cannot change: skipping minors, a new VPC or CIDR plan, a CNI swap, moving to a managed mode, or when you need a real rollback for a high-risk change. The price is double capacity during overlap, new identities (OIDC issuer, Pod Identity associations), stateful data that must be migrated, and the requirement that the cluster be 100% reproducible from Git. For a normal one-minor upgrade on stateful clusters, in-place with waves is cheaper and safer.",
        he: "כשהשינוי גדול מ-minor אחד או נוגע בדברים ששדרוג in-place לא יכול לשנות: דילוג על minors, VPC או תכנון CIDR חדש, החלפת CNI, מעבר ל-mode מנוהל, או כשצריך rollback אמיתי לשינוי בסיכון גבוה. המחיר: קיבולת כפולה בזמן החפיפה, זהויות חדשות (OIDC issuer, שיוכים של Pod Identity), data עם state שצריך להעביר, והדרישה שה-cluster יהיה ניתן לשחזור מ-Git במאה אחוז. לשדרוג רגיל של minor אחד ב-clusters עם state, in-place בגלים זול ובטוח יותר."
      }
    },
    {
      q: { en: "Node drains are stuck on 30 PDBs across the fleet during an upgrade wave. What do you do now and what do you change for next time?", he: "בזמן גל שדרוג, ה-drain של nodes תקוע על 30 PDBs בצי. מה אתה עושה עכשיו ומה אתה משנה לפעם הבאה?" },
      a: {
        en: "Now: list PDBs with disruptionsAllowed=0 and classify them: single-replica with minAvailable 1 (scale to 2 temporarily with the owner), PDBs over unhealthy Pods (fix the app or use unhealthyPodEvictionPolicy: AlwaysAllow), and over-strict 100% PDBs. Don't bypass eviction blindly; stateful quorum systems really need their PDB. Next time: a pre-flight PDB audit that fails the wave, an admission policy (Kyverno or ValidatingAdmissionPolicy) that rejects PDBs which can never allow a disruption, and a published Karpenter terminationGracePeriod so the platform evicts after a known time.",
        he: "עכשיו: מוציאים רשימה של PDBs עם disruptionsAllowed=0 וממיינים. replica אחד עם minAvailable 1: מגדילים זמנית ל-2 יחד עם הבעלים. PDBs על Pods לא בריאים: מתקנים את האפליקציה או משתמשים ב-unhealthyPodEvictionPolicy: AlwaysAllow. PDBs קשוחים של 100%: מתקנים. לא עוקפים eviction בעיניים עצומות, כי מערכות quorum עם state באמת צריכות את ה-PDB שלהן. לפעם הבאה: בדיקת PDB ב-pre-flight שמכשילה את הגל, admission policy (Kyverno או ValidatingAdmissionPolicy) שדוחה PDBs שלעולם לא יאפשרו disruption, ו-terminationGracePeriod של Karpenter שמפורסם לכולם, כדי שהפלטפורמה תפנה אחרי זמן ידוע."
      }
    }
  ],
  quiz: [
    {
      q: { en: "kube-apiserver is on 1.34. Which kubelet version is NOT allowed by the skew policy?", he: "ה-kube-apiserver על 1.34. איזו גרסת kubelet אסורה לפי ה-skew policy?" },
      options: [
        { en: "1.31", he: "1.31" },
        { en: "1.33", he: "1.33" },
        { en: "1.35", he: "1.35" },
        { en: "1.34", he: "1.34" }
      ],
      answer: 2,
      explain: { en: "kubelet may be up to 3 minors older than the apiserver (1.31-1.34 are fine) but never newer. That is why the control plane always upgrades first.", he: "ה-kubelet יכול להיות עד 3 minors ישן יותר מה-apiserver (1.31 עד 1.34 בסדר), אבל אף פעם לא חדש יותר. בגלל זה ה-control plane תמיד משודרג ראשון." }
    },
    {
      q: { en: "Wave 3 upgraded prod eu-west to 1.34 and a critical regression appears. What is the realistic rollback?", he: "גל 3 שדרג את prod eu-west ל-1.34 ומופיעה רגרסיה קריטית. מה ה-rollback המציאותי?" },
      options: [
        { en: "aws eks update-cluster-version --kubernetes-version 1.33", he: "aws eks update-cluster-version --kubernetes-version 1.33" },
        { en: "Restore etcd from the pre-upgrade snapshot", he: "לשחזר את etcd מה-snapshot שלפני השדרוג" },
        { en: "Shift traffic to a region still on 1.33 and fix forward (or roll back the add-on/AMI if it is the culprit)", he: "להעביר תעבורה ל-region שעדיין על 1.33 ולתקן קדימה (או להחזיר את ה-add-on או ה-AMI אם הם האשמים)" },
        { en: "Delete and recreate the node groups on 1.33", he: "למחוק וליצור מחדש את ה-node groups על 1.33" }
      ],
      answer: 2,
      explain: { en: "EKS control planes cannot be downgraded and you have no etcd access. Add-ons and node AMIs can be reverted, but the control plane only rolls forward, so cross-region failover is the real safety net.", he: "אי אפשר לעשות downgrade ל-control plane של EKS, ואין לך גישה ל-etcd. את ה-add-ons וה-AMI של ה-nodes אפשר להחזיר, אבל ה-control plane רק מתקדם. לכן failover בין regions הוא רשת הביטחון האמיתית." }
    },
    {
      q: { en: "Which detection method finds a deprecated API used only by a CronJob that runs on the 1st of the month, before the cluster is upgraded?", he: "איזו שיטת זיהוי תמצא API ישן שמשמש רק CronJob שרץ ב-1 לחודש, לפני שמשדרגים את ה-cluster?" },
      options: [
        { en: "The apiserver_requested_deprecated_apis metric, checked today", he: "ה-metric בשם apiserver_requested_deprecated_apis, נבדק היום" },
        { en: "pluto scanning the manifests in Git", he: "pluto שסורק את ה-manifests ב-Git" },
        { en: "kubectl get events", he: "kubectl get events" },
        { en: "kubectl version --short", he: "kubectl version --short" }
      ],
      answer: 1,
      explain: { en: "Runtime signals only see calls that happened recently. Static scanning of the source of truth (pluto, or kubent on deployed objects) catches it regardless of when it runs. EKS insights look back 30 days, which would also help.", he: "סימנים בזמן ריצה רואים רק קריאות שקרו לאחרונה. סריקה סטטית של ה-source of truth (pluto, או kubent על אובייקטים מותקנים) תופסת את זה בלי קשר למתי זה רץ. ה-insights של EKS מסתכלים 30 ימים אחורה, וגם זה היה עוזר." }
    },
    {
      q: { en: "Karpenter shows many nodes Drifted after a control plane upgrade but replaces them very slowly. Which is the most likely cause?", he: "אחרי שדרוג control plane, Karpenter מראה הרבה nodes במצב Drifted אבל מחליף אותם לאט מאוד. מה הסיבה הסבירה ביותר?" },
      options: [
        { en: "The EC2NodeClass AMI alias did not resolve", he: "ה-alias של ה-AMI ב-EC2NodeClass לא התפענח" },
        { en: "A disruption budget (e.g. nodes: 10% or a 0 window) plus PDBs limiting evictions", he: "disruption budget (למשל nodes: 10% או חלון של 0) ועוד PDBs שמגבילים evictions" },
        { en: "kube-proxy is one minor behind", he: "ה-kube-proxy בפיגור של minor אחד" },
        { en: "The cluster is in extended support", he: "ה-cluster נמצא ב-extended support" }
      ],
      answer: 1,
      explain: { en: "If the nodes are marked Drifted, the AMI resolved fine. Throughput of the roll is bounded by NodePool disruption budgets and by how fast Pods can be evicted under their PDBs, which is working as designed unless a PDB allows zero.", he: "אם ה-nodes מסומנים Drifted, ה-AMI התפענח בסדר. קצב הגלגול מוגבל על ידי ה-disruption budgets של ה-NodePool ועל ידי הקצב שבו אפשר לפנות Pods תחת ה-PDBs שלהם. זה עובד כמתוכנן, אלא אם יש PDB שמאפשר אפס." }
    }
  ],
  related: ["k8s-day2-upgrades", "k8s-multi-cluster", "k8s-node-autoprovisioning", "cloud-managed-k8s-compare", "k8s-argocd", "k8s-gitops-at-scale"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "k8s-gitops-at-scale",
  track: "kubernetes",
  order: 52,
  icon: "🗂️",
  level: 3,
  minutes: 16,
  title: { en: "Multi-Cluster GitOps at Scale", he: "GitOps בקנה מידה: הרבה clusters, הרבה apps" },
  tldr: {
    en: "At fleet scale, GitOps is a distributed system: a repo layout that separates 'what' (apps) from 'where' (clusters, envs), ApplicationSets that stamp Applications from generators, a topology choice (hub-spoke vs Argo CD per cluster), and capacity planning for the controller and repo-server, because manifest generation for thousands of apps is real CPU.",
    he: "בקנה מידה של צי, GitOps הוא מערכת מבוזרת. צריך layout של repo שמפריד בין 'מה' (apps) לבין 'איפה' (clusters וסביבות), ApplicationSets שמייצרים Applications מתוך generators, החלטה על טופולוגיה (hub-spoke או Argo CD לכל cluster), ותכנון קיבולת ל-controller ול-repo-server. ייצור manifests לאלפי apps שורף CPU אמיתי."
  },
  analogy: {
    en: "A franchise with 50 restaurants. The recipe book (Git) is written once; each branch has a small card of local differences (overlays: oven size, local suppliers). Head office can either send one inspector who drives to every branch (hub-spoke) or hire a manager inside each branch who reads the same book (one Argo CD per cluster). One inspector is simpler to manage, until there are 500 branches and he spends all day on the road.",
    he: "רשת עם 50 מסעדות. ספר המתכונים (Git) נכתב פעם אחת, ולכל סניף יש כרטיס קטן של הבדלים מקומיים (overlays: גודל התנור, ספקים מקומיים). המטה יכול לשלוח מפקח אחד שנוסע לכל הסניפים (hub-spoke), או להעסיק מנהל בתוך כל סניף שקורא מאותו ספר (Argo CD לכל cluster). מפקח אחד פשוט יותר לנהל, עד שיש 500 סניפים והוא מבלה את כל היום על הכביש."
  },
  sections: [
    {
      h: { en: "Repo layout: separate the app, the environment and the cluster", he: "Layout של repo: להפריד בין app, סביבה ו-cluster" },
      body: {
        en: `<p>The layout that survives growth has three axes: <strong>app</strong> (base manifests or chart), <strong>environment</strong> (dev/staging/prod values), and <strong>cluster</strong> (region-specific bits like ingress hostnames, IAM role ARNs). Everything else is a generator picking combinations.</p>
<pre>gitops/
├── apps/
│   └── checkout/
│       ├── base/                    # Kustomize base or Helm chart + values.yaml
│       └── overlays/
│           ├── dev/  staging/  prod/            # env-level values
├── clusters/
│   ├── prod-euw1-a/config.json      # {"env":"prod","region":"eu-west-1","wave":"3"}
│   └── prod-use1-a/config.json
├── platform/                        # add-ons: karpenter, istio, external-secrets...
│   └── istio/values-{{env}}.yaml
└── bootstrap/
    └── root-appsets.yaml            # the only thing applied by hand, once</pre>
<p><strong>App-of-apps</strong> (an Application that points at a folder of Application manifests) still works for bootstrapping, but it does not template: 50 clusters means 50 copies. <strong>ApplicationSets</strong> replace the copies with generators:</p>
<table>
<tr><th>Generator</th><th>Produces one Application per…</th><th>Typical use</th></tr>
<tr><td><code>clusters</code></td><td>Registered cluster (filtered by labels)</td><td>Platform add-ons on every cluster, by wave</td></tr>
<tr><td><code>git</code> (directories / files)</td><td>Folder or config file in a repo</td><td>One app per folder; one cluster per <code>config.json</code></td></tr>
<tr><td><code>matrix</code></td><td>Cartesian product of two generators</td><td>Every app × every cluster of its env</td></tr>
<tr><td><code>merge</code></td><td>Base generator, overridden by another</td><td>Defaults plus per-cluster exceptions</td></tr>
<tr><td><code>pullRequest</code></td><td>Open PR</td><td>Preview environments</td></tr>
</table>
<pre>apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: checkout, namespace: argocd }
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
  - matrix:
      generators:
      - clusters:
          selector: { matchLabels: { env: prod } }
      - git:
          repoURL: https://git.example.com/platform/gitops.git
          revision: main
          files: [{ path: "apps/checkout/overlays/prod/config.json" }]
  template:
    metadata:
      name: 'checkout-{{.name}}'
      labels: { app: checkout, wave: '{{index .metadata.labels "fleet.example.com/wave"}}' }
    spec:
      project: payments
      source:
        repoURL: https://git.example.com/platform/gitops.git
        targetRevision: main
        path: apps/checkout/overlays/prod
        kustomize:
          patches:
          - target: { kind: Deployment, name: checkout }
            patch: |-
              - op: add
                path: /spec/template/metadata/labels/region
                value: '{{index .metadata.labels "topology.kubernetes.io/region"}}'
      destination: { server: '{{.server}}', namespace: checkout }
      syncPolicy:
        automated: { prune: true, selfHeal: true }
        syncOptions: [ServerSideApply=true, CreateNamespace=true]</pre>
<blockquote>⚠️ Production tip: set <code>missingkey=error</code> and keep the ApplicationSet <code>preserveResourcesOnDeletion</code> / deletion policy in mind. A generator that suddenly returns zero clusters (a renamed label) can delete every generated Application, and with prune on, their workloads. Argo CD has <code>applicationsetcontroller.policy</code> (for example <code>create-update</code>, which never deletes) for exactly this.</blockquote>`,
        he: `<p>ה-layout ששורד גדילה בנוי על שלושה צירים: <strong>app</strong> (manifests בסיסיים או chart), <strong>סביבה</strong> (values של dev, staging, prod) ו-<strong>cluster</strong> (דברים ספציפיים ל-region כמו hostnames של ingress או ARN של IAM role). כל השאר זה generator שבוחר צירופים.</p>
<pre>gitops/
├── apps/
│   └── checkout/
│       ├── base/                    # Kustomize base or Helm chart + values.yaml
│       └── overlays/
│           ├── dev/  staging/  prod/            # env-level values
├── clusters/
│   ├── prod-euw1-a/config.json      # {"env":"prod","region":"eu-west-1","wave":"3"}
│   └── prod-use1-a/config.json
├── platform/                        # add-ons: karpenter, istio, external-secrets...
│   └── istio/values-{{env}}.yaml
└── bootstrap/
    └── root-appsets.yaml            # the only thing applied by hand, once</pre>
<p><strong>App-of-apps</strong>, כלומר Application שמצביע על תיקייה של Applications, עדיין טוב ל-bootstrap. אבל הוא לא עושה templating: 50 clusters זה 50 עותקים. <strong>ApplicationSets</strong> מחליפים את העותקים ב-generators:</p>
<table>
<tr><th>Generator</th><th>מייצר Application אחד לכל…</th><th>שימוש טיפוסי</th></tr>
<tr><td><code>clusters</code></td><td>cluster רשום (מסונן לפי labels)</td><td>add-ons של הפלטפורמה על כל cluster, לפי גל</td></tr>
<tr><td><code>git</code> (directories / files)</td><td>תיקייה או קובץ config ב-repo</td><td>app אחד לכל תיקייה, cluster אחד לכל <code>config.json</code></td></tr>
<tr><td><code>matrix</code></td><td>מכפלה של שני generators</td><td>כל app כפול כל cluster בסביבה שלו</td></tr>
<tr><td><code>merge</code></td><td>generator בסיסי שאחר דורס אותו</td><td>defaults ועוד חריגים לכל cluster</td></tr>
<tr><td><code>pullRequest</code></td><td>PR פתוח</td><td>סביבות preview</td></tr>
</table>
<pre>apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata: { name: checkout, namespace: argocd }
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
  - matrix:
      generators:
      - clusters:
          selector: { matchLabels: { env: prod } }
      - git:
          repoURL: https://git.example.com/platform/gitops.git
          revision: main
          files: [{ path: "apps/checkout/overlays/prod/config.json" }]
  template:
    metadata:
      name: 'checkout-{{.name}}'
      labels: { app: checkout, wave: '{{index .metadata.labels "fleet.example.com/wave"}}' }
    spec:
      project: payments
      source:
        repoURL: https://git.example.com/platform/gitops.git
        targetRevision: main
        path: apps/checkout/overlays/prod
        kustomize:
          patches:
          - target: { kind: Deployment, name: checkout }
            patch: |-
              - op: add
                path: /spec/template/metadata/labels/region
                value: '{{index .metadata.labels "topology.kubernetes.io/region"}}'
      destination: { server: '{{.server}}', namespace: checkout }
      syncPolicy:
        automated: { prune: true, selfHeal: true }
        syncOptions: [ServerSideApply=true, CreateNamespace=true]</pre>
<blockquote>⚠️ Production tip: תגדיר <code>missingkey=error</code> ותחשוב על מדיניות המחיקה של ה-ApplicationSet. generator שפתאום מחזיר אפס clusters (כי מישהו שינה שם של label) יכול למחוק את כל ה-Applications שנוצרו, ועם prune דולק, גם את ה-workloads שלהם. בדיוק בשביל זה יש ב-Argo CD את <code>applicationsetcontroller.policy</code>, למשל <code>create-update</code> שאף פעם לא מוחק.</blockquote>`
      }
    },
    {
      h: { en: "Topology: hub-spoke vs one Argo CD per cluster", he: "טופולוגיה: hub-spoke מול Argo CD לכל cluster" },
      body: {
        en: `<table>
<tr><th></th><th>Hub-spoke (one Argo CD manages many clusters)</th><th>Argo CD per cluster</th></tr>
<tr><td>Single pane of glass</td><td>Yes: one UI, one RBAC, one ApplicationSet sees all clusters</td><td>No: need an aggregation layer for fleet view</td></tr>
<tr><td>Credentials</td><td>The hub holds admin-ish credentials to every cluster: a crown jewel</td><td>Each instance only touches its own cluster</td></tr>
<tr><td>Network</td><td>Hub must reach every apiserver (private endpoints, VPC peering / PrivateLink)</td><td>Only outbound to Git and registry</td></tr>
<tr><td>Blast radius</td><td>Hub outage = no deploys anywhere (running workloads keep running)</td><td>Isolated per cluster</td></tr>
<tr><td>Scaling</td><td>Controller watches every resource in every cluster: memory grows with fleet size</td><td>Naturally sharded</td></tr>
<tr><td>Upgrading Argo CD</td><td>Once</td><td>50 times (but you have a fleet process for that)</td></tr>
</table>
<p>The common compromise is <strong>one hub per environment or per region</strong> (prod hub, non-prod hub), each managing tens of clusters, plus a separate management cluster for the hubs themselves. Pull-based agent models (the <code>argocd-agent</code> project, or Flux running in each cluster) aim to give a central view with per-cluster reconciliation; check their current maturity before betting on them.</p>
<pre># register a spoke with labels that generators select on
argocd cluster add arn:aws:eks:eu-west-1:111122223333:cluster/prod-euw1-a \\
  --name prod-euw1-a --label env=prod --label fleet.example.com/wave=3 \\
  --label topology.kubernetes.io/region=eu-west-1
# on EKS prefer IAM auth (awsAuthConfig with a role) over a long-lived bearer token</pre>`,
        he: `<table>
<tr><th></th><th>Hub-spoke (Argo CD אחד מנהל הרבה clusters)</th><th>Argo CD לכל cluster</th></tr>
<tr><td>מבט אחד על הכל</td><td>כן: UI אחד, RBAC אחד, ו-ApplicationSet אחד רואה את כל ה-clusters</td><td>לא: צריך שכבת איסוף בשביל מבט על הצי</td></tr>
<tr><td>Credentials</td><td>ה-hub מחזיק credentials כמעט admin לכל cluster. זה ה-crown jewel</td><td>כל instance נוגע רק ב-cluster שלו</td></tr>
<tr><td>רשת</td><td>ה-hub צריך להגיע לכל apiserver (private endpoints, VPC peering או PrivateLink)</td><td>רק תעבורה יוצאת ל-Git ול-registry</td></tr>
<tr><td>Blast radius</td><td>ה-hub נופל = אין deploys בשום מקום (מה שרץ ממשיך לרוץ)</td><td>מבודד לכל cluster</td></tr>
<tr><td>Scaling</td><td>ה-controller עושה watch על כל resource בכל cluster, והזיכרון גדל עם הצי</td><td>מחולק באופן טבעי</td></tr>
<tr><td>שדרוג Argo CD</td><td>פעם אחת</td><td>50 פעמים (אבל יש לך תהליך צי בשביל זה)</td></tr>
</table>
<p>הפשרה הנפוצה היא <strong>hub אחד לכל סביבה או לכל region</strong> (hub ל-prod, hub ל-non-prod), כשכל אחד מנהל עשרות clusters, ועוד management cluster נפרד בשביל ה-hubs עצמם. מודלים של pull עם agent, כמו הפרויקט <code>argocd-agent</code> או Flux שרץ בכל cluster, מנסים לתת מבט מרכזי עם reconcile מקומי בכל cluster. תבדוק את הבשלות העדכנית שלהם לפני שאתה מהמר עליהם.</p>
<pre># register a spoke with labels that generators select on
argocd cluster add arn:aws:eks:eu-west-1:111122223333:cluster/prod-euw1-a \\
  --name prod-euw1-a --label env=prod --label fleet.example.com/wave=3 \\
  --label topology.kubernetes.io/region=eu-west-1
# on EKS prefer IAM auth (awsAuthConfig with a role) over a long-lived bearer token</pre>`
      }
    },
    {
      h: { en: "Scaling Argo CD: controller shards, repo-server CPU, the 1000s-of-apps problem", he: "Scaling ל-Argo CD: shards ל-controller, CPU ל-repo-server, ובעיית אלפי ה-apps" },
      body: {
        en: `<p>Three components hurt, for different reasons:</p>
<ul>
<li><strong>application-controller</strong> keeps a watch cache of every managed resource in every cluster and computes diffs. It is sharded <strong>by cluster</strong>: scale the StatefulSet and set the replica count; the <code>round-robin</code> or <code>consistent-hashing</code> algorithms spread clusters better than the default <code>legacy</code> hash. One giant cluster still lands on one shard.</li>
<li><strong>repo-server</strong> runs <code>helm template</code> / <code>kustomize build</code> for every app on every refresh. In a monorepo, <strong>any commit</strong> changes the revision and can invalidate the cached manifests of every app in that repo. 3000 apps × a 2-second Helm render = 100 CPU-minutes per commit.</li>
<li><strong>redis</strong> holds the manifest cache and cluster cache; when it is evicted or restarted, everything is regenerated at once.</li>
</ul>
<pre># argocd-cmd-params-cm (values are starting points, tune with metrics)
controller.sharding.algorithm: round-robin
controller.status.processors: "50"        # default 20
controller.operation.processors: "25"     # default 10
controller.repo.server.timeout.seconds: "180"
reposerver.parallelism.limit: "10"        # cap concurrent renders per repo-server Pod
# argocd-cm
timeout.reconciliation: 300s              # default 180s polling; use Git webhooks instead
---
# on each Application: only regenerate when these paths change
metadata:
  annotations:
    argocd.argoproj.io/manifest-generate-paths: .;../../base</pre>
<p>Other levers: Git webhooks instead of polling, scaling repo-server replicas horizontally (it is stateless), splitting a huge monorepo into an apps repo and a config repo, pre-rendering Helm charts in CI (the "rendered manifests" pattern) so Argo CD just applies YAML, and excluding noisy resource kinds you don't manage (<code>resource.exclusions</code> for Events, Endpoints/EndpointSlices, high-churn CRDs).</p>
<blockquote>💡 Real world: watch <code>argocd_app_reconcile</code> (histogram), <code>argocd_repo_pending_request_total</code>, <code>argocd_git_request_duration_seconds</code>, and controller memory per shard. "Argo CD is slow" almost always turns out to be one of: repo-server CPU-throttled, a monorepo cache busting on every commit, or one shard owning the biggest cluster.</blockquote>`,
        he: `<p>שלושה רכיבים כואבים, וכל אחד מסיבה אחרת:</p>
<ul>
<li><strong>application-controller</strong> מחזיק watch cache של כל resource מנוהל בכל cluster ומחשב diffs. הוא מחולק ל-shards <strong>לפי cluster</strong>: מגדילים את ה-StatefulSet ומגדירים את מספר ה-replicas. האלגוריתמים <code>round-robin</code> או <code>consistent-hashing</code> מפזרים clusters טוב יותר מה-hash ברירת המחדל <code>legacy</code>. cluster ענק אחד עדיין נוחת על shard אחד.</li>
<li><strong>repo-server</strong> מריץ <code>helm template</code> או <code>kustomize build</code> לכל app בכל refresh. ב-monorepo, <strong>כל commit</strong> משנה את ה-revision ויכול לבטל את ה-cache של כל ה-apps ב-repo. 3000 apps כפול render של 2 שניות ב-Helm זה 100 דקות CPU לכל commit.</li>
<li><strong>redis</strong> מחזיק את ה-cache של ה-manifests ושל ה-clusters. כשהוא מתרוקן או עושה restart, הכל נבנה מחדש בבת אחת.</li>
</ul>
<pre># argocd-cmd-params-cm (values are starting points, tune with metrics)
controller.sharding.algorithm: round-robin
controller.status.processors: "50"        # default 20
controller.operation.processors: "25"     # default 10
controller.repo.server.timeout.seconds: "180"
reposerver.parallelism.limit: "10"        # cap concurrent renders per repo-server Pod
# argocd-cm
timeout.reconciliation: 300s              # default 180s polling; use Git webhooks instead
---
# on each Application: only regenerate when these paths change
metadata:
  annotations:
    argocd.argoproj.io/manifest-generate-paths: .;../../base</pre>
<p>עוד מנופים: webhooks של Git במקום polling. scale אופקי ל-repo-server (הוא stateless). פיצול monorepo ענק ל-repo של apps ו-repo של config. רינדור Helm charts מראש ב-CI (תבנית ה-"rendered manifests"), כך ש-Argo CD רק עושה apply ל-YAML. והחרגה של סוגי resources רועשים שאתה לא מנהל, דרך <code>resource.exclusions</code>: Events, Endpoints ו-EndpointSlices, CRDs שמשתנים כל הזמן.</p>
<blockquote>💡 Real world: תעקוב אחרי <code>argocd_app_reconcile</code> (histogram), <code>argocd_repo_pending_request_total</code>, <code>argocd_git_request_duration_seconds</code>, וזיכרון ה-controller לכל shard. "Argo CD איטי" כמעט תמיד מתברר כאחד מאלה: repo-server שעובר CPU throttling, monorepo שמבטל את ה-cache בכל commit, או shard אחד שמחזיק את ה-cluster הכי גדול.</blockquote>`
      }
    },
    {
      h: { en: "Ordering and progressive rollout across clusters", he: "סדר פעולות ו-progressive rollout בין clusters" },
      body: {
        en: `<p><strong>Inside one Application</strong>, order with sync waves and hooks: CRDs and namespaces at wave <code>-2</code>, operators at <code>-1</code>, workloads at <code>0</code>, a <code>PostSync</code> smoke-test Job at the end. Argo CD waits for each wave to be healthy before the next.</p>
<pre>metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"
---
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation</pre>
<p><strong>Across clusters</strong>, a single commit to <code>main</code> syncs everywhere within one reconcile cycle. That is a fleet-wide deploy with no canary. Three ways to make it progressive:</p>
<ol>
<li><strong>Git promotion</strong>: separate paths or branches per env/wave (<code>overlays/prod-wave1</code>, <code>overlays/prod-wave2</code>); promotion is a PR that copies the image tag forward. Simple, auditable, slower. Tools like Kargo automate this promotion flow.</li>
<li><strong>ApplicationSet progressive syncs</strong> (<code>strategy.type: RollingSync</code>): steps that select generated Applications by label, with <code>maxUpdate</code>. It is behind a feature flag in the ApplicationSet controller; check its status for your version.</li>
<li><strong>Per-cluster canary</strong> with Argo Rollouts inside each cluster, combined with 1 or 2.</li>
</ol>
<pre>spec:
  strategy:
    type: RollingSync
    rollingSync:
      steps:
      - matchExpressions: [{ key: wave, operator: In, values: ["1"] }]
      - matchExpressions: [{ key: wave, operator: In, values: ["2"] }]
        maxUpdate: 25%</pre>
<p><strong>Drift and self-heal</strong>: <code>selfHeal: true</code> reverts manual edits within seconds, which is great until an HPA, a mutating webhook or an operator legitimately owns a field. Use <code>ignoreDifferences</code> with <code>RespectIgnoreDifferences=true</code> for <code>/spec/replicas</code> and injected fields, otherwise the app flaps OutOfSync forever (see the <code>k8s-argocd-drift</code> scenario).</p>`,
        he: `<p><strong>בתוך Application אחד</strong> מסדרים עם sync waves ו-hooks. CRDs ו-namespaces בגל <code>-2</code>, operators בגל <code>-1</code>, workloads בגל <code>0</code>, ו-Job של smoke test מסוג <code>PostSync</code> בסוף. Argo CD מחכה שכל גל יהיה healthy לפני הבא.</p>
<pre>metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"
---
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation</pre>
<p><strong>בין clusters</strong>, commit אחד ל-<code>main</code> עושה sync בכל מקום תוך מחזור reconcile אחד. זה deploy לכל הצי בלי קנרית. שלוש דרכים להפוך את זה להדרגתי:</p>
<ol>
<li><strong>קידום ב-Git</strong>: נתיבים או branches נפרדים לכל סביבה או גל (<code>overlays/prod-wave1</code>, <code>overlays/prod-wave2</code>). הקידום הוא PR שמעתיק את ה-image tag קדימה. פשוט, עם audit, אבל איטי יותר. כלים כמו Kargo מבצעים את תהליך הקידום הזה אוטומטית.</li>
<li><strong>Progressive syncs של ApplicationSet</strong> (<code>strategy.type: RollingSync</code>): שלבים שבוחרים Applications לפי label, עם <code>maxUpdate</code>. זה מאחורי feature flag ב-controller של ה-ApplicationSet, אז תבדוק את הסטטוס בגרסה שלך.</li>
<li><strong>קנרית בתוך כל cluster</strong> עם Argo Rollouts, בשילוב עם 1 או 2.</li>
</ol>
<pre>spec:
  strategy:
    type: RollingSync
    rollingSync:
      steps:
      - matchExpressions: [{ key: wave, operator: In, values: ["1"] }]
      - matchExpressions: [{ key: wave, operator: In, values: ["2"] }]
        maxUpdate: 25%</pre>
<p><strong>Drift ו-self-heal</strong>: עם <code>selfHeal: true</code> שינויים ידניים מתבטלים תוך שניות. זה מעולה, עד ש-HPA, mutating webhook או operator מחזיקים שדה באופן לגיטימי. תשתמש ב-<code>ignoreDifferences</code> יחד עם <code>RespectIgnoreDifferences=true</code> על <code>/spec/replicas</code> ועל שדות מוזרקים. אחרת ה-app יקפוץ ל-OutOfSync לנצח (ראה את התרחיש <code>k8s-argocd-drift</code>).</p>`
      }
    },
    {
      h: { en: "Secrets, image updates and notifications", he: "Secrets, עדכוני images והתראות" },
      body: {
        en: `<p><strong>Secrets</strong>: Git holds a <em>reference</em>, never the value. External Secrets Operator (ESO) syncs from AWS Secrets Manager / SSM / Vault into a Kubernetes Secret, authenticating with Pod Identity or IRSA. A <code>ClusterSecretStore</code> per cluster, scoped by IAM to that cluster's secret path prefix, keeps one compromised cluster from reading another's secrets.</p>
<pre>apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: checkout-db, namespace: checkout }
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target: { name: checkout-db, creationPolicy: Owner }
  data:
  - secretKey: password
    remoteRef: { key: prod/eu-west-1/checkout/db, property: password }</pre>
<p><strong>Image updates</strong>: two patterns. CI writes back (the build pipeline opens a PR or commits the new tag to the env overlay; Renovate does the same for charts), or <strong>Argo CD Image Updater</strong> watches the registry and commits the new tag to Git (<code>write-back-method: git</code>). Avoid the mode that only patches the live Application: Git stops being the truth. Newer Image Updater releases configure this through a CRD instead of annotations; check its docs.</p>
<p><strong>Notifications</strong>: the built-in notifications controller sends to Slack, PagerDuty, webhooks on triggers like <code>on-sync-failed</code> and <code>on-health-degraded</code>. Subscribe per Application through the ApplicationSet template so every generated app inherits it.</p>
<pre>metadata:
  annotations:
    notifications.argoproj.io/subscribe.on-sync-failed.slack: deploys-payments
    notifications.argoproj.io/subscribe.on-health-degraded.pagerduty: payments-oncall</pre>`,
        he: `<p><strong>Secrets</strong>: ב-Git יש <em>הפניה</em>, אף פעם לא הערך עצמו. External Secrets Operator (ESO) מסנכרן מ-AWS Secrets Manager, מ-SSM או מ-Vault לתוך Secret של Kubernetes, ומזדהה עם Pod Identity או IRSA. <code>ClusterSecretStore</code> לכל cluster, שמוגבל ב-IAM ל-prefix של ה-secrets של אותו cluster, מונע מ-cluster פרוץ אחד לקרוא secrets של cluster אחר.</p>
<pre>apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: checkout-db, namespace: checkout }
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target: { name: checkout-db, creationPolicy: Owner }
  data:
  - secretKey: password
    remoteRef: { key: prod/eu-west-1/checkout/db, property: password }</pre>
<p><strong>עדכוני images</strong>: שתי תבניות. או שה-CI כותב בחזרה: ה-pipeline של ה-build פותח PR או עושה commit של ה-tag החדש ל-overlay של הסביבה, ו-Renovate עושה אותו דבר ל-charts. או ש-<strong>Argo CD Image Updater</strong> עוקב אחרי ה-registry ועושה commit של ה-tag החדש ל-Git (<code>write-back-method: git</code>). תימנע מה-mode שרק עושה patch ל-Application החי, כי אז Git מפסיק להיות האמת. גרסאות חדשות של Image Updater מוגדרות דרך CRD במקום annotations, אז תבדוק ב-docs שלו.</p>
<p><strong>התראות</strong>: ה-notifications controller המובנה שולח ל-Slack, ל-PagerDuty או ל-webhooks לפי triggers כמו <code>on-sync-failed</code> ו-<code>on-health-degraded</code>. תעשה subscribe לכל Application דרך ה-template של ה-ApplicationSet, כך שכל app שנוצר יורש את זה.</p>
<pre>metadata:
  annotations:
    notifications.argoproj.io/subscribe.on-sync-failed.slack: deploys-payments
    notifications.argoproj.io/subscribe.on-health-degraded.pagerduty: payments-oncall</pre>`
      }
    }
  ],
  diagram: `Git (apps/ + clusters/ + platform/)
   │ webhook
   ▼
[hub Argo CD: prod]  repo-server x6 ─ redis
   │ ApplicationSets (clusters × apps, by labels)
   ├─ shard 0 ──► prod-euw1-a, prod-euw1-b
   ├─ shard 1 ──► prod-use1-a, prod-use1-b
   └─ shard 2 ──► prod-apse1-a ...
each cluster: ESO ◄── AWS Secrets Manager (Pod Identity)`,
  handsOn: [
    { cmd: "argocd appset list && argocd app list -l app=checkout -o wide", what: { en: "List ApplicationSets and the Applications one of them generated across clusters, with sync and health status.", he: "מציג את ה-ApplicationSets ואת ה-Applications שאחד מהם ייצר על פני ה-clusters, עם סטטוס sync ו-health." } },
    { cmd: "argocd appset generate appset-checkout.yaml -o yaml | grep -E '^ *name: checkout-'", what: { en: "Dry-run a generator locally: see which Applications it would create before you merge a selector change.", he: "מריץ generator ב-dry-run: רואים אילו Applications ייווצרו לפני שעושים merge לשינוי ב-selector." } },
    { cmd: "kubectl -n argocd get secret -l argocd.argoproj.io/secret-type=cluster -o custom-columns=NAME:.metadata.name,WAVE:.metadata.labels.fleet\\.example\\.com/wave,SHARD:.data.shard", what: { en: "Show registered clusters with their wave label and any pinned controller shard.", he: "מציג את ה-clusters הרשומים עם ה-label של הגל ועם ה-shard של ה-controller אם הוא נעוץ." } },
    { cmd: "kubectl -n argocd top pods -l app.kubernetes.io/name=argocd-repo-server", what: { en: "Check repo-server CPU; sustained saturation right after commits means manifest generation is the bottleneck.", he: "בודק את ה-CPU של ה-repo-server. רוויה מתמשכת מיד אחרי commits אומרת שייצור ה-manifests הוא צוואר הבקבוק." } },
    { cmd: "kubectl get externalsecret -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,READY:.status.conditions[0].status,REASON:.status.conditions[0].reason", what: { en: "Find ExternalSecrets that failed to sync (wrong path, missing IAM permission).", he: "מוצא ExternalSecrets שנכשלו ב-sync (נתיב שגוי או הרשאת IAM חסרה)." } }
  ],
  mnemonic: {
    en: "\"What, Where, Who, How fast\": apps are the what, cluster labels are the where, the hub or per-cluster instance is the who, waves and shards are how fast.",
    he: "\"מה, איפה, מי, כמה מהר\": ה-apps הם המה, ה-labels של ה-clusters הם האיפה, ה-hub או ה-instance בכל cluster הם המי, וגלים ו-shards קובעים כמה מהר."
  },
  pitfalls: [
    { en: "One commit to main deploys to every cluster at once. Without per-wave paths or progressive syncs, GitOps is a fleet-wide big-bang deploy.", he: "commit אחד ל-main עושה deploy לכל ה-clusters בבת אחת. בלי נתיבים לכל גל או progressive syncs, GitOps הוא deploy של big-bang לכל הצי." },
    { en: "A generator that returns zero results (renamed label, typo in a path) deletes every generated Application. Use a create-update policy, missingkey=error, and review generator diffs in CI.", he: "generator שמחזיר אפס תוצאות (label ששינו לו שם, טעות בנתיב) מוחק את כל ה-Applications שנוצרו. תשתמש במדיניות create-update, ב-missingkey=error, ותעשה review ל-diff של ה-generators ב-CI." },
    { en: "Giving the hub cluster-admin on every spoke and leaving it in a shared cluster. The hub is the most privileged system you own; isolate it and use per-cluster IAM roles.", he: "לתת ל-hub הרשאות cluster-admin על כל spoke ולהשאיר אותו ב-cluster משותף. ה-hub הוא המערכת עם הכי הרבה הרשאות שיש לך. תבודד אותו ותשתמש ב-IAM roles נפרדים לכל cluster." },
    { en: "Scaling the controller while repo-server is the bottleneck. Check pending repo requests and render time first; more controller shards will just wait faster.", he: "להגדיל את ה-controller כשה-repo-server הוא צוואר הבקבוק. קודם תבדוק בקשות ממתינות ל-repo וזמן render. עוד shards ל-controller פשוט יחכו מהר יותר." }
  ],
  interview: [
    {
      q: { en: "Design GitOps for 40 clusters and 300 services. How do you structure repos and Argo CD?", he: "תתכנן GitOps ל-40 clusters ו-300 שירותים. איך תבנה את ה-repos ואת Argo CD?" },
      a: {
        en: "Separate app source repos from a config repo. In the config repo: apps with base plus env overlays, a clusters folder with labels/metadata, and platform add-ons. Argo CD as one hub per environment (prod and non-prod) in a dedicated management cluster, registering clusters with labels for env, region and wave. ApplicationSets with matrix generators (clusters × apps) produce Applications, with a create-update policy so a bad generator cannot mass-delete. Rollout across clusters is progressive: image tags promoted per wave by PR (or RollingSync), with Argo Rollouts canaries inside each cluster. Secrets via ESO with per-cluster IAM scope. Scale: webhooks instead of polling, controller sharding by cluster with round-robin, repo-server replicas sized by render time, manifest-generate-paths in the monorepo, alerts on reconcile latency and pending repo requests.",
        he: "מפרידים בין repos של קוד האפליקציה ל-repo של config. ב-repo של ה-config יש apps עם base ו-overlays לכל סביבה, תיקיית clusters עם labels ו-metadata, ו-add-ons של הפלטפורמה. Argo CD בתור hub אחד לכל סביבה (prod ו-non-prod) ב-management cluster ייעודי, וכל cluster נרשם עם labels של סביבה, region וגל. ApplicationSets עם matrix generators (clusters כפול apps) מייצרים את ה-Applications, עם מדיניות create-update כדי ש-generator שבור לא ימחק הכל. הפריסה בין clusters הדרגתית: image tags מקודמים לפי גל דרך PR (או RollingSync), ובתוך כל cluster יש קנרית עם Argo Rollouts. Secrets דרך ESO עם הרשאות IAM לכל cluster. Scale: webhooks במקום polling, sharding של ה-controller לפי cluster עם round-robin, replicas של repo-server לפי זמן render, manifest-generate-paths ב-monorepo, והתראות על latency של reconcile ועל בקשות repo ממתינות."
      }
    },
    {
      q: { en: "Argo CD takes 15 minutes to reflect a commit. How do you debug it?", he: "לוקח ל-Argo CD רבע שעה להגיב ל-commit. איך אתה מדבג?" },
      a: {
        en: "Split the pipeline: did Argo CD learn about the commit (webhook delivered or waiting for the 3-minute poll plus jitter)? Is the repo-server queue backed up (argocd_repo_pending_request_total, CPU throttling, render duration per app)? Is the controller queue backed up (reconcile histogram, processors count, one hot shard)? Typical root causes: no webhook, a monorepo where every commit invalidates all apps' caches, Helm charts with heavy dependencies rendered thousands of times, CPU limits on repo-server. Fixes match: webhooks, manifest-generate-paths, more repo-server replicas and parallelism limits, rendered manifests in CI, rebalancing shards.",
        he: "מפרקים את הצינור. האם Argo CD בכלל שמע על ה-commit (webhook הגיע, או שמחכים ל-poll של 3 דקות ועוד jitter)? האם התור של ה-repo-server עמוס (argocd_repo_pending_request_total, CPU throttling, זמן render לכל app)? האם התור של ה-controller עמוס (ה-histogram של reconcile, מספר ה-processors, shard אחד חם)? הסיבות הנפוצות: אין webhook, monorepo שבו כל commit מבטל את ה-cache של כל ה-apps, Helm charts עם dependencies כבדים שמרונדרים אלפי פעמים, CPU limits על ה-repo-server. התיקונים בהתאם: webhooks, manifest-generate-paths, עוד replicas ו-parallelism limit ל-repo-server, rendered manifests ב-CI, ואיזון מחדש של ה-shards."
      }
    }
  ],
  quiz: [
    {
      q: { en: "How does the Argo CD application controller shard its work?", he: "איך ה-application controller של Argo CD מחלק את העבודה ל-shards?" },
      options: [
        { en: "By Application name hash", he: "לפי hash של שם ה-Application" },
        { en: "By destination cluster", he: "לפי ה-cluster של היעד" },
        { en: "By Git repository", he: "לפי repository ב-Git" },
        { en: "By namespace", he: "לפי namespace" }
      ],
      answer: 1,
      explain: { en: "Sharding is per cluster, because the watch cache is per cluster. A single huge cluster cannot be split across shards.", he: "ה-sharding הוא לפי cluster, כי ה-watch cache הוא לכל cluster. cluster ענק אחד אי אפשר לפצל בין shards." }
    },
    {
      q: { en: "A label on cluster secrets is renamed and the cluster generator now matches nothing. With default settings and automated prune, what is the risk?", he: "שינו שם של label על ה-cluster secrets, ועכשיו ה-cluster generator לא מתאים לכלום. עם הגדרות ברירת מחדל ו-prune אוטומטי, מה הסיכון?" },
      options: [
        { en: "Nothing, ApplicationSets never delete Applications", he: "שום דבר, ApplicationSets אף פעם לא מוחקים Applications" },
        { en: "The generated Applications are deleted, and their resources can be pruned", he: "ה-Applications שנוצרו נמחקים, וה-resources שלהם יכולים לעבור prune" },
        { en: "Argo CD pauses all syncs", he: "Argo CD עוצר את כל ה-syncs" },
        { en: "Only the UI stops showing them", he: "רק ה-UI מפסיק להציג אותם" }
      ],
      answer: 1,
      explain: { en: "By default the ApplicationSet controller deletes Applications no longer produced by the generator. Use the create-update policy or preserveResourcesOnDeletion to avoid a mass deletion.", he: "כברירת מחדל, ה-controller של ה-ApplicationSet מוחק Applications שה-generator כבר לא מייצר. תשתמש במדיניות create-update או ב-preserveResourcesOnDeletion כדי למנוע מחיקה המונית." }
    },
    {
      q: { en: "In a monorepo with 2000 apps, every commit causes a CPU spike on repo-server. Which change helps most directly?", he: "ב-monorepo עם 2000 apps, כל commit גורם לקפיצת CPU ב-repo-server. איזה שינוי עוזר הכי ישירות?" },
      options: [
        { en: "More application-controller shards", he: "עוד shards ל-application-controller" },
        { en: "Lower timeout.reconciliation", he: "להוריד את timeout.reconciliation" },
        { en: "manifest-generate-paths annotations so only apps whose paths changed regenerate", he: "annotations של manifest-generate-paths, כך שרק apps שהנתיבים שלהם השתנו נבנים מחדש" },
        { en: "Turning off selfHeal", he: "לכבות את selfHeal" }
      ],
      answer: 2,
      explain: { en: "The cost is manifest regeneration triggered by the repo-wide revision change. Scoping regeneration to changed paths (or pre-rendering in CI) removes the work; more controller shards don't.", he: "העלות היא ייצור manifests מחדש שנגרם משינוי ה-revision של כל ה-repo. הגבלת הייצור לנתיבים ששונו (או רינדור מראש ב-CI) מורידה את העבודה. עוד shards ל-controller לא." }
    },
    {
      q: { en: "Where should a database password for a GitOps-managed app live?", he: "איפה צריכה לשבת סיסמת database של app שמנוהל ב-GitOps?" },
      options: [
        { en: "Base64 in a Secret manifest in Git", he: "ב-Base64 בתוך manifest של Secret ב-Git" },
        { en: "In the Helm values file of the prod overlay", he: "בקובץ ה-values של Helm ב-overlay של prod" },
        { en: "In a secret manager; Git holds an ExternalSecret that references it", he: "ב-secret manager, וב-Git יש ExternalSecret שמפנה אליו" },
        { en: "In an Argo CD Application parameter override", he: "ב-parameter override של Application ב-Argo CD" }
      ],
      answer: 2,
      explain: { en: "Base64 is encoding, not encryption, and values files are plain text. ESO keeps the value in the secret manager with IAM scoping; Git only stores the reference.", he: "Base64 זה קידוד, לא הצפנה, וקבצי values הם טקסט גלוי. ESO משאיר את הערך ב-secret manager עם הגבלת IAM, ו-Git שומר רק את ההפניה." }
    }
  ],
  related: ["k8s-argocd", "k8s-helm-gitops", "k8s-argo-rollouts", "k8s-multi-cluster", "k8s-fleet-upgrades", "cloud-secrets-management"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "istio-in-production",
  track: "kubernetes",
  order: 53,
  icon: "🕸️",
  level: 3,
  minutes: 18,
  title: { en: "Istio in Production: Traffic, mTLS and Debugging", he: "Istio ב-production: תעבורה, mTLS ודיבאג" },
  tldr: {
    en: "istiod turns Kubernetes objects into Envoy config and pushes it over xDS to sidecars (or to ztunnel and waypoints in ambient mode). In production you use it for three things: shaping traffic (canary weights, timeouts, retries, outlier detection), identity (STRICT mTLS plus AuthorizationPolicy, migrated through PERMISSIVE), and visibility. Most incidents are debugged with three commands: istioctl analyze, proxy-status and proxy-config, plus the response flags in the Envoy access log.",
    he: "ה-istiod הופך אובייקטים של Kubernetes ל-config של Envoy ודוחף אותו ב-xDS ל-sidecars, או ל-ztunnel ול-waypoints ב-ambient mode. ב-production משתמשים בו לשלושה דברים: עיצוב תעבורה (משקלים לקנרית, timeouts, retries, outlier detection), זהות (STRICT mTLS ועוד AuthorizationPolicy, עם מעבר דרך PERMISSIVE), ונראות. רוב התקלות מדובגות עם שלוש פקודות: istioctl analyze, proxy-status ו-proxy-config, ועוד ה-response flags ב-access log של Envoy."
  },
  analogy: {
    en: "Sidecar mode puts a personal bodyguard next to every employee: he checks badges, carries messages and writes down every conversation, but you pay for 500 bodyguards. Ambient mode replaces them with a security desk on each floor (ztunnel, checks badges and encrypts) and, only for departments that need it, a concierge (waypoint) who reads the content of requests and routes them. Same rules, far fewer people.",
    he: "Sidecar mode שם שומר ראש אישי ליד כל עובד. הוא בודק תגים, מעביר הודעות ורושם כל שיחה, אבל אתה משלם על 500 שומרי ראש. Ambient mode מחליף אותם בעמדת ביטחון בכל קומה (ztunnel, בודק תגים ומצפין), ורק למחלקות שצריכות את זה יש קונסיירז' (waypoint) שקורא את תוכן הבקשות ומנתב אותן. אותם חוקים, הרבה פחות אנשים."
  },
  sections: [
    {
      h: { en: "Architecture: istiod, xDS, sidecar vs ambient", he: "ארכיטקטורה: istiod, xDS, sidecar מול ambient" },
      body: {
        en: `<p><strong>istiod</strong> is the control plane: it watches Services, EndpointSlices, Pods and Istio CRDs, acts as the CA that signs workload certificates (SPIFFE IDs like <code>spiffe://cluster.local/ns/payments/sa/checkout</code>, short-lived, rotated automatically), and serves Envoy configuration over <strong>xDS</strong> (gRPC streams: LDS listeners, RDS routes, CDS clusters, EDS endpoints, SDS secrets). If istiod is down, existing proxies keep their last config; new Pods can't get certificates and nothing changes until it returns.</p>
<table>
<tr><th></th><th>Sidecar mode</th><th>Ambient mode (GA since Istio 1.24)</th></tr>
<tr><td>Data plane</td><td>Envoy container in every Pod</td><td><strong>ztunnel</strong> DaemonSet per node (L4: mTLS, L4 authz, telemetry) + optional <strong>waypoint</strong> Envoy per namespace/service for L7</td></tr>
<tr><td>Enrol</td><td>Label namespace, restart Pods to inject</td><td>Label namespace <code>istio.io/dataplane-mode=ambient</code>, no restart</td></tr>
<tr><td>Wire protocol</td><td>mTLS between Envoys</td><td>HBONE: HTTP CONNECT tunnel over mTLS on port 15008</td></tr>
<tr><td>Cost</td><td>Typically ~50-100m CPU and ~50-150 MiB RAM per sidecar at rest, more under load (measure yours)</td><td>One ztunnel per node; L7 cost only where a waypoint exists</td></tr>
<tr><td>L7 features (retries, header routing, L7 authz)</td><td>Everywhere</td><td>Only through a waypoint</td></tr>
<tr><td>Gotchas</td><td>Startup ordering (app starts before proxy), Jobs that never exit, resource overhead</td><td>Newer, fewer battle scars; some features differ; L7 policy without a waypoint is silently not enforced (istioctl analyze warns)</td></tr>
</table>
<pre># sidecar: revision-labelled namespace (see upgrades below)
kubectl label ns payments istio.io/rev=prod-stable
# ambient: enrol a namespace, then add a waypoint for L7
kubectl label ns payments istio.io/dataplane-mode=ambient
istioctl waypoint apply -n payments --enroll-namespace
istioctl ztunnel-config workloads | grep payments</pre>`,
        he: `<p><strong>istiod</strong> הוא ה-control plane. הוא עושה watch על Services, EndpointSlices, Pods ו-CRDs של Istio. הוא ה-CA שחותם על התעודות של ה-workloads: SPIFFE IDs כמו <code>spiffe://cluster.local/ns/payments/sa/checkout</code>, קצרי חיים ומתחלפים אוטומטית. והוא מגיש config של Envoy דרך <strong>xDS</strong>, כלומר streams של gRPC: LDS ל-listeners, RDS ל-routes, CDS ל-clusters, EDS ל-endpoints ו-SDS ל-secrets. אם istiod נופל, ה-proxies הקיימים שומרים את ה-config האחרון. Pods חדשים לא מקבלים תעודות, ושום דבר לא משתנה עד שהוא חוזר.</p>
<table>
<tr><th></th><th>Sidecar mode</th><th>Ambient mode (GA מאז Istio 1.24)</th></tr>
<tr><td>Data plane</td><td>container של Envoy בכל Pod</td><td>DaemonSet של <strong>ztunnel</strong> בכל node (L4: mTLS, authz ב-L4, טלמטריה), ועוד <strong>waypoint</strong> אופציונלי של Envoy לכל namespace או service בשביל L7</td></tr>
<tr><td>צירוף</td><td>label על ה-namespace ו-restart ל-Pods כדי להזריק</td><td>label על ה-namespace: <code>istio.io/dataplane-mode=ambient</code>, בלי restart</td></tr>
<tr><td>פרוטוקול על החוט</td><td>mTLS בין Envoys</td><td>HBONE: מנהרת HTTP CONNECT מעל mTLS בפורט 15008</td></tr>
<tr><td>עלות</td><td>בדרך כלל ~50-100m CPU ו-~50-150 MiB זיכרון לכל sidecar במנוחה, יותר תחת עומס (תמדוד אצלך)</td><td>ztunnel אחד לכל node. עלות L7 רק איפה שיש waypoint</td></tr>
<tr><td>יכולות L7 (retries, ניתוב לפי headers, authz ב-L7)</td><td>בכל מקום</td><td>רק דרך waypoint</td></tr>
<tr><td>מלכודות</td><td>סדר עלייה (האפליקציה עולה לפני ה-proxy), Jobs שלא מסתיימים, תקורת משאבים</td><td>חדש יותר, פחות צלקות מקרבות. חלק מהיכולות שונות. policy של L7 בלי waypoint פשוט לא נאכף בשקט (istioctl analyze מזהיר)</td></tr>
</table>
<pre># sidecar: revision-labelled namespace (see upgrades below)
kubectl label ns payments istio.io/rev=prod-stable
# ambient: enrol a namespace, then add a waypoint for L7
kubectl label ns payments istio.io/dataplane-mode=ambient
istioctl waypoint apply -n payments --enroll-namespace
istioctl ztunnel-config workloads | grep payments</pre>`
      }
    },
    {
      h: { en: "Traffic: Gateway API vs VirtualService/DestinationRule, canaries, resilience", he: "תעבורה: Gateway API מול VirtualService ו-DestinationRule, קנריות, חוסן" },
      body: {
        en: `<p>Istio supports two APIs. The Kubernetes <strong>Gateway API</strong> (Gateway, HTTPRoute, GRPCRoute) is the recommended direction and the only one for ambient waypoints; the classic <strong>Istio APIs</strong> (Gateway, VirtualService, DestinationRule) are still fully supported and have more knobs. A 90/10 canary in each:</p>
<pre># Gateway API (mesh traffic: parentRef is the Service, the GAMMA pattern)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: checkout, namespace: payments }
spec:
  parentRefs: [{ group: "", kind: Service, name: checkout, port: 8080 }]
  rules:
  - backendRefs:
    - { name: checkout-v1, port: 8080, weight: 90 }
    - { name: checkout-v2, port: 8080, weight: 10 }
    timeouts: { request: 2s }
---
# Istio APIs
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata: { name: checkout, namespace: payments }
spec:
  hosts: [checkout]
  http:
  - match: [{ headers: { x-canary: { exact: "true" } } }]
    route: [{ destination: { host: checkout, subset: v2 } }]
  - route:
    - { destination: { host: checkout, subset: v1 }, weight: 90 }
    - { destination: { host: checkout, subset: v2 }, weight: 10 }
    timeout: 2s
    retries: { attempts: 2, perTryTimeout: 600ms, retryOn: "connect-failure,refused-stream,unavailable,503" }
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata: { name: checkout, namespace: payments }
spec:
  host: checkout
  subsets:
  - { name: v1, labels: { version: v1 } }
  - { name: v2, labels: { version: v2 } }
  trafficPolicy:
    connectionPool:
      tcp: { maxConnections: 200 }
      http: { http1MaxPendingRequests: 100, http2MaxRequests: 500 }
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50</pre>
<p>Resilience rules that matter in interviews and in incidents:</p>
<ul>
<li><strong>Timeouts</strong>: Istio HTTP routes have no route timeout by default. Set one, and make <code>perTryTimeout × attempts</code> fit inside it and inside the caller's own timeout.</li>
<li><strong>Retries</strong> multiply: 3 layers × 3 attempts = up to 27 calls to the bottom service during a brownout. Retry at one layer, only idempotent requests, with a retry budget mindset.</li>
<li><strong>Outlier detection</strong> ejects a bad Pod from the load-balancing pool per client proxy; <code>maxEjectionPercent</code> stops it from ejecting everything when the whole service is unhealthy.</li>
<li><strong>connectionPool</strong> limits are circuit breakers: overflow returns 503 with flag <code>UO</code> immediately, which protects the backend but looks like an outage if sized too small.</li>
</ul>`,
        he: `<p>Istio תומך בשני APIs. <strong>Gateway API</strong> של Kubernetes (Gateway, HTTPRoute, GRPCRoute) הוא הכיוון המומלץ, והיחיד שעובד עם waypoints ב-ambient. ה-<strong>APIs הקלאסיים של Istio</strong> (Gateway, VirtualService, DestinationRule) עדיין נתמכים במלואם ויש להם יותר כפתורים. קנרית של 90/10 בכל אחד מהם:</p>
<pre># Gateway API (mesh traffic: parentRef is the Service, the GAMMA pattern)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: checkout, namespace: payments }
spec:
  parentRefs: [{ group: "", kind: Service, name: checkout, port: 8080 }]
  rules:
  - backendRefs:
    - { name: checkout-v1, port: 8080, weight: 90 }
    - { name: checkout-v2, port: 8080, weight: 10 }
    timeouts: { request: 2s }
---
# Istio APIs
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata: { name: checkout, namespace: payments }
spec:
  hosts: [checkout]
  http:
  - match: [{ headers: { x-canary: { exact: "true" } } }]
    route: [{ destination: { host: checkout, subset: v2 } }]
  - route:
    - { destination: { host: checkout, subset: v1 }, weight: 90 }
    - { destination: { host: checkout, subset: v2 }, weight: 10 }
    timeout: 2s
    retries: { attempts: 2, perTryTimeout: 600ms, retryOn: "connect-failure,refused-stream,unavailable,503" }
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata: { name: checkout, namespace: payments }
spec:
  host: checkout
  subsets:
  - { name: v1, labels: { version: v1 } }
  - { name: v2, labels: { version: v2 } }
  trafficPolicy:
    connectionPool:
      tcp: { maxConnections: 200 }
      http: { http1MaxPendingRequests: 100, http2MaxRequests: 500 }
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50</pre>
<p>חוקי חוסן שחשובים בראיונות ובתקלות:</p>
<ul>
<li><strong>Timeouts</strong>: ל-routes של HTTP ב-Istio אין timeout כברירת מחדל. תגדיר אחד, ותוודא שמכפלת <code>perTryTimeout × attempts</code> נכנסת בתוכו ובתוך ה-timeout של מי שקורא לך.</li>
<li><strong>Retries</strong> מתכפלים: 3 שכבות כפול 3 ניסיונות זה עד 27 קריאות לשירות התחתון בזמן brownout. תעשה retry בשכבה אחת, רק לבקשות idempotent, ותחשוב במונחים של retry budget.</li>
<li><strong>Outlier detection</strong> מוציא Pod בעייתי מה-pool של ה-load balancing, בנפרד בכל proxy של client. ה-<code>maxEjectionPercent</code> מונע ממנו להוציא את כולם כשכל השירות לא בריא.</li>
<li>המגבלות ב-<strong>connectionPool</strong> הן circuit breakers. חריגה מחזירה מיד 503 עם ה-flag <code>UO</code>. זה מגן על ה-backend, אבל אם הגודל קטן מדי זה נראה כמו השבתה.</li>
</ul>`
      }
    },
    {
      h: { en: "mTLS and authorization: getting to STRICT without an outage", he: "mTLS ו-authorization: להגיע ל-STRICT בלי תקלה" },
      body: {
        en: `<p><code>PeerAuthentication</code> controls what a workload <strong>accepts</strong>. <code>PERMISSIVE</code> (the default) accepts both mTLS and plaintext; <code>STRICT</code> accepts only mTLS. Clients inside the mesh use mTLS automatically (auto mTLS), so the only thing STRICT breaks is <strong>callers without a proxy</strong>: legacy VMs, Pods in non-injected namespaces, kubelet-style probes in some setups, Prometheus scraping without certs, jobs with <code>sidecar.istio.io/inject: "false"</code>.</p>
<p>The safe migration is data-driven:</p>
<ol>
<li>Mesh-wide PERMISSIVE. Enrol workloads.</li>
<li>Measure plaintext traffic per destination: the <code>connection_security_policy</code> label on the server-side metric.</li>
<li>When a namespace shows zero <code>none</code>, switch that namespace to STRICT. Keep exceptions explicit (a port, a workload) with a ticket and an owner.</li>
<li>Finally, STRICT in the root namespace (<code>istio-system</code>) for the whole mesh.</li>
</ol>
<pre># who still sends plaintext to payments? (last 1h)
sum by (source_workload, source_workload_namespace, destination_workload) (
  rate(istio_requests_total{reporter="destination", destination_workload_namespace="payments",
       connection_security_policy="none"}[1h]))
---
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata: { name: default, namespace: payments }
spec:
  mtls: { mode: STRICT }
  # exception for a metrics port scraped without mTLS:
  # selector: { matchLabels: { app: checkout } }
  # portLevelMtls: { "9090": { mode: PERMISSIVE } }
---
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: checkout-allow, namespace: payments }
spec:
  selector: { matchLabels: { app: checkout } }
  action: ALLOW
  rules:
  - from: [{ source: { principals: ["cluster.local/ns/frontend/sa/web"] } }]
    to: [{ operation: { methods: ["POST"], paths: ["/api/v1/orders*"] } }]</pre>
<p>AuthorizationPolicy semantics to know cold: once any ALLOW policy selects a workload, everything not matched is denied; DENY is evaluated before ALLOW; <code>principals</code> require mTLS (a plaintext caller has no principal and is denied); an empty <code>spec: {}</code> in a namespace means deny-all. Roll out with <code>action: AUDIT</code> or a dry-run annotation first and check the logs.</p>`,
        he: `<p><code>PeerAuthentication</code> קובע מה workload <strong>מקבל</strong>. <code>PERMISSIVE</code> (ברירת המחדל) מקבל גם mTLS וגם plaintext. <code>STRICT</code> מקבל רק mTLS. clients בתוך ה-mesh משתמשים ב-mTLS אוטומטית (auto mTLS), ולכן הדבר היחיד ש-STRICT שובר הוא <strong>קוראים בלי proxy</strong>: VMs ישנים, Pods ב-namespaces בלי injection, probes בסגנון kubelet בחלק מההגדרות, Prometheus שעושה scrape בלי תעודות, ו-jobs עם <code>sidecar.istio.io/inject: "false"</code>.</p>
<p>המעבר הבטוח מבוסס נתונים:</p>
<ol>
<li>PERMISSIVE על כל ה-mesh. מצרפים workloads.</li>
<li>מודדים תעבורת plaintext לכל יעד, לפי ה-label בשם <code>connection_security_policy</code> ב-metric של צד השרת.</li>
<li>כש-namespace מראה אפס <code>none</code>, מעבירים אותו ל-STRICT. חריגים נשארים מפורשים (פורט או workload), עם ticket ובעלים.</li>
<li>בסוף, STRICT ב-root namespace (<code>istio-system</code>) לכל ה-mesh.</li>
</ol>
<pre># who still sends plaintext to payments? (last 1h)
sum by (source_workload, source_workload_namespace, destination_workload) (
  rate(istio_requests_total{reporter="destination", destination_workload_namespace="payments",
       connection_security_policy="none"}[1h]))
---
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata: { name: default, namespace: payments }
spec:
  mtls: { mode: STRICT }
  # exception for a metrics port scraped without mTLS:
  # selector: { matchLabels: { app: checkout } }
  # portLevelMtls: { "9090": { mode: PERMISSIVE } }
---
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: checkout-allow, namespace: payments }
spec:
  selector: { matchLabels: { app: checkout } }
  action: ALLOW
  rules:
  - from: [{ source: { principals: ["cluster.local/ns/frontend/sa/web"] } }]
    to: [{ operation: { methods: ["POST"], paths: ["/api/v1/orders*"] } }]</pre>
<p>הסמנטיקה של AuthorizationPolicy שצריך לדעת בעל פה: ברגע שיש policy של ALLOW שבוחר workload, כל מה שלא תואם נחסם. DENY נבדק לפני ALLOW. <code>principals</code> דורשים mTLS, כי ל-caller ב-plaintext אין principal והוא נחסם. ו-<code>spec: {}</code> ריק ב-namespace אומר לחסום הכל. תפרוס קודם עם <code>action: AUDIT</code> או עם annotation של dry-run, ותבדוק את הלוגים.</p>`
      }
    },
    {
      h: { en: "Egress control: ServiceEntry, REGISTRY_ONLY and egress gateways", he: "שליטה ב-egress: ServiceEntry, REGISTRY_ONLY ו-egress gateways" },
      body: {
        en: `<p>By default (<code>outboundTrafficPolicy: ALLOW_ANY</code>) the sidecar passes unknown destinations through. With <code>REGISTRY_ONLY</code>, anything not in the service registry goes to <code>BlackHoleCluster</code> (HTTP gets 502, TLS gets a reset), so every external dependency must be declared with a <code>ServiceEntry</code>. That is an inventory of your egress, which security teams love.</p>
<pre>apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata: { name: stripe-api, namespace: payments }
spec:
  hosts: [api.stripe.com]
  location: MESH_EXTERNAL
  ports: [{ number: 443, name: tls, protocol: TLS }]
  resolution: DNS
  exportTo: ["."]          # only this namespace may use it</pre>
<p>An <strong>egress gateway</strong> funnels external traffic through dedicated Pods on dedicated nodes, so you can give them fixed NAT IPs (partners allow-list them), log every outbound call, and apply policy in one place. The sidecar alone is not a security boundary for egress: a compromised Pod can bypass its own proxy, so pair it with NetworkPolicy or security groups that only let the egress gateway nodes out.</p>`,
        he: `<p>כברירת מחדל (<code>outboundTrafficPolicy: ALLOW_ANY</code>) ה-sidecar מעביר יעדים לא מוכרים. עם <code>REGISTRY_ONLY</code>, כל מה שלא נמצא ב-service registry הולך ל-<code>BlackHoleCluster</code>: ב-HTTP מקבלים 502, וב-TLS מקבלים reset. כלומר כל תלות חיצונית חייבת להיות מוצהרת עם <code>ServiceEntry</code>. זה נותן מלאי של כל ה-egress שלך, וצוותי security אוהבים את זה.</p>
<pre>apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata: { name: stripe-api, namespace: payments }
spec:
  hosts: [api.stripe.com]
  location: MESH_EXTERNAL
  ports: [{ number: 443, name: tls, protocol: TLS }]
  resolution: DNS
  exportTo: ["."]          # only this namespace may use it</pre>
<p><strong>Egress gateway</strong> מעביר את התעבורה החיצונית דרך Pods ייעודיים על nodes ייעודיים. ככה אפשר לתת להם כתובות NAT קבועות ששותפים מכניסים ל-allow-list, לרשום כל קריאה יוצאת, ולהחיל policy במקום אחד. ה-sidecar לבד הוא לא גבול אבטחה ל-egress: Pod פרוץ יכול לעקוף את ה-proxy של עצמו. לכן תשלב את זה עם NetworkPolicy או security groups שמאפשרים יציאה רק מה-nodes של ה-egress gateway.</p>`
      }
    },
    {
      h: { en: "Debugging: response flags, 503s and the istioctl toolbox", he: "דיבאג: response flags, שגיאות 503 וארגז הכלים של istioctl" },
      body: {
        en: `<p>When the mesh returns 503, the Envoy access log tells you <strong>who</strong> produced it and <strong>why</strong>. Enable access logs (Telemetry API or <code>meshConfig.accessLogFile: /dev/stdout</code>) and read the response flags:</p>
<table>
<tr><th>Flag</th><th>Meaning</th><th>Usual cause</th></tr>
<tr><td><code>UH</code></td><td>No healthy upstream</td><td>Zero ready endpoints, or all ejected by outlier detection</td></tr>
<tr><td><code>UF</code></td><td>Upstream connection failure</td><td>Pod not listening, mTLS mismatch, NetworkPolicy drop</td></tr>
<tr><td><code>UO</code></td><td>Upstream overflow (circuit breaker)</td><td>connectionPool limits too low, or a real overload</td></tr>
<tr><td><code>NR</code></td><td>No route configured / no filter chain</td><td>Missing route, wrong host/port name; on the inbound side <code>filter_chain_not_found</code> = plaintext hitting a STRICT port</td></tr>
<tr><td><code>URX</code></td><td>Upstream retry limit exceeded</td><td>Every retry failed; look at what the retries saw</td></tr>
<tr><td><code>UC</code> / <code>UT</code></td><td>Upstream connection terminated / timed out</td><td>Keepalive mismatch with the app (app closes idle connections first), slow backend</td></tr>
<tr><td><code>DC</code></td><td>Downstream closed</td><td>The caller gave up (its own timeout)</td></tr>
</table>
<pre>[2026-11-17T09:14:03.112Z] "POST /api/v1/orders HTTP/1.1" 503 UF,URX upstream_reset_before_response_started{connection_failure} - "-" 512 91 3 - "-" "okhttp/4.12" "6c1f..." "checkout.payments:8080" "10.42.7.19:8080" outbound|8080|v2|checkout.payments.svc.cluster.local - 10.42.3.5:41822 - -</pre>
<p>The toolbox, in the order you use it:</p>
<pre>istioctl analyze -n payments                       # config errors: missing subsets, conflicting VS, policy without waypoint
istioctl proxy-status                              # is every proxy SYNCED with istiod? STALE = push problem
istioctl x describe pod checkout-7d9f-abcde -n payments   # which VS/DR/PeerAuthentication apply to this Pod
istioctl proxy-config cluster  deploy/web -n frontend --fqdn checkout.payments.svc.cluster.local
istioctl proxy-config endpoint deploy/web -n frontend --cluster "outbound|8080|v2|checkout.payments.svc.cluster.local"
istioctl proxy-config route    deploy/web -n frontend --name 8080 -o json
istioctl proxy-config secret   deploy/checkout -n payments   # cert valid? expiry? root matches?
kubectl exec deploy/web -n frontend -c istio-proxy -- pilot-agent request GET stats | grep -E 'upstream_cx_connect_fail|outlier'</pre>
<blockquote>💡 Real world: a canary subset with no endpoints is the classic self-inflicted 503 UH: the VirtualService sends 10% to <code>v2</code>, but the v2 Pods carry the label <code>version: 2.0</code>, not <code>v2</code>. <code>proxy-config endpoint</code> on that cluster shows nothing, and <code>istioctl analyze</code> often flags it before it ships.</blockquote>`,
        he: `<p>כשה-mesh מחזיר 503, ה-access log של Envoy אומר לך <strong>מי</strong> ייצר אותו ו<strong>למה</strong>. תדליק access logs (דרך Telemetry API או עם <code>meshConfig.accessLogFile: /dev/stdout</code>) ותקרא את ה-response flags:</p>
<table>
<tr><th>Flag</th><th>משמעות</th><th>סיבה רגילה</th></tr>
<tr><td><code>UH</code></td><td>אין upstream בריא</td><td>אפס endpoints מוכנים, או שכולם הוצאו על ידי outlier detection</td></tr>
<tr><td><code>UF</code></td><td>כשל בחיבור ל-upstream</td><td>ה-Pod לא מאזין, אי-התאמה ב-mTLS, NetworkPolicy שזורקת</td></tr>
<tr><td><code>UO</code></td><td>Upstream overflow (circuit breaker)</td><td>מגבלות connectionPool נמוכות מדי, או עומס אמיתי</td></tr>
<tr><td><code>NR</code></td><td>אין route או filter chain</td><td>route חסר, שם host או port שגוי. בצד ה-inbound, <code>filter_chain_not_found</code> אומר ש-plaintext פוגע בפורט STRICT</td></tr>
<tr><td><code>URX</code></td><td>עברנו את מגבלת ה-retries</td><td>כל ה-retries נכשלו, תבדוק מה הם ראו</td></tr>
<tr><td><code>UC</code> / <code>UT</code></td><td>החיבור ל-upstream נסגר או עבר timeout</td><td>אי-התאמה ב-keepalive מול האפליקציה (היא סוגרת חיבורים רדומים קודם), backend איטי</td></tr>
<tr><td><code>DC</code></td><td>ה-downstream סגר</td><td>הקורא ויתר (ה-timeout שלו)</td></tr>
</table>
<pre>[2026-11-17T09:14:03.112Z] "POST /api/v1/orders HTTP/1.1" 503 UF,URX upstream_reset_before_response_started{connection_failure} - "-" 512 91 3 - "-" "okhttp/4.12" "6c1f..." "checkout.payments:8080" "10.42.7.19:8080" outbound|8080|v2|checkout.payments.svc.cluster.local - 10.42.3.5:41822 - -</pre>
<p>ארגז הכלים, לפי הסדר שבו משתמשים בו:</p>
<pre>istioctl analyze -n payments                       # config errors: missing subsets, conflicting VS, policy without waypoint
istioctl proxy-status                              # is every proxy SYNCED with istiod? STALE = push problem
istioctl x describe pod checkout-7d9f-abcde -n payments   # which VS/DR/PeerAuthentication apply to this Pod
istioctl proxy-config cluster  deploy/web -n frontend --fqdn checkout.payments.svc.cluster.local
istioctl proxy-config endpoint deploy/web -n frontend --cluster "outbound|8080|v2|checkout.payments.svc.cluster.local"
istioctl proxy-config route    deploy/web -n frontend --name 8080 -o json
istioctl proxy-config secret   deploy/checkout -n payments   # cert valid? expiry? root matches?
kubectl exec deploy/web -n frontend -c istio-proxy -- pilot-agent request GET stats | grep -E 'upstream_cx_connect_fail|outlier'</pre>
<blockquote>💡 Real world: subset של קנרית בלי endpoints הוא ה-503 UH הקלאסי שאתה עושה לעצמך. ה-VirtualService שולח 10% ל-<code>v2</code>, אבל על ה-Pods של v2 יש label עם <code>version: 2.0</code> ולא <code>v2</code>. הפקודה <code>proxy-config endpoint</code> על ה-cluster הזה לא מראה כלום, ו-<code>istioctl analyze</code> הרבה פעמים תופס את זה לפני שזה יוצא.</blockquote>`
      }
    },
    {
      h: { en: "Upgrading Istio: canary control planes with revisions and tags", he: "שדרוג Istio: control plane קנרית עם revisions ו-tags" },
      body: {
        en: `<p>Never upgrade istiod in place on a big mesh. Install the new version <strong>side by side</strong> as a revision, point a <strong>revision tag</strong> at it, and move namespaces by relabelling plus a rolling restart. Rollback is moving the tag back and restarting again.</p>
<pre># 1. install the new control plane next to the old one (example versions)
istioctl install --set revision=1-28-1 -y        # or: helm install istiod-1-28-1 istio/istiod --set revision=1-28-1
# 2. tags: namespaces reference a tag, not a version
istioctl tag set prod-canary --revision 1-28-1
kubectl label ns sandbox istio.io/rev=prod-canary --overwrite
kubectl rollout restart deploy -n sandbox
istioctl proxy-status | awk '{print $NF}' | sort | uniq -c     # count proxies per istiod version
# 3. after soak: move the stable tag, restart namespace by namespace
istioctl tag set prod-stable --revision 1-28-1 --overwrite
# 4. remove the old revision once no proxy uses it
istioctl uninstall --revision 1-27-3</pre>
<p>Rules: CRDs and the validating webhook are shared, so read the upgrade notes for CRD changes; Istio supports a data plane one minor behind the control plane, so restart everything before the next upgrade; gateways are Deployments too and should be upgraded as their own revision with their own canary. In ambient mode, ztunnel upgrades replace a node-level component, so upgrade it node by node (check current docs for the in-place ztunnel upgrade behaviour). And check Istio's supported Kubernetes versions before the fleet upgrade, not after.</p>`,
        he: `<p>אף פעם לא משדרגים istiod במקום על mesh גדול. מתקינים את הגרסה החדשה <strong>לצד הישנה</strong> בתור revision, מכוונים אליה <strong>revision tag</strong>, ומעבירים namespaces עם label חדש ו-rolling restart. ה-rollback הוא להחזיר את ה-tag ולעשות restart שוב.</p>
<pre># 1. install the new control plane next to the old one (example versions)
istioctl install --set revision=1-28-1 -y        # or: helm install istiod-1-28-1 istio/istiod --set revision=1-28-1
# 2. tags: namespaces reference a tag, not a version
istioctl tag set prod-canary --revision 1-28-1
kubectl label ns sandbox istio.io/rev=prod-canary --overwrite
kubectl rollout restart deploy -n sandbox
istioctl proxy-status | awk '{print $NF}' | sort | uniq -c     # count proxies per istiod version
# 3. after soak: move the stable tag, restart namespace by namespace
istioctl tag set prod-stable --revision 1-28-1 --overwrite
# 4. remove the old revision once no proxy uses it
istioctl uninstall --revision 1-27-3</pre>
<p>כללים: ה-CRDs וה-validating webhook משותפים, אז תקרא את ה-upgrade notes בשביל שינויים ב-CRDs. Istio תומך ב-data plane שנמצא minor אחד מאחורי ה-control plane, אז תעשה restart לכולם לפני השדרוג הבא. גם ה-gateways הם Deployments, ומשדרגים אותם בתור revision נפרד עם קנרית משלהם. ב-ambient, שדרוג של ztunnel מחליף רכיב ברמת ה-node, אז משדרגים node אחרי node (תבדוק ב-docs העדכניים איך עובד שדרוג in-place של ztunnel). ותבדוק באילו גרסאות Kubernetes ה-Istio שלך תומך לפני השדרוג של הצי, לא אחריו.</p>`
      }
    }
  ],
  diagram: `                 istiod (CA + xDS: LDS/RDS/CDS/EDS/SDS)
                   │ push config + certs
   ┌───────────────┼──────────────────────┐
sidecar mode:   [web | envoy] ══mTLS══► [envoy | checkout]
ambient mode:   web ─► ztunnel(node A) ══HBONE:15008══► [waypoint L7] ══► ztunnel(node B) ─► checkout
legacy VM (no proxy) ──plaintext──► STRICT port ✗  (inbound NR filter_chain_not_found → client sees reset)`,
  handsOn: [
    { cmd: "istioctl analyze -A", what: { en: "Static analysis of all Istio and Gateway API config: missing subsets, conflicting routes, policies with no target.", he: "ניתוח סטטי של כל ה-config של Istio ו-Gateway API: subsets חסרים, routes מתנגשים, policies בלי יעד." } },
    { cmd: "istioctl proxy-status", what: { en: "Check that every Envoy is SYNCED with istiod for CDS/LDS/EDS/RDS, and which istiod revision each one uses.", he: "בודק שכל Envoy במצב SYNCED מול istiod עבור CDS, LDS, EDS ו-RDS, ובאיזה revision של istiod כל אחד משתמש." } },
    { cmd: "istioctl proxy-config endpoint deploy/web -n frontend --cluster 'outbound|8080|v2|checkout.payments.svc.cluster.local'", what: { en: "See the actual endpoints (and HEALTHY/UNHEALTHY status) a client proxy has for a canary subset.", he: "מראה את ה-endpoints בפועל (ואת הסטטוס HEALTHY או UNHEALTHY) שיש ל-proxy של client עבור subset של קנרית." } },
    { cmd: "kubectl logs deploy/checkout -n payments -c istio-proxy --since=10m | awk '$5 ~ /^5/ {print $5, $6}' | sort | uniq -c", what: { en: "Count 5xx responses by response flag in the server-side access log (field positions depend on your log format).", he: "סופר תשובות 5xx לפי response flag ב-access log של צד השרת (מיקום השדות תלוי בפורמט הלוג שלך)." } },
    { cmd: "istioctl x describe pod $(kubectl get pod -n payments -l app=checkout -o jsonpath='{.items[0].metadata.name}') -n payments", what: { en: "Explain which Services, VirtualServices, DestinationRules and mTLS mode apply to one Pod.", he: "מסביר אילו Services, VirtualServices, DestinationRules ואיזה mTLS mode חלים על Pod אחד." } }
  ],
  mnemonic: {
    en: "\"Analyze, Status, Config, Flags\": is the config valid, did it arrive, what did the proxy actually get, and what did Envoy say (UH no one home, UF door locked, UO line too long, NR no map).",
    he: "\"Analyze, Status, Config, Flags\": האם ה-config תקין, האם הוא הגיע, מה ה-proxy קיבל בפועל, ומה Envoy אמר. UH: אין אף אחד בבית. UF: הדלת נעולה. UO: התור ארוך מדי. NR: אין מפה."
  },
  pitfalls: [
    { en: "Flipping a namespace to STRICT without measuring plaintext callers first. Non-mesh clients get connection resets, which their retry loops turn into a cascade. Measure connection_security_policy=\"none\" until it is zero.", he: "להעביר namespace ל-STRICT בלי למדוד קודם מי שולח plaintext. clients מחוץ ל-mesh מקבלים connection reset, ולולאות ה-retry שלהם הופכות את זה למפל. תמדוד את connection_security_policy=\"none\" עד שהוא אפס." },
    { en: "Retries at every layer. Envoy retries, the client library retries, the gateway retries: a brownout becomes a retry storm. Retry in one place, with per-try timeouts that fit the overall deadline.", he: "retries בכל שכבה. Envoy עושה retry, ספריית ה-client עושה retry, ה-gateway עושה retry, ו-brownout הופך לסערת retries. תעשה retry במקום אחד, עם perTryTimeout שנכנס ב-deadline הכולל." },
    { en: "Assuming the sidecar is ready when the app starts. Apps that call out at startup fail until Envoy is up; use holdApplicationUntilProxyStarts (or native sidecars on recent Kubernetes) and handle Jobs that never exit.", he: "להניח שה-sidecar מוכן כשהאפליקציה עולה. אפליקציות שקוראות החוצה בעלייה נכשלות עד ש-Envoy עולה. תשתמש ב-holdApplicationUntilProxyStarts (או ב-native sidecars בגרסאות Kubernetes עדכניות), ותטפל ב-Jobs שלא מסתיימים." },
    { en: "In ambient mode, writing an L7 AuthorizationPolicy (paths, methods) without a waypoint. ztunnel only enforces L4, so the rule is not enforced as you expect; istioctl analyze warns about it.", he: "ב-ambient, לכתוב AuthorizationPolicy של L7 (paths, methods) בלי waypoint. ה-ztunnel אוכף רק L4, ולכן החוק לא נאכף כמו שאתה מצפה. istioctl analyze מזהיר על זה." }
  ],
  interview: [
    {
      q: { en: "A service behind Istio returns intermittent 503s. How do you debug it?", he: "שירות מאחורי Istio מחזיר 503 לסירוגין. איך אתה מדבג?" },
      a: {
        en: "First find which proxy produced the 503 and why: client-side and server-side access logs with response flags. UH means no healthy endpoints (check proxy-config endpoint, outlier ejections, readiness), UF means connections fail (app not listening, mTLS mismatch, NetworkPolicy), UO means circuit breaker limits, NR means routing or plaintext-to-STRICT, UC often means the app closes keepalive connections before Envoy (fix idle timeouts so the app's is longer than Envoy's). Then check config health: istioctl analyze, proxy-status for STALE proxies. If only the server-side log is missing the request, the failure is on the wire or in the client proxy. Fix root cause, not by adding retries.",
        he: "קודם מוצאים איזה proxy ייצר את ה-503 ולמה: access logs בצד ה-client ובצד השרת, עם response flags. UH: אין endpoints בריאים, בודקים proxy-config endpoint, הוצאות של outlier ו-readiness. UF: החיבורים נכשלים, האפליקציה לא מאזינה, אי-התאמה ב-mTLS או NetworkPolicy. UO: מגבלות circuit breaker. NR: בעיית ניתוב, או plaintext שפוגע ב-STRICT. UC בדרך כלל אומר שהאפליקציה סוגרת חיבורי keepalive לפני Envoy, והתיקון הוא idle timeout ארוך יותר באפליקציה מאשר ב-Envoy. אחר כך בודקים את בריאות ה-config: istioctl analyze, ו-proxy-status בשביל proxies במצב STALE. אם הבקשה חסרה רק בלוג של צד השרת, הכשל על החוט או ב-proxy של ה-client. מתקנים את שורש הבעיה, לא מוסיפים retries."
      }
    },
    {
      q: { en: "Sidecar or ambient for a new 300-service mesh in 2026?", he: "Sidecar או ambient ל-mesh חדש של 300 שירותים ב-2026?" },
      a: {
        en: "Ambient is GA since 1.24 and is the better default for most new meshes: mTLS and L4 policy for every workload without injection or restarts, much lower resource overhead, and L7 only where you add waypoints. Choose sidecars when you need L7 features everywhere, rely on features not yet supported in ambient, or have mature sidecar tooling and runbooks. A strong answer mentions the operational differences: ztunnel is a node-level dependency (its upgrade and failure affect every Pod on the node), L7 policy requires a waypoint, and debugging uses ztunnel-config rather than per-Pod proxy-config.",
        he: "Ambient הוא GA מאז 1.24, והוא ברירת מחדל טובה יותר לרוב ה-meshes החדשים: mTLS ו-policy של L4 לכל workload בלי injection ובלי restarts, תקורת משאבים נמוכה בהרבה, ו-L7 רק איפה שמוסיפים waypoints. תבחר sidecars כשאתה צריך יכולות L7 בכל מקום, כשאתה תלוי ביכולות שעוד לא נתמכות ב-ambient, או כשיש לך כלים ו-runbooks בוגרים ל-sidecars. תשובה חזקה מזכירה את ההבדלים התפעוליים: ztunnel הוא תלות ברמת ה-node (השדרוג והנפילה שלו משפיעים על כל Pod ב-node), policy של L7 דורש waypoint, והדיבאג נעשה עם ztunnel-config ולא עם proxy-config לכל Pod."
      }
    },
    {
      q: { en: "How do you upgrade Istio across a fleet with minimal risk?", he: "איך משדרגים Istio בצי clusters עם מינימום סיכון?" },
      a: {
        en: "Revision-based canary upgrades: install the new istiod as a revision alongside the old, use revision tags (prod-stable, prod-canary) so namespaces never hardcode versions, move a low-risk namespace to the canary tag, restart, soak with golden signals, then move the stable tag and restart namespace by namespace. Gateways get their own revisioned rollout. Check the Kubernetes support matrix and CRD changes first, keep the data plane at most one minor behind, roll it cluster by cluster in the same waves as Kubernetes upgrades, and keep the old revision installed until proxy-status shows no proxies on it.",
        he: "שדרוג קנרית מבוסס revisions: מתקינים את ה-istiod החדש בתור revision לצד הישן, ומשתמשים ב-revision tags (prod-stable, prod-canary) כדי ש-namespaces אף פעם לא יקודדו גרסה. מעבירים namespace בסיכון נמוך ל-tag של הקנרית, עושים restart ו-soak עם golden signals, ואז מזיזים את ה-tag היציב ועושים restart namespace אחרי namespace. ה-gateways מקבלים פריסה משלהם עם revision. קודם בודקים את מטריצת התמיכה ב-Kubernetes ושינויים ב-CRDs, מחזיקים את ה-data plane לכל היותר minor אחד מאחור, מגלגלים cluster אחרי cluster באותם גלים של שדרוגי Kubernetes, ומשאירים את ה-revision הישן מותקן עד ש-proxy-status מראה שאף proxy לא משתמש בו."
      }
    }
  ],
  quiz: [
    {
      q: { en: "Server-side Envoy logs show 'NR filter_chain_not_found' for requests from a legacy service. What is the most likely cause?", he: "הלוגים של Envoy בצד השרת מראים 'NR filter_chain_not_found' על בקשות משירות legacy. מה הסיבה הסבירה ביותר?" },
      options: [
        { en: "The VirtualService has no matching route", he: "ל-VirtualService אין route תואם" },
        { en: "A plaintext client is calling a port that requires STRICT mTLS", he: "client ב-plaintext קורא לפורט שדורש STRICT mTLS" },
        { en: "The circuit breaker overflowed", he: "ה-circuit breaker התמלא" },
        { en: "The Pod has no endpoints", he: "ל-Pod אין endpoints" }
      ],
      answer: 1,
      explain: { en: "On the inbound side, STRICT mode only installs TLS filter chains; a plaintext connection matches none of them, Envoy logs NR filter_chain_not_found and resets the connection, so the client sees 'connection reset' or a 503 from its own gateway.", he: "בצד ה-inbound, STRICT מתקין רק filter chains של TLS. חיבור plaintext לא מתאים לאף אחד מהם, Envoy רושם NR filter_chain_not_found ועושה reset לחיבור, וה-client רואה 'connection reset' או 503 מה-gateway שלו." }
    },
    {
      q: { en: "Which is TRUE about ambient mode?", he: "מה נכון לגבי ambient mode?" },
      options: [
        { en: "Every Pod still gets an Envoy sidecar, but smaller", he: "כל Pod עדיין מקבל sidecar של Envoy, רק קטן יותר" },
        { en: "ztunnel handles L4 mTLS per node; L7 features require a waypoint proxy", he: "ztunnel מטפל ב-mTLS של L4 בכל node; יכולות L7 דורשות waypoint proxy" },
        { en: "ztunnel enforces HTTP path-based AuthorizationPolicy", he: "ztunnel אוכף AuthorizationPolicy לפי HTTP paths" },
        { en: "Enrolling a namespace requires restarting all Pods", he: "צירוף namespace דורש restart לכל ה-Pods" }
      ],
      answer: 1,
      explain: { en: "ztunnel is an L4 node proxy (mTLS via HBONE, L4 policy, telemetry). L7 routing and L7 authorization run in waypoints. Enrolment is a namespace label without restarts.", he: "ztunnel הוא proxy של L4 ברמת ה-node (mTLS דרך HBONE, policy של L4, טלמטריה). ניתוב ו-authorization של L7 רצים ב-waypoints. הצירוף הוא label על ה-namespace, בלי restarts." }
    },
    {
      q: { en: "A canary VirtualService sends 10% to subset v2 and exactly those requests fail with 503 UH. What do you check first?", he: "VirtualService של קנרית שולח 10% ל-subset בשם v2, ובדיוק הבקשות האלה נכשלות עם 503 UH. מה בודקים קודם?" },
      options: [
        { en: "The PeerAuthentication mode", he: "את ה-mode של PeerAuthentication" },
        { en: "Whether the v2 subset's labels match any ready Pods (proxy-config endpoint)", he: "האם ה-labels של ה-subset בשם v2 מתאימים ל-Pods מוכנים (proxy-config endpoint)" },
        { en: "The egress gateway", he: "את ה-egress gateway" },
        { en: "The istiod CPU usage", he: "את צריכת ה-CPU של istiod" }
      ],
      answer: 1,
      explain: { en: "UH is 'no healthy upstream'. A subset whose label selector matches no ready Pods produces an empty endpoint set for that Envoy cluster.", he: "UH זה 'אין upstream בריא'. subset שה-label selector שלו לא תואם לאף Pod מוכן יוצר קבוצת endpoints ריקה ל-cluster הזה ב-Envoy." }
    },
    {
      q: { en: "Why use revision tags when upgrading Istio?", he: "למה להשתמש ב-revision tags בשדרוג Istio?" },
      options: [
        { en: "They make istiod upgrades in-place and faster", he: "הם הופכים את שדרוג istiod ל-in-place ומהיר יותר" },
        { en: "Namespaces point at a stable alias, so moving many namespaces (or rolling back) is one tag change plus restarts", he: "ה-namespaces מצביעים על alias יציב, אז העברה של הרבה namespaces (או rollback) היא שינוי tag אחד ועוד restarts" },
        { en: "They remove the need to restart Pods", he: "הם מבטלים את הצורך לעשות restart ל-Pods" },
        { en: "They are required for ambient mode", he: "הם חובה ב-ambient mode" }
      ],
      answer: 1,
      explain: { en: "Without tags, every namespace label names a version and must be edited on each upgrade. With tags, you move the alias between revisions; sidecar Pods still need a restart to pick up the new proxy.", he: "בלי tags, כל label של namespace מציין גרסה וצריך לערוך אותו בכל שדרוג. עם tags מזיזים את ה-alias בין revisions. ל-Pods עם sidecar עדיין צריך restart כדי לקבל את ה-proxy החדש." }
    }
  ],
  related: ["staff-service-mesh", "k8s-networking-cni", "k8s-security-policy", "k8s-argo-rollouts", "k8s-fleet-upgrades", "api-gateway-production", "k8s-ingress-certs-dns"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "api-gateway-production",
  track: "networking",
  order: 61,
  icon: "🚪",
  level: 3,
  minutes: 16,
  title: { en: "API Gateways in Production: Edge, North-South and East-West", he: "API Gateways ב-production: edge, תעבורת north-south ו-east-west" },
  tldr: {
    en: "The edge gateway is where untrusted traffic becomes trusted: it terminates TLS, authenticates (JWT/OIDC), applies per-tenant rate limits, shapes requests and routes them. Pick the product by what you need at the edge (managed AWS API Gateway, ALB, or a Gateway API implementation like Envoy Gateway), keep the gateway thin, budget its latency, and run it as the most highly available thing you own, because when it is down, everything is down.",
    he: "ה-edge gateway הוא המקום שבו תעבורה לא מהימנה הופכת למהימנה. הוא עושה TLS termination, מאמת (JWT או OIDC), מפעיל rate limits לכל tenant, מעצב בקשות ומנתב אותן. בוחרים מוצר לפי מה שצריך ב-edge: AWS API Gateway מנוהל, ALB, או מימוש של Gateway API כמו Envoy Gateway. שומרים את ה-gateway רזה, מתקצבים את ה-latency שלו, ומריצים אותו בתור הדבר הכי זמין שיש לך. כשהוא נופל, הכל נופל."
  },
  analogy: {
    en: "The gateway is the airport terminal, not the airline. It checks passports (authentication), limits how many people go through each security lane (rate limiting), scans bags (WAF), and sends you to the right gate (routing). It must not start flying planes: once business logic creeps into the terminal, every airline's schedule depends on the terminal's release calendar.",
    he: "ה-gateway הוא הטרמינל בשדה התעופה, לא חברת התעופה. הוא בודק דרכונים (authentication), מגביל כמה אנשים עוברים בכל מסלול בידוק (rate limiting), סורק מזוודות (WAF) ושולח אותך לשער הנכון (routing). אסור לו להתחיל להטיס מטוסים. ברגע ש-business logic זולג לטרמינל, לוח הזמנים של כל חברות התעופה תלוי בלוח השחרורים של הטרמינל."
  },
  sections: [
    {
      h: { en: "What belongs at the edge (and what doesn't)", he: "מה שייך ל-edge (ומה לא)" },
      body: {
        en: `<p><strong>North-south</strong> traffic enters from outside (clients, partners) through the edge gateway; <strong>east-west</strong> traffic flows between services inside, usually through a mesh or plain Services. Different trust, different tools. The edge layer, in order of a request:</p>
<ol>
<li><strong>DDoS and WAF</strong> (often in front: CloudFront/Shield + AWS WAF, or a CDN): block L3/L4 floods, known-bad IPs, OWASP patterns, bots.</li>
<li><strong>TLS termination</strong>: certificates, TLS 1.2+/1.3 policy, optionally mTLS for partners.</li>
<li><strong>Authentication</strong>: validate JWT signature against cached JWKS, <code>iss</code>, <code>aud</code>, <code>exp</code>; or run the OIDC flow for browser apps; or API keys for machine clients (identification, not strong auth).</li>
<li><strong>Rate limiting and quotas</strong>: per IP, per API key, per tenant, per route.</li>
<li><strong>Request shaping</strong>: body size limits, header normalisation, strip internal headers clients must not set (<code>x-tenant-id</code>, <code>x-user-id</code>), add a request ID, CORS.</li>
<li><strong>Routing</strong>: host/path/header to backend, versioning, canary weights.</li>
</ol>
<p><strong>Not at the edge</strong>: business authorization ("can user 42 refund order 9"), response aggregation of many services (that is a BFF, owned by the product team), data transformation that needs a release per feature. A gateway full of Lua or VTL mapping templates becomes a shared monolith that every team waits on.</p>
<blockquote>⚠️ Production tip: always <strong>strip identity headers from the incoming request</strong> before setting them from the validated token. If the gateway sets <code>x-tenant-id</code> from the JWT but forwards a client-supplied one when the claim is missing, any client can impersonate any tenant.</blockquote>`,
        he: `<p>תעבורת <strong>north-south</strong> נכנסת מבחוץ (clients, שותפים) דרך ה-edge gateway. תעבורת <strong>east-west</strong> זורמת בין שירותים בפנים, בדרך כלל דרך mesh או Services רגילים. רמת אמון שונה, כלים שונים. שכבת ה-edge, לפי סדר הבקשה:</p>
<ol>
<li><strong>DDoS ו-WAF</strong> (הרבה פעמים מלפנים: CloudFront עם Shield ו-AWS WAF, או CDN): חוסמים הצפות של L3 ו-L4, כתובות IP ידועות כרעות, דפוסי OWASP ובוטים.</li>
<li><strong>TLS termination</strong>: תעודות, מדיניות של TLS 1.2 ומעלה או 1.3, ואופציונלית mTLS לשותפים.</li>
<li><strong>Authentication</strong>: אימות החתימה של ה-JWT מול JWKS שנשמר ב-cache, ובדיקת <code>iss</code>, <code>aud</code> ו-<code>exp</code>. או flow של OIDC לאפליקציות דפדפן. או API keys ל-clients של מכונות, שזה זיהוי ולא אימות חזק.</li>
<li><strong>Rate limiting ו-quotas</strong>: לפי IP, לפי API key, לפי tenant, לפי route.</li>
<li><strong>עיצוב בקשות</strong>: מגבלת גודל body, נרמול headers, הסרה של headers פנימיים שאסור ל-client לקבוע (<code>x-tenant-id</code>, <code>x-user-id</code>), הוספת request ID, ו-CORS.</li>
<li><strong>Routing</strong>: לפי host, path או header ל-backend, ניהול גרסאות, משקלים לקנרית.</li>
</ol>
<p><strong>מה לא שייך ל-edge</strong>: authorization עסקי ("האם משתמש 42 יכול לזכות את הזמנה 9"), איחוד תשובות מהרבה שירותים (זה BFF, ששייך לצוות המוצר), והמרת data שדורשת release לכל פיצ'ר. gateway מלא ב-Lua או ב-mapping templates של VTL הופך ל-monolith משותף שכל הצוותים מחכים לו.</p>
<blockquote>⚠️ Production tip: תמיד <strong>תסיר headers של זהות מהבקשה הנכנסת</strong> לפני שאתה קובע אותם מתוך ה-token המאומת. אם ה-gateway קובע <code>x-tenant-id</code> מתוך ה-JWT, אבל מעביר את הערך שה-client שלח כשה-claim חסר, כל client יכול להתחזות לכל tenant.</blockquote>`
      }
    },
    {
      h: { en: "The options: AWS API Gateway, ALB, Gateway API implementations", he: "האפשרויות: AWS API Gateway, ALB, ומימושים של Gateway API" },
      body: {
        en: `<table>
<tr><th></th><th>API Gateway REST API</th><th>API Gateway HTTP API</th><th>ALB</th><th>Envoy Gateway / Kong / Istio ingress (in-cluster)</th></tr>
<tr><td>Price model</td><td>Per request (~$3.50/M at the first tier in us-east-1)</td><td>Per request (~$1.00/M first tier)</td><td>Per hour + LCU</td><td>Your compute (+ license for enterprise editions)</td></tr>
<tr><td>Auth</td><td>IAM, Cognito, Lambda authorizers, API keys</td><td>Native JWT authorizer, Lambda, IAM</td><td>OIDC / Cognito action</td><td>JWT, OIDC, ext_authz, mTLS, anything</td></tr>
<tr><td>Rate limiting</td><td>Account/stage/method throttles + usage plans per API key</td><td>Route/stage throttles only</td><td>None native (WAF rate-based rules)</td><td>Local and global, by any key</td></tr>
<tr><td>WAF</td><td>Yes</td><td>No (put CloudFront + WAF in front)</td><td>Yes</td><td>Via a front LB/CDN, or a WAF plugin</td></tr>
<tr><td>Limits to know</td><td>29 s default integration timeout (raisable for Regional/private APIs), 10 MB payload, 10,000 RPS account default per region</td><td>30 s max integration timeout, 10 MB payload</td><td>Rule count per listener (quota), 60 s default idle timeout</td><td>Whatever you size it for</td></tr>
<tr><td>Fits</td><td>Lambda backends, partner APIs with keys and quotas</td><td>Cheap, simple JWT-protected APIs</td><td>Kubernetes/EC2 backends, simple edge</td><td>Kubernetes platforms, complex policy, multi-cloud, high RPS</td></tr>
</table>
<p>At high, steady volume the per-request price dominates: 2 billion requests a month on REST APIs is several thousand dollars just in request fees, while a few Envoy Pods behind an NLB cost a fraction of that, but you now own their availability. That is the real tradeoff: <strong>money versus on-call</strong>.</p>
<p><strong>Gateway API</strong> is the Kubernetes standard that replaced the Ingress resource for new work: <code>GatewayClass</code> (the implementation), <code>Gateway</code> (listeners, owned by the platform team), <code>HTTPRoute</code>/<code>GRPCRoute</code> (owned by app teams, attached across namespaces through <code>allowedRoutes</code>). The role split is the point. Note that the community ingress-nginx controller announced its retirement (best-effort maintenance ended in March 2026); plan migrations to a Gateway API implementation.</p>
<pre>apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata: { name: public, namespace: edge }
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    hostname: "*.api.example.com"
    tls: { certificateRefs: [{ name: wildcard-api-tls }] }
    allowedRoutes:
      namespaces: { from: Selector, selector: { matchLabels: { edge-access: "true" } } }
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: orders, namespace: orders }
spec:
  parentRefs: [{ name: public, namespace: edge, sectionName: https }]
  hostnames: ["shop.api.example.com"]
  rules:
  - matches: [{ path: { type: PathPrefix, value: /v2/orders } }]
    backendRefs: [{ name: orders-v2, port: 8080 }]
  - matches: [{ path: { type: PathPrefix, value: /v1/orders } }]
    backendRefs: [{ name: orders-v1, port: 8080 }]</pre>`,
        he: `<table>
<tr><th></th><th>API Gateway REST API</th><th>API Gateway HTTP API</th><th>ALB</th><th>Envoy Gateway / Kong / Istio ingress (בתוך ה-cluster)</th></tr>
<tr><td>מודל תמחור</td><td>לפי בקשה (~$3.50 למיליון בשכבה הראשונה ב-us-east-1)</td><td>לפי בקשה (~$1.00 למיליון בשכבה הראשונה)</td><td>לפי שעה ועוד LCU</td><td>ה-compute שלך (ועוד רישיון לגרסאות enterprise)</td></tr>
<tr><td>Auth</td><td>IAM, Cognito, Lambda authorizers, API keys</td><td>JWT authorizer מובנה, Lambda, IAM</td><td>פעולת OIDC או Cognito</td><td>JWT, OIDC, ext_authz, mTLS, כל דבר</td></tr>
<tr><td>Rate limiting</td><td>throttles ברמת account, stage ו-method, ועוד usage plans לכל API key</td><td>רק throttles ברמת route ו-stage</td><td>אין מובנה (WAF rate-based rules)</td><td>local ו-global, לפי כל מפתח</td></tr>
<tr><td>WAF</td><td>כן</td><td>לא (שמים CloudFront ו-WAF מלפנים)</td><td>כן</td><td>דרך LB או CDN מלפנים, או plugin של WAF</td></tr>
<tr><td>מגבלות שצריך להכיר</td><td>integration timeout של 29 שניות כברירת מחדל (אפשר להעלות ב-APIs מסוג Regional או private), payload של 10 MB, ברירת מחדל של 10,000 RPS ל-account בכל region</td><td>integration timeout מקסימלי של 30 שניות, payload של 10 MB</td><td>מספר rules לכל listener (quota), idle timeout של 60 שניות כברירת מחדל</td><td>מה שתגדיר לו</td></tr>
<tr><td>מתאים ל</td><td>backends של Lambda, APIs לשותפים עם keys ו-quotas</td><td>APIs פשוטים וזולים שמוגנים ב-JWT</td><td>backends ב-Kubernetes או EC2, edge פשוט</td><td>פלטפורמות Kubernetes, policy מורכב, multi-cloud, RPS גבוה</td></tr>
</table>
<p>בנפח גבוה וקבוע, המחיר לבקשה שולט. 2 מיליארד בקשות בחודש על REST APIs זה כמה אלפי דולרים רק על בקשות, וכמה Pods של Envoy מאחורי NLB עולים חלק קטן מזה. אבל עכשיו הזמינות שלהם עליך. זה ה-tradeoff האמיתי: <strong>כסף מול on-call</strong>.</p>
<p><strong>Gateway API</strong> הוא הסטנדרט של Kubernetes שהחליף את ה-Ingress resource בעבודה חדשה. יש בו <code>GatewayClass</code> (המימוש), <code>Gateway</code> (listeners, בבעלות צוות הפלטפורמה), ו-<code>HTTPRoute</code> או <code>GRPCRoute</code> (בבעלות צוותי האפליקציה, ומתחברים בין namespaces דרך <code>allowedRoutes</code>). חלוקת התפקידים היא כל הרעיון. שים לב שה-controller הקהילתי ingress-nginx הודיע על פרישה (התחזוקה במאמץ סביר הסתיימה במרץ 2026), אז תתכנן מעבר למימוש של Gateway API.</p>
<pre>apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata: { name: public, namespace: edge }
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    hostname: "*.api.example.com"
    tls: { certificateRefs: [{ name: wildcard-api-tls }] }
    allowedRoutes:
      namespaces: { from: Selector, selector: { matchLabels: { edge-access: "true" } } }
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: orders, namespace: orders }
spec:
  parentRefs: [{ name: public, namespace: edge, sectionName: https }]
  hostnames: ["shop.api.example.com"]
  rules:
  - matches: [{ path: { type: PathPrefix, value: /v2/orders } }]
    backendRefs: [{ name: orders-v2, port: 8080 }]
  - matches: [{ path: { type: PathPrefix, value: /v1/orders } }]
    backendRefs: [{ name: orders-v1, port: 8080 }]</pre>`
      }
    },
    {
      h: { en: "Rate limiting: local vs global token buckets, multi-tenant quotas", he: "Rate limiting: token buckets מקומיים מול גלובליים, ו-quotas ל-multi-tenant" },
      body: {
        en: `<table>
<tr><th></th><th>Local (per gateway instance)</th><th>Global (shared counter service)</th></tr>
<tr><td>How</td><td>Token bucket in memory of each Envoy</td><td>Each request asks a rate-limit service (gRPC) backed by Redis</td></tr>
<tr><td>Latency</td><td>~0</td><td>One extra network call (~1 ms in-AZ, more cross-AZ)</td></tr>
<tr><td>Accuracy</td><td>Effective limit = limit × number of replicas, and drifts as HPA scales</td><td>Exact across all replicas</td></tr>
<tr><td>Failure mode</td><td>None</td><td>Redis/ratelimit down: fail-open (no limits) or fail-closed (outage). Choose deliberately; usually fail-open with a local limit as backstop</td></tr>
<tr><td>Use for</td><td>Protecting the gateway and backends from bursts</td><td>Contractual tenant quotas (100 req/min on the free tier)</td></tr>
</table>
<p>The production pattern is <strong>both</strong>: a generous local limit per Pod as a shield, plus global limits keyed by tenant. The tenant key must come from the <em>validated</em> token, never from a client header:</p>
<pre>apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata: { name: jwt, namespace: edge }
spec:
  targetRefs: [{ group: gateway.networking.k8s.io, kind: Gateway, name: public }]
  jwt:
    providers:
    - name: idp
      issuer: https://auth.example.com/
      audiences: [api.example.com]
      remoteJWKS: { uri: https://auth.example.com/.well-known/jwks.json }
      claimToHeaders: [{ claim: tenant_id, header: x-tenant-id }, { claim: plan, header: x-plan }]
---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata: { name: tenant-quotas, namespace: edge }
spec:
  targetRefs: [{ group: gateway.networking.k8s.io, kind: Gateway, name: public }]
  rateLimit:
    type: Global
    global:
      rules:
      - clientSelectors:
        - headers:
          - { name: x-plan, value: free }
          - { name: x-tenant-id, type: Distinct }   # one bucket per tenant
        limit: { requests: 100, unit: Minute }
      - clientSelectors:
        - headers:
          - { name: x-plan, value: pro }
          - { name: x-tenant-id, type: Distinct }
        limit: { requests: 3000, unit: Minute }</pre>
<p>Return <code>429</code> with <code>Retry-After</code> (and ideally rate-limit headers so clients can pace themselves). Watch for the <strong>noisy neighbour on the backend</strong>: a per-tenant edge limit does not stop one tenant's expensive queries from saturating a shared database; you may need per-tenant concurrency limits deeper in the stack too.</p>`,
        he: `<table>
<tr><th></th><th>Local (לכל instance של gateway)</th><th>Global (שירות counter משותף)</th></tr>
<tr><td>איך</td><td>token bucket בזיכרון של כל Envoy</td><td>כל בקשה שואלת שירות rate-limit (ב-gRPC) שמגובה ב-Redis</td></tr>
<tr><td>Latency</td><td>~0</td><td>קריאת רשת נוספת אחת (~1 ms באותו AZ, יותר בין AZs)</td></tr>
<tr><td>דיוק</td><td>המגבלה האפקטיבית היא המגבלה כפול מספר ה-replicas, והיא זזה כש-HPA משנה גודל</td><td>מדויק על פני כל ה-replicas</td></tr>
<tr><td>אופן כשל</td><td>אין</td><td>Redis או שירות ה-ratelimit נופלים: fail-open (בלי מגבלות) או fail-closed (השבתה). תבחר במכוון. בדרך כלל fail-open עם מגבלה מקומית כגיבוי</td></tr>
<tr><td>משמש ל</td><td>הגנה על ה-gateway וה-backends מפני bursts</td><td>quotas חוזיות לכל tenant (100 בקשות בדקה ב-free tier)</td></tr>
</table>
<p>התבנית ב-production היא <strong>שניהם</strong>: מגבלה מקומית נדיבה לכל Pod בתור מגן, ועוד מגבלות גלובליות לפי tenant. מפתח ה-tenant חייב להגיע מה-token <em>המאומת</em>, אף פעם לא מ-header של ה-client:</p>
<pre>apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata: { name: jwt, namespace: edge }
spec:
  targetRefs: [{ group: gateway.networking.k8s.io, kind: Gateway, name: public }]
  jwt:
    providers:
    - name: idp
      issuer: https://auth.example.com/
      audiences: [api.example.com]
      remoteJWKS: { uri: https://auth.example.com/.well-known/jwks.json }
      claimToHeaders: [{ claim: tenant_id, header: x-tenant-id }, { claim: plan, header: x-plan }]
---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata: { name: tenant-quotas, namespace: edge }
spec:
  targetRefs: [{ group: gateway.networking.k8s.io, kind: Gateway, name: public }]
  rateLimit:
    type: Global
    global:
      rules:
      - clientSelectors:
        - headers:
          - { name: x-plan, value: free }
          - { name: x-tenant-id, type: Distinct }   # one bucket per tenant
        limit: { requests: 100, unit: Minute }
      - clientSelectors:
        - headers:
          - { name: x-plan, value: pro }
          - { name: x-tenant-id, type: Distinct }
        limit: { requests: 3000, unit: Minute }</pre>
<p>תחזיר <code>429</code> עם <code>Retry-After</code>, ובאופן אידיאלי גם headers של rate-limit כדי שה-clients יוכלו לווסת את עצמם. תיזהר מ-<strong>noisy neighbour ב-backend</strong>: מגבלה לכל tenant ב-edge לא מונעת משאילתות יקרות של tenant אחד להעמיס database משותף. ייתכן שתצטרך גם מגבלות concurrency לכל tenant עמוק יותר ב-stack.</p>`
      }
    },
    {
      h: { en: "Versioning, latency budget and high availability", he: "ניהול גרסאות, תקציב latency וזמינות גבוהה" },
      body: {
        en: `<p><strong>Versioning</strong>: path versions (<code>/v1</code>, <code>/v2</code>) are the easiest to route, cache and see in logs; header or media-type versions are cleaner but harder to debug. Whatever you choose, the gateway should route versions to separate backends during migrations and emit per-version traffic metrics, so you know when <code>/v1</code> is safe to remove. Announce deprecation with the <code>Deprecation</code> and <code>Sunset</code> response headers, then do brownouts (planned short 410 windows) before the final removal.</p>
<p><strong>Latency budget</strong>: if the product promises p99 &lt; 300 ms, write the budget down: CDN/WAF a few ms, TLS handshake (amortised by keepalive and session resumption), gateway proxy hop typically around a millisecond or a few for Envoy-class proxies, JWT validation microseconds with cached JWKS, global rate-limit call ~1 ms, an <code>ext_authz</code> call one more network round trip. Managed gateways add more (often tens of ms; measure yours). Every Lambda authorizer without caching adds a cold-start risk to every request.</p>
<p><strong>High availability</strong> for a self-run gateway:</p>
<ul>
<li>At least 3 replicas spread across zones (<code>topologySpreadConstraints</code>), a PDB, and an HPA on CPU or connections with headroom for a zone loss.</li>
<li>An NLB in front (static IPs, millions of connections), cross-zone load balancing understood and priced.</li>
<li>Graceful shutdown: drain connections longer than the LB deregistration delay, or every deploy produces a burst of 502s.</li>
<li>Config is a deploy: a bad route or filter pushed to every gateway at once is a global outage. Validate in CI, roll config to a canary gateway first, and keep the previous config one revert away.</li>
<li>Dedicated nodes for the gateway (taints), so a noisy batch job can't starve it.</li>
</ul>
<pre>topologySpreadConstraints:
- { maxSkew: 1, topologyKey: topology.kubernetes.io/zone, whenUnsatisfiable: DoNotSchedule,
    labelSelector: { matchLabels: { app: edge-envoy } } }
terminationGracePeriodSeconds: 60      # &gt; LB deregistration delay + longest request</pre>`,
        he: `<p><strong>ניהול גרסאות</strong>: גרסאות ב-path (<code>/v1</code>, <code>/v2</code>) הכי קלות לניתוב, ל-cache ולצפייה בלוגים. גרסאות ב-header או ב-media type נקיות יותר, אבל קשות יותר לדיבאג. מה שלא תבחר, ה-gateway צריך לנתב גרסאות ל-backends נפרדים בזמן מעבר, ולפלוט metrics של תעבורה לכל גרסה, כדי שתדע מתי בטוח להסיר את <code>/v1</code>. תודיע על deprecation עם ה-headers בשם <code>Deprecation</code> ו-<code>Sunset</code>, ואחר כך תעשה brownouts (חלונות קצרים ומתוכננים של 410) לפני ההסרה הסופית.</p>
<p><strong>תקציב latency</strong>: אם המוצר מבטיח p99 מתחת ל-300 ms, תכתוב את התקציב. CDN ו-WAF כמה ms. TLS handshake, שמתחלק על פני keepalive ו-session resumption. קפיצה דרך proxy כמו Envoy בדרך כלל סביב מילישנייה או כמה. אימות JWT לוקח מיקרו-שניות עם JWKS ב-cache. קריאת rate-limit גלובלית ~1 ms. קריאת <code>ext_authz</code> היא עוד סבב רשת. gateways מנוהלים מוסיפים יותר, הרבה פעמים עשרות ms, אז תמדוד אצלך. וכל Lambda authorizer בלי caching מוסיף סיכון של cold start לכל בקשה.</p>
<p><strong>זמינות גבוהה</strong> ל-gateway שאתה מריץ בעצמך:</p>
<ul>
<li>לפחות 3 replicas שמפוזרים בין zones (<code>topologySpreadConstraints</code>), PDB, ו-HPA לפי CPU או חיבורים, עם מרווח לנפילה של zone.</li>
<li>NLB מלפנים (IPs קבועים, מיליוני חיבורים), עם הבנה של cross-zone load balancing ושל המחיר שלו.</li>
<li>Graceful shutdown: לעשות drain לחיבורים יותר זמן מה-deregistration delay של ה-LB. אחרת כל deploy מייצר גל של 502.</li>
<li>Config הוא deploy: route או filter גרוע שנדחף לכל ה-gateways בבת אחת הוא השבתה גלובלית. תבדוק ב-CI, תגלגל config קודם ל-gateway קנרית, ותשאיר את ה-config הקודם במרחק revert אחד.</li>
<li>nodes ייעודיים ל-gateway (עם taints), כדי ש-batch job רועש לא ירעיב אותו.</li>
</ul>
<pre>topologySpreadConstraints:
- { maxSkew: 1, topologyKey: topology.kubernetes.io/zone, whenUnsatisfiable: DoNotSchedule,
    labelSelector: { matchLabels: { app: edge-envoy } } }
terminationGracePeriodSeconds: 60      # &gt; LB deregistration delay + longest request</pre>`
      }
    },
    {
      h: { en: "Edge gateway vs mesh: who does what", he: "Edge gateway מול mesh: מי עושה מה" },
      body: {
        en: `<table>
<tr><th>Concern</th><th>Edge gateway (north-south)</th><th>Mesh (east-west)</th></tr>
<tr><td>Identity</td><td>End users and API clients (JWT, OIDC, API keys)</td><td>Workloads (SPIFFE IDs via mTLS)</td></tr>
<tr><td>Rate limiting</td><td>Per tenant / key, contractual</td><td>Protective (circuit breakers, concurrency)</td></tr>
<tr><td>Routing</td><td>Public hostnames, versions, partner routes</td><td>Canary between versions of internal services</td></tr>
<tr><td>Failure impact</td><td>Total outage for external users</td><td>Partial, per service</td></tr>
</table>
<p>The Istio ingress gateway can be your edge gateway (one Envoy-based stack, same tooling), and many platforms do that. Others keep a dedicated edge (Envoy Gateway, Kong, a managed gateway) so the edge can be upgraded, scaled and secured independently of the mesh. Either way, the token validated at the edge should be propagated (or exchanged for an internal token) so services can make their own authorization decisions: the gateway proves <em>who</em>, the service decides <em>may they</em>.</p>`,
        he: `<table>
<tr><th>נושא</th><th>Edge gateway (north-south)</th><th>Mesh (east-west)</th></tr>
<tr><td>זהות</td><td>משתמשי קצה ו-clients של API (JWT, OIDC, API keys)</td><td>Workloads (SPIFFE IDs דרך mTLS)</td></tr>
<tr><td>Rate limiting</td><td>לפי tenant או key, חוזי</td><td>הגנתי (circuit breakers, concurrency)</td></tr>
<tr><td>Routing</td><td>hostnames ציבוריים, גרסאות, routes לשותפים</td><td>קנרית בין גרסאות של שירותים פנימיים</td></tr>
<tr><td>השפעה בכשל</td><td>השבתה מלאה למשתמשים חיצוניים</td><td>חלקית, לפי שירות</td></tr>
</table>
<p>ה-ingress gateway של Istio יכול לשמש בתור ה-edge gateway שלך (stack אחד מבוסס Envoy, אותם כלים), והרבה פלטפורמות עושות את זה. אחרות מחזיקות edge ייעודי (Envoy Gateway, Kong, או gateway מנוהל) כדי שאפשר יהיה לשדרג, להגדיל ולאבטח את ה-edge בנפרד מה-mesh. בכל מקרה, ה-token שאומת ב-edge צריך לעבור הלאה, או להיות מוחלף ב-token פנימי, כדי שהשירותים יקבלו החלטות authorization בעצמם. ה-gateway מוכיח <em>מי</em>, והשירות מחליט <em>האם מותר לו</em>.</p>`
      }
    }
  ],
  diagram: `client ─► CDN/WAF (DDoS, OWASP, bots) ─► NLB ─► edge gateway x3 AZs
                                              │ TLS · JWT (cached JWKS) · strip x-tenant-id · local RL
                                              │ global RL ──► ratelimit svc ──► Redis   (fail-open)
                                              ▼
                               HTTPRoutes (/v1 → orders-v1, /v2 → orders-v2)
                                              ▼
                                   mesh (mTLS, east-west) ─► services`,
  handsOn: [
    { cmd: "kubectl get gateway,httproute -A -o wide && kubectl describe httproute orders -n orders | sed -n '/Status:/,$p'", what: { en: "List Gateway API objects and read a route's status conditions (Accepted, ResolvedRefs): the first place to look when a route 'does nothing'.", he: "מציג את אובייקטי ה-Gateway API וקורא את ה-conditions של route (Accepted, ResolvedRefs). זה המקום הראשון לבדוק כש-route 'לא עושה כלום'." } },
    { cmd: "for i in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}\\n' -H \"Authorization: Bearer $TOKEN\" https://shop.api.example.com/v2/orders; done | sort | uniq -c", what: { en: "Fire 120 requests with one tenant's token and count 200 vs 429 to verify the per-tenant limit.", he: "שולח 120 בקשות עם token של tenant אחד וסופר כמה 200 וכמה 429, כדי לוודא את המגבלה לכל tenant." } },
    { cmd: "curl -s -o /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n' https://shop.api.example.com/healthz", what: { en: "Break request latency into DNS, TCP, TLS and time to first byte to see what the edge costs.", he: "מפרק את ה-latency של בקשה ל-DNS, TCP, TLS וזמן עד ה-byte הראשון, כדי לראות כמה ה-edge עולה." } },
    { cmd: "aws apigateway get-usage --usage-plan-id abc123 --key-id k-789 --start-date 2026-11-01 --end-date 2026-11-17", what: { en: "On AWS API Gateway REST APIs, read daily usage of one API key against its usage plan quota.", he: "ב-REST APIs של AWS API Gateway, קורא את השימוש היומי של API key אחד מול ה-quota של ה-usage plan שלו." } }
  ],
  mnemonic: {
    en: "\"Shield, Seal, Badge, Meter, Map\": WAF shield, TLS seal, auth badge, rate-limit meter, routing map. Nothing else lives at the edge.",
    he: "\"מגן, חותם, תג, מונה, מפה\": WAF הוא המגן, TLS הוא החותם, auth הוא התג, rate limit הוא המונה, ו-routing הוא המפה. שום דבר אחר לא גר ב-edge."
  },
  pitfalls: [
    { en: "Using local rate limits for tenant quotas. With 6 gateway replicas the real limit is 6x, and it changes every time the HPA scales.", he: "להשתמש במגבלות מקומיות בשביל quotas של tenants. עם 6 replicas של gateway המגבלה האמיתית היא פי 6, והיא משתנה בכל פעם שה-HPA משנה גודל." },
    { en: "Trusting client-supplied identity headers. If x-tenant-id is not stripped and re-set from the validated token, rate limits and tenant isolation can be bypassed.", he: "לסמוך על headers של זהות שה-client שלח. אם x-tenant-id לא מוסר ונקבע מחדש מה-token המאומת, אפשר לעקוף את ה-rate limits ואת הבידוד בין tenants." },
    { en: "Pushing gateway config to all instances at once. A single bad filter or route is a global outage; treat gateway config like code with canaries.", he: "לדחוף config של gateway לכל ה-instances בבת אחת. filter או route גרוע אחד הוא השבתה גלובלית. תתייחס ל-config של ה-gateway כמו לקוד, עם קנריות." },
    { en: "Letting business logic accumulate in the gateway (mapping templates, scripts, aggregation). It becomes a shared monolith on every team's critical path.", he: "לתת ל-business logic להצטבר ב-gateway (mapping templates, סקריפטים, איחוד תשובות). הוא הופך ל-monolith משותף שיושב על ה-critical path של כל צוות." }
  ],
  interview: [
    {
      q: { en: "Design rate limiting for a multi-tenant public API with free and paid tiers.", he: "תתכנן rate limiting ל-API ציבורי multi-tenant עם tier חינמי ו-tiers בתשלום." },
      a: {
        en: "Identity first: tenant and plan come from the validated JWT (or API key lookup), with client-supplied headers stripped. Two layers: a local token bucket per gateway Pod as a burst shield, and a global limiter (rate-limit service + Redis) keyed by tenant and plan for contractual quotas, possibly per route class (cheap reads vs expensive writes). Decide failure mode: fail-open with the local limit as backstop is the usual choice. Respond 429 with Retry-After and rate-limit headers, expose usage to customers, alert on tenants persistently at limit (sales signal) and on Redis latency. Mention that edge limits don't stop expensive queries, so add per-tenant concurrency limits or fair queuing in backends.",
        he: "זהות קודם: ה-tenant וה-plan מגיעים מה-JWT המאומת (או מחיפוש של ה-API key), ו-headers שה-client שלח מוסרים. שתי שכבות: token bucket מקומי בכל Pod של gateway כמגן מפני bursts, ו-limiter גלובלי (שירות rate-limit עם Redis) לפי tenant ו-plan בשביל quotas חוזיות, אולי גם לפי סוג route (קריאות זולות מול כתיבות יקרות). מחליטים על אופן הכשל: בדרך כלל fail-open עם המגבלה המקומית כגיבוי. מחזירים 429 עם Retry-After ו-headers של rate-limit, חושפים ללקוחות את השימוש, ומתריעים על tenants שתקועים במגבלה (סימן למכירות) ועל latency של Redis. כדאי להזכיר שמגבלות ב-edge לא עוצרות שאילתות יקרות, ולכן מוסיפים מגבלות concurrency לכל tenant או fair queuing ב-backends."
      }
    },
    {
      q: { en: "AWS API Gateway, ALB, or a self-run Envoy-based gateway for a Kubernetes platform serving 50k RPS?", he: "AWS API Gateway, ALB, או gateway מבוסס Envoy שאתה מריץ, לפלטפורמת Kubernetes שמשרתת 50k RPS?" },
      a: {
        en: "At 50k RPS sustained, per-request pricing on API Gateway is large (about 130 billion requests a month), and the default 10k RPS account throttle would need raising. ALB is fine for routing and OIDC but has no real rate limiting or JWT-claim-based policy. A Gateway API implementation (Envoy Gateway, Istio ingress, Kong) behind an NLB gives JWT, global and local limits, canaries and low cost, at the price of owning HA, upgrades and capacity. I'd pick the self-run gateway with WAF/DDoS at a CDN or in front, dedicated nodes, at least 3 replicas across zones, and config rolled out through canaries. For a small Lambda-backed partner API, API Gateway REST with usage plans would be the better answer.",
        he: "ב-50k RPS קבועים, התמחור לבקשה ב-API Gateway גדול (בערך 130 מיליארד בקשות בחודש), וצריך להעלות את ה-throttle ברירת המחדל של 10k RPS ל-account. ALB טוב לניתוב ול-OIDC, אבל אין לו rate limiting אמיתי או policy לפי claims של JWT. מימוש של Gateway API (Envoy Gateway, Istio ingress, Kong) מאחורי NLB נותן JWT, מגבלות גלובליות ומקומיות, קנריות ועלות נמוכה, במחיר של אחריות על HA, שדרוגים וקיבולת. הייתי בוחר ב-gateway שאני מריץ בעצמי, עם WAF והגנת DDoS ב-CDN או מלפנים, nodes ייעודיים, לפחות 3 replicas בין zones, ו-config שמתגלגל דרך קנריות. ל-API קטן לשותפים מעל Lambda, API Gateway מסוג REST עם usage plans היה התשובה הטובה יותר."
      }
    }
  ],
  quiz: [
    {
      q: { en: "You set a local rate limit of 100 req/s on an Envoy gateway with 5 replicas. What limit do clients actually see?", he: "הגדרת rate limit מקומי של 100 בקשות לשנייה על gateway של Envoy עם 5 replicas. איזו מגבלה ה-clients רואים בפועל?" },
      options: [
        { en: "100 req/s", he: "100 בקשות לשנייה" },
        { en: "Up to ~500 req/s, depending on how the LB spreads them", he: "עד ~500 בקשות לשנייה, תלוי איך ה-LB מפזר אותן" },
        { en: "20 req/s", he: "20 בקשות לשנייה" },
        { en: "Unlimited", he: "בלי הגבלה" }
      ],
      answer: 1,
      explain: { en: "Each replica has its own bucket. Use a global limiter for exact per-tenant quotas.", he: "לכל replica יש bucket משלו. בשביל quotas מדויקות לכל tenant משתמשים ב-limiter גלובלי." }
    },
    {
      q: { en: "Which AWS option has a native JWT authorizer but does not support AWS WAF directly?", he: "לאיזו אפשרות של AWS יש JWT authorizer מובנה, אבל היא לא תומכת ישירות ב-AWS WAF?" },
      options: [
        { en: "API Gateway REST API", he: "API Gateway REST API" },
        { en: "API Gateway HTTP API", he: "API Gateway HTTP API" },
        { en: "Application Load Balancer", he: "Application Load Balancer" },
        { en: "CloudFront", he: "CloudFront" }
      ],
      answer: 1,
      explain: { en: "HTTP APIs are cheaper and have native JWT authorizers, but no WAF, caching or usage plans; put CloudFront + WAF in front if you need WAF.", he: "HTTP APIs זולים יותר ויש להם JWT authorizers מובנים, אבל אין להם WAF, caching או usage plans. אם צריך WAF, שמים CloudFront ו-WAF מלפנים." }
    },
    {
      q: { en: "The global rate-limit Redis cluster goes down. What is usually the right gateway behaviour?", he: "ה-Redis של ה-rate limit הגלובלי נופל. מה בדרך כלל ההתנהגות הנכונה של ה-gateway?" },
      options: [
        { en: "Fail closed: reject all requests with 429", he: "Fail closed: לדחות את כל הבקשות עם 429" },
        { en: "Fail open, with a local per-Pod limit still protecting backends", he: "Fail open, כשמגבלה מקומית לכל Pod עדיין מגינה על ה-backends" },
        { en: "Restart the gateway Pods", he: "לעשות restart ל-Pods של ה-gateway" },
        { en: "Switch DNS to a static maintenance page", he: "להעביר את ה-DNS לדף תחזוקה סטטי" }
      ],
      answer: 1,
      explain: { en: "Failing closed turns a limiter outage into a full outage. Fail open keeps serving; the local limit caps the damage until Redis returns. Some security-critical limits (login attempts) may justify fail-closed.", he: "Fail closed הופך תקלה ב-limiter להשבתה מלאה. Fail open ממשיך לשרת, והמגבלה המקומית מגבילה את הנזק עד ש-Redis חוזר. מגבלות קריטיות לאבטחה (כמו ניסיונות login) יכולות להצדיק fail closed." }
    },
    {
      q: { en: "In Gateway API, who typically owns the Gateway resource vs the HTTPRoute?", he: "ב-Gateway API, מי בדרך כלל אחראי על ה-Gateway ומי על ה-HTTPRoute?" },
      options: [
        { en: "Both are owned by app teams", he: "שניהם בבעלות צוותי האפליקציה" },
        { en: "Platform team owns Gateway (listeners, TLS); app teams own HTTPRoutes attached via allowedRoutes", he: "צוות הפלטפורמה אחראי על ה-Gateway (listeners, TLS), וצוותי האפליקציה על HTTPRoutes שמתחברים דרך allowedRoutes" },
        { en: "The cloud provider owns both", he: "ספק הענן אחראי על שניהם" },
        { en: "App teams own Gateway; platform owns HTTPRoutes", he: "צוותי האפליקציה אחראים על ה-Gateway, והפלטפורמה על HTTPRoutes" }
      ],
      answer: 1,
      explain: { en: "The role-oriented split is a core design goal of Gateway API: infrastructure (GatewayClass), cluster operators (Gateway), application developers (Routes).", he: "חלוקת התפקידים היא מטרה מרכזית בתכנון של Gateway API: תשתית (GatewayClass), מפעילי cluster (Gateway) ומפתחי אפליקציות (Routes)." }
    }
  ],
  related: ["arch-api-gateway", "pr-rate-limiters", "istio-in-production", "k8s-ingress-certs-dns", "net-http-tls", "staff-service-mesh"]
});

/* ------------------------------------------------------------------ */
INFRA.scenarios.push({
  id: "istio-503-after-mtls",
  icon: "🔐",
  title: { en: "503s and connection resets after enabling STRICT mTLS", he: "שגיאות 503 ו-connection reset אחרי הפעלת STRICT mTLS" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "14:09. PagerDuty: checkout error rate 18% (SLO burn 14x). Customers see 'payment failed'. The checkout service calls billing-legacy, an old Java service in namespace legacy with no sidecar, which calls payments in the mesh. The deploy feed shows one change in the last hour.",
        he: "14:09. PagerDuty: אחוז השגיאות של checkout עומד על 18% (שריפת SLO פי 14). לקוחות רואים 'התשלום נכשל'. השירות checkout קורא ל-billing-legacy, שירות Java ישן ב-namespace בשם legacy בלי sidecar, והוא קורא ל-payments שנמצא ב-mesh. ב-feed של ה-deploys יש שינוי אחד בשעה האחרונה."
      },
      data: `ALERT checkout_error_ratio{env="prod"} = 0.18 (threshold 0.02)  firing since 14:06
deploy feed:
  14:02  argocd  app=payments-mesh-policy  sync OK  rev 9f3c2a1  "security: enforce STRICT mTLS in payments (PR #4821)"
$ kubectl get pods -n legacy -l app=billing-legacy
NAME                              READY   STATUS    RESTARTS   AGE
billing-legacy-6b8d9c7f5-2xkq4    0/1     Running   0          41d
billing-legacy-6b8d9c7f5-7hm2p    0/1     Running   0          41d
billing-legacy-6b8d9c7f5-r9tzc    1/1     Running   0          41d`,
      choices: [
        { label: { en: "Correlate first: look at billing-legacy's logs and the payments proxy logs around 14:02", he: "קודם מצליבים: מסתכלים בלוגים של billing-legacy ובלוגים של ה-proxy של payments סביב 14:02" }, next: "s2", score: 10, feedback: { en: "Good. A change at 14:02 and errors from 14:06 is a strong lead; two minutes of evidence beats a random restart.", he: "טוב. שינוי ב-14:02 ושגיאות מ-14:06 זה כיוון חזק. שתי דקות של ראיות עדיפות על restart אקראי." } },
        { label: { en: "Restart billing-legacy, two of its Pods are not ready", he: "לעשות restart ל-billing-legacy, שניים מה-Pods שלו לא ready" }, next: "s2", score: 2, feedback: { en: "The new Pods go not-ready again within a minute. Not-ready is a symptom; you still don't know why.", he: "ה-Pods החדשים חוזרים להיות not-ready תוך דקה. not-ready זה סימפטום, ועדיין אתה לא יודע למה." } },
        { label: { en: "Scale billing-legacy from 3 to 10 replicas", he: "להגדיל את billing-legacy מ-3 ל-10 replicas" }, next: "s2", score: 0, feedback: { en: "More replicas means more callers retrying against payments, and the new Pods fail the same way. You added load, not capacity.", he: "יותר replicas זה יותר קוראים שעושים retry מול payments, וה-Pods החדשים נכשלים באותה צורה. הוספת עומס, לא קיבולת." } }
      ]
    },
    s2: {
      text: {
        en: "billing-legacy logs are full of connection resets to payments, and its HTTP thread pool is exhausted. On the payments side, the istio-proxy shows something specific.",
        he: "הלוגים של billing-legacy מלאים ב-connection reset מול payments, וה-thread pool של ה-HTTP שלו מוצה. בצד של payments, ה-istio-proxy מראה משהו ספציפי."
      },
      data: `$ kubectl logs -n legacy billing-legacy-6b8d9c7f5-2xkq4 --since=10m | tail -4
14:06:11 WARN  PaymentsClient  POST http://payments.payments:8080/charge attempt 1/4 failed: java.net.SocketException: Connection reset
14:06:11 WARN  PaymentsClient  POST http://payments.payments:8080/charge attempt 2/4 failed: java.net.SocketException: Connection reset
14:06:12 ERROR HttpServer      Thread pool exhausted (200/200 busy), rejecting /readyz
14:06:12 ERROR PaymentsClient  charge failed after 4 attempts

$ kubectl logs -n payments deploy/payments -c istio-proxy --since=10m | grep -c filter_chain_not_found
4127
$ kubectl logs -n payments deploy/payments -c istio-proxy --since=10m | grep filter_chain_not_found | tail -1
[2026-11-17T14:06:12.481Z] "- - -" 0 NR filter_chain_not_found - "-" 0 0 0 - "-" "-" "-" "-" "-" - - 10.42.9.31:8080 10.42.5.17:51234 - -

$ kubectl logs -n checkout deploy/checkout -c istio-proxy --since=5m | grep billing-legacy | tail -1
[2026-11-17T14:08:40.020Z] "POST /v1/bill HTTP/1.1" 503 UH no_healthy_upstream - "-" 0 19 0 - "-" "okhttp/4.12" "a71e..." "billing-legacy.legacy:8080" "-" outbound|8080||billing-legacy.legacy.svc.cluster.local - 10.42.1.8:40110 - -`,
      choices: [
        { label: { en: "Confirm the mTLS mismatch: check which PeerAuthentication applies to payments and whether billing-legacy has a proxy", he: "לאמת את אי-ההתאמה ב-mTLS: לבדוק איזה PeerAuthentication חל על payments והאם ל-billing-legacy יש proxy" }, next: "s3", score: 10, feedback: { en: "Right. NR filter_chain_not_found on the inbound side is the signature of plaintext hitting a STRICT port; confirming it takes 30 seconds.", he: "נכון. NR filter_chain_not_found בצד ה-inbound הוא החתימה של plaintext שפוגע בפורט STRICT. לאמת את זה לוקח 30 שניות." } },
        { label: { en: "Delete the AuthorizationPolicies in the payments namespace", he: "למחוק את ה-AuthorizationPolicies ב-namespace של payments" }, next: "s3", score: 0, feedback: { en: "Wrong layer. An authorization deny returns 403 RBAC: access denied, not a reset with NR. You just removed real protection during an incident.", he: "שכבה לא נכונה. חסימה של authorization מחזירה 403 עם RBAC: access denied, לא reset עם NR. הרגע הסרת הגנה אמיתית באמצע תקלה." } },
        { label: { en: "Add a DestinationRule with tls.mode ISTIO_MUTUAL for payments in the legacy namespace", he: "להוסיף DestinationRule עם tls.mode ISTIO_MUTUAL ל-payments ב-namespace בשם legacy" }, next: "s3", score: 0, feedback: { en: "A DestinationRule configures a client-side Envoy. billing-legacy has no Envoy, so nothing will originate mTLS. No effect.", he: "DestinationRule מגדיר Envoy בצד ה-client. ל-billing-legacy אין Envoy, אז אף אחד לא ייזום mTLS. אין שום השפעה." } }
      ]
    },
    s3: {
      text: {
        en: "Confirmed: payments is STRICT since 14:02, billing-legacy has no sidecar and sends plaintext. The cascade: plaintext calls are reset, billing-legacy retries 4 times, its threads block, it fails readiness, and checkout's proxy sees no healthy upstream. How do you mitigate?",
        he: "מאומת: payments במצב STRICT מאז 14:02, ל-billing-legacy אין sidecar והוא שולח plaintext. המפל: קריאות plaintext מקבלות reset, billing-legacy עושה retry ארבע פעמים, ה-threads שלו נחסמים, הוא נכשל ב-readiness, וה-proxy של checkout רואה שאין upstream בריא. איך אתה ממתן?"
      },
      data: `$ istioctl x describe pod payments-5c7d8b9f4-kq2lm -n payments | grep -A2 -i mtls
Effective PeerAuthentication:
   Workload mTLS mode: STRICT
Applied PeerAuthentication: default.payments

$ kubectl get pod -n legacy billing-legacy-6b8d9c7f5-2xkq4 -o jsonpath='{.spec.containers[*].name}'
billing-legacy
$ kubectl get ns legacy --show-labels
NAME     STATUS   AGE    LABELS
legacy   Active   3y     kubernetes.io/metadata.name=legacy

$ argocd app get payments-mesh-policy -o json | jq '.spec.syncPolicy'
{ "automated": { "prune": true, "selfHeal": true } }`,
      choices: [
        { label: { en: "git revert PR #4821 (back to PERMISSIVE), merge with the incident fast-path, argocd app sync", he: "לעשות git revert ל-PR #4821 (חזרה ל-PERMISSIVE), merge במסלול המהיר של תקלות, ו-argocd app sync" }, next: "s4", score: 10, feedback: { en: "Fastest safe rollback, through the same path that caused it, and Argo CD won't fight you. Errors from payments stop within a minute of the sync.", he: "ה-rollback הבטוח הכי מהיר, דרך אותו מסלול שגרם לתקלה, ו-Argo CD לא יילחם בך. השגיאות מ-payments נעצרות תוך דקה מה-sync." } },
        { label: { en: "Add a PeerAuthentication exception: portLevelMtls PERMISSIVE on payments port 8080, via a PR", he: "להוסיף חריג ב-PeerAuthentication: portLevelMtls במצב PERMISSIVE על פורט 8080 של payments, דרך PR" }, next: "s4", score: 6, feedback: { en: "It works, but under pressure you wrote new policy instead of reverting a known change. Port 8080 is the main API port, so the 'exception' is effectively the revert with more risk of a typo.", he: "זה עובד, אבל תחת לחץ כתבת policy חדש במקום לעשות revert לשינוי מוכר. פורט 8080 הוא פורט ה-API הראשי, אז ה'חריג' הוא בפועל revert עם יותר סיכון לטעות הקלדה." } },
        { label: { en: "kubectl edit peerauthentication default -n payments and set PERMISSIVE", he: "להריץ kubectl edit peerauthentication default -n payments ולשנות ל-PERMISSIVE" }, next: "lose", score: 0, feedback: { en: "selfHeal is on: Argo CD restores STRICT within seconds. The team spends 25 minutes thinking the fix 'didn't work' and chasing other theories while the outage continues.", he: "ה-selfHeal דולק: Argo CD מחזיר את STRICT תוך שניות. הצוות מבזבז 25 דקות במחשבה שהתיקון 'לא עבד' ורודף אחרי תיאוריות אחרות, וההשבתה נמשכת." } }
      ]
    },
    s4: {
      text: {
        en: "14:17. payments now accepts plaintext again and filter_chain_not_found stopped. But billing-legacy is still struggling: 2 of 3 Pods not ready, and a backlog of 9,000 queued billing retries is hammering payments as it recovers. checkout errors are down to 6%.",
        he: "14:17. payments מקבל שוב plaintext ו-filter_chain_not_found נעצר. אבל billing-legacy עדיין מתקשה: 2 מתוך 3 Pods לא ready, ו-backlog של 9,000 retries של billing בתור מפציץ את payments בזמן שהוא מתאושש. השגיאות של checkout ירדו ל-6%."
      },
      data: `$ kubectl top pods -n payments
NAME                         CPU(cores)   MEMORY(bytes)
payments-5c7d8b9f4-kq2lm     1870m        612Mi
payments-5c7d8b9f4-p8w2d     1910m        598Mi
$ kubectl logs -n checkout deploy/checkout -c istio-proxy --since=1m | awk '{print $5,$6}' | sort | uniq -c
   812 200 -
    54 503 UH
$ curl -s billing-legacy.legacy:9090/metrics | grep retry_queue_depth
retry_queue_depth 9024`,
      choices: [
        { label: { en: "Throttle the retry backlog (pause the retry consumer or lower its rate), then rolling-restart billing-legacy and drain the queue slowly while watching payments", he: "לווסת את ה-backlog של ה-retries (לעצור את ה-consumer של ה-retries או להוריד את הקצב שלו), אחר כך rolling restart ל-billing-legacy, ולרוקן את התור לאט תוך מעקב אחרי payments" }, next: "s5", score: 10, feedback: { en: "You removed the thundering herd before restoring capacity. payments CPU drops, billing-legacy goes ready, checkout errors return to baseline at 14:31.", he: "הסרת את ה-thundering herd לפני שהחזרת קיבולת. ה-CPU של payments יורד, billing-legacy חוזר להיות ready, והשגיאות של checkout חוזרות ל-baseline ב-14:31." } },
        { label: { en: "Scale payments to 8 replicas and let the backlog flush at full speed", he: "להגדיל את payments ל-8 replicas ולתת ל-backlog להתרוקן במהירות מלאה" }, next: "s5", score: 5, feedback: { en: "It eventually works, but new payments Pods take 90 s to warm up and the downstream card processor starts returning 429s at the burst. Recovery takes until 14:44.", he: "בסוף זה עובד, אבל ל-Pods חדשים של payments לוקח 90 שניות להתחמם, וספק הכרטיסים שמאחור מתחיל להחזיר 429 בגלל ה-burst. ההתאוששות נמשכת עד 14:44." } },
        { label: { en: "Errors are dropping. Re-apply STRICT now so the security work isn't lost", he: "השגיאות יורדות. להחיל שוב STRICT עכשיו, כדי שעבודת האבטחה לא תלך לאיבוד" }, next: "lose", score: 0, feedback: { en: "Nothing changed for billing-legacy: it still has no sidecar. The outage restarts, now with a full retry queue behind it.", he: "שום דבר לא השתנה אצל billing-legacy: עדיין אין לו sidecar. ההשבתה מתחילה מחדש, והפעם עם תור retries מלא מאחוריה." } }
      ]
    },
    s5: {
      text: {
        en: "Service restored. In the postmortem, what is the main corrective action?",
        he: "השירות חזר. ב-postmortem, מה פעולת התיקון המרכזית?"
      },
      data: `timeline: 14:02 STRICT synced · 14:06 first resets · 14:09 page · 14:15 revert synced · 14:31 recovered
impact: 25 min, checkout error rate peak 18%
plaintext callers to payments in the 7 days before the change (connection_security_policy="none"):
  source_workload=unknown  source_namespace=legacy   ~140 rps
  source_workload=unknown  source_namespace=batch    ~0.2 rps (nightly)`,
      choices: [
        { label: { en: "Make STRICT data-driven: a pre-merge check that queries plaintext callers per namespace and blocks STRICT while any exist; onboard billing-legacy and the batch job into the mesh; cap client retries with backoff", he: "להפוך את STRICT למבוסס נתונים: בדיקה לפני merge ששואלת על קוראים ב-plaintext לכל namespace וחוסמת STRICT כל עוד יש כאלה; לצרף את billing-legacy ואת ה-batch job ל-mesh; להגביל retries של clients ולהוסיף backoff" }, next: "win", score: 10, feedback: { en: "The data was there for a week before the change. Gating on it, fixing the callers, and bounding retries addresses the trigger and the cascade.", he: "הנתונים היו שם שבוע לפני השינוי. gate על בסיס הנתונים, תיקון הקוראים והגבלת ה-retries מטפלים גם בטריגר וגם במפל." } },
        { label: { en: "Ban STRICT mTLS: PERMISSIVE everywhere, permanently", he: "לאסור STRICT mTLS: PERMISSIVE בכל מקום, לתמיד" }, next: "win", score: 2, feedback: { en: "It prevents this exact outage and gives up the security goal: any Pod without a proxy can call payments in plaintext with no identity. The real gap was the missing pre-check.", he: "זה מונע את ההשבתה הספציפית הזאת, אבל מוותר על מטרת האבטחה: כל Pod בלי proxy יכול לקרוא ל-payments ב-plaintext בלי זהות. הפער האמיתי היה הבדיקה המקדימה שחסרה." } },
        { label: { en: "Require two approvers on every Istio policy PR", he: "לדרוש שני מאשרים על כל PR של policy ב-Istio" }, next: "win", score: 4, feedback: { en: "More reviewers would not have seen the plaintext callers either. Review helps; evidence in the PR helps more.", he: "גם עוד מאשרים לא היו רואים את הקוראים ב-plaintext. review עוזר, ראיות בתוך ה-PR עוזרות יותר." } }
      ]
    },
    win: {
      text: {
        en: "Resolved. Root cause: STRICT mTLS enforced on payments while a non-mesh caller still sent plaintext; inbound Envoy reset those connections (NR filter_chain_not_found), client retries exhausted billing-legacy's threads, and checkout saw 503 UH. Fix: revert through GitOps, drain the retry backlog gently, then migrate with data: measure connection_security_policy=\"none\", onboard callers, and only then go STRICT.",
        he: "נפתר. שורש הבעיה: STRICT mTLS נאכף על payments בזמן שקורא מחוץ ל-mesh עדיין שלח plaintext. ה-Envoy בצד ה-inbound עשה reset לחיבורים האלה (NR filter_chain_not_found), ה-retries של ה-client מיצו את ה-threads של billing-legacy, ו-checkout ראה 503 UH. התיקון: revert דרך GitOps, ריקון עדין של ה-backlog של ה-retries, ואז מעבר מבוסס נתונים: למדוד connection_security_policy=\"none\", לצרף את הקוראים, ורק אז לעבור ל-STRICT."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The outage dragged on. Either the fix was silently undone by Argo CD self-heal, or STRICT was re-applied before the plaintext caller was fixed. Lesson: in a GitOps cluster, mitigate through Git; and never re-enable a policy until the data shows no caller will break.",
        he: "ההשבתה נמשכה. או שה-self-heal של Argo CD ביטל את התיקון בשקט, או ש-STRICT הוחל שוב לפני שהקורא ב-plaintext תוקן. הלקח: ב-cluster עם GitOps, ממתנים דרך Git. ולעולם לא מחזירים policy עד שהנתונים מראים ששום קורא לא יישבר."
      },
      end: "lose"
    }
  },
  lessons: ["istio-in-production"]
});

/* ------------------------------------------------------------------ */
INFRA.glossary.push({ term: "Version skew policy", track: "kubernetes", def: { en: "Kubernetes rules for which component versions may run together: kubelet up to 3 minors older than kube-apiserver and never newer, so the control plane always upgrades first, one minor at a time.", he: "החוקים של Kubernetes לגבי אילו גרסאות של רכיבים יכולות לרוץ יחד: kubelet עד 3 minors ישן יותר מה-kube-apiserver ואף פעם לא חדש יותר. לכן ה-control plane תמיד משודרג ראשון, minor אחד בכל פעם." }, lesson: "k8s-fleet-upgrades" });
INFRA.glossary.push({ term: "ztunnel", track: "kubernetes", def: { en: "Istio ambient mode's per-node L4 proxy (a DaemonSet) that provides mTLS over HBONE, L4 authorization and telemetry for every Pod on the node, without sidecars.", he: "ה-proxy של L4 ברמת ה-node ב-ambient mode של Istio (DaemonSet). הוא נותן mTLS מעל HBONE, authorization של L4 וטלמטריה לכל Pod ב-node, בלי sidecars." }, lesson: "istio-in-production" });
INFRA.glossary.push({ term: "Waypoint proxy", track: "kubernetes", def: { en: "An Envoy deployment per namespace or service in Istio ambient mode that adds L7 features (HTTP routing, retries, L7 authorization) only where you need them.", he: "Deployment של Envoy לכל namespace או service ב-ambient mode של Istio, שמוסיף יכולות L7 (ניתוב HTTP, retries, authorization של L7) רק איפה שצריך." }, lesson: "istio-in-production" });
INFRA.glossary.push({ term: "Envoy response flags", track: "kubernetes", def: { en: "Short codes in Envoy access logs that explain why a request failed: UH no healthy upstream, UF connection failure, UO circuit-breaker overflow, NR no route, URX retries exhausted.", he: "קודים קצרים ב-access logs של Envoy שמסבירים למה בקשה נכשלה: UH אין upstream בריא, UF כשל חיבור, UO חריגה מה-circuit breaker, NR אין route, URX נגמרו ה-retries." }, lesson: "istio-in-production" });
INFRA.glossary.push({ term: "Global rate limiting", track: "networking", def: { en: "Rate limiting where all gateway replicas share counters in a central service (usually backed by Redis), giving exact per-tenant quotas at the cost of one extra call per request.", he: "rate limiting שבו כל ה-replicas של ה-gateway חולקים counters בשירות מרכזי (בדרך כלל מגובה ב-Redis). זה נותן quotas מדויקות לכל tenant, במחיר של קריאה נוספת לכל בקשה." }, lesson: "api-gateway-production" });
INFRA.glossary.push({ term: "PeerAuthentication", track: "kubernetes", def: { en: "Istio resource that sets which connections a workload accepts: PERMISSIVE (mTLS and plaintext) or STRICT (mTLS only), per mesh, namespace, workload or port.", he: "resource של Istio שקובע אילו חיבורים workload מקבל: PERMISSIVE (גם mTLS וגם plaintext) או STRICT (רק mTLS), ברמת ה-mesh, ה-namespace, ה-workload או הפורט." }, lesson: "istio-in-production" });
INFRA.glossary.push({ term: "Revision tag", track: "kubernetes", def: { en: "A stable Istio alias (like prod-stable) that points at one installed istiod revision; namespaces reference the tag, so a canary control-plane upgrade or rollback is moving the tag plus restarting Pods.", he: "alias יציב ב-Istio (למשל prod-stable) שמצביע על revision מותקן אחד של istiod. ה-namespaces מפנים ל-tag, ולכן שדרוג קנרית של ה-control plane או rollback הם הזזת ה-tag ועוד restart ל-Pods." }, lesson: "istio-in-production" });
INFRA.glossary.push({ term: "Upgrade wave", track: "kubernetes", def: { en: "A cohort of clusters upgraded together (dev, canary prod cluster, then region by region), selected by a cluster label and separated by soak time and automated gates.", he: "קבוצה של clusters שמשודרגים יחד (dev, cluster קנרית ב-prod, ואז region אחרי region), שנבחרת לפי label של cluster ומופרדת בזמן soak וב-gates אוטומטיים." }, lesson: "k8s-fleet-upgrades" });
