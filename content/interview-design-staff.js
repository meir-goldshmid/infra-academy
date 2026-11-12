// Interview prep: Staff / Principal-level system design cases
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.designs = window.INFRA.designs || [];

/* ------------------------------------------------------------------ */
/* 1. Multi-tenant internal Kubernetes platform                        */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-k8s-platform", icon: "🏗️", level: 3,
  title: { en: "Multi-tenant internal Kubernetes platform for 300 teams", he: "פלטפורמת Kubernetes פנימית multi-tenant ל-300 צוותים" },
  prompt: {
    en: "We have ~300 engineering teams. Today each business unit runs its own EKS clusters (about 90 of them), built by hand with different versions, add-ons and security postures. Upgrades lag 3-4 minor versions, nobody knows what anything costs, and every audit is a fire drill. Design the internal Kubernetes platform that all teams will run on, and tell me how we get there from here.",
    he: "יש לנו בערך 300 צוותי פיתוח. היום כל business unit מריצה clusters משלה ב-EKS (בערך 90), שנבנו ידנית עם גרסאות, add-ons ורמות אבטחה שונות. השדרוגים מפגרים 3-4 גרסאות minor, אף אחד לא יודע כמה משהו עולה, וכל audit הוא שריפה. תתכנן את פלטפורמת ה-Kubernetes הפנימית שכל הצוותים ירוצו עליה, ותגיד לי איך מגיעים לשם מהמצב הנוכחי."
  },
  clarify: [
    { en: "What is the workload mix: stateless services only, or also stateful (databases, Kafka), GPU/ML, batch jobs and untrusted code (CI runners)?", he: "מה תמהיל ה-workloads: רק stateless services, או גם stateful (DBs, Kafka), GPU/ML, batch jobs וקוד לא מהימן (CI runners)?" },
    { en: "What isolation do compliance and security actually require — is namespace isolation enough, or do PCI/regulated workloads need dedicated clusters or nodes?", he: "איזו רמת isolation נדרשת באמת מבחינת compliance ואבטחה — namespace isolation מספיק, או ש-workloads של PCI/רגולציה צריכים clusters או nodes ייעודיים?" },
    { en: "How many regions/environments, and what availability target do tenant services expect from the platform (99.9 vs 99.99)?", he: "כמה regions וסביבות, ואיזה יעד זמינות ה-services של הצוותים מצפים מהפלטפורמה (99.9 מול 99.99)?" },
    { en: "What is the platform team size and mandate — can we make the platform mandatory, or must it win adoption on merit?", he: "מה גודל צוות הפלטפורמה ומה המנדט — אפשר להפוך את הפלטפורמה לחובה, או שהיא צריכה לנצח על אימוץ בזכות עצמה?" },
    { en: "Is there a chargeback/showback expectation from finance, and at what granularity (team, service, cost center)?", he: "יש ציפייה מ-finance ל-chargeback/showback, ובאיזו רזולוציה (צוות, service, cost center)?" },
    { en: "What is already standard: CI system, identity provider, service mesh, secrets store, observability stack?", he: "מה כבר סטנדרטי היום: מערכת CI, identity provider, service mesh, secrets store, stack של observability?" }
  ],
  functional: [
    { en: "A team self-serves a new service/namespace in minutes via a golden path (template repo + one PR), with quotas, RBAC, network policy and dashboards pre-wired.", he: "צוות פותח לעצמו service/namespace חדש בדקות דרך golden path (template repo ו-PR אחד), עם quotas, RBAC, network policy ו-dashboards מחוברים מראש." },
    { en: "All cluster and tenant config is declarative in Git and reconciled by GitOps; drift is detected and reverted.", he: "כל הקונפיגורציה של ה-clusters וה-tenants דקלרטיבית ב-Git ומסונכרנת ב-GitOps; drift מזוהה ומוחזר." },
    { en: "Policy (admission) enforces security baselines: no privileged pods, signed images only, required labels (team, cost-center), resource requests.", he: "Policy ב-admission אוכפת baseline אבטחתי: בלי privileged pods, רק images חתומים, labels חובה (team, cost-center), ו-resource requests." },
    { en: "Per-team cost allocation (showback, later chargeback) down to the namespace/workload.", he: "הקצאת עלויות לכל צוות (showback ובהמשך chargeback) עד רמת namespace/workload." },
    { en: "The fleet is upgraded continuously (every Kubernetes minor within ~3 months of release) without tenant tickets.", he: "ה-fleet משודרג ברציפות (כל minor של Kubernetes בתוך ~3 חודשים מהשחרור) בלי tickets לצוותים." }
  ],
  nonFunctional: [
    { en: "Platform control-plane availability 99.95%; a failure of one cluster must affect at most ~5% of tenants (blast radius).", he: "זמינות ה-control plane של הפלטפורמה 99.95%; נפילה של cluster אחד צריכה לפגוע לכל היותר בכ-5% מהצוותים (blast radius)." },
    { en: "Scale: ~300 teams, ~6,000 services, ~60,000 pods, ~3,000 nodes across 3 regions.", he: "סקייל: ~300 צוותים, ~6,000 services, ~60,000 pods, ~3,000 nodes על פני 3 regions." },
    { en: "Strong isolation by default: a compromised tenant pod cannot reach other tenants' secrets, network or nodes (for regulated tiers).", he: "isolation חזק כברירת מחדל: pod של tenant שנפרץ לא יכול להגיע לסודות, לרשת או ל-nodes של tenants אחרים (ב-tiers רגולטוריים)." },
    { en: "Cost: raise average CPU utilization from ~15% to 40%+; platform overhead below 10% of compute spend.", he: "עלות: להעלות ניצולת CPU ממוצעת מ-~15% ל-40% ומעלה; overhead של הפלטפורמה מתחת ל-10% מהוצאות ה-compute." }
  ],
  estimates: {
    en: `<p><strong>Fleet sizing:</strong> 60,000 pods ÷ ~30 pods/node ≈ 2,000 nodes at today's packing; with better bin-packing and right-sizing aim for ~3,000 nodes of mixed size including headroom. Kubernetes scales to 5,000 nodes / 150k pods per cluster, but the <em>operational</em> sweet spot is ~300-800 nodes: etcd stays small (&lt; 4 GB), LIST calls stay fast, and an upgrade or bad admission webhook hits a bounded set of tenants.</p>
<p><strong>Cluster count:</strong> 3 regions × 2 envs (prod, non-prod) × ~4-6 shared "cells" per prod region + a few dedicated clusters (PCI, GPU, CI runners) ≈ <strong>25-35 clusters</strong>, down from 90 snowflakes. Each cell hosts ~50-70 teams, so one cell outage ≈ 5% of tenants.</p>
<p><strong>Cost:</strong> current spend ~90 clusters × ~$25k/month ≈ $2.2M/month at 15% CPU utilization. Consolidating to 40% utilization with Karpenter + right-sizing ≈ 40-50% compute saving → <strong>~$0.9-1.1M/month saved</strong>. Each EKS control plane is only $73/month, so fewer clusters is about ops toil, not control-plane fees. Platform team cost: ~15 engineers ≈ $4M/year — paid back in about 4 months.</p>
<p><strong>GitOps load:</strong> 6,000 services × ~3 envs ≈ 18,000 Argo CD Applications. One Argo CD instance struggles above ~2-3k apps; plan for sharded application controllers or one Argo CD per region/cell group.</p>`,
    he: `<p><strong>גודל ה-fleet:</strong> 60,000 pods ÷ ~30 pods ל-node ≈ 2,000 nodes ב-packing של היום; עם bin-packing ו-right-sizing טובים יותר מכוונים ל-~3,000 nodes בגדלים מעורבים כולל headroom. Kubernetes מגיע ל-5,000 nodes ו-150k pods ל-cluster, אבל ה-sweet spot <em>התפעולי</em> הוא ~300-800 nodes: ה-etcd נשאר קטן (&lt; 4 GB), קריאות LIST נשארות מהירות, ושדרוג או admission webhook דפוק פוגעים בקבוצה חסומה של צוותים.</p>
<p><strong>מספר clusters:</strong> 3 regions × 2 סביבות (prod, non-prod) × ~4-6 "cells" משותפים בכל region של prod + כמה clusters ייעודיים (PCI, GPU, CI runners) ≈ <strong>25-35 clusters</strong>, במקום 90 פתיתי שלג. כל cell מארח ~50-70 צוותים, אז נפילה של cell ≈ 5% מהצוותים.</p>
<p><strong>עלות:</strong> היום בערך 90 clusters × ~$25k בחודש ≈ $2.2M בחודש בניצולת CPU של 15%. איחוד לניצולת 40% עם Karpenter ו-right-sizing ≈ חיסכון של 40-50% ב-compute → <strong>~$0.9-1.1M בחודש</strong>. ה-control plane של EKS עולה רק $73 בחודש, אז פחות clusters זה עניין של toil תפעולי, לא של עלות control plane. צוות פלטפורמה של ~15 מהנדסים ≈ $4M בשנה — מחזיר את עצמו תוך ~4 חודשים.</p>
<p><strong>עומס GitOps:</strong> 6,000 services × ~3 סביבות ≈ 18,000 Applications של Argo CD. instance אחד של Argo CD מתחיל להתקשות מעל ~2-3k apps; מתכננים application controllers משורדים (sharded) או Argo CD אחד לכל region/קבוצת cells.</p>`
  },
  api: `# Developer-facing API = Git + a thin portal (Backstage) — not kubectl
POST /platform/v1/tenants            {team, cost_center, tier: standard|regulated, owners[]}  -> 201 {tenant_id, cell}
POST /platform/v1/tenants/{t}/apps   {name, template: web|worker|cron, envs[]}                 -> 201 {repo_url, argocd_apps[]}
PUT  /platform/v1/tenants/{t}/quota  {cpu, memory, gpu}            -> 202 (opens PR, needs approval above budget)
GET  /platform/v1/tenants/{t}/cost?window=30d  -> {cpu_usd, mem_usd, storage_usd, idle_usd, by_workload[]}
GET  /platform/v1/clusters           -> [{name, cell, region, k8s_version, tenants, status}]

# Underneath: Kubernetes CRDs reconciled by the platform
kind: Tenant   (namespaces, ResourceQuota, LimitRange, RBAC, NetworkPolicy, IRSA roles)
kind: ClusterClaim / Cluster (Cluster API or Terraform-managed EKS)`,
  dataModel: `tenants(tenant_id PK, team, cost_center, tier, cell_id, owners[], created_at)
cells(cell_id PK, region, env, clusters[], capacity_cpu, tenant_count, k8s_version, ring)
apps(app_id PK, tenant_id FK, repo, template, envs[], argocd_app_names[])
quotas(tenant_id, cluster, cpu, memory, gpu, approved_by, expires_at)
cost_daily(date, cluster, namespace, workload, cpu_core_h, mem_gb_h, storage_gb, usd, idle_share_usd)
-- Source of truth = Git: platform-fleet repo (clusters, add-ons, policies) + tenant repos (apps)`,
  diagram: `   Dev --PR--> tenant repo ----+          Backstage portal / golden paths
                               |               |
   Platform --PR--> fleet repo-+--> Argo CD (per region, sharded controllers)
                                         |  ApplicationSets: cluster x add-on x tenant
          +------------------------------+-------------------------------+
          |                              |                               |
   +------v--------+              +------v--------+               +------v--------+
   | cell eu-1a    |              | cell eu-1b    |    ...        | pci-eu-1      |
   | EKS 1.31      |              | EKS 1.30      |               | dedicated     |
   | ring: canary  |              | ring: early   |               | ring: late    |
   | ~60 teams     |              | ~60 teams     |               | 8 teams       |
   | Karpenter     |              | Karpenter     |               | own nodes     |
   | Kyverno/OPA   |              | Kyverno/OPA   |               | + gVisor      |
   | Cilium netpol |              | Cilium netpol |               |               |
   +------+--------+              +------+--------+               +------+--------+
          |                              |                               |
          +----> OpenCost / CUR join ----+--> cost warehouse --> showback dashboards
          +----> metrics/logs (shared observability platform)`,
  deepDives: [
    {
      h: { en: "Tenancy model: namespaces-as-a-service in shared cells, dedicated clusters as the exception", he: "מודל tenancy: namespaces-as-a-service ב-cells משותפים, clusters ייעודיים כחריג" },
      body: {
        en: `<table><tr><th>Model</th><th>Isolation</th><th>Cost/overhead</th><th>Use for</th></tr>
<tr><td>Cluster per team (today)</td><td>Strong</td><td>Very high: 90 snowflakes, idle capacity everywhere</td><td>Nobody, by default</td></tr>
<tr><td>Namespace per team in shared cells</td><td>Soft (shared kernel, API server)</td><td>Low: shared nodes, bin-packing</td><td>~90% of teams</td></tr>
<tr><td>Dedicated node pool in shared cell</td><td>Medium (no shared kernel)</td><td>Medium</td><td>Noisy/GPU/latency-sensitive</td></tr>
<tr><td>Dedicated cluster</td><td>Strong</td><td>High</td><td>PCI scope, untrusted code (CI), platform itself</td></tr></table>
<p>A tenant is a <code>Tenant</code> CR that the platform expands into namespaces, <code>ResourceQuota</code>/<code>LimitRange</code>, RBAC bound to the team's IdP group, a default-deny <code>NetworkPolicy</code>, and IRSA/Pod Identity roles scoped to the team's AWS resources. Soft multi-tenancy is acceptable because all tenants are employees; untrusted code (CI runners building arbitrary PRs) never shares nodes with production.</p>
<blockquote>💡 Real world: the hardest isolation problems are not network — they are shared cluster-scoped resources: CRDs with conflicting versions, a tenant's broken validating webhook blocking everyone's deploys, and API-server LIST storms from one team's controller. Ban tenant-installed webhooks and CRDs; offer them as platform-managed add-ons, and set API Priority and Fairness per tenant.</blockquote>`,
        he: `<table><tr><th>מודל</th><th>Isolation</th><th>עלות/overhead</th><th>מתי</th></tr>
<tr><td>Cluster לכל צוות (היום)</td><td>חזק</td><td>גבוה מאוד: 90 פתיתי שלג, קיבולת מתה בכל מקום</td><td>אף אחד, כברירת מחדל</td></tr>
<tr><td>Namespace לכל צוות ב-cells משותפים</td><td>רך (kernel ו-API server משותפים)</td><td>נמוך: nodes משותפים, bin-packing</td><td>~90% מהצוותים</td></tr>
<tr><td>Node pool ייעודי בתוך cell משותף</td><td>בינוני (בלי kernel משותף)</td><td>בינוני</td><td>רועשים, GPU, רגישים ל-latency</td></tr>
<tr><td>Cluster ייעודי</td><td>חזק</td><td>גבוה</td><td>PCI scope, קוד לא מהימן (CI), הפלטפורמה עצמה</td></tr></table>
<p>Tenant הוא CR מסוג <code>Tenant</code> שהפלטפורמה מתרגמת ל-namespaces, <code>ResourceQuota</code>/<code>LimitRange</code>, RBAC שמחובר לקבוצה של הצוות ב-IdP, <code>NetworkPolicy</code> של default-deny, ו-roles של IRSA/Pod Identity שמוגבלים למשאבי ה-AWS של הצוות. soft multi-tenancy מקובל כי כל ה-tenants הם עובדים; קוד לא מהימן (CI runners שבונים PRs שרירותיים) אף פעם לא חולק nodes עם production.</p>
<blockquote>💡 מהשטח: בעיות ה-isolation הקשות הן לא רשת — הן משאבים משותפים ברמת ה-cluster: CRDs בגרסאות מתנגשות, validating webhook שבור של צוות אחד שחוסם deploys לכולם, וסערות LIST על ה-API server מ-controller של צוות אחד. אוסרים על צוותים להתקין webhooks ו-CRDs; מציעים אותם כ-add-ons מנוהלים, ומגדירים API Priority and Fairness לכל tenant.</blockquote>`
      }
    },
    {
      h: { en: "Fleet as cattle: cells, rings and continuous upgrades", he: "Fleet כמו בקר: cells, rings ושדרוגים רציפים" },
      body: {
        en: `<p>Clusters are <strong>cells</strong>: identical, disposable, created from one Terraform/Cluster API module plus an Argo CD ApplicationSet that installs the add-on bundle (Karpenter, CNI, CoreDNS, ingress, cert-manager, external-secrets, Kyverno, OTel collector). Nothing is installed by hand; a cell can be rebuilt from Git in under an hour.</p>
<p>Upgrades roll through <strong>rings</strong>: <code>canary</code> (platform's own cell + volunteer teams) → <code>early</code> (10%) → <code>main</code> (80%) → <code>late</code> (PCI, stateful). Each ring bakes 3-7 days with automated gates: API deprecation scan (<code>pluto</code>/<code>kubent</code>) run against tenant repos <em>before</em> the ring starts, error-rate/SLO burn of tenant services, add-on health. The platform owns the bundle version matrix (k8s 1.31 ↔ Karpenter x ↔ CNI y), so tenants never upgrade anything themselves.</p>
<p>For big jumps or CNI changes, prefer <strong>blue/green clusters</strong>: stand up a new cell, move tenants by flipping their ApplicationSet target and DNS weights, then delete the old cell. Because tenants are stateless and declarative, moving is cheap — that is the payoff of GitOps.</p>
<blockquote>⚠️ Production tip: PodDisruptionBudgets written by tenants as <code>maxUnavailable: 0</code> will block node drains forever. Policy should reject PDBs that make drains impossible, and the upgrade tooling should report blocking PDBs back to the owning team.</blockquote>`,
        he: `<p>ה-clusters הם <strong>cells</strong>: זהים, חד-פעמיים, נוצרים ממודול Terraform/Cluster API אחד ועוד ApplicationSet של Argo CD שמתקין את חבילת ה-add-ons (Karpenter, CNI, CoreDNS, ingress, cert-manager, external-secrets, Kyverno, OTel collector). שום דבר לא מותקן ידנית; אפשר לבנות cell מחדש מ-Git בפחות משעה.</p>
<p>שדרוגים מתגלגלים ב-<strong>rings</strong>: <code>canary</code> (ה-cell של הפלטפורמה עצמה וצוותים מתנדבים) → <code>early</code> (10%) → <code>main</code> (80%) → <code>late</code> (PCI, stateful). כל ring "מבשיל" 3-7 ימים עם gates אוטומטיים: סריקת API deprecations (<code>pluto</code>/<code>kubent</code>) על ה-repos של הצוותים <em>לפני</em> שה-ring מתחיל, error rate ו-SLO burn של ה-services, ובריאות ה-add-ons. הפלטפורמה מחזיקה את מטריצת הגרסאות (k8s 1.31 ↔ Karpenter x ↔ CNI y), כך שצוותים אף פעם לא משדרגים כלום בעצמם.</p>
<p>לקפיצות גדולות או החלפת CNI עדיף <strong>blue/green ברמת cluster</strong>: מרימים cell חדש, מעבירים צוותים ע"י שינוי ה-target ב-ApplicationSet ומשקולות DNS, ואז מוחקים את ה-cell הישן. כי הצוותים stateless ודקלרטיביים, ההעברה זולה — זה בדיוק הרווח של GitOps.</p>
<blockquote>⚠️ טיפ מ-production: PDBs שצוותים כותבים עם <code>maxUnavailable: 0</code> יחסמו drain של nodes לנצח. ה-policy צריכה לדחות PDBs שהופכים drain לבלתי אפשרי, וכלי השדרוג צריך לדווח על PDBs חוסמים לצוות הבעלים.</blockquote>`
      }
    },
    {
      h: { en: "Policy and guardrails: paved road, not a gate", he: "Policy ומעקות: כביש סלול, לא מחסום" },
      body: {
        en: `<p>Guardrails live in three layers: <strong>CI</strong> (conftest/kyverno CLI on the PR, fast feedback), <strong>admission</strong> (Kyverno or Gatekeeper, the real enforcement), and <strong>runtime</strong> (Falco/Tetragon for detection). Every policy ships first in <code>Audit</code> mode with a report per team, then flips to <code>Enforce</code> after the violation count is near zero — rolling out policy is a migration, not a switch.</p>
<pre>apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-cost-labels }
spec:
  validationFailureAction: Audit   # -&gt; Enforce after 30 days
  rules:
  - name: team-and-cost-center
    match: { any: [ { resources: { kinds: [Deployment, StatefulSet, Job] } } ] }
    validate:
      message: "labels team and cost-center are required"
      pattern: { metadata: { labels: { team: "?*", cost-center: "?*" } } }</pre>
<p>Admission webhooks are on the critical path of every deploy: run them with 3+ replicas, a PDB, <code>timeoutSeconds: 5</code>, and an explicit <code>failurePolicy</code> decision per policy (security = Fail, hygiene = Ignore). Exclude <code>kube-system</code> and the platform namespaces so a broken webhook cannot prevent its own repair.</p>`,
        he: `<p>המעקות יושבים בשלוש שכבות: <strong>CI</strong> (conftest/kyverno CLI על ה-PR, פידבק מהיר), <strong>admission</strong> (Kyverno או Gatekeeper, האכיפה האמיתית), ו-<strong>runtime</strong> (Falco/Tetragon לזיהוי). כל policy יוצאת קודם במצב <code>Audit</code> עם דוח לכל צוות, ורק כשמספר ההפרות קרוב לאפס עוברת ל-<code>Enforce</code> — להוציא policy זו מיגרציה, לא מתג.</p>
<pre>apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-cost-labels }
spec:
  validationFailureAction: Audit   # -&gt; Enforce after 30 days
  rules:
  - name: team-and-cost-center
    match: { any: [ { resources: { kinds: [Deployment, StatefulSet, Job] } } ] }
    validate:
      message: "labels team and cost-center are required"
      pattern: { metadata: { labels: { team: "?*", cost-center: "?*" } } }</pre>
<p>Admission webhooks יושבים על ה-critical path של כל deploy: מריצים אותם עם 3+ replicas, PDB, <code>timeoutSeconds: 5</code>, והחלטה מפורשת על <code>failurePolicy</code> לכל policy (אבטחה = Fail, היגיינה = Ignore). מחריגים את <code>kube-system</code> ואת ה-namespaces של הפלטפורמה, כדי ש-webhook שבור לא ימנע את התיקון של עצמו.</p>`
      }
    },
    {
      h: { en: "Cost allocation: showback first, then chargeback", he: "הקצאת עלויות: קודם showback, אחר כך chargeback" },
      body: {
        en: `<p>Allocate by <strong>max(requests, usage)</strong> per container × node price (from the CUR, including Savings Plans/Spot discounts), aggregated by the required <code>team</code>/<code>cost-center</code> labels. Requests, not usage, are what block capacity — charging on requests is what makes teams right-size. Idle node capacity and shared add-ons (ingress, observability agents, DNS) are spread proportionally as an explicit "platform tax" line, never hidden.</p>
<p>Tools: OpenCost/Kubecost for in-cluster allocation, joined in the warehouse with the AWS CUR for the authoritative dollar. Publish weekly showback per team with a "top 5 savings" list (over-requested CPU, idle PVCs, non-prod running nights and weekends). Move to real chargeback only after 2-3 quarters when numbers are trusted — chargeback on bad data destroys the platform's credibility.</p>`,
        he: `<p>מקצים לפי <strong>max(requests, usage)</strong> לכל container × מחיר ה-node (מה-CUR, כולל הנחות Savings Plans/Spot), ומאגדים לפי ה-labels החובה <code>team</code>/<code>cost-center</code>. requests, לא usage, הם מה שתופס קיבולת — לחייב לפי requests זה מה שגורם לצוותים לעשות right-sizing. קיבולת idle של nodes ו-add-ons משותפים (ingress, agents של observability, DNS) מתחלקים באופן יחסי כשורה מפורשת של "מס פלטפורמה", אף פעם לא מוסתרים.</p>
<p>כלים: OpenCost/Kubecost להקצאה בתוך ה-cluster, ו-join ב-warehouse מול ה-CUR של AWS בשביל הדולר הסמכותי. מפרסמים showback שבועי לכל צוות עם רשימת "5 חסכונות מובילים" (CPU מוגזם ב-requests, PVCs יתומים, non-prod שרץ בלילות ובסופ"ש). עוברים ל-chargeback אמיתי רק אחרי 2-3 רבעונים, כשסומכים על המספרים — chargeback על דאטה גרוע הורס את האמינות של הפלטפורמה.</p>`
      }
    },
    {
      h: { en: "Migration path, org model and failure modes", he: "מסלול מיגרציה, מודל ארגוני ו-failure modes" },
      body: {
        en: `<p><strong>Migration (18 months):</strong> Q1 build 2 cells + golden path, onboard 5 friendly teams. Q2 tenant-migration tooling (export manifests → Helm/Kustomize in Git, swap secrets to external-secrets, DNS weight shifting) and a "migration squad" that does the first move <em>with</em> each team. Q3-Q4 migrate by wave, most-standard teams first; old clusters frozen (no new services). Q5-Q6 long tail + stateful workloads, then decommission. Track a single metric publicly: % of pods on the platform.</p>
<p><strong>Org:</strong> platform as a product — a product manager, a published roadmap, SLOs for the platform itself (deploy-to-running latency, API availability), office hours, and NPS from tenants. Split the team into fleet (clusters/upgrades), developer experience (golden paths, portal) and governance (policy, cost). Tenants own their apps' SLOs; the platform owns the cluster SLO — write that boundary down in a RACI.</p>
<p><strong>Failure modes:</strong> a bad add-on rollout across all cells (mitigate with rings and ApplicationSet progressive sync); a broken admission webhook blocking all deploys (failurePolicy, exclusions, alert on webhook latency); Argo CD outage (running workloads are unaffected — GitOps is not on the data path; keep a break-glass kubectl procedure); etcd overload from a tenant controller (APF, per-tenant rate limits); IP exhaustion in VPC subnets (prefix delegation, secondary CIDRs planned upfront).</p>`,
        he: `<p><strong>מיגרציה (18 חודשים):</strong> רבעון 1 בונים 2 cells ו-golden path, ומעלים 5 צוותים ידידותיים. רבעון 2 כלי מיגרציה ל-tenants (ייצוא manifests ל-Helm/Kustomize ב-Git, מעבר סודות ל-external-secrets, הזזת משקולות DNS) ו"squad מיגרציה" שעושה את המעבר הראשון <em>יחד</em> עם כל צוות. רבעונים 3-4 מעבירים בגלים, קודם הצוותים הכי סטנדרטיים; ה-clusters הישנים מוקפאים (אין services חדשים). רבעונים 5-6 הזנב הארוך ו-workloads של stateful, ואז decommission. עוקבים בפומבי אחרי מדד אחד: אחוז ה-pods על הפלטפורמה.</p>
<p><strong>ארגון:</strong> הפלטפורמה כמוצר — product manager, roadmap מפורסם, SLOs לפלטפורמה עצמה (זמן מ-deploy ל-running, זמינות API), office hours ו-NPS מהצוותים. מפצלים את הצוות ל-fleet (clusters ושדרוגים), developer experience (golden paths, portal) ו-governance (policy, עלויות). הצוותים אחראים על ה-SLOs של האפליקציות שלהם; הפלטפורמה אחראית על ה-SLO של ה-cluster — כותבים את הגבול הזה ב-RACI.</p>
<p><strong>Failure modes:</strong> rollout דפוק של add-on על כל ה-cells (מתגוננים עם rings ו-progressive sync של ApplicationSet); admission webhook שבור שחוסם את כל ה-deploys (failurePolicy, החרגות, alert על latency של webhook); Argo CD נופל (ה-workloads שרצים לא נפגעים — GitOps לא על ה-data path; מחזיקים נוהל break-glass עם kubectl); עומס על etcd מ-controller של צוות (APF, rate limits לכל tenant); אזילת IPs ב-subnets של ה-VPC (prefix delegation, secondary CIDRs שמתוכננים מראש).</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Few big clusters vs many small cells: big clusters bin-pack better and are fewer to upgrade; cells bound the blast radius of upgrades, webhooks and API-server overload. Cells of ~300-800 nodes balance both.", he: "מעט clusters גדולים מול הרבה cells קטנים: clusters גדולים עושים bin-packing טוב יותר ויש פחות לשדרג; cells מגבילים את ה-blast radius של שדרוגים, webhooks ועומס על ה-API server. cells של ~300-800 nodes מאזנים בין השניים." },
    { en: "Namespace (soft) vs cluster (hard) tenancy: soft tenancy is far cheaper and enables self-service, but shares the kernel and control plane — reserve dedicated clusters for compliance scope and untrusted code.", he: "Tenancy רך (namespace) מול קשה (cluster): הרך הרבה יותר זול ומאפשר self-service, אבל חולק kernel ו-control plane — שומרים clusters ייעודיים ל-compliance scope ולקוד לא מהימן." },
    { en: "Mandate vs earned adoption: a mandate speeds migration but breeds resentment and shadow infra; a great golden path plus frozen legacy clusters gets most of the speed with goodwill.", he: "חובה מול אימוץ מרצון: חובה מאיצה מיגרציה אבל יוצרת טינה ו-shadow infra; golden path טוב ועוד הקפאה של ה-clusters הישנים נותנים את רוב המהירות עם רצון טוב." },
    { en: "Abstraction level: hiding Kubernetes behind a portal/CRD simplifies 80% of cases but frustrates power users — keep an escape hatch (raw manifests through the same policy).", he: "רמת אבסטרקציה: להסתיר את Kubernetes מאחורי portal/CRD מפשט 80% מהמקרים אבל מתסכל power users — משאירים escape hatch (manifests גולמיים שעוברים באותה policy)." }
  ],
  followUps: [
    { q: { en: "A team insists on its own cluster 'for performance'. How do you decide?", he: "צוות מתעקש על cluster משלו 'בשביל ביצועים'. איך מחליטים?" },
      a: { en: "Ask for the actual requirement: noisy neighbours, kernel tuning, GPUs, or latency? Most are solved with a dedicated node pool (taints/tolerations, their own Karpenter NodePool) in a shared cell. Grant a dedicated cluster only for compliance scope, untrusted code, or cluster-scoped needs we cannot host — and then it is still a platform-built cell on the same rings, never a snowflake. Make the cost visible on their showback.", he: "שואלים מה הדרישה האמיתית: noisy neighbours, כיוונון kernel, GPUs או latency? רובם נפתרים עם node pool ייעודי (taints/tolerations ו-NodePool משלהם ב-Karpenter) בתוך cell משותף. cluster ייעודי נותנים רק בגלל compliance scope, קוד לא מהימן או צורך ברמת cluster שאי אפשר לארח — וגם אז זה cell שהפלטפורמה בונה על אותם rings, לא פתית שלג. ושמים את העלות גלוי ב-showback שלהם." } },
    { q: { en: "How do you upgrade 30 clusters every quarter without a war room?", he: "איך משדרגים 30 clusters כל רבעון בלי חדר מלחמה?" },
      a: { en: "Treat it as a pipeline: deprecation scan against all tenant repos weeks ahead with auto-filed PRs, then ring-by-ring rollout with automated gates (tenant SLO burn, add-on health), node replacement via Karpenter drift instead of in-place, and a hard rule that the platform never runs more than N-1 minor versions. If a ring gate fails the pipeline halts automatically.", he: "מתייחסים לזה כ-pipeline: סריקת deprecations על כל ה-repos של הצוותים שבועות מראש עם PRs אוטומטיים, ואז rollout ring אחרי ring עם gates אוטומטיים (SLO burn של הצוותים, בריאות add-ons), החלפת nodes דרך drift של Karpenter במקום in-place, וחוק ברזל שהפלטפורמה אף פעם לא מפגרת יותר מ-N-1 גרסאות minor. אם gate נכשל, ה-pipeline עוצר לבד." } },
    { q: { en: "Argo CD for 18,000 apps is slow and is now a single point of failure for deploys. What do you do?", he: "Argo CD עם 18,000 apps איטי ועכשיו הוא single point of failure ל-deploys. מה עושים?" },
      a: { en: "Shard: one Argo CD per region or cell group, with application-controller sharding and separate repo-servers with caching; use webhooks instead of polling. Note that Argo CD down means no new deploys, not an outage — but give teams an emergency path (pinned rollback via the same Git revision) and alert on sync latency as a platform SLO.", he: "משרדים (shard): Argo CD לכל region או קבוצת cells, עם sharding של ה-application controller ו-repo-servers נפרדים עם cache; משתמשים ב-webhooks במקום polling. חשוב לזכור ש-Argo CD למטה אומר שאין deploys חדשים, לא outage — אבל נותנים לצוותים מסלול חירום (rollback לאותה revision ב-Git) ומגדירים alert על sync latency כ-SLO של הפלטפורמה." } },
    { q: { en: "Finance wants chargeback next month. What's your answer?", he: "Finance רוצים chargeback בחודש הבא. מה התשובה?" },
      a: { en: "Showback now, chargeback once label coverage is above ~95% and teams agree the numbers reconcile with the CUR within a few percent. Charging on untrusted numbers creates disputes that the platform team will spend all its time arbitrating. Offer finance a trusted aggregate per BU immediately.", he: "showback עכשיו, chargeback כשכיסוי ה-labels מעל ~95% והצוותים מסכימים שהמספרים מתיישבים מול ה-CUR בטווח של כמה אחוזים. לחייב לפי מספרים לא אמינים יוצר מחלוקות שצוות הפלטפורמה יבזבז את כל זמנו בלפתור. נותנים ל-finance מיד סכום אמין ברמת BU." } }
  ],
  related: ["k8s-namespaces-rbac", "k8s-argocd", "k8s-security-policy", "k8s-cost", "k8s-day2-upgrades", "k8s-node-autoprovisioning", "staff-platform-engineering", "staff-cells-blast-radius"]
});

/* ------------------------------------------------------------------ */
/* 2. Durable distributed log / message queue (Kafka-like)             */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-message-queue", icon: "📜", level: 3,
  title: { en: "Design a durable distributed log (Kafka-like)", he: "תכנון distributed log עמיד (בסגנון Kafka)" },
  prompt: {
    en: "Design a durable, horizontally scalable message log that hundreds of services can publish to and consume from — think Kafka. It must not lose acknowledged messages when a broker dies, must preserve ordering where it matters, and must let consumers replay history. Walk me through partitions, replication, consumer offsets and retention, and what breaks first at scale.",
    he: "תתכנן message log עמיד שגדל אופקית, שמאות services יכולים לפרסם אליו ולצרוך ממנו — תחשוב Kafka. אסור לו לאבד הודעות שאושרו כש-broker מת, הוא צריך לשמור סדר איפה שזה חשוב, ולאפשר ל-consumers לעשות replay להיסטוריה. תעבור איתי על partitions, replication, consumer offsets ו-retention, ומה נשבר ראשון בסקייל."
  },
  clarify: [
    { en: "Throughput and message size: peak MB/s in and out, average and max message size? Read fan-out (how many consumer groups per topic)?", he: "Throughput וגודל הודעה: כמה MB/s ב-peak נכנס ויוצא, מה גודל הודעה ממוצע ומקסימלי? מה ה-fan-out בקריאה (כמה consumer groups לכל topic)?" },
    { en: "What ordering guarantee is required — global, per key (e.g. per account), or none?", he: "איזו הבטחת סדר נדרשת — גלובלית, לפי key (למשל לפי חשבון), או בכלל לא?" },
    { en: "Delivery semantics: is at-least-once with idempotent consumers acceptable, or do some pipelines need exactly-once (read-process-write)?", he: "סמנטיקת מסירה: at-least-once עם consumers אידמפוטנטיים מספיק, או שיש pipelines שצריכים exactly-once (read-process-write)?" },
    { en: "Retention: hours, days, or forever (event sourcing / compacted state topics)?", he: "Retention: שעות, ימים, או לנצח (event sourcing / topics מסוג compacted state)?" },
    { en: "Durability vs latency: can producers wait for replication to 2+ AZs (adds ~1-2 ms), and is cross-region replication required?", he: "עמידות מול latency: producers יכולים לחכות לרפליקציה ל-2+ AZs (מוסיף ~1-2 ms), והאם נדרשת רפליקציה בין regions?" }
  ],
  functional: [
    { en: "Producers append messages to named topics; a topic is split into partitions; messages with the same key land in the same partition, in order.", he: "Producers מוסיפים הודעות ל-topics עם שם; topic מפוצל ל-partitions; הודעות עם אותו key נוחתות באותו partition, לפי הסדר." },
    { en: "Consumers in a consumer group share partitions; each group tracks its own committed offsets and can rewind to replay.", he: "Consumers בתוך consumer group מתחלקים ב-partitions; כל group עוקב אחרי ה-offsets שלו ויכול לחזור אחורה ל-replay." },
    { en: "Retention by time/size, plus log compaction (keep latest value per key) for state topics.", he: "Retention לפי זמן/גודל, ועוד log compaction (שומר את הערך האחרון לכל key) ל-topics של state." },
    { en: "Admin: create topics, add partitions, reassign partitions between brokers, quotas per client.", he: "אדמין: יצירת topics, הוספת partitions, העברת partitions בין brokers, quotas לכל client." }
  ],
  nonFunctional: [
    { en: "Zero loss of acknowledged writes with one broker or one AZ down (acks=all, RF=3, min.insync.replicas=2).", he: "אפס אובדן של כתיבות שאושרו כשנופל broker אחד או AZ אחד (acks=all, RF=3, min.insync.replicas=2)." },
    { en: "Throughput: 2 GB/s ingest, 8 GB/s egress at peak; p99 produce latency under 20 ms within a region.", he: "Throughput: 2 GB/s ingest ו-8 GB/s egress ב-peak; p99 של produce מתחת ל-20 ms בתוך region." },
    { en: "Availability 99.95% for produce; consumers can lag but must catch up after outages.", he: "זמינות 99.95% ל-produce; consumers מותר להם לפגר אבל הם צריכים להשלים אחרי תקלות." },
    { en: "Horizontal scale: add brokers without downtime; rebalance data without saturating the network.", he: "סקייל אופקי: מוסיפים brokers בלי downtime; מאזנים דאטה בלי להחניק את הרשת." }
  ],
  estimates: {
    en: `<p><strong>Ingest:</strong> 2 GB/s peak × RF 3 = 6 GB/s written to disk cluster-wide, plus 4 GB/s replication traffic between brokers (followers fetching). Egress: 4 consumer groups on average → 8 GB/s reads, mostly served from page cache because consumers are near the tail.</p>
<p><strong>Brokers:</strong> a broker with 25 Gbps NIC (~3 GB/s) and NVMe should run at &lt; 50% NIC to survive a peer failure and reassignments → ~1.2 GB/s total traffic per broker. (6 + 4 + 8) GB/s ÷ 1.2 ≈ <strong>15 brokers</strong>, round to 18 (6 per AZ).</p>
<p><strong>Storage:</strong> 2 GB/s × 86,400 ≈ 173 TB/day raw; 3-day hot retention × RF 3 ≈ 1.5 PB local disk — expensive. With <strong>tiered storage</strong> keep 12 h locally (≈ 260 TB with RF) and the rest in S3 at ~$0.023/GB-month: 7 days × 173 TB ≈ 1.2 PB ≈ $28k/month in S3 vs ~$150k+ for equivalent replicated NVMe.</p>
<p><strong>Partitions:</strong> a partition sustains ~10-50 MB/s comfortably for a consumer. 2 GB/s ÷ 10 MB/s ≈ 200 partitions minimum for the busiest topics; cluster-wide plan ~20-40k partitions (KRaft handles hundreds of thousands, but each partition costs open files, memory and leader-election time).</p>
<p><strong>Cross-AZ cost:</strong> on AWS inter-AZ traffic is ~$0.01/GB each way. 4 GB/s replication ≈ 345 TB/day ≈ <strong>$3.5k-7k/day</strong> — a top line item. Mitigate with follower fetching (consumers read from same-AZ replica) and compression (zstd ~3-5x on JSON).</p>`,
    he: `<p><strong>Ingest:</strong> 2 GB/s ב-peak × RF 3 = 6 GB/s נכתבים לדיסק בכל ה-cluster, ועוד 4 GB/s תעבורת רפליקציה בין brokers (ה-followers מושכים). Egress: בממוצע 4 consumer groups → 8 GB/s קריאות, רובן מה-page cache כי ה-consumers קרובים לזנב.</p>
<p><strong>Brokers:</strong> broker עם NIC של 25 Gbps (~3 GB/s) ו-NVMe צריך לרוץ מתחת ל-50% מה-NIC כדי לשרוד נפילה של שכן ו-reassignments → ~1.2 GB/s תעבורה כוללת ל-broker. (6 + 4 + 8) GB/s ÷ 1.2 ≈ <strong>15 brokers</strong>, מעגלים ל-18 (6 בכל AZ).</p>
<p><strong>אחסון:</strong> 2 GB/s × 86,400 ≈ 173 TB ביום גולמי; 3 ימי retention חם × RF 3 ≈ 1.5 PB דיסק מקומי — יקר. עם <strong>tiered storage</strong> שומרים 12 שעות מקומית (≈ 260 TB כולל RF) ואת השאר ב-S3 בערך $0.023 ל-GB לחודש: 7 ימים × 173 TB ≈ 1.2 PB ≈ $28k בחודש ב-S3, מול $150k+ ל-NVMe משוכפל שקול.</p>
<p><strong>Partitions:</strong> partition מחזיק בנוחות ~10-50 MB/s ל-consumer. 2 GB/s ÷ 10 MB/s ≈ מינימום 200 partitions ל-topics הכי עמוסים; בכל ה-cluster מתכננים ~20-40k partitions (KRaft מחזיק מאות אלפים, אבל כל partition עולה ב-open files, זיכרון וזמן leader election).</p>
<p><strong>עלות cross-AZ:</strong> ב-AWS תעבורה בין AZs עולה ~$0.01 ל-GB בכל כיוון. 4 GB/s רפליקציה ≈ 345 TB ביום ≈ <strong>$3.5k-7k ביום</strong> — שורה מובילה בחשבון. מקטינים עם follower fetching (consumers קוראים מ-replica באותו AZ) ודחיסה (zstd נותן ~3-5x על JSON).</p>`
  },
  api: `# Producer
Produce(topic, partition|key, records[], acks=all, idempotent=true, txn_id?) -> {partition, base_offset}
# Consumer (pull-based)
JoinGroup(group, member_id, topics[]) -> {generation, assignment[]}
Fetch(topic, partition, offset, max_bytes, max_wait_ms) -> records[] , high_watermark
CommitOffsets(group, generation, {tp: offset}) -> ok | REBALANCE_IN_PROGRESS | ILLEGAL_GENERATION
# Admin
CreateTopic(name, partitions, rf, configs{retention.ms, cleanup.policy, min.insync.replicas})
ReassignPartitions(plan, throttle_bytes_s)`,
  dataModel: `Topic -> partitions[0..N]; each partition = ordered, append-only log of segments
  segment files: 00000000000123456789.log  (+ .index offset->pos, .timeindex ts->offset)
  segment roll: 1 GB or 1 h; retention deletes/uploads whole segments
Partition state (in KRaft metadata log): {leader, leader_epoch, replicas[3], isr[], high_watermark}
Record: {offset, timestamp, key, value, headers, producer_id, producer_epoch, sequence}
Consumer offsets: compacted internal topic __consumer_offsets key=(group,topic,partition) value=offset
Transactions: __transaction_state (txn_id -> producer_id, epoch, status)`,
  diagram: `  producers (key -> hash % N)                    consumer group "billing"
      |  acks=all                                  c1: p0,p1   c2: p2,p3
      v                                                ^
 +----------- topic orders (4 partitions, RF=3) -------+-------------+
 |  AZ-a broker1        AZ-b broker2        AZ-c broker3             |
 |  p0 LEADER  -------> p0 follower ------> p0 follower   (ISR all)  |
 |  p1 follower <------ p1 LEADER --------> p1 follower              |
 |  p2 follower         p2 follower <------ p2 LEADER               |
 |  p3 LEADER  -------> p3 follower         p3 (out of ISR, lagging) |
 +-------------------------------------------------------------------+
        |                          |
   KRaft controller quorum    tiered storage: closed segments -> S3
   (3 nodes, metadata log)    (local hot 12h, remote 7d)

 log of p0:  [0][1][2][3][4][5][6][7] ...   HW=6 (replicated to ISR)
                                  ^ consumers can read only up to HW`,
  deepDives: [
    {
      h: { en: "Replication, ISR and what 'acknowledged' really means", he: "Replication, ISR ומה המשמעות האמיתית של 'אושר'" },
      body: {
        en: `<p>Each partition has one <strong>leader</strong> and followers that pull from it. The <strong>ISR</strong> (in-sync replicas) is the set of replicas caught up within <code>replica.lag.time.max.ms</code> (default 30 s). The <strong>high watermark</strong> is the highest offset replicated to all ISR members; consumers only see data below it.</p>
<p>With <code>acks=all</code> the leader acknowledges once every ISR member has the record. That alone is not enough: if the ISR shrinks to just the leader, <code>acks=all</code> means "acked by one". Hence <code>min.insync.replicas=2</code>: the produce fails with <code>NotEnoughReplicas</code> rather than accepting writes that live on one disk. RF=3 across 3 AZs + min ISR 2 survives one AZ loss with no data loss and no write outage.</p>
<p><code>unclean.leader.election.enable=false</code> keeps an out-of-sync replica from becoming leader (which would silently truncate acked data). That trades availability for durability — the classic CP choice, per partition.</p>
<blockquote>⚠️ Production tip: Kafka acknowledges after the write reaches the page cache of the ISR, not after fsync. Durability comes from replication across failure domains, which is why rack/AZ awareness (<code>broker.rack</code>) is non-negotiable.</blockquote>`,
        he: `<p>לכל partition יש <strong>leader</strong> אחד ו-followers שמושכים ממנו. ה-<strong>ISR</strong> (in-sync replicas) הוא קבוצת ה-replicas שמעודכנים בטווח <code>replica.lag.time.max.ms</code> (ברירת מחדל 30 שניות). ה-<strong>high watermark</strong> הוא ה-offset הגבוה ביותר שהועתק לכל חברי ה-ISR; consumers רואים רק דאטה מתחתיו.</p>
<p>עם <code>acks=all</code> ה-leader מאשר אחרי שכל חברי ה-ISR קיבלו את הרשומה. זה לבד לא מספיק: אם ה-ISR מתכווץ רק ל-leader, <code>acks=all</code> אומר "אושר ע"י אחד". לכן <code>min.insync.replicas=2</code>: ה-produce נכשל עם <code>NotEnoughReplicas</code> במקום לקבל כתיבות שחיות על דיסק אחד. RF=3 על 3 AZs עם min ISR 2 שורד אובדן של AZ בלי אובדן דאטה ובלי השבתת כתיבה.</p>
<p><code>unclean.leader.election.enable=false</code> מונע מ-replica שלא מסונכרן להפוך ל-leader (מה שהיה חותך בשקט דאטה שאושר). זה מחליף זמינות בעמידות — הבחירה הקלאסית של CP, ברמת partition.</p>
<blockquote>⚠️ טיפ מ-production: Kafka מאשר אחרי שהכתיבה הגיעה ל-page cache של ה-ISR, לא אחרי fsync. העמידות מגיעה מרפליקציה בין failure domains, ולכן rack/AZ awareness (<code>broker.rack</code>) זה לא משא ומתן.</blockquote>`
      }
    },
    {
      h: { en: "Partitioning and ordering: the key is the contract", he: "Partitioning וסדר: ה-key הוא החוזה" },
      body: {
        en: `<p>Ordering is guaranteed only <strong>within a partition</strong>. Choose a key that matches the business invariant (account_id for a ledger, order_id for an order lifecycle). <code>hash(key) % N</code> means <strong>adding partitions remaps keys</strong> and breaks per-key ordering during the transition — so over-provision partitions upfront (e.g. 2-3x expected need) or create a new topic and migrate consumers.</p>
<p>Hot keys (one huge tenant) pin one partition and one consumer. Options: split the key (<code>tenant#shard</code>) where ordering per sub-key is enough, or give that tenant its own topic.</p>
<p>Producer-side ordering needs <code>enable.idempotence=true</code> (default in modern clients): the broker de-duplicates by (producer_id, sequence), so retries with <code>max.in.flight.requests.per.connection ≤ 5</code> neither duplicate nor reorder.</p>`,
        he: `<p>סדר מובטח רק <strong>בתוך partition</strong>. בוחרים key שמתאים לאינווריאנט העסקי (account_id ל-ledger, order_id למחזור חיים של הזמנה). <code>hash(key) % N</code> אומר ש-<strong>הוספת partitions ממפה keys מחדש</strong> ושוברת את הסדר לכל key בזמן המעבר — לכן מקצים partitions בעודף מראש (למשל פי 2-3 מהצורך הצפוי) או יוצרים topic חדש ומעבירים אליו consumers.</p>
<p>Hot keys (tenant ענק אחד) תוקעים partition אחד ו-consumer אחד. אפשרויות: לפצל את ה-key (<code>tenant#shard</code>) כשסדר לפי תת-key מספיק, או לתת ל-tenant הזה topic משלו.</p>
<p>סדר בצד ה-producer דורש <code>enable.idempotence=true</code> (ברירת מחדל ב-clients מודרניים): ה-broker עושה de-dup לפי (producer_id, sequence), כך ש-retries עם <code>max.in.flight.requests.per.connection ≤ 5</code> לא משכפלים ולא משנים סדר.</p>`
      }
    },
    {
      h: { en: "Consumer groups, offsets and rebalancing", he: "Consumer groups, offsets ו-rebalancing" },
      body: {
        en: `<p>A partition is consumed by at most one member of a group, so parallelism ≤ partition count. Offsets are committed to the compacted <code>__consumer_offsets</code> topic. <strong>Commit after processing</strong> → at-least-once (duplicates on crash); commit before → at-most-once (loss). Make consumers idempotent and accept at-least-once as the default.</p>
<p>Rebalances are the operational pain point: the classic eager protocol stops the world for the whole group. Use <strong>cooperative-sticky</strong> assignment (only moved partitions pause), <strong>static membership</strong> (<code>group.instance.id</code>) so a rolling restart doesn't trigger a rebalance per pod, and the newer KIP-848 broker-side protocol where available. Keep <code>max.poll.interval.ms</code> above the worst-case batch processing time, or the member is kicked out and the group rebalances in a loop.</p>
<p><strong>Exactly-once</strong> for read-process-write inside the log: transactional producer writes output records and the consumer offsets in one transaction; downstream consumers use <code>isolation.level=read_committed</code>. It does not extend to external side effects (an HTTP call, a DB write) — those need idempotency keys or the outbox pattern.</p>`,
        he: `<p>partition נצרך לכל היותר ע"י חבר אחד ב-group, אז המקביליות ≤ מספר ה-partitions. ה-offsets נשמרים ב-topic ה-compacted <code>__consumer_offsets</code>. <strong>commit אחרי עיבוד</strong> → at-least-once (כפילויות בקריסה); commit לפני → at-most-once (אובדן). עושים consumers אידמפוטנטיים ומקבלים at-least-once כברירת מחדל.</p>
<p>Rebalances הם כאב הראש התפעולי: הפרוטוקול ה-eager הקלאסי עוצר את כל ה-group. משתמשים ב-assignment מסוג <strong>cooperative-sticky</strong> (רק partitions שזזים נעצרים), ב-<strong>static membership</strong> (<code>group.instance.id</code>) כדי ש-rolling restart לא יגרום ל-rebalance על כל pod, ובפרוטוקול החדש של KIP-848 בצד ה-broker איפה שאפשר. שומרים את <code>max.poll.interval.ms</code> מעל זמן העיבוד הגרוע ביותר של batch, אחרת החבר נזרק וה-group נכנס ללולאת rebalances.</p>
<p><strong>Exactly-once</strong> ל-read-process-write בתוך ה-log: producer טרנזקציוני כותב את רשומות הפלט ואת ה-offsets של ה-consumer בטרנזקציה אחת; ה-consumers בהמשך משתמשים ב-<code>isolation.level=read_committed</code>. זה לא חל על side effects חיצוניים (קריאת HTTP, כתיבה ל-DB) — שם צריך idempotency keys או את ה-outbox pattern.</p>`
      }
    },
    {
      h: { en: "Storage: segments, retention, compaction, tiering", he: "אחסון: segments, retention, compaction ו-tiering" },
      body: {
        en: `<p>A partition is a directory of <strong>segment</strong> files; only the active segment is written (sequential appends — why Kafka is fast on cheap disks) and reads are served via <code>sendfile</code> zero-copy from page cache. Retention deletes whole closed segments by <code>retention.ms</code>/<code>retention.bytes</code>. Compaction rewrites segments keeping the latest record per key and tombstones (null value) for deletes — the backbone of changelog and state topics.</p>
<p><strong>Tiered storage</strong> (KIP-405) uploads closed segments to object storage and keeps only the hot tail locally. Brokers become nearly stateless for old data: adding a broker or replacing a failed one moves only hours of data, not days. Lagging consumers reading old data hit S3 (higher latency, but they don't evict the page cache of tail readers).</p>`,
        he: `<p>partition הוא תיקייה של קבצי <strong>segment</strong>; רק ה-segment הפעיל נכתב (appends סדרתיים — זו הסיבה ש-Kafka מהיר על דיסקים זולים) והקריאות מוגשות ב-zero-copy דרך <code>sendfile</code> מה-page cache. Retention מוחק segments סגורים שלמים לפי <code>retention.ms</code>/<code>retention.bytes</code>. Compaction כותב segments מחדש ושומר את הרשומה האחרונה לכל key, ו-tombstones (ערך null) למחיקות — עמוד השדרה של changelog ו-state topics.</p>
<p><strong>Tiered storage</strong> (KIP-405) מעלה segments סגורים ל-object storage ומשאיר מקומית רק את הזנב החם. ה-brokers הופכים כמעט stateless לדאטה ישן: הוספת broker או החלפת broker שנפל מזיזה רק שעות של דאטה, לא ימים. consumers מפגרים שקוראים דאטה ישן פוגעים ב-S3 (latency גבוה יותר, אבל הם לא מפנים את ה-page cache של מי שקורא מהזנב).</p>`
      }
    },
    {
      h: { en: "Staff framing: operating it, migrating to it, failure modes", he: "מסגור Staff: תפעול, מיגרציה ו-failure modes" },
      body: {
        en: `<p><strong>Build vs buy:</strong> for most companies the answer is managed (MSK, Confluent Cloud) or a well-run Strimzi deployment — the design above is what you must understand to operate it. Running it in-house needs a team of 3-5 with 24/7 on-call; at ~2 GB/s, managed pricing vs self-run is usually a 1.5-2x difference — decide on cost per GB plus people, not license.</p>
<p><strong>Migration from RabbitMQ/SQS:</strong> dual-publish via an outbox, consumers move topic by topic behind a feature flag, compare counts/checksums, then cut the old path. Topics, schemas (Schema Registry with backward compatibility) and quotas are platform-owned; ownership of each topic = the producing team.</p>
<p><strong>Failure modes:</strong> one slow disk makes a broker fall out of many ISRs and producers with min ISR 2 start failing; partition reassignment without throttle saturates the network; a consumer group stuck in a rebalance loop; under-replicated partitions after an AZ event that never heal because of disk pressure; controller quorum loss (KRaft needs a majority). Alert on <code>UnderReplicatedPartitions</code>, <code>OfflinePartitionsCount</code>, ISR shrink rate, consumer lag in <em>time</em> (not messages), and request-handler idle ratio.</p>`,
        he: `<p><strong>Build vs buy:</strong> לרוב החברות התשובה היא managed (MSK, Confluent Cloud) או Strimzi שמתופעל טוב — התכנון למעלה הוא מה שצריך להבין כדי לתפעל את זה. להריץ in-house דורש צוות של 3-5 עם on-call של 24/7; ב-~2 GB/s ההפרש בין managed ל-self-run הוא בדרך כלל פי 1.5-2 — מחליטים לפי עלות ל-GB ועוד אנשים, לא לפי רישיון.</p>
<p><strong>מיגרציה מ-RabbitMQ/SQS:</strong> dual-publish דרך outbox, ה-consumers עוברים topic אחרי topic מאחורי feature flag, משווים counts/checksums, ואז חותכים את המסלול הישן. ה-topics, ה-schemas (Schema Registry עם backward compatibility) וה-quotas שייכים לפלטפורמה; הבעלות על כל topic = הצוות שמייצר אליו.</p>
<p><strong>Failure modes:</strong> דיסק איטי אחד גורם ל-broker לצאת מהרבה ISRs ו-producers עם min ISR 2 מתחילים להיכשל; partition reassignment בלי throttle מחניק את הרשת; consumer group תקוע בלולאת rebalance; under-replicated partitions אחרי אירוע AZ שלא מחלימים בגלל disk pressure; אובדן quorum של ה-controller (KRaft צריך רוב). מגדירים alerts על <code>UnderReplicatedPartitions</code>, <code>OfflinePartitionsCount</code>, קצב ISR shrink, consumer lag ב<em>זמן</em> (לא בהודעות), ו-request-handler idle ratio.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "acks=all + min ISR 2 vs acks=1: durability across AZ loss costs ~1-3 ms per produce and fails writes when 2 replicas are down; acks=1 is faster but loses acked data on leader failure.", he: "acks=all עם min ISR 2 מול acks=1: עמידות לאובדן AZ עולה ~1-3 ms לכל produce ומכשילה כתיבות כש-2 replicas למטה; acks=1 מהיר יותר אבל מאבד דאטה שאושר כשה-leader נופל." },
    { en: "More partitions = more parallelism but more open files, longer failover, and remapping pain when changed. Size for 2-3x peak, not 100x.", he: "יותר partitions = יותר מקביליות, אבל יותר open files, failover ארוך יותר וכאב של מיפוי מחדש כשמשנים. מתכננים לפי 2-3x מה-peak, לא 100x." },
    { en: "Pull-based consumers handle backpressure naturally and enable replay, at the cost of polling latency and consumer-side offset management; push brokers (RabbitMQ) give per-message routing and acks.", he: "Consumers מבוססי pull מטפלים ב-backpressure באופן טבעי ומאפשרים replay, במחיר של polling latency וניהול offsets בצד ה-consumer; brokers מבוססי push (RabbitMQ) נותנים routing ו-ack לכל הודעה." },
    { en: "Tiered storage cuts cost and speeds broker recovery, but reads of old data are slower and you now depend on object storage availability.", he: "Tiered storage חותך עלויות ומאיץ התאוששות של brokers, אבל קריאה של דאטה ישן איטית יותר ועכשיו יש תלות בזמינות של object storage." }
  ],
  followUps: [
    { q: { en: "A whole AZ goes down. Walk through what happens to produce and consume.", he: "AZ שלם נופל. תעבור על מה קורה ל-produce ול-consume." },
      a: { en: "Partitions whose leader was in that AZ elect a new leader from the remaining ISR (seconds, driven by the KRaft controller). ISR shrinks to 2 — still ≥ min ISR, so acks=all writes keep succeeding. Clients refresh metadata and reconnect. Consumers in that AZ disappear, triggering a rebalance; survivors pick up partitions from committed offsets (some reprocessing). When the AZ returns, followers catch up, rejoin ISR, and preferred-leader election rebalances leadership.", he: "partitions שה-leader שלהם היה באותו AZ בוחרים leader חדש מתוך ה-ISR שנשאר (שניות, בניהול ה-controller של KRaft). ה-ISR מתכווץ ל-2 — עדיין ≥ min ISR, אז כתיבות acks=all ממשיכות להצליח. ה-clients מרעננים metadata ומתחברים מחדש. ה-consumers באותו AZ נעלמים, מה שמפעיל rebalance; השורדים לוקחים partitions מה-offsets שבוצע להם commit (קצת עיבוד כפול). כשה-AZ חוזר, ה-followers משלימים, חוזרים ל-ISR, ו-preferred-leader election מאזן מחדש את ההנהגה." } },
    { q: { en: "We need 3x the partitions on our main topic without breaking per-customer ordering. How?", he: "צריך פי 3 partitions ב-topic הראשי בלי לשבור סדר לפי לקוח. איך?" },
      a: { en: "Don't add partitions in place. Create orders.v2 with the new count, dual-write (or MirrorMaker with re-keying), switch consumers to v2 at a clean boundary: pause producers per key range briefly, or let v2 consumers start from a timestamp after v1 consumers have drained. Alternatively accept a short ordering window if the business is fine with it — make that an explicit decision.", he: "לא מוסיפים partitions במקום. יוצרים orders.v2 עם הכמות החדשה, עושים dual-write (או MirrorMaker עם re-keying), ומעבירים את ה-consumers ל-v2 בגבול נקי: עוצרים לרגע producers לפי טווח keys, או נותנים ל-consumers של v2 להתחיל מ-timestamp אחרי שה-consumers של v1 התרוקנו. לחלופין מקבלים חלון קצר בלי סדר אם הביזנס מסכים — וזו צריכה להיות החלטה מפורשת." } },
    { q: { en: "Why not just use a database table as a queue?", he: "למה לא פשוט להשתמש בטבלה ב-DB בתור queue?" },
      a: { en: "At low volume it is fine (and SKIP LOCKED makes it workable). It breaks at scale: deletes cause bloat and vacuum pressure, multiple consumer groups need separate state, replay means keeping all rows, and throughput is bounded by one primary's write IOPS. A log is append-only, partitioned and read by offset — reads don't mutate state, so fan-out is almost free.", he: "בווליום נמוך זה בסדר (ו-SKIP LOCKED הופך את זה לעביד). בסקייל זה נשבר: מחיקות יוצרות bloat ולחץ על vacuum, כמה consumer groups צריכים state נפרד, replay אומר לשמור את כל השורות, וה-throughput חסום ע״י ה-write IOPS של primary אחד. log הוא append-only, מחולק ל-partitions ונקרא לפי offset — קריאות לא משנות state, אז fan-out כמעט בחינם." } }
  ],
  related: ["arch-queues", "arch-brokers", "arch-event-driven", "db-replication", "db-cap", "staff-kafka-deep", "staff-exactly-once", "staff-consensus-consistency"]
});

/* ------------------------------------------------------------------ */
/* 3. Global feature-flag / dynamic config service                     */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-feature-flags-config", icon: "🎚️", level: 3,
  title: { en: "Global feature-flag & dynamic config service", he: "שירות feature flags ו-dynamic config גלובלי" },
  prompt: {
    en: "Design an internal feature-flag and dynamic-configuration service used by ~2,000 services in 4 regions. Engineers toggle features, ramp percentages, target segments, and flip kill switches during incidents. Flag evaluations happen on every request, so reads must be essentially free — and a bad config push must not become a global outage. Also: today we ship config in env vars and ConfigMaps; how do we migrate?",
    he: "תתכנן שירות פנימי ל-feature flags ול-dynamic configuration שמשמש ~2,000 services ב-4 regions. מהנדסים מדליקים פיצ'רים, מעלים אחוזים בהדרגה, מטרגטים segments, ומפעילים kill switches בזמן תקלות. הערכת flags קורית בכל request, אז הקריאות צריכות להיות כמעט בחינם — ו-push של config גרוע אסור שיהפוך ל-outage גלובלי. ובנוסף: היום אנחנו שולחים config ב-env vars וב-ConfigMaps; איך עוברים?"
  },
  clarify: [
    { en: "Evaluation location: server-side SDKs only, or also mobile/web clients (which cannot hold all rules or secrets)?", he: "איפה ההערכה קורית: רק SDKs בצד שרת, או גם mobile/web clients (שלא יכולים להחזיק את כל החוקים או סודות)?" },
    { en: "Propagation SLO: how fast must a kill switch take effect globally — seconds or minutes?", he: "SLO להפצה: כמה מהר kill switch צריך להשפיע גלובלית — שניות או דקות?" },
    { en: "What kinds of values: booleans and percentages only, or arbitrary JSON config (timeouts, limits, routing tables)?", he: "אילו סוגי ערכים: רק booleans ואחוזים, או JSON שרירותי (timeouts, limits, טבלאות routing)?" },
    { en: "Targeting attributes: user id, tenant, region, app version? Any PII constraints on sending attributes to a central service?", he: "Attributes ל-targeting: user id, tenant, region, גרסת אפליקציה? יש מגבלות PII על שליחת attributes לשירות מרכזי?" },
    { en: "Audit/compliance: who may change production flags, with what approvals, and must every change be attributable?", he: "Audit ו-compliance: מי מורשה לשנות flags ב-production, עם אילו אישורים, והאם כל שינוי צריך להיות מיוחס לאדם?" }
  ],
  functional: [
    { en: "Create flags/configs with typed values, targeting rules (segments, attributes) and percentage rollouts with sticky bucketing.", he: "יצירת flags/configs עם ערכים טיפוסיים, חוקי targeting (segments, attributes) ו-rollout באחוזים עם bucketing דביק." },
    { en: "SDKs evaluate locally in-process in microseconds and receive updates in near real time.", he: "SDKs מעריכים מקומית בתוך ה-process במיקרו-שניות ומקבלים עדכונים כמעט בזמן אמת." },
    { en: "Kill switches: a pre-declared flag can be flipped by on-call and take effect globally within seconds, even if the flag service UI is down.", he: "Kill switches: flag שהוגדר מראש אפשר להפוך ע\"י ה-on-call והוא משפיע גלובלית תוך שניות, גם אם ה-UI של שירות ה-flags למטה." },
    { en: "Full audit log, approvals for production changes, scheduled changes, and instant rollback to any previous version.", he: "Audit log מלא, אישורים לשינויים ב-production, שינויים מתוזמנים ו-rollback מיידי לכל גרסה קודמת." },
    { en: "Flag lifecycle: owners, expiry dates, stale-flag detection.", he: "מחזור חיים של flag: בעלים, תאריכי תפוגה, זיהוי flags מתים." }
  ],
  nonFunctional: [
    { en: "Evaluation latency under 1 µs-50 µs in-process; zero network calls on the request path.", he: "Latency של הערכה 1-50 µs בתוך ה-process; אפס קריאות רשת ב-request path." },
    { en: "Propagation p99 under 5 s globally; the data plane survives total control-plane outage (services keep last-known-good config).", he: "הפצה ב-p99 מתחת ל-5 שניות גלובלית; ה-data plane שורד נפילה מלאה של ה-control plane (services ממשיכים עם last-known-good config)." },
    { en: "Scale: 2,000 services × ~50k SDK instances (pods); ~20k flags; ~10M evaluations/s aggregate.", he: "סקייל: 2,000 services × ~50k מופעי SDK (pods); ~20k flags; ~10M הערכות בשנייה במצטבר." },
    { en: "A change can never instantly hit 100% of fleet unless explicitly marked as an emergency kill switch.", he: "שינוי אף פעם לא פוגע מיד ב-100% מה-fleet, אלא אם סומן במפורש כ-kill switch לחירום." }
  ],
  estimates: {
    en: `<p><strong>Ruleset size:</strong> 20k flags × ~1 KB of rules ≈ 20 MB total; per service only its own namespace + shared flags ≈ 50-500 KB. Easy to hold in memory in every pod.</p>
<p><strong>Evaluations:</strong> 10M/s aggregate but all local — the central service sees <em>zero</em> evaluation traffic. If evaluation were a remote call at ~1 ms, 10M/s would need a fleet the size of the product itself, and every flag check would add latency and a failure mode.</p>
<p><strong>Fan-out:</strong> 50k SDK connections. With streaming (SSE/gRPC) through a relay tier: ~10k connections per relay node → 5-6 relays per region, ~24 total. A change produces 50k small pushes (~1 KB delta) ≈ 50 MB — trivial. Polling alternative: 50k pods polling every 30 s = 1,700 req/s mostly 304 Not Modified, cheap with ETags and a CDN, but propagation = up to 30 s.</p>
<p><strong>Writes:</strong> ~2,000 flag changes/day ≈ 0.02/s. The control plane is a tiny, strongly consistent CRUD app; all the engineering is in distribution and safety.</p>`,
    he: `<p><strong>גודל ה-rules:</strong> 20k flags × ~1 KB חוקים ≈ 20 MB בסך הכל; לכל service רק ה-namespace שלו + flags משותפים ≈ 50-500 KB. קל להחזיק בזיכרון בכל pod.</p>
<p><strong>הערכות:</strong> 10M בשנייה במצטבר אבל הכל מקומי — השירות המרכזי רואה <em>אפס</em> תעבורת הערכה. אם הערכה הייתה קריאה מרוחקת של ~1 ms, 10M בשנייה היו דורשים fleet בגודל המוצר עצמו, וכל בדיקת flag הייתה מוסיפה latency ו-failure mode.</p>
<p><strong>Fan-out:</strong> 50k חיבורי SDK. עם streaming (SSE/gRPC) דרך שכבת relay: ~10k חיבורים ל-relay → 5-6 relays בכל region, ~24 בסך הכל. שינוי מייצר 50k pushes קטנים (~1 KB delta) ≈ 50 MB — זניח. אלטרנטיבת polling: 50k pods שעושים poll כל 30 שניות = 1,700 req/s, רובם 304 Not Modified, זול עם ETags ו-CDN, אבל ההפצה = עד 30 שניות.</p>
<p><strong>כתיבות:</strong> ~2,000 שינויי flags ביום ≈ 0.02 בשנייה. ה-control plane הוא אפליקציית CRUD קטנטנה עם consistency חזק; כל ההנדסה נמצאת בהפצה ובבטיחות.</p>`
  },
  api: `# Control plane (humans + automation)
POST  /flags/v1/{ns}/flags                 {key, type, default, rules[], owner, expires_at}
PATCH /flags/v1/{ns}/flags/{key}           {rules|rollout, reason, ticket}  -> 202 {change_id, status: pending_approval|staged}
POST  /flags/v1/changes/{id}/approve
POST  /flags/v1/changes/{id}/rollback
POST  /flags/v1/killswitch/{ns}/{key}      {value, reason}   -> 200 (pre-approved emergency path)
GET   /flags/v1/{ns}/snapshot?since=v123   -> {version, flags[]} | 304   (ETag)
# Data plane
GET   /stream/v1/{ns}  (SSE / gRPC stream)  -> events: put{version, flag} | full{version, snapshot}
# SDK (in-process)
client.bool("checkout.new-tax-engine", ctx{user_id, tenant, region, app_version}, default=false)`,
  dataModel: `flags(ns, key PK, type, default_value, owner_team, expires_at, is_killswitch, created_by)
flag_versions(ns, key, version PK, rules_json, rollout_json, author, approved_by, reason, created_at)
namespace_snapshots(ns, version PK, blob_sha256, s3_uri, signed_by, published_at)   -- immutable
changes(change_id PK, ns, key, diff, status, stage[canary|10%|100%], approvals[], scheduled_at)
segments(segment_id PK, ns, rules_json)       -- e.g. "internal-employees", "beta-tenants"
audit_log(append-only): who, what, when, before, after, reason, ticket
-- Bucketing: bucket = murmur3(flag_key + salt + user_id) % 10000  (sticky, independent per flag)`,
  diagram: `  UI / API / Terraform --> Control plane (Postgres, RBAC, approvals, audit)
                               |  publishes immutable, signed snapshot vN
                               v
                      Snapshot store (S3, versioned) + change log (Kafka/NATS)
                               |
         +---------------------+----------------------+
         v                     v                      v
   Relay tier eu          Relay tier us          Relay tier ap      (stateless, cache vN,
   (SSE/gRPC fan-out)     (SSE/gRPC)             (SSE/gRPC)          serve snapshot + deltas)
     |    |    |               |                      |
   pod  pod  pod             pods                   pods
   [SDK: in-memory rules, local eval ~1us,
         disk cache of last-known-good, fallback: poll CDN snapshot every 60s,
         defaults compiled in code if nothing at all]
                               |
            evaluation counts / exposures --> async --> analytics (sampled)`,
  deepDives: [
    {
      h: { en: "Local evaluation and the layered fallback chain", he: "הערכה מקומית ושרשרת ה-fallback בשכבות" },
      body: {
        en: `<p>The SDK holds the full ruleset for its namespace in memory and evaluates locally: no network on the hot path, so the flag service can be completely down and requests are unaffected. Fallback order on startup or disconnect: <strong>in-memory current → on-disk last-known-good (written on every update) → CDN snapshot fetch → compiled-in default</strong>. Each step is logged and exposed as a metric (<code>flags_config_age_seconds</code>), and pods should start even if only the code default is available.</p>
<p>Defaults in code must be the <em>safe</em> value (usually "old behaviour"). A pattern that bites: a new flag defaults to <code>true</code> in code, the flag service is unreachable during a deploy, and the half-finished feature turns on everywhere.</p>
<blockquote>💡 Real world: client-side (browser/mobile) SDKs cannot receive the whole ruleset (it leaks targeting rules and segments). They call an edge evaluation endpoint that returns only the evaluated values for that user, cached at the CDN per user-context hash.</blockquote>`,
        he: `<p>ה-SDK מחזיק בזיכרון את כל החוקים של ה-namespace שלו ומעריך מקומית: אין רשת ב-hot path, אז שירות ה-flags יכול להיות למטה לגמרי וה-requests לא מושפעים. סדר ה-fallback בעלייה או בניתוק: <strong>in-memory נוכחי → last-known-good מהדיסק (נכתב בכל עדכון) → משיכת snapshot מה-CDN → default שמקומפל בקוד</strong>. כל שלב נרשם ונחשף כמטריקה (<code>flags_config_age_seconds</code>), ו-pods צריכים לעלות גם אם רק ה-default בקוד זמין.</p>
<p>ה-defaults בקוד חייבים להיות הערך ה<em>בטוח</em> (בדרך כלל "ההתנהגות הישנה"). דפוס שנושך: flag חדש עם default של <code>true</code> בקוד, שירות ה-flags לא נגיש בזמן deploy, והפיצ'ר החצי-גמור נדלק בכל מקום.</p>
<blockquote>💡 מהשטח: SDKs בצד לקוח (browser/mobile) לא יכולים לקבל את כל החוקים (זה מדליף חוקי targeting ו-segments). הם קוראים ל-endpoint הערכה ב-edge שמחזיר רק את הערכים המוערכים לאותו משתמש, עם cache ב-CDN לפי hash של user context.</blockquote>`
      }
    },
    {
      h: { en: "Push vs poll, ordering and consistency", he: "Push מול poll, סדר ו-consistency" },
      body: {
        en: `<p>Use <strong>both</strong>: streaming push for seconds-level propagation, and periodic polling of a versioned snapshot as the safety net (streams silently die behind proxies). Every snapshot has a monotonically increasing <code>version</code> per namespace; deltas carry <code>(from_version, to_version)</code>, and an SDK that sees a gap fetches the full snapshot. SDKs never apply an older version than they have — this prevents a lagging relay from rolling a fleet backwards.</p>
<p>Consistency model: the control plane is strongly consistent (single Postgres primary — changes are rare), the data plane is <strong>eventually consistent, monotonic per pod</strong>. Different pods may briefly disagree on a flag for a few seconds. If a feature needs all-or-nothing semantics across services (e.g. a new message schema), a flag is the wrong tool — use versioned APIs and an expand/contract migration.</p>`,
        he: `<p>משתמשים ב<strong>שניהם</strong>: streaming push להפצה ברמת שניות, ו-polling תקופתי של snapshot עם גרסה כרשת ביטחון (streams מתים בשקט מאחורי proxies). לכל snapshot יש <code>version</code> שעולה מונוטונית לכל namespace; deltas נושאים <code>(from_version, to_version)</code>, ו-SDK שרואה פער מושך snapshot מלא. SDKs אף פעם לא מחילים גרסה ישנה ממה שיש להם — זה מונע מ-relay מפגר לגלגל fleet אחורה.</p>
<p>מודל ה-consistency: ה-control plane עם consistency חזק (primary יחיד של Postgres — שינויים נדירים), ה-data plane <strong>eventually consistent ומונוטוני לכל pod</strong>. pods שונים יכולים לא להסכים על flag לכמה שניות. אם פיצ'ר צריך סמנטיקה של הכל-או-כלום בין services (למשל schema חדש להודעות), flag זה הכלי הלא נכון — משתמשים ב-APIs עם גרסאות ובמיגרציית expand/contract.</p>`
      }
    },
    {
      h: { en: "Safe rollout of config itself: config is code", he: "Rollout בטוח של ה-config עצמו: config זה קוד" },
      body: {
        en: `<p>Most large outages from dynamic config share one shape: a valid-looking change pushed to 100% of the fleet at once, which crashes or degrades everything simultaneously, and the rollback path depends on the system that just broke. Defences:</p>
<ul><li><strong>Schema validation</strong> per flag type at write time (a timeout must be an int between 10 and 30000) and SDK-side validation that rejects a malformed snapshot and keeps the previous one.</li>
<li><strong>Staged propagation</strong>: changes go to a canary ring (one region's canary pods) → 10% → 100%, with automatic halt if the error rate or crash rate of consuming services rises. Percentage rollouts of the <em>feature</em> are separate from staged rollout of the <em>config change</em>.</li>
<li><strong>Two-person rule</strong> for production changes to non-kill-switch flags; kill switches are pre-declared, pre-approved, boolean, and can only move to the safe value.</li>
<li><strong>Rollback independence</strong>: on-call can push a previous snapshot version straight to the snapshot store and relays (break-glass CLI), bypassing the UI and control-plane DB.</li></ul>`,
        he: `<p>רוב ה-outages הגדולים מ-dynamic config חולקים צורה אחת: שינוי שנראה תקין נדחף ל-100% מה-fleet בבת אחת, מפיל או מדרדר הכל במקביל, ומסלול ה-rollback תלוי במערכת שבדיוק נשברה. הגנות:</p>
<ul><li><strong>Schema validation</strong> לכל סוג flag בזמן הכתיבה (timeout חייב להיות int בין 10 ל-30000), ו-validation בצד ה-SDK שדוחה snapshot פגום ושומר על הקודם.</li>
<li><strong>הפצה מדורגת</strong>: שינויים הולכים ל-canary ring (ה-pods של canary ב-region אחד) → 10% → 100%, עם עצירה אוטומטית אם ה-error rate או קצב הקריסות של ה-services הצורכים עולה. rollout באחוזים של ה<em>פיצ'ר</em> נפרד מה-rollout המדורג של <em>שינוי ה-config</em>.</li>
<li><strong>חוק שני אנשים</strong> לשינויים ב-production ל-flags שאינם kill switch; kill switches מוגדרים מראש, מאושרים מראש, בוליאניים, ויכולים לזוז רק לערך הבטוח.</li>
<li><strong>Rollback עצמאי</strong>: ה-on-call יכול לדחוף גרסת snapshot קודמת ישר ל-snapshot store ול-relays (CLI של break-glass), בעקיפת ה-UI וה-DB של ה-control plane.</li></ul>`
      }
    },
    {
      h: { en: "Blast radius, flag debt and the migration path", he: "Blast radius, חוב flags ומסלול המיגרציה" },
      body: {
        en: `<p><strong>Blast radius:</strong> namespace per service/team so one team's snapshot cannot break another's; relays deployed per region and per cell; SDK hard limits on snapshot size and rule complexity (a regex rule evaluated on every request is a CPU incident waiting to happen). Never let the flag service sit in the startup path of the platform it would be used to rescue (e.g. the flag service depending on the auth service that uses flags).</p>
<p><strong>Flag debt:</strong> every flag has an owner and an expiry; at expiry the owning team gets a ticket and the UI shows the flag as stale. Track the count of flags at 100% for more than 30 days — those are dead code paths that double the test matrix.</p>
<p><strong>Migration from env vars/ConfigMaps:</strong> (1) ship the SDK with a provider that reads existing env vars/ConfigMaps, so code switches to <code>flags.get()</code> without behaviour change; (2) import values into the service as namespaces, provider order flag-service → env; (3) move teams to manage values in the service; (4) delete env vars. Restart-required config (pool sizes, ports) stays in deploy-time config — not everything should be dynamic.</p>
<p><strong>Ownership:</strong> a small developer-platform team (3-4 engineers) owns the control plane, relays and SDKs in 3-4 languages; flag owners own their flags. Buy (LaunchDarkly, Unleash, Flagd/OpenFeature) is often right — OpenFeature as the SDK API keeps the backend swappable.</p>`,
        he: `<p><strong>Blast radius:</strong> namespace לכל service/צוות כך שה-snapshot של צוות אחד לא יכול לשבור צוות אחר; relays לכל region ולכל cell; מגבלות קשיחות ב-SDK על גודל snapshot ומורכבות חוקים (חוק regex שמוערך בכל request הוא תקלת CPU שמחכה לקרות). אף פעם לא לשים את שירות ה-flags ב-startup path של הפלטפורמה שהוא אמור להציל (למשל שירות ה-flags תלוי בשירות ה-auth שמשתמש ב-flags).</p>
<p><strong>חוב flags:</strong> לכל flag יש בעלים ותאריך תפוגה; בתפוגה הצוות מקבל ticket וה-UI מסמן את ה-flag כ-stale. עוקבים אחרי מספר ה-flags שעומדים על 100% יותר מ-30 יום — אלה מסלולי קוד מתים שמכפילים את מטריצת הבדיקות.</p>
<p><strong>מיגרציה מ-env vars/ConfigMaps:</strong> (1) משחררים SDK עם provider שקורא env vars/ConfigMaps קיימים, כך שהקוד עובר ל-<code>flags.get()</code> בלי שינוי התנהגות; (2) מייבאים ערכים לשירות כ-namespaces, סדר providers: שירות ה-flags → env; (3) מעבירים צוותים לנהל ערכים בשירות; (4) מוחקים את ה-env vars. config שדורש restart (גודל pools, ports) נשאר config של זמן deploy — לא הכל צריך להיות דינמי.</p>
<p><strong>בעלות:</strong> צוות developer-platform קטן (3-4 מהנדסים) מחזיק את ה-control plane, ה-relays וה-SDKs ב-3-4 שפות; בעלי ה-flags אחראים על ה-flags שלהם. לקנות (LaunchDarkly, Unleash, Flagd/OpenFeature) זה הרבה פעמים הנכון — OpenFeature כ-API של ה-SDK משאיר את ה-backend בר-החלפה.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Local evaluation vs remote evaluation: local is fast and outage-proof but ships rules to every pod and makes per-request audit harder; remote centralises logic but adds latency and a hard dependency.", he: "הערכה מקומית מול מרוחקת: מקומית מהירה וחסינה ל-outage אבל שולחת חוקים לכל pod ומקשה על audit לכל request; מרוחקת מרכזת לוגיקה אבל מוסיפה latency ותלות קשיחה." },
    { en: "Push vs poll: push gives seconds-level kill switches but needs a relay tier and connection management; poll is simple and CDN-friendly but propagation equals the interval. Use push with poll as safety net.", he: "Push מול poll: push נותן kill switches ברמת שניות אבל דורש שכבת relay וניהול חיבורים; poll פשוט וידידותי ל-CDN אבל ההפצה שווה לאינטרוול. משתמשים ב-push עם poll כרשת ביטחון." },
    { en: "Speed vs safety of changes: staged propagation and approvals slow ordinary changes by minutes; only pre-declared kill switches get the instant global path.", he: "מהירות מול בטיחות של שינויים: הפצה מדורגת ואישורים מאטים שינויים רגילים בדקות; רק kill switches שהוגדרו מראש מקבלים את המסלול הגלובלי המיידי." },
    { en: "Dynamic everything vs deploy-time config: dynamic config skips the deploy pipeline's tests and canaries — keep it for values that genuinely need runtime change.", he: "הכל דינמי מול config בזמן deploy: config דינמי עוקף את הבדיקות וה-canaries של ה-pipeline — שומרים אותו לערכים שבאמת צריכים שינוי בזמן ריצה." }
  ],
  followUps: [
    { q: { en: "A config change just took down checkout in all regions and the flag UI is timing out. What's the recovery path you designed?", he: "שינוי config הפיל עכשיו את checkout בכל ה-regions וה-UI של ה-flags עושה timeout. מה מסלול ההתאוששות שתכננת?" },
      a: { en: "Break-glass CLI publishes the previous signed snapshot version directly to the snapshot store and relays (no control-plane DB needed); SDKs accept it because rollback publishes it as a new, higher version with old content. Then: postmortem on why staged propagation didn't catch it — likely the change was marked emergency, or the canary health signal didn't include checkout's error rate.", he: "CLI של break-glass מפרסם את גרסת ה-snapshot החתומה הקודמת ישירות ל-snapshot store ול-relays (בלי צורך ב-DB של ה-control plane); ה-SDKs מקבלים אותה כי ה-rollback מפרסם אותה כגרסה חדשה וגבוהה יותר עם תוכן ישן. אחר כך: postmortem על למה ההפצה המדורגת לא תפסה את זה — כנראה השינוי סומן כחירום, או שאות הבריאות של ה-canary לא כלל את ה-error rate של checkout." } },
    { q: { en: "How do you make a 10% rollout consistent for a user across services and sessions?", he: "איך הופכים rollout של 10% לעקבי עבור משתמש בין services ו-sessions?" },
      a: { en: "Deterministic bucketing: hash(flag_key + salt + stable_id) % 10000, computed identically in every SDK language (shared test vectors in CI). Use a stable id (user_id, or tenant_id for B2B), not a session id. Ramping 10% → 20% keeps the first 10% in since buckets only extend. Changing the salt reshuffles — do it only deliberately.", he: "Bucketing דטרמיניסטי: hash(flag_key + salt + stable_id) % 10000, שמחושב זהה בכל שפת SDK (test vectors משותפים ב-CI). משתמשים ב-id יציב (user_id, או tenant_id ב-B2B), לא ב-session id. עלייה מ-10% ל-20% שומרת את ה-10% הראשונים בפנים כי ה-buckets רק מתרחבים. שינוי ה-salt מערבב מחדש — עושים את זה רק בכוונה." } },
    { q: { en: "Should the flag service be multi-region active-active?", he: "שירות ה-flags צריך להיות multi-region active-active?" },
      a: { en: "The data plane yes — relays and snapshots in every region, independent. The control plane doesn't need to be: writes are rare, so a single-region primary with a warm standby is fine, because a control-plane outage only blocks <em>changes</em>, and kill switches have a break-glass path that skips it. Spending on active-active writes buys almost nothing.", he: "ה-data plane כן — relays ו-snapshots בכל region, עצמאיים. ה-control plane לא חייב: כתיבות נדירות, אז primary ב-region אחד עם warm standby מספיק, כי נפילה של ה-control plane חוסמת רק <em>שינויים</em>, ול-kill switches יש מסלול break-glass שעוקף אותו. להשקיע ב-active-active לכתיבות קונה כמעט כלום." } }
  ],
  related: ["rel-deployments", "k8s-config", "k8s-argo-rollouts", "rel-incident-management", "staff-cells-blast-radius", "staff-consensus-consistency", "staff-platform-engineering"]
});

/* ------------------------------------------------------------------ */
/* 4. Idempotent payments / double-entry ledger                        */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-payments-ledger", icon: "🧾", level: 3,
  title: { en: "Idempotent payments & double-entry ledger", he: "תשלומים אידמפוטנטיים ו-ledger של double-entry" },
  prompt: {
    en: "We are a marketplace: buyers pay, we hold funds, take a fee, and pay out sellers. Today the payment service calls the card processor and then writes a row to an orders table; we've had double charges after timeouts, and finance spends a week each month reconciling. Design the payments flow and the ledger so money is never created, lost or moved twice — and explain how you'd migrate without stopping the business.",
    he: "אנחנו marketplace: קונים משלמים, אנחנו מחזיקים את הכסף, לוקחים עמלה ומעבירים תשלום למוכרים. היום שירות התשלומים קורא ל-card processor ואז כותב שורה לטבלת orders; היו לנו חיובים כפולים אחרי timeouts, ו-finance מבלים שבוע כל חודש ב-reconciliation. תתכנן את ה-flow של התשלומים ואת ה-ledger כך שכסף אף פעם לא נוצר, הולך לאיבוד או זז פעמיים — ותסביר איך היית עושה מיגרציה בלי לעצור את הביזנס."
  },
  clarify: [
    { en: "Volume and peaks: payments per second on average and on peak days? Number of currencies?", he: "ווליום ו-peaks: כמה תשלומים בשנייה בממוצע ובימי שיא? כמה מטבעות?" },
    { en: "Which external processors/banks, and what idempotency and webhook guarantees do they provide?", he: "אילו processors/בנקים חיצוניים, ואילו הבטחות idempotency ו-webhooks הם נותנים?" },
    { en: "Regulatory scope: PCI DSS (do we touch card numbers or use tokenization?), audit retention (7+ years), SOX controls?", he: "Scope רגולטורי: PCI DSS (אנחנו נוגעים במספרי כרטיס או משתמשים ב-tokenization?), שמירת audit (7+ שנים), בקרות SOX?" },
    { en: "Do balances need to be read in real time (wallet, available-to-payout), or is end-of-day enough for some views?", he: "צריך לקרוא יתרות בזמן אמת (wallet, זמין למשיכה), או שלחלק מהתצוגות סוף יום מספיק?" },
    { en: "What's the tolerance for payment latency — can capture be async with the user seeing 'processing'?", he: "מה הסבילות ל-latency בתשלום — capture יכול להיות אסינכרוני כשהמשתמש רואה 'בעיבוד'?" }
  ],
  functional: [
    { en: "Charge a buyer exactly once per checkout attempt, even with client retries, timeouts and crashes mid-flow.", he: "לחייב קונה בדיוק פעם אחת לכל ניסיון checkout, גם עם retries של ה-client, timeouts וקריסות באמצע ה-flow." },
    { en: "Record every money movement as balanced double-entry journal entries (sum of debits = sum of credits) in an immutable ledger.", he: "לרשום כל תנועת כסף כ-journal entries מאוזנים של double-entry (סכום חובה = סכום זכות) ב-ledger בלתי ניתן לשינוי." },
    { en: "Support refunds, partial captures, chargebacks, fees and seller payouts as ledger transactions.", he: "תמיכה ב-refunds, partial captures, chargebacks, עמלות ו-payouts למוכרים כטרנזקציות ב-ledger." },
    { en: "Daily automated reconciliation against processor settlement files and bank statements, with a break queue for mismatches.", he: "Reconciliation אוטומטי יומי מול קבצי settlement של ה-processor ודפי בנק, עם תור breaks לאי-התאמות." }
  ],
  nonFunctional: [
    { en: "Correctness over availability: never double-charge or lose a ledger entry; prefer to fail a payment than record it wrongly.", he: "נכונות לפני זמינות: אף פעם לא לחייב פעמיים או לאבד entry ב-ledger; עדיף להכשיל תשלום מאשר לרשום אותו לא נכון." },
    { en: "Scale: 500 payments/s peak, ~5 ledger entries per payment ≈ 2,500 entry lines/s; 5 years online history.", he: "סקייל: 500 תשלומים בשנייה ב-peak, ~5 שורות ledger לתשלום ≈ 2,500 שורות בשנייה; 5 שנות היסטוריה אונליין." },
    { en: "Payment API p99 under 2 s (processor-bound); ledger write p99 under 50 ms.", he: "API התשלום ב-p99 מתחת ל-2 שניות (חסום ע\"י ה-processor); כתיבה ל-ledger ב-p99 מתחת ל-50 ms." },
    { en: "Full auditability: every balance is derivable from immutable entries; corrections are new entries, never updates.", he: "Auditability מלאה: כל יתרה ניתנת לגזירה מ-entries בלתי משתנים; תיקונים הם entries חדשים, אף פעם לא updates." }
  ],
  estimates: {
    en: `<p><strong>Volume:</strong> 10M payments/day ≈ 115/s avg, peak 500/s. ~5 ledger lines per payment (buyer, clearing, fee revenue, seller payable, processor receivable) → 50M lines/day ≈ 580 lines/s avg, 2,500/s peak. A single well-tuned Postgres primary handles 10k+ simple inserts/s, so one ledger shard is enough for years; shard by account only when hot accounts become the limit.</p>
<p><strong>Storage:</strong> ~200 bytes/line × 50M = 10 GB/day ≈ 3.6 TB/year, plus indexes ×2 ≈ 7 TB/year. Keep 2 years hot in Postgres (partitioned by month), older partitions detached to cheaper storage/warehouse but still queryable for audit.</p>
<p><strong>Hot accounts:</strong> the platform's fee-revenue and processor-clearing accounts are touched by <em>every</em> payment — 500 updates/s on one balance row means lock contention. Don't keep a mutable balance row for them; derive balances from entries (or use sharded sub-accounts summed on read).</p>
<p><strong>Idempotency store:</strong> 10M keys/day, ~500 bytes each with stored response ≈ 5 GB/day; TTL 7 days ≈ 35 GB. Fits in the same Postgres or a dedicated table.</p>`,
    he: `<p><strong>ווליום:</strong> 10M תשלומים ביום ≈ 115 בשנייה בממוצע, peak של 500. ~5 שורות ledger לתשלום (קונה, clearing, הכנסות מעמלות, חוב למוכר, חוב מה-processor) → 50M שורות ביום ≈ 580 בשנייה בממוצע, 2,500 ב-peak. primary אחד של Postgres מכוונן טוב מחזיק 10k+ inserts פשוטים בשנייה, אז shard אחד של ledger מספיק לשנים; עושים sharding לפי חשבון רק כשחשבונות חמים הופכים למגבלה.</p>
<p><strong>אחסון:</strong> ~200 bytes לשורה × 50M = 10 GB ביום ≈ 3.6 TB בשנה, ועם indexes פי 2 ≈ 7 TB בשנה. שומרים שנתיים חמות ב-Postgres (partitioned לפי חודש), partitions ישנים מנותקים לאחסון זול/warehouse אבל עדיין ניתנים לשאילתה לצורכי audit.</p>
<p><strong>חשבונות חמים:</strong> חשבון הכנסות העמלות וחשבון ה-clearing של ה-processor נוגעים ב<em>כל</em> תשלום — 500 עדכונים בשנייה על שורת יתרה אחת זה lock contention. לא מחזיקים להם שורת יתרה ניתנת לשינוי; גוזרים יתרות מה-entries (או משתמשים ב-sub-accounts משורדים שמסוכמים בקריאה).</p>
<p><strong>Idempotency store:</strong> 10M keys ביום, ~500 bytes כל אחד עם ה-response השמור ≈ 5 GB ביום; TTL של 7 ימים ≈ 35 GB. נכנס באותו Postgres או בטבלה ייעודית.</p>`
  },
  api: `POST /v1/payments
  Idempotency-Key: 7f3c...-checkout-88123-attempt-1
  {order_id, buyer_id, amount_minor: 12990, currency: "EUR", payment_method_token}
  -> 201 {payment_id, status: authorized|captured|failed|requires_action}
  -> 409 if same key reused with a different body
  (same key + same body => returns the stored original response, no new charge)
POST /v1/payments/{id}/refunds   Idempotency-Key: ...   {amount_minor}
POST /v1/payouts                 Idempotency-Key: ...   {seller_id, amount_minor}
GET  /v1/accounts/{id}/balance?as_of=2026-11-12T00:00Z
POST /webhooks/processor   (signed; deduped by provider event id)`,
  dataModel: `idempotency_keys(key PK, request_hash, status[in_progress|done], response_json, locked_until, created_at)
payments(payment_id PK, order_id, state, amount_minor, currency, processor_ref UNIQUE, version)
payment_attempts(attempt_id PK, payment_id, processor_idem_key UNIQUE, status, raw_response)
accounts(account_id PK, type[asset|liability|revenue|expense], owner, currency)
journal_entries(entry_id PK, txn_id, account_id, direction[debit|credit], amount_minor BIGINT, currency, created_at)
ledger_txns(txn_id PK, kind[capture|refund|fee|payout|chargeback|correction], source_ref UNIQUE, posted_at)
  CHECK per txn: SUM(debits) = SUM(credits)   -- enforced in the same DB transaction
outbox(id PK, aggregate_id, event_type, payload, created_at, published_at NULL)
recon_breaks(id PK, source[processor|bank], external_ref, expected, actual, status, owner)`,
  diagram: `client --(Idempotency-Key)--> Payments API
                                  | 1. INSERT idempotency_keys (in_progress) or return stored
                                  | 2. state machine: created -> authorizing
                                  v
                       Payment orchestrator --(processor idem key = attempt_id)--> Card processor
                                  |   <------ sync response / async webhook ---------|
                                  | 3. ONE DB txn: payments.state=captured
                                  |                + ledger_txn + balanced journal_entries
                                  |                + outbox row + idempotency_keys=done
                                  v
                          Postgres (ledger, append-only)
                                  |  outbox relay (CDC / poller)
                                  v
                          Kafka: payment.captured --> orders, notifications, payouts, analytics

  Nightly: processor settlement file + bank statement --> Reconciler --> matched | recon_breaks queue`,
  deepDives: [
    {
      h: { en: "Idempotency keys end to end", he: "Idempotency keys מקצה לקצה" },
      body: {
        en: `<p>The client generates the key per <em>logical</em> attempt (checkout id + attempt number) and reuses it on every retry. The server does an atomic <code>INSERT ... ON CONFLICT DO NOTHING</code> into <code>idempotency_keys</code>:</p>
<ul><li>New key → mark <code>in_progress</code> with a lease, process, store the response, mark <code>done</code>.</li>
<li>Existing <code>done</code> → return the stored response byte-for-byte (same status code).</li>
<li>Existing <code>in_progress</code> with a live lease → <code>409</code>/retry-after, so two concurrent retries never both call the processor.</li>
<li>Same key, different request hash → <code>422</code>: a client bug, never silently charge.</li></ul>
<p>Idempotency must also flow <strong>outward</strong>: every call to the processor carries its own idempotency key (the <code>attempt_id</code>), persisted <em>before</em> the call. After a timeout we don't know if the charge happened; we retry with the same processor key or query by it, never with a new one. That single rule removes the double-charge-after-timeout bug.</p>
<blockquote>⚠️ Production tip: a timeout is not a failure — it's "unknown". Model it as an explicit state (<code>authorizing_unknown</code>) resolved by retry-with-same-key, status query, or the webhook — never by showing the user "failed, try again".</blockquote>`,
        he: `<p>ה-client מייצר את ה-key לכל ניסיון <em>לוגי</em> (checkout id + מספר ניסיון) ומשתמש בו שוב בכל retry. השרת עושה <code>INSERT ... ON CONFLICT DO NOTHING</code> אטומי לטבלת <code>idempotency_keys</code>:</p>
<ul><li>key חדש → מסמנים <code>in_progress</code> עם lease, מעבדים, שומרים את ה-response ומסמנים <code>done</code>.</li>
<li>key קיים במצב <code>done</code> → מחזירים את ה-response השמור אחד לאחד (אותו status code).</li>
<li>key קיים במצב <code>in_progress</code> עם lease בתוקף → <code>409</code>/retry-after, כך ששני retries מקבילים אף פעם לא קוראים שניהם ל-processor.</li>
<li>אותו key עם hash בקשה שונה → <code>422</code>: באג ב-client, אף פעם לא מחייבים בשקט.</li></ul>
<p>Idempotency צריך לזרום גם <strong>החוצה</strong>: כל קריאה ל-processor נושאת idempotency key משלה (ה-<code>attempt_id</code>), שנשמר <em>לפני</em> הקריאה. אחרי timeout אנחנו לא יודעים אם החיוב קרה; עושים retry עם אותו key או שואלים לפיו, אף פעם לא עם key חדש. החוק האחד הזה מעלים את באג החיוב הכפול אחרי timeout.</p>
<blockquote>⚠️ טיפ מ-production: timeout זה לא כישלון — זה "לא ידוע". ממדלים את זה כ-state מפורש (<code>authorizing_unknown</code>) שנפתר ע"י retry עם אותו key, שאילתת סטטוס או ה-webhook — אף פעם לא ע"י הצגת "נכשל, נסה שוב" למשתמש.</blockquote>`
      }
    },
    {
      h: { en: "Double-entry ledger: immutable, balanced, derivable", he: "Ledger של double-entry: בלתי משתנה, מאוזן, ניתן לגזירה" },
      body: {
        en: `<p>Every money movement is a <strong>ledger transaction</strong> of 2+ entries whose debits equal credits. A €129.90 capture with a 10% fee:</p>
<pre>txn capture#p_88123
  DEBIT  processor_receivable        12990
  CREDIT seller_payable:s_42         11691
  CREDIT platform_fee_revenue         1299</pre>
<p>Rules: amounts are integers in minor units (never floats); entries are append-only (no UPDATE/DELETE — enforce with DB permissions); corrections are reversing transactions with a reference to the original; each transaction has a unique <code>source_ref</code> (e.g. <code>capture:p_88123</code>) so re-posting the same business event is a no-op. That unique constraint is the ledger's own idempotency.</p>
<p>Balances are a projection: <code>SUM(credits) - SUM(debits)</code> per account, cached in a balance table updated in the same transaction for normal accounts, and computed/sharded for hot ones. Because the ledger is the source of truth, any cache can be rebuilt and verified.</p>`,
        he: `<p>כל תנועת כסף היא <strong>טרנזקציית ledger</strong> של 2+ entries שהחובה שלהם שווה לזכות. capture של €129.90 עם עמלה של 10%:</p>
<pre>txn capture#p_88123
  DEBIT  processor_receivable        12990
  CREDIT seller_payable:s_42         11691
  CREDIT platform_fee_revenue         1299</pre>
<p>חוקים: סכומים הם integers ביחידות מינוריות (אף פעם לא floats); entries הם append-only (בלי UPDATE/DELETE — אוכפים עם הרשאות DB); תיקונים הם טרנזקציות הפוכות עם הפניה למקור; לכל טרנזקציה יש <code>source_ref</code> ייחודי (למשל <code>capture:p_88123</code>) כך שרישום חוזר של אותו אירוע עסקי הוא no-op. ה-unique constraint הזה הוא ה-idempotency של ה-ledger עצמו.</p>
<p>יתרות הן projection: <code>SUM(credits) - SUM(debits)</code> לכל חשבון, עם cache בטבלת יתרות שמתעדכנת באותה טרנזקציה לחשבונות רגילים, ומחושבת/משורדת לחשבונות חמים. כי ה-ledger הוא מקור האמת, כל cache אפשר לבנות מחדש ולאמת.</p>`
      }
    },
    {
      h: { en: "Exactly-once effects: state machine + transactional outbox", he: "Exactly-once effects: state machine ו-transactional outbox" },
      body: {
        en: `<p>Exactly-once <em>delivery</em> doesn't exist across networks; exactly-once <em>effect</em> does: at-least-once delivery + idempotent processing. The payment is a state machine (<code>created → authorizing → authorized → captured → refunded…</code>) with an optimistic <code>version</code> column, so a late webhook and a sync response racing each other produce one transition, not two.</p>
<p>The <strong>outbox pattern</strong> solves dual writes: in the same DB transaction that marks the payment captured and posts ledger entries, insert an <code>outbox</code> row. A relay (Debezium CDC or a poller with <code>FOR UPDATE SKIP LOCKED</code>) publishes it to Kafka and marks it published. If the relay crashes it republishes — consumers dedupe by event id. Never "write DB then publish to Kafka" in application code: a crash between the two loses or invents events.</p>`,
        he: `<p>Exactly-once <em>delivery</em> לא קיים מעל רשת; exactly-once <em>effect</em> כן: at-least-once delivery ועיבוד אידמפוטנטי. התשלום הוא state machine (<code>created → authorizing → authorized → captured → refunded…</code>) עם עמודת <code>version</code> אופטימית, כך ש-webhook מאוחר ו-response סינכרוני שמתחרים זה בזה מייצרים מעבר אחד, לא שניים.</p>
<p>ה-<strong>outbox pattern</strong> פותר dual writes: באותה טרנזקציית DB שמסמנת את התשלום כ-captured ורושמת entries ל-ledger, מכניסים שורת <code>outbox</code>. relay (Debezium CDC או poller עם <code>FOR UPDATE SKIP LOCKED</code>) מפרסם אותה ל-Kafka ומסמן כפורסם. אם ה-relay קורס הוא מפרסם שוב — ה-consumers עושים dedupe לפי event id. אף פעם לא "לכתוב ל-DB ואז לפרסם ל-Kafka" בקוד האפליקציה: קריסה בין השניים מאבדת או ממציאה אירועים.</p>`
      }
    },
    {
      h: { en: "Reconciliation, audit and migration path", he: "Reconciliation, audit ומסלול מיגרציה" },
      body: {
        en: `<p><strong>Reconciliation</strong> is a first-class system, not a finance spreadsheet: three-way match of (our ledger) ↔ (processor settlement file) ↔ (bank statement) by <code>processor_ref</code>, amount and date, with tolerance rules for FX and fees. Mismatches become <code>recon_breaks</code> with an owner and SLA; typical causes are missed webhooks, disputes, and processor-side reversals. Internal invariants run hourly: every txn balances, total of all accounts = 0, no payment captured without a ledger txn.</p>
<p><strong>Audit:</strong> append-only tables, DB-level roles (the app cannot UPDATE <code>journal_entries</code>), hash chaining per day of entries for tamper evidence, and access logs. Retain 7+ years.</p>
<p><strong>Migration without downtime:</strong> (1) introduce idempotency keys and processor idempotency on the existing service first — kills double charges in weeks. (2) Build the ledger in <em>shadow mode</em>: post entries from the existing flow (via CDC from the orders table), reconcile ledger vs legacy daily until breaks hit zero for 30 days. (3) Backfill opening balances as a dated migration transaction. (4) Flip the source of truth: payouts read balances from the ledger. (5) Retire legacy balance fields. Ownership: a payments platform team owns the ledger and recon; finance owns the chart of accounts and signs off each phase.</p>
<p><strong>Failure modes:</strong> processor outage (fail fast, circuit breaker, optional second processor routing); webhook storms/duplicates (dedupe by event id); DB failover with async replica losing the last second (use synchronous replication for the ledger DB — correctness over latency); hot-account lock contention at peak.</p>`,
        he: `<p><strong>Reconciliation</strong> היא מערכת מדרגה ראשונה, לא גיליון של finance: התאמה משולשת של (ה-ledger שלנו) ↔ (קובץ settlement של ה-processor) ↔ (דף בנק) לפי <code>processor_ref</code>, סכום ותאריך, עם חוקי סבילות ל-FX ועמלות. אי-התאמות הופכות ל-<code>recon_breaks</code> עם בעלים ו-SLA; הסיבות הנפוצות הן webhooks שפוספסו, disputes ו-reversals בצד ה-processor. אינווריאנטים פנימיים רצים כל שעה: כל txn מאוזנת, סכום כל החשבונות = 0, אין תשלום captured בלי txn ב-ledger.</p>
<p><strong>Audit:</strong> טבלאות append-only, roles ברמת ה-DB (לאפליקציה אין הרשאת UPDATE על <code>journal_entries</code>), hash chaining של entries לכל יום כראיה לחבלה, ולוגי גישה. שמירה של 7+ שנים.</p>
<p><strong>מיגרציה בלי downtime:</strong> (1) קודם מכניסים idempotency keys ו-idempotency מול ה-processor לשירות הקיים — זה הורג חיובים כפולים תוך שבועות. (2) בונים את ה-ledger ב-<em>shadow mode</em>: רושמים entries מה-flow הקיים (דרך CDC מטבלת orders), ועושים reconciliation יומי בין ה-ledger ל-legacy עד שה-breaks באפס 30 יום. (3) Backfill של יתרות פתיחה כטרנזקציית מיגרציה מתוארכת. (4) מחליפים את מקור האמת: payouts קוראים יתרות מה-ledger. (5) מורידים את שדות היתרה הישנים. בעלות: צוות payments platform מחזיק את ה-ledger וה-recon; finance מחזיקים את ה-chart of accounts וחותמים על כל שלב.</p>
<p><strong>Failure modes:</strong> processor נופל (fail fast, circuit breaker, אופציה ל-routing ל-processor שני); סערות/כפילויות של webhooks (dedupe לפי event id); failover של DB עם replica אסינכרוני שמאבד את השנייה האחרונה (משתמשים ב-replication סינכרוני ל-DB של ה-ledger — נכונות לפני latency); lock contention על חשבונות חמים ב-peak.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Synchronous replication for the ledger DB adds a few ms per commit but guarantees RPO=0; async is faster but a failover can lose acknowledged money movements.", he: "Replication סינכרוני ל-DB של ה-ledger מוסיף כמה ms לכל commit אבל מבטיח RPO=0; אסינכרוני מהיר יותר אבל failover יכול לאבד תנועות כסף שאושרו." },
    { en: "Relational DB vs specialised ledger store (TigerBeetle, QLDB-style): Postgres gives transactions, constraints and familiar ops; specialised stores give huge throughput and built-in invariants at the cost of a new technology to operate.", he: "DB רלציוני מול store ייעודי ל-ledger (TigerBeetle, בסגנון QLDB): Postgres נותן טרנזקציות, constraints ותפעול מוכר; stores ייעודיים נותנים throughput עצום ואינווריאנטים מובנים במחיר של טכנולוגיה חדשה לתפעל." },
    { en: "Materialised balances vs derived-on-read: cached balances are fast but contend on hot accounts; derivation is contention-free but slower — mix per account type.", he: "יתרות ממומשות מול נגזרות בקריאה: יתרות ב-cache מהירות אבל מתנגשות על חשבונות חמים; גזירה בלי contention אבל איטית יותר — מערבבים לפי סוג חשבון." },
    { en: "Sync vs async capture: async (show 'processing') improves resilience to processor latency but complicates UX and requires robust state reconciliation.", he: "Capture סינכרוני מול אסינכרוני: אסינכרוני (מציגים 'בעיבוד') משפר עמידות ל-latency של ה-processor אבל מסבך את ה-UX ודורש reconciliation חזק של state." }
  ],
  followUps: [
    { q: { en: "The processor call times out. The user refreshes and clicks Pay again. Walk through exactly what happens.", he: "הקריאה ל-processor עושה timeout. המשתמש מרענן ולוחץ שוב על Pay. תעבור בדיוק על מה שקורה." },
      a: { en: "The page reuses the checkout's idempotency key (stored client-side/server-side per checkout). The API finds the key in_progress or the payment in authorizing_unknown; it does not create a new attempt. A resolver retries the processor with the same attempt key or queries by it; the processor returns the original result. Either the user sees the single success, or a definitive failure after which a new attempt (new key) is allowed.", he: "הדף משתמש שוב ב-idempotency key של ה-checkout (נשמר בצד לקוח/שרת לכל checkout). ה-API מוצא את ה-key במצב in_progress או את התשלום ב-authorizing_unknown; הוא לא יוצר ניסיון חדש. resolver עושה retry ל-processor עם אותו attempt key או שואל לפיו; ה-processor מחזיר את התוצאה המקורית. או שהמשתמש רואה את ההצלחה היחידה, או כישלון ודאי שאחריו מותר ניסיון חדש (key חדש)." } },
    { q: { en: "Your fee-revenue account is the bottleneck at 2,000 entries/s. Fix it.", he: "חשבון הכנסות העמלות הוא צוואר הבקבוק ב-2,000 entries בשנייה. תתקן." },
      a: { en: "Stop updating a single balance row: split it into N sub-accounts (fee_revenue#0..#31) chosen by hash of payment id, and sum on read; or don't materialise its balance at all and compute it from entries with periodic snapshots. Entries themselves are inserts and don't contend.", he: "מפסיקים לעדכן שורת יתרה אחת: מפצלים ל-N sub-accounts (fee_revenue#0..#31) שנבחרים לפי hash של payment id, וסוכמים בקריאה; או לא מממשים את היתרה שלו בכלל ומחשבים מה-entries עם snapshots תקופתיים. ה-entries עצמם הם inserts ולא מתנגשים." } },
    { q: { en: "Why not make the ledger event-sourced on Kafka?", he: "למה לא לעשות את ה-ledger event-sourced על Kafka?" },
      a: { en: "You can, but you then rebuild transactional invariants (balanced txns, no overdraft) that a relational DB gives for free with constraints and serializable transactions. A common sweet spot: the DB is the ledger of record, Kafka carries outbox events for downstream consumers, and analytics rebuilds from the stream.", he: "אפשר, אבל אז בונים מחדש אינווריאנטים טרנזקציוניים (txns מאוזנות, בלי overdraft) ש-DB רלציוני נותן בחינם עם constraints וטרנזקציות serializable. ה-sweet spot הנפוץ: ה-DB הוא ה-ledger הרשמי, Kafka נושא אירועי outbox ל-consumers בהמשך, ו-analytics נבנה מחדש מה-stream." } }
  ],
  related: ["db-transactions", "db-replication", "arch-event-driven", "arch-resilience", "staff-exactly-once", "staff-consensus-consistency", "staff-multi-region-data"]
});

/* ------------------------------------------------------------------ */
/* 5. Unified observability platform at scale                          */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-observability-at-scale", icon: "🔭", level: 3,
  title: { en: "Unified observability platform: OpenTelemetry pipeline & cost governance", he: "פלטפורמת observability מאוחדת: pipeline של OpenTelemetry ו-cost governance" },
  prompt: {
    en: "We run ~10,000 services across 40 Kubernetes clusters. Each org picked its own tools: two Prometheus setups, a commercial APM on some services, ELK for logs, Jaeger in a corner. The observability bill is $1.8M/year and growing 60% a year — faster than traffic — and during incidents nobody can jump from a metric spike to the trace to the logs. Design one observability platform for metrics, logs and traces, and tell me how you control its cost and migrate everyone onto it.",
    he: "אנחנו מריצים ~10,000 services על פני 40 clusters של Kubernetes. כל ארגון בחר כלים משלו: שני setups של Prometheus, APM מסחרי על חלק מה-services, ELK ללוגים, ו-Jaeger בפינה. החשבון על observability הוא $1.8M בשנה וגדל 60% בשנה — מהר יותר מהתעבורה — ובזמן תקלות אף אחד לא מצליח לקפוץ מ-spike במטריקה ל-trace וללוגים. תתכנן פלטפורמת observability אחת ל-metrics, logs ו-traces, ותגיד לי איך שולטים בעלות ואיך מעבירים את כולם אליה."
  },
  clarify: [
    { en: "What is driving cost today — metric cardinality, log volume, trace volume, or vendor per-host pricing? Do we have a breakdown by team?", he: "מה מניע את העלות היום — cardinality של metrics, נפח לוגים, נפח traces, או תמחור per-host של ספק? יש פירוק לפי צוות?" },
    { en: "Retention requirements per signal: metrics 13 months for capacity planning? Logs 30 days hot, 1 year for audit? Traces 7 days?", he: "דרישות retention לכל signal: metrics ל-13 חודשים בשביל capacity planning? לוגים 30 יום חם ושנה ל-audit? traces ל-7 ימים?" },
    { en: "Build vs buy appetite: is a self-hosted OSS backend (Mimir/Loki/Tempo, ClickHouse) acceptable, or must we stay on a vendor?", he: "תיאבון ל-build vs buy: backend OSS בניהול עצמי (Mimir/Loki/Tempo, ClickHouse) מקובל, או שחייבים להישאר אצל ספק?" },
    { en: "Multi-tenancy and access: must teams be isolated from each other's data (PII in logs, regulated BUs)?", he: "Multi-tenancy וגישה: צריך לבודד צוותים מהדאטה אחד של השני (PII בלוגים, BUs רגולטוריים)?" },
    { en: "Who pays: will teams accept showback/quotas on telemetry the way they do on compute?", he: "מי משלם: צוותים יקבלו showback ו-quotas על telemetry כמו שהם מקבלים על compute?" }
  ],
  functional: [
    { en: "One instrumentation standard (OpenTelemetry SDKs + auto-instrumentation) and one collection pipeline for metrics, logs and traces.", he: "סטנדרט instrumentation אחד (OpenTelemetry SDKs ו-auto-instrumentation) ו-pipeline איסוף אחד ל-metrics, logs ו-traces." },
    { en: "Correlation: exemplars on metrics link to traces; every log line carries trace_id/span_id; one UI pivots between them.", he: "קורלציה: exemplars על metrics מקשרים ל-traces; כל שורת לוג נושאת trace_id/span_id; UI אחד עובר ביניהם." },
    { en: "Per-tenant quotas, usage showback and cardinality/volume guardrails enforced in the pipeline.", he: "Quotas לכל tenant, showback על שימוש ומעקות cardinality/נפח שנאכפים ב-pipeline." },
    { en: "Tiered retention per signal and per tenant tier, with cheap long-term storage in object storage.", he: "Retention בשכבות לכל signal ולכל tier של tenant, עם אחסון ארוך טווח זול ב-object storage." },
    { en: "SLO-based alerting as a platform feature (burn-rate alerts generated from SLO definitions).", he: "Alerting מבוסס SLO כפיצ'ר של הפלטפורמה (burn-rate alerts שנוצרים מהגדרות SLO)." }
  ],
  nonFunctional: [
    { en: "Scale: ~1M active series per cluster (40M total), 2 TB/day of logs after filtering (from 15 TB raw), 500k spans/s before sampling.", he: "סקייל: ~1M active series לכל cluster (40M בסך הכל), 2 TB ליום לוגים אחרי סינון (מ-15 TB גולמי), 500k spans בשנייה לפני sampling." },
    { en: "Telemetry must never take down production: bounded agent CPU/memory, drop rather than block under backpressure.", he: "Telemetry אסור שיפיל את production: CPU/memory חסומים ל-agents, עדיף לזרוק מאשר לחסום תחת backpressure." },
    { en: "Query: dashboards p95 under 2 s on 24 h windows; alert evaluation latency under 1 min.", he: "Query: dashboards ב-p95 מתחת ל-2 שניות על חלונות של 24 שעות; latency של הערכת alerts מתחת לדקה." },
    { en: "The platform must be more available than what it observes, and keep working during a regional outage (meta-monitoring outside the blast radius).", he: "הפלטפורמה צריכה להיות זמינה יותר ממה שהיא מנטרת, ולהמשיך לעבוד בזמן outage אזורי (meta-monitoring מחוץ ל-blast radius)." },
    { en: "Cost: flatten growth to below traffic growth; target ≤ 6-8% of infra spend.", he: "עלות: להשטיח את הצמיחה מתחת לצמיחת התעבורה; יעד של ≤ 6-8% מהוצאות התשתית." }
  ],
  estimates: {
    en: `<p><strong>Metrics:</strong> 40M active series × 1 sample/15 s ≈ 2.7M samples/s ingest. Mimir/Cortex-style ingesters handle ~1-1.5M series each with RF 3 → ~100 ingesters. Compressed TSDB ≈ 1.5 bytes/sample → 2.7M × 86,400 × 1.5 ≈ 350 GB/day in object storage; 13 months with downsampling (5 m after 30 d) ≈ ~40 TB ≈ $1k/month in S3. Storage is cheap; <strong>memory for active series</strong> (~5-10 KB per series in ingesters × RF) is the real cost — 40M × 3 × 8 KB ≈ 1 TB RAM.</p>
<p><strong>Logs:</strong> 15 TB/day raw. Dropping debug in prod, sampling health-check/access logs and deduplicating noisy lines → 2 TB/day. Indexed full-text (Elasticsearch) at ~$0.10/GB/day-retained vs label-indexed (Loki) or columnar (ClickHouse) on object storage at roughly 5-10x cheaper.</p>
<p><strong>Traces:</strong> 500k spans/s × ~500 bytes = 250 MB/s ≈ 21 TB/day if kept. Head sampling 10% + tail sampling (keep 100% of errors and slow traces) → ~3-5% retained ≈ 1 TB/day.</p>
<p><strong>Where the $1.8M goes</strong> (typical): 45% logs, 30% metrics (often 5-10 services own half of all series), 20% APM per-host fees, 5% traces. A 40-60% saving is realistic from governance alone, before changing any backend.</p>`,
    he: `<p><strong>Metrics:</strong> 40M active series × sample כל 15 שניות ≈ 2.7M samples בשנייה ב-ingest. ingesters בסגנון Mimir/Cortex מחזיקים ~1-1.5M series כל אחד עם RF 3 → ~100 ingesters. TSDB דחוס ≈ 1.5 bytes ל-sample → 2.7M × 86,400 × 1.5 ≈ 350 GB ביום ב-object storage; 13 חודשים עם downsampling (5 דקות אחרי 30 יום) ≈ ~40 TB ≈ $1k בחודש ב-S3. האחסון זול; <strong>הזיכרון ל-active series</strong> (~5-10 KB ל-series ב-ingesters × RF) הוא העלות האמיתית — 40M × 3 × 8 KB ≈ 1 TB RAM.</p>
<p><strong>לוגים:</strong> 15 TB ביום גולמי. זריקת debug ב-prod, sampling ללוגי health-check/access ו-dedup לשורות רועשות → 2 TB ביום. Full-text indexing (Elasticsearch) בסביבות $0.10 ל-GB ליום שמור, מול label-indexed (Loki) או columnar (ClickHouse) על object storage שזולים בערך פי 5-10.</p>
<p><strong>Traces:</strong> 500k spans בשנייה × ~500 bytes = 250 MB/s ≈ 21 TB ביום אם שומרים הכל. Head sampling של 10% ועוד tail sampling (שומרים 100% משגיאות ומ-traces איטיים) → ~3-5% נשמר ≈ 1 TB ביום.</p>
<p><strong>לאן הולך ה-$1.8M</strong> (טיפוסי): 45% לוגים, 30% metrics (הרבה פעמים 5-10 services מחזיקים חצי מכל ה-series), 20% עמלות per-host של APM, 5% traces. חיסכון של 40-60% ריאלי מ-governance בלבד, עוד לפני שמחליפים backend.</p>`
  },
  api: `# Ingest (OTLP everywhere)
OTLP gRPC :4317 / HTTP :4318  -> node agent (DaemonSet) -> gateway collectors -> backends
  resource attrs required: service.name, service.namespace(team), deployment.environment, k8s.cluster.name
# Tenancy
X-Scope-OrgID: team-payments          (set by gateway from k8s namespace -> tenant mapping)
# Governance API
GET  /obs/v1/tenants/{t}/usage?window=7d -> {active_series, samples_s, log_gb_day, spans_s, usd_month}
PUT  /obs/v1/tenants/{t}/limits {max_series, max_log_gb_day, trace_sample_rate}   (PR-driven)
GET  /obs/v1/cardinality/top?tenant=t  -> [{metric, label, series, growth_7d}]
# Query
PromQL (metrics), LogQL / SQL (logs), TraceQL (traces) behind one Grafana`,
  dataModel: `tenants(tenant_id PK, team, tier[gold|standard|batch], limits_json, cost_center)
usage_daily(date, tenant_id, signal, volume, active_series, usd)
-- Metrics: object storage blocks (2h) per tenant, compacted; series = name + sorted labels
-- Logs: chunks keyed by {tenant, stream labels: service, namespace, level} + time; body not indexed
-- Traces: spans in parquet/blocks by trace_id; span metrics (RED) derived in the pipeline
slo_defs(service, sli_query, objective, window) -> generated recording + burn-rate alert rules
Retention tiers: metrics raw 30d / 5m-downsampled 13mo; logs 7-30d hot, 1y archive (S3 IA); traces 7-14d`,
  diagram: `  pods (OTel SDK / auto-instr.)   node logs (stdout)   kube-state / node metrics
          \\                          |                      /
           +-------- OTel Collector agent (DaemonSet, per node) ------+
                     batch, memory_limiter, k8sattributes, drop debug
                                     |  OTLP
                     OTel gateway collectors (per cluster, HPA)
                      - tenant routing (X-Scope-OrgID)
                      - cardinality limiter / attribute allowlist
                      - tail sampling (traces, by trace_id via loadbalancing exporter)
                      - span metrics + exemplars
                      - log sampling / dedup / PII redaction
                  /                   |                      \\
       Metrics backend          Logs backend              Traces backend
       (Mimir: ingesters,       (Loki / ClickHouse)       (Tempo)
        store-gw, S3)                 |                          |
                  \\___________ object storage (S3, tiered) _____/
                                     |
                     Grafana (one UI) + Alertmanager + usage/cost service
   meta-monitoring: separate small stack in another region watches the platform`,
  deepDives: [
    {
      h: { en: "The OpenTelemetry pipeline: agent + gateway, and why it's the control point", he: "ה-pipeline של OpenTelemetry: agent ו-gateway, ולמה זו נקודת השליטה" },
      body: {
        en: `<p>Standardise on <strong>OTLP and the OpenTelemetry Collector</strong>. The vendor-neutral pipeline is the strategic asset: backends become swappable, and every governance rule lives in one place instead of 10,000 services.</p>
<ul><li><strong>Agent (DaemonSet):</strong> receives OTLP from pods, tails container logs, scrapes node/pod metrics, adds k8s metadata (<code>k8sattributes</code>). Strict <code>memory_limiter</code> and CPU limits; on backpressure it drops and counts, never blocks the app.</li>
<li><strong>Gateway (per cluster):</strong> tenant routing, attribute allowlists, cardinality limits, PII redaction, log sampling, and <strong>tail sampling</strong> — which needs all spans of a trace on one collector, so agents use the <code>loadbalancing</code> exporter keyed by trace_id.</li>
<li><strong>Derived signals:</strong> the <code>spanmetrics</code> connector generates RED metrics (rate, errors, duration) from 100% of spans <em>before</em> sampling, so dashboards stay accurate while only 3-5% of traces are stored.</li></ul>
<pre>processors:
  memory_limiter: { check_interval: 1s, limit_percentage: 80, spike_limit_percentage: 20 }
  tail_sampling:
    decision_wait: 10s
    policies:
      - { name: errors, type: status_code, status_code: { status_codes: [ERROR] } }
      - { name: slow,   type: latency, latency: { threshold_ms: 1500 } }
      - { name: base,   type: probabilistic, probabilistic: { sampling_percentage: 2 } }</pre>`,
        he: `<p>מתסטנדרטים על <strong>OTLP ו-OpenTelemetry Collector</strong>. ה-pipeline הנייטרלי לספקים הוא הנכס האסטרטגי: ה-backends הופכים ברי-החלפה, וכל חוק governance יושב במקום אחד במקום ב-10,000 services.</p>
<ul><li><strong>Agent (DaemonSet):</strong> מקבל OTLP מה-pods, עושה tail ללוגים של containers, סורק metrics של nodes/pods, ומוסיף metadata של k8s (<code>k8sattributes</code>). <code>memory_limiter</code> ו-CPU limits קשוחים; ב-backpressure הוא זורק וסופר, אף פעם לא חוסם את האפליקציה.</li>
<li><strong>Gateway (לכל cluster):</strong> routing ל-tenants, allowlists של attributes, מגבלות cardinality, הסרת PII, sampling ללוגים, ו-<strong>tail sampling</strong> — שדורש שכל ה-spans של trace יגיעו לאותו collector, לכן ה-agents משתמשים ב-exporter מסוג <code>loadbalancing</code> לפי trace_id.</li>
<li><strong>Signals נגזרים:</strong> ה-connector <code>spanmetrics</code> מייצר RED metrics (rate, errors, duration) מ-100% מה-spans <em>לפני</em> ה-sampling, כך שה-dashboards נשארים מדויקים כשרק 3-5% מה-traces נשמרים.</li></ul>
<pre>processors:
  memory_limiter: { check_interval: 1s, limit_percentage: 80, spike_limit_percentage: 20 }
  tail_sampling:
    decision_wait: 10s
    policies:
      - { name: errors, type: status_code, status_code: { status_codes: [ERROR] } }
      - { name: slow,   type: latency, latency: { threshold_ms: 1500 } }
      - { name: base,   type: probabilistic, probabilistic: { sampling_percentage: 2 } }</pre>`
      }
    },
    {
      h: { en: "Cardinality governance: the metric bill is a people problem", he: "Cardinality governance: חשבון ה-metrics הוא בעיה של אנשים" },
      body: {
        en: `<p>One label like <code>user_id</code>, <code>request_id</code> or a raw URL path multiplies series by millions. Controls, in order of leverage:</p>
<ul><li><strong>Visibility:</strong> per-tenant active-series and top-cardinality reports (<code>topk(20, count by (__name__)({__name__=~".+"}))</code> per tenant), sent weekly with dollars attached.</li>
<li><strong>Guardrails:</strong> per-tenant <code>max_global_series</code> limits in the backend and a per-metric label-value cap in the gateway; exceeding series are dropped with a self-explaining error metric the team can alert on.</li>
<li><strong>Paved road:</strong> instrumentation libraries that template routes (<code>/users/{id}</code>), and a denylist of known-bad attributes (<code>http.url</code>, <code>user.id</code> as metric labels — fine on spans, not on metrics).</li>
<li><strong>Aggregation:</strong> recording rules / stream aggregation drop per-pod labels for long-retention data; keep pod-level only 7 days.</li></ul>
<blockquote>💡 Real world: in most audits, fewer than 1% of metric names produce over half of all series, and a third of series are never queried. An "unused metrics" report (series never read by a dashboard, alert or query in 30 days) is often the single biggest cost lever.</blockquote>`,
        he: `<p>label אחד כמו <code>user_id</code>, <code>request_id</code> או URL path גולמי מכפיל series במיליונים. בקרות, לפי סדר המינוף:</p>
<ul><li><strong>נראות:</strong> דוחות active series ו-top cardinality לכל tenant (<code>topk(20, count by (__name__)({__name__=~".+"}))</code> לכל tenant), שנשלחים שבועית עם דולרים מוצמדים.</li>
<li><strong>מעקות:</strong> מגבלות <code>max_global_series</code> לכל tenant ב-backend ותקרת ערכי label לכל metric ב-gateway; series עודפים נזרקים עם מטריקת שגיאה שמסבירה את עצמה, שהצוות יכול לעשות עליה alert.</li>
<li><strong>כביש סלול:</strong> ספריות instrumentation שעושות templating ל-routes (<code>/users/{id}</code>), ו-denylist של attributes מוכרים כבעייתיים (<code>http.url</code>, <code>user.id</code> כ-labels של metrics — בסדר על spans, לא על metrics).</li>
<li><strong>אגרגציה:</strong> recording rules / stream aggregation שמורידים labels ברמת pod לדאטה עם retention ארוך; שומרים רמת pod רק 7 ימים.</li></ul>
<blockquote>💡 מהשטח: ברוב ה-audits, פחות מ-1% משמות ה-metrics מייצרים יותר מחצי מכל ה-series, ושליש מה-series אף פעם לא נשאלים. דוח "metrics לא בשימוש" (series שאף dashboard, alert או query לא קראו ב-30 יום) הוא הרבה פעמים מנוף העלות הכי גדול.</blockquote>`
      }
    },
    {
      h: { en: "Tiered storage, retention and multi-tenancy", he: "Tiered storage, retention ו-multi-tenancy" },
      body: {
        en: `<p>All three backends follow the same shape: <strong>stateless-ish write path → short-lived local state → immutable blocks in object storage → query layer with caches</strong>. That shape makes retention a cost dial rather than a capacity problem. Tiers per tenant: <em>gold</em> (customer-facing, 30 d raw metrics, 30 d logs, 14 d traces), <em>standard</em> (14 d / 14 d / 7 d), <em>batch/dev</em> (7 d / 3 d / 2 d). Audit logs go to a separate archive pipeline (S3 + Athena) — never pay hot-index prices for compliance retention.</p>
<p>Multi-tenancy uses the backends' native tenant ID (<code>X-Scope-OrgID</code>) set <em>only</em> by the gateway from trusted k8s metadata, never by the app. Per-tenant ingestion rate limits and query limits (max series per query, max time range, query timeout) protect the shared platform from one heavy dashboard or a runaway <code>{}=~".*"</code> query. Shuffle sharding assigns each tenant a subset of ingesters, so one tenant's overload hits only a few.</p>`,
        he: `<p>שלושת ה-backends הולכים באותה צורה: <strong>write path כמעט stateless → state מקומי קצר-חיים → blocks בלתי משתנים ב-object storage → שכבת query עם caches</strong>. הצורה הזו הופכת retention לכפתור עלות ולא לבעיית קיבולת. tiers לכל tenant: <em>gold</em> (מול לקוחות, 30 יום metrics גולמי, 30 יום לוגים, 14 יום traces), <em>standard</em> (14 / 14 / 7), <em>batch/dev</em> (7 / 3 / 2). לוגים של audit הולכים ל-pipeline ארכיון נפרד (S3 + Athena) — אף פעם לא משלמים מחיר של hot index על retention של compliance.</p>
<p>Multi-tenancy משתמש ב-tenant ID המובנה של ה-backends (<code>X-Scope-OrgID</code>) שנקבע <em>רק</em> ע"י ה-gateway מ-metadata אמין של k8s, אף פעם לא ע"י האפליקציה. rate limits ל-ingestion ומגבלות query לכל tenant (מקסימום series ל-query, טווח זמן מקסימלי, timeout) מגינים על הפלטפורמה המשותפת מ-dashboard כבד אחד או מ-query בורח כמו <code>{}=~".*"</code>. Shuffle sharding מקצה לכל tenant תת-קבוצה של ingesters, כך שעומס של tenant אחד פוגע רק בכמה.</p>`
      }
    },
    {
      h: { en: "Migration, ownership and failure modes", he: "מיגרציה, בעלות ו-failure modes" },
      body: {
        en: `<p><strong>Migration (12-18 months):</strong> (1) Deploy the OTel Collector agents/gateways everywhere first, exporting <em>to the existing backends</em> — zero change for teams, but the pipeline is now ours. (2) Turn on governance in the pipeline (drop debug, redact PII, cardinality reports) — the first cost savings, typically 25-35%, before any backend migration. (3) Dual-write to the new backends; build the unified Grafana with correlation; migrate dashboards/alerts with tooling (Prometheus rules are portable; APM dashboards need rewrites). (4) Move teams org by org; turn off vendor ingestion per team after 30 days of parallel run. (5) Negotiate the vendor contract down or out using the measured volumes.</p>
<p><strong>Ownership:</strong> an observability platform team (6-10 engineers) owns pipeline, backends, SDK distributions and governance; teams own their instrumentation, dashboards, SLOs and their bill. Publish platform SLOs: ingest availability 99.9%, alert evaluation delay &lt; 60 s, query p95 &lt; 2 s.</p>
<p><strong>Failure modes:</strong> the observability platform dies in the same incident it should explain (separate failure domain, meta-monitoring in another region, critical alerts with a direct path to Alertmanager); collector OOM from a log burst (memory_limiter, drop policies, per-node limits); a deploy introduces a high-cardinality label and the tenant hits limits mid-incident (limits alert the owner well before dropping, and a short-term burst allowance); tail-sampling gateway imbalance (consistent hashing on trace_id, scale on queue depth).</p>`,
        he: `<p><strong>מיגרציה (12-18 חודשים):</strong> (1) קודם פורסים את ה-agents וה-gateways של OTel Collector בכל מקום, עם export <em>ל-backends הקיימים</em> — אפס שינוי לצוותים, אבל עכשיו ה-pipeline שלנו. (2) מפעילים governance ב-pipeline (זריקת debug, הסרת PII, דוחות cardinality) — החיסכון הראשון, בדרך כלל 25-35%, עוד לפני מיגרציה של backend. (3) Dual-write ל-backends החדשים; בונים את ה-Grafana המאוחד עם קורלציה; מעבירים dashboards ו-alerts עם כלים (חוקי Prometheus ניידים; dashboards של APM צריכים כתיבה מחדש). (4) מעבירים צוותים ארגון אחרי ארגון; מכבים ingestion לספק לכל צוות אחרי 30 יום של ריצה מקבילה. (5) מורידים או מבטלים את חוזה הספק בעזרת הנפחים שנמדדו.</p>
<p><strong>בעלות:</strong> צוות observability platform (6-10 מהנדסים) מחזיק את ה-pipeline, ה-backends, הפצות ה-SDK וה-governance; הצוותים מחזיקים את ה-instrumentation, ה-dashboards, ה-SLOs ואת החשבון שלהם. מפרסמים SLOs לפלטפורמה: זמינות ingest של 99.9%, השהיית הערכת alerts &lt; 60 שניות, query ב-p95 &lt; 2 שניות.</p>
<p><strong>Failure modes:</strong> פלטפורמת ה-observability מתה באותה תקלה שהיא אמורה להסביר (failure domain נפרד, meta-monitoring ב-region אחר, alerts קריטיים עם מסלול ישיר ל-Alertmanager); collector נופל ב-OOM מ-burst של לוגים (memory_limiter, policies של drop, limits לכל node); deploy מכניס label עם cardinality גבוה וה-tenant נתקע ב-limits באמצע תקלה (ה-limits מתריעים לבעלים הרבה לפני שזורקים, ויש burst allowance קצר); חוסר איזון ב-gateways של tail sampling (consistent hashing על trace_id, scale לפי עומק תור).</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Build (OSS on object storage) vs buy (vendor): self-hosting is often 3-5x cheaper at this scale but needs a 6-10 person team and on-call; vendors are faster to adopt and better UX. The OTel pipeline keeps the decision reversible.", he: "Build (OSS על object storage) מול buy (ספק): ניהול עצמי הרבה פעמים זול פי 3-5 בסקייל הזה אבל דורש צוות של 6-10 ו-on-call; ספקים מהירים יותר לאימוץ ועם UX טוב יותר. ה-pipeline של OTel משאיר את ההחלטה הפיכה." },
    { en: "Head vs tail sampling: head is cheap and stateless but drops interesting traces blindly; tail keeps errors/slow traces but needs stateful gateways and buffers ~10 s of spans.", he: "Head מול tail sampling: head זול ו-stateless אבל זורק traces מעניינים בעיוורון; tail שומר שגיאות ו-traces איטיים אבל דורש gateways עם state וחוצץ ~10 שניות של spans." },
    { en: "Full-text indexed logs vs label-indexed: full-text makes ad-hoc search instant but costs 5-10x; label-indexed is cheap but needs good labels and brute-force scans for free text.", he: "לוגים עם full-text index מול label-indexed: full-text הופך חיפוש ad-hoc למיידי אבל עולה פי 5-10; label-indexed זול אבל דורש labels טובים ו-brute-force scans לטקסט חופשי." },
    { en: "Hard limits vs soft limits: hard limits protect the platform but can blind a team mid-incident; soft limits + alerts + showback rely on behaviour change. Use soft first, hard as a backstop.", he: "Limits קשיחים מול רכים: קשיחים מגינים על הפלטפורמה אבל עלולים לעוור צוות באמצע תקלה; רכים עם alerts ו-showback מסתמכים על שינוי התנהגות. קודם רכים, וקשיחים כ-backstop." }
  ],
  followUps: [
    { q: { en: "How does this differ from just 'design a metrics platform' or 'design a logging pipeline'?", he: "במה זה שונה מסתם 'תתכנן metrics platform' או 'תתכנן logging pipeline'?" },
      a: { en: "Those are storage-engine problems. This one is a platform and governance problem: one instrumentation standard, one pipeline as the control point, cross-signal correlation, per-tenant quotas and showback, and a migration of 10,000 services and multiple vendors. The hard parts are cost attribution, behaviour change and reversibility, not the TSDB.", he: "אלה בעיות של storage engine. כאן זו בעיית פלטפורמה ו-governance: סטנדרט instrumentation אחד, pipeline אחד כנקודת שליטה, קורלציה בין signals, quotas ו-showback לכל tenant, ומיגרציה של 10,000 services וכמה ספקים. החלקים הקשים הם ייחוס עלויות, שינוי התנהגות והפיכות — לא ה-TSDB." } },
    { q: { en: "A team says tail sampling hides the one trace they need for a customer complaint. What do you offer?", he: "צוות אומר שה-tail sampling מסתיר בדיוק את ה-trace שהם צריכים לתלונת לקוח. מה מציעים?" },
      a: { en: "Several levers: always-keep policies for specific attributes (VIP tenant, debug header, synthetic tests); temporarily raise sampling for one service via config; and logs with trace_id are kept at a higher rate than traces, so the request can still be reconstructed. Spans metrics stay 100% accurate regardless.", he: "כמה מנופים: policies של always-keep ל-attributes מסוימים (tenant VIP, debug header, בדיקות סינתטיות); העלאה זמנית של ה-sampling ל-service אחד דרך config; ולוגים עם trace_id נשמרים בקצב גבוה יותר מ-traces, כך שעדיין אפשר לשחזר את ה-request. ה-span metrics נשארים מדויקים ב-100% בכל מקרה." } },
    { q: { en: "How do you prove the platform saved money and didn't just move it?", he: "איך מוכיחים שהפלטפורמה חסכה כסף ולא רק הזיזה אותו?" },
      a: { en: "Track unit cost: observability $ per 1M requests (or per vCPU of production compute) monthly, including platform team salaries and backend infra, against the baseline vendor bill. Show volume curves per signal before/after governance. If unit cost falls while coverage (services with traces, SLOs defined) rises, it's real.", he: "עוקבים אחרי unit cost: דולרים של observability לכל 1M requests (או לכל vCPU של compute ב-production) בכל חודש, כולל משכורות צוות הפלטפורמה ותשתית ה-backends, מול חשבון הספק הבסיסי. מראים עקומות נפח לכל signal לפני ואחרי governance. אם ה-unit cost יורד בזמן שהכיסוי (services עם traces, SLOs מוגדרים) עולה — זה אמיתי." } }
  ],
  related: ["obs-metrics", "obs-logs", "obs-traces", "obs-alerting", "k8s-cluster-observability", "cloud-finops", "rel-sli-slo-sla", "staff-platform-engineering"]
});
