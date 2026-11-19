// Your personal lessons. Lessons that Claude Code writes for you with /teach land here.
// Same format as the other content files (see CONTENT_SCHEMA.md). Use track ids from the schema.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// Appended from interview research (topics companies ask about that weren't covered yet)
// ---------------------------------------------------------------------------

INFRA.lessons.push({
  id: "arch-durable-execution",
  track: "architecture",
  order: 50,
  icon: "⏳",
  level: 3,
  minutes: 10,
  title: { en: "Durable Execution: from Celery to Temporal", he: "Durable Execution: מ-Celery ל-Temporal" },
  tldr: {
    en: "Task queues run functions; durable-execution engines run whole workflows whose state survives crashes, retries and deploys.",
    he: "Task queue מריץ פונקציות. מנוע durable execution מריץ workflow שלם, והמצב שלו שורד קריסות, retries ו-deploys."
  },
  analogy: {
    en: "Celery is a stack of sticky notes on a desk: if the worker spills coffee mid-task, the note may be lost or done twice. Temporal is a flight recorder: every step is written down, so after a crash a new pilot replays the log and continues from the exact same point.",
    he: "Celery הוא ערימת פתקים על שולחן: אם ה-worker שופך קפה באמצע משימה, הפתק יכול ללכת לאיבוד או להתבצע פעמיים. Temporal הוא קופסה שחורה של מטוס: כל צעד נרשם, ואחרי קריסה טייס חדש מריץ את היומן ומשיך בדיוק מאותה נקודה."
  },
  sections: [
    { h: { en: "What breaks with plain task queues", he: "מה נשבר ב-task queue רגיל" },
      body: {
        en: `<p>With Celery/RQ/SQS workers, a multi-step business process (charge card → create policy → send email) is <em>your</em> problem to stitch together. Typical pain:</p>
<ul><li><strong>Lost or duplicated tasks</strong>: with <code>acks_late=False</code> a crash loses the task; with <code>acks_late=True</code> a crash re-runs it, so it must be idempotent.</li>
<li><strong>Visibility timeout</strong> (Redis/SQS): a long task outlives the timeout and a second worker picks it up.</li>
<li><strong>Prefetch</strong>: one worker hoards many tasks while others idle.</li>
<li><strong>State lives everywhere</strong>: DB flags, retries in code, cron jobs that "fix stuck orders".</li></ul>`,
        he: `<p>עם workers של Celery/RQ/SQS, תהליך עסקי של כמה שלבים (חיוב כרטיס ← יצירת פוליסה ← שליחת מייל) הוא <em>הבעיה שלך</em> לחבר. כאבים טיפוסיים:</p>
<ul><li><strong>משימות שנעלמות או רצות פעמיים</strong>: עם <code>acks_late=False</code> קריסה מאבדת את המשימה. עם <code>acks_late=True</code> קריסה מריצה אותה מחדש, ולכן היא חייבת להיות idempotent.</li>
<li><strong>Visibility timeout</strong> (Redis/SQS): משימה ארוכה עוברת את ה-timeout ו-worker שני לוקח אותה.</li>
<li><strong>Prefetch</strong>: worker אחד אוגר הרבה משימות בזמן שאחרים בטלים.</li>
<li><strong>ה-state מפוזר בכל מקום</strong>: flags ב-DB, retries בקוד, cron ש"מתקן הזמנות תקועות".</li></ul>`
      } },
    { h: { en: "How durable execution works", he: "איך durable execution עובד" },
      body: {
        en: `<p>In Temporal you write a <strong>Workflow</strong> (deterministic orchestration code) that calls <strong>Activities</strong> (the side-effecting work: HTTP calls, DB writes). The Temporal server persists an <strong>event history</strong> of every step. If a worker dies, another worker <em>replays</em> the history: completed activities are not re-executed, and their recorded results are returned. Retries, timeouts and backoff are declared per activity, not hand-coded.</p>
<pre>@workflow.defn
class IssuePolicy:
    @workflow.run
    async def run(self, req) -&gt; str:
        pay = await workflow.execute_activity(charge_card, req,
              start_to_close_timeout=timedelta(seconds=30),
              retry_policy=RetryPolicy(maximum_attempts=5))
        try:
            return await workflow.execute_activity(create_policy, req, ...)
        except ActivityError:
            await workflow.execute_activity(refund, pay, ...)   # saga compensation
            raise</pre>`,
        he: `<p>ב-Temporal כותבים <strong>Workflow</strong> (קוד תזמור דטרמיניסטי) שקורא ל-<strong>Activities</strong> (העבודה עם side effects: קריאות HTTP, כתיבות ל-DB). שרת Temporal שומר <strong>event history</strong> של כל צעד. אם worker מת, worker אחר עושה <em>replay</em> להיסטוריה: activities שהסתיימו לא רצים שוב, ומוחזרות התוצאות שנרשמו. Retries, timeouts ו-backoff מוגדרים לכל activity, לא נכתבים ידנית.</p>
<pre>@workflow.defn
class IssuePolicy:
    @workflow.run
    async def run(self, req) -&gt; str:
        pay = await workflow.execute_activity(charge_card, req,
              start_to_close_timeout=timedelta(seconds=30),
              retry_policy=RetryPolicy(maximum_attempts=5))
        try:
            return await workflow.execute_activity(create_policy, req, ...)
        except ActivityError:
            await workflow.execute_activity(refund, pay, ...)   # saga compensation
            raise</pre>`
      } },
    { h: { en: "The determinism rule", he: "חוק הדטרמיניזם" },
      body: {
        en: `<p>Because workflows are replayed, workflow code must make the same decisions every time: no <code>datetime.now()</code>, <code>random()</code>, direct network/DB calls or threads inside the workflow. Use <code>workflow.now()</code>, put I/O in activities, and change running workflows with <strong>versioning/patching</strong>.</p>
<blockquote>⚠️ Production tip: activities are still <em>at-least-once</em>. A charge activity that times out after the bank processed it will be retried, so pass an idempotency key to the payment API.</blockquote>`,
        he: `<p>בגלל ש-workflows עוברים replay, קוד ה-workflow חייב לקבל את אותן החלטות בכל פעם: בלי <code>datetime.now()</code>, בלי <code>random()</code>, בלי קריאות רשת/DB ישירות ובלי threads בתוך ה-workflow. משתמשים ב-<code>workflow.now()</code>, שמים I/O ב-activities, ומשנים workflows שרצים עם <strong>versioning/patching</strong>.</p>
<blockquote>⚠️ טיפ מהשטח: activities עדיין <em>at-least-once</em>. activity של חיוב שעשה timeout אחרי שהבנק כבר ביצע אותו ירוץ שוב, ולכן מעבירים idempotency key ל-API של התשלומים.</blockquote>`
      } },
    { h: { en: "Migrating Celery → Temporal", he: "מעבר מ-Celery ל-Temporal" },
      body: {
        en: `<ul><li>Start by wrapping existing Celery task bodies as <strong>activities</strong>, unchanged.</li>
<li>Replace chains, chords and "status" columns with one workflow per business process.</li>
<li>Run both side by side: new requests go to Temporal; drain the Celery queues.</li>
<li>Operate Temporal like any stateful system: it needs a DB (Postgres/Cassandra) or Temporal Cloud, plus metrics on schedule-to-start latency and task-queue backlog.</li></ul>
<blockquote>💡 Real world: insurance and fintech form pipelines (submit → validate → KYC → pricing → policy issue) are the textbook case. They run for minutes to days, call flaky 3rd-party APIs, and need compensation.</blockquote>`,
        he: `<ul><li>מתחילים בעטיפה של גופי משימות Celery קיימות כ-<strong>activities</strong>, בלי לשנות אותם.</li>
<li>מחליפים chains, chords ועמודות "סטטוס" ב-workflow אחד לכל תהליך עסקי.</li>
<li>מריצים את שניהם במקביל: בקשות חדשות הולכות ל-Temporal, ותורי Celery מתרוקנים.</li>
<li>מתפעלים את Temporal כמו כל מערכת stateful: הוא צריך DB (Postgres/Cassandra) או Temporal Cloud, וגם מטריקות של schedule-to-start latency ו-backlog בתור.</li></ul>
<blockquote>💡 מהעולם האמיתי: pipelines של טפסים בביטוח ובפינטק (הגשה ← אימות ← KYC ← תמחור ← הנפקת פוליסה) הם המקרה הקלאסי. הם רצים מדקות עד ימים, קוראים ל-APIs לא יציבים של צד שלישי וצריכים compensation.</blockquote>`
      } }
  ],
  diagram: "client -> API -> Temporal server (event history in DB)\n                     |  task queue\n             worker: Workflow code -> Activity(charge) -> Activity(create) -> Activity(email)\n             crash? -> another worker replays history -> continues at next step",
  handsOn: [
    { cmd: "temporal server start-dev", what: { en: "Run a local Temporal server and Web UI (localhost:8233).", he: "הרצת שרת Temporal מקומי עם Web UI (localhost:8233)." } },
    { cmd: "pip install temporalio && python worker.py", what: { en: "Start a Python worker that registers workflows and activities.", he: "הרצת worker ב-Python שרושם workflows ו-activities." } },
    { cmd: "temporal workflow show --workflow-id order-123", what: { en: "Inspect the event history of one workflow run.", he: "צפייה ב-event history של ריצה אחת." } },
    { cmd: "celery -A app inspect active", what: { en: "For comparison: see what Celery workers are running right now.", he: "להשוואה: מה ה-workers של Celery מריצים עכשיו." } }
  ],
  mnemonic: { en: "Workflow decides, Activity does, History remembers.", he: "Workflow מחליט, Activity מבצע, History זוכר." },
  pitfalls: [
    { en: "Calling an API or datetime.now() inside workflow code. Replay then makes different decisions and you get non-determinism errors.", he: "קריאה ל-API או ל-datetime.now() בתוך קוד ה-workflow. ה-replay מקבל אז החלטות שונות ומקבלים שגיאות non-determinism." },
    { en: "Assuming exactly-once activities. They are at-least-once, so side effects still need idempotency keys.", he: "להניח ש-activities רצים בדיוק פעם אחת. הם at-least-once, ולכן side effects עדיין צריכים idempotency keys." },
    { en: "Huge payloads in workflow history. Store blobs in S3/DB and pass references.", he: "payloads ענקיים בהיסטוריה. שומרים blobs ב-S3/DB ומעבירים הפניות." }
  ],
  interview: [
    { q: { en: "Why move from Celery to Temporal?", he: "למה לעבור מ-Celery ל-Temporal?" },
      a: { en: "Celery runs tasks; the multi-step state, retries, timeouts and compensation are hand-built and fragile. Temporal persists workflow state, so crashes and deploys resume exactly where they stopped. Retries and timeouts are declarative, sagas are plain code, and you get visibility into every run.", he: "Celery מריץ משימות, וה-state של כמה שלבים, ה-retries, ה-timeouts וה-compensation נבנים ידנית ושבירים. Temporal שומר את ה-state של ה-workflow, כך שאחרי קריסה או deploy הוא ממשיך בדיוק מאיפה שעצר. Retries ו-timeouts הם הצהרתיים, sagas הן קוד רגיל, ויש visibility לכל ריצה." } },
    { q: { en: "How do you make a Celery task safe to retry?", he: "איך הופכים משימת Celery לבטוחה ל-retry?" },
      a: { en: "Make it idempotent: use a dedupe key (unique constraint or Redis SETNX), an idempotency key to external APIs, and upserts instead of inserts. Then enable acks_late with a visibility timeout longer than the task, and send failures to a DLQ.", he: "הופכים אותה ל-idempotent: dedupe key (unique constraint או Redis SETNX), idempotency key ל-APIs חיצוניים, ו-upsert במקום insert. אחר כך מפעילים acks_late עם visibility timeout ארוך מזמן המשימה, ושולחים כישלונות ל-DLQ." } }
  ],
  quiz: [
    { q: { en: "What happens to a completed activity when a Temporal worker crashes and the workflow is replayed?", he: "מה קורה ל-activity שהסתיים כש-worker של Temporal קורס וה-workflow עובר replay?" },
      options: [ { en: "It runs again", he: "הוא רץ שוב" }, { en: "Its recorded result is returned from history", he: "התוצאה שנרשמה מוחזרת מההיסטוריה" }, { en: "The workflow fails", he: "ה-workflow נכשל" }, { en: "It is skipped with no result", he: "מדלגים עליו בלי תוצאה" } ],
      answer: 1, explain: { en: "Replay reads results from the event history; it does not re-execute completed activities.", he: "ה-replay קורא תוצאות מה-event history ולא מריץ מחדש activities שהסתיימו." } },
    { q: { en: "Which is allowed inside workflow code?", he: "מה מותר בתוך קוד workflow?" },
      options: [ { en: "requests.get()", he: "requests.get()" }, { en: "random.random()", he: "random.random()" }, { en: "workflow.now()", he: "workflow.now()" }, { en: "Starting a thread", he: "הפעלת thread" } ],
      answer: 2, explain: { en: "workflow.now() is deterministic on replay; the others break determinism.", he: "workflow.now() דטרמיניסטי ב-replay, וכל השאר שוברים דטרמיניזם." } },
    { q: { en: "In Celery, acks_late=True means…", he: "ב-Celery, acks_late=True אומר…" },
      options: [ { en: "Tasks are never retried", he: "משימות לעולם לא חוזרות" }, { en: "A worker crash re-delivers the task, so it must be idempotent", he: "קריסת worker מחזירה את המשימה לתור, ולכן היא חייבת להיות idempotent" }, { en: "Tasks run exactly once", he: "משימות רצות בדיוק פעם אחת" }, { en: "The broker deletes tasks immediately", he: "ה-broker מוחק משימות מיד" } ],
      answer: 1, explain: { en: "Ack after execution gives at-least-once delivery.", he: "Ack אחרי הביצוע נותן at-least-once." } }
  ],
  playground: "queue",
  related: ["arch-queues", "staff-exactly-once", "arch-event-driven"]
});

