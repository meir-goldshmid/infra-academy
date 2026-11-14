window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Errors decoded (network, TLS, HTTP) + hashing & encryption in practice
   ========================================================================= */

/* ------------------------------------------------------------------ 1 */
window.INFRA.lessons.push({
  id: "net-errors-by-layer",
  track: "networking",
  order: 40,
  icon: "🧱",
  level: 2,
  minutes: 18,
  title: { en: "Network Errors Layer by Layer", he: "שגיאות רשת שכבה אחרי שכבה" },
  tldr: {
    en: "Every network error string is a clue about which layer said no: 'refused' means something answered with a RST (L4 reachable, nothing listening or a REJECT rule), 'timed out' means silence (a firewall/SG dropped it or the host is gone), 'no route' and 'unreachable' are L3, 'reset by peer' is a live connection killed mid-way, and NXDOMAIN/SERVFAIL never even got to the network.",
    he: "כל הודעת שגיאה ברשת היא רמז לאיזו שכבה אמרה לא: 'refused' אומר שמישהו ענה עם RST (ה-host נגיש ב-L4, אבל אף אחד לא מאזין או שיש חוק REJECT), 'timed out' אומר שקט (firewall או SG זרק את ה-packet, או שה-host לא קיים), 'no route' ו-'unreachable' הם L3, 'reset by peer' זה חיבור חי שנהרג באמצע, ו-NXDOMAIN או SERVFAIL בכלל לא הגיעו לרשת."
  },
  analogy: {
    en: "You knock on a door. If someone shouts 'nobody here by that name!' instantly, that's Connection refused — the building exists and answered. If you knock and hear nothing for two minutes, that's a timeout — maybe a guard at the gate quietly turned you away before you ever reached the door. If the taxi driver says 'there is no road to that street', that's No route to host. And if the address isn't in the phone book at all, that's NXDOMAIN — you never left home.",
    he: "אתה דופק בדלת. אם מישהו צועק מיד 'אין פה אף אחד בשם הזה!' — זה Connection refused: הבניין קיים וענה. אם אתה דופק ולא שומע כלום שתי דקות — זה timeout: אולי שומר בשער סילק אותך בשקט עוד לפני שהגעת לדלת. אם נהג המונית אומר 'אין דרך לרחוב הזה' — זה No route to host. ואם הכתובת בכלל לא מופיעה בספר הטלפונים — זה NXDOMAIN: לא יצאת מהבית."
  },
  sections: [
    {
      h: { en: "The core four: refused, timed out, unreachable, reset", he: "ארבע הבסיסיות: refused, timed out, unreachable, reset" },
      body: {
        en: `<p>The kernel turns what happened on the wire into an <code>errno</code>; every language and tool just prints it differently. Learn the errno, and you can read any stack.</p>
<table>
<tr><th>errno (Linux #)</th><th>Text</th><th>What happened on the wire</th><th>Usual cause</th></tr>
<tr><td>ECONNREFUSED (111)</td><td>Connection refused</td><td>SYN → <strong>RST</strong> back (or ICMP port-unreachable)</td><td>Host is up but nothing listens on that port; app bound to 127.0.0.1 only; iptables REJECT</td></tr>
<tr><td>ETIMEDOUT (110)</td><td>Connection timed out</td><td>SYN → <strong>silence</strong>, retried ~6 times (~127 s on Linux defaults)</td><td>Security Group / NACL / firewall DROP, wrong IP, host down, asymmetric routing</td></tr>
<tr><td>EHOSTUNREACH (113)</td><td>No route to host</td><td>ICMP host-unreachable, or ARP got no answer on the local subnet</td><td>Host down on the same L2 segment; firewalld REJECT with <code>icmp-host-prohibited</code></td></tr>
<tr><td>ENETUNREACH (101)</td><td>Network is unreachable</td><td>Nothing left the box: no route in the local table</td><td>No default route, IPv6 address but no IPv6 connectivity, interface down</td></tr>
<tr><td>ECONNRESET (104)</td><td>Connection reset by peer</td><td>An established connection received a <strong>RST</strong></td><td>Peer crashed/restarted, LB/NAT idle timeout expired, proxy killed it, server closed with unread data</td></tr>
<tr><td>EPIPE (32)</td><td>Broken pipe</td><td>You <em>wrote</em> to a socket the peer had already closed</td><td>Client gave up (timeout) while you were still sending the response</td></tr>
<tr><td>EADDRINUSE (98)</td><td>Address already in use</td><td>Local <code>bind()</code> failed — never touched the network</td><td>Another process (or the old instance) still holds the port</td></tr>
<tr><td>EADDRNOTAVAIL (99)</td><td>Cannot assign requested address</td><td>No free local (ephemeral) port / IP not on this host</td><td>Ephemeral port exhaustion under heavy outbound traffic (TIME_WAIT pile-up)</td></tr>
</table>
<p>The single most useful distinction in production: <strong>refused is fast, timeout is slow</strong>. A refusal comes back in one RTT (milliseconds) and proves the packet reached the host's kernel. A timeout means the packet vanished somewhere — on AWS, Security Groups and NACLs always <em>drop</em>, never reject, so a wrong SG rule is <em>always</em> a timeout, never a refusal.</p>
<blockquote>💡 Real world: "Connection refused" from a container to <code>localhost:5432</code> almost always means the DB is in <em>another</em> container — inside a container, localhost is the container itself. And a server that binds <code>127.0.0.1:8080</code> instead of <code>0.0.0.0:8080</code> refuses everyone except itself; <code>ss -ltnp</code> shows which.</blockquote>`,
        he: `<p>ה-kernel מתרגם את מה שקרה על הקו ל-<code>errno</code>; כל שפה וכל כלי פשוט מדפיסים אותו אחרת. תלמד את ה-errno, ותוכל לקרוא כל stack.</p>
<table>
<tr><th>errno (מספר ב-Linux)</th><th>טקסט</th><th>מה קרה על הקו</th><th>סיבה נפוצה</th></tr>
<tr><td>ECONNREFUSED (111)</td><td>Connection refused</td><td>SYN ← חזר <strong>RST</strong> (או ICMP port-unreachable)</td><td>ה-host למעלה אבל אף אחד לא מאזין לפורט; האפליקציה מאזינה רק ל-127.0.0.1; חוק REJECT ב-iptables</td></tr>
<tr><td>ETIMEDOUT (110)</td><td>Connection timed out</td><td>SYN ← <strong>שקט</strong>, ניסיונות חוזרים כ-6 פעמים (כ-127 שניות בברירות המחדל של Linux)</td><td>DROP ב-Security Group, ב-NACL או ב-firewall, IP שגוי, host למטה, ניתוב א-סימטרי</td></tr>
<tr><td>EHOSTUNREACH (113)</td><td>No route to host</td><td>ICMP host-unreachable, או ש-ARP לא קיבל תשובה ב-subnet המקומי</td><td>host למטה באותו סגמנט L2; REJECT של firewalld עם <code>icmp-host-prohibited</code></td></tr>
<tr><td>ENETUNREACH (101)</td><td>Network is unreachable</td><td>שום דבר לא יצא מהמכונה: אין route בטבלה המקומית</td><td>אין default route, יש כתובת IPv6 בלי קישוריות IPv6, interface למטה</td></tr>
<tr><td>ECONNRESET (104)</td><td>Connection reset by peer</td><td>חיבור שכבר קיים קיבל <strong>RST</strong></td><td>הצד השני קרס או עלה מחדש, נגמר ה-idle timeout ב-LB או ב-NAT, proxy הרג את החיבור, השרת סגר כשנשאר מידע שלא נקרא</td></tr>
<tr><td>EPIPE (32)</td><td>Broken pipe</td><td><em>כתבת</em> ל-socket שהצד השני כבר סגר</td><td>הקליינט ויתר (timeout) בזמן שעוד שלחת את התשובה</td></tr>
<tr><td>EADDRINUSE (98)</td><td>Address already in use</td><td><code>bind()</code> מקומי נכשל — לא נגע ברשת בכלל</td><td>תהליך אחר (או המופע הקודם) עדיין מחזיק את הפורט</td></tr>
<tr><td>EADDRNOTAVAIL (99)</td><td>Cannot assign requested address</td><td>אין פורט מקומי (ephemeral) פנוי, או שה-IP לא שייך למכונה</td><td>מיצוי ephemeral ports תחת הרבה תעבורה יוצאת (הצטברות TIME_WAIT)</td></tr>
</table>
<p>ההבחנה הכי שימושית בפרודקשן: <strong>refused מהיר, timeout איטי</strong>. סירוב חוזר תוך RTT אחד (מילישניות) ומוכיח שה-packet הגיע ל-kernel של ה-host. Timeout אומר שה-packet נעלם איפשהו — ב-AWS, Security Groups ו-NACLs תמיד <em>זורקים</em> ואף פעם לא דוחים, אז חוק SG שגוי הוא <em>תמיד</em> timeout ואף פעם לא refused.</p>
<blockquote>💡 מהשטח: "Connection refused" מקונטיינר ל-<code>localhost:5432</code> כמעט תמיד אומר שה-DB נמצא בקונטיינר <em>אחר</em> — בתוך קונטיינר, localhost זה הקונטיינר עצמו. ושרת שמאזין ל-<code>127.0.0.1:8080</code> במקום ל-<code>0.0.0.0:8080</code> מסרב לכולם חוץ מלעצמו; <code>ss -ltnp</code> יראה לך את זה.</blockquote>`
      }
    },
    {
      h: { en: "Same error, five dialects: curl, Node, Python, Java, Go", he: "אותה שגיאה, חמישה ניבים: curl, Node, Python, Java, Go" },
      body: {
        en: `<table>
<tr><th>Situation</th><th>curl (exit code)</th><th>Node.js</th><th>Python</th><th>Java</th></tr>
<tr><td>DNS name doesn't exist</td><td>6 <code>Could not resolve host: api.exmaple.com</code></td><td><code>getaddrinfo ENOTFOUND</code></td><td><code>[Errno -2] Name or service not known</code></td><td><code>java.net.UnknownHostException</code></td></tr>
<tr><td>DNS server unreachable / timed out</td><td>6</td><td><code>getaddrinfo EAI_AGAIN</code></td><td><code>[Errno -3] Temporary failure in name resolution</code></td><td><code>UnknownHostException</code></td></tr>
<tr><td>RST on connect</td><td>7 <code>Failed to connect ... Couldn't connect to server</code></td><td><code>connect ECONNREFUSED 10.0.3.7:5432</code></td><td><code>ConnectionRefusedError: [Errno 111]</code></td><td><code>java.net.ConnectException: Connection refused</code></td></tr>
<tr><td>SYN dropped</td><td>28 (with <code>--connect-timeout</code>) or 7 after the kernel gives up</td><td><code>connect ETIMEDOUT</code></td><td><code>TimeoutError: [Errno 110]</code></td><td><code>SocketTimeoutException: connect timed out</code></td></tr>
<tr><td>Connected, no response in time</td><td>28 <code>Operation timed out</code></td><td>your client's timeout / <code>ESOCKETTIMEDOUT</code></td><td><code>ReadTimeout</code> (requests)</td><td><code>SocketTimeoutException: Read timed out</code></td></tr>
<tr><td>TLS handshake failed</td><td>35 <code>SSL connect error</code> / 60 cert problem</td><td><code>EPROTO</code> / cert codes</td><td><code>ssl.SSLError</code></td><td><code>SSLHandshakeException</code></td></tr>
<tr><td>Server closed without a byte</td><td>52 <code>Empty reply from server</code></td><td><code>socket hang up</code></td><td><code>RemoteDisconnected</code></td><td><code>NoHttpResponseException</code> (Apache HC)</td></tr>
<tr><td>RST mid-response</td><td>56 <code>Recv failure: Connection reset by peer</code></td><td><code>read ECONNRESET</code></td><td><code>ConnectionResetError: [Errno 104]</code></td><td><code>SocketException: Connection reset</code></td></tr>
</table>
<p>Go prints the whole chain in one line, which is a gift: <code>dial tcp 10.0.3.7:5432: connect: connection refused</code>, <code>dial tcp: lookup api.internal on 10.96.0.10:53: no such host</code>, <code>dial tcp 10.0.3.7:443: i/o timeout</code>. Note how the DNS error even tells you <em>which resolver</em> answered (10.96.0.10 = kube-dns in many clusters).</p>
<pre>$ curl -sS https://api.example.com/health
curl: (7) Failed to connect to api.example.com port 443 after 3 ms: Couldn't connect to server
#   older curl (&lt; 8.x) prints the errno text instead:  ... after 3 ms: Connection refused
$ echo $?
7
$ curl -sS --connect-timeout 5 https://10.0.9.9/
curl: (28) Failed to connect to 10.0.9.9 port 443 after 5002 ms: Timeout was reached</pre>
<blockquote>⚠️ Production tip: the time printed by curl is the diagnosis. "after 3 ms" + exit 7 = RST (port closed). "after 5002 ms" + exit 28 = silence (firewall). "after 130000 ms" = no client timeout set, the kernel's SYN retries ran out — fix your timeouts before anything else.</blockquote>`,
        he: `<table>
<tr><th>מצב</th><th>curl (exit code)</th><th>Node.js</th><th>Python</th><th>Java</th></tr>
<tr><td>שם DNS לא קיים</td><td>6 <code>Could not resolve host: api.exmaple.com</code></td><td><code>getaddrinfo ENOTFOUND</code></td><td><code>[Errno -2] Name or service not known</code></td><td><code>java.net.UnknownHostException</code></td></tr>
<tr><td>שרת DNS לא נגיש או לא עונה</td><td>6</td><td><code>getaddrinfo EAI_AGAIN</code></td><td><code>[Errno -3] Temporary failure in name resolution</code></td><td><code>UnknownHostException</code></td></tr>
<tr><td>RST ב-connect</td><td>7 <code>Failed to connect ... Couldn't connect to server</code></td><td><code>connect ECONNREFUSED 10.0.3.7:5432</code></td><td><code>ConnectionRefusedError: [Errno 111]</code></td><td><code>java.net.ConnectException: Connection refused</code></td></tr>
<tr><td>ה-SYN נזרק</td><td>28 (עם <code>--connect-timeout</code>) או 7 אחרי שה-kernel מוותר</td><td><code>connect ETIMEDOUT</code></td><td><code>TimeoutError: [Errno 110]</code></td><td><code>SocketTimeoutException: connect timed out</code></td></tr>
<tr><td>התחבר, אבל אין תשובה בזמן</td><td>28 <code>Operation timed out</code></td><td>ה-timeout של הקליינט / <code>ESOCKETTIMEDOUT</code></td><td><code>ReadTimeout</code> (requests)</td><td><code>SocketTimeoutException: Read timed out</code></td></tr>
<tr><td>TLS handshake נכשל</td><td>35 <code>SSL connect error</code> / 60 בעיית תעודה</td><td><code>EPROTO</code> / קודי תעודה</td><td><code>ssl.SSLError</code></td><td><code>SSLHandshakeException</code></td></tr>
<tr><td>השרת סגר בלי לשלוח בייט</td><td>52 <code>Empty reply from server</code></td><td><code>socket hang up</code></td><td><code>RemoteDisconnected</code></td><td><code>NoHttpResponseException</code> (Apache HC)</td></tr>
<tr><td>RST באמצע התשובה</td><td>56 <code>Recv failure: Connection reset by peer</code></td><td><code>read ECONNRESET</code></td><td><code>ConnectionResetError: [Errno 104]</code></td><td><code>SocketException: Connection reset</code></td></tr>
</table>
<p>Go מדפיס את כל השרשרת בשורה אחת, וזו מתנה: <code>dial tcp 10.0.3.7:5432: connect: connection refused</code>, <code>dial tcp: lookup api.internal on 10.96.0.10:53: no such host</code>, <code>dial tcp 10.0.3.7:443: i/o timeout</code>. שים לב ששגיאת ה-DNS אפילו אומרת לך <em>איזה resolver</em> ענה (10.96.0.10 = kube-dns בהרבה clusters).</p>
<pre>$ curl -sS https://api.example.com/health
curl: (7) Failed to connect to api.example.com port 443 after 3 ms: Couldn't connect to server
#   older curl (&lt; 8.x) prints the errno text instead:  ... after 3 ms: Connection refused
$ echo $?
7
$ curl -sS --connect-timeout 5 https://10.0.9.9/
curl: (28) Failed to connect to 10.0.9.9 port 443 after 5002 ms: Timeout was reached</pre>
<blockquote>⚠️ טיפ לפרודקשן: הזמן ש-curl מדפיס הוא האבחנה. "after 3 ms" עם exit 7 = RST (פורט סגור). "after 5002 ms" עם exit 28 = שקט (firewall). "after 130000 ms" = לא הוגדר timeout בקליינט, וה-SYN retries של ה-kernel נגמרו — תתקן את ה-timeouts לפני כל דבר אחר.</blockquote>`
      }
    },
    {
      h: { en: "DNS errors: NXDOMAIN vs SERVFAIL vs timeout", he: "שגיאות DNS: NXDOMAIN מול SERVFAIL מול timeout" },
      body: {
        en: `<table>
<tr><th><code>dig</code> status</th><th>Meaning</th><th>Who is wrong</th><th>App sees</th></tr>
<tr><td>NOERROR + answer</td><td>Works</td><td>—</td><td>—</td></tr>
<tr><td>NOERROR, ANSWER: 0 (NODATA)</td><td>Name exists, but not this record type (e.g. AAAA)</td><td>Usually fine; missing record</td><td>"no such host" for that family</td></tr>
<tr><td>NXDOMAIN</td><td>The name does not exist — an authoritative, cacheable "no"</td><td>Typo, deleted record, wrong search domain</td><td>ENOTFOUND / Name or service not known</td></tr>
<tr><td>SERVFAIL</td><td>Resolver couldn't get a valid answer</td><td>Authoritative servers down, <strong>DNSSEC validation failed</strong>, lame delegation</td><td>EAI_AGAIN / Temporary failure in name resolution</td></tr>
<tr><td>REFUSED</td><td>Server won't answer you</td><td>Not authoritative and recursion disabled for your IP</td><td>EAI_AGAIN</td></tr>
<tr><td><code>;; connection timed out; no servers could be reached</code></td><td>No reply at all</td><td>Resolver down, UDP/53 blocked, conntrack full, CoreDNS overloaded</td><td>EAI_AGAIN after ~5 s × attempts</td></tr>
</table>
<pre>$ dig +noall +comments api.exmaple.com | grep status
;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: NXDOMAIN, id: 4711

$ dig @1.1.1.1 dnssec-failed.org | grep status
;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: SERVFAIL, id: 2302
$ dig @1.1.1.1 dnssec-failed.org +cd | grep status   # +cd = skip DNSSEC check
;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: NOERROR, id: 5120</pre>
<p>Rule of thumb: <strong>NXDOMAIN is a content problem, SERVFAIL and timeouts are infrastructure problems</strong>. NXDOMAIN is also cached (negative caching, up to the SOA minimum TTL), so creating the missing record doesn't fix clients instantly.</p>
<blockquote>💡 Real world: in Kubernetes, <code>ndots:5</code> makes <code>api.stripe.com</code> (2 dots) first try <code>api.stripe.com.default.svc.cluster.local</code>, <code>...svc.cluster.local</code>, <code>...cluster.local</code> — three NXDOMAINs before the real query. Under load that's 4x the DNS traffic and intermittent <code>EAI_AGAIN</code> when CoreDNS or conntrack chokes. Fix with a trailing dot (<code>api.stripe.com.</code>), lower ndots, or NodeLocal DNSCache.</blockquote>`,
        he: `<table>
<tr><th>סטטוס ב-<code>dig</code></th><th>משמעות</th><th>מי טועה</th><th>מה האפליקציה רואה</th></tr>
<tr><td>NOERROR + answer</td><td>עובד</td><td>—</td><td>—</td></tr>
<tr><td>NOERROR, ANSWER: 0 (NODATA)</td><td>השם קיים, אבל לא סוג הרשומה הזה (למשל AAAA)</td><td>בדרך כלל בסדר; רשומה חסרה</td><td>"no such host" למשפחת הכתובות הזו</td></tr>
<tr><td>NXDOMAIN</td><td>השם לא קיים — "לא" סמכותי שנשמר ב-cache</td><td>שגיאת כתיב, רשומה שנמחקה, search domain שגוי</td><td>ENOTFOUND / Name or service not known</td></tr>
<tr><td>SERVFAIL</td><td>ה-resolver לא הצליח להשיג תשובה תקינה</td><td>השרתים הסמכותיים למטה, <strong>אימות DNSSEC נכשל</strong>, lame delegation</td><td>EAI_AGAIN / Temporary failure in name resolution</td></tr>
<tr><td>REFUSED</td><td>השרת מסרב לענות לך</td><td>לא סמכותי, ו-recursion חסום ל-IP שלך</td><td>EAI_AGAIN</td></tr>
<tr><td><code>;; connection timed out; no servers could be reached</code></td><td>אין תשובה בכלל</td><td>ה-resolver למטה, UDP/53 חסום, conntrack מלא, CoreDNS בעומס</td><td>EAI_AGAIN אחרי כ-5 שניות כפול מספר הניסיונות</td></tr>
</table>
<pre>$ dig +noall +comments api.exmaple.com | grep status
;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: NXDOMAIN, id: 4711

$ dig @1.1.1.1 dnssec-failed.org | grep status
;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: SERVFAIL, id: 2302
$ dig @1.1.1.1 dnssec-failed.org +cd | grep status   # +cd = skip DNSSEC check
;; -&gt;&gt;HEADER&lt;&lt;- opcode: QUERY, status: NOERROR, id: 5120</pre>
<p>כלל אצבע: <strong>NXDOMAIN זו בעיית תוכן, SERVFAIL ו-timeout הן בעיות תשתית</strong>. NXDOMAIN גם נשמר ב-cache (negative caching, עד ה-TTL המינימלי של ה-SOA), אז יצירת הרשומה החסרה לא מתקנת את הקליינטים מיד.</p>
<blockquote>💡 מהשטח: ב-Kubernetes, <code>ndots:5</code> גורם ל-<code>api.stripe.com</code> (2 נקודות) לנסות קודם את <code>api.stripe.com.default.svc.cluster.local</code>, <code>...svc.cluster.local</code>, <code>...cluster.local</code> — שלושה NXDOMAIN לפני השאילתה האמיתית. תחת עומס זה פי 4 תעבורת DNS ו-<code>EAI_AGAIN</code> לסירוגין כש-CoreDNS או conntrack נחנקים. מתקנים עם נקודה בסוף (<code>api.stripe.com.</code>), ndots נמוך יותר, או NodeLocal DNSCache.</blockquote>`
      }
    },
    {
      h: { en: "The sneaky ones: L1/L2, ARP and MTU black holes", he: "השגיאות החמקמקות: L1/L2, ARP ו-MTU black holes" },
      body: {
        en: `<p><strong>L1/L2</strong> rarely prints an error in your app — you just get timeouts, retransmits and slowness. Look at the interface itself:</p>
<pre>$ ip -br link
eth0   DOWN   0a:1b:2c:3d:4e:5f &lt;NO-CARRIER,BROADCAST,MULTICAST,UP&gt;
$ ethtool eth0 | grep -E 'Speed|Duplex|Link detected'
	Speed: 100Mb/s        # expected 10000Mb/s? bad cable / autoneg
	Duplex: Half          # duplex mismatch = late collisions, crawling throughput
	Link detected: yes
$ ip -s link show eth0     # RX errors / dropped / overrun climbing = NIC, cable or ring buffer
$ ip neigh
10.0.1.1 dev eth0 lladdr 0a:00:00:00:00:01 REACHABLE
10.0.1.57 dev eth0  FAILED          # ARP got no reply -&gt; "No route to host"</pre>
<ul>
<li><strong>ARP failure</strong>: a peer on the same subnet that doesn't answer ARP produces <code>No route to host</code> after ~3 s, not a timeout — a strong hint the host is down or on another VLAN.</li>
<li><strong>Duplicate IP</strong>: two machines claim the same address; connections flap and reset randomly. <code>arping -D -I eth0 10.0.1.57</code> detects it. After a failover, a stale ARP cache keeps traffic going to the old MAC until a gratuitous ARP fixes it — that's why keepalived/VRRP send one.</li>
</ul>
<p><strong>MTU / PMTU black hole</strong> — the classic "the handshake works, small requests work, big responses hang forever":</p>
<ol>
<li>Small packets (SYN, TLS ClientHello, <code>GET /health</code>) fit; a 1500-byte response segment doesn't fit through a tunnel/VPN with MTU 1400.</li>
<li>The router should send ICMP "Fragmentation needed" (type 3, code 4) so the sender lowers its size — but a firewall that blocks "all ICMP" eats it.</li>
<li>The sender retransmits the same oversized segment until the client times out. No error, just a hang.</li>
</ol>
<pre># 1472 payload + 8 ICMP + 20 IP = 1500. Shrink until it passes.
$ ping -M do -s 1472 -c 2 10.20.0.5
ping: local error: message too long, mtu=1400
$ ping -M do -s 1372 -c 2 10.20.0.5
1380 bytes from 10.20.0.5: icmp_seq=1 ttl=62 time=11.2 ms
$ tracepath 10.20.0.5          # prints "pmtu 1400" at the hop that shrinks it

# fix on the tunnel/router: clamp TCP MSS to the path MTU
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu</pre>
<blockquote>⚠️ Production tip: AWS uses jumbo frames (MTU 9001) inside a VPC, but traffic through an Internet Gateway, VPC peering across regions or a Site-to-Site VPN is limited to 1500 or less (VPN ≈ 1399-1436 after IPsec overhead). Never block ICMP type 3 — allow "destination unreachable" in every firewall and NACL.</blockquote>`,
        he: `<p><strong>L1/L2</strong> כמעט אף פעם לא מדפיס שגיאה באפליקציה — אתה פשוט מקבל timeouts, retransmits ואיטיות. מסתכלים על ה-interface עצמו:</p>
<pre>$ ip -br link
eth0   DOWN   0a:1b:2c:3d:4e:5f &lt;NO-CARRIER,BROADCAST,MULTICAST,UP&gt;
$ ethtool eth0 | grep -E 'Speed|Duplex|Link detected'
	Speed: 100Mb/s        # expected 10000Mb/s? bad cable / autoneg
	Duplex: Half          # duplex mismatch = late collisions, crawling throughput
	Link detected: yes
$ ip -s link show eth0     # RX errors / dropped / overrun climbing = NIC, cable or ring buffer
$ ip neigh
10.0.1.1 dev eth0 lladdr 0a:00:00:00:00:01 REACHABLE
10.0.1.57 dev eth0  FAILED          # ARP got no reply -&gt; "No route to host"</pre>
<ul>
<li><strong>כשל ARP</strong>: מכונה באותו subnet שלא עונה ל-ARP גורמת ל-<code>No route to host</code> אחרי כ-3 שניות, ולא ל-timeout — רמז חזק שה-host למטה או ב-VLAN אחר.</li>
<li><strong>IP כפול</strong>: שתי מכונות טוענות לאותה כתובת; חיבורים מתנדנדים ומתאפסים אקראית. <code>arping -D -I eth0 10.0.1.57</code> מזהה את זה. אחרי failover, ARP cache ישן ממשיך לשלוח תעבורה ל-MAC הישן עד ש-gratuitous ARP מתקן — בגלל זה keepalived ו-VRRP שולחים אחד.</li>
</ul>
<p><strong>MTU / PMTU black hole</strong> — הקלאסיקה של "ה-handshake עובד, בקשות קטנות עובדות, תשובות גדולות נתקעות לנצח":</p>
<ol>
<li>packets קטנים (SYN, ה-ClientHello של TLS, <code>GET /health</code>) עוברים; segment של 1500 בייט בתשובה לא עובר דרך tunnel או VPN עם MTU של 1400.</li>
<li>הנתב אמור לשלוח ICMP "Fragmentation needed" (type 3, code 4) כדי שהשולח יקטין — אבל firewall שחוסם "את כל ה-ICMP" בולע אותו.</li>
<li>השולח שולח שוב ושוב את אותו segment גדול מדי עד שהקליינט מגיע ל-timeout. בלי שגיאה, רק תקיעה.</li>
</ol>
<pre># 1472 payload + 8 ICMP + 20 IP = 1500. Shrink until it passes.
$ ping -M do -s 1472 -c 2 10.20.0.5
ping: local error: message too long, mtu=1400
$ ping -M do -s 1372 -c 2 10.20.0.5
1380 bytes from 10.20.0.5: icmp_seq=1 ttl=62 time=11.2 ms
$ tracepath 10.20.0.5          # prints "pmtu 1400" at the hop that shrinks it

# fix on the tunnel/router: clamp TCP MSS to the path MTU
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu</pre>
<blockquote>⚠️ טיפ לפרודקשן: AWS משתמש ב-jumbo frames (MTU 9001) בתוך VPC, אבל תעבורה דרך Internet Gateway, דרך VPC peering בין regions או דרך Site-to-Site VPN מוגבלת ל-1500 או פחות (ב-VPN בערך 1399-1436 אחרי ה-overhead של IPsec). לעולם אל תחסום ICMP type 3 — תאפשר "destination unreachable" בכל firewall ו-NACL.</blockquote>`
      }
    },
    {
      h: { en: "Reset, broken pipe, empty reply: errors on a live connection", he: "Reset, broken pipe, empty reply: שגיאות על חיבור חי" },
      body: {
        en: `<p>Once the connection is established, a different family of errors shows up. They point at timeouts and lifecycles, not at reachability.</p>
<ul>
<li><strong>ECONNRESET on reuse of a pooled connection</strong> — the #1 cause in production. Your HTTP client keeps idle connections for 90 s; the server/LB closes idle ones after 60 s (or AWS NAT Gateway after 350 s, sending a RST on the next packet). The next request picks a dead socket and gets <code>read ECONNRESET</code>. Fix: client idle timeout <em>shorter</em> than every hop's idle timeout, or TCP keepalive.</li>
<li><strong>Node.js <code>socket hang up</code> / curl 52 <code>Empty reply from server</code></strong>: the server accepted and then closed without sending a byte — crashed worker, keep-alive race, or a proxy that gave up on the upstream.</li>
<li><strong>EPIPE / Broken pipe in server logs</strong>: <em>the client</em> left (its timeout fired, the user closed the tab) while you were still writing. Mostly noise — unless it correlates with slow endpoints, then it's your latency showing up.</li>
<li><strong>RST right after the handshake</strong>: listen backlog overflow (<code>netstat -s | grep -i "listen queue"</code>), or a server talking a different protocol (plain HTTP to a TLS port).</li>
</ul>
<pre># who sends the RST? capture and look at the flags
$ sudo tcpdump -ni eth0 'host 10.0.3.7 and tcp[tcpflags] &amp; (tcp-rst) != 0'
10:42:01.120 IP 10.0.3.7.443 &gt; 10.0.1.20.51514: Flags [R.], seq 1, ack 518, win 0, length 0
# the source of the [R] line is the side that killed the connection.
# A middlebox (LB, NAT, IPS) can forge it — compare the TTL with normal packets from that host.</pre>
<blockquote>💡 Real world: "ECONNRESET every few minutes, only on the first request after a quiet period" is almost never the network. It's a keep-alive mismatch: Node's default <code>keepAliveTimeout</code> is 5 s, while an ALB's idle timeout is 60 s, so Node closes connections the ALB still thinks are open and the ALB returns 502. Set the server's keep-alive timeout <em>longer</em> than the LB's (e.g. 65 s).</blockquote>`,
        he: `<p>ברגע שהחיבור קיים, מופיעה משפחה אחרת של שגיאות. הן מצביעות על timeouts ומחזור חיים, לא על נגישות.</p>
<ul>
<li><strong>ECONNRESET בשימוש חוזר בחיבור מה-pool</strong> — הסיבה מספר 1 בפרודקשן. ה-HTTP client שלך שומר חיבורים פנויים 90 שניות; השרת או ה-LB סוגרים חיבורים פנויים אחרי 60 שניות (או NAT Gateway של AWS אחרי 350 שניות, ששולח RST על ה-packet הבא). הבקשה הבאה בוחרת socket מת ומקבלת <code>read ECONNRESET</code>. התיקון: idle timeout בקליינט <em>קצר</em> מה-idle timeout של כל hop, או TCP keepalive.</li>
<li><strong><code>socket hang up</code> ב-Node.js או curl 52 <code>Empty reply from server</code></strong>: השרת קיבל את החיבור ואז סגר בלי לשלוח בייט — worker שקרס, race של keep-alive, או proxy שוויתר על ה-upstream.</li>
<li><strong>EPIPE או Broken pipe בלוגים של השרת</strong>: <em>הקליינט</em> הלך (ה-timeout שלו פג, המשתמש סגר את הטאב) בזמן שעוד כתבת. בעיקר רעש — אלא אם זה מתואם עם endpoints איטיים, ואז זה ה-latency שלך שמציץ.</li>
<li><strong>RST מיד אחרי ה-handshake</strong>: גלישה של ה-listen backlog (<code>netstat -s | grep -i "listen queue"</code>), או שרת שמדבר פרוטוקול אחר (HTTP רגיל לפורט של TLS).</li>
</ul>
<pre># who sends the RST? capture and look at the flags
$ sudo tcpdump -ni eth0 'host 10.0.3.7 and tcp[tcpflags] &amp; (tcp-rst) != 0'
10:42:01.120 IP 10.0.3.7.443 &gt; 10.0.1.20.51514: Flags [R.], seq 1, ack 518, win 0, length 0
# the source of the [R] line is the side that killed the connection.
# A middlebox (LB, NAT, IPS) can forge it — compare the TTL with normal packets from that host.</pre>
<blockquote>💡 מהשטח: "ECONNRESET כל כמה דקות, רק בבקשה הראשונה אחרי תקופה שקטה" כמעט אף פעם לא הרשת. זה חוסר התאמה ב-keep-alive: ברירת המחדל של <code>keepAliveTimeout</code> ב-Node היא 5 שניות, וה-idle timeout של ALB הוא 60 שניות, אז Node סוגר חיבורים שה-ALB עדיין חושב שפתוחים וה-ALB מחזיר 502. תגדיר את ה-keep-alive timeout של השרת <em>ארוך</em> משל ה-LB (למשל 65 שניות).</blockquote>`
      }
    },
    {
      h: { en: "Which layer failed? The decision flow", he: "איזו שכבה נכשלה? תהליך ההחלטה" },
      body: {
        en: `<pre>error text?
 ├─ ENOTFOUND / NXDOMAIN / "Name or service not known" ──&gt; DNS content: dig name, check record &amp; search domains
 ├─ EAI_AGAIN / SERVFAIL / "Temporary failure..." ──────&gt; DNS infra: dig @resolver, CoreDNS logs, UDP/53 path
 ├─ "Network is unreachable" ───────────────────────────&gt; L3 local: ip route, ip -6 route, interface up?
 ├─ "No route to host" ─────────────────────────────────&gt; L2/L3: ip neigh (ARP FAILED?), host down, firewalld REJECT
 ├─ "Connection timed out" (slow) ──────────────────────&gt; L3/L4 filtering: SG, NACL, firewall, routing, wrong IP
 ├─ "Connection refused" (fast) ────────────────────────&gt; L4: nothing listening / bound to 127.0.0.1 / REJECT rule
 ├─ "Connection reset by peer" / socket hang up ────────&gt; L4 lifecycle: idle timeouts, crashes, keep-alive mismatch
 ├─ SSL / certificate / handshake errors ───────────────&gt; TLS (see net-https-errors)
 └─ got an HTTP status ─────────────────────────────────&gt; L7: who produced it? (see http-status-errors)</pre>
<table>
<tr><th>Layer</th><th>Question</th><th>Command</th></tr>
<tr><td>L1/L2</td><td>Link up? ARP resolves?</td><td><code>ip -br link</code>, <code>ethtool eth0</code>, <code>ip neigh</code>, <code>arping</code></td></tr>
<tr><td>L3</td><td>Route exists? Packets get there?</td><td><code>ip route get 10.0.3.7</code>, <code>mtr -n 10.0.3.7</code>, <code>tracepath</code></td></tr>
<tr><td>DNS</td><td>Does the name resolve, from <em>this</em> pod/host?</td><td><code>dig</code>, <code>getent hosts name</code> (uses the same resolver path as the app)</td></tr>
<tr><td>L4</td><td>Port open? Who sends RST?</td><td><code>nc -vz -w 3 host 5432</code>, <code>ss -ltnp</code>, <code>tcpdump</code></td></tr>
<tr><td>TLS</td><td>Handshake and cert OK?</td><td><code>openssl s_client -connect host:443 -servername host</code></td></tr>
<tr><td>L7</td><td>What status, from which hop?</td><td><code>curl -sv</code>, <code>curl -w '%{http_code} %{time_connect} %{time_total}\\n'</code></td></tr>
</table>
<blockquote>⚠️ Production tip: always test <em>from the same place as the failing client</em> (<code>kubectl debug</code>, an ephemeral pod in the same namespace, SSM into the same subnet). "It works from my laptop" tests a different DNS resolver, a different route and different Security Groups.</blockquote>`,
        he: `<pre>error text?
 ├─ ENOTFOUND / NXDOMAIN / "Name or service not known" ──&gt; DNS content: dig name, check record &amp; search domains
 ├─ EAI_AGAIN / SERVFAIL / "Temporary failure..." ──────&gt; DNS infra: dig @resolver, CoreDNS logs, UDP/53 path
 ├─ "Network is unreachable" ───────────────────────────&gt; L3 local: ip route, ip -6 route, interface up?
 ├─ "No route to host" ─────────────────────────────────&gt; L2/L3: ip neigh (ARP FAILED?), host down, firewalld REJECT
 ├─ "Connection timed out" (slow) ──────────────────────&gt; L3/L4 filtering: SG, NACL, firewall, routing, wrong IP
 ├─ "Connection refused" (fast) ────────────────────────&gt; L4: nothing listening / bound to 127.0.0.1 / REJECT rule
 ├─ "Connection reset by peer" / socket hang up ────────&gt; L4 lifecycle: idle timeouts, crashes, keep-alive mismatch
 ├─ SSL / certificate / handshake errors ───────────────&gt; TLS (see net-https-errors)
 └─ got an HTTP status ─────────────────────────────────&gt; L7: who produced it? (see http-status-errors)</pre>
<table>
<tr><th>שכבה</th><th>שאלה</th><th>פקודה</th></tr>
<tr><td>L1/L2</td><td>ה-link למעלה? ARP נפתר?</td><td><code>ip -br link</code>, <code>ethtool eth0</code>, <code>ip neigh</code>, <code>arping</code></td></tr>
<tr><td>L3</td><td>יש route? ה-packets מגיעים?</td><td><code>ip route get 10.0.3.7</code>, <code>mtr -n 10.0.3.7</code>, <code>tracepath</code></td></tr>
<tr><td>DNS</td><td>השם נפתר, מ-<em>ה-pod או ה-host הזה</em>?</td><td><code>dig</code>, <code>getent hosts name</code> (עובר באותו מסלול resolver כמו האפליקציה)</td></tr>
<tr><td>L4</td><td>הפורט פתוח? מי שולח RST?</td><td><code>nc -vz -w 3 host 5432</code>, <code>ss -ltnp</code>, <code>tcpdump</code></td></tr>
<tr><td>TLS</td><td>ה-handshake והתעודה תקינים?</td><td><code>openssl s_client -connect host:443 -servername host</code></td></tr>
<tr><td>L7</td><td>איזה status, מאיזה hop?</td><td><code>curl -sv</code>, <code>curl -w '%{http_code} %{time_connect} %{time_total}\\n'</code></td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: תמיד תבדוק <em>מאותו מקום שבו הקליינט נכשל</em> (<code>kubectl debug</code>, pod זמני באותו namespace, SSM לאותו subnet). "מהלפטופ שלי זה עובד" בודק resolver אחר, route אחר ו-Security Groups אחרים.</blockquote>`
      }
    }
  ],
  diagram: `fast RST   -> "Connection refused"      L4: host alive, port closed
silence    -> "Connection timed out"    L3/L4: dropped by SG/NACL/firewall
ICMP/ARP   -> "No route to host"        L2/L3: host down / REJECT host-prohibited
no route   -> "Network is unreachable"  L3 local routing table
RST later  -> "Connection reset by peer" live conn killed (idle timeout, crash)
write->closed -> "Broken pipe"          peer already left
DNS: NXDOMAIN (name wrong) | SERVFAIL/timeout (resolver/infra wrong)`,
  handsOn: [
    { cmd: "nc -vz -w 3 localhost 9; nc -vz -w 3 10.255.255.1 443", what: { en: "Feel the difference: a closed local port is refused instantly, a black-holed IP times out after 3 s.", he: "תרגיש את ההבדל: פורט מקומי סגור מחזיר refused מיד, IP שנבלע ב-black hole נגמר ב-timeout אחרי 3 שניות." } },
    { cmd: "curl -sS -o /dev/null --connect-timeout 5 -w 'exit=%{exitcode} connect=%{time_connect}s\\n' https://10.255.255.1/", what: { en: "Read the curl exit code and timing — 28 after ~5 s means silence on the path.", he: "קורא את ה-exit code והזמנים של curl — 28 אחרי כ-5 שניות אומר שקט בדרך." } },
    { cmd: "dig +noall +comments nosuchname.example.com | grep status; getent hosts nosuchname.example.com; echo $?", what: { en: "See NXDOMAIN in dig, and the same failure through the libc resolver path the app uses.", he: "רואה NXDOMAIN ב-dig, ואת אותו כשל דרך מסלול ה-resolver של libc שהאפליקציה משתמשת בו." } },
    { cmd: "ping -M do -s 1472 -c 2 1.1.1.1 && tracepath -n 1.1.1.1", what: { en: "Probe the path MTU with Don't Fragment set; tracepath reports where pmtu shrinks.", he: "בודק את ה-path MTU עם Don't Fragment; tracepath מראה איפה ה-pmtu קטן." } },
    { cmd: "ss -ltnp; ip neigh; ip route get 8.8.8.8", what: { en: "Three quick checks: what listens (and on which IP), ARP state, and which route a packet would take.", he: "שלוש בדיקות מהירות: מה מאזין (ועל איזה IP), מצב ה-ARP, ובאיזה route ה-packet ייצא." } }
  ],
  mnemonic: {
    en: "\"Refused is a slammed door, timeout is a silent wall, unreachable is no road, reset is a hang-up mid-call.\" Fast = something answered; slow = something dropped.",
    he: "\"Refused זו דלת שנטרקה, timeout זה קיר שותק, unreachable זה אין כביש, reset זה ניתוק באמצע שיחה.\" מהיר = מישהו ענה; איטי = מישהו זרק."
  },
  pitfalls: [
    { en: "Opening a port in the app's config when the error is a timeout — a timeout means the packet never reached the host; look at SGs, NACLs and routes first.", he: "לפתוח פורט בקונפיג של האפליקציה כשהשגיאה היא timeout — timeout אומר שה-packet בכלל לא הגיע ל-host; קודם בודקים SGs, NACLs ו-routes." },
    { en: "Blocking all ICMP 'for security' — it breaks PMTU discovery and creates hangs on large responses that nobody can explain.", he: "לחסום את כל ה-ICMP 'בשביל אבטחה' — זה שובר PMTU discovery ויוצר תקיעות בתשובות גדולות שאף אחד לא מצליח להסביר." },
    { en: "Retrying NXDOMAIN in a tight loop — it's a definitive answer, and it's negatively cached; fix the name instead.", he: "לעשות retry ל-NXDOMAIN בלולאה צפופה — זו תשובה סופית, והיא נשמרת ב-negative cache; מתקנים את השם." },
    { en: "No connect timeout in the client: the default is the kernel's SYN retry budget (~2 minutes), so a dropped SYN freezes threads for 127 s each.", he: "אין connect timeout בקליינט: ברירת המחדל היא תקציב ה-SYN retries של ה-kernel (כ-2 דקות), אז SYN שנזרק מקפיא כל thread ל-127 שניות." }
  ],
  interview: [
    {
      q: { en: "A service gets 'Connection refused' to a database, another gets 'Connection timed out'. What does each tell you?", he: "שירות אחד מקבל 'Connection refused' ל-DB ושירות אחר מקבל 'Connection timed out'. מה כל אחד אומר לך?" },
      a: { en: "Refused means the SYN reached a host that answered with RST (or ICMP port-unreachable): routing and firewalls let it through, but nothing listens on that port/IP — DB down, wrong port, bound to localhost, or a REJECT rule. Timeout means no answer at all: an SG/NACL/firewall dropped it, the IP is wrong or not routable, or the host is gone. I'd check ss -ltnp on the DB host for the first, and SG rules, NACLs and mtr from the client's subnet for the second.", he: "Refused אומר שה-SYN הגיע ל-host שענה עם RST (או ICMP port-unreachable): הניתוב וה-firewalls העבירו, אבל אף אחד לא מאזין לפורט או ל-IP — DB למטה, פורט שגוי, מאזין ל-localhost, או חוק REJECT. Timeout אומר שאין תשובה בכלל: SG, NACL או firewall זרקו, ה-IP שגוי או לא מנותב, או שה-host לא קיים. בראשון הייתי בודק ss -ltnp על ה-DB, ובשני את חוקי ה-SG, ה-NACLs ו-mtr מה-subnet של הקליינט." }
    },
    {
      q: { en: "Users report that small API calls work but file downloads over the new VPN hang. Diagnosis?", he: "משתמשים מדווחים שקריאות API קטנות עובדות אבל הורדת קבצים דרך ה-VPN החדש נתקעת. אבחנה?" },
      a: { en: "Classic PMTU black hole: the VPN lowers the path MTU (IPsec overhead), full-size segments are dropped and the ICMP 'fragmentation needed' replies are filtered. Confirm with ping -M do -s 1472 (fails) vs smaller sizes and tracepath. Fix by allowing ICMP type 3 code 4 and clamping MSS on the tunnel (TCPMSS --clamp-mss-to-pmtu), or lowering the interface MTU.", he: "PMTU black hole קלאסי: ה-VPN מוריד את ה-path MTU (overhead של IPsec), segments בגודל מלא נזרקים, ותשובות ה-ICMP של 'fragmentation needed' מסוננות. מאשרים עם ping -M do -s 1472 (נכשל) מול גדלים קטנים יותר ו-tracepath. מתקנים ע\"י אישור ICMP type 3 code 4 ו-MSS clamping על ה-tunnel (TCPMSS --clamp-mss-to-pmtu), או הורדת ה-MTU של ה-interface." }
    },
    {
      q: { en: "What's the difference between NXDOMAIN and SERVFAIL, and why does it matter for retries?", he: "מה ההבדל בין NXDOMAIN ל-SERVFAIL, ולמה זה משנה ל-retries?" },
      a: { en: "NXDOMAIN is an authoritative answer that the name doesn't exist — it's correct, cacheable and retrying won't help. SERVFAIL means the resolver failed to get a valid answer (authoritative servers down, DNSSEC failure) — transient, so retry with backoff and investigate the DNS infrastructure; dig +cd tells you if DNSSEC is the reason.", he: "NXDOMAIN זו תשובה סמכותית שהשם לא קיים — היא נכונה, נשמרת ב-cache ו-retry לא יעזור. SERVFAIL אומר שה-resolver לא הצליח להשיג תשובה תקינה (שרתים סמכותיים למטה, כשל DNSSEC) — זמני, אז עושים retry עם backoff וחוקרים את תשתית ה-DNS; dig +cd יגיד לך אם DNSSEC הוא הסיבה." }
    }
  ],
  quiz: [
    {
      q: { en: "On AWS, a missing inbound Security Group rule produces which client error?", he: "ב-AWS, חוק inbound חסר ב-Security Group גורם לאיזו שגיאה אצל הקליינט?" },
      options: [
        { en: "Connection refused", he: "Connection refused" },
        { en: "Connection timed out", he: "Connection timed out" },
        { en: "Connection reset by peer", he: "Connection reset by peer" },
        { en: "Network is unreachable", he: "Network is unreachable" }
      ],
      answer: 1,
      explain: { en: "Security Groups silently drop; the SYN gets no reply, so the client times out. Refused requires something to send a RST.", he: "Security Groups זורקים בשקט; ה-SYN לא מקבל תשובה, אז הקליינט מגיע ל-timeout. Refused דורש שמישהו ישלח RST." }
    },
    {
      q: { en: "curl exits with code 56 and 'Recv failure: Connection reset by peer'. What happened?", he: "curl יוצא עם קוד 56 ו-'Recv failure: Connection reset by peer'. מה קרה?" },
      options: [
        { en: "DNS failed", he: "ה-DNS נכשל" },
        { en: "The SYN was dropped by a firewall", he: "ה-SYN נזרק ע\"י firewall" },
        { en: "An established connection received a RST while reading", he: "חיבור קיים קיבל RST בזמן קריאה" },
        { en: "The certificate expired", he: "התעודה פגה" }
      ],
      answer: 2,
      explain: { en: "Exit 56 is a receive failure after connecting; the peer or a middlebox reset the live connection.", he: "Exit 56 הוא כשל קבלה אחרי שהחיבור קם; הצד השני או רכיב באמצע איפס את החיבור החי." }
    },
    {
      q: { en: "Python prints '[Errno -3] Temporary failure in name resolution'. Most likely cause?", he: "Python מדפיס '[Errno -3] Temporary failure in name resolution'. הסיבה הסבירה ביותר?" },
      options: [
        { en: "The domain name has a typo", he: "יש שגיאת כתיב בשם הדומיין" },
        { en: "The resolver is unreachable, timing out or returning SERVFAIL", he: "ה-resolver לא נגיש, לא עונה בזמן או מחזיר SERVFAIL" },
        { en: "The remote port is closed", he: "הפורט המרוחק סגור" },
        { en: "The MTU is too large", he: "ה-MTU גדול מדי" }
      ],
      answer: 1,
      explain: { en: "EAI_AGAIN = temporary DNS failure. A typo gives NXDOMAIN, which surfaces as '[Errno -2] Name or service not known'.", he: "EAI_AGAIN = כשל DNS זמני. שגיאת כתיב נותנת NXDOMAIN, שמופיע כ-'[Errno -2] Name or service not known'." }
    },
    {
      q: { en: "TLS handshake succeeds, /health works, but large JSON responses hang only over the VPN. First suspect?", he: "ה-TLS handshake מצליח, ‏/health עובד, אבל תשובות JSON גדולות נתקעות רק דרך ה-VPN. החשוד הראשון?" },
      options: [
        { en: "Expired certificate", he: "תעודה שפגה" },
        { en: "Path MTU black hole (ICMP frag-needed blocked)", he: "PMTU black hole (חסימת ICMP frag-needed)" },
        { en: "NXDOMAIN caching", he: "NXDOMAIN ב-cache" },
        { en: "EADDRINUSE", he: "EADDRINUSE" }
      ],
      answer: 1,
      explain: { en: "Small packets fit, full-size ones are dropped and the ICMP that would shrink them is filtered.", he: "packets קטנים עוברים, גדולים נזרקים, וה-ICMP שהיה אמור להקטין אותם מסונן." }
    }
  ],
  playground: "firewall",
  related: ["net-troubleshooting", "net-osi-tcpip", "net-tcp-deep", "net-dns", "net-nat-conntrack", "net-firewalls", "net-https-errors", "http-status-errors"]
});

