// Track: foundations — CPU, memory, storage/IO, processes, Linux toolkit, VMs, latency numbers
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
var INFRA = window.INFRA; // explicit binding so the file also runs in non-browser sandboxes (tools/validate.js)

/* ============================== CPU ============================== */
INFRA.lessons.push({
  id: "cpu",
  track: "foundations",
  order: 1,
  icon: "🧠",
  level: 1,
  minutes: 9,
  title: { en: "CPU: cores, threads & why 'load' isn't 'usage'", he: "CPU: ליבות, threads ולמה load זה לא usage" },
  tldr: {
    en: "A CPU core runs one thing at a time, very fast; everything else is waiting in line — and how long that line is (load) matters as much as how busy the core is (CPU%).",
    he: "ליבת CPU מריצה דבר אחד בכל רגע, ממש מהר; כל השאר עומדים בתור — ואורך התור (load) חשוב לא פחות מכמה הליבה עסוקה (CPU%)."
  },
  analogy: {
    en: "Think of a CPU as a kitchen. Each core is a chef; hyperthreading gives each chef a second cutting board so they can switch tasks while one pot boils, but it's still one pair of hands. The clock speed is how fast each chef chops. Load average is the number of orders hanging on the rail — chefs can be at 100% and the rail can still be overflowing.",
    he: "תחשוב על ה-CPU כמו על מטבח של מסעדה. כל core הוא שף; hyperthreading נותן לכל שף קרש חיתוך שני, כדי שיחליף משימה בזמן שהסיר רותח — אבל זה עדיין אותו זוג ידיים. ה-clock speed זה כמה מהר השף חותך. ה-load average זה מספר ההזמנות שתלויות על המסילה — השפים יכולים להיות ב-100% ועדיין המסילה מתפוצצת מהזמנות."
  },
  sections: [
    {
      h: { en: "Cores, hyperthreads and clock speed", he: "ליבות, hyperthreads ו-clock speed" },
      body: {
        en: `<p>A <strong>core</strong> is an independent execution unit: it fetches instructions and executes them. A 3 GHz core ticks 3 billion times per second and, thanks to pipelining, can retire several instructions per tick. <strong>Hyperthreading</strong> (Intel) / SMT (AMD) exposes each physical core as 2 <em>logical</em> CPUs. They share the same execution units, so when one thread stalls waiting on memory, the other can use the core. Real gain: roughly <strong>+15–30%</strong>, not 2x.</p>
<p>So a "16 vCPU" cloud machine is usually <strong>8 physical cores × 2 hyperthreads</strong>. Run <code>lscpu</code> and look at <code>Thread(s) per core</code>, <code>Core(s) per socket</code> and <code>Socket(s)</code>. <code>nproc</code> prints logical CPUs — that's the number Linux schedules onto.</p>
<blockquote>💡 Real world: on AWS, 1 vCPU = 1 hyperthread, not a full core. A c6i.large (2 vCPU) is one physical core. Benchmark accordingly before you promise "it'll be 2x faster with 2x the vCPUs".</blockquote>`,
        he: `<p><strong>Core</strong> היא יחידת ביצוע עצמאית: מביאה הוראות ומריצה אותן. Core של 3 GHz מתקתקת 3 מיליארד פעמים בשנייה, ובזכות pipelining יכולה לסיים כמה הוראות בכל טיק. <strong>Hyperthreading</strong> (אצל Intel) או SMT (אצל AMD) חושף כל core פיזית כ-2 מעבדים <em>לוגיים</em>. הם חולקים את אותן יחידות ביצוע, אז כשthread אחד תקוע ומחכה לזיכרון, השני משתמש ב-core. הרווח האמיתי: בערך <strong>15–30%</strong>, לא פי 2.</p>
<p>כלומר מכונה בענן עם "16 vCPU" היא בדרך כלל <strong>8 ליבות פיזיות × 2 hyperthreads</strong>. תריץ <code>lscpu</code> ותסתכל על <code>Thread(s) per core</code>, <code>Core(s) per socket</code> ו-<code>Socket(s)</code>. הפקודה <code>nproc</code> מחזירה את מספר ה-CPUs הלוגיים — זה המספר שה-scheduler של Linux עובד איתו.</p>
<blockquote>💡 מהשטח: ב-AWS, vCPU אחד = hyperthread אחד, לא core מלאה. c6i.large עם 2 vCPU זו core פיזית אחת. תעשה benchmark לפני שאתה מבטיח "עם פי 2 vCPU זה ירוץ פי 2 מהר".</blockquote>`
      }
    },
    {
      h: { en: "Context switches: the hidden tax", he: "Context switches: המס הנסתר" },
      body: {
        en: `<p>Linux runs hundreds of processes on a handful of cores by <strong>time-slicing</strong>: the scheduler gives each runnable thread a few milliseconds, then saves its registers and loads another's. That swap is a <strong>context switch</strong>. One costs ~1–5 µs directly, but the real cost is indirect: the new thread finds the CPU caches full of someone else's data and has to refill them.</p>
<p>A healthy server does thousands of switches per second; check <code>vmstat 1</code>, column <code>cs</code>. If you see hundreds of thousands per second, something is thrashing — typically way too many threads fighting over a lock, or a thread pool of 2,000 on a 4-core box. <code>pidstat -w 1</code> shows voluntary switches (thread blocked on IO — normal) vs non-voluntary (kicked off the CPU because its slice ended — a sign of CPU contention).</p>
<blockquote>⚠️ Production tip: "more threads = more throughput" stops being true once threads exceed cores for CPU-bound work. Size CPU-bound pools ≈ number of cores; IO-bound pools can be larger.</blockquote>`,
        he: `<p>Linux מריץ מאות תהליכים על כמה ליבות בודדות בעזרת <strong>time-slicing</strong>: ה-scheduler נותן לכל thread שמוכן לרוץ כמה מילישניות, ואז שומר את ה-registers שלו וטוען של מישהו אחר. ההחלפה הזו היא <strong>context switch</strong>. ישירות היא עולה בערך 1–5 µs, אבל המחיר האמיתי עקיף: ה-thread החדש מגלה שה-caches של ה-CPU מלאים בדאטה של מישהו אחר, וצריך למלא אותם מחדש.</p>
<p>שרת בריא עושה אלפי switches בשנייה; תבדוק עם <code>vmstat 1</code>, בעמודה <code>cs</code>. אם אתה רואה מאות אלפים בשנייה, משהו מתחבט — בדרך כלל יותר מדי threads שנלחמים על lock, או thread pool של 2,000 על מכונה עם 4 ליבות. <code>pidstat -w 1</code> מפריד בין voluntary (ה-thread נחסם על IO — תקין) ל-non-voluntary (העיפו אותו מה-CPU כי נגמר לו הזמן — סימן לתחרות על CPU).</p>
<blockquote>⚠️ טיפ לפרודקשן: "יותר threads = יותר throughput" מפסיק להיות נכון ברגע שיש יותר threads מליבות בעבודה CPU-bound. pool לעבודה CPU-bound צריך להיות בערך כמספר הליבות; pool לעבודה IO-bound יכול להיות גדול יותר.</blockquote>`
      }
    },
    {
      h: { en: "Load average vs CPU%", he: "Load average מול CPU%" },
      body: {
        en: `<p><strong>CPU%</strong> answers "how busy were the cores?". <strong>Load average</strong> answers "how many tasks wanted to run (or were stuck in uninterruptible IO wait)?", averaged over 1, 5 and 15 minutes. You see both in <code>uptime</code> and <code>top</code>.</p>
<p>The rule of thumb: <strong>divide load by the number of cores</strong>. On a 4-core box, load 4.0 = fully busy, no queue. Load 12 = every core busy <em>plus</em> ~8 tasks waiting — latency is suffering even though CPU% "only" shows 100%. Linux quirk: load also counts processes in <code>D</code> state (waiting on disk/NFS), so a high load with low CPU% usually means an <strong>IO problem</strong>, not a CPU problem.</p>
<pre>$ uptime
 14:02:11 up 12 days,  load average: 7.82, 6.10, 3.95
$ nproc
4          # 7.82 / 4 ≈ 2x oversubscribed, and rising (1m &gt; 15m)</pre>
<p>Read the three numbers as a trend: 1m &gt; 15m means things are getting worse right now.</p>`,
        he: `<p><strong>CPU%</strong> עונה על "כמה הליבות היו עסוקות?". <strong>Load average</strong> עונה על "כמה משימות רצו לרוץ (או היו תקועות ב-IO wait שאי אפשר להפריע לו)?", בממוצע על 1, 5 ו-15 דקות. רואים את שניהם ב-<code>uptime</code> וב-<code>top</code>.</p>
<p>כלל האצבע: <strong>תחלק את ה-load במספר הליבות</strong>. על מכונה עם 4 ליבות, load של 4.0 = עסוק לגמרי, בלי תור. Load של 12 = כל הליבות עסוקות <em>ועוד</em> כ-8 משימות מחכות — ה-latency סובל, למרות שה-CPU% מראה "רק" 100%. קטע של Linux: ה-load סופר גם תהליכים במצב <code>D</code> (מחכים לדיסק/NFS), אז load גבוה עם CPU% נמוך בדרך כלל אומר <strong>בעיית IO</strong>, לא בעיית CPU.</p>
<pre>$ uptime
 14:02:11 up 12 days,  load average: 7.82, 6.10, 3.95
$ nproc
4          # 7.82 / 4 ≈ 2x oversubscribed, and rising (1m &gt; 15m)</pre>
<p>תקרא את שלושת המספרים כמגמה: אם 1m גדול מ-15m, המצב מחמיר ממש עכשיו.</p>`
      }
    },
    {
      h: { en: "CPU-bound vs IO-bound", he: "CPU-bound מול IO-bound" },
      body: {
        en: `<p>A <strong>CPU-bound</strong> workload is limited by computation: image resizing, JSON parsing of huge payloads, compression, crypto, ML inference. Give it more/faster cores and it goes faster. An <strong>IO-bound</strong> workload spends most of its time waiting — on the database, an HTTP call, disk. A typical web API handler is 5 ms of CPU and 95 ms waiting on Postgres. Doubling the cores does nothing for it; fixing the slow query does everything.</p>
<p>How to tell: under load, is CPU% near 100% on the process? CPU-bound. Is CPU low but latency high, with lots of threads blocked? IO-bound. This decides your scaling strategy, your thread-pool size, and whether async (Node.js, Go goroutines, Python asyncio) will help — async shines for IO-bound work and does nothing for CPU-bound work (a CPU-heavy loop blocks Node's event loop for everybody).</p>
<blockquote>💡 Real world: "We added 4x CPUs and p99 didn't move" is the classic sign you were IO-bound all along. Profile before you scale.</blockquote>`,
        he: `<p>עומס <strong>CPU-bound</strong> מוגבל ע"י חישוב: שינוי גודל תמונות, פרסור JSON ענק, דחיסה, הצפנה, ML inference. תן לו עוד ליבות או ליבות מהירות יותר — והוא ירוץ מהר יותר. עומס <strong>IO-bound</strong> מבלה את רוב הזמן בהמתנה — לדאטאבייס, לקריאת HTTP, לדיסק. handler טיפוסי של API זה 5 ms של CPU ו-95 ms של המתנה ל-Postgres. להכפיל ליבות לא יעשה לו כלום; לתקן את ה-query האיטי יעשה הכל.</p>
<p>איך יודעים: תחת עומס, ה-CPU% של התהליך קרוב ל-100%? CPU-bound. ה-CPU נמוך אבל ה-latency גבוה, ויש המון threads חסומים? IO-bound. זה קובע את אסטרטגיית ה-scaling, את גודל ה-thread pool, והאם async (Node.js, goroutines ב-Go, asyncio בפייתון) יעזור — async מצוין ל-IO-bound ולא עושה כלום ל-CPU-bound (לולאה כבדה חוסמת את ה-event loop של Node לכולם).</p>
<blockquote>💡 מהשטח: "הוספנו פי 4 CPU וה-p99 לא זז" זה הסימן הקלאסי שהייתם IO-bound כל הזמן. תעשה profiling לפני שאתה עושה scaling.</blockquote>`
      }
    },
    {
      h: { en: "Millicores and throttling (preview)", he: "Millicores ו-throttling (טעימה)" },
      body: {
        en: `<p>In containers and Kubernetes, CPU is measured in <strong>millicores</strong>: <code>1000m</code> = 1 full CPU, <code>250m</code> = a quarter of one. A limit of <code>500m</code> doesn't mean "half a core, forever" — it's enforced by the Linux CFS quota: in every <strong>100 ms period</strong>, your container may use <strong>50 ms</strong> of CPU time total (across all its threads). Use it up in the first 20 ms with 4 busy threads? You're <strong>throttled</strong> — frozen — for the remaining 80 ms.</p>
<p>That's why a service can show "30% average CPU" and still have terrible p99 latency: it bursts, hits the quota, and stalls. Check <code>nr_throttled</code> in <code>/sys/fs/cgroup/cpu.stat</code> or the <code>container_cpu_cfs_throttled_periods_total</code> metric. Throttling is a latency problem disguised as "CPU looks fine". Details in the <em>k8s-resources</em> lesson — and play with the simulator below.</p>
<blockquote>⚠️ Production tip: memory limits kill you (OOM); CPU limits only slow you down. Many teams set CPU requests but omit CPU limits for latency-sensitive services.</blockquote>`,
        he: `<p>בקונטיינרים וב-Kubernetes מודדים CPU ב-<strong>millicores</strong>: <code>1000m</code> = CPU שלם, <code>250m</code> = רבע. limit של <code>500m</code> לא אומר "חצי core, לתמיד" — הוא נאכף ע"י ה-CFS quota של Linux: בכל <strong>period של 100 ms</strong>, הקונטיינר שלך יכול להשתמש ב-<strong>50 ms</strong> של זמן CPU בסך הכל (על כל ה-threads יחד). שרפת את זה ב-20 ה-ms הראשונות עם 4 threads עסוקים? אתה ב-<strong>throttling</strong> — קפוא — ל-80 ה-ms שנשארו.</p>
<p>בגלל זה שירות יכול להראות "30% CPU בממוצע" ועדיין לסבול מ-p99 latency נוראי: הוא עושה burst, נתקע ב-quota, ונעצר. תבדוק את <code>nr_throttled</code> ב-<code>/sys/fs/cgroup/cpu.stat</code> או את המטריקה <code>container_cpu_cfs_throttled_periods_total</code>. Throttling זו בעיית latency שמתחפשת ל"ה-CPU נראה בסדר". פירוט מלא בשיעור <em>k8s-resources</em> — ותשחק עם הסימולטור למטה.</p>
<blockquote>⚠️ טיפ לפרודקשן: memory limit הורג אותך (OOM); CPU limit רק מאט אותך. הרבה צוותים מגדירים CPU requests אבל מוותרים על CPU limits בשירותים רגישים ל-latency.</blockquote>`
      }
    }
  ],
  diagram: `  4 cores, load 7  ->  4 running + 3 waiting in the run queue

  core0 [T1]   core1 [T2]   core2 [T3]   core3 [T4]
                 run queue: T5  T6  T7   (waiting = latency)

  CFS quota, limit 500m (50ms per 100ms period):
  |####|....................|####|....................|
   50ms used   throttled      50ms used   throttled`,
  handsOn: [
    { cmd: "lscpu | grep -E 'Model name|Socket|Core|Thread|MHz'", what: { en: "See sockets, physical cores, threads per core and clock speed.", he: "לראות sockets, ליבות פיזיות, threads לכל core ו-clock speed." } },
    { cmd: "nproc && uptime", what: { en: "Compare the load average to the number of logical CPUs.", he: "להשוות את ה-load average למספר ה-CPUs הלוגיים." } },
    { cmd: "vmstat 1 5", what: { en: "Watch 'r' (run queue), 'cs' (context switches/s), 'us/sy/id/wa' CPU breakdown.", he: "לצפות ב-'r' (תור הריצה), 'cs' (context switches לשנייה) ובחלוקת ה-CPU ל-us/sy/id/wa." } },
    { cmd: "docker run --rm --cpus=0.5 alpine sh -c 'time sh -c \"i=0; while [ $i -lt 3000000 ]; do i=$((i+1)); done\"'", what: { en: "Run a busy loop capped at 500m and watch it take ~2x longer than uncapped.", he: "להריץ לולאה עסוקה עם הגבלה של 500m ולראות שהיא לוקחת בערך פי 2 זמן מאשר בלי הגבלה." } }
  ],
  mnemonic: {
    en: "\"Load is the LINE, CPU% is the CHEF.\" Divide load by cores: < 1 relaxed, = 1 full, > 1 people are queueing.",
    he: "\"Load זה התור, CPU% זה השף.\" תחלק load בליבות: פחות מ-1 רגוע, 1 מלא, יותר מ-1 — יש תור."
  },
  pitfalls: [
    { en: "Reading load average without dividing by core count. Load 8 is a fire on 2 cores and a nap on 64 cores.", he: "לקרוא load average בלי לחלק במספר הליבות. Load של 8 זו שריפה על 2 ליבות ומנוחה על 64." },
    { en: "Assuming high load = CPU problem. On Linux, processes stuck on disk/NFS (D state) count too — check iowait before buying CPUs.", he: "להניח ש-load גבוה = בעיית CPU. ב-Linux גם תהליכים תקועים על דיסק/NFS (מצב D) נספרים — תבדוק iowait לפני שקונים CPU." },
    { en: "Treating 2 vCPU as 2 cores. In most clouds it's 2 hyperthreads of one physical core.", he: "להתייחס ל-2 vCPU כאל 2 ליבות. ברוב העננים זה 2 hyperthreads של core פיזית אחת." },
    { en: "Ignoring CPU throttling because average CPU looks low. Averages hide bursts; check throttled periods.", he: "להתעלם מ-CPU throttling כי ה-CPU הממוצע נראה נמוך. ממוצעים מחביאים bursts; תבדוק throttled periods." }
  ],
  interview: [
    {
      q: { en: "A server shows load average 20 but CPU usage is only 15%. What's going on?", he: "שרת מראה load average של 20 אבל CPU של 15% בלבד. מה קורה?" },
      a: { en: "On Linux, load includes tasks in uninterruptible sleep (D state), usually waiting on disk or network filesystems. So it's likely an IO bottleneck: check iowait in top/vmstat, iostat -x for disk utilization and await, and look for stuck NFS mounts.", he: "ב-Linux ה-load כולל משימות ב-uninterruptible sleep (מצב D), בדרך כלל מחכות לדיסק או ל-network filesystem. אז כנראה זה צוואר בקבוק של IO: לבדוק iowait ב-top/vmstat, iostat -x בשביל utilization ו-await של הדיסק, ולחפש NFS mounts תקועים." }
    },
    {
      q: { en: "Why might a container with 30% average CPU usage have bad tail latency?", he: "למה קונטיינר עם 30% CPU בממוצע יכול לסבול מ-tail latency גרוע?" },
      a: { en: "CFS throttling. A CPU limit is enforced per 100 ms period; a multi-threaded burst can exhaust the quota early in the period and the container is frozen until the next one. Averages hide it — look at throttled periods, then raise or remove the limit, or reduce parallelism.", he: "CFS throttling. CPU limit נאכף בכל period של 100 ms; burst עם הרבה threads יכול לגמור את ה-quota בתחילת ה-period, והקונטיינר קפוא עד ה-period הבא. ממוצעים מסתירים את זה — להסתכל על throttled periods, ואז להגדיל/להסיר את ה-limit או להוריד מקביליות." }
    }
  ],
  quiz: [
    {
      q: { en: "A 4-core machine has a 1-minute load average of 8. What does it most likely mean?", he: "למכונה עם 4 ליבות יש load average של 8 בדקה האחרונה. מה זה כנראה אומר?" },
      options: [
        { en: "The CPU is at 800% and will crash", he: "ה-CPU ב-800% ועומד לקרוס" },
        { en: "About twice as many tasks want to run (or are blocked on IO) as there are cores", he: "בערך פי 2 משימות רוצות לרוץ (או חסומות על IO) ממספר הליבות" },
        { en: "8 processes exist on the machine", he: "יש 8 תהליכים על המכונה" },
        { en: "Memory is 80% full", he: "הזיכרון מלא ב-80%" }
      ],
      answer: 1,
      explain: { en: "Load counts runnable + uninterruptible tasks. 8 / 4 cores ≈ 2x oversubscribed: half the demand is waiting in line.", he: "Load סופר משימות שמוכנות לרוץ + משימות ב-uninterruptible. 8 חלקי 4 ליבות ≈ פי 2 עומס: חצי מהביקוש מחכה בתור." }
    },
    {
      q: { en: "A container has a CPU limit of 200m. What does Linux actually enforce?", he: "לקונטיינר יש CPU limit של 200m. מה Linux באמת אוכף?" },
      options: [
        { en: "It is pinned to 20% of one specific core", he: "הוא מוצמד ל-20% מ-core ספציפית אחת" },
        { en: "It may run at most 1 thread at a time", he: "הוא יכול להריץ לכל היותר thread אחד בכל רגע" },
        { en: "Up to 20 ms of CPU time per 100 ms period, across all its threads, then it's throttled", he: "עד 20 ms של זמן CPU בכל period של 100 ms, על כל ה-threads יחד, ואז throttling" },
        { en: "It gets killed if it exceeds 200m", he: "הוא נהרג אם הוא עובר את ה-200m" }
      ],
      answer: 2,
      explain: { en: "CFS quota: 0.2 × 100 ms = 20 ms per period. Exceeding it means waiting (throttling), never being killed — killing is what memory limits do.", he: "CFS quota: ‏0.2 × 100 ms = 20 ms לכל period. מעבר לזה — מחכים (throttling), לא נהרגים. להרוג זה מה ש-memory limit עושה." }
    },
    {
      q: { en: "Your API handler spends 4 ms on CPU and 120 ms waiting for the database. What helps most?", he: "ה-handler שלך מבלה 4 ms על CPU ו-120 ms בהמתנה לדאטאבייס. מה יעזור הכי הרבה?" },
      options: [
        { en: "Moving to a CPU with a higher clock speed", he: "לעבור ל-CPU עם clock speed גבוה יותר" },
        { en: "Doubling the vCPUs", he: "להכפיל את ה-vCPUs" },
        { en: "Enabling hyperthreading", he: "להפעיל hyperthreading" },
        { en: "Fixing the slow query / adding an index or cache", he: "לתקן את ה-query האיטי / להוסיף index או cache" }
      ],
      answer: 3,
      explain: { en: "It's IO-bound: 97% of the time is waiting. Faster CPUs shave a fraction of 4 ms; fixing the DB call attacks the 120 ms.", he: "זה IO-bound: ‏97% מהזמן זו המתנה. CPU מהיר יותר יחסוך חלק מ-4 ms; תיקון הקריאה לדאטאבייס תוקף את ה-120 ms." }
    }
  ],
  playground: "resources",
  related: ["memory", "linux-toolkit", "k8s-resources", "container-internals"]
});

