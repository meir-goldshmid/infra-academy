window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Networking, deeper: TCP internals, NAT & conntrack, BGP & anycast,
   connecting networks (peering, TGW, PrivateLink, VPN, Direct Connect)
   ========================================================================= */

/* ------------------------------------------------------------------ TCP */
window.INFRA.lessons.push({
  id: "net-tcp-deep",
  track: "networking",
  order: 20,
  icon: "🤝",
  level: 3,
  minutes: 16,
  title: { en: "TCP in depth: handshakes, windows, states and timeouts", he: "TCP לעומק: handshakes, windows, states ו-timeouts" },
  tldr: {
    en: "TCP is a reliable byte stream built from sequence numbers, ACKs, a flow-control window and a congestion window; most production pain is not the protocol itself but its states (TIME_WAIT, CLOSE_WAIT), its timers and the idle timeouts of every box in the middle.",
    he: "TCP זה byte stream אמין שבנוי מ-sequence numbers, ACKs, window של flow control ו-congestion window; רוב הכאב בפרודקשן הוא לא הפרוטוקול עצמו אלא ה-states שלו (TIME_WAIT, CLOSE_WAIT), הטיימרים שלו וה-idle timeouts של כל קופסה באמצע."
  },
  analogy: {
    en: "TCP is a phone call over a bad line between two careful accountants. They first confirm they can hear each other (handshake), then read numbered lines from a ledger and say 'got up to line 4,200' (ACKs). The listener says how much space is left on his notepad (receive window), and the reader speeds up until the line starts crackling, then backs off (congestion control). Hanging up takes four steps, and whoever hangs up first waits a minute by the phone in case a late echo arrives (TIME_WAIT).",
    he: "TCP זו שיחת טלפון על קו גרוע בין שני רואי חשבון זהירים. קודם הם מוודאים ששומעים אחד את השני (handshake), אחר כך אחד מקריא שורות ממוספרות מהספר והשני אומר 'קיבלתי עד שורה 4,200' (ACKs). המקשיב אומר כמה מקום נשאר לו בפנקס (receive window), והמקריא מאיץ עד שהקו מתחיל לקרטע ואז מאט (congestion control). ניתוק לוקח ארבעה צעדים, ומי שמנתק ראשון מחכה דקה ליד הטלפון למקרה שמגיע הד מאוחר (TIME_WAIT)."
  },
  sections: [
    {
      h: { en: "The handshake and the two accept queues", he: "ה-handshake ושני תורי ה-accept" },
      body: {
        en: `<p>The client sends <code>SYN</code> (random initial sequence number, MSS, window scale, SACK-permitted, timestamps), the server answers <code>SYN-ACK</code>, the client sends <code>ACK</code>. That's one full RTT before the first byte of data, and TLS 1.3 adds another (1.2 adds two). This is why connection reuse matters so much: a new HTTPS connection from Tel Aviv to us-east-1 (~130 ms RTT) costs ~260 ms before the request even leaves.</p>
<p>On a Linux listener there are <strong>two queues</strong>:</p>
<ul>
<li><strong>SYN queue</strong> (half-open, state <code>SYN_RECV</code>): sized by <code>net.ipv4.tcp_max_syn_backlog</code>. When it fills (SYN flood), <code>tcp_syncookies=1</code> lets the kernel answer without storing state.</li>
<li><strong>Accept queue</strong> (fully established, waiting for the app to call <code>accept()</code>): sized by <code>min(backlog passed to listen(), net.core.somaxconn)</code>. <code>somaxconn</code> was 128 for years and became 4096 in kernel 5.4.</li>
</ul>
<p>If the app is slow to <code>accept()</code> (event loop blocked, GC pause), the accept queue overflows and the kernel drops the final ACK. The client thinks it's connected; its first request then hangs and gets retransmitted. You see it as a counter, not a log line:</p>
<pre>$ nstat -az | grep -i listen
TcpExtListenOverflows           18342    0.0
TcpExtListenDrops               18342    0.0
$ ss -ltn 'sport = :8080'
State   Recv-Q  Send-Q  Local Address:Port
LISTEN  4097    4096    0.0.0.0:8080        &lt;- Recv-Q = queue length now, Send-Q = max</pre>
<blockquote>⚠️ Production tip: for a LISTEN socket, <code>Recv-Q</code> close to <code>Send-Q</code> means the accept queue is full. Raising <code>somaxconn</code> buys burst headroom, but the real fix is an app that accepts faster (more workers, no blocking in the accept loop).</blockquote>`,
        he: `<p>ה-client שולח <code>SYN</code> (initial sequence number אקראי, MSS, window scale, SACK-permitted, timestamps), השרת עונה <code>SYN-ACK</code>, וה-client שולח <code>ACK</code>. זה RTT שלם לפני הבייט הראשון של דאטה, ו-TLS 1.3 מוסיף עוד אחד (1.2 מוסיף שניים). בגלל זה שימוש חוזר בחיבורים כל כך חשוב: חיבור HTTPS חדש מתל אביב ל-us-east-1 (כ-130ms RTT) עולה כ-260ms עוד לפני שה-request בכלל יצא.</p>
<p>על listener ב-Linux יש <strong>שני תורים</strong>:</p>
<ul>
<li><strong>SYN queue</strong> (חצי פתוחים, state <code>SYN_RECV</code>): הגודל נקבע ב-<code>net.ipv4.tcp_max_syn_backlog</code>. כשהוא מתמלא (SYN flood), <code>tcp_syncookies=1</code> מאפשר ל-kernel לענות בלי לשמור state.</li>
<li><strong>Accept queue</strong> (חיבורים שהושלמו ומחכים שהאפליקציה תקרא ל-<code>accept()</code>): הגודל הוא <code>min(ה-backlog שהועבר ל-listen(), net.core.somaxconn)</code>. ה-<code>somaxconn</code> היה 128 במשך שנים, והפך ל-4096 ב-kernel 5.4.</li>
</ul>
<p>אם האפליקציה איטית ב-<code>accept()</code> (event loop חסום, GC pause), ה-accept queue מתמלא וה-kernel זורק את ה-ACK האחרון. ה-client חושב שהוא מחובר; ה-request הראשון שלו נתקע ועובר retransmit. רואים את זה כ-counter, לא כשורת לוג:</p>
<pre>$ nstat -az | grep -i listen
TcpExtListenOverflows           18342    0.0
TcpExtListenDrops               18342    0.0
$ ss -ltn 'sport = :8080'
State   Recv-Q  Send-Q  Local Address:Port
LISTEN  4097    4096    0.0.0.0:8080        &lt;- Recv-Q = queue length now, Send-Q = max</pre>
<blockquote>⚠️ טיפ לפרודקשן: על socket במצב LISTEN, <code>Recv-Q</code> שקרוב ל-<code>Send-Q</code> אומר שה-accept queue מלא. הגדלת <code>somaxconn</code> קונה מרווח ל-bursts, אבל התיקון האמיתי הוא אפליקציה שעושה accept מהר יותר (יותר workers, בלי חסימות בלולאת ה-accept).</blockquote>`
      }
    },
    {
      h: { en: "Sequence numbers, windows and congestion control", he: "Sequence numbers, windows ו-congestion control" },
      body: {
        en: `<p>Every byte has a sequence number; the receiver ACKs "next byte I expect". Two windows limit how much can be in flight without an ACK, and the sender uses the <strong>smaller</strong> of the two:</p>
<ul>
<li><strong>Receive window (rwnd)</strong> - flow control. "My buffer has 3 MB free." Window scaling (up to x2^14) allows windows up to 1 GB. A zero window means the receiving app isn't reading: the sender stalls.</li>
<li><strong>Congestion window (cwnd)</strong> - the sender's own guess at what the network can take. Starts at 10 segments (~14 KB, RFC 6928), doubles every RTT in <strong>slow start</strong>, then grows more carefully.</li>
</ul>
<p>Throughput is capped at <code>window / RTT</code>. The <strong>bandwidth-delay product</strong> tells you the buffer you need: 1 Gbps x 100 ms = 12.5 MB in flight. With a 64 KB window on that path you'd get ~5 Mbps no matter how fat the pipe is. That's the classic "cross-region copy is weirdly slow" bug.</p>
<table>
<tr><th>Algorithm</th><th>Signal</th><th>Behavior</th></tr>
<tr><td><strong>CUBIC</strong> (Linux default)</td><td>Packet loss</td><td>Grows cwnd along a cubic curve, cuts it by 30% on loss. Fills buffers until they overflow (bufferbloat), suffers on lossy links.</td></tr>
<tr><td><strong>BBR</strong> (Google, 2016)</td><td>Measured bandwidth + min RTT</td><td>Paces at the estimated bottleneck rate instead of waiting for loss. Big wins on long, lossy paths (Google reported YouTube throughput gains and lower RTT). Can be unfair to CUBIC flows sharing a link.</td></tr>
</table>
<pre>$ sysctl net.ipv4.tcp_congestion_control
net.ipv4.tcp_congestion_control = cubic
# enable BBR (kernel 4.9+), usually paired with the fq qdisc
sysctl -w net.core.default_qdisc=fq
sysctl -w net.ipv4.tcp_congestion_control=bbr</pre>
<blockquote>💡 Real world: CDNs and video platforms run BBR on their edge servers because the last mile (mobile, Wi-Fi) is lossy. Inside a datacenter with sub-millisecond RTTs the choice matters much less.</blockquote>`,
        he: `<p>לכל בייט יש sequence number; הצד המקבל שולח ACK עם "הבייט הבא שאני מצפה לו". שני windows מגבילים כמה דאטה יכול להיות באוויר בלי ACK, והשולח משתמש ב<strong>קטן</strong> מביניהם:</p>
<ul>
<li><strong>Receive window (rwnd)</strong> - flow control. "יש לי 3MB פנויים ב-buffer." Window scaling (עד x2^14) מאפשר windows של עד 1GB. Zero window אומר שהאפליקציה המקבלת לא קוראת: השולח נעצר.</li>
<li><strong>Congestion window (cwnd)</strong> - ההערכה של השולח עצמו כמה הרשת מסוגלת לקבל. מתחיל ב-10 segments (כ-14KB, RFC 6928), מוכפל כל RTT ב-<strong>slow start</strong>, ואז גדל בזהירות.</li>
</ul>
<p>ה-throughput חסום ב-<code>window / RTT</code>. ה-<strong>bandwidth-delay product</strong> אומר לך איזה buffer צריך: 1Gbps כפול 100ms = 12.5MB באוויר. עם window של 64KB על המסלול הזה תקבל כ-5Mbps, לא משנה כמה הצינור רחב. זה הבאג הקלאסי של "העתקה בין regions איטית בצורה מוזרה".</p>
<table>
<tr><th>אלגוריתם</th><th>סיגנל</th><th>התנהגות</th></tr>
<tr><td><strong>CUBIC</strong> (ברירת המחדל ב-Linux)</td><td>Packet loss</td><td>מגדיל את ה-cwnd לפי עקומה קובית, וחותך 30% כשיש loss. ממלא buffers עד שהם עולים על גדותיהם (bufferbloat), וסובל בקווים עם loss.</td></tr>
<tr><td><strong>BBR</strong> (Google, 2016)</td><td>Bandwidth נמדד + RTT מינימלי</td><td>שולח בקצב של צוואר הבקבוק המוערך במקום לחכות ל-loss. רווח גדול במסלולים ארוכים עם loss (Google דיווחו על שיפור ב-throughput וב-RTT ב-YouTube). יכול להיות לא הוגן כלפי זרמי CUBIC שחולקים איתו קו.</td></tr>
</table>
<pre>$ sysctl net.ipv4.tcp_congestion_control
net.ipv4.tcp_congestion_control = cubic
# enable BBR (kernel 4.9+), usually paired with the fq qdisc
sysctl -w net.core.default_qdisc=fq
sysctl -w net.ipv4.tcp_congestion_control=bbr</pre>
<blockquote>💡 מהשטח: CDNs ופלטפורמות וידאו מריצים BBR על שרתי ה-edge שלהם כי ה-last mile (סלולר, Wi-Fi) מלא ב-loss. בתוך data center עם RTT של פחות ממילישנייה, הבחירה משנה הרבה פחות.</blockquote>`
      }
    },
    {
      h: { en: "Retransmits, RTO, Nagle and delayed ACK", he: "Retransmits, RTO, Nagle ו-delayed ACK" },
      body: {
        en: `<p>Lost segments are recovered two ways:</p>
<ul>
<li><strong>Fast retransmit</strong>: three duplicate ACKs (or SACK blocks) tell the sender exactly what's missing; it resends immediately, costing about one RTT.</li>
<li><strong>RTO (retransmission timeout)</strong>: if nothing comes back, the sender waits RTO, which is computed from smoothed RTT, with a <strong>200 ms minimum on Linux</strong> and 1 s initial value, and <strong>doubles on every retry</strong>. A lost SYN costs 1 s, then 2 s, then 4 s... This is why one dropped packet turns a 5 ms call into a 1-second or 3-second p99 outlier.</li>
</ul>
<p>With <code>tcp_retries2=15</code> (default), a connection to a dead peer with unacknowledged data is only declared dead after ~15 minutes. Apps need their own timeouts.</p>
<pre>$ netstat -s | grep -i retrans
    912384 segments retransmitted
    TCPLostRetransmit: 2211
    TCPSynRetrans: 4810
$ ss -ti dst 10.0.4.17
ESTAB 0 0 10.0.1.5:51522 10.0.4.17:5432
   cubic wscale:7,7 rto:204 rtt:3.1/0.8 cwnd:10 retrans:0/37 ...</pre>
<p><strong>Nagle's algorithm</strong> holds small writes until the previous segment is ACKed, to avoid sending 41-byte packets. <strong>Delayed ACK</strong> on the receiver waits up to ~40 ms (Linux) hoping to piggyback the ACK on a response. Together they deadlock briefly: the sender waits for an ACK, the receiver waits for more data, and every request gains ~40 ms. Fix: <code>TCP_NODELAY</code> on latency-sensitive sockets (most databases, Redis clients, gRPC and Go's net package already set it).</p>
<blockquote>💡 Real world: "every call to this service takes exactly 40 ms more than it should" is almost always Nagle + delayed ACK, typically on a client that writes the header and the body in two separate <code>write()</code> calls.</blockquote>`,
        he: `<p>segments שאבדו משוחזרים בשתי דרכים:</p>
<ul>
<li><strong>Fast retransmit</strong>: שלושה duplicate ACKs (או SACK blocks) אומרים לשולח בדיוק מה חסר; הוא שולח מחדש מיד, במחיר של בערך RTT אחד.</li>
<li><strong>RTO (retransmission timeout)</strong>: אם שום דבר לא חוזר, השולח מחכה RTO, שמחושב מה-RTT הממוצע, עם <strong>מינימום של 200ms ב-Linux</strong> וערך התחלתי של שנייה, ו<strong>מוכפל בכל ניסיון</strong>. SYN שאבד עולה שנייה, אחר כך 2, אחר כך 4... בגלל זה packet אחד שנזרק הופך קריאה של 5ms ל-outlier של שנייה או שלוש ב-p99.</li>
</ul>
<p>עם <code>tcp_retries2=15</code> (ברירת המחדל), חיבור ל-peer מת עם דאטה שלא קיבל ACK מוכרז מת רק אחרי כ-15 דקות. אפליקציות צריכות timeouts משלהן.</p>
<pre>$ netstat -s | grep -i retrans
    912384 segments retransmitted
    TCPLostRetransmit: 2211
    TCPSynRetrans: 4810
$ ss -ti dst 10.0.4.17
ESTAB 0 0 10.0.1.5:51522 10.0.4.17:5432
   cubic wscale:7,7 rto:204 rtt:3.1/0.8 cwnd:10 retrans:0/37 ...</pre>
<p><strong>האלגוריתם של Nagle</strong> מחזיק כתיבות קטנות עד שה-segment הקודם קיבל ACK, כדי לא לשלוח packets של 41 בייט. <strong>Delayed ACK</strong> בצד המקבל מחכה עד כ-40ms (ב-Linux) בתקווה להצמיד את ה-ACK לתשובה. ביחד הם נתקעים לרגע: השולח מחכה ל-ACK, המקבל מחכה לעוד דאטה, וכל request מקבל עוד כ-40ms. התיקון: <code>TCP_NODELAY</code> על sockets רגישים ל-latency (רוב הדאטהבייסים, clients של Redis, gRPC וה-net package של Go כבר מגדירים את זה).</p>
<blockquote>💡 מהשטח: "כל קריאה לשירות הזה לוקחת בדיוק 40ms יותר ממה שצריך" זה כמעט תמיד Nagle + delayed ACK, בדרך כלל ב-client שכותב את ה-header ואת ה-body בשתי קריאות <code>write()</code> נפרדות.</blockquote>`
      }
    },
    {
      h: { en: "Connection states that page you: TIME_WAIT and CLOSE_WAIT", he: "ה-states שמעירים אותך: TIME_WAIT ו-CLOSE_WAIT" },
      body: {
        en: `<p>Closing is a four-way exchange (FIN, ACK, FIN, ACK). The two states that matter in production:</p>
<table>
<tr><th>State</th><th>Who has it</th><th>What it means</th><th>When it's a problem</th></tr>
<tr><td><code>TIME_WAIT</code></td><td>The side that closed <strong>first</strong></td><td>Normal. Kept for 2xMSL (hard-coded <strong>60 s</strong> on Linux) so stray old segments can't corrupt a new connection with the same 4-tuple.</td><td>Tens of thousands on a client that opens a new connection per request to the same destination: it runs out of source ports.</td></tr>
<tr><td><code>CLOSE_WAIT</code></td><td>The side that received a FIN</td><td>The peer closed; <strong>your app hasn't called close()</strong> yet.</td><td>Always a bug if it grows: a connection or file-descriptor leak in your code. It never times out by itself.</td></tr>
</table>
<pre>$ ss -s
Total: 31204
TCP:   29877 (estab 412, closed 28950, orphaned 3, timewait 28944)

$ ss -tan state close-wait | awk '{print $4}' | sort | uniq -c | sort -rn | head -3
   1893 10.0.1.5:8080
$ ss -tanp state close-wait | head -2
Recv-Q Send-Q Local Address:Port  Peer Address:Port  Process
1      0      10.0.1.5:8080       10.0.7.21:44310    users:(("java",pid=4121,fd=873))</pre>
<p><strong>Ephemeral port exhaustion</strong>: a connection is unique by (src IP, src port, dst IP, dst port). The default range <code>net.ipv4.ip_local_port_range = 32768 60999</code> gives ~28k ports <em>per destination IP:port</em>. At 500 new connections/s to one backend, with each port stuck 60 s in TIME_WAIT, you need 30,000 ports: you're out. Symptoms: <code>connect: cannot assign requested address</code> (EADDRNOTAVAIL).</p>
<blockquote>⚠️ Production tip: the fix is <strong>connection pooling / keep-alive</strong>, not kernel hacks. <code>tcp_tw_reuse=1</code> (safe for outgoing connections, needs timestamps) and widening the port range help. Never look for <code>tcp_tw_recycle</code> - it broke clients behind NAT and was removed in kernel 4.12.</blockquote>`,
        he: `<p>סגירה היא החלפה של ארבעה צעדים (FIN, ACK, FIN, ACK). שני ה-states שחשובים בפרודקשן:</p>
<table>
<tr><th>State</th><th>אצל מי</th><th>מה זה אומר</th><th>מתי זו בעיה</th></tr>
<tr><td><code>TIME_WAIT</code></td><td>הצד שסגר <strong>ראשון</strong></td><td>תקין. נשמר 2xMSL (קבוע של <strong>60 שניות</strong> ב-Linux) כדי ש-segments ישנים שהתעכבו לא ישבשו חיבור חדש עם אותו 4-tuple.</td><td>עשרות אלפים על client שפותח חיבור חדש לכל request לאותו יעד: נגמרים לו ה-source ports.</td></tr>
<tr><td><code>CLOSE_WAIT</code></td><td>הצד שקיבל FIN</td><td>הצד השני סגר; <strong>האפליקציה שלך עוד לא קראה ל-close()</strong>.</td><td>תמיד באג אם זה גדל: דליפה של חיבורים או file descriptors בקוד. זה לעולם לא עושה timeout לבד.</td></tr>
</table>
<pre>$ ss -s
Total: 31204
TCP:   29877 (estab 412, closed 28950, orphaned 3, timewait 28944)

$ ss -tan state close-wait | awk '{print $4}' | sort | uniq -c | sort -rn | head -3
   1893 10.0.1.5:8080
$ ss -tanp state close-wait | head -2
Recv-Q Send-Q Local Address:Port  Peer Address:Port  Process
1      0      10.0.1.5:8080       10.0.7.21:44310    users:(("java",pid=4121,fd=873))</pre>
<p><strong>Ephemeral port exhaustion</strong>: חיבור ייחודי לפי (src IP, src port, dst IP, dst port). הטווח הדיפולטי <code>net.ipv4.ip_local_port_range = 32768 60999</code> נותן כ-28 אלף ports <em>לכל IP:port של יעד</em>. ב-500 חיבורים חדשים בשנייה ל-backend אחד, כשכל port תקוע 60 שניות ב-TIME_WAIT, צריך 30,000 ports: נגמר. הסימפטום: <code>connect: cannot assign requested address</code> (EADDRNOTAVAIL).</p>
<blockquote>⚠️ טיפ לפרודקשן: התיקון הוא <strong>connection pooling / keep-alive</strong>, לא האקים ב-kernel. <code>tcp_tw_reuse=1</code> (בטוח לחיבורים יוצאים, דורש timestamps) והרחבת טווח ה-ports עוזרים. אל תחפש את <code>tcp_tw_recycle</code> - הוא שבר clients מאחורי NAT והוסר ב-kernel 4.12.</blockquote>`
      }
    },
    {
      h: { en: "Keepalives vs idle timeouts on load balancers and NATs", he: "Keepalives מול idle timeouts ב-load balancers וב-NATs" },
      body: {
        en: `<p>Every stateful box in the path (LB, NAT gateway, firewall, conntrack) forgets idle connections after a timeout - usually <strong>without telling either side</strong>. The next packet gets a RST or silently vanishes.</p>
<table>
<tr><th>Box</th><th>Default idle timeout</th></tr>
<tr><td>AWS ALB</td><td>60 s (configurable 1-4000 s)</td></tr>
<tr><td>AWS NLB (TCP)</td><td>350 s (configurable)</td></tr>
<tr><td>AWS NAT Gateway</td><td>350 s</td></tr>
<tr><td>Azure Load Balancer / NAT</td><td>4 min (configurable up to 30 / 120 min)</td></tr>
<tr><td>Linux TCP keepalive</td><td>first probe after <strong>7200 s</strong> (2 hours!), then 9 probes 75 s apart</td></tr>
</table>
<p>Two rules keep you out of trouble:</p>
<ol>
<li><strong>Backend keep-alive timeout &gt; LB idle timeout.</strong> If Node.js closes idle keep-alive sockets after 5 s (its default) but the ALB keeps them for 60 s, the ALB will sometimes send a request on a socket the backend just closed: random <strong>502s</strong>. Set the server's keep-alive to e.g. 65 s.</li>
<li><strong>Long-lived idle connections need keepalives shorter than the smallest timeout in the path.</strong> A DB connection pool behind a NAT gateway with the default 2-hour TCP keepalive will find half its connections dead after a quiet weekend. Set <code>tcp_keepalive_time</code> (or the driver's keepalive) to ~60-300 s.</li>
</ol>
<pre># tcpdump: show only SYN, FIN and RST packets to see connection churn and resets
tcpdump -ni eth0 'tcp[tcpflags] &amp; (tcp-syn|tcp-fin|tcp-rst) != 0 and port 443'
# flags in output: [S] SYN, [S.] SYN-ACK, [.] ACK, [P.] PSH-ACK, [F.] FIN, [R] RST</pre>`,
        he: `<p>כל קופסה stateful במסלול (LB, NAT gateway, firewall, conntrack) שוכחת חיבורים שקטים אחרי timeout - בדרך כלל <strong>בלי להגיד לאף צד</strong>. ה-packet הבא מקבל RST או פשוט נעלם.</p>
<table>
<tr><th>קופסה</th><th>Idle timeout דיפולטי</th></tr>
<tr><td>AWS ALB</td><td>60 שניות (ניתן להגדרה, 1-4000)</td></tr>
<tr><td>AWS NLB (TCP)</td><td>350 שניות (ניתן להגדרה)</td></tr>
<tr><td>AWS NAT Gateway</td><td>350 שניות</td></tr>
<tr><td>Azure Load Balancer / NAT</td><td>4 דקות (ניתן להגדרה עד 30 / 120 דקות)</td></tr>
<tr><td>Linux TCP keepalive</td><td>probe ראשון אחרי <strong>7200 שניות</strong> (שעתיים!), ואז 9 probes בהפרש של 75 שניות</td></tr>
</table>
<p>שני כללים ישאירו אותך מחוץ לצרות:</p>
<ol>
<li><strong>ה-keep-alive timeout של ה-backend גדול מה-idle timeout של ה-LB.</strong> אם Node.js סוגר keep-alive sockets שקטים אחרי 5 שניות (ברירת המחדל שלו) אבל ה-ALB מחזיק אותם 60 שניות, ה-ALB ישלח מדי פעם request על socket שה-backend בדיוק סגר: <strong>502</strong> אקראיים. תגדיר את ה-keep-alive של השרת ל-65 שניות למשל.</li>
<li><strong>חיבורים ארוכים ושקטים צריכים keepalive קצר מה-timeout הכי קטן במסלול.</strong> Connection pool לדאטהבייס מאחורי NAT gateway עם keepalive דיפולטי של שעתיים ימצא חצי מהחיבורים שלו מתים אחרי סופ"ש שקט. תגדיר <code>tcp_keepalive_time</code> (או את ה-keepalive של ה-driver) לכ-60-300 שניות.</li>
</ol>
<pre># tcpdump: show only SYN, FIN and RST packets to see connection churn and resets
tcpdump -ni eth0 'tcp[tcpflags] &amp; (tcp-syn|tcp-fin|tcp-rst) != 0 and port 443'
# flags in output: [S] SYN, [S.] SYN-ACK, [.] ACK, [P.] PSH-ACK, [F.] FIN, [R] RST</pre>`
      }
    }
  ],
  diagram: `Client                                   Server (LISTEN)
  | ---- SYN seq=x ---------------------->  | -> SYN queue  (SYN_RECV)
  | <--- SYN-ACK seq=y ack=x+1 -----------  |
  | ---- ACK ack=y+1 -------------------->  | -> accept queue -> app accept()
  |          ESTABLISHED  (data, ACKs, rwnd, cwnd)
  | ---- FIN ---------------------------->  |  server: CLOSE_WAIT (until app close())
  | <--- ACK ----------------------------   |
  | <--- FIN ----------------------------   |  server: LAST_ACK
  | ---- ACK ---------------------------->  |  CLOSED
  client: TIME_WAIT 60s  (whoever closes first waits)`,
  handsOn: [
    { cmd: "ss -s && ss -tan | awk 'NR>1 {print $1}' | sort | uniq -c | sort -rn", what: { en: "Summary plus a count of connections per state. Thousands of TIME-WAIT = no connection reuse; growing CLOSE-WAIT = your app leaks sockets.", he: "סיכום וספירה של חיבורים לפי state. אלפי TIME-WAIT = אין שימוש חוזר בחיבורים; CLOSE-WAIT שגדל = האפליקציה שלך מדליפה sockets." } },
    { cmd: "ss -tanp state established '( dport = :5432 )'", what: { en: "Which processes hold connections to Postgres, and how many. Compare with the pool size you think you configured.", he: "אילו processes מחזיקים חיבורים ל-Postgres, וכמה. תשווה לגודל ה-pool שאתה חושב שהגדרת." } },
    { cmd: "netstat -s | grep -iE 'retrans|listen|overflow'", what: { en: "Retransmit and accept-queue overflow counters. Run twice a minute apart: the delta is what matters, not the absolute number.", he: "counters של retransmits ו-overflow של ה-accept queue. תריץ פעמיים בהפרש של דקה: הדלתא היא מה שחשוב, לא המספר המוחלט." } },
    { cmd: "sysctl net.core.somaxconn net.ipv4.ip_local_port_range net.ipv4.tcp_keepalive_time net.ipv4.tcp_congestion_control", what: { en: "The four TCP knobs you check first on any box with connection trouble.", he: "ארבעת הכפתורים של TCP שבודקים ראשונים על כל מכונה עם בעיות חיבור." } },
    { cmd: "sudo tcpdump -ni any 'tcp[tcpflags] & (tcp-rst) != 0' -c 50", what: { en: "Capture the first 50 RST packets: who is resetting connections, and to which port.", he: "ללכוד את 50 ה-packets הראשונים עם RST: מי מאפס חיבורים, ולאיזה port." } }
  ],
  mnemonic: {
    en: "\"TIME_WAIT is the closer's polite minute; CLOSE_WAIT is your code forgetting to hang up.\" And for timeouts: \"backend outlives the LB, keepalive beats the NAT.\"",
    he: "\"TIME_WAIT זו הדקה המנומסת של מי שסגר; CLOSE_WAIT זה הקוד שלך ששכח לנתק.\" ול-timeouts: \"ה-backend מחזיק יותר מה-LB, ה-keepalive מקדים את ה-NAT.\""
  },
  pitfalls: [
    { en: "Treating TIME_WAIT as a bug and 'fixing' it with tcp_tw_recycle or SO_LINGER=0 resets. It's normal; the real fix is reusing connections.", he: "להתייחס ל-TIME_WAIT כבאג ו'לתקן' אותו עם tcp_tw_recycle או resets עם SO_LINGER=0. זה תקין; התיקון האמיתי הוא שימוש חוזר בחיבורים." },
    { en: "Backend keep-alive timeout shorter than the LB idle timeout - produces rare, unreproducible 502s under low traffic.", he: "Keep-alive timeout של ה-backend קצר מה-idle timeout של ה-LB - מייצר 502 נדירים שאי אפשר לשחזר בתעבורה נמוכה." },
    { en: "Relying on the default 2-hour TCP keepalive for DB pools behind NAT or LBs that drop idle flows after 350 s or 4 min.", he: "לסמוך על keepalive דיפולטי של שעתיים ב-pools של DB מאחורי NAT או LBs שזורקים חיבורים שקטים אחרי 350 שניות או 4 דקות." },
    { en: "Ignoring CLOSE_WAIT growth: it never expires on its own and ends with 'too many open files'.", he: "להתעלם מ-CLOSE_WAIT שגדל: הוא אף פעם לא פג לבד ונגמר ב-'too many open files'." }
  ],
  interview: [
    {
      q: { en: "A server has 20,000 sockets in CLOSE_WAIT. What's happening and how do you find the cause?", he: "על שרת יש 20,000 sockets ב-CLOSE_WAIT. מה קורה ואיך מוצאים את הסיבה?" },
      a: { en: "The peers closed their side (sent FIN) but our application never called close() on those sockets - a leak, often a missing close/finally on an error path or a client that isn't returned to the pool. Use ss -tanp state close-wait to find the process and the remote endpoint, then a thread dump/profiler or lsof on that pid to see where the sockets were created. Kernel tuning won't help; CLOSE_WAIT has no timeout.", he: "הצד השני סגר (שלח FIN) אבל האפליקציה שלנו אף פעם לא קראה ל-close() על ה-sockets האלה - דליפה, הרבה פעמים close/finally חסר במסלול שגיאה או client שלא מוחזר ל-pool. משתמשים ב-ss -tanp state close-wait כדי למצוא את ה-process ואת היעד המרוחק, ואז thread dump/profiler או lsof על ה-pid כדי לראות איפה ה-sockets נוצרו. tuning של ה-kernel לא יעזור; ל-CLOSE_WAIT אין timeout." }
    },
    {
      q: { en: "Copying data between regions with 120 ms RTT maxes out at 40 Mbps on a 10 Gbps link. Why?", he: "העתקת דאטה בין regions עם RTT של 120ms נתקעת על 40Mbps בקו של 10Gbps. למה?" },
      a: { en: "Throughput is bounded by window / RTT. 40 Mbps x 0.12 s = ~600 KB in flight, so the effective window (receive buffer or cwnd) is ~600 KB. Filling 10 Gbps at 120 ms needs a ~150 MB bandwidth-delay product. Check net.ipv4.tcp_rmem/wmem max values and app-level buffer sizes, check for loss (CUBIC collapses on lossy long paths - BBR helps), or use parallel streams.", he: "ה-throughput חסום ב-window חלקי RTT. 40Mbps כפול 0.12 שניות = כ-600KB באוויר, אז ה-window האפקטיבי (receive buffer או cwnd) הוא כ-600KB. כדי למלא 10Gbps ב-120ms צריך bandwidth-delay product של כ-150MB. בודקים את ערכי ה-max של net.ipv4.tcp_rmem/wmem ואת גודל ה-buffers באפליקציה, בודקים loss (CUBIC קורס במסלולים ארוכים עם loss - BBR עוזר), או משתמשים ב-streams מקבילים." }
    },
    {
      q: { en: "Why do you sometimes see random 502s from an ALB at low traffic?", he: "למה רואים לפעמים 502 אקראיים מ-ALB דווקא בתעבורה נמוכה?" },
      a: { en: "The backend's keep-alive timeout is shorter than the ALB's 60 s idle timeout. The backend closes an idle connection at the same moment the ALB reuses it for a new request, so the ALB gets a RST/FIN and returns 502. Fix: backend keep-alive timeout above the LB idle timeout (e.g. 65 s for a 60 s ALB).", he: "ה-keep-alive timeout של ה-backend קצר מה-idle timeout של 60 שניות של ה-ALB. ה-backend סוגר חיבור שקט בדיוק ברגע שה-ALB משתמש בו ל-request חדש, אז ה-ALB מקבל RST/FIN ומחזיר 502. התיקון: keep-alive timeout ב-backend מעל ה-idle timeout של ה-LB (למשל 65 שניות מול ALB של 60)." }
    }
  ],
  quiz: [
    {
      q: { en: "Which side of a TCP connection ends up in TIME_WAIT?", he: "איזה צד של חיבור TCP מגיע ל-TIME_WAIT?" },
      options: [
        { en: "Always the server", he: "תמיד השרת" },
        { en: "The side that sent the first FIN (closed first)", he: "הצד ששלח את ה-FIN הראשון (סגר ראשון)" },
        { en: "The side that received the first FIN", he: "הצד שקיבל את ה-FIN הראשון" },
        { en: "Both sides, always", he: "שני הצדדים, תמיד" }
      ],
      answer: 1,
      explain: { en: "The active closer goes FIN_WAIT_1 -> FIN_WAIT_2 -> TIME_WAIT (60 s on Linux). The passive side goes CLOSE_WAIT -> LAST_ACK -> CLOSED.", he: "מי שסוגר באופן אקטיבי עובר FIN_WAIT_1 ואז FIN_WAIT_2 ואז TIME_WAIT (60 שניות ב-Linux). הצד הפסיבי עובר CLOSE_WAIT ואז LAST_ACK ואז CLOSED." }
    },
    {
      q: { en: "A growing number of CLOSE_WAIT sockets on your service most likely means:", he: "מספר גדל של sockets ב-CLOSE_WAIT על השירות שלך אומר כנראה:" },
      options: [
        { en: "The network is dropping packets", he: "הרשת זורקת packets" },
        { en: "somaxconn is too low", he: "ה-somaxconn נמוך מדי" },
        { en: "Your application isn't closing sockets after the peer closed them", he: "האפליקציה שלך לא סוגרת sockets אחרי שהצד השני סגר אותם" },
        { en: "The load balancer idle timeout is too long", he: "ה-idle timeout של ה-load balancer ארוך מדי" }
      ],
      answer: 2,
      explain: { en: "CLOSE_WAIT = FIN received, close() not yet called by the app. It's an application leak and never times out by itself.", he: "CLOSE_WAIT = התקבל FIN, והאפליקציה עוד לא קראה ל-close(). זו דליפה באפליקציה, והיא אף פעם לא עושה timeout לבד." }
    },
    {
      q: { en: "A client opens a new connection per request to one backend IP:port at 600/s and starts failing with 'cannot assign requested address'. Best fix?", he: "client פותח חיבור חדש לכל request ל-IP:port אחד של backend בקצב 600 בשנייה ומתחיל להיכשל עם 'cannot assign requested address'. מה התיקון הכי טוב?" },
      options: [
        { en: "Enable tcp_tw_recycle", he: "להפעיל tcp_tw_recycle" },
        { en: "Increase somaxconn on the backend", he: "להגדיל את somaxconn ב-backend" },
        { en: "Switch the congestion control to BBR", he: "להחליף את ה-congestion control ל-BBR" },
        { en: "Use connection pooling / HTTP keep-alive", he: "להשתמש ב-connection pooling / HTTP keep-alive" }
      ],
      answer: 3,
      explain: { en: "600/s x 60 s TIME_WAIT = 36,000 ports needed, above the ~28k default ephemeral range. Reusing connections removes the churn. tcp_tw_recycle was removed in 4.12; somaxconn and BBR are unrelated.", he: "600 בשנייה כפול 60 שניות TIME_WAIT = צריך 36,000 ports, מעל טווח ה-ephemeral הדיפולטי של כ-28 אלף. שימוש חוזר בחיבורים מבטל את ה-churn. tcp_tw_recycle הוסר ב-4.12; somaxconn ו-BBR לא קשורים." }
    },
    {
      q: { en: "Your Node.js backend sits behind an AWS ALB with the default idle timeout. What should the Node server's keep-alive timeout be?", he: "ה-backend שלך ב-Node.js יושב מאחורי AWS ALB עם idle timeout דיפולטי. מה צריך להיות ה-keep-alive timeout של שרת ה-Node?" },
      options: [
        { en: "5 s (Node's default)", he: "5 שניות (ברירת המחדל של Node)" },
        { en: "Longer than 60 s, e.g. 65 s", he: "יותר מ-60 שניות, למשל 65" },
        { en: "Exactly 60 s", he: "בדיוק 60 שניות" },
        { en: "0 - disable keep-alive", he: "0 - לבטל keep-alive" }
      ],
      answer: 1,
      explain: { en: "The backend must not close an idle connection before the LB does, otherwise the LB can reuse a socket that is being closed and return 502. Equal values still race.", he: "ה-backend לא אמור לסגור חיבור שקט לפני שה-LB סוגר אותו, אחרת ה-LB יכול להשתמש ב-socket שבדיוק נסגר ולהחזיר 502. ערכים שווים עדיין יוצרים race." }
    }
  ],
  related: ["net-osi-tcpip", "net-load-balancing", "net-troubleshooting", "linux-networking-commands", "net-nat-conntrack"]
});

