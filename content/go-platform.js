window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Go for platform engineers: concurrency, and the CLI / client-go / controller toolbox.
   Code snippets are shared between the English and Hebrew bodies (code is always LTR). */
(function () {

/* ------------------------------------------------------------------ */
/* go-concurrency: code                                                */
/* ------------------------------------------------------------------ */
const GMP_CODE = `G  goroutine        starts with a ~2 KiB stack that grows by copying
M  machine          a real OS thread that executes Gs
P  processor        a scheduling slot; there are GOMAXPROCS of them,
                    each with a local run queue (256 Gs) + a shared global queue

# Watch the scheduler: one line per second
$ GODEBUG=schedtrace=1000 ./fleet-sync
SCHED 1004ms: gomaxprocs=4 idleprocs=0 threads=9 spinningthreads=1 needspinning=0 idlethreads=3 runqueue=12 [31 8 40 2]`;

const CHAN_CODE = `// Fan-in two event streams until both close or ctx is cancelled.
func merge(ctx context.Context, a, b &lt;-chan Event, out chan&lt;- Event) error {
	for a != nil || b != nil {
		var ev Event
		select {
		case e, ok := &lt;-a:
			if !ok {
				a = nil // closed: a nil channel is never ready, so this case is disabled
				continue
			}
			ev = e
		case e, ok := &lt;-b:
			if !ok {
				b = nil
				continue
			}
			ev = e
		case &lt;-ctx.Done():
			return ctx.Err()
		}
		select { // the send must also respect cancellation
		case out &lt;- ev:
		case &lt;-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}`;

const TIMEOUT_CODE = `// The classic leak: unbuffered result channel + timeout
func fetch(ctx context.Context, url string) (*Resp, error) {
	ch := make(chan *Resp)        // BUG: should be make(chan *Resp, 1)
	go func() { ch &lt;- slowCall(url) }()
	select {
	case r := &lt;-ch:
		return r, nil
	case &lt;-time.After(2 * time.Second):
		return nil, errors.New("timeout") // the goroutine above blocks on send forever
	case &lt;-ctx.Done():
		return nil, ctx.Err()
	}
}`;

const CTX_CODE = `func (s *Server) handleSync(w http.ResponseWriter, r *http.Request) {
	// r.Context() is cancelled when the client disconnects.
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel() // ALWAYS: releases the timer and the child context

	inv, err := s.inventory.Get(ctx, r.PathValue("cluster"))
	if errors.Is(err, context.DeadlineExceeded) {
		http.Error(w, "inventory timed out", http.StatusGatewayTimeout)
		return
	}
	// ...
}

func (c *InventoryClient) Get(ctx context.Context, cluster string) (*Inventory, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/v1/clusters/"+cluster, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req) // aborted the moment ctx is done
	if err != nil {
		return nil, fmt.Errorf("get inventory %s: %w", cluster, err)
	}
	defer resp.Body.Close()
	// ...
}`;

const ERRGROUP_CODE = `import "golang.org/x/sync/errgroup"

func upgradeFleet(ctx context.Context, clusters []Cluster) error {
	g, ctx := errgroup.WithContext(ctx) // ctx is cancelled on the first error
	g.SetLimit(16)                      // at most 16 in flight; g.Go blocks when full
	for _, c := range clusters {
		g.Go(func() error { // Go 1.22+: c is a fresh variable per iteration
			if err := upgrade(ctx, c); err != nil {
				return fmt.Errorf("cluster %s: %w", c.Name, err)
			}
			return nil
		})
	}
	return g.Wait() // waits for all; returns the first non-nil error
}`;

const POOL_CODE = `jobs := make(chan Job)
results := make(chan Result, 64)

var wg sync.WaitGroup
for range 8 { // range over int: Go 1.22+
	wg.Go(func() { // WaitGroup.Go: Go 1.25+ (Add(1) + go + defer Done in one call)
		for j := range jobs { // ends when jobs is closed and drained
			results &lt;- process(ctx, j)
		}
	})
}

go func() {
	defer close(jobs) // the single producer owns jobs, so it closes it
	for _, j := range all {
		select {
		case jobs &lt;- j:
		case &lt;-ctx.Done():
			return
		}
	}
}()

go func() { wg.Wait(); close(results) }() // close results only after every sender is done
for r := range results {
	report(r)
}`;

const LEAK_CODE = `import _ "net/http/pprof" // registers /debug/pprof/* on http.DefaultServeMux

go func() { log.Println(http.ListenAndServe("localhost:6060", nil)) }()

$ curl -s 'localhost:6060/debug/pprof/goroutine?debug=1' | head -6
goroutine profile: total 48213
47990 @ 0x43e2ae 0x40b6f4 0x40b278 0x6a1c25 0x471f21
#	0x6a1c24	example.com/fleet/fetch.fetch.func1+0x64	/src/fetch/fetch.go:12

// Tests: fail if any goroutine is still running when the package's tests end
func TestMain(m *testing.M) { goleak.VerifyTestMain(m) } // go.uber.org/goleak

# Go 1.26 experiment: report goroutines blocked on unreachable primitives
$ GOEXPERIMENT=goroutineleakprofile go build ./cmd/fleet-sync
$ curl -s localhost:6060/debug/pprof/goroutineleak?debug=1`;

const RACE_CODE = `$ go test -race -count=1 ./...
==================
WARNING: DATA RACE
Write at 0x00c0001a2010 by goroutine 23:
  example.com/fleet/state.(*Cache).Set()
      /src/state/cache.go:31 +0x84
Previous read at 0x00c0001a2010 by goroutine 22:
  example.com/fleet/state.(*Cache).Get()
      /src/state/cache.go:24 +0x5c
==================
--- FAIL: TestCacheConcurrent (0.02s)
    testing.go:1490: race detected during execution of test`;

const SYNCTEST_CODE = `// Go 1.25+: testing/synctest runs the test in a "bubble" with a fake clock.
func TestFetchTimesOut(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		_, err := fetchWithTimeout(t.Context(), neverAnswers) // 2s timeout inside
		if !errors.Is(err, errTimeout) {                    // runs in microseconds:
			t.Fatalf("got %v", err)                         // time jumps when every
		}                                                   // goroutine is blocked
	})
}`;

const BUGS_CODE = `// 1) Loop variable capture (go.mod "go" directive below 1.22)
for _, c := range clusters {
	go func() { drain(c) }() // pre-1.22: every goroutine may see the LAST c
}

// 2) Two producers, one close: the slower one panics
//    "panic: send on closed channel"

// 3) Forgetting cancel: go vet reports
//    "the cancel function returned by context.WithTimeout should be called,
//     not discarded, to avoid a context leak"
ctx, _ := context.WithTimeout(parent, time.Second)

// 4) wg.Add inside the goroutine: Wait can return before Add runs
go func() { wg.Add(1); defer wg.Done(); work() }()

// 5) Copying a struct that holds a sync.Mutex (go vet copylocks)
func (c Cache) Get(k string) string { c.mu.Lock(); defer c.mu.Unlock(); return c.m[k] }`;

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "go-concurrency",
  track: "architecture",
  order: 70,
  icon: "🐹",
  level: 3,
  minutes: 18,
  title: { en: "Go Concurrency for Platform Engineers", he: "Concurrency ב-Go למהנדסי פלטפורמה" },
  tldr: {
    en: "Goroutines are cheap because the Go runtime multiplexes them onto a few OS threads (G-M-P), parks them on the netpoller during I/O and preempts them every ~10ms. The hard part isn't starting them, it's stopping them: every goroutine needs an owner, a way to be cancelled (context), a bound (errgroup.SetLimit or a worker pool), and a test that proves it ended (goleak, -race).",
    he: "Goroutine-ים זולים כי ה-runtime של Go מרכז אותם על מעט threads של מערכת ההפעלה (G-M-P), מחנה אותם ב-netpoller בזמן I/O ועושה להם preemption כל ~10ms. החלק הקשה הוא לא להפעיל אותם אלא לעצור אותם. לכל goroutine צריך בעלים, דרך לבטל אותו (context), גבול (errgroup.SetLimit או worker pool), ובדיקה שמוכיחה שהוא נגמר (goleak, -race)."
  },
  analogy: {
    en: "A restaurant with 4 cooks (P), a few stoves (M) and 100,000 order tickets (G). A cook never stands waiting for water to boil: he puts the pot on a timer (netpoller), grabs the next ticket, and steals tickets from a busier cook's rail when his own is empty. The danger isn't too many tickets, it's tickets nobody will ever close: a dish waiting for a waiter who already went home (a goroutine blocked on a channel nobody reads).",
    he: "מסעדה עם 4 טבחים (P), כמה כיריים (M) ו-100,000 פתקי הזמנה (G). טבח אף פעם לא עומד ומחכה שהמים ירתחו: הוא שם את הסיר על טיימר (netpoller), לוקח את הפתק הבא, וכשהמסילה שלו ריקה הוא גונב פתקים מטבח עמוס יותר. הסכנה היא לא יותר מדי פתקים, אלא פתקים שאף אחד לא יסגור לעולם: מנה שמחכה למלצר שכבר הלך הביתה. זה goroutine שתקוע על channel שאף אחד לא קורא ממנו."
  },
  sections: [
    {
      h: { en: "Goroutines and the G-M-P scheduler", he: "Goroutine-ים וה-scheduler של G-M-P" },
      body: {
        en: `<pre>${GMP_CODE}</pre>
<ul>
<li><strong>Cheap to create</strong>: a goroutine is a runtime struct plus a ~2 KiB stack that grows (and shrinks) by copying. Switching between goroutines is a user-space operation of roughly a hundred nanoseconds, no syscall.</li>
<li><strong>Network I/O doesn't hold a thread</strong>: a goroutine reading a socket is parked on the <strong>netpoller</strong> (epoll on Linux, kqueue on macOS, IOCP on Windows). Its M runs other Gs; when the fd is ready the G goes back on a run queue.</li>
<li><strong>Blocking syscalls and cgo do hold a thread</strong>: the M is stuck in the kernel, so the background <code>sysmon</code> thread takes its P away and hands it to another M. That's why a Go program doing heavy file I/O or cgo can still grow to hundreds of threads.</li>
<li><strong>Preemption</strong>: since Go 1.14 it's asynchronous. A goroutine running more than ~10ms gets a signal (SIGURG) and is descheduled even in a tight loop with no function calls. Before 1.14, a <code>for {}</code> loop could starve the GC.</li>
<li><strong>Work stealing</strong>: an idle P steals half of another P's local run queue, so load balances without a central lock.</li>
</ul>
<p><strong>Why 100k goroutines are fine and 100k threads aren't</strong>: 100k parked goroutines cost a few hundred MB of stack at most and zero CPU while parked. 100k OS threads each reserve a stack (8 MiB of virtual memory by default on Linux), cost a kernel task struct, make every context switch a microsecond-scale kernel trip, and hit hard limits first: the cgroup <code>pids.max</code> of your container, <code>kernel.threads-max</code>, and Go's own cap of 10,000 threads (<code>debug.SetMaxThreads</code>), after which the program crashes with <code>runtime: program exceeds 10000-thread limit</code>.</p>
<blockquote>💡 Real world: the number of Ps is GOMAXPROCS. In containers, its sizing against CPU limits and CFS quota is its own topic: see <code>runtime-threads-in-containers</code>.</blockquote>`,
        he: `<pre>${GMP_CODE}</pre>
<ul>
<li><strong>זול ליצור</strong>: goroutine הוא struct של ה-runtime ועוד stack של ~2 KiB שגדל (וקטן) על ידי העתקה. מעבר בין goroutine-ים קורה ב-user space, בערך מאה ננו-שניות, בלי syscall.</li>
<li><strong>I/O של רשת לא תופס thread</strong>: goroutine שקורא מ-socket מוחנה ב-<strong>netpoller</strong> (epoll ב-Linux, kqueue ב-macOS, IOCP ב-Windows). ה-M שלו מריץ goroutine-ים אחרים, וכשה-fd מוכן ה-G חוזר לתור.</li>
<li><strong>Syscalls חוסמים ו-cgo כן תופסים thread</strong>: ה-M תקוע ב-kernel, אז ה-thread שרץ ברקע (<code>sysmon</code>) לוקח ממנו את ה-P ומעביר אותו ל-M אחר. לכן תוכנית Go שעושה הרבה I/O לקבצים או cgo יכולה לגדול למאות threads.</li>
<li><strong>Preemption</strong>: מאז Go 1.14 הוא אסינכרוני. goroutine שרץ יותר מ-~10ms מקבל signal (SIGURG) ומורד מה-CPU, גם בלולאה צפופה בלי קריאות לפונקציות. לפני 1.14 לולאת <code>for {}</code> יכלה להרעיב את ה-GC.</li>
<li><strong>Work stealing</strong>: P פנוי גונב חצי מהתור המקומי של P אחר, כך שהעומס מתאזן בלי lock מרכזי.</li>
</ul>
<p><strong>למה 100k goroutine-ים זה בסדר ו-100k threads לא</strong>: 100k goroutine-ים מוחנים עולים לכל היותר כמה מאות MB של stack, ואפס CPU כל עוד הם מחכים. 100k threads של מערכת ההפעלה שומרים כל אחד stack (ב-Linux ברירת המחדל היא 8 MiB של זיכרון וירטואלי), עולים task struct ב-kernel, הופכים כל context switch לטיול של מיקרו-שנייה ב-kernel, ובעיקר נתקעים קודם במגבלות: ה-<code>pids.max</code> של ה-cgroup של הקונטיינר, <code>kernel.threads-max</code>, והתקרה של Go עצמו, 10,000 threads (<code>debug.SetMaxThreads</code>). מעבר לה התוכנית קורסת עם <code>runtime: program exceeds 10000-thread limit</code>.</p>
<blockquote>💡 Real world: מספר ה-P-ים הוא GOMAXPROCS. איך מכיילים אותו מול CPU limits ו-CFS quota בקונטיינר זה נושא בפני עצמו, ראה <code>runtime-threads-in-containers</code>.</blockquote>`
      }
    },
    {
      h: { en: "Channels, select and the rules that panic", he: "Channels, select והכללים שמקפיצים panic" },
      body: {
        en: `<table>
<tr><th>Operation</th><th>nil channel</th><th>open channel</th><th>closed channel</th></tr>
<tr><td>send <code>ch &lt;- v</code></td><td>blocks forever</td><td>blocks until a receiver (unbuffered) or buffer space</td><td><strong>panic</strong></td></tr>
<tr><td>receive <code>&lt;-ch</code></td><td>blocks forever</td><td>blocks until a value arrives</td><td>returns immediately: zero value, <code>ok == false</code></td></tr>
<tr><td><code>close(ch)</code></td><td><strong>panic</strong></td><td>ok, wakes every receiver</td><td><strong>panic</strong></td></tr>
</table>
<ul>
<li><strong>Unbuffered</strong> (<code>make(chan T)</code>) is a handoff: the send completes only when a receiver takes it. Good for synchronization, a common source of leaks when the receiver walks away.</li>
<li><strong>Buffered</strong> (<code>make(chan T, n)</code>) decouples up to <code>n</code> items. A buffer is not a fix for a slow consumer, it just delays the moment you block. Use a buffer of 1 for "one result, maybe nobody waits for it".</li>
<li><strong>Closing rules</strong>: only the sender closes, and only when no other sender can still send. With several senders, close after <code>wg.Wait()</code> in a separate goroutine. Receivers never close. Closing is a broadcast ("no more values"), not a resource cleanup: an unclosed channel is garbage-collected like anything else.</li>
<li><strong>nil channels in select</strong>: a case on a nil channel is never ready. Setting a channel variable to nil is the idiomatic way to switch off a case after its channel closes:</li>
</ul>
<pre>${CHAN_CODE}</pre>
<p><strong>Timeouts</strong>: prefer a context deadline over <code>time.After</code>, because the deadline propagates to everything downstream. And watch the most common leak in Go code review:</p>
<pre>${TIMEOUT_CODE}</pre>
<p>When the timeout wins, nobody ever receives from <code>ch</code>, so the worker goroutine is stuck forever on the send, holding the response and everything it references. A buffer of 1 lets it send and exit.</p>`,
        he: `<table>
<tr><th>פעולה</th><th>nil channel</th><th>channel פתוח</th><th>channel סגור</th></tr>
<tr><td>שליחה <code>ch &lt;- v</code></td><td>חוסם לנצח</td><td>חוסם עד שיש receiver (ב-unbuffered) או מקום ב-buffer</td><td><strong>panic</strong></td></tr>
<tr><td>קבלה <code>&lt;-ch</code></td><td>חוסם לנצח</td><td>חוסם עד שמגיע ערך</td><td>חוזר מיד: zero value עם <code>ok == false</code></td></tr>
<tr><td><code>close(ch)</code></td><td><strong>panic</strong></td><td>תקין, מעיר את כל ה-receivers</td><td><strong>panic</strong></td></tr>
</table>
<ul>
<li><strong>Unbuffered</strong> (<code>make(chan T)</code>) זה מסירה מיד ליד: השליחה מסתיימת רק כש-receiver לוקח. מצוין לסנכרון, ומקור נפוץ ל-leaks כשה-receiver הולך.</li>
<li><strong>Buffered</strong> (<code>make(chan T, n)</code>) מנתק עד <code>n</code> פריטים. Buffer לא פותר צרכן איטי, הוא רק דוחה את הרגע שבו תיחסם. Buffer של 1 מתאים למצב של "תוצאה אחת, ואולי אף אחד לא יחכה לה".</li>
<li><strong>כללי סגירה</strong>: רק השולח סוגר, ורק כששום שולח אחר כבר לא יכול לשלוח. כשיש כמה שולחים, סוגרים אחרי <code>wg.Wait()</code> ב-goroutine נפרד. מי שמקבל לא סוגר אף פעם. סגירה היא broadcast של "אין יותר ערכים", לא שחרור משאב: channel שלא נסגר נאסף ב-GC כמו כל אובייקט.</li>
<li><strong>nil channels בתוך select</strong>: case על nil channel אף פעם לא מוכן. להציב nil במשתנה של ה-channel זו הדרך האידיומטית לכבות case אחרי שה-channel שלו נסגר:</li>
</ul>
<pre>${CHAN_CODE}</pre>
<p><strong>Timeouts</strong>: עדיף deadline של context על פני <code>time.After</code>, כי ה-deadline עובר לכל מה שמתחת. ושים לב ל-leak הכי נפוץ ב-code review של Go:</p>
<pre>${TIMEOUT_CODE}</pre>
<p>כשה-timeout מנצח, אף אחד כבר לא קורא מ-<code>ch</code>. ה-goroutine שעובד תקוע לנצח על השליחה ומחזיק את התשובה וכל מה שהיא מצביעה עליו. Buffer של 1 מאפשר לו לשלוח ולצאת.</p>`
      }
    },
    {
      h: { en: "context: cancellation and deadlines across call chains", he: "context: ביטול ו-deadlines לאורך שרשרת הקריאות" },
      body: {
        en: `<pre>${CTX_CODE}</pre>
<ul>
<li><strong>A tree</strong>: every <code>WithCancel</code>/<code>WithTimeout</code>/<code>WithDeadline</code> creates a child. Cancelling a parent cancels all children; a child can only shorten the deadline, never extend it.</li>
<li><strong>Propagation</strong>: pass <code>ctx</code> as the first parameter of every function that does I/O or may block. <code>http.NewRequestWithContext</code>, <code>database/sql</code> (<code>QueryContext</code>), gRPC (which sends the remaining time as the <code>grpc-timeout</code> header) and client-go all stop when it's done. That's how a 3s budget at the edge becomes 2.4s at the third hop instead of a fresh 30s per hop.</li>
<li><strong>Always call cancel</strong>, usually with <code>defer</code>. Otherwise the timer and the child stay alive until the parent ends; <code>go vet</code> flags a discarded cancel func (the <code>lostcancel</code> check).</li>
<li><strong>Long loops check it</strong>: <code>if err := ctx.Err(); err != nil { return err }</code> or a <code>case &lt;-ctx.Done()</code> in select. Context is cooperative: nothing kills a goroutine for you.</li>
<li><strong>Useful newer APIs</strong>: <code>context.WithCancelCause</code> + <code>context.Cause</code> (1.20) to know <em>why</em> it was cancelled; <code>WithTimeoutCause</code>, <code>WithoutCancel</code> (for an audit write that must finish after the request is gone) and <code>AfterFunc</code> (1.21); <code>t.Context()</code> in tests (1.24).</li>
<li><strong>Don'ts</strong>: don't store a context in a struct, don't pass <code>nil</code> (use <code>context.TODO()</code>), and use context values only for request-scoped data (trace IDs), never for optional parameters.</li>
</ul>`,
        he: `<pre>${CTX_CODE}</pre>
<ul>
<li><strong>עץ</strong>: כל <code>WithCancel</code>, <code>WithTimeout</code> או <code>WithDeadline</code> יוצר ילד. ביטול של הורה מבטל את כל הילדים, וילד יכול רק לקצר את ה-deadline, אף פעם לא להאריך.</li>
<li><strong>Propagation</strong>: מעבירים <code>ctx</code> כפרמטר ראשון לכל פונקציה שעושה I/O או עלולה להיחסם. <code>http.NewRequestWithContext</code>, <code>database/sql</code> (<code>QueryContext</code>), gRPC (ששולח את הזמן שנשאר ב-header בשם <code>grpc-timeout</code>) ו-client-go, כולם עוצרים כשהוא נגמר. ככה תקציב של 3 שניות בכניסה הופך ל-2.4 שניות ב-hop השלישי, במקום 30 שניות חדשות בכל hop.</li>
<li><strong>תמיד לקרוא ל-cancel</strong>, בדרך כלל עם <code>defer</code>. אחרת ה-timer והילד נשארים בחיים עד שההורה נגמר. ה-check של <code>go vet</code> בשם <code>lostcancel</code> תופס cancel שנזרק.</li>
<li><strong>לולאות ארוכות בודקות אותו</strong>: <code>if err := ctx.Err(); err != nil { return err }</code> או <code>case &lt;-ctx.Done()</code> בתוך select. Context הוא שיתופי: שום דבר לא הורג goroutine בשבילך.</li>
<li><strong>APIs חדשים ושימושיים</strong>: <code>context.WithCancelCause</code> יחד עם <code>context.Cause</code> (1.20) כדי לדעת <em>למה</em> בוטל. <code>WithTimeoutCause</code>, <code>WithoutCancel</code> (לכתיבת audit שחייבת להסתיים גם אחרי שהבקשה נעלמה) ו-<code>AfterFunc</code> (1.21). ובטסטים, <code>t.Context()</code> (1.24).</li>
<li><strong>מה לא לעשות</strong>: לא לשמור context בתוך struct, לא להעביר <code>nil</code> (יש <code>context.TODO()</code>), ולהשתמש ב-values של context רק לנתונים של הבקשה (trace IDs), אף פעם לא לפרמטרים אופציונליים.</li>
</ul>`
      }
    },
    {
      h: { en: "Bounded fan-out: errgroup, worker pools and the sync package", he: "Fan-out מוגבל: errgroup, worker pools וחבילת sync" },
      body: {
        en: `<p>Platform tools love fan-out: "run this on 400 clusters", "check 20k images". Unbounded <code>go</code> in a loop opens 400 API connections at once, trips rate limits and exhausts file descriptors. Bound it.</p>
<pre>${ERRGROUP_CODE}</pre>
<p><code>SetLimit</code> makes <code>g.Go</code> block when the limit is reached, which is natural backpressure. <code>g.TryGo</code> returns false instead of blocking. Don't change the limit while goroutines are running. If you need every error rather than the first, collect them into a slice under a mutex and <code>errors.Join</code> them.</p>
<p>When work arrives as a stream rather than a slice, use a classic worker pool:</p>
<pre>${POOL_CODE}</pre>
<table>
<tr><th>Primitive</th><th>Use it for</th><th>Gotcha</th></tr>
<tr><td><code>sync.Mutex</code></td><td>Protecting a map or struct shared across goroutines</td><td>Never copy it after first use; keep critical sections free of I/O</td></tr>
<tr><td><code>sync.RWMutex</code></td><td>Read-heavy data with non-trivial read sections</td><td>Slower than Mutex for tiny sections; a recursive <code>RLock</code> while a writer waits deadlocks</td></tr>
<tr><td><code>sync.Once</code> / <code>OnceValue</code> (1.21)</td><td>Lazy init of a client or a parsed config</td><td>If the init function panics, Once still counts it as done</td></tr>
<tr><td><code>sync.WaitGroup</code></td><td>Waiting for N goroutines</td><td><code>Add</code> before <code>go</code>, or use <code>wg.Go</code> (1.25)</td></tr>
<tr><td><code>sync/atomic</code></td><td>Counters, flags, config pointer swaps</td><td>See <code>atomics-optimistic-concurrency</code></td></tr>
</table>
<blockquote>⚠️ Production tip: "share memory by communicating" is a guideline, not a law. A mutex around a map is simpler and faster than a goroutine that owns the map and serves requests over channels. Use channels for ownership transfer and signalling, mutexes for shared state.</blockquote>`,
        he: `<p>כלי פלטפורמה אוהבים fan-out: "תריץ את זה על 400 clusters", "תבדוק 20k images". <code>go</code> בלי גבול בתוך לולאה פותח 400 חיבורים ל-API בבת אחת, נתקע ב-rate limits ומרוקן את ה-file descriptors. צריך לשים גבול.</p>
<pre>${ERRGROUP_CODE}</pre>
<p><code>SetLimit</code> גורם ל-<code>g.Go</code> להיחסם כשמגיעים לגבול, וזה backpressure טבעי. <code>g.TryGo</code> מחזיר false במקום להיחסם. אל תשנה את הגבול כשיש goroutine-ים שרצים. אם אתה צריך את כל השגיאות ולא רק את הראשונה, אסוף אותן ל-slice מאחורי mutex וחבר אותן עם <code>errors.Join</code>.</p>
<p>כשהעבודה מגיעה כזרם ולא כ-slice, משתמשים ב-worker pool קלאסי:</p>
<pre>${POOL_CODE}</pre>
<table>
<tr><th>Primitive</th><th>מתי משתמשים</th><th>מלכודת</th></tr>
<tr><td><code>sync.Mutex</code></td><td>הגנה על map או struct שמשותף בין goroutine-ים</td><td>אסור להעתיק אחרי שימוש ראשון; בלי I/O בתוך ה-critical section</td></tr>
<tr><td><code>sync.RWMutex</code></td><td>נתונים שרובם קריאה, עם קטעי קריאה לא טריוויאליים</td><td>איטי מ-Mutex בקטעים זעירים; <code>RLock</code> רקורסיבי כשיש writer שמחכה זה deadlock</td></tr>
<tr><td><code>sync.Once</code> / <code>OnceValue</code> (1.21)</td><td>אתחול עצל של client או של config מפורסר</td><td>אם פונקציית האתחול עושה panic, ה-Once עדיין נחשב כבוצע</td></tr>
<tr><td><code>sync.WaitGroup</code></td><td>המתנה ל-N goroutine-ים</td><td><code>Add</code> לפני <code>go</code>, או <code>wg.Go</code> (1.25)</td></tr>
<tr><td><code>sync/atomic</code></td><td>מונים, דגלים, החלפת pointer של config</td><td>ראה <code>atomics-optimistic-concurrency</code></td></tr>
</table>
<blockquote>⚠️ Production tip: "share memory by communicating" זה קו מנחה, לא חוק. Mutex סביב map פשוט ומהיר יותר מ-goroutine שמחזיק את ה-map ומשרת בקשות דרך channels. Channels מתאימים להעברת בעלות ולאיתות, mutexes מתאימים ל-state משותף.</blockquote>`
      }
    },
    {
      h: { en: "Finding leaks and races before production does", he: "למצוא leaks ו-races לפני ש-production ימצא אותם" },
      body: {
        en: `<p>A goroutine leak looks like a slow memory leak: <code>go_goroutines</code> (from the Prometheus Go collector) climbs in a staircase and never comes back down, and memory follows. Find where they're stuck:</p>
<pre>${LEAK_CODE}</pre>
<p>The <code>debug=1</code> view groups identical stacks with a count, so the leak is the line with 47,990 goroutines. <code>debug=2</code> prints every goroutine with its wait reason and duration (<code>[chan send, 214 minutes]</code>), and <code>go tool pprof -top</code> works on the same endpoint. In tests, <code>goleak</code> fails the run if anything is still alive. Go 1.26 adds an experimental <code>goroutineleak</code> profile that reports goroutines blocked on a channel or lock that no runnable goroutine can still reach; it's planned to be on by default in 1.27.</p>
<p><strong>The race detector</strong> instruments every memory access and reports two goroutines touching the same address without a happens-before edge:</p>
<pre>${RACE_CODE}</pre>
<p>It only finds races on code paths that actually run, so pair it with tests that really run things concurrently. It costs roughly 5-10x CPU and memory: run it in CI and in a canary or soak build, not in your production binary. A data race in Go is undefined behaviour: a racy map write can crash the whole process with <code>fatal error: concurrent map writes</code>, which <code>recover</code> can't catch.</p>
<pre>${SYNCTEST_CODE}</pre>`,
        he: `<p>Goroutine leak נראה כמו memory leak איטי: <code>go_goroutines</code> (מה-Go collector של Prometheus) עולה במדרגות ולא יורד אף פעם, והזיכרון בא אחריו. ככה מוצאים איפה הם תקועים:</p>
<pre>${LEAK_CODE}</pre>
<p>התצוגה של <code>debug=1</code> מקבצת stacks זהים עם מונה, אז ה-leak הוא השורה עם 47,990 goroutine-ים. <code>debug=2</code> מדפיס כל goroutine עם סיבת ההמתנה ומשך הזמן (<code>[chan send, 214 minutes]</code>), ו-<code>go tool pprof -top</code> עובד על אותו endpoint. בטסטים, <code>goleak</code> מכשיל את הריצה אם משהו עדיין חי. ב-Go 1.26 נוסף profile ניסיוני בשם <code>goroutineleak</code> שמדווח על goroutine-ים שחסומים על channel או lock שאף goroutine רץ כבר לא יכול להגיע אליו. התוכנית היא להפעיל אותו כברירת מחדל ב-1.27.</p>
<p><strong>ה-race detector</strong> מכשיר כל גישה לזיכרון ומדווח כששני goroutine-ים נוגעים באותה כתובת בלי יחס happens-before ביניהם:</p>
<pre>${RACE_CODE}</pre>
<p>הוא מוצא races רק במסלולי קוד שבאמת רצו, אז צריך טסטים שבאמת מריצים דברים במקביל. הוא עולה בערך פי 5 עד 10 ב-CPU ובזיכרון: מריצים אותו ב-CI וב-build של canary או soak, לא בבינארי של production. Data race ב-Go הוא undefined behaviour: כתיבה מקבילה ל-map יכולה להפיל את כל התהליך עם <code>fatal error: concurrent map writes</code>, ו-<code>recover</code> לא תופס את זה.</p>
<pre>${SYNCTEST_CODE}</pre>`
      }
    },
    {
      h: { en: "The bugs every Go code review catches", he: "הבאגים שכל code review של Go תופס" },
      body: {
        en: `<pre>${BUGS_CODE}</pre>
<ol>
<li><strong>Loop variable capture</strong>: fixed in Go 1.22, where each iteration gets a fresh variable. The new semantics depend on the <code>go</code> line in <code>go.mod</code>, not on the compiler version, so an old module built with a new toolchain still has the bug.</li>
<li><strong>Send on a closed channel</strong>: the fix is ownership, not <code>recover</code>. One owner closes after every sender is done (<code>wg.Wait()</code> then <code>close</code>).</li>
<li><strong>Forgetting cancel</strong>: leaks a timer and the child context until the parent ends. For a long-lived parent (<code>context.Background()</code> in a daemon), that's forever.</li>
<li><strong><code>wg.Add</code> inside the goroutine</strong>: a race between <code>Add</code> and <code>Wait</code>. <code>wg.Go</code> removes the whole class of bug.</li>
<li><strong>Copying a mutex</strong>: a value receiver locks a copy, so nothing is protected. <code>go vet</code> (copylocks) catches it.</li>
</ol>
<blockquote>💡 Real world: before Go 1.23, <code>time.After</code> inside a hot <code>for</code>/<code>select</code> loop allocated a timer that wasn't collected until it fired, a classic memory spike in event loops. Since 1.23 unreferenced timers are collected immediately, but a single <code>time.NewTimer</code> reused with <code>Reset</code> is still the clearer pattern.</blockquote>`,
        he: `<pre>${BUGS_CODE}</pre>
<ol>
<li><strong>Loop variable capture</strong>: תוקן ב-Go 1.22, שם כל איטרציה מקבלת משתנה חדש. ההתנהגות החדשה תלויה בשורת ה-<code>go</code> בקובץ <code>go.mod</code>, לא בגרסת הקומפיילר. כלומר module ישן שנבנה עם toolchain חדש עדיין מכיל את הבאג.</li>
<li><strong>שליחה ל-channel סגור</strong>: התיקון הוא בעלות, לא <code>recover</code>. בעלים אחד סוגר אחרי שכל השולחים סיימו (<code>wg.Wait()</code> ואז <code>close</code>).</li>
<li><strong>לשכוח cancel</strong>: משאיר timer וילד של context בחיים עד שההורה נגמר. כשההורה חי לנצח (<code>context.Background()</code> ב-daemon), זה לנצח.</li>
<li><strong><code>wg.Add</code> בתוך ה-goroutine</strong>: race בין <code>Add</code> ל-<code>Wait</code>. <code>wg.Go</code> מעלים את כל סוג הבאג הזה.</li>
<li><strong>העתקה של mutex</strong>: value receiver נועל עותק, ולכן שום דבר לא מוגן. <code>go vet</code> (copylocks) תופס את זה.</li>
</ol>
<blockquote>💡 Real world: לפני Go 1.23, <code>time.After</code> בתוך לולאת <code>for</code>/<code>select</code> חמה הקצה timer שלא נאסף עד שפקע, קפיצת זיכרון קלאסית ב-event loops. מאז 1.23 timers שאין אליהם הפניה נאספים מיד, אבל <code>time.NewTimer</code> יחיד עם <code>Reset</code> הוא עדיין התבנית הברורה יותר.</blockquote>`
      }
    }
  ],
  diagram: `          global run queue
                 |
   P0 [G G G]   P1 [G G]   P2 [ ]  <-- steals half of P0's queue
    |            |            |
    M0           M1           M2        (OS threads; GOMAXPROCS = number of Ps)
    |            |
  running G   running G
                                  netpoller (epoll): G G G G ... parked on sockets, no thread held
  blocking syscall on M3 -> sysmon hands its P to another M`,
  handsOn: [
    { cmd: "go test -race -count=1 ./...", what: { en: "Run the whole test suite under the race detector; -count=1 bypasses the test cache.", he: "להריץ את כל הטסטים תחת ה-race detector. ה-flag של count=1 עוקף את ה-cache של הטסטים." } },
    { cmd: "curl -s 'localhost:6060/debug/pprof/goroutine?debug=1' | head -40", what: { en: "Group live goroutines by stack: the biggest count is usually the leak.", he: "לקבץ את ה-goroutine-ים החיים לפי stack. המונה הכי גדול הוא בדרך כלל ה-leak." } },
    { cmd: "go tool pprof -http=:8081 http://localhost:6060/debug/pprof/goroutine", what: { en: "Open the goroutine profile as a flame graph in the browser.", he: "לפתוח את ה-profile של ה-goroutine-ים כ-flame graph בדפדפן." } },
    { cmd: "GODEBUG=schedtrace=1000 ./fleet-sync 2>&1 | head", what: { en: "Print the scheduler state every second: Ps, threads, global and per-P run queue lengths.", he: "להדפיס את מצב ה-scheduler כל שנייה: P-ים, threads, ואורך התור הגלובלי ושל כל P." } },
    { cmd: "go vet ./...", what: { en: "Catches lostcancel, copylocks and other concurrency mistakes statically, before a test even runs.", he: "תופס סטטית lostcancel, copylocks וטעויות concurrency נוספות, עוד לפני שטסט רץ." } }
  ],
  mnemonic: {
    en: "Every goroutine needs an OWNER: who starts it, who Cancels it (context), who Bounds it (SetLimit), who Waits for it, and who Closes its channel.",
    he: "לכל goroutine צריך בעלים: מי מפעיל, מי מבטל (context), מי מגביל (SetLimit), מי מחכה, ומי סוגר את ה-channel."
  },
  pitfalls: [
    { en: "Returning on timeout while a worker still tries to send on an unbuffered channel: one leaked goroutine per timed-out request, which turns into an OOM a few days later. Use a buffer of 1 or select on ctx.Done() in the sender.", he: "לחזור ב-timeout כש-worker עדיין מנסה לשלוח ל-channel בלי buffer: goroutine אחד דולף על כל בקשה שעשתה timeout, וכמה ימים אחר כך זה OOM. צריך buffer של 1, או select על ctx.Done() אצל השולח." },
    { en: "Unbounded fan-out (a bare go inside a loop over thousands of items): it overwhelms the API server or the database and triggers 429s, exactly when you run the tool during an incident. Use errgroup.SetLimit or a fixed pool.", he: "Fan-out בלי גבול (go חשוף בתוך לולאה על אלפי פריטים): מציף את ה-API server או את ה-database ומקפיץ 429, בדיוק כשמריצים את הכלי באמצע תקלה. צריך errgroup.SetLimit או pool בגודל קבוע." },
    { en: "Closing a channel from the receiver side, or from one of several senders: the next send panics. Ownership rule: the single owner closes, after all senders are done.", he: "לסגור channel מצד ה-receiver, או מאחד מכמה שולחים: השליחה הבאה עושה panic. כלל הבעלות: בעלים יחיד סוגר, אחרי שכל השולחים סיימו." },
    { en: "Trusting a green CI without -race: the race detector only runs when asked, and a racy map write in production is a fatal error that recover can't catch.", he: "לסמוך על CI ירוק בלי -race: ה-race detector רץ רק כשמבקשים, וכתיבה מקבילה ל-map ב-production היא fatal error ש-recover לא תופס." }
  ],
  interview: [
    {
      q: { en: "Why can a Go service run 100k goroutines when a Java service with 100k platform threads would fall over?", he: "למה שירות Go יכול להריץ 100k goroutine-ים, כששירות Java עם 100k platform threads היה קורס?" },
      a: { en: "Goroutines are user-space tasks scheduled by the Go runtime onto GOMAXPROCS Ps and a small pool of OS threads. They start at ~2 KiB of growable stack, switch without a syscall, and when they wait on the network they're parked on the netpoller (epoll) and hold no thread at all. Only blocking syscalls and cgo pin a thread, and sysmon then hands the P to another M. 100k OS threads each need a kernel task and a reserved stack, every switch goes through the kernel, and you hit pids.max or Go's own 10,000-thread limit long before. Java's virtual threads apply the same idea on the JVM.", he: "Goroutine-ים הם משימות ב-user space שה-runtime של Go מתזמן על GOMAXPROCS P-ים ומאגר קטן של threads של מערכת ההפעלה. הם מתחילים ב-~2 KiB של stack שגדל, מתחלפים בלי syscall, וכשהם מחכים לרשת הם מוחנים ב-netpoller (epoll) ולא מחזיקים thread בכלל. רק syscalls חוסמים ו-cgo נועלים thread, ואז sysmon מעביר את ה-P ל-M אחר. 100k threads של מערכת ההפעלה צריכים כל אחד task ב-kernel ו-stack שמור, כל מעבר עובר דרך ה-kernel, ונתקעים ב-pids.max או בגבול של Go עצמו (10,000 threads) הרבה לפני כן. ה-virtual threads של Java מיישמים את אותו רעיון ב-JVM." }
    },
    {
      q: { en: "Your controller's memory grows 50 MB a day and go_goroutines climbs from 300 to 40,000. How do you find and fix it?", he: "הזיכרון של ה-controller שלך גדל ב-50 MB ביום ו-go_goroutines עולה מ-300 ל-40,000. איך מוצאים ומתקנים?" },
      a: { en: "It's a goroutine leak, not a heap leak. Pull /debug/pprof/goroutine?debug=1 (or debug=2 for wait reasons and durations) and find the stack with the huge count, typically 'chan send' or 'chan receive' in a helper that started a goroutine per request or per watch event. Usual causes: a result channel without a buffer after a timeout, a goroutine waiting on a channel nobody closes, or a missing ctx.Done() case. Fix the ownership (buffer of 1, select on ctx.Done(), close by the owner), add goleak.VerifyTestMain to the package tests, and alert on go_goroutines growing over 24h.", he: "זה goroutine leak, לא leak ב-heap. מושכים את /debug/pprof/goroutine?debug=1 (או debug=2 בשביל סיבות המתנה ומשכים) ומחפשים את ה-stack עם המונה העצום. בדרך כלל זה chan send או chan receive בתוך helper שמפעיל goroutine לכל בקשה או לכל watch event. הסיבות הרגילות: channel תוצאה בלי buffer אחרי timeout, goroutine שמחכה ל-channel שאף אחד לא סוגר, או case חסר של ctx.Done(). מתקנים את הבעלות (buffer של 1, select על ctx.Done(), סגירה על ידי הבעלים), מוסיפים goleak.VerifyTestMain לטסטים של ה-package, ושמים alert על עלייה של go_goroutines לאורך 24 שעות." }
    },
    {
      q: { en: "Implement 'run a check against 500 clusters, at most 20 at a time, stop everything on the first fatal error'. What do you use and why?", he: "תממש: להריץ בדיקה מול 500 clusters, לכל היותר 20 במקביל, ולעצור הכל בשגיאה קטלנית הראשונה. במה תשתמש ולמה?" },
      a: { en: "errgroup.WithContext plus g.SetLimit(20). The derived context is cancelled on the first returned error, so in-flight calls that pass ctx to client-go or HTTP abort; g.Go blocks at 20 in flight, giving backpressure without a hand-written semaphore; g.Wait returns the first error. If some errors are non-fatal, record them under a mutex and return nil from that goroutine, then errors.Join the collected ones at the end. Bound the per-cluster call with context.WithTimeout so one hung cluster can't hold a slot forever.", he: "errgroup.WithContext יחד עם g.SetLimit(20). ה-context הנגזר מבוטל בשגיאה הראשונה שחוזרת, כך שקריאות באוויר שמעבירות ctx ל-client-go או ל-HTTP נעצרות. g.Go נחסם כשיש 20 באוויר, וזה backpressure בלי semaphore שכתבת ביד. g.Wait מחזיר את השגיאה הראשונה. אם חלק מהשגיאות לא קטלניות, רושמים אותן מאחורי mutex ומחזירים nil מאותו goroutine, ובסוף מחברים אותן עם errors.Join. בנוסף, מגבילים כל קריאה ל-cluster עם context.WithTimeout כדי ש-cluster אחד תקוע לא יחזיק slot לנצח." }
    }
  ],
  quiz: [
    {
      q: { en: "What happens when you receive from a closed channel?", he: "מה קורה כשמקבלים מ-channel סגור?" },
      options: [
        { en: "It panics", he: "זה עושה panic" },
        { en: "It blocks forever", he: "זה חוסם לנצח" },
        { en: "It returns immediately with the zero value and ok == false (after any buffered values are drained)", he: "זה חוזר מיד עם zero value ו-ok == false (אחרי שהערכים ב-buffer נקראו)" },
        { en: "It returns the last value that was sent", he: "זה מחזיר את הערך האחרון שנשלח" }
      ],
      answer: 2,
      explain: { en: "Receiving from a closed channel never blocks: buffered values come out first, then the zero value with ok == false. That's why 'for v := range ch' ends cleanly. Sending on or closing a closed channel is what panics.", he: "קבלה מ-channel סגור אף פעם לא חוסמת: קודם יוצאים הערכים שב-buffer, ואחר כך zero value עם ok == false. לכן 'for v := range ch' מסתיים בצורה נקייה. שליחה ל-channel סגור, או סגירה שלו שוב, הן מה שעושה panic." }
    },
    {
      q: { en: "Inside a select loop, you set a channel variable to nil after it closes. Why?", he: "בתוך לולאת select, מציבים nil במשתנה של channel אחרי שהוא נסגר. למה?" },
      options: [
        { en: "A case on a nil channel is never ready, so that case is disabled and the loop doesn't spin on the closed channel", he: "Case על nil channel אף פעם לא מוכן, אז ה-case מכובה והלולאה לא מסתובבת על ה-channel הסגור" },
        { en: "It frees the channel's memory immediately", he: "זה משחרר מיד את הזיכרון של ה-channel" },
        { en: "It reopens the channel", he: "זה פותח מחדש את ה-channel" },
        { en: "It makes select panic, which ends the loop", he: "זה גורם ל-select לעשות panic, וזה מסיים את הלולאה" }
      ],
      answer: 0,
      explain: { en: "A closed channel is always ready (it returns zero values), so leaving it in the select makes a busy loop. A nil channel blocks forever, which inside a select simply disables the case.", he: "Channel סגור תמיד מוכן (הוא מחזיר zero values), אז אם משאירים אותו ב-select מקבלים busy loop. nil channel חוסם לנצח, ובתוך select זה פשוט מכבה את ה-case." }
    },
    {
      q: { en: "A goroutine reading from a TCP socket is waiting for data. What is its OS thread doing?", he: "Goroutine שקורא מ-socket של TCP מחכה לנתונים. מה ה-thread של מערכת ההפעלה שלו עושה?" },
      options: [
        { en: "Blocked in read() until data arrives", he: "חסום ב-read() עד שמגיעים נתונים" },
        { en: "Spinning in a busy loop polling the socket", he: "מסתובב ב-busy loop ובודק את ה-socket" },
        { en: "Terminated; a new thread is created when data arrives", he: "הסתיים; thread חדש נוצר כשמגיעים נתונים" },
        { en: "Running other goroutines: the waiting goroutine is parked on the netpoller (epoll) and woken when the fd is ready", he: "מריץ goroutine-ים אחרים: ה-goroutine שמחכה מוחנה ב-netpoller (epoll) ומתעורר כשה-fd מוכן" }
      ],
      answer: 3,
      explain: { en: "Go sockets are non-blocking under the hood. The runtime registers the fd with epoll/kqueue/IOCP, parks the goroutine and reuses the thread. Blocking file syscalls and cgo are different: they do hold the thread.", he: "מתחת למכסה ה-sockets ב-Go הם non-blocking. ה-runtime רושם את ה-fd ב-epoll, kqueue או IOCP, מחנה את ה-goroutine ומשתמש ב-thread לעבודה אחרת. Syscalls חוסמים של קבצים ו-cgo שונים: הם כן מחזיקים את ה-thread." }
    },
    {
      q: { en: "A module's go.mod says 'go 1.21' and it's built with Go 1.26. A loop starts 'go func() { use(c) }()' for each element c. What happens?", he: "ב-go.mod של module כתוב 'go 1.21' והוא נבנה עם Go 1.26. לולאה מפעילה 'go func() { use(c) }()' לכל איבר c. מה קורה?" },
      options: [
        { en: "Each goroutine gets its own c, because the compiler is 1.26", he: "כל goroutine מקבל c משלו, כי הקומפיילר הוא 1.26" },
        { en: "The old shared-variable semantics apply, so goroutines may all see the same (last) c", he: "חלה ההתנהגות הישנה של משתנה משותף, אז ייתכן שכל ה-goroutine-ים יראו את אותו c (האחרון)" },
        { en: "It doesn't compile", he: "זה לא מתקמפל" },
        { en: "It panics at runtime", he: "זה עושה panic בזמן ריצה" }
      ],
      answer: 1,
      explain: { en: "Per-iteration loop variables are gated by the language version in go.mod (1.22+), not the toolchain, so old modules keep their old behaviour. Bump the go directive, or pass c as a parameter.", he: "משתני לולאה לכל איטרציה תלויים בגרסת השפה ב-go.mod (1.22 ומעלה), לא ב-toolchain, ולכן modules ישנים שומרים על ההתנהגות הישנה. צריך להעלות את שורת ה-go, או להעביר את c כפרמטר." }
    }
  ],
  playground: "queue",
  related: ["pr-concurrency-parallelism", "pr-race-deadlock", "pr-async-await", "pr-event-loop", "jvm-dotnet-go-web", "runtime-threads-in-containers", "atomics-optimistic-concurrency", "go-platform-toolbox", "obs-profiling-synthetics"]
});