/* ------------------------------------------------------------------ 2 */
window.INFRA.lessons.push({
  id: "net-https-errors",
  track: "networking",
  order: 41,
  icon: "🔏",
  level: 2,
  minutes: 18,
  title: { en: "HTTPS / TLS Errors Decoded", he: "שגיאות HTTPS ו-TLS בפענוח מלא" },
  tldr: {
    en: "TLS errors fall into two buckets: the client doesn't trust the certificate (expired, wrong name, unknown issuer, missing intermediate, clock skew) or the two sides can't agree on how to talk (protocol version, ciphers, SNI, client cert). openssl s_client with -servername tells you which bucket in one command.",
    he: "שגיאות TLS נופלות לשני סלים: הקליינט לא סומך על התעודה (פגה, שם שגוי, issuer לא מוכר, intermediate חסר, שעון לא מסונכרן) או ששני הצדדים לא מסכימים איך לדבר (גרסת פרוטוקול, ciphers, ‏SNI, תעודת קליינט). openssl s_client עם -servername אומר לך באיזה סל אתה בפקודה אחת."
  },
  analogy: {
    en: "A border crossing. The officer can reject your passport (expired, the photo isn't you, issued by a country he doesn't recognize, missing the stamp page that links it to a recognized country, or his own calendar is wrong), or you can't even start the conversation (you only speak Latin and he stopped accepting Latin in 2020, or you forgot to say which country you're entering). In mTLS, he also hands you his badge and you must show yours back.",
    he: "מעבר גבול. הפקיד יכול לדחות את הדרכון שלך (פג תוקף, התמונה לא שלך, הונפק ע\"י מדינה שהוא לא מכיר, חסר דף החותמת שמקשר אותו למדינה מוכרת, או שהלוח שנה שלו עצמו שגוי), או שאתם בכלל לא מצליחים להתחיל לדבר (אתה מדבר רק לטינית והוא הפסיק לקבל לטינית ב-2020, או ששכחת להגיד לאיזו מדינה אתה נכנס). ב-mTLS, גם הוא מראה לך תג ואתה חייב להראות לו את שלך."
  },
  sections: [
    {
      h: { en: "Trust errors: the certificate catalog", he: "שגיאות אמון: הקטלוג של התעודות" },
      body: {
        en: `<table>
<tr><th>Problem</th><th>curl / OpenSSL</th><th>Java</th><th>Python</th><th>Node.js code</th><th>Chrome</th></tr>
<tr><td>Expired</td><td><code>certificate has expired</code> (verify 10)</td><td><code>CertificateExpiredException: NotAfter: ...</code></td><td><code>certificate verify failed: certificate has expired</code></td><td><code>CERT_HAS_EXPIRED</code></td><td><code>NET::ERR_CERT_DATE_INVALID</code></td></tr>
<tr><td>Not yet valid (clock skew)</td><td><code>certificate is not yet valid</code> (verify 9)</td><td><code>CertificateNotYetValidException</code></td><td><code>certificate is not yet valid</code></td><td><code>CERT_NOT_YET_VALID</code></td><td><code>NET::ERR_CERT_DATE_INVALID</code></td></tr>
<tr><td>Wrong name (SAN)</td><td><code>SSL: no alternative certificate subject name matches target host name 'api.example.com'</code></td><td><code>No subject alternative DNS name matching api.example.com found.</code></td><td><code>Hostname mismatch, certificate is not valid for 'api.example.com'.</code></td><td><code>ERR_TLS_CERT_ALTNAME_INVALID</code></td><td><code>NET::ERR_CERT_COMMON_NAME_INVALID</code></td></tr>
<tr><td>Missing intermediate / private CA</td><td><code>unable to get local issuer certificate</code> (20), s_client: <code>unable to verify the first certificate</code> (21)</td><td><code>PKIX path building failed ... unable to find valid certification path to requested target</code></td><td><code>unable to get local issuer certificate</code></td><td><code>UNABLE_TO_VERIFY_LEAF_SIGNATURE</code> / <code>UNABLE_TO_GET_ISSUER_CERT_LOCALLY</code></td><td><code>NET::ERR_CERT_AUTHORITY_INVALID</code></td></tr>
<tr><td>Self-signed leaf</td><td><code>self-signed certificate</code> (18)</td><td>PKIX path building failed</td><td><code>self-signed certificate</code></td><td><code>DEPTH_ZERO_SELF_SIGNED_CERT</code></td><td><code>NET::ERR_CERT_AUTHORITY_INVALID</code></td></tr>
<tr><td>Private root in chain (corp proxy)</td><td><code>self-signed certificate in certificate chain</code> (19)</td><td>PKIX path building failed</td><td>same text</td><td><code>SELF_SIGNED_CERT_IN_CHAIN</code></td><td><code>NET::ERR_CERT_AUTHORITY_INVALID</code></td></tr>
<tr><td>Revoked</td><td><code>certificate revoked</code> (23)</td><td><code>CertPathValidatorException: Certificate has been revoked</code></td><td>—</td><td><code>CERT_REVOKED</code></td><td><code>NET::ERR_CERT_REVOKED</code></td></tr>
</table>
<p>Full strings you'll paste into tickets:</p>
<pre>curl: (60) SSL certificate problem: unable to get local issuer certificate
curl: (60) SSL: no alternative certificate subject name matches target host name 'api.example.com'

javax.net.ssl.SSLHandshakeException: PKIX path building failed:
  sun.security.provider.certpath.SunCertPathBuilderException:
  unable to find valid certification path to requested target

ssl.SSLCertVerificationError: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed:
  unable to get local issuer certificate (_ssl.c:1006)

Error: Hostname/IP does not match certificate's altnames: Host: api.example.com.
  is not in the cert's altnames: DNS:*.example.org, DNS:example.org</pre>
<p>Notes that save hours: a wildcard <code>*.example.com</code> matches <code>api.example.com</code> but <strong>not</strong> <code>example.com</code> or <code>a.b.example.com</code>. Clients ignore the CN when a SAN exists — a cert with only a CN fails in Chrome and Go. "PKIX path building failed" is Java's way of saying "the issuer isn't in my truststore" — the same bug as curl's error 60, with a scarier name.</p>`,
        he: `<table>
<tr><th>בעיה</th><th>curl / OpenSSL</th><th>Java</th><th>Python</th><th>קוד ב-Node.js</th><th>Chrome</th></tr>
<tr><td>פגה</td><td><code>certificate has expired</code> (verify 10)</td><td><code>CertificateExpiredException: NotAfter: ...</code></td><td><code>certificate verify failed: certificate has expired</code></td><td><code>CERT_HAS_EXPIRED</code></td><td><code>NET::ERR_CERT_DATE_INVALID</code></td></tr>
<tr><td>עוד לא בתוקף (שעון לא מסונכרן)</td><td><code>certificate is not yet valid</code> (verify 9)</td><td><code>CertificateNotYetValidException</code></td><td><code>certificate is not yet valid</code></td><td><code>CERT_NOT_YET_VALID</code></td><td><code>NET::ERR_CERT_DATE_INVALID</code></td></tr>
<tr><td>שם שגוי (SAN)</td><td><code>SSL: no alternative certificate subject name matches target host name 'api.example.com'</code></td><td><code>No subject alternative DNS name matching api.example.com found.</code></td><td><code>Hostname mismatch, certificate is not valid for 'api.example.com'.</code></td><td><code>ERR_TLS_CERT_ALTNAME_INVALID</code></td><td><code>NET::ERR_CERT_COMMON_NAME_INVALID</code></td></tr>
<tr><td>Intermediate חסר / CA פרטי</td><td><code>unable to get local issuer certificate</code> (20), ב-s_client: <code>unable to verify the first certificate</code> (21)</td><td><code>PKIX path building failed ... unable to find valid certification path to requested target</code></td><td><code>unable to get local issuer certificate</code></td><td><code>UNABLE_TO_VERIFY_LEAF_SIGNATURE</code> / <code>UNABLE_TO_GET_ISSUER_CERT_LOCALLY</code></td><td><code>NET::ERR_CERT_AUTHORITY_INVALID</code></td></tr>
<tr><td>Leaf בחתימה עצמית</td><td><code>self-signed certificate</code> (18)</td><td>PKIX path building failed</td><td><code>self-signed certificate</code></td><td><code>DEPTH_ZERO_SELF_SIGNED_CERT</code></td><td><code>NET::ERR_CERT_AUTHORITY_INVALID</code></td></tr>
<tr><td>Root פרטי בשרשרת (proxy ארגוני)</td><td><code>self-signed certificate in certificate chain</code> (19)</td><td>PKIX path building failed</td><td>אותו טקסט</td><td><code>SELF_SIGNED_CERT_IN_CHAIN</code></td><td><code>NET::ERR_CERT_AUTHORITY_INVALID</code></td></tr>
<tr><td>בוטלה (revoked)</td><td><code>certificate revoked</code> (23)</td><td><code>CertPathValidatorException: Certificate has been revoked</code></td><td>—</td><td><code>CERT_REVOKED</code></td><td><code>NET::ERR_CERT_REVOKED</code></td></tr>
</table>
<p>המחרוזות המלאות שתדביק בטיקטים:</p>
<pre>curl: (60) SSL certificate problem: unable to get local issuer certificate
curl: (60) SSL: no alternative certificate subject name matches target host name 'api.example.com'

javax.net.ssl.SSLHandshakeException: PKIX path building failed:
  sun.security.provider.certpath.SunCertPathBuilderException:
  unable to find valid certification path to requested target

ssl.SSLCertVerificationError: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed:
  unable to get local issuer certificate (_ssl.c:1006)

Error: Hostname/IP does not match certificate's altnames: Host: api.example.com.
  is not in the cert's altnames: DNS:*.example.org, DNS:example.org</pre>
<p>הערות שחוסכות שעות: wildcard כמו <code>*.example.com</code> תואם ל-<code>api.example.com</code> אבל <strong>לא</strong> ל-<code>example.com</code> ולא ל-<code>a.b.example.com</code>. קליינטים מתעלמים מה-CN כשיש SAN — תעודה עם CN בלבד נכשלת ב-Chrome וב-Go. "PKIX path building failed" זו הדרך של Java להגיד "ה-issuer לא נמצא ב-truststore שלי" — אותו באג כמו error 60 של curl, עם שם מפחיד יותר.</p>`
      }
    },
    {
      h: { en: "Negotiation errors: protocol, cipher, SNI, wrong port", he: "שגיאות משא ומתן: פרוטוקול, cipher, ‏SNI, פורט שגוי" },
      body: {
        en: `<p>These happen <em>before</em> any certificate is checked — the two sides can't agree. The TLS alert name is the clue:</p>
<table>
<tr><th>Message</th><th>Meaning</th><th>Typical cause</th></tr>
<tr><td><code>error:0A000410:SSL routines::sslv3 alert handshake failure</code></td><td>Server sent alert 40: "I can't work with your offer"</td><td>No common cipher suite / curve; server requires SNI or a client cert; FIPS-only server</td></tr>
<tr><td><code>error:0A00042E:SSL routines::tlsv1 alert protocol version</code></td><td>Server rejects your TLS version</td><td>Old client speaking TLS 1.0/1.1 to a 1.2+ server</td></tr>
<tr><td><code>error:0A000102:SSL routines::unsupported protocol</code></td><td><em>Your</em> side refuses the server's version</td><td>Legacy server only offers TLS 1.0/1.1; modern OpenSSL (security level 1+) won't</td></tr>
<tr><td><code>error:0A00010B:SSL routines::wrong version number</code></td><td>The reply wasn't TLS at all</td><td>TLS to a plain-HTTP port (<code>https://host:80</code>), or a proxy answering in cleartext</td></tr>
<tr><td><code>error:0A000418:SSL routines::tlsv1 alert unknown ca</code></td><td>The <em>server</em> doesn't trust <em>your</em> client cert's CA</td><td>mTLS with a client cert from the wrong CA</td></tr>
<tr><td>nginx log: <code>SSL_do_handshake() failed (SSL: error:0A0000C1:SSL routines::no shared cipher)</code></td><td>Server-side view of alert 40</td><td>Client offers only ciphers you've disabled (or RSA cert vs ECDSA-only client)</td></tr>
<tr><td><code>OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to host:443</code></td><td>TCP closed mid-handshake</td><td>Firewall/IPS/LB reset, server crashed, SNI-based filtering</td></tr>
</table>
<pre># Java 8u291+ / 11.0.11+ / 17 / 21 disable TLS 1.0 and 1.1 by default
javax.net.ssl.SSLHandshakeException: No appropriate protocol
  (protocol is disabled or cipher suites are inappropriate)
javax.net.ssl.SSLHandshakeException: Received fatal alert: handshake_failure
javax.net.ssl.SSLHandshakeException: Received fatal alert: protocol_version

$ grep -A2 '^jdk.tls.disabledAlgorithms' $JAVA_HOME/conf/security/java.security
jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, DTLSv1.0, RC4, DES, \\
    MD5withRSA, DH keySize &lt; 1024, EC keySize &lt; 224, 3DES_EDE_CBC, anon, NULL, ...</pre>
<p><strong>SNI missing</strong> doesn't produce its own error: the server/LB/CDN just hands out its <em>default</em> certificate, and you get a hostname mismatch — or, on Cloudflare and many SaaS endpoints, a handshake failure. Causes: <code>openssl s_client</code> without <code>-servername</code>, connecting by IP, ancient Java/Python 2 clients, or a proxy that strips it.</p>
<blockquote>⚠️ Production tip: never "fix" a partner who still speaks TLS 1.0 by re-enabling it fleet-wide in <code>java.security</code>. If a business deadline forces it, scope it to one isolated egress proxy, time-box it with a ticket, and push the partner to upgrade — TLS 1.0/1.1 were formally deprecated by RFC 8996 in 2021.</blockquote>`,
        he: `<p>אלה קורות <em>לפני</em> שבודקים תעודה בכלל — שני הצדדים לא מסכימים. שם ה-alert של TLS הוא הרמז:</p>
<table>
<tr><th>הודעה</th><th>משמעות</th><th>סיבה טיפוסית</th></tr>
<tr><td><code>error:0A000410:SSL routines::sslv3 alert handshake failure</code></td><td>השרת שלח alert 40: "אני לא יכול לעבוד עם ההצעה שלך"</td><td>אין cipher suite או curve משותפים; השרת דורש SNI או תעודת קליינט; שרת FIPS בלבד</td></tr>
<tr><td><code>error:0A00042E:SSL routines::tlsv1 alert protocol version</code></td><td>השרת דוחה את גרסת ה-TLS שלך</td><td>קליינט ישן שמדבר TLS 1.0/1.1 מול שרת 1.2 ומעלה</td></tr>
<tr><td><code>error:0A000102:SSL routines::unsupported protocol</code></td><td><em>הצד שלך</em> מסרב לגרסה של השרת</td><td>שרת legacy שמציע רק TLS 1.0/1.1; OpenSSL מודרני (security level 1 ומעלה) מסרב</td></tr>
<tr><td><code>error:0A00010B:SSL routines::wrong version number</code></td><td>התשובה בכלל לא הייתה TLS</td><td>TLS לפורט של HTTP רגיל (<code>https://host:80</code>), או proxy שעונה בטקסט גלוי</td></tr>
<tr><td><code>error:0A000418:SSL routines::tlsv1 alert unknown ca</code></td><td><em>השרת</em> לא סומך על ה-CA של <em>תעודת הקליינט שלך</em></td><td>mTLS עם תעודת קליינט מה-CA הלא נכון</td></tr>
<tr><td>לוג של nginx: <code>SSL_do_handshake() failed (SSL: error:0A0000C1:SSL routines::no shared cipher)</code></td><td>הצד של השרת של alert 40</td><td>הקליינט מציע רק ciphers שביטלת (או תעודת RSA מול קליינט שתומך רק ב-ECDSA)</td></tr>
<tr><td><code>OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to host:443</code></td><td>ה-TCP נסגר באמצע ה-handshake</td><td>reset מ-firewall, ‏IPS או LB, שרת שקרס, סינון לפי SNI</td></tr>
</table>
<pre># Java 8u291+ / 11.0.11+ / 17 / 21 disable TLS 1.0 and 1.1 by default
javax.net.ssl.SSLHandshakeException: No appropriate protocol
  (protocol is disabled or cipher suites are inappropriate)
javax.net.ssl.SSLHandshakeException: Received fatal alert: handshake_failure
javax.net.ssl.SSLHandshakeException: Received fatal alert: protocol_version

$ grep -A2 '^jdk.tls.disabledAlgorithms' $JAVA_HOME/conf/security/java.security
jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, DTLSv1.0, RC4, DES, \\
    MD5withRSA, DH keySize &lt; 1024, EC keySize &lt; 224, 3DES_EDE_CBC, anon, NULL, ...</pre>
<p><strong>SNI חסר</strong> לא מייצר שגיאה משלו: השרת, ה-LB או ה-CDN פשוט מגישים את תעודת <em>ברירת המחדל</em>, ואתה מקבל hostname mismatch — או, ב-Cloudflare ובהרבה endpoints של SaaS, ‏handshake failure. סיבות: <code>openssl s_client</code> בלי <code>-servername</code>, התחברות לפי IP, קליינטים עתיקים של Java או Python 2, או proxy שמוריד אותו.</p>
<blockquote>⚠️ טיפ לפרודקשן: לעולם אל "תתקן" שותף שעדיין מדבר TLS 1.0 ע\"י הפעלה מחדש שלו בכל הצי דרך <code>java.security</code>. אם דדליין עסקי מכריח, תגביל את זה ל-egress proxy מבודד אחד, תגביל בזמן עם טיקט, ותלחץ על השותף לשדרג — TLS 1.0/1.1 הוכרזו deprecated רשמית ב-RFC 8996 ב-2021.</blockquote>`
      }
    },
    {
      h: { en: "Diagnose in three commands", he: "אבחון בשלוש פקודות" },
      body: {
        en: `<pre>$ openssl s_client -connect api.example.com:443 -servername api.example.com \\
    -showcerts -verify_hostname api.example.com &lt;/dev/null
CONNECTED(00000003)
depth=0 CN = api.example.com
verify error:num=20:unable to get local issuer certificate
verify error:num=21:unable to verify the first certificate
---
Certificate chain
 0 s:CN = api.example.com
   i:C = US, O = Let's Encrypt, CN = R11
   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
   v:NotBefore: Sep  2 08:11:40 2026 GMT; NotAfter: Dec  1 08:11:39 2026 GMT
---                                  &lt;- only ONE cert: the intermediate (R11) is missing
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
    Verify return code: 21 (unable to verify the first certificate)</pre>
<ul>
<li>Count the certs under "Certificate chain": a public cert should show the leaf (0) <strong>and</strong> at least one intermediate (1). One cert + error 21 = fix the server's <code>ssl_certificate</code> to use <code>fullchain.pem</code>, not <code>cert.pem</code>.</li>
<li><code>Verify return code: 0 (ok)</code> + <code>-verify_hostname</code> = trust is fine; your problem is elsewhere (client truststore, proxy, SNI).</li>
<li>Force versions to find what the server accepts: <code>-tls1_2</code>, <code>-tls1_3</code>; OCSP stapling: <code>-status</code> (look for <code>OCSP Response Status: successful</code> vs <code>OCSP response: no response sent</code>).</li>
</ul>
<pre>$ curl -sv https://api.example.com -o /dev/null 2&gt;&amp;1 | grep -E '^\\* (SSL|TLS|ALPN|  subject|  expire|  issuer|  SSL certificate verify)'
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / RSASSA-PSS
* ALPN: server accepted h2
*  subject: CN=api.example.com
*  expire date: Dec  1 08:11:39 2026 GMT
*  issuer: C=US; O=Let's Encrypt; CN=R11
*  SSL certificate verify ok.

$ testssl.sh --protocols --server-defaults --vulnerable api.example.com:443
# full report: offered protocols/ciphers, chain, OCSP, HSTS, known vulns (Heartbleed, ROBOT...)</pre>
<blockquote>💡 Real world: to test a cert on a new server <em>before</em> moving DNS, pin the name to the new IP: <code>curl -v --resolve api.example.com:443:203.0.113.10 https://api.example.com/</code>. SNI and hostname verification still use the real name, so the test is honest.</blockquote>`,
        he: `<pre>$ openssl s_client -connect api.example.com:443 -servername api.example.com \\
    -showcerts -verify_hostname api.example.com &lt;/dev/null
CONNECTED(00000003)
depth=0 CN = api.example.com
verify error:num=20:unable to get local issuer certificate
verify error:num=21:unable to verify the first certificate
---
Certificate chain
 0 s:CN = api.example.com
   i:C = US, O = Let's Encrypt, CN = R11
   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
   v:NotBefore: Sep  2 08:11:40 2026 GMT; NotAfter: Dec  1 08:11:39 2026 GMT
---                                  &lt;- only ONE cert: the intermediate (R11) is missing
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
    Verify return code: 21 (unable to verify the first certificate)</pre>
<ul>
<li>סופרים את התעודות תחת "Certificate chain": תעודה ציבורית צריכה להראות את ה-leaf ‏(0) <strong>וגם</strong> לפחות intermediate אחד (1). תעודה אחת + error 21 = מתקנים את ה-<code>ssl_certificate</code> של השרת כך שיצביע על <code>fullchain.pem</code> ולא על <code>cert.pem</code>.</li>
<li><code>Verify return code: 0 (ok)</code> יחד עם <code>-verify_hostname</code> = האמון תקין; הבעיה שלך במקום אחר (truststore של הקליינט, proxy, ‏SNI).</li>
<li>מכריחים גרסאות כדי לגלות מה השרת מקבל: <code>-tls1_2</code>, <code>-tls1_3</code>; ‏OCSP stapling: <code>-status</code> (מחפשים <code>OCSP Response Status: successful</code> מול <code>OCSP response: no response sent</code>).</li>
</ul>
<pre>$ curl -sv https://api.example.com -o /dev/null 2&gt;&amp;1 | grep -E '^\\* (SSL|TLS|ALPN|  subject|  expire|  issuer|  SSL certificate verify)'
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / RSASSA-PSS
* ALPN: server accepted h2
*  subject: CN=api.example.com
*  expire date: Dec  1 08:11:39 2026 GMT
*  issuer: C=US; O=Let's Encrypt; CN=R11
*  SSL certificate verify ok.

$ testssl.sh --protocols --server-defaults --vulnerable api.example.com:443
# full report: offered protocols/ciphers, chain, OCSP, HSTS, known vulns (Heartbleed, ROBOT...)</pre>
<blockquote>💡 מהשטח: כדי לבדוק תעודה על שרת חדש <em>לפני</em> שמזיזים DNS, מצמידים את השם ל-IP החדש: <code>curl -v --resolve api.example.com:443:203.0.113.10 https://api.example.com/</code>. ה-SNI ואימות ה-hostname עדיין משתמשים בשם האמיתי, אז הבדיקה כנה.</blockquote>`
      }
    },
    {
      h: { en: "Fixes per error — and the client truststore zoo", he: "תיקון לכל שגיאה — וגן החיות של ה-truststores" },
      body: {
        en: `<table>
<tr><th>Error</th><th>Right fix</th><th>Wrong fix</th></tr>
<tr><td>Expired</td><td>Renew + automate (cert-manager, ACM, certbot) + alert at 21/7 days. Public TLS cert lifetime is capped at 200 days since March 2026, dropping to 100 (2027) and 47 days (2029).</td><td>Bumping the server clock</td></tr>
<tr><td>Hostname mismatch</td><td>Reissue with every name in the SAN; check SNI is sent</td><td><code>verify=False</code>, <code>-k</code></td></tr>
<tr><td>Missing intermediate</td><td>Serve the full chain from the server</td><td>Adding the intermediate to every client</td></tr>
<tr><td>Private/corp CA</td><td>Add the <em>root</em> to the client's truststore, explicitly</td><td>Trust-all TrustManager</td></tr>
<tr><td>Not yet valid</td><td>Fix NTP/chrony on the client (<code>timedatectl</code>, <code>chronyc tracking</code>)</td><td>Backdating certs</td></tr>
<tr><td>Protocol version</td><td>Upgrade the old side to TLS 1.2+</td><td>Re-enabling TLS 1.0 everywhere</td></tr>
</table>
<p><strong>Every runtime has its own truststore</strong> — the #1 reason "curl works but my app doesn't":</p>
<pre># OS (Debian/Ubuntu): curl, wget, Go, most C programs
cp corp-root.crt /usr/local/share/ca-certificates/ &amp;&amp; update-ca-certificates
# RHEL/Fedora
cp corp-root.crt /etc/pki/ca-trust/source/anchors/ &amp;&amp; update-ca-trust

# Java: its own cacerts file (JDK 9+: $JAVA_HOME/lib/security/cacerts, password "changeit")
keytool -importcert -cacerts -noprompt -storepass changeit -alias corp-root -file corp-root.crt
#   eclipse-temurin images: mount certs in /certificates and set USE_SYSTEM_CA_CERTS=1

# Python requests: bundles certifi, ignores the OS store
export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
# Node.js: bundled Mozilla roots
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/corp-root.pem</pre>
<blockquote>⚠️ Production tip: grep your codebase for <code>verify=False</code>, <code>rejectUnauthorized: false</code>, <code>InsecureSkipVerify: true</code>, <code>NODE_TLS_REJECT_UNAUTHORIZED=0</code> and trust-all TrustManagers. Each one turns TLS into encryption-to-anyone — a man-in-the-middle gets a free pass, and these "temporary" flags live for years.</blockquote>`,
        he: `<table>
<tr><th>שגיאה</th><th>התיקון הנכון</th><th>התיקון השגוי</th></tr>
<tr><td>פגה</td><td>לחדש + אוטומציה (cert-manager, ‏ACM, ‏certbot) + התראה ב-21 וב-7 ימים. משך החיים של תעודת TLS ציבורית מוגבל ל-200 יום ממרץ 2026, ויורד ל-100 (2027) ול-47 יום (2029).</td><td>להזיז את השעון של השרת</td></tr>
<tr><td>Hostname mismatch</td><td>להנפיק מחדש עם כל השמות ב-SAN; לוודא ש-SNI נשלח</td><td><code>verify=False</code>, <code>-k</code></td></tr>
<tr><td>Intermediate חסר</td><td>להגיש את כל השרשרת מהשרת</td><td>להוסיף את ה-intermediate לכל קליינט</td></tr>
<tr><td>CA פרטי או ארגוני</td><td>להוסיף את ה-<em>root</em> ל-truststore של הקליינט, במפורש</td><td>TrustManager שסומך על הכל</td></tr>
<tr><td>עוד לא בתוקף</td><td>לתקן NTP או chrony בקליינט (<code>timedatectl</code>, <code>chronyc tracking</code>)</td><td>להנפיק תעודות עם תאריך מוקדם</td></tr>
<tr><td>גרסת פרוטוקול</td><td>לשדרג את הצד הישן ל-TLS 1.2 ומעלה</td><td>להפעיל מחדש TLS 1.0 בכל מקום</td></tr>
</table>
<p><strong>לכל runtime יש truststore משלו</strong> — הסיבה מספר 1 ל-"curl עובד אבל האפליקציה שלי לא":</p>
<pre># OS (Debian/Ubuntu): curl, wget, Go, most C programs
cp corp-root.crt /usr/local/share/ca-certificates/ &amp;&amp; update-ca-certificates
# RHEL/Fedora
cp corp-root.crt /etc/pki/ca-trust/source/anchors/ &amp;&amp; update-ca-trust

# Java: its own cacerts file (JDK 9+: $JAVA_HOME/lib/security/cacerts, password "changeit")
keytool -importcert -cacerts -noprompt -storepass changeit -alias corp-root -file corp-root.crt
#   eclipse-temurin images: mount certs in /certificates and set USE_SYSTEM_CA_CERTS=1

# Python requests: bundles certifi, ignores the OS store
export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
# Node.js: bundled Mozilla roots
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/corp-root.pem</pre>
<blockquote>⚠️ טיפ לפרודקשן: תעשה grep בקוד על <code>verify=False</code>, <code>rejectUnauthorized: false</code>, <code>InsecureSkipVerify: true</code>, <code>NODE_TLS_REJECT_UNAUTHORIZED=0</code> ועל TrustManagers שסומכים על הכל. כל אחד מהם הופך את TLS להצפנה-לכל-מי-שמבקש — man-in-the-middle מקבל כרטיס חופשי, והדגלים ה"זמניים" האלה חיים שנים.</blockquote>`
      }
    },
    {
      h: { en: "mTLS, HSTS, HPKP and revocation", he: "mTLS, ‏HSTS, ‏HPKP ו-revocation" },
      body: {
        en: `<p><strong>mTLS errors</strong> — the server asks for a client certificate:</p>
<pre># client sent no cert to a server that requires one (TLS 1.3)
curl: (56) OpenSSL SSL_read: OpenSSL/3.0.13: error:0A00045C:SSL routines::tlsv13 alert certificate required, errno 0
# client sent a cert the server rejects (wrong CA, expired, wrong EKU)
curl: (56) ... error:0A000412:SSL routines::sslv3 alert bad certificate
# nginx side
400 Bad Request — No required SSL certificate was sent
client SSL certificate verify error: (20:unable to get local issuer certificate)

$ curl --cert client.crt --key client.key --cacert server-ca.crt https://mtls.internal/</pre>
<p>Note the exit code: in TLS 1.3 the client "finishes" its side before the server checks the cert, so the failure shows up on the first <em>read</em> (56), not the connect (35). Browsers show <code>ERR_BAD_SSL_CLIENT_AUTH_CERT</code>. Client certs need the <code>clientAuth</code> Extended Key Usage.</p>
<ul>
<li><strong>HSTS</strong> (<code>Strict-Transport-Security: max-age=31536000; includeSubDomains; preload</code>): the browser refuses plain HTTP for that domain and <strong>removes the "Proceed anyway" button</strong> on cert errors. Great security, but <code>includeSubDomains</code> + an internal <code>http://legacy.example.com</code> = broken tool, and leaving the preload list takes months.</li>
<li><strong>HPKP</strong> (key pinning headers) is dead — removed from Chrome in 2018 and Firefox in 2020 because one mistake bricked sites for months. If you pin in mobile apps, pin the intermediate's or your own <em>public key</em>, always ship a backup pin, and have a kill switch.</li>
<li><strong>Revocation</strong>: OCSP stapling lets the server attach a fresh signed "still valid" proof to the handshake. The industry is moving to CRLs (Chrome CRLSets, Firefox CRLite) and short-lived certs; Let's Encrypt shut down its OCSP service in 2025. In practice short lifetimes are the real revocation.</li>
</ul>
<blockquote>💡 Real world: Chrome's interstitial codes tell you the bucket at a glance — <code>ERR_CERT_DATE_INVALID</code> (expired or the user's clock is wrong — common on kiosks and old laptops), <code>ERR_CERT_COMMON_NAME_INVALID</code> (SAN), <code>ERR_CERT_AUTHORITY_INVALID</code> (chain/CA), <code>ERR_SSL_VERSION_OR_CIPHER_MISMATCH</code> (negotiation), <code>ERR_SSL_PROTOCOL_ERROR</code> (garbage on the wire, often a misconfigured proxy).</blockquote>`,
        he: `<p><strong>שגיאות mTLS</strong> — השרת מבקש תעודת קליינט:</p>
<pre># client sent no cert to a server that requires one (TLS 1.3)
curl: (56) OpenSSL SSL_read: OpenSSL/3.0.13: error:0A00045C:SSL routines::tlsv13 alert certificate required, errno 0
# client sent a cert the server rejects (wrong CA, expired, wrong EKU)
curl: (56) ... error:0A000412:SSL routines::sslv3 alert bad certificate
# nginx side
400 Bad Request — No required SSL certificate was sent
client SSL certificate verify error: (20:unable to get local issuer certificate)

$ curl --cert client.crt --key client.key --cacert server-ca.crt https://mtls.internal/</pre>
<p>שים לב ל-exit code: ב-TLS 1.3 הקליינט "מסיים" את הצד שלו לפני שהשרת בודק את התעודה, אז הכשל מופיע ב-<em>קריאה</em> הראשונה (56) ולא ב-connect ‏(35). דפדפנים מראים <code>ERR_BAD_SSL_CLIENT_AUTH_CERT</code>. תעודות קליינט צריכות את ה-Extended Key Usage של <code>clientAuth</code>.</p>
<ul>
<li><strong>HSTS</strong> (<code>Strict-Transport-Security: max-age=31536000; includeSubDomains; preload</code>): הדפדפן מסרב ל-HTTP רגיל לדומיין הזה <strong>ומעלים את כפתור ה-"Proceed anyway"</strong> בשגיאות תעודה. אבטחה מצוינת, אבל <code>includeSubDomains</code> יחד עם <code>http://legacy.example.com</code> פנימי = כלי שבור, ויציאה מרשימת ה-preload לוקחת חודשים.</li>
<li><strong>HPKP</strong> (headers של key pinning) מת — הוסר מ-Chrome ב-2018 ומ-Firefox ב-2020, כי טעות אחת השביתה אתרים לחודשים. אם אתה עושה pinning באפליקציות מובייל, תצמיד את ה-<em>public key</em> של ה-intermediate או שלך, תמיד תשלח backup pin, ותחזיק kill switch.</li>
<li><strong>Revocation</strong>: ‏OCSP stapling מאפשר לשרת לצרף ל-handshake הוכחה טרייה וחתומה ש"התעודה עדיין בתוקף". התעשייה עוברת ל-CRLs ‏(CRLSets של Chrome, ‏CRLite של Firefox) ולתעודות קצרות-חיים; Let's Encrypt סגרו את שירות ה-OCSP שלהם ב-2025. בפועל, משך חיים קצר הוא ה-revocation האמיתי.</li>
</ul>
<blockquote>💡 מהשטח: קודי ה-interstitial של Chrome אומרים לך את הסל במבט — <code>ERR_CERT_DATE_INVALID</code> (פגה, או שהשעון של המשתמש שגוי — נפוץ בקיוסקים ובלפטופים ישנים), <code>ERR_CERT_COMMON_NAME_INVALID</code> ‏(SAN), <code>ERR_CERT_AUTHORITY_INVALID</code> (שרשרת או CA), <code>ERR_SSL_VERSION_OR_CIPHER_MISMATCH</code> (משא ומתן), <code>ERR_SSL_PROTOCOL_ERROR</code> (זבל על הקו, הרבה פעמים proxy עם קונפיג שגוי).</blockquote>`
      }
    }
  ],
  diagram: `TLS error?
 ├─ trust (cert checked, rejected)
 │    expired / not yet valid ......... dates, client clock (NTP)
 │    hostname mismatch ............... SAN list, SNI sent?
 │    unable to get local issuer ...... server missing intermediate OR private CA not in client truststore
 │    self-signed (in chain) .......... corp proxy / internal CA -> add root to truststore
 └─ negotiation (no cert checked yet)
      protocol version / unsupported .. TLS 1.0/1.1 vs 1.2+
      handshake failure / no shared cipher .. ciphers, curves, SNI required, client cert required
      wrong version number ............ TLS spoken to a plain-HTTP port
      certificate required / bad certificate .. mTLS client cert`,
  handsOn: [
    { cmd: "openssl s_client -connect expired.badssl.com:443 -servername expired.badssl.com </dev/null 2>/dev/null | grep 'Verify return code'", what: { en: "badssl.com hosts every broken cert on purpose — see 'certificate has expired' (code 10). Try wrong.host., self-signed., untrusted-root., incomplete-chain. too.", he: "badssl.com מארח בכוונה כל סוג של תעודה שבורה — רואים 'certificate has expired' (קוד 10). תנסה גם wrong.host., ‏self-signed., ‏untrusted-root., ‏incomplete-chain." } },
    { cmd: "curl -sv https://incomplete-chain.badssl.com -o /dev/null; echo exit=$?", what: { en: "Reproduce the missing-intermediate error 60 that browsers often hide.", he: "משחזר את error 60 של intermediate חסר, שדפדפנים לפעמים מסתירים." } },
    { cmd: "openssl s_client -connect example.com:443 -tls1_1 </dev/null", what: { en: "Ask for TLS 1.1 and watch the protocol-version / unsupported protocol failure.", he: "מבקש TLS 1.1 ורואה את הכשל של protocol version או unsupported protocol." } },
    { cmd: "echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName", what: { en: "Print exactly what the cert claims: who, issued by whom, valid when, for which names.", he: "מדפיס בדיוק מה התעודה טוענת: מי, ע\"י מי הונפקה, מתי בתוקף, לאילו שמות." } },
    { cmd: "keytool -list -cacerts -storepass changeit | grep -i -c trustedCertEntry", what: { en: "Count the CAs your JVM trusts — and check whether your corporate root is among them.", he: "סופר כמה CAs ה-JVM שלך סומך עליהם — ובודק אם ה-root הארגוני ביניהם." } }
  ],
  mnemonic: {
    en: "\"Trust or Talk\": trust errors are about the certificate (Date, Name, Chain — D-N-C), talk errors are about negotiation (Version, Cipher, SNI, Client cert). Count the chain, check the clock, send the name.",
    he: "\"אמון או שיחה\": שגיאות אמון הן על התעודה (תאריך, שם, שרשרת), שגיאות שיחה הן על המשא ומתן (גרסה, cipher, ‏SNI, תעודת קליינט). סופרים את השרשרת, בודקים את השעון, שולחים את השם."
  },
  pitfalls: [
    { en: "Testing with openssl s_client without -servername — you get the default cert and chase a hostname mismatch that real clients never see.", he: "לבדוק עם openssl s_client בלי -servername — מקבלים את תעודת ברירת המחדל ורודפים אחרי hostname mismatch שקליינטים אמיתיים לא רואים." },
    { en: "Configuring the server with cert.pem instead of fullchain.pem — browsers fetch the intermediate via AIA, so it 'works' until the first Java/Python/curl client calls it.", he: "להגדיר את השרת עם cert.pem במקום fullchain.pem — דפדפנים מורידים את ה-intermediate דרך AIA, אז זה 'עובד' עד שהקליינט הראשון ב-Java, ‏Python או curl פונה." },
    { en: "Adding the corp CA to the OS store and expecting Java or Python requests to see it — each has its own truststore.", he: "להוסיף את ה-CA הארגוני ל-store של מערכת ההפעלה ולצפות ש-Java או requests של Python יראו אותו — לכל אחד truststore משלו." },
    { en: "Setting verify=False 'temporarily' to unblock a deploy — it silently disables all MITM protection and is rarely removed.", he: "לשים verify=False 'זמנית' כדי לשחרר deploy — זה מבטל בשקט כל הגנה מ-MITM וכמעט אף פעם לא מוסר." }
  ],
  interview: [
    {
      q: { en: "A service works in Chrome but Java clients fail with 'PKIX path building failed'. Walk through it.", he: "שירות עובד ב-Chrome אבל קליינטים ב-Java נכשלים עם 'PKIX path building failed'. תעבור על זה." },
      a: { en: "Java can't build a chain from the leaf to a root in its cacerts. Two common causes: the server sends only the leaf (Chrome fills the gap via AIA fetching or its cache), or the cert is from a private/corp CA that Chrome trusts via the OS store but the JVM's own cacerts doesn't. Check with openssl s_client -showcerts: one cert + verify 21 means fix the server's chain; a full chain to a private root means import that root into the JVM truststore (keytool -importcert -cacerts) — never a trust-all TrustManager.", he: "Java לא מצליח לבנות שרשרת מה-leaf ל-root שב-cacerts שלו. שתי סיבות נפוצות: השרת שולח רק את ה-leaf (Chrome משלים דרך AIA או ה-cache שלו), או שהתעודה מ-CA פרטי או ארגוני ש-Chrome סומך עליו דרך ה-store של מערכת ההפעלה אבל ה-cacerts של ה-JVM לא. בודקים עם openssl s_client -showcerts: תעודה אחת + verify 21 = מתקנים את השרשרת בשרת; שרשרת מלאה ל-root פרטי = מייבאים את ה-root ל-truststore של ה-JVM ‏(keytool -importcert -cacerts) — אף פעם לא TrustManager שסומך על הכל." }
    },
    {
      q: { en: "What's the difference between 'handshake failure' and 'certificate verify failed'?", he: "מה ההבדל בין 'handshake failure' ל-'certificate verify failed'?" },
      a: { en: "Handshake failure (alert 40) is a negotiation failure — the sides couldn't agree on protocol version, cipher suite, curve, or the server needs SNI/a client cert; no certificate trust decision was made yet. Certificate verify failed means negotiation worked, the server presented a cert, and the client rejected it (expired, wrong name, untrusted chain). Different owners: the first is TLS config on either side, the second is the cert or the client truststore.", he: "Handshake failure ‏(alert 40) הוא כשל במשא ומתן — הצדדים לא הסכימו על גרסת פרוטוקול, cipher suite או curve, או שהשרת צריך SNI או תעודת קליינט; עוד לא התקבלה החלטת אמון על תעודה. Certificate verify failed אומר שהמשא ומתן הצליח, השרת הציג תעודה, והקליינט דחה אותה (פגה, שם שגוי, שרשרת לא מהימנה). בעלים שונים: הראשון הוא קונפיג TLS באחד הצדדים, השני הוא התעודה או ה-truststore של הקליינט." }
    }
  ],
  quiz: [
    {
      q: { en: "openssl s_client shows one certificate in the chain and 'Verify return code: 21 (unable to verify the first certificate)'. Fix?", he: "openssl s_client מראה תעודה אחת בשרשרת ו-'Verify return code: 21 (unable to verify the first certificate)'. התיקון?" },
      options: [
        { en: "Renew the certificate", he: "לחדש את התעודה" },
        { en: "Configure the server to send the full chain (leaf + intermediate)", he: "להגדיר את השרת לשלוח את כל השרשרת (leaf + intermediate)" },
        { en: "Enable TLS 1.0", he: "להפעיל TLS 1.0" },
        { en: "Disable SNI", he: "לבטל SNI" }
      ],
      answer: 1,
      explain: { en: "The leaf alone can't be linked to a trusted root; serving the intermediate fixes every client at once.", he: "את ה-leaf לבד אי אפשר לקשר ל-root מהימן; הגשת ה-intermediate מתקנת את כל הקליינטים בבת אחת." }
    },
    {
      q: { en: "After upgrading to Java 17, calls to a legacy partner fail with 'No appropriate protocol (protocol is disabled or cipher suites are inappropriate)'. Why?", he: "אחרי שדרוג ל-Java 17, קריאות לשותף legacy נכשלות עם 'No appropriate protocol (protocol is disabled or cipher suites are inappropriate)'. למה?" },
      options: [
        { en: "The partner's cert expired", he: "התעודה של השותף פגה" },
        { en: "The partner only supports TLS 1.0/1.1, which modern JDKs disable", he: "השותף תומך רק ב-TLS 1.0/1.1, שה-JDKs המודרניים מבטלים" },
        { en: "DNS NXDOMAIN", he: "NXDOMAIN ב-DNS" },
        { en: "Missing client certificate", he: "חסרה תעודת קליינט" }
      ],
      answer: 1,
      explain: { en: "jdk.tls.disabledAlgorithms includes TLSv1 and TLSv1.1 since 8u291/11.0.11; nothing is left to negotiate.", he: "jdk.tls.disabledAlgorithms כולל את TLSv1 ו-TLSv1.1 מאז 8u291/11.0.11; לא נשאר על מה לנהל משא ומתן." }
    },
    {
      q: { en: "curl prints 'error:0A00010B:SSL routines::wrong version number'. Most likely?", he: "curl מדפיס 'error:0A00010B:SSL routines::wrong version number'. הכי סביר?" },
      options: [
        { en: "You're speaking TLS to a port that answers plain HTTP", he: "אתה מדבר TLS לפורט שעונה ב-HTTP רגיל" },
        { en: "The certificate is self-signed", he: "התעודה בחתימה עצמית" },
        { en: "The clock is wrong", he: "השעון שגוי" },
        { en: "The SAN doesn't match", he: "ה-SAN לא תואם" }
      ],
      answer: 0,
      explain: { en: "The bytes that came back weren't a TLS record — e.g. https:// to port 80 or a cleartext proxy.", he: "הבתים שחזרו לא היו רשומת TLS — למשל https:// לפורט 80 או proxy בטקסט גלוי." }
    },
    {
      q: { en: "Why does HSTS make a certificate error worse for users?", he: "למה HSTS מחמיר שגיאת תעודה מבחינת המשתמשים?" },
      options: [
        { en: "It disables encryption", he: "הוא מבטל הצפנה" },
        { en: "The browser removes the 'proceed anyway' option for that domain", he: "הדפדפן מעלים את אפשרות ה-'proceed anyway' לדומיין הזה" },
        { en: "It revokes the certificate", he: "הוא מבטל את התעודה" },
        { en: "It forces TLS 1.0", he: "הוא מכריח TLS 1.0" }
      ],
      answer: 1,
      explain: { en: "That's the point of HSTS — no click-through on MITM — but an expired cert becomes a hard outage.", he: "זו כל המטרה של HSTS — אין דילוג על MITM — אבל תעודה שפגה הופכת להשבתה מוחלטת." }
    }
  ],
  related: ["net-http-tls", "pr-applied-crypto-pki", "net-errors-by-layer", "net-troubleshooting", "net-proxies-cdn", "crypto-encryption-practice"]
});

