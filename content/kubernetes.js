// Kubernetes track
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
var INFRA = window.INFRA; // explicit binding (also works in the validator's sandbox)

// ---------------------------------------------------------------------------
// 1. Architecture
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-architecture",
  track: "kubernetes",
  order: 1,
  icon: "🏗️",
  level: 1,
  minutes: 10,
  title: { en: "Kubernetes Architecture: Control Plane & Nodes", he: "ארכיטקטורת Kubernetes: Control Plane ו-Nodes" },
  tldr: {
    en: "You declare the desired state in YAML; a set of control loops watches the cluster forever and nudges reality toward it.",
    he: "אתה מצהיר על ה-desired state ב-YAML, ואוסף של control loops מסתכל על ה-cluster כל הזמן ודוחף את המציאות לכיוון הזה."
  },
  analogy: {
    en: "Think of a shipping port. The harbor master's office (control plane) holds the official manifest (etcd), a dispatcher decides which dock gets which container (scheduler), and supervisors keep walking around checking that the count matches the manifest (controllers). Each dock has a foreman (kubelet) who actually unloads containers using a crane (container runtime). Nobody shouts orders at cranes directly — you file paperwork with the office and the system makes it so.",
    he: "תחשוב על נמל. משרד מנהל הנמל (control plane) מחזיק את המניפסט הרשמי (etcd), סדרן מחליט איזה רציף מקבל איזה קונטיינר (scheduler), ומפקחים מסתובבים כל הזמן ובודקים שהספירה תואמת למניפסט (controllers). בכל רציף יש מנהל עבודה (kubelet) שבאמת מפעיל את המנוף (container runtime). אף אחד לא צועק פקודות למנופים ישירות – מגישים טופס למשרד, והמערכת דואגת שזה יקרה."
  },
  sections: [
    {
      h: { en: "The big idea: desired state + reconciliation", he: "הרעיון הגדול: desired state ו-reconciliation" },
      body: {
        en: `<p>Kubernetes is not a "run this command" system — it is a <strong>declarative</strong> one. You don't say "start 3 containers"; you say "there <em>should be</em> 3 replicas of this app". That record is stored, and a bunch of <strong>controllers</strong> run an endless loop:</p>
<pre>loop forever:
  desired = read spec from API server
  actual  = observe the world
  if actual != desired: take one step to fix it</pre>
<p>This is the <strong>reconciliation loop</strong>, and it is the single most important concept in Kubernetes. A node dies? The actual count drops to 2, the controller notices, creates a new Pod. Someone runs <code>kubectl delete pod</code> by hand? Same thing — it comes right back. This is why k8s feels "self-healing": it's not magic, it's a thermostat. Every object has a <code>spec</code> (what you want) and a <code>status</code> (what is), and the whole system exists to make them converge.</p>
<blockquote>💡 Real world: "level-triggered, not edge-triggered" — controllers don't rely on catching every event. Even if they miss one, the next loop compares full state and fixes it. That's why k8s survives restarts of its own components.</blockquote>`,
        he: `<p>Kubernetes היא לא מערכת של "תריץ את הפקודה הזאת" – היא מערכת <strong>דקלרטיבית</strong>. אתה לא אומר "תרים 3 קונטיינרים", אתה אומר "<em>צריכים להיות</em> 3 replicas של האפליקציה". הרשומה הזאת נשמרת, וחבורה של <strong>controllers</strong> מריצים לולאה אינסופית:</p>
<pre>loop forever:
  desired = read spec from API server
  actual  = observe the world
  if actual != desired: take one step to fix it</pre>
<p>זה ה-<strong>reconciliation loop</strong>, והוא הקונספט הכי חשוב ב-Kubernetes. Node מת? הספירה יורדת ל-2, ה-controller שם לב ויוצר Pod חדש. מישהו הריץ <code>kubectl delete pod</code> ידנית? אותו דבר – הוא חוזר. בגלל זה k8s מרגיש "self-healing": זה לא קסם, זה תרמוסטט. לכל אובייקט יש <code>spec</code> (מה שאתה רוצה) ו-<code>status</code> (מה שיש), וכל המערכת קיימת כדי שהם יתכנסו.</p>
<blockquote>💡 מהשטח: "level-triggered ולא edge-triggered" – ה-controllers לא תלויים בזה שיתפסו כל event. גם אם פספסו אחד, הלולאה הבאה משווה את כל ה-state ומתקנת. בגלל זה k8s שורד restart של הרכיבים של עצמו.</blockquote>`
      }
    },
    {
      h: { en: "Control plane: the brain", he: "Control plane: המוח" },
      body: {
        en: `<ul>
<li><strong>kube-apiserver</strong> — the front door and the <em>only</em> component that talks to etcd. Every kubectl command, every controller, every kubelet talks REST/JSON to it. It does authentication, authorization (RBAC), admission (validation/mutation), then persists.</li>
<li><strong>etcd</strong> — a distributed key-value store using Raft consensus. It holds the entire cluster state. Run 3 or 5 members (odd numbers, for quorum). Lose etcd without a backup = lose the cluster.</li>
<li><strong>kube-scheduler</strong> — watches for Pods with no <code>nodeName</code>, picks the best node, writes the binding. It does <em>not</em> start anything.</li>
<li><strong>kube-controller-manager</strong> — one binary bundling dozens of controllers: Deployment, ReplicaSet, Node, Job, EndpointSlice, ServiceAccount...</li>
<li><strong>cloud-controller-manager</strong> — talks to AWS/GCP/Azure to create load balancers, attach disks, label nodes with zones.</li>
</ul>
<blockquote>💡 Real world: on EKS/GKE/AKS the control plane is managed and hidden — you pay ~$0.10/hour (EKS) and never SSH into it. You only see the worker nodes.</blockquote>`,
        he: `<ul>
<li><strong>kube-apiserver</strong> – דלת הכניסה והרכיב <em>היחיד</em> שמדבר עם etcd. כל פקודת kubectl, כל controller וכל kubelet מדברים איתו REST/JSON. הוא עושה authentication, authorization (RBAC), admission (ולידציה/מוטציה) ואז שומר.</li>
<li><strong>etcd</strong> – key-value store מבוזר שמשתמש ב-Raft consensus. הוא מחזיק את כל ה-state של ה-cluster. מריצים 3 או 5 members (מספר אי-זוגי, בשביל quorum). איבדת את etcd בלי גיבוי = איבדת את ה-cluster.</li>
<li><strong>kube-scheduler</strong> – מחפש Pods בלי <code>nodeName</code>, בוחר את ה-node הכי מתאים וכותב binding. הוא <em>לא</em> מריץ כלום בעצמו.</li>
<li><strong>kube-controller-manager</strong> – בינארי אחד שמאגד עשרות controllers: Deployment, ReplicaSet, Node, Job, EndpointSlice, ServiceAccount...</li>
<li><strong>cloud-controller-manager</strong> – מדבר עם AWS/GCP/Azure כדי ליצור load balancers, לחבר דיסקים ולתייג nodes לפי zone.</li>
</ul>
<blockquote>💡 מהשטח: ב-EKS/GKE/AKS ה-control plane מנוהל ומוסתר – משלמים בערך $0.10 לשעה (ב-EKS) ואף פעם לא עושים לו SSH. אתה רואה רק את ה-worker nodes.</blockquote>`
      }
    },
    {
      h: { en: "Worker nodes: the muscle", he: "Worker nodes: השרירים" },
      body: {
        en: `<ul>
<li><strong>kubelet</strong> — an agent on every node. It watches the API server for Pods bound to <em>its</em> node, tells the container runtime to start them, runs probes, mounts volumes, and reports status back. If kubelet is down, the node goes <code>NotReady</code> after ~40s.</li>
<li><strong>container runtime</strong> — containerd or CRI-O, spoken to via the CRI (Container Runtime Interface). Docker Engine itself was dropped as a direct runtime in v1.24 (dockershim removal) — your Docker-built images still run fine, they're just OCI images.</li>
<li><strong>kube-proxy</strong> — programs iptables/IPVS rules so that Service virtual IPs route to real Pod IPs. Some CNIs (Cilium with eBPF) replace it entirely.</li>
<li><strong>CNI plugin</strong> — (Calico, Cilium, AWS VPC CNI) gives each Pod its own IP and wires up the network.</li>
</ul>
<p>Note: nodes never talk to each other's kubelets for coordination. Everything flows <em>through</em> the API server — it's a hub-and-spoke design.</p>`,
        he: `<ul>
<li><strong>kubelet</strong> – agent שרץ על כל node. הוא מחפש ב-API server Pods שמשויכים ל-node <em>שלו</em>, מבקש מה-container runtime להרים אותם, מריץ probes, עושה mount ל-volumes ומדווח status חזרה. אם ה-kubelet נופל, ה-node הופך ל-<code>NotReady</code> אחרי כ-40 שניות.</li>
<li><strong>container runtime</strong> – containerd או CRI-O, דרך ה-CRI (Container Runtime Interface). Docker Engine עצמו הוסר כ-runtime ישיר ב-v1.24 (הסרת dockershim) – אבל images שבנית עם Docker עובדים מצוין, הם בסך הכל OCI images.</li>
<li><strong>kube-proxy</strong> – מתכנת חוקי iptables/IPVS כך שה-IP הווירטואלי של Service ינותב ל-IP של Pods אמיתיים. חלק מה-CNIs (Cilium עם eBPF) מחליפים אותו לגמרי.</li>
<li><strong>CNI plugin</strong> – (Calico, Cilium, AWS VPC CNI) נותן לכל Pod כתובת IP משלו ומחבר את הרשת.</li>
</ul>
<p>שים לב: nodes אף פעם לא מדברים ישירות עם ה-kubelet של nodes אחרים כדי להתאם. הכל עובר <em>דרך</em> ה-API server – זה עיצוב hub-and-spoke.</p>`
      }
    },
    {
      h: { en: "What happens on kubectl apply", he: "מה קורה כשמריצים kubectl apply" },
      body: {
        en: `<ol>
<li><code>kubectl apply -f deploy.yaml</code> → HTTP PATCH/POST to the API server.</li>
<li>API server authenticates you, checks RBAC, runs admission webhooks, writes the Deployment to etcd.</li>
<li>The Deployment controller sees a new Deployment → creates a ReplicaSet.</li>
<li>The ReplicaSet controller sees it wants 3 Pods, has 0 → creates 3 Pod objects (with no node yet).</li>
<li>The scheduler sees 3 unscheduled Pods → picks nodes → writes <code>spec.nodeName</code>.</li>
<li>The kubelet on each chosen node sees "a Pod is mine" → pulls the image via containerd, starts containers, runs probes.</li>
<li>kubelet updates the Pod status to <code>Running</code>; the EndpointSlice controller adds the Pod IP behind its Service.</li>
</ol>
<p>Notice: no component calls another directly. They all <strong>watch</strong> the API server and react. That's why each piece can crash and restart independently.</p>
<blockquote>⚠️ Production tip: watch this chain live with <code>kubectl get events -w</code> in one terminal while you apply in another. It's the best 5 minutes of k8s education you'll get.</blockquote>`,
        he: `<ol>
<li><code>kubectl apply -f deploy.yaml</code> → בקשת HTTP PATCH/POST ל-API server.</li>
<li>ה-API server מאמת אותך, בודק RBAC, מריץ admission webhooks וכותב את ה-Deployment ל-etcd.</li>
<li>ה-Deployment controller רואה Deployment חדש → יוצר ReplicaSet.</li>
<li>ה-ReplicaSet controller רואה שצריך 3 Pods ויש 0 → יוצר 3 אובייקטי Pod (עדיין בלי node).</li>
<li>ה-scheduler רואה 3 Pods לא משובצים → בוחר nodes → כותב <code>spec.nodeName</code>.</li>
<li>ה-kubelet בכל node שנבחר רואה "הנה Pod שלי" → מושך image דרך containerd, מרים קונטיינרים ומריץ probes.</li>
<li>ה-kubelet מעדכן את ה-status ל-<code>Running</code>, וה-EndpointSlice controller מוסיף את ה-IP של ה-Pod מאחורי ה-Service.</li>
</ol>
<p>שים לב: אף רכיב לא קורא לרכיב אחר ישירות. כולם עושים <strong>watch</strong> על ה-API server ומגיבים. בגלל זה כל חלק יכול לקרוס ולעלות מחדש באופן עצמאי.</p>
<blockquote>⚠️ טיפ לפרודקשן: תריץ <code>kubectl get events -w</code> בטרמינל אחד ו-apply בטרמינל שני ותראה את כל השרשרת בזמן אמת. אלה 5 הדקות הכי משתלמות של לימוד k8s שתקבל.</blockquote>`
      }
    }
  ],
  diagram: `            +------------------ CONTROL PLANE ------------------+
 kubectl -> | kube-apiserver <-> etcd                            |
            |    ^      ^      ^                                 |
            | scheduler  controller-manager  cloud-controller    |
            +----|-------------------------------------------------+
                 | (watch / update via API only)
     +-----------+------------+------------------------+
     v                        v                        v
 [node-1]                 [node-2]                 [node-3]
 kubelet                  kubelet                  kubelet
 kube-proxy               kube-proxy               kube-proxy
 containerd -> pods       containerd -> pods       containerd -> pods`,
  handsOn: [
    { cmd: "kubectl get nodes -o wide", what: { en: "List nodes with their IPs, OS, kernel and container runtime version.", he: "רשימת nodes עם IP, מערכת הפעלה, kernel וגרסת ה-container runtime." } },
    { cmd: "kubectl get pods -n kube-system", what: { en: "See the system components (coredns, kube-proxy, CNI pods; on self-managed clusters also apiserver, etcd, scheduler).", he: "לראות את רכיבי המערכת (coredns, kube-proxy, CNI; ב-cluster שאתה מנהל לבד גם apiserver, etcd, scheduler)." } },
    { cmd: "kubectl get --raw='/readyz?verbose'", what: { en: "Ask the API server directly about its own health checks, including etcd.", he: "לשאול את ה-API server ישירות על ה-health checks שלו, כולל etcd." } },
    { cmd: "kubectl api-resources | head -30", what: { en: "Every object kind the API server knows about — the 'nouns' of Kubernetes.", he: "כל סוגי האובייקטים שה-API server מכיר – ה'שמות עצם' של Kubernetes." } },
    { cmd: "kubectl get events -A --sort-by=.lastTimestamp -w", what: { en: "Watch controllers and kubelets react live while you apply something.", he: "לצפות ב-controllers וב-kubelets מגיבים בזמן אמת בזמן שאתה עושה apply." } }
  ],
  mnemonic: {
    en: "\"A Smart Captain Every Kay\": API-server (the door), Scheduler (where), Controllers (keep it so), Etcd (the memory), Kubelet (the hands). And the golden rule: everyone talks to the API server, nobody talks to etcd except the API server.",
    he: "\"תעודה, שיבוץ, שליטה, זיכרון, ידיים\": API-server (הדלת), Scheduler (איפה), Controllers (שומרים שיישאר ככה), etcd (הזיכרון), kubelet (הידיים). וחוק הזהב: כולם מדברים עם ה-API server, ורק ה-API server מדבר עם etcd."
  },
  pitfalls: [
    { en: "Thinking the scheduler starts containers. It only writes a node name on the Pod; the kubelet on that node does the actual work.", he: "לחשוב שה-scheduler מריץ קונטיינרים. הוא רק כותב שם של node על ה-Pod; ה-kubelet באותו node עושה את העבודה בפועל." },
    { en: "Running a 2-member etcd 'for HA'. Raft needs a majority; with 2 members, losing one loses quorum — worse than 1. Use 3 or 5.", he: "להריץ etcd עם 2 members 'בשביל HA'. Raft צריך רוב; עם 2, נפילה של אחד מאבדת quorum – גרוע יותר מאחד. תשתמש ב-3 או 5." },
    { en: "Fixing things imperatively (kubectl edit / scale) and forgetting the source of truth in Git. The next deploy reconciles your hotfix right out of existence.", he: "לתקן דברים בצורה אימפרטיבית (kubectl edit / scale) ולשכוח את ה-source of truth ב-Git. ה-deploy הבא יעשה reconcile וימחק לך את ה-hotfix." },
    { en: "Not backing up etcd on self-managed clusters. It is the cluster; everything else can be rebuilt from it.", he: "לא לגבות את etcd ב-cluster שאתה מנהל לבד. הוא ה-cluster; כל השאר אפשר לבנות מחדש ממנו." }
  ],
  interview: [
    {
      q: { en: "Walk me through what happens when you run kubectl apply on a Deployment.", he: "תסביר מה קורה כשמריצים kubectl apply על Deployment." },
      a: { en: "API server authenticates, authorizes (RBAC), runs admission, stores in etcd. Deployment controller creates a ReplicaSet; ReplicaSet controller creates Pods; scheduler assigns nodes; kubelet on each node pulls the image and starts containers via CRI; status flows back up; EndpointSlices get updated. All coordination is via watches on the API server.", he: "ה-API server מאמת, בודק הרשאות (RBAC), מריץ admission ושומר ב-etcd. ה-Deployment controller יוצר ReplicaSet; ה-ReplicaSet controller יוצר Pods; ה-scheduler משבץ ל-nodes; ה-kubelet בכל node מושך image ומרים קונטיינרים דרך CRI; ה-status חוזר למעלה ו-EndpointSlices מתעדכנים. כל התיאום הוא דרך watch על ה-API server." }
    },
    {
      q: { en: "What happens to running Pods if the whole control plane goes down?", he: "מה קורה ל-Pods שרצים אם כל ה-control plane נופל?" },
      a: { en: "They keep running — kubelet and containers don't need the control plane to stay alive, and kube-proxy rules stay in place. But nothing new happens: no scheduling, no self-healing, no scaling, no deploys. If a Pod crashes, kubelet restarts it locally, but a dead node's Pods won't be rescheduled.", he: "הם ממשיכים לרוץ – kubelet והקונטיינרים לא צריכים את ה-control plane כדי לחיות, וחוקי kube-proxy נשארים. אבל שום דבר חדש לא קורה: אין scheduling, אין self-healing, אין scaling ואין deploys. אם Pod קורס, ה-kubelet מרים אותו מקומית, אבל Pods של node שמת לא ישובצו מחדש." }
    }
  ],
  quiz: [
    {
      q: { en: "Which component is the only one that reads and writes etcd directly?", he: "איזה רכיב הוא היחיד שקורא וכותב ל-etcd ישירות?" },
      options: [
        { en: "kube-scheduler", he: "kube-scheduler" },
        { en: "kube-apiserver", he: "kube-apiserver" },
        { en: "kube-controller-manager", he: "kube-controller-manager" },
        { en: "kubelet", he: "kubelet" }
      ],
      answer: 1,
      explain: { en: "Everything else goes through the API server, which handles auth, validation and storage. This keeps etcd consistent and secured.", he: "כל השאר עוברים דרך ה-API server, שמטפל ב-auth, ולידציה ושמירה. זה שומר על etcd עקבי ומאובטח." }
    },
    {
      q: { en: "You delete a Pod owned by a Deployment with 3 replicas. What happens?", he: "מחקת Pod ששייך ל-Deployment עם 3 replicas. מה קורה?" },
      options: [
        { en: "The Deployment scales down to 2 replicas permanently", he: "ה-Deployment יורד ל-2 replicas לתמיד" },
        { en: "The kubelet refuses to delete it", he: "ה-kubelet מסרב למחוק אותו" },
        { en: "The ReplicaSet controller notices 2 != 3 and creates a new Pod", he: "ה-ReplicaSet controller שם לב ש-2 != 3 ויוצר Pod חדש" },
        { en: "The scheduler restarts the same Pod on the same node with the same name", he: "ה-scheduler מרים את אותו Pod על אותו node עם אותו שם" }
      ],
      answer: 2,
      explain: { en: "Reconciliation: desired=3, actual=2, so a brand-new Pod (new name, new IP) is created. That's why deleting a Pod is a common way to 'restart' it.", he: "Reconciliation: desired=3, actual=2, אז נוצר Pod חדש לגמרי (שם חדש, IP חדש). בגלל זה מחיקת Pod היא דרך נפוצה 'לעשות לו restart'." }
    },
    {
      q: { en: "Why should etcd run with 3 members rather than 2?", he: "למה etcd צריך לרוץ עם 3 members ולא 2?" },
      options: [
        { en: "Raft needs a majority; 3 tolerates one failure, 2 tolerates none", he: "Raft צריך רוב; 3 שורד נפילה של אחד, 2 לא שורד אף נפילה" },
        { en: "etcd shards data across exactly 3 members", he: "etcd מחלק את המידע ל-3 shards בדיוק" },
        { en: "Kubernetes refuses to start with an even number", he: "Kubernetes מסרב לעלות עם מספר זוגי" },
        { en: "2 members doubles write latency", he: "2 members מכפילים את ה-latency של כתיבה" }
      ],
      answer: 0,
      explain: { en: "Quorum = floor(n/2)+1. For 2 that's 2, so losing one member halts writes. For 3 it's 2, so one can fail. 5 tolerates two failures.", he: "Quorum = floor(n/2)+1. עבור 2 זה 2, אז נפילה של אחד עוצרת כתיבות. עבור 3 זה 2, אז אחד יכול ליפול. 5 שורד שתי נפילות." }
    }
  ],
  related: ["k8s-pods", "k8s-deployments", "docker-why", "container-internals"]
});

// ---------------------------------------------------------------------------
// 2. Pods
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-pods",
  track: "kubernetes",
  order: 2,
  icon: "📦",
  level: 1,
  minutes: 9,
  title: { en: "Pods: The Smallest Deployable Unit", he: "Pods – היחידה הקטנה ביותר" },
  tldr: {
    en: "A Pod is one or more containers that share a network namespace (one IP, localhost) and volumes, scheduled together, and treated as disposable.",
    he: "Pod הוא קונטיינר אחד או יותר שחולקים network namespace (IP אחד, localhost) ו-volumes, משובצים יחד, ונחשבים חד-פעמיים."
  },
  analogy: {
    en: "A Pod is a shipping container on the dock, and the containers inside it are roommates in one apartment: same address (IP), same kitchen (localhost), shared storage closet (volumes). They move in together and get evicted together. And like a rented apartment, you never renovate it — when something's wrong, you move out and get a fresh one.",
    he: "Pod זה כמו דירה, והקונטיינרים בתוכו הם שותפים: אותה כתובת (IP), אותו מטבח (localhost), אותו מחסן משותף (volumes). הם נכנסים ביחד ומפונים ביחד. וכמו דירה שכורה – אף פעם לא משפצים אותה. אם משהו לא בסדר, עוזבים ולוקחים דירה חדשה."
  },
  sections: [
    {
      h: { en: "What a Pod actually is", he: "מה זה Pod בפועל" },
      body: {
        en: `<p>Kubernetes never schedules a bare container — it schedules a <strong>Pod</strong>. Under the hood, a tiny <em>pause</em> container is created first; it holds the network namespace, and your containers join it. Result: all containers in a Pod share <strong>one IP address</strong> and can talk via <code>localhost</code>. They must not bind the same port.</p>
<pre>apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web
spec:
  containers:
  - name: app
    image: nginx:1.27
    ports:
    - containerPort: 80
    resources:
      requests: { cpu: 100m, memory: 128Mi }
      limits:   { memory: 256Mi }</pre>
<p>Rule of thumb: <strong>one main process per Pod</strong>. Your API and your Postgres do <em>not</em> go in the same Pod — they scale differently and fail differently. You'll almost never write a bare Pod in production; you write a Deployment, which creates Pods for you.</p>`,
        he: `<p>Kubernetes אף פעם לא משבץ קונטיינר בודד – הוא משבץ <strong>Pod</strong>. מתחת למכסה נוצר קודם קונטיינר קטנטן בשם <em>pause</em>, שמחזיק את ה-network namespace, והקונטיינרים שלך מצטרפים אליו. התוצאה: כל הקונטיינרים ב-Pod חולקים <strong>כתובת IP אחת</strong> ויכולים לדבר דרך <code>localhost</code>. אסור להם לתפוס אותו port.</p>
<pre>apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web
spec:
  containers:
  - name: app
    image: nginx:1.27
    ports:
    - containerPort: 80
    resources:
      requests: { cpu: 100m, memory: 128Mi }
      limits:   { memory: 256Mi }</pre>
<p>כלל אצבע: <strong>תהליך ראשי אחד ל-Pod</strong>. ה-API שלך וה-Postgres <em>לא</em> נכנסים לאותו Pod – הם עושים scale אחרת ונופלים אחרת. כמעט אף פעם לא תכתוב Pod "חשוף" בפרודקשן; כותבים Deployment, והוא יוצר את ה-Pods בשבילך.</p>`
      }
    },
    {
      h: { en: "Sidecars and init containers", he: "Sidecars ו-init containers" },
      body: {
        en: `<p>When is multi-container legit? When a helper is <strong>tightly coupled</strong> to the main app's lifecycle:</p>
<ul>
<li><strong>Sidecar</strong> — runs alongside: a log shipper (Fluent Bit) tailing a shared volume, a service-mesh proxy (Envoy in Istio), a config reloader. Since v1.29 there are <em>native sidecars</em>: an init container with <code>restartPolicy: Always</code>, which starts before the app and stops after it.</li>
<li><strong>Init container</strong> — runs <em>to completion</em> before the app starts, one at a time, in order. Great for "wait for DB", run migrations, download a model file, fix volume permissions.</li>
</ul>
<pre>spec:
  initContainers:
  - name: wait-for-db
    image: busybox:1.36
    command: ["sh","-c","until nc -z postgres 5432; do sleep 2; done"]
  containers:
  - name: api
    image: myorg/api:2.4.1</pre>
<blockquote>⚠️ Production tip: if an init container fails, the Pod shows <code>Init:CrashLoopBackOff</code> and the app never starts. Check it with <code>kubectl logs POD -c wait-for-db</code> — the <code>-c</code> flag is the one people forget.</blockquote>`,
        he: `<p>מתי multi-container זה לגיטימי? כשיש helper <strong>שקשור הדוק</strong> למחזור החיים של האפליקציה הראשית:</p>
<ul>
<li><strong>Sidecar</strong> – רץ לצידה: log shipper (Fluent Bit) שקורא מ-volume משותף, proxy של service mesh (Envoy ב-Istio), config reloader. מאז v1.29 יש <em>native sidecars</em>: init container עם <code>restartPolicy: Always</code>, שעולה לפני האפליקציה ויורד אחריה.</li>
<li><strong>Init container</strong> – רץ <em>עד הסוף</em> לפני שהאפליקציה עולה, אחד אחרי השני, לפי הסדר. מצוין ל"חכה ל-DB", להריץ migrations, להוריד קובץ מודל או לתקן הרשאות על volume.</li>
</ul>
<pre>spec:
  initContainers:
  - name: wait-for-db
    image: busybox:1.36
    command: ["sh","-c","until nc -z postgres 5432; do sleep 2; done"]
  containers:
  - name: api
    image: myorg/api:2.4.1</pre>
<blockquote>⚠️ טיפ לפרודקשן: אם init container נכשל, ה-Pod מראה <code>Init:CrashLoopBackOff</code> והאפליקציה אף פעם לא עולה. תבדוק עם <code>kubectl logs POD -c wait-for-db</code> – הדגל <code>-c</code> הוא זה שכולם שוכחים.</blockquote>`
      }
    },
    {
      h: { en: "Pod lifecycle & phases", he: "מחזור החיים של Pod ו-phases" },
      body: {
        en: `<p>A Pod's <code>status.phase</code> is one of:</p>
<table>
<tr><th>Phase</th><th>Meaning</th></tr>
<tr><td>Pending</td><td>Accepted, but not running yet: waiting for scheduling, or pulling images</td></tr>
<tr><td>Running</td><td>Bound to a node, at least one container running</td></tr>
<tr><td>Succeeded</td><td>All containers exited 0 and won't restart (Jobs)</td></tr>
<tr><td>Failed</td><td>All containers terminated, at least one with non-zero exit</td></tr>
<tr><td>Unknown</td><td>Node stopped reporting</td></tr>
</table>
<p>But the <code>STATUS</code> column in <code>kubectl get pods</code> shows more detail — container <em>reasons</em> like <code>CrashLoopBackOff</code>, <code>ImagePullBackOff</code>, <code>OOMKilled</code>, <code>Terminating</code>. Those aren't phases; a CrashLoopBackOff Pod is technically "Running". <code>restartPolicy</code> (Always/OnFailure/Never) tells kubelet what to do when a container exits; restarts back off exponentially 10s, 20s, 40s... capped at 5 minutes.</p>`,
        he: `<p>ה-<code>status.phase</code> של Pod הוא אחד מאלה:</p>
<table>
<tr><th>Phase</th><th>משמעות</th></tr>
<tr><td>Pending</td><td>התקבל אבל עוד לא רץ: מחכה ל-scheduling או מושך images</td></tr>
<tr><td>Running</td><td>משויך ל-node, לפחות קונטיינר אחד רץ</td></tr>
<tr><td>Succeeded</td><td>כל הקונטיינרים יצאו עם 0 ולא יעלו מחדש (Jobs)</td></tr>
<tr><td>Failed</td><td>כל הקונטיינרים הסתיימו, לפחות אחד עם exit code שונה מ-0</td></tr>
<tr><td>Unknown</td><td>ה-node הפסיק לדווח</td></tr>
</table>
<p>אבל עמודת <code>STATUS</code> ב-<code>kubectl get pods</code> מראה יותר פירוט – <em>reasons</em> של קונטיינרים כמו <code>CrashLoopBackOff</code>, <code>ImagePullBackOff</code>, <code>OOMKilled</code>, <code>Terminating</code>. אלה לא phases; Pod ב-CrashLoopBackOff הוא טכנית "Running". ה-<code>restartPolicy</code> (Always/OnFailure/Never) אומר ל-kubelet מה לעשות כשקונטיינר יוצא; ה-restarts עושים backoff אקספוננציאלי 10s, 20s, 40s... עד תקרה של 5 דקות.</p>`
      }
    },
    {
      h: { en: "Pods are cattle, not pets", he: "Pods הם בקר, לא חיות מחמד" },
      body: {
        en: `<p>Pods are <strong>ephemeral</strong>. They get a new name and a new IP every time they're recreated. They die on node drains, on deploys, on evictions, on autoscaler scale-down. So:</p>
<ul>
<li>Never hardcode a Pod IP — use a <strong>Service</strong> (stable virtual IP + DNS).</li>
<li>Never store state on the container filesystem — it's gone on restart. Use a PersistentVolume or an external DB/S3.</li>
<li>Never <code>kubectl exec</code> in and patch a file "just for now". The next Pod won't have it.</li>
<li>Design for <code>SIGTERM</code>: you get 30 seconds (default <code>terminationGracePeriodSeconds</code>) to finish in-flight requests before <code>SIGKILL</code>.</li>
</ul>
<blockquote>💡 Real world: a healthy production cluster replaces hundreds of Pods a day without anyone noticing. If a Pod dying causes an incident, the problem is the design, not the Pod.</blockquote>`,
        he: `<p>Pods הם <strong>ארעיים</strong>. הם מקבלים שם חדש ו-IP חדש בכל פעם שהם נוצרים מחדש. הם מתים ב-drain של node, ב-deploy, ב-eviction, ב-scale-down של ה-autoscaler. לכן:</p>
<ul>
<li>אף פעם לא לעשות hardcode ל-IP של Pod – משתמשים ב-<strong>Service</strong> (IP וירטואלי יציב + DNS).</li>
<li>אף פעם לא לשמור state על ה-filesystem של הקונטיינר – הוא נעלם ב-restart. משתמשים ב-PersistentVolume או ב-DB/S3 חיצוני.</li>
<li>אף פעם לא לעשות <code>kubectl exec</code> ולתקן קובץ "רק לבינתיים". ל-Pod הבא לא יהיה את זה.</li>
<li>לתכנן ל-<code>SIGTERM</code>: יש לך 30 שניות (ברירת המחדל של <code>terminationGracePeriodSeconds</code>) לסיים בקשות באוויר לפני <code>SIGKILL</code>.</li>
</ul>
<blockquote>💡 מהשטח: cluster בריא בפרודקשן מחליף מאות Pods ביום בלי שאף אחד שם לב. אם מוות של Pod גורם ל-incident, הבעיה בתכנון, לא ב-Pod.</blockquote>`
      }
    }
  ],
  diagram: `+----------------- Pod (IP 10.244.1.17) -----------------+
|  [pause]  holds net namespace                          |
|  [app :8080] <--localhost--> [envoy sidecar :15001]    |
|        \\                         /                     |
|         +---- shared volume ----+                      |
+--------------------------------------------------------+
 init: [wait-for-db] -> [migrate] -> then app + sidecar start`,
  handsOn: [
    { cmd: "kubectl run tmp --image=nginx:1.27 --restart=Never", what: { en: "Create a bare Pod quickly (fine for experiments, not production).", he: "ליצור Pod בודד מהר (טוב לניסויים, לא לפרודקשן)." } },
    { cmd: "kubectl get pod tmp -o wide", what: { en: "See which node it landed on and its Pod IP.", he: "לראות על איזה node הוא נחת ומה ה-IP שלו." } },
    { cmd: "kubectl get pod tmp -o jsonpath='{.status.phase}{\"\\n\"}'", what: { en: "Read just the phase field from the status.", he: "לקרוא רק את שדה ה-phase מה-status." } },
    { cmd: "kubectl logs POD -c CONTAINER --previous", what: { en: "Logs of a specific container in a multi-container Pod, from its previous (crashed) run.", he: "לוגים של קונטיינר ספציפי ב-Pod עם כמה קונטיינרים, מההרצה הקודמת (שקרסה)." } },
    { cmd: "kubectl delete pod tmp && kubectl get pods -w", what: { en: "Delete a bare Pod and watch — nothing recreates it, because no controller owns it.", he: "למחוק Pod בודד ולצפות – שום דבר לא יוצר אותו מחדש, כי אין controller שמחזיק בו." } }
  ],
  mnemonic: {
    en: "\"One IP, one fate\": containers in a Pod share an address and live or die together. And \"Pods are cattle\": numbered, replaceable, never named Fluffy.",
    he: "\"IP אחד, גורל אחד\": קונטיינרים ב-Pod חולקים כתובת וחיים או מתים ביחד. ו\"Pods הם בקר\": ממוספרים, ניתנים להחלפה, אף אחד לא קורא להם 'מוצי'."
  },
  pitfalls: [
    { en: "Putting app + database in one Pod. You can't scale the app without cloning the DB, and a DB restart kills your app too.", he: "לשים אפליקציה + DB באותו Pod. אי אפשר לעשות scale לאפליקציה בלי לשכפל את ה-DB, ו-restart ל-DB מפיל גם את האפליקציה." },
    { en: "Writing bare Pods in production. Nothing recreates them when the node dies — always use a Deployment/StatefulSet/Job.", he: "לכתוב Pods בודדים בפרודקשן. שום דבר לא מרים אותם מחדש כשה-node מת – תמיד להשתמש ב-Deployment/StatefulSet/Job." },
    { en: "Two containers in the same Pod both listening on port 8080 — they share a network namespace, so the second one fails with 'address already in use'.", he: "שני קונטיינרים באותו Pod שמאזינים שניהם על 8080 – הם חולקים network namespace, אז השני נופל עם 'address already in use'." },
    { en: "Reading kubectl logs without --previous on a crash-looping container: you get the fresh, empty run instead of the one that crashed.", he: "לקרוא kubectl logs בלי --previous על קונטיינר ב-crash loop: מקבלים את ההרצה החדשה והריקה במקום זו שקרסה." }
  ],
  interview: [
    {
      q: { en: "Why does Kubernetes use Pods instead of scheduling containers directly?", he: "למה Kubernetes משתמש ב-Pods ולא משבץ קונטיינרים ישירות?" },
      a: { en: "Some processes must be co-located and share resources — network namespace, volumes, lifecycle — like an app and its proxy sidecar. The Pod is that atomic co-scheduling unit, and it gives a clean place for a single IP, shared volumes, and init sequencing.", he: "יש תהליכים שחייבים לשבת יחד ולחלוק משאבים – network namespace, volumes, מחזור חיים – כמו אפליקציה וה-proxy sidecar שלה. ה-Pod הוא יחידת השיבוץ האטומית הזאת, ונותן מקום נקי ל-IP אחד, volumes משותפים וסדר init." }
    },
    {
      q: { en: "When would you use an init container vs a sidecar?", he: "מתי תשתמש ב-init container ומתי ב-sidecar?" },
      a: { en: "Init container for one-time setup that must finish before the app starts (migrations, waiting for dependencies, fetching config). Sidecar for something that must run for the app's whole lifetime (proxy, log shipper, secret refresher).", he: "Init container לסטאפ חד-פעמי שחייב להסתיים לפני שהאפליקציה עולה (migrations, המתנה לתלויות, הבאת config). Sidecar למשהו שצריך לרוץ לאורך כל חיי האפליקציה (proxy, log shipper, רענון secrets)." }
    }
  ],
  quiz: [
    {
      q: { en: "Two containers in the same Pod want to talk to each other. What's the simplest way?", he: "שני קונטיינרים באותו Pod רוצים לדבר. מה הדרך הכי פשוטה?" },
      options: [
        { en: "Create a Service between them", he: "ליצור Service ביניהם" },
        { en: "Use the node's IP and a NodePort", he: "להשתמש ב-IP של ה-node וב-NodePort" },
        { en: "localhost, since they share a network namespace", he: "localhost, כי הם חולקים network namespace" },
        { en: "They can't; containers are fully isolated", he: "אי אפשר; קונטיינרים מבודדים לגמרי" }
      ],
      answer: 2,
      explain: { en: "All containers in a Pod share one network namespace, so localhost:PORT works directly.", he: "כל הקונטיינרים ב-Pod חולקים network namespace אחד, אז localhost:PORT עובד ישירות." }
    },
    {
      q: { en: "A Pod shows Init:CrashLoopBackOff. What does that tell you?", he: "Pod מראה Init:CrashLoopBackOff. מה זה אומר?" },
      options: [
        { en: "The main app container keeps crashing", he: "קונטיינר האפליקציה הראשי קורס שוב ושוב" },
        { en: "An init container keeps failing, so the main containers never started", he: "init container נכשל שוב ושוב, אז הקונטיינרים הראשיים אף פעם לא עלו" },
        { en: "The node is initializing", he: "ה-node באמצע אתחול" },
        { en: "The image is still being pulled", he: "ה-image עדיין נמשך" }
      ],
      answer: 1,
      explain: { en: "Init containers must succeed before app containers start. Check its logs with kubectl logs POD -c INIT_NAME.", he: "Init containers חייבים להצליח לפני שהקונטיינרים הראשיים עולים. בודקים את הלוגים עם kubectl logs POD -c INIT_NAME." }
    },
    {
      q: { en: "Where should a Pod that writes user uploads store them?", he: "איפה Pod שכותב העלאות של משתמשים צריך לשמור אותן?" },
      options: [
        { en: "In /tmp inside the container", he: "ב-/tmp בתוך הקונטיינר" },
        { en: "In the container's writable layer, it persists across restarts", he: "ב-writable layer של הקונטיינר, הוא נשמר בין restarts" },
        { en: "In an emptyDir volume, it survives Pod deletion", he: "ב-emptyDir volume, הוא שורד מחיקה של ה-Pod" },
        { en: "In object storage (S3) or a PersistentVolume", he: "ב-object storage (S3) או ב-PersistentVolume" }
      ],
      answer: 3,
      explain: { en: "The container filesystem and emptyDir both die with the Pod. Durable data goes to external storage or a PV.", he: "ה-filesystem של הקונטיינר ו-emptyDir מתים יחד עם ה-Pod. מידע עמיד הולך לאחסון חיצוני או ל-PV." }
    }
  ],
  related: ["k8s-architecture", "k8s-deployments", "k8s-probes", "container-internals"]
});