/* ------------------------------------------------------------------ */
/* go-platform-toolbox: code                                           */
/* ------------------------------------------------------------------ */
const COBRA_CODE = `func main() {
	// Ctrl-C / SIGTERM cancels ctx, which every subcommand passes down.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := newRootCmd().ExecuteContext(ctx); err != nil {
		os.Exit(1) // cobra already printed the error
	}
}

func newRootCmd() *cobra.Command {
	v := viper.New()
	root := &amp;cobra.Command{
		Use:           "fleetctl",
		Short:         "Operate the cluster fleet",
		SilenceUsage:  true, // don't print usage on runtime errors
		PersistentPreRunE: func(cmd *cobra.Command, _ []string) error {
			v.SetConfigName("config")                  // config.yaml / .toml / .json
			v.AddConfigPath("$HOME/.config/fleetctl")
			v.SetEnvPrefix("FLEETCTL")                 // FLEETCTL_PARALLEL=32
			v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
			v.AutomaticEnv()
			if err := v.ReadInConfig(); err != nil {
				var nf viper.ConfigFileNotFoundError
				if !errors.As(err, &amp;nf) {
					return err // a broken config file is an error; a missing one isn't
				}
			}
			return v.BindPFlags(cmd.Flags())
		},
	}
	root.PersistentFlags().String("kube-context", "", "kubeconfig context to use")
	root.PersistentFlags().Int("parallel", 8, "clusters to process in parallel")
	root.AddCommand(newUpgradeCmd(v))
	return root
}`;

