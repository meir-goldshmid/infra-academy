window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Networking, part 3: IPv6, HTTP caching, DDoS & edge, gRPC in production,
   DNS operations  (track: networking, order 30-34)
   ========================================================================= */
(function () {
  var L = window.INFRA.lessons, G = window.INFRA.glossary;
  function t(en, he) { return { en: en, he: he }; }

  /* ------------------------------------------------------------ net-ipv6 */
  L.push({
    id: "net-ipv6",
    track: "networking",
    order: 30,
    icon: "🌐",
    level: 2,
    minutes: 13,
    title: t("IPv6 in Practice", "IPv6 בפרקטיקה"),
    tldr: t(
      "IPv6 gives every device a globally routable 128-bit address, every subnet is a /64, hosts configure themselves (SLAAC), NAT disappears and a stateful firewall does the protecting - and since AWS charges for every public IPv4, dual-stack is now a cost decision, not a hobby.",
      "IPv6 נותן לכל מכשיר כתובת גלובלית של 128 ביט, כל subnet הוא /64, ה-hosts מגדירים את עצמם לבד (SLAAC), ה-NAT נעלם ו-firewall עם state עושה את ההגנה - ומאז ש-AWS גובה כסף על כל IPv4 ציבורי, dual-stack הוא החלטה כלכלית ולא תחביב."
    ),
    analogy: t(
      "IPv4 is a crowded apartment building with one street address: everyone shares the front door (NAT) and the doorman keeps a notebook of who ordered which pizza. IPv6 gives every apartment its own street address - so many that each building gets more addresses than there are grains of sand. You don't need the doorman's notebook anymore, but you still need a lock on every door (the firewall).",
      "IPv4 זה בניין דירות צפוף עם כתובת רחוב אחת: כולם חולקים את דלת הכניסה (NAT) והשומר מחזיק מחברת של מי הזמין איזה פיצה. IPv6 נותן לכל דירה כתובת רחוב משלה - כל כך הרבה שכל בניין מקבל יותר כתובות ממספר גרגירי החול. אתה כבר לא צריך את המחברת של השומר, אבל עדיין צריך מנעול על כל דלת (ה-firewall)."
    ),
    sections: [
      {
        h: t("Reading and writing an IPv6 address", "לקרוא ולכתוב כתובת IPv6"),
        body: t(
`<p>An IPv6 address is <strong>128 bits</strong>, written as 8 groups of 16 bits in hex, separated by colons. Two shortening rules:</p>
<ol>
<li>Drop leading zeros in each group: <code>0db8</code> → <code>db8</code>, <code>0000</code> → <code>0</code>.</li>
<li>Replace <strong>one</strong> run of consecutive all-zero groups with <code>::</code> (only once, otherwise the address is ambiguous).</li>
</ol>
<pre>2001:0db8:0000:0000:0000:ff00:0042:8329
2001:db8:0:0:0:ff00:42:8329      # rule 1
2001:db8::ff00:42:8329           # rule 2
::1                              # loopback (like 127.0.0.1)
::                               # unspecified (like 0.0.0.0)</pre>
<table>
<tr><th>Prefix</th><th>Meaning</th></tr>
<tr><td><code>2000::/3</code></td><td>Global unicast (public, routable)</td></tr>
<tr><td><code>fe80::/10</code></td><td>Link-local - every interface has one, never routed</td></tr>
<tr><td><code>fc00::/7</code> (in practice <code>fd00::/8</code>)</td><td>Unique Local Addresses (ULA) - the "RFC 1918" of IPv6</td></tr>
<tr><td><code>ff00::/8</code></td><td>Multicast (IPv6 has no broadcast at all)</td></tr>
<tr><td><code>2001:db8::/32</code></td><td>Documentation only (like 203.0.113.0/24)</td></tr>
<tr><td><code>64:ff9b::/96</code></td><td>NAT64 well-known prefix (IPv4 embedded in the last 32 bits)</td></tr>
</table>
<p>In URLs and host:port strings you need brackets: <code>http://[2001:db8::10]:8080/</code>. Link-local addresses also need a zone: <code>ping fe80::1%eth0</code>, because the same fe80 address can exist on every link.</p>`,
`<p>כתובת IPv6 היא <strong>128 ביט</strong>, נכתבת כ-8 קבוצות של 16 ביט ב-hex, מופרדות בנקודתיים. שני כללי קיצור:</p>
<ol>
<li>מורידים אפסים מובילים בכל קבוצה: <code>0db8</code> → <code>db8</code>, <code>0000</code> → <code>0</code>.</li>
<li>מחליפים רצף <strong>אחד</strong> של קבוצות שכולן אפס ב-<code>::</code> (רק פעם אחת, אחרת הכתובת דו-משמעית).</li>
</ol>
<pre>2001:0db8:0000:0000:0000:ff00:0042:8329
2001:db8:0:0:0:ff00:42:8329      # rule 1
2001:db8::ff00:42:8329           # rule 2
::1                              # loopback (like 127.0.0.1)
::                               # unspecified (like 0.0.0.0)</pre>
<table>
<tr><th>Prefix</th><th>משמעות</th></tr>
<tr><td><code>2000::/3</code></td><td>Global unicast (ציבורי, ניתן לניתוב)</td></tr>
<tr><td><code>fe80::/10</code></td><td>Link-local - לכל interface יש אחת, אף פעם לא מנותבת</td></tr>
<tr><td><code>fc00::/7</code> (בפועל <code>fd00::/8</code>)</td><td>Unique Local Addresses (ULA) - ה-"RFC 1918" של IPv6</td></tr>
<tr><td><code>ff00::/8</code></td><td>Multicast (ל-IPv6 אין broadcast בכלל)</td></tr>
<tr><td><code>2001:db8::/32</code></td><td>לתיעוד בלבד (כמו 203.0.113.0/24)</td></tr>
<tr><td><code>64:ff9b::/96</code></td><td>ה-prefix הידוע של NAT64 (כתובת IPv4 משובצת ב-32 הביטים האחרונים)</td></tr>
</table>
<p>ב-URL ובמחרוזות host:port צריך סוגריים מרובעים: <code>http://[2001:db8::10]:8080/</code>. כתובות link-local צריכות גם zone: <code>ping fe80::1%eth0</code>, כי אותה כתובת fe80 יכולה להופיע על כל link.</p>`
        )
      },
      {
        h: t("Subnets are /64, hosts configure themselves: SLAAC vs DHCPv6", "כל subnet הוא /64, וה-hosts מגדירים את עצמם: SLAAC מול DHCPv6"),
        body: t(
`<p>The first 64 bits are the <strong>network prefix</strong>, the last 64 bits are the <strong>interface ID</strong>. A LAN/subnet is a <strong>/64</strong> - always. That is 2<sup>64</sup> ≈ 1.8×10<sup>19</sup> addresses per subnet; you never "run out" inside a subnet, and you never size subnets by host count again. A typical allocation: ISP or cloud gives you a <strong>/48</strong> or <strong>/56</strong>, you carve /64s out of it (a /56 = 256 subnets, a /48 = 65,536).</p>
<p>How does a host get its address?</p>
<ul>
<li><strong>SLAAC</strong> (Stateless Address Autoconfiguration): the router multicasts a <strong>Router Advertisement (RA)</strong> with the /64 prefix; the host invents its own interface ID (random per RFC 7217 / privacy addresses per RFC 4941, or the old MAC-based EUI-64), checks for duplicates (DAD) and is done. DNS servers can come in the RA too (RDNSS, RFC 8106). SLAAC only works on a /64.</li>
<li><strong>DHCPv6 stateful</strong> (RA "M" flag): a server hands out addresses and keeps leases - what enterprises with IPAM want. Note: <strong>Android does not support stateful DHCPv6</strong>, so phones on such a network get no IPv6.</li>
<li><strong>DHCPv6 stateless</strong> (RA "O" flag): address via SLAAC, extra options (DNS, NTP) via DHCPv6.</li>
<li><strong>DHCPv6-PD</strong> (prefix delegation): a router asks upstream for a whole prefix (e.g. a /56) - how home routers and Kubernetes CNIs get ranges.</li>
</ul>
<p><strong>Neighbor Discovery (NDP)</strong> over ICMPv6 replaces ARP. Every interface also has a <strong>link-local</strong> fe80:: address, and the default gateway is usually the router's link-local address - so <code>ip -6 route</code> shows <code>default via fe80::1 dev eth0</code>. That's normal, not a bug.</p>
<blockquote>⚠️ Production tip: never blanket-block ICMPv6. NDP (types 133-137) is how hosts find the router and each other, and routers never fragment IPv6 packets - Path MTU Discovery depends on ICMPv6 type 2 "Packet Too Big". Block it and you get the classic black hole: TCP handshake works, large responses hang forever.</blockquote>`,
`<p>64 הביטים הראשונים הם ה-<strong>network prefix</strong>, 64 האחרונים הם ה-<strong>interface ID</strong>. LAN או subnet הוא <strong>/64</strong> - תמיד. זה 2<sup>64</sup> ≈ 1.8×10<sup>19</sup> כתובות ל-subnet; אף פעם לא "נגמרות" כתובות בתוך subnet, ואף פעם לא מתכננים יותר גודל subnet לפי מספר hosts. הקצאה טיפוסית: ספק האינטרנט או הענן נותן לך <strong>/48</strong> או <strong>/56</strong>, ואתה חותך ממנו /64-ים (‏/56 = 256 subnets, ‏/48 = 65,536).</p>
<p>איך host מקבל כתובת?</p>
<ul>
<li><strong>SLAAC</strong> (Stateless Address Autoconfiguration): הראוטר שולח ב-multicast הודעת <strong>Router Advertisement (RA)</strong> עם ה-prefix של ה-/64; ה-host ממציא לעצמו interface ID (אקראי לפי RFC 7217, כתובות פרטיות לפי RFC 4941, או ה-EUI-64 הישן שמבוסס על ה-MAC), בודק שאין כפילות (DAD) וזהו. גם שרתי DNS יכולים להגיע ב-RA (‏RDNSS, ‏RFC 8106). SLAAC עובד רק על /64.</li>
<li><strong>DHCPv6 stateful</strong> (דגל "M" ב-RA): שרת מחלק כתובות ומחזיק leases - מה שארגונים עם IPAM רוצים. שים לב: <strong>Android לא תומך ב-DHCPv6 stateful</strong>, כך שטלפונים ברשת כזו לא מקבלים IPv6 בכלל.</li>
<li><strong>DHCPv6 stateless</strong> (דגל "O"): כתובת דרך SLAAC, והגדרות נוספות (DNS, NTP) דרך DHCPv6.</li>
<li><strong>DHCPv6-PD</strong> (prefix delegation): ראוטר מבקש מלמעלה prefix שלם (למשל /56) - ככה ראוטרים ביתיים ו-CNI-ים של Kubernetes מקבלים טווחים.</li>
</ul>
<p><strong>Neighbor Discovery (NDP)</strong> מעל ICMPv6 מחליף את ARP. לכל interface יש גם כתובת <strong>link-local</strong> מסוג fe80::, וה-default gateway הוא בדרך כלל כתובת ה-link-local של הראוטר - ולכן <code>ip -6 route</code> מראה <code>default via fe80::1 dev eth0</code>. זה תקין, לא באג.</p>
<blockquote>⚠️ Production tip: אף פעם אל תחסום ICMPv6 גורף. NDP (סוגים 133-137) זה איך hosts מוצאים את הראוטר ואחד את השני, וראוטרים אף פעם לא מפצלים חבילות IPv6 - ה-Path MTU Discovery תלוי ב-ICMPv6 סוג 2, "Packet Too Big". תחסום אותו ותקבל את ה-black hole הקלאסי: ה-handshake של TCP עובד, ותשובות גדולות נתקעות לנצח.</blockquote>`
        )
      },
      {
        h: t("No NAT: what protects you, and how IPv6-only reaches IPv4", "בלי NAT: מה מגן עליך, ואיך IPv6-only מגיע ל-IPv4"),
        body: t(
`<p>With IPv6 every instance and Pod can have a <strong>globally unique, routable</strong> address. NAT in IPv4 gave an accidental side effect - "nobody can connect in" - that people mistook for security. In IPv6 you get the same effect explicitly:</p>
<ul>
<li><strong>Stateful firewall</strong>: Security Groups / NSGs / firewall rules allow outbound and return traffic, deny unsolicited inbound. Remember that IPv4 and IPv6 rules are separate: a rule for <code>0.0.0.0/0</code> does <em>not</em> cover <code>::/0</code>.</li>
<li><strong>AWS Egress-Only Internet Gateway</strong>: outbound-only IPv6 for private subnets - the IPv6 equivalent of a NAT Gateway, but with no per-GB processing charge and no address translation.</li>
<li><strong>NAT64 + DNS64</strong>: lets an IPv6-only workload reach an IPv4-only service (GitHub's API was famously IPv4-only for years). DNS64 synthesizes an AAAA record like <code>64:ff9b::8c52:7904</code> (= 140.82.121.4) and a NAT64 gateway translates. On AWS: enable DNS64 on the subnet and route <code>64:ff9b::/96</code> to a NAT Gateway.</li>
</ul>
<pre># AWS: route table for an IPv6 private subnet
::/0            -> eigw-0abc...      # egress-only IGW
64:ff9b::/96    -> nat-0def...       # NAT64 for IPv4-only destinations
0.0.0.0/0       -> nat-0def...       # (if the subnet is dual-stack)</pre>
<blockquote>💡 Real world: per-IP rate limiting breaks on IPv6. One home or one VM can rotate through 2<sup>64</sup> addresses, so a limiter keyed on the full address is trivially bypassed. Key IPv6 clients on their <strong>/64</strong> (some WAFs use /56 or /48 for aggressive cases).</blockquote>`,
`<p>ב-IPv6 לכל instance ולכל Pod יכולה להיות כתובת <strong>ייחודית גלובלית וניתנת לניתוב</strong>. ה-NAT ב-IPv4 נתן תופעת לוואי מקרית - "אף אחד לא יכול להתחבר פנימה" - שאנשים התבלבלו וחשבו שהיא אבטחה. ב-IPv6 מקבלים את אותו אפקט במפורש:</p>
<ul>
<li><strong>Stateful firewall</strong>: Security Groups, NSGs וחוקי firewall מאפשרים יציאה ותעבורה חוזרת, וחוסמים כניסה שלא התבקשה. זכור שחוקי IPv4 ו-IPv6 נפרדים: חוק ל-<code>0.0.0.0/0</code> <em>לא</em> מכסה את <code>::/0</code>.</li>
<li><strong>AWS Egress-Only Internet Gateway</strong>: יציאה בלבד ב-IPv6 ל-subnets פרטיים - המקבילה של NAT Gateway ב-IPv6, אבל בלי חיוב לפי GB ובלי תרגום כתובות.</li>
<li><strong>NAT64 + DNS64</strong>: מאפשר ל-workload שהוא IPv6-only להגיע לשירות שהוא IPv4-only (ה-API של GitHub היה מפורסם בתור IPv4-only במשך שנים). ה-DNS64 מייצר רשומת AAAA כמו <code>64:ff9b::8c52:7904</code> (= 140.82.121.4) ו-gateway של NAT64 מתרגם. ב-AWS: מפעילים DNS64 על ה-subnet ומנתבים את <code>64:ff9b::/96</code> ל-NAT Gateway.</li>
</ul>
<pre># AWS: route table for an IPv6 private subnet
::/0            -> eigw-0abc...      # egress-only IGW
64:ff9b::/96    -> nat-0def...       # NAT64 for IPv4-only destinations
0.0.0.0/0       -> nat-0def...       # (if the subnet is dual-stack)</pre>
<blockquote>💡 Real world: rate limiting לפי IP נשבר ב-IPv6. בית אחד או VM אחד יכולים להחליף בין 2<sup>64</sup> כתובות, אז limiter שהמפתח שלו הוא הכתובת המלאה נעקף בקלות. במקום זה, המפתח ללקוחות IPv6 צריך להיות ה-<strong>/64</strong> שלהם (חלק מה-WAF-ים משתמשים ב-/56 או /48 במקרים אגרסיביים).</blockquote>`
        )
      },
      {
        h: t("IPv4 exhaustion, the AWS IPv4 bill, and dual-stack in the clouds", "מחסור ב-IPv4, החשבון של AWS, ו-dual-stack בעננים"),
        body: t(
`<p>IANA handed out its last IPv4 blocks in 2011; RIPE (Europe/Middle East) ran out in November 2019. Addresses now trade on a market for tens of dollars each. Since <strong>1 Feb 2024 AWS charges $0.005/hour for every public IPv4</strong> - in use or idle, Elastic IP or auto-assigned, on EC2, ALB, NAT Gateway, RDS... That's ~$3.65/month, ~$44/year per address. An ALB across 3 AZs holds at least 3; a fleet of 400 instances with public IPs costs ~$17.5k/year just in addresses. Use the free <strong>Public IP Insights</strong> in VPC IPAM to find them.</p>
<table>
<tr><th>Cloud</th><th>Dual-stack model</th></tr>
<tr><td>AWS</td><td>Associate a /56 (Amazon-provided or BYOIP) to the VPC, a /64 per subnet. IPv6-only subnets exist. ALB/NLB support <code>dualstack</code>; ALB can even be dual-stack "without public IPv4". IPv6 addresses are free.</td></tr>
<tr><td>Azure</td><td>Add an IPv6 range to the VNet (/48 typical) and a /64 per subnet; NICs get IPv4 + IPv6 ipconfigs; Standard Load Balancer and public IPv6 addresses. IPv6-only VNets are not supported - dual-stack only.</td></tr>
<tr><td>GCP</td><td>Subnet stack type <code>IPV4_IPV6</code> (or IPv6-only) with internal (ULA) or external IPv6; each VM interface gets a <strong>/96</strong>. Global external LB terminates IPv6 and proxies to IPv4 backends.</td></tr>
</table>
<p><strong>Kubernetes</strong> dual-stack is GA since 1.23: the cluster gets both Pod and Service CIDRs, Pods get two IPs, and Services choose families:</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  ipFamilyPolicy: PreferDualStack     # SingleStack | PreferDualStack | RequireDualStack
  ipFamilies: [IPv6, IPv4]            # first = primary (.spec.clusterIP)
  selector: { app: web }
  ports: [{ port: 80, targetPort: 8080 }]</pre>
<p>EKS takes another path: an <strong>IPv6 cluster</strong> is IPv6-only for Pods (assigned from a per-node /80 prefix), which ends Pod IP exhaustion in your VPC; egress to IPv4 destinations is SNATed to the node's IPv4 address.</p>`,
`<p>IANA חילקה את בלוקי ה-IPv4 האחרונים שלה ב-2011; ‏RIPE (אירופה והמזרח התיכון) נגמרה בנובמבר 2019. היום כתובות נסחרות בשוק בעשרות דולרים כל אחת. מאז <strong>1 בפברואר 2024 ‏AWS גובה ‎$0.005 לשעה על כל IPv4 ציבורי</strong> - בשימוש או לא, Elastic IP או אוטומטי, על EC2, ‏ALB, ‏NAT Gateway, ‏RDS... זה בערך ‎$3.65 לחודש, בערך ‎$44 לשנה לכתובת. ALB על 3 AZs מחזיק לפחות 3; צי של 400 instances עם IP ציבורי עולה בערך ‎$17.5k בשנה רק על כתובות. כדי למצוא אותן, השתמש ב-<strong>Public IP Insights</strong> החינמי שב-VPC IPAM.</p>
<table>
<tr><th>ענן</th><th>מודל dual-stack</th></tr>
<tr><td>AWS</td><td>משייכים /56 (של Amazon או BYOIP) ל-VPC, ו-/64 לכל subnet. יש גם subnets שהם IPv6-only. ‏ALB ו-NLB תומכים ב-<code>dualstack</code>; ‏ALB יכול אפילו להיות dual-stack "בלי IPv4 ציבורי". כתובות IPv6 בחינם.</td></tr>
<tr><td>Azure</td><td>מוסיפים טווח IPv6 ל-VNet (בדרך כלל /48) ו-/64 לכל subnet; ל-NIC יש ipconfig של IPv4 ושל IPv6; ‏Standard Load Balancer וכתובות IPv6 ציבוריות. VNet שהוא IPv6-only לא נתמך - רק dual-stack.</td></tr>
<tr><td>GCP</td><td>ל-subnet יש stack type ‏<code>IPV4_IPV6</code> (או IPv6-only) עם IPv6 פנימי (ULA) או חיצוני; כל interface של VM מקבל <strong>/96</strong>. ה-LB החיצוני הגלובלי מסיים IPv6 ומעביר ל-backends ב-IPv4.</td></tr>
</table>
<p>ב-<strong>Kubernetes</strong> ה-dual-stack הוא GA מאז 1.23: ל-cluster יש CIDR של Pods ושל Services בשתי המשפחות, כל Pod מקבל שתי כתובות, וכל Service בוחר משפחות:</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  ipFamilyPolicy: PreferDualStack     # SingleStack | PreferDualStack | RequireDualStack
  ipFamilies: [IPv6, IPv4]            # first = primary (.spec.clusterIP)
  selector: { app: web }
  ports: [{ port: 80, targetPort: 8080 }]</pre>
<p>ב-EKS הלכו בדרך אחרת: <strong>cluster מסוג IPv6</strong> הוא IPv6-only ל-Pods (מוקצים מ-prefix של /80 לכל node), מה שמסיים את בעיית המחסור בכתובות Pod ב-VPC; יציאה ליעדי IPv4 עוברת SNAT לכתובת ה-IPv4 של ה-node.</p>`
        )
      },
      {
        h: t("Happy Eyeballs and the classic breakages", "Happy Eyeballs והתקלות הקלאסיות"),
        body: t(
`<p>When a name has both AAAA and A records, clients use <strong>Happy Eyeballs v2 (RFC 8305)</strong>: query both, prefer IPv6, but if the IPv6 connection hasn't succeeded within ~<strong>250 ms</strong>, start an IPv4 attempt in parallel and use whichever connects first. Browsers, curl, Go's net package and Java do this. The upside: broken IPv6 is <em>masked</em>. The downside: broken IPv6 is masked - you just see an extra 250 ms on some requests and never notice. Old clients without Happy Eyeballs hang for a full TCP timeout (often 20+ s) before falling back.</p>
<p>Breakages seen in real migrations:</p>
<ul>
<li><strong>AAAA published, service not reachable on v6</strong>: the Security Group only has <code>0.0.0.0/0</code>, or nginx listens on <code>listen 80;</code> without <code>listen [::]:80;</code>, or the app binds <code>0.0.0.0</code>.</li>
<li><strong>ICMPv6 blocked</strong> → PMTUD black hole (small requests fine, big downloads stall).</li>
<li><strong>Code and schemas assume IPv4</strong>: <code>VARCHAR(15)</code> IP columns, regexes like <code>\d+\.\d+\.\d+\.\d+</code>, splitting host:port on the first colon, allowlists and geo-IP lookups with no IPv6 data.</li>
<li><strong>Logs/X-Forwarded-For</strong> suddenly contain <code>2a02:...</code> and the parser drops them.</li>
<li><strong>Different paths</strong>: IPv6 traffic may take a different route/peering than IPv4, so latency differs per family - test both explicitly.</li>
</ul>
<pre>$ dig +short AAAA example.com
2606:2800:21f:cb07:6820:80da:af6b:8b2c
$ curl -6 -sv https://example.com -o /dev/null 2&gt;&amp;1 | grep -i connected
* Connected to example.com (2606:2800:21f:cb07:6820:80da:af6b:8b2c) port 443
$ ip -6 addr show dev eth0
    inet6 2a05:d018:abc:1200:5e3c:1f2a:9b0e:4d11/128 scope global dynamic
    inet6 fe80::8ff:fe12:3456/64 scope link</pre>`,
`<p>כשלשם יש גם AAAA וגם A, הלקוחות משתמשים ב-<strong>Happy Eyeballs v2 (RFC 8305)</strong>: שואלים את שתיהן, מעדיפים IPv6, אבל אם החיבור ב-IPv6 לא הצליח תוך בערך <strong>250ms</strong>, מתחילים במקביל ניסיון ב-IPv4 ולוקחים את מי שמתחבר ראשון. דפדפנים, curl, ה-net package של Go ו-Java עושים את זה. היתרון: IPv6 שבור <em>מוסתר</em>. החיסרון: IPv6 שבור מוסתר - אתה רק רואה עוד 250ms על חלק מהבקשות ואף פעם לא שם לב. לקוחות ישנים בלי Happy Eyeballs נתקעים לכל אורך ה-timeout של TCP (לרוב 20 שניות ומעלה) לפני שהם עוברים ל-IPv4.</p>
<p>תקלות שרואים במיגרציות אמיתיות:</p>
<ul>
<li><strong>רשומת AAAA פורסמה, והשירות לא נגיש ב-v6</strong>: ב-Security Group יש רק <code>0.0.0.0/0</code>, או ש-nginx מאזין עם <code>listen 80;</code> בלי <code>listen [::]:80;</code>, או שהאפליקציה עושה bind ל-<code>0.0.0.0</code>.</li>
<li><strong>ICMPv6 חסום</strong> → black hole של PMTUD (בקשות קטנות עובדות, הורדות גדולות נתקעות).</li>
<li><strong>קוד וסכמות שמניחים IPv4</strong>: עמודות IP מסוג <code>VARCHAR(15)</code>, ביטויים רגולריים כמו <code>\d+\.\d+\.\d+\.\d+</code>, פיצול host:port לפי הנקודתיים הראשונות, allowlists ו-geo-IP בלי נתוני IPv6.</li>
<li><strong>לוגים ו-X-Forwarded-For</strong> פתאום מכילים <code>2a02:...</code> וה-parser זורק אותם.</li>
<li><strong>מסלולים שונים</strong>: תעבורת IPv6 יכולה לעבור ב-route או ב-peering אחר מ-IPv4, כך שה-latency שונה לפי משפחה - בדוק את שתיהן במפורש.</li>
</ul>
<pre>$ dig +short AAAA example.com
2606:2800:21f:cb07:6820:80da:af6b:8b2c
$ curl -6 -sv https://example.com -o /dev/null 2&gt;&amp;1 | grep -i connected
* Connected to example.com (2606:2800:21f:cb07:6820:80da:af6b:8b2c) port 443
$ ip -6 addr show dev eth0
    inet6 2a05:d018:abc:1200:5e3c:1f2a:9b0e:4d11/128 scope global dynamic
    inet6 fe80::8ff:fe12:3456/64 scope link</pre>`
        )
      }
    ],
    diagram: "Client (dual-stack)\n  |-- AAAA? A? --> DNS\n  |-- try IPv6 ------------------> [2001:db8::10]:443   (wins if < 250 ms)\n  '-- after 250 ms try IPv4 -----> 203.0.113.10:443\n\nIPv6-only subnet --(64:ff9b::/96)--> NAT64 GW --> IPv4-only API\n                 --(::/0)----------> Egress-only IGW --> IPv6 Internet",
    handsOn: [
      { cmd: "ip -6 addr show && ip -6 route && ip -6 neigh", what: t("See your global + link-local addresses, the default route via a fe80:: gateway, and the NDP neighbor table (IPv6's ARP table).", "ראה את הכתובות הגלובליות וה-link-local, את ה-default route דרך gateway מסוג fe80::, ואת טבלת השכנים של NDP (טבלת ה-ARP של IPv6).") },
      { cmd: "dig +short AAAA google.com && ping -6 -c 3 google.com", what: t("Check that a name has an AAAA record and that you actually have IPv6 connectivity (ping6 on older systems).", "בדוק שלשם יש רשומת AAAA ושבאמת יש לך קישוריות IPv6 (ping6 במערכות ישנות).") },
      { cmd: "curl -4 -so /dev/null -w '%{time_connect}\\n' https://example.com; curl -6 -so /dev/null -w '%{time_connect}\\n' https://example.com", what: t("Compare connect time per address family - the way to catch an IPv6 path that Happy Eyeballs is quietly hiding.", "השווה את זמן ה-connect לפי משפחת כתובות - ככה תופסים מסלול IPv6 ש-Happy Eyeballs מסתיר בשקט.") },
      { cmd: "ss -6 -tlnp", what: t("List sockets listening on IPv6. If your service only shows up in 'ss -4', the AAAA record you publish points at nothing.", "הצג sockets שמאזינים ב-IPv6. אם השירות שלך מופיע רק ב-'ss -4', רשומת ה-AAAA שפרסמת מצביעה על כלום.") },
      { cmd: "aws ec2 describe-addresses --query 'Addresses[].PublicIp' && aws ec2 describe-network-interfaces --query 'NetworkInterfaces[].Association.PublicIp'", what: t("Inventory the public IPv4 addresses you're paying ~$44/year each for.", "עשה inventory של כתובות ה-IPv4 הציבוריות שאתה משלם עליהן בערך ‎$44 בשנה כל אחת.") }
    ],
    mnemonic: t(
      "\"Slash-64, SLAAC, no NAT, never block ICMPv6\" - and every public IPv4 is a $44/year subscription.",
      "\"‏‎/64, ‏SLAAC, בלי NAT, ואף פעם לא חוסמים ICMPv6\" - וכל IPv4 ציבורי הוא מנוי של ‎$44 בשנה."
    ),
    pitfalls: [
      t("Publishing AAAA records before every hop (LB, SG/NSG, nginx listen, app bind) is IPv6-ready. Happy Eyeballs hides it in browsers, but SDKs, cron jobs and old clients will hang or fail.", "לפרסם רשומות AAAA לפני שכל hop (‏LB, ‏SG או NSG, ה-listen של nginx, ה-bind של האפליקציה) מוכן ל-IPv6. ‏Happy Eyeballs מסתיר את זה בדפדפנים, אבל SDK-ים, cron jobs ולקוחות ישנים ייתקעו או ייכשלו."),
      t("Copying IPv4 firewall rules and forgetting ::/0 equivalents - or the opposite: allowing ::/0 inbound because 'it's behind NAT' when there is no NAT in IPv6.", "להעתיק חוקי firewall של IPv4 ולשכוח את המקבילים של ::/0 - או ההפך: לפתוח ::/0 פנימה כי 'זה מאחורי NAT', כשב-IPv6 אין NAT בכלל."),
      t("Blocking all ICMPv6 'for security' - breaks NDP and Path MTU Discovery, producing hangs on large responses only.", "לחסום את כל ה-ICMPv6 'בשביל אבטחה' - שובר את NDP ואת ה-Path MTU Discovery, ויוצר תקיעות רק על תשובות גדולות."),
      t("Rate limiting, bans and fraud scoring keyed on a full IPv6 address instead of its /64.", "rate limiting, חסימות ו-fraud scoring שהמפתח שלהם הוא כתובת IPv6 מלאה במקום ה-/64 שלה.")
    ],
    interview: [
      { q: t("Why is every IPv6 subnet a /64, even for 5 hosts?", "למה כל subnet ב-IPv6 הוא /64, גם עבור 5 hosts?"),
        a: t("The 64-bit interface ID is part of the design: SLAAC, privacy addresses and many tools assume a /64. Address space is so large (a /48 holds 65,536 /64s) that efficiency inside a subnet doesn't matter; predictability does. Smaller subnets break SLAAC and Android clients.", "ה-interface ID של 64 ביט הוא חלק מהתכנון: SLAAC, כתובות פרטיות והרבה כלים מניחים /64. מרחב הכתובות כל כך גדול (ב-/48 יש 65,536 ‏/64-ים) שיעילות בתוך subnet לא משנה; מה שמשנה זה צפיות. subnets קטנים יותר שוברים את SLAAC ואת לקוחות Android.") },
      { q: t("Without NAT, how do private IPv6 subnets reach the Internet but stay unreachable from it?", "בלי NAT, איך subnets פרטיים ב-IPv6 מגיעים לאינטרנט בלי שיהיה אפשר להגיע אליהם מבחוץ?"),
        a: t("A stateful device that allows outbound + return traffic and drops unsolicited inbound: in AWS an Egress-Only Internet Gateway, elsewhere firewall rules / NSGs. The address is globally routable but not reachable - routability and reachability are separate. For IPv4-only destinations add DNS64 + NAT64.", "רכיב stateful שמאפשר יציאה ותעבורה חוזרת וזורק כניסה שלא התבקשה: ב-AWS זה Egress-Only Internet Gateway, ובמקומות אחרים חוקי firewall או NSGs. הכתובת ניתנת לניתוב גלובלי אבל לא נגישה - ניתוב ונגישות הם שני דברים נפרדים. ליעדים שהם IPv4-only מוסיפים DNS64 + NAT64.") },
      { q: t("Users report 'the site is sometimes slow' after you enabled IPv6. What do you suspect?", "משתמשים מדווחים ש'האתר לפעמים איטי' אחרי שהפעלת IPv6. מה החשד שלך?"),
        a: t("A partially broken IPv6 path masked by Happy Eyeballs: clients try IPv6, wait ~250 ms (or a full timeout on old stacks), then fall back to IPv4. Compare curl -6 vs curl -4 connect times from several networks, check SGs/listeners for ::/0, and check ICMPv6 Packet Too Big isn't filtered.", "מסלול IPv6 שבור חלקית שמוסתר על ידי Happy Eyeballs: הלקוחות מנסים IPv6, מחכים בערך 250ms (או timeout מלא בסטאקים ישנים), ואז עוברים ל-IPv4. משווים זמני connect של curl -6 מול curl -4 מכמה רשתות, בודקים SGs ו-listeners עבור ::/0, ומוודאים ש-ICMPv6 Packet Too Big לא מסונן.") }
    ],
    quiz: [
      { q: t("What is the correct shortened form of 2001:0db8:0000:0000:0001:0000:0000:0001?", "מה הצורה המקוצרת הנכונה של 2001:0db8:0000:0000:0001:0000:0000:0001?"),
        options: [t("2001:db8::1::1", "2001:db8::1::1"), t("2001:db8::1:0:0:1", "2001:db8::1:0:0:1"), t("2001:db8:0:0:1:0:0:1 - :: is not allowed when there are two zero runs", "2001:db8:0:0:1:0:0:1 - אסור להשתמש ב-:: כשיש שני רצפי אפסים"), t("2001:db8:1:1", "2001:db8:1:1")],
        answer: 1,
        explain: t(":: may be used only once (so option 1 is invalid), but it may replace either zero run. Both runs are two groups long; RFC 5952 canonical form compresses the first one: 2001:db8::1:0:0:1. Option 3 is valid but not shortened, and option 4 loses groups entirely.", "מותר להשתמש ב-:: רק פעם אחת (לכן אפשרות 1 לא תקינה). אבל אפשר להחליף בו כל אחד מרצפי האפסים. שני הרצפים באורך שתי קבוצות; הצורה הקנונית של RFC 5952 מכווצת את הראשון: 2001:db8::1:0:0:1. אפשרות 3 תקינה אבל לא מקוצרת, ואפשרות 4 פשוט מאבדת קבוצות.") },
      { q: t("Your IPv6 service accepts connections, small API calls work, but large file downloads hang. Most likely cause?", "השירות שלך ב-IPv6 מקבל חיבורים, קריאות API קטנות עובדות, אבל הורדות של קבצים גדולים נתקעות. מה הסיבה הכי סבירה?"),
        options: [t("The /64 subnet is full", "ה-subnet של ה-/64 מלא"), t("ICMPv6 'Packet Too Big' is filtered, breaking Path MTU Discovery", "ICMPv6 'Packet Too Big' מסונן, וזה שובר את ה-Path MTU Discovery"), t("DHCPv6 lease expired", "ה-lease של DHCPv6 פג"), t("Happy Eyeballs chose IPv4", "Happy Eyeballs בחר IPv4")],
        answer: 1,
        explain: t("IPv6 routers never fragment; senders learn the path MTU from ICMPv6 type 2. If it's dropped, full-size packets vanish silently - a black hole that only hits large transfers.", "ראוטרים ב-IPv6 אף פעם לא מפצלים; השולח לומד את ה-MTU של המסלול מ-ICMPv6 סוג 2. אם הוא נזרק, חבילות בגודל מלא נעלמות בשקט - black hole שפוגע רק בהעברות גדולות.") },
      { q: t("Since Feb 2024, what does AWS charge for a public IPv4 address attached to a running instance?", "מאז פברואר 2024, כמה AWS גובה על כתובת IPv4 ציבורית שמחוברת ל-instance שרץ?"),
        options: [t("Nothing - only idle Elastic IPs are charged", "כלום - רק Elastic IPs לא בשימוש מחויבים"), t("$0.005 per hour, in use or not", "‎$0.005 לשעה, בשימוש או לא"), t("$0.045 per GB processed", "‎$0.045 לכל GB שעובר"), t("Only IPv6 addresses are charged", "רק כתובות IPv6 מחויבות")],
        answer: 1,
        explain: t("All public IPv4 addresses (EIP, auto-assigned, on LBs, NAT GWs, RDS) cost $0.005/hour ≈ $44/year. IPv6 addresses are free, which is a direct incentive for dual-stack or IPv6-only designs.", "כל כתובות ה-IPv4 הציבוריות (EIP, אוטומטיות, על LBs, ‏NAT GWs, ‏RDS) עולות ‎$0.005 לשעה ≈ ‎$44 לשנה. כתובות IPv6 בחינם, וזה תמריץ ישיר לתכנון dual-stack או IPv6-only.") },
      { q: t("A per-IP rate limiter is being bypassed by an attacker over IPv6. Best fix?", "תוקף עוקף rate limiter לפי IP דרך IPv6. מה התיקון הכי טוב?"),
        options: [t("Block all IPv6 traffic", "לחסום את כל תעבורת ה-IPv6"), t("Lower the limit to 1 request per minute", "להוריד את הגבול לבקשה אחת לדקה"), t("Use the link-local address as the key", "להשתמש בכתובת ה-link-local כמפתח"), t("Rate-limit IPv6 clients by their /64 prefix", "לעשות rate limit ללקוחות IPv6 לפי ה-prefix של ה-/64 שלהם")],
        answer: 3,
        explain: t("A single host or customer controls at least a whole /64 and can rotate addresses freely. Aggregating to /64 (or wider for abuse) restores the meaning of 'one client'. Link-local addresses never leave the link.", "host או לקוח בודד שולט לפחות ב-/64 שלם ויכול להחליף כתובות בחופשיות. צבירה ל-/64 (או רחב יותר במקרי abuse) מחזירה את המשמעות של 'לקוח אחד'. כתובות link-local אף פעם לא יוצאות מה-link.") }
    ],
    playground: "cidr",
    related: ["net-ip-cidr", "net-vpc", "net-nat-conntrack", "k8s-networking-cni", "cloud-finops"]
  });

  G.push({ term: "SLAAC", track: "networking", lesson: "net-ipv6",
    def: t("Stateless Address Autoconfiguration: an IPv6 host builds its own address from the /64 prefix in a Router Advertisement plus a self-generated interface ID - no DHCP server needed.", "Stateless Address Autoconfiguration: ‏host ב-IPv6 בונה לעצמו כתובת מה-prefix של ה-/64 שמגיע ב-Router Advertisement ועוד interface ID שהוא מייצר לבד - בלי שרת DHCP.") });
  G.push({ term: "Link-local address", track: "networking", lesson: "net-ipv6",
    def: t("An fe80::/10 address every IPv6 interface has automatically; valid only on its link, never routed, used by NDP and as the default gateway address.", "כתובת fe80::/10 שיש אוטומטית לכל interface ב-IPv6; תקפה רק על ה-link שלה, אף פעם לא מנותבת, משמשת את NDP וככתובת ה-default gateway.") });
  G.push({ term: "Happy Eyeballs", track: "networking", lesson: "net-ipv6",
    def: t("RFC 8305 client algorithm: try IPv6 first and start a parallel IPv4 attempt after ~250 ms, using whichever connects first - hides broken IPv6 at the cost of latency.", "אלגוריתם לקוח לפי RFC 8305: מנסים IPv6 קודם ומתחילים ניסיון IPv4 במקביל אחרי בערך 250ms, ולוקחים את מי שמתחבר ראשון - מסתיר IPv6 שבור במחיר של latency.") });
})();