/* ============================== MEMORY ============================== */
INFRA.lessons.push({
  id: "memory",
  track: "foundations",
  order: 2,
  icon: "🧮",
  level: 1,
  minutes: 9,
  title: { en: "Memory: RSS, page cache, swap & the OOM killer", he: "זיכרון: RSS, page cache, swap וה-OOM killer" },
  tldr: {
    en: "Linux uses 'free' RAM as disk cache on purpose; what matters is 'available', and when real memory runs out the OOM killer picks a victim — usually your biggest process.",
    he: "Linux משתמש בכוונה ב-RAM ה'פנוי' כ-cache לדיסק; מה שחשוב זה available, וכשהזיכרון האמיתי נגמר ה-OOM killer בוחר קורבן — בדרך כלל התהליך הכי גדול שלך."
  },
  analogy: {
    en: "RAM is your desk; disk is the filing cabinet down the hall. Linux hates an empty desk, so it piles up copies of recently used files (page cache) — but it'll sweep them off the instant you need space. Swap is shoving papers into a drawer under the desk: technically more room, painfully slow to dig through. The OOM killer is the office manager who, when the desk literally collapses, throws out whoever has the biggest mess.",
    he: "ה-RAM זה השולחן שלך; הדיסק זה ארון התיקים בסוף המסדרון. Linux שונא שולחן ריק, אז הוא מערים עליו העתקים של קבצים שהשתמשו בהם לאחרונה (page cache) — אבל מפנה אותם ברגע שאתה צריך מקום. Swap זה לדחוף ניירות למגירה מתחת לשולחן: טכנית יש יותר מקום, אבל לחפש שם זה סיוט. ה-OOM killer הוא מנהל המשרד שכשהשולחן ממש קורס, זורק החוצה את מי שעשה הכי הרבה בלגן."
  },
  sections: [
    {
      h: { en: "Virtual memory: every process lives in a fantasy", he: "Virtual memory: כל תהליך חי בפנטזיה" },
      body: {
        en: `<p>Each process sees its own huge, private <strong>virtual address space</strong> (128 TB on x86-64). The kernel maps virtual pages (4 KB each) to physical RAM frames only when they're actually touched. <code>malloc(1GB)</code> returns instantly and uses ~0 RAM until you write to it — that's <strong>lazy allocation</strong>, and it's why Linux happily <strong>overcommits</strong>: promising more memory than exists, betting not everyone cashes in at once.</p>
<p>Two numbers you'll see in <code>ps</code>/<code>top</code>:</p>
<ul><li><strong>VSZ / VIRT</strong> — everything mapped: reserved heap, shared libs, mmapped files. Often huge and mostly meaningless. A Java process with 40 GB VIRT is normal.</li>
<li><strong>RSS / RES</strong> — pages actually resident in RAM right now. This is what pressures the machine. (Shared libs are counted in every process's RSS, so summing RSS overcounts.)</li></ul>
<p>In containers, the number that triggers OOM is the cgroup's <strong>working set</strong> (<code>container_memory_working_set_bytes</code>), roughly RSS + active page cache.</p>`,
        he: `<p>כל תהליך רואה <strong>virtual address space</strong> פרטי וענק משלו (128 TB ב-x86-64). ה-kernel ממפה דפים וירטואליים (4 KB כל אחד) ל-RAM פיזי רק כשבאמת נוגעים בהם. <code>malloc(1GB)</code> חוזר מיד ומשתמש בכמעט 0 RAM עד שכותבים אליו — זה <strong>lazy allocation</strong>, ובגלל זה Linux עושה בכיף <strong>overcommit</strong>: מבטיח יותר זיכרון ממה שיש, בהימור שלא כולם יממשו את ההבטחה באותו זמן.</p>
<p>שני מספרים שתראה ב-<code>ps</code>/<code>top</code>:</p>
<ul><li><strong>VSZ / VIRT</strong> — כל מה שממופה: heap שהוזמן, ספריות משותפות, קבצים ב-mmap. לרוב ענק וחסר משמעות. תהליך Java עם 40 GB של VIRT זה נורמלי.</li>
<li><strong>RSS / RES</strong> — דפים שנמצאים פיזית ב-RAM עכשיו. זה מה שבאמת לוחץ על המכונה. (ספריות משותפות נספרות ב-RSS של כל תהליך, אז סכום RSS מגזים.)</li></ul>
<p>בקונטיינרים, המספר שמפעיל OOM הוא ה-<strong>working set</strong> של ה-cgroup (<code>container_memory_working_set_bytes</code>), בערך RSS ועוד page cache פעיל.</p>`
      }
    },
    {
      h: { en: "Page cache: 'free' is low and that's fine", he: "Page cache: מעט free וזה בסדר גמור" },
      body: {
        en: `<p>Every file you read goes through the <strong>page cache</strong>. Linux keeps it in otherwise-unused RAM, so the second read comes from memory (~100 ns) instead of disk (~100 µs+). Unused RAM is wasted RAM — so a healthy server shows very little "free".</p>
<pre>$ free -h
               total   used   free   shared  buff/cache   available
Mem:            31Gi   9.1Gi  412Mi   1.2Gi       21Gi        20Gi
Swap:          2.0Gi     0B   2.0Gi</pre>
<p>Panic-reading this: "only 412 MB free!" Correct reading: <strong>available = 20 GiB</strong> — that's how much apps can get, because clean cache is dropped instantly on demand. Watch <code>available</code>, not <code>free</code>. (The site linuxatemyram.com is the famous explanation.)</p>
<blockquote>💡 Real world: databases like PostgreSQL deliberately rely on the OS page cache — the classic advice is <code>shared_buffers</code> ≈ 25% of RAM, letting the kernel cache the rest. Don't "fix" the low free memory on a DB box.</blockquote>`,
        he: `<p>כל קובץ שאתה קורא עובר דרך ה-<strong>page cache</strong>. Linux שומר אותו ב-RAM שאחרת לא היה בשימוש, ככה שהקריאה השנייה מגיעה מהזיכרון (~100 ns) במקום מהדיסק (~100 µs ומעלה). RAM לא מנוצל זה RAM מבוזבז — אז שרת בריא מראה מעט מאוד free.</p>
<pre>$ free -h
               total   used   free   shared  buff/cache   available
Mem:            31Gi   9.1Gi  412Mi   1.2Gi       21Gi        20Gi
Swap:          2.0Gi     0B   2.0Gi</pre>
<p>קריאה בפאניקה: "רק 412 MB פנויים!" קריאה נכונה: <strong>available = 20 GiB</strong> — זה כמה שאפליקציות יכולות לקבל, כי cache נקי משתחרר מיד כשצריך. תסתכל על <code>available</code>, לא על <code>free</code>. (האתר linuxatemyram.com מסביר את זה בצורה המפורסמת.)</p>
<blockquote>💡 מהשטח: דאטאבייסים כמו PostgreSQL סומכים בכוונה על ה-page cache של מערכת ההפעלה — העצה הקלאסית היא <code>shared_buffers</code> ≈ 25% מה-RAM, ולתת ל-kernel לעשות cache לשאר. אל "תתקן" את ה-free הנמוך על שרת DB.</blockquote>`
      }
    },
    {
      h: { en: "Swap: the slow escape hatch", he: "Swap: פתח המילוט האיטי" },
      body: {
        en: `<p><strong>Swap</strong> is disk space used as overflow RAM: the kernel evicts cold anonymous pages (heap, not file-backed) to disk. Reading them back is a <strong>major page fault</strong> — microseconds on NVMe, milliseconds on HDD, vs ~100 ns from RAM. A little swap used for truly idle pages is harmless. Constant swapping in <em>and</em> out (<code>si</code>/<code>so</code> columns in <code>vmstat 1</code> non-zero every second) is <strong>thrashing</strong>: the machine is technically alive, practically a brick.</p>
<p><code>vm.swappiness</code> (0–200, default 60) tunes how eagerly the kernel swaps vs drops page cache. Kubernetes historically required swap <em>off</em> on nodes, because swapping makes memory limits and latency unpredictable (newer versions support it in limited modes).</p>
<blockquote>⚠️ Production tip: for latency-sensitive services, prefer failing fast (OOM, restart) over silently swapping — a process that's 50x slower but "up" is often worse than one that restarts in 3 seconds.</blockquote>`,
        he: `<p><strong>Swap</strong> זה שטח דיסק שמשמש כ-RAM רזרבי: ה-kernel מפנה לדיסק דפים אנונימיים קרים (heap, לא כאלה שמגובים בקובץ). לקרוא אותם בחזרה זה <strong>major page fault</strong> — מיקרו-שניות על NVMe, מילי-שניות על HDD, מול ~100 ns מ-RAM. קצת swap לדפים שבאמת לא בשימוש — לא מזיק. swap פנימה <em>והחוצה</em> כל הזמן (העמודות <code>si</code>/<code>so</code> ב-<code>vmstat 1</code> לא אפס כל שנייה) זה <strong>thrashing</strong>: המכונה טכנית חיה, מעשית לבנה.</p>
<p><code>vm.swappiness</code> (0–200, ברירת מחדל 60) קובע כמה בלהיטות ה-kernel עושה swap לעומת זריקת page cache. Kubernetes דרש היסטורית ש-swap יהיה <em>כבוי</em> על ה-nodes, כי swap הופך את ה-memory limits וה-latency ללא צפויים (גרסאות חדשות תומכות בזה במצבים מוגבלים).</p>
<blockquote>⚠️ טיפ לפרודקשן: בשירותים רגישים ל-latency, עדיף להיכשל מהר (OOM, restart) מאשר לעשות swap בשקט — תהליך שאיטי פי 50 אבל "למעלה" הוא לרוב גרוע יותר מתהליך שעולה מחדש תוך 3 שניות.</blockquote>`
      }
    },
    {
      h: { en: "The OOM killer and memory leaks", he: "ה-OOM killer ודליפות זיכרון" },
      body: {
        en: `<p>When the kernel can't reclaim enough memory (cache dropped, swap full or absent), it invokes the <strong>OOM killer</strong>. It scores processes (<code>/proc/PID/oom_score</code>, mostly by memory size, adjustable via <code>oom_score_adj</code> from -1000 to 1000) and sends <strong>SIGKILL</strong> to the winner. No cleanup, no graceful shutdown. In a container hitting its cgroup memory limit, the OOM kill happens inside that cgroup only — you see <strong>exit code 137</strong> and Kubernetes reports <code>OOMKilled</code>.</p>
<pre>$ dmesg -T | grep -i -A2 'out of memory'
[Tue Nov 11 03:12:44] Out of memory: Killed process 4121 (java)
  total-vm:9876544kB, anon-rss:7340032kB, oom_score_adj:0</pre>
<p>A <strong>memory leak</strong> shows up as RSS climbing in a sawtooth that never returns to baseline: up, OOM, restart, up again. Common culprits: unbounded in-memory caches/maps, listeners never removed, growing global lists. Fix with heap profiling (pprof, heap dumps, <code>--inspect</code>), not by doubling the limit.</p>
<blockquote>💡 Real world: JVMs before container-awareness sized the heap from the <em>host's</em> RAM and got OOMKilled instantly. Modern JVMs respect cgroup limits; use <code>-XX:MaxRAMPercentage=75</code>.</blockquote>`,
        he: `<p>כשה-kernel לא מצליח לפנות מספיק זיכרון (ה-cache נזרק, swap מלא או לא קיים), הוא מפעיל את ה-<strong>OOM killer</strong>. הוא נותן ציון לתהליכים (<code>/proc/PID/oom_score</code>, בעיקר לפי גודל זיכרון, ואפשר להזיז עם <code>oom_score_adj</code> מ-‎-1000 עד 1000) ושולח <strong>SIGKILL</strong> לזוכה. בלי cleanup, בלי graceful shutdown. בקונטיינר שמגיע ל-memory limit של ה-cgroup שלו, ה-OOM kill קורה רק בתוך ה-cgroup הזה — תראה <strong>exit code 137</strong> ו-Kubernetes ידווח <code>OOMKilled</code>.</p>
<pre>$ dmesg -T | grep -i -A2 'out of memory'
[Tue Nov 11 03:12:44] Out of memory: Killed process 4121 (java)
  total-vm:9876544kB, anon-rss:7340032kB, oom_score_adj:0</pre>
<p><strong>דליפת זיכרון</strong> נראית כמו RSS שמטפס בצורת מסור ולא חוזר לבסיס: עולה, OOM, restart, עולה שוב. החשודים הרגילים: cache או map בזיכרון בלי גבול, listeners שאף פעם לא מוסרים, רשימות גלובליות שגדלות. מתקנים עם heap profiling (pprof, heap dumps, <code>--inspect</code>), לא עם הכפלת ה-limit.</p>
<blockquote>💡 מהשטח: JVMs לפני שהיו container-aware קבעו את ה-heap לפי ה-RAM של <em>ה-host</em> וחטפו OOMKilled מיד. JVMs מודרניים מכבדים cgroup limits; תשתמש ב-<code>-XX:MaxRAMPercentage=75</code>.</blockquote>`
      }
    }
  ],
  diagram: `  RAM (31 GiB)
  [ used by apps 9G ][ page cache 21G (reclaimable) ][free 0.4G]
                     \\_________ available ≈ 20G _____________/

  memory pressure:  drop cache -> swap cold pages -> OOM killer -> SIGKILL (exit 137)`,
  handsOn: [
    { cmd: "free -h", what: { en: "Read the 'available' column, not 'free'.", he: "לקרוא את עמודת available, לא את free." } },
    { cmd: "ps aux --sort=-rss | head -5", what: { en: "Top memory users by RSS (column 6, in KB) vs VSZ (column 5).", he: "הצרכנים הגדולים לפי RSS (עמודה 6, ב-KB) מול VSZ (עמודה 5)." } },
    { cmd: "docker run --rm -m 64m python:3.12-slim python -c \"x=bytearray(200*1024*1024)\"; echo exit=$?", what: { en: "Allocate 200 MB inside a 64 MB container and watch it die with exit 137.", he: "להקצות 200 MB בתוך קונטיינר של 64 MB ולראות אותו מת עם exit 137." } },
    { cmd: "dmesg -T | grep -i 'killed process'", what: { en: "Find past OOM-killer victims on the host.", he: "למצוא קורבנות קודמים של ה-OOM killer על ה-host." } }
  ],
  mnemonic: {
    en: "\"Free is a lie, Available is the truth, 137 is the funeral.\" (137 = 128 + 9 = SIGKILL)",
    he: "\"free משקר, available אומר אמת, 137 זו הלוויה.\" (137 = 128 + 9 = SIGKILL)"
  },
  pitfalls: [
    { en: "Alerting on low 'free' memory. It's always low on a healthy box because of page cache; alert on 'available' or on the container working set vs its limit.", he: "להתריע על free נמוך. הוא תמיד נמוך בשרת בריא בגלל page cache; תתריע על available או על working set של הקונטיינר מול ה-limit." },
    { en: "Fixing a leak by raising the memory limit. You just moved the OOM from 2 hours to 6 hours.", he: "לתקן דליפה ע\"י הגדלת ה-memory limit. רק הזזת את ה-OOM משעתיים ל-6 שעות." },
    { en: "Looking at VSZ/VIRT and panicking. Virtual size includes reserved-but-unused memory and shared mappings.", he: "להסתכל על VSZ/VIRT ולהיכנס לפאניקה. הגודל הווירטואלי כולל זיכרון שהוזמן ולא בשימוש ומיפויים משותפים." },
    { en: "Setting the runtime heap (e.g. -Xmx) equal to the container limit. Metaspace, thread stacks, and native buffers live outside the heap — leave 20-25% headroom.", he: "להגדיר heap (למשל -Xmx) שווה ל-limit של הקונטיינר. Metaspace, stacks של threads ובאפרים native חיים מחוץ ל-heap — תשאיר 20-25% מרווח." }
  ],
  interview: [
    {
      q: { en: "free shows 300 MB free on a 64 GB server. Is it out of memory?", he: "free מראה 300 MB פנויים על שרת של 64 GB. נגמר לו הזיכרון?" },
      a: { en: "Probably not. Linux uses idle RAM for the page cache, which is reclaimable. Look at the 'available' column, swap activity (vmstat si/so), and whether there were OOM kills in dmesg.", he: "כנראה שלא. Linux משתמש ב-RAM פנוי ל-page cache, שאפשר לפנות. צריך להסתכל על עמודת available, על פעילות swap (si/so ב-vmstat), ואם היו OOM kills ב-dmesg." }
    },
    {
      q: { en: "What's the difference between RSS and VSZ?", he: "מה ההבדל בין RSS ל-VSZ?" },
      a: { en: "VSZ is the total virtual address space mapped by the process, including untouched allocations and shared libraries. RSS is how much is physically resident in RAM. RSS is what consumes real memory; VSZ is mostly bookkeeping.", he: "VSZ הוא כל ה-virtual address space שהתהליך מיפה, כולל הקצאות שלא נגעו בהן וספריות משותפות. RSS זה כמה נמצא פיזית ב-RAM. RSS הוא מה שצורך זיכרון אמיתי; VSZ זה בעיקר הנהלת חשבונות." }
    },
    {
      q: { en: "A pod restarts every few hours with exit code 137. How do you investigate?", he: "Pod עושה restart כל כמה שעות עם exit code 137. איך חוקרים?" },
      a: { en: "137 = 128 + SIGKILL(9). Check kubectl describe pod for 'OOMKilled'. Graph working-set memory over time: a sawtooth climbing to the limit suggests a leak (take heap profiles); a flat line near the limit means the limit is simply too low for the workload.", he: "137 = 128 + SIGKILL(9). לבדוק ב-kubectl describe pod אם כתוב OOMKilled. לשרטט working set לאורך זמן: מסור שמטפס עד ה-limit מרמז על דליפה (לקחת heap profiles); קו שטוח צמוד ל-limit אומר שה-limit פשוט נמוך מדי לעומס." }
    }
  ],
  quiz: [
    {
      q: { en: "free -h shows: free 400Mi, buff/cache 21Gi, available 20Gi. What's the right conclusion?", he: "free -h מראה: free 400Mi, buff/cache 21Gi, available 20Gi. מה המסקנה הנכונה?" },
      options: [
        { en: "The server is about to OOM — add RAM", he: "השרת עומד לחטוף OOM — צריך להוסיף RAM" },
        { en: "Run 'echo 3 > /proc/sys/vm/drop_caches' to free memory", he: "להריץ drop_caches כדי לשחרר זיכרון" },
        { en: "There's ~20 GiB effectively available; the cache is doing its job", he: "יש בפועל כ-20 GiB זמינים; ה-cache עושה את העבודה שלו" },
        { en: "Swap is too small", he: "ה-swap קטן מדי" }
      ],
      answer: 2,
      explain: { en: "Page cache is reclaimable on demand. 'available' estimates what apps can actually get. Dropping caches just makes the next reads slower.", he: "Page cache משתחרר לפי דרישה. available מעריך כמה אפליקציות באמת יכולות לקבל. לזרוק cache רק יאט את הקריאות הבאות." }
    },
    {
      q: { en: "A container exits with code 137. Which is the most likely cause?", he: "קונטיינר יוצא עם קוד 137. מה הסיבה הסבירה ביותר?" },
      options: [
        { en: "It received SIGKILL — commonly from the OOM killer at the memory limit", he: "הוא קיבל SIGKILL — בדרך כלל מה-OOM killer כשהגיע ל-memory limit" },
        { en: "It received SIGTERM and shut down gracefully", he: "הוא קיבל SIGTERM ונסגר יפה" },
        { en: "The image could not be pulled", he: "לא הצליחו למשוך את ה-image" },
        { en: "The CPU limit was exceeded", he: "הוא עבר את ה-CPU limit" }
      ],
      answer: 0,
      explain: { en: "Exit codes above 128 mean 'killed by signal (code - 128)'. 137 - 128 = 9 = SIGKILL. CPU limits throttle, they never kill. SIGTERM would be 143.", he: "קוד יציאה מעל 128 אומר 'נהרג ע\"י signal מספר (קוד פחות 128)'. ‏137 פחות 128 = 9 = SIGKILL. CPU limit עושה throttling, לא הורג. SIGTERM היה נותן 143." }
    },
    {
      q: { en: "Which metric best reflects real memory pressure from a single process?", he: "איזו מטריקה משקפת הכי טוב לחץ זיכרון אמיתי של תהליך בודד?" },
      options: [
        { en: "VSZ (virtual size)", he: "VSZ (גודל וירטואלי)" },
        { en: "RSS (resident set size)", he: "RSS (resident set size)" },
        { en: "The total of malloc() calls made", he: "סכום כל קריאות ה-malloc()" },
        { en: "Swap total on the host", he: "סך ה-swap על ה-host" }
      ],
      answer: 1,
      explain: { en: "RSS is what's physically in RAM. Allocations aren't backed by RAM until touched, and VSZ includes reserved/shared mappings.", he: "RSS זה מה שנמצא פיזית ב-RAM. הקצאות לא מגובות ב-RAM עד שנוגעים בהן, ו-VSZ כולל מיפויים שמורים ומשותפים." }
    }
  ],
  playground: "resources",
  related: ["cpu", "processes-linux", "k8s-resources", "container-internals"]
});