// ---------------------------------------------------------------------------
// 3. Deployments
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-deployments",
  track: "kubernetes",
  order: 3,
  icon: "🚀",
  level: 1,
  minutes: 10,
  title: { en: "Deployments, ReplicaSets & Rolling Updates", he: "Deployments, ReplicaSets ו-Rolling Updates" },
  tldr: {
    en: "A Deployment manages ReplicaSets, which manage Pods; changing the Pod template triggers a rolling update you can pause, watch and undo.",
    he: "Deployment מנהל ReplicaSets, שמנהלים Pods; שינוי ב-Pod template מפעיל rolling update שאפשר לעצור, לעקוב אחריו ולעשות לו undo."
  },
  analogy: {
    en: "A restaurant chain swapping its menu. The HQ (Deployment) doesn't close every branch at once. It opens one branch with the new menu (maxSurge), waits until customers are happy there (readiness), then closes one old-menu branch (maxUnavailable) — and repeats. If the new menu gives people food poisoning, HQ reopens the old branches: rollout undo. The old recipes are kept in a drawer (old ReplicaSets) exactly for that.",
    he: "רשת מסעדות שמחליפה תפריט. המטה (Deployment) לא סוגר את כל הסניפים בבת אחת. הוא פותח סניף אחד עם התפריט החדש (maxSurge), מחכה שהלקוחות שם מרוצים (readiness), ואז סוגר סניף אחד עם התפריט הישן (maxUnavailable) – וחוזר חלילה. אם התפריט החדש עושה הרעלת קיבה, המטה פותח מחדש את הסניפים הישנים: rollout undo. המתכונים הישנים שמורים במגירה (ReplicaSets ישנים) בדיוק בשביל זה."
  },
  sections: [
    {
      h: { en: "The ownership chain: Deployment → ReplicaSet → Pod", he: "שרשרת הבעלות: Deployment ← ReplicaSet ← Pod" },
      body: {
        en: `<pre>apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  revisionHistoryLimit: 10
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
      - name: api
        image: myorg/api:2.4.1
        ports: [{ containerPort: 8080 }]</pre>
<p>A <strong>ReplicaSet</strong> has one job: keep N Pods matching a selector alive. A <strong>Deployment</strong> sits on top and manages <em>versions</em>: each distinct Pod template gets its own ReplicaSet, named with a hash (<code>api-7d9f8c6b5</code>). Pods are then named <code>api-7d9f8c6b5-x2k4p</code>. You'll see this chain in <code>metadata.ownerReferences</code>. Deleting the Deployment cascades and deletes everything below.</p>
<p>Important: only changes to <code>spec.template</code> (image, env, resources...) create a new revision. Changing <code>replicas</code> just scales the current ReplicaSet.</p>`,
        he: `<pre>apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  revisionHistoryLimit: 10
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
      - name: api
        image: myorg/api:2.4.1
        ports: [{ containerPort: 8080 }]</pre>
<p>ל-<strong>ReplicaSet</strong> יש תפקיד אחד: להחזיק N Pods חיים שתואמים ל-selector. <strong>Deployment</strong> יושב מעליו ומנהל <em>גרסאות</em>: כל Pod template שונה מקבל ReplicaSet משלו, עם hash בשם (<code>api-7d9f8c6b5</code>). ה-Pods נקראים <code>api-7d9f8c6b5-x2k4p</code>. אפשר לראות את השרשרת ב-<code>metadata.ownerReferences</code>. מחיקה של ה-Deployment עושה cascade ומוחקת את כל מה שמתחתיו.</p>
<p>חשוב: רק שינויים ב-<code>spec.template</code> (image, env, resources...) יוצרים revision חדש. שינוי של <code>replicas</code> רק עושה scale ל-ReplicaSet הנוכחי.</p>`
      }
    },
    {
      h: { en: "Rolling updates: maxSurge & maxUnavailable", he: "Rolling updates: maxSurge ו-maxUnavailable" },
      body: {
        en: `<pre>spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # extra Pods allowed above replicas
      maxUnavailable: 25%  # Pods allowed to be missing
  minReadySeconds: 10      # must stay Ready this long to count</pre>
<p>With <code>replicas: 4</code> and the defaults (25%/25%), k8s may run up to 5 Pods and needs at least 3 available. It scales the new ReplicaSet up and the old one down in steps, and <strong>only proceeds when new Pods pass readiness</strong>. Two common profiles:</p>
<ul>
<li><code>maxSurge: 1, maxUnavailable: 0</code> — zero capacity loss, needs spare room for 1 extra Pod. Safest for prod.</li>
<li><code>maxSurge: 0, maxUnavailable: 1</code> — no extra resources, briefly runs at reduced capacity. Good when the cluster is tight.</li>
</ul>
<p>The other strategy, <code>Recreate</code>, kills everything then starts the new version: downtime, but guarantees two versions never run side by side (useful for some DB migrations).</p>
<blockquote>⚠️ Production tip: if a rollout gets stuck (new Pods never become Ready), it stops after <code>progressDeadlineSeconds</code> (600s) and marks the Deployment <code>Progressing=False</code>. Old Pods keep serving — that's why readiness probes are your deploy safety net.</blockquote>`,
        he: `<pre>spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # extra Pods allowed above replicas
      maxUnavailable: 25%  # Pods allowed to be missing
  minReadySeconds: 10      # must stay Ready this long to count</pre>
<p>עם <code>replicas: 4</code> וברירות המחדל (25%/25%), k8s יכול להריץ עד 5 Pods וצריך לפחות 3 זמינים. הוא מגדיל את ה-ReplicaSet החדש ומקטין את הישן בצעדים, <strong>ומתקדם רק כשה-Pods החדשים עוברים readiness</strong>. שני פרופילים נפוצים:</p>
<ul>
<li><code>maxSurge: 1, maxUnavailable: 0</code> – אפס איבוד קיבולת, צריך מקום פנוי ל-Pod אחד נוסף. הכי בטוח לפרודקשן.</li>
<li><code>maxSurge: 0, maxUnavailable: 1</code> – בלי משאבים נוספים, רץ לרגע עם קיבולת מופחתת. טוב כשה-cluster צפוף.</li>
</ul>
<p>האסטרטגיה השנייה, <code>Recreate</code>, הורגת הכל ואז מרימה את הגרסה החדשה: יש downtime, אבל מובטח ששתי גרסאות אף פעם לא רצות במקביל (שימושי לחלק מה-DB migrations).</p>
<blockquote>⚠️ טיפ לפרודקשן: אם rollout נתקע (Pods חדשים אף פעם לא נהיים Ready), הוא נעצר אחרי <code>progressDeadlineSeconds</code> (600 שניות) ומסמן את ה-Deployment כ-<code>Progressing=False</code>. ה-Pods הישנים ממשיכים לשרת – בגלל זה readiness probes הם רשת הביטחון של ה-deploy.</blockquote>`
      }
    },
    {
      h: { en: "Watching, pausing and undoing rollouts", he: "מעקב, עצירה ו-undo ל-rollouts" },
      body: {
        en: `<pre>kubectl set image deploy/api api=myorg/api:2.5.0
kubectl rollout status deploy/api        # blocks until done or failed
kubectl rollout history deploy/api       # list revisions
kubectl rollout undo deploy/api          # back to previous revision
kubectl rollout undo deploy/api --to-revision=3
kubectl rollout restart deploy/api       # new Pods, same spec (rotates config)
kubectl rollout pause deploy/api         # batch several edits, then resume</pre>
<p><code>undo</code> works because the old ReplicaSet is still there, scaled to 0 — k8s just scales it back up. <code>revisionHistoryLimit</code> (default 10) controls how many are kept. Annotate changes with <code>kubernetes.io/change-cause</code> so <code>history</code> shows something better than "&lt;none&gt;".</p>
<blockquote>💡 Real world: in a GitOps setup, <code>rollout undo</code> is an emergency lever only — ArgoCD will soon "fix" it back to what Git says. The real rollback is <code>git revert</code>. Use <code>rollout restart</code> to pick up a changed ConfigMap/Secret consumed as env vars.</blockquote>`,
        he: `<pre>kubectl set image deploy/api api=myorg/api:2.5.0
kubectl rollout status deploy/api        # blocks until done or failed
kubectl rollout history deploy/api       # list revisions
kubectl rollout undo deploy/api          # back to previous revision
kubectl rollout undo deploy/api --to-revision=3
kubectl rollout restart deploy/api       # new Pods, same spec (rotates config)
kubectl rollout pause deploy/api         # batch several edits, then resume</pre>
<p><code>undo</code> עובד כי ה-ReplicaSet הישן עדיין קיים, עם scale של 0 – k8s פשוט מגדיל אותו בחזרה. <code>revisionHistoryLimit</code> (ברירת מחדל 10) קובע כמה נשמרים. כדאי לשים annotation של <code>kubernetes.io/change-cause</code> כדי ש-<code>history</code> יראה משהו יותר מועיל מ-"&lt;none&gt;".</p>
<blockquote>💡 מהשטח: ב-setup של GitOps, <code>rollout undo</code> הוא רק ידית חירום – ArgoCD "יתקן" את זה תוך רגע בחזרה למה שכתוב ב-Git. ה-rollback האמיתי הוא <code>git revert</code>. משתמשים ב-<code>rollout restart</code> כדי שה-Pods יקלטו ConfigMap/Secret שהשתנה ונטען כ-env vars.</blockquote>`
      }
    },
    {
      h: { en: "The other workload controllers", he: "שאר ה-workload controllers" },
      body: {
        en: `<table>
<tr><th>Kind</th><th>Use it for</th></tr>
<tr><td>Deployment</td><td>Stateless apps: APIs, web frontends, workers</td></tr>
<tr><td>StatefulSet</td><td>Stable names + per-Pod disks: databases, Kafka, ZooKeeper</td></tr>
<tr><td>DaemonSet</td><td>Exactly one Pod per node: log agents (Fluent Bit), node-exporter, CNI, kube-proxy</td></tr>
<tr><td>Job</td><td>Run to completion: migrations, batch processing. <code>completions</code>, <code>parallelism</code>, <code>backoffLimit</code></td></tr>
<tr><td>CronJob</td><td>A Job on a schedule: <code>schedule: "0 3 * * *"</code> = daily at 03:00</td></tr>
</table>
<pre>apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-report }
spec:
  schedule: "0 3 * * *"
  timeZone: "Asia/Jerusalem"
  concurrencyPolicy: Forbid      # don't overlap runs
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: report
            image: myorg/report:1.3</pre>
<blockquote>⚠️ Production tip: without <code>timeZone</code>, schedules use the controller's zone (UTC on managed clusters). And make jobs idempotent — a CronJob can occasionally run twice or skip a run.</blockquote>`,
        he: `<table>
<tr><th>Kind</th><th>משתמשים בו ל...</th></tr>
<tr><td>Deployment</td><td>אפליקציות stateless: APIs, פרונטים, workers</td></tr>
<tr><td>StatefulSet</td><td>שמות יציבים + דיסק לכל Pod: מסדי נתונים, Kafka, ZooKeeper</td></tr>
<tr><td>DaemonSet</td><td>בדיוק Pod אחד לכל node: log agents (Fluent Bit), node-exporter, CNI, kube-proxy</td></tr>
<tr><td>Job</td><td>ריצה עד הסוף: migrations, batch processing. <code>completions</code>, <code>parallelism</code>, <code>backoffLimit</code></td></tr>
<tr><td>CronJob</td><td>Job לפי לוח זמנים: <code>schedule: "0 3 * * *"</code> = כל יום ב-03:00</td></tr>
</table>
<pre>apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-report }
spec:
  schedule: "0 3 * * *"
  timeZone: "Asia/Jerusalem"
  concurrencyPolicy: Forbid      # don't overlap runs
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: report
            image: myorg/report:1.3</pre>
<blockquote>⚠️ טיפ לפרודקשן: בלי <code>timeZone</code>, ה-schedule לפי ה-timezone של ה-controller (UTC ב-clusters מנוהלים). ותעשו jobs שהם idempotent – CronJob יכול לפעמים לרוץ פעמיים או לדלג על ריצה.</blockquote>`
      }
    }
  ],
  diagram: `Deployment api (replicas: 3)
 |-- ReplicaSet api-6c4f (v2.4.1)  3 -> 2 -> 1 -> 0   (kept for undo)
 '-- ReplicaSet api-7d9f (v2.5.0)  0 -> 1 -> 2 -> 3
        each step waits for new Pods to be Ready
 maxSurge=1, maxUnavailable=0:
 [old old old] -> [old old old NEW] -> [old old NEW] -> [old old NEW NEW] -> ... -> [NEW NEW NEW]`,
  handsOn: [
    { cmd: "kubectl create deployment api --image=nginx:1.26 --replicas=3", what: { en: "Create a Deployment imperatively for a quick lab.", he: "ליצור Deployment בצורה אימפרטיבית למעבדה מהירה." } },
    { cmd: "kubectl set image deploy/api nginx=nginx:1.27 && kubectl rollout status deploy/api", what: { en: "Trigger a rolling update and watch it progress.", he: "להפעיל rolling update ולעקוב אחרי ההתקדמות." } },
    { cmd: "kubectl get rs -l app=api", what: { en: "See both ReplicaSets: the new one with 3 Pods, the old one scaled to 0.", he: "לראות את שני ה-ReplicaSets: החדש עם 3 Pods, הישן עם 0." } },
    { cmd: "kubectl set image deploy/api nginx=nginx:does-not-exist; kubectl rollout undo deploy/api", what: { en: "Break a rollout on purpose (ImagePullBackOff), notice old Pods still serve, then undo.", he: "לשבור rollout בכוונה (ImagePullBackOff), לראות שה-Pods הישנים עדיין משרתים, ואז undo." } },
    { cmd: "kubectl create job once --image=busybox:1.36 -- echo hello && kubectl logs job/once", what: { en: "Run a one-off Job and read its output.", he: "להריץ Job חד-פעמי ולקרוא את הפלט." } }
  ],
  mnemonic: {
    en: "\"Deployments Remember Pods\": D → RS → P. And for rollouts: \"Surge adds, Unavailable subtracts\" — surge is how many extra you may add, unavailable is how many you may lose.",
    he: "\"מטה, סניף, מלצר\": Deployment ← ReplicaSet ← Pod. ול-rollouts: \"Surge מוסיף, Unavailable מחסיר\" – surge זה כמה מותר להוסיף מעבר, unavailable זה כמה מותר לאבד."
  },
  pitfalls: [
    { en: "Using the :latest tag. The Pod template string doesn't change, so no rollout happens, and different nodes may cache different 'latest' images. Use immutable tags or digests.", he: "להשתמש ב-tag :latest. ה-Pod template לא משתנה, אז אין rollout, ו-nodes שונים יכולים להחזיק 'latest' שונה ב-cache. משתמשים ב-tags קבועים או digests." },
    { en: "No readiness probe: k8s considers a Pod Ready the instant it starts, so a rolling update happily replaces every healthy Pod with broken ones.", he: "אין readiness probe: k8s מחשיב Pod כ-Ready ברגע שהוא עולה, אז rolling update מחליף בשמחה כל Pod בריא ב-Pod שבור." },
    { en: "maxUnavailable: 0 and maxSurge: 0 together — rejected by validation; the rollout could never make progress.", he: "maxUnavailable: 0 ו-maxSurge: 0 ביחד – נדחה בוולידציה; ה-rollout לעולם לא יוכל להתקדם." },
    { en: "Running DB migrations in an init container of a 10-replica Deployment: 10 Pods race to migrate. Use a single Job (or Helm hook) instead.", he: "להריץ DB migrations ב-init container של Deployment עם 10 replicas: 10 Pods מתחרים על ה-migration. עדיף Job אחד (או Helm hook)." }
  ],
  interview: [
    {
      q: { en: "Why do Deployments use ReplicaSets instead of managing Pods directly?", he: "למה Deployments משתמשים ב-ReplicaSets ולא מנהלים Pods ישירות?" },
      a: { en: "Separation of concerns: a ReplicaSet keeps N identical Pods alive; a Deployment handles versioning by owning one ReplicaSet per template revision. A rollout is just scaling one RS up and another down, and a rollback is scaling an old RS back up.", he: "הפרדת אחריות: ReplicaSet מחזיק N Pods זהים חיים; Deployment מטפל בגרסאות ע\"י החזקת ReplicaSet לכל revision של template. Rollout הוא פשוט scale-up ל-RS אחד ו-scale-down לשני, ו-rollback הוא scale-up חזרה ל-RS ישן." }
    },
    {
      q: { en: "How do you achieve a zero-downtime deploy on Kubernetes?", he: "איך משיגים deploy בלי downtime ב-Kubernetes?" },
      a: { en: "RollingUpdate with maxUnavailable: 0 and maxSurge >= 1; a correct readiness probe; graceful shutdown (handle SIGTERM, preStop sleep so endpoints update); a PodDisruptionBudget; and backward-compatible changes since two versions run simultaneously.", he: "RollingUpdate עם maxUnavailable: 0 ו-maxSurge >= 1; readiness probe נכון; graceful shutdown (טיפול ב-SIGTERM, preStop sleep כדי שה-endpoints יתעדכנו); PodDisruptionBudget; ושינויים backward-compatible כי שתי גרסאות רצות במקביל." }
    }
  ],
  quiz: [
    {
      q: { en: "replicas: 10, maxSurge: 2, maxUnavailable: 0. What's the max number of Pods during a rollout?", he: "replicas: 10, maxSurge: 2, maxUnavailable: 0. מה המספר המקסימלי של Pods במהלך rollout?" },
      options: [
        { en: "10", he: "10" },
        { en: "12", he: "12" },
        { en: "20", he: "20" },
        { en: "8", he: "8" }
      ],
      answer: 1,
      explain: { en: "maxSurge allows 2 Pods above the desired 10, and maxUnavailable: 0 means at least 10 stay available. So up to 12 run at once.", he: "maxSurge מאפשר 2 Pods מעל ה-10 הרצויים, ו-maxUnavailable: 0 אומר שלפחות 10 נשארים זמינים. אז עד 12 רצים בבת אחת." }
    },
    {
      q: { en: "You scale a Deployment from 3 to 6 replicas. What happens to ReplicaSets?", he: "הגדלת Deployment מ-3 ל-6 replicas. מה קורה ל-ReplicaSets?" },
      options: [
        { en: "A new ReplicaSet is created with 6 Pods", he: "נוצר ReplicaSet חדש עם 6 Pods" },
        { en: "A new revision appears in rollout history", he: "מופיע revision חדש ב-rollout history" },
        { en: "The current ReplicaSet is scaled to 6; no new revision", he: "ה-ReplicaSet הנוכחי עולה ל-6; אין revision חדש" },
        { en: "All Pods are recreated", he: "כל ה-Pods נוצרים מחדש" }
      ],
      answer: 2,
      explain: { en: "Only Pod template changes create new ReplicaSets/revisions. Scaling just adjusts the current RS.", he: "רק שינויים ב-Pod template יוצרים ReplicaSet/revision חדש. Scaling רק משנה את ה-RS הנוכחי." }
    },
    {
      q: { en: "Which controller fits a log-collection agent that must run on every node?", he: "איזה controller מתאים ל-agent של איסוף לוגים שצריך לרוץ על כל node?" },
      options: [
        { en: "Deployment with replicas = number of nodes", he: "Deployment עם replicas = מספר ה-nodes" },
        { en: "StatefulSet", he: "StatefulSet" },
        { en: "CronJob every minute", he: "CronJob כל דקה" },
        { en: "DaemonSet", he: "DaemonSet" }
      ],
      answer: 3,
      explain: { en: "A DaemonSet guarantees one Pod per (matching) node, including new nodes as they join. A Deployment can put two on one node and none on another.", he: "DaemonSet מבטיח Pod אחד לכל node (מתאים), כולל nodes חדשים שמצטרפים. Deployment יכול לשים שניים על node אחד ואף אחד על אחר." }
    },
    {
      q: { en: "How does kubectl rollout undo work under the hood?", he: "איך kubectl rollout undo עובד מתחת למכסה?" },
      options: [
        { en: "It copies the previous ReplicaSet's template back, and a normal rolling update scales it up", he: "מעתיק בחזרה את ה-template של ה-ReplicaSet הקודם, ו-rolling update רגיל מגדיל אותו" },
        { en: "It restores an etcd snapshot", he: "משחזר snapshot של etcd" },
        { en: "It pulls the previous image from the registry's history", he: "מושך את ה-image הקודם מההיסטוריה של ה-registry" },
        { en: "It reverts the Git commit", he: "עושה revert ל-commit ב-Git" }
      ],
      answer: 0,
      explain: { en: "Old ReplicaSets are kept at 0 replicas (up to revisionHistoryLimit). Undo copies the old template back into the Deployment, which rolls to it.", he: "ReplicaSets ישנים נשמרים עם 0 replicas (עד revisionHistoryLimit). Undo מעתיק את ה-template הישן בחזרה ל-Deployment, שמתגלגל אליו." }
    }
  ],
  related: ["k8s-pods", "k8s-probes", "k8s-helm-gitops", "rel-deployments"]
});

// ---------------------------------------------------------------------------
// 4. Services & Ingress
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-services",
  track: "kubernetes",
  order: 4,
  icon: "🔌",
  level: 1,
  minutes: 12,
  title: { en: "Services, DNS & Ingress", he: "Services, DNS ו-Ingress" },
  tldr: {
    en: "A Service gives a changing set of Pods (picked by labels) one stable IP and DNS name; Ingress/Gateway routes outside HTTP traffic to Services.",
    he: "Service נותן לקבוצה משתנה של Pods (שנבחרים לפי labels) IP ו-DNS יציבים; Ingress/Gateway מנתבים תעבורת HTTP מבחוץ ל-Services."
  },
  analogy: {
    en: "Pods are waiters who keep changing shifts. You don't call a specific waiter's cellphone — you call the restaurant's front desk number (Service), and whoever is on shift and ready picks up. The receptionist at the mall entrance (Ingress) looks at which shop you asked for (host/path) and points you to the right restaurant's front desk.",
    he: "Pods הם מלצרים שכל הזמן מתחלפים במשמרות. אתה לא מתקשר לנייד של מלצר ספציפי – אתה מתקשר למספר של דלפק המסעדה (Service), ומי שבמשמרת ופנוי עונה. הפקיד בכניסה לקניון (Ingress) מסתכל לאיזו חנות ביקשת (host/path) ומפנה אותך לדלפק של המסעדה הנכונה."
  },
  sections: [
    {
      h: { en: "Labels, selectors and endpoints", he: "Labels, selectors ו-endpoints" },
      body: {
        en: `<pre>apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: shop
spec:
  selector:
    app: api            # any Ready Pod with this label
  ports:
  - port: 80            # the Service port clients use
    targetPort: 8080    # the container port</pre>
<p>A Service doesn't point at Pods by name — it uses a <strong>label selector</strong>. The EndpointSlice controller continuously lists Pods that match <em>and are Ready</em>, and keeps an EndpointSlice with their IPs. kube-proxy on every node turns that into iptables/IPVS rules so traffic to the Service IP gets load-balanced (roughly random, per connection) to a Pod.</p>
<p>That's why labels matter so much: a typo in the selector means an empty endpoint list and "connection refused" with no other clue. And it's why readiness controls traffic: a not-Ready Pod is silently removed from endpoints.</p>
<blockquote>⚠️ Production tip: the first debug step for "Service doesn't work" is always <code>kubectl get endpointslices -l kubernetes.io/service-name=api</code>. Empty? Your selector or readiness is wrong, not the network.</blockquote>`,
        he: `<pre>apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: shop
spec:
  selector:
    app: api            # any Ready Pod with this label
  ports:
  - port: 80            # the Service port clients use
    targetPort: 8080    # the container port</pre>
<p>Service לא מצביע על Pods לפי שם – הוא משתמש ב-<strong>label selector</strong>. ה-EndpointSlice controller כל הזמן מחפש Pods שמתאימים <em>וגם Ready</em>, ומחזיק EndpointSlice עם ה-IPs שלהם. kube-proxy בכל node הופך את זה לחוקי iptables/IPVS, כך שתעבורה ל-IP של ה-Service מתחלקת (בערך רנדומלית, לפי connection) ל-Pod.</p>
<p>בגלל זה labels כל כך חשובים: טעות הקלדה ב-selector = רשימת endpoints ריקה ו-"connection refused" בלי שום רמז אחר. ובגלל זה readiness שולט בתעבורה: Pod שלא Ready מוסר בשקט מה-endpoints.</p>
<blockquote>⚠️ טיפ לפרודקשן: צעד הדיבאג הראשון ל-"ה-Service לא עובד" הוא תמיד <code>kubectl get endpointslices -l kubernetes.io/service-name=api</code>. ריק? ה-selector או ה-readiness שלך שבורים, לא הרשת.</blockquote>`
      }
    },
    {
      h: { en: "Service types", he: "סוגי Services" },
      body: {
        en: `<table>
<tr><th>Type</th><th>Reachable from</th><th>Typical use</th></tr>
<tr><td>ClusterIP (default)</td><td>Inside the cluster only</td><td>Service-to-service calls</td></tr>
<tr><td>NodePort</td><td>Every node's IP on a port 30000-32767</td><td>Bare-metal, debugging, behind an external LB</td></tr>
<tr><td>LoadBalancer</td><td>A cloud LB with a public/private IP</td><td>Expose one service (TCP/UDP) directly</td></tr>
<tr><td>Headless (<code>clusterIP: None</code>)</td><td>DNS returns Pod IPs directly</td><td>StatefulSets, client-side LB, gRPC</td></tr>
<tr><td>ExternalName</td><td>DNS CNAME to an outside host</td><td>Alias for an external DB</td></tr>
</table>
<p>They stack: a LoadBalancer Service also gets a NodePort and a ClusterIP. On AWS, a LoadBalancer Service provisions an NLB — roughly $16+/month <em>each</em> before traffic. Ten services × one LB each adds up fast, which is a big reason Ingress exists.</p>
<blockquote>💡 Real world: gRPC and HTTP/2 keep long-lived connections, and ClusterIP balances <em>per connection</em>. Result: one Pod gets all the traffic. Fix with a headless Service + client-side balancing, or a mesh/L7 proxy.</blockquote>`,
        he: `<table>
<tr><th>Type</th><th>נגיש מ...</th><th>שימוש נפוץ</th></tr>
<tr><td>ClusterIP (ברירת מחדל)</td><td>רק מתוך ה-cluster</td><td>קריאות בין services</td></tr>
<tr><td>NodePort</td><td>ה-IP של כל node על port בטווח 30000-32767</td><td>Bare-metal, דיבאג, מאחורי LB חיצוני</td></tr>
<tr><td>LoadBalancer</td><td>LB של הענן עם IP ציבורי/פרטי</td><td>לחשוף service אחד (TCP/UDP) ישירות</td></tr>
<tr><td>Headless (<code>clusterIP: None</code>)</td><td>DNS מחזיר IPs של Pods ישירות</td><td>StatefulSets, client-side LB, gRPC</td></tr>
<tr><td>ExternalName</td><td>DNS CNAME ל-host חיצוני</td><td>alias ל-DB חיצוני</td></tr>
</table>
<p>הם נבנים אחד על השני: Service מסוג LoadBalancer מקבל גם NodePort וגם ClusterIP. ב-AWS, LoadBalancer Service מקים NLB – בערך $16+ לחודש <em>לכל אחד</em> לפני תעבורה. עשרה services × LB לכל אחד מצטבר מהר, וזו סיבה מרכזית לקיום של Ingress.</p>
<blockquote>💡 מהשטח: gRPC ו-HTTP/2 מחזיקים connections ארוכים, ו-ClusterIP מאזן <em>לפי connection</em>. התוצאה: Pod אחד מקבל את כל התעבורה. הפתרון: headless Service + איזון בצד הלקוח, או mesh/L7 proxy.</blockquote>`
      }
    },
    {
      h: { en: "Cluster DNS: service.namespace.svc.cluster.local", he: "DNS של ה-cluster: service.namespace.svc.cluster.local" },
      body: {
        en: `<p>CoreDNS gives every Service a name. For Service <code>api</code> in namespace <code>shop</code>:</p>
<ul>
<li><code>api</code> — works from Pods in the <em>same</em> namespace</li>
<li><code>api.shop</code> — works from any namespace</li>
<li><code>api.shop.svc.cluster.local</code> — the FQDN, works everywhere</li>
</ul>
<p>For a headless Service backing a StatefulSet, each Pod gets its own record: <code>postgres-0.postgres.db.svc.cluster.local</code>.</p>
<p>The magic is in each Pod's <code>/etc/resolv.conf</code>: a <code>search</code> list (<code>shop.svc.cluster.local svc.cluster.local cluster.local</code>) and <code>ndots:5</code>. A name with fewer than 5 dots is tried against every search suffix first — so <code>api.stripe.com</code> can cause several failed lookups before the real one.</p>
<blockquote>⚠️ Production tip: for hot external calls use a trailing dot (<code>api.stripe.com.</code>) or lower <code>ndots</code> via <code>dnsConfig</code>. Teams have cut CoreDNS query load several-fold this way.</blockquote>`,
        he: `<p>CoreDNS נותן שם לכל Service. ל-Service בשם <code>api</code> ב-namespace <code>shop</code>:</p>
<ul>
<li><code>api</code> – עובד מ-Pods באותו namespace</li>
<li><code>api.shop</code> – עובד מכל namespace</li>
<li><code>api.shop.svc.cluster.local</code> – ה-FQDN, עובד מכל מקום</li>
</ul>
<p>ל-headless Service של StatefulSet, כל Pod מקבל רשומה משלו: <code>postgres-0.postgres.db.svc.cluster.local</code>.</p>
<p>הקסם נמצא ב-<code>/etc/resolv.conf</code> של כל Pod: רשימת <code>search</code> (<code>shop.svc.cluster.local svc.cluster.local cluster.local</code>) ו-<code>ndots:5</code>. שם עם פחות מ-5 נקודות ינוסה קודם מול כל search suffix – אז <code>api.stripe.com</code> יכול לגרום לכמה lookups כושלים לפני האמיתי.</p>
<blockquote>⚠️ טיפ לפרודקשן: לקריאות חיצוניות חמות תשתמש בנקודה בסוף (<code>api.stripe.com.</code>) או תוריד את <code>ndots</code> דרך <code>dnsConfig</code>. צוותים הורידו ככה את העומס על CoreDNS פי כמה.</blockquote>`
      }
    },
    {
      h: { en: "Ingress, ingress controllers & Gateway API", he: "Ingress, ingress controllers ו-Gateway API" },
      body: {
        en: `<p>An <strong>Ingress</strong> is L7 routing rules: one entry point, many Services, routed by host and path, with TLS termination.</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
spec:
  ingressClassName: nginx
  tls:
  - hosts: [shop.example.com]
    secretName: shop-tls
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend: { service: { name: api, port: { number: 80 } } }
      - path: /
        pathType: Prefix
        backend: { service: { name: web, port: { number: 80 } } }</pre>
<p>The Ingress object does <strong>nothing</strong> on its own. You need an <strong>ingress controller</strong> — ingress-nginx, Traefik, HAProxy, the AWS Load Balancer Controller (creates an ALB) — that watches Ingresses and configures a real proxy. Pair it with cert-manager for automatic Let's Encrypt certificates.</p>
<p><strong>Gateway API</strong> (GatewayClass → Gateway → HTTPRoute) is the newer, more expressive successor: role separation (platform team owns the Gateway, app teams own routes), header matching, weighted traffic splitting for canaries, and TCP/gRPC routes — without vendor-specific annotations.</p>`,
        he: `<p><strong>Ingress</strong> הוא חוקי ניתוב ב-L7: נקודת כניסה אחת, הרבה Services, ניתוב לפי host ו-path, עם TLS termination.</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
spec:
  ingressClassName: nginx
  tls:
  - hosts: [shop.example.com]
    secretName: shop-tls
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend: { service: { name: api, port: { number: 80 } } }
      - path: /
        pathType: Prefix
        backend: { service: { name: web, port: { number: 80 } } }</pre>
<p>אובייקט Ingress לבד לא עושה <strong>כלום</strong>. צריך <strong>ingress controller</strong> – ingress-nginx, Traefik, HAProxy, AWS Load Balancer Controller (שמקים ALB) – שעוקב אחרי Ingresses ומגדיר proxy אמיתי. משלבים עם cert-manager בשביל תעודות Let's Encrypt אוטומטיות.</p>
<p><strong>Gateway API</strong> (GatewayClass ← Gateway ← HTTPRoute) הוא היורש החדש והעשיר יותר: הפרדת תפקידים (צוות הפלטפורמה מחזיק את ה-Gateway, צוותי האפליקציה את ה-routes), התאמה לפי headers, פיצול תעבורה משוקלל ל-canary, ו-routes ל-TCP/gRPC – בלי annotations ספציפיים לספק.</p>`
      }
    }
  ],
  diagram: `Internet
   |
 [Cloud LB]   (one LB, for the ingress controller's Service type=LoadBalancer)
   |
 [ingress-nginx pods]   host/path rules from Ingress objects
   |-- /api --> Service api (ClusterIP 10.96.12.5) --> EndpointSlice --> pods 10.244.1.7, 10.244.2.9
   '-- /    --> Service web (ClusterIP 10.96.40.2) --> pod 10.244.3.4
 inside the cluster:  curl http://api.shop.svc.cluster.local`,
  handsOn: [
    { cmd: "kubectl expose deploy api --port=80 --target-port=8080", what: { en: "Create a ClusterIP Service for an existing Deployment.", he: "ליצור ClusterIP Service ל-Deployment קיים." } },
    { cmd: "kubectl get endpointslices -l kubernetes.io/service-name=api", what: { en: "Which Pod IPs are actually behind the Service right now.", he: "אילו IPs של Pods באמת יושבים מאחורי ה-Service כרגע." } },
    { cmd: "kubectl run -it --rm dns --image=busybox:1.36 --restart=Never -- nslookup api.shop.svc.cluster.local", what: { en: "Test cluster DNS from a throwaway Pod.", he: "לבדוק את ה-DNS של ה-cluster מ-Pod זמני." } },
    { cmd: "kubectl port-forward svc/api 8080:80", what: { en: "Reach a ClusterIP Service from your laptop without exposing it.", he: "להגיע ל-ClusterIP Service מהלפטופ בלי לחשוף אותו." } },
    { cmd: "kubectl get ingress -A && kubectl get ingressclass", what: { en: "List Ingress rules and which controllers are installed.", he: "לראות את חוקי ה-Ingress ואילו controllers מותקנים." } }
  ],
  mnemonic: {
    en: "\"Labels pick, Endpoints list, Proxy routes, DNS names.\" Types grow outward like rings: ClusterIP ⊂ NodePort ⊂ LoadBalancer. Ingress = one LB, many apps.",
    he: "\"Labels בוחרים, Endpoints מונים, Proxy מנתב, DNS נותן שם.\" הסוגים גדלים כמו טבעות: ClusterIP ⊂ NodePort ⊂ LoadBalancer. Ingress = LB אחד, הרבה אפליקציות."
  },
  pitfalls: [
    { en: "Selector/label mismatch (app: api vs app: api-server). The Service exists, DNS resolves, but endpoints are empty → connection refused.", he: "חוסר התאמה בין selector ל-label (app: api מול app: api-server). ה-Service קיים, ה-DNS עובד, אבל ה-endpoints ריקים ← connection refused." },
    { en: "Confusing port and targetPort: clients use port, Pods listen on targetPort. Swapping them is a classic 'works in docker, fails in k8s'.", he: "לבלבל בין port ל-targetPort: לקוחות משתמשים ב-port, ה-Pods מאזינים על targetPort. להחליף ביניהם זה 'עובד ב-docker, נופל ב-k8s' קלאסי." },
    { en: "Creating an Ingress without an ingress controller installed — the object is accepted and nothing happens. Check ingressClassName.", he: "ליצור Ingress בלי ingress controller מותקן – האובייקט מתקבל ושום דבר לא קורה. תבדוק את ingressClassName." },
    { en: "One LoadBalancer Service per microservice: a pile of cloud LBs and a fat bill. Consolidate behind one ingress/gateway.", he: "LoadBalancer Service לכל microservice: ערימה של LBs בענן וחשבון שמן. לאחד מאחורי ingress/gateway אחד." }
  ],
  interview: [
    {
      q: { en: "How does traffic sent to a ClusterIP actually reach a Pod?", he: "איך תעבורה שנשלחת ל-ClusterIP מגיעה בפועל ל-Pod?" },
      a: { en: "The ClusterIP is virtual — no interface owns it. kube-proxy (or eBPF in Cilium) on every node installs rules that DNAT packets for ClusterIP:port to one of the Ready Pod IPs listed in the EndpointSlices. The CNI then routes the packet to that Pod, possibly on another node.", he: "ה-ClusterIP וירטואלי – אף interface לא מחזיק אותו. kube-proxy (או eBPF ב-Cilium) בכל node מתקין חוקים שעושים DNAT לפקטות של ClusterIP:port לאחד מה-IPs של Pods שהם Ready ב-EndpointSlices. ואז ה-CNI מנתב את הפקטה ל-Pod, אולי על node אחר." }
    },
    {
      q: { en: "Ingress vs LoadBalancer Service — when do you use each?", he: "Ingress מול LoadBalancer Service – מתי כל אחד?" },
      a: { en: "LoadBalancer for L4 (raw TCP/UDP, e.g. a database proxy, MQTT) or a single service. Ingress/Gateway for HTTP(S) when you want many services behind one LB with host/path routing, TLS termination, and cheaper infra.", he: "LoadBalancer ל-L4 (TCP/UDP גולמי, למשל DB proxy או MQTT) או ל-service בודד. Ingress/Gateway ל-HTTP(S) כשרוצים הרבה services מאחורי LB אחד עם ניתוב host/path, TLS termination ותשתית זולה יותר." }
    }
  ],
  quiz: [
    {
      q: { en: "A Pod in namespace 'web' needs Service 'orders' in namespace 'billing'. Which name works?", he: "Pod ב-namespace 'web' צריך את Service 'orders' ב-namespace 'billing'. איזה שם עובד?" },
      options: [
        { en: "orders", he: "orders" },
        { en: "orders.billing", he: "orders.billing" },
        { en: "billing.orders.cluster", he: "billing.orders.cluster" },
        { en: "orders.web.svc.cluster.local", he: "orders.web.svc.cluster.local" }
      ],
      answer: 1,
      explain: { en: "The short name 'orders' only resolves within the same namespace. orders.billing (or the full orders.billing.svc.cluster.local) works across namespaces.", he: "השם הקצר 'orders' עובד רק באותו namespace. orders.billing (או ה-FQDN המלא orders.billing.svc.cluster.local) עובד בין namespaces." }
    },
    {
      q: { en: "A Service resolves in DNS but every request gets 'connection refused'. Its endpoints list is empty. Most likely cause?", he: "Service נפתר ב-DNS אבל כל בקשה מקבלת 'connection refused'. רשימת ה-endpoints ריקה. הסיבה הסבירה?" },
      options: [
        { en: "CoreDNS is down", he: "CoreDNS נפל" },
        { en: "The cloud load balancer isn't provisioned yet", he: "ה-load balancer בענן עוד לא הוקם" },
        { en: "The selector doesn't match Pod labels, or no Pod is Ready", he: "ה-selector לא תואם ל-labels של ה-Pods, או שאין Pod שהוא Ready" },
        { en: "kube-proxy uses IPVS instead of iptables", he: "kube-proxy משתמש ב-IPVS במקום iptables" }
      ],
      answer: 2,
      explain: { en: "Endpoints only include Ready Pods matching the selector. Working DNS rules out CoreDNS; a ClusterIP doesn't need a cloud LB.", he: "Endpoints כוללים רק Pods שהם Ready ותואמים ל-selector. DNS שעובד שולל את CoreDNS; ול-ClusterIP לא צריך LB בענן." }
    },
    {
      q: { en: "You created an Ingress, but nothing routes and kubectl get ingress shows no ADDRESS. What's missing?", he: "יצרת Ingress אבל שום דבר לא מנותב ו-kubectl get ingress לא מראה ADDRESS. מה חסר?" },
      options: [
        { en: "A running ingress controller matching the ingressClassName", he: "ingress controller רץ שתואם ל-ingressClassName" },
        { en: "A NodePort on every backend Service", he: "NodePort על כל Service מאחור" },
        { en: "A headless Service", he: "Headless Service" },
        { en: "A restart of the API server", he: "Restart ל-API server" }
      ],
      answer: 0,
      explain: { en: "Ingress is just config. A controller (ingress-nginx, ALB controller, Traefik...) must watch it and program a real proxy, which then fills in ADDRESS.", he: "Ingress זה רק קונפיגורציה. Controller (ingress-nginx, ALB controller, Traefik...) צריך לעקוב אחריו ולתכנת proxy אמיתי, ורק אז ה-ADDRESS מתמלא." }
    },
    {
      q: { en: "Your gRPC clients all hit one Pod even though the Service has 5 endpoints. Why?", he: "כל לקוחות ה-gRPC פוגעים ב-Pod אחד למרות שיש ל-Service חמישה endpoints. למה?" },
      options: [
        { en: "gRPC doesn't support Kubernetes Services", he: "gRPC לא תומך ב-Kubernetes Services" },
        { en: "The other 4 Pods are failing liveness", he: "4 ה-Pods האחרים נכשלים ב-liveness" },
        { en: "ClusterIP uses DNS round robin, which gets cached", he: "ClusterIP משתמש ב-DNS round robin שנשמר ב-cache" },
        { en: "ClusterIP balances per TCP connection, and gRPC reuses one long-lived HTTP/2 connection", he: "ClusterIP מאזן לפי TCP connection, ו-gRPC משתמש ב-connection אחד ארוך של HTTP/2" }
      ],
      answer: 3,
      explain: { en: "L4 balancing picks a backend once per connection. Use a headless Service + client-side LB, or an L7 proxy/mesh that balances per request.", he: "איזון ב-L4 בוחר backend פעם אחת לכל connection. משתמשים ב-headless Service + LB בצד הלקוח, או ב-L7 proxy/mesh שמאזן לפי בקשה." }
    }
  ],
  related: ["net-load-balancing", "k8s-pods", "k8s-probes", "k8s-namespaces-rbac"]
});

