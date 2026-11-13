/* Principal Engineer Playbook — runtime internals: concurrency, event loop, async/await, garbage collection */
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

INFRA.lessons.push({
  id: "pr-concurrency-parallelism",
  track: "principal",
  order: 40,
  icon: "🧑‍🍳",
  level: 3,
  minutes: 16,
  title: { en: "Concurrency vs Parallelism vs Multiprocessing (and Async)", he: "Concurrency מול Parallelism מול Multiprocessing (וגם Async)" },
  tldr: {
    en: "Concurrency is dealing with many things at once (structure); parallelism is doing many things at once (execution); multiprocessing is many isolated processes — and distribution is many machines. Pick by workload: IO-bound → async/threads, CPU-bound → processes/cores.",
    he: "Concurrency זה להתמודד עם הרבה דברים בבת אחת (מבנה); parallelism זה לבצע הרבה דברים בבת אחת (ביצוע); multiprocessing זה הרבה processes מבודדים — ו-distribution זה הרבה מכונות. בוחרים לפי ה-workload: IO-bound → async/threads, CPU-bound → processes/ליבות."
  },
  analogy: {
    en: "One chef with four pots, stirring one while another boils — that's concurrency (one pair of hands, many tasks in progress). Four chefs in one kitchen sharing the same fridge and knives — that's multithreaded parallelism (fast, but they bump into each other and fight over the one sharp knife: race conditions and locks). Four separate kitchens, each with its own fridge, passing plates through a window — that's multiprocessing (isolated, safer, but talking costs more). A franchise of kitchens in different cities — that's distributed parallelism. Async is the chef who never stands staring at the oven: he sets a timer and goes chopping until it rings.",
    he: "שף אחד עם ארבעה סירים, מערבב אחד בזמן שהשני רותח — זה concurrency (זוג ידיים אחד, הרבה משימות בתהליך). ארבעה שפים במטבח אחד שחולקים את אותו מקרר וסכינים — זה parallelism עם threads (מהיר, אבל הם נתקלים אחד בשני ונלחמים על הסכין החדה היחידה: race conditions ו-locks). ארבעה מטבחים נפרדים, לכל אחד מקרר משלו, ומעבירים צלחות דרך אשנב — זה multiprocessing (מבודד, בטוח יותר, אבל התקשורת יקרה יותר). רשת מסעדות בערים שונות — זה parallelism מבוזר. Async זה השף שאף פעם לא עומד ובוהה בתנור: הוא שם טיימר והולך לחתוך ירקות עד שזה מצלצל."
  },
  sections: [
    {
      h: { en: "The four words people mix up", he: "ארבע המילים שכולם מבלבלים" },
      body: {
        en: `<table>
<tr><th>Term</th><th>Meaning</th><th>Needs multiple cores?</th><th>Example</th></tr>
<tr><td><strong>Concurrency</strong></td><td>Many tasks <em>in progress</em>, interleaved. A property of program structure.</td><td>No</td><td>Node.js serving 10k sockets on one thread</td></tr>
<tr><td><strong>Parallelism</strong></td><td>Many tasks <em>executing at the same instant</em>.</td><td>Yes</td><td>8 threads compressing 8 files on 8 cores</td></tr>
<tr><td><strong>Multiprocessing</strong></td><td>Many OS processes, each with its own memory, running together.</td><td>To be parallel, yes</td><td>gunicorn with 9 workers, Chrome tab-per-process, Postgres backend-per-connection</td></tr>
<tr><td><strong>Distributed</strong></td><td>Many machines, communicating over the network.</td><td>Many machines</td><td>Spark job, Kafka consumer group, MapReduce</td></tr>
<tr><td><strong>Async</strong></td><td>A <em>technique</em> for concurrency: don't block while waiting; resume when the result arrives.</td><td>No</td><td><code>await fetch()</code>, asyncio, epoll</td></tr>
</table>
<p>Rob Pike's line: <em>"Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once."</em> You can have concurrency without parallelism (one core, time slicing) and parallelism without much concurrency (one SIMD loop across 8 lanes).</p>
<blockquote>💡 Real world: Postgres forks one <em>process</em> per connection (~5-10 MB each) — that's why 5,000 connections hurt and why PgBouncer exists. MySQL uses one <em>thread</em> per connection. Redis runs commands on one thread with an event loop. Three famous databases, three concurrency models.</blockquote>`,
        he: `<table>
<tr><th>מונח</th><th>משמעות</th><th>צריך כמה ליבות?</th><th>דוגמה</th></tr>
<tr><td><strong>Concurrency</strong></td><td>הרבה משימות <em>בתהליך</em>, משולבות זו בזו. תכונה של מבנה התוכנית.</td><td>לא</td><td>Node.js שמשרת 10k sockets על thread אחד</td></tr>
<tr><td><strong>Parallelism</strong></td><td>הרבה משימות <em>רצות באותו רגע ממש</em>.</td><td>כן</td><td>8 threads שמכווצים 8 קבצים על 8 ליבות</td></tr>
<tr><td><strong>Multiprocessing</strong></td><td>הרבה processes של מערכת ההפעלה, לכל אחד זיכרון משלו, רצים יחד.</td><td>כדי להיות מקבילי, כן</td><td>gunicorn עם 9 workers, Chrome עם process לכל טאב, Postgres עם backend לכל connection</td></tr>
<tr><td><strong>Distributed</strong></td><td>הרבה מכונות שמדברות ברשת.</td><td>הרבה מכונות</td><td>Spark job, Kafka consumer group, MapReduce</td></tr>
<tr><td><strong>Async</strong></td><td><em>טכניקה</em> ל-concurrency: לא חוסמים בזמן המתנה; ממשיכים כשהתוצאה מגיעה.</td><td>לא</td><td><code>await fetch()</code>, asyncio, epoll</td></tr>
</table>
<p>המשפט של Rob Pike: <em>"Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once."</em> אפשר concurrency בלי parallelism (ליבה אחת, time slicing) ו-parallelism בלי הרבה concurrency (לולאת SIMD אחת על 8 lanes).</p>
<blockquote>💡 מהשטח: Postgres עושה fork ל-<em>process</em> לכל connection (~5-10 MB כל אחד) — בגלל זה 5,000 connections כואבים ובגלל זה קיים PgBouncer. MySQL משתמש ב-<em>thread</em> לכל connection. Redis מריץ פקודות על thread אחד עם event loop. שלושה databases מפורסמים, שלושה מודלים של concurrency.</blockquote>`
      }
    },
    {
      h: { en: "Processes, threads, green threads, coroutines — the cost table", he: "Processes, threads, green threads, coroutines — טבלת העלויות" },
      body: {
        en: `<table>
<tr><th>Unit</th><th>Memory</th><th>Created by</th><th>Shares memory?</th><th>Switch cost</th><th>How many fit on 1 box</th></tr>
<tr><td>Process</td><td>MBs (own address space, page tables)</td><td>OS (<code>fork</code>)</td><td>No (IPC: pipes, sockets, shm)</td><td>~1-5 µs + TLB flush</td><td>hundreds–low thousands</td></tr>
<tr><td>OS thread</td><td>~1 MB stack reserved (Linux default 8 MB virtual), ~10 KB+ real</td><td>OS (<code>pthread_create</code>)</td><td>Yes</td><td>~1-2 µs (kernel)</td><td>thousands–~10k</td></tr>
<tr><td>Goroutine / Java virtual thread</td><td>~2-8 KB growable stack</td><td>Language runtime (M:N scheduler)</td><td>Yes</td><td>~100-200 ns (user space)</td><td>millions</td></tr>
<tr><td>Coroutine / async task (JS Promise, asyncio Task, C# Task)</td><td>~hundreds of bytes–1 KB (heap state machine)</td><td>Runtime / compiler</td><td>Yes (usually one thread)</td><td>~tens of ns</td><td>millions</td></tr>
</table>
<p><strong>Preemptive</strong> scheduling (OS threads, goroutines since Go 1.14): the scheduler can interrupt you at any time — fair, but any line can be interleaved with another thread. <strong>Cooperative</strong> scheduling (async/await, Python generators): you yield only at <code>await</code> points — no surprise interleaving between awaits, but one CPU-hungry task starves everyone.</p>
<pre>// Go: 100k goroutines ≈ 250 MB (≈2.5 KB each); 100k OS threads would not fit
for i := 0; i &lt; 100_000; i++ {
    go func(id int) { time.Sleep(time.Second) }(i)   // ~250 MB total
}
// Java 21: same idea with virtual threads
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -&gt; ex.submit(() -&gt; { Thread.sleep(1000); return i; }));
}</pre>
<blockquote>⚠️ Production tip: Context switches are not free. <code>vmstat 1</code> → column <code>cs</code>. A box doing 200k+ context switches/sec with high <code>sy</code> CPU is often running far too many threads for its cores.</blockquote>`,
        he: `<table>
<tr><th>יחידה</th><th>זיכרון</th><th>מי יוצר</th><th>חולקים זיכרון?</th><th>עלות החלפה</th><th>כמה נכנסים על מכונה אחת</th></tr>
<tr><td>Process</td><td>MBs (address space ו-page tables משלו)</td><td>מערכת ההפעלה (<code>fork</code>)</td><td>לא (IPC: pipes, sockets, shm)</td><td>~1-5 µs + TLB flush</td><td>מאות–אלפים בודדים</td></tr>
<tr><td>OS thread</td><td>~1 MB stack שמור (ב-Linux ברירת מחדל 8 MB וירטואלי), ~10 KB+ בפועל</td><td>מערכת ההפעלה (<code>pthread_create</code>)</td><td>כן</td><td>~1-2 µs (kernel)</td><td>אלפים–~10k</td></tr>
<tr><td>Goroutine / Java virtual thread</td><td>~2-8 KB stack שגדל לפי הצורך</td><td>ה-runtime של השפה (scheduler M:N)</td><td>כן</td><td>~100-200 ns (user space)</td><td>מיליונים</td></tr>
<tr><td>Coroutine / async task (JS Promise, asyncio Task, C# Task)</td><td>~מאות בתים–1 KB (state machine על ה-heap)</td><td>Runtime / קומפיילר</td><td>כן (בדרך כלל thread אחד)</td><td>~עשרות ns</td><td>מיליונים</td></tr>
</table>
<p>תזמון <strong>Preemptive</strong> (OS threads, goroutines מאז Go 1.14): ה-scheduler יכול לעצור אותך בכל רגע — הוגן, אבל כל שורה יכולה להשתלב עם thread אחר. תזמון <strong>Cooperative</strong> (async/await, generators ב-Python): מוותרים על המעבד רק בנקודות <code>await</code> — אין שילובים מפתיעים בין awaits, אבל משימה אחת שזוללת CPU מרעיבה את כולם.</p>
<pre>// Go: 100k goroutines ≈ 250 MB (≈2.5 KB each); 100k OS threads would not fit
for i := 0; i &lt; 100_000; i++ {
    go func(id int) { time.Sleep(time.Second) }(i)   // ~250 MB total
}
// Java 21: same idea with virtual threads
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -&gt; ex.submit(() -&gt; { Thread.sleep(1000); return i; }));
}</pre>
<blockquote>⚠️ טיפ לפרודקשן: context switches לא בחינם. <code>vmstat 1</code> → עמודת <code>cs</code>. מכונה שעושה 200k+ context switches בשנייה עם הרבה CPU ב-<code>sy</code> בדרך כלל מריצה הרבה יותר מדי threads ביחס לליבות.</blockquote>`
      }
    },
    {
      h: { en: "CPU-bound vs IO-bound — pick the right model (and the Python GIL)", he: "CPU-bound מול IO-bound — לבחור את המודל הנכון (וה-GIL של Python)" },
      body: {
        en: `<p>First question, always: <strong>where does the time go?</strong> If a request spends 5 ms computing and 95 ms waiting for a DB/HTTP call, it's IO-bound: more cores won't help, more <em>concurrency</em> will. If it spends 900 ms hashing images, it's CPU-bound: you need more cores (parallelism), and async adds nothing.</p>
<table>
<tr><th>Workload</th><th>Good fit</th><th>Bad fit</th></tr>
<tr><td>IO-bound (APIs, proxies, crawlers, chat)</td><td>async/event loop, goroutines, virtual threads, big thread pool</td><td>process-per-request</td></tr>
<tr><td>CPU-bound (encoding, ML inference, compression, crypto)</td><td>processes or threads ≈ number of cores, SIMD/GPU, offload to workers</td><td>a single event loop (it blocks everyone)</td></tr>
<tr><td>Mixed</td><td>async front + worker pool / queue for the heavy part</td><td>doing heavy CPU inline in the request</td></tr>
</table>
<p><strong>Python's GIL</strong> (Global Interpreter Lock) lets only one thread execute Python bytecode at a time per process. Threads still help for IO (the GIL is released while waiting on sockets) and for C extensions that release it (NumPy, hashlib on big buffers). For CPU-bound pure Python use <code>multiprocessing</code>/<code>ProcessPoolExecutor</code>. Python 3.13 ships an experimental <em>free-threaded</em> build (<code>python3.13t</code>, PEP 703) without the GIL; 3.14 makes it officially supported but still optional.</p>
<pre>import time, threading, multiprocessing as mp
def burn(n=20_000_000):
    s = 0
    for i in range(n): s += i
# 4 threads on 4 cores with the GIL:  ~same time as running 4x sequentially
# 4 processes (mp.Pool(4).map(burn, [..]*4)): ~4x faster
</pre>
<blockquote>💡 Real world: That's why gunicorn/uvicorn run <code>workers = 2 * cores + 1</code> <em>processes</em>, and why Node.js runs one process per core behind PM2 or the <code>cluster</code> module — each process is one event loop, multiprocessing gives the parallelism.</blockquote>`,
        he: `<p>השאלה הראשונה, תמיד: <strong>לאן הזמן הולך?</strong> אם בקשה מבלה 5 ms בחישוב ו-95 ms בהמתנה ל-DB/HTTP, היא IO-bound: עוד ליבות לא יעזרו, עוד <em>concurrency</em> כן. אם היא מבלה 900 ms ב-hashing של תמונות, היא CPU-bound: צריך עוד ליבות (parallelism), ו-async לא מוסיף כלום.</p>
<table>
<tr><th>Workload</th><th>מתאים</th><th>לא מתאים</th></tr>
<tr><td>IO-bound (APIs, proxies, crawlers, צ'אט)</td><td>async/event loop, goroutines, virtual threads, thread pool גדול</td><td>process לכל בקשה</td></tr>
<tr><td>CPU-bound (encoding, ML inference, דחיסה, קריפטו)</td><td>processes או threads ≈ מספר הליבות, SIMD/GPU, offload ל-workers</td><td>event loop יחיד (הוא חוסם את כולם)</td></tr>
<tr><td>מעורב</td><td>חזית async + worker pool / תור לחלק הכבד</td><td>חישוב CPU כבד inline בתוך הבקשה</td></tr>
</table>
<p><strong>ה-GIL של Python</strong> (Global Interpreter Lock) מאפשר רק ל-thread אחד להריץ bytecode של Python בכל רגע, בכל process. Threads עדיין עוזרים ל-IO (ה-GIL משתחרר בזמן המתנה ל-sockets) ולהרחבות C שמשחררות אותו (NumPy, hashlib על buffers גדולים). ל-Python טהור שהוא CPU-bound משתמשים ב-<code>multiprocessing</code>/<code>ProcessPoolExecutor</code>. Python 3.13 מגיע עם build ניסיוני <em>free-threaded</em> (<code>python3.13t</code>, PEP 703) בלי GIL; ב-3.14 הוא נתמך רשמית אבל עדיין אופציונלי.</p>
<pre>import time, threading, multiprocessing as mp
def burn(n=20_000_000):
    s = 0
    for i in range(n): s += i
# 4 threads on 4 cores with the GIL:  ~same time as running 4x sequentially
# 4 processes (mp.Pool(4).map(burn, [..]*4)): ~4x faster
</pre>
<blockquote>💡 מהשטח: בגלל זה gunicorn/uvicorn מריצים <code>workers = 2 * cores + 1</code> <em>processes</em>, ובגלל זה Node.js רץ כ-process אחד לכל ליבה מאחורי PM2 או מודול ה-<code>cluster</code> — כל process הוא event loop אחד, וה-multiprocessing נותן את ה-parallelism.</blockquote>`
      }
    },
    {
      h: { en: "Shared memory bugs: races, locks, deadlocks, atomics", he: "באגים של זיכרון משותף: races, locks, deadlocks, atomics" },
      body: {
        en: `<p>A <strong>race condition</strong>: the result depends on timing. <code>count++</code> is really read → add → write; two threads can both read 41 and both write 42.</p>
<pre>// Java: lost updates
int count = 0;                      // shared
Runnable inc = () -&gt; { for (int i = 0; i &lt; 1_000_000; i++) count++; };
// run on 2 threads -&gt; prints ~1,3xx,xxx instead of 2,000,000

// Fix 1: mutex            synchronized (lock) { count++; }
// Fix 2: atomic CAS       AtomicLong c = new AtomicLong(); c.incrementAndGet();
// Fix 3: don't share      each thread counts locally, sum at the end (fastest)</pre>
<ul>
<li><strong>Mutex/lock</strong>: one holder at a time. <strong>RWLock</strong>: many readers or one writer. <strong>Semaphore</strong>: up to N holders (e.g. max 10 concurrent DB calls). <strong>Condition variable</strong>: wait until something is true.</li>
<li><strong>Atomics / CAS</strong> (compare-and-swap): the CPU instruction <code>LOCK CMPXCHG</code> — "set to 42 only if it's still 41". Lock-free counters, queues, and the basis of every optimistic-concurrency scheme (also in DBs: <code>UPDATE ... WHERE version = 7</code>).</li>
<li><strong>Deadlock</strong> needs all four <strong>Coffman conditions</strong>: mutual exclusion, hold-and-wait, no preemption, circular wait. Break any one — usually circular wait, by <em>always acquiring locks in the same global order</em> (e.g. by account ID) — and deadlock is impossible.</li>
<li><strong>Livelock</strong> (both keep politely retrying), <strong>starvation</strong> (one thread never gets the lock), <strong>priority inversion</strong> (Mars Pathfinder, 1997).</li>
</ul>
<blockquote>⚠️ Production tip: The best lock is no lock. Prefer immutability, message passing ("Don't communicate by sharing memory; share memory by communicating" — Go channels, actors in Akka/Erlang), or confinement (one owner thread). Run tests with race detectors: <code>go test -race</code>, ThreadSanitizer, Java's jcstress.</blockquote>`,
        he: `<p><strong>Race condition</strong>: התוצאה תלויה בתזמון. <code>count++</code> זה בעצם קריאה → חיבור → כתיבה; שני threads יכולים שניהם לקרוא 41 ושניהם לכתוב 42.</p>
<pre>// Java: lost updates
int count = 0;                      // shared
Runnable inc = () -&gt; { for (int i = 0; i &lt; 1_000_000; i++) count++; };
// run on 2 threads -&gt; prints ~1,3xx,xxx instead of 2,000,000

// Fix 1: mutex            synchronized (lock) { count++; }
// Fix 2: atomic CAS       AtomicLong c = new AtomicLong(); c.incrementAndGet();
// Fix 3: don't share      each thread counts locally, sum at the end (fastest)</pre>
<ul>
<li><strong>Mutex/lock</strong>: מחזיק אחד בכל פעם. <strong>RWLock</strong>: הרבה קוראים או כותב אחד. <strong>Semaphore</strong>: עד N מחזיקים (למשל מקסימום 10 קריאות DB במקביל). <strong>Condition variable</strong>: לחכות עד שמשהו נהיה נכון.</li>
<li><strong>Atomics / CAS</strong> (compare-and-swap): פקודת המעבד <code>LOCK CMPXCHG</code> — "תקבע ל-42 רק אם זה עדיין 41". counters ותורים בלי locks, והבסיס לכל מנגנון optimistic concurrency (גם ב-DB: <code>UPDATE ... WHERE version = 7</code>).</li>
<li><strong>Deadlock</strong> צריך את כל ארבעת <strong>תנאי Coffman</strong>: mutual exclusion, hold-and-wait, no preemption, circular wait. שוברים אחד — בדרך כלל circular wait, ע"י <em>נעילה תמיד באותו סדר גלובלי</em> (למשל לפי account ID) — ו-deadlock הופך לבלתי אפשרי.</li>
<li><strong>Livelock</strong> (שניהם ממשיכים לוותר בנימוס ולנסות שוב), <strong>starvation</strong> (thread אחד אף פעם לא מקבל את ה-lock), <strong>priority inversion</strong> (Mars Pathfinder, 1997).</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: ה-lock הכי טוב הוא בלי lock. עדיף immutability, העברת הודעות ("Don't communicate by sharing memory; share memory by communicating" — channels ב-Go, actors ב-Akka/Erlang), או confinement (thread בעלים אחד). להריץ טסטים עם race detectors: <code>go test -race</code>, ThreadSanitizer, jcstress ב-Java.</blockquote>`
      }
    },
    {
      h: { en: "Sizing thread pools and the limits of parallelism (Amdahl)", he: "Sizing של thread pools והגבולות של parallelism (Amdahl)" },
      body: {
        en: `<p><strong>Thread pool size</strong> (Goetz, <em>Java Concurrency in Practice</em>):</p>
<pre>threads = N_cpu * U_target * (1 + wait_time / compute_time)

8 cores, target 80% CPU, request = 10 ms CPU + 90 ms waiting on DB
threads = 8 * 0.8 * (1 + 90/10) = 64

CPU-bound (wait ~ 0):  threads ≈ N_cpu (+1)</pre>
<p>Then check the <em>downstream</em>: 64 threads × 20 pods = 1,280 concurrent DB queries — your Postgres with <code>max_connections=200</code> disagrees. Pool sizes are a <strong>system-wide</strong> budget (Little's Law: concurrency = throughput × latency).</p>
<p><strong>Amdahl's Law</strong>: if a fraction <em>p</em> of the work is parallelizable, the max speedup on N cores is <code>1 / ((1 - p) + p/N)</code>. With p = 0.95, 16 cores → 9.1×, and infinite cores → only 20×. The serial 5% (a global lock, a single DB writer, a coordinator) caps you. <strong>Gustafson's Law</strong> is the optimistic flip side: with more cores we usually process <em>bigger</em> problems, not the same one faster.</p>
<blockquote>💡 Real world: "We doubled the pods and throughput didn't move" — classic Amdahl. Find the serial part: one partition hot in Kafka, a row lock on a counter, a single-threaded Redis doing a slow <code>KEYS *</code>, a mutex around a shared cache. Scaling is a hunt for the serial fraction.</blockquote>`,
        he: `<p><strong>גודל thread pool</strong> (Goetz, <em>Java Concurrency in Practice</em>):</p>
<pre>threads = N_cpu * U_target * (1 + wait_time / compute_time)

8 cores, target 80% CPU, request = 10 ms CPU + 90 ms waiting on DB
threads = 8 * 0.8 * (1 + 90/10) = 64

CPU-bound (wait ~ 0):  threads ≈ N_cpu (+1)</pre>
<p>ואז בודקים את ה-<em>downstream</em>: 64 threads × 20 pods = 1,280 שאילתות DB במקביל — וה-Postgres שלכם עם <code>max_connections=200</code> לא מסכים. גודלי pools הם תקציב <strong>של כל המערכת</strong> (Little's Law: concurrency = throughput × latency).</p>
<p><strong>חוק Amdahl</strong>: אם חלק <em>p</em> מהעבודה ניתן למקבול, ההאצה המקסימלית על N ליבות היא <code>1 / ((1 - p) + p/N)</code>. עם p = 0.95, ‏16 ליבות → פי 9.1, ואינסוף ליבות → רק פי 20. ה-5% הסדרתיים (lock גלובלי, writer יחיד ל-DB, coordinator) תוקעים אותך. <strong>חוק Gustafson</strong> הוא הצד האופטימי: עם יותר ליבות בדרך כלל מעבדים בעיות <em>גדולות יותר</em>, לא את אותה בעיה מהר יותר.</p>
<blockquote>💡 מהשטח: "הכפלנו את ה-pods וה-throughput לא זז" — Amdahl קלאסי. מחפשים את החלק הסדרתי: partition חם אחד ב-Kafka, row lock על counter, Redis עם thread יחיד שמריץ <code>KEYS *</code> איטי, mutex סביב cache משותף. סקיילינג הוא ציד אחרי החלק הסדרתי.</blockquote>`
      }
    }
  ],
  diagram: `ONE CORE — concurrency (interleaving)          4 CORES — parallelism
time ->                                         time ->
core0: [A][B][A][C][B][A][C]                    core0: [AAAAAAA]
                                                core1: [BBBBBBB]
async (1 thread, waits overlap):                core2: [CCCCCCC]
  A: [cpu]---wait DB---[cpu]                    core3: [DDDDDDD]
  B:      [cpu]---wait HTTP---[cpu]
  C:           [cpu]--wait--[cpu]               MULTIPROCESSING          DISTRIBUTED
                                                [proc1|mem1] [proc2|mem2]  [host1]--net--[host2]
                                                    \\__ pipe/socket __/        \\__ Kafka/RPC __/`,
  handsOn: [
    { cmd: "python -c \"import time,concurrent.futures as f;b=lambda n:sum(range(n));t=time.time();list(f.ThreadPoolExecutor(4).map(b,[30_000_000]*4));print('threads',round(time.time()-t,2));t=time.time();list(f.ProcessPoolExecutor(4).map(b,[30_000_000]*4));print('procs',round(time.time()-t,2))\"", what: { en: "See the GIL: 4 threads ≈ sequential for CPU work, 4 processes ≈ 4× faster (on Linux/macOS; on Windows wrap in a script with if __name__ == '__main__').", he: "לראות את ה-GIL: 4 threads ≈ סדרתי לעבודת CPU, 4 processes ≈ פי 4 מהר יותר (ב-Linux/macOS; ב-Windows לעטוף בסקריפט עם if __name__ == '__main__')." } },
    { cmd: "vmstat 1 5", what: { en: "Watch 'cs' (context switches/sec), 'r' (runnable threads vs cores) and 'us/sy' CPU split.", he: "להסתכל על 'cs' (context switches לשנייה), 'r' (threads שמחכים ל-CPU מול מספר הליבות) ועל החלוקה us/sy." } },
    { cmd: "ps -eLf | wc -l ; ps -o nlwp= -p $(pgrep -n java)", what: { en: "Count threads on the box and in one process (nlwp = number of light-weight processes = threads).", he: "לספור threads על המכונה ובתוך process אחד (nlwp = number of light-weight processes = threads)." } },
    { cmd: "go test -race ./...", what: { en: "Go's race detector: finds unsynchronized concurrent access at runtime. Run it in CI.", he: "ה-race detector של Go: מוצא גישה מקבילית לא מסונכרנת בזמן ריצה. להריץ ב-CI." } }
  ],
  mnemonic: {
    en: "One chef juggling = concurrency. Many chefs = parallelism. Many kitchens = multiprocessing. Many restaurants = distributed. A timer instead of staring = async.",
    he: "שף אחד שמלהטט = concurrency. הרבה שפים = parallelism. הרבה מטבחים = multiprocessing. הרבה מסעדות = distributed. טיימר במקום לבהות = async."
  },
  pitfalls: [
    { en: "Adding threads to a CPU-bound Python service and expecting speedup — the GIL serializes it. Use processes (or a free-threaded build, or move the hot loop to NumPy/Rust).", he: "להוסיף threads לשירות Python שהוא CPU-bound ולצפות להאצה — ה-GIL הופך אותו לסדרתי. להשתמש ב-processes (או build free-threaded, או להעביר את הלולאה החמה ל-NumPy/Rust)." },
    { en: "Sizing a pool per pod without multiplying by replicas — 30 pods × 50 connections = 1,500 connections to a DB that allows 300.", he: "לקבוע pool לכל pod בלי להכפיל במספר ה-replicas — ‏30 pods × ‏50 connections = 1,500 connections ל-DB שמאפשר 300." },
    { en: "Taking two locks in different orders in different code paths (transfer A→B locks A then B, transfer B→A locks B then A) — a deadlock waiting for traffic.", he: "לקחת שני locks בסדר שונה בנתיבי קוד שונים (העברה A→B נועלת A ואז B, והעברה B→A נועלת B ואז A) — deadlock שמחכה לטראפיק." },
    { en: "Thinking async makes CPU work faster. Async overlaps waiting; it does nothing for computation.", he: "לחשוב ש-async מאיץ עבודת CPU. Async חופף המתנות; הוא לא עושה כלום לחישוב." }
  ],
  interview: [
    { q: { en: "Explain concurrency vs parallelism, and when you'd choose threads, processes or async.", he: "תסביר concurrency מול parallelism, ומתי תבחר threads, processes או async." },
      a: { en: "Concurrency is structuring a program to handle many tasks in progress; parallelism is executing simultaneously on multiple cores. For IO-bound work (most web services) I want cheap concurrency: async/event loop, goroutines, virtual threads. For CPU-bound work I want parallelism ≈ cores: threads in Go/Java/C#, processes in Python/Node. Processes also buy isolation (a crash or leak kills one worker) at the cost of memory and IPC. And past one box, it's distributed parallelism via a queue or partitioned stream.", he: "Concurrency זה לבנות תוכנית שמטפלת בהרבה משימות בתהליך; parallelism זה ביצוע בו-זמני על כמה ליבות. לעבודה IO-bound (רוב שירותי ה-web) אני רוצה concurrency זול: async/event loop, goroutines, virtual threads. לעבודה CPU-bound אני רוצה parallelism ≈ מספר ליבות: threads ב-Go/Java/C#, processes ב-Python/Node. Processes גם קונים בידוד (קריסה או leak הורגים worker אחד) במחיר זיכרון ו-IPC. ומעבר למכונה אחת, זה parallelism מבוזר דרך תור או stream מחולק ל-partitions." } },
    { q: { en: "We doubled the cores and throughput rose only 15%. How do you reason about it?", he: "הכפלנו ליבות וה-throughput עלה רק ב-15%. איך אתה חושב על זה?" },
      a: { en: "Amdahl: there's a serial fraction. I'd profile for lock contention (mutex wait time, synchronized blocks, Go's block/mutex profile), a single-writer resource (one DB primary, one hot partition, a global counter), GC pauses, or a downstream at its limit (connection pool saturated). Then remove or shard the serial part — per-thread counters, partitioned locks, more partitions — rather than adding cores.", he: "Amdahl: יש חלק סדרתי. הייתי עושה profiling ל-lock contention (זמן המתנה ל-mutex, בלוקים synchronized, block/mutex profile ב-Go), משאב עם כותב יחיד (primary DB אחד, partition חם, counter גלובלי), עצירות GC, או downstream שהגיע לגבול (connection pool רווי). ואז מסירים או מבצעים sharding לחלק הסדרתי — counters לכל thread, locks מחולקים, יותר partitions — במקום להוסיף ליבות." } }
  ],
  quiz: [
    { q: { en: "A Python service spends 95% of each request waiting on HTTP calls. What helps most?", he: "שירות Python מבלה 95% מכל בקשה בהמתנה לקריאות HTTP. מה יעזור הכי הרבה?" },
      options: [ { en: "More CPU cores", he: "עוד ליבות CPU" }, { en: "More concurrency: asyncio or a thread pool", he: "יותר concurrency: asyncio או thread pool" }, { en: "Removing the GIL", he: "להסיר את ה-GIL" }, { en: "A faster CPU", he: "מעבד מהיר יותר" } ],
      answer: 1, explain: { en: "IO-bound: the work is waiting. Overlap the waits. The GIL is released during IO, so even threads work.", he: "IO-bound: העבודה היא המתנה. חופפים את ההמתנות. ה-GIL משתחרר בזמן IO, אז גם threads עובדים." } },
    { q: { en: "Which Coffman condition do you usually break with a global lock ordering?", he: "איזה תנאי Coffman בדרך כלל שוברים עם סדר נעילה גלובלי?" },
      options: [ { en: "Mutual exclusion", he: "Mutual exclusion" }, { en: "No preemption", he: "No preemption" }, { en: "Circular wait", he: "Circular wait" }, { en: "Hold and wait", he: "Hold and wait" } ],
      answer: 2, explain: { en: "If everyone acquires locks in the same order, no cycle can form.", he: "אם כולם נועלים באותו סדר, לא יכול להיווצר מעגל." } },
    { q: { en: "8 cores, each request = 20 ms CPU + 80 ms waiting, target 100% CPU. Thread pool size?", he: "8 ליבות, כל בקשה = 20 ms CPU + ‏80 ms המתנה, יעד 100% CPU. גודל ה-thread pool?" },
      options: [ { en: "8", he: "8" }, { en: "16", he: "16" }, { en: "40", he: "40" }, { en: "800", he: "800" } ],
      answer: 2, explain: { en: "8 × 1 × (1 + 80/20) = 40.", he: "8 × 1 × (1 + 80/20) = 40." } },
    { q: { en: "95% of a job is parallelizable. Max speedup with unlimited cores?", he: "95% מה-job ניתן למקבול. מה ההאצה המקסימלית עם אינסוף ליבות?" },
      options: [ { en: "95×", he: "פי 95" }, { en: "20×", he: "פי 20" }, { en: "Unlimited", he: "בלתי מוגבלת" }, { en: "2×", he: "פי 2" } ],
      answer: 1, explain: { en: "Amdahl: 1 / 0.05 = 20. The serial part caps you.", he: "Amdahl: ‏1 / 0.05 = 20. החלק הסדרתי תוקע אותך." } }
  ],
  related: ["cpu", "processes-linux", "pr-event-loop", "pr-async-await", "pr-garbage-collection", "pr-sizing", "staff-queueing-tail-latency"]
});