/* ------------------------------------------------------------------ 3 */
window.INFRA.lessons.push({
  id: "http-status-errors",
  track: "networking",
  order: 42,
  icon: "🚦",
  level: 2,
  minutes: 17,
  title: { en: "HTTP Status Codes in Production", he: "HTTP status codes בפרודקשן" },
  tldr: {
    en: "A status code is only half the story — the other half is which hop produced it. A 502 from the ALB, a 502 from nginx and a 502 from your app are three different incidents. Read the Server header and the LB log (elb_status_code vs target_status_code) before you touch code, and retry only what's safe: 408/429/502/503/504 on idempotent requests, with backoff.",
    he: "Status code הוא רק חצי מהסיפור — החצי השני הוא איזה hop ייצר אותו. 502 מה-ALB, ‏502 מ-nginx ו-502 מהאפליקציה הם שלושה אירועים שונים. קורא את ה-Server header ואת הלוג של ה-LB ‏(elb_status_code מול target_status_code) לפני שנוגע בקוד, ועושה retry רק למה שבטוח: 408/429/502/503/504 על בקשות idempotent, עם backoff."
  },
  analogy: {
    en: "You order food through a call center that forwards to a restaurant. 'We don't deliver to your address' (4xx) is about your order. 'The kitchen is on fire' (500) is the restaurant. But 'the restaurant hung up on us' (502), 'the restaurant is closed' (503) and 'the restaurant put us on hold until we gave up' (504) are the call center telling you about the restaurant — and the fix depends on whether the call center or the kitchen is the one that's broken.",
    he: "אתה מזמין אוכל דרך מוקד שמעביר למסעדה. 'אנחנו לא מגיעים לכתובת שלך' (4xx) — זה על ההזמנה שלך. 'יש שריפה במטבח' (500) — זו המסעדה. אבל 'המסעדה ניתקה לנו' (502), 'המסעדה סגורה' (503) ו-'המסעדה השאירה אותנו בהמתנה עד שוויתרנו' (504) — זה המוקד שמספר לך על המסעדה, והתיקון תלוי אם המוקד או המטבח הם השבורים."
  },
  sections: [
    {
      h: { en: "The 4xx that matter (and what people get wrong)", he: "ה-4xx שחשובים (ומה שאנשים מפספסים)" },
      body: {
        en: `<table>
<tr><th>Code</th><th>Meaning</th><th>Often produced by</th><th>Production notes</th></tr>
<tr><td>400</td><td>Malformed request</td><td>App, nginx, ALB</td><td>nginx returns <code>400 Bad Request — Request Header Or Cookie Too Large</code> when headers exceed <code>large_client_header_buffers</code> (4 × 8k)</td></tr>
<tr><td>401</td><td><strong>Not authenticated</strong> — who are you?</td><td>App, API gateway, auth proxy</td><td>Must include <code>WWW-Authenticate</code>; expired JWT, missing token, clock skew on <code>exp</code>/<code>nbf</code></td></tr>
<tr><td>403</td><td><strong>Not authorized</strong> — I know you, the answer is no</td><td>App, WAF, S3, CDN</td><td>S3 returns 403 <code>AccessDenied</code> for a missing key if you lack <code>s3:ListBucket</code>; WAF/Cloudflare blocks are 403 too</td></tr>
<tr><td>404</td><td>Not found</td><td>App, ingress, Envoy (<code>NR</code> flag)</td><td>404 from the ingress with its default page = no rule matched host/path, the app never saw it</td></tr>
<tr><td>405</td><td>Method not allowed</td><td>App, static hosting</td><td>Must include <code>Allow:</code>; POST to an S3/CloudFront static origin</td></tr>
<tr><td>408</td><td>Request timeout (client too slow to send)</td><td>nginx, ALB</td><td>nginx <code>client_header_timeout</code>/<code>client_body_timeout</code> 60 s; retryable</td></tr>
<tr><td>409</td><td>Conflict with current state</td><td>App, Kubernetes API</td><td>Optimistic locking: K8s says <code>the object has been modified; please apply your changes to the latest version and try again</code></td></tr>
<tr><td>413</td><td>Payload too large</td><td>nginx, ALB, API Gateway</td><td>nginx default <code>client_max_body_size 1m</code>; error log: <code>client intended to send too large body: 2097152 bytes</code></td></tr>
<tr><td>414</td><td>URI too long</td><td>nginx, LB</td><td>Giant query strings (filters, tracking params) — move to POST body</td></tr>
<tr><td>429</td><td>Too many requests</td><td>App, gateway, CDN, SaaS APIs</td><td>Honor <code>Retry-After: 30</code> (seconds or HTTP date); retryable</td></tr>
<tr><td>431</td><td>Request header fields too large</td><td>Node.js, Envoy</td><td>Node's default max header size is 16 KB — bloated cookies hit it first</td></tr>
<tr><td>499</td><td>Client closed request (nginx-only, never sent on the wire)</td><td>nginx logs</td><td>The client gave up before nginx answered — a symptom of <em>your</em> latency; ALB's equivalent is 460</td></tr>
</table>
<blockquote>💡 Real world: a spike of 499 in nginx logs right when p99 latency rises is not "bad clients" — it's mobile apps and upstream services with a 10 s timeout giving up on you. Count 499s as errors in your SLO, or you'll hide the outage from yourself.</blockquote>`,
        he: `<table>
<tr><th>קוד</th><th>משמעות</th><th>מי מייצר בדרך כלל</th><th>הערות מהפרודקשן</th></tr>
<tr><td>400</td><td>בקשה פגומה</td><td>אפליקציה, nginx, ‏ALB</td><td>nginx מחזיר <code>400 Bad Request — Request Header Or Cookie Too Large</code> כשה-headers חורגים מ-<code>large_client_header_buffers</code> (4 × 8k)</td></tr>
<tr><td>401</td><td><strong>לא מזוהה</strong> — מי אתה?</td><td>אפליקציה, API gateway, ‏auth proxy</td><td>חייב לכלול <code>WWW-Authenticate</code>; JWT שפג, token חסר, סטיית שעון על <code>exp</code>/<code>nbf</code></td></tr>
<tr><td>403</td><td><strong>לא מורשה</strong> — אני יודע מי אתה, והתשובה לא</td><td>אפליקציה, WAF, ‏S3, ‏CDN</td><td>S3 מחזיר 403 <code>AccessDenied</code> על key שלא קיים אם אין לך <code>s3:ListBucket</code>; חסימות של WAF או Cloudflare הן גם 403</td></tr>
<tr><td>404</td><td>לא נמצא</td><td>אפליקציה, ingress, ‏Envoy (דגל <code>NR</code>)</td><td>404 מה-ingress עם דף ברירת המחדל שלו = אף חוק לא תאם ל-host או ל-path, האפליקציה לא ראתה את הבקשה</td></tr>
<tr><td>405</td><td>Method לא מותר</td><td>אפליקציה, hosting סטטי</td><td>חייב לכלול <code>Allow:</code>; ‏POST ל-origin סטטי של S3 או CloudFront</td></tr>
<tr><td>408</td><td>Request timeout (הקליינט איטי מדי בשליחה)</td><td>nginx, ‏ALB</td><td><code>client_header_timeout</code>/<code>client_body_timeout</code> של nginx הם 60 שניות; אפשר retry</td></tr>
<tr><td>409</td><td>התנגשות עם המצב הנוכחי</td><td>אפליקציה, Kubernetes API</td><td>Optimistic locking: ‏K8s אומר <code>the object has been modified; please apply your changes to the latest version and try again</code></td></tr>
<tr><td>413</td><td>Payload גדול מדי</td><td>nginx, ‏ALB, ‏API Gateway</td><td>ברירת המחדל של nginx היא <code>client_max_body_size 1m</code>; בלוג: <code>client intended to send too large body: 2097152 bytes</code></td></tr>
<tr><td>414</td><td>URI ארוך מדי</td><td>nginx, ‏LB</td><td>query strings ענקיים (פילטרים, פרמטרים של tracking) — להעביר ל-body של POST</td></tr>
<tr><td>429</td><td>יותר מדי בקשות</td><td>אפליקציה, gateway, ‏CDN, ‏APIs של SaaS</td><td>מכבדים <code>Retry-After: 30</code> (שניות או תאריך HTTP); אפשר retry</td></tr>
<tr><td>431</td><td>Header fields גדולים מדי</td><td>Node.js, ‏Envoy</td><td>ברירת המחדל של Node לגודל headers היא 16 KB — cookies מנופחים פוגעים בזה ראשונים</td></tr>
<tr><td>499</td><td>הקליינט סגר את הבקשה (רק של nginx, לא נשלח על הקו)</td><td>לוגים של nginx</td><td>הקליינט ויתר לפני ש-nginx ענה — סימפטום של ה-latency <em>שלך</em>; המקבילה ב-ALB היא 460</td></tr>
</table>
<blockquote>💡 מהשטח: קפיצה של 499 בלוגים של nginx בדיוק כשה-p99 latency עולה זה לא "קליינטים גרועים" — אלה אפליקציות מובייל ושירותי upstream עם timeout של 10 שניות שמוותרים עליך. תספור 499 כשגיאות ב-SLO, אחרת תסתיר את התקלה מעצמך.</blockquote>`
      }
    },
    {
      h: { en: "500, 502, 503, 504: four very different fires", he: "500, ‏502, ‏503, ‏504: ארבע שריפות שונות מאוד" },
      body: {
        en: `<table>
<tr><th>Code</th><th>Who says it</th><th>Meaning</th><th>Look at</th></tr>
<tr><td>500</td><td>Almost always the <strong>app</strong></td><td>Unhandled exception</td><td>App logs / traces by request id</td></tr>
<tr><td>502</td><td>A <strong>proxy/LB</strong></td><td>"I reached the upstream but got garbage, a RST, or a closed connection"</td><td>Upstream crashing, keep-alive mismatch, wrong port/protocol, response headers too big</td></tr>
<tr><td>503</td><td>Proxy/LB <em>or</em> app</td><td>"Nobody available to serve" — no healthy targets, overload, rate limit, maintenance</td><td>Endpoints, health checks, circuit breakers, <code>limit_req</code></td></tr>
<tr><td>504</td><td>A <strong>proxy/LB</strong></td><td>"Upstream didn't answer within my timeout"</td><td>Slow queries, thread pool exhaustion, timeout mismatch</td></tr>
</table>
<p><strong>Exact causes per proxy:</strong></p>
<pre># nginx error.log
502  connect() failed (111: Connection refused) while connecting to upstream
502  upstream prematurely closed connection while reading response header from upstream
502  upstream sent too big header while reading response header from upstream
502  no live upstreams while connecting to upstream
504  upstream timed out (110: Connection timed out) while reading response header from upstream
     # proxy_read_timeout default = 60s
503  limiting requests, excess: 20.500 by zone "api"     # limit_req_status defaults to 503!
503  ingress-nginx "Service Temporarily Unavailable"     # Service has no ready endpoints

# Envoy / Istio: body text + response flag in the access log
503 UF  upstream connect error or disconnect/reset before headers. reset reason: connection failure
503 UH  no healthy upstream
503 UO  upstream overflow (circuit breaker: max connections / pending requests)
503 UC  upstream connection termination (often idle-timeout race with the app)
504 UT  upstream request timeout                     # route timeout default = 15s
404 NR  no route configured</pre>
<p><strong>AWS ALB</strong> (response has <code>Server: awselb/2.0</code>): <strong>502</strong> = target closed the connection / sent RST / malformed response / Lambda error; <strong>503</strong> = no registered targets in the target group; <strong>504</strong> = target didn't respond within the idle timeout (default 60 s) or the TCP connect to the target failed (10 s); <strong>460</strong> = client closed before the response; <strong>463</strong> = X-Forwarded-For with more than 30 IPs.</p>
<blockquote>⚠️ Production tip: an ALB whose targets are <em>all</em> unhealthy fails open and sends traffic to all of them anyway — so a broken health check shows as 502/504 from sick targets, not as a clean 503. And a timeout chain must shrink inward: client 30 s &gt; LB 25 s &gt; app 20 s &gt; DB 15 s. If the app's timeout is longer than the LB's, the LB returns 504 while the app keeps burning work nobody will read.</blockquote>`,
        he: `<table>
<tr><th>קוד</th><th>מי אומר אותו</th><th>משמעות</th><th>במה מסתכלים</th></tr>
<tr><td>500</td><td>כמעט תמיד <strong>האפליקציה</strong></td><td>Exception שלא טופל</td><td>לוגים ו-traces של האפליקציה לפי request id</td></tr>
<tr><td>502</td><td><strong>Proxy או LB</strong></td><td>"הגעתי ל-upstream אבל קיבלתי זבל, RST, או חיבור סגור"</td><td>upstream שקורס, חוסר התאמה ב-keep-alive, פורט או פרוטוקול שגוי, response headers גדולים מדי</td></tr>
<tr><td>503</td><td>Proxy או LB, <em>או</em> האפליקציה</td><td>"אין מי שישרת" — אין targets בריאים, עומס, rate limit, תחזוקה</td><td>Endpoints, ‏health checks, ‏circuit breakers, ‏<code>limit_req</code></td></tr>
<tr><td>504</td><td><strong>Proxy או LB</strong></td><td>"ה-upstream לא ענה בתוך ה-timeout שלי"</td><td>שאילתות איטיות, מיצוי thread pool, חוסר התאמה ב-timeouts</td></tr>
</table>
<p><strong>הסיבות המדויקות לכל proxy:</strong></p>
<pre># nginx error.log
502  connect() failed (111: Connection refused) while connecting to upstream
502  upstream prematurely closed connection while reading response header from upstream
502  upstream sent too big header while reading response header from upstream
502  no live upstreams while connecting to upstream
504  upstream timed out (110: Connection timed out) while reading response header from upstream
     # proxy_read_timeout default = 60s
503  limiting requests, excess: 20.500 by zone "api"     # limit_req_status defaults to 503!
503  ingress-nginx "Service Temporarily Unavailable"     # Service has no ready endpoints

# Envoy / Istio: body text + response flag in the access log
503 UF  upstream connect error or disconnect/reset before headers. reset reason: connection failure
503 UH  no healthy upstream
503 UO  upstream overflow (circuit breaker: max connections / pending requests)
503 UC  upstream connection termination (often idle-timeout race with the app)
504 UT  upstream request timeout                     # route timeout default = 15s
404 NR  no route configured</pre>
<p><strong>AWS ALB</strong> (בתשובה יש <code>Server: awselb/2.0</code>): <strong>502</strong> = ה-target סגר את החיבור, שלח RST, החזיר תשובה פגומה, או שגיאת Lambda; <strong>503</strong> = אין targets רשומים ב-target group; <strong>504</strong> = ה-target לא ענה בתוך ה-idle timeout (ברירת מחדל 60 שניות) או שה-TCP connect ל-target נכשל (10 שניות); <strong>460</strong> = הקליינט סגר לפני התשובה; <strong>463</strong> = ‏X-Forwarded-For עם יותר מ-30 כתובות IP.</p>
<blockquote>⚠️ טיפ לפרודקשן: ALB שכל ה-targets שלו לא בריאים עושה fail open ושולח תעבורה לכולם בכל זאת — אז health check שבור מופיע כ-502/504 מ-targets חולים, ולא כ-503 נקי. ושרשרת timeouts חייבת להתכווץ פנימה: קליינט 30 שניות &gt; LB ‏25 &gt; אפליקציה 20 &gt; DB ‏15. אם ה-timeout של האפליקציה ארוך משל ה-LB, ה-LB מחזיר 504 בזמן שהאפליקציה ממשיכה לשרוף עבודה שאף אחד לא יקרא.</blockquote>`
      }
    },
    {
      h: { en: "CDN codes: Cloudflare 520-526 and CloudFront", he: "קודים של CDN: ‏Cloudflare 520-526 ו-CloudFront" },
      body: {
        en: `<p>Cloudflare invents its own 52x codes to tell you exactly where between the edge and <em>your origin</em> it failed. They are never your app's fault in the "code" sense — they're about origin reachability, timing or TLS.</p>
<table>
<tr><th>Code</th><th>Cloudflare's name</th><th>What happened</th><th>Typical fix</th></tr>
<tr><td>520</td><td>Web server returned an unknown error</td><td>Origin sent an empty/invalid response or reset the connection</td><td>Origin crashed mid-response, headers over 32 KB, keep-alive issues</td></tr>
<tr><td>521</td><td>Web server is down</td><td>Origin <strong>refused</strong> the TCP connection</td><td>Web server down, or the origin firewall blocks Cloudflare IP ranges</td></tr>
<tr><td>522</td><td>Connection timed out</td><td>TCP handshake to origin never completed (~19 s)</td><td>Security Group / firewall drops Cloudflare IPs, origin overloaded</td></tr>
<tr><td>523</td><td>Origin is unreachable</td><td>No route to the origin</td><td>Wrong origin DNS record / IP</td></tr>
<tr><td>524</td><td>A timeout occurred</td><td>TCP connected, but no HTTP response within <strong>100 s</strong></td><td>Long-running request: make it async (202 + polling) or use a non-proxied hostname</td></tr>
<tr><td>525</td><td>SSL handshake failed</td><td>Edge-to-origin TLS handshake failed</td><td>Origin has no cert for the hostname / no SNI support / cipher mismatch</td></tr>
<tr><td>526</td><td>Invalid SSL certificate</td><td>"Full (strict)" mode and the origin cert is expired, self-signed or wrong name</td><td>Install a valid or Cloudflare Origin CA cert on the origin</td></tr>
</table>
<p><strong>CloudFront</strong> shows its own error page — <code>502 ERROR: The request could not be satisfied</code> — with <code>X-Cache: Error from cloudfront</code> and an <code>X-Amz-Cf-Id</code> for support. A 502 there is usually an origin TLS problem (cert name doesn't match the origin domain) or an origin that refused the connection; 504 = the origin didn't respond within the origin response timeout (default 30 s).</p>
<blockquote>💡 Real world: a 522 storm right after "tightening" an origin Security Group is the classic: someone allowed only the office IPs and forgot Cloudflare's published ranges (or CloudFront's managed prefix list <code>com.amazonaws.global.cloudfront.origin-facing</code>).</blockquote>`,
        he: `<p>Cloudflare ממציאים קודי 52x משלהם כדי להגיד לך בדיוק איפה בין ה-edge ל-<em>origin שלך</em> זה נכשל. הם אף פעם לא אשמת האפליקציה במובן של "באג בקוד" — הם על נגישות ה-origin, תזמון או TLS.</p>
<table>
<tr><th>קוד</th><th>השם אצל Cloudflare</th><th>מה קרה</th><th>תיקון טיפוסי</th></tr>
<tr><td>520</td><td>Web server returned an unknown error</td><td>ה-origin שלח תשובה ריקה או לא תקינה, או איפס את החיבור</td><td>ה-origin קרס באמצע תשובה, headers מעל 32 KB, בעיות keep-alive</td></tr>
<tr><td>521</td><td>Web server is down</td><td>ה-origin <strong>סירב</strong> לחיבור ה-TCP</td><td>שרת ה-web למטה, או שה-firewall של ה-origin חוסם את טווחי ה-IP של Cloudflare</td></tr>
<tr><td>522</td><td>Connection timed out</td><td>ה-TCP handshake ל-origin לא הושלם (כ-19 שניות)</td><td>Security Group או firewall זורקים את כתובות Cloudflare, ‏origin בעומס</td></tr>
<tr><td>523</td><td>Origin is unreachable</td><td>אין route ל-origin</td><td>רשומת DNS או IP שגויים ל-origin</td></tr>
<tr><td>524</td><td>A timeout occurred</td><td>ה-TCP התחבר, אבל אין תשובת HTTP בתוך <strong>100 שניות</strong></td><td>בקשה ארוכה: להפוך אותה ל-async ‏(202 + polling) או להשתמש ב-hostname שלא עובר דרך ה-proxy</td></tr>
<tr><td>525</td><td>SSL handshake failed</td><td>ה-TLS handshake בין ה-edge ל-origin נכשל</td><td>אין ל-origin תעודה ל-hostname, אין תמיכה ב-SNI, חוסר התאמה ב-ciphers</td></tr>
<tr><td>526</td><td>Invalid SSL certificate</td><td>מצב "Full (strict)" ותעודת ה-origin פגה, בחתימה עצמית או עם שם שגוי</td><td>להתקין על ה-origin תעודה תקינה או תעודת Cloudflare Origin CA</td></tr>
</table>
<p><strong>CloudFront</strong> מציג דף שגיאה משלו — <code>502 ERROR: The request could not be satisfied</code> — עם <code>X-Cache: Error from cloudfront</code> ו-<code>X-Amz-Cf-Id</code> בשביל ה-support. ‏502 שם הוא בדרך כלל בעיית TLS מול ה-origin (שם התעודה לא תואם לדומיין של ה-origin) או origin שסירב לחיבור; ‏504 = ה-origin לא ענה בתוך ה-origin response timeout (ברירת מחדל 30 שניות).</p>
<blockquote>💡 מהשטח: סערת 522 מיד אחרי ש"הידקו" את ה-Security Group של ה-origin זו הקלאסיקה: מישהו אישר רק את כתובות המשרד ושכח את הטווחים שמפרסמים ב-Cloudflare (או את ה-managed prefix list של CloudFront, ‏<code>com.amazonaws.global.cloudfront.origin-facing</code>).</blockquote>`
      }
    },
    {
      h: { en: "Find the hop that produced it", he: "למצוא את ה-hop שייצר את זה" },
      body: {
        en: `<p>Every hop leaves fingerprints. Read the response headers and body <em>first</em>:</p>
<pre>$ curl -s -o /dev/null -D - https://api.example.com/orders
HTTP/2 502
server: awselb/2.0                &lt;- the ALB generated this, not your app
content-type: text/html
content-length: 122

$ curl -s -D - https://api.example.com/orders -o /dev/null
HTTP/2 503
server: envoy                      &lt;- mesh sidecar / gateway
x-envoy-upstream-service-time: -   &lt;- absent/empty: upstream never answered
                                     # present with a number = the app answered (with 503 itself)
# other tells: cf-ray (Cloudflare), x-amz-cf-id + x-cache (CloudFront),
# via: 1.1 varnish, x-served-by (Fastly), your own x-request-id echoed = it reached your app</pre>
<p>Then the LB access log separates "who said it":</p>
<pre># ALB access log (space-separated; key fields)
type time elb client:port target:port request_processing_time target_processing_time
     response_processing_time elb_status_code target_status_code ...
https 2026-11-14T09:12:03.123Z app/prod-alb/50dc6c495c0c9188 203.0.113.7:51234 10.0.3.15:8080
      0.001 -1 -1 502 - 734 293 "GET https://api.example.com:443/orders HTTP/1.1" ...

elb=502 target=-   + target_processing_time -1  -&gt; target closed/reset, never answered (keep-alive? crash?)
elb=504 target=-   + ~60s elapsed               -&gt; target too slow (idle timeout)
elb=500 target=500                              -&gt; the APP returned 500; the LB just relayed it
elb=503 target=-                                -&gt; no registered targets</pre>
<pre># Athena: what share of 5xx did the ALB generate itself?
SELECT elb_status_code, target_status_code, count(*) AS n
FROM alb_logs
WHERE day = '2026/11/14' AND elb_status_code &gt;= 500
GROUP BY 1, 2 ORDER BY n DESC;</pre>
<blockquote>⚠️ Production tip: CloudWatch splits these for you — <code>HTTPCode_ELB_5XX_Count</code> (LB-generated) vs <code>HTTPCode_Target_5XX_Count</code> (app-generated). Alert on both separately: the first points at infra/connectivity, the second at code.</blockquote>`,
        he: `<p>כל hop משאיר טביעות אצבע. קורא את ה-headers וה-body של התשובה <em>קודם</em>:</p>
<pre>$ curl -s -o /dev/null -D - https://api.example.com/orders
HTTP/2 502
server: awselb/2.0                &lt;- the ALB generated this, not your app
content-type: text/html
content-length: 122

$ curl -s -D - https://api.example.com/orders -o /dev/null
HTTP/2 503
server: envoy                      &lt;- mesh sidecar / gateway
x-envoy-upstream-service-time: -   &lt;- absent/empty: upstream never answered
                                     # present with a number = the app answered (with 503 itself)
# other tells: cf-ray (Cloudflare), x-amz-cf-id + x-cache (CloudFront),
# via: 1.1 varnish, x-served-by (Fastly), your own x-request-id echoed = it reached your app</pre>
<p>ואז הלוג של ה-LB מפריד "מי אמר את זה":</p>
<pre># ALB access log (space-separated; key fields)
type time elb client:port target:port request_processing_time target_processing_time
     response_processing_time elb_status_code target_status_code ...
https 2026-11-14T09:12:03.123Z app/prod-alb/50dc6c495c0c9188 203.0.113.7:51234 10.0.3.15:8080
      0.001 -1 -1 502 - 734 293 "GET https://api.example.com:443/orders HTTP/1.1" ...

elb=502 target=-   + target_processing_time -1  -&gt; target closed/reset, never answered (keep-alive? crash?)
elb=504 target=-   + ~60s elapsed               -&gt; target too slow (idle timeout)
elb=500 target=500                              -&gt; the APP returned 500; the LB just relayed it
elb=503 target=-                                -&gt; no registered targets</pre>
<pre># Athena: what share of 5xx did the ALB generate itself?
SELECT elb_status_code, target_status_code, count(*) AS n
FROM alb_logs
WHERE day = '2026/11/14' AND elb_status_code &gt;= 500
GROUP BY 1, 2 ORDER BY n DESC;</pre>
<blockquote>⚠️ טיפ לפרודקשן: CloudWatch מפצל את זה בשבילך — <code>HTTPCode_ELB_5XX_Count</code> (נוצר ב-LB) מול <code>HTTPCode_Target_5XX_Count</code> (נוצר באפליקציה). תתריע על כל אחד בנפרד: הראשון מצביע על תשתית או קישוריות, השני על קוד.</blockquote>`
      }
    },
    {
      h: { en: "What to retry: status × method × idempotency", he: "על מה עושים retry: ‏status × method × idempotency" },
      body: {
        en: `<table>
<tr><th>Status</th><th>Retry?</th><th>How</th></tr>
<tr><td>400, 401, 403, 404, 405, 409, 413, 414, 422</td><td>No</td><td>Same request = same answer. Fix the request (401: refresh the token once, then retry once)</td></tr>
<tr><td>408</td><td>Yes</td><td>Resend promptly — the connection was idle/slow</td></tr>
<tr><td>429</td><td>Yes, later</td><td>Wait <code>Retry-After</code>; otherwise exponential backoff with jitter</td></tr>
<tr><td>500</td><td>Maybe, once</td><td>Often a deterministic bug; retrying a poison request just triples load</td></tr>
<tr><td>502, 503, 504</td><td>Yes, if idempotent</td><td>Backoff + jitter, cap attempts (2-3), use a retry budget</td></tr>
</table>
<p><strong>The 504 trap:</strong> a 504 means the proxy stopped waiting — the upstream may well have <em>completed</em> the work. Retrying a <code>POST /payments</code> after a 504 can charge twice. GET/PUT/DELETE are idempotent by definition; POST and PATCH need an <code>Idempotency-Key</code> header that the server dedupes on.</p>
<pre># a sane client policy
retry_on   = {408, 429, 502, 503, 504} + connect errors (ECONNREFUSED, ETIMEDOUT on connect)
methods    = GET, HEAD, PUT, DELETE, OPTIONS   (+ POST only with Idempotency-Key)
attempts   = 3, backoff = min(cap, base * 2^n) * random(0..1)   # full jitter
respect    = Retry-After (seconds | HTTP-date)
budget     = retries &lt;= 10% of requests, else fail fast</pre>
<blockquote>💡 Real world: retries multiply through layers. If the browser, the BFF, the service and the DB driver each retry 3 times, one failing DB call becomes 3⁴ = 81 attempts — that's how a small brownout becomes a full outage. Retry at one layer (usually closest to the user), and make the others fail fast.</blockquote>`,
        he: `<table>
<tr><th>Status</th><th>Retry?</th><th>איך</th></tr>
<tr><td>400, 401, 403, 404, 405, 409, 413, 414, 422</td><td>לא</td><td>אותה בקשה = אותה תשובה. מתקנים את הבקשה (401: מרעננים token פעם אחת ואז retry אחד)</td></tr>
<tr><td>408</td><td>כן</td><td>שולחים שוב מיד — החיבור היה פנוי או איטי</td></tr>
<tr><td>429</td><td>כן, אחר כך</td><td>מחכים <code>Retry-After</code>; אחרת exponential backoff עם jitter</td></tr>
<tr><td>500</td><td>אולי, פעם אחת</td><td>הרבה פעמים באג דטרמיניסטי; retry לבקשה רעילה רק משלש את העומס</td></tr>
<tr><td>502, 503, 504</td><td>כן, אם idempotent</td><td>Backoff + jitter, תקרת ניסיונות (2-3), ‏retry budget</td></tr>
</table>
<p><strong>המלכודת של 504:</strong> ‏504 אומר שה-proxy הפסיק לחכות — ה-upstream אולי דווקא <em>סיים</em> את העבודה. Retry ל-<code>POST /payments</code> אחרי 504 יכול לחייב פעמיים. GET/PUT/DELETE הם idempotent בהגדרה; POST ו-PATCH צריכים header של <code>Idempotency-Key</code> שהשרת עושה עליו dedupe.</p>
<pre># a sane client policy
retry_on   = {408, 429, 502, 503, 504} + connect errors (ECONNREFUSED, ETIMEDOUT on connect)
methods    = GET, HEAD, PUT, DELETE, OPTIONS   (+ POST only with Idempotency-Key)
attempts   = 3, backoff = min(cap, base * 2^n) * random(0..1)   # full jitter
respect    = Retry-After (seconds | HTTP-date)
budget     = retries &lt;= 10% of requests, else fail fast</pre>
<blockquote>💡 מהשטח: retries מוכפלים דרך השכבות. אם הדפדפן, ה-BFF, השירות וה-driver של ה-DB עושים כל אחד 3 ניסיונות, קריאת DB אחת שנכשלת הופכת ל-3⁴ = 81 ניסיונות — ככה brownout קטן הופך להשבתה מלאה. עושים retry בשכבה אחת (בדרך כלל הקרובה למשתמש), והשאר עושים fail fast.</blockquote>`
      }
    }
  ],
  diagram: `client ── CDN ── LB ── proxy/sidecar ── app ── DB
         52x      awselb  nginx/envoy      500    (timeouts surface upstream as 504)
4xx = request problem (don't retry)   499/460 = client gave up (your latency)
502 = upstream answered badly / reset   503 = nobody available   504 = upstream too slow
who? -> Server header, x-envoy-upstream-service-time, cf-ray, elb vs target status`,
  handsOn: [
    { cmd: "curl -s -o /dev/null -D - https://httpbin.org/status/503 | head -5", what: { en: "Read status and headers only — the Server header tells you which hop answered.", he: "קורא רק status ו-headers — ה-Server header אומר לך איזה hop ענה." } },
    { cmd: "curl -s -o /dev/null -w '%{http_code} connect=%{time_connect} ttfb=%{time_starttransfer} total=%{time_total}\\n' https://example.com", what: { en: "Status plus timing: a 504 at exactly 60.0 s total is a proxy timeout, not a slow network.", he: "Status יחד עם זמנים: ‏504 בדיוק ב-60.0 שניות זה timeout של proxy, לא רשת איטית." } },
    { cmd: "awk '$9 ~ /^5/ {print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn", what: { en: "Count 5xx by code in an nginx combined log; then grep error.log for 'upstream' to see the reason.", he: "סופר 5xx לפי קוד בלוג combined של nginx; אחר כך grep על 'upstream' ב-error.log כדי לראות את הסיבה." } },
    { cmd: "kubectl get endpointslices -l kubernetes.io/service-name=api -o wide", what: { en: "A 503 from ingress-nginx usually means this list has no ready endpoints.", he: "503 מ-ingress-nginx בדרך כלל אומר שברשימה הזו אין endpoints מוכנים." } }
  ],
  mnemonic: {
    en: "\"500 = I broke. 502 = they broke. 503 = nobody's home. 504 = they're too slow.\" And always ask: who said it? Server header first, code second.",
    he: "\"500 = אני נשברתי. 502 = הם נשברו. 503 = אין אף אחד בבית. 504 = הם איטיים מדי.\" ותמיד שואלים: מי אמר את זה? קודם ה-Server header, אחר כך הקוד."
  },
  pitfalls: [
    { en: "Debugging app code for a 502 that the ALB generated (target_status_code '-') — the app never produced a response; look at keep-alive, crashes and ports.", he: "לדבג קוד אפליקציה בגלל 502 שה-ALB ייצר (target_status_code '-') — האפליקציה בכלל לא החזירה תשובה; בודקים keep-alive, קריסות ופורטים." },
    { en: "Retrying POST after a 504 without an idempotency key — the first attempt may have succeeded.", he: "לעשות retry ל-POST אחרי 504 בלי idempotency key — הניסיון הראשון אולי הצליח." },
    { en: "Excluding 499/460 from error metrics — they are users giving up on your latency.", he: "להוציא 499/460 ממטריקות השגיאה — אלה משתמשים שמוותרים בגלל ה-latency שלך." },
    { en: "Returning 200 with {\"error\": ...} in the body — LBs, CDNs, retries and SLO dashboards all go blind.", he: "להחזיר 200 עם {\"error\": ...} ב-body — ה-LBs, ה-CDNs, ה-retries ודשבורדי ה-SLO כולם מתעוורים." }
  ],
  interview: [
    {
      q: { en: "Users see intermittent 502s from the ALB after a deploy of a Node.js service, no errors in app logs. What's your hypothesis?", he: "משתמשים רואים 502 לסירוגין מה-ALB אחרי deploy של שירות Node.js, ואין שגיאות בלוגים של האפליקציה. מה ההשערה שלך?" },
      a: { en: "A keep-alive race: Node's server keepAliveTimeout (5 s default) is shorter than the ALB idle timeout (60 s), so Node closes idle connections the ALB reuses, and the ALB gets a RST → 502 with target_status_code '-'. Confirm in ALB logs (elb 502, target -, target_processing_time -1). Fix by setting keepAliveTimeout (and headersTimeout) above 60 s, e.g. 65 s. Also check graceful shutdown: pods terminating without draining produce the same signature during deploys.", he: "Race של keep-alive: ה-keepAliveTimeout של שרת Node ‏(5 שניות כברירת מחדל) קצר מה-idle timeout של ה-ALB ‏(60 שניות), אז Node סוגר חיבורים פנויים שה-ALB ממחזר, וה-ALB מקבל RST ← 502 עם target_status_code '-'. מאשרים בלוגים של ה-ALB ‏(elb 502, ‏target -, ‏target_processing_time -1). מתקנים ע\"י keepAliveTimeout (ו-headersTimeout) מעל 60 שניות, למשל 65. בודקים גם graceful shutdown: פודים שנסגרים בלי draining מייצרים את אותה חתימה בזמן deploys." }
    },
    {
      q: { en: "When would you return 503 vs 429 from your own service?", he: "מתי תחזיר 503 ומתי 429 מהשירות שלך?" },
      a: { en: "429 when a specific client exceeded its quota — it's about them, and Retry-After tells them when to come back. 503 when the service as a whole can't serve right now (overload shedding, dependency down, maintenance) — it's about you; include Retry-After if you know. The distinction matters for alerting (429 is often expected, 503 burns your SLO) and for client behavior.", he: "429 כשקליינט מסוים חרג מה-quota שלו — זה עליו, ו-Retry-After אומר לו מתי לחזור. 503 כשהשירות כולו לא יכול לשרת עכשיו (load shedding, תלות שנפלה, תחזוקה) — זה עליך; תכלול Retry-After אם אתה יודע. ההבחנה חשובה ל-alerting ‏(429 הרבה פעמים צפוי, 503 שורף את ה-SLO) ולהתנהגות הקליינט." }
    }
  ],
  quiz: [
    {
      q: { en: "ALB log: elb_status_code=502, target_status_code='-'. What does it tell you?", he: "לוג של ALB: ‏elb_status_code=502, ‏target_status_code='-'. מה זה אומר לך?" },
      options: [
        { en: "The app threw an exception and returned 502", he: "האפליקציה זרקה exception והחזירה 502" },
        { en: "The ALB generated the 502; the target never sent a valid response", he: "ה-ALB ייצר את ה-502; ה-target לא שלח תשובה תקינה" },
        { en: "The client closed the connection", he: "הקליינט סגר את החיבור" },
        { en: "A WAF blocked the request", he: "WAF חסם את הבקשה" }
      ],
      answer: 1,
      explain: { en: "'-' means no response from the target: it reset/closed the connection or answered garbage.", he: "'-' אומר שאין תשובה מה-target: הוא איפס או סגר את החיבור, או ענה זבל." }
    },
    {
      q: { en: "Cloudflare returns 522. Where do you look first?", he: "Cloudflare מחזיר 522. איפה מסתכלים קודם?" },
      options: [
        { en: "The origin's firewall/Security Group and whether it accepts Cloudflare IPs", he: "ה-firewall או ה-Security Group של ה-origin, והאם הוא מקבל את כתובות Cloudflare" },
        { en: "The app's exception logs", he: "הלוגים של ה-exceptions באפליקציה" },
        { en: "The DNS TTL", he: "ה-TTL של ה-DNS" },
        { en: "The browser cache", he: "ה-cache של הדפדפן" }
      ],
      answer: 0,
      explain: { en: "522 = the TCP handshake to the origin never completed — packets are being dropped or the origin is overloaded.", he: "522 = ה-TCP handshake ל-origin לא הושלם — packets נזרקים או שה-origin בעומס." }
    },
    {
      q: { en: "Which response is the riskiest to blindly retry for a POST /payments?", he: "איזו תשובה הכי מסוכן לעשות לה retry עיוור ל-POST /payments?" },
      options: [
        { en: "400", he: "400" },
        { en: "429 with Retry-After", he: "429 עם Retry-After" },
        { en: "504", he: "504" },
        { en: "Connection refused", he: "Connection refused" }
      ],
      answer: 2,
      explain: { en: "After a 504 the upstream may have completed the charge; without an idempotency key you can double-charge. Refused means the request never got there.", he: "אחרי 504 ה-upstream אולי השלים את החיוב; בלי idempotency key אפשר לחייב פעמיים. Refused אומר שהבקשה לא הגיעה בכלל." }
    },
    {
      q: { en: "nginx logs show many 499s while p99 latency climbs. What are they?", he: "בלוגים של nginx יש הרבה 499 בזמן שה-p99 latency עולה. מה הם?" },
      options: [
        { en: "Malformed client requests", he: "בקשות פגומות מהקליינט" },
        { en: "Clients closing the connection before nginx responded", he: "קליינטים שסוגרים את החיבור לפני ש-nginx ענה" },
        { en: "Rate-limited requests", he: "בקשות שנחסמו ב-rate limit" },
        { en: "TLS failures", he: "כשלי TLS" }
      ],
      answer: 1,
      explain: { en: "499 is nginx's log-only code for 'client gave up' — a direct symptom of slow responses.", he: "499 הוא קוד לוג בלבד של nginx ל-'הקליינט ויתר' — סימפטום ישיר של תשובות איטיות." }
    }
  ],
  related: ["net-http-tls", "net-load-balancing", "net-proxies-cdn", "net-errors-by-layer", "pr-idempotency", "pr-rate-limiters", "pr-error-handling", "arch-resilience"]
});