// ---------------------------------------------------------------------------
// 5. ConfigMaps & Secrets
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-config",
  track: "kubernetes",
  order: 5,
  icon: "🔐",
  level: 2,
  minutes: 9,
  title: { en: "ConfigMaps & Secrets", he: "ConfigMaps ו-Secrets" },
  tldr: {
    en: "Keep config out of the image: ConfigMaps for plain settings, Secrets for sensitive ones — and remember Secrets are base64-encoded, not encrypted.",
    he: "מוציאים קונפיגורציה מה-image: ConfigMaps להגדרות רגילות, Secrets לרגישות – וזוכרים ש-Secrets הם base64, לא הצפנה."
  },
  analogy: {
    en: "The same restaurant franchise runs in Tel Aviv and Eilat with an identical kitchen (the image). What changes per branch is the laminated sheet on the wall: opening hours, local supplier phone (ConfigMap) — and the safe code (Secret). Writing the safe code in a different font (base64) doesn't make it secret; you need a real safe (encryption at rest, RBAC, a vault).",
    he: "אותה רשת מסעדות פועלת בתל אביב ובאילת עם מטבח זהה (ה-image). מה שמשתנה בין סניפים זה הדף המנוילן על הקיר: שעות פתיחה, טלפון של ספק מקומי (ConfigMap) – וקוד הכספת (Secret). לכתוב את קוד הכספת בפונט אחר (base64) לא הופך אותו לסודי; צריך כספת אמיתית (encryption at rest, RBAC, vault)."
  },
  sections: [
    {
      h: { en: "ConfigMaps: config that isn't baked in", he: "ConfigMaps: קונפיגורציה שלא אפויה ב-image" },
      body: {
        en: `<p>The 12-factor rule: build the image <strong>once</strong>, promote the same digest through dev → staging → prod, and inject environment-specific config at runtime.</p>
<pre>apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: "info"
  FEATURE_NEW_CHECKOUT: "true"
  app.yaml: |
    cache:
      ttlSeconds: 300
    upstream: http://orders.billing</pre>
<p>Values are always strings (quote your <code>"true"</code> and <code>"8080"</code>). A ConfigMap is capped at <strong>1 MiB</strong> because it lives in etcd — it's for config, not for your 40 MB ML model. Create quickly with <code>kubectl create configmap api-config --from-file=app.yaml --from-literal=LOG_LEVEL=info</code>.</p>
<blockquote>💡 Real world: set <code>immutable: true</code> on ConfigMaps/Secrets that never change. kubelet stops watching them, which noticeably reduces API server load on clusters with thousands of Pods — and nobody can "quickly edit" prod config by accident.</blockquote>`,
        he: `<p>כלל 12-factor: בונים image <strong>פעם אחת</strong>, מקדמים את אותו digest מ-dev ל-staging ל-prod, ומזריקים קונפיגורציה לפי סביבה בזמן ריצה.</p>
<pre>apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: "info"
  FEATURE_NEW_CHECKOUT: "true"
  app.yaml: |
    cache:
      ttlSeconds: 300
    upstream: http://orders.billing</pre>
<p>הערכים תמיד strings (שימו מרכאות על <code>"true"</code> ו-<code>"8080"</code>). ConfigMap מוגבל ל-<strong>1 MiB</strong> כי הוא יושב ב-etcd – הוא לקונפיגורציה, לא למודל ML של 40 MB. יוצרים מהר עם <code>kubectl create configmap api-config --from-file=app.yaml --from-literal=LOG_LEVEL=info</code>.</p>
<blockquote>💡 מהשטח: שימו <code>immutable: true</code> על ConfigMaps/Secrets שלא משתנים. ה-kubelet מפסיק לעשות להם watch, וזה מוריד משמעותית עומס מה-API server ב-clusters עם אלפי Pods – ואף אחד לא "עורך מהר" config של פרודקשן בטעות.</blockquote>`
      }
    },
    {
      h: { en: "Env vars vs mounted files", he: "Env vars מול קבצים ב-mount" },
      body: {
        en: `<pre>spec:
  containers:
  - name: api
    image: myorg/api:2.4.1
    envFrom:
    - configMapRef: { name: api-config }       # every key -> env var
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef: { name: db-creds, key: password }
    volumeMounts:
    - name: cfg
      mountPath: /etc/api                      # app.yaml appears here
      readOnly: true
  volumes:
  - name: cfg
    configMap: { name: api-config }</pre>
<table>
<tr><th></th><th>Env vars</th><th>Mounted volume</th></tr>
<tr><td>Updates when ConfigMap changes</td><td>No — only on Pod restart</td><td>Yes, eventually (~1 min kubelet sync), unless <code>subPath</code></td></tr>
<tr><td>Good for</td><td>Simple flags, 12-factor apps</td><td>Config files, certs, hot reload</td></tr>
<tr><td>Leak risk</td><td>Higher: crash dumps, <code>/proc/PID/environ</code>, child processes</td><td>Lower (tmpfs for Secrets)</td></tr>
</table>
<blockquote>⚠️ Production tip: a common trick to roll Pods on config change is a checksum annotation in the Pod template (Helm: <code>checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}</code>). Change config → hash changes → new rollout.</blockquote>`,
        he: `<pre>spec:
  containers:
  - name: api
    image: myorg/api:2.4.1
    envFrom:
    - configMapRef: { name: api-config }       # every key -> env var
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef: { name: db-creds, key: password }
    volumeMounts:
    - name: cfg
      mountPath: /etc/api                      # app.yaml appears here
      readOnly: true
  volumes:
  - name: cfg
    configMap: { name: api-config }</pre>
<table>
<tr><th></th><th>Env vars</th><th>Volume ב-mount</th></tr>
<tr><td>מתעדכן כשה-ConfigMap משתנה</td><td>לא – רק ב-restart של ה-Pod</td><td>כן, בסוף (כדקה, sync של kubelet), אלא אם יש <code>subPath</code></td></tr>
<tr><td>טוב ל...</td><td>flags פשוטים, אפליקציות 12-factor</td><td>קבצי קונפיג, תעודות, hot reload</td></tr>
<tr><td>סיכון דליפה</td><td>גבוה יותר: crash dumps, <code>/proc/PID/environ</code>, תהליכי בן</td><td>נמוך יותר (tmpfs ל-Secrets)</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: טריק נפוץ לגלגל Pods כשה-config משתנה הוא annotation עם checksum ב-Pod template (ב-Helm: <code>checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}</code>). משנים config ← ה-hash משתנה ← rollout חדש.</blockquote>`
      }
    },
    {
      h: { en: "Secrets: base64 is not encryption!", he: "Secrets: base64 זה לא הצפנה!" },
      body: {
        en: `<pre>apiVersion: v1
kind: Secret
metadata: { name: db-creds }
type: Opaque
data:
  password: c3VwZXJzZWNyZXQ=   # echo -n supersecret | base64
# or use stringData: { password: supersecret } and let k8s encode it</pre>
<p>Anyone can run <code>echo c3VwZXJzZWNyZXQ= | base64 -d</code>. Base64 is there so binary data (certs, keystores) fits in JSON — it's <strong>encoding</strong>, not protection. What actually protects Secrets:</p>
<ul>
<li><strong>Encryption at rest</strong> in etcd (EncryptionConfiguration with a KMS provider; managed clouds offer this as an option — turn it on).</li>
<li><strong>RBAC</strong>: <code>get</code>/<code>list</code> on secrets is effectively "read all passwords". And anyone who can create a Pod in the namespace can mount any Secret there.</li>
<li>Kubelet mounts Secret volumes on <strong>tmpfs</strong> (RAM), never on node disk.</li>
</ul>
<blockquote>⚠️ Production tip: never commit a Secret manifest to Git — base64 in a public repo is a plaintext password in a public repo. Bots scan GitHub for leaked credentials within minutes.</blockquote>`,
        he: `<pre>apiVersion: v1
kind: Secret
metadata: { name: db-creds }
type: Opaque
data:
  password: c3VwZXJzZWNyZXQ=   # echo -n supersecret | base64
# or use stringData: { password: supersecret } and let k8s encode it</pre>
<p>כל אחד יכול להריץ <code>echo c3VwZXJzZWNyZXQ= | base64 -d</code>. Base64 קיים כדי שמידע בינארי (תעודות, keystores) ייכנס ל-JSON – זה <strong>קידוד</strong>, לא הגנה. מה שבאמת מגן על Secrets:</p>
<ul>
<li><strong>Encryption at rest</strong> ב-etcd (EncryptionConfiguration עם KMS provider; בעננים מנוהלים זו אופציה – תדליקו אותה).</li>
<li><strong>RBAC</strong>: הרשאת <code>get</code>/<code>list</code> על secrets היא בפועל "לקרוא את כל הסיסמאות". וכל מי שיכול ליצור Pod ב-namespace יכול לעשות mount לכל Secret שם.</li>
<li>ה-kubelet עושה mount ל-Secret volumes על <strong>tmpfs</strong> (RAM), אף פעם לא על הדיסק של ה-node.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם לא לעשות commit ל-Secret manifest ב-Git – base64 ב-repo ציבורי זו סיסמה גלויה ב-repo ציבורי. בוטים סורקים את GitHub ומוצאים credentials שדלפו תוך דקות.</blockquote>`
      }
    },
    {
      h: { en: "External secrets managers", he: "מנהלי secrets חיצוניים" },
      body: {
        en: `<p>In real production, the source of truth for secrets is a dedicated vault — AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, HashiCorp Vault — with audit logs, rotation and fine-grained IAM. Ways to bridge it into k8s:</p>
<ul>
<li><strong>External Secrets Operator (ESO)</strong>: an <code>ExternalSecret</code> CR says "sync key prod/db/password from AWS into k8s Secret db-creds, refresh every 1h". Git holds only the reference — safe to commit.</li>
<li><strong>Secrets Store CSI Driver</strong>: mounts secrets straight from the vault as files, optionally without creating a k8s Secret at all.</li>
<li><strong>Sealed Secrets</strong> (Bitnami) / <strong>SOPS</strong>: encrypt the Secret with a public key so the ciphertext can live in Git; only the in-cluster controller (or your KMS) can decrypt.</li>
<li><strong>Vault Agent injector</strong>: a sidecar fetches and renews short-lived credentials (e.g. dynamic DB users that expire in 1h).</li>
</ul>
<p>Pair it with workload identity (IRSA / EKS Pod Identity, GKE Workload Identity) so the Pod authenticates to the vault <em>without</em> a static key — the goal is zero long-lived credentials anywhere.</p>`,
        he: `<p>בפרודקשן אמיתי, ה-source of truth ל-secrets הוא vault ייעודי – AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, HashiCorp Vault – עם audit logs, rotation ו-IAM מפורט. דרכים לחבר אותו ל-k8s:</p>
<ul>
<li><strong>External Secrets Operator (ESO)</strong>: CR מסוג <code>ExternalSecret</code> אומר "תסנכרן את prod/db/password מ-AWS ל-Secret בשם db-creds, ותרענן כל שעה". ב-Git יש רק הפניה – בטוח לעשות commit.</li>
<li><strong>Secrets Store CSI Driver</strong>: עושה mount ל-secrets ישירות מה-vault כקבצים, ואפשר אפילו בלי ליצור k8s Secret בכלל.</li>
<li><strong>Sealed Secrets</strong> (Bitnami) / <strong>SOPS</strong>: מצפינים את ה-Secret עם public key כך שה-ciphertext יכול לשבת ב-Git; רק ה-controller בתוך ה-cluster (או ה-KMS שלך) יכול לפענח.</li>
<li><strong>Vault Agent injector</strong>: sidecar שמביא ומחדש credentials קצרי-חיים (למשל משתמשי DB דינמיים שפגים אחרי שעה).</li>
</ul>
<p>משלבים עם workload identity (IRSA / EKS Pod Identity, GKE Workload Identity) כדי שה-Pod יזדהה מול ה-vault <em>בלי</em> מפתח סטטי – המטרה היא אפס credentials ארוכי-טווח בשום מקום.</p>`
      }
    }
  ],
  diagram: `AWS Secrets Manager --(ESO, IRSA)--> Secret db-creds --+
Git: ConfigMap api-config -----(ArgoCD)--------------------+--> Pod
                                       env: DB_PASSWORD  <--+     (restart to pick up)
                                       /etc/api/app.yaml <--+     (auto-refreshes ~1 min)`,
  handsOn: [
    { cmd: "kubectl create secret generic db-creds --from-literal=password=supersecret --dry-run=client -o yaml", what: { en: "Generate a Secret manifest without applying it — see the base64 for yourself.", he: "לייצר Secret manifest בלי להחיל אותו – ולראות את ה-base64 בעיניים." } },
    { cmd: "kubectl get secret db-creds -o jsonpath='{.data.password}' | base64 -d", what: { en: "Decode a Secret — proof that base64 is not encryption (and why RBAC on secrets matters).", he: "לפענח Secret – הוכחה ש-base64 זה לא הצפנה (ולמה RBAC על secrets חשוב)." } },
    { cmd: "kubectl create configmap api-config --from-file=app.yaml --from-literal=LOG_LEVEL=info", what: { en: "Build a ConfigMap from a file and a literal.", he: "לבנות ConfigMap מקובץ ומערך ישיר." } },
    { cmd: "kubectl exec deploy/api -- env | grep LOG_LEVEL", what: { en: "Verify what the running container actually sees.", he: "לוודא מה הקונטיינר שרץ רואה בפועל." } },
    { cmd: "kubectl auth can-i get secrets --as=system:serviceaccount:shop:default -n shop", what: { en: "Check whether a ServiceAccount can read Secrets.", he: "לבדוק אם ServiceAccount יכול לקרוא Secrets." } }
  ],
  mnemonic: {
    en: "\"Base64 is a costume, not a lock.\" And: \"Env is frozen, files flow\" — env vars freeze at Pod start, mounted files update on their own.",
    he: "\"Base64 זו תחפושת, לא מנעול.\" ו: \"Env קפוא, קבצים זורמים\" – env vars קופאים בעליית ה-Pod, קבצים ב-mount מתעדכנים לבד."
  },
  pitfalls: [
    { en: "Expecting env vars to update after editing the ConfigMap. They don't — you need kubectl rollout restart (or a checksum annotation).", he: "לצפות ש-env vars יתעדכנו אחרי עריכת ה-ConfigMap. זה לא קורה – צריך kubectl rollout restart (או checksum annotation)." },
    { en: "Mounting with subPath and expecting live updates. subPath mounts never refresh.", he: "לעשות mount עם subPath ולצפות לעדכונים חיים. mount עם subPath אף פעם לא מתרענן." },
    { en: "Committing base64 Secrets to Git or pasting kubectl get secret -o yaml into a Slack channel.", he: "לעשות commit ל-Secrets ב-base64 ל-Git או להדביק kubectl get secret -o yaml בערוץ Slack." },
    { en: "A Pod referencing a missing ConfigMap/Secret key ends up in CreateContainerConfigError — it won't start at all (unless optional: true).", he: "Pod שמפנה ל-ConfigMap/Secret או key שלא קיים נתקע ב-CreateContainerConfigError – הוא לא יעלה בכלל (אלא אם optional: true)." }
  ],
  interview: [
    {
      q: { en: "Are Kubernetes Secrets secure? What would you do to harden them?", he: "האם Kubernetes Secrets מאובטחים? מה היית עושה כדי להקשיח אותם?" },
      a: { en: "By default they're only base64-encoded and stored in etcd, possibly unencrypted. Harden with: KMS encryption at rest, strict RBAC (no broad get/list on secrets), keep them out of Git (ESO/Sealed Secrets/SOPS), prefer mounted files over env vars, use workload identity and short-lived credentials from a vault, and audit access.", he: "כברירת מחדל הם רק מקודדים ב-base64 ונשמרים ב-etcd, אולי בלי הצפנה. מקשיחים עם: KMS encryption at rest, RBAC הדוק (בלי get/list רחב על secrets), להשאיר אותם מחוץ ל-Git (ESO/Sealed Secrets/SOPS), להעדיף קבצים על פני env vars, workload identity ו-credentials קצרי-חיים מ-vault, ו-audit לגישה." }
    },
    {
      q: { en: "How do you make Pods pick up a changed ConfigMap?", he: "איך גורמים ל-Pods לקלוט ConfigMap שהשתנה?" },
      a: { en: "If consumed as env vars: restart (kubectl rollout restart, or a checksum annotation in the template so changes trigger a rollout). If mounted as a volume without subPath: the file updates within about a minute; the app must watch and reload it (or a reloader sidecar/Reloader controller triggers restarts).", he: "אם נצרך כ-env vars: restart (kubectl rollout restart, או checksum annotation ב-template כדי ששינוי יפעיל rollout). אם עשוי mount כ-volume בלי subPath: הקובץ מתעדכן תוך כדקה; האפליקציה צריכה לעקוב ולטעון מחדש (או sidecar/controller כמו Reloader שמפעיל restarts)." }
    }
  ],
  quiz: [
    {
      q: { en: "A Secret's data field contains cGFzc3dvcmQxMjM=. How protected is this value?", he: "בשדה data של Secret יש cGFzc3dvcmQxMjM=. כמה הערך הזה מוגן?" },
      options: [
        { en: "Encrypted with AES-256 by the API server", he: "מוצפן ב-AES-256 ע\"י ה-API server" },
        { en: "Hashed, so it can't be recovered", he: "עבר hash, אז אי אפשר לשחזר אותו" },
        { en: "Just base64 — anyone who can read it can decode it", he: "סתם base64 – כל מי שיכול לקרוא אותו יכול לפענח" },
        { en: "Protected by the container's TLS certificate", he: "מוגן ע\"י תעודת ה-TLS של הקונטיינר" }
      ],
      answer: 2,
      explain: { en: "base64 decodes to 'password123'. Protection comes from RBAC, encryption at rest and keeping it out of Git.", he: "base64 מתפענח ל-'password123'. ההגנה מגיעה מ-RBAC, encryption at rest והשארה מחוץ ל-Git." }
    },
    {
      q: { en: "You update a ConfigMap used via envFrom. When does the running app see the new value?", he: "עדכנת ConfigMap שנצרך דרך envFrom. מתי האפליקציה שרצה תראה את הערך החדש?" },
      options: [
        { en: "Immediately", he: "מיד" },
        { en: "Within about a minute, when kubelet syncs", he: "תוך כדקה, כשה-kubelet מסנכרן" },
        { en: "Only after the Pod is restarted/recreated", he: "רק אחרי שה-Pod עושה restart/נוצר מחדש" },
        { en: "Never; ConfigMaps are immutable", he: "אף פעם; ConfigMaps הם immutable" }
      ],
      answer: 2,
      explain: { en: "Env vars are set at container start. Mounted files (without subPath) refresh automatically; env vars never do.", he: "Env vars נקבעים בעליית הקונטיינר. קבצים ב-mount (בלי subPath) מתרעננים אוטומטית; env vars אף פעם לא." }
    },
    {
      q: { en: "What's the safest way to keep DB credentials for a GitOps-managed app?", he: "מה הדרך הכי בטוחה לשמור credentials של DB לאפליקציה שמנוהלת ב-GitOps?" },
      options: [
        { en: "Store them in a cloud secrets manager and sync with External Secrets Operator", he: "לשמור אותם ב-secrets manager של הענן ולסנכרן עם External Secrets Operator" },
        { en: "Commit the Secret YAML to a private repo", he: "לעשות commit ל-Secret YAML ב-repo פרטי" },
        { en: "Bake them into the Docker image as env vars", he: "לאפות אותם לתוך ה-Docker image כ-env vars" },
        { en: "Put them in a ConfigMap with a hard-to-guess name", he: "לשים אותם ב-ConfigMap עם שם שקשה לנחש" }
      ],
      answer: 0,
      explain: { en: "Git only holds an ExternalSecret reference; the value lives in a vault with IAM, audit and rotation. The other options all leak plaintext somewhere.", he: "ב-Git יש רק הפניה של ExternalSecret; הערך יושב ב-vault עם IAM, audit ו-rotation. כל האופציות האחרות מדליפות טקסט גלוי איפשהו." }
    }
  ],
  related: ["k8s-namespaces-rbac", "k8s-helm-gitops", "k8s-deployments"]
});

