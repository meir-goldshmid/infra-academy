window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   eBPF: fundamentals (lifecycle, verifier, hooks, maps, CO-RE, bpftool)
   and the ecosystem in practice (networking, observability, security).
   Builds under: linux-perf-tracing, staff-ebpf-cilium, container-internals,
   k8s-networking-cni.
   ========================================================================= */
(function () {
  var INFRA = window.INFRA;

  /* ---------- shared code blocks (identical in both languages) ---------- */

  const EB_LIFECYCLE = `<pre>  execcount.bpf.c        restricted C (or Rust via Aya)
        |  clang -O2 -g -target bpf -c execcount.bpf.c -o execcount.bpf.o
        v
  execcount.bpf.o        ELF: BPF bytecode + map definitions + BTF + CO-RE relocations
        |  loader in user space: libbpf / cilium/ebpf (Go) / Aya / BCC / bpftrace
        |  bpf(BPF_MAP_CREATE, ...)   bpf(BPF_PROG_LOAD, ...)
        v
  ---------------------------- kernel ----------------------------
  verifier   walks every path: types, bounds, NULL checks, loops,
             stack &lt;= 512 B, &lt;= 1,000,000 processed instructions,
             only helpers allowed for this program type
     reject  -&gt; EACCES / EINVAL + verifier log   (node keeps running)
     accept  -&gt; JIT to native x86-64 / arm64 instructions
  attach     -&gt; hook: tracepoint, kprobe, fentry, uprobe, XDP, tc, cgroup, LSM
  maps       &lt;-&gt; user space reads / writes them with bpf(BPF_MAP_*)
  ----------------------------------------------------------------</pre>`;

  const EB_VERIFIER = `<pre>$ sudo bpftool prog load execcount.bpf.o /sys/fs/bpf/execcount
libbpf: prog 'count_execve': BPF program load failed: Permission denied
libbpf: prog 'count_execve': -- BEGIN PROG LOAD LOG --
0: R1=ctx() R10=fp0
...
9: (85) call bpf_map_lookup_elem#1    ; R0_w=map_value_or_null(id=1,off=0,ks=16,vs=8,imm=0)
; *val += 1;
10: (79) r1 = *(u64 *)(r0 +0)
R0 invalid mem access 'map_value_or_null'
processed 11 insns (limit 1000000) max_states_per_insn 0 total_states 1 peak_states 1 mark_read 1
-- END PROG LOAD LOG --

# fix: the lookup can return NULL, so the verifier insists on a check
val = bpf_map_lookup_elem(&amp;exec_count, &amp;key);
if (!val) return 0;          /* now R0 is 'map_value' on this path */
__sync_fetch_and_add(val, 1);</pre>`;

  const EB_BPFTRACE = `<pre>$ sudo bpftrace -e 'tracepoint:syscalls:sys_enter_execve { @execs[comm] = count(); }'
Attaching 1 probe...
^C

@execs[sshd]: 2
@execs[containerd-shim]: 14
@execs[kubelet]: 48
@execs[bash]: 113
@execs[runc]: 312</pre>`;

  const EB_LIBBPF = `<pre>// execcount.bpf.c  -- kernel side (libbpf + CO-RE)
#include "vmlinux.h"                 // generated from /sys/kernel/btf/vmlinux
#include &lt;bpf/bpf_helpers.h&gt;

struct key_t { char comm[16]; };

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key, struct key_t);
    __type(value, u64);
} exec_count SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_execve")
int count_execve(void *ctx)
{
    struct key_t key = {};
    u64 one = 1, *val;

    bpf_get_current_comm(&amp;key.comm, sizeof(key.comm));   // helper call
    val = bpf_map_lookup_elem(&amp;exec_count, &amp;key);
    if (val)
        __sync_fetch_and_add(val, 1);                      // atomic: many CPUs hit this
    else
        bpf_map_update_elem(&amp;exec_count, &amp;key, &amp;one, BPF_NOEXIST);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";   // GPL-only helpers need this

$ bpftool btf dump file /sys/kernel/btf/vmlinux format c &gt; vmlinux.h
$ clang -O2 -g -target bpf -D__TARGET_ARCH_x86 -c execcount.bpf.c -o execcount.bpf.o
$ bpftool gen skeleton execcount.bpf.o &gt; execcount.skel.h   # user-space loader includes this
# user space: execcount_bpf__open_and_load(); execcount_bpf__attach(); then iterate the map</pre>`;

  const EB_BCC = `<pre>#!/usr/bin/env python3
# execcount.py -- the same idea with BCC: C is compiled ON the node at startup
from bcc import BPF
import time

b = BPF(text=r"""
#include &lt;linux/sched.h&gt;
struct key_t { char comm[TASK_COMM_LEN]; };
BPF_HASH(counts, struct key_t, u64);

TRACEPOINT_PROBE(syscalls, sys_enter_execve) {
    struct key_t key = {};
    bpf_get_current_comm(&amp;key.comm, sizeof(key.comm));
    counts.increment(key);
    return 0;
}
""")

time.sleep(10)
top = sorted(b["counts"].items(), key=lambda kv: kv[1].value, reverse=True)
for k, v in top[:5]:
    print("%-16s %d" % (k.comm.decode(), v.value))

$ sudo ./execcount.py
runc             297
bash             104
kubelet           45</pre>`;

  const EB_CORE = `<pre>$ ls -lh /sys/kernel/btf/vmlinux
-r--r--r-- 1 root root 5.9M Nov 14 09:12 /sys/kernel/btf/vmlinux
$ grep CONFIG_DEBUG_INFO_BTF= /boot/config-$(uname -r)
CONFIG_DEBUG_INFO_BTF=y

/* CO-RE read: libbpf records "task_struct.real_parent.tgid" as a relocation
   and patches the real offsets for THIS kernel at load time */
struct task_struct *task = (void *)bpf_get_current_task();
pid_t ppid = BPF_CORE_READ(task, real_parent, tgid);

/* feature detection instead of version checks */
if (bpf_core_field_exists(task-&gt;loginuid)) { ... }</pre>`;

  const EB_BPFTOOL = `<pre>$ sudo bpftool prog list
212: tracepoint  name count_execve  tag 3b185187f1855c4c  gpl
	loaded_at 2026-11-14T10:02:11+0000  uid 0
	xlated 216B  jited 132B  memlock 4096B  map_ids 48
	btf_id 301
	pids execcount(91822)
...
$ sudo bpftool map show id 48
48: hash  name exec_count  flags 0x0
	key 16B  value 8B  max_entries 10240  memlock 1311040B
	btf_id 301
	pids execcount(91822)
$ sudo bpftool map dump id 48
[{
        "key": { "comm": "runc" },
        "value": 312
    },{
        "key": { "comm": "bash" },
        "value": 113
    }
]
$ sudo bpftool perf list                       # which kprobe/tracepoint each prog is on
pid 91822  fd 12: prog_id 212  tracepoint  sys_enter_execve
$ sudo bpftool net list                        # XDP / tc programs per interface
$ sudo bpftool cgroup tree /sys/fs/cgroup      # cgroup-attached programs
$ sudo bpftool feature probe kernel | grep -E 'ringbuf|lsm'
eBPF map_type ringbuf is available
eBPF program_type lsm is available</pre>`;

  const EB_XDP = `<pre>// xdp_drop.bpf.c -- drop packets from blocklisted source IPs at the NIC driver
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1000000);
    __type(key, __u32);            // IPv4 source address
    __type(value, __u64);          // drop counter
} blocklist SEC(".maps");

SEC("xdp")
int xdp_drop_blocklist(struct xdp_md *ctx)
{
    void *data     = (void *)(long)ctx-&gt;data;
    void *data_end = (void *)(long)ctx-&gt;data_end;
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) &gt; data_end)        // bounds check or the verifier rejects
        return XDP_PASS;
    if (eth-&gt;h_proto != bpf_htons(ETH_P_IP))
        return XDP_PASS;
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) &gt; data_end)
        return XDP_PASS;
    __u64 *hits = bpf_map_lookup_elem(&amp;blocklist, &amp;ip-&gt;saddr);
    if (hits) {
        __sync_fetch_and_add(hits, 1);
        return XDP_DROP;                      // no skb allocated, no conntrack, no iptables
    }
    return XDP_PASS;
}

$ sudo ip link set dev eth0 xdpdrv obj xdp_drop.bpf.o sec xdp     # native (driver) mode
$ ip -d link show dev eth0 | grep xdp
    prog/xdp id 87 tag 9c1a2f63d1e0b7aa jited
$ sudo bpftool map update name blocklist key 203 0 113 9 value 0 0 0 0 0 0 0 0   # 203.0.113.9</pre>`;

  const EB_TETRAGON = `<pre># Tetragon TracingPolicy: kill any process that opens /etc/shadow for writing
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: block-shadow-write
spec:
  kprobes:
  - call: "security_file_permission"     # LSM hook function, stable across kernels
    syscall: false
    args:
    - index: 0
      type: "file"
    - index: 1
      type: "int"                         # mask: MAY_WRITE = 2, MAY_READ = 4
    selectors:
    - matchArgs:
      - index: 0
        operator: "Equal"
        values: ["/etc/shadow"]
      - index: 1
        operator: "Equal"
        values: ["2"]
      matchActions:
      - action: Sigkill                   # decided in-kernel, before the write happens

$ kubectl exec -n tetragon ds/tetragon -c tetragon -- tetra getevents -o compact
🚀 process default/debug-7c9f /usr/bin/vi /etc/shadow
📬 open    default/debug-7c9f /usr/bin/vi /etc/shadow
💥 exit    default/debug-7c9f /usr/bin/vi /etc/shadow SIGKILL</pre>`;

  const EB_FALCO = `<pre># Falco rule (YAML) over the syscall stream from its modern_ebpf driver
- rule: Terminal shell in container
  desc: A shell was spawned with an attached terminal inside a container
  condition: spawned_process and container and shell_procs and proc.tty != 0
  output: Shell in container (user=%user.name pod=%k8s.pod.name cmd=%proc.cmdline)
  priority: NOTICE

$ kubectl logs -n falco ds/falco | head -3
Opening 'syscall' source with modern BPF probe.
10:41:07.118: Notice Shell in container (user=root pod=checkout-6d8f cmd=bash)</pre>`;

  const EB_ERRORS = `<pre># 1. BTF missing (old distro, or a custom kernel built without CONFIG_DEBUG_INFO_BTF)
libbpf: failed to find valid kernel BTF
libbpf: Error loading vmlinux BTF: -3

# 2. kprobe target renamed / inlined / removed by a kernel upgrade
libbpf: prog 'trace_connect': failed to create kprobe 'tcp_v4_connect+0x0' perf event: No such file or directory

# 3. verifier: new kernel or new clang produced code it can't prove safe in budget
BPF program is too large. Processed 1000001 insn

# 4. map memory: pre-5.11 kernels charge maps to RLIMIT_MEMLOCK (default 64 KiB-8 MiB)
libbpf: map 'events': failed to create: Operation not permitted(-1)
   -&gt; raise memlock (ulimit -l unlimited / LimitMEMLOCK=infinity) or upgrade the kernel

# 5. hook type not in this kernel (e.g. LSM BPF not enabled at boot)
$ cat /sys/kernel/security/lsm
lockdown,capability,yama,apparmor          &lt;- no 'bpf': add lsm=...,bpf to the kernel cmdline</pre>`;

  /* =============================== LESSON 1 =============================== */
  INFRA.lessons.push({
    id: "ebpf-fundamentals",
    track: "linux",
    order: 40,
    icon: "🐝",
    level: 3,
    minutes: 20,
    title: { en: "eBPF from the Ground Up", he: "eBPF מהיסוד" },
    tldr: {
      en: "eBPF lets you load small programs into the running Linux kernel without writing a kernel module: clang compiles restricted C to BPF bytecode, the bpf() syscall hands it to the verifier, which proves it is safe and terminates, the JIT turns it into native code, and it runs at a hook (tracepoint, kprobe, XDP, tc, cgroup, LSM), talking to user space through maps.",
      he: "eBPF מאפשר לטעון תוכניות קטנות לתוך ה-kernel של Linux בזמן ריצה בלי לכתוב kernel module: clang מקמפל C מוגבל ל-bytecode של BPF, ה-syscall bpf() מעביר אותו ל-verifier שמוכיח שהוא בטוח ושהוא מסתיים, ה-JIT הופך אותו לקוד native, והוא רץ על hook (tracepoint, kprobe, XDP, tc, cgroup, LSM) ומדבר עם user space דרך maps."
    },
    analogy: {
      en: "The kernel is an airport's restricted zone. A kernel module is hiring a contractor and giving him a master key: if he trips, the whole airport shuts down. eBPF is a vending machine you may install at a specific gate: security (the verifier) X-rays it first and rejects anything with a loose wire or a loop that never ends, then it's bolted in place (attach) and talks to the outside only through a locked drop box (maps).",
      he: "ה-kernel הוא האזור הסטרילי בשדה תעופה. kernel module זה להכניס קבלן ולתת לו מפתח מאסטר: אם הוא מועד, כל השדה נסגר. eBPF זו מכונה אוטומטית שמותר לך להציב ליד שער מסוים: הביטחון (ה-verifier) שולח אותה קודם לשיקוף ופוסל כל דבר עם חוט רופף או לולאה שלא נגמרת, אחר כך מבריגים אותה במקום (attach), והיא מדברת עם העולם בחוץ רק דרך תיבת שלשול נעולה (maps)."
    },
    sections: [
      {
        h: { en: "What eBPF is and the program lifecycle", he: "מה זה eBPF ומחזור החיים של תוכנית" },
        body: {
          en: `<p>Classic BPF (1992) was a tiny filter VM for <code>tcpdump</code>. <strong>eBPF</strong> (kernel 3.18+, 2014) extended it into a general in-kernel VM: 11 64-bit registers (R0 return value, R1-R5 arguments, R10 read-only frame pointer), a 512-byte stack, calls to kernel <strong>helpers</strong> and shared <strong>maps</strong>. The point: add logic to the kernel <em>at runtime</em>, without patching it, rebooting, or loading a module that can panic the box.</p>
${EB_LIFECYCLE}
<ul>
<li><strong>Write</strong>: restricted C (no unbounded loops, no arbitrary pointers, no libc), or Rust with Aya. High-level front ends like bpftrace generate it for you.</li>
<li><strong>Compile</strong>: <code>clang -target bpf</code> emits BPF bytecode into an ELF object, plus BTF type info and CO-RE relocations.</li>
<li><strong>Load</strong>: a loader library creates the maps and calls <code>bpf(BPF_PROG_LOAD)</code>. Every eBPF thing you meet (Cilium, Falco, bpftrace) ends in this one syscall.</li>
<li><strong>Verify, JIT, attach</strong>: if the verifier accepts, the JIT (on by default on x86-64/arm64, often forced by <code>CONFIG_BPF_JIT_ALWAYS_ON</code>) compiles to native code; the program is attached to a hook and runs on every event, in the context of whatever task or packet triggered it.</li>
<li><strong>Lifetime</strong>: a program lives while something holds a reference: an open fd in the loader, a link, or a pin in <code>/sys/fs/bpf</code>. That's how Cilium keeps the datapath running while its agent restarts.</li>
</ul>`,
          he: `<p>BPF הקלאסי (1992) היה VM זעיר לפילטרים של <code>tcpdump</code>. <strong>eBPF</strong> (מ-kernel 3.18, 2014) הרחיב אותו ל-VM כללי בתוך ה-kernel: 11 רגיסטרים של 64 ביט (R0 ערך חזרה, R1-R5 ארגומנטים, R10 frame pointer לקריאה בלבד), stack של 512 בייט, קריאות ל-<strong>helpers</strong> של ה-kernel ו-<strong>maps</strong> משותפים. השורה התחתונה: להוסיף לוגיקה ל-kernel <em>בזמן ריצה</em>, בלי patch, בלי reboot ובלי לטעון module שיכול להפיל את המכונה ב-panic.</p>
${EB_LIFECYCLE}
<ul>
<li><strong>כותבים</strong>: C מוגבל (בלי לולאות לא חסומות, בלי pointers שרירותיים, בלי libc), או Rust עם Aya. כלים ברמה גבוהה כמו bpftrace מייצרים את זה בשבילך.</li>
<li><strong>מקמפלים</strong>: <code>clang -target bpf</code> מוציא bytecode של BPF לתוך קובץ ELF, יחד עם מידע טיפוסים BTF ו-relocations של CO-RE.</li>
<li><strong>טוענים</strong>: ספריית loader יוצרת את ה-maps וקוראת ל-<code>bpf(BPF_PROG_LOAD)</code>. כל כלי eBPF שתפגוש (Cilium, Falco, bpftrace) מסתיים ב-syscall הזה.</li>
<li><strong>Verify, JIT, attach</strong>: אם ה-verifier מאשר, ה-JIT (דולק כברירת מחדל ב-x86-64/arm64, ולרוב מחויב ע״י <code>CONFIG_BPF_JIT_ALWAYS_ON</code>) מקמפל לקוד native; התוכנית מחוברת ל-hook ורצה על כל אירוע, בהקשר של ה-task או ה-packet שהפעיל אותה.</li>
<li><strong>אורך חיים</strong>: תוכנית חיה כל עוד משהו מחזיק אליה reference: fd פתוח ב-loader, link, או pin ב-<code>/sys/fs/bpf</code>. ככה Cilium משאיר את ה-datapath רץ בזמן שה-agent שלו עושה restart.</li>
</ul>`
        }
      },
      {
        h: { en: "The verifier: why eBPF can't (easily) crash the kernel", he: "ה-verifier: למה eBPF לא יכול (בקלות) להפיל את ה-kernel" },
        body: {
          en: `<p>The verifier is a static analyzer inside the kernel. It simulates every possible path through the program, tracking the type and value range of each register, and rejects the program unless it can prove:</p>
<ul>
<li><strong>Termination</strong>: no back-edges until kernel 5.3; since then <em>bounded</em> loops are allowed if the verifier can see the bound. <code>bpf_loop()</code> (5.17) runs a callback N times without unrolling.</li>
<li><strong>Memory safety</strong>: every pointer dereference is in bounds. Packet pointers must be checked against <code>data_end</code>; map lookups that can return NULL must be NULL-checked; stack reads must be of initialized bytes.</li>
<li><strong>Budget</strong>: at most 1,000,000 <em>processed</em> instructions across all explored paths (since 5.2; 4,096 was the old per-program size limit, still the limit for unprivileged programs). Complexity, not code length, is what usually hits the wall.</li>
<li><strong>Allowed calls</strong>: only helpers/kfuncs permitted for this program type, GPL-only helpers only for GPL-licensed programs, tail calls up to 33 deep.</li>
</ul>
${EB_VERIFIER}
<p>Read the log bottom-up: the last instruction and the register state tell you exactly which path failed. Rejections are annoying but safe: the program never ran. Clang optimizations can reorder code in ways the verifier can't follow, which is why the same source can pass on one kernel/compiler pair and fail on another.</p>
<blockquote>⚠️ Production tip: the verifier proves <em>safety</em>, not <em>harmlessness</em>. A verified program can still burn CPU on a hot hook, drop all packets (<code>XDP_DROP</code>), or read secrets from process memory. And verifier bugs do exist (several CVEs allowed privilege escalation), which is the main reason unprivileged eBPF is disabled by default today.</blockquote>`,
          he: `<p>ה-verifier הוא static analyzer בתוך ה-kernel. הוא מסמלץ כל מסלול אפשרי בתוכנית, עוקב אחרי הטיפוס וטווח הערכים של כל רגיסטר, ודוחה את התוכנית אלא אם הוא מצליח להוכיח:</p>
<ul>
<li><strong>סיום</strong>: עד kernel 5.3 אסור היה לקפוץ אחורה בכלל; מאז מותרות לולאות <em>חסומות</em>, אם ה-verifier רואה את הגבול. <code>bpf_loop()</code> (מ-5.17) מריץ callback מספר פעמים בלי unrolling.</li>
<li><strong>בטיחות זיכרון</strong>: כל גישה דרך pointer נמצאת בגבולות. pointers ל-packet חייבים בדיקה מול <code>data_end</code>; lookup ב-map שיכול להחזיר NULL חייב בדיקת NULL; קריאה מה-stack רק מבייטים מאותחלים.</li>
<li><strong>תקציב</strong>: עד 1,000,000 הוראות <em>שעובדו</em> בכל המסלולים יחד (מ-5.2; 4,096 היה פעם גבול הגודל לתוכנית, והוא עדיין הגבול לתוכניות unprivileged). בדרך כלל מה שנתקע הוא המורכבות, לא אורך הקוד.</li>
<li><strong>קריאות מותרות</strong>: רק helpers ו-kfuncs שמותרים לסוג התוכנית הזה, helpers של GPL בלבד רק לתוכנית עם רישיון GPL, ו-tail calls עד עומק 33.</li>
</ul>
${EB_VERIFIER}
<p>קוראים את ה-log מלמטה למעלה: ההוראה האחרונה ומצב הרגיסטרים אומרים לך בדיוק איזה מסלול נכשל. דחייה מעצבנת אבל בטוחה: התוכנית אף פעם לא רצה. אופטימיזציות של clang יכולות לסדר קוד מחדש בצורה שה-verifier לא מצליח לעקוב אחריה, ולכן אותו קוד מקור יכול לעבור בצמד kernel וקומפיילר אחד ולהיכשל בצמד אחר.</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-verifier מוכיח <em>בטיחות</em>, לא <em>תמימות</em>. תוכנית מאומתת עדיין יכולה לשרוף CPU על hook חם, להפיל את כל ה-packets (<code>XDP_DROP</code>) או לקרוא סודות מזיכרון של תהליכים. ויש באגים ב-verifier (כמה CVEs אפשרו privilege escalation), וזו הסיבה העיקרית ש-eBPF בלי הרשאות כבוי היום כברירת מחדל.</blockquote>`
        }
      },
      {
        h: { en: "Hooks: where a program can run", he: "Hooks: איפה תוכנית יכולה לרוץ" },
        body: {
          en: `<p>The program type decides the hook, the context it receives (<code>pt_regs</code>, a packet, a socket) and which helpers it may call.</p>
<table>
<tr><th>Hook</th><th>Fires on</th><th>Stability / cost</th><th>Typical user</th></tr>
<tr><td><strong>tracepoint</strong> / raw_tracepoint</td><td>Static points the kernel devs placed (<code>syscalls:sys_enter_execve</code>, <code>sched:sched_switch</code>)</td><td>Stable ABI. Prefer these.</td><td>bpftrace, Falco, profilers</td></tr>
<tr><td><strong>kprobe / kretprobe</strong></td><td>Entry / return of (almost) any kernel function</td><td>Unstable: functions get renamed or inlined between versions</td><td>Tetragon, BCC tools</td></tr>
<tr><td><strong>fentry / fexit</strong></td><td>Same as kprobes, via a BPF trampoline (5.5+); fexit sees args <em>and</em> return value</td><td>Lower overhead than kprobes, needs BTF</td><td>Modern tracers</td></tr>
<tr><td><strong>uprobe / uretprobe</strong>, USDT</td><td>A function in a user-space binary or library (<code>SSL_write</code> in libssl)</td><td>~1-3 µs per hit (trap into the kernel)</td><td>Pixie, Beyla, TLS sniffing</td></tr>
<tr><td><strong>perf_event</strong></td><td>Timer or hardware counter (e.g. sample stacks at 19-99 Hz)</td><td>Cost = frequency × CPUs</td><td>Parca, Pyroscope</td></tr>
<tr><td><strong>XDP</strong></td><td>Packet in the NIC driver, before an <code>sk_buff</code> exists</td><td>Fastest network hook, ingress only</td><td>DDoS drop, Katran, Cilium</td></tr>
<tr><td><strong>tc</strong> (clsact / tcx 6.6+)</td><td>Packet at ingress/egress with a full <code>sk_buff</code></td><td>Can rewrite, redirect, see egress</td><td>Cilium datapath, policy</td></tr>
<tr><td><strong>cgroup</strong> hooks</td><td><code>connect4</code>, <code>sock_create</code>, skb ingress/egress, device, sysctl, per cgroup</td><td>Scoped to a cgroup = a container</td><td>Cilium socket LB, systemd IP filtering</td></tr>
<tr><td><strong>LSM BPF</strong> (5.7+)</td><td>Linux Security Module hooks (<code>file_open</code>, <code>bprm_check_security</code>); can return -EPERM</td><td>Needs <code>bpf</code> in the boot-time LSM list</td><td>Tetragon, KubeArmor</td></tr>
<tr><td><strong>sockops</strong>, sk_msg</td><td>TCP socket events (connect, established, RTO) and message redirects</td><td>Per-socket</td><td>TCP tuning, socket-to-socket acceleration</td></tr>
</table>
<p>You can list what's attached to which hook with <code>bpftool perf list</code>, <code>bpftool net list</code> and <code>bpftool cgroup tree</code>, and see all available tracepoints with <code>bpftrace -l 'tracepoint:syscalls:*'</code>.</p>`,
          he: `<p>סוג התוכנית קובע את ה-hook, את ה-context שהיא מקבלת (<code>pt_regs</code>, packet, socket) ואילו helpers מותר לה לקרוא.</p>
<table>
<tr><th>Hook</th><th>מתי הוא רץ</th><th>יציבות / עלות</th><th>מי משתמש</th></tr>
<tr><td><strong>tracepoint</strong> / raw_tracepoint</td><td>נקודות סטטיות שמפתחי ה-kernel הציבו (<code>syscalls:sys_enter_execve</code>, <code>sched:sched_switch</code>)</td><td>ABI יציב. עדיף עליהם.</td><td>bpftrace, Falco, profilers</td></tr>
<tr><td><strong>kprobe / kretprobe</strong></td><td>כניסה ויציאה של (כמעט) כל פונקציה ב-kernel</td><td>לא יציב: פונקציות משנות שם או עוברות inline בין גרסאות</td><td>Tetragon, כלי BCC</td></tr>
<tr><td><strong>fentry / fexit</strong></td><td>כמו kprobes, דרך BPF trampoline (מ-5.5); fexit רואה את הארגומנטים <em>וגם</em> את ערך החזרה</td><td>overhead נמוך יותר מ-kprobes, דורש BTF</td><td>tracers מודרניים</td></tr>
<tr><td><strong>uprobe / uretprobe</strong>, USDT</td><td>פונקציה בבינארי או ספרייה ב-user space (<code>SSL_write</code> ב-libssl)</td><td>בערך 1-3 µs לכל פגיעה (trap ל-kernel)</td><td>Pixie, Beyla, הסנפת TLS</td></tr>
<tr><td><strong>perf_event</strong></td><td>טיימר או hardware counter (למשל דגימת stacks ב-19-99 Hz)</td><td>עלות = תדירות × מספר CPUs</td><td>Parca, Pyroscope</td></tr>
<tr><td><strong>XDP</strong></td><td>packet ב-driver של כרטיס הרשת, לפני שקיים <code>sk_buff</code></td><td>ה-hook הכי מהיר ברשת, רק ingress</td><td>הפלת DDoS, Katran, Cilium</td></tr>
<tr><td><strong>tc</strong> (clsact / tcx מ-6.6)</td><td>packet ב-ingress/egress עם <code>sk_buff</code> מלא</td><td>יכול לשכתב, להפנות, לראות egress</td><td>ה-datapath של Cilium, policy</td></tr>
<tr><td>hooks של <strong>cgroup</strong></td><td><code>connect4</code>, <code>sock_create</code>, skb ב-ingress/egress, device, sysctl, לכל cgroup</td><td>תחום ל-cgroup, כלומר לקונטיינר</td><td>socket LB של Cilium, סינון IP של systemd</td></tr>
<tr><td><strong>LSM BPF</strong> (מ-5.7)</td><td>hooks של Linux Security Module ‏(<code>file_open</code>, <code>bprm_check_security</code>); יכול להחזיר -EPERM</td><td>צריך <code>bpf</code> ברשימת ה-LSM בזמן ה-boot</td><td>Tetragon, KubeArmor</td></tr>
<tr><td><strong>sockops</strong>, sk_msg</td><td>אירועי TCP socket (connect, established, RTO) והפניית הודעות</td><td>לכל socket</td><td>כיוונון TCP, האצת socket ל-socket</td></tr>
</table>
<p>רואים מה מחובר לאיזה hook עם <code>bpftool perf list</code>, <code>bpftool net list</code> ו-<code>bpftool cgroup tree</code>, ואת כל ה-tracepoints הזמינים עם <code>bpftrace -l 'tracepoint:syscalls:*'</code>.</p>`
        }
      },
      {
        h: { en: "Maps, helpers, CO-RE & BTF, kernel versions, privileges", he: "Maps, helpers, ‏CO-RE ו-BTF, גרסאות kernel, הרשאות" },
        body: {
          en: `<p><strong>Maps</strong> are kernel-resident key/value structures that both the program and user space can access (user space via <code>bpf(BPF_MAP_LOOKUP_ELEM...)</code> on a map fd). They hold state between events, config pushed from user space, and results streamed out.</p>
<table>
<tr><th>Map type</th><th>Use it for</th></tr>
<tr><td><code>HASH</code> / <code>ARRAY</code></td><td>Counters per key, config tables, the Service-to-backend table in Cilium. Array = fixed index, preallocated.</td></tr>
<tr><td><code>PERCPU_HASH</code> / <code>PERCPU_ARRAY</code></td><td>Hot counters without atomics or cache-line bouncing; user space sums the per-CPU values.</td></tr>
<tr><td><code>LRU_HASH</code></td><td>Bounded tables that must never fill up: connection tracking, flow caches. Evicts the least recently used entry.</td></tr>
<tr><td><code>RINGBUF</code> (5.8+)</td><td>Streaming events to user space: one shared, ordered, memory-efficient buffer (replaces per-CPU <code>PERF_EVENT_ARRAY</code>).</td></tr>
<tr><td><code>LPM_TRIE</code>, <code>PROG_ARRAY</code>, <code>STACK_TRACE</code></td><td>CIDR matching, tail-call jump tables, stack ids for profilers.</td></tr>
</table>
<p><strong>Helpers</strong> are the only kernel API a program gets: <code>bpf_map_lookup_elem</code>, <code>bpf_get_current_pid_tgid</code>, <code>bpf_get_current_comm</code>, <code>bpf_ktime_get_ns</code>, <code>bpf_probe_read_kernel/user</code>, <code>bpf_ringbuf_reserve/submit</code>, <code>bpf_redirect</code>. Newer kernels add <em>kfuncs</em>: kernel functions exported to BPF, with less ABI promise.</p>
<p><strong>CO-RE and BTF.</strong> Kernel structs (<code>task_struct</code>, <code>sk_buff</code>) change layout between versions and configs. BCC's old answer: compile on every node at startup with kernel headers (100+ MB of LLVM, seconds of CPU). CO-RE's answer: the kernel publishes its own type info as <strong>BTF</strong> (BPF Type Format) at <code>/sys/kernel/btf/vmlinux</code>, the compiler records field accesses as relocations, and libbpf patches the offsets at load time. Build once, ship a 100 KB binary, run on any BTF-enabled kernel.</p>
${EB_CORE}
<p><strong>Kernel milestones</strong> that decide what you can run: 4.1 kprobes · 4.7 tracepoints · 4.8 XDP · 4.18 BTF · 5.2 1M-instruction limit · 5.3 bounded loops · 5.5 fentry/fexit · 5.7 LSM BPF · 5.8 ring buffer, CAP_BPF · 5.11 memcg-accounted maps · 6.6 tcx. In practice: 5.10+ is the comfortable floor, 5.15/6.1+ LTS is what modern agents target. BTF ships by default in Ubuntu 20.10+, RHEL 8.2+, Debian 11+, Amazon Linux 2 (5.10 kernel) / AL2023, Bottlerocket and COS. For older kernels, BTFHub provides external BTF files.</p>
<p><strong>Privileges.</strong> Since 5.8, root is split: <code>CAP_BPF</code> (load programs, create maps) + <code>CAP_PERFMON</code> (tracing programs, reading kernel memory) or <code>CAP_NET_ADMIN</code> (XDP, tc, networking types). Unprivileged eBPF is off by default (<code>kernel.unprivileged_bpf_disabled = 2</code> on most distros). Treat anything with <code>CAP_BPF</code> as root-equivalent on the node: it can read any process's memory.</p>`,
          he: `<p><strong>Maps</strong> הם מבני key/value שחיים ב-kernel, וגם התוכנית וגם user space יכולים לגשת אליהם (user space דרך <code>bpf(BPF_MAP_LOOKUP_ELEM...)</code> על fd של ה-map). הם מחזיקים state בין אירועים, קונפיגורציה שנדחפת מ-user space ותוצאות שזורמות החוצה.</p>
<table>
<tr><th>סוג map</th><th>משתמשים בו ל</th></tr>
<tr><td><code>HASH</code> / <code>ARRAY</code></td><td>מונים לכל key, טבלאות קונפיגורציה, הטבלה של Service ל-backend ב-Cilium. Array זה אינדקס קבוע, מוקצה מראש.</td></tr>
<tr><td><code>PERCPU_HASH</code> / <code>PERCPU_ARRAY</code></td><td>מונים חמים בלי atomics ובלי קפיצות של cache lines בין ליבות; user space סוכם את הערכים של כל CPU.</td></tr>
<tr><td><code>LRU_HASH</code></td><td>טבלאות חסומות שאסור שיתמלאו: connection tracking, flow caches. מפנה את הרשומה שהכי מזמן לא נגעו בה.</td></tr>
<tr><td><code>RINGBUF</code> (מ-5.8)</td><td>הזרמת אירועים ל-user space: buffer אחד משותף, מסודר וחסכוני בזיכרון (מחליף את <code>PERF_EVENT_ARRAY</code> שהוא לכל CPU).</td></tr>
<tr><td><code>LPM_TRIE</code>, <code>PROG_ARRAY</code>, <code>STACK_TRACE</code></td><td>התאמת CIDR, טבלאות קפיצה ל-tail calls, מזהי stack ל-profilers.</td></tr>
</table>
<p><strong>Helpers</strong> הם ה-API היחיד של ה-kernel שתוכנית מקבלת: <code>bpf_map_lookup_elem</code>, <code>bpf_get_current_pid_tgid</code>, <code>bpf_get_current_comm</code>, <code>bpf_ktime_get_ns</code>, <code>bpf_probe_read_kernel/user</code>, <code>bpf_ringbuf_reserve/submit</code>, <code>bpf_redirect</code>. ב-kernels חדשים יש גם <em>kfuncs</em>: פונקציות kernel שנחשפות ל-BPF, עם פחות הבטחת ABI.</p>
<p><strong>CO-RE ו-BTF.</strong> ה-structs של ה-kernel (<code>task_struct</code>, <code>sk_buff</code>) משנים layout בין גרסאות וקונפיגורציות. הפתרון הישן של BCC: לקמפל על כל node בזמן העלייה עם kernel headers (יותר מ-100 MB של LLVM ושניות של CPU). הפתרון של CO-RE: ה-kernel מפרסם את מידע הטיפוסים שלו בפורמט <strong>BTF</strong> (BPF Type Format) ב-<code>/sys/kernel/btf/vmlinux</code>, הקומפיילר רושם גישות לשדות כ-relocations, ו-libbpf מתקן את ה-offsets בזמן הטעינה. בונים פעם אחת, שולחים בינארי של 100 KB, ורצים על כל kernel עם BTF.</p>
${EB_CORE}
<p><strong>אבני דרך ב-kernel</strong> שקובעות מה אפשר להריץ: 4.1 kprobes · 4.7 tracepoints · 4.8 XDP · 4.18 BTF · 5.2 גבול של מיליון הוראות · 5.3 לולאות חסומות · 5.5 fentry/fexit · 5.7 LSM BPF · 5.8 ring buffer ו-CAP_BPF · 5.11 maps שנספרים ב-memcg · 6.6 tcx. בפועל: 5.10 ומעלה זו רצפה נוחה, ו-agents מודרניים מכוונים ל-LTS של 5.15/6.1 ומעלה. BTF מגיע כברירת מחדל ב-Ubuntu 20.10+, RHEL 8.2+, Debian 11+, Amazon Linux 2 (עם kernel 5.10) ו-AL2023, Bottlerocket ו-COS. ל-kernels ישנים יותר יש את BTFHub עם קבצי BTF חיצוניים.</p>
<p><strong>הרשאות.</strong> מ-5.8 ההרשאות של root מפוצלות: <code>CAP_BPF</code> (טעינת תוכניות, יצירת maps) ועוד <code>CAP_PERFMON</code> (תוכניות tracing, קריאת זיכרון kernel) או <code>CAP_NET_ADMIN</code> (XDP, tc, סוגי רשת). eBPF בלי הרשאות כבוי כברירת מחדל (<code>kernel.unprivileged_bpf_disabled = 2</code> ברוב ההפצות). כל מה שיש לו <code>CAP_BPF</code> שווה ערך ל-root על ה-node: הוא יכול לקרוא זיכרון של כל תהליך.</p>`
        }
      },
      {
        h: { en: "One idea, three ways: count execve per process", he: "רעיון אחד, שלוש דרכים: לספור execve לכל תהליך" },
        body: {
          en: `<p>Goal: which processes spawn the most programs? (A classic way to catch a sidecar or cron job forking thousands of short-lived processes.) <strong>bpftrace</strong> does it in one line: it compiles the script to BPF, creates a hash map for <code>@execs</code>, attaches to the stable tracepoint, and prints the map on Ctrl-C.</p>
${EB_BPFTRACE}
<p>Note: at <code>sys_enter_execve</code>, <code>comm</code> is still the <em>caller's</em> name (the process before it becomes the new program), so this counts who launches things. Use <code>sched:sched_process_exec</code> to count what got launched.</p>
<p>The same program written for production with <strong>libbpf + CO-RE</strong>: a kernel-side C file, a generated skeleton, and a small user-space loader. This is how Cilium, Tetragon and Falco's modern driver are built.</p>
${EB_LIBBPF}
<p>And with <strong>BCC</strong> in Python, convenient for ad-hoc tools, but it needs clang/LLVM and kernel headers on the node and compiles at every start:</p>
${EB_BCC}
<p>Then inspect what you loaded with <strong>bpftool</strong>, the Swiss army knife that talks to the <code>bpf()</code> syscall directly:</p>
${EB_BPFTOOL}`,
          he: `<p>המטרה: אילו תהליכים מריצים הכי הרבה תוכניות? (דרך קלאסית לתפוס sidecar או cron job שעושה fork לאלפי תהליכים קצרים.) <strong>bpftrace</strong> עושה את זה בשורה אחת: מקמפל את הסקריפט ל-BPF, יוצר hash map בשביל <code>@execs</code>, מתחבר ל-tracepoint היציב ומדפיס את ה-map כשלוחצים Ctrl-C.</p>
${EB_BPFTRACE}
<p>שים לב: ב-<code>sys_enter_execve</code> ה-<code>comm</code> הוא עדיין השם של <em>מי שקורא</em> (התהליך לפני שהוא הופך לתוכנית החדשה), אז זה סופר מי מריץ דברים. כדי לספור מה הורץ, משתמשים ב-<code>sched:sched_process_exec</code>.</p>
<p>אותה תוכנית בגרסת פרודקשן עם <strong>libbpf ו-CO-RE</strong>: קובץ C בצד ה-kernel, skeleton שנוצר אוטומטית ו-loader קטן ב-user space. ככה בנויים Cilium, Tetragon וה-driver המודרני של Falco.</p>
${EB_LIBBPF}
<p>ועם <strong>BCC</strong> ב-Python, נוח לכלים אד-הוק, אבל הוא צריך clang/LLVM ו-kernel headers על ה-node ומקמפל בכל הפעלה:</p>
${EB_BCC}
<p>אחר כך בודקים מה טענת עם <strong>bpftool</strong>, האולר השוויצרי שמדבר ישירות עם ה-syscall <code>bpf()</code>:</p>
${EB_BPFTOOL}`
        }
      },
      {
        h: { en: "Overhead and security: what it really costs", he: "Overhead ואבטחה: כמה זה עולה באמת" },
        body: {
          en: `<p><strong>Overhead</strong> = cost per event × event rate. Rough numbers on modern x86 with JIT:</p>
<ul>
<li>tracepoint / fentry: tens of nanoseconds per hit; kprobe: roughly 50-100 ns; uprobe: 1-3 µs because each hit traps into the kernel.</li>
<li>A counter on <code>sys_enter_execve</code> (hundreds/sec) is free. The same counter on <code>raw_syscalls:sys_enter</code> on a box doing 2M syscalls/sec costs ~0.1-0.2 CPU cores. A uprobe on <code>malloc</code> in a busy JVM can double its latency.</li>
<li>Aggregate in the kernel (maps, histograms) instead of shipping every event to user space; when you must stream, use a ring buffer and filter in-kernel first.</li>
<li>XDP drops on the order of 10-25 million packets/sec per core in benchmarks, several times what iptables can do, because it acts before memory for an <code>sk_buff</code> is allocated.</li>
<li>Check <code>sysctl kernel.bpf_stats_enabled=1</code> and then <code>bpftool prog show</code>: it adds <code>run_time_ns</code> and <code>run_cnt</code> per program, so you can measure what each agent really costs.</li>
</ul>
<p><strong>Security considerations:</strong></p>
<ul>
<li>A pod that can load eBPF owns the node: it can read other containers' memory (<code>bpf_probe_read_user</code>), sniff TLS before encryption via uprobes, hide processes, or drop traffic. Never grant <code>CAP_BPF</code>/<code>CAP_SYS_ADMIN</code> to workloads; restrict eBPF agents to dedicated, signed images in a locked namespace.</li>
<li>Keep <code>kernel.unprivileged_bpf_disabled</code> at 1 or 2, and consider <code>kernel.kptr_restrict</code> and lockdown mode on sensitive nodes.</li>
<li>Audit what's loaded: <code>bpftool prog list</code> shows every program with its owner pid. eBPF rootkits (BPFDoor-style backdoors used <em>classic</em> BPF filters to listen for magic packets) are a real threat model; a periodic inventory of loaded programs vs. an allowlist catches surprises.</li>
<li>Patch the kernel: verifier CVEs are the escalation path. That's also why LSM BPF and signed BPF programs are active kernel work.</li>
</ul>
<blockquote>💡 Real world: Netflix, Meta and Google run dozens of eBPF programs on every server: Meta's Katran load balancer and per-host firewalling, Netflix's flow logs for every network connection, Google's GKE Dataplane V2. Meta reported roughly 40 eBPF programs loaded on a typical server back in 2020, a number that has only grown.</blockquote>`,
          he: `<p><strong>Overhead</strong> = עלות לכל אירוע × קצב האירועים. מספרים בקירוב על x86 מודרני עם JIT:</p>
<ul>
<li>tracepoint / fentry: עשרות ננו-שניות לפגיעה; kprobe: בערך 50-100 ns; uprobe: 1-3 µs, כי כל פגיעה עושה trap ל-kernel.</li>
<li>מונה על <code>sys_enter_execve</code> (מאות בשנייה) הוא בחינם. אותו מונה על <code>raw_syscalls:sys_enter</code> במכונה שעושה 2M syscalls בשנייה עולה בערך 0.1-0.2 ליבות CPU. uprobe על <code>malloc</code> ב-JVM עמוס יכול להכפיל את ה-latency שלו.</li>
<li>מצברים בתוך ה-kernel (maps, histograms) במקום לשלוח כל אירוע ל-user space; כשחייבים להזרים, משתמשים ב-ring buffer ומסננים קודם בתוך ה-kernel.</li>
<li>XDP מפיל בסדר גודל של 10-25 מיליון packets בשנייה לליבה ב-benchmarks, כמה מונים יותר ממה ש-iptables מסוגל, כי הוא פועל לפני שמוקצה זיכרון ל-<code>sk_buff</code>.</li>
<li>מפעילים <code>sysctl kernel.bpf_stats_enabled=1</code> ואז <code>bpftool prog show</code> מוסיף <code>run_time_ns</code> ו-<code>run_cnt</code> לכל תוכנית, וככה מודדים כמה כל agent עולה באמת.</li>
</ul>
<p><strong>שיקולי אבטחה:</strong></p>
<ul>
<li>pod שיכול לטעון eBPF שולט ב-node: הוא יכול לקרוא זיכרון של קונטיינרים אחרים (<code>bpf_probe_read_user</code>), להסניף TLS לפני ההצפנה דרך uprobes, להסתיר תהליכים או להפיל תעבורה. אף פעם לא נותנים <code>CAP_BPF</code> או <code>CAP_SYS_ADMIN</code> ל-workloads; agents של eBPF רצים רק מ-images ייעודיים וחתומים ב-namespace נעול.</li>
<li>משאירים את <code>kernel.unprivileged_bpf_disabled</code> על 1 או 2, ושוקלים <code>kernel.kptr_restrict</code> ו-lockdown mode על nodes רגישים.</li>
<li>עושים audit למה שטעון: <code>bpftool prog list</code> מראה כל תוכנית עם ה-pid של הבעלים. rootkits מבוססי BPF הם איום אמיתי (backdoors בסגנון BPFDoor השתמשו בפילטרים של BPF <em>קלאסי</em> כדי להאזין ל-magic packets); מצאי תקופתי של תוכניות טעונות מול allowlist תופס הפתעות.</li>
<li>מעדכנים את ה-kernel: CVEs ב-verifier הם הדרך ל-escalation. זו גם הסיבה ש-LSM BPF ותוכניות BPF חתומות הם תחום פעיל בפיתוח ה-kernel.</li>
</ul>
<blockquote>💡 מהשטח: Netflix, Meta ו-Google מריצות עשרות תוכניות eBPF על כל שרת: ה-load balancer Katran ו-firewall לכל host ב-Meta, flow logs לכל חיבור רשת ב-Netflix, ו-GKE Dataplane V2 ב-Google. Meta דיווחה כבר ב-2020 על כ-40 תוכניות eBPF טעונות בשרת טיפוסי, והמספר רק גדל.</blockquote>`
        }
      }
    ],
    diagram: "  user space                              kernel\n  ----------                              ------\n  prog.bpf.c --clang--> prog.bpf.o\n  loader (libbpf/bpftrace) --bpf(PROG_LOAD)--> [verifier] --ok--> [JIT] --> attach\n                                                   |                          |\n                                                reject + log                  v\n                                                         tracepoint | kprobe | fentry | uprobe\n                                                         XDP | tc | cgroup | LSM | perf_event\n                                                                          |\n  reader / exporter <---- bpf(MAP_LOOKUP) / ring buffer ----  [ maps: hash, array, percpu, lru, ringbuf ]",
    handsOn: [
      { cmd: "sudo bpftrace -e 'tracepoint:syscalls:sys_enter_execve { @execs[comm] = count(); }'", what: { en: "Count execve calls per calling process; press Ctrl-C after 30 seconds and read the hash map bpftrace prints.", he: "סופרים קריאות execve לכל תהליך קורא; לוחצים Ctrl-C אחרי 30 שניות וקוראים את ה-hash map ש-bpftrace מדפיס." } },
      { cmd: "sudo bpftool prog list && sudo bpftool map list", what: { en: "Inventory every eBPF program and map loaded on the node, with owner pids, JIT size and memlock.", he: "מצאי של כל תוכנית ו-map של eBPF שטעונים על ה-node, עם pid של הבעלים, גודל אחרי JIT ו-memlock." } },
      { cmd: "ls -lh /sys/kernel/btf/vmlinux; uname -r; sudo bpftool feature probe kernel | grep -E 'program_type|map_type' | head -30", what: { en: "Check that BTF exists (CO-RE tools need it) and which program and map types this kernel supports.", he: "בודקים שיש BTF (כלי CO-RE צריכים אותו) ואילו סוגי תוכניות ו-maps ה-kernel הזה תומך בהם." } },
      { cmd: "sudo bpftrace -l 'tracepoint:syscalls:sys_enter_open*' && sudo bpftrace -lv 'tracepoint:syscalls:sys_enter_openat'", what: { en: "List stable tracepoints and show the argument fields you can read from one.", he: "מציגים tracepoints יציבים ואת שדות הארגומנטים שאפשר לקרוא מאחד מהם." } },
      { cmd: "sudo sysctl kernel.bpf_stats_enabled=1; sleep 10; sudo bpftool prog show | grep -E 'name|run_time_ns'", what: { en: "Measure real per-program CPU cost (run_time_ns, run_cnt), then turn stats off again.", he: "מודדים את עלות ה-CPU האמיתית של כל תוכנית (run_time_ns, run_cnt), ואז מכבים שוב את הסטטיסטיקות." } }
    ],
    mnemonic: {
      en: "C-L-V-J-A-M: Compile, Load, Verify, JIT, Attach, Maps. 'Can Linux Verify Just Any Module? No, only eBPF.'",
      he: "C-L-V-J-A-M: ‏Compile, Load, Verify, JIT, Attach, Maps. קומפיילר מייצר, ה-kernel בודק, ה-hook מריץ, וה-maps מדברים החוצה."
    },
    pitfalls: [
      { en: "Building on kprobes when a tracepoint exists: kernel function names change or get inlined between versions, and your tool silently breaks on the next upgrade. Prefer tracepoints, then fentry, then kprobes.", he: "לבנות על kprobes כשיש tracepoint: שמות פונקציות ב-kernel משתנים או עוברים inline בין גרסאות, והכלי שלך נשבר בשקט בשדרוג הבא. עדיף tracepoints, אחר כך fentry, ורק אז kprobes." },
      { en: "Streaming every event to user space: at millions of events per second the ring buffer drops and the agent eats cores. Filter and aggregate in the kernel; send summaries.", he: "להזרים כל אירוע ל-user space: במיליוני אירועים בשנייה ה-ring buffer מאבד אירועים וה-agent אוכל ליבות. מסננים ומצברים בתוך ה-kernel ושולחים סיכומים." },
      { en: "Assuming BTF is everywhere: custom or old kernels built without CONFIG_DEBUG_INFO_BTF make every CO-RE tool fail with 'failed to find valid kernel BTF'. Check /sys/kernel/btf/vmlinux in your image pipeline.", he: "להניח שיש BTF בכל מקום: kernels ישנים או custom שנבנו בלי CONFIG_DEBUG_INFO_BTF גורמים לכל כלי CO-RE להיכשל עם 'failed to find valid kernel BTF'. בודקים את /sys/kernel/btf/vmlinux ב-pipeline של ה-image." },
      { en: "Treating 'verified' as 'harmless': the verifier prevents crashes, not data theft or dropping all traffic. Anything that can load eBPF is root on the node.", he: "להתייחס ל'עבר verifier' כ'לא מזיק': ה-verifier מונע קריסות, לא גניבת מידע או הפלת כל התעבורה. כל מה שיכול לטעון eBPF הוא root על ה-node." }
    ],
    interview: [
      {
        q: { en: "Why is eBPF safer than a kernel module, and what are its limits?", he: "למה eBPF בטוח יותר מ-kernel module, ומה המגבלות שלו?" },
        a: { en: "A module is arbitrary native code with full kernel access; a bug panics the machine. eBPF bytecode must pass the verifier, which proves termination (bounded loops, 1M processed-instruction budget), memory safety (bounds and NULL checks, initialized stack, 512-byte stack) and that only allowed helpers are called, before the JIT compiles it. The trade-offs: you can't call arbitrary kernel functions, complex logic hits verifier limits, and safety isn't harmlessness: a verified program can still read sensitive memory or drop packets, and verifier bugs have been privilege-escalation CVEs, so loading requires CAP_BPF plus CAP_PERFMON or CAP_NET_ADMIN.", he: "module זה קוד native שרירותי עם גישה מלאה ל-kernel; באג מפיל את המכונה ב-panic. bytecode של eBPF חייב לעבור את ה-verifier, שמוכיח סיום (לולאות חסומות, תקציב של מיליון הוראות מעובדות), בטיחות זיכרון (בדיקות גבולות ו-NULL, stack מאותחל, stack של 512 בייט) ושנקראים רק helpers מותרים, ורק אז ה-JIT מקמפל אותו. המחיר: אי אפשר לקרוא לכל פונקציה ב-kernel, לוגיקה מורכבת נתקעת בגבולות של ה-verifier, ובטוח זה לא אומר לא מזיק: תוכנית מאומתת עדיין יכולה לקרוא זיכרון רגיש או להפיל packets, ובאגים ב-verifier היו CVEs של privilege escalation, ולכן טעינה דורשת CAP_BPF יחד עם CAP_PERFMON או CAP_NET_ADMIN." }
      },
      {
        q: { en: "What problem does CO-RE solve, and what breaks without BTF?", he: "איזו בעיה CO-RE פותר, ומה נשבר בלי BTF?" },
        a: { en: "Kernel struct layouts differ across versions and configs, so a compiled program reading task_struct->real_parent at a fixed offset would read garbage elsewhere. BCC solved it by compiling on each node with kernel headers: heavy (LLVM, headers, CPU at startup) and fragile. CO-RE records field accesses as relocations; at load time libbpf reads the running kernel's BTF from /sys/kernel/btf/vmlinux and patches offsets, so one small binary runs across kernels. Without BTF (CONFIG_DEBUG_INFO_BTF off, pre-4.18 kernels, some custom builds), CO-RE loaders fail with 'failed to find valid kernel BTF'; fixes are a BTF-enabled kernel, external BTF from BTFHub, or falling back to a kernel-module/legacy driver.", he: "ה-layout של structs ב-kernel שונה בין גרסאות וקונפיגורציות, אז תוכנית מקומפלת שקוראת task_struct->real_parent ב-offset קבוע תקרא זבל ב-kernel אחר. BCC פתר את זה בקימפול על כל node עם kernel headers: כבד (LLVM, headers, CPU בעלייה) ושביר. CO-RE רושם גישות לשדות כ-relocations; בזמן הטעינה libbpf קורא את ה-BTF של ה-kernel הרץ מ-/sys/kernel/btf/vmlinux ומתקן offsets, כך שבינארי קטן אחד רץ על פני kernels. בלי BTF ‏(CONFIG_DEBUG_INFO_BTF כבוי, kernels לפני 4.18, חלק מה-builds ה-custom) ה-loaders של CO-RE נכשלים עם 'failed to find valid kernel BTF'; הפתרונות הם kernel עם BTF, קובץ BTF חיצוני מ-BTFHub, או חזרה ל-driver של kernel module או legacy." }
      },
      {
        q: { en: "You need to count TCP retransmits per destination on 2,000 nodes. kprobe, tracepoint, or something else?", he: "צריך לספור TCP retransmits לכל יעד על 2,000 nodes. kprobe, tracepoint או משהו אחר?" },
        a: { en: "Use the tcp:tcp_retransmit_skb tracepoint (stable since 4.15) rather than a kprobe on tcp_retransmit_skb, which is an internal function that can change. Aggregate in a per-CPU or LRU hash keyed by daddr/dport so the map can't grow unbounded, and have the user-space agent scrape and export counters (e.g. as Prometheus metrics) every few seconds instead of streaming events. Build with libbpf/CO-RE so one binary works across the fleet's kernels, and gate rollout on a canary node pool with each kernel version.", he: "משתמשים ב-tracepoint ‏tcp:tcp_retransmit_skb (יציב מ-4.15) ולא ב-kprobe על tcp_retransmit_skb, שהיא פונקציה פנימית שיכולה להשתנות. מצברים ב-hash מסוג per-CPU או LRU עם key של daddr/dport כדי שה-map לא יגדל בלי גבול, וה-agent ב-user space אוסף ומייצא מונים (למשל כמטריקות Prometheus) כל כמה שניות במקום להזרים אירועים. בונים עם libbpf ו-CO-RE כדי שבינארי אחד יעבוד על כל ה-kernels ב-fleet, ומעבירים כל גרסת kernel דרך node pool של canary לפני rollout." }
      }
    ],
    quiz: [
      {
        q: { en: "Your program does bpf_map_lookup_elem() and immediately increments the result. The load fails with \"R0 invalid mem access 'map_value_or_null'\". Why?", he: "התוכנית שלך קוראת ל-bpf_map_lookup_elem() ומיד מגדילה את התוצאה. הטעינה נכשלת עם \"R0 invalid mem access 'map_value_or_null'\". למה?" },
        options: [
          { en: "The map is too small", he: "ה-map קטן מדי" },
          { en: "The lookup can return NULL and the verifier requires a NULL check before dereferencing", he: "ה-lookup יכול להחזיר NULL וה-verifier דורש בדיקת NULL לפני גישה דרך ה-pointer" },
          { en: "The JIT is disabled", he: "ה-JIT כבוי" },
          { en: "You need CAP_PERFMON", he: "חסר לך CAP_PERFMON" }
        ],
        answer: 1,
        explain: { en: "The verifier tracks R0 as map_value_or_null after a lookup. Only after an explicit if (val) check does that path see a valid map_value pointer.", he: "ה-verifier מסמן את R0 כ-map_value_or_null אחרי lookup. רק אחרי בדיקה מפורשת if (val) המסלול הזה רואה pointer תקין מסוג map_value." }
      },
      {
        q: { en: "Which hook is the best choice for a tool that must keep working across kernel upgrades?", he: "איזה hook הכי מתאים לכלי שצריך להמשיך לעבוד גם אחרי שדרוגי kernel?" },
        options: [
          { en: "kprobe on an internal kernel function", he: "kprobe על פונקציה פנימית של ה-kernel" },
          { en: "A tracepoint", he: "tracepoint" },
          { en: "A uprobe on libc", he: "uprobe על libc" },
          { en: "XDP", he: "XDP" }
        ],
        answer: 1,
        explain: { en: "Tracepoints are static instrumentation points with a stable ABI. kprobes attach to function names that can be renamed or inlined in the next kernel.", he: "tracepoints הם נקודות instrumentation סטטיות עם ABI יציב. kprobes מתחברים לשמות פונקציות שיכולים לשנות שם או לעבור inline ב-kernel הבא." }
      },
      {
        q: { en: "What does /sys/kernel/btf/vmlinux enable?", he: "מה /sys/kernel/btf/vmlinux מאפשר?" },
        options: [
          { en: "It is the JIT compiler", he: "הוא ה-JIT compiler" },
          { en: "It stores pinned maps", he: "הוא שומר maps שעשו להם pin" },
          { en: "It exposes the running kernel's type info so CO-RE loaders can relocate struct field offsets", he: "הוא חושף את מידע הטיפוסים של ה-kernel הרץ כדי ש-loaders של CO-RE יוכלו לתקן offsets של שדות ב-structs" },
          { en: "It lists loaded programs", he: "הוא מציג את התוכניות הטעונות" }
        ],
        answer: 2,
        explain: { en: "BTF describes kernel types. libbpf uses it at load time to patch field accesses recorded as CO-RE relocations, and bpftool generates vmlinux.h from it. Pinned objects live in /sys/fs/bpf.", he: "BTF מתאר את הטיפוסים של ה-kernel. libbpf משתמש בו בזמן הטעינה כדי לתקן גישות לשדות שנרשמו כ-relocations של CO-RE, ו-bpftool מייצר ממנו את vmlinux.h. אובייקטים עם pin חיים ב-/sys/fs/bpf." }
      },
      {
        q: { en: "Which map type is designed for streaming events from many CPUs to user space in order, with shared memory?", he: "איזה סוג map מיועד להזרמת אירועים מהרבה CPUs ל-user space לפי הסדר, עם זיכרון משותף?" },
        options: [
          { en: "LRU_HASH", he: "LRU_HASH" },
          { en: "PERCPU_ARRAY", he: "PERCPU_ARRAY" },
          { en: "RINGBUF", he: "RINGBUF" },
          { en: "LPM_TRIE", he: "LPM_TRIE" }
        ],
        answer: 2,
        explain: { en: "BPF_MAP_TYPE_RINGBUF (5.8+) is a single multi-producer buffer shared by all CPUs, preserving event order and wasting less memory than per-CPU perf buffers.", he: "BPF_MAP_TYPE_RINGBUF (מ-5.8) הוא buffer אחד עם הרבה כותבים שמשותף לכל ה-CPUs, שומר על סדר האירועים ומבזבז פחות זיכרון מ-perf buffers לכל CPU." }
      }
    ],
    playground: "terminal",
    related: ["linux-perf-tracing", "staff-ebpf-cilium", "container-internals", "container-security", "linux-kernel-tuning", "ebpf-ecosystem"]
  });

  /* =============================== LESSON 2 =============================== */
  INFRA.lessons.push({
    id: "ebpf-ecosystem",
    track: "linux",
    order: 41,
    icon: "🧰",
    level: 3,
    minutes: 18,
    title: { en: "The eBPF Ecosystem in Practice", he: "האקוסיסטם של eBPF בפרקטיקה" },
    tldr: {
      en: "Most teams never write eBPF; they run tools built on it. Networking (XDP DDoS drop, Cilium, Katran) hooks the NIC driver, tc and sockets; observability (Hubble, Pixie, Beyla/OTel, Parca/Pyroscope) hooks sockets, uprobes and perf events; security (Falco, Tetragon, Tracee) hooks syscalls, kprobes and LSM. Choose by hook and kernel support, and treat kernel upgrades as eBPF upgrades.",
      he: "רוב הצוותים אף פעם לא כותבים eBPF; הם מריצים כלים שבנויים עליו. רשת (הפלת DDoS ב-XDP, ‏Cilium, ‏Katran) מתחברת ל-driver של כרטיס הרשת, ל-tc ול-sockets; observability (‏Hubble, ‏Pixie, ‏Beyla/OTel, ‏Parca/Pyroscope) מתחבר ל-sockets, ל-uprobes ול-perf events; אבטחה (Falco, ‏Tetragon, ‏Tracee) מתחברת ל-syscalls, ל-kprobes ול-LSM. בוחרים לפי ה-hook והתמיכה ב-kernel, ומתייחסים לכל שדרוג kernel כאל שדרוג eBPF."
    },
    analogy: {
      en: "eBPF is the power grid in a building; the tools are appliances. The bouncer at the front door (XDP) throws out troublemakers before they enter the lobby. The CCTV system (Hubble, Pixie, profilers) watches hallways and records who talked to whom. The security guards (Falco watches and radios in; Tetragon can also tackle). They all plug into different sockets in the wall, and if the electrician swaps the wiring (a kernel upgrade), some plugs no longer fit.",
      he: "eBPF הוא רשת החשמל של הבניין; הכלים הם מכשירי החשמל. הסלקטור בכניסה (XDP) זורק את הבעייתיים עוד לפני שהם נכנסים ללובי. מערכת המצלמות (Hubble, ‏Pixie, ה-profilers) צופה במסדרונות ומקליטה מי דיבר עם מי. המאבטחים: Falco צופה ומדווח בקשר, Tetragon גם יכול להפיל לרצפה. כולם מתחברים לשקעים שונים בקיר, ואם החשמלאי מחליף חיווט (שדרוג kernel), חלק מהתקעים כבר לא נכנסים."
    },
    sections: [
      {
        h: { en: "Networking: XDP DDoS drop, Cilium, Katran", he: "רשת: הפלת DDoS ב-XDP, ‏Cilium, ‏Katran" },
        body: {
          en: `<p><strong>XDP</strong> runs in the NIC driver's receive path and returns a verdict: <code>XDP_DROP</code>, <code>XDP_PASS</code> (continue to the normal stack), <code>XDP_TX</code> (bounce out the same NIC), <code>XDP_REDIRECT</code> (another NIC, CPU or AF_XDP socket) or <code>XDP_ABORTED</code>. Modes: <em>native</em> (driver support: mlx5, ixgbe, i40e, ena, virtio_net...), <em>generic</em> (after skb allocation; works everywhere, slow), <em>offload</em> (runs on SmartNICs like Netronome). The canonical use is dropping attack traffic before it costs anything:</p>
${EB_XDP}
<p>Cloudflare's L4 DDoS mitigation pushes attack fingerprints into XDP programs on every edge server; dropping in XDP keeps CPUs free to serve legitimate traffic during multi-hundred-Gbps floods.</p>
<p><strong>Cilium</strong> (covered in depth in <code>staff-ebpf-cilium</code>) uses several hooks at once: a <code>cgroup/connect4</code> program translates a Service VIP to a backend at <code>connect()</code> time (socket-level LB, so no per-packet NAT for pod traffic), <code>tc</code> programs on every veth and the host NIC enforce identity-based policy and do NAT for external traffic, optional XDP accelerates NodePort/LoadBalancer, and per-node maps replace iptables chains and conntrack (<code>cilium-dbg bpf lb list</code>, <code>cilium-dbg bpf ct list global</code>).</p>
<p><strong>Katran</strong> is Meta's open-source L4 load balancer: an XDP program that picks a backend with Maglev-style consistent hashing, wraps the packet in IPIP/GUE and sends it with <code>XDP_TX</code>; backends reply directly to clients (DSR). It replaced IPVS at Meta; scale comes from ECMP across many Katran hosts, each doing millions of packets per second per core.</p>
<blockquote>⚠️ Production tip: XDP is ingress-only and sees raw frames: no conntrack, no reassembly, VLAN/tunnel headers are yours to parse. Generic mode on a NIC without native support silently gives you a fraction of the performance; check <code>ip -d link</code> shows <code>xdpdrv</code>/<code>prog/xdp</code> in native mode, and check your cloud NIC (ENA, gVNIC, MANA) driver version supports it.</blockquote>`,
          he: `<p><strong>XDP</strong> רץ בנתיב הקבלה של ה-driver של כרטיס הרשת ומחזיר החלטה: <code>XDP_DROP</code>, ‏<code>XDP_PASS</code> (ממשיכים ל-stack הרגיל), ‏<code>XDP_TX</code> (מחזירים החוצה דרך אותו כרטיס), ‏<code>XDP_REDIRECT</code> (לכרטיס אחר, ל-CPU אחר או ל-socket של AF_XDP) או <code>XDP_ABORTED</code>. מצבים: <em>native</em> (תמיכה ב-driver: ‏mlx5, ‏ixgbe, ‏i40e, ‏ena, ‏virtio_net...), <em>generic</em> (אחרי הקצאת skb; עובד בכל מקום, איטי), <em>offload</em> (רץ על SmartNICs כמו Netronome). השימוש הקנוני הוא להפיל תעבורת תקיפה לפני שהיא עולה משהו:</p>
${EB_XDP}
<p>מערך ה-DDoS של Cloudflare ל-L4 דוחף טביעות אצבע של התקפות לתוכניות XDP על כל שרת edge; הפלה ב-XDP משאירה את ה-CPUs פנויים לתעבורה לגיטימית גם בהצפות של מאות Gbps.</p>
<p><strong>Cilium</strong> (מוסבר לעומק ב-<code>staff-ebpf-cilium</code>) משתמש בכמה hooks במקביל: תוכנית <code>cgroup/connect4</code> מתרגמת VIP של Service ל-backend בזמן ה-<code>connect()</code> (LB ברמת socket, כך שאין NAT לכל packet בתעבורה בין pods), תוכניות <code>tc</code> על כל veth ועל כרטיס הרשת של ה-host אוכפות policy לפי זהות ועושות NAT לתעבורה חיצונית, XDP אופציונלי מאיץ NodePort/LoadBalancer, ו-maps לכל node מחליפים שרשראות iptables ו-conntrack (<code>cilium-dbg bpf lb list</code>, ‏<code>cilium-dbg bpf ct list global</code>).</p>
<p><strong>Katran</strong> הוא ה-load balancer של L4 בקוד פתוח של Meta: תוכנית XDP שבוחרת backend עם consistent hashing בסגנון Maglev, עוטפת את ה-packet ב-IPIP/GUE ושולחת אותו עם <code>XDP_TX</code>; ה-backends עונים ישירות ללקוחות (DSR). הוא החליף את IPVS ב-Meta; הסקייל מגיע מ-ECMP על פני הרבה hosts של Katran, כשכל אחד מעבד מיליוני packets בשנייה לליבה.</p>
<blockquote>⚠️ טיפ לפרודקשן: XDP עובד רק ב-ingress ורואה frames גולמיים: אין conntrack, אין הרכבה מחדש של fragments, ואת ה-headers של VLAN או tunnel אתה מפענח לבד. מצב generic על כרטיס בלי תמיכה native נותן לך בשקט רק חלק קטן מהביצועים; תוודא ש-<code>ip -d link</code> מראה <code>xdpdrv</code>/<code>prog/xdp</code> במצב native, ותבדוק שגרסת ה-driver של כרטיס הרשת בענן (ENA, ‏gVNIC, ‏MANA) תומכת בזה.</blockquote>`
        }
      },
      {
        h: { en: "Observability: Hubble, Pixie, Beyla/OTel, eBPF profilers", he: "Observability: ‏Hubble, ‏Pixie, ‏Beyla/OTel, ‏profilers מבוססי eBPF" },
        body: {
          en: `<p>The promise: telemetry for every workload on day one, without touching application code. Each tool gets there through different hooks:</p>
<table>
<tr><th>Tool</th><th>Hooks</th><th>What you get</th><th>Watch out for</th></tr>
<tr><td><strong>Hubble</strong> (Cilium)</td><td>Events emitted by Cilium's own tc/socket datapath programs into a perf/ring buffer</td><td>Every flow with verdict (FORWARDED/DROPPED + reason), DNS, HTTP/gRPC/Kafka metadata when L7 visibility is on; service map; Prometheus metrics</td><td>Needs Cilium as CNI; L7 detail only through the proxy</td></tr>
<tr><td><strong>Pixie</strong> (CNCF sandbox)</td><td>kprobes on <code>send/recv/read/write</code> syscalls + uprobes on OpenSSL/BoringSSL and Go <code>crypto/tls</code> to see plaintext</td><td>Full HTTP/gRPC/MySQL/Postgres/Redis/Kafka request bodies and latency, queried with PxL scripts</td><td>Data kept in-cluster in memory (hours, not weeks); per-node memory cost (GBs)</td></tr>
<tr><td><strong>Beyla</strong> / OpenTelemetry eBPF Instrumentation (OBI)</td><td>uprobes on Go runtime and HTTP/gRPC libraries, kprobes on socket syscalls for other languages</td><td>OTel RED metrics and spans per service, exported via OTLP; Grafana donated Beyla to OpenTelemetry in 2025</td><td>Limited context propagation across async hops; no business attributes</td></tr>
<tr><td><strong>Parca Agent</strong>, <strong>Pyroscope</strong> (Grafana Alloy), <strong>OTel eBPF profiler</strong></td><td><code>perf_event</code> sampling (e.g. 19 Hz per CPU) + in-kernel stack unwinding using <code>.eh_frame</code> tables loaded into maps</td><td>Always-on fleet-wide CPU flame graphs, including binaries without frame pointers, Go, Rust, JVM, Python</td><td>Symbolization needs debug info or symbol servers; interpreters need runtime-specific unwinders</td></tr>
</table>
<pre>$ hubble observe -n shop --protocol http --last 3
Nov 14 10:21:07.118: shop/frontend-6d8f:41822 (ID:4211) -&gt; shop/cart-7c9f:8080 (ID:9921) http-request FORWARDED (HTTP/1.1 GET http://cart:8080/api/cart/42)
Nov 14 10:21:07.131: shop/cart-7c9f:8080 (ID:9921) &lt;- shop/frontend-6d8f:41822 (ID:4211) http-response FORWARDED (HTTP/1.1 200 13ms (GET http://cart:8080/api/cart/42))
Nov 14 10:21:07.402: shop/frontend-6d8f:41830 (ID:4211) -&gt; shop/payments-5b4d:443 (ID:7310) policy-verdict:none DENIED (TCP Flags: SYN)</pre>
<blockquote>💡 Real world: a common rollout is eBPF for breadth, SDKs for depth. Beyla or Pixie gives RED metrics for all 300 services in an afternoon, including the legacy ones nobody will re-instrument; the 15 revenue-critical services get the OTel SDK for business attributes and trace context through Kafka. The eBPF profiler then answers "why is this service's CPU up 30% since Tuesday" with a diff of flame graphs.</blockquote>`,
          he: `<p>ההבטחה: telemetry לכל workload מהיום הראשון, בלי לגעת בקוד של האפליקציה. כל כלי מגיע לשם דרך hooks אחרים:</p>
<table>
<tr><th>כלי</th><th>Hooks</th><th>מה מקבלים</th><th>ממה להיזהר</th></tr>
<tr><td><strong>Hubble</strong> (Cilium)</td><td>אירועים שתוכניות ה-datapath של Cilium עצמו (tc/socket) כותבות ל-perf/ring buffer</td><td>כל flow עם verdict (FORWARDED/DROPPED וסיבה), ‏DNS, metadata של HTTP/gRPC/Kafka כשנראות L7 דולקת; service map; מטריקות Prometheus</td><td>דורש Cilium בתור CNI; פרטי L7 רק דרך ה-proxy</td></tr>
<tr><td><strong>Pixie</strong> (CNCF sandbox)</td><td>kprobes על ה-syscalls ‏<code>send/recv/read/write</code> ועוד uprobes על OpenSSL/BoringSSL ועל <code>crypto/tls</code> של Go כדי לראות plaintext</td><td>גופי בקשות מלאים ו-latency של HTTP/gRPC/MySQL/Postgres/Redis/Kafka, עם שאילתות בסקריפטים של PxL</td><td>המידע נשמר בתוך ה-cluster בזיכרון (שעות, לא שבועות); עלות זיכרון לכל node (GBs)</td></tr>
<tr><td><strong>Beyla</strong> / OpenTelemetry eBPF Instrumentation ‏(OBI)</td><td>uprobes על ה-runtime של Go ועל ספריות HTTP/gRPC, ו-kprobes על syscalls של sockets לשפות אחרות</td><td>מטריקות RED ו-spans של OTel לכל שירות, ייצוא ב-OTLP; ‏Grafana תרמה את Beyla ל-OpenTelemetry ב-2025</td><td>העברת context מוגבלת בין קפיצות אסינכרוניות; אין attributes עסקיים</td></tr>
<tr><td><strong>Parca Agent</strong>, ‏<strong>Pyroscope</strong> ‏(Grafana Alloy), ‏<strong>OTel eBPF profiler</strong></td><td>דגימת <code>perf_event</code> (למשל 19 Hz לכל CPU) ו-stack unwinding בתוך ה-kernel עם טבלאות <code>.eh_frame</code> שנטענות ל-maps</td><td>flame graphs של CPU לכל ה-fleet שדולקים כל הזמן, כולל בינאריים בלי frame pointers, ‏Go, ‏Rust, ‏JVM, ‏Python</td><td>symbolization דורש debug info או symbol servers; שפות מפורשות צריכות unwinders ייעודיים ל-runtime</td></tr>
</table>
<pre>$ hubble observe -n shop --protocol http --last 3
Nov 14 10:21:07.118: shop/frontend-6d8f:41822 (ID:4211) -&gt; shop/cart-7c9f:8080 (ID:9921) http-request FORWARDED (HTTP/1.1 GET http://cart:8080/api/cart/42)
Nov 14 10:21:07.131: shop/cart-7c9f:8080 (ID:9921) &lt;- shop/frontend-6d8f:41822 (ID:4211) http-response FORWARDED (HTTP/1.1 200 13ms (GET http://cart:8080/api/cart/42))
Nov 14 10:21:07.402: shop/frontend-6d8f:41830 (ID:4211) -&gt; shop/payments-5b4d:443 (ID:7310) policy-verdict:none DENIED (TCP Flags: SYN)</pre>
<blockquote>💡 מהשטח: rollout נפוץ הוא eBPF לרוחב ו-SDKs לעומק. Beyla או Pixie נותנים מטריקות RED לכל 300 השירותים תוך אחר צהריים, כולל ה-legacy שאף אחד לא יעשה לו instrumentation מחדש; 15 השירותים הקריטיים להכנסות מקבלים את ה-SDK של OTel בשביל attributes עסקיים ו-trace context דרך Kafka. ה-profiler מבוסס ה-eBPF עונה אחר כך על "למה ה-CPU של השירות עלה ב-30% מאז יום שלישי" עם diff של flame graphs.</blockquote>`
        }
      },
      {
        h: { en: "Security: Falco, Tetragon, Tracee and what each hooks", he: "אבטחה: Falco, ‏Tetragon, ‏Tracee ולמה כל אחד מתחבר" },
        body: {
          en: `<ul>
<li><strong>Falco</strong> (CNCF graduated): the <code>modern_ebpf</code> driver (CO-RE, default since Falco 0.38) attaches to the raw syscall tracepoints <code>sys_enter</code>/<code>sys_exit</code> plus scheduler tracepoints, ships events through a ring buffer to user space, where the rules engine matches YAML conditions enriched with container and Kubernetes metadata. Detection and alerting; the kernel never blocks anything.</li>
<li><strong>Tetragon</strong> (Cilium project): <code>TracingPolicy</code> CRDs choose kprobes, tracepoints, uprobes or LSM hooks, filter <em>in the kernel</em> (only matching events leave), and can act synchronously: <code>Sigkill</code> the process or <code>Override</code> the function's return value (only for kernel functions marked for error injection, or via LSM hooks). Hooking <code>security_*</code> LSM functions instead of syscalls avoids TOCTOU races where arguments change after the syscall entry is checked.</li>
<li><strong>Tracee</strong> (Aqua Security): tracepoints, kprobes and LSM hooks feeding behavioural signatures (written in Go or Rego) for runtime detection and forensics, e.g. capturing written files or loaded kernel modules.</li>
</ul>
${EB_FALCO}
${EB_TETRAGON}
<p>Why the choice of hook matters: syscall tracepoints see <em>what was asked</em> (path strings can be relative or symlinks); LSM hooks see <em>what the kernel actually resolved</em> (the real file object), and they are the only place you can deny cleanly with <code>-EPERM</code>. Network-level security (who may talk to whom) belongs to the CNI's tc/cgroup programs, not to these agents.</p>
<blockquote>⚠️ Production tip: run Tetragon in observe-only mode first (policy without <code>matchActions</code>), baseline for a few weeks, then enforce on narrow selectors (specific namespaces, binaries, paths). A broad <code>Sigkill</code> policy is a fleet-wide outage waiting for the first package upgrade.</blockquote>`,
          he: `<ul>
<li><strong>Falco</strong> (CNCF graduated): ה-driver ‏<code>modern_ebpf</code> (CO-RE, ברירת המחדל מ-Falco 0.38) מתחבר ל-tracepoints הגולמיים של syscalls ‏<code>sys_enter</code>/<code>sys_exit</code> ועוד tracepoints של ה-scheduler, מעביר אירועים דרך ring buffer ל-user space, ושם מנוע החוקים מתאים תנאים ב-YAML שמועשרים ב-metadata של קונטיינרים ו-Kubernetes. זיהוי והתראות; ה-kernel אף פעם לא חוסם כלום.</li>
<li><strong>Tetragon</strong> (פרויקט של Cilium): ‏CRDs מסוג <code>TracingPolicy</code> בוחרים kprobes, ‏tracepoints, ‏uprobes או hooks של LSM, מסננים <em>בתוך ה-kernel</em> (רק אירועים שתואמים יוצאים החוצה), ויכולים לפעול באופן סינכרוני: <code>Sigkill</code> לתהליך או <code>Override</code> לערך החזרה של הפונקציה (רק לפונקציות kernel שמסומנות ל-error injection, או דרך hooks של LSM). חיבור לפונקציות ה-LSM ‏<code>security_*</code> במקום ל-syscalls מונע מרוצי TOCTOU, שבהם הארגומנטים משתנים אחרי שבדקו את הכניסה ל-syscall.</li>
<li><strong>Tracee</strong> (Aqua Security): ‏tracepoints, ‏kprobes ו-hooks של LSM שמזינים חתימות התנהגותיות (שנכתבות ב-Go או ב-Rego) לזיהוי בזמן ריצה ול-forensics, למשל לכידת קבצים שנכתבו או kernel modules שנטענו.</li>
</ul>
${EB_FALCO}
${EB_TETRAGON}
<p>למה הבחירה ב-hook חשובה: tracepoints של syscalls רואים <em>מה ביקשו</em> (נתיבים יכולים להיות יחסיים או symlinks); hooks של LSM רואים <em>מה ה-kernel פתר בפועל</em> (אובייקט הקובץ האמיתי), והם המקום היחיד שבו אפשר לסרב בצורה נקייה עם <code>-EPERM</code>. אבטחה ברמת הרשת (מי מדבר עם מי) שייכת לתוכניות tc/cgroup של ה-CNI, לא ל-agents האלה.</p>
<blockquote>⚠️ טיפ לפרודקשן: מריצים את Tetragon קודם במצב צפייה בלבד (policy בלי <code>matchActions</code>), בונים baseline במשך כמה שבועות, ורק אז אוכפים על selectors צרים (namespaces, בינאריים ונתיבים מסוימים). policy רחב של <code>Sigkill</code> הוא תקלה על כל ה-fleet שמחכה לשדרוג ה-package הראשון.</blockquote>`
        }
      },
      {
        h: { en: "Managed Kubernetes, Windows, and choosing tools", he: "Kubernetes מנוהל, Windows ובחירת כלים" },
        body: {
          en: `<table>
<tr><th>Provider</th><th>eBPF dataplane option</th><th>How to turn it on / check</th></tr>
<tr><td><strong>GKE</strong></td><td>Dataplane V2 (Cilium-based, managed by Google; runs as the <code>anetd</code> DaemonSet). Default for Autopilot; opt-in at creation for Standard.</td><td><code>gcloud container clusters create c1 --enable-dataplane-v2</code>; <code>kubectl -n kube-system get ds anetd</code>. Network policy logging built in.</td></tr>
<tr><td><strong>AKS</strong></td><td>Azure CNI Powered by Cilium (overlay or VNet IPs); Azure manages the Cilium version; Hubble metrics/flows via Advanced Container Networking Services.</td><td><code>az aks create ... --network-plugin azure --network-plugin-mode overlay --network-dataplane cilium</code>. Dataplane is chosen at cluster creation (or by a supported upgrade path).</td></tr>
<tr><td><strong>EKS</strong></td><td>Default Amazon VPC CNI routes with real VPC IPs; its network-policy agent enforces NetworkPolicy with eBPF. For a full eBPF dataplane, bring your own Cilium (ENI mode or chaining with VPC CNI).</td><td>Set <code>enableNetworkPolicy: "true"</code> on the <code>vpc-cni</code> add-on; for Cilium, install via Helm on AL2023/Bottlerocket nodes (6.1+ kernels).</td></tr>
</table>
<p><strong>eBPF on Windows</strong> is a separate Microsoft open-source project: it reuses the bytecode format and toolchain (clang, libbpf-style APIs) and verifies programs with the PREVAIL verifier in a protected user-mode service, then JITs or compiles them into a signed driver. Hooks are Windows-specific (XDP-like packet hooks, socket bind/connect); Cilium's L4 load balancer has a Windows port. Linux tracing programs (kprobes, tracepoints) don't carry over.</p>
<p><strong>Choosing:</strong></p>
<ul>
<li><em>Ad-hoc question on one node</em>: bpftrace / BCC tools, or Inspektor Gadget for pod-aware versions in Kubernetes.</li>
<li><em>CNI and network policy</em>: whatever your managed provider supports natively first (Dataplane V2, Azure CNI + Cilium); self-managed Cilium when you need its full feature set (cluster mesh, L7 policy, BGP).</li>
<li><em>Zero-code service metrics</em>: Beyla/OBI if you live in OTel/Grafana; Pixie for deep protocol debugging; Hubble if you already run Cilium.</li>
<li><em>Profiling</em>: one always-on eBPF profiler per node, shipping to Parca, Pyroscope or an OTel-compatible backend.</li>
<li><em>Runtime security</em>: Falco for broad detection with a mature ruleset; Tetragon when you need in-kernel enforcement or tight Cilium integration; avoid running three agents hooking the same syscalls.</li>
</ul>`,
          he: `<table>
<tr><th>ספק</th><th>אפשרות dataplane של eBPF</th><th>איך מפעילים / בודקים</th></tr>
<tr><td><strong>GKE</strong></td><td>Dataplane V2 (מבוסס Cilium, מנוהל ע״י Google; רץ כ-DaemonSet בשם <code>anetd</code>). ברירת מחדל ב-Autopilot; ב-Standard מפעילים בזמן היצירה.</td><td><code>gcloud container clusters create c1 --enable-dataplane-v2</code>; ‏<code>kubectl -n kube-system get ds anetd</code>. לוגים של network policy מובנים.</td></tr>
<tr><td><strong>AKS</strong></td><td>Azure CNI Powered by Cilium (overlay או כתובות VNet); Azure מנהלת את גרסת ה-Cilium; מטריקות ו-flows של Hubble דרך Advanced Container Networking Services.</td><td><code>az aks create ... --network-plugin azure --network-plugin-mode overlay --network-dataplane cilium</code>. בוחרים dataplane ביצירת ה-cluster (או דרך מסלול שדרוג נתמך).</td></tr>
<tr><td><strong>EKS</strong></td><td>ה-Amazon VPC CNI בברירת המחדל מנתב עם כתובות VPC אמיתיות; ה-network-policy agent שלו אוכף NetworkPolicy עם eBPF. בשביל dataplane מלא של eBPF מתקינים Cilium בעצמך (מצב ENI או chaining עם VPC CNI).</td><td>מגדירים <code>enableNetworkPolicy: "true"</code> על ה-add-on ‏<code>vpc-cni</code>; ל-Cilium מתקינים עם Helm על nodes של AL2023/Bottlerocket ‏(kernels של 6.1 ומעלה).</td></tr>
</table>
<p><strong>eBPF על Windows</strong> הוא פרויקט קוד פתוח נפרד של Microsoft: הוא משתמש באותו פורמט bytecode ו-toolchain ‏(clang, ‏APIs בסגנון libbpf), מאמת תוכניות עם ה-verifier ‏PREVAIL בשירות מוגן ב-user mode, ואז עושה JIT או מקמפל אותן ל-driver חתום. ה-hooks ייחודיים ל-Windows ‏(hooks ל-packets בסגנון XDP, ‏bind/connect של sockets); ל-load balancer של L4 של Cilium יש גרסה ל-Windows. תוכניות tracing של Linux ‏(kprobes, ‏tracepoints) לא עוברות.</p>
<p><strong>איך בוחרים:</strong></p>
<ul>
<li><em>שאלה אד-הוק על node אחד</em>: bpftrace או כלי BCC, או Inspektor Gadget לגרסאות שמכירות pods ב-Kubernetes.</li>
<li><em>CNI ו-network policy</em>: קודם מה שהספק המנוהל תומך בו natively ‏(Dataplane V2, ‏Azure CNI עם Cilium); Cilium בניהול עצמי כשצריך את כל היכולות שלו (cluster mesh, ‏policy ב-L7, ‏BGP).</li>
<li><em>מטריקות שירות בלי קוד</em>: Beyla/OBI אם אתה חי ב-OTel/Grafana; ‏Pixie לדיבאג פרוטוקולים לעומק; Hubble אם כבר יש לך Cilium.</li>
<li><em>Profiling</em>: profiler אחד מבוסס eBPF שדולק כל הזמן על כל node, ששולח ל-Parca, ל-Pyroscope או ל-backend שתומך ב-OTel.</li>
<li><em>Runtime security</em>: Falco לזיהוי רחב עם סט חוקים בשל; Tetragon כשצריך אכיפה בתוך ה-kernel או אינטגרציה הדוקה עם Cilium; לא מריצים שלושה agents שמתחברים לאותם syscalls.</li>
</ul>`
        }
      },
      {
        h: { en: "Operational pitfalls: kernels, verifier, memory, BTF", he: "מוקשים תפעוליים: kernels, ‏verifier, זיכרון, BTF" },
        body: {
          en: `<p>eBPF agents are tier-0: the CNI, the security agent and the profiler all live in the kernel of every node. Most of their incidents trace back to the kernel changing underneath them:</p>
${EB_ERRORS}
<ul>
<li><strong>Kernel upgrades are agent upgrades.</strong> A new node image can rename a kprobe target, change verifier behaviour, or drop BTF. Check every agent's documented kernel compatibility matrix, upgrade the agent <em>before</em> the kernel, and roll new node images through a canary pool that runs the agents' health checks (<code>cilium status</code>, Falco/Tetragon readiness).</li>
<li><strong>Verifier rejections on a new kernel</strong> are usually fixed by a newer agent release, not by you. Pin agent versions that the vendor tests against your kernel series.</li>
<li><strong>Map memory adds up</strong>: Cilium's conntrack and NAT maps are sized from node memory (<code>bpf-map-dynamic-size-ratio</code>, default 0.0025 of RAM), Tetragon and profilers add their own. Since 5.11 map memory is charged to the creating cgroup, so a tight memory limit on the agent's DaemonSet can make map creation fail at start. Read <code>bpftool map list</code> memlock totals per node.</li>
<li><strong>Missing BTF on old distros</strong> (CentOS 7, Ubuntu 18.04, RHEL 8.0/8.1, custom kernels): CO-RE agents need BTFHub files or a legacy/kmod driver. Better: make <code>CONFIG_DEBUG_INFO_BTF=y</code> a hard requirement of your golden image.</li>
<li><strong>Program conflicts</strong>: two agents fighting over the same XDP or tc attach point; a node-level firewall flushing what the CNI installed. <code>bpftool net list</code> shows who owns each interface hook.</li>
</ul>
<blockquote>💡 Real world: a common outage pattern is a self-built node image with a custom kernel (built for a driver or a CVE patch) that forgot <code>CONFIG_DEBUG_INFO_BTF</code>. The nodes join, kubelet is happy, and then the security agent CrashLoops and, worse, a CNI that needs a newer feature leaves Pods stuck in ContainerCreating. The fix takes minutes; finding it without knowing eBPF can take hours.</blockquote>`,
          he: `<p>ה-agents של eBPF הם tier-0: ה-CNI, ה-agent של האבטחה וה-profiler חיים כולם בתוך ה-kernel של כל node. רוב התקלות שלהם מתחילות ב-kernel שהשתנה מתחתיהם:</p>
${EB_ERRORS}
<ul>
<li><strong>שדרוג kernel הוא שדרוג agent.</strong> image חדש ל-nodes יכול לשנות שם של פונקציה ש-kprobe מתחבר אליה, לשנות התנהגות של ה-verifier או להוריד את ה-BTF. בודקים את מטריצת התאימות ל-kernel המתועדת של כל agent, משדרגים את ה-agent <em>לפני</em> ה-kernel, ומעבירים images חדשים של nodes דרך pool של canary שמריץ את ה-health checks של ה-agents (<code>cilium status</code>, ‏readiness של Falco/Tetragon).</li>
<li><strong>דחיות של ה-verifier ב-kernel חדש</strong> בדרך כלל נפתרות ב-release חדש יותר של ה-agent, לא אצלך. מצמידים גרסאות agent שהספק בודק מול סדרת ה-kernel שלך.</li>
<li><strong>זיכרון של maps מצטבר</strong>: ה-maps של conntrack ו-NAT ב-Cilium מחושבים לפי זיכרון ה-node (<code>bpf-map-dynamic-size-ratio</code>, ברירת מחדל 0.0025 מה-RAM), ‏Tetragon וה-profilers מוסיפים משלהם. מ-5.11 הזיכרון של maps נספר על ה-cgroup שיצר אותם, אז limit זיכרון הדוק על ה-DaemonSet של ה-agent יכול להכשיל יצירת maps בעלייה. קוראים את סכומי ה-memlock ב-<code>bpftool map list</code> לכל node.</li>
<li><strong>BTF חסר בהפצות ישנות</strong> (CentOS 7, ‏Ubuntu 18.04, ‏RHEL 8.0/8.1, ‏kernels custom): agents של CO-RE צריכים קבצים מ-BTFHub או driver מסוג legacy/kmod. עדיף: להפוך את <code>CONFIG_DEBUG_INFO_BTF=y</code> לדרישת חובה של ה-golden image.</li>
<li><strong>התנגשויות בין תוכניות</strong>: שני agents שנלחמים על אותה נקודת חיבור של XDP או tc; firewall ברמת ה-node שמוחק את מה שה-CNI התקין. <code>bpftool net list</code> מראה מי מחזיק כל hook על כל interface.</li>
</ul>
<blockquote>💡 מהשטח: דפוס תקלה נפוץ הוא image של nodes שנבנה בבית עם kernel custom (בשביל driver או patch ל-CVE) ששכח את <code>CONFIG_DEBUG_INFO_BTF</code>. ה-nodes מצטרפים, ה-kubelet מרוצה, ואז ה-agent של האבטחה נכנס ל-CrashLoop, ויותר גרוע, CNI שצריך פיצ'ר חדש יותר משאיר Pods תקועים ב-ContainerCreating. התיקון לוקח דקות; למצוא אותו בלי להכיר eBPF יכול לקחת שעות.</blockquote>`
        }
      }
    ],
    diagram: "packet in --> [NIC driver: XDP]  DDoS drop, Katran LB, Cilium NodePort accel\n                  |\n                  v\n              [tc ingress/egress]  Cilium policy + NAT --> Hubble flow events\n                  |\n  app --connect()--> [cgroup/connect4]  Cilium socket LB (VIP -> backend)\n  app --send/recv--> [kprobes on syscalls] + [uprobes on SSL_write / Go net/http]  Pixie, Beyla/OBI\n  every CPU --19 Hz--> [perf_event + stack unwinding]  Parca, Pyroscope, OTel profiler\n  execve/open/... --> [syscall tracepoints]  Falco (detect)\n                      [kprobes / LSM security_*]  Tetragon (detect + Sigkill), Tracee",
    handsOn: [
      { cmd: "sudo bpftool net list && sudo bpftool prog list | grep -E 'xdp|sched_cls|cgroup|lsm|kprobe' | sort | uniq -c | head", what: { en: "On a Kubernetes node, see which agents attached XDP/tc programs to which interfaces and how many programs of each type are loaded.", he: "על node של Kubernetes, רואים אילו agents חיברו תוכניות XDP/tc לאילו interfaces וכמה תוכניות מכל סוג טעונות." } },
      { cmd: "hubble observe -n shop --verdict DROPPED --last 20", what: { en: "With Cilium, list the last dropped flows and the reason (policy, invalid packet, no route).", he: "עם Cilium, מציגים את ה-flows האחרונים שנפלו ואת הסיבה (policy, ‏packet לא תקין, אין route)." } },
      { cmd: "kubectl exec -n tetragon ds/tetragon -c tetragon -- tetra getevents -o compact --namespace default", what: { en: "Stream process exec/exit events with pod context from Tetragon; then exec into a pod and watch yourself appear.", he: "צופים בזרם אירועי exec/exit של תהליכים עם context של pod מ-Tetragon; אחר כך עושים exec ל-pod ורואים את עצמך מופיע." } },
      { cmd: "kubectl get nodes -o custom-columns=NAME:.metadata.name,KERNEL:.status.nodeInfo.kernelVersion,OS:.status.nodeInfo.osImage", what: { en: "Inventory kernel versions across the cluster before upgrading any eBPF agent or node image.", he: "מצאי של גרסאות kernel בכל ה-cluster לפני שמשדרגים agent של eBPF או image של nodes." } }
    ],
    mnemonic: {
      en: "Bouncer, Cameras, Guards: XDP/tc for the network, sockets/uprobes/perf for observability, syscalls/kprobes/LSM for security. New kernel = new plugs; test before you swap.",
      he: "סלקטור, מצלמות, מאבטחים: XDP/tc לרשת, ‏sockets/uprobes/perf ל-observability, ‏syscalls/kprobes/LSM לאבטחה. kernel חדש = שקעים חדשים; בודקים לפני שמחליפים."
    },
    pitfalls: [
      { en: "Rolling a new node image or kernel fleet-wide without a canary that runs every eBPF agent: BTF or kprobe changes surface as CrashLoops and lost networking on every new node at once.", he: "לגלגל image חדש ל-nodes או kernel חדש לכל ה-fleet בלי canary שמריץ כל agent של eBPF: שינויים ב-BTF או ב-kprobes מתגלים כ-CrashLoops ואובדן רשת על כל ה-nodes החדשים בבת אחת." },
      { en: "Expecting eBPF auto-instrumentation to replace OTel SDKs: it gives RED metrics and basic spans, not business attributes or reliable trace context through queues.", he: "לצפות ש-auto-instrumentation של eBPF יחליף את ה-SDKs של OTel: הוא נותן מטריקות RED ו-spans בסיסיים, לא attributes עסקיים ולא trace context אמין דרך תורים." },
      { en: "Stacking several security/observability agents that all hook the same syscalls: you pay the per-event cost three times and debug three sets of kernel requirements.", he: "לערום כמה agents של אבטחה ו-observability שכולם מתחברים לאותם syscalls: משלמים את העלות לכל אירוע שלוש פעמים ומדבגים שלוש רשימות של דרישות kernel." },
      { en: "Using XDP in generic mode and believing the benchmark numbers: without native driver support you lose most of the advantage.", he: "להשתמש ב-XDP במצב generic ולהאמין למספרים מה-benchmark: בלי תמיכה native ב-driver מאבדים את רוב היתרון." }
    ],
    interview: [
      {
        q: { en: "Your security team wants Falco, Tetragon and Pixie on every node. How do you evaluate that?", he: "צוות האבטחה רוצה Falco, ‏Tetragon ו-Pixie על כל node. איך אתה בוחן את זה?" },
        a: { en: "Map each to hooks and goals: Falco and Tetragon both hook syscalls/kprobes for runtime security, so pick one unless you need Falco's ruleset for detection and Tetragon for enforcement; Pixie is observability with uprobes on TLS libraries and GBs of memory per node. Then measure: per-node CPU (bpf_stats run_time_ns, agent CPU), memory and map memlock, event drop rates, under production-like load. Check each agent's kernel compatibility matrix against our node images and BTF availability, the privileges they require (they're root-equivalent), and who owns upgrades. Usually the outcome is one runtime-security agent, one observability path, rolled out via a canary node pool.", he: "ממפים כל אחד ל-hooks ולמטרות: Falco ו-Tetragon מתחברים שניהם ל-syscalls/kprobes בשביל runtime security, אז בוחרים אחד, אלא אם צריך את סט החוקים של Falco לזיהוי ואת Tetragon לאכיפה; ‏Pixie הוא observability עם uprobes על ספריות TLS ו-GBs של זיכרון לכל node. אחר כך מודדים: CPU לכל node ‏(run_time_ns מ-bpf_stats, ‏CPU של ה-agent), זיכרון ו-memlock של maps, קצב אירועים שאבדו, תחת עומס דומה לפרודקשן. בודקים את מטריצת התאימות ל-kernel של כל agent מול ה-images של ה-nodes וזמינות BTF, את ההרשאות שהם דורשים (הם שווי ערך ל-root), ומי אחראי על שדרוגים. בדרך כלל התוצאה היא agent אחד ל-runtime security ומסלול observability אחד, עם rollout דרך node pool של canary." }
      },
      {
        q: { en: "How does Pixie or Beyla see HTTP inside TLS-encrypted traffic without the private key?", he: "איך Pixie או Beyla רואים HTTP בתוך תעבורה מוצפנת ב-TLS בלי המפתח הפרטי?" },
        a: { en: "They don't decrypt packets. They attach uprobes to the TLS library functions in the process (SSL_write/SSL_read in OpenSSL/BoringSSL, crypto/tls in Go) and read the plaintext buffer before encryption or after decryption. That's why it needs symbol offsets for each library version, doesn't work with statically linked or unusual TLS stacks out of the box, costs microseconds per call, and is exactly the capability that makes eBPF agents security-sensitive.", he: "הם לא מפענחים packets. הם מחברים uprobes לפונקציות של ספריית ה-TLS בתוך התהליך (SSL_write/SSL_read ב-OpenSSL/BoringSSL, ‏crypto/tls ב-Go) וקוראים את ה-buffer ב-plaintext לפני ההצפנה או אחרי הפענוח. בגלל זה צריך offsets של symbols לכל גרסת ספרייה, זה לא עובד מהקופסה עם TLS שמקושר סטטית או stacks לא סטנדרטיים, עולה מיקרו-שניות לכל קריאה, וזו בדיוק היכולת שהופכת agents של eBPF לרגישים מבחינת אבטחה." }
      }
    ],
    quiz: [
      {
        q: { en: "Why does dropping DDoS traffic in XDP beat iptables by a large factor?", he: "למה הפלת תעבורת DDoS ב-XDP מנצחת את iptables בפער גדול?" },
        options: [
          { en: "XDP runs in user space", he: "XDP רץ ב-user space" },
          { en: "XDP acts in the NIC driver before an sk_buff is allocated, skipping conntrack and the network stack", he: "XDP פועל ב-driver של כרטיס הרשת לפני שמוקצה sk_buff, ומדלג על conntrack ועל ה-stack של הרשת" },
          { en: "XDP uses a bigger MTU", he: "XDP משתמש ב-MTU גדול יותר" },
          { en: "iptables can't match source IPs", he: "iptables לא יכול להתאים לפי IP מקור" }
        ],
        answer: 1,
        explain: { en: "Per-packet cost is mostly allocation and stack traversal. XDP returns XDP_DROP at the earliest software point, so a core can drop tens of millions of packets per second.", he: "רוב העלות לכל packet היא הקצאה ומעבר ב-stack. XDP מחזיר XDP_DROP בנקודה הכי מוקדמת בתוכנה, אז ליבה אחת יכולה להפיל עשרות מיליוני packets בשנייה." }
      },
      {
        q: { en: "Which tool can kill a process in-kernel, synchronously, when it opens a sensitive file?", he: "איזה כלי יכול להרוג תהליך בתוך ה-kernel, באופן סינכרוני, כשהוא פותח קובץ רגיש?" },
        options: [
          { en: "Hubble", he: "Hubble" },
          { en: "Parca", he: "Parca" },
          { en: "Tetragon with a TracingPolicy Sigkill action", he: "Tetragon עם TracingPolicy ופעולת Sigkill" },
          { en: "Falco with default rules", he: "Falco עם החוקים ברירת המחדל" }
        ],
        answer: 2,
        explain: { en: "Tetragon evaluates selectors in the eBPF program and can send SIGKILL before the operation proceeds. Falco detects in user space and alerts; Hubble and Parca are observability.", he: "Tetragon מעריך את ה-selectors בתוך תוכנית ה-eBPF ויכול לשלוח SIGKILL לפני שהפעולה ממשיכה. Falco מזהה ב-user space ומתריע; ‏Hubble ו-Parca הם observability." }
      },
      {
        q: { en: "After a node image upgrade, a CO-RE based agent logs 'libbpf: failed to find valid kernel BTF'. Most likely cause?", he: "אחרי שדרוג image של nodes, agent מבוסס CO-RE כותב ללוג 'libbpf: failed to find valid kernel BTF'. מה הסיבה הסבירה?" },
        options: [
          { en: "The agent's map is full", he: "ה-map של ה-agent מלא" },
          { en: "The new kernel was built without CONFIG_DEBUG_INFO_BTF, so /sys/kernel/btf/vmlinux is missing", he: "ה-kernel החדש נבנה בלי CONFIG_DEBUG_INFO_BTF, ולכן /sys/kernel/btf/vmlinux חסר" },
          { en: "The JIT is disabled", he: "ה-JIT כבוי" },
          { en: "kube-proxy is still running", he: "kube-proxy עדיין רץ" }
        ],
        answer: 1,
        explain: { en: "CO-RE relocations need the running kernel's BTF. Fix the image (enable BTF), roll back, or provide external BTF (BTFHub) as a stopgap.", he: "relocations של CO-RE צריכים את ה-BTF של ה-kernel הרץ. מתקנים את ה-image (מפעילים BTF), עושים rollback, או מספקים BTF חיצוני (BTFHub) כפתרון זמני." }
      },
      {
        q: { en: "On EKS with the default Amazon VPC CNI and network policy enabled, what does eBPF do?", he: "ב-EKS עם ה-Amazon VPC CNI בברירת המחדל ו-network policy מופעל, מה eBPF עושה?" },
        options: [
          { en: "Nothing, EKS doesn't support eBPF", he: "כלום, EKS לא תומך ב-eBPF" },
          { en: "Replaces kube-proxy automatically", he: "מחליף את kube-proxy אוטומטית" },
          { en: "The VPC CNI's network policy agent enforces NetworkPolicy with eBPF programs", he: "ה-network policy agent של ה-VPC CNI אוכף NetworkPolicy עם תוכניות eBPF" },
          { en: "It runs Hubble by default", he: "הוא מריץ Hubble כברירת מחדל" }
        ],
        answer: 2,
        explain: { en: "The VPC CNI still does routing with VPC IPs and kube-proxy still handles Services; only NetworkPolicy enforcement is eBPF. A full eBPF dataplane on EKS means installing Cilium yourself.", he: "ה-VPC CNI עדיין עושה routing עם כתובות VPC ו-kube-proxy עדיין מטפל ב-Services; רק אכיפת NetworkPolicy היא eBPF. dataplane מלא של eBPF ב-EKS אומר להתקין Cilium בעצמך." }
      }
    ],
    playground: "terminal",
    related: ["ebpf-fundamentals", "staff-ebpf-cilium", "k8s-networking-cni", "k8s-security-policy", "obs-profiling-synthetics", "cloud-managed-k8s-compare", "net-ddos-edge"]
  });

  /* =============================== GLOSSARY =============================== */
  [
    ["eBPF verifier", "In-kernel static analyzer that walks every path of an eBPF program before it loads, proving termination, memory safety (bounds and NULL checks) and allowed helper use within a 1M processed-instruction budget.", "static analyzer בתוך ה-kernel שעובר על כל מסלול בתוכנית eBPF לפני הטעינה ומוכיח סיום, בטיחות זיכרון (בדיקות גבולות ו-NULL) ושימוש רק ב-helpers מותרים, בתקציב של מיליון הוראות מעובדות.", "ebpf-fundamentals"],
    ["BTF / CO-RE", "BTF (BPF Type Format) is the kernel's own type info at /sys/kernel/btf/vmlinux; CO-RE (compile once, run everywhere) uses it so libbpf can relocate struct field offsets at load time and one binary runs across kernels.", "BTF ‏(BPF Type Format) הוא מידע הטיפוסים של ה-kernel עצמו ב-/sys/kernel/btf/vmlinux; ‏CO-RE ‏(compile once, run everywhere) משתמש בו כדי ש-libbpf יתקן offsets של שדות ב-structs בזמן הטעינה, ובינארי אחד ירוץ על פני kernels.", "ebpf-fundamentals"],
    ["BPF map", "Kernel-resident key/value store (hash, array, per-CPU, LRU, ring buffer, LPM trie) shared between eBPF programs and user space: the bridge for state, config and results.", "מאגר key/value שחי ב-kernel ‏(hash, ‏array, ‏per-CPU, ‏LRU, ‏ring buffer, ‏LPM trie) ומשותף בין תוכניות eBPF ל-user space: הגשר ל-state, לקונפיגורציה ולתוצאות.", "ebpf-fundamentals"],
    ["XDP (eXpress Data Path)", "eBPF hook in the NIC driver's receive path, before an sk_buff is allocated; returns DROP, PASS, TX or REDIRECT per packet. Used for DDoS drop and L4 load balancers like Katran.", "hook של eBPF בנתיב הקבלה של ה-driver של כרטיס הרשת, לפני שמוקצה sk_buff; מחזיר DROP, ‏PASS, ‏TX או REDIRECT לכל packet. משמש להפלת DDoS ול-load balancers של L4 כמו Katran.", "ebpf-ecosystem"],
    ["Tetragon", "Cilium-project eBPF runtime security agent: TracingPolicy CRDs pick kprobes, tracepoints or LSM hooks, filter in-kernel, and can enforce synchronously with Sigkill or return-value override.", "agent של runtime security מבוסס eBPF מפרויקט Cilium: ‏CRDs מסוג TracingPolicy בוחרים kprobes, ‏tracepoints או hooks של LSM, מסננים בתוך ה-kernel, ויכולים לאכוף באופן סינכרוני עם Sigkill או override לערך החזרה.", "ebpf-ecosystem"],
    ["Hubble", "Cilium's observability layer: exposes every network flow from the eBPF datapath with verdict, drop reason, identities and L7 metadata via CLI, UI and Prometheus metrics.", "שכבת ה-observability של Cilium: חושפת כל flow ברשת מתוך ה-datapath של eBPF עם verdict, סיבת drop, זהויות ו-metadata של L7, דרך CLI, ‏UI ומטריקות Prometheus.", "ebpf-ecosystem"]
  ].forEach(function (g) {
    INFRA.glossary.push({ term: g[0], track: "linux", def: { en: g[1], he: g[2] }, lesson: g[3] });
  });

  /* =============================== SCENARIO =============================== */
  function t(en, he) { return { en: en, he: he }; }
  function c(en, he, next, score, fen, fhe) { return { label: t(en, he), next: next, score: score, feedback: t(fen, fhe) }; }

  INFRA.scenarios.push({
    id: "ebpf-agent-kernel-upgrade",
    icon: "🐝",
    title: t("New node image, blind and disconnected nodes", "image חדש ל-nodes, ו-nodes עיוורים ומנותקים"),
    start: "s1",
    steps: {
      s1: {
        text: t("09:40. The platform team started a rolling upgrade of the prod node pool to a new in-house golden image (custom 6.8 kernel, built to pick up a NIC driver fix). 12 of 40 nodes are replaced. PagerDuty: 'Pods stuck ContainerCreating' and 'Falco DaemonSet unavailable'. The SIEM dashboard shows those nodes went silent.",
               "09:40. צוות הפלטפורמה התחיל rolling upgrade ל-node pool של prod עם golden image חדש שנבנה בבית (kernel custom של 6.8, שנבנה בשביל תיקון ב-driver של כרטיס הרשת). 12 מתוך 40 nodes הוחלפו. PagerDuty: 'Pods stuck ContainerCreating' ו-'Falco DaemonSet unavailable'. ה-dashboard של ה-SIEM מראה שה-nodes האלה השתתקו."),
        data: `$ kubectl get pods -A -o wide | grep -v Running | head -6
NAMESPACE   NAME                      READY  STATUS             RESTARTS  NODE
kube-system cilium-7xq2p              0/1    CrashLoopBackOff   6         ip-10-0-7-21
kube-system cilium-k9d4m              0/1    CrashLoopBackOff   6         ip-10-0-7-38
falco       falco-2mzt8               1/2    CrashLoopBackOff   7         ip-10-0-7-21
shop        checkout-6d8f-xk2lp       0/1    ContainerCreating  0         ip-10-0-7-21
shop        cart-7c9f-p9q1d           0/1    ContainerCreating  0         ip-10-0-7-38

$ kubectl describe pod checkout-6d8f-xk2lp | tail -2
  Warning  FailedCreatePodSandBox  kubelet  ... plugin type="cilium-cni" failed (add):
           unable to connect to Cilium daemon: ... connect: no such file or directory`,
        choices: [
          c("Compare the failing nodes with healthy ones: what changed? (image, kernel, agent versions)", "להשוות את ה-nodes שנכשלים לבריאים: מה השתנה? (image, ‏kernel, גרסאות agents)", "s2", 15,
            "Right instinct. Every failure is on a replaced node, and the only thing replaced was the image. Start from the diff.",
            "אינסטינקט נכון. כל הכשלים על nodes שהוחלפו, והדבר היחיד שהוחלף הוא ה-image. מתחילים מההבדל."),
          c("Restart every Cilium and Falco pod in the cluster", "לעשות restart לכל ה-pods של Cilium ו-Falco ב-cluster", "s1b", -10,
            "Restarting agents on the 28 healthy nodes risks their datapath for nothing, and the 12 broken ones fail the same way again.",
            "restart ל-agents על 28 ה-nodes הבריאים מסכן את ה-datapath שלהם סתם, ו-12 השבורים נכשלים שוב באותה צורה."),
          c("Delete the Falco DaemonSet to cut the noise and focus on networking", "למחוק את ה-DaemonSet של Falco כדי להוריד רעש ולהתמקד ברשת", "s1b", -5,
            "You just turned off runtime security on the whole cluster, including the healthy nodes, and lost a strong clue: both eBPF agents fail on the same nodes.",
            "כיבית runtime security על כל ה-cluster, כולל ה-nodes הבריאים, ואיבדת רמז חזק: שני ה-agents של eBPF נכשלים על אותם nodes.")
        ]
      },
      s1b: {
        text: t("Ten minutes later nothing improved: the same 12 nodes still fail, the node pool upgrade keeps going (now 16 of 40), and checkout capacity is down 40%. The incident channel asks what changed.",
               "עשר דקות אחרי זה שום דבר לא השתפר: אותם 12 nodes עדיין נכשלים, ה-upgrade של ה-node pool ממשיך (עכשיו 16 מתוך 40), וה-capacity של checkout ירד ב-40%. בערוץ התקלה שואלים מה השתנה."),
        choices: [
          c("Stop guessing and diff a broken node against a healthy one", "להפסיק לנחש ולהשוות node שבור ל-node בריא", "s2", 5,
            "Good recovery. The pattern (only new nodes, only eBPF agents) points straight at the kernel.",
            "התאוששות טובה. הדפוס (רק nodes חדשים, רק agents של eBPF) מצביע ישר על ה-kernel."),
          c("Let the rollout finish, the new image probably needs all nodes to settle", "לתת ל-rollout להסתיים, כנראה ה-image החדש צריך שכל ה-nodes יתייצבו", "lose", -20,
            "There is no 'settling' for a kernel the agents can't load into. The rollout finishes and takes the whole cluster with it.",
            "אין 'התייצבות' ל-kernel שה-agents לא מצליחים להיטען אליו. ה-rollout מסתיים ולוקח איתו את כל ה-cluster.")
        ]
      },
      s2: {
        text: t("The diff is clear: different kernel, and the agents' logs point at eBPF loading.",
               "ההבדל ברור: kernel אחר, והלוגים של ה-agents מצביעים על טעינת eBPF."),
        data: `$ kubectl get nodes -o custom-columns=NAME:.metadata.name,KERNEL:.status.nodeInfo.kernelVersion
ip-10-0-3-14   6.1.112-124.190.amzn2023.x86_64      <- old image (healthy)
ip-10-0-7-21   6.8.12-golden-nicfix                 <- new image (broken)

$ kubectl logs -n falco falco-2mzt8 -c falco | tail -3
Opening 'syscall' source with modern BPF probe.
libbpf: failed to find valid kernel BTF
Error: Initialization issues during scap_init

$ kubectl logs -n kube-system cilium-7xq2p | grep -m3 -iE 'level=(error|fatal)'
level=error msg="BPF program is too large. Processed 1000001 insn" subsys=datapath-loader
level=fatal msg="Failed to compile/load datapath" error="loading eBPF collection: ... bpf_lxc"`,
        choices: [
          c("Pause the node pool upgrade and cordon the new nodes so the damage stops growing", "לעצור את ה-upgrade של ה-node pool ולעשות cordon ל-nodes החדשים כדי שהנזק יפסיק לגדול", "s3", 15,
            "Stop the bleeding first. Every minute the rollout runs, another healthy node becomes a broken one.",
            "קודם עוצרים את הדימום. כל דקה שה-rollout רץ, עוד node בריא הופך לשבור."),
          c("Give the Cilium DaemonSet more CPU and memory so the program fits", "לתת ל-DaemonSet של Cilium יותר CPU וזיכרון כדי שהתוכנית תיכנס", "s1b", -10,
            "The verifier's 1M-instruction budget is a kernel constant, not a resource limit. More CPU changes nothing.",
            "התקציב של מיליון הוראות של ה-verifier הוא קבוע של ה-kernel, לא resource limit. יותר CPU לא משנה כלום."),
          c("Disable the BPF verifier on the new nodes with a sysctl", "לכבות את ה-BPF verifier על ה-nodes החדשים עם sysctl", "s1b", -15,
            "There is no such sysctl, by design. The verifier can't be turned off; that's the whole safety model.",
            "אין sysctl כזה, ובכוונה. אי אפשר לכבות את ה-verifier; זה כל מודל הבטיחות.")
        ]
      },
      s3: {
        text: t("Rollout paused at 16/40, new nodes cordoned and drained; pods are rescheduling onto the 24 old nodes and checkout recovers. You SSH (via SSM) into a broken node to confirm the root cause.",
               "ה-rollout נעצר ב-16 מתוך 40, ה-nodes החדשים ב-cordon וב-drain; ה-pods עוברים ל-24 ה-nodes הישנים ו-checkout מתאושש. אתה נכנס (דרך SSM) ל-node שבור כדי לאשר את שורש הבעיה."),
        data: `$ ls /sys/kernel/btf/vmlinux
ls: cannot access '/sys/kernel/btf/vmlinux': No such file or directory
$ grep -E 'CONFIG_DEBUG_INFO_BTF|CONFIG_BPF_LSM' /boot/config-$(uname -r)
# CONFIG_DEBUG_INFO_BTF is not set
CONFIG_BPF_LSM=y
$ helm -n kube-system list | grep cilium
cilium   kube-system   ...   cilium-1.14.6
# Cilium docs: 1.14.x is not tested on 6.8; verifier fixes for newer kernels landed in later releases`,
        choices: [
          c("Roll the pool back to the previous image, then fix the image pipeline (BTF on) and upgrade Cilium before trying 6.8 again", "להחזיר את ה-pool ל-image הקודם, ואז לתקן את ה-pipeline של ה-image ‏(BTF דולק) ולשדרג את Cilium לפני שמנסים שוב 6.8", "s4", 15,
            "Two independent root causes, two fixes, in the right order: restore service, then repair the image and the agent compatibility.",
            "שני שורשי בעיה נפרדים, שני תיקונים, בסדר הנכון: מחזירים שירות, ואז מתקנים את ה-image ואת התאימות של ה-agent."),
          c("Ship a BTFHub file for the new kernel to Falco and keep the new image", "לספק ל-Falco קובץ מ-BTFHub ל-kernel החדש ולהשאיר את ה-image החדש", "s4", 0,
            "It might bring Falco back (BTFHub covers distro kernels, not your custom build, so you'd have to generate BTF yourself), but Cilium still can't load its datapath. Half a fix on a broken image.",
            "זה אולי יחזיר את Falco (‏BTFHub מכסה kernels של הפצות, לא את ה-build ה-custom שלך, אז תצטרך לייצר BTF בעצמך), אבל Cilium עדיין לא מצליח לטעון את ה-datapath. חצי תיקון על image שבור."),
          c("Switch the cluster CNI to the cloud default to get rid of Cilium", "להחליף את ה-CNI של ה-cluster לברירת המחדל של הענן כדי להיפטר מ-Cilium", "lose", -20,
            "A live CNI migration in the middle of an incident: every pod needs new networking, policies stop applying, and you've traded a contained outage for a cluster-wide one.",
            "מיגרציית CNI חיה באמצע תקלה: כל pod צריך רשת חדשה, ה-policies מפסיקים לחול, והחלפת תקלה מוכלת בתקלה על כל ה-cluster.")
        ]
      },
      s4: {
        text: t("Service is fully restored on the old image. In the postmortem, the platform lead asks how to make sure the next kernel change doesn't do this again.",
               "השירות חזר במלואו על ה-image הישן. ב-postmortem, ראש צוות הפלטפורמה שואל איך מוודאים ששינוי ה-kernel הבא לא יעשה את זה שוב."),
        choices: [
          c("Add an image gate (BTF present, required CONFIG_ flags, bpftool feature probe) and a canary node pool that must pass every eBPF agent's health check before rollout; track agents' kernel compatibility matrices", "להוסיף gate ל-image ‏(BTF קיים, דגלי CONFIG_ נדרשים, ‏bpftool feature probe) ו-node pool של canary שחייב לעבור את ה-health check של כל agent של eBPF לפני rollout; לעקוב אחרי מטריצות התאימות ל-kernel של ה-agents", "win", 15,
            "That turns 'kernel upgrade' into 'kernel + eBPF agents upgrade', tested before it touches prod.",
            "ככה 'שדרוג kernel' הופך ל'שדרוג kernel ו-agents של eBPF', שנבדק לפני שהוא נוגע ב-prod."),
          c("Add an alert on DaemonSet unavailability and move on", "להוסיף alert על DaemonSet לא זמין ולהמשיך הלאה", "lose", -10,
            "An alert tells you faster that you broke prod; it doesn't stop you from breaking it. The next custom kernel repeats the outage.",
            "alert אומר לך יותר מהר ששברת את prod; הוא לא מונע ממך לשבור אותו. ה-kernel ה-custom הבא יחזור על התקלה.")
        ]
      },
      win: {
        text: t("Contained to 16 nodes, service restored in under 30 minutes, and the next image (BTF on, Cilium 1.16) passes the canary gate cleanly. You treated the kernel as part of your eBPF stack, which is what it is.",
               "התקלה הוכלה ל-16 nodes, השירות חזר בפחות מ-30 דקות, וה-image הבא (BTF דולק, Cilium 1.16) עובר את ה-gate של ה-canary בלי בעיות. התייחסת ל-kernel כחלק מה-stack של eBPF, כי זה בדיוק מה שהוא."),
        end: "win"
      },
      lose: {
        text: t("The outage spreads or comes back: more nodes without networking and without runtime security, and a postmortem whose real finding is that nobody tested the eBPF agents against the new kernel.",
               "התקלה מתפשטת או חוזרת: עוד nodes בלי רשת ובלי runtime security, ו-postmortem שהממצא האמיתי שלו הוא שאף אחד לא בדק את ה-agents של eBPF מול ה-kernel החדש."),
        end: "lose"
      }
    },
    lessons: ["ebpf-fundamentals", "ebpf-ecosystem", "k8s-day2-upgrades", "staff-ebpf-cilium"]
  });
})();