/* --------------------------------------------------------- NAT & conntrack */
window.INFRA.lessons.push({
  id: "net-nat-conntrack",
  track: "networking",
  order: 21,
  icon: "🔀",
  level: 3,
  minutes: 15,
  title: { en: "NAT & conntrack: address rewriting and the table that remembers", he: "NAT ו-conntrack: שכתוב כתובות והטבלה שזוכרת" },
  tldr: {
    en: "NAT rewrites addresses (SNAT on the way out, DNAT on the way in) and must remember every flow in a connection-tracking table; both the table and the source ports are finite, and when either runs out packets are silently dropped.",
    he: "NAT משכתב כתובות (SNAT ביציאה, DNAT בכניסה) וחייב לזכור כל flow בטבלת connection tracking; גם הטבלה וגם ה-source ports מוגבלים, וכשאחד מהם נגמר packets נזרקים בשקט."
  },
  analogy: {
    en: "NAT is an office switchboard with one public phone number. When an employee calls out, the operator writes in a ledger 'line 4711 = Dana, calling the bank' and the bank only ever sees the office number. When the bank calls back on line 4711, the operator looks it up and connects Dana. The ledger is conntrack. If it fills up, or the operator runs out of line numbers for calls to the same bank, new calls just don't go through - and nobody hears a busy signal.",
    he: "NAT זו מרכזיה במשרד עם מספר טלפון ציבורי אחד. כשעובד מתקשר החוצה, המרכזנית רושמת בספר 'קו 4711 = דנה, מתקשרת לבנק', והבנק רואה רק את מספר המשרד. כשהבנק חוזר על קו 4711, המרכזנית בודקת בספר ומחברת את דנה. הספר הזה הוא conntrack. אם הוא מתמלא, או שנגמרים למרכזנית מספרי קווים לשיחות לאותו בנק, שיחות חדשות פשוט לא עוברות - ואף אחד לא שומע צליל תפוס."
  },
  sections: [
    {
      h: { en: "SNAT, DNAT and masquerade", he: "SNAT, DNAT ו-masquerade" },
      body: {
        en: `<p>NAT changes IP addresses (and usually ports) in packet headers, then reverses the change on replies:</p>
<ul>
<li><strong>SNAT</strong> (source NAT): rewrites the <em>source</em> on the way out. Private hosts share one or a few public IPs. Your home router, a cloud NAT Gateway, and Pods leaving a Kubernetes node all do this.</li>
<li><strong>Masquerade</strong>: SNAT where the new source is "whatever IP the outgoing interface has right now". Good for DHCP/dynamic IPs; slightly more CPU than SNAT to a fixed IP.</li>
<li><strong>DNAT</strong> (destination NAT): rewrites the <em>destination</em> on the way in. Port forwarding on a home router, a Kubernetes Service ClusterIP, a load balancer that sends traffic to a backend.</li>
</ul>
<pre># Linux router: masquerade everything from the LAN leaving eth0
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE
# port forward: public :8443 -> internal 192.168.1.20:443
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 8443 -j DNAT --to-destination 192.168.1.20:443</pre>
<p>SNAT happens in <code>POSTROUTING</code> (after the routing decision), DNAT in <code>PREROUTING</code> (before it, so routing sees the new destination). Only the <strong>first packet</strong> of a flow walks the NAT rules; the decision is stored in conntrack and every following packet - and every reply - is rewritten from that entry.</p>`,
        he: `<p>NAT משנה כתובות IP (ובדרך כלל גם ports) ב-headers של ה-packet, ואז הופך את השינוי בתשובות:</p>
<ul>
<li><strong>SNAT</strong> (source NAT): משכתב את ה-<em>source</em> ביציאה. hosts פרטיים חולקים IP ציבורי אחד או כמה. הראוטר בבית, NAT Gateway בענן, ו-Pods שיוצאים מ-node של Kubernetes - כולם עושים את זה.</li>
<li><strong>Masquerade</strong>: SNAT שבו ה-source החדש הוא "ה-IP שיש עכשיו לממשק היוצא". מתאים ל-DHCP ו-IPs דינמיים; קצת יותר CPU מ-SNAT ל-IP קבוע.</li>
<li><strong>DNAT</strong> (destination NAT): משכתב את ה-<em>destination</em> בכניסה. Port forwarding בראוטר הביתי, ClusterIP של Service ב-Kubernetes, load balancer ששולח תעבורה ל-backend.</li>
</ul>
<pre># Linux router: masquerade everything from the LAN leaving eth0
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE
# port forward: public :8443 -> internal 192.168.1.20:443
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 8443 -j DNAT --to-destination 192.168.1.20:443</pre>
<p>SNAT קורה ב-<code>POSTROUTING</code> (אחרי החלטת ה-routing), ו-DNAT ב-<code>PREROUTING</code> (לפניה, כדי שה-routing יראה את היעד החדש). רק ה-<strong>packet הראשון</strong> של flow עובר בחוקי ה-NAT; ההחלטה נשמרת ב-conntrack וכל packet שאחריו - וכל תשובה - משוכתב לפי הרשומה הזו.</p>`
      }
    },
    {
      h: { en: "Ports are the real limit: home routers and cloud NAT gateways", he: "ה-ports הם המגבלה האמיתית: ראוטרים ביתיים ו-NAT gateways בענן" },
      body: {
        en: `<p>After SNAT, many internal flows share one public IP, so the NAT tells them apart by <strong>source port</strong>. A flow is unique by the 5-tuple (protocol, src IP, src port, dst IP, dst port), so a single public IP can hold ~64k concurrent flows <strong>per destination IP:port</strong>. Thousands of different destinations: no problem. Everything going to one API endpoint (one S3 VIP, one third-party IP): that's where it breaks.</p>
<table>
<tr><th>NAT</th><th>Port budget</th><th>Signal when exhausted</th></tr>
<tr><td>AWS NAT Gateway</td><td>55,000 concurrent connections per unique destination (IP, port, protocol) per NAT IP; add up to 8 IPs (440k)</td><td>CloudWatch <code>ErrorPortAllocation</code> &gt; 0, <code>PacketsDropCount</code></td></tr>
<tr><td>GCP Cloud NAT</td><td>64,512 ports per NAT IP, split across VMs (default 64 ports per VM!)</td><td>Logs with <code>OUT_OF_RESOURCES</code>, dropped_sent_packets metric</td></tr>
<tr><td>Azure NAT Gateway</td><td>64,512 SNAT ports per public IP, up to 16 IPs</td><td>SNAT connection count failed metric</td></tr>
</table>
<p>Cost reminder (AWS us-east-1): ~$0.045/hour per NAT Gateway + ~$0.045 per GB processed. A fleet pulling 50 TB/month of images through NAT pays ~$2,250 just in processing.</p>
<blockquote>💡 Real world: on GKE, the default 64 ports per VM is a classic outage. A node with 30 Pods all calling the same payment API hits the limit and connections time out while the rest of the cluster looks healthy. Raise <code>minPortsPerVm</code> or enable dynamic port allocation. On AWS, the symptom is <code>ErrorPortAllocation</code> climbing during a traffic spike to one SaaS endpoint.</blockquote>`,
        he: `<p>אחרי SNAT, הרבה flows פנימיים חולקים IP ציבורי אחד, אז ה-NAT מבדיל ביניהם לפי <strong>source port</strong>. Flow ייחודי לפי ה-5-tuple (protocol, src IP, src port, dst IP, dst port), אז IP ציבורי אחד יכול להחזיק כ-64 אלף flows במקביל <strong>לכל IP:port של יעד</strong>. אלפי יעדים שונים: אין בעיה. הכל הולך ל-endpoint אחד של API (VIP אחד של S3, IP אחד של צד שלישי): שם זה נשבר.</p>
<table>
<tr><th>NAT</th><th>תקציב ports</th><th>הסיגנל כשנגמר</th></tr>
<tr><td>AWS NAT Gateway</td><td>55,000 חיבורים במקביל לכל יעד ייחודי (IP, port, protocol) לכל IP של NAT; אפשר להוסיף עד 8 IPs (440 אלף)</td><td>ב-CloudWatch: <code>ErrorPortAllocation</code> מעל 0, <code>PacketsDropCount</code></td></tr>
<tr><td>GCP Cloud NAT</td><td>64,512 ports לכל IP של NAT, מחולקים בין ה-VMs (ברירת מחדל 64 ports ל-VM!)</td><td>לוגים עם <code>OUT_OF_RESOURCES</code>, metric של dropped_sent_packets</td></tr>
<tr><td>Azure NAT Gateway</td><td>64,512 SNAT ports לכל IP ציבורי, עד 16 IPs</td><td>metric של SNAT connection count במצב failed</td></tr>
</table>
<p>תזכורת עלויות (AWS us-east-1): כ-$0.045 לשעה לכל NAT Gateway ועוד כ-$0.045 לכל GB שעובר. צי שמושך 50TB בחודש של images דרך NAT משלם כ-$2,250 רק על processing.</p>
<blockquote>💡 מהשטח: ב-GKE, ברירת המחדל של 64 ports ל-VM היא תקלה קלאסית. node עם 30 Pods שכולם קוראים לאותו API של תשלומים מגיע לגבול, וחיבורים עושים timeout בזמן ששאר ה-cluster נראה בריא. מגדילים את <code>minPortsPerVm</code> או מפעילים dynamic port allocation. ב-AWS הסימפטום הוא <code>ErrorPortAllocation</code> שמטפס בזמן spike של תעבורה ל-endpoint אחד של SaaS.</blockquote>`
      }
    },
    {
      h: { en: "Linux conntrack: the table behind every stateful rule", he: "conntrack ב-Linux: הטבלה שמאחורי כל חוק stateful" },
      body: {
        en: `<p>Netfilter's <strong>conntrack</strong> records every flow the kernel sees when NAT or stateful filtering (<code>-m state</code>, <code>ESTABLISHED,RELATED</code>, Security-Group-like rules) is in use. Each entry holds both directions of the tuple, the NAT mapping and a timeout.</p>
<pre>$ conntrack -L -p tcp --dport 443 | head -2
tcp 6 431999 ESTABLISHED src=10.244.3.17 dst=10.96.0.10 sport=40112 dport=443 \\
    src=10.244.7.9 dst=10.244.3.17 sport=8443 dport=40112 [ASSURED] mark=0 use=1
$ cat /proc/sys/net/netfilter/nf_conntrack_count /proc/sys/net/netfilter/nf_conntrack_max
262131
262144</pre>
<p>The second tuple shows the DNAT: the Pod talked to <code>10.96.0.10:443</code> (a Service) and the reply really comes from <code>10.244.7.9:8443</code>. When the count hits the max:</p>
<pre>$ dmesg -T | tail -3
[Fri Nov 14 03:12:07 2026] nf_conntrack: nf_conntrack: table full, dropping packet
[Fri Nov 14 03:12:07 2026] nf_conntrack: nf_conntrack: table full, dropping packet</pre>
<p>New flows are dropped (existing ones keep working), so you get <strong>intermittent connect timeouts</strong> for everything on that node, including health checks and DNS.</p>
<ul>
<li><code>nf_conntrack_max</code> defaults from RAM; kube-proxy raises it to <code>max(32768 x CPU cores, 131072)</code>. Each entry is ~300 bytes, so 1M entries = ~300 MB of kernel memory - cheap on a big node.</li>
<li>Timeouts matter as much as size: <code>nf_conntrack_tcp_timeout_established</code> is 432000 s (5 days!) by default (kube-proxy sets 86400), <code>tcp_timeout_time_wait</code> 120 s, UDP 30 s (120 s for "streams").</li>
<li><code>conntrack -S</code> shows per-CPU counters: <code>drop</code> and <code>early_drop</code> = table full, <code>insert_failed</code> = races (see DNS below).</li>
</ul>
<blockquote>⚠️ Production tip: alert on <code>node_nf_conntrack_entries / node_nf_conntrack_entries_limit &gt; 0.8</code> (node_exporter exposes both). The usual cause of a sudden spike is a client opening a short connection per request (or a UDP metrics/DNS storm), not "too little memory".</blockquote>`,
        he: `<p>ה-<strong>conntrack</strong> של Netfilter רושם כל flow שה-kernel רואה כשיש NAT או סינון stateful (<code>-m state</code>, <code>ESTABLISHED,RELATED</code>, חוקים בסגנון Security Group). כל רשומה מחזיקה את שני הכיוונים של ה-tuple, את מיפוי ה-NAT ו-timeout.</p>
<pre>$ conntrack -L -p tcp --dport 443 | head -2
tcp 6 431999 ESTABLISHED src=10.244.3.17 dst=10.96.0.10 sport=40112 dport=443 \\
    src=10.244.7.9 dst=10.244.3.17 sport=8443 dport=40112 [ASSURED] mark=0 use=1
$ cat /proc/sys/net/netfilter/nf_conntrack_count /proc/sys/net/netfilter/nf_conntrack_max
262131
262144</pre>
<p>ה-tuple השני מראה את ה-DNAT: ה-Pod דיבר עם <code>10.96.0.10:443</code> (Service), והתשובה בפועל מגיעה מ-<code>10.244.7.9:8443</code>. כשהספירה מגיעה למקסימום:</p>
<pre>$ dmesg -T | tail -3
[Fri Nov 14 03:12:07 2026] nf_conntrack: nf_conntrack: table full, dropping packet
[Fri Nov 14 03:12:07 2026] nf_conntrack: nf_conntrack: table full, dropping packet</pre>
<p>flows חדשים נזרקים (הקיימים ממשיכים לעבוד), אז מקבלים <strong>connect timeouts לסירוגין</strong> לכל מה שרץ על ה-node הזה, כולל health checks ו-DNS.</p>
<ul>
<li>ה-<code>nf_conntrack_max</code> נקבע כברירת מחדל לפי ה-RAM; kube-proxy מעלה אותו ל-<code>max(32768 x CPU cores, 131072)</code>. כל רשומה היא כ-300 בייט, אז מיליון רשומות = כ-300MB של זיכרון kernel - זול על node גדול.</li>
<li>ה-timeouts חשובים כמו הגודל: <code>nf_conntrack_tcp_timeout_established</code> הוא 432000 שניות (5 ימים!) כברירת מחדל (kube-proxy מגדיר 86400), <code>tcp_timeout_time_wait</code> הוא 120 שניות, ו-UDP הוא 30 שניות (120 ל-"streams").</li>
<li><code>conntrack -S</code> מראה counters לכל CPU: <code>drop</code> ו-<code>early_drop</code> = הטבלה מלאה, <code>insert_failed</code> = races (ראה DNS בהמשך).</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: תגדיר alert על <code>node_nf_conntrack_entries / node_nf_conntrack_entries_limit &gt; 0.8</code> (ה-node_exporter חושף את שניהם). הסיבה הרגילה ל-spike פתאומי היא client שפותח חיבור קצר לכל request (או סערת UDP של metrics/DNS), לא "חסר זיכרון".</blockquote>`
      }
    },
    {
      h: { en: "Kubernetes Services are DNAT, and the DNS 5-second race", he: "Services ב-Kubernetes הם DNAT, וה-race של 5 השניות ב-DNS" },
      body: {
        en: `<p>In iptables mode, kube-proxy implements every ClusterIP as a chain of DNAT rules with random selection:</p>
<pre>$ iptables -t nat -L KUBE-SVC-XPGD46QRK7WJZT7O -n
target                     prot  source     destination
KUBE-SEP-AB12...  all  --  0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.33333
KUBE-SEP-CD34...  all  --  0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.50000
KUBE-SEP-EF56...  all  --  0.0.0.0/0  0.0.0.0/0
$ iptables -t nat -L KUBE-SEP-AB12... -n
DNAT  tcp  --  0.0.0.0/0  0.0.0.0/0  tcp to:10.244.7.9:8443</pre>
<p>Consequences: the backend is chosen once per <strong>connection</strong> (long-lived gRPC/HTTP2 connections stick to one Pod), every Service flow uses a conntrack entry, and iptables rule evaluation is O(n) in the number of Services - which is why big clusters move to IPVS or eBPF (Cilium) dataplanes.</p>
<p><strong>The DNS race:</strong> glibc sends the A and AAAA queries in parallel from the <em>same UDP socket</em>. Both packets need a new conntrack entry with DNAT to a CoreDNS Pod at the same moment; one loses the insert race and is dropped (<code>insert_failed</code> goes up). The resolver waits its default <strong>5-second timeout</strong> and retries. Symptom: a small percentage of requests take exactly 5 s (or 10 s).</p>
<ul>
<li><strong>NodeLocal DNSCache</strong>: a DNS cache on every node, reached without DNAT, talking TCP upstream - the standard fix.</li>
<li><code>options single-request-reopen</code> (or <code>use-vc</code>) in the Pod's <code>dnsConfig</code> - glibc only; Alpine/musl ignores it.</li>
<li>Lower <code>ndots</code> (default 5) to cut the number of queries per lookup.</li>
</ul>
<blockquote>💡 Real world: "p99 latency spikes to exactly 5.0 s" in Kubernetes is the DNS conntrack race until proven otherwise. Check <code>conntrack -S | grep -o 'insert_failed=[0-9]*'</code> on the node.</blockquote>`,
        he: `<p>במצב iptables, kube-proxy מממש כל ClusterIP כשרשרת של חוקי DNAT עם בחירה אקראית:</p>
<pre>$ iptables -t nat -L KUBE-SVC-XPGD46QRK7WJZT7O -n
target                     prot  source     destination
KUBE-SEP-AB12...  all  --  0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.33333
KUBE-SEP-CD34...  all  --  0.0.0.0/0  0.0.0.0/0  statistic mode random probability 0.50000
KUBE-SEP-EF56...  all  --  0.0.0.0/0  0.0.0.0/0
$ iptables -t nat -L KUBE-SEP-AB12... -n
DNAT  tcp  --  0.0.0.0/0  0.0.0.0/0  tcp to:10.244.7.9:8443</pre>
<p>ההשלכות: ה-backend נבחר פעם אחת לכל <strong>חיבור</strong> (חיבורי gRPC/HTTP2 ארוכים נדבקים ל-Pod אחד), כל flow ל-Service תופס רשומה ב-conntrack, והערכת חוקי iptables היא O(n) במספר ה-Services - ולכן clusters גדולים עוברים ל-IPVS או ל-dataplane של eBPF (Cilium).</p>
<p><strong>ה-race של DNS:</strong> glibc שולח את שאילתות ה-A וה-AAAA במקביל מ<em>אותו UDP socket</em>. שני ה-packets צריכים רשומת conntrack חדשה עם DNAT ל-Pod של CoreDNS באותו רגע; אחד מפסיד ב-race של ה-insert ונזרק (<code>insert_failed</code> עולה). ה-resolver מחכה את ה-<strong>timeout הדיפולטי של 5 שניות</strong> ומנסה שוב. הסימפטום: אחוז קטן מה-requests לוקח בדיוק 5 שניות (או 10).</p>
<ul>
<li><strong>NodeLocal DNSCache</strong>: cache של DNS על כל node, שמגיעים אליו בלי DNAT ושמדבר TCP עם ה-upstream - התיקון הסטנדרטי.</li>
<li><code>options single-request-reopen</code> (או <code>use-vc</code>) ב-<code>dnsConfig</code> של ה-Pod - עובד רק עם glibc; Alpine/musl מתעלם מזה.</li>
<li>להוריד את <code>ndots</code> (ברירת מחדל 5) כדי לצמצם את מספר השאילתות לכל lookup.</li>
</ul>
<blockquote>💡 מהשטח: "ה-p99 latency קופץ לבדיוק 5.0 שניות" ב-Kubernetes זה ה-race של conntrack ב-DNS עד שיוכח אחרת. בודקים <code>conntrack -S | grep -o 'insert_failed=[0-9]*'</code> על ה-node.</blockquote>`
      }
    }
  ],
  diagram: `Pod 10.244.3.17:40112  --->  dst 10.96.0.10:443 (ClusterIP)
        |
   [PREROUTING / OUTPUT: KUBE-SERVICES -> KUBE-SVC -> KUBE-SEP]  DNAT -> 10.244.7.9:8443
        |                       conntrack entry created (both tuples)
        v
   leaving node to the Internet?  [POSTROUTING: MASQUERADE]  src -> node IP
        |
   VPC NAT Gateway  SNAT src -> 52.x.x.x:port   (~55-64k ports per dest IP:port)
        v
   api.partner.com:443`,
  handsOn: [
    { cmd: "cat /proc/sys/net/netfilter/nf_conntrack_count /proc/sys/net/netfilter/nf_conntrack_max", what: { en: "Current entries vs the limit. Above ~80% you're one traffic spike away from 'table full'.", he: "רשומות נוכחיות מול הגבול. מעל כ-80% אתה במרחק spike אחד מ-'table full'." } },
    { cmd: "sudo conntrack -S", what: { en: "Per-CPU stats: drop/early_drop mean the table overflowed, insert_failed points to the UDP/DNS race.", he: "סטטיסטיקות לכל CPU: drop/early_drop אומר שהטבלה עלתה על גדותיה, insert_failed מצביע על ה-race של UDP/DNS." } },
    { cmd: "sudo conntrack -L -o extended 2>/dev/null | awk '{print $3, $7}' | sort | uniq -c | sort -rn | head", what: { en: "Rough breakdown of entries by protocol and destination - find who is filling the table.", he: "פילוח גס של הרשומות לפי פרוטוקול ויעד - למצוא מי ממלא את הטבלה." } },
    { cmd: "sudo iptables -t nat -L KUBE-SERVICES -n | grep my-service", what: { en: "Find the DNAT chain kube-proxy built for a Service, then follow KUBE-SVC-* to the KUBE-SEP-* endpoints.", he: "למצוא את שרשרת ה-DNAT ש-kube-proxy בנה ל-Service, ואז לעקוב אחרי KUBE-SVC-* עד ל-endpoints ב-KUBE-SEP-*." } },
    { cmd: "aws cloudwatch get-metric-statistics --namespace AWS/NATGateway --metric-name ErrorPortAllocation --dimensions Name=NatGatewayId,Value=$NAT_ID --start-time 2026-11-13T00:00:00Z --end-time 2026-11-14T00:00:00Z --period 300 --statistics Sum", what: { en: "Non-zero means the NAT Gateway couldn't allocate a source port: you hit the per-destination limit.", he: "ערך שונה מאפס אומר שה-NAT Gateway לא הצליח להקצות source port: הגעת לגבול לכל יעד." } }
  ],
  mnemonic: {
    en: "\"SNAT leaves, DNAT arrives, conntrack remembers - and memory is finite.\" Plus: \"64k ports per destination, not per NAT.\"",
    he: "\"SNAT יוצא, DNAT נכנס, conntrack זוכר - והזיכרון סופי.\" ועוד: \"64 אלף ports לכל יעד, לא לכל NAT.\""
  },
  pitfalls: [
    { en: "Raising nf_conntrack_max without finding the client that opens a connection per request - you just move the cliff.", he: "להעלות את nf_conntrack_max בלי למצוא את ה-client שפותח חיבור לכל request - רק מזיזים את הצוק." },
    { en: "Sending all egress to one third-party endpoint through a single NAT IP and hitting the per-destination port limit; add NAT IPs or use PrivateLink.", he: "לשלוח את כל ה-egress ל-endpoint אחד של צד שלישי דרך IP אחד של NAT ולהגיע לגבול ה-ports לכל יעד; מוסיפים IPs ל-NAT או משתמשים ב-PrivateLink." },
    { en: "Blaming CoreDNS for exact 5-second delays when it's the conntrack insert race - deploy NodeLocal DNSCache.", he: "להאשים את CoreDNS בעיכובים של בדיוק 5 שניות כשזה ה-race של ה-insert ב-conntrack - פורסים NodeLocal DNSCache." },
    { en: "Expecting a Service to load-balance requests on a long-lived HTTP/2 or gRPC connection - DNAT picks a backend once per connection.", he: "לצפות ש-Service יעשה load balancing ל-requests על חיבור HTTP/2 או gRPC ארוך - DNAT בוחר backend פעם אחת לכל חיבור." }
  ],
  interview: [
    {
      q: { en: "Pods on one node get intermittent connection timeouts; other nodes are fine. What do you check?", he: "Pods על node אחד מקבלים connection timeouts לסירוגין; שאר ה-nodes תקינים. מה אתה בודק?" },
      a: { en: "dmesg for 'nf_conntrack: table full, dropping packet', nf_conntrack_count vs nf_conntrack_max, and conntrack -S drop counters. If full, find the top talkers (conntrack -L grouped by destination), fix the client churn (pooling, keep-alive), and as mitigation raise nf_conntrack_max and lower stale timeouts. Also check ephemeral port exhaustion (ss -s) and per-node NAT port limits on GKE.", he: "dmesg בחיפוש 'nf_conntrack: table full, dropping packet', את nf_conntrack_count מול nf_conntrack_max, ואת counters ה-drop ב-conntrack -S. אם מלא, מוצאים את מי שמדבר הכי הרבה (conntrack -L מקובץ לפי יעד), מתקנים את ה-churn של ה-client (pooling, keep-alive), וכ-mitigation מעלים את nf_conntrack_max ומורידים timeouts מיושנים. בודקים גם ephemeral port exhaustion (ss -s) וגבולות ports לכל node ב-NAT של GKE." }
    },
    {
      q: { en: "How many concurrent connections can a single NAT IP support?", he: "כמה חיבורים במקביל יכול IP אחד של NAT לתמוך?" },
      a: { en: "It depends on destinations. Because uniqueness is the 5-tuple, the limit is ~64k (AWS: 55k) per destination IP:port:protocol, not per NAT. Traffic spread over many destinations can scale to millions; traffic concentrated on one endpoint exhausts ports quickly. Fixes: more NAT IPs, connection reuse, private endpoints for that destination.", he: "תלוי ביעדים. כיוון שהייחודיות היא לפי ה-5-tuple, הגבול הוא כ-64 אלף (ב-AWS 55 אלף) לכל IP:port:protocol של יעד, לא לכל NAT. תעבורה שמפוזרת על הרבה יעדים יכולה להגיע למיליונים; תעבורה שמרוכזת ב-endpoint אחד גומרת את ה-ports מהר. תיקונים: עוד IPs ל-NAT, שימוש חוזר בחיבורים, private endpoints ליעד הזה." }
    }
  ],
  quiz: [
    {
      q: { en: "dmesg shows 'nf_conntrack: table full, dropping packet'. What happens to traffic on that host?", he: "ה-dmesg מראה 'nf_conntrack: table full, dropping packet'. מה קורה לתעבורה על ה-host הזה?" },
      options: [
        { en: "All existing connections are reset", he: "כל החיבורים הקיימים מתאפסים" },
        { en: "New flows are dropped; existing tracked flows keep working", he: "flows חדשים נזרקים; flows קיימים שכבר נרשמו ממשיכים לעבוד" },
        { en: "Only UDP is affected", he: "רק UDP מושפע" },
        { en: "The kernel automatically doubles the table", he: "ה-kernel מכפיל את הטבלה אוטומטית" }
      ],
      answer: 1,
      explain: { en: "Without a free slot the kernel can't track a new flow, so its first packet is dropped. Clients see intermittent connect timeouts. Existing entries are unaffected.", he: "בלי מקום פנוי ה-kernel לא יכול לרשום flow חדש, אז ה-packet הראשון שלו נזרק. ה-clients רואים connect timeouts לסירוגין. רשומות קיימות לא מושפעות." }
    },
    {
      q: { en: "Which NAT type does kube-proxy (iptables mode) use to send ClusterIP traffic to a Pod?", he: "באיזה סוג NAT משתמש kube-proxy (במצב iptables) כדי לשלוח תעבורת ClusterIP ל-Pod?" },
      options: [
        { en: "DNAT", he: "DNAT" },
        { en: "SNAT", he: "SNAT" },
        { en: "Masquerade only", he: "רק Masquerade" },
        { en: "No NAT - it's pure routing", he: "בלי NAT - זה routing נקי" }
      ],
      answer: 0,
      explain: { en: "The ClusterIP is virtual; KUBE-SEP chains DNAT the destination to a Pod IP:port. SNAT/masquerade is added only in some cases (e.g. traffic from outside the cluster or hairpin).", he: "ה-ClusterIP וירטואלי; שרשראות KUBE-SEP עושות DNAT ליעד ל-IP:port של Pod. SNAT/masquerade מתווסף רק במקרים מסוימים (למשל תעבורה מחוץ ל-cluster או hairpin)." }
    },
    {
      q: { en: "A small fraction of requests in your cluster take exactly 5 seconds, and conntrack -S shows insert_failed increasing. Best fix?", he: "אחוז קטן מה-requests ב-cluster לוקח בדיוק 5 שניות, ו-conntrack -S מראה ש-insert_failed עולה. מה התיקון הכי טוב?" },
      options: [
        { en: "Add more CoreDNS replicas", he: "להוסיף עוד replicas ל-CoreDNS" },
        { en: "Increase nf_conntrack_max", he: "להגדיל את nf_conntrack_max" },
        { en: "Deploy NodeLocal DNSCache", he: "לפרוס NodeLocal DNSCache" },
        { en: "Switch the CNI to host networking", he: "להעביר את ה-CNI ל-host networking" }
      ],
      answer: 2,
      explain: { en: "It's the conntrack race between parallel A/AAAA UDP queries DNATed to CoreDNS. NodeLocal DNSCache avoids the DNAT path and uses TCP upstream. More replicas or a bigger table don't stop the race.", he: "זה ה-race ב-conntrack בין שאילתות UDP מקבילות של A/AAAA שעוברות DNAT ל-CoreDNS. NodeLocal DNSCache עוקף את מסלול ה-DNAT ומשתמש ב-TCP מול ה-upstream. עוד replicas או טבלה גדולה יותר לא עוצרים את ה-race." }
    },
    {
      q: { en: "AWS NAT Gateway reports ErrorPortAllocation while all traffic goes to one partner API IP. What helps most?", he: "AWS NAT Gateway מדווח על ErrorPortAllocation כשכל התעבורה הולכת ל-IP אחד של API של שותף. מה הכי עוזר?" },
      options: [
        { en: "A bigger instance type for the NAT Gateway", he: "instance type גדול יותר ל-NAT Gateway" },
        { en: "Moving the app to a public subnet without changes", he: "להעביר את האפליקציה ל-subnet ציבורי בלי שינויים" },
        { en: "Lowering the TCP keepalive", he: "להוריד את ה-TCP keepalive" },
        { en: "Connection reuse in the client plus extra secondary IPs on the NAT Gateway", he: "שימוש חוזר בחיבורים ב-client ועוד secondary IPs ל-NAT Gateway" }
      ],
      answer: 3,
      explain: { en: "The limit is ~55k concurrent connections per destination per NAT IP. Fewer new connections and more NAT IPs both raise the ceiling. NAT Gateway has no instance size.", he: "הגבול הוא כ-55 אלף חיבורים במקביל לכל יעד לכל IP של NAT. פחות חיבורים חדשים ויותר IPs ל-NAT מעלים את התקרה. ל-NAT Gateway אין גודל instance." }
    }
  ],
  playground: "firewall",
  related: ["net-vpc", "net-firewalls", "k8s-services", "net-dns", "net-tcp-deep"]
});