/* ============================== STORAGE & IO ============================== */
INFRA.lessons.push({
  id: "storage-io",
  track: "foundations",
  order: 3,
  icon: "💾",
  level: 1,
  minutes: 9,
  title: { en: "Storage & IO: IOPS, throughput, latency", he: "Storage ו-IO: ‏IOPS, throughput ו-latency" },
  tldr: {
    en: "Disks are judged on three different axes — IOPS (how many ops), throughput (how many MB/s) and latency (how long each op takes) — and the cloud bills and throttles you on all three.",
    he: "דיסקים נמדדים בשלושה צירים שונים — IOPS (כמה פעולות), throughput (כמה MB/s) ו-latency (כמה זמן כל פעולה) — והענן מחייב ומגביל אותך על שלושתם."
  },
  analogy: {
    en: "A disk is a post office. IOPS is how many customers the clerks serve per second; throughput is how many kilos of parcels leave per second; latency is how long you personally stand at the counter. A clerk mailing one huge pallet (big sequential write) moves lots of kilos but serves one customer; a line of people each sending a postcard (small random reads) is all about IOPS. An HDD has one clerk who must walk to the shelf for every request; an NVMe has 64 clerks who teleport.",
    he: "דיסק זה סניף דואר. IOPS זה כמה לקוחות הפקידים משרתים בשנייה; throughput זה כמה קילו חבילות יוצאות בשנייה; latency זה כמה זמן אתה אישית עומד מול הדלפק. פקיד ששולח משטח ענק אחד (כתיבה סדרתית גדולה) מזיז המון קילו אבל משרת לקוח אחד; תור של אנשים שכל אחד שולח גלויה (קריאות random קטנות) — זה כולו IOPS. ל-HDD יש פקיד אחד שצריך ללכת למדף בכל בקשה; ל-NVMe יש 64 פקידים שעושים טלפורטציה."
  },
  sections: [
    {
      h: { en: "HDD vs SSD vs NVMe", he: "HDD מול SSD מול NVMe" },
      body: {
        en: `<p>An <strong>HDD</strong> is spinning platters with a moving arm. Every random access pays a <strong>seek</strong> (~4–10 ms) — that caps it at ~100–200 random IOPS, though sequential throughput is decent (~150–250 MB/s). Cheap per TB; great for backups and archives.</p>
<p>An <strong>SATA SSD</strong> has no moving parts: ~0.1 ms latency, tens of thousands of IOPS, but it's bottlenecked by the old SATA interface at ~550 MB/s. An <strong>NVMe SSD</strong> talks directly over PCIe with many parallel queues: <strong>500K–1M+ IOPS</strong>, 3–7 GB/s, ~20–100 µs latency.</p>
<table><tr><th>Type</th><th>Random IOPS</th><th>Throughput</th><th>Latency</th></tr>
<tr><td>HDD 7200rpm</td><td>~150</td><td>~200 MB/s</td><td>~5–10 ms</td></tr>
<tr><td>SATA SSD</td><td>~50–90K</td><td>~550 MB/s</td><td>~100 µs</td></tr>
<tr><td>NVMe SSD</td><td>~500K–1M</td><td>3–7 GB/s</td><td>~20–100 µs</td></tr></table>
<blockquote>💡 Real world: a single NVMe drive can outrun the network card in front of it. Moving a DB from HDD to NVMe can turn a 2-second query into 20 ms without touching SQL.</blockquote>`,
        he: `<p><strong>HDD</strong> זה פלטות מסתובבות עם זרוע שזזה. כל גישה רנדומלית משלמת <strong>seek</strong> (~4–10 ms) — וזה מגביל אותו לבערך 100–200 IOPS רנדומליים, אם כי ה-throughput הסדרתי סביר (~150–250 MB/s). זול לכל TB; מצוין לגיבויים וארכיון.</p>
<p><strong>SATA SSD</strong> בלי חלקים זזים: latency של ~0.1 ms, עשרות אלפי IOPS, אבל צוואר הבקבוק הוא ממשק SATA הישן ב-~550 MB/s. <strong>NVMe SSD</strong> מדבר ישירות על PCIe עם הרבה תורים מקבילים: <strong>500K עד מיליון+ IOPS</strong>, ‏3–7 GB/s, ו-latency של ~20–100 µs.</p>
<table><tr><th>סוג</th><th>Random IOPS</th><th>Throughput</th><th>Latency</th></tr>
<tr><td>HDD 7200rpm</td><td>~150</td><td>~200 MB/s</td><td>~5–10 ms</td></tr>
<tr><td>SATA SSD</td><td>~50–90K</td><td>~550 MB/s</td><td>~100 µs</td></tr>
<tr><td>NVMe SSD</td><td>~500K–1M</td><td>3–7 GB/s</td><td>~20–100 µs</td></tr></table>
<blockquote>💡 מהשטח: דיסק NVMe בודד יכול להיות מהיר יותר מכרטיס הרשת שלפניו. להעביר DB מ-HDD ל-NVMe יכול להפוך query של 2 שניות ל-20 ms בלי לגעת ב-SQL.</blockquote>`
      }
    },
    {
      h: { en: "IOPS vs throughput vs latency", he: "IOPS מול throughput מול latency" },
      body: {
        en: `<p>They're linked by one formula: <strong>throughput = IOPS × block size</strong>. 10,000 IOPS of 4 KB = 40 MB/s; 1,000 IOPS of 1 MB = 1 GB/s. So "fast disk" depends on the workload:</p>
<ul><li><strong>OLTP databases</strong>: tiny random reads/writes (8–16 KB pages) → IOPS and latency matter.</li>
<li><strong>Log ingestion, video, backups, analytics scans</strong>: big sequential streams → throughput matters.</li>
<li><strong>fsync-heavy workloads</strong> (DB commits, Kafka with strict durability): every commit waits for the disk → write latency is king.</li></ul>
<p>Cloud volumes enforce caps on each axis. AWS <strong>gp3</strong> gives a baseline of <strong>3,000 IOPS and 125 MB/s</strong> regardless of size, and you pay extra for more (up to 16,000 IOPS / 1,000 MB/s). Hit the cap and requests queue: latency climbs from 1 ms to 50 ms while the disk "isn't even busy".</p>
<blockquote>⚠️ Production tip: when a cloud DB suddenly slows down, check the volume's IOPS/throughput graphs against its provisioned limits — and burst-credit balance on older gp2 volumes — before blaming the code.</blockquote>`,
        he: `<p>הם מחוברים בנוסחה אחת: <strong>throughput = IOPS × block size</strong>. ‏10,000 IOPS של 4 KB = ‏40 MB/s; ‏1,000 IOPS של 1 MB = ‏1 GB/s. אז "דיסק מהיר" תלוי בעומס:</p>
<ul><li><strong>דאטאבייסים OLTP</strong>: קריאות/כתיבות רנדומליות זעירות (דפים של 8–16 KB) → IOPS ו-latency הם מה שחשוב.</li>
<li><strong>Log ingestion, וידאו, גיבויים, סריקות analytics</strong>: זרמים סדרתיים גדולים → throughput הוא מה שחשוב.</li>
<li><strong>עומסים עם הרבה fsync</strong> (commits של DB, Kafka עם durability קשיח): כל commit מחכה לדיסק → write latency הוא המלך.</li></ul>
<p>Volumes בענן אוכפים תקרה על כל ציר. ב-AWS, ‏<strong>gp3</strong> נותן בסיס של <strong>3,000 IOPS ו-125 MB/s</strong> בלי קשר לגודל, ומשלמים בנפרד על יותר (עד 16,000 IOPS / ‏1,000 MB/s). פוגעים בתקרה — והבקשות נכנסות לתור: ה-latency עולה מ-1 ms ל-50 ms בזמן שהדיסק "אפילו לא עסוק".</p>
<blockquote>⚠️ טיפ לפרודקשן: כש-DB בענן פתאום מאט, תבדוק את גרפי ה-IOPS/throughput של ה-volume מול ה-limits שהוקצו — ואת יתרת ה-burst credits ב-gp2 ישנים — לפני שמאשימים את הקוד.</blockquote>`
      }
    },
    {
      h: { en: "Block, file and object storage", he: "Block, file ו-object storage" },
      body: {
        en: `<p><strong>Block storage</strong> (EBS, Azure Disk, a local NVMe) is a raw virtual disk: the OS formats it with a filesystem and owns it. Lowest latency, usually attached to <strong>one machine at a time</strong>. Use for databases and anything needing a real POSIX filesystem.</p>
<p><strong>File storage</strong> (NFS, EFS, Azure Files, SMB) is a shared filesystem over the network: many machines mount the same directory. Convenient (shared uploads, legacy apps), but every operation is a network round trip, and metadata-heavy work (millions of small files, <code>ls</code> on huge dirs) gets slow.</p>
<p><strong>Object storage</strong> (S3, GCS, Azure Blob) is a giant key → blob store over HTTP: <code>PUT /bucket/photos/cat.jpg</code>. No in-place edits, no real directories, latency in tens of ms per request — but effectively infinite, 11 nines durable, cheap (~$0.023/GB-month for S3 Standard) and massively parallel.</p>
<blockquote>💡 Real world: the default cloud-native pattern is stateless app containers + a managed DB on block storage + user uploads and backups in object storage. NFS is the "we have a legacy app" choice.</blockquote>`,
        he: `<p><strong>Block storage</strong> ‏(EBS, Azure Disk, NVMe מקומי) הוא דיסק וירטואלי גולמי: מערכת ההפעלה מפרמטת אותו עם filesystem ומחזיקה בו. ה-latency הכי נמוך, ובדרך כלל מחובר ל<strong>מכונה אחת בכל פעם</strong>. מתאים לדאטאבייסים ולכל מה שצריך POSIX filesystem אמיתי.</p>
<p><strong>File storage</strong> ‏(NFS, EFS, Azure Files, SMB) הוא filesystem משותף על הרשת: הרבה מכונות עושות mount לאותה תיקייה. נוח (uploads משותפים, אפליקציות legacy), אבל כל פעולה היא round trip ברשת, ועבודה כבדה על metadata (מיליוני קבצים קטנים, <code>ls</code> על תיקיות ענק) נהיית איטית.</p>
<p><strong>Object storage</strong> ‏(S3, GCS, Azure Blob) הוא store ענק של key → blob על HTTP: <code>PUT /bucket/photos/cat.jpg</code>. אין עריכה במקום, אין באמת תיקיות, latency של עשרות ms לבקשה — אבל בפועל אינסופי, durability של 11 תשיעיות, זול (~$0.023 ל-GB לחודש ב-S3 Standard) ומקבילי בטירוף.</p>
<blockquote>💡 מהשטח: הדפוס ה-cloud-native הדיפולטי הוא קונטיינרים stateless לאפליקציה + DB מנוהל על block storage + uploads של משתמשים וגיבויים ב-object storage. NFS זו הבחירה של "יש לנו אפליקציית legacy".</blockquote>`
      }
    },
    {
      h: { en: "Filesystems and iowait", he: "Filesystems ו-iowait" },
      body: {
        en: `<p>A <strong>filesystem</strong> (ext4, XFS, btrfs, ZFS) turns a block device into files and directories, tracks free space, and uses a <strong>journal</strong> so a crash doesn't corrupt metadata. ext4 is the safe default; XFS shines with big files and parallel IO (default on RHEL). Two classic gotchas: running out of <strong>inodes</strong> (millions of tiny files — <code>df -i</code>) while <code>df -h</code> says 40% free, and deleted-but-still-open files holding space (<code>lsof +L1</code>).</p>
<p><strong>iowait</strong> (<code>wa</code> in top/vmstat) is the % of time the CPU was idle <em>while</em> there was outstanding disk IO. High iowait means "CPUs are bored waiting for the disk". Confirm with <code>iostat -x 1</code>: look at <code>r_await</code>/<code>w_await</code> (ms per request), <code>aqu-sz</code> (queue depth) and <code>%util</code>.</p>
<pre>$ iostat -x 1
Device   r/s    w/s   rkB/s   wkB/s  r_await w_await aqu-sz %util
nvme0n1  12.0 2950.0   96.0 23600.0    0.4    38.2   112.7  99.8</pre>
<p>Here writes wait 38 ms and the queue is ~113 deep — the volume is maxed (likely at its 3,000 IOPS cap).</p>`,
        he: `<p><strong>Filesystem</strong> ‏(ext4, XFS, btrfs, ZFS) הופך block device לקבצים ותיקיות, עוקב אחרי מקום פנוי, ומשתמש ב-<strong>journal</strong> כדי שקריסה לא תשחית את ה-metadata. ext4 זה הדיפולט הבטוח; XFS מבריק עם קבצים גדולים ו-IO מקבילי (הדיפולט ב-RHEL). שני פחים קלאסיים: נגמרים ה-<strong>inodes</strong> (מיליוני קבצים קטנטנים — <code>df -i</code>) בזמן ש-<code>df -h</code> מראה 40% פנוי, וקבצים שנמחקו אבל עדיין פתוחים ומחזיקים מקום (<code>lsof +L1</code>).</p>
<p><strong>iowait</strong> (<code>wa</code> ב-top/vmstat) הוא אחוז הזמן שה-CPU היה idle <em>בזמן</em> שהיה IO פתוח לדיסק. iowait גבוה אומר "ה-CPUs משועממים ומחכים לדיסק". מאמתים עם <code>iostat -x 1</code>: מסתכלים על <code>r_await</code>/<code>w_await</code> (ms לבקשה), <code>aqu-sz</code> (עומק תור) ו-<code>%util</code>.</p>
<pre>$ iostat -x 1
Device   r/s    w/s   rkB/s   wkB/s  r_await w_await aqu-sz %util
nvme0n1  12.0 2950.0   96.0 23600.0    0.4    38.2   112.7  99.8</pre>
<p>פה כתיבות מחכות 38 ms והתור בעומק ~113 — ה-volume בתקרה (כנראה ב-3,000 IOPS שהוקצו לו).</p>`
      }
    }
  ],
  diagram: `  throughput = IOPS x block size

  4 KB  x 10,000 IOPS =  40 MB/s   (OLTP database: IOPS-bound)
  1 MB  x  1,000 IOPS = 1 GB/s     (backup / video: throughput-bound)

  app -> page cache -> filesystem (ext4/XFS) -> block device -> [ HDD | SSD | NVMe | EBS over network ]`,
  handsOn: [
    { cmd: "lsblk -o NAME,SIZE,ROTA,TYPE,MOUNTPOINT", what: { en: "List disks; ROTA=1 means a spinning HDD, 0 means SSD/NVMe.", he: "לראות דיסקים; ROTA=1 זה HDD מסתובב, 0 זה SSD/NVMe." } },
    { cmd: "df -h && df -i", what: { en: "Check free space AND free inodes — both can run out.", he: "לבדוק מקום פנוי וגם inodes פנויים — שניהם יכולים להיגמר." } },
    { cmd: "iostat -x 1 5", what: { en: "Per-device IOPS, await (latency) and %util. (Package: sysstat.)", he: "IOPS, ‏await ‏(latency) ו-%util לכל דיסק. (חבילה: sysstat.)" } },
    { cmd: "fio --name=randread --rw=randread --bs=4k --size=512M --iodepth=32 --ioengine=libaio --direct=1 --runtime=20", what: { en: "Benchmark random 4K read IOPS and latency, bypassing the page cache.", he: "benchmark ל-IOPS ול-latency של קריאות random בגודל 4K, בלי page cache." } }
  ],
  mnemonic: {
    en: "\"How MANY, how MUCH, how LONG\" — IOPS, throughput, latency. And: Block = a disk, File = a shared folder, Object = a URL.",
    he: "\"כמה פעמים, כמה כמות, כמה זמן\" — IOPS, ‏throughput, ‏latency. ובנוסף: Block = דיסק, File = תיקייה משותפת, Object = URL."
  },
  pitfalls: [
    { en: "Benchmarking with dd or cp and getting amazing numbers — you measured the page cache, not the disk. Use fio with --direct=1.", he: "לעשות benchmark עם dd או cp ולקבל מספרים מדהימים — מדדת את ה-page cache, לא את הדיסק. תשתמש ב-fio עם ‎--direct=1." },
    { en: "Buying a bigger volume for a throughput problem on gp3 — size doesn't raise gp3 IOPS/throughput; you provision them separately.", he: "לקנות volume גדול יותר בשביל בעיית throughput ב-gp3 — הגודל לא מעלה IOPS/throughput ב-gp3; מקצים אותם בנפרד." },
    { en: "Running a database on NFS/EFS. Network latency per op and weak locking semantics make it slow at best and corrupt at worst.", he: "להריץ דאטאבייס על NFS/EFS. ה-latency של הרשת לכל פעולה וסמנטיקת locking חלשה הופכים את זה לאיטי במקרה הטוב ולמושחת במקרה הרע." },
    { en: "Treating object storage like a filesystem (appending to files, renaming 'directories'). A rename in S3 is copy + delete of every object.", he: "להתייחס ל-object storage כמו ל-filesystem (append לקבצים, rename ל'תיקיות'). ‏rename ב-S3 זה copy + delete של כל אובייקט." }
  ],
  interview: [
    {
      q: { en: "What's the relationship between IOPS and throughput?", he: "מה הקשר בין IOPS ל-throughput?" },
      a: { en: "Throughput = IOPS × IO size. Small random IO (databases) exhausts IOPS long before bandwidth; large sequential IO (backups, streaming) exhausts bandwidth with few ops. You size storage on whichever the workload hits first, and latency tells you whether requests are queueing.", he: "Throughput = IOPS × גודל IO. ‏IO רנדומלי קטן (דאטאבייסים) גומר את ה-IOPS הרבה לפני רוחב הפס; IO סדרתי גדול (גיבויים, streaming) גומר את רוחב הפס עם מעט פעולות. מתכננים storage לפי מה שהעומס פוגע בו קודם, וה-latency אומר אם בקשות עומדות בתור." }
    },
    {
      q: { en: "When would you choose block vs file vs object storage?", he: "מתי תבחר block, ‏file או object storage?" },
      a: { en: "Block for single-host low-latency needs like databases. File (NFS/EFS) when several hosts need a shared POSIX directory. Object (S3) for large amounts of unstructured data accessed over HTTP — media, backups, data lakes, static assets — where scale, durability and cost beat latency.", he: "Block לצרכים של host בודד עם latency נמוך, כמו דאטאבייס. File ‏(NFS/EFS) כשכמה hosts צריכים תיקיית POSIX משותפת. Object ‏(S3) לכמויות גדולות של דאטה לא מובנה שניגשים אליו ב-HTTP — מדיה, גיבויים, data lakes, קבצים סטטיים — כשסקייל, durability ועלות חשובים יותר מ-latency." }
    }
  ],
  quiz: [
    {
      q: { en: "A volume does 2,000 IOPS with 64 KB requests. What's its throughput?", he: "Volume עושה 2,000 IOPS עם בקשות של 64 KB. מה ה-throughput?" },
      options: [
        { en: "~2 MB/s", he: "~2 MB/s" },
        { en: "~128 MB/s", he: "~128 MB/s" },
        { en: "~64 MB/s", he: "~64 MB/s" },
        { en: "~1 GB/s", he: "~1 GB/s" }
      ],
      answer: 1,
      explain: { en: "2,000 × 64 KB = 128,000 KB/s ≈ 128 MB/s — right around gp3's default 125 MB/s cap.", he: "‏2,000 × 64 KB = ‏128,000 KB/s ≈ ‏128 MB/s — בדיוק ליד התקרה הדיפולטית של gp3 ב-125 MB/s." }
    },
    {
      q: { en: "df -h shows 40% free but writes fail with 'No space left on device'. Most likely?", he: "df -h מראה 40% פנוי אבל כתיבות נכשלות עם 'No space left on device'. מה הכי סביר?" },
      options: [
        { en: "The disk is failing", he: "הדיסק מתקלקל" },
        { en: "The page cache is full", he: "ה-page cache מלא" },
        { en: "Swap is full", he: "ה-swap מלא" },
        { en: "The filesystem ran out of inodes (too many small files)", he: "נגמרו ל-filesystem ה-inodes (יותר מדי קבצים קטנים)" }
      ],
      answer: 3,
      explain: { en: "Every file needs an inode. Millions of tiny files (sessions, cache entries) can exhaust them while bytes remain. Check df -i.", he: "כל קובץ צריך inode. מיליוני קבצים קטנטנים (sessions, ‏cache) יכולים לגמור אותם כשעוד יש בייטים. תבדוק df -i." }
    },
    {
      q: { en: "Which workload is most sensitive to write latency (fsync time)?", he: "איזה עומס הכי רגיש ל-write latency ‏(זמן fsync)?" },
      options: [
        { en: "A transactional database committing every order", he: "דאטאבייס טרנזקציוני שעושה commit לכל הזמנה" },
        { en: "Nightly backup copying a 500 GB file", he: "גיבוי לילי שמעתיק קובץ של 500 GB" },
        { en: "Serving static images from S3", he: "הגשת תמונות סטטיות מ-S3" },
        { en: "A batch job reading Parquet files", he: "batch job שקורא קבצי Parquet" }
      ],
      answer: 0,
      explain: { en: "Each commit must be durable on disk before acknowledging, so every user request pays the fsync latency. Backups and scans care about throughput.", he: "כל commit חייב להיות שמור בדיסק לפני שמאשרים, אז כל בקשת משתמש משלמת את ה-latency של ה-fsync. גיבויים וסריקות מתעניינים ב-throughput." }
    }
  ],
  related: ["memory", "linux-toolkit", "latency-numbers"]
});

