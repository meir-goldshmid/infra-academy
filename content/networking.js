window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ============================================================
// Track: networking
// ============================================================

window.INFRA.lessons.push({
  id: "net-osi-tcpip",
  track: "networking",
  order: 1,
  icon: "🧅",
  level: 1,
  minutes: 9,
  title: { en: "OSI vs TCP/IP: the layer cake", he: "OSI מול TCP/IP: עוגת השכבות" },
  tldr: {
    en: "Networking is envelopes inside envelopes: each layer wraps the data with its own header (MAC, IP, port) and only cares about its own job.",
    he: "רשת זה מעטפה בתוך מעטפה: כל שכבה עוטפת את המידע ב-header משלה (MAC, IP, port) ודואגת רק לתפקיד שלה."
  },
  analogy: {
    en: "Sending a packet is like mailing a letter inside an office: you write the letter (HTTP), put it in an envelope with the department name (TCP port), put that in a bigger envelope with the street address (IP), and hand it to the courier who only knows the next hallway (MAC). Each courier opens only the outer envelope it understands, then re-wraps it for the next hop.",
    he: "לשלוח packet זה כמו לשלוח מכתב בדואר פנימי: כותבים את המכתב (HTTP), שמים במעטפה עם שם המחלקה (TCP port), את זה שמים במעטפה גדולה עם כתובת הרחוב (IP), ומוסרים לשליח שמכיר רק את המסדרון הבא (MAC). כל שליח פותח רק את המעטפה החיצונית שהוא מבין, ועוטף מחדש בשביל ה-hop הבא."
  },
  sections: [
    {
      h: { en: "Two models, one reality", he: "שני מודלים, מציאות אחת" },
      body: {
        en: `<p>The <strong>OSI model</strong> has 7 layers and is mostly a teaching and vocabulary tool. The <strong>TCP/IP model</strong> has 4 layers and is what the Internet actually runs. Engineers mix them freely: "L4 load balancer" and "L7 firewall" are OSI numbers used on TCP/IP networks.</p>
<table>
<tr><th>OSI #</th><th>OSI name</th><th>TCP/IP</th><th>Address / unit</th><th>Examples</th></tr>
<tr><td>7</td><td>Application</td><td rowspan="3">Application</td><td>URL, headers</td><td>HTTP, DNS, gRPC, SSH</td></tr>
<tr><td>6</td><td>Presentation</td><td>-</td><td>TLS*, encoding</td></tr>
<tr><td>5</td><td>Session</td><td>-</td><td>(rarely discussed)</td></tr>
<tr><td>4</td><td>Transport</td><td>Transport</td><td>Port / segment</td><td>TCP, UDP, QUIC</td></tr>
<tr><td>3</td><td>Network</td><td>Internet</td><td>IP / packet</td><td>IPv4, IPv6, ICMP</td></tr>
<tr><td>2</td><td>Data link</td><td rowspan="2">Link</td><td>MAC / frame</td><td>Ethernet, Wi-Fi, ARP</td></tr>
<tr><td>1</td><td>Physical</td><td>bits</td><td>cables, radio, fiber</td></tr>
</table>
<p>*TLS doesn't fit neatly anywhere; people call it "L6" or "between L4 and L7". Don't fight about it in interviews.</p>`,
        he: `<p>ל-<strong>OSI</strong> יש 7 שכבות, והוא בעיקר כלי לימוד ושפה משותפת. ל-<strong>TCP/IP</strong> יש 4 שכבות, וזה מה שהאינטרנט באמת מריץ. מהנדסים מערבבים בחופשיות: "L4 load balancer" או "L7 firewall" זה מספור של OSI על רשת TCP/IP.</p>
<table>
<tr><th>OSI #</th><th>שם</th><th>TCP/IP</th><th>כתובת / יחידה</th><th>דוגמאות</th></tr>
<tr><td>7</td><td>Application</td><td rowspan="3">Application</td><td>URL, headers</td><td>HTTP, DNS, gRPC, SSH</td></tr>
<tr><td>6</td><td>Presentation</td><td>-</td><td>TLS*, encoding</td></tr>
<tr><td>5</td><td>Session</td><td>-</td><td>(כמעט לא מדברים עליה)</td></tr>
<tr><td>4</td><td>Transport</td><td>Transport</td><td>Port / segment</td><td>TCP, UDP, QUIC</td></tr>
<tr><td>3</td><td>Network</td><td>Internet</td><td>IP / packet</td><td>IPv4, IPv6, ICMP</td></tr>
<tr><td>2</td><td>Data link</td><td rowspan="2">Link</td><td>MAC / frame</td><td>Ethernet, Wi-Fi, ARP</td></tr>
<tr><td>1</td><td>Physical</td><td>bits</td><td>כבלים, רדיו, סיבים</td></tr>
</table>
<p>*TLS לא נכנס יפה לאף שכבה; יש שקוראים לו "L6" ויש "בין L4 ל-L7". לא שווה להתווכח על זה בראיון.</p>`
      }
    },
    {
      h: { en: "What lives where: MAC, IP, port", he: "מי גר איפה: MAC, IP, port" },
      body: {
        en: `<p><strong>L2 (MAC)</strong> addresses are 48-bit hardware IDs like <code>0a:1b:2c:3d:4e:5f</code>. They only matter on the <em>local</em> segment: a switch forwards frames by MAC, and ARP translates "who has 10.0.1.7?" into a MAC. The MAC changes at every router hop.</p>
<p><strong>L3 (IP)</strong> addresses are end-to-end: the source and destination IP stay the same across the whole path (unless NAT rewrites them). Routers look only at the destination IP and their route table.</p>
<p><strong>L4 (port)</strong> picks the process on the host: 443 is HTTPS, 22 is SSH, 5432 is Postgres. A connection is identified by the <strong>5-tuple</strong>: protocol, src IP, src port, dst IP, dst port. Your client uses a random <em>ephemeral</em> port (Linux default 32768-60999).</p>
<p><strong>L7 (application)</strong> is where the meaning lives: HTTP method, path, Host header, cookies. An L7 device can route <code>/api</code> differently from <code>/images</code>; an L4 device can't, because it never reads past the port.</p>`,
        he: `<p>כתובות <strong>L2 (MAC)</strong> הן מזהי חומרה של 48 ביט כמו <code>0a:1b:2c:3d:4e:5f</code>. הן רלוונטיות רק ב-segment <em>המקומי</em>: switch מעביר frames לפי MAC, ו-ARP מתרגם "למי יש 10.0.1.7?" ל-MAC. ה-MAC מתחלף בכל hop של router.</p>
<p>כתובות <strong>L3 (IP)</strong> הן מקצה לקצה: ה-IP של המקור והיעד נשארים זהים לאורך כל הדרך (אלא אם NAT משכתב אותם). Router מסתכל רק על IP היעד ועל ה-route table שלו.</p>
<p><strong>L4 (port)</strong> בוחר את התהליך על המכונה: 443 זה HTTPS, 22 זה SSH, 5432 זה Postgres. חיבור מזוהה לפי ה-<strong>5-tuple</strong>: פרוטוקול, IP ו-port של המקור, IP ו-port של היעד. הקליינט שלך משתמש ב-port <em>ephemeral</em> אקראי (בלינוקס ברירת המחדל 32768-60999).</p>
<p><strong>L7 (application)</strong> זה איפה שהמשמעות נמצאת: HTTP method, path, Host header, cookies. רכיב L7 יכול לנתב את <code>/api</code> אחרת מ-<code>/images</code>; רכיב L4 לא יכול, כי הוא אף פעם לא קורא מעבר ל-port.</p>`
      }
    },
    {
      h: { en: "The TCP three-way handshake", he: "ה-three-way handshake של TCP" },
      body: {
        en: `<p>Before a single byte of HTTP flows, TCP sets up a connection:</p>
<ol><li><code>SYN</code> - client: "I want to talk, my sequence starts at x."</li>
<li><code>SYN-ACK</code> - server: "OK, got x, mine starts at y."</li>
<li><code>ACK</code> - client: "Got y." Connection is ESTABLISHED.</li></ol>
<p>That costs <strong>one full round trip (RTT)</strong> before data. Tel Aviv to us-east-1 is ~130 ms RTT, so a fresh HTTPS connection with TLS 1.3 costs ~2 RTT (~260 ms) before the request even leaves. This is why keep-alive and connection pooling matter so much.</p>
<p>TCP then gives you ordering, retransmission of lost segments, flow control and congestion control. Closing uses <code>FIN</code>/<code>ACK</code>; a <code>RST</code> is the rude "slam the door" version you see as <em>connection reset by peer</em>.</p>
<blockquote>💡 Real world: "connection refused" means you got a RST back (host is up, nothing listening on the port). "Connection timed out" means nothing came back at all - usually a firewall silently dropping your SYN. Two very different bugs.</blockquote>`,
        he: `<p>לפני שבייט אחד של HTTP עובר, TCP מקים חיבור:</p>
<ol><li><code>SYN</code> - הקליינט: "רוצה לדבר, ה-sequence שלי מתחיל ב-x."</li>
<li><code>SYN-ACK</code> - השרת: "קיבלתי x, שלי מתחיל ב-y."</li>
<li><code>ACK</code> - הקליינט: "קיבלתי y." החיבור ESTABLISHED.</li></ol>
<p>זה עולה <strong>round trip מלא (RTT)</strong> לפני שעובר מידע. מתל אביב ל-us-east-1 זה בערך 130ms RTT, אז חיבור HTTPS חדש עם TLS 1.3 עולה בערך 2 RTT (כ-260ms) עוד לפני שהבקשה יצאה. בגלל זה keep-alive ו-connection pooling כל כך חשובים.</p>
<p>אחרי זה TCP נותן סדר, שליחה חוזרת של segments שאבדו, flow control ו-congestion control. סגירה נעשית עם <code>FIN</code>/<code>ACK</code>; <code>RST</code> זו הגרסה הגסה של "לטרוק את הדלת", מה שאתה רואה כ-<em>connection reset by peer</em>.</p>
<blockquote>💡 מהשטח: "connection refused" אומר שקיבלת RST (המכונה למעלה, אף אחד לא מאזין על ה-port). "Connection timed out" אומר ששום דבר לא חזר - בדרך כלל firewall שזורק את ה-SYN בשקט. שני באגים שונים לגמרי.</blockquote>`
      }
    },
    {
      h: { en: "TCP vs UDP", he: "TCP מול UDP" },
      body: {
        en: `<table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>Connection</td><td>Handshake first</td><td>Just send</td></tr>
<tr><td>Delivery</td><td>Reliable, ordered</td><td>Best effort, may drop/reorder</td></tr>
<tr><td>Overhead</td><td>20+ byte header, ACKs</td><td>8 byte header</td></tr>
<tr><td>Used by</td><td>HTTP/1.1, HTTP/2, SSH, Postgres</td><td>DNS, video calls, gaming, QUIC/HTTP/3</td></tr>
</table>
<p>UDP isn't "worse", it's "less opinionated". For a live video call, a frame that arrives late is useless, so retransmitting it is pointless. For a bank transfer you want every byte, in order. Modern protocols like <strong>QUIC</strong> build their own reliability on top of UDP so they can innovate without waiting for every OS kernel and middlebox to update TCP.</p>
<p>DNS uses UDP port 53 for normal queries and falls back to TCP 53 for big responses (and zone transfers). So "allow UDP 53 only" in a firewall is a classic half-broken setup.</p>`,
        he: `<table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>חיבור</td><td>קודם handshake</td><td>פשוט שולחים</td></tr>
<tr><td>אמינות</td><td>אמין ובסדר הנכון</td><td>best effort, יכול ללכת לאיבוד או להתבלגן</td></tr>
<tr><td>Overhead</td><td>header של 20+ בייט, ACKs</td><td>header של 8 בייט</td></tr>
<tr><td>מי משתמש</td><td>HTTP/1.1, HTTP/2, SSH, Postgres</td><td>DNS, שיחות וידאו, גיימינג, QUIC/HTTP/3</td></tr>
</table>
<p>UDP הוא לא "גרוע יותר", הוא פשוט "פחות דעתן". בשיחת וידאו, frame שמגיע באיחור לא שווה כלום, אז אין טעם לשלוח אותו שוב. בהעברה בנקאית אתה רוצה כל בייט, בסדר. פרוטוקולים מודרניים כמו <strong>QUIC</strong> בונים אמינות משלהם מעל UDP כדי לחדש בלי לחכות שכל kernel וכל middlebox בעולם יעדכנו את TCP.</p>
<p>DNS משתמש ב-UDP port 53 לשאילתות רגילות ועובר ל-TCP 53 לתשובות גדולות (וגם ל-zone transfers). אז "לפתוח רק UDP 53" ב-firewall זה setup קלאסי שעובד רק חצי.</p>`
      }
    },
    {
      h: { en: "Encapsulation: envelope in envelope", he: "Encapsulation: מעטפה בתוך מעטפה" },
      body: {
        en: `<p>When your app sends <code>GET /</code>, each layer adds a header on the way down and the receiver strips them on the way up. On standard Ethernet the max payload (<strong>MTU</strong>) is 1500 bytes; minus 20 bytes IP and 20 bytes TCP leaves an <strong>MSS</strong> of 1460 bytes of actual data per packet.</p>
<p>Tunnels (VPN, VXLAN in Kubernetes overlays, GRE) add <em>another</em> outer envelope, which eats into that 1500. If something in the path drops the "too big" ICMP messages, large packets vanish while small ones (like the TCP handshake) work fine. Symptom: SSH connects but hangs when you run <code>ls</code> on a big directory, or HTTPS hangs after the handshake.</p>
<blockquote>⚠️ Production tip: "small requests work, big responses hang" across a VPN or overlay network is almost always an MTU problem. Test with <code>ping -M do -s 1472 host</code> (Linux) and step the size down until it passes.</blockquote>`,
        he: `<p>כשהאפליקציה שולחת <code>GET /</code>, כל שכבה מוסיפה header בדרך למטה, והצד המקבל מקלף אותם בדרך למעלה. ב-Ethernet רגיל ה-payload המקסימלי (<strong>MTU</strong>) הוא 1500 בייט; פחות 20 בייט IP ו-20 בייט TCP נשאר <strong>MSS</strong> של 1460 בייט מידע אמיתי לכל packet.</p>
<p>Tunnels (VPN, VXLAN ב-overlay של Kubernetes, GRE) מוסיפים <em>עוד</em> מעטפה חיצונית, שאוכלת מתוך ה-1500. אם משהו בדרך זורק את הודעות ה-ICMP של "too big", packets גדולים נעלמים בזמן שקטנים (כמו ה-handshake) עוברים. הסימפטום: SSH מתחבר אבל נתקע כשמריצים <code>ls</code> על תיקייה גדולה, או HTTPS נתקע אחרי ה-handshake.</p>
<blockquote>⚠️ טיפ לפרודקשן: "בקשות קטנות עובדות, תשובות גדולות נתקעות" דרך VPN או overlay זה כמעט תמיד בעיית MTU. בדוק עם <code>ping -M do -s 1472 host</code> (בלינוקס) והורד את הגודל עד שזה עובר.</blockquote>`
      }
    }
  ],
  diagram: `  Your app:  [ HTTP: GET /index.html ]                         L7
  TCP:       [ TCP hdr | src:51544 dst:443 | HTTP... ]          L4
  IP:        [ IP hdr | 10.0.1.5 -> 93.184.215.14 | TCP... ]   L3
  Ethernet:  [ MAC hdr | aa:.. -> router-mac | IP... | FCS ]   L2
  Wire:      0101100101010101...                               L1

  TCP handshake:
  client ---- SYN ---------> server
  client <--- SYN-ACK ------ server
  client ---- ACK ---------> server   (1 RTT gone, now send data)`,
  handsOn: [
    { cmd: "ss -tan | head -20", what: { en: "List TCP sockets with their state (LISTEN, ESTAB, TIME-WAIT) and the 5-tuple parts.", he: "רשימת sockets של TCP עם המצב שלהם (LISTEN, ESTAB, TIME-WAIT) וחלקי ה-5-tuple." } },
    { cmd: "sudo tcpdump -i any -nn 'tcp port 443 and tcp[tcpflags] & (tcp-syn|tcp-fin|tcp-rst) != 0'", what: { en: "Watch only SYN/FIN/RST packets for HTTPS - then run curl https://example.com in another terminal and see the handshake.", he: "לראות רק packets של SYN/FIN/RST ב-HTTPS - ואז להריץ curl https://example.com בטרמינל אחר ולראות את ה-handshake." } },
    { cmd: "ip neigh show", what: { en: "Show the ARP/neighbor table: which IPs on your LAN map to which MAC addresses.", he: "להציג את טבלת ה-ARP: אילו IPs ב-LAN ממופים לאילו כתובות MAC." } },
    { cmd: "ip link show | grep mtu", what: { en: "See the MTU of each interface (1500 normally, 9001 on many AWS instances, lower on tunnels).", he: "לראות את ה-MTU של כל interface (בדרך כלל 1500, 9001 בהרבה instances ב-AWS, פחות על tunnels)." } }
  ],
  mnemonic: {
    en: "Bottom-up: \"Please Do Not Throw Sausage Pizza Away\" (Physical, Data link, Network, Transport, Session, Presentation, Application). And the dev cheat: L2 = MAC, L3 = IP, L4 = port, L7 = URL.",
    he: "מלמטה למעלה: \"Please Do Not Throw Sausage Pizza Away\" (Physical, Data link, Network, Transport, Session, Presentation, Application). ובגרסת המפתחים: L2 = MAC, L3 = IP, L4 = port, L7 = URL."
  },
  pitfalls: [
    { en: "Assuming ping failing means the host is down. Many networks and cloud Security Groups block ICMP; test the real port with nc or curl instead.", he: "להניח ש-ping שנכשל אומר שהמכונה למטה. הרבה רשתות ו-Security Groups בענן חוסמים ICMP; תבדוק את ה-port האמיתי עם nc או curl." },
    { en: "Confusing 'connection refused' (RST: host reachable, no listener) with 'timeout' (packets dropped, usually a firewall or routing issue).", he: "לבלבל בין 'connection refused' (RST: המכונה זמינה, אין מאזין) לבין 'timeout' (packets נזרקים, בדרך כלל firewall או בעיית routing)." },
    { en: "Opening only UDP 53 for DNS. Large responses (DNSSEC, many records) fall back to TCP 53 and fail mysteriously.", he: "לפתוח רק UDP 53 בשביל DNS. תשובות גדולות (DNSSEC, הרבה רשומות) עוברות ל-TCP 53 ונכשלות בצורה מסתורית." },
    { en: "Ignoring MTU on VPNs/overlays: the handshake works but large payloads hang forever.", he: "להתעלם מ-MTU ב-VPN או overlay: ה-handshake עובד אבל payloads גדולים נתקעים לנצח." }
  ],
  interview: [
    {
      q: { en: "What happens at each layer when you type https://example.com and hit Enter?", he: "מה קורה בכל שכבה כשמקלידים https://example.com ולוחצים Enter?" },
      a: { en: "DNS resolves the name to an IP (L7 over UDP). The OS picks an ephemeral port and does the TCP handshake to port 443 (L4). IP routing sends packets via the default gateway (L3), and ARP finds the gateway's MAC for each frame (L2). Then TLS handshake, then the HTTP request and response, with each layer encapsulating on send and decapsulating on receive.", he: "DNS מתרגם את השם ל-IP (L7 מעל UDP). מערכת ההפעלה בוחרת ephemeral port ועושה TCP handshake ל-port 443 (L4). ניתוב IP שולח packets דרך ה-default gateway (L3), ו-ARP מוצא את ה-MAC של ה-gateway לכל frame (L2). אחרי זה TLS handshake, ואז בקשה ותשובת HTTP, כשכל שכבה עוטפת בשליחה ומקלפת בקבלה." }
    },
    {
      q: { en: "When would you choose UDP over TCP?", he: "מתי תבחר ב-UDP על פני TCP?" },
      a: { en: "When latency matters more than completeness (voice/video, games), for tiny request/response protocols where a handshake would double the cost (DNS), or when you build your own reliability layer (QUIC). If you need every byte in order and don't want to reinvent retransmission, use TCP.", he: "כשה-latency חשוב יותר משלמות (קול/וידאו, משחקים), בפרוטוקולים קטנים של בקשה-תשובה שבהם handshake יכפיל את העלות (DNS), או כשבונים שכבת אמינות משלך (QUIC). אם צריך כל בייט ובסדר ולא רוצים להמציא מחדש retransmission, הולכים על TCP." }
    }
  ],
  quiz: [
    {
      q: { en: "An L4 load balancer can make routing decisions based on...", he: "Load balancer ב-L4 יכול לקבל החלטות ניתוב לפי..." },
      options: [
        { en: "The URL path, like /api vs /static", he: "ה-URL path, למשל /api מול /static" },
        { en: "IP addresses and ports (the 5-tuple)", he: "כתובות IP ו-ports (ה-5-tuple)" },
        { en: "The HTTP Host header", he: "ה-Host header של HTTP" },
        { en: "Cookies set by the application", he: "Cookies שהאפליקציה שמה" }
      ],
      answer: 1,
      explain: { en: "L4 sees IPs, ports and protocol. Paths, Host headers and cookies are L7 data that an L4 device never parses.", he: "ב-L4 רואים IPs, ports ופרוטוקול. Path, Host header ו-cookies הם מידע של L7 שרכיב L4 אף פעם לא מפענח." }
    },
    {
      q: { en: "As a packet crosses three routers from source to destination, what normally stays the same?", he: "כש-packet עובר שלושה routers מהמקור ליעד, מה בדרך כלל נשאר קבוע?" },
      options: [
        { en: "The source and destination MAC addresses", he: "כתובות ה-MAC של המקור והיעד" },
        { en: "The TTL field", he: "שדה ה-TTL" },
        { en: "The source and destination IP addresses (absent NAT)", he: "כתובות ה-IP של המקור והיעד (כשאין NAT)" },
        { en: "Nothing, every header is rebuilt at every hop", he: "כלום, כל header נבנה מחדש בכל hop" }
      ],
      answer: 2,
      explain: { en: "IPs are end-to-end. MACs are rewritten every hop, and TTL decrements by one at each router (that's how traceroute works).", he: "IPs הם מקצה לקצה. ה-MAC משוכתב בכל hop, וה-TTL יורד באחד בכל router (ככה traceroute עובד)." }
    },
    {
      q: { en: "curl to a server prints 'Connection refused' instantly. Most likely cause?", he: "curl לשרת מחזיר מיד 'Connection refused'. מה הסיבה הסבירה?" },
      options: [
        { en: "A Security Group is silently dropping the traffic", he: "Security Group זורק את התעבורה בשקט" },
        { en: "DNS returned the wrong IP for a host that doesn't exist", he: "DNS החזיר IP שגוי של מכונה שלא קיימת" },
        { en: "The TLS certificate expired", he: "תעודת ה-TLS פגה" },
        { en: "The host is reachable but nothing is listening on that port", he: "המכונה זמינה אבל אף אחד לא מאזין על ה-port הזה" }
      ],
      answer: 3,
      explain: { en: "Refused = a RST came back, so the host's kernel answered. Silent drops cause timeouts, and TLS errors happen only after TCP connects.", he: "Refused = חזר RST, כלומר ה-kernel של המכונה ענה. זריקה שקטה גורמת ל-timeout, ושגיאות TLS קורות רק אחרי שה-TCP התחבר." }
    }
  ],
  related: ["net-ip-cidr", "net-http-tls", "net-troubleshooting"]
});

