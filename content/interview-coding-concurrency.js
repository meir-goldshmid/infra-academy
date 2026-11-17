// Interview prep — concurrency coding problems (blocking queue, ordering, thread-safe rate limiter,
// multithreaded crawler, dining philosophers, concurrent LRU) with an infrastructure twist (INFRA.problems)
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.problems = window.INFRA.problems || [];

/* ------------------------------------------------------------------ */
/* 1. Bounded Blocking Queue (LC 1188)                                 */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "bounded-blocking-queue",
  icon: "🚰",
  difficulty: "medium",
  tags: ["concurrency", "condition-variable", "producer-consumer", "design"],
  leetcode: "1188",
  title: { en: "Bounded Blocking Queue", he: "Bounded Blocking Queue" },
  statement: {
    en: `<p>Implement a thread-safe <code>BoundedBlockingQueue(capacity)</code> used by many producer and consumer threads at the same time:</p>
<ul>
<li><code>enqueue(element)</code>: adds to the back. If the queue is full, the calling thread <strong>blocks</strong> until there is room.</li>
<li><code>dequeue()</code>: removes and returns the front element. If the queue is empty, the calling thread <strong>blocks</strong> until an element arrives.</li>
<li><code>size()</code>: returns the current number of elements.</li>
</ul>
<p>Don't use a ready-made blocking queue (<code>queue.Queue</code>, <code>ArrayBlockingQueue</code>, a buffered Go channel). Build it from a lock and condition variables. No busy-waiting.</p>`,
    he: `<p>תממש <code>BoundedBlockingQueue(capacity)</code> שהוא thread-safe, ושהרבה thread-ים של producers ו-consumers משתמשים בו במקביל:</p>
<ul>
<li><code>enqueue(element)</code>: מוסיף לסוף התור. אם התור מלא, ה-thread שקרא <strong>נחסם</strong> עד שמתפנה מקום.</li>
<li><code>dequeue()</code>: מוציא ומחזיר את האיבר הראשון. אם התור ריק, ה-thread <strong>נחסם</strong> עד שמגיע איבר.</li>
<li><code>size()</code>: מחזיר כמה איברים יש כרגע.</li>
</ul>
<p>אסור להשתמש ב-blocking queue מוכן (<code>queue.Queue</code>, <code>ArrayBlockingQueue</code>, channel עם buffer ב-Go). תבנה אותו מ-lock ו-condition variables. בלי busy-waiting.</p>`
  },
  examples: `q = BoundedBlockingQueue(2)
producer: q.enqueue(1)      # ok
producer: q.enqueue(2)      # ok, queue is full
producer: q.enqueue(3)      # BLOCKS
consumer: q.dequeue() -> 1  # frees a slot, wakes the producer; 3 is enqueued
q.size()              -> 2
consumer: q.dequeue() -> 2
consumer: q.dequeue() -> 3
consumer: q.dequeue()       # BLOCKS until someone enqueues`,
  hints: [
    { en: "One lock protects the deque. You need a way to sleep while holding \"the right to check\" and be woken when the state changes: that is a condition variable.", he: "lock אחד מגן על ה-deque. צריך דרך לישון ולהתעורר כשהמצב משתנה, בלי לפספס את השינוי: זה בדיוק condition variable." },
    { en: "Use two conditions on the same lock: not_full (producers wait on it) and not_empty (consumers wait on it). After enqueue, signal not_empty; after dequeue, signal not_full.", he: "תשתמש בשני conditions על אותו lock: not_full (ה-producers מחכים עליו) ו-not_empty (ה-consumers מחכים עליו). אחרי enqueue תעיר את not_empty, ואחרי dequeue תעיר את not_full." },
    { en: "Always re-check the predicate in a while loop after waking up, never an if. Wakeups can be spurious, and another thread may grab the slot between the signal and your wakeup.", he: "תמיד תבדוק שוב את התנאי בלולאת while אחרי שהתעוררת, אף פעם לא if. יש spurious wakeups, ו-thread אחר יכול לתפוס את המקום בין ה-signal לרגע שהתעוררת." }
  ],
  solution: String.raw`import threading
from collections import deque


class BoundedBlockingQueue:
    """Classic monitor: one lock + two condition variables sharing it."""

    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("capacity must be > 0")
        self.capacity = capacity
        self.items = deque()
        self.lock = threading.Lock()
        self.not_full = threading.Condition(self.lock)   # producers wait here
        self.not_empty = threading.Condition(self.lock)  # consumers wait here

    def enqueue(self, element: int) -> None:
        with self.lock:
            # WHILE, not if: spurious wakeups, and another producer may have
            # taken the free slot between the notify and our wakeup.
            while len(self.items) >= self.capacity:
                self.not_full.wait()        # atomically releases the lock and sleeps
            self.items.append(element)
            self.not_empty.notify()         # exactly one consumer can use one new item

    def dequeue(self) -> int:
        with self.lock:
            while not self.items:
                self.not_empty.wait()
            item = self.items.popleft()
            self.not_full.notify()          # one slot freed -> wake one producer
            return item

    def size(self) -> int:
        with self.lock:                     # a consistent read, not a torn one
            return len(self.items)


# ===================== Java (ReentrantLock + 2 Conditions) =====================
# import java.util.ArrayDeque; import java.util.Deque;
# import java.util.concurrent.locks.*;
#
# class BoundedBlockingQueue {
#     private final int capacity;
#     private final Deque<Integer> items = new ArrayDeque<>();
#     private final ReentrantLock lock = new ReentrantLock();
#     private final Condition notFull = lock.newCondition();
#     private final Condition notEmpty = lock.newCondition();
#
#     public BoundedBlockingQueue(int capacity) { this.capacity = capacity; }
#
#     public void enqueue(int element) throws InterruptedException {
#         lock.lock();
#         try {
#             while (items.size() == capacity) notFull.await();
#             items.addLast(element);
#             notEmpty.signal();
#         } finally { lock.unlock(); }
#     }
#
#     public int dequeue() throws InterruptedException {
#         lock.lock();
#         try {
#             while (items.isEmpty()) notEmpty.await();
#             int x = items.removeFirst();
#             notFull.signal();
#             return x;
#         } finally { lock.unlock(); }
#     }
#
#     public int size() {
#         lock.lock();
#         try { return items.size(); } finally { lock.unlock(); }
#     }
# }
`,
  explain: {
    en: `<p>This is the textbook <strong>monitor</strong>: shared state (the deque) plus one lock plus condition variables for "wait until the state is what I need".</p>
<ul>
<li><strong>Why a condition variable and not sleep-and-poll?</strong> <code>wait()</code> atomically releases the lock and parks the thread; when woken it re-acquires the lock before returning. No CPU is burned, and no wakeup is lost between "I checked, it's full" and "I went to sleep" (the classic <em>lost wakeup</em> race you get with a plain flag + sleep).</li>
<li><strong>Why <code>while</code>, not <code>if</code>?</strong> POSIX, Java and Python all allow <strong>spurious wakeups</strong> (waking with no notify). Even without them, notify only says "the state <em>may</em> have changed": between the notify and the moment the woken thread gets the lock back, a third thread can barge in and take the slot (Mesa semantics). Re-checking the predicate in a loop makes both harmless.</li>
<li><strong>notify vs notifyAll.</strong> With <em>two</em> conditions, every waiter on <code>not_empty</code> is a consumer and one new item can satisfy exactly one consumer, so <code>notify()</code> (Java <code>signal()</code>) is correct and avoids a thundering herd. With a <em>single</em> condition shared by producers and consumers (Java's built-in <code>synchronized</code> + <code>wait</code>/<code>notify</code>), <code>notify()</code> can wake the wrong kind of thread: a producer wakes another producer, which goes back to sleep, and every consumer stays asleep forever. There you must use <code>notifyAll()</code>.</li>
<li><code>size()</code> also takes the lock. Without it you can read a value that is in the middle of being changed, and in Java the read has no happens-before edge, so it can be stale.</li>
</ul>
<p>In Go, the idiomatic answer is "a buffered channel <code>make(chan int, capacity)</code> is exactly this". Say that, then show you can build it with <code>sync.Mutex</code> + <code>sync.Cond</code>. Background: <a href="#/lesson/pr-race-deadlock">races and deadlocks</a>.</p>`,
    he: `<p>זה ה-<strong>monitor</strong> הקלאסי: state משותף (ה-deque), lock אחד, ו-condition variables בשביל "תחכה עד שהמצב יהיה מה שאני צריך".</p>
<ul>
<li><strong>למה condition variable ולא sleep ובדיקה חוזרת?</strong> <code>wait()</code> משחרר את ה-lock ומרדים את ה-thread בפעולה אטומית אחת. כשהוא מתעורר, הוא תופס שוב את ה-lock לפני שהוא חוזר. לא שורפים CPU, ולא מפספסים wakeup בין "בדקתי, מלא" לבין "הלכתי לישון". זה ה-race הקלאסי של <em>lost wakeup</em> שמקבלים עם flag רגיל ו-sleep.</li>
<li><strong>למה <code>while</code> ולא <code>if</code>?</strong> ב-POSIX, ב-Java וב-Python מותרים <strong>spurious wakeups</strong>, כלומר להתעורר בלי שמישהו קרא ל-notify. וגם בלעדיהם, notify אומר רק "המצב <em>אולי</em> השתנה". בין ה-notify לרגע שה-thread שהתעורר תופס שוב את ה-lock, thread שלישי יכול להיכנס ולקחת את המקום (Mesa semantics). בדיקה חוזרת בלולאה מנטרלת את שני המקרים.</li>
<li><strong>notify מול notifyAll.</strong> עם <em>שני</em> conditions, כל מי שמחכה על <code>not_empty</code> הוא consumer, ואיבר חדש אחד מספק בדיוק consumer אחד. לכן <code>notify()</code> (ב-Java זה <code>signal()</code>) נכון, ונמנע thundering herd. עם condition <em>אחד</em> שמשותף ל-producers ול-consumers (ה-<code>synchronized</code> המובנה של Java עם <code>wait</code>/<code>notify</code>), <code>notify()</code> יכול להעיר את הסוג הלא נכון: producer מעיר producer אחר, הוא חוזר לישון, וכל ה-consumers ישנים לנצח. שם חייבים <code>notifyAll()</code>.</li>
<li>גם <code>size()</code> לוקח את ה-lock. בלעדיו אפשר לקרוא ערך באמצע שינוי, וב-Java לקריאה כזאת אין happens-before, אז היא יכולה להיות ישנה.</li>
</ul>
<p>ב-Go התשובה האידיומטית היא "channel עם buffer, <code>make(chan int, capacity)</code>, הוא בדיוק זה". תגיד את זה, ואז תראה שאתה יודע לבנות את זה עם <code>sync.Mutex</code> ו-<code>sync.Cond</code>. רקע: <a href="#/lesson/pr-race-deadlock">races ו-deadlocks</a>.</p>`
  },
  complexity: "Time O(1) per operation (plus blocking time); Space O(capacity)",
  whyInfra: {
    en: "Every bounded buffer between a fast producer and a slow consumer is this queue: a DB connection pool (borrow blocks when all connections are out), a log shipper's in-memory buffer in front of Kafka, the accept backlog of a server, the work queue of a thread pool (<code>ThreadPoolExecutor</code> with an <code>ArrayBlockingQueue</code>). The bound is <strong>backpressure</strong>: without it a slow consumer turns into unbounded memory growth and an OOM kill. When a service \"hangs with 0% CPU\", a thread dump full of threads parked in <code>await()</code> on a pool's condition is a very common finding.",
    he: "כל buffer חסום בין producer מהיר ל-consumer איטי הוא התור הזה: connection pool של DB (ה-borrow נחסם כשכל החיבורים בשימוש), buffer בזיכרון של log shipper לפני Kafka, ה-accept backlog של שרת, תור העבודה של thread pool (<code>ThreadPoolExecutor</code> עם <code>ArrayBlockingQueue</code>). החסם הוא <strong>backpressure</strong>: בלעדיו consumer איטי הופך לצמיחת זיכרון בלי גבול ול-OOM kill. כששירות \"תקוע עם 0% CPU\", thread dump מלא ב-thread-ים שמחכים ב-<code>await()</code> על condition של pool הוא ממצא נפוץ מאוד."
  },
  followUps: [
    { q: { en: "Add offer(element, timeout) that gives up after a timeout.", he: "תוסיף offer(element, timeout) שמוותר אחרי timeout." },
      a: { en: "Compute an absolute deadline with a monotonic clock, then loop: <code>while full: remaining = deadline - now(); if remaining &lt;= 0: return False; not_full.wait(remaining)</code>. Recompute the remaining time on every iteration, because a spurious or stolen wakeup must not restart the full timeout. Java's <code>awaitNanos</code> returns the remaining nanos for exactly this loop.", he: "מחשבים deadline אבסולוטי עם שעון monotonic, ואז לולאה: <code>while full: remaining = deadline - now(); if remaining &lt;= 0: return False; not_full.wait(remaining)</code>. מחשבים מחדש את הזמן שנשאר בכל סיבוב, כי wakeup מזויף או \"גנוב\" לא אמור לאפס את כל ה-timeout. ב-Java, <code>awaitNanos</code> מחזיר את ה-nanos שנשארו בדיוק בשביל הלולאה הזאת." } },
    { q: { en: "Producers and consumers fight over one lock. How do you reduce contention?", he: "ה-producers וה-consumers נלחמים על lock אחד. איך מורידים contention?" },
      a: { en: "Use two locks: a put lock for the tail and a take lock for the head, plus an atomic count. That is how Java's <code>LinkedBlockingQueue</code> works, so an enqueue and a dequeue can run in parallel. Beyond that, use a lock-free ring buffer (LMAX Disruptor) or shard into per-core queues with work stealing.", he: "משתמשים בשני locks: put lock לזנב ו-take lock לראש, ועוד מונה אטומי. ככה עובד <code>LinkedBlockingQueue</code> של Java, ולכן enqueue ו-dequeue רצים במקביל. מעבר לזה: ring buffer בלי locks (LMAX Disruptor), או חלוקה לתורים לכל core עם work stealing." } },
    { q: { en: "How do you shut the queue down cleanly so blocked consumers don't hang forever?", he: "איך סוגרים את התור נקי, כך ש-consumers חסומים לא יתקעו לנצח?" },
      a: { en: "Add a <code>closed</code> flag. <code>close()</code> sets it under the lock and calls <code>notify_all()</code> on both conditions. Every wait loop checks <code>closed</code>: enqueue raises, dequeue drains what is left and then raises or returns a sentinel. Alternatively, enqueue one poison pill per consumer. Go does the same with <code>close(ch)</code> plus <code>v, ok := &lt;-ch</code>.", he: "מוסיפים flag בשם <code>closed</code>. <code>close()</code> מדליק אותו תחת ה-lock וקורא ל-<code>notify_all()</code> על שני ה-conditions. כל לולאת wait בודקת את <code>closed</code>: enqueue זורק שגיאה, ו-dequeue מרוקן מה שנשאר ואז זורק או מחזיר sentinel. אפשרות אחרת: poison pill אחד לכל consumer. ב-Go זה <code>close(ch)</code> עם <code>v, ok := &lt;-ch</code>." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 2. Print in Order (LC 1114)                                         */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "print-in-order-threads",
  icon: "🚦",
  difficulty: "easy",
  tags: ["concurrency", "synchronization", "semaphore", "happens-before"],
  leetcode: "1114",
  title: { en: "Print in Order (Thread Ordering)", he: "Print in Order: סדר בין thread-ים" },
  statement: {
    en: `<p>One <code>Foo</code> instance is shared by three threads. Thread A calls <code>first(printFirst)</code>, thread B calls <code>second(printSecond)</code>, thread C calls <code>third(printThird)</code>. The OS may start them in <strong>any order</strong>.</p>
<p>Make sure <code>printFirst()</code> runs before <code>printSecond()</code>, which runs before <code>printThird()</code>, no matter how the threads are scheduled. No busy-waiting, and no <code>sleep</code> "to give the other thread time".</p>`,
    he: `<p>מופע אחד של <code>Foo</code> משותף לשלושה thread-ים. Thread A קורא ל-<code>first(printFirst)</code>, thread B קורא ל-<code>second(printSecond)</code>, ו-thread C קורא ל-<code>third(printThird)</code>. מערכת ההפעלה יכולה להריץ אותם <strong>בכל סדר</strong>.</p>
<p>תוודא ש-<code>printFirst()</code> רץ לפני <code>printSecond()</code>, שרץ לפני <code>printThird()</code>, לא משנה איך ה-scheduler מתזמן. בלי busy-waiting, ובלי <code>sleep</code> "כדי לתת ל-thread השני זמן".</p>`
  },
  examples: `Thread start order: [C, A, B]  (third, first, second)
Output: "firstsecondthird"

Thread start order: [B, C, A]
Output: "firstsecondthird"`,
  hints: [
    { en: "Each step is a one-time \"gate\": second() must wait until first() finished, third() until second() finished. You need two gates.", he: "כל שלב הוא \"שער\" חד-פעמי: second() מחכה עד ש-first() סיים, ו-third() עד ש-second() סיים. צריך שני שערים." },
    { en: "A gate that opens once and stays open is an Event (Python), a CountDownLatch(1) (Java), or a closed channel (Go). A Semaphore(0) also works: release() opens it once.", he: "שער שנפתח פעם אחת ונשאר פתוח הוא Event ב-Python, ‏CountDownLatch(1) ב-Java, או channel סגור ב-Go. גם Semaphore(0) עובד: release() פותח אותו פעם אחת." },
    { en: "Why not a plain boolean flag? Busy-waiting burns a core, and in Java/Go a non-volatile, non-atomic flag has no happens-before edge: the waiter may never see the write.", he: "למה לא flag בוליאני רגיל? Busy-waiting שורף core, וב-Java או Go ל-flag שהוא לא volatile ולא atomic אין happens-before: ה-thread שמחכה אולי אף פעם לא יראה את הכתיבה." }
  ],
  solution: String.raw`import threading
from typing import Callable


class Foo:
    """Two one-shot gates. Event.set() happens-before a wait() that returns."""

    def __init__(self):
        self.first_done = threading.Event()
        self.second_done = threading.Event()

    def first(self, printFirst: Callable[[], None]) -> None:
        printFirst()
        self.first_done.set()          # open gate 1

    def second(self, printSecond: Callable[[], None]) -> None:
        self.first_done.wait()         # parks the thread, no CPU burned
        printSecond()
        self.second_done.set()         # open gate 2

    def third(self, printThird: Callable[[], None]) -> None:
        self.second_done.wait()
        printThird()


# ============================ Java (CountDownLatch) ============================
# class Foo {
#     private final CountDownLatch firstDone = new CountDownLatch(1);
#     private final CountDownLatch secondDone = new CountDownLatch(1);
#
#     public void first(Runnable printFirst) throws InterruptedException {
#         printFirst.run();
#         firstDone.countDown();
#     }
#     public void second(Runnable printSecond) throws InterruptedException {
#         firstDone.await();
#         printSecond.run();
#         secondDone.countDown();
#     }
#     public void third(Runnable printThird) throws InterruptedException {
#         secondDone.await();
#         printThird.run();
#     }
# }
#
# ============================ Go (closed channels) =============================
# type Foo struct{ firstDone, secondDone chan struct{} }
#
# func NewFoo() *Foo {
#     return &Foo{firstDone: make(chan struct{}), secondDone: make(chan struct{})}
# }
# func (f *Foo) First(p func())  { p(); close(f.firstDone) }
# func (f *Foo) Second(p func()) { <-f.firstDone; p(); close(f.secondDone) }
# func (f *Foo) Third(p func())  { <-f.secondDone; p() }
`,
  explain: {
    en: `<p>Model the order as a tiny <strong>dependency graph</strong> (first → second → third) and put a one-shot gate on each edge.</p>
<ul>
<li><strong>Event / CountDownLatch(1) / closed channel</strong>: opens once, stays open. A thread that arrives <em>after</em> the gate opened passes straight through, so there is no lost-signal problem even if C starts last.</li>
<li><strong>Semaphore(0)</strong>: <code>release()</code> in first, <code>acquire()</code> in second. Correct here, but a semaphore is a counter, not a latch: if two threads waited on the same edge, only one would pass. Pick the primitive whose meaning matches the problem.</li>
<li><strong>Memory visibility</strong> is the hidden half of the question. These primitives create a <em>happens-before</em> edge: everything thread A wrote before <code>set()</code>/<code>countDown()</code>/<code>close()</code> is visible to thread B after its <code>wait()</code>/<code>await()</code>/<code>&lt;-ch</code> returns. A plain boolean has no such guarantee in Java or Go (the compiler may hoist the read out of the loop, so the loop spins forever). In Java, <code>volatile</code> would fix visibility, but busy-waiting still wastes a core.</li>
</ul>
<p>Mention what <em>not</em> to do: <code>sleep(0.1)</code> "to be sure" is a flaky test waiting to happen, and <code>join()</code> only works if one thread controls the others, which the problem doesn't allow. Background: <a href="#/lesson/pr-concurrency-parallelism">concurrency vs parallelism</a>.</p>`,
    he: `<p>תחשוב על הסדר כעל <strong>גרף תלויות</strong> קטן: first, אחריו second, ואחריו third, ותשים שער חד-פעמי על כל קשת.</p>
<ul>
<li><strong>Event / CountDownLatch(1) / channel סגור</strong>: נפתח פעם אחת ונשאר פתוח. thread שמגיע <em>אחרי</em> שהשער נפתח עובר ישר. לכן אין בעיה של signal שהלך לאיבוד, גם אם C מתחיל אחרון.</li>
<li><strong>Semaphore(0)</strong>: <code>release()</code> ב-first, ו-<code>acquire()</code> ב-second. נכון כאן, אבל semaphore הוא מונה, לא latch: אם שני thread-ים היו מחכים על אותה קשת, רק אחד היה עובר. תבחר primitive שהמשמעות שלו מתאימה לבעיה.</li>
<li><strong>Memory visibility</strong> הוא החצי הנסתר של השאלה. ה-primitives האלה יוצרים קשת <em>happens-before</em>: כל מה ש-thread A כתב לפני <code>set()</code>/<code>countDown()</code>/<code>close()</code> נראה ל-thread B אחרי ש-<code>wait()</code>/<code>await()</code>/<code>&lt;-ch</code> חוזר. ל-boolean רגיל אין הבטחה כזאת ב-Java או ב-Go: הקומפיילר יכול להוציא את הקריאה מהלולאה, והלולאה תסתובב לנצח. ב-Java, ‏<code>volatile</code> פותר את ה-visibility, אבל busy-waiting עדיין מבזבז core.</li>
</ul>
<p>תזכיר גם מה <em>לא</em> לעשות: <code>sleep(0.1)</code> "ליתר ביטחון" הוא flaky test שמחכה לקרות. ו-<code>join()</code> עובד רק אם thread אחד שולט באחרים, והבעיה לא מאפשרת את זה. רקע: <a href="#/lesson/pr-concurrency-parallelism">concurrency מול parallelism</a>.</p>`
  },
  complexity: "Time O(1) per call (plus waiting); Space O(1)",
  whyInfra: {
    en: "Startup ordering with \"wait until X is ready\" gates is everywhere: a service must not take traffic before its config and DB pool are loaded (the readiness gate), Kubernetes init containers run strictly in order before the app container, and a Go server typically closes a <code>ready</code> channel that health checks and workers wait on. In tests, replacing <code>sleep()</code> with a latch is the standard fix for flaky CI. Graceful shutdown is the same pattern in reverse: stop accepting, drain in-flight requests, then close the pool.",
    he: "סדר עלייה עם שערים של \"תחכה עד ש-X מוכן\" נמצא בכל מקום: שירות לא אמור לקבל traffic לפני שה-config וה-DB pool שלו נטענו (ה-readiness gate), ב-Kubernetes ה-init containers רצים בסדר קבוע לפני ה-container של האפליקציה, ושרת Go בדרך כלל סוגר channel בשם <code>ready</code> שה-health checks וה-workers מחכים עליו. בטסטים, החלפת <code>sleep()</code> ב-latch היא התיקון הסטנדרטי ל-CI שהוא flaky. Graceful shutdown הוא אותו pattern הפוך: מפסיקים לקבל בקשות, מחכים שהבקשות הפתוחות יסתיימו, ואז סוגרים את ה-pool."
  },
  followUps: [
    { q: { en: "Generalize to N steps that must run in order.", he: "תכליל ל-N שלבים שחייבים לרוץ לפי הסדר." },
      a: { en: "Keep a shared <code>turn</code> counter under one lock + one condition. Step i waits <code>while turn != i</code>, runs, sets <code>turn = i + 1</code> and calls <code>notify_all()</code> (all waiters wait for different values, so notifying one could wake the wrong thread). Or use an array of N-1 events.", he: "מחזיקים מונה משותף <code>turn</code> תחת lock אחד ו-condition אחד. שלב i מחכה <code>while turn != i</code>, רץ, מעדכן <code>turn = i + 1</code> וקורא ל-<code>notify_all()</code>. כל מי שמחכה, מחכה לערך אחר, ולכן notify לאחד יכול להעיר את ה-thread הלא נכון. אפשרות אחרת: מערך של N-1 events." } },
    { q: { en: "Two threads must alternate forever: foo, bar, foo, bar (LeetCode 1115). What changes?", he: "שני thread-ים צריכים להתחלף לנצח: foo, bar, foo, bar (LeetCode 1115). מה משתנה?" },
      a: { en: "The gates must be reusable, so a latch no longer fits. Use two semaphores: <code>foo_sem = Semaphore(1)</code>, <code>bar_sem = Semaphore(0)</code>. foo does <code>foo_sem.acquire(); print; bar_sem.release()</code> and bar does the mirror. This is the ping-pong hand-off pattern.", he: "השערים צריכים להיות רב-פעמיים, אז latch כבר לא מתאים. משתמשים בשני semaphores: <code>foo_sem = Semaphore(1)</code> ו-<code>bar_sem = Semaphore(0)</code>. foo עושה <code>foo_sem.acquire(); print; bar_sem.release()</code>, ו-bar עושה את ההפך. זה pattern של מסירה בפינג-פונג." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 3. Thread-safe token bucket rate limiter                            */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "thread-safe-rate-limiter",
  icon: "🔒",
  difficulty: "medium",
  tags: ["concurrency", "rate-limiting", "atomics", "cas", "design"],
  title: { en: "Thread-safe Token Bucket Rate Limiter", he: "Rate Limiter מסוג Token Bucket שהוא thread-safe" },
  statement: {
    en: `<p>A single <code>TokenBucket(rate, capacity)</code> instance protects a downstream API. It is shared by <strong>hundreds of request-handling threads</strong>.</p>
<ul>
<li><code>try_acquire(n=1) -&gt; bool</code>: non-blocking. Take <code>n</code> tokens if available, otherwise return <code>False</code> and take nothing.</li>
<li><code>acquire(n=1, timeout=None) -&gt; bool</code>: blocking. Wait until the caller may proceed. Callers must be served <strong>in arrival order</strong> (no starvation of large requests by a stream of small ones). If the wait would exceed <code>timeout</code>, return <code>False</code> immediately without waiting.</li>
</ul>
<p>Requirements: never hand out more than <code>capacity + rate · t</code> tokens in any window of <code>t</code> seconds, under any interleaving. Don't use a background refill thread. Use a clock that can't jump backwards.</p>`,
    he: `<p>מופע אחד של <code>TokenBucket(rate, capacity)</code> מגן על API חיצוני. <strong>מאות thread-ים</strong> שמטפלים בבקשות משתפים אותו.</p>
<ul>
<li><code>try_acquire(n=1) -&gt; bool</code>: לא חוסם. לוקח <code>n</code> טוקנים אם יש, אחרת מחזיר <code>False</code> ולא לוקח כלום.</li>
<li><code>acquire(n=1, timeout=None) -&gt; bool</code>: חוסם. מחכה עד שמותר לקורא להמשיך. הקוראים חייבים לקבל שירות <strong>לפי סדר ההגעה</strong>: זרם של בקשות קטנות לא יכול להרעיב בקשה גדולה. אם ההמתנה תעבור את <code>timeout</code>, מחזירים <code>False</code> מיד בלי לחכות.</li>
</ul>
<p>דרישות: אסור לחלק יותר מ-<code>capacity + rate · t</code> טוקנים בשום חלון של <code>t</code> שניות, בשום שזירה של thread-ים. בלי thread ברקע שממלא את ה-bucket. תשתמש בשעון שלא יכול לקפוץ אחורה.</p>`
  },
  examples: `tb = TokenBucket(rate=10, capacity=5)    # 10 tokens/s, bursts of 5
# 8 threads call try_acquire() at the same instant:
-> exactly 5 True, 3 False                # never 6, whatever the interleaving

tb = TokenBucket(rate=10, capacity=5)    # full again
tb.acquire(5)  -> True immediately        # tokens: 0
tb.acquire(3)  -> True after ~0.3 s       # reserved, tokens: -3
tb.try_acquire(1) -> False                # can't jump ahead of the waiter
tb.acquire(5, timeout=0.2) -> False       # would need ~0.5 s, gives up at once`,
  hints: [
    { en: "Start from the single-threaded lazy-refill bucket: state is (tokens, last_refill_time); on each call add elapsed · rate, capped at capacity. Where exactly is the race if two threads run it at once?", he: "תתחיל מה-bucket החד-thread-י עם lazy refill: ה-state הוא (tokens, last_refill_time), ובכל קריאה מוסיפים elapsed · rate עד capacity. איפה בדיוק ה-race אם שני thread-ים מריצים את זה ביחד?" },
    { en: "Read-refill-check-decrement is one compound operation: put all of it in one critical section (or one CAS on an immutable state object). Don't sleep while holding the lock.", he: "קריאה, מילוי, בדיקה והורדה הם פעולה מורכבת אחת: את כולה שמים ב-critical section אחד (או CAS אחד על אובייקט state שלא משתנה). לא ישנים כשמחזיקים את ה-lock." },
    { en: "For fairness, let acquire() reserve tokens even if that makes the balance negative, compute how long the debt takes to repay, and sleep that long outside the lock. Later callers queue behind the debt automatically.", he: "בשביל fairness, תן ל-acquire() לשריין טוקנים גם אם היתרה יורדת מתחת לאפס, תחשב כמה זמן ייקח להחזיר את החוב, ותישן את הזמן הזה מחוץ ל-lock. קוראים מאוחרים יותר נכנסים לתור מאחורי החוב באופן אוטומטי." }
  ],
  solution: String.raw`import threading
import time
from typing import Callable, Optional


class TokenBucket:
    """Thread-safe token bucket: lazy refill, monotonic clock, FIFO reservations."""

    def __init__(self, rate: float, capacity: float,
                 clock: Callable[[], float] = time.monotonic):
        if rate <= 0 or capacity <= 0:
            raise ValueError("rate and capacity must be > 0")
        self.rate = float(rate)
        self.capacity = float(capacity)
        self.clock = clock                 # monotonic: NTP/wall-clock jumps can't mint tokens
        self.tokens = float(capacity)      # may go NEGATIVE = tokens already promised to waiters
        self.last = clock()
        self.lock = threading.Lock()

    def _refill(self, now: float) -> None:
        # caller must hold self.lock
        if now > self.last:
            self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
            self.last = now

    def try_acquire(self, n: float = 1.0) -> bool:
        if n > self.capacity:
            raise ValueError("n > capacity can never succeed")
        with self.lock:                    # read-refill-check-decrement is ONE atomic step
            self._refill(self.clock())
            if self.tokens >= n:           # negative balance => waiters first, no barging
                self.tokens -= n
                return True
            return False

    def acquire(self, n: float = 1.0, timeout: Optional[float] = None) -> bool:
        if n > self.capacity:
            raise ValueError("n > capacity can never succeed")
        with self.lock:
            self._refill(self.clock())
            wait = max(0.0, (n - self.tokens) / self.rate)   # time until the debt is repaid
            if timeout is not None and wait > timeout:
                return False               # fail fast, reserve nothing
            self.tokens -= n               # reserve now: our place in line is fixed
        if wait > 0:
            time.sleep(wait)               # sleep OUTSIDE the lock
        return True


# ===================== Java: lock-free CAS loop (try_acquire) =====================
# final class CasTokenBucket {
#     private record State(double tokens, long lastNanos) {}   // immutable snapshot
#     private final double ratePerNano, capacity;
#     private final AtomicReference<State> state;
#
#     CasTokenBucket(double ratePerSec, double capacity) {
#         this.ratePerNano = ratePerSec / 1e9;
#         this.capacity = capacity;
#         this.state = new AtomicReference<>(new State(capacity, System.nanoTime()));
#     }
#
#     boolean tryAcquire() {
#         while (true) {
#             State cur = state.get();
#             long now = System.nanoTime();                   // monotonic, unlike currentTimeMillis
#             long elapsed = Math.max(0, now - cur.lastNanos());
#             double tokens = Math.min(capacity, cur.tokens() + elapsed * ratePerNano);
#             if (tokens < 1) return false;
#             State next = new State(tokens - 1, Math.max(now, cur.lastNanos()));
#             if (state.compareAndSet(cur, next)) return true; // lost the race? retry
#         }
#     }
# }
`,
  explain: {
    en: `<p><strong>The race.</strong> The single-threaded bucket does read tokens → add refill → check → subtract. Two threads that both read <code>tokens = 1</code> both pass the check and both subtract: you handed out 2 tokens from a bucket of 1. Any check-then-act on shared state must be atomic. Two ways to get there:</p>
<ul>
<li><strong>One lock</strong> around the whole sequence. The critical section is a few float operations (well under a microsecond), so even with hundreds of threads the lock is rarely the bottleneck. Simple and obviously correct: the default answer.</li>
<li><strong>A CAS loop</strong> over an immutable <code>(tokens, last)</code> snapshot (Java version above, or pack both into one 64-bit <code>AtomicLong</code>). Lock-free: a thread never blocks while holding something. Under heavy contention, CAS failures and retries burn CPU, so it is not automatically faster. Note that two separate atomics (one for tokens, one for the timestamp) are <em>not</em> enough: the pair must change together.</li>
</ul>
<p><strong>Monotonic time.</strong> <code>time.time()</code> / <code>currentTimeMillis()</code> follow the wall clock, which NTP can step backwards (negative elapsed time) or forwards (an instant full bucket). Use <code>time.monotonic()</code>, <code>System.nanoTime()</code>, or Go's <code>time.Now()</code>, which carries a monotonic reading that <code>Sub</code> uses.</p>
<p><strong>Fairness by reservation.</strong> <code>acquire</code> subtracts its tokens immediately, even into a negative balance, and sleeps exactly long enough for the debt to be repaid. The order in which threads get the lock becomes the order they are served, and a later <code>try_acquire</code> sees a negative balance and can't jump the line. A large request is never starved by small ones. This is how Guava's <code>RateLimiter</code> and Go's <code>golang.org/x/time/rate</code> (<code>Reserve</code>/<code>Wait</code>) work. Never sleep while holding the lock: that would serialize every caller behind the slowest one. Algorithms compared: <a href="#/lesson/pr-rate-limiters">rate limiters</a>.</p>`,
    he: `<p><strong>ה-race.</strong> ה-bucket החד-thread-י קורא tokens, מוסיף refill, בודק ומוריד. שני thread-ים שקראו שניהם <code>tokens = 1</code> עוברים שניהם את הבדיקה ושניהם מורידים: חילקת 2 טוקנים מ-bucket של 1. כל check-then-act על state משותף חייב להיות אטומי. יש שתי דרכים:</p>
<ul>
<li><strong>lock אחד</strong> סביב כל הרצף. ה-critical section הוא כמה פעולות float (הרבה פחות ממיקרו-שנייה), אז גם עם מאות thread-ים ה-lock כמעט אף פעם לא צוואר הבקבוק. פשוט ונכון בעליל: זו תשובת ברירת המחדל.</li>
<li><strong>לולאת CAS</strong> על snapshot שלא משתנה של <code>(tokens, last)</code> (גרסת ה-Java למעלה, או לארוז את שניהם ל-<code>AtomicLong</code> אחד של 64 bits). Lock-free: אף thread לא נחסם כשהוא מחזיק משהו. תחת contention כבד, כשלונות CAS וניסיונות חוזרים שורפים CPU, אז זה לא בהכרח מהיר יותר. שים לב ששני atomics נפרדים (אחד ל-tokens ואחד ל-timestamp) <em>לא</em> מספיקים: הזוג חייב להשתנות ביחד.</li>
</ul>
<p><strong>זמן monotonic.</strong> <code>time.time()</code> ו-<code>currentTimeMillis()</code> הולכים לפי שעון הקיר, ו-NTP יכול להזיז אותו אחורה (זמן שעבר שלילי) או קדימה (bucket מלא ברגע). תשתמש ב-<code>time.monotonic()</code>, ב-<code>System.nanoTime()</code>, או ב-<code>time.Now()</code> של Go, שנושא קריאה monotonic ש-<code>Sub</code> משתמש בה.</p>
<p><strong>Fairness דרך שריון.</strong> <code>acquire</code> מוריד את הטוקנים שלו מיד, גם לתוך יתרה שלילית, וישן בדיוק את הזמן שלוקח להחזיר את החוב. הסדר שבו thread-ים תופסים את ה-lock הופך לסדר שבו הם מקבלים שירות, ו-<code>try_acquire</code> מאוחר יותר רואה יתרה שלילית ולא יכול לעקוף את התור. בקשה גדולה אף פעם לא מורעבת על ידי קטנות. ככה עובדים <code>RateLimiter</code> של Guava ו-<code>golang.org/x/time/rate</code> של Go (<code>Reserve</code>/<code>Wait</code>). אף פעם לא ישנים כשמחזיקים את ה-lock: זה היה מעמיד כל קורא בתור מאחורי האיטי ביותר. השוואת אלגוריתמים: <a href="#/lesson/pr-rate-limiters">rate limiters</a>.</p>`
  },
  complexity: "Time O(1) per call (CAS: O(1) expected, retries under contention); Space O(1)",
  whyInfra: {
    en: "Client-side rate limiting is how you stay under a provider's quota: the Kubernetes client-go <code>QPS</code>/<code>Burst</code> settings are a token bucket shared by every goroutine of a controller, the AWS SDKs use a token bucket for retries, and API gateways (Envoy local rate limit, NGINX <code>limit_req</code>) enforce one per worker. Getting the locking wrong shows up as bursts above the quota and HTTP 429s or throttled cloud API calls during an incident, exactly when you need those calls most.",
    he: "Rate limiting בצד ה-client הוא הדרך להישאר מתחת ל-quota של ספק: ההגדרות <code>QPS</code>/<code>Burst</code> של client-go ב-Kubernetes הן token bucket שכל ה-goroutines של controller משתפים, ה-SDKs של AWS משתמשים ב-token bucket ל-retries, ו-API gateways (local rate limit של Envoy, <code>limit_req</code> של NGINX) אוכפים אחד לכל worker. טעות ב-locking מתבטאת ב-bursts מעל ה-quota, וב-HTTP 429 או ב-throttling של קריאות cloud API באמצע אירוע, בדיוק כשהכי צריך אותן."
  },
  followUps: [
    { q: { en: "Now 50 API servers must share one global limit. Make it distributed with Redis.", he: "עכשיו 50 שרתי API צריכים לחלוק limit גלובלי אחד. תהפוך את זה ל-distributed עם Redis." },
      a: { en: `<p>Keep the bucket as a hash in Redis and run refill-check-decrement as one <strong>Lua script</strong>. Redis executes a script atomically (nothing else runs in between), so it plays the role of the lock. Take the time from Redis itself so 50 servers with skewed clocks agree:</p>
<pre>-- KEYS[1] = bucket key, ARGV = rate (tokens/s), capacity, n
local rate, cap, n = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local t = redis.call('TIME')
local now = tonumber(t[1]) + tonumber(t[2]) / 1e6
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + math.max(0, now - ts) * rate)
local ok = 0
if tokens &gt;= n then tokens = tokens - n; ok = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return ok</pre>
<p>Call it with <code>EVALSHA</code>. The <code>PEXPIRE</code> drops idle buckets (a full bucket needs no state). Use a key per tenant; in Redis Cluster one key lives on one shard, so a very hot tenant becomes a hot shard. To save a network round trip per request, each server can lease a batch of tokens (say 10% of the rate) and spend them locally.</p>`,
           he: `<p>מחזיקים את ה-bucket כ-hash ב-Redis ומריצים את המילוי, הבדיקה וההורדה כ-<strong>סקריפט Lua</strong> אחד. Redis מריץ סקריפט באופן אטומי (שום דבר אחר לא רץ באמצע), אז הוא ממלא את התפקיד של ה-lock. את הזמן לוקחים מ-Redis עצמו, כדי ש-50 שרתים עם שעונים לא מסונכרנים יסכימו:</p>
<pre>-- KEYS[1] = bucket key, ARGV = rate (tokens/s), capacity, n
local rate, cap, n = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local t = redis.call('TIME')
local now = tonumber(t[1]) + tonumber(t[2]) / 1e6
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + math.max(0, now - ts) * rate)
local ok = 0
if tokens &gt;= n then tokens = tokens - n; ok = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return ok</pre>
<p>קוראים לו עם <code>EVALSHA</code>. ה-<code>PEXPIRE</code> מנקה buckets שלא בשימוש (bucket מלא לא צריך state). מפתח לכל tenant; ב-Redis Cluster כל מפתח יושב על shard אחד, אז tenant חם מאוד הופך ל-shard חם. כדי לחסוך round trip ברשת לכל בקשה, כל שרת יכול לקחת \"חכירה\" של כמה טוקנים (נניח 10% מהקצב) ולבזבז אותם מקומית.</p>` } },
    { q: { en: "Is Python's lock FIFO-fair? Does it matter here?", he: "האם ה-lock של Python הוגן לפי FIFO? זה משנה כאן?" },
      a: { en: "No: <code>threading.Lock</code> (and Java's default <code>ReentrantLock</code>) allow barging, so a newly arriving thread can grab the lock before one that has waited. Here the lock is held for under a microsecond, so the unfairness is tiny; the reservation makes service order follow lock order. If you need strict FIFO, Java has <code>new ReentrantLock(true)</code> or <code>new Semaphore(n, true)</code>, at a real throughput cost.", he: "לא. <code>threading.Lock</code> (וגם <code>ReentrantLock</code> הרגיל של Java) מאפשרים barging: thread שרק הגיע יכול לתפוס את ה-lock לפני thread שכבר חיכה. כאן ה-lock מוחזק פחות ממיקרו-שנייה, אז חוסר ההוגנות זניח, והשריון גורם לסדר השירות להיות סדר ה-lock. אם צריך FIFO קפדני, ב-Java יש <code>new ReentrantLock(true)</code> או <code>new Semaphore(n, true)</code>, במחיר אמיתי של throughput." } },
    { q: { en: "A thread waiting in acquire() is cancelled (client disconnected). What happens to its reserved tokens?", he: "thread שמחכה ב-acquire() מבוטל (ה-client התנתק). מה קורה לטוקנים ששוריינו לו?" },
      a: { en: "With the simple version they are lost: the bucket stays in debt and slows everyone else. Go's <code>rate.Reservation.Cancel()</code> solves this by returning the tokens, but only the part not yet \"overtaken\" by later reservations. Simpler alternative: cap the debt (refuse when the wait would exceed a max queue time) so a burst of cancelled waiters can't stall the limiter for long.", he: "בגרסה הפשוטה הם אובדים: ה-bucket נשאר בחוב ומאט את כל השאר. <code>rate.Reservation.Cancel()</code> של Go פותר את זה ומחזיר את הטוקנים, אבל רק את החלק ששריונים מאוחרים יותר עוד לא \"עקפו\". חלופה פשוטה יותר: לשים תקרה על החוב (לסרב כשההמתנה תעבור זמן תור מקסימלי), כך שגל של ממתינים שבוטלו לא יתקע את ה-limiter לאורך זמן." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 4. Web Crawler Multithreaded (LC 1242)                              */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "web-crawler-multithreaded",
  icon: "🕸️",
  difficulty: "medium",
  tags: ["concurrency", "bfs", "graph", "worker-pool", "termination-detection"],
  leetcode: "1242",
  title: { en: "Web Crawler Multithreaded", he: "Web Crawler עם כמה thread-ים" },
  statement: {
    en: `<p>Given <code>startUrl</code> and an <code>HtmlParser</code> with a <strong>blocking, slow</strong> method <code>getUrls(url) -&gt; List[str]</code> (an HTTP fetch, ~15 ms or more), crawl every page reachable from <code>startUrl</code> that has the <strong>same hostname</strong>. Return all of them in any order. Each URL must be fetched <strong>at most once</strong>.</p>
<p>A single-threaded BFS is too slow. Fetch in parallel with a <strong>bounded</strong> number of workers (you must not open thousands of connections), and return exactly when the crawl is finished: no sleeping, no "stop when the queue looks empty".</p>`,
    he: `<p>נתונים <code>startUrl</code> ו-<code>HtmlParser</code> עם מתודה <strong>חוסמת ואיטית</strong> <code>getUrls(url) -&gt; List[str]</code> (בקשת HTTP, בערך 15 ms או יותר). תסרוק כל דף שאפשר להגיע אליו מ-<code>startUrl</code> ושיש לו <strong>אותו hostname</strong>. תחזיר את כולם בכל סדר. כל URL נסרק <strong>לכל היותר פעם אחת</strong>.</p>
<p>BFS ב-thread אחד איטי מדי. תסרוק במקביל עם מספר <strong>חסום</strong> של workers (אסור לפתוח אלפי חיבורים), ותחזיר בדיוק כשהסריקה נגמרה: בלי sleep, ובלי \"לעצור כשהתור נראה ריק\".</p>`
  },
  examples: `startUrl = "http://news.example.org/news/topics/"
links:
  /news/topics/       -> [/news, /news/topics/, http://news.example.com/]
  /news               -> [/news/topics/]
  (other host)        -> ignored
Output (any order):
  ["http://news.example.org/news/topics/", "http://news.example.org/news"]`,
  hints: [
    { en: "It's BFS/DFS over a graph where expanding a node is slow I/O. The work is I/O-bound, so threads help even in Python (the GIL is released while waiting on the network).", he: "זה BFS או DFS על גרף שבו הרחבת צומת היא I/O איטי. העבודה היא I/O-bound, ולכן thread-ים עוזרים גם ב-Python: ה-GIL משתחרר בזמן ההמתנה לרשת." },
    { en: "Mark a URL visited when you schedule it, not when you finish fetching it, and make check-and-add atomic. Otherwise two workers discover the same link and both fetch it.", he: "תסמן URL כ-visited כשאתה מתזמן אותו, לא כשסיימת לסרוק אותו, ותדאג שה-check-and-add יהיה אטומי. אחרת שני workers מגלים את אותו לינק ושניהם סורקים אותו." },
    { en: "Termination: \"the queue is empty\" is not enough, because a worker that is still fetching may add more URLs. Track in-flight tasks: you are done when nothing is queued AND nothing is running.", he: "סיום: \"התור ריק\" לא מספיק, כי worker שעדיין סורק יכול להוסיף עוד URLs. תעקוב אחרי משימות פתוחות: סיימת כשאין כלום בתור וגם אין כלום שרץ." }
  ],
  solution: String.raw`from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from typing import List
from urllib.parse import urlsplit


class Solution:
    def crawl(self, startUrl: str, htmlParser: "HtmlParser") -> List[str]:
        host = urlsplit(startUrl).hostname
        visited = {startUrl}               # owned by THIS thread only -> no lock needed

        # Bounded pool: at most 16 fetches in flight, whatever the graph size.
        with ThreadPoolExecutor(max_workers=16) as pool:
            pending = {pool.submit(htmlParser.getUrls, startUrl)}
            while pending:                 # termination: no task queued or running
                done, pending = wait(pending, return_when=FIRST_COMPLETED)
                for fut in done:
                    for url in fut.result():
                        if urlsplit(url).hostname == host and url not in visited:
                            visited.add(url)            # mark when scheduled
                            pending.add(pool.submit(htmlParser.getUrls, url))
        return list(visited)


# ============ Go: shared visited set + WaitGroup + semaphore channel ============
# func crawl(startURL string, getURLs func(string) []string) []string {
#     host := hostOf(startURL)
#     var mu sync.Mutex
#     visited := map[string]bool{startURL: true}
#     sem := make(chan struct{}, 16)          // at most 16 fetches in flight
#     var wg sync.WaitGroup                   // counts in-flight crawl tasks
#
#     var visit func(u string)
#     visit = func(u string) {
#         defer wg.Done()
#         sem <- struct{}{}
#         links := getURLs(u)                 // slow I/O, no lock held
#         <-sem
#         for _, v := range links {
#             if hostOf(v) != host {
#                 continue
#             }
#             mu.Lock()
#             seen := visited[v]              // check-and-add is atomic
#             visited[v] = true
#             mu.Unlock()
#             if !seen {
#                 wg.Add(1)                   // BEFORE our own Done: count can't hit 0 early
#                 go visit(v)
#             }
#         }
#     }
#     wg.Add(1)
#     go visit(startURL)
#     wg.Wait()                               // returns when every task is done
#
#     out := make([]string, 0, len(visited))
#     for u := range visited {
#         out = append(out, u)
#     }
#     return out
# }
#
# func hostOf(raw string) string {
#     u, err := url.Parse(raw)
#     if err != nil {
#         return ""
#     }
#     return u.Hostname()
# }
`,
  explain: {
    en: `<p>Three concurrency problems hide in this "just BFS" question:</p>
<ul>
<li><strong>Bounded parallelism.</strong> One thread per URL would open thousands of sockets and get you rate-limited or OOM-killed. Python: a <code>ThreadPoolExecutor(max_workers=16)</code>. Go: goroutines are cheap, so spawn freely but gate the <em>fetch</em> with a buffered channel used as a semaphore.</li>
<li><strong>Exactly-once fetch.</strong> <code>if url not in visited: visited.add(url)</code> is a check-then-act. With many writers it must be under a mutex (Go version), or <code>ConcurrentHashMap.newKeySet().add(url)</code> in Java, whose return value tells you atomically whether you won. The Python version avoids the problem by design: workers only fetch, and the coordinator thread is the <strong>single writer</strong> of <code>visited</code>. Mark on schedule, not on completion, or a page linked from 10 pages gets fetched 10 times.</li>
<li><strong>Termination detection.</strong> An empty queue doesn't mean done: a worker in the middle of <code>getUrls</code> may be about to add 50 URLs. You need a count of in-flight tasks. Python: the <code>pending</code> set of futures; when it's empty, nothing can produce more work. Go: a <code>WaitGroup</code>, where the crucial detail is calling <code>wg.Add(1)</code> for the child <em>before</em> the parent's deferred <code>Done()</code> runs, so the counter never touches zero while work remains.</li>
</ul>
<p>Hostname check: compare <code>urlsplit(u).hostname</code>, not a string prefix. <code>http://news.example.org.evil.com</code> starts with the same prefix.</p>`,
    he: `<p>שלוש בעיות concurrency מתחבאות בשאלה שנראית כמו \"סתם BFS\":</p>
<ul>
<li><strong>מקביליות חסומה.</strong> thread לכל URL היה פותח אלפי sockets, ומביא עליך rate limiting או OOM kill. ב-Python: <code>ThreadPoolExecutor(max_workers=16)</code>. ב-Go: goroutines זולים, אז מריצים בחופשיות אבל חוסמים את ה-<em>fetch</em> עם channel עם buffer שמשמש כ-semaphore.</li>
<li><strong>סריקה בדיוק פעם אחת.</strong> <code>if url not in visited: visited.add(url)</code> הוא check-then-act. עם הרבה כותבים הוא חייב להיות תחת mutex (גרסת ה-Go), או <code>ConcurrentHashMap.newKeySet().add(url)</code> ב-Java, שערך ההחזרה שלו אומר באופן אטומי אם ניצחת. גרסת ה-Python עוקפת את הבעיה בתכנון: ה-workers רק סורקים, וה-thread המתאם הוא <strong>הכותב היחיד</strong> של <code>visited</code>. מסמנים בזמן התזמון, לא בסיום. אחרת דף שמקושר מ-10 דפים ייסרק 10 פעמים.</li>
<li><strong>זיהוי סיום.</strong> תור ריק לא אומר שסיימנו: worker שנמצא באמצע <code>getUrls</code> אולי עומד להוסיף 50 URLs. צריך מונה של משימות פתוחות. ב-Python: ה-set בשם <code>pending</code> של futures. כשהוא ריק, שום דבר כבר לא יכול לייצר עוד עבודה. ב-Go: ‏<code>WaitGroup</code>, והפרט הקריטי הוא לקרוא ל-<code>wg.Add(1)</code> בשביל הילד <em>לפני</em> שה-<code>Done()</code> של האב רץ, כך שהמונה אף פעם לא נוגע באפס כשעוד יש עבודה.</li>
</ul>
<p>בדיקת hostname: משווים את <code>urlsplit(u).hostname</code>, לא prefix של מחרוזת. <code>http://news.example.org.evil.com</code> מתחיל באותו prefix.</p>`
  },
  complexity: "Time O(V + E) work, wall-clock ≈ (V / workers) · fetch latency; Space O(V)",
  whyInfra: {
    en: "Fan-out with a bounded pool and \"done when nothing is in flight\" is the core of many infra tools: a Kubernetes controller's workqueue (deduplicates keys so one object is never processed by two workers at once, with a fixed number of workers), Prometheus service discovery and scrape pools, a link checker in CI, a backup job walking an S3 bucket with parallel <code>ListObjectsV2</code> calls, or <code>terraform</code> walking its dependency graph with <code>-parallelism=10</code> (the default). The bug classes are the same: duplicate work, too many connections, and jobs that exit early or hang at the end.",
    he: "Fan-out עם pool חסום ו\"סיימנו כשאין כלום באוויר\" הוא הלב של הרבה כלי תשתית: ה-workqueue של controller ב-Kubernetes (מסיר כפילויות של keys כדי שאובייקט אחד לא יעובד על ידי שני workers במקביל, עם מספר קבוע של workers), service discovery ו-scrape pools של Prometheus, link checker ב-CI, job של גיבוי שעובר על S3 bucket עם קריאות <code>ListObjectsV2</code> במקביל, או <code>terraform</code> שעובר על גרף התלויות שלו עם <code>-parallelism=10</code> (ברירת המחדל). סוגי הבאגים זהים: עבודה כפולה, יותר מדי חיבורים, ו-jobs שיוצאים מוקדם או נתקעים בסוף."
  },
  followUps: [
    { q: { en: "Now the crawler runs on 100 machines. How do you share the visited set and detect termination?", he: "עכשיו ה-crawler רץ על 100 מכונות. איך משתפים את ה-visited set ומזהים סיום?" },
      a: { en: "Partition URLs by <code>hash(hostname) % N</code>: each machine owns a set of hosts, keeps their visited set locally, and forwards discovered URLs to the owner (one owner per host also makes per-host politeness easy). For a large visited set use a Bloom filter (a few false positives = a few missed pages). Termination becomes distributed: a coordinator tracks per-node counts of sent vs processed messages and declares done when all queues are empty and the counts match across two consecutive rounds (a simplified Dijkstra-Scholten / Safra idea). In practice, frameworks like a queue (SQS/Kafka) + workers just stop when the queue is empty and nothing is in flight for a while.", he: "מחלקים URLs לפי <code>hash(hostname) % N</code>: כל מכונה אחראית על קבוצת hosts, מחזיקה את ה-visited שלהם מקומית, ומעבירה URLs שגילתה לבעלים שלהם (בעלים אחד לכל host גם מקל על נימוס כלפי כל host). ל-visited set גדול משתמשים ב-Bloom filter (כמה false positives = כמה דפים שפוספסו). הסיום הופך ל-distributed: coordinator סופר בכל node כמה הודעות נשלחו מול כמה עובדו, ומכריז על סיום כשכל התורים ריקים והמספרים תואמים בשני סבבים רצופים (רעיון מפושט של Dijkstra-Scholten או Safra). בפועל, תור (SQS/Kafka) ו-workers פשוט עוצרים כשהתור ריק ואין כלום באוויר לזמן מה." } },
    { q: { en: "How do you avoid hammering one host?", he: "איך נמנעים מלהפציץ host אחד?" },
      a: { en: "Per-host politeness: a separate queue and a token bucket (or a minimum delay) per host, honor <code>robots.txt</code> and <code>Crawl-delay</code>, cap concurrent connections per host (say 2), and back off on 429/503 with jitter. The global worker pool picks from the host queues whose next allowed time has passed.", he: "נימוס לכל host: תור נפרד ו-token bucket (או השהיה מינימלית) לכל host, לכבד <code>robots.txt</code> ו-<code>Crawl-delay</code>, תקרה על חיבורים במקביל לכל host (נניח 2), ו-backoff עם jitter על 429 או 503. ה-pool הגלובלי של ה-workers בוחר מתורי ה-hosts שזמן ההיתר הבא שלהם כבר עבר." } },
    { q: { en: "getUrls sometimes hangs forever. What breaks and how do you fix it?", he: "getUrls לפעמים נתקע לנצח. מה נשבר ואיך מתקנים?" },
      a: { en: "A hung fetch keeps the in-flight count above zero, so the crawl never terminates, and it permanently eats one of the 16 workers. Always put a timeout on the I/O itself (connect + read timeouts on the HTTP client), not only on the future. Add retries with a cap, and record failures instead of re-queueing forever.", he: "fetch תקוע משאיר את מונה המשימות הפתוחות מעל אפס, אז הסריקה אף פעם לא מסתיימת, והוא גם תופס לתמיד אחד מ-16 ה-workers. תמיד שמים timeout על ה-I/O עצמו (connect timeout ו-read timeout ב-HTTP client), לא רק על ה-future. מוסיפים retries עם תקרה, ורושמים כשלונות במקום להחזיר לתור לנצח." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 5. The Dining Philosophers (LC 1226)                                */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "dining-philosophers",
  icon: "🍝",
  difficulty: "medium",
  tags: ["concurrency", "deadlock", "lock-ordering", "mutex"],
  leetcode: "1226",
  title: { en: "The Dining Philosophers", he: "בעיית הפילוסופים הסועדים" },
  statement: {
    en: `<p>Five philosophers (ids 0-4) sit at a round table. Between each pair of neighbours lies one fork, 5 forks in total. To eat, a philosopher needs <strong>both</strong> the fork on the left and the fork on the right. Each philosopher is a thread that calls, many times:</p>
<p><code>wantsToEat(philosopher, pickLeftFork, pickRightFork, eat, putLeftFork, putRightFork)</code></p>
<p>Implement it so that no two neighbours ever hold the same fork, the system <strong>never deadlocks</strong> (all five holding one fork and waiting forever), and no philosopher starves.</p>`,
    he: `<p>חמישה פילוסופים (מספרים 0 עד 4) יושבים סביב שולחן עגול. בין כל שני שכנים מונח מזלג אחד, 5 מזלגות בסך הכול. כדי לאכול, פילוסוף צריך את <strong>שני</strong> המזלגות: משמאל ומימין. כל פילוסוף הוא thread שקורא, הרבה פעמים, ל:</p>
<p><code>wantsToEat(philosopher, pickLeftFork, pickRightFork, eat, putLeftFork, putRightFork)</code></p>
<p>תממש את זה כך ששני שכנים אף פעם לא מחזיקים את אותו מזלג, המערכת <strong>אף פעם לא נכנסת ל-deadlock</strong> (כל החמישה מחזיקים מזלג אחד ומחכים לנצח), ואף פילוסוף לא מורעב.</p>`
  },
  examples: `n = 1  (each philosopher eats once)
Output: any interleaving where the calls of one philosopher are grouped, e.g.
  [[4,2,1],[4,1,1],[0,1,1],[2,2,1],[2,1,1],[2,0,3],[2,1,2],[2,2,2],[4,0,3],...]
  [philosopher, fork (1=left, 2=right), action (1=pick, 2=put, 3=eat)]

Deadlock with naive code:
  every philosopher runs  lock(left); lock(right)
  all 5 grab their left fork at once -> everyone waits for the right one forever`,
  hints: [
    { en: "A deadlock needs all four Coffman conditions at once: mutual exclusion, hold-and-wait, no preemption, circular wait. Which one is easiest to break here?", he: "Deadlock צריך את ארבעת תנאי Coffman בבת אחת: mutual exclusion, ‏hold-and-wait, ‏no preemption, ‏circular wait. איזה מהם הכי קל לשבור כאן?" },
    { en: "Circular wait: give every fork a global number and always lock the lower-numbered fork first. A cycle in the wait-for graph becomes impossible.", he: "Circular wait: תן לכל מזלג מספר גלובלי ותמיד תנעל קודם את המזלג עם המספר הנמוך. מעגל בגרף ההמתנה הופך לבלתי אפשרי." },
    { en: "Alternatives: a semaphore that lets at most 4 philosophers reach for forks at the same time, or one global lock (correct but only one philosopher eats at a time).", he: "חלופות: semaphore שנותן רק ל-4 פילוסופים לכל היותר לנסות לקחת מזלגות בו זמנית, או lock גלובלי אחד (נכון, אבל רק פילוסוף אחד אוכל בכל רגע)." }
  ],
  solution: String.raw`import threading
from typing import Callable


class DiningPhilosophers:
    """Deadlock-free by lock ordering: always take the lower-numbered fork first."""

    def __init__(self):
        self.forks = [threading.Lock() for _ in range(5)]

    def wantsToEat(self,
                   philosopher: int,
                   pickLeftFork: Callable[[], None],
                   pickRightFork: Callable[[], None],
                   eat: Callable[[], None],
                   putLeftFork: Callable[[], None],
                   putRightFork: Callable[[], None]) -> None:
        left = philosopher
        right = (philosopher + 1) % 5
        # Global order on locks breaks CIRCULAR WAIT. Philosopher 4 needs forks
        # 4 and 0, so it takes 0 first: it reaches "against" the others.
        first, second = min(left, right), max(left, right)
        with self.forks[first], self.forks[second]:
            pickLeftFork()
            pickRightFork()
            eat()
            putLeftFork()
            putRightFork()


# ======================= Java: same ordering, explicit unlock =======================
# class DiningPhilosophers {
#     private final ReentrantLock[] forks = new ReentrantLock[5];
#     { for (int i = 0; i < 5; i++) forks[i] = new ReentrantLock(); }
#
#     public void wantsToEat(int p, Runnable pickLeftFork, Runnable pickRightFork,
#                            Runnable eat, Runnable putLeftFork, Runnable putRightFork)
#             throws InterruptedException {
#         int left = p, right = (p + 1) % 5;
#         ReentrantLock a = forks[Math.min(left, right)], b = forks[Math.max(left, right)];
#         a.lock();
#         try {
#             b.lock();
#             try {
#                 pickLeftFork.run(); pickRightFork.run(); eat.run();
#                 putLeftFork.run(); putRightFork.run();
#             } finally { b.unlock(); }
#         } finally { a.unlock(); }
#     }
# }
#
# ============ Alternative: limit the table to 4 (breaks circular wait too) ============
# self.seats = threading.Semaphore(4)
# with self.seats:                       # at most 4 reach for forks at once
#     with self.forks[left], self.forks[right]:
#         ...                            # pigeonhole: one of the 4 always gets both forks
`,
  explain: {
    en: `<p><strong>The Coffman conditions.</strong> A deadlock can happen only if all four hold at the same time:</p>
<ol>
<li><strong>Mutual exclusion</strong>: a fork is held by one philosopher at a time. (Inherent here.)</li>
<li><strong>Hold and wait</strong>: a philosopher holds one fork while waiting for the other.</li>
<li><strong>No preemption</strong>: nobody can take a fork away from its holder.</li>
<li><strong>Circular wait</strong>: P0 waits for P1, which waits for P2 ... which waits for P0.</li>
</ol>
<p>Break any one and deadlock is impossible. The cleanest is <strong>lock ordering</strong>, which breaks circular wait: number every lock and always acquire in increasing order. Philosophers 0-3 take their left fork first; philosopher 4 (forks 4 and 0) takes fork 0 first. A cycle would need someone holding a higher-numbered fork while waiting for a lower one, which the rule forbids.</p>
<ul>
<li><strong>Semaphore(4)</strong> ("a waiter seats at most 4"): with 4 philosophers and 5 forks, by the pigeonhole principle at least one gets both forks. Also breaks circular wait.</li>
<li><strong>tryLock with timeout, release and retry</strong>: breaks hold-and-wait (no preemption). Works, but can <em>livelock</em> (everyone grabs, everyone backs off, in sync forever) unless you add random backoff.</li>
<li><strong>One global lock</strong>: no deadlock, but zero parallelism: only one philosopher eats when two could.</li>
</ul>
<p><strong>Starvation</strong> is a separate property. Lock ordering prevents deadlock, but with non-fair locks a philosopher could in theory keep losing the race. Fair locks (FIFO) or a bounded wait fix that. Background: <a href="#/lesson/pr-race-deadlock">races and deadlocks</a>.</p>`,
    he: `<p><strong>תנאי Coffman.</strong> Deadlock יכול לקרות רק אם כל הארבעה מתקיימים בו זמנית:</p>
<ol>
<li><strong>Mutual exclusion</strong>: מזלג מוחזק על ידי פילוסוף אחד בכל רגע. (כאן זה מובנה בבעיה.)</li>
<li><strong>Hold and wait</strong>: פילוסוף מחזיק מזלג אחד ומחכה לשני.</li>
<li><strong>No preemption</strong>: אי אפשר לקחת מזלג ממי שמחזיק בו.</li>
<li><strong>Circular wait</strong>: ‏P0 מחכה ל-P1, שמחכה ל-P2, וכן הלאה, עד מישהו שמחכה ל-P0.</li>
</ol>
<p>שובר אחד מהם, ו-deadlock הופך לבלתי אפשרי. הכי נקי זה <strong>lock ordering</strong>, ששובר את ה-circular wait: ממספרים כל lock ותמיד נועלים בסדר עולה. פילוסופים 0 עד 3 לוקחים קודם את המזלג השמאלי; פילוסוף 4 (מזלגות 4 ו-0) לוקח קודם את מזלג 0. מעגל היה דורש שמישהו יחזיק מזלג עם מספר גבוה ויחכה לנמוך, והכלל אוסר את זה.</p>
<ul>
<li><strong>Semaphore(4)</strong> (\"מלצר מושיב לכל היותר 4\"): עם 4 פילוסופים ו-5 מזלגות, לפי עקרון שובך היונים לפחות אחד מקבל את שני המזלגות. גם זה שובר circular wait.</li>
<li><strong>tryLock עם timeout, שחרור וניסיון חוזר</strong>: שובר את ה-hold-and-wait. עובד, אבל יכול להיכנס ל-<em>livelock</em> (כולם תופסים, כולם משחררים, באותו קצב, לנצח), אלא אם מוסיפים backoff אקראי.</li>
<li><strong>lock גלובלי אחד</strong>: אין deadlock, אבל גם אפס מקביליות: רק פילוסוף אחד אוכל כשהיו יכולים שניים.</li>
</ul>
<p><strong>הרעבה</strong> היא תכונה נפרדת. Lock ordering מונע deadlock, אבל עם locks שלא הוגנים פילוסוף יכול תיאורטית להמשיך להפסיד במרוץ. Locks הוגנים (FIFO) או המתנה חסומה פותרים את זה. רקע: <a href="#/lesson/pr-race-deadlock">races ו-deadlocks</a>.</p>`
  },
  complexity: "Time O(1) per call (plus waiting); Space O(1) (5 locks)",
  whyInfra: {
    en: "Every system that takes more than one lock faces this. Databases: two transactions updating rows A and B in opposite orders deadlock; PostgreSQL and InnoDB detect the cycle and kill one (<code>ERROR: deadlock detected</code>), and the standard fix is to update rows in a consistent order (e.g. by primary key). The Linux kernel documents lock ordering rules and checks them at runtime with <code>lockdep</code>. Money transfers between two accounts lock both accounts in id order. In Go, <code>fatal error: all goroutines are asleep - deadlock!</code> is the runtime telling you that you built the dining philosophers.",
    he: "כל מערכת שלוקחת יותר מ-lock אחד פוגשת את זה. בבסיסי נתונים: שתי טרנזקציות שמעדכנות שורות A ו-B בסדר הפוך נתקעות ב-deadlock. PostgreSQL ו-InnoDB מזהים את המעגל והורגים אחת מהן (<code>ERROR: deadlock detected</code>), והתיקון הסטנדרטי הוא לעדכן שורות בסדר עקבי (למשל לפי primary key). ה-kernel של לינוקס מתעד כללי lock ordering ובודק אותם בזמן ריצה עם <code>lockdep</code>. העברת כסף בין שני חשבונות נועלת את שניהם לפי סדר ה-id. וב-Go, ‏<code>fatal error: all goroutines are asleep - deadlock!</code> זה ה-runtime שאומר לך שבנית את בעיית הפילוסופים."
  },
  followUps: [
    { q: { en: "Your service deadlocks in production once a week. How do you find which locks?", he: "השירות שלך נכנס ל-deadlock ב-production פעם בשבוע. איך מוצאים אילו locks?" },
      a: { en: "Take a thread dump while it's stuck: <code>jstack &lt;pid&gt;</code> (Java prints \"Found one Java-level deadlock\" with the cycle), <code>py-spy dump --pid &lt;pid&gt;</code> for Python, <code>SIGQUIT</code> or <code>/debug/pprof/goroutine?debug=2</code> for Go. Look for threads that each hold one lock and wait for another. For DB deadlocks, check the database log (<code>SHOW ENGINE INNODB STATUS</code>, or PostgreSQL's log with <code>log_lock_waits = on</code>). Then fix with a global lock order and add a timeout to every lock acquire so a hang becomes a visible error.", he: "לוקחים thread dump בזמן שהוא תקוע: <code>jstack &lt;pid&gt;</code> (ב-Java מודפס \"Found one Java-level deadlock\" עם המעגל), <code>py-spy dump --pid &lt;pid&gt;</code> ל-Python, ו-<code>SIGQUIT</code> או <code>/debug/pprof/goroutine?debug=2</code> ל-Go. מחפשים thread-ים שכל אחד מחזיק lock אחד ומחכה לאחר. ב-deadlocks של DB בודקים את הלוג של ה-DB (<code>SHOW ENGINE INNODB STATUS</code>, או הלוג של PostgreSQL עם <code>log_lock_waits = on</code>). אחר כך מתקנים עם סדר נעילה גלובלי ומוסיפים timeout לכל lock, כך ש-hang יהפוך לשגיאה גלויה." } },
    { q: { en: "Lock ordering requires knowing all locks up front. What if a thread discovers the second lock only after taking the first?", he: "Lock ordering דורש לדעת מראש את כל ה-locks. מה אם thread מגלה את ה-lock השני רק אחרי שלקח את הראשון?" },
      a: { en: "Then use tryLock: if the second lock isn't available, release everything, back off with random jitter, and retry (breaks hold-and-wait). Or detect and recover like databases do: maintain a wait-for graph, find cycles, abort one victim and let it retry. A third option is to restructure so one owner (an actor, or a single goroutine owning the state) serializes access and there is nothing to deadlock on.", he: "אז משתמשים ב-tryLock: אם ה-lock השני לא פנוי, משחררים הכול, מחכים עם jitter אקראי, ומנסים שוב (זה שובר hold-and-wait). או מזהים ומתאוששים כמו בבסיסי נתונים: מחזיקים wait-for graph, מוצאים מעגלים, מבטלים קורבן אחד ונותנים לו לנסות שוב. אפשרות שלישית היא לשנות את המבנה כך שבעלים אחד (actor, או goroutine יחיד שמחזיק את ה-state) יעשה סריאליזציה לגישה, ואז אין על מה להיתקע." } }
  ]
});

/* ------------------------------------------------------------------ */
/* 6. Concurrent LRU cache                                             */
/* ------------------------------------------------------------------ */
INFRA.problems.push({
  id: "concurrent-lru-cache",
  icon: "🧊",
  difficulty: "hard",
  tags: ["concurrency", "lru", "design", "sharding", "locks", "cache"],
  title: { en: "Concurrent LRU Cache", he: "LRU Cache שעובד עם הרבה thread-ים" },
  statement: {
    en: `<p>An in-process cache sits in front of a slow database. It is read by <strong>64 threads</strong> at ~1M <code>get</code>/s with a 95% hit rate, and has a fixed <code>capacity</code>. Design a thread-safe cache with <code>get(key)</code> and <code>put(key, value)</code> that evicts (approximately) the <strong>least recently used</strong> key when full.</p>
<ol>
<li>Give the simplest correct version first.</li>
<li>Then scale it: explain why a read-write lock does <em>not</em> help a classic LRU, and build a version where threads touching different keys don't contend.</li>
<li>Discuss approximations (CLOCK, sampled LRU) and what you give up.</li>
</ol>`,
    he: `<p>Cache בתוך התהליך יושב לפני DB איטי. <strong>64 thread-ים</strong> קוראים ממנו בקצב של בערך מיליון <code>get</code> לשנייה עם 95% hit rate, ויש לו <code>capacity</code> קבוע. תתכנן cache שהוא thread-safe, עם <code>get(key)</code> ו-<code>put(key, value)</code>, שמפנה (בקירוב) את המפתח <strong>שהשתמשו בו הכי מזמן</strong> כשהוא מלא.</p>
<ol>
<li>קודם תן את הגרסה הנכונה הכי פשוטה.</li>
<li>אחר כך תגרום לה לגדול: תסביר למה read-write lock <em>לא</em> עוזר ל-LRU קלאסי, ותבנה גרסה שבה thread-ים שנוגעים במפתחות שונים לא מתחרים זה בזה.</li>
<li>תדון בקירובים (CLOCK, ‏sampled LRU) ובמה מוותרים.</li>
</ol>`
  },
  examples: `cache = ShardedLRUCache(capacity=4, shards=2)
put(a), put(b), put(c), put(d)
get(a)          # a becomes most recent in ITS shard
put(e)          # e's shard is full -> evicts that shard's LRU
# Global LRU would always evict b here. Sharded LRU evicts the LRU
# of e's shard only: approximate, but 2 threads on different shards
# never block each other.`,
  hints: [
    { en: "Simplest correct answer: an ordinary LRU (hashmap + doubly linked list, or OrderedDict) with one mutex around every operation. Now count: what fraction of operations are writes to shared state?", he: "התשובה הנכונה הכי פשוטה: LRU רגיל (hashmap ועוד doubly linked list, או OrderedDict) עם mutex אחד סביב כל פעולה. עכשיו תספור: איזה חלק מהפעולות הן כתיבות ל-state משותף?" },
    { en: "All of them. A get() moves the node to the head of the list: a hit is a write. So a read lock on get() is a data race, and a RW lock degrades to an exclusive lock.", he: "כולן. ‏get() מזיז את ה-node לראש הרשימה: hit הוא כתיבה. לכן read lock על get() הוא data race, ו-RW lock מתדרדר ל-lock בלעדי." },
    { en: "Split the cache into N independent shards by hash(key) % N, each with its own lock and its own LRU list (lock striping). Or make a hit cheaper than list surgery: just set a \"referenced\" bit (CLOCK).", he: "תחלק את ה-cache ל-N shards עצמאיים לפי hash(key) % N, לכל אחד lock משלו ורשימת LRU משלו (lock striping). או תהפוך hit לזול יותר מניתוח של רשימה: רק מדליקים bit של \"referenced\" (CLOCK)." }
  ],
  solution: String.raw`import threading
from collections import OrderedDict
from typing import Any, Hashable, List, Optional


class _Shard:
    """One independent LRU: its own lock, its own recency list."""
    __slots__ = ("capacity", "data", "lock")

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.data: "OrderedDict[Hashable, Any]" = OrderedDict()   # first = LRU, last = MRU
        self.lock = threading.Lock()


class ShardedLRUCache:
    """Lock striping: threads on different shards never contend.
    Eviction is LRU per shard, i.e. approximate global LRU."""

    def __init__(self, capacity: int, shards: int = 16):
        per_shard = max(1, -(-capacity // shards))       # ceil division
        self.shards: List[_Shard] = [_Shard(per_shard) for _ in range(shards)]

    def _shard(self, key: Hashable) -> _Shard:
        return self.shards[hash(key) % len(self.shards)]

    def get(self, key: Hashable) -> Optional[Any]:
        s = self._shard(key)
        with s.lock:                     # NOT a read lock: a hit mutates the list
            if key not in s.data:
                return None
            s.data.move_to_end(key)      # recency update = a write
            return s.data[key]

    def put(self, key: Hashable, value: Any) -> None:
        s = self._shard(key)
        with s.lock:
            if key in s.data:
                s.data.move_to_end(key)
            s.data[key] = value
            if len(s.data) > s.capacity:
                s.data.popitem(last=False)   # evict this shard's LRU


class ClockCache:
    """CLOCK / second chance: a hit only sets a bit, no list surgery.
    Python still needs the lock; in Java/Go/C++ the hit path becomes
    ConcurrentHashMap lookup + a relaxed atomic store of ref = true."""

    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("capacity must be > 0")
        self.capacity = capacity
        self.keys: List[Any] = [None] * capacity
        self.vals: List[Any] = [None] * capacity
        self.ref = [False] * capacity        # the "recently used" bit
        self.index = {}                      # key -> slot
        self.hand = 0
        self.lock = threading.Lock()

    def get(self, key: Hashable) -> Optional[Any]:
        with self.lock:
            slot = self.index.get(key)
            if slot is None:
                return None
            self.ref[slot] = True            # O(1), touches one flag, no pointers
            return self.vals[slot]

    def put(self, key: Hashable, value: Any) -> None:
        with self.lock:
            slot = self.index.get(key)
            if slot is not None:
                self.vals[slot] = value
                self.ref[slot] = True
                return
            if len(self.index) < self.capacity:
                slot = len(self.index)       # still filling empty slots
            else:
                # Sweep: referenced entries get a second chance (bit cleared);
                # the first unreferenced one is the victim. At most 1 full lap.
                while self.ref[self.hand]:
                    self.ref[self.hand] = False
                    self.hand = (self.hand + 1) % self.capacity
                slot = self.hand
                del self.index[self.keys[slot]]
                self.hand = (self.hand + 1) % self.capacity
            self.keys[slot], self.vals[slot], self.ref[slot] = key, value, False
            self.index[key] = slot
`,
  explain: {
    en: `<p><strong>Step 1: one global lock.</strong> A normal LRU (see <a href="#/interview/code/lru-cache">LRU Cache</a>) with a mutex around <code>get</code> and <code>put</code> is correct, and each critical section is O(1). For a few threads it's fine. At 1M ops/s on 64 threads every operation serializes on one cache line, and the lock becomes the bottleneck.</p>
<p><strong>Why a read-write lock doesn't help.</strong> RW locks pay off when reads don't mutate. In an LRU, <code>get</code> moves the node to the head of the list: a hit is a write. Run <code>get</code> under a read lock and two readers splice the same linked list at the same time, corrupting it (lost nodes, cycles, a cache that grows past capacity). Java's <code>LinkedHashMap(accessOrder=true)</code> makes this exact trap explicit: its <code>get()</code> is a structural modification. With every operation needing the write lock, a RW lock is just a slower mutex.</p>
<p><strong>Step 2: lock striping (sharding).</strong> Split the cache into N independent LRUs by <code>hash(key) % N</code>, each with its own lock. Two threads contend only when their keys hash to the same shard, so with 16-64 shards contention drops roughly by N. Cost: eviction is LRU <em>per shard</em>, so a slightly-less-recent key in a cold shard may survive while a more-recent key in a hot shard is evicted. With a good hash and many keys the hit-rate difference is usually negligible. This is how Guava's cache (segments, like the old Java 7 <code>ConcurrentHashMap</code>) and Memcached (per-slab-class LRUs with their own locks) work.</p>
<p><strong>Step 3: make a hit cheaper than list surgery.</strong></p>
<ul>
<li><strong>CLOCK</strong> (second chance): entries sit in a circular array with a "referenced" bit. A hit just sets the bit (in Java/Go/C++, a relaxed atomic store: no lock on the hot path). Eviction sweeps a hand: a set bit is cleared (second chance), the first clear bit is the victim. PostgreSQL's buffer pool (clock sweep with a small usage counter) and the Linux page cache (active/inactive lists) use variants of this.</li>
<li><strong>Sampled LRU</strong> (Redis): no list at all. Each key stores a 24-bit last-access clock. On eviction, sample <code>maxmemory-samples</code> random keys (default 5) and evict the oldest, keeping a small pool of good candidates between rounds. Zero pointers per key, O(samples) per eviction.</li>
<li><strong>Buffered recency</strong> (Caffeine, Java): reads are recorded into striped, lossy ring buffers and replayed onto the LRU list in batches under a tryLock. Hits never wait on the eviction lock; if a buffer is full, a recency update is simply dropped.</li>
</ul>
<p>The insight to say out loud: <strong>exact LRU is a global total order updated on every read; that is fundamentally a serialization point.</strong> Every scalable cache trades a bit of eviction accuracy for parallel reads. Also keep the expensive part out of the lock: on a miss, load from the DB <em>outside</em> the lock and deduplicate concurrent misses for the same key (single-flight).</p>`,
    he: `<p><strong>שלב 1: lock גלובלי אחד.</strong> LRU רגיל (ראה <a href="#/interview/code/lru-cache">LRU Cache</a>) עם mutex סביב <code>get</code> ו-<code>put</code> הוא נכון, וכל critical section הוא O(1). לכמה thread-ים זה בסדר. במיליון פעולות לשנייה על 64 thread-ים, כל פעולה עוברת דרך cache line אחד, וה-lock הופך לצוואר הבקבוק.</p>
<p><strong>למה read-write lock לא עוזר.</strong> RW locks משתלמים כשקריאות לא משנות כלום. ב-LRU, ‏<code>get</code> מזיז את ה-node לראש הרשימה: hit הוא כתיבה. אם מריצים <code>get</code> תחת read lock, שני קוראים משנים את אותה linked list באותו זמן ומשחיתים אותה: nodes הולכים לאיבוד, נוצרים מעגלים, וה-cache גדל מעבר ל-capacity. ‏<code>LinkedHashMap(accessOrder=true)</code> של Java מבהיר בדיוק את המלכודת הזאת: ה-<code>get()</code> שלו הוא שינוי מבני. כשכל פעולה צריכה את ה-write lock, ‏RW lock הוא סתם mutex איטי יותר.</p>
<p><strong>שלב 2: lock striping (חלוקה ל-shards).</strong> מחלקים את ה-cache ל-N LRUs עצמאיים לפי <code>hash(key) % N</code>, לכל אחד lock משלו. שני thread-ים מתחרים רק כשהמפתחות שלהם נופלים לאותו shard, אז עם 16 עד 64 shards ה-contention יורד בערך פי N. המחיר: ה-eviction הוא LRU <em>לכל shard</em>. מפתח קצת פחות טרי ב-shard קר יכול לשרוד, בזמן שמפתח טרי יותר ב-shard חם מפונה. עם hash טוב והרבה מפתחות, ההבדל ב-hit rate בדרך כלל זניח. ככה עובדים ה-cache של Guava (segments, כמו ה-<code>ConcurrentHashMap</code> הישן של Java 7) ו-Memcached (LRU לכל slab class, עם lock משלו).</p>
<p><strong>שלב 3: לגרום ל-hit לעלות פחות מניתוח של רשימה.</strong></p>
<ul>
<li><strong>CLOCK</strong> (second chance): הרשומות יושבות במערך מעגלי עם bit של \"referenced\". ‏hit רק מדליק את ה-bit (ב-Java, ב-Go או ב-C++, זו כתיבה אטומית relaxed: בלי lock במסלול החם). ה-eviction מזיז \"מחוג\": bit דלוק מכובה (הזדמנות שנייה), וה-bit הכבוי הראשון הוא הקורבן. ה-buffer pool של PostgreSQL (clock sweep עם מונה שימוש קטן) וה-page cache של לינוקס (רשימות active/inactive) משתמשים בגרסאות של זה.</li>
<li><strong>Sampled LRU</strong> (Redis): אין רשימה בכלל. כל מפתח שומר שעון גישה אחרונה של 24 bits. ב-eviction דוגמים <code>maxmemory-samples</code> מפתחות אקראיים (ברירת מחדל 5) ומפנים את הישן ביותר, עם pool קטן של מועמדים טובים בין סבבים. אפס pointers למפתח, ‏O(samples) לכל פינוי.</li>
<li><strong>Buffered recency</strong> (Caffeine ב-Java): קריאות נרשמות ל-ring buffers מחולקים שמותר להם לאבד רשומות, ומשוחזרות על רשימת ה-LRU ב-batches תחת tryLock. ‏Hits אף פעם לא מחכים ל-lock של ה-eviction; אם buffer מלא, עדכון recency פשוט נזרק.</li>
</ul>
<p>התובנה שכדאי להגיד בקול: <strong>LRU מדויק הוא סדר מלא וגלובלי שמתעדכן בכל קריאה, ולכן הוא בהגדרה נקודת סריאליזציה.</strong> כל cache שגדל טוב מוותר על קצת דיוק ב-eviction בשביל קריאות במקביל. ועוד דבר: את החלק היקר מוציאים מה-lock. ב-miss טוענים מה-DB <em>מחוץ</em> ל-lock, ומאחדים misses מקבילים לאותו מפתח (single-flight).</p>`
  },
  complexity: "Time O(1) per op for sharded LRU; CLOCK get O(1), put O(1) amortized (one lap worst case); Space O(capacity)",
  whyInfra: {
    en: "Cache servers live and die by this trade-off. Redis avoids locks entirely by being single-threaded for commands and uses sampled LRU to avoid per-key pointers. Memcached is multithreaded with segmented LRUs per slab class and, to cut lock traffic, bumps an item to the head at most once every 60 seconds. Kernel and database buffer pools (Linux page cache, PostgreSQL <code>shared_buffers</code>) use CLOCK variants because a hit must cost almost nothing. Inside services, Caffeine, Guava and Go's <code>ristretto</code> (sampled TinyLFU with lossy buffers) exist because a <code>synchronized</code> LinkedHashMap falls over at high QPS, showing up as high p99 latency with low CPU and threads <code>BLOCKED</code> on one monitor.",
    he: "שרתי cache חיים ומתים לפי ה-trade-off הזה. Redis נמנע מ-locks לגמרי כי הוא single-threaded בהרצת פקודות, ומשתמש ב-sampled LRU כדי לחסוך pointers לכל מפתח. Memcached הוא multithreaded עם LRUs מחולקים לכל slab class, וכדי להוריד את התנועה על ה-locks הוא מקדם item לראש הרשימה לכל היותר פעם ב-60 שניות. Buffer pools של kernel ושל בסיסי נתונים (ה-page cache של לינוקס, ‏<code>shared_buffers</code> של PostgreSQL) משתמשים בגרסאות של CLOCK, כי hit חייב לעלות כמעט כלום. בתוך שירותים, Caffeine, ‏Guava ו-<code>ristretto</code> של Go (sampled TinyLFU עם buffers שמותר להם לאבד) קיימים כי LinkedHashMap עם <code>synchronized</code> קורס ב-QPS גבוה. זה נראה כמו p99 latency גבוה עם CPU נמוך ו-thread-ים במצב <code>BLOCKED</code> על monitor אחד."
  },
  followUps: [
    { q: { en: "1,000 threads miss on the same hot key at once. What happens and how do you fix it?", he: "1,000 thread-ים מקבלים miss על אותו מפתח חם בבת אחת. מה קורה ואיך מתקנים?" },
      a: { en: "A cache stampede: all 1,000 hit the database for the same row. Use single-flight: the first miss stores a placeholder future for the key (inside the shard lock), releases the lock, and loads; the other 999 find the future and wait on it. Go has <code>golang.org/x/sync/singleflight</code>, Caffeine's <code>get(key, loader)</code> does it built-in. For keys with a TTL, add early probabilistic refresh so they don't all expire at the same moment.", he: "Cache stampede: כל ה-1,000 פונים ל-DB בשביל אותה שורה. הפתרון הוא single-flight: ה-miss הראשון שומר future זמני בשביל המפתח (בתוך ה-lock של ה-shard), משחרר את ה-lock וטוען. שאר ה-999 מוצאים את ה-future ומחכים עליו. ב-Go יש <code>golang.org/x/sync/singleflight</code>, ו-<code>get(key, loader)</code> של Caffeine עושה את זה מובנה. למפתחות עם TTL מוסיפים רענון מוקדם הסתברותי, כדי שלא כולם יפוגו באותו רגע." } },
    { q: { en: "One key is so hot that its shard's lock is the bottleneck. Now what?", he: "מפתח אחד כל כך חם שה-lock של ה-shard שלו הוא צוואר הבקבוק. מה עכשיו?" },
      a: { en: "Sharding can't split a single key. Make the hit path lock-free: store entries in a concurrent hash map, read the value with a plain atomic load, and record recency approximately (a ref bit or a lossy buffer, as in CLOCK/Caffeine), so the lock is taken only on insert and eviction. If even that isn't enough, replicate the hot key per thread or per core (a small L1 cache in front of the shared one) and accept slightly stale values.", he: "Sharding לא יכול לפצל מפתח בודד. הופכים את מסלול ה-hit ל-lock-free: שומרים רשומות ב-concurrent hash map, קוראים את הערך עם atomic load רגיל, ורושמים recency בקירוב (bit של ref או buffer שמותר לו לאבד, כמו ב-CLOCK או ב-Caffeine). כך ה-lock נלקח רק בהכנסה וב-eviction. אם גם זה לא מספיק, משכפלים את המפתח החם לכל thread או לכל core (L1 cache קטן לפני ה-cache המשותף) ומקבלים ערכים קצת ישנים." } },
    { q: { en: "Isn't LRU itself the wrong policy for a cache hit by a nightly batch scan?", he: "האם LRU הוא בכלל לא המדיניות הלא נכונה ל-cache שסריקת batch לילית עוברת עליו?" },
      a: { en: "Yes: a scan touches every key once and flushes the whole working set (scan pollution). Use a policy that needs a second hit before an item counts as hot: Segmented LRU / 2Q (new items enter a probation segment), the Linux active/inactive lists, Memcached's segmented LRU, or W-TinyLFU in Caffeine, which admits a new item only if its estimated frequency beats the victim's.", he: "כן. סריקה נוגעת בכל מפתח פעם אחת ומעיפה את כל ה-working set (scan pollution). משתמשים במדיניות שדורשת hit שני לפני שפריט נחשב חם: Segmented LRU או 2Q (פריטים חדשים נכנסים ל-segment של ניסיון), רשימות active/inactive של לינוקס, ה-segmented LRU של Memcached, או W-TinyLFU ב-Caffeine, שמכניס פריט חדש רק אם התדירות המשוערת שלו גבוהה מזו של הקורבן." } }
  ]
});
