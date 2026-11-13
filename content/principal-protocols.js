window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* Principal Engineer Playbook — protocols: HTTP/1.1 vs 2 vs 3, email & SMS & push, real-time protocols. */

INFRA.lessons.push({
  id: "pr-http-versions",
  track: "principal",
  order: 50,
  icon: "🛣️",
  level: 3,
  minutes: 15,
  title: { en: "HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC): What Actually Changed", he: "HTTP/1.1 מול HTTP/2 מול HTTP/3 (QUIC): מה באמת השתנה" },
  tldr: {
    en: "HTTP/1.1 = one request at a time per connection; HTTP/2 = many streams multiplexed on one TCP connection (but one lost packet still stalls them all); HTTP/3 = the same streams over QUIC/UDP, so loss only stalls the affected stream and the handshake is 1 RTT (or 0).",
    he: "HTTP/1.1 = בקשה אחת בכל פעם לכל connection; HTTP/2 = הרבה streams במקביל על connection TCP אחד (אבל packet אחד שאבד עדיין עוצר את כולם); HTTP/3 = אותם streams מעל QUIC/UDP, כך שאובדן עוצר רק את ה-stream שנפגע, וה-handshake לוקח RTT אחד (או אפס)."
  },
  analogy: {
    en: "HTTP/1.1 is a one-lane road: each car (request) waits behind the one in front, so browsers open 6 parallel roads per city. HTTP/2 is a multi-lane highway — but it still runs through a single tunnel (TCP): if one truck breaks down in the tunnel, every lane stops. HTTP/3 is a highway with no shared tunnel: each lane has its own independent road surface (QUIC streams over UDP), so a breakdown only blocks that lane, and you keep your toll tag when you change highways (connection migration from Wi-Fi to 4G).",
    he: "HTTP/1.1 הוא כביש עם נתיב אחד: כל רכב (בקשה) מחכה לזה שלפניו, אז הדפדפן פותח 6 כבישים מקבילים לכל עיר. HTTP/2 הוא כביש מהיר עם הרבה נתיבים — אבל כולו עובר במנהרה אחת (TCP): אם משאית אחת נתקעת במנהרה, כל הנתיבים עומדים. HTTP/3 הוא כביש מהיר בלי מנהרה משותפת: לכל נתיב יש משטח כביש עצמאי (QUIC streams מעל UDP), אז תקלה חוסמת רק את הנתיב הזה, ואתם שומרים על תג כביש 6 גם כשעוברים כביש (connection migration מ-Wi-Fi ל-4G)."
  },
  sections: [
    {
      h: { en: "HTTP/1.0 → 1.1: keep-alive and head-of-line blocking", he: "HTTP/1.0 → 1.1: keep-alive ו-head-of-line blocking" },
      body: {
        en: `<p><strong>HTTP/1.0</strong> (1996) opened a new TCP connection per request: 1 RTT for the TCP handshake + 2 RTTs for TLS 1.2 + 1 RTT for the request. On a 100 ms mobile RTT that's ~400 ms before the first byte — for every image.</p>
<p><strong>HTTP/1.1</strong> (1997, still everywhere) added:</p>
<ul>
<li><strong>Persistent connections</strong> (<code>Connection: keep-alive</code> is the default) — reuse the TCP+TLS connection for many requests.</li>
<li><strong>Host header</strong> — many sites on one IP (virtual hosting). Mandatory in 1.1.</li>
<li><strong>Chunked transfer encoding</strong> — stream a response without knowing its length.</li>
<li><strong>Pipelining</strong> — send several requests without waiting… but responses must come back <em>in order</em>. One slow response blocks all behind it = <strong>head-of-line (HOL) blocking</strong>. Proxies broke it, so every browser disabled it.</li>
</ul>
<p>The workaround: browsers open <strong>~6 connections per host</strong>. Sites with 100 assets invented hacks — <strong>domain sharding</strong> (img1.cdn.com, img2.cdn.com = 12+ connections), sprite sheets, inlining CSS/JS, bundling everything into one giant file. Every one of these hacks becomes an <em>anti-pattern</em> under HTTP/2.</p>
<pre>GET /app.js HTTP/1.1
Host: shop.example.com
Accept-Encoding: gzip, br
Connection: keep-alive

HTTP/1.1 200 OK
Content-Type: application/javascript
Content-Encoding: br
Transfer-Encoding: chunked</pre>
<blockquote>💡 Real world: headers in HTTP/1.1 are plain text and repeated on every request — cookies + user-agent are often 500–2,000 bytes per request. 100 requests = ~100 KB of duplicate headers upstream, which hurts on slow mobile uplinks.</blockquote>`,
        he: `<p><strong>HTTP/1.0</strong> (1996) פתח connection TCP חדש לכל בקשה: RTT אחד ל-handshake של TCP + 2 RTTs ל-TLS 1.2 + RTT אחד לבקשה. עם RTT של 100ms בסלולר, זה ~400ms עד ה-byte הראשון — לכל תמונה.</p>
<p><strong>HTTP/1.1</strong> (1997, עדיין בכל מקום) הוסיף:</p>
<ul>
<li><strong>Persistent connections</strong> (<code>Connection: keep-alive</code> הוא ברירת המחדל) — משתמשים שוב ב-connection של TCP+TLS להרבה בקשות.</li>
<li><strong>Host header</strong> — הרבה אתרים על IP אחד (virtual hosting). חובה ב-1.1.</li>
<li><strong>Chunked transfer encoding</strong> — להזרים תשובה בלי לדעת מראש את האורך.</li>
<li><strong>Pipelining</strong> — לשלוח כמה בקשות בלי לחכות... אבל התשובות חייבות לחזור <em>לפי הסדר</em>. תשובה איטית אחת חוסמת את כל מה שאחריה = <strong>head-of-line (HOL) blocking</strong>. Proxies שברו את זה, אז כל הדפדפנים כיבו אותו.</li>
</ul>
<p>הפתרון העקום: דפדפנים פותחים <strong>~6 connections לכל host</strong>. אתרים עם 100 assets המציאו טריקים — <strong>domain sharding</strong> (img1.cdn.com, img2.cdn.com = 12+ connections), sprite sheets, inlining של CSS/JS, ו-bundle ענק אחד. כל אחד מהטריקים האלה הופך ל-<em>anti-pattern</em> ב-HTTP/2.</p>
<pre>GET /app.js HTTP/1.1
Host: shop.example.com
Accept-Encoding: gzip, br
Connection: keep-alive

HTTP/1.1 200 OK
Content-Type: application/javascript
Content-Encoding: br
Transfer-Encoding: chunked</pre>
<blockquote>💡 מהשטח: ב-HTTP/1.1 ה-headers הם טקסט רגיל שחוזר בכל בקשה — cookies + user-agent הם לרוב 500–2,000 bytes לבקשה. 100 בקשות = ~100KB של headers כפולים ב-upload, וזה כואב על uplink סלולרי איטי.</blockquote>`
      }
    },
    {
      h: { en: "HTTP/2: binary frames, streams, multiplexing, HPACK", he: "HTTP/2: frames בינאריים, streams, multiplexing ו-HPACK" },
      body: {
        en: `<p><strong>HTTP/2</strong> (2015, born from Google's SPDY) keeps the same semantics (methods, status codes, headers) but changes the wire format:</p>
<ul>
<li><strong>Binary framing</strong>: every message is split into frames (HEADERS, DATA, SETTINGS, WINDOW_UPDATE, RST_STREAM, GOAWAY, PING…), each tagged with a <strong>stream ID</strong>.</li>
<li><strong>Multiplexing</strong>: hundreds of concurrent streams interleaved on <em>one</em> TCP connection (<code>SETTINGS_MAX_CONCURRENT_STREAMS</code>, commonly 100–250). No more 6-connection limit, no more application-level HOL blocking.</li>
<li><strong>HPACK</strong> header compression: a static + dynamic table so repeated headers (cookie, user-agent) shrink to a few bytes.</li>
<li><strong>Flow control</strong> per stream and per connection; <strong>RST_STREAM</strong> cancels one request without killing the connection.</li>
<li><strong>Server push</strong> — the server sends resources before they're asked for. In practice it wasted bandwidth (pushing what the browser already cached); <strong>Chrome removed it in 2022</strong>. Use <code>103 Early Hints</code> + <code>preload</code> instead.</li>
</ul>
<pre>stream 1: HEADERS(GET /index.html)  ─┐
stream 3: HEADERS(GET /app.js)       ├─ all on ONE TCP connection
stream 5: HEADERS(GET /logo.png)     │   frames interleaved:
          DATA(5) DATA(1) DATA(3) DATA(1) DATA(5) ...</pre>
<p><strong>The catch — TCP head-of-line blocking.</strong> TCP delivers a single ordered byte stream. If one packet carrying a frame of stream 5 is lost, the kernel holds back <em>every</em> later byte — including complete frames for streams 1 and 3 — until the retransmission arrives. With 2% packet loss (bad mobile), HTTP/2 over one connection can be <em>slower</em> than HTTP/1.1 over six.</p>
<blockquote>⚠️ Production tip: <strong>gRPC requires HTTP/2</strong> (it uses streams + trailers). If you put gRPC behind a load balancer that speaks HTTP/1.1 to the backend (classic AWS ELB, old nginx configs), it breaks. Also: HTTP/2 makes long-lived connections, so L4 load balancing pins all of a client's requests to one backend — use an L7 (HTTP/2-aware) LB or client-side balancing to spread requests.</blockquote>`,
        he: `<p><strong>HTTP/2</strong> (2015, נולד מ-SPDY של Google) שומר על אותה סמנטיקה (methods, status codes, headers) אבל משנה את הפורמט על החוט:</p>
<ul>
<li><strong>Binary framing</strong>: כל הודעה מפורקת ל-frames (HEADERS, DATA, SETTINGS, WINDOW_UPDATE, RST_STREAM, GOAWAY, PING...), כל אחד מסומן ב-<strong>stream ID</strong>.</li>
<li><strong>Multiplexing</strong>: מאות streams במקביל, משולבים על connection TCP <em>אחד</em> (<code>SETTINGS_MAX_CONCURRENT_STREAMS</code>, בדרך כלל 100–250). אין יותר מגבלת 6 connections ואין HOL blocking ברמת האפליקציה.</li>
<li><strong>HPACK</strong> לדחיסת headers: טבלה סטטית + דינמית, כך ש-headers שחוזרים (cookie, user-agent) מתכווצים לכמה bytes.</li>
<li><strong>Flow control</strong> לכל stream ולכל connection; <strong>RST_STREAM</strong> מבטל בקשה אחת בלי להרוג את ה-connection.</li>
<li><strong>Server push</strong> — השרת שולח משאבים לפני שביקשו אותם. בפועל זה בזבז bandwidth (דחף דברים שכבר היו ב-cache); <strong>Chrome הסירו את זה ב-2022</strong>. משתמשים במקום ב-<code>103 Early Hints</code> + <code>preload</code>.</li>
</ul>
<pre>stream 1: HEADERS(GET /index.html)  ─┐
stream 3: HEADERS(GET /app.js)       ├─ all on ONE TCP connection
stream 5: HEADERS(GET /logo.png)     │   frames interleaved:
          DATA(5) DATA(1) DATA(3) DATA(1) DATA(5) ...</pre>
<p><strong>המלכודת — HOL blocking ברמת TCP.</strong> TCP מספק זרם bytes אחד מסודר. אם packet אחד שנושא frame של stream 5 אבד, ה-kernel מעכב <em>כל</em> byte שאחריו — כולל frames שלמים של streams 1 ו-3 — עד שה-retransmission מגיע. עם 2% packet loss (סלולר גרוע), HTTP/2 על connection אחד יכול להיות <em>איטי יותר</em> מ-HTTP/1.1 על שישה.</p>
<blockquote>⚠️ טיפ לפרודקשן: <strong>gRPC דורש HTTP/2</strong> (הוא משתמש ב-streams וב-trailers). אם שמים gRPC מאחורי load balancer שמדבר HTTP/1.1 עם ה-backend (ELB קלאסי, קונפיג ישן של nginx) — זה נשבר. וגם: HTTP/2 יוצר connections ארוכים, אז load balancing ב-L4 מצמיד את כל הבקשות של לקוח ל-backend אחד — צריך LB ב-L7 (שמבין HTTP/2) או client-side balancing כדי לפזר בקשות.</blockquote>`
      }
    },
    {
      h: { en: "HTTP/3 over QUIC: streams on UDP, 1-RTT and 0-RTT, connection migration", he: "HTTP/3 מעל QUIC: streams על UDP, 1-RTT ו-0-RTT, connection migration" },
      body: {
        en: `<p><strong>QUIC</strong> (RFC 9000, 2021) is a transport protocol built on <strong>UDP</strong> in user space. <strong>HTTP/3</strong> (RFC 9114, 2022) is HTTP mapped onto QUIC. What it fixes:</p>
<ul>
<li><strong>No transport HOL blocking</strong>: QUIC knows about streams. A lost packet only stalls the stream whose data it carried; other streams keep flowing.</li>
<li><strong>TLS 1.3 is built in</strong> — encryption is mandatory, transport + crypto handshake are combined: <strong>1 RTT</strong> to a new server, <strong>0-RTT</strong> to a server you've visited (resumption ticket; data sent in the very first packet).</li>
<li><strong>Connection migration</strong>: connections are identified by a <em>Connection ID</em>, not the 4-tuple (src IP, src port, dst IP, dst port). Walk from Wi-Fi to 5G and your downloads/video calls continue without a new handshake.</li>
<li><strong>QPACK</strong> replaces HPACK (HPACK assumed in-order delivery; QPACK tolerates out-of-order streams).</li>
<li>Even most of the transport headers are encrypted → middleboxes can't ossify it, and it evolves in user space (no kernel upgrade needed).</li>
</ul>
<pre>Handshake round trips before the first request byte (new connection):
  HTTP/1.1 or 2 + TLS 1.2 : TCP 1 RTT + TLS 2 RTT = 3 RTT
  HTTP/1.1 or 2 + TLS 1.3 : TCP 1 RTT + TLS 1 RTT = 2 RTT
  HTTP/3 (QUIC)           : 1 RTT  (0 RTT on resumption)
At 150 ms RTT (mobile, far region): 450 ms vs 300 ms vs 150 ms (vs ~0)</pre>
<blockquote>⚠️ Production tip: <strong>0-RTT data can be replayed</strong> by an attacker who captures the first packet. Only allow 0-RTT for idempotent requests (GET); servers/CDNs reject 0-RTT POSTs or use <code>425 Too Early</code>. And remember QUIC costs more CPU than kernel TCP (user-space crypto, no TSO offload historically) — ~2x CPU per byte was common in early deployments.</blockquote>`,
        he: `<p><strong>QUIC</strong> (RFC 9000, 2021) הוא פרוטוקול transport שבנוי מעל <strong>UDP</strong> ב-user space. <strong>HTTP/3</strong> (RFC 9114, 2022) הוא HTTP שממופה מעל QUIC. מה הוא פותר:</p>
<ul>
<li><strong>אין HOL blocking ברמת ה-transport</strong>: QUIC מכיר streams. packet שאבד עוצר רק את ה-stream שהנתונים שלו היו בו; שאר ה-streams ממשיכים לזרום.</li>
<li><strong>TLS 1.3 מובנה</strong> — הצפנה היא חובה, וה-handshake של transport ושל crypto מאוחדים: <strong>1 RTT</strong> לשרת חדש, <strong>0-RTT</strong> לשרת שכבר ביקרתם בו (resumption ticket; נתונים נשלחים כבר ב-packet הראשון).</li>
<li><strong>Connection migration</strong>: connection מזוהה לפי <em>Connection ID</em>, לא לפי ה-4-tuple (src IP, src port, dst IP, dst port). עוברים מ-Wi-Fi ל-5G וההורדות/שיחות הווידאו ממשיכות בלי handshake חדש.</li>
<li><strong>QPACK</strong> מחליף את HPACK (HPACK הניח מסירה לפי סדר; QPACK מסתדר עם streams שמגיעים לא לפי הסדר).</li>
<li>אפילו רוב ה-headers של ה-transport מוצפנים → middleboxes לא יכולים "לקבע" אותו, והוא מתפתח ב-user space (בלי לשדרג kernel).</li>
</ul>
<pre>Handshake round trips before the first request byte (new connection):
  HTTP/1.1 or 2 + TLS 1.2 : TCP 1 RTT + TLS 2 RTT = 3 RTT
  HTTP/1.1 or 2 + TLS 1.3 : TCP 1 RTT + TLS 1 RTT = 2 RTT
  HTTP/3 (QUIC)           : 1 RTT  (0 RTT on resumption)
At 150 ms RTT (mobile, far region): 450 ms vs 300 ms vs 150 ms (vs ~0)</pre>
<blockquote>⚠️ טיפ לפרודקשן: <strong>נתוני 0-RTT יכולים לעבור replay</strong> ע"י תוקף שתפס את ה-packet הראשון. מאפשרים 0-RTT רק לבקשות אידמפוטנטיות (GET); שרתים/CDNs דוחים POST ב-0-RTT או מחזירים <code>425 Too Early</code>. ותזכרו ש-QUIC עולה יותר CPU מ-TCP של ה-kernel (crypto ב-user space, היסטורית בלי TSO offload) — פי ~2 CPU ל-byte היה נפוץ בפריסות מוקדמות.</blockquote>`
      }
    },
    {
      h: { en: "Discovery: ALPN and Alt-Svc — how a client knows which version to speak", he: "Discovery: ALPN ו-Alt-Svc — איך הלקוח יודע באיזו גרסה לדבר" },
      body: {
        en: `<ul>
<li><strong>ALPN</strong> (Application-Layer Protocol Negotiation): inside the TLS ClientHello the client lists <code>h2, http/1.1</code>; the server picks one. No extra round trip. Browsers only do HTTP/2 over TLS ("h2"). Cleartext HTTP/2 ("<strong>h2c</strong>") exists but is used only server-to-server (e.g. gRPC inside a mesh, Envoy → backend).</li>
<li><strong>Alt-Svc</strong>: HTTP/3 runs on UDP, so the client can't know up front. The server advertises it on an HTTP/1.1 or /2 response: <code>alt-svc: h3=":443"; ma=86400</code>. The browser tries QUIC next time and races it against TCP ("happy eyeballs"); if UDP is blocked it silently stays on h2.</li>
<li><strong>HTTPS DNS record</strong> (SVCB/HTTPS RR, type 65): advertise <code>alpn="h3,h2"</code> in DNS so even the first connection can use HTTP/3.</li>
</ul>
<pre>$ curl -sI --http2 https://www.cloudflare.com | grep -i -E '^HTTP|alt-svc'
HTTP/2 200
alt-svc: h3=":443"; ma=86400

$ curl -v --http3-only https://www.cloudflare.com -o /dev/null 2&gt;&amp;1 | grep -E 'HTTP/3|Connected'
* Connected to www.cloudflare.com (104.16.124.96) port 443
* using HTTP/3
&lt; HTTP/3 200

$ dig +short www.cloudflare.com HTTPS
1 . alpn="h3,h2" ipv4hint=104.16.123.96,104.16.124.96</pre>
<table>
<tr><th></th><th>HTTP/1.1</th><th>HTTP/2</th><th>HTTP/3</th></tr>
<tr><td>Transport</td><td>TCP</td><td>TCP</td><td>QUIC over UDP</td></tr>
<tr><td>Format</td><td>Text</td><td>Binary frames</td><td>Binary frames (QUIC streams)</td></tr>
<tr><td>Parallel requests</td><td>~6 connections/host</td><td>Many streams, 1 conn</td><td>Many streams, 1 conn</td></tr>
<tr><td>HOL blocking</td><td>HTTP + TCP level</td><td>TCP level only</td><td>None across streams</td></tr>
<tr><td>Header compression</td><td>None</td><td>HPACK</td><td>QPACK</td></tr>
<tr><td>TLS</td><td>Optional</td><td>De facto required (browsers)</td><td>Mandatory, TLS 1.3 built in</td></tr>
<tr><td>New-conn setup</td><td>2–3 RTT</td><td>2–3 RTT</td><td>1 RTT / 0-RTT</td></tr>
<tr><td>Network change</td><td>Reconnect</td><td>Reconnect</td><td>Migrates (Connection ID)</td></tr>
</table>`,
        he: `<ul>
<li><strong>ALPN</strong> (Application-Layer Protocol Negotiation): בתוך ה-ClientHello של TLS הלקוח מציין <code>h2, http/1.1</code>; השרת בוחר. בלי round trip נוסף. דפדפנים עושים HTTP/2 רק מעל TLS ("h2"). HTTP/2 בטקסט גלוי ("<strong>h2c</strong>") קיים, אבל משמש רק בין שרתים (למשל gRPC בתוך mesh, Envoy → backend).</li>
<li><strong>Alt-Svc</strong>: HTTP/3 רץ על UDP, אז הלקוח לא יכול לדעת מראש. השרת מפרסם אותו בתשובת HTTP/1.1 או /2: <code>alt-svc: h3=":443"; ma=86400</code>. הדפדפן מנסה QUIC בפעם הבאה ומריץ אותו במרוץ מול TCP ("happy eyeballs"); אם UDP חסום הוא נשאר בשקט על h2.</li>
<li><strong>רשומת HTTPS ב-DNS</strong> (SVCB/HTTPS RR, type 65): מפרסמים <code>alpn="h3,h2"</code> ב-DNS כך שאפילו ה-connection הראשון יכול להיות HTTP/3.</li>
</ul>
<pre>$ curl -sI --http2 https://www.cloudflare.com | grep -i -E '^HTTP|alt-svc'
HTTP/2 200
alt-svc: h3=":443"; ma=86400

$ curl -v --http3-only https://www.cloudflare.com -o /dev/null 2&gt;&amp;1 | grep -E 'HTTP/3|Connected'
* Connected to www.cloudflare.com (104.16.124.96) port 443
* using HTTP/3
&lt; HTTP/3 200

$ dig +short www.cloudflare.com HTTPS
1 . alpn="h3,h2" ipv4hint=104.16.123.96,104.16.124.96</pre>
<table>
<tr><th></th><th>HTTP/1.1</th><th>HTTP/2</th><th>HTTP/3</th></tr>
<tr><td>Transport</td><td>TCP</td><td>TCP</td><td>QUIC מעל UDP</td></tr>
<tr><td>פורמט</td><td>טקסט</td><td>Frames בינאריים</td><td>Frames בינאריים (QUIC streams)</td></tr>
<tr><td>בקשות במקביל</td><td>~6 connections ל-host</td><td>הרבה streams, conn אחד</td><td>הרבה streams, conn אחד</td></tr>
<tr><td>HOL blocking</td><td>ברמת HTTP וגם TCP</td><td>רק ברמת TCP</td><td>אין בין streams</td></tr>
<tr><td>דחיסת headers</td><td>אין</td><td>HPACK</td><td>QPACK</td></tr>
<tr><td>TLS</td><td>אופציונלי</td><td>חובה דה-פקטו (דפדפנים)</td><td>חובה, TLS 1.3 מובנה</td></tr>
<tr><td>הקמת conn חדש</td><td>2–3 RTT</td><td>2–3 RTT</td><td>1 RTT / 0-RTT</td></tr>
<tr><td>החלפת רשת</td><td>מתחבר מחדש</td><td>מתחבר מחדש</td><td>עובר (Connection ID)</td></tr>
</table>`
      }
    },
    {
      h: { en: "When it matters and what it means for your infra", he: "מתי זה משנה ומה זה אומר על התשתית שלכם" },
      body: {
        en: `<p><strong>Where HTTP/3 wins big</strong>: mobile and lossy networks, far-away users (high RTT), pages with many small resources, video start time, users who switch networks. Google reported ~8% lower search latency on desktop and up to ~16% at the tail; YouTube saw ~15–18% less rebuffering. <strong>Where it barely matters</strong>: data-center east-west traffic on a clean 0.1 ms network — HTTP/2 (or gRPC) is fine there and cheaper on CPU.</p>
<p><strong>Infra checklist for a principal:</strong></p>
<ul>
<li><strong>Terminate at the edge</strong>: let the CDN/edge LB (Cloudflare, CloudFront, Fastly, Google LB, Azure Front Door) speak HTTP/3 to users and HTTP/1.1 or h2 to your origin. You rarely need QUIC in your own pods.</li>
<li><strong>Firewalls</strong>: open <strong>UDP 443</strong> inbound on the edge. Many corporate networks block UDP 443 — that's fine, clients fall back to h2, but measure the share.</li>
<li><strong>L4 load balancers + QUIC</strong>: hashing on the 4-tuple breaks connection migration; QUIC-aware LBs route on Connection ID (e.g. Katran, Cloudflare's Unimog, AWS NLB with QUIC passthrough).</li>
<li><strong>Undo HTTP/1.1 hacks</strong>: domain sharding hurts h2/h3 (extra DNS + TLS + kills multiplexing). Keep reasonable bundling (compression works better on bigger files) but no need for sprites.</li>
<li><strong>Observability</strong>: log the negotiated protocol (<code>$server_protocol</code> in nginx, <code>%PROTOCOL%</code> in Envoy) and break latency down by protocol.</li>
<li><strong>Timeouts &amp; limits</strong>: with h2 one client = one connection carrying 100 streams; tune <code>max_concurrent_streams</code>, idle timeouts and per-connection request limits so a single client can't monopolize a backend (and watch for the 2023 "Rapid Reset" CVE-2023-44487 DDoS against h2).</li>
</ul>
<pre># nginx: HTTP/2 + HTTP/3 at the edge (nginx &gt;= 1.25)
server {
    listen 443 ssl;
    listen 443 quic reuseport;
    http2 on;
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Alt-Svc 'h3=":443"; ma=86400' always;
    location / { proxy_pass http://app_backend; proxy_http_version 1.1; }
}</pre>`,
        he: `<p><strong>איפה HTTP/3 מנצח בגדול</strong>: רשתות סלולריות ורשתות עם אובדן packets, משתמשים רחוקים (RTT גבוה), דפים עם הרבה משאבים קטנים, זמן התחלת וידאו, ומשתמשים שמחליפים רשת. Google דיווחו על ~8% פחות latency בחיפוש בדסקטופ ועד ~16% ב-tail; ב-YouTube היה ~15–18% פחות rebuffering. <strong>איפה זה כמעט לא משנה</strong>: תעבורת east-west בתוך ה-data center על רשת נקייה של 0.1ms — שם HTTP/2 (או gRPC) מספיק וזול יותר ב-CPU.</p>
<p><strong>צ'קליסט תשתית ל-Principal:</strong></p>
<ul>
<li><strong>Terminate ב-edge</strong>: שה-CDN/edge LB (Cloudflare, CloudFront, Fastly, Google LB, Azure Front Door) ידבר HTTP/3 עם המשתמשים ו-HTTP/1.1 או h2 עם ה-origin. כמעט אף פעם לא צריך QUIC בתוך ה-pods שלכם.</li>
<li><strong>Firewalls</strong>: לפתוח <strong>UDP 443</strong> נכנס ב-edge. הרבה רשתות ארגוניות חוסמות UDP 443 — זה בסדר, הלקוחות חוזרים ל-h2, אבל תמדדו את האחוז.</li>
<li><strong>L4 load balancers + QUIC</strong>: hashing לפי ה-4-tuple שובר connection migration; LBs שמכירים QUIC מנתבים לפי Connection ID (למשל Katran, Unimog של Cloudflare, AWS NLB עם QUIC passthrough).</li>
<li><strong>לבטל טריקים של HTTP/1.1</strong>: domain sharding מזיק ל-h2/h3 (עוד DNS + TLS, והורג את ה-multiplexing). תשאירו bundling סביר (דחיסה עובדת טוב יותר על קבצים גדולים), אבל אין צורך ב-sprites.</li>
<li><strong>Observability</strong>: לרשום בלוג את הפרוטוקול שנבחר (<code>$server_protocol</code> ב-nginx, <code>%PROTOCOL%</code> ב-Envoy) ולפרק latency לפי פרוטוקול.</li>
<li><strong>Timeouts ומגבלות</strong>: ב-h2 לקוח אחד = connection אחד שנושא 100 streams; כוונו <code>max_concurrent_streams</code>, idle timeouts ומגבלת בקשות ל-connection כדי שלקוח אחד לא ישתלט על backend (ותכירו את ה-DDoS "Rapid Reset" מ-2023, CVE-2023-44487, נגד h2).</li>
</ul>
<pre># nginx: HTTP/2 + HTTP/3 at the edge (nginx &gt;= 1.25)
server {
    listen 443 ssl;
    listen 443 quic reuseport;
    http2 on;
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Alt-Svc 'h3=":443"; ma=86400' always;
    location / { proxy_pass http://app_backend; proxy_http_version 1.1; }
}</pre>`
      }
    }
  ],
  diagram: `NEW CONNECTION, time flows down (1 line ~ 1 one-way trip)

HTTP/2 + TLS 1.3 over TCP           HTTP/3 over QUIC
client            server            client            server
  |--- SYN ---------->|               |-- Initial(ClientHello+QUIC params) ->|
  |<-- SYN/ACK -------|               |<- Initial(ServerHello)+Handshake ----|
  |--- ACK + ClientHello ->|          |-- Finished + GET / (stream 0) ------>|
  |<-- ServerHello..Finished|         |<- 200 OK (stream 0) -----------------|
  |--- Finished + GET / --->|            = 1 RTT before request
  |<-- 200 OK --------------|         resumption: GET / rides in packet #1 (0-RTT)
     = 2 RTT before request

ONE LOST PACKET (stream 5 data):
  HTTP/2: [s1][s3][s5 X][s1][s3]  -> TCP holds s1,s3 too until s5 resent   (all wait)
  HTTP/3: [s1][s3][s5 X][s1][s3]  -> s1,s3 delivered now; only s5 waits    (one waits)`,
  handsOn: [
    { cmd: "curl -sI --http2 https://www.google.com | head -1; curl -sI --http1.1 https://www.google.com | head -1", what: { en: "Force each protocol version and compare the status line (HTTP/2 vs HTTP/1.1).", he: "מכריחים כל גרסת פרוטוקול ומשווים את שורת הסטטוס (HTTP/2 מול HTTP/1.1)." } },
    { cmd: "curl -sI https://www.cloudflare.com | grep -i alt-svc", what: { en: "See the Alt-Svc header a server uses to advertise HTTP/3.", he: "רואים את ה-header של Alt-Svc שבעזרתו שרת מפרסם HTTP/3." } },
    { cmd: "curl -v --http3-only https://www.cloudflare.com -o /dev/null 2>&1 | grep -i 'http/3'", what: { en: "Talk HTTP/3 over QUIC directly (needs a curl built with HTTP/3, e.g. recent Homebrew/Windows builds).", he: "מדברים HTTP/3 מעל QUIC ישירות (צריך curl שנבנה עם תמיכה ב-HTTP/3, למשל גרסאות עדכניות של Homebrew/Windows)." } },
    { cmd: "openssl s_client -connect www.google.com:443 -alpn h2,http/1.1 -servername www.google.com </dev/null 2>/dev/null | grep -E 'ALPN|Protocol'", what: { en: "Watch ALPN negotiation inside the TLS handshake: which protocol and TLS version the server picked.", he: "רואים את משא ומתן ה-ALPN בתוך ה-handshake של TLS: איזה פרוטוקול ואיזו גרסת TLS השרת בחר." } },
    { cmd: "curl -so /dev/null -w 'dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer}\\n' https://example.com", what: { en: "Measure where connection time goes: DNS, TCP handshake, TLS handshake, time to first byte.", he: "מודדים לאן הולך זמן החיבור: DNS, handshake של TCP, handshake של TLS, וזמן עד ה-byte הראשון." } }
  ],
  mnemonic: {
    en: "1.1 = one Lane, 2 = many lanes in one Tunnel, 3 = many lanes, no tunnel (QUIC on UDP). 'Lost packet? h2 stops ALL, h3 stops ONE.'",
    he: "1.1 = נתיב אחד, 2 = הרבה נתיבים במנהרה אחת, 3 = הרבה נתיבים בלי מנהרה (QUIC על UDP). 'packet אבד? h2 עוצר את כולם, h3 עוצר אחד.'"
  },
  pitfalls: [
    { en: "Assuming HTTP/2 always beats HTTP/1.1. On lossy links its single TCP connection suffers HOL blocking for every stream; measure on real mobile networks.", he: "להניח ש-HTTP/2 תמיד מנצח את HTTP/1.1. ברשתות עם אובדן packets, ה-connection TCP היחיד שלו סובל מ-HOL blocking לכל ה-streams; תמדדו ברשתות סלולריות אמיתיות." },
    { en: "Putting gRPC behind an LB/proxy that downgrades to HTTP/1.1 toward the backend — gRPC needs end-to-end HTTP/2 (or a gRPC-aware proxy).", he: "לשים gRPC מאחורי LB/proxy שמוריד ל-HTTP/1.1 מול ה-backend — gRPC צריך HTTP/2 מקצה לקצה (או proxy שמבין gRPC)." },
    { en: "Enabling HTTP/3 but forgetting UDP 443 in the security group/firewall: clients silently fall back, nobody notices it never worked.", he: "להפעיל HTTP/3 ולשכוח לפתוח UDP 443 ב-security group/firewall: הלקוחות חוזרים בשקט ל-h2, ואף אחד לא שם לב שזה אף פעם לא עבד." },
    { en: "Accepting non-idempotent requests in TLS 1.3/QUIC 0-RTT early data — it can be replayed.", he: "לקבל בקשות לא אידמפוטנטיות ב-early data של 0-RTT ב-TLS 1.3/QUIC — אפשר לעשות להן replay." }
  ],
  interview: [
    { q: { en: "HTTP/2 already multiplexes. Why did we need HTTP/3?", he: "HTTP/2 כבר עושה multiplexing. למה היינו צריכים HTTP/3?" },
      a: { en: "HTTP/2 removed HOL blocking at the HTTP layer but runs over a single TCP connection, and TCP delivers one ordered byte stream — a lost packet stalls all streams. QUIC moves streams into the transport over UDP so loss only affects one stream, merges the TLS 1.3 handshake (1-RTT, 0-RTT on resume), and identifies connections by Connection ID so they survive network changes. It also lives in user space, so it can evolve without kernel and middlebox ossification.", he: "HTTP/2 הוריד HOL blocking ברמת HTTP אבל רץ על connection TCP אחד, ו-TCP מספק זרם bytes אחד מסודר — packet שאבד עוצר את כל ה-streams. QUIC מעביר את ה-streams לשכבת ה-transport מעל UDP, כך שאובדן משפיע רק על stream אחד, מאחד את ה-handshake של TLS 1.3 (1-RTT, 0-RTT בחידוש), ומזהה connections לפי Connection ID כך שהם שורדים החלפת רשת. הוא גם חי ב-user space, אז אפשר לפתח אותו בלי להיתקע בגלל ה-kernel ו-middleboxes." } },
    { q: { en: "You enable HTTP/2 on your edge and backend latency distribution becomes very uneven across pods. Why?", he: "הפעלתם HTTP/2 ב-edge, ופתאום ההתפלגות של העומס בין ה-pods מאוד לא אחידה. למה?" },
      a: { en: "HTTP/2 (and gRPC) reuse one long-lived connection for many requests. An L4 load balancer balances connections, not requests, so a heavy client's thousands of requests all land on one pod. Fix: use an L7 HTTP/2-aware LB or service mesh (Envoy) that balances per request, client-side load balancing for gRPC, or cap connection age (max_connection_age) so clients reconnect and rebalance.", he: "HTTP/2 (ו-gRPC) משתמשים ב-connection ארוך אחד להרבה בקשות. LB ב-L4 מאזן connections, לא בקשות, אז אלפי הבקשות של לקוח כבד נוחתות כולן על pod אחד. פתרון: LB ב-L7 שמבין HTTP/2 או service mesh (Envoy) שמאזן לכל בקשה, client-side load balancing ל-gRPC, או הגבלת גיל ה-connection (max_connection_age) כדי שלקוחות יתחברו מחדש ויתאזנו." } },
    { q: { en: "How does a browser discover that a site supports HTTP/3?", he: "איך הדפדפן מגלה שאתר תומך ב-HTTP/3?" },
      a: { en: "Two ways: the Alt-Svc response header (h3=\":443\") on an earlier HTTP/1.1 or HTTP/2 response, after which the browser races QUIC against TCP; or the DNS HTTPS/SVCB record with alpn=\"h3,h2\" so even the first connection can try QUIC. ALPN in the TLS handshake chooses between h2 and http/1.1 over TCP.", he: "שתי דרכים: ה-header של Alt-Svc (h3=\":443\") בתשובת HTTP/1.1 או HTTP/2 קודמת, ואחרי זה הדפדפן מריץ QUIC במרוץ מול TCP; או רשומת HTTPS/SVCB ב-DNS עם alpn=\"h3,h2\" כך שאפילו ה-connection הראשון יכול לנסות QUIC. ALPN בתוך ה-handshake של TLS בוחר בין h2 ל-http/1.1 מעל TCP." } }
  ],
  quiz: [
    { q: { en: "What does HTTP/2 still suffer from that HTTP/3 fixes?", he: "ממה HTTP/2 עדיין סובל ש-HTTP/3 מתקן?" },
      options: [
        { en: "Lack of header compression", he: "חוסר בדחיסת headers" },
        { en: "TCP-level head-of-line blocking across all streams", he: "HOL blocking ברמת TCP על כל ה-streams" },
        { en: "Only one request per connection", he: "רק בקשה אחת לכל connection" },
        { en: "No support for TLS", he: "אין תמיכה ב-TLS" }
      ], answer: 1,
      explain: { en: "HTTP/2 multiplexes streams over one TCP byte stream; a single lost packet stalls everything. QUIC has per-stream loss recovery.", he: "HTTP/2 מבצע multiplexing של streams מעל זרם bytes אחד של TCP; packet אחד שאבד עוצר הכול. ב-QUIC התאוששות מאובדן היא לכל stream בנפרד." } },
    { q: { en: "Which transport does HTTP/3 use?", he: "באיזה transport משתמש HTTP/3?" },
      options: [
        { en: "TCP with TLS 1.2", he: "TCP עם TLS 1.2" },
        { en: "SCTP", he: "SCTP" },
        { en: "QUIC over UDP, with TLS 1.3 built in", he: "QUIC מעל UDP, עם TLS 1.3 מובנה" },
        { en: "Raw IP", he: "IP גולמי" }
      ], answer: 2,
      explain: { en: "HTTP/3 = HTTP over QUIC; QUIC runs on UDP and integrates the TLS 1.3 handshake.", he: "HTTP/3 = HTTP מעל QUIC; QUIC רץ על UDP ומשלב בתוכו את ה-handshake של TLS 1.3." } },
    { q: { en: "Why is domain sharding (img1/img2/img3.cdn.com) an anti-pattern with HTTP/2?", he: "למה domain sharding (img1/img2/img3.cdn.com) הוא anti-pattern ב-HTTP/2?" },
      options: [
        { en: "HTTP/2 forbids multiple hostnames", he: "HTTP/2 אוסר על כמה hostnames" },
        { en: "It adds DNS + TLS handshakes and splits traffic across connections, defeating multiplexing and header compression", he: "זה מוסיף handshakes של DNS ו-TLS ומפצל תעבורה בין connections, מה שמבטל את ה-multiplexing ואת דחיסת ה-headers" },
        { en: "CDNs don't support subdomains", he: "CDNs לא תומכים ב-subdomains" },
        { en: "It breaks cookies", he: "זה שובר cookies" }
      ], answer: 1,
      explain: { en: "Sharding was a hack for HTTP/1.1's ~6-connection limit. With h2 one connection carries everything; more hosts = more handshakes and worse compression/prioritization.", he: "Sharding היה טריק נגד מגבלת ~6 ה-connections של HTTP/1.1. ב-h2 connection אחד נושא הכול; יותר hosts = יותר handshakes ודחיסה/תעדוף גרועים יותר." } },
    { q: { en: "Which requests are safe to send as 0-RTT early data?", he: "אילו בקשות בטוח לשלוח כ-early data ב-0-RTT?" },
      options: [
        { en: "Any request — it's encrypted", he: "כל בקשה — היא מוצפנת" },
        { en: "Only POST requests", he: "רק בקשות POST" },
        { en: "Only idempotent requests like GET, because early data can be replayed", he: "רק בקשות אידמפוטנטיות כמו GET, כי אפשר לעשות replay ל-early data" },
        { en: "None — 0-RTT is disabled in HTTP/3", he: "אף אחת — 0-RTT כבוי ב-HTTP/3" }
      ], answer: 2,
      explain: { en: "An attacker can capture and resend 0-RTT data. Servers reject or 425 non-idempotent early requests.", he: "תוקף יכול ללכוד ולשלוח שוב נתוני 0-RTT. שרתים דוחים בקשות early לא אידמפוטנטיות או מחזירים 425." } }
  ],
  related: ["net-http-tls", "net-osi-tcpip", "net-load-balancing", "net-proxies-cdn", "pr-realtime-protocols", "pr-integration-styles"]
});