INFRA.lessons.push({
  id: "k8s-gpu-inference",
  track: "kubernetes",
  order: 50,
  icon: "🎮",
  level: 3,
  minutes: 11,
  title: { en: "GPU & LLM Inference on Kubernetes", he: "GPU ו-LLM Inference על Kubernetes" },
  tldr: {
    en: "Serving LLMs on K8s means scheduling scarce GPUs, loading huge weights fast, and autoscaling on queue depth and tokens, not CPU.",
    he: "להגיש LLMs על K8s זה לתזמן GPUs נדירים, לטעון weights ענקיים מהר, ולעשות autoscaling לפי עומק תור וטוקנים, לא לפי CPU."
  },
  analogy: {
    en: "A GPU node is a Formula 1 car: incredibly fast, very expensive, and useless while it waits in the garage. Inference platform work is pit-crew work: keep the car on track (high utilization), refuel fast (load weights), and never let two drivers fight for one car.",
    he: "Node עם GPU הוא מכונית פורמולה 1: מהירה להפליא, יקרה מאוד, וחסרת תועלת כשהיא עומדת במוסך. עבודת פלטפורמת inference היא עבודה של צוות פיטסטופ: לשמור על המכונית במסלול (utilization גבוה), לתדלק מהר (טעינת weights), ולא לתת לשני נהגים לריב על אותה מכונית."
  },
  sections: [
    { h: { en: "Getting GPUs into pods", he: "איך GPU מגיע ל-Pod" },
      body: {
        en: `<p>Nodes advertise GPUs via the <strong>NVIDIA device plugin</strong>, usually installed by the <strong>GPU Operator</strong>, which also installs drivers, the container toolkit and the DCGM exporter. Pods request them as an extended resource. GPUs can't be overcommitted or fractionally requested by default:</p>
<pre>resources:
  limits:
    nvidia.com/gpu: 1
nodeSelector: { nvidia.com/gpu.product: NVIDIA-A100-SXM4-80GB }
tolerations:
- key: nvidia.com/gpu
  operator: Exists
  effect: NoSchedule</pre>
<p>Taint GPU nodes so CPU workloads don't land on expensive hardware. For sharing, use <strong>MIG</strong> (A100/H100 hardware partitions with isolation) or <strong>time-slicing</strong> (soft sharing with no memory isolation).</p>`,
        he: `<p>Nodes מפרסמים GPUs דרך <strong>NVIDIA device plugin</strong>, שבדרך כלל מותקן על ידי <strong>GPU Operator</strong>, שמתקין גם drivers, container toolkit ו-DCGM exporter. Pods מבקשים אותם כ-extended resource. כברירת מחדל אי אפשר לעשות overcommit או לבקש חלק מ-GPU:</p>
<pre>resources:
  limits:
    nvidia.com/gpu: 1
nodeSelector: { nvidia.com/gpu.product: NVIDIA-A100-SXM4-80GB }
tolerations:
- key: nvidia.com/gpu
  operator: Exists
  effect: NoSchedule</pre>
<p>שמים taint על nodes של GPU כדי ש-workloads של CPU לא ינחתו על חומרה יקרה. לשיתוף משתמשים ב-<strong>MIG</strong> (חלוקה בחומרה עם בידוד ב-A100/H100) או ב-<strong>time-slicing</strong> (שיתוף רך בלי בידוד זיכרון).</p>`
      } },
    { h: { en: "Serving engines: vLLM and friends", he: "מנועי הגשה: vLLM וחבריו" },
      body: {
        en: `<p><strong>vLLM</strong> gets high throughput from <em>continuous batching</em> (new requests join a running batch) and <em>PagedAttention</em> (KV-cache stored in pages like virtual memory). Key knobs: <code>--tensor-parallel-size</code> (split one model across N GPUs on a node), <code>--max-model-len</code>, and <code>--gpu-memory-utilization</code>. GPU memory = weights + KV cache, and the KV cache grows with concurrent tokens.</p>
<p><strong>Ray / KubeRay</strong> handles multi-node serving and batch jobs. <strong>KServe</strong> and the NVIDIA <strong>Triton</strong> server are alternatives.</p>
<blockquote>💡 Real world: a 70B model in FP16 needs about 140 GB for weights alone, so it needs at least 2×80 GB GPUs with tensor parallelism before you count any KV cache.</blockquote>`,
        he: `<p><strong>vLLM</strong> מגיע ל-throughput גבוה בזכות <em>continuous batching</em> (בקשות חדשות מצטרפות ל-batch שרץ) ו-<em>PagedAttention</em> (ה-KV-cache נשמר בדפים כמו זיכרון וירטואלי). הכפתורים החשובים: <code>--tensor-parallel-size</code> (פיצול מודל אחד על N GPUs ב-node), <code>--max-model-len</code> ו-<code>--gpu-memory-utilization</code>. זיכרון GPU = weights + KV cache, וה-KV cache גדל עם מספר הטוקנים המקבילים.</p>
<p><strong>Ray / KubeRay</strong> מטפל בהגשה על כמה nodes ובעבודות batch. <strong>KServe</strong> ושרת <strong>Triton</strong> של NVIDIA הם חלופות.</p>
<blockquote>💡 מהעולם האמיתי: מודל 70B ב-FP16 צריך כ-140GB רק ל-weights, כלומר לפחות 2 GPUs של 80GB עם tensor parallelism, עוד לפני ה-KV cache.</blockquote>`
      } },
    { h: { en: "Cold starts, autoscaling and cost", he: "Cold starts, autoscaling ועלויות" },
      body: {
        en: `<ul><li><strong>Weights loading</strong> dominates cold start (tens of GB). Cache them on node-local NVMe, use a shared read-only PVC, or pre-pull into the image (huge images are slow too). Keep warm replicas for latency SLOs.</li>
<li><strong>Autoscale on the right signal</strong>: CPU is meaningless. Use queue depth / pending requests (vLLM <code>num_requests_waiting</code>), KV-cache usage, or TTFT, through <strong>KEDA</strong> or the HPA with custom metrics. Pair with the cluster autoscaler or Karpenter for GPU node pools.</li>
<li><strong>Cost</strong>: spot GPUs for batch and offline work, bin-packing, MIG for small models, and scale-to-zero for dev endpoints.</li></ul>`,
        he: `<ul><li><strong>טעינת weights</strong> שולטת ב-cold start (עשרות GB). שומרים אותם ב-cache על NVMe מקומי של ה-node, משתמשים ב-PVC משותף read-only, או מכניסים מראש ל-image (גם images ענקיים איטיים). מחזיקים replicas חמים בשביל ה-SLO של latency.</li>
<li><strong>Autoscaling לפי הסיגנל הנכון</strong>: CPU חסר משמעות. משתמשים בעומק תור / בקשות ממתינות (ב-vLLM: <code>num_requests_waiting</code>), בניצול KV-cache או ב-TTFT, דרך <strong>KEDA</strong> או HPA עם custom metrics. משלבים עם cluster autoscaler או Karpenter ל-node pools של GPU.</li>
<li><strong>עלויות</strong>: spot GPUs לעבודות batch ו-offline, bin-packing, MIG למודלים קטנים, ו-scale-to-zero ל-endpoints של dev.</li></ul>`
      } },
    { h: { en: "What to monitor", he: "מה לנטר" },
      body: {
        en: `<table><tr><th>Metric</th><th>Why</th></tr>
<tr><td>TTFT (time to first token)</td><td>user-perceived latency</td></tr>
<tr><td>Tokens/sec, ITL (inter-token latency)</td><td>throughput and streaming smoothness</td></tr>
<tr><td>DCGM_FI_DEV_GPU_UTIL, memory used</td><td>are you paying for idle GPUs?</td></tr>
<tr><td>KV-cache usage %, preemptions</td><td>near 100% means requests get evicted or queued</td></tr>
<tr><td>Queue depth</td><td>the autoscaling signal</td></tr></table>
<blockquote>⚠️ Production tip: roll out new model versions with a canary (Argo Rollouts) and compare quality metrics, not just latency. A faster model that answers worse is a regression.</blockquote>`,
        he: `<table><tr><th>מטריקה</th><th>למה</th></tr>
<tr><td>TTFT (זמן עד טוקן ראשון)</td><td>ה-latency שהמשתמש מרגיש</td></tr>
<tr><td>Tokens/sec, ITL (latency בין טוקנים)</td><td>throughput וזרימת streaming חלקה</td></tr>
<tr><td>DCGM_FI_DEV_GPU_UTIL, זיכרון בשימוש</td><td>האם משלמים על GPUs בטלים?</td></tr>
<tr><td>% ניצול KV-cache, preemptions</td><td>קרוב ל-100% = בקשות נזרקות או ממתינות</td></tr>
<tr><td>עומק תור</td><td>הסיגנל ל-autoscaling</td></tr></table>
<blockquote>⚠️ טיפ מהשטח: מוציאים גרסת מודל חדשה ב-canary (Argo Rollouts) ומשווים גם מדדי איכות, לא רק latency. מודל מהיר יותר שעונה גרוע יותר הוא רגרסיה.</blockquote>`
      } }
  ],
  diagram: "client -> gateway -> vLLM Service (Deployment, nvidia.com/gpu: 2, TP=2)\n                         ^ KEDA scales on num_requests_waiting\nGPU node pool (tainted) <- Karpenter/CA adds nodes\nweights: node NVMe cache / RO PVC     metrics: DCGM exporter -> Prometheus",
  handsOn: [
    { cmd: "kubectl get nodes -L nvidia.com/gpu.product -o wide", what: { en: "See which nodes have which GPU model (labels from GPU feature discovery).", he: "לראות לאילו nodes יש איזה דגם GPU (labels מ-GPU feature discovery)." } },
    { cmd: "kubectl describe node <gpu-node> | grep -A3 nvidia.com/gpu", what: { en: "Check capacity vs allocatable vs allocated GPUs.", he: "לבדוק capacity מול allocatable מול GPUs שהוקצו." } },
    { cmd: "kubectl exec -it <pod> -- nvidia-smi", what: { en: "GPU utilization and memory from inside the pod.", he: "ניצול GPU וזיכרון מתוך ה-Pod." } },
    { cmd: "vllm serve meta-llama/Llama-3.1-8B-Instruct --tensor-parallel-size 1 --gpu-memory-utilization 0.9", what: { en: "Start an OpenAI-compatible inference server.", he: "הרצת שרת inference תואם OpenAI." } }
  ],
  mnemonic: { en: "Taint it, fit it, warm it, scale it on the queue.", he: "Taint, לבדוק שנכנס, לחמם, ולהגדיל לפי התור." },
  pitfalls: [
    { en: "Autoscaling GPU pods on CPU. CPU stays low while requests pile up.", he: "Autoscaling של Pods עם GPU לפי CPU. ה-CPU נשאר נמוך בזמן שבקשות נערמות." },
    { en: "No taints on GPU nodes. Random CPU pods block GPU workloads and burn money.", he: "בלי taints על nodes של GPU. Pods אקראיים של CPU חוסמים workloads של GPU ושורפים כסף." },
    { en: "Sizing GPU memory for weights only. The KV cache under concurrency causes OOM or preemption.", he: "תכנון זיכרון GPU רק ל-weights. ה-KV cache בעומס מקבילי גורם ל-OOM או ל-preemption." }
  ],
  interview: [
    { q: { en: "How would you autoscale an LLM inference service?", he: "איך תעשה autoscaling לשירות LLM inference?" },
      a: { en: "Scale pods on queue depth or pending requests (or KV-cache utilization / TTFT SLO) via KEDA or HPA with custom metrics. Scale GPU nodes with Karpenter or the cluster autoscaler on dedicated, tainted pools. Keep a warm minimum for latency, cache weights locally to cut cold start, and use spot GPUs for batch.", he: "Scaling של Pods לפי עומק תור או בקשות ממתינות (או ניצול KV-cache / SLO של TTFT) עם KEDA או HPA עם custom metrics. Scaling של nodes עם Karpenter או cluster autoscaler על pools ייעודיים עם taint. מחזיקים מינימום חם בשביל latency, שומרים weights ב-cache מקומי כדי לקצר cold start, ומשתמשים ב-spot GPUs ל-batch." } },
    { q: { en: "MIG vs time-slicing?", he: "MIG מול time-slicing?" },
      a: { en: "MIG partitions A100/H100 GPUs in hardware, with dedicated memory and compute and real isolation, so it's good for multi-tenant small models. Time-slicing shares a whole GPU by context switching, with no memory isolation and noisy neighbours, so it's good for dev and light loads.", he: "MIG מחלק GPUs מסוג A100/H100 בחומרה, עם זיכרון ו-compute ייעודיים ובידוד אמיתי, ולכן מתאים למודלים קטנים multi-tenant. Time-slicing משתף GPU שלם בהחלפת הקשר, בלי בידוד זיכרון ועם noisy neighbours, ולכן מתאים ל-dev ולעומסים קלים." } }
  ],
  quiz: [
    { q: { en: "Best autoscaling signal for a vLLM deployment?", he: "הסיגנל הכי טוב ל-autoscaling של vLLM?" },
      options: [ { en: "CPU utilization", he: "ניצול CPU" }, { en: "Pending requests / queue depth", he: "בקשות ממתינות / עומק תור" }, { en: "Pod memory RSS", he: "זיכרון RSS של ה-Pod" }, { en: "Node count", he: "מספר nodes" } ],
      answer: 1, explain: { en: "GPU servers are bottlenecked on the GPU; queue depth reflects real demand.", he: "צוואר הבקבוק של שרתי GPU הוא ה-GPU, ועומק התור משקף את הביקוש האמיתי." } },
    { q: { en: "What grows with the number of concurrent tokens?", he: "מה גדל עם מספר הטוקנים המקבילים?" },
      options: [ { en: "Model weights", he: "Model weights" }, { en: "KV cache", he: "KV cache" }, { en: "Container image", he: "Container image" }, { en: "CUDA driver", he: "CUDA driver" } ],
      answer: 1, explain: { en: "Weights are fixed; the KV cache scales with context × concurrency.", he: "ה-weights קבועים, וה-KV cache גדל לפי context × concurrency." } },
    { q: { en: "Why taint GPU nodes?", he: "למה לשים taint על nodes של GPU?" },
      options: [ { en: "To enable MIG", he: "כדי להפעיל MIG" }, { en: "So only pods that tolerate it (GPU workloads) schedule there", he: "כדי שרק Pods עם toleration (workloads של GPU) יתוזמנו שם" }, { en: "To install drivers", he: "כדי להתקין drivers" }, { en: "Required by vLLM", he: "vLLM דורש את זה" } ],
      answer: 1, explain: { en: "Taints keep cheap CPU pods off expensive GPU nodes.", he: "Taints מרחיקים Pods זולים של CPU מ-nodes יקרים של GPU." } }
  ],
  playground: "scaling",
  related: ["k8s-keda", "k8s-node-autoprovisioning", "k8s-scheduling", "k8s-cost"]
});