(function () {
  var L = window.INFRA.lessons, G = window.INFRA.glossary;
  function t(en, he) { return { en: en, he: he }; }

  /* ---------------------------------------------------- net-http-caching */
  L.push({
    id: "net-http-caching",
    track: "networking",
    order: 31,
    icon: "🗄️",
    level: 2,
    minutes: 14,
    title: t("HTTP Caching & CDN Rules", "HTTP Caching וחוקי CDN"),
    tldr: t(
      "The origin decides caching with Cache-Control: max-age for browsers, s-maxage for CDNs, no-cache means 'revalidate', no-store means 'never keep'. Hash your asset filenames and cache them for a year, keep HTML short-lived, and remember that every header you add to the cache key (or Vary) splits your hit ratio.",
      "ה-origin מחליט על caching עם Cache-Control: ‏max-age לדפדפנים, s-maxage ל-CDN-ים, ‏no-cache אומר 'תאמת מחדש', ‏no-store אומר 'אל תשמור בכלל'. שים hash בשמות קבצי ה-assets ותשמור אותם לשנה, תשאיר את ה-HTML קצר-חיים, וזכור שכל header שאתה מוסיף ל-cache key (או ל-Vary) מפצל לך את ה-hit ratio."
    ),
    analogy: t(
      "A newspaper stand. The publisher prints 'valid until 6 pm' on each copy (max-age). The stand may keep selling it until then without calling the printer. 'no-cache' is a paper stamped 'call us before selling each copy - we'll just say yes or send a new edition' (304 vs 200). 'no-store' is a classified letter: never put it on the shelf. And versioned URLs are like printing the date in the title - yesterday's paper and today's paper can sit side by side without confusion.",
      "דוכן עיתונים. ההוצאה מדפיסה על כל עותק 'בתוקף עד 18:00' (max-age). הדוכן יכול להמשיך למכור אותו עד אז בלי להתקשר לדפוס. 'no-cache' זה עיתון עם חותמת 'תתקשר אלינו לפני כל מכירה - נגיד לך רק כן, או נשלח מהדורה חדשה' (304 מול 200). 'no-store' זה מכתב מסווג: אסור לשים אותו על המדף. ו-URLs עם גרסה הם כמו להדפיס את התאריך בכותרת - העיתון של אתמול והעיתון של היום יושבים אחד ליד השני בלי בלבול."
    ),
    sections: [
      {
        h: t("Cache-Control directives, precisely", "ה-directives של Cache-Control, בדיוק"),
        body: t(
`<p>Two kinds of caches: <strong>private</strong> (the browser) and <strong>shared</strong> (CDN, reverse proxy, corporate proxy). <code>Cache-Control</code> (RFC 9111) tells each what it may do:</p>
<table>
<tr><th>Directive</th><th>Meaning</th></tr>
<tr><td><code>max-age=600</code></td><td>Fresh for 600 s in any cache.</td></tr>
<tr><td><code>s-maxage=3600</code></td><td>Overrides max-age for <strong>shared</strong> caches only. Lets the CDN keep it for an hour while browsers keep it 10 min.</td></tr>
<tr><td><code>no-cache</code></td><td>May be stored, but <strong>must revalidate</strong> with the origin before every use. Not "don't cache".</td></tr>
<tr><td><code>no-store</code></td><td>Never write it to any cache. For secrets, PII, bank statements.</td></tr>
<tr><td><code>private</code></td><td>Only the browser may store it; CDNs must not.</td></tr>
<tr><td><code>public</code></td><td>Shared caches may store it even if normally they wouldn't (e.g. request had <code>Authorization</code>).</td></tr>
<tr><td><code>immutable</code></td><td>Content will never change at this URL - don't even revalidate on reload.</td></tr>
<tr><td><code>must-revalidate</code></td><td>Once stale, never serve it without a successful revalidation.</td></tr>
<tr><td><code>stale-while-revalidate=60</code></td><td>After expiry, serve stale for up to 60 s while refreshing in the background (RFC 5861). Hides origin latency.</td></tr>
<tr><td><code>stale-if-error=86400</code></td><td>If the origin errors (5xx/timeout), serve stale for up to a day. Free availability.</td></tr>
</table>
<p>CDN-only knobs also exist: <code>CDN-Cache-Control</code> (RFC 9213, honored by Cloudflare, Akamai, Fastly) and Fastly's <code>Surrogate-Control</code>; CDNs strip them before the browser. Without any of these, caches may apply <strong>heuristic freshness</strong> (often 10% of the time since <code>Last-Modified</code>) - which is why "we didn't set caching" still gets cached.</p>
<pre># The two policies that cover 90% of sites
# 1) Fingerprinted assets: /static/app.3f9a1c.js
Cache-Control: public, max-age=31536000, immutable
# 2) HTML entry points and their aliases (/ and /index.html)
Cache-Control: no-cache            # or: max-age=0, s-maxage=60, stale-while-revalidate=30</pre>`,
`<p>יש שני סוגי caches: <strong>private</strong> (הדפדפן) ו-<strong>shared</strong> (‏CDN, ‏reverse proxy, proxy ארגוני). ‏<code>Cache-Control</code> (‏RFC 9111) אומר לכל אחד מה מותר לו:</p>
<table>
<tr><th>Directive</th><th>משמעות</th></tr>
<tr><td><code>max-age=600</code></td><td>טרי ל-600 שניות בכל cache.</td></tr>
<tr><td><code>s-maxage=3600</code></td><td>דורס את max-age רק ל-caches מסוג <strong>shared</strong>. מאפשר ל-CDN לשמור שעה בזמן שהדפדפן שומר 10 דקות.</td></tr>
<tr><td><code>no-cache</code></td><td>מותר לשמור, אבל <strong>חובה לאמת מחדש</strong> מול ה-origin לפני כל שימוש. זה לא "אל תשמור".</td></tr>
<tr><td><code>no-store</code></td><td>אסור לכתוב לשום cache. לסודות, PII, דפי חשבון בנק.</td></tr>
<tr><td><code>private</code></td><td>רק הדפדפן רשאי לשמור; ל-CDN-ים אסור.</td></tr>
<tr><td><code>public</code></td><td>caches משותפים רשאים לשמור גם כשבדרך כלל לא היו (למשל כשבבקשה יש <code>Authorization</code>).</td></tr>
<tr><td><code>immutable</code></td><td>התוכן ב-URL הזה לעולם לא ישתנה - אל תאמת מחדש אפילו ב-reload.</td></tr>
<tr><td><code>must-revalidate</code></td><td>ברגע שזה stale, אסור להגיש בלי אימות מחדש מוצלח.</td></tr>
<tr><td><code>stale-while-revalidate=60</code></td><td>אחרי שפג התוקף, אפשר להגיש stale עד 60 שניות בזמן שמרעננים ברקע (‏RFC 5861). מסתיר את ה-latency של ה-origin.</td></tr>
<tr><td><code>stale-if-error=86400</code></td><td>אם ה-origin מחזיר שגיאה (5xx או timeout), אפשר להגיש stale עד יום. זמינות בחינם.</td></tr>
</table>
<p>יש גם כפתורים ל-CDN בלבד: <code>CDN-Cache-Control</code> (‏RFC 9213, נתמך ב-Cloudflare, ‏Akamai, ‏Fastly) וה-<code>Surrogate-Control</code> של Fastly; ה-CDN מוריד אותם לפני שהתשובה מגיעה לדפדפן. בלי אף אחד מאלה, caches רשאים להפעיל <strong>heuristic freshness</strong> (לרוב 10% מהזמן שעבר מאז <code>Last-Modified</code>) - ולכן גם "לא הגדרנו caching" עדיין נשמר ב-cache.</p>
<pre># The two policies that cover 90% of sites
# 1) Fingerprinted assets: /static/app.3f9a1c.js
Cache-Control: public, max-age=31536000, immutable
# 2) HTML entry points and their aliases (/ and /index.html)
Cache-Control: no-cache            # or: max-age=0, s-maxage=60, stale-while-revalidate=30</pre>`
        )
      },
      {
        h: t("Validation: ETag, Last-Modified and 304", "Validation: ‏ETag, ‏Last-Modified ו-304"),
        body: t(
`<p>When a cached copy is stale (or <code>no-cache</code>), the cache doesn't refetch blindly - it <strong>revalidates</strong> with a conditional request. If nothing changed, the origin answers <code>304 Not Modified</code> with no body: a few hundred bytes instead of 2 MB.</p>
<pre>GET /app.css HTTP/1.1
If-None-Match: "5e3c-1f2a9b"
If-Modified-Since: Tue, 10 Nov 2026 08:00:00 GMT

HTTP/1.1 304 Not Modified
ETag: "5e3c-1f2a9b"
Cache-Control: max-age=600</pre>
<ul>
<li><strong>ETag</strong>: an opaque version tag. Strong (<code>"abc"</code>) = byte-identical; weak (<code>W/"abc"</code>) = semantically equivalent (e.g. same content, different gzip). <code>If-None-Match</code> wins over <code>If-Modified-Since</code>.</li>
<li><strong>Last-Modified</strong>: 1-second resolution, so two deploys in the same second look identical.</li>
</ul>
<blockquote>⚠️ Production tip: nginx and Apache build default ETags from mtime + size. Behind a load balancer, each node has a different mtime for the "same" file → different ETags → revalidations return 200 instead of 304 at random. Hash the content (most build tools do), or disable ETag and rely on fingerprinted URLs.</blockquote>`,
`<p>כשעותק ב-cache הוא stale (או מסומן <code>no-cache</code>), ה-cache לא מושך מחדש בעיוורון - הוא <strong>מאמת מחדש</strong> עם בקשה מותנית. אם כלום לא השתנה, ה-origin עונה <code>304 Not Modified</code> בלי body: כמה מאות bytes במקום 2MB.</p>
<pre>GET /app.css HTTP/1.1
If-None-Match: "5e3c-1f2a9b"
If-Modified-Since: Tue, 10 Nov 2026 08:00:00 GMT

HTTP/1.1 304 Not Modified
ETag: "5e3c-1f2a9b"
Cache-Control: max-age=600</pre>
<ul>
<li><strong>ETag</strong>: תג גרסה אטום. ‏Strong (<code>"abc"</code>) = זהה byte אחר byte; ‏weak (<code>W/"abc"</code>) = שקול סמנטית (למשל אותו תוכן, gzip אחר). ‏<code>If-None-Match</code> גובר על <code>If-Modified-Since</code>.</li>
<li><strong>Last-Modified</strong>: רזולוציה של שנייה, אז שני deploys באותה שנייה נראים זהים.</li>
</ul>
<blockquote>⚠️ Production tip: ‏nginx ו-Apache בונים ETag ברירת מחדל מ-mtime וגודל. מאחורי load balancer, לכל node יש mtime אחר לאותו קובץ "זהה" → ETags שונים → אימותים מחזירים 200 במקום 304 באופן אקראי. תעשה hash לתוכן (רוב כלי ה-build עושים את זה), או תכבה ETag ותסתמך על URLs עם fingerprint.</blockquote>`
        )
      },
      {
        h: t("Cache keys and Vary: where hit ratios go to die", "Cache keys ו-Vary: איפה ה-hit ratio הולך למות"),
        body: t(
`<p>A CDN stores each object under a <strong>cache key</strong> - by default roughly <code>scheme + host + path + query string</code>. Anything that changes the key creates a new copy and a new origin fetch:</p>
<ul>
<li><strong>Query strings</strong>: <code>?utm_source=x&amp;fbclid=y</code> makes every ad click a cache miss. Strip marketing params from the key, or whitelist only the ones that change the response.</li>
<li><strong>Vary</strong>: the origin says "the response depends on this request header". <code>Vary: Accept-Encoding</code> is fine (2-3 variants). <code>Vary: User-Agent</code> means thousands of variants - effectively no cache. <code>Vary: Cookie</code> means one copy per user.</li>
<li><strong>Forwarded headers / cookies</strong>: in CloudFront, every header, cookie or query param in the <em>cache policy</em> becomes part of the key. Forward <code>Authorization</code> or all cookies "just in case" and your hit ratio drops to ~0.</li>
</ul>
<p>CDNs differ: Cloudflare largely ignores Vary except <code>Accept-Encoding</code> (and image content negotiation on some plans); CloudFront builds the key only from its cache policy rather than from <code>Vary</code>; Fastly and Varnish honor Vary fully. Know your CDN before relying on Vary for correctness.</p>
<blockquote>💡 Real world: a site added <code>Vary: Accept-Language</code> for i18n. Browsers send hundreds of combinations (<code>he-IL,he;q=0.9,en-US;q=0.8</code>...). Hit ratio fell from 94% to 31% and origin CPU tripled. The fix: normalize the header at the edge to 2 values (<code>he</code>/<code>en</code>) and key on that.</blockquote>`,
`<p>CDN שומר כל אובייקט תחת <strong>cache key</strong> - ברירת המחדל היא בערך <code>scheme + host + path + query string</code>. כל דבר שמשנה את ה-key יוצר עותק חדש ובקשה חדשה ל-origin:</p>
<ul>
<li><strong>Query strings</strong>: ‏<code>?utm_source=x&amp;fbclid=y</code> הופך כל קליק על מודעה ל-cache miss. תוריד פרמטרים שיווקיים מה-key, או תאשר רק את אלה שבאמת משנים את התשובה.</li>
<li><strong>Vary</strong>: ה-origin אומר "התשובה תלויה ב-header הזה של הבקשה". ‏<code>Vary: Accept-Encoding</code> זה בסדר (2-3 גרסאות). ‏<code>Vary: User-Agent</code> זה אלפי גרסאות - בפועל אין cache. ‏<code>Vary: Cookie</code> זה עותק לכל משתמש.</li>
<li><strong>Headers ו-cookies שמועברים</strong>: ב-CloudFront, כל header, ‏cookie או query param שב-<em>cache policy</em> הופך לחלק מה-key. תעביר <code>Authorization</code> או את כל ה-cookies "ליתר ביטחון" וה-hit ratio שלך יורד לבערך 0.</li>
</ul>
<p>ה-CDN-ים שונים: Cloudflare ברובו מתעלם מ-Vary חוץ מ-<code>Accept-Encoding</code> (ומ-content negotiation לתמונות בחלק מהתוכניות); ‏CloudFront בונה את ה-key רק מה-cache policy שלו ולא מ-<code>Vary</code>; ‏Fastly ו-Varnish מכבדים Vary במלואו. תכיר את ה-CDN שלך לפני שאתה סומך על Vary בשביל נכונות.</p>
<blockquote>💡 Real world: אתר הוסיף <code>Vary: Accept-Language</code> בשביל i18n. דפדפנים שולחים מאות צירופים (<code>he-IL,he;q=0.9,en-US;q=0.8</code>...). ה-hit ratio ירד מ-94% ל-31% וה-CPU של ה-origin שולש. התיקון: לנרמל את ה-header ב-edge לשני ערכים (<code>he</code> או <code>en</code>) ולבנות את ה-key לפיהם.</blockquote>`
        )
      },
      {
        h: t("Invalidation, versioned URLs and caching APIs", "Invalidation, ‏URLs עם גרסה, ו-caching ל-APIs"),
        body: t(
`<p>"There are only two hard things in CS: cache invalidation and naming things." The cheapest invalidation is <strong>never needing one</strong>: put a content hash in the filename (<code>app.3f9a1c.js</code>), cache it for a year with <code>immutable</code>, and only the small, short-lived HTML points at the new names. Old and new versions coexist, so users mid-session don't break.</p>
<p>When you must purge:</p>
<table>
<tr><th>CDN</th><th>Purge mechanics</th></tr>
<tr><td>CloudFront</td><td><code>create-invalidation</code>; first 1,000 paths/month free, then <strong>$0.005 per path</strong>; <code>/*</code> counts as one path. Usually completes in under a minute to a few minutes.</td></tr>
<tr><td>Cloudflare</td><td>Purge by URL, by prefix/host, by <code>Cache-Tag</code>, or "everything"; propagates globally in seconds.</td></tr>
<tr><td>Fastly</td><td>Instant purge (~150 ms global) by URL or <strong>surrogate key</strong>; soft purge marks stale instead of deleting, so <code>stale-if-error</code> still works.</td></tr>
</table>
<p>Tag-based purge is the grown-up pattern: the origin returns <code>Surrogate-Key: product-123 category-9</code>, and when product 123 changes you purge one tag instead of guessing URLs. "Purge everything" after each deploy is an anti-pattern: every edge refills from origin at once - a self-inflicted thundering herd.</p>
<p><strong>Caching APIs</strong> is safe when you are explicit:</p>
<pre># Public, same for everyone (catalog, prices list)
Cache-Control: public, s-maxage=30, stale-while-revalidate=30, stale-if-error=600
# Per-user (GET /api/me, cart)
Cache-Control: private, no-store
# Never cache responses that set a cookie - most CDNs bypass, a "cache everything" rule won't</pre>
<p>Shared caches won't store a response to a request with <code>Authorization</code> unless you add <code>public</code> or <code>s-maxage</code>. Even 1-5 seconds of edge caching on a hot public endpoint collapses thousands of identical requests per second into one origin request (pair it with request coalescing / "origin shield").</p>`,
`<p>"יש רק שני דברים קשים במדעי המחשב: cache invalidation ומתן שמות." ה-invalidation הכי זול הוא <strong>כזה שלא צריך</strong>: שים hash של התוכן בשם הקובץ (<code>app.3f9a1c.js</code>), תשמור אותו לשנה עם <code>immutable</code>, ורק ה-HTML הקטן וקצר-החיים מצביע על השמות החדשים. הגרסה הישנה והחדשה חיות במקביל, אז משתמשים באמצע session לא נשברים.</p>
<p>כשחייבים לעשות purge:</p>
<table>
<tr><th>CDN</th><th>איך עובד ה-purge</th></tr>
<tr><td>CloudFront</td><td><code>create-invalidation</code>; ‏1,000 ה-paths הראשונים בחודש בחינם, ואז <strong>‎$0.005 לכל path</strong>; ‏<code>/*</code> נספר כ-path אחד. בדרך כלל מסתיים תוך פחות מדקה עד כמה דקות.</td></tr>
<tr><td>Cloudflare</td><td>Purge לפי URL, לפי prefix או host, לפי <code>Cache-Tag</code>, או "הכול"; מתפשט גלובלית תוך שניות.</td></tr>
<tr><td>Fastly</td><td>Purge מיידי (בערך 150ms גלובלית) לפי URL או לפי <strong>surrogate key</strong>; ‏soft purge מסמן כ-stale במקום למחוק, כך ש-<code>stale-if-error</code> ממשיך לעבוד.</td></tr>
</table>
<p>Purge לפי tags זו התבנית הבוגרת: ה-origin מחזיר <code>Surrogate-Key: product-123 category-9</code>, וכשמוצר 123 משתנה אתה עושה purge ל-tag אחד במקום לנחש URLs. "Purge everything" אחרי כל deploy זה anti-pattern: כל ה-edges מתמלאים מה-origin בבת אחת - thundering herd שהבאת על עצמך.</p>
<p><strong>Caching ל-APIs</strong> בטוח כשאתה מפורש:</p>
<pre># Public, same for everyone (catalog, prices list)
Cache-Control: public, s-maxage=30, stale-while-revalidate=30, stale-if-error=600
# Per-user (GET /api/me, cart)
Cache-Control: private, no-store
# Never cache responses that set a cookie - most CDNs bypass, a "cache everything" rule won't</pre>
<p>caches משותפים לא ישמרו תשובה לבקשה עם <code>Authorization</code> אלא אם תוסיף <code>public</code> או <code>s-maxage</code>. אפילו 1-5 שניות של caching ב-edge על endpoint ציבורי חם מכווצות אלפי בקשות זהות בשנייה לבקשה אחת ל-origin (בשילוב request coalescing או "origin shield").</p>`
        )
      },
      {
        h: t("Debugging with curl, and cache poisoning", "Debugging עם curl, ו-cache poisoning"),
        body: t(
`<p>Always look at the response headers before theorizing:</p>
<pre>$ curl -sI https://www.example.com/static/app.3f9a1c.js
HTTP/2 200
cache-control: public, max-age=31536000, immutable
etag: "9b2e1f"
age: 48211                         # seconds this copy has sat in the cache
x-cache: Hit from cloudfront       # CloudFront: Hit / Miss / RefreshHit / Error
x-amz-cf-pop: TLV50-C1             # which edge answered (Tel Aviv)
$ curl -sI https://www.example.com/ | grep -i -E 'cf-cache-status|age|cache-control'
cf-cache-status: HIT               # Cloudflare: HIT MISS EXPIRED REVALIDATED STALE UPDATING BYPASS DYNAMIC
age: 120</pre>
<ul>
<li><code>Age</code> growing past your intended TTL → the CDN is using a different TTL (edge override / min TTL), not your header.</li>
<li><code>cf-cache-status: DYNAMIC</code> → Cloudflare decided not to cache (e.g. HTML by default); <code>BYPASS</code> → a rule or <code>Set-Cookie</code>/<code>no-store</code> prevented it.</li>
<li>Test as a browser does: <code>-H 'Accept-Encoding: gzip, br'</code> - a compressed variant can be cached separately from the plain one.</li>
</ul>
<p><strong>Web cache poisoning</strong>: an attacker sends a request with an <em>unkeyed</em> input that the origin reflects into the response, e.g. <code>X-Forwarded-Host: evil.com</code> turning into <code>&lt;script src="https://evil.com/app.js"&gt;</code>. The poisoned response is cached under the normal key and served to everyone. <strong>Cache deception</strong> is the reverse: tricking the CDN into caching a private page, e.g. <code>/account/profile.css</code> served by a lenient router and cached because of a <code>.css</code> extension rule.</p>
<blockquote>⚠️ Production tip: defenses - never reflect unkeyed headers into responses; strip <code>X-Forwarded-Host</code>/<code>X-Original-URL</code> at the edge; cache by explicit path rules, not file extensions; make the origin send <code>private, no-store</code> on authenticated pages so a misconfigured CDN rule can't silently override intent; and enable "cache deception armor"-style checks (content type must match the extension).</blockquote>`,
`<p>תמיד תסתכל על ה-headers של התשובה לפני שאתה בונה תיאוריות:</p>
<pre>$ curl -sI https://www.example.com/static/app.3f9a1c.js
HTTP/2 200
cache-control: public, max-age=31536000, immutable
etag: "9b2e1f"
age: 48211                         # seconds this copy has sat in the cache
x-cache: Hit from cloudfront       # CloudFront: Hit / Miss / RefreshHit / Error
x-amz-cf-pop: TLV50-C1             # which edge answered (Tel Aviv)
$ curl -sI https://www.example.com/ | grep -i -E 'cf-cache-status|age|cache-control'
cf-cache-status: HIT               # Cloudflare: HIT MISS EXPIRED REVALIDATED STALE UPDATING BYPASS DYNAMIC
age: 120</pre>
<ul>
<li><code>Age</code> שעולה מעבר ל-TTL שהתכוונת אליו → ה-CDN משתמש ב-TTL אחר (override ב-edge או min TTL), לא ב-header שלך.</li>
<li><code>cf-cache-status: DYNAMIC</code> → ‏Cloudflare החליט לא לשמור (למשל HTML כברירת מחדל); ‏<code>BYPASS</code> → חוק, או <code>Set-Cookie</code> או <code>no-store</code>, מנעו את השמירה.</li>
<li>תבדוק כמו שדפדפן עושה: <code>-H 'Accept-Encoding: gzip, br'</code> - גרסה דחוסה יכולה להישמר בנפרד מהגרסה הרגילה.</li>
</ul>
<p><strong>Web cache poisoning</strong>: תוקף שולח בקשה עם קלט שהוא <em>לא חלק מה-key</em>, וה-origin משקף אותו בתשובה, למשל <code>X-Forwarded-Host: evil.com</code> שהופך ל-<code>&lt;script src="https://evil.com/app.js"&gt;</code>. התשובה המורעלת נשמרת תחת ה-key הרגיל ומוגשת לכולם. <strong>Cache deception</strong> זה ההפך: לגרום ל-CDN לשמור דף פרטי, למשל <code>/account/profile.css</code> שמוגש על ידי router סלחני ונשמר בגלל חוק לפי סיומת <code>.css</code>.</p>
<blockquote>⚠️ Production tip: ההגנות - אף פעם לא לשקף headers שאינם חלק מה-key; להוריד <code>X-Forwarded-Host</code> ו-<code>X-Original-URL</code> ב-edge; לעשות cache לפי חוקי path מפורשים, לא לפי סיומות; לגרום ל-origin לשלוח <code>private, no-store</code> בדפים מאומתים כדי שחוק CDN שגוי לא ידרוס בשקט את הכוונה; ולהפעיל בדיקות בסגנון "cache deception armor" (ה-content type חייב להתאים לסיומת).</blockquote>`
        )
      }
    ],
    diagram: "Browser cache --(max-age)--> CDN edge --(s-maxage)--> origin shield --> origin\n      |                          |\n      | If-None-Match: \"v7\"       | 304 Not Modified (no body)\n      '--------------------------'\nkey = scheme + host + path + [allowed query/headers/cookies]",
    handsOn: [
      { cmd: "curl -sI https://www.cloudflare.com/ | grep -i -E 'cache-control|age|cf-cache-status|etag|vary'", what: t("Read a real CDN's caching headers: policy, Age, HIT/MISS/DYNAMIC and Vary.", "קרא את ה-headers של caching ב-CDN אמיתי: המדיניות, ‏Age, ‏HIT/MISS/DYNAMIC ו-Vary.") },
      { cmd: "E=$(curl -sI https://example.com/ | awk -F': ' 'tolower($1)==\"etag\"{print $2}' | tr -d '\\r'); curl -sI -H \"If-None-Match: $E\" https://example.com/ | head -1", what: t("Do a manual revalidation: send the ETag back and expect 304 Not Modified.", "עשה revalidation ידני: שלח את ה-ETag בחזרה וצפה ל-304 Not Modified.") },
      { cmd: "for i in 1 2 3; do curl -so /dev/null -D - \"https://example.com/?utm_source=$RANDOM\" | grep -i -E 'x-cache|cf-cache-status|age'; done", what: t("See whether random query strings bust the cache key (every request a MISS = they're in the key).", "בדוק אם query strings אקראיים שוברים את ה-cache key (כל בקשה MISS = הם חלק מה-key).") },
      { cmd: "aws cloudfront create-invalidation --distribution-id E123ABC --paths /index.html /", what: t("Invalidate only the short-lived entry points after a deploy (2 paths, effectively free) instead of /*.", "עשה invalidation רק לנקודות הכניסה קצרות-החיים אחרי deploy (‏2 paths, כמעט בחינם) במקום /*.") }
    ],
    mnemonic: t(
      "\"Hash it and cache it forever; HTML asks every time; private stays home; no-store never leaves.\"",
      "\"שים hash ותשמור לנצח; ה-HTML שואל כל פעם; private נשאר בבית; no-store לא יוצא לעולם.\""
    ),
    pitfalls: [
      t("Using no-cache when you meant no-store (or the reverse). no-cache still stores sensitive responses on disk; no-store on static assets throws away all caching.", "להשתמש ב-no-cache כשהתכוונת ל-no-store (או ההפך). ‏no-cache עדיין שומר תשובות רגישות בדיסק; ‏no-store על assets סטטיים זורק את כל ה-caching."),
      t("Long max-age on index.html: after a deploy, browsers keep the old HTML pointing at asset files your deploy just deleted - blank pages until the cache expires. Purging the CDN does not clear browser caches.", "max-age ארוך על index.html: אחרי deploy, דפדפנים מחזיקים את ה-HTML הישן שמצביע על קבצי assets שה-deploy בדיוק מחק - דפים לבנים עד שה-cache פג. ‏purge ב-CDN לא מנקה caches של דפדפנים."),
      t("Adding headers/cookies to the cache key or Vary 'to be safe' and silently dropping the hit ratio - watch hit ratio and origin requests as deploy metrics.", "להוסיף headers או cookies ל-cache key או ל-Vary 'ליתר ביטחון' ולהוריד בשקט את ה-hit ratio - תעקוב אחרי ה-hit ratio ומספר הבקשות ל-origin כמדדי deploy."),
      t("'Cache everything' edge rules that also match /api or logged-in pages - one user's personalized response served to everyone.", "חוקי 'cache everything' ב-edge שתופסים גם את /api או דפים של משתמשים מחוברים - התשובה האישית של משתמש אחד מוגשת לכולם.")
    ],
    interview: [
      { q: t("Design the caching policy for an SPA: index.html, JS/CSS bundles, and a public product API.", "תכנן מדיניות caching ל-SPA: ‏index.html, ‏bundles של JS/CSS, ו-API ציבורי של מוצרים."),
        a: t("Bundles: content-hashed names + public, max-age=31536000, immutable. index.html: no-cache (or s-maxage=60 with stale-while-revalidate) so new deploys are seen immediately; deploy assets first, HTML last, and keep old bundles for days. Product API: public, s-maxage=30-60, stale-while-revalidate, stale-if-error, purged by surrogate key on change. Per-user APIs: private, no-store.", "Bundles: שמות עם hash של התוכן + public, max-age=31536000, immutable. ‏index.html: ‏no-cache (או s-maxage=60 עם stale-while-revalidate) כדי ש-deploys חדשים ייראו מיד; מעלים assets קודם, HTML אחרון, ומשאירים bundles ישנים כמה ימים. ‏API מוצרים: ‏public, s-maxage=30-60, ‏stale-while-revalidate, ‏stale-if-error, ו-purge לפי surrogate key כשמשהו משתנה. ‏APIs אישיים: ‏private, no-store.") },
      { q: t("What is the difference between no-cache and must-revalidate?", "מה ההבדל בין no-cache ל-must-revalidate?"),
        a: t("no-cache requires revalidation before every use, even when fresh. must-revalidate allows serving while fresh, but forbids serving a stale copy without successful revalidation (no stale-if-error leniency; the cache returns 504 if the origin is unreachable).", "no-cache דורש אימות מחדש לפני כל שימוש, גם כשהעותק טרי. ‏must-revalidate מאפשר להגיש כל עוד העותק טרי, אבל אוסר להגיש עותק stale בלי אימות מוצלח (בלי הסלחנות של stale-if-error; ה-cache מחזיר 504 אם ה-origin לא זמין).") }
    ],
    quiz: [
      { q: t("You want browsers to keep a response for 60 s but the CDN to keep it for 10 min. Which header?", "אתה רוצה שדפדפנים ישמרו תשובה 60 שניות וה-CDN ישמור 10 דקות. איזה header?"),
        options: [t("Cache-Control: max-age=600, private", "Cache-Control: max-age=600, private"), t("Cache-Control: no-cache, max-age=60", "Cache-Control: no-cache, max-age=60"), t("Cache-Control: no-store, s-maxage=600", "Cache-Control: no-store, s-maxage=600"), t("Cache-Control: public, max-age=60, s-maxage=600", "Cache-Control: public, max-age=60, s-maxage=600")],
        answer: 3,
        explain: t("s-maxage applies only to shared caches and overrides max-age there; browsers ignore it and use max-age=60. private would forbid the CDN entirely; no-store forbids everyone.", "s-maxage חל רק על caches משותפים ודורס שם את max-age; דפדפנים מתעלמים ממנו ומשתמשים ב-max-age=60. ‏private היה אוסר על ה-CDN לגמרי; ‏no-store אוסר על כולם.") },
      { q: t("What does Cache-Control: no-cache actually mean?", "מה Cache-Control: no-cache אומר בפועל?"),
        options: [t("Never store the response anywhere", "לעולם לא לשמור את התשובה בשום מקום"), t("Store it, but revalidate with the origin before each use", "לשמור, אבל לאמת מחדש מול ה-origin לפני כל שימוש"), t("Only the CDN may store it", "רק ה-CDN רשאי לשמור"), t("Cache for the browser's default heuristic time", "לשמור לפי זמן ה-heuristic ברירת המחדל של הדפדפן")],
        answer: 1,
        explain: t("no-cache = 'check before using'. Combined with an ETag, most checks return a cheap 304. 'Never store' is no-store.", "no-cache = 'תבדוק לפני שאתה משתמש'. בשילוב עם ETag, רוב הבדיקות מחזירות 304 זול. 'לעולם לא לשמור' זה no-store.") },
      { q: t("After adding Vary: User-Agent at the origin (behind Fastly), origin load triples. Why?", "אחרי שהוספת Vary: User-Agent ב-origin (מאחורי Fastly), העומס על ה-origin שולש. למה?"),
        options: [t("Fastly stopped caching all responses with Vary", "Fastly הפסיק לשמור כל תשובה עם Vary"), t("User-Agent forces TLS renegotiation", "User-Agent מכריח TLS renegotiation"), t("Every distinct User-Agent string becomes a separate cache variant, so the hit ratio collapses", "כל מחרוזת User-Agent שונה הופכת לגרסה נפרדת ב-cache, אז ה-hit ratio קורס"), t("Vary disables 304 responses", "Vary מבטל תשובות 304")],
        answer: 2,
        explain: t("There are thousands of UA strings; each one needs its own origin fetch and storage slot. Normalize to a few device classes at the edge and Vary on that instead.", "יש אלפי מחרוזות UA; כל אחת צריכה בקשה משלה ל-origin ומקום משלה ב-cache. תנרמל לכמה סוגי מכשירים ב-edge ותעשה Vary על זה במקום.") },
      { q: t("Which is the best way to make a new JS bundle reach users after a deploy?", "מה הדרך הכי טובה לגרום ל-bundle חדש של JS להגיע למשתמשים אחרי deploy?"),
        options: [t("Content-hashed filename with a 1-year immutable cache, referenced from short-lived HTML", "שם קובץ עם hash של התוכן ו-cache של שנה עם immutable, שה-HTML קצר-החיים מצביע עליו"), t("Same filename, purge /* on the CDN after every deploy", "אותו שם קובץ, ו-purge ל-/* ב-CDN אחרי כל deploy"), t("Same filename with Cache-Control: no-store", "אותו שם קובץ עם Cache-Control: no-store"), t("Append a random ?v= query string on every page load", "להוסיף query string אקראי ‎?v=‎ בכל טעינת דף")],
        answer: 0,
        explain: t("Fingerprinted URLs need no invalidation, let old and new versions coexist, and keep a ~100% hit ratio. Purging /* doesn't reach browser caches and causes an origin stampede; no-store and per-load query strings disable caching.", "URLs עם fingerprint לא צריכים invalidation, מאפשרים לגרסה הישנה והחדשה לחיות במקביל, ושומרים על hit ratio של כמעט 100%. ‏purge ל-/* לא מגיע ל-caches של דפדפנים וגורם להסתערות על ה-origin; ‏no-store ו-query string בכל טעינה מבטלים את ה-caching.") }
    ],
    playground: "cache",
    related: ["net-proxies-cdn", "arch-caching", "caching-deep", "net-http-tls", "pr-http-versions"]
  });

  G.push({ term: "s-maxage", track: "networking", lesson: "net-http-caching",
    def: t("Cache-Control directive that sets freshness for shared caches (CDNs, proxies) only, overriding max-age there - lets the edge cache longer than browsers.", "directive של Cache-Control שקובע טריות רק ל-caches משותפים (‏CDN-ים, ‏proxies), ודורס שם את max-age - מאפשר ל-edge לשמור יותר זמן מהדפדפנים.") });
  G.push({ term: "Cache key", track: "networking", lesson: "net-http-caching",
    def: t("The set of request attributes (host, path, selected query params, headers, cookies) a CDN uses to identify one cached object; every extra attribute splits the cache and lowers the hit ratio.", "אוסף מאפייני הבקשה (‏host, ‏path, ‏query params נבחרים, headers, ‏cookies) שבעזרתם CDN מזהה אובייקט אחד ב-cache; כל מאפיין נוסף מפצל את ה-cache ומוריד את ה-hit ratio.") });
  G.push({ term: "Web cache poisoning", track: "networking", lesson: "net-http-caching",
    def: t("An attack where an unkeyed request input (e.g. X-Forwarded-Host) is reflected into a response that the CDN then caches and serves to every user.", "מתקפה שבה קלט בבקשה שאינו חלק מה-key (למשל X-Forwarded-Host) משתקף בתשובה, וה-CDN שומר אותה ומגיש אותה לכל המשתמשים.") });
})();