window.INFRA.lessons.push({
  id: "net-ip-cidr",
  track: "networking",
  order: 2,
  icon: "🔢",
  level: 1,
  minutes: 10,
  title: { en: "IP addresses & CIDR math", he: "כתובות IP וחשבון CIDR" },
  tldr: {
    en: "A CIDR like 10.0.1.0/24 means 'the first 24 bits are fixed, the rest are yours': 2^(32-24) = 256 addresses, minus 5 that AWS keeps for itself.",
    he: "CIDR כמו 10.0.1.0/24 אומר 'ה-24 ביטים הראשונים קבועים, השאר שלך': 2^(32-24) = 256 כתובות, פחות 5 ש-AWS שומר לעצמו."
  },
  analogy: {
    en: "An IP address is a phone number. The /prefix is how many leading digits are the area code: a /16 is a whole city, a /24 is a single street, a /32 is one house. Splitting a /16 into /24s is like zoning a city into streets - and once houses are built, re-zoning is painful.",
    he: "כתובת IP היא מספר טלפון. ה-/prefix זה כמה ספרות בהתחלה הן הקידומת: /16 זו עיר שלמה, /24 זה רחוב אחד, /32 זה בית אחד. לחלק /16 ל-/24 זה כמו לחלק עיר לרחובות - ואחרי שבנו בתים, שינוי תב\"ע זה כאב ראש."
  },
  sections: [
    {
      h: { en: "IPv4 in one paragraph", he: "IPv4 בפסקה אחת" },
      body: {
        en: `<p>An IPv4 address is 32 bits, written as four octets: <code>10.0.1.7</code> = <code>00001010.00000000.00000001.00000111</code>. That's ~4.3 billion addresses total, which ran out years ago - so the world survives on <strong>private ranges + NAT</strong>.</p>
<p>The private ranges (RFC 1918) are never routed on the public Internet, so everyone can reuse them:</p>
<table>
<tr><th>Range</th><th>CIDR</th><th>Size</th><th>Typical use</th></tr>
<tr><td>10.0.0.0 - 10.255.255.255</td><td>10.0.0.0/8</td><td>16.7M</td><td>Cloud VPCs, big corp networks</td></tr>
<tr><td>172.16.0.0 - 172.31.255.255</td><td>172.16.0.0/12</td><td>1M</td><td>Docker default bridges (172.17.x)</td></tr>
<tr><td>192.168.0.0 - 192.168.255.255</td><td>192.168.0.0/16</td><td>65K</td><td>Home routers</td></tr>
</table>
<p>Other special ones worth recognizing: <code>127.0.0.0/8</code> loopback, <code>169.254.0.0/16</code> link-local (and <code>169.254.169.254</code> is the cloud metadata service!), <code>100.64.0.0/10</code> carrier-grade NAT.</p>`,
        he: `<p>כתובת IPv4 היא 32 ביט, שנכתבים כארבעה octets: <code>10.0.1.7</code> = <code>00001010.00000000.00000001.00000111</code>. זה בערך 4.3 מיליארד כתובות בסך הכל, שנגמרו לפני שנים - אז העולם שורד על <strong>טווחים פרטיים + NAT</strong>.</p>
<p>הטווחים הפרטיים (RFC 1918) לא מנותבים באינטרנט הציבורי, אז כולם יכולים להשתמש בהם שוב ושוב:</p>
<table>
<tr><th>טווח</th><th>CIDR</th><th>גודל</th><th>שימוש נפוץ</th></tr>
<tr><td>10.0.0.0 - 10.255.255.255</td><td>10.0.0.0/8</td><td>16.7M</td><td>VPCs בענן, רשתות ארגוניות גדולות</td></tr>
<tr><td>172.16.0.0 - 172.31.255.255</td><td>172.16.0.0/12</td><td>1M</td><td>ה-bridge הדיפולטי של Docker (172.17.x)</td></tr>
<tr><td>192.168.0.0 - 192.168.255.255</td><td>192.168.0.0/16</td><td>65K</td><td>ראוטרים ביתיים</td></tr>
</table>
<p>עוד כתובות מיוחדות ששווה לזהות: <code>127.0.0.0/8</code> loopback, <code>169.254.0.0/16</code> link-local (ו-<code>169.254.169.254</code> הוא שירות ה-metadata של הענן!), <code>100.64.0.0/10</code> carrier-grade NAT.</p>`
      }
    },
    {
      h: { en: "CIDR math you can do in your head", he: "חשבון CIDR שאפשר לעשות בראש" },
      body: {
        en: `<p>The number after the slash is how many bits are the <em>network</em> part. The rest are host bits: <strong>addresses = 2^(32 - prefix)</strong>. Every +1 on the prefix halves the size.</p>
<table>
<tr><th>Prefix</th><th>Addresses</th><th>AWS usable</th><th>Mental picture</th></tr>
<tr><td>/16</td><td>65,536</td><td>65,531</td><td>A whole VPC (10.0.x.x)</td></tr>
<tr><td>/20</td><td>4,096</td><td>4,091</td><td>A roomy EKS subnet</td></tr>
<tr><td>/24</td><td>256</td><td>251</td><td>Classic subnet (10.0.1.x)</td></tr>
<tr><td>/28</td><td>16</td><td>11</td><td>Smallest AWS subnet</td></tr>
<tr><td>/32</td><td>1</td><td>-</td><td>Exactly one host (great in firewall rules)</td></tr>
</table>
<p><strong>Why 5 reserved in AWS?</strong> In <code>10.0.1.0/24</code>: <code>.0</code> network address, <code>.1</code> VPC router, <code>.2</code> DNS resolver, <code>.3</code> reserved for future use, <code>.255</code> broadcast. Azure also reserves 5, GCP reserves 4.</p>
<p>Alignment matters: a block must start on a multiple of its own size, so a /24 ends in <code>.0</code> and a /26 starts on a multiple of 64 (<code>.0, .64, .128, .192</code>). <code>10.0.1.10/26</code> isn't a valid network start - the network is actually <code>10.0.1.0/26</code>.</p>`,
        he: `<p>המספר אחרי הלוכסן הוא כמה ביטים שייכים לחלק ה-<em>network</em>. השאר הם ביטים של hosts: <strong>כתובות = 2^(32 - prefix)</strong>. כל +1 ב-prefix חוצה את הגודל.</p>
<table>
<tr><th>Prefix</th><th>כתובות</th><th>שמישות ב-AWS</th><th>תמונה בראש</th></tr>
<tr><td>/16</td><td>65,536</td><td>65,531</td><td>VPC שלם (10.0.x.x)</td></tr>
<tr><td>/20</td><td>4,096</td><td>4,091</td><td>subnet מרווח ל-EKS</td></tr>
<tr><td>/24</td><td>256</td><td>251</td><td>subnet קלאסי (10.0.1.x)</td></tr>
<tr><td>/28</td><td>16</td><td>11</td><td>ה-subnet הכי קטן ב-AWS</td></tr>
<tr><td>/32</td><td>1</td><td>-</td><td>בדיוק מכונה אחת (מעולה בחוקי firewall)</td></tr>
</table>
<p><strong>למה 5 שמורות ב-AWS?</strong> ב-<code>10.0.1.0/24</code>: <code>.0</code> כתובת הרשת, <code>.1</code> ה-router של ה-VPC, <code>.2</code> ה-DNS resolver, <code>.3</code> שמורה לעתיד, <code>.255</code> broadcast. גם Azure שומר 5, GCP שומר 4.</p>
<p>יישור חשוב: /26 חייב להתחיל בכפולה של 64 (<code>.0, .64, .128, .192</code>). <code>10.0.1.10/26</code> הוא לא תחילת רשת חוקית - הרשת היא בעצם <code>10.0.1.0/26</code>.</p>`
      }
    },
    {
      h: { en: "Subnetting a VPC without regret", he: "לחלק VPC ל-subnets בלי להתחרט" },
      body: {
        en: `<p>A typical layout: VPC <code>10.20.0.0/16</code>, 3 Availability Zones, public and private subnets per AZ:</p>
<pre>10.20.0.0/16   VPC (65,536)
  10.20.0.0/24     public-a    (LBs, NAT GW)
  10.20.1.0/24     public-b
  10.20.2.0/24     public-c
  10.20.32.0/19    private-a   (8,192 - k8s pods eat IPs!)
  10.20.64.0/19    private-b
  10.20.96.0/19    private-c
  10.20.128.0/17   spare - future you says thanks</pre>
<p>Rules of thumb: public subnets can be small (only LBs and NAT live there); private subnets should be big, especially with EKS where every Pod gets a VPC IP by default. Leave free space. And <strong>never overlap</strong> CIDRs with other VPCs, the office network, or partner networks - overlapping ranges can't be peered or routed, and renumbering a live VPC is a multi-quarter project.</p>
<blockquote>💡 Real world: teams pick 10.0.0.0/16 for every VPC "because it's the default", then a year later need peering between them. Keep a simple IPAM spreadsheet (or AWS VPC IPAM) from day one.</blockquote>`,
        he: `<p>Layout טיפוסי: VPC <code>10.20.0.0/16</code>, שלושה Availability Zones, subnet ציבורי ופרטי לכל AZ:</p>
<pre>10.20.0.0/16   VPC (65,536)
  10.20.0.0/24     public-a    (LBs, NAT GW)
  10.20.1.0/24     public-b
  10.20.2.0/24     public-c
  10.20.32.0/19    private-a   (8,192 - Pods ב-k8s אוכלים IPs!)
  10.20.64.0/19    private-b
  10.20.96.0/19    private-c
  10.20.128.0/17   רזרבה - אתה של העתיד יגיד תודה</pre>
<p>כללי אצבע: subnets ציבוריים יכולים להיות קטנים (רק LBs ו-NAT גרים שם); subnets פרטיים צריכים להיות גדולים, במיוחד עם EKS שבו כל Pod מקבל IP מה-VPC כברירת מחדל. תשאיר מקום פנוי. ו-<strong>אף פעם לא לחפוף</strong> CIDRs עם VPCs אחרים, רשת המשרד או רשתות של שותפים - טווחים חופפים אי אפשר לחבר ב-peering או לנתב, ו-renumbering של VPC חי זה פרויקט של כמה רבעונים.</p>
<blockquote>💡 מהשטח: צוותים בוחרים 10.0.0.0/16 לכל VPC "כי זה הדיפולט", ושנה אחרי צריכים peering ביניהם. תחזיקו טבלת IPAM פשוטה (או AWS VPC IPAM) מהיום הראשון.</blockquote>`
      }
    },
    {
      h: { en: "IPv6 in brief", he: "IPv6 בקצרה" },
      body: {
        en: `<p>IPv6 addresses are 128 bits, written in hex: <code>2001:db8:abcd:12::1</code> (<code>::</code> compresses a run of zeros). There are so many that NAT is unnecessary - every device can have a globally unique address. The standard subnet size is <strong>/64</strong> (that's 18 quintillion addresses per subnet, yes really), and AWS hands a VPC a /56.</p>
<p>Two consequences devs trip on: (1) "private by being NATted" no longer exists, so security comes from firewalls and routing (AWS uses an <em>egress-only Internet Gateway</em> for outbound-only IPv6). (2) Your code must handle addresses with colons: <code>http://[2001:db8::1]:8080/</code> needs brackets, and naive <code>host.split(":")</code> parsing breaks.</p>
<p>Many clouds now charge for public IPv4 addresses (AWS: about $0.005/hour each, ~$3.6/month), which is finally pushing IPv6 adoption in real infra.</p>`,
        he: `<p>כתובות IPv6 הן 128 ביט, בכתיבה הקסדצימלית: <code>2001:db8:abcd:12::1</code> (<code>::</code> מכווץ רצף של אפסים). יש כל כך הרבה שאין צורך ב-NAT - כל מכשיר יכול לקבל כתובת ייחודית גלובלית. גודל ה-subnet הסטנדרטי הוא <strong>/64</strong> (18 קווינטיליון כתובות ל-subnet, כן באמת), ו-AWS נותן ל-VPC טווח /56.</p>
<p>שתי השלכות שמפתחים נופלים עליהן: (1) "פרטי כי הוא מאחורי NAT" כבר לא קיים, אז האבטחה באה מ-firewalls ו-routing (ב-AWS יש <em>egress-only Internet Gateway</em> ל-IPv6 יוצא בלבד). (2) הקוד חייב להתמודד עם כתובות עם נקודתיים: <code>http://[2001:db8::1]:8080/</code> צריך סוגריים מרובעים, ופרסור תמים של <code>host.split(":")</code> נשבר.</p>
<p>הרבה עננים גובים היום כסף על כתובות IPv4 ציבוריות (ב-AWS בערך $0.005 לשעה לכתובת, כ-$3.6 לחודש), וזה סוף סוף דוחף אימוץ של IPv6 בתשתיות אמיתיות.</p>`
      }
    }
  ],
  diagram: `  10.0.1.0/24  ->  first 24 bits fixed, last 8 bits free
  00001010.00000000.00000001.|xxxxxxxx
  |<------- network -------->| host |

  /24 = 256   /25 = 128   /26 = 64   /27 = 32   /28 = 16
  /26 blocks in 10.0.1.0/24:  .0-.63 | .64-.127 | .128-.191 | .192-.255

  AWS reserved in 10.0.1.0/24:
  .0 network | .1 router | .2 DNS | .3 future | .255 broadcast`,
  handsOn: [
    { cmd: "ip -4 addr show", what: { en: "See your IPv4 addresses with their prefix length (e.g. inet 192.168.1.23/24).", he: "לראות את כתובות ה-IPv4 שלך עם אורך ה-prefix (למשל inet 192.168.1.23/24)." } },
    { cmd: "ipcalc 10.20.32.0/19", what: { en: "Compute network, broadcast, host range and count for any CIDR (apt install ipcalc).", he: "לחשב network, broadcast, טווח hosts וכמות לכל CIDR (apt install ipcalc)." } },
    { cmd: "python3 -c \"import ipaddress as i; print(list(i.ip_network('10.0.0.0/24').subnets(new_prefix=26)))\"", what: { en: "Split a /24 into four /26 subnets using Python's standard library.", he: "לפצל /24 לארבעה subnets של /26 עם הספרייה הסטנדרטית של Python." } },
    { cmd: "aws ec2 describe-subnets --query 'Subnets[].[SubnetId,CidrBlock,AvailableIpAddressCount]' --output table", what: { en: "Check how many free IPs each AWS subnet has left - the first thing to check when EKS Pods are stuck Pending.", he: "לבדוק כמה IPs פנויים נשארו בכל subnet ב-AWS - הדבר הראשון לבדוק כש-Pods ב-EKS תקועים ב-Pending." } }
  ],
  mnemonic: {
    en: "\"32 minus slash, two to the that\": addresses = 2^(32 - prefix). And the AWS tax: \"Net, Router, DNS, Future, Broadcast\" - 5 IPs gone from every subnet.",
    he: "\"32 פחות הסלאש, שתיים בחזקת זה\": כתובות = 2^(32 - prefix). והמס של AWS: \"Net, Router, DNS, Future, Broadcast\" - 5 כתובות הולכות מכל subnet."
  },
  pitfalls: [
    { en: "Overlapping CIDRs between VPCs/on-prem: you can't peer or route them later without painful renumbering.", he: "CIDRs חופפים בין VPCs או מול on-prem: אי אפשר לעשות ביניהם peering או routing בלי renumbering כואב." },
    { en: "Sizing EKS subnets as /24: with the VPC CNI each Pod takes a VPC IP, so you run out at ~250 Pods per AZ.", he: "להגדיר subnets ל-EKS בגודל /24: עם ה-VPC CNI כל Pod לוקח IP מה-VPC, אז נגמר המקום בסביבות 250 Pods ל-AZ." },
    { en: "Forgetting reserved addresses when sizing: a /28 in AWS gives 11 usable IPs, not 16.", he: "לשכוח את הכתובות השמורות בתכנון: /28 ב-AWS נותן 11 כתובות שמישות, לא 16." },
    { en: "Using 0.0.0.0/0 when you meant a single IP - in a firewall rule /0 means 'the entire Internet', /32 means 'this one host'.", he: "לכתוב 0.0.0.0/0 כשהתכוונת ל-IP אחד - בחוק firewall, /0 זה 'כל האינטרנט' ו-/32 זה 'המכונה הזו בלבד'." }
  ],
  interview: [
    {
      q: { en: "You need 6 subnets of at least 500 hosts each inside 10.1.0.0/16. What prefix do you use?", he: "צריך 6 subnets של לפחות 500 hosts כל אחד בתוך 10.1.0.0/16. איזה prefix תבחר?" },
      a: { en: "500 hosts needs 9 host bits (512), so /23 gives 512 addresses (507 usable in AWS). Six /23s use 3,072 addresses of 65,536. In practice I'd go /22 for headroom - growing a subnet later is impossible, you can only add new ones.", he: "500 hosts דורש 9 ביטים של hosts (512), אז /23 נותן 512 כתובות (507 שמישות ב-AWS). שישה /23 תופסים 3,072 כתובות מתוך 65,536. בפועל הייתי הולך על /22 בשביל מרווח - אי אפשר להגדיל subnet אחר כך, רק להוסיף חדשים." }
    },
    {
      q: { en: "Why can't two VPCs with 10.0.0.0/16 be peered?", he: "למה אי אפשר לעשות peering בין שני VPCs עם 10.0.0.0/16?" },
      a: { en: "Routing is by destination IP. If 10.0.1.5 exists in both VPCs, a route table can't know which side a packet belongs to, so the cloud refuses the peering. Fixes are renumbering, NAT between them (ugly), or PrivateLink for specific services.", he: "ניתוב נעשה לפי IP היעד. אם 10.0.1.5 קיים בשני ה-VPCs, ה-route table לא יכול לדעת לאיזה צד ה-packet שייך, אז הענן מסרב ל-peering. הפתרונות: renumbering, NAT ביניהם (מכוער), או PrivateLink לשירותים ספציפיים." }
    }
  ],
  quiz: [
    {
      q: { en: "How many usable IPs does an AWS subnet 10.0.4.0/26 give you?", he: "כמה IPs שמישים נותן subnet ב-AWS בגודל 10.0.4.0/26?" },
      options: [
        { en: "64", he: "64" },
        { en: "62", he: "62" },
        { en: "59", he: "59" },
        { en: "251", he: "251" }
      ],
      answer: 2,
      explain: { en: "/26 = 2^6 = 64 addresses. Classic networking says 62 (minus network and broadcast), but AWS reserves 5, leaving 59.", he: "/26 = 2^6 = 64 כתובות. ברשתות קלאסיות זה 62 (פחות network ו-broadcast), אבל AWS שומר 5, אז נשארות 59." }
    },
    {
      q: { en: "Which address is NOT in a private RFC 1918 range?", he: "איזו כתובת לא נמצאת בטווח פרטי של RFC 1918?" },
      options: [
        { en: "172.20.5.9", he: "172.20.5.9" },
        { en: "10.255.0.1", he: "10.255.0.1" },
        { en: "192.168.100.100", he: "192.168.100.100" },
        { en: "172.32.0.10", he: "172.32.0.10" }
      ],
      answer: 3,
      explain: { en: "172.16.0.0/12 covers 172.16.x.x through 172.31.x.x. 172.32.0.10 is just outside it - a public address.", he: "172.16.0.0/12 מכסה את 172.16.x.x עד 172.31.x.x. הכתובת 172.32.0.10 בדיוק בחוץ - כתובת ציבורית." }
    },
    {
      q: { en: "Going from /24 to /22 does what to the subnet size?", he: "מעבר מ-/24 ל-/22 עושה מה לגודל ה-subnet?" },
      options: [
        { en: "Multiplies it by 4 (256 to 1,024)", he: "מכפיל פי 4 (מ-256 ל-1,024)" },
        { en: "Halves it", he: "חוצה אותו" },
        { en: "Multiplies it by 2", he: "מכפיל פי 2" },
        { en: "Divides it by 4", he: "מחלק ב-4" }
      ],
      answer: 0,
      explain: { en: "A smaller prefix means more host bits. Two fewer network bits = 2^2 = 4 times bigger.", he: "Prefix קטן יותר אומר יותר ביטים ל-hosts. שני ביטים פחות ברשת = 2^2 = פי 4 יותר גדול." }
    },
    {
      q: { en: "Which special address do cloud VMs call to get their instance metadata and temporary credentials?", he: "לאיזו כתובת מיוחדת מכונות בענן פונות כדי לקבל instance metadata ו-credentials זמניים?" },
      options: [
        { en: "127.0.0.1", he: "127.0.0.1" },
        { en: "169.254.169.254", he: "169.254.169.254" },
        { en: "10.0.0.2", he: "10.0.0.2" },
        { en: "100.64.0.1", he: "100.64.0.1" }
      ],
      answer: 1,
      explain: { en: "169.254.169.254 is the link-local metadata endpoint on AWS, GCP and Azure - and a favorite SSRF target, which is why AWS introduced IMDSv2 tokens.", he: "169.254.169.254 הוא ה-endpoint של ה-metadata ב-AWS, GCP ו-Azure - ומטרה אהובה ל-SSRF, ובגלל זה AWS הוסיפו טוקנים ב-IMDSv2." }
    }
  ],
  playground: "cidr",
  related: ["net-vpc", "net-osi-tcpip", "net-firewalls"]
});


window.INFRA.lessons.push({
  id: "net-dns",
  track: "networking",
  order: 3,
  icon: "📖",
  level: 1,
  minutes: 10,
  title: { en: "DNS: the Internet's phone book", he: "DNS: ספר הטלפונים של האינטרנט" },
  tldr: {
    en: "DNS turns names into IPs through a chain of servers (stub, recursive, root, TLD, authoritative), and every answer is cached for TTL seconds - which is why DNS changes are slow and why 'it's always DNS'.",
    he: "DNS מתרגם שמות ל-IPs דרך שרשרת שרתים (stub, recursive, root, TLD, authoritative), וכל תשובה נשמרת ב-cache ל-TTL שניות - ולכן שינויי DNS איטיים ולכן 'זה תמיד DNS'."
  },
  analogy: {
    en: "You ask your office receptionist (recursive resolver) for Dana's number. She doesn't know, so she calls the national directory (root), which says 'ask the .com desk' (TLD), which says 'ask example.com's own switchboard' (authoritative), which finally gives the number. The receptionist writes it on a sticky note for the next hour (TTL) - and if Dana changes her number, people keep calling the old one until the sticky note expires.",
    he: "אתה שואל את פקידת הקבלה (recursive resolver) מה המספר של דנה. היא לא יודעת, אז היא מתקשרת למודיעין הארצי (root), שאומר 'תשאלי את דלפק ה-.com' (TLD), שאומר 'תשאלי את המרכזייה של example.com' (authoritative), שסוף סוף נותנת את המספר. הפקידה רושמת אותו על פתק צהוב לשעה הקרובה (TTL) - ואם דנה מחליפה מספר, אנשים ימשיכו להתקשר לישן עד שהפתק יפוג."
  },
  sections: [
    {
      h: { en: "The resolution path", he: "מסלול ה-resolution" },
      body: {
        en: `<p>When your code calls <code>getaddrinfo("api.example.com")</code>:</p>
<ol>
<li><strong>Stub resolver</strong> (in your OS/libc) checks <code>/etc/hosts</code> and local cache, then asks the server in <code>/etc/resolv.conf</code>.</li>
<li><strong>Recursive resolver</strong> (your ISP, 8.8.8.8, 1.1.1.1, or the VPC resolver at the .2 address) does the legwork. If it has a cached answer, done.</li>
<li>Otherwise it asks a <strong>root server</strong> (13 named identities a-m, hundreds of anycast instances): "who handles .com?"</li>
<li>The <strong>TLD server</strong> for .com answers: "example.com is served by ns1.dnsprovider.net".</li>
<li>The <strong>authoritative server</strong> returns the actual record: <code>api.example.com A 203.0.113.10</code>.</li>
</ol>
<p>The recursive resolver caches every step (it rarely needs root again), and returns the answer to your stub. A cold lookup might take 50-200 ms; a cached one is under 1 ms. This is why your first request to a new domain is slower.</p>`,
        he: `<p>כשהקוד שלך קורא ל-<code>getaddrinfo("api.example.com")</code>:</p>
<ol>
<li>ה-<strong>stub resolver</strong> (ב-OS/libc) בודק את <code>/etc/hosts</code> ואת ה-cache המקומי, ואז שואל את השרת שמוגדר ב-<code>/etc/resolv.conf</code>.</li>
<li>ה-<strong>recursive resolver</strong> (של ספק האינטרנט, 8.8.8.8, 1.1.1.1, או ה-resolver של ה-VPC בכתובת ה-.2) עושה את העבודה השחורה. אם יש לו תשובה ב-cache, סיימנו.</li>
<li>אחרת הוא שואל <strong>root server</strong> (13 זהויות בשם a עד m, מאות מופעים ב-anycast): "מי אחראי על .com?"</li>
<li>שרת ה-<strong>TLD</strong> של .com עונה: "example.com מוגש על ידי ns1.dnsprovider.net".</li>
<li>השרת ה-<strong>authoritative</strong> מחזיר את הרשומה עצמה: <code>api.example.com A 203.0.113.10</code>.</li>
</ol>
<p>ה-recursive resolver שומר ב-cache כל שלב (הוא כמעט אף פעם לא צריך את ה-root שוב), ומחזיר את התשובה ל-stub. lookup קר יכול לקחת 50-200ms; lookup מה-cache לוקח פחות מ-1ms. בגלל זה הבקשה הראשונה לדומיין חדש איטית יותר.</p>`
      }
    },
    {
      h: { en: "Record types you'll actually use", he: "סוגי רשומות שבאמת תשתמש בהם" },
      body: {
        en: `<table>
<tr><th>Type</th><th>Maps</th><th>Example</th></tr>
<tr><td>A</td><td>name to IPv4</td><td><code>api.example.com A 203.0.113.10</code></td></tr>
<tr><td>AAAA</td><td>name to IPv6</td><td><code>api.example.com AAAA 2001:db8::10</code></td></tr>
<tr><td>CNAME</td><td>name to another name (alias)</td><td><code>www CNAME my-lb-123.elb.amazonaws.com.</code></td></tr>
<tr><td>MX</td><td>mail servers, with priority</td><td><code>example.com MX 10 mx1.mail.com.</code></td></tr>
<tr><td>TXT</td><td>arbitrary text</td><td>SPF, DKIM, domain verification tokens</td></tr>
<tr><td>NS</td><td>who is authoritative for a zone</td><td><code>example.com NS ns-123.awsdns-15.com.</code></td></tr>
</table>
<p>A <strong>CNAME can't live at the zone apex</strong> (<code>example.com</code> itself) because the apex must also hold NS and SOA records, and a CNAME can't coexist with other records. That's why providers invented <strong>ALIAS/ANAME</strong> records (Route 53 "Alias") that behave like a CNAME but answer with A records.</p>
<p>Also handy: <strong>SRV</strong> (service + port, used by Kubernetes and SIP), <strong>PTR</strong> (reverse lookup IP to name), <strong>CAA</strong> (which CAs may issue certs for your domain).</p>`,
        he: `<table>
<tr><th>סוג</th><th>ממפה</th><th>דוגמה</th></tr>
<tr><td>A</td><td>שם ל-IPv4</td><td><code>api.example.com A 203.0.113.10</code></td></tr>
<tr><td>AAAA</td><td>שם ל-IPv6</td><td><code>api.example.com AAAA 2001:db8::10</code></td></tr>
<tr><td>CNAME</td><td>שם לשם אחר (alias)</td><td><code>www CNAME my-lb-123.elb.amazonaws.com.</code></td></tr>
<tr><td>MX</td><td>שרתי מייל, עם עדיפות</td><td><code>example.com MX 10 mx1.mail.com.</code></td></tr>
<tr><td>TXT</td><td>טקסט חופשי</td><td>SPF, DKIM, טוקנים לאימות דומיין</td></tr>
<tr><td>NS</td><td>מי ה-authoritative של ה-zone</td><td><code>example.com NS ns-123.awsdns-15.com.</code></td></tr>
</table>
<p><strong>אי אפשר לשים CNAME ב-apex של ה-zone</strong> (<code>example.com</code> עצמו), כי ב-apex חייבות להיות גם רשומות NS ו-SOA, ו-CNAME לא יכול לחיות לצד רשומות אחרות. בגלל זה ספקים המציאו רשומות <strong>ALIAS/ANAME</strong> (ה-"Alias" של Route 53) שמתנהגות כמו CNAME אבל עונות עם רשומות A.</p>
<p>עוד שימושיות: <strong>SRV</strong> (שירות + port, משמש ב-Kubernetes וב-SIP), <strong>PTR</strong> (reverse lookup מ-IP לשם), <strong>CAA</strong> (אילו CAs מורשים להנפיק תעודות לדומיין שלך).</p>`
      }
    },
    {
      h: { en: "TTL, caching, and why it's always DNS", he: "TTL, caching, ולמה זה תמיד DNS" },
      body: {
        en: `<p>Every record has a <strong>TTL</strong> in seconds: "you may cache this for 3600 s". Caches exist everywhere - the recursive resolver, the OS (systemd-resolved), the JVM (which historically cached forever!), browsers, and your HTTP client's connection pool which keeps talking to the old IP.</p>
<p>The migration playbook: <strong>lower the TTL first</strong> (e.g. 86400 to 60) at least one old-TTL period before the change, make the change, verify, then raise the TTL back. Changing the record with a 24 h TTL still in caches means some users hit the old server for a day.</p>
<p>Negative answers are cached too: if you query a name <em>before</em> creating it, the NXDOMAIN is cached for the SOA's negative TTL. "I created the record but it still doesn't resolve" is often this.</p>
<blockquote>💡 Real world: in Kubernetes, <code>ndots:5</code> in resolv.conf means a lookup for <code>api.stripe.com</code> first tries <code>api.stripe.com.default.svc.cluster.local</code>, <code>...svc.cluster.local</code>, <code>...cluster.local</code> and more - several wasted queries per call. Use fully qualified names with a trailing dot or tune ndots for chatty external calls.</blockquote>`,
        he: `<p>לכל רשומה יש <strong>TTL</strong> בשניות: "מותר לשמור את זה ב-cache ל-3600 שניות". יש caches בכל מקום - ה-recursive resolver, מערכת ההפעלה (systemd-resolved), ה-JVM (שהיסטורית שמר לנצח!), דפדפנים, וה-connection pool של ה-HTTP client שממשיך לדבר עם ה-IP הישן.</p>
<p>הפלייבוק למיגרציה: <strong>קודם להוריד את ה-TTL</strong> (למשל מ-86400 ל-60) לפחות TTL ישן אחד לפני השינוי, לעשות את השינוי, לוודא, ואז להחזיר את ה-TTL למעלה. לשנות רשומה כשב-caches עדיין יושב TTL של 24 שעות אומר שחלק מהמשתמשים יגיעו לשרת הישן במשך יום.</p>
<p>גם תשובות שליליות נשמרות ב-cache: אם שאלת על שם <em>לפני</em> שיצרת אותו, ה-NXDOMAIN נשמר לפי ה-negative TTL של ה-SOA. "יצרתי את הרשומה והיא עדיין לא עובדת" זה הרבה פעמים בדיוק זה.</p>
<blockquote>💡 מהשטח: ב-Kubernetes, <code>ndots:5</code> ב-resolv.conf אומר ש-lookup ל-<code>api.stripe.com</code> מנסה קודם את <code>api.stripe.com.default.svc.cluster.local</code>, <code>...svc.cluster.local</code>, <code>...cluster.local</code> ועוד - כמה שאילתות מבוזבזות לכל קריאה. תשתמשו בשמות מלאים עם נקודה בסוף או תכווננו את ndots לקריאות חיצוניות רועשות.</blockquote>`
      }
    },
    {
      h: { en: "dig like a pro", he: "dig כמו מקצוען" },
      body: {
        en: `<p><code>dig</code> is the DNS stethoscope. Read its answer section: name, TTL (counting down when served from cache!), class, type, value.</p>
<pre>$ dig api.example.com +noall +answer
api.example.com.   287   IN   CNAME  my-alb-1234.us-east-1.elb.amazonaws.com.
my-alb-1234...     60    IN   A      52.4.10.20
my-alb-1234...     60    IN   A      34.192.8.7</pre>
<p>Key moves: <code>dig @8.8.8.8 name</code> asks a specific resolver (compare public vs internal answers - split-horizon DNS gives different answers inside and outside the VPC). <code>dig +trace name</code> walks root, TLD, authoritative yourself, bypassing caches. <code>dig NS example.com</code> shows who's authoritative - if it's not the provider you're editing records in, your changes go nowhere.</p>
<blockquote>⚠️ Production tip: the classic outage is "we changed the record in Route 53, but the domain's NS records at the registrar point to the old provider". Always check <code>dig NS</code> before blaming caching.</blockquote>`,
        he: `<p><code>dig</code> הוא הסטטוסקופ של DNS. קוראים את ה-answer section: שם, TTL (שסופר אחורה כשהתשובה מגיעה מ-cache!), class, type, ערך.</p>
<pre>$ dig api.example.com +noall +answer
api.example.com.   287   IN   CNAME  my-alb-1234.us-east-1.elb.amazonaws.com.
my-alb-1234...     60    IN   A      52.4.10.20
my-alb-1234...     60    IN   A      34.192.8.7</pre>
<p>מהלכים חשובים: <code>dig @8.8.8.8 name</code> שואל resolver ספציפי (להשוות תשובה ציבורית מול פנימית - split-horizon DNS נותן תשובות שונות בתוך ה-VPC ומחוצה לו). <code>dig +trace name</code> הולך בעצמו root, TLD, authoritative ועוקף caches. <code>dig NS example.com</code> מראה מי ה-authoritative - אם זה לא הספק שבו אתה עורך רשומות, השינויים שלך הולכים לשום מקום.</p>
<blockquote>⚠️ טיפ לפרודקשן: התקלה הקלאסית היא "שינינו את הרשומה ב-Route 53, אבל ה-NS של הדומיין אצל ה-registrar מצביעים על הספק הישן". תמיד לבדוק <code>dig NS</code> לפני שמאשימים את ה-caching.</blockquote>`
      }
    }
  ],
  diagram: `  app -> stub resolver (/etc/resolv.conf)
            |
            v
     recursive resolver (8.8.8.8 / VPC .2)   [cache]
       |  1. "api.example.com?"  -> root (.)        "ask .com servers"
       |  2. "api.example.com?"  -> .com TLD        "ask ns1.provider.net"
       |  3. "api.example.com?"  -> authoritative   "A 203.0.113.10, TTL 300"
            |
            v
     answer cached for 300s, returned to app`,
  handsOn: [
    { cmd: "dig +trace www.wikipedia.org", what: { en: "Walk the full chain yourself: root servers, then .org TLD, then Wikipedia's authoritative servers.", he: "ללכת בעצמך על כל השרשרת: root servers, אז ה-TLD של .org, ואז השרתים ה-authoritative של ויקיפדיה." } },
    { cmd: "dig github.com A +noall +answer; dig github.com A +noall +answer", what: { en: "Run twice against your resolver and watch the TTL count down - proof of caching.", he: "להריץ פעמיים מול ה-resolver ולראות את ה-TTL יורד - הוכחה ל-caching." } },
    { cmd: "dig example.com MX +short; dig example.com TXT +short; dig example.com NS +short", what: { en: "Inspect mail servers, SPF/verification TXT records, and authoritative name servers of a domain.", he: "לבדוק שרתי מייל, רשומות TXT של SPF ואימות, ואת ה-name servers ה-authoritative של דומיין." } },
    { cmd: "cat /etc/resolv.conf", what: { en: "See which resolver your machine (or Pod) uses and its search domains / ndots options.", he: "לראות באיזה resolver המכונה (או ה-Pod) משתמשת, ואת ה-search domains ואופציית ndots." } }
  ],
  mnemonic: {
    en: "\"Stub Requests Reach The Authority\": Stub, Recursive, Root, TLD, Authoritative. And the haiku every SRE knows: \"It's not DNS / There's no way it's DNS / It was DNS.\"",
    he: "\"Stub Requests Reach The Authority\": Stub, Recursive, Root, TLD, Authoritative. וההייקו שכל SRE מכיר: \"זה לא DNS / אין מצב שזה DNS / זה היה DNS.\""
  },
  pitfalls: [
    { en: "Changing a record without lowering the TTL in advance - old answers live in caches for up to the old TTL.", he: "לשנות רשומה בלי להוריד את ה-TTL מראש - תשובות ישנות חיות ב-caches עד ה-TTL הישן." },
    { en: "Putting a CNAME at the zone apex. Use your provider's ALIAS/ANAME record instead.", he: "לשים CNAME ב-apex של ה-zone. במקום זה משתמשים ברשומת ALIAS/ANAME של הספק." },
    { en: "Long-lived clients (JVM, connection pools) that resolve once and never again, so failover by DNS never reaches them.", he: "קליינטים ארוכי חיים (JVM, connection pools) שעושים resolve פעם אחת ולא שוב, אז failover דרך DNS לא מגיע אליהם." },
    { en: "Editing records in a DNS provider that isn't the one the registrar's NS records point to.", he: "לערוך רשומות אצל ספק DNS שהוא לא זה שה-NS אצל ה-registrar מצביעים עליו." }
  ],
  interview: [
    {
      q: { en: "Walk me through what happens when a browser resolves a name it has never seen.", he: "תסביר מה קורה כשדפדפן עושה resolve לשם שהוא לא ראה אף פעם." },
      a: { en: "Browser cache, OS cache and /etc/hosts miss, so the stub asks the configured recursive resolver. On a cold cache it queries a root server for the TLD's NS, the TLD for the domain's NS, and the authoritative server for the record. Each answer is cached by TTL, and the final A/AAAA goes back to the browser, which then opens TCP to that IP.", he: "יש miss ב-cache של הדפדפן, של ה-OS וב-/etc/hosts, אז ה-stub שואל את ה-recursive resolver המוגדר. כשה-cache קר הוא שואל root server על ה-NS של ה-TLD, את ה-TLD על ה-NS של הדומיין, ואת ה-authoritative על הרשומה. כל תשובה נשמרת לפי TTL, וה-A/AAAA הסופי חוזר לדפדפן, שפותח TCP ל-IP הזה." }
    },
    {
      q: { en: "How would you migrate a domain to a new server with minimal user impact?", he: "איך תעביר דומיין לשרת חדש עם מינימום פגיעה במשתמשים?" },
      a: { en: "Days ahead, lower the record's TTL to ~60 s and wait out the old TTL. Run old and new in parallel, switch the record, watch traffic drain from the old server (some clients cache longer than TTL), and only decommission after traffic is near zero. Then raise the TTL again.", he: "כמה ימים לפני, להוריד את ה-TTL של הרשומה לבערך 60 שניות ולחכות שה-TTL הישן יעבור. להריץ ישן וחדש במקביל, להחליף את הרשומה, לראות את התעבורה מתנקזת מהשרת הישן (יש קליינטים ששומרים יותר מה-TTL), ולפרק רק כשהתעבורה כמעט אפס. אחר כך להחזיר את ה-TTL למעלה." }
    }
  ],
  quiz: [
    {
      q: { en: "Which server actually holds the record for api.example.com?", he: "איזה שרת באמת מחזיק את הרשומה של api.example.com?" },
      options: [
        { en: "The root server", he: "ה-root server" },
        { en: "The .com TLD server", he: "שרת ה-TLD של .com" },
        { en: "The recursive resolver like 8.8.8.8", he: "ה-recursive resolver כמו 8.8.8.8" },
        { en: "The authoritative name server for example.com", he: "ה-name server ה-authoritative של example.com" }
      ],
      answer: 3,
      explain: { en: "Root and TLD only delegate. The recursive resolver may cache the answer, but the source of truth is the authoritative server listed in the domain's NS records.", he: "Root ו-TLD רק מפנים הלאה. ה-recursive resolver יכול לשמור את התשובה ב-cache, אבל מקור האמת הוא השרת ה-authoritative שמופיע ברשומות ה-NS של הדומיין." }
    },
    {
      q: { en: "You want example.com (the bare apex) to point at an AWS load balancer's hostname. What do you use?", he: "אתה רוצה ש-example.com (ה-apex) יצביע על hostname של load balancer ב-AWS. במה תשתמש?" },
      options: [
        { en: "A CNAME record at the apex", he: "רשומת CNAME ב-apex" },
        { en: "An ALIAS/Alias record", he: "רשומת ALIAS/Alias" },
        { en: "An MX record", he: "רשומת MX" },
        { en: "A TXT record with the hostname", he: "רשומת TXT עם ה-hostname" }
      ],
      answer: 1,
      explain: { en: "CNAME is illegal at the apex because it can't coexist with the required NS/SOA records. ALIAS resolves the target and returns A records.", he: "CNAME אסור ב-apex כי הוא לא יכול לחיות לצד רשומות ה-NS/SOA שחייבות להיות שם. ALIAS עושה resolve ליעד ומחזיר רשומות A." }
    },
    {
      q: { en: "You switched an A record 10 minutes ago; half your users still hit the old IP. The record had TTL 86400. What's going on?", he: "החלפת רשומת A לפני 10 דקות; חצי מהמשתמשים עדיין מגיעים ל-IP הישן. ה-TTL היה 86400. מה קורה?" },
      options: [
        { en: "Resolvers cached the old answer for up to 24 hours", he: "ה-resolvers שמרו את התשובה הישנה עד 24 שעות" },
        { en: "The authoritative server failed to save the change", he: "השרת ה-authoritative לא שמר את השינוי" },
        { en: "Root servers take 24 hours to propagate new records", he: "ל-root servers לוקח 24 שעות להפיץ רשומות חדשות" },
        { en: "The browser is using HTTP/3, which skips DNS", he: "הדפדפן משתמש ב-HTTP/3 שמדלג על DNS" }
      ],
      answer: 0,
      explain: { en: "There's no 'propagation' push - caches simply hold the old answer until its TTL expires. Root servers don't hold your records at all.", he: "אין באמת 'הפצה' - ה-caches פשוט מחזיקים את התשובה הישנה עד שה-TTL פג. ה-root servers בכלל לא מחזיקים את הרשומות שלך." }
    }
  ],
  related: ["net-troubleshooting", "net-http-tls", "k8s-services"]
});