INFRA.lessons.push({
  id: "ai-agent-infra-mcp",
  track: "ai",
  order: 14,
  icon: "🤖",
  level: 3,
  minutes: 10,
  title: { en: "AI Agents & MCP Infrastructure", he: "תשתית ל-AI Agents ו-MCP" },
  tldr: {
    en: "MCP turns internal systems into tools an LLM agent can call; the infra job is auth, least privilege, guardrails, observability and evals.",
    he: "MCP הופך מערכות פנימיות לכלים שסוכן LLM יכול לקרוא להם. עבודת התשתית היא auth, least privilege, guardrails, observability ו-evals."
  },
  analogy: {
    en: "An agent is a brilliant new intern with root on day one, unless you design it otherwise. MCP servers are the badge readers on each door: they decide which rooms the intern can enter, log every swipe, and require a manager's signature for the vault.",
    he: "Agent הוא מתמחה מבריק עם root מהיום הראשון, אלא אם מתכננים אחרת. שרתי MCP הם קוראי הכרטיסים בכל דלת: הם מחליטים לאילו חדרים המתמחה נכנס, רושמים כל העברה, ודורשים חתימת מנהל לכספת."
  },
  sections: [
    { h: { en: "What MCP is", he: "מה זה MCP" },
      body: {
        en: `<p>The <strong>Model Context Protocol</strong> is an open protocol (JSON-RPC) between an AI client (Claude Code, an IDE, your agent) and <strong>MCP servers</strong> that expose <em>tools</em> (functions with JSON schemas), <em>resources</em> (readable data) and <em>prompts</em>. Transports: <code>stdio</code> for local servers and Streamable HTTP for remote ones, with OAuth for auth. One server, for example "kubectl-readonly" or "deploy-status", can serve every agent in the company.</p>`,
        he: `<p><strong>Model Context Protocol</strong> הוא פרוטוקול פתוח (JSON-RPC) בין לקוח AI (Claude Code, IDE, ה-agent שלך) לבין <strong>שרתי MCP</strong> שחושפים <em>tools</em> (פונקציות עם JSON schema), <em>resources</em> (מידע לקריאה) ו-<em>prompts</em>. Transports: <code>stdio</code> לשרת מקומי ו-Streamable HTTP לשרת מרוחק, עם OAuth לאימות. שרת אחד, למשל "kubectl-readonly" או "deploy-status", יכול לשרת את כל ה-agents בחברה.</p>`
      } },
    { h: { en: "Designing an internal MCP server", he: "תכנון שרת MCP פנימי" },
      body: {
        en: `<ul><li><strong>Narrow tools, not shells</strong>: <code>get_pod_logs(ns, pod, tail)</code> beats <code>run_command(cmd)</code>. Validate every argument against the schema and an allow-list.</li>
<li><strong>Identity</strong>: the server calls backends with a workload identity (managed identity / IRSA), scoped per tool. Use read-only by default and act on behalf of the user where possible (OAuth token exchange).</li>
<li><strong>Human-in-the-loop</strong> for anything mutating: return a plan or diff, and require an approval step (PR, ChatOps button) before execution.</li>
<li><strong>Output hygiene</strong>: truncate, redact secrets and PII, and treat tool output as untrusted, because it can contain prompt injections.</li>
<li><strong>Observability</strong>: log every call (who, which tool, args, latency, result size) with traces, plus rate limits and per-user quotas.</li></ul>
<pre>@mcp.tool()
def get_pod_logs(namespace: str, pod: str, tail: int = 200) -&gt; str:
    """Read-only. Last N log lines of a pod."""
    assert namespace in ALLOWED_NS and 0 &lt; tail &lt;= 2000
    return redact(k8s.read_namespaced_pod_log(pod, namespace, tail_lines=tail))</pre>`,
        he: `<ul><li><strong>Tools צרים, לא shell</strong>: <code>get_pod_logs(ns, pod, tail)</code> עדיף על <code>run_command(cmd)</code>. מאמתים כל ארגומנט מול ה-schema ומול allow-list.</li>
<li><strong>זהות</strong>: השרת קורא ל-backends עם workload identity (managed identity / IRSA) בהרשאה מוגבלת לכל tool. read-only כברירת מחדל, ופעולה בשם המשתמש כשאפשר (OAuth token exchange).</li>
<li><strong>Human-in-the-loop</strong> לכל דבר שמשנה מצב: מחזירים תוכנית או diff, ודורשים שלב אישור (PR, כפתור ChatOps) לפני ביצוע.</li>
<li><strong>היגיינת פלט</strong>: לקצר, להסתיר סודות ו-PII, ולהתייחס לפלט של tools כלא-אמין, כי הוא יכול להכיל prompt injection.</li>
<li><strong>Observability</strong>: לרשום כל קריאה (מי, איזה tool, ארגומנטים, latency, גודל תוצאה) עם traces, יחד עם rate limits ו-quotas לכל משתמש.</li></ul>
<pre>@mcp.tool()
def get_pod_logs(namespace: str, pod: str, tail: int = 200) -&gt; str:
    """Read-only. Last N log lines of a pod."""
    assert namespace in ALLOWED_NS and 0 &lt; tail &lt;= 2000
    return redact(k8s.read_namespaced_pod_log(pod, namespace, tail_lines=tail))</pre>`
      } },
    { h: { en: "Agents in CI/CD and platform work", he: "Agents ב-CI/CD ובעבודת פלטפורמה" },
      body: {
        en: `<p>Common, safe patterns: an agent that reviews PRs and comments (no merge rights), an agent that drafts the IaC change and opens a PR (humans approve, the pipeline applies), and incident copilots with read-only MCP tools over logs and metrics. Run agent jobs in ephemeral sandboxes with short-lived credentials and no production write access.</p>
<blockquote>💡 Real world: the biggest productivity wins come from context-gathering tools (diagnostics, deployment status, runbooks), not from letting the agent change prod.</blockquote>`,
        he: `<p>דפוסים נפוצים ובטוחים: agent שסוקר PRs ומעיר (בלי הרשאת merge), agent שמנסח שינוי IaC ופותח PR (אנשים מאשרים, ה-pipeline מריץ apply), ו-copilots ל-incidents עם tools של MCP לקריאה בלבד מעל logs ו-metrics. מריצים jobs של agents ב-sandboxes זמניים עם credentials קצרי חיים ובלי הרשאת כתיבה לפרודקשן.</p>
<blockquote>💡 מהעולם האמיתי: רוב הרווח בפרודוקטיביות מגיע מ-tools לאיסוף הקשר (diagnostics, סטטוס deploy, runbooks), לא מלתת ל-agent לשנות פרודקשן.</blockquote>`
      } },
    { h: { en: "Evals and guardrails", he: "Evals ו-guardrails" },
      body: {
        en: `<ul><li><strong>Evals</strong>: a fixed set of tasks with expected outcomes (did it pick the right tool? correct args? correct answer?), run in CI on every prompt or tool change, and track pass rate over time.</li>
<li><strong>Guardrails</strong>: input filters (prompt injection), output validation (schemas), policy checks (OPA) before actions, and budget limits on tokens, steps and spend.</li>
<li><strong>Threats</strong>: prompt injection through tool output, over-privileged tokens, data exfiltration through tool args, and confused-deputy attacks.</li></ul>`,
        he: `<ul><li><strong>Evals</strong>: סט קבוע של משימות עם תוצאות צפויות (בחר את ה-tool הנכון? ארגומנטים נכונים? תשובה נכונה?), שרץ ב-CI על כל שינוי prompt או tool, עם מעקב אחרי ה-pass rate לאורך זמן.</li>
<li><strong>Guardrails</strong>: סינון קלט (prompt injection), ולידציה של פלט (schemas), בדיקות policy (OPA) לפני פעולה, ותקרות תקציב לטוקנים, צעדים והוצאה.</li>
<li><strong>איומים</strong>: prompt injection דרך פלט של tools, tokens עם הרשאות יתר, זליגת מידע דרך ארגומנטים של tools, ו-confused deputy.</li></ul>`
      } }
  ],
  diagram: "agent (Claude Code / CI job) --MCP--> internal MCP server --(workload identity, least privilege)--> K8s API / logs / deploy system\n                                        |-> audit log + traces + rate limit\nmutations -> plan/diff -> human approval -> pipeline applies",
  handsOn: [
    { cmd: "claude mcp add k8s-ro -- python k8s_readonly_server.py", what: { en: "Register a local stdio MCP server with Claude Code.", he: "רישום שרת MCP מקומי (stdio) ב-Claude Code." } },
    { cmd: "npx @modelcontextprotocol/inspector python server.py", what: { en: "Inspect a server's tools and call them manually.", he: "בדיקת ה-tools של שרת וקריאה להם ידנית." } },
    { cmd: "pip install mcp && python -c \"import mcp; print(mcp.__version__)\"", what: { en: "Install the Python MCP SDK (FastMCP).", he: "התקנת ה-SDK של MCP ל-Python (FastMCP)." } }
  ],
  mnemonic: { en: "Narrow tools, borrowed identity, human on writes, log everything, eval always.", he: "Tools צרים, זהות מושאלת, אדם על כל כתיבה, לוג על הכל, evals תמיד." },
  pitfalls: [
    { en: "Exposing a generic 'run shell' tool. One prompt injection becomes RCE.", he: "חשיפת tool כללי של 'run shell'. prompt injection אחד הופך ל-RCE." },
    { en: "Using a long-lived admin token for the MCP server. Use workload identity with per-tool scopes.", he: "שימוש ב-admin token ארוך חיים לשרת ה-MCP. עדיף workload identity עם scopes לכל tool." },
    { en: "No evals. A prompt tweak silently breaks tool selection.", he: "בלי evals. שינוי קטן ב-prompt שובר בשקט את בחירת ה-tools." }
  ],
  interview: [
    { q: { en: "Design an MCP server that exposes internal diagnostics to engineers' agents.", he: "תכנן שרת MCP שחושף diagnostics פנימיים ל-agents של המהנדסים." },
      a: { en: "Remote MCP over HTTP with OAuth (SSO), narrow read-only tools with schema and allow-list validation, backend calls via workload identity scoped per tool and on behalf of the user, output redaction and truncation, audit logs and traces per call, rate limits, an eval suite in CI, and mutations only via PR or approval flows.", he: "MCP מרוחק על HTTP עם OAuth (SSO), tools צרים לקריאה בלבד עם ולידציה של schema ו-allow-list, קריאות ל-backends דרך workload identity עם scope לכל tool ובשם המשתמש, הסתרה וקיצור של הפלט, audit log ו-traces לכל קריאה, rate limits, סט evals ב-CI, ושינויים רק דרך PR או תהליך אישור." } },
    { q: { en: "How do you safely add an AI agent to a CI pipeline?", he: "איך מוסיפים AI agent ל-pipeline בצורה בטוחה?" },
      a: { en: "Run it in an ephemeral sandbox with short-lived, least-privilege credentials. It can comment and open PRs but not merge or deploy. Treat its output as untrusted (normal tests, policy checks and human review still apply), cap tokens and steps, and log everything.", he: "מריצים אותו ב-sandbox זמני עם credentials קצרי חיים ו-least privilege. הוא יכול להעיר ולפתוח PRs, אבל לא לעשות merge או deploy. מתייחסים לפלט שלו כלא-אמין (בדיקות רגילות, policy ו-review אנושי עדיין חלים), מגבילים טוקנים וצעדים, ורושמים הכל." } }
  ],
  quiz: [
    { q: { en: "Which MCP tool design is safest?", he: "איזה עיצוב tool ב-MCP הכי בטוח?" },
      options: [ { en: "run_command(cmd)", he: "run_command(cmd)" }, { en: "get_pod_logs(ns, pod, tail) with allow-listed namespaces", he: "get_pod_logs(ns, pod, tail) עם allow-list של namespaces" }, { en: "kubectl(args) with admin kubeconfig", he: "kubectl(args) עם admin kubeconfig" }, { en: "eval(python_code)", he: "eval(python_code)" } ],
      answer: 1, explain: { en: "Narrow, typed, validated, read-only tools limit the blast radius.", he: "Tools צרים, עם טיפוסים, ולידציה ו-read-only מגבילים את ה-blast radius." } },
    { q: { en: "Tool output should be treated as…", he: "פלט של tool צריך להיחשב…" },
      options: [ { en: "Trusted system instructions", he: "הוראות מערכת אמינות" }, { en: "Untrusted data that may contain prompt injection", he: "מידע לא אמין שעלול להכיל prompt injection" }, { en: "Always safe if from internal systems", he: "תמיד בטוח אם מגיע ממערכת פנימית" }, { en: "Executable code", he: "קוד להרצה" } ],
      answer: 1, explain: { en: "Logs, tickets and web pages can carry attacker-written text.", he: "Logs, tickets ודפי web יכולים להכיל טקסט שתוקף כתב." } },
    { q: { en: "What catches a regression when you change an agent's prompt?", he: "מה תופס רגרסיה כשמשנים prompt של agent?" },
      options: [ { en: "Unit tests of the MCP SDK", he: "בדיקות יחידה של ה-SDK" }, { en: "An eval suite run in CI", he: "סט evals שרץ ב-CI" }, { en: "Bigger model", he: "מודל גדול יותר" }, { en: "Higher temperature", he: "temperature גבוה יותר" } ],
      answer: 1, explain: { en: "Evals measure task success before users notice.", he: "Evals מודדים הצלחה במשימות לפני שהמשתמשים שמים לב." } }
  ],
  related: ["staff-zero-trust-secrets", "staff-platform-engineering", "staff-supply-chain"]
});