INFRA.lessons.push({
  id: "pr-event-loop",
  track: "principal",
  order: 41,
  icon: "🔁",
  level: 3,
  minutes: 15,
  title: { en: "The Event Loop: How One Thread Serves 10,000 Clients", he: "ה-Event Loop: איך thread אחד משרת 10,000 לקוחות" },
  tldr: {
    en: "An event loop is one thread pulling ready events from the OS (epoll/kqueue/IOCP) and running short callbacks; it's brilliant for IO and catastrophic the moment any callback does heavy CPU work.",
    he: "Event loop זה thread אחד ששולף events מוכנים ממערכת ההפעלה (epoll/kqueue/IOCP) ומריץ callbacks קצרים; הוא מבריק ל-IO והרסני ברגע שאיזה callback עושה עבודת CPU כבדה."
  },
  analogy: {
    en: "A single waiter in a busy restaurant. He takes table 3's order, hands it to the kitchen and immediately goes to table 7 — he never stands at the kitchen door waiting for the steak. When a bell rings ('order 3 ready!'), he picks it up on his next round. One waiter can serve 30 tables because he's never waiting. But if a customer asks him to personally peel 200 potatoes, every other table starves: that's blocking the event loop.",
    he: "מלצר יחיד במסעדה עמוסה. הוא לוקח הזמנה משולחן 3, מעביר למטבח ומיד הולך לשולחן 7 — הוא אף פעם לא עומד בדלת המטבח ומחכה לסטייק. כשהפעמון מצלצל ('הזמנה 3 מוכנה!'), הוא לוקח אותה בסיבוב הבא. מלצר אחד יכול לשרת 30 שולחנות כי הוא אף פעם לא מחכה. אבל אם לקוח מבקש ממנו לקלף אישית 200 תפוחי אדמה, כל שאר השולחנות מורעבים: זה לחסום את ה-event loop."
  },
  sections: [
    {
      h: { en: "Why event loops exist: the C10K problem", he: "למה event loops קיימים: בעיית C10K" },
      body: {
        en: `<p>In 1999 Dan Kegel asked how to handle 10,000 concurrent connections on one server (C10K). Thread-per-connection meant 10k threads × ~1 MB stacks + constant context switches. The answer: <strong>non-blocking sockets + an OS readiness API</strong> — <code>epoll</code> (Linux), <code>kqueue</code> (BSD/macOS), <code>IOCP</code> (Windows), and now <code>io_uring</code>. One thread asks the kernel "which of my 10,000 sockets have data?" and only touches those.</p>
<pre>// the whole idea, in pseudo-C
int ep = epoll_create1(0);
epoll_ctl(ep, EPOLL_CTL_ADD, listen_fd, &amp;ev);
for (;;) {
    int n = epoll_wait(ep, events, 1024, timeout_ms);   // sleep until something is ready
    for (int i = 0; i &lt; n; i++)
        handle(events[i]);                                // must be FAST and non-blocking
    run_expired_timers();
}</pre>
<p>Event-loop servers you run every day: <strong>nginx</strong> (one loop per worker process, one worker per core), <strong>Redis</strong> (one loop executes all commands — which is why one <code>KEYS *</code> freezes everyone), <strong>Node.js</strong> (libuv), <strong>HAProxy</strong>, <strong>Envoy</strong> (loop per worker thread), Python <strong>asyncio</strong>/uvloop, Java <strong>Netty</strong>, Rust <strong>tokio</strong>.</p>
<blockquote>💡 Real world: The pattern "N event loops, one per core" (nginx workers, Envoy threads, Node cluster, Netty's EventLoopGroup) combines event-loop concurrency with multicore parallelism. Today the record is millions of connections per box (C10M).</blockquote>`,
        he: `<p>ב-1999 Dan Kegel שאל איך מטפלים ב-10,000 connections במקביל על שרת אחד (C10K). thread לכל connection היה אומר 10k threads × ~1 MB stack + context switches בלי סוף. התשובה: <strong>sockets לא חוסמים + API מוכנוּת של מערכת ההפעלה</strong> — <code>epoll</code> (Linux), <code>kqueue</code> (BSD/macOS), <code>IOCP</code> (Windows), והיום <code>io_uring</code>. thread אחד שואל את ה-kernel "לאיזה מ-10,000 ה-sockets שלי יש מידע?" ונוגע רק בהם.</p>
<pre>// the whole idea, in pseudo-C
int ep = epoll_create1(0);
epoll_ctl(ep, EPOLL_CTL_ADD, listen_fd, &amp;ev);
for (;;) {
    int n = epoll_wait(ep, events, 1024, timeout_ms);   // sleep until something is ready
    for (int i = 0; i &lt; n; i++)
        handle(events[i]);                                // must be FAST and non-blocking
    run_expired_timers();
}</pre>
<p>שרתי event loop שאתם מריצים כל יום: <strong>nginx</strong> (loop לכל worker process, worker לכל ליבה), <strong>Redis</strong> (loop אחד מריץ את כל הפקודות — בגלל זה <code>KEYS *</code> אחד מקפיא את כולם), <strong>Node.js</strong> (libuv), <strong>HAProxy</strong>, <strong>Envoy</strong> (loop לכל worker thread), <strong>asyncio</strong>/uvloop ב-Python, <strong>Netty</strong> ב-Java, <strong>tokio</strong> ב-Rust.</p>
<blockquote>💡 מהשטח: התבנית "N event loops, אחד לכל ליבה" (nginx workers, Envoy threads, Node cluster, ה-EventLoopGroup של Netty) משלבת concurrency של event loop עם parallelism על כמה ליבות. היום השיא הוא מיליוני connections למכונה (C10M).</blockquote>`
      }
    },
    {
      h: { en: "Node.js / libuv phases", he: "השלבים של Node.js / libuv" },
      body: {
        en: `<p>Each turn ("tick") of the Node event loop walks these phases in order. Each phase has a FIFO queue of callbacks:</p>
<ol>
<li><strong>timers</strong> — expired <code>setTimeout</code>/<code>setInterval</code> callbacks.</li>
<li><strong>pending callbacks</strong> — some deferred system errors (e.g. TCP <code>ECONNREFUSED</code>).</li>
<li><strong>idle/prepare</strong> — internal.</li>
<li><strong>poll</strong> — wait for IO (epoll) and run IO callbacks (socket data, completed fs reads). If nothing else is scheduled, the loop blocks here.</li>
<li><strong>check</strong> — <code>setImmediate</code> callbacks.</li>
<li><strong>close callbacks</strong> — <code>socket.on('close')</code>.</li>
</ol>
<p><strong>Between every callback</strong> Node drains two higher-priority queues: first <code>process.nextTick</code>, then <strong>microtasks</strong> (Promise reactions, <code>queueMicrotask</code>, the continuation after <code>await</code>).</p>
<p>Not all IO is async in the kernel. File system ops, <code>dns.lookup</code> (getaddrinfo), <code>crypto.pbkdf2</code>/<code>scrypt</code>, and <code>zlib</code> run on the <strong>libuv thread pool</strong> — default <strong>4 threads</strong> (<code>UV_THREADPOOL_SIZE</code>, max 1024). Four slow bcrypt hashes and your fifth <code>fs.readFile</code> queues behind them.</p>
<blockquote>⚠️ Production tip: A service doing heavy <code>dns.lookup</code> (every outbound HTTP call without keep-alive!) plus <code>fs</code> plus <code>crypto</code> can saturate those 4 threads and look like "random latency". Set <code>UV_THREADPOOL_SIZE=16</code> (before Node starts), reuse connections with keep-alive agents, and cache DNS.</blockquote>`,
        he: `<p>כל סיבוב ("tick") של ה-event loop ב-Node עובר על השלבים האלה לפי הסדר. לכל שלב יש תור FIFO של callbacks:</p>
<ol>
<li><strong>timers</strong> — callbacks של <code>setTimeout</code>/<code>setInterval</code> שהזמן שלהם עבר.</li>
<li><strong>pending callbacks</strong> — חלק משגיאות המערכת שנדחו (למשל TCP <code>ECONNREFUSED</code>).</li>
<li><strong>idle/prepare</strong> — פנימי.</li>
<li><strong>poll</strong> — מחכה ל-IO (epoll) ומריץ callbacks של IO (מידע ב-socket, קריאות fs שהסתיימו). אם אין שום דבר אחר מתוזמן, ה-loop נחסם כאן.</li>
<li><strong>check</strong> — callbacks של <code>setImmediate</code>.</li>
<li><strong>close callbacks</strong> — <code>socket.on('close')</code>.</li>
</ol>
<p><strong>בין כל callback ל-callback</strong> Node מרוקן שני תורים בעדיפות גבוהה יותר: קודם <code>process.nextTick</code>, ואז <strong>microtasks</strong> (תגובות של Promise, <code>queueMicrotask</code>, ההמשך אחרי <code>await</code>).</p>
<p>לא כל IO הוא אסינכרוני ב-kernel. פעולות file system, ‏<code>dns.lookup</code> (getaddrinfo), ‏<code>crypto.pbkdf2</code>/<code>scrypt</code> ו-<code>zlib</code> רצים על <strong>ה-thread pool של libuv</strong> — ברירת מחדל <strong>4 threads</strong> (<code>UV_THREADPOOL_SIZE</code>, מקסימום 1024). ארבעה bcrypt איטיים וה-<code>fs.readFile</code> החמישי שלכם עומד בתור מאחוריהם.</p>
<blockquote>⚠️ טיפ לפרודקשן: שירות שעושה הרבה <code>dns.lookup</code> (כל קריאת HTTP יוצאת בלי keep-alive!) ועוד <code>fs</code> ועוד <code>crypto</code> יכול לרוות את 4 ה-threads ולהיראות כמו "latency רנדומלי". לקבוע <code>UV_THREADPOOL_SIZE=16</code> (לפני ש-Node עולה), לעשות שימוש חוזר ב-connections עם keep-alive agents, ולשמור DNS ב-cache.</blockquote>`
      }
    },
    {
      h: { en: "The ordering puzzle: microtasks vs macrotasks", he: "חידת הסדר: microtasks מול macrotasks" },
      body: {
        en: `<pre>console.log('1 sync');
setTimeout(() =&gt; console.log('5 timeout'), 0);
setImmediate(() =&gt; console.log('6 immediate'));
Promise.resolve().then(() =&gt; console.log('4 promise'));
process.nextTick(() =&gt; console.log('3 nextTick'));
console.log('2 sync');

// Output (Node):
// 1 sync
// 2 sync
// 3 nextTick      &lt;- nextTick queue drains first
// 4 promise       &lt;- then the microtask queue
// 5 timeout       &lt;- timers phase (order vs setImmediate is NOT guaranteed
// 6 immediate     &lt;-  from the main module; inside an IO callback, immediate always wins)</pre>
<p>Rules to remember: <strong>synchronous code runs to completion</strong> (nothing interrupts it). Then <strong>all</strong> microtasks drain — including microtasks queued by microtasks. Only then the next macrotask (timer, IO, immediate).</p>
<p>Consequence: a recursive <code>Promise.resolve().then(loop)</code> or <code>process.nextTick(loop)</code> <em>starves the loop</em> — IO and timers never run, even though every step is "async". <code>setImmediate(loop)</code> yields properly.</p>
<blockquote>💡 Real world: The browser loop is the same idea: one task (click handler, timer) → drain microtasks → maybe render (~every 16.7 ms at 60 fps, with <code>requestAnimationFrame</code> just before paint). A 200 ms handler = 12 dropped frames = a janky page; Chrome flags it as a "long task" and it hurts INP (Interaction to Next Paint).</blockquote>`,
        he: `<pre>console.log('1 sync');
setTimeout(() =&gt; console.log('5 timeout'), 0);
setImmediate(() =&gt; console.log('6 immediate'));
Promise.resolve().then(() =&gt; console.log('4 promise'));
process.nextTick(() =&gt; console.log('3 nextTick'));
console.log('2 sync');

// Output (Node):
// 1 sync
// 2 sync
// 3 nextTick      &lt;- nextTick queue drains first
// 4 promise       &lt;- then the microtask queue
// 5 timeout       &lt;- timers phase (order vs setImmediate is NOT guaranteed
// 6 immediate     &lt;-  from the main module; inside an IO callback, immediate always wins)</pre>
<p>כללים לזכור: <strong>קוד סינכרוני רץ עד הסוף</strong> (שום דבר לא קוטע אותו). אחר כך <strong>כל</strong> ה-microtasks מתרוקנים — כולל microtasks שנוספו ע"י microtasks. רק אז ה-macrotask הבא (timer, IO, immediate).</p>
<p>ההשלכה: <code>Promise.resolve().then(loop)</code> רקורסיבי או <code>process.nextTick(loop)</code> <em>מרעיבים את ה-loop</em> — IO ו-timers אף פעם לא רצים, למרות שכל צעד "אסינכרוני". <code>setImmediate(loop)</code> מוותר כמו שצריך.</p>
<blockquote>💡 מהשטח: ה-loop בדפדפן הוא אותו רעיון: task אחד (click handler, timer) → ריקון microtasks → אולי render (~כל 16.7 ms ב-60 fps, עם <code>requestAnimationFrame</code> ממש לפני הציור). handler של 200 ms = ‏12 frames שנפלו = דף מקרטע; Chrome מסמן אותו כ-"long task" וזה פוגע ב-INP (Interaction to Next Paint).</blockquote>`
      }
    },
    {
      h: { en: "Blocking the loop: causes, detection, fixes", he: "חסימת ה-loop: גורמים, זיהוי ותיקונים" },
      body: {
        en: `<p>While one callback runs, <strong>every other client waits</strong>. 50 ms of sync CPU per request on one loop caps you at 20 req/s — no matter how many sockets are open. Usual suspects:</p>
<ul>
<li><code>JSON.parse</code>/<code>JSON.stringify</code> on a 50 MB payload (hundreds of ms).</li>
<li>Sync APIs: <code>fs.readFileSync</code>, <code>crypto.pbkdf2Sync</code>, <code>zlib.gzipSync</code>, <code>child_process.execSync</code>.</li>
<li><strong>Catastrophic regex backtracking (ReDoS)</strong>: <code>/^(a+)+$/</code> on <code>"aaaaaaaaaaaaaaaaaaaaaaaaaaaa!"</code> takes seconds — Cloudflare's global outage on 2019-07-02 was one regex burning CPU.</li>
<li>Big sync loops: sorting 1M items, building a huge report, template rendering.</li>
</ul>
<p><strong>Detect it</strong>: measure <em>event loop lag</em> (how late a 0 ms timer fires) and <em>Event Loop Utilization</em> (ELU, 0..1).</p>
<pre>const { monitorEventLoopDelay, performance } = require('node:perf_hooks');
const h = monitorEventLoopDelay({ resolution: 10 }); h.enable();
setInterval(() =&gt; {
  const elu = performance.eventLoopUtilization();
  console.log('lag p99 ms', (h.percentile(99) / 1e6).toFixed(1), 'ELU', elu.utilization.toFixed(2));
  h.reset();
}, 5000);
// healthy: p99 lag &lt; 10-20 ms, ELU &lt; 0.7. Alert on p99 lag &gt; 100 ms.</pre>
<p><strong>Fix it</strong>: (1) move CPU work to <code>worker_threads</code> (Piscina pool) or a separate service via a queue; (2) chunk it — process 1,000 items, then <code>setImmediate</code> to yield; (3) stream instead of buffering (streaming JSON parsers); (4) use async APIs; (5) bound input sizes and use safe regex engines (RE2). Tools: <code>clinic doctor</code>/<code>clinic flame</code>, <code>node --cpu-prof</code>, <code>0x</code>.</p>`,
        he: `<p>בזמן ש-callback אחד רץ, <strong>כל שאר הלקוחות מחכים</strong>. 50 ms של CPU סינכרוני לבקשה על loop אחד מגבילים אתכם ל-20 בקשות בשנייה — לא משנה כמה sockets פתוחים. החשודים הרגילים:</p>
<ul>
<li><code>JSON.parse</code>/<code>JSON.stringify</code> על payload של 50 MB (מאות ms).</li>
<li>APIs סינכרוניים: <code>fs.readFileSync</code>, <code>crypto.pbkdf2Sync</code>, <code>zlib.gzipSync</code>, <code>child_process.execSync</code>.</li>
<li><strong>Backtracking קטסטרופלי ב-regex (ReDoS)</strong>: <code>/^(a+)+$/</code> על <code>"aaaaaaaaaaaaaaaaaaaaaaaaaaaa!"</code> לוקח שניות — ה-outage הגלובלי של Cloudflare ב-2.7.2019 היה regex אחד ששרף CPU.</li>
<li>לולאות סינכרוניות גדולות: מיון של מיליון פריטים, בניית דוח ענק, רינדור templates.</li>
</ul>
<p><strong>לזהות</strong>: מודדים <em>event loop lag</em> (באיחור של כמה timer של 0 ms קופץ) ו-<em>Event Loop Utilization</em> (ELU, ‏0..1).</p>
<pre>const { monitorEventLoopDelay, performance } = require('node:perf_hooks');
const h = monitorEventLoopDelay({ resolution: 10 }); h.enable();
setInterval(() =&gt; {
  const elu = performance.eventLoopUtilization();
  console.log('lag p99 ms', (h.percentile(99) / 1e6).toFixed(1), 'ELU', elu.utilization.toFixed(2));
  h.reset();
}, 5000);
// healthy: p99 lag &lt; 10-20 ms, ELU &lt; 0.7. Alert on p99 lag &gt; 100 ms.</pre>
<p><strong>לתקן</strong>: (1) להעביר עבודת CPU ל-<code>worker_threads</code> (pool של Piscina) או לשירות נפרד דרך תור; (2) לחלק לחתיכות — לעבד 1,000 פריטים, ואז <code>setImmediate</code> כדי לוותר על התור; (3) streaming במקום buffering (parsers של JSON בסטרימינג); (4) להשתמש ב-APIs אסינכרוניים; (5) להגביל גודל קלט ולהשתמש במנועי regex בטוחים (RE2). כלים: <code>clinic doctor</code>/<code>clinic flame</code>, ‏<code>node --cpu-prof</code>, ‏<code>0x</code>.</p>`
      }
    },
    {
      h: { en: "Python asyncio and the universal rule", he: "asyncio ב-Python והכלל האוניברסלי" },
      body: {
        en: `<p>asyncio is the same machine: one thread, a selector (epoll), a ready queue of coroutines. Every <code>await</code> on IO yields to the loop. Any sync call — <code>requests.get</code>, <code>time.sleep</code>, a psycopg2 query, a 2-second pandas transform — freezes all coroutines.</p>
<pre>import asyncio, time
async def bad():  time.sleep(1)            # blocks the whole loop
async def good(): await asyncio.sleep(1)   # yields

async def main():
    t = time.perf_counter()
    await asyncio.gather(*(good() for _ in range(1000)))
    print(f"{time.perf_counter()-t:.2f}s")   # ~1.0s for 1000 tasks
    # blocking code you can't rewrite? push it to a thread:
    await asyncio.to_thread(time.sleep, 1)
asyncio.run(main(), debug=True)   # debug mode logs callbacks slower than 100 ms</pre>
<p>The universal rule for <em>every</em> event loop (Node, asyncio, Netty, Vert.x, tokio, Redis, nginx modules): <strong>never block the loop thread</strong>. IO → async APIs; CPU → a worker pool; unknown library → assume it's blocking until proven otherwise.</p>
<blockquote>⚠️ Production tip: FastAPI runs <code>async def</code> endpoints on the loop and plain <code>def</code> endpoints in a thread pool. Writing <code>async def</code> and then calling a sync DB driver inside is the #1 FastAPI performance bug — it serializes your whole worker.</blockquote>`,
        he: `<p>asyncio הוא אותה מכונה: thread אחד, selector (epoll), ותור מוכנים של coroutines. כל <code>await</code> על IO מחזיר שליטה ל-loop. כל קריאה סינכרונית — <code>requests.get</code>, ‏<code>time.sleep</code>, שאילתה ב-psycopg2, טרנספורמציה של 2 שניות ב-pandas — מקפיאה את כל ה-coroutines.</p>
<pre>import asyncio, time
async def bad():  time.sleep(1)            # blocks the whole loop
async def good(): await asyncio.sleep(1)   # yields

async def main():
    t = time.perf_counter()
    await asyncio.gather(*(good() for _ in range(1000)))
    print(f"{time.perf_counter()-t:.2f}s")   # ~1.0s for 1000 tasks
    # blocking code you can't rewrite? push it to a thread:
    await asyncio.to_thread(time.sleep, 1)
asyncio.run(main(), debug=True)   # debug mode logs callbacks slower than 100 ms</pre>
<p>הכלל האוניברסלי ל<em>כל</em> event loop (Node, asyncio, Netty, Vert.x, tokio, Redis, מודולים של nginx): <strong>לעולם לא לחסום את ה-thread של ה-loop</strong>. IO → APIs אסינכרוניים; CPU → worker pool; ספרייה לא מוכרת → להניח שהיא חוסמת עד שיוכח אחרת.</p>
<blockquote>⚠️ טיפ לפרודקשן: FastAPI מריץ endpoints של <code>async def</code> על ה-loop ו-endpoints של <code>def</code> רגיל ב-thread pool. לכתוב <code>async def</code> ואז לקרוא בפנים ל-driver סינכרוני של DB זה באג הביצועים מספר 1 ב-FastAPI — זה הופך את כל ה-worker לסדרתי.</blockquote>`
      }
    }
  ],
  diagram: `           ┌──────────────── one tick of the Node.js event loop ────────────────┐
  ┌──────► │ timers ─► pending ─► idle/prepare ─► POLL (epoll_wait, IO cbs) ─► check ─► close │ ──┐
  │        └─────────────────────────────────────────────────────────────────────┘   │
  │          after EVERY callback:  process.nextTick queue  ─►  Promise microtasks       │
  └──────────────────────────────────────────────────────────────────────────────────┘
                          │ fs, dns.lookup, crypto, zlib
                          ▼
                 libuv thread pool [T1][T2][T3][T4]   (UV_THREADPOOL_SIZE)

  blocked loop:  req1 [■■■■■■■■■■ 200ms JSON.parse ■■■■■■■■■■]
                 req2                                          [ok]   <- waited 200 ms for nothing`,
  handsOn: [
    { cmd: "node -e \"console.log(1);setTimeout(()=>console.log(5));setImmediate(()=>console.log(6));Promise.resolve().then(()=>console.log(4));process.nextTick(()=>console.log(3));console.log(2)\"", what: { en: "Run the ordering puzzle yourself. Run it a few times: 5 and 6 may swap.", he: "להריץ את חידת הסדר בעצמכם. להריץ כמה פעמים: 5 ו-6 יכולים להתחלף." } },
    { cmd: "node -e \"setInterval(()=>{const t=Date.now();setImmediate(()=>console.log('lag',Date.now()-t,'ms'))},1000);setTimeout(()=>{const e=Date.now()+3000;while(Date.now()<e);},2500)\"", what: { en: "Watch the loop lag jump to ~3000 ms while a sync busy-loop blocks it.", he: "לראות את ה-lag של ה-loop קופץ ל-~3000 ms בזמן ש-busy-loop סינכרוני חוסם אותו." } },
    { cmd: "UV_THREADPOOL_SIZE=16 node server.js", what: { en: "Raise the libuv pool for fs/dns/crypto-heavy services (must be set before Node starts).", he: "להגדיל את ה-pool של libuv לשירותים עם הרבה fs/dns/crypto (חייבים לקבוע לפני ש-Node עולה)." } },
    { cmd: "redis-cli --latency ; redis-cli SLOWLOG GET 10", what: { en: "Redis is a single event loop: see latency and the slow commands that blocked it.", he: "Redis הוא event loop יחיד: לראות latency ואת הפקודות האיטיות שחסמו אותו." } }
  ],
  mnemonic: {
    en: "One waiter, never waits: Sync first, then Ticks, then Promises, then Timers & IO — and never peel potatoes on the loop.",
    he: "מלצר אחד, אף פעם לא מחכה: קודם sync, אחר כך nextTick, אחר כך Promises, ואז Timers ו-IO — ולעולם לא מקלפים תפוחי אדמה על ה-loop."
  },
  pitfalls: [
    { en: "Using sync APIs (readFileSync, bcrypt sync, execSync) in request handlers — fine at startup, fatal per-request.", he: "להשתמש ב-APIs סינכרוניים (readFileSync, bcrypt sync, execSync) בתוך request handlers — בסדר ב-startup, קטלני לכל בקשה." },
    { en: "Scaling a Node service by adding CPU to the pod — one process uses ~one core. Run one process per core (cluster/PM2) or more smaller pods.", he: "לבצע scale לשירות Node ע\"י הוספת CPU ל-pod — process אחד משתמש בערך בליבה אחת. להריץ process לכל ליבה (cluster/PM2) או יותר pods קטנים." },
    { en: "Accepting user-supplied regexes or unbounded input to vulnerable regexes (ReDoS). Use RE2 or input length limits.", he: "לקבל regex מהמשתמש או קלט לא מוגבל ל-regex פגיע (ReDoS). להשתמש ב-RE2 או במגבלות אורך קלט." },
    { en: "Recursive nextTick/Promise chains that starve IO — the service is 'up' but never answers.", he: "שרשראות nextTick/Promise רקורסיביות שמרעיבות את ה-IO — השירות 'למעלה' אבל אף פעם לא עונה." }
  ],
  interview: [
    { q: { en: "How can single-threaded Node.js handle thousands of concurrent requests?", he: "איך Node.js עם thread אחד מטפל באלפי בקשות במקביל?" },
      a: { en: "Because most of a request's life is waiting on IO. libuv registers sockets with epoll and the single JS thread only runs short callbacks when data is ready, so thousands of requests are in progress while the thread is busy only for microseconds each. Filesystem, DNS lookup and some crypto go to a 4-thread pool. It breaks down for CPU-heavy work, which is why you run a process per core and offload CPU to worker threads or other services.", he: "כי רוב החיים של בקשה הם המתנה ל-IO. libuv רושם את ה-sockets ב-epoll וה-thread היחיד של JS מריץ רק callbacks קצרים כשיש מידע מוכן, כך שאלפי בקשות בתהליך בזמן שה-thread עסוק רק מיקרו-שניות בכל אחת. File system, ‏DNS lookup וחלק מהקריפטו הולכים ל-pool של 4 threads. זה נשבר לעבודה כבדה ב-CPU, ולכן מריצים process לכל ליבה ומעבירים CPU ל-worker threads או לשירותים אחרים." } },
    { q: { en: "p99 latency of a Node API spikes every few minutes, CPU is 40%. What do you check?", he: "ה-p99 latency של API ב-Node קופץ כל כמה דקות, ה-CPU על 40%. מה אתה בודק?" },
      a: { en: "Event loop lag and ELU first — 40% average can hide 800 ms bursts on one core. Then a CPU profile during a spike (--cpu-prof, clinic flame) for sync work: a big JSON serialization, a periodic report, a regex. Also GC pauses (--trace-gc) and libuv pool saturation (dns.lookup without keep-alive). Fix by offloading, chunking or streaming, and add an alert on loop lag p99.", he: "קודם event loop lag ו-ELU — ממוצע של 40% יכול להסתיר פרצים של 800 ms על ליבה אחת. אחר כך CPU profile בזמן קפיצה (--cpu-prof, clinic flame) כדי למצוא עבודה סינכרונית: סריאליזציה של JSON גדול, דוח תקופתי, regex. גם עצירות GC (‏--trace-gc) ורוויה של ה-pool של libuv (‏dns.lookup בלי keep-alive). מתקנים ע\"י offloading, חלוקה לחתיכות או streaming, ומוסיפים התראה על p99 של loop lag." } }
  ],
  quiz: [
    { q: { en: "What prints first: a resolved Promise's .then or process.nextTick?", he: "מה מודפס קודם: ה-.then של Promise פתור או process.nextTick?" },
      options: [ { en: "Promise .then", he: "Promise .then" }, { en: "process.nextTick", he: "process.nextTick" }, { en: "Random", he: "אקראי" }, { en: "Neither runs until the next tick", he: "אף אחד לא רץ עד ה-tick הבא" } ],
      answer: 1, explain: { en: "Node drains the nextTick queue before the Promise microtask queue.", he: "Node מרוקן את תור ה-nextTick לפני תור ה-microtasks של Promise." } },
    { q: { en: "Which Node operation runs on the libuv thread pool?", he: "איזו פעולה ב-Node רצה על ה-thread pool של libuv?" },
      options: [ { en: "Reading from a TCP socket", he: "קריאה מ-TCP socket" }, { en: "fs.readFile", he: "fs.readFile" }, { en: "setTimeout", he: "setTimeout" }, { en: "Promise.resolve", he: "Promise.resolve" } ],
      answer: 1, explain: { en: "Network IO uses epoll on the loop; file system ops, dns.lookup, crypto and zlib use the pool.", he: "IO רשתי משתמש ב-epoll על ה-loop; פעולות file system, ‏dns.lookup, קריפטו ו-zlib משתמשים ב-pool." } },
    { q: { en: "Why does one KEYS * command hurt all Redis clients?", he: "למה פקודת KEYS * אחת פוגעת בכל הלקוחות של Redis?" },
      options: [ { en: "It locks the disk", he: "היא נועלת את הדיסק" }, { en: "Redis executes commands on a single event loop thread", he: "Redis מריץ פקודות על thread יחיד של event loop" }, { en: "It flushes the cache", he: "היא מרוקנת את ה-cache" }, { en: "It triggers replication", he: "היא מפעילה replication" } ],
      answer: 1, explain: { en: "O(N) work on the one command thread blocks everyone. Use SCAN.", he: "עבודה של O(N) על thread הפקודות היחיד חוסמת את כולם. להשתמש ב-SCAN." } },
    { q: { en: "Best fix for a 300 ms image resize inside a Node request handler?", he: "התיקון הכי טוב ל-resize של תמונה שלוקח 300 ms בתוך request handler ב-Node?" },
      options: [ { en: "Wrap it in a Promise", he: "לעטוף ב-Promise" }, { en: "Add await before it", he: "להוסיף await לפניו" }, { en: "Run it in worker_threads or a separate worker service", he: "להריץ ב-worker_threads או בשירות worker נפרד" }, { en: "Increase the pod memory", he: "להגדיל את הזיכרון של ה-pod" } ],
      answer: 2, explain: { en: "Wrapping sync CPU work in a Promise still runs it on the loop thread. It has to move to another thread/process.", he: "לעטוף עבודת CPU סינכרונית ב-Promise עדיין מריץ אותה על ה-thread של ה-loop. היא חייבת לעבור ל-thread/process אחר." } }
  ],
  related: ["pr-concurrency-parallelism", "pr-async-await", "pr-garbage-collection", "redis-deep", "obs-golden-signals", "pr-observability-plan"]
});