INFRA.lessons.push({
  id: "pr-email-sms",
  track: "principal",
  order: 51,
  icon: "✉️",
  level: 3,
  minutes: 16,
  title: { en: "Email, SMS & Push: SMTP, SPF/DKIM/DMARC, SMPP, OTPs and Notification Systems", he: "מייל, SMS ו-Push: SMTP, SPF/DKIM/DMARC, SMPP, OTP ומערכות התראות" },
  tldr: {
    en: "Sending a message is easy; getting it delivered is the job. Email lives or dies by SPF/DKIM/DMARC and reputation, SMS by carrier registration and fraud control, push by device tokens — and all three belong behind one idempotent, queue-based notification service with preferences and fallbacks.",
    he: "לשלוח הודעה זה קל; לגרום לה להגיע — זו העבודה. מייל חי או מת לפי SPF/DKIM/DMARC והמוניטין, SMS לפי רישום מול ה-carriers ושליטה בהונאות, push לפי device tokens — ושלושתם צריכים לשבת מאחורי notification service אחד, אידמפוטנטי, מבוסס תור, עם העדפות ו-fallbacks."
  },
  analogy: {
    en: "Email is the postal system: SMTP is the trucks between post offices, MX records are the address of the recipient's post office, and IMAP is the mailbox at home. SPF is the list of post offices allowed to send letters in your name, DKIM is a wax seal only you can stamp, and DMARC is your instruction to the receiving post office: 'if the seal is missing, throw it away'. SMS is a courier who hands the envelope through 3 middlemen (your app → aggregator → carrier → phone) — fast, but every middleman charges, and if you don't register as a known business they stop accepting your envelopes.",
    he: "מייל זה דואר ישראל: SMTP הן המשאיות בין סניפי הדואר, רשומות MX הן הכתובת של סניף הדואר של הנמען, ו-IMAP הוא תיבת הדואר בבית. SPF זו רשימת הסניפים שמותר להם לשלוח מכתבים בשמכם, DKIM זה חותם שעווה שרק אתם יכולים להטביע, ו-DMARC זו ההוראה שלכם לסניף המקבל: 'אם אין חותם — לזרוק'. SMS זה שליח שמעביר את המעטפה דרך 3 מתווכים (האפליקציה → aggregator → carrier → טלפון) — מהיר, אבל כל מתווך גובה, ואם לא נרשמתם כעסק מוכר הם מפסיקים לקבל את המעטפות שלכם."
  },
  sections: [
    {
      h: { en: "How email actually moves: SMTP, MX, ports, IMAP vs POP3", he: "איך מייל באמת זז: SMTP, MX, פורטים, IMAP מול POP3" },
      body: {
        en: `<p><strong>SMTP</strong> (Simple Mail Transfer Protocol) pushes mail between servers. <strong>IMAP</strong> (port 993 with TLS) and <strong>POP3</strong> (995) let clients <em>read</em> it. IMAP keeps mail on the server and syncs folders across devices; POP3 downloads and (usually) deletes — legacy.</p>
<table>
<tr><th>Port</th><th>Use</th></tr>
<tr><td>25</td><td>Server-to-server relay (MTA → MTA). Blocked outbound by most clouds (AWS, GCP, Azure) to stop spam.</td></tr>
<tr><td>587</td><td>Submission: your app/client → your mail provider, with STARTTLS + AUTH. <strong>Use this.</strong></td></tr>
<tr><td>465</td><td>Submission over implicit TLS (SMTPS) — re-standardized in RFC 8314, also fine.</td></tr>
</table>
<p>Delivery path: app → (587) provider (SES/SendGrid) → DNS lookup of recipient's <strong>MX</strong> record → (25) recipient's MTA (Gmail) → spam filtering → inbox. The receiving side checks SPF, DKIM, DMARC, IP reputation and content.</p>
<pre>$ dig +short MX gmail.com
5 gmail-smtp-in.l.google.com.
10 alt1.gmail-smtp-in.l.google.com.

S: 220 smtp.example.net ESMTP
C: EHLO app01.shop.example.com
S: 250-STARTTLS
S: 250 AUTH PLAIN LOGIN
C: STARTTLS            (... TLS handshake, EHLO again, AUTH ...)
C: MAIL FROM:&lt;bounces@mail.shop.example.com&gt;      &lt;- envelope sender (Return-Path)
C: RCPT TO:&lt;dana@gmail.com&gt;
C: DATA
S: 354 End data with &lt;CR&gt;&lt;LF&gt;.&lt;CR&gt;&lt;LF&gt;
C: From: Shop &lt;orders@shop.example.com&gt;           &lt;- header From (what users see)
C: To: dana@gmail.com
C: Subject: Your order #81 shipped
C: Message-ID: &lt;o-81-shipped@shop.example.com&gt;
C:
C: Hi Dana, ...
C: .
S: 250 2.0.0 OK queued as 7A1F
C: QUIT</pre>
<blockquote>💡 Real world: notice there are <strong>two "from" addresses</strong> — the envelope <code>MAIL FROM</code> (where bounces go, checked by SPF) and the header <code>From:</code> (what users see, protected by DMARC alignment). Phishing lives in the gap between them.</blockquote>`,
        he: `<p><strong>SMTP</strong> (Simple Mail Transfer Protocol) דוחף מייל בין שרתים. <strong>IMAP</strong> (פורט 993 עם TLS) ו-<strong>POP3</strong> (995) מאפשרים ללקוחות <em>לקרוא</em> אותו. IMAP משאיר את הדואר בשרת ומסנכרן תיקיות בין מכשירים; POP3 מוריד ו(בדרך כלל) מוחק — legacy.</p>
<table>
<tr><th>פורט</th><th>שימוש</th></tr>
<tr><td>25</td><td>Relay בין שרתים (MTA → MTA). חסום ליציאה ברוב העננים (AWS, GCP, Azure) כדי לעצור spam.</td></tr>
<tr><td>587</td><td>Submission: האפליקציה/הלקוח → ספק המייל שלכם, עם STARTTLS + AUTH. <strong>להשתמש בזה.</strong></td></tr>
<tr><td>465</td><td>Submission מעל TLS מובלע (SMTPS) — חזר לתקן ב-RFC 8314, גם בסדר.</td></tr>
</table>
<p>מסלול המסירה: אפליקציה → (587) ספק (SES/SendGrid) → חיפוש DNS של רשומת ה-<strong>MX</strong> של הנמען → (25) ה-MTA של הנמען (Gmail) → סינון spam → inbox. הצד המקבל בודק SPF, DKIM, DMARC, מוניטין ה-IP והתוכן.</p>
<pre>$ dig +short MX gmail.com
5 gmail-smtp-in.l.google.com.
10 alt1.gmail-smtp-in.l.google.com.

S: 220 smtp.example.net ESMTP
C: EHLO app01.shop.example.com
S: 250-STARTTLS
S: 250 AUTH PLAIN LOGIN
C: STARTTLS            (... TLS handshake, EHLO again, AUTH ...)
C: MAIL FROM:&lt;bounces@mail.shop.example.com&gt;      &lt;- envelope sender (Return-Path)
C: RCPT TO:&lt;dana@gmail.com&gt;
C: DATA
S: 354 End data with &lt;CR&gt;&lt;LF&gt;.&lt;CR&gt;&lt;LF&gt;
C: From: Shop &lt;orders@shop.example.com&gt;           &lt;- header From (what users see)
C: To: dana@gmail.com
C: Subject: Your order #81 shipped
C: Message-ID: &lt;o-81-shipped@shop.example.com&gt;
C:
C: Hi Dana, ...
C: .
S: 250 2.0.0 OK queued as 7A1F
C: QUIT</pre>
<blockquote>💡 מהשטח: שימו לב שיש <strong>שתי כתובות "from"</strong> — ה-<code>MAIL FROM</code> של המעטפה (לאן הולכים bounces, נבדק ע"י SPF) וה-<code>From:</code> ב-header (מה שהמשתמש רואה, מוגן ע"י alignment של DMARC). Phishing חי בפער ביניהן.</blockquote>`
      }
    },
    {
      h: { en: "SPF, DKIM, DMARC — proving the mail is really yours", he: "SPF, DKIM, DMARC — להוכיח שהמייל באמת שלכם" },
      body: {
        en: `<ul>
<li><strong>SPF</strong> (TXT on the domain): which IPs/providers may send for the envelope domain. Max <strong>10 DNS lookups</strong> — each <code>include:</code> counts; exceed it and SPF = permerror.</li>
<li><strong>DKIM</strong>: the provider signs headers+body with a private key; the public key sits in DNS at <code>selector._domainkey.domain</code>. Survives forwarding (SPF doesn't). Use 2048-bit keys and rotate.</li>
<li><strong>DMARC</strong> (TXT at <code>_dmarc.domain</code>): passes if SPF <em>or</em> DKIM passes <strong>and is aligned</strong> with the visible <code>From:</code> domain. Policy <code>p=none → quarantine → reject</code>, plus <code>rua=</code> for daily aggregate reports.</li>
</ul>
<pre>shop.example.com.               TXT "v=spf1 include:amazonses.com include:sendgrid.net -all"
s1._domainkey.shop.example.com. TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOC..."
_dmarc.shop.example.com.        TXT "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@shop.example.com; adkim=r; aspf=r"

Received header at Gmail:
Authentication-Results: mx.google.com;
   dkim=pass header.i=@shop.example.com header.s=s1;
   spf=pass smtp.mailfrom=mail.shop.example.com;
   dmarc=pass (p=QUARANTINE) header.from=shop.example.com</pre>
<blockquote>⚠️ Production tip: since February 2024 <strong>Gmail and Yahoo require</strong> SPF + DKIM + a DMARC record for bulk senders (5,000+/day), plus one-click unsubscribe (<code>List-Unsubscribe-Post</code>) and a spam-complaint rate under <strong>0.3%</strong> (target &lt; 0.1%). Roll out DMARC as <code>p=none</code>, read reports for 2–4 weeks to find every legit sender (CRM, billing system, HR tool…), then tighten to quarantine/reject.</blockquote>`,
        he: `<ul>
<li><strong>SPF</strong> (TXT על הדומיין): אילו IPs/ספקים רשאים לשלוח בשם הדומיין של המעטפה. מקסימום <strong>10 חיפושי DNS</strong> — כל <code>include:</code> נספר; עוברים את זה ו-SPF = permerror.</li>
<li><strong>DKIM</strong>: הספק חותם על ה-headers וה-body עם מפתח פרטי; המפתח הציבורי יושב ב-DNS תחת <code>selector._domainkey.domain</code>. שורד forwarding (SPF לא). משתמשים במפתחות 2048-bit ומחליפים אותם.</li>
<li><strong>DMARC</strong> (TXT תחת <code>_dmarc.domain</code>): עובר אם SPF <em>או</em> DKIM עוברים <strong>ומיושרים (aligned)</strong> עם הדומיין שב-<code>From:</code> הגלוי. מדיניות <code>p=none → quarantine → reject</code>, ועוד <code>rua=</code> לדוחות aggregate יומיים.</li>
</ul>
<pre>shop.example.com.               TXT "v=spf1 include:amazonses.com include:sendgrid.net -all"
s1._domainkey.shop.example.com. TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOC..."
_dmarc.shop.example.com.        TXT "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@shop.example.com; adkim=r; aspf=r"

Received header at Gmail:
Authentication-Results: mx.google.com;
   dkim=pass header.i=@shop.example.com header.s=s1;
   spf=pass smtp.mailfrom=mail.shop.example.com;
   dmarc=pass (p=QUARANTINE) header.from=shop.example.com</pre>
<blockquote>⚠️ טיפ לפרודקשן: מאז פברואר 2024 <strong>Gmail ו-Yahoo דורשים</strong> מ-bulk senders (5,000+ ליום) SPF + DKIM + רשומת DMARC, וגם one-click unsubscribe (<code>List-Unsubscribe-Post</code>) ושיעור תלונות spam מתחת ל-<strong>0.3%</strong> (היעד &lt; 0.1%). מגלגלים DMARC כ-<code>p=none</code>, קוראים דוחות 2–4 שבועות כדי למצוא כל שולח לגיטימי (CRM, מערכת חיוב, כלי HR...), ורק אז מהדקים ל-quarantine/reject.</blockquote>`
      }
    },
    {
      h: { en: "Deliverability: reputation, warmup, bounces, and why not run your own", he: "Deliverability: מוניטין, warmup, bounces ולמה לא להריץ שרת משלכם" },
      body: {
        en: `<ul>
<li><strong>Reputation</strong> is per sending IP <em>and</em> per domain. New dedicated IP? <strong>Warm it up</strong>: e.g. 200/day → double every day or two over 4–6 weeks, starting with your most engaged users. Low volume (&lt; ~100k/month)? Use the provider's shared pool.</li>
<li><strong>Separate streams</strong>: transactional (receipts, password resets, OTP) vs marketing (newsletters) on different subdomains/IPs (<code>mail.shop.com</code> vs <code>news.shop.com</code>). A bad campaign must not send password resets to spam.</li>
<li><strong>Bounces</strong>: <em>hard</em> (5xx: user unknown, domain doesn't exist) → suppress immediately and forever. <em>Soft</em> (4xx: mailbox full, greylisting, rate-limited) → retry with backoff, suppress after N days.</li>
<li><strong>Complaints</strong> ("mark as spam") arrive via feedback loops (FBL) → suppress. Keep a <strong>suppression list</strong> checked before every send.</li>
<li><strong>Engagement &amp; hygiene</strong>: double opt-in, sunset users who haven't opened in 6–12 months, never buy lists, include <code>List-Unsubscribe</code>.</li>
</ul>
<table>
<tr><th>Provider</th><th>Sweet spot</th></tr>
<tr><td>Amazon SES</td><td>Cheapest at scale (~$0.10 / 1,000), DIY-ish, needs sandbox exit</td></tr>
<tr><td>SendGrid (Twilio)</td><td>Full-featured, templates, marketing + transactional</td></tr>
<tr><td>Mailgun</td><td>Developer-focused API, good logs/validation</td></tr>
<tr><td>Postmark</td><td>Transactional-only, very fast delivery, strict about marketing</td></tr>
</table>
<blockquote>💡 Real world: <strong>Don't run your own outbound mail server.</strong> Cloud IPs start with bad reputation, port 25 is blocked, you'd have to manage PTR records, blocklists (Spamhaus), FBLs, warmup and bounce parsing. A provider is ~$100/month for a million emails — cheaper than one engineer-day per month. Your job is the integration: webhooks for <code>delivered/bounced/complained/opened</code> events into your own DB.</blockquote>`,
        he: `<ul>
<li><strong>מוניטין</strong> נמדד לכל IP שולח <em>וגם</em> לכל דומיין. IP ייעודי חדש? <strong>מחממים אותו</strong>: למשל 200 ביום → מכפילים כל יום-יומיים לאורך 4–6 שבועות, ומתחילים מהמשתמשים הכי מעורבים. נפח נמוך (&lt; ~100K בחודש)? משתמשים ב-pool המשותף של הספק.</li>
<li><strong>להפריד זרמים</strong>: transactional (קבלות, איפוס סיסמה, OTP) מול marketing (ניוזלטרים) על subdomains/IPs שונים (<code>mail.shop.com</code> מול <code>news.shop.com</code>). קמפיין גרוע לא יכול לשלוח איפוסי סיסמה ל-spam.</li>
<li><strong>Bounces</strong>: <em>hard</em> (5xx: משתמש לא קיים, דומיין לא קיים) → suppress מיד ולתמיד. <em>Soft</em> (4xx: תיבה מלאה, greylisting, rate-limited) → retry עם backoff, ו-suppress אחרי N ימים.</li>
<li><strong>תלונות</strong> ("סמן כ-spam") מגיעות דרך feedback loops (FBL) → suppress. מחזיקים <strong>suppression list</strong> שנבדקת לפני כל שליחה.</li>
<li><strong>מעורבות והיגיינה</strong>: double opt-in, להוריד משתמשים שלא פתחו 6–12 חודשים, אף פעם לא לקנות רשימות, לכלול <code>List-Unsubscribe</code>.</li>
</ul>
<table>
<tr><th>ספק</th><th>מתאים ל-</th></tr>
<tr><td>Amazon SES</td><td>הכי זול בסקייל (~0.10$ ל-1,000), די DIY, צריך לצאת מה-sandbox</td></tr>
<tr><td>SendGrid (Twilio)</td><td>מלא פיצ'רים, templates, marketing + transactional</td></tr>
<tr><td>Mailgun</td><td>API ממוקד מפתחים, לוגים ו-validation טובים</td></tr>
<tr><td>Postmark</td><td>רק transactional, מסירה מהירה מאוד, קפדני לגבי marketing</td></tr>
</table>
<blockquote>💡 מהשטח: <strong>אל תריצו שרת מייל יוצא משלכם.</strong> IPs של ענן מתחילים עם מוניטין גרוע, פורט 25 חסום, ותצטרכו לנהל רשומות PTR, blocklists (Spamhaus), FBLs, warmup ופענוח bounces. ספק עולה ~100$ בחודש למיליון מיילים — זול מיום עבודה אחד של מהנדס בחודש. העבודה שלכם היא האינטגרציה: webhooks לאירועי <code>delivered/bounced/complained/opened</code> לתוך ה-DB שלכם.</blockquote>`
      }
    },
    {
      h: { en: "SMS: aggregators, SMPP, sender IDs, segments, OTP and fraud", he: "SMS: aggregators, SMPP, sender IDs, segments, OTP והונאות" },
      body: {
        en: `<p>Flow: your app → provider REST API (<strong>Twilio, Vonage, AWS SNS/End User Messaging, Infobip, MessageBird</strong>) → aggregator → <strong>SMPP</strong> (Short Message Peer-to-Peer, the TCP protocol carriers speak) → carrier SMSC → handset. Delivery receipts (DLRs) flow back the same way and arrive at your webhook — but many carriers send them late, wrong, or not at all.</p>
<ul>
<li><strong>Sender types</strong>: long code (normal number), <strong>short code</strong> (5–6 digits, high throughput, expensive, US/CA), toll-free, <strong>alphanumeric sender ID</strong> ("MyShop", one-way, allowed in Israel/EU, not in US).</li>
<li><strong>Registration</strong>: in the US, application-to-person traffic on long codes needs <strong>A2P 10DLC</strong> brand + campaign registration; unregistered traffic is filtered or blocked. Many countries (India DLT, etc.) have their own template registration.</li>
<li><strong>Segments &amp; cost</strong>: GSM-7 = <strong>160 chars</strong> per SMS (153 when concatenated). One emoji or Hebrew letter switches to UCS-2 = <strong>70 chars</strong> (67 concatenated). A 200-char Hebrew message = 3 segments = 3x the price. Prices range ~$0.005–0.10+ per segment by country.</li>
<li><strong>OTP best practices</strong>: 6 digits, expiry 5–10 min, max ~5 verify attempts, rate-limit sends per phone/IP/account (e.g. 3 per 10 min), store a <em>hash</em> of the code, include the domain for WebOTP/autofill (<code>@shop.example.com #123456</code>). Prefer a verify API (Twilio Verify, AWS) or TOTP/passkeys where possible.</li>
<li><strong>SMS pumping / toll fraud</strong>: bots trigger OTPs to premium numbers in expensive countries and the attacker gets a revenue share. Defenses: country allowlist, per-prefix rate limits, CAPTCHA before send, anomaly alerts on spend. Twitter reported losing ~$60M/year to it.</li>
<li><strong>Beyond SMS</strong>: WhatsApp Business API (template messages, per-conversation pricing, huge in Israel/LatAm/India), RCS (rich SMS on Android, iOS 18+).</li>
</ul>
<blockquote>⚠️ Production tip: SMS has <strong>no delivery guarantee and no ordering guarantee</strong>, and the DLR may lie. Never make a critical flow depend on SMS alone — give a fallback (voice call OTP, email, authenticator app) and a "resend" with cooldown.</blockquote>`,
        he: `<p>הזרימה: האפליקציה → REST API של ספק (<strong>Twilio, Vonage, AWS SNS/End User Messaging, Infobip, MessageBird</strong>) → aggregator → <strong>SMPP</strong> (Short Message Peer-to-Peer, פרוטוקול ה-TCP שה-carriers מדברים) → SMSC של ה-carrier → מכשיר. אישורי מסירה (DLRs) חוזרים באותה דרך ומגיעים ל-webhook שלכם — אבל הרבה carriers שולחים אותם באיחור, שגויים, או בכלל לא.</p>
<ul>
<li><strong>סוגי שולח</strong>: long code (מספר רגיל), <strong>short code</strong> (5–6 ספרות, throughput גבוה, יקר, ארה"ב/קנדה), toll-free, <strong>alphanumeric sender ID</strong> ("MyShop", חד-כיווני, מותר בישראל/אירופה, לא בארה"ב).</li>
<li><strong>רישום</strong>: בארה"ב, תעבורת application-to-person על long codes דורשת רישום <strong>A2P 10DLC</strong> של brand + campaign; תעבורה לא רשומה מסוננת או נחסמת. להרבה מדינות (DLT בהודו וכו') יש רישום templates משלהן.</li>
<li><strong>Segments ועלות</strong>: GSM-7 = <strong>160 תווים</strong> ל-SMS (153 כשמשורשר). אימוג'י אחד או אות עברית מעבירים ל-UCS-2 = <strong>70 תווים</strong> (67 משורשר). הודעה בעברית של 200 תווים = 3 segments = פי 3 במחיר. מחירים: ~0.005–0.10$+ ל-segment לפי מדינה.</li>
<li><strong>Best practices ל-OTP</strong>: 6 ספרות, תפוגה 5–10 דקות, מקסימום ~5 ניסיונות אימות, rate limit לשליחות לכל טלפון/IP/חשבון (למשל 3 ל-10 דקות), שומרים <em>hash</em> של הקוד, כוללים את הדומיין ל-WebOTP/autofill (<code>@shop.example.com #123456</code>). עדיף verify API (Twilio Verify, AWS) או TOTP/passkeys כשאפשר.</li>
<li><strong>SMS pumping / toll fraud</strong>: בוטים מפעילים OTPs למספרי פרימיום במדינות יקרות, והתוקף מקבל נתח מההכנסה. הגנות: allowlist של מדינות, rate limits לפי prefix, CAPTCHA לפני שליחה, התראות על חריגות בהוצאה. Twitter דיווחו על הפסד של ~60M$ בשנה מזה.</li>
<li><strong>מעבר ל-SMS</strong>: WhatsApp Business API (template messages, תמחור לפי שיחה, ענק בישראל/אמריקה הלטינית/הודו), RCS (SMS עשיר באנדרואיד, iOS 18+).</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: ל-SMS <strong>אין הבטחת מסירה ואין הבטחת סדר</strong>, וה-DLR יכול לשקר. אף פעם לא לבנות flow קריטי שתלוי רק ב-SMS — תנו fallback (OTP בשיחה קולית, מייל, אפליקציית authenticator) וכפתור "שלח שוב" עם cooldown.</blockquote>`
      }
    },
    {
      h: { en: "Push notifications and the notification-service architecture", he: "Push notifications וארכיטקטורת notification service" },
      body: {
        en: `<p><strong>Push</strong>: your backend never talks to the phone. It sends to <strong>APNs</strong> (Apple, HTTP/2 + JWT/cert auth) or <strong>FCM</strong> (Google, HTTP v1 API + OAuth) with a <strong>device token</strong> the app registered. Tokens change and expire — handle <code>410 Unregistered</code> / <code>UNREGISTERED</code> by deleting the token. Payload limit ~4 KB. Web push uses VAPID + the browser's push service.</p>
<p>A principal designs <strong>one notification platform</strong>, not email code sprinkled across 30 services:</p>
<pre>producer services                      notification service
 order-svc  ──┐  NotifyRequested{       ┌─&gt; preferences + quiet hours + opt-outs (DB)
 auth-svc   ──┼─&gt;  idempotencyKey,  ─&gt; [queue] ─&gt; router ─&gt; template render (i18n: he/en)
 billing-svc──┘    userId, template,    │            ├─&gt; [email queue] ─&gt; SES / SendGrid
                   data, priority }     │            ├─&gt; [sms queue]   ─&gt; Twilio  (rate-limited)
                                        │            └─&gt; [push queue]  ─&gt; APNs / FCM
                                        └─&lt; provider webhooks: delivered / bounced / clicked
                                            -&gt; status table, suppression list, metrics</pre>
<ul>
<li><strong>Idempotency</strong>: producers retry; key = <code>orderId + "shipped" + channel</code>. Dedupe before sending — "you were charged" twice is a support ticket; an OTP sent 5 times is a bill.</li>
<li><strong>Priority lanes</strong>: OTP/security queue separate from marketing so a 2M-user campaign never delays a login code.</li>
<li><strong>Retries</strong>: exponential backoff + jitter on 5xx/timeouts; never retry 4xx validation errors; DLQ after N tries.</li>
<li><strong>Fallback</strong>: push not delivered within X min → SMS; SMS failed → email. Respect user channel preferences and legal consent (GDPR, Israel's anti-spam law, TCPA in the US).</li>
<li><strong>Provider failover</strong>: two SMS/email providers behind an interface with a circuit breaker — providers do have multi-hour outages.</li>
<li><strong>Observability</strong>: per channel/provider/country: send rate, delivery rate, bounce/complaint rate, latency enqueue→delivered, cost per day.</li>
</ul>`,
        he: `<p><strong>Push</strong>: ה-backend שלכם אף פעם לא מדבר עם הטלפון ישירות. הוא שולח ל-<strong>APNs</strong> (Apple, HTTP/2 + אימות JWT/cert) או ל-<strong>FCM</strong> (Google, HTTP v1 API + OAuth) עם <strong>device token</strong> שהאפליקציה רשמה. Tokens משתנים ופגים — מטפלים ב-<code>410 Unregistered</code> / <code>UNREGISTERED</code> ע"י מחיקת ה-token. מגבלת payload ~4KB. Web push משתמש ב-VAPID + שירות ה-push של הדפדפן.</p>
<p>Principal מתכנן <strong>פלטפורמת התראות אחת</strong>, לא קוד מייל שמפוזר על 30 שירותים:</p>
<pre>producer services                      notification service
 order-svc  ──┐  NotifyRequested{       ┌─&gt; preferences + quiet hours + opt-outs (DB)
 auth-svc   ──┼─&gt;  idempotencyKey,  ─&gt; [queue] ─&gt; router ─&gt; template render (i18n: he/en)
 billing-svc──┘    userId, template,    │            ├─&gt; [email queue] ─&gt; SES / SendGrid
                   data, priority }     │            ├─&gt; [sms queue]   ─&gt; Twilio  (rate-limited)
                                        │            └─&gt; [push queue]  ─&gt; APNs / FCM
                                        └─&lt; provider webhooks: delivered / bounced / clicked
                                            -&gt; status table, suppression list, metrics</pre>
<ul>
<li><strong>אידמפוטנטיות</strong>: ה-producers עושים retry; המפתח = <code>orderId + "shipped" + channel</code>. עושים dedupe לפני השליחה — "חויבת" פעמיים זה טיקט לתמיכה; OTP שנשלח 5 פעמים זה חשבונית.</li>
<li><strong>נתיבי עדיפות</strong>: תור OTP/אבטחה נפרד מ-marketing, כך שקמפיין ל-2M משתמשים אף פעם לא מעכב קוד התחברות.</li>
<li><strong>Retries</strong>: exponential backoff + jitter על 5xx/timeouts; אף פעם לא retry על שגיאות 4xx של validation; DLQ אחרי N ניסיונות.</li>
<li><strong>Fallback</strong>: push לא נמסר תוך X דקות → SMS; SMS נכשל → מייל. מכבדים את העדפות הערוץ של המשתמש ואת ההסכמה החוקית (GDPR, חוק הספאם בישראל, TCPA בארה"ב).</li>
<li><strong>Failover בין ספקים</strong>: שני ספקי SMS/מייל מאחורי interface עם circuit breaker — לספקים יש תקלות של כמה שעות.</li>
<li><strong>Observability</strong>: לכל ערוץ/ספק/מדינה: קצב שליחה, אחוז מסירה, אחוז bounce/תלונות, latency מ-enqueue עד delivered, ועלות ליום.</li>
</ul>`
      }
    }
  ],
  diagram: `EMAIL                                         SMS                          PUSH
app --587/TLS--> provider (SES)               app --HTTPS--> Twilio        app --HTTP/2--> APNs / FCM
                  | DKIM-sign                                  |                                |
                  | dig MX gmail.com                   aggregator                         device token
                  v                                            | SMPP                           v
             gmail MX --25--> checks:                    carrier SMSC                        phone
               SPF (envelope IP allowed?)                      |
               DKIM (signature valid?)                      handset
               DMARC (aligned with From:? policy)              |
               reputation, content                   DLR --> your webhook (maybe)
                  v
           inbox | spam | reject  --> webhook: delivered/bounced/complained`,
  handsOn: [
    { cmd: "dig +short MX gmail.com && dig +short TXT gmail.com | grep spf && dig +short TXT _dmarc.gmail.com", what: { en: "Read a real domain's MX, SPF and DMARC records.", he: "קוראים את רשומות ה-MX, SPF ו-DMARC של דומיין אמיתי." } },
    { cmd: "dig +short TXT google._domainkey.github.com", what: { en: "Fetch a DKIM public key by selector (selector 'google' for a Google Workspace domain).", he: "מושכים מפתח DKIM ציבורי לפי selector (ה-selector 'google' לדומיין של Google Workspace)." } },
    { cmd: "swaks --to you@example.com --from test@yourdomain.com --server smtp.yourprovider.com:587 --tls --auth LOGIN --auth-user USER --auth-password PASS", what: { en: "Send a test email over submission port 587 with STARTTLS and watch every SMTP command/response.", he: "שולחים מייל בדיקה דרך פורט ה-submission 587 עם STARTTLS ורואים כל פקודה ותשובה של SMTP." } },
    { cmd: "openssl s_client -starttls smtp -connect smtp.gmail.com:587 -crlf -quiet", what: { en: "Open a raw TLS SMTP session by hand; type EHLO test and see the server's capabilities.", he: "פותחים session גולמי של SMTP מעל TLS ביד; מקלידים EHLO test ורואים את היכולות של השרת." } },
    { cmd: "python -c \"s='שלום, ההזמנה שלך נשלחה!'; print(len(s), 'chars ->', 'UCS-2, 70/segment' if any(ord(c)>127 for c in s) else 'GSM-7, 160/segment')\"", what: { en: "Check whether a message forces UCS-2 encoding (Hebrew/emoji) and how many chars fit in one SMS segment.", he: "בודקים אם הודעה מכריחה קידוד UCS-2 (עברית/אימוג'י) וכמה תווים נכנסים ב-segment אחד של SMS." } }
  ],
  mnemonic: {
    en: "SPF = Sender's Permitted Fleet (which IPs), DKIM = Digital Kiss (signature), DMARC = Do Me A Rule if Checks fail. SMS: '160 English, 70 Hebrew — and every OTP needs a rate limit.'",
    he: "SPF = רשימת המשאיות המורשות (אילו IPs), DKIM = חותם השעווה (חתימה), DMARC = ההוראה מה לעשות כשהבדיקה נכשלת. SMS: '160 באנגלית, 70 בעברית — ולכל OTP צריך rate limit.'"
  },
  pitfalls: [
    { en: "Sending password resets and marketing from the same IP/domain: one complaint-heavy campaign puts your login emails in spam.", he: "לשלוח איפוסי סיסמה ו-marketing מאותו IP/דומיין: קמפיין אחד עם הרבה תלונות שולח את מיילי ההתחברות ל-spam." },
    { en: "Jumping straight to DMARC p=reject: your CRM, invoicing tool and HR system that send 'as you' suddenly get rejected. Start with p=none and read reports.", he: "לקפוץ ישר ל-DMARC p=reject: ה-CRM, כלי החשבוניות ומערכת ה-HR ששולחים 'בשמכם' פתאום נדחים. מתחילים ב-p=none וקוראים את הדוחות." },
    { en: "An OTP endpoint without rate limits or country restrictions — SMS pumping fraud can burn tens of thousands of dollars overnight.", he: "Endpoint של OTP בלי rate limits או הגבלת מדינות — הונאת SMS pumping יכולה לשרוף עשרות אלפי דולרים בלילה אחד." },
    { en: "Non-idempotent notification consumers: a queue redelivery sends the customer 'Payment received' three times.", he: "Consumers של התראות שאינם אידמפוטנטיים: redelivery מהתור שולח ללקוח 'התשלום התקבל' שלוש פעמים." }
  ],
  interview: [
    { q: { en: "Our password-reset emails land in spam. How do you debug it?", he: "מיילי איפוס הסיסמה שלנו נוחתים ב-spam. איך מדבגים?" },
      a: { en: "Open the received message's Authentication-Results header: check SPF (envelope IP allowed, under 10 lookups), DKIM (valid signature, aligned domain) and DMARC (alignment with header From). Check the sending IP/domain in Google Postmaster Tools and blocklists (Spamhaus), the complaint rate (&lt; 0.1%), and whether transactional shares an IP/subdomain with marketing. Then content: link domains, URL shorteners, image-only mail. Fix: separate transactional subdomain, proper DKIM, DMARC alignment, suppression of bounces/complaints, warmup if a new IP.", he: "פותחים את ה-header של Authentication-Results בהודעה שהתקבלה: בודקים SPF (ה-IP של המעטפה מורשה, פחות מ-10 lookups), DKIM (חתימה תקינה, דומיין מיושר) ו-DMARC (alignment מול ה-From). בודקים את ה-IP/דומיין השולח ב-Google Postmaster Tools וב-blocklists (Spamhaus), את שיעור התלונות (&lt; 0.1%), והאם transactional חולק IP/subdomain עם marketing. אחר כך תוכן: דומיינים של לינקים, URL shorteners, מייל שכולו תמונה. תיקון: subdomain נפרד ל-transactional, DKIM תקין, DMARC alignment, suppression של bounces ותלונות, ו-warmup אם זה IP חדש." } },
    { q: { en: "Design OTP-over-SMS login for 10M users. What do you worry about?", he: "תכננו התחברות עם OTP ב-SMS ל-10M משתמשים. ממה אתם חוששים?" },
      a: { en: "Fraud and cost first: SMS pumping (country allowlist, per-phone/IP/prefix rate limits, CAPTCHA, spend alerts). Security: 6-digit code, hashed, 5-10 min TTL, max attempts, single use, no enumeration in responses. Reliability: two providers with failover, DLR tracking, resend with cooldown, voice/email/TOTP fallback, a dedicated high-priority queue. Compliance: sender registration (10DLC, alphanumeric IDs), localization and UCS-2 segment cost. Metrics: send→verify conversion per country/provider — a sudden drop is your best outage signal.", he: "קודם כל הונאה ועלות: SMS pumping (allowlist של מדינות, rate limits לפי טלפון/IP/prefix, CAPTCHA, התראות על הוצאות). אבטחה: קוד של 6 ספרות, ב-hash, TTL של 5-10 דקות, מקסימום ניסיונות, שימוש יחיד, בלי enumeration בתשובות. אמינות: שני ספקים עם failover, מעקב DLR, שליחה חוזרת עם cooldown, fallback לקולי/מייל/TOTP, תור ייעודי בעדיפות גבוהה. Compliance: רישום שולח (10DLC, alphanumeric IDs), לוקליזציה ועלות segments ב-UCS-2. מטריקות: המרה מ-send ל-verify לפי מדינה/ספק — ירידה פתאומית היא סימן ה-outage הכי טוב שלכם." } }
  ],
  quiz: [
    { q: { en: "Which port should your application use to submit mail to a provider?", he: "באיזה פורט האפליקציה צריכה להשתמש כדי להגיש מייל לספק?" },
      options: [
        { en: "25", he: "25" },
        { en: "587 (STARTTLS + AUTH) or 465", he: "587 (STARTTLS + AUTH) או 465" },
        { en: "993", he: "993" },
        { en: "110", he: "110" }
      ], answer: 1,
      explain: { en: "587/465 are submission ports. 25 is server-to-server relay and blocked outbound in most clouds; 993/110 are IMAP/POP3 for reading.", he: "587/465 הם פורטי submission. 25 הוא relay בין שרתים וחסום ליציאה ברוב העננים; 993/110 הם IMAP/POP3 לקריאה." } },
    { q: { en: "What does DMARC add on top of SPF and DKIM?", he: "מה DMARC מוסיף מעל SPF ו-DKIM?" },
      options: [
        { en: "Encryption of the message body", he: "הצפנה של גוף ההודעה" },
        { en: "Alignment with the visible From: domain, a policy (none/quarantine/reject) and reporting", he: "Alignment מול הדומיין שב-From: הגלוי, מדיניות (none/quarantine/reject) ודיווח" },
        { en: "A list of allowed sending IPs", he: "רשימת IPs מורשים לשליחה" },
        { en: "Faster delivery", he: "מסירה מהירה יותר" }
      ], answer: 1,
      explain: { en: "SPF lists IPs, DKIM signs; DMARC ties a passing check to the From: domain users see and tells receivers what to do on failure.", he: "SPF מונה IPs, DKIM חותם; DMARC קושר בדיקה שעברה לדומיין ב-From: שהמשתמש רואה, ואומר למקבלים מה לעשות כשנכשל." } },
    { q: { en: "A 100-character SMS in Hebrew costs how many segments?", he: "SMS של 100 תווים בעברית עולה כמה segments?" },
      options: [
        { en: "1 — up to 160 chars fit", he: "1 — עד 160 תווים נכנסים" },
        { en: "2 — Hebrew forces UCS-2 (70 chars, 67 per part when concatenated)", he: "2 — עברית מכריחה UCS-2 (70 תווים, 67 לחלק כשמשורשר)" },
        { en: "4", he: "4" },
        { en: "Hebrew can't be sent by SMS", he: "אי אפשר לשלוח עברית ב-SMS" }
      ], answer: 1,
      explain: { en: "Non-GSM-7 characters switch the whole message to UCS-2: 70 chars single, 67 per segment concatenated → 100 chars = 2 segments.", he: "תווים שאינם GSM-7 מעבירים את כל ההודעה ל-UCS-2: 70 תווים להודעה בודדת, 67 ל-segment משורשר → 100 תווים = 2 segments." } },
    { q: { en: "Best defense against SMS pumping fraud on an OTP endpoint?", he: "ההגנה הכי טובה מפני SMS pumping על endpoint של OTP?" },
      options: [
        { en: "Longer OTP codes", he: "קודי OTP ארוכים יותר" },
        { en: "Country allowlist, per-phone/IP/prefix rate limits, CAPTCHA and spend anomaly alerts", he: "Allowlist של מדינות, rate limits לפי טלפון/IP/prefix, CAPTCHA והתראות על חריגות בהוצאה" },
        { en: "Sending OTPs over HTTP/3", he: "לשלוח OTPs מעל HTTP/3" },
        { en: "Using a short code", he: "להשתמש ב-short code" }
      ], answer: 1,
      explain: { en: "Pumping abuses volume to premium numbers; you must limit who/where/how often you send and alert on spend.", he: "Pumping מנצל נפח שליחה למספרי פרימיום; חייבים להגביל למי/לאן/כמה פעמים שולחים ולהתריע על הוצאות." } }
  ],
  related: ["net-dns", "arch-queues", "pr-idempotency", "pr-rate-limiters", "pr-third-party-deps", "pr-queue-kinds"]
});