(function () {
  var L = window.INFRA.lessons, G = window.INFRA.glossary;
  function t(en, he) { return { en: en, he: he }; }

  /* ------------------------------------------------------- net-ddos-edge */
  L.push({
    id: "net-ddos-edge",
    track: "networking",
    order: 32,
    icon: "🛡️",
    level: 3,
    minutes: 14,
    title: t("DDoS & Edge Protection", "DDoS והגנה ב-edge"),
    tldr: t(
      "Volumetric L3/4 attacks (SYN floods, UDP amplification) are absorbed by anycast networks with Tbps of capacity; L7 floods look like real users and need WAF rate rules, challenges and bot scoring. None of it helps if attackers can reach your origin directly - so lock the origin to the CDN, and cap autoscaling so an attack doesn't become a bill.",
      "מתקפות נפח ב-L3/4 (‏SYN floods, ‏UDP amplification) נספגות ברשתות anycast עם קיבולת של Tbps; מתקפות ב-L7 נראות כמו משתמשים אמיתיים ודורשות חוקי rate ב-WAF, ‏challenges ו-bot scoring. שום דבר מזה לא עוזר אם התוקף יכול להגיע ישר ל-origin - אז נעל את ה-origin כך שיקבל רק מה-CDN, ושים תקרה ל-autoscaling כדי שמתקפה לא תהפוך לחשבונית."
    ),
    analogy: t(
      "A stadium on match day. A volumetric attack is 100,000 people blocking the highway - you need a wider road network (anycast) to spread them out. An L7 attack is 5,000 fake fans with forged tickets walking calmly to the gates - you need ticket scanners and bouncers (WAF, bot checks). And origin cloaking means the players' locker room has no street door at all: the only way in is through the stadium gates.",
      "אצטדיון ביום משחק. מתקפת נפח זה 100,000 אנשים שחוסמים את הכביש המהיר - צריך רשת כבישים רחבה יותר (anycast) כדי לפזר אותם. מתקפת L7 זה 5,000 אוהדים מזויפים עם כרטיסים מזויפים שהולכים בנחת לשערים - צריך סורקי כרטיסים וסדרנים (WAF, בדיקות בוטים). ו-origin cloaking זה שלחדר ההלבשה של השחקנים אין בכלל דלת לרחוב: הדרך היחידה פנימה היא דרך שערי האצטדיון."
    ),
    sections: [
      {
        h: t("Attack types: L3/4 volumetric vs L7 application", "סוגי מתקפות: נפח ב-L3/4 מול אפליקציה ב-L7"),
        body: t(
`<table>
<tr><th>Attack</th><th>How it works</th><th>Measured in</th></tr>
<tr><td><strong>SYN flood</strong></td><td>Millions of TCP SYNs with spoofed sources; the server allocates half-open connections until the backlog is full and real clients can't connect.</td><td>packets/s (Mpps)</td></tr>
<tr><td><strong>UDP reflection / amplification</strong></td><td>Attacker spoofs the victim's IP and sends small queries to open UDP services, which send big replies to the victim. Amplification factors: DNS ~28-54×, NTP <code>monlist</code> ~556×, memcached up to ~51,000× (the 1.35 Tbps attack on GitHub, 2018).</td><td>bits/s (Tbps)</td></tr>
<tr><td><strong>HTTP flood (L7)</strong></td><td>Botnets send valid HTTPS requests - often to expensive, uncacheable endpoints (search, login, <code>/cart</code>). Each request is legit-looking.</td><td>requests/s (rps)</td></tr>
<tr><td><strong>Protocol abuse</strong></td><td>HTTP/2 <strong>Rapid Reset</strong> (CVE-2023-44487): open and immediately cancel streams, so the server does work but the client's concurrency limit never fills. Peaks: 398M rps at Google, 201M at Cloudflare, 155M at AWS (Oct 2023). Slowloris holds connections open with trickling headers.</td><td>rps / connections</td></tr>
</table>
<p>Scale today: multi-Tbps volumetric attacks are routine (Cloudflare reported mitigating 7.3 Tbps in 2025, and larger ones since), mostly from IoT botnets in the Mirai family. No single data center can absorb that - only a global anycast network can, by letting every PoP soak up its share.</p>
<p>On a single Linux host, the classic SYN-flood defense is <strong>SYN cookies</strong>: the server encodes connection state into the SYN-ACK sequence number and allocates nothing until the final ACK arrives.</p>
<pre>sysctl net.ipv4.tcp_syncookies=1          # default on in most distros
sysctl net.ipv4.tcp_max_syn_backlog=8192
netstat -s | grep -i -E 'SYNs to LISTEN|cookies'   # are we under SYN pressure?</pre>`,
`<table>
<tr><th>מתקפה</th><th>איך היא עובדת</th><th>נמדדת ב-</th></tr>
<tr><td><strong>SYN flood</strong></td><td>מיליוני SYN של TCP עם כתובות מקור מזויפות; השרת מקצה חיבורים חצי-פתוחים עד שה-backlog מתמלא ולקוחות אמיתיים לא מצליחים להתחבר.</td><td>חבילות לשנייה (Mpps)</td></tr>
<tr><td><strong>UDP reflection / amplification</strong></td><td>התוקף מזייף את ה-IP של הקורבן ושולח שאילתות קטנות לשירותי UDP פתוחים, שעונים לקורבן בתשובות גדולות. פקטורי הגברה: DNS בערך ‎28-54×, ‏<code>monlist</code> של NTP בערך ‎556×, ‏memcached עד בערך ‎51,000× (המתקפה של 1.35Tbps על GitHub ב-2018).</td><td>ביטים לשנייה (Tbps)</td></tr>
<tr><td><strong>HTTP flood (L7)</strong></td><td>botnets שולחים בקשות HTTPS תקינות - לרוב ל-endpoints יקרים שאי אפשר לשמור ב-cache (חיפוש, login, ‏<code>/cart</code>). כל בקשה נראית לגיטימית.</td><td>בקשות לשנייה (rps)</td></tr>
<tr><td><strong>ניצול פרוטוקול</strong></td><td><strong>Rapid Reset</strong> של HTTP/2 (‏CVE-2023-44487): פותחים streams ומבטלים מיד, כך שהשרת עושה עבודה אבל מגבלת ה-concurrency של הלקוח אף פעם לא מתמלאת. שיאים: 398M rps ב-Google, ‏201M ב-Cloudflare, ‏155M ב-AWS (אוקטובר 2023). ‏Slowloris מחזיק חיבורים פתוחים עם headers שמטפטפים לאט.</td><td>rps וחיבורים</td></tr>
</table>
<p>הסדר גודל היום: מתקפות נפח של כמה Tbps הן שגרה (‏Cloudflare דיווחו על מתקפה של 7.3Tbps שנבלמה ב-2025, ועל גדולות יותר מאז), בעיקר מ-botnets של מכשירי IoT ממשפחת Mirai. אף data center בודד לא יכול לספוג את זה - רק רשת anycast גלובלית יכולה, כשכל PoP סופג את החלק שלו.</p>
<p>על host בודד של Linux, ההגנה הקלאסית מ-SYN flood היא <strong>SYN cookies</strong>: השרת מקודד את מצב החיבור לתוך ה-sequence number של ה-SYN-ACK ולא מקצה כלום עד שה-ACK הסופי מגיע.</p>
<pre>sysctl net.ipv4.tcp_syncookies=1          # default on in most distros
sysctl net.ipv4.tcp_max_syn_backlog=8192
netstat -s | grep -i -E 'SYNs to LISTEN|cookies'   # are we under SYN pressure?</pre>`
        )
      },
      {
        h: t("The providers: Shield, Azure DDoS, Cloud Armor, Cloudflare", "הספקים: ‏Shield, ‏Azure DDoS, ‏Cloud Armor, ‏Cloudflare"),
        body: t(
`<table>
<tr><th>Service</th><th>What you get</th><th>Price shape</th></tr>
<tr><td>AWS Shield Standard</td><td>Automatic L3/4 protection for everyone, strongest on CloudFront, Route 53 and Global Accelerator (edge locations).</td><td>Free</td></tr>
<tr><td>AWS Shield Advanced</td><td>L7 detection with automatic WAF mitigation, 24/7 Shield Response Team (SRT), health-based detection, <strong>cost protection</strong> (credits for scaling charges caused by a DDoS), WAF fees included for protected resources.</td><td>$3,000/month per organization, 1-year commitment, plus data transfer</td></tr>
<tr><td>Azure DDoS Protection</td><td>Basic infra protection free; <em>Network Protection</em> adds adaptive tuning per public IP, telemetry, Rapid Response team and cost protection. <em>IP Protection</em> is a per-IP SKU for small estates.</td><td>~$2,900/month covering 100 public IPs, or per-IP pricing</td></tr>
<tr><td>Google Cloud Armor</td><td>WAF + DDoS on the global external Application LB; <strong>Adaptive Protection</strong> uses ML to detect L7 anomalies and propose rules. Managed Protection Plus adds DDoS response support and bill protection.</td><td>Per policy/rule/request, or ~$3,000/month subscription (Plus)</td></tr>
<tr><td>Cloudflare</td><td>Anycast network with hundreds of Tbps of capacity; unmetered DDoS mitigation on every plan, WAF, Bot Management, "Under Attack" mode.</td><td>Plan-based (free tier included)</td></tr>
</table>
<blockquote>💡 Real world: Shield Advanced's real value for many teams isn't the mitigation (the edge already absorbs most L3/4) - it's <strong>cost protection</strong> and having the SRT write WAF rules with you at 03:00. For a $5k/month AWS bill it's overkill; for a payments platform whose attack-driven scale-out could cost $50k in a weekend, it's insurance.</blockquote>`,
`<table>
<tr><th>שירות</th><th>מה מקבלים</th><th>מבנה מחיר</th></tr>
<tr><td>AWS Shield Standard</td><td>הגנת L3/4 אוטומטית לכולם, הכי חזקה על CloudFront, ‏Route 53 ו-Global Accelerator (אתרי edge).</td><td>חינם</td></tr>
<tr><td>AWS Shield Advanced</td><td>זיהוי L7 עם mitigation אוטומטי ב-WAF, ‏Shield Response Team (SRT) זמין 24/7, זיהוי לפי health, ‏<strong>cost protection</strong> (קרדיטים על חיובי scaling שנגרמו מ-DDoS), ועלויות WAF כלולות למשאבים המוגנים.</td><td>‎$3,000 לחודש לארגון, התחייבות לשנה, ועוד data transfer</td></tr>
<tr><td>Azure DDoS Protection</td><td>הגנת תשתית בסיסית בחינם; <em>Network Protection</em> מוסיף כיוונון אדפטיבי לכל IP ציבורי, טלמטריה, צוות Rapid Response ו-cost protection. ‏<em>IP Protection</em> הוא SKU לפי IP לסביבות קטנות.</td><td>בערך ‎$2,900 לחודש שמכסים 100 כתובות IP ציבוריות, או תמחור לפי IP</td></tr>
<tr><td>Google Cloud Armor</td><td>WAF ו-DDoS על ה-Application LB החיצוני הגלובלי; ‏<strong>Adaptive Protection</strong> משתמש ב-ML כדי לזהות אנומליות ב-L7 ולהציע חוקים. ‏Managed Protection Plus מוסיף תמיכת DDoS response והגנה על החשבון.</td><td>לפי policy, חוק ובקשה, או מנוי של בערך ‎$3,000 לחודש (Plus)</td></tr>
<tr><td>Cloudflare</td><td>רשת anycast עם מאות Tbps של קיבולת; mitigation של DDoS בלי הגבלת נפח בכל תוכנית, ‏WAF, ‏Bot Management, מצב "Under Attack".</td><td>לפי תוכנית (כולל tier חינמי)</td></tr>
</table>
<blockquote>💡 Real world: הערך האמיתי של Shield Advanced להרבה צוותים הוא לא ה-mitigation (ה-edge ממילא סופג את רוב ה-L3/4) - אלא ה-<strong>cost protection</strong> וזה שה-SRT כותב איתך חוקי WAF ב-03:00. לחשבון AWS של ‎$5k לחודש זה overkill; לפלטפורמת תשלומים שה-scale-out בגלל מתקפה יכול לעלות לה ‎$50k בסוף שבוע, זה ביטוח.</blockquote>`
        )
      },
      {
        h: t("WAF managed rules, rate-based rules and bot management", "חוקים מנוהלים ב-WAF, חוקי rate, ו-bot management"),
        body: t(
`<p>L7 attacks pass every network check - they are real TLS connections with real HTTP. You filter on <em>behavior</em>:</p>
<ul>
<li><strong>Managed rule groups</strong>: AWS <code>AWSManagedRulesCommonRuleSet</code> (OWASP-style), <code>KnownBadInputsRuleSet</code>, <code>AmazonIpReputationList</code>, <code>AnonymousIpList</code> (VPNs, Tor, hosting providers); Cloudflare/Azure/Cloud Armor have equivalents (OWASP CRS based).</li>
<li><strong>Rate-based rules</strong>: count requests per key (IP, forwarded IP, or custom keys like header + path) over a window and block/challenge above a limit. In AWS WAF the window is 1, 2, 5 or 10 minutes, the minimum limit is 10, and enforcement kicks in with some delay (tens of seconds) - it's a flood brake, not a precise per-second limiter.</li>
<li><strong>Challenges</strong>: CAPTCHA, or silent JS/proof-of-work challenges (AWS <code>Challenge</code>, Cloudflare Managed Challenge / Turnstile). Browsers pass, simple scripts don't.</li>
<li><strong>Bot management</strong>: scores each request using TLS fingerprints (JA3/JA4), header order, behavior and IP reputation; lets you allow verified bots (Googlebot) and block "likely automated".</li>
</ul>
<pre>{
  "Name": "login-rate-limit",
  "Priority": 10,
  "Action": { "Block": {} },
  "Statement": {
    "RateBasedStatement": {
      "Limit": 100,
      "EvaluationWindowSec": 300,
      "AggregateKeyType": "IP",
      "ScopeDownStatement": {
        "ByteMatchStatement": {
          "FieldToMatch": { "UriPath": {} },
          "PositionalConstraint": "STARTS_WITH",
          "SearchString": "/api/login",
          "TextTransformations": [{ "Priority": 0, "Type": "LOWERCASE" }]
        }
      }
    }
  },
  "VisibilityConfig": { "SampledRequestsEnabled": true, "CloudWatchMetricsEnabled": true, "MetricName": "login-rate" }
}</pre>
<blockquote>⚠️ Production tip: deploy every new WAF rule in <strong>Count</strong> mode first and look at what it would have blocked. Behind a CDN or corporate NAT, thousands of real users share one IP - key on the client IP header the CDN sets (e.g. <code>X-Forwarded-For</code> via <code>FORWARDED_IP</code>) and expect false positives from offices, schools and mobile carriers (CGNAT).</blockquote>`,
`<p>מתקפות L7 עוברות כל בדיקת רשת - הן חיבורי TLS אמיתיים עם HTTP אמיתי. מסננים לפי <em>התנהגות</em>:</p>
<ul>
<li><strong>Managed rule groups</strong>: ב-AWS יש <code>AWSManagedRulesCommonRuleSet</code> (בסגנון OWASP), ‏<code>KnownBadInputsRuleSet</code>, ‏<code>AmazonIpReputationList</code>, ‏<code>AnonymousIpList</code> (VPNs, ‏Tor, ספקי hosting); ל-Cloudflare, ‏Azure ו-Cloud Armor יש מקבילים (מבוססי OWASP CRS).</li>
<li><strong>Rate-based rules</strong>: סופרים בקשות לפי מפתח (IP, ‏forwarded IP, או מפתחות מותאמים כמו header ועוד path) לאורך חלון זמן, וחוסמים או מציגים challenge מעל הגבול. ב-AWS WAF החלון הוא 1, 2, 5 או 10 דקות, הגבול המינימלי הוא 10, והאכיפה נכנסת עם עיכוב (עשרות שניות) - זה בלם לשטפונות, לא limiter מדויק לשנייה.</li>
<li><strong>Challenges</strong>: ‏CAPTCHA, או challenges שקטים של JS או proof-of-work (ה-<code>Challenge</code> של AWS, ‏Managed Challenge ו-Turnstile של Cloudflare). דפדפנים עוברים, סקריפטים פשוטים לא.</li>
<li><strong>Bot management</strong>: נותן ציון לכל בקשה לפי TLS fingerprints (‏JA3 או JA4), סדר ה-headers, התנהגות ומוניטין ה-IP; מאפשר להתיר בוטים מאומתים (Googlebot) ולחסום את מה ש"כנראה אוטומטי".</li>
</ul>
<pre>{
  "Name": "login-rate-limit",
  "Priority": 10,
  "Action": { "Block": {} },
  "Statement": {
    "RateBasedStatement": {
      "Limit": 100,
      "EvaluationWindowSec": 300,
      "AggregateKeyType": "IP",
      "ScopeDownStatement": {
        "ByteMatchStatement": {
          "FieldToMatch": { "UriPath": {} },
          "PositionalConstraint": "STARTS_WITH",
          "SearchString": "/api/login",
          "TextTransformations": [{ "Priority": 0, "Type": "LOWERCASE" }]
        }
      }
    }
  },
  "VisibilityConfig": { "SampledRequestsEnabled": true, "CloudWatchMetricsEnabled": true, "MetricName": "login-rate" }
}</pre>
<blockquote>⚠️ Production tip: תעלה כל חוק WAF חדש קודם במצב <strong>Count</strong> ותבדוק מה הוא היה חוסם. מאחורי CDN או NAT ארגוני, אלפי משתמשים אמיתיים חולקים IP אחד - תבנה את המפתח לפי ה-header של IP הלקוח שה-CDN מוסיף (למשל <code>X-Forwarded-For</code> דרך <code>FORWARDED_IP</code>) ותצפה ל-false positives ממשרדים, בתי ספר וספקי סלולר (CGNAT).</blockquote>`
        )
      },
      {
        h: t("Origin cloaking: the CDN must be the only door", "Origin cloaking: ה-CDN חייב להיות הדלת היחידה"),
        body: t(
`<p>All edge protection is bypassed the moment an attacker finds your origin IP. They find it via old DNS records (DNS history sites), an un-proxied subdomain (<code>origin.example.com</code>, <code>mail.example.com</code>), certificate scans (Censys/Shodan index every IPv4 host's TLS cert), or outbound requests (webhooks reveal your egress IP).</p>
<p>Lock it down in layers:</p>
<ul>
<li><strong>Network allowlist</strong>: on AWS, allow inbound 443 only from the managed prefix list <code>com.amazonaws.global.cloudfront.origin-facing</code>; for Cloudflare, only from its published IP ranges.</li>
<li><strong>Prove it's <em>your</em> distribution</strong>: an IP allowlist admits every CloudFront/Cloudflare customer. Add a secret header the CDN injects (<code>X-Origin-Verify: &lt;rotated secret&gt;</code>) and have the ALB/WAF reject requests without it - or use Cloudflare <strong>Authenticated Origin Pulls</strong> (mTLS client cert from the edge).</li>
<li><strong>No public origin at all</strong>: CloudFront <strong>VPC origins</strong> reach an ALB/NLB/EC2 in a private subnet; Cloudflare Tunnel (<code>cloudflared</code>) makes an outbound-only connection, so the origin has no inbound ports.</li>
<li>Rotate the origin IP after moving behind a CDN - the old one is already in DNS history.</li>
</ul>
<pre># Security Group: only CloudFront may reach the ALB
aws ec2 describe-managed-prefix-lists \
  --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing
aws ec2 authorize-security-group-ingress --group-id sg-0abc \
  --ip-permissions 'IpProtocol=tcp,FromPort=443,ToPort=443,PrefixListIds=[{PrefixListId=pl-3b927c52}]'</pre>`,
`<p>כל ההגנה ב-edge נעקפת ברגע שתוקף מוצא את ה-IP של ה-origin שלך. הוא מוצא אותו דרך רשומות DNS ישנות (אתרי DNS history), ‏subdomain שלא עובר דרך ה-proxy (<code>origin.example.com</code>, ‏<code>mail.example.com</code>), סריקות תעודות (Censys ו-Shodan ממפים את תעודת ה-TLS של כל host ב-IPv4), או בקשות יוצאות (webhooks חושפים את ה-IP היוצא שלך).</p>
<p>נועלים בשכבות:</p>
<ul>
<li><strong>Allowlist ברמת הרשת</strong>: ב-AWS, מתירים כניסה ב-443 רק מה-managed prefix list ‏<code>com.amazonaws.global.cloudfront.origin-facing</code>; ב-Cloudflare, רק מטווחי ה-IP שהם מפרסמים.</li>
<li><strong>להוכיח שזה ה-distribution <em>שלך</em></strong>: ‏allowlist לפי IP מכניס כל לקוח של CloudFront או Cloudflare. מוסיפים header סודי שה-CDN מזריק (<code>X-Origin-Verify: &lt;rotated secret&gt;</code>) וה-ALB או ה-WAF דוחים בקשות בלעדיו - או משתמשים ב-<strong>Authenticated Origin Pulls</strong> של Cloudflare (תעודת לקוח ב-mTLS מה-edge).</li>
<li><strong>בלי origin ציבורי בכלל</strong>: ‏<strong>VPC origins</strong> של CloudFront מגיעים ל-ALB, ‏NLB או EC2 ב-subnet פרטי; ‏Cloudflare Tunnel (‏<code>cloudflared</code>) פותח חיבור יוצא בלבד, כך שאין ל-origin שום port פתוח פנימה.</li>
<li>תחליף את ה-IP של ה-origin אחרי שעברת לעבוד מאחורי CDN - הישן כבר נמצא ב-DNS history.</li>
</ul>
<pre># Security Group: only CloudFront may reach the ALB
aws ec2 describe-managed-prefix-lists \
  --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing
aws ec2 authorize-security-group-ingress --group-id sg-0abc \
  --ip-permissions 'IpProtocol=tcp,FromPort=443,ToPort=443,PrefixListIds=[{PrefixListId=pl-3b927c52}]'</pre>`
        )
      },
      {
        h: t("Denial of wallet, and the runbook during an attack", "Denial of wallet, וה-runbook בזמן מתקפה"),
        body: t(
`<p>In the cloud, an L7 attack that gets past the cache doesn't always take you down - autoscaling "saves" you and sends the bill. HPA scales Pods to <code>maxReplicas</code>, Karpenter adds nodes, Lambda scales to its concurrency limit, the DB scales up, and egress is billed per GB. This is <strong>denial of wallet</strong>. Defenses: cache aggressively (even 1 s on hot public endpoints), set sane <code>maxReplicas</code>/concurrency caps and budget alerts, rate-limit expensive endpoints harder than cheap ones, and consider provider cost protection.</p>
<p><strong>Runbook - first 30 minutes:</strong></p>
<ol>
<li><strong>Confirm it's an attack</strong>, not a launch or a viral post: look at top client IPs, ASNs, countries, user agents, JA3/JA4 fingerprints and paths in CDN/WAF logs. A real spike follows your marketing; an attack hammers one path from hosting ASNs with identical fingerprints.</li>
<li><strong>Protect the origin first</strong>: verify the origin isn't being hit directly (origin logs with non-CDN source IPs → fix the allowlist now).</li>
<li><strong>Turn up the edge</strong>: Cloudflare "Under Attack"/challenge on the targeted path; AWS WAF rate rule + <code>Challenge</code> action scoped to that path; geo/ASN blocks if traffic is clearly foreign to your user base.</li>
<li><strong>Shed load gracefully</strong>: cache the attacked page, return a static response, disable expensive features (search suggestions) behind flags, and keep checkout/login working.</li>
<li><strong>Escalate</strong>: open a case with AWS SRT / Azure DDoS Rapid Response / Cloudflare support; post status-page updates.</li>
<li><strong>Don't</strong> switch DNS to point straight at the origin "to bypass the CDN" - you just announce your origin IP to the attacker.</li>
</ol>
<blockquote>💡 Real world: attacks often come in waves and change vectors when blocked (from <code>/</code> to <code>/search?q=random</code> to POST <code>/login</code>). Keep the war room open for hours after it "stops", and write the rules you improvised into IaC afterwards.</blockquote>`,
`<p>בענן, מתקפת L7 שעוברת את ה-cache לא תמיד מפילה אותך - ה-autoscaling "מציל" אותך ושולח חשבונית. ‏HPA מגדיל Pods עד <code>maxReplicas</code>, ‏Karpenter מוסיף nodes, ‏Lambda גדל עד מגבלת ה-concurrency, ה-DB גדל, וה-egress מחויב לפי GB. זה <strong>denial of wallet</strong>. ההגנות: cache אגרסיבי (אפילו שנייה אחת על endpoints ציבוריים חמים), תקרות סבירות ל-<code>maxReplicas</code> ול-concurrency והתראות תקציב, ‏rate limit חזק יותר על endpoints יקרים מאשר על זולים, ושקילת ה-cost protection של הספק.</p>
<p><strong>Runbook - 30 הדקות הראשונות:</strong></p>
<ol>
<li><strong>לוודא שזו מתקפה</strong>, ולא השקה או פוסט ויראלי: בודקים ב-logs של ה-CDN וה-WAF את כתובות ה-IP המובילות, ‏ASNs, מדינות, ‏user agents, ‏JA3 או JA4 fingerprints ו-paths. קפיצה אמיתית באה אחרי שיווק; מתקפה דופקת path אחד מ-ASNs של hosting עם fingerprints זהים.</li>
<li><strong>להגן על ה-origin קודם</strong>: לוודא שאף אחד לא פונה ל-origin ישירות (logs של ה-origin עם כתובות מקור שאינן של ה-CDN → לתקן את ה-allowlist עכשיו).</li>
<li><strong>להגביר את ה-edge</strong>: מצב "Under Attack" או challenge ב-Cloudflare על ה-path המותקף; ב-AWS WAF חוק rate ופעולת <code>Challenge</code> מוגבלים ל-path הזה; חסימות לפי מדינה או ASN אם התעבורה בבירור זרה לבסיס המשתמשים שלך.</li>
<li><strong>להוריד עומס בצורה מסודרת</strong>: לשמור ב-cache את הדף המותקף, להחזיר תשובה סטטית, לכבות פיצ'רים יקרים (הצעות חיפוש) מאחורי flags, ולשמור על checkout ו-login עובדים.</li>
<li><strong>להסלים</strong>: לפתוח case מול AWS SRT, ‏Azure DDoS Rapid Response או התמיכה של Cloudflare; לעדכן את ה-status page.</li>
<li><strong>לא</strong> להפנות את ה-DNS ישירות ל-origin "כדי לעקוף את ה-CDN" - בזה הרגע הודעת לתוקף מה ה-IP של ה-origin שלך.</li>
</ol>
<blockquote>💡 Real world: מתקפות מגיעות לרוב בגלים ומחליפות וקטור כשחוסמים אותן (מ-<code>/</code> ל-<code>/search?q=random</code> ואז ל-POST על <code>/login</code>). תשאיר את ה-war room פתוח כמה שעות אחרי שזה "נגמר", ואחר כך תכניס ל-IaC את החוקים שאלתרת.</blockquote>`
        )
      }
    ],
    diagram: "botnet --(Tbps UDP/SYN)--> anycast edge PoPs (absorb L3/4)\n                               |\n                         WAF: managed rules, rate rules, challenge, bot score (L7)\n                               |  only CDN prefix list + X-Origin-Verify\n                               v\n                         origin (private / VPC origin)  -- HPA maxReplicas cap",
    handsOn: [
      { cmd: "netstat -s | grep -i -E 'SYNs to LISTEN|syncookies'; sysctl net.ipv4.tcp_syncookies", what: t("Check whether a Linux host is seeing SYN overflow and whether SYN cookies are enabled.", "בדוק אם host של Linux רואה SYN overflow והאם SYN cookies מופעלים.") },
      { cmd: "aws wafv2 get-sampled-requests --web-acl-arn $ACL --rule-metric-name login-rate --scope CLOUDFRONT --time-window StartTime=$(date -u -d '-15 min' +%s),EndTime=$(date -u +%s) --max-items 100 --region us-east-1", what: t("Sample the requests a WAF rule matched - first step before switching a rule from Count to Block.", "קבל דגימה של הבקשות שחוק WAF תפס - הצעד הראשון לפני שמעבירים חוק מ-Count ל-Block.") },
      { cmd: "curl -sk --resolve www.example.com:443:203.0.113.10 https://www.example.com/ -o /dev/null -w '%{http_code}\\n'", what: t("Test origin cloaking: hit the origin IP directly with the real Host/SNI. Anything other than a timeout or 403 means the origin is exposed.", "בדוק את ה-origin cloaking: פנה ישירות ל-IP של ה-origin עם ה-Host וה-SNI האמיתיים. כל תשובה חוץ מ-timeout או 403 אומרת שה-origin חשוף.") },
      { cmd: "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20", what: t("Quick top-talkers from an access log during an L7 spike (use the real client IP field behind a CDN).", "רשימת top talkers מהירה מ-access log בזמן קפיצה ב-L7 (מאחורי CDN, השתמש בשדה ה-IP האמיתי של הלקוח).") }
    ],
    mnemonic: t(
      "\"Absorb, filter, hide, cap\": anycast absorbs L3/4, WAF filters L7, cloaking hides the origin, caps protect the wallet.",
      "\"לספוג, לסנן, להסתיר, להגביל\": ה-anycast סופג L3/4, ה-WAF מסנן L7, ה-cloaking מסתיר את ה-origin, והתקרות מגינות על הארנק."
    ),
    pitfalls: [
      t("Putting a CDN in front but leaving the origin reachable from 0.0.0.0/0 - attackers find it via DNS history or certificate scans and skip the edge entirely.", "לשים CDN מלפנים אבל להשאיר את ה-origin נגיש מ-0.0.0.0/0 - התוקפים מוצאים אותו דרך DNS history או סריקות תעודות ומדלגים על ה-edge לגמרי."),
      t("Allowlisting only the CDN's IP ranges - any other customer of the same CDN can still reach your origin. Add a secret header or mTLS.", "לעשות allowlist רק לטווחי ה-IP של ה-CDN - כל לקוח אחר של אותו CDN עדיין יכול להגיע ל-origin שלך. תוסיף header סודי או mTLS."),
      t("Rate limiting by IP behind a proxy without using the forwarded client IP - you either block the CDN itself or never block anything.", "rate limiting לפי IP מאחורי proxy בלי להשתמש ב-IP הלקוח שמועבר - או שאתה חוסם את ה-CDN עצמו או שאתה אף פעם לא חוסם כלום."),
      t("Uncapped autoscaling: the attack is 'handled' and the month's bill is 10×.", "autoscaling בלי תקרה: המתקפה 'טופלה' והחשבון של החודש פי 10.")
    ],
    interview: [
      { q: t("Why can't a WAF stop a 3 Tbps UDP amplification attack, and what does?", "למה WAF לא יכול לעצור מתקפת UDP amplification של 3Tbps, ומה כן?"),
        a: t("A WAF inspects HTTP; amplification is raw UDP volume that saturates links before any L7 device sees it. It's stopped by capacity and filtering upstream: a global anycast network/scrubbing centers dropping UDP from reflector ports (53, 123, 11211) toward a web origin that only needs TCP 443.", "WAF בודק HTTP; ‏amplification זה נפח UDP גולמי שמציף את הקווים לפני שרכיב L7 בכלל רואה אותו. עוצרים אותו בעזרת קיבולת וסינון במעלה הזרם: רשת anycast גלובלית או scrubbing centers שזורקים UDP מ-ports של reflectors (‏53, 123, 11211) לכיוון origin שצריך רק TCP 443.") },
      { q: t("How do you make sure only your CDN can reach your origin?", "איך מוודאים שרק ה-CDN שלך יכול להגיע ל-origin?"),
        a: t("Layers: network allowlist of CDN ranges (CloudFront managed prefix list), plus proof of the specific distribution (secret header checked at ALB/WAF, or authenticated origin pulls with mTLS), or best - no public origin (CloudFront VPC origins, Cloudflare Tunnel). Then rotate the old exposed IP and test by hitting the origin directly.", "בשכבות: ‏allowlist ברמת הרשת לטווחי ה-CDN (ה-managed prefix list של CloudFront), ועוד הוכחה שזה ה-distribution הספציפי שלך (header סודי שנבדק ב-ALB או ב-WAF, או authenticated origin pulls עם mTLS), או הכי טוב - בלי origin ציבורי (‏VPC origins של CloudFront, ‏Cloudflare Tunnel). אחר כך מחליפים את ה-IP הישן שנחשף ובודקים על ידי פנייה ישירה ל-origin.") }
    ],
    quiz: [
      { q: t("Which attack is best mitigated by SYN cookies?", "איזו מתקפה נבלמת הכי טוב בעזרת SYN cookies?"),
        options: [t("HTTP GET flood on /search", "HTTP GET flood על /search"), t("DNS amplification", "DNS amplification"), t("TCP SYN flood filling the half-open connection backlog", "TCP SYN flood שממלא את ה-backlog של החיבורים החצי-פתוחים"), t("Web cache poisoning", "Web cache poisoning")],
        answer: 2,
        explain: t("SYN cookies encode state in the SYN-ACK sequence number, so the server allocates nothing for half-open connections and the backlog can't be exhausted.", "SYN cookies מקודדים את ה-state ב-sequence number של ה-SYN-ACK, כך שהשרת לא מקצה כלום לחיבורים חצי-פתוחים ואי אפשר למצות את ה-backlog.") },
      { q: t("Your site is behind CloudFront, but during an attack the origin ALB logs show source IPs from a hosting provider, not CloudFront. What's first?", "האתר שלך מאחורי CloudFront, אבל בזמן מתקפה ה-logs של ה-ALB מראים כתובות מקור של ספק hosting, לא של CloudFront. מה קודם?"),
        options: [t("Restrict the ALB Security Group to the CloudFront origin-facing prefix list and require a secret origin header", "להגביל את ה-Security Group של ה-ALB ל-prefix list של CloudFront ולדרוש header סודי ל-origin"), t("Raise HPA maxReplicas", "להעלות את ה-maxReplicas של ה-HPA"), t("Lower the CloudFront TTLs", "להוריד את ה-TTLs ב-CloudFront"), t("Point DNS directly at the ALB", "להפנות את ה-DNS ישירות ל-ALB")],
        answer: 0,
        explain: t("The attacker is bypassing the edge. Close the origin to everything except your distribution; scaling up just pays for the attack and pointing DNS at the ALB makes it worse.", "התוקף עוקף את ה-edge. סגור את ה-origin לכל דבר חוץ מה-distribution שלך; להגדיל רק משלם על המתקפה, ולהפנות DNS ל-ALB מחמיר את המצב.") },
      { q: t("Why roll out a new WAF rate-based rule in Count mode first?", "למה להעלות חוק rate חדש ב-WAF קודם במצב Count?"),
        options: [t("Count mode is cheaper", "מצב Count זול יותר"), t("To see what it would block - shared IPs (CGNAT, offices) can trigger false positives", "כדי לראות מה הוא היה חוסם - כתובות משותפות (CGNAT, משרדים) יכולות לגרום ל-false positives"), t("Block mode needs Shield Advanced", "מצב Block דורש Shield Advanced"), t("Rate rules only work in Count mode", "חוקי rate עובדים רק במצב Count")],
        answer: 1,
        explain: t("Real users behind one NAT or a mobile carrier can exceed per-IP limits. Count + sampled requests shows the blast radius before you block paying customers.", "משתמשים אמיתיים מאחורי NAT אחד או ספק סלולר יכולים לעבור את הגבול לפי IP. ‏Count יחד עם sampled requests מראה את ה-blast radius לפני שחוסמים לקוחות משלמים.") },
      { q: t("What is 'denial of wallet'?", "מה זה 'denial of wallet'?"),
        options: [t("A ransomware variant", "סוג של ransomware"), t("An attack that's absorbed by autoscaling and serverless, so the damage is the cloud bill rather than downtime", "מתקפה שנספגת על ידי autoscaling ו-serverless, כך שהנזק הוא חשבון הענן ולא downtime"), t("Blocking a payment provider's IPs", "חסימה של כתובות IP של ספק תשלומים"), t("Exhausting AWS service quotas", "מיצוי של service quotas ב-AWS")],
        answer: 1,
        explain: t("Elastic infra keeps serving the attack and bills for every Pod, node, invocation and GB. Caps, caching, rate limits and provider cost protection limit it.", "תשתית אלסטית ממשיכה לשרת את המתקפה ומחייבת על כל Pod, ‏node, הפעלה ו-GB. תקרות, cache, ‏rate limits וה-cost protection של הספק מגבילים את זה.") }
    ],
    playground: "firewall",
    related: ["net-proxies-cdn", "net-firewalls", "net-bgp-anycast", "pr-rate-limiters", "k8s-hpa-deep", "pr-security-ops"]
  });

  G.push({ term: "SYN flood", track: "networking", lesson: "net-ddos-edge",
    def: t("A DoS attack sending masses of TCP SYNs (often spoofed) so the server fills its half-open connection backlog; mitigated by SYN cookies and edge scrubbing.", "מתקפת DoS ששולחת המון SYN של TCP (לרוב מזויפים) כך שהשרת ממלא את ה-backlog של החיבורים החצי-פתוחים; נבלמת בעזרת SYN cookies ו-scrubbing ב-edge.") });
  G.push({ term: "Amplification attack", track: "networking", lesson: "net-ddos-edge",
    def: t("Reflection DDoS where small spoofed UDP queries to open servers (DNS, NTP, memcached) trigger much larger replies aimed at the victim - factors from ~30× to ~50,000×.", "DDoS מסוג reflection שבו שאילתות UDP קטנות ומזויפות לשרתים פתוחים (DNS, ‏NTP, ‏memcached) גורמות לתשובות גדולות בהרבה שמכוונות לקורבן - פקטורים מבערך 30× עד בערך 50,000×.") });
  G.push({ term: "Origin cloaking", track: "networking", lesson: "net-ddos-edge",
    def: t("Making the origin reachable only through your CDN (prefix-list allowlist + secret header/mTLS, or a private VPC origin/tunnel) so attackers can't bypass edge protection.", "לגרום ל-origin להיות נגיש רק דרך ה-CDN שלך (‏allowlist לפי prefix list ועוד header סודי או mTLS, או VPC origin פרטי או tunnel) כדי שתוקפים לא יוכלו לעקוף את ההגנה ב-edge.") });
})();

