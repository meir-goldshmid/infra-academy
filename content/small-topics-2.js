window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. epoll / io_uring: how servers handle 10K+ connections
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "linux-epoll-iouring",
  track: "linux",
  order: 52,
  icon: "🧵",
  level: 3,
  minutes: 18,
  title: { en: "How Servers Handle 10K+ Connections: epoll, kqueue & io_uring", he: "איך שרתים מחזיקים 10K+ connections: ‏epoll, ‏kqueue ו-io_uring" },
  tldr: {
    en: "Don't park a thread on every socket: make sockets non-blocking and ask the kernel which ones are ready (epoll: cost grows with ready sockets, not total sockets) — or, with io_uring, hand the kernel a queue of operations and collect completions with almost no syscalls.",
    he: "לא מחנים thread על כל socket: הופכים את ה-sockets ללא חוסמים ושואלים את ה-kernel מי מוכן (ב-epoll העלות גדלה עם ה-sockets המוכנים, לא עם כולם) — או, עם io_uring, מגישים ל-kernel תור של פעולות ואוספים תוצאות כמעט בלי syscalls."
  },
  analogy: {
    en: "A hotel front desk with 10,000 rooms. Thread-per-connection hires a butler per room who stands at the door all night in case the guest calls — 10,000 salaries, mostly for standing. select/poll is one clerk walking every corridor knocking on all 10,000 doors each round. epoll is a switchboard: rooms that need something light up, and the clerk handles only the lit ones. io_uring goes further: you drop request slips in an outbox tray, and finished jobs appear in an inbox tray — you don't even call the switchboard.",
    he: "דלפק קבלה במלון עם 10,000 חדרים. thread לכל connection זה לשכור משרת לכל חדר שעומד ליד הדלת כל הלילה למקרה שהאורח יקרא — 10,000 משכורות, רובן על עמידה. ‏select/poll זה פקיד אחד שעובר בכל המסדרונות ודופק על כל 10,000 הדלתות בכל סיבוב. ‏epoll זה מרכזייה: חדרים שצריכים משהו נדלקים, והפקיד מטפל רק בדולקים. ‏io_uring הולך רחוק יותר: אתה זורק פתקי בקשה למגש יוצא, ועבודות שהסתיימו מופיעות במגש נכנס — אפילו לא צריך להתקשר למרכזייה."
  },
  sections: [
    {
      h: { en: "Blocking I/O and the real cost of thread-per-connection", he: "IO חוסם והמחיר האמיתי של thread לכל connection" },
      body: {
        en: `<p>The simplest server: <code>accept()</code>, spawn a thread, and in that thread call <code>read()</code>, which <strong>blocks</strong> until bytes arrive. It's easy to write and debug (the stack trace is the request's story). At 10,000 mostly-idle connections (WebSockets, long polling, MQTT, keep-alive HTTP) it falls apart:</p>
<table>
<tr><th>Cost</th><th>Per thread</th><th>× 10,000 threads</th></tr>
<tr><td>Stack (virtual reservation)</td><td>8 MiB default on Linux/glibc (<code>ulimit -s</code> = 8192); Java <code>-Xss</code> default 1 MiB</td><td>80 GiB virtual (Java: ~10 GiB); real RSS is what's touched — often 16-64 KiB each, still 0.2-0.6 GiB</td></tr>
<tr><td>Kernel structures</td><td>task_struct + kernel stack (16 KiB on x86-64)</td><td>~200 MiB of unswappable kernel memory</td></tr>
<tr><td>Context switch</td><td>~1-5 µs direct, plus cold caches/TLB afterwards</td><td>at 100k wakeups/s: 10-50% of a core just switching</td></tr>
<tr><td>Scheduler &amp; limits</td><td>each thread is a task (<code>kernel.threads-max</code>, <code>pids.max</code> in cgroups)</td><td>a container with <code>pids.max=4096</code> just can't</td></tr>
</table>
<p>Dan Kegel framed this in 1999 as the <strong>C10K problem</strong>: hardware could hold 10k connections, but the programming model couldn't. The fix has two parts:</p>
<ol>
<li><strong>Non-blocking sockets</strong> — <code>fcntl(fd, F_SETFL, O_NONBLOCK)</code> (or <code>SOCK_NONBLOCK</code> at <code>socket()</code>/<code>accept4()</code>). Now <code>read()</code> returns <code>-1</code> with <code>errno = EAGAIN</code> instead of sleeping.</li>
<li><strong>A readiness API</strong> — one call that sleeps until <em>any</em> of my sockets is ready, and tells me which.</li>
</ol>
<blockquote>💡 Real world: Thread-per-connection isn't dead — it's fine for a database with 200 pooled connections, and Java 21 virtual threads / Go goroutines give you the blocking-style code back while the runtime multiplexes onto epoll underneath. The lesson is about what the runtime does under the hood.</blockquote>`,
        he: `<p>השרת הכי פשוט: <code>accept()</code>, פותחים thread, ובתוכו קוראים ל-<code>read()</code>, ש<strong>חוסם</strong> עד שמגיעים bytes. קל לכתוב ולדבג (ה-stack trace הוא הסיפור של הבקשה). ב-10,000 connections שרובם idle ‏(WebSockets, ‏long polling, ‏MQTT, ‏HTTP עם keep-alive) זה מתפרק:</p>
<table>
<tr><th>עלות</th><th>לכל thread</th><th>× 10,000 threads</th></tr>
<tr><td>Stack (הקצאה וירטואלית)</td><td>8 MiB כברירת מחדל ב-Linux/glibc ‏(<code>ulimit -s</code> = 8192); ב-Java ‏<code>-Xss</code> הוא 1 MiB</td><td>80 GiB וירטואלי (Java: ‏~10 GiB); ה-RSS האמיתי הוא מה שנגעו בו — לרוב 16-64 KiB לכל אחד, עדיין 0.2-0.6 GiB</td></tr>
<tr><td>מבני kernel</td><td>task_struct + kernel stack ‏(16 KiB ב-x86-64)</td><td>~200 MiB של זיכרון kernel שלא עובר ל-swap</td></tr>
<tr><td>Context switch</td><td>~1-5 µs ישיר, ועוד caches/TLB קרים אחר כך</td><td>ב-100k התעוררויות בשנייה: 10-50% מליבה רק על החלפות</td></tr>
<tr><td>Scheduler ומגבלות</td><td>כל thread הוא task ‏(<code>kernel.threads-max</code>, ‏<code>pids.max</code> ב-cgroups)</td><td>container עם <code>pids.max=4096</code> פשוט לא יכול</td></tr>
</table>
<p>Dan Kegel ניסח את זה ב-1999 בתור <strong>בעיית C10K</strong>: החומרה יכלה להחזיק 10k connections, אבל מודל התכנות לא. הפתרון בנוי משני חלקים:</p>
<ol>
<li><strong>Sockets לא חוסמים</strong> — <code>fcntl(fd, F_SETFL, O_NONBLOCK)</code> (או <code>SOCK_NONBLOCK</code> ב-<code>socket()</code>/<code>accept4()</code>). עכשיו <code>read()</code> מחזיר <code>-1</code> עם <code>errno = EAGAIN</code> במקום לישון.</li>
<li><strong>API של מוכנוּת</strong> — קריאה אחת שישנה עד ש<em>מישהו</em> מה-sockets שלי מוכן, ואומרת לי מי.</li>
</ol>
<blockquote>💡 מהשטח: thread לכל connection לא מת — הוא מצוין ל-DB עם 200 connections ב-pool, ו-virtual threads של Java 21 או goroutines של Go מחזירים לך קוד בסגנון חוסם בזמן שה-runtime מבצע multiplexing מעל epoll מתחת. השיעור הזה הוא על מה שה-runtime עושה מתחת למכסה.</blockquote>`
      }
    },
    {
      h: { en: "select & poll vs epoll: O(n) vs O(ready)", he: "select ו-poll מול epoll: ‏O(n) מול O(ready)" },
      body: {
        en: `<p><strong>select()</strong> (1983) takes bitmaps of fds; capped at <code>FD_SETSIZE</code> = 1024 and the kernel scans all of them every call. <strong>poll()</strong> removes the 1024 cap but you still pass the <em>whole</em> array on every call and the kernel still walks it. With 10,000 connections and 50 active, you pay for 10,000 on every loop iteration — O(n).</p>
<p><strong>epoll</strong> (Linux 2.5.44, 2002) splits the work: the <em>interest list</em> lives in the kernel (a red-black tree), and the kernel appends sockets to a <em>ready list</em> from the network stack's wakeup callback. <code>epoll_wait</code> just copies out the ready list — O(ready).</p>
<pre>#include &lt;sys/epoll.h&gt;

int ep = epoll_create1(EPOLL_CLOEXEC);                 // an fd representing the interest list

struct epoll_event ev = { .events = EPOLLIN | EPOLLET, .data.fd = conn_fd };
epoll_ctl(ep, EPOLL_CTL_ADD, conn_fd, &amp;ev);           // register once, not every loop

struct epoll_event ready[1024];
for (;;) {
    int n = epoll_wait(ep, ready, 1024, 1000);         // sleeps; returns only ready fds
    for (int i = 0; i &lt; n; i++) {
        int fd = ready[i].data.fd;
        // edge-triggered: drain until EAGAIN, or you'll never be told about this data again
        for (;;) {
            ssize_t r = read(fd, buf, sizeof buf);
            if (r &gt; 0) { handle(fd, buf, r); continue; }
            if (r == -1 &amp;&amp; errno == EAGAIN) break;    // drained
            close(fd); break;                          // 0 = peer closed, or real error
        }
    }
}</pre>
<table>
<tr><th></th><th>Level-triggered (default)</th><th>Edge-triggered (<code>EPOLLET</code>)</th></tr>
<tr><td>Reports</td><td>"fd is readable" on every <code>epoll_wait</code> while data remains</td><td>only on the transition empty → non-empty</td></tr>
<tr><td>Bug if careless</td><td>busy-loop on a socket you don't read (e.g. writable fd always ready)</td><td>stall forever if you didn't drain to <code>EAGAIN</code></td></tr>
<tr><td>Used by</td><td>libuv, Python asyncio, most code</td><td>nginx, Go netpoller, Netty native transport</td></tr>
</table>
<p><strong>Thundering herd</strong>: 16 worker processes all <code>epoll_wait</code> on the same listening socket; one connection arrives and all 16 wake, 15 find nothing. Fixes: <code>EPOLLEXCLUSIVE</code> (Linux 4.5, 2016) wakes at least one but not all; <code>EPOLLONESHOT</code> disarms the fd after one event (re-arm with <code>EPOLL_CTL_MOD</code>) so two threads don't handle the same socket; or <code>SO_REUSEPORT</code> (below) to give each worker its own listening socket.</p>
<p><strong>Other OSes</strong>: <strong>kqueue</strong> (FreeBSD 4.1 in 2000, macOS) is readiness-based like epoll but more general (files, signals, timers, process exit in one API). Windows <strong>IOCP</strong> is <em>completion-based</em>: you start an overlapped <code>WSARecv</code> with a buffer and get notified when it's <em>done</em> — the model io_uring brought to Linux.</p>`,
        he: `<p><strong>select()</strong> ‏(1983) מקבל bitmaps של fds; מוגבל ל-<code>FD_SETSIZE</code> = 1024 וה-kernel סורק את כולם בכל קריאה. <strong>poll()</strong> מוריד את מגבלת ה-1024, אבל עדיין מעבירים את <em>כל</em> המערך בכל קריאה וה-kernel עדיין עובר עליו. עם 10,000 connections ו-50 פעילים, משלמים על 10,000 בכל סיבוב — O(n).</p>
<p><strong>epoll</strong> ‏(Linux 2.5.44, 2002) מפצל את העבודה: <em>רשימת העניין</em> יושבת ב-kernel (עץ red-black), וה-kernel מוסיף sockets ל<em>רשימת המוכנים</em> מתוך ה-callback של ה-network stack. ‏<code>epoll_wait</code> רק מעתיק החוצה את רשימת המוכנים — O(ready).</p>
<pre>#include &lt;sys/epoll.h&gt;

int ep = epoll_create1(EPOLL_CLOEXEC);                 // an fd representing the interest list

struct epoll_event ev = { .events = EPOLLIN | EPOLLET, .data.fd = conn_fd };
epoll_ctl(ep, EPOLL_CTL_ADD, conn_fd, &amp;ev);           // register once, not every loop

struct epoll_event ready[1024];
for (;;) {
    int n = epoll_wait(ep, ready, 1024, 1000);         // sleeps; returns only ready fds
    for (int i = 0; i &lt; n; i++) {
        int fd = ready[i].data.fd;
        // edge-triggered: drain until EAGAIN, or you'll never be told about this data again
        for (;;) {
            ssize_t r = read(fd, buf, sizeof buf);
            if (r &gt; 0) { handle(fd, buf, r); continue; }
            if (r == -1 &amp;&amp; errno == EAGAIN) break;    // drained
            close(fd); break;                          // 0 = peer closed, or real error
        }
    }
}</pre>
<table>
<tr><th></th><th>Level-triggered (ברירת מחדל)</th><th>Edge-triggered ‏(<code>EPOLLET</code>)</th></tr>
<tr><td>מדווח</td><td>"ה-fd קריא" בכל <code>epoll_wait</code> כל עוד נשאר מידע</td><td>רק במעבר מריק ללא ריק</td></tr>
<tr><td>הבאג אם לא נזהרים</td><td>busy-loop על socket שלא קוראים ממנו (למשל fd שתמיד writable)</td><td>תקיעה לנצח אם לא רוקנת עד <code>EAGAIN</code></td></tr>
<tr><td>מי משתמש</td><td>libuv, ‏asyncio של Python, רוב הקוד</td><td>nginx, ה-netpoller של Go, ה-native transport של Netty</td></tr>
</table>
<p><strong>Thundering herd</strong>: ‏16 worker processes עושים <code>epoll_wait</code> על אותו listening socket; מגיע connection אחד וכל ה-16 מתעוררים, 15 מוצאים כלום. פתרונות: <code>EPOLLEXCLUSIVE</code> ‏(Linux 4.5, 2016) מעיר לפחות אחד אבל לא את כולם; <code>EPOLLONESHOT</code> מנטרל את ה-fd אחרי event אחד (מחמשים מחדש עם <code>EPOLL_CTL_MOD</code>) כדי ששני threads לא יטפלו באותו socket; או <code>SO_REUSEPORT</code> (בהמשך) כדי לתת לכל worker listening socket משלו.</p>
<p><strong>מערכות הפעלה אחרות</strong>: <strong>kqueue</strong> ‏(FreeBSD 4.1 ב-2000, ‏macOS) מבוסס מוכנוּת כמו epoll אבל כללי יותר (קבצים, signals, timers, יציאת process ב-API אחד). ‏<strong>IOCP</strong> של Windows הוא <em>מבוסס השלמה</em>: מתחילים <code>WSARecv</code> מסוג overlapped עם buffer ומקבלים הודעה כשהפעולה <em>הסתיימה</em> — המודל ש-io_uring הביא ל-Linux.</p>`
      }
    },
    {
      h: { en: "Who sits on epoll: nginx, Node, Go, Netty, asyncio — and a 30-line server", he: "מי יושב על epoll: ‏nginx, ‏Node, ‏Go, ‏Netty, ‏asyncio — ושרת ב-30 שורות" },
      body: {
        en: `<table>
<tr><th>Runtime</th><th>How it uses the kernel</th></tr>
<tr><td><strong>nginx</strong></td><td>One event loop per worker process (<code>worker_processes auto</code> = one per core), edge-triggered epoll; <code>worker_connections 1024</code> default per worker.</td></tr>
<tr><td><strong>Node.js / libuv</strong></td><td>Level-triggered epoll for network I/O on the main thread; regular file I/O, <code>dns.lookup</code>, crypto and zlib go to a 4-thread pool because epoll doesn't work on regular files (they're always "ready").</td></tr>
<tr><td><strong>Go</strong></td><td>The <em>netpoller</em>: a goroutine calling <code>conn.Read()</code> that would block gets parked, its fd is registered with epoll (edge-triggered), and the scheduler runs other goroutines; when epoll reports ready, the goroutine is made runnable. Blocking-style code, event-loop economics.</td></tr>
<tr><td><strong>Netty (Java)</strong></td><td><code>NioEventLoopGroup</code> uses JDK NIO's <code>Selector</code> (epoll on Linux); <code>EpollEventLoopGroup</code> is the native edge-triggered transport with extras like <code>SO_REUSEPORT</code>.</td></tr>
<tr><td><strong>Python asyncio</strong></td><td><code>selectors.DefaultSelector</code> → <code>EpollSelector</code> on Linux, <code>KqueueSelector</code> on macOS; uvloop swaps in libuv.</td></tr>
</table>
<p>The whole pattern in Python's <code>selectors</code> module (a real epoll server, ~10k connections on one core is easy):</p>
<pre>import selectors, socket

sel = selectors.DefaultSelector()             # EpollSelector on Linux

def accept(srv):
    conn, addr = srv.accept()                 # selector said ready, so this won't block
    conn.setblocking(False)
    sel.register(conn, selectors.EVENT_READ, echo)

def echo(conn):
    try:
        data = conn.recv(4096)
    except ConnectionResetError:
        data = b""
    if data:
        conn.send(data)                       # simplification: a real server buffers the
                                              # unsent tail and waits for EVENT_WRITE
    else:
        sel.unregister(conn)
        conn.close()

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("0.0.0.0", 9000))
srv.listen(4096)                              # capped by net.core.somaxconn
srv.setblocking(False)
sel.register(srv, selectors.EVENT_READ, accept)
print(type(sel).__name__, "listening on :9000")

while True:
    for key, mask in sel.select(timeout=1):   # epoll_wait() under the hood
        key.data(key.fileobj)                 # call accept() or echo()</pre>
<pre>$ python3 echo.py
EpollSelector listening on :9000
$ strace -f -e trace=epoll_create1,epoll_ctl,epoll_wait python3 echo.py
epoll_create1(EPOLL_CLOEXEC)            = 4
epoll_ctl(4, EPOLL_CTL_ADD, 3, {events=EPOLLIN, data={u32=3, u64=...}}) = 0
epoll_wait(4, [], 2, 1000)              = 0          &lt;- 1 s timeout, nothing ready
epoll_wait(4, [{events=EPOLLIN, data={u32=3, ...}}], 2, 1000) = 1   &lt;- new connection</pre>
<blockquote>⚠️ Production tip: Every event loop has the same Achilles heel — one slow callback (a 200 ms JSON parse, a sync DNS lookup, a <code>time.sleep</code>) stalls <em>all</em> connections on that loop. See the event-loop lesson; measure loop lag, not just CPU.</blockquote>`,
        he: `<table>
<tr><th>Runtime</th><th>איך הוא משתמש ב-kernel</th></tr>
<tr><td><strong>nginx</strong></td><td>event loop אחד לכל worker process ‏(<code>worker_processes auto</code> = אחד לכל ליבה), ‏epoll במצב edge-triggered; ברירת מחדל <code>worker_connections 1024</code> לכל worker.</td></tr>
<tr><td><strong>Node.js / libuv</strong></td><td>epoll במצב level-triggered ל-IO רשתי על ה-thread הראשי; IO של קבצים רגילים, <code>dns.lookup</code>, קריפטו ו-zlib הולכים ל-pool של 4 threads, כי epoll לא עובד על קבצים רגילים (הם תמיד "מוכנים").</td></tr>
<tr><td><strong>Go</strong></td><td>ה-<em>netpoller</em>: goroutine שקורא ל-<code>conn.Read()</code> ועומד להיחסם מוחנה בצד, ה-fd שלו נרשם ב-epoll ‏(edge-triggered), וה-scheduler מריץ goroutines אחרים; כש-epoll מדווח שהוא מוכן, ה-goroutine חוזר לתור הריצה. קוד בסגנון חוסם, כלכלה של event loop.</td></tr>
<tr><td><strong>Netty (Java)</strong></td><td><code>NioEventLoopGroup</code> משתמש ב-<code>Selector</code> של JDK NIO ‏(epoll ב-Linux); ‏<code>EpollEventLoopGroup</code> הוא ה-transport הנייטיבי במצב edge-triggered עם תוספות כמו <code>SO_REUSEPORT</code>.</td></tr>
<tr><td><strong>Python asyncio</strong></td><td><code>selectors.DefaultSelector</code> → ‏<code>EpollSelector</code> ב-Linux, ‏<code>KqueueSelector</code> ב-macOS; ‏uvloop מחליף ל-libuv.</td></tr>
</table>
<p>כל התבנית עם המודול <code>selectors</code> של Python (שרת epoll אמיתי, ‏~10k connections על ליבה אחת זה קל):</p>
<pre>import selectors, socket

sel = selectors.DefaultSelector()             # EpollSelector on Linux

def accept(srv):
    conn, addr = srv.accept()                 # selector said ready, so this won't block
    conn.setblocking(False)
    sel.register(conn, selectors.EVENT_READ, echo)

def echo(conn):
    try:
        data = conn.recv(4096)
    except ConnectionResetError:
        data = b""
    if data:
        conn.send(data)                       # simplification: a real server buffers the
                                              # unsent tail and waits for EVENT_WRITE
    else:
        sel.unregister(conn)
        conn.close()

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("0.0.0.0", 9000))
srv.listen(4096)                              # capped by net.core.somaxconn
srv.setblocking(False)
sel.register(srv, selectors.EVENT_READ, accept)
print(type(sel).__name__, "listening on :9000")

while True:
    for key, mask in sel.select(timeout=1):   # epoll_wait() under the hood
        key.data(key.fileobj)                 # call accept() or echo()</pre>
<pre>$ python3 echo.py
EpollSelector listening on :9000
$ strace -f -e trace=epoll_create1,epoll_ctl,epoll_wait python3 echo.py
epoll_create1(EPOLL_CLOEXEC)            = 4
epoll_ctl(4, EPOLL_CTL_ADD, 3, {events=EPOLLIN, data={u32=3, u64=...}}) = 0
epoll_wait(4, [], 2, 1000)              = 0          &lt;- 1 s timeout, nothing ready
epoll_wait(4, [{events=EPOLLIN, data={u32=3, ...}}], 2, 1000) = 1   &lt;- new connection</pre>
<blockquote>⚠️ טיפ לפרודקשן: לכל event loop יש את אותה נקודת תורפה — callback איטי אחד (parse של JSON ב-200 ms, ‏DNS lookup סינכרוני, ‏<code>time.sleep</code>) תוקע את <em>כל</em> ה-connections על אותו loop. ראה את השיעור על event loop; תמדוד loop lag, לא רק CPU.</blockquote>`
      }
    },
    {
      h: { en: "io_uring: completion rings, fewer syscalls — and a security caveat", he: "io_uring: ‏rings של השלמה, פחות syscalls — והסתייגות אבטחתית" },
      body: {
        en: `<p>epoll tells you a socket is <em>ready</em>; you still pay one syscall per <code>read</code>/<code>write</code>/<code>accept</code>. At 1M ops/s that's 1M+ kernel crossings, made pricier by Spectre/Meltdown mitigations. And epoll does nothing for regular files — buffered file reads always "succeed" by blocking on disk. Linux AIO (<code>io_submit</code>) only worked well with <code>O_DIRECT</code>.</p>
<p><strong>io_uring</strong> (Linux 5.1, 2019, by Jens Axboe) is completion-based, like IOCP. Two ring buffers are <code>mmap</code>'d and shared between your process and the kernel:</p>
<pre>  user space                                 kernel
  ----------                                 ------
  write SQE {op=READ, fd, buf, len, off} --&gt; [ Submission Queue ring ] --&gt; executes
                                                                           (async workers
  read  CQE {user_data, res=bytes|-errno} &lt;-- [ Completion Queue ring ] &lt;--  for files)

  one io_uring_enter() submits N SQEs; with SQPOLL a kernel thread polls the SQ -&gt; ~0 syscalls</pre>
<pre>#include &lt;liburing.h&gt;

struct io_uring ring;
io_uring_queue_init(256, &amp;ring, 0);              // 256-entry SQ, CQ sized 2x

struct io_uring_sqe *sqe = io_uring_get_sqe(&amp;ring);
io_uring_prep_read(sqe, file_fd, buf, 4096, offset);   // works on regular files, truly async
io_uring_sqe_set_data(sqe, req);
io_uring_submit(&amp;ring);                          // batch many SQEs into one syscall

struct io_uring_cqe *cqe;
io_uring_wait_cqe(&amp;ring, &amp;cqe);                  // cqe-&gt;res = bytes read, or -errno
io_uring_cqe_seen(&amp;ring, cqe);</pre>
<p>Extras that matter for servers: registered buffers and fds (skip per-op lookups), multishot accept/recv (one SQE, many CQEs), linked ops, zero-copy send. Users: Seastar/ScyllaDB, TigerBeetle, PostgreSQL 18 (optional <code>io_method = io_uring</code> for async reads), Netty's io_uring transport, Rust's tokio-uring/glommio.</p>
<p><strong>The security caveat (state it precisely):</strong> io_uring gives a large new kernel attack surface that bypasses syscall filtering of the individual operations. In 2023 Google reported that ~60% of the exploits submitted to its kernel bug bounty (kCTF VRP) in 2022 targeted io_uring, and said it had disabled io_uring on ChromeOS and on its production servers and restricts it for Android apps via seccomp. Docker's default seccomp profile blocks the <code>io_uring_setup</code>/<code>io_uring_enter</code>/<code>io_uring_register</code> syscalls in current releases, and Linux 6.6 added the <code>kernel.io_uring_disabled</code> sysctl (0 = allowed, 1 = only privileged or members of <code>kernel.io_uring_group</code>, 2 = disabled). libuv added io_uring for file ops (1.45), and Node.js later made it opt-in (<code>UV_USE_IO_URING=1</code>) after a security issue.</p>
<blockquote>⚠️ Production tip: Don't assume io_uring is available in your container or managed platform — check <code>sysctl kernel.io_uring_disabled</code> and the seccomp profile, and make sure your software falls back to epoll. For most web services epoll is not the bottleneck; io_uring pays off for storage engines and very high op-rate proxies.</blockquote>`,
        he: `<p>epoll אומר לך ש-socket <em>מוכן</em>; עדיין משלמים syscall אחד על כל <code>read</code>/<code>write</code>/<code>accept</code>. ב-1M פעולות בשנייה זה 1M+ מעברים ל-kernel, שהתייקרו עם ה-mitigations של Spectre/Meltdown. ו-epoll לא עוזר בכלל לקבצים רגילים — קריאה buffered מקובץ תמיד "מצליחה" על ידי חסימה על הדיסק. ‏Linux AIO ‏(<code>io_submit</code>) עבד טוב רק עם <code>O_DIRECT</code>.</p>
<p><strong>io_uring</strong> ‏(Linux 5.1, 2019, של Jens Axboe) מבוסס השלמה, כמו IOCP. שני ring buffers ממופים עם <code>mmap</code> ומשותפים בין ה-process שלך ל-kernel:</p>
<pre>  user space                                 kernel
  ----------                                 ------
  write SQE {op=READ, fd, buf, len, off} --&gt; [ Submission Queue ring ] --&gt; executes
                                                                           (async workers
  read  CQE {user_data, res=bytes|-errno} &lt;-- [ Completion Queue ring ] &lt;--  for files)

  one io_uring_enter() submits N SQEs; with SQPOLL a kernel thread polls the SQ -&gt; ~0 syscalls</pre>
<pre>#include &lt;liburing.h&gt;

struct io_uring ring;
io_uring_queue_init(256, &amp;ring, 0);              // 256-entry SQ, CQ sized 2x

struct io_uring_sqe *sqe = io_uring_get_sqe(&amp;ring);
io_uring_prep_read(sqe, file_fd, buf, 4096, offset);   // works on regular files, truly async
io_uring_sqe_set_data(sqe, req);
io_uring_submit(&amp;ring);                          // batch many SQEs into one syscall

struct io_uring_cqe *cqe;
io_uring_wait_cqe(&amp;ring, &amp;cqe);                  // cqe-&gt;res = bytes read, or -errno
io_uring_cqe_seen(&amp;ring, cqe);</pre>
<p>תוספות שחשובות לשרתים: buffers ו-fds רשומים מראש (חוסכים lookup בכל פעולה), ‏accept/recv מסוג multishot ‏(SQE אחד, הרבה CQEs), פעולות משורשרות, ‏send ב-zero-copy. מי משתמש: Seastar/ScyllaDB, ‏TigerBeetle, ‏PostgreSQL 18 (אופציונלי, <code>io_method = io_uring</code> לקריאות אסינכרוניות), ה-transport של Netty ל-io_uring, ‏tokio-uring/glommio ב-Rust.</p>
<p><strong>ההסתייגות האבטחתית (בדיוק):</strong> io_uring פותח משטח תקיפה חדש וגדול ב-kernel שעוקף סינון syscalls של הפעולות הבודדות. ב-2023 Google דיווחה שכ-60% מה-exploits שהוגשו ל-bug bounty של ה-kernel שלה (kCTF VRP) ב-2022 תקפו את io_uring, ואמרה שהיא כיבתה את io_uring ב-ChromeOS ובשרתי הפרודקשן שלה ומגבילה אותו לאפליקציות Android דרך seccomp. ה-seccomp profile הדיפולטי של Docker חוסם בגרסאות הנוכחיות את ה-syscalls ‏<code>io_uring_setup</code>/<code>io_uring_enter</code>/<code>io_uring_register</code>, ו-Linux 6.6 הוסיף את ה-sysctl ‏<code>kernel.io_uring_disabled</code> ‏(0 = מותר, 1 = רק privileged או חברי <code>kernel.io_uring_group</code>, ‏2 = כבוי). libuv הוסיף io_uring לפעולות קבצים (1.45), ו-Node.js הפך את זה אחר כך ל-opt-in ‏(<code>UV_USE_IO_URING=1</code>) אחרי בעיית אבטחה.</p>
<blockquote>⚠️ טיפ לפרודקשן: אל תניח ש-io_uring זמין ב-container או בפלטפורמה המנוהלת שלך — תבדוק <code>sysctl kernel.io_uring_disabled</code> ואת ה-seccomp profile, ותוודא שהתוכנה נופלת חזרה ל-epoll. לרוב שירותי ה-web ה-epoll הוא לא צוואר הבקבוק; io_uring משתלם ל-storage engines ול-proxies עם קצב פעולות גבוה מאוד.</blockquote>`
      }
    },
    {
      h: { en: "SO_REUSEPORT, limits and measuring", he: "SO_REUSEPORT, מגבלות ומדידה" },
      body: {
        en: `<p><strong>SO_REUSEPORT</strong> (Linux 3.9, 2013): N processes/threads each bind their <em>own</em> socket to the same port, and the kernel hashes each new connection's 4-tuple to one of them. No shared accept queue, no herd, accept scales across cores. nginx: <code>listen 443 ssl reuseport;</code>. Caveat: if a worker dies or stalls, connections already hashed into its queue are stuck or reset — and rebalancing when the socket count changes reshuffles the hash.</p>
<p><strong>The limits you will hit first</strong> (not epoll itself):</p>
<table>
<tr><th>Limit</th><th>Default</th><th>Symptom</th><th>Fix</th></tr>
<tr><td><code>ulimit -n</code> (RLIMIT_NOFILE)</td><td>soft 1024 in many shells</td><td><code>EMFILE: Too many open files</code></td><td><code>LimitNOFILE=1048576</code> in the systemd unit; nginx <code>worker_rlimit_nofile</code></td></tr>
<tr><td><code>net.core.somaxconn</code></td><td>4096 since kernel 5.4 (was 128)</td><td>SYNs dropped under bursts, <code>ListenOverflows</code> in <code>nstat</code></td><td>raise it and the app's <code>listen()</code> backlog</td></tr>
<tr><td><code>net.ipv4.ip_local_port_range</code></td><td>32768-60999 (28,232 ports)</td><td><code>EADDRNOTAVAIL</code> on outbound connects per dest IP:port</td><td>keep-alive/pooling, more source IPs, widen the range</td></tr>
<tr><td>Memory per socket</td><td>~few KB idle; buffers up to <code>tcp_rmem</code>/<code>tcp_wmem</code> max</td><td>OOM at 1M connections</td><td>budget it; tune buffers, app-side per-conn state</td></tr>
</table>
<p><strong>Measuring:</strong></p>
<pre>$ ss -s
Total: 10642
TCP:   10512 (estab 10233, closed 141, orphaned 0, timewait 139)

Transport Total     IP        IPv6
RAW       0         0         0
UDP       8         6         2
TCP       10371     10360     11

$ sudo timeout 10 strace -c -f -p 2211
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 38.12    0.412311          12     33811           epoll_wait
 21.40    0.231474           6     35110           writev
 17.91    0.193727           5     35102      1290 recvfrom
  9.85    0.106533           7     14881           epoll_ctl
------ ----------- ----------- --------- --------- ----------------
100.00    1.081624                118904      1290 total
$ ss -lnt 'sport = :443'      # Recv-Q on a LISTEN socket = accept queue depth now
State   Recv-Q  Send-Q  Local Address:Port
LISTEN  0       4096    0.0.0.0:443</pre>
<p>The 1290 <code>recvfrom</code> errors are <code>EAGAIN</code> — normal for non-blocking I/O (you tried, nothing there). A high <code>epoll_ctl</code> count means the app re-registers fds every loop (a classic level-triggered inefficiency). Use <code>perf top</code> / <code>perf record -g</code> to see whether time goes to the kernel network stack, TLS, or your code; <code>strace</code> itself slows the process a lot — use it briefly.</p>
<blockquote>💡 Real world: WhatsApp famously ran ~2M connections per FreeBSD/Erlang box in 2012; modern Envoy/nginx/HAProxy boxes hold hundreds of thousands to millions of idle TLS connections. At that point the budget is memory (TLS session state, buffers) and CPU for handshakes — not the readiness API.</blockquote>`,
        he: `<p><strong>SO_REUSEPORT</strong> ‏(Linux 3.9, 2013): ‏N processes/threads קושרים כל אחד socket <em>משלו</em> לאותו port, וה-kernel עושה hash ל-4-tuple של כל connection חדש לאחד מהם. אין accept queue משותף, אין herd, ה-accept מתפזר על ליבות. ב-nginx: ‏<code>listen 443 ssl reuseport;</code>. הסתייגות: אם worker מת או נתקע, connections שכבר הגיעו לתור שלו תקועים או מקבלים reset — ושינוי במספר ה-sockets מערבב מחדש את ה-hash.</p>
<p><strong>המגבלות שתיתקל בהן קודם</strong> (לא epoll עצמו):</p>
<table>
<tr><th>מגבלה</th><th>ברירת מחדל</th><th>סימפטום</th><th>תיקון</th></tr>
<tr><td><code>ulimit -n</code> ‏(RLIMIT_NOFILE)</td><td>soft 1024 בהרבה shells</td><td><code>EMFILE: Too many open files</code></td><td><code>LimitNOFILE=1048576</code> ב-unit של systemd; ב-nginx ‏<code>worker_rlimit_nofile</code></td></tr>
<tr><td><code>net.core.somaxconn</code></td><td>4096 מאז kernel 5.4 (לפני זה 128)</td><td>SYNs נזרקים ב-bursts, ‏<code>ListenOverflows</code> ב-<code>nstat</code></td><td>להעלות אותו ואת ה-backlog של <code>listen()</code> באפליקציה</td></tr>
<tr><td><code>net.ipv4.ip_local_port_range</code></td><td>32768-60999 ‏(28,232 ports)</td><td><code>EADDRNOTAVAIL</code> בחיבורים יוצאים לכל IP:port יעד</td><td>keep-alive/pooling, עוד כתובות מקור, להרחיב את הטווח</td></tr>
<tr><td>זיכרון לכל socket</td><td>כמה KB ב-idle; ‏buffers עד ה-max של <code>tcp_rmem</code>/<code>tcp_wmem</code></td><td>OOM ב-1M connections</td><td>לתקצב; לכוונן buffers ואת ה-state לכל connection באפליקציה</td></tr>
</table>
<p><strong>מדידה:</strong></p>
<pre>$ ss -s
Total: 10642
TCP:   10512 (estab 10233, closed 141, orphaned 0, timewait 139)

Transport Total     IP        IPv6
RAW       0         0         0
UDP       8         6         2
TCP       10371     10360     11

$ sudo timeout 10 strace -c -f -p 2211
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 38.12    0.412311          12     33811           epoll_wait
 21.40    0.231474           6     35110           writev
 17.91    0.193727           5     35102      1290 recvfrom
  9.85    0.106533           7     14881           epoll_ctl
------ ----------- ----------- --------- --------- ----------------
100.00    1.081624                118904      1290 total
$ ss -lnt 'sport = :443'      # Recv-Q on a LISTEN socket = accept queue depth now
State   Recv-Q  Send-Q  Local Address:Port
LISTEN  0       4096    0.0.0.0:443</pre>
<p>1290 השגיאות של <code>recvfrom</code> הן <code>EAGAIN</code> — נורמלי ל-IO לא חוסם (ניסית, לא היה כלום). מספר גבוה של <code>epoll_ctl</code> אומר שהאפליקציה רושמת fds מחדש בכל סיבוב (חוסר יעילות קלאסי של level-triggered). תשתמש ב-<code>perf top</code> / <code>perf record -g</code> כדי לראות אם הזמן הולך ל-network stack של ה-kernel, ל-TLS או לקוד שלך; ‏<code>strace</code> עצמו מאט מאוד את ה-process — תשתמש בו לזמן קצר.</p>
<blockquote>💡 מהשטח: WhatsApp הריצו ב-2012 בערך 2M connections לכל מכונת FreeBSD/Erlang; מכונות Envoy/nginx/HAProxy מודרניות מחזיקות מאות אלפים עד מיליוני connections של TLS במצב idle. בנקודה הזו התקציב הוא זיכרון (state של TLS, ‏buffers) ו-CPU ל-handshakes — לא ה-API של המוכנוּת.</blockquote>`
      }
    }
  ],
  diagram: `thread-per-connection            event loop (epoll)                 io_uring
---------------------            ------------------                 --------
conn1 -> thread1 (blocked read)  conn1 \\                            app --SQEs--> [SQ ring] --> kernel
conn2 -> thread2 (blocked read)  conn2  >-- interest list (kernel)   app <--CQEs-- [CQ ring] <-- kernel
...                              ...   /       | wakeup callback
connN -> threadN                 connN         v
N stacks, N context switches            ready list --epoll_wait--> 1 thread/core runs callbacks`,
  handsOn: [
    { cmd: "python3 -c \"import selectors; print(selectors.DefaultSelector())\"", what: { en: "See which readiness API Python picks on your OS (EpollSelector on Linux, KqueueSelector on macOS).", he: "לראות איזה API של מוכנוּת Python בוחר אצלך (EpollSelector ב-Linux, ‏KqueueSelector ב-macOS)." } },
    { cmd: "sudo timeout 10 strace -c -f -p $(pgrep -o nginx)", what: { en: "Syscall histogram of a live server for 10 s: epoll_wait, recvfrom (with EAGAIN errors), writev.", he: "היסטוגרמה של syscalls של שרת חי במשך 10 שניות: ‏epoll_wait, ‏recvfrom (עם שגיאות EAGAIN), ‏writev." } },
    { cmd: "ss -s && ss -lnt && nstat -az TcpExtListenOverflows TcpExtListenDrops", what: { en: "Count connections by state, check accept queue depth (Recv-Q on LISTEN) and whether the backlog overflowed.", he: "לספור connections לפי מצב, לבדוק עומק accept queue ‏(Recv-Q על LISTEN) והאם ה-backlog גלש." } },
    { cmd: "ulimit -n; cat /proc/$(pgrep -o nginx)/limits | grep 'open files'; sysctl net.core.somaxconn kernel.io_uring_disabled", what: { en: "Check the fd limit of your shell vs the running process, the listen backlog cap and whether io_uring is allowed (sysctl exists on 6.6+).", he: "לבדוק את מגבלת ה-fds של ה-shell מול ה-process שרץ, את התקרה של ה-backlog והאם io_uring מותר (ה-sysctl קיים מ-6.6)." } },
    { cmd: "ls -l /proc/$(pgrep -o nginx)/fd | grep -c socket; ls -l /proc/$(pgrep -o nginx)/fd | grep eventpoll", what: { en: "Count a process's sockets and spot its epoll instance (anon_inode:[eventpoll]).", he: "לספור את ה-sockets של process ולזהות את ה-instance של epoll שלו (anon_inode:[eventpoll])." } }
  ],
  mnemonic: {
    en: "select/poll knock on every door; epoll lights up the ready rooms; io_uring uses an outbox and an inbox. Edge-triggered? Drain to EAGAIN.",
    he: "select/poll דופקים על כל דלת; epoll מדליק את החדרים המוכנים; io_uring עובד עם מגש יוצא ומגש נכנס. Edge-triggered? מרוקנים עד EAGAIN."
  },
  pitfalls: [
    { en: "Edge-triggered epoll without draining to EAGAIN: you read 4 KB of a 16 KB request, no new edge ever arrives, and the connection hangs forever.", he: "epoll במצב edge-triggered בלי לרוקן עד EAGAIN: קראת 4 KB מבקשה של 16 KB, אף edge חדש לא מגיע, וה-connection תקוע לנצח." },
    { en: "Registering EPOLLOUT permanently in level-triggered mode: an idle socket is almost always writable, so epoll_wait returns instantly and the loop burns 100% CPU. Enable EPOLLOUT only while you have unsent data.", he: "לרשום EPOLLOUT לתמיד במצב level-triggered: socket במצב idle כמעט תמיד writable, אז epoll_wait חוזר מיד וה-loop שורף 100% CPU. מפעילים EPOLLOUT רק כשיש מידע שלא נשלח." },
    { en: "Raising ulimit in your shell and assuming the service got it: systemd services ignore /etc/security/limits.conf — set LimitNOFILE in the unit and verify in /proc/PID/limits.", he: "להעלות ulimit ב-shell ולהניח שהשירות קיבל את זה: שירותי systemd מתעלמים מ-/etc/security/limits.conf — קובעים LimitNOFILE ב-unit ובודקים ב-/proc/PID/limits." },
    { en: "Shipping an io_uring-only build: in many containers and managed platforms the syscalls are blocked by seccomp or the sysctl, and the service fails at startup. Always keep an epoll fallback.", he: "לשחרר build שתלוי רק ב-io_uring: בהרבה containers ופלטפורמות מנוהלות ה-syscalls חסומים על ידי seccomp או ה-sysctl, והשירות נופל בעלייה. תמיד להשאיר fallback ל-epoll." }
  ],
  interview: [
    { q: { en: "Why is epoll faster than poll with 100,000 connections?", he: "למה epoll מהיר יותר מ-poll עם 100,000 connections?" },
      a: { en: "poll copies the full fd array into the kernel and scans all of it on every call — O(n) per iteration even if 10 sockets are active. epoll keeps the interest set in the kernel (registered once via epoll_ctl), the network stack pushes ready sockets onto a ready list via callbacks, and epoll_wait returns only those — O(ready). With mostly idle connections that's orders of magnitude less work.", he: "poll מעתיק את כל מערך ה-fds ל-kernel וסורק את כולו בכל קריאה — O(n) לכל סיבוב גם אם רק 10 sockets פעילים. ‏epoll שומר את קבוצת העניין ב-kernel (נרשמת פעם אחת עם epoll_ctl), ה-network stack דוחף sockets מוכנים לרשימת מוכנים דרך callbacks, ו-epoll_wait מחזיר רק אותם — O(ready). כשרוב ה-connections ב-idle זה סדרי גודל פחות עבודה." } },
    { q: { en: "How is io_uring fundamentally different from epoll?", he: "במה io_uring שונה מהותית מ-epoll?" },
      a: { en: "epoll is readiness-based: it tells you an fd can be read without blocking, and you then do the read syscall yourself. io_uring is completion-based: you submit the operation itself (read into this buffer) on a shared submission ring and later reap the result from a completion ring. That batches many ops per syscall (or none with SQPOLL) and makes regular file I/O genuinely async. Trade-off: larger kernel attack surface, so it's disabled or restricted in many hardened environments.", he: "epoll מבוסס מוכנוּת: הוא אומר לך שאפשר לקרוא מ-fd בלי להיחסם, ואז אתה עושה את ה-syscall של הקריאה בעצמך. ‏io_uring מבוסס השלמה: אתה מגיש את הפעולה עצמה (תקרא לתוך ה-buffer הזה) ל-ring משותף ואחר כך אוסף את התוצאה מ-ring של השלמות. זה מאגד הרבה פעולות ל-syscall אחד (או אפס עם SQPOLL) והופך IO של קבצים רגילים לאסינכרוני באמת. המחיר: משטח תקיפה גדול יותר ב-kernel, ולכן הוא כבוי או מוגבל בהרבה סביבות מוקשחות." } },
    { q: { en: "Your Node service hits 'EMFILE: too many open files' at ~1,000 connections. Walk me through it.", he: "שירות Node שלך מקבל 'EMFILE: too many open files' בסביבות 1,000 connections. תסביר מה קורה." },
      a: { en: "Each socket is an fd; the process inherited a soft RLIMIT_NOFILE of 1024. Check /proc/PID/limits, raise LimitNOFILE in the systemd unit (or the container runtime's ulimit), and check for fd leaks (ls /proc/PID/fd | wc -l growing while connections are flat). Then look at the next limits: somaxconn/backlog, ephemeral ports for outbound connections, memory per connection.", he: "כל socket הוא fd; ה-process ירש soft RLIMIT_NOFILE של 1024. בודקים /proc/PID/limits, מעלים LimitNOFILE ב-unit של systemd (או ה-ulimit של ה-container runtime), ובודקים דליפת fds ‏(ls /proc/PID/fd | wc -l עולה בזמן שה-connections יציבים). אחר כך מסתכלים על המגבלות הבאות: somaxconn/backlog, ‏ephemeral ports לחיבורים יוצאים, זיכרון לכל connection." } }
  ],
  quiz: [
    { q: { en: "A server holds 50,000 connections; 30 have data. What does epoll_wait's cost scale with?", he: "שרת מחזיק 50,000 connections; ל-30 יש מידע. עם מה העלות של epoll_wait גדלה?" },
      options: [
        { en: "50,000 — it scans every registered fd", he: "50,000 — הוא סורק כל fd רשום" },
        { en: "The ~30 ready fds", he: "ה-~30 fds המוכנים" },
        { en: "FD_SETSIZE (1024)", he: "FD_SETSIZE ‏(1024)" },
        { en: "The number of CPU cores", he: "מספר ליבות ה-CPU" }
      ], answer: 1,
      explain: { en: "The interest list lives in the kernel and the network stack appends to a ready list via callbacks; epoll_wait copies out only ready entries. Scanning everything is select/poll behaviour; FD_SETSIZE is a select limit.", he: "רשימת העניין יושבת ב-kernel וה-network stack מוסיף לרשימת המוכנים דרך callbacks; ‏epoll_wait מעתיק החוצה רק את המוכנים. לסרוק הכל זו התנהגות של select/poll; ‏FD_SETSIZE היא מגבלה של select." } },
    { q: { en: "With EPOLLET (edge-triggered), what must your read handler do?", he: "עם EPOLLET ‏(edge-triggered), מה ה-handler של הקריאה חייב לעשות?" },
      options: [
        { en: "Read exactly once per event", he: "לקרוא בדיוק פעם אחת לכל event" },
        { en: "Call epoll_ctl to re-add the fd after each read", he: "לקרוא ל-epoll_ctl ולהוסיף מחדש את ה-fd אחרי כל קריאה" },
        { en: "Keep reading until read() returns EAGAIN", he: "להמשיך לקרוא עד ש-read() מחזיר EAGAIN" },
        { en: "Switch the socket back to blocking mode", he: "להחזיר את ה-socket למצב חוסם" }
      ], answer: 2,
      explain: { en: "Edge-triggered reports only the empty→non-empty transition. Leftover data produces no new event, so you must drain to EAGAIN. Re-arming with EPOLL_CTL_MOD is for EPOLLONESHOT, and blocking sockets would freeze the loop.", he: "Edge-triggered מדווח רק על מעבר מריק ללא ריק. מידע שנשאר לא מייצר event חדש, ולכן חייבים לרוקן עד EAGAIN. חימוש מחדש עם EPOLL_CTL_MOD שייך ל-EPOLLONESHOT, ו-socket חוסם היה מקפיא את ה-loop." } },
    { q: { en: "Why can't epoll make regular file reads asynchronous, and what can?", he: "למה epoll לא יכול להפוך קריאות מקבצים רגילים לאסינכרוניות, ומה כן יכול?" },
      options: [
        { en: "Regular files are always reported 'ready', so reads still block on disk; io_uring (or a thread pool) can", he: "קבצים רגילים תמיד מדווחים כ'מוכנים', אז הקריאה עדיין נחסמת על הדיסק; io_uring (או thread pool) יכול" },
        { en: "epoll handles files fine; only sockets need io_uring", he: "epoll מטפל בקבצים מצוין; רק sockets צריכים io_uring" },
        { en: "Files need SO_REUSEPORT", he: "קבצים צריכים SO_REUSEPORT" },
        { en: "Only select() supports files", he: "רק select() תומך בקבצים" }
      ], answer: 0,
      explain: { en: "epoll_ctl on a regular file fails with EPERM, and poll/select always report files as ready. That's why libuv uses a thread pool for fs ops, and why io_uring's completion model matters for storage engines.", he: "epoll_ctl על קובץ רגיל נכשל עם EPERM, ו-poll/select תמיד מדווחים על קבצים כמוכנים. בגלל זה libuv משתמש ב-thread pool לפעולות fs, ובגלל זה מודל ההשלמה של io_uring חשוב ל-storage engines." } },
    { q: { en: "16 nginx workers share one listening socket and all wake for every new connection. Which is NOT a fix?", he: "16 workers של nginx חולקים listening socket אחד וכולם מתעוררים על כל connection חדש. מה מהבאים הוא לא פתרון?" },
      options: [
        { en: "EPOLLEXCLUSIVE", he: "EPOLLEXCLUSIVE" },
        { en: "SO_REUSEPORT (listen ... reuseport)", he: "SO_REUSEPORT ‏(listen ... reuseport)" },
        { en: "Raising net.core.somaxconn", he: "להעלות את net.core.somaxconn" },
        { en: "nginx's accept_mutex", he: "ה-accept_mutex של nginx" }
      ], answer: 2,
      explain: { en: "somaxconn only caps the accept queue length; it does nothing about how many waiters wake. EPOLLEXCLUSIVE limits wakeups, SO_REUSEPORT gives each worker its own socket, accept_mutex lets only one worker listen at a time.", he: "somaxconn רק מגביל את אורך ה-accept queue; הוא לא משנה כמה ממתינים מתעוררים. ‏EPOLLEXCLUSIVE מגביל התעוררויות, ‏SO_REUSEPORT נותן לכל worker socket משלו, ‏accept_mutex נותן רק ל-worker אחד להאזין בכל רגע." } }
  ],
  playground: "tcp",
  related: ["pr-event-loop", "pr-concurrency-parallelism", "processes-linux", "linux-kernel-tuning", "linux-perf-tracing", "net-tcp-deep"]
});