INFRA.lessons.push({
  id: "pr-realtime-protocols",
  track: "principal",
  order: 52,
  icon: "⚡",
  level: 3,
  minutes: 15,
  title: { en: "Real-Time Protocols: Polling, SSE, WebSockets, WebRTC, gRPC, MQTT, AMQP", he: "פרוטוקולי real-time: Polling, SSE, WebSockets, WebRTC, gRPC, MQTT, AMQP" },
  tldr: {
    en: "Pick by direction and audience: server→browser only = SSE; two-way browser chat = WebSockets; audio/video peer-to-peer = WebRTC; service-to-service = gRPC; millions of flaky IoT devices = MQTT; backend work routing = AMQP. And size by connections, not requests.",
    he: "בוחרים לפי כיוון וקהל: רק שרת→דפדפן = SSE; צ'אט דו-כיווני בדפדפן = WebSockets; אודיו/וידאו peer-to-peer = WebRTC; service-to-service = gRPC; מיליוני מכשירי IoT לא יציבים = MQTT; ניתוב עבודה ב-backend = AMQP. ועושים sizing לפי connections, לא לפי בקשות."
  },
  analogy: {
    en: "Short polling is a kid in the back seat asking 'are we there yet?' every 5 seconds. Long polling is asking once and the parent only answers when you arrive. SSE is the car radio: the station talks, you listen. WebSockets is a phone call: both sides talk any time on an open line. WebRTC is two walkie-talkies talking directly, with a switchboard (signaling) only to introduce them. MQTT is a mail-room with labeled pigeonholes (topics) built for devices with bad reception — it even holds your 'last will' letter to deliver if you vanish.",
    he: "Short polling זה ילד במושב האחורי ששואל 'הגענו?' כל 5 שניות. Long polling זה לשאול פעם אחת, וההורה עונה רק כשמגיעים. SSE זה הרדיו באוטו: התחנה מדברת, אתם מקשיבים. WebSockets זו שיחת טלפון: שני הצדדים מדברים מתי שרוצים על קו פתוח. WebRTC אלה שני מכשירי קשר שמדברים ישירות, עם מרכזייה (signaling) רק כדי להכיר ביניהם. MQTT זה חדר דואר עם תאים מסומנים (topics) שנבנה למכשירים עם קליטה גרועה — הוא אפילו שומר את 'הצוואה' שלכם (last will) ומוסר אותה אם נעלמתם."
  },
  sections: [
    {
      h: { en: "Polling, long polling and SSE: the HTTP-only options", he: "Polling, long polling ו-SSE: האפשרויות שהן רק HTTP" },
      body: {
        en: `<ul>
<li><strong>Short polling</strong>: <code>GET /updates?since=123</code> every N seconds. Dead simple, cache/CDN friendly, works everywhere. Cost: latency up to N seconds and mostly-empty responses. 1M clients every 5 s = <strong>200k req/s</strong> of "nothing new". Fine for dashboards refreshing every 30–60 s.</li>
<li><strong>Long polling</strong>: the server holds the request open until there's data or ~30 s passes, then the client immediately re-requests. Near-real-time over plain HTTP; each held request ties up a connection (cheap with async servers, deadly with thread-per-request).</li>
<li><strong>Server-Sent Events (SSE)</strong>: one long HTTP response with <code>Content-Type: text/event-stream</code>; the server writes events as lines. Built into browsers (<code>EventSource</code>) with <strong>automatic reconnect</strong> and resume via <code>Last-Event-ID</code>. One-way: server → client (client → server uses normal POSTs). Works through most proxies; over HTTP/2 many SSE streams share one connection (on HTTP/1.1 browsers cap at 6 per domain).</li>
</ul>
<pre>GET /orders/81/stream HTTP/1.1
Accept: text/event-stream
Last-Event-ID: 41

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

id: 42
event: status
data: {"orderId":"o-81","status":"PACKED"}

: heartbeat  (comment line every 15s keeps proxies from closing it)

id: 43
event: status
data: {"orderId":"o-81","status":"SHIPPED"}</pre>
<blockquote>💡 Real world: <strong>LLM token streaming</strong> (OpenAI, Anthropic, Gemini APIs, ChatGPT-style UIs) uses SSE — the server pushes tokens, the client never needs to talk mid-stream, and it's plain HTTP that every gateway understands. Remember to disable proxy buffering (<code>proxy_buffering off;</code> or <code>X-Accel-Buffering: no</code> in nginx) or tokens arrive in one lump at the end.</blockquote>`,
        he: `<ul>
<li><strong>Short polling</strong>: <code>GET /updates?since=123</code> כל N שניות. פשוט לגמרי, ידידותי ל-cache/CDN, עובד בכל מקום. המחיר: latency של עד N שניות ותשובות שרובן ריקות. 1M לקוחות כל 5 שניות = <strong>200K בקשות בשנייה</strong> של "אין חדש". מתאים לדשבורדים שמתרעננים כל 30–60 שניות.</li>
<li><strong>Long polling</strong>: השרת מחזיק את הבקשה פתוחה עד שיש נתונים או שעוברות ~30 שניות, ואז הלקוח מיד שולח בקשה חדשה. כמעט real-time מעל HTTP רגיל; כל בקשה מוחזקת תופסת connection (זול עם שרתים אסינכרוניים, קטלני עם thread לכל בקשה).</li>
<li><strong>Server-Sent Events (SSE)</strong>: תשובת HTTP ארוכה אחת עם <code>Content-Type: text/event-stream</code>; השרת כותב events כשורות. מובנה בדפדפנים (<code>EventSource</code>) עם <strong>reconnect אוטומטי</strong> והמשך דרך <code>Last-Event-ID</code>. חד-כיווני: שרת → לקוח (לקוח → שרת עם POSTs רגילים). עובר דרך רוב ה-proxies; מעל HTTP/2 הרבה streams של SSE חולקים connection אחד (ב-HTTP/1.1 דפדפנים מגבילים ל-6 לדומיין).</li>
</ul>
<pre>GET /orders/81/stream HTTP/1.1
Accept: text/event-stream
Last-Event-ID: 41

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

id: 42
event: status
data: {"orderId":"o-81","status":"PACKED"}

: heartbeat  (comment line every 15s keeps proxies from closing it)

id: 43
event: status
data: {"orderId":"o-81","status":"SHIPPED"}</pre>
<blockquote>💡 מהשטח: <strong>הזרמת tokens של LLM</strong> (ה-APIs של OpenAI, Anthropic, Gemini, וממשקים בסגנון ChatGPT) משתמשת ב-SSE — השרת דוחף tokens, הלקוח לא צריך לדבר באמצע, וזה HTTP רגיל שכל gateway מבין. תזכרו לכבות buffering ב-proxy (<code>proxy_buffering off;</code> או <code>X-Accel-Buffering: no</code> ב-nginx), אחרת ה-tokens מגיעים בגוש אחד בסוף.</blockquote>`
      }
    },
    {
      h: { en: "WebSockets: the upgrade handshake, frames, and scaling them", he: "WebSockets: ה-upgrade handshake, frames, ואיך עושים להם scale" },
      body: {
        en: `<p>A WebSocket starts as an HTTP/1.1 request that asks to <strong>upgrade</strong> the TCP connection; after <code>101 Switching Protocols</code> it's a full-duplex, message-framed channel (text/binary frames, ping/pong control frames, close frame). <code>wss://</code> = over TLS on 443, which gets through almost every corporate proxy.</p>
<pre>GET /chat HTTP/1.1
Host: chat.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Sec-WebSocket-Protocol: chat.v2

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=</pre>
<p><strong>Scaling stateful connections</strong> is the real design problem:</p>
<ul>
<li>User A is connected to pod 3, user B to pod 7. A message from A to B needs a <strong>pub/sub backplane</strong> (Redis Pub/Sub, NATS, Kafka) — or a connection registry <code>userId → gatewayPod</code>.</li>
<li>Split <strong>connection gateways</strong> (hold sockets, dumb, scale on connection count) from <strong>business services</strong> (stateless, scale on CPU).</li>
<li>Load balancers: idle timeouts (AWS ALB default 60 s) kill quiet sockets → send <strong>heartbeats</strong> (ping every 20–30 s). Sticky sessions only matter for fallback transports (Socket.IO polling).</li>
<li><strong>Deploys</strong> drop every connection on a pod: drain gradually, clients must <strong>reconnect with exponential backoff + jitter</strong> and resume from a sequence number — otherwise a deploy becomes a thundering-herd reconnect storm.</li>
<li>Authenticate on connect (token in the first message or a short-lived ticket; browsers can't set custom headers on WebSocket), re-check on token expiry, and rate-limit messages per connection.</li>
</ul>
<blockquote>💡 Real world: Slack's real-time architecture uses edge "gateway servers" holding WebSocket connections and a channel server layer for fan-out; Discord holds millions of concurrent sockets on Elixir gateways. Managed options: AWS API Gateway WebSockets, Azure Web PubSub, Pusher, Ably.</blockquote>`,
        he: `<p>WebSocket מתחיל כבקשת HTTP/1.1 שמבקשת לעשות <strong>upgrade</strong> ל-connection של TCP; אחרי <code>101 Switching Protocols</code> זה ערוץ full-duplex עם framing של הודעות (frames של text/binary, frames בקרה ping/pong, frame סגירה). <code>wss://</code> = מעל TLS בפורט 443, ועובר כמעט כל proxy ארגוני.</p>
<pre>GET /chat HTTP/1.1
Host: chat.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Sec-WebSocket-Protocol: chat.v2

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=</pre>
<p><strong>Scale ל-connections עם state</strong> היא בעיית התכנון האמיתית:</p>
<ul>
<li>משתמש A מחובר ל-pod 3, משתמש B ל-pod 7. הודעה מ-A ל-B צריכה <strong>pub/sub backplane</strong> (Redis Pub/Sub, NATS, Kafka) — או registry של connections <code>userId → gatewayPod</code>.</li>
<li>מפרידים <strong>connection gateways</strong> (מחזיקים sockets, טיפשים, scale לפי מספר connections) מ-<strong>שירותים עסקיים</strong> (stateless, scale לפי CPU).</li>
<li>Load balancers: idle timeouts (ברירת המחדל ב-AWS ALB היא 60 שניות) הורגים sockets שקטים → שולחים <strong>heartbeats</strong> (ping כל 20–30 שניות). Sticky sessions חשובים רק ל-transports של fallback (Socket.IO polling).</li>
<li><strong>Deploys</strong> מפילים כל connection ב-pod: עושים drain בהדרגה, והלקוחות חייבים <strong>להתחבר מחדש עם exponential backoff + jitter</strong> ולהמשיך ממספר רצף — אחרת deploy הופך לסופת reconnects (thundering herd).</li>
<li>אימות בהתחברות (token בהודעה הראשונה או ticket קצר-מועד; דפדפנים לא יכולים לשים headers מותאמים ב-WebSocket), בדיקה מחדש כשה-token פג, ו-rate limit להודעות לכל connection.</li>
</ul>
<blockquote>💡 מהשטח: ארכיטקטורת ה-real-time של Slack משתמשת ב-"gateway servers" ב-edge שמחזיקים connections של WebSocket ובשכבת channel servers ל-fan-out; Discord מחזיקים מיליוני sockets במקביל על gateways ב-Elixir. אפשרויות managed: AWS API Gateway WebSockets, Azure Web PubSub, Pusher, Ably.</blockquote>`
      }
    },
    {
      h: { en: "WebRTC, gRPC streaming, MQTT, AMQP, WebTransport", he: "WebRTC, gRPC streaming, MQTT, AMQP, WebTransport" },
      body: {
        en: `<ul>
<li><strong>WebRTC</strong>: browser-native peer-to-peer audio/video/data over UDP (SRTP, DTLS, SCTP data channels). You still need a <strong>signaling</strong> server (usually WebSocket) to exchange SDP offers/answers, <strong>STUN</strong> to learn your public IP behind NAT, and <strong>TURN</strong> to relay media when P2P fails (~10–20% of calls, typically behind symmetric NAT/corporate firewalls — TURN bandwidth is your biggest bill). Group calls use an <strong>SFU</strong> (selective forwarding unit: LiveKit, mediasoup, Janus) instead of full mesh.</li>
<li><strong>gRPC</strong>: Protobuf contracts over HTTP/2. Four modes: unary, server-streaming, client-streaming, bidirectional streaming. Great for service-to-service (typed, compact, codegen, deadlines). In browsers you need gRPC-Web or Connect via a proxy.</li>
<li><strong>MQTT</strong>: tiny pub/sub protocol for IoT (2-byte minimum header) over TCP/TLS (1883/8883) or WebSockets. A <strong>broker</strong> (Mosquitto, EMQX, HiveMQ, AWS IoT Core) routes by hierarchical topics (<code>factory/line3/+/temp</code>, <code>#</code> wildcard). <strong>QoS 0</strong> at-most-once, <strong>QoS 1</strong> at-least-once (duplicates possible), <strong>QoS 2</strong> exactly-once (4-step handshake, slowest). <strong>Retained</strong> messages give new subscribers the last value; <strong>Last Will</strong> is published by the broker when a device disconnects ungracefully; persistent sessions queue messages while offline.</li>
<li><strong>AMQP 0-9-1</strong> (RabbitMQ): producers publish to <strong>exchanges</strong> (direct, topic, fanout, headers), bindings route to <strong>queues</strong>, consumers ack. A backend work-routing protocol, not something browsers speak.</li>
<li><strong>WebTransport</strong>: the newer browser API over HTTP/3/QUIC — multiple streams + unreliable datagrams without TCP HOL blocking. Good for games and live media; support still maturing (Safari lagging).</li>
</ul>
<pre>proto:  service Prices { rpc Watch(Symbol) returns (stream Quote); }
mqtt:   mosquitto_pub -h broker -t 'factory/line3/m7/temp' -m '71.4' -q 1 -r
amqp:   publish(exchange="orders", routing_key="order.created.il", body=...)
        binding: queue "billing" &lt;- "order.created.*"</pre>`,
        he: `<ul>
<li><strong>WebRTC</strong>: אודיו/וידאו/נתונים peer-to-peer מובנה בדפדפן מעל UDP (SRTP, DTLS, data channels של SCTP). עדיין צריך שרת <strong>signaling</strong> (בדרך כלל WebSocket) כדי להחליף SDP offers/answers, <strong>STUN</strong> כדי לגלות את ה-IP הציבורי מאחורי NAT, ו-<strong>TURN</strong> כדי להעביר מדיה כש-P2P נכשל (~10–20% מהשיחות, בדרך כלל מאחורי symmetric NAT/firewalls ארגוניים — רוחב הפס של TURN הוא החשבון הכי גדול שלכם). שיחות קבוצתיות משתמשות ב-<strong>SFU</strong> (selective forwarding unit: LiveKit, mediasoup, Janus) במקום full mesh.</li>
<li><strong>gRPC</strong>: חוזי Protobuf מעל HTTP/2. ארבעה מצבים: unary, server-streaming, client-streaming, bidirectional streaming. מצוין ל-service-to-service (טיפוסים, קומפקטי, codegen, deadlines). בדפדפן צריך gRPC-Web או Connect דרך proxy.</li>
<li><strong>MQTT</strong>: פרוטוקול pub/sub זעיר ל-IoT (header מינימלי של 2 bytes) מעל TCP/TLS (1883/8883) או WebSockets. <strong>Broker</strong> (Mosquitto, EMQX, HiveMQ, AWS IoT Core) מנתב לפי topics היררכיים (<code>factory/line3/+/temp</code>, wildcard <code>#</code>). <strong>QoS 0</strong> at-most-once, <strong>QoS 1</strong> at-least-once (ייתכנו כפילויות), <strong>QoS 2</strong> exactly-once (handshake של 4 שלבים, הכי איטי). הודעות <strong>Retained</strong> נותנות ל-subscribers חדשים את הערך האחרון; <strong>Last Will</strong> מתפרסם ע"י ה-broker כשמכשיר מתנתק בלי סגירה מסודרת; persistent sessions שומרות הודעות בזמן שהמכשיר offline.</li>
<li><strong>AMQP 0-9-1</strong> (RabbitMQ): producers מפרסמים ל-<strong>exchanges</strong> (direct, topic, fanout, headers), bindings מנתבים ל-<strong>queues</strong>, consumers עושים ack. פרוטוקול לניתוב עבודה ב-backend, לא משהו שדפדפנים מדברים.</li>
<li><strong>WebTransport</strong>: ה-API החדש בדפדפן מעל HTTP/3/QUIC — כמה streams + datagrams לא אמינים בלי HOL blocking של TCP. טוב למשחקים ומדיה חיה; התמיכה עדיין מתבגרת (Safari מפגר).</li>
</ul>
<pre>proto:  service Prices { rpc Watch(Symbol) returns (stream Quote); }
mqtt:   mosquitto_pub -h broker -t 'factory/line3/m7/temp' -m '71.4' -q 1 -r
amqp:   publish(exchange="orders", routing_key="order.created.il", body=...)
        binding: queue "billing" &lt;- "order.created.*"</pre>`
      }
    },
    {
      h: { en: "The decision table", he: "טבלת ההחלטה" },
      body: {
        en: `<table>
<tr><th>Protocol</th><th>Direction</th><th>Transport</th><th>Browser</th><th>Through proxies</th><th>Use it for</th></tr>
<tr><td>Short polling</td><td>client pulls</td><td>HTTP</td><td>Yes</td><td>Perfect</td><td>Slow-changing dashboards, job status every 30 s</td></tr>
<tr><td>Long polling</td><td>server→client (emulated)</td><td>HTTP</td><td>Yes</td><td>Good</td><td>Legacy fallback, simple notifications</td></tr>
<tr><td>SSE</td><td>server→client</td><td>HTTP/1.1, HTTP/2</td><td>Yes (EventSource)</td><td>Good (disable buffering)</td><td>LLM token streaming, live scores, feeds, progress bars</td></tr>
<tr><td>WebSocket</td><td>bidirectional</td><td>TCP (HTTP upgrade)</td><td>Yes</td><td>Mostly (wss)</td><td>Chat, collaborative editing, multiplayer, trading UIs</td></tr>
<tr><td>WebRTC</td><td>peer-to-peer</td><td>UDP (+TURN relay)</td><td>Yes</td><td>Via TURN/443</td><td>Video/voice calls, screen share, P2P data</td></tr>
<tr><td>gRPC</td><td>unary + streams</td><td>HTTP/2</td><td>Via gRPC-Web</td><td>Needs h2-aware LB</td><td>Service-to-service, internal streaming APIs</td></tr>
<tr><td>MQTT</td><td>pub/sub via broker</td><td>TCP/TLS, WS</td><td>Via WS</td><td>OK</td><td>IoT, mobile on flaky networks, telemetry</td></tr>
<tr><td>AMQP</td><td>pub/sub, queues</td><td>TCP</td><td>No</td><td>Internal</td><td>Backend task routing, work queues</td></tr>
<tr><td>WebTransport</td><td>bidirectional, streams + datagrams</td><td>HTTP/3 (QUIC)</td><td>Partial</td><td>Needs UDP</td><td>Games, live media, low-latency streams</td></tr>
</table>
<p><strong>Principal's questions</strong> before picking: Who talks — browser, mobile, device, service? Which direction? How many concurrent connections at peak? What latency is "real-time" here — 50 ms or 5 s? Is message loss OK, and is order needed? What happens on reconnect (resume from offset or full refresh)? Does it pass the customer's corporate proxy? Can we buy it (Pusher, Ably, AWS IoT Core, LiveKit Cloud) rather than build it?</p>
<blockquote>⚠️ Production tip: the most common over-engineering is WebSockets for something that is one-way. If clients only receive updates, <strong>SSE is simpler</strong> (plain HTTP, automatic reconnect, works with existing auth cookies, middleware and observability).</blockquote>`,
        he: `<table>
<tr><th>פרוטוקול</th><th>כיוון</th><th>Transport</th><th>דפדפן</th><th>דרך proxies</th><th>להשתמש בו ל-</th></tr>
<tr><td>Short polling</td><td>הלקוח מושך</td><td>HTTP</td><td>כן</td><td>מושלם</td><td>דשבורדים שמשתנים לאט, סטטוס job כל 30 שניות</td></tr>
<tr><td>Long polling</td><td>שרת→לקוח (מדומה)</td><td>HTTP</td><td>כן</td><td>טוב</td><td>fallback ישן, התראות פשוטות</td></tr>
<tr><td>SSE</td><td>שרת→לקוח</td><td>HTTP/1.1, HTTP/2</td><td>כן (EventSource)</td><td>טוב (לכבות buffering)</td><td>הזרמת tokens של LLM, תוצאות חיות, feeds, progress bars</td></tr>
<tr><td>WebSocket</td><td>דו-כיווני</td><td>TCP (HTTP upgrade)</td><td>כן</td><td>ברוב המקרים (wss)</td><td>צ'אט, עריכה משותפת, multiplayer, ממשקי מסחר</td></tr>
<tr><td>WebRTC</td><td>peer-to-peer</td><td>UDP (+TURN relay)</td><td>כן</td><td>דרך TURN/443</td><td>שיחות וידאו/קול, שיתוף מסך, נתונים P2P</td></tr>
<tr><td>gRPC</td><td>unary + streams</td><td>HTTP/2</td><td>דרך gRPC-Web</td><td>צריך LB שמבין h2</td><td>Service-to-service, APIs פנימיים עם streaming</td></tr>
<tr><td>MQTT</td><td>pub/sub דרך broker</td><td>TCP/TLS, WS</td><td>דרך WS</td><td>בסדר</td><td>IoT, מובייל ברשתות לא יציבות, טלמטריה</td></tr>
<tr><td>AMQP</td><td>pub/sub, תורים</td><td>TCP</td><td>לא</td><td>פנימי</td><td>ניתוב משימות ב-backend, work queues</td></tr>
<tr><td>WebTransport</td><td>דו-כיווני, streams + datagrams</td><td>HTTP/3 (QUIC)</td><td>חלקי</td><td>צריך UDP</td><td>משחקים, מדיה חיה, streams עם latency נמוך</td></tr>
</table>
<p><strong>השאלות של Principal</strong> לפני שבוחרים: מי מדבר — דפדפן, מובייל, מכשיר, service? באיזה כיוון? כמה connections במקביל בשיא? מה זה "real-time" כאן — 50ms או 5 שניות? האם אובדן הודעות מקובל, והאם צריך סדר? מה קורה ב-reconnect (המשך מ-offset או רענון מלא)? האם זה עובר את ה-proxy הארגוני של הלקוח? אפשר לקנות את זה (Pusher, Ably, AWS IoT Core, LiveKit Cloud) במקום לבנות?</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-over-engineering הכי נפוץ הוא WebSockets למשהו חד-כיווני. אם הלקוחות רק מקבלים עדכונים, <strong>SSE פשוט יותר</strong> (HTTP רגיל, reconnect אוטומטי, עובד עם ה-cookies של האימות, ה-middleware וה-observability שכבר יש לכם).</blockquote>`
      }
    },
    {
      h: { en: "Sizing long-lived connections: memory, file descriptors, ulimit", he: "Sizing ל-connections ארוכים: זיכרון, file descriptors, ulimit" },
      body: {
        en: `<p>Request/response systems are sized by <strong>req/s</strong>; real-time systems are sized by <strong>concurrent connections</strong> and <strong>fan-out messages/s</strong>.</p>
<ul>
<li><strong>Memory per connection</strong>: kernel TCP buffers (~4–16 KB idle, more under load) + TLS state (~10–40 KB in OpenSSL; less with tuned libraries) + your app's per-connection objects. Rough numbers: Go/Node/Elixir gateways hold <strong>~20–100 KB per idle WebSocket</strong>. 1M connections ≈ 20–100 GB RAM → spread across e.g. 20 pods × 50k connections.</li>
<li><strong>File descriptors</strong>: every socket is an fd. Default <code>ulimit -n</code> is often 1024 → raise to ~1,000,000 (<code>LimitNOFILE=</code> in systemd, container runtime limits) and <code>fs.file-max</code>.</li>
<li><strong>Ephemeral ports</strong>: a proxy/LB connecting to one backend IP:port has ~28k–64k source ports (<code>net.ipv4.ip_local_port_range</code>) → use multiple backend IPs or more proxy IPs.</li>
<li><strong>Threads</strong>: thread-per-connection (classic Java servlet, Python sync) dies at ~10k (the C10k problem). Use event-loop/async servers (Node, Go, Netty, Elixir/BEAM, asyncio, Envoy).</li>
<li><strong>Fan-out math</strong>: a chat room of 10k members × 5 msgs/s = 50k deliveries/s from one room. Popular channels need special handling (batching, sampling "typing..." events).</li>
<li><strong>Reconnect storms</strong>: if a gateway with 50k clients dies, 50k reconnects hit others in seconds — jittered backoff on clients, connection-rate limits on servers, and spare capacity (N+1).</li>
</ul>
<pre># Linux tuning for a WebSocket gateway node
ulimit -n 1048576
sysctl -w fs.file-max=2097152
sysctl -w net.core.somaxconn=65535
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
ss -s          # 'estab 51234' = current established TCP connections
ss -tn state established '( sport = :443 )' | wc -l</pre>
<blockquote>💡 Real world: WhatsApp famously ran ~2 million TCP connections on a single FreeBSD + Erlang server (2012). The bottleneck is almost never CPU — it's memory per connection, fds, and how gracefully you survive a mass reconnect.</blockquote>`,
        he: `<p>מערכות request/response עושות sizing לפי <strong>בקשות בשנייה</strong>; מערכות real-time עושות sizing לפי <strong>connections במקביל</strong> ו-<strong>הודעות fan-out בשנייה</strong>.</p>
<ul>
<li><strong>זיכרון ל-connection</strong>: buffers של TCP ב-kernel (~4–16KB במנוחה, יותר תחת עומס) + state של TLS (~10–40KB ב-OpenSSL; פחות עם ספריות מכווננות) + האובייקטים של האפליקציה לכל connection. מספרים גסים: gateways ב-Go/Node/Elixir מחזיקים <strong>~20–100KB ל-WebSocket במנוחה</strong>. 1M connections ≈ 20–100GB RAM → מפזרים למשל על 20 pods × 50K connections.</li>
<li><strong>File descriptors</strong>: כל socket הוא fd. ברירת המחדל של <code>ulimit -n</code> היא לרוב 1024 → מעלים ל-~1,000,000 (<code>LimitNOFILE=</code> ב-systemd, מגבלות ה-container runtime) וגם <code>fs.file-max</code>.</li>
<li><strong>Ephemeral ports</strong>: proxy/LB שמתחבר ל-IP:port אחד של backend מוגבל ל-~28K–64K source ports (<code>net.ipv4.ip_local_port_range</code>) → משתמשים בכמה IPs של backend או ביותר IPs ל-proxy.</li>
<li><strong>Threads</strong>: thread לכל connection (Java servlet קלאסי, Python סינכרוני) מת סביב 10K (בעיית C10k). משתמשים בשרתים עם event loop/async (Node, Go, Netty, Elixir/BEAM, asyncio, Envoy).</li>
<li><strong>חישובי fan-out</strong>: חדר צ'אט של 10K חברים × 5 הודעות בשנייה = 50K מסירות בשנייה מחדר אחד. ערוצים פופולריים צריכים טיפול מיוחד (batching, דגימה של events כמו "מקליד...").</li>
<li><strong>סופות reconnect</strong>: אם gateway עם 50K לקוחות נופל, 50K reconnects פוגעים באחרים תוך שניות — backoff עם jitter בלקוחות, rate limit לקצב connections בשרתים, וקיבולת רזרבית (N+1).</li>
</ul>
<pre># Linux tuning for a WebSocket gateway node
ulimit -n 1048576
sysctl -w fs.file-max=2097152
sysctl -w net.core.somaxconn=65535
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
ss -s          # 'estab 51234' = current established TCP connections
ss -tn state established '( sport = :443 )' | wc -l</pre>
<blockquote>💡 מהשטח: WhatsApp הריצו בזמנו ~2 מיליון connections של TCP על שרת FreeBSD + Erlang אחד (2012). צוואר הבקבוק כמעט אף פעם לא CPU — זה זיכרון ל-connection, fds, וכמה בחן אתם שורדים reconnect המוני.</blockquote>`
      }
    }
  ],
  diagram: `Short poll   C: ?  ?  ?  ?  ?        S: -  -  x  -  -     (asks every N s)
Long poll    C: ?..........?....      S: ...........x....x  (held until data)
SSE          C: GET (once)            S: e1 .. e2 .. e3 -->  (one-way stream)
WebSocket    C: <====== full duplex ======> S              (after 101 Upgrade)

WebSocket at scale:
 clients --wss--> [LB idle timeout > ping]--> gateway-1 (50k sockets) --+
 clients --wss--> [LB]-------------------------> gateway-2 (50k sockets) --+--> Redis/NATS pub/sub
                                                                           +--> registry userId->gateway
                                                         chat-service (stateless) publishes "room:42"

WebRTC:  A <--signaling (WS)--> server <--signaling--> B
         A <==== media P2P over UDP (STUN finds public IP) ====> B
         A ==> TURN relay ==> B   (when NAT/firewall blocks P2P)`,
  handsOn: [
    { cmd: "curl -N -H 'Accept: text/event-stream' https://sse.dev/test", what: { en: "Watch a Server-Sent Events stream arrive line by line (-N disables curl's buffering).", he: "רואים stream של Server-Sent Events מגיע שורה אחרי שורה (-N מכבה את ה-buffering של curl)." } },
    { cmd: "websocat wss://echo.websocket.org", what: { en: "Open an interactive WebSocket; type a line and it echoes back over the same full-duplex connection.", he: "פותחים WebSocket אינטראקטיבי; מקלידים שורה והיא חוזרת על אותו connection דו-כיווני." } },
    { cmd: "curl -i -N -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' https://echo.websocket.org", what: { en: "Perform the raw WebSocket upgrade handshake and see the 101 Switching Protocols response.", he: "מבצעים את ה-handshake הגולמי של WebSocket upgrade ורואים את התשובה 101 Switching Protocols." } },
    { cmd: "mosquitto_sub -h test.mosquitto.org -t 'academy/demo/#' -v & mosquitto_pub -h test.mosquitto.org -t 'academy/demo/temp' -m 21.5 -q 1 -r", what: { en: "Subscribe with a wildcard and publish a retained QoS 1 MQTT message on a public test broker.", he: "נרשמים עם wildcard ומפרסמים הודעת MQTT מסוג retained עם QoS 1 על broker ציבורי לבדיקות." } },
    { cmd: "ulimit -n; ss -s", what: { en: "Check the open-file limit (max sockets per process) and the count of established TCP connections.", he: "בודקים את מגבלת הקבצים הפתוחים (מקסימום sockets ל-process) ואת מספר ה-connections של TCP שפתוחים." } }
  ],
  mnemonic: {
    en: "\"Radio, Phone, Walkie-talkie, Mailroom\": SSE = radio (one-way), WebSocket = phone call (both ways), WebRTC = walkie-talkies (direct, needs an introduction), MQTT = mailroom with pigeonholes for flaky devices.",
    he: "\"רדיו, טלפון, ווקי-טוקי, חדר דואר\": SSE = רדיו (חד-כיווני), WebSocket = שיחת טלפון (דו-כיווני), WebRTC = ווקי-טוקי (ישיר, צריך היכרות), MQTT = חדר דואר עם תאים למכשירים לא יציבים."
  },
  pitfalls: [
    { en: "Choosing WebSockets for one-way updates — you lose HTTP caching, standard auth and observability, and inherit stateful scaling for no reason. SSE first.", he: "לבחור WebSockets לעדכונים חד-כיווניים — מאבדים caching של HTTP, אימות ו-observability סטנדרטיים, ומקבלים scaling עם state בלי סיבה. קודם SSE." },
    { en: "No heartbeats: LB/NAT idle timeouts (60–350 s) silently kill quiet connections, and the client thinks it is still subscribed.", he: "בלי heartbeats: idle timeouts של LB/NAT (60–350 שניות) הורגים בשקט connections שקטים, והלקוח חושב שהוא עדיין רשום." },
    { en: "Clients reconnecting immediately with no backoff/jitter: every deploy or gateway crash becomes a self-inflicted DDoS.", he: "לקוחות שמתחברים מחדש מיד בלי backoff/jitter: כל deploy או קריסה של gateway הופכים ל-DDoS שעשיתם לעצמכם." },
    { en: "Proxy buffering left on for SSE/LLM streaming: the 'stream' arrives as one big chunk after 30 seconds.", he: "להשאיר buffering ב-proxy ל-SSE/הזרמת LLM: ה-'stream' מגיע כגוש אחד גדול אחרי 30 שניות." }
  ],
  interview: [
    { q: { en: "Design the transport for a ChatGPT-like UI that streams tokens. WebSocket or SSE?", he: "תכננו את ה-transport לממשק דמוי ChatGPT שמזרים tokens. WebSocket או SSE?" },
      a: { en: "SSE. The flow is request → one-way stream of tokens → done; the client sends a new prompt with a normal POST. SSE is plain HTTP so it reuses auth, rate limiting, gateways, logging and HTTP/2 multiplexing; EventSource-style reconnect is built in. Disable proxy buffering, send heartbeats, set long-enough idle timeouts, and support cancellation by closing the stream (propagate to stop generation, saving GPU). WebSockets only if you need true bidirectional real-time, e.g. voice or collaborative editing.", he: "SSE. הזרימה היא בקשה → stream חד-כיווני של tokens → סוף; הלקוח שולח prompt חדש ב-POST רגיל. SSE הוא HTTP רגיל, אז הוא משתמש שוב באימות, rate limiting, gateways, לוגים ו-multiplexing של HTTP/2; reconnect בסגנון EventSource מובנה. מכבים buffering ב-proxy, שולחים heartbeats, מגדירים idle timeouts ארוכים מספיק, ותומכים בביטול ע\"י סגירת ה-stream (ומעבירים את זה הלאה כדי לעצור את הג'נרציה ולחסוך GPU). WebSockets רק אם צריך real-time דו-כיווני אמיתי, למשל קול או עריכה משותפת." } },
    { q: { en: "How would you scale a WebSocket chat service to 5M concurrent users?", he: "איך הייתם עושים scale לשירות צ'אט ב-WebSocket ל-5M משתמשים במקביל?" },
      a: { en: "Separate stateless chat services from connection gateways. Size gateways by connections: at ~50 KB each, 5M ≈ 250 GB RAM → e.g. 100 gateway pods × 50k, plus N+1 headroom for failover reconnects. Tune fds (ulimit ~1M) and LB idle timeouts, heartbeat every 25 s. Route messages via a pub/sub backplane (Redis Cluster / NATS / Kafka) keyed by room, plus a presence/registry service. Persist messages in a DB (e.g. Cassandra) with per-room sequence numbers so reconnecting clients resume from the last seq. Clients reconnect with jittered exponential backoff; deploys drain gateways gradually. Monitor connections per pod, fan-out latency p99, reconnect rate.", he: "מפרידים שירותי צ'אט stateless מ-connection gateways. Sizing של ה-gateways לפי connections: ב-~50KB לכל אחד, 5M ≈ 250GB RAM → למשל 100 pods של gateway × 50K, ועוד מרווח N+1 ל-reconnects בזמן failover. מכווננים fds (ulimit ~1M) ו-idle timeouts של ה-LB, heartbeat כל 25 שניות. מנתבים הודעות דרך pub/sub backplane (Redis Cluster / NATS / Kafka) לפי חדר, ועוד שירות presence/registry. שומרים הודעות ב-DB (למשל Cassandra) עם מספרי רצף לכל חדר כדי שלקוחות שמתחברים מחדש ימשיכו מה-seq האחרון. לקוחות מתחברים מחדש עם exponential backoff עם jitter; deploys עושים drain ל-gateways בהדרגה. מנטרים connections ל-pod, p99 של latency ב-fan-out, וקצב reconnects." } },
    { q: { en: "When would you choose MQTT over WebSockets or HTTP for devices?", he: "מתי תבחרו MQTT על פני WebSockets או HTTP למכשירים?" },
      a: { en: "For constrained or intermittently connected devices: MQTT has a tiny header, keeps one persistent connection, supports QoS levels (0/1/2), retained last-known values, persistent sessions that queue messages while offline, and Last Will to signal a dead device — and a broker handles topic-based fan-out to millions of devices. HTTP polling wastes battery and bandwidth; raw WebSockets would force you to reinvent QoS, topics and offline queues.", he: "למכשירים מוגבלים או כאלה שמתחברים לסירוגין: ל-MQTT יש header זעיר, connection קבוע אחד, רמות QoS (0/1/2), ערכים אחרונים retained, persistent sessions ששומרות הודעות בזמן offline, ו-Last Will שמסמן מכשיר שמת — ו-broker מטפל ב-fan-out לפי topics למיליוני מכשירים. Polling ב-HTTP מבזבז סוללה ורוחב פס; WebSockets גולמיים יכריחו אתכם להמציא מחדש QoS, topics ותורי offline." } }
  ],
  quiz: [
    { q: { en: "Clients only need to receive live updates from the server. The simplest good choice?", he: "הלקוחות רק צריכים לקבל עדכונים חיים מהשרת. הבחירה הטובה הכי פשוטה?" },
      options: [
        { en: "WebRTC", he: "WebRTC" },
        { en: "Server-Sent Events", he: "Server-Sent Events" },
        { en: "AMQP from the browser", he: "AMQP מהדפדפן" },
        { en: "Short polling every 100 ms", he: "Short polling כל 100ms" }
      ], answer: 1,
      explain: { en: "SSE is one-way server→client over plain HTTP with automatic reconnect — no need for a stateful bidirectional channel.", he: "SSE הוא חד-כיווני שרת→לקוח מעל HTTP רגיל עם reconnect אוטומטי — אין צורך בערוץ דו-כיווני עם state." } },
    { q: { en: "In WebRTC, what is TURN used for?", he: "ב-WebRTC, למה משמש TURN?" },
      options: [
        { en: "Encrypting the media", he: "להצפין את המדיה" },
        { en: "Relaying media when a direct peer-to-peer path can't be established through NAT/firewalls", he: "להעביר מדיה כשאי אפשר להקים מסלול peer-to-peer ישיר דרך NAT/firewalls" },
        { en: "Signaling SDP offers", he: "להעביר SDP offers (signaling)" },
        { en: "Compressing video", he: "לדחוס וידאו" }
      ], answer: 1,
      explain: { en: "STUN discovers your public address; TURN relays the traffic when P2P fails — and it's the expensive part.", he: "STUN מגלה את הכתובת הציבורית; TURN מעביר את התעבורה כש-P2P נכשל — וזה החלק היקר." } },
    { q: { en: "MQTT QoS 1 guarantees…", he: "MQTT QoS 1 מבטיח..." },
      options: [
        { en: "At-most-once delivery", he: "מסירה at-most-once" },
        { en: "At-least-once delivery — duplicates are possible", he: "מסירה at-least-once — ייתכנו כפילויות" },
        { en: "Exactly-once delivery", he: "מסירה exactly-once" },
        { en: "Ordered delivery across all topics", he: "מסירה לפי סדר בכל ה-topics" }
      ], answer: 1,
      explain: { en: "QoS 0 = at most once, QoS 1 = at least once (receiver must be idempotent), QoS 2 = exactly once via a 4-step handshake.", he: "QoS 0 = at most once, QoS 1 = at least once (המקבל חייב להיות אידמפוטנטי), QoS 2 = exactly once דרך handshake של 4 שלבים." } },
    { q: { en: "Your WebSocket gateway fails around 1,000 connections per process with 'too many open files'. Fix?", he: "ה-gateway של ה-WebSocket נופל סביב 1,000 connections ל-process עם 'too many open files'. תיקון?" },
      options: [
        { en: "Add more CPU", he: "להוסיף CPU" },
        { en: "Raise the file-descriptor limit (ulimit -n / LimitNOFILE) and fs.file-max", he: "להעלות את מגבלת ה-file descriptors (ulimit -n / LimitNOFILE) ואת fs.file-max" },
        { en: "Switch to HTTP/3", he: "לעבור ל-HTTP/3" },
        { en: "Disable heartbeats", he: "לכבות heartbeats" }
      ], answer: 1,
      explain: { en: "Each socket is a file descriptor; the default soft limit is often 1024.", he: "כל socket הוא file descriptor; מגבלת ה-soft הדיפולטית היא לרוב 1024." } }
  ],
  related: ["pr-http-versions", "arch-brokers", "arch-queues", "pr-integration-styles", "pr-queue-kinds", "pr-event-loop", "pr-sizing"]
});