/* ----------------------------------------------------------- BGP & anycast */
window.INFRA.lessons.push({
  id: "net-bgp-anycast",
  track: "networking",
  order: 22,
  icon: "🗺️",
  level: 3,
  minutes: 14,
  title: { en: "BGP & Anycast: how the Internet decides where packets go", he: "BGP ו-Anycast: איך האינטרנט מחליט לאן packets הולכים" },
  tldr: {
    en: "BGP is the trust-based protocol through which ~75,000 autonomous networks tell each other 'I can reach these prefixes'; the most specific prefix wins, then the shortest AS path, and a single wrong announcement can take down or hijack a global service.",
    he: "BGP הוא הפרוטוקול מבוסס האמון שדרכו כ-75,000 רשתות אוטונומיות אומרות זו לזו 'אני יכול להגיע ל-prefixes האלה'; ה-prefix הכי ספציפי מנצח, אחריו ה-AS path הכי קצר, והכרזה שגויה אחת יכולה להפיל או לחטוף שירות גלובלי."
  },
  analogy: {
    en: "BGP is a network of countries passing along signs that say 'to reach Tel Aviv, go through us'. Each country adds its name to the sign before handing it on, so you can see the chain and pick the shortest. Nobody checks the signs at the border - if a small country starts claiming 'Tel Aviv is right here, through us', and its sign is more specific, traffic will happily follow it. Anycast is when many cities legitimately put up the same sign, so everyone drives to the closest one.",
    he: "BGP זו רשת של מדינות שמעבירות הלאה שלטים שאומרים 'כדי להגיע לתל אביב, תעבור דרכנו'. כל מדינה מוסיפה את השם שלה לשלט לפני שהיא מעבירה אותו, כך שרואים את השרשרת ובוחרים את הקצרה. אף אחד לא בודק את השלטים בגבול - אם מדינה קטנה מתחילה לטעון 'תל אביב נמצאת ממש פה, דרכנו', והשלט שלה ספציפי יותר, התנועה תלך אחריה בשמחה. Anycast זה כשהרבה ערים תולות באופן לגיטימי את אותו שלט, וכל אחד נוסע לקרובה אליו."
  },
  sections: [
    {
      h: { en: "Autonomous systems, eBGP and iBGP", he: "Autonomous systems, eBGP ו-iBGP" },
      body: {
        en: `<p>The Internet is ~75,000 <strong>autonomous systems</strong> (AS): networks under one administrative policy, each with an ASN. Cloudflare is AS13335, Google AS15169, Amazon AS16509. Private ASNs (64512-65534, and 4200000000-4294967294 for 4-byte) are used internally, like RFC 1918 addresses.</p>
<p><strong>BGP-4</strong> runs over TCP port 179 between configured neighbors (it doesn't discover peers):</p>
<ul>
<li><strong>eBGP</strong>: between different ASes (your ISP and you, two providers at an Internet exchange). Each hop prepends its ASN to the <strong>AS_PATH</strong>.</li>
<li><strong>iBGP</strong>: between routers inside the same AS, to distribute external routes internally. Doesn't modify AS_PATH; needs full mesh or <strong>route reflectors</strong>.</li>
</ul>
<p>BGP is a <em>path-vector</em> protocol: it advertises reachability ("prefix 203.0.113.0/24, path 3356 13335") plus attributes, and each AS applies its own policy - who it peers with for free, who pays for transit, what it accepts. The global IPv4 table is around 1 million prefixes; IPv6 is over 200k.</p>
<pre>router# show ip bgp 1.1.1.0/24
BGP routing table entry for 1.1.1.0/24
Paths: (2 available, best #1)
  6939 13335
    206.81.80.40 from 206.81.80.40 (216.218.252.1)
      Origin IGP, localpref 100, valid, external, best
  3356 13335
    4.68.62.1 from 4.68.62.1 (4.69.184.193)
      Origin IGP, localpref 100, valid, external</pre>`,
        he: `<p>האינטרנט בנוי מכ-75,000 <strong>autonomous systems</strong> (AS): רשתות תחת מדיניות ניהולית אחת, לכל אחת ASN. Cloudflare זה AS13335, Google זה AS15169, Amazon זה AS16509. ASNs פרטיים (64512-65534, ו-4200000000-4294967294 ב-4 בייט) משמשים בפנים, כמו כתובות RFC 1918.</p>
<p><strong>BGP-4</strong> רץ על TCP port 179 בין שכנים שמוגדרים ידנית (הוא לא מגלה peers לבד):</p>
<ul>
<li><strong>eBGP</strong>: בין ASes שונים (ה-ISP שלך ואתה, שני ספקים ב-Internet exchange). כל hop מוסיף את ה-ASN שלו בתחילת ה-<strong>AS_PATH</strong>.</li>
<li><strong>iBGP</strong>: בין routers בתוך אותו AS, כדי להפיץ routes חיצוניים בפנים. לא משנה את ה-AS_PATH; צריך full mesh או <strong>route reflectors</strong>.</li>
</ul>
<p>BGP הוא פרוטוקול <em>path-vector</em>: הוא מכריז על נגישות ("prefix 203.0.113.0/24, path 3356 13335") יחד עם attributes, וכל AS מפעיל מדיניות משלו - עם מי הוא עושה peering בחינם, מי משלם על transit, מה הוא מוכן לקבל. טבלת ה-IPv4 הגלובלית היא בסביבות מיליון prefixes; IPv6 מעל 200 אלף.</p>
<pre>router# show ip bgp 1.1.1.0/24
BGP routing table entry for 1.1.1.0/24
Paths: (2 available, best #1)
  6939 13335
    206.81.80.40 from 206.81.80.40 (216.218.252.1)
      Origin IGP, localpref 100, valid, external, best
  3356 13335
    4.68.62.1 from 4.68.62.1 (4.69.184.193)
      Origin IGP, localpref 100, valid, external</pre>`
      }
    },
    {
      h: { en: "How a path is chosen: longest prefix first", he: "איך נבחר מסלול: קודם ה-prefix הארוך" },
      body: {
        en: `<p>Two different mechanisms, in this order:</p>
<ol>
<li><strong>Longest prefix match</strong> (the forwarding table): a /24 always beats a /22 that covers it, regardless of BGP attributes. This is the property every hijack abuses.</li>
<li><strong>BGP best-path selection</strong> among routes for the <em>same</em> prefix. Simplified order: highest <strong>LOCAL_PREF</strong> (your own policy, e.g. prefer customers over peers over transit) → <strong>shortest AS_PATH</strong> → lowest origin type → lowest <strong>MED</strong> (neighbor's hint for which entry point to use) → eBGP over iBGP → lowest IGP cost to the next hop → tie-breakers (router ID).</li>
</ol>
<p>Traffic-engineering knobs you'll actually meet: <strong>AS-path prepending</strong> (repeat your ASN to make a path look longer and less attractive), announcing <strong>more-specific prefixes</strong> to pull traffic to one link, and <strong>communities</strong> (tags like <code>65000:100</code> asking a provider to lower preference or not export).</p>
<p>The Internet generally filters anything longer than <strong>/24 for IPv4 and /48 for IPv6</strong>, so you can't announce a single /32 to the world.</p>
<blockquote>💡 Real world: Direct Connect uses the same logic. If you advertise the same on-prem prefix over Direct Connect and a VPN, AWS prefers Direct Connect; to steer between two DX links you use longer prefixes, AS-path prepending or local-preference communities that AWS documents.</blockquote>`,
        he: `<p>שני מנגנונים שונים, בסדר הזה:</p>
<ol>
<li><strong>Longest prefix match</strong> (טבלת ה-forwarding): /24 תמיד מנצח /22 שמכסה אותו, בלי קשר ל-attributes של BGP. זו התכונה שכל hijack מנצל.</li>
<li><strong>בחירת best-path ב-BGP</strong> בין routes ל<em>אותו</em> prefix. בסדר מפושט: <strong>LOCAL_PREF</strong> הכי גבוה (המדיניות שלך, למשל להעדיף לקוחות על פני peers ועל פני transit) ← <strong>AS_PATH הכי קצר</strong> ← origin type הכי נמוך ← <strong>MED</strong> הכי נמוך (רמז מהשכן באיזו נקודת כניסה להשתמש) ← eBGP לפני iBGP ← עלות IGP נמוכה ל-next hop ← שוברי שוויון (router ID).</li>
</ol>
<p>הכפתורים ל-traffic engineering שבאמת תפגוש: <strong>AS-path prepending</strong> (לחזור על ה-ASN שלך כדי שמסלול ייראה ארוך ופחות אטרקטיבי), הכרזה על <strong>prefixes ספציפיים יותר</strong> כדי למשוך תעבורה לקו אחד, ו-<strong>communities</strong> (תגיות כמו <code>65000:100</code> שמבקשות מהספק להוריד העדפה או לא להפיץ הלאה).</p>
<p>האינטרנט בדרך כלל מסנן כל מה שארוך מ-<strong>/24 ב-IPv4 ו-/48 ב-IPv6</strong>, אז אי אפשר להכריז על /32 בודד לעולם.</p>
<blockquote>💡 מהשטח: Direct Connect עובד באותו היגיון. אם מכריזים על אותו prefix של on-prem גם ב-Direct Connect וגם ב-VPN, AWS מעדיף את Direct Connect; כדי לנווט בין שני קווי DX משתמשים ב-prefixes ארוכים יותר, AS-path prepending או communities של local-preference ש-AWS מתעדים.</blockquote>`
      }
    },
    {
      h: { en: "When BGP goes wrong: leaks, hijacks, Facebook 2021 and RPKI", he: "כש-BGP משתבש: leaks, hijacks, Facebook 2021 ו-RPKI" },
      body: {
        en: `<p>BGP trusts what neighbors say. Famous failures:</p>
<ul>
<li><strong>Pakistan Telecom vs YouTube (2008)</strong>: to block YouTube domestically, PT announced 208.65.153.0/24 - more specific than YouTube's /22. An upstream leaked it globally and most of the Internet sent YouTube traffic to Pakistan for ~2 hours.</li>
<li><strong>Verizon / Cloudflare route leak (2019)</strong>: a small ISP's BGP optimizer generated more-specifics, leaked them to a customer that leaked them to Verizon, which accepted them without filters. Large parts of Cloudflare and AWS traffic were funneled through a tiny network.</li>
<li><strong>Facebook (4 Oct 2021)</strong>: a maintenance command accidentally disconnected Facebook's backbone. Their DNS servers, built to withdraw their anycast BGP routes when they can't reach the data centers, did exactly that. Facebook's DNS vanished from the Internet; ~6 hours of outage, and engineers' badges and internal tools depended on the same network.</li>
</ul>
<p><strong>RPKI</strong> is the main defense: prefix owners publish signed <strong>ROAs</strong> ("AS13335 may originate 1.1.1.0/24, max length /24"), and networks doing <strong>Route Origin Validation</strong> drop announcements that are <em>RPKI-invalid</em>. It stops origin hijacks and accidental more-specifics (thanks to max length), but not a forged path with the right origin - that's what ASPA and BGPsec aim at. Most large transit providers and clouds now drop invalids.</p>
<blockquote>⚠️ Production tip: if your company owns IP space, create ROAs for it at your RIR (RIPE NCC for Israel) and keep max length tight. Check your prefixes at a public RPKI validator before every network change.</blockquote>`,
        he: `<p>BGP סומך על מה שהשכנים אומרים. כשלונות מפורסמים:</p>
<ul>
<li><strong>Pakistan Telecom מול YouTube (2008)</strong>: כדי לחסום את YouTube בתוך המדינה, PT הכריזו על 208.65.153.0/24 - ספציפי יותר מה-/22 של YouTube. ספק upstream הדליף את זה לכל העולם ורוב האינטרנט שלח תעבורת YouTube לפקיסטן במשך כשעתיים.</li>
<li><strong>Route leak של Verizon / Cloudflare (2019)</strong>: BGP optimizer של ISP קטן ייצר more-specifics, הדליף אותם ללקוח שהדליף אותם ל-Verizon, שקיבלה אותם בלי filters. חלקים גדולים מהתעבורה של Cloudflare ו-AWS עברו דרך רשת קטנטנה.</li>
<li><strong>Facebook (4 באוקטובר 2021)</strong>: פקודת תחזוקה ניתקה בטעות את ה-backbone של Facebook. שרתי ה-DNS שלהם, שבנויים לבטל את ה-anycast routes שלהם ב-BGP כשהם לא מגיעים ל-data centers, עשו בדיוק את זה. ה-DNS של Facebook נעלם מהאינטרנט; כ-6 שעות של outage, והתגים של המהנדסים והכלים הפנימיים היו תלויים באותה רשת.</li>
</ul>
<p><strong>RPKI</strong> היא ההגנה העיקרית: בעלי prefixes מפרסמים <strong>ROAs</strong> חתומים ("AS13335 רשאי להכריז על 1.1.1.0/24, max length /24"), ורשתות שעושות <strong>Route Origin Validation</strong> זורקות הכרזות שהן <em>RPKI-invalid</em>. זה עוצר origin hijacks ו-more-specifics בטעות (בזכות ה-max length), אבל לא path מזויף עם ה-origin הנכון - לזה מכוונים ASPA ו-BGPsec. רוב ספקי ה-transit הגדולים והעננים כבר זורקים invalids.</p>
<blockquote>⚠️ טיפ לפרודקשן: אם לחברה שלך יש מרחב IP משלה, תיצור לו ROAs ב-RIR (ל-ישראל זה RIPE NCC) ותשמור max length צמוד. תבדוק את ה-prefixes שלך ב-RPKI validator ציבורי לפני כל שינוי רשת.</blockquote>`
      }
    },
    {
      h: { en: "Anycast: one IP, hundreds of places", he: "Anycast: IP אחד, מאות מקומות" },
      body: {
        en: `<p><strong>Anycast</strong> = the same prefix announced via BGP from many locations. Each user's ISP picks the "closest" announcement by BGP rules (shortest AS path, local policy), which usually correlates with geography.</p>
<ul>
<li><strong>DNS</strong>: 1.1.1.1 (Cloudflare, 300+ cities), 8.8.8.8, and the 13 root server "letters" served by 1,500+ anycast instances. A DDoS gets spread over every site instead of hitting one.</li>
<li><strong>CDNs and edge</strong>: Cloudflare, Fastly and AWS Global Accelerator put all their edge IPs on anycast; GCP's global HTTP(S) Load Balancer gives you one anycast IP worldwide.</li>
<li><strong>Failover</strong>: a site that fails its health checks withdraws its route; within seconds to minutes, traffic converges to the next site. No DNS TTL to wait for.</li>
</ul>
<p>Why TCP over anycast works: routes are stable for minutes to hours, so a flow normally stays on one site. Route changes mid-connection can reset long connections, which is why anycast shines for short DNS/HTTP exchanges and why providers keep routes stable and use ECMP with consistent hashing inside a site.</p>
<blockquote>💡 Real world: "closest by BGP" isn't always closest by latency. An Israeli ISP might peer with a provider only in Frankfurt, so 1.1.1.1 answers from Frankfurt even though there's a Tel Aviv PoP. <code>dig @1.1.1.1 id.server CH TXT</code> shows which site answered.</blockquote>`,
        he: `<p><strong>Anycast</strong> = אותו prefix מוכרז ב-BGP מהרבה מקומות. ה-ISP של כל משתמש בוחר את ההכרזה ה"קרובה" לפי חוקי BGP (AS path הכי קצר, מדיניות מקומית), וזה בדרך כלל מתאים לגיאוגרפיה.</p>
<ul>
<li><strong>DNS</strong>: 1.1.1.1 (Cloudflare, מעל 300 ערים), 8.8.8.8, ו-13 ה"אותיות" של root servers שמוגשות על ידי מעל 1,500 instances של anycast. DDoS מתפזר על כל האתרים במקום להכות באחד.</li>
<li><strong>CDNs ו-edge</strong>: Cloudflare, Fastly ו-AWS Global Accelerator שמים את כל ה-IPs של ה-edge על anycast; ה-HTTP(S) Load Balancer הגלובלי של GCP נותן IP anycast אחד לכל העולם.</li>
<li><strong>Failover</strong>: אתר שנכשל ב-health checks מבטל את ה-route שלו; תוך שניות עד דקות התעבורה מתכנסת לאתר הבא. אין TTL של DNS לחכות לו.</li>
</ul>
<p>למה TCP על anycast עובד: routes יציבים לדקות עד שעות, אז flow נשאר בדרך כלל על אתר אחד. שינוי route באמצע חיבור יכול לאפס חיבורים ארוכים, ולכן anycast מצטיין בהחלפות קצרות של DNS/HTTP, והספקים שומרים על routes יציבים ומשתמשים ב-ECMP עם consistent hashing בתוך האתר.</p>
<blockquote>💡 מהשטח: "הכי קרוב לפי BGP" זה לא תמיד הכי קרוב לפי latency. ISP ישראלי יכול לעשות peering עם ספק רק בפרנקפורט, אז 1.1.1.1 עונה מפרנקפורט למרות שיש PoP בתל אביב. <code>dig @1.1.1.1 id.server CH TXT</code> מראה איזה אתר ענה.</blockquote>`
      }
    },
    {
      h: { en: "BGP inside datacenters, Kubernetes and cloud links", he: "BGP בתוך data centers, ב-Kubernetes ובחיבורים לענן" },
      body: {
        en: `<p>BGP is no longer only for ISPs:</p>
<ul>
<li><strong>Datacenter fabrics</strong>: large leaf-spine (Clos) networks run eBGP on every link, each rack its own private ASN (RFC 7938). Simple, scalable, ECMP everywhere.</li>
<li><strong>Calico</strong>: each node runs BIRD and announces its Pod CIDR via BGP - full node-to-node mesh by default, route reflectors past ~100 nodes, or peering with the top-of-rack switches so Pod IPs are routable without overlay.</li>
<li><strong>MetalLB BGP mode / Cilium BGP control plane</strong>: on bare metal, nodes announce <code>LoadBalancer</code> Service IPs to your routers; ECMP spreads traffic across nodes. (MetalLB L2 mode uses ARP instead and sends all traffic to one node.)</li>
<li><strong>Cloud hybrid links</strong>: AWS Direct Connect, Azure ExpressRoute and GCP Interconnect are all eBGP sessions between your router and the cloud. Site-to-site VPNs can use BGP too (dynamic routing) for automatic failover between tunnels.</li>
</ul>
<pre># MetalLB BGP mode
apiVersion: metallb.io/v1beta2
kind: BGPPeer
metadata: { name: tor-switch, namespace: metallb-system }
spec:
  myASN: 64512
  peerASN: 64600
  peerAddress: 10.0.0.1
---
apiVersion: metallb.io/v1beta1
kind: BGPAdvertisement
metadata: { name: public-pool, namespace: metallb-system }
spec:
  ipAddressPools: [ public-pool ]</pre>
<blockquote>⚠️ Production tip: AWS accepts at most 100 prefixes from you on a private Direct Connect virtual interface; exceed it and the BGP session goes down. Summarize routes before advertising.</blockquote>`,
        he: `<p>BGP כבר לא רק ל-ISPs:</p>
<ul>
<li><strong>Datacenter fabrics</strong>: רשתות leaf-spine (Clos) גדולות מריצות eBGP על כל קו, כשלכל rack יש ASN פרטי משלו (RFC 7938). פשוט, scalable, ECMP בכל מקום.</li>
<li><strong>Calico</strong>: כל node מריץ BIRD ומכריז על ה-Pod CIDR שלו ב-BGP - full mesh בין ה-nodes כברירת מחדל, route reflectors מעל כ-100 nodes, או peering עם ה-switches של ה-top-of-rack כך שה-IPs של ה-Pods ניתנים לניתוב בלי overlay.</li>
<li><strong>MetalLB במצב BGP / ה-BGP control plane של Cilium</strong>: ב-bare metal, ה-nodes מכריזים על IPs של Services מסוג <code>LoadBalancer</code> ל-routers שלך; ECMP מפזר את התעבורה בין ה-nodes. (מצב L2 של MetalLB משתמש ב-ARP ושולח את כל התעבורה ל-node אחד.)</li>
<li><strong>חיבורים היברידיים לענן</strong>: AWS Direct Connect, Azure ExpressRoute ו-GCP Interconnect הם כולם sessions של eBGP בין ה-router שלך לענן. גם site-to-site VPN יכול להשתמש ב-BGP (dynamic routing) כדי לקבל failover אוטומטי בין tunnels.</li>
</ul>
<pre># MetalLB BGP mode
apiVersion: metallb.io/v1beta2
kind: BGPPeer
metadata: { name: tor-switch, namespace: metallb-system }
spec:
  myASN: 64512
  peerASN: 64600
  peerAddress: 10.0.0.1
---
apiVersion: metallb.io/v1beta1
kind: BGPAdvertisement
metadata: { name: public-pool, namespace: metallb-system }
spec:
  ipAddressPools: [ public-pool ]</pre>
<blockquote>⚠️ טיפ לפרודקשן: AWS מקבל ממך לכל היותר 100 prefixes על private virtual interface של Direct Connect; אם עוברים את זה, ה-session של BGP נופל. תעשה summarization ל-routes לפני שמכריזים.</blockquote>`
      }
    }
  ],
  diagram: `             AS64500 (you)  announces 203.0.113.0/22
                 |  eBGP
       +---------+---------+
   AS3356 (transit)     AS6939 (transit)
   path: 3356 64500     path: 6939 64500
       \\                     /
        +----- AS13335 -----+     picks shortest AS_PATH, local policy
                 |
      HIJACK: AS666 announces 203.0.113.0/24  -> more specific, wins everywhere
              (RPKI ROA says origin 64500 maxLength /22 -> invalid -> dropped)

  Anycast: 1.1.1.0/24 announced from TLV, FRA, AMS, NYC ... -> each ISP routes to "closest"`,
  handsOn: [
    { cmd: "whois -h whois.radb.net -- '-i origin AS13335' | grep -E '^route:' | head", what: { en: "List prefixes registered in the IRR for an AS - what that network claims to originate.", he: "לרשום prefixes שרשומים ב-IRR עבור AS - מה הרשת הזו טוענת שהיא מכריזה." } },
    { cmd: "dig @1.1.1.1 id.server CH TXT +short", what: { en: "Ask an anycast resolver which site answered you (e.g. \"TLV\" or \"FRA\").", he: "לשאול resolver של anycast איזה אתר ענה לך (למשל \"TLV\" או \"FRA\")." } },
    { cmd: "mtr -rwz -c 20 1.1.1.1", what: { en: "Trace with AS numbers (-z) to see which networks your packets cross on the way to an anycast IP.", he: "trace עם מספרי AS (-z) כדי לראות דרך אילו רשתות ה-packets שלך עוברים בדרך ל-IP של anycast." } },
    { cmd: "kubectl exec -n calico-system ds/calico-node -- birdcl show protocols", what: { en: "On a Calico cluster: the BGP sessions each node holds with its peers (Established = healthy).", he: "ב-cluster של Calico: ה-sessions של BGP שכל node מחזיק מול ה-peers שלו (Established = תקין)." } },
    { cmd: "aws directconnect describe-virtual-interfaces --query 'virtualInterfaces[].{name:virtualInterfaceName,state:virtualInterfaceState,bgp:bgpPeers[].bgpStatus}'", what: { en: "Check the BGP status (up/down) on your Direct Connect virtual interfaces.", he: "לבדוק את סטטוס ה-BGP (up/down) על ה-virtual interfaces של Direct Connect." } }
  ],
  mnemonic: {
    en: "\"Longest prefix wins, then shortest path.\" BGP believes every sign it's handed - RPKI is the border guard that checks the signature.",
    he: "\"ה-prefix הארוך מנצח, אחריו המסלול הקצר.\" BGP מאמין לכל שלט שמגישים לו - RPKI הוא שומר הגבול שבודק את החתימה."
  },
  pitfalls: [
    { en: "Assuming AS-path length beats prefix length - a more-specific /24 always wins over your /22, which is exactly how hijacks work.", he: "להניח שאורך ה-AS path גובר על אורך ה-prefix - /24 ספציפי יותר תמיד מנצח את ה-/22 שלך, ובדיוק כך hijacks עובדים." },
    { en: "Making health-check-driven BGP withdrawal depend on the same network it protects (Facebook 2021): when everything fails, every site withdraws at once.", he: "לגרום ל-withdrawal של BGP שמונע על ידי health checks להיות תלוי באותה רשת שהוא מגן עליה (Facebook 2021): כשהכל נופל, כל האתרים מבטלים בבת אחת." },
    { en: "Advertising too many prefixes over Direct Connect (limit 100 on a private VIF) and dropping the session.", he: "להכריז על יותר מדי prefixes ב-Direct Connect (גבול של 100 ב-private VIF) ולהפיל את ה-session." },
    { en: "Owning IP space without RPKI ROAs, or with a loose max length that lets anyone announce your more-specifics as 'valid'.", he: "להחזיק מרחב IP בלי ROAs של RPKI, או עם max length רופף שמאפשר לכל אחד להכריז על more-specifics שלך כ-'valid'." }
  ],
  interview: [
    {
      q: { en: "What happened in the Facebook outage of October 2021, in BGP terms?", he: "מה קרה ב-outage של Facebook באוקטובר 2021, במונחי BGP?" },
      a: { en: "A faulty maintenance command took down the backbone between Facebook's data centers. Their authoritative DNS servers are designed to withdraw their anycast BGP announcements when they lose connectivity to the data centers, so all of them withdrew. The prefixes for the DNS servers disappeared from the global table, facebook.com stopped resolving everywhere, and recovery was slow because internal tools and physical access relied on the same network.", he: "פקודת תחזוקה שגויה הפילה את ה-backbone בין ה-data centers של Facebook. שרתי ה-DNS ה-authoritative שלהם בנויים לבטל את הכרזות ה-anycast שלהם ב-BGP כשהם מאבדים קישוריות ל-data centers, אז כולם ביטלו. ה-prefixes של שרתי ה-DNS נעלמו מהטבלה הגלובלית, facebook.com הפסיק להיות resolvable בכל מקום, וההתאוששות הייתה איטית כי כלים פנימיים וגישה פיזית היו תלויים באותה רשת." }
    },
    {
      q: { en: "Why do CDNs and public DNS resolvers use anycast instead of GeoDNS alone?", he: "למה CDNs ו-resolvers ציבוריים של DNS משתמשים ב-anycast ולא רק ב-GeoDNS?" },
      a: { en: "Anycast routes each user to a nearby site at the network layer without relying on DNS TTLs or resolver location, absorbs DDoS by spreading it across all sites, and fails over by simply withdrawing a route. For a DNS resolver it's the only option - clients configure an IP, not a name.", he: "Anycast מנתב כל משתמש לאתר קרוב בשכבת הרשת בלי לסמוך על TTLs של DNS או על המיקום של ה-resolver, סופג DDoS כי הוא מתפזר על כל האתרים, ועושה failover פשוט על ידי ביטול route. ל-resolver של DNS זו האפשרות היחידה - clients מגדירים IP, לא שם." }
    }
  ],
  quiz: [
    {
      q: { en: "Your network announces 198.51.100.0/22. Another AS announces 198.51.100.0/24. Where does traffic for 198.51.100.10 go?", he: "הרשת שלך מכריזה על 198.51.100.0/22. AS אחר מכריז על 198.51.100.0/24. לאן הולכת תעבורה ל-198.51.100.10?" },
      options: [
        { en: "To you, because you announced first", he: "אליך, כי הכרזת ראשון" },
        { en: "To whichever AS has the shorter AS path", he: "ל-AS עם ה-AS path הקצר יותר" },
        { en: "To the other AS, because the /24 is more specific", he: "ל-AS השני, כי ה-/24 ספציפי יותר" },
        { en: "It is split 50/50", he: "מתחלק 50/50" }
      ],
      answer: 2,
      explain: { en: "Longest prefix match happens before BGP attributes are compared. That's how the 2008 YouTube hijack worked; RPKI with a tight max length would mark the /24 invalid.", he: "Longest prefix match קורה לפני שמשווים attributes של BGP. כך עבד ה-hijack של YouTube ב-2008; RPKI עם max length צמוד היה מסמן את ה-/24 כ-invalid." }
    },
    {
      q: { en: "What does RPKI Route Origin Validation protect against?", he: "מפני מה Route Origin Validation של RPKI מגן?" },
      options: [
        { en: "An AS announcing a prefix it isn't authorized to originate", he: "AS שמכריז על prefix שהוא לא מורשה להכריז עליו" },
        { en: "Any forged AS path", he: "כל AS path מזויף" },
        { en: "DDoS attacks", he: "מתקפות DDoS" },
        { en: "Eavesdropping on BGP sessions", he: "האזנה ל-sessions של BGP" }
      ],
      answer: 0,
      explain: { en: "ROAs bind a prefix (and max length) to an origin ASN. Path forgery with the correct origin needs ASPA/BGPsec; session security is TCP-AO/MD5.", he: "ROAs קושרים prefix (ו-max length) ל-ASN של origin. זיוף path עם ה-origin הנכון דורש ASPA/BGPsec; אבטחת ה-session היא TCP-AO/MD5." }
    },
    {
      q: { en: "Which statement about anycast is true?", he: "איזו טענה על anycast נכונה?" },
      options: [
        { en: "It only works for UDP", he: "זה עובד רק ל-UDP" },
        { en: "It requires a low DNS TTL to fail over", he: "זה דורש TTL נמוך ב-DNS כדי לעשות failover" },
        { en: "Every user always reaches the geographically nearest site", he: "כל משתמש תמיד מגיע לאתר הכי קרוב גיאוגרפית" },
        { en: "The same prefix is announced from many sites and BGP picks one per network path", he: "אותו prefix מוכרז מהרבה אתרים ו-BGP בוחר אחד לכל מסלול רשת" }
      ],
      answer: 3,
      explain: { en: "TCP works because routes are stable. Failover is a BGP withdrawal, not DNS. 'Nearest' is by BGP policy and AS path, which often but not always matches geography.", he: "TCP עובד כי ה-routes יציבים. Failover זה withdrawal של BGP, לא DNS. 'הכי קרוב' נקבע לפי מדיניות BGP ו-AS path, שלרוב אבל לא תמיד מתאימים לגיאוגרפיה." }
    }
  ],
  related: ["net-dns", "net-proxies-cdn", "net-load-balancing", "net-hybrid-connectivity", "net-ip-cidr"]
});