const CLIENT_CODE = `// Out of cluster: kubeconfig (honours KUBECONFIG and --kube-context). In cluster: rest.InClusterConfig().
rules := clientcmd.NewDefaultClientConfigLoadingRules()
cfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(rules,
	&amp;clientcmd.ConfigOverrides{CurrentContext: v.GetString("kube-context")}).ClientConfig()
if err != nil {
	return err
}
cfg.QPS, cfg.Burst = 50, 100 // client-go defaults are QPS 5, Burst 10
cfg.UserAgent = "fleetctl/" + version

// Typed clientset: compile-time types for built-in resources
cs := kubernetes.NewForConfigOrDie(cfg)
deps, err := cs.AppsV1().Deployments("shop").List(ctx, metav1.ListOptions{LabelSelector: "tier=api"})

// Dynamic client: any resource by GVR, including CRDs you have no Go types for
dyn := dynamic.NewForConfigOrDie(cfg)
gvr := schema.GroupVersionResource{Group: "cert-manager.io", Version: "v1", Resource: "certificates"}
certs, err := dyn.Resource(gvr).Namespace("shop").List(ctx, metav1.ListOptions{})
for _, c := range certs.Items { // c is unstructured.Unstructured
	ready, _, _ := unstructured.NestedSlice(c.Object, "status", "conditions")
	_ = ready
}`;