INFRA.lessons.push({
  id: "pr-async-await",
  track: "principal",
  order: 42,
  icon: "⏳",
  level: 3,
  minutes: 15,
  title: { en: "async/await Across Languages — and Its Traps", he: "async/await בכל השפות — והמלכודות שלו" },
  tldr: {
    en: "await doesn't make anything faster or parallel — it pauses this function and frees the thread until a result arrives; speed comes from starting independent work together, bounding it, and cancelling it.",
    he: "await לא הופך שום דבר למהיר יותר או מקבילי — הוא משהה את הפונקציה הזאת ומשחרר את ה-thread עד שמגיעה תוצאה; המהירות מגיעה מלהתחיל עבודות בלתי תלויות יחד, להגביל אותן, ולבטל אותן."
  },
  analogy: {
    en: "A Promise/Future is the buzzer the restaurant gives you when you order: not food yet, but a guarantee you'll be notified. 'await' is sitting down and doing nothing else until it buzzes — while the restaurant (the thread) keeps serving others. Sequential awaits is ordering the burger, waiting for the buzz, then ordering the fries, waiting again. Promise.all is ordering both at once and getting two buzzers. A semaphore is the rule 'max 3 open orders per family' so you don't flood the kitchen.",
    he: "Promise/Future זה הזמזם שנותנים לכם במסעדה כשמזמינים: זה עוד לא אוכל, אבל הבטחה שתקבלו התראה. 'await' זה לשבת ולא לעשות כלום אחר עד שהוא מזמזם — בזמן שהמסעדה (ה-thread) ממשיכה לשרת אחרים. awaits סדרתיים זה להזמין המבורגר, לחכות לזמזום, ואז להזמין צ'יפס ולחכות שוב. Promise.all זה להזמין את שניהם ביחד ולקבל שני זמזמים. Semaphore זה הכלל 'מקסימום 3 הזמנות פתוחות למשפחה' כדי לא להציף את המטבח."
  },
  sections: [
    {
      h: { en: "From callbacks to promises to async/await", he: "מ-callbacks ל-promises ל-async/await" },
      body: {
        en: `<p>Three generations of the same idea — "run this when the result is ready":</p>
<pre>// 1. callbacks (pyramid of doom, errors easy to lose)
getUser(id, (err, user) =&gt; { if (err) return cb(err);
  getOrders(user, (err, orders) =&gt; { /* ... */ }); });

// 2. promises (chainable value-of-the-future)
getUser(id).then(u =&gt; getOrders(u)).then(render).catch(handle);

// 3. async/await (reads like sync code, still non-blocking)
async function page(id) {
  try { const u = await getUser(id); const o = await getOrders(u); return render(o); }
  catch (e) { handle(e); }
}</pre>
<p><strong>What await really does</strong>: the compiler turns the async function into a <em>state machine</em>. At each <code>await</code> it saves locals and the "resume point" on the heap, returns a pending Promise to the caller, and frees the thread. When the awaited Promise settles, the continuation is scheduled (as a microtask in JS) and the function resumes at the next state. No thread is parked while waiting — that's the whole win.</p>
<blockquote>💡 Real world: C# introduced async/await in 2012; JS (ES2017), Python 3.5, Rust, Kotlin (suspend) and Swift followed. Go deliberately didn't: goroutines are cheap enough that you write blocking-looking code and the runtime parks the goroutine. Java 21's <em>virtual threads</em> took the Go route — plain blocking JDBC/HTTP code that scales like async.</blockquote>`,
        he: `<p>שלושה דורות של אותו רעיון — "תריץ את זה כשהתוצאה מוכנה":</p>
<pre>// 1. callbacks (pyramid of doom, errors easy to lose)
getUser(id, (err, user) =&gt; { if (err) return cb(err);
  getOrders(user, (err, orders) =&gt; { /* ... */ }); });

// 2. promises (chainable value-of-the-future)
getUser(id).then(u =&gt; getOrders(u)).then(render).catch(handle);

// 3. async/await (reads like sync code, still non-blocking)
async function page(id) {
  try { const u = await getUser(id); const o = await getOrders(u); return render(o); }
  catch (e) { handle(e); }
}</pre>
<p><strong>מה await עושה באמת</strong>: הקומפיילר הופך את הפונקציה האסינכרונית ל-<em>state machine</em>. בכל <code>await</code> הוא שומר את המשתנים המקומיים ואת "נקודת ההמשך" על ה-heap, מחזיר Promise ממתין לקורא, ומשחרר את ה-thread. כשה-Promise שחיכינו לו מסתיים, ההמשך מתוזמן (כ-microtask ב-JS) והפונקציה ממשיכה ב-state הבא. שום thread לא חונה בזמן ההמתנה — זה כל הרווח.</p>
<blockquote>💡 מהשטח: C# הציגה async/await ב-2012; ‏JS (‏ES2017), ‏Python 3.5, ‏Rust, ‏Kotlin (‏suspend) ו-Swift הלכו בעקבותיה. Go בכוונה לא: goroutines זולים מספיק כדי לכתוב קוד שנראה חוסם, וה-runtime מחנה את ה-goroutine. ה-<em>virtual threads</em> של Java 21 הלכו בדרך של Go — קוד JDBC/HTTP חוסם רגיל שעושה scale כמו async.</blockquote>`
      }
    },
    {
      h: { en: "Trap #1: sequential awaits (the silent 3× latency)", he: "מלכודת #1: awaits סדרתיים (פי 3 latency בשקט)" },
      body: {
        en: `<pre>// 3 independent calls, 100 ms each
const user  = await getUser(id);       // 100 ms
const feed  = await getFeed(id);       // +100 ms
const promo = await getPromo(id);      // +100 ms  =&gt; 300 ms total

// start all, then wait: ~100 ms
const [user, feed, promo] = await Promise.all([getUser(id), getFeed(id), getPromo(id)]);

// one failure shouldn't kill the page? allSettled:
const results = await Promise.allSettled([getUser(id), getFeed(id), getPromo(id)]);
// [{status:'fulfilled', value}, {status:'rejected', reason}, ...]</pre>
<pre># Python
user, feed, promo = await asyncio.gather(get_user(i), get_feed(i), get_promo(i))
# 3.11+: structured concurrency — if one fails, the others are cancelled
async with asyncio.TaskGroup() as tg:
    u = tg.create_task(get_user(i)); f = tg.create_task(get_feed(i))
print(u.result(), f.result())</pre>
<pre>// C#
var userT = GetUserAsync(id); var feedT = GetFeedAsync(id);
await Task.WhenAll(userT, feedT);</pre>
<p>Only parallelize what's truly independent. If <code>getOrders</code> needs <code>user.id</code>, it must wait. Draw the dependency graph of a request: latency = the <em>critical path</em>, not the sum.</p>
<blockquote>💡 Real world: Fan-out with <code>Promise.all</code> also multiplies tail risk — the page is as slow as the slowest of N calls. With 10 calls each with a 1% chance of a 1 s response, ~10% of pages hit 1 s. Add per-call timeouts and graceful fallbacks (<code>allSettled</code>).</blockquote>`,
        he: `<pre>// 3 independent calls, 100 ms each
const user  = await getUser(id);       // 100 ms
const feed  = await getFeed(id);       // +100 ms
const promo = await getPromo(id);      // +100 ms  =&gt; 300 ms total

// start all, then wait: ~100 ms
const [user, feed, promo] = await Promise.all([getUser(id), getFeed(id), getPromo(id)]);

// one failure shouldn't kill the page? allSettled:
const results = await Promise.allSettled([getUser(id), getFeed(id), getPromo(id)]);
// [{status:'fulfilled', value}, {status:'rejected', reason}, ...]</pre>
<pre># Python
user, feed, promo = await asyncio.gather(get_user(i), get_feed(i), get_promo(i))
# 3.11+: structured concurrency — if one fails, the others are cancelled
async with asyncio.TaskGroup() as tg:
    u = tg.create_task(get_user(i)); f = tg.create_task(get_feed(i))
print(u.result(), f.result())</pre>
<pre>// C#
var userT = GetUserAsync(id); var feedT = GetFeedAsync(id);
await Task.WhenAll(userT, feedT);</pre>
<p>מקבלים רק מה שבאמת בלתי תלוי. אם <code>getOrders</code> צריך את <code>user.id</code>, הוא חייב לחכות. ציירו את גרף התלויות של הבקשה: ה-latency הוא ה-<em>critical path</em>, לא הסכום.</p>
<blockquote>💡 מהשטח: fan-out עם <code>Promise.all</code> גם מכפיל את סיכון הזנב — הדף איטי כמו האיטית מבין N הקריאות. עם 10 קריאות, לכל אחת סיכוי של 1% לתשובה של שנייה, ~10% מהדפים יגיעו לשנייה. מוסיפים timeout לכל קריאה ו-fallbacks עדינים (<code>allSettled</code>).</blockquote>`
      }
    },
    {
      h: { en: "Traps #2-#6: forgotten await, forEach, unhandled rejections, blocking, sync-over-async", he: "מלכודות #2-#6: await שנשכח, forEach, rejections לא מטופלים, חסימה, sync-over-async" },
      body: {
        en: `<ul>
<li><strong>Forgotten await</strong>: <code>saveAudit(evt);</code> without await — fire-and-forget; errors vanish, the request returns before the write, tests pass flakily. Lint it: <code>@typescript-eslint/no-floating-promises</code>; Python warns "coroutine was never awaited".</li>
<li><strong>async inside forEach</strong>: <code>items.forEach(async i =&gt; await save(i))</code> doesn't wait for anything. Use <code>for (const i of items) await save(i)</code> (sequential) or <code>await Promise.all(items.map(save))</code> (concurrent, but see limits below).</li>
<li><strong>Unhandled rejections</strong>: since Node 15 they <em>crash the process</em> by default. Every promise needs an owner that awaits or catches it.</li>
<li><strong>Blocking inside async</strong>: <code>time.sleep</code>, sync DB drivers, <code>fs.readFileSync</code>, heavy CPU — the function is "async" but the loop is frozen (see the event loop lesson).</li>
<li><strong>Sync-over-async deadlock (C#)</strong>: calling <code>.Result</code> or <code>.Wait()</code> on a Task in a context with a SynchronizationContext (classic ASP.NET, WinForms/WPF UI thread). The thread blocks waiting for the task; the task's continuation needs that same thread → deadlock. Fix: "async all the way down"; in libraries use <code>ConfigureAwait(false)</code>. ASP.NET Core has no context, but <code>.Result</code> still causes <strong>thread-pool starvation</strong> under load.</li>
</ul>
<pre>// C# — deadlocks on a UI thread / classic ASP.NET
public string Get() =&gt; GetAsync().Result;            // ❌
public async Task&lt;string&gt; Get() =&gt; await GetAsync(); // ✅</pre>`,
        he: `<ul>
<li><strong>await שנשכח</strong>: <code>saveAudit(evt);</code> בלי await — fire-and-forget; שגיאות נעלמות, הבקשה חוזרת לפני הכתיבה, וטסטים עוברים באופן לא יציב. לתפוס עם lint: <code>@typescript-eslint/no-floating-promises</code>; ‏Python מזהיר "coroutine was never awaited".</li>
<li><strong>async בתוך forEach</strong>: <code>items.forEach(async i =&gt; await save(i))</code> לא מחכה לכלום. להשתמש ב-<code>for (const i of items) await save(i)</code> (סדרתי) או <code>await Promise.all(items.map(save))</code> (מקבילי, אבל ראו מגבלות למטה).</li>
<li><strong>Rejections לא מטופלים</strong>: מאז Node 15 הם <em>מפילים את ה-process</em> כברירת מחדל. לכל promise צריך בעלים שעושה לו await או catch.</li>
<li><strong>חסימה בתוך async</strong>: <code>time.sleep</code>, ‏drivers סינכרוניים ל-DB, ‏<code>fs.readFileSync</code>, ‏CPU כבד — הפונקציה "אסינכרונית" אבל ה-loop קפוא (ראו את השיעור על ה-event loop).</li>
<li><strong>Deadlock של sync-over-async (C#)</strong>: לקרוא ל-<code>.Result</code> או <code>.Wait()</code> על Task בקונטקסט עם SynchronizationContext (‏ASP.NET הקלאסי, ה-UI thread של WinForms/WPF). ה-thread נחסם ומחכה ל-task; ההמשך של ה-task צריך את אותו thread בדיוק → deadlock. התיקון: "async all the way down"; בספריות להשתמש ב-<code>ConfigureAwait(false)</code>. ב-ASP.NET Core אין context, אבל <code>.Result</code> עדיין גורם ל-<strong>thread-pool starvation</strong> תחת עומס.</li>
</ul>
<pre>// C# — deadlocks on a UI thread / classic ASP.NET
public string Get() =&gt; GetAsync().Result;            // ❌
public async Task&lt;string&gt; Get() =&gt; await GetAsync(); // ✅</pre>`
      }
    },
    {
      h: { en: "Bounding concurrency and backpressure", he: "הגבלת concurrency ו-backpressure" },
      body: {
        en: `<p><code>await Promise.all(urls.map(fetch))</code> over 100k URLs opens 100k sockets at once: you run out of file descriptors, get rate-limited, or DDoS your own dependency. Concurrency must be <strong>bounded</strong>.</p>
<pre>// JS: p-limit (or a hand-rolled worker pool)
import pLimit from 'p-limit';
const limit = pLimit(20);                         // max 20 in flight
await Promise.all(urls.map(u =&gt; limit(() =&gt; fetch(u))));

# Python: semaphore
sem = asyncio.Semaphore(20)
async def fetch_one(u):
    async with sem:
        return await client.get(u)
await asyncio.gather(*(fetch_one(u) for u in urls))

// Go: buffered channel as a semaphore
sem := make(chan struct{}, 20)
for _, u := range urls { sem &lt;- struct{}{}; go func(u string){ defer func(){ &lt;-sem }(); get(u) }(u) }</pre>
<p><strong>Backpressure</strong> is the consumer telling the producer "slow down". Streams do it natively (Node <code>stream.pipeline</code> and <code>highWaterMark</code>; Reactive Streams <code>request(n)</code>; gRPC flow control; Kafka consumers pull). Without it, an unbounded in-memory queue between a fast producer and a slow consumer grows until OOM. Choose: block the producer, drop (load shedding), or buffer to durable storage (a real queue).</p>
<blockquote>⚠️ Production tip: Size the limit from the downstream's budget, not your appetite: if the API allows 50 req/s at 200 ms latency, Little's Law says ~10 in flight is the max useful concurrency.</blockquote>`,
        he: `<p><code>await Promise.all(urls.map(fetch))</code> על 100k כתובות פותח 100k sockets בבת אחת: נגמרים לכם ה-file descriptors, אתם מקבלים rate limit, או עושים DDoS לתלות של עצמכם. Concurrency חייב להיות <strong>מוגבל</strong>.</p>
<pre>// JS: p-limit (or a hand-rolled worker pool)
import pLimit from 'p-limit';
const limit = pLimit(20);                         // max 20 in flight
await Promise.all(urls.map(u =&gt; limit(() =&gt; fetch(u))));

# Python: semaphore
sem = asyncio.Semaphore(20)
async def fetch_one(u):
    async with sem:
        return await client.get(u)
await asyncio.gather(*(fetch_one(u) for u in urls))

// Go: buffered channel as a semaphore
sem := make(chan struct{}, 20)
for _, u := range urls { sem &lt;- struct{}{}; go func(u string){ defer func(){ &lt;-sem }(); get(u) }(u) }</pre>
<p><strong>Backpressure</strong> זה ה-consumer שאומר ל-producer "תאט". Streams עושים את זה מובנה (‏<code>stream.pipeline</code> ו-<code>highWaterMark</code> ב-Node; ‏<code>request(n)</code> ב-Reactive Streams; ‏flow control ב-gRPC; ‏Kafka consumers מושכים). בלי זה, תור לא מוגבל בזיכרון בין producer מהיר ל-consumer איטי גדל עד OOM. בוחרים: לחסום את ה-producer, לזרוק (load shedding), או לעשות buffer לאחסון עמיד (תור אמיתי).</p>
<blockquote>⚠️ טיפ לפרודקשן: קובעים את המגבלה לפי התקציב של ה-downstream, לא לפי התיאבון שלכם: אם ה-API מאפשר 50 req/s עם latency של 200 ms, ‏Little's Law אומר ש-~10 בקשות באוויר זה ה-concurrency המקסימלי שמועיל.</blockquote>`
      }
    },
    {
      h: { en: "Cancellation and timeouts", he: "ביטול ו-timeouts" },
      body: {
        en: `<p>A user closes the tab; the gateway times out at 5 s — but your service keeps running 3 DB queries for nobody. Every async call needs a deadline and a way to stop.</p>
<pre>// JS: AbortController (fetch, Node streams and timers support it)
const res = await fetch(url, { signal: AbortSignal.timeout(2000) });  // throws TimeoutError

# Python
async with asyncio.timeout(2):          # 3.11+
    data = await client.get(url)

// C#: CancellationToken flows through the whole call chain
using var cts = CancellationTokenSource.CreateLinkedTokenSource(httpContext.RequestAborted);
cts.CancelAfter(TimeSpan.FromSeconds(2));
await db.QueryAsync(sql, cancellationToken: cts.Token);

// Go: context.Context — the gold standard
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second); defer cancel()
row := db.QueryRowContext(ctx, q)</pre>
<p><strong>Propagate deadlines</strong>, don't reset them: if the caller has 800 ms left, your downstream calls get at most ~800 ms minus your own work (gRPC does this with the <code>grpc-timeout</code> header). <strong>Structured concurrency</strong> (Python TaskGroup, Kotlin coroutineScope, Java StructuredTaskScope, Go errgroup) ties child tasks to a scope: when the scope ends or one child fails, the rest are cancelled — no orphaned tasks leaking work.</p>`,
        he: `<p>משתמש סוגר את הטאב; ה-gateway עושה timeout אחרי 5 שניות — אבל השירות שלכם ממשיך להריץ 3 שאילתות DB בשביל אף אחד. כל קריאה אסינכרונית צריכה deadline ודרך לעצור.</p>
<pre>// JS: AbortController (fetch, Node streams and timers support it)
const res = await fetch(url, { signal: AbortSignal.timeout(2000) });  // throws TimeoutError

# Python
async with asyncio.timeout(2):          # 3.11+
    data = await client.get(url)

// C#: CancellationToken flows through the whole call chain
using var cts = CancellationTokenSource.CreateLinkedTokenSource(httpContext.RequestAborted);
cts.CancelAfter(TimeSpan.FromSeconds(2));
await db.QueryAsync(sql, cancellationToken: cts.Token);

// Go: context.Context — the gold standard
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second); defer cancel()
row := db.QueryRowContext(ctx, q)</pre>
<p><strong>מעבירים deadlines הלאה</strong>, לא מאפסים אותם: אם לקורא נשארו 800 ms, הקריאות שלכם ל-downstream מקבלות לכל היותר ~800 ms פחות העבודה שלכם (‏gRPC עושה את זה עם ה-header <code>grpc-timeout</code>). <strong>Structured concurrency</strong> (‏TaskGroup ב-Python, ‏coroutineScope ב-Kotlin, ‏StructuredTaskScope ב-Java, ‏errgroup ב-Go) קושר tasks ילדים ל-scope: כשה-scope נגמר או שילד אחד נכשל, השאר מבוטלים — אין tasks יתומים שממשיכים לעבוד.</p>`
      }
    }
  ],
  diagram: `sequential awaits (300 ms)              Promise.all / gather (100 ms)
t=0     100     200     300            t=0     100
|getUser|                               |getUser |
        |getFeed|                       |getFeed |
                |getPromo|              |getPromo|
                         -> render               -> render

what await does to the thread:
thread: [run f() until await]──free──[other requests...]──free──[resume f() with result]
f():    state0 ──await──── (locals + resume point saved on heap) ────► state1 ──► return`,
  handsOn: [
    { cmd: "node -e \"const s=ms=>new Promise(r=>setTimeout(r,ms));(async()=>{console.time('seq');await s(300);await s(300);console.timeEnd('seq');console.time('all');await Promise.all([s(300),s(300)]);console.timeEnd('all')})()\"", what: { en: "Measure sequential awaits (~600 ms) vs Promise.all (~300 ms).", he: "למדוד awaits סדרתיים (~600 ms) מול Promise.all (~300 ms)." } },
    { cmd: "python -c \"import asyncio,time;exec('async def m():\\n t=time.time()\\n await asyncio.gather(*[asyncio.sleep(1) for _ in range(10000)])\\n print(round(time.time()-t,2),\\\"s for 10k tasks\\\")');asyncio.run(m())\"", what: { en: "10,000 concurrent coroutines finish in ~1 s on one thread.", he: "10,000 coroutines במקביל מסתיימים תוך ~שנייה על thread אחד." } },
    { cmd: "node -e \"Promise.reject(new Error('nobody caught me'))\"; echo exit=$?", what: { en: "See an unhandled rejection crash Node (exit code 1).", he: "לראות rejection לא מטופל מפיל את Node (‏exit code 1)." } },
    { cmd: "python -X dev -c \"import asyncio;exec('async def f(): pass\\nasync def m(): f()');asyncio.run(m())\"", what: { en: "Python warns 'coroutine was never awaited' — the forgotten-await bug.", he: "Python מזהיר 'coroutine was never awaited' — הבאג של await שנשכח." } }
  ],
  mnemonic: {
    en: "Start together, await together, limit the crowd, set a deadline, never block, never forget.",
    he: "מתחילים יחד, מחכים יחד, מגבילים את הקהל, קובעים deadline, לא חוסמים, לא שוכחים."
  },
  pitfalls: [
    { en: "Awaiting independent calls one by one — latency becomes the sum instead of the max.", he: "לעשות await לקריאות בלתי תלויות אחת אחרי השנייה — ה-latency הופך לסכום במקום למקסימום." },
    { en: "Unbounded Promise.all over a big list — thousands of sockets, rate limits, OOM. Always cap concurrency.", he: "Promise.all לא מוגבל על רשימה גדולה — אלפי sockets, ‏rate limits, ‏OOM. תמיד להגביל concurrency." },
    { en: "Calling .Result/.Wait() on Tasks in C# — deadlocks with a sync context, thread-pool starvation without one.", he: "לקרוא ל-.Result/.Wait() על Tasks ב-C# — deadlock עם sync context, ו-thread-pool starvation בלעדיו." },
    { en: "No timeouts/cancellation — abandoned requests keep consuming DB and downstream capacity during an incident, making it worse.", he: "בלי timeouts/ביטול — בקשות נטושות ממשיכות לצרוך DB ו-downstream בזמן תקלה ומחמירות אותה." }
  ],
  interview: [
    { q: { en: "Does async/await make code run in parallel?", he: "האם async/await גורם לקוד לרוץ במקביל?" },
      a: { en: "No. It makes waiting non-blocking: at each await the function suspends and the thread serves other work. Concurrency comes from starting several operations before awaiting them (Promise.all, gather, WhenAll). True CPU parallelism still needs multiple threads or processes; in JS/Python, async usually runs on a single thread.", he: "לא. הוא הופך המתנה ללא-חוסמת: בכל await הפונקציה מושהית וה-thread משרת עבודה אחרת. Concurrency מגיע מלהתחיל כמה פעולות לפני שעושים להן await (‏Promise.all, ‏gather, ‏WhenAll). Parallelism אמיתי של CPU עדיין דורש כמה threads או processes; ב-JS/Python, ‏async בדרך כלל רץ על thread אחד." } },
    { q: { en: "You need to call an external API for 50,000 records. How do you write it?", he: "צריך לקרוא ל-API חיצוני עבור 50,000 רשומות. איך תכתוב את זה?" },
      a: { en: "Bounded concurrency (semaphore/p-limit/worker pool) sized from the API's rate limit and latency; a per-call timeout and retries with backoff+jitter on retryable errors only; idempotent requests so retries are safe; allSettled-style collection of failures into a retry list or DLQ; checkpointed progress so a crash resumes instead of restarting; and if it recurs, push the records to a queue and let workers consume at a controlled rate.", he: "concurrency מוגבל (‏semaphore/p-limit/worker pool) לפי ה-rate limit וה-latency של ה-API; ‏timeout לכל קריאה ו-retries עם backoff+jitter רק על שגיאות שמותר לנסות שוב; בקשות אידמפוטנטיות כדי ש-retries יהיו בטוחים; איסוף כשלונות בסגנון allSettled לרשימת retry או DLQ; ‏checkpoint של התקדמות כדי שקריסה תמשיך ולא תתחיל מחדש; ואם זה חוזר, לדחוף את הרשומות לתור ולתת ל-workers לצרוך בקצב מבוקר." } }
  ],
  quiz: [
    { q: { en: "Three independent 200 ms calls awaited one after another take about:", he: "שלוש קריאות בלתי תלויות של 200 ms עם await אחת אחרי השנייה לוקחות בערך:" },
      options: [ { en: "200 ms", he: "200 ms" }, { en: "600 ms", he: "600 ms" }, { en: "67 ms", he: "67 ms" }, { en: "400 ms", he: "400 ms" } ],
      answer: 1, explain: { en: "Sequential awaits add up. Promise.all would be ~200 ms.", he: "awaits סדרתיים מצטברים. Promise.all היה לוקח ~200 ms." } },
    { q: { en: "items.forEach(async i =&gt; await save(i)); console.log('done') — when does 'done' print?", he: "items.forEach(async i =&gt; await save(i)); console.log('done') — מתי 'done' מודפס?" },
      options: [ { en: "After all saves", he: "אחרי כל השמירות" }, { en: "Before the saves finish", he: "לפני שהשמירות מסתיימות" }, { en: "Never", he: "אף פעם" }, { en: "After the first save", he: "אחרי השמירה הראשונה" } ],
      answer: 1, explain: { en: "forEach ignores the returned promises.", he: "forEach מתעלם מה-promises שמוחזרים." } },
    { q: { en: "Why does task.Result deadlock in a classic ASP.NET or UI app?", he: "למה task.Result עושה deadlock באפליקציית ASP.NET קלאסית או UI?" },
      options: [ { en: "The GC pauses", he: "ה-GC עוצר" }, { en: "The blocked thread is the one the continuation needs to resume on", he: "ה-thread החסום הוא בדיוק זה שההמשך צריך כדי לרוץ" }, { en: "Tasks can't return values", he: "Tasks לא יכולים להחזיר ערכים" }, { en: "The thread pool is empty", he: "ה-thread pool ריק" } ],
      answer: 1, explain: { en: "The SynchronizationContext posts the continuation to the blocked thread — a circular wait.", he: "ה-SynchronizationContext שולח את ההמשך ל-thread החסום — המתנה מעגלית." } },
    { q: { en: "Best tool to keep at most 20 outbound calls in flight in asyncio?", he: "הכלי הכי טוב לשמור לכל היותר 20 קריאות יוצאות באוויר ב-asyncio?" },
      options: [ { en: "asyncio.Semaphore(20)", he: "asyncio.Semaphore(20)" }, { en: "time.sleep between calls", he: "time.sleep בין קריאות" }, { en: "threading.Lock", he: "threading.Lock" }, { en: "A longer timeout", he: "timeout ארוך יותר" } ],
      answer: 0, explain: { en: "A semaphore bounds concurrency without blocking the loop.", he: "Semaphore מגביל concurrency בלי לחסום את ה-loop." } }
  ],
  related: ["pr-event-loop", "pr-concurrency-parallelism", "pr-third-party-deps", "pr-rate-limiters", "arch-resilience", "staff-queueing-tail-latency"]
});