// ---------------------------------------------------------------------------
// 6. Resources
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-resources",
  track: "kubernetes",
  order: 6,
  icon: "⚖️",
  level: 2,
  minutes: 12,
  title: { en: "Requests, Limits, Throttling & OOMKills", he: "Requests, Limits, Throttling ו-OOMKills" },
  tldr: {
    en: "Requests reserve capacity for scheduling; limits cap usage at runtime — exceed the CPU limit and you get throttled, exceed the memory limit and you get killed (exit 137).",
    he: "Requests שומרים קיבולת לצורך scheduling; limits מגבילים שימוש בזמן ריצה – חורגים מ-CPU limit ומקבלים throttling, חורגים מ-memory limit ומקבלים kill (exit 137)."
  },
  analogy: {
    en: "A shared office kitchen. Your request is the reserved seat with your name on it — the office manager (scheduler) only lets you in if there's a free seat. Your limit is the house rule. Hog the coffee machine (CPU) and you're told to wait in line — slow, but you survive. Stuff the fridge (memory) beyond your shelf and the fridge police throw out your lunch, no warning, no appeal.",
    he: "מטבחון משותף במשרד. ה-request שלך הוא כיסא שמור עם השם שלך – מנהל המשרד (scheduler) מכניס אותך רק אם יש כיסא פנוי. ה-limit שלך הוא חוקי הבית. משתלט על מכונת הקפה (CPU)? אומרים לך לחכות בתור – לאט, אבל שורד. ממלא את המקרר (memory) מעבר למדף שלך? משטרת המקרר זורקת לך את האוכל, בלי אזהרה ובלי ערעור."
  },
  sections: [
    {
      h: { en: "Requests vs limits", he: "Requests מול limits" },
      body: {
        en: `<pre>resources:
  requests:
    cpu: 250m        # 0.25 core reserved, used for scheduling
    memory: 256Mi
  limits:
    cpu: "1"         # hard ceiling, enforced by CFS throttling
    memory: 512Mi    # hard ceiling, enforced by the OOM killer</pre>
<ul>
<li><strong>Requests</strong> are a <em>scheduling</em> promise. The scheduler adds up the requests of all Pods on a node and only places a Pod if <code>sum(requests) + new &lt;= allocatable</code>. Actual usage doesn't matter to the scheduler. Requests also set CPU <em>weight</em> under contention.</li>
<li><strong>Limits</strong> are <em>runtime</em> enforcement via Linux cgroups. Nothing stops you from using more than your request if the node has spare capacity — limits are the only ceiling.</li>
</ul>
<p>Units: <code>1000m</code> = 1 CPU core (vCPU). Memory uses <code>Mi</code>/<code>Gi</code> (powers of 2): <code>512Mi</code> ≈ 537 MB. Careful: <code>512M</code> is decimal and <code>512m</code> is 0.512 <em>bytes</em> — a real and hilarious typo.</p>`,
        he: `<pre>resources:
  requests:
    cpu: 250m        # 0.25 core reserved, used for scheduling
    memory: 256Mi
  limits:
    cpu: "1"         # hard ceiling, enforced by CFS throttling
    memory: 512Mi    # hard ceiling, enforced by the OOM killer</pre>
<ul>
<li><strong>Requests</strong> הם הבטחה לצורך <em>scheduling</em>. ה-scheduler סוכם את ה-requests של כל ה-Pods על node ומשבץ Pod רק אם <code>sum(requests) + new &lt;= allocatable</code>. השימוש בפועל לא מעניין את ה-scheduler. Requests גם קובעים <em>משקל</em> CPU כשיש תחרות.</li>
<li><strong>Limits</strong> הם אכיפה ב<em>זמן ריצה</em> דרך cgroups של לינוקס. שום דבר לא מונע ממך להשתמש ביותר מה-request אם יש מקום פנוי ב-node – limits הם התקרה היחידה.</li>
</ul>
<p>יחידות: <code>1000m</code> = core אחד (vCPU). זיכרון ב-<code>Mi</code>/<code>Gi</code> (חזקות של 2): <code>512Mi</code> ≈ 537 MB. זהירות: <code>512M</code> זה עשרוני ו-<code>512m</code> זה 0.512 <em>בתים</em> – טעות הקלדה אמיתית ומצחיקה מאוד (בדיעבד).</p>`
      }
    },
    {
      h: { en: "CPU is compressible: throttling (CFS)", he: "CPU הוא דחיס: throttling (CFS)" },
      body: {
        en: `<p>The CPU limit is enforced by the Linux CFS bandwidth controller in <strong>100ms periods</strong>. <code>limits.cpu: 500m</code> = 50ms of CPU time per 100ms period, <em>summed across all threads</em>. Use it up in the first 20ms (say, 4 threads doing GC) and your process is frozen for the remaining 80ms. Nothing crashes — your p99 latency just mysteriously explodes while average CPU usage looks like a calm 30%.</p>
<p>Detect it with the cAdvisor metrics:</p>
<pre>rate(container_cpu_cfs_throttled_periods_total[5m])
  / rate(container_cpu_cfs_periods_total[5m])   # > 0.25 = trouble</pre>
<blockquote>💡 Real world: many teams (and Kubernetes maintainers' own advice) set <strong>CPU requests but no CPU limits</strong> for latency-sensitive services: requests guarantee a fair share under contention, and idle CPU is free to burst into. Keep memory limits though — memory is not compressible.</blockquote>
<p>Also note: runtimes like the JVM, Go (<code>GOMAXPROCS</code>) and Node's thread pool may size themselves by the <em>node's</em> core count, not your limit. A Go app seeing 64 cores with a 1-core limit is a throttling machine. Use <code>automaxprocs</code> or set it explicitly.</p>`,
        he: `<p>ה-CPU limit נאכף ע"י ה-CFS bandwidth controller של לינוקס ב-<strong>periods של 100ms</strong>. <code>limits.cpu: 500m</code> = 50ms זמן CPU לכל 100ms, <em>מסוכם על כל ה-threads</em>. גמרת אותם ב-20ms הראשונים (נגיד, 4 threads שעושים GC)? התהליך קפוא ל-80ms הנותרים. שום דבר לא קורס – ה-p99 latency פשוט מתפוצץ באופן מסתורי, בזמן שממוצע ה-CPU נראה רגוע על 30%.</p>
<p>מזהים את זה עם המטריקות של cAdvisor:</p>
<pre>rate(container_cpu_cfs_throttled_periods_total[5m])
  / rate(container_cpu_cfs_periods_total[5m])   # > 0.25 = trouble</pre>
<blockquote>💡 מהשטח: הרבה צוותים (וגם המלצה של maintainers של Kubernetes) שמים <strong>CPU requests בלי CPU limits</strong> ל-services רגישים ל-latency: ה-requests מבטיחים חלק הוגן כשיש תחרות, ו-CPU פנוי זמין ל-burst. אבל memory limits משאירים – זיכרון לא דחיס.</blockquote>
<p>שימו לב גם: runtimes כמו JVM, Go (<code>GOMAXPROCS</code>) וה-thread pool של Node עשויים לקבוע את הגודל שלהם לפי מספר ה-cores של ה-<em>node</em>, לא לפי ה-limit. אפליקציית Go שרואה 64 cores עם limit של core אחד היא מכונת throttling. משתמשים ב-<code>automaxprocs</code> או מגדירים במפורש.</p>`
      }
    },
    {
      h: { en: "Memory is not: OOMKilled, exit 137", he: "זיכרון לא דחיס: OOMKilled, exit 137" },
      body: {
        en: `<p>You can't "slow down" memory. When a container's cgroup exceeds <code>limits.memory</code>, the kernel OOM killer sends <code>SIGKILL</code>. Exit code = 128 + 9 = <strong>137</strong>, reason <code>OOMKilled</code>. No graceful shutdown, no last log line — often the logs just stop mid-sentence.</p>
<pre>$ kubectl describe pod api-7d9f-x2k4p
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
    Restart Count:  6</pre>
<p>A separate case: the <strong>node</strong> runs low on memory (because Pods use more than they requested). Then kubelet <strong>evicts</strong> Pods (status <code>Evicted</code>), picking those most over their requests first — BestEffort, then Burstable.</p>
<blockquote>⚠️ Production tip: the JVM ignored container limits before Java 10 (8u191 backport). Even today, set <code>-XX:MaxRAMPercentage=75</code> — heap isn't the only memory (metaspace, threads, direct buffers, off-heap). Same idea for Node: <code>--max-old-space-size</code> below the limit.</blockquote>`,
        he: `<p>אי אפשר "להאט" זיכרון. כשה-cgroup של קונטיינר חורג מ-<code>limits.memory</code>, ה-OOM killer של ה-kernel שולח <code>SIGKILL</code>. Exit code = 128 + 9 = <strong>137</strong>, reason <code>OOMKilled</code>. אין graceful shutdown, אין שורת לוג אחרונה – הרבה פעמים הלוגים פשוט נקטעים באמצע משפט.</p>
<pre>$ kubectl describe pod api-7d9f-x2k4p
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
    Restart Count:  6</pre>
<p>מקרה נפרד: ל-<strong>node</strong> נגמר הזיכרון (כי Pods משתמשים ביותר ממה שביקשו). אז ה-kubelet עושה <strong>evict</strong> ל-Pods (status <code>Evicted</code>), ומתחיל באלה שהכי חורגים מה-requests שלהם – קודם BestEffort, אחר כך Burstable.</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-JVM התעלם מ-limits של קונטיינרים לפני Java 10 (backport ל-8u191). גם היום, תגדירו <code>-XX:MaxRAMPercentage=75</code> – ה-heap הוא לא הזיכרון היחיד (metaspace, threads, direct buffers, off-heap). אותו רעיון ב-Node: <code>--max-old-space-size</code> מתחת ל-limit.</blockquote>`
      }
    },
    {
      h: { en: "QoS classes, LimitRange & ResourceQuota", he: "QoS classes, LimitRange ו-ResourceQuota" },
      body: {
        en: `<table>
<tr><th>QoS class</th><th>Rule</th><th>Eviction order</th></tr>
<tr><td>Guaranteed</td><td>Every container: requests == limits for CPU and memory</td><td>Last</td></tr>
<tr><td>Burstable</td><td>At least one request or limit set, not Guaranteed</td><td>Middle</td></tr>
<tr><td>BestEffort</td><td>No requests or limits at all</td><td>First to go</td></tr>
</table>
<p>Platform teams set guardrails per namespace:</p>
<pre>apiVersion: v1
kind: LimitRange           # defaults + min/max per container
metadata: { name: defaults, namespace: shop }
spec:
  limits:
  - type: Container
    defaultRequest: { cpu: 100m, memory: 128Mi }
    default:        { memory: 512Mi }
    max:            { memory: 4Gi }
---
apiVersion: v1
kind: ResourceQuota        # total budget for the namespace
metadata: { name: shop-quota, namespace: shop }
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 64Gi
    pods: "200"</pre>
<p><strong>Right-sizing</strong>: set requests near the p90-p95 of real usage over a week (from Prometheus or VPA in recommend mode), memory limit ~1.2-1.5× peak. Over-requesting wastes money (the cluster looks "full" at 20% real usage); under-requesting causes noisy neighbors and evictions.</p>`,
        he: `<table>
<tr><th>QoS class</th><th>חוק</th><th>סדר eviction</th></tr>
<tr><td>Guaranteed</td><td>בכל קונטיינר: requests == limits ל-CPU ולזיכרון</td><td>אחרון</td></tr>
<tr><td>Burstable</td><td>לפחות request או limit אחד, אבל לא Guaranteed</td><td>באמצע</td></tr>
<tr><td>BestEffort</td><td>בלי requests ובלי limits בכלל</td><td>הראשון לעוף</td></tr>
</table>
<p>צוותי פלטפורמה שמים מעקות בטיחות לכל namespace:</p>
<pre>apiVersion: v1
kind: LimitRange           # defaults + min/max per container
metadata: { name: defaults, namespace: shop }
spec:
  limits:
  - type: Container
    defaultRequest: { cpu: 100m, memory: 128Mi }
    default:        { memory: 512Mi }
    max:            { memory: 4Gi }
---
apiVersion: v1
kind: ResourceQuota        # total budget for the namespace
metadata: { name: shop-quota, namespace: shop }
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 64Gi
    pods: "200"</pre>
<p><strong>Right-sizing</strong>: לשים requests סביב p90-p95 של השימוש האמיתי לאורך שבוע (מ-Prometheus או VPA במצב recommend), ו-memory limit בערך פי 1.2-1.5 מהשיא. Over-request שורף כסף (ה-cluster נראה "מלא" ב-20% שימוש אמיתי); under-request גורם ל-noisy neighbors ול-evictions.</p>`
      }
    }
  ],
  diagram: `Node allocatable: 4 CPU / 16Gi
 scheduler sees REQUESTS only:
 [api 0.5/1Gi][api 0.5/1Gi][worker 1/4Gi][redis 1/6Gi] = 3 CPU / 12Gi  -> 1 CPU / 4Gi left
 runtime enforces LIMITS:
   CPU over limit  -> throttled (wait for next 100ms period)   slow, alive
   MEM over limit  -> OOMKilled, exit 137                       dead, restarted`,
  handsOn: [
    { cmd: "kubectl top pods --containers -n shop", what: { en: "Real CPU/memory usage per container (needs metrics-server). Compare with requests.", he: "שימוש אמיתי ב-CPU/זיכרון לכל קונטיינר (צריך metrics-server). להשוות ל-requests." } },
    { cmd: "kubectl describe node NODE | grep -A8 'Allocated resources'", what: { en: "How much of a node is reserved by requests and limits (can be over 100% for limits).", he: "כמה מה-node שמור ע\"י requests ו-limits (ב-limits יכול לעבור 100%)." } },
    { cmd: "kubectl get pod POD -o jsonpath='{.status.qosClass}'", what: { en: "See which QoS class a Pod landed in.", he: "לראות לאיזה QoS class ה-Pod נכנס." } },
    { cmd: "kubectl get pods -A -o json | jq -r '.items[] | select(.status.containerStatuses[]?.lastState.terminated.reason==\"OOMKilled\") | .metadata.name'", what: { en: "Find every Pod whose last termination was an OOMKill.", he: "למצוא כל Pod שהסיום האחרון שלו היה OOMKill." } },
    { cmd: "kubectl run hog --image=polinux/stress --restart=Never --overrides='{\"spec\":{\"containers\":[{\"name\":\"hog\",\"image\":\"polinux/stress\",\"command\":[\"stress\",\"--vm\",\"1\",\"--vm-bytes\",\"200M\"],\"resources\":{\"limits\":{\"memory\":\"100Mi\"}}}]}}' && kubectl get pod hog -w", what: { en: "Deliberately trigger an OOMKill in a lab cluster (200M allocation vs a 100Mi limit), then inspect it with kubectl describe pod hog.", he: "לגרום בכוונה ל-OOMKill ב-cluster מעבדה (הקצאה של 200M מול limit של 100Mi), ואז לבדוק עם kubectl describe pod hog." } }
  ],
  mnemonic: {
    en: "\"Requests get you IN, limits keep you DOWN.\" And: \"CPU chokes, memory croaks\" — over CPU you get throttled, over memory you get 137.",
    he: "\"Requests מכניסים אותך, limits עוצרים אותך.\" ו: \"CPU נחנק, זיכרון נטבח\" – מעל CPU מקבלים throttling, מעל זיכרון מקבלים 137."
  },
  pitfalls: [
    { en: "No requests at all (BestEffort): the scheduler packs Pods blindly, and they're the first evicted under pressure.", he: "בלי requests בכלל (BestEffort): ה-scheduler דוחס Pods בעיוורון, והם הראשונים שמפונים בלחץ." },
    { en: "Tight CPU limits on latency-sensitive services: p99 spikes from CFS throttling while dashboards show low average CPU.", he: "CPU limits הדוקים על services רגישים ל-latency: קפיצות ב-p99 מ-CFS throttling בזמן שה-dashboards מראים ממוצע CPU נמוך." },
    { en: "Memory limit equal to the JVM -Xmx: non-heap memory pushes the container over and it gets OOMKilled.", he: "Memory limit ששווה ל-Xmx של ה-JVM: זיכרון שהוא לא heap דוחף את הקונטיינר מעל ומקבלים OOMKill." },
    { en: "Writing 512m instead of 512Mi for memory — that's half a byte; the Pod can't even start.", he: "לכתוב 512m במקום 512Mi לזיכרון – זה חצי בית; ה-Pod לא יכול אפילו לעלות." }
  ],
  interview: [
    {
      q: { en: "What's the difference between exceeding the CPU limit and exceeding the memory limit?", he: "מה ההבדל בין חריגה מ-CPU limit לחריגה מ-memory limit?" },
      a: { en: "CPU is compressible: CFS throttles the container, it just runs slower (watch throttled periods and latency). Memory is incompressible: the kernel OOM killer SIGKILLs the process, exit code 137, reason OOMKilled, and kubelet restarts it.", he: "CPU דחיס: CFS עושה throttling לקונטיינר והוא פשוט רץ לאט יותר (לעקוב אחרי throttled periods ו-latency). זיכרון לא דחיס: ה-OOM killer של ה-kernel שולח SIGKILL, exit code 137, reason OOMKilled, וה-kubelet מרים מחדש." }
    },
    {
      q: { en: "A node shows 95% of CPU requested but only 15% actually used. What's going on and what do you do?", he: "Node מראה 95% CPU ב-requests אבל רק 15% בשימוש בפועל. מה קורה ומה עושים?" },
      a: { en: "Over-requesting: the scheduler can't place more Pods even though the hardware is idle, so you pay for empty nodes. Right-size requests using historical p95 usage (Prometheus, VPA recommendations, tools like Goldilocks/Kubecost), then let the Cluster Autoscaler/Karpenter consolidate.", he: "Over-request: ה-scheduler לא יכול לשבץ עוד Pods למרות שהחומרה פנויה, ומשלמים על nodes ריקים. עושים right-sizing ל-requests לפי p95 היסטורי (Prometheus, המלצות VPA, כלים כמו Goldilocks/Kubecost), ונותנים ל-Cluster Autoscaler/Karpenter לאחד." }
    }
  ],
  quiz: [
    {
      q: { en: "A container restarts repeatedly with exit code 137 and reason OOMKilled. What's the cause?", he: "קונטיינר עושה restart שוב ושוב עם exit code 137 ו-reason OOMKilled. מה הסיבה?" },
      options: [
        { en: "It exceeded its CPU limit", he: "הוא חרג מה-CPU limit" },
        { en: "Its liveness probe failed", he: "ה-liveness probe נכשל" },
        { en: "It exceeded its memory limit and the kernel killed it", he: "הוא חרג מה-memory limit וה-kernel הרג אותו" },
        { en: "The image is missing an entrypoint", he: "ל-image חסר entrypoint" }
      ],
      answer: 2,
      explain: { en: "137 = 128 + SIGKILL(9). With reason OOMKilled it's the memory cgroup limit. CPU overuse only throttles; a failed liveness probe shows as a kill but not 'OOMKilled'.", he: "137 = 128 + SIGKILL(9). עם reason OOMKilled זה ה-memory limit של ה-cgroup. חריגת CPU רק עושה throttling; liveness שנכשל נראה כמו kill אבל לא 'OOMKilled'." }
    },
    {
      q: { en: "What does the scheduler use to decide if a Pod fits on a node?", he: "במה ה-scheduler משתמש כדי להחליט אם Pod נכנס ל-node?" },
      options: [
        { en: "The Pod's limits vs the node's current usage", he: "ה-limits של ה-Pod מול השימוש הנוכחי של ה-node" },
        { en: "The Pod's requests vs the node's allocatable minus other Pods' requests", he: "ה-requests של ה-Pod מול ה-allocatable של ה-node פחות ה-requests של Pods אחרים" },
        { en: "Live CPU usage from metrics-server", he: "שימוש CPU חי מ-metrics-server" },
        { en: "The image size", he: "גודל ה-image" }
      ],
      answer: 1,
      explain: { en: "Scheduling is pure bookkeeping on requests. A node can be 'full' while nearly idle, or overloaded while 'half empty'.", he: "Scheduling הוא הנהלת חשבונות טהורה על requests. Node יכול להיות 'מלא' כשהוא כמעט לא עושה כלום, או עמוס כשהוא 'חצי ריק'." }
    },
    {
      q: { en: "A Pod has requests cpu=500m, memory=1Gi and limits cpu=500m, memory=1Gi on its only container. QoS class?", he: "ל-Pod יש requests של cpu=500m, memory=1Gi ו-limits של cpu=500m, memory=1Gi על הקונטיינר היחיד. QoS class?" },
      options: [
        { en: "Guaranteed", he: "Guaranteed" },
        { en: "Burstable", he: "Burstable" },
        { en: "BestEffort", he: "BestEffort" },
        { en: "Critical", he: "Critical" }
      ],
      answer: 0,
      explain: { en: "requests == limits for both CPU and memory in every container → Guaranteed, last to be evicted. 'Critical' isn't a QoS class (that's PriorityClass territory).", he: "requests == limits גם ל-CPU וגם לזיכרון בכל קונטיינר ← Guaranteed, אחרון ל-eviction. 'Critical' זה לא QoS class (זה תחום של PriorityClass)." }
    },
    {
      q: { en: "Latency p99 jumps but average CPU is 30% of the limit. Most likely culprit?", he: "ה-p99 latency קופץ אבל ממוצע ה-CPU הוא 30% מה-limit. החשוד המרכזי?" },
      options: [
        { en: "Memory leak", he: "דליפת זיכרון" },
        { en: "Too many replicas", he: "יותר מדי replicas" },
        { en: "DNS ndots setting", he: "הגדרת ndots של DNS" },
        { en: "CFS throttling from bursty multi-threaded work hitting the CPU limit within each 100ms period", he: "CFS throttling בגלל עבודה מרובת threads ב-bursts שפוגעת ב-CPU limit בתוך כל period של 100ms" }
      ],
      answer: 3,
      explain: { en: "Averages hide bursts. Check container_cpu_cfs_throttled_periods_total; consider raising or removing the CPU limit and fixing GOMAXPROCS/thread counts.", he: "ממוצעים מסתירים bursts. תבדקו את container_cpu_cfs_throttled_periods_total; שקלו להעלות או להסיר את ה-CPU limit ולתקן GOMAXPROCS/מספר threads." }
    }
  ],
  playground: "resources",
  related: ["cpu", "memory", "k8s-scheduling", "k8s-autoscaling", "k8s-debugging"]
});

// ---------------------------------------------------------------------------
// 7. Scheduling
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-scheduling",
  track: "kubernetes",
  order: 7,
  icon: "🧩",
  level: 2,
  minutes: 12,
  title: { en: "Scheduling: How Pods Land on Nodes", he: "Scheduling: איך Pods נוחתים על Nodes" },
  tldr: {
    en: "The scheduler filters out nodes that can't run the Pod, scores the rest, and binds to the winner; you steer it with selectors, affinity, taints/tolerations and topology spread.",
    he: "ה-scheduler מסנן nodes שלא יכולים להריץ את ה-Pod, נותן ציון לשאר, ומשבץ למנצח; מכוונים אותו עם selectors, affinity, taints/tolerations ו-topology spread."
  },
  analogy: {
    en: "The port dispatcher assigning containers to docks. First the hard rules: this dock has no refrigeration, that dock is reserved for hazardous cargo only (taints), this crane can't lift 40 tons (resources) — crossed out. Then preferences among the rest: keep cargo from the same shipper on different docks so one fire doesn't burn everything (anti-affinity / topology spread), prefer the emptier docks (scoring). If no dock passes the hard rules, the container waits on the ship: Pending.",
    he: "הסדרן בנמל שמשבץ קונטיינרים לרציפים. קודם החוקים הקשיחים: לרציף הזה אין קירור, הרציף ההוא שמור רק לחומרים מסוכנים (taints), המנוף הזה לא מרים 40 טון (resources) – נמחקים מהרשימה. אחר כך העדפות בין הנותרים: לפזר מטען של אותו לקוח על רציפים שונים כדי ששריפה אחת לא תשרוף הכל (anti-affinity / topology spread), להעדיף רציפים ריקים יותר (scoring). אם אף רציף לא עובר את החוקים הקשיחים, הקונטיינר מחכה על האונייה: Pending."
  },
  sections: [
    {
      h: { en: "Filter, then score, then bind", he: "סינון, ניקוד, שיבוץ" },
      body: {
        en: `<p>For every unscheduled Pod, kube-scheduler runs a pipeline of plugins:</p>
<ol>
<li><strong>Filter</strong> (predicates) — drop nodes that <em>can't</em> run it: not enough allocatable CPU/memory for the <em>requests</em>, nodeSelector/required affinity doesn't match, an untolerated taint, a host port already taken, the PVC's volume is in another zone.</li>
<li><strong>Score</strong> (priorities) — rank the survivors 0-100 with weighted plugins: least-allocated/balanced resources, preferred affinity, topology spread, image already present on the node.</li>
<li><strong>Bind</strong> — write <code>spec.nodeName</code> on the Pod. kubelet takes it from there.</li>
</ol>
<p>On big clusters it doesn't even check every node: <code>percentageOfNodesToScore</code> stops filtering once it finds "enough" feasible nodes, trading perfection for speed. If <em>zero</em> nodes pass the filter, the Pod stays <code>Pending</code> with an event like:</p>
<pre>0/12 nodes are available: 3 Insufficient memory,
4 node(s) had untolerated taint {dedicated: gpu},
5 node(s) didn't match Pod's node affinity/selector.</pre>
<p>That message is gold — it tells you exactly which filter killed each node.</p>`,
        he: `<p>לכל Pod שלא שובץ, ה-kube-scheduler מריץ pipeline של plugins:</p>
<ol>
<li><strong>Filter</strong> (predicates) – מוריד nodes ש<em>לא יכולים</em> להריץ אותו: אין מספיק allocatable CPU/זיכרון ל-<em>requests</em>, ה-nodeSelector או required affinity לא תואמים, יש taint בלי toleration, host port כבר תפוס, ה-volume של ה-PVC נמצא ב-zone אחר.</li>
<li><strong>Score</strong> (priorities) – מדרג את השורדים 0-100 עם plugins משוקללים: הכי פחות מוקצה/איזון משאבים, preferred affinity, topology spread, image שכבר קיים על ה-node.</li>
<li><strong>Bind</strong> – כותב <code>spec.nodeName</code> על ה-Pod. משם ה-kubelet ממשיך.</li>
</ol>
<p>ב-clusters גדולים הוא אפילו לא בודק כל node: <code>percentageOfNodesToScore</code> עוצר את הסינון כשנמצאו "מספיק" nodes אפשריים – מחליף שלמות במהירות. אם <em>אף</em> node לא עובר את הסינון, ה-Pod נשאר <code>Pending</code> עם event כמו:</p>
<pre>0/12 nodes are available: 3 Insufficient memory,
4 node(s) had untolerated taint {dedicated: gpu},
5 node(s) didn't match Pod's node affinity/selector.</pre>
<p>ההודעה הזאת שווה זהב – היא אומרת בדיוק איזה filter הפיל כל node.</p>`
      }
    },
    {
      h: { en: "Attracting Pods: nodeSelector & affinity", he: "למשוך Pods: nodeSelector ו-affinity" },
      body: {
        en: `<pre>spec:
  nodeSelector:
    kubernetes.io/arch: arm64          # simple, hard requirement
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - { key: node.kubernetes.io/instance-type, operator: In, values: [m7g.large, m7g.xlarge] }
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 50
        preference:
          matchExpressions:
          - { key: karpenter.sh/capacity-type, operator: In, values: [spot] }
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector: { matchLabels: { app: api } }
        topologyKey: kubernetes.io/hostname   # never 2 api Pods on one node</pre>
<ul>
<li><strong>nodeSelector</strong> — exact label match. Simple, rigid.</li>
<li><strong>nodeAffinity</strong> — same idea with operators (In, NotIn, Exists, Gt) and soft "preferred" rules with weights.</li>
<li><strong>podAffinity / podAntiAffinity</strong> — place relative to <em>other Pods</em>: "near the cache" or "away from my own replicas". <code>topologyKey</code> defines "near": same node (<code>hostname</code>) or same zone (<code>topology.kubernetes.io/zone</code>).</li>
</ul>
<p>"IgnoredDuringExecution" means: if labels change later, already-running Pods are <em>not</em> evicted.</p>`,
        he: `<pre>spec:
  nodeSelector:
    kubernetes.io/arch: arm64          # simple, hard requirement
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - { key: node.kubernetes.io/instance-type, operator: In, values: [m7g.large, m7g.xlarge] }
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 50
        preference:
          matchExpressions:
          - { key: karpenter.sh/capacity-type, operator: In, values: [spot] }
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector: { matchLabels: { app: api } }
        topologyKey: kubernetes.io/hostname   # never 2 api Pods on one node</pre>
<ul>
<li><strong>nodeSelector</strong> – התאמה מדויקת של label. פשוט, נוקשה.</li>
<li><strong>nodeAffinity</strong> – אותו רעיון עם אופרטורים (In, NotIn, Exists, Gt) וחוקים רכים "preferred" עם משקלים.</li>
<li><strong>podAffinity / podAntiAffinity</strong> – שיבוץ ביחס ל-<em>Pods אחרים</em>: "ליד ה-cache" או "רחוק מה-replicas של עצמי". ה-<code>topologyKey</code> מגדיר מה זה "ליד": אותו node (<code>hostname</code>) או אותו zone (<code>topology.kubernetes.io/zone</code>).</li>
</ul>
<p>"IgnoredDuringExecution" אומר: אם labels משתנים אחר כך, Pods שכבר רצים <em>לא</em> מפונים.</p>`
      }
    },
    {
      h: { en: "Repelling Pods: taints & tolerations", he: "להרחיק Pods: taints ו-tolerations" },
      body: {
        en: `<p>Affinity is the Pod saying "I want that node". A <strong>taint</strong> is the <em>node</em> saying "keep out, unless you tolerate me".</p>
<pre>kubectl taint nodes gpu-node-1 dedicated=gpu:NoSchedule

# in the Pod spec of GPU workloads:
tolerations:
- key: dedicated
  operator: Equal
  value: gpu
  effect: NoSchedule</pre>
<table>
<tr><th>Effect</th><th>Meaning</th></tr>
<tr><td>NoSchedule</td><td>New Pods without a toleration won't be placed</td></tr>
<tr><td>PreferNoSchedule</td><td>Avoid if possible</td></tr>
<tr><td>NoExecute</td><td>Also evicts running Pods that don't tolerate it</td></tr>
</table>
<p>Key insight: a toleration only <em>permits</em> a node, it doesn't <em>attract</em> to it. For dedicated nodes you need both: a taint (keep others out) <strong>and</strong> nodeAffinity (pull GPU Pods in). Control-plane nodes carry <code>node-role.kubernetes.io/control-plane:NoSchedule</code> — that's why your Pods never land there.</p>
<blockquote>💡 Real world: Kubernetes itself taints sick nodes — <code>node.kubernetes.io/not-ready</code>, <code>unreachable</code>, <code>memory-pressure</code>, <code>disk-pressure</code> — and DaemonSets automatically tolerate most of them.</blockquote>`,
        he: `<p>Affinity זה ה-Pod שאומר "אני רוצה את ה-node הזה". <strong>Taint</strong> זה ה-<em>node</em> שאומר "אין כניסה, אלא אם אתה סובל אותי".</p>
<pre>kubectl taint nodes gpu-node-1 dedicated=gpu:NoSchedule

# in the Pod spec of GPU workloads:
tolerations:
- key: dedicated
  operator: Equal
  value: gpu
  effect: NoSchedule</pre>
<table>
<tr><th>Effect</th><th>משמעות</th></tr>
<tr><td>NoSchedule</td><td>Pods חדשים בלי toleration לא ישובצו</td></tr>
<tr><td>PreferNoSchedule</td><td>להימנע אם אפשר</td></tr>
<tr><td>NoExecute</td><td>גם מפנה Pods רצים שאין להם toleration</td></tr>
</table>
<p>תובנה חשובה: toleration רק <em>מרשה</em> node, הוא לא <em>מושך</em> אליו. ל-nodes ייעודיים צריך את שניהם: taint (להשאיר אחרים בחוץ) <strong>וגם</strong> nodeAffinity (למשוך את ה-Pods של ה-GPU פנימה). ל-control-plane nodes יש <code>node-role.kubernetes.io/control-plane:NoSchedule</code> – בגלל זה ה-Pods שלך אף פעם לא נוחתים שם.</p>
<blockquote>💡 מהשטח: Kubernetes עצמו שם taints על nodes חולים – <code>node.kubernetes.io/not-ready</code>, <code>unreachable</code>, <code>memory-pressure</code>, <code>disk-pressure</code> – ו-DaemonSets סובלים את רובם אוטומטית.</blockquote>`
      }
    },
    {
      h: { en: "Topology spread, node failure & eviction", he: "Topology spread, נפילת node ו-eviction" },
      body: {
        en: `<pre>topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: { matchLabels: { app: api } }</pre>
<p>This says: the number of <code>api</code> Pods per zone may differ by at most 1. With 6 replicas over 3 AZs you get 2/2/2, so losing a whole AZ costs you a third, not everything. It's more flexible than anti-affinity, which breaks once replicas exceed nodes.</p>
<p><strong>When a node dies</strong>: kubelet stops heartbeating (Lease objects every 10s). After ~40s the node controller marks it <code>NotReady</code> and adds the <code>unreachable:NoExecute</code> taint. Pods have a default toleration of <strong>300 seconds</strong> for it — so about 5 minutes later they're evicted and replacements are scheduled elsewhere. StatefulSet Pods are <em>not</em> force-replaced automatically (to avoid two writers on one disk).</p>
<blockquote>⚠️ Production tip: protect against <em>voluntary</em> disruptions (node drains, upgrades, Karpenter consolidation) with a PodDisruptionBudget: <code>minAvailable: 2</code> or <code>maxUnavailable: 1</code>. Without one, a drain can take all your replicas at once.</blockquote>`,
        he: `<pre>topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: { matchLabels: { app: api } }</pre>
<p>זה אומר: מספר ה-Pods של <code>api</code> בכל zone יכול להיות שונה ב-1 לכל היותר. עם 6 replicas על 3 AZs מקבלים 2/2/2, אז נפילה של AZ שלם עולה לך שליש, לא הכל. זה גמיש יותר מ-anti-affinity, שנשבר ברגע שיש יותר replicas מ-nodes.</p>
<p><strong>כש-node מת</strong>: ה-kubelet מפסיק לשלוח heartbeats (אובייקטי Lease כל 10 שניות). אחרי כ-40 שניות ה-node controller מסמן אותו <code>NotReady</code> ומוסיף taint של <code>unreachable:NoExecute</code>. ל-Pods יש toleration ברירת מחדל של <strong>300 שניות</strong> אליו – אז בערך 5 דקות אחר כך הם מפונים ותחליפים משובצים במקום אחר. Pods של StatefulSet <em>לא</em> מוחלפים אוטומטית בכוח (כדי לא לקבל שני כותבים על אותו דיסק).</p>
<blockquote>⚠️ טיפ לפרודקשן: תגנו מפני disruptions <em>רצוניים</em> (drain של nodes, שדרוגים, consolidation של Karpenter) עם PodDisruptionBudget: <code>minAvailable: 2</code> או <code>maxUnavailable: 1</code>. בלי זה, drain יכול לקחת את כל ה-replicas בבת אחת.</blockquote>`
      }
    }
  ],
  diagram: `Pod api (requests 1 CPU / 2Gi, tolerates gpu? no, spread by zone)
 nodes:   n1(a)  n2(a)  n3(b)  n4(b,gpu-taint)  n5(c, 0.5 CPU free)
 FILTER:   ok     ok     ok     X taint          X Insufficient cpu
 SCORE:    62     71     88  <- zone b has fewest api Pods + most free resources
 BIND:                  n3   -> kubelet on n3 starts the Pod
 node n3 dies -> NotReady (~40s) -> taint unreachable:NoExecute -> evict after 300s -> reschedule`,
  handsOn: [
    { cmd: "kubectl get pods --field-selector=status.phase=Pending -A", what: { en: "Find every Pod that's stuck waiting for a node.", he: "למצוא כל Pod שתקוע ומחכה ל-node." } },
    { cmd: "kubectl describe pod POD | sed -n '/Events/,$p'", what: { en: "Read the FailedScheduling event that explains exactly which filter rejected which nodes.", he: "לקרוא את ה-event של FailedScheduling שמסביר בדיוק איזה filter דחה אילו nodes." } },
    { cmd: "kubectl get nodes -L topology.kubernetes.io/zone,node.kubernetes.io/instance-type", what: { en: "Show nodes with their zone and instance type labels as columns.", he: "להציג nodes עם ה-labels של zone ו-instance type כעמודות." } },
    { cmd: "kubectl describe node NODE | grep -i taints", what: { en: "See which taints a node carries.", he: "לראות אילו taints יש על node." } },
    { cmd: "kubectl drain NODE --ignore-daemonsets --delete-emptydir-data", what: { en: "Safely evict Pods (respecting PDBs) before maintenance; kubectl uncordon NODE to bring it back.", he: "לפנות Pods בצורה בטוחה (תוך כיבוד PDBs) לפני תחזוקה; kubectl uncordon NODE כדי להחזיר." } }
  ],
  mnemonic: {
    en: "\"Affinity attracts, taints repel, tolerations permit.\" And the scheduler's motto: \"Filter, Score, Bind — FSB.\"",
    he: "\"Affinity מושך, taint דוחה, toleration מרשה.\" והמוטו של ה-scheduler: \"מסננים, מדרגים, משבצים.\""
  },
  pitfalls: [
    { en: "Adding a toleration and expecting Pods to go to the tainted nodes. Tolerations only allow; add nodeAffinity to attract.", he: "להוסיף toleration ולצפות שה-Pods ילכו ל-nodes עם ה-taint. Toleration רק מרשה; צריך nodeAffinity כדי למשוך." },
    { en: "Required pod anti-affinity per hostname with more replicas than nodes: the extra replicas stay Pending forever. Use topologySpreadConstraints or 'preferred'.", he: "Required pod anti-affinity לפי hostname עם יותר replicas מ-nodes: ה-replicas העודפים נשארים Pending לנצח. להשתמש ב-topologySpreadConstraints או ב-'preferred'." },
    { en: "A PVC bound to an EBS volume in us-east-1a, but no nodes with capacity in 1a: the Pod is Pending with a volume node affinity conflict. Use WaitForFirstConsumer.", he: "PVC שקשור ל-EBS volume ב-us-east-1a, אבל אין nodes עם מקום ב-1a: ה-Pod נשאר Pending עם volume node affinity conflict. להשתמש ב-WaitForFirstConsumer." },
    { en: "No PodDisruptionBudget: a routine node upgrade drains all replicas of a service at the same time.", he: "בלי PodDisruptionBudget: שדרוג node שגרתי מפנה את כל ה-replicas של service באותו רגע." }
  ],
  interview: [
    {
      q: { en: "A Pod is stuck in Pending. How do you debug it?", he: "Pod תקוע ב-Pending. איך מדבגים?" },
      a: { en: "kubectl describe pod → read the FailedScheduling event (e.g. '0/5 nodes available: 3 Insufficient cpu, 2 untolerated taint'). Then check: requests vs node allocatable, nodeSelector/affinity labels, taints, PVC binding/zones, ResourceQuota. If it's capacity, check whether the cluster autoscaler is scaling up or blocked by max nodes.", he: "kubectl describe pod ← לקרוא את ה-event של FailedScheduling (למשל '0/5 nodes available: 3 Insufficient cpu, 2 untolerated taint'). אחר כך לבדוק: requests מול allocatable, labels של nodeSelector/affinity, taints, binding/zones של PVC, ResourceQuota. אם זו קיבולת – לבדוק אם ה-cluster autoscaler עולה או חסום ע\"י max nodes." }
    },
    {
      q: { en: "How would you make sure a service survives an availability-zone outage?", he: "איך תוודא ש-service שורד נפילה של availability zone?" },
      a: { en: "Run enough replicas, spread them with topologySpreadConstraints on topology.kubernetes.io/zone (maxSkew 1), have node groups in every AZ, use a PDB, keep enough headroom (or fast autoscaling) so the surviving zones can absorb the load, and make sure stateful dependencies are multi-AZ too.", he: "להריץ מספיק replicas, לפזר אותם עם topologySpreadConstraints על topology.kubernetes.io/zone (maxSkew 1), node groups בכל AZ, PDB, מספיק headroom (או autoscaling מהיר) כדי שה-zones השורדים יספגו את העומס, ולוודא שגם התלויות ה-stateful הן multi-AZ." }
    }
  ],
  quiz: [
    {
      q: { en: "Event: '0/6 nodes are available: 6 Insufficient memory'. Real memory usage on nodes is only 40%. Why?", he: "Event: '0/6 nodes are available: 6 Insufficient memory'. השימוש האמיתי בזיכרון ב-nodes הוא רק 40%. למה?" },
      options: [
        { en: "metrics-server is reporting wrong numbers", he: "metrics-server מדווח מספרים לא נכונים" },
        { en: "The scheduler counts requests, and the sum of requests is near allocatable", he: "ה-scheduler סופר requests, וסכום ה-requests קרוב ל-allocatable" },
        { en: "The nodes have a memory-pressure taint", he: "על ה-nodes יש taint של memory-pressure" },
        { en: "Memory limits are too low", he: "ה-memory limits נמוכים מדי" }
      ],
      answer: 1,
      explain: { en: "Scheduling is based on requests, not usage. Over-requested Pods make nodes look full. Right-size requests or add nodes.", he: "Scheduling מבוסס על requests, לא על שימוש. Pods עם over-request גורמים ל-nodes להיראות מלאים. לעשות right-sizing או להוסיף nodes." }
    },
    {
      q: { en: "You taint GPU nodes with dedicated=gpu:NoSchedule and add a matching toleration to your ML Pods. What else is needed so ML Pods actually run on GPU nodes?", he: "שמת taint על GPU nodes עם dedicated=gpu:NoSchedule והוספת toleration תואם ל-Pods של ML. מה עוד צריך כדי שה-Pods של ML באמת ירוצו על GPU nodes?" },
      options: [
        { en: "Nothing, tolerations attract Pods", he: "כלום, tolerations מושכים Pods" },
        { en: "A NoExecute taint instead", he: "Taint מסוג NoExecute במקום" },
        { en: "A PodDisruptionBudget", he: "PodDisruptionBudget" },
        { en: "nodeAffinity/nodeSelector for the GPU node label (and a GPU resource request)", he: "nodeAffinity/nodeSelector ל-label של ה-GPU node (ו-request ל-GPU)" }
      ],
      answer: 3,
      explain: { en: "A toleration only lets a Pod onto tainted nodes; without affinity it may still land on regular nodes. Requesting nvidia.com/gpu also forces GPU nodes.", he: "Toleration רק מרשה ל-Pod להיכנס ל-nodes עם taint; בלי affinity הוא עדיין יכול לנחות על nodes רגילים. Request של nvidia.com/gpu גם מכריח GPU nodes." }
    },
    {
      q: { en: "A node loses network. Roughly when are its (Deployment) Pods recreated elsewhere, with default settings?", he: "Node מאבד רשת. בערך מתי ה-Pods שלו (של Deployment) נוצרים במקום אחר, עם הגדרות ברירת מחדל?" },
      options: [
        { en: "Immediately", he: "מיד" },
        { en: "After ~10 seconds", he: "אחרי כ-10 שניות" },
        { en: "After ~5-6 minutes (NotReady detection + 300s toleration)", he: "אחרי כ-5-6 דקות (זיהוי NotReady + toleration של 300 שניות)" },
        { en: "Never, until an admin intervenes", he: "אף פעם, עד שאדמין מתערב" }
      ],
      answer: 2,
      explain: { en: "~40s to mark NotReady, then the default tolerationSeconds: 300 for unreachable/not-ready. You can lower tolerationSeconds for faster failover.", he: "כ-40 שניות לסימון NotReady, ואז tolerationSeconds: 300 ברירת מחדל ל-unreachable/not-ready. אפשר להוריד את tolerationSeconds בשביל failover מהיר יותר." }
    }
  ],
  playground: "scheduler",
  related: ["k8s-resources", "k8s-autoscaling", "k8s-storage", "k8s-debugging"]
});