/* ============================== PROCESSES ============================== */
INFRA.lessons.push({
  id: "processes-linux",
  track: "foundations",
  order: 4,
  icon: "⚙️",
  level: 2,
  minutes: 10,
  title: { en: "Processes, signals & graceful shutdown", he: "תהליכים, signals ו-graceful shutdown" },
  tldr: {
    en: "A process is a running program with its own memory, PID and file descriptors; how it reacts to SIGTERM decides whether your deploys drop requests.",
    he: "תהליך הוא תוכנית רצה עם זיכרון, PID ו-file descriptors משלו; איך הוא מגיב ל-SIGTERM קובע אם ה-deploys שלך מפילים בקשות."
  },
  analogy: {
    en: "A process is a restaurant; threads are the waiters sharing the same kitchen and fridge. SIGTERM is the manager saying 'we close in 30 seconds — finish the tables you're serving, take no new ones.' SIGKILL is the fire marshal cutting the power mid-meal. PID 1 is the owner: if the owner leaves, the whole restaurant shuts down — and the owner is also responsible for clearing out the ghosts of dead customers (zombies).",
    he: "תהליך זה מסעדה; ה-threads הם המלצרים שחולקים את אותו מטבח ואותו מקרר. SIGTERM זה המנהל שאומר 'סוגרים בעוד 30 שניות — תסיימו את השולחנות שאתם מגישים, לא לוקחים חדשים.' SIGKILL זה כבאי שמנתק את החשמל באמצע הארוחה. PID 1 הוא הבעלים: אם הוא הולך, כל המסעדה נסגרת — והוא גם אחראי לפנות את רוחות הרפאים של לקוחות מתים (zombies)."
  },
  sections: [
    {
      h: { en: "Process vs thread", he: "תהליך מול thread" },
      body: {
        en: `<p>A <strong>process</strong> is an instance of a program: its own virtual memory, PID, open file descriptors, environment and user. Processes are isolated — one crashing doesn't corrupt another. Creating one (<code>fork()</code> + <code>exec()</code>) costs more, and sharing data between them needs IPC: pipes, sockets, shared memory.</p>
<p>A <strong>thread</strong> is an execution path <em>inside</em> a process. Threads share the heap and file descriptors, each with its own stack (typically 1–8 MB reserved) and registers. Cheap to create, fast to share data — and a data race or segfault in one takes down all of them. To Linux, a thread is just a "task" that shares memory with its siblings; <code>ps -eLf</code> or <code>top -H</code> shows them individually.</p>
<p>Language mapping: Python and Node run one thread executing your code per process (GIL / event loop), so you scale with <strong>multiple processes</strong> (gunicorn workers, Node cluster, or more Pods). Go and Java use many threads in one process. Nginx: one master + a worker process per core.</p>`,
        he: `<p><strong>תהליך</strong> הוא מופע של תוכנית: זיכרון וירטואלי משלו, PID, ‏file descriptors פתוחים, environment ו-user. תהליכים מבודדים — אחד שקורס לא משחית את השני. ליצור אחד (<code>fork()</code> + <code>exec()</code>) עולה יותר, ושיתוף דאטה ביניהם דורש IPC: ‏pipes, ‏sockets, ‏shared memory.</p>
<p><strong>Thread</strong> הוא מסלול ריצה <em>בתוך</em> תהליך. Threads חולקים את ה-heap ואת ה-file descriptors, ולכל אחד stack משלו (בדרך כלל 1–8 MB שמורים) ו-registers. זולים ליצירה, מהירים בשיתוף דאטה — ו-data race או segfault באחד מפיל את כולם. מבחינת Linux, thread הוא סתם "task" שחולק זיכרון עם האחים שלו; <code>ps -eLf</code> או <code>top -H</code> מראים אותם בנפרד.</p>
<p>מיפוי לשפות: Python ו-Node מריצים thread אחד שמריץ את הקוד שלך לכל תהליך (GIL / event loop), אז עושים scale עם <strong>כמה תהליכים</strong> (gunicorn workers, ‏Node cluster, או עוד Pods). Go ו-Java משתמשים בהרבה threads בתהליך אחד. Nginx: ‏master אחד + worker process לכל core.</p>`
      }
    },
    {
      h: { en: "Signals: SIGTERM vs SIGKILL and graceful shutdown", he: "Signals: ‏SIGTERM מול SIGKILL ו-graceful shutdown" },
      body: {
        en: `<p>Signals are tiny async messages to a process. The ones you must know: <code>SIGTERM (15)</code> "please stop" — catchable, the polite default of <code>kill</code>, <code>docker stop</code> and Kubernetes. <code>SIGKILL (9)</code> "die now" — can't be caught or ignored, the kernel just removes you. <code>SIGINT (2)</code> is Ctrl+C. <code>SIGHUP (1)</code> is often "reload config" (nginx).</p>
<p>Kubernetes Pod termination: Pod marked Terminating and removed from Service endpoints → <code>preStop</code> hook → SIGTERM → wait <code>terminationGracePeriodSeconds</code> (default <strong>30s</strong>) → SIGKILL. A graceful app on SIGTERM: stop accepting new connections, finish in-flight requests, flush buffers, close DB pools, exit 0.</p>
<pre>// Node.js
process.on('SIGTERM', () =&gt; {
  server.close(() =&gt; { db.end(); process.exit(0); });
  setTimeout(() =&gt; process.exit(1), 25000).unref(); // safety net
});</pre>
<blockquote>⚠️ Production tip: endpoint removal is asynchronous, so traffic can still arrive for a few seconds after SIGTERM. A common fix is a <code>preStop: sleep 5</code> before the app starts closing.</blockquote>`,
        he: `<p>Signals הם הודעות async קטנטנות לתהליך. אלה שחובה להכיר: <code>SIGTERM (15)</code> "בבקשה תעצור" — אפשר לתפוס אותו, ברירת המחדל המנומסת של <code>kill</code>, של <code>docker stop</code> ושל Kubernetes. <code>SIGKILL (9)</code> "מת עכשיו" — אי אפשר לתפוס או להתעלם, ה-kernel פשוט מעיף אותך. <code>SIGINT (2)</code> זה Ctrl+C. <code>SIGHUP (1)</code> הרבה פעמים אומר "תטען config מחדש" (nginx).</p>
<p>סיום Pod ב-Kubernetes: ה-Pod מסומן Terminating ומוסר מה-endpoints של ה-Service ← hook של <code>preStop</code> ← SIGTERM ← המתנה של <code>terminationGracePeriodSeconds</code> (ברירת מחדל <strong>30 שניות</strong>) ← SIGKILL. אפליקציה שמתנהגת יפה מקבלת SIGTERM ו: מפסיקה לקבל חיבורים חדשים, מסיימת בקשות שבטיפול, עושה flush לבאפרים, סוגרת DB pools, ויוצאת עם 0.</p>
<pre>// Node.js
process.on('SIGTERM', () =&gt; {
  server.close(() =&gt; { db.end(); process.exit(0); });
  setTimeout(() =&gt; process.exit(1), 25000).unref(); // safety net
});</pre>
<blockquote>⚠️ טיפ לפרודקשן: ההסרה מה-endpoints היא אסינכרונית, אז traffic יכול להמשיך להגיע כמה שניות אחרי ה-SIGTERM. פתרון נפוץ: <code>preStop: sleep 5</code> לפני שהאפליקציה מתחילה להיסגר.</blockquote>`
      }
    },
    {
      h: { en: "PID 1, zombies and exit codes", he: "PID 1, ‏zombies ו-exit codes" },
      body: {
        en: `<p><strong>PID 1</strong> is special. On a host it's <code>systemd</code>. Inside a container it's <em>your app</em>, and that has two consequences: (1) the kernel doesn't apply default signal handlers to PID 1, so if your app doesn't explicitly handle SIGTERM, it <strong>ignores it</strong> — and gets SIGKILLed after the grace period; (2) PID 1 must <strong>reap zombies</strong>: dead children whose exit status nobody collected. Fixes: handle signals properly, use <code>docker run --init</code> or <code>tini</code>, and use the exec form <code>CMD ["node","server.js"]</code> — the shell form <code>CMD node server.js</code> makes <code>/bin/sh</code> PID 1, which won't forward SIGTERM.</p>
<p><strong>Exit codes</strong>: 0 = success, 1–125 = app-defined error, 126 = not executable, 127 = command not found, <strong>128+N = killed by signal N</strong>.</p>
<table><tr><th>Code</th><th>Meaning</th></tr>
<tr><td>137</td><td>128+9 SIGKILL — OOMKilled or grace period expired</td></tr>
<tr><td>143</td><td>128+15 SIGTERM — stopped, didn't exit cleanly by itself</td></tr>
<tr><td>139</td><td>128+11 SIGSEGV — segmentation fault</td></tr></table>`,
        he: `<p><strong>PID 1</strong> הוא מיוחד. על host זה <code>systemd</code>. בתוך קונטיינר זו <em>האפליקציה שלך</em>, ויש לזה שתי השלכות: (1) ה-kernel לא מפעיל handlers דיפולטיים של signals על PID 1, אז אם האפליקציה לא מטפלת ב-SIGTERM במפורש, היא <strong>מתעלמת ממנו</strong> — וחוטפת SIGKILL בסוף ה-grace period; (2) ‏PID 1 חייב <strong>לאסוף zombies</strong>: ילדים מתים שאף אחד לא אסף את ה-exit status שלהם. פתרונות: לטפל ב-signals כמו שצריך, להשתמש ב-<code>docker run --init</code> או ב-<code>tini</code>, ולהשתמש ב-exec form ‏<code>CMD ["node","server.js"]</code> — ה-shell form ‏<code>CMD node server.js</code> הופך את <code>/bin/sh</code> ל-PID 1, והוא לא מעביר SIGTERM הלאה.</p>
<p><strong>Exit codes</strong>: ‏0 = הצלחה, 1–125 = שגיאה שהאפליקציה הגדירה, 126 = לא executable, ‏127 = פקודה לא נמצאה, <strong>128+N = נהרג ע"י signal מספר N</strong>.</p>
<table><tr><th>קוד</th><th>משמעות</th></tr>
<tr><td>137</td><td>128+9 SIGKILL — ‏OOMKilled או שנגמר ה-grace period</td></tr>
<tr><td>143</td><td>128+15 SIGTERM — נעצר, לא יצא נקי בעצמו</td></tr>
<tr><td>139</td><td>128+11 SIGSEGV — ‏segmentation fault</td></tr></table>`
      }
    },
    {
      h: { en: "File descriptors and systemd", he: "File descriptors ו-systemd" },
      body: {
        en: `<p>In Unix "everything is a file": open files, sockets, pipes, even epoll handles are <strong>file descriptors</strong> (FDs) — small integers per process (0 = stdin, 1 = stdout, 2 = stderr). Each process has a limit (<code>ulimit -n</code>, often 1024 by default). A server holding 5,000 client connections needs 5,000+ FDs; exceed the limit and you get <code>EMFILE: Too many open files</code>. A slowly climbing FD count (<code>ls /proc/PID/fd | wc -l</code>) is a <strong>socket/file leak</strong> — forgotten <code>close()</code> or unreturned HTTP connections.</p>
<p><strong>systemd</strong> is the init system on most Linux distros: it starts services, restarts them on failure, collects logs into the journal and sets limits.</p>
<pre>[Service]
ExecStart=/usr/local/bin/myapi --port 8080
Restart=on-failure
User=myapi
LimitNOFILE=65536
MemoryMax=1G</pre>
<p>Then <code>systemctl daemon-reload &amp;&amp; systemctl enable --now myapi</code> and <code>journalctl -u myapi -f</code> to tail its logs. In containers, the orchestrator plays systemd's role.</p>`,
        he: `<p>ב-Unix "הכל הוא קובץ": קבצים פתוחים, sockets, ‏pipes, אפילו handles של epoll הם <strong>file descriptors</strong> ‏(FDs) — מספרים קטנים לכל תהליך (0 = stdin, ‏1 = stdout, ‏2 = stderr). לכל תהליך יש limit (<code>ulimit -n</code>, לרוב 1024 כברירת מחדל). שרת שמחזיק 5,000 חיבורי לקוחות צריך 5,000+ FDs; עוברים את ה-limit ומקבלים <code>EMFILE: Too many open files</code>. מספר FDs שמטפס לאט (<code>ls /proc/PID/fd | wc -l</code>) זו <strong>דליפת sockets/קבצים</strong> — ‏<code>close()</code> שנשכח או חיבורי HTTP שלא הוחזרו ל-pool.</p>
<p><strong>systemd</strong> היא מערכת ה-init ברוב ההפצות של Linux: מעלה שירותים, עושה להם restart כשהם נופלים, אוספת לוגים ל-journal ומגדירה limits.</p>
<pre>[Service]
ExecStart=/usr/local/bin/myapi --port 8080
Restart=on-failure
User=myapi
LimitNOFILE=65536
MemoryMax=1G</pre>
<p>אחר כך <code>systemctl daemon-reload &amp;&amp; systemctl enable --now myapi</code> ו-<code>journalctl -u myapi -f</code> כדי לעקוב אחרי הלוגים. בקונטיינרים, ה-orchestrator ממלא את התפקיד של systemd.</p>`
      }
    }
  ],
  diagram: `  kubectl delete pod / rolling update
     |
     v
  removed from Service endpoints  +  preStop hook
     |
     v
  SIGTERM --> app: stop accepting, drain in-flight, close pools, exit 0
     |
     |  (terminationGracePeriodSeconds = 30s)
     v
  still alive?  --> SIGKILL  --> exit 137`,
  handsOn: [
    { cmd: "ps -eo pid,ppid,stat,nlwp,rss,cmd --sort=-rss | head", what: { en: "PIDs, parent PIDs, state (Z = zombie, D = IO wait), thread count (nlwp) and RSS.", he: "PIDs, ‏PID של ההורה, מצב (Z = zombie, ‏D = מחכה ל-IO), מספר threads ‏(nlwp) ו-RSS." } },
    { cmd: "sleep 300 & kill -TERM $! ; wait $!; echo exit=$?", what: { en: "Send SIGTERM to a process and see exit code 143 (128+15).", he: "לשלוח SIGTERM לתהליך ולראות exit code 143 ‏(128+15)." } },
    { cmd: "ls /proc/self/fd && ulimit -n", what: { en: "See the FDs of your shell and the per-process FD limit.", he: "לראות את ה-FDs של ה-shell שלך ואת ה-limit לתהליך." } },
    { cmd: "docker run --rm --name t -d alpine sleep 1000 && time docker stop t", what: { en: "sleep as PID 1 ignores SIGTERM, so docker stop waits the full 10s before SIGKILL. Retry with --init.", he: "‏sleep בתור PID 1 מתעלם מ-SIGTERM, אז docker stop מחכה 10 שניות מלאות לפני SIGKILL. תנסה שוב עם ‎--init." } }
  ],
  mnemonic: {
    en: "\"TERM asks, KILL takes.\" 15 is polite, 9 is final. Exit code = 128 + the signal that got you.",
    he: "\"TERM מבקש, KILL לוקח.\" 15 מנומס, 9 סופי. exit code = ‏128 ועוד ה-signal שהרג אותך."
  },
  pitfalls: [
    { en: "Using the shell form CMD in a Dockerfile: /bin/sh becomes PID 1, doesn't forward SIGTERM, and every deploy waits 30s then SIGKILLs your app.", he: "להשתמש ב-shell form של CMD ב-Dockerfile: ‏/bin/sh הופך ל-PID 1, לא מעביר SIGTERM, וכל deploy מחכה 30 שניות ואז עושה SIGKILL לאפליקציה." },
    { en: "No SIGTERM handler: in-flight requests get 502s on every rolling update.", he: "אין handler ל-SIGTERM: בקשות שבטיפול מקבלות 502 בכל rolling update." },
    { en: "Using kill -9 as the first move. The app can't flush data or release locks; you may leave corrupted files or stale lock rows.", he: "להשתמש ב-kill -9 כצעד ראשון. האפליקציה לא יכולה לעשות flush לדאטה או לשחרר locks; אתה עלול להשאיר קבצים מושחתים או שורות lock תקועות." },
    { en: "Leaving the default 1024 FD limit on a busy proxy or websocket server — it'll fall over at exactly ~1000 connections.", he: "להשאיר את ה-limit הדיפולטי של 1024 FDs על proxy עמוס או שרת websocket — הוא ייפול בדיוק בסביבות 1000 חיבורים." }
  ],
  interview: [
    {
      q: { en: "Walk me through what happens when Kubernetes terminates a Pod.", he: "תסביר מה קורה כש-Kubernetes עושה terminate ל-Pod." },
      a: { en: "The Pod is set to Terminating and removed from Service endpoints (asynchronously); the preStop hook runs; the container's PID 1 gets SIGTERM; Kubernetes waits up to terminationGracePeriodSeconds (30s default); if the process is still running it gets SIGKILL. The app should drain in-flight work on SIGTERM and exit.", he: "ה-Pod עובר ל-Terminating ומוסר מה-endpoints של ה-Service (אסינכרונית); ה-hook של preStop רץ; ה-PID 1 של הקונטיינר מקבל SIGTERM; ‏Kubernetes מחכה עד terminationGracePeriodSeconds ‏(30 שניות כברירת מחדל); אם התהליך עדיין חי — SIGKILL. האפליקציה צריכה לסיים עבודה שבטיפול ב-SIGTERM ולצאת." }
    },
    {
      q: { en: "Why is PID 1 inside a container special?", he: "למה PID 1 בתוך קונטיינר מיוחד?" },
      a: { en: "The kernel doesn't install default signal actions for PID 1 in a namespace, so unhandled SIGTERM is ignored. PID 1 also inherits orphaned processes and must reap them, otherwise zombies accumulate. Use an init like tini (docker --init) or make sure the app handles signals and is started with exec-form CMD.", he: "ה-kernel לא מתקין פעולות signal דיפולטיות ל-PID 1 ב-namespace, אז SIGTERM שלא מטופל פשוט נבלע. ‏PID 1 גם יורש תהליכים יתומים וחייב לאסוף אותם, אחרת מצטברים zombies. משתמשים ב-init כמו tini ‏(docker --init) או מוודאים שהאפליקציה מטפלת ב-signals ומופעלת עם exec-form CMD." }
    }
  ],
  quiz: [
    {
      q: { en: "Your Pod shows exit code 143. What happened?", he: "ה-Pod שלך מראה exit code 143. מה קרה?" },
      options: [
        { en: "It was OOMKilled", he: "הוא חטף OOMKilled" },
        { en: "It was terminated by SIGTERM (128+15)", he: "הוא נעצר ע\"י SIGTERM ‏(128+15)" },
        { en: "The command was not found", he: "הפקודה לא נמצאה" },
        { en: "It segfaulted", he: "היה segfault" }
      ],
      answer: 1,
      explain: { en: "143 - 128 = 15 = SIGTERM. OOM is 137 (SIGKILL), segfault is 139, command not found is 127.", he: "‏143 פחות 128 = 15 = SIGTERM. ‏OOM זה 137 ‏(SIGKILL), ‏segfault זה 139, פקודה לא נמצאה זה 127." }
    },
    {
      q: { en: "Every 'docker stop' on your container takes exactly 10 seconds. Most likely cause?", he: "כל 'docker stop' לקונטיינר שלך לוקח בדיוק 10 שניות. מה הסיבה הסבירה?" },
      options: [
        { en: "The disk is slow to unmount", he: "הדיסק איטי ב-unmount" },
        { en: "The container has a CPU limit", he: "לקונטיינר יש CPU limit" },
        { en: "PID 1 doesn't handle SIGTERM, so Docker waits its 10s timeout and sends SIGKILL", he: "‏PID 1 לא מטפל ב-SIGTERM, אז Docker מחכה את ה-timeout של 10 שניות ושולח SIGKILL" },
        { en: "Docker always waits 10 seconds for safety", he: "Docker תמיד מחכה 10 שניות ליתר ביטחון" }
      ],
      answer: 2,
      explain: { en: "Docker's default stop timeout is 10s. Exactly 10s means SIGTERM was ignored — typical with shell-form CMD or a PID 1 without a handler. A graceful app stops in milliseconds.", he: "ה-timeout הדיפולטי של docker stop הוא 10 שניות. בדיוק 10 אומר ש-SIGTERM נבלע — טיפוסי ל-shell-form CMD או PID 1 בלי handler. אפליקציה שמתנהגת יפה נעצרת תוך מילישניות." }
    },
    {
      q: { en: "A server logs 'Too many open files' after running for 3 days. What's the best first check?", he: "שרת כותב 'Too many open files' אחרי 3 ימי ריצה. מה הבדיקה הראשונה הכי טובה?" },
      options: [
        { en: "Count /proc/PID/fd over time to see if FDs leak", he: "לספור את /proc/PID/fd לאורך זמן ולראות אם יש דליפת FDs" },
        { en: "Add more RAM", he: "להוסיף RAM" },
        { en: "Run fsck on the disk", he: "להריץ fsck על הדיסק" },
        { en: "Increase the CPU limit", he: "להגדיל את ה-CPU limit" }
      ],
      answer: 0,
      explain: { en: "Failing after days (not at startup) smells like a leak of sockets or files. Raising ulimit buys time; finding the missing close() fixes it.", he: "נפילה אחרי ימים (ולא בעלייה) מריחה כמו דליפת sockets או קבצים. הגדלת ulimit קונה זמן; למצוא את ה-close() החסר — מתקן." }
    }
  ],
  related: ["memory", "linux-toolkit", "container-internals", "k8s-pods"]
});