INFRA.lessons.push({
  id: "cloud-airgapped",
  track: "cloud",
  order: 50,
  icon: "🏝️",
  level: 3,
  minutes: 9,
  title: { en: "Air-Gapped & Disconnected Environments", he: "סביבות Air-Gapped ורשתות מנותקות" },
  tldr: {
    en: "With no internet, everything you normally pull (images, packages, charts, updates, certificates, time) must be mirrored, signed, carried in and kept in sync on purpose.",
    he: "בלי אינטרנט, כל מה שבדרך כלל מושכים (images, packages, charts, עדכונים, תעודות, שעון) צריך mirror, חתימה, הכנסה פנימה וסנכרון מכוון."
  },
  analogy: {
    en: "An air-gapped network is a submarine. Nothing arrives mid-mission, so you load every spare part before diving, check it at the hatch, and keep a precise inventory. If you forgot one bolt, you can't download it.",
    he: "רשת air-gapped היא צוללת. שום דבר לא מגיע באמצע המשימה, אז מעמיסים כל חלק חילוף לפני הצלילה, בודקים אותו בפתח, ומחזיקים מלאי מדויק. שכחת בורג? אי אפשר להוריד אותו."
  },
  sections: [
    { h: { en: "What you must bring inside", he: "מה חייבים להכניס פנימה" },
      body: {
        en: `<ul><li><strong>Container images</strong>: an internal registry (Harbor, Nexus, Artifactory, Zot). Mirror with <code>skopeo copy</code> or <code>oras</code>, and rewrite image references (or use registry mirrors in containerd).</li>
<li><strong>Packages</strong>: PyPI, npm, Maven and apt/yum proxies or snapshots (Nexus/Artifactory, <code>pip download</code>, aptly, reposync).</li>
<li><strong>Helm charts and operators</strong>: OCI chart repos, and an OLM catalog mirror for OpenShift (<code>oc-mirror</code>).</li>
<li><strong>Tooling</strong>: Terraform providers (<code>terraform providers mirror</code>), CLIs, and VS Code extensions.</li>
<li><strong>Trust and time</strong>: an internal CA and PKI, an NTP source, internal DNS, and vulnerability DBs (Trivy offline DB).</li></ul>`,
        he: `<ul><li><strong>Container images</strong>: registry פנימי (Harbor, Nexus, Artifactory, Zot). עושים mirror עם <code>skopeo copy</code> או <code>oras</code>, ומשכתבים את הפניות ה-image (או מגדירים registry mirrors ב-containerd).</li>
<li><strong>Packages</strong>: proxies או snapshots ל-PyPI, npm, Maven ו-apt/yum (Nexus/Artifactory, <code>pip download</code>, aptly, reposync).</li>
<li><strong>Helm charts ו-operators</strong>: OCI chart repos, ו-mirror של OLM catalog ב-OpenShift (<code>oc-mirror</code>).</li>
<li><strong>כלים</strong>: Terraform providers (<code>terraform providers mirror</code>), CLIs ו-extensions ל-VS Code.</li>
<li><strong>אמון וזמן</strong>: CA ו-PKI פנימיים, מקור NTP, DNS פנימי, ו-DBs של חולשות (DB אופליין של Trivy).</li></ul>`
      } },
    { h: { en: "The transfer pipeline (low → high)", he: "צינור ההעברה (נמוך ← גבוה)" },
      body: {
        en: `<p>On the connected side, a "build and collect" job resolves exact versions (lockfiles, digests), scans them, signs them (cosign), and bundles them as a tarball or OCI archive with a manifest and checksums. The bundle crosses the gap through a data diode, approved media or a one-way transfer service. Inside, an import job verifies signatures and checksums, pushes to the internal registry and repos, and records what arrived.</p>
<pre>skopeo copy --all docker://registry.k8s.io/ingress-nginx/controller@sha256:... \
  oci-archive:bundle/ingress.tar
sha256sum bundle/* &gt; bundle/SHA256SUMS && cosign sign-blob bundle/SHA256SUMS ...
# inside:
skopeo copy oci-archive:ingress.tar docker://harbor.internal/mirror/ingress-nginx/controller:v1.11</pre>
<blockquote>⚠️ Production tip: pin everything by <strong>digest</strong>, not tag. Inside the gap you can't ask the internet what <code>latest</code> meant last Tuesday.</blockquote>`,
        he: `<p>בצד המחובר, job של "build and collect" קובע גרסאות מדויקות (lockfiles, digests), סורק, חותם (cosign), ואורז ל-tarball או ל-OCI archive עם manifest ו-checksums. החבילה עוברת את הפער דרך data diode, מדיה מאושרת או שירות העברה חד-כיווני. בפנים, job של import מאמת חתימות ו-checksums, דוחף ל-registry ול-repos הפנימיים, ורושם מה הגיע.</p>
<pre>skopeo copy --all docker://registry.k8s.io/ingress-nginx/controller@sha256:... \
  oci-archive:bundle/ingress.tar
sha256sum bundle/* &gt; bundle/SHA256SUMS && cosign sign-blob bundle/SHA256SUMS ...
# inside:
skopeo copy oci-archive:ingress.tar docker://harbor.internal/mirror/ingress-nginx/controller:v1.11</pre>
<blockquote>⚠️ טיפ מהשטח: נועלים הכל לפי <strong>digest</strong>, לא tag. בתוך הפער אי אפשר לשאול את האינטרנט מה <code>latest</code> היה ביום שלישי שעבר.</blockquote>`
      } },
    { h: { en: "Operating inside", he: "תפעול מבפנים" },
      body: {
        en: `<ul><li><strong>Self-hosted everything</strong>: Git (GitLab), CI (Jenkins / Azure DevOps Server agents), artifact repos and monitoring. Backups and upgrades of these tools are now your job, so test restores.</li>
<li><strong>Kubernetes</strong>: install with offline bundles (RKE2/k3s airgap tarballs, OpenShift disconnected install), point containerd at the internal mirror, and run cert-manager with an internal CA issuer.</li>
<li><strong>Updates cadence</strong>: a monthly or quarterly bundle with CVE scanning before transfer. Emergency CVEs need a fast lane.</li>
<li><strong>Licensing and SaaS dependencies</strong>: anything that "phones home" (license servers, telemetry, OCSP checks) breaks. Find these before the go-live.</li></ul>`,
        he: `<ul><li><strong>הכל self-hosted</strong>: Git (GitLab), CI (Jenkins / agents של Azure DevOps Server), artifact repos וניטור. גיבויים ושדרוגים של הכלים האלה הם עכשיו העבודה שלך, אז בודקים שחזורים.</li>
<li><strong>Kubernetes</strong>: התקנה מחבילות אופליין (RKE2/k3s airgap tarballs, התקנה disconnected של OpenShift), הפניית containerd ל-mirror הפנימי, ו-cert-manager עם issuer של CA פנימי.</li>
<li><strong>קצב עדכונים</strong>: bundle חודשי או רבעוני עם סריקת CVE לפני ההעברה. CVEs דחופים צריכים מסלול מהיר.</li>
<li><strong>רישוי ותלויות SaaS</strong>: כל מה ש"מתקשר הביתה" (שרתי רישוי, טלמטריה, בדיקות OCSP) נשבר. מוצאים את אלה לפני ה-go-live.</li></ul>`
      } }
  ],
  diagram: "internet -> collect+scan+sign (lockfiles, digests) -> bundle.tar + SHA256SUMS + sig\n   == data diode / approved media ==>\ninside: verify -> Harbor/Nexus mirrors -> K8s (containerd mirror), CI agents, pip/npm/apt proxies\n         internal CA, NTP, DNS",
  handsOn: [
    { cmd: "skopeo copy --all docker://nginx@sha256:<digest> oci-archive:nginx.tar", what: { en: "Export a multi-arch image by digest to a portable archive.", he: "ייצוא image (כל הארכיטקטורות) לפי digest לארכיון נייד." } },
    { cmd: "pip download -r requirements.txt -d wheels/ && pip install --no-index --find-links wheels/ -r requirements.txt", what: { en: "Pre-download Python deps, then install with no internet.", he: "הורדה מראש של תלויות Python והתקנה בלי אינטרנט." } },
    { cmd: "terraform providers mirror ./tf-mirror", what: { en: "Mirror the Terraform providers your config needs.", he: "Mirror של ה-providers ש-Terraform צריך." } },
    { cmd: "helm pull oci://registry/charts/app --version 1.4.2 && helm push app-1.4.2.tgz oci://harbor.internal/charts", what: { en: "Move a Helm chart into the internal OCI registry.", he: "העברת Helm chart ל-registry OCI פנימי." } }
  ],
  mnemonic: { en: "Pin, scan, sign, carry, verify, mirror.", he: "לנעול, לסרוק, לחתום, להעביר, לאמת, לעשות mirror." },
  pitfalls: [
    { en: "Pulling by tag. Versions drift and you can't reproduce what's running.", he: "משיכה לפי tag. הגרסאות זזות ואי אפשר לשחזר מה רץ." },
    { en: "Forgetting transitive dependencies such as base images, Helm sub-charts and plugins. The install fails on day one.", he: "שכחת תלויות טרנזיטיביות כמו base images, sub-charts ו-plugins. ההתקנה נופלת ביום הראשון." },
    { en: "No tested restore for self-hosted Git, CI or registry. Inside the gap, they ARE production.", he: "אין שחזור שנבדק ל-Git, ל-CI או ל-registry ה-self-hosted. בתוך הפער, הם-הם הפרודקשן." }
  ],
  interview: [
    { q: { en: "How do you deliver updates (images, packages) into an air-gapped network?", he: "איך מעבירים עדכונים (images, packages) לרשת air-gapped?" },
      a: { en: "On the connected side, resolve exact versions by digest and lockfile, scan for CVEs, sign, and bundle with checksums. Transfer through an approved one-way channel. Inside, verify the signatures, import to Harbor/Nexus mirrors, and point containerd, pip, npm and helm at those mirrors. Run it on a regular cadence with a fast lane for urgent CVEs.", he: "בצד המחובר נועלים גרסאות לפי digest ו-lockfile, סורקים CVEs, חותמים ואורזים עם checksums. מעבירים בערוץ חד-כיווני מאושר. בפנים מאמתים חתימות, מכניסים ל-mirrors ב-Harbor/Nexus, ומפנים את containerd, pip, npm ו-helm ל-mirrors. עובדים בקצב קבוע עם מסלול מהיר ל-CVEs דחופים." } },
    { q: { en: "What usually breaks when you move a cloud-native app into a disconnected network?", he: "מה בדרך כלל נשבר כשמעבירים אפליקציה cloud-native לרשת מנותקת?" },
      a: { en: "Hard-coded public registries, things that call home (license checks, telemetry, OCSP), public certificates and DNS, time sync, transitive dependencies, and SaaS-only features. Find them by installing in a sealed lab first.", he: "Registries ציבוריים בקוד, דברים שמתקשרים הביתה (בדיקות רישוי, טלמטריה, OCSP), תעודות ו-DNS ציבוריים, סנכרון שעון, תלויות טרנזיטיביות ופיצ'רים שקיימים רק ב-SaaS. מוצאים אותם בהתקנה ראשונה במעבדה אטומה." } }
  ],
  quiz: [
    { q: { en: "Why pin images by digest in air-gapped environments?", he: "למה לנעול images לפי digest בסביבות air-gapped?" },
      options: [ { en: "Digests are shorter", he: "Digests קצרים יותר" }, { en: "Reproducibility: tags can move, digests can't", he: "שחזוריות: tags זזים, digests לא" }, { en: "Registries require it", he: "Registries דורשים זאת" }, { en: "Faster pulls", he: "משיכה מהירה יותר" } ],
      answer: 1, explain: { en: "A digest identifies exact bytes; tags are mutable pointers.", he: "Digest מזהה בתים מדויקים, ו-tags הם מצביעים שאפשר לשנות." } },
    { q: { en: "Which tool copies container images between registries or to archives?", he: "איזה כלי מעתיק images בין registries או לארכיונים?" },
      options: [ { en: "skopeo", he: "skopeo" }, { en: "kubectl", he: "kubectl" }, { en: "terraform", he: "terraform" }, { en: "journalctl", he: "journalctl" } ],
      answer: 0, explain: { en: "skopeo (and oras/crane) copy images without a Docker daemon.", he: "skopeo (וגם oras/crane) מעתיקים images בלי Docker daemon." } },
    { q: { en: "Inside the gap, your self-hosted Git/CI/registry are…", he: "בתוך הפער, ה-Git, ה-CI וה-registry ה-self-hosted הם…" },
      options: [ { en: "Nice-to-have tools", he: "כלים נחמדים" }, { en: "Production systems needing backups and tested restores", he: "מערכות פרודקשן שצריכות גיבויים ושחזורים שנבדקו" }, { en: "Temporary", he: "זמניים" }, { en: "Managed by the cloud provider", he: "מנוהלים על ידי ספק הענן" } ],
      answer: 1, explain: { en: "If they die, nothing can be built or deployed.", he: "אם הם נופלים, אי אפשר לבנות או לפרוס כלום." } }
  ],
  related: ["staff-supply-chain", "container-security", "cloud-cicd", "k8s-day2-upgrades"]
});