/* --------------------------------------------------- Connecting networks */
window.INFRA.lessons.push({
  id: "net-hybrid-connectivity",
  track: "networking",
  order: 23,
  icon: "🌉",
  level: 2,
  minutes: 15,
  title: { en: "Connecting networks: peering, transit hubs, PrivateLink, VPN and Direct Connect", he: "חיבור רשתות: peering, transit hubs, PrivateLink, VPN ו-Direct Connect" },
  tldr: {
    en: "Pick the connection by the question you're answering: VPC-to-VPC (peering or a transit hub), one service to many consumers (PrivateLink), or cloud-to-on-prem (VPN now, Direct Connect for steady bandwidth) - and plan non-overlapping CIDRs and cross-network DNS before any of it.",
    he: "בוחרים את החיבור לפי השאלה: VPC ל-VPC (peering או transit hub), שירות אחד להרבה צרכנים (PrivateLink), או ענן ל-on-prem (VPN עכשיו, Direct Connect ל-bandwidth קבוע) - ומתכננים CIDRs שלא חופפים ו-DNS בין רשתות לפני כל זה."
  },
  analogy: {
    en: "Your VPCs are office buildings. Peering is a private sky-bridge between two buildings - fast, but you can't walk through building B to reach C. A Transit Gateway is a central lobby every building connects to, with a guard deciding who may go where. PrivateLink is a service window cut into your wall: you can buy from the shop next door without entering it. A VPN is an armored van over public roads; Direct Connect is your own private road, which takes weeks to pave.",
    he: "ה-VPCs שלך הם בנייני משרדים. Peering זה גשר פרטי בין שני בניינים - מהיר, אבל אי אפשר לעבור דרך בניין B כדי להגיע ל-C. Transit Gateway זה לובי מרכזי שכל הבניינים מחוברים אליו, עם שומר שמחליט מי הולך לאן. PrivateLink זה אשנב שירות שנפתח בקיר שלך: אפשר לקנות מהחנות השכנה בלי להיכנס אליה. VPN זה רכב משוריין על כבישים ציבוריים; Direct Connect זה כביש פרטי משלך, שלוקח שבועות לסלול."
  },
  sections: [
    {
      h: { en: "VPC to VPC: peering vs hub-and-spoke", he: "VPC ל-VPC: peering מול hub-and-spoke" },
      body: {
        en: `<p><strong>VPC peering</strong> (AWS, GCP) / <strong>VNet peering</strong> (Azure) routes traffic directly over the provider backbone. No gateway, no bandwidth cap, no hourly fee - you pay normal data transfer (AWS: same-AZ free, cross-AZ ~$0.01/GB each way, cross-region inter-region rates). The catch: it's <strong>non-transitive</strong>. A↔B and B↔C does not give A↔C, and you can't use a peer's NAT gateway, VPN or Direct Connect. N VPCs in full mesh = N(N-1)/2 peerings: 20 VPCs = 190.</p>
<p><strong>Hub-and-spoke</strong> solves this:</p>
<ul>
<li><strong>AWS Transit Gateway</strong>: regional router, ~$0.05/hour per attachment + ~$0.02/GB processed, up to 50 Gbps per VPC attachment. Multiple route tables let you isolate prod from dev while both reach shared services and on-prem. TGWs in different regions peer with each other.</li>
<li><strong>Azure Virtual WAN</strong> (managed hub) or a self-built hub VNet with Azure Firewall/NVA and user-defined routes.</li>
<li><strong>GCP</strong>: Shared VPC (one network, many projects) is often the answer; Network Connectivity Center for hub-and-spoke.</li>
</ul>
<pre># TGW route table for "dev" attachments: can reach shared + on-prem, never prod
10.10.0.0/16   tgw-attach-shared     (propagated)
10.0.0.0/8     tgw-attach-vpn-onprem (static)
# no route to 10.20.0.0/16 (prod) -&gt; dev can't reach prod</pre>
<blockquote>💡 Real world: a common pattern puts a central <strong>inspection VPC</strong> (Network Firewall or third-party firewalls) behind the TGW, so all east-west and egress traffic passes one choke point - and one central NAT egress instead of a NAT Gateway in every VPC.</blockquote>`,
        he: `<p><strong>VPC peering</strong> (ב-AWS וב-GCP) / <strong>VNet peering</strong> (ב-Azure) מנתב תעבורה ישירות על ה-backbone של הספק. אין gateway, אין תקרת bandwidth, אין תשלום שעתי - משלמים data transfer רגיל (ב-AWS: באותו AZ חינם, בין AZs כ-$0.01 ל-GB לכל כיוון, בין regions לפי תעריף inter-region). המלכודת: הוא <strong>לא טרנזיטיבי</strong>. A↔B ו-B↔C לא נותנים A↔C, ואי אפשר להשתמש ב-NAT gateway, ב-VPN או ב-Direct Connect של ה-peer. N VPCs ב-full mesh = N(N-1)/2 peerings: ל-20 VPCs זה 190.</p>
<p><strong>Hub-and-spoke</strong> פותר את זה:</p>
<ul>
<li><strong>AWS Transit Gateway</strong>: router אזורי, כ-$0.05 לשעה לכל attachment ועוד כ-$0.02 ל-GB, עד 50Gbps לכל VPC attachment. כמה route tables מאפשרים לבודד את prod מ-dev כששניהם מגיעים ל-shared services ול-on-prem. TGWs ב-regions שונים עושים peering ביניהם.</li>
<li><strong>Azure Virtual WAN</strong> (hub מנוהל) או hub VNet שבונים לבד עם Azure Firewall/NVA ו-user-defined routes.</li>
<li><strong>GCP</strong>: Shared VPC (רשת אחת, הרבה projects) הוא הרבה פעמים התשובה; Network Connectivity Center ל-hub-and-spoke.</li>
</ul>
<pre># TGW route table for "dev" attachments: can reach shared + on-prem, never prod
10.10.0.0/16   tgw-attach-shared     (propagated)
10.0.0.0/8     tgw-attach-vpn-onprem (static)
# no route to 10.20.0.0/16 (prod) -&gt; dev can't reach prod</pre>
<blockquote>💡 מהשטח: דפוס נפוץ שם <strong>inspection VPC</strong> מרכזי (Network Firewall או firewalls של צד שלישי) מאחורי ה-TGW, כך שכל תעבורת ה-east-west וה-egress עוברת בנקודת חנק אחת - ו-egress מרכזי אחד דרך NAT במקום NAT Gateway בכל VPC.</blockquote>`
      }
    },
    {
      h: { en: "PrivateLink / Private Endpoints: expose a service, not a network", he: "PrivateLink / Private Endpoints: חושפים שירות, לא רשת" },
      body: {
        en: `<p>Peering and TGW connect <em>networks</em>: everything can potentially reach everything, and CIDRs must not overlap. <strong>PrivateLink</strong> (AWS), <strong>Private Endpoint / Private Link Service</strong> (Azure) and <strong>Private Service Connect</strong> (GCP) connect a <em>consumer to one service</em>:</p>
<ul>
<li>The provider puts the service behind an NLB (AWS) and publishes an endpoint service.</li>
<li>The consumer creates an interface endpoint: an ENI with an IP <strong>from the consumer's own subnet</strong>.</li>
<li>Traffic is one-way (consumer initiates), never touches the Internet, and <strong>overlapping CIDRs don't matter</strong>, because the consumer only ever sees its local endpoint IP.</li>
</ul>
<p>AWS pricing ballpark: ~$0.01/hour per endpoint per AZ (~$22/month for 3 AZs) + ~$0.01/GB. It's how you reach AWS APIs privately (ECR, STS, Secrets Manager, SQS) and how SaaS vendors (Snowflake, Datadog, MongoDB Atlas, Confluent) let you connect without peering into your network.</p>
<blockquote>⚠️ Production tip: an interface endpoint only works if DNS returns its private IP. With "private DNS" enabled, <code>sqs.us-east-1.amazonaws.com</code> resolves to the endpoint inside that VPC. From on-prem or a peered VPC, it still resolves to the public IP until you forward DNS correctly (see below).</blockquote>`,
        he: `<p>Peering ו-TGW מחברים <em>רשתות</em>: הכל יכול פוטנציאלית להגיע להכל, וה-CIDRs אסור שיחפפו. <strong>PrivateLink</strong> (AWS), <strong>Private Endpoint / Private Link Service</strong> (Azure) ו-<strong>Private Service Connect</strong> (GCP) מחברים <em>צרכן לשירות אחד</em>:</p>
<ul>
<li>הספק שם את השירות מאחורי NLB (ב-AWS) ומפרסם endpoint service.</li>
<li>הצרכן יוצר interface endpoint: ENI עם IP <strong>מה-subnet של הצרכן עצמו</strong>.</li>
<li>התעבורה חד-כיוונית (הצרכן יוזם), לא נוגעת באינטרנט, ו-<strong>CIDRs חופפים לא משנים</strong>, כי הצרכן רואה רק את ה-IP המקומי של ה-endpoint.</li>
</ul>
<p>מחירים בערך ב-AWS: כ-$0.01 לשעה לכל endpoint לכל AZ (כ-$22 לחודש ל-3 AZs) ועוד כ-$0.01 ל-GB. ככה מגיעים באופן פרטי ל-APIs של AWS (ECR, STS, Secrets Manager, SQS), וככה ספקי SaaS (Snowflake, Datadog, MongoDB Atlas, Confluent) מאפשרים להתחבר בלי peering לרשת שלך.</p>
<blockquote>⚠️ טיפ לפרודקשן: interface endpoint עובד רק אם ה-DNS מחזיר את ה-IP הפרטי שלו. עם "private DNS" מופעל, <code>sqs.us-east-1.amazonaws.com</code> נפתר ל-endpoint בתוך ה-VPC הזה. מ-on-prem או מ-VPC מחובר ב-peering, הוא עדיין נפתר ל-IP הציבורי עד שמגדירים DNS forwarding נכון (ראה בהמשך).</blockquote>`
      }
    },
    {
      h: { en: "To on-prem and to people: IPsec, WireGuard, client VPN, Direct Connect", he: "ל-on-prem ולאנשים: IPsec, WireGuard, client VPN, Direct Connect" },
      body: {
        en: `<table>
<tr><th>Option</th><th>Throughput</th><th>Setup time</th><th>Notes</th></tr>
<tr><td><strong>AWS Site-to-Site VPN</strong> (IPsec)</td><td>~1.25 Gbps per tunnel; ECMP over several connections on a TGW for more</td><td>Hours</td><td>~$0.05/hour per connection; 2 tunnels to 2 AWS endpoints - configure both. BGP (dynamic) for automatic failover.</td></tr>
<tr><td><strong>Azure VPN Gateway</strong> / <strong>GCP HA VPN</strong></td><td>Depends on SKU (Azure up to ~10 Gbps aggregate); GCP ~3 Gbps per tunnel</td><td>Hours</td><td>GCP HA VPN gives a 99.99% SLA with 2 interfaces / 4 tunnels.</td></tr>
<tr><td><strong>Direct Connect / ExpressRoute / Interconnect</strong></td><td>Dedicated 1, 10, 100 (400) Gbps; hosted 50 Mbps-25 Gbps via partners</td><td>Weeks (cross-connect at a colo)</td><td>Private, predictable latency, lower per-GB egress. <strong>Not encrypted by default</strong> - use MACsec or IPsec over it. Two links in two locations for resilience.</td></tr>
<tr><td><strong>WireGuard</strong></td><td>Multi-Gbps on modern CPUs</td><td>Minutes</td><td>UDP (default 51820), ~4,000 lines of code, in the Linux kernel since 5.6. Base of Tailscale and many mesh VPNs.</td></tr>
<tr><td><strong>Client VPN</strong> (AWS Client VPN, OpenVPN, ZTNA)</td><td>Per user</td><td>Hours</td><td>For people, not sites. Modern setups prefer identity-aware access (ZTNA) over flat network access.</td></tr>
</table>
<pre># minimal WireGuard peer (wg0.conf)
[Interface]
Address    = 10.99.0.2/24
PrivateKey = &lt;client-private-key&gt;
[Peer]
PublicKey  = &lt;server-public-key&gt;
Endpoint   = vpn.example.com:51820
AllowedIPs = 10.20.0.0/16        # only route the VPC through the tunnel
PersistentKeepalive = 25          # keep NAT mappings alive</pre>
<blockquote>💡 Real world: the standard enterprise design is <strong>Direct Connect primary + Site-to-Site VPN backup</strong>, both advertising the same prefixes via BGP. AWS prefers DX routes for the same prefix, so the VPN carries traffic only when DX is down.</blockquote>`,
        he: `<table>
<tr><th>אפשרות</th><th>Throughput</th><th>זמן הקמה</th><th>הערות</th></tr>
<tr><td><strong>AWS Site-to-Site VPN</strong> (IPsec)</td><td>כ-1.25Gbps ל-tunnel; ECMP על כמה חיבורים ב-TGW בשביל יותר</td><td>שעות</td><td>כ-$0.05 לשעה לחיבור; 2 tunnels ל-2 endpoints של AWS - להגדיר את שניהם. BGP (dynamic) בשביל failover אוטומטי.</td></tr>
<tr><td><strong>Azure VPN Gateway</strong> / <strong>GCP HA VPN</strong></td><td>תלוי ב-SKU (ב-Azure עד כ-10Gbps מצטבר); ב-GCP כ-3Gbps ל-tunnel</td><td>שעות</td><td>HA VPN של GCP נותן SLA של 99.99% עם 2 interfaces ו-4 tunnels.</td></tr>
<tr><td><strong>Direct Connect / ExpressRoute / Interconnect</strong></td><td>ייעודי: 1, 10, 100 (400) Gbps; hosted: 50Mbps עד 25Gbps דרך שותפים</td><td>שבועות (cross-connect ב-colo)</td><td>פרטי, latency צפוי, egress זול יותר ל-GB. <strong>לא מוצפן כברירת מחדל</strong> - משתמשים ב-MACsec או IPsec מעליו. שני קווים בשני מיקומים בשביל שרידות.</td></tr>
<tr><td><strong>WireGuard</strong></td><td>כמה Gbps על מעבדים מודרניים</td><td>דקות</td><td>UDP (ברירת מחדל 51820), כ-4,000 שורות קוד, ב-kernel של Linux מגרסה 5.6. הבסיס של Tailscale ושל הרבה mesh VPNs.</td></tr>
<tr><td><strong>Client VPN</strong> (AWS Client VPN, OpenVPN, ZTNA)</td><td>לכל משתמש</td><td>שעות</td><td>לאנשים, לא לאתרים. הקמות מודרניות מעדיפות גישה מבוססת זהות (ZTNA) על פני גישה שטוחה לרשת.</td></tr>
</table>
<pre># minimal WireGuard peer (wg0.conf)
[Interface]
Address    = 10.99.0.2/24
PrivateKey = &lt;client-private-key&gt;
[Peer]
PublicKey  = &lt;server-public-key&gt;
Endpoint   = vpn.example.com:51820
AllowedIPs = 10.20.0.0/16        # only route the VPC through the tunnel
PersistentKeepalive = 25          # keep NAT mappings alive</pre>
<blockquote>💡 מהשטח: התכנון הארגוני הסטנדרטי הוא <strong>Direct Connect ראשי + Site-to-Site VPN כגיבוי</strong>, כששניהם מכריזים על אותם prefixes ב-BGP. AWS מעדיף routes של DX לאותו prefix, אז ה-VPN נושא תעבורה רק כש-DX למטה.</blockquote>`
      }
    },
    {
      h: { en: "Overlapping CIDRs and DNS across networks", he: "CIDRs חופפים ו-DNS בין רשתות" },
      body: {
        en: `<p><strong>Overlapping CIDRs</strong> are the most expensive mistake in this whole area: two VPCs (or a VPC and the office) both using <code>10.0.0.0/16</code> can't be peered, attached to the same TGW route table, or routed over VPN. It happens after acquisitions, or when every team accepts the console default. Options, from best to worst:</p>
<ol>
<li>Prevent it: central IPAM (AWS VPC IPAM, a spreadsheet is better than nothing), one non-overlapping /16 per VPC from a reserved /8.</li>
<li><strong>PrivateLink</strong> for the few services that must cross.</li>
<li><strong>Private NAT</strong> (AWS private NAT Gateway, or NAT on a firewall) to translate one side into a non-overlapping range.</li>
<li>Re-IP the smaller network. Painful, but final.</li>
</ol>
<p><strong>DNS across networks</strong>: private zones are only visible where they're associated.</p>
<ul>
<li><strong>AWS Route 53 Resolver</strong>: <em>inbound endpoints</em> let on-prem DNS forward <code>*.aws.internal</code> and PrivateLink names into the VPC; <em>outbound endpoints + forwarding rules</em> send <code>corp.example.com</code> queries to on-prem DNS. ~$0.125/hour per endpoint ENI (2+ per endpoint). Share rules across accounts with RAM.</li>
<li><strong>Azure</strong>: Private DNS zones (e.g. <code>privatelink.blob.core.windows.net</code>) linked to VNets, plus DNS Private Resolver for hybrid forwarding. Forgetting to link the zone to the hub VNet is the #1 Private Endpoint bug.</li>
<li><strong>GCP</strong>: Cloud DNS private zones, forwarding zones and DNS peering.</li>
</ul>
<blockquote>⚠️ Production tip: when "it works from the VPC but not from the office", run <code>dig</code> from the office first. Nine times out of ten the name resolves to a public IP there, and traffic either goes over the Internet or gets blocked.</blockquote>`,
        he: `<p><strong>CIDRs חופפים</strong> הם הטעות הכי יקרה בכל התחום הזה: שני VPCs (או VPC והמשרד) שמשתמשים שניהם ב-<code>10.0.0.0/16</code> לא יכולים לעשות peering, להתחבר לאותו route table ב-TGW או להיות מנותבים על VPN. זה קורה אחרי רכישות, או כשכל צוות מקבל את ברירת המחדל של הקונסול. האפשרויות, מהטובה לגרועה:</p>
<ol>
<li>למנוע: IPAM מרכזי (AWS VPC IPAM; גם גיליון אקסל עדיף מכלום), /16 אחד שלא חופף לכל VPC מתוך /8 שמור.</li>
<li><strong>PrivateLink</strong> לכמה שירותים שחייבים לעבור.</li>
<li><strong>Private NAT</strong> (private NAT Gateway ב-AWS, או NAT על firewall) כדי לתרגם צד אחד לטווח שלא חופף.</li>
<li>לעשות re-IP לרשת הקטנה יותר. כואב, אבל סופי.</li>
</ol>
<p><strong>DNS בין רשתות</strong>: zones פרטיים נראים רק איפה שהם משויכים.</p>
<ul>
<li><strong>AWS Route 53 Resolver</strong>: <em>inbound endpoints</em> מאפשרים ל-DNS של ה-on-prem להעביר <code>*.aws.internal</code> ושמות של PrivateLink לתוך ה-VPC; <em>outbound endpoints + forwarding rules</em> שולחים שאילתות של <code>corp.example.com</code> ל-DNS של ה-on-prem. כ-$0.125 לשעה לכל ENI של endpoint (לפחות 2 לכל endpoint). משתפים rules בין accounts עם RAM.</li>
<li><strong>Azure</strong>: Private DNS zones (למשל <code>privatelink.blob.core.windows.net</code>) שמקושרים ל-VNets, ועוד DNS Private Resolver ל-forwarding היברידי. לשכוח לקשר את ה-zone ל-hub VNet זה הבאג מספר 1 של Private Endpoints.</li>
<li><strong>GCP</strong>: Cloud DNS private zones, forwarding zones ו-DNS peering.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: כש"זה עובד מה-VPC אבל לא מהמשרד", קודם תריץ <code>dig</code> מהמשרד. תשע פעמים מתוך עשר השם נפתר שם ל-IP ציבורי, והתעבורה או יוצאת לאינטרנט או נחסמת.</blockquote>`
      }
    },
    {
      h: { en: "Decision table", he: "טבלת החלטה" },
      body: {
        en: `<table>
<tr><th>Need</th><th>Use</th><th>Why not the others</th></tr>
<tr><td>2-3 VPCs talk to each other</td><td>VPC peering</td><td>TGW adds per-GB cost for no benefit at this size</td></tr>
<tr><td>10+ VPCs, many accounts, on-prem, central inspection</td><td>Transit Gateway / Virtual WAN</td><td>Peering is non-transitive; mesh explodes</td></tr>
<tr><td>Expose one service to other teams/customers, maybe overlapping CIDRs</td><td>PrivateLink / Private Endpoint</td><td>Peering exposes whole networks and needs unique CIDRs</td></tr>
<tr><td>Office/DC to cloud, quickly, modest bandwidth</td><td>Site-to-Site VPN (IPsec, BGP)</td><td>Direct Connect takes weeks</td></tr>
<tr><td>Steady multi-Gbps, predictable latency, big egress bill</td><td>Direct Connect / ExpressRoute + VPN backup</td><td>VPN tops out ~1.25 Gbps/tunnel over the Internet</td></tr>
<tr><td>Engineers reaching private resources</td><td>ZTNA / client VPN / SSM Session Manager</td><td>Site links give flat network access to everyone</td></tr>
<tr><td>Small team, servers anywhere, simple mesh</td><td>WireGuard (or Tailscale)</td><td>Cloud-managed VPNs are per-region and per-cloud</td></tr>
</table>
<blockquote>💡 Real world: when designing a new AWS org, teams usually start with a TGW in each region, a shared-services VPC, an inspection/egress VPC, Route 53 Resolver rules shared to every account, and an IPAM pool handing out /16s. Retrofitting any of these later costs months.</blockquote>`,
        he: `<table>
<tr><th>צורך</th><th>משתמשים ב-</th><th>למה לא באחרים</th></tr>
<tr><td>2-3 VPCs שמדברים ביניהם</td><td>VPC peering</td><td>TGW מוסיף עלות לכל GB בלי תועלת בגודל הזה</td></tr>
<tr><td>10+ VPCs, הרבה accounts, on-prem, inspection מרכזי</td><td>Transit Gateway / Virtual WAN</td><td>Peering לא טרנזיטיבי; ה-mesh מתפוצץ</td></tr>
<tr><td>לחשוף שירות אחד לצוותים/לקוחות אחרים, אולי עם CIDRs חופפים</td><td>PrivateLink / Private Endpoint</td><td>Peering חושף רשתות שלמות ודורש CIDRs ייחודיים</td></tr>
<tr><td>משרד/DC לענן, מהר, bandwidth צנוע</td><td>Site-to-Site VPN (IPsec, BGP)</td><td>Direct Connect לוקח שבועות</td></tr>
<tr><td>כמה Gbps קבועים, latency צפוי, חשבון egress גדול</td><td>Direct Connect / ExpressRoute + VPN כגיבוי</td><td>VPN מגיע לתקרה של כ-1.25Gbps ל-tunnel על האינטרנט</td></tr>
<tr><td>מהנדסים שצריכים להגיע למשאבים פרטיים</td><td>ZTNA / client VPN / SSM Session Manager</td><td>חיבורי אתרים נותנים גישה שטוחה לרשת לכולם</td></tr>
<tr><td>צוות קטן, שרתים בכל מקום, mesh פשוט</td><td>WireGuard (או Tailscale)</td><td>VPNs מנוהלים בענן הם לכל region ולכל ענן</td></tr>
</table>
<blockquote>💡 מהשטח: כשמתכננים AWS organization חדש, צוותים בדרך כלל מתחילים עם TGW בכל region, VPC של shared-services, VPC של inspection/egress, rules של Route 53 Resolver שמשותפים לכל account, ו-IPAM pool שמחלק /16-ים. להוסיף כל אחד מאלה בדיעבד עולה חודשים.</blockquote>`
      }
    }
  ],
  diagram: `                 on-prem DC 10.0.0.0/12
                  |  Direct Connect (primary, BGP)
                  |  Site-to-Site VPN (backup, 2 tunnels, BGP)
            +-----+---------------------------+
            |        Transit Gateway          |  rt-prod / rt-dev / rt-shared
            +--+--------+---------+--------+--+
               |        |         |        |
         prod VPC   dev VPC   shared VPC  inspection/egress VPC -> NAT -> Internet
       10.20.0.0/16 10.30.0.0/16 10.10.0.0/16
               |
        interface endpoint (PrivateLink) --> SaaS vendor (their CIDR may overlap - fine)

  DNS: on-prem DNS --> R53 inbound endpoint ;  R53 outbound endpoint --> corp.example.com`,
  handsOn: [
    { cmd: "aws ec2 describe-transit-gateway-route-tables --query 'TransitGatewayRouteTables[].TransitGatewayRouteTableId' --output text | xargs -n1 -I{} aws ec2 search-transit-gateway-routes --transit-gateway-route-table-id {} --filters Name=state,Values=active", what: { en: "Dump active routes in every TGW route table - the source of truth for who can reach whom.", he: "להוציא את ה-routes הפעילים בכל route table של TGW - מקור האמת לשאלה מי מגיע למי." } },
    { cmd: "aws ec2 describe-vpn-connections --query 'VpnConnections[].VgwTelemetry[].{ip:OutsideIpAddress,status:Status,msg:StatusMessage}'", what: { en: "Check both IPsec tunnels of each VPN connection. One DOWN tunnel = no redundancy left.", he: "לבדוק את שני ה-tunnels של IPsec בכל חיבור VPN. tunnel אחד DOWN = לא נשארה יתירות." } },
    { cmd: "aws ec2 describe-vpcs --query 'Vpcs[].[VpcId,CidrBlock]' --output text | sort -k2", what: { en: "List VPC CIDRs sorted, to spot overlaps before you try to peer or attach.", he: "לרשום CIDRs של VPCs ממוינים, כדי לזהות חפיפות לפני שמנסים peering או attach." } },
    { cmd: "dig +short secretsmanager.us-east-1.amazonaws.com", what: { en: "From inside the VPC and from on-prem: a 10.x answer means the interface endpoint is used, a public IP means DNS isn't forwarded.", he: "מתוך ה-VPC ומה-on-prem: תשובה של 10.x אומרת שה-interface endpoint בשימוש, IP ציבורי אומר שה-DNS לא מועבר." } },
    { cmd: "sudo wg show", what: { en: "On a WireGuard host: peers, latest handshake and bytes transferred. No handshake in 2+ minutes = tunnel is down.", he: "על host של WireGuard: peers, ה-handshake האחרון ו-bytes שהועברו. אין handshake יותר מ-2 דקות = ה-tunnel למטה." } }
  ],
  mnemonic: {
    en: "\"Peering is a bridge, Transit is a lobby, PrivateLink is a window, VPN is an armored van, Direct Connect is your own road.\" And: plan CIDRs and DNS before cables.",
    he: "\"Peering זה גשר, Transit זה לובי, PrivateLink זה אשנב, VPN זה רכב משוריין, Direct Connect זה כביש משלך.\" ועוד: מתכננים CIDRs ו-DNS לפני כבלים."
  },
  pitfalls: [
    { en: "Using the default 10.0.0.0/16 everywhere, then discovering after an acquisition that nothing can be peered.", he: "להשתמש בברירת המחדל 10.0.0.0/16 בכל מקום, ואז לגלות אחרי רכישה ששום דבר לא ניתן ל-peering." },
    { en: "Configuring only one of the two AWS VPN tunnels - AWS maintenance will take it down and your link with it.", he: "להגדיר רק אחד משני ה-tunnels של VPN ב-AWS - תחזוקה של AWS תפיל אותו ואת החיבור שלך איתו." },
    { en: "Assuming Direct Connect is encrypted. It's a private circuit, not an encrypted one; add MACsec or IPsec if compliance requires it.", he: "להניח ש-Direct Connect מוצפן. זה קו פרטי, לא מוצפן; מוסיפים MACsec או IPsec אם ה-compliance דורש." },
    { en: "Creating Private Endpoints without fixing DNS, so on-prem clients still resolve the public IP and bypass the endpoint.", he: "ליצור Private Endpoints בלי לסדר DNS, כך ש-clients ב-on-prem עדיין מקבלים את ה-IP הציבורי ועוקפים את ה-endpoint." }
  ],
  interview: [
    {
      q: { en: "You have 30 VPCs across 10 accounts plus an office. How do you connect them?", he: "יש לך 30 VPCs על פני 10 accounts ועוד משרד. איך מחברים אותם?" },
      a: { en: "Transit Gateway per region, shared via RAM, with separate route tables for prod, non-prod and shared services so environments are isolated by routing. The office connects via Site-to-Site VPN (BGP, both tunnels) to the TGW, upgraded to Direct Connect with VPN backup when bandwidth justifies it. Central egress/inspection VPC, IPAM for non-overlapping CIDRs, Route 53 Resolver endpoints and shared forwarding rules for hybrid DNS. PrivateLink for services consumed across org boundaries.", he: "Transit Gateway לכל region, משותף דרך RAM, עם route tables נפרדים ל-prod, non-prod ו-shared services כך שהסביבות מבודדות ברמת ה-routing. המשרד מתחבר ב-Site-to-Site VPN (BGP, שני ה-tunnels) ל-TGW, ועובר ל-Direct Connect עם VPN כגיבוי כשה-bandwidth מצדיק את זה. VPC מרכזי ל-egress/inspection, IPAM ל-CIDRs שלא חופפים, endpoints של Route 53 Resolver ו-forwarding rules משותפים ל-DNS היברידי. PrivateLink לשירותים שנצרכים מעבר לגבולות הארגון." }
    },
    {
      q: { en: "When would you choose PrivateLink over VPC peering?", he: "מתי תבחר PrivateLink על פני VPC peering?" },
      a: { en: "When you want to expose one service rather than a whole network, when CIDRs overlap, when the consumer is another company or many teams, or when you need one-way access (consumer to provider only). Peering is better for broad, bidirectional, high-volume traffic between networks you control with unique CIDRs, since it has no per-hour endpoint or per-GB processing charge.", he: "כשרוצים לחשוף שירות אחד ולא רשת שלמה, כש-CIDRs חופפים, כשהצרכן הוא חברה אחרת או הרבה צוותים, או כשצריך גישה חד-כיוונית (רק מהצרכן לספק). Peering עדיף לתעבורה רחבה, דו-כיוונית ובנפח גבוה בין רשתות שבשליטתך עם CIDRs ייחודיים, כי אין בו תשלום שעתי על endpoint או תשלום processing לכל GB." }
    }
  ],
  quiz: [
    {
      q: { en: "VPC A is peered with VPC B, which has a NAT Gateway and a VPN to the office. What can A use through B?", he: "VPC A מחובר ב-peering ל-VPC B, שיש בו NAT Gateway ו-VPN למשרד. במה A יכול להשתמש דרך B?" },
      options: [
        { en: "Both the NAT Gateway and the VPN", he: "גם ב-NAT Gateway וגם ב-VPN" },
        { en: "Only the VPN", he: "רק ב-VPN" },
        { en: "Nothing - peering is non-transitive; A only reaches resources inside B", he: "כלום - peering לא טרנזיטיבי; A מגיע רק למשאבים בתוך B" },
        { en: "Only the NAT Gateway", he: "רק ב-NAT Gateway" }
      ],
      answer: 2,
      explain: { en: "Peering doesn't support edge-to-edge routing: no transit through B's NAT, IGW, VPN or Direct Connect. Use a Transit Gateway for shared egress and hybrid links.", he: "Peering לא תומך ב-edge-to-edge routing: אין מעבר דרך ה-NAT, ה-IGW, ה-VPN או ה-Direct Connect של B. ל-egress משותף ולחיבורים היברידיים משתמשים ב-Transit Gateway." }
    },
    {
      q: { en: "You need 5 Gbps of steady, predictable bandwidth from your data center to AWS. Best primary option?", he: "צריך 5Gbps קבועים וצפויים מה-data center ל-AWS. מה האפשרות הראשית הכי טובה?" },
      options: [
        { en: "Direct Connect (10 Gbps) with a Site-to-Site VPN as backup", he: "Direct Connect (10Gbps) עם Site-to-Site VPN כגיבוי" },
        { en: "A single Site-to-Site VPN tunnel", he: "tunnel יחיד של Site-to-Site VPN" },
        { en: "VPC peering to the data center", he: "VPC peering ל-data center" },
        { en: "PrivateLink", he: "PrivateLink" }
      ],
      answer: 0,
      explain: { en: "One AWS VPN tunnel is ~1.25 Gbps over the Internet. Peering and PrivateLink are VPC-side constructs, not on-prem links. DX gives dedicated bandwidth; VPN covers DX outages.", he: "tunnel אחד של VPN ב-AWS הוא כ-1.25Gbps על האינטרנט. Peering ו-PrivateLink הם מבנים בצד ה-VPC, לא חיבורים ל-on-prem. DX נותן bandwidth ייעודי; ה-VPN מכסה נפילות של DX." }
    },
    {
      q: { en: "You created an interface endpoint for Secrets Manager. From the VPC it works; from on-prem over VPN, traffic still goes to the public endpoint. Why?", he: "יצרת interface endpoint ל-Secrets Manager. מתוך ה-VPC זה עובד; מה-on-prem דרך VPN, התעבורה עדיין הולכת ל-endpoint הציבורי. למה?" },
      options: [
        { en: "The VPN doesn't support HTTPS", he: "ה-VPN לא תומך ב-HTTPS" },
        { en: "On-prem DNS resolves the public name to the public IP; it needs to forward to a Route 53 Resolver inbound endpoint", he: "ה-DNS של ה-on-prem פותר את השם הציבורי ל-IP ציבורי; צריך להעביר ל-inbound endpoint של Route 53 Resolver" },
        { en: "Interface endpoints only work for EC2 in the same AZ", he: "Interface endpoints עובדים רק ל-EC2 באותו AZ" },
        { en: "The security group blocks on-prem", he: "ה-security group חוסם את ה-on-prem" }
      ],
      answer: 1,
      explain: { en: "Private DNS for the endpoint only applies inside the VPC's resolver. On-prem resolvers must conditionally forward the AWS service domain to a Resolver inbound endpoint.", he: "ה-private DNS של ה-endpoint חל רק בתוך ה-resolver של ה-VPC. resolvers ב-on-prem צריכים להעביר את הדומיין של שירות AWS (conditional forwarding) ל-inbound endpoint של ה-Resolver." }
    },
    {
      q: { en: "Two VPCs both use 10.0.0.0/16 and one service in VPC X must be called from VPC Y. Quickest safe option?", he: "שני VPCs משתמשים שניהם ב-10.0.0.0/16, ושירות אחד ב-VPC X צריך להיקרא מ-VPC Y. מה האפשרות המהירה והבטוחה?" },
      options: [
        { en: "VPC peering with more-specific routes", he: "VPC peering עם routes ספציפיים יותר" },
        { en: "Attach both to the same Transit Gateway route table", he: "לחבר את שניהם לאותו route table ב-Transit Gateway" },
        { en: "Expose the service publicly", he: "לחשוף את השירות לאינטרנט" },
        { en: "PrivateLink: NLB + endpoint service in X, interface endpoint in Y", he: "PrivateLink: NLB ו-endpoint service ב-X, interface endpoint ב-Y" }
      ],
      answer: 3,
      explain: { en: "Peering and TGW can't route between identical CIDRs. PrivateLink gives Y a local IP from its own range that maps to X's service, so overlap is irrelevant.", he: "Peering ו-TGW לא יכולים לנתב בין CIDRs זהים. PrivateLink נותן ל-Y כתובת IP מקומית מהטווח שלו שממופה לשירות של X, אז החפיפה לא רלוונטית." }
    }
  ],
  playground: "cidr",
  related: ["net-vpc", "net-ip-cidr", "net-dns", "net-firewalls", "net-isolation", "net-bgp-anycast"]
});