/* ============================== LINUX TOOLKIT ============================== */
INFRA.lessons.push({
  id: "linux-toolkit",
  track: "foundations",
  order: 5,
  icon: "🩺",
  level: 2,
  minutes: 11,
  title: { en: "The Linux toolkit: a doctor's checkup for servers", he: "ארגז הכלים של Linux: בדיקה רפואית לשרת" },
  tldr: {
    en: "When a box is 'slow', check vitals in a fixed order — load & CPU, memory, disk, network, then the logs — using top, free, df, iostat, vmstat, ss, lsof, strace, journalctl and dmesg.",
    he: "כששרת 'איטי', בודקים סימנים חיוניים בסדר קבוע — load ו-CPU, זיכרון, דיסק, רשת, ואז לוגים — עם top, ‏free, ‏df, ‏iostat, ‏vmstat, ‏ss, ‏lsof, ‏strace, ‏journalctl ו-dmesg."
  },
  analogy: {
    en: "You're an ER doctor. You don't start with an MRI; you take pulse (uptime/top), blood pressure (free), check the lungs (df, iostat), listen to the heart (ss), and read the patient's chart (journalctl, dmesg). Only if the vitals don't explain it do you order the expensive scan (strace, perf). Same order every time, so you never skip the obvious thing at 3 AM.",
    he: "אתה רופא במיון. לא מתחילים עם MRI; מודדים דופק (uptime/top), לחץ דם (free), בודקים ריאות (df, ‏iostat), מקשיבים ללב (ss), וקוראים את התיק הרפואי (journalctl, ‏dmesg). רק אם הסימנים החיוניים לא מסבירים את זה — מזמינים סריקה יקרה (strace, ‏perf). אותו סדר כל פעם, כדי שב-3 בלילה לא תפספס את הדבר הכי ברור."
  },
  sections: [
    {
      h: { en: "Step 1 — Pulse: uptime, top/htop, vmstat", he: "שלב 1 — דופק: uptime, ‏top/htop, ‏vmstat" },
      body: {
        en: `<p><code>uptime</code> gives load averages (compare to <code>nproc</code>). <code>top</code> (or the friendlier <code>htop</code>) shows the CPU breakdown line — read it like this:</p>
<pre>%Cpu(s): 12.0 us, 3.1 sy, 0.0 ni, 40.2 id, 44.5 wa, 0.0 hi, 0.2 si, 0.0 st</pre>
<ul><li><code>us</code> user code (your app) — high = CPU-bound app.</li>
<li><code>sy</code> kernel — high = syscall storms, lots of networking or context switches.</li>
<li><code>wa</code> iowait — high = disk bottleneck (go to step 3). Here 44.5% is screaming.</li>
<li><code>st</code> steal — the hypervisor gave your vCPU to another VM (noisy neighbour).</li></ul>
<p>In <code>top</code>: press <code>P</code> sort by CPU, <code>M</code> by memory, <code>1</code> per-core view, <code>H</code> threads. <code>vmstat 1</code> prints one line per second: <code>r</code> run queue, <code>b</code> blocked on IO, <code>si/so</code> swap, <code>cs</code> context switches. Ignore the first line (averages since boot).</p>`,
        he: `<p><code>uptime</code> נותן load averages (להשוות ל-<code>nproc</code>). <code>top</code> (או <code>htop</code> הידידותי יותר) מראה את שורת חלוקת ה-CPU — קוראים אותה ככה:</p>
<pre>%Cpu(s): 12.0 us, 3.1 sy, 0.0 ni, 40.2 id, 44.5 wa, 0.0 hi, 0.2 si, 0.0 st</pre>
<ul><li><code>us</code> קוד user (האפליקציה שלך) — גבוה = אפליקציה CPU-bound.</li>
<li><code>sy</code> ה-kernel — גבוה = סערת syscalls, המון networking או context switches.</li>
<li><code>wa</code> iowait — גבוה = צוואר בקבוק בדיסק (לך לשלב 3). פה 44.5% צועק.</li>
<li><code>st</code> steal — ה-hypervisor נתן את ה-vCPU שלך ל-VM אחר (noisy neighbour).</li></ul>
<p>ב-<code>top</code>: ‏<code>P</code> מיון לפי CPU, ‏<code>M</code> לפי זיכרון, ‏<code>1</code> תצוגה לכל core, ‏<code>H</code> threads. ‏<code>vmstat 1</code> מדפיס שורה כל שנייה: <code>r</code> תור ריצה, <code>b</code> חסומים על IO, ‏<code>si/so</code> swap, ‏<code>cs</code> context switches. תתעלם מהשורה הראשונה (ממוצע מאז ה-boot).</p>`
      }
    },
    {
      h: { en: "Step 2-3 — Memory and disk: free, df, du, iostat", he: "שלבים 2-3 — זיכרון ודיסק: free, ‏df, ‏du, ‏iostat" },
      body: {
        en: `<p><code>free -h</code>: look at <strong>available</strong> and whether swap is used. <code>df -h</code>: any filesystem at 100%? A full <code>/</code> or <code>/var</code> breaks everything in weird ways (DBs refuse writes, logs stop, Docker can't pull). Also <code>df -i</code> for inodes.</p>
<p>Found a full disk? Find the culprit with <code>du</code>:</p>
<pre>$ sudo du -xh --max-depth=1 /var | sort -h | tail -5
1.2G  /var/cache
3.4G  /var/lib/apt
48G   /var/lib/docker      # old images &amp; container logs
52G   /var</pre>
<p>Disk full but <code>du</code> totals don't add up? A process holds a deleted file open (classic: logrotate deleted a log that's still being written). <code>lsof +L1</code> finds it; restarting that process frees the space.</p>
<p><code>iostat -x 1</code> tells you if the disk is the bottleneck: <code>%util</code> near 100 and <code>await</code> in tens of ms on an SSD = saturated.</p>
<blockquote>💡 Real world: <code>docker system df</code> then <code>docker system prune</code> has rescued more full CI runners than any other command in history.</blockquote>`,
        he: `<p><code>free -h</code>: להסתכל על <strong>available</strong> ואם יש שימוש ב-swap. ‏<code>df -h</code>: יש filesystem ב-100%? ‏<code>/</code> או <code>/var</code> מלאים שוברים הכל בדרכים מוזרות (DB מסרב לכתוב, לוגים נעצרים, Docker לא מצליח לעשות pull). וגם <code>df -i</code> בשביל inodes.</p>
<p>מצאת דיסק מלא? מוצאים את האשם עם <code>du</code>:</p>
<pre>$ sudo du -xh --max-depth=1 /var | sort -h | tail -5
1.2G  /var/cache
3.4G  /var/lib/apt
48G   /var/lib/docker      # old images &amp; container logs
52G   /var</pre>
<p>הדיסק מלא אבל הסכומים של <code>du</code> לא מסתדרים? תהליך מחזיק קובץ מחוק פתוח (קלאסי: logrotate מחק לוג שעדיין כותבים אליו). <code>lsof +L1</code> מוצא אותו; restart לתהליך משחרר את המקום.</p>
<p><code>iostat -x 1</code> אומר אם הדיסק הוא צוואר הבקבוק: <code>%util</code> קרוב ל-100 ו-<code>await</code> של עשרות ms על SSD = רווי.</p>
<blockquote>💡 מהשטח: <code>docker system df</code> ואחריו <code>docker system prune</code> הצילו יותר CI runners מלאים מכל פקודה אחרת בהיסטוריה.</blockquote>`
      }
    },
    {
      h: { en: "Step 4 — Network & files: ss, lsof", he: "שלב 4 — רשת וקבצים: ss, ‏lsof" },
      body: {
        en: `<p><code>ss</code> is the modern <code>netstat</code>. The questions it answers fast:</p>
<ul><li>Is my app actually listening, on which interface? <code>ss -tlnp</code> — <code>0.0.0.0:8080</code> = all interfaces; <code>127.0.0.1:8080</code> = localhost only (the classic "works locally, unreachable in Docker" bug).</li>
<li>How many connections and in what state? <code>ss -s</code>, or <code>ss -tan state time-wait | wc -l</code>. Tens of thousands of <code>TIME-WAIT</code> = you open a new connection per request; use keep-alive/pooling.</li>
<li>Who's connected to Postgres? <code>ss -tnp dst :5432</code>.</li></ul>
<p><code>lsof</code> lists open files per process: <code>lsof -p 4121</code> (everything one process holds), <code>lsof -i :8080</code> (who owns this port — "address already in use" solved), <code>lsof +L1</code> (deleted-but-open files).</p>
<blockquote>⚠️ Production tip: lots of <code>CLOSE-WAIT</code> sockets means <em>your</em> app received a FIN and never called close() — that's a bug in your code, not the network.</blockquote>`,
        he: `<p><code>ss</code> הוא ה-<code>netstat</code> המודרני. השאלות שהוא עונה עליהן מהר:</p>
<ul><li>האפליקציה בכלל מאזינה, ועל איזה interface? <code>ss -tlnp</code> — ‏<code>0.0.0.0:8080</code> = כל ה-interfaces; ‏<code>127.0.0.1:8080</code> = רק localhost (הבאג הקלאסי של "עובד לוקאלית, לא נגיש ב-Docker").</li>
<li>כמה חיבורים ובאיזה מצב? <code>ss -s</code>, או <code>ss -tan state time-wait | wc -l</code>. עשרות אלפי <code>TIME-WAIT</code> = אתה פותח חיבור חדש לכל בקשה; תשתמש ב-keep-alive/pooling.</li>
<li>מי מחובר ל-Postgres? <code>ss -tnp dst :5432</code>.</li></ul>
<p><code>lsof</code> מציג קבצים פתוחים לפי תהליך: <code>lsof -p 4121</code> (כל מה שתהליך מחזיק), <code>lsof -i :8080</code> (מי תופס את הפורט — נפתר ה-"address already in use"), <code>lsof +L1</code> (קבצים מחוקים שעדיין פתוחים).</p>
<blockquote>⚠️ טיפ לפרודקשן: הרבה sockets ב-<code>CLOSE-WAIT</code> אומר שה<em>אפליקציה שלך</em> קיבלה FIN ואף פעם לא קראה ל-close() — זה באג בקוד שלך, לא ברשת.</blockquote>`
      }
    },
    {
      h: { en: "Step 5 — The chart: journalctl, dmesg, strace", he: "שלב 5 — התיק הרפואי: journalctl, ‏dmesg, ‏strace" },
      body: {
        en: `<p><code>journalctl</code> reads systemd's logs: <code>journalctl -u nginx --since "10 min ago"</code>, <code>-f</code> to follow, <code>-p err</code> for errors only, <code>-b -1</code> for the previous boot (what happened before that reboot?).</p>
<p><code>dmesg -T</code> is the kernel's own log — where the things your app can't log end up: OOM kills, disk errors (<code>I/O error, dev nvme0n1</code>), NIC resets, segfaults, conntrack tables full. If a process "just vanished", check here first.</p>
<p><code>strace</code> is the MRI: it shows every syscall a process makes. <code>strace -f -tt -p PID</code> on a hung process often reveals it instantly — stuck in <code>connect()</code> to an unreachable IP, or <code>futex()</code> (waiting on a lock), or reading a config file that doesn't exist. <code>strace -c -p PID</code> gives a syscall summary. It slows the process significantly, so use briefly in prod.</p>
<blockquote>💡 Real world: Brendan Gregg's "Linux performance analysis in 60 seconds" — uptime, dmesg | tail, vmstat 1, mpstat -P ALL 1, pidstat 1, iostat -xz 1, free -m, sar -n DEV 1, sar -n TCP,ETCP 1, top — is exactly this checkup. Memorize it.</blockquote>`,
        he: `<p><code>journalctl</code> קורא את הלוגים של systemd: <code>journalctl -u nginx --since "10 min ago"</code>, ‏<code>-f</code> כדי לעקוב, <code>-p err</code> רק שגיאות, <code>-b -1</code> ה-boot הקודם (מה קרה לפני ה-reboot הזה?).</p>
<p><code>dmesg -T</code> הוא הלוג של ה-kernel עצמו — לשם מגיעים הדברים שהאפליקציה לא יכולה לכתוב ללוג: OOM kills, שגיאות דיסק (<code>I/O error, dev nvme0n1</code>), ‏resets של כרטיס רשת, segfaults, טבלאות conntrack מלאות. אם תהליך "פשוט נעלם", תבדוק פה קודם.</p>
<p><code>strace</code> הוא ה-MRI: מראה כל syscall שהתהליך עושה. <code>strace -f -tt -p PID</code> על תהליך תקוע הרבה פעמים חושף מיד את הבעיה — תקוע ב-<code>connect()</code> ל-IP לא נגיש, או ב-<code>futex()</code> (מחכה ל-lock), או קורא קובץ config שלא קיים. <code>strace -c -p PID</code> נותן סיכום syscalls. הוא מאט את התהליך משמעותית, אז בפרודקשן — רק לרגע.</p>
<blockquote>💡 מהשטח: "Linux performance analysis in 60 seconds" של Brendan Gregg — ‏uptime, ‏dmesg | tail, ‏vmstat 1, ‏mpstat -P ALL 1, ‏pidstat 1, ‏iostat -xz 1, ‏free -m, ‏sar -n DEV 1, ‏sar -n TCP,ETCP 1, ‏top — זו בדיוק הבדיקה הזו. תשנן אותה.</blockquote>`
      }
    }
  ],
  diagram: `  "the server is slow"  -- checkup order --

  1 PULSE     uptime, top/htop, vmstat 1      load? us/sy/wa/st?
  2 BLOOD     free -h                          available? swapping?
  3 LUNGS     df -h / df -i, du, iostat -x 1   full? %util / await?
  4 HEART     ss -tlnp, ss -s, lsof -i         listening? conn states?
  5 CHART     journalctl -u X, dmesg -T        OOM? IO errors? crashes?
  6 MRI       strace -p PID                    what is it stuck on?`,
  handsOn: [
    { cmd: "uptime; nproc; vmstat 1 5", what: { en: "Pulse: load vs cores, run queue, swap, iowait.", he: "דופק: load מול ליבות, תור ריצה, swap, ‏iowait." } },
    { cmd: "free -h; df -h; df -i", what: { en: "Memory availability, disk space and inodes in one go.", he: "זמינות זיכרון, מקום בדיסק ו-inodes בבת אחת." } },
    { cmd: "sudo ss -tlnp; ss -s", what: { en: "Listening ports with owning processes, plus connection state summary.", he: "פורטים מאזינים עם התהליך שמחזיק אותם, וסיכום מצבי חיבורים." } },
    { cmd: "journalctl -p err -b --no-pager | tail -20; sudo dmesg -T | tail -20", what: { en: "Recent errors from services and from the kernel.", he: "שגיאות אחרונות מהשירותים ומה-kernel." } },
    { cmd: "strace -f -e trace=network,file curl -s https://example.com -o /dev/null", what: { en: "Watch every file open and network syscall curl makes.", he: "לראות כל פתיחת קובץ וכל syscall רשתי ש-curl עושה." } }
  ],
  mnemonic: {
    en: "\"Pulse, Blood, Lungs, Heart, Chart, MRI\" → top, free, df/iostat, ss, journalctl/dmesg, strace.",
    he: "\"דופק, דם, ריאות, לב, תיק, MRI\" ← top, ‏free, ‏df/iostat, ‏ss, ‏journalctl/dmesg, ‏strace."
  },
  pitfalls: [
    { en: "Jumping straight to strace or restarting the service before checking basic vitals — you destroy the evidence and maybe miss a full disk.", he: "לקפוץ ישר ל-strace או לעשות restart לשירות לפני בדיקת סימנים חיוניים — אתה הורס ראיות ואולי מפספס דיסק מלא." },
    { en: "Reading the first line of vmstat/iostat as 'current'. It's the average since boot; read lines 2+.", he: "לקרוא את השורה הראשונה של vmstat/iostat כ'עכשיו'. זה ממוצע מאז ה-boot; תקרא משורה 2 והלאה." },
    { en: "Deleting a huge log file that's still open and wondering why df doesn't change. Truncate it (: > file) or restart the writer.", he: "למחוק קובץ לוג ענק שעדיין פתוח ולתהות למה df לא משתנה. תעשה לו truncate ‏(‎: > file) או restart למי שכותב אליו." },
    { en: "Forgetting 'st' (steal) on cloud VMs: your code didn't get slower, the neighbour got louder.", he: "לשכוח את st ‏(steal) על VMs בענן: הקוד שלך לא נהיה איטי, השכן נהיה רועש." }
  ],
  interview: [
    {
      q: { en: "You SSH into a 'slow' Linux server. What do you run in the first 60 seconds?", he: "נכנסת ב-SSH לשרת Linux 'איטי'. מה אתה מריץ ב-60 השניות הראשונות?" },
      a: { en: "uptime (load trend), dmesg -T | tail (OOM, IO errors), vmstat 1 (run queue, swap, iowait), top (top consumers, us/sy/wa/st), free -h (available, swap), df -h (full disks), iostat -x 1 (disk saturation), ss -s (connection counts). That narrows it to CPU, memory, disk or network before any deep dive.", he: "uptime (מגמת load), ‏dmesg -T | tail ‏(OOM, שגיאות IO), ‏vmstat 1 (תור ריצה, swap, ‏iowait), ‏top (צרכנים מובילים, us/sy/wa/st), ‏free -h ‏(available, ‏swap), ‏df -h (דיסקים מלאים), ‏iostat -x 1 (רוויית דיסק), ‏ss -s (מספר חיבורים). זה מצמצם ל-CPU, זיכרון, דיסק או רשת לפני כל צלילה לעומק." }
    },
    {
      q: { en: "df says the disk is 100% full but du only finds 30% used. Why?", he: "df אומר שהדיסק מלא ב-100% אבל du מוצא רק 30% בשימוש. למה?" },
      a: { en: "Deleted files still held open by a process: the directory entry is gone (du can't see it) but the blocks are allocated until the last FD closes. Find with lsof +L1, then restart or signal the process to reopen its logs.", he: "קבצים מחוקים שתהליך עדיין מחזיק פתוחים: הרשומה בתיקייה נעלמה (du לא רואה) אבל הבלוקים תפוסים עד שה-FD האחרון נסגר. מוצאים עם lsof +L1, ואז restart לתהליך או signal שיפתח את הלוגים מחדש." }
    }
  ],
  quiz: [
    {
      q: { en: "top shows: 5 us, 2 sy, 45 id, 48 wa. Where do you look next?", he: "top מראה: 5 us, ‏2 sy, ‏45 id, ‏48 wa. לאן מסתכלים עכשיו?" },
      options: [
        { en: "Profile the app's CPU hot paths", he: "לעשות profiling ל-hot paths של ה-CPU באפליקציה" },
        { en: "iostat -x to see which disk is saturated", he: "‏iostat -x כדי לראות איזה דיסק רווי" },
        { en: "ss -s to count TCP connections", he: "‏ss -s כדי לספור חיבורי TCP" },
        { en: "Nothing, 45% idle means the box is healthy", he: "כלום, 45% idle אומר שהשרת בריא" }
      ],
      answer: 1,
      explain: { en: "48% iowait means CPUs are idle waiting on disk IO. iostat -x shows per-device await and %util.", he: "‏48% iowait אומר שה-CPUs יושבים ומחכים ל-IO של הדיסק. ‏iostat -x מראה await ו-%util לכל דיסק." }
    },
    {
      q: { en: "Your app runs in Docker but you can't reach it. ss -tlnp inside shows 127.0.0.1:3000. What's wrong?", he: "האפליקציה רצה ב-Docker ואי אפשר להגיע אליה. ‏ss -tlnp בפנים מראה ‎127.0.0.1:3000. מה הבעיה?" },
      options: [
        { en: "The port mapping is missing -p", he: "חסר port mapping עם ‎-p" },
        { en: "The firewall blocks port 3000", he: "ה-firewall חוסם את פורט 3000" },
        { en: "The app binds only to localhost inside the container; it must listen on 0.0.0.0", he: "האפליקציה מאזינה רק ל-localhost בתוך הקונטיינר; היא חייבת להאזין ל-0.0.0.0" },
        { en: "DNS is misconfigured", he: "ה-DNS מוגדר לא נכון" }
      ],
      answer: 2,
      explain: { en: "Inside a container, 127.0.0.1 is the container's own loopback; traffic forwarded via -p arrives on its eth0. Bind to 0.0.0.0.", he: "בתוך קונטיינר, 127.0.0.1 הוא ה-loopback של הקונטיינר עצמו; traffic שמגיע דרך ‎-p נכנס דרך eth0 שלו. צריך להאזין על 0.0.0.0." }
    },
    {
      q: { en: "A process silently disappeared overnight with no app logs. Best first command?", he: "תהליך נעלם בלילה בשקט בלי לוגים באפליקציה. מה הפקודה הראשונה הכי טובה?" },
      options: [
        { en: "strace -p on the dead PID", he: "‏strace -p על ה-PID המת" },
        { en: "df -h", he: "‏df -h" },
        { en: "ss -tlnp", he: "‏ss -tlnp" },
        { en: "dmesg -T | grep -i -E 'killed|oom|segfault'", he: "‏dmesg -T | grep -i -E 'killed|oom|segfault'" }
      ],
      answer: 3,
      explain: { en: "If the kernel killed it (OOM) or it segfaulted, the app couldn't log anything — but the kernel did. You can't strace a dead process.", he: "אם ה-kernel הרג אותו (OOM) או שהיה segfault, האפליקציה לא הספיקה לכתוב כלום — אבל ה-kernel כן. ואי אפשר לעשות strace לתהליך מת." }
    }
  ],
  playground: "terminal",
  related: ["cpu", "memory", "storage-io", "processes-linux", "obs-metrics"]
});