const INFORMER_CODE = `factory := informers.NewSharedInformerFactoryWithOptions(cs, 10*time.Minute,
	informers.WithNamespace("shop"))
podInf := factory.Core().V1().Pods()

queue := workqueue.NewTypedRateLimitingQueue(
	workqueue.DefaultTypedControllerRateLimiter[string]())
enqueue := func(obj any) {
	// handles DeletedFinalStateUnknown tombstones from missed deletes
	if key, err := cache.DeletionHandlingMetaNamespaceKeyFunc(obj); err == nil {
		queue.Add(key) // a key ("shop/api-7d9f"), not the object
	}
}
if _, err := podInf.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
	AddFunc:    enqueue,
	UpdateFunc: func(_, newObj any) { enqueue(newObj) },
	DeleteFunc: enqueue,
}); err != nil {
	return err
}

factory.Start(ctx.Done()) // one LIST, then one long-lived WATCH per resource type
if !cache.WaitForCacheSync(ctx.Done(), podInf.Informer().HasSynced) {
	return errors.New("cache never synced")
}

// Reads come from the local cache: zero API calls.
lister := podInf.Lister()
pods, err := lister.Pods("shop").List(labels.SelectorFromSet(labels.Set{"app": "api"}))
// Objects are SHARED with the cache: pod.DeepCopy() before you modify anything.`;