/* ----------------------------------------------------------- Glossary */
window.INFRA.glossary.push(
  { term: "TIME_WAIT", track: "networking", def: { en: "TCP state kept for 60 s (Linux) by the side that closed first, so delayed segments can't corrupt a new connection with the same 4-tuple; normal, but floods of it exhaust source ports.", he: "State של TCP שהצד שסגר ראשון מחזיק 60 שניות (ב-Linux), כדי ש-segments מאוחרים לא ישבשו חיבור חדש עם אותו 4-tuple; תקין, אבל הצפה שלו גומרת source ports." }, lesson: "net-tcp-deep" },
  { term: "CLOSE_WAIT", track: "networking", def: { en: "TCP state where the peer has closed but the local application hasn't called close(); a growing count is a socket leak and never times out.", he: "State של TCP שבו הצד השני סגר אבל האפליקציה המקומית עוד לא קראה ל-close(); מספר שגדל הוא דליפת sockets, והוא אף פעם לא עושה timeout." }, lesson: "net-tcp-deep" },
  { term: "BBR", track: "networking", def: { en: "Google's TCP congestion control that paces sending at the measured bottleneck bandwidth and minimum RTT instead of reacting to packet loss like CUBIC.", he: "אלגוריתם congestion control של Google ל-TCP ששולח בקצב של ה-bandwidth הנמדד בצוואר הבקבוק וה-RTT המינימלי, במקום להגיב ל-packet loss כמו CUBIC." }, lesson: "net-tcp-deep" },
  { term: "conntrack", track: "networking", def: { en: "The Linux netfilter connection-tracking table that remembers every flow for NAT and stateful firewalling; when nf_conntrack_max is reached, new flows are dropped.", he: "טבלת ה-connection tracking של netfilter ב-Linux שזוכרת כל flow בשביל NAT ו-firewall stateful; כשמגיעים ל-nf_conntrack_max, flows חדשים נזרקים." }, lesson: "net-nat-conntrack" },
  { term: "SNAT / DNAT", track: "networking", def: { en: "Source NAT rewrites the source address of outgoing packets (many hosts share a public IP); destination NAT rewrites the destination of incoming ones (port forwarding, Kubernetes Services).", he: "Source NAT משכתב את כתובת המקור של packets יוצאים (הרבה hosts חולקים IP ציבורי); destination NAT משכתב את היעד של packets נכנסים (port forwarding, Services ב-Kubernetes)." }, lesson: "net-nat-conntrack" },
  { term: "Masquerade", track: "networking", def: { en: "A form of SNAT that rewrites the source to whatever IP the outgoing interface currently has; used on routers with dynamic IPs and by Kubernetes for Pod egress.", he: "סוג של SNAT שמשכתב את המקור ל-IP שיש כרגע לממשק היוצא; משמש בראוטרים עם IPs דינמיים וב-Kubernetes ל-egress של Pods." }, lesson: "net-nat-conntrack" },
  { term: "BGP", track: "networking", def: { en: "Border Gateway Protocol: the path-vector routing protocol (TCP 179) that autonomous systems use to exchange reachability for IP prefixes; also used for Direct Connect, Calico and MetalLB.", he: "Border Gateway Protocol: פרוטוקול ה-routing מסוג path-vector (TCP 179) שדרכו autonomous systems מחליפים מידע על נגישות ל-prefixes; משמש גם ב-Direct Connect, Calico ו-MetalLB." }, lesson: "net-bgp-anycast" },
  { term: "Autonomous System (ASN)", track: "networking", def: { en: "A network under a single routing policy, identified by an AS number (e.g. Cloudflare AS13335); private ASNs 64512-65534 are used internally.", he: "רשת תחת מדיניות routing אחת, שמזוהה במספר AS (למשל Cloudflare זה AS13335); ASNs פרטיים 64512-65534 משמשים בתוך הארגון." }, lesson: "net-bgp-anycast" },
  { term: "RPKI", track: "networking", def: { en: "Resource Public Key Infrastructure: signed ROAs that state which AS may originate a prefix and its max length, so networks can drop hijacked or leaked announcements.", he: "Resource Public Key Infrastructure: ROAs חתומים שקובעים איזה AS רשאי להכריז על prefix ומה ה-max length, כך שרשתות יכולות לזרוק הכרזות חטופות או שדלפו." }, lesson: "net-bgp-anycast" },
  { term: "VPC peering", track: "networking", def: { en: "A direct, non-transitive private link between two VPCs/VNets over the provider backbone; no hourly fee, but CIDRs must not overlap.", he: "חיבור פרטי ישיר ולא טרנזיטיבי בין שני VPCs/VNets על ה-backbone של הספק; בלי תשלום שעתי, אבל ה-CIDRs אסור שיחפפו." }, lesson: "net-hybrid-connectivity" },
  { term: "Site-to-Site VPN", track: "networking", def: { en: "Encrypted IPsec tunnels over the Internet between an on-prem router and a cloud gateway; quick to set up, ~1.25 Gbps per tunnel on AWS.", he: "Tunnels מוצפנים של IPsec מעל האינטרנט בין router ב-on-prem ל-gateway בענן; מהיר להקמה, כ-1.25Gbps ל-tunnel ב-AWS." }, lesson: "net-hybrid-connectivity" },
  { term: "Direct Connect", track: "networking", def: { en: "AWS's dedicated private circuit from your data center to AWS (Azure ExpressRoute, GCP Interconnect); 1-100+ Gbps, BGP-routed, not encrypted by default.", he: "הקו הפרטי הייעודי של AWS מה-data center שלך ל-AWS (ב-Azure זה ExpressRoute, ב-GCP זה Interconnect); 1-100+ Gbps, מנותב ב-BGP, לא מוצפן כברירת מחדל." }, lesson: "net-hybrid-connectivity" }
);