/* ============================== VMS ============================== */
INFRA.lessons.push({
  id: "vms",
  track: "foundations",
  order: 6,
  icon: "🖥️",
  level: 1,
  minutes: 8,
  title: { en: "Virtual machines & hypervisors", he: "מכונות וירטואליות ו-hypervisors" },
  tldr: {
    en: "A VM is a full fake computer with its own kernel, carved out of a real one by a hypervisor — heavier than a container, but with a much stronger isolation wall.",
    he: "VM זה מחשב מזויף שלם עם kernel משלו, שה-hypervisor חוצב מתוך מחשב אמיתי — כבד יותר מקונטיינר, אבל עם קיר בידוד הרבה יותר חזק."
  },
  analogy: {
    en: "A physical server is a building. VMs are separate apartments: each has its own front door, kitchen, plumbing and electricity meter (its own kernel and OS). Containers are rooms in a shared apartment: private doors, but one kitchen and one plumbing system (the host kernel). The hypervisor is the building management that splits the utilities — and sometimes oversells parking spots, betting not everyone comes home at once.",
    he: "שרת פיזי זה בניין. VMs הן דירות נפרדות: לכל אחת דלת כניסה, מטבח, צנרת ומונה חשמל משלה (kernel ומערכת הפעלה משלה). קונטיינרים הם חדרים בדירת שותפים: דלתות פרטיות, אבל מטבח אחד וצנרת אחת (ה-kernel של ה-host). ה-hypervisor הוא ועד הבית שמחלק את התשתיות — ולפעמים מוכר יותר חניות ממה שיש, בהימור שלא כולם יחזרו הביתה באותו זמן."
  },
  sections: [
    {
      h: { en: "Type 1 vs Type 2 hypervisors", he: "Hypervisor מסוג 1 מול סוג 2" },
      body: {
        en: `<p>A <strong>hypervisor</strong> creates and runs VMs, giving each one virtual CPUs, RAM, disks and NICs. Modern CPUs help with hardware extensions (Intel VT-x, AMD-V) so guest code runs natively at near-full speed; only privileged operations trap to the hypervisor.</p>
<ul><li><strong>Type 1 (bare-metal)</strong>: runs directly on hardware. VMware ESXi, Microsoft Hyper-V, Xen, and <strong>KVM</strong> (a Linux kernel module that turns Linux itself into a hypervisor). AWS's Nitro is KVM-based; GCP uses KVM too. This is what runs the cloud.</li>
<li><strong>Type 2 (hosted)</strong>: an app on top of a normal OS. VirtualBox, VMware Workstation, Parallels. Great for laptops and labs, extra overhead, not for production.</li></ul>
<p>Overhead on a modern Type 1 hypervisor: typically a few % CPU. Storage and network IO used to be the expensive part; paravirtualized drivers (virtio) and dedicated hardware (AWS Nitro cards) offload most of it.</p>
<blockquote>💡 Real world: Docker Desktop on Mac/Windows secretly runs a small Linux VM — containers need a Linux kernel, so on your laptop there's a hypervisor underneath (Apple Virtualization framework / WSL2 on Hyper-V).</blockquote>`,
        he: `<p><strong>Hypervisor</strong> יוצר ומריץ VMs, ונותן לכל אחת CPUs וירטואליים, RAM, דיסקים וכרטיסי רשת. מעבדים מודרניים עוזרים עם הרחבות חומרה (Intel VT-x, ‏AMD-V), כך שקוד ה-guest רץ native כמעט במהירות מלאה; רק פעולות privileged נתפסות ומטופלות ע"י ה-hypervisor.</p>
<ul><li><strong>Type 1 ‏(bare-metal)</strong>: רץ ישירות על החומרה. VMware ESXi, ‏Microsoft Hyper-V, ‏Xen, ו-<strong>KVM</strong> (מודול של ה-kernel של Linux שהופך את Linux עצמו ל-hypervisor). ‏Nitro של AWS מבוסס KVM; גם GCP משתמש ב-KVM. זה מה שמריץ את הענן.</li>
<li><strong>Type 2 ‏(hosted)</strong>: אפליקציה מעל מערכת הפעלה רגילה. VirtualBox, ‏VMware Workstation, ‏Parallels. מעולה ללפטופים ולמעבדות, overhead נוסף, לא לפרודקשן.</li></ul>
<p>ה-overhead על hypervisor מודרני מסוג 1: בדרך כלל כמה אחוזי CPU. IO של storage ורשת היה פעם החלק היקר; דרייברים paravirtualized ‏(virtio) וחומרה ייעודית (כרטיסי Nitro של AWS) מורידים את רוב העומס.</p>
<blockquote>💡 מהשטח: Docker Desktop על Mac/Windows מריץ בסתר VM קטן של Linux — קונטיינרים צריכים kernel של Linux, אז על הלפטופ שלך יש hypervisor מתחת (Apple Virtualization framework / ‏WSL2 על Hyper-V).</blockquote>`
      }
    },
    {
      h: { en: "VM vs container", he: "VM מול קונטיינר" },
      body: {
        en: `<table><tr><th></th><th>VM</th><th>Container</th></tr>
<tr><td>Kernel</td><td>Own guest kernel</td><td>Shares the host kernel</td></tr>
<tr><td>Boot time</td><td>~30 s – minutes</td><td>~100 ms – seconds</td></tr>
<tr><td>Size</td><td>GBs (full OS)</td><td>MBs (app + libs)</td></tr>
<tr><td>Isolation</td><td>Hardware-enforced, strong</td><td>Kernel features (namespaces/cgroups), weaker</td></tr>
<tr><td>Density</td><td>Tens per host</td><td>Hundreds per host</td></tr>
<tr><td>Different OS?</td><td>Yes (Windows on Linux host)</td><td>No — Linux containers need a Linux kernel</td></tr></table>
<p>They're not rivals; they <strong>stack</strong>. Your Kubernetes nodes are VMs (EC2, GCE), and containers run inside them. The VM gives the cloud provider a hard wall between customers; the container gives you fast, dense packaging of apps. A kernel exploit in a container can reach the host; escaping a VM requires a hypervisor bug, which is much rarer.</p>
<blockquote>💡 Real world: AWS Lambda and Fargate run each customer's code in <strong>Firecracker microVMs</strong> — VMs that boot in ~125 ms with ~5 MB overhead. Best of both worlds: container speed, VM isolation.</blockquote>`,
        he: `<table><tr><th></th><th>VM</th><th>קונטיינר</th></tr>
<tr><td>Kernel</td><td>kernel משלה (guest)</td><td>חולק את ה-kernel של ה-host</td></tr>
<tr><td>זמן עלייה</td><td>~30 שניות עד דקות</td><td>~100 ms עד שניות</td></tr>
<tr><td>גודל</td><td>GBs (מערכת הפעלה מלאה)</td><td>MBs (אפליקציה + ספריות)</td></tr>
<tr><td>בידוד</td><td>נאכף בחומרה, חזק</td><td>פיצ'רים של ה-kernel ‏(namespaces/cgroups), חלש יותר</td></tr>
<tr><td>צפיפות</td><td>עשרות ל-host</td><td>מאות ל-host</td></tr>
<tr><td>מערכת הפעלה אחרת?</td><td>כן (Windows על host של Linux)</td><td>לא — קונטיינרים של Linux צריכים kernel של Linux</td></tr></table>
<p>הם לא מתחרים; הם <strong>נערמים</strong> אחד על השני. ה-nodes של Kubernetes שלך הם VMs ‏(EC2, ‏GCE), והקונטיינרים רצים בתוכם. ה-VM נותן לספק הענן קיר קשיח בין לקוחות; הקונטיינר נותן לך אריזה מהירה וצפופה של אפליקציות. exploit ב-kernel מתוך קונטיינר יכול להגיע ל-host; לברוח מ-VM דורש באג ב-hypervisor, שזה הרבה יותר נדיר.</p>
<blockquote>💡 מהשטח: AWS Lambda ו-Fargate מריצים את הקוד של כל לקוח ב-<strong>Firecracker microVMs</strong> — VMs שעולות תוך ~125 ms עם overhead של ~5 MB. הטוב משני העולמות: מהירות של קונטיינר, בידוד של VM.</blockquote>`
      }
    },
    {
      h: { en: "vCPUs, overcommit and noisy neighbours", he: "vCPUs, ‏overcommit ו-noisy neighbours" },
      body: {
        en: `<p>A <strong>vCPU</strong> is a thread the hypervisor schedules onto a physical core (usually one hyperthread). Hypervisors can <strong>overcommit</strong>: sell 64 vCPUs on a host with 32 hyperthreads, betting most VMs idle most of the time. Same for RAM (with ballooning and page sharing). Great for utilization, risky for performance.</p>
<p>When everyone gets busy, you get <strong>noisy neighbours</strong>: your VM wants CPU but the physical core is serving someone else. Linux reports this as <strong>steal time</strong> (<code>st</code> in top). Steal above ~5–10% sustained = you're paying for CPU you're not getting. Shared disks and NICs have their own noisy-neighbour effects.</p>
<p>Cloud flavours: <strong>burstable</strong> instances (AWS t3/t4g) give a baseline (e.g. 20%) plus CPU credits — run hot for too long and you're throttled to baseline. Dedicated/compute-optimized families (c7i, m7i) don't overcommit CPU. "Dedicated hosts" give you the whole box.</p>
<blockquote>⚠️ Production tip: never run a latency-critical DB on a t3 "because it's cheap". When the credits run out at 2 PM on launch day, it drops to 20% of a vCPU.</blockquote>`,
        he: `<p><strong>vCPU</strong> הוא thread שה-hypervisor מתזמן על core פיזית (בדרך כלל hyperthread אחד). Hypervisors יכולים לעשות <strong>overcommit</strong>: למכור 64 vCPUs על host עם 32 hyperthreads, בהימור שרוב ה-VMs רוב הזמן לא עושות כלום. אותו דבר עם RAM (עם ballooning ו-page sharing). מצוין לניצולת, מסוכן לביצועים.</p>
<p>כשכולם נהיים עסוקים, מקבלים <strong>noisy neighbours</strong>: ה-VM שלך רוצה CPU אבל ה-core הפיזית משרתת מישהו אחר. Linux מדווח על זה כ-<strong>steal time</strong> ‏(<code>st</code> ב-top). steal מעל ~5–10% לאורך זמן = אתה משלם על CPU שאתה לא מקבל. גם לדיסקים ולכרטיסי רשת משותפים יש אפקטים של שכן רועש.</p>
<p>טעמים בענן: מכונות <strong>burstable</strong> ‏(t3/t4g ב-AWS) נותנות baseline (נגיד 20%) ועוד CPU credits — תרוץ חם יותר מדי זמן ותורד ל-baseline. משפחות dedicated/compute-optimized ‏(c7i, ‏m7i) לא עושות overcommit ל-CPU. "Dedicated hosts" נותנים לך את כל המכונה.</p>
<blockquote>⚠️ טיפ לפרודקשן: לעולם אל תריץ DB קריטי ל-latency על t3 "כי זה זול". כשה-credits נגמרים ב-14:00 ביום ההשקה, הוא יורד ל-20% של vCPU.</blockquote>`
      }
    },
    {
      h: { en: "VM images, and when VMs still win", he: "VM images, ומתי VMs עדיין מנצחות" },
      body: {
        en: `<p>A <strong>VM image</strong> (AMI on AWS, a qcow2/VMDK file) is a snapshot of a full disk: OS, packages, config. Teams "bake" images with <strong>Packer</strong> so new VMs boot ready to serve ("golden images"), and use <strong>cloud-init</strong> for per-instance config at first boot (hostname, SSH keys, join-the-cluster scripts). Autoscaling groups launch copies from that image.</p>
<p>VMs still win when you need:</p>
<ul><li><strong>Strong multi-tenant isolation</strong> — running untrusted code from different customers.</li>
<li><strong>A different kernel or OS</strong> — Windows workloads, custom kernel modules, specific kernel versions.</li>
<li><strong>Stateful, long-lived, special snowflakes</strong> — a big database on dedicated NVMe, licensed software tied to a machine, legacy apps nobody dares to containerize.</li>
<li><strong>Hardware-level features</strong> — GPUs passthrough, SR-IOV networking, compliance requirements that demand VM boundaries.</li></ul>
<p>Even in a fully containerized shop, you still manage VMs: they're the nodes. Know how to read their steal time and pick their instance family.</p>`,
        he: `<p><strong>VM image</strong> ‏(AMI ב-AWS, קובץ qcow2/VMDK) הוא snapshot של דיסק שלם: מערכת הפעלה, חבילות, config. צוותים "אופים" images עם <strong>Packer</strong> כדי ש-VMs חדשות יעלו מוכנות לשרת ("golden images"), ומשתמשים ב-<strong>cloud-init</strong> ל-config ספציפי לכל instance ב-boot הראשון (hostname, מפתחות SSH, סקריפט הצטרפות ל-cluster). ‏Autoscaling groups מרימות עותקים מה-image הזה.</p>
<p>VMs עדיין מנצחות כשצריך:</p>
<ul><li><strong>בידוד multi-tenant חזק</strong> — הרצת קוד לא אמין של לקוחות שונים.</li>
<li><strong>kernel או מערכת הפעלה אחרת</strong> — עומסי Windows, מודולי kernel מותאמים, גרסת kernel ספציפית.</li>
<li><strong>מכונות stateful, ארוכות חיים ו"מיוחדות"</strong> — DB גדול על NVMe ייעודי, תוכנה עם רישיון שקשור למכונה, אפליקציות legacy שאף אחד לא מעז להכניס לקונטיינר.</li>
<li><strong>פיצ'רים ברמת החומרה</strong> — GPU passthrough, ‏SR-IOV לרשת, דרישות compliance שמחייבות גבולות של VM.</li></ul>
<p>גם בארגון שכולו קונטיינרים, אתה עדיין מנהל VMs: הן ה-nodes. תדע לקרוא את ה-steal time שלהן ולבחור instance family.</p>`
      }
    }
  ],
  diagram: `   VMs (Type 1)                         Containers
  +--------+ +--------+            +-----+ +-----+ +-----+
  | App A  | | App B  |            |App A| |App B| |App C|
  | libs   | | libs   |            |libs | |libs | |libs |
  | Guest  | | Guest  |            +-----+ +-----+ +-----+
  | kernel | | kernel |            | container runtime     |
  +--------+ +--------+            | HOST kernel (shared)  |
  |   Hypervisor (KVM)  |          +-----------------------+
  |   Hardware          |          | (usually itself a VM!) |`,
  handsOn: [
    { cmd: "systemd-detect-virt", what: { en: "Are you on a VM (kvm, amazon, microsoft), in a container (docker), or on bare metal (none)?", he: "אתה על VM ‏(kvm, ‏amazon, ‏microsoft), בתוך קונטיינר (docker), או על bare metal ‏(none)?" } },
    { cmd: "grep -E -c 'vmx|svm' /proc/cpuinfo", what: { en: "Non-zero = the CPU exposes hardware virtualization (needed to run VMs/KVM).", he: "לא אפס = ה-CPU חושף virtualization בחומרה (נדרש כדי להריץ VMs/KVM)." } },
    { cmd: "top -bn1 | grep Cpu", what: { en: "Look at 'st' — steal time stolen by the hypervisor for other VMs.", he: "להסתכל על st — זמן שה-hypervisor 'גנב' בשביל VMs אחרות." } },
    { cmd: "multipass launch --name lab 22.04 && multipass shell lab", what: { en: "Spin up a real Ubuntu VM on your laptop in under a minute (Canonical Multipass).", he: "להרים VM אמיתית של Ubuntu על הלפטופ בפחות מדקה (Canonical Multipass)." } }
  ],
  mnemonic: {
    en: "\"VMs fake the HARDWARE, containers fake the OS.\" Type 1 sits on the metal, Type 2 sits on your desktop.",
    he: "\"VM מזייפת את החומרה, קונטיינר מזייף את מערכת ההפעלה.\" ‏Type 1 יושב על הברזל, Type 2 יושב על הדסקטופ."
  },
  pitfalls: [
    { en: "Assuming containers give VM-level isolation. They share the kernel; for hostile multi-tenancy use VMs, gVisor or Kata/Firecracker.", he: "להניח שקונטיינרים נותנים בידוד ברמת VM. הם חולקים kernel; ל-multi-tenancy עוין משתמשים ב-VMs, ‏gVisor או Kata/Firecracker." },
    { en: "Running sustained workloads on burstable instances and blaming the code when CPU credits run out.", he: "להריץ עומסים קבועים על מכונות burstable ולהאשים את הקוד כשה-CPU credits נגמרים." },
    { en: "Hand-configuring VMs via SSH (snowflake servers). Bake images or use config management so any VM can be replaced in minutes.", he: "להגדיר VMs ידנית דרך SSH ‏(snowflake servers). ‏'אופים' images או משתמשים ב-config management כדי שכל VM תהיה ניתנת להחלפה תוך דקות." }
  ],
  interview: [
    {
      q: { en: "What's the fundamental difference between a VM and a container?", he: "מה ההבדל המהותי בין VM לקונטיינר?" },
      a: { en: "A VM virtualizes hardware and runs its own kernel on a hypervisor; a container is an isolated process sharing the host kernel, using namespaces and cgroups. VMs: stronger isolation, any OS, heavier and slower to start. Containers: lightweight, fast, dense, but a kernel vulnerability is shared.", he: "VM מבצעת וירטואליזציה לחומרה ומריצה kernel משלה מעל hypervisor; קונטיינר הוא תהליך מבודד שחולק את ה-kernel של ה-host, בעזרת namespaces ו-cgroups. VMs: בידוד חזק יותר, כל מערכת הפעלה, כבדות ואיטיות לעלות. קונטיינרים: קלים, מהירים, צפופים, אבל חולשה ב-kernel משותפת לכולם." }
    },
    {
      q: { en: "What is CPU steal time and what does a high value tell you?", he: "מה זה CPU steal time ומה ערך גבוה אומר?" },
      a: { en: "The percentage of time your vCPU was ready to run but the hypervisor was serving another guest. High sustained steal means contention on the physical host (noisy neighbour or an overcommitted/burstable instance). Fix by moving to a larger or non-burstable instance, or a dedicated host.", he: "אחוז הזמן שה-vCPU שלך היה מוכן לרוץ אבל ה-hypervisor שירת guest אחר. steal גבוה לאורך זמן אומר תחרות על ה-host הפיזי (שכן רועש או instance עם overcommit/burstable). פותרים במעבר ל-instance גדול יותר או לא-burstable, או ל-dedicated host." }
    }
  ],
  quiz: [
    {
      q: { en: "Which is a Type 1 hypervisor?", he: "מה מהבאים הוא hypervisor מסוג 1?" },
      options: [
        { en: "VirtualBox", he: "VirtualBox" },
        { en: "Docker", he: "Docker" },
        { en: "KVM", he: "KVM" },
        { en: "VMware Workstation", he: "VMware Workstation" }
      ],
      answer: 2,
      explain: { en: "KVM turns the Linux kernel itself into a bare-metal hypervisor (it powers AWS Nitro and GCP). VirtualBox and Workstation are Type 2; Docker isn't a hypervisor at all.", he: "KVM הופך את ה-kernel של Linux עצמו ל-hypervisor על הברזל (הוא מריץ את AWS Nitro ו-GCP). ‏VirtualBox ו-Workstation הם Type 2; ‏Docker הוא בכלל לא hypervisor." }
    },
    {
      q: { en: "You need to run untrusted code from many customers on shared hardware. Safest choice?", he: "צריך להריץ קוד לא אמין מהרבה לקוחות על חומרה משותפת. מה הבחירה הכי בטוחה?" },
      options: [
        { en: "One container per customer on the same host", he: "קונטיינר לכל לקוח על אותו host" },
        { en: "A microVM (e.g. Firecracker) or VM per customer", he: "microVM (למשל Firecracker) או VM לכל לקוח" },
        { en: "One process per customer with different Unix users", he: "תהליך לכל לקוח עם Unix users שונים" },
        { en: "One Kubernetes namespace per customer", he: "Kubernetes namespace לכל לקוח" }
      ],
      answer: 1,
      explain: { en: "Containers and namespaces share the host kernel — one kernel bug breaks the wall. Hardware virtualization gives a much stronger boundary, which is why Lambda uses Firecracker.", he: "קונטיינרים ו-namespaces חולקים את ה-kernel — באג אחד ב-kernel שובר את הקיר. וירטואליזציה בחומרה נותנת גבול הרבה יותר חזק, ובגלל זה Lambda משתמשת ב-Firecracker." }
    },
    {
      q: { en: "top on a cloud VM shows 'st' at 25%. What does it mean?", he: "top על VM בענן מראה st של 25%. מה זה אומר?" },
      options: [
        { en: "25% of the time your vCPU wanted to run but the hypervisor gave the core to others", he: "‏25% מהזמן ה-vCPU שלך רצה לרוץ אבל ה-hypervisor נתן את ה-core לאחרים" },
        { en: "25% of CPU is spent on storage IO", he: "‏25% מה-CPU הולך על IO של storage" },
        { en: "A process is stealing memory", he: "תהליך גונב זיכרון" },
        { en: "25% of CPU is in kernel mode", he: "‏25% מה-CPU במצב kernel" }
      ],
      answer: 0,
      explain: { en: "Steal time = CPU time taken away by the hypervisor. 25% is severe: noisy neighbours or exhausted burst credits. Kernel time is 'sy', IO wait is 'wa'.", he: "Steal time = זמן CPU שה-hypervisor לקח ממך. ‏25% זה חמור: שכנים רועשים או burst credits שנגמרו. זמן kernel זה sy, המתנה ל-IO זה wa." }
    }
  ],
  related: ["cpu", "docker-why", "container-internals", "k8s-architecture"]
});