window.INFRA.lessons.push({
  id: "net-http-tls",
  track: "networking",
  order: 4,
  icon: "🔐",
  level: 2,
  minutes: 12,
  title: { en: "HTTP & TLS", he: "HTTP ו-TLS" },
  tldr: {
    en: "HTTP is a text protocol of methods and status codes that got faster with versions 2 and 3; TLS wraps it in encryption and proves the server's identity through a chain of certificates.",
    he: "HTTP הוא פרוטוקול של methods ו-status codes שנהיה מהיר יותר בגרסאות 2 ו-3; TLS עוטף אותו בהצפנה ומוכיח את זהות השרת דרך שרשרת תעודות."
  },
  analogy: {
    en: "TLS is meeting a stranger who shows you an ID card. You don't know them, but you trust the Ministry of Interior (root CA) that signed the regional office's stamp (intermediate CA) that signed their card (leaf certificate). Once you're convinced, you agree on a secret language (session keys) that nobody listening at the next table can understand.",
    he: "TLS זה לפגוש זר שמראה לך תעודת זהות. אתה לא מכיר אותו, אבל אתה סומך על משרד הפנים (root CA) שחתם על החותמת של הלשכה האזורית (intermediate CA) שחתמה על התעודה שלו (leaf certificate). ברגע שהשתכנעת, אתם מסכימים על שפה סודית (session keys) שאף אחד שמקשיב מהשולחן הסמוך לא מבין."
  },
  sections: [
    {
      h: { en: "Methods & status codes cheat sheet", he: "שליפה מהירה: methods ו-status codes" },
      body: {
        en: `<table>
<tr><th>Method</th><th>Meaning</th><th>Idempotent?</th></tr>
<tr><td>GET</td><td>read</td><td>yes (and safe)</td></tr>
<tr><td>POST</td><td>create / action</td><td>no</td></tr>
<tr><td>PUT</td><td>replace whole resource</td><td>yes</td></tr>
<tr><td>PATCH</td><td>partial update</td><td>not necessarily</td></tr>
<tr><td>DELETE</td><td>remove</td><td>yes</td></tr>
</table>
<table>
<tr><th>Code</th><th>Means</th><th>Who to blame</th></tr>
<tr><td>301 / 302 / 304</td><td>moved permanently / temporarily / not modified (use your cache)</td><td>nobody</td></tr>
<tr><td>400 / 401 / 403 / 404</td><td>bad request / not authenticated / authenticated but forbidden / not found</td><td>client</td></tr>
<tr><td>429</td><td>too many requests (rate limited)</td><td>client, slow down</td></tr>
<tr><td>500</td><td>app crashed</td><td>your code</td></tr>
<tr><td>502</td><td>bad gateway - proxy got a broken/refused response from upstream</td><td>upstream down or crashing</td></tr>
<tr><td>503</td><td>service unavailable - no healthy backends / overloaded</td><td>capacity, health checks</td></tr>
<tr><td>504</td><td>gateway timeout - upstream too slow</td><td>slow upstream / timeout mismatch</td></tr>
</table>
<p>Idempotency matters for retries: a proxy retrying a timed-out <code>POST /payments</code> can charge twice. Use idempotency keys.</p>`,
        he: `<table>
<tr><th>Method</th><th>משמעות</th><th>Idempotent?</th></tr>
<tr><td>GET</td><td>קריאה</td><td>כן (וגם safe)</td></tr>
<tr><td>POST</td><td>יצירה / פעולה</td><td>לא</td></tr>
<tr><td>PUT</td><td>החלפת המשאב כולו</td><td>כן</td></tr>
<tr><td>PATCH</td><td>עדכון חלקי</td><td>לא בהכרח</td></tr>
<tr><td>DELETE</td><td>מחיקה</td><td>כן</td></tr>
</table>
<table>
<tr><th>קוד</th><th>פירוש</th><th>את מי להאשים</th></tr>
<tr><td>301 / 302 / 304</td><td>עבר לצמיתות / זמנית / לא השתנה (תשתמש ב-cache)</td><td>אף אחד</td></tr>
<tr><td>400 / 401 / 403 / 404</td><td>בקשה שגויה / לא מזוהה / מזוהה אבל אסור / לא נמצא</td><td>הקליינט</td></tr>
<tr><td>429</td><td>יותר מדי בקשות (rate limit)</td><td>הקליינט, שיאט</td></tr>
<tr><td>500</td><td>האפליקציה קרסה</td><td>הקוד שלך</td></tr>
<tr><td>502</td><td>bad gateway - ה-proxy קיבל תשובה שבורה או סירוב מה-upstream</td><td>upstream למטה או קורס</td></tr>
<tr><td>503</td><td>service unavailable - אין backends בריאים / עומס</td><td>קיבולת, health checks</td></tr>
<tr><td>504</td><td>gateway timeout - ה-upstream איטי מדי</td><td>upstream איטי / timeouts לא מתואמים</td></tr>
</table>
<p>Idempotency חשוב ל-retries: proxy שעושה retry ל-<code>POST /payments</code> שנתקע ב-timeout יכול לחייב פעמיים. תשתמשו ב-idempotency keys.</p>`
      }
    },
    {
      h: { en: "HTTP/1.1 vs HTTP/2 vs HTTP/3", he: "HTTP/1.1 מול HTTP/2 מול HTTP/3" },
      body: {
        en: `<p><strong>HTTP/1.1</strong> (1997): text-based, one request at a time per connection. <strong>Keep-alive</strong> reuses the TCP+TLS connection for the next request, saving the handshakes, but responses still queue up (head-of-line blocking), so browsers open ~6 connections per host.</p>
<p><strong>HTTP/2</strong> (2015): binary framing, <strong>multiplexing</strong> many streams over one TCP connection, header compression (HPACK). gRPC runs on it. Catch: one lost TCP packet stalls <em>all</em> streams, because TCP must deliver bytes in order - head-of-line blocking moved down a layer.</p>
<p><strong>HTTP/3</strong> (2022): runs over <strong>QUIC on UDP</strong>. Each stream is independently reliable, so one lost packet only stalls its own stream. TLS 1.3 is built in, connection setup is 1 RTT (0-RTT on resumption), and connections survive changing networks (Wi-Fi to 5G) via connection IDs instead of the 5-tuple.</p>
<blockquote>💡 Real world: gRPC over HTTP/2 keeps one long-lived connection, so an L4 load balancer pins all of a client's requests to one backend. That's why gRPC needs an L7 LB or client-side balancing - see Load Balancing.</blockquote>`,
        he: `<p><strong>HTTP/1.1</strong> (1997): מבוסס טקסט, בקשה אחת בכל פעם לכל חיבור. <strong>Keep-alive</strong> ממחזר את חיבור ה-TCP+TLS לבקשה הבאה וחוסך handshakes, אבל התשובות עדיין עומדות בתור (head-of-line blocking), אז דפדפנים פותחים בערך 6 חיבורים לכל host.</p>
<p><strong>HTTP/2</strong> (2015): framing בינארי, <strong>multiplexing</strong> של הרבה streams על חיבור TCP אחד, דחיסת headers (HPACK). gRPC רץ עליו. הקאץ': packet אחד שאבד ב-TCP עוצר את <em>כל</em> ה-streams, כי TCP חייב למסור בתים לפי הסדר - ה-head-of-line blocking פשוט ירד שכבה.</p>
<p><strong>HTTP/3</strong> (2022): רץ על <strong>QUIC מעל UDP</strong>. כל stream אמין בפני עצמו, אז packet שאבד עוצר רק את ה-stream שלו. TLS 1.3 מובנה, הקמת חיבור היא 1 RTT (0-RTT בחידוש), וחיבורים שורדים מעבר רשת (מ-Wi-Fi ל-5G) בזכות connection IDs במקום ה-5-tuple.</p>
<blockquote>💡 מהשטח: gRPC מעל HTTP/2 מחזיק חיבור אחד ארוך, אז load balancer ב-L4 נועץ את כל הבקשות של קליינט ב-backend אחד. בגלל זה gRPC צריך LB ב-L7 או balancing בצד הקליינט - ראו את שיעור Load Balancing.</blockquote>`
      }
    },
    {
      h: { en: "The TLS handshake & certificate chain", he: "ה-TLS handshake ושרשרת התעודות" },
      body: {
        en: `<p>TLS 1.3 handshake, simplified (1 RTT):</p>
<ol>
<li><strong>ClientHello</strong>: supported ciphers, a key share, and <strong>SNI</strong> - the hostname it wants (sent in plaintext, unless Encrypted Client Hello is used).</li>
<li><strong>ServerHello</strong> + certificate chain + signature: "here's my key share and proof I own this cert's private key".</li>
<li>Both sides derive the same session keys (ECDHE); HTTP flows encrypted.</li>
</ol>
<p>The client validates the chain: <strong>leaf</strong> cert (CN/SAN must match the hostname, not expired) signed by an <strong>intermediate CA</strong>, signed by a <strong>root CA</strong> that's preinstalled in the OS/browser trust store. The server must send leaf + intermediates; roots are never sent.</p>
<p>TLS 1.2 needs 2 RTTs, which is why upgrading to 1.3 is a free latency win. Let's Encrypt certs last 90 days and the industry is pushing toward even shorter lifetimes, so <strong>automate renewal</strong> (cert-manager, ACM, certbot) - expired certs are among the most embarrassing outages around.</p>
<blockquote>⚠️ Production tip: "works in Chrome, fails in curl/Java/Python with <em>unable to get local issuer certificate</em>" = your server isn't sending the intermediate. Browsers often paper over it; other clients don't. Check with <code>openssl s_client -connect host:443 -servername host -showcerts</code>.</blockquote>`,
        he: `<p>ה-handshake של TLS 1.3, בגרסה מפושטת (1 RTT):</p>
<ol>
<li><strong>ClientHello</strong>: ה-ciphers שנתמכים, key share, ו-<strong>SNI</strong> - ה-hostname שהוא רוצה (נשלח בטקסט גלוי, אלא אם משתמשים ב-Encrypted Client Hello).</li>
<li><strong>ServerHello</strong> + שרשרת התעודות + חתימה: "הנה ה-key share שלי והוכחה שה-private key של התעודה אצלי".</li>
<li>שני הצדדים גוזרים את אותם session keys (ECDHE); ה-HTTP זורם מוצפן.</li>
</ol>
<p>הקליינט מאמת את השרשרת: תעודת <strong>leaf</strong> (ה-CN/SAN חייב להתאים ל-hostname, לא פג תוקף) שנחתמה על ידי <strong>intermediate CA</strong>, שנחתם על ידי <strong>root CA</strong> שמותקן מראש ב-trust store של ה-OS או הדפדפן. השרת חייב לשלוח leaf + intermediates; את ה-root אף פעם לא שולחים.</p>
<p>TLS 1.2 צריך 2 RTTs, אז שדרוג ל-1.3 זה שיפור latency בחינם. תעודות של Let's Encrypt תקפות ל-90 יום והתעשייה דוחפת לתוקף קצר עוד יותר, אז <strong>חובה לעשות אוטומציה לחידוש</strong> (cert-manager, ACM, certbot) - תעודה שפגה היא אחת התקלות הכי מביכות שיש.</p>
<blockquote>⚠️ טיפ לפרודקשן: "עובד ב-Chrome, נכשל ב-curl/Java/Python עם <em>unable to get local issuer certificate</em>" = השרת לא שולח את ה-intermediate. דפדפנים לפעמים מסתירים את זה; קליינטים אחרים לא. בודקים עם <code>openssl s_client -connect host:443 -servername host -showcerts</code>.</blockquote>`
      }
    },
    {
      h: { en: "SNI and mTLS", he: "SNI ו-mTLS" },
      body: {
        en: `<p><strong>SNI (Server Name Indication)</strong> is why one IP can serve thousands of HTTPS sites: the client says which hostname it wants <em>before</em> encryption starts, so the server (or LB/CDN) can pick the right certificate. Forget SNI (old clients, <code>openssl s_client</code> without <code>-servername</code>) and you get the default cert - and a scary hostname mismatch.</p>
<p><strong>mTLS (mutual TLS)</strong>: the client also presents a certificate, and the server verifies it against a CA it trusts. Now both sides have cryptographic identity - no API keys to leak. Service meshes (Istio, Linkerd) do mTLS between every Pod automatically, issuing short-lived certs per workload. It's also common for B2B APIs and IoT devices.</p>
<pre>curl --cert client.crt --key client.key --cacert ca.crt https://internal-api:8443/</pre>
<p>mTLS answers "<em>who</em> is calling?", not "<em>may</em> they do this?" - you still need authorization on top.</p>`,
        he: `<p><strong>SNI (Server Name Indication)</strong> זה מה שמאפשר ל-IP אחד להגיש אלפי אתרי HTTPS: הקליינט אומר איזה hostname הוא רוצה <em>לפני</em> שההצפנה מתחילה, כדי שהשרת (או ה-LB/CDN) יבחר את התעודה הנכונה. בלי SNI (קליינטים ישנים, <code>openssl s_client</code> בלי <code>-servername</code>) מקבלים את תעודת ברירת המחדל - ו-hostname mismatch מפחיד.</p>
<p><strong>mTLS (mutual TLS)</strong>: גם הקליינט מציג תעודה, והשרת מאמת אותה מול CA שהוא סומך עליו. עכשיו לשני הצדדים יש זהות קריפטוגרפית - אין API keys שיכולים לדלוף. Service meshes (Istio, Linkerd) עושים mTLS בין כל Pod באופן אוטומטי ומנפיקים תעודות קצרות-חיים לכל workload. זה נפוץ גם ב-APIs של B2B ובמכשירי IoT.</p>
<pre>curl --cert client.crt --key client.key --cacert ca.crt https://internal-api:8443/</pre>
<p>mTLS עונה על "<em>מי</em> מתקשר?", לא על "<em>מותר</em> לו לעשות את זה?" - עדיין צריך authorization מעל.</p>`
      }
    }
  ],
  diagram: `  TLS 1.3 (1 RTT):
  client --- ClientHello (SNI=api.example.com, key share) ---> server
  client <-- ServerHello, cert chain, signature, Finished ---- server
  client --- Finished + GET /orders (encrypted) -------------> server

  Trust chain:
  [Root CA]  (in OS trust store, never sent)
      | signs
  [Intermediate CA]  (server MUST send)
      | signs
  [Leaf: api.example.com, SAN, expires 2026-12-01]`,
  handsOn: [
    { cmd: "curl -sv https://example.com -o /dev/null 2>&1 | grep -E '^\\* (SSL|TLS|ALPN|subject|issuer|expire)|^< HTTP'", what: { en: "See the negotiated TLS version, ALPN (h2 or http/1.1), certificate subject/issuer/expiry and the status line.", he: "לראות את גרסת ה-TLS שנבחרה, ALPN (h2 או http/1.1), ה-subject, ה-issuer והתוקף של התעודה ואת שורת הסטטוס." } },
    { cmd: "echo | openssl s_client -connect example.com:443 -servername example.com -showcerts", what: { en: "Dump the full chain the server sends - count the certs to catch a missing intermediate.", he: "להוציא את כל השרשרת שהשרת שולח - לספור תעודות כדי לתפוס intermediate חסר." } },
    { cmd: "echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates -ext subjectAltName", what: { en: "Print a cert's validity dates and SAN list - great for a cron job that alerts before expiry.", he: "להדפיס את תאריכי התוקף ואת רשימת ה-SAN של תעודה - מעולה ל-cron שמתריע לפני שהיא פגה." } },
    { cmd: "curl -sI --http3 https://cloudflare.com | head -1", what: { en: "Try HTTP/3 (needs a curl built with HTTP/3 support).", he: "לנסות HTTP/3 (צריך curl שנבנה עם תמיכה ב-HTTP/3)." } }
  ],
  mnemonic: {
    en: "Status codes by decade: 2xx 'here you go', 3xx 'go away (over there)', 4xx 'you messed up', 5xx 'we messed up'. And for gateways: 502 = Broken answer, 503 = No one home, 504 = Too slow.",
    he: "Status codes לפי מאות: 2xx 'בבקשה', 3xx 'לך משם (לשם)', 4xx 'אתה פישלת', 5xx 'אנחנו פישלנו'. ול-gateways: 502 = תשובה שבורה, 503 = אין אף אחד בבית, 504 = איטי מדי."
  },
  pitfalls: [
    { en: "Serving only the leaf certificate without intermediates - browsers may cope, but curl, Java, mobile apps fail.", he: "להגיש רק את תעודת ה-leaf בלי ה-intermediates - דפדפנים אולי יסתדרו, אבל curl, Java ואפליקציות מובייל נכשלים." },
    { en: "Manual certificate renewal. Someone goes on vacation, the cert expires, everything is down. Automate and alert at 30/14/7 days.", he: "חידוש תעודות ידני. מישהו יוצא לחופש, התעודה פגה, הכל למטה. אוטומציה + התראה ב-30/14/7 ימים." },
    { en: "Retrying non-idempotent POSTs at the proxy or client level without idempotency keys - duplicate orders and charges.", he: "לעשות retry ל-POST לא idempotent ב-proxy או בקליינט בלי idempotency keys - הזמנות וחיובים כפולים." },
    { en: "Using 403 and 401 interchangeably: 401 = 'who are you?' (authenticate), 403 = 'I know who you are, and no'.", he: "לבלבל בין 403 ל-401: 401 = 'מי אתה?' (צריך להזדהות), 403 = 'אני יודע מי אתה, והתשובה היא לא'." }
  ],
  interview: [
    {
      q: { en: "What's the difference between a 502 and a 504 from your load balancer?", he: "מה ההבדל בין 502 ל-504 מה-load balancer?" },
      a: { en: "502: the LB reached the upstream but got an invalid response or a refused/reset connection - the app crashed, isn't listening, or closed a keep-alive connection the LB reused. 504: the upstream accepted but didn't answer within the LB's timeout - slow queries, deadlocks, or an LB timeout shorter than the app's.", he: "502: ה-LB הגיע ל-upstream אבל קיבל תשובה לא תקינה או חיבור שנדחה/אופס - האפליקציה קרסה, לא מאזינה, או סגרה חיבור keep-alive שה-LB ניסה למחזר. 504: ה-upstream קיבל את הבקשה אבל לא ענה בתוך ה-timeout של ה-LB - שאילתות איטיות, deadlocks, או timeout של ה-LB קצר משל האפליקציה." }
    },
    {
      q: { en: "How does a client know it's talking to the real server and not a man-in-the-middle?", he: "איך קליינט יודע שהוא מדבר עם השרת האמיתי ולא עם man-in-the-middle?" },
      a: { en: "The server presents a cert whose SAN matches the requested hostname, chained via intermediates to a root in the client's trust store, and proves possession of the private key by signing the handshake. An attacker can't get a trusted CA to sign a cert for your domain (CAA records and Certificate Transparency logs help enforce that).", he: "השרת מציג תעודה שה-SAN שלה תואם ל-hostname המבוקש, שמשורשרת דרך intermediates ל-root שנמצא ב-trust store של הקליינט, ומוכיח שה-private key אצלו על ידי חתימה על ה-handshake. תוקף לא יכול לגרום ל-CA מוכר לחתום על תעודה לדומיין שלך (רשומות CAA ו-Certificate Transparency logs עוזרים לאכוף את זה)." }
    }
  ],
  quiz: [
    {
      q: { en: "What problem does HTTP/3 solve that HTTP/2 doesn't?", he: "איזו בעיה HTTP/3 פותר ש-HTTP/2 לא?" },
      options: [
        { en: "Multiplexing multiple requests on one connection", he: "multiplexing של כמה בקשות על חיבור אחד" },
        { en: "Header compression", he: "דחיסת headers" },
        { en: "A lost packet stalling every stream on the connection", he: "packet אבוד שעוצר את כל ה-streams בחיבור" },
        { en: "The need for TLS certificates", he: "הצורך בתעודות TLS" }
      ],
      answer: 2,
      explain: { en: "HTTP/2 already multiplexes and compresses headers, but over TCP a single loss blocks all streams. QUIC makes streams independent. Certificates are still required.", he: "HTTP/2 כבר עושה multiplexing ודוחס headers, אבל מעל TCP איבוד אחד חוסם את כל ה-streams. QUIC הופך את ה-streams לבלתי תלויים. תעודות עדיין חובה." }
    },
    {
      q: { en: "Which part of the TLS handshake lets one IP host certificates for many domains?", he: "איזה חלק ב-TLS handshake מאפשר ל-IP אחד להחזיק תעודות להרבה דומיינים?" },
      options: [
        { en: "SNI in the ClientHello", he: "SNI ב-ClientHello" },
        { en: "The root CA", he: "ה-root CA" },
        { en: "ALPN", he: "ALPN" },
        { en: "mTLS", he: "mTLS" }
      ],
      answer: 0,
      explain: { en: "SNI tells the server which hostname the client wants before the cert is chosen. ALPN negotiates the protocol (h2 vs http/1.1), not the cert.", he: "SNI אומר לשרת איזה hostname הקליינט רוצה לפני שהתעודה נבחרת. ALPN מתאם את הפרוטוקול (h2 מול http/1.1), לא את התעודה." }
    },
    {
      q: { en: "A user is logged in but tries to delete someone else's resource. Correct status?", he: "משתמש מחובר מנסה למחוק משאב של מישהו אחר. מה הסטטוס הנכון?" },
      options: [
        { en: "401 Unauthorized", he: "401 Unauthorized" },
        { en: "403 Forbidden", he: "403 Forbidden" },
        { en: "400 Bad Request", he: "400 Bad Request" },
        { en: "409 Conflict", he: "409 Conflict" }
      ],
      answer: 1,
      explain: { en: "Identity is known, permission is denied: 403. 401 (confusingly named) means unauthenticated. Some APIs return 404 to avoid revealing the resource exists.", he: "הזהות ידועה, ההרשאה נדחית: 403. 401 (שהשם שלו מבלבל) אומר לא מזוהה. יש APIs שמחזירים 404 כדי לא לחשוף שהמשאב קיים." }
    },
    {
      q: { en: "Your service works in browsers but Python requests fails with a certificate verify error. Most likely?", he: "השירות עובד בדפדפנים אבל ה-requests של Python נכשל עם שגיאת certificate verify. מה הכי סביר?" },
      options: [
        { en: "The certificate expired", he: "התעודה פגה" },
        { en: "Python doesn't support TLS 1.3", he: "Python לא תומך ב-TLS 1.3" },
        { en: "DNS is returning the wrong IP", he: "DNS מחזיר IP שגוי" },
        { en: "The server isn't sending the intermediate certificate", he: "השרת לא שולח את תעודת ה-intermediate" }
      ],
      answer: 3,
      explain: { en: "An expired cert would fail in browsers too. Missing intermediates are the classic 'browser OK, other clients broken' bug, since browsers cache or fetch intermediates.", he: "תעודה שפגה הייתה נכשלת גם בדפדפן. intermediate חסר זה הבאג הקלאסי של 'בדפדפן עובד, בקליינטים אחרים לא', כי דפדפנים שומרים או מורידים intermediates בעצמם." }
    }
  ],
  related: ["net-load-balancing", "net-proxies-cdn", "arch-api-gateway"]
});