/* ----------------------------------------------------------- Scenario */
window.INFRA.scenarios.push({
  id: "conntrack-full",
  icon: "🧱",
  title: { en: "Random timeouts on one node: the table is full", he: "Timeouts אקראיים על node אחד: הטבלה מלאה" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Black Friday, 21:40. Alerts: 'checkout-api p99 &gt; 3s' and 'error rate 4%'. Errors are connection timeouts to Redis, Postgres and even CoreDNS. Dashboards show CPU and memory are fine. Traffic is 3x normal.",
        he: "Black Friday, 21:40. Alerts: 'checkout-api p99 &gt; 3s' ו-'error rate 4%'. השגיאות הן connection timeouts ל-Redis, ל-Postgres ואפילו ל-CoreDNS. בדשבורדים CPU וזיכרון תקינים. התעבורה פי 3 מהרגיל."
      },
      data: `$ kubectl get pods -n shop -l app=checkout-api -o wide | awk '{print $1, $3, $7}'
NAME                           STATUS   NODE
checkout-api-6c9f-2kq7d        Running  ip-10-0-3-41
checkout-api-6c9f-8vx2m        Running  ip-10-0-3-41
checkout-api-6c9f-qt4lp        Running  ip-10-0-5-12
checkout-api-6c9f-zz81n        Running  ip-10-0-6-88

# errors by node (last 10 min)
ip-10-0-3-41   1,912
ip-10-0-5-12       3
ip-10-0-6-88       1`,
      choices: [
        { label: { en: "Errors cluster on one node - SSH/debug into ip-10-0-3-41 and look at the kernel", he: "השגיאות מרוכזות ב-node אחד - להיכנס ל-ip-10-0-3-41 ולבדוק את ה-kernel" }, next: "s2", score: 15,
          feedback: { en: "Good read of the data: errors from many different dependencies but one node point at the node, not at Redis or Postgres.", he: "קריאה טובה של הדאטה: שגיאות מהרבה תלויות שונות אבל מ-node אחד מצביעות על ה-node, לא על Redis או Postgres." } },
        { label: { en: "Scale checkout-api from 4 to 12 replicas", he: "להגדיל את checkout-api מ-4 ל-12 replicas" }, next: "s2b", score: 0,
          feedback: { en: "Understandable under pressure, but you haven't found the cause. If the node is the problem, new Pods landing there make it worse.", he: "מובן תחת לחץ, אבל עוד לא מצאת את הסיבה. אם ה-node הוא הבעיה, Pods חדשים שינחתו עליו יחמירו את המצב." } },
        { label: { en: "Restart the Redis cluster - timeouts to Redis are the most common", he: "לעשות restart ל-cluster של Redis - רוב ה-timeouts הם ל-Redis" }, next: "lose", score: -15,
          feedback: { en: "Redis is healthy for the other nodes. Restarting it drops every cart session across the whole site during peak.", he: "Redis תקין מול שאר ה-nodes. restart שלו מפיל את כל ה-sessions של העגלות בכל האתר בשיא העומס." } }
      ]
    },
    s2b: {
      text: {
        en: "The new replicas come up. The scheduler puts 3 of them on ip-10-0-3-41 (it has the most free CPU). Errors from that node go up, not down.",
        he: "ה-replicas החדשים עולים. ה-scheduler שם 3 מהם על ip-10-0-3-41 (יש לו הכי הרבה CPU פנוי). השגיאות מה-node הזה עולות, לא יורדות."
      },
      data: `errors/min  ip-10-0-3-41: 190 -> 340`,
      choices: [
        { label: { en: "OK, stop guessing: debug the node itself", he: "טוב, מפסיקים לנחש: בודקים את ה-node עצמו" }, next: "s2", score: 5,
          feedback: { en: "Better late than never. The pattern was node-local from the start.", he: "מוטב מאוחר מאשר אף פעם. הדפוס היה מקומי ל-node מההתחלה." } },
        { label: { en: "Scale to 30 replicas", he: "להגדיל ל-30 replicas" }, next: "lose", score: -10,
          feedback: { en: "More Pods on a broken node = more failing connections.", he: "יותר Pods על node שבור = יותר חיבורים שנכשלים." } }
      ]
    },
    s2: {
      text: {
        en: "You open a debug shell on the node. Load is normal. You check the kernel log.",
        he: "פתחת debug shell על ה-node. ה-load תקין. בודקים את הלוג של ה-kernel."
      },
      data: `$ dmesg -T | tail -4
[Fri Nov 27 21:38:02 2026] nf_conntrack: nf_conntrack: table full, dropping packet
[Fri Nov 27 21:38:02 2026] nf_conntrack: nf_conntrack: table full, dropping packet
[Fri Nov 27 21:38:03 2026] net_ratelimit: 2141 callbacks suppressed
[Fri Nov 27 21:38:03 2026] nf_conntrack: nf_conntrack: table full, dropping packet

$ cat /proc/sys/net/netfilter/nf_conntrack_count /proc/sys/net/netfilter/nf_conntrack_max
131072
131072`,
      choices: [
        { label: { en: "Find out who is filling the table before touching anything", he: "לברר מי ממלא את הטבלה לפני שנוגעים במשהו" }, next: "s3", score: 15,
          feedback: { en: "Right. A full table is a symptom; something on this node creates far more flows than the others.", he: "נכון. טבלה מלאה היא סימפטום; משהו על ה-node הזה יוצר הרבה יותר flows מהשאר." } },
        { label: { en: "Raise nf_conntrack_max to 524288 right now as mitigation, then investigate", he: "להעלות את nf_conntrack_max ל-524288 מיד כ-mitigation, ואז לחקור" }, next: "s3", score: 10,
          feedback: { en: "Reasonable: it's safe (~300 bytes per entry, ~150 MB) and buys time. Just don't stop there.", he: "סביר: זה בטוח (כ-300 בייט לרשומה, כ-150MB) וקונה זמן. רק אל תעצור שם." } },
        { label: { en: "Flush the whole table with conntrack -F", he: "לרוקן את כל הטבלה עם conntrack -F" }, next: "lose", score: -10,
          feedback: { en: "Flushing breaks every established NATed flow on the node (Service connections, egress) and the table refills in seconds.", he: "ריקון שובר כל flow קיים שעבר NAT על ה-node (חיבורים ל-Services, egress), והטבלה מתמלאת שוב תוך שניות." } }
      ]
    },
    s3: {
      text: {
        en: "You group conntrack entries by state and destination.",
        he: "מקבצים את רשומות ה-conntrack לפי state ויעד."
      },
      data: `$ conntrack -L 2>/dev/null | awk '{print $4}' | sort | uniq -c | sort -rn | head -3
 118230 TIME_WAIT
   9411 ESTABLISHED
   2980 SYN_SENT

$ conntrack -L -p tcp --state TIME_WAIT 2>/dev/null | grep -o 'dst=[0-9.]* sport=[0-9]* dport=[0-9]*' | awk '{print $1, $3}' | sort | uniq -c | sort -rn | head -2
 104882 dst=10.100.41.7 dport=443     # fraud-check.internal (ClusterIP)
   6120 dst=10.100.0.10 dport=53

$ ss -tanp state time-wait | wc -l
109877`,
      choices: [
        { label: { en: "Something opens a new TCP connection per request to fraud-check. Check the client code/config of the Pods on this node", he: "משהו פותח חיבור TCP חדש לכל request ל-fraud-check. לבדוק את קוד/קונפיג ה-client של ה-Pods על ה-node" }, next: "s4", score: 15,
          feedback: { en: "Exactly. ~105k TIME_WAIT entries to one ClusterIP = connection churn, not a leak and not an attack.", he: "בדיוק. כ-105 אלף רשומות TIME_WAIT ל-ClusterIP אחד = churn של חיבורים, לא דליפה ולא מתקפה." } },
        { label: { en: "It's a DDoS - block 10.100.41.7 with a NetworkPolicy", he: "זה DDoS - לחסום את 10.100.41.7 עם NetworkPolicy" }, next: "lose", score: -15,
          feedback: { en: "10.100.41.7 is your own fraud-check Service. Blocking it means every checkout fails the fraud check.", he: "10.100.41.7 זה ה-Service של fraud-check שלכם. לחסום אותו אומר שכל checkout ייכשל בבדיקת ה-fraud." } }
      ]
    },
    s4: {
      text: {
        en: "Both checkout-api Pods on this node run with feature flag 'fraud_v2=on' (a canary since this morning). The new fraud client creates a fresh HTTPS client per request with keep-alive disabled. At ~900 req/s, every connection leaves a TIME_WAIT conntrack entry for 120 s: ~108k entries. What now?",
        he: "שני ה-Pods של checkout-api על ה-node הזה רצים עם feature flag 'fraud_v2=on' (canary מהבוקר). ה-client החדש של fraud יוצר HTTPS client חדש לכל request עם keep-alive כבוי. בכ-900 requests בשנייה, כל חיבור משאיר רשומת TIME_WAIT ב-conntrack ל-120 שניות: כ-108 אלף רשומות. מה עכשיו?"
      },
      data: `client config (fraud_v2):
  http.Transport{ DisableKeepAlives: true }   // created inside handler()

900 conn/s x 120 s (nf_conntrack_tcp_timeout_time_wait) = 108,000 entries`,
      choices: [
        { label: { en: "Turn fraud_v2 off for the canary now, raise nf_conntrack_max as a safety net, and fix the client to reuse one pooled transport", he: "לכבות את fraud_v2 ב-canary עכשיו, להעלות את nf_conntrack_max כרשת ביטחון, ולתקן את ה-client לשימוש חוזר ב-transport אחד עם pool" }, next: "win", score: 20,
          feedback: { en: "Mitigate fast with the flag, add headroom, fix the root cause. Errors drop to zero within two minutes as TIME_WAIT entries expire.", he: "mitigation מהיר עם ה-flag, מרווח ביטחון, ותיקון שורש. השגיאות יורדות לאפס תוך שתי דקות כשרשומות ה-TIME_WAIT פגות." } },
        { label: { en: "Just set nf_conntrack_tcp_timeout_time_wait to 1 second on all nodes", he: "פשוט להגדיר nf_conntrack_tcp_timeout_time_wait לשנייה אחת על כל ה-nodes" }, next: "lose", score: -5,
          feedback: { en: "It hides the symptom on this node, but the client still burns a TCP + TLS handshake per request (latency and CPU), and the next service with churn will hit ephemeral port limits instead.", he: "זה מסתיר את הסימפטום על ה-node, אבל ה-client עדיין שורף handshake של TCP ו-TLS לכל request (latency ו-CPU), והשירות הבא עם churn ייתקע במקום זה על גבול ה-ephemeral ports." } }
      ]
    },
    win: {
      text: {
        en: "Resolved at 21:58. Postmortem actions: alert on conntrack usage &gt; 80% per node, a lint rule against creating HTTP clients inside handlers, and canaries spread across nodes so a bad build can't hide on one host.",
        he: "נפתר ב-21:58. Action items מה-postmortem: alert על שימוש ב-conntrack מעל 80% לכל node, חוק lint נגד יצירת HTTP clients בתוך handlers, ו-canaries שמפוזרים בין nodes כדי ש-build גרוע לא יתחבא על host אחד."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "The incident drags past midnight and costs the biggest sales hour of the year. Lesson: errors to many dependencies from one node point at the node - read dmesg, then find who fills the conntrack table.",
        he: "האינסידנט נמשך אחרי חצות ועולה את שעת המכירות הכי גדולה בשנה. הלקח: שגיאות להרבה תלויות מ-node אחד מצביעות על ה-node - קוראים dmesg, ואז מוצאים מי ממלא את טבלת ה-conntrack."
      },
      end: "lose"
    }
  },
  lessons: ["net-nat-conntrack", "net-tcp-deep", "net-troubleshooting", "k8s-services"]
});
