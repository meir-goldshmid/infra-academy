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

// ---------------------------------------------------------------------------
// SBOM 101: the hands-on entry point to supply-chain security
// ---------------------------------------------------------------------------

INFRA.lessons.push({
  id: "container-sbom-101",
  track: "containers",
  order: 24,
  icon: "🧾",
  level: 2,
  minutes: 12,
  title: { en: "SBOM 101: Generate, Scan and Sign an Image in 10 Minutes", he: "SBOM למתחילים: לייצר, לסרוק ולחתום על image בעשר דקות" },
  tldr: {
    en: "An SBOM is the ingredients list of your image. Generate it with Syft, scan it with Grype, sign the image and attach the SBOM with cosign, all by digest. Then the next Log4Shell takes minutes to answer, not weeks.",
    he: "SBOM היא רשימת הרכיבים של ה-image שלך. מייצרים אותה עם Syft, סורקים עם Grype, חותמים על ה-image ומצמידים את ה-SBOM עם cosign, הכול לפי digest. ככה ה-Log4Shell הבא נענה בדקות ולא בשבועות."
  },
  analogy: {
    en: "The ingredients label on a food package. It doesn't make the food safe by itself, but when there's a recall (\"peanuts from supplier X are contaminated\") the store finds every affected product in minutes. Without labels, someone opens every package by hand.",
    he: "כמו רשימת הרכיבים על אריזת מזון. היא לא הופכת את האוכל לבטוח בעצמה, אבל כשיש ריקול (\"בוטנים מספק מסוים מזוהמים\") החנות מוצאת כל מוצר שנפגע בתוך דקות. בלי תוויות, מישהו פותח כל אריזה ביד."
  },
  sections: [
    { h: { en: "What an SBOM is (and why Log4Shell made it mandatory)", he: "מה זה SBOM (ולמה Log4Shell הפך אותו לחובה)" },
      body: {
        en: `<p>An <strong>SBOM</strong> (Software Bill of Materials) lists every component inside a piece of software: OS packages, language libraries, their versions, licenses, and a unique ID for each component called a <em>purl</em>. This is the purl of log4j:</p>
<pre>pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1</pre>
<p>In December 2021, Log4Shell (CVE-2021-44228) hit a Java logging library hidden inside thousands of products, often several layers deep. Teams with SBOMs answered "are we affected?" with one query. The rest spent weeks grepping servers and unpacking JARs. Since then, US federal suppliers must provide SBOMs, the EU Cyber Resilience Act requires them, and many customers ask for them in security reviews.</p>
<table>
<tr><th>Format</th><th>From</th><th>Typical use</th></tr>
<tr><td>CycloneDX</td><td>OWASP</td><td>Security: vulnerabilities, VEX, services</td></tr>
<tr><td>SPDX</td><td>Linux Foundation (ISO/IEC 5962)</td><td>License compliance, legal</td></tr>
</table>
<p>Both work; most tools output either. Pick one per company and stick with it.</p>`,
        he: `<p><strong>SBOM</strong> (Software Bill of Materials) היא רשימה של כל רכיב בתוך תוכנה: חבילות מערכת הפעלה, ספריות שפה, הגרסאות שלהן, הרישיונות ומזהה ייחודי לכל רכיב שנקרא <em>purl</em>. כך למשל נראה ה-purl של log4j:</p>
<pre>pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1</pre>
<p>בדצמבר 2021 התגלתה Log4Shell (CVE-2021-44228) בספריית לוגים של Java שהסתתרה בתוך אלפי מוצרים, הרבה פעמים כמה שכבות עמוק. צוותים שהיו להם SBOMs ענו על השאלה "אנחנו פגיעים?" בשאילתה אחת. השאר בילו שבועות ב-grep על שרתים ובפתיחת קובצי JAR. מאז ספקים של ממשל ארה"ב חייבים לספק SBOM, ה-Cyber Resilience Act של האיחוד האירופי דורש אותו, והרבה לקוחות מבקשים אותו בסקירות אבטחה.</p>
<table>
<tr><th>פורמט</th><th>מי מגדיר</th><th>שימוש נפוץ</th></tr>
<tr><td>CycloneDX</td><td>OWASP</td><td>אבטחה: פגיעויות, VEX ו-services</td></tr>
<tr><td>SPDX</td><td>Linux Foundation (תקן ISO/IEC 5962)</td><td>תאימות רישיונות והיבטים משפטיים</td></tr>
</table>
<p>שניהם עובדים, ורוב הכלים מוציאים את שניהם. בוחרים אחד לכל החברה ונשארים איתו.</p>`
      } },
    { h: { en: "Hands-on: generate and scan", he: "Hands-on: לייצר ולסרוק" },
      body: {
        en: `<p>Install <a href="https://github.com/anchore/syft" target="_blank" rel="noopener">Syft</a> and <a href="https://github.com/anchore/grype" target="_blank" rel="noopener">Grype</a> (one binary each), then:</p>
<pre>syft python:3.12-slim -o cyclonedx-json &gt; sbom.json     # ~100 components in seconds
jq '.components | length' sbom.json
jq -r '.components[] | "\\(.name) \\(.version)"' sbom.json | grep -i openssl

grype sbom:sbom.json                                   # scan the SBOM, not the image
grype sbom:sbom.json --only-fixed --fail-on high       # CI gate: fail only on fixable HIGH+</pre>
<p>Scanning the <em>SBOM</em> instead of the image is the point: you generate it once at build time and re-scan it every day against new CVEs, without pulling the image again. When the next big CVE drops, you search your stored SBOMs, not your servers.</p>
<blockquote>💡 Real world: the first scan of an ordinary image shows dozens of CVEs, most in OS packages with no fix or in code you never call. That's why <code>--only-fixed</code> and a severity threshold matter: a gate that always fails gets disabled within a week.</blockquote>`,
        he: `<p>מתקינים את Syft ואת Grype (בינארי אחד לכל אחד), ואז:</p>
<pre>syft python:3.12-slim -o cyclonedx-json &gt; sbom.json     # ~100 components in seconds
jq '.components | length' sbom.json
jq -r '.components[] | "\\(.name) \\(.version)"' sbom.json | grep -i openssl

grype sbom:sbom.json                                   # scan the SBOM, not the image
grype sbom:sbom.json --only-fixed --fail-on high       # CI gate: fail only on fixable HIGH+</pre>
<p>כל הרעיון הוא לסרוק את ה-<em>SBOM</em> ולא את ה-image: מייצרים אותה פעם אחת בזמן ה-build, וסורקים אותה מחדש כל יום מול CVEs חדשים בלי למשוך את ה-image שוב. כשה-CVE הגדול הבא מתפרסם, מחפשים ב-SBOMs השמורים, לא בשרתים.</p>
<blockquote>💡 מהשטח: סריקה ראשונה של image רגיל מראה עשרות CVEs, רובם בחבילות מערכת בלי תיקון או בקוד שאף פעם לא נקרא. בגלל זה חשובים <code>--only-fixed</code> וסף חומרה: gate שתמיד נכשל מכבים תוך שבוע.</blockquote>`
      } },
    { h: { en: "Hands-on: sign the image and attach the SBOM", he: "Hands-on: לחתום על ה-image ולהצמיד את ה-SBOM" },
      body: {
        en: `<p>Signing proves <em>who</em> built the image and that nobody changed it since. Try it locally with a key pair and a local registry (in CI you'd use keyless signing with the pipeline's OIDC identity instead):</p>
<pre>docker run -d -p 5000:5000 --name reg registry:2
docker pull python:3.12-slim &amp;&amp; docker tag python:3.12-slim localhost:5000/demo:1
docker push localhost:5000/demo:1
DIGEST=$(docker inspect --format '{{index .RepoDigests 0}}' localhost:5000/demo:1)   # localhost:5000/demo@sha256:...

cosign generate-key-pair                                    # cosign.key + cosign.pub
cosign sign --key cosign.key --tlog-upload=false "$DIGEST"
cosign attest --key cosign.key --tlog-upload=false --type cyclonedx --predicate sbom.json "$DIGEST"

cosign verify --key cosign.pub --insecure-ignore-tlog "$DIGEST"
cosign verify-attestation --key cosign.pub --insecure-ignore-tlog --type cyclonedx "$DIGEST" | jq -r .payload | base64 -d | jq '.predicate.components | length'</pre>
<p>Three rules that matter more than the tool:</p>
<ul>
<li><strong>Sign the digest, never a tag.</strong> A tag like <code>:1</code> can be moved to another image tomorrow; <code>@sha256:…</code> can't.</li>
<li><strong>Attach the SBOM to the image</strong> (as an attestation) instead of keeping it in a random bucket, so whoever has the image can find its SBOM.</li>
<li><strong>Verify where it runs.</strong> A signature nobody checks is decoration. In Kubernetes that's an admission policy (Kyverno <code>verifyImages</code>); see the Staff lesson on supply chain.</li>
</ul>`,
        he: `<p>חתימה מוכיחה <em>מי</em> בנה את ה-image ושאף אחד לא שינה אותו מאז. אפשר לנסות מקומית עם זוג מפתחות ו-registry מקומי (ב-CI משתמשים במקום זה בחתימה keyless עם ה-OIDC identity של ה-pipeline):</p>
<pre>docker run -d -p 5000:5000 --name reg registry:2
docker pull python:3.12-slim &amp;&amp; docker tag python:3.12-slim localhost:5000/demo:1
docker push localhost:5000/demo:1
DIGEST=$(docker inspect --format '{{index .RepoDigests 0}}' localhost:5000/demo:1)   # localhost:5000/demo@sha256:...

cosign generate-key-pair                                    # cosign.key + cosign.pub
cosign sign --key cosign.key --tlog-upload=false "$DIGEST"
cosign attest --key cosign.key --tlog-upload=false --type cyclonedx --predicate sbom.json "$DIGEST"

cosign verify --key cosign.pub --insecure-ignore-tlog "$DIGEST"
cosign verify-attestation --key cosign.pub --insecure-ignore-tlog --type cyclonedx "$DIGEST" | jq -r .payload | base64 -d | jq '.predicate.components | length'</pre>
<p>שלושה כללים שחשובים יותר מהכלי:</p>
<ul>
<li><strong>חותמים על ה-digest, אף פעם לא על tag.</strong> אפשר להזיז tag כמו <code>:1</code> ל-image אחר מחר, ואת <code>@sha256:…</code> אי אפשר.</li>
<li><strong>מצמידים את ה-SBOM ל-image</strong> (כ-attestation) במקום לשמור אותו ב-bucket אקראי, כדי שמי שיש לו את ה-image ימצא גם את ה-SBOM שלו.</li>
<li><strong>מאמתים במקום שבו זה רץ.</strong> חתימה שאף אחד לא בודק היא קישוט. ב-Kubernetes זה התפקיד של admission policy, כמו <code>verifyImages</code> של Kyverno. הפרטים נמצאים בשיעור ה-Staff על supply chain.</li>
</ul>`
      } },
    { h: { en: "Triage: which CVEs actually matter", he: "תעדוף: אילו CVEs באמת חשובים" },
      body: {
        en: `<p>CVSS severity alone drowns you. Prioritize in this order:</p>
<ol>
<li><strong>CISA KEV</strong> (Known Exploited Vulnerabilities): it's being exploited in the wild right now. Fix within days.</li>
<li><strong>EPSS</strong>: the probability it gets exploited in the next 30 days. Above ~10% deserves attention even at "medium" severity.</li>
<li><strong>Reachability</strong>: is the vulnerable function in a package your code actually loads? A CVE in a CLI tool inside the image is less urgent than one in your web framework.</li>
<li><strong>Fix available</strong>: if there's no fix, document it and move on; re-check on the next scan.</li>
</ol>
<p>When you decide a CVE doesn't affect you, record it as <strong>VEX</strong> (Vulnerability Exploitability eXchange): a machine-readable "not affected, because the vulnerable code isn't in the execution path". Scanners read VEX and stop reporting it, and customers see why.</p>`,
        he: `<p>חומרת CVSS לבד מטביעה אותך. מתעדפים בסדר הזה:</p>
<ol>
<li><strong>CISA KEV</strong> (Known Exploited Vulnerabilities): מנצלים אותה בעולם ממש עכשיו. מתקנים תוך ימים.</li>
<li><strong>EPSS</strong>: ההסתברות שינצלו אותה ב-30 הימים הקרובים. מעל 10% בערך שווה תשומת לב גם בחומרה "בינונית".</li>
<li><strong>Reachability</strong>: האם הפונקציה הפגיעה נמצאת ב-package שהקוד שלך באמת טוען? CVE בכלי CLI שנמצא ב-image דחוף פחות מ-CVE ב-web framework שלך.</li>
<li><strong>יש תיקון?</strong> אם אין, מתעדים וממשיכים, ובודקים שוב בסריקה הבאה.</li>
</ol>
<p>כשמחליטים ש-CVE לא משפיע עליך, רושמים את זה כ-<strong>VEX</strong> (Vulnerability Exploitability eXchange): הצהרה שמכונה יכולה לקרוא, "לא מושפע, כי הקוד הפגיע לא נמצא במסלול הריצה". סורקים קוראים VEX ומפסיקים לדווח, והלקוחות רואים את הנימוק.</p>`
      } }
  ],
  diagram: "build -> image@sha256\n   |-> syft -> sbom.json (CycloneDX)\n   |-> grype sbom:sbom.json -> fail on fixable HIGH+\n   |-> cosign sign  (digest)\n   |-> cosign attest --predicate sbom.json\npush -> registry (image + signature + SBOM attestation)\ndeploy -> admission verifies signature -> run\ndaily -> re-scan stored SBOMs against new CVEs",
  handsOn: [
    { cmd: "syft nginx:1.27 -o table | head -30", what: { en: "List the components inside a real image: OS packages and libraries, with versions.", he: "רשימת הרכיבים בתוך image אמיתי: חבילות מערכת וספריות, עם גרסאות." } },
    { cmd: "syft nginx:1.27 -o cyclonedx-json > sbom.json && grype sbom:sbom.json --only-fixed", what: { en: "Generate a CycloneDX SBOM, then scan it for CVEs that already have a fix.", he: "מייצר SBOM בפורמט CycloneDX, ואז סורק אותה ל-CVEs שכבר יש להם תיקון." } },
    { cmd: "grype sbom:sbom.json -o json | jq '[.matches[].vulnerability.severity] | group_by(.) | map({(.[0]): length}) | add'", what: { en: "Count findings by severity: the first number to show your team.", he: "סופר ממצאים לפי חומרה: המספר הראשון שמראים לצוות." } },
    { cmd: "cosign verify ghcr.io/sigstore/cosign/cosign:v2.4.1 --certificate-identity-regexp 'https://github.com/sigstore/cosign/.*' --certificate-oidc-issuer https://token.actions.githubusercontent.com", what: { en: "Verify a real keyless signature: the image was signed by the cosign project's own GitHub Actions workflow.", he: "מאמת חתימת keyless אמיתית: ה-image נחתם על ידי ה-workflow של GitHub Actions של פרויקט cosign עצמו." } }
  ],
  mnemonic: { en: "List it, scan it, sign it, check it: always by digest.", he: "לרשום, לסרוק, לחתום ולבדוק, ותמיד לפי digest." },
  pitfalls: [
    { en: "Generating SBOMs nobody stores or queries. If you can't answer \"which images contain log4j 2.14?\" in one query, it's compliance theater.", he: "לייצר SBOMs שאף אחד לא שומר ולא שואל. אם אי אפשר לענות בשאילתה אחת על השאלה \"אילו images מכילים log4j 2.14?\", זה רק הצגה בשביל התאימות." },
    { en: "Signing or attesting a tag instead of a digest: the tag can later point at a different image than the one you signed.", he: "לחתום על tag במקום על digest: בהמשך ה-tag יכול להצביע על image אחר מזה שחתמת עליו." },
    { en: "Failing CI on every CVE: people learn to bypass the gate. Gate on fixable HIGH/CRITICAL and KEV, and track the rest.", he: "להכשיל את ה-CI על כל CVE: אנשים לומדים לעקוף את ה-gate. חוסמים רק HIGH/CRITICAL עם תיקון ו-KEV, ועוקבים אחרי השאר." },
    { en: "Scanning only at build time. New CVEs appear every day for images already running; re-scan stored SBOMs daily.", he: "לסרוק רק בזמן ה-build. כל יום מתפרסמים CVEs חדשים ל-images שכבר רצים, אז סורקים את ה-SBOMs השמורים מחדש כל יום." }
  ],
  interview: [
    { q: { en: "A new critical CVE is announced in a popular library. How do you find out within an hour whether you're affected?", he: "מתפרסם CVE קריטי בספרייה פופולרית. איך תדע תוך שעה אם אתם מושפעים?" },
      a: { en: "Query the stored SBOMs (Dependency-Track, GUAC, or a grype run over all SBOMs) for the package and vulnerable version range, joined with what's actually deployed (image digests running in each cluster). That gives the list of affected services and owners. Then check KEV/EPSS and reachability to set urgency, patch by bumping the dependency, rebuild, and verify the new digests are what's running.", he: "שואלים את ה-SBOMs השמורים (Dependency-Track, GUAC, או grype על כל ה-SBOMs) על ה-package וטווח הגרסאות הפגיע, ומצליבים עם מה שבאמת רץ (ה-digests של ה-images בכל cluster). ככה מקבלים רשימה של שירותים מושפעים והבעלים שלהם. אחר כך בודקים KEV, EPSS ו-reachability כדי לקבוע דחיפות, מתקנים על ידי העלאת גרסת ה-dependency, בונים מחדש ומוודאים שה-digests החדשים הם מה שרץ." } },
    { q: { en: "What's the difference between an SBOM, a signature and SLSA provenance?", he: "מה ההבדל בין SBOM, חתימה ו-SLSA provenance?" },
      a: { en: "The SBOM says what's inside the artifact. The signature says who vouches for this exact digest and that it wasn't modified. Provenance says how and where it was built (source repo and commit, build workflow, builder), so you can check it came from your CI and not a laptop. All three are usually stored as signed attestations next to the image.", he: "ה-SBOM אומרת מה יש בתוך ה-artifact. החתימה אומרת מי עומד מאחורי ה-digest המדויק הזה ושלא שינו אותו. ה-provenance אומר איך ואיפה הוא נבנה (repo ו-commit, ה-workflow, ה-builder), כדי שאפשר יהיה לבדוק שהוא יצא מה-CI שלך ולא מלפטופ. בדרך כלל שלושתם נשמרים כ-attestations חתומים ליד ה-image." } }
  ],
  quiz: [
    { q: { en: "Why scan a stored SBOM daily instead of only scanning the image at build time?", he: "למה לסרוק SBOM שמורה כל יום, ולא רק את ה-image בזמן ה-build?" },
      options: [ { en: "SBOM scans are more accurate than image scans", he: "סריקת SBOM מדויקת יותר מסריקת image" }, { en: "New CVEs are published for components that were clean at build time", he: "מתפרסמים CVEs חדשים לרכיבים שהיו נקיים בזמן ה-build" }, { en: "Images change after they are pushed", he: "images משתנים אחרי ה-push" }, { en: "Registries delete old images", he: "registries מוחקים images ישנים" } ],
      answer: 1,
      explain: { en: "The components don't change, but knowledge about them does. Re-scanning the SBOM is cheap and catches new CVEs without rebuilding or pulling the image.", he: "הרכיבים לא משתנים, אבל מה שיודעים עליהם כן. סריקה חוזרת של ה-SBOM זולה ותופסת CVEs חדשים בלי לבנות מחדש או למשוך את ה-image." } },
    { q: { en: "Which reference should you sign?", he: "על איזה reference צריך לחתום?" },
      options: [ { en: "myapp:latest", he: "myapp:latest" }, { en: "myapp:1.4.2", he: "myapp:1.4.2" }, { en: "myapp@sha256:9f86d0…", he: "myapp@sha256:9f86d0…" }, { en: "Any of them, they're equivalent", he: "כל אחד מהם, הם שקולים" } ],
      answer: 2,
      explain: { en: "Tags are mutable pointers; a digest identifies exactly one image content. A signature on a tag says nothing about what the tag points to tomorrow.", he: "tags הם מצביעים שאפשר להזיז, ו-digest מזהה תוכן של image אחד בדיוק. חתימה על tag לא אומרת כלום על מה שה-tag יצביע עליו מחר." } },
    { q: { en: "A scanner reports a critical CVE in a library function your service never calls. What records that decision so scanners and customers see it?", he: "סורק מדווח על CVE קריטי בפונקציה של ספרייה שהשירות שלך אף פעם לא קורא לה. מה מתעד את ההחלטה הזו כך שסורקים ולקוחות יראו אותה?" },
      options: [ { en: "A VEX statement", he: "הצהרת VEX" }, { en: "A new SBOM", he: "SBOM חדשה" }, { en: "SLSA provenance", he: "SLSA provenance" }, { en: "A cosign signature", he: "חתימת cosign" } ],
      answer: 0,
      explain: { en: "VEX says whether a product is affected by a CVE, with a justification such as 'vulnerable code not in execute path'. Scanners can consume it and suppress the finding.", he: "VEX אומרת אם מוצר מושפע מ-CVE, עם נימוק כמו 'הקוד הפגיע לא נמצא במסלול הריצה'. סורקים יודעים לקרוא אותה ולהסתיר את הממצא." } },
    { q: { en: "Which signal says a CVE is being exploited in the wild right now?", he: "איזה סימן אומר ש-CVE מנוצל בעולם ממש עכשיו?" },
      options: [ { en: "CVSS score 9.8", he: "ציון CVSS של 9.8" }, { en: "Listed in CISA KEV", he: "מופיע ב-CISA KEV" }, { en: "Has a CycloneDX entry", he: "יש לו רשומה ב-CycloneDX" }, { en: "Fix available", he: "יש תיקון" } ],
      answer: 1,
      explain: { en: "CVSS measures how bad it could be; KEV lists vulnerabilities with confirmed exploitation. KEV entries go to the top of the queue.", he: "CVSS מודד כמה זה יכול להיות חמור. KEV מונה פגיעויות שיש ניצול מאומת שלהן, ורשומות KEV עוברות לראש התור." } }
  ],
  related: ["staff-supply-chain", "container-security", "container-registries", "container-slim-images", "pr-security-ops"]
});

INFRA.glossary.push(
  { term: "CycloneDX", track: "containers", def: { en: "OWASP SBOM format focused on security: components, vulnerabilities, VEX and services.", he: "פורמט SBOM של OWASP שמתמקד באבטחה: רכיבים, פגיעויות, VEX ו-services." }, lesson: "container-sbom-101" },
  { term: "SPDX", track: "containers", def: { en: "Linux Foundation SBOM format (ISO/IEC 5962), strong on licenses and legal compliance.", he: "פורמט SBOM של ה-Linux Foundation (תקן ISO/IEC 5962), חזק בתחום הרישיונות והתאימות המשפטית." }, lesson: "container-sbom-101" },
  { term: "VEX", track: "containers", def: { en: "Vulnerability Exploitability eXchange: a machine-readable statement that a product is or isn't affected by a CVE, and why.", he: "Vulnerability Exploitability eXchange: הצהרה שמכונה יכולה לקרוא, שאומרת אם מוצר מושפע מ-CVE ולמה." }, lesson: "container-sbom-101" },
  { term: "KEV", track: "containers", def: { en: "CISA's Known Exploited Vulnerabilities catalog: CVEs with confirmed exploitation in the wild. Fix these first.", he: "הקטלוג של CISA לפגיעויות שמנוצלות בפועל (Known Exploited Vulnerabilities). מתקנים אותן קודם." }, lesson: "container-sbom-101" },
  { term: "Syft", track: "containers", def: { en: "Anchore CLI that generates an SBOM from an image, directory or archive.", he: "CLI של Anchore שמייצר SBOM מ-image, מתיקייה או מארכיון." }, lesson: "container-sbom-101" },
  { term: "Grype", track: "containers", def: { en: "Anchore vulnerability scanner for images, directories and SBOMs.", he: "סורק פגיעויות של Anchore ל-images, לתיקיות ול-SBOMs." }, lesson: "container-sbom-101" },
  { term: "Attestation", track: "containers", def: { en: "A signed statement about an artifact (its SBOM, provenance or scan result), stored next to it and bound to its digest.", he: "הצהרה חתומה על artifact (ה-SBOM, ה-provenance או תוצאת סריקה), שנשמרת לידו וקשורה ל-digest שלו." }, lesson: "container-sbom-101" },
  { term: "in-toto", track: "staff", def: { en: "Framework for signed supply-chain metadata; its statement format is what SLSA provenance and cosign attestations use.", he: "Framework למטא-דאטה חתום של שרשרת האספקה. פורמט ה-statement שלו הוא מה ש-SLSA provenance ו-attestations של cosign משתמשים בו." }, lesson: "staff-supply-chain" },
  { term: "OpenSSF Scorecard", track: "staff", def: { en: "Automated checks that score an open-source repo's security practices (branch protection, pinning, signed releases…).", he: "בדיקות אוטומטיות שנותנות ציון לפרקטיקות האבטחה של repo בקוד פתוח (branch protection, pinning, releases חתומים…)." }, lesson: "staff-supply-chain" },
  { term: "SSDF", track: "staff", def: { en: "NIST Secure Software Development Framework (SP 800-218): the practice checklist suppliers attest to.", he: "ה-Secure Software Development Framework של NIST (SP 800-218): רשימת הפרקטיקות שספקים מצהירים עליהן." }, lesson: "staff-supply-chain" },
  { term: "Dependency confusion", track: "staff", def: { en: "Attack where a public package with the same name as an internal one, and a higher version, gets installed by the build.", he: "מתקפה שבה package ציבורי באותו שם כמו package פנימי, ועם גרסה גבוהה יותר, מותקן על ידי ה-build." }, lesson: "staff-supply-chain" },
  { term: "Typosquatting", track: "staff", def: { en: "Publishing a malicious package under a name one typo away from a popular one (reqeusts vs requests).", he: "פרסום package זדוני בשם שרחוק שגיאת הקלדה אחת מ-package פופולרי (reqeusts במקום requests)." }, lesson: "staff-supply-chain" }
);

// --- w1.js (syllabus gap) ---
// ---------------------------------------------------------------------------
// kubeadm cluster lifecycle (CKA-level)
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "k8s-cluster-lifecycle-kubeadm",
  track: "kubernetes",
  order: 60,
  icon: "🛠️",
  level: 2,
  minutes: 16,
  title: { en: "Running a kubeadm Cluster: Init, Upgrade, etcd Backup, Certs & Users", he: "להפעיל cluster עם kubeadm: הקמה, שדרוג, גיבוי etcd, תעודות ומשתמשים" },
  tldr: {
    en: "With kubeadm the control plane is just static Pods in /etc/kubernetes/manifests plus files in /etc/kubernetes/pki: you upgrade one minor at a time (control plane first, then nodes), back up etcd with etcdctl snapshot save, renew certificates before their 1-year expiry, and create users by signing a CSR through the API.",
    he: "ב-kubeadm ה-control plane הוא בסך הכול static Pods שה-kubelet מריץ מתיקיית ה-manifests, ועוד תעודות בתיקיית ה-pki. משדרגים minor אחד בכל פעם (קודם control plane, אחר כך nodes), מגבים את etcd עם snapshot, מחדשים תעודות לפני שהן פגות אחרי שנה, ויוצרים משתמשים על ידי חתימה על CSR דרך ה-API."
  },
  analogy: {
    en: "A kubeadm cluster is a restaurant where the kitchen staff (API server, scheduler, controller-manager, etcd) aren't hired through HR (the API) but are listed on a note taped to the kitchen door (the manifests folder) — the shift manager (kubelet) reads the note and makes sure those people are always at their stations. etcd is the recipe book: photocopy it nightly (snapshot). The staff ID badges (certificates) expire after a year — forget to renew them and on day 366 nobody gets into the kitchen.",
    he: "Cluster של kubeadm הוא מסעדה שבה צוות המטבח (API server, scheduler, controller-manager, etcd) לא מגויס דרך משאבי אנוש (ה-API), אלא רשום על פתק שמודבק על דלת המטבח (תיקיית ה-manifests). מנהל המשמרת (kubelet) קורא את הפתק ודואג שהם תמיד בעמדות. etcd הוא ספר המתכונים: מצלמים אותו כל לילה (snapshot). תגי העובד (תעודות) פגים אחרי שנה – שכחת לחדש, וביום ה-366 אף אחד לא נכנס למטבח."
  },
  sections: [
    {
      h: { en: "init and join: what kubeadm actually builds", he: "init ו-join: מה kubeadm בונה בפועל" },
      body: {
        en: `<p><code>kubeadm init</code> runs a fixed list of phases: preflight checks (swap, ports 6443/2379/10250, container runtime), generates a CA and certificates into <code>/etc/kubernetes/pki</code>, writes kubeconfigs (<code>admin.conf</code>, <code>kubelet.conf</code>, <code>controller-manager.conf</code>, <code>scheduler.conf</code>), writes static Pod manifests, waits for the API server, then installs CoreDNS and kube-proxy. It does <strong>not</strong> install a CNI — nodes stay <code>NotReady</code> until you do.</p>
<pre># first control-plane node (HA-ready: endpoint is a load balancer / VIP)
sudo kubeadm init --control-plane-endpoint=k8s-api.lab:6443 \
  --upload-certs --pod-network-cidr=10.244.0.0/16

# worker
sudo kubeadm join k8s-api.lab:6443 --token abcdef.0123456789abcdef \
  --discovery-token-ca-cert-hash sha256:4f1c...e9

# extra control-plane node
sudo kubeadm join k8s-api.lab:6443 --token ... --discovery-token-ca-cert-hash sha256:... \
  --control-plane --certificate-key 7d3a...b1</pre>
<p>Bootstrap tokens live <strong>24 hours</strong>; the uploaded certificate secret for extra control planes lives <strong>2 hours</strong>. Next week you'll need <code>kubeadm token create --print-join-command</code> (and <code>kubeadm init phase upload-certs --upload-certs</code> for a new certificate key).</p>
<blockquote>⚠️ Production tip: always set <code>--control-plane-endpoint</code> on the first init, even with one control plane. It's baked into every kubeconfig and certificate SAN; adding it later to go HA means re-issuing certs and kubeconfigs everywhere.</blockquote>`,
        he: `<p><code>kubeadm init</code> מריץ רשימה קבועה של phases: בדיקות preflight (swap, הפורטים 6443/2379/10250, ה-container runtime), יצירת CA ותעודות בתיקייה <code>/etc/kubernetes/pki</code>, כתיבת kubeconfig-ים (<code>admin.conf</code>, <code>kubelet.conf</code>, <code>controller-manager.conf</code>, <code>scheduler.conf</code>), כתיבת manifests של static Pods, המתנה ל-API server, ובסוף התקנה של CoreDNS ו-kube-proxy. הוא <strong>לא</strong> מתקין CNI – ה-nodes נשארים במצב <code>NotReady</code> עד שתתקין אחד.</p>
<pre># first control-plane node (HA-ready: endpoint is a load balancer / VIP)
sudo kubeadm init --control-plane-endpoint=k8s-api.lab:6443 \
  --upload-certs --pod-network-cidr=10.244.0.0/16

# worker
sudo kubeadm join k8s-api.lab:6443 --token abcdef.0123456789abcdef \
  --discovery-token-ca-cert-hash sha256:4f1c...e9

# extra control-plane node
sudo kubeadm join k8s-api.lab:6443 --token ... --discovery-token-ca-cert-hash sha256:... \
  --control-plane --certificate-key 7d3a...b1</pre>
<p>Bootstrap tokens חיים <strong>24 שעות</strong>; ה-secret של התעודות שהועלו בשביל control planes נוספים חי <strong>שעתיים</strong>. בשבוע הבא תצטרך את <code>kubeadm token create --print-join-command</code> (ואת <code>kubeadm init phase upload-certs --upload-certs</code> בשביל certificate key חדש).</p>
<blockquote>⚠️ טיפ לפרודקשן: תמיד תגדיר <code>--control-plane-endpoint</code> כבר ב-init הראשון, גם עם control plane יחיד. הוא נצרב בכל kubeconfig וב-SAN של כל תעודה; להוסיף אותו אחר כך כדי לעבור ל-HA אומר להנפיק מחדש תעודות ו-kubeconfig-ים בכל מקום.</blockquote>`
      }
    },
    {
      h: { en: "Static Pods: the control plane without a control plane", he: "Static Pods: control plane בלי control plane" },
      body: {
        en: `<p>Chicken-and-egg: who schedules the API server if the API server isn't up? Nobody. The kubelet watches <code>staticPodPath</code> (set in <code>/var/lib/kubelet/config.yaml</code>, kubeadm uses <code>/etc/kubernetes/manifests</code>) and runs every YAML there directly, then publishes a read-only <strong>mirror Pod</strong> to the API, named with the node suffix: <code>kube-apiserver-cp1</code>.</p>
<pre>$ ls /etc/kubernetes/manifests
etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml
$ grep staticPodPath /var/lib/kubelet/config.yaml
staticPodPath: /etc/kubernetes/manifests</pre>
<ul>
<li><strong>Edit the file</strong> to change a flag: the kubelet notices within seconds and recreates the Pod. A YAML typo means the API server simply doesn't come back — check with <code>crictl ps -a</code> and <code>crictl logs</code>, because <code>kubectl</code> is down too.</li>
<li><strong>Move the file out</strong> to stop the component (the standard way to stop etcd or the API server during a restore).</li>
<li><code>kubectl delete pod kube-apiserver-cp1</code> only deletes the mirror; the kubelet recreates it at once.</li>
</ul>
<blockquote>💡 Real world: never keep a backup copy like <code>kube-apiserver.yaml.bak</code> inside the manifests folder. The kubelet loads every file in it (only dotfiles are ignored), so you get two API servers fighting over port 6443. Keep backups in <code>/root/</code>.</blockquote>`,
        he: `<p>בעיית הביצה והתרנגולת: מי עושה schedule ל-API server אם ה-API server עוד לא עלה? אף אחד. ה-kubelet עוקב אחרי <code>staticPodPath</code> (מוגדר בקובץ <code>/var/lib/kubelet/config.yaml</code>, ו-kubeadm משתמש ב-<code>/etc/kubernetes/manifests</code>) ומריץ ישירות כל YAML שנמצא שם. אחר כך הוא מפרסם ל-API עותק <strong>mirror Pod</strong> לקריאה בלבד, עם שם ה-node כסיומת: <code>kube-apiserver-cp1</code>.</p>
<pre>$ ls /etc/kubernetes/manifests
etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml
$ grep staticPodPath /var/lib/kubelet/config.yaml
staticPodPath: /etc/kubernetes/manifests</pre>
<ul>
<li><strong>עורכים את הקובץ</strong> כדי לשנות flag: ה-kubelet שם לב תוך שניות ויוצר את ה-Pod מחדש. טעות ב-YAML אומרת שה-API server פשוט לא חוזר – בודקים עם <code>crictl ps -a</code> ו-<code>crictl logs</code>, כי גם <code>kubectl</code> לא עובד.</li>
<li><strong>מוציאים את הקובץ</strong> מהתיקייה כדי לעצור את הרכיב (הדרך המקובלת לעצור את etcd או את ה-API server בזמן שחזור).</li>
<li>הפקודה <code>kubectl delete pod kube-apiserver-cp1</code> מוחקת רק את ה-mirror; ה-kubelet יוצר אותו מחדש מיד.</li>
</ul>
<blockquote>💡 מהשטח: אל תשאיר עותק גיבוי כמו <code>kube-apiserver.yaml.bak</code> בתוך תיקיית ה-manifests. ה-kubelet טוען כל קובץ שם (רק קבצים שמתחילים בנקודה מדולגים), ואז יש לך שני API servers שנלחמים על פורט 6443. תשמור גיבויים ב-<code>/root/</code>.</blockquote>`
      }
    },
    {
      h: { en: "Upgrades: one minor at a time, control plane first", he: "שדרוג: minor אחד בכל פעם, קודם ה-control plane" },
      body: {
        en: `<p>You cannot skip minors (1.30 → 1.32 is not allowed; go 1.30 → 1.31 → 1.32). Version skew rules decide the order: the kubelet may be up to <strong>3 minors older</strong> than the API server but never newer, controller-manager and scheduler at most 1 older, kubectl ±1. So: control plane first, then nodes.</p>
<pre># 0. point the package repo at the NEW minor (pkgs.k8s.io has one repo per minor)
#    /etc/apt/sources.list.d/kubernetes.list: .../core:/stable:/v1.31/deb/ /

# 1. first control-plane node
apt-get install -y kubeadm='1.31.2-*'
kubeadm upgrade plan                 # shows target versions + cert renewal
kubeadm upgrade apply v1.31.2        # rewrites static Pod manifests, renews certs

# 2. other control-plane nodes
kubeadm upgrade node

# 3. on EVERY node (control planes too), one at a time
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data
apt-get install -y kubelet='1.31.2-*' kubectl='1.31.2-*'
systemctl daemon-reload &amp;&amp; systemctl restart kubelet
kubectl uncordon node-1

# workers: upgrade the kubeadm package, run "kubeadm upgrade node", then kubelet as above</pre>
<p><code>kubeadm upgrade apply</code> also renews all control-plane certificates (unless <code>--certificate-renewal=false</code>) — which is why clusters upgraded at least once a year rarely see certificate expiry.</p>`,
        he: `<p>אי אפשר לדלג על minors (מ-1.30 ישר ל-1.32 אסור; עוברים דרך 1.31). חוקי ה-version skew קובעים את הסדר: ה-kubelet יכול להיות עד <strong>3 minors מאחורי</strong> ה-API server אבל אף פעם לא לפניו, ה-controller-manager וה-scheduler לכל היותר אחד מאחור, ו-kubectl בטווח של אחד לכל כיוון. לכן קודם control plane, ואחריו ה-nodes.</p>
<pre># 0. point the package repo at the NEW minor (pkgs.k8s.io has one repo per minor)
#    /etc/apt/sources.list.d/kubernetes.list: .../core:/stable:/v1.31/deb/ /

# 1. first control-plane node
apt-get install -y kubeadm='1.31.2-*'
kubeadm upgrade plan                 # shows target versions + cert renewal
kubeadm upgrade apply v1.31.2        # rewrites static Pod manifests, renews certs

# 2. other control-plane nodes
kubeadm upgrade node

# 3. on EVERY node (control planes too), one at a time
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data
apt-get install -y kubelet='1.31.2-*' kubectl='1.31.2-*'
systemctl daemon-reload &amp;&amp; systemctl restart kubelet
kubectl uncordon node-1

# workers: upgrade the kubeadm package, run "kubeadm upgrade node", then kubelet as above</pre>
<p>הפקודה <code>kubeadm upgrade apply</code> גם מחדשת את כל התעודות של ה-control plane (אלא אם הוספת <code>--certificate-renewal=false</code>). לכן clusters שמשודרגים לפחות פעם בשנה כמעט לא נתקלים בתעודות שפגו.</p>`
      }
    },
    {
      h: { en: "etcd snapshot: save and restore", he: "Snapshot של etcd: גיבוי ושחזור" },
      body: {
        en: `<p>etcd only talks mTLS, so <code>etcdctl</code> needs all four flags. On kubeadm the certs are in <code>/etc/kubernetes/pki/etcd/</code> (copy the paths from <code>etcd.yaml</code> instead of guessing):</p>
<pre>ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save /opt/backup/etcd-$(date +%F).db

etcdutl snapshot status /opt/backup/etcd-2026-11-19.db -w table</pre>
<p>Restore is <strong>offline</strong> — it works on a file and needs no certs. It writes a brand-new data dir; you then point the etcd static Pod at it:</p>
<pre>etcdutl snapshot restore /opt/backup/etcd-2026-11-19.db \
  --data-dir /var/lib/etcd-restored
# (etcd 3.5: "etcdctl snapshot restore" still works with a deprecation warning; removed in 3.6)

# edit /etc/kubernetes/manifests/etcd.yaml -> volumes: etcd-data hostPath:
#   path: /var/lib/etcd-restored
# kubelet restarts etcd; then restart the API server (move its manifest out and back)</pre>
<blockquote>⚠️ Production tip: a restore rolls the whole cluster back in time. Deployments created after the snapshot vanish, but their Pods may still be running on nodes, and controllers see resourceVersions that went backwards. After a restore, restart kube-controller-manager, kube-scheduler and kubelets, and expect some cleanup. Practice it on a lab cluster before you need it. The full multi-member procedure is in <code>#/lesson/k8s-etcd-apf</code>.</blockquote>`,
        he: `<p>etcd מדבר רק mTLS, אז <code>etcdctl</code> צריך את כל ארבעת ה-flags. ב-kubeadm התעודות נמצאות ב-<code>/etc/kubernetes/pki/etcd/</code> (תעתיק את הנתיבים מתוך <code>etcd.yaml</code> במקום לנחש):</p>
<pre>ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save /opt/backup/etcd-$(date +%F).db

etcdutl snapshot status /opt/backup/etcd-2026-11-19.db -w table</pre>
<p>שחזור הוא פעולה <strong>offline</strong>: הוא עובד על קובץ ולא צריך תעודות. הוא כותב data dir חדש לגמרי, ואז מכוונים אליו את ה-static Pod של etcd:</p>
<pre>etcdutl snapshot restore /opt/backup/etcd-2026-11-19.db \
  --data-dir /var/lib/etcd-restored
# (etcd 3.5: "etcdctl snapshot restore" still works with a deprecation warning; removed in 3.6)

# edit /etc/kubernetes/manifests/etcd.yaml -> volumes: etcd-data hostPath:
#   path: /var/lib/etcd-restored
# kubelet restarts etcd; then restart the API server (move its manifest out and back)</pre>
<blockquote>⚠️ טיפ לפרודקשן: שחזור מחזיר את כל ה-cluster אחורה בזמן. Deployments שנוצרו אחרי ה-snapshot נעלמים, אבל ה-Pods שלהם עדיין יכולים לרוץ על nodes, וה-controllers רואים resourceVersions שזזו אחורה. אחרי שחזור תעשה restart ל-kube-controller-manager, ל-kube-scheduler ול-kubelets, ותצפה לקצת ניקיונות. תתרגל את זה ב-cluster מעבדה לפני שתצטרך. התהליך המלא עם כמה members נמצא בשיעור <code>#/lesson/k8s-etcd-apf</code>.</blockquote>`
      }
    },
    {
      h: { en: "Certificates: expiry, renewal, kubelet rotation, new users", he: "תעודות: תפוגה, חידוש, rotation של kubelet ומשתמשים חדשים" },
      body: {
        en: `<p>kubeadm issues the CA for <strong>10 years</strong> and every leaf certificate (API server, etcd, front-proxy, the client certs in admin.conf and friends) for <strong>1 year</strong>. On expiry day <code>kubectl</code> gets <code>x509: certificate has expired or is not yet valid</code> and the control plane components can no longer talk to each other.</p>
<pre>kubeadm certs check-expiration
CERTIFICATE                EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
admin.conf                 Nov 02, 2027 09:14 UTC   347d            no
apiserver                  Nov 02, 2027 09:14 UTC   347d            no
...
kubeadm certs renew all
# then restart the control-plane static Pods (move the 4 manifests out, wait ~20s, move back)
cp /etc/kubernetes/admin.conf ~/.kube/config</pre>
<p><strong>Kubelet certs</strong> are separate. The kubelet's <em>client</em> cert (<code>/var/lib/kubelet/pki/kubelet-client-current.pem</code>) rotates by itself (<code>rotateCertificates: true</code>): before expiry the kubelet files a CSR that is auto-approved. Its <em>serving</em> cert is self-signed by default; with <code>serverTLSBootstrap: true</code> it requests one via CSR too, but those <code>kubelet-serving</code> CSRs are <strong>not</strong> auto-approved — someone (or a controller) must approve them.</p>
<p><strong>A new human user</strong> is just a client cert signed by the cluster CA: CN = username, O = group. The CSR API does it without touching the CA key:</p>
<pre>openssl genrsa -out jane.key 2048
openssl req -new -key jane.key -out jane.csr -subj "/CN=jane/O=dev-team"

cat &lt;&lt;EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: jane
spec:
  request: $(base64 -w0 jane.csr)
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 86400          # 24h
  usages: ["client auth"]
EOF
kubectl certificate approve jane
kubectl get csr jane -o jsonpath='{.status.certificate}' | base64 -d &gt; jane.crt
kubectl config set-credentials jane --client-key=jane.key --client-certificate=jane.crt --embed-certs=true
kubectl create rolebinding jane-edit --clusterrole=edit --user=jane -n dev</pre>
<blockquote>💡 Real world: Kubernetes has no certificate revocation list. A leaked client cert works until it expires, and if its O is <code>system:masters</code> it bypasses RBAC entirely. Give people short-lived certs (or better, OIDC), never <code>system:masters</code>.</blockquote>`,
        he: `<p>kubeadm מנפיק את ה-CA ל-<strong>10 שנים</strong> וכל תעודת leaf (API server, etcd, front-proxy, תעודות ה-client בתוך admin.conf וחבריו) ל-<strong>שנה אחת</strong>. ביום התפוגה <code>kubectl</code> מקבל את השגיאה <code>x509: certificate has expired or is not yet valid</code>, ורכיבי ה-control plane כבר לא מצליחים לדבר אחד עם השני.</p>
<pre>kubeadm certs check-expiration
CERTIFICATE                EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
admin.conf                 Nov 02, 2027 09:14 UTC   347d            no
apiserver                  Nov 02, 2027 09:14 UTC   347d            no
...
kubeadm certs renew all
# then restart the control-plane static Pods (move the 4 manifests out, wait ~20s, move back)
cp /etc/kubernetes/admin.conf ~/.kube/config</pre>
<p>התעודות של ה-<strong>kubelet</strong> הן סיפור נפרד. תעודת ה-<em>client</em> שלו (<code>/var/lib/kubelet/pki/kubelet-client-current.pem</code>) מתחלפת לבד (<code>rotateCertificates: true</code>): לפני התפוגה ה-kubelet מגיש CSR שמאושר אוטומטית. תעודת ה-<em>serving</em> שלו היא self-signed כברירת מחדל; עם <code>serverTLSBootstrap: true</code> הוא מבקש גם אותה דרך CSR, אבל בקשות ה-<code>kubelet-serving</code> האלה <strong>לא</strong> מאושרות אוטומטית – מישהו (או controller) צריך לאשר אותן.</p>
<p><strong>משתמש אנושי חדש</strong> הוא פשוט תעודת client שחתומה על ידי ה-CA של ה-cluster: ה-CN הוא שם המשתמש וה-O הוא הקבוצה. ה-CSR API עושה את זה בלי לגעת במפתח של ה-CA:</p>
<pre>openssl genrsa -out jane.key 2048
openssl req -new -key jane.key -out jane.csr -subj "/CN=jane/O=dev-team"

cat &lt;&lt;EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: jane
spec:
  request: $(base64 -w0 jane.csr)
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 86400          # 24h
  usages: ["client auth"]
EOF
kubectl certificate approve jane
kubectl get csr jane -o jsonpath='{.status.certificate}' | base64 -d &gt; jane.crt
kubectl config set-credentials jane --client-key=jane.key --client-certificate=jane.crt --embed-certs=true
kubectl create rolebinding jane-edit --clusterrole=edit --user=jane -n dev</pre>
<blockquote>💡 מהשטח: ל-Kubernetes אין רשימת ביטול תעודות. תעודת client שדלפה עובדת עד שהיא פגה, ואם ה-O שלה הוא <code>system:masters</code> היא עוקפת את ה-RBAC לגמרי. תן לאנשים תעודות קצרות חיים (או עדיף OIDC), ואף פעם לא <code>system:masters</code>.</blockquote>`
      }
    }
  ],
  diagram: `control-plane node (kubeadm)
 /etc/kubernetes/
   manifests/  etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml
        |  watched by kubelet (staticPodPath)
        v
   kubelet --runs--> [etcd] <--mTLS-- [kube-apiserver] <-- [controller-mgr] [scheduler]
        |                 |                  ^
        |      snapshot save (etcdctl)       |  client certs: pki/*.crt  (1 year)
        |                 v                  |  CA: pki/ca.crt           (10 years)
        |        /opt/backup/etcd.db         |
        +-- mirror Pods --> API: kube-apiserver-cp1 ...

upgrade order:  kubeadm pkg -> upgrade apply (cp1) -> upgrade node (cp2,cp3)
                -> per node: drain -> kubelet+kubectl -> restart -> uncordon`,
  handsOn: [
    { cmd: "sudo kubeadm certs check-expiration", what: { en: "See how many days each control-plane certificate and kubeconfig has left.", he: "לראות כמה ימים נשארו לכל תעודה ו-kubeconfig של ה-control plane." } },
    { cmd: "sudo kubeadm upgrade plan", what: { en: "Read-only: shows current and target versions for every component and which certs will be renewed.", he: "קריאה בלבד: מציג גרסה נוכחית וגרסת יעד לכל רכיב, ואילו תעודות יחודשו." } },
    { cmd: "sudo ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /tmp/etcd.db", what: { en: "Take an etcd snapshot on a kubeadm control-plane node, then inspect it with etcdutl snapshot status /tmp/etcd.db -w table.", he: "לקחת snapshot של etcd על node של control plane ב-kubeadm, ואז בודקים אותו עם <code>etcdutl snapshot status /tmp/etcd.db -w table</code> כדי לראות את התוכן כטבלה." } },
    { cmd: "sudo crictl ps -a --name kube-apiserver && sudo crictl logs $(sudo crictl ps -aq --name kube-apiserver | head -1)", what: { en: "Debug the API server when kubectl is dead: list its container through the runtime and read its logs.", he: "לדבג את ה-API server כש-kubectl מת: לראות את הקונטיינר שלו דרך ה-runtime ולקרוא את הלוגים." } },
    { cmd: "kubectl get csr && kubectl auth can-i list pods -n dev --as jane", what: { en: "List pending CSRs (kubelet-serving ones need manual approval), then check what a new user may do.", he: "לראות CSR-ים שממתינים (אלה של kubelet-serving צריכים אישור ידני), ואז לבדוק מה משתמש חדש מורשה לעשות." } }
  ],
  mnemonic: {
    en: "\"Manifests, Minors, Snapshots, Year\": control plane = files in manifests; upgrade one minor, control plane first; snapshot etcd before touching anything; certs die after a year.",
    he: "\"קבצים, minor, צילום, שנה\": ה-control plane הוא קבצים ב-manifests; משדרגים minor אחד, control plane קודם; מצלמים את etcd לפני שנוגעים במשהו; תעודות מתות אחרי שנה."
  },
  pitfalls: [
    { en: "Skipping the package repo change: pkgs.k8s.io has a separate repo per minor, so apt keeps saying kubeadm is up to date while you're still on 1.30.", he: "לשכוח להחליף את ה-repo של החבילות: ב-pkgs.k8s.io יש repo נפרד לכל minor, אז apt ממשיך להגיד ש-kubeadm מעודכן בזמן שאתה עדיין על 1.30." },
    { en: "Running etcdctl without --cacert/--cert/--key (or with the apiserver's certs instead of the etcd ones): you get 'context deadline exceeded', which looks like a network problem but is a TLS problem.", he: "להריץ etcdctl בלי --cacert/--cert/--key (או עם התעודות של ה-apiserver במקום של etcd): מקבלים 'context deadline exceeded', שנראה כמו בעיית רשת אבל הוא בעיית TLS." },
    { en: "Renewing certs and not restarting the control-plane Pods: the files are new but the running processes still serve the old cert until restart.", he: "לחדש תעודות ולא לעשות restart ל-Pods של ה-control plane: הקבצים חדשים, אבל התהליכים שרצים ממשיכים להגיש את התעודה הישנה עד ה-restart." },
    { en: "Restoring a snapshot into /var/lib/etcd while etcd is running, or forgetting to update the hostPath in etcd.yaml: etcd keeps serving the old data and you think the restore 'did nothing'.", he: "לשחזר snapshot לתוך /var/lib/etcd בזמן ש-etcd רץ, או לשכוח לעדכן את ה-hostPath בקובץ etcd.yaml: ה-etcd ממשיך להגיש את המידע הישן, ונראה לך שהשחזור 'לא עשה כלום'." }
  ],
  interview: [
    {
      q: { en: "Walk me through upgrading a 3-control-plane kubeadm cluster from 1.30 to 1.31.", he: "תסביר איך משדרגים cluster של kubeadm עם 3 control planes מ-1.30 ל-1.31." },
      a: { en: "Snapshot etcd first. Switch the package repo to v1.31. On cp1: upgrade the kubeadm package, kubeadm upgrade plan, kubeadm upgrade apply v1.31.x (rewrites static Pod manifests and renews certs). On cp2 and cp3: upgrade kubeadm, kubeadm upgrade node. Then for every node one at a time: drain, upgrade kubelet and kubectl, daemon-reload, restart kubelet, uncordon. Workers run kubeadm upgrade node too. Never skip a minor; kubelets may lag the API server but never lead it. Finally upgrade the CNI and other add-ons if the new version needs it.", he: "קודם snapshot ל-etcd. מחליפים את ה-repo של החבילות ל-v1.31. על cp1: משדרגים את חבילת kubeadm, מריצים kubeadm upgrade plan ואז kubeadm upgrade apply v1.31.x (כותב מחדש את ה-manifests של ה-static Pods ומחדש תעודות). על cp2 ו-cp3: משדרגים kubeadm ומריצים kubeadm upgrade node. אחר כך כל node בתורו: drain, שדרוג kubelet ו-kubectl, daemon-reload, restart ל-kubelet, uncordon. גם ה-workers מריצים kubeadm upgrade node. לא מדלגים על minor; ה-kubelets יכולים לפגר אחרי ה-API server אבל לא להקדים אותו. בסוף משדרגים את ה-CNI ושאר ה-add-ons אם הגרסה החדשה דורשת." }
    },
    {
      q: { en: "Monday morning kubectl says 'x509: certificate has expired'. The cluster was installed with kubeadm a year ago. What do you do?", he: "ביום שני בבוקר kubectl אומר 'x509: certificate has expired'. ה-cluster הותקן עם kubeadm לפני שנה. מה אתה עושה?" },
      a: { en: "SSH to each control-plane node, confirm with kubeadm certs check-expiration, run kubeadm certs renew all, restart the four control-plane static Pods by moving their manifests out and back, and copy the new /etc/kubernetes/admin.conf to your kubeconfig. Worker kubelets usually survived thanks to client cert rotation. Then add an alert on certificate expiry (for example 30 days) and put upgrades on a schedule, since every kubeadm upgrade renews certs.", he: "נכנסים ב-SSH לכל node של control plane, מוודאים עם kubeadm certs check-expiration, מריצים kubeadm certs renew all, עושים restart לארבעת ה-static Pods של ה-control plane (מוציאים את ה-manifests ומחזירים), ומעתיקים את ה-admin.conf החדש ל-kubeconfig. ה-kubelets של ה-workers בדרך כלל שרדו בזכות rotation של תעודת ה-client. אחר כך מוסיפים alert על תפוגת תעודות (למשל 30 יום לפני) וקובעים שדרוגים קבועים, כי כל שדרוג של kubeadm מחדש תעודות." }
    }
  ],
  quiz: [
    {
      q: { en: "You run kubectl delete pod kube-scheduler-cp1 -n kube-system. What happens?", he: "הרצת kubectl delete pod kube-scheduler-cp1 -n kube-system. מה קורה?" },
      options: [
        { en: "The scheduler is gone until you run kubeadm init again", he: "ה-scheduler נעלם עד שתריץ שוב kubeadm init" },
        { en: "Only the mirror Pod is deleted; the kubelet still runs the static Pod and recreates the mirror", he: "רק ה-mirror Pod נמחק; ה-kubelet ממשיך להריץ את ה-static Pod ויוצר את ה-mirror מחדש" },
        { en: "The Deployment controller creates a new scheduler Pod on another node", he: "ה-Deployment controller יוצר Pod חדש של scheduler על node אחר" },
        { en: "The API server refuses: system Pods can't be deleted", he: "ה-API server מסרב: אי אפשר למחוק Pods של המערכת" }
      ],
      answer: 1,
      explain: { en: "Static Pods are owned by the kubelet via files in /etc/kubernetes/manifests. The API object is just a mirror; to stop the component you move the manifest file out.", he: "Static Pods שייכים ל-kubelet דרך קבצים ב-/etc/kubernetes/manifests. האובייקט ב-API הוא רק mirror; כדי לעצור את הרכיב מוציאים את קובץ ה-manifest מהתיקייה." }
    },
    {
      q: { en: "The API server is on 1.31. Which kubelet version is NOT allowed on a node?", he: "ה-API server על 1.31. איזו גרסת kubelet אסורה על node?" },
      options: [
        { en: "1.28", he: "1.28" },
        { en: "1.30", he: "1.30" },
        { en: "1.31", he: "1.31" },
        { en: "1.32", he: "1.32" }
      ],
      answer: 3,
      explain: { en: "The kubelet may be up to 3 minors older than the API server, never newer. That's why the control plane is upgraded first.", he: "ה-kubelet יכול להיות עד 3 minors מאחורי ה-API server, אף פעם לא חדש ממנו. בגלל זה משדרגים קודם את ה-control plane." }
    },
    {
      q: { en: "etcdctl snapshot save hangs and fails with 'context deadline exceeded' on a kubeadm node. Most likely cause?", he: "על node של kubeadm, הפקודה etcdctl snapshot save נתקעת ונכשלת עם 'context deadline exceeded'. מה הסיבה הסבירה?" },
      options: [
        { en: "The disk is full", he: "הדיסק מלא" },
        { en: "etcd has no leader", he: "ל-etcd אין leader" },
        { en: "Missing or wrong --cacert/--cert/--key, so the mTLS handshake to https://127.0.0.1:2379 fails", he: "חסרים או שגויים --cacert/--cert/--key, אז ה-mTLS handshake מול https://127.0.0.1:2379 נכשל" },
        { en: "You must stop the API server before taking a snapshot", he: "צריך לעצור את ה-API server לפני שלוקחים snapshot" }
      ],
      answer: 2,
      explain: { en: "etcd requires client certs. Copy the paths from /etc/kubernetes/manifests/etcd.yaml (pki/etcd/ca.crt, server.crt, server.key). Snapshots are taken online; nothing needs stopping.", he: "etcd דורש תעודות client. מעתיקים את הנתיבים מ-/etc/kubernetes/manifests/etcd.yaml (הקבצים ca.crt, server.crt ו-server.key בתיקייה pki/etcd). גיבוי snapshot נלקח online; לא צריך לעצור כלום." }
    },
    {
      q: { en: "How long are kubeadm's leaf certificates (apiserver, admin.conf) valid by default?", he: "כמה זמן תקפות כברירת מחדל תעודות ה-leaf של kubeadm (apiserver, admin.conf)?" },
      options: [
        { en: "90 days", he: "90 יום" },
        { en: "1 year", he: "שנה אחת" },
        { en: "10 years", he: "10 שנים" },
        { en: "They never expire", he: "הן לא פגות אף פעם" }
      ],
      answer: 1,
      explain: { en: "Leaf certs: 1 year; the CA: 10 years. kubeadm upgrade apply renews leaf certs, so clusters upgraded yearly rarely hit expiry; others need kubeadm certs renew all.", he: "תעודות leaf: שנה; ה-CA: 10 שנים. kubeadm upgrade apply מחדש את תעודות ה-leaf, אז clusters שמשודרגים כל שנה כמעט לא נתקלים בתפוגה; לאחרים צריך kubeadm certs renew all." }
    }
  ],
  related: ["k8s-architecture", "k8s-day2-upgrades", "k8s-etcd-apf", "k8s-namespaces-rbac", "k8s-troubleshooting-playbook"]
});

// ---------------------------------------------------------------------------
// Linux crash debugging: core dumps, gdb, kernel panics, kdump
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "linux-crash-debugging",
  track: "linux",
  order: 61,
  icon: "💥",
  level: 3,
  minutes: 17,
  title: { en: "Crash Debugging: Core Dumps, gdb, Kernel Oops & kdump", he: "דיבאג של קריסות: core dumps, gdb, kernel oops ו-kdump" },
  tldr: {
    en: "When a process dies from SIGSEGV or SIGABRT, the kernel can write a core dump (where it goes is set by core_pattern, whether it happens by the core rlimit); you open it with gdb and type bt. When the kernel itself dies, kdump boots a spare kernel to save a vmcore that you read with crash.",
    he: "כשתהליך מת מ-SIGSEGV או SIGABRT, ה-kernel יכול לכתוב core dump (לאן – לפי core_pattern, והאם בכלל – לפי ה-rlimit של core); פותחים אותו ב-gdb וכותבים bt. כשה-kernel עצמו מת, kdump מעלה kernel רזרבי ששומר vmcore, וקוראים אותו עם crash."
  },
  analogy: {
    en: "A core dump is the black box of a crashed plane: the exact state of every instrument (memory, registers, threads) at the moment of impact. core_pattern decides which hangar the box is delivered to, the rlimit decides whether the plane carries a box at all, and gdb is the investigator who reads it. kdump is for when the control tower itself (the kernel) collapses: a backup tower that was standing by takes over just long enough to photograph the wreckage.",
    he: "Core dump הוא הקופסה השחורה של מטוס שהתרסק: המצב המדויק של כל מכשיר (זיכרון, registers, threads) ברגע הפגיעה. core_pattern קובע לאיזה hangar הקופסה נשלחת, ה-rlimit קובע אם בכלל יש קופסה במטוס, ו-gdb הוא החוקר שקורא אותה. kdump הוא למקרה שמגדל הפיקוח עצמו (ה-kernel) קורס: מגדל גיבוי שחיכה מוכן נכנס לפעולה בדיוק מספיק זמן כדי לצלם את ההריסות."
  },
  sections: [
    {
      h: { en: "Read the exit code first: 137, 139, 134", he: "קודם קוראים את ה-exit code: הקודים 137, 139 ו-134" },
      body: {
        en: `<p>A process killed by signal N exits with <strong>128 + N</strong>. In Kubernetes this is the first clue in a CrashLoopBackOff (the kubelet backs off restarts 10s, 20s, 40s… capped at 5 minutes):</p>
<table>
<tr><th>Exit code</th><th>Signal</th><th>Usual meaning</th><th>Core dump?</th></tr>
<tr><td>137</td><td>SIGKILL (9)</td><td>OOMKilled, liveness probe kill, or grace period ran out</td><td>Never</td></tr>
<tr><td>139</td><td>SIGSEGV (11)</td><td>Bad memory access: null pointer, use-after-free, stack overflow, native lib/ABI mismatch</td><td>Yes, if enabled</td></tr>
<tr><td>134</td><td>SIGABRT (6)</td><td><code>abort()</code>: failed assert, glibc "double free detected", C++ uncaught exception</td><td>Yes, if enabled</td></tr>
<tr><td>143</td><td>SIGTERM (15)</td><td>Asked to stop (normal shutdown)</td><td>No</td></tr>
<tr><td>1, 2…</td><td>none</td><td>The app chose to exit: read its logs</td><td>No</td></tr>
</table>
<pre>$ kubectl get pod img-resizer-5f7c-9xk2 -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'
{"exitCode":139,"reason":"Error","startedAt":"...","finishedAt":"..."}
$ kubectl logs img-resizer-5f7c-9xk2 --previous | tail -3</pre>
<p>139 with reason <code>Error</code> means the app crashed on its own; 137 with <code>OOMKilled</code> is a memory limit (see <code>#/lesson/k8s-resources</code>). Logs from a segfault usually just stop, so the core dump is where the real answer lives.</p>`,
        he: `<p>תהליך שנהרג מסיגנל N יוצא עם קוד <strong>128 + N</strong>. ב-Kubernetes זה הרמז הראשון ב-CrashLoopBackOff (ה-kubelet מרווח את ה-restarts בהדרגה: 10 שניות, 20, 40… עד תקרה של 5 דקות):</p>
<table>
<tr><th>Exit code</th><th>סיגנל</th><th>משמעות נפוצה</th><th>Core dump?</th></tr>
<tr><td>137</td><td>SIGKILL (9)</td><td>OOMKilled, kill של liveness probe, או שנגמר ה-grace period</td><td>אף פעם</td></tr>
<tr><td>139</td><td>SIGSEGV (11)</td><td>גישה לא חוקית לזיכרון: null pointer, use-after-free, stack overflow, אי-התאמה של ספרייה native או ABI</td><td>כן, אם מופעל</td></tr>
<tr><td>134</td><td>SIGABRT (6)</td><td><code>abort()</code>: assert שנכשל, "double free detected" של glibc, exception של C++ שלא נתפס</td><td>כן, אם מופעל</td></tr>
<tr><td>143</td><td>SIGTERM (15)</td><td>ביקשו ממנו לעצור (כיבוי רגיל)</td><td>לא</td></tr>
<tr><td>1, 2…</td><td>אין</td><td>האפליקציה בחרה לצאת: תקרא את הלוגים</td><td>לא</td></tr>
</table>
<pre>$ kubectl get pod img-resizer-5f7c-9xk2 -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'
{"exitCode":139,"reason":"Error","startedAt":"...","finishedAt":"..."}
$ kubectl logs img-resizer-5f7c-9xk2 --previous | tail -3</pre>
<p>139 עם reason של <code>Error</code> אומר שהאפליקציה קרסה בעצמה; 137 עם <code>OOMKilled</code> זה memory limit (ראה <code>#/lesson/k8s-resources</code>). הלוגים של segfault בדרך כלל פשוט נקטעים, אז התשובה האמיתית נמצאת ב-core dump.</p>`
      }
    },
    {
      h: { en: "Core dumps: core_pattern, ulimit and systemd-coredump", he: "Core dumps: core_pattern, ulimit ו-systemd-coredump" },
      body: {
        en: `<p>Two switches decide whether you get a core:</p>
<ul>
<li><strong>RLIMIT_CORE</strong> — the max core size for this process. Many distros default the soft limit to 0, so nothing is written. Shell: <code>ulimit -c unlimited</code>. systemd service: <code>LimitCORE=infinity</code> in the unit. Docker: <code>--ulimit core=-1</code>.</li>
<li><strong><code>/proc/sys/kernel/core_pattern</code></strong> — where it goes. A path (<code>/var/crash/core.%e.%p.%t</code>: exe name, PID, time) writes a file; a value starting with <code>|</code> pipes the core to a helper program.</li>
</ul>
<pre>$ cat /proc/sys/kernel/core_pattern
|/usr/lib/systemd/systemd-coredump %P %u %g %s %t %c %h      # Fedora/RHEL/Arch/Debian with systemd-coredump
|/usr/share/apport/apport -p%p -s%s -c%c -d%d -P%P -u%u -g%g -- %E   # Ubuntu default (apport)

$ coredumpctl list
TIME                         PID  UID  GID SIG     COREFILE EXE                 SIZE
Thu 2026-11-19 02:14:07 UTC 4121  998  998 SIGSEGV present  /usr/bin/img-resizer 18.2M
$ coredumpctl info 4121        # signal, cmdline, cgroup/unit, and a stack trace already
$ coredumpctl debug 4121       # opens gdb with the binary + core loaded
$ coredumpctl dump 4121 -o /tmp/core.4121   # extract the core to copy elsewhere</pre>
<p>systemd-coredump stores compressed cores in <code>/var/lib/systemd/coredump/</code>, logs metadata to the journal, honors the crashing process's core limit (passed as <code>%c</code>) and has size caps in <code>/etc/systemd/coredump.conf</code> (<code>ProcessSizeMax=</code>, <code>ExternalSizeMax=</code>, <code>MaxUse=</code>).</p>
<blockquote>⚠️ Production tip: a core is roughly the process's resident memory. A 30 GB JVM or database crashing in a loop can fill <code>/var</code> in minutes and take the node down with it. Set <code>MaxUse=</code>, keep cores on a separate volume, and remember cores contain secrets and customer data from memory: treat them like a database dump.</blockquote>`,
        he: `<p>שני מתגים קובעים אם תקבל core:</p>
<ul>
<li><strong>RLIMIT_CORE</strong> – הגודל המקסימלי של core לתהליך הזה. בהרבה הפצות ה-soft limit הוא 0 כברירת מחדל, ואז שום דבר לא נכתב. ב-shell: <code>ulimit -c unlimited</code>. ב-service של systemd: <code>LimitCORE=infinity</code> ב-unit. ב-Docker: <code>--ulimit core=-1</code>.</li>
<li><strong><code>/proc/sys/kernel/core_pattern</code></strong> – לאן הוא הולך. נתיב (<code>/var/crash/core.%e.%p.%t</code>: שם ה-exe, PID וזמן) כותב קובץ; ערך שמתחיל ב-<code>|</code> מעביר את ה-core ב-pipe לתוכנית עזר.</li>
</ul>
<pre>$ cat /proc/sys/kernel/core_pattern
|/usr/lib/systemd/systemd-coredump %P %u %g %s %t %c %h      # Fedora/RHEL/Arch/Debian with systemd-coredump
|/usr/share/apport/apport -p%p -s%s -c%c -d%d -P%P -u%u -g%g -- %E   # Ubuntu default (apport)

$ coredumpctl list
TIME                         PID  UID  GID SIG     COREFILE EXE                 SIZE
Thu 2026-11-19 02:14:07 UTC 4121  998  998 SIGSEGV present  /usr/bin/img-resizer 18.2M
$ coredumpctl info 4121        # signal, cmdline, cgroup/unit, and a stack trace already
$ coredumpctl debug 4121       # opens gdb with the binary + core loaded
$ coredumpctl dump 4121 -o /tmp/core.4121   # extract the core to copy elsewhere</pre>
<p>systemd-coredump שומר cores דחוסים בתיקייה <code>/var/lib/systemd/coredump/</code>, כותב metadata ל-journal, מכבד את ה-core limit של התהליך שקרס (מועבר כ-<code>%c</code>), ויש לו תקרות גודל בקובץ <code>/etc/systemd/coredump.conf</code> (<code>ProcessSizeMax=</code>, <code>ExternalSizeMax=</code>, <code>MaxUse=</code>).</p>
<blockquote>⚠️ טיפ לפרודקשן: core הוא בערך בגודל הזיכרון ה-resident של התהליך. JVM או database של 30 GB שקורס בלולאה יכול למלא את <code>/var</code> תוך דקות ולהפיל איתו את ה-node. תגדיר <code>MaxUse=</code>, תשמור cores על volume נפרד, ותזכור ש-cores מכילים סודות ומידע של לקוחות מהזיכרון: תתייחס אליהם כמו ל-dump של database.</blockquote>`
      }
    },
    {
      h: { en: "gdb in five commands", he: "gdb בחמש פקודות" },
      body: {
        en: `<p>You need the <strong>exact same binary</strong> (and shared libraries) that crashed, plus debug symbols if you want function names and line numbers. On modern distros, <code>debuginfod</code> downloads symbols on demand (<code>DEBUGINFOD_URLS</code> is preset on Fedora and Ubuntu 22.04+).</p>
<pre>$ gdb /usr/bin/img-resizer /tmp/core.4121
Program terminated with signal SIGSEGV, Segmentation fault.
#0  0x00007f3a1c2b4e10 in png_read_row () from /lib/x86_64-linux-gnu/libpng16.so.16
(gdb) bt                         # backtrace of the crashing thread
#0  png_read_row (...) at pngread.c:512
#1  0x000055d4... in decode_image (buf=0x0, len=0) at src/decode.c:88
#2  0x000055d4... in handle_request (req=0x7f39f8001200) at src/server.c:214
(gdb) frame 1                    # jump into our code
(gdb) info locals                # buf = 0x0 -> null pointer passed in
(gdb) info threads               # every thread and where it stopped
(gdb) thread apply all bt        # all stacks: essential for deadlocks and races</pre>
<p>Read from the top down to the <strong>first frame in your code</strong>: frame #0 is often inside libc or a library that was handed garbage. <code>?? ()</code> frames mean missing symbols or a mismatched binary.</p>
<blockquote>💡 Real world: managed runtimes need a nudge. Go only dumps core with <code>GOTRACEBACK=crash</code>; the JVM writes <code>hs_err_pid&lt;pid&gt;.log</code> first (often enough) and a core only if limits allow; Python segfaults in C extensions are best caught with <code>python -X faulthandler</code>, which prints the Python stack on SIGSEGV.</blockquote>`,
        he: `<p>צריך את <strong>אותו binary בדיוק</strong> שקרס (ואת ה-shared libraries), ועוד debug symbols אם אתה רוצה שמות פונקציות ומספרי שורות. בהפצות מודרניות <code>debuginfod</code> מוריד symbols לפי דרישה (<code>DEBUGINFOD_URLS</code> מוגדר מראש ב-Fedora וב-Ubuntu מגרסה 22.04).</p>
<pre>$ gdb /usr/bin/img-resizer /tmp/core.4121
Program terminated with signal SIGSEGV, Segmentation fault.
#0  0x00007f3a1c2b4e10 in png_read_row () from /lib/x86_64-linux-gnu/libpng16.so.16
(gdb) bt                         # backtrace of the crashing thread
#0  png_read_row (...) at pngread.c:512
#1  0x000055d4... in decode_image (buf=0x0, len=0) at src/decode.c:88
#2  0x000055d4... in handle_request (req=0x7f39f8001200) at src/server.c:214
(gdb) frame 1                    # jump into our code
(gdb) info locals                # buf = 0x0 -> null pointer passed in
(gdb) info threads               # every thread and where it stopped
(gdb) thread apply all bt        # all stacks: essential for deadlocks and races</pre>
<p>קוראים מלמעלה למטה עד ה-<strong>frame הראשון שבקוד שלך</strong>: frame #0 הרבה פעמים נמצא בתוך libc או ספרייה שקיבלה זבל. frames של <code>?? ()</code> אומרים שחסרים symbols או שה-binary לא תואם.</p>
<blockquote>💡 מהשטח: runtimes מנוהלים צריכים דחיפה. Go כותב core רק עם <code>GOTRACEBACK=crash</code>; ה-JVM כותב קודם קובץ <code>hs_err_pid&lt;pid&gt;.log</code> (הרבה פעמים זה מספיק) ו-core רק אם ה-limits מאפשרים; ב-Python, segfault בתוך C extension הכי קל לתפוס עם <code>python -X faulthandler</code>, שמדפיס את ה-stack של Python כשמגיע SIGSEGV.</blockquote>`
      }
    },
    {
      h: { en: "Core dumps from containers: core_pattern is host-wide", he: "Core dumps מקונטיינרים: core_pattern הוא של כל ה-host" },
      body: {
        en: `<p><code>core_pattern</code> is <strong>not namespaced</strong>: one value for the whole node, and you can't change it from inside an unprivileged container. What happens depends on its form:</p>
<ul>
<li><strong>Pipe (<code>|helper</code>)</strong>: the helper runs on the <em>host</em>, in the host's namespaces. The core lands in the node's <code>coredumpctl</code> (or apport's <code>/var/crash</code>), not in the container. Run <code>coredumpctl list</code> on the node.</li>
<li><strong>Plain path</strong> (<code>/cores/core.%e.%p</code>): resolved inside the <em>crashing process's</em> mount namespace. The directory must exist in the container, so mount a volume at that path (hostPath or PVC) or the core is lost with the container.</li>
</ul>
<p>The rlimit is set by the runtime, not by Kubernetes (there is no <code>ulimits</code> field in the Pod spec). It comes from containerd/CRI-O defaults or the systemd unit of the runtime (<code>LimitCORE=</code>). Platform teams typically set core_pattern via a privileged DaemonSet or the node image, plus a hostPath for cores.</p>
<pre># privileged DaemonSet init step (node-wide!)
sysctl -w kernel.core_pattern=/var/cores/core.%e.%p.%h.%t
# app Pod
volumeMounts: [{ name: cores, mountPath: /var/cores }]
volumes:      [{ name: cores, hostPath: { path: /var/cores, type: DirectoryOrCreate } }]</pre>
<blockquote>⚠️ Production tip: <code>%h</code> inside a container is the Pod's hostname and <code>%p</code> is the PID as seen from the initial namespace, which is why including <code>%h</code> makes cores traceable to a Pod. On managed nodes (GKE COS, Bottlerocket, EKS AL2023) check the vendor's default before changing a node-wide sysctl.</blockquote>`,
        he: `<p><code>core_pattern</code> הוא <strong>לא namespaced</strong>: ערך אחד לכל ה-node, ואי אפשר לשנות אותו מתוך קונטיינר שאינו privileged. מה שקורה תלוי בצורה שלו:</p>
<ul>
<li><strong>Pipe (<code>|helper</code>)</strong>: תוכנית העזר רצה על ה-<em>host</em>, ב-namespaces של ה-host. ה-core נוחת ב-<code>coredumpctl</code> של ה-node (או ב-<code>/var/crash</code> של apport), לא בתוך הקונטיינר. מריצים <code>coredumpctl list</code> על ה-node.</li>
<li><strong>נתיב רגיל</strong> (<code>/cores/core.%e.%p</code>): מתפרש בתוך ה-mount namespace של <em>התהליך שקרס</em>. התיקייה חייבת להיות קיימת בקונטיינר, אז תעשה mount ל-volume בנתיב הזה (hostPath או PVC), אחרת ה-core נעלם יחד עם הקונטיינר.</li>
</ul>
<p>ה-rlimit נקבע על ידי ה-runtime ולא על ידי Kubernetes (אין שדה <code>ulimits</code> ב-Pod spec). הוא מגיע מברירות המחדל של containerd או CRI-O, או מה-unit של systemd שמריץ את ה-runtime (<code>LimitCORE=</code>). צוותי פלטפורמה בדרך כלל קובעים את core_pattern דרך DaemonSet עם הרשאות privileged או דרך ה-image של ה-node, ומוסיפים hostPath ל-cores.</p>
<pre># privileged DaemonSet init step (node-wide!)
sysctl -w kernel.core_pattern=/var/cores/core.%e.%p.%h.%t
# app Pod
volumeMounts: [{ name: cores, mountPath: /var/cores }]
volumes:      [{ name: cores, hostPath: { path: /var/cores, type: DirectoryOrCreate } }]</pre>
<blockquote>⚠️ טיפ לפרודקשן: בתוך קונטיינר <code>%h</code> הוא ה-hostname של ה-Pod ו-<code>%p</code> הוא ה-PID כפי שה-namespace הראשי רואה אותו, ולכן הוספה של <code>%h</code> מאפשרת לקשר core ל-Pod. על nodes מנוהלים (GKE COS, Bottlerocket, EKS AL2023) תבדוק מה ברירת המחדל של הספק לפני שאתה משנה sysctl ברמת ה-node.</blockquote>`
      }
    },
    {
      h: { en: "When the kernel crashes: oops, panic and kdump", he: "כשה-kernel קורס: oops, panic ו-kdump" },
      body: {
        en: `<p>An <strong>oops</strong> is the kernel catching its own bug (bad pointer in a driver, for example): it prints a report to <code>dmesg</code>, kills the task that was running, marks itself <em>tainted</em> and keeps going — often limping. A <strong>panic</strong> is unrecoverable: the kernel stops. With <code>kernel.panic_on_oops=1</code> every oops becomes a panic (safer for fleets: reboot clean instead of running half-broken).</p>
<pre>BUG: kernel NULL pointer dereference, address: 0000000000000008
Oops: 0000 [#1] PREEMPT SMP NOPTI
CPU: 3 PID: 2211 Comm: kworker/3:1 Tainted: G           OE      6.8.0-45-generic
RIP: 0010:mydrv_poll+0x1a/0x80 [mydrv]        &lt;- function+offset/size [module]
Call Trace:
 &lt;TASK&gt;
 net_rx_action+0x145/0x3a0
 __do_softirq+0xd8/0x2e5
 ...</pre>
<p>Read it like a backtrace: <code>RIP</code> is where it died, <code>[mydrv]</code> names the module, <code>Tainted: OE</code> means an out-of-tree (O), unsigned (E) module is loaded — the first suspect. <code>Comm</code>/<code>PID</code> is just whoever was on the CPU.</p>
<p><strong>kdump</strong> captures a full memory image when the box panics. At boot, <code>crashkernel=256M</code> on the kernel cmdline reserves memory; <code>kexec</code> preloads a second "capture" kernel there. On panic, the capture kernel boots, and <code>makedumpfile</code> saves <code>/proc/vmcore</code> to <code>/var/crash/</code>, then reboots.</p>
<pre>kdumpctl status                     # RHEL/Fedora   (Ubuntu: kdump-config show)
sysctl kernel.panic=10              # auto-reboot 10s after a panic instead of hanging
echo c &gt; /proc/sysrq-trigger         # LAB ONLY: crash the kernel on purpose to test kdump
crash /usr/lib/debug/lib/modules/$(uname -r)/vmlinux /var/crash/*/vmcore
crash&gt; log      # dmesg at the moment of death
crash&gt; bt       # stack of the panicking task
crash&gt; ps       # what was running</pre>
<blockquote>💡 Real world: on cloud VMs you often have no screen. Read the last kernel messages from the serial console (<code>aws ec2 get-console-output --latest</code>, the Azure/GCP serial console) and <code>journalctl -k -b -1</code> after reboot, if the journal is persistent. Boot-time panics are covered in <code>#/lesson/linux-boot-rescue</code>.</blockquote>`,
        he: `<p><strong>Oops</strong> הוא מצב שבו ה-kernel תופס באג של עצמו (למשל pointer שגוי ב-driver): הוא מדפיס דוח ל-<code>dmesg</code>, הורג את ה-task שרץ באותו רגע, מסמן את עצמו כ-<em>tainted</em> וממשיך – הרבה פעמים צולע. <strong>Panic</strong> הוא מצב שאין ממנו חזרה: ה-kernel עוצר. עם <code>kernel.panic_on_oops=1</code> כל oops הופך ל-panic (בטוח יותר לצי של מכונות: reboot נקי עדיף על לרוץ חצי שבור).</p>
<pre>BUG: kernel NULL pointer dereference, address: 0000000000000008
Oops: 0000 [#1] PREEMPT SMP NOPTI
CPU: 3 PID: 2211 Comm: kworker/3:1 Tainted: G           OE      6.8.0-45-generic
RIP: 0010:mydrv_poll+0x1a/0x80 [mydrv]        &lt;- function+offset/size [module]
Call Trace:
 &lt;TASK&gt;
 net_rx_action+0x145/0x3a0
 __do_softirq+0xd8/0x2e5
 ...</pre>
<p>קוראים את זה כמו backtrace: <code>RIP</code> זה המקום שבו הוא מת, <code>[mydrv]</code> הוא שם ה-module, ו-<code>Tainted: OE</code> אומר שטעון module חיצוני לעץ (O) ולא חתום (E) – החשוד הראשון. <code>Comm</code> ו-<code>PID</code> הם סתם מי שהיה על ה-CPU באותו רגע.</p>
<p><strong>kdump</strong> שומר תמונה מלאה של הזיכרון כשהמכונה עושה panic. ב-boot, <code>crashkernel=256M</code> ב-cmdline של ה-kernel שומר זיכרון; <code>kexec</code> טוען מראש לשם kernel שני של "capture". ברגע ה-panic ה-kernel הזה עולה, ו-<code>makedumpfile</code> שומר את <code>/proc/vmcore</code> לתיקייה <code>/var/crash/</code>, ואז המכונה עושה reboot.</p>
<pre>kdumpctl status                     # RHEL/Fedora   (Ubuntu: kdump-config show)
sysctl kernel.panic=10              # auto-reboot 10s after a panic instead of hanging
echo c &gt; /proc/sysrq-trigger         # LAB ONLY: crash the kernel on purpose to test kdump
crash /usr/lib/debug/lib/modules/$(uname -r)/vmlinux /var/crash/*/vmcore
crash&gt; log      # dmesg at the moment of death
crash&gt; bt       # stack of the panicking task
crash&gt; ps       # what was running</pre>
<blockquote>💡 מהשטח: על VM-ים בענן הרבה פעמים אין מסך. קוראים את הודעות ה-kernel האחרונות מה-serial console (<code>aws ec2 get-console-output --latest</code>, או ה-serial console של Azure ו-GCP), ואחרי ה-reboot מריצים <code>journalctl -k -b -1</code> אם ה-journal נשמר לדיסק. panics בזמן boot מכוסים בשיעור <code>#/lesson/linux-boot-rescue</code>.</blockquote>`
      }
    }
  ],
  diagram: `process gets SIGSEGV/SIGABRT
      |
      +-- RLIMIT_CORE == 0 ? --> no core (exit 139/134 only)
      |
      v
 /proc/sys/kernel/core_pattern   (ONE value per host, not namespaced)
      |-- "/path/core.%e.%p"  -> file in the CRASHING process's mount ns (container!)
      '-- "|helper ..."       -> helper runs on the HOST
                                   systemd-coredump -> /var/lib/systemd/coredump + journal
                                   coredumpctl list / info / debug  -> gdb: bt, thread apply all bt

kernel bug -> oops (task killed, kernel tainted, continues)
           -> panic (panic_on_oops=1 or fatal)
                -> kdump: kexec capture kernel (crashkernel=256M) -> /var/crash/vmcore -> crash`,
  handsOn: [
    { cmd: "cat /proc/sys/kernel/core_pattern; ulimit -c", what: { en: "Where cores would go on this box, and whether your shell would write one at all (0 = no).", he: "לאן יגיעו cores במכונה הזו, והאם ה-shell שלך בכלל יכתוב אחד (0 = לא)." } },
    { cmd: "ulimit -c unlimited; sleep 300 & kill -SEGV $!; sleep 1; coredumpctl list --since -5min", what: { en: "Produce a harmless core from sleep and see it captured (on a host with systemd-coredump).", he: "לייצר core לא מזיק מ-sleep ולראות שהוא נתפס (על host עם systemd-coredump)." } },
    { cmd: "coredumpctl info -1; coredumpctl debug -1", what: { en: "Show metadata and an automatic stack for the most recent crash, then open it in gdb (try bt and thread apply all bt).", he: "להציג metadata ו-stack אוטומטי לקריסה האחרונה, ואז לפתוח אותה ב-gdb (נסה bt ו-thread apply all bt)." } },
    { cmd: "dmesg -T --level=err,warn | grep -iE 'segfault|oops|BUG:|tainted' ; cat /proc/sys/kernel/tainted", what: { en: "Userspace segfault lines and kernel oops reports, plus the taint bitmask (0 = clean).", he: "שורות segfault של תהליכים ודוחות oops של ה-kernel, וגם ה-bitmask של taint (0 = נקי)." } },
    { cmd: "kubectl get pods -A -o json | jq -r '.items[] | .metadata.name as $n | .status.containerStatuses[]? | select(.lastState.terminated.exitCode==139) | $n'", what: { en: "Find every Pod whose last crash was a segfault (exit 139).", he: "למצוא כל Pod שהקריסה האחרונה שלו הייתה segfault (exit 139)." } }
  ],
  mnemonic: {
    en: "\"Limit, Pattern, Backtrace\": the rlimit says IF, core_pattern says WHERE, gdb bt says WHY. And 137 is killed from outside, 139 is suicide by bad pointer.",
    he: "\"Limit, Pattern, Backtrace\": ה-rlimit אומר אם, ה-core_pattern אומר לאן, ו-bt ב-gdb אומר למה. ו-137 זה נהרג מבחוץ, 139 זה התאבדות עם pointer רע."
  },
  pitfalls: [
    { en: "Setting ulimit -c unlimited in your shell and expecting a systemd service to dump core: services get their limit from LimitCORE= in the unit (or DefaultLimitCORE=), not from your shell.", he: "להגדיר ulimit -c unlimited ב-shell שלך ולצפות ש-service של systemd יכתוב core: ה-services מקבלים את ה-limit מ-LimitCORE= ב-unit (או מ-DefaultLimitCORE=), לא מה-shell שלך." },
    { en: "Analyzing a core with a different build of the binary (new image tag, rebuilt without symbols): gdb shows ?? frames or, worse, a plausible but wrong stack. Keep debug symbols per release.", he: "לנתח core עם build אחר של ה-binary (תגית image חדשה, build מחדש בלי symbols): gdb מציג frames של ?? או, גרוע יותר, stack שנראה הגיוני אבל שגוי. תשמור debug symbols לכל release." },
    { en: "Looking for a container's core inside the container when core_pattern is a pipe: the helper ran on the host, so the core is in the node's coredumpctl or /var/crash.", he: "לחפש את ה-core של קונטיינר בתוך הקונטיינר כש-core_pattern הוא pipe: תוכנית העזר רצה על ה-host, אז ה-core נמצא ב-coredumpctl של ה-node או בתיקייה /var/crash." },
    { en: "Enabling unlimited cores fleet-wide without MaxUse= or a separate volume: a crash loop of a large process fills /var and turns one bug into a node outage.", he: "להפעיל cores בלי הגבלה על כל הצי בלי MaxUse= או volume נפרד: לולאת קריסות של תהליך גדול ממלאת את /var והופכת באג אחד להשבתה של node." }
  ],
  interview: [
    {
      q: { en: "A Pod is in CrashLoopBackOff with exit code 139 and the logs just stop. How do you find the cause?", he: "Pod נמצא ב-CrashLoopBackOff עם exit code 139 והלוגים פשוט נקטעים. איך אתה מוצא את הסיבה?" },
      a: { en: "139 = 128 + SIGSEGV, so the process crashed on a bad memory access, not OOM. Check kubectl logs --previous and recent changes (new image, new native lib, base image switch from glibc to musl). To get a core: see core_pattern on the node; if it pipes to systemd-coredump, run coredumpctl list on that node; otherwise mount a volume at the core path and make sure the runtime's core rlimit is not 0. Open the core with gdb using the exact same binary and symbols, run bt and thread apply all bt, and find the first frame in our code. For Go set GOTRACEBACK=crash; for Python use faulthandler.", he: "139 = 128 + SIGSEGV, כלומר התהליך קרס על גישה לא חוקית לזיכרון, לא OOM. בודקים kubectl logs --previous ושינויים אחרונים (image חדש, ספרייה native חדשה, מעבר של base image מ-glibc ל-musl). כדי להשיג core: בודקים את core_pattern על ה-node; אם הוא pipe ל-systemd-coredump, מריצים coredumpctl list על אותו node; אחרת עושים mount ל-volume בנתיב של ה-core ומוודאים שה-core rlimit של ה-runtime הוא לא 0. פותחים את ה-core ב-gdb עם אותו binary ואותם symbols בדיוק, מריצים bt ו-thread apply all bt, ומחפשים את ה-frame הראשון שבקוד שלנו. ב-Go מגדירים GOTRACEBACK=crash; ב-Python משתמשים ב-faulthandler." }
    },
    {
      q: { en: "What's the difference between a kernel oops and a kernel panic, and how do you get evidence from a panic on a cloud VM?", he: "מה ההבדל בין kernel oops ל-kernel panic, ואיך משיגים ראיות מ-panic על VM בענן?" },
      a: { en: "An oops is a detected kernel bug: the kernel prints a report, kills the current task, marks itself tainted and continues, possibly in a broken state. A panic halts the kernel; panic_on_oops=1 converts every oops into a panic. For evidence: the serial console output (aws ec2 get-console-output), journalctl -k -b -1 if the journal is persistent, and kdump: crashkernel= reserves memory, kexec preloads a capture kernel, which saves /proc/vmcore to /var/crash so you can analyze it with crash (log, bt, ps). Set kernel.panic=10 so the VM reboots itself.", he: "Oops הוא באג של ה-kernel שזוהה: ה-kernel מדפיס דוח, הורג את ה-task הנוכחי, מסמן את עצמו tainted וממשיך, אולי במצב שבור. Panic עוצר את ה-kernel; panic_on_oops=1 הופך כל oops ל-panic. לראיות: הפלט של ה-serial console (aws ec2 get-console-output), journalctl -k -b -1 אם ה-journal נשמר לדיסק, ו-kdump: crashkernel= שומר זיכרון, kexec טוען מראש kernel של capture, והוא שומר את /proc/vmcore לתיקייה /var/crash כדי שתנתח אותו עם crash (log, bt, ps). מגדירים kernel.panic=10 כדי שה-VM יעשה reboot לבד." }
    }
  ],
  quiz: [
    {
      q: { en: "A container exits with code 139. What happened?", he: "קונטיינר יוצא עם קוד 139. מה קרה?" },
      options: [
        { en: "It exceeded its memory limit and was OOMKilled", he: "הוא חרג מה-memory limit וקיבל OOMKill" },
        { en: "It received SIGSEGV: an invalid memory access", he: "הוא קיבל SIGSEGV: גישה לא חוקית לזיכרון" },
        { en: "Its liveness probe failed", he: "ה-liveness probe שלו נכשל" },
        { en: "It was asked to stop with SIGTERM", he: "ביקשו ממנו לעצור עם SIGTERM" }
      ],
      answer: 1,
      explain: { en: "128 + 11 (SIGSEGV) = 139. OOMKill and liveness kills are SIGKILL = 137; SIGTERM is 143.", he: "128 + 11 (SIGSEGV) = 139. לעומת זאת, OOMKill ו-kill של liveness הם SIGKILL, כלומר 137; SIGTERM הוא 143." }
    },
    {
      q: { en: "core_pattern on the node is |/usr/lib/systemd/systemd-coredump ... and an app in a container segfaults. Where is the core?", he: "ה-core_pattern על ה-node מעביר את ה-core ב-pipe ל-<code>/usr/lib/systemd/systemd-coredump</code>, ואפליקציה בקונטיינר עושה segfault. איפה ה-core?" },
      options: [
        { en: "In the container's working directory", he: "בתיקיית העבודה של הקונטיינר" },
        { en: "Nowhere: containers can never produce cores", he: "בשום מקום: קונטיינרים אף פעם לא מייצרים cores" },
        { en: "On the host, managed by systemd-coredump (coredumpctl list on the node), if the rlimit allowed it", he: "על ה-host, בניהול של systemd-coredump (coredumpctl list על ה-node), אם ה-rlimit איפשר" },
        { en: "In the Pod's emptyDir volume", he: "ב-volume מסוג emptyDir של ה-Pod" }
      ],
      answer: 2,
      explain: { en: "core_pattern is host-wide, and a pipe helper runs in the host's namespaces, so the core is stored on the node. Only a plain path is resolved inside the container's filesystem.", he: "core_pattern הוא של כל ה-host, ותוכנית עזר של pipe רצה ב-namespaces של ה-host, אז ה-core נשמר על ה-node. רק נתיב רגיל מתפרש בתוך ה-filesystem של הקונטיינר." }
    },
    {
      q: { en: "In gdb on a multi-threaded server that hung and was killed with SIGABRT, which command shows every thread's stack?", he: "ב-gdb, על שרת multi-threaded שנתקע ונהרג עם SIGABRT, איזו פקודה מציגה את ה-stack של כל ה-threads?" },
      options: [
        { en: "bt", he: "bt" },
        { en: "info registers", he: "info registers" },
        { en: "thread apply all bt", he: "thread apply all bt" },
        { en: "list", he: "list" }
      ],
      answer: 2,
      explain: { en: "bt shows only the current thread. For hangs and deadlocks you need all stacks to see who holds which lock: thread apply all bt.", he: "bt מציג רק את ה-thread הנוכחי. בתקיעות וב-deadlocks צריך את כל ה-stacks כדי לראות מי מחזיק איזה lock, כלומר thread apply all bt." }
    },
    {
      q: { en: "What does kdump need configured BEFORE the crash to capture a vmcore?", he: "מה kdump צריך שיהיה מוגדר לפני הקריסה כדי לשמור vmcore?" },
      options: [
        { en: "Memory reserved with crashkernel= on the kernel cmdline and a capture kernel preloaded with kexec", he: "זיכרון ששמור עם crashkernel= ב-cmdline של ה-kernel ו-kernel של capture שנטען מראש עם kexec" },
        { en: "ulimit -c unlimited for root", he: "ulimit -c unlimited ל-root" },
        { en: "systemd-coredump installed", he: "systemd-coredump מותקן" },
        { en: "Nothing: the panic message always contains the full memory", he: "כלום: הודעת ה-panic תמיד מכילה את כל הזיכרון" }
      ],
      answer: 0,
      explain: { en: "A dying kernel can't safely write to disk, so kdump boots a second kernel in memory reserved at boot (crashkernel=), which saves /proc/vmcore. ulimit and systemd-coredump are for userspace cores.", he: "Kernel שמת לא יכול לכתוב לדיסק בבטחה, אז kdump מעלה kernel שני בזיכרון ששמור מה-boot (crashkernel=), והוא שומר את /proc/vmcore. ulimit ו-systemd-coredump שייכים ל-cores של תהליכים." }
    }
  ],
  related: ["linux-processes", "linux-systemd-logs", "linux-boot-rescue", "linux-memory-leaks", "k8s-resources", "k8s-debugging"]
});

INFRA.glossary.push(
  { term: "Static Pod", track: "kubernetes", aliases: ["static pods", "mirror Pod"], def: { en: "A Pod the kubelet runs straight from a manifest file in its staticPodPath (kubeadm: /etc/kubernetes/manifests), without the API server or scheduler; the API only shows a read-only mirror.", he: "Pod שה-kubelet מריץ ישירות מקובץ manifest בתיקיית ה-staticPodPath (ב-kubeadm: /etc/kubernetes/manifests), בלי API server ובלי scheduler; ב-API רואים רק mirror לקריאה בלבד." }, lesson: "k8s-cluster-lifecycle-kubeadm" },
  { term: "kubeadm", track: "kubernetes", def: { en: "The upstream tool that bootstraps and upgrades a Kubernetes cluster: init, join, upgrade, certs renew, token create.", he: "הכלי הרשמי שמקים ומשדרג cluster של Kubernetes: init, join, upgrade, certs renew, token create." }, lesson: "k8s-cluster-lifecycle-kubeadm" },
  { term: "etcd snapshot", track: "kubernetes", aliases: ["etcdctl snapshot"], def: { en: "A point-in-time copy of the whole etcd keyspace (etcdctl snapshot save); restoring it with etcdutl creates a new data dir and rolls the cluster state back.", he: "עותק של כל ה-keyspace של etcd בנקודת זמן (etcdctl snapshot save); שחזור עם etcdutl יוצר data dir חדש ומחזיר את ה-state של ה-cluster אחורה." }, lesson: "k8s-cluster-lifecycle-kubeadm" },
  { term: "CertificateSigningRequest", track: "kubernetes", aliases: ["CSR API", "kubectl certificate approve"], def: { en: "A Kubernetes object asking a signer (for example kubernetes.io/kube-apiserver-client) to issue a certificate; once approved, the signed cert appears in status.certificate.", he: "אובייקט ב-Kubernetes שמבקש מ-signer (למשל kubernetes.io/kube-apiserver-client) להנפיק תעודה; אחרי אישור, התעודה החתומה מופיעה ב-status.certificate." }, lesson: "k8s-cluster-lifecycle-kubeadm" },
  { term: "Kubelet certificate rotation", track: "kubernetes", aliases: ["rotateCertificates", "serverTLSBootstrap"], def: { en: "The kubelet renewing its own client (and optionally serving) certificate through CSRs before expiry; client CSRs are auto-approved, kubelet-serving CSRs are not.", he: "ה-kubelet מחדש בעצמו את תעודת ה-client שלו (ואופציונלית גם את תעודת ה-serving) דרך CSR-ים לפני התפוגה; בקשות ה-client מאושרות אוטומטית, בקשות kubelet-serving לא." }, lesson: "k8s-cluster-lifecycle-kubeadm" },
  { term: "Core dump", track: "linux", aliases: ["core file", "coredump"], def: { en: "A file with a crashed process's memory, registers and threads at the moment of death, written by the kernel on signals like SIGSEGV and SIGABRT; opened with gdb.", he: "קובץ עם הזיכרון, ה-registers וה-threads של תהליך שקרס ברגע המוות, שה-kernel כותב בסיגנלים כמו SIGSEGV ו-SIGABRT; פותחים אותו ב-gdb." }, lesson: "linux-crash-debugging" },
  { term: "core_pattern", track: "linux", def: { en: "The host-wide sysctl /proc/sys/kernel/core_pattern: a file path template (%e, %p, %t) or a |pipe to a helper such as systemd-coredump or apport. Not namespaced.", he: "ה-sysctl /proc/sys/kernel/core_pattern ברמת ה-host: תבנית נתיב לקובץ (%e, %p, %t) או pipe לתוכנית עזר כמו systemd-coredump או apport. הוא לא namespaced." }, lesson: "linux-crash-debugging" },
  { term: "systemd-coredump", track: "linux", aliases: ["coredumpctl"], def: { en: "systemd's core dump handler: stores compressed cores in /var/lib/systemd/coredump, logs them to the journal, and coredumpctl lists, inspects and opens them in gdb.", he: "ה-handler של systemd ל-core dumps: שומר cores דחוסים ב-/var/lib/systemd/coredump, רושם אותם ב-journal, ו-coredumpctl מציג אותם, מפרט עליהם ופותח אותם ב-gdb." }, lesson: "linux-crash-debugging" },
  { term: "Kernel oops", track: "linux", aliases: ["oops", "tainted kernel"], def: { en: "A kernel-detected bug report in dmesg (RIP, module, Call Trace): the offending task is killed and the kernel is marked tainted but keeps running, unless panic_on_oops=1.", he: "דוח באג שה-kernel זיהה ב-dmesg (RIP, module, Call Trace): ה-task הבעייתי נהרג וה-kernel מסומן tainted אבל ממשיך לרוץ, אלא אם panic_on_oops=1." }, lesson: "linux-crash-debugging" },
  { term: "kdump", track: "linux", aliases: ["vmcore", "crashkernel"], def: { en: "Kernel crash dumping: memory reserved with crashkernel= holds a capture kernel loaded by kexec, which boots on panic and saves /proc/vmcore for analysis with the crash tool.", he: "שמירת dump של קריסת kernel: זיכרון ששמור עם crashkernel= מחזיק kernel של capture שנטען עם kexec, והוא עולה ב-panic ושומר את /proc/vmcore לניתוח עם הכלי crash." }, lesson: "linux-crash-debugging" },
  { term: "Backtrace", track: "linux", aliases: ["stack trace", "thread apply all bt"], def: { en: "The chain of function calls (frames) leading to the current point; in gdb, bt for one thread and thread apply all bt for all of them.", he: "שרשרת קריאות הפונקציות (frames) שהובילה לנקודה הנוכחית; ב-gdb הפקודה bt מציגה thread אחד, ו-thread apply all bt מציגה את כולם." }, lesson: "linux-crash-debugging" }
);

// --- w2.js (syllabus gap) ---
INFRA.lessons.push({
  id: "cloud-migration-strategy",
  track: "cloud",
  order: 60,
  icon: "🧳",
  level: 2,
  minutes: 14,
  title: { en: "Cloud Migration Strategy: the 7 Rs, Waves, Data and Cutover", he: "אסטרטגיית מיגרציה לענן: 7 ה-Rs, גלים, data ו-cutover" },
  tldr: {
    en: "A cloud migration is a portfolio decision, not a copy job: discover what you have and what talks to what, pick one of the 7 Rs per application, move it in waves, do the bandwidth math before you promise a date, replicate continuously (MGN for servers, DMS with CDC for databases) so cutover is minutes, and rehearse the rollback.",
    he: "מיגרציה לענן היא החלטת פורטפוליו, לא העתקה: ממפים מה יש ומי מדבר עם מי, בוחרים אחד מ-7 ה-Rs לכל אפליקציה, מעבירים בגלים, עושים את חשבון ה-bandwidth לפני שמבטיחים תאריך, משכפלים ברציפות (MGN לשרתים, DMS עם CDC לבסיסי נתונים) כדי שה-cutover ייקח דקות, ומתרגלים את ה-rollback."
  },
  analogy: {
    en: "Moving a whole company to a new building. Some furniture you throw away (retire), some stays in the old office for now (retain), most goes on the truck as-is (rehost), a few things you replace with new ones bought on site (repurchase), and the kitchen you redesign (refactor). You don't move all departments the same night: you move floor by floor, keep the old office's phones forwarding until everyone is in, and you know exactly how to move back if the new elevators fail.",
    he: "להעביר חברה שלמה לבניין חדש. חלק מהרהיטים זורקים (retire), חלק נשאר בינתיים במשרד הישן (retain), רוב הדברים עולים למשאית כמו שהם (rehost), כמה דברים מחליפים בחדשים שקונים במקום (repurchase), ואת המטבח מתכננים מחדש (refactor). לא מעבירים את כל המחלקות באותו לילה: עוברים קומה אחרי קומה, משאירים הפניית טלפונים מהמשרד הישן עד שכולם בפנים, ויודעים בדיוק איך חוזרים אם המעליות בבניין החדש נתקעות."
  },
  sections: [
    {
      h: { en: "The 7 Rs and when to pick each", he: "7 ה-Rs ומתי לבחור כל אחד" },
      body: {
        en: `<table>
<tr><th>R</th><th>What it means</th><th>Pick it when</th><th>Example</th></tr>
<tr><td><strong>Retire</strong></td><td>Turn it off</td><td>Discovery shows no traffic or a duplicate system; typically 10-20% of a legacy portfolio</td><td>An old reporting server nobody has logged into for a year</td></tr>
<tr><td><strong>Retain</strong></td><td>Leave it on-prem for now</td><td>Recent hardware refresh, mainframe, latency to a factory floor, regulation, or simply not worth it yet</td><td>A PBX or a plant-floor SCADA system</td></tr>
<tr><td><strong>Rehost</strong> (lift and shift)</td><td>Same OS and app, now on EC2</td><td>Datacenter exit deadline; you need speed, not elegance</td><td>200 Windows/Linux VMs moved with MGN in 3 months</td></tr>
<tr><td><strong>Relocate</strong></td><td>Move the hypervisor platform as-is</td><td>Large VMware estate, you want zero changes to VMs</td><td>vSphere clusters to VMware Cloud on AWS or Amazon EVS</td></tr>
<tr><td><strong>Repurchase</strong></td><td>Replace with SaaS</td><td>A commodity function you don't differentiate on</td><td>Self-hosted Exchange to Microsoft 365, on-prem CRM to Salesforce</td></tr>
<tr><td><strong>Replatform</strong> (lift, tinker and shift)</td><td>Small changes to use managed services</td><td>Quick wins without a rewrite</td><td>Self-managed MySQL on a VM to Amazon RDS; Tomcat to Elastic Beanstalk or containers</td></tr>
<tr><td><strong>Refactor</strong> (re-architect)</td><td>Redesign cloud-native</td><td>The business needs scale, agility or features the old design can't give</td><td>A monolith split into services on EKS/Lambda with DynamoDB</td></tr>
</table>
<p>Rule of thumb: <strong>rehost first, optimize later</strong> for most of the estate, and spend refactor effort only on the 10-20% of apps that actually drive the business. Rehosted VMs are still worth rightsizing right after the move: on-prem sizing is usually 2-4x too big.</p>
<blockquote>💡 Real world: AWS's prescriptive guidance lists exactly these 7 strategies. Interviewers love "which R for this app?" questions: a 15-year-old COTS app with a vendor license tied to a MAC address is <em>retain</em> or <em>rehost</em>, never <em>refactor</em>.</blockquote>`,
        he: `<table>
<tr><th>R</th><th>מה זה אומר</th><th>מתי לבחור</th><th>דוגמה</th></tr>
<tr><td><strong>Retire</strong></td><td>מכבים</td><td>ה-discovery מראה שאין תעבורה או שזו מערכת כפולה; בדרך כלל 10-20% מפורטפוליו ישן</td><td>שרת דוחות ישן שאף אחד לא נכנס אליו שנה</td></tr>
<tr><td><strong>Retain</strong></td><td>נשאר בינתיים on-prem</td><td>חומרה שהוחלפה לאחרונה, mainframe, latency לרצפת מפעל, רגולציה, או שפשוט עוד לא שווה את זה</td><td>מרכזיית טלפון או מערכת SCADA במפעל</td></tr>
<tr><td><strong>Rehost</strong><br>lift and shift</td><td>אותו OS ואותה אפליקציה, עכשיו על EC2</td><td>יש דדליין ליציאה מה-datacenter; צריך מהירות, לא אלגנטיות</td><td>200 VM-ים של Windows ו-Linux שעוברים עם MGN בשלושה חודשים</td></tr>
<tr><td><strong>Relocate</strong></td><td>מעבירים את פלטפורמת ה-hypervisor כמו שהיא</td><td>הרבה VMware, ורוצים אפס שינויים ב-VM-ים</td><td>Clusters של vSphere אל VMware Cloud on AWS או Amazon EVS</td></tr>
<tr><td><strong>Repurchase</strong></td><td>מחליפים ב-SaaS</td><td>פונקציה סטנדרטית שלא מבדלת אותך</td><td>Exchange שמנוהל בבית עובר ל-Microsoft 365, ו-CRM מקומי עובר ל-Salesforce</td></tr>
<tr><td><strong>Replatform</strong><br>lift, tinker and shift</td><td>שינויים קטנים כדי להשתמש בשירותים מנוהלים</td><td>רווח מהיר בלי לשכתב</td><td>MySQL שמנוהל ידנית על VM עובר ל-Amazon RDS; Tomcat עובר ל-Elastic Beanstalk או ל-containers</td></tr>
<tr><td><strong>Refactor</strong><br>re-architect</td><td>תכנון מחדש בצורה cloud-native</td><td>העסק צריך scale, גמישות או פיצ'רים שהתכנון הישן לא נותן</td><td>Monolith שמתפרק לשירותים על EKS או Lambda עם DynamoDB</td></tr>
</table>
<p>כלל אצבע: <strong>קודם rehost, אחר כך אופטימיזציה</strong> לרוב ה-estate, ומשקיעים ב-refactor רק ב-10-20% מהאפליקציות שבאמת מזיזות את העסק. גם VM-ים שעברו ב-rehost שווים rightsizing מיד אחרי המעבר: הגדלים מה-on-prem בדרך כלל גדולים פי 2-4 ממה שצריך.</p>
<blockquote>💡 Real world: ה-prescriptive guidance של AWS מונה בדיוק את 7 האסטרטגיות האלה. מראיינים אוהבים לשאול "איזה R מתאים לאפליקציה הזו?": אפליקציית מדף בת 15 שנה עם רישיון שקשור ל-MAC address היא <em>retain</em> או <em>rehost</em>, אף פעם לא <em>refactor</em>.</blockquote>`
      }
    },
    {
      h: { en: "Discovery, dependency mapping and wave planning", he: "Discovery, מיפוי תלויות ותכנון גלים" },
      body: {
        en: `<p>You can't plan what you haven't inventoried. Discovery collects, per server: CPU/RAM/disk utilization over 2-4 weeks, OS and installed software, and <strong>network connections</strong> (who talks to whom on which port). Tools: AWS Transform (which took over the discovery and planning role of Application Discovery Service and Migration Hub; both are closed to new customers), Azure Migrate, Google Migration Center, or plain <code>netstat</code>/<code>ss</code> plus flow logs when nothing else is allowed.</p>
<p>The dependency map turns 400 servers into <strong>move groups</strong>: things that must move together because they talk with low latency (an app and its database, a chatty batch job and its file share). Split a move group across on-prem and cloud and every query now crosses a 10-30 ms VPN hop instead of 0.2 ms in the same rack.</p>
<p><strong>Wave planning:</strong></p>
<ul>
<li><strong>Wave 0 (foundation):</strong> landing zone, accounts, network (Direct Connect or VPN), DNS, IAM, logging. No apps yet.</li>
<li><strong>Wave 1 (pilot):</strong> 3-5 low-risk, low-dependency apps. The goal is to test the factory: runbooks, tooling, who approves cutover.</li>
<li><strong>Waves 2..N:</strong> 20-50 servers per wave every 1-2 weeks, grouped by move group and business owner, rising in criticality.</li>
<li><strong>Last waves:</strong> the core databases and the apps with the most dependencies, once the team has done the cutover 10 times.</li>
</ul>
<blockquote>⚠️ Production tip: the dependency nobody listed is the one that breaks cutover night: a hard-coded IP in a cron job, an LDAP server, an SMTP relay, a license server, an NFS mount in <code>/etc/fstab</code>. Watch real traffic for at least two weeks, including a month-end close.</blockquote>`,
        he: `<p>אי אפשר לתכנן את מה שלא נספר. ה-discovery אוסף לכל שרת: ניצולת CPU, זיכרון ודיסק לאורך 2-4 שבועות, OS ותוכנות מותקנות, ו<strong>חיבורי רשת</strong> (מי מדבר עם מי ובאיזה port). כלים: AWS Transform (שלקח את תפקיד ה-discovery והתכנון מ-Application Discovery Service ומ-Migration Hub, ששניהם כבר סגורים ללקוחות חדשים), Azure Migrate, Google Migration Center, או פשוט <code>netstat</code> ו-<code>ss</code> יחד עם flow logs כשאין אישור לשום כלי אחר.</p>
<p>מפת התלויות הופכת 400 שרתים ל-<strong>move groups</strong>: דברים שחייבים לעבור יחד כי הם מדברים ב-latency נמוך (אפליקציה וה-database שלה, batch job פטפטן וה-file share שלו). אם מפצלים move group בין on-prem לענן, כל query עובר עכשיו hop של VPN של 10-30 ms במקום 0.2 ms באותו rack.</p>
<p><strong>תכנון גלים:</strong></p>
<ul>
<li><strong>גל 0 (תשתית):</strong> landing zone, חשבונות, רשת (Direct Connect או VPN), DNS, IAM, לוגים. עדיין בלי אפליקציות.</li>
<li><strong>גל 1 (פיילוט):</strong> 3-5 אפליקציות בסיכון נמוך ועם מעט תלויות. המטרה היא לבדוק את "המפעל": runbooks, כלים, ומי מאשר cutover.</li>
<li><strong>גלים 2 עד N:</strong> 20-50 שרתים בכל גל, כל 1-2 שבועות, מקובצים לפי move group ולפי בעלים עסקי, בקריטיות עולה.</li>
<li><strong>הגלים האחרונים:</strong> ה-databases המרכזיים והאפליקציות עם הכי הרבה תלויות, אחרי שהצוות כבר עשה cutover עשר פעמים.</li>
</ul>
<blockquote>⚠️ Production tip: התלות שאף אחד לא רשם היא זו ששוברת את ליל ה-cutover: כתובת IP קשיחה ב-cron job, שרת LDAP, SMTP relay, שרת רישיונות, או NFS mount בקובץ <code>/etc/fstab</code>. מסתכלים על תעבורה אמיתית לפחות שבועיים, כולל סגירת סוף חודש.</blockquote>`
      }
    },
    {
      h: { en: "Moving the data: bandwidth math, DataSync, DMS + SCT, offline transfer", he: "להעביר את ה-data: חשבון bandwidth, DataSync, DMS ו-SCT, העברה offline" },
      body: {
        en: `<p>Always do the math first. <strong>Time = bytes × 8 ÷ bits per second.</strong></p>
<pre>100 TB over 1 Gbps:
  100 × 10^12 B × 8 = 8 × 10^14 bits
  8 × 10^14 ÷ 10^9 bit/s = 800,000 s = 9.3 days   (line rate, perfect)
  at ~80% usable throughput                      ≈ 11.6 days
100 TB over 10 Gbps Direct Connect               ≈ 22 h at line rate, ~28 h real
1 PB over 1 Gbps                                 ≈ 93 days  -&gt; ship disks instead</pre>
<table>
<tr><th>Tool</th><th>For</th><th>Notes</th></tr>
<tr><td><strong>AWS DataSync</strong></td><td>Files and objects: NFS, SMB, HDFS, S3-compatible to S3, EFS, FSx</td><td>Agent VM on-prem, parallel transfer, checksums, incremental re-runs, bandwidth throttle; one task can push up to roughly 10 Gbps</td></tr>
<tr><td><strong>AWS DMS</strong></td><td>Databases, homogeneous or heterogeneous</td><td>Full load, then <strong>CDC</strong> (change data capture) from the transaction log keeps the target in sync until cutover</td></tr>
<tr><td><strong>SCT / DMS Schema Conversion</strong></td><td>Engine changes, e.g. Oracle to Aurora PostgreSQL</td><td>Converts schema, views, stored procedures; reports what needs manual rewrite. DMS moves the rows, SCT moves the shape</td></tr>
<tr><td><strong>Offline transfer</strong></td><td>Tens of TB to PB over a weak link</td><td>Snowball Edge is closed to new customers and AWS ends Snowball support on 31 Dec 2026; today look at AWS Data Transfer Terminal, a bigger Direct Connect, Azure Data Box or Google Transfer Appliance</td></tr>
</table>
<p>Pattern for big data sets: <strong>bulk copy first (online or offline), then incremental sync</strong> (DataSync re-run or DMS CDC) so that the final delta at cutover is minutes of changes, not the whole data set.</p>
<blockquote>⚠️ Production tip: a full migration copy at line rate saturates the same link production uses. Set a DataSync bandwidth limit (e.g. 500 Mbps business hours, unlimited at night) or the migration becomes the outage.</blockquote>`,
        he: `<p>תמיד עושים קודם את החשבון. <strong>זמן</strong> = <code>bytes × 8 ÷ bits_per_second</code></p>
<pre>100 TB over 1 Gbps:
  100 × 10^12 B × 8 = 8 × 10^14 bits
  8 × 10^14 ÷ 10^9 bit/s = 800,000 s = 9.3 days   (line rate, perfect)
  at ~80% usable throughput                      ≈ 11.6 days
100 TB over 10 Gbps Direct Connect               ≈ 22 h at line rate, ~28 h real
1 PB over 1 Gbps                                 ≈ 93 days  -&gt; ship disks instead</pre>
<table>
<tr><th>כלי</th><th>מתאים ל</th><th>הערות</th></tr>
<tr><td><strong>AWS DataSync</strong></td><td>קבצים ואובייקטים: מ-NFS, SMB, HDFS או אחסון תואם S3 אל S3, EFS או FSx</td><td>Agent כ-VM ב-on-prem, העברה מקבילית, checksums, הרצות חוזרות אינקרמנטליות, הגבלת bandwidth; task אחד יכול להגיע בערך ל-10 Gbps</td></tr>
<tr><td><strong>AWS DMS</strong></td><td>בסיסי נתונים, מאותו מנוע או ממנוע אחר</td><td>Full load, ואחריו <strong>CDC</strong> (change data capture) מה-transaction log שמחזיק את היעד מסונכרן עד ה-cutover</td></tr>
<tr><td><strong>SCT או DMS Schema Conversion</strong></td><td>החלפת מנוע, למשל Oracle אל Aurora PostgreSQL</td><td>ממיר schema, views ו-stored procedures ומדווח מה צריך לשכתב ידנית. ה-DMS מעביר את השורות, ה-SCT מעביר את המבנה</td></tr>
<tr><td><strong>העברה offline</strong></td><td>עשרות TB עד PB על לינק חלש</td><td>Snowball Edge סגור ללקוחות חדשים ו-AWS מפסיקה לתמוך ב-Snowball ב-31 בדצמבר 2026; היום בודקים את AWS Data Transfer Terminal, Direct Connect גדול יותר, Azure Data Box או Google Transfer Appliance</td></tr>
</table>
<p>הדפוס ל-data גדול: <strong>קודם העתקה מסיבית (online או offline), אחר כך סנכרון אינקרמנטלי</strong> (הרצה חוזרת של DataSync או CDC של DMS), כך שה-delta האחרון ב-cutover הוא דקות של שינויים ולא כל ה-data.</p>
<blockquote>⚠️ Production tip: העתקה מלאה ב-line rate חונקת את אותו לינק שהפרוד משתמש בו. מגדירים הגבלת bandwidth ב-DataSync (למשל 500 Mbps בשעות העבודה ובלי הגבלה בלילה), אחרת המיגרציה עצמה הופכת לתקלה.</blockquote>`
      }
    },
    {
      h: { en: "Servers with MGN, and cutover patterns", he: "שרתים עם MGN ודפוסי cutover" },
      body: {
        en: `<p><strong>AWS Application Migration Service (MGN, now branded AWS Transform MGN)</strong> is the default rehost tool. An agent on each source server does block-level continuous replication into a low-cost staging subnet in your account. You launch <strong>test instances</strong> (non-disruptive, source keeps running), validate, then launch the <strong>cutover instance</strong>: the replica is converted to boot natively on EC2 (drivers, boot loader), so cutover downtime is typically minutes. Equivalents: Azure Migrate (server migration), Google Migrate to Virtual Machines.</p>
<table>
<tr><th>Cutover pattern</th><th>How</th><th>Downtime</th><th>Risk</th></tr>
<tr><td><strong>Big-bang DNS cutover</strong></td><td>Stop writes, final sync, flip the DNS record to the new endpoint</td><td>Minutes (plus TTL)</td><td>Rollback = flip DNS back, but writes made in the cloud must be copied back</td></tr>
<tr><td><strong>CDC replication</strong></td><td>DMS full load + CDC; target lags seconds behind; brief write freeze, then switch</td><td>Seconds to minutes</td><td>Reverse CDC (cloud to on-prem) keeps a real rollback path</td></tr>
<tr><td><strong>Dual-write</strong></td><td>App writes to both old and new stores; reads move gradually</td><td>Zero</td><td>Consistency between the two writes is your problem; needs reconciliation jobs</td></tr>
<tr><td><strong>Weighted / canary</strong></td><td>Route 53 weighted records or the LB send 5% then 25% then 100% to the cloud</td><td>Zero</td><td>Works for stateless tiers; the data layer still needs one of the above</td></tr>
</table>
<p><strong>Rollback plan</strong> (write it before the window, not during): the go/no-go criteria (error rate, p99 latency, row counts match), the point of no return (usually the first write in the new system without reverse replication), who decides, and the exact steps to flip back. Keep the source servers stopped but intact for 1-2 weeks after cutover.</p>
<blockquote>💡 Real world: lower the DNS TTL from 3600 s to 60 s <em>at least one old TTL before</em> cutover day. If you lower it at cutover time, resolvers keep the old answer for up to an hour.</blockquote>`,
        he: `<p><strong>AWS Application Migration Service</strong> (MGN, שמשווק היום בשם AWS Transform MGN) הוא כלי ה-rehost ברירת המחדל. Agent על כל שרת מקור עושה שכפול רציף ברמת block אל staging subnet זול בחשבון שלך. מרימים <strong>test instances</strong> (בלי להפריע, המקור ממשיך לרוץ), בודקים, ואז מרימים את ה-<strong>cutover instance</strong>: העותק מומר כדי לעשות boot כ-EC2 רגיל (drivers ו-boot loader), ולכן ה-downtime של ה-cutover הוא בדרך כלל דקות. המקבילים: Azure Migrate לשרתים, ו-Migrate to Virtual Machines ב-Google.</p>
<table>
<tr><th>דפוס cutover</th><th>איך</th><th>Downtime</th><th>סיכון</th></tr>
<tr><td><strong>DNS cutover בבת אחת</strong></td><td>עוצרים כתיבות, סנכרון אחרון, מעבירים את רשומת ה-DNS ל-endpoint החדש</td><td>דקות (ועוד ה-TTL)</td><td>Rollback זה להחזיר את ה-DNS, אבל כתיבות שנעשו בענן צריך להעתיק חזרה</td></tr>
<tr><td><strong>שכפול CDC</strong></td><td>DMS עם full load ו-CDC; היעד מפגר בשניות; הקפאת כתיבות קצרה ואז מעבר</td><td>שניות עד דקות</td><td>CDC הפוך (מהענן חזרה ל-on-prem) משאיר דרך rollback אמיתית</td></tr>
<tr><td><strong>Dual-write</strong></td><td>האפליקציה כותבת גם לישן וגם לחדש; הקריאות עוברות בהדרגה</td><td>אפס</td><td>העקביות בין שתי הכתיבות היא הבעיה שלך; צריך jobs של reconciliation</td></tr>
<tr><td><strong>משוקלל או canary</strong></td><td>רשומות weighted ב-Route 53 או ה-LB שולחים 5%, אחר כך 25% ואז 100% לענן</td><td>אפס</td><td>עובד לשכבות stateless; שכבת ה-data עדיין צריכה אחד מהדפוסים למעלה</td></tr>
</table>
<p><strong>תוכנית rollback</strong> (כותבים אותה לפני החלון, לא בזמן שלו): קריטריונים ל-go/no-go (error rate, latency של p99, ספירות שורות תואמות), נקודת האל-חזור (בדרך כלל הכתיבה הראשונה במערכת החדשה בלי שכפול הפוך), מי מחליט, והצעדים המדויקים לחזור אחורה. משאירים את שרתי המקור כבויים אבל שלמים שבוע-שבועיים אחרי ה-cutover.</p>
<blockquote>💡 Real world: מורידים את ה-TTL של ה-DNS מ-3600 שניות ל-60 שניות <em>לפחות TTL ישן אחד לפני</em> יום ה-cutover. אם מורידים אותו רק בזמן ה-cutover, ה-resolvers ימשיכו להחזיק את התשובה הישנה עד שעה.</blockquote>`
      }
    },
    {
      h: { en: "AWS, Azure and GCP: the migration toolbox side by side", he: "AWS, Azure ו-GCP: ארגז הכלים למיגרציה זה לצד זה" },
      body: {
        en: `<table>
<tr><th>Job</th><th>AWS</th><th>Azure</th><th>Google Cloud</th></tr>
<tr><td>Discovery and planning</td><td>AWS Transform</td><td>Azure Migrate</td><td>Migration Center</td></tr>
<tr><td>Rehost servers</td><td>MGN (AWS Transform MGN)</td><td>Azure Migrate server migration</td><td>Migrate to Virtual Machines</td></tr>
<tr><td>Relocate VMware</td><td>VMware Cloud on AWS, Amazon EVS</td><td>Azure VMware Solution</td><td>Google Cloud VMware Engine</td></tr>
<tr><td>Database migration</td><td>DMS + SCT / DMS Schema Conversion</td><td>Azure Database Migration Service</td><td>Database Migration Service</td></tr>
<tr><td>Online file transfer</td><td>DataSync</td><td>AzCopy, Azure Storage Mover</td><td>Storage Transfer Service</td></tr>
<tr><td>Offline transfer</td><td>Data Transfer Terminal (Snowball being retired)</td><td>Azure Data Box</td><td>Transfer Appliance</td></tr>
</table>
<p>Beyond tools: run the migration as a <strong>factory</strong>. A small core team owns the landing zone, runbooks and tooling; app teams own testing and sign-off for their apps; a weekly wave review tracks a burndown of servers left. That's the same playbook as any large internal migration (see the staff lesson on migrations at scale).</p>`,
        he: `<table>
<tr><th>משימה</th><th>AWS</th><th>Azure</th><th>Google Cloud</th></tr>
<tr><td>Discovery ותכנון</td><td>AWS Transform</td><td>Azure Migrate</td><td>Migration Center</td></tr>
<tr><td>Rehost לשרתים</td><td>MGN (AWS Transform MGN)</td><td>Azure Migrate server migration</td><td>Migrate to Virtual Machines</td></tr>
<tr><td>Relocate ל-VMware</td><td>VMware Cloud on AWS, Amazon EVS</td><td>Azure VMware Solution</td><td>Google Cloud VMware Engine</td></tr>
<tr><td>מיגרציית database</td><td>DMS עם SCT או DMS Schema Conversion</td><td>Azure Database Migration Service</td><td>Database Migration Service</td></tr>
<tr><td>העברת קבצים online</td><td>DataSync</td><td>AzCopy, Azure Storage Mover</td><td>Storage Transfer Service</td></tr>
<tr><td>העברה offline</td><td>Data Transfer Terminal (ה-Snowball בדרך החוצה)</td><td>Azure Data Box</td><td>Transfer Appliance</td></tr>
</table>
<p>מעבר לכלים: מריצים את המיגרציה כמו <strong>מפעל</strong>. צוות ליבה קטן אחראי על ה-landing zone, ה-runbooks והכלים; צוותי האפליקציות אחראים על הבדיקות ועל האישור של האפליקציות שלהם; וסקירת גלים שבועית עוקבת אחרי burndown של השרתים שנשארו. זה אותו playbook של כל מיגרציה פנימית גדולה (ראה את שיעור ה-staff על מיגרציות בסקייל).</p>`
      }
    }
  ],
  diagram: `  DISCOVER            PLAN                 MIGRATE (per wave)                 CUTOVER
 +-----------+   +----------------+   +-----------------------------+   +-------------------+
 | inventory |-->| 7 Rs per app   |-->| MGN: block replication      |-->| freeze writes     |
 | util 2-4w |   | move groups    |   |   -> test instance          |   | final CDC delta   |
 | net flows |   | waves 0,1..N   |   | DMS: full load + CDC        |   | DNS TTL 60s flip  |
 +-----------+   +----------------+   | DataSync: bulk + increments |   | go / no-go        |
                                      +-----------------------------+   +---------+---------+
   on-prem DC ==== Direct Connect / VPN ====> AWS landing zone                      |
                                                                    rollback: DNS back +
                                                                    reverse CDC, source kept 1-2w`,
  handsOn: [
    { cmd: "echo \"100*10^12*8/10^9/86400\" | bc -l", what: { en: "Days to move 100 TB over 1 Gbps at line rate (~9.26). Divide by 0.8 for a realistic number before you promise a date.", he: "כמה ימים לוקח להעביר 100 TB על 1 Gbps ב-line rate (בערך 9.26). מחלקים ב-0.8 כדי לקבל מספר מציאותי לפני שמבטיחים תאריך." } },
    { cmd: "curl -o aws-replication-installer-init https://aws-application-migration-service-eu-central-1.s3.eu-central-1.amazonaws.com/latest/linux/aws-replication-installer-init && chmod +x aws-replication-installer-init && sudo ./aws-replication-installer-init --region eu-central-1", what: { en: "Install the MGN replication agent on a Linux source server; it starts block-level replication to the staging area.", he: "מתקינים את ה-agent של MGN על שרת מקור Linux; הוא מתחיל שכפול ברמת block לאזור ה-staging." } },
    { cmd: "aws mgn describe-source-servers --query 'items[].[sourceServerID,lifeCycle.state,dataReplicationInfo.dataReplicationState]' --output table", what: { en: "See every source server's lifecycle (READY_FOR_TEST, TESTING, READY_FOR_CUTOVER, CUTOVER) and replication state.", he: "רואים לכל שרת מקור את שלב ה-lifecycle ואת מצב השכפול: READY_FOR_TEST, TESTING, READY_FOR_CUTOVER ו-CUTOVER." } },
    { cmd: "aws dms create-replication-task --replication-task-identifier orders-full-cdc --migration-type full-load-and-cdc --source-endpoint-arn $SRC --target-endpoint-arn $TGT --replication-instance-arn $RI --table-mappings file://mappings.json", what: { en: "Create a DMS task that copies existing rows and then streams ongoing changes (CDC) until you cut over.", he: "יוצרים task של DMS שמעתיק את השורות הקיימות ואז מזרים את השינויים השוטפים (CDC) עד ה-cutover." } },
    { cmd: "aws dms describe-table-statistics --replication-task-arn $TASK --query 'TableStatistics[].[TableName,FullLoadRows,Inserts,Updates,Deletes,ValidationState]' --output table", what: { en: "Per-table progress and validation before go/no-go: row counts and CDC activity should match the source.", he: "התקדמות ו-validation לכל טבלה לפני ה-go/no-go: ספירות השורות ופעילות ה-CDC צריכות להתאים למקור." } }
  ],
  mnemonic: {
    en: "\"Throw, Keep, Truck, Move-the-building, Buy, Tweak, Rebuild\" = Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor. Then: discover, wave, sync, flip, and keep the way back open.",
    he: "\"זורקים, משאירים, משאית, מעבירים את הבניין, קונים, משפצים, בונים מחדש\" = Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor. ואז: ממפים, גלים, מסנכרנים, מעבירים, ומשאירים את הדרך חזרה פתוחה."
  },
  pitfalls: [
    { en: "Refactoring everything during the move. Two big changes at once (new platform + new architecture) double the risk and blow the datacenter-exit date; rehost now, modernize after.", he: "לעשות refactor להכל תוך כדי המעבר. שני שינויים גדולים בבת אחת (פלטפורמה חדשה וגם ארכיטקטורה חדשה) מכפילים את הסיכון ומפוצצים את תאריך היציאה מה-datacenter; עושים rehost עכשיו ומודרניזציה אחר כך." },
    { en: "Splitting a chatty app from its database across on-prem and cloud. 0.2 ms becomes 10-30 ms per round trip, and a page with 200 queries goes from 40 ms to 4 s.", he: "לפצל אפליקציה פטפטנית מה-database שלה בין on-prem לענן. 0.2 ms הופכים ל-10-30 ms לכל round trip, ודף עם 200 queries קופץ מ-40 ms ל-4 שניות." },
    { en: "Promising a weekend cutover without the bandwidth math: 40 TB over a 1 Gbps VPN is 3.7 days at line rate.", he: "להבטיח cutover בסופ\"ש בלי לעשות חשבון של bandwidth. למשל, העברה של 40 TB על VPN של 1 Gbps לוקחת 3.7 ימים ב-line rate." },
    { en: "No rollback path after the first write in the cloud. Without reverse replication, 'roll back' means losing every order taken since cutover.", he: "אין דרך rollback אחרי הכתיבה הראשונה בענן. בלי שכפול הפוך, rollback אומר לאבד כל הזמנה שנכנסה מאז ה-cutover." }
  ],
  interview: [
    {
      q: { en: "You must exit a datacenter in 9 months: 300 VMs, 6 Oracle databases, a 1 Gbps link. How do you plan it?", he: "צריך לצאת מ-datacenter בעוד 9 חודשים: 300 VM-ים, 6 בסיסי נתונים של Oracle ולינק של 1 Gbps. איך מתכננים?" },
      a: { en: "Discovery for 2-4 weeks (utilization + network flows) to retire the dead 10-20% and build move groups. Wave 0: landing zone and a 10 Gbps Direct Connect ordered now (it takes weeks), VPN as interim. Most VMs rehost with MGN in waves of 20-50, pilot first. Databases: replatform to RDS for Oracle (fast) or convert to Aurora PostgreSQL with SCT if licensing justifies it; DMS full load + CDC so cutover is a short write freeze. Data math: 6 DBs of, say, 20 TB total is ~2 days per pass on 1 Gbps, fine with CDC. Each cutover has go/no-go criteria, lowered DNS TTL, reverse CDC for rollback, and the source kept for 2 weeks.", he: "Discovery של 2-4 שבועות (ניצולת ו-network flows) כדי לכבות את ה-10-20% המתים ולבנות move groups. גל 0: landing zone, ומזמינים כבר עכשיו Direct Connect של 10 Gbps (לוקח שבועות) עם VPN בינתיים. רוב ה-VM-ים עוברים ב-rehost עם MGN בגלים של 20-50, קודם פיילוט. ה-databases: replatform ל-RDS for Oracle (מהיר), או המרה ל-Aurora PostgreSQL עם SCT אם הרישוי מצדיק את זה; DMS עם full load ו-CDC כך שה-cutover הוא הקפאת כתיבות קצרה. חשבון ה-data: נניח 20 TB לכל 6 ה-DBs, זה בערך יומיים למעבר על 1 Gbps, וזה בסדר עם CDC. לכל cutover יש קריטריונים ל-go/no-go, TTL מוקטן ב-DNS, CDC הפוך בשביל rollback, ושרתי מקור שנשמרים שבועיים." }
    },
    {
      q: { en: "Rehost vs replatform vs refactor: how do you choose for a given app?", he: "Rehost מול replatform מול refactor: איך בוחרים לאפליקציה מסוימת?" },
      a: { en: "By business value, time pressure and risk. Under a hard deadline or with a vendor-locked app, rehost. If there's a cheap managed equivalent for a painful component (self-run MySQL to RDS, cron VM to EventBridge + Lambda), replatform that piece. Refactor only when the app is strategic and the current design blocks scale or speed, and budget it as a product project, not as part of the migration window.", he: "לפי ערך עסקי, לחץ זמן וסיכון. תחת דדליין קשיח או עם אפליקציה נעולה אצל ספק, עושים rehost. אם יש מקבילה מנוהלת וזולה לרכיב שכואב (MySQL שמנוהל ידנית עובר ל-RDS, VM של cron עובר ל-EventBridge עם Lambda), עושים replatform לרכיב הזה. עושים refactor רק כשהאפליקציה אסטרטגית והתכנון הנוכחי חוסם scale או מהירות פיתוח, ומתקצבים את זה כפרויקט מוצר, לא כחלק מחלון המיגרציה." }
    }
  ],
  quiz: [
    {
      q: { en: "A self-managed PostgreSQL VM moves to Amazon RDS for PostgreSQL with no app code changes. Which R is this?", he: "VM עם PostgreSQL שמנוהל ידנית עובר ל-Amazon RDS for PostgreSQL בלי שינויי קוד באפליקציה. איזה R זה?" },
      options: [
        { en: "Rehost", he: "Rehost" },
        { en: "Replatform", he: "Replatform" },
        { en: "Refactor", he: "Refactor" },
        { en: "Repurchase", he: "Repurchase" }
      ],
      answer: 1,
      explain: { en: "Same engine, now a managed service: a small platform change without redesign is replatform. Rehost would keep it as PostgreSQL on an EC2 VM.", he: "אותו מנוע, עכשיו כשירות מנוהל: שינוי פלטפורמה קטן בלי תכנון מחדש זה replatform. ב-rehost זה היה נשאר PostgreSQL על VM של EC2." }
    },
    {
      q: { en: "Roughly how long does 100 TB take over a dedicated 1 Gbps link at line rate?", he: "בערך כמה זמן לוקח להעביר 100 TB על לינק ייעודי של 1 Gbps ב-line rate?" },
      options: [
        { en: "About 22 hours", he: "בערך 22 שעות" },
        { en: "About 9 days", he: "בערך 9 ימים" },
        { en: "About 3 days", he: "בערך 3 ימים" },
        { en: "About 90 days", he: "בערך 90 יום" }
      ],
      answer: 1,
      explain: { en: "8 × 10^14 bits ÷ 10^9 bit/s = 800,000 s ≈ 9.3 days, more like 11-12 days in practice. 22 hours is the 10 Gbps number; 90 days is 1 PB.", he: "8 × 10^14 bits ÷ 10^9 bit/s = 800,000 שניות, בערך 9.3 ימים, ובפועל קרוב יותר ל-11-12 ימים. 22 שעות זה המספר של 10 Gbps; 90 יום זה ל-1 PB." }
    },
    {
      q: { en: "You need to move a 5 TB Oracle database to Aurora PostgreSQL with under 10 minutes of downtime. Best approach?", he: "צריך להעביר database של Oracle בגודל 5 TB ל-Aurora PostgreSQL עם פחות מ-10 דקות downtime. מה הגישה הנכונה?" },
      options: [
        { en: "Export a dump on Friday night and import it on Saturday", he: "לייצא dump ביום שישי בלילה ולייבא בשבת" },
        { en: "SCT to convert the schema, then DMS full load + CDC, cut over after a short write freeze", he: "SCT להמרת ה-schema, אחר כך DMS עם full load ו-CDC, ו-cutover אחרי הקפאת כתיבות קצרה" },
        { en: "MGN to replicate the database server's disks", he: "MGN לשכפול הדיסקים של שרת ה-database" },
        { en: "DataSync the Oracle data files to S3", he: "להעביר את קבצי ה-data של Oracle ל-S3 עם DataSync" }
      ],
      answer: 1,
      explain: { en: "An engine change needs schema conversion (SCT) and row-level migration with ongoing replication (DMS CDC). MGN copies disks, so you'd still be on Oracle; a dump means hours of downtime.", he: "החלפת מנוע דורשת המרת schema (SCT) ומיגרציה ברמת השורות עם שכפול שוטף (CDC של DMS). ה-MGN מעתיק דיסקים, כך שעדיין היית על Oracle; ו-dump אומר שעות של downtime." }
    },
    {
      q: { en: "Cutover is Saturday 02:00. When should you lower the DNS TTL from 3600 s to 60 s?", he: "ה-cutover בשבת ב-02:00. מתי צריך להוריד את ה-TTL של ה-DNS מ-3600 שניות ל-60?" },
      options: [
        { en: "At 02:00, as the first step of the cutover", he: "ב-02:00, כצעד הראשון של ה-cutover" },
        { en: "Right after the cutover, to speed up rollback", he: "מיד אחרי ה-cutover, כדי לזרז rollback" },
        { en: "At least an hour (one old TTL) before, ideally a day earlier", he: "לפחות שעה לפני (TTL ישן אחד), ועדיף יום לפני" },
        { en: "Never; TTL doesn't affect cutover", he: "אף פעם; ה-TTL לא משפיע על cutover" }
      ],
      answer: 2,
      explain: { en: "Resolvers cache the record for the old TTL. Lower it early so that by cutover every cache holds a 60 s TTL and the flip propagates in about a minute.", he: "Resolvers שומרים את הרשומה ב-cache לפי ה-TTL הישן. מורידים מוקדם, כך שבזמן ה-cutover בכל cache יש כבר TTL של 60 שניות והשינוי מתפשט תוך דקה בערך." }
    }
  ],
  playground: "dr",
  related: ["staff-migrations-at-scale", "staff-zero-downtime-migrations", "cloud-storage", "net-hybrid-connectivity", "cloud-landing-zones", "cloud-hybrid-edge"]
});

INFRA.lessons.push({
  id: "cloud-hybrid-edge",
  track: "cloud",
  order: 61,
  icon: "🛰️",
  level: 2,
  minutes: 13,
  title: { en: "AWS Hybrid & Edge: Storage Gateway, Outposts, Local Zones, Wavelength, Snow", he: "שירותי hybrid ו-edge ב-AWS: מ-Storage Gateway ועד Outposts ו-Snow" },
  tldr: {
    en: "When AWS can't be 'just a region away', pick by the constraint: Storage Gateway lets on-prem apps use S3 through NFS/SMB/iSCSI/tape, Direct Connect or VPN carries the traffic, Outposts puts AWS racks in your building (data residency, local latency), Local Zones put AWS in a metro near users, Wavelength puts it inside a 5G carrier network, and DataSync (or Snow, while it lasts) moves the bytes.",
    he: "כש-AWS לא יכול להיות \"region אחד משם\", בוחרים לפי האילוץ: Storage Gateway נותן לאפליקציות on-prem להשתמש ב-S3 דרך NFS, SMB, iSCSI או טייפ; Direct Connect או VPN מעבירים את התעבורה; Outposts שם racks של AWS בבניין שלך (data residency ו-latency מקומי); Local Zones שמים את AWS בעיר ליד המשתמשים; Wavelength שם אותו בתוך רשת 5G של מפעיל; ו-DataSync (או Snow, כל עוד הוא קיים) מזיז את ה-bytes."
  },
  analogy: {
    en: "AWS is a big central restaurant kitchen. Storage Gateway is the delivery window in your office: you order through the same hatch as always, the food is cooked centrally. Outposts is a franchise kitchen built inside your building, run by the chain. Local Zones are branch kitchens in your city, Wavelength is a food truck parked at the cell tower, and Snowball is the catering van that drives crates of food when the road (network) is too slow.",
    he: "AWS הוא מטבח מרכזי ענק של רשת מסעדות. Storage Gateway הוא אשנב המשלוחים במשרד שלך: מזמינים דרך אותו אשנב כמו תמיד, והאוכל מבושל במטבח המרכזי. Outposts הוא מטבח של הרשת שנבנה בתוך הבניין שלך ומופעל על ידה. Local Zones הם סניפים בעיר שלך, Wavelength הוא משאית אוכל שחונה ליד אנטנת הסלולר, ו-Snowball הוא רכב הקייטרינג שמוביל ארגזי אוכל כשהכביש (הרשת) איטי מדי."
  },
  sections: [
    {
      h: { en: "Storage Gateway: S3 behind on-prem protocols", he: "Storage Gateway: S3 מאחורי פרוטוקולים של on-prem" },
      body: {
        en: `<p>A VM (VMware, Hyper-V, KVM), a hardware appliance or an EC2 instance that speaks a classic storage protocol on the LAN, keeps a <strong>local cache</strong> for hot data and stores everything durably in AWS.</p>
<table>
<tr><th>Gateway</th><th>Protocol on-prem</th><th>Where data lands</th><th>Typical use</th></tr>
<tr><td><strong>S3 File Gateway</strong></td><td>NFS v3/v4.1, SMB</td><td>Each file = one S3 object, readable by Athena, Lambda, etc.</td><td>Backups to S3, sharing files with cloud analytics, tiering a full NAS</td></tr>
<tr><td><strong>Volume Gateway, cached</strong></td><td>iSCSI block</td><td>Primary copy in S3, hot blocks cached locally; snapshots become EBS snapshots</td><td>Expanding on-prem block capacity without buying disks</td></tr>
<tr><td><strong>Volume Gateway, stored</strong></td><td>iSCSI block</td><td>Primary copy on local disks, async point-in-time snapshots to AWS</td><td>Low-latency full local data plus offsite backup/DR</td></tr>
<tr><td><strong>Tape Gateway</strong></td><td>iSCSI virtual tape library (VTL)</td><td>Virtual tapes in S3, archived to S3 Glacier Flexible Retrieval or Glacier Deep Archive</td><td>Replace physical tapes with no change to Veeam, NetBackup, Commvault</td></tr>
</table>
<blockquote>💡 Real world: the classic SAA-C03 trap: "keep using existing backup software with tapes, but stop shipping tapes offsite" is <strong>Tape Gateway</strong>. "Files on NFS must be queryable by Athena" is <strong>S3 File Gateway</strong>. "Low-latency access to the whole data set locally" is <strong>Volume Gateway stored</strong>, not cached.</blockquote>`,
        he: `<p>VM (על VMware, Hyper-V או KVM), appliance פיזי או instance של EC2 שמדבר פרוטוקול אחסון קלאסי ב-LAN, מחזיק <strong>cache מקומי</strong> ל-data חם ושומר הכל בצורה עמידה ב-AWS.</p>
<table>
<tr><th>Gateway</th><th>פרוטוקול ב-on-prem</th><th>איפה ה-data נוחת</th><th>שימוש טיפוסי</th></tr>
<tr><td><strong>S3 File Gateway</strong></td><td>NFS v3/v4.1, SMB</td><td>כל קובץ הוא אובייקט אחד ב-S3, קריא ל-Athena, Lambda וכו'</td><td>גיבויים ל-S3, שיתוף קבצים עם analytics בענן, tiering של NAS מלא</td></tr>
<tr><td><strong>Volume Gateway במצב cached</strong></td><td>iSCSI ברמת block</td><td>העותק הראשי ב-S3, ה-blocks החמים ב-cache מקומי; snapshots הופכים ל-EBS snapshots</td><td>להגדיל קיבולת block ב-on-prem בלי לקנות דיסקים</td></tr>
<tr><td><strong>Volume Gateway במצב stored</strong></td><td>iSCSI ברמת block</td><td>העותק הראשי על דיסקים מקומיים, snapshots אסינכרוניים ל-AWS</td><td>כל ה-data מקומי ב-latency נמוך, ועוד גיבוי offsite ו-DR</td></tr>
<tr><td><strong>Tape Gateway</strong></td><td>ספריית טייפים וירטואלית (VTL) על iSCSI</td><td>טייפים וירטואליים ב-S3, בארכוב ל-S3 Glacier Flexible Retrieval או ל-Glacier Deep Archive</td><td>להחליף טייפים פיזיים בלי לשנות את Veeam, NetBackup או Commvault</td></tr>
</table>
<blockquote>💡 Real world: המלכודת הקלאסית ב-SAA-C03: "להמשיך עם תוכנת הגיבוי הקיימת והטייפים, אבל להפסיק לשלוח טייפים החוצה" זה <strong>Tape Gateway</strong>. "קבצים על NFS צריכים להיות זמינים ל-query ב-Athena" זה <strong>S3 File Gateway</strong>. "גישה ב-latency נמוך לכל ה-data מקומית" זה <strong>Volume Gateway במצב stored</strong>, לא cached.</blockquote>`
      }
    },
    {
      h: { en: "The pipe: Direct Connect vs Site-to-Site VPN", he: "הצינור: Direct Connect מול Site-to-Site VPN" },
      body: {
        en: `<table>
<tr><th></th><th>Site-to-Site VPN</th><th>Direct Connect (DX)</th></tr>
<tr><td>Path</td><td>IPsec over the public internet</td><td>Private fiber from your router to an AWS DX location</td></tr>
<tr><td>Time to set up</td><td>Minutes</td><td>Weeks to months (cross-connect, carrier)</td></tr>
<tr><td>Bandwidth</td><td>Up to ~1.25 Gbps per tunnel (2 tunnels per connection); more with ECMP over Transit Gateway</td><td>Dedicated 1, 10, 100, 400 Gbps; hosted 50 Mbps to 25 Gbps via partners</td></tr>
<tr><td>Latency</td><td>Variable, internet-dependent</td><td>Consistent, predictable</td></tr>
<tr><td>Encryption</td><td>Yes, IPsec</td><td>Not by default: add MACsec (on supported dedicated ports) or run a VPN over DX</td></tr>
<tr><td>Cost model</td><td>Hourly per connection + normal egress</td><td>Port-hours + lower per-GB egress rate</td></tr>
</table>
<p>The SAA answer for "resilient and private": two DX connections at two DX locations, or one DX with a Site-to-Site VPN as backup. Deeper networking details (BGP, Transit Gateway, PrivateLink) are in the hybrid connectivity networking lesson.</p>`,
        he: `<table>
<tr><th></th><th>Site-to-Site VPN</th><th>Direct Connect (DX)</th></tr>
<tr><td>מסלול</td><td>IPsec על האינטרנט הציבורי</td><td>סיב פרטי מה-router שלך לנקודת DX של AWS</td></tr>
<tr><td>זמן הקמה</td><td>דקות</td><td>שבועות עד חודשים (cross-connect, ספק תקשורת)</td></tr>
<tr><td>Bandwidth</td><td>עד כ-1.25 Gbps ל-tunnel (שני tunnels לכל חיבור); יותר עם ECMP דרך Transit Gateway</td><td>חיבור ייעודי של 1, 10, 100 או 400 Gbps; חיבור hosted מ-50 Mbps עד 25 Gbps דרך שותפים</td></tr>
<tr><td>Latency</td><td>משתנה, תלוי באינטרנט</td><td>יציב וצפוי</td></tr>
<tr><td>הצפנה</td><td>כן, IPsec</td><td>לא כברירת מחדל: מוסיפים MACsec (בפורטים ייעודיים שתומכים בזה) או מריצים VPN מעל ה-DX</td></tr>
<tr><td>מודל עלות</td><td>תשלום לשעה לחיבור ועוד egress רגיל</td><td>תשלום לשעת port ומחיר egress נמוך יותר ל-GB</td></tr>
</table>
<p>התשובה ב-SAA ל"עמיד ופרטי": שני חיבורי DX בשתי נקודות DX שונות, או DX אחד עם Site-to-Site VPN כגיבוי. הפרטים העמוקים של הרשת (BGP, Transit Gateway, PrivateLink) נמצאים בשיעור ה-networking על hybrid connectivity.</p>`
      }
    },
    {
      h: { en: "Compute where AWS normally isn't: Outposts, Local Zones, Wavelength", he: "Compute איפה ש-AWS בדרך כלל לא נמצא: Outposts, Local Zones, Wavelength" },
      body: {
        en: `<table>
<tr><th>Service</th><th>Where it runs</th><th>Who owns the site</th><th>Why</th></tr>
<tr><td><strong>Outposts racks</strong> (42U) and <strong>Outposts servers</strong> (1U/2U)</td><td>Your datacenter, factory or hospital</td><td>You (power, space, network); AWS installs, monitors and replaces hardware</td><td>Data must stay on premises, single-digit ms to local systems, same EC2/EBS/ECS/EKS/RDS APIs as the region</td></tr>
<tr><td><strong>Local Zones</strong></td><td>AWS-run site in a metro (e.g. Los Angeles <code>us-west-2-lax-1</code>)</td><td>AWS</td><td>Single-digit ms to end users in that city: game servers, media rendering, live video, also local data residency</td></tr>
<tr><td><strong>Wavelength Zones</strong></td><td>Inside a telecom carrier's 5G network edge</td><td>AWS + carrier</td><td>Ultra-low latency to mobile devices: AR/VR, connected cars, live video analytics; traffic exits via a <em>carrier gateway</em></td></tr>
</table>
<p>All three are <strong>extensions of a parent region</strong>: you create a subnet in them inside your existing VPC, and the control plane (IAM, APIs, many managed services) stays in the region. Outposts needs a <em>service link</em> back to the region; if that link drops, running instances keep running locally but you can't launch or change things. Local Zones and Wavelength Zones are opt-in and offer a smaller set of instance types and services than a full region.</p>
<blockquote>⚠️ Production tip: an Outpost is capacity you buy up front (a 3-year term). Size it for failure: if you need N hosts of a type, order N+1, because a dead host is replaced by AWS on a hardware SLA, not in seconds.</blockquote>`,
        he: `<table>
<tr><th>שירות</th><th>איפה הוא רץ</th><th>של מי האתר</th><th>למה</th></tr>
<tr><td><strong>Outposts racks</strong> (42U) ו-<strong>Outposts servers</strong> (1U/2U)</td><td>ה-datacenter, המפעל או בית החולים שלך</td><td>שלך (חשמל, מקום, רשת); AWS מתקינה, מנטרת ומחליפה חומרה</td><td>ה-data חייב להישאר במקום, latency של ms בודדים למערכות מקומיות, ואותם APIs של EC2, EBS, ECS, EKS ו-RDS כמו ב-region</td></tr>
<tr><td><strong>Local Zones</strong></td><td>אתר של AWS בעיר גדולה (למשל לוס אנג'לס, <code>us-west-2-lax-1</code>)</td><td>AWS</td><td>Latency של ms בודדים למשתמשים באותה עיר: שרתי משחקים, רינדור מדיה, וידאו חי, וגם data residency מקומי</td></tr>
<tr><td><strong>Wavelength Zones</strong></td><td>בתוך ה-edge של רשת 5G של מפעיל סלולר</td><td>AWS יחד עם המפעיל</td><td>Latency נמוך במיוחד למכשירים ניידים: AR/VR, רכבים מחוברים, ניתוח וידאו חי; התעבורה יוצאת דרך <em>carrier gateway</em></td></tr>
</table>
<p>שלושתם הם <strong>הרחבות של parent region</strong>: יוצרים בהם subnet בתוך ה-VPC הקיים, וה-control plane (IAM, APIs והרבה שירותים מנוהלים) נשאר ב-region. ה-Outposts צריך <em>service link</em> חזרה ל-region; אם הלינק נופל, ה-instances שרצים ממשיכים לרוץ מקומית אבל אי אפשר להרים או לשנות דברים. ל-Local Zones ול-Wavelength Zones עושים opt-in, ויש בהם פחות סוגי instances ושירותים מאשר ב-region מלא.</p>
<blockquote>⚠️ Production tip: Outpost זו קיבולת שקונים מראש (התחייבות ל-3 שנים). מתכננים אותה לכשל: אם צריך N שרתים מסוג מסוים, מזמינים N+1, כי שרת שמת מוחלף על ידי AWS לפי SLA של חומרה, לא תוך שניות.</blockquote>`
      }
    },
    {
      h: { en: "Moving bytes and the Snow family today", he: "להזיז bytes, ומה קורה היום עם משפחת Snow" },
      body: {
        en: `<p><strong>AWS DataSync</strong> is the online answer: an agent near the source copies NFS, SMB, HDFS or object storage to S3, EFS or FSx with verification, scheduling and bandwidth limits. Over a 10 Gbps DX it moves ~100 TB in about a day.</p>
<p><strong>The Snow family</strong> was the offline answer and still shows up in SAA-C03 questions:</p>
<ul>
<li><strong>Snowcone</strong>: small 8-14 TB device, rugged, could run DataSync inside. <strong>Discontinued in 2024.</strong></li>
<li><strong>Snowball Edge Storage Optimized</strong>: tens to ~200 TB per device for bulk transfer; <strong>Compute Optimized</strong>: vCPUs and optional GPU for edge processing in disconnected sites (ships, mines, field hospitals).</li>
<li>AWS has closed Snowball Edge to new customers and <strong>ends Snowball support on 31 December 2026</strong>. For new projects: DataSync over a bigger DX, AWS Data Transfer Terminal (bring your own disks to an AWS facility), or Outposts servers for disconnected edge compute.</li>
</ul>
<p>Exam rule of thumb that still holds as math: if the online transfer would take more than about a week, or would saturate the link production uses, an offline path wins.</p>
<p><strong>Other clouds, in one paragraph:</strong> Azure's hybrid story is <strong>Azure Arc</strong> (project servers, Kubernetes clusters and SQL anywhere into Azure for policy, monitoring and GitOps) plus <strong>Azure Local</strong> (formerly Azure Stack HCI) for hardware on site, and <strong>Azure Data Box</strong> for offline transfer. Google's is <strong>Google Distributed Cloud</strong> (connected or fully air-gapped racks running GKE in your site or at the edge) and <strong>Transfer Appliance</strong>. Arc is mostly a management plane over servers you already have; Outposts and Distributed Cloud are the vendor's hardware in your building.</p>`,
        he: `<p><strong>AWS DataSync</strong> הוא הפתרון ה-online: מריצים agent קרוב למקור, והוא מעתיק NFS, SMB, HDFS או אחסון אובייקטים אל S3, EFS או FSx, עם אימות, תזמון והגבלת bandwidth. על DX של 10 Gbps הוא מעביר בערך 100 TB ביום.</p>
<p><strong>משפחת Snow</strong> הייתה הפתרון ה-offline, והיא עדיין מופיעה בשאלות של SAA-C03:</p>
<ul>
<li><strong>Snowcone</strong>: מכשיר קטן ומחוספס של 8-14 TB, שיכל להריץ DataSync בפנים. <strong>הופסק ב-2024.</strong></li>
<li><strong>Snowball Edge Storage Optimized</strong>: מעשרות TB ועד כ-200 TB למכשיר, להעברה מסיבית; <strong>Compute Optimized</strong>: vCPUs ו-GPU אופציונלי לעיבוד ב-edge באתרים מנותקים (ספינות, מכרות, בתי חולים שדה).</li>
<li>AWS סגרה את Snowball Edge ללקוחות חדשים ו<strong>מפסיקה את התמיכה ב-Snowball ב-31 בדצמבר 2026</strong>. לפרויקטים חדשים: DataSync על DX גדול יותר, AWS Data Transfer Terminal (מביאים דיסקים משלך לאתר של AWS), או Outposts servers ל-compute באתר מנותק.</li>
</ul>
<p>כלל האצבע של המבחן עדיין נכון כחשבון: אם ההעברה ה-online תיקח יותר משבוע בערך, או תחנוק את הלינק שהפרוד משתמש בו, דרך offline מנצחת.</p>
<p><strong>שאר העננים, בפסקה אחת:</strong> ב-Azure הסיפור ההיברידי הוא <strong>Azure Arc</strong> (מחבר שרתים, Kubernetes clusters ו-SQL מכל מקום ל-Azure בשביל policy, ניטור ו-GitOps), יחד עם <strong>Azure Local</strong> (לשעבר Azure Stack HCI) לחומרה באתר, ו-<strong>Azure Data Box</strong> להעברה offline. ב-Google זה <strong>Google Distributed Cloud</strong> (racks מחוברים או air-gapped לגמרי שמריצים GKE אצלך או ב-edge) וגם <strong>Transfer Appliance</strong>. Arc הוא בעיקר שכבת ניהול מעל שרתים שכבר יש לך; Outposts ו-Distributed Cloud הם החומרה של הספק בתוך הבניין שלך.</p>`
      }
    },
    {
      h: { en: "Decision table: requirement → service", he: "טבלת החלטה: דרישה ← שירות" },
      body: {
        en: `<table>
<tr><th>Requirement</th><th>Service</th></tr>
<tr><td>On-prem apps keep NFS/SMB, data must land in S3</td><td>S3 File Gateway</td></tr>
<tr><td>Replace physical tape, keep backup software</td><td>Tape Gateway</td></tr>
<tr><td>iSCSI volumes, full data set local with cloud backup</td><td>Volume Gateway (stored)</td></tr>
<tr><td>Private, consistent bandwidth to AWS</td><td>Direct Connect (+ VPN backup)</td></tr>
<tr><td>Encrypted link to AWS by tomorrow</td><td>Site-to-Site VPN</td></tr>
<tr><td>Data must not leave our building, but we want AWS APIs</td><td>Outposts</td></tr>
<tr><td>Single-digit ms to users in a specific city</td><td>Local Zones</td></tr>
<tr><td>Ultra-low latency to 5G mobile devices</td><td>Wavelength</td></tr>
<tr><td>Repeated online copy of file shares to S3/EFS/FSx</td><td>DataSync</td></tr>
<tr><td>Hundreds of TB over a weak link, one time</td><td>Offline transfer (Snowball while supported; Data Transfer Terminal)</td></tr>
</table>
<p>Two drivers decide most of these: <strong>latency</strong> (speed of light in fiber is ~5 µs per km, so 1,000 km is ~10 ms round trip before any processing) and <strong>data residency</strong> (law or contract says the data stays in a country or a building). If there's a full AWS region in the right country, a region beats any edge option; edge services exist for when there isn't.</p>`,
        he: `<table>
<tr><th>דרישה</th><th>שירות</th></tr>
<tr><td>אפליקציות on-prem נשארות עם NFS או SMB, וה-data צריך לנחות ב-S3</td><td>S3 File Gateway</td></tr>
<tr><td>להחליף טייפים פיזיים ולהשאיר את תוכנת הגיבוי</td><td>Tape Gateway</td></tr>
<tr><td>Volumes של iSCSI, כל ה-data מקומי עם גיבוי בענן</td><td>Volume Gateway במצב stored</td></tr>
<tr><td>Bandwidth פרטי ויציב ל-AWS</td><td>Direct Connect עם VPN כגיבוי</td></tr>
<tr><td>חיבור מוצפן ל-AWS עד מחר</td><td>Site-to-Site VPN</td></tr>
<tr><td>ה-data אסור לו לצאת מהבניין, אבל רוצים את ה-APIs של AWS</td><td>Outposts</td></tr>
<tr><td>Latency של ms בודדים למשתמשים בעיר מסוימת</td><td>Local Zones</td></tr>
<tr><td>Latency נמוך במיוחד למכשירי 5G</td><td>Wavelength</td></tr>
<tr><td>העתקה online חוזרת של file shares אל S3, EFS או FSx</td><td>DataSync</td></tr>
<tr><td>מאות TB על לינק חלש, פעם אחת</td><td>העברה offline (Snowball כל עוד נתמך, או Data Transfer Terminal)</td></tr>
</table>
<p>שני גורמים מכריעים את רוב ההחלטות: <strong>latency</strong> (מהירות האור בסיב היא בערך 5 מיקרו-שניות לכל ק"מ, אז 1,000 ק"מ זה בערך 10 ms הלוך-חזור עוד לפני עיבוד) ו-<strong>data residency</strong> (חוק או חוזה שקובעים שה-data נשאר במדינה או בבניין). אם יש region מלא של AWS במדינה הנכונה, הוא עדיף על כל אפשרות edge; שירותי ה-edge קיימים בשביל המקרים שאין.</p>`
      }
    }
  ],
  diagram: `  ON-PREM SITE                                      AWS REGION (parent)
 +------------------------------+                 +----------------------------+
 | NFS/SMB  -> S3 File Gateway  |==== DX ========>| S3 / Glacier / EBS snaps   |
 | iSCSI    -> Volume Gateway   |  (VPN backup)   | control plane, IAM, APIs   |
 | VTL      -> Tape Gateway     |                 +-------------+--------------+
 | DataSync agent ------------->|---- data ------>|             |
 | [ Outposts rack ] <== service link ===========>| VPC spans:  |
 +------------------------------+                 |   region AZ subnets        |
                                                  |   Local Zone subnet (metro) |
   Users in city  ---- few ms ---> Local Zone     |   Wavelength subnet (5G)   |
   5G phone/car   ---- few ms ---> Wavelength ----+-- carrier gateway          |
   Remote ship/mine: offline device ~~ shipped ~~> S3                          |`,
  handsOn: [
    { cmd: "aws ec2 describe-availability-zones --all-availability-zones --filters Name=zone-type,Values=local-zone,wavelength-zone --query 'AvailabilityZones[].[ZoneName,ZoneType,OptInStatus,ParentZoneName]' --output table", what: { en: "List Local Zones and Wavelength Zones in this region, whether you've opted in, and their parent AZ.", he: "מציג את ה-Local Zones וה-Wavelength Zones ב-region, האם עשית opt-in, ומה ה-AZ שהם שייכים אליו." } },
    { cmd: "aws ec2 modify-availability-zone-group --region us-west-2 --group-name us-west-2-lax-1 --opt-in-status opted-in", what: { en: "Opt in to the Los Angeles Local Zone; then create a subnet in your VPC with <code>--availability-zone us-west-2-lax-1a</code>.", he: "עושה opt-in ל-Local Zone של לוס אנג'לס; אחר כך יוצרים subnet ב-VPC, עם הדגל <code>--availability-zone us-west-2-lax-1a</code> בפקודה." } },
    { cmd: "aws storagegateway list-gateways --query 'Gateways[].[GatewayName,GatewayType,GatewayOperationalState]' --output table", what: { en: "See your gateways and their type (FILE_S3, CACHED, STORED, VTL) and whether they're running.", he: "מציג את ה-gateways, את הסוג שלהם (FILE_S3, CACHED, STORED, VTL) והאם הם רצים." } },
    { cmd: "aws datasync create-task --source-location-arn $NFS_LOC --destination-location-arn $S3_LOC --options VerifyMode=ONLY_FILES_TRANSFERRED,BytesPerSecond=62500000 --name nas-to-s3 && aws datasync start-task-execution --task-arn $TASK_ARN", what: { en: "Create a DataSync task capped at 500 Mbps (62.5 MB/s) with verification, then run it. Re-runs copy only changes.", he: "יוצרים task של DataSync עם הגבלה ל-500 Mbps (62.5 MB/s) ועם אימות, ומריצים אותו. הרצות חוזרות מעתיקות רק שינויים." } },
    { cmd: "aws outposts list-outposts --query 'Outposts[].[Name,OutpostId,AvailabilityZone,LifeCycleStatus]' --output table && aws directconnect describe-connections --query 'connections[].[connectionName,bandwidth,connectionState,location]' --output table", what: { en: "Inventory hybrid footprint: your Outposts (and the AZ they anchor to) and Direct Connect links with their bandwidth and state.", he: "מלאי של ה-footprint ההיברידי: ה-Outposts שלך (וה-AZ שהם מעוגנים אליו), וחיבורי Direct Connect עם ה-bandwidth והמצב שלהם." } }
  ],
  mnemonic: {
    en: "\"Gateway = protocol bridge, Outposts = AWS in MY building, Local Zone = AWS in my CITY, Wavelength = AWS in the CELL network, DataSync/Snow = move the BYTES.\"",
    he: "\"Gateway זה גשר פרוטוקולים, Outposts זה AWS בבניין שלי, Local Zone זה AWS בעיר שלי, Wavelength זה AWS ברשת הסלולר, ו-DataSync או Snow מזיזים את ה-bytes.\""
  },
  pitfalls: [
    { en: "Picking Volume Gateway cached when the app needs low-latency access to the whole data set: cache misses go to S3 over the WAN. Stored mode keeps everything local.", he: "לבחור Volume Gateway במצב cached כשהאפליקציה צריכה גישה ב-latency נמוך לכל ה-data: כל cache miss יוצא ל-S3 דרך ה-WAN. במצב stored הכל נשאר מקומי." },
    { en: "Assuming Direct Connect is encrypted. It's private, not encrypted: use MACsec or a VPN over DX if the requirement says encryption in transit.", he: "להניח ש-Direct Connect מוצפן. הוא פרטי, לא מוצפן: אם הדרישה היא הצפנה בתעבורה, משתמשים ב-MACsec או ב-VPN מעל ה-DX." },
    { en: "Treating Outposts or a Local Zone as a full region. The control plane is in the parent region, service lists are shorter, and an Outpost that loses its service link can't launch new instances.", he: "להתייחס ל-Outposts או ל-Local Zone כאל region מלא. ה-control plane נמצא ב-parent region, רשימת השירותים קצרה יותר, ו-Outpost שמאבד את ה-service link לא יכול להרים instances חדשים." },
    { en: "Designing a new 2027 migration around Snowball. It's closed to new customers and support ends 31 Dec 2026; plan DataSync over DX or Data Transfer Terminal instead.", he: "לתכנן מיגרציה חדשה ל-2027 סביב Snowball. הוא סגור ללקוחות חדשים והתמיכה בו נגמרת ב-31 בדצמבר 2026; מתכננים במקום זה DataSync על DX או Data Transfer Terminal." }
  ],
  interview: [
    {
      q: { en: "A hospital must keep patient imaging on premises by law, but wants to run its new analytics on EKS with the same tooling as its cloud teams. What do you propose?", he: "בית חולים חייב לפי חוק לשמור הדמיות של מטופלים בתוך המתחם, אבל רוצה להריץ את ה-analytics החדש שלו על EKS עם אותם כלים כמו צוותי הענן. מה אתה מציע?" },
      a: { en: "AWS Outposts (rack or servers sized N+1) in the hospital datacenter, with an EKS node group, EBS and S3 on Outposts so data stays on site, managed through the same APIs, IaC and IAM as the region. A resilient service link (two DX or DX + VPN) to the parent region for the control plane; plan what happens if it drops (running workloads continue, no new launches). Only de-identified aggregates leave the site. If they already own hardware and only need unified management, Azure Arc or EKS Hybrid Nodes are the lighter alternatives.", he: "AWS Outposts (rack או servers בגודל N+1) ב-datacenter של בית החולים, עם node group של EKS, EBS ו-S3 on Outposts כך שה-data נשאר במקום, ומנוהל באותם APIs, IaC ו-IAM כמו ה-region. נדרש service link עמיד (שני DX או DX עם VPN) ל-parent region בשביל ה-control plane, ומתכננים מה קורה כשהוא נופל (workloads שרצים ממשיכים, אבל אין הרמות חדשות). רק נתונים מצרפיים ומותממים יוצאים מהאתר. אם כבר יש להם חומרה והם צריכים רק ניהול אחיד, Azure Arc או EKS Hybrid Nodes הם חלופות קלות יותר." }
    },
    {
      q: { en: "Local Zones vs Wavelength vs CloudFront: how do you choose for a low-latency app?", he: "Local Zones מול Wavelength מול CloudFront: איך בוחרים לאפליקציה שצריכה latency נמוך?" },
      a: { en: "If the content is cacheable or the logic fits edge functions, CloudFront's hundreds of PoPs are cheapest and simplest. If you need real compute (game servers, rendering, a database replica) near users in one metro, Local Zones. If the clients are on a 5G carrier network and you need to avoid even the hop out to the internet, Wavelength, with a carrier gateway. In all three the control plane and the rest of the stack stay in the parent region.", he: "אם התוכן ניתן ל-cache או שהלוגיקה נכנסת ל-edge functions, מאות ה-PoPs של CloudFront הם הפתרון הזול והפשוט. אם צריך compute אמיתי (שרתי משחק, רינדור, replica של database) ליד משתמשים בעיר אחת, בוחרים ב-Local Zones. אם הלקוחות על רשת 5G של מפעיל וצריך לחסוך אפילו את ה-hop החוצה לאינטרנט, בוחרים ב-Wavelength עם carrier gateway. בכל השלושה ה-control plane ושאר ה-stack נשארים ב-parent region." }
    }
  ],
  quiz: [
    {
      q: { en: "A company wants to stop shipping physical tapes offsite but keep its existing backup application unchanged. Which service?", he: "חברה רוצה להפסיק לשלוח טייפים פיזיים החוצה, אבל להשאיר את אפליקציית הגיבוי הקיימת בלי שינוי. איזה שירות?" },
      options: [
        { en: "S3 File Gateway", he: "S3 File Gateway" },
        { en: "Tape Gateway", he: "Tape Gateway" },
        { en: "AWS DataSync", he: "AWS DataSync" },
        { en: "Volume Gateway, cached", he: "Volume Gateway במצב cached" }
      ],
      answer: 1,
      explain: { en: "Tape Gateway presents an iSCSI virtual tape library the backup software already knows, storing tapes in S3 and archiving to Glacier.", he: "Tape Gateway מציג ספריית טייפים וירטואלית על iSCSI שתוכנת הגיבוי כבר מכירה, שומר את הטייפים ב-S3 ומארכב ל-Glacier." }
    },
    {
      q: { en: "Regulation says data must never leave the factory, but the team wants EC2 and EBS with the same APIs as the region. Which service?", he: "הרגולציה אומרת שה-data לעולם לא יוצא מהמפעל, אבל הצוות רוצה EC2 ו-EBS עם אותם APIs כמו ב-region. איזה שירות?" },
      options: [
        { en: "A Local Zone in the nearest city", he: "Local Zone בעיר הקרובה" },
        { en: "Wavelength", he: "Wavelength" },
        { en: "AWS Outposts", he: "AWS Outposts" },
        { en: "Direct Connect to the nearest region", he: "Direct Connect ל-region הקרוב" }
      ],
      answer: 2,
      explain: { en: "Only Outposts puts AWS-managed compute and storage physically inside your site. A Local Zone is still an AWS facility outside the factory, and Direct Connect only connects you to the region.", he: "רק Outposts שם compute ואחסון שמנוהלים על ידי AWS פיזית בתוך האתר שלך. Local Zone הוא עדיין מתקן של AWS מחוץ למפעל, ו-Direct Connect רק מחבר אותך ל-region." }
    },
    {
      q: { en: "Which statement about AWS Direct Connect is true?", he: "איזו טענה על AWS Direct Connect נכונה?" },
      options: [
        { en: "It is encrypted by default with IPsec", he: "הוא מוצפן כברירת מחדל ב-IPsec" },
        { en: "It can be provisioned in a few minutes from the console", he: "אפשר להקים אותו בכמה דקות מהקונסול" },
        { en: "It's a private, consistent link but not encrypted by default; add MACsec or a VPN for encryption", he: "זה לינק פרטי ויציב אבל לא מוצפן כברירת מחדל; מוסיפים MACsec או VPN בשביל הצפנה" },
        { en: "It's limited to 1.25 Gbps per connection", he: "הוא מוגבל ל-1.25 Gbps לחיבור" }
      ],
      answer: 2,
      explain: { en: "DX is private fiber, takes weeks to provision, and offers 1-400 Gbps dedicated. 1.25 Gbps per tunnel and IPsec-by-default describe Site-to-Site VPN.", he: "DX הוא סיב פרטי, ההקמה שלו לוקחת שבועות, והוא מציע חיבור ייעודי של 1 עד 400 Gbps. 1.25 Gbps ל-tunnel והצפנת IPsec כברירת מחדל מתארים את Site-to-Site VPN." }
    },
    {
      q: { en: "A multiplayer game needs single-digit ms latency for players in Los Angeles; the nearest region is ~15-20 ms away. Best fit?", he: "משחק multiplayer צריך latency של ms בודדים לשחקנים בלוס אנג'לס; ה-region הקרוב נמצא במרחק של כ-15-20 ms. מה הכי מתאים?" },
      options: [
        { en: "Run game servers in the Los Angeles Local Zone", he: "להריץ את שרתי המשחק ב-Local Zone של לוס אנג'לס" },
        { en: "Order an Outpost for each player's home", he: "להזמין Outpost לבית של כל שחקן" },
        { en: "Use an S3 File Gateway", he: "להשתמש ב-S3 File Gateway" },
        { en: "Put the game servers behind a bigger Direct Connect", he: "לשים את שרתי המשחק מאחורי Direct Connect גדול יותר" }
      ],
      answer: 0,
      explain: { en: "Local Zones put EC2 in the metro, close to end users, as a subnet of your VPC. Outposts is for your own sites; DX connects your datacenter, not players.", he: "Local Zones שמים EC2 בעיר, קרוב למשתמשי הקצה, כ-subnet ב-VPC שלך. Outposts מיועד לאתרים שלך; ו-DX מחבר את ה-datacenter שלך, לא את השחקנים." }
    }
  ],
  related: ["net-hybrid-connectivity", "cloud-storage", "cloud-regions-azs", "cloud-migration-strategy", "cloud-airgapped", "net-proxies-cdn"]
});

INFRA.glossary.push(
  { term: "7 Rs (migration strategies)", track: "cloud", def: { en: "Retire, retain, rehost, relocate, repurchase, replatform, refactor: the per-application choices when moving to the cloud.", he: "Retire, retain, rehost, relocate, repurchase, replatform, refactor: האפשרויות לכל אפליקציה במעבר לענן." }, lesson: "cloud-migration-strategy", aliases: ["7 Rs", "6 Rs"] },
  { term: "Rehost (lift and shift)", track: "cloud", def: { en: "Moving a server to cloud VMs unchanged: same OS, same app, new infrastructure.", he: "העברת שרת ל-VM-ים בענן בלי שינוי: אותו OS, אותה אפליקציה, תשתית חדשה." }, lesson: "cloud-migration-strategy", aliases: ["lift and shift", "lift-and-shift", "rehost"] },
  { term: "Replatform", track: "cloud", def: { en: "Migrating with small changes to use managed services (e.g. self-run MySQL to RDS) without redesigning the app.", he: "מיגרציה עם שינויים קטנים כדי להשתמש בשירותים מנוהלים (למשל MySQL שמנוהל ידנית עובר ל-RDS) בלי לתכנן את האפליקציה מחדש." }, lesson: "cloud-migration-strategy" },
  { term: "AWS Application Migration Service (MGN)", track: "cloud", def: { en: "AWS rehost tool (now branded AWS Transform MGN): block-level continuous replication of servers, test launches, then a minutes-long cutover to EC2.", he: "כלי ה-rehost של AWS (היום בשם AWS Transform MGN): שכפול רציף של שרתים ברמת block, הרמות בדיקה, ואז cutover של דקות ל-EC2." }, lesson: "cloud-migration-strategy", aliases: ["MGN", "Application Migration Service"] },
  { term: "AWS DMS", track: "cloud", def: { en: "Database Migration Service: full load plus CDC replication between database engines, so cutover needs only a brief write freeze.", he: "Database Migration Service: full load ועוד שכפול CDC בין מנועי database, כך שה-cutover דורש רק הקפאת כתיבות קצרה." }, lesson: "cloud-migration-strategy", aliases: ["DMS", "Database Migration Service"] },
  { term: "Migration wave", track: "cloud", def: { en: "A batch of move groups (apps that must move together) migrated in one planned window, typically 20-50 servers.", he: "קבוצה של move groups (אפליקציות שחייבות לעבור יחד) שעוברת בחלון מתוכנן אחד, בדרך כלל 20-50 שרתים." }, lesson: "cloud-migration-strategy", aliases: ["move group", "wave planning"] },
  { term: "Storage Gateway", track: "cloud", def: { en: "On-prem appliance/VM that exposes NFS/SMB (S3 File), iSCSI (Volume) or virtual tape (Tape) and stores the data in AWS with a local cache.", he: "Appliance או VM ב-on-prem שחושף NFS או SMB (S3 File), iSCSI (Volume) או טייפ וירטואלי (Tape), ושומר את ה-data ב-AWS עם cache מקומי." }, lesson: "cloud-hybrid-edge", aliases: ["S3 File Gateway", "Tape Gateway", "Volume Gateway"] },
  { term: "AWS Outposts", track: "cloud", def: { en: "AWS-managed racks or servers installed in your own site, running EC2, EBS, EKS and more with the parent region's APIs.", he: "Racks או שרתים שמנוהלים על ידי AWS ומותקנים באתר שלך, ומריצים EC2, EBS, EKS ועוד עם ה-APIs של ה-parent region." }, lesson: "cloud-hybrid-edge", aliases: ["Outposts", "Outpost"] },
  { term: "Local Zone", track: "cloud", def: { en: "An AWS-run extension of a region in a large metro, giving single-digit ms latency to users there; opt-in, used as a VPC subnet.", he: "הרחבה של region ש-AWS מפעילה בעיר גדולה, עם latency של ms בודדים למשתמשים שם; עושים opt-in ומשתמשים בה כ-subnet ב-VPC." }, lesson: "cloud-hybrid-edge", aliases: ["Local Zones", "AWS Local Zones"] },
  { term: "AWS Wavelength", track: "cloud", def: { en: "AWS compute embedded in a telecom carrier's 5G network edge for ultra-low latency to mobile devices, reached via a carrier gateway.", he: "Compute של AWS שמשובץ ב-edge של רשת 5G של מפעיל סלולר, ל-latency נמוך במיוחד למכשירים ניידים, דרך carrier gateway." }, lesson: "cloud-hybrid-edge", aliases: ["Wavelength", "Wavelength Zone"] },
  { term: "AWS DataSync", track: "cloud", def: { en: "Online transfer service: an agent copies NFS/SMB/HDFS/object data to S3, EFS or FSx with verification, scheduling and bandwidth limits.", he: "שירות העברה online: מריצים agent שמעתיק data מ-NFS, SMB, HDFS או אחסון אובייקטים אל S3, EFS או FSx, עם אימות, תזמון והגבלת bandwidth." }, lesson: "cloud-hybrid-edge", aliases: ["DataSync"] },
  { term: "Snowball Edge", track: "cloud", def: { en: "Rugged AWS device for offline bulk transfer and disconnected edge compute; closed to new customers, support ends 31 Dec 2026.", he: "מכשיר מחוספס של AWS להעברה offline של כמויות גדולות ול-compute באתרים מנותקים; סגור ללקוחות חדשים, והתמיכה נגמרת ב-31 בדצמבר 2026." }, lesson: "cloud-hybrid-edge", aliases: ["Snowball", "Snowcone", "Snow family"] }
);

// --- w3.js (syllabus gap) ---
INFRA.lessons.push({
  id: "aws-ec2-auto-scaling",
  track: "cloud",
  order: 62,
  icon: "📈",
  level: 2,
  minutes: 14,
  title: { en: "EC2 Auto Scaling Groups in Production", he: "איך ASG באמת עובד: EC2 Auto Scaling בפרודקשן" },
  tldr: {
    en: "An Auto Scaling group keeps N healthy copies of one launch template spread across AZs: a target-tracking policy (e.g. CPU 50%) moves desired between min and max, health checks replace broken instances, lifecycle hooks drain them before termination, and instance refresh rolls out a new AMI without downtime.",
    he: "ASG שומר N עותקים בריאים של אותו launch template, מפוזרים על פני כמה AZ-ים: policy של target tracking (למשל CPU על 50%) מזיז את ה-desired בין ה-min ל-max, ה-health checks מחליפים instance-ים שבורים, ה-lifecycle hooks מרוקנים אותם לפני כיבוי, ו-instance refresh מגלגל AMI חדש בלי downtime."
  },
  analogy: {
    en: "An ASG is a restaurant manager with a staffing agency on speed dial. The launch template is the job description (uniform, recipes, training). Min/max is the budget: never fewer than 2 cooks, never more than 20. Target tracking is the rule \"keep every cook at about half capacity\". Health checks replace a cook who stopped cooking, a lifecycle hook lets him finish the plates on the stove before he leaves, and a warm pool is cooks already dressed and waiting in the back room.",
    he: "ASG זה מנהל מסעדה עם חברת כוח אדם על חיוג מהיר. ה-launch template הוא תיאור התפקיד: מדים, מתכונים, הכשרה. ה-min וה-max הם התקציב: אף פעם לא פחות מ-2 טבחים ולא יותר מ-20. ה-target tracking הוא הכלל \"כל טבח עובד בערך בחצי מהקצב שלו\". ה-health checks מחליפים טבח שהפסיק לבשל, lifecycle hook נותן לו לסיים את המנות שעל האש לפני שהוא הולך, ו-warm pool אלה טבחים שכבר לבושים ומחכים בחדר האחורי."
  },
  sections: [
    {
      h: { en: "Building blocks: launch template, min/max/desired, AZs", he: "אבני הבניין: launch template, min/max/desired ו-AZ-ים" },
      body: {
        en: `<p>An ASG is a <strong>controller loop</strong>: it compares the number of InService healthy instances to <strong>desired</strong> and launches or terminates until they match. Scaling policies only ever change <em>desired</em>, always clamped between <strong>min</strong> and <strong>max</strong>.</p>
<ul>
<li><strong>Launch template</strong> (versioned): AMI, instance type, security groups, instance profile (IAM role), user data, IMDSv2, EBS. Launch <em>configurations</em> are legacy; new accounts can't create them.</li>
<li><strong>Subnets in 2-3 AZs</strong>: the ASG spreads instances evenly across them and keeps rebalancing.</li>
<li><strong>Target groups</strong>: new instances register with the ALB/NLB automatically.</li>
</ul>
<pre>aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name web-asg \
  --launch-template LaunchTemplateName=web-lt,Version='7' \
  --min-size 2 --max-size 20 --desired-capacity 4 \
  --vpc-zone-identifier "subnet-aaa,subnet-bbb,subnet-ccc" \
  --target-group-arns arn:aws:elasticloadbalancing:eu-central-1:111122223333:targetgroup/web/abc123 \
  --health-check-type ELB --health-check-grace-period 120 \
  --default-instance-warmup 120</pre>
<p>Rule of thumb for sizing: <strong>min</strong> = what survives losing one AZ at normal load (e.g. 3 AZs × 1 = 3, or 2 per AZ for real prod), <strong>max</strong> = a cost and quota ceiling (check your vCPU service quota), and let the policy own <strong>desired</strong>. If you manage the ASG with Terraform, add <code>desired_capacity</code> to <code>ignore_changes</code> or every apply fights the autoscaler.</p>`,
        he: `<p>ASG הוא <strong>controller loop</strong>: הוא משווה את מספר ה-instance-ים הבריאים במצב InService ל-<strong>desired</strong>, ומרים או מוריד instance-ים עד שהם שווים. ה-scaling policies משנים רק את ה-<em>desired</em>, ותמיד בתוך הטווח שבין <strong>min</strong> ל-<strong>max</strong>.</p>
<ul>
<li><strong>Launch template</strong> (עם גרסאות): AMI, סוג instance, security groups, instance profile עם IAM role, user data, IMDSv2 ודיסקים. ה-launch configurations הם legacy, ו-accounts חדשים כבר לא יכולים ליצור אותם.</li>
<li><strong>Subnets ב-2 עד 3 AZ-ים</strong>: ה-ASG מפזר את ה-instance-ים שווה בשווה ביניהם ומאזן מחדש כל הזמן.</li>
<li><strong>Target groups</strong>: instance חדש נרשם ל-ALB או ל-NLB אוטומטית.</li>
</ul>
<pre>aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name web-asg \
  --launch-template LaunchTemplateName=web-lt,Version='7' \
  --min-size 2 --max-size 20 --desired-capacity 4 \
  --vpc-zone-identifier "subnet-aaa,subnet-bbb,subnet-ccc" \
  --target-group-arns arn:aws:elasticloadbalancing:eu-central-1:111122223333:targetgroup/web/abc123 \
  --health-check-type ELB --health-check-grace-period 120 \
  --default-instance-warmup 120</pre>
<p>כלל אצבע לגדלים: ה-<strong>min</strong> הוא מה שמחזיק עומס רגיל גם כשנופל AZ שלם (למשל 3 AZ-ים כפול 1 נותן 3, או 2 בכל AZ בפרודקשן אמיתי). ה-<strong>max</strong> הוא תקרה של עלות ו-quota, אז תבדוק את ה-service quota של ה-vCPU. את ה-<strong>desired</strong> משאירים ל-policy. אם אתה מנהל את ה-ASG ב-Terraform, תוסיף את <code>desired_capacity</code> ל-<code>ignore_changes</code>, אחרת כל apply נלחם ב-autoscaler.</p>`
      }
    },
    {
      h: { en: "Scaling policies: which one, when, with what numbers", he: "Scaling policies: איזו, מתי ועם אילו מספרים" },
      body: {
        en: `<table>
<tr><th>Policy</th><th>How it works</th><th>Use it when</th></tr>
<tr><td><strong>Target tracking</strong></td><td>You give a metric and a target (CPU 50%, or ALBRequestCountPerTarget 1000). AWS creates and owns the CloudWatch alarms: scale-out after ~3 one-minute datapoints above target, scale-in after ~15 below.</td><td>The default for 90% of web tiers. Thermostat-style, no tuning of step sizes.</td></tr>
<tr><td><strong>Step scaling</strong></td><td>Your own alarm with step adjustments: CPU 60-80% → +2, above 80% → +4 (or +30%).</td><td>You need a bigger jump for a bigger breach, or a metric target tracking can't express (queue depth with custom steps).</td></tr>
<tr><td><strong>Simple scaling</strong></td><td>One alarm, one adjustment, then waits for the <strong>cooldown</strong> (default 300 s) before reacting again.</td><td>Legacy. Avoid it; step and target tracking use instance warm-up instead of a blunt cooldown.</td></tr>
<tr><td><strong>Scheduled</strong></td><td>Cron actions that set min/max/desired at a time: <code>0 7 * * 0-4</code> raise min to 10, <code>0 20 * * *</code> drop it to 3.</td><td>Known peaks: business hours, a sale at 10:00, nightly batch.</td></tr>
<tr><td><strong>Predictive</strong></td><td>ML forecast of the next 48 h from up to 14 days of history (needs at least 24 h), launches capacity ahead of the curve. Start in <em>ForecastOnly</em> mode.</td><td>Daily or weekly cyclic traffic where boot time (minutes) is longer than the ramp. Combine with target tracking for the unexpected.</td></tr>
</table>
<pre>cat &gt; cpu50.json &lt;&lt;'EOF'
{
  "PredefinedMetricSpecification": { "PredefinedMetricType": "ASGAverageCPUUtilization" },
  "TargetValue": 50.0
}
EOF
aws autoscaling put-scaling-policy --auto-scaling-group-name web-asg \
  --policy-name cpu50 --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://cpu50.json</pre>
<p><strong>Instance warm-up</strong> (e.g. 120 s, set once with <code>--default-instance-warmup</code>) tells the ASG not to count a fresh instance's metrics until it has booted, so a cold JVM at 100% CPU doesn't trigger another scale-out. When several policies are active, the ASG picks the one that yields the <em>largest</em> capacity, so scale-out wins.</p>
<blockquote>💡 Real world: CPU is a proxy. For an ALB-fronted API, <code>ALBRequestCountPerTarget</code> tracks load more directly; for workers, scale on queue backlog per instance (a custom metric = ApproximateNumberOfMessagesVisible ÷ InService instances). Pick a target that leaves headroom for the 2-4 minutes a new instance needs to boot: 50-60% CPU, not 85%.</blockquote>`,
        he: `<table>
<tr><th>Policy</th><th>איך זה עובד</th><th>מתי משתמשים</th></tr>
<tr><td><strong>Target tracking</strong></td><td>נותנים metric ויעד, למשל CPU על 50% או ALBRequestCountPerTarget על 1000. ה-alarms של CloudWatch נוצרים ומנוהלים ע"י AWS: scale out אחרי בערך 3 נקודות של דקה מעל היעד, ו-scale in אחרי בערך 15 מתחת.</td><td>ברירת המחדל לרוב שכבות ה-web. עובד כמו תרמוסטט, בלי לכוונן גדלי קפיצות.</td></tr>
<tr><td><strong>Step scaling</strong></td><td>alarm משלך עם קפיצות לפי חומרה: CPU בין 60% ל-80% מוסיף 2, ומעל 80% מוסיף 4 (או 30%).</td><td>כשצריך קפיצה גדולה יותר על חריגה גדולה יותר, או metric ש-target tracking לא מבטא טוב.</td></tr>
<tr><td><strong>Simple scaling</strong></td><td>alarm אחד, שינוי אחד, ואז מחכה ל-<strong>cooldown</strong> (ברירת מחדל 300 s) לפני תגובה נוספת.</td><td>Legacy, עדיף להימנע. ה-step וה-target tracking משתמשים ב-warm-up של instance במקום cooldown גס.</td></tr>
<tr><td><strong>Scheduled</strong></td><td>פעולות cron שקובעות min/max/desired בשעה מסוימת: ב-<code>0 7 * * 0-4</code> מעלים את ה-min ל-10, וב-<code>0 20 * * *</code> מורידים ל-3.</td><td>שיאים ידועים מראש: שעות עבודה, מבצע ב-10:00, batch לילי.</td></tr>
<tr><td><strong>Predictive</strong></td><td>תחזית ML ל-48 השעות הבאות מתוך עד 14 ימי היסטוריה (צריך לפחות 24 שעות), ומרים קיבולת לפני העלייה. מתחילים במצב <em>ForecastOnly</em>.</td><td>תעבורה מחזורית יומית או שבועית, כשזמן העלייה של instance ארוך מהעלייה בעומס. משלבים עם target tracking בשביל הלא צפוי.</td></tr>
</table>
<pre>cat &gt; cpu50.json &lt;&lt;'EOF'
{
  "PredefinedMetricSpecification": { "PredefinedMetricType": "ASGAverageCPUUtilization" },
  "TargetValue": 50.0
}
EOF
aws autoscaling put-scaling-policy --auto-scaling-group-name web-asg \
  --policy-name cpu50 --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://cpu50.json</pre>
<p>ה-<strong>instance warm-up</strong> (למשל 120 s, מגדירים פעם אחת עם <code>--default-instance-warmup</code>) אומר ל-ASG לא לספור את ה-metrics של instance טרי עד שסיים לעלות, כדי ש-JVM קר על 100% CPU לא יגרום ל-scale out נוסף. כשכמה policies פעילים, ה-ASG בוחר את זה שנותן את הקיבולת <em>הגבוהה</em> ביותר, כך שה-scale out תמיד מנצח.</p>
<blockquote>💡 Real world: ה-CPU הוא רק קירוב. ל-API שיושב מאחורי ALB, ה-metric של <code>ALBRequestCountPerTarget</code> מודד עומס בצורה ישירה יותר; ל-workers עושים scale לפי backlog של התור לכל instance (custom metric של ApproximateNumberOfMessagesVisible חלקי מספר ה-instance-ים ב-InService). תבחר יעד שמשאיר מרווח ל-2 עד 4 הדקות ש-instance חדש צריך כדי לעלות: CPU של 50% עד 60%, לא 85%.</blockquote>`
      }
    },
    {
      h: { en: "Health checks, grace period, lifecycle hooks, warm pools", he: "Health checks, grace period, lifecycle hooks ו-warm pools" },
      body: {
        en: `<p><strong>EC2 health check</strong> (default) only knows the VM is running and passes its status checks. A hung process with a running VM stays InService forever. <strong>ELB health check</strong> (<code>--health-check-type ELB</code>) also marks an instance unhealthy when the target group says so, and the ASG replaces it. Use ELB for anything behind a load balancer.</p>
<p>The <strong>health check grace period</strong> (console default 300 s) is how long a new instance is excused from health checks while user data, package installs and app start-up run. Too short = the ASG kills instances that are still booting, launches new ones, kills those too: a replace loop.</p>
<p><strong>Lifecycle hooks</strong> pause an instance in <code>Pending:Wait</code> or <code>Terminating:Wait</code> (heartbeat timeout default 3600 s, max 7200 s) so you can act:</p>
<pre>aws autoscaling put-lifecycle-hook --auto-scaling-group-name web-asg \
  --lifecycle-hook-name drain --lifecycle-transition autoscaling:EC2_INSTANCE_TERMINATING \
  --heartbeat-timeout 300 --default-result CONTINUE

# from the instance (or a Lambda on the EventBridge event), when the work is done:
aws autoscaling complete-lifecycle-action --auto-scaling-group-name web-asg \
  --lifecycle-hook-name drain --instance-id i-0abc123 --lifecycle-action-result CONTINUE</pre>
<p>Typical uses: on terminate, finish in-flight jobs, flush logs, deregister from Consul; on launch, wait for config management or a cache warm-up before taking traffic. For HTTP behind an ALB the target group's <strong>deregistration delay</strong> (default 300 s, often lowered to 30-60 s) already drains connections.</p>
<p><strong>Warm pools</strong> keep pre-initialized instances <em>Stopped</em> (you pay only for EBS and Elastic IPs), <em>Hibernated</em> or <em>Running</em> next to the group. A scale-out then takes seconds to tens of seconds instead of minutes of boot + user data. Great for apps with a 5-10 minute start-up.</p>
<blockquote>⚠️ Production tip: ELB health checks + a dependency outage = mass replacement. If the health endpoint checks the database and the DB blips, every target fails and the ASG starts recycling the whole fleet. Keep <code>/healthz</code> shallow (process up, can serve) and put deep checks in monitoring, not in the replacement decision.</blockquote>`,
        he: `<p><strong>EC2 health check</strong> (ברירת המחדל) יודע רק שה-VM רץ ועובר את ה-status checks. תהליך תקוע על VM שרץ יישאר InService לנצח. <strong>ELB health check</strong> (<code>--health-check-type ELB</code>) מסמן instance כלא בריא גם כשה-target group אומר שהוא נופל, וה-ASG מחליף אותו. לכל דבר שיושב מאחורי load balancer משתמשים ב-ELB.</p>
<p>ה-<strong>health check grace period</strong> (ברירת המחדל בקונסול היא 300 s) הוא הזמן שבו instance חדש פטור מ-health checks, בזמן שה-user data, ההתקנות והאפליקציה עולים. קצר מדי, וה-ASG הורג instance-ים שעוד עולים, מרים חדשים והורג גם אותם: לולאת החלפות.</p>
<p>ה-<strong>lifecycle hooks</strong> עוצרים instance במצב <code>Pending:Wait</code> או <code>Terminating:Wait</code> (ה-heartbeat timeout הוא 3600 s כברירת מחדל ועד 7200 s) כדי שתוכל לפעול:</p>
<pre>aws autoscaling put-lifecycle-hook --auto-scaling-group-name web-asg \
  --lifecycle-hook-name drain --lifecycle-transition autoscaling:EC2_INSTANCE_TERMINATING \
  --heartbeat-timeout 300 --default-result CONTINUE

# from the instance (or a Lambda on the EventBridge event), when the work is done:
aws autoscaling complete-lifecycle-action --auto-scaling-group-name web-asg \
  --lifecycle-hook-name drain --instance-id i-0abc123 --lifecycle-action-result CONTINUE</pre>
<p>שימושים נפוצים: בכיבוי, לסיים jobs שבאמצע, לעשות flush ללוגים ולהוריד את ה-instance מ-Consul. בעלייה, לחכות ל-config management או לחימום cache לפני שמקבלים traffic. ל-HTTP מאחורי ALB, ה-<strong>deregistration delay</strong> של ה-target group (ברירת מחדל 300 s, ובדרך כלל מורידים ל-30 עד 60 שניות) כבר מרוקן את החיבורים.</p>
<p>ה-<strong>warm pools</strong> מחזיקים ליד הקבוצה instance-ים מאותחלים מראש במצב <em>Stopped</em> (משלמים רק על EBS ועל Elastic IP), <em>Hibernated</em> או <em>Running</em>. ככה scale out לוקח שניות עד עשרות שניות, במקום דקות של boot ו-user data. מצוין לאפליקציות שעולות 5 עד 10 דקות.</p>
<blockquote>⚠️ Production tip: שילוב של ELB health checks עם נפילה של תלות שווה החלפה המונית. אם ה-health endpoint בודק את ה-DB וה-DB מגמגם, כל ה-targets נכשלים וה-ASG מתחיל למחזר את כל הצי. תשאיר את <code>/healthz</code> רדוד (התהליך חי ויכול לשרת), ואת הבדיקות העמוקות תשים ב-monitoring ולא בהחלטה על החלפה.</blockquote>`
      }
    },
    {
      h: { en: "Instance refresh: rolling AMI updates", he: "Instance refresh: עדכון AMI בגלגול" },
      body: {
        en: `<p>Baking a new AMI (Packer, EC2 Image Builder) and bumping the launch template version doesn't touch running instances. <strong>Instance refresh</strong> replaces them in batches while keeping a floor of healthy capacity:</p>
<pre>aws autoscaling start-instance-refresh --auto-scaling-group-name web-asg \
  --desired-configuration '{"LaunchTemplate":{"LaunchTemplateName":"web-lt","Version":"8"}}' \
  --preferences '{"MinHealthyPercentage":90,"MaxHealthyPercentage":110,
                  "InstanceWarmup":120,"SkipMatching":true,
                  "CheckpointPercentages":[10,50,100],"CheckpointDelay":600,
                  "AutoRollback":true}'

aws autoscaling describe-instance-refreshes --auto-scaling-group-name web-asg</pre>
<ul>
<li><strong>MinHealthyPercentage 90</strong> on 20 instances = replace 2 at a time. <strong>MaxHealthyPercentage 110</strong> launches the new ones <em>before</em> terminating old ones (launch-before-terminate).</li>
<li><strong>Checkpoints</strong> pause at 10% and 50% so you can watch error rates: a built-in canary.</li>
<li><strong>AutoRollback</strong> (optionally tied to CloudWatch alarms) reverts to the previous launch template if replacements fail health checks.</li>
<li><strong>SkipMatching</strong> skips instances already on the target config, so a resumed refresh doesn't redo work.</li>
</ul>
<p>Related knobs: <strong>max instance lifetime</strong> (e.g. 7 days) recycles instances continuously so nothing drifts or keeps an old kernel; <strong>termination policies</strong> decide who goes first on scale-in (default: balance AZs, then oldest launch template, then closest to the next billing hour).</p>`,
        he: `<p>כשאופים AMI חדש (Packer, EC2 Image Builder) ומעלים גרסה ל-launch template, ה-instance-ים שכבר רצים לא משתנים. <strong>Instance refresh</strong> מחליף אותם במנות, תוך שמירה על רצפה של קיבולת בריאה:</p>
<pre>aws autoscaling start-instance-refresh --auto-scaling-group-name web-asg \
  --desired-configuration '{"LaunchTemplate":{"LaunchTemplateName":"web-lt","Version":"8"}}' \
  --preferences '{"MinHealthyPercentage":90,"MaxHealthyPercentage":110,
                  "InstanceWarmup":120,"SkipMatching":true,
                  "CheckpointPercentages":[10,50,100],"CheckpointDelay":600,
                  "AutoRollback":true}'

aws autoscaling describe-instance-refreshes --auto-scaling-group-name web-asg</pre>
<ul>
<li><strong>MinHealthyPercentage 90</strong> על 20 instance-ים אומר החלפה של 2 בכל פעם. <strong>MaxHealthyPercentage 110</strong> מרים את החדשים <em>לפני</em> שמכבים את הישנים.</li>
<li><strong>Checkpoints</strong> עוצרים ב-10% וב-50% כדי שתוכל להסתכל על אחוז השגיאות: canary מובנה.</li>
<li><strong>AutoRollback</strong> (אפשר לקשר ל-alarms של CloudWatch) מחזיר את ה-launch template הקודם אם ה-instance-ים החדשים נכשלים ב-health checks.</li>
<li><strong>SkipMatching</strong> מדלג על instance-ים שכבר בקונפיגורציה החדשה, כך ש-refresh שחודש לא עושה עבודה פעמיים.</li>
</ul>
<p>כפתורים קשורים: <strong>max instance lifetime</strong> (למשל 7 ימים) ממחזר instance-ים כל הזמן כדי ששום דבר לא יזלוג ולא יישאר עם kernel ישן. ה-<strong>termination policies</strong> קובעות מי יורד ראשון ב-scale in: כברירת מחדל קודם איזון בין AZ-ים, אחר כך ה-launch template הכי ישן, ואחר כך הקרוב ביותר לשעת החיוב הבאה.</p>`
      }
    },
    {
      h: { en: "Spot, mixed instances, AZ rebalancing, and Kubernetes", he: "Spot, mixed instances, איזון בין AZ-ים ו-Kubernetes" },
      body: {
        en: `<p>A <strong>mixed instances policy</strong> lets one ASG use several instance types and both purchase options:</p>
<pre>"MixedInstancesPolicy": {
  "LaunchTemplate": {
    "LaunchTemplateSpecification": { "LaunchTemplateName": "web-lt", "Version": "8" },
    "Overrides": [ {"InstanceType":"m7i.large"}, {"InstanceType":"m6i.large"},
                   {"InstanceType":"m6a.large"}, {"InstanceType":"m7g.large",
                    "LaunchTemplateSpecification": {"LaunchTemplateName":"web-lt-arm"}} ]
  },
  "InstancesDistribution": {
    "OnDemandBaseCapacity": 2,
    "OnDemandPercentageAboveBaseCapacity": 20,
    "SpotAllocationStrategy": "price-capacity-optimized"
  }
},
"CapacityRebalance": true</pre>
<p>Here the first 2 instances are On-Demand, and above that 20% On-Demand, 80% Spot (typically 60-90% cheaper). Spot gives a <strong>2-minute interruption notice</strong>; with <strong>Capacity Rebalancing</strong> the ASG reacts earlier, to the <em>rebalance recommendation</em>, by launching a replacement and then terminating the at-risk instance through your terminate lifecycle hook. More instance types (6-10 across families and generations) = more Spot pools = fewer interruptions.</p>
<p><strong>AZ rebalancing</strong>: if an AZ loses capacity or you add a subnet, the <code>AZRebalance</code> process evens things out, launching first and terminating after, so it can briefly exceed max (by up to 10%, or 1 instance). You can suspend it during an incident with <code>aws autoscaling suspend-processes --scaling-processes AZRebalance</code>.</p>
<p><strong>vs Kubernetes</strong>: the HPA is target tracking for Pods (replicas, not VMs); the Cluster Autoscaler scales <em>nodes</em> and on EKS literally changes the desired capacity of the node group's ASG when Pods are Pending; Karpenter skips ASGs and calls EC2 Fleet directly. Same ideas, one layer up (see the Kubernetes autoscaling lessons).</p>
<blockquote>💡 Real world: a common prod setup for a stateless API: 3 AZs, min 6, max 60, target tracking on <code>ALBRequestCountPerTarget</code>, a scheduled action raising min before the 09:00 peak, ELB health checks with a 120 s grace period, warm-up 120 s, On-Demand base 6 + 70% Spot across 8 instance types, and a weekly instance refresh from the latest patched AMI.</blockquote>`,
        he: `<p><strong>Mixed instances policy</strong> מאפשר ל-ASG אחד להשתמש בכמה סוגי instance ובשתי שיטות רכישה:</p>
<pre>"MixedInstancesPolicy": {
  "LaunchTemplate": {
    "LaunchTemplateSpecification": { "LaunchTemplateName": "web-lt", "Version": "8" },
    "Overrides": [ {"InstanceType":"m7i.large"}, {"InstanceType":"m6i.large"},
                   {"InstanceType":"m6a.large"}, {"InstanceType":"m7g.large",
                    "LaunchTemplateSpecification": {"LaunchTemplateName":"web-lt-arm"}} ]
  },
  "InstancesDistribution": {
    "OnDemandBaseCapacity": 2,
    "OnDemandPercentageAboveBaseCapacity": 20,
    "SpotAllocationStrategy": "price-capacity-optimized"
  }
},
"CapacityRebalance": true</pre>
<p>כאן 2 ה-instance-ים הראשונים הם On-Demand, ומעליהם 20% On-Demand ו-80% Spot (בדרך כלל זול ב-60% עד 90%). ה-Spot נותן <strong>התראה של 2 דקות</strong> לפני interruption. עם <strong>Capacity Rebalancing</strong> ה-ASG מגיב מוקדם יותר, כבר ל-<em>rebalance recommendation</em>: מרים מחליף ואז מכבה את ה-instance שבסיכון דרך ה-lifecycle hook של הכיבוי. יותר סוגי instance (6 עד 10 ממשפחות ודורות שונים) נותנים יותר Spot pools, ולכן פחות הפרעות.</p>
<p><strong>איזון בין AZ-ים</strong>: אם ל-AZ נגמרה קיבולת או שהוספת subnet, תהליך ה-<code>AZRebalance</code> מאזן מחדש. הוא קודם מרים ורק אחר כך מכבה, ולכן יכול לעבור לרגע את ה-max (בעד 10% או ב-instance אחד). בזמן תקלה אפשר להשהות אותו עם <code>aws autoscaling suspend-processes --scaling-processes AZRebalance</code>.</p>
<p><strong>מול Kubernetes</strong>: ה-HPA הוא target tracking ל-Pod-ים, כלומר replicas ולא VM-ים. ה-Cluster Autoscaler מגדיל <em>nodes</em>, וב-EKS הוא ממש משנה את ה-desired של ה-ASG של ה-node group כשיש Pod-ים ב-Pending. ה-Karpenter מדלג על ASG-ים וקורא ישירות ל-EC2 Fleet. אותם רעיונות, שכבה אחת למעלה (ראה את השיעורים על autoscaling ב-Kubernetes).</p>
<blockquote>💡 מהשטח: הגדרה נפוצה בפרודקשן ל-API בלי state היא שלושה AZ-ים, min של 6 ו-max של 60. מעליהם יש target tracking על <code>ALBRequestCountPerTarget</code>, ו-scheduled action שמעלה את ה-min לפני השיא של 09:00. יש health checks של ה-ELB עם grace period של 120 s, וגם warm-up של 120 s. הבסיס הוא 6 instance-ים מסוג On-Demand ועוד 70% Spot על פני 8 סוגי instance, ופעם בשבוע רץ instance refresh מה-AMI המעודכן האחרון.</blockquote>`
      }
    }
  ],
  diagram: `                 CloudWatch metrics (CPU, RequestCountPerTarget)
                                 |
                  scaling policies (target / step / scheduled / predictive)
                                 | set desired (min <= desired <= max)
                                 v
  launch template v8 ---> [ Auto Scaling group: web-asg ] <--- warm pool (Stopped)
                          /            |             \
                     AZ-a            AZ-b            AZ-c
                   i-1  i-2        i-3  i-4        i-5  i-6
                          \            |             /
                       ALB target group health checks (type ELB)
                          unhealthy -> terminate -> replace
     scale-in -> Terminating:Wait (lifecycle hook: drain) -> CONTINUE -> gone`,
  handsOn: [
    { cmd: "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names web-asg --query 'AutoScalingGroups[0].{min:MinSize,max:MaxSize,desired:DesiredCapacity,hc:HealthCheckType,grace:HealthCheckGracePeriod,instances:Instances[].[InstanceId,AvailabilityZone,LifecycleState,HealthStatus]}'",
      what: { en: "See min/max/desired, the health check type and grace period, and each instance's AZ, lifecycle state and health in one view.", he: "רואים במבט אחד את ה-min, ה-max וה-desired, את סוג ה-health check וה-grace period, ולכל instance את ה-AZ, ה-lifecycle state והבריאות." } },
    { cmd: "aws autoscaling describe-scaling-activities --auto-scaling-group-name web-asg --max-items 10 --query 'Activities[].[StartTime,StatusCode,Description,Cause]' --output table",
      what: { en: "The ASG's own audit log: why it launched or terminated each instance (alarm, health check, rebalance, refresh). First stop when capacity looks wrong.", he: "הלוג של ה-ASG עצמו: למה הוא הרים או הוריד כל instance, בגלל alarm, health check, rebalance או refresh. התחנה הראשונה כשהקיבולת נראית לא נכונה." } },
    { cmd: "aws autoscaling describe-policies --auto-scaling-group-name web-asg --query 'ScalingPolicies[].[PolicyName,PolicyType,TargetTrackingConfiguration.TargetValue]' --output table",
      what: { en: "List the scaling policies and their targets, and confirm there's no leftover simple-scaling policy fighting target tracking.", he: "רשימת ה-scaling policies והיעדים שלהם, ובדיקה שלא נשאר policy ישן של simple scaling שנלחם ב-target tracking." } },
    { cmd: "aws autoscaling set-desired-capacity --auto-scaling-group-name web-asg --desired-capacity 6 --honor-cooldown",
      what: { en: "Manually bump desired (e.g. before a launch). Target tracking may scale it back in later; for planned peaks prefer a scheduled action on min.", he: "מעלים את ה-desired ידנית, למשל לפני השקה. ה-target tracking עלול להוריד אותו בהמשך, אז לשיאים מתוכננים עדיף scheduled action שמעלה את ה-min." } },
    { cmd: "aws autoscaling start-instance-refresh --auto-scaling-group-name web-asg --preferences '{\"MinHealthyPercentage\":90,\"InstanceWarmup\":120,\"SkipMatching\":true}'",
      what: { en: "Roll every instance onto the current launch template version, 10% at a time; follow it with describe-instance-refreshes.", he: "מגלגל את כל ה-instance-ים לגרסה הנוכחית של ה-launch template, 10% בכל פעם. את ההתקדמות בודקים עם <code>describe-instance-refreshes</code> לאורך כל הגלגול." } }
  ],
  mnemonic: {
    en: "\"Template, Track, Check, Hook, Refresh\": the template says WHAT, the policy says HOW MANY, health checks say WHO's broken, hooks say WAIT, refresh says NEW AMI.",
    he: "\"Template, Track, Check, Hook, Refresh\": ה-template אומר מה, ה-policy אומר כמה, ה-health check אומר מי שבור, ה-hook אומר חכה, וה-refresh אומר AMI חדש."
  },
  pitfalls: [
    { en: "EC2-only health checks behind an ALB: the app hangs, the VM is fine, the ASG never replaces it and the ALB just routes around it at reduced capacity. Use --health-check-type ELB.", he: "Health checks של EC2 בלבד מאחורי ALB: האפליקציה תקועה, ה-VM תקין, ה-ASG לא מחליף אותו וה-ALB פשוט עוקף אותו עם פחות קיבולת. תשתמש ב-<code>--health-check-type ELB</code>." },
    { en: "Grace period shorter than boot time: instances are declared unhealthy while user data is still installing, replaced, and the group never stabilizes. Measure real boot-to-healthy time and add margin.", he: "Grace period קצר מזמן העלייה: instance-ים מוכרזים כלא בריאים בזמן שה-user data עוד מתקין, מוחלפים, והקבוצה אף פעם לא מתייצבת. תמדוד את הזמן האמיתי מ-boot ועד בריא, ותוסיף מרווח." },
    { en: "Terraform owning desired_capacity: every apply resets desired to the coded value and undoes the autoscaler, sometimes in the middle of a peak. Ignore changes to it.", he: "Terraform שמנהל את desired_capacity: כל apply מחזיר את ה-desired לערך שבקוד ומבטל את ה-autoscaler, לפעמים באמצע שיא. תגדיר עליו <code>ignore_changes</code>." },
    { en: "Spot with a single instance type: one pool, one price spike, and the whole Spot share is interrupted at once. Diversify across 6+ types and use price-capacity-optimized.", he: "Spot עם סוג instance יחיד: pool אחד, קפיצת מחיר אחת, וכל חלק ה-Spot נקטע בבת אחת. תפזר על פני 6 סוגים לפחות ותשתמש ב-price-capacity-optimized." }
  ],
  interview: [
    {
      q: { en: "Your ASG keeps launching and terminating instances every few minutes. How do you debug it?", he: "ה-ASG שלך מרים ומוריד instance-ים כל כמה דקות. איך אתה מדבג?" },
      a: { en: "Start with describe-scaling-activities to read the Cause. If it says the instance failed ELB health checks, compare boot-to-healthy time with the health check grace period and check the target group's health path, threshold and timeout; a deep /healthz that depends on the DB is a classic. If it's alarms, look for flapping: two policies fighting (scale-out on CPU, scale-in on something else), a missing instance warm-up so new instances' cold CPU triggers more scale-outs, or a target that sits right at normal load. Also check AZRebalance and a max instance lifetime that's too short.", he: "מתחיל ב-describe-scaling-activities וקורא את ה-Cause. אם כתוב שה-instance נכשל ב-ELB health checks, משווה בין הזמן מ-boot ועד בריא לבין ה-grace period, ובודק את ה-path, ה-threshold וה-timeout של ה-health check ב-target group. בדיקת <code>/healthz</code> עמוקה שתלויה ב-DB היא קלאסיקה. אם הסיבה היא alarms, מחפש flapping: שני policies שנלחמים זה בזה, warm-up חסר שגורם ל-CPU הקר של instance-ים חדשים להפעיל עוד scale out, או יעד שיושב בדיוק על העומס הרגיל. בודק גם את AZRebalance ו-max instance lifetime קצר מדי." }
    },
    {
      q: { en: "Traffic jumps 5x every weekday at 09:00 and new instances take 6 minutes to be ready. Design the scaling.", he: "התעבורה קופצת פי 5 בכל יום עבודה ב-09:00, ו-instance חדש צריך 6 דקות כדי להיות מוכן. תתכנן את ה-scaling." },
      a: { en: "Reactive target tracking alone will be 6+ minutes late, so add capacity ahead of time: a scheduled action raising min at 08:45 Sunday-Thursday (or predictive scaling, which learns the weekly cycle and pre-launches with a scheduling buffer). Keep target tracking (CPU 50% or requests per target) for unexpected spikes. Cut the 6 minutes: bake dependencies into the AMI instead of user data, and add a warm pool of Stopped instances. Scale-in is naturally slow (~15 min of low metrics) so the evening drop is safe.", he: "Target tracking ריאקטיבי לבד יאחר ב-6 דקות ויותר, אז מוסיפים קיבולת מראש: scheduled action שמעלה את ה-min ב-08:45 בימים א' עד ה', או predictive scaling שלומד את המחזור השבועי ומרים מראש עם scheduling buffer. משאירים target tracking על CPU של 50% או על requests לכל target בשביל קפיצות לא צפויות. מקצרים את 6 הדקות: אופים את התלויות לתוך ה-AMI במקום user data, ומוסיפים warm pool של instance-ים במצב Stopped. ה-scale in איטי מטבעו (בערך 15 דקות של metrics נמוכים), כך שהירידה בערב בטוחה." }
    }
  ],
  quiz: [
    {
      q: { en: "You want the fleet to stay around 50% average CPU with the least tuning. Which policy?", he: "אתה רוצה שהצי יישאר בערך על 50% CPU ממוצע עם מינימום כיוונון. איזה policy?" },
      options: [
        { en: "Simple scaling with a 300 s cooldown", he: "Simple scaling עם cooldown של 300 s" },
        { en: "Target tracking on ASGAverageCPUUtilization = 50", he: "Target tracking על ASGAverageCPUUtilization עם ערך 50" },
        { en: "Scheduled scaling every hour", he: "Scheduled scaling כל שעה" },
        { en: "Step scaling with ten steps", he: "Step scaling עם עשר מדרגות" }
      ],
      answer: 1,
      explain: { en: "Target tracking works like a thermostat: AWS creates the alarms and computes how many instances to add or remove to hold the metric at the target.", he: "Target tracking עובד כמו תרמוסטט: AWS יוצר את ה-alarms ומחשב כמה instance-ים להוסיף או להוריד כדי להחזיק את ה-metric על היעד." }
    },
    {
      q: { en: "New instances are terminated as unhealthy ~60 s after launch, while the app needs 3 minutes to start. What do you fix first?", he: "Instance-ים חדשים מוכרזים כלא בריאים ומוחלפים בערך 60 שניות אחרי העלייה, בזמן שהאפליקציה צריכה 3 דקות כדי לעלות. מה מתקנים קודם?" },
      options: [
        { en: "Switch the health check type from ELB to EC2", he: "להחליף את סוג ה-health check מ-ELB ל-EC2" },
        { en: "Raise max size", he: "להגדיל את ה-max" },
        { en: "Set the health check grace period above the real start-up time (e.g. 240 s)", he: "להגדיר grace period ארוך מזמן העלייה האמיתי, למשל 240 s" },
        { en: "Increase the cooldown to 600 s", he: "להגדיל את ה-cooldown ל-600 s" }
      ],
      answer: 2,
      explain: { en: "The grace period excuses a booting instance from health checks. Switching to EC2 checks hides the problem and loses app-level health; cooldown doesn't affect health replacement.", he: "ה-grace period פוטר instance שעולה מ-health checks. מעבר לבדיקות EC2 רק מסתיר את הבעיה ומאבד את הבריאות ברמת האפליקציה, וה-cooldown לא משפיע על החלפת instance-ים לא בריאים." }
    },
    {
      q: { en: "Workers must finish their current job (up to 4 minutes) before scale-in removes them. What do you use?", he: "Workers חייבים לסיים את ה-job הנוכחי (עד 4 דקות) לפני ש-scale in מוריד אותם. במה משתמשים?" },
      options: [
        { en: "A lifecycle hook on EC2_INSTANCE_TERMINATING with a ~300 s heartbeat, completed by the worker", he: "Lifecycle hook על EC2_INSTANCE_TERMINATING עם heartbeat של בערך 300 s, שה-worker משלים בסוף" },
        { en: "A longer health check grace period", he: "Grace period ארוך יותר" },
        { en: "A warm pool", he: "Warm pool" },
        { en: "Capacity Rebalancing", he: "Capacity Rebalancing" }
      ],
      answer: 0,
      explain: { en: "The terminate hook holds the instance in Terminating:Wait until complete-lifecycle-action (or the timeout). Warm pools speed up launches; grace period is about boot.", he: "ה-hook של הכיבוי מחזיק את ה-instance במצב Terminating:Wait עד ש-complete-lifecycle-action נקרא או עד ה-timeout. ה-warm pool מאיץ עליות, וה-grace period קשור ל-boot." }
    },
    {
      q: { en: "You baked a patched AMI and want all 40 instances on it with at least 90% capacity serving at all times. What's the native way?", he: "אפית AMI עם patches ואתה רוצה את כל 40 ה-instance-ים עליו, כשלפחות 90% מהקיבולת משרתת כל הזמן. מה הדרך המובנית?" },
      options: [
        { en: "Update the launch template; running instances pick it up on reboot", he: "לעדכן את ה-launch template, וה-instance-ים שרצים יקלטו אותו ב-reboot" },
        { en: "Set desired to 0 and back to 40", he: "להוריד את ה-desired ל-0 ולהחזיר ל-40" },
        { en: "Suspend AZRebalance and terminate instances by hand", he: "להשהות את AZRebalance ולכבות instance-ים ידנית" },
        { en: "Start an instance refresh with MinHealthyPercentage 90 (plus checkpoints and auto rollback)", he: "להריץ instance refresh עם MinHealthyPercentage 90, ועם checkpoints ו-auto rollback" }
      ],
      answer: 3,
      explain: { en: "A launch template change never touches running instances. Instance refresh replaces them in batches respecting the healthy floor, with checkpoints and rollback; desired 0 is a full outage.", he: "שינוי ב-launch template אף פעם לא נוגע ב-instance-ים שרצים. Instance refresh מחליף אותם במנות תוך שמירה על רצפת הבריאות, עם checkpoints ו-rollback. הורדת ה-desired ל-0 היא השבתה מלאה." }
    }
  ],
  playground: "scaling",
  related: ["k8s-autoscaling", "k8s-hpa-deep", "arch-scaling", "net-load-balancing", "aws-eks-production", "pr-scaling-kinds"]
});

INFRA.lessons.push({
  id: "aws-detective-security",
  track: "cloud",
  order: 63,
  icon: "🕵️",
  level: 2,
  minutes: 15,
  title: { en: "AWS Detective Security: GuardDuty, Security Hub, Config & Co.", he: "אבטחה מגלה ב-AWS עם GuardDuty, Security Hub, Config והחברים" },
  tldr: {
    en: "Preventive controls (IAM, SCPs) say what can't happen; detective services tell you what IS happening: GuardDuty spots threats in logs, Config and Security Hub CSPM flag misconfigurations, Inspector finds CVEs, Macie finds PII in S3, Access Analyzer finds external and unused access. Run them org-wide from one delegated security account and route findings with EventBridge.",
    he: "בקרות מונעות (IAM ו-SCPs) קובעות מה אסור שיקרה; שירותים מגלים אומרים לך מה קורה בפועל: GuardDuty מזהה איומים בלוגים, Config ו-Security Hub CSPM מסמנים הגדרות שגויות, Inspector מוצא CVE-ים, Macie מוצא מידע אישי ב-S3, ו-Access Analyzer מוצא גישה חיצונית וגישה שלא בשימוש. מפעילים הכל ברמת ה-Organization מ-account אבטחה אחד עם delegated admin, ומנתבים את ה-findings עם EventBridge."
  },
  analogy: {
    en: "Think of a shopping mall. IAM and SCPs are the locks and the guards at the doors. GuardDuty is the CCTV team watching for suspicious behaviour, Config is the building inspector checking every fire door is closed, Inspector checks the shops' equipment against recall notices, Macie finds who left credit card slips on the counter, Access Analyzer lists every key handed to someone outside the mall, CloudTrail is the tape recorder of every door swipe, and Security Hub is the control room where all their reports land on one screen.",
    he: "תחשוב על קניון. IAM ו-SCPs הם המנעולים והשומרים בכניסות. GuardDuty הוא צוות המצלמות שמחפש התנהגות חשודה, Config הוא מהנדס הבטיחות שבודק שכל דלת אש סגורה, Inspector בודק את הציוד בחנויות מול הודעות ריקול, Macie מוצא מי השאיר פתקי אשראי על הדלפק, Access Analyzer מונה כל מפתח שניתן למישהו מחוץ לקניון, CloudTrail הוא מקליט של כל העברת כרטיס בדלת, ו-Security Hub הוא חדר הבקרה שבו כל הדוחות נוחתים על מסך אחד."
  },
  sections: [
    {
      h: { en: "GuardDuty: threat detection from logs you don't manage", he: "GuardDuty: זיהוי איומים מלוגים שאתה לא מנהל" },
      body: {
        en: `<p>GuardDuty is a managed threat detector. Turn it on per Region and it analyzes, with threat intel and ML, <strong>independent copies</strong> of:</p>
<ul>
<li><strong>CloudTrail management events</strong> (API calls), <strong>VPC Flow Logs</strong> and <strong>Route 53 DNS query logs</strong>. These are foundational; you don't need to enable flow logs yourself.</li>
<li>Optional protection plans: <strong>S3 Protection</strong> (S3 data events), <strong>EKS Protection</strong> (Kubernetes audit logs), <strong>Runtime Monitoring</strong> (an agent on EKS/ECS/EC2 for process and file events), <strong>Malware Protection</strong> (EBS and S3 scans), <strong>RDS</strong> login activity and <strong>Lambda</strong> network activity.</li>
</ul>
<p>Finding types read as <code>ThreatPurpose:ResourceType/ThreatName</code>. Ones you'll actually meet:</p>
<table>
<tr><th>Finding</th><th>Means</th></tr>
<tr><td><code>UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS</code></td><td>An EC2 role's temporary credentials are being used from an IP outside AWS (SSRF, stolen creds).</td></tr>
<tr><td><code>CryptoCurrency:EC2/BitcoinTool.B!DNS</code></td><td>An instance resolves mining-pool domains.</td></tr>
<tr><td><code>Recon:IAMUser/MaliciousIPCaller</code></td><td>API calls from a known malicious IP.</td></tr>
<tr><td><code>Policy:IAMUser/RootCredentialUsage</code></td><td>Someone used the root user.</td></tr>
<tr><td><code>PrivilegeEscalation:Kubernetes/PrivilegedContainer</code></td><td>A privileged container was launched on EKS.</td></tr>
</table>
<p>Severity: <strong>Low</strong> 1.0-3.9, <strong>Medium</strong> 4.0-6.9, <strong>High</strong> 7.0-8.9, and <strong>Critical</strong> for multi-stage <em>attack sequence</em> findings (Extended Threat Detection). New findings reach EventBridge within about 5 minutes; repeat occurrences update the existing finding (publishing frequency default 6 h, set it to 15 min).</p>
<blockquote>💡 Real world: GuardDuty doesn't block anything. It's a smoke detector, not a sprinkler. The value comes from what you wire to it: an EventBridge rule on severity ≥ 7 that pages on-call, and for known patterns an automated response (isolate the instance's security group, revoke the role session).</blockquote>`,
        he: `<p>GuardDuty הוא גלאי איומים מנוהל. מפעילים אותו בכל Region, והוא מנתח עם threat intel ו-ML <strong>עותקים עצמאיים</strong> של:</p>
<ul>
<li><strong>CloudTrail management events</strong> (קריאות API), <strong>VPC Flow Logs</strong> ו-<strong>DNS query logs</strong> של Route 53. אלה מקורות הבסיס, ואתה לא צריך להפעיל flow logs בעצמך.</li>
<li>תוכניות הגנה אופציונליות: <strong>S3 Protection</strong> על data events של S3, <strong>EKS Protection</strong> על ה-audit logs של Kubernetes, <strong>Runtime Monitoring</strong> עם agent על EKS, ECS או EC2 לאירועי תהליכים וקבצים, <strong>Malware Protection</strong> שסורק EBS ו-S3, ניטור התחברויות ל-<strong>RDS</strong> ופעילות רשת של <strong>Lambda</strong>.</li>
</ul>
<p>שמות ה-findings בנויים בתבנית <code>ThreatPurpose:ResourceType/ThreatName</code>. כאלה שבאמת תפגוש:</p>
<table>
<tr><th>Finding</th><th>המשמעות</th></tr>
<tr><td><code>UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS</code></td><td>ה-credentials הזמניים של role של EC2 משמשים מכתובת IP מחוץ ל-AWS, למשל בגלל SSRF או גניבה.</td></tr>
<tr><td><code>CryptoCurrency:EC2/BitcoinTool.B!DNS</code></td><td>instance מבצע resolve לדומיינים של mining pools.</td></tr>
<tr><td><code>Recon:IAMUser/MaliciousIPCaller</code></td><td>קריאות API מכתובת IP זדונית ידועה.</td></tr>
<tr><td><code>Policy:IAMUser/RootCredentialUsage</code></td><td>מישהו השתמש ב-root user.</td></tr>
<tr><td><code>PrivilegeEscalation:Kubernetes/PrivilegedContainer</code></td><td>הורץ privileged container ב-EKS.</td></tr>
</table>
<p>חומרה: <strong>Low</strong> בין 1.0 ל-3.9, <strong>Medium</strong> בין 4.0 ל-6.9, <strong>High</strong> בין 7.0 ל-8.9, ו-<strong>Critical</strong> ל-findings של <em>attack sequence</em> רב-שלבי (Extended Threat Detection). כל finding חדש מגיע ל-EventBridge תוך כ-5 דקות; מופעים חוזרים מעדכנים את ה-finding הקיים (תדירות הפרסום היא 6 שעות כברירת מחדל, ושווה לשנות ל-15 דקות).</p>
<blockquote>💡 Real world: ה-GuardDuty לא חוסם כלום. הוא גלאי עשן, לא ספרינקלר. הערך מגיע ממה שמחברים אליו: rule ב-EventBridge על חומרה 7 ומעלה שמעיר את ה-on-call, ולתבניות מוכרות תגובה אוטומטית כמו בידוד ה-security group של ה-instance וביטול ה-session של ה-role.</blockquote>`
      }
    },
    {
      h: { en: "Posture: AWS Config and Security Hub CSPM", he: "Posture: AWS Config ו-Security Hub CSPM" },
      body: {
        en: `<p><strong>AWS Config</strong> records a <em>configuration item</em> every time a resource changes, so you get a timeline per resource ("who opened port 22 on this security group, and when?") and evaluates <strong>rules</strong> against it:</p>
<ul>
<li><strong>Managed rules</strong> (hundreds): <code>restricted-ssh</code>, <code>s3-bucket-public-read-prohibited</code>, <code>encrypted-volumes</code>, <code>iam-root-access-key-check</code>. Triggered on change or periodically (1/3/6/12/24 h).</li>
<li><strong>Custom rules</strong>: Lambda or Guard policy-as-code.</li>
<li><strong>Conformance packs</strong>: a YAML bundle of rules + remediations deployed as one unit, org-wide with <code>put-organization-conformance-pack</code> (AWS ships packs for CIS, PCI DSS, NIST, etc.).</li>
<li><strong>Remediation</strong>: an SSM Automation document per rule, manual or automatic with retries, e.g. <code>AWS-DisablePublicAccessForSecurityGroup</code>.</li>
</ul>
<p><strong>Security Hub CSPM</strong> (the original Security Hub, renamed in 2025) does two jobs:</p>
<ol>
<li><strong>Posture checks</strong> against standards: AWS Foundational Security Best Practices, CIS AWS Foundations Benchmark, PCI DSS, NIST SP 800-53. Each control gives a pass/fail per resource and a security score in %. It runs those checks <em>through</em> Config rules, so Config recording must be on.</li>
<li><strong>Aggregation</strong>: it ingests findings from GuardDuty, Inspector, Macie, Access Analyzer, Config, Firewall Manager and third parties, all normalized to the <strong>ASFF</strong> (AWS Security Finding Format) JSON, with cross-Region aggregation into one home Region and workflow status (NEW / NOTIFIED / RESOLVED / SUPPRESSED).</li>
</ol>
<p>The newer <strong>AWS Security Hub</strong> experience builds on top of it, correlating findings into exposures and using the OCSF schema; the CSPM controls and ASFF are what SAA-C03-style questions still mean by "Security Hub".</p>
<blockquote>⚠️ Production tip: Config bills per configuration item recorded. In accounts with heavy churn (autoscaling, ephemeral ENIs, CI runners) "record everything, continuously" can cost more than the workloads. Use periodic recording or exclude noisy resource types in non-prod, and keep continuous recording where audit needs it.</blockquote>`,
        he: `<p><strong>AWS Config</strong> רושם <em>configuration item</em> בכל פעם שמשאב משתנה, כך שיש ציר זמן לכל משאב ("מי פתח את פורט 22 ב-security group הזה, ומתי?"), ומריץ עליו <strong>rules</strong>:</p>
<ul>
<li><strong>Managed rules</strong>, יש מאות כאלה: <code>restricted-ssh</code>, <code>s3-bucket-public-read-prohibited</code>, <code>encrypted-volumes</code>, <code>iam-root-access-key-check</code>. רצים בכל שינוי או באופן מחזורי, כל 1, 3, 6, 12 או 24 שעות.</li>
<li><strong>Custom rules</strong>: ב-Lambda או ב-Guard כ-policy-as-code.</li>
<li><strong>Conformance packs</strong>: חבילת YAML של rules ו-remediations שנפרסת כיחידה אחת, וברמת ה-org עם <code>put-organization-conformance-pack</code>. ב-AWS יש packs מוכנים ל-CIS, ל-PCI DSS, ל-NIST ועוד.</li>
<li><strong>Remediation</strong>: מסמך SSM Automation לכל rule, ידני או אוטומטי עם ניסיונות חוזרים, למשל <code>AWS-DisablePublicAccessForSecurityGroup</code>.</li>
</ul>
<p><strong>Security Hub CSPM</strong> (ה-Security Hub המקורי, ששמו שונה ב-2025) עושה שתי עבודות:</p>
<ol>
<li><strong>בדיקות posture</strong> מול סטנדרטים: AWS Foundational Security Best Practices, CIS AWS Foundations Benchmark, PCI DSS ו-NIST SP 800-53. כל control נותן עבר או נכשל לכל משאב, וציון אבטחה באחוזים. הבדיקות רצות <em>דרך</em> rules של Config, ולכן ה-recording של Config חייב להיות דלוק.</li>
<li><strong>Aggregation</strong>: הוא קולט findings מ-GuardDuty, מ-Inspector, מ-Macie, מ-Access Analyzer, מ-Config, מ-Firewall Manager ומצד שלישי, כולם מנורמלים לפורמט ה-JSON של <strong>ASFF</strong> (AWS Security Finding Format). יש aggregation בין Regions לתוך Region בית אחד, ו-workflow status של NEW, NOTIFIED, RESOLVED או SUPPRESSED.</li>
</ol>
<p>חוויית <strong>AWS Security Hub</strong> החדשה בנויה מעליו: היא מקשרת findings ל-exposures ומשתמשת בסכמת OCSF. כששאלה בסגנון SAA-C03 אומרת "Security Hub", היא עדיין מתכוונת ל-controls של ה-CSPM ול-ASFF.</p>
<blockquote>⚠️ Production tip: ה-Config מחויב לפי כל configuration item שנרשם. ב-accounts עם הרבה תחלופה (ENI-ים זמניים, autoscaling ו-CI runners) הגדרה של "תרשום הכל, ברציפות" יכולה לעלות יותר מה-workloads עצמם. בסביבות שאינן prod תשתמש ב-recording מחזורי או תוציא סוגי משאבים רועשים, ותשאיר recording רציף איפה שה-audit צריך אותו.</blockquote>`
      }
    },
    {
      h: { en: "Inspector, Macie and IAM Access Analyzer", he: "Inspector, Macie ו-IAM Access Analyzer" },
      body: {
        en: `<p><strong>Amazon Inspector</strong>: continuous vulnerability management.</p>
<ul>
<li><strong>EC2</strong>: package CVEs and network reachability, agent-based via the SSM agent or agentless from EBS snapshots.</li>
<li><strong>ECR</strong>: enhanced scanning on push, then <em>continuous</em> rescans when a new CVE is published against an image already in the registry.</li>
<li><strong>Lambda</strong>: dependency CVEs (standard scanning) and code issues like injection or hard-coded secrets (code scanning).</li>
</ul>
<p>Each finding gets an <strong>Inspector score</strong>: CVSS adjusted for context (is the port reachable from the internet? is there a known exploit?), which is how you prioritize 4,000 CVEs down to the 20 that matter.</p>
<p><strong>Amazon Macie</strong>: finds sensitive data in S3. Automated sensitive data discovery samples objects across all buckets daily; targeted jobs scan a bucket fully. Managed data identifiers cover credit card numbers, AWS secret keys, passport numbers and more; add custom regex identifiers for your own IDs. It also reports bucket-level issues (public, unencrypted, shared with another account). Billed per GB inspected, so scope jobs instead of scanning petabytes of logs.</p>
<p><strong>IAM Access Analyzer</strong>:</p>
<ul>
<li><strong>External access</strong> (free): with the account or the Organization as the <em>zone of trust</em>, it uses automated reasoning on resource policies (S3, IAM role trust, KMS, Lambda, SQS, SNS, Secrets Manager, ECR, EBS/RDS snapshots...) and reports anything reachable from outside, e.g. a bucket shared with account 999988887777.</li>
<li><strong>Unused access</strong> (paid, per role/user): roles, access keys, passwords and permissions not used within a tracking period (e.g. 90 days). The input for least-privilege clean-ups.</li>
<li><strong>Policy checks</strong>: <code>validate-policy</code> and <code>check-no-new-access</code> in CI, so a Terraform PR that widens access fails before deploy.</li>
</ul>`,
        he: `<p><strong>Amazon Inspector</strong>: ניהול פגיעויות רציף.</p>
<ul>
<li><strong>EC2</strong>: CVE-ים בחבילות ונגישות ברשת, עם agent דרך ה-SSM agent או בלי agent מ-snapshots של EBS.</li>
<li><strong>ECR</strong>: enhanced scanning ב-push, ואז סריקות <em>רציפות</em> כש-CVE חדש מתפרסם נגד image שכבר יושב ב-registry.</li>
<li><strong>Lambda</strong>: CVE-ים בתלויות (standard scanning) ובעיות בקוד כמו injection או secrets שכתובים בקוד (code scanning).</li>
</ul>
<p>כל finding מקבל <strong>Inspector score</strong>: ציון CVSS שמותאם להקשר, למשל אם הפורט נגיש מהאינטרנט ואם יש exploit ידוע. ככה מצמצמים 4,000 CVE-ים ל-20 שבאמת חשובים.</p>
<p><strong>Amazon Macie</strong>: מוצא מידע רגיש ב-S3. ה-automated sensitive data discovery דוגם אובייקטים מכל ה-buckets כל יום, ו-jobs ממוקדים סורקים bucket במלואו. ה-managed data identifiers מכסים מספרי כרטיסי אשראי, AWS secret keys, מספרי דרכון ועוד, ואפשר להוסיף custom identifiers עם regex למזהים משלך. הוא מדווח גם על בעיות ברמת ה-bucket: ציבורי, לא מוצפן או משותף עם account אחר. החיוב הוא לפי GB שנסרק, אז תגדיר scope ל-jobs במקום לסרוק petabytes של לוגים.</p>
<p><strong>IAM Access Analyzer</strong>:</p>
<ul>
<li><strong>External access</strong> (בחינם): ה-account או ה-Organization מוגדרים כ-<em>zone of trust</em>, והוא מריץ automated reasoning על resource policies של S3, של trust ב-IAM roles, של KMS, Lambda, SQS, SNS, Secrets Manager, ECR ו-snapshots של EBS ו-RDS. הוא מדווח על כל דבר שנגיש מבחוץ, למשל bucket ששותף עם account מספר 999988887777.</li>
<li><strong>Unused access</strong> (בתשלום, לפי role או user): roles, access keys, סיסמאות והרשאות שלא היו בשימוש בתקופת המעקב, למשל 90 יום. זה הקלט לניקוי לכיוון least privilege.</li>
<li><strong>Policy checks</strong>: מריצים <code>validate-policy</code> ו-<code>check-no-new-access</code> ב-CI, כך ש-PR של Terraform שמרחיב גישה נכשל לפני ה-deploy.</li>
</ul>`
      }
    },
    {
      h: { en: "Org-wide: organization trail and delegated admin", he: "ברמת ה-Organization: organization trail ו-delegated admin" },
      body: {
        en: `<p>Detective controls are only useful if they cover <strong>every account and every Region</strong>, including the one a developer created last week. The landing-zone pattern:</p>
<ul>
<li><strong>Organization trail</strong>: one multi-Region CloudTrail created in the management account (or a CloudTrail delegated admin) that logs every member account into an S3 bucket in the <em>Log Archive</em> account. Member accounts can see it but can't stop or modify it.</li>
<li><strong>Delegated administrator</strong>: the management account hands admin of each security service to the <em>Security Tooling / Audit</em> account, which then sees all findings and auto-enables new accounts. Nobody needs to log in to the management account for daily security work.</li>
<li><strong>SCP guardrails</strong>: deny <code>cloudtrail:StopLogging</code>, <code>guardduty:DeleteDetector</code>, <code>config:StopConfigurationRecorder</code>, <code>securityhub:DisableSecurityHub</code> for everyone except the security role.</li>
</ul>
<pre># run in the management account (GuardDuty, Security Hub, Inspector, Macie: per Region)
aws cloudtrail create-trail --name org-trail --s3-bucket-name org-trail-logs-444455556666 \
  --is-organization-trail --is-multi-region-trail --enable-log-file-validation \
  --kms-key-id arn:aws:kms:eu-central-1:444455556666:key/abcd-1234
aws cloudtrail start-logging --name org-trail

aws guardduty  enable-organization-admin-account --admin-account-id 111122223333
aws securityhub enable-organization-admin-account --admin-account-id 111122223333
aws inspector2 enable-delegated-admin-account   --delegated-admin-account-id 111122223333
aws macie2     enable-organization-admin-account --admin-account-id 111122223333
aws organizations register-delegated-administrator --account-id 111122223333 \
  --service-principal access-analyzer.amazonaws.com
aws organizations register-delegated-administrator --account-id 111122223333 \
  --service-principal config.amazonaws.com

# then, from the security account: auto-enable every current and future member
aws guardduty update-organization-configuration --detector-id &lt;id&gt; \
  --auto-enable-organization-members ALL</pre>
<blockquote>💡 Real world: Control Tower sets up the org trail, Config and the Log Archive / Audit accounts for you; you still enable GuardDuty, Security Hub CSPM, Inspector and Macie with delegated admin, usually in Terraform, in every Region you use, and SCP-deny the rest of the Regions so nothing hides there.</blockquote>`,
        he: `<p>בקרות מגלות שוות משהו רק אם הן מכסות <strong>כל account וכל Region</strong>, כולל את זה שמפתח פתח בשבוע שעבר. התבנית של landing zone:</p>
<ul>
<li><strong>Organization trail</strong>: trail אחד של CloudTrail על כל ה-Regions, שנוצר ב-management account (או ב-delegated admin של CloudTrail) ומתעד את כל ה-accounts הבנים לתוך bucket של S3 ב-account של <em>Log Archive</em>. ה-accounts הבנים רואים אותו, אבל לא יכולים לעצור או לשנות אותו.</li>
<li><strong>Delegated administrator</strong>: ה-management account מעביר את הניהול של כל שירות אבטחה ל-account של <em>Security Tooling</em> (או Audit), שרואה את כל ה-findings ומפעיל אוטומטית כל account חדש. אף אחד לא צריך להתחבר ל-management account לעבודת אבטחה יומיומית.</li>
<li><strong>SCP guardrails</strong>: חוסמים את <code>cloudtrail:StopLogging</code>, <code>guardduty:DeleteDetector</code>, <code>config:StopConfigurationRecorder</code> ו-<code>securityhub:DisableSecurityHub</code> לכולם חוץ מה-role של צוות האבטחה.</li>
</ul>
<pre># run in the management account (GuardDuty, Security Hub, Inspector, Macie: per Region)
aws cloudtrail create-trail --name org-trail --s3-bucket-name org-trail-logs-444455556666 \
  --is-organization-trail --is-multi-region-trail --enable-log-file-validation \
  --kms-key-id arn:aws:kms:eu-central-1:444455556666:key/abcd-1234
aws cloudtrail start-logging --name org-trail

aws guardduty  enable-organization-admin-account --admin-account-id 111122223333
aws securityhub enable-organization-admin-account --admin-account-id 111122223333
aws inspector2 enable-delegated-admin-account   --delegated-admin-account-id 111122223333
aws macie2     enable-organization-admin-account --admin-account-id 111122223333
aws organizations register-delegated-administrator --account-id 111122223333 \
  --service-principal access-analyzer.amazonaws.com
aws organizations register-delegated-administrator --account-id 111122223333 \
  --service-principal config.amazonaws.com

# then, from the security account: auto-enable every current and future member
aws guardduty update-organization-configuration --detector-id &lt;id&gt; \
  --auto-enable-organization-members ALL</pre>
<blockquote>💡 Real world: ה-Control Tower מקים בשבילך את ה-org trail, את Config ואת ה-accounts של Log Archive ו-Audit. את GuardDuty, את Security Hub CSPM, את Inspector ואת Macie אתה עדיין מפעיל עם delegated admin, בדרך כלל ב-Terraform, בכל Region שאתה משתמש בו, וחוסם ב-SCP את שאר ה-Regions כדי ששום דבר לא יסתתר שם.</blockquote>`
      }
    },
    {
      h: { en: "Routing findings, and which service answers which question", he: "ניתוב findings, ואיזה שירות עונה על איזו שאלה" },
      body: {
        en: `<p>Every one of these services emits events to <strong>EventBridge</strong>. Route by severity, not by service:</p>
<pre>{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"],
  "detail": { "severity": [{ "numeric": ["&gt;=", 7] }] }
}

{
  "source": ["aws.securityhub"],
  "detail-type": ["Security Hub Findings - Imported"],
  "detail": { "findings": {
    "Severity": { "Label": ["CRITICAL", "HIGH"] },
    "Workflow": { "Status": ["NEW"] } } }
}</pre>
<p>Targets: <strong>SNS</strong> → email / PagerDuty / Slack via Amazon Q Developer in chat applications (formerly AWS Chatbot); a <strong>Lambda</strong> that opens a Jira ticket or runs a response (quarantine security group, snapshot the disk for forensics); or <strong>Step Functions</strong> for a multi-step playbook. Put the rules in the delegated admin account (Security Hub CSPM aggregates there) so you configure routing once, not 200 times. Medium findings go to a daily triage queue, not to the pager.</p>
<p>Decision table, question → service:</p>
<table>
<tr><th>Question</th><th>Service</th></tr>
<tr><td>Is someone attacking us / are credentials stolen right now?</td><td>GuardDuty</td></tr>
<tr><td>Is this resource configured against our rules, and who changed it when?</td><td>AWS Config</td></tr>
<tr><td>How compliant are we with CIS / FSBP, across all accounts, on one screen?</td><td>Security Hub CSPM</td></tr>
<tr><td>Which instances, images or functions have exploitable CVEs?</td><td>Inspector</td></tr>
<tr><td>Which buckets contain PII or credit cards?</td><td>Macie</td></tr>
<tr><td>What is shared outside the account/org? Which permissions are unused?</td><td>IAM Access Analyzer</td></tr>
<tr><td>Who called which API, from where, when?</td><td>CloudTrail (org trail)</td></tr>
</table>
<p><strong>Other clouds</strong>: Google Cloud's <strong>Security Command Center</strong> bundles posture (security health analytics), threat detection (Event Threat Detection, Container Threat Detection), vulnerability findings and org-level aggregation in one product. Azure's <strong>Microsoft Defender for Cloud</strong> combines CSPM (secure score, regulatory compliance on top of Azure Policy) with workload protection plans (Defender for Servers, Containers, Storage) and also covers AWS and GCP accounts; Azure Policy plays Config's role, and Microsoft Sentinel is the SIEM on top.</p>`,
        he: `<p>כל אחד מהשירותים האלה שולח אירועים ל-<strong>EventBridge</strong>. מנתבים לפי חומרה, לא לפי שירות:</p>
<pre>{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"],
  "detail": { "severity": [{ "numeric": ["&gt;=", 7] }] }
}

{
  "source": ["aws.securityhub"],
  "detail-type": ["Security Hub Findings - Imported"],
  "detail": { "findings": {
    "Severity": { "Label": ["CRITICAL", "HIGH"] },
    "Workflow": { "Status": ["NEW"] } } }
}</pre>
<p>יעדים אפשריים: <strong>SNS</strong> ← מייל, PagerDuty, או Slack דרך Amazon Q Developer in chat applications (לשעבר AWS Chatbot). אפשרות שנייה: <strong>Lambda</strong> שפותח ticket ב-Jira או מריץ תגובה, כמו security group של הסגר ו-snapshot לדיסק לצורכי forensics. ואפשרות שלישית: <strong>Step Functions</strong> ל-playbook של כמה שלבים. שמים את ה-rules ב-account של ה-delegated admin, שאליו Security Hub CSPM מרכז הכל, כך שמגדירים ניתוב פעם אחת ולא 200 פעמים. Findings בחומרה Medium הולכים לתור triage יומי, לא ל-pager.</p>
<p>טבלת החלטה, שאלה ← שירות:</p>
<table>
<tr><th>שאלה</th><th>שירות</th></tr>
<tr><td>מישהו תוקף אותנו או גונב credentials ממש עכשיו?</td><td>GuardDuty</td></tr>
<tr><td>המשאב הזה מוגדר בניגוד לחוקים שלנו, ומי שינה אותו ומתי?</td><td>AWS Config</td></tr>
<tr><td>כמה אנחנו עומדים ב-CIS וב-FSBP בכל ה-accounts, במסך אחד?</td><td>Security Hub CSPM</td></tr>
<tr><td>לאילו instance-ים, images או פונקציות יש CVE-ים שאפשר לנצל?</td><td>Inspector</td></tr>
<tr><td>אילו buckets מכילים מידע אישי או מספרי אשראי?</td><td>Macie</td></tr>
<tr><td>מה משותף מחוץ ל-account או ל-org, ואילו הרשאות לא בשימוש?</td><td>IAM Access Analyzer</td></tr>
<tr><td>מי קרא לאיזה API, מאיפה ומתי?</td><td>CloudTrail (org trail)</td></tr>
</table>
<p><strong>עננים אחרים</strong>: ב-Google Cloud, ה-<strong>Security Command Center</strong> מאגד במוצר אחד posture (security health analytics), זיהוי איומים (Event Threat Detection ו-Container Threat Detection), findings של פגיעויות ו-aggregation ברמת הארגון. ב-Azure, ה-<strong>Microsoft Defender for Cloud</strong> משלב CSPM (secure score ו-regulatory compliance מעל Azure Policy) עם תוכניות הגנה ל-workloads כמו Defender for Servers, Containers ו-Storage, ומכסה גם accounts של AWS ו-GCP. ה-Azure Policy ממלא שם את התפקיד של Config, ו-Microsoft Sentinel הוא ה-SIEM שמעל.</p>`
      }
    }
  ],
  diagram: `  member accounts (all Regions)                       Security Tooling account (delegated admin)
  +------------------------------+                    +-------------------------------------------+
  | CloudTrail / Flow / DNS logs |--> GuardDuty ----->|                                           |
  | resource changes             |--> AWS Config ---->|   Security Hub CSPM  (ASFF, aggregated    |
  | EC2 / ECR / Lambda packages  |--> Inspector ----->|   into one home Region, FSBP / CIS score) |
  | S3 objects                   |--> Macie --------->|                                           |
  | resource & trust policies    |--> Access Analyzer>|                 |                         |
  +------------------------------+                    +-----------------|-------------------------+
        | org trail (all accounts)                                      v
        v                                                 EventBridge rule (severity >= 7 / HIGH)
  Log Archive account: S3 (locked, KMS, log validation)        |            |              |
                                                              SNS ->      Lambda ->     Step Functions
                                                         PagerDuty/Slack  Jira ticket   quarantine playbook`,
  handsOn: [
    { cmd: "aws guardduty create-sample-findings --detector-id $(aws guardduty list-detectors --query 'DetectorIds[0]' --output text) --finding-types 'UnauthorizedAccess:EC2/SSHBruteForce'",
      what: { en: "Generate a sample finding to test your EventBridge → SNS/Slack routing end to end without a real attack.", he: "מייצר finding לדוגמה כדי לבדוק את הניתוב מ-EventBridge ל-SNS ול-Slack מקצה לקצה, בלי מתקפה אמיתית." } },
    { cmd: "aws guardduty list-findings --detector-id <id> --finding-criteria '{\"Criterion\":{\"severity\":{\"Gte\":7},\"service.archived\":{\"Eq\":[\"false\"]}}}'",
      what: { en: "List active High (≥ 7) GuardDuty findings; pass the ids to get-findings to see the resource, actor IP and API calls.", he: "רשימת ה-findings הפעילים של GuardDuty בחומרה High, כלומר 7 ומעלה. מעבירים את ה-ids ל-get-findings כדי לראות את המשאב, את ה-IP של התוקף ואת קריאות ה-API." } },
    { cmd: "aws securityhub get-findings --filters '{\"SeverityLabel\":[{\"Value\":\"CRITICAL\",\"Comparison\":\"EQUALS\"}],\"RecordState\":[{\"Value\":\"ACTIVE\",\"Comparison\":\"EQUALS\"}],\"WorkflowStatus\":[{\"Value\":\"NEW\",\"Comparison\":\"EQUALS\"}]}' --max-items 10 --query 'Findings[].[ProductName,Title,Resources[0].Id]' --output table",
      what: { en: "From the delegated admin account: the new critical findings from every service and account, in ASFF, in one call.", he: "מה-account של ה-delegated admin: כל ה-findings הקריטיים החדשים מכל השירותים ומכל ה-accounts, בפורמט ASFF, בקריאה אחת." } },
    { cmd: "aws configservice describe-compliance-by-config-rule --compliance-types NON_COMPLIANT --query 'ComplianceByConfigRules[].[ConfigRuleName,Compliance.ComplianceContributorCount.CappedCount]' --output table",
      what: { en: "Which Config rules are failing and on how many resources: your misconfiguration backlog.", he: "אילו rules של Config נכשלים ועל כמה משאבים. זה ה-backlog של ההגדרות השגויות שלך." } },
    { cmd: "aws accessanalyzer create-analyzer --analyzer-name org-external --type ORGANIZATION && aws accessanalyzer list-findings-v2 --analyzer-arn <analyzer-arn> --filter '{\"status\":{\"eq\":[\"ACTIVE\"]}}'",
      what: { en: "Create an org-wide external access analyzer (from the delegated admin account) and list what is reachable from outside the org.", he: "יוצר analyzer של גישה חיצונית לכל ה-org (מה-account של ה-delegated admin) ומציג מה נגיש מחוץ לארגון." } }
  ],
  mnemonic: {
    en: "\"Guard the doors, Config the walls, Inspect the parts, Macie the papers, Analyze the keys, Hub it all\": threats, settings, CVEs, PII, access, one screen.",
    he: "\"Guard שומר על הדלתות, Config על הקירות, Inspector על החלקים, Macie על הניירת, Analyzer על המפתחות, וה-Hub מרכז הכל\": איומים, הגדרות, CVE-ים, מידע אישי, גישה ומסך אחד."
  },
  pitfalls: [
    { en: "Enabling GuardDuty/Security Hub only in your main Region: attackers love the Regions nobody watches (crypto-mining in sa-east-1). Enable everywhere or SCP-deny unused Regions.", he: "להפעיל GuardDuty ו-Security Hub רק ב-Region הראשי: תוקפים אוהבים Regions שאף אחד לא מסתכל עליהם, כמו כריית מטבעות ב-sa-east-1. תפעיל בכל ה-Regions, או תחסום ב-SCP את מה שלא בשימוש." },
    { en: "Turning everything on and routing nothing: 30,000 Security Hub findings nobody reads is the same as zero. Start with a few high-signal routes (GuardDuty ≥ 7, critical Inspector on internet-facing, Access Analyzer public) and suppress the noise.", he: "להדליק הכל ולא לנתב כלום: 30,000 findings ב-Security Hub שאף אחד לא קורא שווים לאפס. תתחיל מכמה נתיבים עם signal גבוה (GuardDuty מ-7 ומעלה, Inspector קריטי על משאבים שפתוחים לאינטרנט, Access Analyzer על גישה ציבורית) ותעשה suppress לרעש." },
    { en: "Security Hub CSPM controls all failing as 'no data': they run on Config rules, so Config recording must be enabled in every account and Region first.", he: "כל ה-controls של Security Hub CSPM מראים שאין נתונים: הם רצים על rules של Config, אז קודם צריך להפעיל recording של Config בכל account ובכל Region." },
    { en: "Expecting detection to prevent: GuardDuty and Config only tell you. If something must never happen (public bucket, CloudTrail off), block it with SCPs / S3 Block Public Access and keep detection as the safety net.", he: "לצפות שזיהוי ימנע: GuardDuty ו-Config רק מודיעים לך. אם משהו אסור שיקרה אף פעם, כמו bucket ציבורי או CloudTrail כבוי, תחסום אותו עם SCPs ועם S3 Block Public Access, ותשאיר את הזיהוי כרשת ביטחון." }
  ],
  interview: [
    {
      q: { en: "GuardDuty fires InstanceCredentialExfiltration.OutsideAWS for a production web server's role. Walk through your response.", he: "GuardDuty מתריע על InstanceCredentialExfiltration.OutsideAWS עבור ה-role של שרת web בפרודקשן. תעבור על התגובה שלך." },
      a: { en: "Treat it as real: the role's temporary credentials are being used from outside AWS, typically after SSRF against IMDSv1. Contain: revoke active sessions (IAM 'Revoke active sessions' adds a deny on tokens issued before now), and isolate the instance with a quarantine security group after snapshotting EBS for forensics. Scope: CloudTrail for every call by that role's session from the foreign IP: what was listed, read, created (new users or keys = persistence). Eradicate: enforce IMDSv2 (HttpTokens=required, hop limit 1), patch the SSRF, rotate anything the role could read. Then add an EventBridge auto-response for this finding type and an SCP or Config rule that requires IMDSv2.", he: "מתייחס לזה כאמיתי: ה-credentials הזמניים של ה-role משמשים מחוץ ל-AWS, בדרך כלל אחרי SSRF מול IMDSv1. בלימה: מבטל את ה-sessions הפעילים (ב-IAM יש Revoke active sessions שמוסיף deny על tokens שהונפקו לפני עכשיו), ומבודד את ה-instance עם security group של הסגר אחרי snapshot ל-EBS לצורכי forensics. היקף: מחפש ב-CloudTrail כל קריאה של ה-session הזה מה-IP הזר, מה נקרא, מה נוצר. users או keys חדשים הם סימן ל-persistence. ניקוי: אוכף IMDSv2 (HttpTokens=required ו-hop limit של 1), סוגר את ה-SSRF ומחליף כל secret שה-role יכול היה לקרוא. אחר כך מוסיף תגובה אוטומטית ב-EventBridge לסוג ה-finding הזה, ו-SCP או rule של Config שמחייבים IMDSv2." }
    },
    {
      q: { en: "You join a company with 80 AWS accounts and no security tooling. What do you set up in the first two weeks?", he: "אתה מצטרף לחברה עם 80 accounts ב-AWS ובלי כלי אבטחה. מה אתה מקים בשבועיים הראשונים?" },
      a: { en: "Visibility first, org-wide: an organization trail to a locked Log Archive bucket; a Security Tooling account as delegated admin for GuardDuty, Security Hub CSPM, Config, Inspector, Access Analyzer (Macie once you know where PII lives), auto-enabled for new accounts in all used Regions; SCPs that deny disabling them and deny unused Regions. Then signal: EventBridge rules for GuardDuty ≥ 7 and critical findings to on-call, everything else to a triage board; enable FSBP and CIS and fix the top failing controls (public access, root MFA, open SSH). Report the security score weekly so the trend is visible.", he: "קודם נראות, ברמת ה-org: organization trail ל-bucket נעול ב-Log Archive, ו-account של Security Tooling כ-delegated admin ל-GuardDuty, ל-Security Hub CSPM, ל-Config, ל-Inspector ול-Access Analyzer (ול-Macie כשיודעים איפה יושב המידע האישי), עם הפעלה אוטומטית ל-accounts חדשים בכל ה-Regions שבשימוש. SCPs שחוסמים את הכיבוי שלהם ואת ה-Regions שלא בשימוש. אחר כך signal: rules ב-EventBridge ששולחים ל-on-call את GuardDuty מ-7 ומעלה ואת ה-findings הקריטיים, וכל השאר ללוח triage. מפעיל את FSBP ואת CIS ומתקן את ה-controls שנכשלים הכי הרבה: גישה ציבורית, MFA ל-root ו-SSH פתוח. מדווח כל שבוע על ציון האבטחה כדי שהמגמה תהיה גלויה." }
    }
  ],
  quiz: [
    {
      q: { en: "Which service alerts when an EC2 role's credentials are used from an IP outside AWS?", he: "איזה שירות מתריע כשה-credentials של role של EC2 משמשים מכתובת IP מחוץ ל-AWS?" },
      options: [
        { en: "Amazon Inspector", he: "Amazon Inspector" },
        { en: "AWS Config", he: "AWS Config" },
        { en: "Amazon GuardDuty", he: "Amazon GuardDuty" },
        { en: "Amazon Macie", he: "Amazon Macie" }
      ],
      answer: 2,
      explain: { en: "GuardDuty analyzes CloudTrail, flow and DNS logs for threats; this is the InstanceCredentialExfiltration finding. Inspector finds CVEs, Config checks settings, Macie finds PII.", he: "GuardDuty מנתח לוגים של CloudTrail, של flow ושל DNS כדי לזהות איומים, וזה ה-finding של InstanceCredentialExfiltration. ה-Inspector מוצא CVE-ים, Config בודק הגדרות ו-Macie מוצא מידע אישי." }
    },
    {
      q: { en: "Compliance asks: \"Which S3 buckets contain credit card numbers?\" What do you run?", he: "צוות ה-compliance שואל: \"אילו buckets ב-S3 מכילים מספרי כרטיסי אשראי?\" מה מריצים?" },
      options: [
        { en: "Amazon Macie sensitive data discovery", he: "Sensitive data discovery של Amazon Macie" },
        { en: "IAM Access Analyzer", he: "IAM Access Analyzer" },
        { en: "GuardDuty S3 Protection", he: "GuardDuty S3 Protection" },
        { en: "AWS Config rule s3-bucket-public-read-prohibited", he: "ה-rule של Config בשם s3-bucket-public-read-prohibited" }
      ],
      answer: 0,
      explain: { en: "Only Macie inspects object contents with data identifiers. Access Analyzer and the Config rule look at policies/settings; GuardDuty S3 Protection looks at suspicious API activity.", he: "רק Macie בודק את תוכן האובייקטים עם data identifiers. ה-Access Analyzer וה-rule של Config מסתכלים על policies והגדרות, ו-GuardDuty S3 Protection מסתכל על פעילות API חשודה." }
    },
    {
      q: { en: "You want every new security group with SSH open to 0.0.0.0/0 detected and automatically closed. What fits best?", he: "אתה רוצה שכל security group חדש עם SSH פתוח ל-0.0.0.0/0 יזוהה וייסגר אוטומטית. מה מתאים הכי טוב?" },
      options: [
        { en: "Inspector network reachability scan", he: "סריקת network reachability של Inspector" },
        { en: "GuardDuty with a High severity filter", he: "GuardDuty עם סינון לחומרה High" },
        { en: "Macie bucket inventory", he: "ה-bucket inventory של Macie" },
        { en: "AWS Config rule restricted-ssh with automatic SSM remediation", he: "Rule של Config בשם restricted-ssh עם remediation אוטומטי של SSM" }
      ],
      answer: 3,
      explain: { en: "Config evaluates the configuration change itself and can trigger an SSM Automation remediation. GuardDuty only reports threats (e.g. brute force after the fact), not the misconfiguration.", he: "Config בודק את שינוי הקונפיגורציה עצמו ויכול להפעיל remediation של SSM Automation. ה-GuardDuty מדווח רק על איומים, למשל brute force אחרי שקרה, ולא על ההגדרה השגויה." }
    },
    {
      q: { en: "Across 50 accounts, how should the security team see all findings without using the management account?", he: "על פני 50 accounts, איך צוות האבטחה צריך לראות את כל ה-findings בלי להשתמש ב-management account?" },
      options: [
        { en: "Create an IAM user for the security team in each account", he: "ליצור IAM user לצוות האבטחה בכל account" },
        { en: "Designate a security account as delegated administrator and aggregate in Security Hub CSPM", he: "להגדיר account אבטחה כ-delegated administrator ולרכז הכל ב-Security Hub CSPM" },
        { en: "Copy the CloudTrail logs to a laptop every night", he: "להעתיק את הלוגים של CloudTrail ללפטופ כל לילה" },
        { en: "Give the security team the management account's root password", he: "לתת לצוות האבטחה את סיסמת ה-root של ה-management account" }
      ],
      answer: 1,
      explain: { en: "Delegated admin lets one member account manage GuardDuty, Security Hub, Inspector, Macie, Config and Access Analyzer org-wide and auto-enable new accounts, keeping the management account locked down.", he: "Delegated admin מאפשר ל-account בן אחד לנהל את GuardDuty, את Security Hub, את Inspector, את Macie, את Config ואת Access Analyzer לכל ה-org ולהפעיל אוטומטית accounts חדשים, וה-management account נשאר נעול." }
    }
  ],
  related: ["cloud-iam-security", "cloud-aws-iam-deep", "cloud-landing-zones", "cloud-secrets-management", "aws-eks-production", "pr-security-ops"]
});

INFRA.glossary.push(
  { term: "Auto Scaling group", aliases: ["ASG"], track: "cloud", def: { en: "AWS controller that keeps a desired number of healthy EC2 instances from one launch template, between min and max, spread across AZs.", he: "Controller של AWS ששומר מספר רצוי של instance-ים בריאים מ-launch template אחד, בין min ל-max, מפוזרים על פני כמה AZ-ים." }, lesson: "aws-ec2-auto-scaling" },
  { term: "Launch template", track: "cloud", def: { en: "Versioned EC2 launch spec (AMI, instance type, security groups, IAM role, user data) that an ASG uses to create instances.", he: "מפרט עם גרסאות להרמת EC2 (AMI, סוג instance, security groups, IAM role ו-user data) שבעזרתו ASG יוצר instance-ים." }, lesson: "aws-ec2-auto-scaling" },
  { term: "Target tracking scaling", track: "cloud", def: { en: "Scaling policy that keeps a metric at a target (e.g. CPU 50%) by adjusting desired capacity, like a thermostat.", he: "Scaling policy ששומר metric על יעד, למשל CPU על 50%, ע\"י שינוי ה-desired, כמו תרמוסטט." }, lesson: "aws-ec2-auto-scaling" },
  { term: "Lifecycle hook", track: "cloud", def: { en: "Pauses an ASG instance in Pending:Wait or Terminating:Wait so you can bootstrap it or drain it before it continues.", he: "עוצר instance של ASG במצב Pending:Wait או Terminating:Wait כדי שתוכל לאתחל או לרוקן אותו לפני שהוא ממשיך." }, lesson: "aws-ec2-auto-scaling" },
  { term: "Warm pool", track: "cloud", def: { en: "Pre-initialized stopped, hibernated or running instances kept next to an ASG so scale-out takes seconds instead of minutes.", he: "Instance-ים מאותחלים מראש במצב Stopped, Hibernated או Running שיושבים ליד ה-ASG, כך ש-scale out לוקח שניות במקום דקות." }, lesson: "aws-ec2-auto-scaling" },
  { term: "Instance refresh", track: "cloud", def: { en: "ASG feature that replaces instances in batches onto a new launch template/AMI while keeping a minimum healthy percentage, with checkpoints and rollback.", he: "יכולת של ASG שמחליפה instance-ים במנות ל-launch template או AMI חדש, תוך שמירה על אחוז בריאות מינימלי, עם checkpoints ו-rollback." }, lesson: "aws-ec2-auto-scaling" },
  { term: "GuardDuty", aliases: ["Amazon GuardDuty"], track: "cloud", def: { en: "AWS managed threat detection over CloudTrail, VPC Flow Logs, DNS logs and optional EKS/S3/runtime data; produces severity-scored findings.", he: "זיהוי איומים מנוהל של AWS על CloudTrail, VPC Flow Logs ו-DNS logs, ובאופן אופציונלי גם על EKS, S3 ו-runtime; מייצר findings עם ציון חומרה." }, lesson: "aws-detective-security" },
  { term: "Security Hub CSPM", aliases: ["Security Hub", "AWS Security Hub"], track: "cloud", def: { en: "AWS posture service: runs standards like FSBP and CIS as controls and aggregates findings from other services in ASFF across accounts and Regions.", he: "שירות posture של AWS: מריץ סטנדרטים כמו FSBP ו-CIS כ-controls ומרכז findings משירותים אחרים בפורמט ASFF על פני accounts ו-Regions." }, lesson: "aws-detective-security" },
  { term: "AWS Config", track: "cloud", def: { en: "Records every resource configuration change and evaluates it against rules and conformance packs, with optional SSM remediation.", he: "רושם כל שינוי בקונפיגורציה של משאב ובודק אותו מול rules ו-conformance packs, עם remediation אופציונלי דרך SSM." }, lesson: "aws-detective-security" },
  { term: "Amazon Macie", aliases: ["Macie"], track: "cloud", def: { en: "Scans S3 objects for sensitive data (PII, credit cards, secrets) and reports risky bucket settings.", he: "סורק אובייקטים ב-S3 ומחפש מידע רגיש כמו מידע אישי, כרטיסי אשראי ו-secrets, ומדווח על הגדרות bucket מסוכנות." }, lesson: "aws-detective-security" },
  { term: "IAM Access Analyzer", aliases: ["Access Analyzer"], track: "cloud", def: { en: "Finds resources shared outside your account or organization and unused roles, keys and permissions; also validates policies in CI.", he: "מוצא משאבים שמשותפים מחוץ ל-account או לארגון, ו-roles, מפתחות והרשאות שלא בשימוש. בודק גם policies ב-CI." }, lesson: "aws-detective-security" },
  { term: "Delegated administrator", aliases: ["delegated admin"], track: "cloud", def: { en: "A member account of an AWS Organization given admin of a service (GuardDuty, Security Hub...) for the whole org, so the management account isn't used day to day.", he: "Account בן ב-AWS Organization שמקבל ניהול של שירות כמו GuardDuty או Security Hub לכל הארגון, כדי שלא ישתמשו ב-management account ביום-יום." }, lesson: "aws-detective-security" }
);

// --- w4.js (syllabus gap) ---
INFRA.lessons.push({
  id: "linux-patching-packages",
  track: "linux",
  order: 60,
  icon: "🩹",
  level: 2,
  minutes: 13,
  title: { en: "Patching a fleet: packages, signed repos, pinning & reboots", he: "Patching ל-fleet: חבילות, repos חתומים, pinning ו-reboots" },
  tldr: {
    en: "Patch a fleet like a pipeline, not a chore: signed repos, pins only where a version must not move, automatic security updates, a reboot signal you actually watch, kured to roll kernel reboots one node at a time — and for cattle (Kubernetes nodes, ASGs), rebuild the image instead of patching in place.",
    he: "עושים patching ל-fleet כמו pipeline, לא כמו מטלה: repos חתומים, pinning רק איפה שגרסה אסור שתזוז, עדכוני אבטחה אוטומטיים, סימן reboot שבאמת עוקבים אחריו, ו-kured שמגלגל reboots של kernel אחד-אחד בין ה-nodes. ובשרתים שהם cattle, כמו nodes של Kubernetes או ASG, בונים image חדש במקום לטלאי במקום."
  },
  analogy: {
    en: "An airline fleet. You don't change an engine mid-flight, and you don't ground all planes on the same morning: they go to the hangar one at a time, at night, while the rest keep flying. Some fixes are a temporary inspection sticker (live patching) that buys time until the next hangar visit. And many airlines skip the repair altogether and swap in a freshly serviced plane from the factory (immutable image). The parts only come from certified suppliers with a seal (signed repos).",
    he: "צי מטוסים של חברת תעופה. לא מחליפים מנוע באמצע טיסה, ולא מקרקעים את כל המטוסים באותו בוקר: הם נכנסים להאנגר אחד-אחד, בלילה, בזמן שהשאר ממשיכים לטוס. חלק מהתיקונים הם מדבקת ביקורת זמנית (live patching) שקונה זמן עד הביקור הבא בהאנגר. והרבה חברות בכלל מוותרות על התיקון ומכניסות מטוס חדש שיצא מטופל מהמפעל (immutable image). והחלקים מגיעים רק מספקים מורשים עם חותמת (repos חתומים)."
  },
  sections: [
    {
      h: { en: "apt vs dnf: repos and signed packages", he: "apt מול dnf: repos וחבילות חתומות" },
      body: {
        en: `<table><tr><th></th><th>Debian / Ubuntu</th><th>RHEL / Rocky / Amazon Linux 2023</th></tr>
<tr><td>Package format</td><td><code>.deb</code> (low level: <code>dpkg</code>)</td><td><code>.rpm</code> (low level: <code>rpm</code>)</td></tr>
<tr><td>High-level tool</td><td><code>apt</code></td><td><code>dnf</code> (<code>yum</code> on old releases)</td></tr>
<tr><td>Repo config</td><td><code>/etc/apt/sources.list.d/*.sources</code> (deb822) or <code>*.list</code></td><td><code>/etc/yum.repos.d/*.repo</code></td></tr>
<tr><td>Pending security updates</td><td><code>apt list --upgradable</code></td><td><code>dnf updateinfo list --security</code></td></tr>
<tr><td>What changed and when</td><td><code>/var/log/apt/history.log</code></td><td><code>dnf history</code></td></tr></table>
<p>Every repo publishes signed metadata, and the client verifies it with a GPG key before installing anything. The old <code>apt-key add</code> trusted a key for <em>every</em> repo on the machine — a third-party vendor's key could sign a fake <code>openssh-server</code>. It is deprecated; the modern way scopes each key to one repo with <code>Signed-By</code>:</p>
<pre># Debian/Ubuntu: one key, trusted for one repo only
$ sudo install -d -m 0755 /etc/apt/keyrings
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
$ cat /etc/apt/sources.list.d/docker.sources
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Signed-By: /etc/apt/keyrings/docker.gpg

# RHEL family: signature checks per repo
$ cat /etc/yum.repos.d/internal.repo
[internal]
name=Internal packages
baseurl=https://repo.internal.example/el9/$basearch
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://repo.internal.example/RPM-GPG-KEY-internal</pre>
<blockquote>⚠️ Production tip: don't point 500 servers straight at the public mirrors. Mirror into a repo you control (Artifactory, Nexus, Pulp, aptly) and take dated <strong>snapshots</strong>, then promote a snapshot dev → staging → prod. "Patch week" becomes "promote snapshot 2026-11-17", and every server gets exactly the same versions — reproducible, and the dev fleet already ran them for a week.</blockquote>`,
        he: `<table><tr><th></th><th>Debian / Ubuntu</th><th>RHEL / Rocky / Amazon Linux 2023</th></tr>
<tr><td>פורמט חבילה</td><td><code>.deb</code> (ברמה הנמוכה: <code>dpkg</code>)</td><td><code>.rpm</code> (ברמה הנמוכה: <code>rpm</code>)</td></tr>
<tr><td>הכלי הראשי</td><td><code>apt</code></td><td><code>dnf</code> (<code>yum</code> בגרסאות ישנות)</td></tr>
<tr><td>הגדרת repos</td><td><code>/etc/apt/sources.list.d/*.sources</code> (deb822) או <code>*.list</code></td><td><code>/etc/yum.repos.d/*.repo</code></td></tr>
<tr><td>עדכוני אבטחה שמחכים</td><td><code>apt list --upgradable</code></td><td><code>dnf updateinfo list --security</code></td></tr>
<tr><td>מה השתנה ומתי</td><td><code>/var/log/apt/history.log</code></td><td><code>dnf history</code></td></tr></table>
<p>כל repo מפרסם metadata חתום, והלקוח מאמת אותו עם מפתח GPG לפני שהוא מתקין משהו. ה-<code>apt-key add</code> הישן נתן אמון במפתח עבור <em>כל</em> ה-repos במכונה — המפתח של ספק צד שלישי יכול היה לחתום על <code>openssh-server</code> מזויף. הוא deprecated, והדרך המודרנית מצמידה כל מפתח ל-repo אחד עם <code>Signed-By</code>:</p>
<pre># Debian/Ubuntu: one key, trusted for one repo only
$ sudo install -d -m 0755 /etc/apt/keyrings
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
$ cat /etc/apt/sources.list.d/docker.sources
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Signed-By: /etc/apt/keyrings/docker.gpg

# RHEL family: signature checks per repo
$ cat /etc/yum.repos.d/internal.repo
[internal]
name=Internal packages
baseurl=https://repo.internal.example/el9/$basearch
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://repo.internal.example/RPM-GPG-KEY-internal</pre>
<blockquote>⚠️ טיפ לפרודקשן: אל תפנה 500 שרתים ישר ל-mirrors הציבוריים. תעשה mirror ל-repo שבשליטתך, למשל Artifactory או Pulp, תצלם <strong>snapshots</strong> מתוארכים, ותקדם snapshot מ-dev ל-staging ואז ל-prod. "שבוע ה-patching" הופך ל"לקדם את snapshot 2026-11-17", וכל שרת מקבל בדיוק אותן גרסאות — שחזורי, וה-fleet של dev כבר הריץ אותן שבוע.</blockquote>`
      }
    },
    {
      h: { en: "Pinning: holding the versions that must not move", he: "Pinning: להחזיק במקום גרסאות שאסור שיזוזו" },
      body: {
        en: `<pre># apt: freeze one package at its installed version
$ sudo apt-mark hold kubelet kubeadm kubectl
$ apt-mark showhold

# apt: pin to a version series with apt preferences
$ cat /etc/apt/preferences.d/nginx
Package: nginx
Pin: version 1.26.*
Pin-Priority: 1001
$ apt-cache policy nginx       # candidate version + which pin won

# dnf: the versionlock plugin
$ sudo dnf install 'dnf-command(versionlock)'
$ sudo dnf versionlock add postgresql16-server
$ sudo dnf versionlock list
$ sudo dnf versionlock delete postgresql16-server
# blunt alternative in /etc/dnf/dnf.conf:  exclude=kernel*</pre>
<p>How apt picks: normal repos get priority 500, the installed version 100. A pin of <strong>990-1000</strong> wins over newer versions from other sources; <strong>above 1000</strong> it even forces a downgrade; a <strong>negative</strong> priority blocks that version from ever being installed.</p>
<p>Pin when a version is coupled to something else: <code>kubelet</code> must follow the cluster's version skew policy (the Kubernetes docs themselves tell you to <code>apt-mark hold</code> it), a database server's major version must match its data directory, a GPU driver must match the CUDA stack.</p>
<blockquote>💡 Real world: a pin is technical debt with a timer. A held <code>containerd</code> or <code>openssl</code> silently stops receiving security fixes. Keep pins in config management with a comment, an owner and a review date, and make your patch report list held packages separately — "100% patched except the 3 things nobody remembers pinning" is how CVEs survive for a year.</blockquote>`,
        he: `<pre># apt: freeze one package at its installed version
$ sudo apt-mark hold kubelet kubeadm kubectl
$ apt-mark showhold

# apt: pin to a version series with apt preferences
$ cat /etc/apt/preferences.d/nginx
Package: nginx
Pin: version 1.26.*
Pin-Priority: 1001
$ apt-cache policy nginx       # candidate version + which pin won

# dnf: the versionlock plugin
$ sudo dnf install 'dnf-command(versionlock)'
$ sudo dnf versionlock add postgresql16-server
$ sudo dnf versionlock list
$ sudo dnf versionlock delete postgresql16-server
# blunt alternative in /etc/dnf/dnf.conf:  exclude=kernel*</pre>
<p>איך apt בוחר: repos רגילים מקבלים עדיפות 500, והגרסה המותקנת 100. pin של <strong>990-1000</strong> מנצח גרסאות חדשות יותר ממקורות אחרים; <strong>מעל 1000</strong> הוא אפילו כופה downgrade; ועדיפות <strong>שלילית</strong> חוסמת את הגרסה הזו מלהיות מותקנת אי פעם.</p>
<p>עושים pin כשגרסה קשורה למשהו אחר: ה-<code>kubelet</code> חייב לעמוד ב-version skew policy של ה-cluster (התיעוד של Kubernetes עצמו אומר לעשות לו <code>apt-mark hold</code>), גרסה ראשית של שרת DB חייבת להתאים לתיקיית הדאטה שלו, ודרייבר GPU חייב להתאים ל-CUDA.</p>
<blockquote>💡 מהשטח: pin הוא חוב טכני עם טיימר. <code>containerd</code> או <code>openssl</code> שמוחזקים במקום מפסיקים בשקט לקבל תיקוני אבטחה. תחזיק את ה-pins ב-config management עם הערה, בעלים ותאריך בדיקה, ותדאג שדוח ה-patching יציג חבילות מוחזקות בנפרד — "100% מעודכנים חוץ מ-3 דברים שאף אחד לא זוכר למה נעלנו" זה בדיוק איך CVE שורד שנה.</blockquote>`
      }
    },
    {
      h: { en: "Automatic security updates, and \"does it need a reboot?\"", he: "עדכוני אבטחה אוטומטיים, ו\"צריך reboot?\"" },
      body: {
        en: `<pre># Debian/Ubuntu: unattended-upgrades
$ cat /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
$ grep -v '^//' /etc/apt/apt.conf.d/50unattended-upgrades | grep .   # excerpt:
Unattended-Upgrade::Allowed-Origins { "\${distro_id}:\${distro_codename}-security"; };
Unattended-Upgrade::Package-Blacklist { "containerd.io"; };
Unattended-Upgrade::Automatic-Reboot "false";
$ sudo unattended-upgrade --dry-run --debug
$ less /var/log/unattended-upgrades/unattended-upgrades.log

# RHEL family: dnf-automatic
$ grep -E '^(upgrade_type|apply_updates)' /etc/dnf/automatic.conf
upgrade_type = security
apply_updates = yes
$ sudo systemctl enable --now dnf-automatic.timer

# Does this box need a reboot?
$ cat /var/run/reboot-required.pkgs        # Debian/Ubuntu: file exists = yes
linux-image-6.8.0-49-generic
libc6
$ sudo needs-restarting -r; echo $?         # RHEL: exit 1 = reboot needed
Core libraries or services have been updated since boot-up:
  * glibc
  * kernel
Reboot is required to fully utilize these updates.
1
$ sudo needs-restarting -s                  # RHEL: services still on old libs
$ sudo needrestart -r l                     # Debian/Ubuntu: list stale services</pre>
<p>Why this matters: the package manager replaces files on disk, but running processes keep the old code mapped in memory. After an <code>openssl</code> update, nginx still serves TLS with the old, vulnerable library until it restarts (you can see it as <code>(deleted)</code> in <code>/proc/&lt;pid&gt;/maps</code>).</p>
<table><tr><th>What was updated</th><th>What makes it effective</th></tr>
<tr><td>A library (openssl, libcurl)</td><td>Restart the services that load it</td></tr>
<tr><td>glibc</td><td>Restart almost everything — in practice, reboot</td></tr>
<tr><td>systemd</td><td><code>systemctl daemon-reexec</code></td></tr>
<tr><td>Kernel, CPU microcode</td><td>Reboot (or live patch for kernel CVEs)</td></tr></table>
<blockquote>💡 Real world: Ubuntu ships unattended-upgrades with <code>Automatic-Reboot "false"</code>, so servers quietly sit for months with a patched kernel in <code>/boot</code> and a vulnerable one running. Turn "reboot required" into a metric (a node_exporter textfile, or kured's <code>kured_reboot_required</code>) and alert when a host has needed a reboot for more than 7 days.</blockquote>`,
        he: `<pre># Debian/Ubuntu: unattended-upgrades
$ cat /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
$ grep -v '^//' /etc/apt/apt.conf.d/50unattended-upgrades | grep .   # excerpt:
Unattended-Upgrade::Allowed-Origins { "\${distro_id}:\${distro_codename}-security"; };
Unattended-Upgrade::Package-Blacklist { "containerd.io"; };
Unattended-Upgrade::Automatic-Reboot "false";
$ sudo unattended-upgrade --dry-run --debug
$ less /var/log/unattended-upgrades/unattended-upgrades.log

# RHEL family: dnf-automatic
$ grep -E '^(upgrade_type|apply_updates)' /etc/dnf/automatic.conf
upgrade_type = security
apply_updates = yes
$ sudo systemctl enable --now dnf-automatic.timer

# Does this box need a reboot?
$ cat /var/run/reboot-required.pkgs        # Debian/Ubuntu: file exists = yes
linux-image-6.8.0-49-generic
libc6
$ sudo needs-restarting -r; echo $?         # RHEL: exit 1 = reboot needed
Core libraries or services have been updated since boot-up:
  * glibc
  * kernel
Reboot is required to fully utilize these updates.
1
$ sudo needs-restarting -s                  # RHEL: services still on old libs
$ sudo needrestart -r l                     # Debian/Ubuntu: list stale services</pre>
<p>למה זה חשוב: מנהל החבילות מחליף קבצים בדיסק, אבל תהליכים שרצים ממשיכים להחזיק את הקוד הישן בזיכרון. אחרי עדכון של <code>openssl</code>, ה-nginx ממשיך להגיש TLS עם הספרייה הישנה והפגיעה עד שהוא עושה restart (רואים את זה כ-<code>(deleted)</code> בתוך <code>/proc/&lt;pid&gt;/maps</code>).</p>
<table><tr><th>מה עודכן</th><th>מה גורם לעדכון להיכנס לתוקף</th></tr>
<tr><td>ספרייה, כמו openssl או libcurl</td><td>restart לשירותים שטוענים אותה</td></tr>
<tr><td>glibc</td><td>restart כמעט לכל דבר — בפועל, reboot</td></tr>
<tr><td>systemd</td><td><code>systemctl daemon-reexec</code></td></tr>
<tr><td>Kernel ו-microcode של ה-CPU</td><td>reboot (או live patch ל-CVEs של kernel)</td></tr></table>
<blockquote>💡 מהשטח: ב-Ubuntu, ה-unattended-upgrades מגיע עם <code>Automatic-Reboot "false"</code>, אז שרתים יושבים בשקט חודשים עם kernel מתוקן ב-<code>/boot</code> ו-kernel פגיע שרץ בפועל. תהפוך את "צריך reboot" למטריקה (קובץ textfile ל-node_exporter, או <code>kured_reboot_required</code> של kured) ותתריע כשמכונה מחכה ל-reboot יותר מ-7 ימים.</blockquote>`
      }
    },
    {
      h: { en: "Kernel reboots across a Kubernetes fleet: kured, and live patching's limits", he: "Reboots של kernel ב-fleet של Kubernetes: kured, והגבולות של live patching" },
      body: {
        en: `<p>Rebooting a node evicts every pod on it, so you can't reboot 60 nodes at once. <strong>kured</strong> (KUbernetes REboot Daemon, a CNCF project) is a DaemonSet that, every <code>--period</code>, checks the reboot sentinel on its node. If a reboot is needed it takes a cluster-wide lock (an annotation on the kured DaemonSet), <strong>cordons</strong> and <strong>drains</strong> the node through the Eviction API (so PDBs are honored), reboots it, uncordons it once it is Ready, and releases the lock. Default concurrency is 1: one node at a time.</p>
<pre># kured DaemonSet args (excerpt)
args:
  - --period=10m
  - --reboot-days=mo,tu,we,th
  - --start-time=02:00
  - --end-time=05:00
  - --time-zone=Asia/Jerusalem
  - --prometheus-url=http://prometheus.monitoring:9090
  - --alert-filter-regexp=^(RebootRequired|Watchdog)$   # don't let these block reboots
  - --blocking-pod-selector=app=nightly-etl              # never reboot under this job
  - --drain-timeout=30m
  - --concurrency=1
# RHEL-family nodes have no sentinel file; use the exit code instead:
#  --reboot-sentinel-command=sh -c "! needs-restarting -r"</pre>
<p>Do the math: 60 nodes × ~6 min (drain 2-3 min, reboot 1-2 min, Ready) ≈ 6 hours — two nights inside a 02:00-05:00 window. Gates that save you: any firing Prometheus alert pauses reboots (filter out the "reboot required" alert itself or you deadlock), and a PDB with <code>minAvailable</code> equal to replicas blocks the drain forever, so set <code>--drain-timeout</code> and alert on it.</p>
<p><strong>Live patching</strong> (kpatch on RHEL, Canonical Livepatch on Ubuntu Pro) redirects vulnerable kernel functions to fixed versions in memory, no reboot. Limits: it covers the <strong>kernel only</strong> (not glibc, openssl or microcode), only CVEs that can be fixed by swapping functions (not data-structure changes), only supported kernel builds and only for a limited time per build. It buys you weeks until the next window; it does not replace reboots.</p>
<pre>$ sudo kpatch list                      # RHEL: loaded live patches
$ canonical-livepatch status --verbose  # Ubuntu Pro: patch state per CVE</pre>`,
        he: `<p>reboot ל-node מפנה את כל ה-pods שעליו, אז אי אפשר לעשות reboot ל-60 nodes ביחד. <strong>kured</strong> (KUbernetes REboot Daemon, פרויקט של CNCF) הוא DaemonSet שבודק כל <code>--period</code> את קובץ הסימון של ה-reboot ב-node שלו. אם צריך reboot, הוא לוקח lock ברמת ה-cluster (annotation על ה-DaemonSet של kured), עושה <strong>cordon</strong> ו-<strong>drain</strong> ל-node דרך ה-Eviction API (כך ש-PDBs מכובדים), מבצע reboot, עושה uncordon כשה-node חוזר ל-Ready, ומשחרר את ה-lock. ברירת המחדל של concurrency היא 1: node אחד בכל פעם.</p>
<pre># kured DaemonSet args (excerpt)
args:
  - --period=10m
  - --reboot-days=mo,tu,we,th
  - --start-time=02:00
  - --end-time=05:00
  - --time-zone=Asia/Jerusalem
  - --prometheus-url=http://prometheus.monitoring:9090
  - --alert-filter-regexp=^(RebootRequired|Watchdog)$   # don't let these block reboots
  - --blocking-pod-selector=app=nightly-etl              # never reboot under this job
  - --drain-timeout=30m
  - --concurrency=1
# RHEL-family nodes have no sentinel file; use the exit code instead:
#  --reboot-sentinel-command=sh -c "! needs-restarting -r"</pre>
<p>תעשה את החשבון: 60 nodes כפול כ-6 דקות לכל אחד (drain של 2-3 דקות, reboot של 1-2 דקות, ואז Ready) זה בערך 6 שעות — שני לילות בחלון של 02:00-05:00. השערים שמצילים אותך: כל alert שבוער ב-Prometheus עוצר את ה-reboots (תסנן החוצה את ה-alert של "צריך reboot" עצמו, אחרת נוצר deadlock), ו-PDB שבו <code>minAvailable</code> שווה למספר ה-replicas חוסם את ה-drain לנצח, אז תגדיר <code>--drain-timeout</code> ותתריע עליו.</p>
<p><strong>Live patching</strong> (kpatch ב-RHEL, ו-Canonical Livepatch ב-Ubuntu Pro) מפנה פונקציות פגיעות של ה-kernel לגרסאות מתוקנות בזיכרון, בלי reboot. המגבלות: הוא מכסה <strong>רק את ה-kernel</strong> (לא glibc, לא openssl ולא microcode), רק CVEs שאפשר לתקן בהחלפת פונקציות (לא שינויים במבני נתונים), רק builds נתמכים של kernel ורק לזמן מוגבל לכל build. הוא קונה לך שבועות עד החלון הבא; הוא לא מחליף reboots.</p>
<pre>$ sudo kpatch list                      # RHEL: loaded live patches
$ canonical-livepatch status --verbose  # Ubuntu Pro: patch state per CVE</pre>`
      }
    },
    {
      h: { en: "At fleet scale: SSM Patch Manager, or rebuild the image?", he: "בקנה מידה של fleet: SSM Patch Manager, או לבנות image מחדש?" },
      body: {
        en: `<p><strong>AWS SSM Patch Manager</strong> patches EC2 (and on-prem) in place. A <strong>patch baseline</strong> is the policy of which patches are approved: e.g. classification Security, severity Critical/Important, auto-approved 7 days after release (a built-in soak period), plus explicit approve/reject lists. You run the <code>AWS-RunPatchBaseline</code> document with <code>Operation=Scan</code> (compliance report only) or <code>Install</code>, inside a maintenance window, in waves by tag.</p>
<pre>$ aws ssm create-patch-baseline --name al2023-prod \\
    --operating-system AMAZON_LINUX_2023 \\
    --approval-rules 'PatchRules=[{PatchFilterGroup={PatchFilters=[{Key=CLASSIFICATION,Values=[Security]},{Key=SEVERITY,Values=[Critical,Important]}]},ApproveAfterDays=7}]'
$ aws ssm send-command --document-name AWS-RunPatchBaseline \\
    --targets Key=tag:PatchWave,Values=canary \\
    --parameters Operation=Install,RebootOption=RebootIfNeeded \\
    --max-concurrency 10% --max-errors 1
$ aws ssm describe-instance-patch-states --instance-ids i-0abc123 \\
    --query 'InstancePatchStates[].[InstanceId,MissingCount,InstalledPendingRebootCount]'</pre>
<table><tr><th></th><th>Patch in place (apt/dnf, SSM, kured)</th><th>Rebuild the image (immutable AMI / node image)</th></tr>
<tr><td>How</td><td>Update packages on running hosts, reboot in waves</td><td>Build a new AMI weekly (Packer, EC2 Image Builder, or the provider's node image), replace instances</td></tr>
<tr><td>Drift</td><td>Hosts slowly diverge</td><td>Every host is identical to a tested image</td></tr>
<tr><td>Rollback</td><td>Downgrading packages: painful</td><td>Roll back to the previous image ID</td></tr>
<tr><td>Fits</td><td>Pets: VMs with DBs, legacy, licensed boxes</td><td>Cattle: Kubernetes nodes, Auto Scaling groups</td></tr></table>
<pre>$ aws eks update-nodegroup-version --cluster-name prod --nodegroup-name general
# EKS managed node group: roll every node to the latest AMI release, honoring PDBs
# Karpenter: pin the AMI version in the EC2NodeClass and bump it in a PR;
# NodePool expireAfter: 720h recycles every node within 30 days</pre>
<blockquote>💡 Real world: when a critical OpenSSL or kernel CVE drops, teams with a weekly image pipeline just run it early and roll nodes the same day — the path is exercised every week. Teams with hand-patched pets spend the first days just finding every vulnerable host. Many Kubernetes shops use both: rotate node images weekly, and keep kured for the emergency in between.</blockquote>`,
        he: `<p><strong>AWS SSM Patch Manager</strong> מעדכן EC2 (וגם שרתי on-prem) במקום. <strong>patch baseline</strong> הוא המדיניות של אילו patches מאושרים: למשל סיווג Security, חומרה Critical או Important, ואישור אוטומטי 7 ימים אחרי השחרור (תקופת soak מובנית), ועוד רשימות מפורשות של אישור ודחייה. מריצים את המסמך <code>AWS-RunPatchBaseline</code> עם <code>Operation=Scan</code> (רק דוח compliance) או <code>Install</code>, בתוך maintenance window, בגלים לפי tag.</p>
<pre>$ aws ssm create-patch-baseline --name al2023-prod \\
    --operating-system AMAZON_LINUX_2023 \\
    --approval-rules 'PatchRules=[{PatchFilterGroup={PatchFilters=[{Key=CLASSIFICATION,Values=[Security]},{Key=SEVERITY,Values=[Critical,Important]}]},ApproveAfterDays=7}]'
$ aws ssm send-command --document-name AWS-RunPatchBaseline \\
    --targets Key=tag:PatchWave,Values=canary \\
    --parameters Operation=Install,RebootOption=RebootIfNeeded \\
    --max-concurrency 10% --max-errors 1
$ aws ssm describe-instance-patch-states --instance-ids i-0abc123 \\
    --query 'InstancePatchStates[].[InstanceId,MissingCount,InstalledPendingRebootCount]'</pre>
<table><tr><th></th><th>Patching במקום (apt/dnf, SSM, kured)</th><th>בנייה מחדש של ה-image (immutable AMI / node image)</th></tr>
<tr><td>איך</td><td>מעדכנים חבילות על מכונות שרצות, ו-reboot בגלים</td><td>בונים AMI חדש כל שבוע (Packer, EC2 Image Builder, או ה-node image של הספק) ומחליפים את המכונות</td></tr>
<tr><td>Drift</td><td>המכונות מתרחקות זו מזו לאט</td><td>כל מכונה זהה ל-image שנבדק</td></tr>
<tr><td>Rollback</td><td>downgrade לחבילות: כואב</td><td>חוזרים ל-image ID הקודם</td></tr>
<tr><td>מתאים ל-</td><td>Pets: מכונות עם DB, מערכות legacy, שרתים עם רישיון</td><td>Cattle: nodes של Kubernetes ו-Auto Scaling groups</td></tr></table>
<pre>$ aws eks update-nodegroup-version --cluster-name prod --nodegroup-name general
# EKS managed node group: roll every node to the latest AMI release, honoring PDBs
# Karpenter: pin the AMI version in the EC2NodeClass and bump it in a PR;
# NodePool expireAfter: 720h recycles every node within 30 days</pre>
<blockquote>💡 מהשטח: כשיוצא CVE קריטי ב-OpenSSL או ב-kernel, צוותים עם pipeline שבועי של images פשוט מריצים אותו מוקדם ומגלגלים את ה-nodes באותו יום — המסלול הזה רץ כל שבוע. צוותים עם pets שמעדכנים ידנית מבלים את הימים הראשונים רק במציאת כל מכונה פגיעה. הרבה חברות עם Kubernetes עושות את שניהם: מחליפות node images כל שבוע, ומשאירות את kured למקרה חירום באמצע.</blockquote>`
      }
    }
  ],
  diagram: `  signed repo mirror               image pipeline (weekly)
  snapshot 2026-11-17              Packer / EC2 Image Builder
        |                                  |
  dev --> staging --> prod          new AMI / node image
        |                                  |
  unattended-upgrades / dnf-automatic      node group update / Karpenter drift
  SSM Patch Manager (baseline, waves)      (replace nodes, PDBs honored)
        |
  /var/run/reboot-required  or  needs-restarting -r == 1
        |
  kured: lock -> cordon -> drain -> reboot -> uncordon -> unlock
         1 node at a time, mo-th 02:00-05:00, no firing alerts`,
  handsOn: [
    {
      cmd: "apt list --upgradable 2>/dev/null | grep -i security",
      what: { en: "Ubuntu/Debian: list pending updates that come from the security pocket. On RHEL: <code>dnf updateinfo list --security</code>.", he: "ב-Ubuntu ו-Debian: להציג עדכונים שמחכים ושמגיעים מה-security pocket. ב-RHEL: <code>dnf updateinfo list --security</code>." }
    },
    {
      cmd: "cat /var/run/reboot-required.pkgs 2>/dev/null; sudo needs-restarting -r; echo \"exit=$?\"",
      what: { en: "Ask the machine whether it needs a reboot and which packages caused it (the first part on Debian/Ubuntu, the second on RHEL).", he: "לשאול את המכונה אם היא צריכה reboot ואילו חבילות גרמו לזה (החלק הראשון ל-Debian/Ubuntu, השני ל-RHEL)." }
    },
    {
      cmd: "apt-cache policy nginx && apt-mark showhold",
      what: { en: "See the candidate version, which pin or repo won, and every held package.", he: "לראות את גרסת ה-candidate, איזה pin או repo ניצח, ואת כל החבילות שמוחזקות." }
    },
    {
      cmd: "sudo unattended-upgrade --dry-run --debug",
      what: { en: "Show exactly what unattended-upgrades would install tonight, without installing anything.", he: "להראות בדיוק מה ה-unattended-upgrades יתקין הלילה, בלי להתקין כלום." }
    },
    {
      cmd: "kubectl get nodes -o custom-columns=NAME:.metadata.name,KERNEL:.status.nodeInfo.kernelVersion,OS:.status.nodeInfo.osImage",
      what: { en: "Spot kernel drift across a cluster: nodes still on the old kernel are the ones that haven't rebooted.", he: "לזהות drift של kernel ב-cluster: ה-nodes שעדיין על ה-kernel הישן הם אלה שלא עשו reboot." }
    }
  ],
  mnemonic: {
    en: "\"Sign it, pin it (rarely), patch it, reboot it — or rebuild it.\" And: patched on disk ≠ patched in memory.",
    he: "\"לחתום, לנעול (לעתים רחוקות), לעדכן, לעשות reboot — או לבנות מחדש.\" ועוד אחד: מעודכן בדיסק ≠ מעודכן בזיכרון."
  },
  pitfalls: [
    { en: "\"Fixing\" a signature error with <code>trusted=yes</code>, <code>gpgcheck=0</code> or a global <code>apt-key add</code>. You just let any mirror or vendor key install code as root on your fleet. Scope a key per repo with <code>Signed-By</code>.", he: "\"לתקן\" שגיאת חתימה עם <code>trusted=yes</code>, <code>gpgcheck=0</code> או <code>apt-key add</code> גלובלי. בזה נתת לכל mirror או מפתח של ספק להתקין קוד כ-root על כל ה-fleet. מצמידים מפתח ל-repo אחד עם <code>Signed-By</code>." },
    { en: "Turning on automatic updates and never tracking reboots: the dashboard says 100% patched while the running kernel and long-lived services still use the vulnerable code.", he: "להדליק עדכונים אוטומטיים ולא לעקוב אחרי reboots: הדשבורד אומר 100% מעודכן, בזמן שה-kernel שרץ ושירותים ותיקים עדיין משתמשים בקוד הפגיע." },
    { en: "Pins without an owner or expiry. A held package stops getting security fixes, and nobody remembers why it was held.", he: "Pins בלי בעלים ובלי תאריך תפוגה. חבילה מוחזקת מפסיקה לקבל תיקוני אבטחה, ואף אחד לא זוכר למה נעלו אותה." },
    { en: "Rebooting Kubernetes nodes in parallel or with kured concurrency set high, or with PDBs that never allow an eviction — either capacity collapses or the drain hangs all night. One node at a time, drain timeout, alert-gated.", he: "לעשות reboot ל-nodes של Kubernetes במקביל, או עם concurrency גבוה ב-kured, או עם PDBs שלא מאפשרים אף eviction — או שהקיבולת קורסת או שה-drain תקוע כל הלילה. node אחד בכל פעם, עם drain timeout, ועם חסימה כשיש alerts." }
  ],
  interview: [
    {
      q: { en: "A critical kernel CVE is published. You run 300 EC2 VMs and three EKS clusters. Walk me through the response.", he: "פורסם CVE קריטי ב-kernel. יש לך 300 מכונות EC2 ושלושה clusters של EKS. תעביר אותי דרך התגובה." },
      a: { en: "Scope first: which kernels and distros are affected, is it exploitable in our setup, and is a live patch available to cover the gap. EKS: wait for (or build) the fixed node AMI, test it on a dev node group, then roll nodes cluster by cluster — managed node group update or a Karpenter AMI bump — with PDBs honored; kured covers any in-place nodes. EC2: approve the patch in the SSM baseline, run AWS-RunPatchBaseline Install with RebootIfNeeded in waves by tag (canary, 10%, the rest) inside maintenance windows, and watch InstalledPendingRebootCount reach 0. Report compliance by kernel version actually running, not by packages installed.", he: "קודם היקף: אילו kernels והפצות מושפעים, האם זה ניתן לניצול אצלנו, והאם יש live patch שיכסה את הפער. ב-EKS: מחכים ל-AMI מתוקן של nodes (או בונים אותו), בודקים על node group של dev, ואז מגלגלים nodes cluster אחרי cluster — update ל-managed node group או העלאת AMI ב-Karpenter — עם כיבוד PDBs; kured מכסה nodes שמעודכנים במקום. ב-EC2: מאשרים את ה-patch ב-baseline של SSM, מריצים AWS-RunPatchBaseline עם Install ו-RebootIfNeeded בגלים לפי tag (canary, 10%, השאר) בתוך maintenance windows, ומוודאים ש-InstalledPendingRebootCount יורד ל-0. מדווחים compliance לפי גרסת ה-kernel שרצה בפועל, לא לפי החבילות שהותקנו." }
    },
    {
      q: { en: "Patch in place or rebuild the image — how do you decide?", he: "Patching במקום או בנייה מחדש של ה-image — איך מחליטים?" },
      a: { en: "If the hosts are cattle (Kubernetes nodes, ASG members, anything recreated by automation) rebuild: a weekly image pipeline gives identical hosts, trivial rollback to the previous image ID, and an emergency path that is exercised every week. Patch in place for pets that are expensive to replace (VMs with local data, licensed or legacy boxes), with signed snapshot repos, SSM baselines and reboot waves. Most fleets end up hybrid: immutable for nodes, in-place for the few pets, and kured or live patching to cover the gap between image rotations.", he: "אם המכונות הן cattle (nodes של Kubernetes, חברי ASG, כל מה שאוטומציה יוצרת מחדש) בונים מחדש: pipeline שבועי של images נותן מכונות זהות, rollback פשוט ל-image ID הקודם, ומסלול חירום שרץ כל שבוע. מעדכנים במקום pets שיקר להחליף (מכונות עם דאטה מקומי, שרתים עם רישיון או legacy), עם repos חתומים ו-snapshots, baselines ב-SSM וגלי reboot. רוב ה-fleets מגיעים להיברידי: immutable ל-nodes, עדכון במקום למעט ה-pets, ו-kured או live patching כדי לכסות את הפער בין החלפות image." }
    }
  ],
  quiz: [
    {
      q: { en: "Why is <code>Signed-By</code> in a repo definition better than the old <code>apt-key add</code>?", he: "למה <code>Signed-By</code> בהגדרת repo עדיף על <code>apt-key add</code> הישן?" },
      options: [
        { en: "It downloads packages faster", he: "הוא מוריד חבילות מהר יותר" },
        { en: "It skips signature checks for trusted vendors", he: "הוא מדלג על בדיקת חתימה לספקים מהימנים" },
        { en: "The key is trusted only for that repo, so a third-party key can't sign packages for the official repos", he: "המפתח מקבל אמון רק עבור ה-repo הזה, כך שמפתח של צד שלישי לא יכול לחתום על חבילות של ה-repos הרשמיים" },
        { en: "It pins the repo to one version", he: "הוא נועל את ה-repo לגרסה אחת" }
      ],
      answer: 2,
      explain: { en: "apt-key put keys in a global keyring trusted for every source. Signed-By scopes trust per repo.", he: "apt-key שם מפתחות ב-keyring גלובלי שמקבל אמון עבור כל מקור. Signed-By מגביל את האמון ל-repo אחד." }
    },
    {
      q: { en: "You updated <code>openssl</code> on a server (no kernel change). What makes the fix effective?", he: "עדכנת <code>openssl</code> בשרת (בלי שינוי ב-kernel). מה גורם לתיקון להיכנס לתוקף?" },
      options: [
        { en: "Restarting the services that load libssl (needrestart / needs-restarting -s lists them)", he: "restart לשירותים שטוענים את libssl (<code>needrestart</code> או <code>needs-restarting -s</code> מציגים אותם)" },
        { en: "Nothing: running processes pick up the new library automatically", he: "כלום: תהליכים שרצים טוענים את הספרייה החדשה אוטומטית" },
        { en: "Only a full reboot", he: "רק reboot מלא" },
        { en: "A kernel live patch", he: "Live patch ל-kernel" }
      ],
      answer: 0,
      explain: { en: "Running processes keep the old library mapped until they restart. A reboot works but isn't required; live patching only covers the kernel.", he: "תהליכים שרצים מחזיקים את הספרייה הישנה ממופה עד שהם עושים restart. reboot יעבוד אבל לא נדרש; live patching מכסה רק את ה-kernel." }
    },
    {
      q: { en: "What does kured do by default when several nodes have <code>/var/run/reboot-required</code>?", he: "מה kured עושה כברירת מחדל כשלכמה nodes יש <code>/var/run/reboot-required</code>?" },
      options: [
        { en: "Reboots all of them at the same time to finish faster", he: "עושה reboot לכולם ביחד כדי לסיים מהר" },
        { en: "Takes a cluster-wide lock and cordons, drains, reboots and uncordons one node at a time", he: "לוקח lock ברמת ה-cluster ועושה cordon, drain, reboot ו-uncordon ל-node אחד בכל פעם" },
        { en: "Applies a live patch instead of rebooting", he: "מחיל live patch במקום reboot" },
        { en: "Replaces the nodes with a new AMI", he: "מחליף את ה-nodes ב-AMI חדש" }
      ],
      answer: 1,
      explain: { en: "kured serializes reboots with a lock (concurrency 1 by default) and drains via the Eviction API, so PDBs are honored.", he: "kured מסדר את ה-reboots בתור עם lock (concurrency 1 כברירת מחדל) ועושה drain דרך ה-Eviction API, כך ש-PDBs מכובדים." }
    },
    {
      q: { en: "Which statement about live patching (kpatch, Canonical Livepatch) is true?", he: "איזו טענה על live patching (kpatch או Canonical Livepatch) נכונה?" },
      options: [
        { en: "It removes the need for reboots permanently", he: "הוא מבטל לצמיתות את הצורך ב-reboots" },
        { en: "It also patches glibc and openssl in memory", he: "הוא מתקן גם את glibc ואת openssl בזיכרון" },
        { en: "It only works inside containers", he: "הוא עובד רק בתוך containers" },
        { en: "It covers only kernel CVEs that can be fixed by swapping functions, on supported kernels for a limited time — you still reboot eventually", he: "הוא מכסה רק CVEs של kernel שאפשר לתקן בהחלפת פונקציות, ב-kernels נתמכים ולזמן מוגבל — בסוף עדיין עושים reboot" }
      ],
      answer: 3,
      explain: { en: "Live patching buys time between maintenance windows; userspace libraries, microcode and structural kernel changes still need restarts or reboots.", he: "Live patching קונה זמן בין חלונות תחזוקה; ספריות userspace, microcode ושינויים מבניים ב-kernel עדיין דורשים restart או reboot." }
    }
  ],
  related: ["linux-hardening", "linux-systemd-logs", "k8s-day2-upgrades", "k8s-fleet-upgrades", "cloud-iac", "staff-supply-chain"]
});

INFRA.lessons.push({
  id: "rel-safe-config-changes",
  track: "reliability",
  order: 187,
  icon: "🎛️",
  level: 2,
  minutes: 13,
  title: { en: "Safe config changes: config is code", he: "שינויי config בטוחים: config הוא קוד" },
  tldr: {
    en: "Config changes cause as many big outages as code — often more, because they skip the pipeline and propagate in seconds. Treat config as code: reviewed, validated by schema and policy, rolled out in stages with bake time and automatic rollback, consumed fail-static, behind a kill switch, and audited. A config push should be boring.",
    he: "שינויי config מפילים מערכות לא פחות מקוד — לפעמים יותר, כי הם עוקפים את ה-pipeline ומתפשטים תוך שניות. מתייחסים ל-config כמו לקוד: code review, ולידציה עם schema ו-policy, rollout בשלבים עם bake time ו-rollback אוטומטי, צרכנים שנשארים על הגרסה הטובה האחרונה, kill switch ו-audit מלא. דחיפת config צריכה להיות משעממת."
  },
  analogy: {
    en: "A restaurant chain. A new oven (code) gets tested in one kitchen for weeks. But the recipe card (config) is edited in head office and faxed to all 2,000 branches at noon: a typo turns \"salt: 50 g\" into \"500 g\" and every lunch in the country is ruined at once. A smart chain sends the new card to one branch first, tastes the dish, waits an hour, then one region, then everyone — and every branch keeps last week's card in the drawer and refuses a card that's obviously wrong.",
    he: "רשת מסעדות. תנור חדש (קוד) נבדק במטבח אחד במשך שבועות. אבל כרטיס המתכון (config) נערך במטה ונשלח בפקס לכל 2,000 הסניפים בצהריים: טעות הקלדה הופכת \"מלח: 50 גרם\" ל\"500 גרם\" וכל ארוחות הצהריים בארץ נהרסות ביחד. רשת חכמה שולחת את הכרטיס החדש לסניף אחד, טועמת, מחכה שעה, אחר כך לאזור אחד, ורק אז לכולם — וכל סניף שומר במגירה את הכרטיס של שבוע שעבר ומסרב לכרטיס שברור שהוא שגוי."
  },
  sections: [
    {
      h: { en: "Why config is a top outage trigger", he: "למה config הוא אחד הגורמים המובילים להשבתות" },
      body: {
        en: `<p>Google's SRE book estimates that roughly <strong>70% of outages are caused by changes to a live system</strong>, and config is the change type with the least protection. Code goes through tests, review, a canary and a progressive rollout; config is often a one-line edit in a UI, pushed everywhere in seconds by a system designed to be fast.</p>
<p>Why it's more dangerous than code: tiny diff, huge effect (a timeout, a regex, an empty list); propagation is global <em>by design</em>; config is often generated by another system, so nobody reviews the output; and consumers frequently crash on input they never expected.</p>
<table><tr><th>Public incident (high level)</th><th>What happened</th></tr>
<tr><td>Cloudflare, July 2019</td><td>A new WAF rule with a regex that backtracked catastrophically was pushed to the whole edge at once; CPU hit 100% worldwide and traffic failed for ~27 minutes.</td></tr>
<tr><td>CrowdStrike, July 2024</td><td>A sensor content/config file sent to all Windows hosts at once crashed about 8.5 million machines; that content type had no staged rollout.</td></tr>
<tr><td>Google Cloud, June 2025</td><td>Policy data with unexpected blank fields replicated globally within seconds; a new code path without a feature flag or error handling crashed, and many Google Cloud APIs failed for hours.</td></tr>
<tr><td>Cloudflare, November 2025</td><td>An auto-generated bot-management feature file doubled in size after a database permissions change, exceeded a hard limit in the proxy, and caused widespread 5xx errors.</td></tr></table>
<p>The pattern repeats: <strong>global at once</strong>, <strong>validated for syntax but not meaning</strong>, and <strong>consumers that crash instead of rejecting bad input</strong>.</p>`,
        he: `<p>ספר ה-SRE של Google מעריך שבערך <strong>70% מההשבתות נגרמות משינויים במערכת חיה</strong>, ו-config הוא סוג השינוי עם הכי מעט הגנות. קוד עובר טסטים, code review, canary ו-rollout הדרגתי; config הוא הרבה פעמים עריכה של שורה אחת ב-UI, שמערכת שנבנתה להיות מהירה דוחפת לכל מקום תוך שניות.</p>
<p>למה הוא מסוכן יותר מקוד: diff קטנטן עם השפעה ענקית (timeout, regex, רשימה ריקה); ההתפשטות גלובלית <em>מעצם התכנון</em>; הרבה פעמים מערכת אחרת מייצרת את ה-config, אז אף אחד לא עובר על התוצר; והצרכנים קורסים לא פעם על קלט שהם לא ציפו לו.</p>
<table><tr><th>תקלה ציבורית (ברמה גבוהה)</th><th>מה קרה</th></tr>
<tr><td>Cloudflare, יולי 2019</td><td>חוק WAF חדש עם regex שנכנס ל-backtracking קטסטרופלי נדחף לכל ה-edge בבת אחת; ה-CPU הגיע ל-100% בכל העולם והטראפיק נכשל כ-27 דקות.</td></tr>
<tr><td>CrowdStrike, יולי 2024</td><td>קובץ תוכן/config של ה-sensor שנשלח לכל מכונות ה-Windows בבת אחת הפיל בערך 8.5 מיליון מכונות; לסוג התוכן הזה לא היה rollout בשלבים.</td></tr>
<tr><td>Google Cloud, יוני 2025</td><td>דאטה של policy עם שדות ריקים לא צפויים שוכפל לכל העולם תוך שניות; מסלול קוד חדש בלי feature flag ובלי טיפול בשגיאות קרס, והרבה APIs של Google Cloud נכשלו במשך שעות.</td></tr>
<tr><td>Cloudflare, נובמבר 2025</td><td>קובץ features של bot management שנוצר אוטומטית הוכפל בגודלו אחרי שינוי הרשאות ב-DB, עבר מגבלה קשיחה ב-proxy, וגרם לשגיאות 5xx נרחבות.</td></tr></table>
<p>הדפוס חוזר: <strong>גלובלי בבת אחת</strong>, <strong>נבדק לתחביר אבל לא למשמעות</strong>, ו<strong>צרכנים שקורסים במקום לדחות קלט רע</strong>.</p>`
      }
    },
    {
      h: { en: "Configuration design and config as code (the SRE workbook view)", he: "תכנון configuration ו-config as code (הגישה של ה-SRE workbook)" },
      body: {
        en: `<p>The SRE workbook's two configuration chapters boil down to:</p>
<ul><li><strong>Config is a user interface.</strong> Every knob is a way to break production. Fewer mandatory options, safe defaults, and names that say what they do. Don't expose an internal detail as a knob "just in case".</li>
<li><strong>Config is code.</strong> It lives in version control, gets reviewed by someone who owns the consumer, is tested in CI and deployed by a pipeline — not edited by hand on a server or in a console.</li>
<li><strong>Use a real config language for generation</strong> (Jsonnet, CUE) instead of copy-pasting 40 YAML files per environment: define once, override per env, and generate hermetically so the same input always yields the same output. Review the <em>generated diff</em>, not just the template change.</li></ul>
<pre>// schema.cue — types and bounds, not just syntax
#RateLimit: {
  service:        string &amp; =~"^[a-z0-9-]+$"
  requestsPerSec: int &amp; &gt;=1 &amp; &lt;=50000
  burst:          int &amp; &gt;=1 &amp; &lt;=100000
  regions:        [...("us-east-1" | "eu-west-1" | "ap-south-1")]
}
limits: [...#RateLimit]

$ cue vet schema.cue limits.yaml
limits.3.requestsPerSec: invalid value 0 (out of bound &gt;=1)</pre>
<blockquote>⚠️ Production tip: the most dangerous config is the one nobody wrote — files generated by another pipeline (feature files, ACLs exported from a DB, routing tables). Put the same gates on generated config as on hand-written config: schema, size limits, and a diff against the last good version.</blockquote>`,
        he: `<p>שני פרקי ה-configuration ב-SRE workbook מסתכמים בזה:</p>
<ul><li><strong>Config הוא ממשק משתמש.</strong> כל כפתור הוא עוד דרך לשבור את הפרודקשן. פחות אפשרויות חובה, ברירות מחדל בטוחות, ושמות שאומרים מה הם עושים. לא חושפים פרט פנימי ככפתור "ליתר ביטחון".</li>
<li><strong>Config הוא קוד.</strong> הוא חי ב-version control, עובר review אצל מי שאחראי על הצרכן, נבדק ב-CI ועולה דרך pipeline — לא נערך ביד על שרת או בקונסולה.</li>
<li><strong>משתמשים בשפת config אמיתית לייצור</strong> (Jsonnet או CUE) במקום להעתיק 40 קבצי YAML לכל סביבה: מגדירים פעם אחת, דורסים לפי סביבה, ומייצרים בצורה הרמטית כך שאותו קלט תמיד נותן אותו פלט. עוברים על ה-<em>diff של התוצר</em>, לא רק על השינוי בתבנית.</li></ul>
<pre>// schema.cue — types and bounds, not just syntax
#RateLimit: {
  service:        string &amp; =~"^[a-z0-9-]+$"
  requestsPerSec: int &amp; &gt;=1 &amp; &lt;=50000
  burst:          int &amp; &gt;=1 &amp; &lt;=100000
  regions:        [...("us-east-1" | "eu-west-1" | "ap-south-1")]
}
limits: [...#RateLimit]

$ cue vet schema.cue limits.yaml
limits.3.requestsPerSec: invalid value 0 (out of bound &gt;=1)</pre>
<blockquote>⚠️ טיפ לפרודקשן: ה-config הכי מסוכן הוא זה שאף אחד לא כתב — קבצים שנוצרים ב-pipeline אחר (קבצי features, ACLs שמיוצאים מ-DB, טבלאות ניתוב). שמים על config שנוצר אוטומטית את אותם שערים כמו על config שנכתב ביד: schema, מגבלות גודל, ו-diff מול הגרסה הטובה האחרונה.</blockquote>`
      }
    },
    {
      h: { en: "Validate before it ships: five layers", he: "ולידציה לפני שזה יוצא: חמש שכבות" },
      body: {
        en: `<table><tr><th>Layer</th><th>Catches</th><th>Tools</th></tr>
<tr><td>Syntax</td><td>Broken YAML/JSON</td><td><code>yamllint</code>, <code>jq .</code></td></tr>
<tr><td>Schema</td><td>Wrong types, missing fields, out-of-range values</td><td>JSON Schema (<code>check-jsonschema</code>), CUE, protobuf</td></tr>
<tr><td>Consumer dry-run</td><td>What the real program would reject</td><td><code>nginx -t</code>, <code>envoy --mode validate</code>, <code>promtool check config</code>, <code>kubectl apply --dry-run=server</code>, <code>terraform plan</code></td></tr>
<tr><td>Policy</td><td>Valid but forbidden: 0.0.0.0/0 allowed, timeout &gt; 30 s, no owner label</td><td>OPA/conftest, Kyverno</td></tr>
<tr><td>Diff sanity</td><td>"Valid" changes that are suspiciously big</td><td>A guard: change touches &gt; 10% of routes/rules, or file size jumps 2× → block or require a second approver</td></tr></table>
<pre># policy/routes.rego — run with: conftest test --policy policy/ config/routes.json
package main
import rego.v1

deny contains msg if {
  some r in input.routes
  r.timeout_ms &gt; 30000
  msg := sprintf("route %s: timeout %dms is above 30s", [r.name, r.timeout_ms])
}

deny contains msg if {
  count(input.allowed_cidrs) == 0
  msg := "allowed_cidrs is empty: this would block every client"
}</pre>
<p>The last line of defense is the <strong>consumer</strong>. When new config fails to parse or validate, it must <strong>fail static</strong>: keep serving with the <strong>last known good</strong> config, alert, and report the version it rejected. Never crash-loop on bad config, and never fall back to "empty" — an empty allowlist denies everyone and an empty route table 404s everything.</p>`,
        he: `<table><tr><th>שכבה</th><th>מה היא תופסת</th><th>כלים</th></tr>
<tr><td>תחביר</td><td>YAML או JSON שבורים</td><td><code>yamllint</code>, <code>jq .</code></td></tr>
<tr><td>Schema</td><td>טיפוסים שגויים, שדות חסרים, ערכים מחוץ לטווח</td><td>JSON Schema (<code>check-jsonschema</code>), CUE, protobuf</td></tr>
<tr><td>Dry-run של הצרכן</td><td>מה שהתוכנה האמיתית הייתה דוחה</td><td><code>nginx -t</code>, <code>envoy --mode validate</code>, <code>promtool check config</code>, <code>kubectl apply --dry-run=server</code>, <code>terraform plan</code></td></tr>
<tr><td>Policy</td><td>תקין אבל אסור: פתוח ל-0.0.0.0/0, timeout מעל 30 שניות, אין label של בעלים</td><td>OPA/conftest, Kyverno</td></tr>
<tr><td>שפיות של ה-diff</td><td>שינויים "תקינים" שגדולים באופן חשוד</td><td>שומר: שינוי שנוגע ביותר מ-10% מה-routes או החוקים, או קובץ שגדל פי 2 ← חסימה או אישור של עוד אדם</td></tr></table>
<pre># policy/routes.rego — run with: conftest test --policy policy/ config/routes.json
package main
import rego.v1

deny contains msg if {
  some r in input.routes
  r.timeout_ms &gt; 30000
  msg := sprintf("route %s: timeout %dms is above 30s", [r.name, r.timeout_ms])
}

deny contains msg if {
  count(input.allowed_cidrs) == 0
  msg := "allowed_cidrs is empty: this would block every client"
}</pre>
<p>קו ההגנה האחרון הוא <strong>הצרכן</strong>. כש-config חדש לא עובר parsing או ולידציה, הוא חייב לעשות <strong>fail static</strong>: להמשיך לשרת עם ה-config הטוב האחרון (<strong>last known good</strong>), להתריע, ולדווח על הגרסה שהוא דחה. אסור להיכנס ל-crash loop בגלל config רע, ואסור ליפול ל"ריק" — allowlist ריק חוסם את כולם, וטבלת routes ריקה מחזירה 404 על הכל.</p>`
      }
    },
    {
      h: { en: "Roll out config exactly like code", he: "עושים rollout ל-config בדיוק כמו לקוד" },
      body: {
        en: `<p>Stages: <strong>one canary instance or cell → 1% → one AZ or region → 25% → global</strong>. Each stage has a <strong>bake time</strong> (minutes for high-traffic services; hours when traffic is low or the effect is slow, like memory growth or a nightly job), <strong>automatic health gates</strong> comparing the canary to a control group (error rate, latency, crash count), and <strong>automatic rollback</strong> to the previous version, which is already validated and known good.</p>
<p>Propagation speed is itself a risk knob. A system that can reach every server in 5 seconds needs a deliberately slow lane for normal changes. Keep an emergency fast lane for incidents, but make it require a reason and leave an audit entry.</p>
<pre># AWS AppConfig: validators (JSON Schema or Lambda) run before a deployment starts;
# CloudWatch alarms on the environment trigger automatic rollback during it.
$ aws appconfig start-deployment \\
    --application-id abc123 --environment-id prod01 \\
    --configuration-profile-id cfg789 --configuration-version 42 \\
    --deployment-strategy-id AppConfig.Canary10Percent20Minutes
# predefined strategies include AppConfig.AllAtOnce,
# AppConfig.Linear50PercentEvery30Seconds, AppConfig.Linear20PercentEvery6Minutes</pre>
<p>On Kubernetes, editing a ConfigMap in place changes it for every pod at their next reload or restart, outside any rollout. Generate hashed ConfigMap names (kustomize <code>configMapGenerator</code>) so a config change creates a new ReplicaSet and goes through the same rolling update or Argo Rollouts canary as code.</p>
<blockquote>💡 Real world: in most of the public postmortems above, the fix list reads the same — "stage the rollout of this config type", "add bake time", "have the consumer reject invalid input and keep the last good version". None of it is new; it's what the code pipeline already did.</blockquote>`,
        he: `<p>השלבים: <strong>instance או cell אחד של canary ← 1% ← AZ או region אחד ← 25% ← גלובלי</strong>. לכל שלב יש <strong>bake time</strong> (דקות לשירותים עם הרבה טראפיק; שעות כשהטראפיק נמוך או שההשפעה איטית, כמו זיכרון שזוחל למעלה או job לילי), <strong>שערי בריאות אוטומטיים</strong> שמשווים את ה-canary לקבוצת ביקורת (error rate, latency, מספר קריסות), ו-<strong>rollback אוטומטי</strong> לגרסה הקודמת, שכבר עברה ולידציה וידוע שהיא טובה.</p>
<p>מהירות ההתפשטות היא בעצמה כפתור סיכון. מערכת שמגיעה לכל שרת תוך 5 שניות צריכה נתיב איטי בכוונה לשינויים רגילים. משאירים נתיב חירום מהיר ל-incidents, אבל הוא דורש סיבה ומשאיר רשומת audit.</p>
<pre># AWS AppConfig: validators (JSON Schema or Lambda) run before a deployment starts;
# CloudWatch alarms on the environment trigger automatic rollback during it.
$ aws appconfig start-deployment \\
    --application-id abc123 --environment-id prod01 \\
    --configuration-profile-id cfg789 --configuration-version 42 \\
    --deployment-strategy-id AppConfig.Canary10Percent20Minutes
# predefined strategies include AppConfig.AllAtOnce,
# AppConfig.Linear50PercentEvery30Seconds, AppConfig.Linear20PercentEvery6Minutes</pre>
<p>ב-Kubernetes, עריכה של ConfigMap במקום משנה אותו לכל ה-pods ב-reload או ב-restart הבא שלהם, מחוץ לכל rollout. מייצרים שמות ConfigMap עם hash (<code>configMapGenerator</code> של kustomize), כך ששינוי config יוצר ReplicaSet חדש ועובר את אותו rolling update או canary של Argo Rollouts כמו קוד.</p>
<blockquote>💡 מהשטח: ברוב ה-postmortems הציבוריים שלמעלה, רשימת התיקונים נשמעת אותו דבר — "לעשות rollout בשלבים לסוג ה-config הזה", "להוסיף bake time", "שהצרכן ידחה קלט לא תקין וישמור את הגרסה הטובה האחרונה". שום דבר מזה לא חדש; זה מה שה-pipeline של הקוד כבר עשה.</blockquote>`
      }
    },
    {
      h: { en: "Runtime config, kill switches, audit — and the \"boring push\" checklist", he: "Config בזמן ריצה, kill switches, audit — ורשימת ה\"דחיפה המשעממת\"" },
      body: {
        en: `<p><strong>Dynamic config</strong> (feature flags, AppConfig, Consul KV, Envoy xDS) changes behavior without a deploy. That speed is the point, and exactly why a flag flip is a production change that needs the same guardrails. Every risky new code path ships behind a <strong>kill switch</strong>: a pre-built, tested off-switch that on-call can flip in seconds. Flags must default safely when the flag service is unreachable. (See the feature flags lesson for flag types and cleanup.)</p>
<p><strong>Audit</strong>: every change records who, what, when, why and a ticket or PR link — git history for config-as-code, the config service's own audit log (CloudTrail for AppConfig, Kubernetes audit logs for ConfigMaps) for runtime changes — and is emitted as an event onto dashboards (a Grafana annotation), so "what changed?" takes 10 seconds during an incident instead of 30 minutes.</p>
<p><strong>The "config push should be boring" checklist:</strong></p>
<ul><li>It's in git and was reviewed by someone who owns the consumer.</li>
<li>Validated: schema, the consumer's own dry-run, policy checks, and a diff-size guard.</li>
<li>Consumers fail static: they reject bad config, keep the last known good, and alert.</li>
<li>Staged: canary, percentage, region by region, with bake time and automatic health gates.</li>
<li>Rollback is one command, tested, and the previous version is kept.</li>
<li>New behavior sits behind a kill switch with a safe default.</li>
<li>The change is audited and annotated on dashboards.</li>
<li>Someone is watching, and it's not 17:00 on a Friday or inside a freeze without a reason.</li></ul>`,
        he: `<p><strong>Config דינמי</strong> (feature flags, AppConfig, Consul KV, xDS של Envoy) משנה התנהגות בלי deploy. המהירות הזו היא כל הרעיון, ובדיוק בגללה הדלקת flag היא שינוי פרודקשן שצריך את אותם מעקות בטיחות. כל מסלול קוד חדש ומסוכן יוצא מאחורי <strong>kill switch</strong>: מתג כיבוי מוכן ובדוק שה-on-call יכול להפוך תוך שניות. Flags חייבים ליפול לברירת מחדל בטוחה כששירות ה-flags לא זמין. (על סוגי flags וניקוי שלהם יש שיעור feature flags.)</p>
<p><strong>Audit</strong>: כל שינוי רושם מי, מה, מתי, למה, וקישור לטיקט או ל-PR — היסטוריית git ל-config as code, ולשינויים בזמן ריצה ה-audit log של שירות ה-config עצמו (CloudTrail ל-AppConfig, audit logs של Kubernetes ל-ConfigMaps) — והוא נשלח כאירוע לדשבורדים (annotation ב-Grafana), כך שהשאלה "מה השתנה?" לוקחת 10 שניות בזמן incident במקום 30 דקות.</p>
<p><strong>רשימת "דחיפת config צריכה להיות משעממת":</strong></p>
<ul><li>זה ב-git, ומי שאחראי על הצרכן עשה לזה review.</li>
<li>עבר ולידציה: schema, ה-dry-run של הצרכן עצמו, בדיקות policy, ושומר על גודל ה-diff.</li>
<li>הצרכנים עושים fail static: דוחים config רע, נשארים על ה-last known good, ומתריעים.</li>
<li>בשלבים: canary, אחוזים, region אחרי region, עם bake time ושערי בריאות אוטומטיים.</li>
<li>ה-rollback הוא פקודה אחת, נבדק, והגרסה הקודמת נשמרת.</li>
<li>התנהגות חדשה יושבת מאחורי kill switch עם ברירת מחדל בטוחה.</li>
<li>השינוי מתועד ב-audit ומסומן על הדשבורדים.</li>
<li>מישהו מסתכל, וזה לא יום שישי ב-17:00 או בתוך freeze בלי סיבה טובה.</li></ul>`
      }
    }
  ],
  diagram: `  PR (config as code)
    |
  CI: syntax -> schema -> consumer dry-run -> policy -> diff-size guard
    |
  merge  (audit: who / what / why / ticket)
    |
  canary cell --bake 15m--> 1% --bake 30m--> 1 region --bake 1h--> global
       |                      |                    |
       +---- health gate fails? ---> auto rollback to last known good

  consumer: new config invalid? -> reject, keep LKG, alert   (fail static)
  runtime:  risky path behind a kill switch, safe default if flags are down`,
  handsOn: [
    {
      cmd: "cue vet schema.cue limits.yaml",
      what: { en: "Validate data files against a CUE schema with types and bounds; a value out of range fails with the exact path.", he: "לבדוק קבצי דאטה מול schema של CUE עם טיפוסים וגבולות; ערך מחוץ לטווח נכשל עם הנתיב המדויק." }
    },
    {
      cmd: "check-jsonschema --schemafile schemas/routes.schema.json config/routes.json",
      what: { en: "JSON Schema validation in CI (pip install check-jsonschema). Add <code>minItems</code>, <code>maximum</code> and <code>enum</code> so the schema checks meaning, not just shape.", he: "ולידציה של JSON Schema ב-CI (pip install check-jsonschema). תוסיף <code>minItems</code>, <code>maximum</code> ו-<code>enum</code> כדי שה-schema יבדוק משמעות ולא רק מבנה." }
    },
    {
      cmd: "conftest test --policy policy/ config/routes.json",
      what: { en: "Run Rego policies against the config: deny empty allowlists, timeouts above 30 s, missing owners.", he: "להריץ policies ב-Rego מול ה-config: לחסום allowlists ריקים, timeouts מעל 30 שניות, ובעלים חסרים." }
    },
    {
      cmd: "kubectl diff -f configmap.yaml && kubectl apply -f configmap.yaml --dry-run=server",
      what: { en: "See exactly what a ConfigMap change would modify in the live cluster, then let the API server validate it without persisting anything.", he: "לראות בדיוק מה שינוי ב-ConfigMap ישנה ב-cluster החי, ואז לתת ל-API server לבדוק אותו בלי לשמור כלום." }
    },
    {
      cmd: "sudo nginx -t && sudo systemctl reload nginx",
      what: { en: "The smallest fail-static pattern: the consumer validates the new config and only reloads if it passes; a failed test leaves the running config untouched.", he: "תבנית ה-fail static הכי קטנה: הצרכן בודק את ה-config החדש ועושה reload רק אם הוא עבר; טסט שנכשל משאיר את ה-config שרץ בלי שינוי." }
    }
  ],
  mnemonic: {
    en: "\"Config is code with a faster blast\": Review → Validate → Stage → Bake → Roll back — and always keep the last known good.",
    he: "\"Config הוא קוד שמתפוצץ מהר יותר\": review ← ולידציה ← שלבים ← bake ← rollback — ותמיד לשמור את ה-last known good."
  },
  pitfalls: [
    { en: "Changing config outside the pipeline (console clicks, <code>kubectl edit</code>, a flag UI with no review): no validation, no staging, no audit, and the next deploy silently reverts or conflicts with it.", he: "לשנות config מחוץ ל-pipeline (קליקים בקונסולה, <code>kubectl edit</code>, ממשק flags בלי review): אין ולידציה, אין שלבים, אין audit, וה-deploy הבא דורס את השינוי בשקט או מתנגש בו." },
    { en: "Validating syntax only. Perfectly valid YAML can set a timeout to 0, empty an allowlist, or route 100% of traffic to a region with no capacity.", he: "לבדוק רק תחביר. YAML תקין לגמרי יכול לקבוע timeout של 0, לרוקן allowlist, או לשלוח 100% מהטראפיק ל-region בלי קיבולת." },
    { en: "Consumers that crash or load an empty config on bad input instead of keeping the last known good. That turns one bad file into a global outage.", he: "צרכנים שקורסים או טוענים config ריק כשמגיע קלט רע, במקום להישאר על ה-last known good. ככה קובץ רע אחד הופך להשבתה גלובלית." },
    { en: "\"It's just a small config change\" pushed globally with no bake time. Small diffs are exactly where people skip the process, which is why they show up in postmortems.", he: "\"זה רק שינוי config קטן\" שנדחף גלובלית בלי bake time. דווקא ב-diffs קטנים אנשים מדלגים על התהליך, ובגלל זה הם מופיעים ב-postmortems." }
  ],
  interview: [
    {
      q: { en: "Design a safe rollout for a system that pushes rate-limit rules to 5,000 edge servers in 30 regions.", he: "תתכנן rollout בטוח למערכת שדוחפת חוקי rate limit ל-5,000 שרתי edge ב-30 regions." },
      a: { en: "Rules live in git, generated from a typed source (CUE/Jsonnet) and reviewed as a generated diff. CI runs schema validation, the edge binary's own validator, policies (no rule may block more than X% of traffic, regexes must compile in a linear-time engine) and a size/diff guard. The distributor ships versioned snapshots: one canary server, then one PoP, then 1%, one region, 25%, global, with bake time and automatic gates on CPU, 5xx and block rate compared to control servers; a failed gate re-pushes the previous version. Edge servers validate every snapshot on load and fail static to the last known good, reporting the version they run. An emergency fast path exists for incidents but needs a reason and is audited; every push is annotated on dashboards.", he: "החוקים חיים ב-git, נוצרים ממקור עם טיפוסים (CUE או Jsonnet) ועוברים review על ה-diff שנוצר. ה-CI מריץ ולידציית schema, את ה-validator של הבינארי ב-edge עצמו, policies (אסור לחוק לחסום יותר מ-X% מהטראפיק, regexes חייבים להתקמפל במנוע בזמן לינארי) ושומר על גודל ה-diff. המפיץ שולח snapshots עם גרסה: שרת canary אחד, אחר כך PoP אחד, 1%, region אחד, 25%, וגלובלי — עם bake time ושערים אוטומטיים על CPU, 5xx ושיעור החסימות מול שרתי ביקורת; שער שנכשל דוחף מחדש את הגרסה הקודמת. שרתי ה-edge בודקים כל snapshot בטעינה ועושים fail static ל-last known good, ומדווחים איזו גרסה רצה אצלם. יש נתיב חירום מהיר ל-incidents, אבל הוא דורש סיבה ונרשם ב-audit; כל דחיפה מסומנת על הדשבורדים." }
    },
    {
      q: { en: "Why are config changes often riskier than code deploys, and what would you change in an org where engineers edit production config in a UI?", he: "למה שינויי config מסוכנים לפעמים יותר מ-deploys של קוד, ומה היית משנה בארגון שבו מהנדסים עורכים config של פרודקשן ב-UI?" },
      a: { en: "Config propagates faster (often globally in seconds), skips tests and canaries, has tiny diffs with huge effects, and is often machine-generated with nobody reviewing the output. I'd move it to config as code: git plus review by the consumer's owner, schema plus policy plus dry-run in CI, a pipeline that stages config with bake time and automatic rollback, consumers that fail static, and the UI kept only for kill switches and incident overrides — audited and annotated. Then I'd measure it: the share of incidents whose trigger was a config change, and the share of config changes that went through the pipeline.", he: "Config מתפשט מהר יותר (הרבה פעמים גלובלית תוך שניות), מדלג על טסטים ועל canaries, יש לו diffs קטנים עם השפעה ענקית, והרבה פעמים מכונה מייצרת אותו ואף אחד לא עובר על התוצר. הייתי מעביר ל-config as code: git ו-review אצל הבעלים של הצרכן, schema ו-policy ו-dry-run ב-CI, pipeline שמגלגל config בשלבים עם bake time ו-rollback אוטומטי, צרכנים שעושים fail static, וה-UI נשאר רק ל-kill switches ולעקיפות בזמן incident — עם audit ו-annotations. ואז הייתי מודד: איזה חלק מה-incidents התחיל משינוי config, ואיזה חלק משינויי ה-config עבר דרך ה-pipeline." }
    }
  ],
  quiz: [
    {
      q: { en: "Several famous global outages started with a config change. What did they typically have in common?", he: "כמה השבתות גלובליות מפורסמות התחילו משינוי config. מה בדרך כלל היה משותף להן?" },
      options: [
        { en: "A missing database index", he: "אינדקס חסר ב-DB" },
        { en: "Too many unit tests slowed the fix", he: "יותר מדי unit tests האטו את התיקון" },
        { en: "A DNS TTL that was too long", he: "TTL של DNS ארוך מדי" },
        { en: "The change reached everyone within seconds with no staged rollout, and consumers crashed on input they didn't expect", he: "השינוי הגיע לכולם תוך שניות בלי rollout בשלבים, והצרכנים קרסו על קלט שהם לא ציפו לו" }
      ],
      answer: 3,
      explain: { en: "Global-at-once propagation plus consumers without fail-static behavior turns one bad file into a worldwide outage.", he: "התפשטות גלובלית בבת אחת, יחד עם צרכנים שלא עושים fail static, הופכת קובץ רע אחד להשבתה עולמית." }
    },
    {
      q: { en: "A config file parses and passes its JSON Schema, but sets <code>allowed_cidrs: []</code>. What should have caught it?", he: "קובץ config עובר parsing ועובר את ה-JSON Schema שלו, אבל קובע <code>allowed_cidrs: []</code>. מה היה צריך לתפוס את זה?" },
      options: [
        { en: "Nothing — schema-valid means safe", he: "כלום — תקין לפי schema זה בטוח" },
        { en: "A semantic check: a policy rule (or minItems: 1 in the schema) plus a diff guard on how much access changes", he: "בדיקה סמנטית: חוק policy (או <code>minItems: 1</code> ב-schema) ועוד שומר diff על כמה גישה משתנה" },
        { en: "The load balancer will ignore an empty list", he: "ה-Load Balancer יתעלם מרשימה ריקה" },
        { en: "The postmortem", he: "ה-postmortem" }
      ],
      answer: 1,
      explain: { en: "Syntax and shape aren't meaning. Encode intent as policy (\"never empty\", \"never 0.0.0.0/0\") and block suspiciously large access changes.", he: "תחביר ומבנה הם לא משמעות. מקודדים את הכוונה כ-policy (\"אף פעם לא ריק\", \"אף פעם לא 0.0.0.0/0\") וחוסמים שינויי גישה גדולים באופן חשוד." }
    },
    {
      q: { en: "A service receives a new config version that fails validation. What is the correct behavior?", he: "שירות מקבל גרסת config חדשה שנכשלת בוולידציה. מה ההתנהגות הנכונה?" },
      options: [
        { en: "Crash so the orchestrator restarts it with fresh config", he: "לקרוס כדי שה-orchestrator יעשה לו restart עם config טרי" },
        { en: "Load an empty config and keep running", he: "לטעון config ריק ולהמשיך לרוץ" },
        { en: "Keep serving with the last known good config, alert, and report the rejected version (fail static)", he: "להמשיך לשרת עם ה-config הטוב האחרון, להתריע, ולדווח על הגרסה שנדחתה (fail static)" },
        { en: "Apply only the parts that parsed", he: "להחיל רק את החלקים שעברו parsing" }
      ],
      answer: 2,
      explain: { en: "Crashing spreads the outage to every instance, empty config fails open or closed unpredictably, and partial application creates states nobody tested.", he: "קריסה מפיצה את ההשבתה לכל instance, config ריק נכשל פתוח או סגור באופן לא צפוי, והחלה חלקית יוצרת מצבים שאף אחד לא בדק." }
    },
    {
      q: { en: "A config change goes to a low-traffic internal service (5 req/min). How should bake time differ from a 10,000 req/s service?", he: "שינוי config הולך לשירות פנימי עם מעט טראפיק (5 בקשות לדקה). איך ה-bake time צריך להיות שונה משירות של 10,000 req/s?" },
      options: [
        { en: "Longer bake time (or synthetic traffic) — you need enough requests to see a difference with confidence", he: "Bake time ארוך יותר (או טראפיק סינתטי) — צריך מספיק בקשות כדי לראות הבדל בביטחון" },
        { en: "Shorter, since fewer users are affected", he: "קצר יותר, כי פחות משתמשים מושפעים" },
        { en: "The same 5 minutes everywhere for consistency", he: "אותן 5 דקות בכל מקום, בשביל עקביות" },
        { en: "No bake time is needed for internal services", he: "שירותים פנימיים לא צריכים bake time" }
      ],
      answer: 0,
      explain: { en: "In 5 minutes a 5 req/min service serves 25 requests — too few to detect a 2% error rate. Extend the bake or drive synthetic checks.", he: "ב-5 דקות שירות של 5 בקשות לדקה מקבל 25 בקשות — מעט מדי כדי לזהות error rate של 2%. מאריכים את ה-bake או מריצים בדיקות סינתטיות." }
    }
  ],
  related: ["rel-deployments", "arch-feature-flags", "rel-incident-management", "staff-cells-blast-radius", "k8s-config", "k8s-argo-rollouts", "k8s-security-policy"]
});

INFRA.glossary.push(
  { term: "kured", track: "linux", aliases: ["Kubernetes Reboot Daemon"], def: { en: "A Kubernetes DaemonSet that watches each node's reboot sentinel and reboots nodes one at a time: take a lock, cordon, drain, reboot, uncordon, within a time window and only when no alerts fire.", he: "DaemonSet ל-Kubernetes שעוקב אחרי סימן ה-reboot בכל node ועושה reboot ל-nodes אחד-אחד: לוקח lock, עושה cordon ו-drain, מבצע reboot ואז uncordon — בתוך חלון זמן ורק כשאין alerts." }, lesson: "linux-patching-packages" },
  { term: "Live patching", track: "linux", aliases: ["livepatch", "kpatch", "Canonical Livepatch"], def: { en: "Applying kernel security fixes in memory without a reboot (kpatch, Canonical Livepatch). Kernel only, function-level fixes, supported kernels for a limited time; it delays reboots, it doesn't replace them.", he: "החלת תיקוני אבטחה ל-kernel בזיכרון בלי reboot (kpatch או Canonical Livepatch). רק ל-kernel, רק תיקונים ברמת פונקציה, וב-kernels נתמכים לזמן מוגבל; זה דוחה reboots, לא מחליף אותם." }, lesson: "linux-patching-packages" },
  { term: "Version pinning", track: "linux", aliases: ["apt-mark hold", "dnf versionlock", "apt pinning"], def: { en: "Holding a package at a version or series (apt preferences, apt-mark hold, dnf versionlock) because it's coupled to something else. Every pin stops security fixes for that package, so it needs an owner and a review date.", he: "החזקת חבילה בגרסה או בסדרת גרסאות מסוימת (apt preferences, apt-mark hold, dnf versionlock) כי היא קשורה למשהו אחר. כל pin עוצר תיקוני אבטחה לחבילה, אז צריך לו בעלים ותאריך בדיקה." }, lesson: "linux-patching-packages" },
  { term: "Patch baseline", track: "linux", aliases: ["patch baselines"], def: { en: "In AWS SSM Patch Manager, the rules for which patches are approved for a group of instances: classification, severity, auto-approve delay, explicit approve/reject lists.", he: "ב-AWS SSM Patch Manager, החוקים של אילו patches מאושרים לקבוצת מכונות: סיווג, חומרה, השהיה לפני אישור אוטומטי, ורשימות מפורשות של אישור ודחייה." }, lesson: "linux-patching-packages" },
  { term: "Immutable infrastructure", track: "linux", aliases: ["golden image", "golden AMI", "immutable image"], def: { en: "Never patching servers in place: build a new image (AMI, node image) with the fixes, test it, and replace the instances. Rollback means going back to the previous image.", he: "לא מעדכנים שרתים במקום: בונים image חדש (AMI או node image) עם התיקונים, בודקים אותו, ומחליפים את המכונות. Rollback זה לחזור ל-image הקודם." }, lesson: "linux-patching-packages" },
  { term: "Config as code", track: "reliability", aliases: ["configuration as code"], def: { en: "Treating configuration like software: in version control, reviewed, validated in CI, generated from typed sources, and deployed through a staged pipeline instead of edited by hand.", he: "להתייחס ל-configuration כמו לתוכנה: ב-version control, עם review, ולידציה ב-CI, נוצר ממקורות עם טיפוסים, ועולה דרך pipeline בשלבים במקום עריכה ידנית." }, lesson: "rel-safe-config-changes" },
  { term: "Bake time", track: "reliability", aliases: ["bake period", "soak time"], def: { en: "How long a change sits at one rollout stage, watched by health gates, before it may advance. Longer for low-traffic services and slow-burning effects.", he: "כמה זמן שינוי נשאר בשלב אחד של rollout, תחת שערי בריאות, לפני שמותר לו להתקדם. ארוך יותר לשירותים עם מעט טראפיק ולהשפעות שמתפתחות לאט." }, lesson: "rel-safe-config-changes" },
  { term: "Last known good config", track: "reliability", aliases: ["last known good", "LKG", "fail static"], def: { en: "The most recent config version that validated and ran healthily. A consumer that gets invalid config keeps serving with it and alerts (fail static) instead of crashing or loading an empty config.", he: "גרסת ה-config האחרונה שעברה ולידציה ורצה בלי בעיות. צרכן שמקבל config לא תקין ממשיך לשרת איתה ומתריע (fail static), במקום לקרוס או לטעון config ריק." }, lesson: "rel-safe-config-changes" },
  { term: "Policy as code", track: "reliability", aliases: ["conftest"], def: { en: "Organizational rules written as code (Rego with OPA/conftest, Kyverno) and run automatically against config in CI or at admission: no 0.0.0.0/0, timeouts under 30 s, owner labels required.", he: "חוקים ארגוניים שנכתבים כקוד (Rego עם OPA או conftest, Kyverno) ורצים אוטומטית מול config ב-CI או ב-admission: בלי 0.0.0.0/0, timeouts מתחת ל-30 שניות, label של בעלים חובה." }, lesson: "rel-safe-config-changes" },
  { term: "JSON Schema", track: "reliability", aliases: ["JSONSchema"], def: { en: "A standard vocabulary for describing the shape of JSON/YAML data — types, required fields, ranges, enums, minItems — used to validate config before it ships.", he: "שפה סטנדרטית לתיאור המבנה של דאטה ב-JSON או YAML — טיפוסים, שדות חובה, טווחים, enums, minItems — שמשמשת לבדוק config לפני שהוא יוצא." }, lesson: "rel-safe-config-changes" }
);