(function () {
  var L = window.INFRA.lessons, G = window.INFRA.glossary;
  function t(en, he) { return { en: en, he: he }; }

  /* ------------------------------------------------- net-grpc-production */
  L.push({
    id: "net-grpc-production",
    track: "networking",
    order: 33,
    icon: "📡",
    level: 3,
    minutes: 15,
    title: t("gRPC in Production", "gRPC בפרודקשן"),
    tldr: t(
      "gRPC runs many RPCs as streams over one long-lived HTTP/2 connection - great for latency, terrible for L4 load balancers, which pin all of a client's traffic to one backend. Balance per request (L7 proxy, client-side LB, xDS) or recycle connections with MAX_CONNECTION_AGE, always set deadlines, retry only UNAVAILABLE, and evolve protobuf by adding fields, never renumbering them.",
      "gRPC מריץ הרבה RPCs כ-streams על חיבור HTTP/2 אחד וארוך-חיים - מעולה ל-latency, נורא ל-load balancers ב-L4, שמצמידים את כל התעבורה של לקוח ל-backend אחד. תעשה איזון לפי בקשה (‏L7 proxy, ‏client-side LB, ‏xDS) או תמחזר חיבורים עם MAX_CONNECTION_AGE, תמיד תגדיר deadlines, תעשה retry רק על UNAVAILABLE, ותפתח את ה-protobuf על ידי הוספת שדות, אף פעם לא שינוי מספרים."
    ),
    analogy: t(
      "HTTP/1.1 is a taxi per trip: each request finds its own ride, so a dispatcher (L4 LB) naturally spreads trips across drivers. gRPC is a private shuttle: the client books one driver in the morning and sends every trip through them all day. The dispatcher sees one booking and thinks the load is balanced - while one driver is exhausted and the new drivers hired at noon sit idle.",
      "HTTP/1.1 זה מונית לכל נסיעה: כל בקשה מוצאת לעצמה נהג, אז הסדרן (L4 LB) מפזר נסיעות בין הנהגים באופן טבעי. ‏gRPC זה שאטל פרטי: הלקוח מזמין נהג אחד בבוקר ושולח דרכו את כל הנסיעות כל היום. הסדרן רואה הזמנה אחת וחושב שהעומס מאוזן - בזמן שנהג אחד גמור והנהגים החדשים שגויסו בצהריים יושבים בלי עבודה."
    ),
    sections: [
      {
        h: t("On the wire: HTTP/2 streams and protobuf contracts", "על החוט: streams של HTTP/2 וחוזי protobuf"),
        body: t(
`<p>Every RPC is one <strong>HTTP/2 stream</strong>: a <code>POST /package.Service/Method</code> with <code>content-type: application/grpc</code>, length-prefixed protobuf messages (1-byte compression flag + 4-byte length) in DATA frames, and the result in <strong>trailers</strong>: <code>grpc-status</code> and <code>grpc-message</code>. Four shapes: unary, server-streaming, client-streaming, bidirectional. Default max inbound message size is <strong>4 MB</strong> in most implementations.</p>
<pre>syntax = "proto3";
package shop.v1;

service OrderService {
  rpc GetOrder(GetOrderRequest) returns (Order);
  rpc WatchOrders(WatchRequest) returns (stream OrderEvent);
}

message Order {
  string id = 1;
  int64 total_cents = 2;
  OrderStatus status = 3;
  reserved 4;                 // was 'coupon' - never reuse the number
  reserved "coupon";
  optional string note = 5;   // proto3 optional: presence is tracked
}

enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;   // zero value must be a safe default
  ORDER_STATUS_PAID = 1;
}</pre>
<p><strong>Compatibility rules</strong> (the wire format only knows field <em>numbers</em> and types):</p>
<ul>
<li>Adding a field: safe. Old readers skip unknown fields; new readers see the default value.</li>
<li>Removing a field: mark its number (and name) <code>reserved</code>. Reusing a number makes old clients decode new data as the wrong thing - silent corruption.</li>
<li>Changing a field number or most type changes: breaking. (A few are wire-compatible, e.g. <code>int32</code>↔<code>int64</code>, but truncation bites.)</li>
<li>Renaming a field: wire-safe, but breaks JSON transcoding and generated code.</li>
<li>Enforce it in CI: <code>buf breaking --against '.git#branch=main'</code>.</li>
</ul>`,
`<p>כל RPC הוא <strong>stream אחד של HTTP/2</strong>: ‏<code>POST /package.Service/Method</code> עם <code>content-type: application/grpc</code>, הודעות protobuf עם קידומת אורך (byte אחד לדגל דחיסה ועוד 4 bytes לאורך) בתוך DATA frames, והתוצאה ב-<strong>trailers</strong>: ‏<code>grpc-status</code> ו-<code>grpc-message</code>. ארבע צורות: unary, ‏server-streaming, ‏client-streaming, ודו-כיווני. גודל ההודעה הנכנסת המקסימלי ברירת מחדל הוא <strong>4MB</strong> ברוב המימושים.</p>
<pre>syntax = "proto3";
package shop.v1;

service OrderService {
  rpc GetOrder(GetOrderRequest) returns (Order);
  rpc WatchOrders(WatchRequest) returns (stream OrderEvent);
}

message Order {
  string id = 1;
  int64 total_cents = 2;
  OrderStatus status = 3;
  reserved 4;                 // was 'coupon' - never reuse the number
  reserved "coupon";
  optional string note = 5;   // proto3 optional: presence is tracked
}

enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;   // zero value must be a safe default
  ORDER_STATUS_PAID = 1;
}</pre>
<p><strong>כללי תאימות</strong> (ה-wire format מכיר רק <em>מספרים</em> של שדות וטיפוסים):</p>
<ul>
<li>הוספת שדה: בטוח. קוראים ישנים מדלגים על שדות לא מוכרים; קוראים חדשים רואים ערך ברירת מחדל.</li>
<li>הסרת שדה: לסמן את המספר (והשם) כ-<code>reserved</code>. שימוש חוזר במספר גורם ללקוחות ישנים לפענח מידע חדש כמשהו אחר - השחתה שקטה.</li>
<li>שינוי מספר שדה או רוב שינויי הטיפוס: שובר. (כמה כן תואמים ברמת ה-wire, למשל <code>int32</code>↔<code>int64</code>, אבל truncation נושך.)</li>
<li>שינוי שם של שדה: בטוח ב-wire, אבל שובר JSON transcoding וקוד מג'ונרט.</li>
<li>אוכפים את זה ב-CI: ‏<code>buf breaking --against '.git#branch=main'</code>.</li>
</ul>`
        )
      },
      {
        h: t("The load-balancing problem with long-lived connections", "בעיית ה-load balancing עם חיבורים ארוכי-חיים"),
        body: t(
`<p>A gRPC client opens <strong>one</strong> HTTP/2 connection per backend address and multiplexes every RPC over it for hours. An L4 load balancer - AWS NLB, a Kubernetes <code>ClusterIP</code> Service via kube-proxy/iptables - balances <em>connections</em>, not requests. Result:</p>
<ul>
<li>10 client Pods → 10 connections → spread over 10 of your 30 server Pods; 20 sit idle.</li>
<li>After HPA scales servers from 10 to 30, the new Pods get <strong>zero</strong> traffic - existing connections never move.</li>
<li>One busy client pins one server at 100% CPU while the "average" looks fine.</li>
</ul>
<table>
<tr><th>Fix</th><th>How</th><th>Trade-off</th></tr>
<tr><td><strong>L7 proxy</strong></td><td>Envoy, Linkerd/Istio sidecars, AWS ALB (target group protocol version <code>gRPC</code>), GCP/Azure L7 LBs balance per <em>stream</em>.</td><td>Extra hop and CPU; simplest operationally.</td></tr>
<tr><td><strong>Client-side LB</strong></td><td>Headless Service (<code>clusterIP: None</code>) → DNS returns all Pod IPs; client uses <code>round_robin</code> and connects to each.</td><td>DNS re-resolution lag; every client opens N connections.</td></tr>
<tr><td><strong>xDS (proxyless)</strong></td><td>gRPC library gets endpoints, weights and policies from a control plane (Istio, Traffic Director / Cloud Service Mesh) over the xDS API.</td><td>Needs a control plane; library support varies by language.</td></tr>
<tr><td><strong>MAX_CONNECTION_AGE</strong></td><td>Server sends GOAWAY after e.g. 5 min (+ grace), clients reconnect and re-balance through the L4 LB.</td><td>Cheap mitigation, not true per-request balancing.</td></tr>
</table>
<pre>// Go client: client-side round robin over a headless Service
conn, _ := grpc.NewClient("dns:///orders-headless.shop.svc.cluster.local:9090",
    grpc.WithDefaultServiceConfig(`+"`"+`{"loadBalancingConfig":[{"round_robin":{}}]}`+"`"+`),
    grpc.WithTransportCredentials(creds))

// Go server: force periodic reconnects so new Pods get traffic
grpc.NewServer(grpc.KeepaliveParams(keepalive.ServerParameters{
    MaxConnectionAge:      5 * time.Minute,
    MaxConnectionAgeGrace: 30 * time.Second, // let in-flight RPCs finish
}))</pre>`,
`<p>לקוח gRPC פותח חיבור HTTP/2 <strong>אחד</strong> לכל כתובת backend ומעביר עליו את כל ה-RPCs במשך שעות. ‏load balancer ב-L4 - ‏AWS NLB, ‏Service מסוג <code>ClusterIP</code> ב-Kubernetes דרך kube-proxy ו-iptables - מאזן <em>חיבורים</em>, לא בקשות. התוצאה:</p>
<ul>
<li>10 Pods של לקוח → 10 חיבורים → מתפזרים על 10 מתוך 30 ה-Pods של השרת; 20 יושבים בטלים.</li>
<li>אחרי שה-HPA מגדיל את השרתים מ-10 ל-30, ה-Pods החדשים מקבלים <strong>אפס</strong> תעבורה - חיבורים קיימים אף פעם לא זזים.</li>
<li>לקוח עמוס אחד מצמיד שרת אחד ל-100% CPU בזמן שה"ממוצע" נראה בסדר.</li>
</ul>
<table>
<tr><th>תיקון</th><th>איך</th><th>Trade-off</th></tr>
<tr><td><strong>L7 proxy</strong></td><td>Envoy, ‏sidecars של Linkerd או Istio, ‏AWS ALB (‏target group עם protocol version ‏<code>gRPC</code>), ‏LBs של L7 ב-GCP וב-Azure מאזנים לפי <em>stream</em>.</td><td>עוד hop ו-CPU; הכי פשוט תפעולית.</td></tr>
<tr><td><strong>Client-side LB</strong></td><td>Headless Service (‏<code>clusterIP: None</code>) → ה-DNS מחזיר את כל כתובות ה-Pods; הלקוח משתמש ב-<code>round_robin</code> ומתחבר לכל אחד.</td><td>עיכוב ב-DNS re-resolution; כל לקוח פותח N חיבורים.</td></tr>
<tr><td><strong>xDS (proxyless)</strong></td><td>ספריית ה-gRPC מקבלת endpoints, משקלים ו-policies מ-control plane (‏Istio, ‏Traffic Director או Cloud Service Mesh) דרך ה-API של xDS.</td><td>צריך control plane; התמיכה בספריות משתנה לפי שפה.</td></tr>
<tr><td><strong>MAX_CONNECTION_AGE</strong></td><td>השרת שולח GOAWAY אחרי למשל 5 דקות (ועוד grace), הלקוחות מתחברים מחדש ומתאזנים מחדש דרך ה-L4 LB.</td><td>mitigation זול, לא איזון אמיתי לפי בקשה.</td></tr>
</table>
<pre>// Go client: client-side round robin over a headless Service
conn, _ := grpc.NewClient("dns:///orders-headless.shop.svc.cluster.local:9090",
    grpc.WithDefaultServiceConfig(`+"`"+`{"loadBalancingConfig":[{"round_robin":{}}]}`+"`"+`),
    grpc.WithTransportCredentials(creds))

// Go server: force periodic reconnects so new Pods get traffic
grpc.NewServer(grpc.KeepaliveParams(keepalive.ServerParameters{
    MaxConnectionAge:      5 * time.Minute,
    MaxConnectionAgeGrace: 30 * time.Second, // let in-flight RPCs finish
}))</pre>`
        )
      },
      {
        h: t("Deadlines, retries, hedging and status codes", "Deadlines, ‏retries, ‏hedging וקודי סטטוס"),
        body: t(
`<p><strong>Deadlines</strong>: gRPC has <em>no default deadline</em> - a call to a hung server waits forever, holding a goroutine/thread and a stream. Set one on every call. It travels as the <code>grpc-timeout</code> header (e.g. <code>grpc-timeout: 250m</code> = 250 ms). In Go (via <code>context</code>) and Java (via <code>Context</code>), passing the incoming context to outgoing calls <strong>propagates</strong> the remaining budget: if the edge gave 300 ms and 120 ms are used, the downstream call gets ~180 ms - no point working on an answer nobody will wait for.</p>
<p><strong>Retries and hedging</strong> are configured declaratively in the <em>service config</em>:</p>
<pre>{
  "methodConfig": [{
    "name": [{ "service": "shop.v1.OrderService", "method": "GetOrder" }],
    "timeout": "0.3s",
    "retryPolicy": {
      "maxAttempts": 3,
      "initialBackoff": "0.05s",
      "maxBackoff": "0.5s",
      "backoffMultiplier": 2,
      "retryableStatusCodes": ["UNAVAILABLE"]
    }
  }],
  "retryThrottling": { "maxTokens": 10, "tokenRatio": 0.1 }
}
// hedging alternative (idempotent reads only): send a 2nd copy if no answer in 30 ms
// "hedgingPolicy": { "maxAttempts": 2, "hedgingDelay": "0.03s", "nonFatalStatusCodes": ["UNAVAILABLE"] }</pre>
<p><code>retryThrottling</code> stops retrying when too many calls fail (a token bucket) - your protection against retry storms. <code>maxAttempts</code> is capped at 5.</p>
<table>
<tr><th>Code</th><th>Meaning / retry?</th></tr>
<tr><td>0 OK</td><td>Success</td></tr>
<tr><td>1 CANCELLED</td><td>Caller gave up (often a propagated cancel). No.</td></tr>
<tr><td>3 INVALID_ARGUMENT</td><td>Bad request. Never retry.</td></tr>
<tr><td>4 DEADLINE_EXCEEDED</td><td>Out of time. Retry only if idempotent and budget remains.</td></tr>
<tr><td>5 NOT_FOUND / 7 PERMISSION_DENIED / 16 UNAUTHENTICATED</td><td>Client-side problems. No.</td></tr>
<tr><td>8 RESOURCE_EXHAUSTED</td><td>Quota / rate limit / message too large. Back off.</td></tr>
<tr><td>12 UNIMPLEMENTED</td><td>Method doesn't exist (version skew!). No.</td></tr>
<tr><td>13 INTERNAL / 2 UNKNOWN</td><td>Server bug. Usually no.</td></tr>
<tr><td>14 UNAVAILABLE</td><td>Transient - connection refused, GOAWAY, overloaded. <strong>The</strong> retryable code.</td></tr>
</table>
<blockquote>⚠️ Production tip: failed gRPC calls usually return <strong>HTTP 200</strong> with <code>grpc-status</code> ≠ 0 in the trailers. An ALB or ingress dashboard that counts HTTP 5xx will show 0% errors during a full outage. Alert on <code>grpc_server_handled_total{grpc_code!="OK"}</code> (or the OTel <code>rpc.grpc.status_code</code>) instead.</blockquote>`,
`<p><strong>Deadlines</strong>: ל-gRPC <em>אין deadline ברירת מחדל</em> - קריאה לשרת תקוע מחכה לנצח, ותופסת goroutine או thread ו-stream. תגדיר deadline על כל קריאה. הוא עובר ב-header ‏<code>grpc-timeout</code> (למשל <code>grpc-timeout: 250m</code> = ‏250ms). ב-Go (דרך <code>context</code>) וב-Java (דרך <code>Context</code>), העברת ה-context הנכנס לקריאות יוצאות <strong>מעבירה הלאה</strong> את התקציב שנשאר: אם ה-edge נתן 300ms ו-120ms כבר נוצלו, הקריאה ל-downstream מקבלת בערך 180ms - אין טעם לעבוד על תשובה שאף אחד לא יחכה לה.</p>
<p><strong>Retries ו-hedging</strong> מוגדרים באופן הצהרתי ב-<em>service config</em>:</p>
<pre>{
  "methodConfig": [{
    "name": [{ "service": "shop.v1.OrderService", "method": "GetOrder" }],
    "timeout": "0.3s",
    "retryPolicy": {
      "maxAttempts": 3,
      "initialBackoff": "0.05s",
      "maxBackoff": "0.5s",
      "backoffMultiplier": 2,
      "retryableStatusCodes": ["UNAVAILABLE"]
    }
  }],
  "retryThrottling": { "maxTokens": 10, "tokenRatio": 0.1 }
}
// hedging alternative (idempotent reads only): send a 2nd copy if no answer in 30 ms
// "hedgingPolicy": { "maxAttempts": 2, "hedgingDelay": "0.03s", "nonFatalStatusCodes": ["UNAVAILABLE"] }</pre>
<p><code>retryThrottling</code> מפסיק לעשות retry כשיותר מדי קריאות נכשלות (token bucket) - ההגנה שלך מפני retry storms. ‏<code>maxAttempts</code> מוגבל ל-5.</p>
<table>
<tr><th>קוד</th><th>משמעות, ‏retry?</th></tr>
<tr><td>0 OK</td><td>הצלחה</td></tr>
<tr><td>1 CANCELLED</td><td>הקורא ויתר (לרוב cancel שהועבר הלאה). לא.</td></tr>
<tr><td>3 INVALID_ARGUMENT</td><td>בקשה לא תקינה. אף פעם לא.</td></tr>
<tr><td>4 DEADLINE_EXCEEDED</td><td>נגמר הזמן. רק אם הפעולה idempotent ונשאר תקציב.</td></tr>
<tr><td>5 NOT_FOUND / 7 PERMISSION_DENIED / 16 UNAUTHENTICATED</td><td>בעיות בצד הלקוח. לא.</td></tr>
<tr><td>8 RESOURCE_EXHAUSTED</td><td>quota, ‏rate limit או הודעה גדולה מדי. לעשות back off.</td></tr>
<tr><td>12 UNIMPLEMENTED</td><td>ה-method לא קיים (פער גרסאות!). לא.</td></tr>
<tr><td>13 INTERNAL / 2 UNKNOWN</td><td>באג בשרת. בדרך כלל לא.</td></tr>
<tr><td>14 UNAVAILABLE</td><td>זמני - connection refused, ‏GOAWAY, עומס. <strong>ה</strong>קוד שעושים עליו retry.</td></tr>
</table>
<blockquote>⚠️ Production tip: קריאות gRPC שנכשלו מחזירות בדרך כלל <strong>HTTP 200</strong> עם <code>grpc-status</code> ≠ 0 ב-trailers. דשבורד של ALB או ingress שסופר HTTP 5xx יראה 0% שגיאות בזמן השבתה מלאה. במקום זה, תתריע על <code>grpc_server_handled_total{grpc_code!="OK"}</code> (או על <code>rpc.grpc.status_code</code> של OTel).</blockquote>`
        )
      },
      {
        h: t("Health checks, grpcurl and debugging", "Health checks, ‏grpcurl ו-debugging"),
        body: t(
`<p>The standard <strong>health checking protocol</strong> is the <code>grpc.health.v1.Health</code> service with <code>Check</code> (unary) and <code>Watch</code> (streaming) returning <code>SERVING</code> / <code>NOT_SERVING</code>, per service name or overall (<code>""</code>). Flip to <code>NOT_SERVING</code> on SIGTERM so balancers drain you before shutdown. Kubernetes has native gRPC probes (GA in 1.27):</p>
<pre>readinessProbe:
  grpc:
    port: 9090
    service: shop.v1.OrderService   # optional; "" = overall health
  periodSeconds: 5
livenessProbe:
  grpc: { port: 9090 }
  initialDelaySeconds: 10</pre>
<p><strong>grpcurl</strong> is curl for gRPC. It needs either <em>server reflection</em> enabled or the <code>.proto</code> files:</p>
<pre>$ grpcurl -plaintext localhost:9090 list
grpc.health.v1.Health
grpc.reflection.v1alpha.ServerReflection
shop.v1.OrderService
$ grpcurl -plaintext localhost:9090 describe shop.v1.OrderService
$ grpcurl -d '{"id":"ord_42"}' -H 'authorization: Bearer $TOKEN' \
    -max-time 0.5 orders.example.com:443 shop.v1.OrderService/GetOrder
ERROR:
  Code: Unavailable
  Message: connection error: desc = "transport: authentication handshake failed"
$ grpcurl -plaintext -d '{"service":""}' localhost:9090 grpc.health.v1.Health/Check
{ "status": "SERVING" }</pre>
<p>For transport-level debugging: <code>GRPC_GO_LOG_SEVERITY_LEVEL=info GRPC_GO_LOG_VERBOSITY_LEVEL=99</code> (Go), <code>GRPC_TRACE=all GRPC_VERBOSITY=DEBUG</code> (C-core: Python, Ruby, PHP).</p>
<blockquote>💡 Real world: disable reflection on public-facing endpoints (it lists your entire API) or require auth for it; keep it on internal ones - it turns grpcurl into a 10-second debugging tool during incidents.</blockquote>`,
`<p>ה-<strong>health checking protocol</strong> הסטנדרטי הוא השירות <code>grpc.health.v1.Health</code> עם <code>Check</code> (‏unary) ו-<code>Watch</code> (‏streaming) שמחזירים <code>SERVING</code> או <code>NOT_SERVING</code>, לפי שם שירות או באופן כללי (<code>""</code>). תעבור ל-<code>NOT_SERVING</code> כשמגיע SIGTERM כדי שה-balancers ינקזו אותך לפני הכיבוי. ל-Kubernetes יש probes מובנים ל-gRPC (‏GA ב-1.27):</p>
<pre>readinessProbe:
  grpc:
    port: 9090
    service: shop.v1.OrderService   # optional; "" = overall health
  periodSeconds: 5
livenessProbe:
  grpc: { port: 9090 }
  initialDelaySeconds: 10</pre>
<p><strong>grpcurl</strong> הוא ה-curl של gRPC. הוא צריך <em>server reflection</em> מופעל או את קבצי ה-<code>.proto</code>:</p>
<pre>$ grpcurl -plaintext localhost:9090 list
grpc.health.v1.Health
grpc.reflection.v1alpha.ServerReflection
shop.v1.OrderService
$ grpcurl -plaintext localhost:9090 describe shop.v1.OrderService
$ grpcurl -d '{"id":"ord_42"}' -H 'authorization: Bearer $TOKEN' \
    -max-time 0.5 orders.example.com:443 shop.v1.OrderService/GetOrder
ERROR:
  Code: Unavailable
  Message: connection error: desc = "transport: authentication handshake failed"
$ grpcurl -plaintext -d '{"service":""}' localhost:9090 grpc.health.v1.Health/Check
{ "status": "SERVING" }</pre>
<p>ל-debugging ברמת ה-transport: ‏<code>GRPC_GO_LOG_SEVERITY_LEVEL=info GRPC_GO_LOG_VERBOSITY_LEVEL=99</code> (‏Go), ‏<code>GRPC_TRACE=all GRPC_VERBOSITY=DEBUG</code> (‏C-core: ‏Python, ‏Ruby, ‏PHP).</p>
<blockquote>💡 Real world: תכבה reflection ב-endpoints שפונים לאינטרנט (הוא מציג את כל ה-API שלך) או תדרוש עליו auth; תשאיר אותו דולק ב-endpoints פנימיים - הוא הופך את grpcurl לכלי debugging של 10 שניות בזמן תקלות.</blockquote>`
        )
      },
      {
        h: t("Browsers (gRPC-Web, Connect) and keepalive pitfalls", "דפדפנים (gRPC-Web, ‏Connect) ומלכודות keepalive"),
        body: t(
`<p>Browsers can't speak native gRPC: <code>fetch</code> gives no access to HTTP/2 framing or trailers. Options:</p>
<ul>
<li><strong>gRPC-Web</strong>: a variant that encodes trailers in the body; needs a translating proxy (Envoy's <code>envoy.filters.http.grpc_web</code>, or built into some servers). Supports unary and server-streaming only - no client or bidi streaming.</li>
<li><strong>Connect</strong> (Buf): a protocol that works over HTTP/1.1 or HTTP/2, with plain <code>POST</code> + JSON or protobuf - you can call it with curl. Connect servers also speak gRPC and gRPC-Web on the same port.</li>
<li><strong>JSON transcoding</strong> (<code>google.api.http</code> annotations via Envoy or grpc-gateway) to expose REST from the same proto.</li>
</ul>
<p><strong>Keepalive</strong> keeps idle long-lived connections from being silently killed by NATs, firewalls and LBs (AWS NLB drops idle TCP flows after 350 s; many corporate firewalls sooner). Client side: send HTTP/2 PINGs every <code>keepalive_time</code>. But the server enforces a minimum ping interval (Go default <code>MinTime</code> = <strong>5 minutes</strong>, and no pings without active streams unless permitted). Ping more often and the server replies <code>GOAWAY ENHANCE_YOUR_CALM</code> with debug data <code>too_many_pings</code> and closes the connection - every N minutes, for every client.</p>
<pre>// client: ping every 60s, even when idle
grpc.WithKeepaliveParams(keepalive.ClientParameters{
    Time: 60 * time.Second, Timeout: 10 * time.Second, PermitWithoutStream: true })

// server: must explicitly allow that, or clients get GOAWAY too_many_pings
grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
    MinTime: 30 * time.Second, PermitWithoutStream: true })</pre>
<blockquote>⚠️ Production tip: configure keepalive on <strong>both</strong> ends as a pair, and keep <code>keepalive_time</code> below the smallest idle timeout on the path (NLB 350 s, ALB default 60 s idle, NAT gateways 350 s). Symptoms of getting it wrong: periodic bursts of <code>UNAVAILABLE</code> on the first call after a quiet period.</blockquote>`,
`<p>דפדפנים לא יכולים לדבר gRPC רגיל: ‏<code>fetch</code> לא נותן גישה ל-framing של HTTP/2 או ל-trailers. האפשרויות:</p>
<ul>
<li><strong>gRPC-Web</strong>: וריאנט שמקודד את ה-trailers בתוך ה-body; צריך proxy מתרגם (ה-<code>envoy.filters.http.grpc_web</code> של Envoy, או מובנה בחלק מהשרתים). תומך רק ב-unary וב-server-streaming - בלי client streaming ובלי דו-כיווני.</li>
<li><strong>Connect</strong> (של Buf): פרוטוקול שעובד מעל HTTP/1.1 או HTTP/2, עם <code>POST</code> רגיל ו-JSON או protobuf - אפשר לקרוא לו עם curl. שרתי Connect מדברים גם gRPC ו-gRPC-Web על אותו port.</li>
<li><strong>JSON transcoding</strong> (אנוטציות <code>google.api.http</code> דרך Envoy או grpc-gateway) כדי לחשוף REST מאותו proto.</li>
</ul>
<p><strong>Keepalive</strong> שומר על חיבורים ארוכי-חיים ובטלים מלהיהרג בשקט על ידי NATs, ‏firewalls ו-LBs (‏AWS NLB זורק זרימות TCP בטלות אחרי 350 שניות; הרבה firewalls ארגוניים מוקדם יותר). בצד הלקוח: שולחים PING של HTTP/2 כל <code>keepalive_time</code>. אבל השרת אוכף מרווח מינימלי בין pings (ב-Go ברירת המחדל של <code>MinTime</code> היא <strong>5 דקות</strong>, ובלי pings כשאין streams פעילים אלא אם מתירים). תשלח pings לעתים קרובות יותר והשרת יענה <code>GOAWAY ENHANCE_YOUR_CALM</code> עם debug data ‏<code>too_many_pings</code> ויסגור את החיבור - כל N דקות, לכל לקוח.</p>
<pre>// client: ping every 60s, even when idle
grpc.WithKeepaliveParams(keepalive.ClientParameters{
    Time: 60 * time.Second, Timeout: 10 * time.Second, PermitWithoutStream: true })

// server: must explicitly allow that, or clients get GOAWAY too_many_pings
grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
    MinTime: 30 * time.Second, PermitWithoutStream: true })</pre>
<blockquote>⚠️ Production tip: תגדיר keepalive בשני הצדדים <strong>כזוג</strong>, ותשאיר את <code>keepalive_time</code> מתחת ל-idle timeout הקטן ביותר במסלול (‏NLB ‏350 שניות, ‏ALB ‏60 שניות idle כברירת מחדל, ‏NAT gateways ‏350 שניות). הסימפטומים כשזה לא נכון: פרצים מחזוריים של <code>UNAVAILABLE</code> על הקריאה הראשונה אחרי תקופה שקטה.</blockquote>`
        )
      }
    ],
    diagram: "client Pod --1 HTTP/2 conn--> L4 (ClusterIP/NLB) --> server Pod A   (all RPCs!)\n                                                   server Pod B   (idle)\n                                                   server Pod C   (idle, new)\nfix: client --streams--> Envoy/ALB (L7, per stream) --> A, B, C\n  or client round_robin over headless DNS --> A, B, C\n  or server MaxConnectionAge=5m -> GOAWAY -> reconnect -> rebalance",
    handsOn: [
      { cmd: "grpcurl -plaintext localhost:9090 list && grpcurl -plaintext localhost:9090 describe grpc.health.v1.Health", what: t("Discover services via reflection and inspect the standard health service.", "גלה שירותים דרך reflection ובדוק את שירות ה-health הסטנדרטי.") },
      { cmd: "grpcurl -plaintext -d '{\"service\":\"\"}' localhost:9090 grpc.health.v1.Health/Check", what: t("Call the health check exactly like a load balancer or Kubernetes probe would.", "קרא ל-health check בדיוק כמו ש-load balancer או probe של Kubernetes היו עושים.") },
      { cmd: "kubectl top pods -l app=orders && kubectl exec deploy/orders-client -- ss -tn state established '( dport = :9090 )'", what: t("Spot the L4 imbalance: a few hot server Pods, and each client holding a single established connection.", "זהה את חוסר האיזון של L4: כמה Pods של השרת חמים, וכל לקוח מחזיק חיבור established יחיד.") },
      { cmd: "buf breaking --against '.git#branch=main'", what: t("Fail CI on wire-breaking proto changes (renumbered/removed fields, changed types).", "הכשל את ה-CI על שינויי proto ששוברים את ה-wire (שדות שמספרם שונה או שהוסרו, טיפוסים שהשתנו).") }
    ],
    mnemonic: t(
      "\"One pipe, many streams\": balance the streams, not the pipe; give every call a deadline; retry only UNAVAILABLE; numbers are forever.",
      "\"צינור אחד, הרבה streams\": תאזן את ה-streams, לא את הצינור; תן לכל קריאה deadline; ‏retry רק על UNAVAILABLE; מספרי שדות הם לנצח."
    ),
    pitfalls: [
      t("Putting gRPC behind a Kubernetes ClusterIP Service or NLB and expecting even load - connections are pinned; new Pods after scale-out get nothing.", "לשים gRPC מאחורי Service מסוג ClusterIP ב-Kubernetes או NLB ולצפות לעומס אחיד - החיבורים מוצמדים; ‏Pods חדשים אחרי scale-out לא מקבלים כלום."),
      t("No deadline on calls: one slow dependency accumulates thousands of open streams and goroutines until the caller OOMs.", "בלי deadline על הקריאות: dependency איטי אחד צובר אלפי streams ו-goroutines פתוחים עד שהקורא נופל ב-OOM."),
      t("Reusing a deleted field number in protobuf - old clients silently misread new data. Always 'reserved' removed numbers and names.", "שימוש חוזר במספר של שדה שנמחק ב-protobuf - לקוחות ישנים קוראים לא נכון מידע חדש בלי שום שגיאה. תמיד תסמן מספרים ושמות שהוסרו כ-'reserved'."),
      t("Monitoring gRPC by HTTP status codes - errors arrive as HTTP 200 with grpc-status in the trailers.", "לנטר gRPC לפי קודי סטטוס של HTTP - שגיאות מגיעות כ-HTTP 200 עם grpc-status ב-trailers.")
    ],
    interview: [
      { q: t("After scaling a gRPC service from 5 to 20 Pods, latency didn't improve and the new Pods show no traffic. Explain and fix.", "אחרי שהגדלת שירות gRPC מ-5 ל-20 Pods, ה-latency לא השתפר וה-Pods החדשים לא מקבלים תעבורה. תסביר ותתקן."),
        a: t("Clients hold long-lived HTTP/2 connections opened before the scale-out, and the ClusterIP/L4 LB only balances new connections. Fix with per-request balancing: a mesh/Envoy or ALB with gRPC target groups, client-side round_robin over a headless Service (or xDS); as a quick mitigation set server MaxConnectionAge (~5 min + grace) so clients reconnect and spread.", "הלקוחות מחזיקים חיבורי HTTP/2 ארוכי-חיים שנפתחו לפני ה-scale-out, וה-ClusterIP או ה-L4 LB מאזנים רק חיבורים חדשים. מתקנים עם איזון לפי בקשה: ‏mesh או Envoy, או ALB עם target groups של gRPC, או round_robin בצד הלקוח מעל headless Service (או xDS); כ-mitigation מהיר מגדירים בשרת MaxConnectionAge (בערך 5 דקות ועוד grace) כדי שהלקוחות יתחברו מחדש ויתפזרו.") },
      { q: t("Which gRPC failures are safe to retry automatically?", "אילו כשלים ב-gRPC בטוח לעשות עליהם retry אוטומטי?"),
        a: t("UNAVAILABLE (transient transport/overload) for any method that's idempotent or didn't reach the server; DEADLINE_EXCEEDED only for idempotent calls with budget left. Never INVALID_ARGUMENT, PERMISSION_DENIED, UNIMPLEMENTED. Use retryThrottling and backoff so retries don't amplify an outage.", "UNAVAILABLE (תקלת transport זמנית או עומס) לכל method שהוא idempotent או שלא הגיע לשרת; ‏DEADLINE_EXCEEDED רק לקריאות idempotent שנשאר להן תקציב. אף פעם לא INVALID_ARGUMENT, ‏PERMISSION_DENIED, ‏UNIMPLEMENTED. משתמשים ב-retryThrottling וב-backoff כדי שה-retries לא יגבירו את התקלה.") }
    ],
    quiz: [
      { q: t("Why does a Kubernetes ClusterIP Service balance gRPC traffic poorly?", "למה Service מסוג ClusterIP ב-Kubernetes מאזן תעבורת gRPC בצורה גרועה?"),
        options: [t("kube-proxy doesn't support HTTP/2", "kube-proxy לא תומך ב-HTTP/2"), t("It balances TCP connections, and gRPC multiplexes all RPCs over one long-lived connection", "הוא מאזן חיבורי TCP, ו-gRPC מעביר את כל ה-RPCs על חיבור אחד ארוך-חיים"), t("gRPC uses UDP", "gRPC משתמש ב-UDP"), t("ClusterIP only routes to one Pod", "ClusterIP מנתב רק ל-Pod אחד")],
        answer: 1,
        explain: t("kube-proxy picks a backend per connection. With HTTP/2 multiplexing, one connection carries every request, so the choice is made once and never revisited.", "kube-proxy בוחר backend לכל חיבור. עם ה-multiplexing של HTTP/2, חיבור אחד נושא את כל הבקשות, כך שהבחירה נעשית פעם אחת ולא נבחנת מחדש.") },
      { q: t("You removed field 'coupon = 4' from a message. What should you do?", "הסרת את השדה 'coupon = 4' מ-message. מה צריך לעשות?"),
        options: [t("Reuse 4 for the next new field to keep numbers compact", "להשתמש שוב ב-4 לשדה החדש הבא כדי לשמור על מספרים צפופים"), t("Renumber the remaining fields", "למספר מחדש את שאר השדות"), t("Add 'reserved 4;' and 'reserved \"coupon\";'", "להוסיף 'reserved 4;' ו-'reserved \"coupon\";'"), t("Nothing - protobuf ignores missing fields", "כלום - protobuf מתעלם משדות חסרים")],
        answer: 2,
        explain: t("Reserving prevents anyone from reusing the number or name; reuse would make old clients decode new data as the old field - silent corruption.", "סימון כ-reserved מונע מכל אחד להשתמש שוב במספר או בשם; שימוש חוזר יגרום ללקוחות ישנים לפענח מידע חדש כשדה הישן - השחתה שקטה.") },
      { q: t("Every few minutes clients see a burst of UNAVAILABLE and server logs show GOAWAY 'too_many_pings'. Cause?", "כל כמה דקות הלקוחות רואים פרץ של UNAVAILABLE וה-logs של השרת מראים GOAWAY 'too_many_pings'. מה הסיבה?"),
        options: [t("Client keepalive interval is shorter than the server's enforced minimum ping interval", "ה-keepalive של הלקוח קצר מהמרווח המינימלי בין pings שהשרת אוכף"), t("The proto files are out of date", "קבצי ה-proto לא מעודכנים"), t("The deadline is too long", "ה-deadline ארוך מדי"), t("Server reflection is disabled", "server reflection כבוי")],
        answer: 0,
        explain: t("Servers enforce a minimum ping interval (Go default 5 min). Clients pinging faster get ENHANCE_YOUR_CALM/too_many_pings and the connection is closed. Configure both sides as a pair.", "שרתים אוכפים מרווח מינימלי בין pings (ב-Go ברירת המחדל 5 דקות). לקוחות שעושים ping מהר יותר מקבלים ENHANCE_YOUR_CALM או too_many_pings והחיבור נסגר. תגדיר את שני הצדדים כזוג.") },
      { q: t("Your ingress dashboard shows 0% HTTP 5xx, yet users report failures in a gRPC API. Why?", "הדשבורד של ה-ingress מראה 0% שגיאות HTTP 5xx, ובכל זאת משתמשים מדווחים על כשלים ב-API של gRPC. למה?"),
        options: [t("gRPC errors are logged only on the client", "שגיאות gRPC נרשמות רק בצד הלקוח"), t("gRPC failures usually return HTTP 200 with a non-zero grpc-status trailer", "כשלים ב-gRPC מחזירים בדרך כלל HTTP 200 עם trailer של grpc-status שאינו 0"), t("Ingresses can't proxy gRPC", "ingresses לא יכולים לעשות proxy ל-gRPC"), t("5xx is reserved for HTTP/1.1", "5xx שמור ל-HTTP/1.1")],
        answer: 1,
        explain: t("The HTTP layer succeeded; the RPC failed. Alert on grpc_code / rpc.grpc.status_code metrics, not HTTP status.", "שכבת ה-HTTP הצליחה; ה-RPC נכשל. תתריע על מדדי grpc_code או rpc.grpc.status_code, לא על סטטוס HTTP.") }
    ],
    playground: "lb",
    related: ["pr-http-versions", "pr-realtime-protocols", "net-load-balancing", "staff-service-mesh", "arch-resilience", "pr-encoding-serialization"]
  });

  G.push({ term: "gRPC", track: "networking", lesson: "net-grpc-production",
    def: t("RPC framework that sends protobuf messages as HTTP/2 streams over long-lived connections, with deadlines, status codes in trailers, and streaming in both directions.", "framework ל-RPC ששולח הודעות protobuf כ-streams של HTTP/2 על חיבורים ארוכי-חיים, עם deadlines, קודי סטטוס ב-trailers, ו-streaming בשני הכיוונים.") });
  G.push({ term: "Deadline propagation", track: "networking", lesson: "net-grpc-production",
    def: t("Passing the remaining time budget of an incoming request (gRPC's grpc-timeout) to every downstream call, so work stops everywhere once the original caller has given up.", "העברת תקציב הזמן שנשאר מבקשה נכנסת (ה-grpc-timeout של gRPC) לכל קריאה ל-downstream, כך שהעבודה נעצרת בכל מקום ברגע שהקורא המקורי ויתר.") });
  G.push({ term: "Protocol Buffers (protobuf)", track: "networking", lesson: "net-grpc-production",
    def: t("Google's binary, schema-first serialization format used by gRPC; fields are identified by number on the wire, so you may add fields but never reuse or renumber them.", "פורמט ה-serialization הבינארי של Google, שמתחיל מ-schema ומשמש את gRPC; שדות מזוהים על החוט לפי מספר, כך שמותר להוסיף שדות אבל אסור לעשות שימוש חוזר במספרים או למספר מחדש.") });
})();