// ---------------------------------------------------------------------------
// 8. Autoscaling
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-autoscaling",
  track: "kubernetes",
  order: 8,
  icon: "📈",
  level: 2,
  minutes: 11,
  title: { en: "Autoscaling: HPA, VPA, Cluster Autoscaler, Karpenter & KEDA", he: "Autoscaling: HPA, VPA, Cluster Autoscaler, Karpenter ו-KEDA" },
  tldr: {
    en: "HPA adds Pods, VPA resizes Pods, Cluster Autoscaler/Karpenter add nodes for Pending Pods, KEDA scales on events like queue depth — and all of them react with lag.",
    he: "HPA מוסיף Pods, VPA משנה גודל של Pods, Cluster Autoscaler/Karpenter מוסיפים nodes ל-Pods ב-Pending, KEDA עושה scale לפי events כמו עומק תור – וכולם מגיבים באיחור."
  },
  analogy: {
    en: "A restaurant on a Friday night. HPA is the shift manager calling in more waiters when each waiter has too many tables. VPA is deciding a waiter needs a bigger tray. The Cluster Autoscaler is the owner renting the empty shop next door when there's literally no floor space for more tables — which takes a while (minutes, not seconds). KEDA watches the line outside the door rather than how sweaty the waiters are.",
    he: "מסעדה בשישי בערב. HPA הוא מנהל המשמרת שמזמין עוד מלצרים כשלכל מלצר יש יותר מדי שולחנות. VPA זה להחליט שמלצר צריך מגש גדול יותר. ה-Cluster Autoscaler הוא הבעלים ששוכר את החנות הריקה ליד כשאין פיזית מקום לעוד שולחנות – וזה לוקח זמן (דקות, לא שניות). KEDA מסתכל על התור בחוץ ולא על כמה המלצרים מזיעים."
  },
  sections: [
    {
      h: { en: "HPA: the formula", he: "HPA: הנוסחה" },
      body: {
        en: `<p>The Horizontal Pod Autoscaler runs every 15 seconds and computes:</p>
<pre>desiredReplicas = ceil( currentReplicas * currentMetric / targetMetric )

e.g. 4 Pods at 90% avg CPU, target 60%:  ceil(4 * 90/60) = ceil(6.0) = 6</pre>
<p>Important: CPU <strong>utilization is a percentage of the request</strong>, not of the node or the limit. No CPU request → HPA can't compute utilization at all.</p>
<pre>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 30
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 60 } }
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300    # default: wait 5 min before shrinking
      policies: [{ type: Percent, value: 50, periodSeconds: 60 }]</pre>
<p>It has a 10% tolerance (no action between 0.9 and 1.1 of target) to avoid flapping. Custom metrics (RPS, latency) come through the Prometheus Adapter or KEDA. Set a sane <code>maxReplicas</code> — an HPA happily scales a memory-leak to 30 Pods, or DDoSes your database with connections.</p>`,
        he: `<p>ה-Horizontal Pod Autoscaler רץ כל 15 שניות ומחשב:</p>
<pre>desiredReplicas = ceil( currentReplicas * currentMetric / targetMetric )

e.g. 4 Pods at 90% avg CPU, target 60%:  ceil(4 * 90/60) = ceil(6.0) = 6</pre>
<p>חשוב: <strong>utilization של CPU הוא אחוז מה-request</strong>, לא מה-node ולא מה-limit. אין CPU request ← HPA לא יכול לחשב utilization בכלל.</p>
<pre>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 30
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 60 } }
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300    # default: wait 5 min before shrinking
      policies: [{ type: Percent, value: 50, periodSeconds: 60 }]</pre>
<p>יש לו tolerance של 10% (לא עושה כלום בין 0.9 ל-1.1 מה-target) כדי למנוע flapping. מטריקות custom (RPS, latency) מגיעות דרך Prometheus Adapter או KEDA. תגדירו <code>maxReplicas</code> הגיוני – HPA ישמח לעשות scale לדליפת זיכרון עד 30 Pods, או לעשות DDoS ל-DB שלכם עם connections.</p>`
      }
    },
    {
      h: { en: "VPA: right-sizing Pods", he: "VPA: right-sizing ל-Pods" },
      body: {
        en: `<p>The Vertical Pod Autoscaler watches actual usage and recommends (or applies) better <em>requests</em>. Modes:</p>
<ul>
<li><code>Off</code> — recommendations only. Read them with <code>kubectl describe vpa api</code>. The safest and most popular use: a free right-sizing advisor.</li>
<li><code>Initial</code> — sets requests only when Pods are created.</li>
<li><code>Recreate</code> / <code>Auto</code> — evicts Pods to apply new sizes (newer versions can resize in place where supported).</li>
</ul>
<p>Don't let HPA and VPA fight over the <em>same</em> metric: if VPA raises the CPU request, the HPA's utilization percentage drops, so HPA scales in, so VPA... You get the idea. Common pattern: HPA on CPU/RPS for replicas, VPA in <code>Off</code> mode for guidance, or VPA only on memory.</p>
<blockquote>💡 Real world: Kubernetes now supports in-place Pod resize (changing requests/limits without restarting the container), which makes vertical scaling far less disruptive — check your version and runtime before relying on it.</blockquote>`,
        he: `<p>ה-Vertical Pod Autoscaler עוקב אחרי השימוש בפועל וממליץ על (או מחיל) <em>requests</em> טובים יותר. מצבים:</p>
<ul>
<li><code>Off</code> – רק המלצות. קוראים אותן עם <code>kubectl describe vpa api</code>. השימוש הכי בטוח ופופולרי: יועץ right-sizing בחינם.</li>
<li><code>Initial</code> – קובע requests רק כש-Pods נוצרים.</li>
<li><code>Recreate</code> / <code>Auto</code> – מפנה Pods כדי להחיל גדלים חדשים (גרסאות חדשות יכולות לשנות גודל in-place איפה שנתמך).</li>
</ul>
<p>אל תתנו ל-HPA ול-VPA להילחם על <em>אותה</em> מטריקה: אם VPA מעלה את ה-CPU request, אחוז ה-utilization של HPA יורד, אז HPA מוריד replicas, אז VPA... הבנתם. הדפוס הנפוץ: HPA על CPU/RPS בשביל replicas, ו-VPA במצב <code>Off</code> להכוונה, או VPA רק על זיכרון.</p>
<blockquote>💡 מהשטח: Kubernetes תומך היום ב-in-place Pod resize (שינוי requests/limits בלי restart לקונטיינר), מה שהופך scaling אנכי להרבה פחות מפריע – תבדקו את הגרסה וה-runtime שלכם לפני שסומכים על זה.</blockquote>`
      }
    },
    {
      h: { en: "Adding nodes: Cluster Autoscaler vs Karpenter", he: "להוסיף nodes: Cluster Autoscaler מול Karpenter" },
      body: {
        en: `<p>HPA creates Pods; if no node has room, they go <code>Pending</code>. Node autoscalers react to exactly that signal — <strong>Pending Pods with "Insufficient" reasons</strong>, not CPU usage.</p>
<ul>
<li><strong>Cluster Autoscaler (CA)</strong>: works with predefined node groups (AWS ASGs, GKE node pools). It simulates "would this Pending Pod fit on a new node from group X?" and bumps the group size. Scales down nodes that are under ~50% requested for 10 minutes and whose Pods can move elsewhere.</li>
<li><strong>Karpenter</strong>: groupless. Looks at the Pending Pods' requirements and directly launches the cheapest instance type(s) that fit, from a broad allowed list (spot + on-demand, arm64 + amd64). It also <em>consolidates</em>: replaces several half-empty nodes with one cheaper node.</li>
</ul>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: default }
spec:
  template:
    spec:
      requirements:
      - { key: karpenter.sh/capacity-type, operator: In, values: [spot, on-demand] }
      - { key: kubernetes.io/arch, operator: In, values: [arm64, amd64] }
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
  limits: { cpu: "500" }
  disruption: { consolidationPolicy: WhenEmptyOrUnderutilized }</pre>`,
        he: `<p>HPA יוצר Pods; אם לאף node אין מקום, הם נכנסים ל-<code>Pending</code>. ה-node autoscalers מגיבים בדיוק לסיגנל הזה – <strong>Pods ב-Pending עם סיבת "Insufficient"</strong>, לא לשימוש ב-CPU.</p>
<ul>
<li><strong>Cluster Autoscaler (CA)</strong>: עובד עם node groups מוגדרים מראש (AWS ASGs, GKE node pools). הוא מדמה "האם ה-Pod ה-Pending הזה ייכנס ל-node חדש מקבוצה X?" ומגדיל את הקבוצה. מוריד nodes שיש להם פחות מ-~50% requests במשך 10 דקות וה-Pods שלהם יכולים לזוז למקום אחר.</li>
<li><strong>Karpenter</strong>: בלי groups. מסתכל על הדרישות של ה-Pods ב-Pending ומרים ישירות את סוג ה-instance הכי זול שמתאים, מתוך רשימה רחבה (spot + on-demand, arm64 + amd64). הוא גם עושה <em>consolidation</em>: מחליף כמה nodes חצי-ריקים ב-node אחד זול יותר.</li>
</ul>
<pre>apiVersion: karpenter.sh/v1
kind: NodePool
metadata: { name: default }
spec:
  template:
    spec:
      requirements:
      - { key: karpenter.sh/capacity-type, operator: In, values: [spot, on-demand] }
      - { key: kubernetes.io/arch, operator: In, values: [arm64, amd64] }
      nodeClassRef: { group: karpenter.k8s.aws, kind: EC2NodeClass, name: default }
  limits: { cpu: "500" }
  disruption: { consolidationPolicy: WhenEmptyOrUnderutilized }</pre>`
      }
    },
    {
      h: { en: "KEDA and the scale-up lag problem", he: "KEDA ובעיית האיחור ב-scale-up" },
      body: {
        en: `<p><strong>KEDA</strong> (Kubernetes Event-Driven Autoscaling) scales on <em>what's waiting</em> rather than what's burning: Kafka consumer lag, SQS/RabbitMQ queue length, Redis list size, Prometheus queries, cron windows. It can also scale to <strong>zero</strong> and back — perfect for workers that are idle most of the day.</p>
<pre>apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata: { name: email-worker }
spec:
  scaleTargetRef: { name: email-worker }
  minReplicaCount: 0
  maxReplicaCount: 50
  triggers:
  - type: aws-sqs-queue
    metadata: { queueURL: https://sqs.eu-west-1.amazonaws.com/123/emails, queueLength: "20" }</pre>
<p><strong>The lag stack</strong> — add it up for a traffic spike: metrics scrape (15-60s) + HPA sync (15s) + Pod scheduling (if no room: node provisioning 45-120s+) + image pull (5-60s) + app startup/JVM warm-up (10-60s) + readiness. Realistically <strong>1-4 minutes</strong> before new capacity serves traffic.</p>
<blockquote>⚠️ Production tip: autoscaling handles ramps, not cliffs. For known spikes (a TV ad, Black Friday, 9:00 login storm) pre-scale with a higher <code>minReplicas</code> or a KEDA cron trigger, keep headroom (target 60%, not 90%), use small images, and consider low-priority "balloon" Pods that reserve spare nodes and get preempted instantly.</blockquote>`,
        he: `<p><strong>KEDA</strong> (Kubernetes Event-Driven Autoscaling) עושה scale לפי <em>מה שמחכה</em> ולא לפי מה ששורף: lag של Kafka consumer, אורך תור ב-SQS/RabbitMQ, גודל list ב-Redis, שאילתות Prometheus, חלונות cron. הוא גם יכול לרדת ל-<strong>אפס</strong> ולחזור – מושלם ל-workers שרוב היום לא עושים כלום.</p>
<pre>apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata: { name: email-worker }
spec:
  scaleTargetRef: { name: email-worker }
  minReplicaCount: 0
  maxReplicaCount: 50
  triggers:
  - type: aws-sqs-queue
    metadata: { queueURL: https://sqs.eu-west-1.amazonaws.com/123/emails, queueLength: "20" }</pre>
<p><strong>מחסנית האיחורים</strong> – תסכמו ל-spike בתעבורה: scrape של מטריקות (15-60 שניות) + sync של HPA (15 שניות) + scheduling (אם אין מקום: הקמת node 45-120 שניות ויותר) + image pull (5-60 שניות) + עליית האפליקציה/חימום JVM (10-60 שניות) + readiness. בפועל <strong>1-4 דקות</strong> עד שקיבולת חדשה מקבלת תעבורה.</p>
<blockquote>⚠️ טיפ לפרודקשן: autoscaling מטפל בעליות הדרגתיות, לא בצוקים. ל-spikes ידועים (פרסומת בטלוויזיה, Black Friday, סערת logins ב-9:00) תעשו pre-scale עם <code>minReplicas</code> גבוה יותר או KEDA cron trigger, תשאירו headroom (target של 60%, לא 90%), images קטנים, ותשקלו Pods של "balloon" בעדיפות נמוכה ששומרים nodes פנויים ומפונים מיד.</blockquote>`
      }
    }
  ],
  diagram: `traffic up -> CPU 90% of request -> HPA: ceil(4*90/60)=6 -> 2 new Pods
   -> no room -> Pending (Insufficient cpu)
   -> Cluster Autoscaler / Karpenter -> new node (~60-120s)
   -> image pull -> app start -> readiness OK -> Service sends traffic
 queue depth 2,000 msgs / 20 per Pod -> KEDA -> 50 workers (cap)  ... queue empty -> 0`,
  handsOn: [
    { cmd: "kubectl autoscale deploy api --cpu-percent=60 --min=3 --max=30", what: { en: "Create a CPU-based HPA quickly.", he: "ליצור HPA מבוסס CPU מהר." } },
    { cmd: "kubectl get hpa api -w", what: { en: "Watch TARGETS (current/target) and REPLICAS change during a load test.", he: "לצפות ב-TARGETS (נוכחי/יעד) וב-REPLICAS משתנים בזמן load test." } },
    { cmd: "kubectl run load --rm -it --image=busybox:1.36 --restart=Never -- sh -c 'while true; do wget -q -O- http://api; done'", what: { en: "Generate crude load against the Service to trigger the HPA.", he: "לייצר עומס גס מול ה-Service כדי להפעיל את ה-HPA." } },
    { cmd: "kubectl describe hpa api", what: { en: "See the HPA's conditions and events — e.g. 'missing request for cpu' or 'ScalingLimited'.", he: "לראות את ה-conditions וה-events של ה-HPA – למשל 'missing request for cpu' או 'ScalingLimited'." } },
    { cmd: "kubectl get nodes -L karpenter.sh/capacity-type,node.kubernetes.io/instance-type -w", what: { en: "Watch new nodes (and their spot/on-demand type) appear when Pods go Pending.", he: "לצפות ב-nodes חדשים (וסוג spot/on-demand שלהם) מופיעים כש-Pods נכנסים ל-Pending." } }
  ],
  mnemonic: {
    en: "\"H adds hands, V grows arms, CA builds rooms, KEDA counts the queue.\" HPA = more Pods, VPA = bigger Pods, CA/Karpenter = more nodes, KEDA = scale on backlog.",
    he: "\"H מוסיף ידיים, V מגדיל זרועות, CA בונה חדרים, KEDA סופר את התור.\" HPA = יותר Pods, VPA = Pods גדולים יותר, CA/Karpenter = יותר nodes, KEDA = scale לפי backlog."
  },
  pitfalls: [
    { en: "HPA on CPU with no CPU request on the container: the HPA shows &lt;unknown&gt; and never scales.", he: "HPA על CPU בלי CPU request בקונטיינר: ה-HPA מראה &lt;unknown&gt; ואף פעם לא עושה scale." },
    { en: "Scaling on CPU for an I/O-bound or queue worker: CPU stays low while the backlog explodes. Scale on queue depth/lag (KEDA) or RPS.", he: "Scale לפי CPU ל-worker שהוא I/O-bound או צורך תור: ה-CPU נשאר נמוך בזמן שה-backlog מתפוצץ. לעשות scale לפי עומק תור/lag (KEDA) או RPS." },
    { en: "Expecting autoscaling to absorb an instant 10x spike. Node provisioning + startup take minutes; pre-scale or keep headroom.", he: "לצפות ש-autoscaling יספוג spike מיידי של פי 10. הקמת nodes + עלייה לוקחות דקות; לעשות pre-scale או להשאיר headroom." },
    { en: "Setting replicas: N in the Deployment manifest while an HPA owns it: every GitOps sync resets the count and fights the HPA. Omit replicas when using HPA.", he: "להגדיר replicas: N ב-manifest של Deployment כשיש HPA: כל sync של GitOps מאפס את המספר ונלחם ב-HPA. להשמיט את replicas כשמשתמשים ב-HPA." }
  ],
  interview: [
    {
      q: { en: "An HPA targets 50% CPU. There are 6 Pods averaging 80%. How many replicas will it want?", he: "HPA עם target של 50% CPU. יש 6 Pods עם ממוצע 80%. כמה replicas הוא ירצה?" },
      a: { en: "ceil(6 × 80/50) = ceil(9.6) = 10, capped by maxReplicas, and subject to scale-up behavior policies. Utilization is relative to the CPU request.", he: "ceil(6 × 80/50) = ceil(9.6) = 10, מוגבל ע\"י maxReplicas ובכפוף ל-behavior policies של scale-up. ה-utilization יחסי ל-CPU request." }
    },
    {
      q: { en: "Cluster Autoscaler vs Karpenter?", he: "Cluster Autoscaler מול Karpenter?" },
      a: { en: "Both add nodes for unschedulable Pods. CA scales predefined node groups up/down, so you must pre-design groups per instance type. Karpenter provisions instances directly from Pod requirements, picks from many instance types (incl. spot), launches faster, and actively consolidates to cut cost.", he: "שניהם מוסיפים nodes ל-Pods שלא ניתן לשבץ. CA מגדיל/מקטין node groups מוגדרים מראש, אז צריך לתכנן מראש groups לכל instance type. Karpenter מקים instances ישירות לפי דרישות ה-Pods, בוחר מהרבה instance types (כולל spot), מקים מהר יותר ועושה consolidation אקטיבי כדי לחסוך." }
    }
  ],
  quiz: [
    {
      q: { en: "HPA target is 60% CPU. 5 Pods average 120% of their CPU request. Desired replicas (max 20)?", he: "ה-target של HPA הוא 60% CPU. 5 Pods בממוצע של 120% מה-CPU request. כמה replicas רצויים (max 20)?" },
      options: [
        { en: "6", he: "6" },
        { en: "10", he: "10" },
        { en: "12", he: "12" },
        { en: "20", he: "20" }
      ],
      answer: 1,
      explain: { en: "ceil(5 × 120/60) = 10. Utilization can exceed 100% because it's relative to the request, not the limit.", he: "ceil(5 × 120/60) = 10. Utilization יכול לעבור 100% כי הוא יחסי ל-request, לא ל-limit." }
    },
    {
      q: { en: "What signal makes the Cluster Autoscaler add a node?", he: "איזה סיגנל גורם ל-Cluster Autoscaler להוסיף node?" },
      options: [
        { en: "Node CPU usage above 80%", he: "שימוש CPU של node מעל 80%" },
        { en: "Pods stuck Pending because no node has enough allocatable resources", he: "Pods שתקועים ב-Pending כי לאף node אין מספיק משאבים פנויים" },
        { en: "An HPA hitting maxReplicas", he: "HPA שהגיע ל-maxReplicas" },
        { en: "High latency on the ingress", he: "Latency גבוה ב-ingress" }
      ],
      answer: 1,
      explain: { en: "Node autoscalers react to unschedulable Pods (based on requests), not to utilization. A node at 99% CPU with no Pending Pods triggers nothing.", he: "Node autoscalers מגיבים ל-Pods שלא ניתן לשבץ (לפי requests), לא ל-utilization. Node על 99% CPU בלי Pods ב-Pending לא מפעיל כלום." }
    },
    {
      q: { en: "Your email workers consume from SQS. CPU is 10% but the queue holds 50,000 messages. Best scaling approach?", he: "ה-workers של המיילים צורכים מ-SQS. ה-CPU על 10% אבל בתור יש 50,000 הודעות. מה הגישה הכי טובה ל-scaling?" },
      options: [
        { en: "Lower the HPA CPU target to 5%", he: "להוריד את ה-CPU target של HPA ל-5%" },
        { en: "VPA in Auto mode", he: "VPA במצב Auto" },
        { en: "KEDA scaling on SQS queue length", he: "KEDA עם scale לפי אורך התור ב-SQS" },
        { en: "Add more nodes manually", he: "להוסיף nodes ידנית" }
      ],
      answer: 2,
      explain: { en: "The work is I/O-bound; CPU doesn't reflect backlog. KEDA scales on queue depth (and to zero when it's empty).", he: "העבודה היא I/O-bound; ה-CPU לא משקף את ה-backlog. KEDA עושה scale לפי עומק התור (ויורד לאפס כשהוא ריק)." }
    },
    {
      q: { en: "Traffic jumps 5x in 10 seconds. HPA and Karpenter are configured correctly. What happens?", he: "התעבורה קופצת פי 5 תוך 10 שניות. HPA ו-Karpenter מוגדרים נכון. מה קורה?" },
      options: [
        { en: "New capacity serves traffic within ~1 second", he: "קיבולת חדשה מקבלת תעבורה תוך כשנייה" },
        { en: "Nothing, autoscalers only work on schedules", he: "כלום, autoscalers עובדים רק לפי לוח זמנים" },
        { en: "The HPA immediately sets replicas to maxReplicas", he: "ה-HPA מיד קובע replicas ל-maxReplicas" },
        { en: "Existing Pods are overloaded for a few minutes until metrics, new nodes, image pulls and startup catch up", he: "ה-Pods הקיימים עמוסים כמה דקות עד שמטריקות, nodes חדשים, image pulls ועלייה מדביקים את הקצב" }
      ],
      answer: 3,
      explain: { en: "The lag stack is real: plan headroom, pre-scaling, and fast startup for sharp spikes.", he: "מחסנית האיחורים אמיתית: מתכננים headroom, pre-scaling ועלייה מהירה ל-spikes חדים." }
    }
  ],
  playground: "scaling",
  related: ["k8s-resources", "k8s-scheduling", "obs-metrics", "k8s-probes"]
});

// ---------------------------------------------------------------------------
// 9. Probes & graceful shutdown
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-probes",
  track: "kubernetes",
  order: 9,
  icon: "🩺",
  level: 2,
  minutes: 10,
  title: { en: "Probes & Graceful Shutdown", he: "Probes ו-Graceful Shutdown" },
  tldr: {
    en: "Readiness decides if a Pod gets traffic, liveness decides if it gets restarted, startup protects slow boots — and a clean SIGTERM path decides whether deploys drop requests.",
    he: "Readiness מחליט אם Pod מקבל תעבורה, liveness מחליט אם עושים לו restart, startup מגן על עלייה איטית – ומסלול SIGTERM נקי מחליט אם deploys מפילים בקשות."
  },
  analogy: {
    en: "A waiter at the restaurant. Readiness: \"Can you take a table right now?\" — if not (on a break, tray full), the host just stops seating people in his section. Liveness: \"Are you conscious?\" — if not, call an ambulance and replace him. Startup: a new waiter gets a grace period to put on the apron before anyone checks. Asking liveness \"is the kitchen OK?\" is how you fire every waiter because the oven broke.",
    he: "מלצר במסעדה. Readiness: \"אתה יכול לקחת שולחן עכשיו?\" – אם לא (בהפסקה, מגש מלא), המארחת פשוט מפסיקה להושיב אנשים באזור שלו. Liveness: \"אתה בהכרה?\" – אם לא, מזמינים אמבולנס ומחליפים אותו. Startup: מלצר חדש מקבל זמן חסד ללבוש סינר לפני שבודקים אותו. לשאול ב-liveness \"המטבח בסדר?\" זו הדרך לפטר את כל המלצרים כי התנור התקלקל."
  },
  sections: [
    {
      h: { en: "Three probes, three different questions", he: "שלושה probes, שלוש שאלות שונות" },
      body: {
        en: `<table>
<tr><th>Probe</th><th>Question</th><th>On failure</th></tr>
<tr><td>readinessProbe</td><td>Should I get traffic right now?</td><td>Removed from Service endpoints. <strong>No restart.</strong></td></tr>
<tr><td>livenessProbe</td><td>Am I stuck beyond self-recovery?</td><td>kubelet <strong>kills and restarts</strong> the container</td></tr>
<tr><td>startupProbe</td><td>Have I finished booting?</td><td>Liveness/readiness are paused until it passes; if it never passes → restart</td></tr>
</table>
<pre>containers:
- name: api
  image: myorg/api:2.4.1
  startupProbe:
    httpGet: { path: /healthz, port: 8080 }
    periodSeconds: 5
    failureThreshold: 30          # up to 150s to boot
  readinessProbe:
    httpGet: { path: /ready, port: 8080 }
    periodSeconds: 5
    failureThreshold: 2
  livenessProbe:
    httpGet: { path: /healthz, port: 8080 }
    periodSeconds: 10
    timeoutSeconds: 2
    failureThreshold: 3           # 30s of failures before restart</pre>
<p>Probe types: <code>httpGet</code> (2xx/3xx = ok), <code>tcpSocket</code>, <code>exec</code> (exit 0 = ok), <code>grpc</code>. Readiness keeps running for the Pod's whole life — it's not just a boot check. A Pod can go un-Ready under load and come back.</p>`,
        he: `<table>
<tr><th>Probe</th><th>השאלה</th><th>בכישלון</th></tr>
<tr><td>readinessProbe</td><td>האם לשלוח לי תעבורה עכשיו?</td><td>יוצא מה-endpoints של ה-Service. <strong>בלי restart.</strong></td></tr>
<tr><td>livenessProbe</td><td>האם נתקעתי מעבר ליכולת להתאושש לבד?</td><td>ה-kubelet <strong>הורג ומרים מחדש</strong> את הקונטיינר</td></tr>
<tr><td>startupProbe</td><td>האם סיימתי לעלות?</td><td>liveness/readiness מושהים עד שהוא עובר; אם לא עובר אף פעם ← restart</td></tr>
</table>
<pre>containers:
- name: api
  image: myorg/api:2.4.1
  startupProbe:
    httpGet: { path: /healthz, port: 8080 }
    periodSeconds: 5
    failureThreshold: 30          # up to 150s to boot
  readinessProbe:
    httpGet: { path: /ready, port: 8080 }
    periodSeconds: 5
    failureThreshold: 2
  livenessProbe:
    httpGet: { path: /healthz, port: 8080 }
    periodSeconds: 10
    timeoutSeconds: 2
    failureThreshold: 3           # 30s of failures before restart</pre>
<p>סוגי probes: <code>httpGet</code> (2xx/3xx = תקין), <code>tcpSocket</code>, <code>exec</code> (exit 0 = תקין), <code>grpc</code>. Readiness ממשיך לרוץ לאורך כל חיי ה-Pod – זו לא רק בדיקת עלייה. Pod יכול להפוך ל-un-Ready תחת עומס ולחזור.</p>`
      }
    },
    {
      h: { en: "The classic mistake: liveness that checks the database", he: "הטעות הקלאסית: liveness שבודק את ה-DB" },
      body: {
        en: `<p>It seems responsible: "my app is healthy only if Postgres is reachable", so <code>/healthz</code> pings the DB. Now the DB has a 40-second hiccup. Every replica's liveness fails at once → kubelet restarts <strong>all</strong> of them → they all reconnect at the same time (thundering herd) → the struggling DB gets hammered harder → restarts loop. A small DB blip became a full outage. This is a <strong>cascading failure</strong> you built yourself.</p>
<p>Rules of thumb:</p>
<ul>
<li><strong>Liveness</strong>: only checks the process itself — event loop responsive, no deadlock. Cheap, local, no dependencies. Many services are fine with <em>no</em> liveness probe at all; a crash already restarts the container.</li>
<li><strong>Readiness</strong>: may consider critical dependencies <em>carefully</em>, but if every replica shares the same dependency, they'll all go un-Ready together and the Service has zero endpoints. Often it's better to stay Ready and return fast 503s/degraded responses.</li>
<li>Generous timeouts: a GC pause of 1.5s plus <code>timeoutSeconds: 1</code> = random restarts under load.</li>
</ul>
<blockquote>💡 Real world: "restarts don't fix overload". If liveness fails because the Pod is too busy to answer, restarting it removes capacity at exactly the worst moment and makes the death spiral faster.</blockquote>`,
        he: `<p>זה נראה אחראי: "האפליקציה שלי בריאה רק אם Postgres נגיש", אז <code>/healthz</code> עושה ping ל-DB. עכשיו ל-DB יש גמגום של 40 שניות. ה-liveness של כל ה-replicas נכשל באותו רגע ← ה-kubelet עושה restart ל<strong>כולם</strong> ← כולם מתחברים מחדש באותו זמן (thundering herd) ← ה-DB שכבר מתקשה חוטף יותר ← לולאת restarts. גמגום קטן של DB הפך ל-outage מלא. זה <strong>cascading failure</strong> שבנית בעצמך.</p>
<p>כללי אצבע:</p>
<ul>
<li><strong>Liveness</strong>: בודק רק את התהליך עצמו – ה-event loop מגיב, אין deadlock. זול, מקומי, בלי תלויות. להרבה services עדיף <em>בלי</em> liveness בכלל; קריסה ממילא עושה restart לקונטיינר.</li>
<li><strong>Readiness</strong>: יכול להתחשב בתלויות קריטיות <em>בזהירות</em>, אבל אם כל ה-replicas חולקים את אותה תלות, כולם יהפכו un-Ready ביחד ול-Service יהיו אפס endpoints. הרבה פעמים עדיף להישאר Ready ולהחזיר 503 מהיר או תשובה מוגבלת.</li>
<li>timeouts נדיבים: GC pause של 1.5 שניות ועוד <code>timeoutSeconds: 1</code> = restarts אקראיים תחת עומס.</li>
</ul>
<blockquote>💡 מהשטח: "restarts לא מתקנים עומס". אם liveness נכשל כי ה-Pod עסוק מכדי לענות, restart מוריד קיבולת בדיוק ברגע הכי גרוע ומאיץ את ספירלת המוות.</blockquote>`
      }
    },
    {
      h: { en: "Graceful shutdown: the termination sequence", he: "Graceful shutdown: רצף הסיום" },
      body: {
        en: `<p>When a Pod is deleted (deploy, scale-down, drain), two things start <strong>in parallel</strong>:</p>
<ol>
<li>The Pod is marked Terminating → EndpointSlice controller removes it → every node's kube-proxy, the ingress controller, and the cloud LB must catch up. This takes <em>a few seconds</em>.</li>
<li>kubelet runs the <code>preStop</code> hook, then sends <code>SIGTERM</code> to PID 1. After <code>terminationGracePeriodSeconds</code> (default <strong>30s</strong>, counted from the start, including preStop) → <code>SIGKILL</code>.</li>
</ol>
<p>The race: if your app exits immediately on SIGTERM, some proxies still send it requests for a few seconds → 502s on every deploy. The fix:</p>
<pre>spec:
  terminationGracePeriodSeconds: 45
  containers:
  - name: api
    lifecycle:
      preStop:
        sleep: { seconds: 10 }     # or exec: ["sleep","10"] on older versions
# app: on SIGTERM -> stop accepting new conns, finish in-flight, close DB pool, exit 0</pre>
<blockquote>⚠️ Production tip: make sure your app actually <em>receives</em> SIGTERM. With <code>CMD npm start</code> or a shell-form entrypoint, PID 1 is a shell that doesn't forward signals — you wait 30s and get SIGKILLed every time. Use exec form (<code>["node","server.js"]</code>) or tini/dumb-init.</blockquote>`,
        he: `<p>כש-Pod נמחק (deploy, scale-down, drain), שני דברים מתחילים <strong>במקביל</strong>:</p>
<ol>
<li>ה-Pod מסומן Terminating ← ה-EndpointSlice controller מוציא אותו ← ה-kube-proxy בכל node, ה-ingress controller וה-LB בענן צריכים להתעדכן. זה לוקח <em>כמה שניות</em>.</li>
<li>ה-kubelet מריץ את ה-hook של <code>preStop</code>, ואז שולח <code>SIGTERM</code> ל-PID 1. אחרי <code>terminationGracePeriodSeconds</code> (ברירת מחדל <strong>30 שניות</strong>, נספר מההתחלה כולל preStop) ← <code>SIGKILL</code>.</li>
</ol>
<p>ה-race: אם האפליקציה יוצאת מיד ב-SIGTERM, חלק מה-proxies עדיין שולחים לה בקשות לכמה שניות ← 502 בכל deploy. הפתרון:</p>
<pre>spec:
  terminationGracePeriodSeconds: 45
  containers:
  - name: api
    lifecycle:
      preStop:
        sleep: { seconds: 10 }     # or exec: ["sleep","10"] on older versions
# app: on SIGTERM -> stop accepting new conns, finish in-flight, close DB pool, exit 0</pre>
<blockquote>⚠️ טיפ לפרודקשן: תוודאו שהאפליקציה באמת <em>מקבלת</em> SIGTERM. עם <code>CMD npm start</code> או entrypoint ב-shell form, ה-PID 1 הוא shell שלא מעביר signals – מחכים 30 שניות וחוטפים SIGKILL כל פעם. להשתמש ב-exec form (<code>["node","server.js"]</code>) או ב-tini/dumb-init.</blockquote>`
      }
    }
  ],
  diagram: `kubectl delete pod / rollout step
 |-- (A) endpoints removal -> kube-proxy / ingress / LB update ...... takes ~1-5s
 '-- (B) preStop sleep 10s -> SIGTERM -> drain in-flight -> exit 0
                                         |<---- terminationGracePeriodSeconds (45s) ---->| SIGKILL
 probes:  startup (boot gate) -> readiness (traffic on/off) + liveness (restart if wedged)`,
  handsOn: [
    { cmd: "kubectl describe pod POD | grep -E 'Liveness|Readiness|Startup'", what: { en: "See the configured probes with their timings.", he: "לראות את ה-probes המוגדרים והתזמונים שלהם." } },
    { cmd: "kubectl get events --field-selector reason=Unhealthy -A", what: { en: "Find probe failures across the cluster ('Liveness probe failed: ...').", he: "למצוא כישלונות probes בכל ה-cluster ('Liveness probe failed: ...')." } },
    { cmd: "kubectl get pods -o custom-columns=NAME:.metadata.name,READY:.status.containerStatuses[0].ready,RESTARTS:.status.containerStatuses[0].restartCount", what: { en: "Spot Pods that are running but not Ready, or restart-happy.", he: "לזהות Pods שרצים אבל לא Ready, או שעושים restarts בלי סוף." } },
    { cmd: "kubectl exec POD -- wget -qO- localhost:8080/ready", what: { en: "Call the readiness endpoint yourself from inside the Pod.", he: "לקרוא ל-endpoint של readiness בעצמך מתוך ה-Pod." } },
    { cmd: "kubectl exec POD -- cat /proc/1/cmdline | tr '\\0' ' '", what: { en: "Check what PID 1 really is — your app, or a shell that swallows SIGTERM?", he: "לבדוק מה באמת PID 1 – האפליקציה שלך, או shell שבולע SIGTERM?" } }
  ],
  mnemonic: {
    en: "\"Ready = traffic, Live = life, Startup = patience.\" And: \"Liveness looks in the mirror, never out the window\" — it checks only itself, never dependencies.",
    he: "\"Ready = תעבורה, Live = חיים, Startup = סבלנות.\" ו: \"Liveness מסתכל במראה, לא מהחלון\" – בודק רק את עצמו, אף פעם לא תלויות."
  },
  pitfalls: [
    { en: "Liveness probe checks the DB/downstream services → one dependency blip restarts every replica at once (cascading failure).", he: "Liveness probe שבודק DB/services אחרים ← גמגום אחד בתלות עושה restart לכל ה-replicas ביחד (cascading failure)." },
    { en: "Using the same endpoint and thresholds for liveness and readiness: you lose the 'stop traffic but don't kill' middle state.", he: "אותו endpoint ואותם thresholds ל-liveness ול-readiness: מאבדים את מצב הביניים של 'לעצור תעבורה בלי להרוג'." },
    { en: "A huge initialDelaySeconds on liveness instead of a startupProbe: slow boots still get killed sometimes, and real hangs go undetected longer.", he: "initialDelaySeconds ענק על liveness במקום startupProbe: עליות איטיות עדיין נהרגות לפעמים, ותקיעות אמיתיות לא מזוהות יותר זמן." },
    { en: "No preStop delay and an app that exits instantly on SIGTERM → a burst of 502s on every rollout.", he: "בלי preStop delay ואפליקציה שיוצאת מיד ב-SIGTERM ← גל של 502 בכל rollout." }
  ],
  interview: [
    {
      q: { en: "What's the difference between liveness and readiness probes, and what goes wrong if you mix them up?", he: "מה ההבדל בין liveness ל-readiness, ומה משתבש אם מבלבלים ביניהם?" },
      a: { en: "Readiness gates traffic (failing removes the Pod from endpoints); liveness triggers restarts. Putting dependency checks in liveness causes mass restarts during a dependency outage. Having no readiness means traffic hits Pods that are still booting or overloaded, and rollouts can't detect broken versions.", he: "Readiness שולט בתעבורה (כישלון מוציא את ה-Pod מה-endpoints); liveness מפעיל restarts. בדיקות תלויות ב-liveness גורמות ל-restarts המוניים בזמן נפילה של תלות. בלי readiness, תעבורה מגיעה ל-Pods שעוד עולים או עמוסים, ו-rollouts לא מזהים גרסאות שבורות." }
    },
    {
      q: { en: "Users see 502s for a few seconds on every deploy. What's your diagnosis?", he: "משתמשים רואים 502 לכמה שניות בכל deploy. מה האבחנה?" },
      a: { en: "Termination race: Pods exit on SIGTERM before load balancers/kube-proxy stop routing to them, or the app doesn't handle SIGTERM gracefully (or never receives it because PID 1 is a shell). Fix with a preStop sleep (5-15s), graceful drain in the app, an adequate terminationGracePeriodSeconds, readiness probes, and maxUnavailable: 0.", he: "Race בסיום: Pods יוצאים ב-SIGTERM לפני שה-load balancers/kube-proxy מפסיקים לנתב אליהם, או שהאפליקציה לא מטפלת ב-SIGTERM בצורה מסודרת (או לא מקבלת אותו כי PID 1 הוא shell). מתקנים עם preStop sleep (5-15 שניות), drain מסודר באפליקציה, terminationGracePeriodSeconds מספיק, readiness probes ו-maxUnavailable: 0." }
    }
  ],
  quiz: [
    {
      q: { en: "A Pod's readiness probe starts failing. What does Kubernetes do?", he: "ה-readiness probe של Pod מתחיל להיכשל. מה Kubernetes עושה?" },
      options: [
        { en: "Restarts the container", he: "עושה restart לקונטיינר" },
        { en: "Deletes the Pod and creates a new one", he: "מוחק את ה-Pod ויוצר חדש" },
        { en: "Removes the Pod from Service endpoints but keeps it running", he: "מוציא את ה-Pod מה-endpoints של ה-Service אבל משאיר אותו רץ" },
        { en: "Marks the node NotReady", he: "מסמן את ה-node כ-NotReady" }
      ],
      answer: 2,
      explain: { en: "Readiness only controls traffic. Restarts are liveness's job.", he: "Readiness שולט רק בתעבורה. Restarts זה התפקיד של liveness." }
    },
    {
      q: { en: "The DB is down for 60s. All 20 API Pods restart simultaneously, then hammer the DB on reconnect. What caused the restarts?", he: "ה-DB למטה ל-60 שניות. כל 20 ה-Pods של ה-API עושים restart באותו זמן, ואז מפציצים את ה-DB בחיבור מחדש. מה גרם ל-restarts?" },
      options: [
        { en: "The liveness probe checks DB connectivity", he: "ה-liveness probe בודק חיבור ל-DB" },
        { en: "The readiness probe checks DB connectivity", he: "ה-readiness probe בודק חיבור ל-DB" },
        { en: "The HPA scaled down", he: "ה-HPA עשה scale down" },
        { en: "The startupProbe timed out", he: "ה-startupProbe עשה timeout" }
      ],
      answer: 0,
      explain: { en: "Only liveness (or a crash) restarts containers. A readiness check on the DB would remove endpoints, not restart; startupProbe only applies during boot.", he: "רק liveness (או קריסה) עושה restart לקונטיינרים. בדיקת DB ב-readiness הייתה מוציאה endpoints, לא עושה restart; startupProbe רלוונטי רק בזמן עלייה." }
    },
    {
      q: { en: "terminationGracePeriodSeconds is 30 and preStop sleeps 10s. How long does the app have after SIGTERM before SIGKILL?", he: "terminationGracePeriodSeconds הוא 30 ו-preStop ישן 10 שניות. כמה זמן יש לאפליקציה אחרי SIGTERM לפני SIGKILL?" },
      options: [
        { en: "30 seconds", he: "30 שניות" },
        { en: "About 20 seconds", he: "בערך 20 שניות" },
        { en: "40 seconds", he: "40 שניות" },
        { en: "Unlimited, until it exits", he: "בלי הגבלה, עד שהיא יוצאת" }
      ],
      answer: 1,
      explain: { en: "The grace period clock starts before preStop and includes it. 30 - 10 = ~20s left after SIGTERM.", he: "השעון של ה-grace period מתחיל לפני preStop וכולל אותו. 30 - 10 = כ-20 שניות אחרי SIGTERM." }
    },
    {
      q: { en: "A JVM app needs 2 minutes to boot and liveness keeps killing it during startup. Best fix?", he: "אפליקציית JVM צריכה 2 דקות לעלות ו-liveness הורג אותה בזמן העלייה. מה התיקון הכי טוב?" },
      options: [
        { en: "Remove the readiness probe", he: "להסיר את ה-readiness probe" },
        { en: "Set liveness failureThreshold to 1000", he: "לקבוע failureThreshold של liveness ל-1000" },
        { en: "Switch liveness to a tcpSocket probe", he: "להחליף את ה-liveness ל-tcpSocket probe" },
        { en: "Add a startupProbe allowing ~150s (e.g. period 5, failureThreshold 30)", he: "להוסיף startupProbe שמאפשר כ-150 שניות (למשל period 5, failureThreshold 30)" }
      ],
      answer: 3,
      explain: { en: "startupProbe holds off liveness/readiness until boot completes, while liveness can stay strict afterwards. A giant threshold would make real hangs take forever to detect.", he: "startupProbe מעכב את liveness/readiness עד שהעלייה מסתיימת, ו-liveness יכול להישאר הדוק אחר כך. threshold ענק היה גורם לתקיעות אמיתיות להתגלות אחרי נצח." }
    }
  ],
  related: ["k8s-deployments", "k8s-services", "k8s-debugging", "rel-deployments"]
});