/* ------------------------------------------------------------------ 4 */
window.INFRA.lessons.push({
  id: "crypto-hashing-practice",
  track: "principal",
  order: 150,
  icon: "#️⃣",
  level: 3,
  minutes: 17,
  title: { en: "Hashing in Practice", he: "Hashing בפרקטיקה" },
  tldr: {
    en: "Pick the hash by the job: xxHash/CRC for speed and accidents, SHA-256/BLAKE3 for tamper-evident fingerprints, HMAC-SHA256 for 'who sent this', and a deliberately slow, salted, memory-hard KDF (Argon2id, scrypt, bcrypt) for passwords — never a fast hash, never MD5/SHA-1 against an attacker.",
    he: "בוחרים hash לפי המשימה: xxHash או CRC למהירות ולתקלות, SHA-256 או BLAKE3 לטביעת אצבע שמזהה שינוי, HMAC-SHA256 ל-'מי שלח את זה', ו-KDF איטי בכוונה, עם salt ו-memory-hard ‏(Argon2id, ‏scrypt, ‏bcrypt) לסיסמאות — אף פעם לא hash מהיר, ואף פעם לא MD5 או SHA-1 מול תוקף."
  },
  analogy: {
    en: "A fast hash is a supermarket barcode scanner: beep, beep, beep, millions per second. Great for checkout, terrible for a vault — a thief can try every barcode in an afternoon. A password hash is a bank vault with a time lock: opening it takes a deliberate second and a room full of equipment (memory), which is nothing for the owner logging in once, and ruinous for a thief trying a billion combinations. The salt makes every vault's combination lock unique, so cracking one teaches nothing about the next.",
    he: "Hash מהיר זה סורק ברקודים בסופר: ביפ, ביפ, ביפ, מיליונים בשנייה. מעולה לקופה, נוראי לכספת — גנב יכול לנסות כל ברקוד בצהריים אחד. Password hash זה כספת בנק עם נעילת זמן: פתיחה לוקחת שנייה מכוונת וחדר מלא ציוד (זיכרון), וזה כלום לבעלים שמתחבר פעם אחת, והרס כלכלי לגנב שמנסה מיליארד צירופים. ה-salt הופך את המנעול של כל כספת לייחודי, כך שפיצוח אחת לא מלמד כלום על הבאה."
  },
  sections: [
    {
      h: { en: "Two worlds: cryptographic vs non-cryptographic", he: "שני עולמות: קריפטוגרפי מול לא קריפטוגרפי" },
      body: {
        en: `<p>This builds on <a href="#/lesson/pr-checksums-hashing">Checksums, Hashes, HMACs and Signatures</a> — here we go into choosing, parameters and code.</p>
<table>
<tr><th>Hash</th><th>Output</th><th>Speed (1 modern x86 core, order of magnitude)</th><th>Adversary-safe?</th><th>Use it for</th></tr>
<tr><td>CRC32C</td><td>32 bit</td><td>~10+ GB/s (SSE4.2 instruction)</td><td>No</td><td>Storage/network integrity: ext4, iSCSI, S3 checksums, Kafka</td></tr>
<tr><td>xxHash3 / XXH128</td><td>64/128 bit</td><td>~30 GB/s</td><td>No</td><td>Hash tables, dedupe caches, file change detection</td></tr>
<tr><td>MurmurHash3 / murmur2</td><td>32/128 bit</td><td>~5 GB/s</td><td>No</td><td>Partitioning: Kafka default partitioner (murmur2), Cassandra Murmur3Partitioner</td></tr>
<tr><td>SipHash</td><td>64 bit, <em>keyed</em></td><td>~1-2 GB/s</td><td>vs hash flooding</td><td>Hash tables exposed to user input (Python str, Rust HashMap)</td></tr>
<tr><td>SHA-256</td><td>256 bit</td><td>~1.5-2 GB/s with SHA-NI</td><td>Yes</td><td>Digests, signatures, TLS, Docker, Bitcoin, compliance (FIPS)</td></tr>
<tr><td>SHA-3 (Keccak)</td><td>224-512 bit</td><td>~0.5 GB/s in software</td><td>Yes</td><td>Diversity from SHA-2; no length extension</td></tr>
<tr><td>BLAKE3</td><td>256 bit (extendable)</td><td>~3-7 GB/s per core, scales with threads</td><td>Yes</td><td>Fast integrity of big files, content-addressed stores</td></tr>
<tr><td>MD5 / SHA-1</td><td>128 / 160 bit</td><td>fast</td><td><strong>No — broken</strong></td><td>Legacy checksums only</td></tr>
</table>
<p>Properties that make a hash "cryptographic": <strong>preimage resistance</strong> (given H, can't find any m), <strong>second-preimage resistance</strong> (given m1, can't find m2 with the same hash), <strong>collision resistance</strong> (can't find <em>any</em> pair), avalanche. Non-crypto hashes only promise good distribution and speed — an attacker can craft collisions at will.</p>
<blockquote>💡 Real world: HashDoS (2011) — attackers posted form fields whose names all collided in PHP/Java/Python hash tables, turning O(1) lookups into O(n²) and pinning a CPU with one request. That's why Python, Ruby and Rust now use a <em>keyed</em> SipHash with a random per-process key for strings — a fast hash isn't "safe" just because nobody's looking.</blockquote>`,
        he: `<p>השיעור הזה בונה על <a href="#/lesson/pr-checksums-hashing">Checksums, Hashes, HMACs and Signatures</a> — כאן נכנסים לבחירה, לפרמטרים ולקוד.</p>
<table>
<tr><th>Hash</th><th>פלט</th><th>מהירות (core אחד של x86 מודרני, סדר גודל)</th><th>בטוח מול תוקף?</th><th>משתמשים בו ל-</th></tr>
<tr><td>CRC32C</td><td>32 ביט</td><td>~10+ GB/s (הוראת SSE4.2)</td><td>לא</td><td>שלמות באחסון וברשת: ext4, ‏iSCSI, ‏checksums של S3, ‏Kafka</td></tr>
<tr><td>xxHash3 / XXH128</td><td>64/128 ביט</td><td>~30 GB/s</td><td>לא</td><td>Hash tables, ‏caches של dedupe, זיהוי שינוי בקבצים</td></tr>
<tr><td>MurmurHash3 / murmur2</td><td>32/128 ביט</td><td>~5 GB/s</td><td>לא</td><td>Partitioning: ה-partitioner הדיפולטי של Kafka ‏(murmur2), ‏Murmur3Partitioner של Cassandra</td></tr>
<tr><td>SipHash</td><td>64 ביט, <em>עם מפתח</em></td><td>~1-2 GB/s</td><td>מול hash flooding</td><td>Hash tables שחשופים לקלט משתמש (str של Python, ‏HashMap של Rust)</td></tr>
<tr><td>SHA-256</td><td>256 ביט</td><td>~1.5-2 GB/s עם SHA-NI</td><td>כן</td><td>Digests, חתימות, TLS, ‏Docker, ‏Bitcoin, תאימות (FIPS)</td></tr>
<tr><td>SHA-3 (Keccak)</td><td>224-512 ביט</td><td>~0.5 GB/s בתוכנה</td><td>כן</td><td>גיוון מול SHA-2; בלי length extension</td></tr>
<tr><td>BLAKE3</td><td>256 ביט (ניתן להארכה)</td><td>~3-7 GB/s ל-core, וגדל עם threads</td><td>כן</td><td>שלמות מהירה של קבצים גדולים, stores לפי תוכן</td></tr>
<tr><td>MD5 / SHA-1</td><td>128 / 160 ביט</td><td>מהיר</td><td><strong>לא — שבורים</strong></td><td>רק checksums של legacy</td></tr>
</table>
<p>התכונות שהופכות hash ל"קריפטוגרפי": <strong>preimage resistance</strong> (בהינתן H, אי אפשר למצוא m כלשהו), <strong>second-preimage resistance</strong> (בהינתן m1, אי אפשר למצוא m2 עם אותו hash), <strong>collision resistance</strong> (אי אפשר למצוא <em>שום</em> זוג), ואפקט מפולת. Hashes לא קריפטוגרפיים מבטיחים רק פיזור טוב ומהירות — תוקף יכול לייצר התנגשויות כרצונו.</p>
<blockquote>💡 מהשטח: HashDoS ‏(2011) — תוקפים שלחו שדות טופס שכל השמות שלהם התנגשו ב-hash tables של PHP, ‏Java ו-Python, הפכו lookups של O(1) ל-O(n²) והצמידו CPU לתקרה עם בקשה אחת. בגלל זה Python, ‏Ruby ו-Rust משתמשים היום ב-SipHash <em>עם מפתח</em> אקראי לכל תהליך עבור מחרוזות — hash מהיר לא "בטוח" רק כי אף אחד לא מסתכל.</blockquote>`
      }
    },
    {
      h: { en: "Passwords: slow, salted, memory-hard", he: "סיסמאות: איטי, עם salt, ‏memory-hard" },
      body: {
        en: `<p>Password hashing defends one scenario: <strong>the DB leaked</strong> and the attacker guesses offline at GPU speed. Rough numbers on one RTX 4090 (hashcat): MD5 ≈ 160 billion guesses/s, SHA-256 ≈ 20 billion/s, bcrypt at cost 5 ≈ 180 thousand/s — and every +1 in bcrypt cost halves that. A fast hash turns an 8-character password into minutes; a KDF turns it into centuries.</p>
<table>
<tr><th>Algorithm</th><th>Recommended parameters (OWASP)</th><th>Notes</th></tr>
<tr><td><strong>Argon2id</strong> (first choice)</td><td>m=19 MiB, t=2, p=1 minimum — or m=46 MiB, t=1, p=1; RFC 9106 suggests m=64 MiB, t=3, p=4</td><td>Memory-hard: GPUs/ASICs lose their advantage. Winner of the Password Hashing Competition (2015)</td></tr>
<tr><td>scrypt</td><td>N=2^17, r=8, p=1 (≈128 MiB)</td><td>Memory-hard; good when Argon2 isn't available</td></tr>
<tr><td>bcrypt</td><td>cost ≥ 10 (12 is common)</td><td>Only the first <strong>72 bytes</strong> count; not memory-hard; still fine for legacy</td></tr>
<tr><td>PBKDF2-HMAC-SHA256</td><td>600,000 iterations (SHA-512: 210,000)</td><td>Use only when FIPS-140 compliance requires it — GPU-friendly</td></tr>
</table>
<ul>
<li><strong>Salt</strong>: 16 random bytes per password, stored next to the hash (it's not secret). Kills rainbow tables and makes identical passwords hash differently. All modern libraries generate it for you.</li>
<li><strong>Pepper</strong>: an extra <em>secret</em> key kept outside the DB (KMS/HSM/secret manager) — e.g. <code>argon2id(HMAC(pepper, password))</code>. A SQL-injection dump of the users table alone becomes useless. Plan its rotation (you can't re-hash without the plaintext, so version it).</li>
<li><strong>Tune to your hardware</strong>: target ~50-250 ms per hash on your login servers, and rate-limit logins, because the slowness is also a DoS vector.</li>
<li><strong>Upgrade on login</strong>: store the algorithm and parameters in the hash string; when a user logs in with an old-format hash, verify it and re-hash with the new parameters.</li>
</ul>
<blockquote>⚠️ Production tip: bcrypt's 72-byte limit is a real-world bug, not trivia. In 2024 Okta disclosed that a cache key computed as <code>bcrypt(userId + username + password)</code> let users with usernames of 52+ characters log in <em>without the right password</em> — the password fell past byte 72 and was silently ignored. Never feed bcrypt concatenated fields, and pre-hash long inputs only with a well-known construction.</blockquote>`,
        he: `<p>Password hashing מגן על תרחיש אחד: <strong>ה-DB דלף</strong> והתוקף מנחש offline במהירות GPU. מספרים בערך על RTX 4090 אחד (hashcat): ‏MD5 ≈ ‏160 מיליארד ניחושים בשנייה, SHA-256 ≈ ‏20 מיליארד, bcrypt עם cost 5 ≈ ‏180 אלף — וכל +1 ב-cost של bcrypt חוצה את זה. Hash מהיר הופך סיסמה של 8 תווים לעניין של דקות; KDF הופך את זה למאות שנים.</p>
<table>
<tr><th>אלגוריתם</th><th>פרמטרים מומלצים (OWASP)</th><th>הערות</th></tr>
<tr><td><strong>Argon2id</strong> (בחירה ראשונה)</td><td>מינימום m=19 MiB, ‏t=2, ‏p=1 — או m=46 MiB, ‏t=1, ‏p=1; ‏RFC 9106 מציע m=64 MiB, ‏t=3, ‏p=4</td><td>Memory-hard: ל-GPUs ול-ASICs נעלם היתרון. הזוכה ב-Password Hashing Competition ‏(2015)</td></tr>
<tr><td>scrypt</td><td>N=2^17, ‏r=8, ‏p=1 (≈128 MiB)</td><td>Memory-hard; טוב כש-Argon2 לא זמין</td></tr>
<tr><td>bcrypt</td><td>cost ≥ 10 (12 נפוץ)</td><td>רק <strong>72 הבתים</strong> הראשונים נחשבים; לא memory-hard; עדיין בסדר ל-legacy</td></tr>
<tr><td>PBKDF2-HMAC-SHA256</td><td>‏600,000 איטרציות (SHA-512: ‏210,000)</td><td>רק כשתאימות FIPS-140 מחייבת — ידידותי ל-GPU</td></tr>
</table>
<ul>
<li><strong>Salt</strong>: ‏16 בתים אקראיים לכל סיסמה, נשמרים ליד ה-hash (הם לא סודיים). הורג rainbow tables וגורם לסיסמאות זהות לקבל hash שונה. כל ספרייה מודרנית מייצרת אותו בשבילך.</li>
<li><strong>Pepper</strong>: מפתח <em>סודי</em> נוסף שנשמר מחוץ ל-DB ‏(KMS, ‏HSM, ‏secret manager) — למשל <code>argon2id(HMAC(pepper, password))</code>. dump של טבלת המשתמשים דרך SQL injection לבד הופך לחסר ערך. תתכנן rotation (אי אפשר לעשות re-hash בלי ה-plaintext, אז מנהלים גרסאות).</li>
<li><strong>מכוונים לחומרה שלך</strong>: יעד של כ-50-250 ms ל-hash על שרתי ה-login, ועושים rate limit ל-logins, כי האיטיות היא גם וקטור DoS.</li>
<li><strong>שדרוג ב-login</strong>: שומרים את האלגוריתם והפרמטרים בתוך מחרוזת ה-hash; כשמשתמש מתחבר עם hash בפורמט ישן, מאמתים אותו ועושים re-hash עם הפרמטרים החדשים.</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: מגבלת 72 הבתים של bcrypt היא באג אמיתי, לא טריוויה. ב-2024 Okta חשפו ש-cache key שחושב כ-<code>bcrypt(userId + username + password)</code> אפשר למשתמשים עם username של 52 תווים ומעלה להתחבר <em>בלי הסיסמה הנכונה</em> — הסיסמה נפלה אחרי בייט 72 ונזרקה בשקט. לעולם אל תאכיל את bcrypt בשדות משורשרים, ותעשה pre-hash לקלטים ארוכים רק עם קונסטרוקציה מוכרת.</blockquote>`
      }
    },
    {
      h: { en: "Code: passwords and webhooks in Python and Node", he: "קוד: סיסמאות ו-webhooks ב-Python וב-Node" },
      body: {
        en: `<pre># Python — pip install argon2-cffi
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()               # argon2id, m=64 MiB, t=3, p=4 (RFC 9106 low-memory profile)
stored = ph.hash("correct horse battery staple")
# '$argon2id$v=19$m=65536,t=3,p=4$Zm9vYmFyc2FsdHNhbHQ$Kf3...'   alg, version, params, salt, hash

def login(stored: str, attempt: str) -&gt; bool:
    try:
        ph.verify(stored, attempt)
    except VerifyMismatchError:
        return False
    if ph.check_needs_rehash(stored):   # params were raised since this hash was made
        save(ph.hash(attempt))
    return True</pre>
<pre>// Node.js — built-in scrypt (no native deps)
const crypto = require('node:crypto');
const P = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }; // 128*N*r = 128 MiB &gt; default 32 MiB maxmem

function hash(pw) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(pw, salt, 32, P);
  return \`scrypt$\${P.N}$\${P.r}$\${P.p}$\${salt.toString('base64')}$\${dk.toString('base64')}\`;
}
function verify(stored, pw) {
  const [, N, r, p, s, h] = stored.split('$');
  const dk = crypto.scryptSync(pw, Buffer.from(s, 'base64'), 32,
                               { N: +N, r: +r, p: +p, maxmem: P.maxmem });
  return crypto.timingSafeEqual(dk, Buffer.from(h, 'base64'));
}</pre>
<pre>// Verify a GitHub webhook: header  X-Hub-Signature-256: sha256=&lt;hex&gt;
app.post('/hooks/github', express.raw({ type: '*/*' }), (req, res) =&gt; {   // RAW body, not parsed JSON
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.GH_SECRET)
                                     .update(req.body).digest('hex');
  const got = req.get('X-Hub-Signature-256') || '';
  const a = Buffer.from(expected), b = Buffer.from(got);
  // timingSafeEqual throws "RangeError [ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH]: Input buffers must have the same byte length"
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.sendStatus(401);
  res.sendStatus(204);
});</pre>
<blockquote>💡 Real world: Stripe's <code>Stripe-Signature: t=1731571200,v1=5257a8...</code> signs <code>timestamp + "." + raw_body</code> and its SDKs reject events older than 5 minutes by default — the timestamp is inside the MAC, so an attacker can't replay an old event with a fresh time.</blockquote>`,
        he: `<pre># Python — pip install argon2-cffi
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()               # argon2id, m=64 MiB, t=3, p=4 (RFC 9106 low-memory profile)
stored = ph.hash("correct horse battery staple")
# '$argon2id$v=19$m=65536,t=3,p=4$Zm9vYmFyc2FsdHNhbHQ$Kf3...'   alg, version, params, salt, hash

def login(stored: str, attempt: str) -&gt; bool:
    try:
        ph.verify(stored, attempt)
    except VerifyMismatchError:
        return False
    if ph.check_needs_rehash(stored):   # params were raised since this hash was made
        save(ph.hash(attempt))
    return True</pre>
<pre>// Node.js — built-in scrypt (no native deps)
const crypto = require('node:crypto');
const P = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }; // 128*N*r = 128 MiB &gt; default 32 MiB maxmem

function hash(pw) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(pw, salt, 32, P);
  return \`scrypt$\${P.N}$\${P.r}$\${P.p}$\${salt.toString('base64')}$\${dk.toString('base64')}\`;
}
function verify(stored, pw) {
  const [, N, r, p, s, h] = stored.split('$');
  const dk = crypto.scryptSync(pw, Buffer.from(s, 'base64'), 32,
                               { N: +N, r: +r, p: +p, maxmem: P.maxmem });
  return crypto.timingSafeEqual(dk, Buffer.from(h, 'base64'));
}</pre>
<pre>// Verify a GitHub webhook: header  X-Hub-Signature-256: sha256=&lt;hex&gt;
app.post('/hooks/github', express.raw({ type: '*/*' }), (req, res) =&gt; {   // RAW body, not parsed JSON
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.GH_SECRET)
                                     .update(req.body).digest('hex');
  const got = req.get('X-Hub-Signature-256') || '';
  const a = Buffer.from(expected), b = Buffer.from(got);
  // timingSafeEqual throws "RangeError [ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH]: Input buffers must have the same byte length"
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.sendStatus(401);
  res.sendStatus(204);
});</pre>
<blockquote>💡 מהשטח: ה-<code>Stripe-Signature: t=1731571200,v1=5257a8...</code> של Stripe חותם על <code>timestamp + "." + raw_body</code>, וה-SDKs שלהם דוחים כברירת מחדל אירועים ישנים מ-5 דקות — ה-timestamp נמצא בתוך ה-MAC, אז תוקף לא יכול לשלוח שוב אירוע ישן עם זמן טרי.</blockquote>`
      }
    },
    {
      h: { en: "Content addressing and hash-based placement", he: "Content addressing ומיקום לפי hash" },
      body: {
        en: `<p>When the name <em>is</em> the hash, integrity and dedupe come for free:</p>
<pre># Git: blob id = SHA-1("blob " + length + "\\0" + content)
$ echo hello | git hash-object --stdin
ce013625030ba8dba906f756967f9e9ca394464a
$ printf 'blob 6\\0hello\\n' | sha1sum
ce013625030ba8dba906f756967f9e9ca394464a  -

# Docker/OCI: the digest is sha256 of the manifest bytes — immutable, unlike tags
$ docker buildx imagetools inspect nginx:1.27 --format '{{json .Manifest.Digest}}'
"sha256:...64 hex chars..."
image: nginx@sha256:&lt;digest&gt;     # pin this in prod manifests

$ echo -n hello | sha256sum
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824  -</pre>
<p><strong>Hash-based placement</strong> uses fast, non-crypto hashes because collisions are expected and harmless:</p>
<ul>
<li><strong>Modulo</strong>: <code>partition = murmur2(key) % 12</code> (Kafka). Same key → same partition → ordering per key. But change N and almost everything moves: 10 → 11 nodes remaps ~91% of keys. That's why Kafka makes adding partitions break key ordering.</li>
<li><strong>Fixed slots</strong>: Redis Cluster maps <code>CRC16(key) mod 16384</code> to slots, and moves <em>slots</em> between nodes. <code>{user:42}:cart</code> hash tags force related keys into one slot.</li>
<li><strong>Consistent hashing</strong>: nodes and keys on one ring (Cassandra, DynamoDB, Envoy ring-hash LB); adding a node moves only ~1/N of keys. Virtual nodes (e.g. 256 per node) smooth the distribution. Alternatives: rendezvous (HRW) hashing, Jump Consistent Hash, Maglev (Google's LB).</li>
</ul>
<blockquote>💡 Real world: the "hot partition" problem is a hash working perfectly on a skewed key — <code>tenant_id</code> where one tenant is 40% of traffic lands 40% of load on one partition. A better hash won't help; a better key (tenant + random suffix bucket, or a composite key) will.</blockquote>`,
        he: `<p>כשהשם <em>הוא</em> ה-hash, שלמות ו-dedupe מגיעים בחינם:</p>
<pre># Git: blob id = SHA-1("blob " + length + "\\0" + content)
$ echo hello | git hash-object --stdin
ce013625030ba8dba906f756967f9e9ca394464a
$ printf 'blob 6\\0hello\\n' | sha1sum
ce013625030ba8dba906f756967f9e9ca394464a  -

# Docker/OCI: the digest is sha256 of the manifest bytes — immutable, unlike tags
$ docker buildx imagetools inspect nginx:1.27 --format '{{json .Manifest.Digest}}'
"sha256:...64 hex chars..."
image: nginx@sha256:&lt;digest&gt;     # pin this in prod manifests

$ echo -n hello | sha256sum
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824  -</pre>
<p><strong>מיקום לפי hash</strong> משתמש ב-hashes מהירים ולא קריפטוגרפיים, כי התנגשויות צפויות ולא מזיקות:</p>
<ul>
<li><strong>Modulo</strong>: ‏<code>partition = murmur2(key) % 12</code> ‏(Kafka). אותו key ← אותו partition ← סדר לכל key. אבל משנים את N וכמעט הכל זז: מעבר מ-10 ל-11 nodes ממפה מחדש כ-91% מהמפתחות. בגלל זה ב-Kafka הוספת partitions שוברת את הסדר לפי key.</li>
<li><strong>Slots קבועים</strong>: ‏Redis Cluster ממפה <code>CRC16(key) mod 16384</code> ל-slots, ומזיז <em>slots</em> בין nodes. ‏hash tags כמו <code>{user:42}:cart</code> מכריחים מפתחות קשורים להיכנס ל-slot אחד.</li>
<li><strong>Consistent hashing</strong>: ‏nodes ומפתחות על טבעת אחת (Cassandra, ‏DynamoDB, ‏ring-hash LB של Envoy); הוספת node מזיזה רק כ-1/N מהמפתחות. ‏Virtual nodes (למשל 256 ל-node) מחליקים את הפיזור. חלופות: rendezvous ‏(HRW) hashing, ‏Jump Consistent Hash, ‏Maglev (ה-LB של Google).</li>
</ul>
<blockquote>💡 מהשטח: בעיית ה-"hot partition" היא hash שעובד מושלם על key מוטה — <code>tenant_id</code> שבו tenant אחד הוא 40% מהתעבורה שם 40% מהעומס על partition אחד. Hash טוב יותר לא יעזור; key טוב יותר (tenant + סיומת אקראית של bucket, או key מורכב) כן.</blockquote>`
      }
    },
    {
      h: { en: "Broken hashes and the attacks that still bite", he: "Hashes שבורים וההתקפות שעדיין נושכות" },
      body: {
        en: `<table>
<tr><th>Attack</th><th>Affects</th><th>Real example</th><th>Defense</th></tr>
<tr><td>Collision</td><td>MD5 (seconds on a laptop), SHA-1</td><td>Flame malware forged a Microsoft code-signing cert via an MD5 chosen-prefix collision (2012); SHAttered (2017): two different PDFs, same SHA-1, ~2^63 SHA-1 computations; Shambles (2020): chosen-prefix SHA-1 for ~$45k of GPU time</td><td>SHA-256+ for anything signed; NIST retires SHA-1 entirely by 2030</td></tr>
<tr><td>Length extension</td><td>MD5, SHA-1, SHA-256, SHA-512 used as <code>H(secret ‖ msg)</code></td><td>Flickr API signatures (2009) — attackers appended parameters and computed valid signatures without the secret</td><td>HMAC; or SHA-3 / BLAKE2/3 / SHA-512/256, which aren't vulnerable</td></tr>
<tr><td>Timing leak</td><td>Any <code>==</code> on MACs/tokens</td><td>Byte-by-byte guessing of HMACs over the network (measurable with enough samples)</td><td><code>hmac.compare_digest</code>, <code>crypto.timingSafeEqual</code>, <code>MessageDigest.isEqual</code></td></tr>
<tr><td>Rainbow / dictionary</td><td>Unsalted or fast password hashes</td><td>LinkedIn 2012: 6.5M unsalted SHA-1 hashes, most cracked within days</td><td>Argon2id/scrypt/bcrypt with per-user salt</td></tr>
<tr><td>Hash flooding</td><td>Unkeyed hash tables on user input</td><td>HashDoS 2011 across PHP, Java, Python, Ruby</td><td>Keyed SipHash, limits on parameter counts</td></tr>
</table>
<p>Git still uses SHA-1 object ids, but since Git 2.13 it ships <strong>SHA-1DC</strong>, which detects the SHAttered-style collision pattern and refuses it; <code>git init --object-format=sha256</code> creates SHA-256 repositories (interop with hosting is still limited). MD5 remains fine for non-adversarial checks like <code>Content-MD5</code> against transfer corruption — the question is always "can an attacker choose the input?"</p>
<blockquote>⚠️ Production tip: for "is this the same file?" across a trust boundary (downloads, artifacts, SBOM), publish SHA-256 <em>and sign it</em> (cosign, minisign, GPG). A checksum on the same compromised server as the binary proves nothing.</blockquote>`,
        he: `<table>
<tr><th>התקפה</th><th>פוגעת ב-</th><th>דוגמה אמיתית</th><th>הגנה</th></tr>
<tr><td>Collision</td><td>MD5 (שניות על לפטופ), SHA-1</td><td>הנוזקה Flame זייפה תעודת code-signing של Microsoft דרך התנגשות chosen-prefix ב-MD5 ‏(2012); SHAttered ‏(2017): שני קבצי PDF שונים, אותו SHA-1, בערך 2^63 חישובי SHA-1; ‏Shambles ‏(2020): ‏chosen-prefix ל-SHA-1 בכ-45 אלף דולר של זמן GPU</td><td>SHA-256 ומעלה לכל דבר חתום; NIST מוציאים את SHA-1 לגמרי משימוש עד 2030</td></tr>
<tr><td>Length extension</td><td>MD5, ‏SHA-1, ‏SHA-256, ‏SHA-512 בשימוש כ-<code>H(secret ‖ msg)</code></td><td>חתימות ה-API של Flickr ‏(2009) — תוקפים הוסיפו פרמטרים וחישבו חתימות תקינות בלי הסוד</td><td>HMAC; או SHA-3 / BLAKE2/3 / SHA-512/256, שלא פגיעים</td></tr>
<tr><td>Timing leak</td><td>כל <code>==</code> על MACs או tokens</td><td>ניחוש HMAC בייט אחרי בייט דרך הרשת (מדיד עם מספיק דגימות)</td><td><code>hmac.compare_digest</code>, <code>crypto.timingSafeEqual</code>, <code>MessageDigest.isEqual</code></td></tr>
<tr><td>Rainbow / dictionary</td><td>Password hashes בלי salt או מהירים</td><td>LinkedIn ‏2012: ‏6.5 מיליון hashes של SHA-1 בלי salt, רובם פוצחו תוך ימים</td><td>Argon2id, ‏scrypt או bcrypt עם salt לכל משתמש</td></tr>
<tr><td>Hash flooding</td><td>Hash tables בלי מפתח על קלט משתמש</td><td>HashDoS ‏2011 ב-PHP, ‏Java, ‏Python, ‏Ruby</td><td>SipHash עם מפתח, הגבלה על מספר פרמטרים</td></tr>
</table>
<p>Git עדיין משתמש ב-object ids של SHA-1, אבל מאז Git 2.13 הוא מגיע עם <strong>SHA-1DC</strong>, שמזהה את דפוס ההתנגשות של SHAttered ומסרב לו; <code>git init --object-format=sha256</code> יוצר repositories של SHA-256 (התאימות מול שירותי hosting עדיין מוגבלת). MD5 נשאר בסדר לבדיקות לא עוינות כמו <code>Content-MD5</code> מול השחתה בהעברה — השאלה תמיד "האם תוקף יכול לבחור את הקלט?"</p>
<blockquote>⚠️ טיפ לפרודקשן: בשביל "האם זה אותו קובץ?" מעבר לגבול אמון (הורדות, artifacts, ‏SBOM), מפרסמים SHA-256 <em>וחותמים עליו</em> (cosign, ‏minisign, ‏GPG). Checksum על אותו שרת פרוץ שמחזיק את ה-binary לא מוכיח כלום.</blockquote>`
      }
    }
  ],
  diagram: `need speed / accidents?      -> CRC32C, xxHash3            (never vs attackers)
need placement / sharding?   -> murmur, CRC16 slots, consistent hashing
user-controlled hash table?  -> keyed SipHash
tamper-evident fingerprint?  -> SHA-256 / BLAKE3 (+ signature across trust boundaries)
who sent it (shared secret)? -> HMAC-SHA256 + constant-time compare + timestamp
store a password?            -> Argon2id (m>=19MiB,t>=2) | scrypt | bcrypt>=10  + salt (+ pepper)
MD5 / SHA-1 vs an attacker?  -> no`,
  handsOn: [
    { cmd: "python3 -c \"import hashlib,time;t=time.time();[hashlib.sha256(b'pw%d'%i).digest() for i in range(10**6)];print(f'{1e6/(time.time()-t):,.0f} sha256/s on one core')\"", what: { en: "Measure how many SHA-256 'password guesses' one CPU core does per second — then imagine a GPU doing ~1000x more.", he: "מודד כמה 'ניחושי סיסמה' של SHA-256 core אחד עושה בשנייה — ואז תדמיין GPU שעושה פי 1000 בערך." } },
    { cmd: "pip install argon2-cffi && python3 -m argon2 -t 2 -m 19456 -p 1", what: { en: "Benchmark Argon2id with OWASP's minimum parameters on your hardware — aim for 50-250 ms.", he: "מריץ benchmark ל-Argon2id עם פרמטרי המינימום של OWASP על החומרה שלך — היעד הוא 50-250 ms." } },
    { cmd: "echo hello | git hash-object --stdin; printf 'blob 6\\0hello\\n' | sha1sum", what: { en: "Prove Git's object id is just SHA-1 over a header plus content.", he: "מוכיח שה-object id של Git הוא פשוט SHA-1 על header ועוד התוכן." } },
    { cmd: "echo -n 'payload' | openssl dgst -sha256 -hmac 'whsec_test'; echo -n 'payload' | openssl dgst -sha3-256", what: { en: "Compute an HMAC and a SHA-3 digest from the shell.", he: "מחשב HMAC ו-digest של SHA-3 מה-shell." } }
  ],
  mnemonic: {
    en: "\"Fast for files, slow for secrets, keyed for strangers.\" Fast hashes for data, slow memory-hard KDFs for passwords, keys (HMAC/SipHash) whenever an outsider controls the input.",
    he: "\"מהיר לקבצים, איטי לסודות, עם מפתח לזרים.\" Hashes מהירים לנתונים, KDFs איטיים ו-memory-hard לסיסמאות, ומפתח (HMAC או SipHash) כל פעם שגורם חיצוני שולט בקלט."
  },
  pitfalls: [
    { en: "Storing passwords as SHA-256(salt + password) — salted but still billions of guesses per second on a GPU; use Argon2id/scrypt/bcrypt.", he: "לשמור סיסמאות כ-SHA-256(salt + password) — יש salt, אבל עדיין מיליארדי ניחושים בשנייה על GPU; משתמשים ב-Argon2id, ‏scrypt או bcrypt." },
    { en: "Building a MAC as sha256(secret + body) — vulnerable to length extension; use HMAC.", he: "לבנות MAC כ-sha256(secret + body) — פגיע ל-length extension; משתמשים ב-HMAC." },
    { en: "Using CRC32 or a 32-bit hash as a unique ID — 50% collision chance at ~77k items.", he: "להשתמש ב-CRC32 או ב-hash של 32 ביט כמזהה ייחודי — סיכוי של 50% להתנגשות בכ-77 אלף פריטים." },
    { en: "Feeding bcrypt more than 72 bytes (concatenated fields, long passphrases) — the tail is silently ignored.", he: "להאכיל את bcrypt ביותר מ-72 בתים (שדות משורשרים, passphrases ארוכים) — הסוף נזרק בשקט." }
  ],
  interview: [
    {
      q: { en: "Your company stores passwords as unsalted SHA-1. How do you migrate without forcing every user to reset?", he: "החברה שלך שומרת סיסמאות כ-SHA-1 בלי salt. איך עוברים בלי להכריח כל משתמש לאפס?" },
      a: { en: "Wrap immediately: compute argon2id(sha1_hash) for every row in a batch job, store it with a version marker, and delete the raw SHA-1 values — the whole DB is protected today. On login, verify via argon2id(sha1(password)); then re-hash as plain argon2id(password) and update the version. After a grace period, force resets only for the dormant accounts still on the wrapped format. Add a pepper from KMS while you're at it, and rate-limit logins.", he: "עוטפים מיד: מחשבים argon2id(sha1_hash) לכל שורה ב-batch job, שומרים עם סימון גרסה, ומוחקים את ערכי ה-SHA-1 הגולמיים — כל ה-DB מוגן כבר היום. ב-login מאמתים דרך argon2id(sha1(password)); ואז עושים re-hash כ-argon2id(password) רגיל ומעדכנים גרסה. אחרי תקופת חסד, מכריחים איפוס רק לחשבונות רדומים שעדיין בפורמט העטוף. באותה הזדמנות מוסיפים pepper מ-KMS, ועושים rate limit ל-logins." }
    },
    {
      q: { en: "Why is xxHash fine for a cache key but not for deduplicating user uploads in a shared store?", he: "למה xxHash בסדר ל-cache key אבל לא ל-dedupe של uploads של משתמשים ב-store משותף?" },
      a: { en: "A cache key collision costs a miss or a wrong cache hit inside your own trusted data, and accidental 64/128-bit collisions are astronomically rare. In a shared dedupe store, an attacker controls the input and can craft two files with the same non-crypto hash — uploading a malicious file that dedupes onto a victim's legitimate one. Content addressing across trust boundaries needs a collision-resistant hash: SHA-256 or BLAKE3.", he: "התנגשות ב-cache key עולה ב-miss או ב-hit שגוי בתוך הנתונים האמינים שלך, והתנגשויות מקריות ב-64/128 ביט נדירות באופן אסטרונומי. ב-store משותף עם dedupe, תוקף שולט בקלט ויכול לייצר שני קבצים עם אותו hash לא קריפטוגרפי — ולהעלות קובץ זדוני שמתאחד עם קובץ לגיטימי של קורבן. Content addressing מעבר לגבול אמון דורש hash עמיד להתנגשויות: SHA-256 או BLAKE3." }
    }
  ],
  quiz: [
    {
      q: { en: "Which is the best default for new password storage?", he: "מה ברירת המחדל הכי טובה לשמירת סיסמאות חדשה?" },
      options: [
        { en: "SHA-256 with a per-user salt", he: "SHA-256 עם salt לכל משתמש" },
        { en: "Argon2id with a per-user salt", he: "Argon2id עם salt לכל משתמש" },
        { en: "AES-256 encryption of the password", he: "הצפנת הסיסמה ב-AES-256" },
        { en: "MD5 with a pepper", he: "MD5 עם pepper" }
      ],
      answer: 1,
      explain: { en: "Argon2id is slow and memory-hard, which neutralizes GPU guessing; encryption is reversible, fast hashes are too fast.", he: "Argon2id איטי ו-memory-hard, מה שמנטרל ניחוש על GPU; הצפנה הפיכה, ו-hashes מהירים מהירים מדי." }
    },
    {
      q: { en: "What does a pepper protect against that a salt doesn't?", he: "ממה pepper מגן ש-salt לא?" },
      options: [
        { en: "Identical passwords getting identical hashes", he: "סיסמאות זהות שמקבלות hash זהה" },
        { en: "Rainbow tables", he: "Rainbow tables" },
        { en: "A DB-only leak (e.g. SQL injection) where the secret key wasn't stolen", he: "דליפה של ה-DB בלבד (למשל SQL injection) שבה המפתח הסודי לא נגנב" },
        { en: "Timing attacks", he: "התקפות timing" }
      ],
      answer: 2,
      explain: { en: "The pepper lives outside the DB; without it, the dumped hashes can't even be tested offline.", he: "ה-pepper חי מחוץ ל-DB; בלעדיו, אי אפשר אפילו לבדוק offline את ה-hashes שדלפו." }
    },
    {
      q: { en: "Adding a node to a modulo-sharded cluster (10 → 11) moves roughly how many keys?", he: "הוספת node ל-cluster עם sharding לפי modulo ‏(10 ← 11) מזיזה בערך כמה מפתחות?" },
      options: [
        { en: "~9%", he: "~9%" },
        { en: "~50%", he: "~50%" },
        { en: "~91%", he: "~91%" },
        { en: "None", he: "אף אחד" }
      ],
      answer: 2,
      explain: { en: "A key stays only if h%10 == h%11, about 1/11 of keys; consistent hashing would move only ~1/11.", he: "מפתח נשאר רק אם h%10 == h%11, בערך 1/11 מהמפתחות; עם consistent hashing רק כ-1/11 היו זזים." }
    },
    {
      q: { en: "Why use crypto.timingSafeEqual to compare webhook signatures?", he: "למה להשתמש ב-crypto.timingSafeEqual כדי להשוות חתימות webhook?" },
      options: [
        { en: "It hashes both values first", he: "הוא עושה hash לשני הערכים קודם" },
        { en: "Its run time doesn't depend on where the first mismatch is", he: "זמן הריצה שלו לא תלוי במיקום אי-ההתאמה הראשונה" },
        { en: "It's faster than ===", he: "הוא מהיר יותר מ-===" },
        { en: "It verifies the timestamp", he: "הוא מאמת את ה-timestamp" }
      ],
      answer: 1,
      explain: { en: "=== exits at the first differing byte, leaking how much of a forged signature was right.", he: "=== יוצא בבייט השונה הראשון, ומדליף כמה מחתימה מזויפת היה נכון." }
    }
  ],
  related: ["pr-checksums-hashing", "pr-applied-crypto-pki", "pr-auth", "pr-data-security", "crypto-encryption-practice", "pr-security-owasp"]
});