(function () {
  var L = window.INFRA.lessons, G = window.INFRA.glossary;
  function t(en, he) { return { en: en, he: he }; }

  /* -------------------------------------------------- net-dns-operations */
  L.push({
    id: "net-dns-operations",
    track: "networking",
    order: 34,
    icon: "🧭",
    level: 3,
    minutes: 14,
    title: t("DNS Operations", "DNS Operations - לתפעל DNS בפרודקשן"),
    tldr: t(
      "Operating DNS is mostly about time: lower TTLs a full old-TTL before a migration, remember that NXDOMAIN is cached too (SOA minimum), and that NS changes ride on the parent's 48-hour TTL. Use ALIAS at the apex, CAA to pin your CAs, private zones carefully, DNSSEC only with automated signing - and lock the domain at the registrar.",
      "לתפעל DNS זה בעיקר עניין של זמן: להוריד TTLs זמן TTL ישן שלם לפני מיגרציה, לזכור שגם NXDOMAIN נשמר ב-cache (ה-SOA minimum), ושינויי NS תלויים ב-TTL של 48 שעות אצל ה-parent. משתמשים ב-ALIAS ב-apex, ב-CAA כדי לנעול את ה-CAs שלך, ב-private zones בזהירות, ב-DNSSEC רק עם חתימה אוטומטית - ונועלים את הדומיין אצל ה-registrar."
    ),
    analogy: t(
      "DNS is a city's street signs printed on millions of tourist maps. Changing a sign is instant, but the maps already in pockets (resolver caches) keep showing the old street until they expire. So before you move a shop you hand out maps that expire in a minute instead of a day - and you do it a day before the move, because the old day-long maps must run out first. DNSSEC is a hologram on every sign; brilliant against forgeries, but if the hologram printer breaks, careful tourists refuse to read any sign at all.",
      "DNS זה שלטי הרחוב של עיר שמודפסים על מיליוני מפות של תיירים. להחליף שלט זה מיידי, אבל המפות שכבר בכיסים (ה-caches של ה-resolvers) ממשיכות להראות את הרחוב הישן עד שהן פגות. אז לפני שמעבירים חנות מחלקים מפות שפגות תוך דקה במקום יום - ועושים את זה יום לפני המעבר, כי המפות הישנות של יום צריכות להיגמר קודם. ‏DNSSEC זה הולוגרמה על כל שלט; מעולה נגד זיופים, אבל אם מדפסת ההולוגרמות מתקלקלת, תיירים זהירים מסרבים לקרוא שום שלט."
    ),
    sections: [
      {
        h: t("TTL strategy for migrations (and the TTLs you don't control)", "אסטרטגיית TTL למיגרציות (וה-TTLs שלא בשליטתך)"),
        body: t(
`<p>A resolver that cached a record with TTL 86400 will keep it for up to 24 h no matter what you change. So the playbook for moving <code>api.example.com</code> to a new LB:</p>
<ol>
<li><strong>T-48h</strong>: lower TTL from 86400 to 60. You must wait at least one <em>old</em> TTL (24 h) for every cache to pick up the short TTL - lowering it 10 minutes before the cutover does nothing.</li>
<li><strong>T-0</strong>: change the record. Within ~60 s most traffic moves; keep the old target running.</li>
<li><strong>T+1h to T+days</strong>: watch the old target's traffic decay. A long tail always remains: JVMs with <code>networkaddress.cache.ttl=-1</code>, apps that resolve once at startup, connection pools that never reconnect, resolvers that clamp TTLs upward.</li>
<li><strong>Afterwards</strong>: raise TTL back (300-3600 s) - short TTLs mean more queries (Route 53 bills ~$0.40 per million standard queries; alias queries to AWS resources are free) and more exposure if your DNS provider has a bad hour.</li>
</ol>
<p>TTLs you don't control: <strong>NS delegation</strong> lives in the parent zone - <code>.com</code> serves NS and glue with a <strong>172800 s (48 h)</strong> TTL, so changing DNS providers takes up to 2 days to fully converge. Keep the old provider serving identical records during that window.</p>
<pre>$ dig +noall +answer api.example.com
api.example.com.   86400  IN  CNAME  old-lb-123.eu-west-1.elb.amazonaws.com.
#                  ^ remaining TTL in this resolver's cache (counts down)
$ dig +noall +authority example.com NS @a.gtld-servers.net
example.com.       172800 IN  NS  ns-1234.awsdns-26.org.</pre>`,
`<p>resolver ששמר ב-cache רשומה עם TTL של 86400 יחזיק אותה עד 24 שעות, לא משנה מה תשנה. אז ה-playbook להעברת <code>api.example.com</code> ל-LB חדש:</p>
<ol>
<li><strong>T-48h</strong>: מורידים TTL מ-86400 ל-60. חייבים לחכות לפחות TTL <em>ישן</em> אחד (24 שעות) כדי שכל cache יקלוט את ה-TTL הקצר - להוריד אותו 10 דקות לפני ה-cutover לא עושה כלום.</li>
<li><strong>T-0</strong>: משנים את הרשומה. תוך בערך 60 שניות רוב התעבורה עוברת; משאירים את היעד הישן רץ.</li>
<li><strong>T+1h עד T+ימים</strong>: עוקבים אחרי דעיכת התעבורה ליעד הישן. תמיד נשאר זנב ארוך: ‏JVMs עם <code>networkaddress.cache.ttl=-1</code>, אפליקציות שעושות resolve פעם אחת בעלייה, connection pools שאף פעם לא מתחברים מחדש, ו-resolvers שמעגלים TTLs כלפי מעלה.</li>
<li><strong>אחר כך</strong>: מעלים את ה-TTL בחזרה (300-3600 שניות) - TTLs קצרים אומרים יותר שאילתות (‏Route 53 גובה בערך ‎$0.40 למיליון שאילתות רגילות; שאילתות alias למשאבי AWS בחינם) ויותר חשיפה אם לספק ה-DNS שלך יש שעה רעה.</li>
</ol>
<p>TTLs שלא בשליטתך: ה-<strong>NS delegation</strong> נמצא ב-zone של ה-parent - ‏<code>.com</code> מגיש NS ו-glue עם TTL של <strong>172800 שניות (48 שעות)</strong>, כך שהחלפת ספק DNS לוקחת עד יומיים להתכנס לגמרי. תשאיר את הספק הישן מגיש רשומות זהות לאורך כל החלון הזה.</p>
<pre>$ dig +noall +answer api.example.com
api.example.com.   86400  IN  CNAME  old-lb-123.eu-west-1.elb.amazonaws.com.
#                  ^ remaining TTL in this resolver's cache (counts down)
$ dig +noall +authority example.com NS @a.gtld-servers.net
example.com.       172800 IN  NS  ns-1234.awsdns-26.org.</pre>`
        )
      },
      {
        h: t("Record types in practice: ALIAS, CAA, SRV, TXT", "סוגי רשומות בפרקטיקה: ‏ALIAS, ‏CAA, ‏SRV, ‏TXT"),
        body: t(
`<pre>; Apex pointing at a load balancer: CNAME is illegal at the apex, so use a provider ALIAS
example.com.         ALIAS  d111abcdef8.cloudfront.net.   ; Route 53 Alias / Cloudflare CNAME flattening / Azure alias record
; Only these CAs may issue certs for this domain (CAs must check since Sept 2017)
example.com.         CAA    0 issue "letsencrypt.org"
example.com.         CAA    0 issue "amazon.com"
example.com.         CAA    0 issuewild ";"                ; nobody may issue wildcards
example.com.         CAA    0 iodef "mailto:security@example.com"
; Service discovery: priority weight port target
_sip._tcp.example.com. SRV  10 60 5060 sip1.example.com.
; Ownership proofs
example.com.         TXT    "google-site-verification=3fGk..."
_acme-challenge.example.com. TXT "q8Jx...nZ"                ; ACME DNS-01 (wildcard certs)</pre>
<ul>
<li><strong>ALIAS/ANAME</strong> is not a real DNS type on the wire - the provider resolves the target and answers with A/AAAA records. Route 53 aliases also follow target IP changes automatically and cost nothing for AWS targets.</li>
<li><strong>CAA</strong> is cheap insurance: a phished or misconfigured CA can't issue for you. Gotcha: forget to list the CA your CDN uses (e.g. CloudFront/ACM = <code>amazon.com</code>) and certificate renewal fails weeks later.</li>
<li><strong>TXT verification records</strong> pile up: every SaaS asks for one. Audit them - a stale verification for a deprovisioned service can enable <strong>subdomain takeover</strong> if a CNAME still points at a resource you no longer own (deleted S3 bucket, Heroku app, Azure app).</li>
</ul>`,
`<pre>; Apex pointing at a load balancer: CNAME is illegal at the apex, so use a provider ALIAS
example.com.         ALIAS  d111abcdef8.cloudfront.net.   ; Route 53 Alias / Cloudflare CNAME flattening / Azure alias record
; Only these CAs may issue certs for this domain (CAs must check since Sept 2017)
example.com.         CAA    0 issue "letsencrypt.org"
example.com.         CAA    0 issue "amazon.com"
example.com.         CAA    0 issuewild ";"                ; nobody may issue wildcards
example.com.         CAA    0 iodef "mailto:security@example.com"
; Service discovery: priority weight port target
_sip._tcp.example.com. SRV  10 60 5060 sip1.example.com.
; Ownership proofs
example.com.         TXT    "google-site-verification=3fGk..."
_acme-challenge.example.com. TXT "q8Jx...nZ"                ; ACME DNS-01 (wildcard certs)</pre>
<ul>
<li><strong>ALIAS/ANAME</strong> הוא לא סוג רשומה אמיתי על החוט - הספק עושה resolve ליעד ועונה עם רשומות A או AAAA. ‏aliases של Route 53 גם עוקבים אוטומטית אחרי שינויי IP ביעד ולא עולים כלום ליעדי AWS.</li>
<li><strong>CAA</strong> זה ביטוח זול: CA שעבר phishing או מוגדר לא נכון לא יכול להנפיק בשמך. מלכודת: תשכח לרשום את ה-CA שה-CDN שלך משתמש בו (למשל CloudFront או ACM = ‏<code>amazon.com</code>) וחידוש התעודה ייכשל כמה שבועות אחר כך.</li>
<li><strong>רשומות TXT לאימות</strong> מצטברות: כל SaaS מבקש אחת. תעשה להן audit - אימות ישן לשירות שכבר הורד, ובמיוחד CNAME שעדיין מצביע על משאב שכבר לא שלך (‏S3 bucket שנמחק, אפליקציית Heroku, אפליקציה ב-Azure), יכולים לאפשר <strong>subdomain takeover</strong>.</li>
</ul>`
        )
      },
      {
        h: t("Split-horizon, private zones and negative caching", "Split-horizon, ‏private zones ו-negative caching"),
        body: t(
`<p><strong>Split-horizon</strong>: the same name returns different answers depending on who asks - <code>api.example.com</code> resolves to a private 10.x IP inside the VPC and to the public LB outside. In AWS, a Route 53 <strong>private hosted zone</strong> associated with a VPC; in Azure, Private DNS zones linked to VNets (also how Private Endpoints resolve <code>*.privatelink.blob.core.windows.net</code>); in GCP, private Cloud DNS zones. For hybrid networks, Route 53 Resolver inbound/outbound endpoints (or Azure DNS Private Resolver) forward queries between on-prem and cloud.</p>
<blockquote>⚠️ Production tip: a private zone for <code>example.com</code> makes the VPC resolver <strong>authoritative for the whole domain</strong>. Any record that exists only in the public zone returns <strong>NXDOMAIN</strong> from inside the VPC - there's no fallback. Create private zones for narrow subdomains (<code>internal.example.com</code>) rather than shadowing the apex.</blockquote>
<p><strong>Negative caching</strong> (RFC 2308): "this name doesn't exist" is cached too, for the lower of the SOA record's TTL and its <strong>MINIMUM</strong> field. Route 53's default SOA has a minimum of <strong>86400 s</strong>:</p>
<pre>$ dig +noall +answer example.com SOA
example.com. 900 IN SOA ns-2048.awsdns-64.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400
#                                                                       serial refresh retry expire MINIMUM
$ dig newsvc.example.com      # queried BEFORE the record was created
;; status: NXDOMAIN ... (cached by the resolver for min(900, 86400) = 900 s here)</pre>
<p>The classic trap: a deploy pipeline health-checks <code>newsvc.example.com</code> before Terraform created the record; the resolver caches NXDOMAIN, and the service is "missing" for 15 minutes (or hours with a high SOA TTL) after the record exists. Many resolvers cap negative TTLs (BIND's <code>max-ncache-ttl</code> defaults to 3 h), but don't count on it - create records first, query second, and keep the SOA TTL/minimum modest (300-900 s).</p>`,
`<p><strong>Split-horizon</strong>: אותו שם מחזיר תשובות שונות לפי מי ששואל - ‏<code>api.example.com</code> מתורגם ל-IP פרטי של 10.x בתוך ה-VPC ול-LB הציבורי מבחוץ. ב-AWS זה <strong>private hosted zone</strong> של Route 53 שמשויך ל-VPC; ב-Azure אלה Private DNS zones שמקושרים ל-VNets (וככה גם Private Endpoints מתורגמים, ‏<code>*.privatelink.blob.core.windows.net</code>); ב-GCP אלה private zones של Cloud DNS. ברשתות היברידיות, ‏inbound ו-outbound endpoints של Route 53 Resolver (או Azure DNS Private Resolver) מעבירים שאילתות בין on-prem לענן.</p>
<blockquote>⚠️ Production tip: ‏private zone ל-<code>example.com</code> הופך את ה-resolver של ה-VPC ל-<strong>authoritative על כל הדומיין</strong>. כל רשומה שקיימת רק ב-zone הציבורי מחזירה <strong>NXDOMAIN</strong> מתוך ה-VPC - אין fallback. תיצור private zones ל-subdomains צרים (<code>internal.example.com</code>) במקום להצל על ה-apex.</blockquote>
<p><strong>Negative caching</strong> (‏RFC 2308): גם "השם הזה לא קיים" נשמר ב-cache, לנמוך מבין ה-TTL של רשומת ה-SOA ושדה ה-<strong>MINIMUM</strong> שלה. ב-SOA ברירת המחדל של Route 53 ה-minimum הוא <strong>86400 שניות</strong>:</p>
<pre>$ dig +noall +answer example.com SOA
example.com. 900 IN SOA ns-2048.awsdns-64.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400
#                                                                       serial refresh retry expire MINIMUM
$ dig newsvc.example.com      # queried BEFORE the record was created
;; status: NXDOMAIN ... (cached by the resolver for min(900, 86400) = 900 s here)</pre>
<p>המלכודת הקלאסית: pipeline של deploy עושה health check ל-<code>newsvc.example.com</code> לפני ש-Terraform יצר את הרשומה; ה-resolver שומר NXDOMAIN ב-cache, והשירות "חסר" 15 דקות (או שעות עם TTL גבוה ל-SOA) אחרי שהרשומה כבר קיימת. הרבה resolvers מגבילים negative TTLs (ה-<code>max-ncache-ttl</code> של BIND הוא 3 שעות כברירת מחדל), אבל אל תסמוך על זה - קודם יוצרים רשומות, אחר כך שואלים, ושומרים על TTL ו-minimum צנועים ב-SOA (‏300-900 שניות).</p>`
        )
      },
      {
        h: t("DNSSEC and DNS failover: what they really buy you", "DNSSEC ו-DNS failover: מה הם באמת נותנים"),
        body: t(
`<p><strong>DNSSEC</strong> signs each record set (<code>RRSIG</code>) with the zone's key (<code>DNSKEY</code>); the parent publishes a hash of your key (<code>DS</code>), forming a chain of trust up to the root. Validating resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1, Quad9 and many ISPs) reject forged answers - it defeats cache poisoning (Kaminsky-style) and on-path tampering. It does <strong>not</strong> encrypt queries (that's DoT/DoH) or protect the last hop to a non-validating stub.</p>
<p>The risk is operational: if signatures expire, keys rotate wrongly, or the <code>DS</code> at the parent doesn't match your new provider's key, validating resolvers return <strong>SERVFAIL</strong> - your domain disappears for a large share of users while it works from non-validating networks (confusing to debug). Slack's Sept 2021 DNSSEC rollout caused up to ~24 h of failures for some users; botched key rollovers have taken down entire TLDs (.se in 2022). Rules: use your provider's managed signing (Route 53, Cloud DNS, Cloudflare), remove the DS record <em>before</em> migrating providers (and wait out its TTL), and monitor with <code>delv</code> or DNSViz.</p>
<p><strong>DNS failover</strong> (Route 53 failover/latency/weighted records with health checks, Azure Traffic Manager, Cloudflare LB): health checkers probe every 30 s (or 10 s "fast"), mark unhealthy after 3 failures, and stop returning that answer. Time to fail over ≈ detection (30-90 s) + record TTL (keep 60 s) + client caching (browsers, JVMs, pooled connections - minutes to forever). Good for regional failover; too slow for instance failover - that's the load balancer's job.</p>
<pre>$ dig +dnssec +multi example.com A | grep -E 'RRSIG|flags'
;; flags: qr rd ra ad;           # 'ad' = Authenticated Data: the resolver validated it
$ delv example.com A             # local validation with a verbose verdict
; fully validated</pre>`,
`<p><strong>DNSSEC</strong> חותם על כל קבוצת רשומות (<code>RRSIG</code>) עם המפתח של ה-zone (<code>DNSKEY</code>); ה-parent מפרסם hash של המפתח שלך (<code>DS</code>), וכך נוצרת שרשרת אמון עד ה-root. ‏resolvers שמאמתים (‏Google 8.8.8.8, ‏Cloudflare 1.1.1.1, ‏Quad9 והרבה ספקי אינטרנט) דוחים תשובות מזויפות - זה מנטרל cache poisoning (בסגנון Kaminsky) ושינוי בדרך. זה <strong>לא</strong> מצפין שאילתות (זה DoT או DoH) ולא מגן על ה-hop האחרון ל-stub שלא מאמת.</p>
<p>הסיכון הוא תפעולי: אם החתימות פגות, מפתחות מתחלפים לא נכון, או שה-<code>DS</code> אצל ה-parent לא תואם למפתח של הספק החדש, ‏resolvers שמאמתים מחזירים <strong>SERVFAIL</strong> - הדומיין שלך נעלם לחלק גדול מהמשתמשים בזמן שהוא עובד מרשתות שלא מאמתות (מבלבל מאוד ל-debug). ה-rollout של DNSSEC אצל Slack בספטמבר 2021 גרם לכשלים של עד בערך 24 שעות לחלק מהמשתמשים; ‏key rollovers שהשתבשו הפילו TLDs שלמים (‏.se ב-2022). הכללים: להשתמש בחתימה המנוהלת של הספק (‏Route 53, ‏Cloud DNS, ‏Cloudflare), להסיר את רשומת ה-DS <em>לפני</em> מעבר ספק (ולחכות שה-TTL שלה יעבור), ולנטר עם <code>delv</code> או DNSViz.</p>
<p><strong>DNS failover</strong> (רשומות failover, ‏latency או weighted של Route 53 עם health checks, ‏Azure Traffic Manager, ‏Cloudflare LB): ה-health checkers בודקים כל 30 שניות (או 10 שניות במצב "fast"), מסמנים unhealthy אחרי 3 כשלים, ומפסיקים להחזיר את התשובה הזו. זמן ה-failover ≈ זיהוי (30-90 שניות) + ה-TTL של הרשומה (תשאיר 60 שניות) + caching בצד הלקוח (דפדפנים, ‏JVMs, חיבורים ב-pool - מדקות ועד לנצח). מתאים ל-failover בין regions; איטי מדי ל-failover בין instances - זה התפקיד של ה-load balancer.</p>
<pre>$ dig +dnssec +multi example.com A | grep -E 'RRSIG|flags'
;; flags: qr rd ra ad;           # 'ad' = Authenticated Data: the resolver validated it
$ delv example.com A             # local validation with a verbose verdict
; fully validated</pre>`
        )
      },
      {
        h: t("Debugging delegation, famous outages, and registrar lock", "Debugging של delegation, תקלות מפורסמות, ונעילה אצל ה-registrar"),
        body: t(
`<p><code>dig +trace</code> walks the chain from the root yourself, bypassing every cache - the fastest way to see <em>where</em> resolution breaks:</p>
<pre>$ dig +trace +nodnssec api.example.com
.            518400 IN NS a.root-servers.net.         ;; from root hints
com.         172800 IN NS a.gtld-servers.net.         ;; root says: ask .com
example.com. 172800 IN NS ns-1234.awsdns-26.org.     ;; .com says: ask Route 53
api.example.com. 60 IN A  203.0.113.10                ;; authoritative answer
# Do all authoritative servers agree? Compare SOA serials
$ for ns in $(dig +short NS example.com); do echo "$ns $(dig +short SOA example.com @$ns | awk '{print $3}')"; done
# Ask an authoritative server directly, no recursion
$ dig +norec api.example.com @ns-1234.awsdns-26.org</pre>
<p>Common delegation bugs: <strong>lame delegation</strong> (the parent lists an NS that doesn't serve the zone - e.g. you deleted and recreated a Route 53 hosted zone, which gets <em>new</em> NS names, but the registrar still has the old ones); missing or stale <strong>glue</strong> for in-zone nameservers; NS records at the parent and in the zone disagreeing.</p>
<p>Outages worth knowing: <strong>Dyn, Oct 2016</strong> - a Mirai botnet DDoS on a single managed DNS provider took Twitter, GitHub, Netflix and others offline (lesson: secondary DNS from a second provider). <strong>Facebook, Oct 2021</strong> - a backbone change withdrew BGP routes; their DNS servers, designed to withdraw themselves when unhealthy, disappeared, and ~6 h of global outage followed. <strong>AWS us-east-1, Oct 2025</strong> - a race condition in DynamoDB's DNS automation left the regional endpoint's record empty, and dependent services cascaded for hours.</p>
<p><strong>Registrar security</strong>: the domain itself is the root of all your DNS. Enable <code>clientTransferProhibited</code>, <code>clientUpdateProhibited</code> and <code>clientDeleteProhibited</code>; for critical domains buy a <strong>registry lock</strong> (<code>server*Prohibited</code>, changes need out-of-band human verification); enforce MFA and SSO on the registrar account; turn on auto-renew with a valid card and alert 60 days before expiry.</p>
<pre>$ whois example.com | grep -i -E 'status|expir'
Domain Status: clientTransferProhibited
Domain Status: serverDeleteProhibited
Registry Expiry Date: 2027-08-13T04:00:00Z</pre>`,
`<p><code>dig +trace</code> עובר בעצמו על השרשרת מה-root, ועוקף כל cache - הדרך הכי מהירה לראות <em>איפה</em> ה-resolution נשבר:</p>
<pre>$ dig +trace +nodnssec api.example.com
.            518400 IN NS a.root-servers.net.         ;; from root hints
com.         172800 IN NS a.gtld-servers.net.         ;; root says: ask .com
example.com. 172800 IN NS ns-1234.awsdns-26.org.     ;; .com says: ask Route 53
api.example.com. 60 IN A  203.0.113.10                ;; authoritative answer
# Do all authoritative servers agree? Compare SOA serials
$ for ns in $(dig +short NS example.com); do echo "$ns $(dig +short SOA example.com @$ns | awk '{print $3}')"; done
# Ask an authoritative server directly, no recursion
$ dig +norec api.example.com @ns-1234.awsdns-26.org</pre>
<p>באגים נפוצים ב-delegation: <strong>lame delegation</strong> (ה-parent מפרט NS שלא מגיש את ה-zone - למשל מחקת ויצרת מחדש hosted zone ב-Route 53, שמקבל שמות NS <em>חדשים</em>, אבל אצל ה-registrar עדיין רשומים הישנים); ‏<strong>glue</strong> חסר או ישן ל-nameservers שנמצאים בתוך ה-zone; רשומות NS אצל ה-parent ובתוך ה-zone שלא מסכימות.</p>
<p>תקלות ששווה להכיר: <strong>Dyn, אוקטובר 2016</strong> - מתקפת DDoS של botnet ‏Mirai על ספק DNS מנוהל אחד הורידה את Twitter, ‏GitHub, ‏Netflix ואחרים (הלקח: secondary DNS מספק שני). <strong>Facebook, אוקטובר 2021</strong> - שינוי ב-backbone משך routes של BGP; שרתי ה-DNS שלהם, שתוכננו להסיר את עצמם כשהם לא בריאים, נעלמו, ואחרי זה הגיעו בערך 6 שעות של השבתה גלובלית. <strong>AWS us-east-1, אוקטובר 2025</strong> - race condition באוטומציית ה-DNS של DynamoDB השאיר את הרשומה של ה-endpoint האזורי ריקה, ושירותים תלויים קרסו בשרשרת במשך שעות.</p>
<p><strong>אבטחה אצל ה-registrar</strong>: הדומיין עצמו הוא השורש של כל ה-DNS שלך. תפעיל <code>clientTransferProhibited</code>, ‏<code>clientUpdateProhibited</code> ו-<code>clientDeleteProhibited</code>; לדומיינים קריטיים תקנה <strong>registry lock</strong> (‏<code>server*Prohibited</code>, שינויים דורשים אימות אנושי מחוץ לערוץ); תאכוף MFA ו-SSO על חשבון ה-registrar; תפעיל auto-renew עם כרטיס אשראי בתוקף והתראה 60 יום לפני תפוגה.</p>
<pre>$ whois example.com | grep -i -E 'status|expir'
Domain Status: clientTransferProhibited
Domain Status: serverDeleteProhibited
Registry Expiry Date: 2027-08-13T04:00:00Z</pre>`
        )
      }
    ],
    diagram: "T-48h  TTL 86400 -> 60      (wait one OLD TTL)\nT-0    record -> new LB      (most traffic moves in ~60 s)\nT+days old target drains     (JVM / pools / clamping resolvers = long tail)\n\nroot (.) --NS--> com. (NS TTL 172800) --NS--> ns-1234.awsdns-26.org --A--> 203.0.113.10\n                                                       +-- DS/DNSKEY/RRSIG chain of trust",
    handsOn: [
      { cmd: "dig +trace +nodnssec www.github.com", what: t("Walk the delegation from the root yourself and see which server answers at each step.", "עבור בעצמך על ה-delegation מה-root וראה איזה שרת עונה בכל שלב.") },
      { cmd: "dig +noall +answer example.com SOA && dig +noall +answer example.com CAA", what: t("Read the SOA (serial, refresh, retry, expire, negative-cache minimum) and the CAA policy of a domain.", "קרא את ה-SOA (‏serial, ‏refresh, ‏retry, ‏expire, וה-minimum של negative cache) ואת מדיניות ה-CAA של דומיין.") },
      { cmd: "for r in 8.8.8.8 1.1.1.1 9.9.9.9; do echo \"$r: $(dig +short api.example.com @$r)\"; done", what: t("Compare answers across public resolvers during a migration to see who still has the old record cached.", "השווה תשובות בין resolvers ציבוריים בזמן מיגרציה כדי לראות למי עדיין יש את הרשומה הישנה ב-cache.") },
      { cmd: "dig +dnssec cloudflare.com A | grep flags; delv cloudflare.com", what: t("Check DNSSEC validation: the 'ad' flag from a validating resolver and delv's local verdict.", "בדוק validation של DNSSEC: הדגל 'ad' מ-resolver שמאמת, והפסיקה המקומית של delv.") },
      { cmd: "aws route53 get-hosted-zone --id Z123ABC --query DelegationSet.NameServers; dig +short NS example.com @a.gtld-servers.net", what: t("Detect lame delegation: the hosted zone's NS set must match what the .com registry serves.", "זהה lame delegation: סט ה-NS של ה-hosted zone חייב להתאים למה שה-registry של .com מגיש.") }
    ],
    mnemonic: t(
      "\"Lower a TTL early, create before you query, ALIAS the apex, CAA your CAs, DS out before you move, lock the registrar.\"",
      "\"מורידים TTL מוקדם, יוצרים לפני ששואלים, ‏ALIAS ל-apex, ‏CAA ל-CAs, מוציאים DS לפני מעבר, ונועלים את ה-registrar.\""
    ),
    pitfalls: [
      t("Lowering the TTL right before the cutover - caches still hold the old 24 h TTL. Lower it at least one old-TTL in advance.", "להוריד TTL ממש לפני ה-cutover - ה-caches עדיין מחזיקים את ה-TTL הישן של 24 שעות. תוריד אותו לפחות TTL ישן אחד מראש."),
      t("A private hosted zone for the apex domain: every public-only record becomes NXDOMAIN inside the VPC.", "private hosted zone לדומיין ה-apex: כל רשומה שקיימת רק בציבורי הופכת ל-NXDOMAIN בתוך ה-VPC."),
      t("Migrating DNS providers with DNSSEC enabled and the old DS record still at the parent - validating resolvers SERVFAIL for a large share of users.", "להעביר ספק DNS כש-DNSSEC מופעל ורשומת ה-DS הישנה עדיין אצל ה-parent - ‏resolvers שמאמתים מחזירים SERVFAIL לחלק גדול מהמשתמשים."),
      t("Recreating a Route 53 hosted zone (new NS names) without updating the registrar - lame delegation and a full outage once caches expire.", "ליצור מחדש hosted zone ב-Route 53 (שמות NS חדשים) בלי לעדכן את ה-registrar - ‏lame delegation והשבתה מלאה ברגע שה-caches פגים.")
    ],
    interview: [
      { q: t("Walk me through migrating api.example.com to a new load balancer with minimal user impact.", "תסביר איך היית מעביר את api.example.com ל-load balancer חדש עם מינימום פגיעה במשתמשים."),
        a: t("Two days before (≥ old TTL), lower TTL to 60. Bring up the new LB and test it via curl --resolve. Cut over the record (or use weighted records 10/90 → 100/0 for a canary). Keep the old LB serving and watch its traffic decay - long-lived clients and JVM caches form a tail. After stable, raise the TTL and decommission the old target days later.", "יומיים לפני (≥ ה-TTL הישן), מורידים TTL ל-60. מקימים את ה-LB החדש ובודקים אותו עם curl --resolve. מחליפים את הרשומה (או משתמשים ב-weighted records מ-10/90 ל-100/0 בשביל canary). משאירים את ה-LB הישן מגיש ועוקבים אחרי דעיכת התעבורה אליו - לקוחות עם חיבורים ארוכים ו-caches של JVM יוצרים זנב. כשהכול יציב, מעלים את ה-TTL ומורידים את היעד הישן כמה ימים אחר כך.") },
      { q: t("A newly created record returns NXDOMAIN from some resolvers 10 minutes after creation. Why?", "רשומה חדשה מחזירה NXDOMAIN מחלק מה-resolvers 10 דקות אחרי שנוצרה. למה?"),
        a: t("Negative caching: something queried the name before it existed, and the resolver cached NXDOMAIN for min(SOA TTL, SOA MINIMUM). It clears when that expires; prevent it by creating records before anything queries them and keeping SOA negative TTLs low.", "Negative caching: משהו שאל על השם לפני שהוא היה קיים, וה-resolver שמר NXDOMAIN ל-min(SOA TTL, SOA MINIMUM). זה מתנקה כשהזמן הזה פג; מונעים את זה על ידי יצירת רשומות לפני שמשהו שואל עליהן ושמירה על negative TTLs נמוכים ב-SOA.") }
    ],
    quiz: [
      { q: t("Your record has TTL 86400. When should you lower it to 60 before a migration?", "לרשומה שלך יש TTL של 86400. מתי צריך להוריד אותו ל-60 לפני מיגרציה?"),
        options: [t("5 minutes before the cutover", "5 דקות לפני ה-cutover"), t("At least 24 hours before the cutover", "לפחות 24 שעות לפני ה-cutover"), t("Right after the cutover", "מיד אחרי ה-cutover"), t("It doesn't matter - resolvers ignore TTL", "זה לא משנה - resolvers מתעלמים מ-TTL")],
        answer: 1,
        explain: t("Caches that fetched the record just before you lowered it will hold it for up to the old 86400 s. Only after one full old TTL is every cache on the short TTL.", "caches שמשכו את הרשומה רגע לפני שהורדת את ה-TTL יחזיקו אותה עד 86400 השניות הישנות. רק אחרי TTL ישן שלם כל ה-caches נמצאים על ה-TTL הקצר.") },
      { q: t("What does DNSSEC protect against?", "מפני מה DNSSEC מגן?"),
        options: [t("Eavesdropping on DNS queries", "האזנה לשאילתות DNS"), t("DDoS on your nameservers", "DDoS על ה-nameservers שלך"), t("Forged or tampered DNS answers (e.g. cache poisoning)", "תשובות DNS מזויפות או ששונו בדרך (למשל cache poisoning)"), t("Domain expiry", "תפוגה של הדומיין")],
        answer: 2,
        explain: t("DNSSEC provides origin authentication and integrity via signatures. Confidentiality is DoT/DoH; DDoS needs capacity/anycast; expiry needs auto-renew.", "DNSSEC נותן אימות מקור ושלמות בעזרת חתימות. סודיות זה DoT או DoH; ל-DDoS צריך קיבולת ו-anycast; לתפוגה צריך auto-renew.") },
      { q: t("Inside your VPC, www.example.com returns NXDOMAIN, but it resolves fine from the Internet. You recently added a private hosted zone 'example.com' for internal records. Cause?", "בתוך ה-VPC, ‏www.example.com מחזיר NXDOMAIN, אבל מהאינטרנט הוא מתורגם תקין. לאחרונה הוספת private hosted zone בשם 'example.com' לרשומות פנימיות. מה הסיבה?"),
        options: [t("The VPC resolver is now authoritative for example.com and has no www record - no fallback to the public zone", "ה-resolver של ה-VPC הוא עכשיו authoritative על example.com ואין לו רשומת www - אין fallback ל-zone הציבורי"), t("DNSSEC validation failure", "כשל ב-validation של DNSSEC"), t("The public TTL is too long", "ה-TTL הציבורי ארוך מדי"), t("Security Groups block UDP 53", "Security Groups חוסמים UDP 53")],
        answer: 0,
        explain: t("Private zones shadow the whole name inside associated VPCs. Copy the needed records or, better, use a narrow private subdomain like internal.example.com.", "private zones מצלים על כל השם בתוך ה-VPCs המשויכים. תעתיק את הרשומות הנדרשות או, עדיף, תשתמש ב-subdomain פרטי צר כמו internal.example.com.") },
      { q: t("Which CAA record allows only Let's Encrypt to issue certificates and forbids wildcard certificates?", "איזו רשומת CAA מאפשרת רק ל-Let's Encrypt להנפיק תעודות ואוסרת תעודות wildcard?"),
        options: [t("CAA 0 issuewild \"letsencrypt.org\" only", "רק CAA 0 issuewild \"letsencrypt.org\""), t("TXT \"v=caa letsencrypt.org\"", "TXT \"v=caa letsencrypt.org\""), t("CAA 128 iodef \"letsencrypt.org\"", "CAA 128 iodef \"letsencrypt.org\""), t("CAA 0 issue \"letsencrypt.org\" plus CAA 0 issuewild \";\"", "CAA 0 issue \"letsencrypt.org\" ועוד CAA 0 issuewild \";\"")],
        answer: 3,
        explain: t("'issue' authorizes CAs for normal names; 'issuewild' overrides it for wildcards, and \";\" means no CA may issue. iodef is only a reporting address.", "'issue' מאשר CAs לשמות רגילים; ‏'issuewild' דורס אותו עבור wildcards, ו-\";\" אומר שאף CA לא רשאי להנפיק. ‏iodef הוא רק כתובת לדיווח.") }
    ],
    related: ["net-dns", "net-troubleshooting", "k8s-ingress-certs-dns", "rel-bcdr", "net-bgp-anycast", "pr-applied-crypto-pki"]
  });

  G.push({ term: "DNSSEC", track: "networking", lesson: "net-dns-operations",
    def: t("DNS Security Extensions: records are signed (RRSIG/DNSKEY) with a chain of trust via DS records up to the root, so validating resolvers reject forged answers. Broken signing = SERVFAIL.", "DNS Security Extensions: הרשומות חתומות (RRSIG ו-DNSKEY) עם שרשרת אמון דרך רשומות DS עד ה-root, כך ש-resolvers שמאמתים דוחים תשובות מזויפות. חתימה שבורה = SERVFAIL.") });
  G.push({ term: "CAA record", track: "networking", lesson: "net-dns-operations",
    def: t("DNS record listing which certificate authorities may issue certificates for a domain (issue / issuewild / iodef); CAs must check it before issuing.", "רשומת DNS שמפרטת אילו certificate authorities רשאיות להנפיק תעודות לדומיין (‏issue, ‏issuewild, ‏iodef); ה-CAs חייבות לבדוק אותה לפני הנפקה.") });
  G.push({ term: "Split-horizon DNS", track: "networking", lesson: "net-dns-operations",
    def: t("Serving different answers for the same name depending on where the query comes from - e.g. private IPs inside a VPC via a private hosted zone, public IPs outside.", "הגשת תשובות שונות לאותו שם לפי המקום שממנו מגיעה השאילתה - למשל כתובות פרטיות בתוך VPC דרך private hosted zone, וכתובות ציבוריות מבחוץ.") });
})();