// ---------------------------------------------------------------------------
// 10. Storage
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-storage",
  track: "kubernetes",
  order: 10,
  icon: "💾",
  level: 3,
  minutes: 12,
  title: { en: "Storage: Volumes, PV/PVC & StatefulSets", he: "Storage: Volumes, PV/PVC ו-StatefulSets" },
  tldr: {
    en: "Pods ask for storage with a PVC, a StorageClass provisions a PV (a real cloud disk), and StatefulSets give each replica a stable name and its own disk — which is the bare minimum for running databases.",
    he: "Pods מבקשים אחסון עם PVC, StorageClass מקים PV (דיסק אמיתי בענן), ו-StatefulSets נותנים לכל replica שם יציב ודיסק משלו – וזה המינימום ההכרחי כדי להריץ מסדי נתונים."
  },
  analogy: {
    en: "A storage-unit company at the port. A PVC is your rental request form: \"I need 100 GB, climate-controlled, one key holder.\" The StorageClass is the catalog tier (\"premium SSD, Zone A\"). The PV is the actual unit with a number on the door. A StatefulSet is a crew of named dock workers — Dana-0, Dana-1, Dana-2 — each with their own locker that follows them, even if they switch shifts.",
    he: "חברת מחסנים בנמל. PVC זה טופס ההשכרה שלך: \"צריך 100 GB, ממוזג, מחזיק מפתח אחד.\" ה-StorageClass הוא רמת הקטלוג (\"SSD פרימיום, Zone A\"). ה-PV הוא המחסן עצמו עם מספר על הדלת. StatefulSet הוא צוות עובדי רציף עם שמות – דנה-0, דנה-1, דנה-2 – ולכל אחד לוקר משלו שהולך איתו, גם אם הוא מחליף משמרת."
  },
  sections: [
    {
      h: { en: "Volumes: from scratch space to real disks", he: "Volumes: ממקום זמני לדיסקים אמיתיים" },
      body: {
        en: `<p>A container's own filesystem dies with the container. Volumes are mounted in from outside:</p>
<table>
<tr><th>Volume</th><th>Lives as long as</th><th>Use for</th></tr>
<tr><td>emptyDir</td><td>The Pod (survives container restarts)</td><td>Scratch space, sharing files between sidecars. <code>medium: Memory</code> = tmpfs</td></tr>
<tr><td>configMap / secret / projected</td><td>The source object</td><td>Config files, certs, SA tokens</td></tr>
<tr><td>hostPath</td><td>The node</td><td>Node agents only (log collectors). A security risk for apps</td></tr>
<tr><td>persistentVolumeClaim</td><td>Independent of the Pod</td><td>Real data: databases, uploads, queues</td></tr>
</table>
<p>The <strong>CSI</strong> (Container Storage Interface) is how cloud disks plug in: the EBS CSI driver, GCE PD, Azure Disk, Ceph, Longhorn, etc. The driver attaches the disk to the node, formats and mounts it, and bind-mounts it into the Pod.</p>
<blockquote>⚠️ Production tip: emptyDir counts against node ephemeral storage. A runaway log file in emptyDir can fill the node disk and get Pods evicted with <code>DiskPressure</code>. Set <code>sizeLimit</code> and <code>resources.limits.ephemeral-storage</code>.</blockquote>`,
        he: `<p>ה-filesystem של הקונטיינר מת יחד איתו. Volumes מחוברים מבחוץ:</p>
<table>
<tr><th>Volume</th><th>חי כל עוד...</th><th>שימוש</th></tr>
<tr><td>emptyDir</td><td>ה-Pod (שורד restarts של קונטיינר)</td><td>מקום זמני, שיתוף קבצים בין sidecars. <code>medium: Memory</code> = tmpfs</td></tr>
<tr><td>configMap / secret / projected</td><td>אובייקט המקור</td><td>קבצי קונפיג, תעודות, SA tokens</td></tr>
<tr><td>hostPath</td><td>ה-node</td><td>רק ל-agents של node (log collectors). סיכון אבטחה לאפליקציות</td></tr>
<tr><td>persistentVolumeClaim</td><td>בלתי תלוי ב-Pod</td><td>מידע אמיתי: מסדי נתונים, העלאות, תורים</td></tr>
</table>
<p>ה-<strong>CSI</strong> (Container Storage Interface) זה איך דיסקים של ענן מתחברים: ה-EBS CSI driver, GCE PD, Azure Disk, Ceph, Longhorn וכו'. ה-driver מחבר את הדיסק ל-node, מפרמט, עושה mount, ועושה bind-mount לתוך ה-Pod.</p>
<blockquote>⚠️ טיפ לפרודקשן: emptyDir נספר על ה-ephemeral storage של ה-node. קובץ לוג שיצא משליטה ב-emptyDir יכול למלא את הדיסק של ה-node ולגרום ל-eviction של Pods עם <code>DiskPressure</code>. תגדירו <code>sizeLimit</code> ו-<code>resources.limits.ephemeral-storage</code>.</blockquote>`
      }
    },
    {
      h: { en: "PV, PVC, StorageClass and access modes", he: "PV, PVC, StorageClass ו-access modes" },
      body: {
        en: `<pre>apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: gp3 }
provisioner: ebs.csi.aws.com
parameters: { type: gp3, iops: "3000" }
reclaimPolicy: Retain                    # keep the disk if the PVC is deleted
volumeBindingMode: WaitForFirstConsumer  # create the disk in the Pod's zone
allowVolumeExpansion: true
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: uploads }
spec:
  storageClassName: gp3
  accessModes: [ReadWriteOnce]
  resources: { requests: { storage: 100Gi } }</pre>
<p>Flow (<strong>dynamic provisioning</strong>): PVC created → StorageClass's provisioner creates a cloud disk → a PV object represents it → PV is <em>bound</em> 1:1 to the PVC → Pod mounts the PVC.</p>
<table>
<tr><th>Access mode</th><th>Meaning</th><th>Typical backend</th></tr>
<tr><td>ReadWriteOnce (RWO)</td><td>Read-write by Pods on <strong>one node</strong></td><td>EBS, PD, Azure Disk</td></tr>
<tr><td>ReadWriteOncePod</td><td>Exactly one Pod</td><td>CSI block disks</td></tr>
<tr><td>ReadOnlyMany (ROX)</td><td>Many nodes, read-only</td><td>Shared datasets</td></tr>
<tr><td>ReadWriteMany (RWX)</td><td>Many nodes, read-write</td><td>NFS, EFS, Azure Files, CephFS</td></tr>
</table>
<p>Block disks are <strong>zonal</strong>: an EBS volume in eu-west-1a can only attach to nodes in 1a. That's why <code>WaitForFirstConsumer</code> matters.</p>`,
        he: `<pre>apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: gp3 }
provisioner: ebs.csi.aws.com
parameters: { type: gp3, iops: "3000" }
reclaimPolicy: Retain                    # keep the disk if the PVC is deleted
volumeBindingMode: WaitForFirstConsumer  # create the disk in the Pod's zone
allowVolumeExpansion: true
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: uploads }
spec:
  storageClassName: gp3
  accessModes: [ReadWriteOnce]
  resources: { requests: { storage: 100Gi } }</pre>
<p>הזרימה (<strong>dynamic provisioning</strong>): נוצר PVC ← ה-provisioner של ה-StorageClass יוצר דיסק בענן ← אובייקט PV מייצג אותו ← ה-PV עושה <em>bind</em> של 1:1 ל-PVC ← ה-Pod עושה mount ל-PVC.</p>
<table>
<tr><th>Access mode</th><th>משמעות</th><th>Backend טיפוסי</th></tr>
<tr><td>ReadWriteOnce (RWO)</td><td>קריאה-כתיבה ע"י Pods על <strong>node אחד</strong></td><td>EBS, PD, Azure Disk</td></tr>
<tr><td>ReadWriteOncePod</td><td>Pod אחד בדיוק</td><td>דיסקי block של CSI</td></tr>
<tr><td>ReadOnlyMany (ROX)</td><td>הרבה nodes, קריאה בלבד</td><td>datasets משותפים</td></tr>
<tr><td>ReadWriteMany (RWX)</td><td>הרבה nodes, קריאה-כתיבה</td><td>NFS, EFS, Azure Files, CephFS</td></tr>
</table>
<p>דיסקי block הם <strong>zonal</strong>: EBS volume ב-eu-west-1a יכול להתחבר רק ל-nodes ב-1a. בגלל זה <code>WaitForFirstConsumer</code> חשוב.</p>`
      }
    },
    {
      h: { en: "StatefulSets: stable identity", he: "StatefulSets: זהות יציבה" },
      body: {
        en: `<pre>apiVersion: apps/v1
kind: StatefulSet
metadata: { name: postgres }
spec:
  serviceName: postgres          # a headless Service (clusterIP: None)
  replicas: 3
  selector: { matchLabels: { app: postgres } }
  template:
    metadata: { labels: { app: postgres } }
    spec:
      containers:
      - name: pg
        image: postgres:16
        volumeMounts: [{ name: data, mountPath: /var/lib/postgresql/data }]
  volumeClaimTemplates:
  - metadata: { name: data }
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: gp3
      resources: { requests: { storage: 200Gi } }</pre>
<p>What a StatefulSet gives you that a Deployment doesn't:</p>
<ul>
<li><strong>Stable names</strong>: <code>postgres-0</code>, <code>postgres-1</code>, <code>postgres-2</code> — not random hashes.</li>
<li><strong>Stable DNS</strong>: <code>postgres-0.postgres.db.svc.cluster.local</code> via the headless Service.</li>
<li><strong>Per-replica storage</strong>: PVC <code>data-postgres-0</code> always reattaches to <code>postgres-0</code>, wherever it's rescheduled.</li>
<li><strong>Ordered</strong> start (0, 1, 2) and reverse-ordered stop and updates — unless <code>podManagementPolicy: Parallel</code>.</li>
</ul>
<p>Scaling down or deleting a StatefulSet does <strong>not</strong> delete its PVCs by default — a deliberate safety net for your data (and a slow leak on your cloud bill).</p>`,
        he: `<pre>apiVersion: apps/v1
kind: StatefulSet
metadata: { name: postgres }
spec:
  serviceName: postgres          # a headless Service (clusterIP: None)
  replicas: 3
  selector: { matchLabels: { app: postgres } }
  template:
    metadata: { labels: { app: postgres } }
    spec:
      containers:
      - name: pg
        image: postgres:16
        volumeMounts: [{ name: data, mountPath: /var/lib/postgresql/data }]
  volumeClaimTemplates:
  - metadata: { name: data }
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: gp3
      resources: { requests: { storage: 200Gi } }</pre>
<p>מה StatefulSet נותן ש-Deployment לא:</p>
<ul>
<li><strong>שמות יציבים</strong>: <code>postgres-0</code>, <code>postgres-1</code>, <code>postgres-2</code> – לא hashes אקראיים.</li>
<li><strong>DNS יציב</strong>: <code>postgres-0.postgres.db.svc.cluster.local</code> דרך ה-headless Service.</li>
<li><strong>אחסון לכל replica</strong>: ה-PVC <code>data-postgres-0</code> תמיד מתחבר מחדש ל-<code>postgres-0</code>, לא משנה לאן הוא משובץ.</li>
<li>עלייה <strong>מסודרת</strong> (0, 1, 2) וירידה ועדכונים בסדר הפוך – אלא אם <code>podManagementPolicy: Parallel</code>.</li>
</ul>
<p>Scale down או מחיקה של StatefulSet <strong>לא</strong> מוחקים את ה-PVCs כברירת מחדל – רשת ביטחון מכוונת למידע שלך (ודליפה איטית בחשבון הענן).</p>`
      }
    },
    {
      h: { en: "Why running databases on Kubernetes is hard", he: "למה להריץ מסדי נתונים על Kubernetes זה קשה" },
      body: {
        en: `<p>A StatefulSet gives identity and disks. It does <strong>not</strong> give you a database cluster. Kubernetes doesn't know who is the Postgres primary, how to promote a replica, how to take consistent backups, or how to do a major version upgrade. On top of that:</p>
<ul>
<li>Pods get rescheduled during drains/upgrades — every move is a detach/attach of a disk (30s-minutes) and a failover.</li>
<li>Zonal disks pin a replica to one AZ; if the AZ is out, that replica waits.</li>
<li>Noisy neighbors on shared nodes hurt tail latency; memory limits can OOMKill your DB mid-transaction.</li>
<li>Split-brain risk: if a node is partitioned rather than dead, a careless failover produces two primaries.</li>
</ul>
<p>The answer is an <strong>operator</strong> — a controller that encodes DBA knowledge: CloudNativePG / Zalando for Postgres, Strimzi for Kafka, the MongoDB / Redis operators, Vitess. Or simply use a managed service (RDS, Cloud SQL, Aurora) and keep k8s for stateless apps.</p>
<blockquote>💡 Real world: a very common, sane setup is "everything stateless on k8s, the primary database on RDS/Cloud SQL, caches and queues either managed or via a mature operator". Go stateful-on-k8s when you have the team to run it, not because it's trendy.</blockquote>`,
        he: `<p>StatefulSet נותן זהות ודיסקים. הוא <strong>לא</strong> נותן לך cluster של DB. Kubernetes לא יודע מי ה-primary של Postgres, איך לקדם replica, איך לקחת גיבוי עקבי או איך לעשות שדרוג major version. ומעבר לזה:</p>
<ul>
<li>Pods משובצים מחדש בזמן drains/שדרוגים – כל מעבר הוא ניתוק וחיבור של דיסק (30 שניות עד דקות) ו-failover.</li>
<li>דיסקים zonal נועלים replica ל-AZ אחד; אם ה-AZ נופל, ה-replica מחכה.</li>
<li>Noisy neighbors על nodes משותפים פוגעים ב-tail latency; memory limits יכולים לעשות OOMKill ל-DB באמצע transaction.</li>
<li>סיכון split-brain: אם node מנותק מהרשת ולא מת, failover לא זהיר יוצר שני primaries.</li>
</ul>
<p>התשובה היא <strong>operator</strong> – controller שמקודד ידע של DBA: CloudNativePG / Zalando ל-Postgres, Strimzi ל-Kafka, ה-operators של MongoDB / Redis, Vitess. או פשוט להשתמש בשירות מנוהל (RDS, Cloud SQL, Aurora) ולהשאיר את k8s לאפליקציות stateless.</p>
<blockquote>💡 מהשטח: setup נפוץ ושפוי מאוד הוא "כל מה שהוא stateless על k8s, ה-DB הראשי על RDS/Cloud SQL, caches ותורים מנוהלים או דרך operator בוגר". הולכים ל-stateful על k8s כשיש צוות שיודע להריץ את זה, לא כי זה טרנדי.</blockquote>`
      }
    }
  ],
  diagram: `StatefulSet postgres (headless svc "postgres")
  postgres-0 --mount--> PVC data-postgres-0 --bound--> PV pvc-8f2.. --> EBS vol-0a1 (eu-west-1a)
  postgres-1 --mount--> PVC data-postgres-1 --bound--> PV pvc-3c9.. --> EBS vol-0b7 (eu-west-1b)
  postgres-2 --mount--> PVC data-postgres-2 --bound--> PV pvc-d41.. --> EBS vol-0c3 (eu-west-1c)
 DNS: postgres-0.postgres.db.svc.cluster.local  (stable across restarts)`,
  handsOn: [
    { cmd: "kubectl get storageclass", what: { en: "See available StorageClasses and which one is the default.", he: "לראות אילו StorageClasses יש ומי ברירת המחדל." } },
    { cmd: "kubectl get pvc,pv -A", what: { en: "List claims and the volumes they're bound to (STATUS should be Bound).", he: "לראות claims וה-volumes שהם קשורים אליהם (ה-STATUS צריך להיות Bound)." } },
    { cmd: "kubectl describe pvc uploads", what: { en: "Debug a Pending PVC: no default StorageClass, waiting for first consumer, or provisioning errors.", he: "לדבג PVC ב-Pending: אין StorageClass ברירת מחדל, מחכה ל-first consumer, או שגיאות provisioning." } },
    { cmd: "kubectl patch pvc uploads -p '{\"spec\":{\"resources\":{\"requests\":{\"storage\":\"200Gi\"}}}}'", what: { en: "Expand a volume online (needs allowVolumeExpansion: true). Shrinking is not supported.", he: "להגדיל volume אונליין (צריך allowVolumeExpansion: true). הקטנה לא נתמכת." } },
    { cmd: "kubectl exec -it postgres-0 -- df -h /var/lib/postgresql/data", what: { en: "Check real disk usage from inside the Pod before it fills up.", he: "לבדוק שימוש אמיתי בדיסק מתוך ה-Pod לפני שהוא מתמלא." } }
  ],
  mnemonic: {
    en: "\"Class makes, Claim asks, Volume is.\" StorageClass = the factory, PVC = the order, PV = the delivered disk. StatefulSet = \"same name, same disk, same address.\"",
    he: "\"Class מייצר, Claim מבקש, Volume קיים.\" StorageClass = המפעל, PVC = ההזמנה, PV = הדיסק שנמסר. StatefulSet = \"אותו שם, אותו דיסק, אותה כתובת.\""
  },
  pitfalls: [
    { en: "Using a Deployment with replicas: 3 and one RWO PVC — only Pods on one node can mount it, the rest hang in ContainerCreating with Multi-Attach errors.", he: "להשתמש ב-Deployment עם replicas: 3 ו-PVC אחד מסוג RWO – רק Pods על node אחד יכולים לעשות mount, השאר תקועים ב-ContainerCreating עם שגיאות Multi-Attach." },
    { en: "reclaimPolicy: Delete on production data: deleting the PVC (or the namespace) deletes the cloud disk. Use Retain plus snapshots.", he: "reclaimPolicy: Delete על מידע של פרודקשן: מחיקה של ה-PVC (או ה-namespace) מוחקת את הדיסק בענן. להשתמש ב-Retain ועוד snapshots." },
    { en: "Immediate binding mode with zonal disks: the disk gets created in zone A, the Pod can only fit in zone B → stuck Pending.", he: "binding mode של Immediate עם דיסקים zonal: הדיסק נוצר ב-zone A, וה-Pod נכנס רק ב-zone B ← תקוע ב-Pending." },
    { en: "Treating a StatefulSet as a database HA solution. It doesn't handle replication, failover or backups — you need an operator or a managed DB.", he: "להתייחס ל-StatefulSet כפתרון HA ל-DB. הוא לא מטפל ב-replication, failover או גיבויים – צריך operator או DB מנוהל." }
  ],
  interview: [
    {
      q: { en: "Explain PV, PVC and StorageClass and how they relate.", he: "תסביר PV, PVC ו-StorageClass ואיך הם קשורים." },
      a: { en: "A PVC is a namespaced request for storage (size, access mode, class). A StorageClass defines how to dynamically provision it (CSI driver, disk type, reclaim and binding policy). A PV is the cluster-scoped object representing the actual provisioned volume, bound 1:1 to the PVC. Pods reference only the PVC, decoupling apps from storage details.", he: "PVC הוא בקשה ל-storage ברמת namespace (גודל, access mode, class). StorageClass מגדיר איך להקים אותו דינמית (CSI driver, סוג דיסק, מדיניות reclaim ו-binding). PV הוא אובייקט ברמת ה-cluster שמייצג את ה-volume שהוקם בפועל, קשור 1:1 ל-PVC. Pods מפנים רק ל-PVC, וזה מנתק את האפליקציה מפרטי האחסון." }
    },
    {
      q: { en: "When would you use a StatefulSet over a Deployment?", he: "מתי תשתמש ב-StatefulSet ולא ב-Deployment?" },
      a: { en: "When each replica needs a stable identity (name, DNS) and its own persistent volume, and/or ordered startup — databases, Kafka brokers, ZooKeeper/etcd, Elasticsearch. For stateless apps a Deployment is simpler and rolls faster.", he: "כשכל replica צריך זהות יציבה (שם, DNS) ו-volume קבוע משלו, ו/או עלייה מסודרת – מסדי נתונים, Kafka brokers, ZooKeeper/etcd, Elasticsearch. לאפליקציות stateless, Deployment פשוט יותר ומתגלגל מהר יותר." }
    }
  ],
  quiz: [
    {
      q: { en: "Three replicas on three different nodes all need to read and write the same shared directory. Which access mode/backend fits?", he: "שלושה replicas על שלושה nodes שונים צריכים לקרוא ולכתוב לאותה תיקייה משותפת. איזה access mode/backend מתאים?" },
      options: [
        { en: "ReadWriteOnce on EBS", he: "ReadWriteOnce על EBS" },
        { en: "ReadWriteMany on EFS/NFS", he: "ReadWriteMany על EFS/NFS" },
        { en: "emptyDir", he: "emptyDir" },
        { en: "ReadWriteOncePod", he: "ReadWriteOncePod" }
      ],
      answer: 1,
      explain: { en: "Block disks (EBS) attach to one node at a time. Shared read-write across nodes needs a network filesystem with RWX.", he: "דיסקי block (EBS) מתחברים ל-node אחד בכל פעם. כתיבה משותפת בין nodes צריכה network filesystem עם RWX." }
    },
    {
      q: { en: "You scale a StatefulSet from 3 to 1. What happens to PVCs data-db-1 and data-db-2?", he: "הורדת StatefulSet מ-3 ל-1. מה קורה ל-PVCs בשם data-db-1 ו-data-db-2?" },
      options: [
        { en: "They're deleted along with the Pods", he: "הם נמחקים יחד עם ה-Pods" },
        { en: "They're merged into data-db-0", he: "הם מתמזגים ל-data-db-0" },
        { en: "They're kept by default, and reattach if you scale back up", he: "הם נשמרים כברירת מחדל, ומתחברים מחדש אם עושים scale up" },
        { en: "They're converted to emptyDir", he: "הם הופכים ל-emptyDir" }
      ],
      answer: 2,
      explain: { en: "StatefulSets retain PVCs by default to protect data (configurable via persistentVolumeClaimRetentionPolicy). Scale back to 3 and db-1/db-2 get their old disks.", he: "StatefulSets שומרים PVCs כברירת מחדל כדי להגן על מידע (אפשר לשנות עם persistentVolumeClaimRetentionPolicy). עושים scale חזרה ל-3 ו-db-1/db-2 מקבלים את הדיסקים הישנים." }
    },
    {
      q: { en: "Why use volumeBindingMode: WaitForFirstConsumer for EBS-backed StorageClasses?", he: "למה להשתמש ב-volumeBindingMode: WaitForFirstConsumer ב-StorageClass של EBS?" },
      options: [
        { en: "So the disk is created in the same zone where the Pod is scheduled", he: "כדי שהדיסק ייווצר באותו zone שבו ה-Pod משובץ" },
        { en: "It makes provisioning faster", he: "זה מאיץ את ה-provisioning" },
        { en: "It enables ReadWriteMany", he: "זה מאפשר ReadWriteMany" },
        { en: "It encrypts the volume", he: "זה מצפין את ה-volume" }
      ],
      answer: 0,
      explain: { en: "EBS volumes are zonal. Delaying creation until scheduling lets the scheduler pick a node first, then the disk is created in that node's zone.", he: "EBS volumes הם zonal. דחיית היצירה עד ה-scheduling נותנת ל-scheduler לבחור node קודם, ואז הדיסק נוצר ב-zone של אותו node." }
    }
  ],
  related: ["k8s-deployments", "k8s-scheduling", "k8s-services"]
});