const QUEUE_CODE = `func (c *Controller) runWorker(ctx context.Context) {
	for c.processNext(ctx) {
	}
}

func (c *Controller) processNext(ctx context.Context) bool {
	key, shutdown := c.queue.Get() // blocks; a key is never handed to two workers at once
	if shutdown {
		return false
	}
	defer c.queue.Done(key)

	if err := c.sync(ctx, key); err != nil {
		c.queue.AddRateLimited(key) // per-key exponential backoff: 5ms, 10ms, ... up to 1000s
		return true
	}
	c.queue.Forget(key) // success: reset this key's backoff
	return true
}

// start N workers; each exits when the queue shuts down
for range workers {
	go wait.UntilWithContext(ctx, c.runWorker, time.Second)
}
&lt;-ctx.Done()
c.queue.ShutDown()`;

const RECONCILE_CODE = `const cleanupFinalizer = "ops.example.com/remote-snapshots"

type BackupReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=ops.example.com,resources=databasebackups;databasebackups/status;databasebackups/finalizers,verbs=get;list;watch;update;patch
// +kubebuilder:rbac:groups=batch,resources=cronjobs,verbs=get;list;watch;create;update;patch;delete

func (r *BackupReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx) // already carries the object's name and namespace

	var b opsv1.DatabaseBackup
	if err := r.Get(ctx, req.NamespacedName, &amp;b); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err) // deleted: nothing to do
	}

	// 1) Deletion: clean up what Kubernetes can't see, then release the object.
	if !b.DeletionTimestamp.IsZero() {
		if controllerutil.ContainsFinalizer(&amp;b, cleanupFinalizer) {
			if err := r.deleteRemoteSnapshots(ctx, &amp;b); err != nil {
				return ctrl.Result{}, err // returned error = requeue with backoff
			}
			controllerutil.RemoveFinalizer(&amp;b, cleanupFinalizer)
			return ctrl.Result{}, r.Update(ctx, &amp;b)
		}
		return ctrl.Result{}, nil
	}
	if controllerutil.AddFinalizer(&amp;b, cleanupFinalizer) { // true only if it was missing
		if err := r.Update(ctx, &amp;b); err != nil {
			return ctrl.Result{}, err
		}
	}

	// 2) Desired state, idempotently: same input, same CronJob, however often this runs.
	cj := &amp;batchv1.CronJob{ObjectMeta: metav1.ObjectMeta{Name: b.Name + "-backup", Namespace: b.Namespace}}
	op, err := controllerutil.CreateOrUpdate(ctx, r.Client, cj, func() error {
		cj.Spec.Schedule = b.Spec.Schedule
		cj.Spec.ConcurrencyPolicy = batchv1.ForbidConcurrent
		cj.Spec.JobTemplate.Spec.Template.Spec = backupPodSpec(&amp;b)
		// owner reference: GC deletes the CronJob with the backup, and Owns() below
		// maps CronJob events back to this object
		return controllerutil.SetControllerReference(&amp;b, cj, r.Scheme)
	})
	if err != nil {
		return ctrl.Result{}, err
	}
	log.V(1).Info("cronjob reconciled", "operation", op)

	// 3) Report through the status subresource (spec and status are separate writes).
	b.Status.ObservedGeneration = b.Generation
	meta.SetStatusCondition(&amp;b.Status.Conditions, metav1.Condition{
		Type: "Ready", Status: metav1.ConditionTrue, Reason: "CronJobReconciled",
		ObservedGeneration: b.Generation,
	})
	if err := r.Status().Update(ctx, &amp;b); err != nil {
		return ctrl.Result{}, err // a 409 Conflict here just means "retry with fresh data"
	}

	// 4) Nothing in the cluster changes when old remote snapshots expire, so poll that part.
	return ctrl.Result{RequeueAfter: 30 * time.Minute}, nil
}

func (r *BackupReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&amp;opsv1.DatabaseBackup{}).
		Owns(&amp;batchv1.CronJob{}).
		WithOptions(controller.Options{MaxConcurrentReconciles: 4}). // default is 1
		Complete(r)
}`;

const MANAGER_CODE = `mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
	Scheme:                  scheme,
	Metrics:                 metricsserver.Options{BindAddress: ":8443", SecureServing: true},
	HealthProbeBindAddress:  ":8081",
	PprofBindAddress:        "127.0.0.1:6060",
	LeaderElection:          true,
	LeaderElectionID:        "backup-operator.ops.example.com", // name of the Lease object
	LeaderElectionReleaseOnCancel: true, // hand over fast on rollout instead of waiting out the lease
})`;

const TEST_CODE = `// Unit level: controller-runtime fake client (an in-memory object tracker)
func TestReconcileCreatesCronJob(t *testing.T) {
	s := runtime.NewScheme()
	_ = clientgoscheme.AddToScheme(s)
	_ = opsv1.AddToScheme(s)
	b := &amp;opsv1.DatabaseBackup{
		ObjectMeta: metav1.ObjectMeta{Name: "pg", Namespace: "db"},
		Spec:       opsv1.DatabaseBackupSpec{Schedule: "0 3 * * *"},
	}
	c := fake.NewClientBuilder().WithScheme(s).WithObjects(b).
		WithStatusSubresource(&amp;opsv1.DatabaseBackup{}).Build()
	r := &amp;BackupReconciler{Client: c, Scheme: s}

	req := ctrl.Request{NamespacedName: types.NamespacedName{Namespace: "db", Name: "pg"}}
	for range 2 { // reconcile twice: the second run must be a no-op (idempotency)
		if _, err := r.Reconcile(t.Context(), req); err != nil {
			t.Fatal(err)
		}
	}
	var cj batchv1.CronJob
	if err := c.Get(t.Context(), types.NamespacedName{Namespace: "db", Name: "pg-backup"}, &amp;cj); err != nil {
		t.Fatal(err)
	}
}

// Integration level: envtest starts a real etcd + kube-apiserver (no kubelet, no controllers)
testEnv := &amp;envtest.Environment{
	CRDDirectoryPaths:     []string{filepath.Join("..", "..", "config", "crd", "bases")},
	ErrorIfCRDPathMissing: true,
}
cfg, err := testEnv.Start()
defer testEnv.Stop()`;

const SHIP_CODE = `# Static, reproducible, small: no libc dependency, no local paths in the binary
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -trimpath \\
  -ldflags="-s -w -X main.version=v1.8.2" -o bin/manager ./cmd/manager

# Dockerfile: build stage + distroless runtime (no shell, no package manager, uid 65532)
FROM golang:1.26 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/manager ./cmd/manager

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/manager /manager
USER 65532:65532
ENTRYPOINT ["/manager"]

# Or skip the Dockerfile: ko builds and pushes a multi-arch image (with an SBOM), no Docker daemon
KO_DOCKER_REPO=ghcr.io/example ko build --bare --platform=linux/amd64,linux/arm64 ./cmd/manager

# CLIs: goreleaser cross-compiles, archives, checksums, signs and publishes from a git tag
goreleaser release --snapshot --clean   # dry run locally
goreleaser release --clean              # in CI on tag v1.8.2`;