INFRA.glossary.push(
  { term: "HTTP/2", track: "principal", def: { en: "Binary HTTP that multiplexes many streams over one TCP connection, with HPACK header compression; still suffers TCP head-of-line blocking.", he: "HTTP בינארי שעושה multiplexing להרבה streams על connection TCP אחד, עם דחיסת headers ב-HPACK; עדיין סובל מ-HOL blocking של TCP." }, lesson: "pr-http-versions" },
  { term: "QUIC / HTTP/3", track: "principal", def: { en: "UDP-based transport with built-in TLS 1.3, per-stream loss recovery, 1-RTT/0-RTT setup and connection migration; HTTP/3 is HTTP over QUIC.", he: "Transport מבוסס UDP עם TLS 1.3 מובנה, התאוששות מאובדן לכל stream, הקמה ב-1-RTT/0-RTT ו-connection migration; HTTP/3 הוא HTTP מעל QUIC." }, lesson: "pr-http-versions" },
  { term: "Head-of-line blocking", track: "principal", def: { en: "When one delayed or lost item stalls everything queued behind it — at the HTTP/1.1 level (pipelining) or the TCP level (HTTP/2).", he: "כשפריט אחד שמתעכב או אובד עוצר את כל מה שאחריו בתור — ברמת HTTP/1.1 (pipelining) או ברמת TCP (HTTP/2)." }, lesson: "pr-http-versions" },
  { term: "ALPN", track: "principal", def: { en: "TLS extension where client and server agree on the application protocol (h2, http/1.1) during the handshake, with no extra round trip.", he: "הרחבה של TLS שבה הלקוח והשרת מסכימים על פרוטוקול האפליקציה (h2, http/1.1) במהלך ה-handshake, בלי round trip נוסף." }, lesson: "pr-http-versions" },
  { term: "SPF / DKIM / DMARC", track: "principal", def: { en: "Email authentication trio: SPF lists allowed sending IPs, DKIM cryptographically signs messages, DMARC enforces alignment with the visible From: and sets a failure policy.", he: "שלישיית אימות המייל: SPF מונה IPs מורשים לשליחה, DKIM חותם קריפטוגרפית על הודעות, DMARC אוכף alignment מול ה-From: הגלוי וקובע מדיניות כשל." }, lesson: "pr-email-sms" },
  { term: "SMPP", track: "principal", def: { en: "Short Message Peer-to-Peer: the TCP protocol aggregators and carriers use to exchange SMS and delivery receipts.", he: "Short Message Peer-to-Peer: פרוטוקול ה-TCP שבו aggregators ו-carriers מחליפים SMS ואישורי מסירה." }, lesson: "pr-email-sms" },
  { term: "SMS pumping", track: "principal", def: { en: "Fraud where bots trigger OTP/SMS sends to premium numbers so attackers earn a share of the termination fees; defended by rate limits and country allowlists.", he: "הונאה שבה בוטים מפעילים שליחות OTP/SMS למספרי פרימיום כדי שהתוקפים ירוויחו נתח מעמלות הסיום; מתגוננים עם rate limits ו-allowlist של מדינות." }, lesson: "pr-email-sms" },
  { term: "SSE", track: "principal", def: { en: "Server-Sent Events: a one-way server→client stream over a long HTTP response (text/event-stream) with automatic browser reconnect; used for LLM token streaming.", he: "Server-Sent Events: stream חד-כיווני שרת→לקוח מעל תשובת HTTP ארוכה (text/event-stream) עם reconnect אוטומטי בדפדפן; משמש להזרמת tokens של LLM." }, lesson: "pr-realtime-protocols" },
  { term: "WebSocket", track: "principal", def: { en: "Full-duplex message channel created by upgrading an HTTP/1.1 connection (101 Switching Protocols); stateful, needs heartbeats and a pub/sub backplane to scale.", he: "ערוץ הודעות full-duplex שנוצר ע\"י upgrade ל-connection של HTTP/1.1 (101 Switching Protocols); עם state, צריך heartbeats ו-pub/sub backplane כדי לעשות scale." }, lesson: "pr-realtime-protocols" },
  { term: "MQTT", track: "principal", def: { en: "Lightweight broker-based pub/sub protocol for IoT with hierarchical topics, QoS 0/1/2, retained messages and Last Will.", he: "פרוטוקול pub/sub קליל מבוסס broker ל-IoT, עם topics היררכיים, QoS 0/1/2, הודעות retained ו-Last Will." }, lesson: "pr-realtime-protocols" }
);