window.INFRA.lessons.push({
  id: "net-load-balancing",
  track: "networking",
  order: 5,
  icon: "⚖️",
  level: 2,
  minutes: 11,
  title: { en: "Load balancing", he: "Load Balancing" },
  tldr: {
    en: "A load balancer spreads requests across healthy backends: L4 balances connections, L7 balances requests, health checks decide who's 'healthy', and sticky sessions are a crutch you should avoid.",
    he: "Load balancer מפזר בקשות בין backends בריאים: L4 מאזן חיבורים, L7 מאזן בקשות, health checks מחליטים מי 'בריא', ו-sticky sessions הם קביים שעדיף להימנע מהם."
  },
  analogy: {
    en: "A load balancer is the host at a busy restaurant. An L4 host seats parties at tables without reading the menu; an L7 host reads your order and sends sushi orders to the sushi bar and pizza to the oven. Health checks are the host peeking into the kitchen every 10 seconds - if a cook fainted, no new orders go to that station.",
    he: "Load balancer הוא המארחת במסעדה עמוסה. מארחת L4 מושיבה חבורות בשולחנות בלי להסתכל בתפריט; מארחת L7 קוראת את ההזמנה ושולחת סושי לבר הסושי ופיצה לטאבון. Health checks זה המארחת שמציצה למטבח כל 10 שניות - אם טבח התעלף, לא שולחים לעמדה שלו הזמנות חדשות."
  },
  sections: [
    {
      h: { en: "L4 vs L7", he: "L4 מול L7" },
      body: {
        en: `<table>
<tr><th></th><th>L4 (TCP/UDP)</th><th>L7 (HTTP/gRPC)</th></tr>
<tr><td>Sees</td><td>IPs, ports</td><td>Host, path, headers, cookies, methods</td></tr>
<tr><td>Balances</td><td>connections</td><td>individual requests</td></tr>
<tr><td>TLS</td><td>usually passes through</td><td>terminates (decrypts) it</td></tr>
<tr><td>Speed</td><td>very fast, millions of conns</td><td>more CPU, more features</td></tr>
<tr><td>Examples</td><td>AWS NLB, kube-proxy, HAProxy (tcp mode)</td><td>AWS ALB, nginx, Envoy, Ingress controllers</td></tr>
</table>
<p>L7 can route <code>api.example.com/v2/*</code> to one target group and <code>/static/*</code> to another, add headers like <code>X-Forwarded-For</code>, retry failed requests, and return a nice 503 page. L4 is the choice for non-HTTP protocols (databases, MQTT, raw TCP), when you need static IPs, or when you want end-to-end TLS untouched.</p>
<p>The connection-vs-request difference bites with long-lived connections: gRPC/HTTP2 or WebSockets through an L4 LB means one client stays glued to one backend for hours. New backends added by autoscaling get <em>no</em> traffic until clients reconnect.</p>`,
        he: `<table>
<tr><th></th><th>L4 (TCP/UDP)</th><th>L7 (HTTP/gRPC)</th></tr>
<tr><td>רואה</td><td>IPs, ports</td><td>Host, path, headers, cookies, methods</td></tr>
<tr><td>מאזן</td><td>חיבורים</td><td>בקשות בודדות</td></tr>
<tr><td>TLS</td><td>בדרך כלל מעביר כמו שהוא</td><td>עושה termination (מפענח)</td></tr>
<tr><td>מהירות</td><td>מהיר מאוד, מיליוני חיבורים</td><td>יותר CPU, יותר פיצ'רים</td></tr>
<tr><td>דוגמאות</td><td>AWS NLB, kube-proxy, HAProxy (tcp mode)</td><td>AWS ALB, nginx, Envoy, Ingress controllers</td></tr>
</table>
<p>L7 יכול לנתב את <code>api.example.com/v2/*</code> ל-target group אחד ואת <code>/static/*</code> לאחר, להוסיף headers כמו <code>X-Forwarded-For</code>, לעשות retry לבקשות שנכשלו, ולהחזיר דף 503 יפה. L4 הוא הבחירה לפרוטוקולים שהם לא HTTP (דאטהבייסים, MQTT, TCP גולמי), כשצריך IPs סטטיים, או כשרוצים TLS מקצה לקצה בלי לגעת בו.</p>
<p>ההבדל בין חיבור לבקשה נושך עם חיבורים ארוכים: gRPC/HTTP2 או WebSockets דרך LB ב-L4 אומר שקליינט אחד נשאר דבוק ל-backend אחד לשעות. backends חדשים שה-autoscaling הוסיף לא מקבלים <em>שום</em> תעבורה עד שהקליינטים מתחברים מחדש.</p>`
      }
    },
    {
      h: { en: "Algorithms", he: "אלגוריתמים" },
      body: {
        en: `<ul>
<li><strong>Round robin</strong>: 1, 2, 3, 1, 2, 3. Simple, great when requests cost about the same.</li>
<li><strong>Weighted round robin</strong>: a box with weight 3 gets 3x the traffic. Used for mixed instance sizes and <strong>canary releases</strong> (new version at weight 5 of 100).</li>
<li><strong>Least connections / least outstanding requests</strong>: send to the backend with the fewest in-flight requests. Wins when request cost varies wildly (one report takes 8 s, most take 20 ms) - round robin would keep piling onto the stuck server.</li>
<li><strong>IP hash</strong>: <code>hash(client IP) % N</code>. Same client, same server. But change N (add a server) and almost everyone moves.</li>
<li><strong>Consistent hashing</strong>: servers and keys sit on a ring; adding or removing one server only remaps ~1/N of keys. Essential for caches (memcached, CDN shards) where moving keys means cache misses.</li>
<li><strong>Power of two choices</strong>: pick 2 random backends, send to the less loaded one. Envoy and many modern LBs use this - nearly as good as global least-conn, with no global state.</li>
</ul>`,
        he: `<ul>
<li><strong>Round robin</strong>: 1, 2, 3, 1, 2, 3. פשוט, מעולה כשכל הבקשות עולות בערך אותו דבר.</li>
<li><strong>Weighted round robin</strong>: מכונה עם משקל 3 מקבלת פי 3 תעבורה. משמש כשיש גדלי instances שונים ול-<strong>canary releases</strong> (הגרסה החדשה במשקל 5 מתוך 100).</li>
<li><strong>Least connections / least outstanding requests</strong>: שולחים ל-backend עם הכי מעט בקשות פתוחות. מנצח כשעלות הבקשות משתנה מאוד (דוח אחד לוקח 8 שניות, רוב הבקשות 20ms) - round robin היה ממשיך לערום על השרת התקוע.</li>
<li><strong>IP hash</strong>: <code>hash(client IP) % N</code>. אותו קליינט, אותו שרת. אבל משנים את N (מוסיפים שרת) וכמעט כולם זזים.</li>
<li><strong>Consistent hashing</strong>: שרתים ומפתחות יושבים על טבעת; הוספה או הסרה של שרת ממפה מחדש רק בערך 1/N מהמפתחות. חיוני ל-caches (memcached, shards של CDN) שבהם הזזת מפתחות = cache misses.</li>
<li><strong>Power of two choices</strong>: בוחרים 2 backends אקראיים ושולחים לפחות עמוס מביניהם. Envoy והרבה LBs מודרניים משתמשים בזה - כמעט טוב כמו least-conn גלובלי, בלי state גלובלי.</li>
</ul>`
      }
    },
    {
      h: { en: "Health checks and sticky sessions", he: "Health checks ו-sticky sessions" },
      body: {
        en: `<p>A health check is the LB polling each backend, e.g. <code>GET /healthz</code> every 10 s, mark unhealthy after 3 failures, healthy again after 2 successes. So a dead instance can receive traffic for ~30 s before it's pulled - tune interval x threshold to your tolerance.</p>
<p>What should <code>/healthz</code> check? Keep it about <em>this instance</em> (process up, can serve). If it also checks the shared database, one DB blip marks <strong>every</strong> backend unhealthy at once and the LB returns 503 to everyone - you turned a partial outage into a total one. Also implement <strong>connection draining</strong> (deregistration delay) so in-flight requests finish during deploys.</p>
<p><strong>Sticky sessions</strong> pin a user to one backend via a cookie. They make in-memory sessions "work", but cause uneven load, break when that instance dies (user logged out), and fight autoscaling. Better: make servers stateless and keep sessions in Redis or a signed JWT.</p>
<blockquote>⚠️ Production tip: a deep health check that calls the DB is great for <em>alerting</em>, terrible for <em>LB routing</em>. Have two endpoints: <code>/livez</code> (shallow) for the LB, <code>/readyz</code> or a separate monitor for dependencies.</blockquote>`,
        he: `<p>Health check זה ה-LB ששואל כל backend, למשל <code>GET /healthz</code> כל 10 שניות, מסמן unhealthy אחרי 3 כישלונות ו-healthy שוב אחרי 2 הצלחות. כלומר instance מת יכול לקבל תעבורה בערך 30 שניות לפני שמוציאים אותו - כווננו interval כפול threshold לפי מה שאתם מוכנים לסבול.</p>
<p>מה <code>/healthz</code> צריך לבדוק? שיישאר על <em>ה-instance הזה</em> (התהליך למעלה, מסוגל להגיש). אם הוא בודק גם את הדאטהבייס המשותף, תקלה רגעית ב-DB מסמנת את <strong>כל</strong> ה-backends כ-unhealthy בבת אחת וה-LB מחזיר 503 לכולם - הפכתם תקלה חלקית לתקלה מלאה. תממשו גם <strong>connection draining</strong> (deregistration delay) כדי שבקשות באמצע יסתיימו בזמן deploy.</p>
<p><strong>Sticky sessions</strong> נועצות משתמש ל-backend אחד דרך cookie. הן גורמות ל-sessions בזיכרון "לעבוד", אבל יוצרות עומס לא מאוזן, נשברות כשה-instance מת (המשתמש מתנתק), ומתנגשות ב-autoscaling. עדיף: שרתים stateless ו-sessions ב-Redis או ב-JWT חתום.</p>
<blockquote>⚠️ טיפ לפרודקשן: health check עמוק שקורא ל-DB מעולה ל-<em>התראות</em>, גרוע ל-<em>ניתוב ב-LB</em>. תחזיקו שני endpoints: <code>/livez</code> (רדוד) ל-LB, ו-<code>/readyz</code> או מוניטור נפרד ל-dependencies.</blockquote>`
      }
    },
    {
      h: { en: "SSL termination and global load balancing", he: "SSL termination ו-load balancing גלובלי" },
      body: {
        en: `<p><strong>SSL/TLS termination</strong>: the LB holds the certificate, decrypts, and forwards plain HTTP (or re-encrypts) to backends. Benefits: one place to manage certs (e.g. ACM on an ALB), L7 routing becomes possible, backends save CPU. Trade-off: traffic inside the VPC is plaintext unless you re-encrypt - compliance (PCI, HIPAA) or zero-trust may require TLS all the way (re-encryption or passthrough).</p>
<p><strong>Global load balancing</strong> picks a <em>region</em> before any regional LB picks a server:</p>
<ul>
<li><strong>DNS-based GSLB</strong> (Route 53 latency/geo/failover routing): returns different IPs per user location or region health. Simple, but limited by DNS TTL caching.</li>
<li><strong>Anycast</strong>: the same IP is announced via BGP from many locations, and the Internet routes each user to the nearest one. Cloudflare, Google Cloud's global LB, AWS Global Accelerator and the DNS root servers all use it. Failover is in seconds, no TTL problem.</li>
</ul>
<blockquote>💡 Real world: 8.8.8.8 isn't one server in California - it's anycast, answered by whichever Google site is closest to you.</blockquote>`,
        he: `<p><strong>SSL/TLS termination</strong>: ה-LB מחזיק את התעודה, מפענח ומעביר HTTP רגיל (או מצפין מחדש) ל-backends. היתרונות: מקום אחד לנהל תעודות (למשל ACM על ALB), מתאפשר ניתוב L7, וה-backends חוסכים CPU. המחיר: התעבורה בתוך ה-VPC לא מוצפנת אלא אם מצפינים מחדש - רגולציה (PCI, HIPAA) או zero trust יכולים לדרוש TLS עד הסוף (re-encryption או passthrough).</p>
<p><strong>Load balancing גלובלי</strong> בוחר <em>region</em> לפני שה-LB האזורי בוחר שרת:</p>
<ul>
<li><strong>GSLB מבוסס DNS</strong> (Route 53 עם latency/geo/failover routing): מחזיר IPs שונים לפי מיקום המשתמש או בריאות ה-region. פשוט, אבל מוגבל על ידי caching של DNS TTL.</li>
<li><strong>Anycast</strong>: אותו IP מוכרז ב-BGP מהרבה מקומות, והאינטרנט מנתב כל משתמש לנקודה הקרובה. Cloudflare, ה-global LB של Google Cloud, AWS Global Accelerator וה-root servers של DNS משתמשים בזה. failover בשניות, בלי בעיית TTL.</li>
</ul>
<blockquote>💡 מהשטח: 8.8.8.8 הוא לא שרת אחד בקליפורניה - זה anycast, ועונה לך האתר של Google שהכי קרוב אליך.</blockquote>`
      }
    }
  ],
  diagram: `                 users
                   |
         [ GSLB: DNS / anycast ]  -> picks region
            /                \\
   [ L7 LB eu-west-1 ]   [ L7 LB us-east-1 ]   (TLS terminates here)
     /path routing          health: GET /livez every 10s
    /api/*     /static/*
   /   |   \\       |
  [a] [b] [c]   [s3/cdn]
       x  <- 3 failed checks: removed, connections drained`,
  handsOn: [
    { cmd: "for i in $(seq 1 6); do curl -s http://my-lb.example.com/whoami; echo; done", what: { en: "Hit an LB repeatedly with a backend that returns its hostname - watch round robin in action.", he: "לפנות ל-LB כמה פעמים כשה-backend מחזיר את ה-hostname שלו - לראות round robin בפעולה." } },
    { cmd: "aws elbv2 describe-target-health --target-group-arn $TG_ARN --query 'TargetHealthDescriptions[].[Target.Id,TargetHealth.State,TargetHealth.Reason]' --output table", what: { en: "See which targets the ALB/NLB considers healthy and why the others failed.", he: "לראות אילו targets ה-ALB/NLB חושב שהם בריאים, ולמה האחרים נכשלו." } },
    { cmd: "docker run --rm -p 8080:80 -v $PWD/nginx.conf:/etc/nginx/nginx.conf:ro nginx", what: { en: "Run nginx as a local LB with an upstream block (least_conn; server a:8000 weight=3; server b:8000;) to experiment.", he: "להריץ nginx כ-LB מקומי עם בלוק upstream (least_conn; server a:8000 weight=3; server b:8000;) ולשחק." } }
  ],
  mnemonic: {
    en: "\"L4 counts cars, L7 reads the mail\": L4 balances connections, L7 opens requests. And for stickiness: \"Sticky is icky - store state elsewhere.\"",
    he: "\"L4 סופר מכוניות, L7 קורא את הדואר\": L4 מאזן חיבורים, L7 פותח בקשות. ולגבי sticky: \"Sticky זה יאקי - תשמרו state במקום אחר.\""
  },
  pitfalls: [
    { en: "Health checks that depend on shared dependencies (DB, Redis) - one dependency blip marks all backends unhealthy and causes a full outage.", he: "Health checks שתלויים ב-dependencies משותפים (DB, Redis) - תקלה רגעית אחת מסמנת את כל ה-backends כ-unhealthy וגורמת להשבתה מלאה." },
    { en: "Putting gRPC/WebSockets behind an L4 LB and wondering why new instances get no traffic - connections, not requests, are balanced.", he: "לשים gRPC/WebSockets מאחורי LB ב-L4 ולתהות למה instances חדשים לא מקבלים תעבורה - מאזנים חיבורים, לא בקשות." },
    { en: "LB idle timeout longer than the app's keep-alive timeout: the app closes the connection while the LB reuses it, causing random 502s. Make the app's keep-alive longer than the LB's.", he: "Idle timeout של ה-LB ארוך מה-keep-alive של האפליקציה: האפליקציה סוגרת את החיבור בזמן שה-LB ממחזר אותו, ויוצאים 502 אקראיים. ה-keep-alive של האפליקציה צריך להיות ארוך משל ה-LB." },
    { en: "Relying on sticky sessions for in-memory state, then losing all sessions on every deploy or scale-in.", he: "להסתמך על sticky sessions בשביל state בזיכרון, ולאבד את כל ה-sessions בכל deploy או scale-in." }
  ],
  interview: [
    {
      q: { en: "When would you choose least-connections over round robin?", he: "מתי תבחר least-connections על פני round robin?" },
      a: { en: "When request cost varies a lot or backends have different capacity. Round robin keeps sending to a server that's stuck on slow requests; least-connections naturally routes away from it. For uniform cheap requests, round robin is fine and simpler.", he: "כשעלות הבקשות משתנה הרבה או שלבקאנדים יש קיבולת שונה. Round robin ממשיך לשלוח לשרת שתקוע על בקשות איטיות; least-connections מנתב ממנו באופן טבעי. לבקשות זולות ואחידות, round robin מספיק ופשוט יותר." }
    },
    {
      q: { en: "Why is consistent hashing used for caches instead of hash mod N?", he: "למה משתמשים ב-consistent hashing ל-caches ולא ב-hash mod N?" },
      a: { en: "With mod N, adding one node changes N and remaps almost every key, causing a cache-miss storm that can crush the database. Consistent hashing remaps only ~1/N of the keys, and virtual nodes keep the distribution even.", he: "עם mod N, הוספת node אחד משנה את N וממפה מחדש כמעט כל מפתח, מה שיוצר סערת cache misses שיכולה להפיל את הדאטהבייס. Consistent hashing ממפה מחדש רק בערך 1/N מהמפתחות, ו-virtual nodes שומרים על פיזור אחיד." }
    }
  ],
  quiz: [
    {
      q: { en: "You need to route /api to one service and /admin to another. Which LB?", he: "צריך לנתב את /api לשירות אחד ואת /admin לשירות אחר. איזה LB?" },
      options: [
        { en: "An L4 LB like AWS NLB", he: "LB ב-L4 כמו AWS NLB" },
        { en: "DNS round robin", he: "DNS round robin" },
        { en: "An L7 LB like AWS ALB or nginx", he: "LB ב-L7 כמו AWS ALB או nginx" },
        { en: "Anycast", he: "Anycast" }
      ],
      answer: 2,
      explain: { en: "Path-based routing requires reading the HTTP request, which only L7 does. DNS and anycast operate on names/IPs, L4 on ports.", he: "ניתוב לפי path דורש לקרוא את בקשת ה-HTTP, ורק L7 עושה את זה. DNS ו-anycast עובדים על שמות ו-IPs, L4 על ports." }
    },
    {
      q: { en: "Your /healthz checks the database. The DB has a 20-second failover. What happens?", he: "ה-/healthz שלך בודק את הדאטהבייס. ל-DB יש failover של 20 שניות. מה קורה?" },
      options: [
        { en: "All backends are marked unhealthy and the LB returns 503 to everyone", he: "כל ה-backends מסומנים unhealthy וה-LB מחזיר 503 לכולם" },
        { en: "Only the backend closest to the DB is removed", he: "רק ה-backend הכי קרוב ל-DB יוצא" },
        { en: "Nothing, health checks ignore database errors", he: "כלום, health checks מתעלמים משגיאות דאטהבייס" },
        { en: "The LB automatically fails over to another region", he: "ה-LB עובר אוטומטית ל-region אחר" }
      ],
      answer: 0,
      explain: { en: "A shared dependency failing fails every instance's check simultaneously. Keep LB health checks shallow.", he: "כשתלות משותפת נופלת, הבדיקה של כל ה-instances נכשלת בבת אחת. תשאירו את ה-health checks של ה-LB רדודים." }
    },
    {
      q: { en: "Which technique lets one IP address be served from dozens of locations worldwide?", he: "איזו טכניקה מאפשרת לכתובת IP אחת להיות מוגשת מעשרות מקומות בעולם?" },
      options: [
        { en: "Sticky sessions", he: "Sticky sessions" },
        { en: "Anycast via BGP", he: "Anycast דרך BGP" },
        { en: "Weighted round robin", he: "Weighted round robin" },
        { en: "SNI", he: "SNI" }
      ],
      answer: 1,
      explain: { en: "Anycast announces the same prefix from many sites; Internet routing delivers each user to the nearest one.", he: "Anycast מכריז על אותו prefix מהרבה אתרים; הניתוב באינטרנט מביא כל משתמש לקרוב ביותר." }
    }
  ],
  playground: "lb",
  related: ["net-http-tls", "net-proxies-cdn", "k8s-services", "rel-ha"]
});