/* ------------------------------------------------------------------ */
INFRA.lessons.push({
  id: "go-platform-toolbox",
  track: "architecture",
  order: 71,
  icon: "🧰",
  level: 3,
  minutes: 20,
  title: { en: "The Go Platform Toolbox: CLIs, client-go and Controllers", he: "ארגז הכלים של Go לפלטפורמה: CLIs, client-go ו-controllers" },
  tldr: {
    en: "Platform Go is three shapes of program: a CLI (cobra + viper, with clear config precedence and a cancellable context), a client of the Kubernetes API (client-go: clientsets, dynamic client, and informers + listers + workqueues so you watch instead of poll), and a controller (controller-runtime: an idempotent Reconcile that returns Result{RequeueAfter}, writes status, uses finalizers and owner references, and runs with leader election). Test with fake clients and envtest, ship as a static binary in distroless or with ko and goreleaser.",
    he: "Go של פלטפורמה מגיע בשלוש צורות: CLI (cobra ו-viper, עם סדר עדיפויות ברור לקונפיגורציה ו-context שאפשר לבטל), client של ה-API של Kubernetes (ב-client-go יש clientsets, dynamic client, ו-informers עם listers ו-workqueues כדי לעשות watch במקום polling), ו-controller (ב-controller-runtime זה Reconcile אידמפוטנטי שמחזיר Result{RequeueAfter}, כותב status, משתמש ב-finalizers וב-owner references, ורץ עם leader election). בודקים עם fake clients ו-envtest, ושולחים לייצור כבינארי סטטי ב-distroless או עם ko ו-goreleaser."
  },
  analogy: {
    en: "Polling the API server is phoning the warehouse every ten seconds to ask what's on every shelf. An informer is a subscription: you get the full inventory once, then a message for every change, and you keep your own copy of the shelves. The workqueue is the to-do board where each shelf appears once no matter how many messages mentioned it, and a reconciler is the clerk who looks at the shelf as it is now, not at the message, and fixes whatever differs from the order sheet.",
    he: "Polling ל-API server זה להתקשר למחסן כל עשר שניות ולשאול מה יש על כל מדף. Informer זה מנוי: מקבלים את כל המלאי פעם אחת, אחר כך הודעה על כל שינוי, ומחזיקים עותק משלך של המדפים. ה-workqueue הוא לוח המשימות, שבו כל מדף מופיע פעם אחת לא משנה כמה הודעות הזכירו אותו. וה-reconciler הוא המחסנאי שמסתכל על המדף כמו שהוא עכשיו, לא על ההודעה, ומתקן כל מה ששונה מדף ההזמנה."
  },
  sections: [
    {
      h: { en: "CLIs: cobra, viper and config precedence", he: "CLIs: ‏cobra, viper וסדר העדיפויות של הקונפיגורציה" },
      body: {
        en: `<p><strong>cobra</strong> gives you subcommands (<code>fleetctl upgrade --parallel 16</code>), help, shell completion and POSIX flags via <strong>pflag</strong>. <strong>viper</strong> merges flags, environment variables and config files into one view. For a small tool, pflag alone plus <code>os.Getenv</code> is fine; reach for viper when users need config files and profiles.</p>
<pre>${COBRA_CODE}</pre>
<p><strong>Precedence</strong> (highest wins), the order users expect from kubectl, terraform and most CLIs:</p>
<ol>
<li>a flag the user explicitly set on the command line</li>
<li>environment variable (<code>FLEETCTL_PARALLEL=32</code>)</li>
<li>config file (<code>~/.config/fleetctl/config.yaml</code>)</li>
<li>the flag's default value</li>
</ol>
<p>Viper implements exactly this once flags are bound: a bound flag only overrides when it was <em>changed</em>; otherwise its default sits at the bottom. Read values through <code>v.GetInt("parallel")</code>, not the flag variable, or the env and file layers are silently ignored.</p>
<blockquote>⚠️ Production tip: wire <code>signal.NotifyContext</code> into <code>ExecuteContext</code> and use <code>cmd.Context()</code> in every subcommand. Ctrl-C during a fleet-wide operation should cancel in-flight API calls and print what finished, not kill the process mid-write. Print data to stdout and logs to stderr so <code>fleetctl get ... | jq</code> works.</blockquote>`,
        he: `<p><strong>cobra</strong> נותן subcommands (<code>fleetctl upgrade --parallel 16</code>), help, השלמה אוטומטית ב-shell ו-flags בסגנון POSIX דרך <strong>pflag</strong>. <strong>viper</strong> ממזג flags, משתני סביבה וקבצי config לתצוגה אחת. לכלי קטן מספיקים pflag לבד ו-<code>os.Getenv</code>. כדאי להוסיף את viper כשמשתמשים צריכים קבצי config ופרופילים.</p>
<pre>${COBRA_CODE}</pre>
<p><strong>סדר עדיפויות</strong> (הגבוה מנצח), הסדר שמשתמשים מצפים לו מ-kubectl, מ-terraform ומרוב ה-CLIs:</p>
<ol>
<li>flag שהמשתמש הגדיר במפורש בשורת הפקודה</li>
<li>משתנה סביבה (<code>FLEETCTL_PARALLEL=32</code>)</li>
<li>קובץ config (<code>~/.config/fleetctl/config.yaml</code>)</li>
<li>ערך ברירת המחדל של ה-flag</li>
</ol>
<p>Viper מממש בדיוק את זה אחרי שקושרים את ה-flags: flag קשור דורס רק אם הוא <em>שונה</em>, אחרת ברירת המחדל שלו בתחתית. קוראים ערכים דרך <code>v.GetInt("parallel")</code> ולא דרך המשתנה של ה-flag, אחרת שכבות ה-env והקובץ מתעלמות בשקט.</p>
<blockquote>⚠️ Production tip: חבר את <code>signal.NotifyContext</code> ל-<code>ExecuteContext</code> והשתמש ב-<code>cmd.Context()</code> בכל subcommand. לחיצה על Ctrl-C באמצע פעולה על כל ה-fleet צריכה לבטל את הקריאות ל-API שבאוויר ולהדפיס מה הסתיים, לא להרוג את התהליך באמצע כתיבה. נתונים הולכים ל-stdout ולוגים ל-stderr, כדי ש-<code>fleetctl get ... | jq</code> יעבוד.</blockquote>`
      }
    },
    {
      h: { en: "client-go: clientsets, the dynamic client, and why you never poll", he: "client-go: ‏clientsets, ה-dynamic client, ולמה אף פעם לא עושים polling" },
      body: {
        en: `<pre>${CLIENT_CODE}</pre>
<p>Use the <strong>typed clientset</strong> for built-in resources and your own CRDs with generated types; use the <strong>dynamic client</strong> (or controller-runtime's <code>unstructured</code> support) for tools that must handle arbitrary CRDs. The default QPS 5 / Burst 10 throttles fleet tools: the log line <code>Waited for 1.2s due to client-side throttling, not priority and fairness</code> means your own client is the bottleneck, not the server.</p>
<p>A loop that LISTs 20,000 pods every 10 seconds makes the API server serialize megabytes per call and, without a resourceVersion, reads through to etcd. Multiply by every tool and dashboard and you get API Priority and Fairness rejecting requests (429) for the whole cluster. An <strong>informer</strong> does one LIST and then a WATCH from that resourceVersion, keeping a local, indexed cache that's updated by events:</p>
<pre>${INFORMER_CODE}</pre>
<ul>
<li><strong>Reflector → DeltaFIFO → Indexer</strong>: the reflector lists and watches, deltas go through a FIFO, the indexer is the cache that listers read from. On a broken watch (<code>410 Gone</code>, resourceVersion too old), the reflector re-lists by itself.</li>
<li><strong>Shared informer factory</strong>: ten controllers in one binary asking for pods share <em>one</em> watch and one cache.</li>
<li><strong>Resync period</strong> (10 minutes above) re-delivers every cached object to the update handler from memory. No API call; it's a safety net for missed side effects.</li>
<li><strong>Memory</strong>: you cache everything you watch. Narrow it with namespaces, label or field selectors, or metadata-only informers when you only need names and labels.</li>
</ul>`,
        he: `<pre>${CLIENT_CODE}</pre>
<p>ה-<strong>typed clientset</strong> מתאים ל-resources מובנים ול-CRDs שלך עם types שנוצרו בקוד. ה-<strong>dynamic client</strong> (או התמיכה ב-<code>unstructured</code> של controller-runtime) מתאים לכלים שצריכים לטפל ב-CRDs שרירותיים. ברירת המחדל של QPS 5 ו-Burst 10 חונקת כלי fleet. שורת הלוג <code>Waited for 1.2s due to client-side throttling, not priority and fairness</code> אומרת שה-client שלך הוא צוואר הבקבוק, לא השרת.</p>
<p>לולאה שעושה LIST ל-20,000 Pods כל 10 שניות גורמת ל-API server לעשות serialization של מגה-בייטים בכל קריאה, ובלי resourceVersion היא קוראת עד ל-etcd. תכפיל בכל כלי וכל dashboard, ותקבל API Priority and Fairness שדוחה בקשות (429) לכל ה-cluster. <strong>Informer</strong> עושה LIST אחד ואז WATCH מאותו resourceVersion, ומחזיק cache מקומי עם אינדקסים שמתעדכן מ-events:</p>
<pre>${INFORMER_CODE}</pre>
<ul>
<li><strong>Reflector → DeltaFIFO → Indexer</strong>: ה-reflector עושה list ו-watch, השינויים עוברים דרך FIFO, וה-indexer הוא ה-cache שה-listers קוראים ממנו. כשה-watch נשבר (<code>410 Gone</code>, כלומר resourceVersion ישן מדי), ה-reflector עושה list מחדש לבד.</li>
<li><strong>Shared informer factory</strong>: עשרה controllers באותו בינארי שמבקשים Pods חולקים watch <em>אחד</em> ו-cache אחד.</li>
<li><strong>Resync period</strong> (בדוגמה, 10 דקות) שולח מחדש כל אובייקט מה-cache ל-update handler, מהזיכרון. בלי קריאה ל-API. זו רשת ביטחון ל-side effects שהתפספסו.</li>
<li><strong>זיכרון</strong>: כל מה שעושים לו watch נשמר ב-cache. צמצם עם namespaces, label או field selectors, או informers של metadata בלבד כשצריך רק שמות ו-labels.</li>
</ul>`
      }
    },
    {
      h: { en: "Workqueues: keys, dedup and rate-limited retries", he: "Workqueues: מפתחות, dedup ו-retries עם rate limiting" },
      body: {
        en: `<p>Event handlers must never do the work themselves: they run on the informer's goroutine, and a slow handler stalls every other event. They push a <strong>key</strong> (<code>namespace/name</code>) into a workqueue, and workers pull keys:</p>
<pre>${QUEUE_CODE}</pre>
<ul>
<li><strong>Dedup</strong>: 50 updates to the same object while it waits become one item. You process the latest state, not each event. This is <strong>level-triggered</strong> design: the key says "look at this", the cache says what's true now.</li>
<li><strong>No concurrent processing of a key</strong>: if a key is re-added while a worker holds it, it's parked and re-queued after <code>Done</code>.</li>
<li><strong>Rate limiting</strong>: the default controller rate limiter is the max of a per-item exponential backoff (5ms doubling up to 1000s) and an overall token bucket (10 qps, burst 100). <code>Forget</code> on success resets the item's backoff. Forgetting <code>Forget</code> makes a key that failed once back off longer and longer forever.</li>
<li>Since client-go v0.31, use the generic <code>Typed*</code> constructors; the untyped ones are deprecated.</li>
</ul>
<blockquote>💡 Real world: <code>workqueue_depth</code> rising together with <code>workqueue_queue_duration_seconds</code> means the workers can't keep up (raise concurrency or make sync faster). <code>workqueue_retries_total</code> climbing means a key is failing in a loop: check its error, don't add workers.</blockquote>`,
        he: `<p>Event handlers לעולם לא עושים את העבודה בעצמם: הם רצים על ה-goroutine של ה-informer, ו-handler איטי עוצר את כל שאר ה-events. הם דוחפים <strong>מפתח</strong> (<code>namespace/name</code>) ל-workqueue, ו-workers מושכים מפתחות:</p>
<pre>${QUEUE_CODE}</pre>
<ul>
<li><strong>Dedup</strong>: 50 עדכונים לאותו אובייקט בזמן שהוא מחכה הופכים לפריט אחד. מעבדים את המצב האחרון, לא כל event. זה תכנון <strong>level-triggered</strong>: המפתח אומר "תסתכל על זה", וה-cache אומר מה נכון עכשיו.</li>
<li><strong>אין עיבוד מקבילי של אותו מפתח</strong>: אם מפתח נוסף שוב בזמן ש-worker מחזיק אותו, הוא נשמר בצד ונכנס לתור אחרי <code>Done</code>.</li>
<li><strong>Rate limiting</strong>: ה-rate limiter הדיפולטי של controllers הוא המקסימום בין backoff אקספוננציאלי לכל פריט (מ-5ms, מוכפל עד 1000 שניות) לבין token bucket כללי (10 qps, burst של 100). <code>Forget</code> אחרי הצלחה מאפס את ה-backoff של הפריט. מי ששוכח <code>Forget</code> גורם למפתח שנכשל פעם אחת לחכות יותר ויותר, לנצח.</li>
<li>מאז client-go v0.31 משתמשים ב-constructors הגנריים מסוג <code>Typed*</code>. הישנים, בלי type, מסומנים deprecated.</li>
</ul>
<blockquote>💡 Real world: כש-<code>workqueue_depth</code> עולה יחד עם <code>workqueue_queue_duration_seconds</code>, ה-workers לא עומדים בקצב (מעלים concurrency או מאיצים את ה-sync). כש-<code>workqueue_retries_total</code> מטפס, מפתח נכשל בלולאה: בודקים את השגיאה שלו, לא מוסיפים workers.</blockquote>`
      }
    },
    {
      h: { en: "controller-runtime: a minimal, correct reconciler", he: "controller-runtime: ‏reconciler מינימלי ונכון" },
      body: {
        en: `<p>controller-runtime (what kubebuilder and the Operator SDK generate) wraps all of the above: a cached client, shared informers, a workqueue per controller, and a <code>Reconcile(ctx, req)</code> you implement. The concepts of CRDs and finalizers are in <code>k8s-operators-crds</code>; here is what the Go looks like:</p>
<pre>${RECONCILE_CODE}</pre>
<ul>
<li><strong>Return values</strong>: <code>err != nil</code> → requeue with the rate limiter's backoff. <code>Result{RequeueAfter: d}</code> with nil error → come back after <code>d</code>, for external state the cluster can't tell you about. Return nil and an empty Result when you're converged; changes to watched objects will wake you up.</li>
<li><strong>Idempotent</strong>: Reconcile runs again after crashes, resyncs, leader changes and on your own writes. <code>CreateOrUpdate</code> with deterministic names, no "create and remember an ID in memory", no side effect that isn't safe to repeat.</li>
<li><strong>Status subresource</strong>: <code>r.Status().Update</code> writes only <code>.status</code>; a normal <code>Update</code> ignores status. Set <code>observedGeneration</code> so users can tell whether the status reflects the latest spec.</li>
<li><strong>Owner references</strong>: <code>SetControllerReference</code> makes the garbage collector delete children with the parent, and <code>Owns()</code> maps child events to the parent's key.</li>
<li><strong>Reads are from the cache</strong>: right after your own write, a <code>Get</code> may return the old version. Write with what you have; if a write returns 409 Conflict, return the error and reconcile again with fresh data.</li>
</ul>
<pre>${MANAGER_CODE}</pre>
<p><strong>Leader election</strong> uses a <code>coordination.k8s.io</code> Lease (defaults: 15s lease, 10s renew deadline, 2s retry). Run 2 replicas: one reconciles, the other waits warm. Without it, two replicas reconcile the same objects and fight.</p>`,
        he: `<p>controller-runtime (מה ש-kubebuilder ו-Operator SDK מייצרים) עוטף את כל מה שלמעלה: client עם cache, informers משותפים, workqueue לכל controller, ופונקציית <code>Reconcile(ctx, req)</code> שאתה מממש. המושגים של CRDs ו-finalizers נמצאים ב-<code>k8s-operators-crds</code>. כך זה נראה ב-Go:</p>
<pre>${RECONCILE_CODE}</pre>
<ul>
<li><strong>ערכי החזרה</strong>: כש-<code>err != nil</code> הפריט חוזר לתור עם ה-backoff של ה-rate limiter. <code>Result{RequeueAfter: d}</code> עם error ריק אומר "תחזור אחרי <code>d</code>", בשביל state חיצוני שה-cluster לא יכול לספר לך עליו. כשהגעת להתכנסות, מחזירים nil ו-Result ריק, ושינויים באובייקטים שאתה עוקב אחריהם יעירו אותך.</li>
<li><strong>אידמפוטנטי</strong>: Reconcile רץ שוב אחרי קריסות, resyncs, החלפת leader ובעקבות הכתיבות של עצמך. <code>CreateOrUpdate</code> עם שמות דטרמיניסטיים, בלי "ליצור ולזכור ID בזיכרון", ובלי side effect שלא בטוח לחזור עליו.</li>
<li><strong>Status subresource</strong>: <code>r.Status().Update</code> כותב רק את <code>.status</code>, ו-<code>Update</code> רגיל מתעלם מה-status. תגדיר <code>observedGeneration</code> כדי שמשתמשים יידעו אם ה-status משקף את ה-spec האחרון.</li>
<li><strong>Owner references</strong>: <code>SetControllerReference</code> גורם ל-garbage collector למחוק את הילדים יחד עם ההורה, ו-<code>Owns()</code> ממפה events של ילדים למפתח של ההורה.</li>
<li><strong>קריאות מגיעות מה-cache</strong>: מיד אחרי כתיבה שלך, <code>Get</code> עלול להחזיר את הגרסה הישנה. כותבים עם מה שיש ביד, ואם כתיבה מחזירה 409 Conflict, מחזירים את השגיאה ועושים reconcile שוב עם נתונים טריים.</li>
</ul>
<pre>${MANAGER_CODE}</pre>
<p><strong>Leader election</strong> משתמש ב-Lease של <code>coordination.k8s.io</code> (ברירות מחדל: lease של 15 שניות, renew deadline של 10, retry כל 2). מריצים 2 replicas: אחד עושה reconcile, השני מחכה חם. בלי זה, שני replicas עושים reconcile לאותם אובייקטים ונלחמים.</p>`
      }
    },
    {
      h: { en: "Testing: fake clients and envtest", he: "בדיקות: fake clients ו-envtest" },
      body: {
        en: `<pre>${TEST_CODE}</pre>
<table>
<tr><th>Tool</th><th>What it is</th><th>Good for</th><th>Blind spot</th></tr>
<tr><td>client-go <code>fake.NewClientset()</code></td><td>In-memory tracker with reactors</td><td>CLI logic, asserting which API actions were made</td><td>No validation, no defaulting, no admission</td></tr>
<tr><td>controller-runtime <code>fake.NewClientBuilder()</code></td><td>In-memory tracker behind the controller-runtime client</td><td>Fast reconciler unit tests, idempotency (reconcile twice)</td><td>No CRD schema validation, no real watch semantics</td></tr>
<tr><td><code>envtest</code></td><td>Real <code>etcd</code> + <code>kube-apiserver</code> binaries, CRDs installed</td><td>Schema/CEL validation, status subresource, conflicts, running the whole manager</td><td>No kubelet (pods never run) and no kube-controller-manager: <strong>no garbage collection</strong>, so owner references don't cascade</td></tr>
<tr><td>kind cluster</td><td>Full cluster in Docker</td><td>End-to-end: webhooks, RBAC, real pods</td><td>Slow, belongs in CI nightly or per PR, not in unit tests</td></tr>
</table>
<p>Get envtest binaries with <code>setup-envtest</code> and point <code>KUBEBUILDER_ASSETS</code> at them (kubebuilder's Makefile does this). In envtest tests, assert with <code>Eventually</code>-style polling, because the manager reconciles asynchronously; for time-based logic in pure Go code, <code>testing/synctest</code> (Go 1.25) gives you a fake clock.</p>`,
        he: `<pre>${TEST_CODE}</pre>
<table>
<tr><th>כלי</th><th>מה זה</th><th>טוב בשביל</th><th>נקודה עיוורת</th></tr>
<tr><td><code>fake.NewClientset()</code> של client-go</td><td>Tracker בזיכרון עם reactors</td><td>לוגיקה של CLI, לבדוק אילו actions נשלחו ל-API</td><td>אין validation, אין defaulting, אין admission</td></tr>
<tr><td><code>fake.NewClientBuilder()</code> של controller-runtime</td><td>Tracker בזיכרון מאחורי ה-client של controller-runtime</td><td>טסטים מהירים ל-reconciler, אידמפוטנטיות (reconcile פעמיים)</td><td>אין validation של ה-schema של ה-CRD, אין סמנטיקה אמיתית של watch</td></tr>
<tr><td><code>envtest</code></td><td>בינאריים אמיתיים של <code>etcd</code> ו-<code>kube-apiserver</code>, עם ה-CRDs מותקנים</td><td>Validation של schema ו-CEL, status subresource, conflicts, הרצה של ה-manager כולו</td><td>אין kubelet (Pods לא רצים) ואין kube-controller-manager. כלומר <strong>אין garbage collection</strong>, ו-owner references לא מוחקים בשרשרת</td></tr>
<tr><td>cluster של kind</td><td>Cluster מלא בתוך Docker</td><td>End-to-end: webhooks, RBAC, Pods אמיתיים</td><td>איטי. שייך ל-CI לילי או לכל PR, לא לטסטי יחידה</td></tr>
</table>
<p>את הבינאריים של envtest מורידים עם <code>setup-envtest</code> ומפנים אליהם את <code>KUBEBUILDER_ASSETS</code> (ה-Makefile של kubebuilder עושה את זה). בטסטים של envtest בודקים עם polling בסגנון <code>Eventually</code>, כי ה-manager עושה reconcile אסינכרונית. ללוגיקה שתלויה בזמן בקוד Go טהור, <code>testing/synctest</code> (Go 1.25) נותן שעון מזויף.</p>`
      }
    },
    {
      h: { en: "Observability and shipping", he: "Observability ושליחה לייצור" },
      body: {
        en: `<p><strong>Metrics for free</strong>: the manager serves Prometheus metrics, including <code>controller_runtime_reconcile_total{result="error|requeue|requeue_after|success"}</code>, <code>controller_runtime_reconcile_errors_total</code>, <code>controller_runtime_reconcile_time_seconds</code>, <code>controller_runtime_active_workers</code>, the <code>workqueue_*</code> family, <code>rest_client_requests_total</code> by status code, plus Go runtime metrics (<code>go_goroutines</code>, <code>go_memstats_*</code>). Register your own with <code>metrics.Registry.MustRegister</code>. Alert on error rate and queue duration, not on single failures.</p>
<p><strong>Logs</strong>: controller-runtime logs through <code>logr</code> (<code>logf.FromContext(ctx)</code> already carries controller, object and reconcileID). Back it with zap (<code>ctrl.SetLogger(zap.New())</code>) or with the standard library: <code>logr.FromSlogHandler(slog.NewJSONHandler(os.Stderr, nil))</code>. client-go logs through <code>klog/v2</code>; send that to the same logger with <code>klog.SetLogger</code> so you don't get two formats. CLIs can just use <code>log/slog</code>.</p>
<p><strong>Profiling</strong>: <code>PprofBindAddress</code> on the manager (bind to localhost and reach it with <code>kubectl port-forward</code>) gives heap, CPU and goroutine profiles. Big informer caches are the usual memory story: set <code>GOMEMLIMIT</code> to ~90% of the container memory limit so the GC works harder before the OOM killer acts.</p>
<pre>${SHIP_CODE}</pre>
<ul>
<li><strong>Static binary</strong> (<code>CGO_ENABLED=0</code>): runs on <code>scratch</code> or distroless with no glibc mismatch. Note: with cgo off, the pure-Go DNS resolver is used, which is usually what you want in Kubernetes.</li>
<li><strong>distroless static, nonroot</strong>: ~2 MB base, no shell for an attacker (debug with <code>kubectl debug</code> ephemeral containers).</li>
<li><strong>ko</strong>: builds Go images without a Dockerfile, multi-arch, reproducible, with an SBOM by default. Ideal for controllers.</li>
<li><strong>goreleaser</strong>: for CLIs users install: cross-compiles for linux/darwin/windows × amd64/arm64, produces archives, checksums, Homebrew/Scoop/krew manifests, container images and cosign signatures from one git tag.</li>
</ul>`,
        he: `<p><strong>Metrics בחינם</strong>: ה-manager חושף metrics של Prometheus, ביניהם <code>controller_runtime_reconcile_total{result="error|requeue|requeue_after|success"}</code>, <code>controller_runtime_reconcile_errors_total</code>, <code>controller_runtime_reconcile_time_seconds</code>, <code>controller_runtime_active_workers</code>, כל המשפחה של <code>workqueue_*</code>, ו-<code>rest_client_requests_total</code> לפי status code, ובנוסף metrics של ה-runtime של Go (<code>go_goroutines</code>, <code>go_memstats_*</code>). את שלך רושמים עם <code>metrics.Registry.MustRegister</code>. שמים alert על שיעור שגיאות ועל זמן בתור, לא על כישלון בודד.</p>
<p><strong>לוגים</strong>: controller-runtime כותב לוגים דרך <code>logr</code> (ה-<code>logf.FromContext(ctx)</code> כבר כולל controller, אובייקט ו-reconcileID). מאחוריו אפשר לשים zap (<code>ctrl.SetLogger(zap.New())</code>) או את הספרייה הסטנדרטית: <code>logr.FromSlogHandler(slog.NewJSONHandler(os.Stderr, nil))</code>. ‏client-go כותב דרך <code>klog/v2</code>. תפנה גם אותו לאותו logger עם <code>klog.SetLogger</code>, כדי שלא יהיו שני פורמטים. ב-CLIs מספיק <code>log/slog</code>.</p>
<p><strong>Profiling</strong>: ‏<code>PprofBindAddress</code> ב-manager (על localhost, ומגיעים אליו עם <code>kubectl port-forward</code>) נותן profiles של heap, CPU ו-goroutines. Caches גדולים של informers הם סיפור הזיכרון הרגיל: תגדיר <code>GOMEMLIMIT</code> לכ-90% מה-memory limit של הקונטיינר, כדי שה-GC יעבוד קשה יותר לפני שה-OOM killer נכנס לפעולה.</p>
<pre>${SHIP_CODE}</pre>
<ul>
<li><strong>בינארי סטטי</strong> (<code>CGO_ENABLED=0</code>): רץ על <code>scratch</code> או distroless בלי בעיות התאמה של glibc. שים לב: בלי cgo משתמשים ב-DNS resolver שכתוב ב-Go טהור, ובדרך כלל זה מה שרוצים ב-Kubernetes.</li>
<li><strong>distroless static, nonroot</strong>: בסיס של ~2 MB, בלי shell לתוקף (מדבגים עם ephemeral containers דרך <code>kubectl debug</code>).</li>
<li><strong>ko</strong>: בונה images של Go בלי Dockerfile, multi-arch, באופן רפרודוקטיבי, ועם SBOM כברירת מחדל. אידיאלי ל-controllers.</li>
<li><strong>goreleaser</strong>: ל-CLIs שמשתמשים מתקינים. עושה cross-compile ל-linux, darwin ו-windows על amd64 ו-arm64, ומייצר archives, checksums, manifests של Homebrew, Scoop ו-krew, container images וחתימות cosign, הכל מ-git tag אחד.</li>
</ul>`
      }
    }
  ],
  diagram: `                   kube-apiserver
                  LIST once | WATCH stream
                         v
  Reflector -> DeltaFIFO -> Indexer (local cache) <---- Lister.Get / List (no API call)
                         |
                  event handlers  (only: key := ns/name)
                         v
          Workqueue  [dedup | rate limit | one worker per key]
                         v
     Reconcile(ctx, req): read cache -> diff desired vs actual -> write -> Status().Update
                         |
       err -> AddRateLimited   RequeueAfter -> AddAfter   ok -> Forget`,
  handsOn: [
    { cmd: "kubectl get --raw /metrics | grep -E 'apiserver_request_total.*code=\"429\"' | head", what: { en: "Check whether the API server is rejecting clients (APF 429s): the symptom of tools that poll instead of watch.", he: "לבדוק אם ה-API server דוחה clients (429 של APF). זה הסימפטום של כלים שעושים polling במקום watch." } },
    { cmd: "kubectl get lease -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,HOLDER:.spec.holderIdentity", what: { en: "See which replica holds leader election for every controller in the cluster.", he: "לראות איזה replica מחזיק את ה-leader election של כל controller ב-cluster." } },
    { cmd: "kubectl port-forward -n backup-system deploy/backup-operator 8443 6060 && go tool pprof -top http://localhost:6060/debug/pprof/heap", what: { en: "Reach the controller's pprof endpoint and find what holds memory (usually informer caches).", he: "להגיע ל-endpoint של pprof של ה-controller ולמצוא מה מחזיק זיכרון (בדרך כלל ה-caches של ה-informers)." } },
    { cmd: "export KUBEBUILDER_ASSETS=\"$(setup-envtest use 1.34.x -p path)\" && go test ./internal/controller/... -count=1", what: { en: "Download kube-apiserver and etcd for envtest and run the controller integration tests.", he: "להוריד kube-apiserver ו-etcd בשביל envtest ולהריץ את טסטי האינטגרציה של ה-controller." } },
    { cmd: "KO_DOCKER_REPO=ghcr.io/example ko build --bare --platform=linux/amd64,linux/arm64 ./cmd/manager", what: { en: "Build and push a multi-arch distroless-style image of the controller without a Dockerfile.", he: "לבנות ולדחוף image של ה-controller ל-multi-arch, על בסיס מינימלי, בלי Dockerfile." } }
  ],
  mnemonic: {
    en: "Watch, don't poll. Queue keys, not objects. Reconcile state, not events: idempotent, status last, RequeueAfter only for the outside world.",
    he: "Watch, לא polling. מכניסים לתור מפתחות, לא אובייקטים. עושים reconcile למצב, לא ל-events: אידמפוטנטי, status בסוף, ו-RequeueAfter רק בשביל העולם החיצוני."
  },
  pitfalls: [
    { en: "Mutating objects returned by a lister or the controller-runtime cache: they're shared with every other reader, so you silently corrupt the cache. DeepCopy first, then change.", he: "לשנות אובייקטים שחזרו מ-lister או מה-cache של controller-runtime: הם משותפים עם כל שאר הקוראים, וכך משחיתים את ה-cache בשקט. קודם DeepCopy, אחר כך שינוי." },
    { en: "Writing an edge-triggered reconciler ('on create, do X') that relies on seeing every event: events get coalesced, missed during restarts and replayed on resync. Compute desired state from the current object every time.", he: "לכתוב reconciler שתלוי ב-events ('ב-create תעשה X') ומניח שיראה כל event: events מתמזגים, הולכים לאיבוד בזמן restart ומושמעים מחדש ב-resync. מחשבים את המצב הרצוי מהאובייקט הנוכחי בכל פעם." },
    { en: "Adding a finalizer without RBAC on the finalizers subresource, or with cleanup that can fail forever: objects hang in Terminating and namespace deletion blocks. Make cleanup idempotent, bounded and observable.", he: "להוסיף finalizer בלי הרשאת RBAC על ה-subresource של finalizers, או עם ניקוי שיכול להיכשל לנצח: אובייקטים נתקעים ב-Terminating ומחיקת namespace נחסמת. הניקוי צריך להיות אידמפוטנטי, מוגבל בזמן וגלוי ב-metrics." },
    { en: "Leaving client-go at QPS 5 in a fleet CLI, or raising it to 1000 in a controller: the first makes the tool crawl, the second lets one buggy loop hammer the API server. Pick numbers deliberately and rely on server-side APF as the backstop.", he: "להשאיר את client-go על QPS 5 ב-CLI של fleet, או להעלות אותו ל-1000 ב-controller: הראשון גורם לכלי לזחול, השני נותן ללולאה אחת עם באג להפציץ את ה-API server. בוחרים מספרים בכוונה, ו-APF בצד השרת הוא רשת הביטחון." }
  ],
  interview: [
    {
      q: { en: "Walk me through what happens between 'kubectl apply' of a custom resource and your Reconcile function running.", he: "תסביר מה קורה מרגע ה-'kubectl apply' של custom resource ועד שפונקציית ה-Reconcile שלך רצה." },
      a: { en: "The API server validates the object against the CRD schema, runs admission, persists it to etcd and emits a watch event. The controller's reflector, which holds a long-lived WATCH from its last resourceVersion, receives it, pushes a delta through the DeltaFIFO into the indexer (the shared cache) and calls the registered handlers. controller-runtime's handler turns it into a reconcile.Request (namespace/name) and adds it to the controller's rate-limited workqueue, where duplicates collapse. A worker (up to MaxConcurrentReconciles) pops the key and calls Reconcile, which reads the object from the cache, converges child resources, updates status and returns: error → AddRateLimited, RequeueAfter → AddAfter, success → Forget. Only the leader replica runs workers.", he: "ה-API server בודק את האובייקט מול ה-schema של ה-CRD, מריץ admission, שומר אותו ב-etcd ומוציא watch event. ה-reflector של ה-controller, שמחזיק WATCH ארוך מה-resourceVersion האחרון שלו, מקבל אותו, דוחף delta דרך ה-DeltaFIFO אל ה-indexer (ה-cache המשותף) וקורא ל-handlers הרשומים. ה-handler של controller-runtime הופך אותו ל-reconcile.Request (namespace/name) ומוסיף אותו ל-workqueue עם rate limiting של ה-controller, שם כפילויות מתאחדות. Worker (עד MaxConcurrentReconciles) שולף את המפתח וקורא ל-Reconcile, שקורא את האובייקט מה-cache, מביא את משאבי הילד למצב הרצוי, מעדכן status ומחזיר: error הופך ל-AddRateLimited, RequeueAfter ל-AddAfter, והצלחה ל-Forget. רק ה-replica שהוא leader מריץ workers." }
    },
    {
      q: { en: "When should Reconcile return an error, Result{RequeueAfter}, or nothing?", he: "מתי Reconcile צריך להחזיר error, מתי Result{RequeueAfter}, ומתי כלום?" },
      a: { en: "Return an error for transient failures you want retried with exponential backoff (API conflicts, a cloud call failing); it also counts in controller_runtime_reconcile_errors_total. Return RequeueAfter with a nil error when you're healthy but must re-check something the cluster won't notify you about: an external resource still provisioning, a certificate expiry, remote retention. Return an empty Result and nil when converged; watches on the object and its owned children wake you when something changes. Don't use RequeueAfter of a few seconds as a substitute for watching the thing you depend on.", he: "מחזירים error בכשלים זמניים שרוצים לנסות שוב עם backoff אקספוננציאלי (conflicts ב-API, קריאה לענן שנכשלה). זה גם נספר ב-controller_runtime_reconcile_errors_total. מחזירים RequeueAfter עם error ריק כשהכל תקין אבל צריך לבדוק שוב משהו שה-cluster לא יודיע עליו: משאב חיצוני שעדיין מוקם, תוקף של certificate, retention מרוחק. מחזירים Result ריק ו-nil כשהגעת להתכנסות, וה-watches על האובייקט ועל הילדים שלו יעירו אותך כשמשהו ישתנה. לא משתמשים ב-RequeueAfter של כמה שניות כתחליף ל-watch על מה שאתה תלוי בו." }
    },
    {
      q: { en: "Your fleet CLI takes 40 minutes against 300 clusters and logs 'client-side throttling'. What do you change?", he: "ה-CLI שלך ל-fleet לוקח 40 דקות מול 300 clusters ומדפיס 'client-side throttling'. מה תשנה?" },
      a: { en: "First, raise rest.Config QPS/Burst from the 5/10 defaults to something deliberate (say 50/100 per cluster). Second, parallelize across clusters with errgroup.SetLimit, each cluster with its own client and a per-cluster timeout. Third, cut calls: one LIST with a label selector instead of a GET per object, server-side filtering, metadata-only requests or Table output when you need little, and an informer if the tool runs long enough to benefit. Finally, plumb a signal-aware context through cobra so Ctrl-C cancels cleanly and prints partial results.", he: "קודם כל, להעלות את ה-QPS וה-Burst ב-rest.Config מברירות המחדל של 5 ו-10 למספר מכוון (נגיד 50 ו-100 לכל cluster). שנית, להריץ במקביל על פני clusters עם errgroup.SetLimit, לכל cluster client משלו ו-timeout משלו. שלישית, לקצץ קריאות: LIST אחד עם label selector במקום GET לכל אובייקט, סינון בצד השרת, בקשות של metadata בלבד או פלט Table כשצריך מעט, ו-informer אם הכלי רץ מספיק זמן כדי להרוויח מזה. ולבסוף, להעביר דרך cobra context שמגיב ל-signals, כדי ש-Ctrl-C יבטל בצורה נקייה וידפיס תוצאות חלקיות." }
    }
  ],
  quiz: [
    {
      q: { en: "Why do controllers use informers instead of listing resources on a timer?", he: "למה controllers משתמשים ב-informers במקום לעשות list ל-resources לפי טיימר?" },
      options: [
        { en: "Because LIST is not allowed by RBAC", he: "כי RBAC לא מרשה LIST" },
        { en: "One LIST plus a WATCH keeps a local cache current, so reads cost no API calls and the API server isn't flooded", he: "LIST אחד ועוד WATCH שומרים cache מקומי מעודכן, כך שקריאות לא עולות קריאות ל-API וה-API server לא מוצף" },
        { en: "Informers read directly from etcd, bypassing the API server", he: "Informers קוראים ישירות מ-etcd ועוקפים את ה-API server" },
        { en: "Informers guarantee every event is delivered exactly once", he: "Informers מבטיחים שכל event יגיע בדיוק פעם אחת" }
      ],
      answer: 1,
      explain: { en: "Informers go through the API server like any client, and events can be coalesced or replayed, which is why reconcilers must be level-triggered and idempotent.", he: "Informers עוברים דרך ה-API server כמו כל client, ו-events יכולים להתמזג או להישלח שוב. בגלל זה reconcilers חייבים להיות level-triggered ואידמפוטנטיים." }
    },
    {
      q: { en: "A user sets --parallel=4 on the command line, FLEETCTL_PARALLEL=16 in the environment, and parallel: 32 in the config file. With viper and bound flags, what value is used?", he: "משתמש מעביר ‎--parallel=4 בשורת הפקודה, FLEETCTL_PARALLEL=16 בסביבה, ו-parallel: 32 בקובץ ה-config. עם viper ו-flags קשורים, איזה ערך ייבחר?" },
      options: [
        { en: "32, the config file wins", he: "32, קובץ ה-config מנצח" },
        { en: "16, environment always wins", he: "16, משתנה הסביבה תמיד מנצח" },
        { en: "8, the flag's default", he: "8, ברירת המחדל של ה-flag" },
        { en: "4, an explicitly set flag beats env, config and defaults", he: "4, flag שהוגדר במפורש גובר על env, config וברירות מחדל" }
      ],
      answer: 3,
      explain: { en: "Viper's order: explicit Set, then changed flags, env, config file, key/value store, defaults. An unchanged flag only contributes its default at the bottom.", he: "הסדר של viper: Set מפורש, אחר כך flags ששונו, env, קובץ config, key/value store, וברירות מחדל. Flag שלא שונה תורם רק את ברירת המחדל שלו, בתחתית." }
    },
    {
      q: { en: "In an envtest-based test you delete the parent custom resource and wait for its owned CronJob to disappear. It never does. Why?", he: "בטסט מבוסס envtest אתה מוחק את ה-custom resource ההורה ומחכה שה-CronJob שבבעלותו ייעלם. הוא אף פעם לא נעלם. למה?" },
      options: [
        { en: "envtest runs only etcd and kube-apiserver; the garbage collector lives in kube-controller-manager, which isn't running", he: "envtest מריץ רק etcd ו-kube-apiserver. ה-garbage collector נמצא ב-kube-controller-manager, שלא רץ" },
        { en: "Owner references only work across namespaces", he: "Owner references עובדים רק בין namespaces" },
        { en: "CronJobs can't have owner references", he: "ל-CronJobs לא יכולים להיות owner references" },
        { en: "The fake clock of testing/synctest froze the deletion", he: "השעון המזויף של testing/synctest הקפיא את המחיקה" }
      ],
      answer: 0,
      explain: { en: "envtest has no controllers and no kubelet. Assert that the owner reference is set correctly instead, and test cascading deletion in a kind cluster if it matters. (Cross-namespace owner references are actually invalid.)", he: "ב-envtest אין controllers ואין kubelet. במקום זה בודקים שה-owner reference הוגדר נכון, ואם מחיקה בשרשרת חשובה, בודקים אותה ב-cluster של kind. (owner references בין namespaces בכלל לא חוקיים.)" }
    },
    {
      q: { en: "What does the workqueue guarantee that a plain Go channel of events doesn't?", he: "מה ה-workqueue מבטיח ש-channel רגיל של events לא מבטיח?" },
      options: [
        { en: "Events are processed in the exact order they happened", he: "Events מעובדים בדיוק בסדר שבו קרו" },
        { en: "Objects are stored durably across restarts", he: "אובייקטים נשמרים באופן עמיד גם אחרי restart" },
        { en: "Duplicate keys collapse, a key is never processed by two workers at once, and failures retry with per-key backoff", he: "מפתחות כפולים מתאחדים, מפתח לא מעובד אף פעם על ידי שני workers במקביל, וכשלים חוזרים עם backoff לכל מפתח" },
        { en: "Each event is delivered to every worker", he: "כל event נשלח לכל ה-workers" }
      ],
      answer: 2,
      explain: { en: "The queue is in-memory (on restart the initial LIST re-adds everything). Dedup plus the processing/dirty sets give per-key serialization, and the rate limiter gives backoff.", he: "התור יושב בזיכרון (אחרי restart ה-LIST הראשוני מכניס הכל מחדש). ה-dedup יחד עם קבוצות ה-processing וה-dirty נותנים עיבוד סדרתי לכל מפתח, וה-rate limiter נותן backoff." }
    }
  ],
  related: ["go-concurrency", "k8s-operators-crds", "k8s-architecture", "k8s-etcd-apf", "k8s-namespaces-rbac", "container-slim-images", "container-builds-buildkit", "staff-supply-chain", "obs-prometheus-deep", "jvm-dotnet-go-web"]
});