INFRA.glossary.push(
  { term: "Durable execution", track: "architecture", def: { en: "Running workflows whose state is persisted so they survive crashes and resume exactly where they stopped (Temporal).", he: "הרצת workflows שה-state שלהם נשמר, כך שהם שורדים קריסות וממשיכים בדיוק מאיפה שעצרו (Temporal)." }, lesson: "arch-durable-execution" },
  { term: "Temporal", track: "architecture", def: { en: "Durable-execution platform: workflows (deterministic) + activities (side effects) + event history.", he: "פלטפורמת durable execution: workflows (דטרמיניסטיים) + activities (side effects) + event history." }, lesson: "arch-durable-execution" },
  { term: "vLLM", track: "kubernetes", def: { en: "High-throughput LLM inference server (continuous batching, PagedAttention, OpenAI-compatible API).", he: "שרת LLM inference עם throughput גבוה (continuous batching, PagedAttention, API תואם OpenAI)." }, lesson: "k8s-gpu-inference" },
  { term: "MIG", track: "kubernetes", def: { en: "Multi-Instance GPU: hardware partitioning of A100/H100 into isolated GPU slices.", he: "Multi-Instance GPU: חלוקה בחומרה של A100/H100 לפרוסות GPU מבודדות." }, lesson: "k8s-gpu-inference" },
  { term: "KV cache", track: "kubernetes", def: { en: "Per-request attention keys/values kept in GPU memory; grows with context length × concurrency.", he: "Keys/values של attention לכל בקשה שנשמרים בזיכרון ה-GPU, וגדלים לפי אורך context × concurrency." }, lesson: "k8s-gpu-inference" },
  { term: "MCP", track: "staff", def: { en: "Model Context Protocol: open protocol for AI clients to call tools/resources exposed by MCP servers.", he: "Model Context Protocol: פרוטוקול פתוח שבו לקוחות AI קוראים ל-tools ו-resources ששרתי MCP חושפים." }, lesson: "ai-agent-infra-mcp" },
  { term: "Evals", track: "staff", def: { en: "Automated test suites measuring an AI agent's task success, run on every prompt/tool change.", he: "סטים אוטומטיים שמודדים הצלחה של AI agent במשימות, ורצים על כל שינוי prompt או tool." }, lesson: "ai-agent-infra-mcp" },
  { term: "Air gap", track: "cloud", def: { en: "A network physically/logically disconnected from the internet; all artifacts are imported deliberately.", he: "רשת מנותקת פיזית או לוגית מהאינטרנט. כל artifact מוכנס באופן מכוון." }, lesson: "cloud-airgapped" },
  { term: "skopeo", track: "cloud", def: { en: "CLI to inspect and copy container images between registries and archives without a daemon.", he: "CLI לבדיקה והעתקה של container images בין registries וארכיונים בלי daemon." }, lesson: "cloud-airgapped" }
);