// ---------------------------------------------------------------------------
// 11. Namespaces, RBAC, NetworkPolicy, Pod Security
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-namespaces-rbac",
  track: "kubernetes",
  order: 11,
  icon: "🛡️",
  level: 2,
  minutes: 12,
  title: { en: "Namespaces, RBAC, NetworkPolicy & Pod Security", he: "Namespaces, RBAC, NetworkPolicy ו-Pod Security" },
  tldr: {
    en: "Namespaces scope names and policies, RBAC decides who can do what to which objects, NetworkPolicy decides which Pods can talk (default: everyone!), and Pod Security blocks dangerous Pod specs.",
    he: "Namespaces תוחמים שמות ומדיניות, RBAC מחליט מי יכול לעשות מה לאילו אובייקטים, NetworkPolicy מחליט אילו Pods יכולים לדבר (ברירת מחדל: כולם!), ו-Pod Security חוסם הגדרות Pod מסוכנות."
  },
  analogy: {
    en: "An office building. Namespaces are the floors — each team has its own, with its own room names. RBAC is the badge system: your badge opens specific doors (verbs) on specific floors (namespaces). NetworkPolicy is the internal walls — and in a fresh Kubernetes building there are none: it's one giant open space where anyone can walk up to anyone's desk. Pod Security is the guard at the entrance who won't let you in with a crowbar (privileged: true).",
    he: "בניין משרדים. Namespaces הם הקומות – לכל צוות קומה משלו, עם שמות חדרים משלו. RBAC הוא מערכת התגים: התג שלך פותח דלתות מסוימות (verbs) בקומות מסוימות (namespaces). NetworkPolicy הם הקירות הפנימיים – ובבניין Kubernetes חדש אין אף אחד: זה open space ענק שבו כל אחד יכול לגשת לשולחן של כל אחד. Pod Security הוא השומר בכניסה שלא נותן לך להיכנס עם לום (privileged: true)."
  },
  sections: [
    {
      h: { en: "Namespaces: soft boundaries", he: "Namespaces: גבולות רכים" },
      body: {
        en: `<p>A namespace is a scope for names (two teams can each have a Service called <code>api</code>) and an attachment point for policy: RBAC, ResourceQuota, LimitRange, NetworkPolicy, Pod Security labels. Common splits: per team, per app, per environment (<code>shop-staging</code>, <code>shop-prod</code>) — though many orgs run prod and non-prod in <em>separate clusters</em>.</p>
<p>What namespaces are <strong>not</strong>: a security boundary on their own. Without NetworkPolicy, Pods in different namespaces talk freely. They share the same nodes and kernel. And some objects are cluster-scoped: Nodes, PersistentVolumes, StorageClasses, ClusterRoles, CRDs, Namespaces themselves.</p>
<pre>kubectl create namespace shop
kubectl config set-context --current --namespace=shop   # stop typing -n
kubectl api-resources --namespaced=false                # what's cluster-wide</pre>
<blockquote>⚠️ Production tip: <code>kubectl delete namespace X</code> deletes <em>everything</em> inside it — Deployments, Secrets, PVCs (and with reclaimPolicy Delete, the disks). There's no undo. Some teams protect prod namespaces with admission policies or finalizers.</blockquote>`,
        he: `<p>Namespace הוא תחום לשמות (לשני צוותים יכול להיות Service בשם <code>api</code>) ונקודת חיבור למדיניות: RBAC, ResourceQuota, LimitRange, NetworkPolicy, labels של Pod Security. חלוקות נפוצות: לפי צוות, לפי אפליקציה, לפי סביבה (<code>shop-staging</code>, <code>shop-prod</code>) – למרות שהרבה ארגונים מריצים prod ו-non-prod ב-<em>clusters נפרדים</em>.</p>
<p>מה namespaces <strong>לא</strong>: גבול אבטחה בפני עצמם. בלי NetworkPolicy, Pods ב-namespaces שונים מדברים חופשי. הם חולקים את אותם nodes ואותו kernel. ויש אובייקטים ברמת ה-cluster: Nodes, PersistentVolumes, StorageClasses, ClusterRoles, CRDs, ו-Namespaces עצמם.</p>
<pre>kubectl create namespace shop
kubectl config set-context --current --namespace=shop   # stop typing -n
kubectl api-resources --namespaced=false                # what's cluster-wide</pre>
<blockquote>⚠️ טיפ לפרודקשן: <code>kubectl delete namespace X</code> מוחק <em>הכל</em> בתוכו – Deployments, Secrets, PVCs (ועם reclaimPolicy Delete, גם את הדיסקים). אין undo. יש צוותים שמגנים על namespaces של prod עם admission policies או finalizers.</blockquote>`
      }
    },
    {
      h: { en: "RBAC: subjects, verbs, resources", he: "RBAC: subjects, verbs, resources" },
      body: {
        en: `<p>RBAC answers: can <strong>subject</strong> (User, Group, ServiceAccount) do <strong>verb</strong> (get, list, watch, create, update, patch, delete) on <strong>resource</strong> (pods, secrets, deployments) in <strong>scope</strong> (namespace or cluster)? It's allow-only — there are no deny rules.</p>
<pre>apiVersion: rbac.authorization.k8s.io/v1
kind: Role                         # namespaced. ClusterRole = cluster-wide or reusable
metadata: { name: pod-reader, namespace: shop }
rules:
- apiGroups: [""]                  # "" = core group (pods, services, secrets)
  resources: [pods, pods/log]
  verbs: [get, list, watch]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: ci-reads-pods, namespace: shop }
subjects:
- kind: ServiceAccount
  name: ci-bot
  namespace: shop
roleRef: { kind: Role, name: pod-reader, apiGroup: rbac.authorization.k8s.io }</pre>
<p>Four objects, two axes: <strong>Role</strong>/<strong>ClusterRole</strong> define permissions; <strong>RoleBinding</strong>/<strong>ClusterRoleBinding</strong> grant them. A RoleBinding can reference a ClusterRole to grant it <em>inside one namespace</em> — the standard way to reuse <code>view</code>, <code>edit</code>, <code>admin</code>.</p>
<p><strong>ServiceAccounts</strong> are identities for Pods. Each Pod gets a short-lived projected token for its SA. If your app doesn't call the k8s API, set <code>automountServiceAccountToken: false</code>. Cloud IAM for Pods (IRSA, Workload Identity) also maps through the ServiceAccount.</p>`,
        he: `<p>RBAC עונה על השאלה: האם <strong>subject</strong> (User, Group, ServiceAccount) יכול לעשות <strong>verb</strong> (get, list, watch, create, update, patch, delete) על <strong>resource</strong> (pods, secrets, deployments) ב-<strong>scope</strong> (namespace או cluster)? זה allow-only – אין חוקי deny.</p>
<pre>apiVersion: rbac.authorization.k8s.io/v1
kind: Role                         # namespaced. ClusterRole = cluster-wide or reusable
metadata: { name: pod-reader, namespace: shop }
rules:
- apiGroups: [""]                  # "" = core group (pods, services, secrets)
  resources: [pods, pods/log]
  verbs: [get, list, watch]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: ci-reads-pods, namespace: shop }
subjects:
- kind: ServiceAccount
  name: ci-bot
  namespace: shop
roleRef: { kind: Role, name: pod-reader, apiGroup: rbac.authorization.k8s.io }</pre>
<p>ארבעה אובייקטים, שני צירים: <strong>Role</strong>/<strong>ClusterRole</strong> מגדירים הרשאות; <strong>RoleBinding</strong>/<strong>ClusterRoleBinding</strong> מעניקים אותן. RoleBinding יכול להפנות ל-ClusterRole כדי להעניק אותו <em>בתוך namespace אחד</em> – הדרך הסטנדרטית לעשות שימוש חוזר ב-<code>view</code>, <code>edit</code>, <code>admin</code>.</p>
<p><strong>ServiceAccounts</strong> הם זהויות ל-Pods. כל Pod מקבל token קצר-חיים (projected) ל-SA שלו. אם האפליקציה לא קוראת ל-API של k8s, תגדירו <code>automountServiceAccountToken: false</code>. גם IAM של הענן ל-Pods (IRSA, Workload Identity) ממופה דרך ה-ServiceAccount.</p>`
      }
    },
    {
      h: { en: "NetworkPolicy: the default is allow-all", he: "NetworkPolicy: ברירת המחדל היא allow-all" },
      body: {
        en: `<p>Out of the box, <strong>every Pod can reach every other Pod in every namespace</strong>. A compromised frontend can talk straight to your Postgres in another namespace. NetworkPolicies add L3/L4 firewall rules — and once any policy selects a Pod for a direction (ingress/egress), everything not explicitly allowed in that direction is denied.</p>
<pre># 1) default-deny all ingress in the namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: shop }
spec:
  podSelector: {}               # all Pods in the namespace
  policyTypes: [Ingress]
---
# 2) allow only the api Pods to reach postgres on 5432
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: postgres-from-api, namespace: shop }
spec:
  podSelector: { matchLabels: { app: postgres } }
  ingress:
  - from:
    - podSelector: { matchLabels: { app: api } }
    ports: [{ protocol: TCP, port: 5432 }]</pre>
<blockquote>⚠️ Production tip: NetworkPolicy is enforced by the <strong>CNI</strong>, not by Kubernetes. On a CNI without support (old flannel, some defaults) your policies are silently ignored. And with default-deny <em>egress</em>, remember to allow DNS (UDP/TCP 53 to kube-dns) or every lookup fails.</blockquote>`,
        he: `<p>מהקופסה, <strong>כל Pod יכול להגיע לכל Pod אחר בכל namespace</strong>. Frontend שנפרץ יכול לדבר ישר עם ה-Postgres שלך ב-namespace אחר. NetworkPolicies מוסיפים חוקי firewall ב-L3/L4 – וברגע שמדיניות כלשהי בוחרת Pod בכיוון מסוים (ingress/egress), כל מה שלא הותר במפורש באותו כיוון נחסם.</p>
<pre># 1) default-deny all ingress in the namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: shop }
spec:
  podSelector: {}               # all Pods in the namespace
  policyTypes: [Ingress]
---
# 2) allow only the api Pods to reach postgres on 5432
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: postgres-from-api, namespace: shop }
spec:
  podSelector: { matchLabels: { app: postgres } }
  ingress:
  - from:
    - podSelector: { matchLabels: { app: api } }
    ports: [{ protocol: TCP, port: 5432 }]</pre>
<blockquote>⚠️ טיפ לפרודקשן: NetworkPolicy נאכף ע"י ה-<strong>CNI</strong>, לא ע"י Kubernetes. על CNI בלי תמיכה (flannel ישן, חלק מברירות המחדל) המדיניות שלך פשוט מתעלמת בשקט. ועם default-deny ל-<em>egress</em>, לא לשכוח לאפשר DNS (UDP/TCP 53 ל-kube-dns), אחרת כל lookup נכשל.</blockquote>`
      }
    },
    {
      h: { en: "Pod Security: no crowbars allowed", he: "Pod Security: אסור להיכנס עם לום" },
      body: {
        en: `<p>A Pod with <code>privileged: true</code>, <code>hostPID</code>, <code>hostNetwork</code> or a <code>hostPath: /</code> mount is basically root on the node — and from the node, often the cluster. <strong>Pod Security Admission</strong> (built in, replaced PodSecurityPolicy in v1.25) enforces one of three profiles per namespace via labels:</p>
<ul>
<li><strong>privileged</strong> — anything goes (system namespaces, CNI, node agents).</li>
<li><strong>baseline</strong> — blocks the known escalations: privileged, host namespaces, hostPath, dangerous capabilities.</li>
<li><strong>restricted</strong> — hardened: must run as non-root, drop ALL capabilities, no privilege escalation, seccomp RuntimeDefault.</li>
</ul>
<pre>kubectl label ns shop \
  pod-security.kubernetes.io/enforce=baseline \
  pod-security.kubernetes.io/warn=restricted</pre>
<pre>securityContext:                 # what a 'restricted'-compliant container looks like
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: [ALL] }
  seccompProfile: { type: RuntimeDefault }</pre>
<p>For custom rules ("images only from our registry", "every Pod must have resource limits") teams add Kyverno, OPA Gatekeeper, or the built-in ValidatingAdmissionPolicy (CEL).</p>`,
        he: `<p>Pod עם <code>privileged: true</code>, <code>hostPID</code>, <code>hostNetwork</code> או mount של <code>hostPath: /</code> הוא בעצם root על ה-node – ומה-node, הרבה פעמים גם על ה-cluster. <strong>Pod Security Admission</strong> (מובנה, החליף את PodSecurityPolicy ב-v1.25) אוכף אחד משלושה פרופילים לכל namespace דרך labels:</p>
<ul>
<li><strong>privileged</strong> – הכל מותר (namespaces של המערכת, CNI, agents של nodes).</li>
<li><strong>baseline</strong> – חוסם את ההסלמות המוכרות: privileged, host namespaces, hostPath, capabilities מסוכנים.</li>
<li><strong>restricted</strong> – מוקשח: חייב לרוץ כ-non-root, drop ל-ALL capabilities, בלי privilege escalation, seccomp RuntimeDefault.</li>
</ul>
<pre>kubectl label ns shop \
  pod-security.kubernetes.io/enforce=baseline \
  pod-security.kubernetes.io/warn=restricted</pre>
<pre>securityContext:                 # what a 'restricted'-compliant container looks like
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: [ALL] }
  seccompProfile: { type: RuntimeDefault }</pre>
<p>לחוקים מותאמים ("images רק מה-registry שלנו", "לכל Pod חייבים resource limits") צוותים מוסיפים Kyverno, OPA Gatekeeper, או את ValidatingAdmissionPolicy המובנה (CEL).</p>`
      }
    }
  ],
  diagram: `request: "can SA shop/ci-bot list pods in shop?"
   API server -> AuthN (token) -> AuthZ (RBAC: RoleBinding -> Role rules) -> Admission (Pod Security, Kyverno) -> etcd
 network (after default-deny in ns shop):
   [web] --X--> [postgres]      [api] --5432--> [postgres]     [other-ns/pod] --X--> [postgres]`,
  handsOn: [
    { cmd: "kubectl auth can-i --list --as=system:serviceaccount:shop:ci-bot -n shop", what: { en: "List everything a ServiceAccount is allowed to do in a namespace.", he: "לראות כל מה ש-ServiceAccount מורשה לעשות ב-namespace." } },
    { cmd: "kubectl auth can-i delete deployments -n prod", what: { en: "Check your own permissions before you do something scary.", he: "לבדוק את ההרשאות שלך לפני שעושים משהו מפחיד." } },
    { cmd: "kubectl get rolebindings,clusterrolebindings -A -o wide | grep -i cluster-admin", what: { en: "Audit who has cluster-admin — the list should be very short.", he: "לבדוק למי יש cluster-admin – הרשימה צריכה להיות קצרה מאוד." } },
    { cmd: "kubectl run probe --rm -it --image=busybox:1.36 -n other --restart=Never -- nc -zv -w 2 postgres.shop 5432", what: { en: "Test whether a NetworkPolicy actually blocks cross-namespace traffic.", he: "לבדוק אם NetworkPolicy באמת חוסם תעבורה בין namespaces." } },
    { cmd: "kubectl label --dry-run=server --overwrite ns shop pod-security.kubernetes.io/enforce=restricted", what: { en: "Dry-run a stricter Pod Security level: the server warns which existing Pods would violate it.", he: "dry-run לרמת Pod Security מחמירה יותר: השרת מזהיר אילו Pods קיימים יפרו אותה." } }
  ],
  mnemonic: {
    en: "\"Who, What, Where\": Subject (who) + Verb on Resource (what) + Namespace/Cluster (where). Role = what, Binding = who. And for the network: \"Kubernetes is an open-space office until you build walls.\"",
    he: "\"מי, מה, איפה\": Subject (מי) + Verb על Resource (מה) + Namespace/Cluster (איפה). Role = מה, Binding = מי. ולרשת: \"Kubernetes זה open space עד שבונים קירות.\""
  },
  pitfalls: [
    { en: "Assuming namespaces isolate network traffic. Without NetworkPolicy (and a CNI that enforces it), everything can reach everything.", he: "להניח ש-namespaces מבודדים תעבורת רשת. בלי NetworkPolicy (ו-CNI שאוכף אותו), כולם מגיעים לכולם." },
    { en: "Granting cluster-admin to CI pipelines or Helm 'to make it work'. A leaked CI token then owns the whole cluster.", he: "לתת cluster-admin ל-CI pipelines או ל-Helm 'כדי שיעבוד'. token של CI שדלף מחזיק אז את כל ה-cluster." },
    { en: "Giving 'list secrets' casually: list returns full Secret contents, not just names.", he: "לתת 'list secrets' בקלות: list מחזיר את כל התוכן של ה-Secrets, לא רק שמות." },
    { en: "Default-deny egress without a DNS exception → every Pod in the namespace suddenly can't resolve anything.", he: "Default-deny ל-egress בלי חריגה ל-DNS ← כל ה-Pods ב-namespace פתאום לא מצליחים לפתור שום שם." }
  ],
  interview: [
    {
      q: { en: "Explain Role vs ClusterRole and RoleBinding vs ClusterRoleBinding.", he: "תסביר Role מול ClusterRole ו-RoleBinding מול ClusterRoleBinding." },
      a: { en: "Role defines permissions within one namespace; ClusterRole defines them cluster-wide or for cluster-scoped resources (nodes, PVs) or as a reusable template. RoleBinding grants a Role or ClusterRole within one namespace; ClusterRoleBinding grants a ClusterRole across all namespaces. Use RoleBinding + ClusterRole for least privilege with reuse.", he: "Role מגדיר הרשאות בתוך namespace אחד; ClusterRole מגדיר אותן לכל ה-cluster, או למשאבים ברמת cluster (nodes, PVs), או כתבנית לשימוש חוזר. RoleBinding מעניק Role או ClusterRole בתוך namespace אחד; ClusterRoleBinding מעניק ClusterRole בכל ה-namespaces. RoleBinding + ClusterRole נותן least privilege עם שימוש חוזר." }
    },
    {
      q: { en: "How would you isolate a multi-tenant cluster?", he: "איך היית מבודד cluster עם כמה tenants?" },
      a: { en: "Namespace per tenant; RBAC scoped with RoleBindings; default-deny NetworkPolicies with explicit allows; ResourceQuota and LimitRange; Pod Security 'restricted'; admission policies (Kyverno/Gatekeeper) for registries and labels; separate node pools with taints for sensitive tenants. For hostile tenants, use separate clusters or sandboxed runtimes (gVisor, Kata), since namespaces share a kernel.", he: "Namespace לכל tenant; RBAC מוגבל עם RoleBindings; NetworkPolicies של default-deny עם היתרים מפורשים; ResourceQuota ו-LimitRange; Pod Security 'restricted'; admission policies (Kyverno/Gatekeeper) ל-registries ו-labels; node pools נפרדים עם taints ל-tenants רגישים. ל-tenants עוינים – clusters נפרדים או sandboxed runtimes (gVisor, Kata), כי namespaces חולקים kernel." }
    }
  ],
  quiz: [
    {
      q: { en: "In a fresh cluster with no NetworkPolicies, can a Pod in namespace 'dev' connect to a database Pod in 'prod'?", he: "ב-cluster חדש בלי NetworkPolicies, האם Pod ב-namespace 'dev' יכול להתחבר ל-Pod של DB ב-'prod'?" },
      options: [
        { en: "No, namespaces block cross-namespace traffic", he: "לא, namespaces חוסמים תעבורה בין namespaces" },
        { en: "Yes, Pod networking is allow-all by default", he: "כן, הרשת של Pods היא allow-all כברירת מחדל" },
        { en: "Only if they share a ServiceAccount", he: "רק אם הם חולקים ServiceAccount" },
        { en: "Only through an Ingress", he: "רק דרך Ingress" }
      ],
      answer: 1,
      explain: { en: "Kubernetes' network model is flat: every Pod can reach every Pod. Isolation requires NetworkPolicies and a CNI that enforces them.", he: "מודל הרשת של Kubernetes שטוח: כל Pod מגיע לכל Pod. בידוד דורש NetworkPolicies ו-CNI שאוכף אותם." }
    },
    {
      q: { en: "You want to give a team the built-in 'edit' ClusterRole, but only in namespace 'payments'. What do you create?", he: "רוצים לתת לצוות את ה-ClusterRole המובנה 'edit', אבל רק ב-namespace 'payments'. מה יוצרים?" },
      options: [
        { en: "A ClusterRoleBinding to 'edit'", he: "ClusterRoleBinding ל-'edit'" },
        { en: "A copy of 'edit' as a new ClusterRole", he: "עותק של 'edit' כ-ClusterRole חדש" },
        { en: "A RoleBinding in 'payments' referencing ClusterRole 'edit'", he: "RoleBinding ב-'payments' שמפנה ל-ClusterRole 'edit'" },
        { en: "A NetworkPolicy allowing the team", he: "NetworkPolicy שמאפשר לצוות" }
      ],
      answer: 2,
      explain: { en: "A RoleBinding scopes whatever it references to its own namespace. A ClusterRoleBinding would grant edit everywhere.", he: "RoleBinding תוחם את מה שהוא מפנה אליו ל-namespace שלו. ClusterRoleBinding היה נותן edit בכל מקום." }
    },
    {
      q: { en: "You applied a default-deny NetworkPolicy but traffic still flows. Most likely reason?", he: "החלת NetworkPolicy של default-deny אבל התעבורה עדיין עוברת. הסיבה הסבירה?" },
      options: [
        { en: "The CNI plugin doesn't enforce NetworkPolicies", he: "ה-CNI plugin לא אוכף NetworkPolicies" },
        { en: "NetworkPolicies only apply after a node reboot", he: "NetworkPolicies חלים רק אחרי reboot ל-node" },
        { en: "RBAC overrides NetworkPolicy", he: "RBAC גובר על NetworkPolicy" },
        { en: "Pod Security is set to privileged", he: "Pod Security מוגדר כ-privileged" }
      ],
      answer: 0,
      explain: { en: "The API server stores the policy, but enforcement is the CNI's job (Calico, Cilium, etc.). Without support, it's silently a no-op.", he: "ה-API server שומר את המדיניות, אבל האכיפה היא התפקיד של ה-CNI (Calico, Cilium וכו'). בלי תמיכה, זה פשוט לא עושה כלום בשקט." }
    }
  ],
  related: ["k8s-config", "k8s-services", "net-isolation", "k8s-helm-gitops"]
});

// ---------------------------------------------------------------------------
// 12. Helm, Kustomize & GitOps
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-helm-gitops",
  track: "kubernetes",
  order: 12,
  icon: "⚓",
  level: 2,
  minutes: 11,
  title: { en: "Helm, Kustomize & GitOps (ArgoCD / Flux)", he: "Helm, Kustomize ו-GitOps (ArgoCD / Flux)" },
  tldr: {
    en: "Helm templates and versions your YAML as releases, Kustomize patches plain YAML per environment, and GitOps makes Git the source of truth with an in-cluster agent that continuously syncs it.",
    he: "Helm עושה templating ונותן גרסאות ל-YAML כ-releases, Kustomize מטליא YAML רגיל לכל סביבה, ו-GitOps הופך את Git ל-source of truth עם agent בתוך ה-cluster שמסנכרן אותו כל הזמן."
  },
  analogy: {
    en: "A restaurant chain's recipe system. Helm is a recipe card with blanks — \"___ grams of salt\" — and each branch fills in its values.yaml. Kustomize is the original recipe plus sticky notes per branch: \"Eilat: double the ice\". GitOps is the head chef's rule: the binder at HQ (Git) is the law; an inspector (ArgoCD) visits every kitchen constantly, and if a cook improvised, the dish is reset to the binder.",
    he: "מערכת המתכונים של רשת מסעדות. Helm הוא כרטיס מתכון עם חורים – \"___ גרם מלח\" – וכל סניף ממלא את ה-values.yaml שלו. Kustomize הוא המתכון המקורי ועוד פתקים צהובים לכל סניף: \"אילת: כפול קרח\". GitOps הוא החוק של השף הראשי: הקלסר במטה (Git) הוא החוק; פקח (ArgoCD) מבקר בכל מטבח כל הזמן, ואם טבח אילתר – המנה מאופסת לפי הקלסר."
  },
  sections: [
    {
      h: { en: "Helm: charts, values, releases", he: "Helm: charts, values, releases" },
      body: {
        en: `<p>A <strong>chart</strong> is a package of templated manifests:</p>
<pre>mychart/
  Chart.yaml          # name, version (chart), appVersion
  values.yaml         # defaults
  templates/
    deployment.yaml   # Go templates
    service.yaml
    _helpers.tpl</pre>
<pre># templates/deployment.yaml (excerpt)
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
      - name: api
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        resources: {{- toYaml .Values.resources | nindent 10 }}</pre>
<pre>helm upgrade --install shop ./mychart -n shop -f values-prod.yaml --set image.tag=2.5.0
helm list -n shop
helm history shop -n shop
helm rollback shop 3 -n shop
helm template ./mychart -f values-prod.yaml   # render locally, apply nothing</pre>
<p>A <strong>release</strong> is one installed instance of a chart, with numbered revisions stored as Secrets in the namespace. Charts come from repos/OCI registries (<code>helm install redis oci://registry-1.docker.io/bitnamicharts/redis</code>). Hooks (<code>pre-upgrade</code>, <code>post-install</code>) run Jobs such as DB migrations at the right moment.</p>
<blockquote>💡 Real world: Helm is the de-facto way to install <em>third-party</em> software (ingress-nginx, cert-manager, Prometheus). For your own apps, many teams find a simple chart or Kustomize easier to read than a 2,000-line templated monster.</blockquote>`,
        he: `<p><strong>Chart</strong> הוא חבילה של manifests עם templates:</p>
<pre>mychart/
  Chart.yaml          # name, version (chart), appVersion
  values.yaml         # defaults
  templates/
    deployment.yaml   # Go templates
    service.yaml
    _helpers.tpl</pre>
<pre># templates/deployment.yaml (excerpt)
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
      - name: api
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        resources: {{- toYaml .Values.resources | nindent 10 }}</pre>
<pre>helm upgrade --install shop ./mychart -n shop -f values-prod.yaml --set image.tag=2.5.0
helm list -n shop
helm history shop -n shop
helm rollback shop 3 -n shop
helm template ./mychart -f values-prod.yaml   # render locally, apply nothing</pre>
<p><strong>Release</strong> הוא מופע מותקן אחד של chart, עם revisions ממוספרים שנשמרים כ-Secrets ב-namespace. Charts מגיעים מ-repos/OCI registries (<code>helm install redis oci://registry-1.docker.io/bitnamicharts/redis</code>). Hooks (<code>pre-upgrade</code>, <code>post-install</code>) מריצים Jobs כמו DB migrations ברגע הנכון.</p>
<blockquote>💡 מהשטח: Helm הוא הדרך הדה-פקטו להתקין תוכנה של <em>צד שלישי</em> (ingress-nginx, cert-manager, Prometheus). לאפליקציות שלכם, הרבה צוותים מוצאים chart פשוט או Kustomize קריאים יותר ממפלצת templates של 2,000 שורות.</blockquote>`
      }
    },
    {
      h: { en: "Kustomize: patch, don't template", he: "Kustomize: להטליא, לא לעשות template" },
      body: {
        en: `<p>Kustomize (built into <code>kubectl apply -k</code>) keeps manifests as plain, valid YAML and layers environment differences on top:</p>
<pre>base/
  deployment.yaml  service.yaml  kustomization.yaml
overlays/
  staging/kustomization.yaml
  prod/kustomization.yaml
  prod/replicas-patch.yaml</pre>
<pre># overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: shop-prod
resources: [../../base]
images:
- name: myorg/api
  newTag: "2.5.0"
patches:
- path: replicas-patch.yaml
configMapGenerator:
- name: api-config
  literals: [LOG_LEVEL=warn]     # name gets a hash suffix -> auto rollout on change</pre>
<p>Helm vs Kustomize in one line: Helm is a <em>package manager with templates</em> (great for distributing configurable software), Kustomize is <em>structured patching</em> (great for your own apps across envs). They combine well — ArgoCD can even render a Helm chart and then apply Kustomize patches on top.</p>`,
        he: `<p>Kustomize (מובנה ב-<code>kubectl apply -k</code>) משאיר את ה-manifests כ-YAML רגיל ותקין ומלביש מעליו הבדלים בין סביבות:</p>
<pre>base/
  deployment.yaml  service.yaml  kustomization.yaml
overlays/
  staging/kustomization.yaml
  prod/kustomization.yaml
  prod/replicas-patch.yaml</pre>
<pre># overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: shop-prod
resources: [../../base]
images:
- name: myorg/api
  newTag: "2.5.0"
patches:
- path: replicas-patch.yaml
configMapGenerator:
- name: api-config
  literals: [LOG_LEVEL=warn]     # name gets a hash suffix -> auto rollout on change</pre>
<p>Helm מול Kustomize בשורה אחת: Helm הוא <em>package manager עם templates</em> (מצוין להפצת תוכנה שאפשר להגדיר), Kustomize הוא <em>patching מובנה</em> (מצוין לאפליקציות שלך על פני סביבות). הם משתלבים טוב – ArgoCD יכול אפילו לרנדר Helm chart ואז להחיל עליו patches של Kustomize.</p>`
      }
    },
    {
      h: { en: "GitOps: Git is the source of truth", he: "GitOps: Git הוא ה-source of truth" },
      body: {
        en: `<p>Instead of CI running <code>kubectl apply</code> with admin credentials (push model), an agent <em>inside</em> the cluster <strong>pulls</strong> the desired state from Git and reconciles — the same reconciliation idea as Kubernetes itself, one level up.</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: shop-prod, namespace: argocd }
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-config
    path: apps/shop/overlays/prod
    targetRevision: main
  destination: { server: https://kubernetes.default.svc, namespace: shop-prod }
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [CreateNamespace=true]</pre>
<ul>
<li><strong>Deploy</strong> = merge a PR (CI bumps the image tag in the config repo). Review, audit trail and approvals for free.</li>
<li><strong>Rollback</strong> = <code>git revert</code>.</li>
<li><strong>Drift detection</strong>: someone ran <code>kubectl edit</code> in prod? ArgoCD shows OutOfSync and <code>selfHeal</code> reverts it.</li>
<li><strong>Disaster recovery</strong>: new cluster + point ArgoCD at the repo = everything comes back.</li>
<li><strong>Security</strong>: CI no longer needs cluster credentials.</li>
</ul>
<p><strong>ArgoCD</strong> has a great UI and multi-cluster "app of apps"/ApplicationSets. <strong>Flux</strong> is a set of lean controllers (GitRepository, Kustomization, HelmRelease) with strong image-automation. Both are CNCF graduated.</p>
<blockquote>⚠️ Production tip: keep app source and deployment config in separate repos (or at least separate paths), and never put plaintext Secrets in the GitOps repo — use External Secrets, Sealed Secrets or SOPS.</blockquote>`,
        he: `<p>במקום ש-CI יריץ <code>kubectl apply</code> עם credentials של admin (מודל push), agent <em>בתוך</em> ה-cluster <strong>מושך</strong> את ה-desired state מ-Git ועושה reconcile – אותו רעיון של reconciliation כמו ב-Kubernetes עצמו, רמה אחת למעלה.</p>
<pre>apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: shop-prod, namespace: argocd }
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-config
    path: apps/shop/overlays/prod
    targetRevision: main
  destination: { server: https://kubernetes.default.svc, namespace: shop-prod }
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [CreateNamespace=true]</pre>
<ul>
<li><strong>Deploy</strong> = merge ל-PR (ה-CI מעדכן את ה-image tag ב-config repo). Review, audit trail ו-approvals בחינם.</li>
<li><strong>Rollback</strong> = <code>git revert</code>.</li>
<li><strong>זיהוי drift</strong>: מישהו הריץ <code>kubectl edit</code> בפרודקשן? ArgoCD מראה OutOfSync ו-<code>selfHeal</code> מחזיר את זה.</li>
<li><strong>Disaster recovery</strong>: cluster חדש + להפנות את ArgoCD ל-repo = הכל חוזר.</li>
<li><strong>אבטחה</strong>: ה-CI כבר לא צריך credentials ל-cluster.</li>
</ul>
<p>ל-<strong>ArgoCD</strong> יש UI מעולה ו-"app of apps"/ApplicationSets ל-multi-cluster. <strong>Flux</strong> הוא סט של controllers רזים (GitRepository, Kustomization, HelmRelease) עם image-automation חזק. שניהם CNCF graduated.</p>
<blockquote>⚠️ טיפ לפרודקשן: תחזיקו את קוד האפליקציה ואת קונפיגורציית ה-deploy ב-repos נפרדים (או לפחות paths נפרדים), ואף פעם לא Secrets גלויים ב-repo של GitOps – תשתמשו ב-External Secrets, Sealed Secrets או SOPS.</blockquote>`
      }
    }
  ],
  diagram: `dev merges PR -> CI builds image myorg/api:2.5.0 -> pushes to registry
             -> CI opens PR in k8s-config: newTag "2.5.0" -> merged
   [ArgoCD in cluster] --pull every ~3 min / webhook--> Git (desired)
          |  diff vs live cluster (actual)
          '--> sync: kubectl apply (Helm/Kustomize rendered) -> Deployment rollout
   someone kubectl edits prod -> OutOfSync -> selfHeal -> back to Git state`,
  handsOn: [
    { cmd: "helm create mychart && helm template ./mychart | head -60", what: { en: "Scaffold a chart and render it locally to see the YAML Helm would apply.", he: "ליצור שלד של chart ולרנדר אותו מקומית כדי לראות את ה-YAML ש-Helm היה מחיל." } },
    { cmd: "helm upgrade --install shop ./mychart -n shop --create-namespace --set replicaCount=2", what: { en: "Install-or-upgrade a release idempotently (the command CI pipelines use).", he: "להתקין-או-לשדרג release בצורה idempotent (הפקודה ש-CI pipelines משתמשים בה)." } },
    { cmd: "helm get values shop -n shop && helm history shop -n shop", what: { en: "See which values a live release was installed with, and its revisions.", he: "לראות עם אילו values ה-release החי הותקן, ואת ה-revisions שלו." } },
    { cmd: "kubectl kustomize overlays/prod | kubectl diff -f -", what: { en: "Render a Kustomize overlay and diff it against the live cluster before applying.", he: "לרנדר overlay של Kustomize ולעשות diff מול ה-cluster החי לפני שמחילים." } },
    { cmd: "argocd app diff shop-prod && argocd app sync shop-prod", what: { en: "See drift between Git and the cluster, then sync.", he: "לראות drift בין Git ל-cluster, ואז לעשות sync." } }
  ],
  mnemonic: {
    en: "\"Helm fills blanks, Kustomize sticks notes, GitOps reads the binder.\" Push = CI shoves into the cluster; Pull = the cluster fetches from Git.",
    he: "\"Helm ממלא חורים, Kustomize מדביק פתקים, GitOps קורא מהקלסר.\" Push = ה-CI דוחף ל-cluster; Pull = ה-cluster מושך מ-Git."
  },
  pitfalls: [
    { en: "Hotfixing prod with kubectl edit under GitOps with selfHeal: ArgoCD reverts your fix within minutes. Fix it in Git.", he: "לעשות hotfix בפרודקשן עם kubectl edit תחת GitOps עם selfHeal: ArgoCD מחזיר את התיקון שלך תוך דקות. מתקנים ב-Git." },
    { en: "Over-templating: a chart where every field is a value is unreadable and untestable. Template what actually varies.", he: "Over-templating: chart שבו כל שדה הוא value הוא בלתי קריא ובלתי ניתן לבדיקה. עושים template רק למה שבאמת משתנה." },
    { en: "Using --set for important prod values: they're not in Git, so the next upgrade without the flag silently resets them.", he: "להשתמש ב---set לערכים חשובים של prod: הם לא ב-Git, אז ה-upgrade הבא בלי ה-flag מאפס אותם בשקט." },
    { en: "prune: true with a misconfigured path: ArgoCD 'cleans up' resources it thinks are no longer in Git — including ones you needed.", he: "prune: true עם path שגוי: ArgoCD 'מנקה' משאבים שהוא חושב שכבר לא ב-Git – כולל כאלה שהיית צריך." }
  ],
  interview: [
    {
      q: { en: "What is GitOps and what advantages does it have over a CI pipeline running kubectl apply?", he: "מה זה GitOps ומה היתרונות שלו על פני CI pipeline שמריץ kubectl apply?" },
      a: { en: "Git holds the declarative desired state; an in-cluster agent (ArgoCD/Flux) continuously pulls and reconciles it. Benefits: audit trail and PR review for every change, easy rollback via git revert, drift detection/self-healing, easy cluster rebuilds, and CI doesn't need cluster credentials (pull model).", he: "Git מחזיק את ה-desired state הדקלרטיבי; agent בתוך ה-cluster (ArgoCD/Flux) מושך ועושה reconcile כל הזמן. יתרונות: audit trail ו-PR review לכל שינוי, rollback קל עם git revert, זיהוי drift ו-self-healing, בנייה מחדש קלה של cluster, וה-CI לא צריך credentials ל-cluster (מודל pull)." }
    },
    {
      q: { en: "Helm or Kustomize — how do you choose?", he: "Helm או Kustomize – איך בוחרים?" },
      a: { en: "Helm when you distribute or consume reusable, configurable packages (third-party software, an internal platform chart used by many teams) and want release history and hooks. Kustomize when you own the manifests and only need per-environment differences without a template language. Many orgs use Helm for vendors and Kustomize for their own apps, both driven by GitOps.", he: "Helm כשמפיצים או צורכים חבילות שאפשר להגדיר ולעשות בהן שימוש חוזר (תוכנה של צד שלישי, chart פלטפורמה פנימי שהרבה צוותים משתמשים בו) ורוצים היסטוריית releases ו-hooks. Kustomize כשה-manifests שלך ורק צריך הבדלים בין סביבות בלי שפת templates. הרבה ארגונים משתמשים ב-Helm לספקים וב-Kustomize לאפליקציות שלהם, שניהם מונעים ע\"י GitOps." }
    }
  ],
  quiz: [
    {
      q: { en: "Under ArgoCD with selfHeal enabled, an engineer runs kubectl scale deploy api --replicas=10 in prod. Git says 4. What happens?", he: "תחת ArgoCD עם selfHeal, מהנדס מריץ kubectl scale deploy api --replicas=10 בפרודקשן. ב-Git כתוב 4. מה קורה?" },
      options: [
        { en: "10 replicas stay forever", he: "10 replicas נשארים לתמיד" },
        { en: "ArgoCD detects drift and returns it to 4", he: "ArgoCD מזהה drift ומחזיר ל-4" },
        { en: "ArgoCD commits 10 back into Git", he: "ArgoCD עושה commit של 10 בחזרה ל-Git" },
        { en: "The Deployment is deleted and recreated", he: "ה-Deployment נמחק ונוצר מחדש" }
      ],
      answer: 1,
      explain: { en: "Git is the source of truth; selfHeal reconciles live state back to it. (If an HPA owns replicas, leave replicas out of Git or tell Argo to ignore that field.)", he: "Git הוא ה-source of truth; selfHeal מחזיר את המצב החי אליו. (אם HPA מחזיק את ה-replicas, משמיטים replicas מ-Git או אומרים ל-Argo להתעלם מהשדה.)" }
    },
    {
      q: { en: "What is a Helm 'release'?", he: "מה זה 'release' ב-Helm?" },
      options: [
        { en: "A Git tag on the chart repo", he: "Git tag על ה-repo של ה-chart" },
        { en: "A new version of the Docker image", he: "גרסה חדשה של ה-Docker image" },
        { en: "A named, installed instance of a chart in a cluster, with revision history", he: "מופע מותקן עם שם של chart ב-cluster, עם היסטוריית revisions" },
        { en: "The values.yaml file", he: "הקובץ values.yaml" }
      ],
      answer: 2,
      explain: { en: "You can install the same chart many times as different releases (e.g. redis-cache, redis-sessions). Each upgrade/rollback creates a revision.", he: "אפשר להתקין את אותו chart הרבה פעמים כ-releases שונים (למשל redis-cache, redis-sessions). כל upgrade/rollback יוצר revision." }
    },
    {
      q: { en: "Which is the main security benefit of the GitOps pull model?", he: "מה יתרון האבטחה העיקרי של מודל ה-pull ב-GitOps?" },
      options: [
        { en: "CI pipelines no longer need credentials to the cluster", he: "CI pipelines כבר לא צריכים credentials ל-cluster" },
        { en: "Secrets are automatically encrypted in Git", he: "Secrets מוצפנים אוטומטית ב-Git" },
        { en: "Containers run as non-root automatically", he: "קונטיינרים רצים כ-non-root אוטומטית" },
        { en: "It replaces RBAC", he: "זה מחליף את RBAC" }
      ],
      answer: 0,
      explain: { en: "The agent runs inside the cluster and pulls from Git, so no external system holds kube-admin credentials. Secrets still need ESO/Sealed Secrets/SOPS.", he: "ה-agent רץ בתוך ה-cluster ומושך מ-Git, אז שום מערכת חיצונית לא מחזיקה credentials של admin. Secrets עדיין צריכים ESO/Sealed Secrets/SOPS." }
    }
  ],
  related: ["k8s-deployments", "k8s-config", "rel-deployments", "k8s-namespaces-rbac"]
});