/* ------------------------------------------------------------------ */
/* Glossary                                                            */
/* ------------------------------------------------------------------ */
INFRA.glossary.push(
  { term: "Goroutine", track: "architecture", aliases: ["goroutines"],
    def: { en: "A lightweight task scheduled by the Go runtime, not the kernel: starts with a ~2 KiB growable stack and parks on the netpoller during network I/O, so a process can run hundreds of thousands of them.", he: "משימה קלה שה-runtime של Go מתזמן, לא ה-kernel. מתחילה עם stack של ~2 KiB שגדל, ובזמן I/O של רשת מוחנית ב-netpoller, כך שתהליך יכול להריץ מאות אלפים מהן." },
    lesson: "go-concurrency" },
  { term: "GMP scheduler", track: "architecture", aliases: ["GMP", "G-M-P"],
    def: { en: "Go's runtime scheduler: goroutines (G) run on OS threads (M) that must hold one of GOMAXPROCS processors (P), each with a local run queue, plus work stealing and async preemption.", he: "ה-scheduler של ה-runtime של Go: goroutine-ים (G) רצים על threads של מערכת ההפעלה (M), שחייבים להחזיק אחד מ-GOMAXPROCS processors (P), לכל אחד תור מקומי, ובנוסף work stealing ו-preemption אסינכרוני." },
    lesson: "go-concurrency" },
  { term: "errgroup", track: "architecture",
    def: { en: "golang.org/x/sync/errgroup: runs a group of goroutines, cancels a shared context on the first error, returns it from Wait, and bounds concurrency with SetLimit.", he: "golang.org/x/sync/errgroup: מריץ קבוצת goroutine-ים, מבטל context משותף בשגיאה הראשונה, מחזיר אותה מ-Wait, ומגביל את המקביליות עם SetLimit." },
    lesson: "go-concurrency" },
  { term: "Informer", track: "kubernetes", aliases: ["informers", "SharedInformerFactory", "shared informer"],
    def: { en: "client-go component that LISTs then WATCHes a resource type, keeps an indexed local cache (read via listers) and calls event handlers, so controllers never poll the API server.", he: "רכיב של client-go שעושה LIST ואז WATCH לסוג resource, מחזיק cache מקומי עם אינדקסים (קוראים ממנו דרך listers) וקורא ל-event handlers, כך ש-controllers אף פעם לא עושים polling ל-API server." },
    lesson: "go-platform-toolbox" },
  { term: "Workqueue", track: "kubernetes", aliases: ["workqueues", "rate-limited workqueue"],
    def: { en: "client-go queue of object keys that collapses duplicates, never hands one key to two workers at once, and retries failures with per-key exponential backoff.", he: "תור של מפתחות אובייקטים ב-client-go שמאחד כפילויות, אף פעם לא נותן מפתח אחד לשני workers במקביל, ומנסה שוב כשלים עם backoff אקספוננציאלי לכל מפתח." },
    lesson: "go-platform-toolbox" }
);

})();