window.INFRA.lessons.push({
  id: "net-proxies-cdn",
  track: "networking",
  order: 6,
  icon: "🪞",
  level: 2,
  minutes: 10,
  title: { en: "Proxies & CDNs", he: "Proxies ו-CDN" },
  tldr: {
    en: "A forward proxy acts for clients, a reverse proxy acts for servers, and a CDN is a worldwide fleet of reverse proxies that caches your content near users - controlled by Cache-Control headers.",
    he: "Forward proxy עובד בשביל הקליינטים, reverse proxy עובד בשביל השרתים, ו-CDN הוא צי עולמי של reverse proxies ששומר את התוכן שלך ב-cache קרוב למשתמשים - בשליטת headers של Cache-Control."
  },
  analogy: {
    en: "A forward proxy is your personal assistant who makes calls on your behalf - the other side only sees the assistant. A reverse proxy is a company receptionist - callers never learn which employee actually answered. A CDN is a franchise: instead of everyone flying to the Tel Aviv HQ for a falafel, there's a branch in every city serving the same recipe.",
    he: "Forward proxy זה העוזר האישי שמתקשר בשמך - הצד השני רואה רק את העוזר. Reverse proxy זו המזכירה של החברה - מי שמתקשר לא יודע איזה עובד באמת ענה. CDN זה זיכיון: במקום שכולם יטוסו למטה בתל אביב בשביל פלאפל, יש סניף בכל עיר עם אותו מתכון."
  },
  sections: [
    {
      h: { en: "Forward vs reverse proxy", he: "Forward proxy מול reverse proxy" },
      body: {
        en: `<p>A <strong>forward proxy</strong> sits in front of <em>clients</em>. Corporate egress proxies (Squid, Zscaler) filter and log outbound traffic; servers see the proxy's IP. Your tools honor it via <code>HTTPS_PROXY=http://proxy:3128</code> and skip it with <code>NO_PROXY=.internal,10.0.0.0/8</code>.</p>
<p>A <strong>reverse proxy</strong> sits in front of <em>servers</em>. Clients think it <em>is</em> the server. It terminates TLS, routes, load balances, compresses, caches, rate limits, and hides your topology. nginx, HAProxy, Envoy, Traefik, Kubernetes Ingress controllers, API gateways and CDNs are all reverse proxies.</p>
<p>Because the backend now sees the proxy's IP, the real client IP travels in <code>X-Forwarded-For: client, proxy1, proxy2</code> (and <code>X-Forwarded-Proto</code> for the original scheme). Only trust that header from your own proxies - anyone can send a fake one, and an IP allowlist built on a spoofable header is no allowlist at all.</p>`,
        he: `<p><strong>Forward proxy</strong> יושב מול <em>הקליינטים</em>. Egress proxies ארגוניים (Squid, Zscaler) מסננים ומתעדים תעבורה יוצאת; השרתים רואים את ה-IP של ה-proxy. הכלים שלכם מכבדים אותו דרך <code>HTTPS_PROXY=http://proxy:3128</code> ומדלגים עליו עם <code>NO_PROXY=.internal,10.0.0.0/8</code>.</p>
<p><strong>Reverse proxy</strong> יושב מול <em>השרתים</em>. הקליינטים חושבים שהוא <em>השרת</em>. הוא עושה TLS termination, ניתוב, load balancing, דחיסה, caching, rate limiting ומסתיר את הטופולוגיה שלכם. nginx, HAProxy, Envoy, Traefik, Ingress controllers ב-Kubernetes, API gateways ו-CDNs - כולם reverse proxies.</p>
<p>כיוון שה-backend רואה עכשיו את ה-IP של ה-proxy, ה-IP האמיתי של הקליינט עובר ב-<code>X-Forwarded-For: client, proxy1, proxy2</code> (ו-<code>X-Forwarded-Proto</code> בשביל ה-scheme המקורי). לסמוך על ה-header הזה רק כשהוא מגיע מה-proxies שלכם - כל אחד יכול לשלוח אחד מזויף, ו-allowlist של IPs שמבוסס על header שאפשר לזייף הוא לא allowlist.</p>`
      }
    },
    {
      h: { en: "nginx and Envoy in practice", he: "nginx ו-Envoy בפועל" },
      body: {
        en: `<p>A minimal nginx reverse proxy with load balancing and sane timeouts:</p>
<pre>upstream app {
    least_conn;
    server 10.0.2.11:8080;
    server 10.0.2.12:8080;
    keepalive 32;                      # reuse upstream connections
}
server {
    listen 443 ssl;
    server_name api.example.com;
    ssl_certificate     /etc/ssl/api.crt;
    ssl_certificate_key /etc/ssl/api.key;
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }
}</pre>
<p><strong>Envoy</strong> is the modern, API-driven cousin: configured dynamically (xDS) by a control plane, with first-class HTTP/2, gRPC, retries, circuit breaking, outlier detection and rich metrics. It's the data plane of Istio and many API gateways. Rule of thumb: nginx for a static edge you configure by hand; Envoy when a control plane manages hundreds of services.</p>`,
        he: `<p>reverse proxy מינימלי ב-nginx עם load balancing ו-timeouts שפויים:</p>
<pre>upstream app {
    least_conn;
    server 10.0.2.11:8080;
    server 10.0.2.12:8080;
    keepalive 32;                      # reuse upstream connections
}
server {
    listen 443 ssl;
    server_name api.example.com;
    ssl_certificate     /etc/ssl/api.crt;
    ssl_certificate_key /etc/ssl/api.key;
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }
}</pre>
<p><strong>Envoy</strong> הוא בן הדוד המודרני שמנוהל דרך API: מוגדר דינמית (xDS) על ידי control plane, עם תמיכה מלאה ב-HTTP/2, gRPC, retries, circuit breaking, outlier detection ומטריקות עשירות. הוא ה-data plane של Istio ושל הרבה API gateways. כלל אצבע: nginx ל-edge סטטי שמגדירים ביד; Envoy כש-control plane מנהל מאות שירותים.</p>`
      }
    },
    {
      h: { en: "CDNs and cache headers", he: "CDN ו-cache headers" },
      body: {
        en: `<p>A CDN (CloudFront, Cloudflare, Fastly, Akamai) runs hundreds of <strong>edge locations (PoPs)</strong>. A user in Haifa hits the Tel Aviv PoP (~5 ms) instead of your origin in Virginia (~130 ms). On a <strong>cache hit</strong> the origin isn't touched at all; on a miss the edge fetches from origin, stores, and serves.</p>
<p>Your origin controls caching with headers:</p>
<table>
<tr><th>Header</th><th>Meaning</th></tr>
<tr><td><code>Cache-Control: public, max-age=31536000, immutable</code></td><td>Cache for a year - for fingerprinted assets like <code>app.3f9a1c.js</code></td></tr>
<tr><td><code>Cache-Control: public, max-age=60, s-maxage=300</code></td><td>Browsers 60 s, shared caches (CDN) 5 min</td></tr>
<tr><td><code>Cache-Control: no-cache</code></td><td>May store, but must revalidate every time (not "don't cache"!)</td></tr>
<tr><td><code>Cache-Control: no-store</code> / <code>private</code></td><td>Never store / only the browser may store - for personal data</td></tr>
<tr><td><code>ETag</code> + <code>If-None-Match</code></td><td>Revalidation: unchanged, so the server answers 304 with no body</td></tr>
<tr><td><code>Vary: Accept-Encoding</code></td><td>Cache separate copies per header value</td></tr>
</table>
<blockquote>⚠️ Production tip: never let a CDN cache a response that contains <code>Set-Cookie</code> or user data. The infamous "user A sees user B's account page" incidents are cache-key mistakes. Mark personalized responses <code>private, no-store</code>.</blockquote>`,
        he: `<p>CDN (CloudFront, Cloudflare, Fastly, Akamai) מריץ מאות <strong>edge locations (PoPs)</strong>. משתמש בחיפה מגיע ל-PoP בתל אביב (כ-5ms) במקום ל-origin בווירג'יניה (כ-130ms). ב-<strong>cache hit</strong> לא נוגעים ב-origin בכלל; ב-miss ה-edge מביא מה-origin, שומר ומגיש.</p>
<p>ה-origin שולט ב-caching דרך headers:</p>
<table>
<tr><th>Header</th><th>משמעות</th></tr>
<tr><td><code>Cache-Control: public, max-age=31536000, immutable</code></td><td>cache לשנה - ל-assets עם fingerprint כמו <code>app.3f9a1c.js</code></td></tr>
<tr><td><code>Cache-Control: public, max-age=60, s-maxage=300</code></td><td>דפדפנים 60 שניות, caches משותפים (CDN) 5 דקות</td></tr>
<tr><td><code>Cache-Control: no-cache</code></td><td>מותר לשמור, אבל חייבים לעשות revalidate כל פעם (זה לא "אל תשמור"!)</td></tr>
<tr><td><code>Cache-Control: no-store</code> / <code>private</code></td><td>לעולם לא לשמור / רק הדפדפן רשאי לשמור - למידע אישי</td></tr>
<tr><td><code>ETag</code> + <code>If-None-Match</code></td><td>Revalidation: לא השתנה, אז השרת עונה 304 בלי body</td></tr>
<tr><td><code>Vary: Accept-Encoding</code></td><td>לשמור עותק נפרד לכל ערך של ה-header</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: לעולם לא לתת ל-CDN לשמור תשובה שיש בה <code>Set-Cookie</code> או מידע של משתמש. התקלות המפורסמות של "משתמש A רואה את עמוד החשבון של משתמש B" הן טעויות ב-cache key. סמנו תשובות אישיות כ-<code>private, no-store</code>.</blockquote>`
      }
    },
    {
      h: { en: "Rate limiting at the edge", he: "Rate limiting ב-edge" },
      body: {
        en: `<p>Stopping abuse at the edge is cheaper than in your app: the bad request never crosses the ocean or wakes a Pod. Most limiters use a <strong>token bucket</strong>: a bucket holds N tokens (burst), refills at R per second, and each request spends one. Empty bucket = <code>429 Too Many Requests</code> with a <code>Retry-After</code> header.</p>
<pre>limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ {
    limit_req zone=api burst=20 nodelay;
    limit_req_status 429;
}</pre>
<p>Key choice matters: limiting per IP punishes a whole office behind one NAT; limiting per API key or user ID is fairer. Distributed limits across many edge nodes are approximate - that's fine. Combine with a <strong>WAF</strong> for known attack patterns and the CDN's DDoS absorption for volumetric floods.</p>
<blockquote>💡 Real world: put cheap, coarse limits at the CDN/WAF (e.g. 2,000 req/5 min per IP on /login) and precise business limits (plan quotas) in the API gateway, where you know who the customer is.</blockquote>`,
        he: `<p>לעצור ניצול לרעה ב-edge זול יותר מאשר באפליקציה: הבקשה הרעה לא חוצה את האוקיינוס ולא מעירה Pod. רוב ה-limiters משתמשים ב-<strong>token bucket</strong>: דלי מחזיק N טוקנים (burst), מתמלא בקצב R לשנייה, וכל בקשה מוציאה טוקן. דלי ריק = <code>429 Too Many Requests</code> עם header של <code>Retry-After</code>.</p>
<pre>limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ {
    limit_req zone=api burst=20 nodelay;
    limit_req_status 429;
}</pre>
<p>הבחירה של המפתח חשובה: הגבלה לפי IP מענישה משרד שלם שיושב מאחורי NAT אחד; הגבלה לפי API key או user ID הוגנת יותר. הגבלות מבוזרות על פני הרבה edge nodes הן מקורבות - וזה בסדר. משלבים עם <strong>WAF</strong> לדפוסי תקיפה מוכרים ועם יכולת ספיגת ה-DDoS של ה-CDN להצפות נפחיות.</p>
<blockquote>💡 מהשטח: שימו הגבלות זולות וגסות ב-CDN/WAF (למשל 2,000 בקשות ל-5 דקות לכל IP על /login) והגבלות עסקיות מדויקות (quotas לפי תוכנית) ב-API gateway, שם יודעים מי הלקוח.</blockquote>`
      }
    }
  ],
  diagram: `  Forward proxy:   [laptops] -> [corp proxy] -> Internet -> sites
                                (sites see proxy IP)

  Reverse proxy / CDN:
  user(Haifa) -> [CDN edge TLV] --hit--> response (5 ms)
                       |
                      miss
                       v
                 [origin: nginx/ALB, us-east-1] -> [app pods]
                 (130 ms, then cached at edge per Cache-Control)`,
  handsOn: [
    { cmd: "curl -sI https://www.cloudflare.com | grep -iE 'cache-control|age|cf-cache-status|etag|vary'", what: { en: "Inspect real cache headers; Age shows how long the object sat in the edge cache, cf-cache-status shows HIT/MISS.", he: "לבדוק cache headers אמיתיים; Age מראה כמה זמן האובייקט יושב ב-cache של ה-edge, ו-cf-cache-status מראה HIT/MISS." } },
    { cmd: "curl -sI https://example.com -H 'If-None-Match: \"PASTE_ETAG_HERE\"'", what: { en: "Revalidate with an ETag you got earlier and watch for a 304 Not Modified with no body.", he: "לעשות revalidate עם ETag שקיבלת קודם ולראות 304 Not Modified בלי body." } },
    { cmd: "HTTPS_PROXY=http://localhost:3128 curl -v https://example.com", what: { en: "Send a request through a forward proxy (e.g. a local Squid) and see the CONNECT tunnel in the verbose output.", he: "לשלוח בקשה דרך forward proxy (למשל Squid מקומי) ולראות את ה-CONNECT tunnel בפלט ה-verbose." } },
    { cmd: "for i in $(seq 1 30); do curl -s -o /dev/null -w '%{http_code} ' https://your-api/api/ping; done", what: { en: "Fire 30 quick requests at a rate-limited endpoint and watch 200s turn into 429s.", he: "לירות 30 בקשות מהירות על endpoint עם rate limit ולראות את ה-200 הופכים ל-429." } }
  ],
  mnemonic: {
    en: "\"Forward hides the client, Reverse hides the server.\" And for caching: \"no-cache means CHECK, no-store means NEVER.\"",
    he: "\"Forward מסתיר את הקליינט, Reverse מסתיר את השרת.\" ול-caching: \"no-cache אומר לבדוק, no-store אומר אף פעם.\""
  },
  pitfalls: [
    { en: "Trusting X-Forwarded-For from anyone - attackers spoof it to bypass IP allowlists and rate limits. Only accept it from your own proxy hops.", he: "לסמוך על X-Forwarded-For מכל אחד - תוקפים מזייפים אותו כדי לעקוף allowlists ו-rate limits. לקבל אותו רק מה-proxies שלכם." },
    { en: "Thinking no-cache means 'don't cache'. It means 'revalidate'. Use no-store for sensitive responses.", he: "לחשוב ש-no-cache אומר 'אל תשמור'. הוא אומר 'תעשה revalidate'. ל-תשובות רגישות משתמשים ב-no-store." },
    { en: "Long max-age on non-fingerprinted files (index.html, app.js) - after a deploy, users get stale code for days. Fingerprint asset names, keep HTML short-lived.", he: "max-age ארוך על קבצים בלי fingerprint (index.html, app.js) - אחרי deploy משתמשים מקבלים קוד ישן לימים. תנו ל-assets שמות עם fingerprint, ול-HTML זמן חיים קצר." },
    { en: "Rate limiting only by IP: corporate NATs and mobile carriers put thousands of users behind one IP.", he: "Rate limiting רק לפי IP: NATs ארגוניים וספקים סלולריים שמים אלפי משתמשים מאחורי IP אחד." }
  ],
  interview: [
    {
      q: { en: "How would you deploy a new frontend version so no user gets stale JS from the CDN?", he: "איך תעשה deploy לגרסת frontend חדשה כך שאף משתמש לא יקבל JS ישן מה-CDN?" },
      a: { en: "Content-hash every asset filename (app.3f9a1c.js) and serve them with max-age=1y, immutable. Serve index.html with a short max-age or no-cache so it revalidates. Upload new assets first, then the new index.html; old assets stay for users mid-session. Invalidate only index.html if needed.", he: "לתת לכל asset שם עם hash של התוכן (app.3f9a1c.js) ולהגיש עם max-age=1y, immutable. להגיש את index.html עם max-age קצר או no-cache כדי שיעשה revalidate. להעלות קודם את ה-assets החדשים ואז את index.html החדש; ה-assets הישנים נשארים למשתמשים שבאמצע session. אם צריך, invalidation רק ל-index.html." }
    },
    {
      q: { en: "What's the difference between a reverse proxy and an API gateway?", he: "מה ההבדל בין reverse proxy ל-API gateway?" },
      a: { en: "An API gateway is a reverse proxy with API-specific features: authentication (JWT/API keys), per-consumer quotas, request transformation, versioning and a developer portal. Under the hood many gateways are nginx or Envoy with plugins.", he: "API gateway הוא reverse proxy עם פיצ'רים ספציפיים ל-APIs: authentication (JWT/API keys), quotas לכל צרכן, טרנספורמציה של בקשות, ניהול גרסאות ו-developer portal. מתחת למכסה הרבה gateways הם nginx או Envoy עם plugins." }
    }
  ],
  quiz: [
    {
      q: { en: "Which header lets browsers keep a response but forces them to check with the server before reusing it?", he: "איזה header מאפשר לדפדפן לשמור תשובה אבל מחייב אותו לבדוק מול השרת לפני שימוש חוזר?" },
      options: [
        { en: "Cache-Control: no-store", he: "Cache-Control: no-store" },
        { en: "Cache-Control: immutable", he: "Cache-Control: immutable" },
        { en: "Cache-Control: no-cache", he: "Cache-Control: no-cache" },
        { en: "Cache-Control: private", he: "Cache-Control: private" }
      ],
      answer: 2,
      explain: { en: "no-cache = store but always revalidate. no-store forbids storing; private only restricts storage to the browser; immutable says never revalidate.", he: "no-cache = לשמור אבל תמיד לעשות revalidate. no-store אוסר לשמור; private רק מגביל את השמירה לדפדפן; immutable אומר לא לעשות revalidate אף פעם." }
    },
    {
      q: { en: "Your corporate laptop reaches the Internet through a Zscaler/Squid box. That box is a...", he: "הלפטופ בעבודה יוצא לאינטרנט דרך Zscaler/Squid. הרכיב הזה הוא..." },
      options: [
        { en: "Forward proxy", he: "Forward proxy" },
        { en: "Reverse proxy", he: "Reverse proxy" },
        { en: "CDN edge", he: "CDN edge" },
        { en: "Load balancer", he: "Load balancer" }
      ],
      answer: 0,
      explain: { en: "It acts on behalf of clients going out. Reverse proxies, CDNs and LBs act on behalf of servers receiving traffic.", he: "הוא פועל בשם הקליינטים שיוצאים החוצה. Reverse proxies, CDNs ו-LBs פועלים בשם שרתים שמקבלים תעבורה." }
    },
    {
      q: { en: "Users report seeing other users' dashboards after you put the app behind a CDN. Most likely cause?", he: "משתמשים מדווחים שהם רואים דשבורדים של משתמשים אחרים אחרי שהכנסתם את האפליקציה מאחורי CDN. מה הסיבה הכי סבירה?" },
      options: [
        { en: "The TLS certificate is shared across users", he: "תעודת ה-TLS משותפת לכל המשתמשים" },
        { en: "Personalized responses were cached because they lacked private/no-store", he: "תשובות אישיות נשמרו ב-cache כי חסר להן private/no-store" },
        { en: "The CDN uses round robin", he: "ה-CDN משתמש ב-round robin" },
        { en: "Anycast routed users to the wrong country", he: "Anycast ניתב משתמשים למדינה הלא נכונה" }
      ],
      answer: 1,
      explain: { en: "The cache key (URL) was the same for everyone, so the first user's page got cached and served to others. Mark personalized content private/no-store or vary the cache key properly.", he: "ה-cache key (ה-URL) היה זהה לכולם, אז העמוד של המשתמש הראשון נשמר והוגש לאחרים. מסמנים תוכן אישי כ-private/no-store או מגדירים cache key נכון." }
    }
  ],
  related: ["net-load-balancing", "net-http-tls", "arch-api-gateway", "net-firewalls"]
});

window.INFRA.lessons.push({
  id: "net-vpc",
  track: "networking",
  order: 7,
  icon: "🏘️",
  level: 2,
  minutes: 12,
  title: { en: "VPC: your private network in the cloud", he: "VPC: הרשת הפרטית שלך בענן" },
  tldr: {
    en: "A VPC is your own isolated network; a subnet is 'public' only because its route table sends 0.0.0.0/0 to an Internet Gateway, while private subnets go out through a NAT Gateway (which quietly costs real money).",
    he: "VPC זו רשת מבודדת משלך; subnet הוא 'ציבורי' רק כי ה-route table שלו שולח את 0.0.0.0/0 ל-Internet Gateway, ו-subnets פרטיים יוצאים דרך NAT Gateway (שבשקט עולה כסף אמיתי)."
  },
  analogy: {
    en: "A VPC is a gated neighborhood. Subnets are streets; route tables are the street signs. The Internet Gateway is the main gate - houses on 'public streets' have a direct path to it. Houses on private streets can send mail out only through the neighborhood post office (NAT Gateway), which hides their address and charges per letter. Peering is a private road to the next neighborhood; a Transit Gateway is the regional highway interchange.",
    he: "VPC זו שכונה סגורה עם שער. Subnets הם רחובות; route tables הם השלטים. ה-Internet Gateway הוא השער הראשי - לבתים ב'רחובות ציבוריים' יש דרך ישירה אליו. בתים ברחובות פרטיים יכולים לשלוח דואר החוצה רק דרך הדואר השכונתי (NAT Gateway), שמסתיר את הכתובת שלהם וגובה על כל מכתב. Peering זו דרך פרטית לשכונה השכנה; Transit Gateway הוא מחלף הכבישים האזורי."
  },
  sections: [
    {
      h: { en: "Public vs private is just routing", he: "ציבורי מול פרטי זה רק routing" },
      body: {
        en: `<p>A <strong>VPC</strong> (AWS/GCP; Azure calls it a VNet) has a CIDR like <code>10.20.0.0/16</code>, split into <strong>subnets</strong>, each living in one Availability Zone. Every subnet is associated with a <strong>route table</strong>. That's the whole trick:</p>
<pre>Public subnet route table          Private subnet route table
10.20.0.0/16  local                10.20.0.0/16  local
0.0.0.0/0     igw-0abc             0.0.0.0/0     nat-0def   (NAT GW in public-a)</pre>
<p>"Public" = default route to an <strong>Internet Gateway (IGW)</strong>, and instances there can have public IPs. The IGW is free, horizontally scaled, and does 1:1 NAT between the public and private IP. "Private" = no route to the IGW, so nothing on the Internet can initiate a connection in, no matter what the Security Group says.</p>
<p>The <code>local</code> route is automatic and can't be removed: every subnet in a VPC can reach every other subnet by default. Isolation <em>inside</em> the VPC comes from Security Groups and NACLs, not routing.</p>`,
        he: `<p>ל-<strong>VPC</strong> (ב-AWS/GCP; ב-Azure קוראים לזה VNet) יש CIDR כמו <code>10.20.0.0/16</code>, שמחולק ל-<strong>subnets</strong>, וכל אחד חי ב-Availability Zone אחד. כל subnet משויך ל-<strong>route table</strong>. זה כל הטריק:</p>
<pre>Public subnet route table          Private subnet route table
10.20.0.0/16  local                10.20.0.0/16  local
0.0.0.0/0     igw-0abc             0.0.0.0/0     nat-0def   (NAT GW in public-a)</pre>
<p>"ציבורי" = default route ל-<strong>Internet Gateway (IGW)</strong>, ול-instances שם יכולים להיות IPs ציבוריים. ה-IGW חינמי, מתרחב אופקית ועושה NAT של 1:1 בין ה-IP הציבורי לפרטי. "פרטי" = אין route ל-IGW, אז שום דבר באינטרנט לא יכול ליזום חיבור פנימה, לא משנה מה כתוב ב-Security Group.</p>
<p>ה-route ה-<code>local</code> נוצר אוטומטית ואי אפשר למחוק אותו: כל subnet ב-VPC יכול להגיע לכל subnet אחר כברירת מחדל. בידוד <em>בתוך</em> ה-VPC מגיע מ-Security Groups ו-NACLs, לא מ-routing.</p>`
      }
    },
    {
      h: { en: "NAT Gateway and its bill", he: "NAT Gateway והחשבון שלו" },
      body: {
        en: `<p>Private instances still need outbound access: pulling Docker images, calling Stripe, installing packages. A <strong>NAT Gateway</strong> sits in a public subnet, rewrites the source IP to its Elastic IP, and tracks connections so replies come back. Inbound-initiated connections are impossible through it.</p>
<p>The cost surprise (AWS us-east-1 ballpark): <strong>~$0.045/hour per NAT GW (~$32/month)</strong> <em>plus</em> <strong>~$0.045 per GB processed</strong>. One per AZ for HA = ~$100/month before data. Then a service pulls 10 TB/month of images and S3 objects through it: +$450. Cross-AZ traffic to a NAT in another AZ adds ~$0.01/GB each way.</p>
<blockquote>⚠️ Production tip: the #1 NAT bill fix is <strong>VPC Gateway Endpoints for S3 and DynamoDB</strong> - free, and traffic to those services skips the NAT entirely. Add interface endpoints for ECR, and check VPC Flow Logs for the top talkers through your NAT. Teams regularly find NAT is their biggest networking line item.</blockquote>
<p>Alternatives: NAT instances (cheaper, you babysit them), IPv6 with an egress-only IGW (no NAT charge), or simply not routing big flows through NAT.</p>`,
        he: `<p>instances פרטיים עדיין צריכים גישה החוצה: למשוך Docker images, לקרוא ל-Stripe, להתקין חבילות. <strong>NAT Gateway</strong> יושב ב-subnet ציבורי, משכתב את ה-IP של המקור ל-Elastic IP שלו, ועוקב אחרי חיבורים כדי שהתשובות יחזרו. חיבורים שנוזמים מבחוץ פנימה - בלתי אפשריים דרכו.</p>
<p>ההפתעה בחשבון (בערך, AWS us-east-1): <strong>כ-$0.045 לשעה לכל NAT GW (כ-$32 לחודש)</strong> <em>ועוד</em> <strong>כ-$0.045 לכל GB שעובר</strong>. אחד לכל AZ בשביל HA = כ-$100 לחודש עוד לפני דאטה. ואז שירות מושך 10TB בחודש של images ואובייקטים מ-S3 דרכו: עוד $450. תעבורה בין AZs ל-NAT ב-AZ אחר מוסיפה כ-$0.01 ל-GB לכל כיוון.</p>
<blockquote>⚠️ טיפ לפרודקשן: התיקון מספר 1 לחשבון ה-NAT הוא <strong>VPC Gateway Endpoints ל-S3 ול-DynamoDB</strong> - חינם, והתעבורה לשירותים האלה עוקפת את ה-NAT לגמרי. תוסיפו interface endpoints ל-ECR, ותבדקו ב-VPC Flow Logs מי הכי מדבר דרך ה-NAT. צוותים מגלים שוב ושוב שה-NAT הוא שורת ה-networking הכי יקרה שלהם.</blockquote>
<p>חלופות: NAT instances (זול יותר, אבל אתם הבייביסיטר), IPv6 עם egress-only IGW (בלי חיוב NAT), או פשוט לא להעביר זרמים גדולים דרך NAT.</p>`
      }
    },
    {
      h: { en: "Connecting VPCs: peering vs Transit Gateway", he: "חיבור VPCs: peering מול Transit Gateway" },
      body: {
        en: `<p><strong>VPC peering</strong> is a private 1:1 link between two VPCs (even across accounts/regions). No bandwidth bottleneck, no hourly fee (you pay data transfer). But it's <strong>non-transitive</strong>: if A peers with B and B with C, A can't reach C through B. With 10 VPCs a full mesh needs 45 peerings and route entries everywhere.</p>
<p><strong>Transit Gateway</strong> (AWS; Azure Virtual WAN / hub VNets, GCP NCC) is a regional hub router: every VPC and VPN attaches once, and route tables on the hub decide who can talk to whom - so you can build "prod and dev both reach shared-services, but never each other". Cost: ~$0.05/hour per attachment + ~$0.02/GB processed.</p>
<p>Rule of thumb: 2-3 VPCs, peering. Many VPCs, multiple accounts, on-prem links, or a need for central inspection: Transit Gateway.</p>`,
        he: `<p><strong>VPC peering</strong> זה חיבור פרטי 1:1 בין שני VPCs (גם בין accounts ו-regions). אין צוואר בקבוק של bandwidth, אין תשלום שעתי (משלמים על data transfer). אבל הוא <strong>לא טרנזיטיבי</strong>: אם A מחובר ל-B ו-B ל-C, A לא יכול להגיע ל-C דרך B. עם 10 VPCs, full mesh דורש 45 peerings ו-routes בכל מקום.</p>
<p><strong>Transit Gateway</strong> (ב-AWS; ב-Azure זה Virtual WAN או hub VNets, ב-GCP זה NCC) הוא router מרכזי אזורי: כל VPC וכל VPN מתחברים פעם אחת, וה-route tables ב-hub מחליטים מי מדבר עם מי - כך אפשר לבנות "prod ו-dev מגיעים ל-shared-services, אבל אף פעם לא אחד לשני". עלות: כ-$0.05 לשעה לכל attachment + כ-$0.02 ל-GB.</p>
<p>כלל אצבע: 2-3 VPCs, peering. הרבה VPCs, כמה accounts, חיבורים ל-on-prem, או צורך ב-inspection מרכזי: Transit Gateway.</p>`
      }
    },
    {
      h: { en: "Hybrid links and private endpoints", he: "חיבורים היברידיים ו-private endpoints" },
      body: {
        en: `<p>To connect the office or a data center:</p>
<ul>
<li><strong>Site-to-Site VPN</strong>: IPsec tunnels over the Internet. Up in an hour, ~1.25 Gbps per tunnel on AWS, latency at the mercy of the Internet. Always configure both tunnels.</li>
<li><strong>Direct Connect</strong> (AWS) / ExpressRoute (Azure) / Interconnect (GCP): a dedicated physical circuit, 1-100 Gbps, predictable latency, cheaper per GB - but weeks to provision. Production setups often use VPN as the backup path.</li>
</ul>
<p><strong>Private endpoints</strong> let you reach services without touching the Internet:</p>
<ul>
<li><strong>Gateway endpoints</strong> (S3, DynamoDB): a route-table entry, free.</li>
<li><strong>Interface endpoints / PrivateLink</strong>: an ENI with a private IP in your subnet that fronts an AWS service (ECR, SQS, Secrets Manager) or a <em>partner's</em> service. One-way and works even with overlapping CIDRs, because consumers only see the endpoint IP. ~$0.01/hour per AZ + data.</li>
</ul>
<blockquote>💡 Real world: SaaS vendors (Snowflake, MongoDB Atlas, Datadog) offer PrivateLink so your traffic to them never leaves the AWS backbone - and security reviews get much shorter.</blockquote>`,
        he: `<p>כדי לחבר את המשרד או data center:</p>
<ul>
<li><strong>Site-to-Site VPN</strong>: tunnels של IPsec מעל האינטרנט. עולה תוך שעה, כ-1.25Gbps ל-tunnel ב-AWS, וה-latency בחסדי האינטרנט. תמיד להגדיר את שני ה-tunnels.</li>
<li><strong>Direct Connect</strong> (AWS) / ExpressRoute (Azure) / Interconnect (GCP): קו פיזי ייעודי, 1-100Gbps, latency צפוי, זול יותר ל-GB - אבל לוקח שבועות להקים. בפרודקשן הרבה פעמים ה-VPN משמש כמסלול גיבוי.</li>
</ul>
<p><strong>Private endpoints</strong> מאפשרים להגיע לשירותים בלי לגעת באינטרנט:</p>
<ul>
<li><strong>Gateway endpoints</strong> (S3, DynamoDB): רשומה ב-route table, חינם.</li>
<li><strong>Interface endpoints / PrivateLink</strong>: ENI עם IP פרטי ב-subnet שלך שעומד מול שירות של AWS (ECR, SQS, Secrets Manager) או שירות של <em>שותף</em>. חד-כיווני ועובד גם עם CIDRs חופפים, כי הצרכן רואה רק את ה-IP של ה-endpoint. כ-$0.01 לשעה ל-AZ + דאטה.</li>
</ul>
<blockquote>💡 מהשטח: ספקי SaaS (Snowflake, MongoDB Atlas, Datadog) מציעים PrivateLink כך שהתעבורה אליהם לא יוצאת מה-backbone של AWS - וסקירות האבטחה מתקצרות משמעותית.</blockquote>`
      }
    }
  ],
  diagram: `                       Internet
                          |
                   [ Internet Gateway ]
  VPC 10.20.0.0/16        |
  +-----------------------+------------------------+
  | public-a 10.20.0.0/24 |  public-b 10.20.1.0/24 |
  |  [ALB]  [NAT GW]      |   [ALB]  [NAT GW]      |   rt: 0.0.0.0/0 -> igw
  |-----------|-----------+-----------|------------|
  | private-a 10.20.32.0/19 | private-b 10.20.64.0/19 |
  |  [app] [app]           |  [app] [db-replica]     |   rt: 0.0.0.0/0 -> nat
  |   \\__ S3 gateway endpoint (free, skips NAT)     |
  +-------------------------------------------------+
        |  Transit Gateway  |---- other VPCs
        |                   |---- VPN / Direct Connect -> office`,
  handsOn: [
    { cmd: "aws ec2 describe-route-tables --filters Name=vpc-id,Values=$VPC_ID --query 'RouteTables[].{id:RouteTableId,routes:Routes[].[DestinationCidrBlock,GatewayId,NatGatewayId]}'", what: { en: "List route tables and see which ones point 0.0.0.0/0 at an igw (public) vs a nat (private).", he: "לרשום route tables ולראות מי מפנה את 0.0.0.0/0 ל-igw (ציבורי) ומי ל-nat (פרטי)." } },
    { cmd: "curl -s https://checkip.amazonaws.com", what: { en: "From a private instance: prints the NAT Gateway's Elastic IP - the address the outside world sees.", he: "מ-instance פרטי: מדפיס את ה-Elastic IP של ה-NAT Gateway - הכתובת שהעולם החיצוני רואה." } },
    { cmd: "aws ec2 create-vpc-endpoint --vpc-id $VPC_ID --service-name com.amazonaws.us-east-1.s3 --route-table-ids $PRIVATE_RT", what: { en: "Create a free S3 gateway endpoint so S3 traffic stops paying NAT processing fees.", he: "ליצור S3 gateway endpoint חינמי כדי שתעבורת S3 תפסיק לשלם עמלות עיבוד של NAT." } },
    { cmd: "aws cloudwatch get-metric-statistics --namespace AWS/NATGateway --metric-name BytesOutToDestination --dimensions Name=NatGatewayId,Value=$NAT_ID --start-time 2026-11-01T00:00:00Z --end-time 2026-11-12T00:00:00Z --period 86400 --statistics Sum", what: { en: "See how many bytes per day flow through a NAT Gateway - multiply by $0.045/GB to see the bill coming.", he: "לראות כמה בייטים ביום עוברים דרך NAT Gateway - להכפיל ב-$0.045 ל-GB ולראות את החשבון שמגיע." } }
  ],
  mnemonic: {
    en: "\"Public has a gate, private has a post office\": IGW for public subnets, NAT for private ones. And \"Peering doesn't pass the parcel\" - it's non-transitive.",
    he: "\"לציבורי יש שער, לפרטי יש סניף דואר\": IGW ל-subnets ציבוריים, NAT לפרטיים. ו-\"Peering לא מעביר חבילות הלאה\" - הוא לא טרנזיטיבי."
  },
  pitfalls: [
    { en: "Routing S3/ECR traffic through the NAT Gateway and paying per GB for it - add gateway/interface endpoints.", he: "להעביר תעבורת S3/ECR דרך ה-NAT Gateway ולשלם עליה לפי GB - תוסיפו gateway/interface endpoints." },
    { en: "A single NAT Gateway for all AZs: if its AZ fails, every private subnet loses outbound access (and you pay cross-AZ fees meanwhile).", he: "NAT Gateway אחד לכל ה-AZs: אם ה-AZ שלו נופל, כל ה-subnets הפרטיים מאבדים גישה החוצה (ובינתיים משלמים על cross-AZ)." },
    { en: "Expecting VPC peering to be transitive (A-B-C) - it isn't; use Transit Gateway for hub-and-spoke.", he: "לצפות ש-VPC peering יהיה טרנזיטיבי (A-B-C) - הוא לא; ל-hub-and-spoke משתמשים ב-Transit Gateway." },
    { en: "Putting databases in public subnets 'temporarily' with a public IP. Temporary infrastructure is the most permanent kind.", he: "לשים דאטהבייסים ב-subnets ציבוריים 'זמנית' עם IP ציבורי. תשתית זמנית היא הכי קבועה שיש." }
  ],
  interview: [
    {
      q: { en: "What makes a subnet public?", he: "מה הופך subnet לציבורי?" },
      a: { en: "Its route table has a route for 0.0.0.0/0 (or ::/0) to an Internet Gateway. Instances additionally need a public or Elastic IP and permissive Security Groups to be reachable. There's no 'public' checkbox on the subnet itself - the auto-assign public IP setting is a convenience, not what makes it public.", he: "ל-route table שלו יש route ל-0.0.0.0/0 (או ::/0) שמפנה ל-Internet Gateway. בנוסף, instances צריכים IP ציבורי או Elastic IP ו-Security Groups מתירים כדי שיהיה אפשר להגיע אליהם. אין צ'קבוקס 'ציבורי' על ה-subnet עצמו - ההגדרה של auto-assign public IP היא נוחות, לא מה שהופך אותו לציבורי." }
    },
    {
      q: { en: "Your NAT Gateway bill doubled. How do you investigate and reduce it?", he: "החשבון של ה-NAT Gateway הוכפל. איך תחקור ותוריד אותו?" },
      a: { en: "Enable VPC Flow Logs and aggregate bytes by source ENI and destination to find top talkers. Typical culprits: S3, ECR image pulls, CloudWatch/logging agents, cross-AZ paths. Fix with S3/DynamoDB gateway endpoints, interface endpoints for ECR and other AWS APIs, image caching, and one NAT per AZ with AZ-local routing.", he: "להפעיל VPC Flow Logs ולסכם bytes לפי ENI מקור ויעד כדי למצוא את מי שמדבר הכי הרבה. החשודים הרגילים: S3, משיכת images מ-ECR, סוכני CloudWatch/logging, מסלולים בין AZs. מתקנים עם gateway endpoints ל-S3/DynamoDB, interface endpoints ל-ECR ול-APIs אחרים של AWS, caching של images, ו-NAT לכל AZ עם routing מקומי ל-AZ." }
    }
  ],
  quiz: [
    {
      q: { en: "An EC2 instance in a private subnet needs to download packages from the Internet. What does its route table need?", he: "instance ב-subnet פרטי צריך להוריד חבילות מהאינטרנט. מה צריך להיות ב-route table שלו?" },
      options: [
        { en: "0.0.0.0/0 to the Internet Gateway", he: "0.0.0.0/0 ל-Internet Gateway" },
        { en: "0.0.0.0/0 to a NAT Gateway in a public subnet", he: "0.0.0.0/0 ל-NAT Gateway ב-subnet ציבורי" },
        { en: "Nothing - the local route covers it", he: "כלום - ה-route ה-local מכסה את זה" },
        { en: "A VPC peering connection to a public VPC", he: "חיבור VPC peering ל-VPC ציבורי" }
      ],
      answer: 1,
      explain: { en: "Routing to the IGW directly would make it a public subnet (and needs a public IP). The local route only covers the VPC CIDR. Peering doesn't provide Internet access.", he: "ניתוב ישיר ל-IGW היה הופך אותו ל-subnet ציבורי (וצריך IP ציבורי). ה-route ה-local מכסה רק את ה-CIDR של ה-VPC. Peering לא נותן גישה לאינטרנט." }
    },
    {
      q: { en: "VPC A peers with B, and B peers with C. Can A reach C?", he: "VPC A מחובר ב-peering ל-B, ו-B ל-C. האם A יכול להגיע ל-C?" },
      options: [
        { en: "Yes, automatically", he: "כן, אוטומטית" },
        { en: "Yes, if B has a NAT Gateway", he: "כן, אם יש ל-B NAT Gateway" },
        { en: "No - peering is non-transitive; peer A-C directly or use a Transit Gateway", he: "לא - peering לא טרנזיטיבי; צריך peering ישיר A-C או Transit Gateway" },
        { en: "Only for UDP traffic", he: "רק לתעבורת UDP" }
      ],
      answer: 2,
      explain: { en: "Peering never forwards traffic for a third VPC. Transit Gateway is the hub that provides transitive routing.", he: "Peering אף פעם לא מעביר תעבורה ל-VPC שלישי. Transit Gateway הוא ה-hub שנותן ניתוב טרנזיטיבי." }
    },
    {
      q: { en: "What's the cheapest way to cut NAT Gateway costs for heavy S3 traffic?", he: "מה הדרך הזולה ביותר להוריד עלויות NAT Gateway כשיש הרבה תעבורת S3?" },
      options: [
        { en: "An S3 gateway VPC endpoint", he: "S3 gateway VPC endpoint" },
        { en: "A second NAT Gateway", he: "NAT Gateway נוסף" },
        { en: "Direct Connect", he: "Direct Connect" },
        { en: "Moving S3 to a public subnet", he: "להעביר את S3 ל-subnet ציבורי" }
      ],
      answer: 0,
      explain: { en: "Gateway endpoints for S3/DynamoDB are free and bypass the NAT. A second NAT adds cost; Direct Connect is for on-prem; S3 doesn't live in your subnets.", he: "Gateway endpoints ל-S3/DynamoDB הם חינמיים ועוקפים את ה-NAT. NAT נוסף מוסיף עלות; Direct Connect הוא ל-on-prem; S3 לא יושב ב-subnets שלך." }
    },
    {
      q: { en: "A partner's VPC uses the same CIDR as yours, and you need to call one of their services privately. Best option?", he: "ל-VPC של שותף יש את אותו CIDR כמו שלך, וצריך לקרוא לשירות אחד שלו באופן פרטי. מה האפשרות הכי טובה?" },
      options: [
        { en: "VPC peering", he: "VPC peering" },
        { en: "Transit Gateway", he: "Transit Gateway" },
        { en: "Expose it on the Internet with an IP allowlist", he: "לחשוף אותו לאינטרנט עם allowlist של IPs" },
        { en: "PrivateLink (interface endpoint)", he: "PrivateLink (interface endpoint)" }
      ],
      answer: 3,
      explain: { en: "Peering and TGW can't route overlapping CIDRs. PrivateLink puts an endpoint IP from your own range in your subnet, so overlap doesn't matter.", he: "Peering ו-TGW לא יכולים לנתב CIDRs חופפים. PrivateLink שם ב-subnet שלך endpoint עם IP מהטווח שלך, אז החפיפה לא משנה." }
    }
  ],
  related: ["net-ip-cidr", "net-firewalls", "net-isolation", "cloud-iam-security"]
});

