window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Linux deep dives: cgroups v2, profiling & tracing, memory leaks,
   plus nginx / HAProxy / Envoy hands-on (networking track)
   ========================================================================= */
(function () {
  var INFRA = window.INFRA;

  /* ---------- shared code blocks (identical in both languages) ---------- */

  const CG_TREE = `$ stat -fc %T /sys/fs/cgroup
cgroup2fs                                  # v2 (v1 prints tmpfs)
$ cat /sys/fs/cgroup/cgroup.controllers
cpuset cpu io memory hugetlb pids rdma misc
$ cat /sys/fs/cgroup/cgroup.subtree_control
cpuset cpu io memory pids                  # enabled for children
$ systemd-cgls --no-pager | head
Control group /:
-.slice
├─user.slice
├─system.slice
│ ├─containerd.service
│ └─sshd.service
└─kubepods.slice
  ├─kubepods-burstable.slice
  └─kubepods-besteffort.slice`;

  const CG_FILES = `# CPU
cpu.max          "200000 100000"   quota/period in µs: 2 CPUs   ("max 100000" = unlimited)
cpu.weight       100               share under contention, 1..10000 (default 100)
cpu.stat         nr_throttled, throttled_usec
# Memory
memory.max       hard limit -&gt; reclaim, then OOM kill inside the cgroup
memory.high      soft limit -&gt; heavy reclaim + throttling, never kills
memory.low       best-effort protection from reclaim
memory.min       hard protection from reclaim
memory.current   usage incl. page cache
memory.events    low / high / max / oom / oom_kill counters
memory.stat      anon, file, active_file, inactive_file, shmem, sock...
# IO / PIDs
io.max           "259:0 rbps=52428800 wiops=500"   per device (major:minor)
io.weight        relative IO share (needs a supporting IO scheduler)
pids.max         "4096"  -&gt; fork() returns EAGAIN beyond it
# Pressure (PSI) per cgroup
cpu.pressure  memory.pressure  io.pressure`;

  const CG_POD = `# On the node (systemd cgroup driver, containerd), Burstable Pod:
$ POD=/sys/fs/cgroup/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-pod3f1c9a2e_77b0_4c1d_9e2a_5b8f0d6a1c44.slice
$ ls $POD
cri-containerd-8e4f...a91.scope   cpu.max  cpu.weight  memory.max  memory.events ...
$ C=$POD/cri-containerd-8e4f...a91.scope

# resources: requests {cpu: 250m, memory: 512Mi}  limits {cpu: "1", memory: 1Gi}
$ cat $C/cpu.weight
10                      # 250m -&gt; shares 256 -&gt; weight 1 + (254*9999)/262142 = 10
$ cat $C/cpu.max
100000 100000           # limit 1 CPU = 100 ms quota per 100 ms period
$ cat $C/memory.max
1073741824              # limit 1Gi
$ cat $C/memory.events
low 0
high 0
max 1873                # hit the limit 1873 times (reclaim kicked in)
oom 3
oom_kill 3              # the kernel killed a process 3 times
oom_group_kill 3        # whole container killed (memory.oom.group=1)

# From INSIDE the container (cgroup namespace): its own cgroup is the root
$ cat /sys/fs/cgroup/memory.max
1073741824`;

  const CG_PSI = `$ cat /proc/pressure/memory
some avg10=12.47 avg60=8.03 avg300=2.91 total=91834211
full avg10=4.10 avg60=2.62 avg300=0.88 total=30122945
# some: % of wall time at least one task was stalled waiting for memory
# full: % of wall time ALL non-idle tasks were stalled (pure lost throughput)
$ cat /sys/fs/cgroup/kubepods.slice/.../cpu.pressure
some avg10=38.21 avg60=35.90 avg300=31.02 total=1702283114
# 38% of the time something in this Pod wanted CPU and could not get it`;

  const CG_SYSTEMD = `# Run a one-off command in its own transient scope with limits
$ sudo systemd-run --scope -p MemoryMax=500M -p MemoryHigh=400M -p CPUQuota=50% \\
      -p TasksMax=200 --unit=batch-import ./import.sh
Running scope as unit: batch-import.scope

# Change a running service live (writes the cgroup files; --runtime = not persistent)
$ sudo systemctl set-property --runtime nginx.service MemoryHigh=1G CPUWeight=200

# Persistent: drop-in for the unit
# /etc/systemd/system/worker.service.d/limits.conf
[Service]
MemoryHigh=3G
MemoryMax=4G
CPUQuota=150%
IOWriteBandwidthMax=/dev/nvme0n1 50M
TasksMax=512

# Live top-like view per cgroup
$ systemd-cgtop -m`;

  const CG_V1V2 = `                  cgroup v1                              cgroup v2
layout            one tree PER controller                one unified tree
                  /sys/fs/cgroup/memory/...              /sys/fs/cgroup/...
memory limit      memory.limit_in_bytes                  memory.max (+ memory.high)
cpu limit         cpu.cfs_quota_us + cpu.cfs_period_us   cpu.max "quota period"
cpu share         cpu.shares (default 1024)              cpu.weight (default 100)
oom stats         memory.oom_control                     memory.events (oom_kill)
pressure          none                                   cpu/memory/io.pressure
writeback         not charged to cgroup                  page cache writeback charged
                                                         and throttled per cgroup`;

  const PF_PERF = `# Live, system-wide hottest functions (like top, but for code)
$ sudo perf top -g -p 4121

# Record 30 s of on-CPU stacks at 99 Hz on all CPUs, then report
$ sudo perf record -F 99 -a -g -- sleep 30
[ perf record: Captured and wrote 4.812 MB perf.data (20811 samples) ]
$ sudo perf report --stdio --sort comm,dso,sym | head -20
  31.20%  api   libc.so.6        [.] __memmove_avx_unaligned_erms
  18.75%  api   api              [.] json_encode_value
   9.02%  api   [kernel.kallsyms] [k] copy_user_enhanced_fast_string

# Flame graph (github.com/brendangregg/FlameGraph)
$ sudo perf script | ./stackcollapse-perf.pl | ./flamegraph.pl &gt; cpu.svg

# Hardware counters: is the CPU actually doing work or waiting on memory?
$ sudo perf stat -e cycles,instructions,cache-misses,context-switches -p 4121 -- sleep 10
  41,203,118,442  cycles
  19,775,490,107  instructions      #    0.48  insn per cycle
     612,904,331  cache-misses
          88,231  context-switches
# IPC 0.48 (&lt; 1) = memory-stall bound; &gt; 2 = compute bound.
# In many VMs/containers you get "&lt;not supported&gt;" for hardware events.`;

  const PF_BPFTRACE = `# Syscalls per process, system-wide (Ctrl-C to print)
$ sudo bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'
@[kubelet]: 18231
@[java]: 412877

# Who opens which files (older bpftrace: args-&gt;filename)
$ sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%-6d %-16s %s\\n", pid, comm, str(args.filename)); }'

# Latency histogram of read() for one PID, in µs
$ sudo bpftrace -e 'tracepoint:syscalls:sys_enter_read /pid == 4121/ { @s[tid] = nsecs; }
  tracepoint:syscalls:sys_exit_read /@s[tid]/ { @us = hist((nsecs - @s[tid]) / 1000); delete(@s[tid]); }'
@us:
[0]                 1290 |@@@@@@@                                     |
[1]                 8810 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
[2, 4)              3012 |@@@@@@@@@@@@@@@                             |
[4, 8)               211 |@                                           |
[8K, 16K)             37 |                                            |   # 8-16 ms outliers!

# CPU profile of one process from eBPF (no perf.data file)
$ sudo bpftrace -e 'profile:hz:99 /pid == 4121/ { @[ustack, kstack] = count(); }'`;

  const PF_BCC = `# Ubuntu/Debian: tool names end in -bpfcc; RHEL: /usr/share/bcc/tools/&lt;name&gt;
$ sudo execsnoop-bpfcc            # every exec(): catches crash-looping helpers, cron storms
PCOMM   PID    PPID   RET ARGS
sh      91822  4121     0 /bin/sh -c curl -s http://169.254.169.254/...
$ sudo opensnoop-bpfcc -x -p 4121 # only FAILED opens: missing config, ENOENT storms
$ sudo biolatency-bpfcc -D 10 1   # block IO latency histogram per disk
$ sudo tcpretrans-bpfcc           # each TCP retransmit with addresses and state
$ sudo runqlat-bpfcc 10 1         # how long runnable threads WAIT for a CPU
     usecs               : count     distribution
         0 -&gt; 1          : 2210     |****************                        |
         2 -&gt; 3          : 5488     |****************************************|
      4096 -&gt; 8191       : 912      |******                                  |   # CPU saturation
$ sudo offcputime-bpfcc -df -p 4121 30 &gt; off.stacks
$ ./flamegraph.pl --color=io --countname=us &lt; off.stacks &gt; offcpu.svg`;

  const PF_STRACE = `# Summary of syscalls (counts, errors, time) - fine for a few seconds
$ sudo strace -c -f -p 4121
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 71.22    2.910311          58     50124           futex
 18.40    0.751902          12     61311      2210 recvfrom
# Targeted, with time spent in each call (-T) and timestamps (-tt)
$ sudo strace -f -tt -T -e trace=connect,openat -p 4121
# Low-overhead alternative from the perf suite (no ptrace stops)
$ sudo perf trace -s -p 4121`;

  const ML_SMAPS = `$ cat /proc/4121/smaps_rollup
55d1c2a00000-7ffd8a5ff000 ---p 00000000 00:00 0    [rollup]
Rss:             2148320 kB
Pss:             2097511 kB
Pss_Anon:        2031904 kB      # private heap/stack: the usual leak suspect
Pss_File:          65233 kB      # mapped binaries/libs/mmapped files
Pss_Shmem:           374 kB
Shared_Clean:      72110 kB
Private_Dirty:   2032218 kB
Anonymous:       2031980 kB
Swap:                  0 kB

$ sudo smem -tk -c "pid name uss pss rss" -P gunicorn
  PID Name          USS      PSS      RSS
 2210 gunicorn    180.2M   201.7M   312.4M
 2211 gunicorn    184.9M   206.3M   317.0M
 2209 gunicorn     22.1M    61.0M   151.3M     # master; shares libs with workers
-------------------------------------------
   3              387.2M   469.0M   780.7M     # RSS sum double-counts shared pages`;

  const ML_CGROUP = `$ C=/sys/fs/cgroup        # inside the container
$ cat $C/memory.current
1912602624                              # 1.78 GiB "usage" (incl. page cache)
$ grep -E '^(anon|file|active_file|inactive_file|shmem|kernel) ' $C/memory.stat
anon 1203765248                         # 1.12 GiB process memory -&gt; the leak suspect
file 671088640                          # 640 MiB page cache
active_file 402653184
inactive_file 268435456
shmem 0                                 # tmpfs / emptyDir medium: Memory lands here
kernel 37748736

# working_set = memory.current - inactive_file = 1.53 GiB
# kubectl top / kubelet eviction / most dashboards show working_set.
# "free" inside the container shows the HOST's memory - ignore it.`;

  const ML_NATIVE = `# Valgrind massif: heap snapshots over time (10-50x slower: test env only)
$ valgrind --tool=massif --time-unit=ms ./server
$ ms_print massif.out.31337 | less

# heaptrack: much lower overhead, can attach to a running process
$ heaptrack -p 4121             # or: heaptrack ./server
$ heaptrack_print heaptrack.server.4121.zst | grep -A5 "PEAK MEMORY CONSUMERS"

# jemalloc heap profiling (jemalloc built with --enable-prof)
$ MALLOC_CONF=prof:true,lg_prof_sample:19,lg_prof_interval:30,prof_prefix:/tmp/jeprof \\
    LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2 ./server
$ jeprof --svg ./server /tmp/jeprof.*.heap &gt; heap.svg

# glibc fragmentation suspect? Many ~64 MB anon regions = malloc arenas
$ pmap -x 4121 | sort -k3 -n | tail -5
$ MALLOC_ARENA_MAX=2 ./server   # fewer arenas, usually much lower RSS for threaded apps`;

  const ML_RUNTIMES = `# --- JVM ---
$ jcmd 1 GC.heap_info                       # heap used vs committed per generation
$ jcmd 1 GC.heap_dump /dumps/h1.hprof       # live objects (forces a full GC)
#   -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps   (always set this)
#   Open in Eclipse MAT: Leak Suspects, Dominator Tree, compare two dumps
# Native (off-heap) memory: start with -XX:NativeMemoryTracking=summary
$ jcmd 1 VM.native_memory baseline
$ jcmd 1 VM.native_memory summary.diff      # hours later: which area grew?
-  Thread (reserved=1062MB +612MB, committed=1062MB +612MB)   # thread leak!

# --- Node.js ---
$ node --inspect=127.0.0.1:9229 server.js   # Chrome DevTools -&gt; Memory -&gt; heap snapshots
$ node --heapsnapshot-signal=SIGUSR2 server.js &amp;&amp; kill -USR2 &lt;pid&gt;
#   A snapshot needs roughly the heap size again in RAM: it can OOM the Pod itself.

# --- Python ---
import tracemalloc; tracemalloc.start(25)
s1 = tracemalloc.take_snapshot()  # ... hours later ...
for st in tracemalloc.take_snapshot().compare_to(s1, "lineno")[:10]: print(st)
$ memray attach 4121              # or: memray run -o out.bin app.py
$ memray flamegraph out.bin       # includes native (C extension) allocations

# --- Go ---
import _ "net/http/pprof"         // serves /debug/pprof on your debug port
$ curl -s localhost:6060/debug/pprof/heap &gt; h1.pb.gz   # ...hours later -&gt; h2.pb.gz
$ go tool pprof -sample_index=inuse_space -base h1.pb.gz h2.pb.gz
(pprof) top
      flat  flat%   sum%        cum   cum%
  612.5MB 81.20% 81.20%   612.5MB 81.20%  main.(*Cache).Put
$ curl -s 'localhost:6060/debug/pprof/goroutine?debug=1' | head -3
goroutine profile: total 148211             # was 300 yesterday: goroutine leak`;

  const ML_FD = `$ ls /proc/4121/fd | wc -l
63211
$ grep 'open files' /proc/4121/limits
Max open files            65536                65536                files
$ sudo lsof -p 4121 | awk '{print $5}' | sort | uniq -c | sort -rn | head -3
  62980 IPv4                                # sockets, not files
$ ss -tanp | grep 'pid=4121' | awk '{print $1}' | sort | uniq -c
  62870 CLOSE-WAIT                          # peer closed, app never called close()`;

  const PX_NGINX = `upstream app {
    least_conn;
    server 10.0.2.11:8080 max_fails=3 fail_timeout=30s;   # passive health check
    server 10.0.2.12:8080 max_fails=3 fail_timeout=30s;
    server 10.0.2.13:8080 backup;
    keepalive 64;              # idle upstream connections kept PER WORKER
    keepalive_timeout 60s;     # must be SHORTER than the app's idle timeout
}

map $http_upgrade $connection_upgrade { default upgrade; '' ""; }

limit_req_zone $binary_remote_addr zone=perip:10m rate=20r/s;   # 10 MB ~ 160k IPs

log_format timed '$remote_addr "$request" $status rt=$request_time '
                 'urt=$upstream_response_time ua=$upstream_addr us=$upstream_status';

server {
    listen 443 ssl;
    http2 on;                                  # nginx 1.25.1+
    server_name api.example.com;
    ssl_certificate     /etc/nginx/tls/api.fullchain.pem;
    ssl_certificate_key /etc/nginx/tls/api.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    access_log /var/log/nginx/api.log timed;

    set_real_ip_from 10.0.0.0/8;               # trust XFF only from our LB
    real_ip_header X-Forwarded-For;
    real_ip_recursive on;

    location / {
        limit_req zone=perip burst=40 nodelay;
        limit_req_status 429;

        proxy_pass http://app;
        proxy_http_version 1.1;                # required for upstream keepalive
        proxy_set_header Connection $connection_upgrade;   # "" for normal requests
        proxy_set_header Upgrade $http_upgrade;            # websockets
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 3s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;             # silence &gt; 30s from upstream =&gt; 504
        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;           # POST is NOT retried after it was sent
    }
    location /ws/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 1h;                 # idle websocket would die at 30s
    }
    location = /nginx_status { stub_status; allow 10.0.0.0/8; deny all; }
}`;

  const PX_HAPROXY = `global
    maxconn 50000
    stats socket /run/haproxy/admin.sock mode 660 level admin
    hard-stop-after 30m                 # old processes after reload exit by then

defaults
    mode http
    option httplog
    option forwardfor                   # adds X-Forwarded-For
    timeout connect          3s
    timeout client           30s
    timeout server           30s        # no response from server =&gt; 504
    timeout http-request     10s        # slowloris protection
    timeout http-keep-alive  2s
    timeout tunnel           1h         # websockets after the Upgrade
    retries 2
    option redispatch                   # retry on another server

frontend fe_api
    bind :443 ssl crt /etc/haproxy/certs/api.pem alpn h2,http/1.1
    http-request set-header X-Forwarded-Proto https
    stick-table type ip size 200k expire 1m store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 200 }
    default_backend be_app

backend be_app
    balance leastconn
    option httpchk
    http-check send meth GET uri /healthz
    http-check expect status 200
    http-reuse safe                     # share idle server connections
    server app1 10.0.2.11:8080 check inter 2s fall 3 rise 2 maxconn 200
    server app2 10.0.2.12:8080 check inter 2s fall 3 rise 2 maxconn 200

frontend stats
    bind 127.0.0.1:8404
    stats enable
    stats uri /stats
    http-request use-service prometheus-exporter if { path /metrics }`;

  const PX_ENVOY = `static_resources:
  listeners:
  - name: https
    address: { socket_address: { address: 0.0.0.0, port_value: 8443 } }
    filter_chains:
    - transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
          common_tls_context:
            tls_certificates:
            - certificate_chain: { filename: /etc/envoy/api.fullchain.pem }
              private_key:       { filename: /etc/envoy/api.key }
      filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress
          use_remote_address: true          # append real peer IP to XFF
          upgrade_configs: [{ upgrade_type: websocket }]
          stream_idle_timeout: 300s
          access_log:
          - name: envoy.access_loggers.stdout
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
          route_config:
            virtual_hosts:
            - name: api
              domains: ["api.example.com"]
              routes:
              - match: { prefix: "/" }
                route:
                  cluster: app
                  timeout: 15s              # default 15s; exceeded =&gt; 504 + flag UT
                  retry_policy:
                    retry_on: connect-failure,refused-stream,reset,gateway-error
                    num_retries: 2
                    per_try_timeout: 5s
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
  - name: app
    type: STRICT_DNS
    connect_timeout: 2s
    lb_policy: LEAST_REQUEST
    load_assignment:
      cluster_name: app
      endpoints:
      - lb_endpoints:
        - endpoint: { address: { socket_address: { address: app.internal, port_value: 8080 } } }
    health_checks:
    - timeout: 1s
      interval: 5s
      unhealthy_threshold: 3
      healthy_threshold: 2
      http_health_check: { path: /healthz }
    outlier_detection:                  # passive: eject hosts returning 5xx
      consecutive_5xx: 5
      base_ejection_time: 30s
    circuit_breakers:
      thresholds: [{ max_connections: 1024, max_pending_requests: 1024, max_retries: 3 }]

admin:
  address: { socket_address: { address: 127.0.0.1, port_value: 9901 } }`;

  const PX_TIMEOUTS = `Symptom      nginx                             HAProxy (log flags)          Envoy (RESPONSE_FLAGS)
504          proxy_read_timeout hit            timeout server: sH--         route timeout: UT
             "upstream timed out (110)"        Tr = -1, Ta ~ 30000
502          upstream reset / closed /         server aborted: SH--         nginx-style 502 is rare;
             refused, bad response             or bad response: PH--        Envoy answers 503 + UF/UC
             "upstream prematurely closed"
503          no live upstreams                 no server available: SC--    no healthy host: UH
                                                                            circuit breaker: UO
idle race    upstream closes a kept-alive      same: http-reuse picked a    same: UC (upstream
             connection while nginx reuses it  dying connection             connection termination)`;

  const PX_OBS = `# nginx stub_status
$ curl -s 127.0.0.1/nginx_status
Active connections: 291
server accepts handled requests
 16630948 16630948 31070465        # accepts == handled -&gt; no worker_connections drops
Reading: 6 Writing: 179 Waiting: 106

# HAProxy runtime API
$ echo "show stat" | sudo socat stdio /run/haproxy/admin.sock | cut -d, -f1,2,18,5,34 | column -s, -t
$ echo "set server be_app/app1 state drain" | sudo socat stdio /run/haproxy/admin.sock
$ echo "show servers conn be_app" | sudo socat stdio /run/haproxy/admin.sock

# Envoy admin
$ curl -s 127.0.0.1:9901/clusters | grep -E 'health_flags|rq_active'
app::10.0.2.11:8080::health_flags::healthy
app::10.0.2.12:8080::health_flags::/failed_active_hc/failed_outlier_check
$ curl -s 127.0.0.1:9901/stats | grep -E 'cluster.app.upstream_(rq_timeout|cx_destroy_remote_with_active_rq|rq_retry)'
cluster.app.upstream_rq_timeout: 412
cluster.app.upstream_rq_retry: 1980
$ curl -s 127.0.0.1:9901/stats/prometheus | head    # same, Prometheus format`;

  const PX_RELOAD = `# nginx: validate, then graceful reload (master spawns new workers,
# old workers stop accepting and finish in-flight requests)
$ sudo nginx -t &amp;&amp; sudo nginx -s reload
#   worker_shutdown_timeout 60s;   # otherwise long websockets keep old workers alive for hours

# HAProxy: master-worker mode; listening sockets are passed to the new process
$ sudo haproxy -c -f /etc/haproxy/haproxy.cfg &amp;&amp; sudo systemctl reload haproxy

# Envoy: routes/clusters/endpoints change via xDS with no restart at all;
# binary upgrades use hot restart (--restart-epoch) with a drain period
$ curl -s -X POST 127.0.0.1:9901/drain_listeners?graceful   # before stopping a pod`;

  /* =============================== LESSON 1 =============================== */
  INFRA.lessons.push({
    id: "linux-cgroups-v2",
    track: "linux",
    order: 30,
    icon: "🧱",
    level: 3,
    minutes: 16,
    title: { en: "cgroups v2 Hands-On", he: "cgroups v2 בידיים" },
    tldr: {
      en: "Every container limit is just a number in a file under /sys/fs/cgroup: cpu.max, cpu.weight, memory.max/high, io.max, pids.max. Learn to read those files, memory.events and PSI, and you can explain any throttling or OOM kill in minutes.",
      he: "כל limit של קונטיינר הוא בסך הכול מספר בקובץ תחת /sys/fs/cgroup: cpu.max, cpu.weight, memory.max/high, io.max, pids.max. כשאתה יודע לקרוא את הקבצים האלה, את memory.events ואת PSI, אתה מסביר כל throttling או OOM kill תוך דקות."
    },
    analogy: {
      en: "Think of a shared office building. cgroups v1 had a separate manager per utility: one for electricity, one for water, one for parking, each with their own floor plan of who belongs where. v2 is one building directory: every team sits in exactly one office, and that office has one meter panel with all the dials (power cap, water cap, guaranteed parking) plus a 'how long did people wait in line' gauge - that's PSI.",
      he: "תחשוב על בניין משרדים משותף. ב-cgroups v1 היה מנהל נפרד לכל משאב: אחד לחשמל, אחד למים, אחד לחניה, ולכל אחד תוכנית קומה משלו של מי יושב איפה. v2 זה אינדקס בניין אחד: כל צוות יושב בדיוק במשרד אחד, ולמשרד יש לוח מונים אחד עם כל החוגות (תקרת חשמל, תקרת מים, חניה מובטחת) ועוד מד של 'כמה זמן אנשים חיכו בתור' - זה PSI."
    },
    sections: [
      {
        h: { en: "The unified hierarchy", he: "ההיררכיה המאוחדת" },
        body: {
          en: `<p>cgroup v2 is a single tree mounted at <code>/sys/fs/cgroup</code>. Each directory is a cgroup; a process belongs to exactly one (listed in <code>cgroup.procs</code>). <code>cgroup.controllers</code> lists what is available, and <code>cgroup.subtree_control</code> lists what is <em>enabled for children</em> - a controller must be enabled in the parent before a child gets its files.</p>
<pre>${CG_TREE}</pre>
<p>Two rules that surprise people coming from v1: the <strong>"no internal processes"</strong> rule (a non-root cgroup that distributes resources to children cannot also hold processes itself), and <strong>systemd owns the tree</strong>. systemd organizes everything into <em>slices</em> (<code>system.slice</code>, <code>user.slice</code>, <code>kubepods.slice</code>), <em>services</em> and <em>scopes</em>. That's why the kubelet and containerd should use the <code>systemd</code> cgroup driver - two managers writing the same tree end in tears.</p>
<p>Check what you're on: <code>stat -fc %T /sys/fs/cgroup</code> prints <code>cgroup2fs</code> on v2. Defaults: RHEL 9, Ubuntu 21.10+, Debian 11+, Amazon Linux 2023, Bottlerocket and COS are v2; Amazon Linux 2 and CentOS 7 are v1.</p>`,
          he: `<p>cgroup v2 הוא עץ אחד שמותקן ב-<code>/sys/fs/cgroup</code>. כל תיקייה היא cgroup; כל תהליך שייך בדיוק לאחד (רשום ב-<code>cgroup.procs</code>). <code>cgroup.controllers</code> מראה מה זמין, ו-<code>cgroup.subtree_control</code> מראה מה <em>מופעל לילדים</em> - controller חייב להיות מופעל באבא לפני שהילד מקבל את הקבצים שלו.</p>
<pre>${CG_TREE}</pre>
<p>שני כללים שמפתיעים מי שמגיע מ-v1: כלל <strong>"no internal processes"</strong> (cgroup שאינו ה-root ומחלק משאבים לילדים לא יכול להחזיק תהליכים בעצמו), ו-<strong>systemd הוא הבעלים של העץ</strong>. systemd מארגן הכול ב-<em>slices</em> (<code>system.slice</code>, <code>user.slice</code>, <code>kubepods.slice</code>), <em>services</em> ו-<em>scopes</em>. לכן ה-kubelet ו-containerd צריכים לעבוד עם ה-cgroup driver של <code>systemd</code> - שני מנהלים שכותבים לאותו עץ זה מתכון לבלגן.</p>
<p>בדוק על מה אתה רץ: <code>stat -fc %T /sys/fs/cgroup</code> מדפיס <code>cgroup2fs</code> ב-v2. ברירות מחדל: RHEL 9, Ubuntu 21.10 ומעלה, Debian 11 ומעלה, Amazon Linux 2023, Bottlerocket ו-COS הם v2; Amazon Linux 2 ו-CentOS 7 הם v1.</p>`
        }
      },
      {
        h: { en: "The controller files that matter", he: "קבצי ה-controllers שחשובים באמת" },
        body: {
          en: `<pre>${CG_FILES}</pre>
<p><strong>CPU:</strong> <code>cpu.max</code> is a hard cap enforced per period (default 100 ms): a 2-CPU quota is 200 ms of CPU time per 100 ms window across all threads. A 16-thread JVM can burn that in 12.5 ms and then sit throttled for 87.5 ms - that's the p99 spike you see even at "40% average CPU". <code>cpu.weight</code> only matters under contention: two busy siblings with weights 100 and 300 split a saturated CPU 25/75, but an idle sibling's share is free for the taking.</p>
<p><strong>Memory</strong> has a ladder: <code>memory.min</code>/<code>memory.low</code> protect a cgroup from reclaim, <code>memory.high</code> is the throttle point (the kernel reclaims aggressively and slows allocations, but never kills), and <code>memory.max</code> is the wall (reclaim fails → OOM kill inside this cgroup only). Setting <code>memory.high</code> ~10-20% under <code>memory.max</code> turns a sudden OOM kill into a visible slowdown plus <code>high</code> events you can alert on.</p>
<p><strong>pids.max</strong> stops fork bombs and thread leaks: beyond it, <code>fork()</code>/<code>clone()</code> fail with EAGAIN ("Resource temporarily unavailable" or Java's "unable to create native thread"). <strong>io.max</strong> caps bytes/IOPS per device by <code>major:minor</code> (from <code>lsblk</code>). Unlike v1, v2 charges page cache writeback to the cgroup that dirtied it, so buffered writes are finally throttled correctly.</p>
<blockquote>⚠️ Production tip: memory usage in <code>memory.current</code> <em>includes page cache</em>. A container reading big files looks "near its limit" while being perfectly healthy - the kernel reclaims clean cache before it kills anything. Look at <code>anon</code> vs <code>file</code> in <code>memory.stat</code> before panicking.</blockquote>`,
          he: `<pre>${CG_FILES}</pre>
<p><strong>CPU:</strong> <code>cpu.max</code> הוא תקרה קשיחה שנאכפת בכל period (ברירת מחדל 100 ms): quota של 2 CPU זה 200 ms של זמן CPU בכל חלון של 100 ms, על פני כל ה-threads. JVM עם 16 threads יכול לשרוף את זה ב-12.5 ms ואז לשבת ב-throttling במשך 87.5 ms - זה ה-spike ב-p99 שאתה רואה גם ב-"40% CPU בממוצע". <code>cpu.weight</code> משנה רק כשיש תחרות: שני אחים עסוקים עם weights של 100 ו-300 מתחלקים ב-CPU רווי 25/75, אבל החלק של אח שלא עושה כלום פנוי לכל מי שרוצה.</p>
<p>ל-<strong>Memory</strong> יש סולם: <code>memory.min</code>/<code>memory.low</code> מגינים על cgroup מ-reclaim, <code>memory.high</code> הוא נקודת ה-throttle (ה-kernel עושה reclaim אגרסיבי ומאט הקצאות, אבל אף פעם לא הורג), ו-<code>memory.max</code> הוא הקיר (ה-reclaim נכשל ← OOM kill רק בתוך ה-cgroup הזה). אם אתה מגדיר <code>memory.high</code> בערך 10-20% מתחת ל-<code>memory.max</code>, OOM kill פתאומי הופך להאטה שרואים, ועוד events של <code>high</code> שאפשר להתריע עליהם.</p>
<p><strong>pids.max</strong> עוצר fork bombs ודליפות threads: מעבר לו, <code>fork()</code>/<code>clone()</code> נכשלים עם EAGAIN ("Resource temporarily unavailable" או ב-Java "unable to create native thread"). <strong>io.max</strong> מגביל bytes/IOPS לכל device לפי <code>major:minor</code> (מ-<code>lsblk</code>). בניגוד ל-v1, ב-v2 ה-writeback של ה-page cache נזקף ל-cgroup שלכלך אותו, אז כתיבות buffered סוף סוף נחנקות כמו שצריך.</p>
<blockquote>⚠️ טיפ מהשטח: הצריכה ב-<code>memory.current</code> <em>כוללת page cache</em>. קונטיינר שקורא קבצים גדולים נראה "קרוב ל-limit" למרות שהוא בריא לגמרי - ה-kernel משחרר cache נקי לפני שהוא הורג משהו. תסתכל על <code>anon</code> מול <code>file</code> ב-<code>memory.stat</code> לפני שאתה נכנס ללחץ.</blockquote>`
        }
      },
      {
        h: { en: "Reading a Pod's cgroup: how requests/limits become files", he: "לקרוא את ה-cgroup של Pod: איך requests/limits הופכים לקבצים" },
        body: {
          en: `<p>The kubelet creates a slice per QoS class (<code>kubepods-burstable.slice</code>, <code>kubepods-besteffort.slice</code>; Guaranteed Pods sit directly under <code>kubepods.slice</code>), a slice per Pod (UID with dashes turned into underscores) and a scope per container. Find the container ID with <code>crictl ps</code>, or just read from inside the container.</p>
<pre>${CG_POD}</pre>
<table>
<tr><th>Pod spec</th><th>cgroup v2 file</th></tr>
<tr><td><code>requests.cpu</code></td><td><code>cpu.weight</code> (millicores → shares → weight; 1 CPU ≈ 39, 250m ≈ 10)</td></tr>
<tr><td><code>limits.cpu</code></td><td><code>cpu.max</code> = limit × period (no limit → <code>max 100000</code>)</td></tr>
<tr><td><code>limits.memory</code></td><td><code>memory.max</code> on container and Pod</td></tr>
<tr><td><code>requests.memory</code></td><td>Scheduling only - unless the MemoryQoS feature gate (alpha) is on, which sets <code>memory.min</code> and a <code>memory.high</code> throttle point</td></tr>
<tr><td>Pod PID limit (kubelet <code>podPidsLimit</code>)</td><td><code>pids.max</code> on the Pod slice</td></tr>
</table>
<p>On cgroup v2 the kubelet (1.28+) sets <code>memory.oom.group=1</code>, so an OOM kills the <em>whole container</em> instead of one random worker process, which used to leave a zombie-ish half-alive app. That's what <code>oom_group_kill</code> in <code>memory.events</code> counts.</p>
<blockquote>💡 Real world: "OOMKilled but our memory graph never touched the limit." The graph was a 60-second average of working set; the burst (loading a 700 MB report into memory) lasted 3 seconds. <code>memory.events</code> doesn't average - <code>oom_kill 3</code> is ground truth. Alert on the counter (cAdvisor exposes <code>container_oom_events_total</code>), not on a smoothed gauge.</blockquote>`,
          he: `<p>ה-kubelet יוצר slice לכל QoS class (<code>kubepods-burstable.slice</code>, <code>kubepods-besteffort.slice</code>; Pods של Guaranteed יושבים ישירות תחת <code>kubepods.slice</code>), slice לכל Pod (ה-UID כשהמקפים הופכים לקו תחתון) ו-scope לכל קונטיינר. את ה-ID של הקונטיינר מוצאים עם <code>crictl ps</code>, או פשוט קוראים מתוך הקונטיינר.</p>
<pre>${CG_POD}</pre>
<table>
<tr><th>Pod spec</th><th>קובץ cgroup v2</th></tr>
<tr><td><code>requests.cpu</code></td><td><code>cpu.weight</code> (millicores ← shares ← weight; 1 CPU ≈ 39, 250m ≈ 10)</td></tr>
<tr><td><code>limits.cpu</code></td><td><code>cpu.max</code> = limit × period (בלי limit ← <code>max 100000</code>)</td></tr>
<tr><td><code>limits.memory</code></td><td><code>memory.max</code> על הקונטיינר ועל ה-Pod</td></tr>
<tr><td><code>requests.memory</code></td><td>רק ל-scheduling - אלא אם ה-feature gate של MemoryQoS (alpha) דולק, ואז הוא קובע <code>memory.min</code> ונקודת throttle ב-<code>memory.high</code></td></tr>
<tr><td>PID limit של Pod (ב-kubelet: <code>podPidsLimit</code>)</td><td><code>pids.max</code> על ה-slice של ה-Pod</td></tr>
</table>
<p>על cgroup v2 ה-kubelet (מגרסה 1.28) מגדיר <code>memory.oom.group=1</code>, כך ש-OOM הורג את <em>כל הקונטיינר</em> במקום worker אקראי אחד, מה שפעם השאיר אפליקציה חצי חיה. את זה סופר <code>oom_group_kill</code> ב-<code>memory.events</code>.</p>
<blockquote>💡 מהשטח: "קיבלנו OOMKilled אבל גרף הזיכרון אף פעם לא נגע ב-limit." הגרף היה ממוצע של 60 שניות על working set; ה-burst (טעינת דוח של 700 MB לזיכרון) נמשך 3 שניות. <code>memory.events</code> לא עושה ממוצע - <code>oom_kill 3</code> זו האמת. תתריע על ה-counter (cAdvisor חושף <code>container_oom_events_total</code>), לא על gauge מוחלק.</blockquote>`
        }
      },
      {
        h: { en: "PSI: measure waiting, not usage", he: "PSI: למדוד המתנה, לא צריכה" },
        body: {
          en: `<p>Utilization tells you a resource is busy; <strong>Pressure Stall Information</strong> (kernel 4.20+) tells you whether work is <em>waiting</em> for it. It exists system-wide in <code>/proc/pressure/{cpu,memory,io}</code> and per cgroup in <code>cpu.pressure</code>, <code>memory.pressure</code>, <code>io.pressure</code>.</p>
<pre>${CG_PSI}</pre>
<p>Read it as "percent of wall time lost": <code>some</code> = at least one task stalled, <code>full</code> = every runnable task stalled at once (total throughput loss). Rough guide: CPU <code>some avg10</code> above ~20-30% for a Pod means it needs more CPU or its <code>cpu.max</code> is throttling it; memory <code>full</code> above a few percent means it's thrashing in reclaim long before any OOM kill. Some distros ship PSI compiled in but disabled - enable with the <code>psi=1</code> boot parameter.</p>
<blockquote>💡 Real world: Meta's <strong>oomd</strong> and its systemd successor <strong>systemd-oomd</strong> kill workloads based on memory PSI (e.g. <code>ManagedOOMMemoryPressureLimit=60%</code> over 30 s) instead of waiting for the kernel OOM killer - the box stays responsive. Kubernetes exposes PSI via the kubelet's cAdvisor metrics (<code>container_pressure_*</code>) from 1.34 on, behind a feature gate in earlier versions.</blockquote>`,
          he: `<p>Utilization אומר לך שמשאב עסוק; <strong>Pressure Stall Information</strong> (מ-kernel 4.20) אומר לך אם עבודה <em>מחכה</em> לו. הוא קיים ברמת המערכת ב-<code>/proc/pressure/{cpu,memory,io}</code> וברמת cgroup ב-<code>cpu.pressure</code>, <code>memory.pressure</code>, <code>io.pressure</code>.</p>
<pre>${CG_PSI}</pre>
<p>תקרא את זה כ"אחוז זמן שהלך לפח": <code>some</code> = לפחות task אחד תקוע, <code>full</code> = כל ה-tasks שמוכנים לרוץ תקועים בבת אחת (אובדן throughput מלא). כלל אצבע: <code>some avg10</code> של CPU מעל 20-30% ב-Pod אומר שהוא צריך עוד CPU או שה-<code>cpu.max</code> חונק אותו; <code>full</code> של memory מעל אחוזים בודדים אומר שהוא עושה thrashing ב-reclaim הרבה לפני כל OOM kill. בחלק מההפצות PSI מקומפל אבל כבוי - מדליקים עם פרמטר ה-boot <code>psi=1</code>.</p>
<blockquote>💡 מהשטח: ה-<strong>oomd</strong> של Meta והיורש שלו ב-systemd, <strong>systemd-oomd</strong>, הורגים workloads לפי memory PSI (למשל <code>ManagedOOMMemoryPressureLimit=60%</code> לאורך 30 שניות) במקום לחכות ל-OOM killer של ה-kernel - והמכונה נשארת רספונסיבית. Kubernetes חושף PSI דרך מטריקות cAdvisor של ה-kubelet (<code>container_pressure_*</code>) מגרסה 1.34, ומאחורי feature gate בגרסאות קודמות.</blockquote>`
        }
      },
      {
        h: { en: "systemd slices, and the v1 → v2 migration gotchas", he: "systemd slices, והמוקשים במעבר מ-v1 ל-v2" },
        body: {
          en: `<p>You don't need containers to use cgroups. systemd properties map 1:1 to v2 files: <code>MemoryMax</code> → <code>memory.max</code>, <code>MemoryHigh</code> → <code>memory.high</code>, <code>CPUQuota=150%</code> → <code>cpu.max "150000 100000"</code>, <code>CPUWeight</code> → <code>cpu.weight</code>, <code>TasksMax</code> → <code>pids.max</code>, <code>IOReadBandwidthMax</code> → <code>io.max</code>.</p>
<pre>${CG_SYSTEMD}</pre>
<p>Moving a fleet from v1 to v2:</p>
<pre>${CG_V1V2}</pre>
<ul>
<li><strong>Old runtimes are blind to v2.</strong> JDK container support for v2 arrived in JDK 15 and was backported to 11.0.16 and 8u372. An older JVM on a v2 node sees the <em>host's</em> RAM and cores: default heap = 1/4 of a 64 GB node = 16 GB inside a 2 GB container → OOM kill. Check with <code>java -XshowSettings:system -version</code> (prints "Provider: cgroupv2").</li>
<li><strong>Agents and scripts reading v1 paths</strong> (<code>/sys/fs/cgroup/memory/memory.usage_in_bytes</code>) silently return nothing: old cAdvisor, Datadog/New Relic agents, custom entrypoint scripts that size worker pools.</li>
<li><strong>Go</strong> got cgroup-aware GOMAXPROCS only in 1.25; before that use <code>uber-go/automaxprocs</code> or set <code>GOMAXPROCS</code> explicitly. Node and Python size thread pools from host cores too.</li>
<li><strong>Kubernetes</strong> put v1 support in maintenance mode in 1.31, and recent kubelets refuse to start on v1 nodes by default. Switch a node with the kernel parameter <code>systemd.unified_cgroup_hierarchy=1</code> and a reboot, and roll node pools rather than flipping in place.</li>
</ul>`,
          he: `<p>לא צריך קונטיינרים כדי להשתמש ב-cgroups. ה-properties של systemd ממופים 1:1 לקבצי v2: <code>MemoryMax</code> ← <code>memory.max</code>, <code>MemoryHigh</code> ← <code>memory.high</code>, <code>CPUQuota=150%</code> ← <code>cpu.max "150000 100000"</code>, <code>CPUWeight</code> ← <code>cpu.weight</code>, <code>TasksMax</code> ← <code>pids.max</code>, <code>IOReadBandwidthMax</code> ← <code>io.max</code>.</p>
<pre>${CG_SYSTEMD}</pre>
<p>כשמעבירים fleet מ-v1 ל-v2:</p>
<pre>${CG_V1V2}</pre>
<ul>
<li><strong>Runtimes ישנים עיוורים ל-v2.</strong> התמיכה של ה-JDK ב-v2 הגיעה ב-JDK 15 ועברה backport ל-11.0.16 ול-8u372. JVM ישן על node עם v2 רואה את ה-RAM וה-cores של <em>ה-host</em>: heap ברירת מחדל = רבע מ-node של 64 GB = 16 GB בתוך קונטיינר של 2 GB ← OOM kill. בדוק עם <code>java -XshowSettings:system -version</code> (מדפיס "Provider: cgroupv2").</li>
<li><strong>Agents וסקריפטים שקוראים נתיבים של v1</strong> (<code>/sys/fs/cgroup/memory/memory.usage_in_bytes</code>) מחזירים כלום בשקט: cAdvisor ישן, agents של Datadog/New Relic, סקריפטי entrypoint שמחשבים גודל של worker pool.</li>
<li><strong>Go</strong> קיבל GOMAXPROCS שמודע ל-cgroup רק ב-1.25; לפני זה השתמש ב-<code>uber-go/automaxprocs</code> או קבע <code>GOMAXPROCS</code> ידנית. גם Node ו-Python מחשבים thread pools לפי ה-cores של ה-host.</li>
<li><strong>Kubernetes</strong> העביר את התמיכה ב-v1 ל-maintenance mode ב-1.31, ו-kubelets חדשים מסרבים לעלות על nodes עם v1 כברירת מחדל. מעבירים node עם פרמטר ה-kernel <code>systemd.unified_cgroup_hierarchy=1</code> ו-reboot, ועדיף לגלגל node pools חדשים במקום להחליף במקום.</li>
</ul>`
        }
      }
    ],
    diagram: "/sys/fs/cgroup (root)\n ├─ system.slice ── containerd.service, sshd.service\n ├─ user.slice\n └─ kubepods.slice                       cpu.weight / memory.max of the node allocatable\n     ├─ kubepods-pod<uid>.slice           (Guaranteed)\n     └─ kubepods-burstable.slice\n         └─ kubepods-burstable-pod<uid>.slice     pids.max, memory.max (Pod)\n             └─ cri-containerd-<id>.scope         cpu.max, cpu.weight, memory.max, memory.events",
    handsOn: [
      { cmd: "cat /proc/self/cgroup && stat -fc %T /sys/fs/cgroup", what: { en: "Which cgroup is your shell in, and is the machine on v2 (cgroup2fs)?", he: "באיזה cgroup ה-shell שלך יושב, והאם המכונה על v2 (cgroup2fs)?" } },
      { cmd: "sudo systemd-run --scope -p MemoryMax=200M -p MemoryHigh=150M stress-ng --vm 1 --vm-bytes 300M -t 30s", what: { en: "Push a process past its limit in a transient scope, then read memory.events in its scope directory to see high/max/oom_kill counters move.", he: "דוחפים תהליך מעבר ל-limit שלו ב-scope זמני, ואז קוראים את memory.events בתיקיית ה-scope ורואים את ה-counters של high/max/oom_kill זזים." } },
      { cmd: "kubectl exec deploy/api -- sh -c 'cat /sys/fs/cgroup/cpu.max /sys/fs/cgroup/memory.max /sys/fs/cgroup/memory.events /sys/fs/cgroup/cpu.stat'", what: { en: "Read a Pod's real limits, OOM history and throttling counters from inside the container.", he: "קוראים את ה-limits האמיתיים של Pod, היסטוריית ה-OOM וה-counters של throttling מתוך הקונטיינר." } },
      { cmd: "watch -n2 cat /proc/pressure/cpu /proc/pressure/memory /proc/pressure/io", what: { en: "Watch node-wide PSI while you run a load test - see stalls before utilization hits 100%.", he: "צופים ב-PSI של כל ה-node בזמן load test - רואים stalls לפני שה-utilization מגיע ל-100%." } },
      { cmd: "systemd-cgtop -m -d 2", what: { en: "top for cgroups: which slice/service/Pod eats memory, CPU and IO right now.", he: "top של cgroups: איזה slice/service/Pod אוכל זיכרון, CPU ו-IO עכשיו." } }
    ],
    mnemonic: {
      en: "MAX kills, HIGH slows, LOW and MIN shield; WEIGHT shares, cpu.MAX caps; PSI tells you who waited.",
      he: "MAX הורג, HIGH מאט, LOW ו-MIN מגינים; WEIGHT מחלק, cpu.MAX חוסם; PSI מספר מי חיכה."
    },
    pitfalls: [
      { en: "Reading memory.current as 'the app's memory': it includes page cache. Compare anon vs file in memory.stat (or working set) before calling it a leak.", he: "לקרוא את memory.current כ'זיכרון של האפליקציה': הוא כולל page cache. השווה anon מול file ב-memory.stat (או working set) לפני שאתה קורא לזה דליפה." },
      { en: "Watching average CPU and ignoring cpu.stat nr_throttled: quota is enforced per 100 ms, so a multi-threaded app can be throttled heavily at 30% average usage.", he: "להסתכל על CPU ממוצע ולהתעלם מ-nr_throttled ב-cpu.stat: ה-quota נאכפת בכל 100 ms, אז אפליקציה עם הרבה threads יכולה לחטוף throttling כבד ב-30% שימוש ממוצע." },
      { en: "Migrating nodes to v2 without checking runtimes: JDK older than 11.0.16 / 8u372, old Go without automaxprocs and v1-path agents size themselves from the host and get OOM-killed or starve.", he: "להעביר nodes ל-v2 בלי לבדוק runtimes: JDK ישן מ-11.0.16 / 8u372, Go ישן בלי automaxprocs ו-agents שקוראים נתיבי v1 מחשבים את עצמם לפי ה-host ומקבלים OOM kill או נחנקים." },
      { en: "Mixing cgroupfs and systemd drivers between kubelet and containerd: two managers fight over the tree and the node becomes unstable under pressure.", he: "לערבב driver של cgroupfs ושל systemd בין ה-kubelet ל-containerd: שני מנהלים נלחמים על העץ וה-node נהיה לא יציב תחת עומס." }
    ],
    interview: [
      {
        q: { en: "What's the difference between memory.high and memory.max, and how would you use both?", he: "מה ההבדל בין memory.high ל-memory.max, ואיך היית משתמש בשניהם?" },
        a: { en: "memory.max is a hard limit: when reclaim can't get usage below it, the OOM killer fires inside that cgroup. memory.high is a throttle: above it the kernel reclaims aggressively and slows the cgroup's allocations but never kills. Set high ~10-20% below max so a runaway shows up as latency and 'high' events in memory.events you can alert on, before it becomes an OOM kill.", he: "memory.max הוא limit קשיח: כשה-reclaim לא מצליח להוריד את הצריכה מתחתיו, ה-OOM killer יורה בתוך ה-cgroup. memory.high הוא throttle: מעליו ה-kernel עושה reclaim אגרסיבי ומאט את ההקצאות של ה-cgroup, אבל אף פעם לא הורג. מגדירים high בערך 10-20% מתחת ל-max, כך שתהליך שבורח מופיע כ-latency וכ-events של 'high' ב-memory.events שאפשר להתריע עליהם, לפני שזה הופך ל-OOM kill." }
      },
      {
        q: { en: "A Pod shows 35% average CPU but its p99 latency is terrible. What do you check in cgroups?", he: "Pod מראה 35% CPU בממוצע אבל ה-p99 שלו נוראי. מה אתה בודק ב-cgroups?" },
        a: { en: "cpu.stat: if nr_throttled/nr_periods is high and throttled_usec grows, cpu.max is cutting bursts - many threads exhaust the 100 ms quota early and wait. Confirm with cpu.pressure (some avg10 high). Fixes: raise or remove the CPU limit (keep requests), reduce thread count / GOMAXPROCS to match the quota, or smooth the burst.", he: "את cpu.stat: אם nr_throttled/nr_periods גבוה ו-throttled_usec עולה, cpu.max חותך את ה-bursts - הרבה threads מכלים את ה-quota של 100 ms מוקדם ומחכים. מאשרים עם cpu.pressure (some avg10 גבוה). פתרונות: להעלות או להוריד את ה-CPU limit (להשאיר requests), להוריד את מספר ה-threads / GOMAXPROCS כך שיתאים ל-quota, או להחליק את ה-burst." }
      }
    ],
    quiz: [
      {
        q: { en: "A container has limits.cpu: 2 (cgroup v2). What is in its cpu.max?", he: "לקונטיינר יש limits.cpu: 2 (cgroup v2). מה יש ב-cpu.max שלו?" },
        options: [
          { en: "2048", he: "2048" },
          { en: "200000 100000", he: "200000 100000" },
          { en: "max 100000", he: "max 100000" },
          { en: "200", he: "200" }
        ],
        answer: 1,
        explain: { en: "cpu.max is 'quota period' in microseconds: 2 CPUs = 200 ms of CPU time per 100 ms period. 'max 100000' means no limit; 2048 was the v1 cpu.shares value for a 2-CPU request.", he: "cpu.max הוא 'quota period' במיקרו-שניות: 2 CPU = 200 ms של זמן CPU בכל period של 100 ms. 'max 100000' אומר שאין limit; 2048 היה הערך של cpu.shares ב-v1 ל-request של 2 CPU." }
      },
      {
        q: { en: "Which file proves the kernel OOM-killed a process in this cgroup, even if your metrics graph never showed the limit?", he: "איזה קובץ מוכיח שה-kernel עשה OOM kill לתהליך ב-cgroup הזה, גם אם הגרף לא הראה שהגעת ל-limit?" },
        options: [
          { en: "memory.current", he: "memory.current" },
          { en: "memory.stat", he: "memory.stat" },
          { en: "memory.events (oom_kill counter)", he: "memory.events (ה-counter של oom_kill)" },
          { en: "/proc/meminfo", he: "/proc/meminfo" }
        ],
        answer: 2,
        explain: { en: "memory.events keeps monotonic counters (low, high, max, oom, oom_kill). They catch short bursts that a sampled or averaged gauge misses.", he: "memory.events שומר counters שרק עולים (low, high, max, oom, oom_kill). הם תופסים bursts קצרים ש-gauge מדוגם או ממוצע מפספס." }
      },
      {
        q: { en: "/proc/pressure/memory shows 'full avg10=6.2'. What does it mean?", he: "/proc/pressure/memory מראה 'full avg10=6.2'. מה זה אומר?" },
        options: [
          { en: "6.2% of RAM is free", he: "6.2% מה-RAM פנוי" },
          { en: "In the last 10 s, all non-idle tasks were stalled on memory 6.2% of the time", he: "ב-10 השניות האחרונות, כל ה-tasks הפעילים היו תקועים על זיכרון 6.2% מהזמן" },
          { en: "6.2 processes were OOM-killed", he: "6.2 תהליכים קיבלו OOM kill" },
          { en: "Swap is 6.2% full", he: "ה-swap מלא ב-6.2%" }
        ],
        answer: 1,
        explain: { en: "PSI 'full' is the share of wall time when every runnable task was waiting on the resource at once - pure lost throughput. A few percent of memory 'full' means real reclaim thrashing.", he: "'full' ב-PSI הוא החלק מהזמן שבו כל ה-tasks שמוכנים לרוץ חיכו למשאב בבת אחת - throughput שהלך לפח. כמה אחוזים של 'full' בזיכרון אומר thrashing אמיתי ב-reclaim." }
      },
      {
        q: { en: "After moving nodes to cgroup v2, a Java 11.0.9 service starts getting OOMKilled. Most likely cause?", he: "אחרי שהעברת nodes ל-cgroup v2, שירות Java 11.0.9 מתחיל לקבל OOMKilled. מה הסיבה הסבירה?" },
        options: [
          { en: "cgroup v2 uses more memory per container", he: "cgroup v2 צורך יותר זיכרון לכל קונטיינר" },
          { en: "The JVM doesn't detect v2 limits and sizes its heap from the host's RAM", he: "ה-JVM לא מזהה limits של v2 ומחשב את ה-heap לפי ה-RAM של ה-host" },
          { en: "memory.max is ignored on v2", he: "ב-v2 מתעלמים מ-memory.max" },
          { en: "Kubernetes doubles the limit on v2", he: "Kubernetes מכפיל את ה-limit ב-v2" }
        ],
        answer: 1,
        explain: { en: "cgroup v2 detection landed in JDK 15 and was backported to 11.0.16 and 8u372. Older JVMs fall back to host memory, pick a huge default heap and blow past memory.max. Upgrade the JDK or set -Xmx explicitly.", he: "זיהוי של cgroup v2 נכנס ב-JDK 15 ועבר backport ל-11.0.16 ול-8u372. JVMs ישנים נופלים לזיכרון של ה-host, בוחרים heap ענק כברירת מחדל ועוברים את memory.max. שדרג את ה-JDK או קבע -Xmx ידנית." }
      }
    ],
    playground: "resources",
    related: ["container-internals", "k8s-resources", "memory", "linux-systemd-logs", "linux-kernel-tuning", "linux-memory-leaks"]
  });

  /* =============================== LESSON 2 =============================== */
  INFRA.lessons.push({
    id: "linux-perf-tracing",
    track: "linux",
    order: 31,
    icon: "🔬",
    level: 3,
    minutes: 16,
    title: { en: "Profiling & Tracing: perf, bpftrace, BCC", he: "Profiling ו-Tracing: perf, bpftrace, BCC" },
    tldr: {
      en: "Sample to find where CPU time goes (perf record + flame graph), count to understand why (perf stat), and trace to see individual events and latencies (bpftrace, BCC) - with eBPF overhead in the low percent, while strace can slow a process 10-100x.",
      he: "דוגמים כדי למצוא לאן הולך זמן ה-CPU (perf record ו-flame graph), סופרים כדי להבין למה (perf stat), ועושים trace כדי לראות אירועים ו-latency בודדים (bpftrace, BCC) - עם overhead של אחוזים בודדים ב-eBPF, בזמן ש-strace יכול להאט תהליך פי 10-100."
    },
    analogy: {
      en: "perf record is a photographer snapping the kitchen 99 times a second: count how many photos show a cook at the grill and you know where time goes. perf stat is the electricity meter. bpftrace is a stopwatch you can clip onto any door in the restaurant. strace is a manager who stops every waiter at the kitchen door to write down the order - accurate, but service grinds to a halt.",
      he: "perf record זה צלם שמצלם את המטבח 99 פעמים בשנייה: תספור בכמה תמונות טבח עומד ליד הגריל ותדע לאן הולך הזמן. perf stat זה מונה החשמל. bpftrace זה סטופר שאפשר להצמיד לכל דלת במסעדה. strace זה מנהל שעוצר כל מלצר בדלת המטבח כדי לרשום את ההזמנה - מדויק, אבל השירות נתקע."
    },
    sections: [
      {
        h: { en: "perf: sampling, reports, flame graphs, counters", he: "perf: דגימה, דוחות, flame graphs, counters" },
        body: {
          en: `<p><code>perf</code> (package <code>linux-tools-$(uname -r)</code> or <code>perf</code>) samples stacks on a timer and reads hardware performance counters. Sample at <strong>99 Hz</strong>, not 100, to avoid lock-step with periodic activity; 99 Hz × 32 CPUs × 30 s ≈ 95k samples, a few MB and well under 1% overhead.</p>
<pre>${PF_PERF}</pre>
<p>A flame graph's x-axis is <em>not time</em>: frames are sorted alphabetically and width = share of samples. Look for wide plateaus near the top - that's where CPU is burned. <code>perf stat</code> answers the next question: an IPC (instructions per cycle) of 0.5 means the code is stalled on memory (cache misses, pointer chasing), so "faster CPU" won't help but better data layout will.</p>
<blockquote>⚠️ Production tip: unprivileged perf is gated by <code>kernel.perf_event_paranoid</code> (2 by default, Debian/Ubuntu patch it to 4 = root only) and <code>kernel.kptr_restrict</code> hides kernel symbols. Run as root or grant <code>CAP_PERFMON</code> (kernel 5.8+) rather than setting paranoid to -1 on shared hosts.</blockquote>`,
          he: `<p><code>perf</code> (חבילה <code>linux-tools-$(uname -r)</code> או <code>perf</code>) דוגם stacks לפי טיימר וקורא hardware performance counters. דוגמים ב-<strong>99 Hz</strong> ולא 100, כדי לא להיות מסונכרן עם פעילות מחזורית; 99 Hz × 32 CPUs × 30 שניות ≈ 95 אלף דגימות, כמה MB ו-overhead הרבה מתחת ל-1%.</p>
<pre>${PF_PERF}</pre>
<p>ציר ה-x של flame graph הוא <em>לא זמן</em>: ה-frames ממוינים לפי א"ב והרוחב = החלק מהדגימות. מחפשים מישורים רחבים קרוב לחלק העליון - שם ה-CPU נשרף. <code>perf stat</code> עונה על השאלה הבאה: IPC (instructions per cycle) של 0.5 אומר שהקוד תקוע על זיכרון (cache misses, מעבר על pointers), אז "CPU מהיר יותר" לא יעזור, אבל מבנה נתונים טוב יותר כן.</p>
<blockquote>⚠️ טיפ מהשטח: perf בלי הרשאות נשלט ע"י <code>kernel.perf_event_paranoid</code> (ברירת מחדל 2, ו-Debian/Ubuntu מעלים ל-4 = רק root) ו-<code>kernel.kptr_restrict</code> מסתיר symbols של ה-kernel. הרץ כ-root או תן <code>CAP_PERFMON</code> (מ-kernel 5.8) במקום לקבוע את paranoid על מינוס 1 על hosts משותפים.</blockquote>`
        }
      },
      {
        h: { en: "Symbols, stacks and JIT languages", he: "Symbols, stacks ושפות JIT" },
        body: {
          en: `<p>A profile is only as good as its stacks. Three things break them:</p>
<ul>
<li><strong>Missing frame pointers.</strong> Compilers used to omit them (<code>-fomit-frame-pointer</code>), so perf can't walk the stack and you get one-frame "[unknown]" towers. Fixes: build with <code>-fno-omit-frame-pointer</code>, or record with <code>--call-graph dwarf</code> (bigger files, more overhead). Fedora 38+ and Ubuntu 24.04+ build their packages with frame pointers again for exactly this reason.</li>
<li><strong>Stripped binaries.</strong> Install debug symbols (<code>-dbgsym</code> / <code>debuginfo</code> packages, or debuginfod) or you see hex addresses.</li>
<li><strong>JIT code</strong> (Java, Node, .NET, Python 3.12+) lives in anonymous memory the kernel knows nothing about. The runtime must publish a map file <code>/tmp/perf-&lt;PID&gt;.map</code>:
<ul>
<li>Java: <code>-XX:+PreserveFramePointer</code> plus a map agent, or simply use <strong>async-profiler</strong> (<code>asprof -d 30 -e cpu -f cpu.html &lt;pid&gt;</code>), which also handles safepoint bias.</li>
<li>Node: <code>node --perf-basic-prof</code> (or <code>--perf-basic-prof-only-functions</code>; the map file grows forever, so don't leave it on for weeks).</li>
<li>Python 3.12+: <code>python -X perf app.py</code> or <code>PYTHONPERFSUPPORT=1</code>; for any version, <strong>py-spy</strong> (<code>py-spy record -o out.svg --pid 4121</code>) reads interpreter frames directly.</li>
</ul></li>
</ul>
<p>Language-native profilers (pprof for Go, async-profiler, py-spy, rbspy) are usually the fastest path to an answer for app code; perf and eBPF win when the time is in the kernel, in libc, or spread across processes.</p>`,
          he: `<p>profile טוב רק כמו ה-stacks שלו. שלושה דברים שוברים אותם:</p>
<ul>
<li><strong>חסרים frame pointers.</strong> קומפיילרים נהגו להשמיט אותם (<code>-fomit-frame-pointer</code>), אז perf לא מצליח ללכת על ה-stack ואתה מקבל מגדלים של frame אחד "[unknown]". פתרונות: לבנות עם <code>-fno-omit-frame-pointer</code>, או להקליט עם <code>--call-graph dwarf</code> (קבצים גדולים יותר, יותר overhead). Fedora 38 ומעלה ו-Ubuntu 24.04 ומעלה חזרו לבנות חבילות עם frame pointers בדיוק בגלל זה.</li>
<li><strong>Binaries בלי symbols.</strong> התקן debug symbols (חבילות <code>-dbgsym</code> / <code>debuginfo</code>, או debuginfod), אחרת תראה כתובות hex.</li>
<li><strong>קוד JIT</strong> (Java, Node, .NET, Python 3.12 ומעלה) חי בזיכרון אנונימי שה-kernel לא יודע עליו כלום. ה-runtime צריך לפרסם קובץ מיפוי <code>/tmp/perf-&lt;PID&gt;.map</code>:
<ul>
<li>Java: <code>-XX:+PreserveFramePointer</code> ועוד agent של מיפוי, או פשוט <strong>async-profiler</strong> (<code>asprof -d 30 -e cpu -f cpu.html &lt;pid&gt;</code>), שגם מטפל ב-safepoint bias.</li>
<li>Node: <code>node --perf-basic-prof</code> (או <code>--perf-basic-prof-only-functions</code>; קובץ המיפוי גדל בלי סוף, אז אל תשאיר את זה דלוק שבועות).</li>
<li>Python 3.12 ומעלה: <code>python -X perf app.py</code> או <code>PYTHONPERFSUPPORT=1</code>; לכל גרסה, <strong>py-spy</strong> (<code>py-spy record -o out.svg --pid 4121</code>) קורא את ה-frames של ה-interpreter ישירות.</li>
</ul></li>
</ul>
<p>Profilers של השפה עצמה (pprof ל-Go, async-profiler, py-spy, rbspy) הם בדרך כלל הדרך הכי מהירה לתשובה על קוד אפליקציה; perf ו-eBPF מנצחים כשהזמן הולך ב-kernel, ב-libc או מפוזר בין תהליכים.</p>`
        }
      },
      {
        h: { en: "bpftrace one-liners and BCC tools", he: "One-liners ב-bpftrace וכלי BCC" },
        body: {
          en: `<p><strong>bpftrace</strong> is awk for the kernel: attach to a tracepoint, kprobe, uprobe or timer, filter with <code>/predicate/</code>, aggregate into maps (<code>@</code>) and print histograms when you hit Ctrl-C. Prefer <em>tracepoints</em> (stable ABI) over kprobes (kernel function names change between versions).</p>
<pre>${PF_BPFTRACE}</pre>
<p><strong>BCC</strong> ships ~100 ready-made tools. The ones you'll use in incidents:</p>
<pre>${PF_BCC}</pre>
<table>
<tr><th>Question</th><th>Tool</th></tr>
<tr><td>Something keeps spawning short-lived processes</td><td><code>execsnoop</code></td></tr>
<tr><td>App fails on a file/config, no useful log</td><td><code>opensnoop -x</code></td></tr>
<tr><td>Disk "slow"? Which disk, what distribution?</td><td><code>biolatency -D</code>, <code>biosnoop</code></td></tr>
<tr><td>Network blips, retries, timeouts</td><td><code>tcpretrans</code>, <code>tcpconnlat</code>, <code>tcpdrop</code></td></tr>
<tr><td>Load is high but CPU isn't 100%?</td><td><code>runqlat</code> (scheduler wait), <code>offcputime</code></td></tr>
</table>
<blockquote>💡 Real world: <code>runqlat</code> showing a big bucket at 4-8 ms on a node with 60% CPU usage is the signature of CFS throttling or noisy neighbors - threads are runnable but not running. That's invisible in <code>top</code>.</blockquote>`,
          he: `<p><strong>bpftrace</strong> זה awk ל-kernel: מתחברים ל-tracepoint, kprobe, uprobe או טיימר, מסננים עם <code>/predicate/</code>, מצברים ל-maps (<code>@</code>) ומדפיסים histograms כשלוחצים Ctrl-C. עדיף <em>tracepoints</em> (ABI יציב) על פני kprobes (שמות פונקציות ב-kernel משתנים בין גרסאות).</p>
<pre>${PF_BPFTRACE}</pre>
<p><strong>BCC</strong> מגיע עם כ-100 כלים מוכנים. אלה שתשתמש בהם באירועים:</p>
<pre>${PF_BCC}</pre>
<table>
<tr><th>שאלה</th><th>כלי</th></tr>
<tr><td>משהו כל הזמן מריץ תהליכים קצרים</td><td><code>execsnoop</code></td></tr>
<tr><td>האפליקציה נכשלת על קובץ/config, בלי לוג שימושי</td><td><code>opensnoop -x</code></td></tr>
<tr><td>הדיסק "איטי"? איזה דיסק, איזו התפלגות?</td><td><code>biolatency -D</code>, <code>biosnoop</code></td></tr>
<tr><td>קפיצות ברשת, retries, timeouts</td><td><code>tcpretrans</code>, <code>tcpconnlat</code>, <code>tcpdrop</code></td></tr>
<tr><td>ה-load גבוה אבל ה-CPU לא ב-100%?</td><td><code>runqlat</code> (המתנה ל-scheduler), <code>offcputime</code></td></tr>
</table>
<blockquote>💡 מהשטח: <code>runqlat</code> שמראה bucket גדול ב-4-8 ms על node עם 60% CPU זו החתימה של CFS throttling או שכנים רועשים - ה-threads מוכנים לרוץ אבל לא רצים. ב-<code>top</code> לא רואים את זה.</blockquote>`
        }
      },
      {
        h: { en: "strace vs ltrace vs eBPF, and off-CPU analysis", he: "strace מול ltrace מול eBPF, וניתוח off-CPU" },
        body: {
          en: `<p><strong>strace</strong> uses ptrace: the kernel stops the process <em>twice per syscall</em> and context-switches to strace. A syscall-heavy process can run 10-100x slower (Brendan Gregg measured a <code>dd</code> loop ~440x slower). <strong>ltrace</strong> is worse - it plants breakpoints on library calls. Both are fine on a dev box or for a few seconds with a tight <code>-e</code> filter; on a production hot path, prefer <code>perf trace</code> or bpftrace, which aggregate in the kernel without stopping the process.</p>
<pre>${PF_STRACE}</pre>
<p><strong>Off-CPU analysis.</strong> On-CPU profiles only show time spent <em>running</em>. If a request takes 800 ms but the thread runs 40 ms, the other 760 ms is off-CPU: blocked on a lock (<code>futex</code>), disk, network, a connection pool, or waiting for a CPU. <code>offcputime</code> records the stack at the moment a thread blocks and how long it stayed blocked; render it as a flame graph and the widest towers are your latency. Combine both views (or use a "wall-clock" mode like async-profiler's <code>-e wall</code>) to see the whole request.</p>
<blockquote>⚠️ Production tip: <code>offcputime</code> traces every context switch; on a box doing 500k switches/s it can cost 10%+ CPU. Filter by PID (<code>-p</code>) and keep runs to 10-30 s.</blockquote>`,
          he: `<p><strong>strace</strong> משתמש ב-ptrace: ה-kernel עוצר את התהליך <em>פעמיים בכל syscall</em> ועושה context switch ל-strace. תהליך עם הרבה syscalls יכול לרוץ פי 10-100 יותר לאט (Brendan Gregg מדד לולאת <code>dd</code> שרצה בערך פי 440 יותר לאט). <strong>ltrace</strong> גרוע יותר - הוא שותל breakpoints על קריאות לספריות. שניהם בסדר על מכונת פיתוח או לכמה שניות עם פילטר <code>-e</code> צר; על נתיב חם ב-production עדיף <code>perf trace</code> או bpftrace, שמצברים ב-kernel בלי לעצור את התהליך.</p>
<pre>${PF_STRACE}</pre>
<p><strong>ניתוח Off-CPU.</strong> profiles של on-CPU מראים רק זמן שבו ה-thread <em>רץ</em>. אם בקשה לוקחת 800 ms אבל ה-thread רץ 40 ms, שאר ה-760 ms הם off-CPU: חסום על lock (<code>futex</code>), דיסק, רשת, connection pool, או מחכה ל-CPU. <code>offcputime</code> רושם את ה-stack ברגע שה-thread נחסם וכמה זמן הוא נשאר חסום; תצייר את זה כ-flame graph והמגדלים הכי רחבים הם ה-latency שלך. תשלב את שתי התצוגות (או תשתמש במצב "wall-clock" כמו <code>-e wall</code> של async-profiler) כדי לראות את כל הבקשה.</p>
<blockquote>⚠️ טיפ מהשטח: <code>offcputime</code> עושה trace לכל context switch; על מכונה שעושה 500 אלף switches בשנייה זה יכול לעלות 10% CPU ויותר. תסנן לפי PID (<code>-p</code>) ותחזיק ריצות של 10-30 שניות.</blockquote>`
        }
      },
      {
        h: { en: "Profiling inside containers and Kubernetes", he: "Profiling בתוך קונטיינרים ו-Kubernetes" },
        body: {
          en: `<ul>
<li><strong>From the host</strong> you see every container's processes (by host PID). Modern perf resolves symbols through <code>/proc/&lt;pid&gt;/root</code>, but JIT map files must exist at <code>/tmp/perf-&lt;host PID&gt;.map</code> on the <em>host</em> - the container writes them with its own PID inside its own <code>/tmp</code>. Tools like async-profiler and py-spy handle the namespace translation for you.</li>
<li><strong>Inside an unprivileged container</strong> perf usually fails: Docker's default seccomp profile blocks <code>perf_event_open</code> and <code>bpf()</code> unless the container has <code>CAP_PERFMON</code>/<code>CAP_BPF</code> (or <code>CAP_SYS_ADMIN</code>).</li>
<li><strong>In Kubernetes</strong>, run a node debug Pod: <code>kubectl debug node/ip-10-0-1-5 -it --image=quay.io/iovisor/bpftrace --profile=sysadmin</code> (host namespaces, node FS at <code>/host</code>). For one Pod, an ephemeral container that shares its process namespace: <code>kubectl debug -it api-7f9c --image=busybox --target=api</code>. Inspektor Gadget wraps the BCC-style tools with Pod filters.</li>
<li><strong>Always-on</strong>: continuous profilers (Parca, Grafana Pyroscope, the OpenTelemetry eBPF profiler) sample the whole fleet at ~19-100 Hz for 1-3% CPU, so you can diff "flame graph now vs last Tuesday" instead of trying to catch the problem live.</li>
</ul>
<blockquote>💡 Real world: a Node service's CPU doubled after a dependency bump. A Pyroscope diff view showed 38% of CPU in a regex inside a logging library that was now evaluated on every request - a one-line fix found in 10 minutes, no reproduction needed.</blockquote>`,
          he: `<ul>
<li><strong>מה-host</strong> אתה רואה את התהליכים של כל הקונטיינרים (לפי PID של ה-host). perf מודרני פותר symbols דרך <code>/proc/&lt;pid&gt;/root</code>, אבל קבצי מיפוי של JIT חייבים להיות ב-<code>/tmp/perf-&lt;host PID&gt;.map</code> על <em>ה-host</em> - הקונטיינר כותב אותם עם ה-PID הפנימי שלו בתוך ה-<code>/tmp</code> שלו. כלים כמו async-profiler ו-py-spy מתרגמים את ה-namespaces בשבילך.</li>
<li><strong>בתוך קונטיינר בלי הרשאות</strong> perf בדרך כלל נכשל: ה-seccomp profile ברירת המחדל של Docker חוסם את <code>perf_event_open</code> ואת <code>bpf()</code> אלא אם לקונטיינר יש <code>CAP_PERFMON</code>/<code>CAP_BPF</code> (או <code>CAP_SYS_ADMIN</code>).</li>
<li><strong>ב-Kubernetes</strong> מריצים debug Pod על ה-node: <code>kubectl debug node/ip-10-0-1-5 -it --image=quay.io/iovisor/bpftrace --profile=sysadmin</code> (namespaces של ה-host, ה-FS של ה-node ב-<code>/host</code>). ל-Pod בודד, ephemeral container שחולק איתו process namespace: <code>kubectl debug -it api-7f9c --image=busybox --target=api</code>. Inspektor Gadget עוטף את כלי ה-BCC עם סינון לפי Pod.</li>
<li><strong>Always-on</strong>: continuous profilers (Parca, Grafana Pyroscope, ה-eBPF profiler של OpenTelemetry) דוגמים את כל ה-fleet ב-19-100 Hz בעלות של 1-3% CPU, כך שאפשר לעשות diff של "flame graph עכשיו מול יום שלישי שעבר" במקום לנסות לתפוס את הבעיה בזמן אמת.</li>
</ul>
<blockquote>💡 מהשטח: ה-CPU של שירות Node הוכפל אחרי שדרוג של dependency. תצוגת diff ב-Pyroscope הראתה 38% מה-CPU ב-regex בתוך ספריית logging שעכשיו רץ על כל בקשה - תיקון של שורה אחת שנמצא תוך 10 דקות, בלי לשחזר.</blockquote>`
        }
      }
    ],
    diagram: "question            tool                 overhead\nwhere is CPU spent?  perf record -F 99 -g  <1%    -> flame graph\nwhy is it slow?      perf stat (IPC)       ~0%\nwhat is it waiting?  offcputime            1-10%  -> off-CPU flame graph\nwhich events/lat?    bpftrace / BCC        low %  (in-kernel aggregation)\nexact syscalls?      strace -c / -e        10-100x slower (ptrace)",
    handsOn: [
      { cmd: "sudo perf record -F 99 -a -g -- sleep 30 && sudo perf report --stdio | head -40", what: { en: "Profile the whole box for 30 s and read the hottest stacks.", he: "עושים profile לכל המכונה במשך 30 שניות וקוראים את ה-stacks הכי חמים." } },
      { cmd: "sudo perf script | ./stackcollapse-perf.pl | ./flamegraph.pl > cpu.svg", what: { en: "Turn perf.data into an interactive flame graph (clone brendangregg/FlameGraph first).", he: "הופכים את perf.data ל-flame graph אינטראקטיבי (קודם עושים clone ל-brendangregg/FlameGraph)." } },
      { cmd: "sudo bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); } interval:s:5 { print(@); clear(@); }'", what: { en: "Syscall rate per process every 5 s - finds the chatty process instantly.", he: "קצב syscalls לכל תהליך כל 5 שניות - מוצא את התהליך הפטפטן מיד." } },
      { cmd: "sudo runqlat-bpfcc 10 1; sudo biolatency-bpfcc -D 10 1", what: { en: "Scheduler wait and per-disk IO latency histograms for 10 s: is the slowness CPU contention or disk?", he: "histograms של המתנה ל-scheduler ו-latency של IO לכל דיסק במשך 10 שניות: האיטיות היא תחרות על CPU או דיסק?" } },
      { cmd: "sudo strace -c -f -p $(pgrep -n myapp) & sleep 5; sudo kill -INT %1", what: { en: "A 5-second syscall summary (counts, errors, time) - short enough to be safe on a busy process.", he: "סיכום syscalls של 5 שניות (כמויות, שגיאות, זמן) - קצר מספיק כדי להיות בטוח על תהליך עמוס." } }
    ],
    mnemonic: {
      en: "SAMPLE where (perf record), COUNT why (perf stat), TRACE what (bpftrace/BCC), and look OFF-CPU for the time nobody's running. strace only for a few seconds.",
      he: "דוגמים איפה (perf record), סופרים למה (perf stat), עושים trace למה בדיוק (bpftrace/BCC), ומסתכלים OFF-CPU על הזמן שבו אף אחד לא רץ. strace רק לכמה שניות."
    },
    pitfalls: [
      { en: "Running strace on a hot production process for minutes: ptrace stops it twice per syscall and can turn a 5 ms request into 500 ms - you cause the incident you're debugging.", he: "להריץ strace על תהליך חם ב-production במשך דקות: ptrace עוצר אותו פעמיים בכל syscall ויכול להפוך בקשה של 5 ms ל-500 ms - אתה יוצר את התקלה שאתה מנסה לדבג." },
      { en: "Profiling a JIT runtime without a perf map or native profiler: the flame graph is a wall of [unknown] or anonymous addresses.", he: "לעשות profile ל-runtime עם JIT בלי perf map או profiler של השפה: ה-flame graph הוא קיר של [unknown] או כתובות אנונימיות." },
      { en: "Looking only at on-CPU profiles for a latency problem: if threads are blocked on locks, IO or a pool, the time doesn't appear there at all. Use off-CPU or wall-clock profiling.", he: "להסתכל רק על profiles של on-CPU בבעיית latency: אם ה-threads חסומים על locks, IO או pool, הזמן בכלל לא מופיע שם. השתמש ב-profiling של off-CPU או wall-clock." },
      { en: "Reading flame graph x-axis as time: it's alphabetical; width is the share of samples.", he: "לקרוא את ציר ה-x של flame graph כזמן: הוא לפי א\"ב; הרוחב הוא החלק מהדגימות." }
    ],
    interview: [
      {
        q: { en: "Why is strace dangerous in production, and what would you use instead?", he: "למה strace מסוכן ב-production, ובמה היית משתמש במקומו?" },
        a: { en: "It's built on ptrace: every syscall stops the tracee twice and context-switches to strace, so syscall-heavy processes slow down 10-100x or more. Instead use eBPF-based tools that aggregate in the kernel without stopping the process: perf trace -s, bpftrace with syscall tracepoints, or BCC tools like opensnoop/execsnoop. If strace is unavoidable, use -c or a tight -e filter for a few seconds.", he: "הוא בנוי על ptrace: כל syscall עוצר את התהליך פעמיים ועושה context switch ל-strace, אז תהליכים עם הרבה syscalls מאטים פי 10-100 ויותר. במקום זה משתמשים בכלים מבוססי eBPF שמצברים ב-kernel בלי לעצור את התהליך: perf trace -s, bpftrace עם tracepoints של syscalls, או כלי BCC כמו opensnoop/execsnoop. אם אין ברירה ב-strace, מריצים אותו במצב סיכום או עם פילטר צר של syscalls לכמה שניות." }
      },
      {
        q: { en: "p99 latency is 800 ms but the CPU flame graph looks boring. What next?", he: "ה-p99 הוא 800 ms אבל ה-flame graph של CPU נראה משעמם. מה הלאה?" },
        a: { en: "The time is off-CPU. Run offcputime (or async-profiler -e wall / lock) on the process to see where threads block - futex on a lock, connection pool waits, disk IO, network. Check runqlat to rule out CPU throttling/scheduler wait, biolatency for disk and tcpretrans for network loss.", he: "הזמן הוא off-CPU. מריצים offcputime (או async-profiler במצב wall או lock) על התהליך כדי לראות איפה ה-threads נחסמים - futex על lock, המתנה ל-connection pool, IO לדיסק, רשת. בודקים runqlat כדי לשלול CPU throttling או המתנה ל-scheduler, biolatency לדיסק ו-tcpretrans לאיבוד packets ברשת." }
      }
    ],
    quiz: [
      {
        q: { en: "Why sample at 99 Hz instead of 100 Hz with perf record?", he: "למה דוגמים ב-99 Hz ולא ב-100 Hz עם perf record?" },
        options: [
          { en: "perf doesn't support round numbers", he: "perf לא תומך במספרים עגולים" },
          { en: "To avoid sampling in lock-step with periodic activity (timers at 100 Hz/10 ms) and skewing results", he: "כדי לא לדגום בסנכרון עם פעילות מחזורית (טיימרים של 100 Hz/10 ms) ולעוות את התוצאות" },
          { en: "99 Hz has zero overhead", he: "ל-99 Hz אין overhead בכלל" },
          { en: "The kernel caps sampling at 99 Hz", he: "ה-kernel מגביל דגימה ל-99 Hz" }
        ],
        answer: 1,
        explain: { en: "Lots of activity is periodic at 10 ms; sampling at exactly 100 Hz could repeatedly hit (or miss) the same phase. 99 Hz drifts across it.", he: "הרבה פעילות מחזורית כל 10 ms; דגימה בדיוק ב-100 Hz יכולה לפגוע (או לפספס) שוב ושוב באותו שלב. 99 Hz זז לאורכו." }
      },
      {
        q: { en: "perf stat shows 0.45 instructions per cycle on a hot service. What does it suggest?", he: "perf stat מראה 0.45 instructions per cycle על שירות חם. מה זה מרמז?" },
        options: [
          { en: "The CPU is mostly stalled waiting on memory (cache misses), not computing", he: "ה-CPU בעיקר תקוע ומחכה לזיכרון (cache misses), לא מחשב" },
          { en: "The service is idle", he: "השירות לא עושה כלום" },
          { en: "The code is perfectly optimized", he: "הקוד אופטימלי לגמרי" },
          { en: "The disk is slow", he: "הדיסק איטי" }
        ],
        answer: 0,
        explain: { en: "Modern cores can retire 4+ instructions per cycle. IPC below 1 usually means stalls on memory access; a faster CPU helps little, better data locality helps a lot.", he: "cores מודרניים יכולים לסיים 4 instructions ויותר בכל cycle. IPC מתחת ל-1 אומר בדרך כלל המתנה לגישה לזיכרון; CPU מהיר יותר עוזר מעט, locality טוב יותר של נתונים עוזר הרבה." }
      },
      {
        q: { en: "Which tool answers 'threads are runnable but how long do they wait for a CPU?'", he: "איזה כלי עונה על 'ה-threads מוכנים לרוץ, אבל כמה זמן הם מחכים ל-CPU?'" },
        options: [
          { en: "opensnoop", he: "opensnoop" },
          { en: "biolatency", he: "biolatency" },
          { en: "runqlat", he: "runqlat" },
          { en: "execsnoop", he: "execsnoop" }
        ],
        answer: 2,
        explain: { en: "runqlat measures scheduler run-queue latency as a histogram - the direct measure of CPU saturation or throttling.", he: "runqlat מודד את ה-latency של ה-run queue של ה-scheduler כ-histogram - המדד הישיר לרוויה של CPU או throttling." }
      },
      {
        q: { en: "Your Java flame graph is mostly '[unknown]' frames. Best fix?", he: "ה-flame graph של Java שלך מלא ב-frames של '[unknown]'. מה הפתרון הכי טוב?" },
        options: [
          { en: "Sample at a higher frequency", he: "לדגום בתדירות גבוהה יותר" },
          { en: "Use strace instead", he: "להשתמש ב-strace במקום" },
          { en: "Use async-profiler (or -XX:+PreserveFramePointer plus a perf map agent) so JIT frames get names", he: "להשתמש ב-async-profiler (או -XX:+PreserveFramePointer ועוד perf map agent) כדי שה-frames של ה-JIT יקבלו שמות" },
          { en: "Disable the JIT", he: "לכבות את ה-JIT" }
        ],
        answer: 2,
        explain: { en: "JIT-compiled code has no symbols on disk. The runtime must expose a map (/tmp/perf-PID.map) and keep frame pointers, or you use a JVM-aware profiler like async-profiler.", he: "לקוד שקומפל ב-JIT אין symbols על הדיסק. ה-runtime צריך לחשוף מיפוי (/tmp/perf-PID.map) ולשמור frame pointers, או שמשתמשים ב-profiler שמכיר את ה-JVM כמו async-profiler." }
      }
    ],
    playground: "terminal",
    related: ["linux-performance-60s", "staff-ebpf-cilium", "cpu", "linux-processes", "linux-cgroups-v2", "linux-memory-leaks"]
  });

  /* =============================== LESSON 3 =============================== */
  INFRA.lessons.push({
    id: "linux-memory-leaks",
    track: "linux",
    order: 32,
    icon: "🕳️",
    level: 3,
    minutes: 17,
    title: { en: "Hunting Memory Leaks", he: "לצוד דליפות זיכרון" },
    tldr: {
      en: "Before calling it a leak, prove the growth is anonymous memory and unbounded (not page cache, not a warming cache, not fragmentation). Then take two heap profiles hours apart with the runtime's own tool and diff them - the allocation site that only grows is your leak.",
      he: "לפני שקוראים לזה דליפה, מוכיחים שהגדילה היא זיכרון anonymous ושהיא לא נעצרת (לא page cache, לא cache שמתחמם, לא fragmentation). אחר כך לוקחים שני heap profiles בהפרש של כמה שעות עם הכלי של ה-runtime ועושים להם diff - ה-allocation site שרק גדל הוא הדליפה."
    },
    analogy: {
      en: "Your apartment keeps getting more crowded. It could be groceries in the fridge (page cache - the landlord can clear it anytime), a pantry you're deliberately stocking up to a fixed size (an app cache), furniture arranged so badly that half the room is unusable gaps (fragmentation), or a roommate who brings home a box every day and never throws one out (a leak). Only the last one ends with the door not opening. To find him, photograph the room on Monday and Thursday and compare.",
      he: "הדירה שלך נהיית צפופה יותר ויותר. זה יכול להיות אוכל במקרר (page cache - בעל הבית יכול לפנות אותו מתי שירצה), מזווה שאתה ממלא בכוונה עד גודל קבוע (cache של האפליקציה), רהיטים שמסודרים כל כך גרוע שחצי חדר הוא רווחים שאי אפשר להשתמש בהם (fragmentation), או שותף שמביא הביתה קרטון כל יום ואף פעם לא זורק אחד (דליפה). רק האחרון נגמר בדלת שלא נפתחת. כדי למצוא אותו, מצלמים את החדר ביום שני וביום חמישי ומשווים."
    },
    sections: [
      {
        h: { en: "RSS vs PSS vs USS: measure the right number", he: "RSS מול PSS מול USS: למדוד את המספר הנכון" },
        body: {
          en: `<p><strong>RSS</strong> (resident set size) counts every page a process has in RAM, including shared libraries and shared memory - fully, for <em>every</em> process that maps them. Sum RSS over 30 forked workers and you can "use" more RAM than the machine has. <strong>PSS</strong> (proportional) divides each shared page by the number of processes sharing it, so PSS sums to real usage. <strong>USS</strong> (unique) is private pages only - what you'd get back by killing that process.</p>
<pre>${ML_SMAPS}</pre>
<p><code>/proc/PID/smaps_rollup</code> (kernel 4.14+) gives all of it in one cheap read; <code>/proc/PID/smaps</code> breaks it down per mapping, and <code>pmap -x PID</code> shows the biggest regions. For leak hunting, watch <strong><code>Pss_Anon</code> / <code>Private_Dirty</code></strong> over time: heap and stack growth lives there. Growth in <code>Pss_File</code> is mapped files, rarely a leak.</p>
<blockquote>💡 Real world: a prefork app server (gunicorn, Puma, PHP-FPM) "uses 12 GB" by RSS on an 8 GB box and nothing is wrong - copy-on-write sharing makes the RSS sum lie. USS per worker × workers + master PSS is the real budget. The genuine trap is the opposite: Python's refcounting writes to every object it touches, so CoW pages slowly unshare and USS grows for a while after fork even with no leak.</blockquote>`,
          he: `<p><strong>RSS</strong> (resident set size) סופר כל page שיש לתהליך ב-RAM, כולל ספריות משותפות וזיכרון משותף - במלואו, לכל תהליך ש-map-ים אותם. תסכום RSS על 30 workers שעשו fork ותוכל "להשתמש" ביותר RAM ממה שיש למכונה. <strong>PSS</strong> (proportional) מחלק כל page משותף במספר התהליכים שחולקים אותו, כך שסכום ה-PSS הוא הצריכה האמיתית. <strong>USS</strong> (unique) זה רק pages פרטיים - מה שתקבל בחזרה אם תהרוג את התהליך.</p>
<pre>${ML_SMAPS}</pre>
<p><code>/proc/PID/smaps_rollup</code> (מ-kernel 4.14) נותן את כל זה בקריאה זולה אחת; <code>/proc/PID/smaps</code> מפרק את זה לכל mapping, ו-<code>pmap -x PID</code> מראה את האזורים הכי גדולים. בציד דליפות, עוקבים אחרי <strong><code>Pss_Anon</code> / <code>Private_Dirty</code></strong> לאורך זמן: שם חיה הגדילה של ה-heap וה-stack. גדילה ב-<code>Pss_File</code> היא קבצים ממופים, ונדיר שזו דליפה.</p>
<blockquote>💡 מהשטח: שרת אפליקציה עם prefork (gunicorn, Puma, PHP-FPM) "צורך 12 GB" לפי RSS על מכונה של 8 GB ושום דבר לא שבור - שיתוף copy-on-write גורם לסכום ה-RSS לשקר. USS לכל worker × מספר ה-workers ועוד ה-PSS של ה-master זה התקציב האמיתי. המלכודת האמיתית היא הפוכה: ה-refcounting של Python כותב לכל אובייקט שהוא נוגע בו, אז pages של CoW מפסיקים להיות משותפים לאט וה-USS גדל לזמן מה אחרי fork גם בלי דליפה.</blockquote>`
        }
      },
      {
        h: { en: "Leak vs cache vs fragmentation, and container memory", he: "דליפה מול cache מול fragmentation, וזיכרון של קונטיינר" },
        body: {
          en: `<table>
<tr><th>Pattern</th><th>What you see</th><th>Verdict</th></tr>
<tr><td>Page cache</td><td><code>file</code> grows in memory.stat; drops under pressure</td><td>Healthy; the kernel reclaims it</td></tr>
<tr><td>App cache warming</td><td>anon grows fast, then <strong>plateaus</strong></td><td>Fine if bounded (LRU with max size)</td></tr>
<tr><td>GC sawtooth</td><td>Heap rises and drops; the <em>floor after each full GC</em> is flat</td><td>Fine</td></tr>
<tr><td>Leak</td><td>The post-GC floor / anon keeps rising, proportional to traffic or time</td><td>Leak - find the retainer</td></tr>
<tr><td>Fragmentation</td><td>RSS grows, but the runtime's heap "in use" stays flat</td><td>Allocator problem, not your objects</td></tr>
</table>
<p>In a container, the number that gets you killed and evicted is the cgroup's, not the process's:</p>
<pre>${ML_CGROUP}</pre>
<p><strong>Working set</strong> = <code>memory.current − inactive_file</code>. That's what <code>kubectl top</code> (via metrics-server), the kubelet's eviction logic and <code>container_memory_working_set_bytes</code> report. It still includes <em>active</em> page cache, so a service that repeatedly reads files or mmaps a big index can look like it's "leaking" while anon is flat. That's why <code>kubectl top</code> differs from <code>ps</code> RSS (which excludes cache but double-counts shared pages) and from <code>free</code> inside the container (host-wide numbers). Note: tmpfs and <code>emptyDir: {medium: Memory}</code> are counted as <code>shmem</code> and can't be reclaimed - a log file in a memory-backed volume is a classic "leak" outside the app.</p>
<p><strong>Native fragmentation</strong>: glibc malloc creates up to 8 arenas per core for threaded apps, often visible as many ~64 MB anonymous regions in <code>pmap</code>, and freed memory inside them isn't always returned to the OS. <code>MALLOC_ARENA_MAX=2</code>, or switching to jemalloc/tcmalloc, often cuts RSS 30-50% with zero code change (Ruby, Java with heavy native use, Python with C extensions).</p>`,
          he: `<table>
<tr><th>תבנית</th><th>מה רואים</th><th>מסקנה</th></tr>
<tr><td>Page cache</td><td><code>file</code> גדל ב-memory.stat; יורד תחת לחץ</td><td>בריא; ה-kernel משחרר אותו</td></tr>
<tr><td>Cache של האפליקציה מתחמם</td><td>anon גדל מהר, ואז <strong>מתייצב</strong></td><td>בסדר אם הוא חסום (LRU עם גודל מקסימלי)</td></tr>
<tr><td>Sawtooth של GC</td><td>ה-heap עולה ויורד; <em>הרצפה אחרי כל full GC</em> שטוחה</td><td>בסדר</td></tr>
<tr><td>דליפה</td><td>הרצפה אחרי GC / ה-anon ממשיכים לעלות, ביחס לתעבורה או לזמן</td><td>דליפה - מוצאים מי מחזיק</td></tr>
<tr><td>Fragmentation</td><td>RSS גדל, אבל ה-heap "in use" של ה-runtime שטוח</td><td>בעיה של ה-allocator, לא של האובייקטים שלך</td></tr>
</table>
<p>בקונטיינר, המספר שגורם לך לקבל kill ו-eviction הוא של ה-cgroup, לא של התהליך:</p>
<pre>${ML_CGROUP}</pre>
<p><strong>Working set</strong> = <code>memory.current − inactive_file</code>. את זה מדווחים <code>kubectl top</code> (דרך metrics-server), לוגיקת ה-eviction של ה-kubelet ו-<code>container_memory_working_set_bytes</code>. הוא עדיין כולל page cache <em>פעיל</em>, אז שירות שקורא קבצים שוב ושוב או עושה mmap לאינדקס גדול יכול להיראות כאילו הוא "דולף" בזמן שה-anon שטוח. בגלל זה <code>kubectl top</code> שונה מה-RSS של <code>ps</code> (שלא כולל cache אבל סופר pages משותפים פעמיים) ומ-<code>free</code> בתוך הקונטיינר (מספרים של כל ה-host). שים לב: tmpfs ו-<code>emptyDir: {medium: Memory}</code> נספרים כ-<code>shmem</code> ואי אפשר לשחרר אותם - קובץ לוג ב-volume שמגובה בזיכרון הוא "דליפה" קלאסית מחוץ לאפליקציה.</p>
<p><strong>Fragmentation ב-native</strong>: ה-malloc של glibc יוצר עד 8 arenas לכל core באפליקציות עם threads, ולרוב רואים את זה כהרבה אזורים anonymous של בערך 64 MB ב-<code>pmap</code>, וזיכרון ששוחרר בתוכם לא תמיד חוזר ל-OS. <code>MALLOC_ARENA_MAX=2</code>, או מעבר ל-jemalloc/tcmalloc, מוריד לעתים קרובות 30-50% מה-RSS בלי לשנות שורת קוד (Ruby, Java עם הרבה שימוש native, Python עם C extensions).</p>`
        }
      },
      {
        h: { en: "Native leaks: massif, heaptrack, jemalloc", he: "דליפות native: massif, heaptrack, jemalloc" },
        body: {
          en: `<pre>${ML_NATIVE}</pre>
<ul>
<li><strong>Valgrind massif</strong> records heap snapshots and the allocation trees behind the peak. Precise, but 10-50x slower: run it on a replayed workload in a test env. (<code>valgrind --leak-check=full</code> finds memory that's <em>unreachable</em> at exit - but most production leaks are still reachable, e.g. a growing map.)</li>
<li><strong>heaptrack</strong> hooks malloc/free with much lower overhead and can attach to a running process; its report lists "peak memory consumers" and "most leaked" call stacks.</li>
<li><strong>jemalloc/tcmalloc profiling</strong> samples allocations (every ~512 KB with <code>lg_prof_sample:19</code>), cheap enough for production canaries, and dumps periodic heap profiles you diff with <code>jeprof --base</code>.</li>
<li>eBPF: BCC's <code>memleak -p PID</code> traces outstanding allocations by stack without restarting - expect noticeable overhead on allocation-heavy processes.</li>
</ul>`,
          he: `<pre>${ML_NATIVE}</pre>
<ul>
<li><strong>Valgrind massif</strong> מקליט snapshots של ה-heap ואת עצי ההקצאות שמאחורי השיא. מדויק, אבל פי 10-50 יותר איטי: מריצים אותו על workload משוחזר בסביבת בדיקות. (<code>valgrind --leak-check=full</code> מוצא זיכרון ש<em>אין אליו גישה</em> ביציאה - אבל רוב הדליפות ב-production עדיין נגישות, למשל map שגדל.)</li>
<li><strong>heaptrack</strong> מתחבר ל-malloc/free עם overhead הרבה יותר נמוך ויכול להתחבר לתהליך רץ; הדוח שלו מראה call stacks של "peak memory consumers" ו-"most leaked".</li>
<li><strong>Profiling ב-jemalloc/tcmalloc</strong> דוגם הקצאות (כל בערך 512 KB עם <code>lg_prof_sample:19</code>), זול מספיק ל-canaries ב-production, ושומר heap profiles מחזוריים שעושים להם diff עם <code>jeprof --base</code>.</li>
<li>eBPF: הכלי <code>memleak -p PID</code> של BCC עוקב אחרי הקצאות שלא שוחררו לפי stack בלי restart - תצפה ל-overhead מורגש על תהליכים שמקצים הרבה.</li>
</ul>`
        }
      },
      {
        h: { en: "Managed runtimes: JVM, Node, Python, Go", he: "Runtimes מנוהלים: JVM, Node, Python, Go" },
        body: {
          en: `<pre>${ML_RUNTIMES}</pre>
<p><strong>JVM</strong>: process RSS = heap + metaspace + thread stacks (~1 MB each by default) + code cache + direct/NIO buffers + GC structures + malloc'd native memory. If <code>GC.heap_info</code> shows a healthy heap but RSS grows, it's off-heap: turn on NMT and diff, or check direct buffers (Netty) and thread count. Size the heap with <code>-XX:MaxRAMPercentage=70-75</code>, leaving headroom for the rest.</p>
<p><strong>Node</strong>: compare three heap snapshots (baseline, after load, after more load) in DevTools' "Comparison" view and sort by retained size; the "Retainers" panel shows the chain keeping objects alive (often a module-level Map, an event listener never removed, or a closure in a timer). <code>process.memoryUsage()</code> separates <code>heapUsed</code> from <code>external</code>/<code>arrayBuffers</code> (Buffers live outside the V8 heap).</p>
<p><strong>Python</strong>: <code>tracemalloc</code> is in the stdlib and shows growth by file:line; <strong>memray</strong> also sees native allocations from C extensions (numpy, lxml) and can attach to a live PID.</p>
<p><strong>Go</strong>: the heap profile has <code>inuse_space</code> (what's live now - use this for leaks) and <code>alloc_space</code> (total allocated since start - use it for GC pressure). <code>-base</code> subtracts the old profile so only growth remains. Most "Go memory leaks" are actually <strong>goroutine leaks</strong>: goroutines blocked forever on a channel or a request with no timeout, each pinning its stack (2 KB minimum, often much more) and everything it references.</p>`,
          he: `<pre>${ML_RUNTIMES}</pre>
<p><strong>JVM</strong>: ה-RSS של התהליך = heap + metaspace + stacks של threads (בערך 1 MB לכל אחד כברירת מחדל) + code cache + direct/NIO buffers + מבני GC + זיכרון native שהוקצה ב-malloc. אם <code>GC.heap_info</code> מראה heap בריא אבל ה-RSS גדל, זה off-heap: מדליקים NMT ועושים diff, או בודקים direct buffers (Netty) ומספר threads. קובעים את ה-heap עם <code>-XX:MaxRAMPercentage=70-75</code> ומשאירים מקום לשאר.</p>
<p><strong>Node</strong>: משווים שלושה heap snapshots (baseline, אחרי עומס, אחרי עוד עומס) בתצוגת "Comparison" של DevTools וממיינים לפי retained size; הפאנל "Retainers" מראה את השרשרת שמחזיקה את האובייקטים בחיים (הרבה פעמים Map ברמת המודול, event listener שאף פעם לא הוסר, או closure בתוך טיימר). <code>process.memoryUsage()</code> מפריד בין <code>heapUsed</code> לבין <code>external</code>/<code>arrayBuffers</code> (Buffers חיים מחוץ ל-heap של V8).</p>
<p><strong>Python</strong>: <code>tracemalloc</code> נמצא ב-stdlib ומראה גדילה לפי file:line; <strong>memray</strong> רואה גם הקצאות native מ-C extensions (numpy, lxml) ויכול להתחבר ל-PID חי.</p>
<p><strong>Go</strong>: ב-heap profile יש <code>inuse_space</code> (מה שחי עכשיו - בזה משתמשים לדליפות) ו-<code>alloc_space</code> (כל מה שהוקצה מאז העלייה - בזה משתמשים ללחץ על ה-GC). <code>-base</code> מחסר את ה-profile הישן כך שנשארת רק הגדילה. רוב "דליפות הזיכרון ב-Go" הן בעצם <strong>דליפות goroutines</strong>: goroutines שחסומות לנצח על channel או על בקשה בלי timeout, וכל אחת מחזיקה את ה-stack שלה (מינימום 2 KB, לרוב הרבה יותר) וכל מה שהיא מצביעה עליו.</p>`
        }
      },
      {
        h: { en: "Not only bytes: FD leaks, and a step-by-step method", he: "לא רק bytes: דליפות FD, ושיטה צעד אחרי צעד" },
        body: {
          en: `<p>File descriptors, sockets and threads leak too, and they often drag memory along (each socket has kernel buffers, each thread a stack):</p>
<pre>${ML_FD}</pre>
<p>Thousands of <code>CLOSE-WAIT</code> sockets = the app never closes connections the peer already closed (typically an HTTP client response body that's never read/closed). The failure is "too many open files" (EMFILE) long before memory runs out.</p>
<p><strong>The method</strong>:</p>
<ol>
<li><strong>Confirm the trend</strong> over days, not minutes: working set and anon (or post-GC heap) vs traffic. Plateau = cache; sawtooth with a flat floor = GC; steady ramp = suspect.</li>
<li><strong>Classify</strong>: anon vs file vs shmem (memory.stat); managed heap vs native (heap_info / NMT / process.memoryUsage); FDs, threads, goroutines.</li>
<li><strong>Correlate</strong> the slope with something: deploy date, a feature flag, request type, tenant. A leak that grows per request of type X has a different fix than one per hour.</li>
<li><strong>Two profiles, hours apart</strong>, same process, with the runtime's tool; diff them. Run it on one canary Pod with a raised limit so it lives long enough to grow.</li>
<li><strong>Find the retainer</strong>, not just the allocator: who holds the reference (an unbounded map keyed by user/request ID, a listener, a cache without TTL, a goroutine blocked forever).</li>
<li><strong>Fix + prove</strong>: bound it (max size + TTL, timeouts, close/defer), then a soak test showing a flat floor over 24h+. Keep an alert on the slope.</li>
</ol>
<blockquote>⚠️ Production tip: until the fix ships, mitigate deliberately - a scheduled rolling restart before the predicted OOM, or a <code>memory.high</code>/limit with enough replicas that one restart doesn't hurt. Don't just raise the limit: it only moves the OOM a few days later and hides the slope.</blockquote>`,
          he: `<p>גם file descriptors, sockets ו-threads דולפים, ולרוב הם גוררים איתם זיכרון (לכל socket יש buffers ב-kernel, לכל thread יש stack):</p>
<pre>${ML_FD}</pre>
<p>אלפי sockets ב-<code>CLOSE-WAIT</code> = האפליקציה אף פעם לא סוגרת חיבורים שהצד השני כבר סגר (בדרך כלל body של תשובה ב-HTTP client שאף פעם לא נקרא/נסגר). הכשל הוא "too many open files" (EMFILE) הרבה לפני שהזיכרון נגמר.</p>
<p><strong>השיטה</strong>:</p>
<ol>
<li><strong>מאשרים את המגמה</strong> לאורך ימים, לא דקות: working set ו-anon (או heap אחרי GC) מול תעבורה. מתייצב = cache; sawtooth עם רצפה שטוחה = GC; עלייה קבועה = חשוד.</li>
<li><strong>מסווגים</strong>: anon מול file מול shmem (memory.stat); heap מנוהל מול native (heap_info / NMT / process.memoryUsage); FDs, threads, goroutines.</li>
<li><strong>מחפשים קורלציה</strong> בין השיפוע למשהו: תאריך deploy, feature flag, סוג בקשה, tenant. לדליפה שגדלה לכל בקשה מסוג X יש תיקון אחר מדליפה שגדלה כל שעה.</li>
<li><strong>שני profiles בהפרש של שעות</strong>, אותו תהליך, עם הכלי של ה-runtime; עושים להם diff. מריצים את זה על Pod אחד של canary עם limit מוגדל כדי שיחיה מספיק זמן כדי לגדול.</li>
<li><strong>מוצאים את מי שמחזיק</strong>, לא רק את מי שהקצה: מי מחזיק את ה-reference (map בלי גבול שה-key שלו הוא user או request ID, listener, cache בלי TTL, goroutine שחסומה לנצח).</li>
<li><strong>מתקנים ומוכיחים</strong>: שמים גבול (גודל מקסימלי ו-TTL, timeouts, close/defer), ואז soak test שמראה רצפה שטוחה לאורך 24 שעות ויותר. משאירים alert על השיפוע.</li>
</ol>
<blockquote>⚠️ טיפ מהשטח: עד שהתיקון עולה, מטפלים בכוונה - rolling restart מתוזמן לפני ה-OOM הצפוי, או <code>memory.high</code>/limit עם מספיק replicas כך ש-restart אחד לא כואב. אל תעלה רק את ה-limit: זה רק דוחה את ה-OOM בכמה ימים ומסתיר את השיפוע.</blockquote>`
        }
      }
    ],
    diagram: "memory over days:\n page cache     ▁▃▅▇▅▃▅▇  (reclaimed under pressure)\n warming cache  ▁▄▆▇▇▇▇▇  (plateau)\n GC sawtooth    ▂▆▂▆▂▆▂▆  (flat floor)\n LEAK           ▂▆▃▇▄█▅█ -> OOMKilled (floor keeps rising)\n\nworking_set = memory.current - inactive_file   (kubectl top, eviction)",
    handsOn: [
      { cmd: "cat /proc/$(pgrep -n myapp)/smaps_rollup | grep -E 'Rss|Pss|Private_Dirty|Swap'", what: { en: "One cheap read of RSS, PSS (anon/file/shmem) and private dirty memory for a process.", he: "קריאה זולה אחת של RSS, PSS (anon/file/shmem) וזיכרון private dirty של תהליך." } },
      { cmd: "kubectl exec deploy/api -- sh -c 'cat /sys/fs/cgroup/memory.current; grep -E \"^(anon|file|inactive_file|shmem) \" /sys/fs/cgroup/memory.stat'", what: { en: "Split a Pod's 'usage' into process memory (anon), page cache (file) and tmpfs (shmem); compute working set yourself.", he: "מפרקים את ה'צריכה' של Pod לזיכרון של תהליך (anon), page cache (file) ו-tmpfs (shmem); מחשבים working set בעצמך." } },
      { cmd: "go tool pprof -sample_index=inuse_space -base h1.pb.gz h2.pb.gz", what: { en: "Diff two Go heap profiles taken hours apart - only the growth remains.", he: "עושים diff לשני heap profiles של Go שנלקחו בהפרש של שעות - נשארת רק הגדילה." } },
      { cmd: "jcmd 1 VM.native_memory baseline && sleep 3600 && jcmd 1 VM.native_memory summary.diff", what: { en: "For a JVM started with -XX:NativeMemoryTracking=summary: which native area (threads, direct buffers, metaspace) grew in an hour.", he: "ל-JVM שעלה עם -XX:NativeMemoryTracking=summary: איזה אזור native (threads, direct buffers, metaspace) גדל בשעה." } },
      { cmd: "watch -n10 'ls /proc/$(pgrep -n myapp)/fd | wc -l; ss -tan state close-wait | wc -l'", what: { en: "Track FD count and CLOSE-WAIT sockets over time to catch descriptor leaks.", he: "עוקבים אחרי מספר ה-FDs וה-sockets ב-CLOSE-WAIT לאורך זמן כדי לתפוס דליפות descriptors." } }
    ],
    mnemonic: {
      en: "CLASSIFY before you PROFILE: is it anon or cache? Then SNAPSHOT twice, DIFF, and find who RETAINS it.",
      he: "מסווגים לפני שעושים PROFILE: זה anon או cache? אחר כך SNAPSHOT פעמיים, DIFF, ומוצאים מי מחזיק."
    },
    pitfalls: [
      { en: "Calling page cache a leak: memory.current and even working set include cache. Check anon in memory.stat (or the post-GC heap) before opening a war room.", he: "לקרוא ל-page cache דליפה: memory.current ואפילו working set כוללים cache. בדוק את anon ב-memory.stat (או את ה-heap אחרי GC) לפני שאתה פותח war room." },
      { en: "Summing RSS across forked workers and concluding the box is oversubscribed: shared pages are counted once per process. Use PSS/USS (smem).", he: "לסכום RSS על workers שעשו fork ולהסיק שהמכונה עמוסה מדי: pages משותפים נספרים פעם לכל תהליך. השתמש ב-PSS/USS (smem)." },
      { en: "Taking a heap dump in a Pod already near its limit: a Node snapshot or JVM dump needs extra memory (and disk) and can trigger the very OOM kill you're investigating. Raise the limit on a canary first, write to a volume.", he: "לקחת heap dump ב-Pod שכבר קרוב ל-limit: snapshot של Node או dump של JVM צריכים זיכרון (ודיסק) נוסף ויכולים לגרום בדיוק ל-OOM kill שאתה חוקר. קודם תעלה את ה-limit על canary, ותכתוב ל-volume." },
      { en: "Only looking at the heap when RSS grows: off-heap (direct buffers, threads, native libs) and allocator fragmentation are common causes the heap profile never shows.", he: "להסתכל רק על ה-heap כשה-RSS גדל: off-heap (direct buffers, threads, ספריות native) ו-fragmentation של ה-allocator הם סיבות נפוצות שה-heap profile אף פעם לא מראה." }
    ],
    interview: [
      {
        q: { en: "kubectl top shows a Pod at 1.9 GiB, but ps shows the process RSS at 1.1 GiB. Explain.", he: "kubectl top מראה Pod על 1.9 GiB, אבל ps מראה RSS של 1.1 GiB לתהליך. תסביר." },
        a: { en: "kubectl top reports the cgroup's working set: memory.current minus inactive_file. It includes active page cache (files the app reads or mmaps), tmpfs/shmem and kernel memory charged to the cgroup, plus any other processes in the container. ps RSS is just that process's resident pages. Check memory.stat: if anon ≈ 1.1 GiB and active_file ≈ 0.7 GiB, it's cache, not a leak - though active cache still counts toward eviction.", he: "kubectl top מדווח על working set של ה-cgroup: memory.current פחות inactive_file. הוא כולל page cache פעיל (קבצים שהאפליקציה קוראת או עושה להם mmap), tmpfs/shmem וזיכרון kernel שנזקף ל-cgroup, ועוד כל תהליך אחר בקונטיינר. ה-RSS של ps הוא רק ה-pages של אותו תהליך. בודקים memory.stat: אם anon ≈ 1.1 GiB ו-active_file ≈ 0.7 GiB, זה cache ולא דליפה - למרות ש-cache פעיל עדיין נספר ל-eviction." }
      },
      {
        q: { en: "How do you tell a real leak from GC behavior in a JVM or Go service?", he: "איך מבדילים בין דליפה אמיתית להתנהגות של GC בשירות JVM או Go?" },
        a: { en: "Look at the floor, not the peaks: heap used right after each full GC (JVM) or the live heap / inuse_space (Go) over hours. GC sawtooth with a flat floor is normal; a floor that rises with time or traffic is a leak. Then take two heap dumps/profiles hours apart and diff by retained size to find the growing structure and its retainer.", he: "מסתכלים על הרצפה, לא על השיאים: ה-heap בשימוש מיד אחרי כל full GC (JVM) או ה-live heap / inuse_space (Go) לאורך שעות. Sawtooth של GC עם רצפה שטוחה זה נורמלי; רצפה שעולה עם הזמן או התעבורה היא דליפה. אחר כך לוקחים שני heap dumps/profiles בהפרש של שעות ועושים diff לפי retained size כדי למצוא את המבנה שגדל ואת מי שמחזיק אותו." }
      }
    ],
    quiz: [
      {
        q: { en: "30 forked workers each show RSS 300 MB. Which metric gives their real combined RAM usage?", he: "ל-30 workers שעשו fork יש RSS של 300 MB כל אחד. איזה מדד נותן את צריכת ה-RAM האמיתית של כולם יחד?" },
        options: [
          { en: "Sum of RSS (9 GB)", he: "סכום ה-RSS (9 GB)" },
          { en: "Sum of PSS", he: "סכום ה-PSS" },
          { en: "VSZ", he: "VSZ" },
          { en: "Max RSS × 2", he: "RSS מקסימלי × 2" }
        ],
        answer: 1,
        explain: { en: "PSS divides each shared page among the processes sharing it, so PSS sums to real usage. RSS counts shared libraries and CoW pages fully in every process.", he: "PSS מחלק כל page משותף בין התהליכים שחולקים אותו, כך שסכום ה-PSS הוא הצריכה האמיתית. RSS סופר ספריות משותפות ו-pages של CoW במלואם בכל תהליך." }
      },
      {
        q: { en: "What does kubectl top (metrics-server) report as a container's memory?", he: "מה kubectl top (metrics-server) מדווח כזיכרון של קונטיינר?" },
        options: [
          { en: "Process RSS", he: "ה-RSS של התהליך" },
          { en: "memory.current including all page cache", he: "memory.current כולל כל ה-page cache" },
          { en: "Working set: memory.current minus inactive_file", he: "Working set: memory.current פחות inactive_file" },
          { en: "Heap size of the runtime", he: "גודל ה-heap של ה-runtime" }
        ],
        answer: 2,
        explain: { en: "Working set excludes inactive (easily reclaimable) file cache but still includes active cache, shmem and kernel memory - and it's what kubelet eviction uses.", he: "Working set לא כולל file cache לא פעיל (שקל לשחרר) אבל עדיין כולל cache פעיל, shmem וזיכרון kernel - ובו משתמשת לוגיקת ה-eviction של ה-kubelet." }
      },
      {
        q: { en: "A Go service's memory grows steadily; pprof heap looks flat but /debug/pprof/goroutine shows 150,000 goroutines (300 yesterday). Most likely cause?", he: "הזיכרון של שירות Go עולה בהתמדה; ה-heap ב-pprof נראה שטוח אבל /debug/pprof/goroutine מראה 150,000 goroutines (אתמול 300). מה הסיבה הסבירה?" },
        options: [
          { en: "Page cache", he: "Page cache" },
          { en: "A goroutine leak - goroutines blocked forever (e.g. on a channel or a call without timeout) pinning stacks", he: "דליפת goroutines - goroutines שחסומות לנצח (למשל על channel או קריאה בלי timeout) ומחזיקות stacks" },
          { en: "GC is disabled", he: "ה-GC כבוי" },
          { en: "GOMAXPROCS too high", he: "GOMAXPROCS גבוה מדי" }
        ],
        answer: 1,
        explain: { en: "Each goroutine holds at least a 2 KB stack (often grown much larger) plus whatever it references. The goroutine profile with debug=1 groups them by stack, pointing straight to where they block.", he: "כל goroutine מחזיקה stack של 2 KB לפחות (שלרוב גדל הרבה יותר) ועוד כל מה שהיא מצביעה עליו. ה-goroutine profile עם debug=1 מקבץ אותן לפי stack ומצביע ישר על המקום שבו הן חסומות." }
      },
      {
        q: { en: "RSS of a multi-threaded C++/Ruby service grows, but the allocator reports flat 'in use' bytes. First cheap experiment?", he: "ה-RSS של שירות C++/Ruby עם הרבה threads גדל, אבל ה-allocator מדווח על bytes 'in use' שטוחים. מה הניסוי הזול הראשון?" },
        options: [
          { en: "Double the memory limit", he: "להכפיל את ה-memory limit" },
          { en: "Set MALLOC_ARENA_MAX=2 or switch to jemalloc to reduce fragmentation", he: "לקבוע MALLOC_ARENA_MAX=2 או לעבור ל-jemalloc כדי להקטין fragmentation" },
          { en: "Run strace for an hour", he: "להריץ strace לשעה" },
          { en: "Disable swap", he: "לכבות swap" }
        ],
        answer: 1,
        explain: { en: "Flat live bytes with growing RSS points to fragmentation / memory not returned by glibc's per-thread arenas. Fewer arenas or a different allocator often cuts RSS 30-50%.", he: "bytes חיים שטוחים עם RSS שגדל מצביעים על fragmentation / זיכרון שלא מוחזר מה-arenas של glibc לכל thread. פחות arenas או allocator אחר מורידים לעתים קרובות 30-50% מה-RSS." }
      }
    ],
    playground: "resources",
    related: ["memory", "pr-garbage-collection", "k8s-resources", "linux-cgroups-v2", "linux-perf-tracing", "k8s-debugging"]
  });

  /* =============================== LESSON 4 =============================== */
  INFRA.lessons.push({
    id: "net-proxies-hands-on",
    track: "networking",
    order: 51,
    icon: "🚦",
    level: 3,
    minutes: 18,
    title: { en: "nginx, HAProxy & Envoy Hands-On", he: "nginx, HAProxy ו-Envoy בידיים" },
    tldr: {
      en: "All three do the same job - terminate TLS, pick a healthy upstream, reuse connections, retry and log - but most 502/504s come from just three things: a proxy timeout shorter than the slowest request, an upstream idle timeout shorter than the proxy's keepalive, and retries that aren't safe.",
      he: "שלושתם עושים את אותה עבודה - TLS termination, בחירת upstream בריא, שימוש חוזר בחיבורים, retries ו-logging - אבל רוב ה-502/504 מגיעים משלושה דברים בלבד: timeout של ה-proxy שקצר מהבקשה הכי איטית, idle timeout של ה-upstream שקצר מה-keepalive של ה-proxy, ו-retries שלא בטוחים."
    },
    analogy: {
      en: "A reverse proxy is a restaurant host. nginx is the veteran host who also runs the bakery counter (static files) - simple, everywhere. HAProxy is the maître d' obsessed with seating: exact table stats, who's waiting, can send a waiter on break mid-shift without anyone noticing. Envoy is a host with an earpiece taking instructions live from head office (xDS) - perfect for a chain of 300 branches, overkill for one bistro. The 504 is the host giving up after waiting too long at the kitchen door; the 502 is the kitchen slamming the door in the host's face.",
      he: "Reverse proxy זה המארחת במסעדה. nginx זו המארחת הוותיקה שגם מפעילה את דלפק המאפייה (קבצים סטטיים) - פשוטה, בכל מקום. HAProxy זה המלצר הראשי שאובססיבי להושבה: סטטיסטיקה מדויקת לכל שולחן, מי מחכה, ויכול לשלוח מלצר להפסקה באמצע משמרת בלי שאף אחד ירגיש. Envoy זה מארח עם אוזניה שמקבל הוראות בזמן אמת מהמטה (xDS) - מושלם לרשת של 300 סניפים, מוגזם לביסטרו אחד. 504 זה המארח שמוותר אחרי שחיכה יותר מדי ליד דלת המטבח; 502 זה המטבח שטורק לו את הדלת בפנים."
    },
    sections: [
      {
        h: { en: "nginx: a production reverse proxy config", he: "nginx: קונפיגורציית reverse proxy ל-production" },
        body: {
          en: `<pre>${PX_NGINX}</pre>
<ul>
<li><strong>Upstream keepalive</strong> needs all three: <code>keepalive N</code> in the upstream, <code>proxy_http_version 1.1</code>, and a cleared <code>Connection</code> header. Without them nginx opens a new TCP (and TLS, if upstream is https) connection per request - thousands of TIME_WAIT sockets and an extra RTT on every call.</li>
<li><strong>Health checks</strong>: open-source nginx only has <em>passive</em> checks (<code>max_fails</code>/<code>fail_timeout</code>: after 3 failures, skip the server for 30 s). Active <code>health_check</code> is NGINX Plus only - in OSS rely on Kubernetes readiness or an external checker.</li>
<li><strong>Retries</strong>: <code>proxy_next_upstream</code> retries on another server; since 1.9.13 non-idempotent requests (POST, PATCH, LOCK) are not retried once sent, unless you add <code>non_idempotent</code> - don't, unless the endpoint uses idempotency keys.</li>
<li><strong>Real client IP</strong>: <code>$proxy_add_x_forwarded_for</code> appends the peer address to the incoming header; <code>set_real_ip_from</code> + <code>real_ip_recursive on</code> makes <code>$remote_addr</code> the first <em>untrusted</em> address, so rate limits and logs key on the real client, not your load balancer.</li>
<li><strong>Rate limiting</strong> is a leaky bucket: <code>rate=20r/s burst=40 nodelay</code> lets a client spike 40 requests immediately, then 20/s; everything above gets <code>429</code>. It's per nginx instance - 3 replicas means 3× the rate.</li>
</ul>`,
          he: `<pre>${PX_NGINX}</pre>
<ul>
<li><strong>Upstream keepalive</strong> צריך את שלושתם: <code>keepalive N</code> ב-upstream, <code>proxy_http_version 1.1</code>, ו-header של <code>Connection</code> ריק. בלעדיהם nginx פותח חיבור TCP חדש (ו-TLS, אם ה-upstream ב-https) לכל בקשה - אלפי sockets ב-TIME_WAIT ו-RTT נוסף על כל קריאה.</li>
<li><strong>Health checks</strong>: ב-nginx הפתוח יש רק בדיקות <em>פסיביות</em> (<code>max_fails</code>/<code>fail_timeout</code>: אחרי 3 כשלונות, מדלגים על השרת ל-30 שניות). <code>health_check</code> אקטיבי קיים רק ב-NGINX Plus - בגרסה הפתוחה סומכים על readiness של Kubernetes או על בודק חיצוני.</li>
<li><strong>Retries</strong>: <code>proxy_next_upstream</code> מנסה שוב על שרת אחר; מגרסה 1.9.13 בקשות שאינן idempotent (POST, PATCH, LOCK) לא נשלחות שוב אחרי שנשלחו, אלא אם מוסיפים <code>non_idempotent</code> - אל תוסיף, אלא אם ה-endpoint משתמש ב-idempotency keys.</li>
<li><strong>ה-IP האמיתי של הקליינט</strong>: <code>$proxy_add_x_forwarded_for</code> מוסיף את כתובת ה-peer ל-header שהגיע; <code>set_real_ip_from</code> ביחד עם <code>real_ip_recursive on</code> הופכים את <code>$remote_addr</code> לכתובת הראשונה <em>שלא סומכים עליה</em>, כך ש-rate limits ולוגים עובדים לפי הקליינט האמיתי ולא לפי ה-load balancer שלך.</li>
<li><strong>Rate limiting</strong> הוא leaky bucket: <code>rate=20r/s burst=40 nodelay</code> נותן לקליינט לקפוץ ל-40 בקשות מיד, ואז 20 בשנייה; כל מה שמעל מקבל <code>429</code>. זה לכל instance של nginx - 3 replicas זה פי 3 מהקצב.</li>
</ul>`
        }
      },
      {
        h: { en: "HAProxy: the load balancer's load balancer", he: "HAProxy: ה-load balancer של ה-load balancers" },
        body: {
          en: `<pre>${PX_HAPROXY}</pre>
<p>HAProxy's strengths are precise load balancing and runtime control: <strong>active health checks</strong> in the free version (<code>check inter 2s fall 3 rise 2</code> = down after 6 s, back after 4 s), <strong>per-server <code>maxconn</code></strong> that queues excess requests in HAProxy instead of overloading the app, <strong>stick tables</strong> for rate limiting and abuse detection, and a <strong>runtime API</strong> to drain or disable servers without a reload.</p>
<p>Its log line is a debugging goldmine. The timers <code>TR/Tw/Tc/Tr/Ta</code> say where time went (request read / queue wait / connect / server response / total), and the 4-letter termination state says who ended the session:</p>
<pre>10.1.4.7:51234 [14/Nov/2026:10:02:11.381] fe_api~ be_app/app2 0/0/1/-1/30002 504 198 - - sH-- 812/790/12/6/0 0/0 "POST /v1/reports HTTP/1.1"
#                                                      Tr=-1: no response headers in 30 s     sH = server-side timeout while waiting for headers</pre>
<p>WebSockets just work: after the <code>101 Switching Protocols</code>, <code>timeout tunnel</code> replaces client/server timeouts. <code>http-reuse safe</code> (the default) shares idle server connections between clients, only reusing for a client's first request when it's safe.</p>`,
          he: `<pre>${PX_HAPROXY}</pre>
<p>החוזקות של HAProxy הן load balancing מדויק ושליטה בזמן ריצה: <strong>health checks אקטיביים</strong> בגרסה החינמית (<code>check inter 2s fall 3 rise 2</code> = למטה אחרי 6 שניות, חוזר אחרי 4), <strong><code>maxconn</code> לכל שרת</strong> שמחזיק בקשות עודפות בתור ב-HAProxy במקום להעמיס על האפליקציה, <strong>stick tables</strong> ל-rate limiting וזיהוי ניצול לרעה, ו-<strong>runtime API</strong> כדי לעשות drain או לנטרל שרתים בלי reload.</p>
<p>שורת הלוג שלו היא מכרה זהב לדיבאג. הטיימרים <code>TR/Tw/Tc/Tr/Ta</code> אומרים לאן הלך הזמן (קריאת הבקשה / המתנה בתור / connect / תשובת השרת / סך הכול), ו-termination state של 4 אותיות אומר מי סיים את ה-session:</p>
<pre>10.1.4.7:51234 [14/Nov/2026:10:02:11.381] fe_api~ be_app/app2 0/0/1/-1/30002 504 198 - - sH-- 812/790/12/6/0 0/0 "POST /v1/reports HTTP/1.1"
#                                                      Tr=-1: no response headers in 30 s     sH = server-side timeout while waiting for headers</pre>
<p>WebSockets פשוט עובדים: אחרי ה-<code>101 Switching Protocols</code>, <code>timeout tunnel</code> מחליף את ה-timeouts של client/server. <code>http-reuse safe</code> (ברירת המחדל) חולק חיבורים פנויים לשרת בין קליינטים, ומשתמש שוב לבקשה הראשונה של קליינט רק כשזה בטוח.</p>`
        }
      },
      {
        h: { en: "Envoy: API-driven proxy with retries, outlier detection and flags", he: "Envoy: proxy שמנוהל ב-API עם retries, outlier detection ו-flags" },
        body: {
          en: `<pre>${PX_ENVOY}</pre>
<p>Envoy's model: <strong>listeners</strong> accept connections, the <strong>HTTP connection manager</strong> parses HTTP and runs filters, <strong>routes</strong> map requests to <strong>clusters</strong>, clusters hold endpoints with health checks, outlier detection and circuit breakers. In a mesh (Istio, Consul) or gateway (Envoy Gateway, Contour) you never write this YAML: a control plane streams it over <strong>xDS</strong> (LDS/RDS/CDS/EDS), and changes apply in-process without restarting.</p>
<ul>
<li><strong>Route timeout defaults to 15 s</strong> - long exports and uploads through Envoy fail at exactly 15 s with <code>504 upstream request timeout</code> until you raise it per route. Streaming/gRPC long calls: set <code>timeout: 0s</code> and rely on <code>stream_idle_timeout</code>.</li>
<li><strong>Retries</strong> are bounded by <code>per_try_timeout</code> and the cluster's <code>max_retries</code> circuit breaker (default 3 concurrent), which stops retry storms. Envoy only retries when the request is safe to replay for the given <code>retry_on</code> condition - you still own idempotency.</li>
<li><strong>Response flags</strong> in the access log explain every failure: <code>UT</code> upstream timeout, <code>UF</code> connect failure, <code>UC</code> upstream closed, <code>UH</code> no healthy host, <code>UO</code> circuit breaker overflow, <code>URX</code> retries exhausted, <code>NR</code> no route. Note Envoy returns <strong>503</strong> (not 502) for upstream connect failures and resets.</li>
<li>Rate limiting: the <code>local_ratelimit</code> filter (token bucket per Envoy) or the global rate limit service for cluster-wide quotas.</li>
</ul>`,
          he: `<pre>${PX_ENVOY}</pre>
<p>המודל של Envoy: <strong>listeners</strong> מקבלים חיבורים, ה-<strong>HTTP connection manager</strong> מפרסר HTTP ומריץ filters, <strong>routes</strong> ממפים בקשות ל-<strong>clusters</strong>, וה-clusters מחזיקים endpoints עם health checks, outlier detection ו-circuit breakers. ב-mesh (Istio, Consul) או ב-gateway (Envoy Gateway, Contour) אתה אף פעם לא כותב את ה-YAML הזה: control plane מזרים אותו דרך <strong>xDS</strong> (LDS/RDS/CDS/EDS), והשינויים נכנסים לתוך התהליך בלי restart.</p>
<ul>
<li><strong>ה-route timeout ברירת המחדל הוא 15 שניות</strong> - exports ו-uploads ארוכים דרך Envoy נכשלים בדיוק אחרי 15 שניות עם <code>504 upstream request timeout</code> עד שמעלים אותו ב-route. לקריאות streaming/gRPC ארוכות: <code>timeout: 0s</code> וסומכים על <code>stream_idle_timeout</code>.</li>
<li><strong>Retries</strong> מוגבלים ע"י <code>per_try_timeout</code> וע"י ה-circuit breaker של <code>max_retries</code> ב-cluster (ברירת מחדל 3 במקביל), שעוצר retry storms. Envoy עושה retry רק כשבטוח לשלוח שוב לפי תנאי ה-<code>retry_on</code> - את ה-idempotency אתה עדיין צריך לפתור.</li>
<li><strong>Response flags</strong> ב-access log מסבירים כל כשל: <code>UT</code> timeout של ה-upstream, <code>UF</code> כשל ב-connect, <code>UC</code> ה-upstream סגר, <code>UH</code> אין host בריא, <code>UO</code> circuit breaker מלא, <code>URX</code> נגמרו ה-retries, <code>NR</code> אין route. שים לב ש-Envoy מחזיר <strong>503</strong> (לא 502) על כשלי connect ו-resets מה-upstream.</li>
<li>Rate limiting: ה-filter של <code>local_ratelimit</code> (token bucket לכל Envoy) או שירות ה-rate limit הגלובלי למכסות ברמת כל ה-cluster.</li>
</ul>`
        }
      },
      {
        h: { en: "The timeouts behind 502/504, and the keepalive race", he: "ה-timeouts שמאחורי 502/504, וה-race של keepalive" },
        body: {
          en: `<pre>${PX_TIMEOUTS}</pre>
<p><strong>504 = the proxy gave up waiting.</strong> The upstream accepted the request but didn't answer within <code>proxy_read_timeout</code> / <code>timeout server</code> / the route timeout. Either the backend is slow (look at <code>$upstream_response_time</code>, <code>Tr</code>) or the timeout is shorter than a legitimately slow endpoint. Timeouts must <em>shrink</em> as you go deeper: CDN 60 s &gt; LB 55 s &gt; proxy 50 s &gt; app 45 s &gt; DB query 30 s - otherwise an outer layer gives up while inner layers keep burning resources on a request nobody's waiting for.</p>
<p><strong>502 = the upstream broke the conversation</strong>: connection refused (nothing listening, Pod not ready), reset, or closed mid-response (crash, OOM kill). The sneakiest 502 is the <strong>keepalive race</strong>: the proxy keeps an idle connection for 60 s, but the app closes idle connections after 5 s (Node.js <code>server.keepAliveTimeout</code> default). At 5.000 s the app sends FIN just as the proxy writes a new request into that socket → "upstream prematurely closed connection" / RST → 502 at low, random rates that correlate with idle periods. <strong>Rule: the upstream's idle timeout must be longer than the proxy's.</strong> For Node behind an ALB (60 s idle): <code>server.keepAliveTimeout = 65000; server.headersTimeout = 66000;</code></p>
<blockquote>💡 Real world: a team saw 0.05% 502s only at night. Traffic was low, so pooled connections sat idle past gunicorn's 2 s keepalive and got closed under nginx's feet. Raising gunicorn <code>--keep-alive 75</code> above nginx's <code>keepalive_timeout 60s</code> took 502s to zero - no retries needed.</blockquote>`,
          he: `<pre>${PX_TIMEOUTS}</pre>
<p><strong>504 = ה-proxy התייאש מלחכות.</strong> ה-upstream קיבל את הבקשה אבל לא ענה בתוך <code>proxy_read_timeout</code> / <code>timeout server</code> / ה-route timeout. או שה-backend איטי (תסתכל על <code>$upstream_response_time</code>, <code>Tr</code>) או שה-timeout קצר מ-endpoint שאיטי באופן לגיטימי. ה-timeouts צריכים <em>לקטון</em> ככל שנכנסים פנימה: CDN 60 שניות &gt; LB 55 &gt; proxy 50 &gt; app 45 &gt; query ל-DB 30 - אחרת שכבה חיצונית מוותרת בזמן שהשכבות הפנימיות ממשיכות לשרוף משאבים על בקשה שאף אחד כבר לא מחכה לה.</p>
<p><strong>502 = ה-upstream שבר את השיחה</strong>: connection refused (אף אחד לא מאזין, Pod לא ready), reset, או סגירה באמצע התשובה (crash, OOM kill). ה-502 הכי ערמומי הוא <strong>ה-race של keepalive</strong>: ה-proxy מחזיק חיבור פנוי 60 שניות, אבל האפליקציה סוגרת חיבורים פנויים אחרי 5 שניות (ברירת המחדל של <code>server.keepAliveTimeout</code> ב-Node.js). ב-5.000 שניות האפליקציה שולחת FIN בדיוק כשה-proxy כותב בקשה חדשה ל-socket הזה ← "upstream prematurely closed connection" / RST ← 502 בקצב נמוך ואקראי שמתואם עם תקופות שקטות. <strong>הכלל: ה-idle timeout של ה-upstream חייב להיות ארוך יותר משל ה-proxy.</strong> ל-Node מאחורי ALB (idle של 60 שניות): <code>server.keepAliveTimeout = 65000; server.headersTimeout = 66000;</code></p>
<blockquote>💡 מהשטח: צוות ראה 0.05% של 502 רק בלילה. התעבורה הייתה נמוכה, אז חיבורים ב-pool ישבו פנויים יותר מה-keepalive של 2 שניות ב-gunicorn ונסגרו מתחת לרגליים של nginx. העלאה של <code>--keep-alive 75</code> ב-gunicorn מעל <code>keepalive_timeout 60s</code> של nginx הורידה את ה-502 לאפס - בלי צורך ב-retries.</blockquote>`
        }
      },
      {
        h: { en: "Reloads, observability, and when to choose which", he: "Reloads, observability, ומתי לבחור במה" },
        body: {
          en: `<pre>${PX_RELOAD}</pre>
<pre>${PX_OBS}</pre>
<p>In nginx stub_status, <code>accepts</code> &gt; <code>handled</code> means you hit <code>worker_connections</code> and dropped connections; <code>Waiting</code> is idle keepalive clients. For per-upstream metrics in OSS nginx you need logs (<code>$upstream_response_time</code>, <code>$upstream_status</code>) or the Prometheus exporter fed by them. HAProxy and Envoy give per-backend/per-host counters natively.</p>
<table>
<tr><th></th><th>nginx</th><th>HAProxy</th><th>Envoy</th></tr>
<tr><td>Best at</td><td>Web server + proxy, static files, simple edge</td><td>Pure L4/L7 load balancing, huge connection counts</td><td>Dynamic, API-driven service-to-service and gateways</td></tr>
<tr><td>Config</td><td>Files + reload</td><td>Files + reload + runtime API</td><td>xDS from a control plane (or static YAML)</td></tr>
<tr><td>Active health checks</td><td>Plus only</td><td>Yes</td><td>Yes + outlier detection</td></tr>
<tr><td>Observability</td><td>stub_status + logs</td><td>Stats page, CSV, Prometheus, runtime API</td><td>Thousands of stats, admin API, tracing built in</td></tr>
<tr><td>gRPC / HTTP/2 upstream</td><td>Yes (grpc_pass)</td><td>Yes</td><td>First-class</td></tr>
<tr><td>You'll meet it in</td><td>ingress-nginx (retiring - many teams move to Gateway API), every VM</td><td>On-prem LBs, HAProxy ingress, DB proxies</td><td>Istio, Envoy Gateway, Contour, AWS App Mesh legacy</td></tr>
</table>
<blockquote>⚠️ Production tip: whatever you pick, standardize the access log to include upstream address, upstream status, upstream time and total time (or Envoy's <code>%RESPONSE_FLAGS%</code>). During a 502 storm, "which upstream, how long, who closed" is the whole investigation.</blockquote>`,
          he: `<pre>${PX_RELOAD}</pre>
<pre>${PX_OBS}</pre>
<p>ב-stub_status של nginx, <code>accepts</code> &gt; <code>handled</code> אומר שהגעת ל-<code>worker_connections</code> וחיבורים נזרקו; <code>Waiting</code> זה קליינטים פנויים ב-keepalive. למטריקות לכל upstream ב-nginx הפתוח צריך לוגים (<code>$upstream_response_time</code>, <code>$upstream_status</code>) או exporter של Prometheus שניזון מהם. HAProxy ו-Envoy נותנים counters לכל backend ולכל host מהקופסה.</p>
<table>
<tr><th></th><th>nginx</th><th>HAProxy</th><th>Envoy</th></tr>
<tr><td>הכי טוב ב</td><td>Web server ו-proxy, קבצים סטטיים, edge פשוט</td><td>Load balancing טהור ב-L4/L7, כמויות חיבורים עצומות</td><td>שירות-לשירות ו-gateways דינמיים שמנוהלים ב-API</td></tr>
<tr><td>קונפיגורציה</td><td>קבצים ו-reload</td><td>קבצים, reload ו-runtime API</td><td>xDS מ-control plane (או YAML סטטי)</td></tr>
<tr><td>Health checks אקטיביים</td><td>רק ב-Plus</td><td>כן</td><td>כן, ועוד outlier detection</td></tr>
<tr><td>Observability</td><td>stub_status ולוגים</td><td>דף stats, CSV, Prometheus, runtime API</td><td>אלפי stats, admin API, tracing מובנה</td></tr>
<tr><td>gRPC / HTTP/2 ל-upstream</td><td>כן (grpc_pass)</td><td>כן</td><td>ברמה הכי גבוהה</td></tr>
<tr><td>איפה תפגוש אותו</td><td>ingress-nginx (בדרך לפרישה - הרבה צוותים עוברים ל-Gateway API), כל VM</td><td>LBs ב-on-prem, HAProxy ingress, proxies ל-DB</td><td>Istio, Envoy Gateway, Contour, AWS App Mesh הישן</td></tr>
</table>
<blockquote>⚠️ טיפ מהשטח: לא משנה מה תבחר, תעשה סטנדרט ל-access log שיכלול כתובת upstream, סטטוס upstream, זמן upstream וזמן כולל (או <code>%RESPONSE_FLAGS%</code> של Envoy). בזמן סערת 502, "איזה upstream, כמה זמן, מי סגר" זו כל החקירה.</blockquote>`
        }
      }
    ],
    diagram: "client --TLS--> [proxy: listener/frontend/server]\n                 | route/location -> upstream/backend/cluster\n                 | health check + least_conn/leastconn/LEAST_REQUEST\n                 | keepalive pool (idle 60s)  <-- app idle timeout MUST be > 60s\n                 v\n               app:8080   (504 = proxy waited too long; 502 = app refused/reset/closed)",
    handsOn: [
      { cmd: "sudo nginx -T | grep -nE 'proxy_(read|connect|send)_timeout|keepalive|proxy_http_version'", what: { en: "Dump the full effective nginx config and find every timeout and keepalive setting actually in force.", he: "מדפיסים את כל הקונפיגורציה האפקטיבית של nginx ומוצאים כל timeout והגדרת keepalive שבאמת בתוקף." } },
      { cmd: "curl -s -o /dev/null -w 'connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} code=%{http_code}\\n' https://api.example.com/v1/slow", what: { en: "Measure where time goes through the proxy; a total that stops at exactly 30.0 s or 15.0 s with 504 is a proxy timeout, not the app.", he: "מודדים לאן הולך הזמן דרך ה-proxy; total שנעצר בדיוק ב-30.0 או ב-15.0 שניות עם 504 זה timeout של ה-proxy, לא האפליקציה." } },
      { cmd: "echo 'show stat' | sudo socat stdio /run/haproxy/admin.sock | cut -d, -f1,2,5,18 | column -s, -t", what: { en: "HAProxy per-server current sessions and status (UP/DOWN/DRAIN) from the runtime API.", he: "sessions נוכחיים וסטטוס (UP/DOWN/DRAIN) לכל שרת ב-HAProxy דרך ה-runtime API." } },
      { cmd: "kubectl port-forward deploy/api 15000:15000 & curl -s localhost:15000/clusters | grep health_flags", what: { en: "In Istio, the sidecar's Envoy admin is on 15000: see which endpoints Envoy considers healthy or ejected.", he: "ב-Istio, ה-admin של ה-Envoy ב-sidecar נמצא על 15000: רואים אילו endpoints ה-Envoy חושב שבריאים או שהוצאו." } },
      { cmd: "ss -tan state time-wait '( dport = :8080 )' | wc -l", what: { en: "Thousands of TIME_WAIT sockets to the upstream port = the proxy isn't reusing connections (check keepalive + HTTP/1.1).", he: "אלפי sockets ב-TIME_WAIT לפורט של ה-upstream = ה-proxy לא משתמש שוב בחיבורים (תבדוק keepalive ו-HTTP/1.1)." } }
    ],
    mnemonic: {
      en: "504 = proxy WAITED too long; 502 = upstream BROKE the line. Timeouts shrink inward, idle timeouts grow inward.",
      he: "504 = ה-proxy חיכה יותר מדי; 502 = ה-upstream ניתק את הקו. Timeouts קטנים פנימה, idle timeouts גדלים פנימה."
    },
    pitfalls: [
      { en: "Upstream keepalive configured but proxy_http_version left at 1.0 or Connection header passed through: nginx silently opens a new connection per request.", he: "להגדיר upstream keepalive אבל להשאיר proxy_http_version על 1.0 או להעביר את ה-header של Connection: nginx פותח בשקט חיבור חדש לכל בקשה." },
      { en: "App idle timeout shorter than the proxy's keepalive (Node's 5 s default behind a 60 s pool): rare, random 502s that no amount of retries fully fixes.", he: "idle timeout של האפליקציה קצר מה-keepalive של ה-proxy (ברירת המחדל של 5 שניות ב-Node מאחורי pool של 60 שניות): 502 נדירים ואקראיים שאף כמות של retries לא פותרת לגמרי." },
      { en: "Enabling retries on non-idempotent requests (nginx non_idempotent, Envoy retry_on 5xx for POST): a timed-out payment gets charged twice.", he: "להדליק retries על בקשות שאינן idempotent (non_idempotent ב-nginx, retry_on 5xx ב-Envoy עבור POST): תשלום שקיבל timeout מחויב פעמיים." },
      { en: "Trusting X-Forwarded-For from anyone: without set_real_ip_from / xff_num_trusted_hops limits, clients spoof their IP and bypass rate limits and allowlists.", he: "לסמוך על X-Forwarded-For מכל אחד: בלי הגבלה של set_real_ip_from / xff_num_trusted_hops, קליינטים מזייפים את ה-IP שלהם ועוקפים rate limits ו-allowlists." }
    ],
    interview: [
      {
        q: { en: "Users report 504s on a report export behind nginx and Envoy. How do you find which layer times out?", he: "משתמשים מדווחים על 504 ב-export של דוח מאחורי nginx ו-Envoy. איך מוצאים איזו שכבה עושה timeout?" },
        a: { en: "Look at the exact duration: a 504 at 15.0 s smells like Envoy's default route timeout, at 60.0 s like nginx's default proxy_read_timeout or an ALB idle timeout. Confirm in logs - nginx 'upstream timed out (110)' with $upstream_response_time, Envoy access log flag UT, HAProxy sH. Then decide: make the endpoint async (job + polling) or raise timeouts so they shrink inward (outer > inner), never the reverse.", he: "מסתכלים על המשך המדויק: 504 ב-15.0 שניות מריח כמו ה-route timeout ברירת המחדל של Envoy, ב-60.0 שניות כמו ה-proxy_read_timeout ברירת המחדל של nginx או idle timeout של ALB. מאשרים בלוגים - ב-nginx 'upstream timed out (110)' עם $upstream_response_time, ב-Envoy ה-flag UT ב-access log, ב-HAProxy sH. ואז מחליטים: להפוך את ה-endpoint לאסינכרוני (job ו-polling) או להעלות timeouts כך שהם קטנים פנימה (חיצוני > פנימי), אף פעם לא הפוך." }
      },
      {
        q: { en: "How do you reload a proxy without dropping connections, and what can still go wrong?", he: "איך עושים reload ל-proxy בלי לזרוק חיבורים, ומה עדיין יכול להשתבש?" },
        a: { en: "nginx -s reload starts new workers with the new config while old workers stop accepting and finish in-flight requests; HAProxy master-worker passes the listening sockets to the new process; Envoy changes routes/clusters via xDS without restart. What goes wrong: long-lived connections (websockets, gRPC streams) keep old workers/processes alive for hours, multiplying memory - cap with worker_shutdown_timeout / hard-stop-after and make clients reconnect gracefully. Always validate first (nginx -t, haproxy -c).", he: "nginx -s reload מעלה workers חדשים עם הקונפיגורציה החדשה בזמן שה-workers הישנים מפסיקים לקבל חיבורים ומסיימים בקשות פתוחות; HAProxy במצב master-worker מעביר את ה-sockets שמאזינים לתהליך החדש; Envoy משנה routes/clusters דרך xDS בלי restart. מה משתבש: חיבורים ארוכים (websockets, gRPC streams) משאירים workers/תהליכים ישנים חיים שעות, והזיכרון מוכפל - מגבילים עם worker_shutdown_timeout / hard-stop-after ודואגים שהקליינטים יתחברו מחדש בצורה חלקה. תמיד בודקים קודם (nginx -t, haproxy -c)." }
      }
    ],
    quiz: [
      {
        q: { en: "Through Envoy, every request longer than exactly 15 seconds fails with 504. Most likely cause?", he: "דרך Envoy, כל בקשה שארוכה מ-15 שניות בדיוק נכשלת עם 504. מה הסיבה הסבירה?" },
        options: [
          { en: "The upstream crashed", he: "ה-upstream קרס" },
          { en: "Envoy's default route timeout of 15 s", he: "ה-route timeout ברירת המחדל של Envoy, 15 שניות" },
          { en: "TLS handshake failure", he: "כשל ב-TLS handshake" },
          { en: "The circuit breaker opened", he: "ה-circuit breaker נפתח" }
        ],
        answer: 1,
        explain: { en: "Envoy routes default to a 15 s timeout; exceeding it returns 504 with response flag UT. Raise it per route (or 0s plus stream_idle_timeout for streaming).", he: "ל-routes ב-Envoy יש timeout ברירת מחדל של 15 שניות; חריגה ממנו מחזירה 504 עם response flag של UT. מעלים אותו ב-route (או 0s ועוד stream_idle_timeout ל-streaming)." }
      },
      {
        q: { en: "Rare, random 502s appear mostly during quiet hours behind nginx with upstream keepalive. Node.js backend, defaults. Fix?", he: "502 נדירים ואקראיים מופיעים בעיקר בשעות שקטות מאחורי nginx עם upstream keepalive. Backend של Node.js, ברירות מחדל. מה התיקון?" },
        options: [
          { en: "Lower proxy_read_timeout", he: "להוריד את proxy_read_timeout" },
          { en: "Disable HTTP/1.1", he: "לכבות HTTP/1.1" },
          { en: "Make the app's keepAliveTimeout longer than nginx's upstream keepalive_timeout", he: "לקבוע keepAliveTimeout של האפליקציה ארוך יותר מה-keepalive_timeout של ה-upstream ב-nginx" },
          { en: "Add more nginx workers", he: "להוסיף עוד workers ל-nginx" }
        ],
        answer: 2,
        explain: { en: "Node closes idle sockets after 5 s by default; nginx reuses them up to 60 s, racing the FIN. The side that closes idle connections must be the proxy, so the upstream's idle timeout must be longer.", he: "Node סוגר sockets פנויים אחרי 5 שניות כברירת מחדל; nginx משתמש בהם שוב עד 60 שניות ונכנס ל-race עם ה-FIN. הצד שסוגר חיבורים פנויים צריך להיות ה-proxy, לכן ה-idle timeout של ה-upstream צריך להיות ארוך יותר." }
      },
      {
        q: { en: "An HAProxy log line ends with status 504 and termination state 'sH--'. What happened?", he: "שורת לוג של HAProxy מסתיימת בסטטוס 504 ו-termination state של 'sH--'. מה קרה?" },
        options: [
          { en: "The client closed the connection", he: "הקליינט סגר את החיבור" },
          { en: "The server-side timeout expired while waiting for response headers (timeout server)", he: "ה-timeout בצד השרת פג בזמן שחיכה ל-headers של התשובה (timeout server)" },
          { en: "No server was available", he: "לא היה שרת זמין" },
          { en: "A rate limit denied the request", he: "rate limit דחה את הבקשה" }
        ],
        answer: 1,
        explain: { en: "First letter 's' = server-side timeout, second 'H' = while waiting for response headers. Tr shows -1 because no headers arrived.", he: "האות הראשונה 's' = timeout בצד השרת, השנייה 'H' = בזמן המתנה ל-headers של התשובה. Tr מראה מינוס 1 כי לא הגיעו headers." }
      },
      {
        q: { en: "Which nginx settings are ALL required for upstream connection reuse?", he: "אילו הגדרות של nginx נדרשות ביחד כדי לעשות שימוש חוזר בחיבורים ל-upstream?" },
        options: [
          { en: "keepalive in upstream, proxy_http_version 1.1, and clearing the Connection header", he: "keepalive ב-upstream, proxy_http_version 1.1, ו-header של Connection ריק" },
          { en: "Only keepalive_timeout in the server block", he: "רק keepalive_timeout בבלוק של server" },
          { en: "http2 on", he: "http2 on" },
          { en: "proxy_buffering off", he: "proxy_buffering off" }
        ],
        answer: 0,
        explain: { en: "nginx talks HTTP/1.0 to upstreams by default and passes 'Connection: close'. You need the upstream keepalive pool, HTTP/1.1 and an empty (or upgrade-aware) Connection header.", he: "nginx מדבר HTTP/1.0 עם upstreams כברירת מחדל ושולח 'Connection: close'. צריך pool של keepalive ב-upstream, HTTP/1.1 ו-header של Connection ריק (או כזה שמכיר upgrade)." }
      }
    ],
    playground: "lb",
    related: ["net-proxies-cdn", "net-load-balancing", "net-http-tls", "net-tcp-deep", "net-troubleshooting"]
  });

  /* =============================== GLOSSARY =============================== */
  INFRA.glossary.push(
    { term: "PSI (Pressure Stall Information)", track: "linux", def: { en: "Kernel metric (/proc/pressure and per-cgroup *.pressure files) showing the percent of time tasks were stalled waiting for CPU, memory or IO - 'some' vs 'full'.", he: "מדד של ה-kernel (/proc/pressure וקבצי *.pressure לכל cgroup) שמראה כמה אחוז מהזמן tasks היו תקועים בהמתנה ל-CPU, זיכרון או IO - 'some' מול 'full'." }, lesson: "linux-cgroups-v2" },
    { term: "memory.high", track: "linux", def: { en: "cgroup v2 soft memory limit: above it the kernel reclaims aggressively and throttles allocations but never OOM-kills (memory.max is the hard wall).", he: "limit רך של זיכרון ב-cgroup v2: מעליו ה-kernel עושה reclaim אגרסיבי ומאט הקצאות, אבל אף פעם לא עושה OOM kill (memory.max הוא הקיר הקשיח)." }, lesson: "linux-cgroups-v2" },
    { term: "systemd slice", track: "linux", def: { en: "A systemd unit that is a node in the cgroup tree (system.slice, user.slice, kubepods.slice); resource properties like MemoryMax or CPUWeight set on it apply to everything below.", he: "unit של systemd שהוא צומת בעץ ה-cgroups (system.slice, user.slice, kubepods.slice); properties של משאבים כמו MemoryMax או CPUWeight שמוגדרים עליו חלים על כל מה שמתחתיו." }, lesson: "linux-cgroups-v2" },
    { term: "perf", track: "linux", def: { en: "The Linux profiler: samples stacks (perf record/top), reads hardware counters (perf stat) and traces events (perf trace) with low overhead.", he: "ה-profiler של Linux: דוגם stacks (perf record/top), קורא hardware counters (perf stat) ועושה trace לאירועים (perf trace) עם overhead נמוך." }, lesson: "linux-perf-tracing" },
    { term: "bpftrace", track: "linux", def: { en: "High-level eBPF tracing language: one-liners that attach to tracepoints, kprobes, uprobes or timers and aggregate counts and latency histograms in the kernel.", he: "שפת tracing ברמה גבוהה מעל eBPF: one-liners שמתחברים ל-tracepoints, kprobes, uprobes או טיימרים ומצברים ספירות ו-histograms של latency בתוך ה-kernel." }, lesson: "linux-perf-tracing" },
    { term: "BCC (BPF Compiler Collection)", track: "linux", def: { en: "Toolkit of ~100 ready-made eBPF tools such as execsnoop, opensnoop, biolatency, tcpretrans, runqlat and offcputime.", he: "ארגז של כ-100 כלי eBPF מוכנים כמו execsnoop, opensnoop, biolatency, tcpretrans, runqlat ו-offcputime." }, lesson: "linux-perf-tracing" },
    { term: "PSS (Proportional Set Size)", track: "linux", def: { en: "A process's resident memory with each shared page divided by the number of processes sharing it; PSS values add up to real RAM usage, unlike RSS.", he: "הזיכרון שתהליך מחזיק ב-RAM כשכל page משותף מחולק במספר התהליכים שחולקים אותו; סכום ה-PSS הוא צריכת ה-RAM האמיתית, בניגוד ל-RSS." }, lesson: "linux-memory-leaks" },
    { term: "USS (Unique Set Size)", track: "linux", def: { en: "Only the pages private to a process - the memory you would get back by killing it.", he: "רק ה-pages שפרטיים לתהליך - הזיכרון שתקבל בחזרה אם תהרוג אותו." }, lesson: "linux-memory-leaks" },
    { term: "Working set (container memory)", track: "linux", def: { en: "memory.current minus inactive_file for a cgroup; what kubectl top and kubelet eviction use. Includes active page cache, so it can rise without a leak.", he: "memory.current פחות inactive_file של cgroup; בזה משתמשים kubectl top וה-eviction של ה-kubelet. כולל page cache פעיל, אז הוא יכול לעלות בלי דליפה." }, lesson: "linux-memory-leaks" },
    { term: "X-Forwarded-For", track: "networking", def: { en: "HTTP header where each proxy appends the address it received the request from, so backends can see the original client IP. Trust it only from your own proxies.", he: "header של HTTP שבו כל proxy מוסיף את הכתובת שממנה קיבל את הבקשה, כך שה-backends רואים את ה-IP המקורי של הקליינט. סומכים עליו רק כשהוא מגיע מה-proxies שלך." }, lesson: "net-proxies-hands-on" },
    { term: "Upstream keepalive", track: "networking", def: { en: "A pool of idle, reusable connections from a proxy to its backends; saves a TCP/TLS handshake per request, but the backend's idle timeout must be longer than the proxy's to avoid 502 races.", he: "pool של חיבורים פנויים לשימוש חוזר מ-proxy ל-backends שלו; חוסך handshake של TCP/TLS לכל בקשה, אבל ה-idle timeout של ה-backend חייב להיות ארוך משל ה-proxy כדי להימנע מ-race שמייצר 502." }, lesson: "net-proxies-hands-on" },
    { term: "Graceful reload", track: "networking", def: { en: "Applying new proxy config without dropping connections: new workers take new connections while old ones finish in-flight requests (nginx -s reload, HAProxy master-worker, Envoy xDS/hot restart).", he: "החלת קונפיגורציה חדשה על proxy בלי לזרוק חיבורים: workers חדשים מקבלים חיבורים חדשים בזמן שהישנים מסיימים בקשות פתוחות (nginx -s reload, master-worker ב-HAProxy, xDS או hot restart ב-Envoy)." }, lesson: "net-proxies-hands-on" }
  );

  /* =============================== SCENARIO =============================== */
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  INFRA.scenarios.push({
    id: "slow-memory-leak-oom",
    icon: "🕳️",
    title: t("The service that dies every four days", "השירות שמת כל ארבעה ימים"),
    start: "s1",
    steps: {
      s1: {
        text: t("Tuesday 03:40. orders-api Pods are OOMKilled again - one at a time, every ~4 days since a release two weeks ago. Each restart drops in-flight orders. The memory dashboard shows a slow ramp.",
                "יום שלישי 03:40. ה-Pods של orders-api שוב קיבלו OOMKilled - אחד אחד, בערך כל 4 ימים מאז ריליס לפני שבועיים. כל restart מפיל הזמנות באמצע. דשבורד הזיכרון מראה עלייה איטית."),
        data: `$ kubectl get pods -n shop -l app=orders-api
NAME                          READY   STATUS    RESTARTS        AGE
orders-api-6c8d9f7b5-k2xlp    1/1     Running   3 (2h ago)      13d
orders-api-6c8d9f7b5-p9wqz    1/1     Running   3 (31h ago)     13d
orders-api-6c8d9f7b5-zr4mn    1/1     Running   2 (3d ago)      13d

container_memory_working_set_bytes (limit 2Gi):
day0 0.6Gi  day1 1.0Gi  day2 1.4Gi  day3 1.8Gi  day4 2.0Gi -> OOMKilled`,
        choices: [
          c("Before calling it a leak, split the memory: read memory.stat (anon vs file) inside a Pod", "לפני שקוראים לזה דליפה, לפרק את הזיכרון: לקרוא memory.stat (anon מול file) בתוך Pod", "s2", 15,
            "Right. Working set includes page cache; first prove the growth is process memory.",
            "נכון. working set כולל page cache; קודם מוכיחים שהגדילה היא זיכרון של התהליך."),
          c("Raise the memory limit to 4Gi and go back to sleep", "להעלות את ה-memory limit ל-4Gi ולחזור לישון", "s2b", -5,
            "That buys ~5 more days and hides the slope. Fine as a stopgap only if you also investigate.",
            "זה קונה עוד בערך 5 ימים ומסתיר את השיפוע. בסדר כפתרון זמני רק אם אתה גם חוקר."),
          c("Roll back the release from two weeks ago", "לעשות rollback לריליס מלפני שבועיים", "s2b", 0,
            "Plausible, but 14 more commits went out since, including a DB migration. Rolling back blind is risky - you need evidence first.",
            "הגיוני, אבל מאז יצאו עוד 14 commits, כולל migration ל-DB. rollback בעיוורון זה מסוכן - קודם צריך ראיות.")
        ]
      },
      s2b: {
        text: t("Your teammate asks what's actually growing before touching anything else. Fair.",
                "חבר לצוות שואל מה בעצם גדל לפני שנוגעים בעוד משהו. הוגן."),
        choices: [
          c("Read memory.stat in the oldest Pod", "לקרוא memory.stat ב-Pod הכי ותיק", "s2", 10,
            "Good - classify before acting.",
            "טוב - מסווגים לפני שפועלים.")
        ]
      },
      s2: {
        text: t("In the Pod that's been up 3 days:", "ב-Pod שרץ כבר 3 ימים:"),
        data: `$ kubectl exec -n shop orders-api-6c8d9f7b5-zr4mn -- sh -c \\
  'cat /sys/fs/cgroup/memory.current; grep -E "^(anon|file|inactive_file|shmem) " /sys/fs/cgroup/memory.stat'
1932735283
anon 1675624448          # 1.56 GiB
file 251658240           # 240 MiB
inactive_file 201326592
shmem 0

$ kubectl exec ... -- jcmd 1 GC.heap_info | head -3
 garbage-first heap   total 1572864K, used 1398102K
  region size 1024K, 380 young (389120K), 12 survivors (12288K)
 Metaspace       used 98211K, committed 99328K`,
        choices: [
          c("anon is 1.56 GiB and the Java heap is nearly full: it's on-heap. Check the post-GC floor and plan a heap diff", "anon הוא 1.56 GiB וה-heap של Java כמעט מלא: זה on-heap. לבדוק את הרצפה אחרי GC ולתכנן diff של heap", "s3", 15,
            "Correct read: almost all growth is anonymous and inside the heap.",
            "קריאה נכונה: כמעט כל הגדילה היא anonymous ובתוך ה-heap."),
          c("It's page cache - ignore it", "זה page cache - להתעלם", "lose", -15,
            "file is only 240 MiB. 1.56 GiB anon is process memory. Pods keep dying.",
            "file הוא רק 240 MiB. 1.56 GiB של anon זה זיכרון של התהליך. ה-Pods ממשיכים למות."),
          c("Turn on Native Memory Tracking first", "קודם להדליק Native Memory Tracking", "s3", 5,
            "Not wrong, but the heap already explains the growth. NMT is for when RSS grows while the heap is flat.",
            "לא טעות, אבל ה-heap כבר מסביר את הגדילה. NMT מתאים כשה-RSS גדל וה-heap שטוח.")
        ]
      },
      s3: {
        text: t("GC logs confirm it: the heap floor after each full collection keeps rising. You need to see which objects grow. The Pod is at 1.8 of 2 GiB.",
                "לוגי ה-GC מאשרים: הרצפה של ה-heap אחרי כל full GC ממשיכה לעלות. צריך לראות אילו אובייקטים גדלים. ה-Pod על 1.8 מתוך 2 GiB."),
        data: `[GC log, after full GC]  day0: 310M   day1: 690M   day2: 1080M   day3: 1390M`,
        choices: [
          c("Raise the limit on ONE canary Pod, take a heap dump now and another in 6 hours to a mounted volume, diff them in MAT", "להעלות limit ב-Pod אחד של canary, לקחת heap dump עכשיו ועוד אחד בעוד 6 שעות ל-volume מחובר, ולעשות להם diff ב-MAT", "s4", 15,
            "Two snapshots hours apart, without tipping a near-limit Pod into OOM - textbook.",
            "שני snapshots בהפרש של שעות, בלי לדחוף Pod שקרוב ל-limit ל-OOM - בדיוק לפי הספר."),
          c("Take a heap dump right now in the 1.8 GiB Pod, writing to /tmp", "לקחת heap dump עכשיו ב-Pod של 1.8 GiB, ולכתוב ל-/tmp", "s4", -5,
            "It worked, barely: the dump forced a full GC and the Pod hit 1.97 GiB. /tmp on an overlay could have filled the node's disk. One snapshot also can't show growth on its own.",
            "זה עבד, בקושי: ה-dump הכריח full GC וה-Pod הגיע ל-1.97 GiB. /tmp על overlay יכול היה למלא את הדיסק של ה-node. ובנוסף snapshot אחד לבד לא מראה גדילה."),
          c("Run strace on the JVM for an hour to see allocations", "להריץ strace על ה-JVM לשעה כדי לראות הקצאות", "lose", -15,
            "strace shows syscalls, not Java object allocations - and its ptrace overhead turned p99 into seconds. Checkout timed out for real users.",
            "strace מראה syscalls, לא הקצאות של אובייקטים ב-Java - וה-overhead של ptrace הפך את ה-p99 לשניות. ה-checkout נפל ב-timeout אצל משתמשים אמיתיים.")
        ]
      },
      s4: {
        text: t("Eclipse MAT, comparing the two dumps by retained size:", "Eclipse MAT, השוואה בין שני ה-dumps לפי retained size:"),
        data: `Class                                         Objects(Δ)     Retained Heap(Δ)
java.util.concurrent.ConcurrentHashMap$Node   +1,212,400     +412 MB
com.shop.orders.IdempotencyRegistry           0              +409 MB
  -> field 'seen' : ConcurrentHashMap<String, OrderResponse>
     keys look like: "idem-3f9a1c2e-...", entries never removed
git blame: IdempotencyRegistry added 15 days ago ("dedupe retried POSTs")`,
        choices: [
          c("The idempotency map has no TTL or size bound: replace it with a bounded cache (max size + 24h TTL) or move it to Redis with EXPIRE", "ל-map של ה-idempotency אין TTL או גבול גודל: להחליף אותו ב-cache חסום (גודל מקסימלי ו-TTL של 24 שעות) או להעביר ל-Redis עם EXPIRE", "s5", 15,
            "You found the retainer, not just the allocation: an unbounded map keyed by request ID grows forever by design.",
            "מצאת את מי שמחזיק, לא רק את מי שמקצה: map בלי גבול שה-key שלו הוא request ID גדל לנצח מעצם התכנון."),
          c("Call System.gc() every hour", "לקרוא ל-System.gc() כל שעה", "lose", -10,
            "The entries are reachable - GC can't free them. You added STW pauses and the Pods still die.",
            "יש גישה לרשומות - ה-GC לא יכול לשחרר אותן. הוספת עצירות STW וה-Pods עדיין מתים."),
          c("Increase -Xmx to 3G", "להגדיל את -Xmx ל-3G", "lose", -10,
            "With a 2Gi container limit, a 3G heap means the kernel OOM-kills you sooner - and the map still grows forever.",
            "עם limit של 2Gi לקונטיינר, heap של 3G אומר שה-kernel יהרוג אותך מוקדם יותר - וה-map עדיין גדל לנצח.")
        ]
      },
      s5: {
        text: t("The fix is in review. It's Tuesday morning and the next Pod will hit the wall in ~20 hours. What about until it ships?",
                "התיקון ב-review. יום שלישי בבוקר וה-Pod הבא יגיע לקיר בעוד בערך 20 שעות. מה עושים עד שזה עולה?"),
        choices: [
          c("Schedule a rolling restart before the predicted OOM, add an alert on the post-GC heap slope, and after deploy run a 48h soak showing a flat floor", "לתזמן rolling restart לפני ה-OOM הצפוי, להוסיף alert על השיפוע של ה-heap אחרי GC, ואחרי ה-deploy להריץ soak של 48 שעות שמראה רצפה שטוחה", "win", 15,
            "Controlled mitigation, a regression alarm and proof the fix works.",
            "טיפול מבוקר, alert לרגרסיה והוכחה שהתיקון עובד."),
          c("Do nothing - it'll be deployed soon", "לא לעשות כלום - זה יעלה בקרוב", "lose", -10,
            "The review stalled on a question about TTL length. The Pod OOMed at 23:50 during the evening peak.",
            "ה-review נתקע על שאלה לגבי אורך ה-TTL. ה-Pod קיבל OOM ב-23:50 באמצע שיא הערב.")
        ]
      },
      win: {
        text: t("48 hours after the fix: post-GC heap flat at ~320 MB, working set steady at 0.7 GiB, zero OOMKills. The postmortem adds 'every in-memory map keyed by user/request input must have a bound' to the review checklist.",
                "48 שעות אחרי התיקון: ה-heap אחרי GC שטוח בערך על 320 MB, ה-working set יציב על 0.7 GiB, אפס OOMKills. ה-postmortem מוסיף ל-checklist של ה-review: 'כל map בזיכרון שה-key שלו מגיע מקלט של משתמש או בקשה חייב גבול'."),
        end: "win"
      },
      lose: {
        text: t("The Pods keep dying every few days and orders keep dropping. Lesson: classify memory first (anon vs cache), then diff two heap snapshots to find what retains the growth - and mitigate deliberately until the fix ships.",
                "ה-Pods ממשיכים למות כל כמה ימים והזמנות ממשיכות ליפול. הלקח: קודם מסווגים את הזיכרון (anon מול cache), אחר כך עושים diff לשני heap snapshots כדי למצוא מי מחזיק את הגדילה - ומטפלים בכוונה עד שהתיקון עולה."),
        end: "lose"
      }
    },
    lessons: ["linux-memory-leaks", "linux-cgroups-v2", "pr-garbage-collection", "k8s-resources"]
  });
})();