/* ------------------------------------------------------------------ 5 */
window.INFRA.lessons.push({
  id: "crypto-encryption-practice",
  track: "principal",
  order: 151,
  icon: "🗝️",
  level: 3,
  minutes: 18,
  title: { en: "Encryption in Practice", he: "הצפנה בפרקטיקה" },
  tldr: {
    en: "Encrypt data with an AEAD (AES-256-GCM or ChaCha20-Poly1305) and a nonce that never repeats, move keys with asymmetric crypto (X25519/ML-KEM, RSA-OAEP) in a hybrid scheme, keep keys in a KMS/HSM via envelope encryption, and decide the layer by asking who must NOT be able to read it: the disk thief (at rest), the network (in transit), the DBA (field-level) or even you (end-to-end).",
    he: "מצפינים נתונים עם AEAD ‏(AES-256-GCM או ChaCha20-Poly1305) ו-nonce שאף פעם לא חוזר, מעבירים מפתחות עם קריפטוגרפיה א-סימטרית (X25519/ML-KEM, ‏RSA-OAEP) בסכמה היברידית, מחזיקים מפתחות ב-KMS או HSM דרך envelope encryption, ובוחרים את השכבה לפי השאלה מי אסור שיוכל לקרוא: גנב הדיסק (at rest), הרשת (in transit), ה-DBA ‏(field-level) או אפילו אתה (end-to-end)."
  },
  analogy: {
    en: "Symmetric encryption is a shared padlock: fast, but both sides need the same key. Asymmetric is an open padlock you mail to anyone — they snap it shut on a box, only your key opens it. Hybrid encryption is the real postal system: you send a cheap, fast padlocked box (AES) and tape to it a tiny envelope holding the box key, locked with the recipient's mail-padlock (RSA/X25519). Envelope encryption with KMS is the same trick, except the master key never leaves the bank's vault — you only ask the bank to unlock the tiny envelope.",
    he: "הצפנה סימטרית זה מנעול משותף: מהיר, אבל לשני הצדדים צריך אותו מפתח. א-סימטרית זה מנעול פתוח שאתה שולח בדואר לכל אחד — הוא סוגר איתו קופסה, ורק המפתח שלך פותח. הצפנה היברידית זה הדואר האמיתי: שולחים קופסה זולה ומהירה עם מנעול (AES), ומדביקים עליה מעטפה קטנה עם מפתח הקופסה, נעולה במנעול-הדואר של הנמען (RSA/X25519). Envelope encryption עם KMS זה אותו טריק, רק שמפתח האב לא יוצא מהכספת של הבנק — אתה רק מבקש מהבנק לפתוח את המעטפה הקטנה."
  },
  sections: [
    {
      h: { en: "Symmetric: modes, AEAD and the nonce rule", he: "סימטרי: modes, ‏AEAD וחוק ה-nonce" },
      body: {
        en: `<p>This goes deeper than <a href="#/lesson/pr-applied-crypto-pki">Applied Cryptography &amp; PKI</a>: what to pick, what breaks, and the commands. AES itself is a 128-bit block cipher; the <strong>mode</strong> decides whether it's safe.</p>
<table>
<tr><th>Mode</th><th>Integrity?</th><th>Nonce/IV</th><th>Verdict</th></tr>
<tr><td>ECB</td><td>No</td><td>none</td><td><strong>Never.</strong> Equal blocks → equal ciphertext; the famous "ECB penguin" image stays recognizable</td></tr>
<tr><td>CBC</td><td>No</td><td>16-byte random, unpredictable</td><td>Legacy. Without a MAC → padding-oracle attacks (POODLE, Lucky13)</td></tr>
<tr><td>CTR</td><td>No</td><td>unique counter</td><td>Bit-flipping: attacker flips ciphertext bit = flips plaintext bit</td></tr>
<tr><td><strong>AES-GCM</strong></td><td>Yes (16-byte tag)</td><td>12-byte, <strong>unique per key</strong></td><td>Default. Hardware-accelerated (AES-NI): several GB/s per core</td></tr>
<tr><td><strong>ChaCha20-Poly1305</strong></td><td>Yes</td><td>12-byte unique (XChaCha20: 24-byte, random is safe)</td><td>Fast in software — phones and CPUs without AES-NI; TLS and WireGuard use it</td></tr>
<tr><td>AES-GCM-SIV</td><td>Yes</td><td>12-byte; reuse only leaks equality</td><td>"Misuse-resistant" choice when you can't guarantee unique nonces</td></tr>
</table>
<p><strong>The nonce rule:</strong> with GCM or ChaCha20-Poly1305, encrypting two messages with the same key <em>and</em> nonce leaks the XOR of the plaintexts and the authentication key — the attacker can then forge messages. Random 96-bit nonces are safe for about 2^32 messages per key (NIST's limit); beyond that use a counter, rotate keys, or use XChaCha20 / GCM-SIV.</p>
<p><strong>Key sizes:</strong> AES-128 is still unbroken; AES-256 is the usual choice today because it keeps a 128-bit margin even against Grover's quantum search. Keys come from a CSPRNG (<code>os.urandom</code>, <code>crypto.randomBytes</code>, <code>/dev/urandom</code>) or a KDF — never from <code>Math.random()</code>, timestamps or a password used directly.</p>
<blockquote>⚠️ Production tip: Java's <code>Cipher.getInstance("AES")</code> silently means <code>AES/ECB/PKCS5Padding</code>. Always spell out the full transformation: <code>Cipher.getInstance("AES/GCM/NoPadding")</code> with a <code>GCMParameterSpec(128, nonce)</code>. Static analyzers (SpotBugs, Semgrep, CodeQL) flag the short form — turn that rule on.</blockquote>`,
        he: `<p>השיעור הזה הולך יותר לעומק מ-<a href="#/lesson/pr-applied-crypto-pki">Applied Cryptography &amp; PKI</a>: מה לבחור, מה נשבר, והפקודות. AES עצמו הוא block cipher של 128 ביט; ה-<strong>mode</strong> קובע אם זה בטוח.</p>
<table>
<tr><th>Mode</th><th>שלמות?</th><th>Nonce/IV</th><th>שורה תחתונה</th></tr>
<tr><td>ECB</td><td>לא</td><td>אין</td><td><strong>אף פעם.</strong> בלוקים שווים ← ciphertext שווה; תמונת "הפינגווין של ECB" המפורסמת נשארת מזוהה</td></tr>
<tr><td>CBC</td><td>לא</td><td>16 בתים אקראיים ובלתי צפויים</td><td>Legacy. בלי MAC ← התקפות padding oracle ‏(POODLE, ‏Lucky13)</td></tr>
<tr><td>CTR</td><td>לא</td><td>מונה ייחודי</td><td>Bit-flipping: תוקף הופך ביט ב-ciphertext = הופך ביט ב-plaintext</td></tr>
<tr><td><strong>AES-GCM</strong></td><td>כן (tag של 16 בתים)</td><td>12 בתים, <strong>ייחודי לכל מפתח</strong></td><td>ברירת המחדל. מואץ בחומרה (AES-NI): כמה GB/s ל-core</td></tr>
<tr><td><strong>ChaCha20-Poly1305</strong></td><td>כן</td><td>12 בתים ייחודי (XChaCha20: ‏24 בתים, אקראי זה בטוח)</td><td>מהיר בתוכנה — טלפונים ו-CPUs בלי AES-NI; ‏TLS ו-WireGuard משתמשים בו</td></tr>
<tr><td>AES-GCM-SIV</td><td>כן</td><td>12 בתים; שימוש חוזר מדליף רק שוויון</td><td>הבחירה ה-"misuse-resistant" כשאי אפשר להבטיח nonces ייחודיים</td></tr>
</table>
<p><strong>חוק ה-nonce:</strong> עם GCM או ChaCha20-Poly1305, הצפנה של שתי הודעות עם אותו מפתח <em>ואותו</em> nonce מדליפה את ה-XOR של ה-plaintexts ואת מפתח האימות — ואז התוקף יכול לזייף הודעות. Nonces אקראיים של 96 ביט בטוחים לבערך 2^32 הודעות לכל מפתח (הגבול של NIST); מעבר לזה משתמשים במונה, מחליפים מפתחות, או עוברים ל-XChaCha20 / GCM-SIV.</p>
<p><strong>גדלי מפתח:</strong> AES-128 עדיין לא שבור; AES-256 הוא הבחירה הרגילה היום כי הוא שומר מרווח של 128 ביט גם מול החיפוש הקוונטי של Grover. מפתחות מגיעים מ-CSPRNG ‏(<code>os.urandom</code>, <code>crypto.randomBytes</code>, <code>/dev/urandom</code>) או מ-KDF — אף פעם לא מ-<code>Math.random()</code>, מ-timestamps או מסיסמה שמשמשת ישירות.</p>
<blockquote>⚠️ טיפ לפרודקשן: <code>Cipher.getInstance("AES")</code> ב-Java אומר בשקט <code>AES/ECB/PKCS5Padding</code>. תמיד תכתוב את ה-transformation המלא: <code>Cipher.getInstance("AES/GCM/NoPadding")</code> עם <code>GCMParameterSpec(128, nonce)</code>. כלי ניתוח סטטי (SpotBugs, ‏Semgrep, ‏CodeQL) מסמנים את הצורה הקצרה — תדליק את החוק הזה.</blockquote>`
      }
    },
    {
      h: { en: "Asymmetric and hybrid: RSA vs ECC, and why nobody RSA-encrypts files", he: "א-סימטרי והיברידי: RSA מול ECC, ולמה אף אחד לא מצפין קבצים ב-RSA" },
      body: {
        en: `<table>
<tr><th>Algorithm</th><th>Job</th><th>Security level</th><th>Sizes</th></tr>
<tr><td>RSA-2048</td><td>Encrypt (OAEP) / sign (PSS)</td><td>~112-bit</td><td>256-byte signatures; minimum acceptable today</td></tr>
<tr><td>RSA-3072</td><td>same</td><td>~128-bit</td><td>Slow keygen, 384-byte signatures</td></tr>
<tr><td>ECDSA P-256</td><td>Sign</td><td>~128-bit</td><td>64-byte signatures; needs a good random per signature (Sony PS3 reused it → key leaked)</td></tr>
<tr><td><strong>Ed25519</strong></td><td>Sign</td><td>~128-bit</td><td>32-byte keys, 64-byte signatures, deterministic — SSH, cosign, git</td></tr>
<tr><td><strong>X25519</strong></td><td>Key agreement (ECDH)</td><td>~128-bit</td><td>32-byte keys; TLS 1.3, WireGuard, Signal, age</td></tr>
<tr><td><strong>ML-KEM-768</strong></td><td>Key encapsulation (post-quantum)</td><td>NIST level 3</td><td>1,184-byte public key, 1,088-byte ciphertext — FIPS 203 (2024)</td></tr>
</table>
<p>Asymmetric crypto is ~1000x slower than AES and can only handle tiny inputs — RSA-2048 with OAEP-SHA256 encrypts at most <strong>190 bytes</strong>. So every real system is <strong>hybrid</strong>: generate a random symmetric key, encrypt the data with AES-GCM, and encrypt (or agree on) just that key asymmetrically. TLS, PGP, JWE, S/MIME and <strong>HPKE</strong> (RFC 9180, the modern standard used by Encrypted Client Hello and MLS) all work this way.</p>
<pre># age: modern hybrid file encryption (X25519 + ChaCha20-Poly1305), used by sops
$ age-keygen -o key.txt
Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
$ age -r age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p -o db.dump.age db.dump
$ age -d -i key.txt -o db.dump db.dump.age

# sops: encrypt only the values in a YAML secret, keys stay readable in git diffs
$ sops --encrypt --age age1ql3z... secrets.yaml &gt; secrets.enc.yaml</pre>
<blockquote>💡 Real world: never use RSA PKCS#1 v1.5 <em>encryption</em> padding in new code — Bleichenbacher's 1998 padding oracle came back as ROBOT in 2017 and broke TLS on F5, Citrix and Cisco devices. Use OAEP, or better, skip RSA encryption entirely and use X25519/HPKE.</blockquote>`,
        he: `<table>
<tr><th>אלגוריתם</th><th>תפקיד</th><th>רמת אבטחה</th><th>גדלים</th></tr>
<tr><td>RSA-2048</td><td>הצפנה (OAEP) / חתימה (PSS)</td><td>~112 ביט</td><td>חתימות של 256 בתים; המינימום הסביר היום</td></tr>
<tr><td>RSA-3072</td><td>אותו דבר</td><td>~128 ביט</td><td>יצירת מפתח איטית, חתימות של 384 בתים</td></tr>
<tr><td>ECDSA P-256</td><td>חתימה</td><td>~128 ביט</td><td>חתימות של 64 בתים; צריך ערך אקראי טוב לכל חתימה (ב-Sony PS3 השתמשו שוב באותו ערך ← המפתח דלף)</td></tr>
<tr><td><strong>Ed25519</strong></td><td>חתימה</td><td>~128 ביט</td><td>מפתחות של 32 בתים, חתימות של 64, דטרמיניסטי — SSH, ‏cosign, ‏git</td></tr>
<tr><td><strong>X25519</strong></td><td>Key agreement ‏(ECDH)</td><td>~128 ביט</td><td>מפתחות של 32 בתים; TLS 1.3, ‏WireGuard, ‏Signal, ‏age</td></tr>
<tr><td><strong>ML-KEM-768</strong></td><td>Key encapsulation (פוסט-קוונטי)</td><td>NIST level 3</td><td>public key של 1,184 בתים, ciphertext של 1,088 — ‏FIPS 203 ‏(2024)</td></tr>
</table>
<p>קריפטוגרפיה א-סימטרית איטית פי 1000 בערך מ-AES ויכולה לטפל רק בקלטים זעירים — RSA-2048 עם OAEP-SHA256 מצפין לכל היותר <strong>190 בתים</strong>. אז כל מערכת אמיתית היא <strong>היברידית</strong>: מייצרים מפתח סימטרי אקראי, מצפינים את הנתונים עם AES-GCM, ומצפינים (או מסכימים על) רק את המפתח הזה בצורה א-סימטרית. TLS, ‏PGP, ‏JWE, ‏S/MIME ו-<strong>HPKE</strong> ‏(RFC 9180, הסטנדרט המודרני שמשמש את Encrypted Client Hello ואת MLS) כולם עובדים ככה.</p>
<pre># age: modern hybrid file encryption (X25519 + ChaCha20-Poly1305), used by sops
$ age-keygen -o key.txt
Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
$ age -r age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p -o db.dump.age db.dump
$ age -d -i key.txt -o db.dump db.dump.age

# sops: encrypt only the values in a YAML secret, keys stay readable in git diffs
$ sops --encrypt --age age1ql3z... secrets.yaml &gt; secrets.enc.yaml</pre>
<blockquote>💡 מהשטח: לעולם אל תשתמש ב-padding של RSA PKCS#1 v1.5 ל-<em>הצפנה</em> בקוד חדש — ה-padding oracle של Bleichenbacher מ-1998 חזר כ-ROBOT ב-2017 ושבר TLS במכשירים של F5, ‏Citrix ו-Cisco. משתמשים ב-OAEP, או עדיף, מוותרים לגמרי על הצפנת RSA ועוברים ל-X25519/HPKE.</blockquote>`
      }
    },
    {
      h: { en: "Which layer? Decide by who must not read it", he: "איזו שכבה? מחליטים לפי מי אסור שיקרא" },
      body: {
        en: `<table>
<tr><th>Layer</th><th>Example</th><th>Protects against</th><th>Does NOT protect against</th></tr>
<tr><td>At rest (disk/storage)</td><td>EBS/S3 SSE-KMS, LUKS, RDS storage encryption, TDE</td><td>Stolen disks, decommissioned drives, snapshot copied to another account (with KMS key policy)</td><td>Anyone with app or DB access — the DB decrypts transparently for every query</td></tr>
<tr><td>In transit</td><td>TLS 1.3, mTLS in a mesh, WireGuard, IPsec</td><td>Sniffing, MITM on the network, a compromised router</td><td>The endpoints themselves; logs that print the payload</td></tr>
<tr><td>Field-level / application-level</td><td>Encrypt <code>ssn</code>, <code>card</code> columns in the app with KMS data keys; MongoDB CSFLE / Queryable Encryption</td><td>DBAs, SQL injection dumps, backups, analytics replicas, support tools</td><td>The app servers that hold decrypt rights</td></tr>
<tr><td>End-to-end</td><td>Signal protocol, WhatsApp, iCloud Advanced Data Protection</td><td>The service provider itself, subpoenas to the provider, a breached backend</td><td>Compromised endpoints (phone malware)</td></tr>
</table>
<p>Field-level encryption has a cost: you can't <code>WHERE ssn = ?</code> or index ciphertext. The standard workaround is a <strong>blind index</strong> — store <code>HMAC(index_key, normalized_ssn)</code> next to the ciphertext and search on that (equality only; it leaks which rows share a value). Range queries need tokenization or a specialized scheme.</p>
<blockquote>⚠️ Production tip: "we're encrypted at rest" answers the auditor, not the attacker. In nearly every breach the attacker came in through the app or stolen credentials, where at-rest encryption is invisible. For the 3-4 truly sensitive fields, add field-level encryption with a separate KMS key whose decrypt permission only one service has (see <a href="#/lesson/pr-data-security">Data Security</a>).</blockquote>`,
        he: `<table>
<tr><th>שכבה</th><th>דוגמה</th><th>מגינה מפני</th><th>לא מגינה מפני</th></tr>
<tr><td>At rest (דיסק/אחסון)</td><td>EBS/S3 SSE-KMS, ‏LUKS, הצפנת אחסון של RDS, ‏TDE</td><td>דיסקים גנובים, כוננים שיצאו משימוש, snapshot שהועתק לחשבון אחר (עם key policy של KMS)</td><td>כל מי שיש לו גישה לאפליקציה או ל-DB — ה-DB מפענח שקוף לכל שאילתה</td></tr>
<tr><td>In transit</td><td>TLS 1.3, ‏mTLS ב-mesh, ‏WireGuard, ‏IPsec</td><td>האזנה, MITM ברשת, נתב פרוץ</td><td>ה-endpoints עצמם; לוגים שמדפיסים את ה-payload</td></tr>
<tr><td>Field-level / application-level</td><td>מצפינים עמודות <code>ssn</code>, <code>card</code> באפליקציה עם data keys של KMS; ‏CSFLE / Queryable Encryption של MongoDB</td><td>DBAs, ‏dumps של SQL injection, גיבויים, replicas של אנליטיקה, כלי support</td><td>שרתי האפליקציה שמחזיקים הרשאת decrypt</td></tr>
<tr><td>End-to-end</td><td>פרוטוקול Signal, ‏WhatsApp, ‏Advanced Data Protection של iCloud</td><td>ספק השירות עצמו, צווים לספק, backend פרוץ</td><td>Endpoints פרוצים (נוזקה בטלפון)</td></tr>
</table>
<p>להצפנה ברמת שדה יש מחיר: אי אפשר לעשות <code>WHERE ssn = ?</code> או אינדקס על ciphertext. הפתרון המקובל הוא <strong>blind index</strong> — שומרים <code>HMAC(index_key, normalized_ssn)</code> ליד ה-ciphertext ומחפשים לפיו (רק שוויון; זה מדליף אילו שורות חולקות ערך). שאילתות טווח דורשות טוקניזציה או סכמה מיוחדת.</p>
<blockquote>⚠️ טיפ לפרודקשן: "אנחנו מוצפנים at rest" עונה למבקר, לא לתוקף. כמעט בכל פריצה התוקף נכנס דרך האפליקציה או דרך credentials גנובים, ושם הצפנת at rest שקופה. ל-3-4 השדות הרגישים באמת, מוסיפים הצפנה ברמת שדה עם מפתח KMS נפרד שרק לשירות אחד יש הרשאת decrypt עליו (ראה <a href="#/lesson/pr-data-security">Data Security</a>).</blockquote>`
      }
    },
    {
      h: { en: "Envelope encryption from the CLI, rotation and HSMs", he: "Envelope encryption מה-CLI, ‏rotation ו-HSMs" },
      body: {
        en: `<pre># 1) ask KMS for a fresh 256-bit data key (DEK)
$ aws kms generate-data-key --key-id alias/app-data --key-spec AES_256 \\
      --encryption-context tenant=t-42
{
    "CiphertextBlob": "AQIDAHhBq0...base64...",   &lt;- DEK wrapped by the KMS key: store this
    "Plaintext": "kN3v0qT8...base64...=",         &lt;- DEK in clear: use in memory, then discard
    "KeyId": "arn:aws:kms:eu-west-1:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab"
}

# 2) encrypt locally with the Plaintext DEK (AES-256-GCM), store ciphertext + CiphertextBlob

# 3) later: unwrap the DEK — the encryption context must match exactly
$ aws kms decrypt --ciphertext-blob fileb://dek.enc --encryption-context tenant=t-42 \\
      --query Plaintext --output text | base64 -d &gt; /dev/shm/dek.bin
$ aws kms decrypt --ciphertext-blob fileb://dek.enc --encryption-context tenant=t-99 ...
An error occurred (InvalidCiphertextException) when calling the Decrypt operation:</pre>
<ul>
<li><strong>Why not just <code>aws kms encrypt</code>?</strong> It accepts at most 4 KB of plaintext, costs a network round trip (~5-10 ms) and counts against KMS request quotas per call. Envelope encryption calls KMS once per data key and encrypts gigabytes locally.</li>
<li><strong>Encryption context</strong> is authenticated (AAD) and lands in CloudTrail — you get a log of "which service decrypted tenant t-42's key, when". Key policies can require it (<code>kms:EncryptionContext:tenant</code>).</li>
<li><strong>Rotation</strong>: <code>aws kms enable-key-rotation --key-id &lt;id&gt; --rotation-period-in-days 180</code> (90-2560 days) or <code>aws kms rotate-key-on-demand</code>. KMS keeps old key material to unwrap old DEKs; nothing is re-encrypted. To retire a compromised key you must <em>re-wrap</em> every DEK (cheap) — and if a DEK itself leaked, re-encrypt that data (expensive).</li>
<li><strong>HSM</strong>: a tamper-resistant device (FIPS 140-3 Level 3) where keys are generated and used but can't be exported. Cloud KMSs run on HSM fleets; dedicated CloudHSM / Azure Managed HSM / Cloud HSM when regulation demands single-tenant hardware or you need PKCS#11 for e.g. a private CA or payment keys.</li>
</ul>
<blockquote>💡 Real world: S3 Bucket Keys exist because SSE-KMS used to call KMS for every object — a bucket with billions of small objects ran up huge KMS bills and throttling. A bucket-level key derived from KMS cuts those calls by up to 99%. Same lesson for your own code: cache DEKs with tight limits.</blockquote>`,
        he: `<pre># 1) ask KMS for a fresh 256-bit data key (DEK)
$ aws kms generate-data-key --key-id alias/app-data --key-spec AES_256 \\
      --encryption-context tenant=t-42
{
    "CiphertextBlob": "AQIDAHhBq0...base64...",   &lt;- DEK wrapped by the KMS key: store this
    "Plaintext": "kN3v0qT8...base64...=",         &lt;- DEK in clear: use in memory, then discard
    "KeyId": "arn:aws:kms:eu-west-1:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab"
}

# 2) encrypt locally with the Plaintext DEK (AES-256-GCM), store ciphertext + CiphertextBlob

# 3) later: unwrap the DEK — the encryption context must match exactly
$ aws kms decrypt --ciphertext-blob fileb://dek.enc --encryption-context tenant=t-42 \\
      --query Plaintext --output text | base64 -d &gt; /dev/shm/dek.bin
$ aws kms decrypt --ciphertext-blob fileb://dek.enc --encryption-context tenant=t-99 ...
An error occurred (InvalidCiphertextException) when calling the Decrypt operation:</pre>
<ul>
<li><strong>למה לא פשוט <code>aws kms encrypt</code>?</strong> הוא מקבל לכל היותר 4 KB של plaintext, עולה round trip ברשת (כ-5-10 ms) ונספר מול ה-quotas של KMS בכל קריאה. Envelope encryption פונה ל-KMS פעם אחת לכל data key ומצפין gigabytes מקומית.</li>
<li><strong>Encryption context</strong> מאומת (AAD) ונכנס ל-CloudTrail — מקבלים לוג של "איזה שירות פענח את המפתח של tenant t-42, ומתי". Key policies יכולות לדרוש אותו (<code>kms:EncryptionContext:tenant</code>).</li>
<li><strong>Rotation</strong>: ‏<code>aws kms enable-key-rotation --key-id &lt;id&gt; --rotation-period-in-days 180</code> (בין 90 ל-2560 יום) או <code>aws kms rotate-key-on-demand</code>. ‏KMS שומר את חומר המפתח הישן כדי לפתוח DEKs ישנים; שום דבר לא מוצפן מחדש. כדי להוציא משימוש מפתח שנפרץ צריך לעשות <em>re-wrap</em> לכל DEK (זול) — ואם DEK עצמו דלף, מצפינים מחדש את הנתונים האלה (יקר).</li>
<li><strong>HSM</strong>: מכשיר עמיד לחבלה (FIPS 140-3 Level 3) שבו מפתחות נוצרים ומשמשים אבל אי אפשר לייצא אותם. שירותי KMS בענן רצים על ציי HSM; ‏CloudHSM / Azure Managed HSM / Cloud HSM ייעודיים כשרגולציה דורשת חומרה single-tenant או כשצריך PKCS#11, למשל ל-CA פרטי או למפתחות תשלומים.</li>
</ul>
<blockquote>💡 מהשטח: S3 Bucket Keys קיימים כי SSE-KMS פנה פעם ל-KMS על כל אובייקט — bucket עם מיליארדי אובייקטים קטנים צבר חשבונות KMS ענקיים ו-throttling. מפתח ברמת bucket שנגזר מ-KMS חותך את הקריאות האלה בעד 99%. אותו לקח לקוד שלך: עושים cache ל-DEKs עם מגבלות הדוקות.</blockquote>`
      }
    },
    {
      h: { en: "TLS 1.3 and post-quantum, briefly and carefully", he: "TLS 1.3 ופוסט-קוונטי, בקצרה ובזהירות" },
      body: {
        en: `<p>TLS 1.3 removed everything that kept breaking: RSA key transport (no forward secrecy), CBC, RC4, SHA-1, renegotiation, compression. Only three AEAD suites are common — <code>TLS_AES_128_GCM_SHA256</code>, <code>TLS_AES_256_GCM_SHA384</code>, <code>TLS_CHACHA20_POLY1305_SHA256</code> — and the handshake takes 1 RTT (0-RTT resumption exists, but 0-RTT data can be replayed, so only allow it for idempotent requests).</p>
<p><strong>Post-quantum status (what's actually deployed):</strong></p>
<ul>
<li><strong>Key exchange is already hybrid in production.</strong> Chrome (since 131), Edge and Firefox offer <code>X25519MLKEM768</code> by default — X25519 combined with ML-KEM-768 (FIPS 203), so the session is safe if <em>either</em> holds. Cloudflare and other large CDNs accept it, Go 1.24+ <code>crypto/tls</code> enables it by default, and OpenSSL 3.5 ships it in its default groups. The motivation is "harvest now, decrypt later": recorded traffic could be decrypted by a future quantum computer.</li>
<li><strong>Certificates/signatures are not yet post-quantum</strong> in the public WebPKI. ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) are standardized, but PQ certificates are large and still being worked out. A forged signature requires a quantum computer <em>at the time of the handshake</em>, so this is less urgent.</li>
<li><strong>Symmetric crypto is fine.</strong> AES-256 and SHA-256/384 stay; that's why at-rest data encrypted with AES-256 doesn't need a PQ migration.</li>
<li>Practical side effect: the ClientHello grows to ~1.2 KB+ and may span two packets; a few buggy middleboxes that assume one packet drop it — an "only Chrome users fail through our old firewall" symptom.</li>
</ul>
<pre># what did we negotiate? (OpenSSL 3.5+ shows the group in the handshake summary)
$ openssl s_client -connect cloudflare.com:443 -groups X25519MLKEM768 &lt;/dev/null 2&gt;/dev/null \\
    | grep -iE 'group|Protocol|Cipher'
# Chrome: DevTools → Security tab → "Key exchange: X25519MLKEM768"</pre>
<blockquote>💡 Real world: the first PQ step for most teams is an inventory, not new code: which TLS libraries, versions and long-lived key-exchange paths (VPNs, internal mTLS, SSH) you run, and whether data you send today must stay secret for 10+ years. Upgrading the TLS library (OpenSSL 3.5+, Go 1.24+, recent BoringSSL) gets you hybrid key exchange for free.</blockquote>`,
        he: `<p>TLS 1.3 הסיר את כל מה שהמשיך להישבר: RSA key transport (בלי forward secrecy), ‏CBC, ‏RC4, ‏SHA-1, ‏renegotiation, דחיסה. נפוצות רק שלוש סוויטות AEAD — <code>TLS_AES_128_GCM_SHA256</code>, <code>TLS_AES_256_GCM_SHA384</code>, <code>TLS_CHACHA20_POLY1305_SHA256</code> — וה-handshake לוקח RTT אחד (קיים resumption של 0-RTT, אבל אפשר לשלוח שוב נתוני 0-RTT, אז מאפשרים אותו רק לבקשות idempotent).</p>
<p><strong>מצב הפוסט-קוונטי (מה שבאמת בפרודקשן):</strong></p>
<ul>
<li><strong>ה-key exchange כבר היברידי בפרודקשן.</strong> Chrome (מגרסה 131), ‏Edge ו-Firefox מציעים <code>X25519MLKEM768</code> כברירת מחדל — X25519 בשילוב ML-KEM-768 ‏(FIPS 203), כך שהסשן בטוח אם <em>אחד מהם</em> מחזיק. Cloudflare ו-CDNs גדולים אחרים מקבלים אותו, ‏<code>crypto/tls</code> של Go 1.24 ומעלה מפעיל אותו כברירת מחדל, ו-OpenSSL 3.5 כולל אותו ב-groups הדיפולטיים. המוטיבציה היא "harvest now, decrypt later": תעבורה מוקלטת עלולה להיפתח ע\"י מחשב קוונטי עתידי.</li>
<li><strong>תעודות וחתימות עוד לא פוסט-קוונטיות</strong> ב-WebPKI הציבורי. ML-DSA ‏(FIPS 204) ו-SLH-DSA ‏(FIPS 205) עברו סטנדרטיזציה, אבל תעודות PQ גדולות ועדיין בעבודה. זיוף חתימה דורש מחשב קוונטי <em>בזמן ה-handshake</em>, אז זה פחות דחוף.</li>
<li><strong>קריפטוגרפיה סימטרית בסדר.</strong> AES-256 ו-SHA-256/384 נשארים; לכן נתוני at rest שהוצפנו ב-AES-256 לא צריכים מיגרציית PQ.</li>
<li>תופעת לוואי מעשית: ה-ClientHello גדל לכ-1.2 KB ומעלה ועלול להתפרס על שני packets; כמה middleboxes באגיים שמניחים packet אחד זורקים אותו — סימפטום של "רק משתמשי Chrome נכשלים דרך ה-firewall הישן שלנו".</li>
</ul>
<pre># what did we negotiate? (OpenSSL 3.5+ shows the group in the handshake summary)
$ openssl s_client -connect cloudflare.com:443 -groups X25519MLKEM768 &lt;/dev/null 2&gt;/dev/null \\
    | grep -iE 'group|Protocol|Cipher'
# Chrome: DevTools → Security tab → "Key exchange: X25519MLKEM768"</pre>
<blockquote>💡 מהשטח: הצעד הפוסט-קוונטי הראשון לרוב הצוותים הוא מיפוי, לא קוד חדש: אילו ספריות TLS וגרסאות רצות אצלך, אילו מסלולי key exchange ארוכי טווח (VPNs, ‏mTLS פנימי, ‏SSH), והאם נתונים שאתה שולח היום צריכים להישאר סודיים 10 שנים ומעלה. שדרוג ספריית ה-TLS ‏(OpenSSL 3.5+, ‏Go 1.24+, ‏BoringSSL עדכני) נותן לך key exchange היברידי בחינם.</blockquote>`
      }
    },
    {
      h: { en: "Code it right, and the mistakes that show up in audits", he: "לכתוב את זה נכון, והטעויות שעולות בכל audit" },
      body: {
        en: `<pre>// Node.js — AES-256-GCM with AAD
const crypto = require('node:crypto');
const key = crypto.randomBytes(32);                  // from KMS in real life (DEK)

function seal(plaintext, aad) {
  const iv = crypto.randomBytes(12);                 // unique per (key, message)
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  c.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([c.update(plaintext, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]);    // 12 + 16 + n bytes
}
function open(blob, aad) {
  const d = crypto.createDecipheriv('aes-256-gcm', key, blob.subarray(0, 12));
  d.setAAD(Buffer.from(aad));
  d.setAuthTag(blob.subarray(12, 28));
  return Buffer.concat([d.update(blob.subarray(28)), d.final()]).toString('utf8');
}
open(seal('4111-1111', 'user=42;col=card'), 'user=43;col=card');
// Error: Unsupported state or unable to authenticate data     &lt;- tag check failed: tampered or wrong AAD</pre>
<pre># Python — high-level first: Fernet = AES-128-CBC + HMAC-SHA256 + timestamp, hard to misuse
from cryptography.fernet import Fernet, InvalidToken
f = Fernet(Fernet.generate_key())
token = f.encrypt(b"api-secret")       # gAAAAAB...
f.decrypt(token, ttl=3600)             # raises InvalidToken if tampered or older than 1h
# low-level AESGCM raises cryptography.exceptions.InvalidTag on tampering</pre>
<table>
<tr><th>Mistake</th><th>What goes wrong</th><th>Do instead</th></tr>
<tr><td>ECB (incl. Java's <code>"AES"</code> default)</td><td>Patterns leak</td><td>AES-GCM / ChaCha20-Poly1305</td></tr>
<tr><td>Reused IV/nonce</td><td>XOR of plaintexts leaks; GCM forgeries (WEP died of IV reuse)</td><td>Random 96-bit per message, rotate keys, or GCM-SIV</td></tr>
<tr><td>Encrypt without authenticate (CBC/CTR alone)</td><td>Padding oracles, bit-flipping</td><td>AEAD always</td></tr>
<tr><td>Hardcoded keys / keys in git or env files in images</td><td>One leak = all data; GitHub secret scanning finds millions per year</td><td>KMS / secret manager, envelope encryption, gitleaks in CI</td></tr>
<tr><td>Homemade crypto ("XOR with a secret", custom protocols)</td><td>Broken by the first competent reviewer</td><td>libsodium, Tink, <code>cryptography</code>, Node <code>crypto</code>, age</td></tr>
<tr><td><code>openssl enc -aes-256-cbc</code> with a password</td><td><code>*** WARNING : deprecated key derivation used.</code> — weak MD5-based KDF, no integrity</td><td><code>age</code>, or at least <code>-pbkdf2 -iter 600000</code></td></tr>
<tr><td>Key stored next to the data</td><td>Encryption is decorative</td><td>Separate KMS key, separate permissions, audit</td></tr>
</table>
<blockquote>⚠️ Production tip: decide the <strong>ciphertext format</strong> up front and version it: <code>v1 | key_id | nonce | tag | ciphertext</code>. Without a version byte and a key id, rotating algorithms or keys later means guessing how each row was encrypted.</blockquote>`,
        he: `<pre>// Node.js — AES-256-GCM with AAD
const crypto = require('node:crypto');
const key = crypto.randomBytes(32);                  // from KMS in real life (DEK)

function seal(plaintext, aad) {
  const iv = crypto.randomBytes(12);                 // unique per (key, message)
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  c.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([c.update(plaintext, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]);    // 12 + 16 + n bytes
}
function open(blob, aad) {
  const d = crypto.createDecipheriv('aes-256-gcm', key, blob.subarray(0, 12));
  d.setAAD(Buffer.from(aad));
  d.setAuthTag(blob.subarray(12, 28));
  return Buffer.concat([d.update(blob.subarray(28)), d.final()]).toString('utf8');
}
open(seal('4111-1111', 'user=42;col=card'), 'user=43;col=card');
// Error: Unsupported state or unable to authenticate data     &lt;- tag check failed: tampered or wrong AAD</pre>
<pre># Python — high-level first: Fernet = AES-128-CBC + HMAC-SHA256 + timestamp, hard to misuse
from cryptography.fernet import Fernet, InvalidToken
f = Fernet(Fernet.generate_key())
token = f.encrypt(b"api-secret")       # gAAAAAB...
f.decrypt(token, ttl=3600)             # raises InvalidToken if tampered or older than 1h
# low-level AESGCM raises cryptography.exceptions.InvalidTag on tampering</pre>
<table>
<tr><th>טעות</th><th>מה משתבש</th><th>מה עושים במקום</th></tr>
<tr><td>ECB (כולל ברירת המחדל <code>"AES"</code> של Java)</td><td>דפוסים דולפים</td><td>AES-GCM / ChaCha20-Poly1305</td></tr>
<tr><td>IV או nonce חוזר</td><td>דולף XOR של ה-plaintexts; זיופים ב-GCM ‏(WEP מת משימוש חוזר ב-IV)</td><td>96 ביט אקראיים לכל הודעה, החלפת מפתחות, או GCM-SIV</td></tr>
<tr><td>הצפנה בלי אימות (CBC או CTR לבד)</td><td>Padding oracles, ‏bit-flipping</td><td>תמיד AEAD</td></tr>
<tr><td>מפתחות hardcoded / מפתחות ב-git או בקבצי env בתוך images</td><td>דליפה אחת = כל הנתונים; ה-secret scanning של GitHub מוצא מיליונים בשנה</td><td>KMS או secret manager, ‏envelope encryption, ‏gitleaks ב-CI</td></tr>
<tr><td>קריפטו תוצרת בית ("XOR עם סוד", פרוטוקולים מומצאים)</td><td>נשבר אצל ה-reviewer המוכשר הראשון</td><td>libsodium, ‏Tink, ‏<code>cryptography</code>, ‏<code>crypto</code> של Node, ‏age</td></tr>
<tr><td><code>openssl enc -aes-256-cbc</code> עם סיסמה</td><td><code>*** WARNING : deprecated key derivation used.</code> — KDF חלש מבוסס MD5, בלי שלמות</td><td><code>age</code>, או לפחות <code>-pbkdf2 -iter 600000</code></td></tr>
<tr><td>מפתח שנשמר ליד הנתונים</td><td>ההצפנה קישוטית</td><td>מפתח KMS נפרד, הרשאות נפרדות, audit</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: תחליט מראש על <strong>פורמט ה-ciphertext</strong> ותנהל לו גרסה: <code>v1 | key_id | nonce | tag | ciphertext</code>. בלי בייט גרסה ו-key id, החלפת אלגוריתמים או מפתחות בעתיד אומרת לנחש איך כל שורה הוצפנה.</blockquote>`
      }
    }
  ],
  diagram: `data (GBs) --AES-256-GCM(DEK, nonce, AAD)--> ciphertext + tag
DEK --wrapped by KEK in KMS/HSM--> CiphertextBlob (stored next to data)
KEK never leaves the HSM; rotation = new KEK version, old kept to unwrap

who must NOT read it?
  disk thief -> at rest | network -> TLS 1.3 (X25519MLKEM768) | DBA/backups -> field-level | provider -> E2E`,
  handsOn: [
    { cmd: "node -e \"const c=require('crypto');const k=c.randomBytes(32),iv=c.randomBytes(12);const e=c.createCipheriv('aes-256-gcm',k,iv);const ct=Buffer.concat([e.update('hi'),e.final()]);ct[0]^=1;const d=c.createDecipheriv('aes-256-gcm',k,iv);d.setAuthTag(e.getAuthTag());d.update(ct);d.final()\"", what: { en: "Flip one ciphertext bit and watch AEAD refuse: 'Unsupported state or unable to authenticate data'.", he: "הופך ביט אחד ב-ciphertext ורואה את ה-AEAD מסרב: 'Unsupported state or unable to authenticate data'." } },
    { cmd: "age-keygen -o /tmp/k.txt && echo secret | age -r $(age-keygen -y /tmp/k.txt) | age -d -i /tmp/k.txt", what: { en: "Hybrid encryption round trip with age (X25519 + ChaCha20-Poly1305).", he: "סבב הצפנה היברידית עם age ‏(X25519 + ChaCha20-Poly1305)." } },
    { cmd: "aws kms generate-data-key --key-id alias/app-data --key-spec AES_256 --encryption-context app=demo --query CiphertextBlob --output text", what: { en: "Get a wrapped data key — the only part you ever store.", he: "מקבל data key עטוף — החלק היחיד ששומרים אי פעם." } },
    { cmd: "openssl speed -evp aes-256-gcm -evp chacha20-poly1305 2>/dev/null | tail -3", what: { en: "Benchmark AEAD throughput on your CPU — with AES-NI, GCM usually wins; without it, ChaCha20 does.", he: "מודד throughput של AEAD על ה-CPU שלך — עם AES-NI בדרך כלל GCM מנצח; בלי, ChaCha20 מנצח." } }
  ],
  mnemonic: {
    en: "\"AEAD the data, hybrid the key, KMS the master, never repeat the nonce.\" And pick the layer by asking: who must not read it?",
    he: "\"AEAD לנתונים, היברידי למפתח, KMS למפתח האב, ואף פעם לא nonce חוזר.\" ובוחרים שכבה לפי השאלה: מי אסור שיקרא?"
  },
  pitfalls: [
    { en: "Using a counter nonce that resets on restart (or a random 32-bit one) — nonce reuse under the same key breaks GCM completely.", he: "להשתמש ב-nonce מונה שמתאפס ב-restart (או אקראי של 32 ביט) — nonce חוזר תחת אותו מפתח שובר את GCM לגמרי." },
    { en: "Calling KMS Encrypt for every record — 4 KB limit, latency and quota throttling; use envelope encryption with a bounded DEK cache.", he: "לקרוא ל-KMS Encrypt על כל רשומה — מגבלת 4 KB, ‏latency ו-throttling של quotas; משתמשים ב-envelope encryption עם cache מוגבל ל-DEKs." },
    { en: "Treating disk encryption as data protection — it doesn't stop anyone who can query the database.", he: "להתייחס להצפנת דיסק כהגנה על הנתונים — היא לא עוצרת אף אחד שיכול לשאול את ה-DB." },
    { en: "Ignoring the auth tag (or decrypting GCM with a library call that skips verification) — you lose the integrity that made you pick AEAD.", he: "להתעלם מה-auth tag (או לפענח GCM עם קריאה שמדלגת על האימות) — מאבדים את השלמות שבגללה בחרת AEAD." }
  ],
  interview: [
    {
      q: { en: "Design encryption for a multi-tenant SaaS storing customer documents in S3 and PII in Postgres.", he: "תתכנן הצפנה ל-SaaS מרובה tenants ששומר מסמכי לקוחות ב-S3 ו-PII ב-Postgres." },
      a: { en: "TLS 1.3 everywhere in transit (mTLS between services). At rest: SSE-KMS with Bucket Keys on S3 and RDS storage encryption as a baseline. For PII columns, application-level envelope encryption: a KMS key per tenant (or per tier), DEKs generated via GenerateDataKey with encryption context {tenant}, AES-256-GCM with AAD binding tenant+column, versioned ciphertext format, blind-index HMAC columns for equality search. Per-tenant keys give crypto-shredding on offboarding. Only the PII service's role may kms:Decrypt; CloudTrail on all decrypts; rotation yearly, re-wrap on compromise.", he: "TLS 1.3 בכל מקום ב-transit ‏(mTLS בין שירותים). At rest: ‏SSE-KMS עם Bucket Keys ב-S3 והצפנת אחסון של RDS כבסיס. לעמודות PII, ‏envelope encryption ברמת האפליקציה: מפתח KMS לכל tenant (או לכל tier), ‏DEKs שנוצרים דרך GenerateDataKey עם encryption context של {tenant}, ‏AES-256-GCM עם AAD שקושר tenant ועמודה, פורמט ciphertext עם גרסה, ועמודות blind-index של HMAC לחיפוש שוויון. מפתחות לכל tenant נותנים crypto-shredding ב-offboarding. רק ל-role של שירות ה-PII מותר kms:Decrypt; ‏CloudTrail על כל decrypt; ‏rotation שנתי, ו-re-wrap במקרה של פריצה." }
    },
    {
      q: { en: "Why is post-quantum migration urgent for key exchange but not for AES-256 at rest?", he: "למה מיגרציה פוסט-קוונטית דחופה ל-key exchange אבל לא ל-AES-256 at rest?" },
      a: { en: "Shor's algorithm would break RSA and elliptic-curve key exchange, and traffic recorded today can be decrypted later (harvest now, decrypt later) — so hybrid ML-KEM key exchange protects today's sessions against a future machine. Grover's algorithm only gives a square-root speedup against symmetric keys, so AES-256 keeps ~128-bit security. Signatures are less urgent because forging one requires the quantum computer at verification time.", he: "האלגוריתם של Shor ישבור key exchange של RSA ושל עקומים אליפטיים, ותעבורה שמוקלטת היום יכולה להיפתח אחר כך (harvest now, decrypt later) — אז key exchange היברידי עם ML-KEM מגן על הסשנים של היום מפני מכונה עתידית. האלגוריתם של Grover נותן רק האצה של שורש ריבועי מול מפתחות סימטריים, אז AES-256 שומר על אבטחה של כ-128 ביט. חתימות פחות דחופות כי זיוף דורש את המחשב הקוונטי בזמן האימות." }
    }
  ],
  quiz: [
    {
      q: { en: "What happens if you encrypt two messages with AES-GCM using the same key and the same nonce?", he: "מה קורה אם מצפינים שתי הודעות ב-AES-GCM עם אותו מפתח ואותו nonce?" },
      options: [
        { en: "Nothing, the tag protects you", he: "כלום, ה-tag מגן עליך" },
        { en: "The XOR of the plaintexts leaks and forgeries become possible", he: "ה-XOR של ה-plaintexts דולף וזיופים הופכים לאפשריים" },
        { en: "Decryption becomes slower", he: "הפענוח נהיה איטי יותר" },
        { en: "The key is rotated automatically", he: "המפתח מוחלף אוטומטית" }
      ],
      answer: 1,
      explain: { en: "GCM is a stream mode; the same keystream twice cancels out, and the GHASH key can be recovered.", he: "GCM הוא stream mode; אותו keystream פעמיים מבטל את עצמו, ואפשר לשחזר את מפתח ה-GHASH." }
    },
    {
      q: { en: "Why does envelope encryption generate a data key instead of calling KMS Encrypt on the data?", he: "למה envelope encryption מייצר data key במקום לקרוא ל-KMS Encrypt על הנתונים?" },
      options: [
        { en: "KMS Encrypt is limited to 4 KB per call and adds latency and quota pressure", he: "KMS Encrypt מוגבל ל-4 KB לקריאה ומוסיף latency ולחץ על quotas" },
        { en: "KMS can't do AES", he: "KMS לא יודע לעשות AES" },
        { en: "Data keys never need to be stored", he: "לא צריך לשמור data keys אף פעם" },
        { en: "It avoids authentication", he: "זה עוקף אימות" }
      ],
      answer: 0,
      explain: { en: "Bulk data is encrypted locally with the DEK; only the small wrapped DEK goes through KMS.", he: "הנתונים בכמות מוצפנים מקומית עם ה-DEK; רק ה-DEK העטוף והקטן עובר דרך KMS." }
    },
    {
      q: { en: "Which threat does field-level encryption address that disk encryption doesn't?", he: "מאיזה איום הצפנה ברמת שדה מגינה שהצפנת דיסק לא?" },
      options: [
        { en: "A stolen hard drive", he: "דיסק קשיח גנוב" },
        { en: "A DBA or SQL-injection dump reading sensitive columns", he: "DBA או dump של SQL injection שקוראים עמודות רגישות" },
        { en: "Network sniffing", he: "האזנה לרשת" },
        { en: "DNS spoofing", he: "DNS spoofing" }
      ],
      answer: 1,
      explain: { en: "The database transparently decrypts disk-encrypted data for any query; field-level ciphertext stays opaque without the app's KMS permission.", he: "ה-DB מפענח שקוף נתונים בהצפנת דיסק לכל שאילתה; ciphertext ברמת שדה נשאר אטום בלי הרשאת ה-KMS של האפליקציה." }
    },
    {
      q: { en: "What does X25519MLKEM768 in a TLS handshake mean?", he: "מה המשמעות של X25519MLKEM768 ב-TLS handshake?" },
      options: [
        { en: "A post-quantum certificate signature", he: "חתימת תעודה פוסט-קוונטית" },
        { en: "Hybrid key exchange: classical X25519 plus ML-KEM-768", he: "Key exchange היברידי: ‏X25519 קלאסי ועוד ML-KEM-768" },
        { en: "A new symmetric cipher replacing AES", he: "cipher סימטרי חדש שמחליף את AES" },
        { en: "TLS 1.4", he: "TLS 1.4" }
      ],
      answer: 1,
      explain: { en: "The shared secret combines both; the session stays secure if either algorithm holds.", he: "הסוד המשותף משלב את שניהם; הסשן נשאר בטוח אם אחד מהאלגוריתמים מחזיק." }
    }
  ],
  related: ["pr-applied-crypto-pki", "pr-data-security", "cloud-secrets-management", "crypto-hashing-practice", "net-https-errors", "cloud-iam-security"]
});