window.INFRA.lessons.push({
  id: "net-firewalls",
  track: "networking",
  order: 8,
  icon: "🧱",
  level: 2,
  minutes: 11,
  title: { en: "Firewalls: Security Groups, NACLs, WAF", he: "Firewalls: Security Groups, NACLs, WAF" },
  tldr: {
    en: "A stateful firewall remembers connections so replies flow back automatically; a stateless one judges every packet alone. Security Groups are stateful allow-lists, NACLs are stateless ordered rules, and a WAF inspects HTTP itself.",
    he: "Firewall שהוא stateful זוכר חיבורים כך שתשובות חוזרות אוטומטית; firewall שהוא stateless שופט כל packet לבד. Security Groups הם allow-lists שהם stateful, NACLs הם חוקים מסודרים ו-stateless, ו-WAF בודק את ה-HTTP עצמו."
  },
  analogy: {
    en: "A Security Group is a bouncer with a good memory: once he lets you out for a smoke, he lets you back in without checking the list. A NACL is a turnstile with a printed rulebook at the street entrance: it checks every single person, both directions, top rule first, and has no idea who left five minutes ago. A WAF is the security guard who actually opens your bag.",
    he: "Security Group הוא סלקטור עם זיכרון טוב: ברגע שהוא נתן לך לצאת לסיגריה, הוא מכניס אותך בחזרה בלי לבדוק ברשימה. NACL הוא קרוסלה בכניסה לרחוב עם חוברת חוקים מודפסת: הוא בודק כל אדם, בשני הכיוונים, מהחוק העליון למטה, ואין לו מושג מי יצא לפני חמש דקות. WAF הוא המאבטח שבאמת פותח לך את התיק."
  },
  sections: [
    {
      h: { en: "Stateful vs stateless", he: "Stateful מול stateless" },
      body: {
        en: `<p>When your server answers a request on port 443, the reply goes back to the client's <em>ephemeral</em> port (e.g. 51544). A <strong>stateful</strong> firewall keeps a connection-tracking table (5-tuple + state), so it knows that reply belongs to an allowed connection and lets it out automatically. You write rules only for who may <em>initiate</em>.</p>
<p>A <strong>stateless</strong> firewall has no memory: you must explicitly allow the return traffic too - typically "outbound TCP 1024-65535 to 0.0.0.0/0" for replies. Forget it and connections hang in a very confusing way: the SYN gets in, the SYN-ACK is dropped on the way out.</p>
<p>Stateful is easier and safer to write; stateless is cheaper at enormous scale and immune to connection-table exhaustion. Linux iptables/nftables with <code>conntrack</code>, AWS Security Groups, Azure NSGs and GCP firewall rules are stateful. AWS NACLs and classic router ACLs are stateless.</p>`,
        he: `<p>כשהשרת עונה לבקשה על port 443, התשובה חוזרת ל-port ה-<em>ephemeral</em> של הקליינט (למשל 51544). Firewall שהוא <strong>stateful</strong> מחזיק טבלת connection tracking (ה-5-tuple + מצב), אז הוא יודע שהתשובה שייכת לחיבור מאושר ומוציא אותה אוטומטית. כותבים חוקים רק למי מותר <em>ליזום</em>.</p>
<p>Firewall שהוא <strong>stateless</strong> בלי זיכרון: חייבים להתיר במפורש גם את התעבורה החוזרת - בדרך כלל "outbound TCP 1024-65535 ל-0.0.0.0/0" בשביל התשובות. שוכחים את זה, והחיבורים נתקעים בצורה מאוד מבלבלת: ה-SYN נכנס, ה-SYN-ACK נזרק בדרך החוצה.</p>
<p>Stateful קל ובטוח יותר לכתיבה; stateless זול יותר בסקייל עצום ולא חשוף למצב שבו טבלת החיבורים מתמלאת. iptables/nftables בלינוקס עם <code>conntrack</code>, AWS Security Groups, Azure NSGs וחוקי firewall ב-GCP הם stateful. NACLs ב-AWS ו-ACLs קלאסיים בראוטרים הם stateless.</p>`
      }
    },
    {
      h: { en: "Security Groups vs NACLs", he: "Security Groups מול NACLs" },
      body: {
        en: `<table>
<tr><th></th><th>Security Group</th><th>Network ACL</th></tr>
<tr><td>Attached to</td><td>ENI (instance, LB, RDS, Pod)</td><td>Subnet</td></tr>
<tr><td>State</td><td>Stateful</td><td>Stateless</td></tr>
<tr><td>Rules</td><td>Allow only</td><td>Allow and deny</td></tr>
<tr><td>Evaluation</td><td>All rules, union (any match allows)</td><td>Numbered, lowest first, <strong>first match wins</strong></td></tr>
<tr><td>Default</td><td>Deny all in, allow all out</td><td>Default NACL allows all; ends with <code>*</code> deny</td></tr>
<tr><td>Superpower</td><td>Reference other SGs as source</td><td>Explicitly block an IP/CIDR</td></tr>
</table>
<p>The SG superpower: instead of IPs, say "allow 5432 from <code>sg-app</code>". Any instance wearing <code>sg-app</code> gets in, no matter its IP - perfect for autoscaling. Typical chain: <code>sg-alb</code> allows 443 from 0.0.0.0/0, <code>sg-app</code> allows 8080 from <code>sg-alb</code>, <code>sg-db</code> allows 5432 from <code>sg-app</code>.</p>
<p>Use NACLs sparingly, as a coarse subnet guardrail ("the DB subnets never talk to the Internet") or to block a misbehaving CIDR, since SGs can't deny.</p>`,
        he: `<table>
<tr><th></th><th>Security Group</th><th>Network ACL</th></tr>
<tr><td>מחובר ל</td><td>ENI (instance, LB, RDS, Pod)</td><td>Subnet</td></tr>
<tr><td>State</td><td>Stateful</td><td>Stateless</td></tr>
<tr><td>חוקים</td><td>Allow בלבד</td><td>Allow ו-deny</td></tr>
<tr><td>הערכה</td><td>כל החוקים, איחוד (כל התאמה מתירה)</td><td>ממוספרים, מהנמוך לגבוה, <strong>ההתאמה הראשונה קובעת</strong></td></tr>
<tr><td>ברירת מחדל</td><td>חוסם הכל פנימה, מתיר הכל החוצה</td><td>ה-NACL הדיפולטי מתיר הכל; נגמר ב-deny <code>*</code></td></tr>
<tr><td>כוח-על</td><td>להפנות ל-SGs אחרים כ-source</td><td>לחסום במפורש IP/CIDR</td></tr>
</table>
<p>כוח-העל של SG: במקום IPs, אומרים "תתיר 5432 מ-<code>sg-app</code>". כל instance שלובש את <code>sg-app</code> נכנס, לא משנה מה ה-IP שלו - מושלם ל-autoscaling. שרשרת טיפוסית: <code>sg-alb</code> מתיר 443 מ-0.0.0.0/0, <code>sg-app</code> מתיר 8080 מ-<code>sg-alb</code>, <code>sg-db</code> מתיר 5432 מ-<code>sg-app</code>.</p>
<p>ב-NACLs משתמשים במשורה, כמעקה גס ברמת ה-subnet ("subnets של DB לעולם לא מדברים עם האינטרנט") או כדי לחסום CIDR שמתנהג רע, כי SG לא יודע לעשות deny.</p>`
      }
    },
    {
      h: { en: "Ordered rules, first match, default deny", he: "חוקים מסודרים, first match, default deny" },
      body: {
        en: `<p>Ordered firewalls (NACLs, iptables chains, most hardware firewalls, WAF rule groups) walk rules top to bottom and stop at the <strong>first match</strong>. Order is everything:</p>
<pre>Rule  Proto  Port   Source          Action
100   TCP    443    0.0.0.0/0       ALLOW
110   TCP    22     203.0.113.0/24  ALLOW     # office
120   TCP    22     0.0.0.0/0       DENY
 *    ALL    ALL    0.0.0.0/0       DENY      # default deny</pre>
<p>Want to block one abusive IP from 443? A DENY at rule 150 does nothing - rule 100 already allowed it. It must be numbered below 100 (e.g. 90). Leave gaps (100, 110, 120) so you can insert later.</p>
<p><strong>Default deny</strong> means anything not explicitly allowed is dropped. It's the only sane baseline: an "allow by default, block the bad stuff" list is always one forgotten port away from a breach. <strong>Ingress</strong> rules control what may come in; <strong>egress</strong> rules control what may go out - and egress filtering is what stops a compromised box from phoning home to a crypto-mining pool or exfiltrating data.</p>`,
        he: `<p>Firewalls מסודרים (NACLs, שרשראות של iptables, רוב ה-firewalls החומרתיים, rule groups ב-WAF) עוברים על החוקים מלמעלה למטה ועוצרים ב-<strong>התאמה הראשונה</strong>. הסדר הוא הכל:</p>
<pre>Rule  Proto  Port   Source          Action
100   TCP    443    0.0.0.0/0       ALLOW
110   TCP    22     203.0.113.0/24  ALLOW     # office
120   TCP    22     0.0.0.0/0       DENY
 *    ALL    ALL    0.0.0.0/0       DENY      # default deny</pre>
<p>רוצים לחסום IP מתעלל אחד מ-443? DENY בחוק 150 לא עושה כלום - חוק 100 כבר התיר אותו. הוא חייב להיות ממוספר מתחת ל-100 (למשל 90). משאירים רווחים (100, 110, 120) כדי שיהיה אפשר להכניס חוקים אחר כך.</p>
<p><strong>Default deny</strong> אומר שכל מה שלא הותר במפורש נזרק. זה הבסיס השפוי היחיד: רשימה של "מתירים הכל וחוסמים את הרע" תמיד נמצאת port אחד שנשכח לפני פריצה. חוקי <strong>ingress</strong> שולטים במה שנכנס; חוקי <strong>egress</strong> שולטים במה שיוצא - וסינון egress זה מה שעוצר מכונה פרוצה מלהתקשר הביתה ל-pool של כריית קריפטו או מלהוציא דאטה.</p>`
      }
    },
    {
      h: { en: "WAF and host firewalls", he: "WAF ו-firewalls על המכונה" },
      body: {
        en: `<p>A <strong>WAF (Web Application Firewall)</strong> works at L7: it parses HTTP and blocks SQL injection (<code>' OR 1=1--</code>), XSS, path traversal, bad bots, and rate-based floods. AWS WAF, Cloudflare and Azure Front Door ship managed rule sets (OWASP Top 10). Run new rules in <strong>count mode</strong> first: a WAF that blocks your own checkout form's JSON is a self-inflicted outage. A WAF is a safety net, not a substitute for parameterized queries.</p>
<p><strong>Host firewalls</strong> run in the Linux kernel (netfilter). iptables is the classic CLI, nftables its modern successor; ufw and firewalld are friendly wrappers. Kubernetes' kube-proxy and Docker write iptables rules too - which is why <code>iptables -L</code> on a k8s node is thousands of lines.</p>
<pre># allow established replies, SSH from office, HTTPS from anyone, drop the rest
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -p tcp --dport 22  -s 203.0.113.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -P INPUT DROP</pre>
<blockquote>⚠️ Production tip: setting <code>-P INPUT DROP</code> over SSH before allowing your own session is the classic way to lock yourself out of a server. Add the ESTABLISHED and SSH rules first, or use a "revert in 5 minutes unless confirmed" safety net.</blockquote>`,
        he: `<p><strong>WAF (Web Application Firewall)</strong> עובד ב-L7: הוא מפענח HTTP וחוסם SQL injection (<code>' OR 1=1--</code>), XSS, path traversal, בוטים רעים והצפות לפי קצב. AWS WAF, Cloudflare ו-Azure Front Door מגיעים עם managed rule sets (OWASP Top 10). חוקים חדשים מריצים קודם ב-<strong>count mode</strong>: WAF שחוסם את ה-JSON של טופס התשלום שלכם הוא השבתה שגרמתם לעצמכם. WAF הוא רשת ביטחון, לא תחליף ל-parameterized queries.</p>
<p><strong>Firewalls על המכונה</strong> רצים ב-kernel של לינוקס (netfilter). iptables הוא ה-CLI הקלאסי, nftables היורש המודרני; ufw ו-firewalld הם עטיפות ידידותיות. גם kube-proxy של Kubernetes ו-Docker כותבים חוקי iptables - ובגלל זה <code>iptables -L</code> על node של k8s זה אלפי שורות.</p>
<pre># allow established replies, SSH from office, HTTPS from anyone, drop the rest
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -p tcp --dport 22  -s 203.0.113.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -P INPUT DROP</pre>
<blockquote>⚠️ טיפ לפרודקשן: להגדיר <code>-P INPUT DROP</code> דרך SSH לפני שהתרתם את ה-session שלכם זו הדרך הקלאסית לנעול את עצמכם מחוץ לשרת. קודם מוסיפים את החוקים של ESTABLISHED ו-SSH, או משתמשים ברשת ביטחון של "revert בעוד 5 דקות אם לא אישרתי".</blockquote>`
      }
    }
  ],
  diagram: `  Internet
     |
  [ WAF ]  L7: blocks ' OR 1=1--, bad bots, floods
     |
  [ NACL on subnet ]  stateless, numbered, first match:
     |    90 DENY 198.51.100.7/32 | 100 ALLOW 443 | 140 ALLOW 1024-65535 out | * DENY
     |
  [ SG on ALB ]  443 from 0.0.0.0/0
     |
  [ SG on app ]  8080 from sg-alb        (stateful: replies auto-allowed)
     |
  [ SG on db  ]  5432 from sg-app
     |
  [ iptables/nftables on host ]  last line of defense`,
  handsOn: [
    { cmd: "sudo iptables -L INPUT -n -v --line-numbers", what: { en: "List host firewall rules in order with packet counters - counters tell you which rule is actually matching.", he: "להציג את חוקי ה-firewall של המכונה לפי הסדר עם מוני packets - המונים מגלים איזה חוק באמת תופס." } },
    { cmd: "sudo nft list ruleset", what: { en: "Show the full nftables ruleset (on modern distros iptables is often a front-end to nftables).", he: "להציג את כל ה-ruleset של nftables (בהפצות מודרניות iptables הוא הרבה פעמים חזית ל-nftables)." } },
    { cmd: "aws ec2 describe-security-groups --group-ids $SG_ID --query 'SecurityGroups[].IpPermissions'", what: { en: "Inspect a Security Group's ingress rules, including references to other SGs (UserIdGroupPairs).", he: "לבדוק את חוקי ה-ingress של Security Group, כולל הפניות ל-SGs אחרים (UserIdGroupPairs)." } },
    { cmd: "sudo conntrack -L | head; sudo sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max", what: { en: "Peek at the stateful connection-tracking table and how close it is to full (a full table drops new connections).", he: "להציץ בטבלת ה-connection tracking ולראות כמה היא קרובה להתמלא (טבלה מלאה זורקת חיבורים חדשים)." } }
  ],
  mnemonic: {
    en: "\"SG: Stateful Group. NACL: Never Assumes Connections Live.\" And for ordered rules: \"First match wins, everything else is a comment.\"",
    he: "\"SG: Stateful Group. NACL: Never Assumes Connections Live.\" ולחוקים מסודרים: \"ההתאמה הראשונה מנצחת, כל השאר זה הערות.\""
  },
  pitfalls: [
    { en: "Adding inbound NACL rules but forgetting outbound ephemeral ports (1024-65535) - SYNs arrive, replies die, everything times out.", he: "להוסיף חוקי NACL נכנסים ולשכוח את ה-ephemeral ports היוצאים (1024-65535) - ה-SYN מגיע, התשובות מתות, הכל נתקע ב-timeout." },
    { en: "Placing a DENY rule after a broader ALLOW in an ordered list - it never matches.", he: "לשים חוק DENY אחרי ALLOW רחב יותר ברשימה מסודרת - הוא אף פעם לא יתפוס." },
    { en: "Opening 22 or 3389 to 0.0.0.0/0 'just for debugging'. Bots scan the whole IPv4 space in minutes.", he: "לפתוח 22 או 3389 ל-0.0.0.0/0 'רק לדיבאג'. בוטים סורקים את כל מרחב ה-IPv4 תוך דקות." },
    { en: "Turning on a WAF managed rule set in block mode on day one and breaking legitimate requests (big JSON bodies, rich text fields).", he: "להדליק managed rule set ב-WAF ב-block mode כבר ביום הראשון ולשבור בקשות לגיטימיות (JSON גדולים, שדות rich text)." }
  ],
  interview: [
    {
      q: { en: "An instance's SG allows inbound 443, the subnet NACL allows inbound 443, but clients time out. What do you check?", he: "ה-SG של instance מתיר 443 נכנס, ה-NACL של ה-subnet מתיר 443 נכנס, אבל קליינטים נתקעים ב-timeout. מה תבדוק?" },
      a: { en: "NACLs are stateless, so check the outbound NACL rules allow return traffic to ephemeral ports 1024-65535. Then the route table (is there a path back via IGW/NAT?), the host firewall, and whether the app listens on 0.0.0.0 rather than 127.0.0.1. VPC Flow Logs show ACCEPT/REJECT per direction.", he: "NACLs הם stateless, אז לבדוק שחוקי ה-outbound ב-NACL מתירים תעבורה חוזרת ל-ephemeral ports 1024-65535. אחר כך את ה-route table (יש דרך חזרה דרך IGW/NAT?), את ה-firewall על המכונה, והאם האפליקציה מאזינה על 0.0.0.0 ולא על 127.0.0.1. VPC Flow Logs מראים ACCEPT/REJECT לכל כיוון." }
    },
    {
      q: { en: "Why reference security groups instead of IP ranges?", he: "למה להפנות ל-security groups במקום לטווחי IP?" },
      a: { en: "Instances come and go with autoscaling and get new IPs. 'Allow 5432 from sg-app' follows membership, not addresses, so it's always exactly the app tier - tighter than allowing a whole subnet CIDR and self-maintaining.", he: "Instances באים והולכים עם autoscaling ומקבלים IPs חדשים. 'תתיר 5432 מ-sg-app' עוקב אחרי חברות ולא אחרי כתובות, אז זה תמיד בדיוק שכבת האפליקציה - הדוק יותר מלהתיר CIDR של subnet שלם, ומתחזק את עצמו." }
    }
  ],
  quiz: [
    {
      q: { en: "NACL rules: 100 ALLOW TCP 443 from 0.0.0.0/0, 200 DENY TCP 443 from 198.51.100.7/32. Is 198.51.100.7 blocked on 443?", he: "חוקי NACL: 100 ALLOW TCP 443 מ-0.0.0.0/0, 200 DENY TCP 443 מ-198.51.100.7/32. האם 198.51.100.7 חסום על 443?" },
      options: [
        { en: "Yes, DENY always beats ALLOW", he: "כן, DENY תמיד מנצח ALLOW" },
        { en: "Yes, the more specific CIDR wins", he: "כן, ה-CIDR הספציפי יותר מנצח" },
        { en: "No, rule 100 matches first and allows it", he: "לא, חוק 100 תופס ראשון ומתיר" },
        { en: "It depends on the Security Group", he: "זה תלוי ב-Security Group" }
      ],
      answer: 2,
      explain: { en: "NACLs evaluate by rule number, lowest first, and stop at the first match. Specificity doesn't matter. Renumber the DENY below 100.", he: "NACLs נבדקים לפי מספר החוק, מהנמוך, ועוצרים בהתאמה הראשונה. ספציפיות לא משנה. צריך למספר את ה-DENY מתחת ל-100." }
    },
    {
      q: { en: "Your SG allows inbound 443 and has no outbound rules at all. Do responses reach clients?", he: "ה-SG שלך מתיר 443 נכנס ואין לו בכלל חוקי outbound. האם התשובות מגיעות לקליינטים?" },
      options: [
        { en: "Yes - SGs are stateful, replies to allowed connections are allowed", he: "כן - SGs הם stateful, תשובות לחיבורים מאושרים מותרות" },
        { en: "No - you must allow outbound 1024-65535", he: "לא - חייבים להתיר outbound 1024-65535" },
        { en: "Only if the NACL is also stateful", he: "רק אם גם ה-NACL הוא stateful" },
        { en: "Only for HTTP/1.1, not HTTP/2", he: "רק ל-HTTP/1.1, לא ל-HTTP/2" }
      ],
      answer: 0,
      explain: { en: "Connection tracking lets return traffic out regardless of egress rules. Egress rules only govern connections the instance initiates.", he: "ה-connection tracking מוציא את התעבורה החוזרת בלי קשר לחוקי egress. חוקי egress חלים רק על חיבורים שה-instance יוזם." }
    },
    {
      q: { en: "Which control can detect and block a SQL injection payload in a query string?", he: "איזה רכיב יכול לזהות ולחסום payload של SQL injection ב-query string?" },
      options: [
        { en: "Security Group", he: "Security Group" },
        { en: "Network ACL", he: "Network ACL" },
        { en: "Route table", he: "Route table" },
        { en: "WAF", he: "WAF" }
      ],
      answer: 3,
      explain: { en: "Only an L7 device that parses HTTP can see the query string. SGs and NACLs see IPs and ports; route tables only decide where packets go.", he: "רק רכיב L7 שמפענח HTTP יכול לראות את ה-query string. SGs ו-NACLs רואים IPs ו-ports; route tables רק מחליטים לאן packets הולכים." }
    }
  ],
  playground: "firewall",
  related: ["net-vpc", "net-isolation", "net-troubleshooting", "cloud-iam-security"]
});