INFRA.lessons.push({
  id: "pr-garbage-collection",
  track: "principal",
  order: 43,
  icon: "🗑️",
  level: 3,
  minutes: 17,
  title: { en: "Garbage Collection: Memory, Pauses and Leaks", he: "Garbage Collection: זיכרון, עצירות ודליפות" },
  tldr: {
    en: "GC trades CPU and pause time for not having to free memory yourself; most objects die young, so runtimes split the heap into generations — and in containers, the heap limit must fit under the cgroup limit or the kernel kills you before the GC can help.",
    he: "GC מחליף CPU וזמן עצירה בכך שלא צריך לשחרר זיכרון בעצמך; רוב האובייקטים מתים צעירים, אז ה-runtimes מחלקים את ה-heap לדורות — ובקונטיינרים, מגבלת ה-heap חייבת להיכנס מתחת למגבלת ה-cgroup, אחרת ה-kernel הורג אותך לפני שה-GC מספיק לעזור."
  },
  analogy: {
    en: "The heap is an office. Manual memory (C) is everyone cleaning their own desk — fast, but someone always forgets (leak) or throws out a file a colleague still uses (use-after-free). Reference counting is a sticky note on every file saying how many people use it; at zero it goes to the bin — but two files pointing at each other never reach zero. Tracing GC is the cleaning crew: they start from the people at their desks (roots), follow every file they're holding and every file those reference, and bin everything unreached. Generational GC knows that coffee cups (temporary objects) die within minutes while contracts live for years — so it cleans the kitchen every hour and the archive once a quarter. Stop-the-world is the crew asking everyone to freeze while they sweep.",
    he: "ה-heap הוא משרד. זיכרון ידני (C) זה שכל אחד מנקה את השולחן שלו — מהיר, אבל תמיד מישהו שוכח (leak) או זורק קובץ שעמית עוד משתמש בו (use-after-free). Reference counting זה פתק דביק על כל קובץ שאומר כמה אנשים משתמשים בו; באפס הוא הולך לפח — אבל שני קבצים שמצביעים אחד על השני אף פעם לא מגיעים לאפס. Tracing GC זה צוות הניקיון: הם מתחילים מהאנשים שיושבים ליד השולחנות (roots), עוקבים אחרי כל קובץ שהם מחזיקים וכל קובץ שהוא מפנה אליו, וזורקים כל מה שלא הגיעו אליו. GC דורי יודע שכוסות קפה (אובייקטים זמניים) מתות תוך דקות וחוזים חיים שנים — אז הוא מנקה את המטבח כל שעה ואת הארכיון פעם ברבעון. Stop-the-world זה צוות הניקיון שמבקש מכולם לקפוא בזמן שהם מטאטאים."
  },
  sections: [
    {
      h: { en: "Stack vs heap, and the four ways to free memory", he: "Stack מול heap, וארבע הדרכים לשחרר זיכרון" },
      body: {
        en: `<p>The <strong>stack</strong> holds function frames: locals, return addresses. Allocation is a pointer bump, freeing is automatic on return, per-thread, tiny (default ~1-8 MB). The <strong>heap</strong> holds everything that outlives a call or has dynamic size — and someone must free it.</p>
<table>
<tr><th>Strategy</th><th>Languages</th><th>Pros</th><th>Cons</th></tr>
<tr><td>Manual <code>malloc/free</code></td><td>C</td><td>Full control, zero runtime</td><td>Leaks, double free, use-after-free (~70% of Chrome/Microsoft CVEs are memory-safety bugs)</td></tr>
<tr><td>Ownership / RAII</td><td>Rust, C++ (smart pointers)</td><td>Deterministic, no pauses, freed at scope end</td><td>Learning curve (borrow checker), cycles need Weak/Rc care</td></tr>
<tr><td>Reference counting</td><td>Python (CPython), Swift/ObjC (ARC), PHP</td><td>Immediate freeing, predictable</td><td>Cycles leak (Python adds a cycle collector), counter updates cost CPU/cache</td></tr>
<tr><td>Tracing GC</td><td>Java, C#, Go, JS, Ruby, Erlang</td><td>Handles cycles, fast allocation, safe</td><td>Pauses, CPU overhead, needs memory headroom (often 2-3× live data)</td></tr>
</table>
<p>Escape analysis blurs the line: Go and the JVM put objects on the stack when they prove a pointer never escapes the function — no GC cost at all. <code>go build -gcflags=-m</code> shows what escapes.</p>`,
        he: `<p>ה-<strong>stack</strong> מחזיק frames של פונקציות: משתנים מקומיים, כתובות חזרה. הקצאה היא הזזת pointer, השחרור אוטומטי ב-return, לכל thread בנפרד, קטן (ברירת מחדל ~1-8 MB). ה-<strong>heap</strong> מחזיק כל מה שחי יותר מקריאה אחת או שגודלו דינמי — ומישהו צריך לשחרר אותו.</p>
<table>
<tr><th>אסטרטגיה</th><th>שפות</th><th>יתרונות</th><th>חסרונות</th></tr>
<tr><td>ידני <code>malloc/free</code></td><td>C</td><td>שליטה מלאה, אפס runtime</td><td>Leaks, ‏double free, ‏use-after-free (~70% מה-CVEs של Chrome/Microsoft הם באגי memory safety)</td></tr>
<tr><td>Ownership / RAII</td><td>Rust, ‏C++ (‏smart pointers)</td><td>דטרמיניסטי, בלי עצירות, משוחרר בסוף ה-scope</td><td>עקומת למידה (‏borrow checker), מעגלים דורשים זהירות עם Weak/Rc</td></tr>
<tr><td>Reference counting</td><td>Python (‏CPython), ‏Swift/ObjC (‏ARC), ‏PHP</td><td>שחרור מיידי וצפוי</td><td>מעגלים דולפים (‏Python מוסיף cycle collector), עדכוני counters עולים CPU/cache</td></tr>
<tr><td>Tracing GC</td><td>Java, ‏C#, ‏Go, ‏JS, ‏Ruby, ‏Erlang</td><td>מטפל במעגלים, הקצאה מהירה, בטוח</td><td>עצירות, תקורת CPU, צריך מרווח זיכרון (לרוב פי 2-3 מהמידע החי)</td></tr>
</table>
<p>Escape analysis מטשטש את הגבול: Go וה-JVM שמים אובייקטים על ה-stack כשהם מוכיחים שה-pointer לא בורח מהפונקציה — אפס עלות GC. ‏<code>go build -gcflags=-m</code> מראה מה בורח.</p>`
      }
    },
    {
      h: { en: "How tracing GC works: mark, sweep, compact, generations", he: "איך tracing GC עובד: mark, ‏sweep, ‏compact, דורות" },
      body: {
        en: `<ul>
<li><strong>Roots</strong>: thread stacks, registers, static/global variables. Everything reachable from roots is alive; everything else is garbage — regardless of cycles.</li>
<li><strong>Mark-sweep</strong>: mark reachable objects, then sweep (free) unmarked ones. Leaves holes → fragmentation.</li>
<li><strong>Mark-compact</strong>: after marking, slide live objects together. No fragmentation, allocation becomes a pointer bump, but moving objects means updating every reference.</li>
<li><strong>Copying</strong>: copy live objects from "from-space" to "to-space". Cost is proportional to <em>live</em> objects, not garbage — perfect when almost everything is dead.</li>
<li><strong>Generational hypothesis</strong>: most objects die young (request DTOs, strings, temporary lists). So: a small <em>young generation</em> collected often with copying (minor GC, ~1-10 ms), survivors promoted to the <em>old generation</em>, collected rarely (major/full GC). A <em>write barrier</em> tracks old→young pointers so minor GC doesn't scan the whole old gen.</li>
<li><strong>Concurrent / tri-color marking</strong>: objects are white (unvisited), grey (visited, children pending), black (done). The GC marks while the app ("mutator") keeps running; write barriers catch pointer changes so a live object is never left white. This is how ZGC, Shenandoah, Go and V8 keep pauses in the low milliseconds.</li>
</ul>
<blockquote>💡 Real world: GC cost has three dials you trade: <strong>throughput</strong> (% CPU spent in app vs GC), <strong>latency</strong> (pause length), <strong>footprint</strong> (heap headroom). Pick two. Batch jobs want throughput (Parallel GC); APIs want latency (G1/ZGC); small containers want footprint (Serial, lower GOGC).</blockquote>`,
        he: `<ul>
<li><strong>Roots</strong>: ה-stacks של ה-threads, רגיסטרים, משתנים סטטיים/גלובליים. כל מה שנגיש מה-roots חי; כל השאר זבל — גם אם יש מעגלים.</li>
<li><strong>Mark-sweep</strong>: מסמנים אובייקטים נגישים, ואז מטאטאים (משחררים) את מי שלא סומן. משאיר חורים → פרגמנטציה.</li>
<li><strong>Mark-compact</strong>: אחרי הסימון, מזיזים את האובייקטים החיים צמוד. אין פרגמנטציה, הקצאה הופכת להזזת pointer, אבל הזזת אובייקטים אומרת לעדכן כל הפניה.</li>
<li><strong>Copying</strong>: מעתיקים אובייקטים חיים מ-"from-space" ל-"to-space". העלות פרופורציונלית לאובייקטים <em>החיים</em>, לא לזבל — מושלם כשכמעט הכול מת.</li>
<li><strong>ההשערה הדורית</strong>: רוב האובייקטים מתים צעירים (‏DTOs של בקשה, strings, רשימות זמניות). לכן: <em>דור צעיר</em> קטן שנאסף לעתים קרובות עם copying (‏minor GC, ~1-10 ms), מי ששורד מקודם ל-<em>דור הוותיק</em>, שנאסף לעתים רחוקות (‏major/full GC). ‏<em>Write barrier</em> עוקב אחרי pointers מוותיק לצעיר כדי ש-minor GC לא יסרוק את כל הדור הוותיק.</li>
<li><strong>Concurrent / tri-color marking</strong>: אובייקטים לבנים (לא בוקרו), אפורים (בוקרו, ילדים ממתינים), שחורים (גמור). ה-GC מסמן בזמן שהאפליקציה ("mutator") ממשיכה לרוץ; ‏write barriers תופסים שינויי pointers כדי שאובייקט חי לא יישאר לבן. ככה ZGC, ‏Shenandoah, ‏Go ו-V8 שומרים על עצירות של מילישניות בודדות.</li>
</ul>
<blockquote>💡 מהשטח: לעלות של GC יש שלושה כפתורים שמחליפים ביניהם: <strong>throughput</strong> (‏% CPU באפליקציה מול ב-GC), ‏<strong>latency</strong> (אורך עצירה), ‏<strong>footprint</strong> (מרווח heap). בוחרים שניים. Batch jobs רוצים throughput (‏Parallel GC); ‏APIs רוצים latency (‏G1/ZGC); קונטיינרים קטנים רוצים footprint (‏Serial, ‏GOGC נמוך יותר).</blockquote>`
      }
    },
    {
      h: { en: "The runtimes you'll meet in production", he: "ה-runtimes שתפגשו בפרודקשן" },
      body: {
        en: `<table>
<tr><th>Runtime</th><th>Collectors / model</th><th>Key knobs</th></tr>
<tr><td><strong>JVM</strong></td><td>Serial (1 CPU/small heaps), Parallel (throughput), <strong>G1</strong> (default since 9, region-based, pause target), <strong>ZGC</strong> (generational since 21, sub-ms pauses, TB heaps), Shenandoah</td><td><code>-XX:+UseZGC -XX:+ZGenerational</code>, <code>-XX:MaxGCPauseMillis=200</code>, <code>-Xmx</code>/<code>-XX:MaxRAMPercentage=75</code>, <code>-Xlog:gc*</code></td></tr>
<tr><td><strong>.NET</strong></td><td>Generational gen0/gen1/gen2 + <strong>LOH</strong> (objects ≥ 85 KB, collected with gen2); Workstation vs <strong>Server GC</strong> (heap per core); background GC</td><td><code>DOTNET_gcServer=1</code>, <code>DOTNET_GCHeapHardLimit</code>, <code>GCHeapAffinitizeMask</code>, <code>DOTNET_GCConserveMemory</code></td></tr>
<tr><td><strong>Go</strong></td><td>Concurrent tri-color mark-sweep, non-moving, non-generational; pauses typically &lt; 1 ms</td><td><code>GOGC=100</code> (GC when heap grows 100% over live), <code>GOMEMLIMIT=900MiB</code> (soft limit, Go 1.19+)</td></tr>
<tr><td><strong>V8 (Node/Chrome)</strong></td><td>Young gen "Scavenger" (parallel copying), old gen Mark-Compact with concurrent/incremental marking (Orinoco)</td><td><code>--max-old-space-size=1536</code> (MB), <code>--max-semi-space-size</code>, <code>--trace-gc</code></td></tr>
<tr><td><strong>CPython</strong></td><td>Reference counting + generational cycle collector (<code>gc</code> module)</td><td><code>gc.freeze()</code> before fork (Instagram's copy-on-write trick), <code>gc.set_threshold</code></td></tr>
</table>
<pre># JVM GC log line (G1) — read it like this:
[12.345s][info][gc] GC(87) Pause Young (Normal) (G1 Evacuation Pause) 812M-&gt;214M(1024M) 9.871ms
#                    ^#87   ^minor GC                                  before-&gt;after(heap)  ^pause

# Go: GODEBUG=gctrace=1
gc 14 @3.2s 2%: 0.021+1.8+0.015 ms clock, ... 48-&gt;49-&gt;24 MB, 50 MB goal, 8 P
#      ^time ^% CPU in GC  ^STW+concurrent+STW      heap before-&gt;after-&gt;live</pre>`,
        he: `<table>
<tr><th>Runtime</th><th>Collectors / מודל</th><th>כפתורים חשובים</th></tr>
<tr><td><strong>JVM</strong></td><td>Serial (‏CPU אחד/heaps קטנים), ‏Parallel (‏throughput), ‏<strong>G1</strong> (ברירת מחדל מאז 9, מבוסס regions, יעד עצירה), ‏<strong>ZGC</strong> (דורי מאז 21, עצירות מתחת למילישנייה, heaps של TB), ‏Shenandoah</td><td><code>-XX:+UseZGC -XX:+ZGenerational</code>, ‏<code>-XX:MaxGCPauseMillis=200</code>, ‏<code>-Xmx</code>/<code>-XX:MaxRAMPercentage=75</code>, ‏<code>-Xlog:gc*</code></td></tr>
<tr><td><strong>.NET</strong></td><td>דורי gen0/gen1/gen2 + ‏<strong>LOH</strong> (אובייקטים ≥ 85 KB, נאספים עם gen2); ‏Workstation מול <strong>Server GC</strong> (‏heap לכל ליבה); ‏background GC</td><td><code>DOTNET_gcServer=1</code>, ‏<code>DOTNET_GCHeapHardLimit</code>, ‏<code>GCHeapAffinitizeMask</code>, ‏<code>DOTNET_GCConserveMemory</code></td></tr>
<tr><td><strong>Go</strong></td><td>Mark-sweep tri-color מקבילי, לא מזיז, לא דורי; עצירות בדרך כלל &lt; 1 ms</td><td><code>GOGC=100</code> (‏GC כשה-heap גדל ב-100% מעל החי), ‏<code>GOMEMLIMIT=900MiB</code> (מגבלה רכה, ‏Go 1.19+)</td></tr>
<tr><td><strong>V8 (‏Node/Chrome)</strong></td><td>דור צעיר "Scavenger" (‏copying מקבילי), דור ותיק Mark-Compact עם סימון מקבילי/אינקרמנטלי (‏Orinoco)</td><td><code>--max-old-space-size=1536</code> (‏MB), ‏<code>--max-semi-space-size</code>, ‏<code>--trace-gc</code></td></tr>
<tr><td><strong>CPython</strong></td><td>Reference counting + ‏cycle collector דורי (מודול <code>gc</code>)</td><td><code>gc.freeze()</code> לפני fork (הטריק של Instagram ל-copy-on-write), ‏<code>gc.set_threshold</code></td></tr>
</table>
<pre># JVM GC log line (G1) — read it like this:
[12.345s][info][gc] GC(87) Pause Young (Normal) (G1 Evacuation Pause) 812M-&gt;214M(1024M) 9.871ms
#                    ^#87   ^minor GC                                  before-&gt;after(heap)  ^pause

# Go: GODEBUG=gctrace=1
gc 14 @3.2s 2%: 0.021+1.8+0.015 ms clock, ... 48-&gt;49-&gt;24 MB, 50 MB goal, 8 P
#      ^time ^% CPU in GC  ^STW+concurrent+STW      heap before-&gt;after-&gt;live</pre>`
      }
    },
    {
      h: { en: "GC in containers: the OOMKill trap", he: "GC בקונטיינרים: מלכודת ה-OOMKill" },
      body: {
        en: `<p>The kernel's cgroup memory limit counts <strong>everything</strong> the process uses: heap + metaspace/code cache + thread stacks + direct/off-heap buffers + native libs + the runtime itself. The GC only manages the heap. If <code>-Xmx</code> equals the container limit, the JVM happily grows to the limit, native memory pushes it over, and the kernel <strong>OOMKills</strong> the pod (exit 137) — no OutOfMemoryError, no heap dump, nothing in the app log.</p>
<pre># Kubernetes: limit 2Gi
# JVM (container-aware since 8u191/10): size heap as a % of the cgroup limit
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -XX:+HeapDumpOnOutOfMemoryError"
# Go: soft limit below the cgroup limit, GC works harder as it approaches
GOMEMLIMIT=1800MiB
# Node: V8 doesn't read cgroups in older versions — set it explicitly (~75% of limit)
NODE_OPTIONS="--max-old-space-size=1536"
# .NET (Core 3+ is container-aware): default heap hard limit = 75% of the cgroup limit</pre>
<p>Rule of thumb: heap ≈ <strong>70-80%</strong> of the container limit, keep requests = limits for memory, and alert on <em>both</em> heap-after-GC (live set) and container working set. A heap that's 95% full after every full GC is a leak or an undersized pod — and the GC will spend more and more CPU trying (the "GC death spiral": 98% of time in GC, <code>GC overhead limit exceeded</code>).</p>
<blockquote>⚠️ Production tip: CPU limits matter too. The JVM sizes its GC and JIT thread pools from visible CPUs; a pod with <code>limits.cpu: 1</code> gets 1 GC thread and Serial GC may be picked automatically. Throttled GC threads = longer pauses. Check with <code>java -XX:+PrintFlagsFinal -version | grep -E "UseSerialGC|UseG1GC|ParallelGCThreads"</code> inside the pod.</blockquote>`,
        he: `<p>מגבלת הזיכרון של ה-cgroup ב-kernel סופרת <strong>הכול</strong> שה-process משתמש בו: heap + ‏metaspace/code cache + ‏stacks של threads + ‏buffers ישירים/off-heap + ספריות native + ה-runtime עצמו. ה-GC מנהל רק את ה-heap. אם <code>-Xmx</code> שווה למגבלת הקונטיינר, ה-JVM גדל בשמחה עד המגבלה, הזיכרון ה-native דוחף אותו מעבר, וה-kernel עושה <strong>OOMKill</strong> ל-pod (‏exit 137) — בלי OutOfMemoryError, בלי heap dump, כלום בלוג של האפליקציה.</p>
<pre># Kubernetes: limit 2Gi
# JVM (container-aware since 8u191/10): size heap as a % of the cgroup limit
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -XX:+HeapDumpOnOutOfMemoryError"
# Go: soft limit below the cgroup limit, GC works harder as it approaches
GOMEMLIMIT=1800MiB
# Node: V8 doesn't read cgroups in older versions — set it explicitly (~75% of limit)
NODE_OPTIONS="--max-old-space-size=1536"
# .NET (Core 3+ is container-aware): default heap hard limit = 75% of the cgroup limit</pre>
<p>כלל אצבע: heap ≈ <strong>70-80%</strong> ממגבלת הקונטיינר, לשמור requests = limits לזיכרון, ולהתריע על <em>שניהם</em>: heap אחרי GC (ה-live set) ו-working set של הקונטיינר. Heap שמלא ב-95% אחרי כל full GC הוא leak או pod קטן מדי — וה-GC יבזבז עוד ועוד CPU בניסיון (ה-"GC death spiral": ‏98% מהזמן ב-GC, ‏<code>GC overhead limit exceeded</code>).</p>
<blockquote>⚠️ טיפ לפרודקשן: גם מגבלות CPU חשובות. ה-JVM קובע את גודל ה-pools של GC ו-JIT לפי ה-CPUs שהוא רואה; pod עם <code>limits.cpu: 1</code> מקבל thread GC אחד ו-Serial GC עלול להיבחר אוטומטית. threads של GC שעוברים throttling = עצירות ארוכות יותר. בודקים עם <code>java -XX:+PrintFlagsFinal -version | grep -E "UseSerialGC|UseG1GC|ParallelGCThreads"</code> בתוך ה-pod.</blockquote>`
      }
    },
    {
      h: { en: "Memory leaks in GC languages — and how to hunt them", he: "Memory leaks בשפות עם GC — ואיך לצוד אותם" },
      body: {
        en: `<p>A GC frees <em>unreachable</em> memory. A leak in Java/C#/JS/Go is memory that's <strong>still reachable but no longer needed</strong>. Usual suspects:</p>
<ul>
<li><strong>Unbounded caches / static maps</strong>: <code>static Map&lt;String, Session&gt;</code> that only grows. Use bounded caches with TTL (Caffeine, <code>lru-cache</code>, <code>MemoryCache</code> with size limits).</li>
<li><strong>Listeners/subscriptions never removed</strong>: <code>emitter.on('data', ...)</code> per request (Node warns: <code>MaxListenersExceededWarning</code>), C# events, RxJS subscriptions.</li>
<li><strong>Closures capturing big objects</strong>: a timer callback that references the whole request.</li>
<li><strong>Goroutine leaks</strong>: goroutines blocked forever on a channel nobody writes to — each holds its stack and everything it references. Watch <code>go_goroutines</code>.</li>
<li><strong>ThreadLocals in thread pools</strong>, unclosed resources (streams, connections), large LOH fragmentation in .NET.</li>
</ul>
<p><strong>Method</strong>: (1) confirm it's a leak — live heap after full GC trends up over hours/days (sawtooth whose floor rises); (2) take two heap snapshots some time apart; (3) diff by retained size and follow the <em>retainer path</em> to the GC root that keeps it alive.</p>
<pre>jcmd &lt;pid&gt; GC.heap_dump /tmp/h.hprof       # Java -&gt; open in Eclipse MAT ("Leak Suspects")
jcmd &lt;pid&gt; GC.class_histogram | head -20    # quick: which classes grow
dotnet-gcdump collect -p &lt;pid&gt;              # .NET -&gt; open in VS / PerfView
node --inspect app.js                        # Chrome DevTools -&gt; Memory -&gt; Heap snapshot -&gt; Comparison
go tool pprof http://localhost:6060/debug/pprof/heap   # Go: top, list, web (inuse_space)</pre>
<blockquote>💡 Real world: Tuning order that actually works — (1) reduce allocation (pooling, avoid boxing, streaming instead of loading whole files), (2) size the heap and container correctly, (3) pick the right collector for the goal, (4) only then touch exotic flags. Most "GC problems" are allocation problems or leaks.</blockquote>`,
        he: `<p>GC משחרר זיכרון <em>לא נגיש</em>. ‏Leak ב-Java/C#/JS/Go הוא זיכרון <strong>שעדיין נגיש אבל כבר לא נחוץ</strong>. החשודים הרגילים:</p>
<ul>
<li><strong>Caches לא מוגבלים / maps סטטיים</strong>: <code>static Map&lt;String, Session&gt;</code> שרק גדל. להשתמש ב-caches מוגבלים עם TTL (‏Caffeine, ‏<code>lru-cache</code>, ‏<code>MemoryCache</code> עם מגבלת גודל).</li>
<li><strong>Listeners/subscriptions שלא מוסרים</strong>: <code>emitter.on('data', ...)</code> בכל בקשה (‏Node מזהיר: <code>MaxListenersExceededWarning</code>), ‏events ב-C#, ‏subscriptions של RxJS.</li>
<li><strong>Closures שתופסים אובייקטים גדולים</strong>: callback של timer שמפנה לכל ה-request.</li>
<li><strong>Goroutine leaks</strong>: goroutines שתקועים לנצח על channel שאף אחד לא כותב אליו — כל אחד מחזיק את ה-stack שלו וכל מה שהוא מפנה אליו. לעקוב אחרי <code>go_goroutines</code>.</li>
<li><strong>ThreadLocals ב-thread pools</strong>, משאבים שלא נסגרו (‏streams, ‏connections), פרגמנטציה של LOH ב-.NET.</li>
</ul>
<p><strong>השיטה</strong>: (1) לאשר שזה leak — ה-heap החי אחרי full GC עולה לאורך שעות/ימים (שן מסור שהרצפה שלה עולה); (2) לקחת שני heap snapshots בהפרש זמן; (3) לעשות diff לפי retained size ולעקוב אחרי ה-<em>retainer path</em> עד ה-GC root שמחזיק אותו בחיים.</p>
<pre>jcmd &lt;pid&gt; GC.heap_dump /tmp/h.hprof       # Java -&gt; open in Eclipse MAT ("Leak Suspects")
jcmd &lt;pid&gt; GC.class_histogram | head -20    # quick: which classes grow
dotnet-gcdump collect -p &lt;pid&gt;              # .NET -&gt; open in VS / PerfView
node --inspect app.js                        # Chrome DevTools -&gt; Memory -&gt; Heap snapshot -&gt; Comparison
go tool pprof http://localhost:6060/debug/pprof/heap   # Go: top, list, web (inuse_space)</pre>
<blockquote>💡 מהשטח: סדר הכיוונון שבאמת עובד — (1) להקטין הקצאות (‏pooling, להימנע מ-boxing, ‏streaming במקום לטעון קבצים שלמים), (2) לקבוע נכון גודל heap וקונטיינר, (3) לבחור את ה-collector הנכון למטרה, (4) רק אז לגעת בדגלים אקזוטיים. רוב "בעיות ה-GC" הן בעיות הקצאה או leaks.</blockquote>`
      }
    }
  ],
  diagram: `GENERATIONAL HEAP (JVM G1 / .NET / V8 idea)
 ┌──── young ─────────────┐  ┌──────────── old ────────────────┐
 │ eden │ survivor0 │ s1  │─►│ long-lived: caches, pools, config │   .NET: + LOH (>=85KB)
 └──────────────────────────┘  └──────────────────────────────────┘
  minor GC: often, copy live, ~ms     major/full GC: rare, mark-compact, longer

heap usage over time
 healthy (sawtooth, floor flat)        leak (floor keeps rising) -> OOM
  /|  /|  /|  /|                              /|    /|
 / | / | / | / |                          /| / |  / |  /|
/  |/  |/  |/  |                     /|  / |/  | /  | / |
                                    / |_/       |/   |/   <- live set after GC grows

container limit 2Gi: [ heap 1.5G (MaxRAMPercentage=75) | metaspace | stacks | off-heap ]`,
  handsOn: [
    { cmd: "java -Xlog:gc -Xmx256m -XX:+UseG1GC -version", what: { en: "See GC logging format and which collector is used (run your app instead of -version to watch pauses).", he: "לראות את פורמט לוג ה-GC ואיזה collector נבחר (להריץ את האפליקציה במקום -version כדי לראות עצירות)." } },
    { cmd: "GODEBUG=gctrace=1 go run main.go", what: { en: "Go prints one line per GC cycle: % CPU in GC, pause times, heap before/after/live and the goal.", he: "Go מדפיס שורה לכל מחזור GC: ‏% CPU ב-GC, זמני עצירה, heap לפני/אחרי/חי והיעד." } },
    { cmd: "node --trace-gc --max-old-space-size=64 -e \"const a=[];setInterval(()=>{for(let i=0;i<1e5;i++)a.push({i})},50)\"", what: { en: "Watch Scavenge vs Mark-Compact lines, pauses growing, and finally 'JavaScript heap out of memory' — a leak in 1 line.", he: "לראות שורות Scavenge מול Mark-Compact, עצירות שמתארכות, ובסוף 'JavaScript heap out of memory' — leak בשורה אחת." } },
    { cmd: "python -c \"import gc,sys;a=[];b=[a];a.append(b);print(sys.getrefcount(a));del a,b;print('collected',gc.collect())\"", what: { en: "A reference cycle refcounting can't free; the cycle collector does.", he: "מעגל הפניות ש-reference counting לא משחרר; ה-cycle collector כן." } },
    { cmd: "kubectl describe pod <pod> | grep -A3 'Last State'", what: { en: "OOMKilled + exit 137 = cgroup kill, not a GC error. Compare the heap limit to the container limit.", he: "OOMKilled + ‏exit 137 = הריגה של ה-cgroup, לא שגיאת GC. להשוות את מגבלת ה-heap למגבלת הקונטיינר." } }
  ],
  mnemonic: {
    en: "Roots → reach → keep; the rest is sweep. Young die fast, old live long. Heap at 75%, or the kernel ends the song.",
    he: "Roots → נגיש → נשאר; כל השאר לפח. צעירים מתים מהר, ותיקים חיים הרבה. Heap על 75%, אחרת ה-kernel הורג בלי לשאול."
  },
  pitfalls: [
    { en: "Setting -Xmx (or --max-old-space-size) equal to the container memory limit — native memory pushes you over and the pod is OOMKilled silently.", he: "לקבוע -Xmx (או --max-old-space-size) שווה למגבלת הזיכרון של הקונטיינר — הזיכרון ה-native דוחף מעבר וה-pod עובר OOMKill בשקט." },
    { en: "Calling System.gc()/GC.Collect() 'to help' — it triggers full, stop-the-world collections and usually hurts.", he: "לקרוא ל-System.gc()/GC.Collect() 'כדי לעזור' — זה מפעיל איסוף מלא עם stop-the-world ובדרך כלל מזיק." },
    { en: "Judging memory by RSS or average heap — look at heap after full GC (live set) over days to spot leaks.", he: "לשפוט זיכרון לפי RSS או heap ממוצע — צריך להסתכל על heap אחרי full GC (‏live set) לאורך ימים כדי לזהות leaks." },
    { en: "Blaming p99 latency on the network when it's GC pauses — always correlate latency spikes with GC logs/metrics.", he: "להאשים את הרשת ב-p99 latency כשזה עצירות GC — תמיד להצליב קפיצות latency עם לוגים/מטריקות של GC." }
  ],
  interview: [
    { q: { en: "Explain generational garbage collection and why it works.", he: "תסביר garbage collection דורי ולמה הוא עובד." },
      a: { en: "Based on the weak generational hypothesis — most objects die young. The heap is split into a small young generation, collected frequently by copying only the few survivors (cheap, since cost is proportional to live objects), and an old generation collected rarely with mark-compact. Survivors of a few minor GCs are promoted. A write barrier/card table records old-to-young references so minor GCs don't scan the old gen. Result: high throughput and short frequent pauses; the expensive full GC is rare.", he: "מבוסס על ההשערה הדורית — רוב האובייקטים מתים צעירים. ה-heap מחולק לדור צעיר קטן שנאסף לעתים קרובות ע\"י העתקה של השורדים המעטים בלבד (זול, כי העלות פרופורציונלית לאובייקטים חיים), ולדור ותיק שנאסף לעתים רחוקות עם mark-compact. מי ששורד כמה minor GCs מקודם. ‏Write barrier/card table רושם הפניות מוותיק לצעיר כדי ש-minor GC לא יסרוק את הדור הוותיק. התוצאה: throughput גבוה ועצירות קצרות ותכופות; ה-full GC היקר נדיר." } },
    { q: { en: "A Java pod restarts every ~6 hours with exit code 137. How do you investigate?", he: "pod של Java עושה restart כל ~6 שעות עם exit code 137. איך אתה חוקר?" },
      a: { en: "137 = SIGKILL, almost always the cgroup OOM killer, not a Java OOM. Compare -Xmx/MaxRAMPercentage with the container limit and account for non-heap (metaspace, threads × stack, direct buffers, Netty off-heap) via Native Memory Tracking (-XX:NativeMemoryTracking=summary, jcmd VM.native_memory). Check whether heap-after-GC trends up (a real leak → heap dumps diffed in MAT) or whether off-heap grows. Fix: heap at ~75% of the limit, cap direct memory, fix the leak, and add alerts on container working set and live heap.", he: "137 = ‏SIGKILL, כמעט תמיד ה-OOM killer של ה-cgroup, לא OOM של Java. משווים את -Xmx/MaxRAMPercentage למגבלת הקונטיינר ומחשבים את מה שמחוץ ל-heap (‏metaspace, ‏threads × stack, ‏direct buffers, ‏off-heap של Netty) עם Native Memory Tracking (‏-XX:NativeMemoryTracking=summary, ‏jcmd VM.native_memory). בודקים אם ה-heap אחרי GC עולה (‏leak אמיתי → heap dumps ו-diff ב-MAT) או שה-off-heap גדל. תיקון: heap על ~75% מהמגבלה, להגביל direct memory, לתקן את ה-leak, ולהוסיף התראות על working set של הקונטיינר ועל ה-heap החי." } },
    { q: { en: "When would you choose ZGC over G1, or Go's GOMEMLIMIT?", he: "מתי תבחר ZGC על פני G1, או GOMEMLIMIT ב-Go?" },
      a: { en: "ZGC when tail latency matters and heaps are large (tens of GB): pauses stay sub-millisecond regardless of heap size, at the cost of some throughput and memory overhead. G1 is the balanced default. In Go, GOMEMLIMIT lets the GC run lazily (high GOGC or GOGC=off) while staying under the container limit — fewer GC cycles normally, more aggressive collection only near the limit.", he: "ZGC כש-tail latency חשוב וה-heaps גדולים (עשרות GB): העצירות נשארות מתחת למילישנייה בלי קשר לגודל ה-heap, במחיר של קצת throughput ותקורת זיכרון. G1 הוא ברירת המחדל המאוזנת. ב-Go, ‏GOMEMLIMIT מאפשר ל-GC לרוץ בעצלות (‏GOGC גבוה או GOGC=off) ועדיין להישאר מתחת למגבלת הקונטיינר — פחות מחזורי GC בדרך כלל, ואיסוף אגרסיבי רק ליד המגבלה." } }
  ],
  quiz: [
    { q: { en: "Why can't pure reference counting free two objects that point to each other?", he: "למה reference counting טהור לא יכול לשחרר שני אובייקטים שמצביעים אחד על השני?" },
      options: [ { en: "They're on the stack", he: "הם על ה-stack" }, { en: "Each keeps the other's count above zero", he: "כל אחד שומר את ה-count של השני מעל אפס" }, { en: "Counts overflow", he: "ה-counts גולשים" }, { en: "They are in the old generation", he: "הם בדור הוותיק" } ],
      answer: 1, explain: { en: "Cycles keep counts ≥ 1 even when unreachable; tracing (or a cycle collector) is needed.", he: "מעגלים שומרים counts ≥ 1 גם כשהם לא נגישים; צריך tracing (או cycle collector)." } },
    { q: { en: "A pod with a 2 GiB limit runs Java with -Xmx2g. Most likely outcome under load?", he: "pod עם מגבלה של 2 GiB מריץ Java עם -Xmx2g. מה התוצאה הסבירה תחת עומס?" },
      options: [ { en: "OutOfMemoryError with a heap dump", he: "OutOfMemoryError עם heap dump" }, { en: "OOMKilled (exit 137) by the kernel", he: "OOMKilled (‏exit 137) ע\"י ה-kernel" }, { en: "The JVM shrinks the heap automatically", he: "ה-JVM מקטין את ה-heap אוטומטית" }, { en: "Nothing, heap is the only memory", he: "כלום, ה-heap הוא הזיכרון היחיד" } ],
      answer: 1, explain: { en: "Heap + native memory exceeds the cgroup limit; the kernel kills the process.", he: "Heap + זיכרון native עוברים את מגבלת ה-cgroup; ה-kernel הורג את ה-process." } },
    { q: { en: "Which signal best indicates a memory leak in a GC language?", he: "איזה סימן הכי מעיד על memory leak בשפה עם GC?" },
      options: [ { en: "High RSS right after startup", he: "RSS גבוה מיד אחרי עלייה" }, { en: "Frequent minor GCs", he: "minor GCs תכופים" }, { en: "Live heap after full GC rising steadily over hours", he: "Heap חי אחרי full GC שעולה בהתמדה לאורך שעות" }, { en: "One long GC pause", he: "עצירת GC ארוכה אחת" } ],
      answer: 2, explain: { en: "The floor of the sawtooth rising = reachable memory accumulating.", he: "רצפת שן המסור שעולה = זיכרון נגיש שמצטבר." } },
    { q: { en: "What does GOMEMLIMIT do in Go?", he: "מה GOMEMLIMIT עושה ב-Go?" },
      options: [ { en: "Hard-kills the process at the limit", he: "הורג את ה-process במגבלה" }, { en: "A soft memory limit: GC runs more aggressively as total memory approaches it", he: "מגבלת זיכרון רכה: ה-GC רץ באגרסיביות כשהזיכרון הכולל מתקרב אליה" }, { en: "Sets stack size per goroutine", he: "קובע גודל stack לכל goroutine" }, { en: "Disables GC", he: "מבטל את ה-GC" } ],
      answer: 1, explain: { en: "Since Go 1.19 it complements GOGC, keeping the runtime under a target (e.g. ~90% of the container limit).", he: "מאז Go 1.19 הוא משלים את GOGC ושומר את ה-runtime מתחת ליעד (למשל ~90% ממגבלת הקונטיינר)." } }
  ],
  playground: "resources",
  related: ["memory", "k8s-resources", "pr-concurrency-parallelism", "pr-event-loop", "staff-queueing-tail-latency", "obs-metrics"]
});