// ---------------------------------------------------------------------------
// Measuring real CPU / RAM / disk needs + interview logic questions
// ---------------------------------------------------------------------------

INFRA.lessons.push({
  id: "rel-measure-resource-needs",
  track: "reliability",
  order: 186,
  icon: "📏",
  level: 2,
  minutes: 12,
  title: { en: "Measuring What a Service Really Needs: CPU, RAM, Disk", he: "כמה CPU, RAM ודיסק שירות באמת צריך, ואיך מודדים" },
  tldr: {
    en: "Measure the cost of one request under load, multiply by peak, divide by a target utilization, then add a spare AZ. Use the right metric for each resource: CPU-seconds, working set, IOPS, time-to-full.",
    he: "מודדים כמה עולה בקשה אחת תחת עומס, מכפילים ב-peak, מחלקים ב-utilization יעד ומוסיפים AZ רזרבי. המטריקות הנכונות הן CPU-seconds, working set, IOPS ו-time-to-full, כל אחת למשאב שלה."
  },
  analogy: {
    en: "Staffing a restaurant kitchen. You don't guess how many cooks feel right: you time one dish, multiply by dishes per hour at the dinner rush, make sure nobody works at 100%, and add one more cook in case someone calls in sick.",
    he: "כמו לתכנן כמה טבחים צריך במטבח של מסעדה. לא מנחשים לפי תחושה: מודדים כמה זמן לוקחת מנה אחת, מכפילים במספר המנות בשעת העומס של הערב, דואגים שאף טבח לא יעבוד על 100%, ומוסיפים עוד אחד למקרה שמישהו לא מגיע."
  },
  sections: [
    { h: { en: "The method: measure one unit, then multiply", he: "השיטה: מודדים יחידה אחת ומכפילים" },
      body: {
        en: `<p>Napkin math (see the sizing lesson) gives you the <em>expected</em> load. Measurement gives you the <em>cost per unit</em>. Load-test one instance, record what it uses, and scale from there:</p>
<table>
<tr><th>Resource</th><th>Measure</th><th>Formula</th></tr>
<tr><td>CPU</td><td>CPU-seconds per request = cores used ÷ RPS</td><td><code>cores = peak_RPS × cpu_sec_per_req ÷ 0.6</code></td></tr>
<tr><td>RAM</td><td>Idle baseline + memory per in-flight request + cache</td><td><code>RAM = base + concurrency × per_req + cache</code>, concurrency = RPS × latency</td></tr>
<tr><td>Disk size</td><td>Bytes written per day</td><td><code>daily × retention × replicas ÷ 0.75</code></td></tr>
<tr><td>Disk IO</td><td>r/s, w/s, MB/s, await at p99</td><td>Size to the peak, not the average</td></tr>
<tr><td>Network</td><td>Request + response bytes</td><td><code>RPS × bytes × 8</code> = bits/s</td></tr>
</table>
<p>Always start from <strong>peak</strong>: <code>avg_RPS = daily_requests ÷ 86,400</code>, then multiply by a peak factor (usually 2–5×).</p>`,
        he: `<p>חישוב על מפית (ראה את שיעור ה-sizing) נותן לך את העומס <em>הצפוי</em>. מדידה נותנת לך את <em>העלות ליחידה</em>. מריצים load test על instance אחד, רושמים כמה הוא צורך, ומשם מגדילים:</p>
<table>
<tr><th>משאב</th><th>מה מודדים</th><th>נוסחה</th></tr>
<tr><td>CPU</td><td>CPU-seconds לבקשה: cores בשימוש חלקי RPS</td><td><code>cores = peak_RPS × cpu_sec_per_req ÷ 0.6</code></td></tr>
<tr><td>RAM</td><td>בסיס במנוחה, ועוד זיכרון לכל בקשה פתוחה, ועוד cache</td><td><code>RAM = base + concurrency × per_req + cache</code></td></tr>
<tr><td>גודל דיסק</td><td>כמה bytes נכתבים ביום</td><td><code>daily × retention × replicas ÷ 0.75</code></td></tr>
<tr><td>Disk IO</td><td>r/s, w/s, MB/s ו-await ב-p99</td><td>מתכננים לפי ה-peak, לא לפי הממוצע</td></tr>
<tr><td>רשת</td><td>גודל הבקשה והתשובה</td><td><code>RPS × bytes × 8</code></td></tr>
</table>
<p>ה-concurrency הוא RPS כפול latency, לפי Little's Law. תמיד מתחילים מה-<strong>peak</strong>: מחלקים את מספר הבקשות היומי ב-86,400 כדי לקבל ממוצע לשנייה, ואז מכפילים ב-peak factor (בדרך כלל פי 2 עד 5).</p>`
      } },
    { h: { en: "Worked example: 50M requests/day, 3 AZs", he: "דוגמה מלאה: 50M בקשות ביום ב-3 AZ-ים" },
      body: {
        en: `<p>Load test result: one pod uses 0.5 core at 125 RPS, so <strong>4 ms CPU per request</strong>; p50 latency is 120 ms; each in-flight request holds ~2 MB.</p>
<ul>
<li><strong>Traffic</strong>: 50M ÷ 86,400 ≈ 580 RPS average; × 3 peak factor ≈ <strong>1,750 RPS</strong>.</li>
<li><strong>CPU</strong>: 1,750 × 0.004 = 7 busy cores; ÷ 0.6 ≈ <strong>12 cores</strong>. To survive losing one AZ, the remaining two must carry 12, so 6 per AZ = <strong>18 cores total</strong>.</li>
<li><strong>RAM</strong>: 1,750 × 0.12 s = 210 in-flight × 2 MB = 420 MB, plus ~300 MB base per pod × 6 pods.</li>
<li><strong>Logs</strong>: 50M × 1 KB = 50 GB/day × 30 days × 2 replicas = 3 TB ÷ 0.75 ≈ <strong>4 TB</strong>.</li>
</ul>
<blockquote>💡 Real world: the AZ-loss step is the one most people forget, and it is often the biggest number in the plan (+50% with 3 AZs).</blockquote>`,
        he: `<p>ב-load test יצא ש-pod אחד צורך 0.5 core ב-125 RPS, כלומר <strong>4 ms של CPU לבקשה</strong>. ה-latency ב-p50 הוא 120 ms, וכל בקשה פתוחה מחזיקה בערך 2 MB.</p>
<ul>
<li><strong>תעבורה</strong>: 50M חלקי 86,400 זה בערך 580 RPS בממוצע. עם peak factor של 3 מקבלים בערך <strong>1,750 RPS</strong>.</li>
<li><strong>CPU</strong>: 1,750 כפול 0.004 נותן 7 cores עסוקים. חלקי 0.6 זה בערך <strong>12 cores</strong>. כדי לשרוד נפילה של AZ, שני ה-AZ-ים שנשארים צריכים לשאת 12, כלומר 6 בכל AZ ו-<strong>18 cores בסך הכול</strong>.</li>
<li><strong>RAM</strong>: 1,750 כפול 0.12 s נותן 210 בקשות פתוחות, וכפול 2 MB זה 420 MB. מוסיפים בערך 300 MB בסיס לכל אחד מ-6 ה-pods.</li>
<li><strong>לוגים</strong>: 50M כפול 1 KB זה 50 GB ביום. כפול 30 יום וכפול 2 replicas זה 3 TB, וחלקי 0.75 יוצא בערך <strong>4 TB</strong>.</li>
</ul>
<blockquote>💡 מהשטח: את שלב נפילת ה-AZ רוב האנשים שוכחים, ולרוב הוא המספר הכי גדול בתוכנית (תוספת של 50% עם 3 AZ-ים).</blockquote>`
      } },
    { h: { en: "Read the right metric (most mistakes are here)", he: "לקרוא את המטריקה הנכונה (כאן רוב הטעויות)" },
      body: {
        en: `<ul>
<li><strong>Memory: working set, not usage.</strong> <code>container_memory_usage_bytes</code> includes reclaimable page cache. The OOM-killer acts on <code>container_memory_working_set_bytes</code>. Size the limit to the max working set + 20–30%.</li>
<li><strong>CPU: watch throttling, not just usage.</strong> A CPU <em>limit</em> is enforced per 100 ms CFS period. A pod averaging 30% can still be throttled during bursts, which shows up as latency. Check <code>container_cpu_cfs_throttled_periods_total</code>.</li>
<li><strong>CPU: per core, not total.</strong> One hot single-threaded process is 100% of one core but only 12% of an 8-core box (<code>top -H</code>, <code>mpstat -P ALL</code>).</li>
<li><strong>Disk: size, IOPS and inodes are three separate limits.</strong> AWS gp3 gives 3,000 IOPS / 125 MB/s baseline regardless of size. <code>df -i</code> can be at 100% with free GB left.</li>
<li><strong>Disk: alert on time-to-full</strong> with <code>predict_linear()</code>, not a static 90%.</li>
</ul>`,
        he: `<ul>
<li><strong>זיכרון: working set, לא usage.</strong> המטריקה <code>container_memory_usage_bytes</code> כוללת page cache שאפשר לפנות. ה-OOM-killer מסתכל על <code>container_memory_working_set_bytes</code>. קובעים limit לפי ה-working set המקסימלי ועוד 20–30%.</li>
<li><strong>CPU: מסתכלים על throttling, לא רק על usage.</strong> CPU <em>limit</em> נאכף בכל CFS period של 100 ms. גם Pod שממוצע ה-CPU שלו 30% עדיין יכול לחטוף throttling ב-bursts, וזה מתבטא ב-latency. בודקים את <code>container_cpu_cfs_throttled_periods_total</code>.</li>
<li><strong>CPU: לכל core, לא סך הכול.</strong> תהליך single-threaded חם תופס 100% של core אחד, אבל רק 12% ממכונה עם 8 cores. הפקודה <code>mpstat -P ALL</code> מראה את זה לכל core בנפרד.</li>
<li><strong>דיסק: גודל, IOPS ו-inodes הם שלוש מגבלות נפרדות.</strong> ב-AWS, נפח gp3 נותן בסיס של 3,000 IOPS ו-125 MB/s בלי קשר לגודל. הפקודה <code>df -i</code> יכולה להראות 100% כשעוד יש GB פנויים.</li>
<li><strong>דיסק: מתריעים על הזמן עד שהוא מתמלא</strong> עם <code>predict_linear()</code>, לא על סף קבוע של 90%.</li>
</ul>`
      } },
    { h: { en: "Interview logic questions", he: "שאלות היגיון מראיונות" },
      body: {
        en: `<ol>
<li><strong>"70% CPU at 1,000 RPS. Can it take 1,400?"</strong> Linear math says 98%, so no. Past ~80%, queueing makes latency explode, and GC and locks make it worse than linear. Load test to find the knee.</li>
<li><strong>"Disk is 400/500 GB and grows 20 GB/day. When do you page?"</strong> It's full in 5 days, but page on time-to-full (for example, under 3 days), not on a fixed %. Also check inodes.</li>
<li><strong>"OOMKilled, but <code>kubectl top</code> showed 60%."</strong> It samples every ~15 s and misses spikes. Off-heap memory counts too (JVM metaspace, direct buffers, native libs). The limit is enforced the instant working set crosses it.</li>
<li><strong>"CPU is 30% but latency is bad."</strong> CFS throttling, IO wait (<code>wa</code> in <code>vmstat</code>), one hot core, or a lock / connection-pool bottleneck.</li>
<li><strong>"Double the servers. Does latency halve?"</strong> No. Capacity doubles. Latency only drops if requests were queueing; the floor is service time plus downstream calls.</li>
<li><strong>"10M users × 2 photos/day × 500 KB, kept 5 years?"</strong> 10 TB/day × 1,825 ≈ 18 PB before redundancy. Say your assumptions out loud, round hard, and conclude: object storage with lifecycle tiers, not disks.</li>
</ol>`,
        he: `<ol>
<li><strong>"שירות על 70% CPU ב-1,000 RPS. הוא יחזיק 1,400?"</strong> חישוב לינארי נותן 98%, אז לא. מעל 80% בערך ה-queueing מפוצץ את ה-latency, ו-GC ונעילות הופכים את זה לגרוע יותר מלינארי. מריצים load test כדי למצוא את נקודת השבירה.</li>
<li><strong>"הדיסק על 400 מתוך 500 GB וגדל ב-20 GB ביום. מתי מעירים מישהו?"</strong> הוא יתמלא בעוד 5 ימים, אבל מתריעים על הזמן עד שהוא מתמלא (למשל פחות מ-3 ימים), לא על אחוז קבוע. בודקים גם inodes.</li>
<li><strong>"קיבלנו OOMKilled, אבל <code>kubectl top</code> הראה 60%."</strong> הפקודה דוגמת בערך כל 15 שניות ומפספסת קפיצות. גם זיכרון מחוץ ל-heap נספר, למשל ה-metaspace של ה-JVM או direct buffers. ה-limit נאכף ברגע שה-working set עובר אותו.</li>
<li><strong>"ה-CPU על 30% אבל ה-latency גרוע."</strong> יש ארבעה חשודים: CFS throttling, IO wait (עמודת <code>wa</code> ב-<code>vmstat</code>), core אחד חם, או צוואר בקבוק של lock או connection pool.</li>
<li><strong>"מכפילים את מספר השרתים. ה-latency יורד בחצי?"</strong> לא. ה-capacity מוכפל. ה-latency יורד רק אם בקשות חיכו בתור, והרצפה היא זמן השירות ועוד הקריאות ל-downstream.</li>
<li><strong>"10M משתמשים, 2 תמונות ביום, 500 KB לתמונה, שמירה ל-5 שנים?"</strong> מקבלים 10 TB ביום, וכפול 1,825 יוצא בערך 18 PB לפני redundancy. אומרים את ההנחות בקול, מעגלים בנדיבות ומסיקים: object storage עם lifecycle tiers, לא דיסקים.</li>
</ol>`
      } }
  ],
  diagram: "load test 1 pod -> cost per request (CPU ms, MB, IO)\n      x peak RPS\n      / target utilization (0.6)\n      + survive 1 AZ loss (N+1)\n      = cores, RAM, disk, IOPS",
  handsOn: [
    { cmd: "k6 run --vus 200 --duration 10m load.js", what: { en: "Drive steady load at one pod and note its RPS while you watch the metrics below.", he: "מייצר עומס קבוע על pod אחד. רשום את ה-RPS בזמן שאתה עוקב אחרי המטריקות למטה." } },
    { cmd: "sum(rate(container_cpu_usage_seconds_total{container=\"api\"}[5m])) / sum(rate(http_requests_total{app=\"api\"}[5m]))", what: { en: "PromQL: CPU-seconds per request. Multiply by 1000 for CPU ms per request.", he: "שאילתת PromQL שנותנת CPU-seconds לבקשה. כפול 1000 מקבלים CPU ms לבקשה." } },
    { cmd: "max_over_time(container_memory_working_set_bytes{container=\"api\"}[1d])", what: { en: "Peak working set over a day: the number the memory limit must beat.", he: "ה-working set המקסימלי ביום: המספר שה-memory limit צריך להיות מעליו." } },
    { cmd: "vmstat 1; iostat -x 1; df -i", what: { en: "r > cores means CPU saturation; wa means IO wait; %util and await show disk saturation; df -i shows inodes.", he: "עמודת r גדולה ממספר ה-cores אומרת שה-CPU רווי, ו-wa הוא IO wait. העמודות %util ו-await מראות רוויה של הדיסק. הפקודה df -i מראה כמה inodes תפוסים." } },
    { cmd: "fio --name=t --rw=randwrite --bs=4k --iodepth=32 --size=2G --runtime=60 --time_based", what: { en: "Measure what the disk can actually do (IOPS and latency) before trusting the datasheet.", he: "מודד מה הדיסק באמת מסוגל (IOPS ו-latency) לפני שסומכים על הדף של היצרן." } }
  ],
  mnemonic: {
    en: "Measure one, multiply by peak, divide by 0.6, add an AZ.",
    he: "מודדים אחד, מכפילים ב-peak, מחלקים ב-0.6 ומוסיפים AZ."
  },
  pitfalls: [
    { en: "Sizing from the average or from configured requests instead of measured peak usage.", he: "לתכנן לפי הממוצע או לפי ה-requests שהוגדרו, במקום לפי שימוש אמיתי ב-peak." },
    { en: "Load testing with a warm cache and a tiny dataset; production has a cold cache and a 2 TB table.", he: "להריץ load test עם cache חם ו-dataset קטנטן, כשב-production יש cache קר וטבלה של 2 TB." },
    { en: "Reading memory usage (with page cache) instead of working set, then setting limits that OOMKill.", he: "לקרוא memory usage (כולל page cache) במקום working set, ואז לקבוע limits שגורמים ל-OOMKill." },
    { en: "Sizing disk by GB only: a small gp2 volume burns its burst credits and IO falls off a cliff.", he: "לתכנן דיסק רק לפי GB: נפח gp2 קטן שורף את ה-burst credits וה-IO צונח." }
  ],
  interview: [
    { q: { en: "How would you decide the CPU and memory requests for a new service?", he: "איך תקבע CPU ו-memory requests לשירות חדש?" },
      a: { en: "Load test one pod to get CPU-seconds and memory per request, then size requests from p95 usage at expected peak and memory limits from max working set + 20–30%. Run it for a week in prod with VPA in recommendation mode and adjust. Avoid tight CPU limits on latency-sensitive services because of throttling.", he: "מריצים load test על pod אחד כדי לקבל CPU-seconds וזיכרון לבקשה. את ה-requests קובעים לפי p95 של השימוש ב-peak הצפוי, ואת ה-memory limit לפי ה-working set המקסימלי ועוד 20–30%. מריצים שבוע ב-prod עם VPA במצב recommendation ומתקנים. בשירותים רגישים ל-latency נמנעים מ-CPU limit צפוף בגלל throttling." } },
    { q: { en: "Your average CPU is 25% but p99 latency is high. What do you check?", he: "ה-CPU הממוצע על 25% אבל ה-latency ב-p99 גבוה. מה תבדוק?" },
      a: { en: "CFS throttled periods (limit too low for bursts), per-core usage for a single hot thread, IO wait and disk await, GC pauses, and saturation of pools (DB connections, thread pool) via Little's Law: in-flight = RPS × latency versus pool size.", he: "בודקים CFS throttled periods (limit נמוך מדי ל-bursts), שימוש לכל core כדי למצוא thread חם אחד, IO wait ו-await של הדיסק, GC pauses, ורוויה של pools (חיבורי DB, thread pool). לפי Little's Law, מספר הבקשות הפתוחות הוא RPS כפול latency, ומשווים אותו לגודל ה-pool." } }
  ],
  quiz: [
    { q: { en: "A pod uses 1.2 cores at 300 RPS. How many cores for 2,000 RPS at a 65% utilization target?", he: "Pod צורך 1.2 cores ב-300 RPS. כמה cores צריך ל-2,000 RPS עם יעד utilization של 65%?" },
      options: [ { en: "8", he: "8" }, { en: "~13", he: "בערך 13" }, { en: "~20", he: "בערך 20" }, { en: "6.7", he: "6.7" } ],
      answer: 1,
      explain: { en: "1.2 ÷ 300 = 4 ms/req. 2,000 × 0.004 = 8 busy cores; 8 ÷ 0.65 ≈ 12.3, so ~13.", he: "1.2 חלקי 300 זה 4 ms לבקשה. 2,000 כפול 0.004 נותן 8 cores עסוקים, וחלקי 0.65 יוצא בערך 12.3, כלומר 13." } },
    { q: { en: "Which metric does the OOM-killer effectively act on in a container?", he: "על איזו מטריקה ה-OOM-killer מגיב בפועל בקונטיינר?" },
      options: [ { en: "container_memory_usage_bytes", he: "container_memory_usage_bytes" }, { en: "container_memory_working_set_bytes", he: "container_memory_working_set_bytes" }, { en: "Node free memory", he: "הזיכרון הפנוי ב-node" }, { en: "JVM heap used", he: "ה-heap בשימוש ב-JVM" } ],
      answer: 1,
      explain: { en: "Usage includes reclaimable page cache; working set is what can't be reclaimed, and it is what kubelet and the OOM-killer compare to the limit.", he: "ה-usage כולל page cache שאפשר לפנות. ה-working set הוא מה שאי אפשר לפנות, ואותו ה-kubelet וה-OOM-killer משווים ל-limit." } },
    { q: { en: "Latency is 200 ms at a peak of 500 RPS across 3 pods with a DB pool of 20 each. What happens?", he: "יש 3 pods, ולכל אחד DB pool של 20 חיבורים. ב-peak מגיעים 500 RPS וה-latency הוא 200 ms. מה קורה?" },
      options: [ { en: "Fine: 60 connections is plenty", he: "בסדר: 60 חיבורים זה מספיק" }, { en: "Requests queue for connections: ~100 are in flight but only 60 connections exist", he: "בקשות מחכות לחיבור: בערך 100 בקשות פתוחות אבל יש רק 60 חיבורים" }, { en: "The DB runs out of disk", he: "ל-DB נגמר הדיסק" }, { en: "CPU throttling", he: "יש CPU throttling" } ],
      answer: 1,
      explain: { en: "Little's Law: 500 × 0.2 = 100 concurrent. If each holds a connection, 60 isn't enough and latency climbs further.", he: "לפי Little's Law, 500 כפול 0.2 נותן 100 בקשות בו-זמנית. אם כל אחת מחזיקה חיבור, 60 לא מספיק וה-latency ממשיך לטפס." } },
    { q: { en: "Disk has 100 GB free and grows 20 GB/day. Best alert?", he: "לדיסק נשארו 100 GB פנויים והוא גדל ב-20 GB ביום. מה ההתראה הכי טובה?" },
      options: [ { en: "Alert at 95% used", he: "התראה ב-95% שימוש" }, { en: "Alert when predicted full within ~3 days (predict_linear)", he: "התראה כשהחיזוי אומר שהוא יתמלא תוך בערך 3 ימים (predict_linear)" }, { en: "Alert at 50% used", he: "התראה ב-50% שימוש" }, { en: "No alert; autoscaling handles it", he: "בלי התראה, autoscaling יטפל בזה" } ],
      answer: 1,
      explain: { en: "A static threshold fires too late on fast growth and too early on slow growth. Time-to-full gives a human enough time to act.", he: "סף קבוע קופץ מאוחר מדי כשהגדילה מהירה ומוקדם מדי כשהיא איטית. זמן עד מילוי נותן לבן אדם מספיק זמן לפעול." } }
  ],
  playground: "resources",
  related: ["pr-sizing", "rel-capacity-planning", "k8s-resources", "linux-disks-storage", "linux-perf-tracing"]
});