/* =========================================================================
   On-call scenario: CDN serves wrong / stale content after a deploy
   ========================================================================= */
(function () {
  var S = window.INFRA.scenarios;
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }

  S.push({
    id: "cdn-cache-poisoning-stale",
    icon: "🧊",
    title: t("Blank pages and someone else's cart after a deploy", "דפים לבנים ועגלה של מישהו אחר אחרי deploy"),
    start: "s1",
    steps: {
      s1: {
        text: t("16:20. The frontend deploy (new bundle + a 'CDN performance' config change) finished at 16:02. Since then: JS error rate 0.2% → 31%, support reports blank white pages. The backend dashboards are green.",
                "16:20. ה-deploy של ה-frontend (‏bundle חדש ועוד שינוי קונפיגורציה של 'ביצועי CDN') הסתיים ב-16:02. מאז: שיעור שגיאות JS קפץ מ-0.2% ל-31%, והתמיכה מדווחת על דפים לבנים. הדשבורדים של ה-backend ירוקים."),
        data: "Sentry: ChunkLoadError: Loading chunk main failed.\n  (missing: https://shop.example.com/static/main.4e1a9c.js)  x 18,402 in 15 min\nCloudFront 4xx rate: 0.1% -> 22%  (path: /static/*)\nOrigin (S3) 5xx: 0",
        choices: [
          c("Look at the actual response headers from the edge for the HTML and the failing chunk", "להסתכל על ה-headers האמיתיים מה-edge עבור ה-HTML וה-chunk שנכשל", "s2", 15,
            "Right instinct: caching bugs are diagnosed from headers (Cache-Control, Age, X-Cache), not from guesses.",
            "אינסטינקט נכון: באגים של caching מאבחנים מה-headers (‏Cache-Control, ‏Age, ‏X-Cache), לא מניחושים."),
          c("Roll back the frontend deploy immediately", "לעשות rollback מיידי ל-deploy של ה-frontend", "s2r", -5,
            "Rollback feels safe, but you don't know yet what's cached where. Rolling back HTML that browsers and edges may still hold can make the mismatch worse.",
            "rollback מרגיש בטוח, אבל אתה עוד לא יודע מה שמור איפה. להחזיר HTML שדפדפנים ו-edges אולי עדיין מחזיקים יכול להחמיר את חוסר ההתאמה."),
          c("Purge /* on CloudFront and see if it goes away", "לעשות purge ל-/* ב-CloudFront ולראות אם זה עובר", "s2p", 0,
            "Cheap (one path), but blind: you'll erase the evidence and, if the origin is the problem, the edge will simply re-cache the same broken responses.",
            "זול (‏path אחד), אבל עיוור: תמחק את הראיות, ואם הבעיה ב-origin, ה-edge פשוט ישמור שוב את אותן תשובות שבורות.")
        ]
      },
      s2r: {
        text: t("The rollback redeploys the old HTML and old bundle. Errors drop to 12% and then stall. Some users now get the old HTML pointing at the new chunk names from the edge cache, others the reverse. You still don't know why.",
                "ה-rollback מעלה מחדש את ה-HTML הישן וה-bundle הישן. השגיאות יורדות ל-12% ונתקעות. חלק מהמשתמשים מקבלים עכשיו מה-edge cache את ה-HTML הישן שמצביע על שמות ה-chunks החדשים, ואחרים להפך. אתה עדיין לא יודע למה."),
        choices: [
          c("Stop changing things and inspect the edge headers", "להפסיק לשנות דברים ולבדוק את ה-headers ב-edge", "s2", 5,
            "Good recovery - measure before the next change.",
            "התאוששות טובה - למדוד לפני השינוי הבא.")
        ]
      },
      s2p: {
        text: t("Errors dip for 3 minutes, then climb back to 25%. The edges re-cached exactly the same responses. Time to look at what the origin and CDN are actually sending.",
                "השגיאות יורדות ל-3 דקות, ואז מטפסות בחזרה ל-25%. ה-edges שמרו שוב בדיוק את אותן תשובות. הגיע הזמן להסתכל על מה שה-origin וה-CDN באמת שולחים."),
        choices: [
          c("Inspect the edge headers", "לבדוק את ה-headers ב-edge", "s2", 5,
            "Better late than never.",
            "עדיף מאוחר מאשר אף פעם.")
        ]
      },
      s2: {
        text: t("You curl both URLs through the edge. Two things stand out.",
                "אתה מריץ curl על שני ה-URLs דרך ה-edge. שני דברים בולטים."),
        data: "$ curl -sI https://shop.example.com/\nHTTP/2 200\ncache-control: public, max-age=86400\nage: 1104\nx-cache: Hit from cloudfront\n...<script src=\"/static/main.4e1a9c.js\">   (new HTML)\n\n$ curl -sI https://shop.example.com/static/main.4e1a9c.js\nHTTP/2 404\ncache-control: public, max-age=3600\nage: 1093\nx-cache: Error from cloudfront\n\n$ aws s3 ls s3://shop-web/static/main.4e1a9c.js\n2026-11-14 16:01:58     412311 main.4e1a9c.js     # the file EXISTS now\n\ndeploy log: 16:01:40 upload index.html ; 16:01:58 upload static/* ; --delete removed main.91bd02.js",
        choices: [
          c("Diagnose: HTML was uploaded before the assets, so edges cached a 404 for the new chunk for 1 h; old chunks were deleted; HTML itself is cached for a day", "אבחנה: ה-HTML עלה לפני ה-assets, אז ה-edges שמרו 404 על ה-chunk החדש לשעה; ה-chunks הישנים נמחקו; וה-HTML עצמו נשמר ליום", "s3", 15,
            "Exactly. Three bugs compound: wrong upload order, a cacheable 404, and 'aws s3 sync --delete' removing the bundle that cached old HTML still references.",
            "בדיוק. שלושה באגים מצטברים: סדר העלאה שגוי, ‏404 שאפשר לשמור ב-cache, ו-'aws s3 sync --delete' שמחק את ה-bundle שה-HTML הישן מה-cache עדיין מצביע עליו."),
          c("Conclude S3 is having an outage", "להסיק שיש תקלה ב-S3", "lose", -15,
            "S3 returns the file fine. You open a ticket with AWS and wait while users see blank pages.",
            "S3 מחזיר את הקובץ בלי בעיה. אתה פותח ticket מול AWS ומחכה בזמן שהמשתמשים רואים דפים לבנים.")
        ]
      },
      s3: {
        text: t("How do you fix it now, without making things worse?",
                "איך מתקנים עכשיו, בלי להחמיר?"),
        choices: [
          c("Re-upload the previous bundle files (keep both versions), fix the origin headers (HTML: no-cache; 404s: max-age=10), then invalidate /, /index.html and /static/main.4e1a9c.js", "להעלות מחדש את קבצי ה-bundle הקודם (לשמור את שתי הגרסאות), לתקן את ה-headers ב-origin (‏HTML: ‏no-cache; ‏404: ‏max-age=10), ואז invalidation ל-/, ל-/index.html ול-/static/main.4e1a9c.js", "s4", 20,
            "Correct order: make every URL that any cached HTML can reference valid again, fix the policy at the origin so it can't recur, then invalidate a handful of paths. Browsers holding old HTML for a day now load the restored old bundle and work.",
            "הסדר הנכון: להחזיר לתוקף כל URL שאיזשהו HTML ב-cache יכול להצביע עליו, לתקן את המדיניות ב-origin כדי שזה לא יחזור, ואז invalidation לכמה paths בודדים. דפדפנים שמחזיקים HTML ישן ליום טוענים עכשיו את ה-bundle הישן ששוחזר, והכול עובד."),
          c("Invalidate /* and tell users to hard-refresh", "invalidation ל-/* ולהגיד למשתמשים לעשות hard refresh", "s4b", 0,
            "The edge recovers, but browsers that cached the HTML with max-age=86400 still request the deleted old bundle - and CDN purges never reach browser caches.",
            "ה-edge מתאושש, אבל דפדפנים ששמרו את ה-HTML עם max-age=86400 עדיין מבקשים את ה-bundle הישן שנמחק - ו-purge ב-CDN אף פעם לא מגיע ל-caches של דפדפנים.")
        ]
      },
      s4b: {
        text: t("Errors drop to 6% and stay there: the users stuck with yesterday's HTML. Support is drowning.",
                "השגיאות יורדות ל-6% ונשארות שם: אלה המשתמשים שתקועים עם ה-HTML של אתמול. התמיכה טובעת."),
        choices: [
          c("Restore the old bundle files to S3 so old HTML works too", "לשחזר את קבצי ה-bundle הישנים ל-S3 כדי שגם HTML ישן יעבוד", "s4", 10,
            "That's the real fix for browser caches: keep previous asset versions available.",
            "זה התיקון האמיתי ל-caches של דפדפנים: לשמור את גרסאות ה-assets הקודמות זמינות.")
        ]
      },
      s4: {
        text: t("16:48. JS errors back to 0.3%. Then a new P1: 'I see someone else's name and cart items'. The same deploy's 'CDN performance' change added a cache behavior for /api/*.",
                "16:48. שגיאות ה-JS חזרו ל-0.3%. ואז P1 חדש: 'אני רואה שם ופריטים בעגלה של מישהו אחר'. אותו שינוי 'ביצועי CDN' מה-deploy הוסיף cache behavior עבור /api/*."),
        data: "$ curl -s -D - https://shop.example.com/api/me -H 'Cookie: sid=AAA' | grep -i -E 'x-cache|age|cache-control|^\\{'\nx-cache: Hit from cloudfront\nage: 37\ncache-control: max-age=0          # origin header, but the new behavior uses CachingOptimized (min TTL override)\n{\"user\":\"dana.levi\",\"cart\":3}\n\n$ curl -s https://shop.example.com/api/me -H 'Cookie: sid=BBB'\n{\"user\":\"dana.levi\",\"cart\":3}     # different session, SAME body",
        choices: [
          c("Immediately switch /api/* to the CachingDisabled policy, invalidate /api/*, make the origin send 'private, no-store' on authenticated endpoints, and start a privacy incident", "מיד להעביר את /api/* ל-policy של CachingDisabled, לעשות invalidation ל-/api/*, לגרום ל-origin לשלוח 'private, no-store' ב-endpoints מאומתים, ולפתוח אירוע פרטיות", "s5", 20,
            "Correct: stop the leak first, flush what's cached, add defense in depth at the origin, and treat it as a data exposure (logs to scope who saw what).",
            "נכון: קודם עוצרים את הדליפה, מנקים את מה שנשמר, מוסיפים defense in depth ב-origin, ומתייחסים לזה כחשיפת מידע (‏logs כדי להבין מי ראה מה)."),
          c("Add the session cookie to the cache key so each user gets their own copy", "להוסיף את ה-cookie של ה-session ל-cache key כדי שכל משתמש יקבל עותק משלו", "s5", 0,
            "It stops the cross-user leak, but caching per-user API responses at the edge is pointless (≈0% hit ratio) and fragile - one forgotten header and it leaks again.",
            "זה עוצר את הדליפה בין משתמשים, אבל caching של תשובות API אישיות ב-edge חסר טעם (‏hit ratio של בערך 0%) ושביר - header אחד שנשכח וזה דולף שוב."),
          c("Wait for the TTL to expire - it's only a few minutes", "לחכות שה-TTL יפוג - זה רק כמה דקות", "lose", -20,
            "Every new cache fill stores another user's personal data and serves it to everyone. Waiting is choosing to keep leaking.",
            "כל מילוי חדש של ה-cache שומר מידע אישי של משתמש אחר ומגיש אותו לכולם. לחכות זה לבחור להמשיך לדלוף.")
        ]
      },
      s5: {
        text: t("17:05. Leak stopped, site healthy. Postmortem time: which action items prevent a repeat?",
                "17:05. הדליפה נעצרה, האתר בריא. זמן ל-postmortem: אילו action items ימנעו חזרה?"),
        choices: [
          c("Deploy assets first and HTML last; keep N previous asset versions (no sync --delete); HTML no-cache; short TTL on 4xx; /api private/no-store; CDN config in IaC with a pre-prod header test", "להעלות assets קודם ו-HTML אחרון; לשמור N גרסאות assets קודמות (בלי sync --delete); ‏HTML עם no-cache; ‏TTL קצר ל-4xx; ‏/api עם private ו-no-store; קונפיגורציית ה-CDN ב-IaC עם בדיקת headers ב-pre-prod", "win", 20,
            "Each item kills one link of today's failure chain, and the header test catches the next 'performance' change before production.",
            "כל פריט מנתק חוליה אחת בשרשרת הכשל של היום, ובדיקת ה-headers תתפוס את שינוי ה-'ביצועים' הבא לפני פרודקשן."),
          c("Ban CDN changes and purge /* after every deploy", "לאסור שינויים ב-CDN ולעשות purge ל-/* אחרי כל deploy", "lose", -10,
            "Purging everything adds an origin stampede to every deploy and fixes none of the root causes (upload order, deleted assets, cacheable personal data).",
            "purge להכול מוסיף הסתערות על ה-origin לכל deploy ולא מתקן אף אחד מהגורמים (סדר העלאה, assets שנמחקו, מידע אישי שאפשר לשמור ב-cache).")
        ]
      },
      win: {
        text: t("Resolved in 45 minutes with a clean postmortem. You diagnosed from headers, restored every referenced asset, fixed policy at the origin, stopped a privacy leak fast, and turned it into deploy-order and CDN-config guardrails.",
                "נפתר תוך 45 דקות עם postmortem נקי. אבחנת לפי ה-headers, שחזרת כל asset שיש אליו הפניה, תיקנת את המדיניות ב-origin, עצרת דליפת פרטיות מהר, והפכת את זה ל-guardrails של סדר deploy וקונפיגורציית CDN."),
        end: "win"
      },
      lose: {
        text: t("The incident drags on: users keep seeing blank pages or other people's data, and the root causes (upload order, deleted assets, cacheable personal responses) are still there for the next deploy.",
                "התקלה נמשכת: משתמשים ממשיכים לראות דפים לבנים או מידע של אנשים אחרים, והגורמים (סדר העלאה, assets שנמחקו, תשובות אישיות שאפשר לשמור ב-cache) עדיין שם ל-deploy הבא."),
        end: "lose"
      }
    },
    lessons: ["net-http-caching", "net-proxies-cdn", "rel-deployments", "arch-caching"]
  });
})();
