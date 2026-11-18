window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Infra metal: Layer 2 switching and data centers / bare metal
   ========================================================================= */

/* ------------------------------------------------------------------ L2 */
INFRA.lessons.push({
  id: "net-l2-switching",
  track: "networking",
  order: 60,
  icon: "🔀",
  level: 2,
  minutes: 16,
  title: { en: "Layer 2: Switches, VLANs & Bonding", he: "Layer 2: switches, VLANs ו-bonding" },
  tldr: {
    en: "A switch learns which MAC lives behind which port and floods everything it doesn't know; VLANs cut one physical network into separate broadcast domains, STP keeps redundant cables from turning into an infinite broadcast loop, and bonding/LACP turns two NICs into one link that survives a cable or switch failure.",
    he: "switch לומד איזה MAC יושב מאחורי איזה port ומציף כל מה שהוא לא מכיר; VLANs חותכים רשת פיזית אחת לכמה broadcast domains נפרדים, STP מונע מכבלים כפולים להפוך ללולאת broadcast אינסופית, ו-bonding עם LACP הופך שני כרטיסי רשת ל-link אחד ששורד נפילה של כבל או של switch."
  },
  analogy: {
    en: "A switch is a mail clerk in an office building who has never seen a directory. When a letter arrives from Dana on floor 3, he writes down 'Dana = floor 3'. When a letter arrives for someone he has not met yet, he photocopies it and slips it under every door. VLANs are separate companies renting floors in the same building: the clerk never carries mail between them. A network loop is two clerks forwarding photocopies to each other forever, until the mailroom is buried in paper and nobody gets anything.",
    he: "switch הוא פקיד דואר בבניין משרדים שמעולם לא ראה ספר טלפונים. כשמגיע מכתב מדנה בקומה 3, הוא רושם 'דנה = קומה 3'. כשמגיע מכתב למישהו שהוא עוד לא פגש, הוא מצלם אותו ומחליק עותק מתחת לכל דלת. VLANs הם חברות נפרדות ששוכרות קומות באותו בניין: הפקיד אף פעם לא מעביר דואר ביניהן. לולאה ברשת היא שני פקידים שמעבירים צילומים אחד לשני בלי סוף, עד שחדר הדואר קבור בנייר ואף אחד לא מקבל כלום."
  },
  sections: [
    {
      h: { en: "Frames, MAC addresses and how a switch learns", he: "Frames, כתובות MAC ואיך switch לומד" },
      body: {
        en: `<p>Layer 2 moves <strong>Ethernet frames</strong> inside one segment. Everything above (IP, TCP, HTTP) rides inside the payload:</p>
<pre>| dst MAC 6B | src MAC 6B | [802.1Q tag 4B] | EtherType 2B | payload 46-1500B | FCS 4B |
                            TPID 0x8100 + PCP(3b) DEI(1b) VID(12b)       0x0800=IPv4 0x0806=ARP 0x86DD=IPv6</pre>
<p>A frame is 64 to 1518 bytes (1522 with a VLAN tag), plus 8 bytes preamble and a 12-byte inter-frame gap on the wire. A <strong>MAC address</strong> is 48 bits: the first 24 are the vendor's OUI (<code>3c:fd:fe</code> = Intel). Two bits in the first byte matter: the lowest bit means multicast (so <code>01:00:5e:...</code> is IPv4 multicast and <code>ff:ff:ff:ff:ff:ff</code> is broadcast), the next one means "locally administered" (<code>02:42:...</code> is a Docker-generated MAC).</p>
<p>A switch builds its <strong>MAC table</strong> (CAM table) by watching <em>source</em> addresses:</p>
<ol>
<li>Frame arrives on port 7 from <code>aa:aa</code> → record <code>aa:aa → port 7, VLAN 20</code> (aging timer, default 300 s).</li>
<li>Look up the <em>destination</em>. Known → send out that one port only.</li>
<li>Unknown unicast, broadcast or (without IGMP snooping) multicast → <strong>flood</strong> to every port in the VLAN except the one it came in on.</li>
</ol>
<pre>sw1# show mac address-table vlan 20
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  20    3cfd.feaa.bb01    DYNAMIC     Te1/0/1
  20    0050.56a1.2b3c    DYNAMIC     Gi1/0/12
  20    001c.7311.2233    STATIC      CPU</pre>
<p>A table holds a fixed number of entries (16K on a cheap access switch, 256K+ on a datacenter leaf). If someone fills it with fake source MACs (<code>macof</code> sends ~150,000 per minute), the switch floods everything like a hub and the attacker sees all traffic. <strong>Port security</strong> (max N MACs per port) stops that.</p>
<blockquote>💡 Real world: a switch is "transparent" - hosts never talk to it. That's why a dead MAC entry or a host that moved (VM live migration) heals only when the host sends a frame. Hypervisors send a gratuitous ARP or RARP right after migration for exactly that reason.</blockquote>`,
        he: `<p>Layer 2 מעביר <strong>Ethernet frames</strong> בתוך segment אחד. כל מה שמעל (IP, TCP, HTTP) נוסע בתוך ה-payload:</p>
<pre>| dst MAC 6B | src MAC 6B | [802.1Q tag 4B] | EtherType 2B | payload 46-1500B | FCS 4B |
                            TPID 0x8100 + PCP(3b) DEI(1b) VID(12b)       0x0800=IPv4 0x0806=ARP 0x86DD=IPv6</pre>
<p>frame הוא בין 64 ל-1518 בתים (1522 עם VLAN tag), ועוד 8 בתים של preamble ו-12 בתים של inter-frame gap על החוט. כתובת <strong>MAC</strong> היא 48 ביט: 24 הראשונים הם ה-OUI של היצרן (<code>3c:fd:fe</code> = Intel). שני ביטים בבית הראשון חשובים: הביט הנמוך אומר multicast (לכן <code>01:00:5e:...</code> זה IPv4 multicast ו-<code>ff:ff:ff:ff:ff:ff</code> זה broadcast), והביט שאחריו אומר "מנוהל מקומית" (<code>02:42:...</code> זה MAC ש-Docker ייצר).</p>
<p>ה-switch בונה את <strong>טבלת ה-MAC</strong> (CAM table) מתוך כתובות ה-<em>מקור</em>:</p>
<ol>
<li>frame מגיע ל-port 7 מ-<code>aa:aa</code> ← רושמים <code>aa:aa → port 7, VLAN 20</code> (עם aging timer, ברירת מחדל 300 שניות).</li>
<li>מחפשים את כתובת ה-<em>יעד</em>. מוכרת ← שולחים רק ל-port הזה.</li>
<li>unicast לא מוכר, broadcast או multicast (בלי IGMP snooping) ← <strong>flood</strong> לכל ה-ports ב-VLAN חוץ מזה שממנו הגיע.</li>
</ol>
<pre>sw1# show mac address-table vlan 20
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  20    3cfd.feaa.bb01    DYNAMIC     Te1/0/1
  20    0050.56a1.2b3c    DYNAMIC     Gi1/0/12
  20    001c.7311.2233    STATIC      CPU</pre>
<p>לטבלה יש מספר רשומות קבוע (16K ב-access switch זול, 256K ומעלה ב-leaf של datacenter). אם מישהו ממלא אותה ב-MACs מזויפים (<code>macof</code> שולח כ-150,000 בדקה), ה-switch מציף הכל כמו hub והתוקף רואה את כל התעבורה. <strong>Port security</strong> (מקסימום N כתובות MAC ל-port) עוצר את זה.</p>
<blockquote>💡 מהשטח: switch הוא "שקוף" - המחשבים לא מדברים איתו אף פעם. לכן רשומת MAC מתה או שרת שזז (live migration של VM) מתעדכנים רק כשהשרת שולח frame. בדיוק בגלל זה hypervisors שולחים gratuitous ARP או RARP מיד אחרי migration.</blockquote>`
      }
    },
    {
      h: { en: "ARP, gratuitous ARP and broadcast domains", he: "ARP, gratuitous ARP ו-broadcast domains" },
      body: {
        en: `<p>IP knows "send to 10.0.0.1", Ethernet needs a MAC. <strong>ARP</strong> bridges them: a broadcast <em>"who-has 10.0.0.1? tell 10.0.0.23"</em>, answered by a unicast reply. Every host in the VLAN receives and processes every ARP request - that set of hosts is the <strong>broadcast domain</strong>, and it's the real reason big flat networks hurt.</p>
<pre>$ ip neigh
10.0.0.1 dev eth0 lladdr 52:54:00:12:34:56 REACHABLE
10.0.0.44 dev eth0 lladdr 3c:fd:fe:aa:bb:07 STALE
10.0.0.99 dev eth0  FAILED

$ arp -n
Address        HWtype  HWaddress           Flags Mask   Iface
10.0.0.1       ether   52:54:00:12:34:56   C            eth0</pre>
<p>States: <code>REACHABLE</code> (confirmed in the last ~30 s, <code>base_reachable_time_ms</code>), <code>STALE</code> (still used, re-verified on next send), <code>FAILED</code>/<code>INCOMPLETE</code> (nobody answered - the host is down, in another VLAN, or a firewall eats ARP). Linux keeps at most <code>gc_thresh3</code> = 1024 entries by default; a big flat network or a Kubernetes node talking to thousands of pods logs <code>neighbour: arp_cache: neighbor table overflow!</code> - raise <code>net.ipv4.neigh.default.gc_thresh1/2/3</code>.</p>
<p><strong>Gratuitous ARP (GARP)</strong> is an unsolicited announcement "10.0.0.100 is at <em>my</em> MAC". It's how a virtual IP moves: keepalived (VRRP), Pacemaker, MetalLB L2 mode and VM migration all send GARP so switches update their MAC table and neighbors update their ARP cache in milliseconds:</p>
<pre>arping -U -c 3 -I eth0 10.0.0.100      # unsolicited (gratuitous) ARP for a VIP</pre>
<p><strong>ARP storms</strong>: a loop, a misconfigured scanner, or 2,000 hosts rebooting at once after a power event all re-ARP together. Switch CPUs (which handle ARP for their own SVIs in software) spike, and control-plane protocols start timing out. Mitigations: smaller VLANs (/24 per rack, not /16 per DC), <strong>CoPP</strong> (control-plane policing) and storm-control.</p>
<blockquote>⚠️ Production tip: a classic asymmetric-routing trap is the router's ARP timeout (4 hours on Cisco) being much longer than the switch's MAC aging (5 minutes). The router keeps sending to a MAC the switch forgot, so every one of those frames is <em>unknown unicast</em> and flooded to the whole VLAN. Align the timers.</blockquote>`,
        he: `<p>IP יודע "תשלח ל-10.0.0.1", אבל Ethernet צריך MAC. <strong>ARP</strong> מגשר ביניהם: broadcast של <em>"who-has 10.0.0.1? tell 10.0.0.23"</em>, ותשובה ב-unicast. כל מחשב ב-VLAN מקבל ומעבד כל בקשת ARP - קבוצת המחשבים הזאת היא ה-<strong>broadcast domain</strong>, וזו הסיבה האמיתית שרשתות שטוחות וגדולות כואבות.</p>
<pre>$ ip neigh
10.0.0.1 dev eth0 lladdr 52:54:00:12:34:56 REACHABLE
10.0.0.44 dev eth0 lladdr 3c:fd:fe:aa:bb:07 STALE
10.0.0.99 dev eth0  FAILED

$ arp -n
Address        HWtype  HWaddress           Flags Mask   Iface
10.0.0.1       ether   52:54:00:12:34:56   C            eth0</pre>
<p>המצבים: <code>REACHABLE</code> (אומת ב-30 השניות האחרונות בערך, <code>base_reachable_time_ms</code>), <code>STALE</code> (עדיין בשימוש, יאומת בשליחה הבאה), <code>FAILED</code> או <code>INCOMPLETE</code> (אף אחד לא ענה - המחשב למטה, ב-VLAN אחר, או ש-firewall בולע ARP). Linux מחזיק כברירת מחדל עד <code>gc_thresh3</code> = 1024 רשומות; רשת שטוחה גדולה או node של Kubernetes שמדבר עם אלפי pods כותבים ללוג <code>neighbour: arp_cache: neighbor table overflow!</code> - תעלה את <code>net.ipv4.neigh.default.gc_thresh1/2/3</code>.</p>
<p><strong>Gratuitous ARP (GARP)</strong> הוא הכרזה שאף אחד לא ביקש: "10.0.0.100 נמצא ב-MAC <em>שלי</em>". ככה virtual IP זז: keepalived (VRRP), Pacemaker, MetalLB במצב L2 ו-migration של VM שולחים כולם GARP, כדי שה-switches יעדכנו את טבלת ה-MAC והשכנים יעדכנו את ה-ARP cache תוך מילישניות:</p>
<pre>arping -U -c 3 -I eth0 10.0.0.100      # unsolicited (gratuitous) ARP for a VIP</pre>
<p><strong>ARP storms</strong>: לולאה, סורק שהוגדר לא נכון, או 2,000 שרתים שעולים יחד אחרי הפסקת חשמל - כולם עושים ARP באותו רגע. ה-CPU של ה-switch (שמטפל ב-ARP של ה-SVIs שלו בתוכנה) קופץ, ופרוטוקולי control-plane מתחילים לעשות timeout. מה עוזר: VLANs קטנים יותר (/24 ל-rack, לא /16 לכל ה-DC), <strong>CoPP</strong> (control-plane policing) ו-storm-control.</p>
<blockquote>⚠️ טיפ לפרודקשן: מלכודת קלאסית של asymmetric routing היא ARP timeout של ה-router (4 שעות ב-Cisco) שארוך בהרבה מה-MAC aging של ה-switch (5 דקות). ה-router ממשיך לשלוח ל-MAC שה-switch כבר שכח, אז כל frame כזה הוא <em>unknown unicast</em> ומוצף לכל ה-VLAN. תיישר את הטיימרים.</blockquote>`
      }
    },
    {
      h: { en: "VLANs: access, trunk and the native VLAN", he: "VLANs: access, trunk וה-native VLAN" },
      body: {
        en: `<p>A <strong>VLAN</strong> makes one physical switch behave like several separate ones. The 12-bit VID in the 802.1Q tag gives 4094 usable VLANs (0 and 4095 are reserved). Traffic between VLANs must go through a router or L3 switch - and therefore through ACLs/firewalls.</p>
<table>
<tr><th>Port type</th><th>Frames on the wire</th><th>Used for</th></tr>
<tr><td><strong>Access</strong></td><td>Untagged; the switch adds/strips the tag internally</td><td>One server NIC, a printer, a laptop</td></tr>
<tr><td><strong>Trunk</strong></td><td>Tagged with 802.1Q, many VLANs on one cable</td><td>Switch-to-switch, hypervisors, k8s nodes with VLAN subinterfaces</td></tr>
<tr><td><strong>Native VLAN</strong> (on a trunk)</td><td>The one VLAN sent untagged (default VLAN 1)</td><td>Legacy; should be an unused "black hole" VLAN</td></tr>
</table>
<pre>interface GigabitEthernet1/0/10
 description web-07 eth0
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
 spanning-tree bpduguard enable
!
interface TenGigabitEthernet1/1/1
 description uplink to hv-03 (KVM)
 switchport mode trunk
 switchport trunk allowed vlan 20,30,40
 switchport trunk native vlan 999</pre>
<p>On the Linux side of a trunk, each VLAN is a subinterface:</p>
<pre>ip link add link eth0 name eth0.30 type vlan id 30
ip addr add 10.30.0.5/24 dev eth0.30 &amp;&amp; ip link set eth0.30 up
ip -d link show eth0.30      # ... vlan protocol 802.1Q id 30 &lt;REORDER_HDR&gt;</pre>
<blockquote>⚠️ Production tip: a <strong>native VLAN mismatch</strong> (99 on one side, 1 on the other) silently bridges two VLANs together. And with native VLAN 1 an attacker can <strong>double-tag</strong> a frame (outer tag 1, inner tag 30): the first switch strips the outer tag and forwards it into VLAN 30. Always set an unused native VLAN, prune <code>allowed vlan</code> to what's needed, and disable DTP (<code>switchport nonegotiate</code>).</blockquote>`,
        he: `<p><strong>VLAN</strong> גורם ל-switch פיזי אחד להתנהג כמו כמה switches נפרדים. ה-VID של 12 ביט ב-tag של 802.1Q נותן 4094 VLANs שמישים (0 ו-4095 שמורים). תעבורה בין VLANs חייבת לעבור דרך router או L3 switch - ולכן גם דרך ACLs או firewalls.</p>
<table>
<tr><th>סוג port</th><th>frames על החוט</th><th>שימוש</th></tr>
<tr><td><strong>Access</strong></td><td>בלי tag; ה-switch מוסיף ומוריד את ה-tag בפנים</td><td>כרטיס רשת של שרת, מדפסת, לפטופ</td></tr>
<tr><td><strong>Trunk</strong></td><td>עם tag של 802.1Q, הרבה VLANs על כבל אחד</td><td>switch ל-switch, hypervisors, nodes של k8s עם VLAN subinterfaces</td></tr>
<tr><td><strong>Native VLAN</strong> (על trunk)</td><td>ה-VLAN היחיד שנשלח בלי tag (ברירת מחדל VLAN 1)</td><td>legacy; צריך להיות VLAN "חור שחור" שלא בשימוש</td></tr>
</table>
<pre>interface GigabitEthernet1/0/10
 description web-07 eth0
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
 spanning-tree bpduguard enable
!
interface TenGigabitEthernet1/1/1
 description uplink to hv-03 (KVM)
 switchport mode trunk
 switchport trunk allowed vlan 20,30,40
 switchport trunk native vlan 999</pre>
<p>בצד ה-Linux של trunk, כל VLAN הוא subinterface:</p>
<pre>ip link add link eth0 name eth0.30 type vlan id 30
ip addr add 10.30.0.5/24 dev eth0.30 &amp;&amp; ip link set eth0.30 up
ip -d link show eth0.30      # ... vlan protocol 802.1Q id 30 &lt;REORDER_HDR&gt;</pre>
<blockquote>⚠️ טיפ לפרודקשן: <strong>native VLAN mismatch</strong> (99 בצד אחד, 1 בצד השני) מגשר בשקט בין שני VLANs. ועם native VLAN 1 תוקף יכול לעשות <strong>double-tag</strong> ל-frame (tag חיצוני 1, פנימי 30): ה-switch הראשון מוריד את החיצוני ומעביר אותו ישר ל-VLAN 30. תמיד תגדיר native VLAN שלא בשימוש, תצמצם את <code>allowed vlan</code> רק למה שצריך, ותכבה DTP (<code>switchport nonegotiate</code>).</blockquote>`
      }
    },
    {
      h: { en: "Loops and spanning tree: why one cable can kill a building", he: "לולאות ו-spanning tree: למה כבל אחד יכול להפיל בניין" },
      body: {
        en: `<p>The Ethernet header has <strong>no TTL</strong>. Connect two switches with two cables and one broadcast goes around forever - and every switch floods it out every other port, so copies <em>multiply</em>. Within seconds links hit 100%, MAC tables flap (the same source MAC appears on two ports thousands of times per second), switch CPUs peg at 100%, and even the management plane is unreachable. That's a <strong>broadcast storm</strong>.</p>
<p><strong>Spanning Tree Protocol</strong> prevents it by logically blocking redundant links:</p>
<ol>
<li>Switches exchange <strong>BPDUs</strong> (every 2 s) and elect a <strong>root bridge</strong>: lowest bridge ID = priority (default 32768) + MAC. Leave it to chance and the oldest switch in the closet becomes root - set it explicitly (<code>spanning-tree vlan 1-4094 root primary</code> / priority 4096 on the core).</li>
<li>Every other switch picks its cheapest path to root (cost 2 for 10G, 4 for 1G in short mode) = its <strong>root port</strong>.</li>
<li>Each segment gets one <strong>designated port</strong>; everything else is <strong>blocked</strong> (still listening to BPDUs, ready to take over).</li>
</ol>
<table>
<tr><th>Flavor</th><th>Convergence</th><th>Notes</th></tr>
<tr><td>STP 802.1D</td><td>30-50 s (max age 20 s + 2 × forward delay 15 s)</td><td>Why old networks "freeze for 50 s" after a link drop</td></tr>
<tr><td>RSTP 802.1w</td><td>Sub-second to ~6 s</td><td>Proposal/agreement handshake; the sane default</td></tr>
<tr><td>MSTP 802.1s / Rapid-PVST+</td><td>Like RSTP</td><td>Different trees per VLAN group, so both uplinks carry traffic</td></tr>
</table>
<p>Edge-port protections every access switch should have:</p>
<ul>
<li><strong>PortFast</strong> (edge port): forward immediately instead of waiting 30 s - servers get DHCP on time.</li>
<li><strong>BPDU guard</strong>: an edge port that <em>receives</em> a BPDU (meaning someone plugged in a switch or a looped cable) goes to <code>err-disabled</code> instantly. This is the single most important loop protection.</li>
<li><strong>Root guard</strong> on ports facing downstream switches; <strong>storm-control</strong> (drop broadcast above e.g. 1% of link rate).</li>
<li>Never <code>spanning-tree bpdufilter</code> on access ports "to stop log noise" - it disables STP on that port.</li>
</ul>
<blockquote>💡 Real world: modern datacenters avoid STP almost entirely: the fabric is routed (L3) down to the top-of-rack switch, and redundancy comes from ECMP and MLAG instead of blocked links. STP survives at the edge, in offices, and in legacy L2 DCs - exactly where a stray cable shows up.</blockquote>`,
        he: `<p>ב-header של Ethernet <strong>אין TTL</strong>. תחבר שני switches עם שני כבלים ו-broadcast אחד מסתובב לנצח - וכל switch מציף אותו לכל שאר ה-ports, אז העותקים <em>מתרבים</em>. תוך שניות ה-links ב-100%, טבלאות ה-MAC מקפצות (אותה כתובת מקור מופיעה על שני ports אלפי פעמים בשנייה), ה-CPU של ה-switches ב-100%, ואפילו ה-management לא נגיש. זה <strong>broadcast storm</strong>.</p>
<p><strong>Spanning Tree Protocol</strong> מונע את זה על ידי חסימה לוגית של links כפולים:</p>
<ol>
<li>ה-switches מחליפים <strong>BPDUs</strong> (כל 2 שניות) ובוחרים <strong>root bridge</strong>: ה-bridge ID הנמוך ביותר = priority (ברירת מחדל 32768) + MAC. אם תשאיר את זה למזל, ה-switch הכי ישן בארון יהפוך ל-root - תגדיר את זה במפורש (<code>spanning-tree vlan 1-4094 root primary</code> או priority 4096 על ה-core).</li>
<li>כל switch אחר בוחר את הדרך הכי זולה ל-root (cost 2 ל-10G, 4 ל-1G במצב short) = ה-<strong>root port</strong> שלו.</li>
<li>כל segment מקבל <strong>designated port</strong> אחד; כל השאר <strong>חסומים</strong> (עדיין מקשיבים ל-BPDUs, מוכנים להחליף).</li>
</ol>
<table>
<tr><th>גרסה</th><th>זמן התכנסות</th><th>הערות</th></tr>
<tr><td>STP 802.1D</td><td>30-50 שניות (max age של 20 + פעמיים forward delay של 15)</td><td>זו הסיבה שרשתות ישנות "קופאות ל-50 שניות" אחרי נפילת link</td></tr>
<tr><td>RSTP 802.1w</td><td>פחות משנייה עד כ-6 שניות</td><td>handshake של proposal ו-agreement; ברירת המחדל השפויה</td></tr>
<tr><td>MSTP 802.1s או Rapid-PVST+</td><td>כמו RSTP</td><td>עץ שונה לכל קבוצת VLANs, כך ששני ה-uplinks נושאים תעבורה</td></tr>
</table>
<p>הגנות שכל access switch צריך על edge ports:</p>
<ul>
<li><strong>PortFast</strong> (edge port): להעביר תעבורה מיד במקום לחכות 30 שניות - השרתים מקבלים DHCP בזמן.</li>
<li><strong>BPDU guard</strong>: edge port ש<em>מקבל</em> BPDU (כלומר מישהו חיבר switch או כבל בלולאה) עובר מיד ל-<code>err-disabled</code>. זו ההגנה הכי חשובה מלולאות.</li>
<li><strong>Root guard</strong> על ports שפונים ל-switches מתחת; <strong>storm-control</strong> (לזרוק broadcast מעל, למשל, 1% מקצב ה-link).</li>
<li>אף פעם לא <code>spanning-tree bpdufilter</code> על access ports "כדי שהלוגים ישתקו" - זה מכבה STP על ה-port.</li>
</ul>
<blockquote>💡 מהשטח: datacenters מודרניים כמעט לא משתמשים ב-STP: ה-fabric עושה routing (L3) עד ה-top-of-rack switch, והשרידות מגיעה מ-ECMP ו-MLAG במקום מ-links חסומים. STP שורד בקצוות, במשרדים וב-DCs ישנים של L2 - בדיוק איפה שכבל תועה מופיע.</blockquote>`
      }
    },
    {
      h: { en: "Bonding, LACP and MTU on Linux", he: "Bonding, LACP ו-MTU ב-Linux" },
      body: {
        en: `<p><strong>Bonding</strong> joins NICs into one logical interface (<code>bond0</code>) for redundancy and/or bandwidth. The mode decides whether the switch must cooperate:</p>
<table>
<tr><th>Mode</th><th>Name</th><th>Switch config?</th><th>Behavior</th></tr>
<tr><td>0</td><td>balance-rr</td><td>Yes (static LAG)</td><td>Round-robin per packet; reorders TCP - avoid</td></tr>
<tr><td>1</td><td>active-backup</td><td>No</td><td>One link active, failover on link loss; works across two unrelated switches</td></tr>
<tr><td>2</td><td>balance-xor</td><td>Yes (static LAG)</td><td>Hash picks the link</td></tr>
<tr><td>3</td><td>broadcast</td><td>Yes (static LAG)</td><td>Every frame on every link; niche</td></tr>
<tr><td>4</td><td>802.3ad (LACP)</td><td>Yes (LACP)</td><td>Negotiated, hash-balanced, detects misconnects - the datacenter default</td></tr>
<tr><td>5</td><td>balance-tlb</td><td>No</td><td>Outbound balanced, inbound on one link</td></tr>
<tr><td>6</td><td>balance-alb</td><td>No</td><td>tlb + inbound balancing by rewriting ARP replies</td></tr>
</table>
<p><strong>LACP</strong> (802.3ad / 802.1AX) sends LACPDUs every 1 s (<code>lacp_rate fast</code>) or 30 s (slow); 3 missed = link removed, so fast mode detects a dead peer in 3 s. A hash (<code>xmit_hash_policy layer3+4</code>: IPs + ports) pins each flow to one member, so <strong>a single TCP stream never goes faster than one link</strong>: 2 × 25G = 50G aggregate, 25G per flow. To survive a whole switch dying, the two ports go to two switches running <strong>MLAG</strong> (Arista MLAG, Cisco vPC, Juniper MC-LAG), which pretend to be one LACP partner.</p>
<pre>$ cat /proc/net/bonding/bond0
Bonding Mode: IEEE 802.3ad Dynamic link aggregation
Transmit Hash Policy: layer3+4 (1)
MII Status: up
MII Polling Interval (ms): 100
802.3ad info
LACP active: on
LACP rate: fast
Active Aggregator Info:
	Aggregator ID: 1
	Number of ports: 2
	Partner Mac Address: 00:1c:73:11:22:33

Slave Interface: ens1f0
MII Status: up
Speed: 25000 Mbps
Link Failure Count: 0
Aggregator ID: 1

Slave Interface: ens1f1
MII Status: up
Speed: 25000 Mbps
Link Failure Count: 3
Aggregator ID: 1</pre>
<p>Red flags: <code>Partner Mac Address: 00:00:00:00:00:00</code> (switch isn't speaking LACP), members with <em>different</em> Aggregator IDs (cabled to two switches without MLAG), a climbing <code>Link Failure Count</code> (flaky optic or cable). <strong>Teaming</strong> (<code>teamd</code>) was a userspace alternative; RHEL 9 deprecated it - use bonding.</p>
<p><strong>MTU</strong>: standard 1500; <strong>jumbo frames</strong> 9000 on hosts (switches usually set 9216 to leave room for tags and encapsulation). Fewer packets per GB = less CPU for storage and replication traffic. The catch: <em>every</em> hop in the L2 domain must agree, otherwise big frames are silently dropped. AWS uses 9001 inside a VPC but 1500 over the Internet gateway and VPN; GCP defaults to 1460 (configurable up to 8896). Test end to end with DF set: <code>ping -M do -s 8972 10.0.0.2</code> (9000 - 20 IP - 8 ICMP).</p>`,
        he: `<p><strong>Bonding</strong> מאחד כרטיסי רשת ל-interface לוגי אחד (<code>bond0</code>) בשביל שרידות ו/או רוחב פס. ה-mode קובע אם ה-switch צריך לשתף פעולה:</p>
<table>
<tr><th>Mode</th><th>שם</th><th>הגדרה ב-switch?</th><th>התנהגות</th></tr>
<tr><td>0</td><td>balance-rr</td><td>כן (static LAG)</td><td>round-robin לכל packet; משבש סדר ב-TCP - להימנע</td></tr>
<tr><td>1</td><td>active-backup</td><td>לא</td><td>link אחד פעיל, failover כשה-link נופל; עובד גם מול שני switches בלתי תלויים</td></tr>
<tr><td>2</td><td>balance-xor</td><td>כן (static LAG)</td><td>hash בוחר את ה-link</td></tr>
<tr><td>3</td><td>broadcast</td><td>כן (static LAG)</td><td>כל frame על כל link; נישה</td></tr>
<tr><td>4</td><td>802.3ad (LACP)</td><td>כן (LACP)</td><td>מנוהל במשא ומתן, מאוזן לפי hash, מזהה חיבור שגוי - ברירת המחדל ב-datacenter</td></tr>
<tr><td>5</td><td>balance-tlb</td><td>לא</td><td>יוצא מאוזן, נכנס על link אחד</td></tr>
<tr><td>6</td><td>balance-alb</td><td>לא</td><td>tlb ועוד איזון נכנס על ידי שכתוב תשובות ARP</td></tr>
</table>
<p><strong>LACP</strong> (802.3ad או 802.1AX) שולח LACPDUs כל שנייה (<code>lacp_rate fast</code>) או כל 30 שניות (slow); 3 שלא הגיעו = ה-link יוצא מה-bond, אז מצב fast מזהה צד שני מת תוך 3 שניות. hash (<code>xmit_hash_policy layer3+4</code>: IPs ו-ports) מצמיד כל flow לחבר אחד, ולכן <strong>stream בודד של TCP אף פעם לא מהיר מ-link אחד</strong>: פעמיים 25G = 50G במצטבר, 25G ל-flow. כדי לשרוד נפילה של switch שלם, שני ה-ports הולכים לשני switches שמריצים <strong>MLAG</strong> (Arista MLAG, Cisco vPC, Juniper MC-LAG) ומעמידים פנים שהם partner אחד של LACP.</p>
<pre>$ cat /proc/net/bonding/bond0
Bonding Mode: IEEE 802.3ad Dynamic link aggregation
Transmit Hash Policy: layer3+4 (1)
MII Status: up
MII Polling Interval (ms): 100
802.3ad info
LACP active: on
LACP rate: fast
Active Aggregator Info:
	Aggregator ID: 1
	Number of ports: 2
	Partner Mac Address: 00:1c:73:11:22:33

Slave Interface: ens1f0
MII Status: up
Speed: 25000 Mbps
Link Failure Count: 0
Aggregator ID: 1

Slave Interface: ens1f1
MII Status: up
Speed: 25000 Mbps
Link Failure Count: 3
Aggregator ID: 1</pre>
<p>סימני אזהרה: <code>Partner Mac Address: 00:00:00:00:00:00</code> (ה-switch לא מדבר LACP), חברים עם Aggregator IDs <em>שונים</em> (מחוברים לשני switches בלי MLAG), ו-<code>Link Failure Count</code> שעולה (optic או כבל לא יציב). <strong>Teaming</strong> (<code>teamd</code>) היה חלופה ב-userspace; ב-RHEL 9 הוא deprecated - תשתמש ב-bonding.</p>
<p><strong>MTU</strong>: הסטנדרט 1500; <strong>jumbo frames</strong> הם 9000 על השרתים (ב-switches בדרך כלל מגדירים 9216 כדי להשאיר מקום ל-tags ול-encapsulation). פחות packets לכל GB = פחות CPU לתעבורת storage ו-replication. המלכודת: <em>כל</em> hop ב-L2 domain חייב להסכים, אחרת frames גדולים נזרקים בשקט. ב-AWS יש 9001 בתוך VPC אבל 1500 דרך ה-Internet gateway וה-VPN; ב-GCP ברירת המחדל 1460 (אפשר עד 8896). תבדוק מקצה לקצה עם DF: <code>ping -M do -s 8972 10.0.0.2</code> (9000 פחות 20 של IP פחות 8 של ICMP).</p>`
      }
    },
    {
      h: { en: "Leaf-spine, VXLAN and how the cloud hides L2", he: "Leaf-spine, VXLAN ואיך הענן מסתיר את L2" },
      body: {
        en: `<p>The old <strong>three-tier</strong> design (access → aggregation → core) ran L2 everywhere and relied on STP, which blocked half the uplinks. Modern DCs use <strong>leaf-spine (Clos)</strong>: every top-of-rack <em>leaf</em> connects to every <em>spine</em>, leaves never connect to each other, and spines never connect to each other. Any server reaches any other in exactly leaf → spine → leaf, links are routed (often eBGP per RFC 7938, one ASN per leaf) and <strong>ECMP</strong> spreads flows over all spines. Lose a spine out of 4 and you lose 25% capacity, not connectivity.</p>
<p>Sizing a leaf: 48 × 25G down = 1.2 Tbps toward servers, 6 × 100G up = 600 Gbps toward spines → <strong>2:1 oversubscription</strong>. AI/storage fabrics aim for 1:1.</p>
<p>But apps still want L2 (VM mobility, "same subnet" assumptions), so we build L2 <em>on top of</em> the routed fabric with <strong>VXLAN</strong>: the original frame is wrapped in UDP (port 4789) by a <strong>VTEP</strong> (a leaf switch, or the Linux kernel on the host).</p>
<pre>| outer Eth 14 | outer IP 20 | UDP 8 (dst 4789) | VXLAN 8 (VNI 24 bit) | original Ethernet frame |
                    = 50 bytes overhead → inner MTU 1450 on a 1500 underlay</pre>
<p>The 24-bit <strong>VNI</strong> gives 16 million segments (vs 4094 VLANs). Learning remote MACs by flooding doesn't scale, so production uses <strong>BGP EVPN</strong> as a control plane: VTEPs advertise "MAC X / IP Y lives behind me" and answer ARP locally (ARP suppression). Kubernetes overlays (Flannel VXLAN on UDP 8472, Calico VXLAN, Cilium VXLAN/Geneve) are the same idea, with a Linux <code>vxlan</code> device per node.</p>
<p><strong>The cloud hides all of this.</strong> A VPC <em>looks</em> like L2 but isn't: the hypervisor (AWS Nitro, GCP Andromeda, Azure VFP) intercepts frames and delivers them by a mapping database.</p>
<ul>
<li>No real broadcast; ARP is answered by the virtual network itself, and you can't spoof it - <strong>gratuitous ARP for a VIP does nothing</strong>. keepalived in AWS needs a notify script that moves a secondary private IP or Elastic IP via the API, or updates a route table.</li>
<li>No multicast in most VPCs (AWS only via Transit Gateway multicast), so protocols that discover peers by multicast need unicast config.</li>
<li>Source/destination check drops packets not addressed to the instance - turn it off for NAT or router instances.</li>
<li>GCP historically gives each VM a /32 so <em>everything</em> goes via the virtual gateway.</li>
</ul>
<blockquote>💡 Real world: "it worked on-prem" failovers - Pacemaker VIPs, MetalLB in L2 mode, Oracle RAC, old clustering that uses multicast heartbeats - are among the first things that break in a lift-and-shift. Replace them with cloud load balancers or API-driven IP moves.</blockquote>`,
        he: `<p>התכנון הישן של <strong>שלוש שכבות</strong> (access ← aggregation ← core) הריץ L2 בכל מקום והסתמך על STP, שחסם חצי מה-uplinks. DCs מודרניים משתמשים ב-<strong>leaf-spine (Clos)</strong>: כל <em>leaf</em> (ה-top-of-rack) מחובר לכל <em>spine</em>, leafs לא מתחברים זה לזה, ו-spines לא מתחברים זה לזה. כל שרת מגיע לכל שרת אחר בדיוק דרך leaf ← spine ← leaf, ה-links עושים routing (הרבה פעמים eBGP לפי RFC 7938, ASN לכל leaf) ו-<strong>ECMP</strong> מפזר flows על כל ה-spines. איבדת spine אחד מתוך 4? איבדת 25% מהקיבולת, לא את הקישוריות.</p>
<p>חישוב ל-leaf: 48 פעמים 25G למטה = 1.2Tbps לכיוון השרתים, 6 פעמים 100G למעלה = 600Gbps לכיוון ה-spines ← <strong>oversubscription של 2:1</strong>. fabrics של AI ו-storage מכוונים ל-1:1.</p>
<p>אבל אפליקציות עדיין רוצות L2 (ניידות של VMs, הנחות של "אותו subnet"), אז בונים L2 <em>מעל</em> ה-fabric המנותב עם <strong>VXLAN</strong>: ה-frame המקורי נעטף ב-UDP (port 4789) על ידי <strong>VTEP</strong> (leaf switch, או ה-kernel של Linux על השרת).</p>
<pre>| outer Eth 14 | outer IP 20 | UDP 8 (dst 4789) | VXLAN 8 (VNI 24 bit) | original Ethernet frame |
                    = 50 bytes overhead → inner MTU 1450 on a 1500 underlay</pre>
<p>ה-<strong>VNI</strong> של 24 ביט נותן 16 מיליון segments (לעומת 4094 VLANs). ללמוד MACs מרוחקים על ידי flooding לא מתרחב, אז בפרודקשן משתמשים ב-<strong>BGP EVPN</strong> כ-control plane: ה-VTEPs מפרסמים "MAC X ו-IP Y נמצאים מאחוריי" ועונים ל-ARP מקומית (ARP suppression). ה-overlays של Kubernetes (Flannel VXLAN על UDP 8472, Calico VXLAN, Cilium עם VXLAN או Geneve) הם אותו רעיון, עם device מסוג <code>vxlan</code> של Linux על כל node.</p>
<p><strong>הענן מסתיר את כל זה.</strong> VPC <em>נראה</em> כמו L2 אבל הוא לא: ה-hypervisor (AWS Nitro, GCP Andromeda, Azure VFP) תופס את ה-frames ומעביר אותם לפי מסד נתונים של מיפויים.</p>
<ul>
<li>אין broadcast אמיתי; הרשת הווירטואלית עצמה עונה ל-ARP, ואי אפשר לזייף אותו - <strong>gratuitous ARP ל-VIP לא עושה כלום</strong>. keepalived ב-AWS צריך notify script שמזיז secondary private IP או Elastic IP דרך ה-API, או מעדכן route table.</li>
<li>אין multicast ברוב ה-VPCs (ב-AWS רק דרך Transit Gateway multicast), אז פרוטוקולים שמגלים שכנים ב-multicast צריכים הגדרת unicast.</li>
<li>Source/destination check זורק packets שלא ממוענים ל-instance - תכבה אותו ל-instances של NAT או router.</li>
<li>ב-GCP היסטורית כל VM מקבל /32, כך ש<em>הכל</em> עובר דרך ה-gateway הווירטואלי.</li>
</ul>
<blockquote>💡 מהשטח: failovers של "זה עבד אצלנו ב-on-prem" - VIPs של Pacemaker, MetalLB במצב L2, Oracle RAC, clustering ישן עם heartbeats ב-multicast - הם בין הדברים הראשונים שנשברים ב-lift-and-shift. תחליף אותם ב-load balancers של הענן או בהזזת IP דרך API.</blockquote>`
      }
    }
  ],
  diagram: `             spine1           spine2           spine3           spine4
              |  \\  \\         / | \\          / | \\         /  /  |
        (every leaf has one routed 100G link to every spine; ECMP over all four)
              |      \\   \\   /    |    \\     /    |   /   /       |
           leaf-r01 (ToR)        leaf-r02 (ToR)        leaf-r03 (ToR)
           VTEP 10.255.0.1       VTEP 10.255.0.2       VTEP 10.255.0.3
            |        |            |        |
         ens1f0   ens1f1       ens1f0   ens1f1        <- 2 x 25G, LACP bond0
            \\______/               \\______/              (MLAG pair or 1 leaf)
             host-a                host-b
       bond0.20 (VLAN 20)     bond0.20 (VLAN 20)
              \\_____ same L2 segment = VXLAN VNI 10020 across the routed fabric _____/`,
  handsOn: [
    { cmd: "ip -br link && ip neigh", what: { en: "List interfaces (state, MAC) and the neighbor/ARP table with REACHABLE/STALE/FAILED states.", he: "להציג interfaces (מצב, MAC) ואת טבלת ה-ARP עם המצבים REACHABLE, STALE ו-FAILED." } },
    { cmd: "ethtool eth0 && ethtool -S eth0 | grep -Ei 'err|drop|crc'", what: { en: "Negotiated speed/duplex/link, then NIC counters: rising CRC errors mean a bad cable or optic, rising drops mean ring-buffer or congestion trouble.", he: "מהירות, duplex ו-link שנקבעו, ואז ה-counters של הכרטיס: CRC errors שעולים = כבל או optic פגום, drops שעולים = בעיית ring buffer או עומס." } },
    { cmd: "ip -d link show bond0 && cat /proc/net/bonding/bond0", what: { en: "Bond mode, hash policy, LACP partner MAC and per-member link failures.", he: "ה-mode של ה-bond, ה-hash policy, ה-MAC של ה-partner ב-LACP ונפילות לכל חבר." } },
    { cmd: "bridge fdb show br0 && bridge vlan show", what: { en: "The Linux bridge's own MAC table (forwarding database) and which VLANs each bridge port carries - the same concepts as a hardware switch.", he: "טבלת ה-MAC של ה-bridge של Linux (forwarding database) ואילו VLANs כל port של ה-bridge נושא - אותם מושגים כמו ב-switch פיזי." } },
    { cmd: "sudo tcpdump -eni eth0 arp or stp", what: { en: "Watch ARP requests/replies and STP BPDUs with MAC addresses (-e). A flood of identical ARPs = storm or loop.", he: "לראות בקשות ותשובות ARP ו-BPDUs של STP עם כתובות MAC (-e). הצפה של ARPs זהים = storm או לולאה." } }
  ],
  mnemonic: {
    en: "Learn the source, flood the unknown. VLAN splits, STP blocks, LACP bundles - and one flow still rides one wire.",
    he: "לומדים מהמקור, מציפים את הלא ידוע. VLAN מפצל, STP חוסם, LACP מאחד - ו-flow אחד עדיין נוסע על חוט אחד."
  },
  pitfalls: [
    { en: "Expecting LACP to make one big transfer faster: the hash pins a flow to one member, so a single rsync over 2 × 10G still tops out at 10G. Use parallel streams.", he: "לצפות ש-LACP יאיץ העברה גדולה אחת: ה-hash מצמיד flow לחבר אחד, אז rsync בודד על פעמיים 10G עדיין נעצר ב-10G. תשתמש ב-streams מקבילים." },
    { en: "Configuring mode 4 on the server without LACP (or with a static LAG) on the switch: the bond flaps or sends half the traffic into a black hole. Mode 1 is the only safe choice when you don't control the switch.", he: "להגדיר mode 4 בשרת בלי LACP (או עם static LAG) ב-switch: ה-bond מקפץ או שולח חצי מהתעבורה לחור שחור. mode 1 הוא הבחירה הבטוחה היחידה כשאין לך שליטה על ה-switch." },
    { en: "Enabling jumbo frames on hosts but not on every switch hop: small packets work, large ones vanish, and pings with default size look perfectly healthy.", he: "להפעיל jumbo frames על השרתים אבל לא על כל hop של switch: packets קטנים עובדים, גדולים נעלמים, ו-ping בגודל ברירת המחדל נראה תקין לגמרי." },
    { en: "Porting an on-prem VIP failover (keepalived/GARP) to a VPC unchanged: the cloud ignores gratuitous ARP, so the VIP never moves.", he: "להעביר failover של VIP מ-on-prem (keepalived ו-GARP) ל-VPC בלי שינוי: הענן מתעלם מ-gratuitous ARP, אז ה-VIP אף פעם לא זז." }
  ],
  interview: [
    {
      q: { en: "Why is an L2 loop so much worse than an L3 routing loop?", he: "למה לולאה ב-L2 גרועה כל כך יותר מלולאת routing ב-L3?" },
      a: { en: "IP has a TTL, so a looping packet dies after at most 255 hops. Ethernet has none, and switches flood broadcasts and unknown unicast out of every port, so a single frame circulates forever and multiplies at every switch. Links saturate, MAC tables flap, switch CPUs peg, and the outage spreads to everything in the broadcast domain. STP/RSTP blocks redundant paths, BPDU guard shuts edge ports that see a BPDU, and storm-control caps broadcast rate.", he: "ל-IP יש TTL, אז packet בלולאה מת אחרי 255 hops לכל היותר. ל-Ethernet אין, וה-switches מציפים broadcast ו-unknown unicast לכל ה-ports, אז frame בודד מסתובב לנצח ומתרבה בכל switch. ה-links נחנקים, טבלאות ה-MAC מקפצות, ה-CPU של ה-switches ב-100%, וההשבתה מתפשטת לכל ה-broadcast domain. STP או RSTP חוסמים מסלולים כפולים, BPDU guard מכבה edge ports שרואים BPDU, ו-storm-control מגביל את קצב ה-broadcast." }
    },
    {
      q: { en: "Your bond0 in 802.3ad mode shows 'Partner Mac Address: 00:00:00:00:00:00'. What does it mean and what do you check?", he: "ה-bond0 שלך ב-mode 802.3ad מראה 'Partner Mac Address: 00:00:00:00:00:00'. מה זה אומר ומה תבדוק?" },
      a: { en: "No LACPDUs are arriving from the switch, so no aggregator was formed with a partner. Check that the switch ports are in a port-channel with LACP active (not 'mode on' static), that both members land on the same switch or an MLAG pair, that the VLAN/MTU config on the port-channel matches, and use tcpdump for ether proto 0x8809 to see whether LACPDUs flow in either direction.", he: "לא מגיעים LACPDUs מה-switch, אז לא נוצר aggregator עם partner. תבדוק שה-ports ב-switch נמצאים ב-port-channel עם LACP active (לא 'mode on' סטטי), ששני החברים מגיעים לאותו switch או לזוג MLAG, שהגדרות ה-VLAN וה-MTU על ה-port-channel תואמות, ותריץ tcpdump על ether proto 0x8809 כדי לראות אם LACPDUs זורמים לאיזשהו כיוון." }
    },
    {
      q: { en: "How does a VPC or Kubernetes overlay give you 'one subnet' across racks without stretching real L2?", he: "איך VPC או overlay של Kubernetes נותנים 'subnet אחד' על פני racks בלי למתוח L2 אמיתי?" },
      a: { en: "Encapsulation plus a mapping table. The physical fabric is routed (leaf-spine, ECMP). A VTEP (leaf switch, host kernel, or cloud hypervisor) wraps the tenant frame in UDP - VXLAN on 4789 or Geneve - and sends it to the VTEP behind which the destination lives, found via BGP EVPN, a CNI datastore, or the cloud's mapping service. ARP is answered locally, there's no real flooding, and the cost is ~50 bytes of overhead, so inner MTU drops (1450 on a 1500 underlay).", he: "encapsulation ועוד טבלת מיפוי. ה-fabric הפיזי מנותב (leaf-spine, ECMP). VTEP (leaf switch, ה-kernel של השרת או ה-hypervisor של הענן) עוטף את ה-frame של הלקוח ב-UDP - VXLAN על 4789 או Geneve - ושולח אותו ל-VTEP שמאחוריו יושב היעד, שמוצאים דרך BGP EVPN, ה-datastore של ה-CNI או שירות המיפוי של הענן. עונים ל-ARP מקומית, אין flooding אמיתי, והמחיר הוא כ-50 בתים של overhead, אז ה-MTU הפנימי יורד (1450 על underlay של 1500)." }
    }
  ],
  quiz: [
    {
      q: { en: "A switch receives a frame whose destination MAC is not in its MAC table. What does it do?", he: "switch מקבל frame שכתובת ה-MAC של היעד שלו לא בטבלה. מה הוא עושה?" },
      options: [
        { en: "Drops it and sends an ICMP unreachable", he: "זורק אותו ושולח ICMP unreachable" },
        { en: "Floods it out every port in that VLAN except the ingress port", he: "מציף אותו לכל ה-ports ב-VLAN חוץ מה-port שממנו הגיע" },
        { en: "Sends an ARP request to find the MAC first", he: "שולח קודם בקשת ARP כדי למצוא את ה-MAC" },
        { en: "Forwards it to the default gateway", he: "מעביר אותו ל-default gateway" }
      ],
      answer: 1,
      explain: { en: "Unknown unicast is flooded within the VLAN. The switch learns only from source addresses; it never ARPs (that's the hosts' job, at L3) and has no concept of a gateway.", he: "unknown unicast מוצף בתוך ה-VLAN. ה-switch לומד רק מכתובות מקור; הוא אף פעם לא שולח ARP (זה התפקיד של המחשבים, ב-L3) ואין לו מושג של gateway." }
    },
    {
      q: { en: "Which Linux bonding mode gives failover with zero switch configuration, even across two independent switches?", he: "איזה mode של bonding ב-Linux נותן failover בלי שום הגדרה ב-switch, גם מול שני switches בלתי תלויים?" },
      options: [
        { en: "Mode 0, balance-rr", he: "Mode 0, balance-rr" },
        { en: "Mode 4, 802.3ad", he: "Mode 4, 802.3ad" },
        { en: "Mode 1, active-backup", he: "Mode 1, active-backup" },
        { en: "Mode 2, balance-xor", he: "Mode 2, balance-xor" }
      ],
      answer: 2,
      explain: { en: "active-backup uses one link at a time and moves the MAC to the backup on failure (sending a gratuitous ARP), so no switch cooperation is needed. Modes 0 and 2 need a static LAG, mode 4 needs LACP; modes 5 and 6 also work without switch support but balance load.", he: "active-backup משתמש ב-link אחד בכל פעם ומעביר את ה-MAC לגיבוי כשיש תקלה (ושולח gratuitous ARP), אז לא צריך שיתוף פעולה מה-switch. modes 0 ו-2 צריכים static LAG, mode 4 צריך LACP; גם modes 5 ו-6 עובדים בלי תמיכה מה-switch אבל מאזנים עומס." }
    },
    {
      q: { en: "An edge port configured with BPDU guard suddenly receives a BPDU. What happens?", he: "edge port עם BPDU guard פתאום מקבל BPDU. מה קורה?" },
      options: [
        { en: "The port becomes the new root port", he: "ה-port הופך ל-root port החדש" },
        { en: "The BPDU is silently dropped and the port keeps forwarding", he: "ה-BPDU נזרק בשקט וה-port ממשיך להעביר תעבורה" },
        { en: "The port is put into err-disabled state (shut down)", he: "ה-port עובר למצב err-disabled (נכבה)" },
        { en: "The whole switch re-runs root bridge election", he: "כל ה-switch מריץ מחדש בחירת root bridge" }
      ],
      answer: 2,
      explain: { en: "A BPDU on an edge port means a switch or a loop was plugged in, so BPDU guard err-disables the port immediately. Silently dropping BPDUs is what bpdufilter does - and that is exactly how loops slip through.", he: "BPDU על edge port אומר שחיברו switch או לולאה, אז BPDU guard מעביר את ה-port ל-err-disabled מיד. לזרוק BPDUs בשקט זה מה ש-bpdufilter עושה - ובדיוק ככה לולאות חומקות." }
    },
    {
      q: { en: "Your hosts use MTU 1500 and you add a VXLAN overlay. What inner MTU should the overlay interfaces use?", he: "השרתים שלך עם MTU 1500 ואתה מוסיף overlay של VXLAN. איזה MTU פנימי צריך להיות על ה-interfaces של ה-overlay?" },
      options: [
        { en: "1500 - encapsulation is free", he: "1500 - ה-encapsulation בחינם" },
        { en: "1450 - VXLAN adds 50 bytes", he: "1450 - VXLAN מוסיף 50 בתים" },
        { en: "1492 - like PPPoE", he: "1492 - כמו PPPoE" },
        { en: "9000 - overlays require jumbo frames", he: "9000 - overlays דורשים jumbo frames" }
      ],
      answer: 1,
      explain: { en: "Outer Ethernet 14 + IP 20 + UDP 8 + VXLAN 8 = 50 bytes, so 1500 - 50 = 1450. Alternatively raise the underlay to 9000+ and keep 1500 inside. 1492 is the PPPoE number (8 bytes).", he: "Ethernet חיצוני 14 + IP 20 + UDP 8 + VXLAN 8 = 50 בתים, אז 1500 פחות 50 = 1450. אפשרות אחרת: להעלות את ה-underlay ל-9000 ומעלה ולהשאיר 1500 בפנים. 1492 זה המספר של PPPoE (8 בתים)." }
    }
  ],
  related: ["net-osi-tcpip", "net-vpc", "net-errors-by-layer", "k8s-networking-cni", "net-bgp-anycast", "net-troubleshooting"]
});