/* ============================== LATENCY NUMBERS ============================== */
INFRA.lessons.push({
  id: "latency-numbers",
  track: "foundations",
  order: 7,
  icon: "⏱️",
  level: 2,
  minutes: 7,
  title: { en: "Latency numbers every engineer should know", he: "מספרי latency שכל מהנדס חייב להכיר" },
  tldr: {
    en: "RAM is ~100x slower than L1 cache, SSD ~1,000x slower than RAM, and a cross-ocean round trip is ~150 ms of pure physics — design by these orders of magnitude, not by vibes.",
    he: "RAM איטי פי ~100 מ-L1 cache, ‏SSD איטי פי ~1,000 מ-RAM, ו-round trip מעבר לאוקיינוס זה ~150 ms של פיזיקה טהורה — מתכננים לפי סדרי הגודל האלה, לא לפי תחושות בטן."
  },
  analogy: {
    en: "Imagine your CPU is a chef who needs an ingredient. L1 cache: it's already in hand. RAM: walk to the fridge across the kitchen. SSD: drive to the supermarket. Disk seek: order it from abroad. A cross-continent network call: send a letter by ship and wait for the reply. If you knew the chef would ship letters across the ocean for every egg, you'd redesign the recipe — that's what caching and batching are.",
    he: "תדמיין שה-CPU הוא שף שצריך מצרך. L1 cache: כבר ביד. RAM: ללכת למקרר בצד השני של המטבח. SSD: לנסוע לסופר. Disk seek: להזמין מחו\"ל. קריאת רשת חוצת יבשות: לשלוח מכתב באונייה ולחכות לתשובה. אם היית יודע שהשף שולח מכתב מעבר לים בשביל כל ביצה, היית מעצב את המתכון מחדש — זה בדיוק מה ש-caching ו-batching הם."
  },
  sections: [
    {
      h: { en: "The table (approximate, modern hardware)", he: "הטבלה (בקירוב, חומרה מודרנית)" },
      body: {
        en: `<table><tr><th>Operation</th><th>Latency</th></tr>
<tr><td>L1 cache reference</td><td>~1 ns</td></tr>
<tr><td>Branch mispredict</td><td>~3 ns</td></tr>
<tr><td>L2 cache reference</td><td>~4 ns</td></tr>
<tr><td>Mutex lock/unlock (uncontended)</td><td>~17 ns</td></tr>
<tr><td>Main memory (RAM) reference</td><td>~100 ns</td></tr>
<tr><td>Compress 1 KB (fast codec)</td><td>~2 µs</td></tr>
<tr><td>Read 1 MB sequentially from RAM</td><td>~10–50 µs</td></tr>
<tr><td>NVMe SSD random 4K read</td><td>~20–100 µs</td></tr>
<tr><td>Round trip within same datacenter/AZ</td><td>~0.5 ms</td></tr>
<tr><td>Read 1 MB sequentially from SSD</td><td>~0.2–1 ms</td></tr>
<tr><td>Round trip between AZs in a region</td><td>~1–2 ms</td></tr>
<tr><td>HDD seek</td><td>~5–10 ms</td></tr>
<tr><td>Round trip US East ↔ US West</td><td>~60–70 ms</td></tr>
<tr><td>Round trip Tel Aviv ↔ Frankfurt</td><td>~50–60 ms</td></tr>
<tr><td>Round trip US East ↔ Europe</td><td>~80–90 ms</td></tr>
<tr><td>Round trip California ↔ Netherlands / Tel Aviv ↔ US West</td><td>~150 ms</td></tr></table>
<p>Exact values shift with hardware; the <strong>ratios</strong> are what you memorize. Each row is roughly an order of magnitude jump.</p>`,
        he: `<table><tr><th>פעולה</th><th>Latency</th></tr>
<tr><td>גישה ל-L1 cache</td><td>~1 ns</td></tr>
<tr><td>Branch mispredict</td><td>~3 ns</td></tr>
<tr><td>גישה ל-L2 cache</td><td>~4 ns</td></tr>
<tr><td>Mutex lock/unlock (בלי תחרות)</td><td>~17 ns</td></tr>
<tr><td>גישה לזיכרון ראשי (RAM)</td><td>~100 ns</td></tr>
<tr><td>דחיסת 1 KB (codec מהיר)</td><td>~2 µs</td></tr>
<tr><td>קריאת 1 MB סדרתית מ-RAM</td><td>~10–50 µs</td></tr>
<tr><td>קריאת 4K רנדומלית מ-NVMe SSD</td><td>~20–100 µs</td></tr>
<tr><td>Round trip בתוך אותו datacenter/AZ</td><td>~0.5 ms</td></tr>
<tr><td>קריאת 1 MB סדרתית מ-SSD</td><td>~0.2–1 ms</td></tr>
<tr><td>Round trip בין AZs באותו region</td><td>~1–2 ms</td></tr>
<tr><td>HDD seek</td><td>~5–10 ms</td></tr>
<tr><td>Round trip בין מזרח למערב ארה"ב</td><td>~60–70 ms</td></tr>
<tr><td>Round trip תל אביב ↔ פרנקפורט</td><td>~50–60 ms</td></tr>
<tr><td>Round trip מזרח ארה"ב ↔ אירופה</td><td>~80–90 ms</td></tr>
<tr><td>Round trip קליפורניה ↔ הולנד / תל אביב ↔ מערב ארה"ב</td><td>~150 ms</td></tr></table>
<p>הערכים המדויקים זזים עם החומרה; מה שמשננים זה את <strong>היחסים</strong>. כל שורה היא בערך קפיצה של סדר גודל.</p>`
      }
    },
    {
      h: { en: "Scaled to human time: if L1 = 1 second", he: "בקנה מידה אנושי: אם L1 = שנייה אחת" },
      body: {
        en: `<p>Multiply everything by a billion so 1 ns becomes 1 second:</p>
<ul><li><strong>L1 cache</strong>: 1 second — a heartbeat.</li>
<li><strong>L2 cache</strong>: 4 seconds — a deep breath.</li>
<li><strong>RAM</strong>: ~1.5 minutes — making a cup of instant coffee.</li>
<li><strong>NVMe read</strong>: ~1 day — waiting for a delivery.</li>
<li><strong>Same-DC network round trip</strong>: ~6 days — a work week.</li>
<li><strong>Cross-AZ round trip</strong>: ~2–3 weeks — a vacation.</li>
<li><strong>HDD seek</strong>: ~3–4 months — a semester.</li>
<li><strong>US East ↔ Europe</strong>: ~2.7 years — a full degree.</li>
<li><strong>Cross-planet round trip (150 ms)</strong>: ~4.8 years.</li>
<li><strong>Rebooting a server (~1 min)</strong>: ~1,900 years — since the Roman Empire.</li></ul>
<p>Now it's obvious why an N+1 query pattern (500 DB round trips × 0.5 ms = 250 ms) hurts so much more than a "slow" loop over 1 million in-memory items (~ms). Your CPU spends a <em>work week</em> waiting for every single network call.</p>
<blockquote>💡 Real world: the speed of light in fiber is ~200,000 km/s, so 1,000 km costs ~10 ms round trip <em>at minimum</em>. No amount of engineering beats physics — only moving data closer (CDN, edge, regional replicas) does.</blockquote>`,
        he: `<p>מכפילים הכל במיליארד, כך ש-1 ns הופך לשנייה אחת:</p>
<ul><li><strong>L1 cache</strong>: שנייה — פעימת לב.</li>
<li><strong>L2 cache</strong>: 4 שניות — נשימה עמוקה.</li>
<li><strong>RAM</strong>: ~דקה וחצי — להכין נס קפה.</li>
<li><strong>קריאה מ-NVMe</strong>: ~יום — לחכות למשלוח.</li>
<li><strong>Round trip ברשת באותו DC</strong>: ~6 ימים — שבוע עבודה.</li>
<li><strong>Round trip בין AZs</strong>: ~2–3 שבועות — חופשה.</li>
<li><strong>HDD seek</strong>: ~3–4 חודשים — סמסטר.</li>
<li><strong>מזרח ארה"ב ↔ אירופה</strong>: ~2.7 שנים — תואר שלם.</li>
<li><strong>Round trip לצד השני של העולם (150 ms)</strong>: ~4.8 שנים.</li>
<li><strong>Reboot לשרת (~דקה)</strong>: ~1,900 שנה — מאז האימפריה הרומית.</li></ul>
<p>עכשיו ברור למה דפוס N+1 queries ‏(500 round trips ל-DB × ‏0.5 ms = ‏250 ms) כואב הרבה יותר מלולאה "איטית" על מיליון איברים בזיכרון (~מילישניות). ה-CPU שלך מבלה <em>שבוע עבודה</em> בהמתנה לכל קריאת רשת בודדת.</p>
<blockquote>💡 מהשטח: מהירות האור בסיב אופטי היא ~200,000 ק"מ לשנייה, כלומר 1,000 ק"מ עולים ~10 ms round trip <em>לכל הפחות</em>. שום הנדסה לא מנצחת פיזיקה — רק להזיז את הדאטה קרוב יותר (CDN, ‏edge, replicas אזוריים).</blockquote>`
      }
    },
    {
      h: { en: "Using the numbers to design", he: "להשתמש במספרים כדי לתכנן" },
      body: {
        en: `<p>These numbers turn architecture debates into arithmetic. Practical rules that fall out of them:</p>
<ul><li><strong>Batch network calls.</strong> One query returning 500 rows beats 500 queries. Same for Redis: use <code>MGET</code>/pipelining instead of 500 <code>GET</code>s.</li>
<li><strong>Cache close to the consumer.</strong> In-process cache (~100 ns) &gt; Redis in the same AZ (~0.5 ms) &gt; DB with disk reads (ms) &gt; cross-region (tens of ms).</li>
<li><strong>Chatty microservices multiply latency.</strong> A request that fans out sequentially through 6 services at 2 ms each spends 12 ms just on hops, before doing any work. Parallelize independent calls.</li>
<li><strong>Keep sync calls inside one region.</strong> A synchronous cross-region call in the hot path adds 70–150 ms to every user request. Replicate data asynchronously instead.</li>
<li><strong>Latency budgets.</strong> If your SLO is p99 &lt; 200 ms, and the user is 150 ms away, you have ~50 ms for everything else — put a region or CDN closer.</li></ul>
<blockquote>⚠️ Production tip: cross-AZ traffic is not only slower (~1–2 ms) but also <strong>billed</strong> (~$0.01/GB each way on AWS). Chatty services spread across AZs can cost real money.</blockquote>`,
        he: `<p>המספרים האלה הופכים ויכוחי ארכיטקטורה לחשבון. כללים פרקטיים שיוצאים מהם:</p>
<ul><li><strong>תאחד קריאות רשת (batching).</strong> query אחד שמחזיר 500 שורות מנצח 500 queries. אותו דבר ב-Redis: ‏<code>MGET</code>/pipelining במקום 500 פקודות <code>GET</code>.</li>
<li><strong>Cache קרוב לצרכן.</strong> cache בתוך התהליך (~100 ns) &gt; ‏Redis באותו AZ ‏(~0.5 ms) &gt; ‏DB עם קריאות דיסק (ms) &gt; ‏cross-region (עשרות ms).</li>
<li><strong>Microservices פטפטניים מכפילים latency.</strong> בקשה שעוברת ברצף דרך 6 שירותים ב-2 ms כל אחד מבלה 12 ms רק על hops, לפני שעשתה עבודה כלשהי. תריץ במקביל קריאות בלתי תלויות.</li>
<li><strong>קריאות סינכרוניות — בתוך region אחד.</strong> קריאה סינכרונית cross-region ב-hot path מוסיפה 70–150 ms לכל בקשה של משתמש. עדיף לשכפל דאטה אסינכרונית.</li>
<li><strong>Latency budgets.</strong> אם ה-SLO שלך הוא p99 &lt; 200 ms, והמשתמש נמצא 150 ms ממך, נשארו לך ~50 ms לכל השאר — תשים region או CDN קרוב יותר.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: תעבורה בין AZs היא לא רק איטית יותר (~1–2 ms) אלא גם <strong>עולה כסף</strong> (~$0.01 ל-GB לכל כיוון ב-AWS). שירותים פטפטניים שמפוזרים על פני AZs יכולים לעלות כסף אמיתי.</blockquote>`
      }
    }
  ],
  diagram: `  log scale (each step ~10x)
  1ns   L1        |
  10ns  L2/mutex  |#
  100ns RAM       |##
  10us  RAM 1MB   |####
  100us NVMe      |#####
  0.5ms same DC   |######
  10ms  HDD seek  |########
  80ms  US<->EU   |#########
  150ms antipodal |##########`,
  handsOn: [
    { cmd: "ping -c 5 1.1.1.1", what: { en: "Measure your round trip to a nearby anycast edge (often single-digit ms).", he: "למדוד round trip ל-edge קרוב עם anycast (לרוב ms בודדים)." } },
    { cmd: "curl -o /dev/null -s -w 'dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\\n' https://example.com", what: { en: "Break a request into DNS, TCP connect, TLS handshake and time-to-first-byte.", he: "לפרק בקשה ל-DNS, ‏TCP connect, ‏TLS handshake ו-time-to-first-byte." } },
    { cmd: "redis-cli --latency -h localhost", what: { en: "See sub-millisecond latency to a local Redis; compare with a remote one.", he: "לראות latency של פחות ממילישנייה ל-Redis מקומי; להשוות ל-Redis מרוחק." } }
  ],
  mnemonic: {
    en: "\"1, 100, 100K, 500K, 150M\" (ns): L1, RAM, SSD, same-DC, other side of the planet. Or: heartbeat, coffee, delivery, work week, a degree.",
    he: "\"1, 100, 100K, 500K, 150M\" (ns): ‏L1, ‏RAM, ‏SSD, אותו DC, הצד השני של העולם. או: פעימת לב, נס קפה, משלוח, שבוע עבודה, תואר."
  },
  pitfalls: [
    { en: "N+1 queries: looping over 1,000 items and calling the DB for each. 1,000 × 0.5 ms = 500 ms of pure waiting.", he: "N+1 queries: לולאה על 1,000 איברים וקריאה ל-DB לכל אחד. ‏1,000 × ‏0.5 ms = ‏500 ms של המתנה טהורה." },
    { en: "Putting the app in one region and its database in another 'for now'. Every query pays a 60-150 ms round trip.", he: "לשים את האפליקציה ב-region אחד ואת הדאטאבייס באחר 'בינתיים'. כל query משלם round trip של 60-150 ms." },
    { en: "Micro-optimizing CPU code while the request spends 95% of its time in network hops.", he: "לעשות micro-optimization לקוד CPU כשהבקשה מבלה 95% מהזמן ב-hops ברשת." }
  ],
  interview: [
    {
      q: { en: "Roughly how much slower is a same-datacenter network round trip than a RAM access?", he: "בערך פי כמה round trip ברשת באותו datacenter איטי יותר מגישה ל-RAM?" },
      a: { en: "About 5,000x: ~100 ns for RAM vs ~0.5 ms for a network round trip. That's why in-process caches and batching matter so much, and why chatty service-to-service calls dominate latency.", he: "בערך פי 5,000: ‏~100 ns ל-RAM מול ~0.5 ms ל-round trip ברשת. בגלל זה cache בתוך התהליך ו-batching חשובים כל כך, ובגלל זה קריאות פטפטניות בין שירותים שולטות ב-latency." }
    },
    {
      q: { en: "Users in Israel complain your US-West-hosted app is slow even though server time is 20 ms. Why, and what do you do?", he: "משתמשים בישראל מתלוננים שהאפליקציה שמאוחסנת ב-US-West איטית, למרות שזמן השרת הוא 20 ms. למה, ומה עושים?" },
      a: { en: "Physics: ~150 ms per round trip, and a fresh HTTPS page load needs several (TCP, TLS, request, assets). Serve static content via a CDN, terminate TLS at the edge, keep connections alive, and for dynamic data consider a closer region (e.g. Europe or il-central-1) with replicated data.", he: "פיזיקה: ~150 ms לכל round trip, וטעינת עמוד HTTPS חדש דורשת כמה כאלה (TCP, ‏TLS, הבקשה, ה-assets). להגיש תוכן סטטי מ-CDN, לסיים TLS ב-edge, לשמור חיבורים פתוחים (keep-alive), ולדאטה דינמי לשקול region קרוב יותר (אירופה או il-central-1) עם דאטה משוכפל." }
    }
  ],
  quiz: [
    {
      q: { en: "If an L1 cache hit took 1 second, a RAM access would take about…", he: "אם גישה ל-L1 cache הייתה לוקחת שנייה, גישה ל-RAM הייתה לוקחת בערך…" },
      options: [
        { en: "2 seconds", he: "2 שניות" },
        { en: "1.5 minutes", he: "דקה וחצי" },
        { en: "1 day", he: "יום" },
        { en: "1 year", he: "שנה" }
      ],
      answer: 1,
      explain: { en: "RAM ≈ 100 ns ≈ 100x L1. 100 seconds ≈ 1.5 minutes. A day is closer to an NVMe read.", he: "RAM ≈ ‏100 ns ≈ פי 100 מ-L1. ‏100 שניות ≈ דקה וחצי. יום זה יותר קרוב לקריאה מ-NVMe." }
    },
    {
      q: { en: "A page makes 200 sequential DB queries at 0.5 ms each plus 10 ms of rendering. What's the biggest win?", he: "עמוד מבצע 200 queries רצופים ל-DB ב-0.5 ms כל אחד ועוד 10 ms של רינדור. מה השיפור הכי גדול?" },
      options: [
        { en: "A faster CPU for rendering", he: "CPU מהיר יותר לרינדור" },
        { en: "Moving the DB to NVMe", he: "להעביר את ה-DB ל-NVMe" },
        { en: "Batching into one or a few queries", he: "לאחד ל-query אחד או כמה בודדים" },
        { en: "Enabling HTTP/2", he: "להפעיל HTTP/2" }
      ],
      answer: 2,
      explain: { en: "200 × 0.5 ms = 100 ms of network waiting vs 10 ms rendering. Removing round trips cuts ~100 ms; nothing else comes close.", he: "‏200 × ‏0.5 ms = ‏100 ms של המתנה לרשת מול 10 ms רינדור. ביטול ה-round trips חוסך ~100 ms; שום דבר אחר לא מתקרב." }
    },
    {
      q: { en: "What's the theoretical minimum round trip over fiber between two points 3,000 km apart?", he: "מה ה-round trip המינימלי התאורטי בסיב אופטי בין שתי נקודות במרחק 3,000 ק\"מ?" },
      options: [
        { en: "~30 ms", he: "~30 ms" },
        { en: "~3 ms", he: "~3 ms" },
        { en: "~0.3 ms", he: "~0.3 ms" },
        { en: "~300 ms", he: "~300 ms" }
      ],
      answer: 0,
      explain: { en: "Light in fiber ≈ 200,000 km/s → 6,000 km round trip ≈ 30 ms. Real routes add more (non-straight paths, routers).", he: "אור בסיב ≈ ‏200,000 ק\"מ לשנייה ← round trip של 6,000 ק\"מ ≈ ‏30 ms. מסלולים אמיתיים מוסיפים עוד (לא בקו ישר, נתבים)." }
    }
  ],
  related: ["storage-io", "memory", "net-osi-tcpip"]
});