/* ------------------------------------------------------------- glossary */
[
  ["TCP RST", "networking", "A TCP segment with the RST flag: 'this connection doesn't exist / is over'. On connect it shows as Connection refused; mid-stream as Connection reset by peer.", "segment של TCP עם דגל RST: 'החיבור הזה לא קיים או נגמר'. ב-connect הוא מופיע כ-Connection refused; באמצע חיבור כ-Connection reset by peer.", "net-errors-by-layer"],
  ["NXDOMAIN", "networking", "DNS response code meaning the name does not exist. Authoritative and negatively cached — retrying won't help; contrast with SERVFAIL (resolver failed).", "קוד תשובה של DNS שאומר שהשם לא קיים. סמכותי ונשמר ב-negative cache — retry לא יעזור; בניגוד ל-SERVFAIL (ה-resolver נכשל).", "net-errors-by-layer"],
  ["PMTU black hole", "networking", "Large packets are silently dropped on a path with a smaller MTU because the ICMP 'fragmentation needed' replies are filtered: handshakes work, big responses hang.", "packets גדולים נזרקים בשקט במסלול עם MTU קטן יותר כי תשובות ה-ICMP של 'fragmentation needed' מסוננות: handshakes עובדים, תשובות גדולות נתקעות.", "net-errors-by-layer"],
  ["Trust store", "networking", "The set of root CA certificates a client trusts. Each runtime may have its own: the OS store, Java's cacerts, Python certifi, Node's bundled roots.", "אוסף תעודות ה-root CA שקליינט סומך עליהן. לכל runtime יכול להיות משלו: ה-store של מערכת ההפעלה, ה-cacerts של Java, ‏certifi של Python, ה-roots המובנים של Node.", "net-https-errors"],
  ["OCSP stapling", "networking", "The server attaches a fresh, CA-signed 'certificate still valid' response to the TLS handshake, so clients don't query the CA themselves.", "השרת מצרף ל-TLS handshake תשובה טרייה וחתומה ע\"י ה-CA ש'התעודה עדיין בתוקף', כך שהקליינטים לא פונים ל-CA בעצמם.", "net-https-errors"],
  ["HSTS", "networking", "Strict-Transport-Security header: the browser uses only HTTPS for the domain for max-age seconds and removes the click-through on certificate errors.", "ה-header של Strict-Transport-Security: הדפדפן משתמש רק ב-HTTPS לדומיין למשך max-age שניות ומעלים את האפשרות לדלג על שגיאות תעודה.", "net-https-errors"],
  ["Retry-After", "networking", "Response header on 429/503 (and 3xx) telling the client how long to wait — seconds or an HTTP date — before retrying.", "Header בתשובות 429/503 (ו-3xx) שאומר לקליינט כמה לחכות — שניות או תאריך HTTP — לפני retry.", "http-status-errors"],
  ["HTTP 499", "networking", "nginx-only log status: the client closed the connection before nginx responded. Never sent on the wire; a symptom of slow responses (ALB's equivalent is 460).", "סטטוס לוג של nginx בלבד: הקליינט סגר את החיבור לפני ש-nginx ענה. לא נשלח על הקו; סימפטום של תשובות איטיות (המקבילה ב-ALB היא 460).", "http-status-errors"],
  ["502 vs 504", "networking", "Both come from a proxy/LB: 502 Bad Gateway = the upstream answered badly or reset the connection; 504 Gateway Timeout = the upstream didn't answer in time.", "שניהם מגיעים מ-proxy או LB: ‏502 Bad Gateway = ה-upstream ענה לא תקין או איפס את החיבור; 504 Gateway Timeout = ה-upstream לא ענה בזמן.", "http-status-errors"],
  ["Argon2id", "principal", "Memory-hard password hashing function (RFC 9106), the first choice for storing passwords; OWASP minimum m=19 MiB, t=2, p=1.", "פונקציית password hashing שהיא memory-hard ‏(RFC 9106), הבחירה הראשונה לשמירת סיסמאות; המינימום של OWASP הוא m=19 MiB, ‏t=2, ‏p=1.", "crypto-hashing-practice"],
  ["Pepper", "principal", "A secret key mixed into password hashing (e.g. HMAC before Argon2id) and stored outside the database, so a DB-only leak can't be cracked offline.", "מפתח סודי שמשולב ב-password hashing (למשל HMAC לפני Argon2id) ונשמר מחוץ ל-DB, כך שאי אפשר לפצח offline דליפה של ה-DB בלבד.", "crypto-hashing-practice"],
  ["Length-extension attack", "principal", "With Merkle-Damgard hashes (MD5, SHA-1, SHA-256), knowing H(secret||msg) lets an attacker compute H(secret||msg||extra) without the secret — why MACs must be HMAC.", "ב-hashes מסוג Merkle-Damgard ‏(MD5, ‏SHA-1, ‏SHA-256), מי שיודע H(secret||msg) יכול לחשב H(secret||msg||extra) בלי הסוד — ולכן MAC חייב להיות HMAC.", "crypto-hashing-practice"],
  ["AES-GCM", "principal", "AES in Galois/Counter Mode: an AEAD cipher with a 12-byte nonce and 16-byte tag, hardware-accelerated; the nonce must never repeat under the same key.", "AES ב-Galois/Counter Mode: צופן AEAD עם nonce של 12 בתים ו-tag של 16, מואץ בחומרה; ה-nonce אסור שיחזור על עצמו תחת אותו מפתח.", "crypto-encryption-practice"],
  ["Nonce", "principal", "'Number used once': a per-message value (IV) that makes encrypting the same plaintext twice produce different ciphertext. Not secret, but must be unique per key.", "'Number used once': ערך לכל הודעה (IV) שגורם לכך שהצפנת אותו plaintext פעמיים תיתן ciphertext שונה. לא סודי, אבל חייב להיות ייחודי לכל מפתח.", "crypto-encryption-practice"],
  ["ML-KEM", "principal", "NIST's post-quantum key encapsulation standard (FIPS 203, ex-Kyber); deployed in TLS as the hybrid group X25519MLKEM768.", "הסטנדרט הפוסט-קוונטי של NIST ל-key encapsulation ‏(FIPS 203, לשעבר Kyber); פרוס ב-TLS כקבוצה ההיברידית X25519MLKEM768.", "crypto-encryption-practice"]
].forEach(function (g) {
  window.INFRA.glossary.push({ term: g[0], track: g[1], def: { en: g[2], he: g[3] }, lesson: g[4] });
});