/* ------------------------------------------------------ Data centers */
INFRA.lessons.push({
  id: "datacenter-bare-metal",
  track: "foundations",
  order: 60,
  icon: "🏭",
  level: 2,
  minutes: 17,
  title: { en: "Data Centers & Bare Metal", he: "Data centers ו-bare metal" },
  tldr: {
    en: "Under every cloud is a building full of racks with two power feeds, cold and hot aisles, and a second tiny computer (the BMC) in every server that lets you power-cycle and reinstall it from 5,000 km away; bare metal wins on steady, heavy, egress- or GPU-bound load, and loses on spiky load, small teams and anything you can't plan 3 months ahead.",
    he: "מתחת לכל ענן יש בניין מלא ב-racks עם שני קווי חשמל, מעברים קרים וחמים, ומחשב קטן נוסף (ה-BMC) בכל שרת שמאפשר לך לכבות, להדליק ולהתקין אותו מחדש ממרחק 5,000 ק\"מ; bare metal מנצח בעומס יציב וכבד, כשה-egress או ה-GPUs הם העלות, ומפסיד בעומס קופצני, בצוות קטן ובכל מה שאי אפשר לתכנן 3 חודשים מראש."
  },
  analogy: {
    en: "The cloud is a hotel: you get a room tonight, pay a premium per night, and never think about the boiler. Bare metal is buying an apartment building: far cheaper per night if you fill it for years, but you choose the plumbing, keep spare parts, and when a pipe bursts at 3 AM it's your phone that rings. The BMC is the building's caretaker key - it opens every apartment even when the tenant is passed out.",
    he: "הענן הוא מלון: מקבל חדר הלילה, משלם פרמיה על כל לילה, ולא חושב על הדוד. bare metal זה לקנות בניין דירות: הרבה יותר זול ללילה אם אתה ממלא אותו שנים, אבל אתה בוחר את הצנרת, מחזיק חלקי חילוף, וכשצינור מתפוצץ ב-3 בלילה הטלפון שלך מצלצל. ה-BMC הוא המפתח של אב הבית - פותח כל דירה גם כשהדייר מעולף."
  },
  sections: [
    {
      h: { en: "Racks, power and cooling: the physical budget", he: "Racks, חשמל וקירור: התקציב הפיזי" },
      body: {
        en: `<p>A standard <strong>rack</strong> is 19 inches wide and <strong>42U</strong> tall (45U and 48U are common in new builds); <strong>1U = 1.75 in = 44.45 mm</strong>. A typical rack: 2 top-of-rack switches + 1 management switch + 1U patch panel at the top, then 30-38 servers of 1U/2U. Space is rarely the limit - <strong>power is</strong>.</p>
<p>Power per rack, then and now:</p>
<table>
<tr><th>Rack type</th><th>Typical draw</th><th>Cooling</th></tr>
<tr><td>Legacy enterprise</td><td>4-8 kW</td><td>Air</td></tr>
<tr><td>Dense compute (2-socket EPYC/Xeon, ~600-900 W each)</td><td>15-25 kW</td><td>Air with containment</td></tr>
<tr><td>GPU, 8× H100 servers (~10.2 kW each), 4 per rack</td><td>~40 kW</td><td>Rear-door heat exchangers / liquid</td></tr>
<tr><td>NVIDIA GB200 NVL72</td><td>~120-130 kW</td><td>Direct liquid cooling mandatory</td></tr>
</table>
<p><strong>A/B feeds</strong>: every rack gets two PDUs from two independent paths (separate UPS, switchgear, ideally utility feeds). Every server has two PSUs, one on each. Because either feed must carry the <em>whole</em> rack when the other fails, <strong>each feed must stay under 50% of its rated capacity</strong> (and in the US circuits are derated to 80% for continuous load). Example: 208 V × 30 A three-phase = 208 × 30 × 1.732 = 10.8 kVA, × 0.8 = 8.6 kW usable per feed - so that A+B pair supports an 8.6 kW rack, not 17.</p>
<p><strong>Cooling</strong>: servers pull air in the front and blow it out the back, so racks face each other in <strong>cold aisles</strong> (inlet, ASHRAE-recommended 18-27 °C) and back to back in <strong>hot aisles</strong> (35-45 °C). Containment (doors and roofs on one aisle) and <strong>blanking panels</strong> in empty U slots stop hot air recirculating into inlets. Efficiency is measured by <strong>PUE</strong> = total facility power / IT power: 2.0 means a watt of cooling and losses per watt of servers; industry average is ~1.5-1.6, hyperscalers report ~1.1 (Google fleet ~1.10).</p>
<blockquote>⚠️ Production tip: watch per-feed amperage, not just total rack kW. A rack that draws 60% on feed A and 40% on B looks fine until A trips and B instantly takes 100% of the load and trips too - a whole rack dark from a "redundant" design. Monitor PDUs via SNMP/Redfish and alert at 40% per feed.</blockquote>`,
        he: `<p><strong>rack</strong> סטנדרטי הוא ברוחב 19 אינץ' ובגובה <strong>42U</strong> (45U ו-48U נפוצים בבנייה חדשה); <strong>1U = 1.75 אינץ' = 44.45 מ"מ</strong>. rack טיפוסי: 2 top-of-rack switches, management switch אחד ו-patch panel של 1U למעלה, ואז 30-38 שרתים של 1U או 2U. המקום כמעט אף פעם לא המגבלה - <strong>החשמל כן</strong>.</p>
<p>חשמל ל-rack, אז והיום:</p>
<table>
<tr><th>סוג rack</th><th>צריכה טיפוסית</th><th>קירור</th></tr>
<tr><td>Enterprise ישן</td><td>4-8kW</td><td>אוויר</td></tr>
<tr><td>Compute צפוף (EPYC או Xeon עם 2 sockets, כ-600-900W לשרת)</td><td>15-25kW</td><td>אוויר עם containment</td></tr>
<tr><td>GPU, שרתי 8× H100 (כ-10.2kW כל אחד), 4 ב-rack</td><td>כ-40kW</td><td>rear-door heat exchangers או נוזל</td></tr>
<tr><td>NVIDIA GB200 NVL72</td><td>כ-120-130kW</td><td>קירור נוזלי ישיר חובה</td></tr>
</table>
<p><strong>A/B feeds</strong>: כל rack מקבל שני PDUs משני מסלולים בלתי תלויים (UPS נפרד, switchgear נפרד, ובאידיאל גם חברת חשמל). לכל שרת שני ספקי כוח, אחד על כל קו. כיוון שכל קו חייב לשאת את <em>כל</em> ה-rack כשהשני נופל, <strong>כל קו חייב להישאר מתחת ל-50% מהקיבולת שלו</strong> (ובארה"ב מורידים מעגלים ל-80% לעומס רציף). דוגמה: 208V כפול 30A בתלת-פאזי = 208 × 30 × 1.732 = 10.8kVA, כפול 0.8 = 8.6kW שמישים לכל קו - אז זוג A+B כזה מחזיק rack של 8.6kW, לא 17.</p>
<p><strong>קירור</strong>: שרתים מושכים אוויר מלפנים ונושפים מאחור, אז ה-racks עומדים פנים מול פנים ב-<strong>מעברים קרים</strong> (כניסת אוויר, ASHRAE ממליצים על 18-27 מעלות) וגב אל גב ב-<strong>מעברים חמים</strong> (35-45 מעלות). Containment (דלתות וגג על מעבר אחד) ו-<strong>blanking panels</strong> ב-U ריקים מונעים מאוויר חם לחזור לכניסות. היעילות נמדדת ב-<strong>PUE</strong> = כל החשמל של המתקן חלקי חשמל ה-IT: 2.0 אומר וואט של קירור והפסדים על כל וואט של שרתים; הממוצע בתעשייה כ-1.5-1.6, וה-hyperscalers מדווחים על כ-1.1 (הצי של Google כ-1.10).</p>
<blockquote>⚠️ טיפ לפרודקשן: תעקוב אחרי האמפר לכל קו, לא רק אחרי סך ה-kW של ה-rack. rack שצורך 60% מקו A ו-40% מ-B נראה בסדר עד ש-A קופץ, B מקבל מיד 100% מהעומס וקופץ גם הוא - rack שלם חשוך בגלל תכנון "שרידותי". תנטר את ה-PDUs ב-SNMP או Redfish ותתריע ב-40% לכל קו.</blockquote>`
      }
    },
    {
      h: { en: "Own DC, colocation or cloud", he: "DC משלך, colocation או ענן" },
      body: {
        en: `<table>
<tr><th></th><th>Own data center</th><th>Colocation</th><th>Cloud</th></tr>
<tr><td>You own</td><td>Building, power, cooling, hardware</td><td>Hardware only; rent space + power</td><td>Nothing; rent by the second</td></tr>
<tr><td>Lead time</td><td>2-4 years</td><td>Weeks for space, 8-16 weeks for servers</td><td>Minutes</td></tr>
<tr><td>Pricing unit</td><td>Capex + staff</td><td>~$150-300 per kW per month (market-dependent, 2025-26) + cross-connects ~$100-300/month each</td><td>Per instance-hour, per GB stored, per GB egress</td></tr>
<tr><td>Makes sense at</td><td>Hyperscale or strict sovereignty</td><td>Several racks to a few MW of steady load</td><td>Almost everyone at the start</td></tr>
</table>
<p>Facilities are graded by the Uptime Institute <strong>Tier</strong> system: Tier I (no redundancy, ~99.671%), Tier II (redundant components, 99.741%), Tier III (concurrently maintainable - any component can be serviced without downtime, 99.982%), Tier IV (fault tolerant, 99.995%). Most serious colos are Tier III.</p>
<p>Colo vocabulary you'll meet: <strong>cage</strong> (your fenced area), <strong>meet-me room</strong> (where carriers interconnect), <strong>cross-connect</strong> (a physical fiber from your cage to a carrier or cloud on-ramp, billed monthly), <strong>remote hands</strong> (colo staff who do physical work for you, ~$100-200/hour, often billed in 15-30 minute increments).</p>
<blockquote>💡 Real world: write remote-hands tickets as if for someone who has never seen your setup: "Cage 4, rack R07, U22, Dell R760 serial 7XK2M93, rear, port labelled R07-U22-P2: replace the SFP28 with the spare in the drawer at R07-U1, send a photo of the port LEDs." Vague tickets cost an hour and the wrong server gets unplugged.</blockquote>`,
        he: `<table>
<tr><th></th><th>DC משלך</th><th>Colocation</th><th>ענן</th></tr>
<tr><td>מה שלך</td><td>הבניין, החשמל, הקירור, החומרה</td><td>רק החומרה; שוכרים מקום וחשמל</td><td>כלום; שוכרים לפי שנייה</td></tr>
<tr><td>זמן הקמה</td><td>2-4 שנים</td><td>שבועות למקום, 8-16 שבועות לשרתים</td><td>דקות</td></tr>
<tr><td>יחידת תמחור</td><td>Capex ועוד צוות</td><td>כ-$150-300 ל-kW לחודש (תלוי שוק, 2025-26) ועוד cross-connects של כ-$100-300 לחודש כל אחד</td><td>לפי שעת instance, GB באחסון, GB של egress</td></tr>
<tr><td>הגיוני כש...</td><td>hyperscale או ריבונות מחמירה</td><td>מכמה racks עד כמה MW של עומס יציב</td><td>כמעט לכולם בהתחלה</td></tr>
</table>
<p>מתקנים מדורגים לפי שיטת ה-<strong>Tier</strong> של Uptime Institute: Tier I (בלי שרידות, כ-99.671%), Tier II (רכיבים כפולים, 99.741%), Tier III (concurrently maintainable - אפשר לטפל בכל רכיב בלי השבתה, 99.982%), Tier IV (fault tolerant, 99.995%). רוב ה-colos הרציניים הם Tier III.</p>
<p>מילים שתפגוש ב-colo: <strong>cage</strong> (האזור המגודר שלך), <strong>meet-me room</strong> (החדר שבו ספקי התקשורת מתחברים), <strong>cross-connect</strong> (סיב פיזי מה-cage שלך לספק או ל-on-ramp של ענן, בתשלום חודשי), <strong>remote hands</strong> (צוות ה-colo שעושה עבודה פיזית בשבילך, כ-$100-200 לשעה, הרבה פעמים בחיוב של 15-30 דקות).</p>
<blockquote>💡 מהשטח: תכתוב טיקט ל-remote hands כאילו למישהו שמעולם לא ראה את ההתקנה שלך: "Cage 4, rack R07, U22, Dell R760 serial 7XK2M93, מאחור, port עם תווית R07-U22-P2: להחליף את ה-SFP28 ב-spare שבמגירה ב-R07-U1, ולשלוח תמונה של נורות ה-port." טיקט מעורפל עולה שעה, והשרת הלא נכון מתנתק.</blockquote>`
      }
    },
    {
      h: { en: "Out-of-band management: BMC, IPMI and Redfish", he: "Out-of-band management: BMC, IPMI ו-Redfish" },
      body: {
        en: `<p>Every server has a <strong>BMC</strong> (Baseboard Management Controller): a small ARM computer on the motherboard, powered whenever the PSUs have power, even with the server "off". Vendors brand it <strong>iDRAC</strong> (Dell), <strong>iLO</strong> (HPE), XClarity (Lenovo), or just "IPMI" (Supermicro). It gives you power control, a virtual console (KVM over HTTPS), virtual media (mount an ISO remotely), sensor readings, the hardware event log and firmware updates. It's how you fix a server whose OS is dead without driving to the DC.</p>
<p>The BMC lives on a separate <strong>out-of-band (OOB) network</strong>: its own NIC port, its own management switch, its own VLAN, reachable only via a bastion/VPN. Two protocols:</p>
<ul>
<li><strong>IPMI 2.0</strong> (UDP 623): old, universal, and insecure by design - RAKP lets anyone fetch a crackable password hash, and "cipher 0" allows auth bypass on badly configured BMCs. Never expose it beyond the OOB network.</li>
<li><strong>Redfish</strong> (DMTF): REST + JSON over HTTPS. The modern standard; automation tools (Ansible, Metal3/Ironic, Terraform providers) use it.</li>
</ul>
<pre>$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E chassis power status
Chassis Power is on
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E sel list | tail -3
  41 | 11/02/2026 | 03:14:07 | Memory #0x53 | Correctable ECC | Asserted
  42 | 11/02/2026 | 03:14:09 | Memory #0x53 | Correctable ECC logging limit reached | Asserted
  43 | 11/02/2026 | 03:20:51 | Power Supply #0x64 | Power Supply AC lost | Asserted
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E sdr type Temperature
Inlet Temp       | 04h | ok  |  7.1 | 23 degrees C
CPU1 Temp        | 0Eh | ok  |  3.1 | 61 degrees C
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E chassis bootdev pxe     # next boot from network
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E chassis power cycle
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E sol activate            # serial console; exit with ~.</pre>
<p>(<code>-E</code> reads the password from <code>IPMI_PASSWORD</code> so it doesn't land in shell history.) The same with Redfish:</p>
<pre>curl -sk -u admin:"$PW" https://10.10.0.21/redfish/v1/Systems/System.Embedded.1 | jq '.PowerState, .Status.Health'
curl -sk -u admin:"$PW" -X POST -H 'Content-Type: application/json' \\
  -d '{"ResetType":"ForceRestart"}' \\
  https://10.10.0.21/redfish/v1/Systems/System.Embedded.1/Actions/ComputerSystem.Reset</pre>
<p><strong>Serial-over-LAN</strong> streams the server's serial console through the BMC: you see BIOS POST, GRUB and kernel panics even when the network stack is dead. Configure <code>console=tty0 console=ttyS1,115200n8</code> on the kernel command line so Linux writes there too.</p>
<blockquote>⚠️ Production tip: BMCs ship with default credentials (Supermicro's ADMIN/ADMIN on older boards, a printed per-unit password on newer ones) and run years-old firmware. Change credentials during provisioning, update BMC firmware like any OS, and keep the OOB network unroutable from production and the Internet - a compromised BMC can reflash the BIOS and survives an OS reinstall.</blockquote>`,
        he: `<p>בכל שרת יש <strong>BMC</strong> (Baseboard Management Controller): מחשב ARM קטן על לוח האם, שמקבל חשמל כל עוד יש חשמל לספקי הכוח, גם כשהשרת "כבוי". כל יצרן קורא לו בשם אחר: <strong>iDRAC</strong> (Dell), <strong>iLO</strong> (HPE), XClarity (Lenovo), או סתם "IPMI" (Supermicro). הוא נותן שליטה בחשמל, קונסולה וירטואלית (KVM על HTTPS), virtual media (לחבר ISO מרחוק), קריאת חיישנים, את לוג אירועי החומרה ועדכוני firmware. ככה מתקנים שרת שה-OS שלו מת בלי לנסוע ל-DC.</p>
<p>ה-BMC יושב על <strong>רשת out-of-band (OOB)</strong> נפרדת: port רשת משלו, management switch משלו, VLAN משלו, נגיש רק דרך bastion או VPN. שני פרוטוקולים:</p>
<ul>
<li><strong>IPMI 2.0</strong> (UDP 623): ישן, נמצא בכל מקום ולא מאובטח מעצם התכנון - RAKP מאפשר לכל אחד לשלוף hash של סיסמה שאפשר לפצח, ו-"cipher 0" מאפשר לעקוף אימות ב-BMCs שהוגדרו גרוע. אף פעם לא לחשוף אותו מחוץ לרשת ה-OOB.</li>
<li><strong>Redfish</strong> (של DMTF): REST ו-JSON על HTTPS. הסטנדרט המודרני; כלי אוטומציה (Ansible, Metal3 ו-Ironic, providers של Terraform) משתמשים בו.</li>
</ul>
<pre>$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E chassis power status
Chassis Power is on
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E sel list | tail -3
  41 | 11/02/2026 | 03:14:07 | Memory #0x53 | Correctable ECC | Asserted
  42 | 11/02/2026 | 03:14:09 | Memory #0x53 | Correctable ECC logging limit reached | Asserted
  43 | 11/02/2026 | 03:20:51 | Power Supply #0x64 | Power Supply AC lost | Asserted
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E sdr type Temperature
Inlet Temp       | 04h | ok  |  7.1 | 23 degrees C
CPU1 Temp        | 0Eh | ok  |  3.1 | 61 degrees C
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E chassis bootdev pxe     # next boot from network
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E chassis power cycle
$ ipmitool -I lanplus -H 10.10.0.21 -U admin -E sol activate            # serial console; exit with ~.</pre>
<p>(<code>-E</code> קורא את הסיסמה מ-<code>IPMI_PASSWORD</code> כדי שהיא לא תישאר ב-shell history.) אותו דבר ב-Redfish:</p>
<pre>curl -sk -u admin:"$PW" https://10.10.0.21/redfish/v1/Systems/System.Embedded.1 | jq '.PowerState, .Status.Health'
curl -sk -u admin:"$PW" -X POST -H 'Content-Type: application/json' \\
  -d '{"ResetType":"ForceRestart"}' \\
  https://10.10.0.21/redfish/v1/Systems/System.Embedded.1/Actions/ComputerSystem.Reset</pre>
<p><strong>Serial-over-LAN</strong> מזרים את ה-serial console של השרת דרך ה-BMC: רואים POST של ה-BIOS, את GRUB ו-kernel panics גם כשה-network stack מת. תגדיר <code>console=tty0 console=ttyS1,115200n8</code> ב-kernel command line כדי ש-Linux יכתוב לשם גם.</p>
<blockquote>⚠️ טיפ לפרודקשן: BMCs מגיעים עם סיסמאות ברירת מחדל (ADMIN/ADMIN בלוחות ישנים של Supermicro, סיסמה מודפסת לכל יחידה בחדשים) ועם firmware בן כמה שנים. תחליף סיסמאות בזמן ה-provisioning, תעדכן firmware של BMC כמו כל OS, ותשאיר את רשת ה-OOB בלי route מהפרודקשן ומהאינטרנט - BMC שנפרץ יכול לצרוב מחדש את ה-BIOS ושורד התקנה מחדש של ה-OS.</blockquote>`
      }
    },
    {
      h: { en: "Provisioning: from PXE to a running node", he: "Provisioning: מ-PXE ועד node שרץ" },
      body: {
        en: `<p>Nobody installs 300 servers from USB sticks. The chain:</p>
<ol>
<li>BMC sets the next boot to network and power-cycles the server.</li>
<li>The NIC's <strong>PXE</strong> firmware sends DHCPDISCOVER with option 60 <code>PXEClient</code> and option 93 (client architecture: 0 = legacy BIOS, 7 = UEFI x64).</li>
<li>DHCP answers with an IP, <code>next-server</code> (the TFTP host) and option 67 boot file name.</li>
<li>The NIC fetches a small bootloader over <strong>TFTP</strong> (UDP 69, slow, no auth). Usually that's <strong>iPXE</strong>, which then chain-loads everything else over <strong>HTTP</strong> - 100× faster, scriptable, and can pick a config per MAC.</li>
<li>Kernel + initrd boot an <strong>automated installer</strong> (kickstart for RHEL, autoinstall/cloud-init for Ubuntu, Talos/Flatcar images written straight to disk), which partitions, installs, registers the node, and reboots into the OS.</li>
</ol>
<pre># dnsmasq: BIOS/UEFI get iPXE over TFTP, iPXE itself gets a script over HTTP
dhcp-range=10.20.0.100,10.20.0.200,12h
dhcp-match=set:efi64,option:client-arch,7
dhcp-userclass=set:ipxe,iPXE
dhcp-boot=tag:!ipxe,tag:efi64,ipxe.efi
dhcp-boot=tag:!ipxe,tag:!efi64,undionly.kpxe
dhcp-boot=tag:ipxe,http://10.20.0.5/boot.ipxe
enable-tftp
tftp-root=/srv/tftp

# boot.ipxe
#!ipxe
kernel http://10.20.0.5/ubuntu/vmlinuz ip=dhcp autoinstall ds=nocloud-net;s=http://10.20.0.5/ai/\${mac}/
initrd http://10.20.0.5/ubuntu/initrd
boot</pre>
<p>The tag on the iPXE request breaks the "PXE loads iPXE, which does DHCP again and loads iPXE again" infinite loop - the most common first-day bug.</p>
<p>Tools that wrap this whole flow with an API and inventory:</p>
<ul>
<li><strong>MAAS</strong> (Canonical): discovers, commissions (inventories and tests hardware), and deploys Ubuntu/RHEL/Windows; "cloud-like" API over your racks.</li>
<li><strong>OpenStack Ironic</strong>: bare metal as a Nova flavor; also the engine behind <strong>Metal3</strong>, which lets Kubernetes Cluster API provision physical nodes.</li>
<li><strong>Tinkerbell</strong> (CNCF, from Equinix Metal): workflows of containerized actions (stream image, write cloud-init, reboot).</li>
<li>Foreman, Cobbler: older, still everywhere in enterprises.</li>
</ul>
<blockquote>💡 Real world: a rogue DHCP server (a dev's home router, a VM with dnsmasq) on the provisioning VLAN causes servers to boot into the wrong installer or no installer at all. Keep provisioning on its own VLAN and enable DHCP snooping on the access switches.</blockquote>`,
        he: `<p>אף אחד לא מתקין 300 שרתים מ-USB. השרשרת:</p>
<ol>
<li>ה-BMC קובע שה-boot הבא יהיה מהרשת ועושה power cycle לשרת.</li>
<li>ה-firmware של <strong>PXE</strong> בכרטיס הרשת שולח DHCPDISCOVER עם option 60 <code>PXEClient</code> ו-option 93 (ארכיטקטורת הלקוח: 0 = legacy BIOS, 7 = UEFI x64).</li>
<li>שרת ה-DHCP עונה עם IP, <code>next-server</code> (שרת ה-TFTP) ו-option 67 עם שם קובץ ה-boot.</li>
<li>הכרטיס מושך bootloader קטן ב-<strong>TFTP</strong> (UDP 69, איטי, בלי אימות). בדרך כלל זה <strong>iPXE</strong>, שטוען את כל השאר ב-<strong>HTTP</strong> - פי 100 יותר מהיר, ניתן לסקריפט, ויכול לבחור config לפי MAC.</li>
<li>kernel ו-initrd מעלים <strong>installer אוטומטי</strong> (kickstart ל-RHEL, autoinstall או cloud-init ל-Ubuntu, images של Talos או Flatcar שנכתבים ישר לדיסק), שמחלק את הדיסק, מתקין, רושם את ה-node ועושה reboot ל-OS.</li>
</ol>
<pre># dnsmasq: BIOS/UEFI get iPXE over TFTP, iPXE itself gets a script over HTTP
dhcp-range=10.20.0.100,10.20.0.200,12h
dhcp-match=set:efi64,option:client-arch,7
dhcp-userclass=set:ipxe,iPXE
dhcp-boot=tag:!ipxe,tag:efi64,ipxe.efi
dhcp-boot=tag:!ipxe,tag:!efi64,undionly.kpxe
dhcp-boot=tag:ipxe,http://10.20.0.5/boot.ipxe
enable-tftp
tftp-root=/srv/tftp

# boot.ipxe
#!ipxe
kernel http://10.20.0.5/ubuntu/vmlinuz ip=dhcp autoinstall ds=nocloud-net;s=http://10.20.0.5/ai/\${mac}/
initrd http://10.20.0.5/ubuntu/initrd
boot</pre>
<p>ה-tag על בקשת ה-iPXE שובר את הלולאה האינסופית של "PXE טוען iPXE, שעושה DHCP שוב וטוען iPXE שוב" - הבאג הנפוץ ביותר ביום הראשון.</p>
<p>כלים שעוטפים את כל התהליך עם API ו-inventory:</p>
<ul>
<li><strong>MAAS</strong> (של Canonical): מגלה, עושה commissioning (מתעד ובודק את החומרה) ופורס Ubuntu, RHEL או Windows; API "כמו ענן" מעל ה-racks שלך.</li>
<li><strong>OpenStack Ironic</strong>: bare metal כ-flavor של Nova; גם המנוע מאחורי <strong>Metal3</strong>, שמאפשר ל-Cluster API של Kubernetes לעשות provisioning ל-nodes פיזיים.</li>
<li><strong>Tinkerbell</strong> (CNCF, במקור מ-Equinix Metal): workflows של פעולות בקונטיינרים (להזרים image, לכתוב cloud-init, reboot).</li>
<li>Foreman ו-Cobbler: ישנים יותר, עדיין בכל מקום בארגונים.</li>
</ul>
<blockquote>💡 מהשטח: שרת DHCP פיראטי (ראוטר ביתי של מפתח, VM עם dnsmasq) על ה-VLAN של ה-provisioning גורם לשרתים לעלות ל-installer הלא נכון או לא לעלות בכלל. תשאיר את ה-provisioning על VLAN משלו ותפעיל DHCP snooping על ה-access switches.</blockquote>`
      }
    },
    {
      h: { en: "Hardware lifecycle, inventory and bare-metal Kubernetes", he: "מחזור חיי חומרה, inventory ו-Kubernetes על bare metal" },
      body: {
        en: `<p><strong>Burn-in</strong> before production: hardware failure follows a bathtub curve, so you want infant mortality to happen in the burn-in rack, not under customer traffic. 24-72 hours of <code>stress-ng</code> (CPU), memtester/MemTest86 (RAM), <code>fio</code> across every drive, GPU burn for accelerators, while watching the SEL and SMART counters.</p>
<p>What actually fails (ballpark, large fleets):</p>
<table>
<tr><th>Component</th><th>Rate</th><th>Notes</th></tr>
<tr><td>HDD</td><td>~1-2% AFR</td><td>Backblaze's fleet: ~1.5% annualized; spikes in year 1 and after year 5</td></tr>
<tr><td>Datacenter SSD/NVMe</td><td>~0.5-1% AFR</td><td>Watch percentage used (wear) and media errors in <code>smartctl -a</code></td></tr>
<tr><td>DIMM</td><td>~8% of DIMMs see correctable errors per year (Google, 2009)</td><td>A rising correctable-ECC count predicts an uncorrectable crash - replace early</td></tr>
<tr><td>PSU, fans, optics</td><td>Low, but you have many</td><td>Redundant PSUs make these non-events if monitored</td></tr>
</table>
<p><strong>Firmware</strong>: BIOS, BMC, NIC, drive and RAID controller firmware all get CVEs and bug fixes. Keep a baseline per hardware model and roll it like any deploy (canary rack first). <strong>RMA</strong>: the vendor replaces failed parts under a support contract (next business day, or 4-hour for critical); keep 2-5% spares on site so you don't wait, and keep failed drives (or destroy them) instead of shipping customer data back.</p>
<p><strong>Inventory / CMDB / DCIM</strong>: the source of truth for what is where - rack elevations, serials, cable maps, IPs, power circuits. <strong>NetBox</strong> (open source DCIM + IPAM) is the de facto standard; good teams generate DHCP reservations, switch port configs and monitoring targets <em>from</em> it, so the data can't drift.</p>
<p><strong>Kubernetes on bare metal</strong> needs replacements for what the cloud provided:</p>
<ul>
<li><code>type: LoadBalancer</code> stays <code>&lt;pending&gt;</code> forever - no cloud controller. <strong>MetalLB</strong> fills the gap: <em>L2 mode</em> (one node owns the VIP and answers ARP; failover via gratuitous ARP in seconds; all traffic for a VIP enters through one node) or <em>BGP mode</em> (each node announces the /32 to the top-of-rack routers; ECMP across nodes). <strong>kube-vip</strong> gives the control plane a floating VIP.</li>
<li>Storage: no EBS. Local NVMe via local PersistentVolumes / TopoLVM / OpenEBS LocalPV for databases that replicate themselves, or <strong>Rook-Ceph</strong> for network block storage (needs fast networking and real ops skill).</li>
<li>Node lifecycle: Cluster API + Metal3, or immutable OSes like Talos to make reinstalling a node routine.</li>
</ul>
<pre>apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata: { name: public, namespace: metallb-system }
spec:
  addresses: ["203.0.113.10-203.0.113.40"]
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata: { name: public, namespace: metallb-system }
spec:
  ipAddressPools: ["public"]</pre>`,
        he: `<p><strong>Burn-in</strong> לפני פרודקשן: תקלות חומרה מתנהגות לפי עקומת אמבטיה, אז אתה רוצה שתמותת התינוקות תקרה ב-rack של ה-burn-in, לא תחת תעבורה של לקוחות. 24-72 שעות של <code>stress-ng</code> (CPU), memtester או MemTest86 (זיכרון), <code>fio</code> על כל דיסק, GPU burn למאיצים, תוך מעקב אחרי ה-SEL וה-counters של SMART.</p>
<p>מה באמת נשבר (בערך, בציים גדולים):</p>
<table>
<tr><th>רכיב</th><th>שיעור</th><th>הערות</th></tr>
<tr><td>HDD</td><td>כ-1-2% AFR</td><td>בצי של Backblaze: כ-1.5% בשנה; קפיצות בשנה הראשונה ואחרי שנה 5</td></tr>
<tr><td>SSD או NVMe של datacenter</td><td>כ-0.5-1% AFR</td><td>תעקוב אחרי percentage used (שחיקה) ו-media errors ב-<code>smartctl -a</code></td></tr>
<tr><td>DIMM</td><td>כ-8% מה-DIMMs רואים correctable errors בשנה (Google, 2009)</td><td>מספר correctable ECC שעולה מנבא קריסה מ-uncorrectable - תחליף מוקדם</td></tr>
<tr><td>ספקי כוח, מאווררים, optics</td><td>נמוך, אבל יש לך הרבה</td><td>ספקי כוח כפולים הופכים את זה ללא-אירוע, אם מנטרים</td></tr>
</table>
<p><strong>Firmware</strong>: ל-firmware של BIOS, BMC, כרטיס רשת, דיסקים ובקר RAID יש CVEs ותיקוני באגים. תחזיק baseline לכל דגם חומרה ותגלגל אותו כמו כל deploy (קודם rack של canary). <strong>RMA</strong>: היצרן מחליף חלקים תקולים לפי חוזה תמיכה (next business day, או 4 שעות לקריטי); תחזיק 2-5% חלקי חילוף באתר כדי לא לחכות, ותשמור דיסקים תקולים (או תשמיד אותם) במקום לשלוח דאטה של לקוחות בחזרה.</p>
<p><strong>Inventory, CMDB ו-DCIM</strong>: מקור האמת למה נמצא איפה - rack elevations, מספרים סידוריים, מפות כבלים, IPs, מעגלי חשמל. <strong>NetBox</strong> (DCIM ו-IPAM בקוד פתוח) הוא הסטנדרט בפועל; צוותים טובים מייצרים <em>ממנו</em> הזמנות DHCP, הגדרות ports ב-switches ויעדי ניטור, כך שהנתונים לא יכולים לסטות.</p>
<p><strong>Kubernetes על bare metal</strong> צריך תחליפים למה שהענן נתן:</p>
<ul>
<li><code>type: LoadBalancer</code> נשאר <code>&lt;pending&gt;</code> לנצח - אין cloud controller. <strong>MetalLB</strong> ממלא את החור: <em>מצב L2</em> (node אחד מחזיק את ה-VIP ועונה ל-ARP; failover דרך gratuitous ARP תוך שניות; כל התעבורה ל-VIP נכנסת דרך node אחד) או <em>מצב BGP</em> (כל node מכריז על ה-/32 ל-routers של ה-top-of-rack; ECMP על פני ה-nodes). <strong>kube-vip</strong> נותן VIP צף ל-control plane.</li>
<li>אחסון: אין EBS. NVMe מקומי דרך local PersistentVolumes, TopoLVM או OpenEBS LocalPV לבסיסי נתונים שעושים replication בעצמם, או <strong>Rook-Ceph</strong> ל-block storage ברשת (צריך רשת מהירה ויכולת תפעול אמיתית).</li>
<li>מחזור חיי node: Cluster API עם Metal3, או מערכות הפעלה immutable כמו Talos, כדי שהתקנה מחדש של node תהיה שגרה.</li>
</ul>
<pre>apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata: { name: public, namespace: metallb-system }
spec:
  addresses: ["203.0.113.10-203.0.113.40"]
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata: { name: public, namespace: metallb-system }
spec:
  ipAddressPools: ["public"]</pre>`
      }
    },
    {
      h: { en: "When bare metal beats the cloud (and when it doesn't)", he: "מתי bare metal מנצח את הענן (ומתי לא)" },
      body: {
        en: `<p>Back-of-envelope for one big node, steady 24/7 load (US prices, ballpark):</p>
<table>
<tr><th></th><th>Bare metal in colo</th><th>Cloud (AWS r7a.32xlarge-class: 128 cores, 1 TiB)</th></tr>
<tr><td>Hardware</td><td>2× 64-core EPYC, 1 TB RAM, 4× 3.84 TB NVMe ≈ $30k → /60 months = <strong>$500/mo</strong></td><td>-</td></tr>
<tr><td>Power + space</td><td>~0.8 kW × ~$250/kW = <strong>$200/mo</strong></td><td>included</td></tr>
<tr><td>Network share (ToR, transit, cross-connects)</td><td><strong>~$100/mo</strong></td><td>included (egress extra)</td></tr>
<tr><td>Compute total</td><td><strong>~$800/mo</strong> + people</td><td>~$7,000/mo on-demand, ~$2,800-3,000/mo with a 3-year commitment</td></tr>
<tr><td>Egress 100 TB/mo</td><td>IP transit ~$0.20-0.50 per Mbps (95th percentile); ~300 Mbps avg → <strong>~$150-300/mo</strong></td><td>~$0.05-0.09/GB → <strong>~$6,000-7,000/mo</strong></td></tr>
</table>
<p>The missing line is <strong>people</strong>: someone must own procurement, racking, firmware, spares, the provisioning stack, 24/7 hardware on-call. That's roughly 2-4 engineers before the first server pays off, which is why the break-even is usually somewhere around a cloud bill of $1-2M/year of <em>steady</em> compute. 37signals (Basecamp, HEY) publicly moved off AWS compute in 2023 with a ~$3.2M/year bill and projected ~$7M savings over five years.</p>
<p><strong>Bare metal wins when:</strong></p>
<ul>
<li>Load is steady and predictable (baseline that never scales to zero).</li>
<li>Egress is huge: video, CDN origin, game patches, data exports.</li>
<li>GPUs run 24/7: an 8× H100 server costs ~$250-300k and ~10 kW; at ~$3/GPU-hour that's ~$17.5k/month rented, so owning pays back in well under 2 years at high utilization.</li>
<li>You need hardware the cloud doesn't sell, or strict data residency/latency (trading, telco edge).</li>
</ul>
<p><strong>The cloud wins when:</strong> load is spiky or unknown, the team is small, you lean on managed services (managed DBs, queues, IAM, 30 regions), speed of change matters more than unit cost, or hardware lead times (8-16 weeks, longer for GPUs) would block the business. Many companies end up hybrid: steady base on metal, bursts and managed services in the cloud.</p>
<blockquote>💡 Real world: the most common bare-metal failure isn't hardware - it's capacity planning. Order too little and you can't ship a feature for 3 months; order too much and you've prepaid for idle racks. Track utilization weekly and keep a ~20-30% headroom plus a cloud burst path.</blockquote>`,
        he: `<p>חישוב גס ל-node אחד גדול, עומס יציב 24/7 (מחירי ארה"ב, בערך):</p>
<table>
<tr><th></th><th>Bare metal ב-colo</th><th>ענן (בסגנון AWS r7a.32xlarge: 128 ליבות, 1TiB)</th></tr>
<tr><td>חומרה</td><td>2× EPYC של 64 ליבות, 1TB RAM, 4× NVMe של 3.84TB ≈ $30k ← חלקי 60 חודשים = <strong>$500 לחודש</strong></td><td>-</td></tr>
<tr><td>חשמל ומקום</td><td>כ-0.8kW × כ-$250 ל-kW = <strong>$200 לחודש</strong></td><td>כלול</td></tr>
<tr><td>חלק ברשת (ToR, transit, cross-connects)</td><td><strong>כ-$100 לחודש</strong></td><td>כלול (egress בנפרד)</td></tr>
<tr><td>סה"כ compute</td><td><strong>כ-$800 לחודש</strong> ועוד אנשים</td><td>כ-$7,000 לחודש on-demand, כ-$2,800-3,000 לחודש עם התחייבות ל-3 שנים</td></tr>
<tr><td>Egress של 100TB בחודש</td><td>IP transit בכ-$0.20-0.50 ל-Mbps (אחוזון 95); ממוצע כ-300Mbps ← <strong>כ-$150-300 לחודש</strong></td><td>כ-$0.05-0.09 ל-GB ← <strong>כ-$6,000-7,000 לחודש</strong></td></tr>
</table>
<p>השורה שחסרה היא <strong>אנשים</strong>: מישהו צריך להחזיק רכש, התקנה ב-racks, firmware, חלקי חילוף, את ה-stack של ה-provisioning, ו-on-call של חומרה 24/7. זה בערך 2-4 מהנדסים לפני שהשרת הראשון מחזיר את עצמו, ולכן נקודת האיזון היא בדרך כלל סביב חשבון ענן של $1-2M בשנה על compute <em>יציב</em>. 37signals (Basecamp, HEY) עזבו בפומבי את ה-compute של AWS ב-2023 עם חשבון של כ-$3.2M בשנה, וצפו חיסכון של כ-$7M על פני חמש שנים.</p>
<p><strong>Bare metal מנצח כש:</strong></p>
<ul>
<li>העומס יציב וצפוי (baseline שאף פעם לא יורד לאפס).</li>
<li>ה-egress עצום: וידאו, origin של CDN, עדכוני משחקים, ייצוא דאטה.</li>
<li>GPUs רצים 24/7: שרת 8× H100 עולה כ-$250-300k וצורך כ-10kW; בכ-$3 לשעת GPU זה כ-$17.5k לחודש בשכירות, אז בעלות מחזירה את עצמה בהרבה פחות משנתיים בניצולת גבוהה.</li>
<li>אתה צריך חומרה שהענן לא מוכר, או ריבונות דאטה ו-latency מחמירים (מסחר, telco edge).</li>
</ul>
<p><strong>הענן מנצח כש:</strong> העומס קופצני או לא ידוע, הצוות קטן, אתה נשען על managed services (בסיסי נתונים מנוהלים, תורים, IAM, 30 regions), מהירות השינוי חשובה יותר מעלות היחידה, או שזמני האספקה של חומרה (8-16 שבועות, יותר ל-GPUs) יתקעו את העסק. הרבה חברות מגיעות להיברידי: הבסיס היציב על metal, הקפיצות וה-managed services בענן.</p>
<blockquote>💡 מהשטח: התקלה הנפוצה ביותר ב-bare metal היא לא חומרה - היא תכנון קיבולת. תזמין מעט מדי ולא תוכל לשחרר פיצ'ר 3 חודשים; תזמין יותר מדי ושילמת מראש על racks ריקים. תעקוב אחרי ניצולת כל שבוע ותשאיר מרווח של כ-20-30% ועוד מסלול burst לענן.</blockquote>`
      }
    }
  ],
  diagram: `   Utility A ──UPS A──PDU-A ─┐                  ┌─ PDU-B──UPS B── Utility B
                             │   RACK R07 (42U) │
        U42 [ToR leaf-1  ]───┼── 2x100G up to spines (prod / data network)
        U41 [ToR leaf-2  ]───┤
        U40 [mgmt switch ]───┼── OOB network: BMC ports only -> bastion/VPN
        U39 [patch panel ]   │
        U22 [server  PSU1 ←A │ PSU2 ←B]  eth: 2x25G bond0 -> leaf-1/leaf-2 (MLAG)
            [        BMC ────┘ (iDRAC/iLO) -> mgmt switch, Redfish/IPMI]
        ...
   COLD AISLE (front, ~24 C) -> servers -> HOT AISLE (rear, ~40 C) -> CRAH units

   Provisioning: BMC "bootdev pxe" -> NIC PXE -> DHCP -> TFTP (iPXE) -> HTTP (kernel, initrd) -> autoinstall -> reboot -> join cluster`,
  handsOn: [
    { cmd: "sudo dmidecode -t system -t memory | grep -E 'Manufacturer|Product|Serial|Size|Locator' | head -20", what: { en: "Read the hardware inventory from the server itself: vendor, model, serial number and which DIMM sits in which slot - what you paste into an RMA ticket.", he: "לקרוא את ה-inventory של החומרה מהשרת עצמו: יצרן, דגם, מספר סידורי ואיזה DIMM יושב באיזה slot - מה שמדביקים בטיקט RMA." } },
    { cmd: "sudo ipmitool sel elist | tail -20 && sudo ipmitool sdr type 'Power Supply'", what: { en: "Local IPMI (no network): the hardware event log with readable timestamps, and PSU status - redundancy lost shows up here before anything breaks.", he: "IPMI מקומי (בלי רשת): לוג אירועי החומרה עם זמנים קריאים, ומצב ספקי הכוח - אובדן שרידות מופיע כאן לפני שמשהו נשבר." } },
    { cmd: "sudo smartctl -a /dev/nvme0 | grep -Ei 'percentage used|media|critical|power on'", what: { en: "NVMe health: wear percentage, media errors and critical warnings - the data you need to decide on proactive replacement.", he: "בריאות ה-NVMe: אחוז שחיקה, media errors ו-critical warnings - הנתונים שצריך כדי להחליט על החלפה מונעת." } },
    { cmd: "sudo edac-util -v || grep . /sys/devices/system/edac/mc/mc*/ce_count", what: { en: "Correctable memory-error counters per memory controller. A count that keeps climbing on one DIMM means replace it before it turns uncorrectable.", he: "counters של שגיאות זיכרון correctable לכל memory controller. מספר שממשיך לעלות על DIMM אחד אומר להחליף אותו לפני שזה יהפוך ל-uncorrectable." } }
  ],
  mnemonic: {
    en: "Power before space, A and B under half, BMC on its own LAN, PXE → TFTP → HTTP → install. Metal for the steady baseline, cloud for the spikes.",
    he: "חשמל לפני מקום, A ו-B מתחת לחצי, BMC ב-LAN משלו, PXE ← TFTP ← HTTP ← install. metal ל-baseline היציב, ענן לקפיצות."
  },
  pitfalls: [
    { en: "Loading both power feeds above 50%: it all works until one feed fails and the other trips from the doubled load, taking the whole rack down despite dual PSUs.", he: "להעמיס את שני קווי החשמל מעל 50%: הכל עובד עד שקו אחד נופל והשני קופץ מהעומס הכפול, ומפיל את כל ה-rack למרות ספקי כוח כפולים." },
    { en: "Putting BMCs on the production network or the Internet: IPMI hash disclosure and default passwords make them a top breach path, and a compromised BMC survives OS reinstalls.", he: "לשים BMCs על רשת הפרודקשן או על האינטרנט: חשיפת ה-hash של IPMI וסיסמאות ברירת מחדל הופכות אותם לדרך פריצה מובילה, ו-BMC שנפרץ שורד התקנה מחדש של ה-OS." },
    { en: "Comparing a server's purchase price with an on-demand cloud price: compare against 3-year committed pricing, and add people, spares, network, power and capacity headroom on the metal side.", he: "להשוות מחיר קנייה של שרת למחיר on-demand בענן: תשווה למחיר עם התחייבות ל-3 שנים, ותוסיף בצד ה-metal אנשים, חלקי חילוף, רשת, חשמל ומרווח קיבולת." },
    { en: "Skipping burn-in and firmware baselines: early-life failures and mixed firmware versions then show up as 'random' production flakiness that is very hard to pin down.", he: "לדלג על burn-in ועל baseline של firmware: תקלות של תחילת חיים וגרסאות firmware מעורבבות מופיעות אחר כך כ'חוסר יציבות אקראי' בפרודקשן שקשה מאוד לאתר." }
  ],
  interview: [
    {
      q: { en: "A server in a colo 2,000 km away is hung and doesn't answer SSH. Walk me through recovering it without remote hands.", he: "שרת ב-colo במרחק 2,000 ק\"מ תקוע ולא עונה ל-SSH. תסביר איך תשחזר אותו בלי remote hands." },
      a: { en: "Go through the out-of-band network to the BMC. Check power state and the SEL (ipmitool sel elist / Redfish LogServices) for ECC, PSU or thermal events. Open serial-over-LAN or the virtual console to see whether it's a kernel panic, stuck boot, or emergency shell. If needed, power cycle via IPMI/Redfish; if the OS is broken, set bootdev to PXE or mount a rescue ISO as virtual media and repair or reprovision. Only if the BMC itself is unreachable do you need hands (or a smart PDU outlet power cycle).", he: "נכנסים דרך רשת ה-out-of-band ל-BMC. בודקים מצב חשמל ואת ה-SEL (ipmitool sel elist או LogServices ב-Redfish) לאירועי ECC, ספק כוח או חום. פותחים serial-over-LAN או את הקונסולה הווירטואלית כדי לראות אם זה kernel panic, boot תקוע או emergency shell. אם צריך, power cycle דרך IPMI או Redfish; אם ה-OS שבור, קובעים bootdev ל-PXE או מחברים ISO של rescue כ-virtual media ומתקנים או עושים provisioning מחדש. רק אם ה-BMC עצמו לא נגיש צריך ידיים (או power cycle לשקע ב-smart PDU)." }
    },
    {
      q: { en: "Why does type: LoadBalancer stay pending on a bare-metal Kubernetes cluster, and how do MetalLB's two modes differ?", he: "למה type: LoadBalancer נשאר pending ב-cluster של Kubernetes על bare metal, ומה ההבדל בין שני המצבים של MetalLB?" },
      a: { en: "There is no cloud controller manager to create an external load balancer. MetalLB assigns IPs from a pool and announces them. In L2 mode one elected node answers ARP for the VIP (gratuitous ARP on failover, a few seconds); simple, works with any switch, but all traffic for that VIP enters through one node. In BGP mode every node running the service peers with the top-of-rack routers and announces a /32, so the routers ECMP across nodes - real load spreading and faster failover, but you need routers that speak BGP and network team buy-in.", he: "אין cloud controller manager שייצור load balancer חיצוני. MetalLB מקצה IPs מתוך pool ומכריז עליהם. במצב L2, node נבחר אחד עונה ל-ARP של ה-VIP (gratuitous ARP ב-failover, כמה שניות); פשוט, עובד עם כל switch, אבל כל התעבורה ל-VIP נכנסת דרך node אחד. במצב BGP כל node שמריץ את השירות עושה peering עם ה-routers של ה-top-of-rack ומכריז על /32, וה-routers עושים ECMP בין ה-nodes - פיזור עומס אמיתי ו-failover מהיר יותר, אבל צריך routers שמדברים BGP ושיתוף פעולה של צוות הרשת." }
    },
    {
      q: { en: "Your CFO asks whether to move off the cloud. What do you need to know before answering?", he: "ה-CFO שואל אם לעזוב את הענן. מה אתה צריך לדעת לפני שאתה עונה?" },
      a: { en: "The shape of the load (steady baseline vs spikes; what fraction never scales down), what the bill is made of (compute vs egress vs managed services - you can't easily replace managed DBs and IAM), current commitment discounts, growth forecast and how far ahead we can plan hardware, GPU needs, compliance/residency, and whether we have or can hire people for hardware ops. Usually the answer is hybrid: move the steady, egress-heavy or GPU baseline, keep spiky and managed-service-heavy workloads in the cloud.", he: "צורת העומס (baseline יציב מול קפיצות; איזה חלק אף פעם לא יורד), ממה מורכב החשבון (compute מול egress מול managed services - קשה להחליף בסיסי נתונים מנוהלים ו-IAM), הנחות התחייבות קיימות, תחזית צמיחה וכמה זמן מראש אפשר לתכנן חומרה, צורך ב-GPUs, רגולציה וריבונות דאטה, והאם יש לנו או שנוכל לגייס אנשים לתפעול חומרה. בדרך כלל התשובה היא היברידי: להעביר את ה-baseline היציב, כבד ה-egress או ה-GPU, ולהשאיר בענן את מה שקופצני ונשען על managed services." }
    }
  ],
  quiz: [
    {
      q: { en: "A rack has A and B feeds, each rated 8.6 kW usable. What's the maximum safe IT load for the rack?", he: "ל-rack יש קווי A ו-B, כל אחד עם 8.6kW שמישים. מה העומס המקסימלי הבטוח ל-rack?" },
      options: [
        { en: "17.2 kW - both feeds add up", he: "17.2kW - שני הקווים מצטברים" },
        { en: "8.6 kW - either feed must carry the whole rack alone", he: "8.6kW - כל קו צריך להיות מסוגל לשאת את כל ה-rack לבד" },
        { en: "4.3 kW - half of one feed", he: "4.3kW - חצי מקו אחד" },
        { en: "12.9 kW - 75% of the total", he: "12.9kW - 75% מהסך" }
      ],
      answer: 1,
      explain: { en: "Redundancy means surviving the loss of one feed, so the total rack load must fit on one feed: 8.6 kW, i.e. each feed runs at most ~50% in normal operation. 17.2 kW works only until one feed fails, then the other trips too.", he: "שרידות אומרת לשרוד אובדן של קו אחד, אז כל העומס של ה-rack חייב להיכנס בקו אחד: 8.6kW, כלומר כל קו עובד לכל היותר בכ-50% בשגרה. 17.2kW עובד רק עד שקו אחד נופל, ואז גם השני קופץ." }
    },
    {
      q: { en: "What is the BMC (iDRAC/iLO) and why does it matter?", he: "מה זה BMC (iDRAC או iLO) ולמה זה חשוב?" },
      options: [
        { en: "A RAID controller that mirrors the boot disk", he: "בקר RAID שעושה mirror לדיסק ה-boot" },
        { en: "An independent management computer on the motherboard that controls power, console and media even when the OS is dead or the server is off", he: "מחשב ניהול עצמאי על לוח האם ששולט בחשמל, בקונסולה וב-media גם כשה-OS מת או שהשרת כבוי" },
        { en: "A BIOS setting that enables PXE boot", he: "הגדרת BIOS שמאפשרת PXE boot" },
        { en: "The hypervisor layer that cloud providers run", he: "שכבת ה-hypervisor שספקי ענן מריצים" }
      ],
      answer: 1,
      explain: { en: "The BMC is a separate always-on controller with its own network port, reachable via IPMI or Redfish. It's what makes remote power cycling, serial-over-LAN, virtual media and automated provisioning possible.", he: "ה-BMC הוא בקר נפרד שתמיד דולק, עם port רשת משלו, ונגיש ב-IPMI או ב-Redfish. הוא מה שמאפשר power cycle מרחוק, serial-over-LAN, virtual media ו-provisioning אוטומטי." }
    },
    {
      q: { en: "What's the correct order of a typical network install?", he: "מה הסדר הנכון של התקנה טיפוסית מהרשת?" },
      options: [
        { en: "TFTP → DHCP → PXE → installer", he: "TFTP → DHCP → PXE → installer" },
        { en: "PXE firmware → DHCP (IP + next-server + filename) → TFTP bootloader/iPXE → HTTP kernel+initrd → automated installer", he: "PXE firmware ← DHCP (IP, next-server ושם קובץ) ← TFTP ל-bootloader או iPXE ← HTTP ל-kernel ו-initrd ← installer אוטומטי" },
        { en: "DNS → HTTP → PXE → TFTP", he: "DNS → HTTP → PXE → TFTP" },
        { en: "BMC downloads the OS image and writes it to disk directly", he: "ה-BMC מוריד את ה-image של ה-OS וכותב אותו ישירות לדיסק" }
      ],
      answer: 1,
      explain: { en: "The NIC's PXE ROM needs an IP and to know where to fetch from (DHCP), then pulls a small loader over TFTP; iPXE switches to HTTP for the heavy kernel/initrd, which boots the unattended installer.", he: "ה-PXE ROM של הכרטיס צריך IP ולדעת מאיפה למשוך (DHCP), ואז מושך loader קטן ב-TFTP; iPXE עובר ל-HTTP בשביל ה-kernel וה-initrd הכבדים, שמעלים את ה-installer האוטומטי." }
    },
    {
      q: { en: "Which workload is the strongest case for bare metal over cloud?", he: "איזה workload הוא המקרה החזק ביותר ל-bare metal על פני ענן?" },
      options: [
        { en: "A new startup's API with unknown traffic", he: "API של סטארט-אפ חדש עם תעבורה לא ידועה" },
        { en: "A Black Friday shop that needs 10× capacity for 3 days a year", he: "חנות ל-Black Friday שצריכה פי 10 קיבולת ל-3 ימים בשנה" },
        { en: "A video platform serving a steady 2 PB/month of egress from a constant fleet", he: "פלטפורמת וידאו שמגישה egress יציב של 2PB בחודש מצי קבוע" },
        { en: "An internal tool used by 20 people", he: "כלי פנימי ש-20 אנשים משתמשים בו" }
      ],
      answer: 2,
      explain: { en: "Steady load plus massive egress is where cloud pricing hurts most: ~$0.05/GB × 2 PB is ~$100k/month, versus a few thousand dollars of IP transit. Spiky, unknown or tiny workloads favor the cloud.", he: "עומס יציב ועוד egress עצום זה בדיוק איפה שתמחור הענן כואב הכי הרבה: כ-$0.05 ל-GB כפול 2PB זה כ-$100k לחודש, לעומת כמה אלפי דולרים של IP transit. עומסים קופצניים, לא ידועים או קטנים מעדיפים ענן." }
    }
  ],
  related: ["vms", "linux-boot-rescue", "disks-hdd-ssd-nvme", "raid-levels-deep", "cloud-models", "cloud-finops", "cloud-data-transfer-costs", "ai-gpu-clusters", "k8s-services", "net-l2-switching"]
});