INFRA.glossary.push(
  { term: "Concurrency", track: "principal", def: { en: "Structuring a program to have many tasks in progress at once, interleaved — possible even on one core.", he: "בניית תוכנית כך שהרבה משימות בתהליך בו-זמנית, משולבות — אפשרי גם על ליבה אחת." }, lesson: "pr-concurrency-parallelism" },
  { term: "Parallelism", track: "principal", def: { en: "Executing multiple computations at the same instant on multiple cores or machines.", he: "ביצוע כמה חישובים באותו רגע ממש על כמה ליבות או מכונות." }, lesson: "pr-concurrency-parallelism" },
  { term: "GIL", track: "principal", def: { en: "CPython's Global Interpreter Lock: one thread runs Python bytecode at a time per process; use processes for CPU-bound parallelism.", he: "ה-Global Interpreter Lock של CPython: רק thread אחד מריץ bytecode של Python בכל רגע בכל process; ל-parallelism של CPU משתמשים ב-processes." }, lesson: "pr-concurrency-parallelism" },
  { term: "Amdahl's Law", track: "principal", def: { en: "Max speedup = 1 / ((1-p) + p/N); the serial fraction caps how much more cores can help.", he: "האצה מקסימלית = 1 / ((1-p) + p/N); החלק הסדרתי מגביל כמה עוד ליבות יכולות לעזור." }, lesson: "pr-concurrency-parallelism" },
  { term: "Deadlock", track: "principal", def: { en: "Threads waiting on each other forever; requires mutual exclusion, hold-and-wait, no preemption and circular wait (Coffman).", he: "Threads שמחכים אחד לשני לנצח; דורש mutual exclusion, ‏hold-and-wait, ‏no preemption ו-circular wait (‏Coffman)." }, lesson: "pr-concurrency-parallelism" },
  { term: "Event loop", track: "principal", def: { en: "A single thread that waits for ready IO events (epoll/kqueue/IOCP) and runs short callbacks; must never be blocked.", he: "Thread יחיד שמחכה ל-events מוכנים של IO (‏epoll/kqueue/IOCP) ומריץ callbacks קצרים; אסור לחסום אותו לעולם." }, lesson: "pr-event-loop" },
  { term: "Microtask", track: "principal", def: { en: "High-priority callback (Promise reaction, await continuation) drained completely before the next macrotask (timer, IO).", he: "Callback בעדיפות גבוהה (תגובת Promise, המשך של await) שמתרוקן לגמרי לפני ה-macrotask הבא (‏timer, ‏IO)." }, lesson: "pr-event-loop" },
  { term: "Structured concurrency", track: "principal", def: { en: "Child tasks are bound to a scope; if one fails or the scope ends, the others are cancelled (TaskGroup, errgroup, StructuredTaskScope).", he: "Tasks ילדים קשורים ל-scope; אם אחד נכשל או ה-scope נגמר, השאר מבוטלים (‏TaskGroup, ‏errgroup, ‏StructuredTaskScope)." }, lesson: "pr-async-await" },
  { term: "Generational GC", track: "principal", def: { en: "Heap split into young (collected often, cheaply) and old (collected rarely) generations, because most objects die young.", he: "Heap מחולק לדור צעיר (נאסף לעתים קרובות ובזול) ולדור ותיק (נאסף לעתים רחוקות), כי רוב האובייקטים מתים צעירים." }, lesson: "pr-garbage-collection" },
  { term: "Stop-the-world (STW)", track: "principal", def: { en: "A GC phase where all application threads are paused; its length shows up directly in tail latency.", he: "שלב של GC שבו כל ה-threads של האפליקציה עוצרים; האורך שלו מופיע ישירות ב-tail latency." }, lesson: "pr-garbage-collection" }
);
