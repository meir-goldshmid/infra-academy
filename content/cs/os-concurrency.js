CQ.unit({
  id: 'os-concurrency',
  order: 14,
  title: 'Operating Systems & Concurrency',
  emoji: '🧵',
  color: '#f97316',
  tagline: 'Processes, schedulers, virtual memory, locks and deadlocks: what your containers are really doing',
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'processes-threads',
      title: 'Processes vs Threads',
      emoji: '🧬',
      steps: [
        { type: 'learn', title: 'Apartments and roommates', html: `
<p>A <b>process</b> is a running program with its own private <b>address space</b>: its own code, heap, globals and open files. Think of it as an apartment. Other processes cannot walk in.</p>
<p>A <b>thread</b> is one line of execution <i>inside</i> a process. Threads are roommates: they share the kitchen (heap, globals, file descriptors), but each has its own <b>stack</b> and its own <b>registers</b> (including the program counter).</p>
<table><tr><th></th><th>Process</th><th>Thread</th></tr>
<tr><td>Memory</td><td>Private address space</td><td>Shared with sibling threads</td></tr>
<tr><td>Crash blast radius</td><td>Just itself</td><td>A segfault kills the whole process</td></tr>
<tr><td>Create cost</td><td>Higher (new page tables)</td><td>Lower</td></tr>
<tr><td>Talk to each other</td><td>IPC: pipes, sockets, shared memory</td><td>Just read the same variable (carefully!)</td></tr></table>
<div class="dev">You already know this: Nginx and Postgres use <b>processes</b> (a worker or backend per connection), so one bad worker cannot corrupt another. A JVM or Go service is one process with many threads, so a single bug can take down everything at once.</div>` },
        { type: 'mcq', q: 'Which of these is NOT shared between threads of the same process?',
          choices: ['The heap', 'Open file descriptors', 'The stack', 'Global variables'], answer: 2,
          explain: 'Each thread gets its own stack (local variables, return addresses) and its own registers. Heap, globals and file descriptors belong to the process and are shared by all its threads.' },
        { type: 'learn', title: 'The PCB, fork and exec', html: `
<p>The kernel tracks every process in a <b>Process Control Block</b> (PCB). In Linux it is <code>struct task_struct</code>: PID, state (running, sleeping...), saved registers, a pointer to the page tables, open files, scheduling info, cgroup membership.</p>
<p>Fun Linux detail: a thread is <i>also</i> a <code>task_struct</code>. The <code>clone()</code> flags decide what is shared (<code>CLONE_VM</code>, <code>CLONE_FILES</code>...). A "thread" is simply a task that shares its parent's memory.</p>
<p>New programs start in two steps:</p>
<ul><li><code>fork()</code> clones the calling process. It returns <b>0 in the child</b> and the <b>child's PID in the parent</b>. Memory is <b>copy-on-write</b>, so it is cheap until someone writes.</li>
<li><code>exec()</code> replaces the current process image with a new program. Same PID, new code.</li></ul>
<pre><code>pid = fork()
if pid == 0:  exec("/bin/ls")      # child becomes ls
else:         waitpid(pid)         # parent waits and reaps</code></pre>
<div class="dev">Redis <code>BGSAVE</code> uses exactly this: <code>fork()</code>, and the child writes the snapshot while the parent keeps serving. Copy-on-write means memory only grows for pages the parent modifies during the save, which is why a write-heavy Redis can briefly need up to 2× RAM.</div>` },
        { type: 'input', q: 'A program runs fork(); fork(); fork(); and then printf("hi\\n"). Assuming every fork succeeds, how many lines of "hi" are printed?', answer: ['8'], placeholder: 'number',
          explain: 'Each fork doubles the number of processes: 1 → 2 → 4 → 8. All 8 reach the printf. With n forks in a row you get 2ⁿ processes, which is also how a "fork bomb" melts a machine (and why pids.max in cgroups exists).' },
        { type: 'order', q: 'Order what happens when you type ls in bash',
          items: ['bash calls fork() and gets a child process', 'The child calls exec("/bin/ls")', 'ls runs, prints, and exits', 'bash\'s wait() reaps the child and shows the prompt again'],
          explain: 'fork, exec, exit, wait. The shell forks first so that exec replaces the child, not the shell itself. That is also why you can run exec ls to replace your shell and lose the session.' },
        { type: 'mcq', q: 'A container\'s ps shows dozens of processes in state Z (zombie). What is the most likely cause?',
          choices: ['The node is out of memory', 'The child processes exited but their parent never called wait() to reap them', 'The processes are stuck in an infinite loop', 'The processes are waiting for disk I/O'], answer: 1,
          explain: 'A zombie has already exited; only its PCB entry remains until the parent reads its exit code with wait(). In containers this often happens when your app runs as PID 1 and spawns children but never reaps them. Fix: run an init like tini (docker run --init, or shareProcessNamespace) or reap children in the app.' },
        { type: 'learn', title: 'The price of a context switch', html: `
<p>A <b>context switch</b> is the kernel pausing one task and resuming another: save registers, pick the next task, load its registers. Between two <i>processes</i> it also switches the page tables, which can invalidate cached address translations (the TLB).</p>
<ul><li><b>Direct cost:</b> roughly 1–5 µs on modern hardware.</li>
<li><b>Indirect cost:</b> the new task finds cold CPU caches and TLB. That can be bigger than the switch itself.</li></ul>
<pre><code>$ vmstat 1
procs ---system---
 r  b   in    cs
 3  0  1200  45000     # cs = context switches per second

$ grep ctxt /proc/1234/status
voluntary_ctxt_switches:     9120   # blocked on I/O or a lock
nonvoluntary_ctxt_switches:  88411  # preempted: time slice ran out</code></pre>
<div class="dev">A huge number of <b>nonvoluntary</b> switches means too many runnable threads fighting for too few CPUs. Classic causes: a thread pool of 500 on a 4-core Pod, or a CPU limit that is too tight.</div>` },
        { type: 'tf', q: 'Switching between two threads of the same process is usually cheaper than switching between two different processes.', answer: true,
          explain: 'Threads share one address space, so the kernel does not need to switch page tables and the TLB entries stay valid. Only registers and the stack pointer change.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'scheduling',
      title: 'CPU Scheduling',
      emoji: '⏱️',
      steps: [
        { type: 'learn', title: 'Who gets the CPU next?', html: `
<p>At any moment, some tasks are <b>running</b>, some are <b>ready</b> (runnable, waiting for a CPU) and some are <b>blocked</b> (waiting for disk, network or a lock). The <b>scheduler</b> picks which ready task runs next.</p>
<p>The two oldest policies:</p>
<ul><li><b>FCFS</b> (First-Come, First-Served): run jobs in arrival order, each to completion. Simple, but one long job makes everyone wait: the <b>convoy effect</b>.</li>
<li><b>SJF</b> (Shortest Job First): run the shortest job first. It gives the <b>minimum average waiting time</b>, but needs to know job lengths in advance and can starve long jobs.</li></ul>
<p>Example: jobs arrive at time 0 in the order A=24, B=3, C=3 (ms).</p>
<table><tr><th>Policy</th><th>Order</th><th>Waits</th><th>Average wait</th></tr>
<tr><td>FCFS</td><td>A, B, C</td><td>0, 24, 27</td><td>17 ms</td></tr>
<tr><td>SJF</td><td>B, C, A</td><td>0, 3, 6</td><td>3 ms</td></tr></table>` },
        { type: 'input', q: 'Jobs arrive at time 0 in the order A=9, B=3, C=3 (ms). Under FCFS, what is the average waiting time in ms?', answer: ['7'], placeholder: 'ms',
          explain: 'A waits 0, B waits 9, C waits 9 + 3 = 12. (0 + 9 + 12) / 3 = 7 ms.' },
        { type: 'input', q: 'Same jobs (A=9, B=3, C=3), now with SJF. What is the average waiting time in ms?', answer: ['3'], placeholder: 'ms',
          explain: 'SJF runs B, C, A. Waits: 0, 3, 6. (0 + 3 + 6) / 3 = 3 ms. Same work, less than half the waiting, just by reordering.' },
        { type: 'learn', title: 'Round robin, priorities and preemption', html: `
<p><b>Round robin</b> gives each ready task a <b>time quantum</b> (say 10 ms). When the quantum expires, a timer interrupt <b>preempts</b> the task and puts it at the back of the queue.</p>
<ul><li>Quantum too small: the CPU spends its time on context switches.</li>
<li>Quantum too large: it degrades into FCFS, and interactive tasks feel laggy.</li></ul>
<p><b>Priority scheduling</b> always runs the highest-priority ready task. The danger is <b>starvation</b>: a steady stream of high-priority work means a low-priority task never runs. The classic fix is <b>aging</b>: the longer a task waits, the higher its priority grows.</p>
<div class="dev">Preemption is why one busy-looping request does not freeze your whole server: the kernel takes the CPU away from it every few milliseconds. Without preemption (cooperative scheduling, like old Node.js event-loop code), one CPU-heavy callback blocks everyone.</div>` },
        { type: 'mcq', q: 'Round robin with a gigantic time quantum (longer than any job) behaves exactly like which policy?',
          choices: ['SJF', 'FCFS', 'Priority scheduling', 'Random scheduling'], answer: 1,
          explain: 'If no job ever uses up its quantum, nobody is preempted. Jobs simply run to completion in queue order, and that is FCFS.' },
        { type: 'tf', q: 'Strict priority scheduling without aging can starve low-priority tasks forever.', answer: true,
          explain: 'As long as higher-priority work keeps arriving, the low-priority task is never the best choice. Aging (or a fair-share scheduler) guarantees it eventually runs.' },
        { type: 'learn', title: 'Linux: CFS, EEVDF and your CPU limits', html: `
<p>Linux's <b>CFS</b> (Completely Fair Scheduler, 2007) tracks a <b>vruntime</b> for every task: how much CPU it has used, weighted by its <code>nice</code> value. Runnable tasks sit in a red-black tree sorted by vruntime, and the task with the <b>smallest vruntime</b> runs next. Each nice step changes the weight by about 1.25×, roughly 10% more or less CPU.</p>
<p>Since kernel 6.6 (2023), <b>EEVDF</b> replaces CFS's pick logic: each task gets a fair share plus a <b>virtual deadline</b>, and the eligible task with the earliest deadline runs. Same fairness idea, better latency for short, bursty tasks.</p>
<p>Kubernetes maps straight onto this:</p>
<ul><li><code>requests.cpu</code> → <code>cpu.weight</code> (relative share under contention).</li>
<li><code>limits.cpu</code> → CFS <b>bandwidth quota</b>: <code>cpu.max = "50000 100000"</code> means 50 ms of CPU per 100 ms period. Use it up early and the cgroup is <b>throttled</b> until the next period.</li></ul>
<pre><code>$ cat /sys/fs/cgroup/cpu.stat
nr_periods 12000
nr_throttled 4100        # throttled in ~34% of periods!
throttled_usec 98000000</code></pre>` },
        { type: 'tf', q: 'In CFS, the runnable task with the smallest vruntime is picked to run next.', answer: true,
          explain: 'Smallest vruntime = the task that has had the least (weighted) CPU so far, so it is the "most owed". That simple rule gives fairness.' },
        { type: 'mcq', q: 'A Pod has limits.cpu: 500m and runs 8 busy threads. Average CPU usage is only 30%, yet p99 latency has spikes of about 80 ms. Most likely cause?',
          choices: ['The node is swapping', 'CFS quota throttling: 8 threads burn the 50 ms quota in about 6 ms, then the cgroup waits for the next 100 ms period', 'Too many page faults', 'A deadlock in the application'], answer: 1,
          explain: 'The quota is CPU time across all threads. 8 threads × ~6 ms = 50 ms, then the whole cgroup is frozen for the rest of the period. Averages look fine, tail latency does not. Check nr_throttled in cpu.stat; fix by raising or removing the limit, or matching the thread count to the limit.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'virtual-memory',
      title: 'Virtual Memory',
      emoji: '🗺️',
      steps: [
        { type: 'learn', title: 'Every process gets its own map', html: `
<p>Every process sees a private, huge, clean <b>virtual address space</b>. Address <code>0x7ffd1000</code> in process A and the same address in process B are different physical bytes. The <b>MMU</b> (Memory Management Unit) in the CPU translates every virtual address to a physical one, on every access.</p>
<p>Memory is managed in fixed-size <b>pages</b>, usually <b>4 KiB</b>. A virtual address splits into two parts:</p>
<div class="formula">virtual address = page number | offset inside the page</div>
<p>With 4 KiB = 2¹² byte pages, the low 12 bits are the offset. Only the page number is translated; the offset is copied as-is.</p>
<div class="dev">This is what gives you isolation (a process cannot even <i>name</i> another process's memory), cheap <code>fork()</code> via copy-on-write, and memory overcommit: Linux happily lets you <code>malloc</code> more than exists, because pages only get real RAM when first touched.</div>` },
        { type: 'input', q: 'Pages are 4 KiB (4096 bytes). How many low bits of a virtual address are the offset within the page?', answer: ['12'], placeholder: 'bits',
          explain: '4096 = 2¹², so 12 bits address every byte inside a page. The remaining high bits are the page number.' },
        { type: 'learn', title: 'Page tables and the TLB', html: `
<p>The translation lives in <b>page tables</b>. On x86-64 they form a 4-level tree (9 bits per level + 12 bits offset = 48-bit addresses). Each <b>page table entry</b> (PTE) holds the physical frame number plus flags: <b>present</b>, writable, user/kernel, no-execute, <b>dirty</b>, <b>accessed</b>.</p>
<p>A full walk costs 4 memory reads per access. Way too slow. So the CPU caches recent translations in the <b>TLB</b> (Translation Lookaside Buffer): a tiny cache with a few thousand entries at most.</p>
<ul><li>TLB hit: translation in about 1 cycle.</li>
<li>TLB miss: page walk, tens to hundreds of cycles.</li></ul>
<p><b>Huge pages</b> (2 MiB or 1 GiB) let one TLB entry cover far more memory.</p>
<div class="dev">This is why Postgres has <code>huge_pages = on</code>, why the JVM has <code>-XX:+UseLargePages</code>, and why Kubernetes lets you request <code>hugepages-2Mi</code> as a resource. A 64 GB buffer pool needs 16 million 4 KiB entries, but only 32,768 entries with 2 MiB pages.</div>` },
        { type: 'input', q: 'With 4 KiB pages (0x1000 bytes), what is the page number of virtual address 0x3A7F? (Answer as a plain number.)', answer: ['3', '0x3'], placeholder: 'page number',
          explain: '0x3A7F / 0x1000 = 3, remainder 0xA7F. In hex this is easy: the low 3 hex digits (12 bits) are the offset, everything above is the page number.' },
        { type: 'mcq', q: 'Why do huge pages speed up a database with a 64 GB buffer pool?',
          choices: ['They make RAM physically faster', 'Each TLB entry covers 2 MiB instead of 4 KiB, so TLB misses and page walks drop dramatically', 'They compress the data', 'They disable virtual memory entirely'], answer: 1,
          explain: 'Same TLB size, 512× more memory covered per entry. Random access over a large working set stops paying a page walk on so many accesses.' },
        { type: 'learn', title: 'Page faults, swapping and thrashing', html: `
<p>When the PTE is not present (or the access is not allowed), the CPU raises a <b>page fault</b> and the kernel takes over:</p>
<ul><li><b>Minor fault:</b> the data is already in RAM, the kernel just maps it. First touch of a new <code>malloc</code> page, a copy-on-write after <code>fork()</code>, a file already in the page cache. Microseconds.</li>
<li><b>Major fault:</b> the data must be read from disk (swap, or a file-backed <code>mmap</code> not in cache). Milliseconds on a disk.</li>
<li><b>Invalid access:</b> no mapping at all, or writing to read-only memory → <code>SIGSEGV</code>.</li></ul>
<p><b>Thrashing</b>: when the combined working set of all processes is bigger than RAM, the system spends its time moving pages to and from swap. CPU looks idle (high <code>iowait</code>), <code>si</code>/<code>so</code> in <code>vmstat</code> are high, and everything crawls.</p>
<div class="dev">Kubernetes historically required swap off, so memory pressure ends differently: when a container exceeds its <code>limits.memory</code>, the kernel's cgroup OOM killer sends <code>SIGKILL</code> and the Pod shows <code>OOMKilled</code>. Exit code = 128 + signal number.</div>` },
        { type: 'mcq', q: 'A process reads a big file through mmap for the first time and the data is not in the page cache. What kind of fault happens?',
          choices: ['Minor page fault', 'Major page fault', 'Segmentation fault', 'Only a TLB miss, no fault'], answer: 1,
          explain: 'The page is valid but its contents are on disk, so the kernel must do I/O before the access can complete. That is a major fault. If the file had already been in the page cache, it would have been a minor fault.' },
        { type: 'tf', q: 'Every page fault means the program has a bug and is about to crash.', answer: false,
          explain: 'Page faults are normal and constant: demand paging, copy-on-write and memory-mapped files all depend on them. Only an invalid access turns into a SIGSEGV.' },
        { type: 'input', q: 'A container is killed by the OOM killer with SIGKILL (signal 9). What exit code does Kubernetes show?', answer: ['137'], placeholder: 'exit code',
          explain: '128 + 9 = 137. When you see exit code 137 and reason OOMKilled, the container crossed its memory limit. 143 (128 + 15) is a SIGTERM, usually a normal shutdown.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'race-conditions',
      title: 'Race Conditions & Critical Sections',
      emoji: '🏁',
      steps: [
        { type: 'learn', title: 'counter++ is three steps, not one', html: `
<p>To the CPU, <code>counter++</code> is three separate instructions:</p>
<pre><code>LOAD  r1, [counter]   ; read
ADD   r1, 1           ; modify
STORE [counter], r1   ; write</code></pre>
<p>Two threads, counter starts at 0, both increment. One possible interleaving:</p>
<table><tr><th>Thread A</th><th>Thread B</th><th>counter</th></tr>
<tr><td>LOAD → 0</td><td></td><td>0</td></tr>
<tr><td></td><td>LOAD → 0</td><td>0</td></tr>
<tr><td>ADD, STORE 1</td><td></td><td>1</td></tr>
<tr><td></td><td>ADD, STORE 1</td><td><b>1</b></td></tr></table>
<p>Two increments, final value 1. One update was simply <b>lost</b>. This is the <b>lost update</b>, the most common race there is.</p>` },
        { type: 'input', q: 'counter starts at 0. 1000 threads each run counter++ exactly once with no locking. What is the SMALLEST possible final value?', answer: ['1'], placeholder: 'value',
          explain: 'If every thread loads 0 before any thread stores, every one of them stores 1. In practice you will usually see something between 1 and 1000, and a different number each run. That non-determinism is the signature of a race.' },
        { type: 'learn', title: 'Races, critical sections, atomicity', html: `
<p>A <b>race condition</b> is a bug where the result depends on the timing of threads or processes. A <b>critical section</b> is the piece of code that touches shared state and must not run in two places at once.</p>
<p>A correct solution needs:</p>
<ul><li><b>Mutual exclusion:</b> at most one thread inside at a time.</li>
<li><b>Progress:</b> if nobody is inside, someone who wants in gets in.</li>
<li><b>Bounded waiting:</b> nobody waits forever.</li></ul>
<p>An operation is <b>atomic</b> if nobody can observe it half-done. CPUs provide atomic instructions such as <code>LOCK XADD</code> (atomic add) and <b>compare-and-swap</b> (CAS): "set x to new only if x still equals old". Go's <code>atomic.AddInt64</code> and Java's <code>AtomicLong</code> are built on these.</p>
<div class="callout">Atomic pieces do not make a sequence atomic. <code>if (!map.contains(k)) map.put(k, v)</code> is racy even if each call is thread-safe: another thread can slip in between the check and the act.</div>` },
        { type: 'tf', q: 'Race conditions cannot happen on a single-core machine, because only one thread runs at a time.', answer: false,
          explain: 'The scheduler can preempt a thread between LOAD and STORE and run another thread on the same core. Interleaving, not parallelism, is what causes races.' },
        { type: 'input', q: 'x = 0. Thread A does x = x + 1 and thread B does x = x * 2, each as load, compute, store, with no locks. How many DIFFERENT final values of x are possible?', answer: ['3', 'three'], placeholder: 'count',
          explain: 'A then B: (0+1)×2 = 2. B then A: 0×2+1 = 1. Both load 0 and A stores last: 1. Both load 0 and B stores last: 0. Possible results: {0, 1, 2}, so 3 different values.' },
        { type: 'mcq', q: 'Which snippet has a TOCTOU (time-of-check to time-of-use) race when two processes run it at once?',
          choices: ['open(path, O_CREAT | O_EXCL)', 'if not os.path.exists(lock): open(lock, "w")', 'atomic.AddInt64(&n, 1)', 'mkdir lockdir (fails if it already exists)'], answer: 1,
          explain: 'Both processes can see "does not exist" before either creates the file, and both believe they own the lock. O_EXCL and mkdir perform the check and the create in a single atomic kernel operation.' },
        { type: 'learn', title: 'Races in infrastructure', html: `
<p>Races are not just a threading thing. Any read-modify-write on shared state can lose updates:</p>
<ul><li><b>Terraform:</b> two pipelines run <code>apply</code> on the same state. That is why backends do <b>state locking</b> (a DynamoDB lock table, or the S3 lockfile).</li>
<li><b>Kubernetes:</b> every object has a <code>resourceVersion</code>. An update sent with an old version is rejected with <code>409 Conflict</code>, and the controller re-reads and retries. That is <b>optimistic concurrency</b>, a CAS at the API level.</li>
<li><b>Databases:</b> do the math inside the database, not in the app.</li></ul>
<pre><code>-- racy: read in app, compute, write back
SELECT qty FROM stock WHERE id = 7;     -- app sees 5
UPDATE stock SET qty = 4 WHERE id = 7;

-- safe: the row is locked during the update
UPDATE stock SET qty = qty - 1 WHERE id = 7 AND qty &gt; 0;</code></pre>
<div class="dev">To catch races in code: <code>go test -race</code>, ThreadSanitizer (<code>-fsanitize=thread</code>) for C/C++. They find races that never show up in your laptop tests and then show up at 3 AM in production.</div>` },
        { type: 'mcq', q: 'Two controllers try to update the same Deployment at the same moment. How does the Kubernetes API server prevent one silently overwriting the other?',
          choices: ['It holds a global mutex over etcd', 'Optimistic concurrency: the update with a stale resourceVersion fails with 409 Conflict', 'It merges both updates automatically', 'Last write always wins and nothing is reported'], answer: 1,
          explain: 'Each update carries the resourceVersion it was based on. If someone else wrote in between, the versions do not match and the API returns 409. The client re-reads and retries. (Server-side apply adds field ownership on top.)' },
        { type: 'tf', q: 'UPDATE stock SET qty = qty - 1 WHERE id = 7 is safe from lost updates under concurrent requests, while reading qty in the app and writing qty - 1 back is not.', answer: true,
          explain: 'The single UPDATE reads and writes the row under a row lock, so concurrent decrements queue up. The app-side version has a gap between SELECT and UPDATE where another request can read the same old value.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'sync-primitives',
      title: 'Mutexes, Semaphores & Friends',
      emoji: '🔒',
      steps: [
        { type: 'learn', title: 'Mutex: one key to the room', html: `
<p>A <b>mutex</b> (mutual exclusion lock) is a key to a room. <code>lock()</code> takes the key, or waits until it is free. <code>unlock()</code> returns it. Only the thread that locked it should unlock it: a mutex has an <b>owner</b>.</p>
<pre><code>mu.Lock()
balance += amount     // critical section
mu.Unlock()</code></pre>
<p>Rules of thumb: keep the critical section <b>short</b>, never do network calls while holding a lock, and always unlock on every path (<code>defer mu.Unlock()</code> in Go, <code>try/finally</code> or <code>with lock:</code> elsewhere).</p>` },
        { type: 'mcq', q: 'Thread A holds a (sleeping) mutex. Thread B calls lock() on it. What happens to B?',
          choices: ['B gets an error and continues', 'B blocks: the kernel puts it to sleep until the mutex is released', 'B and A both enter the critical section', 'B forcibly takes the mutex from A'], answer: 1,
          explain: 'B is moved off the CPU into the mutex\'s wait queue. When A unlocks, B (or another waiter) is woken. That is mutual exclusion with no CPU wasted on waiting.' },
        { type: 'learn', title: 'Semaphores: a counter with a waiting room', html: `
<p>A <b>semaphore</b> is an integer with two atomic operations (Dijkstra, 1965):</p>
<ul><li><code>wait()</code> (P, acquire): if the value is &gt; 0, decrement it and go. If it is 0, block.</li>
<li><code>signal()</code> (V, release): increment, and wake one waiter if there is one.</li></ul>
<p>A <b>counting semaphore</b> starting at N means "N slots available". A <b>binary semaphore</b> only takes 0 or 1. It looks like a mutex, but it has <b>no owner</b>: any thread can signal it. That makes it good for signalling ("data is ready") but weaker as a lock (no priority inheritance, no "unlocked by the wrong thread" checks).</p>
<div class="dev">You already know this: a <b>DB connection pool</b> with <code>max=10</code> is a counting semaphore of 10. Request #11 blocks until someone returns a connection. Kubernetes <code>maxUnavailable</code> in a rolling update and a rate limiter's concurrency cap are the same idea.</div>` },
        { type: 'input', q: 'A counting semaphore starts at 5. Seven threads each call wait() and nobody calls signal(). How many threads are blocked?', answer: ['2', 'two'], placeholder: 'threads',
          explain: 'The first 5 wait() calls bring the value from 5 down to 0 and pass. Threads 6 and 7 find 0 and block.' },
        { type: 'tf', q: 'A binary semaphore and a mutex are identical in every way.', answer: false,
          explain: 'A mutex has an owner: only the locker may unlock, and the OS can use that for priority inheritance and error checking. A binary semaphore has no owner, so any thread may signal it. Same 0/1 shape, different meaning.' },
        { type: 'learn', title: 'Condition variables and monitors', html: `
<p>A mutex protects data. But how do you <b>wait</b> until the data is in a certain state ("queue not empty") without spinning? With a <b>condition variable</b>:</p>
<pre><code>mu.lock()
while queue.empty():
    cv.wait(mu)        # atomically: unlock mu + sleep; re-locks on wakeup
item = queue.pop()
mu.unlock()

# producer side
mu.lock(); queue.push(x); cv.signal(); mu.unlock()</code></pre>
<p>Always re-check the condition in a <b><code>while</code></b>, not an <code>if</code>: wakeups can be spurious, and another consumer may have grabbed the item first.</p>
<p>A <b>monitor</b> bundles a mutex and its condition variables with the data they protect. Java's <code>synchronized</code> + <code>wait()</code>/<code>notify()</code> is a monitor. In Go you would usually use a channel instead, which is exactly this pattern pre-packaged.</p>` },
        { type: 'order', q: 'Order the steps of a correct consumer that waits on a condition variable',
          items: ['lock(mu)', 'while queue is empty: cv.wait(mu)', 'item = queue.pop()', 'unlock(mu)'],
          explain: 'Take the lock, loop on the condition (wait releases the lock while sleeping and re-acquires it on wakeup), do the work while still holding the lock, then release.' },
        { type: 'learn', title: 'Spin or sleep?', html: `
<p>A <b>spinlock</b> waits by looping: <code>while (!CAS(&amp;lock, 0, 1)) {}</code>. No syscall and no context switch, but it burns CPU the whole time it waits.</p>
<p>A <b>sleeping lock</b> (mutex) puts the waiter to sleep, which costs a context switch (microseconds) but frees the CPU.</p>
<table><tr><th>Use a spinlock when</th><th>Use a sleeping lock when</th></tr>
<tr><td>Hold time is tiny (nanoseconds)</td><td>Hold time is long or unknown</td></tr>
<tr><td>Multi-core, holder is running</td><td>The holder might block on I/O</td></tr>
<tr><td>You cannot sleep (kernel interrupt context)</td><td>Normal user-space code</td></tr></table>
<p>Linux user-space mutexes are built on <b>futex</b>: lock and unlock are a single atomic instruction when there is no contention. Only a contended lock makes a <code>futex()</code> syscall to sleep. Many implementations spin briefly first, then sleep (adaptive mutex).</p>
<div class="dev">If <code>perf top</code> shows a hot <code>native_queued_spin_lock_slowpath</code>, the kernel is fighting over a spinlock: often many cores hammering one socket, one file or one cgroup.</div>` },
        { type: 'mcq', q: 'When is a user-space spinlock the WORST choice?',
          choices: ['The critical section is a few nanoseconds on a 32-core machine', 'A single-core VM where the lock holder can be preempted', 'Incrementing a per-CPU counter', 'A lock that is almost never contended'], answer: 1,
          explain: 'On one core, if the holder is preempted, the waiter spins for its entire time slice while the holder cannot possibly run and release the lock. Pure waste. Spinning only makes sense when the holder is running on another core right now.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'deadlock',
      title: 'Deadlock',
      emoji: '💀',
      steps: [
        { type: 'learn', title: 'Gridlock in code', html: `
<p>A <b>deadlock</b> is a set of threads where each one waits for something held by another one in the set. Nobody can move, forever. Like four cars at a four-way junction, each waiting for the car on its right.</p>
<pre><code>Thread 1: lock(A) ... lock(B)    # holds A, waits for B
Thread 2: lock(B) ... lock(A)    # holds B, waits for A</code></pre>
<p>Coffman (1971): a deadlock is possible only if all four conditions hold at once:</p>
<ol><li><b>Mutual exclusion:</b> a resource can be held by only one thread.</li>
<li><b>Hold and wait:</b> a thread holds one resource while waiting for another.</li>
<li><b>No preemption:</b> resources cannot be taken away; only the holder releases.</li>
<li><b>Circular wait:</b> a cycle T1 → T2 → ... → T1 of "waits for".</li></ol>
<p>Break <b>any one</b> and deadlock becomes impossible.</p>` },
        { type: 'mcq', q: 'Which of these is NOT one of the four Coffman conditions for deadlock?',
          choices: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait', 'Starvation'], answer: 4,
          explain: 'Starvation is a different problem: a thread waits indefinitely while others keep making progress. In a deadlock, nobody in the cycle makes progress.' },
        { type: 'learn', title: 'Resource-allocation graphs', html: `
<p>Draw threads as circles and resources as boxes:</p>
<ul><li><b>Request edge</b> T → R: T is waiting for R.</li>
<li><b>Assignment edge</b> R → T: R is held by T.</li></ul>
<p>T1 → B → T2 → A → T1 is a cycle, so it is a deadlock.</p>
<ul><li>If every resource has <b>one instance</b>, a cycle means deadlock. Period.</li>
<li>If resources have <b>several instances</b> (e.g. 3 connections in a pool), a cycle is <i>necessary but not sufficient</i>: a thread outside the cycle may release an instance and break it.</li></ul>
<div class="dev">Databases build exactly this graph (the "wait-for graph": transaction → transaction) to detect deadlocks. Go's runtime has a much simpler version: if <i>every</i> goroutine is blocked, it panics with <code>fatal error: all goroutines are asleep - deadlock!</code></div>` },
        { type: 'tf', q: 'In a resource-allocation graph where every resource has exactly one instance, a cycle means there is a deadlock.', answer: true,
          explain: 'With single instances, each wait in the cycle can only be satisfied by the next thread in the cycle, which is itself waiting. Nobody can ever release.' },
        { type: 'learn', title: 'Prevent, avoid, or detect', html: `
<p><b>Prevention</b>: break a Coffman condition by design.</p>
<ul><li><b>Lock ordering</b> (breaks circular wait): give every lock a global order and always acquire in that order. The Linux kernel enforces this with <code>lockdep</code>.</li>
<li><b>Acquire all or nothing</b> (breaks hold and wait), or <b>try-lock with timeout</b> and back off (breaks no-preemption).</li></ul>
<p><b>Avoidance</b>: the <b>banker's algorithm</b>. Each process declares its maximum need up front. A request is granted only if afterwards there is still a <b>safe sequence</b>: an order in which every process can get its remaining need and finish. Elegant, but rarely used in general-purpose OSes because nobody knows their max need in advance.</p>
<p><b>Detection and recovery</b>: let it happen, find the cycle, kill a victim.</p>
<pre><code>ERROR:  deadlock detected
DETAIL: Process 4127 waits for ShareLock on transaction 9031; blocked by process 4130.
        Process 4130 waits for ShareLock on transaction 9030; blocked by process 4127.
HINT:   See server log for query details.</code></pre>
<div class="dev">Postgres checks for deadlocks after <code>deadlock_timeout</code> (default 1s), aborts one transaction with SQLSTATE <code>40P01</code>, and the other proceeds. Your app must catch it and <b>retry</b>.</div>` },
        { type: 'mcq', q: 'transfer(from, to) locks from, then to. Concurrent transfer(A, B) and transfer(B, A) sometimes hang forever. What is the simplest robust fix?',
          choices: ['Add a sleep between the two locks', 'Always lock the account with the smaller ID first, whatever the direction', 'Use a bigger thread pool', 'Retry the transfer when it is slow'], answer: 1,
          explain: 'A global lock order removes circular wait: both transfers now lock A first, so one simply waits for the other. The same trick works in SQL: update rows in a consistent order (e.g. ORDER BY id) to avoid DB deadlocks.' },
        { type: 'input', q: 'Banker\'s algorithm: 12 units total. P1 holds 5 (max 10), P2 holds 2 (max 4), P3 holds 2 (max 9). How many units are available right now?', answer: ['3', 'three'], placeholder: 'units',
          explain: '12 − (5 + 2 + 2) = 3. Remaining needs: P1 needs 5, P2 needs 2, P3 needs 7.' },
        { type: 'order', q: 'Same state (3 available; needs: P1=5, P2=2, P3=7). Order the processes into the safe sequence',
          items: ['P2', 'P1', 'P3'],
          explain: 'Only P2 fits in 3. It finishes and returns its 4 → 5 available. Now P1 (needs 5) can finish and returns 10 → 10 available. Then P3 (needs 7) finishes. A safe sequence exists, so the state is safe.' },
        { type: 'mcq', q: 'Postgres logs "deadlock detected" between two transactions. What actually happened?',
          choices: ['Both transactions were rolled back and the database restarted', 'Postgres aborted one transaction (the victim) so the other could proceed; the app should retry the failed one', 'Postgres waits forever until an admin intervenes', 'The data is now corrupted'], answer: 1,
          explain: 'Detection and recovery: Postgres finds the cycle in its wait-for graph, picks a victim, rolls it back with error 40P01, and the survivor continues. Nothing is corrupted, but the client needs retry logic.' }
      ]
    },
    // ------------------------------------------------------------------
    {
      id: 'classic-problems',
      title: 'Classic Problems in Real Systems',
      emoji: '🍝',
      steps: [
        { type: 'learn', title: 'Producer / consumer (bounded buffer)', html: `
<p>Producers put items into a buffer of size N, consumers take them out. The classic solution uses three primitives:</p>
<pre><code>empty = Semaphore(N)   # free slots
full  = Semaphore(0)   # filled slots
mutex = Mutex()

producer:  empty.wait(); mutex.lock(); buf.put(x);    mutex.unlock(); full.signal()
consumer:  full.wait();  mutex.lock(); x = buf.take(); mutex.unlock(); empty.signal()</code></pre>
<p>A full buffer blocks producers: that is <b>backpressure</b>, and it is a feature.</p>
<div class="dev">You use this everywhere: a Go buffered channel (<code>make(chan Job, 100)</code>), a Kafka topic with consumer lag, a Kubernetes controller's <b>workqueue</b> (informers produce object keys, worker goroutines consume them), log shippers with an in-memory buffer.</div>` },
        { type: 'mcq', q: 'You replace a bounded queue with an unbounded one "so producers never block". Consumers are slower than producers. What happens?',
          choices: ['Throughput goes up forever', 'The queue grows without limit until the process runs out of memory, and latency grows with it', 'Consumers automatically speed up', 'Nothing changes'], answer: 1,
          explain: 'An unbounded queue does not remove the overload, it just hides it. Memory and queueing delay grow until something gets OOMKilled. A bounded buffer turns overload into backpressure that callers can see.' },
        { type: 'input', q: 'A bounded buffer of capacity 10 uses semaphores empty and full. It currently holds 4 items and nobody is in the middle of an operation. What is the value of empty?', answer: ['6', 'six'], placeholder: 'value',
          explain: 'empty counts free slots: 10 − 4 = 6. full counts filled slots: 4. Invariant: empty + full = capacity (when no operation is in flight).' },
        { type: 'learn', title: 'Readers / writers', html: `
<p>Many threads may <b>read</b> at once, but a <b>writer</b> needs the data to itself. A <b>read-write lock</b> (<code>sync.RWMutex</code>, <code>pthread_rwlock_t</code>) does that.</p>
<ul><li><b>Reader preference:</b> new readers join while others are reading. A constant stream of readers can <b>starve the writer</b>.</li>
<li><b>Writer preference:</b> once a writer is waiting, new readers queue behind it. Writers do not starve, but readers wait more.</li></ul>
<p>Databases avoid much of this with <b>MVCC</b>: in Postgres, readers see a snapshot and do not block writers at all. But schema changes still need strong locks.</p>
<div class="dev">The classic Postgres incident: a long analytics <code>SELECT</code> runs. A migration does <code>ALTER TABLE</code> and waits for an <code>ACCESS EXCLUSIVE</code> lock. Now every new <code>SELECT</code> on that table queues <b>behind the waiting ALTER</b>, and the site goes down. Fix: <code>SET lock_timeout = '3s'</code> in migrations, and retry.</div>` },
        { type: 'mcq', q: 'In that incident, why do brand-new simple SELECTs block, even though the ALTER TABLE has not got its lock yet?',
          choices: ['SELECT always needs an exclusive lock', 'Lock requests queue in order: the new SELECTs conflict with the waiting ACCESS EXCLUSIVE request, so they line up behind it', 'The long SELECT crashed the server', 'MVCC is disabled during migrations'], answer: 1,
          explain: 'Postgres grants locks fairly. The new SELECT\'s lock is compatible with the running SELECT, but not with the queued ALTER ahead of it, so it waits. One waiting writer turns into a full outage. lock_timeout makes the ALTER give up instead.' },
        { type: 'learn', title: 'Dining philosophers', html: `
<p>Five philosophers sit at a round table with one fork between each pair. To eat, a philosopher needs <b>both</b> neighbouring forks. If everyone picks up the left fork at the same moment, everyone waits for the right fork forever: <b>deadlock</b> (all four Coffman conditions hold).</p>
<p>Fixes, each breaking one condition:</p>
<ul><li><b>Lock ordering:</b> number the forks and always take the lower number first. One philosopher now reaches right first, so the cycle cannot close.</li>
<li><b>A waiter:</b> a semaphore that lets at most N−1 philosophers sit down at once.</li>
<li><b>Try-lock:</b> if the second fork is taken, put the first one down and retry later (beware of livelock: everyone politely retrying in sync).</li></ul>
<div class="dev">The real-world version: each request holds a DB connection from a pool of 10 <i>and</i>, while holding it, calls another endpoint of the same service that needs a second connection. With 10 concurrent requests, all 10 connections are held and all 10 inner calls wait. The pool is the forks. Fix: never hold one pooled resource while waiting for another from the same pool, or use separate pools.</div>` },
        { type: 'input', q: 'Five dining philosophers. The "waiter" semaphore allows at most how many philosophers at the table at once, to guarantee no deadlock?', answer: ['4', 'four'], placeholder: 'number',
          explain: 'With at most 4 philosophers sharing 5 forks, by the pigeonhole principle at least one of them can pick up both forks, eat, and release them. The cycle can never close.' },
        { type: 'mcq', q: 'Under load, a service hangs. Every thread holds one connection from a pool of 10 and waits for a second connection from the same pool. Which Coffman condition is the easiest to remove?',
          choices: ['Mutual exclusion: let two requests share one connection', 'Hold and wait: get everything you need up front, or never hold a connection while waiting for another', 'No preemption: steal connections from running queries', 'None: add more CPUs'], answer: 1,
          explain: 'Restructure so a request takes a single connection (pass it down to the inner call), or uses a separate pool for nested work. Sharing connections or stealing them mid-query would corrupt transactions.' },
        { type: 'order', q: 'Order the life of an item in a Kubernetes controller workqueue (the producer/consumer at the heart of every controller)',
          items: ['An informer sees a change and adds the object key to the queue', 'A worker calls Get() and receives the key', 'The worker reconciles desired state vs actual state', 'The worker calls Done(); on error the key is re-added with rate-limited backoff'],
          explain: 'Informers produce, workers consume. The client-go workqueue also de-duplicates: a key that changes 50 times while waiting is processed once, and a key being processed is never handed to two workers at the same time. That is mutual exclusion per object, for free.' }
      ]
    }
  ]
});