/* ------------------------------------------------------------ Glossary */
INFRA.glossary.push({ term: "VLAN", track: "networking", def: { en: "Virtual LAN: an 802.1Q tag (12-bit ID, 4094 usable) that splits one physical switch network into separate broadcast domains; traffic between VLANs must be routed.", he: "Virtual LAN: tag של 802.1Q (מזהה של 12 ביט, 4094 שמישים) שמפצל רשת switches פיזית אחת לכמה broadcast domains נפרדים; תעבורה בין VLANs חייבת לעבור routing." }, lesson: "net-l2-switching" });
INFRA.glossary.push({ term: "ARP", track: "networking", def: { en: "Address Resolution Protocol: broadcasts 'who has this IPv4 address?' to learn the MAC on the local segment; gratuitous ARP announces an IP move (VIP failover).", he: "Address Resolution Protocol: שולח broadcast של 'למי יש את כתובת ה-IPv4 הזאת?' כדי ללמוד את ה-MAC ב-segment המקומי; gratuitous ARP מכריז על מעבר של IP (failover של VIP)." }, lesson: "net-l2-switching" });
INFRA.glossary.push({ term: "LACP", track: "networking", def: { en: "Link Aggregation Control Protocol (802.3ad): negotiates a bundle of links between a host and switch(es); flows are hashed onto members, so one flow never exceeds one link's speed.", he: "Link Aggregation Control Protocol (802.3ad): מנהל משא ומתן על איגוד links בין שרת ל-switch; ה-flows מתחלקים לפי hash בין החברים, אז flow אחד אף פעם לא עובר את המהירות של link אחד." }, lesson: "net-l2-switching" });
INFRA.glossary.push({ term: "Spanning Tree (STP)", track: "networking", def: { en: "Protocol that elects a root bridge and blocks redundant switch links so Ethernet (which has no TTL) can't form a broadcast loop; RSTP converges in seconds instead of 30-50 s.", he: "פרוטוקול שבוחר root bridge וחוסם links כפולים בין switches, כדי ש-Ethernet (שאין לו TTL) לא ייצור לולאת broadcast; RSTP מתכנס תוך שניות במקום 30-50 שניות." }, lesson: "net-l2-switching" });
INFRA.glossary.push({ term: "BMC", track: "foundations", def: { en: "Baseboard Management Controller (iDRAC, iLO): an always-on controller in a server for remote power, console, virtual media and hardware logs, reached via IPMI or Redfish on an out-of-band network.", he: "Baseboard Management Controller (iDRAC, iLO): בקר שתמיד דולק בשרת, לשליטה מרחוק בחשמל, בקונסולה, ב-virtual media ובלוגי חומרה, נגיש ב-IPMI או ב-Redfish דרך רשת out-of-band." }, lesson: "datacenter-bare-metal" });
INFRA.glossary.push({ term: "PXE boot", track: "foundations", def: { en: "Network boot: the NIC firmware gets an IP and boot file from DHCP, downloads a loader over TFTP (often iPXE, which continues over HTTP) and starts an automated installer.", he: "boot מהרשת: ה-firmware של כרטיס הרשת מקבל IP וקובץ boot מ-DHCP, מוריד loader ב-TFTP (הרבה פעמים iPXE, שממשיך ב-HTTP) ומעלה installer אוטומטי." }, lesson: "datacenter-bare-metal" });
INFRA.glossary.push({ term: "PUE", track: "foundations", def: { en: "Power Usage Effectiveness = total facility power / IT equipment power; 1.0 is perfect, industry average ~1.5, hyperscalers ~1.1.", he: "Power Usage Effectiveness = כל החשמל של המתקן חלקי החשמל של ציוד ה-IT; 1.0 זה מושלם, הממוצע בתעשייה כ-1.5, ה-hyperscalers כ-1.1." }, lesson: "datacenter-bare-metal" });