window.INFRA.lessons.push({
  id: "net-isolation",
  track: "networking",
  order: 9,
  icon: "🛡️",
  level: 3,
  minutes: 12,
  title: { en: "Network isolation & zero trust", he: "בידוד רשתות ו-zero trust" },
  tldr: {
    en: "Split the network into tiers so a breach in one place can't reach everything, default-deny between them (NetworkPolicy, SGs), and stop trusting 'inside the network' - verify every request's identity instead.",
    he: "לחלק את הרשת לשכבות כדי שפריצה במקום אחד לא תגיע לכל מקום, default deny ביניהן (NetworkPolicy, SGs), ולהפסיק לסמוך על 'בתוך הרשת' - במקום זה לאמת את הזהות של כל בקשה."
  },
  analogy: {
    en: "Old-school security is a castle with a moat: hard outside, soft gooey inside - once you're over the wall you can walk into the treasury. Segmentation is a submarine with watertight compartments: one breach floods one room. Zero trust is a hospital where every door needs your badge, even if you've been inside all day.",
    he: "אבטחה בסגנון הישן היא טירה עם חפיר: קשה מבחוץ, רכה ודביקה מבפנים - ברגע שעברת את החומה אפשר להיכנס לאוצר. Segmentation זו צוללת עם תאים אטומים: פרצה אחת מציפה חדר אחד. Zero trust זה בית חולים שבו כל דלת דורשת כרטיס עובד, גם אם אתה בפנים כל היום."
  },
  sections: [
    {
      h: { en: "Segmentation, tiers and the DMZ", he: "Segmentation, שכבות וה-DMZ" },
      body: {
        en: `<p><strong>Network segmentation</strong> limits the <em>blast radius</em>: if an attacker pops your WordPress plugin, they should land in a box that can't reach the payroll database. The classic three-tier layout:</p>
<ul>
<li><strong>Web / edge tier</strong> (the <strong>DMZ</strong>, demilitarized zone): load balancers, reverse proxies. The only tier reachable from the Internet.</li>
<li><strong>App tier</strong>: accepts traffic only from the web tier, on app ports.</li>
<li><strong>Data tier</strong>: accepts only DB ports, only from the app tier. No Internet route at all, not even via NAT if you can help it.</li>
</ul>
<p>Each arrow is an explicit allow; everything else is denied. Separate environments harder still: prod and dev in different VPCs and ideally different cloud accounts, so a leaked dev credential can't even <em>see</em> prod.</p>
<p>Two directions matter. <strong>North-south</strong> traffic enters or leaves your environment (users to LB, app to Stripe). <strong>East-west</strong> traffic flows between your own services - and in microservices it's 80%+ of all traffic, the path attackers use for <em>lateral movement</em>. Perimeter firewalls only watch north-south.</p>`,
        he: `<p><strong>Network segmentation</strong> מגביל את ה-<em>blast radius</em>: אם תוקף פרץ דרך plugin של WordPress, הוא צריך לנחות בקופסה שלא יכולה להגיע לדאטהבייס של המשכורות. ה-layout הקלאסי של שלוש שכבות:</p>
<ul>
<li><strong>שכבת web / edge</strong> (ה-<strong>DMZ</strong>, אזור מפורז): load balancers, reverse proxies. השכבה היחידה שאפשר להגיע אליה מהאינטרנט.</li>
<li><strong>שכבת app</strong>: מקבלת תעבורה רק משכבת ה-web, על ה-ports של האפליקציה.</li>
<li><strong>שכבת data</strong>: מקבלת רק ports של DB, רק משכבת ה-app. בלי שום route לאינטרנט, אפילו לא דרך NAT אם אפשר.</li>
</ul>
<p>כל חץ הוא allow מפורש; כל השאר חסום. סביבות מפרידים עוד יותר: prod ו-dev ב-VPCs שונים, ועדיף ב-cloud accounts שונים, כך ש-credential שדלף מ-dev בכלל לא <em>רואה</em> את prod.</p>
<p>יש שני כיוונים. תעבורת <strong>north-south</strong> נכנסת או יוצאת מהסביבה (משתמשים ל-LB, אפליקציה ל-Stripe). תעבורת <strong>east-west</strong> זורמת בין השירותים שלכם - ובמיקרו-שירותים זה 80% ומעלה מכל התעבורה, והמסלול שתוקפים משתמשים בו ל-<em>lateral movement</em>. Firewalls של ה-perimeter רואים רק north-south.</p>`
      }
    },
    {
      h: { en: "Kubernetes NetworkPolicy: default deny", he: "Kubernetes NetworkPolicy: default deny" },
      body: {
        en: `<p>By default every Pod in a cluster can talk to every other Pod, in every namespace. A <strong>NetworkPolicy</strong> changes that - but only if your CNI enforces it (Calico, Cilium, and most managed options; plain flannel silently ignores policies).</p>
<pre>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: payments
spec:
  podSelector: {}          # every pod in the namespace
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-and-api
  namespace: payments
spec:
  podSelector:
    matchLabels: { app: payments-api }
  policyTypes: [Ingress, Egress]
  ingress:
  - from:
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: ingress-nginx }
    ports: [{ port: 8080, protocol: TCP }]
  egress:
  - to:
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: kube-system }
      podSelector:
        matchLabels: { k8s-app: kube-dns }
    ports: [{ port: 53, protocol: UDP }, { port: 53, protocol: TCP }]
  - to:
    - podSelector:
        matchLabels: { app: payments-db }
    ports: [{ port: 5432, protocol: TCP }]</pre>
<p>Policies are additive allow-lists: once any policy selects a Pod for a direction, only what's allowed passes.</p>
<blockquote>⚠️ Production tip: the first default-deny egress policy everyone ships breaks <strong>DNS</strong> - every Pod suddenly can't resolve anything. Always pair it with an explicit allow to kube-dns on UDP <em>and</em> TCP 53.</blockquote>`,
        he: `<p>כברירת מחדל כל Pod בקלאסטר יכול לדבר עם כל Pod אחר, בכל namespace. <strong>NetworkPolicy</strong> משנה את זה - אבל רק אם ה-CNI אוכף אותה (Calico, Cilium ורוב האפשרויות המנוהלות; flannel רגיל מתעלם מ-policies בשקט).</p>
<pre>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: payments
spec:
  podSelector: {}          # every pod in the namespace
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-and-api
  namespace: payments
spec:
  podSelector:
    matchLabels: { app: payments-api }
  policyTypes: [Ingress, Egress]
  ingress:
  - from:
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: ingress-nginx }
    ports: [{ port: 8080, protocol: TCP }]
  egress:
  - to:
    - namespaceSelector:
        matchLabels: { kubernetes.io/metadata.name: kube-system }
      podSelector:
        matchLabels: { k8s-app: kube-dns }
    ports: [{ port: 53, protocol: UDP }, { port: 53, protocol: TCP }]
  - to:
    - podSelector:
        matchLabels: { app: payments-db }
    ports: [{ port: 5432, protocol: TCP }]</pre>
<p>Policies הם allow-lists שמצטברים: ברגע שאיזושהי policy בוחרת Pod בכיוון מסוים, עובר רק מה שהותר.</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-default deny egress הראשון שכולם מעלים שובר את ה-<strong>DNS</strong> - פתאום אף Pod לא מצליח לעשות resolve לכלום. תמיד לצרף allow מפורש ל-kube-dns על UDP <em>וגם</em> TCP 53.</blockquote>`
      }
    },
    {
      h: { en: "Zero trust: never trust, always verify", he: "Zero trust: לעולם לא לסמוך, תמיד לאמת" },
      body: {
        en: `<p><strong>Zero trust</strong> says network location grants nothing. Being on the VPN or inside the VPC doesn't make a request trustworthy. Every request must prove:</p>
<ul>
<li><strong>Who</strong> is calling - a user identity (SSO/OIDC with MFA) or a workload identity (mTLS cert, SPIFFE ID, cloud IAM role).</li>
<li><strong>From what</strong> - device posture (managed laptop, patched OS) for humans.</li>
<li><strong>Whether it's allowed</strong> - a policy evaluated per request, least privilege, short-lived credentials.</li>
</ul>
<p>Google's BeyondCorp made this famous: employees reach internal apps over the Internet through an identity-aware proxy, no VPN. In service-to-service land, a mesh like Istio gives each workload an mTLS identity and policies like "only <code>orders</code> may call <code>payments</code> POST /charge".</p>
<p><strong>Microsegmentation</strong> is the network half of this: instead of three big tiers, policy per workload (per Pod, per VM) - Cilium, Calico, cloud SGs per service, or eBPF-based tools. Zero trust doesn't remove firewalls; it stops treating them as the <em>only</em> wall.</p>`,
        he: `<p><strong>Zero trust</strong> אומר שמיקום ברשת לא נותן כלום. להיות על ה-VPN או בתוך ה-VPC לא הופך בקשה לאמינה. כל בקשה חייבת להוכיח:</p>
<ul>
<li><strong>מי</strong> מתקשר - זהות של משתמש (SSO/OIDC עם MFA) או זהות של workload (תעודת mTLS, SPIFFE ID, IAM role בענן).</li>
<li><strong>ממה</strong> - מצב המכשיר (לפטופ מנוהל, OS מעודכן) לבני אדם.</li>
<li><strong>האם זה מותר</strong> - policy שנבדקת בכל בקשה, least privilege, credentials קצרי-חיים.</li>
</ul>
<p>BeyondCorp של Google הפך את זה למפורסם: עובדים ניגשים לאפליקציות פנימיות דרך האינטרנט עם identity-aware proxy, בלי VPN. בעולם של service-to-service, mesh כמו Istio נותן לכל workload זהות mTLS ו-policies כמו "רק <code>orders</code> רשאי לקרוא ל-<code>payments</code> POST /charge".</p>
<p><strong>Microsegmentation</strong> הוא החצי הרשתי של הסיפור: במקום שלוש שכבות גדולות, policy לכל workload (לכל Pod, לכל VM) - Cilium, Calico, SGs לכל שירות בענן, או כלים מבוססי eBPF. Zero trust לא מבטל firewalls; הוא מפסיק להתייחס אליהם כחומה <em>היחידה</em>.</p>`
      }
    },
    {
      h: { en: "Admin access: bastion vs SSM / IAP", he: "גישת אדמין: bastion מול SSM / IAP" },
      body: {
        en: `<p>The old way to reach private servers is a <strong>bastion (jump) host</strong>: one hardened VM in a public subnet with SSH open to the office IP, and you hop through it (<code>ssh -J bastion.example.com app-1</code>). Problems: an exposed port 22, SSH keys copied to laptops and never rotated, and weak audit trails.</p>
<p>The modern way has <strong>no inbound ports at all</strong>:</p>
<ul>
<li><strong>AWS SSM Session Manager</strong>: an agent on the instance dials <em>out</em> to SSM; you run <code>aws ssm start-session --target i-0abc123</code>. Access is IAM-controlled, sessions are logged to S3/CloudWatch, and it supports port forwarding to reach a private RDS.</li>
<li><strong>GCP IAP TCP forwarding</strong>, <strong>Azure Bastion</strong>, Teleport, Tailscale: same idea - identity-checked tunnels, short-lived access, full audit.</li>
</ul>
<blockquote>💡 Real world: a common security-audit finding is "SG allows 22 from 0.0.0.0/0 on the bastion". Moving to SSM lets you delete the bastion, the key pairs and the inbound rule in one sprint - and auditors love the session logs.</blockquote>`,
        he: `<p>הדרך הישנה להגיע לשרתים פרטיים היא <strong>bastion (jump) host</strong>: VM מוקשח אחד ב-subnet ציבורי עם SSH פתוח ל-IP של המשרד, ועוברים דרכו (<code>ssh -J bastion.example.com app-1</code>). הבעיות: port 22 חשוף, מפתחות SSH שמועתקים ללפטופים ואף פעם לא מתחלפים, ו-audit חלש.</p>
<p>הדרך המודרנית היא <strong>בלי שום port נכנס</strong>:</p>
<ul>
<li><strong>AWS SSM Session Manager</strong>: agent על ה-instance מתקשר <em>החוצה</em> ל-SSM; מריצים <code>aws ssm start-session --target i-0abc123</code>. הגישה נשלטת דרך IAM, ה-sessions נשמרים ב-S3/CloudWatch, ויש port forwarding כדי להגיע ל-RDS פרטי.</li>
<li><strong>GCP IAP TCP forwarding</strong>, <strong>Azure Bastion</strong>, Teleport, Tailscale: אותו רעיון - tunnels שבודקים זהות, גישה קצרת-טווח, audit מלא.</li>
</ul>
<blockquote>💡 מהשטח: ממצא נפוץ בביקורות אבטחה הוא "ה-SG מתיר 22 מ-0.0.0.0/0 על ה-bastion". מעבר ל-SSM מאפשר למחוק את ה-bastion, את ה-key pairs ואת החוק הנכנס בספרינט אחד - והמבקרים מתים על ה-session logs.</blockquote>`
      }
    }
  ],
  diagram: `   north-south (in/out)
        |
  +-----v------------ DMZ / web tier ----------------+
  |  [WAF/LB]  [reverse proxy]                        |
  +-----|--------------------------------------------+
        | allow 8080 only
  +-----v------------ app tier ----------------------+
  |  [orders] <--mTLS--> [payments]   east-west       |
  |      x--- denied ---> [admin-ui]  (NetworkPolicy) |
  +-----|--------------------------------------------+
        | allow 5432 only, from app tier only
  +-----v------------ data tier (no Internet route) --+
  |  [postgres]  [redis]                              |
  +--------------------------------------------------+
  admins: laptop --SSO+MFA--> SSM/IAP --> any tier (no open port 22)`,
  handsOn: [
    { cmd: "kubectl get networkpolicy -A", what: { en: "List all NetworkPolicies - an empty result means every Pod can reach every other Pod.", he: "להציג את כל ה-NetworkPolicies - תוצאה ריקה אומרת שכל Pod יכול להגיע לכל Pod אחר." } },
    { cmd: "kubectl run probe --rm -it --image=nicolaka/netshoot -n payments -- nc -zv -w 2 payments-db 5432", what: { en: "Spin up a throwaway debug Pod and test whether a connection is allowed or blocked by policy.", he: "להרים Pod דיבאג חד-פעמי ולבדוק אם חיבור מותר או חסום על ידי policy." } },
    { cmd: "aws ssm start-session --target i-0abc123 --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters host=mydb.cluster-xyz.rds.amazonaws.com,portNumber=5432,localPortNumber=15432", what: { en: "Reach a private RDS from your laptop through SSM - no bastion, no open inbound ports.", he: "להגיע ל-RDS פרטי מהלפטופ דרך SSM - בלי bastion, בלי ports נכנסים פתוחים." } },
    { cmd: "cilium hubble observe --namespace payments --verdict DROPPED", what: { en: "With Cilium/Hubble, watch live which flows are being dropped by policy.", he: "עם Cilium/Hubble, לראות בזמן אמת אילו flows נזרקים בגלל policy." } }
  ],
  mnemonic: {
    en: "\"Castle bad, submarine good, hospital best\": moat-only perimeter, watertight segments, badge at every door. And: \"North-south is the front door, east-west is the hallway - burglars love hallways.\"",
    he: "\"טירה רע, צוללת טוב, בית חולים הכי טוב\": רק חפיר, תאים אטומים, כרטיס בכל דלת. ו: \"North-south זו הדלת הראשית, east-west זה המסדרון - פורצים אוהבים מסדרונות.\""
  },
  pitfalls: [
    { en: "Applying default-deny egress without allowing DNS to kube-dns (UDP and TCP 53) - the entire namespace stops resolving names.", he: "להחיל default-deny egress בלי להתיר DNS ל-kube-dns (UDP ו-TCP 53) - כל ה-namespace מפסיק לעשות resolve." },
    { en: "Writing NetworkPolicies on a CNI that doesn't enforce them, giving a false sense of security. Test with a probe Pod.", he: "לכתוב NetworkPolicies על CNI שלא אוכף אותן, ולקבל תחושת ביטחון מזויפת. לבדוק עם Pod בדיקה." },
    { en: "Treating 'it's on the internal network' as authentication. Internal services still need authn/authz - SSRF and compromised Pods are internal too.", he: "להתייחס ל'זה ברשת הפנימית' כאל authentication. גם שירותים פנימיים צריכים authn/authz - SSRF ו-Pods פרוצים הם גם פנימיים." },
    { en: "Sharing one VPC/account between prod and dev 'to save money' - one leaked dev key becomes a prod incident.", he: "לחלוק VPC/account אחד בין prod ל-dev 'כדי לחסוך' - מפתח אחד שדלף מ-dev הופך לאירוע ב-prod." }
  ],
  interview: [
    {
      q: { en: "How would you lock down traffic in a Kubernetes namespace?", he: "איך תנעל את התעבורה ב-namespace של Kubernetes?" },
      a: { en: "Confirm the CNI enforces NetworkPolicy. Apply a default-deny for ingress and egress, then add explicit allows: DNS to kube-dns, ingress from the ingress controller namespace, egress to specific dependencies by label. Verify with probe Pods or Hubble/Calico flow logs, and roll out per namespace with observability first.", he: "לוודא שה-CNI אוכף NetworkPolicy. להחיל default deny ל-ingress ול-egress, ואז להוסיף allows מפורשים: DNS ל-kube-dns, ingress מה-namespace של ה-ingress controller, egress ל-dependencies ספציפיים לפי labels. לאמת עם Pods בדיקה או flow logs של Hubble/Calico, ולפרוס namespace אחרי namespace עם observability קודם." }
    },
    {
      q: { en: "What does zero trust mean in practice for a dev team?", he: "מה zero trust אומר בפועל לצוות פיתוח?" },
      a: { en: "Every service authenticates callers (mTLS or signed tokens) and authorizes per request, even internal ones. Humans access tools via SSO+MFA through an identity-aware proxy instead of a flat VPN. Credentials are short-lived and least-privilege, and the network still segments - but it's defense in depth, not the only check.", he: "כל שירות מאמת את מי שקורא לו (mTLS או טוקנים חתומים) ועושה authorization לכל בקשה, גם פנימית. בני אדם ניגשים לכלים עם SSO+MFA דרך identity-aware proxy במקום VPN שטוח. Credentials קצרי-חיים ועם least privilege, והרשת עדיין מחולקת - אבל זה defense in depth, לא הבדיקה היחידה." }
    }
  ],
  quiz: [
    {
      q: { en: "You applied a default-deny egress NetworkPolicy and now every Pod in the namespace fails with 'could not resolve host'. Fix?", he: "החלת NetworkPolicy של default deny ל-egress ועכשיו כל Pod ב-namespace נכשל עם 'could not resolve host'. מה התיקון?" },
      options: [
        { en: "Restart CoreDNS", he: "לעשות restart ל-CoreDNS" },
        { en: "Add an egress allow to kube-dns on UDP and TCP port 53", he: "להוסיף egress allow ל-kube-dns על UDP ו-TCP port 53" },
        { en: "Add an ingress allow from kube-dns", he: "להוסיף ingress allow מ-kube-dns" },
        { en: "Switch the Service type to LoadBalancer", he: "להחליף את סוג ה-Service ל-LoadBalancer" }
      ],
      answer: 1,
      explain: { en: "The Pods can't send DNS queries out. CoreDNS is fine; the DNS replies are return traffic, so no ingress rule is needed.", he: "ה-Pods לא יכולים לשלוח שאילתות DNS החוצה. CoreDNS תקין; התשובות של ה-DNS הן תעבורה חוזרת, אז לא צריך חוק ingress." }
    },
    {
      q: { en: "Traffic between your orders service and payments service is...", he: "תעבורה בין שירות ה-orders לשירות ה-payments היא..." },
      options: [
        { en: "North-south", he: "North-south" },
        { en: "DMZ traffic", he: "תעבורת DMZ" },
        { en: "East-west", he: "East-west" },
        { en: "Egress traffic to the Internet", he: "תעבורת egress לאינטרנט" }
      ],
      answer: 2,
      explain: { en: "Service-to-service inside your environment is east-west. North-south crosses the environment boundary.", he: "תעבורה בין שירותים בתוך הסביבה שלך היא east-west. North-south חוצה את גבול הסביבה." }
    },
    {
      q: { en: "Which approach gives admins shell access to private instances with zero inbound ports open?", he: "איזו גישה נותנת לאדמינים shell למכונות פרטיות עם אפס ports נכנסים פתוחים?" },
      options: [
        { en: "A bastion host with SSH restricted to the office IP", he: "Bastion host עם SSH מוגבל ל-IP של המשרד" },
        { en: "Opening port 22 on the private SG to the VPN CIDR", he: "לפתוח port 22 ב-SG הפרטי ל-CIDR של ה-VPN" },
        { en: "Giving each instance a public IP and using SSH keys", he: "לתת לכל instance IP ציבורי ולהשתמש במפתחות SSH" },
        { en: "AWS SSM Session Manager (or GCP IAP)", he: "AWS SSM Session Manager (או GCP IAP)" }
      ],
      answer: 3,
      explain: { en: "SSM's agent connects outbound to the service, so no inbound rule is needed, and access is IAM-controlled and logged. The other options all open port 22 somewhere.", he: "ה-agent של SSM מתחבר החוצה לשירות, אז לא צריך חוק נכנס, והגישה נשלטת ב-IAM ומתועדת. כל האפשרויות האחרות פותחות port 22 איפשהו." }
    }
  ],
  related: ["net-firewalls", "net-vpc", "k8s-namespaces-rbac", "cloud-iam-security"]
});