// ---------------------------------------------------------------------------
// 2. IoT fleets & OTA updates
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "iot-fleets-ota",
  track: "cloud",
  order: 95,
  icon: "📡",
  level: 3,
  minutes: 20,
  title: { en: "IoT Fleets & OTA Updates: Identity, MQTT, Shadows and Safe Firmware Rollouts", he: "צי IoT ועדכוני OTA: זהות, MQTT, ‏shadows ו-rollout בטוח של firmware" },
  tldr: {
    en: "A device fleet is a distributed system you can't SSH into, that's offline half the time and that you can permanently brick: give every device its own hardware-backed identity, talk MQTT through a broker, sync state via shadows/twins, and ship firmware only as signed A/B images rolled out by cohort with automatic rollback.",
    he: "צי מכשירים הוא מערכת מבוזרת שאי אפשר להיכנס אליה ב-SSH, שחצי מהזמן היא offline ושאפשר להפוך אותה ללבנה לתמיד: תן לכל מכשיר זהות משלו מגובה בחומרה, תדבר MQTT דרך broker, תסנכרן state דרך shadows/twins, ותשחרר firmware רק כ-images חתומים במבנה A/B, ב-rollout לפי cohorts עם rollback אוטומטי."
  },
  analogy: {
    en: "Running a fleet is like managing 500,000 lighthouses on remote islands. Each keeper has a sealed ID badge that can't be copied (per-device key in a secure element). They radio in through a central harbour office (broker) when the weather allows, and the office keeps a whiteboard per lighthouse of 'what we want' vs 'what they last reported' (shadow). To replace a lamp you never rip out the only one: you install the new lamp next to the old, switch over, and if it doesn't light by morning the keeper flips back (A/B rollback). And you never ship a new lamp model to all islands on the same day.",
    he: "להפעיל צי זה כמו לנהל 500,000 מגדלורים על איים מרוחקים. לכל שומר יש תג זיהוי חתום שאי אפשר להעתיק (מפתח לכל מכשיר ב-secure element). הם מתקשרים בקשר לנמל מרכזי (broker) כשמזג האוויר מאפשר, ובנמל יש לוח לכל מגדלור עם 'מה אנחנו רוצים' מול 'מה הם דיווחו לאחרונה' (shadow). כדי להחליף מנורה אף פעם לא עוקרים את היחידה: מתקינים את החדשה ליד הישנה, מעבירים, ואם היא לא דולקת עד הבוקר השומר מחזיר את המתג (A/B rollback). ואף פעם לא שולחים דגם מנורה חדש לכל האיים באותו יום."
  },
  sections: [
    {
      h: { en: "Device identity & provisioning", he: "זהות מכשיר ו-provisioning" },
      body: {
        en: `<p>Rule zero: <strong>every device has its own credential</strong>. A shared API key baked into firmware means one teardown leaks the whole fleet. The standard is an <strong>X.509 client certificate per device</strong> used for mutual TLS to the broker, with the private key generated inside and never leaving a <strong>secure element</strong> (e.g. Microchip ATECC608, NXP SE050) or a <strong>TPM 2.0</strong>. Extracting it requires physical attacks on the chip, not reading flash.</p>
<table>
<tr><th>Provisioning model</th><th>How</th><th>Trade-off</th></tr>
<tr><td><strong>At manufacturing</strong></td><td>On the factory line the chip generates a keypair; your CA (or the chip vendor's pre-provisioning service) signs a cert with CN = serial; cert registered in the cloud.</td><td>Strongest; needs a trusted factory step and CA integration.</td></tr>
<tr><td><strong>Fleet provisioning by claim</strong> (AWS IoT) / <strong>DPS</strong> (Azure)</td><td>Devices ship with a shared, low-privilege <em>claim</em> cert that can only call the provisioning API; on first boot they generate a key, send a CSR, get a unique cert, and the claim is never used again.</td><td>Simple factory; the claim cert is a target — scope it tightly and validate with a pre-provisioning hook (serial allowlist).</td></tr>
<tr><td><strong>Just-in-time</strong> (JITP/JITR)</td><td>Device certs signed by your CA; the cloud auto-registers a device on its first TLS connect because it trusts the CA.</td><td>No per-device API calls; revocation and CA hygiene become critical.</td></tr>
</table>
<p>Then authorize narrowly: device <code>thermo-00042</code> may publish only to <code>devices/thermo-00042/#</code>. AWS IoT policies support <code>&#36;{iot:Connection.Thing.ThingName}</code>-style variables for exactly this. Plan for <strong>cert rotation</strong> (devices live 10-15 years; certs and CAs don't) and <strong>revocation</strong> for stolen or returned units.</p>
<blockquote>💡 Real world: Google Cloud IoT Core was retired on 16 August 2023, forcing customers to migrate fleets to other brokers. If device identity is tied to a platform (endpoint hostnames, platform-signed certs), migration means touching every device. Use your own CA and a DNS name you control for the broker endpoint.</blockquote>`,
        he: `<p>חוק אפס: <strong>לכל מכשיר credential משלו</strong>. API key משותף צרוב ב-firmware אומר שפירוק של מכשיר אחד מדליף את כל הצי. הסטנדרט הוא <strong>תעודת X.509 לכל מכשיר</strong> שמשמשת ל-mutual TLS מול ה-broker, כשהמפתח הפרטי נוצר בתוך <strong>secure element</strong> (למשל Microchip ATECC608, ‏NXP SE050) או <strong>TPM 2.0</strong> ולעולם לא יוצא ממנו. כדי לחלץ אותו צריך תקיפה פיזית על השבב, לא קריאת flash.</p>
<table>
<tr><th>מודל provisioning</th><th>איך</th><th>Trade-off</th></tr>
<tr><td><strong>בייצור</strong></td><td>על פס הייצור השבב מייצר זוג מפתחות; ה-CA שלך (או שירות pre-provisioning של יצרן השבב) חותם תעודה עם CN = מספר סידורי; התעודה נרשמת בענן.</td><td>הכי חזק; דורש שלב אמין במפעל ואינטגרציה עם CA.</td></tr>
<tr><td><strong>Fleet provisioning by claim</strong> ‏(AWS IoT) / <strong>DPS</strong> ‏(Azure)</td><td>המכשירים יוצאים עם תעודת <em>claim</em> משותפת בהרשאה נמוכה שיכולה לקרוא רק ל-API של ה-provisioning; ב-boot הראשון הם מייצרים מפתח, שולחים CSR, מקבלים תעודה ייחודית, ו-claim לא משמש יותר.</td><td>מפעל פשוט; תעודת ה-claim היא מטרה — להגביל אותה היטב ולאמת עם pre-provisioning hook ‏(allowlist של מספרים סידוריים).</td></tr>
<tr><td><strong>Just-in-time</strong> ‏(JITP/JITR)</td><td>תעודות המכשירים חתומות על ידי ה-CA שלך; הענן רושם מכשיר אוטומטית ב-TLS connect הראשון כי הוא סומך על ה-CA.</td><td>בלי קריאות API לכל מכשיר; ‏revocation והיגיינת CA נהיות קריטיות.</td></tr>
</table>
<p>אחר כך נותנים הרשאות צרות: המכשיר <code>thermo-00042</code> רשאי לפרסם רק ל-<code>devices/thermo-00042/#</code>. ה-policies של AWS IoT תומכות במשתנים בסגנון <code>&#36;{iot:Connection.Thing.ThingName}</code> בדיוק בשביל זה. תתכנן <strong>רוטציית תעודות</strong> (מכשירים חיים 10-15 שנה; תעודות ו-CAs לא) ו-<strong>revocation</strong> ליחידות גנובות או שהוחזרו.</p>
<blockquote>💡 מהשטח: Google Cloud IoT Core נסגר ב-16 באוגוסט 2023, ולקוחות נאלצו להעביר ציים ל-brokers אחרים. אם זהות המכשיר קשורה לפלטפורמה (hostnames של endpoint, תעודות שהפלטפורמה חתמה), מעבר אומר לגעת בכל מכשיר. תשתמש ב-CA משלך ובשם DNS שבשליטתך ל-endpoint של ה-broker.</blockquote>`
      }
    },
    {
      h: { en: "Protocols & platforms: MQTT, CoAP, LwM2M, brokers, shadows", he: "פרוטוקולים ופלטפורמות: MQTT, ‏CoAP, ‏LwM2M, ‏brokers, ‏shadows" },
      body: {
        en: `<p><strong>MQTT</strong> (TCP 1883, TLS 8883, or over WebSockets) is the default: one long-lived connection, 2-byte minimum header, pub/sub through a broker. The fleet-relevant features:</p>
<ul>
<li><strong>QoS 0</strong> at most once (fire and forget), <strong>QoS 1</strong> at least once (PUBACK, retried — expect duplicates, make handlers idempotent), <strong>QoS 2</strong> exactly once (4-step PUBREC/PUBREL/PUBCOMP). QoS is per hop (device↔broker), not end-to-end. AWS IoT Core doesn't support QoS 2.</li>
<li><strong>Retained message</strong>: the broker keeps the last message per topic and hands it to new subscribers — "current config" or "last known state".</li>
<li><strong>Last Will</strong>: a message the broker publishes if the device disappears without a clean DISCONNECT (keep-alive timeout ≈ 1.5× the keep-alive interval) → presence detection.</li>
<li><strong>Persistent sessions</strong> (clean session = false): the broker queues QoS 1/2 messages for an offline device.</li>
<li><strong>MQTT 5</strong> (OASIS, 2019): session &amp; message expiry, reason codes, user properties, shared subscriptions (<code>$share/group/topic</code> for load-balanced backends), topic aliases (save bytes on long topics), request/response.</li>
</ul>
<pre>mosquitto_pub -h broker.example.com -p 8883 \
  --cafile ca.pem --cert thermo-00042.crt --key thermo-00042.key \
  -i thermo-00042 -t devices/thermo-00042/telemetry -q 1 \
  -m '{"ts":1763200000,"temp_c":21.4,"fw":"4.1.3","hw":"rev-B"}'</pre>
<p><strong>CoAP</strong> (RFC 7252, UDP 5683, DTLS 5684): REST-like GET/PUT/POST for battery devices that can't afford TCP+TLS, with confirmable messages and <em>observe</em> for subscriptions. <strong>LwM2M</strong> (OMA SpecWorks) is device <em>management</em> on top of CoAP: a standard object model (Object 3 = Device, Object 5 = Firmware Update), popular with cellular NB-IoT/LTE-M.</p>
<table>
<tr><th>Broker / platform</th><th>Notes</th></tr>
<tr><td><strong>AWS IoT Core</strong></td><td>Managed MQTT/HTTPS, rules engine to Kinesis/Lambda/Timestream, Device Shadow, Jobs (OTA), fleet provisioning, Device Defender.</td></tr>
<tr><td><strong>Azure IoT Hub</strong></td><td>Device twins, DPS, direct methods, cloud-to-device messages, IoT Edge.</td></tr>
<tr><td><strong>EMQX</strong></td><td>Clustered open-source/commercial broker built on Erlang; vendor benchmark of 100M connections on a 23-node cluster.</td></tr>
<tr><td><strong>Mosquitto</strong></td><td>Lightweight single-threaded C broker; great for gateways, labs and modest fleets, not millions of connections.</td></tr>
</table>
<p><strong>Device shadow / twin</strong>: a JSON document in the cloud per device with <code>desired</code> (what the backend wants) and <code>reported</code> (what the device last said). The platform computes a <code>delta</code> and delivers it when the device reconnects. Apps read and write the shadow, never the device directly, so a device that's offline for three days still converges.</p>
<pre>// $aws/things/thermo-00042/shadow/update/delta
{ "state": { "setpoint_c": 22, "fw_target": "4.2.0" }, "version": 117 }</pre>`,
        he: `<p><strong>MQTT</strong> ‏(TCP 1883, ‏TLS 8883, או מעל WebSockets) הוא ברירת המחדל: connection אחד ארוך, header מינימלי של 2 bytes, ‏pub/sub דרך broker. היכולות שחשובות לצי:</p>
<ul>
<li><strong>QoS 0</strong> לכל היותר פעם אחת (שגר ושכח), <strong>QoS 1</strong> לפחות פעם אחת (PUBACK, ‏retries — תצפה לכפילויות, תעשה handlers אידמפוטנטיים), <strong>QoS 2</strong> בדיוק פעם אחת (4 שלבים PUBREC/PUBREL/PUBCOMP). ‏QoS הוא לכל hop ‏(device↔broker), לא מקצה לקצה. ‏AWS IoT Core לא תומך ב-QoS 2.</li>
<li><strong>Retained message</strong>: ה-broker שומר את ההודעה האחרונה לכל topic ומוסר אותה ל-subscribers חדשים — "ה-config הנוכחי" או "ה-state האחרון הידוע".</li>
<li><strong>Last Will</strong>: הודעה שה-broker מפרסם אם המכשיר נעלם בלי DISCONNECT מסודר (timeout של keep-alive ≈ פי 1.5 מה-interval) ← זיהוי נוכחות.</li>
<li><strong>Persistent sessions</strong> ‏(clean session = false): ה-broker שומר בתור הודעות QoS 1/2 למכשיר שהוא offline.</li>
<li><strong>MQTT 5</strong> ‏(OASIS, 2019): תפוגה ל-session ולהודעות, ‏reason codes, ‏user properties, ‏shared subscriptions ‏(<code>$share/group/topic</code> ל-backends עם איזון עומסים), ‏topic aliases (חוסכים bytes על topics ארוכים), ‏request/response.</li>
</ul>
<pre>mosquitto_pub -h broker.example.com -p 8883 \
  --cafile ca.pem --cert thermo-00042.crt --key thermo-00042.key \
  -i thermo-00042 -t devices/thermo-00042/telemetry -q 1 \
  -m '{"ts":1763200000,"temp_c":21.4,"fw":"4.1.3","hw":"rev-B"}'</pre>
<p><strong>CoAP</strong> ‏(RFC 7252, ‏UDP 5683, ‏DTLS 5684): ‏GET/PUT/POST בסגנון REST למכשירים על סוללה שלא יכולים להרשות לעצמם TCP+TLS, עם הודעות confirmable ו-<em>observe</em> במקום subscriptions. ‏<strong>LwM2M</strong> ‏(OMA SpecWorks) הוא <em>ניהול</em> מכשירים מעל CoAP: מודל אובייקטים סטנדרטי (Object 3 = Device, ‏Object 5 = Firmware Update), פופולרי ב-NB-IoT/LTE-M סלולרי.</p>
<table>
<tr><th>Broker / פלטפורמה</th><th>הערות</th></tr>
<tr><td><strong>AWS IoT Core</strong></td><td>MQTT/HTTPS מנוהל, ‏rules engine ל-Kinesis/Lambda/Timestream, ‏Device Shadow, ‏Jobs ‏(OTA), ‏fleet provisioning, ‏Device Defender.</td></tr>
<tr><td><strong>Azure IoT Hub</strong></td><td>Device twins, ‏DPS, ‏direct methods, הודעות cloud-to-device, ‏IoT Edge.</td></tr>
<tr><td><strong>EMQX</strong></td><td>Broker מבוזר open-source/מסחרי על Erlang; ‏benchmark של היצרן עם 100M connections על cluster של 23 nodes.</td></tr>
<tr><td><strong>Mosquitto</strong></td><td>Broker קליל ב-C עם thread יחיד; מעולה ל-gateways, למעבדה ולציים צנועים, לא למיליוני connections.</td></tr>
</table>
<p><strong>Device shadow / twin</strong>: מסמך JSON בענן לכל מכשיר עם <code>desired</code> (מה ה-backend רוצה) ו-<code>reported</code> (מה המכשיר אמר לאחרונה). הפלטפורמה מחשבת <code>delta</code> ומוסרת אותו כשהמכשיר מתחבר מחדש. אפליקציות קוראות וכותבות ל-shadow, אף פעם לא ישירות למכשיר, ולכן מכשיר שהיה offline שלושה ימים עדיין מתכנס.</p>
<pre>// $aws/things/thermo-00042/shadow/update/delta
{ "state": { "setpoint_c": 22, "fw_target": "4.2.0" }, "version": 117 }</pre>`
      }
    },
    {
      h: { en: "Offline-first devices & telemetry at scale", he: "מכשירים offline-first ו-telemetry בסקייל" },
      body: {
        en: `<p>Assume the network is <em>usually</em> broken: cellular dead zones, Wi-Fi reboots, NB-IoT devices that wake for 2 seconds every hour. Design rules:</p>
<ul>
<li><strong>Store and forward</strong>: buffer telemetry in a bounded on-device ring (flash wear!) with device-side timestamps; upload in batches on reconnect. Backend must accept late, out-of-order data keyed by event time.</li>
<li><strong>Act locally</strong>: the thermostat keeps heating with the last setpoint when the cloud is gone. The cloud is for coordination, not the control loop.</li>
<li><strong>Reconnect with jittered exponential backoff</strong>. A broker restart or regional outage means the whole fleet reconnects at once — 1M TLS handshakes in seconds will melt the broker and any auth backend. Cap the backoff (e.g. 5 s → 10 min) and randomize it.</li>
<li><strong>Idempotent, versioned messages</strong>: QoS 1 duplicates and shadow <code>version</code> numbers to reject stale updates.</li>
</ul>
<p><strong>Back-of-envelope fan-in</strong>: 1M devices × 1 message / 10 s = <strong>100k msg/s</strong>; × 200 bytes ≈ 20 MB/s ≈ <strong>1.7 TB/day</strong> raw. Typical pipeline:</p>
<pre>devices --MQTT/TLS--&gt; broker cluster --rules / shared subs--&gt; Kafka / Kinesis
                                                                 |--&gt; stream processing (alerts, dedup, downsampling)
                                                                 |--&gt; time-series DB (Timestream, InfluxDB, TimescaleDB): hot 30 days
                                                                 '--&gt; object storage (Parquet): cold, years, analytics</pre>
<p>The broker should not be your database: hand off to a durable log quickly. Downsample (raw 10 s → 1 min → 1 h rollups) and set retention per tier, or storage cost grows linearly forever. Watch cardinality: <code>device_id</code> as a label in Prometheus with 1M devices will kill it — fleet telemetry belongs in a TSDB/columnar store, while Prometheus gets fleet <em>aggregates</em>.</p>
<p><strong>Edge compute</strong>: AWS IoT Greengrass v2 (components on a Linux gateway, local MQTT broker, Lambda/containers), Azure IoT Edge (modules as containers managed from IoT Hub), or <strong>K3s</strong> (single-binary lightweight Kubernetes) on beefier gateways — for local filtering, ML inference, and protocol translation (Modbus/BLE → MQTT) so you upload insights instead of raw sensor data.</p>
<blockquote>⚠️ Production tip: Monitor the fleet as populations, not individuals: % connected (by region / hw revision / firmware), reconnect rate, reboot and crash rate, boot success after update, firmware version distribution, last-seen age histogram. A 2% drop in "connected" across one hardware revision is a page; one offline device is not.</blockquote>`,
        he: `<p>תניח שהרשת <em>בדרך כלל</em> שבורה: אזורים מתים בסלולר, ‏Wi-Fi שעושה reboot, מכשירי NB-IoT שמתעוררים ל-2 שניות כל שעה. כללי תכנון:</p>
<ul>
<li><strong>Store and forward</strong>: שומרים telemetry ב-ring חסום על המכשיר (שחיקת flash!) עם timestamps מהמכשיר; מעלים ב-batches כשיש חיבור. ה-backend חייב לקבל מידע מאוחר ולא מסודר לפי event time.</li>
<li><strong>פועלים מקומית</strong>: התרמוסטט ממשיך לחמם לפי ה-setpoint האחרון כשהענן לא זמין. הענן נועד לתיאום, לא ל-control loop.</li>
<li><strong>Reconnect עם exponential backoff ו-jitter</strong>. ‏restart של broker או תקלה אזורית אומרים שכל הצי מתחבר מחדש בבת אחת — 1M handshakes של TLS בכמה שניות ימיסו את ה-broker וכל backend של auth. תגביל את ה-backoff (למשל 5 שניות ← 10 דקות) ותוסיף אקראיות.</li>
<li><strong>הודעות אידמפוטנטיות עם גרסה</strong>: כפילויות של QoS 1 ומספרי <code>version</code> ב-shadow כדי לדחות עדכונים ישנים.</li>
</ul>
<p><strong>חישוב גס של fan-in</strong>: ‏1M מכשירים × הודעה כל 10 שניות = <strong>100k הודעות בשנייה</strong>; × 200 bytes ≈ 20 MB/s ≈ <strong>1.7 TB ליום</strong> גולמי. pipeline טיפוסי:</p>
<pre>devices --MQTT/TLS--&gt; broker cluster --rules / shared subs--&gt; Kafka / Kinesis
                                                                 |--&gt; stream processing (alerts, dedup, downsampling)
                                                                 |--&gt; time-series DB (Timestream, InfluxDB, TimescaleDB): hot 30 days
                                                                 '--&gt; object storage (Parquet): cold, years, analytics</pre>
<p>ה-broker לא אמור להיות ה-DB שלך: מעבירים מהר ל-log עמיד. עושים downsampling ‏(raw של 10 שניות ← דקה ← rollups של שעה) וקובעים retention לכל שכבה, אחרת עלות האחסון גדלה ליניארית לנצח. תיזהר מ-cardinality: ‏<code>device_id</code> כ-label ב-Prometheus עם 1M מכשירים יהרוג אותו — telemetry של הצי שייך ל-TSDB או ל-columnar store, ו-Prometheus מקבל <em>אגרגציות</em> של הצי.</p>
<p><strong>Edge compute</strong>: ‏AWS IoT Greengrass v2 ‏(components על gateway של Linux, ‏MQTT broker מקומי, ‏Lambda/containers), ‏Azure IoT Edge ‏(modules כ-containers שמנוהלים מ-IoT Hub), או <strong>K3s</strong> ‏(Kubernetes קליל בבינארי אחד) על gateways חזקים יותר — לסינון מקומי, ‏ML inference ותרגום פרוטוקולים (Modbus/BLE ← MQTT), כדי להעלות תובנות במקום מידע גולמי מחיישנים.</p>
<blockquote>⚠️ טיפ לפרודקשן: תנטר את הצי כאוכלוסיות, לא כפרטים: % מחוברים (לפי אזור / hw revision / firmware), קצב reconnect, קצב reboot ו-crash, הצלחת boot אחרי עדכון, התפלגות גרסאות firmware, היסטוגרמה של גיל last-seen. ירידה של 2% ב"מחוברים" ב-hardware revision אחד זה page; מכשיר אחד offline זה לא.</blockquote>`
      }
    },
    {
      h: { en: "OTA updates without bricking: A/B, signing, staged cohorts", he: "עדכוני OTA בלי לבנים: ‏A/B, חתימות, cohorts מדורגים" },
      body: {
        en: `<p>An OTA update is a deploy to hardware you can't reach, over a network that drops mid-download, on power that may cut mid-write. A failed server deploy costs minutes; a <strong>bricked</strong> device costs a truck roll or an RMA — for 100,000 units, a recall.</p>
<p><strong>A/B (dual-bank) updates</strong>: two root filesystem slots. The device runs from A, writes the new image to B in the background (interruptions are harmless — A is untouched), verifies it, and tells the bootloader "try B once". The bootloader increments a boot counter; userspace must confirm health (network up, app running, can reach the broker) and mark the slot good. If B panics, hangs (hardware watchdog resets it) or never confirms, the counter exceeds the limit and the bootloader falls back to A.</p>
<pre># U-Boot environment used by Mender/RAUC/SWUpdate-style A/B
bootcount=1          # incremented by U-Boot on every boot attempt
bootlimit=3          # after 3 failed attempts...
upgrade_available=1  # set by the updater when a new slot is pending
altbootcmd=run swap_slot_and_boot   # ...boot the previous slot instead

# after the health check passes, userspace commits:
$ mender commit                 # Mender
$ rauc status mark-good         # RAUC (resets bootcount, clears upgrade_available)</pre>
<table>
<tr><th>Technique</th><th>What it buys</th><th>Cost</th></tr>
<tr><td>A/B slots</td><td>Atomic switch, automatic rollback</td><td>2× rootfs flash</td></tr>
<tr><td>Single slot + recovery partition</td><td>Less flash</td><td>Device is down during update; recovery path must be perfect</td></tr>
<tr><td>Delta updates (binary diff, casync/RAUC adaptive, Mender delta)</td><td>Often 5-20× smaller downloads — matters on cellular data plans</td><td>Requires an exact known base version; more CPU on device</td></tr>
<tr><td>Container/app-level updates (Greengrass components, IoT Edge modules)</td><td>Fast, small, frequent</td><td>Doesn't update kernel/bootloader</td></tr>
</table>
<p><strong>Signing &amp; secure boot</strong>: images are signed offline (key in an HSM, not the CI runner) and the device verifies the signature <em>before</em> installing. Secure boot extends the chain at every boot: ROM verifies the bootloader (key hash fused in eFuses), the bootloader verifies the signed kernel/FIT image, and dm-verity verifies the rootfs blocks. Add <strong>anti-rollback</strong> (a monotonic version counter in eFuse/RPMB) so an attacker can't install an old signed image with a known vulnerability. Uptane (automotive) and TUF formalize repository metadata and key roles.</p>
<p><strong>Staged rollouts by cohort</strong>: internal dogfood → 1% → 5% → 25% → 100%, with each cohort <em>stratified</em> across hardware revision, region, carrier and current firmware version so every combination is represented early. Gate each stage on fleet metrics (boot-success rate, rollback count, crash rate, reconnect within N minutes) and auto-halt on thresholds. AWS IoT Jobs supports rollout rates and abort configs (e.g. abort if &gt;5% of the first 1,000 devices fail). Never update the bootloader itself casually — it's the one component A/B doesn't protect.</p>
<p>Tools: <strong>Mender</strong> (client + server, A/B rootfs, Yocto/Debian integration), <strong>SWUpdate</strong> (flexible updater, Lua handlers, signed .swu), <strong>RAUC</strong> (A/B "slots", signed bundles, used with Yocto), plus cloud-side orchestration (AWS IoT Jobs, Azure Device Update for IoT Hub).</p>`,
        he: `<p>עדכון OTA הוא deploy לחומרה שאי אפשר להגיע אליה, דרך רשת שנופלת באמצע ההורדה, על חשמל שאולי ייפסק באמצע כתיבה. deploy כושל לשרת עולה דקות; מכשיר <strong>שהפך ללבנה</strong> עולה ביקור טכנאי או RMA — ב-100,000 יחידות, ריקול.</p>
<p><strong>עדכוני A/B ‏(dual-bank)</strong>: שני slots של root filesystem. המכשיר רץ מ-A, כותב את ה-image החדש ל-B ברקע (הפרעות לא מזיקות — A לא נגעו בו), מאמת אותו, ואומר ל-bootloader "תנסה את B פעם אחת". ה-bootloader מעלה boot counter; ה-userspace חייב לאשר בריאות (רשת למעלה, האפליקציה רצה, יש גישה ל-broker) ולסמן את ה-slot כטוב. אם B עושה panic, נתקע (ה-hardware watchdog מאפס אותו) או אף פעם לא מאשר, ה-counter עובר את הגבול וה-bootloader חוזר ל-A.</p>
<pre># U-Boot environment used by Mender/RAUC/SWUpdate-style A/B
bootcount=1          # incremented by U-Boot on every boot attempt
bootlimit=3          # after 3 failed attempts...
upgrade_available=1  # set by the updater when a new slot is pending
altbootcmd=run swap_slot_and_boot   # ...boot the previous slot instead

# after the health check passes, userspace commits:
$ mender commit                 # Mender
$ rauc status mark-good         # RAUC (resets bootcount, clears upgrade_available)</pre>
<table>
<tr><th>טכניקה</th><th>מה היא נותנת</th><th>מחיר</th></tr>
<tr><td>A/B slots</td><td>מעבר אטומי, ‏rollback אוטומטי</td><td>פי 2 flash ל-rootfs</td></tr>
<tr><td>Slot יחיד + מחיצת recovery</td><td>פחות flash</td><td>המכשיר למטה בזמן העדכון; מסלול ה-recovery חייב להיות מושלם</td></tr>
<tr><td>Delta updates ‏(binary diff, ‏casync/RAUC adaptive, ‏Mender delta)</td><td>הורדות קטנות לרוב פי 5-20 — חשוב בחבילות גלישה סלולריות</td><td>דורש גרסת בסיס ידועה ומדויקת; יותר CPU על המכשיר</td></tr>
<tr><td>עדכונים ברמת container/app ‏(Greengrass components, ‏IoT Edge modules)</td><td>מהיר, קטן, תכוף</td><td>לא מעדכן kernel/bootloader</td></tr>
</table>
<p><strong>חתימות ו-secure boot</strong>: ה-images נחתמים offline (המפתח ב-HSM, לא ב-runner של ה-CI) והמכשיר מאמת את החתימה <em>לפני</em> ההתקנה. ‏Secure boot מאריך את השרשרת בכל boot: ה-ROM מאמת את ה-bootloader ‏(hash של המפתח צרוב ב-eFuses), ה-bootloader מאמת kernel/FIT image חתום, ו-dm-verity מאמת את הבלוקים של ה-rootfs. תוסיף <strong>anti-rollback</strong> ‏(counter גרסה מונוטוני ב-eFuse/RPMB) כדי שתוקף לא יוכל להתקין image חתום ישן עם חולשה ידועה. ‏Uptane (רכב) ו-TUF מגדירים פורמלית metadata של repository ותפקידי מפתחות.</p>
<p><strong>Rollout מדורג לפי cohorts</strong>: ‏dogfood פנימי ← 1% ← 5% ← 25% ← 100%, כשכל cohort <em>מרובד</em> לפי hardware revision, אזור, ספק סלולר וגרסת firmware נוכחית, כך שכל שילוב מיוצג מוקדם. כל שלב מותנה במדדי צי (אחוז הצלחת boot, מספר rollbacks, קצב crash, ‏reconnect תוך N דקות) ונעצר אוטומטית בחציית סף. ‏AWS IoT Jobs תומך בקצב rollout ובהגדרות abort (למשל לעצור אם יותר מ-5% מ-1,000 המכשירים הראשונים נכשלים). אף פעם לא מעדכנים את ה-bootloader עצמו בקלות ראש — זה הרכיב היחיד ש-A/B לא מגן עליו.</p>
<p>כלים: <strong>Mender</strong> ‏(client + server, ‏A/B ל-rootfs, אינטגרציה עם Yocto/Debian), ‏<strong>SWUpdate</strong> ‏(updater גמיש, ‏handlers ב-Lua, קבצי .swu חתומים), ‏<strong>RAUC</strong> ‏("slots" של A/B, ‏bundles חתומים, עובד עם Yocto), ובצד הענן orchestration ‏(AWS IoT Jobs, ‏Azure Device Update for IoT Hub).</p>`
      }
    },
    {
      h: { en: "Security & regulation: Mirai, default creds, the EU Cyber Resilience Act", he: "אבטחה ורגולציה: ‏Mirai, סיסמאות דיפולטיות, ה-Cyber Resilience Act של האיחוד האירופי" },
      body: {
        en: `<p><strong>Mirai (2016)</strong> scanned the internet for Telnet on cameras and DVRs and logged in with a list of ~60 factory-default username/password pairs. The resulting botnet hit Krebs on Security with ~620 Gbps, OVH with ~1 Tbps, and on 21 October 2016 took down DNS provider Dyn — making Twitter, GitHub, Netflix and others unreachable for parts of the US. Its source was published, and variants still circulate. Every lesson from it is basic hygiene:</p>
<ul>
<li>No universal default passwords; no Telnet/debug shells or open SSH in production images; disable JTAG/UART or lock them.</li>
<li>Devices make <em>outbound</em> connections to the broker; nothing listens on the internet.</li>
<li>Per-device credentials, least-privilege topic policies, cert revocation.</li>
<li>A working, signed update channel for the device's whole supported life — the most important security feature is being able to patch.</li>
<li>Fleet anomaly detection: sudden traffic spikes, new destinations, auth failures (AWS IoT Device Defender, broker metrics).</li>
</ul>
<p><strong>Regulation is catching up</strong> (verify the exact text for your product with counsel):</p>
<table>
<tr><th>Rule</th><th>Key points</th></tr>
<tr><td><strong>EU Cyber Resilience Act</strong> — Regulation (EU) 2024/2847</td><td>Entered into force 10 December 2024. Covers "products with digital elements" sold in the EU. Obligation to report actively exploited vulnerabilities and severe incidents applies from 11 September 2026; most other obligations (secure by design and by default, no known exploitable vulnerabilities at release, vulnerability handling, security updates for a support period that is generally at least 5 years unless the product's expected use is shorter, SBOM in the technical documentation, CE marking) apply from 11 December 2027.</td></tr>
<tr><td><strong>UK PSTI Act</strong></td><td>In force since 29 April 2024 for consumer connectable products: bans universal default passwords, requires a vulnerability disclosure contact and a published minimum support period.</td></tr>
<tr><td><strong>ETSI EN 303 645</strong></td><td>The consumer IoT security baseline standard many of these laws reference.</td></tr>
</table>
<blockquote>💡 Real world: The CRA turns "we'll stop shipping updates after two years" from a business decision into a compliance problem. That pushes OTA infrastructure, signing-key management and SBOM generation (see supply-chain security) from nice-to-have into the product's launch checklist.</blockquote>`,
        he: `<p><strong>Mirai ‏(2016)</strong> סרק את האינטרנט אחרי Telnet על מצלמות ו-DVRs ונכנס עם רשימה של כ-60 צמדי שם משתמש/סיסמה דיפולטיים מהמפעל. ה-botnet שנוצר תקף את Krebs on Security עם כ-620 Gbps, את OVH עם כ-1 Tbps, וב-21 באוקטובר 2016 הפיל את ספק ה-DNS ‏Dyn — מה שהפך את Twitter, ‏GitHub, ‏Netflix ואחרים ללא נגישים בחלקים מארה"ב. קוד המקור פורסם, וגרסאות שלו עדיין מסתובבות. כל הלקחים ממנו הם היגיינה בסיסית:</p>
<ul>
<li>אין סיסמאות דיפולטיות אחידות; אין Telnet/debug shells או SSH פתוח ב-images של פרודקשן; לכבות או לנעול JTAG/UART.</li>
<li>המכשירים יוצרים connections <em>יוצאים</em> ל-broker; שום דבר לא מאזין לאינטרנט.</li>
<li>Credentials לכל מכשיר, ‏policies של topics עם least privilege, ‏revocation לתעודות.</li>
<li>ערוץ עדכונים חתום ועובד לכל חיי התמיכה של המכשיר — יכולת האבטחה הכי חשובה היא היכולת לעשות patch.</li>
<li>זיהוי אנומליות בצי: קפיצות פתאומיות בתעבורה, יעדים חדשים, כשלי auth ‏(AWS IoT Device Defender, מדדי broker).</li>
</ul>
<p><strong>הרגולציה מדביקה את הפער</strong> (תאמת את הנוסח המדויק למוצר שלך מול יועץ משפטי):</p>
<table>
<tr><th>חקיקה</th><th>עיקרי הדברים</th></tr>
<tr><td><strong>EU Cyber Resilience Act</strong> — ‏Regulation (EU) 2024/2847</td><td>נכנס לתוקף ב-10 בדצמבר 2024. חל על "מוצרים עם רכיבים דיגיטליים" שנמכרים באיחוד. חובת הדיווח על חולשות שמנוצלות באופן פעיל ועל אירועים חמורים חלה מ-11 בספטמבר 2026; רוב החובות האחרות (secure by design ו-by default, בלי חולשות ידועות שניתנות לניצול בשחרור, טיפול בחולשות, עדכוני אבטחה לתקופת תמיכה של לפחות 5 שנים בדרך כלל, אלא אם השימוש הצפוי במוצר קצר יותר, ‏SBOM בתיעוד הטכני, סימון CE) חלות מ-11 בדצמבר 2027.</td></tr>
<tr><td><strong>UK PSTI Act</strong></td><td>בתוקף מ-29 באפריל 2024 למוצרי צריכה מחוברים: אוסר סיסמאות דיפולטיות אחידות, דורש כתובת לדיווח חולשות ותקופת תמיכה מינימלית מפורסמת.</td></tr>
<tr><td><strong>ETSI EN 303 645</strong></td><td>תקן הבסיס לאבטחת IoT צרכני שהרבה מהחוקים האלה מפנים אליו.</td></tr>
</table>
<blockquote>💡 מהשטח: ה-CRA הופך את "נפסיק לשחרר עדכונים אחרי שנתיים" מהחלטה עסקית לבעיית compliance. זה מעביר את תשתית ה-OTA, ניהול מפתחות החתימה ויצירת SBOM (ראה supply-chain security) מ-nice-to-have לרשימת התנאים להשקת המוצר.</blockquote>`
      }
    }
  ],
  diagram: `factory: secure element generates key -> CSR -> your CA signs per-device X.509
                                   |
device (A/B rootfs, secure boot) --mTLS MQTT 8883--> broker cluster (IoT Core / IoT Hub / EMQX)
   ^   | telemetry (QoS 1, store&forward)               |-- shadow/twin: desired | reported | delta
   |   '------------------------------------------------|-- rules --> Kafka/Kinesis --> TSDB + S3
   |                                                     '-- jobs: OTA rollout 1% -> 5% -> 25% -> 100%
   '-- signed image (HSM key) <-- artifact store <-- CI build       (auto-halt on boot-fail / rollback rate)`,
  handsOn: [
    { cmd: "docker run -d --name mqtt -p 1883:1883 eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf", what: { en: "Run a local Mosquitto broker for experiments (no auth — lab only).", he: "להריץ broker מקומי של Mosquitto לניסויים (בלי auth — רק למעבדה)." } },
    { cmd: "mosquitto_sub -h localhost -t 'devices/+/status' -v & mosquitto_pub -h localhost -t devices/d1/status -r -q 1 -m online", what: { en: "Publish a retained QoS 1 status and see a late subscriber get it immediately; then kill and restart the subscriber to confirm retain.", he: "לפרסם status מסוג retained ב-QoS 1 ולראות ש-subscriber מאוחר מקבל אותו מיד; אחר כך להרוג ולהפעיל מחדש את ה-subscriber כדי לוודא את ה-retain." } },
    { cmd: "mosquitto_sub -h localhost -i d2 -t devices/d2/cmd --will-topic devices/d2/status --will-payload offline --will-retain -k 10", what: { en: "Connect with a Last Will and 10 s keep-alive, then kill -9 the client and watch 'offline' appear on devices/d2/status after ~15 s.", he: "להתחבר עם Last Will ו-keep-alive של 10 שניות, אז לעשות kill -9 ל-client ולראות 'offline' מופיע ב-devices/d2/status אחרי כ-15 שניות." } },
    { cmd: "aws iot-data get-thing-shadow --thing-name thermo-00042 /dev/stdout", what: { en: "Read a device shadow (desired, reported, delta, version) from AWS IoT Core.", he: "לקרוא device shadow ‏(desired, ‏reported, ‏delta, ‏version) מ-AWS IoT Core." } },
    { cmd: "fw_printenv bootcount bootlimit upgrade_available; rauc status", what: { en: "On an embedded Linux device: inspect U-Boot A/B variables and which slot is booted and marked good.", he: "על מכשיר embedded Linux: לבדוק את משתני ה-A/B של U-Boot ואיזה slot עלה ומסומן כטוב." } }
  ],
  mnemonic: {
    en: "ID-PIPE-AB: unique Identity in a chip, Pub/sub with MQTT, Intermittent by design, Populations not pets — and every firmware goes A/B, signed, by cohort.",
    he: "זהות בשבב, MQTT דרך broker, offline כברירת מחדל, מנטרים אוכלוסיות — וכל firmware יוצא A/B, חתום, לפי cohorts."
  },
  pitfalls: [
    { en: "One shared key or password baked into every firmware image: a single device teardown (or one leaked image) compromises the whole fleet. Per-device keys in a secure element.", he: "מפתח או סיסמה משותפים צרובים בכל image של firmware: פירוק של מכשיר אחד (או image אחד שדלף) פורץ את כל הצי. מפתחות לכל מכשיר ב-secure element." },
    { en: "Rolling out to a random 5% that happens to contain no units of one hardware revision — the bug surfaces at 100%. Stratify cohorts by hw revision, region, carrier and base firmware.", he: "Rollout ל-5% אקראיים שבמקרה לא כוללים אף יחידה מ-hardware revision מסוים — הבאג מתגלה ב-100%. תרבד את ה-cohorts לפי hw revision, אזור, ספק ו-firmware בסיס." },
    { en: "Marking the new slot 'good' as soon as the kernel boots: the device then can't roll back when the app crashes or can't reach the broker. Commit only after an end-to-end health check.", he: "לסמן את ה-slot החדש כ'טוב' ברגע שה-kernel עולה: אז המכשיר לא יכול לעשות rollback כשהאפליקציה קורסת או לא מגיעה ל-broker. עושים commit רק אחרי health check מקצה לקצה." },
    { en: "Fixed reconnect intervals: after a broker restart a million devices retry every 5 seconds in lockstep and the auth layer never recovers. Exponential backoff with full jitter and a cap.", he: "Intervals קבועים ל-reconnect: אחרי restart של broker מיליון מכשירים מנסים כל 5 שניות באותו קצב ושכבת ה-auth אף פעם לא מתאוששת. ‏Exponential backoff עם full jitter ותקרה." }
  ],
  interview: [
    { q: { en: "Design the OTA system for 2M consumer devices on cellular.", he: "תתכנן מערכת OTA ל-2M מכשירים צרכניים על סלולר." },
      a: { en: "Build: reproducible CI images, signed offline with an HSM key, delta artifacts per base version to save data. Device: A/B rootfs, secure boot + dm-verity, anti-rollback counter, bootcount/watchdog, commit only after app + broker health check. Delivery: images on a CDN with presigned URLs, job orchestration via MQTT (AWS IoT Jobs or your own), resumable downloads. Rollout: dogfood → 1% → 5% → 25% → 100%, cohorts stratified by hw revision/region/carrier, automatic halt on boot-failure/rollback/crash thresholds, time-of-day windows, battery/charging preconditions. Observability: per-version and per-hw-rev boot success, rollback counts, reconnect rate. And a support-period commitment (CRA).", he: "Build: ‏images רפרודוקטיביים ב-CI, חתומים offline עם מפתח ב-HSM, ‏delta artifacts לכל גרסת בסיס כדי לחסוך דאטה. מכשיר: A/B ל-rootfs, ‏secure boot + dm-verity, ‏counter של anti-rollback, ‏bootcount/watchdog, ‏commit רק אחרי health check של האפליקציה וה-broker. הפצה: images על CDN עם presigned URLs, ‏orchestration של jobs דרך MQTT ‏(AWS IoT Jobs או משלך), הורדות שאפשר לחדש. ‏Rollout: ‏dogfood ← 1% ← 5% ← 25% ← 100%, ‏cohorts מרובדים לפי hw revision/אזור/ספק, עצירה אוטומטית לפי ספי כשל boot/rollback/crash, חלונות זמן ביום, תנאי סוללה/טעינה. ‏Observability: הצלחת boot לפי גרסה ולפי hw rev, מספר rollbacks, קצב reconnect. ומחויבות לתקופת תמיכה (CRA)." } },
    { q: { en: "What's the difference between MQTT QoS 1 and QoS 2, and which would you use for telemetry?", he: "מה ההבדל בין QoS 1 ל-QoS 2 ב-MQTT, ובמה תשתמש ל-telemetry?" },
      a: { en: "QoS 1 is at-least-once: the receiver PUBACKs, the sender retries until acked, so duplicates happen. QoS 2 is exactly-once per hop via a 4-message handshake — more round trips and state, and not supported by some platforms (AWS IoT Core). For telemetry use QoS 1 (or 0 for high-rate disposable samples) plus idempotent processing keyed by device_id + sequence/timestamp, because exactly-once still doesn't extend past the broker into your pipeline.", he: "QoS 1 הוא at-least-once: הצד המקבל שולח PUBACK, השולח מנסה שוב עד שמקבל ack, ולכן יש כפילויות. ‏QoS 2 הוא exactly-once לכל hop דרך handshake של 4 הודעות — יותר round trips ו-state, ויש פלטפורמות שלא תומכות בו (AWS IoT Core). ל-telemetry משתמשים ב-QoS 1 (או 0 לדגימות בקצב גבוה שאפשר לאבד) ועיבוד אידמפוטנטי לפי device_id + sequence/timestamp, כי exactly-once ממילא לא ממשיך אחרי ה-broker לתוך ה-pipeline שלך." } },
    { q: { en: "Why use a device shadow instead of sending commands directly?", he: "למה להשתמש ב-device shadow במקום לשלוח פקודות ישירות?" },
      a: { en: "Devices are often offline. A direct command to an offline device is lost or needs ad-hoc queuing. The shadow stores desired state durably with a version; the device receives the delta on reconnect, applies it, and reports back, so the system converges. Apps get a consistent read model (last reported state) without waking the device, and version numbers prevent stale overwrites.", he: "מכשירים הרבה פעמים offline. פקודה ישירה למכשיר offline הולכת לאיבוד או דורשת תור מאולתר. ה-shadow שומר את ה-desired state באופן עמיד עם version; המכשיר מקבל את ה-delta כשהוא מתחבר, מיישם ומדווח חזרה, ולכן המערכת מתכנסת. אפליקציות מקבלות read model עקבי (ה-state האחרון שדווח) בלי להעיר את המכשיר, ומספרי version מונעים דריסה של מידע ישן." } }
  ],
  quiz: [
    { q: { en: "A new firmware image boots the kernel on slot B but the app crashes in a loop. What brings the device back to the old firmware automatically?", he: "image חדש של firmware מעלה את ה-kernel ב-slot B אבל האפליקציה קורסת בלולאה. מה מחזיר את המכשיר אוטומטית ל-firmware הישן?" },
      options: [
        { en: "The cloud resends the old image", he: "הענן שולח שוב את ה-image הישן" },
        { en: "The bootloader's boot counter exceeds bootlimit because userspace never committed, so it boots slot A", he: "ה-boot counter של ה-bootloader עובר את bootlimit כי ה-userspace אף פעם לא עשה commit, ולכן הוא מעלה את slot A" },
        { en: "Secure boot rejects the image", he: "Secure boot דוחה את ה-image" },
        { en: "The MQTT Last Will triggers a rollback", he: "ה-Last Will של MQTT מפעיל rollback" }
      ], answer: 1,
      explain: { en: "A/B rollback is local: the updated slot stays 'on trial' until a health check commits it. Without a commit, each reboot (watchdog or crash) bumps bootcount until altbootcmd boots the previous slot. The image is validly signed, and a broken device can't wait for the cloud.", he: "Rollback של A/B הוא מקומי: ה-slot המעודכן נשאר 'בניסיון' עד ש-health check עושה לו commit. בלי commit, כל reboot ‏(watchdog או crash) מעלה את bootcount עד ש-altbootcmd מעלה את ה-slot הקודם. ה-image חתום כחוק, ומכשיר שבור לא יכול לחכות לענן." } },
    { q: { en: "Which MQTT feature lets a dashboard know a device dropped off without a clean disconnect?", he: "איזו יכולת של MQTT מאפשרת ל-dashboard לדעת שמכשיר נפל בלי disconnect מסודר?" },
      options: [
        { en: "Retained messages", he: "Retained messages" },
        { en: "QoS 2", he: "QoS 2" },
        { en: "Last Will and Testament, fired by the broker after the keep-alive timeout", he: "Last Will and Testament, שה-broker מפרסם אחרי timeout של keep-alive" },
        { en: "Topic aliases", he: "Topic aliases" }
      ], answer: 2,
      explain: { en: "The device registers a will message at CONNECT; if the broker misses keep-alives (~1.5× the interval) or the TCP connection breaks without DISCONNECT, it publishes the will. Often combined with retain so new subscribers see 'offline'.", he: "המכשיר רושם הודעת will ב-CONNECT; אם ה-broker מפספס keep-alives ‏(~פי 1.5 מה-interval) או שה-TCP connection נשבר בלי DISCONNECT, הוא מפרסם את ה-will. לרוב משלבים עם retain כדי ש-subscribers חדשים יראו 'offline'." } },
    { q: { en: "Why is 'fleet provisioning by claim' riskier than per-device certs injected at manufacturing?", he: "למה 'fleet provisioning by claim' מסוכן יותר מתעודות לכל מכשיר שמוזרקות בייצור?" },
      options: [
        { en: "Claim certs use weaker TLS", he: "תעודות claim משתמשות ב-TLS חלש יותר" },
        { en: "Every device ships with the same claim credential, so if it's extracted an attacker can try to register fake devices — it must be tightly scoped and validated by a hook", he: "כל המכשירים יוצאים עם אותו credential של claim, אז אם מחלצים אותו תוקף יכול לנסות לרשום מכשירים מזויפים — חייבים להגביל אותו ולאמת עם hook" },
        { en: "Devices can't generate keys", he: "מכשירים לא יכולים לייצר מפתחות" },
        { en: "It doesn't support MQTT", he: "זה לא תומך ב-MQTT" }
      ], answer: 1,
      explain: { en: "The claim cert is shared, so it's a fleet-wide secret. Mitigate with a policy that only allows the provisioning API, a pre-provisioning hook that checks serials against an allowlist, and per-device keys generated on first boot.", he: "תעודת ה-claim משותפת, ולכן היא סוד של כל הצי. מצמצמים עם policy שמאפשרת רק את ה-API של ה-provisioning, ‏pre-provisioning hook שבודק מספרים סידוריים מול allowlist, ומפתחות לכל מכשיר שנוצרים ב-boot הראשון." } },
    { q: { en: "1M devices each send a 200-byte message every 10 s. Roughly what raw volume per day?", he: "1M מכשירים, כל אחד שולח הודעה של 200 bytes כל 10 שניות. בערך כמה נפח גולמי ליום?" },
      options: [
        { en: "~17 GB", he: "~17 GB" },
        { en: "~170 GB", he: "~170 GB" },
        { en: "~1.7 TB", he: "~1.7 TB" },
        { en: "~17 TB", he: "~17 TB" }
      ], answer: 2,
      explain: { en: "100k msg/s × 200 B = 20 MB/s; × 86,400 s ≈ 1.73 TB/day before protocol overhead — which is why downsampling and tiered retention matter.", he: "100k הודעות בשנייה × 200 B = 20 MB/s; × 86,400 שניות ≈ 1.73 TB ליום לפני overhead של פרוטוקול — ובגלל זה downsampling ו-retention בשכבות חשובים." } }
  ],
  related: ["pr-realtime-protocols", "staff-supply-chain", "crypto-encryption-practice", "pr-applied-crypto-pki", "db-time-series", "release-engineering", "compliance-for-engineers"]
});

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------
INFRA.glossary.push(
  { term: "epoll", track: "linux", def: { en: "Linux readiness API (epoll_create1/epoll_ctl/epoll_wait): the kernel keeps the interest list and returns only ready fds, so cost scales with active connections, not total.", he: "API מוכנוּת של Linux ‏(epoll_create1/epoll_ctl/epoll_wait): ה-kernel שומר את רשימת העניין ומחזיר רק fds מוכנים, ולכן העלות גדלה עם ה-connections הפעילים, לא עם כולם." }, lesson: "linux-epoll-iouring" },
  { term: "io_uring", track: "linux", def: { en: "Completion-based Linux async I/O (5.1+): shared submission and completion rings let apps batch reads/writes/accepts with few or no syscalls; often disabled or restricted for security.", he: "IO אסינכרוני מבוסס השלמה ב-Linux ‏(5.1+): ‏rings משותפים של הגשה והשלמה מאפשרים לאגד קריאות/כתיבות/accepts עם מעט syscalls או בלי; הרבה פעמים כבוי או מוגבל מסיבות אבטחה." }, lesson: "linux-epoll-iouring" },
  { term: "SO_REUSEPORT", track: "linux", def: { en: "Socket option letting several processes bind their own socket to the same port; the kernel hashes new connections across them, avoiding a shared accept queue and thundering herd.", he: "אופציית socket שמאפשרת לכמה processes לקשור socket משלהם לאותו port; ה-kernel מפזר connections חדשים ביניהם לפי hash, בלי accept queue משותף ובלי thundering herd." }, lesson: "linux-epoll-iouring" },
  { term: "Device shadow / twin", track: "cloud", def: { en: "Cloud-side JSON per IoT device with desired and reported state; the platform delivers the delta when the device reconnects, so offline devices converge.", he: "מסמך JSON בענן לכל מכשיר IoT עם state רצוי ו-state מדווח; הפלטפורמה מוסרת את ה-delta כשהמכשיר מתחבר מחדש, כך שגם מכשירים שהיו offline מתכנסים." }, lesson: "iot-fleets-ota" },
  { term: "A/B update (dual-bank)", track: "cloud", def: { en: "Firmware update scheme with two system slots: write the inactive one, boot it on trial, and let the bootloader fall back to the old slot if the new one never confirms health.", he: "שיטת עדכון firmware עם שני slots: כותבים ל-slot הלא פעיל, מעלים אותו בניסיון, וה-bootloader חוזר ל-slot הישן אם החדש אף פעם לא מאשר שהוא בריא." }, lesson: "iot-fleets-ota" },
  { term: "Fleet provisioning", track: "cloud", def: { en: "Issuing unique identities to devices at scale — at manufacturing, or on first boot by exchanging a shared low-privilege claim credential for a per-device certificate.", he: "הנפקת זהויות ייחודיות למכשירים בסקייל — בייצור, או ב-boot הראשון על ידי החלפת credential משותף של claim בהרשאה נמוכה בתעודה לכל מכשיר." }, lesson: "iot-fleets-ota" }
);

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------
INFRA.scenarios.push({
  id: "ota-bricked-devices",
  icon: "📡",
  title: { en: "Firmware 4.2.0 is failing on one hardware revision", he: "Firmware 4.2.0 נכשל על hardware revision אחד" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Tuesday 10:20. The OTA rollout of thermostat firmware 4.2.0 moved from the 1% cohort to 10% an hour ago. An alert fires: boot-success rate is dropping. You own the rollout.",
        he: "יום שלישי, 10:20. ה-rollout של firmware 4.2.0 לתרמוסטטים עבר לפני שעה מה-cohort של 1% ל-10%. מתקבלת התראה: אחוז הצלחת ה-boot יורד. ה-rollout באחריותך."
      },
      data: `OTA rollout fw-4.2.0         stage 2/5 (10%)   targeted 48,000   updated 31,200
hw_rev   targeted  installed  boot_ok   rolled_back  offline>30m
rev-A     19,800    13,100     13,060        12          28
rev-B     22,400    14,900     14,850        18          32
rev-C      5,800     3,200      1,940     1,170          90     <-- 36% rolled back
auto-halt threshold: rollback_rate > 5% (fleet-wide)   current fleet-wide: 3.8%`,
      choices: [
        { label: { en: "Halt the rollout now, before checking anything else", he: "לעצור את ה-rollout עכשיו, לפני שבודקים משהו אחר" }, next: "s2", score: 15,
          feedback: { en: "Right. Fleet-wide 3.8% hides a 36% failure on rev-C. Stopping the bleeding is cheap and reversible; every minute adds more rev-C devices.", he: "נכון. ה-3.8% ברמת הצי מסתירים כשל של 36% ב-rev-C. לעצור את הדימום זה זול והפיך; כל דקה מוסיפה עוד מכשירי rev-C." } },
        { label: { en: "Fleet-wide is under the 5% auto-halt threshold — let it continue and watch", he: "ברמת הצי זה מתחת לסף העצירה של 5% — לתת לזה להמשיך ולעקוב" }, next: "s1b", score: -15,
          feedback: { en: "The threshold is fleet-wide, but the failure is concentrated. Averages hide cohort-specific disasters.", he: "הסף הוא ברמת הצי, אבל הכשל מרוכז. ממוצעים מסתירים אסונות שספציפיים ל-cohort." } },
        { label: { en: "Push 4.1.3 to every rev-C device immediately as a 'downgrade' job", he: "לדחוף מיד 4.1.3 לכל מכשירי rev-C כ-job של 'downgrade'" }, next: "s1b", score: -5,
          feedback: { en: "You're starting a second untested rollout while the first is still running — and anti-rollback counters may reject an older image. Halt first, then look at what devices actually did.", he: "אתה מתחיל rollout שני שלא נבדק בזמן שהראשון עדיין רץ — ו-counters של anti-rollback עלולים לדחות image ישן יותר. קודם עוצרים, ואז בודקים מה המכשירים עשו בפועל." } }
      ]
    },
    s1b: {
      text: {
        en: "20 minutes later: 2,900 rev-C devices have rolled back, 260 are offline for over 30 minutes, and support tickets mention 'thermostat rebooted three times and the screen is blank'. A director asks what's going on.",
        he: "20 דקות אחר כך: 2,900 מכשירי rev-C עשו rollback, ‏260 offline יותר מ-30 דקות, ופניות לתמיכה מזכירות 'התרמוסטט עשה reboot שלוש פעמים והמסך ריק'. דירקטור שואל מה קורה."
      },
      data: `fw-4.2.0  rev-C   installed 6,100   rolled_back 2,900   offline>30m 260   tickets(1h) 74`,
      choices: [
        { label: { en: "Halt the rollout now and report: rev-C-specific failure, A/B rollback is catching most devices", he: "לעצור עכשיו את ה-rollout ולדווח: כשל ספציפי ל-rev-C, ‏A/B rollback תופס את רוב המכשירים" }, next: "s2", score: 5,
          feedback: { en: "Late, but the right move. Clear communication with the current blast radius buys you time.", he: "מאוחר, אבל זה המהלך הנכון. תקשורת ברורה עם ה-blast radius הנוכחי קונה לך זמן." } },
        { label: { en: "Keep going — the rollback is working, so no harm done", he: "להמשיך — ה-rollback עובד, אז אין נזק" }, next: "lose", score: -20,
          feedback: { en: "260 devices aren't coming back on their own, and rev-C customers have no heating during reboots. 'Rollback exists' doesn't mean 'failures are free'.", he: "260 מכשירים לא חוזרים לבד, ולקוחות rev-C בלי חימום בזמן ה-reboots. 'יש rollback' לא אומר 'כשלים זה בחינם'." } }
      ]
    },
    s2: {
      text: {
        en: "Rollout paused; no new devices receive 4.2.0. Most failed rev-C devices are back on 4.1.3 and reconnected. But 90 rev-C units are still offline. Next step?",
        he: "ה-rollout מושהה; אף מכשיר חדש לא מקבל 4.2.0. רוב מכשירי rev-C שנכשלו חזרו ל-4.1.3 והתחברו מחדש. אבל 90 יחידות rev-C עדיין offline. מה הצעד הבא?"
      },
      data: `rev-C failed devices (n=1,260)
  rolled back to slot A, reconnected     1,170
  offline > 30 min                          90
    last report before going dark: "installing" 61 | "rebooting" 29
    battery-powered models among them:      58`,
      choices: [
        { label: { en: "Pull boot logs from rolled-back devices (they still have the failed attempt in persistent logs) and look at the offline ones' last state", he: "למשוך boot logs ממכשירים שעשו rollback (הניסיון הכושל עדיין שמור אצלם ב-logs קבועים) ולבדוק את ה-state האחרון של אלה שב-offline" }, next: "s3", score: 15,
          feedback: { en: "The 1,170 recovered devices are your evidence. And '61 offline while installing, 58 on battery' looks like a separate power/connectivity story, not bricking.", he: "1,170 המכשירים שהתאוששו הם הראיות שלך. ו-'61 offline בזמן התקנה, 58 על סוללה' נראה כמו סיפור נפרד של חשמל/קישוריות, לא לבנים." } },
        { label: { en: "Dispatch technicians to all 90 offline homes", he: "לשלוח טכנאים לכל 90 הבתים שב-offline" }, next: "s3", score: -5,
          feedback: { en: "Expensive and premature. Most were mid-download on battery: slot A is intact and they'll likely reappear. Understand first.", he: "יקר ומוקדם מדי. רובם היו באמצע הורדה על סוללה: slot A שלם וכנראה הם יחזרו. קודם להבין." } }
      ]
    },
    s3: {
      text: {
        en: "Persistent logs from a rolled-back rev-C device show what happened on slot B. The hardware team mentions rev-C switched to a second-source eMMC part last quarter.",
        he: "logs קבועים ממכשיר rev-C שעשה rollback מראים מה קרה על slot B. צוות החומרה מזכיר ש-rev-C עבר ברבעון שעבר לרכיב eMMC מספק שני."
      },
      data: `[slot B, fw 4.2.0, boot 1/3]
[    1.842] mmc0: error -110 whilst initialising MMC card
[    2.913] mmc0: error -110 whilst initialising MMC card
[    4.101] VFS: Cannot open root device "mmcblk0p3" or unknown-block(0,0): error -6
[    4.102] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)
[U-Boot] bootcount=3 > bootlimit=3 -> altbootcmd: booting slot A (fw 4.1.3)
---
4.2.0 changelog: kernel 6.1 -> 6.6, device tree cleanup: "remove unused mmc timing overrides"
lab test matrix for 4.2.0: rev-A x4, rev-B x4, rev-C x0`,
      choices: [
        { label: { en: "Root cause: the DT cleanup removed MMC timing overrides the second-source eMMC on rev-C needs; restore them, build 4.2.1, test on real rev-C units of both eMMC vendors", he: "Root cause: ניקוי ה-DT הוריד הגדרות timing של MMC שה-eMMC מהספק השני ב-rev-C צריך; להחזיר אותן, לבנות 4.2.1, לבדוק על יחידות rev-C אמיתיות משני ספקי ה-eMMC" }, next: "s4", score: 15,
          feedback: { en: "Exactly: the kernel can't initialise the storage (-110 = ETIMEDOUT), so root fs never mounts. And the test matrix had zero rev-C units — a process gap as important as the bug.", he: "בדיוק: ה-kernel לא מצליח לאתחל את האחסון (‎-110 = ETIMEDOUT), ולכן ה-root fs אף פעם לא עולה. ובמטריצת הבדיקות היו אפס יחידות rev-C — פער תהליכי חשוב כמו הבאג עצמו." } },
        { label: { en: "Raise bootlimit to 10 so devices retry more before rolling back", he: "להעלות את bootlimit ל-10 כדי שמכשירים ינסו יותר לפני rollback" }, next: "s3b", score: -10,
          feedback: { en: "The failure is deterministic, not flaky. More retries means longer outages per device — and changing bootloader env fleet-wide is itself risky.", he: "הכשל דטרמיניסטי, לא אקראי. יותר ניסיונות זה השבתה ארוכה יותר לכל מכשיר — ושינוי ה-env של ה-bootloader בכל הצי הוא סיכון בפני עצמו." } }
      ]
    },
    s3b: {
      text: {
        en: "A reviewer points out the logs show a hard eMMC init timeout on every attempt — retrying won't help. Back to the root cause.",
        he: "reviewer מצביע על כך שה-logs מראים timeout קשיח באתחול ה-eMMC בכל ניסיון — retries לא יעזרו. חוזרים ל-root cause."
      },
      choices: [
        { label: { en: "Investigate what changed in storage init between 4.1.3 and 4.2.0", he: "לבדוק מה השתנה באתחול האחסון בין 4.1.3 ל-4.2.0" }, next: "s4", score: 5,
          feedback: { en: "Good recovery: diff the changes against the failing subsystem.", he: "התאוששות טובה: משווים את השינויים מול תת-המערכת שנכשלת." } }
      ]
    },
    s4: {
      text: {
        en: "4.2.1 passes on 8 rev-C units in the lab (both eMMC vendors) plus all rev-A/B units. How do you resume?",
        he: "4.2.1 עובר על 8 יחידות rev-C במעבדה (שני ספקי eMMC) ועל כל יחידות rev-A/B. איך ממשיכים?"
      },
      choices: [
        { label: { en: "Restart the staged rollout for 4.2.1: dogfood, then 1% stratified by hw_rev and eMMC vendor, with a per-hw_rev auto-halt (rollback_rate > 1% in any cohort), then 5% → 25% → 100%", he: "להתחיל מחדש rollout מדורג ל-4.2.1: ‏dogfood, אחר כך 1% מרובד לפי hw_rev וספק eMMC, עם auto-halt לכל hw_rev ‏(rollback_rate מעל 1% בכל cohort), ואז 5% ← 25% ← 100%" }, next: "win", score: 20,
          feedback: { en: "This fixes the detection gap too: halt thresholds per cohort, not just fleet-wide averages.", he: "זה סוגר גם את פער הזיהוי: ספי עצירה לכל cohort, לא רק ממוצע של כל הצי." } },
        { label: { en: "Lab passed — ship 4.2.1 to 100% to make up for lost time", he: "המעבדה עברה — לשחרר 4.2.1 ל-100% כדי להשלים את הזמן שאבד" }, next: "lose", score: -20,
          feedback: { en: "Eight lab units don't represent 60,000 field devices on different carriers, temperatures and eMMC batches. The same shortcut is how you got here.", he: "שמונה יחידות מעבדה לא מייצגות 60,000 מכשירים בשטח על ספקים, טמפרטורות ו-batches שונים של eMMC. אותו קיצור דרך הביא אותך לכאן." } }
      ]
    },
    win: {
      text: {
        en: "4.2.1 reaches 100% over five days with a 0.3% rollback rate, evenly spread across revisions. Of the 90 dark units, 84 reappeared on 4.1.3 once charged; 6 needed a USB recovery. The postmortem adds: every hw_rev × storage vendor in the HIL test matrix, per-cohort halt thresholds, and BOM changes (second-source parts) as a trigger for firmware re-qualification. A/B saved you from a recall.",
        he: "4.2.1 מגיע ל-100% תוך חמישה ימים עם rollback rate של 0.3%, מפוזר באופן שווה בין ה-revisions. מתוך 90 היחידות שנעלמו, 84 חזרו על 4.1.3 אחרי טעינה; 6 צריכות recovery דרך USB. ה-postmortem מוסיף: כל צירוף hw_rev × ספק אחסון במטריצת בדיקות ה-HIL, ספי עצירה לכל cohort, ושינויי BOM (רכיבים מספק שני) כטריגר ל-requalification של firmware. ‏A/B הציל אותך מריקול."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "Thousands more rev-C devices cycle through failed boots; some battery units die mid-update and never return, and support queues explode. You survive thanks to A/B rollback, but the postmortem's first finding is that the rollout wasn't stopped when the cohort data was screaming.",
        he: "אלפי מכשירי rev-C נוספים עוברים מחזורים של boot כושל; חלק מהיחידות על סוללה מתות באמצע עדכון ולא חוזרות, ותורי התמיכה מתפוצצים. שרדת בזכות A/B rollback, אבל הממצא הראשון ב-postmortem הוא שה-rollout לא נעצר כשהנתונים לפי cohort צעקו."
      },
      end: "lose"
    }
  },
  lessons: ["iot-fleets-ota", "release-engineering"]
});
