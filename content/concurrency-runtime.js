window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "runtime-threads-in-containers",
  track: "principal",
  order: 60,
  icon: "🧵",
  level: 3,
  minutes: 16,
  title: { en: "Threads, Pools and Runtimes Inside Containers", he: "Threads, ‏pools ו-runtimes בתוך containers" },
  tldr: {
    en: "Every runtime sizes its threads from the CPUs it thinks it has. Inside a container that number may be the node's 64 cores while the cgroup allows 2. Get it wrong and CFS quota throttling turns bursts into 80+ ms stalls; size every pool with Little's law (pool = throughput × latency) and isolate pools with bulkheads so one slow dependency can't drain them all.",
    he: "כל runtime קובע כמה threads להריץ לפי מספר ה-CPUs שהוא חושב שיש לו. בתוך container המספר הזה יכול להיות 64 ה-cores של ה-node, בזמן שה-cgroup מרשה רק 2. אם זה לא מכויל, ה-CFS quota הופך כל burst לעצירה של 80 ms ומעלה. את גודל כל pool קובעים לפי Little's law ‏(pool = throughput × latency), ומפרידים pools עם bulkheads כדי שתלות איטית אחת לא תרוקן את כולם."
  },
  analogy: {
    en: "A restaurant kitchen is told it has 64 cooks because the building has 64 stoves, but the landlord only pays for 2 stoves' worth of gas per hour. All 64 cooks start at once, burn the hour's gas in eight minutes, and then everyone stands still until the next hour. Meanwhile the waiters (connection pools) keep taking orders until every table is full of people waiting for food that isn't coming.",
    he: "אומרים למטבח של מסעדה שיש לו 64 טבחים, כי בבניין יש 64 כיריים. אבל בעל הבית משלם על גז רק לשתי כיריים בשעה. כל 64 הטבחים מתחילים יחד, שורפים את הגז של כל השעה בשמונה דקות, ואז כולם עומדים עד השעה הבאה. בינתיים המלצרים (ה-connection pools) ממשיכים לקבל הזמנות, עד שכל השולחנות מלאים באנשים שמחכים לאוכל שלא מגיע."
  },
  sections: [
    {
      h: { en: "What the runtime sees vs what the cgroup allows", he: "מה ה-runtime רואה מול מה שה-cgroup מרשה" },
      body: {
        en: `<p>A container is just a process in a cgroup. <code>nproc</code>, <code>/proc/cpuinfo</code> and <code>sched_getaffinity()</code> show the CPUs the process <em>may run on</em> (usually all of the node's cores). The Kubernetes CPU <strong>limit</strong> is a different thing: a CFS bandwidth quota in <code>cpu.max</code>. The CPU <strong>request</strong> becomes <code>cpu.weight</code>, a relative share that no runtime uses for sizing.</p>
<pre>$ nproc
64
$ cat /sys/fs/cgroup/cpu.max          # quota period (µs): limit = 200000/100000 = 2 CPUs
200000 100000
$ cat /sys/fs/cgroup/cpu.weight       # from the request, used only under contention
79</pre>
<table>
<tr><th>Runtime</th><th>What it sizes from CPU count</th><th>Container-aware?</th><th>Override</th></tr>
<tr><td>Go</td><td><code>GOMAXPROCS</code> (Ps that run Go code), GC workers (25% of GOMAXPROCS)</td><td>Since Go 1.25: reads the cgroup CPU limit, rounds up, and re-checks periodically</td><td><code>GOMAXPROCS=2</code>; before 1.25 <code>go.uber.org/automaxprocs</code></td></tr>
<tr><td>JVM</td><td><code>availableProcessors()</code> → GC threads, JIT compiler threads, <code>ForkJoinPool.commonPool()</code>, many framework pools</td><td>Yes (<code>-XX:+UseContainerSupport</code>, default since JDK 10 / 8u191; cgroup v2 since 15 / 11.0.16 / 8u372)</td><td><code>-XX:ActiveProcessorCount=2</code></td></tr>
<tr><td>Node.js</td><td>libuv threadpool is <strong>fixed at 4</strong> regardless of CPUs; you scale with processes</td><td>Pool size doesn't look at CPUs at all</td><td><code>UV_THREADPOOL_SIZE</code> (max 1024)</td></tr>
<tr><td>.NET</td><td>Thread pool minimum = processor count; Server GC heaps = processor count</td><td>Yes, <code>Environment.ProcessorCount</code> respects the limit (rounded up)</td><td><code>DOTNET_PROCESSOR_COUNT</code>, <code>SetMinThreads</code></td></tr>
<tr><td>Python</td><td><code>os.cpu_count()</code> → Gunicorn configs, <code>ProcessPoolExecutor</code>, <code>ThreadPoolExecutor</code> default <code>min(32, cpu+4)</code></td><td>No: returns host CPUs (3.13 added <code>os.process_cpu_count()</code>, affinity only, not quota)</td><td>Set worker counts explicitly from an env var</td></tr>
</table>
<blockquote>💡 Real world: the bug is never "the app is slow". It is "p99 jumped from 40 ms to 300 ms after we moved to the bigger 64-core nodes". Same pod, same limit; the runtime simply saw more cores and started more threads.</blockquote>`,
        he: `<p>Container הוא בסך הכל process בתוך cgroup. הפקודה <code>nproc</code>, הקובץ <code>/proc/cpuinfo</code> והקריאה <code>sched_getaffinity()</code> מראים על אילו CPUs ה-process <em>רשאי לרוץ</em>, ובדרך כלל אלה כל ה-cores של ה-node. ה-CPU <strong>limit</strong> של Kubernetes זה משהו אחר: quota של CFS bandwidth בקובץ <code>cpu.max</code>. ה-CPU <strong>request</strong> הופך ל-<code>cpu.weight</code>, משקל יחסי שאף runtime לא משתמש בו כדי לקבוע גדלים.</p>
<pre>$ nproc
64
$ cat /sys/fs/cgroup/cpu.max          # quota period (µs): limit = 200000/100000 = 2 CPUs
200000 100000
$ cat /sys/fs/cgroup/cpu.weight       # from the request, used only under contention
79</pre>
<table>
<tr><th>Runtime</th><th>מה נקבע לפי מספר ה-CPUs</th><th>מודע ל-container?</th><th>Override</th></tr>
<tr><td>Go</td><td><code>GOMAXPROCS</code> (ה-Ps שמריצים קוד Go), ה-workers של ה-GC ‏(25% מ-GOMAXPROCS)</td><td>מאז Go 1.25: קורא את ה-CPU limit של ה-cgroup, מעגל למעלה ובודק מחדש מדי פעם</td><td><code>GOMAXPROCS=2</code>; לפני 1.25 <code>go.uber.org/automaxprocs</code></td></tr>
<tr><td>JVM</td><td><code>availableProcessors()</code> קובע threads של GC, של ה-JIT, את <code>ForkJoinPool.commonPool()</code> והרבה pools של frameworks</td><td>כן (<code>-XX:+UseContainerSupport</code>, ברירת מחדל מאז JDK 10 / 8u191; תמיכה ב-cgroup v2 מאז 15 / 11.0.16 / 8u372)</td><td><code>-XX:ActiveProcessorCount=2</code></td></tr>
<tr><td>Node.js</td><td>ה-threadpool של libuv <strong>קבוע על 4</strong> בלי קשר ל-CPUs; מגדילים עם processes</td><td>גודל ה-pool לא מסתכל על CPUs בכלל</td><td><code>UV_THREADPOOL_SIZE</code> (מקסימום 1024)</td></tr>
<tr><td>.NET</td><td>המינימום של ה-thread pool שווה למספר המעבדים; כך גם מספר ה-heaps ב-Server GC</td><td>כן, <code>Environment.ProcessorCount</code> מכבד את ה-limit (מעוגל למעלה)</td><td><code>DOTNET_PROCESSOR_COUNT</code>, <code>SetMinThreads</code></td></tr>
<tr><td>Python</td><td><code>os.cpu_count()</code> קובע הגדרות של Gunicorn, את <code>ProcessPoolExecutor</code>, ואת ברירת המחדל של <code>ThreadPoolExecutor</code> שהיא <code>min(32, cpu+4)</code></td><td>לא: מחזיר את ה-CPUs של ה-host. ב-3.13 נוסף <code>os.process_cpu_count()</code>, אבל הוא מכבד רק affinity, לא quota</td><td>לקבוע את מספר ה-workers במפורש ממשתנה סביבה</td></tr>
</table>
<blockquote>💡 Real world: הבאג אף פעם לא נראה כמו "האפליקציה איטית". הוא נראה כמו "ה-p99 קפץ מ-40 ms ל-300 ms אחרי שעברנו ל-nodes הגדולים של 64 cores". אותו Pod, אותו limit. ה-runtime פשוט ראה יותר cores והרים יותר threads.</blockquote>`
      }
    },
    {
      h: { en: "Go and the JVM: GOMAXPROCS, common pool, GC threads", he: "Go וה-JVM: ‏GOMAXPROCS, ה-common pool ו-threads של GC" },
      body: {
        en: `<p><strong>Go.</strong> Before 1.25, <code>GOMAXPROCS</code> defaulted to the number of usable cores. On a 64-core node with a 2-CPU limit, 64 Ps run goroutines in parallel, the GC's background workers take 25% of 64 = 16 threads, and the whole pod hits its quota in a few milliseconds. Go 1.25 made the default container-aware on Linux: it uses the cgroup limit, rounds fractional limits up (1.5 → 2), never goes below 2 when the machine has more cores, and updates <code>GOMAXPROCS</code> if the limit changes at runtime. It still ignores the CPU request. Setting <code>GOMAXPROCS</code> yourself turns that logic off; <code>GODEBUG=containermaxprocs=0</code> restores the old behaviour.</p>
<pre>// Go &lt; 1.25: one import, at startup it sets GOMAXPROCS from cpu.max
import _ "go.uber.org/automaxprocs"

// any version: log what you got
log.Printf("GOMAXPROCS=%d NumCPU=%d", runtime.GOMAXPROCS(0), runtime.NumCPU())</pre>
<p><strong>JVM.</strong> With container support on, <code>availableProcessors()</code> returns the limit (JDK 19+ ignores CPU shares, so a pod with only a request sees all node CPUs). Everything flows from that number:</p>
<ul>
<li><code>ForkJoinPool.commonPool()</code> parallelism = CPUs − 1. It runs parallel streams and every <code>CompletableFuture.supplyAsync()</code> without an executor. With a 2-CPU limit that is <strong>one</strong> thread: one blocking HTTP call inside <code>supplyAsync</code> stalls every other async task in the JVM.</li>
<li>G1 <code>ParallelGCThreads</code> = CPUs up to 8, then 8 + 5/8 of the rest; <code>ConcGCThreads</code> about a quarter of that. A JVM that sees 64 CPUs starts 43 parallel GC threads that all burst during a pause.</li>
<li>Below 2 CPUs or 1792 MB the JVM silently picks SerialGC. A <code>500m</code> limit gives you a single-threaded collector.</li>
<li>Virtual threads (JDK 21+) run on their own ForkJoinPool with parallelism = CPUs. They fix "one thread per request", not CPU math; and before JDK 24, <code>synchronized</code> blocks pin the carrier thread.</li>
</ul>
<pre>java -XshowSettings:system -version          # "Effective CPU Count: 2", memory limit
jcmd 1 VM.flags | tr ' ' '\\n' | grep -E 'ActiveProcessorCount|ParallelGCThreads|ConcGCThreads|Use.*GC'
jcmd 1 Thread.print | grep -c 'ForkJoinPool.commonPool'</pre>`,
        he: `<p><strong>Go.</strong> לפני 1.25, ברירת המחדל של <code>GOMAXPROCS</code> הייתה מספר ה-cores הזמינים. על node של 64 cores עם limit של 2 CPUs, ‏64 Ps מריצים goroutines במקביל, ה-workers של ה-GC לוקחים 25% מ-64, כלומר 16 threads, וכל ה-Pod גומר את ה-quota תוך כמה מילישניות. ב-Go 1.25 ברירת המחדל נהייתה מודעת ל-container ב-Linux: היא משתמשת ב-limit של ה-cgroup, מעגלת limit שבור למעלה (1.5 הופך ל-2), לא יורדת מתחת ל-2 כשיש למכונה יותר cores, ומעדכנת את <code>GOMAXPROCS</code> אם ה-limit משתנה תוך כדי ריצה. את ה-CPU request היא עדיין מתעלמת ממנו. אם אתה קובע <code>GOMAXPROCS</code> בעצמך, הלוגיקה הזו כבויה; <code>GODEBUG=containermaxprocs=0</code> מחזיר את ההתנהגות הישנה.</p>
<pre>// Go &lt; 1.25: one import, at startup it sets GOMAXPROCS from cpu.max
import _ "go.uber.org/automaxprocs"

// any version: log what you got
log.Printf("GOMAXPROCS=%d NumCPU=%d", runtime.GOMAXPROCS(0), runtime.NumCPU())</pre>
<p><strong>JVM.</strong> כשתמיכת ה-container פעילה, <code>availableProcessors()</code> מחזיר את ה-limit. מ-JDK 19 ה-JVM מתעלם מ-CPU shares, אז Pod שיש לו רק request רואה את כל ה-CPUs של ה-node. כל השאר נגזר מהמספר הזה:</p>
<ul>
<li>ה-parallelism של <code>ForkJoinPool.commonPool()</code> הוא מספר ה-CPUs פחות 1. הוא מריץ parallel streams וכל <code>CompletableFuture.supplyAsync()</code> בלי executor. עם limit של 2 CPUs זה thread <strong>אחד</strong>: קריאת HTTP חוסמת אחת בתוך <code>supplyAsync</code> תוקעת כל משימה אסינכרונית אחרת ב-JVM.</li>
<li>ב-G1, ‏<code>ParallelGCThreads</code> שווה למספר ה-CPUs עד 8, ומעל זה 8 ועוד 5/8 מהשאר; <code>ConcGCThreads</code> הוא בערך רבע מזה. JVM שרואה 64 CPUs מרים 43 threads של GC שכולם עושים burst בזמן pause.</li>
<li>מתחת ל-2 CPUs או ל-1792 MB ה-JVM בוחר בשקט ב-SerialGC. ‏limit של <code>500m</code> נותן לך collector עם thread יחיד.</li>
<li>Virtual threads ‏(JDK 21+) רצים על ForkJoinPool משלהם עם parallelism ששווה למספר ה-CPUs. הם פותרים את "thread לכל request", לא את חשבון ה-CPU. ולפני JDK 24, בלוק <code>synchronized</code> מצמיד את ה-carrier thread.</li>
</ul>
<pre>java -XshowSettings:system -version          # "Effective CPU Count: 2", memory limit
jcmd 1 VM.flags | tr ' ' '\\n' | grep -E 'ActiveProcessorCount|ParallelGCThreads|ConcGCThreads|Use.*GC'
jcmd 1 Thread.print | grep -c 'ForkJoinPool.commonPool'</pre>`
      }
    },
    {
      h: { en: "Node's libuv pool, .NET starvation, Python's GIL and Gunicorn", he: "ה-pool של libuv ב-Node, ‏starvation ב-.NET, וה-GIL ו-Gunicorn ב-Python" },
      body: {
        en: `<p><strong>Node.js.</strong> The event loop is one thread, but libuv keeps a hidden pool of <strong>4 threads</strong> (<code>UV_THREADPOOL_SIZE</code>, max 1024) for work the OS can't do asynchronously: <code>dns.lookup()</code> (which is what <code>http.get</code> uses by default), all <code>fs.*</code> calls, <code>crypto.pbkdf2/scrypt/randomBytes</code>, and async <code>zlib</code>. Network sockets do <em>not</em> use it (they go through epoll). So four slow password hashes, or four <code>getaddrinfo</code> calls to a slow resolver, delay every file read and every DNS lookup in the process. Typical symptom: outbound HTTP calls show 200 ms of "DNS" time while the resolver itself answers in 1 ms.</p>
<pre># must be set before the pool is first used; env var is safest
UV_THREADPOOL_SIZE=16 node server.js</pre>
<p><strong>.NET.</strong> The thread pool starts at <code>min threads = processor count</code>. Above that it adds threads slowly (hill climbing plus starvation detection, roughly one or two threads per second). <strong>Sync-over-async</strong> (<code>.Result</code>, <code>.Wait()</code>, <code>GetAwaiter().GetResult()</code>) blocks a pool thread while it waits for a continuation that needs... a pool thread. With a 2-CPU limit, a burst of 200 requests that each block on <code>.Result</code> parks every thread; the queue grows, the pool injects a thread every half second, and latency climbs to tens of seconds while CPU stays near 0%. Fix the code (async all the way); <code>ThreadPool.SetMinThreads</code> only buys time.</p>
<pre>dotnet-counters monitor -n MyApi --counters System.Runtime
#  ThreadPool Queue Length        4,812     &lt;- growing = starvation
#  ThreadPool Thread Count          37      &lt;- creeping up slowly
#  CPU Usage (%)                     3      &lt;- idle CPU, stuck app</pre>
<p><strong>Python.</strong> With the GIL, only one thread runs Python bytecode at a time, so threads help with IO only. The free-threaded build (<code>python3.13t</code> experimental, officially supported but not the default in 3.14) removes the GIL at a single-thread cost and needs C extensions that declare support. In production you still scale with <strong>processes</strong>: Gunicorn's classic advice <code>workers = 2 × cores + 1</code> computed from <code>os.cpu_count()</code> gives 129 workers on a 64-core node with a 2-CPU limit: 129 copies of your app in memory (OOMKill) fighting over 2 CPUs (throttling). In a container, set <code>--workers</code> from the limit (often 2-4) and use <code>--threads</code> or an async worker for IO concurrency.</p>`,
        he: `<p><strong>Node.js.</strong> ה-event loop הוא thread אחד, אבל libuv מחזיק pool נסתר של <strong>4 threads</strong> ‏(<code>UV_THREADPOOL_SIZE</code>, עד 1024) לעבודה שמערכת ההפעלה לא יודעת לעשות אסינכרונית: <code>dns.lookup()</code> (וזה מה ש-<code>http.get</code> משתמש בו כברירת מחדל), כל קריאות <code>fs.*</code>, ‏<code>crypto.pbkdf2/scrypt/randomBytes</code>, ו-<code>zlib</code> אסינכרוני. ה-sockets של הרשת <em>לא</em> משתמשים בו, הם עוברים דרך epoll. לכן ארבעה hashes איטיים של סיסמאות, או ארבע קריאות <code>getaddrinfo</code> ל-resolver איטי, מעכבים כל קריאת קובץ וכל DNS lookup ב-process. סימפטום טיפוסי: קריאות HTTP יוצאות מראות 200 ms של זמן "DNS", בזמן שה-resolver עצמו עונה תוך 1 ms.</p>
<pre># must be set before the pool is first used; env var is safest
UV_THREADPOOL_SIZE=16 node server.js</pre>
<p><strong>.NET.</strong> ה-thread pool מתחיל עם מינימום threads ששווה למספר המעבדים. מעל זה הוא מוסיף threads לאט (hill climbing ועוד זיהוי starvation, בערך thread או שניים בשנייה). <strong>Sync-over-async</strong> ‏(<code>.Result</code>, ‏<code>.Wait()</code>, ‏<code>GetAwaiter().GetResult()</code>) חוסם thread מה-pool בזמן שהוא מחכה ל-continuation שצריך... thread מה-pool. עם limit של 2 CPUs, burst של 200 requests שכל אחד מהם נחסם על <code>.Result</code> תוקע את כל ה-threads. התור גדל, ה-pool מוסיף thread כל חצי שנייה, וה-latency מטפס לעשרות שניות בזמן שה-CPU כמעט על 0%. התיקון הוא בקוד (async עד הסוף). <code>ThreadPool.SetMinThreads</code> רק קונה זמן.</p>
<pre>dotnet-counters monitor -n MyApi --counters System.Runtime
#  ThreadPool Queue Length        4,812     &lt;- growing = starvation
#  ThreadPool Thread Count          37      &lt;- creeping up slowly
#  CPU Usage (%)                     3      &lt;- idle CPU, stuck app</pre>
<p><strong>Python.</strong> עם ה-GIL רק thread אחד מריץ bytecode של Python בכל רגע, אז threads עוזרים רק ל-IO. ה-build ה-free-threaded ‏(<code>python3.13t</code> ניסיוני; ב-3.14 נתמך רשמית אבל לא ברירת מחדל) מוריד את ה-GIL במחיר מסוים לביצועי thread יחיד, ודורש C extensions שמצהירות על תמיכה. בפרודקשן עדיין מגדילים עם <strong>processes</strong>. העצה הקלאסית של Gunicorn, <code>workers = 2 × cores + 1</code>, כשהיא מחושבת מ-<code>os.cpu_count()</code>, נותנת 129 workers על node של 64 cores עם limit של 2 CPUs. כלומר 129 עותקים של האפליקציה בזיכרון (OOMKill) שנלחמים על 2 CPUs ‏(throttling). ב-container תקבע את <code>--workers</code> לפי ה-limit (לרוב 2 עד 4), ותשתמש ב-<code>--threads</code> או ב-worker אסינכרוני בשביל concurrency של IO.</p>`
      }
    },
    {
      h: { en: "CFS quota math: why 16 threads on a 2-CPU limit wreck p99", he: "החשבון של CFS quota: למה 16 threads על limit של 2 CPUs הורסים את ה-p99" },
      body: {
        en: `<p>CFS bandwidth control hands the cgroup a budget per <strong>100 ms period</strong>. A 2-CPU limit = 200 ms of CPU time per 100 ms of wall time, shared by <em>all</em> threads. If 16 threads are runnable on a 64-core node, they consume 16 ms of CPU every 1 ms of wall time:</p>
<pre>budget per period      = 2 CPUs × 100 ms   = 200 ms CPU
burn rate              = 16 threads busy   = 16 ms CPU per 1 ms wall
budget gone after      = 200 / 16          = 12.5 ms
then throttled for     = 100 − 12.5        = 87.5 ms   (nothing in the pod runs)</pre>
<p>A request that arrives at the wrong moment waits up to 87.5 ms before any of its code runs, even though average CPU over a minute is 30%. That's why throttling shows up as <strong>tail latency</strong>, not as high CPU. The cure is fewer parallel threads (correct <code>GOMAXPROCS</code>/<code>ActiveProcessorCount</code>), a higher or no CPU limit for latency-sensitive services, or <code>cpu.max.burst</code> where your platform exposes it.</p>
<pre>$ cat /sys/fs/cgroup/cpu.stat
usage_usec 81234567
user_usec 70011223
system_usec 11223344
nr_periods 36000          # 100 ms periods seen (1 hour)
nr_throttled 10080        # 28% of periods hit the quota
throttled_usec 612000000  # 612 s of stall in 1 hour</pre>
<pre># PromQL: share of periods throttled, per container
sum by (namespace, pod, container) (rate(container_cpu_cfs_throttled_periods_total[5m]))
  / sum by (namespace, pod, container) (rate(container_cpu_cfs_periods_total[5m]))
# alert when &gt; 0.25 for 15m on a latency-sensitive service</pre>
<blockquote>⚠️ Production tip: <code>kubectl top pod</code> shows a 1-minute-ish average from metrics-server. A pod at 600m of a 2000m limit can still be throttled in a quarter of its periods. Always graph throttled periods next to p99.</blockquote>`,
        he: `<p>ה-CFS bandwidth control נותן ל-cgroup תקציב לכל <strong>period של 100 ms</strong>. ‏limit של 2 CPUs שווה 200 ms של זמן CPU לכל 100 ms של זמן אמיתי, ו-<em>כל</em> ה-threads חולקים אותו. אם 16 threads מוכנים לרוץ על node של 64 cores, הם צורכים 16 ms של CPU בכל מילישנייה אמיתית:</p>
<pre>budget per period      = 2 CPUs × 100 ms   = 200 ms CPU
burn rate              = 16 threads busy   = 16 ms CPU per 1 ms wall
budget gone after      = 200 / 16          = 12.5 ms
then throttled for     = 100 − 12.5        = 87.5 ms   (nothing in the pod runs)</pre>
<p>Request שמגיע ברגע הלא נכון מחכה עד 87.5 ms לפני ששורה אחת מהקוד שלו רצה, גם אם ה-CPU הממוצע לאורך דקה הוא 30%. לכן throttling מופיע כ-<strong>tail latency</strong> ולא כ-CPU גבוה. התרופה: פחות threads מקבילים (<code>GOMAXPROCS</code> או <code>ActiveProcessorCount</code> נכונים), ‏limit גבוה יותר או בלי limit בכלל לשירותים רגישים ל-latency, או <code>cpu.max.burst</code> איפה שהפלטפורמה חושפת אותו.</p>
<pre>$ cat /sys/fs/cgroup/cpu.stat
usage_usec 81234567
user_usec 70011223
system_usec 11223344
nr_periods 36000          # 100 ms periods seen (1 hour)
nr_throttled 10080        # 28% of periods hit the quota
throttled_usec 612000000  # 612 s of stall in 1 hour</pre>
<pre># PromQL: share of periods throttled, per container
sum by (namespace, pod, container) (rate(container_cpu_cfs_throttled_periods_total[5m]))
  / sum by (namespace, pod, container) (rate(container_cpu_cfs_periods_total[5m]))
# alert when &gt; 0.25 for 15m on a latency-sensitive service</pre>
<blockquote>⚠️ Production tip: ‏<code>kubectl top pod</code> מראה ממוצע של בערך דקה מ-metrics-server. ‏Pod שצורך 600m מתוך limit של 2000m עדיין יכול להיות throttled ברבע מה-periods. תמיד תשים גרף של throttled periods ליד ה-p99.</blockquote>`
      }
    },
    {
      h: { en: "Sizing pools with Little's law", he: "לקבוע גודל של pools עם Little's law" },
      body: {
        en: `<p><strong>L = λ × W</strong>: items in flight = arrival rate × time each one is held. Applied to pools: <strong>pool size = throughput × hold time</strong>, plus headroom for bursts.</p>
<table>
<tr><th>Pool</th><th>Numbers</th><th>Size</th></tr>
<tr><td>DB connections per pod</td><td>500 queries/s per pod × 8 ms held (query + network)</td><td>4 busy on average → pool of 8-10</td></tr>
<tr><td>Same, during a slow-DB incident</td><td>500/s × 200 ms</td><td>100 needed → a pool of 10 queues requests; a pool of 100 × 30 pods = 3,000 connections kills Postgres (default <code>max_connections</code> = 100)</td></tr>
<tr><td>Outbound HTTP to a partner API</td><td>200 calls/s × 150 ms</td><td>30 connections in flight</td></tr>
<tr><td>Worker threads for blocking IO</td><td>300 req/s × 50 ms of blocking</td><td>15 threads</td></tr>
</table>
<p>Two lessons hide in that table. First, the pool must fit <em>the downstream</em>, not just you: total connections = pool × replicas × services, and it must stay under the DB's limit (or go through PgBouncer/RDS Proxy). HikariCP's own advice for the DB side is roughly <code>cores × 2 + spindles</code> connections on the database server, far smaller than people expect. Second, a bigger pool doesn't fix a slow dependency: it lets more requests pile onto it. Pair every pool with a short <strong>acquire timeout</strong> so callers fail fast instead of queueing.</p>
<p>Client defaults that bite:</p>
<ul>
<li>Go <code>http.Transport</code>: <code>MaxIdleConnsPerHost</code> = 2. At 30 concurrent calls, 28 connections are closed after each use and re-dialled (TLS handshake each time, TIME_WAIT pile-up). Set it to your Little's-law number.</li>
<li>Apache HttpClient 5 pooling manager: 5 per route, 25 total. A service calling one host at 30 in flight queues 25 of them.</li>
<li>Node <code>http.Agent</code>: <code>maxSockets</code> = Infinity. No queueing at all, so a slow partner gets an unbounded number of sockets from you.</li>
</ul>
<pre>// HikariCP
maximumPoolSize=10
connectionTimeout=500        # ms to wait for a connection, then fail
// Go
tr := &amp;http.Transport{MaxIdleConnsPerHost: 32, MaxConnsPerHost: 64, IdleConnTimeout: 90 * time.Second}</pre>`,
        he: `<p><strong>L = λ × W</strong>: מספר הפריטים בטיפול = קצב ההגעה × הזמן שכל אחד מוחזק. על pools זה אומר: <strong>גודל ה-pool = throughput × זמן החזקה</strong>, ועוד מרווח ל-bursts.</p>
<table>
<tr><th>Pool</th><th>מספרים</th><th>גודל</th></tr>
<tr><td>חיבורי DB לכל Pod</td><td>500 queries בשנייה ל-Pod × 8 ms החזקה (query ועוד רשת)</td><td>4 תפוסים בממוצע, כלומר pool של 8-10</td></tr>
<tr><td>אותו דבר, בזמן תקלה של DB איטי</td><td>500 בשנייה × 200 ms</td><td>צריך 100. ‏pool של 10 שם requests בתור; pool של 100 כפול 30 Pods זה 3,000 חיבורים שמפילים את Postgres (ברירת המחדל של <code>max_connections</code> היא 100)</td></tr>
<tr><td>HTTP יוצא ל-API של שותף</td><td>200 קריאות בשנייה × 150 ms</td><td>30 חיבורים בטיפול</td></tr>
<tr><td>Worker threads ל-IO חוסם</td><td>300 requests בשנייה × 50 ms חסימה</td><td>15 threads</td></tr>
</table>
<p>בטבלה הזו מסתתרים שני שיעורים. ראשון: ה-pool צריך להתאים <em>ל-downstream</em>, לא רק לך. סך החיבורים = pool × replicas × services, והוא חייב להישאר מתחת ל-limit של ה-DB (או לעבור דרך PgBouncer או RDS Proxy). ההמלצה של HikariCP עצמה לצד ה-DB היא בערך <code>cores × 2 + spindles</code> חיבורים על שרת ה-DB, הרבה פחות ממה שאנשים מצפים. שני: pool גדול יותר לא מתקן תלות איטית, הוא רק נותן ליותר requests להיערם עליה. תצמיד לכל pool ‏<strong>acquire timeout</strong> קצר, כדי שה-callers ייכשלו מהר במקום לחכות בתור.</p>
<p>ברירות מחדל של clients שנושכות:</p>
<ul>
<li>ב-Go, ‏<code>http.Transport</code>: ‏<code>MaxIdleConnsPerHost</code> הוא 2. עם 30 קריאות במקביל, 28 חיבורים נסגרים אחרי כל שימוש ונפתחים מחדש (TLS handshake כל פעם, והצטברות של TIME_WAIT). תקבע אותו למספר שיוצא מ-Little's law.</li>
<li>ב-Apache HttpClient 5, ה-pooling manager נותן 5 לכל route ו-25 בסך הכל. שירות שקורא ל-host אחד עם 30 בטיפול שם 25 מהם בתור.</li>
<li>ב-Node, ‏<code>http.Agent</code>: ‏<code>maxSockets</code> הוא Infinity. אין תור בכלל, אז שותף איטי מקבל ממך מספר לא מוגבל של sockets.</li>
</ul>
<pre>// HikariCP
maximumPoolSize=10
connectionTimeout=500        # ms to wait for a connection, then fail
// Go
tr := &amp;http.Transport{MaxIdleConnsPerHost: 32, MaxConnsPerHost: 64, IdleConnTimeout: 90 * time.Second}</pre>`
      }
    },
    {
      h: { en: "Pool exhaustion as a cascading failure, and bulkheads", he: "מיצוי pool כ-cascading failure, ו-bulkheads" },
      body: {
        en: `<p>The pattern: service A has one shared pool of 200 request threads. Dependency C (say, a recommendations API) slows from 50 ms to 5 s. By Little's law, 40 req/s to C now needs 200 threads, so within seconds <em>every</em> thread in A is waiting on C. Requests that never touch C (login, checkout) can't get a thread either. A's health check times out, Kubernetes restarts A, the restarted pods receive the full load cold, and A's callers start piling up the same way. CPU is low across the board; everything is waiting.</p>
<pre>  callers ──▶ [ A: 200 threads ] ──▶ C (slow: 5 s)
               ████████████████  all 200 blocked on C
               login / checkout  → no thread → timeout → caller retries (×3 load)</pre>
<p><strong>Bulkheads</strong> (ship compartments) cap how much of A any one dependency can hold:</p>
<ul>
<li>Separate pool or semaphore per dependency: C gets at most 20 concurrent calls; call 21 fails immediately with a fallback (empty recommendations).</li>
<li>Separate connection pools per downstream and per traffic class (user traffic vs batch jobs on the same DB).</li>
<li>At the platform level: separate deployments for critical and non-critical endpoints, per-tenant queues.</li>
<li>Combine with timeouts shorter than the caller's, circuit breakers, and retries with budgets so the bulkhead isn't refilled by retries.</li>
</ul>
<pre>// Go: a 20-slot bulkhead around one dependency
var recSem = make(chan struct{}, 20)
func getRecs(ctx context.Context) ([]Item, error) {
    select {
    case recSem &lt;- struct{}{}:
        defer func() { &lt;-recSem }()
    default:
        return nil, ErrBulkheadFull // fail fast, caller shows a fallback
    }
    ctx, cancel := context.WithTimeout(ctx, 300*time.Millisecond)
    defer cancel()
    return recClient.Get(ctx)
}</pre>`,
        he: `<p>התבנית: לשירות A יש pool משותף אחד של 200 threads ל-requests. התלות C (נגיד API של המלצות) מאטה מ-50 ms ל-5 שניות. לפי Little's law, ‏40 requests בשנייה ל-C צריכים עכשיו 200 threads, אז תוך שניות <em>כל</em> ה-threads של A מחכים ל-C. גם requests שלא נוגעים ב-C בכלל (login, checkout) לא מקבלים thread. ה-health check של A עושה timeout, ‏Kubernetes מפעיל את A מחדש, ה-Pods החדשים מקבלים את כל העומס כשהם קרים, וה-callers של A מתחילים להיערם באותה צורה. ה-CPU נמוך בכל מקום, כולם פשוט מחכים.</p>
<pre>  callers ──▶ [ A: 200 threads ] ──▶ C (slow: 5 s)
               ████████████████  all 200 blocked on C
               login / checkout  → no thread → timeout → caller retries (×3 load)</pre>
<p><strong>Bulkheads</strong> (התאים האטומים של אונייה) מגבילים כמה מ-A כל תלות יכולה לתפוס:</p>
<ul>
<li>Pool או semaphore נפרד לכל תלות: ‏C מקבל לכל היותר 20 קריאות במקביל; קריאה מספר 21 נכשלת מיד עם fallback (רשימת המלצות ריקה).</li>
<li>Connection pools נפרדים לכל downstream ולכל סוג תעבורה (תעבורת משתמשים מול batch jobs על אותו DB).</li>
<li>ברמת הפלטפורמה: deployments נפרדים ל-endpoints קריטיים ולא קריטיים, ותורים נפרדים לכל tenant.</li>
<li>לשלב עם timeouts קצרים יותר משל ה-caller, ‏circuit breakers, ו-retries עם תקציב, כדי שה-retries לא ימלאו את ה-bulkhead מחדש.</li>
</ul>
<pre>// Go: a 20-slot bulkhead around one dependency
var recSem = make(chan struct{}, 20)
func getRecs(ctx context.Context) ([]Item, error) {
    select {
    case recSem &lt;- struct{}{}:
        defer func() { &lt;-recSem }()
    default:
        return nil, ErrBulkheadFull // fail fast, caller shows a fallback
    }
    ctx, cancel := context.WithTimeout(ctx, 300*time.Millisecond)
    defer cancel()
    return recClient.Get(ctx)
}</pre>`
      }
    }
  ],
  diagram: `node: 64 cores    pod: cpu limit 2  ->  cpu.max = 200000 100000

runtime sees 64 -> 64 threads busy
|<-12.5ms run->|<---------- 87.5 ms THROTTLED ---------->|  per 100 ms period
                 request arrives here -> waits ~87 ms

runtime sized to 2 -> 2 threads busy
|<------------------- 100 ms running ---------------------->|

pool size = throughput x hold time      (Little's law)
A [200 shared threads] --> C slow  => all threads stuck => A dies
A [C: 20 | DB: 30 | rest]          => only C's slice is stuck (bulkhead)`,
  handsOn: [
    { cmd: "kubectl exec deploy/api -- sh -c 'nproc; cat /sys/fs/cgroup/cpu.max; cat /sys/fs/cgroup/cpu.stat'", what: { en: "Compare the CPUs the process can see with the quota it actually gets, and check nr_throttled / throttled_usec.", he: "תשווה בין ה-CPUs שה-process רואה לבין ה-quota שהוא באמת מקבל, ותבדוק את nr_throttled ואת throttled_usec." } },
    { cmd: "kubectl top pod -n prod --containers", what: { en: "Average CPU per container. Low numbers here plus high throttling in cpu.stat means bursty, over-threaded work, not lack of CPU.", he: "CPU ממוצע לכל container. מספרים נמוכים כאן יחד עם throttling גבוה ב-cpu.stat אומרים עבודה עם bursts ויותר מדי threads, לא חוסר ב-CPU." } },
    { cmd: "sum by (pod) (rate(container_cpu_cfs_throttled_periods_total{namespace=\"prod\"}[5m])) / sum by (pod) (rate(container_cpu_cfs_periods_total{namespace=\"prod\"}[5m]))", what: { en: "PromQL: fraction of 100 ms periods in which each pod was throttled. Put it next to p99 latency on the same dashboard.", he: "PromQL: איזה חלק מה-periods של 100 ms כל Pod היה throttled. תשים את זה ליד ה-p99 latency באותו dashboard." } },
    { cmd: "kubectl exec deploy/api -- jcmd 1 VM.flags", what: { en: "See how the JVM sized itself: ActiveProcessorCount, ParallelGCThreads, ConcGCThreads and which GC it picked.", he: "תראה איך ה-JVM קבע את עצמו: ActiveProcessorCount, ‏ParallelGCThreads, ‏ConcGCThreads ואיזה GC הוא בחר." } },
    { cmd: "dotnet-counters monitor -n MyApi --counters System.Runtime", what: { en: "Watch ThreadPool Queue Length and Thread Count. A growing queue with low CPU is thread-pool starvation.", he: "תעקוב אחרי ThreadPool Queue Length ו-Thread Count. תור שגדל עם CPU נמוך זה thread-pool starvation." } }
  ],
  mnemonic: {
    en: "\"Sees 64, paid for 2\": size threads to the limit, size pools to λ×W, and give every dependency its own compartment.",
    he: "\"רואה 64, משלם על 2\": threads לפי ה-limit, ‏pools לפי λ×W, ולכל תלות תא משלה."
  },
  pitfalls: [
    { en: "Trusting average CPU. CFS quota is enforced per 100 ms, so a pod at 30% average can be throttled in a quarter of its periods. Watch nr_throttled and the throttled-periods ratio, not just kubectl top.", he: "לסמוך על CPU ממוצע. ה-CFS quota נאכף כל 100 ms, אז Pod עם 30% בממוצע יכול להיות throttled ברבע מה-periods. תסתכל על nr_throttled ועל היחס של throttled periods, לא רק על kubectl top." },
    { en: "Sizing worker counts from os.cpu_count(), nproc or Runtime.availableProcessors() on old runtimes. They return the node's cores: 129 Gunicorn workers or 64 Go Ps on a 2-CPU pod means OOMKills and throttling. Set counts explicitly from the limit.", he: "לקבוע מספר workers לפי os.cpu_count(), ‏nproc או Runtime.availableProcessors() ב-runtimes ישנים. הם מחזירים את ה-cores של ה-node: ‏129 workers של Gunicorn או 64 Ps של Go על Pod של 2 CPUs זה OOMKills ו-throttling. תקבע את המספרים במפורש לפי ה-limit." },
    { en: "Raising the pool size during a slow-dependency incident. More connections or threads just put more load on the struggling dependency and multiply connections by replicas. Shorten acquire timeouts and shed load instead.", he: "להגדיל את ה-pool בזמן תקלה של תלות איטית. יותר חיבורים או threads רק מעמיסים עוד על התלות שכבר מתקשה, ומכפילים חיבורים כפול replicas. במקום זה תקצר את ה-acquire timeouts ותוריד עומס." },
    { en: "Blocking inside shared async pools: a blocking call in CompletableFuture.supplyAsync (common pool = CPUs − 1), .Result in ASP.NET, or slow bcrypt in Node's 4-thread libuv pool starves unrelated work in the same process.", he: "חסימה בתוך pools אסינכרוניים משותפים: קריאה חוסמת בתוך CompletableFuture.supplyAsync (ה-common pool הוא CPUs פחות 1), ‏.Result ב-ASP.NET, או bcrypt איטי ב-pool של 4 threads של libuv ב-Node מרעיבים עבודה לא קשורה באותו process." }
  ],
  interview: [
    {
      q: { en: "A Go service's p99 went from 40 ms to 300 ms after moving from 8-core to 64-core nodes. CPU limit unchanged at 2, average CPU 35%. What happened?", he: "ה-p99 של שירות Go קפץ מ-40 ms ל-300 ms אחרי מעבר מ-nodes של 8 cores ל-nodes של 64 cores. ה-CPU limit לא השתנה (2), ה-CPU הממוצע 35%. מה קרה?" },
      a: { en: "On a Go version older than 1.25 without automaxprocs, GOMAXPROCS followed the node: it went from 8 to 64. With a 200 ms-per-100 ms quota, 64 runnable threads (plus GC workers at 25% of GOMAXPROCS) burn the budget in a few ms and the pod is frozen for the rest of each period, which shows up as tail latency while the average looks fine. Confirm with cpu.stat nr_throttled and the throttled-periods PromQL ratio. Fix: upgrade to Go 1.25+ or import automaxprocs (or set GOMAXPROCS=2), and consider removing the CPU limit for latency-critical services while keeping the request.", he: "בגרסת Go ישנה מ-1.25 בלי automaxprocs, ‏GOMAXPROCS הלך לפי ה-node: הוא עלה מ-8 ל-64. עם quota של 200 ms לכל 100 ms, ‏64 threads שמוכנים לרוץ (ועוד workers של GC שהם 25% מ-GOMAXPROCS) שורפים את התקציב תוך כמה מילישניות, וה-Pod קפוא בשאר ה-period. זה נראה כמו tail latency בזמן שהממוצע נראה תקין. מאמתים עם nr_throttled ב-cpu.stat ועם יחס ה-throttled periods ב-PromQL. התיקון: לשדרג ל-Go 1.25 ומעלה או להוסיף automaxprocs (או GOMAXPROCS=2), ולשקול להוריד את ה-CPU limit לשירותים רגישים ל-latency ולהשאיר את ה-request." }
    },
    {
      q: { en: "How do you size a DB connection pool for 30 replicas doing 400 queries/s each at 10 ms per query, against a Postgres with max_connections=500?", he: "איך תקבע גודל של DB connection pool ל-30 replicas, שכל אחד עושה 400 queries בשנייה ב-10 ms ל-query, מול Postgres עם max_connections=500?" },
      a: { en: "Little's law per pod: 400 × 0.010 = 4 connections busy on average; with burst headroom, 8. Total = 8 × 30 = 240, under 500 with room for deploy surges (old and new pods at once can double it to 480, so either cap at 6-8 or use maxSurge carefully) and for admin connections. If you need more replicas, put PgBouncer in transaction mode in front instead of growing pools. Add a short acquire timeout (e.g. 500 ms) so a slow DB produces fast errors rather than a pile-up, and alert on pool wait time.", he: "Little's law לכל Pod: ‏400 × 0.010 = 4 חיבורים תפוסים בממוצע; עם מרווח ל-bursts, 8. סך הכל 8 × 30 = 240, מתחת ל-500, עם מקום ל-deploy (Pods ישנים וחדשים יחד יכולים להכפיל ל-480, אז או להגביל ל-6-8 או להיזהר עם maxSurge) ולחיבורי admin. אם צריך עוד replicas, שמים PgBouncer ב-transaction mode מלפנים במקום להגדיל pools. מוסיפים acquire timeout קצר (למשל 500 ms) כדי ש-DB איטי ייצר שגיאות מהירות ולא ערימה, ומתריעים על זמן ההמתנה ל-pool." }
    },
    {
      q: { en: "An ASP.NET Core API shows 3% CPU but 20-second latencies under a traffic spike, and recovers slowly afterwards. Diagnosis?", he: "API של ASP.NET Core מראה 3% CPU אבל latency של 20 שניות בזמן קפיצת תעבורה, ומתאושש לאט אחרי זה. מה האבחנה?" },
      a: { en: "Thread-pool starvation, almost always from sync-over-async (.Result/.Wait()) or other blocking on pool threads. All threads are blocked, the pool only injects one or two per second above the minimum, and the work queue grows. dotnet-counters shows a rising ThreadPool Queue Length and slowly climbing thread count with idle CPU; a dump (dotnet-stack or dotnet-dump) shows many threads in Task.Wait. Fix by making the call path async end-to-end; SetMinThreads is a temporary mitigation.", he: "Thread-pool starvation, כמעט תמיד מ-sync-over-async ‏(.Result או .Wait()) או מחסימה אחרת על threads של ה-pool. כל ה-threads חסומים, מעל המינימום ה-pool מוסיף רק thread או שניים בשנייה, ותור העבודה גדל. ‏dotnet-counters מראה ThreadPool Queue Length שעולה ומספר threads שמטפס לאט עם CPU פנוי; dump ‏(dotnet-stack או dotnet-dump) מראה הרבה threads בתוך Task.Wait. התיקון: להפוך את כל המסלול ל-async מקצה לקצה. SetMinThreads הוא פלסטר זמני." }
    }
  ],
  quiz: [
    {
      q: { en: "A pod has a 2-CPU limit (cpu.max 200000 100000) and 16 threads become busy at the start of a period. Roughly how long is the pod throttled in that period?", he: "ל-Pod יש limit של 2 CPUs ‏(cpu.max 200000 100000), ו-16 threads נהיים עסוקים בתחילת period. בערך כמה זמן ה-Pod יהיה throttled ב-period הזה?" },
      options: [
        { en: "0 ms: 16 threads fit in 64 cores", he: "0 ms: ‏16 threads נכנסים ב-64 cores" },
        { en: "About 12.5 ms", he: "בערך 12.5 ms" },
        { en: "About 87.5 ms", he: "בערך 87.5 ms" },
        { en: "Exactly 50 ms", he: "בדיוק 50 ms" }
      ],
      answer: 2,
      explain: { en: "200 ms of budget / 16 ms burned per wall-ms = 12.5 ms of running, then 87.5 ms throttled until the next period.", he: "200 ms תקציב חלקי 16 ms שנשרפים בכל מילישנייה = 12.5 ms ריצה, ואז 87.5 ms של throttling עד ה-period הבא." }
    },
    {
      q: { en: "Which Node.js operation does NOT go through the libuv threadpool (UV_THREADPOOL_SIZE)?", he: "איזו פעולה ב-Node.js לא עוברת דרך ה-threadpool של libuv ‏(UV_THREADPOOL_SIZE)?" },
      options: [
        { en: "Reading from a TCP socket", he: "קריאה מ-TCP socket" },
        { en: "dns.lookup()", he: "dns.lookup()" },
        { en: "fs.readFile()", he: "fs.readFile()" },
        { en: "crypto.pbkdf2()", he: "crypto.pbkdf2()" }
      ],
      answer: 0,
      explain: { en: "Network sockets are non-blocking and use epoll/kqueue directly. dns.lookup (getaddrinfo), fs and CPU-heavy crypto run on the 4-thread pool and compete with each other.", he: "Sockets של רשת הם non-blocking ומשתמשים ישירות ב-epoll או kqueue. ‏dns.lookup ‏(getaddrinfo), ‏fs ו-crypto כבד רצים על ה-pool של 4 threads ומתחרים זה בזה." }
    },
    {
      q: { en: "Each pod handles 300 requests/s and holds an outbound HTTP connection for 100 ms per request. Using Little's law, how many connections are in flight per pod on average?", he: "כל Pod מטפל ב-300 requests בשנייה ומחזיק חיבור HTTP יוצא 100 ms לכל request. לפי Little's law, כמה חיבורים בטיפול יש ל-Pod בממוצע?" },
      options: [
        { en: "3", he: "3" },
        { en: "3,000", he: "3,000" },
        { en: "300", he: "300" },
        { en: "30", he: "30" }
      ],
      answer: 3,
      explain: { en: "L = λ × W = 300/s × 0.1 s = 30. Note Go's default MaxIdleConnsPerHost of 2 would force most of them to reconnect every time.", he: "L = λ × W = 300 בשנייה × 0.1 s = 30. שים לב שברירת המחדל של Go, ‏MaxIdleConnsPerHost של 2, תכריח את רובם להתחבר מחדש כל פעם." }
    },
    {
      q: { en: "What is the main purpose of a bulkhead around a dependency?", he: "מה המטרה העיקרית של bulkhead סביב תלות?" },
      options: [
        { en: "Retry failed calls until they succeed", he: "לנסות שוב קריאות שנכשלו עד שהן מצליחות" },
        { en: "Cap the threads/connections that one dependency can hold so a slow dependency can't starve unrelated requests", he: "להגביל כמה threads או חיבורים תלות אחת יכולה לתפוס, כדי שתלות איטית לא תרעיב requests לא קשורים" },
        { en: "Cache the dependency's responses", he: "לשמור ב-cache את התשובות של התלות" },
        { en: "Increase the shared pool so there are always spare threads", he: "להגדיל את ה-pool המשותף כדי שתמיד יהיו threads פנויים" }
      ],
      answer: 1,
      explain: { en: "A bulkhead isolates capacity per dependency. When C is slow only C's 20 slots fill; login and checkout keep their threads.", he: "Bulkhead מפריד קיבולת לכל תלות. כש-C איטי, רק 20 המקומות של C מתמלאים, ו-login ו-checkout שומרים על ה-threads שלהם." }
    }
  ],
  playground: "resources",
  related: ["pr-concurrency-parallelism", "pr-event-loop", "pr-async-await", "cpu", "k8s-resources", "linux-cgroups-v2", "linux-epoll-iouring", "pr-garbage-collection", "jvm-dotnet-go-web", "pr-third-party-deps", "arch-resilience"]
});

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "atomics-optimistic-concurrency",
  track: "principal",
  order: 61,
  icon: "⚛️",
  level: 3,
  minutes: 16,
  title: { en: "Atomics, CAS and Optimistic Concurrency: from CPU to Kubernetes", he: "Atomics, ‏CAS ו-optimistic concurrency: מה-CPU ועד Kubernetes" },
  tldr: {
    en: "Compare-and-swap means \"change it only if it's still what I read\". The CPU does it on one cache line with LOCK CMPXCHG; Postgres does it with WHERE version = 7; HTTP with If-Match; DynamoDB with a condition expression; Kubernetes with resourceVersion and a 409. Same idea, same rule: on conflict, re-read and retry. Choose pessimistic locks when conflicts are common or the work can't be redone.",
    he: "Compare-and-swap אומר \"תשנה רק אם זה עדיין מה שקראתי\". ה-CPU עושה את זה על cache line אחד עם LOCK CMPXCHG; ‏Postgres עושה את זה עם WHERE version = 7; ‏HTTP עם If-Match; ‏DynamoDB עם condition expression; ‏Kubernetes עם resourceVersion ו-409. אותו רעיון ואותו כלל: כשיש conflict, קוראים מחדש ומנסים שוב. בוחרים ב-locks פסימיים כש-conflicts נפוצים או כשאי אפשר לעשות את העבודה מחדש."
  },
  analogy: {
    en: "Two people edit the same shared spreadsheet cell. The pessimistic way: put a sticky note \"I'm editing\" and everyone else waits. The optimistic way: everyone edits freely, but when you save, the sheet checks \"is the cell still the value you started from?\" If not, you get \"someone changed this, reload\" and you redo your edit on the new value. The optimistic way is faster when people rarely collide, and miserable when everyone edits the same cell all day.",
    he: "שני אנשים עורכים את אותו תא בגיליון משותף. הדרך הפסימית: שמים פתק \"אני עורך\" וכל השאר מחכים. הדרך האופטימית: כולם עורכים חופשי, אבל כששומרים, הגיליון בודק \"האם התא עדיין בערך שממנו התחלת?\" אם לא, מקבלים \"מישהו שינה את זה, תטען מחדש\" ועושים את העריכה שוב על הערך החדש. הדרך האופטימית מהירה כשאנשים כמעט לא מתנגשים, וסיוט כשכולם עורכים את אותו תא כל היום."
  },
  sections: [
    {
      h: { en: "Memory models: why done = true can loop forever", he: "Memory models: למה done = true יכול להיתקע בלולאה לנצח" },
      body: {
        en: `<p>Without synchronization, nothing guarantees that a write by one thread is ever <em>seen</em> by another, or seen in the order it was written. Three layers reorder: the <strong>compiler/JIT</strong> (hoists a read out of a loop), the <strong>CPU</strong> (store buffers, out-of-order execution), and <strong>caches</strong>. x86 is fairly strict (TSO: only a store followed by a load to a different address can be reordered); ARM, including Graviton and Apple silicon, reorders much more. Code that "worked for years" on x86 can break on arm64 nodes.</p>
<pre>// Java: may never terminate
class Worker {
    boolean done = false;                 // plain field
    void run() { while (!done) { } }      // JIT may hoist: if (!done) while (true) {}
    void stop() { done = true; }
}
// Fix: volatile boolean done;   (or AtomicBoolean)</pre>
<pre>// Go: a data race; the compiler may compile the loop as an infinite loop
var done bool
go func() { for !done { } }()
done = true
// Fix: var done atomic.Bool;  for !done.Load() {};  done.Store(true)
// 'go test -race' reports the original version</pre>
<pre>// C#: same story
while (!_done) { }                        // may be hoisted by the JIT
// Fix: volatile bool _done;  or  while (!Volatile.Read(ref _done)) { }</pre>
<p>The rule that makes concurrent code reasonable is <strong>happens-before</strong>: if write W happens-before read R, R sees W (and everything before W). You create happens-before edges with synchronization: unlocking a mutex happens-before the next lock of it; a <code>volatile</code>/atomic write happens-before a read that observes it; a channel send happens-before the matching receive; starting a thread happens-before its first action. No edge = data race = in Java and Go, surprising values; in C/C++ and Rust <code>unsafe</code>, undefined behaviour.</p>
<blockquote>💡 Real world: the classic victim is double-checked locking for a lazy singleton without <code>volatile</code>. Another thread can see a non-null reference to an object whose constructor writes aren't visible yet.</blockquote>`,
        he: `<p>בלי סנכרון, שום דבר לא מבטיח שכתיבה של thread אחד בכלל <em>תיראה</em> ל-thread אחר, או שתיראה בסדר שבו היא נכתבה. שלוש שכבות משנות סדר: ה-<strong>compiler או ה-JIT</strong> (מוציאים קריאה אל מחוץ ללולאה), ה-<strong>CPU</strong> (store buffers, ביצוע out-of-order), וה-<strong>caches</strong>. ‏x86 די קפדני (TSO: רק store ואחריו load לכתובת אחרת יכולים להתחלף); ‏ARM, כולל Graviton ו-Apple silicon, משנה סדר הרבה יותר. קוד ש"עבד שנים" על x86 יכול להישבר על nodes של arm64.</p>
<pre>// Java: may never terminate
class Worker {
    boolean done = false;                 // plain field
    void run() { while (!done) { } }      // JIT may hoist: if (!done) while (true) {}
    void stop() { done = true; }
}
// Fix: volatile boolean done;   (or AtomicBoolean)</pre>
<pre>// Go: a data race; the compiler may compile the loop as an infinite loop
var done bool
go func() { for !done { } }()
done = true
// Fix: var done atomic.Bool;  for !done.Load() {};  done.Store(true)
// 'go test -race' reports the original version</pre>
<pre>// C#: same story
while (!_done) { }                        // may be hoisted by the JIT
// Fix: volatile bool _done;  or  while (!Volatile.Read(ref _done)) { }</pre>
<p>הכלל שהופך קוד מקבילי לניתן להבנה הוא <strong>happens-before</strong>: אם כתיבה W קורית לפני קריאה R במובן הזה, ‏R רואה את W (ואת כל מה שקרה לפני W). את הקשתות האלה יוצרים עם סנכרון: unlock של mutex קורה לפני ה-lock הבא שלו; כתיבה ל-<code>volatile</code> או ל-atomic קורית לפני קריאה שרואה אותה; שליחה ל-channel קורית לפני הקבלה שמתאימה לה; הפעלת thread קורית לפני הפעולה הראשונה שלו. אין קשת? זה data race. ב-Java וב-Go מקבלים ערכים מפתיעים; ב-C/C++ ובקוד <code>unsafe</code> של Rust זה undefined behaviour.</p>
<blockquote>💡 Real world: הקורבן הקלאסי הוא double-checked locking ל-singleton עצל בלי <code>volatile</code>. ‏thread אחר יכול לראות reference שאינו null לאובייקט שהכתיבות של ה-constructor שלו עוד לא נראות.</blockquote>`
      }
    },
    {
      h: { en: "Atomics and the CAS loop, and the ABA problem", he: "Atomics, לולאת CAS ובעיית ABA" },
      body: {
        en: `<p>An <strong>atomic</strong> operation is indivisible and comes with visibility guarantees. The building block is <strong>compare-and-swap</strong>: "if the value is still <code>old</code>, set it to <code>new</code>, and tell me whether it worked". On x86 it's <code>LOCK CMPXCHG</code>; on ARMv8.1+ it's <code>CAS</code> (older ARM used LL/SC). Everything else (increment, max, push onto a lock-free stack) is a <strong>CAS loop</strong>: read, compute, try to swap, retry if someone beat you.</p>
<pre>// Go: lock-free "record the max latency seen"
var maxLat atomic.Int64
func observe(v int64) {
    for {
        cur := maxLat.Load()
        if v &lt;= cur || maxLat.CompareAndSwap(cur, v) {
            return
        }   // lost the race: reload and retry
    }
}</pre>
<pre>// Java
AtomicLong max = new AtomicLong();
max.accumulateAndGet(v, Math::max);       // the CAS loop, built in
LongAdder hits = new LongAdder();          // striped counter for heavy contention
hits.increment();  long total = hits.sum();</pre>
<pre>// C#
long _max;
long cur;
do { cur = Volatile.Read(ref _max); if (v &lt;= cur) break; }
while (Interlocked.CompareExchange(ref _max, v, cur) != cur);
Interlocked.Increment(ref _hits);</pre>
<p>Cost: an uncontended atomic on a modern core is a few nanoseconds. Under contention the cache line ping-pongs between cores and each operation can cost 100 ns or more, so 32 threads hammering one counter can be <em>slower</em> than one thread. That is why <code>LongAdder</code> stripes the counter across cells, and why per-core or per-goroutine counters merged later win.</p>
<p><strong>ABA</strong>: thread 1 reads top-of-stack = A, gets paused; thread 2 pops A, pops B, pushes A back. Thread 1's CAS(A → B) succeeds because the pointer is A again, but B is gone: the stack is corrupted. Fixes: pair the pointer with a version counter (Java <code>AtomicStampedReference</code>, 128-bit <code>CMPXCHG16B</code>), hazard pointers, or epoch-based reclamation. In GC languages ABA on pointers is much rarer, because a node can't be freed and reused while you still hold a reference to it; it bites in C/C++ and with recycled object pools. The same bug at system scale: a version that can go back to an old value (a status flipping READY → BUSY → READY) is not a safe CAS token; use a counter that only increases.</p>`,
        he: `<p>פעולה <strong>atomic</strong> היא בלתי ניתנת לחלוקה ומגיעה עם הבטחות visibility. אבן הבניין היא <strong>compare-and-swap</strong>: "אם הערך עדיין <code>old</code>, תשנה אותו ל-<code>new</code>, ותגיד לי אם זה הצליח". ב-x86 זה <code>LOCK CMPXCHG</code>; ב-ARMv8.1 ומעלה זה <code>CAS</code> (ב-ARM ישן השתמשו ב-LL/SC). כל השאר (increment, ‏max, ‏push למחסנית lock-free) הוא <strong>לולאת CAS</strong>: קוראים, מחשבים, מנסים להחליף, ואם מישהו הקדים אותך, מנסים שוב.</p>
<pre>// Go: lock-free "record the max latency seen"
var maxLat atomic.Int64
func observe(v int64) {
    for {
        cur := maxLat.Load()
        if v &lt;= cur || maxLat.CompareAndSwap(cur, v) {
            return
        }   // lost the race: reload and retry
    }
}</pre>
<pre>// Java
AtomicLong max = new AtomicLong();
max.accumulateAndGet(v, Math::max);       // the CAS loop, built in
LongAdder hits = new LongAdder();          // striped counter for heavy contention
hits.increment();  long total = hits.sum();</pre>
<pre>// C#
long _max;
long cur;
do { cur = Volatile.Read(ref _max); if (v &lt;= cur) break; }
while (Interlocked.CompareExchange(ref _max, v, cur) != cur);
Interlocked.Increment(ref _hits);</pre>
<p>עלות: atomic בלי תחרות על core מודרני לוקח כמה ננו-שניות. תחת תחרות ה-cache line קופץ בין cores, וכל פעולה יכולה לעלות 100 ns ויותר. לכן 32 threads שמפציצים מונה אחד יכולים להיות <em>איטיים</em> יותר מ-thread אחד. בגלל זה <code>LongAdder</code> מפצל את המונה לכמה תאים, ובגלל זה מונים לכל core או לכל goroutine שמתמזגים בסוף מנצחים.</p>
<p><strong>ABA</strong>: ‏thread 1 קורא שראש המחסנית הוא A ומושהה. ‏thread 2 מוציא את A, מוציא את B, ומחזיר את A. ה-CAS של thread 1 ‏(A → B) מצליח כי המצביע שוב A, אבל B כבר לא קיים: המחסנית נהרסה. פתרונות: לצמד למצביע מונה גרסה (<code>AtomicStampedReference</code> ב-Java, ‏<code>CMPXCHG16B</code> של 128 ביט), ‏hazard pointers, או epoch-based reclamation. בשפות עם GC בעיית ABA על מצביעים נדירה הרבה יותר, כי אי אפשר לשחרר node ולמחזר אותו כל עוד מחזיקים אליו reference. היא נושכת ב-C/C++ וב-object pools ממוחזרים. אותו באג בקנה מידה של מערכת: גרסה שיכולה לחזור לערך ישן (סטטוס שעובר READY → BUSY → READY) היא לא token בטוח ל-CAS. תשתמש במונה שרק עולה.</p>`
      }
    },
    {
      h: { en: "Lock-free, wait-free, false sharing, and when not to bother", he: "מתי לא להתאמץ: lock-free, wait-free ו-false sharing" },
      body: {
        en: `<table>
<tr><th>Guarantee</th><th>Meaning</th><th>Example</th></tr>
<tr><td>Blocking</td><td>A paused lock holder can stop everyone</td><td><code>sync.Mutex</code>, <code>synchronized</code></td></tr>
<tr><td>Lock-free</td><td>Some thread always makes progress; an individual thread may retry forever</td><td>CAS-loop stack/queue, <code>ConcurrentLinkedQueue</code></td></tr>
<tr><td>Wait-free</td><td>Every thread finishes in a bounded number of steps</td><td>Single <code>fetch_add</code> on hardware that supports it (<code>LOCK XADD</code>); some specialised queues</td></tr>
</table>
<p><strong>False sharing</strong>: CPUs move memory in 64-byte cache lines (128 bytes on Apple M-series; Intel also prefetches adjacent pairs). Two atomics updated by different cores but living in the same line cause the line to bounce as if they were one variable. Pad hot per-thread fields to their own line (Java <code>@Contended</code> with <code>-XX:-RestrictContended</code>, Go <code>_ [56]byte</code> padding, C++ <code>alignas(64)</code>). The <code>memory-hierarchy</code> lesson shows the benchmark.</p>
<p><strong>When not to bother:</strong> an uncontended mutex in Go or Java costs about as much as one atomic (tens of ns). Lock-free structures are hard to get right (ABA, memory reclamation, ordering), hard to test, and only win under heavy contention on a hot path. Use the standard library's concurrent maps/queues, use a mutex for anything touching more than one variable, and reach for atomics for single counters, flags and pointers that are swapped whole (config hot reload via <code>atomic.Pointer[Config]</code>). Measure with a profiler before going lock-free.</p>`,
        he: `<table>
<tr><th>הבטחה</th><th>משמעות</th><th>דוגמה</th></tr>
<tr><td>Blocking</td><td>מי שמחזיק lock ומושהה יכול לעצור את כולם</td><td><code>sync.Mutex</code>, <code>synchronized</code></td></tr>
<tr><td>Lock-free</td><td>תמיד thread כלשהו מתקדם; thread מסוים יכול לנסות שוב לנצח</td><td>מחסנית או תור עם לולאת CAS, ‏<code>ConcurrentLinkedQueue</code></td></tr>
<tr><td>Wait-free</td><td>כל thread מסיים במספר צעדים חסום</td><td><code>fetch_add</code> בודד על חומרה שתומכת (<code>LOCK XADD</code>); כמה תורים מיוחדים</td></tr>
</table>
<p><strong>False sharing</strong>: ה-CPUs מזיזים זיכרון ב-cache lines של 64 bytes (‏128 ב-Apple M-series; ו-Intel גם עושה prefetch לזוגות סמוכים). שני atomics שמתעדכנים מ-cores שונים אבל יושבים באותה שורה גורמים לשורה לקפוץ ביניהם כאילו הם משתנה אחד. תרפד שדות חמים של כל thread לשורה משלהם (<code>@Contended</code> ב-Java עם <code>-XX:-RestrictContended</code>, ריפוד <code>_ [56]byte</code> ב-Go, ‏<code>alignas(64)</code> ב-C++). השיעור <code>memory-hierarchy</code> מראה את ה-benchmark.</p>
<p><strong>מתי לא להתאמץ:</strong> mutex בלי תחרות ב-Go או ב-Java עולה בערך כמו atomic אחד (עשרות ננו-שניות). מבנים lock-free קשה לכתוב נכון (ABA, שחרור זיכרון, סדר), קשה לבדוק, והם מנצחים רק תחת תחרות כבדה על hot path. תשתמש ב-maps ובתורים המקביליים של הספרייה הסטנדרטית, ב-mutex לכל דבר שנוגע ביותר ממשתנה אחד, וב-atomics למונים בודדים, ל-flags ולמצביעים שמוחלפים בשלמותם (hot reload של config דרך <code>atomic.Pointer[Config]</code>). תמדוד עם profiler לפני שאתה הולך על lock-free.</p>`
      }
    },
    {
      h: { en: "The same CAS at system scale: SQL, HTTP, DynamoDB, Redis", he: "אותו CAS בקנה מידה של מערכת: SQL, ‏HTTP, ‏DynamoDB, ‏Redis" },
      body: {
        en: `<p>Optimistic concurrency control (OCC) = read a value plus its version, do your work without holding a lock, then write <em>only if the version is unchanged</em>. It prevents the <strong>lost update</strong>: two admins load stock = 10, one sells 3, one sells 2, last writer wins with 8 instead of 5.</p>
<pre>-- SQL: version column (JPA @Version, EF Core [ConcurrencyCheck]/rowversion do this for you)
SELECT id, stock, version FROM items WHERE id = 42;          -- stock 10, version 7
UPDATE items SET stock = 7, version = version + 1
 WHERE id = 42 AND version = 7;
-- "UPDATE 1" = you won.  "UPDATE 0" = someone else changed it: re-read, recompute, retry
-- (or for simple counters skip OCC: UPDATE items SET stock = stock - 3 WHERE id = 42 AND stock &gt;= 3)</pre>
<pre># HTTP: ETag + If-Match
GET /api/items/42            -&gt;  200, ETag: "v7"
PUT /api/items/42  If-Match: "v7"
  -&gt; 200 (now ETag: "v8")    or   412 Precondition Failed (re-GET and retry)
PUT /api/items/43  If-None-Match: *     # create only if it doesn't exist
# APIs can return 428 Precondition Required to force clients to send If-Match.
# S3 supports both conditional headers on PutObject (since 2024).</pre>
<pre># DynamoDB conditional write
aws dynamodb update-item --table-name items --key '{"id":{"S":"42"}}' \\
  --update-expression "SET stock = :s, version = :new" \\
  --condition-expression "version = :old" \\
  --expression-attribute-values '{":s":{"N":"7"},":new":{"N":"8"},":old":{"N":"7"}}'
# loser gets ConditionalCheckFailedException (HTTP 400); retry after re-reading</pre>
<pre># Redis: WATCH = optimistic lock for a MULTI/EXEC transaction
WATCH stock:42
GET stock:42                # "10"
MULTI
SET stock:42 7
EXEC                        # (nil) if stock:42 changed after WATCH -&gt; retry
# For single-key logic prefer a Lua script/function: atomic, no retry loop</pre>
<blockquote>⚠️ Production tip: every retry loop needs a cap and jitter. Under heavy contention on one row or key, OCC degrades into a retry storm where most work is wasted; that's the signal to switch to a pessimistic lock, an atomic server-side update, or to shard the hot key.</blockquote>`,
        he: `<p>Optimistic concurrency control ‏(OCC): קוראים ערך יחד עם הגרסה שלו, עושים את העבודה בלי להחזיק lock, ואז כותבים <em>רק אם הגרסה לא השתנתה</em>. זה מונע את ה-<strong>lost update</strong>: שני admins טוענים מלאי של 10, אחד מוכר 3, השני מוכר 2, והכותב האחרון מנצח עם 8 במקום 5.</p>
<pre>-- SQL: version column (JPA @Version, EF Core [ConcurrencyCheck]/rowversion do this for you)
SELECT id, stock, version FROM items WHERE id = 42;          -- stock 10, version 7
UPDATE items SET stock = 7, version = version + 1
 WHERE id = 42 AND version = 7;
-- "UPDATE 1" = you won.  "UPDATE 0" = someone else changed it: re-read, recompute, retry
-- (or for simple counters skip OCC: UPDATE items SET stock = stock - 3 WHERE id = 42 AND stock &gt;= 3)</pre>
<pre># HTTP: ETag + If-Match
GET /api/items/42            -&gt;  200, ETag: "v7"
PUT /api/items/42  If-Match: "v7"
  -&gt; 200 (now ETag: "v8")    or   412 Precondition Failed (re-GET and retry)
PUT /api/items/43  If-None-Match: *     # create only if it doesn't exist
# APIs can return 428 Precondition Required to force clients to send If-Match.
# S3 supports both conditional headers on PutObject (since 2024).</pre>
<pre># DynamoDB conditional write
aws dynamodb update-item --table-name items --key '{"id":{"S":"42"}}' \\
  --update-expression "SET stock = :s, version = :new" \\
  --condition-expression "version = :old" \\
  --expression-attribute-values '{":s":{"N":"7"},":new":{"N":"8"},":old":{"N":"7"}}'
# loser gets ConditionalCheckFailedException (HTTP 400); retry after re-reading</pre>
<pre># Redis: WATCH = optimistic lock for a MULTI/EXEC transaction
WATCH stock:42
GET stock:42                # "10"
MULTI
SET stock:42 7
EXEC                        # (nil) if stock:42 changed after WATCH -&gt; retry
# For single-key logic prefer a Lua script/function: atomic, no retry loop</pre>
<blockquote>⚠️ Production tip: כל לולאת retry צריכה תקרה ו-jitter. תחת תחרות כבדה על שורה או key אחד, ‏OCC מתדרדר לסערת retries שבה רוב העבודה מתבזבזת. זה הסימן לעבור ל-lock פסימי, לעדכון atomic בצד השרת, או לפצל את ה-key החם.</blockquote>`
      }
    },
    {
      h: { en: "Kubernetes: resourceVersion, 409 Conflict and RetryOnConflict", he: "Kubernetes: ‏resourceVersion, ‏409 Conflict ו-RetryOnConflict" },
      body: {
        en: `<p>Every Kubernetes object carries <code>metadata.resourceVersion</code>, derived from etcd's revision. An <strong>update</strong> (PUT) sends the version you read; the API server does an etcd transaction "write only if mod_revision is still X". If someone (another controller, the HPA, kubectl) wrote in between, you get:</p>
<pre>Error from server (Conflict): Operation cannot be fulfilled on deployments.apps "web":
the object has been modified; please apply your changes to the latest version and try again
# HTTP 409, reason: Conflict</pre>
<p>Controllers see this constantly because they read from an informer cache that may be a few ms behind. The idiom is to re-GET and re-apply your mutation inside a bounded retry:</p>
<pre>import "k8s.io/client-go/util/retry"

err := retry.RetryOnConflict(retry.DefaultRetry, func() error {   // 5 tries, ~10 ms backoff + jitter
    d, err := cs.AppsV1().Deployments("prod").Get(ctx, "web", metav1.GetOptions{})
    if err != nil { return err }
    d.Spec.Replicas = ptr.To[int32](6)          // re-apply the change to the fresh copy
    _, err = cs.AppsV1().Deployments("prod").Update(ctx, d, metav1.UpdateOptions{})
    return err                                  // a 409 triggers another round
})</pre>
<ul>
<li>In controller-runtime reconcilers you usually just return the error (or <code>Requeue</code>); the next reconcile reads fresh state.</li>
<li><strong>Patches</strong> (merge, strategic, JSON) without a <code>resourceVersion</code> skip the check, so they don't conflict, but can overwrite each other on the same field. Add <code>resourceVersion</code> to the patch or a JSON-patch <code>test</code> op when you need CAS semantics.</li>
<li><strong>Server-side apply</strong> tracks field ownership: two managers setting the same field get a 409 "Apply failed with 1 conflict" naming the other manager; you resolve with <code>--force-conflicts</code> or by giving up the field.</li>
<li>Leader election is CAS too: candidates update the <code>Lease</code> object with its last resourceVersion; exactly one write wins.</li>
</ul>`,
        he: `<p>לכל אובייקט ב-Kubernetes יש <code>metadata.resourceVersion</code>, שנגזר מה-revision של etcd. ‏<strong>update</strong> ‏(PUT) שולח את הגרסה שקראת; ה-API server מבצע transaction ב-etcd: "תכתוב רק אם ה-mod_revision עדיין X". אם מישהו (controller אחר, ה-HPA, ‏kubectl) כתב באמצע, מקבלים:</p>
<pre>Error from server (Conflict): Operation cannot be fulfilled on deployments.apps "web":
the object has been modified; please apply your changes to the latest version and try again
# HTTP 409, reason: Conflict</pre>
<p>Controllers נתקלים בזה כל הזמן, כי הם קוראים מ-informer cache שיכול לפגר בכמה מילישניות. הדרך המקובלת היא GET מחדש והחלה מחדש של השינוי בתוך retry מוגבל:</p>
<pre>import "k8s.io/client-go/util/retry"

err := retry.RetryOnConflict(retry.DefaultRetry, func() error {   // 5 tries, ~10 ms backoff + jitter
    d, err := cs.AppsV1().Deployments("prod").Get(ctx, "web", metav1.GetOptions{})
    if err != nil { return err }
    d.Spec.Replicas = ptr.To[int32](6)          // re-apply the change to the fresh copy
    _, err = cs.AppsV1().Deployments("prod").Update(ctx, d, metav1.UpdateOptions{})
    return err                                  // a 409 triggers another round
})</pre>
<ul>
<li>ב-reconcilers של controller-runtime בדרך כלל פשוט מחזירים את השגיאה (או <code>Requeue</code>), וה-reconcile הבא קורא state טרי.</li>
<li><strong>Patches</strong> ‏(merge, ‏strategic, ‏JSON) בלי <code>resourceVersion</code> מדלגים על הבדיקה. לכן אין להם conflicts, אבל הם יכולים לדרוס זה את זה על אותו שדה. כשצריך סמנטיקה של CAS, תוסיף <code>resourceVersion</code> ל-patch או פעולת <code>test</code> ב-JSON patch.</li>
<li><strong>Server-side apply</strong> עוקב אחרי בעלות על שדות: שני managers שקובעים את אותו שדה מקבלים 409 עם "Apply failed with 1 conflict" ושם ה-manager השני. פותרים עם <code>--force-conflicts</code> או בוויתור על השדה.</li>
<li>גם leader election הוא CAS: המועמדים מעדכנים את אובייקט ה-<code>Lease</code> עם ה-resourceVersion האחרון שלו, ורק כתיבה אחת מנצחת.</li>
</ul>`
      }
    },
    {
      h: { en: "Pessimistic for contrast: Terraform state locks, SELECT FOR UPDATE, and how to choose", he: "פסימי לשם השוואה: נעילת state ב-Terraform, ‏SELECT FOR UPDATE, ואיך לבחור" },
      body: {
        en: `<p><strong>Pessimistic locking</strong> takes the lock <em>before</em> reading, so conflicts can't happen, at the cost of waiting, deadlocks and stuck locks.</p>
<pre>-- Postgres row lock for a read-modify-write
BEGIN;
SELECT stock FROM items WHERE id = 42 FOR UPDATE;            -- others block here
UPDATE items SET stock = stock - 3 WHERE id = 42;
COMMIT;
-- FOR UPDATE NOWAIT   -&gt; error instead of waiting
-- FOR UPDATE SKIP LOCKED -&gt; job-queue pattern: each worker grabs different rows</pre>
<p><strong>Terraform</strong> locks the whole state for every plan/apply, because a 20-minute apply can't be "retried on conflict". With the S3 backend, <code>use_lockfile = true</code> (Terraform 1.10+) writes a <code>.tflock</code> object using S3 conditional writes; the older <code>dynamodb_table</code> lock is deprecated. A crashed CI job leaves the lock behind:</p>
<pre>Error: Error acquiring the state lock
Lock Info:  ID: 3f2a...  Operation: OperationTypeApply  Who: dev@ci-runner-7
$ terraform force-unlock 3f2a...      # only after confirming that run is really dead</pre>
<table>
<tr><th>Choose optimistic when</th><th>Choose pessimistic when</th></tr>
<tr><td>Conflicts are rare (different users edit different rows)</td><td>Conflicts are frequent (hot row, single counter, popular seat)</td></tr>
<tr><td>The work is cheap to redo (recompute a field)</td><td>The work is expensive or has side effects (charge a card, terraform apply)</td></tr>
<tr><td>Long think-time between read and write (a user editing a form for minutes, over HTTP)</td><td>Short critical section inside one transaction</td></tr>
<tr><td>No lock service available, or across stateless HTTP/APIs</td><td>You can tolerate blocking and have lock timeouts / deadlock detection</td></tr>
</table>
<p>Often the best answer is neither: make the change a single atomic operation on the server (<code>UPDATE ... SET stock = stock - 3 WHERE stock &gt;= 3</code>, <code>INCRBY</code>, DynamoDB <code>ADD</code>), or route all writes for a key through one owner (partitioned consumer, actor). No read-then-write gap means nothing to conflict on.</p>`,
        he: `<p><strong>Pessimistic locking</strong> לוקח את ה-lock <em>לפני</em> הקריאה, ולכן conflicts לא יכולים לקרות. המחיר: המתנה, deadlocks ו-locks תקועים.</p>
<pre>-- Postgres row lock for a read-modify-write
BEGIN;
SELECT stock FROM items WHERE id = 42 FOR UPDATE;            -- others block here
UPDATE items SET stock = stock - 3 WHERE id = 42;
COMMIT;
-- FOR UPDATE NOWAIT   -&gt; error instead of waiting
-- FOR UPDATE SKIP LOCKED -&gt; job-queue pattern: each worker grabs different rows</pre>
<p><strong>Terraform</strong> נועל את כל ה-state בכל plan או apply, כי apply של 20 דקות אי אפשר "לנסות שוב כשיש conflict". עם ה-backend של S3, ‏<code>use_lockfile = true</code> ‏(Terraform 1.10 ומעלה) כותב אובייקט <code>.tflock</code> בעזרת conditional writes של S3; ה-lock הישן דרך <code>dynamodb_table</code> הוא deprecated. ‏CI job שקרס משאיר את ה-lock מאחור:</p>
<pre>Error: Error acquiring the state lock
Lock Info:  ID: 3f2a...  Operation: OperationTypeApply  Who: dev@ci-runner-7
$ terraform force-unlock 3f2a...      # only after confirming that run is really dead</pre>
<table>
<tr><th>תבחר אופטימי כש...</th><th>תבחר פסימי כש...</th></tr>
<tr><td>Conflicts נדירים (משתמשים שונים עורכים שורות שונות)</td><td>Conflicts נפוצים (שורה חמה, מונה יחיד, מושב פופולרי)</td></tr>
<tr><td>העבודה זולה לביצוע מחדש (לחשב שדה שוב)</td><td>העבודה יקרה או שיש לה side effects (חיוב כרטיס, ‏terraform apply)</td></tr>
<tr><td>יש זמן ארוך בין הקריאה לכתיבה (משתמש שעורך טופס כמה דקות, דרך HTTP)</td><td>קטע קריטי קצר בתוך transaction אחת</td></tr>
<tr><td>אין שירות locks, או שעובדים מעל HTTP ו-APIs בלי state</td><td>אפשר לסבול חסימה ויש lock timeouts וזיהוי deadlocks</td></tr>
</table>
<p>הרבה פעמים התשובה הכי טובה היא אף אחד מהם: להפוך את השינוי לפעולה atomic אחת בצד השרת (<code>UPDATE ... SET stock = stock - 3 WHERE stock &gt;= 3</code>, ‏<code>INCRBY</code>, ‏<code>ADD</code> ב-DynamoDB), או להעביר את כל הכתיבות של key דרך בעלים יחיד (consumer לפי partition, ‏actor). אין פער בין קריאה לכתיבה, אז אין על מה להתנגש.</p>`
      }
    }
  ],
  diagram: `CPU         CAS(addr, old=41, new=42)      LOCK CMPXCHG on one cache line
SQL         UPDATE .. SET v=v+1 WHERE id=42 AND v=7   -> "UPDATE 0" = lost
HTTP        PUT  If-Match: "v7"            -> 412 Precondition Failed
DynamoDB    ConditionExpression version=:old -> ConditionalCheckFailedException
Redis       WATCH k; MULTI; ...; EXEC      -> (nil)
Kubernetes  PUT with resourceVersion=123   -> 409 "the object has been modified"

           read (value, version) --> compute --> write IF version unchanged
                     ^                                     |
                     +------------- conflict: retry -------+  (cap + jitter)

pessimistic: lock --> read --> write --> unlock   (FOR UPDATE, Terraform state lock)`,
  handsOn: [
    { cmd: "go test -race ./...", what: { en: "Run your tests with the race detector. The unsynchronized done-flag loop and lost counter updates are reported with both stack traces.", he: "תריץ את הטסטים עם ה-race detector. לולאת ה-done בלי סנכרון ועדכוני מונה שהולכים לאיבוד מדווחים עם שני ה-stack traces." } },
    { cmd: "kubectl get deploy web -o jsonpath='{.metadata.resourceVersion}'; kubectl scale deploy web --replicas=4 --resource-version=1", what: { en: "Read the current resourceVersion, then try a scale with a stale one: the API server rejects it with a Conflict, exactly what a controller sees.", he: "תקרא את ה-resourceVersion הנוכחי, ואז תנסה scale עם גרסה ישנה: ה-API server דוחה עם Conflict, בדיוק מה ש-controller רואה." } },
    { cmd: "curl -si -X PUT https://api.example.com/items/42 -H 'If-Match: \"v6\"' -H 'Content-Type: application/json' -d '{\"stock\":7}' | head -1", what: { en: "Send an update with an old ETag against an API that supports conditional requests; expect HTTP/1.1 412 Precondition Failed.", he: "תשלח update עם ETag ישן ל-API שתומך ב-conditional requests; אתה אמור לקבל HTTP/1.1 412 Precondition Failed." } },
    { cmd: "psql -c \"UPDATE items SET stock = 7, version = version + 1 WHERE id = 42 AND version = 7\"", what: { en: "Run it twice from two sessions: the first prints UPDATE 1, the second UPDATE 0. Your code must treat 0 rows as a conflict, not success.", he: "תריץ את זה פעמיים משני sessions: הראשון מדפיס UPDATE 1, השני UPDATE 0. הקוד שלך חייב להתייחס ל-0 שורות כ-conflict ולא כהצלחה." } },
    { cmd: "terraform force-unlock <LOCK_ID>", what: { en: "Release a state lock left by a crashed run. Pessimistic locks need this escape hatch; use it only after confirming the holder is dead.", he: "משחרר state lock שנשאר מריצה שקרסה. ‏locks פסימיים צריכים פתח מילוט כזה. תשתמש בו רק אחרי שווידאת שמי שמחזיק את ה-lock באמת מת." } }
  ],
  mnemonic: {
    en: "\"Read the version, write IF it's still the version\": CMPXCHG, WHERE version, If-Match, resourceVersion. Lose? Re-read, retry, with a cap.",
    he: "\"קרא גרסה, כתוב רק אם זו עדיין הגרסה\": ‏CMPXCHG, ‏WHERE version, ‏If-Match, ‏resourceVersion. הפסדת? קרא מחדש ונסה שוב, עם תקרה."
  },
  pitfalls: [
    { en: "Treating \"UPDATE 0 rows\" or a 412/409 as success or as a generic error. With OCC that result is the conflict signal: re-read and retry, or surface \"someone else changed this\" to the user.", he: "להתייחס ל-\"UPDATE 0\" או ל-412/409 כהצלחה או כשגיאה כללית. ב-OCC התוצאה הזו היא סימן ה-conflict: לקרוא מחדש ולנסות שוב, או להראות למשתמש \"מישהו אחר שינה את זה\"." },
    { en: "Retrying the old object instead of re-reading. Resending the same stale resourceVersion or ETag fails forever; the retry must GET fresh state and re-apply the intent (\"set replicas to 6\"), not the old payload.", he: "לנסות שוב עם האובייקט הישן במקום לקרוא מחדש. שליחה חוזרת של אותו resourceVersion או ETag ישן תיכשל לנצח; ה-retry חייב לעשות GET ל-state טרי ולהחיל מחדש את הכוונה (\"replicas ל-6\"), לא את ה-payload הישן." },
    { en: "Using a plain bool or int as a cross-thread flag or counter because \"it's just one word\". Without volatile/atomic there is no happens-before: loops can spin forever and increments get lost, especially on ARM (Graviton) nodes.", he: "להשתמש ב-bool או int רגיל כ-flag או מונה בין threads כי \"זו רק מילה אחת\". בלי volatile או atomic אין happens-before: לולאות יכולות להסתובב לנצח ו-increments הולכים לאיבוד, במיוחד על nodes של ARM ‏(Graviton)." },
    { en: "Using OCC on a hot key. When hundreds of writers hit one row, counter or Kubernetes object, most attempts conflict and retries multiply load. Use an atomic server-side update, a pessimistic lock, or shard the key.", he: "להשתמש ב-OCC על key חם. כשמאות כותבים פוגעים באותה שורה, מונה או אובייקט Kubernetes, רוב הניסיונות מתנגשים וה-retries מכפילים את העומס. תשתמש בעדכון atomic בצד השרת, ב-lock פסימי, או תפצל את ה-key." }
  ],
  interview: [
    {
      q: { en: "Design concurrent edits for a product page where many admins may edit the same product. Optimistic or pessimistic, and how does it show up in the API?", he: "תתכנן עריכות מקבילות לדף מוצר שהרבה admins יכולים לערוך. אופטימי או פסימי, ואיך זה נראה ב-API?" },
      a: { en: "Optimistic: edits are long (minutes in a form), conflicts are rare, and holding DB locks across HTTP requests is a non-starter. Store a monotonically increasing version per product; GET returns it as an ETag; PUT/PATCH requires If-Match (return 428 if missing) and the DB write is UPDATE ... WHERE id = ? AND version = ?. Zero rows updated -> 412, and the UI shows a diff and lets the admin merge. For high-contention fields like stock, don't use the form at all: expose an atomic operation (POST /items/42/stock-adjustments with a delta) so the server does stock = stock - n in one statement.", he: "אופטימי: עריכות ארוכות (דקות בטופס), conflicts נדירים, ולהחזיק locks של DB לאורך requests של HTTP זה לא בא בחשבון. שומרים לכל מוצר גרסה שרק עולה; GET מחזיר אותה כ-ETag; ‏PUT או PATCH דורשים If-Match (מחזירים 428 אם חסר), והכתיבה ל-DB היא UPDATE ... WHERE id = ? AND version = ?. אפס שורות עודכנו? מחזירים 412, וה-UI מראה diff ונותן ל-admin למזג. לשדות עם תחרות גבוהה כמו מלאי לא משתמשים בטופס בכלל: חושפים פעולה atomic ‏(POST /items/42/stock-adjustments עם delta) כך שהשרת עושה stock = stock - n בפקודה אחת." }
    },
    {
      q: { en: "Your Kubernetes operator logs \"the object has been modified\" thousands of times an hour. Is it a bug, and what do you do?", he: "ה-operator שלך ב-Kubernetes כותב ללוג \"the object has been modified\" אלפי פעמים בשעה. זה באג, ומה תעשה?" },
      a: { en: "The 409 itself is normal OCC: the operator updated from a stale informer copy. Thousands per hour suggest contention or a design smell: two controllers (or the operator plus HPA/kubectl/another operator) fighting over the same fields, or updating the whole object when only status changed. Fixes: write status through the /status subresource; use server-side apply with a dedicated field manager so you only own your fields; avoid writing when nothing changed (compare first); return the error to requeue with backoff instead of tight retries; and check whether two controllers flip a field back and forth (an endless reconcile loop).", he: "ה-409 עצמו הוא OCC רגיל: ה-operator עדכן מעותק ישן של ה-informer. אלפים בשעה מרמזים על תחרות או על בעיית תכנון: שני controllers (או ה-operator מול HPA, ‏kubectl או operator אחר) שנלחמים על אותם שדות, או עדכון של כל האובייקט כשרק ה-status השתנה. תיקונים: לכתוב status דרך ה-subresource של /status; להשתמש ב-server-side apply עם field manager ייעודי כדי להחזיק רק בשדות שלך; לא לכתוב כששום דבר לא השתנה (להשוות קודם); להחזיר את השגיאה כדי לעשות requeue עם backoff במקום retries צפופים; ולבדוק אם שני controllers מהפכים שדה הלוך וחזור (לולאת reconcile אינסופית)." }
    },
    {
      q: { en: "Explain why a boolean stop flag can make a worker thread never stop, and how happens-before fixes it.", he: "תסביר למה flag בוליאני של עצירה יכול לגרום ל-worker thread לא לעצור אף פעם, ואיך happens-before מתקן את זה." },
      a: { en: "Without synchronization the compiler/JIT may assume no other thread changes the field and hoist the read out of the loop, and the CPU may keep the write in a store buffer or reorder it. There is no happens-before edge between the writer and the reader, so the reader is not guaranteed to ever see the write. Declaring it volatile (Java/C#) or atomic (Go atomic.Bool, C++ std::atomic) makes the write happen-before any read that observes it and forbids hoisting; it also orders the writes made before the flag, so data published before setting the flag is visible after reading it.", he: "בלי סנכרון ה-compiler או ה-JIT רשאים להניח שאף thread אחר לא משנה את השדה ולהוציא את הקריאה מהלולאה, וה-CPU יכול להחזיק את הכתיבה ב-store buffer או לשנות את הסדר שלה. אין קשת happens-before בין הכותב לקורא, אז אין הבטחה שהקורא יראה אי פעם את הכתיבה. הגדרה כ-volatile ‏(Java/C#) או כ-atomic ‏(atomic.Bool ב-Go, ‏std::atomic ב-C++) הופכת את הכתיבה לכזו שקורית לפני כל קריאה שרואה אותה, ואוסרת את ההוצאה מהלולאה. היא גם מסדרת את הכתיבות שנעשו לפני ה-flag, כך שמידע שפורסם לפני הדלקת ה-flag נראה אחרי קריאתו." }
    }
  ],
  quiz: [
    {
      q: { en: "A Kubernetes client gets HTTP 409 \"the object has been modified\". What should the retry do?", he: "Client של Kubernetes מקבל HTTP 409 עם \"the object has been modified\". מה ה-retry צריך לעשות?" },
      options: [
        { en: "Resend the same object immediately", he: "לשלוח מיד את אותו אובייקט שוב" },
        { en: "GET the latest object, re-apply the intended change, and update again (bounded retries)", he: "לעשות GET לאובייקט העדכני, להחיל מחדש את השינוי המבוקש ולעדכן שוב (עם מספר retries מוגבל)" },
        { en: "Delete the object and recreate it", he: "למחוק את האובייקט וליצור אותו מחדש" },
        { en: "Remove resourceVersion from the object and resend it so it always wins", he: "להוריד את resourceVersion מהאובייקט ולשלוח שוב כדי שתמיד ינצח" }
      ],
      answer: 1,
      explain: { en: "That's retry.RetryOnConflict: fresh read, re-apply intent, write with the new resourceVersion. Stripping the version just reintroduces lost updates.", he: "זה בדיוק retry.RetryOnConflict: קריאה טרייה, החלה מחדש של הכוונה, וכתיבה עם ה-resourceVersion החדש. הורדת הגרסה רק מחזירה את בעיית ה-lost updates." }
    },
    {
      q: { en: "Which HTTP status does a server return when a PUT carries If-Match with an ETag that no longer matches?", he: "איזה סטטוס HTTP השרת מחזיר כש-PUT מגיע עם If-Match ו-ETag שכבר לא תואם?" },
      options: [
        { en: "409 Conflict", he: "409 Conflict" },
        { en: "428 Precondition Required", he: "428 Precondition Required" },
        { en: "304 Not Modified", he: "304 Not Modified" },
        { en: "412 Precondition Failed", he: "412 Precondition Failed" }
      ],
      answer: 3,
      explain: { en: "412 means the precondition (If-Match) was false. 428 is for a missing precondition; 304 is for conditional GETs; Kubernetes uses 409 for its own version conflicts.", he: "412 אומר שה-precondition ‏(If-Match) היה שקרי. ‏428 הוא כשה-precondition חסר; ‏304 הוא ל-GET מותנה; ‏Kubernetes משתמש ב-409 ל-conflicts של גרסאות משלו." }
    },
    {
      q: { en: "32 threads each increment their own atomic counter, but the counters sit next to each other in one struct. Throughput is terrible. Why?", he: "32 threads מגדילים כל אחד מונה atomic משלו, אבל המונים יושבים זה ליד זה באותו struct. ה-throughput נוראי. למה?" },
      options: [
        { en: "False sharing: the counters share 64-byte cache lines, which bounce between cores", he: "False sharing: המונים חולקים cache lines של 64 bytes שקופצים בין ה-cores" },
        { en: "The ABA problem", he: "בעיית ABA" },
        { en: "Atomics take a kernel lock", he: "Atomics לוקחים lock בקרנל" },
        { en: "CFS throttling", he: "CFS throttling" }
      ],
      answer: 0,
      explain: { en: "Different variables, same cache line: each write invalidates the line in every other core. Pad each counter to its own line.", he: "משתנים שונים, אותו cache line: כל כתיבה מבטלת את השורה בכל core אחר. תרפד כל מונה לשורה משלו." }
    },
    {
      q: { en: "When is pessimistic locking the better choice than optimistic concurrency?", he: "מתי locking פסימי עדיף על optimistic concurrency?" },
      options: [
        { en: "When a user edits a form for several minutes over HTTP", he: "כשמשתמש עורך טופס כמה דקות דרך HTTP" },
        { en: "When conflicts are rare and the work is cheap to redo", he: "כש-conflicts נדירים והעבודה זולה לביצוע מחדש" },
        { en: "When the protected work is long or has side effects that can't be redone, like a terraform apply", he: "כשהעבודה המוגנת ארוכה או שיש לה side effects שאי אפשר לעשות מחדש, כמו terraform apply" },
        { en: "Whenever there is no database", he: "בכל פעם שאין database" }
      ],
      answer: 2,
      explain: { en: "OCC detects conflicts after the work is done, so the work must be cheap and safe to redo. A 20-minute apply that changes real infrastructure can't be rolled back on conflict, so Terraform locks the state up front.", he: "OCC מזהה conflicts אחרי שהעבודה כבר נעשתה, אז העבודה צריכה להיות זולה ובטוחה לביצוע מחדש. ‏apply של 20 דקות שמשנה תשתית אמיתית אי אפשר לבטל ב-conflict, ולכן Terraform נועל את ה-state מראש." }
    }
  ],
  related: ["pr-race-deadlock", "pr-concurrency-parallelism", "db-transactions", "redis-deep", "staff-time-ordering", "memory-hierarchy", "pr-api-design", "pr-idempotency", "k8s-operators-crds", "k8s-etcd-apf", "terraform-production-workflow"]
});