window.INFRA.lessons.push({
  id: "net-troubleshooting",
  track: "networking",
  order: 10,
  icon: "🩺",
  level: 2,
  minutes: 12,
  title: { en: "Network troubleshooting toolkit", he: "ארגז הכלים לדיבאג רשת" },
  tldr: {
    en: "Debug bottom-up and one hop at a time: does the name resolve? does the route exist? is the port open? does TLS succeed? does the app answer? Each question has its tool: dig, traceroute/mtr, nc, openssl/curl -v, curl -w.",
    he: "מדבגים מלמטה למעלה, hop אחרי hop: השם עושה resolve? יש route? ה-port פתוח? ה-TLS עובר? האפליקציה עונה? לכל שאלה יש כלי: dig, traceroute/mtr, nc, openssl/curl -v, curl -w."
  },
  analogy: {
    en: "Network debugging is a plumber tracing a leak: don't rip the kitchen apart because the tap is dry. Check the water main (DNS), the pipes (routing), the valve (port/firewall), the filter (TLS), and only then the tap (the app). Every check you skip is a wall you'll knock down for nothing.",
    he: "דיבאג רשת זה כמו אינסטלטור שמחפש נזילה: לא מפרקים את המטבח כי הברז יבש. בודקים את הצינור הראשי (DNS), את הצנרת (routing), את הברז הראשי (port/firewall), את המסנן (TLS), ורק אז את הברז עצמו (האפליקציה). כל בדיקה שמדלגים עליה זה קיר שתשברו לחינם."
  },
  sections: [
    {
      h: { en: "The bottom-up flow", he: "התהליך מלמטה למעלה" },
      body: {
        en: `<p>When "the service is down", ask in order, and don't move up until the current layer is proven:</p>
<ol>
<li><strong>Is it DNS?</strong> <code>dig +short api.example.com</code> - right IP? Same answer from inside the VPC/Pod as from your laptop?</li>
<li><strong>Is there a route?</strong> <code>ip route get 10.0.2.11</code>, <code>traceroute</code>/<code>mtr</code> - where does the path stop?</li>
<li><strong>Is the port open?</strong> <code>nc -zv api.example.com 443</code> - succeeded, refused, or timed out?</li>
<li><strong>Is TLS OK?</strong> <code>openssl s_client -connect host:443 -servername host</code> - valid chain, right hostname, not expired?</li>
<li><strong>Is the app answering?</strong> <code>curl -v</code> - status code, headers, body, and how long each phase took.</li>
</ol>
<p>Also note <em>where</em> you test from. "Works from my laptop, fails from the Pod" points at in-cluster DNS, NetworkPolicy or egress rules; "fails everywhere" points at the service or its LB.</p>
<blockquote>💡 Real world: the error text tells you the layer. <em>Could not resolve host</em> = DNS. <em>Connection timed out</em> = route/firewall dropping. <em>Connection refused</em> = host up, nothing listening. <em>SSL certificate problem</em> = TLS. <em>HTTP 502/503/504</em> = you got all the way to a proxy, the problem is behind it.</blockquote>`,
        he: `<p>כש"השירות למטה", שואלים לפי הסדר, ולא עולים שכבה עד שהשכבה הנוכחית הוכחה:</p>
<ol>
<li><strong>זה DNS?</strong> <code>dig +short api.example.com</code> - ה-IP הנכון? אותה תשובה מתוך ה-VPC/Pod ומהלפטופ?</li>
<li><strong>יש route?</strong> <code>ip route get 10.0.2.11</code>, <code>traceroute</code>/<code>mtr</code> - איפה המסלול נעצר?</li>
<li><strong>ה-port פתוח?</strong> <code>nc -zv api.example.com 443</code> - הצליח, refused, או timeout?</li>
<li><strong>ה-TLS תקין?</strong> <code>openssl s_client -connect host:443 -servername host</code> - שרשרת תקינה, hostname נכון, לא פג?</li>
<li><strong>האפליקציה עונה?</strong> <code>curl -v</code> - status code, headers, body, וכמה זמן לקח כל שלב.</li>
</ol>
<p>שימו לב גם <em>מאיפה</em> בודקים. "עובד מהלפטופ, נכשל מה-Pod" מצביע על DNS בתוך הקלאסטר, NetworkPolicy או חוקי egress; "נכשל מכל מקום" מצביע על השירות או ה-LB שלו.</p>
<blockquote>💡 מהשטח: טקסט השגיאה אומר לכם את השכבה. <em>Could not resolve host</em> = DNS. <em>Connection timed out</em> = route/firewall שזורק. <em>Connection refused</em> = המכונה למעלה, אף אחד לא מאזין. <em>SSL certificate problem</em> = TLS. <em>HTTP 502/503/504</em> = הגעתם עד proxy, הבעיה מאחוריו.</blockquote>`
      }
    },
    {
      h: { en: "ping, traceroute and mtr", he: "ping, traceroute ו-mtr" },
      body: {
        en: `<p><strong>ping</strong> sends ICMP echo requests: it measures RTT and packet loss. <code>64 bytes from 10.0.2.11: icmp_seq=1 ttl=63 time=0.41 ms</code>. But cloud SGs often block ICMP, so a failing ping proves nothing about TCP 443.</p>
<p><strong>traceroute</strong> sends packets with TTL=1, 2, 3... Each router that decrements TTL to zero replies "time exceeded", revealing itself. You see each hop and its latency. Lines of <code>* * *</code> just mean that hop doesn't answer - not necessarily a problem if later hops respond. <code>traceroute -T -p 443 host</code> uses TCP SYNs, which pass firewalls that block ICMP/UDP.</p>
<p><strong>mtr</strong> combines both continuously, with per-hop loss %. Key reading skill: loss at a middle hop that does <em>not</em> continue to the final hop is just a router rate-limiting ICMP replies - ignore it. Loss that starts at hop N and persists to the end is real.</p>
<pre>$ mtr -rwc 50 api.example.com
HOST                    Loss%  Snt  Last   Avg  Best  Wrst
1. 192.168.1.1           0.0%   50   1.1   1.3   0.9   3.2
2. 10.200.0.1            0.0%   50   8.4   9.0   7.9  15.1
3. ae-12.isp.net        40.0%   50  11.2  11.0  10.1  13.4   &lt;- ICMP rate limit, ignore
4. edge.cdn.net          0.0%   50  12.0  12.3  11.5  14.0
5. api.example.com       0.0%   50  12.4  12.6  11.9  15.2</pre>`,
        he: `<p><strong>ping</strong> שולח ICMP echo requests: הוא מודד RTT ו-packet loss. <code>64 bytes from 10.0.2.11: icmp_seq=1 ttl=63 time=0.41 ms</code>. אבל SGs בענן חוסמים הרבה פעמים ICMP, אז ping שנכשל לא מוכיח כלום לגבי TCP 443.</p>
<p><strong>traceroute</strong> שולח packets עם TTL=1, 2, 3... כל router שמוריד את ה-TTL לאפס עונה "time exceeded" וחושף את עצמו. רואים כל hop וה-latency שלו. שורות של <code>* * *</code> אומרות רק שה-hop הזה לא עונה - לא בהכרח בעיה אם ה-hops הבאים עונים. <code>traceroute -T -p 443 host</code> משתמש ב-TCP SYNs, שעוברים firewalls שחוסמים ICMP/UDP.</p>
<p><strong>mtr</strong> משלב את שניהם ברציפות, עם אחוז loss לכל hop. מיומנות הקריאה החשובה: loss ב-hop באמצע ש<em>לא</em> ממשיך עד ה-hop האחרון זה סתם router שמגביל תשובות ICMP - להתעלם. loss שמתחיל ב-hop N ונמשך עד הסוף הוא אמיתי.</p>
<pre>$ mtr -rwc 50 api.example.com
HOST                    Loss%  Snt  Last   Avg  Best  Wrst
1. 192.168.1.1           0.0%   50   1.1   1.3   0.9   3.2
2. 10.200.0.1            0.0%   50   8.4   9.0   7.9  15.1
3. ae-12.isp.net        40.0%   50  11.2  11.0  10.1  13.4   &lt;- ICMP rate limit, ignore
4. edge.cdn.net          0.0%   50  12.0  12.3  11.5  14.0
5. api.example.com       0.0%   50  12.4  12.6  11.9  15.2</pre>`
      }
    },
    {
      h: { en: "curl -v and timing with -w", he: "curl -v ומדידת זמנים עם -w" },
      body: {
        en: `<p><code>curl -v</code> narrates everything: resolved IP, TCP connect, TLS version and cert, request headers (<code>&gt;</code>), response headers (<code>&lt;</code>). Add <code>--resolve api.example.com:443:10.0.2.11</code> to hit a specific backend while keeping the right Host/SNI - perfect for testing one server behind an LB.</p>
<p>For "it's slow", break down where the time goes:</p>
<pre>curl -o /dev/null -s -w 'dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\n' https://api.example.com/health

dns:0.004 tcp:0.135 tls:0.270 ttfb:2.910 total:2.915</pre>
<p>The values are cumulative from the start. Reading this one: DNS fast (4 ms), TCP took 131 ms (one RTT to a far region), TLS another 135 ms (one more RTT, TLS 1.3), then <strong>2.6 s waiting for the first byte</strong> - the server is slow, not the network. If <code>dns</code> were 5 s, you'd look at resolvers (a 5 s value smells like a UDP timeout and retry). If <code>tcp</code> were huge, look at routing, distance or SYN drops.</p>`,
        he: `<p><code>curl -v</code> מספר הכל: ה-IP שהתקבל, חיבור ה-TCP, גרסת ה-TLS והתעודה, ה-headers של הבקשה (<code>&gt;</code>) ושל התשובה (<code>&lt;</code>). הוסיפו <code>--resolve api.example.com:443:10.0.2.11</code> כדי לפנות ל-backend ספציפי ועדיין לשמור Host/SNI נכונים - מושלם לבדיקת שרת בודד מאחורי LB.</p>
<p>כשמשהו "איטי", מפרקים לאן הזמן הולך:</p>
<pre>curl -o /dev/null -s -w 'dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\n' https://api.example.com/health

dns:0.004 tcp:0.135 tls:0.270 ttfb:2.910 total:2.915</pre>
<p>הערכים מצטברים מההתחלה. קריאה של הדוגמה: DNS מהיר (4ms), TCP לקח 131ms (RTT אחד ל-region רחוק), TLS עוד 135ms (עוד RTT, TLS 1.3), ואז <strong>2.6 שניות של המתנה לבייט הראשון</strong> - השרת איטי, לא הרשת. אם <code>dns</code> היה 5 שניות, הייתם בודקים את ה-resolvers (5 שניות מריח כמו timeout של UDP ו-retry). אם <code>tcp</code> היה ענק, בודקים routing, מרחק או SYNs שנזרקים.</p>`
      }
    },
    {
      h: { en: "nc, ss and tcpdump", he: "nc, ss ו-tcpdump" },
      body: {
        en: `<p><strong>nc (netcat)</strong> is the port-check hammer: <code>nc -zv -w 3 db.internal 5432</code>. "succeeded" = TCP open; "refused" = host up, nothing listening; hangs until timeout = something is dropping packets. On minimal images without nc, <code>timeout 3 bash -c '&lt;/dev/tcp/db.internal/5432' &amp;&amp; echo open</code> works, and old-school <code>telnet host 5432</code> too.</p>
<p><strong>ss</strong> (replaces netstat) answers "what is listening here?": <code>ss -tlnp</code> lists TCP listeners with their process. The classic find: <code>127.0.0.1:8080</code> - the app only listens on localhost, so nothing outside the box (or Pod) can reach it. You want <code>0.0.0.0:8080</code> or <code>*:8080</code>. <code>ss -s</code> summarizes states; thousands of <code>TIME-WAIT</code> or <code>CLOSE-WAIT</code> hint at connection churn or a leak.</p>
<p><strong>tcpdump</strong> is ground truth - what actually hit the wire: <code>sudo tcpdump -i any -nn host 10.0.2.11 and port 5432</code>. SYNs going out with no SYN-ACK back = dropped upstream. SYN in, RST out = no listener. Save with <code>-w cap.pcap</code> and open in Wireshark for the deep dive.</p>
<blockquote>⚠️ Production tip: in Kubernetes, debug from the right network namespace. <code>kubectl debug -it pod/api-7d9 --image=nicolaka/netshoot --target=api</code> attaches a container with all these tools to the Pod's own network stack - no need to bake curl into production images.</blockquote>`,
        he: `<p><strong>nc (netcat)</strong> הוא הפטיש לבדיקת ports: <code>nc -zv -w 3 db.internal 5432</code>. "succeeded" = TCP פתוח; "refused" = המכונה למעלה, אף אחד לא מאזין; נתקע עד timeout = משהו זורק packets. ב-images מינימליים בלי nc, <code>timeout 3 bash -c '&lt;/dev/tcp/db.internal/5432' &amp;&amp; echo open</code> עובד, וגם <code>telnet host 5432</code> של פעם.</p>
<p><strong>ss</strong> (המחליף של netstat) עונה על "מי מאזין פה?": <code>ss -tlnp</code> מציג TCP listeners עם התהליך שלהם. המציאה הקלאסית: <code>127.0.0.1:8080</code> - האפליקציה מאזינה רק על localhost, אז שום דבר מחוץ למכונה (או ל-Pod) לא יכול להגיע אליה. רוצים <code>0.0.0.0:8080</code> או <code>*:8080</code>. <code>ss -s</code> מסכם מצבים; אלפי <code>TIME-WAIT</code> או <code>CLOSE-WAIT</code> רומזים על churn של חיבורים או דליפה.</p>
<p><strong>tcpdump</strong> הוא האמת המוחלטת - מה באמת עבר על החוט: <code>sudo tcpdump -i any -nn host 10.0.2.11 and port 5432</code>. SYNs יוצאים בלי SYN-ACK חוזר = נזרק בדרך. SYN נכנס, RST יוצא = אין מאזין. שומרים עם <code>-w cap.pcap</code> ופותחים ב-Wireshark לצלילה עמוקה.</p>
<blockquote>⚠️ טיפ לפרודקשן: ב-Kubernetes, מדבגים מה-network namespace הנכון. <code>kubectl debug -it pod/api-7d9 --image=nicolaka/netshoot --target=api</code> מצמיד container עם כל הכלים האלה ל-network stack של ה-Pod עצמו - בלי לאפות curl לתוך images של פרודקשן.</blockquote>`
      }
    }
  ],
  diagram: `  "It's broken" - climb the ladder, stop at the first failing rung:

  [5] App answers?   curl -v / curl -w timings     -> 5xx, slow TTFB
  [4] TLS OK?        openssl s_client -servername  -> chain, expiry, SNI
  [3] Port open?     nc -zv host port / ss -tlnp   -> refused vs timeout
  [2] Route exists?  ip route get / mtr / traceroute -> where it stops
  [1] DNS right?     dig +short / dig @resolver    -> wrong/no IP
  [0] Ground truth:  tcpdump -i any -nn port X     -> what really hit the wire`,
  handsOn: [
    { cmd: "curl -o /dev/null -s -w 'dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\\n' https://example.com", what: { en: "Break a request's latency into DNS, TCP, TLS, server think-time and total.", he: "לפרק את ה-latency של בקשה ל-DNS, TCP, TLS, זמן החשיבה של השרת והסך הכל." } },
    { cmd: "nc -zv -w 3 example.com 443", what: { en: "Check if a TCP port is reachable and distinguish refused from timed out.", he: "לבדוק אם port של TCP זמין ולהבדיל בין refused ל-timeout." } },
    { cmd: "mtr -rwc 20 example.com", what: { en: "Get a 20-cycle report of every hop's loss and latency to the destination.", he: "לקבל דוח של 20 סבבים עם loss ו-latency לכל hop עד היעד." } },
    { cmd: "ss -tlnp", what: { en: "List listening TCP sockets with their processes - spot apps bound to 127.0.0.1 only.", he: "להציג sockets של TCP שמאזינים עם התהליכים שלהם - לזהות אפליקציות שמאזינות רק על 127.0.0.1." } },
    { cmd: "sudo tcpdump -i any -nn -c 20 port 53", what: { en: "Capture 20 DNS packets and see exactly which resolver your queries go to and what comes back.", he: "ללכוד 20 packets של DNS ולראות בדיוק לאיזה resolver השאילתות הולכות ומה חוזר." } }
  ],
  mnemonic: {
    en: "\"Do Robots Pass Tests Always?\" - DNS, Route, Port, TLS, App. Climb in that order and stop at the first 'no'.",
    he: "\"Do Robots Pass Tests Always?\" - DNS, Route, Port, TLS, App. עולים בסדר הזה ועוצרים ב'לא' הראשון."
  },
  pitfalls: [
    { en: "Declaring 'the network is down' because ping fails, when ICMP is simply blocked. Test the real port.", he: "להכריז ש'הרשת למטה' כי ping נכשל, כש-ICMP פשוט חסום. בודקים את ה-port האמיתי." },
    { en: "Reading mtr loss at an intermediate hop as the problem - if it doesn't persist to the last hop, it's ICMP rate limiting.", he: "לקרוא loss ב-hop באמצע ב-mtr כאילו זו הבעיה - אם הוא לא נמשך עד ה-hop האחרון, זה rate limiting של ICMP." },
    { en: "Testing from your laptop when the failing client is a Pod: different DNS, different routes, different firewall rules.", he: "לבדוק מהלפטופ כשהקליינט שנכשל הוא Pod: DNS אחר, routes אחרים, חוקי firewall אחרים." },
    { en: "An app listening on 127.0.0.1 inside a container - works with curl inside, unreachable from everywhere else.", he: "אפליקציה שמאזינה על 127.0.0.1 בתוך container - עובד עם curl מבפנים, לא נגיש מכל מקום אחר." }
  ],
  interview: [
    {
      q: { en: "A service in Kubernetes can't reach an external API. Walk through your debugging.", he: "שירות ב-Kubernetes לא מצליח להגיע ל-API חיצוני. תעבור על הדיבאג שלך." },
      a: { en: "Exec or kubectl debug into the Pod's network namespace. dig the hostname (CoreDNS, ndots, egress policy to DNS). nc -zv to the IP:443 - timeout suggests NetworkPolicy, SG or NAT/route issues; refused is unusual for a public API. Then curl -v for TLS (corporate CA, SNI) and HTTP status. Compare against the same commands from the node, and check the NAT Gateway and egress allowlists (the partner may allowlist only your NAT's IP).", he: "להיכנס עם exec או kubectl debug ל-network namespace של ה-Pod. dig ל-hostname (CoreDNS, ndots, egress policy ל-DNS). nc -zv ל-IP:443 - timeout מרמז על NetworkPolicy, SG או בעיית NAT/route; refused לא סביר ל-API ציבורי. אחר כך curl -v בשביל TLS (CA ארגוני, SNI) וה-status של HTTP. להשוות לאותן פקודות מה-node, ולבדוק את ה-NAT Gateway ו-allowlists של egress (השותף אולי מתיר רק את ה-IP של ה-NAT שלכם)." }
    },
    {
      q: { en: "Users say the API is slow. How do you tell network slowness from app slowness?", he: "משתמשים אומרים שה-API איטי. איך מבדילים בין איטיות רשת לאיטיות של האפליקציה?" },
      a: { en: "curl -w timings from a client location: DNS, connect and TLS times reflect network/distance, while time_starttransfer minus time_appconnect is server processing. Compare with the app's own request-duration metrics or traces: if the server says 50 ms but clients see 2 s, look at the network, LB queueing or client side.", he: "מדידות curl -w ממיקום של קליינט: זמני DNS, connect ו-TLS משקפים רשת ומרחק, ו-time_starttransfer פחות time_appconnect הוא זמן העיבוד בשרת. להשוות למטריקות request duration או traces של האפליקציה: אם השרת אומר 50ms והקליינטים רואים 2 שניות, מסתכלים על הרשת, תורים ב-LB או צד הקליינט." }
    }
  ],
  quiz: [
    {
      q: { en: "nc -zv db.internal 5432 hangs for 30 seconds then times out. Most likely cause?", he: "nc -zv db.internal 5432 נתקע 30 שניות ואז timeout. מה הסיבה הסבירה?" },
      options: [
        { en: "Postgres isn't running on the host", he: "Postgres לא רץ על המכונה" },
        { en: "A firewall/Security Group or missing route is dropping the packets", he: "Firewall/Security Group או route חסר זורקים את ה-packets" },
        { en: "The TLS certificate is invalid", he: "תעודת ה-TLS לא תקינה" },
        { en: "The database password is wrong", he: "הסיסמה לדאטהבייס שגויה" }
      ],
      answer: 1,
      explain: { en: "A stopped Postgres on a reachable host gives an immediate 'refused'. TLS and passwords only matter after TCP connects. Silence means drops.", he: "Postgres שלא רץ על מכונה זמינה נותן 'refused' מיידי. TLS וסיסמאות רלוונטיים רק אחרי שה-TCP התחבר. שקט אומר זריקה." }
    },
    {
      q: { en: "curl -w shows dns:0.003 tcp:0.020 tls:0.045 ttfb:3.100. Where's the problem?", he: "curl -w מראה dns:0.003 tcp:0.020 tls:0.045 ttfb:3.100. איפה הבעיה?" },
      options: [
        { en: "DNS resolution", he: "DNS resolution" },
        { en: "Network latency to the server", he: "Latency ברשת לשרת" },
        { en: "The TLS handshake", he: "ה-TLS handshake" },
        { en: "Server-side processing (or what's behind it)", he: "העיבוד בצד השרת (או מה שמאחוריו)" }
      ],
      answer: 3,
      explain: { en: "Everything up to TLS completed in 45 ms; the remaining ~3 s is waiting for the first byte - the app, its DB, or an upstream it calls.", he: "כל מה שעד ה-TLS הסתיים ב-45ms; כ-3 השניות הנותרות הן המתנה לבייט הראשון - האפליקציה, ה-DB שלה, או upstream שהיא קוראת לו." }
    },
    {
      q: { en: "ss -tlnp in a container shows the app listening on 127.0.0.1:8080. What happens when the Service sends traffic to the Pod?", he: "ss -tlnp ב-container מראה שהאפליקציה מאזינה על 127.0.0.1:8080. מה קורה כשה-Service שולח תעבורה ל-Pod?" },
      options: [
        { en: "Connection refused - nothing listens on the Pod IP", he: "Connection refused - אף אחד לא מאזין על ה-IP של ה-Pod" },
        { en: "It works, localhost is the Pod", he: "זה עובד, localhost זה ה-Pod" },
        { en: "A TLS error", he: "שגיאת TLS" },
        { en: "A DNS NXDOMAIN", he: "DNS NXDOMAIN" }
      ],
      answer: 0,
      explain: { en: "Traffic arrives at the Pod IP (e.g. 10.244.1.7), and no socket is bound there, so the kernel replies RST. Bind to 0.0.0.0.", he: "התעבורה מגיעה ל-IP של ה-Pod (למשל 10.244.1.7), ואין שם socket מאזין, אז ה-kernel עונה RST. צריך להאזין על 0.0.0.0." }
    },
    {
      q: { en: "mtr shows 60% loss at hop 4 but 0% at hops 5-8 including the destination. What do you conclude?", he: "mtr מראה 60% loss ב-hop 4 אבל 0% ב-hops 5-8 כולל היעד. מה המסקנה?" },
      options: [
        { en: "Hop 4 is dropping 60% of your traffic", he: "Hop 4 זורק 60% מהתעבורה שלך" },
        { en: "The destination is overloaded", he: "היעד בעומס יתר" },
        { en: "Hop 4 rate-limits ICMP replies; there's no real loss", he: "Hop 4 מגביל תשובות ICMP; אין loss אמיתי" },
        { en: "DNS is failing intermittently", he: "DNS נכשל לסירוגין" }
      ],
      answer: 2,
      explain: { en: "Real loss at hop 4 would show at every later hop too. Routers deprioritize generating ICMP replies, which looks like loss only at that hop.", he: "loss אמיתי ב-hop 4 היה מופיע גם בכל ה-hops שאחריו. Routers נותנים עדיפות נמוכה לייצור תשובות ICMP, וזה נראה כמו loss רק ב-hop הזה." }
    }
  ],
  playground: "terminal",
  related: ["net-dns", "net-osi-tcpip", "net-firewalls", "net-http-tls"]
});

// ------------------------------------------------------------
// Glossary
// ------------------------------------------------------------
window.INFRA.glossary.push({ term: "OSI model", track: "networking", def: { en: "7-layer reference model (Physical to Application) used mainly as shared vocabulary: L2, L3, L4, L7.", he: "מודל ייחוס של 7 שכבות (מ-Physical עד Application) שמשמש בעיקר כשפה משותפת: L2, L3, L4, L7." }, lesson: "net-osi-tcpip" });
window.INFRA.glossary.push({ term: "TCP", track: "networking", def: { en: "Connection-oriented transport protocol: handshake, ordered and reliable delivery, flow and congestion control.", he: "פרוטוקול transport מבוסס חיבור: handshake, מסירה אמינה ובסדר, flow control ו-congestion control." }, lesson: "net-osi-tcpip" });
window.INFRA.glossary.push({ term: "UDP", track: "networking", def: { en: "Connectionless transport: tiny header, no handshake, no delivery guarantees. Used by DNS, video, QUIC.", he: "Transport בלי חיבור: header קטן, בלי handshake, בלי הבטחת מסירה. משמש DNS, וידאו, QUIC." }, lesson: "net-osi-tcpip" });
window.INFRA.glossary.push({ term: "MTU", track: "networking", def: { en: "Maximum packet size a link carries (1500 bytes on standard Ethernet); tunnels reduce the effective MTU.", he: "גודל ה-packet המקסימלי שקו מעביר (1500 בייט ב-Ethernet רגיל); tunnels מקטינים את ה-MTU האפקטיבי." }, lesson: "net-osi-tcpip" });
window.INFRA.glossary.push({ term: "CIDR", track: "networking", def: { en: "Notation like 10.0.0.0/16: address plus how many leading bits are the network. Size = 2^(32 - prefix).", he: "כתיבה כמו 10.0.0.0/16: כתובת ועוד כמה ביטים ראשונים שייכים לרשת. גודל = 2^(32 - prefix)." }, lesson: "net-ip-cidr" });
window.INFRA.glossary.push({ term: "RFC 1918", track: "networking", def: { en: "The private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 - never routed on the public Internet.", he: "טווחי ה-IPv4 הפרטיים: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 - לא מנותבים באינטרנט הציבורי." }, lesson: "net-ip-cidr" });
window.INFRA.glossary.push({ term: "Subnet", track: "networking", def: { en: "A slice of a network's address range; in the cloud, a CIDR block inside a VPC that lives in one AZ.", he: "חלק מטווח הכתובות של רשת; בענן, בלוק CIDR בתוך VPC שחי ב-AZ אחד." }, lesson: "net-ip-cidr" });
window.INFRA.glossary.push({ term: "DNS", track: "networking", def: { en: "Distributed system that translates names to records (IPs, aliases, mail servers) with caching by TTL.", he: "מערכת מבוזרת שמתרגמת שמות לרשומות (IPs, aliases, שרתי מייל) עם caching לפי TTL." }, lesson: "net-dns" });
window.INFRA.glossary.push({ term: "TTL (DNS)", track: "networking", def: { en: "How many seconds resolvers may cache a DNS answer; lower it before migrations.", he: "כמה שניות resolvers רשאים לשמור תשובת DNS ב-cache; מורידים אותו לפני מיגרציות." }, lesson: "net-dns" });
window.INFRA.glossary.push({ term: "CNAME", track: "networking", def: { en: "DNS record aliasing one name to another name; not allowed at the zone apex (use ALIAS).", he: "רשומת DNS שמפנה שם אחד לשם אחר; אסורה ב-apex של ה-zone (משתמשים ב-ALIAS)." }, lesson: "net-dns" });
window.INFRA.glossary.push({ term: "TLS", track: "networking", def: { en: "Protocol that encrypts traffic and authenticates the server (optionally the client) using certificates.", he: "פרוטוקול שמצפין תעבורה ומאמת את השרת (ואופציונלית את הקליינט) באמצעות תעודות." }, lesson: "net-http-tls" });
window.INFRA.glossary.push({ term: "SNI", track: "networking", def: { en: "Server Name Indication: the hostname sent in the TLS ClientHello so one IP can serve many certificates.", he: "Server Name Indication: ה-hostname שנשלח ב-ClientHello של TLS כדי ש-IP אחד יוכל להגיש הרבה תעודות." }, lesson: "net-http-tls" });
window.INFRA.glossary.push({ term: "mTLS", track: "networking", def: { en: "Mutual TLS: both client and server present and verify certificates, giving cryptographic identity to both sides.", he: "Mutual TLS: גם הקליינט וגם השרת מציגים ומאמתים תעודות, וכך לשני הצדדים יש זהות קריפטוגרפית." }, lesson: "net-http-tls" });
window.INFRA.glossary.push({ term: "HTTP/3 (QUIC)", track: "networking", def: { en: "HTTP over QUIC on UDP: independent streams, built-in TLS 1.3, no TCP head-of-line blocking.", he: "HTTP מעל QUIC על UDP: streams בלתי תלויים, TLS 1.3 מובנה, בלי head-of-line blocking של TCP." }, lesson: "net-http-tls" });
window.INFRA.glossary.push({ term: "L4 load balancer", track: "networking", def: { en: "Balances TCP/UDP connections using IPs and ports only (e.g. AWS NLB, kube-proxy).", he: "מאזן חיבורי TCP/UDP לפי IPs ו-ports בלבד (למשל AWS NLB, kube-proxy)." }, lesson: "net-load-balancing" });
window.INFRA.glossary.push({ term: "L7 load balancer", track: "networking", def: { en: "Balances individual HTTP/gRPC requests and can route by host, path and headers (e.g. ALB, nginx, Envoy).", he: "מאזן בקשות HTTP/gRPC בודדות ויכול לנתב לפי host, path ו-headers (למשל ALB, nginx, Envoy)." }, lesson: "net-load-balancing" });
window.INFRA.glossary.push({ term: "Health check", track: "networking", def: { en: "Periodic probe by a load balancer that removes failing backends from rotation.", he: "בדיקה תקופתית של load balancer שמוציאה backends כושלים מהסבב." }, lesson: "net-load-balancing" });
window.INFRA.glossary.push({ term: "Consistent hashing", track: "networking", def: { en: "Hashing scheme where adding/removing a node remaps only ~1/N of keys; key for caches and sharding.", he: "שיטת hashing שבה הוספה או הסרה של node ממפה מחדש רק כ-1/N מהמפתחות; קריטי ל-caches ול-sharding." }, lesson: "net-load-balancing" });
window.INFRA.glossary.push({ term: "Anycast", track: "networking", def: { en: "Announcing the same IP from many locations via BGP so users are routed to the nearest one.", he: "הכרזה על אותו IP מהרבה מקומות דרך BGP כך שמשתמשים מנותבים לקרוב ביותר." }, lesson: "net-load-balancing" });
window.INFRA.glossary.push({ term: "Reverse proxy", track: "networking", def: { en: "Server that sits in front of backends and accepts client traffic on their behalf (nginx, Envoy, CDN).", he: "שרת שיושב מול ה-backends ומקבל תעבורה מקליינטים בשמם (nginx, Envoy, CDN)." }, lesson: "net-proxies-cdn" });
window.INFRA.glossary.push({ term: "CDN", track: "networking", def: { en: "Global network of edge caches that serves content close to users and shields the origin.", he: "רשת גלובלית של edge caches שמגישה תוכן קרוב למשתמשים ומגנה על ה-origin." }, lesson: "net-proxies-cdn" });
window.INFRA.glossary.push({ term: "Cache-Control", track: "networking", def: { en: "HTTP header controlling who may cache a response and for how long (max-age, s-maxage, no-store...).", he: "Header של HTTP שקובע מי רשאי לשמור תשובה ב-cache ולכמה זמן (max-age, s-maxage, no-store...)." }, lesson: "net-proxies-cdn" });
window.INFRA.glossary.push({ term: "VPC", track: "networking", def: { en: "Virtual Private Cloud: your isolated private network in a cloud region, split into subnets.", he: "Virtual Private Cloud: הרשת הפרטית והמבודדת שלך ב-region בענן, מחולקת ל-subnets." }, lesson: "net-vpc" });
window.INFRA.glossary.push({ term: "NAT Gateway", track: "networking", def: { en: "Managed service letting private subnets make outbound connections; billed per hour and per GB processed.", he: "שירות מנוהל שמאפשר ל-subnets פרטיים ליזום חיבורים החוצה; מחויב לפי שעה ולפי GB שעובר." }, lesson: "net-vpc" });
window.INFRA.glossary.push({ term: "Internet Gateway", track: "networking", def: { en: "VPC component that connects public subnets to the Internet; a subnet routing 0.0.0.0/0 to it is public.", he: "רכיב VPC שמחבר subnets ציבוריים לאינטרנט; subnet שמנתב 0.0.0.0/0 אליו הוא ציבורי." }, lesson: "net-vpc" });
window.INFRA.glossary.push({ term: "Transit Gateway", track: "networking", def: { en: "Regional hub router connecting many VPCs and VPNs with central route tables (transitive routing).", he: "Router מרכזי אזורי שמחבר הרבה VPCs ו-VPNs עם route tables מרכזיים (ניתוב טרנזיטיבי)." }, lesson: "net-vpc" });
window.INFRA.glossary.push({ term: "PrivateLink", track: "networking", def: { en: "Exposes a service as a private endpoint IP inside a consumer's VPC, even with overlapping CIDRs.", he: "חושף שירות כ-IP של endpoint פרטי בתוך ה-VPC של הצרכן, גם עם CIDRs חופפים." }, lesson: "net-vpc" });
window.INFRA.glossary.push({ term: "Security Group", track: "networking", def: { en: "Stateful, allow-only virtual firewall attached to network interfaces; can reference other SGs.", he: "Firewall וירטואלי stateful עם allow בלבד שמחובר ל-network interfaces; יכול להפנות ל-SGs אחרים." }, lesson: "net-firewalls" });
window.INFRA.glossary.push({ term: "NACL", track: "networking", def: { en: "Stateless subnet-level ACL with numbered allow/deny rules evaluated lowest-first, first match wins.", he: "ACL ברמת subnet שהוא stateless, עם חוקי allow/deny ממוספרים שנבדקים מהנמוך, ההתאמה הראשונה קובעת." }, lesson: "net-firewalls" });
window.INFRA.glossary.push({ term: "WAF", track: "networking", def: { en: "Web Application Firewall: L7 filter that inspects HTTP for SQL injection, XSS, bots and floods.", he: "Web Application Firewall: מסנן L7 שבודק HTTP ל-SQL injection, XSS, בוטים והצפות." }, lesson: "net-firewalls" });
window.INFRA.glossary.push({ term: "NetworkPolicy", track: "networking", def: { en: "Kubernetes object that restricts Pod ingress/egress by labels, namespaces and ports (enforced by the CNI).", he: "אובייקט Kubernetes שמגביל ingress/egress של Pods לפי labels, namespaces ו-ports (נאכף על ידי ה-CNI)." }, lesson: "net-isolation" });
window.INFRA.glossary.push({ term: "Zero trust", track: "networking", def: { en: "Security model where network location grants no trust; every request is authenticated and authorized.", he: "מודל אבטחה שבו מיקום ברשת לא נותן אמון; כל בקשה עוברת authentication ו-authorization." }, lesson: "net-isolation" });
window.INFRA.glossary.push({ term: "East-west traffic", track: "networking", def: { en: "Traffic between services inside your environment, as opposed to north-south traffic in/out of it.", he: "תעבורה בין שירותים בתוך הסביבה, בניגוד לתעבורת north-south שנכנסת ויוצאת ממנה." }, lesson: "net-isolation" });
window.INFRA.glossary.push({ term: "Bastion host", track: "networking", def: { en: "A hardened jump server used to reach private machines; increasingly replaced by SSM/IAP.", he: "שרת קפיצה מוקשח שמשמש להגיע למכונות פרטיות; מוחלף יותר ויותר ב-SSM/IAP." }, lesson: "net-isolation" });
window.INFRA.glossary.push({ term: "tcpdump", track: "networking", def: { en: "CLI packet capture tool showing exactly what crosses a network interface.", he: "כלי CLI ללכידת packets שמראה בדיוק מה עובר ב-network interface." }, lesson: "net-troubleshooting" });