/* ------------------------------------------------------------ Scenario */
(function () {
  function t(en, he) { return { en: en, he: he }; }
  function c(enLabel, heLabel, next, score, enFb, heFb) {
    return { label: t(enLabel, heLabel), next: next, score: score, feedback: t(enFb, heFb) };
  }
  INFRA.scenarios.push({
    id: "broadcast-storm-loop",
    icon: "🌀",
    title: t("The whole floor is down: a broadcast storm", "כל הקומה למטה: broadcast storm"),
    start: "s1",
    steps: {
      s1: {
        text: t("10:42. Every server and phone on floor 2 and the on-prem lab rack dropped at once. Monitoring shows 300 hosts unreachable, SSH to the floor switch times out, and the one session you get is painfully slow. Someone mentions a contractor was 'tidying up cables' in the lab.",
                "10:42. כל השרתים והטלפונים בקומה 2 וה-rack של המעבדה נפלו בבת אחת. הניטור מראה 300 מחשבים לא נגישים, SSH ל-switch של הקומה עושה timeout, והסשן היחיד שמצליח איטי להחריד. מישהו מזכיר שקבלן 'סידר כבלים' במעבדה."),
        data: `sw-floor2# show processes cpu sorted | include CPU|Hulc|ARP
CPU utilization for five seconds: 99%/71%; one minute: 98%; five minutes: 93%
 PID Runtime(ms)   Invoked      uSecs   5Sec   1Min   5Min TTY Process
 121   918234112  48123411         19 38.42% 37.90% 35.11%   0 Hulc LED Process
  76   501234113  92341234          5 21.07% 20.85% 19.44%   0 ARP Input`,
        choices: [
          c("Check interface counters for where the broadcast traffic is coming from", "לבדוק את ה-counters של ה-interfaces כדי לראות מאיפה מגיע ה-broadcast", "s2", 15,
            "Right. 99% CPU with ARP Input near the top and everything down at once smells like a broadcast storm. Counters will point at the ports.",
            "נכון. 99% CPU עם ARP Input למעלה והכל נופל בבת אחת מריח כמו broadcast storm. ה-counters יצביעו על ה-ports."),
          c("Reload the floor switch to clear the CPU", "לעשות reload ל-switch של הקומה כדי לנקות את ה-CPU", "s1b", -15,
            "A reload takes 5-10 minutes and, if the cause is a physical loop, the storm comes back the second the ports come up.",
            "reload לוקח 5-10 דקות, ואם הסיבה היא לולאה פיזית, ה-storm חוזר בשנייה שה-ports עולים."),
          c("Open a ticket with the ISP - it must be the Internet link", "לפתוח טיקט לספק האינטרנט - זה בטח הקו", "s1b", -10,
            "Internal hosts can't even reach each other on the same switch. This is local, not the WAN.",
            "מחשבים פנימיים לא מצליחים להגיע אחד לשני על אותו switch. זה מקומי, לא ה-WAN.")
        ]
      },
      s1b: {
        text: t("You lose 12 minutes. After the reload the switch comes back, works for about 40 seconds, then CPU pegs at 100% again and everything drops. The cause is clearly still connected.",
                "הפסדת 12 דקות. אחרי ה-reload ה-switch חוזר, עובד בערך 40 שניות, ואז ה-CPU נתקע שוב על 100% והכל נופל. ברור שהסיבה עדיין מחוברת."),
        choices: [
          c("OK - look at interface counters this time", "בסדר - הפעם לבדוק את ה-counters של ה-interfaces", "s2", 5,
            "Better late than never. Evidence before actions.",
            "עדיף מאוחר מאשר אף פעם. ראיות לפני פעולות."),
          c("Reload the distribution switch too", "לעשות reload גם ל-distribution switch", "lose", -20,
            "Now two buildings are dark and the loop is still there.",
            "עכשיו שני בניינים חשוכים והלולאה עדיין שם.")
        ]
      },
      s2: {
        text: t("Two access ports have broadcast counters in the hundreds of millions and climbing tens of thousands per second; everything else looks normal. The log is full of MAC flapping messages.",
                "לשני access ports יש broadcast counters של מאות מיליונים, שעולים בעשרות אלפים בשנייה; כל השאר נראה רגיל. הלוג מלא בהודעות MAC flapping."),
        data: `sw-floor2# show interfaces counters | include Port|Gi1/0/1[12]|Gi1/0/3
Port        InOctets     InUcastPkts  InMcastPkts   InBcastPkts
Gi1/0/3      1203344        10233          221          3412
Gi1/0/11  98123441234      1203412     88123401     912340123
Gi1/0/12  97880012311      1199820     88011220     910887561

sw-floor2# show logging | include MACFLAP
%SW_MATM-4-MACFLAP_NOTIF: Host 0050.56a1.2b3c in vlan 20 is flapping between port Gi1/0/11 and port Gi1/0/12
%SW_MATM-4-MACFLAP_NOTIF: Host 3cfd.feaa.bb01 in vlan 20 is flapping between port Gi1/0/12 and port Gi1/0/11`,
        choices: [
          c("Check STP state and the config on Gi1/0/11 and Gi1/0/12", "לבדוק מצב STP ואת ההגדרות של Gi1/0/11 ו-Gi1/0/12", "s3", 15,
            "Yes. The same MACs bouncing between two ports in one VLAN means those ports are connected to each other somewhere. Why didn't STP block one of them?",
            "כן. אותן כתובות MAC שקופצות בין שני ports באותו VLAN אומר שה-ports האלה מחוברים אחד לשני איפשהו. למה STP לא חסם אחד מהם?"),
          c("Shut down the uplink to the distribution switch to contain it", "לכבות את ה-uplink ל-distribution switch כדי לבודד", "s3", -5,
            "It protects the rest of the campus, but floor 2 stays down and the loop is still alive. You still need the two ports.",
            "זה מגן על שאר הקמפוס, אבל קומה 2 נשארת למטה והלולאה עדיין חיה. עדיין צריך את שני ה-ports.")
        ]
      },
      s3: {
        text: t("Both ports are edge ports in the lab. Someone added bpdufilter months ago 'to stop log noise'. In the lab, the contractor plugged a small desk switch into two wall jacks to 'add redundancy'.",
                "שני ה-ports הם edge ports במעבדה. מישהו הוסיף bpdufilter לפני כמה חודשים 'כדי שהלוגים ישתקו'. במעבדה, הקבלן חיבר switch שולחני קטן לשני שקעים בקיר כדי 'להוסיף שרידות'."),
        data: `sw-floor2# show running-config interface Gi1/0/12
interface GigabitEthernet1/0/12
 description LAB-WALL-2B
 switchport access vlan 20
 switchport mode access
 spanning-tree portfast
 spanning-tree bpdufilter enable

sw-floor2# show spanning-tree interface Gi1/0/12 detail | include BPDU|Bpdu
   Bpdu filter is enabled
   BPDU: sent 0, received 0`,
        choices: [
          c("Shut Gi1/0/12 now to break the loop", "לכבות עכשיו את Gi1/0/12 כדי לשבור את הלולאה", "s4", 20,
            "Correct: break the loop first, investigate later. Within seconds CPU falls and hosts come back.",
            "נכון: קודם לשבור את הלולאה, לחקור אחר כך. תוך שניות ה-CPU יורד והמחשבים חוזרים."),
          c("Enable storm-control on all ports first, then decide", "להפעיל קודם storm-control על כל ה-ports, ואז להחליט", "s4", 5,
            "Storm-control limits the damage, but the loop is still there and legitimate broadcast (ARP, DHCP) gets dropped too. Shutting the port was the direct fix.",
            "storm-control מגביל את הנזק, אבל הלולאה עדיין שם וגם broadcast לגיטימי (ARP, DHCP) נזרק. לכבות את ה-port היה התיקון הישיר."),
          c("Remove bpdufilter on the two ports and let STP sort it out", "להסיר את bpdufilter משני ה-ports ולתת ל-STP לסדר", "s4", 5,
            "It can work, but on a switch at 99% CPU, BPDU processing is unreliable and it takes seconds to converge. Shut first.",
            "זה יכול לעבוד, אבל ב-switch על 99% CPU עיבוד ה-BPDUs לא אמין ולוקח שניות להתכנס. קודם לכבות.")
        ]
      },
      s4: {
        text: t("10:58. Loop broken, CPU back to 8%, hosts recovering. The desk switch is unplugged. How do you make sure the next stray cable doesn't do this again?",
                "10:58. הלולאה נשברה, ה-CPU חזר ל-8%, המחשבים מתאוששים. ה-switch השולחני נותק. איך אתה מוודא שהכבל התועה הבא לא יעשה את זה שוב?"),
        data: `sw-floor2(config)# interface range Gi1/0/1 - 46
sw-floor2(config-if-range)# no spanning-tree bpdufilter enable
sw-floor2(config-if-range)# spanning-tree bpduguard enable
sw-floor2(config-if-range)# storm-control broadcast level 1.00
sw-floor2(config)# errdisable recovery cause bpduguard
sw-floor2(config)# errdisable recovery interval 300`,
        choices: [
          c("Apply this on every access switch: remove bpdufilter, enable BPDU guard + storm-control, then test it with a looped cable in the lab", "להחיל את זה על כל ה-access switches: להסיר bpdufilter, להפעיל BPDU guard ו-storm-control, ואז לבדוק עם כבל בלולאה במעבדה", "s5", 20,
            "That's the real fix: an edge port that hears a BPDU now err-disables instantly, so a loop costs one port, not a floor. Testing proves it.",
            "זה התיקון האמיתי: edge port ששומע BPDU עובר עכשיו ל-err-disabled מיד, אז לולאה עולה port אחד, לא קומה. הבדיקה מוכיחה את זה."),
          c("Ban desk switches by email and close the incident", "לאסור switches שולחניים במייל ולסגור את האינצידנט", "lose", -15,
            "Policies don't stop cables. Two months later the same thing happens in another room, with the same config still in place.",
            "מדיניות לא עוצרת כבלים. חודשיים אחר כך אותו דבר קורה בחדר אחר, עם אותן הגדרות בדיוק.")
        ]
      },
      s5: {
        text: t("Test passes: looping a cable in the lab err-disables one port in under a second, nothing else notices. For the postmortem, what else is worth checking?",
                "הבדיקה עברה: כבל בלולאה במעבדה מעביר port אחד ל-err-disabled בפחות משנייה, ואף אחד אחר לא מרגיש. מה עוד שווה לבדוק בשביל ה-postmortem?"),
        data: `%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi1/0/12 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Gi1/0/12, putting Gi1/0/12 in err-disable state`,
        choices: [
          c("Confirm the root bridge is the core switch with an explicit priority, alert on MACFLAP/err-disable logs, and add a config check that rejects bpdufilter on access ports", "לוודא שה-root bridge הוא ה-core switch עם priority מפורש, להתריע על לוגים של MACFLAP ו-err-disable, ולהוסיף בדיקת config שדוחה bpdufilter על access ports", "win", 20,
            "Excellent. A deterministic STP root, alerts that would have fired at 10:42:05, and a guardrail so the dangerous config can't come back.",
            "מצוין. root של STP צפוי, התראות שהיו קופצות ב-10:42:05, ומעקה בטיחות כדי שההגדרה המסוכנת לא תחזור."),
          c("Nothing more, it's fixed", "שום דבר, זה תוקן", "win", 0,
            "It is fixed, but nobody would get alerted next time and the next 'cleanup' could re-add bpdufilter.",
            "זה תוקן, אבל אף אחד לא יקבל התראה בפעם הבאה, וה'ניקיון' הבא יכול להחזיר את bpdufilter.")
        ]
      },
      win: {
        text: t("Floor restored in 16 minutes, root cause removed on every access switch, and a loop now costs exactly one err-disabled port. Lesson: break the loop first, then make sure STP and BPDU guard can actually see the next one.",
                "הקומה חזרה תוך 16 דקות, שורש הבעיה הוסר מכל ה-access switches, ולולאה עולה עכשיו בדיוק port אחד ב-err-disabled. הלקח: קודם לשבור את הלולאה, ואז לוודא ש-STP ו-BPDU guard באמת יכולים לראות את הבאה."),
        end: "win"
      },
      lose: {
        text: t("The outage drags on (or repeats) because the loop - two cables into an edge port with bpdufilter - was never removed and nothing stops the next one. Read the lesson on switches, STP and BPDU guard and try again.",
                "ההשבתה נמשכת (או חוזרת) כי הלולאה - שני כבלים ל-edge port עם bpdufilter - אף פעם לא הוסרה ושום דבר לא עוצר את הבאה. תקרא את השיעור על switches, STP ו-BPDU guard ותנסה שוב."),
        end: "lose"
      }
    },
    lessons: ["net-l2-switching", "net-troubleshooting", "net-errors-by-layer"]
  });
})();