/* ------------------------------------------------------------------ */
INFRA.glossary.push({ term: "GOMAXPROCS", track: "principal", def: { en: "How many OS threads may run Go code at once. Since Go 1.25 it defaults to the cgroup CPU limit on Linux; older versions used the node's core count (use automaxprocs).", he: "כמה threads של מערכת ההפעלה יכולים להריץ קוד Go בו זמנית. מאז Go 1.25 ברירת המחדל ב-Linux היא ה-CPU limit של ה-cgroup; גרסאות ישנות השתמשו במספר ה-cores של ה-node (ושם צריך automaxprocs)." }, lesson: "runtime-threads-in-containers" });
INFRA.glossary.push({ term: "Thread pool starvation", track: "principal", def: { en: "All pool threads are blocked waiting (often on work that itself needs a pool thread), so queued work stalls while CPU sits idle. Classic cause: sync-over-async in .NET.", he: "כל ה-threads ב-pool חסומים בהמתנה (הרבה פעמים לעבודה שבעצמה צריכה thread מה-pool), ולכן העבודה בתור נתקעת בזמן שה-CPU פנוי. הגורם הקלאסי: sync-over-async ב-.NET." }, lesson: "runtime-threads-in-containers" });
INFRA.glossary.push({ term: "Compare-and-swap", aliases: ["CAS", "compare and swap"], track: "principal", def: { en: "Atomic \"set to new only if still old\". The CPU primitive behind lock-free code, and the pattern behind version columns, If-Match and Kubernetes resourceVersion.", he: "פעולה atomic של \"תשנה לערך החדש רק אם זה עדיין הערך הישן\". הפרימיטיב של ה-CPU שמאחורי קוד lock-free, והתבנית שמאחורי עמודות version, ‏If-Match ו-resourceVersion ב-Kubernetes." }, lesson: "atomics-optimistic-concurrency" });
INFRA.glossary.push({ term: "Happens-before", track: "principal", def: { en: "Memory-model ordering: if A happens-before B, B sees A's effects. Created by locks, volatile/atomic accesses, channel operations and thread start/join.", he: "סדר של ה-memory model: אם A קורה לפני B במובן הזה, ‏B רואה את ההשפעות של A. נוצר על ידי locks, גישות volatile או atomic, פעולות על channels והפעלה או join של threads." }, lesson: "atomics-optimistic-concurrency" });
INFRA.glossary.push({ term: "resourceVersion", track: "kubernetes", def: { en: "Version stamp on every Kubernetes object, derived from etcd's revision. Updates with a stale value fail with 409 Conflict (optimistic concurrency).", he: "חותמת גרסה על כל אובייקט ב-Kubernetes, שנגזרת מה-revision של etcd. עדכון עם ערך ישן נכשל עם 409 Conflict ‏(optimistic concurrency)." }, lesson: "atomics-optimistic-concurrency" });