/* ============================== GLOSSARY ============================== */
[
  { term: "Core", def: { en: "An independent physical execution unit in a CPU; runs one thread at a time (two with SMT).", he: "יחידת ביצוע פיזית עצמאית ב-CPU; מריצה thread אחד בכל רגע (שניים עם SMT)." }, lesson: "cpu" },
  { term: "Hyperthreading (SMT)", def: { en: "Exposes one physical core as two logical CPUs sharing execution units; ~15-30% extra throughput, not 2x.", he: "חושף core פיזית אחת כשני CPUs לוגיים שחולקים יחידות ביצוע; ~15-30% throughput נוסף, לא פי 2." }, lesson: "cpu" },
  { term: "Context switch", def: { en: "The kernel saving one thread's state and loading another's on a CPU; costs microseconds plus cache pollution.", he: "ה-kernel שומר מצב של thread אחד וטוען של אחר על CPU; עולה מיקרו-שניות ועוד 'זיהום' של ה-cache." }, lesson: "cpu" },
  { term: "Load average", def: { en: "Average number of runnable + uninterruptible (IO-blocked) tasks over 1/5/15 minutes; compare to core count.", he: "ממוצע מספר המשימות שמוכנות לרוץ + חסומות על IO, על פני 1/5/15 דקות; משווים למספר הליבות." }, lesson: "cpu" },
  { term: "Millicore", def: { en: "1/1000 of a CPU; Kubernetes CPU unit (500m = half a CPU).", he: "‏1/1000 של CPU; יחידת ה-CPU של Kubernetes ‏(500m = חצי CPU)." }, lesson: "cpu" },
  { term: "CPU throttling", def: { en: "CFS quota pausing a cgroup that used its CPU budget for the current 100 ms period; causes latency spikes.", he: "ה-CFS quota עוצר cgroup שגמר את תקציב ה-CPU שלו ל-period הנוכחי של 100 ms; גורם לקפיצות latency." }, lesson: "cpu" },
  { term: "RSS", def: { en: "Resident Set Size: memory of a process physically in RAM right now.", he: "Resident Set Size: הזיכרון של תהליך שנמצא פיזית ב-RAM כרגע." }, lesson: "memory" },
  { term: "Page cache", def: { en: "Kernel cache of file contents in otherwise-free RAM; reclaimable on demand.", he: "cache של ה-kernel לתוכן קבצים ב-RAM שאחרת היה פנוי; משתחרר לפי דרישה." }, lesson: "memory" },
  { term: "Swap", def: { en: "Disk space used to hold evicted memory pages; far slower than RAM.", he: "שטח דיסק שמחזיק דפי זיכרון שפונו מה-RAM; הרבה יותר איטי מ-RAM." }, lesson: "memory" },
  { term: "OOM killer", def: { en: "Kernel mechanism that SIGKILLs a process when memory (host or cgroup) is exhausted; shows as exit 137.", he: "מנגנון של ה-kernel ששולח SIGKILL לתהליך כשנגמר הזיכרון (ב-host או ב-cgroup); מופיע כ-exit 137." }, lesson: "memory" },
  { term: "IOPS", def: { en: "Input/output operations per second a storage device can serve.", he: "מספר פעולות קלט/פלט בשנייה שמכשיר storage יכול לשרת." }, lesson: "storage-io" },
  { term: "iowait", def: { en: "% of time CPUs sat idle while disk IO was outstanding; high = disk bottleneck.", he: "אחוז הזמן שה-CPUs היו idle בזמן שהיה IO פתוח לדיסק; גבוה = צוואר בקבוק בדיסק." }, lesson: "storage-io" },
  { term: "Object storage", def: { en: "Flat key-to-blob storage over HTTP (S3, GCS, Azure Blob): huge, durable, cheap, higher latency.", he: "אחסון שטוח של key ל-blob על HTTP ‏(S3, ‏GCS, ‏Azure Blob): ענק, עמיד, זול, latency גבוה יותר." }, lesson: "storage-io" },
  { term: "SIGTERM", def: { en: "Signal 15: polite, catchable request to shut down; sent by docker stop and Kubernetes.", he: "Signal 15: בקשה מנומסת לסגירה שאפשר לתפוס; נשלח ע\"י docker stop ו-Kubernetes." }, lesson: "processes-linux" },
  { term: "SIGKILL", def: { en: "Signal 9: immediate, uncatchable kill by the kernel; exit code 137.", he: "Signal 9: הריגה מיידית ע\"י ה-kernel שאי אפשר לתפוס; exit code 137." }, lesson: "processes-linux" },
  { term: "File descriptor", def: { en: "Per-process integer handle to an open file, socket or pipe; limited by ulimit -n.", he: "מספר שמזהה קובץ, socket או pipe פתוח בתהליך; מוגבל ע\"י ulimit -n." }, lesson: "processes-linux" },
  { term: "Hypervisor", def: { en: "Software that runs VMs; Type 1 on bare metal (KVM, ESXi), Type 2 on a host OS (VirtualBox).", he: "תוכנה שמריצה VMs; ‏Type 1 על הברזל (KVM, ‏ESXi), ‏Type 2 מעל מערכת הפעלה (VirtualBox)." }, lesson: "vms" },
  { term: "Steal time", def: { en: "CPU time a VM wanted but the hypervisor gave to other guests ('st' in top).", he: "זמן CPU שה-VM רצתה אבל ה-hypervisor נתן ל-guests אחרים (st ב-top)." }, lesson: "vms" },
  { term: "strace", def: { en: "Linux tool that traces every system call a process makes; the 'MRI' for stuck processes.", he: "כלי Linux שעוקב אחרי כל system call שתהליך עושה; ה-MRI לתהליכים תקועים." }, lesson: "linux-toolkit" },
  { term: "Round-trip time (RTT)", def: { en: "Time for a packet to go to a destination and back; ~0.5 ms in a DC, ~80 ms US-Europe.", he: "הזמן שלוקח לפקטה להגיע ליעד ולחזור; ~0.5 ms בתוך DC, ‏~80 ms ארה\"ב-אירופה." }, lesson: "latency-numbers" }
].forEach(g => INFRA.glossary.push(Object.assign({ track: "foundations" }, g)));