/* ------------------------------------------------------------- scenario */
window.INFRA.scenarios.push({
  id: "tls-handshake-failures-after-upgrade",
  icon: "🔐",
  title: { en: "Outbound TLS breaks after a Java base-image upgrade", he: "TLS יוצא נשבר אחרי שדרוג base image של Java" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "10:20. A Renovate PR bumped payments-worker from the team's old corp-java:11 image to the upstream eclipse-temurin:21-jre and was merged an hour ago. PagerDuty: 'payments-worker outbound error rate 100%'. Two different errors fill the logs.",
        he: "10:20. PR של Renovate העביר את payments-worker מה-image הישן של הצוות, corp-java:11, ל-eclipse-temurin:21-jre של upstream, ומוזג לפני שעה. PagerDuty: ‏'payments-worker outbound error rate 100%'. שתי שגיאות שונות ממלאות את הלוגים."
      },
      data: `ERROR LedgerClient - POST https://ledger.internal.corp/v2/entries failed
javax.net.ssl.SSLHandshakeException: PKIX path building failed:
  sun.security.provider.certpath.SunCertPathBuilderException:
  unable to find valid certification path to requested target

ERROR BankGateway - POST https://api.legacybank.example/transfer failed
javax.net.ssl.SSLHandshakeException: No appropriate protocol
  (protocol is disabled or cipher suites are inappropriate)

$ kubectl rollout history deploy/payments-worker -n payments | tail -2
14  image bump corp-java:11 -> eclipse-temurin:21-jre (renovate #812)`,
      choices: [
        { label: { en: "Roll back to revision 13 first, then investigate", he: "קודם rollback ל-revision 13, ואז לחקור" }, next: "s2", score: 15,
          feedback: { en: "Correct priority: the change is known and recent, payments are failing. Restore service, then debug calmly with the new image in a sandbox.", he: "סדר עדיפויות נכון: השינוי ידוע וטרי, תשלומים נכשלים. מחזירים שירות, ואז מדבגים ברוגע עם ה-image החדש בסביבה מבודדת." } },
        { label: { en: "Hotfix: set a trust-all TrustManager and allow all protocols via env flag", he: "Hotfix: להגדיר TrustManager שסומך על הכל ולאפשר את כל הפרוטוקולים דרך env flag" }, next: "lose", score: -20,
          feedback: { en: "You just disabled MITM protection on a payments service. It 'works', and it's a security incident.", he: "בדיוק ביטלת הגנת MITM בשירות תשלומים. זה 'עובד', וזה אירוע אבטחה." } },
        { label: { en: "Restart the pods — maybe it's a transient network issue", he: "לעשות restart לפודים — אולי זו תקלת רשת זמנית" }, next: "s1b", score: -5,
          feedback: { en: "TLS handshake exceptions with explicit reasons aren't transient. Restarting the same image reproduces them.", he: "Exceptions של TLS handshake עם סיבה מפורשת הם לא זמניים. restart לאותו image משחזר אותם." } }
      ]
    },
    s1b: {
      text: { en: "The pods come back. Same errors, still 100% failure, and the payment queue is now 18k messages deep.", he: "הפודים עולים. אותן שגיאות, עדיין 100% כשל, ותור התשלומים כבר בעומק 18 אלף הודעות." },
      data: `$ kubectl get pods -n payments -l app=payments-worker
NAME                               READY   STATUS    RESTARTS   AGE
payments-worker-6c8f7d9b5-4hx2m    1/1     Running   0          40s
payments-worker-6c8f7d9b5-v8q7n    1/1     Running   0          40s
queue depth: payments.transfers = 18,204`,
      choices: [
        { label: { en: "Roll back to revision 13 now", he: "לעשות rollback ל-revision 13 עכשיו" }, next: "s2", score: 10,
          feedback: { en: "Good. Error rate drops and the queue starts draining.", he: "טוב. ה-error rate יורד והתור מתחיל להתרוקן." } }
      ]
    },
    s2: {
      text: { en: "Rolled back; payments recover and the queue drains. Now reproduce in a sandbox pod running the NEW image. Where do you start with the PKIX error?", he: "בוצע rollback; התשלומים חוזרים והתור מתרוקן. עכשיו משחזרים ב-pod מבודד שמריץ את ה-image החדש. מאיפה מתחילים עם שגיאת ה-PKIX?" },
      data: `$ kubectl run tls-debug -n payments --rm -it --image=eclipse-temurin:21-jre -- bash
root@tls-debug:/# `,
      choices: [
        { label: { en: "Inspect the server chain with openssl s_client and compare the JVM truststores of old vs new image", he: "לבדוק את השרשרת של השרת עם openssl s_client ולהשוות את ה-truststores של ה-JVM בין ה-image הישן לחדש" }, next: "s3", score: 15,
          feedback: { en: "Exactly — PKIX means 'can't chain to a trusted root'. Either the server's chain or the client's truststore changed; only the client changed.", he: "בדיוק — PKIX אומר 'אין שרשרת ל-root מהימן'. או שהשרשרת של השרת השתנתה או שה-truststore של הקליינט; ורק הקליינט השתנה." } },
        { label: { en: "Ask the PKI team to renew the ledger certificate — it probably expired", he: "לבקש מצוות ה-PKI לחדש את התעודה של ה-ledger — כנראה שפגה" }, next: "s2b", score: -5,
          feedback: { en: "The old image works against the same server right now, so the cert can't be expired. Expiry gives CertificateExpiredException anyway.", he: "ה-image הישן עובד מול אותו שרת ממש עכשיו, אז התעודה לא יכולה להיות פגה. ותעודה שפגה נותנת CertificateExpiredException." } }
      ]
    },
    s2b: {
      text: { en: "PKI replies within the hour: the cert is valid until next year and nothing changed on the server. Back to the sandbox.", he: "צוות ה-PKI עונה תוך שעה: התעודה בתוקף עד השנה הבאה ושום דבר לא השתנה בשרת. חוזרים ל-sandbox." },
      data: `notAfter=Aug 30 23:59:59 2027 GMT   (ledger.internal.corp)`,
      choices: [
        { label: { en: "Run openssl s_client and compare truststores", he: "להריץ openssl s_client ולהשוות truststores" }, next: "s3", score: 5,
          feedback: { en: "Better late than never.", he: "עדיף מאוחר מאשר אף פעם." } }
      ]
    },
    s3: {
      text: { en: "The chain is complete and ends at the company's private root. The difference is in the JVM truststore. How do you fix the new image?", he: "השרשרת מלאה ומסתיימת ב-root הפרטי של החברה. ההבדל הוא ב-truststore של ה-JVM. איך מתקנים את ה-image החדש?" },
      data: `$ openssl s_client -connect ledger.internal.corp:443 -servername ledger.internal.corp </dev/null 2>/dev/null | grep -E '^ [0-9] s:|^   i:|Verify return'
 0 s:CN = ledger.internal.corp
   i:CN = Corp Issuing CA 3
 1 s:CN = Corp Issuing CA 3
   i:CN = Corp Root CA G2
    Verify return code: 19 (self-signed certificate in certificate chain)

# old image (corp-java:11) — its Dockerfile ran keytool -importcert for Corp Root CA G2
$ keytool -list -cacerts -storepass changeit | grep -i corp
corprootcag2, Mar 3, 2023, trustedCertEntry,
# new image (eclipse-temurin:21-jre)
$ keytool -list -cacerts -storepass changeit | grep -i corp
$`,
      choices: [
        { label: { en: "Add the corp root explicitly: mount it in /certificates with USE_SYSTEM_CA_CERTS=1 (or keytool -importcert -cacerts in the Dockerfile)", he: "להוסיף את ה-root הארגוני במפורש: לשים אותו ב-/certificates עם USE_SYSTEM_CA_CERTS=1 (או keytool -importcert -cacerts ב-Dockerfile)" }, next: "s4", score: 15,
          feedback: { en: "Right: the upstream image doesn't know your private CA. Making the trust explicit and versioned in the Dockerfile fixes it for good.", he: "נכון: ה-image של upstream לא מכיר את ה-CA הפרטי שלך. אמון מפורש ועם גרסה ב-Dockerfile מתקן את זה לתמיד." } },
        { label: { en: "Copy the old JDK 11 cacerts file over the new one", he: "להעתיק את קובץ ה-cacerts הישן של JDK 11 מעל החדש" }, next: "s4", score: 0,
          feedback: { en: "It works today, but you froze a 2023 root list into JDK 21 — new public roots are missing and removed/distrusted ones come back. Import only your root.", he: "זה עובד היום, אבל הקפאת רשימת roots של 2023 בתוך JDK 21 — roots ציבוריים חדשים חסרים, ו-roots שהוסרו או שאיבדו אמון חוזרים. מייבאים רק את ה-root שלך." } },
        { label: { en: "Skip verification only for *.internal.corp hosts in code", he: "לדלג על האימות רק ל-hosts של *.internal.corp בקוד" }, next: "lose", score: -20,
          feedback: { en: "Internal traffic is exactly where lateral movement happens. A host-scoped trust-all is still trust-all.", he: "תעבורה פנימית היא בדיוק המקום שבו קורה lateral movement. Trust-all מוגבל ל-hosts הוא עדיין trust-all." } }
      ]
    },
    s4: {
      text: { en: "Ledger calls now pass in the sandbox. The bank still fails with 'No appropriate protocol'. You probe it.", he: "קריאות ל-ledger עוברות עכשיו ב-sandbox. הבנק עדיין נכשל עם 'No appropriate protocol'. אתה בודק אותו." },
      data: `$ openssl s_client -connect api.legacybank.example:443 -servername api.legacybank.example -tls1_2 </dev/null
40C7B2F1A07F0000:error:0A00042E:SSL routines:ssl3_read_bytes:tlsv1 alert protocol version:../ssl/record/rec_layer_s3.c:1593:SSL alert number 70

$ grep '^jdk.tls.disabledAlgorithms' $JAVA_HOME/conf/security/java.security
jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, DTLSv1.0, RC4, DES, \\
# the bank only speaks TLS 1.0; corp-java:11 had an old override re-enabling it`,
      choices: [
        { label: { en: "Contain it: send only bank traffic through a small egress proxy that speaks TLS 1.2 to you and TLS 1.0 to the bank, open a risk ticket with an expiry date, and escalate to the bank", he: "לבודד: להעביר רק את תעבורת הבנק דרך egress proxy קטן שמדבר איתך TLS 1.2 ועם הבנק TLS 1.0, לפתוח risk ticket עם תאריך תפוגה, ולהסלים לבנק" }, next: "s5", score: 15,
          feedback: { en: "The legacy exception lives in one tiny, monitored place with an owner and an end date, and the JVM keeps its secure defaults.", he: "החריגה של ה-legacy חיה במקום אחד קטן ומנוטר, עם בעלים ותאריך סיום, וה-JVM שומר על ברירות המחדל המאובטחות." } },
        { label: { en: "Remove TLSv1 and TLSv1.1 from jdk.tls.disabledAlgorithms in the image", he: "להוריד את TLSv1 ו-TLSv1.1 מ-jdk.tls.disabledAlgorithms ב-image" }, next: "s5", score: -5,
          feedback: { en: "It unblocks payments, but every outbound connection from this service can now be downgraded. If you must, at least scope it and time-box it.", he: "זה משחרר את התשלומים, אבל עכשיו כל חיבור יוצא מהשירות הזה חשוף ל-downgrade. אם חייבים, לפחות להגביל ולתחום בזמן." } }
      ]
    },
    s5: {
      text: { en: "Both paths work in staging and you roll forward. Last question in the postmortem: how do you stop the next base-image bump from doing this?", he: "שני המסלולים עובדים ב-staging ואתה עושה roll forward. שאלה אחרונה ב-postmortem: איך מונעים מה-bump הבא של base image לעשות את זה שוב?" },
      choices: [
        { label: { en: "CI smoke test: from the built image, run a TLS handshake (Java client) against every outbound dependency, plus an explicit, versioned CA bundle in the repo", he: "Smoke test ב-CI: מתוך ה-image שנבנה, להריץ TLS handshake (קליינט Java) מול כל תלות יוצאת, ועוד CA bundle מפורש ועם גרסה ב-repo" }, next: "win", score: 15,
          feedback: { en: "Implicit trust baked into an old base image is what bit you. Making it explicit and testing it in CI turns a prod outage into a red build.", he: "אמון מרומז שנאפה לתוך base image ישן הוא מה שנשך אותך. להפוך אותו למפורש ולבדוק אותו ב-CI הופך השבתה בפרודקשן ל-build אדום." } },
        { label: { en: "Pin the base image and disable Renovate for it", he: "להצמיד את ה-base image ולבטל את Renovate עבורו" }, next: "lose", score: -10,
          feedback: { en: "Now you'll miss JDK security patches, and the hidden trust dependency is still there for the day you're forced to upgrade.", he: "עכשיו תפספס security patches של ה-JDK, והתלות הנסתרת באמון עדיין שם ליום שבו תיאלץ לשדרג." } }
      ]
    },
    win: {
      text: { en: "Resolved. You restored service first, read the TLS errors as two separate problems (trust vs negotiation), fixed trust explicitly, contained the legacy protocol, and added a CI guard. Payments never ran with verification disabled.", he: "נפתר. החזרת שירות קודם, קראת את שגיאות ה-TLS כשתי בעיות נפרדות (אמון מול משא ומתן), תיקנת את האמון במפורש, בודדת את הפרוטוקול הישן, והוספת שמירה ב-CI. התשלומים אף פעם לא רצו עם אימות כבוי." },
      end: "win"
    },
    lose: {
      text: { en: "The incident 'closes', but a security review weeks later finds certificate verification disabled (or a frozen, unpatched stack) on the payments path. The real fix — explicit trust and a contained legacy exception — still has to be done, now under audit pressure.", he: "האירוע 'נסגר', אבל security review כמה שבועות אחר כך מוצא אימות תעודות כבוי (או stack קפוא ולא מעודכן) במסלול התשלומים. התיקון האמיתי — אמון מפורש וחריגת legacy מבודדת — עדיין צריך להיעשות, עכשיו תחת לחץ של audit." },
      end: "lose"
    }
  },
  lessons: ["net-https-errors", "net-http-tls", "pr-applied-crypto-pki", "net-errors-by-layer"]
});