// ---------------------------------------------------------------------------
// 13. Debugging playbook
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-debugging",
  track: "kubernetes",
  order: 13,
  icon: "🔍",
  level: 2,
  minutes: 14,
  title: { en: "The Kubernetes Debugging Playbook", he: "ה-Playbook לדיבאג ב-Kubernetes" },
  tldr: {
    en: "Read the STATUS, then describe → events → logs --previous → exec/port-forward → top; each failure state (CrashLoopBackOff, ImagePullBackOff, Pending, OOMKilled, CreateContainerConfigError) has a known short list of causes.",
    he: "קוראים את ה-STATUS, ואז describe ← events ← logs --previous ← exec/port-forward ← top; לכל מצב כשל (CrashLoopBackOff, ImagePullBackOff, Pending, OOMKilled, CreateContainerConfigError) יש רשימה קצרה וידועה של סיבות."
  },
  analogy: {
    en: "An ER triage nurse. She doesn't start with an MRI; she reads the chart (STATUS), asks what happened (describe/events), checks the patient's last words before collapsing (logs --previous), then examines up close (exec) and takes vitals (top). Each symptom maps to a short list of usual suspects — fever plus rash means you check a known handful first, not the whole medical textbook.",
    he: "אחות טריאז' במיון. היא לא מתחילה מ-MRI; היא קוראת את התיק (STATUS), שואלת מה קרה (describe/events), בודקת מה המטופל אמר רגע לפני שהתמוטט (logs --previous), ואז בודקת מקרוב (exec) ומודדת מדדים (top). כל סימפטום ממופה לרשימה קצרה של חשודים רגילים – חום ופריחה זה כמה דברים ידועים שבודקים קודם, לא כל ספר הרפואה."
  },
  sections: [
    {
      h: { en: "The universal sequence", he: "הרצף האוניברסלי" },
      body: {
        en: `<pre>kubectl get pods -o wide                     # 1. STATUS, RESTARTS, NODE
kubectl describe pod POD                     # 2. State/Last State, exit code, Events at the bottom
kubectl get events --sort-by=.lastTimestamp  # 3. timeline of the namespace
kubectl logs POD -c CONTAINER --previous     # 4. logs of the run that crashed
kubectl exec -it POD -- sh                   # 5. look inside (if it stays up)
kubectl port-forward pod/POD 8080:8080       # 6. hit it directly, bypass Service/Ingress
kubectl top pod POD --containers             # 7. live CPU/memory</pre>
<p>Ninety percent of incidents are solved at step 2. In <code>describe</code>, read three things: <strong>State / Last State</strong> (reason + exit code), <strong>Restart Count</strong>, and the <strong>Events</strong> at the bottom. Exit codes are a cheat sheet:</p>
<table>
<tr><th>Exit code</th><th>Meaning</th></tr>
<tr><td>0</td><td>Exited normally — but with <code>restartPolicy: Always</code> a finished process looks like a crash loop (did your entrypoint just exit?)</td></tr>
<tr><td>1 / 2</td><td>App error: unhandled exception, bad config, missing env var</td></tr>
<tr><td>126 / 127</td><td>Command not executable / not found (wrong entrypoint, missing binary, Alpine vs glibc)</td></tr>
<tr><td>137</td><td>SIGKILL: OOMKilled, or killed after a failed liveness probe / grace period</td></tr>
<tr><td>143</td><td>SIGTERM: normal graceful termination</td></tr>
</table>
<blockquote>⚠️ Production tip: Events are kept only ~1 hour by default. Investigating yesterday's incident? Ship events to your logging stack (kube-event-exporter, Datadog, etc.).</blockquote>`,
        he: `<pre>kubectl get pods -o wide                     # 1. STATUS, RESTARTS, NODE
kubectl describe pod POD                     # 2. State/Last State, exit code, Events at the bottom
kubectl get events --sort-by=.lastTimestamp  # 3. timeline of the namespace
kubectl logs POD -c CONTAINER --previous     # 4. logs of the run that crashed
kubectl exec -it POD -- sh                   # 5. look inside (if it stays up)
kubectl port-forward pod/POD 8080:8080       # 6. hit it directly, bypass Service/Ingress
kubectl top pod POD --containers             # 7. live CPU/memory</pre>
<p>תשעים אחוז מה-incidents נפתרים בשלב 2. ב-<code>describe</code> קוראים שלושה דברים: <strong>State / Last State</strong> (reason + exit code), <strong>Restart Count</strong>, וה-<strong>Events</strong> למטה. Exit codes הם שליף:</p>
<table>
<tr><th>Exit code</th><th>משמעות</th></tr>
<tr><td>0</td><td>יצא תקין – אבל עם <code>restartPolicy: Always</code> תהליך שסיים נראה כמו crash loop (ה-entrypoint שלך פשוט יצא?)</td></tr>
<tr><td>1 / 2</td><td>שגיאת אפליקציה: exception לא מטופל, config שבור, env var חסר</td></tr>
<tr><td>126 / 127</td><td>פקודה לא ניתנת להרצה / לא נמצאה (entrypoint שגוי, בינארי חסר, Alpine מול glibc)</td></tr>
<tr><td>137</td><td>SIGKILL: OOMKilled, או נהרג אחרי liveness שנכשל / grace period</td></tr>
<tr><td>143</td><td>SIGTERM: סיום מסודר רגיל</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: Events נשמרים כברירת מחדל רק כשעה. חוקרים incident של אתמול? תשלחו events למערכת הלוגים (kube-event-exporter, Datadog וכו').</blockquote>`
      }
    },
    {
      h: { en: "CrashLoopBackOff & OOMKilled", he: "CrashLoopBackOff ו-OOMKilled" },
      body: {
        en: `<p><strong>CrashLoopBackOff</strong> isn't an error — it's kubelet saying "this container keeps dying, so I'm waiting longer between restarts" (10s, 20s, 40s... up to 5 min). The real cause is in the <em>previous</em> run:</p>
<pre>$ kubectl logs api-7d9f-x2k4p --previous
Error: connect ECONNREFUSED 10.96.0.15:5432
    at TCPConnectWrapper.afterConnect ...</pre>
<p>Usual suspects: missing/wrong env var or config, dependency unreachable at startup (DB, Kafka) and the app exits instead of retrying, wrong command/args, a failing liveness probe (describe shows "Liveness probe failed" events), permissions (read-only filesystem, non-root user can't write to <code>/app</code>), or the process simply exits 0 because it was a one-shot script.</p>
<p><strong>OOMKilled</strong>: describe shows <code>Last State: Terminated, Reason: OOMKilled, Exit Code: 137</code>. Logs often stop abruptly with no error. Decide: is it a <em>leak</em> (memory climbs steadily until killed — check the memory graph) or an <em>undersized limit</em> (dies at a predictable load spike)? Fix the leak, or raise the limit and tune the runtime (<code>-XX:MaxRAMPercentage</code>, <code>--max-old-space-size</code>, <code>GOMEMLIMIT</code>).</p>
<blockquote>💡 Real world: if the container dies too fast to exec into, override the command temporarily: <code>kubectl debug POD -it --copy-to=dbg --container=api -- sh</code> creates a copy where you can poke around, or set <code>command: ["sleep","infinity"]</code> in a test Deployment.</blockquote>`,
        he: `<p><strong>CrashLoopBackOff</strong> זו לא שגיאה – זה ה-kubelet שאומר "הקונטיינר הזה מת שוב ושוב, אז אני מחכה יותר בין restarts" (10s, 20s, 40s... עד 5 דקות). הסיבה האמיתית נמצאת בהרצה ה<em>קודמת</em>:</p>
<pre>$ kubectl logs api-7d9f-x2k4p --previous
Error: connect ECONNREFUSED 10.96.0.15:5432
    at TCPConnectWrapper.afterConnect ...</pre>
<p>החשודים הרגילים: env var או config חסר/שגוי, תלות לא נגישה בעלייה (DB, Kafka) והאפליקציה יוצאת במקום לנסות שוב, command/args שגויים, liveness probe שנכשל (ב-describe רואים events של "Liveness probe failed"), הרשאות (filesystem לקריאה בלבד, משתמש non-root שלא יכול לכתוב ל-<code>/app</code>), או שהתהליך פשוט יוצא עם 0 כי הוא היה סקריפט חד-פעמי.</p>
<p><strong>OOMKilled</strong>: ב-describe רואים <code>Last State: Terminated, Reason: OOMKilled, Exit Code: 137</code>. הלוגים הרבה פעמים נקטעים בפתאומיות בלי שגיאה. צריך להחליט: זו <em>דליפה</em> (הזיכרון עולה בהתמדה עד ה-kill – לבדוק את גרף הזיכרון) או <em>limit קטן מדי</em> (מת ב-spike צפוי של עומס)? לתקן את הדליפה, או להעלות את ה-limit ולכוון את ה-runtime (<code>-XX:MaxRAMPercentage</code>, <code>--max-old-space-size</code>, <code>GOMEMLIMIT</code>).</p>
<blockquote>💡 מהשטח: אם הקונטיינר מת מהר מדי בשביל exec, תדרסו את ה-command זמנית: <code>kubectl debug POD -it --copy-to=dbg --container=api -- sh</code> יוצר עותק שאפשר לחטט בו, או <code>command: ["sleep","infinity"]</code> ב-Deployment לבדיקה.</blockquote>`
      }
    },
    {
      h: { en: "ImagePullBackOff, CreateContainerConfigError & Pending", he: "ImagePullBackOff, CreateContainerConfigError ו-Pending" },
      body: {
        en: `<table>
<tr><th>Status</th><th>What describe/events say</th><th>Usual causes</th></tr>
<tr><td>ErrImagePull → ImagePullBackOff</td><td><code>Failed to pull image ... not found</code> / <code>unauthorized</code> / <code>i/o timeout</code></td><td>Typo in image or tag; tag never pushed (CI failed); private registry without <code>imagePullSecrets</code> or node IAM; Docker Hub rate limit (100 pulls/6h anonymous); arch mismatch (arm64 node, amd64-only image → "no match for platform"); no egress/NAT from nodes</td></tr>
<tr><td>CreateContainerConfigError</td><td><code>configmap "api-config" not found</code> / <code>couldn't find key DB_URL in Secret</code></td><td>Referenced ConfigMap/Secret or key doesn't exist (wrong namespace, not yet synced by ESO, typo)</td></tr>
<tr><td>ContainerCreating (stuck)</td><td><code>FailedMount</code>, <code>Multi-Attach error</code>, CNI errors</td><td>Volume attached elsewhere, CSI driver issues, Pod IPs exhausted in subnet</td></tr>
<tr><td>Pending</td><td><code>FailedScheduling: 0/5 nodes are available: ...</code></td><td>Insufficient CPU/memory (requests), taints, affinity/nodeSelector mismatch, PVC unbound or wrong zone, ResourceQuota exceeded (that one shows on the ReplicaSet, not the Pod!)</td></tr>
</table>
<p>That last trap is worth repeating: if a Deployment has 0 Pods and no Pending Pods at all, check <code>kubectl describe rs</code> — a ResourceQuota or admission webhook may be rejecting Pod <em>creation</em>, so there's no Pod to describe.</p>`,
        he: `<table>
<tr><th>Status</th><th>מה describe/events אומרים</th><th>סיבות נפוצות</th></tr>
<tr><td>ErrImagePull ← ImagePullBackOff</td><td><code>Failed to pull image ... not found</code> / <code>unauthorized</code> / <code>i/o timeout</code></td><td>טעות הקלדה ב-image או tag; tag שאף פעם לא נדחף (ה-CI נכשל); registry פרטי בלי <code>imagePullSecrets</code> או IAM ל-node; rate limit של Docker Hub (100 pulls ל-6 שעות באנונימי); אי-התאמה בארכיטקטורה (node של arm64, image רק amd64 ← "no match for platform"); אין egress/NAT מה-nodes</td></tr>
<tr><td>CreateContainerConfigError</td><td><code>configmap "api-config" not found</code> / <code>couldn't find key DB_URL in Secret</code></td><td>ConfigMap/Secret או key שמפנים אליו לא קיים (namespace שגוי, ESO עוד לא סנכרן, טעות הקלדה)</td></tr>
<tr><td>ContainerCreating (תקוע)</td><td><code>FailedMount</code>, <code>Multi-Attach error</code>, שגיאות CNI</td><td>Volume מחובר במקום אחר, בעיות ב-CSI driver, נגמרו IPs ל-Pods ב-subnet</td></tr>
<tr><td>Pending</td><td><code>FailedScheduling: 0/5 nodes are available: ...</code></td><td>אין מספיק CPU/זיכרון (requests), taints, אי-התאמה ב-affinity/nodeSelector, PVC לא bound או ב-zone שגוי, חריגה מ-ResourceQuota (את זה רואים על ה-ReplicaSet, לא על ה-Pod!)</td></tr>
</table>
<p>המלכודת האחרונה שווה חזרה: אם ל-Deployment יש 0 Pods ואין בכלל Pods ב-Pending, תבדקו <code>kubectl describe rs</code> – ResourceQuota או admission webhook עלולים לדחות את <em>יצירת</em> ה-Pod, אז אין Pod לעשות לו describe.</p>`
      }
    },
    {
      h: { en: "Running but broken: networking & performance", he: "רץ אבל שבור: רשת וביצועים" },
      body: {
        en: `<p>The Pod is <code>Running 1/1</code> and users still get errors. Walk the request path from the inside out:</p>
<ol>
<li><strong>Pod itself</strong>: <code>kubectl port-forward pod/POD 8080:8080</code> then <code>curl localhost:8080/health</code>. Fails? It's the app.</li>
<li><strong>Service</strong>: <code>kubectl get endpointslices -l kubernetes.io/service-name=api</code>. Empty → selector/readiness. Then from a debug Pod: <code>curl http://api.shop:80</code>.</li>
<li><strong>DNS</strong>: <code>nslookup api.shop.svc.cluster.local</code> from a debug Pod; check CoreDNS Pods/logs.</li>
<li><strong>NetworkPolicy</strong>: is there a default-deny you forgot about?</li>
<li><strong>Ingress</strong>: <code>kubectl describe ingress</code>, then the ingress controller's logs (404 = no matching rule; 502/503 = backend has no healthy endpoints).</li>
</ol>
<p>For a debug toolbox inside the cluster: <code>kubectl run -it --rm netshoot --image=nicolaka/netshoot -- bash</code> (curl, dig, tcpdump, iperf), or attach an ephemeral container to a distroless Pod: <code>kubectl debug -it POD --image=busybox:1.36 --target=api</code>.</p>
<p>Slow, not broken? <code>kubectl top pods</code> versus requests/limits, then CPU throttling metrics, then restarts (<code>RESTARTS</code> column climbing = hidden OOMs or liveness kills).</p>`,
        he: `<p>ה-Pod ב-<code>Running 1/1</code> ומשתמשים עדיין מקבלים שגיאות. הולכים במסלול הבקשה מבפנים החוצה:</p>
<ol>
<li><strong>ה-Pod עצמו</strong>: <code>kubectl port-forward pod/POD 8080:8080</code> ואז <code>curl localhost:8080/health</code>. נכשל? זו האפליקציה.</li>
<li><strong>Service</strong>: <code>kubectl get endpointslices -l kubernetes.io/service-name=api</code>. ריק ← selector/readiness. אחר כך מ-Pod של דיבאג: <code>curl http://api.shop:80</code>.</li>
<li><strong>DNS</strong>: <code>nslookup api.shop.svc.cluster.local</code> מ-Pod של דיבאג; לבדוק את ה-Pods והלוגים של CoreDNS.</li>
<li><strong>NetworkPolicy</strong>: יש default-deny ששכחת ממנו?</li>
<li><strong>Ingress</strong>: <code>kubectl describe ingress</code>, ואז הלוגים של ה-ingress controller (404 = אין חוק מתאים; 502/503 = ל-backend אין endpoints בריאים).</li>
</ol>
<p>ארגז כלים לדיבאג בתוך ה-cluster: <code>kubectl run -it --rm netshoot --image=nicolaka/netshoot -- bash</code> (curl, dig, tcpdump, iperf), או לחבר ephemeral container ל-Pod מסוג distroless: <code>kubectl debug -it POD --image=busybox:1.36 --target=api</code>.</p>
<p>איטי ולא שבור? <code>kubectl top pods</code> מול requests/limits, אחר כך מטריקות CPU throttling, אחר כך restarts (עמודת <code>RESTARTS</code> שעולה = OOMs נסתרים או liveness kills).</p>`
      }
    }
  ],
  diagram: `STATUS                      -> first command                       -> usual fix
 Pending                    -> describe pod (FailedScheduling)      -> requests / taints / affinity / PVC / capacity
 ImagePullBackOff           -> describe pod (Failed to pull)        -> tag, registry auth, arch, rate limit
 CreateContainerConfigError -> describe pod (not found)             -> create ConfigMap/Secret/key
 CrashLoopBackOff           -> logs --previous                      -> config/env, deps, command, liveness
 OOMKilled (137)            -> describe pod (Last State) + metrics  -> fix leak / raise limit / tune runtime
 Running but 5xx            -> endpoints, port-forward, ingress logs-> readiness, selector, NetworkPolicy`,
  handsOn: [
    { cmd: "kubectl get pods -A | grep -vE 'Running|Completed'", what: { en: "Instant list of everything unhealthy across the cluster.", he: "רשימה מיידית של כל מה שלא בריא בכל ה-cluster." } },
    { cmd: "kubectl describe pod POD | sed -n '/State:/,/Restart Count/p;/Events:/,$p'", what: { en: "Just the parts of describe that matter: state, last state, exit code, restarts, events.", he: "רק החלקים של describe שחשובים: state, last state, exit code, restarts, events." } },
    { cmd: "kubectl logs deploy/api --all-containers --previous --tail=100", what: { en: "Last 100 lines of the crashed run from all containers of a Deployment's Pod.", he: "100 השורות האחרונות של ההרצה שקרסה מכל הקונטיינרים של Pod ב-Deployment." } },
    { cmd: "kubectl get events -n shop --sort-by=.lastTimestamp | tail -30", what: { en: "The recent namespace timeline: scheduling, pulls, probe failures, kills.", he: "ציר הזמן האחרון של ה-namespace: scheduling, pulls, כישלונות probes, kills." } },
    { cmd: "kubectl debug -it POD --image=nicolaka/netshoot --target=api", what: { en: "Attach an ephemeral debug container with network tools to a running (even distroless) Pod.", he: "לחבר ephemeral container לדיבאג עם כלי רשת ל-Pod שרץ (גם distroless)." } }
  ],
  mnemonic: {
    en: "\"Get, Describe, Events, Logs-Previous, Exec\" — \"Good Doctors Examine Last Evidence.\" And the exit-code trio: 1 = app, 137 = killed, 143 = asked nicely.",
    he: "\"Get, Describe, Events, Logs-Previous, Exec\" – \"גם דוקטור אמיתי לא מנחש\" (Get, Describe, Events, Logs, Exec). ושלישיית ה-exit codes: 1 = האפליקציה, 137 = נרצח, 143 = ביקשו יפה."
  },
  pitfalls: [
    { en: "Reading kubectl logs without --previous on a CrashLoopBackOff: you see the fresh run's empty startup, not the crash.", he: "לקרוא kubectl logs בלי --previous על CrashLoopBackOff: רואים את העלייה הריקה של ההרצה החדשה, לא את הקריסה." },
    { en: "Deleting the Pod as the first move: it 'fixes' nothing, and you lose the evidence (last state, events tied to that Pod).", he: "למחוק את ה-Pod כצעד ראשון: זה לא 'מתקן' כלום, ומאבדים את הראיות (last state, events של ה-Pod הזה)." },
    { en: "Looking only at Pods when a Deployment has zero Pods — the error (quota, webhook denial) is on the ReplicaSet events.", he: "להסתכל רק על Pods כשלדפלוימנט יש אפס Pods – השגיאה (quota, דחייה של webhook) נמצאת ב-events של ה-ReplicaSet." },
    { en: "Assuming exit 137 always means OOM: it also happens when kubelet kills a container after a failed liveness probe or an expired grace period. Check the Reason field.", he: "להניח ש-exit 137 תמיד אומר OOM: זה קורה גם כשה-kubelet הורג קונטיינר אחרי liveness שנכשל או grace period שנגמר. לבדוק את שדה ה-Reason." }
  ],
  interview: [
    {
      q: { en: "A Pod is in CrashLoopBackOff. Walk me through your debugging.", he: "Pod ב-CrashLoopBackOff. תסביר איך היית מדבג." },
      a: { en: "kubectl describe pod for Last State reason and exit code plus events (OOMKilled? liveness failures?). kubectl logs --previous for the crashed run's output. Then correlate: exit 1 with a config error → check env/ConfigMap/Secret; 127 → wrong command/image; 137 OOMKilled → memory; liveness events → probe config. If it dies too fast, use kubectl debug --copy-to with a shell, and check recent changes (rollout history, config commits).", he: "kubectl describe pod בשביל ה-reason וה-exit code של ה-Last State ועוד events (OOMKilled? כישלונות liveness?). kubectl logs --previous בשביל הפלט של ההרצה שקרסה. ואז לקשר: exit 1 עם שגיאת config ← לבדוק env/ConfigMap/Secret; 127 ← command/image שגוי; 137 OOMKilled ← זיכרון; events של liveness ← הגדרות probe. אם הוא מת מהר מדי – kubectl debug --copy-to עם shell, ולבדוק שינויים אחרונים (rollout history, commits של config)." }
    },
    {
      q: { en: "Users get 503s from the Ingress, but all Pods show Running. Where do you look?", he: "משתמשים מקבלים 503 מה-Ingress, אבל כל ה-Pods ב-Running. איפה מסתכלים?" },
      a: { en: "Running isn't Ready: check READY column and readiness probe events. Then the Service's EndpointSlices — empty means selector mismatch or no Ready Pods. Verify targetPort matches the container port, port-forward to a Pod to test the app directly, check NetworkPolicies between the ingress controller namespace and the app, and read the ingress controller logs for upstream errors.", he: "Running זה לא Ready: לבדוק את עמודת READY ו-events של readiness. אחר כך את ה-EndpointSlices של ה-Service – ריק אומר selector לא תואם או אין Pods שהם Ready. לוודא ש-targetPort תואם ל-port של הקונטיינר, port-forward ל-Pod כדי לבדוק את האפליקציה ישירות, לבדוק NetworkPolicies בין ה-namespace של ה-ingress controller לאפליקציה, ולקרוא את הלוגים של ה-ingress controller בשביל שגיאות upstream." }
    }
  ],
  quiz: [
    {
      q: { en: "A Pod shows CreateContainerConfigError. What's the most likely cause?", he: "Pod מראה CreateContainerConfigError. מה הסיבה הסבירה?" },
      options: [
        { en: "The image doesn't exist in the registry", he: "ה-image לא קיים ב-registry" },
        { en: "The container ran out of memory", he: "לקונטיינר נגמר הזיכרון" },
        { en: "No node has enough CPU", he: "לאף node אין מספיק CPU" },
        { en: "A referenced ConfigMap/Secret (or a key in it) doesn't exist", he: "ConfigMap/Secret שמפנים אליו (או key בתוכו) לא קיים" }
      ],
      answer: 3,
      explain: { en: "kubelet can't build the container's env/volumes. Missing image → ImagePullBackOff; memory → OOMKilled; CPU → Pending.", he: "ה-kubelet לא מצליח לבנות את ה-env/volumes של הקונטיינר. image חסר ← ImagePullBackOff; זיכרון ← OOMKilled; CPU ← Pending." }
    },
    {
      q: { en: "kubectl logs on a CrashLoopBackOff Pod shows only 'Starting server...'. What should you run next?", he: "kubectl logs על Pod ב-CrashLoopBackOff מראה רק 'Starting server...'. מה מריצים עכשיו?" },
      options: [
        { en: "kubectl logs POD --previous", he: "kubectl logs POD --previous" },
        { en: "kubectl delete pod POD", he: "kubectl delete pod POD" },
        { en: "kubectl rollout restart", he: "kubectl rollout restart" },
        { en: "kubectl top node", he: "kubectl top node" }
      ],
      answer: 0,
      explain: { en: "The current container just started again; the crash output is in the previous container instance. (Also check describe for OOMKilled, since an OOM leaves no log line.)", he: "הקונטיינר הנוכחי בדיוק עלה מחדש; הפלט של הקריסה נמצא במופע הקודם. (וגם לבדוק describe בשביל OOMKilled, כי OOM לא משאיר שורת לוג.)" }
    },
    {
      q: { en: "Pods on new arm64 nodes show ImagePullBackOff with 'no match for platform in manifest', while amd64 nodes are fine. Fix?", he: "Pods על nodes חדשים של arm64 מראים ImagePullBackOff עם 'no match for platform in manifest', ו-nodes של amd64 בסדר. התיקון?" },
      options: [
        { en: "Add imagePullSecrets", he: "להוסיף imagePullSecrets" },
        { en: "Raise the memory limit", he: "להעלות את ה-memory limit" },
        { en: "Build a multi-arch image (docker buildx --platform linux/amd64,linux/arm64) or pin the Pods to amd64 nodes", he: "לבנות image מרובה ארכיטקטורות (docker buildx --platform linux/amd64,linux/arm64) או לנעוץ את ה-Pods ל-nodes של amd64" },
        { en: "Switch to the :latest tag", he: "לעבור ל-tag :latest" }
      ],
      answer: 2,
      explain: { en: "The image manifest only contains amd64. Publish a multi-arch manifest, or use nodeSelector kubernetes.io/arch: amd64 meanwhile.", he: "ה-manifest של ה-image מכיל רק amd64. לפרסם manifest מרובה ארכיטקטורות, או בינתיים להשתמש ב-nodeSelector kubernetes.io/arch: amd64." }
    },
    {
      q: { en: "A Deployment shows 0/3 ready and there are no Pods at all. Where's the error most likely visible?", he: "Deployment מראה 0/3 ready ואין בכלל Pods. איפה השגיאה כנראה מופיעה?" },
      options: [
        { en: "In the container logs", he: "בלוגים של הקונטיינר" },
        { en: "In the ReplicaSet's events (e.g. exceeded ResourceQuota or admission denial)", he: "ב-events של ה-ReplicaSet (למשל חריגה מ-ResourceQuota או דחייה של admission)" },
        { en: "In CoreDNS logs", he: "בלוגים של CoreDNS" },
        { en: "In the node's kubelet logs", he: "בלוגים של ה-kubelet ב-node" }
      ],
      answer: 1,
      explain: { en: "If Pods are rejected at creation, there is no Pod or container to inspect. The ReplicaSet controller records FailedCreate events: kubectl describe rs.", he: "אם Pods נדחים כבר ביצירה, אין Pod או קונטיינר לבדוק. ה-ReplicaSet controller רושם events של FailedCreate: kubectl describe rs." }
    }
  ],
  playground: "terminal",
  related: ["k8s-pods", "k8s-resources", "k8s-probes", "k8s-services", "k8s-scheduling"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
[
  ["Control plane", "The cluster's brain: api-server, etcd, scheduler and controller-manager, which store desired state and drive reconciliation.", "המוח של ה-cluster: api-server, etcd, scheduler ו-controller-manager, ששומרים את ה-desired state ומניעים את ה-reconciliation.", "k8s-architecture"],
  ["kube-apiserver", "The REST front door of Kubernetes; authenticates, authorizes, admits and persists every change, and is the only component that talks to etcd.", "דלת הכניסה (REST) של Kubernetes; מאמת, מאשר, מריץ admission ושומר כל שינוי, והרכיב היחיד שמדבר עם etcd.", "k8s-architecture"],
  ["etcd", "Raft-based distributed key-value store holding the entire cluster state; run 3 or 5 members and back it up.", "Key-value store מבוזר מבוסס Raft שמחזיק את כל ה-state של ה-cluster; מריצים 3 או 5 members ומגבים אותו.", "k8s-architecture"],
  ["kubelet", "The agent on each node that runs the Pods assigned to it via the container runtime, executes probes and reports status.", "ה-agent בכל node שמריץ את ה-Pods שמשויכים אליו דרך ה-container runtime, מריץ probes ומדווח status.", "k8s-architecture"],
  ["Reconciliation loop", "A controller's endless cycle of comparing desired state (spec) to actual state (status) and acting to close the gap.", "הלולאה האינסופית של controller שמשווה בין desired state (spec) ל-actual state (status) ופועלת לסגור את הפער.", "k8s-architecture"],
  ["Pod", "The smallest deployable unit: one or more containers sharing a network namespace (one IP) and volumes.", "היחידה הקטנה ביותר שאפשר לפרוס: קונטיינר אחד או יותר שחולקים network namespace (IP אחד) ו-volumes.", "k8s-pods"],
  ["Sidecar", "A helper container running alongside the main app in the same Pod, e.g. a proxy or log shipper.", "קונטיינר עזר שרץ לצד האפליקציה הראשית באותו Pod, למשל proxy או log shipper.", "k8s-pods"],
  ["Deployment", "Controller for stateless apps that manages ReplicaSets to provide rolling updates and rollbacks.", "Controller לאפליקציות stateless שמנהל ReplicaSets כדי לספק rolling updates ו-rollbacks.", "k8s-deployments"],
  ["Service", "A stable virtual IP and DNS name that load-balances to the Ready Pods selected by labels.", "IP וירטואלי ושם DNS יציבים שמאזנים עומס בין ה-Pods שהם Ready ונבחרים לפי labels.", "k8s-services"],
  ["Ingress", "L7 HTTP(S) routing rules (host/path, TLS) to Services, implemented by an ingress controller.", "חוקי ניתוב HTTP(S) ב-L7 (host/path, TLS) ל-Services, שממומשים ע\"י ingress controller.", "k8s-services"],
  ["ConfigMap", "A namespaced object holding non-sensitive key-value config, consumed as env vars or mounted files (max 1 MiB).", "אובייקט ברמת namespace שמחזיק קונפיגורציה לא רגישה כ-key-value, נצרך כ-env vars או קבצים ב-mount (עד 1 MiB).", "k8s-config"],
  ["Secret", "Object for sensitive data, stored base64-encoded (not encrypted by default); protect with RBAC and encryption at rest.", "אובייקט למידע רגיש, נשמר מקודד ב-base64 (לא מוצפן כברירת מחדל); מגינים עליו עם RBAC ו-encryption at rest.", "k8s-config"],
  ["Requests / Limits", "Requests reserve resources for scheduling; limits cap usage at runtime (CPU throttled, memory OOMKilled).", "Requests שומרים משאבים לצורך scheduling; limits מגבילים שימוש בזמן ריצה (CPU עובר throttling, זיכרון מקבל OOMKill).", "k8s-resources"],
  ["OOMKilled", "Container terminated by the kernel for exceeding its memory limit; exit code 137.", "קונטיינר שנהרג ע\"י ה-kernel כי חרג מה-memory limit; exit code 137.", "k8s-resources"],
  ["QoS class", "Guaranteed, Burstable or BestEffort, derived from requests/limits; decides eviction order under node pressure.", "Guaranteed, Burstable או BestEffort, נגזר מ-requests/limits; קובע את סדר ה-eviction כשה-node בלחץ.", "k8s-resources"],
  ["Taint / Toleration", "A taint on a node repels Pods; a toleration on a Pod allows (but doesn't attract) it onto that node.", "Taint על node דוחה Pods; toleration על Pod מרשה לו (אבל לא מושך אותו) להיכנס ל-node.", "k8s-scheduling"],
  ["PodDisruptionBudget", "Limits how many Pods of an app can be voluntarily evicted at once (drains, upgrades), e.g. minAvailable: 2.", "מגביל כמה Pods של אפליקציה אפשר לפנות מרצון בבת אחת (drains, שדרוגים), למשל minAvailable: 2.", "k8s-scheduling"],
  ["HPA", "Horizontal Pod Autoscaler: sets replicas = ceil(current × currentMetric / target), e.g. on CPU % of request.", "Horizontal Pod Autoscaler: קובע replicas = ceil(current × currentMetric / target), למשל לפי אחוז CPU מה-request.", "k8s-autoscaling"],
  ["Karpenter", "A node autoscaler that launches right-sized instances directly for Pending Pods and consolidates underused nodes.", "Node autoscaler שמקים instances בגודל המתאים ישירות ל-Pods ב-Pending ומאחד nodes מנוצלים חלקית.", "k8s-autoscaling"],
  ["KEDA", "Event-driven autoscaler that scales workloads (even to zero) on external signals like queue length or consumer lag.", "Autoscaler מבוסס events שעושה scale ל-workloads (גם לאפס) לפי סיגנלים חיצוניים כמו אורך תור או consumer lag.", "k8s-autoscaling"],
  ["Readiness probe", "Health check that decides whether a Pod receives traffic; failing removes it from Service endpoints without restarting.", "בדיקת בריאות שמחליטה אם Pod מקבל תעבורה; כישלון מוציא אותו מה-endpoints של ה-Service בלי restart.", "k8s-probes"],
  ["Liveness probe", "Health check that restarts a container when it fails; should check only the process itself, never dependencies.", "בדיקת בריאות שעושה restart לקונטיינר כשהיא נכשלת; צריכה לבדוק רק את התהליך עצמו, אף פעם לא תלויות.", "k8s-probes"],
  ["PersistentVolumeClaim", "A namespaced request for storage (size, access mode, StorageClass) that binds to a PersistentVolume.", "בקשה ל-storage ברמת namespace (גודל, access mode, StorageClass) שנקשרת ל-PersistentVolume.", "k8s-storage"],
  ["StatefulSet", "Controller giving each replica a stable name, stable DNS and its own persistent volume, with ordered rollout.", "Controller שנותן לכל replica שם יציב, DNS יציב ו-volume קבוע משלו, עם rollout מסודר.", "k8s-storage"],
  ["RBAC", "Role-Based Access Control: Roles/ClusterRoles define verbs on resources; (Cluster)RoleBindings grant them to users, groups or ServiceAccounts.", "Role-Based Access Control: Roles/ClusterRoles מגדירים verbs על resources; (Cluster)RoleBindings מעניקים אותם ל-users, groups או ServiceAccounts.", "k8s-namespaces-rbac"],
  ["NetworkPolicy", "L3/L4 firewall rules for Pods, enforced by the CNI; without any, all Pods can reach all Pods.", "חוקי firewall ב-L3/L4 ל-Pods, נאכפים ע\"י ה-CNI; בלעדיהם, כל Pod מגיע לכל Pod.", "k8s-namespaces-rbac"],
  ["Helm", "Kubernetes package manager: templated charts installed as versioned releases with upgrade and rollback.", "Package manager ל-Kubernetes: charts עם templates שמותקנים כ-releases עם גרסאות, upgrade ו-rollback.", "k8s-helm-gitops"],
  ["GitOps", "Operating model where Git holds desired state and an in-cluster agent (ArgoCD/Flux) continuously pulls and reconciles it.", "מודל עבודה שבו Git מחזיק את ה-desired state ו-agent בתוך ה-cluster (ArgoCD/Flux) מושך ועושה לו reconcile כל הזמן.", "k8s-helm-gitops"],
  ["CrashLoopBackOff", "Status meaning a container keeps exiting and kubelet is backing off restarts (up to 5 min); check logs --previous.", "סטטוס שאומר שקונטיינר יוצא שוב ושוב וה-kubelet מרווח את ה-restarts (עד 5 דקות); בודקים logs --previous.", "k8s-debugging"],
  ["ImagePullBackOff", "Status meaning the image can't be pulled (wrong tag, auth, rate limit, architecture) and kubelet is backing off retries.", "סטטוס שאומר שאי אפשר למשוך את ה-image (tag שגוי, auth, rate limit, ארכיטקטורה) וה-kubelet מרווח את הניסיונות.", "k8s-debugging"]
].forEach(function (g) {
  INFRA.glossary.push({ term: g[0], track: "kubernetes", def: { en: g[1], he: g[2] }, lesson: g[3] });
});
