// Fundamentals from the ground up — bits & units, TCP vs UDP, the memory hierarchy
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
var INFRA = window.INFRA; // explicit binding so the file also runs in non-browser sandboxes (tools/validate.js)

/* ============================== BITS, BYTES & UNITS ============================== */
INFRA.lessons.push({
  id: "bits-bytes-units",
  track: "foundations",
  order: 30,
  icon: "🔢",
  level: 1,
  minutes: 11,
  title: { en: "Bits, Bytes & Units: the math behind every capacity number", he: "Bits, Bytes ויחידות: החשבון שמאחורי כל מספר של קיבולת" },
  tldr: {
    en: "Networks count bits in powers of 1000, RAM counts bytes in powers of 1024, and most unit incidents come from mixing the two: a 1 Gbps link moves ~125 MB/s at best, a '1 TB' disk is 931 GiB, and 1 TB over 1 Gbps takes over 2 hours.",
    he: "רשתות סופרות bits בחזקות של 1000, זיכרון סופר bytes בחזקות של 1024, ורוב התקלות של יחידות באות מערבוב בין השניים: לינק של 1 Gbps מעביר במקרה הטוב בערך 125 MB/s, דיסק של '1 TB' הוא 931 GiB, ו-1 TB על לינק של 1 Gbps לוקח יותר משעתיים."
  },
  analogy: {
    en: "A bit is a single light switch: on or off. A byte is a row of 8 switches — enough to spell one English letter. Network people sell you the speed of the conveyor belt in switches per second (bits), storage people sell you the size of the warehouse in rows (bytes), and the marketing department rounds everything to the nearest thousand while your operating system counts in 1024s. Your job is to be the one person in the room who converts before multiplying.",
    he: "Bit זה מתג אור בודד: דלוק או כבוי. Byte זו שורה של 8 מתגים — מספיק כדי לייצג אות אחת באנגלית. אנשי הרשת מוכרים לך את מהירות המסוע במתגים לשנייה (bits), אנשי ה-storage מוכרים לך את גודל המחסן בשורות (bytes), מחלקת השיווק מעגלת הכל לאלפים, ומערכת ההפעלה שלך סופרת ב-1024. התפקיד שלך: להיות האדם היחיד בחדר שממיר יחידות לפני שהוא מכפיל."
  },
  sections: [
    {
      h: { en: "Bit, byte, word — and the KB vs KiB trap", he: "Bit, byte, word — והמלכודת של KB מול KiB" },
      body: {
        en: `<p>A <strong>bit</strong> (lowercase <code>b</code>) is 0 or 1. A <strong>nibble</strong> is 4 bits — exactly one hex digit. A <strong>byte</strong> (uppercase <code>B</code>) is 8 bits: 256 possible values (0–255). A <strong>word</strong> is the CPU's natural integer size: 64 bits on x86-64 and ARM64 (confusingly, Intel assembly still calls 16 bits a "WORD" for historical reasons).</p>
<p>Then the prefixes. SI prefixes are powers of 1000; IEC binary prefixes are powers of 1024:</p>
<table>
<tr><th>SI (decimal)</th><th>Bytes</th><th>IEC (binary)</th><th>Bytes</th><th>Gap</th></tr>
<tr><td>1 KB</td><td>1,000</td><td>1 KiB</td><td>1,024</td><td>2.4%</td></tr>
<tr><td>1 MB</td><td>1,000,000</td><td>1 MiB</td><td>1,048,576</td><td>4.9%</td></tr>
<tr><td>1 GB</td><td>10^9</td><td>1 GiB</td><td>1,073,741,824</td><td>7.4%</td></tr>
<tr><td>1 TB</td><td>10^12</td><td>1 TiB</td><td>1,099,511,627,776</td><td>10.0%</td></tr>
</table>
<p>The gap grows with every step. That is why a disk sold as <strong>1 TB</strong> (10^12 bytes, the vendor uses SI) shows up as <strong>931 GiB</strong> in your OS: 10^12 ÷ 1,073,741,824 = 931.3. Nobody stole 69 GB — it's the same bytes counted with a different ruler.</p>
<pre>$ df -h /data      # -h = powers of 1024 (G means GiB)
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme1n1    916G  210G  660G  25% /data
$ df -H /data      # -H = powers of 1000 (G means GB)
/dev/nvme1n1    984G  226G  709G  25% /data</pre>
<p>(916 GiB rather than 931 because the filesystem itself reserves space for metadata and, on ext4, 5% for root.)</p>
<blockquote>⚠️ Production tip: in Kubernetes <code>memory: 512M</code> is 512,000,000 bytes and <code>512Mi</code> is 536,870,912 bytes — 4.9% apart. And <code>memory: 512m</code> (lowercase m) means 0.512 <em>bytes</em>: a real typo that produces Pods which can never be scheduled or die instantly. Always use <code>Mi</code>/<code>Gi</code>.</blockquote>`,
        he: `<p><strong>Bit</strong> (באות קטנה, <code>b</code>) הוא 0 או 1. <strong>Nibble</strong> זה 4 bits — בדיוק ספרת hex אחת. <strong>Byte</strong> (באות גדולה, <code>B</code>) זה 8 bits: ‏256 ערכים אפשריים (0 עד 255). <strong>Word</strong> זה גודל המספר הטבעי של המעבד: 64 bits ב-x86-64 וב-ARM64 (ובלבול היסטורי: ב-assembly של Intel עדיין קוראים ל-16 bits בשם WORD).</p>
<p>ועכשיו הקידומות. קידומות SI הן חזקות של 1000; קידומות בינאריות של IEC הן חזקות של 1024:</p>
<table>
<tr><th>SI (עשרוני)</th><th>Bytes</th><th>IEC (בינארי)</th><th>Bytes</th><th>פער</th></tr>
<tr><td>1 KB</td><td>1,000</td><td>1 KiB</td><td>1,024</td><td>2.4%</td></tr>
<tr><td>1 MB</td><td>1,000,000</td><td>1 MiB</td><td>1,048,576</td><td>4.9%</td></tr>
<tr><td>1 GB</td><td>10^9</td><td>1 GiB</td><td>1,073,741,824</td><td>7.4%</td></tr>
<tr><td>1 TB</td><td>10^12</td><td>1 TiB</td><td>1,099,511,627,776</td><td>10.0%</td></tr>
</table>
<p>הפער גדל בכל מדרגה. בגלל זה דיסק שנמכר כ-<strong>1 TB</strong> (10^12 bytes, היצרן משתמש ב-SI) מופיע אצלך במערכת ההפעלה כ-<strong>931 GiB</strong>: ‏10^12 חלקי 1,073,741,824 = 931.3. אף אחד לא גנב לך 69 GB — אלה אותם bytes שנמדדים בסרגל אחר.</p>
<pre>$ df -h /data      # -h = powers of 1024 (G means GiB)
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme1n1    916G  210G  660G  25% /data
$ df -H /data      # -H = powers of 1000 (G means GB)
/dev/nvme1n1    984G  226G  709G  25% /data</pre>
<p>(‏916 GiB ולא 931 כי ה-filesystem עצמו שומר מקום ל-metadata, וב-ext4 גם 5% ל-root.)</p>
<blockquote>⚠️ טיפ לפרודקשן: ב-Kubernetes ‏<code>memory: 512M</code> זה 512,000,000 bytes ו-<code>512Mi</code> זה 536,870,912 bytes — הפרש של 4.9%. ו-<code>memory: 512m</code> (m קטנה) זה 0.512 <em>bytes</em>: טעות הקלדה אמיתית שמייצרת Pod-ים שלא יכולים לעלות או מתים מיד. תשתמש תמיד ב-<code>Mi</code>/<code>Gi</code>.</blockquote>`
      }
    },
    {
      h: { en: "Mbps vs MB/s — bandwidth, throughput and latency", he: "Mbps מול MB/s — bandwidth, throughput ו-latency" },
      body: {
        en: `<p>Network speeds are quoted in <strong>bits per second</strong>, decimal: 1 Gbps = 1,000,000,000 bits/s. Divide by 8 for bytes: <strong>1 Gbps = 125 MB/s</strong>. That's the theoretical ceiling. Every packet also carries Ethernet (38 B incl. preamble and gap), IP (20 B) and TCP (32 B with timestamps) overhead, so on a 1500-byte MTU only ~1448 of every 1538 bytes on the wire are your data — about 94%, i.e. <strong>~117 MB/s max goodput</strong>, and ~110 MB/s is what a real copy usually shows.</p>
<table>
<tr><th>Link</th><th>Line rate</th><th>Realistic TCP copy</th></tr>
<tr><td>100 Mbps</td><td>12.5 MB/s</td><td>~11 MB/s</td></tr>
<tr><td>1 Gbps</td><td>125 MB/s</td><td>~110–117 MB/s</td></tr>
<tr><td>10 Gbps</td><td>1.25 GB/s</td><td>~1.1 GB/s (often disk-bound first)</td></tr>
<tr><td>25 Gbps</td><td>3.125 GB/s</td><td>needs several streams</td></tr>
</table>
<p>Three words people mix up:</p>
<ul><li><strong>Bandwidth</strong> — the capacity of the pipe (how wide the highway is). Marketing number.</li>
<li><strong>Throughput</strong> — what you actually get end-to-end (cars per hour that really arrive). Always ≤ bandwidth; limited by the slowest hop, disk, CPU or TCP window.</li>
<li><strong>Latency</strong> — how long one bit takes to get there (driving time). A wider highway does not make Tel Aviv → Frankfurt faster than ~25 ms one way; the speed of light in fiber is ~200,000 km/s.</li></ul>
<p>They connect through the <strong>bandwidth-delay product</strong>: to fill a 1 Gbps pipe with a 100 ms RTT you need 10^9 × 0.1 ÷ 8 = <strong>12.5 MB</strong> in flight. If the TCP window is smaller, throughput drops no matter how fat the link (details in <code>net-tcp-deep</code>).</p>
<blockquote>💡 Real world: cloud instance specs say "up to 10 Gbps" — bits, and "up to" means burst. A single TCP flow outside a placement group is often capped lower (on AWS, 5 Gbps per flow between instances), so one <code>scp</code> rarely saturates it.</blockquote>`,
        he: `<p>מהירויות רשת נמדדות ב-<strong>bits לשנייה</strong>, עשרוני: ‏1 Gbps = ‏1,000,000,000 bits בשנייה. מחלקים ב-8 כדי לקבל bytes: <strong>1 Gbps = 125 MB/s</strong>. זו התקרה התיאורטית. כל packet נושא גם overhead של Ethernet (‏38 B כולל preamble ו-gap), של IP (‏20 B) ושל TCP (‏32 B עם timestamps), אז ב-MTU של 1500 רק כ-1448 מכל 1538 bytes על הקו הם הדאטה שלך — בערך 94%, כלומר <strong>~117 MB/s מקסימום goodput</strong>, ובהעתקה אמיתית בדרך כלל תראה ~110 MB/s.</p>
<table>
<tr><th>לינק</th><th>Line rate</th><th>העתקת TCP מציאותית</th></tr>
<tr><td>100 Mbps</td><td>12.5 MB/s</td><td>~11 MB/s</td></tr>
<tr><td>1 Gbps</td><td>125 MB/s</td><td>~110–117 MB/s</td></tr>
<tr><td>10 Gbps</td><td>1.25 GB/s</td><td>~1.1 GB/s (לרוב הדיסק נגמר קודם)</td></tr>
<tr><td>25 Gbps</td><td>3.125 GB/s</td><td>צריך כמה streams במקביל</td></tr>
</table>
<p>שלוש מילים שכולם מבלבלים:</p>
<ul><li><strong>Bandwidth</strong> — הקיבולת של הצינור (כמה רחב הכביש). המספר של השיווק.</li>
<li><strong>Throughput</strong> — מה שאתה באמת מקבל מקצה לקצה (כמה מכוניות בשעה באמת מגיעות). תמיד קטן או שווה ל-bandwidth; מוגבל ע"י ה-hop הכי איטי, הדיסק, ה-CPU או ה-TCP window.</li>
<li><strong>Latency</strong> — כמה זמן לוקח ל-bit אחד להגיע (זמן הנסיעה). כביש רחב יותר לא יהפוך את תל אביב–פרנקפורט למהיר יותר מ-~25 ms לכיוון; מהירות האור בסיב היא בערך 200,000 ק"מ בשנייה.</li></ul>
<p>הם מתחברים דרך ה-<strong>bandwidth-delay product</strong>: כדי למלא צינור של 1 Gbps עם RTT של 100 ms צריך 10^9 × 0.1 ÷ 8 = <strong>12.5 MB</strong> באוויר. אם ה-TCP window קטן מזה, ה-throughput יורד לא משנה כמה הלינק שמן (פירוט ב-<code>net-tcp-deep</code>).</p>
<blockquote>💡 מהשטח: במפרט של instance בענן כתוב "up to 10 Gbps" — זה bits, ו-"up to" אומר burst. Flow בודד של TCP מחוץ ל-placement group מוגבל לרוב לפחות (ב-AWS, ‏5 Gbps ל-flow בין instances), אז <code>scp</code> אחד כמעט אף פעם לא ימלא את הלינק.</blockquote>`
      }
    },
    {
      h: { en: "Transfer-time math: when to ship a disk", he: "חשבון זמן העברה: מתי לשלוח דיסק בדואר" },
      body: {
        en: `<p>The formula: <strong>time = bytes × 8 ÷ bits per second</strong>. Do it in SI units and convert everything first.</p>
<pre>1 TB over 1 Gbps:
  10^12 B × 8 = 8 × 10^12 bits
  8 × 10^12 ÷ 10^9 bit/s = 8,000 s = 2 h 13 min   (line rate, perfect)
  at a realistic 110 MB/s: 10^12 ÷ 1.1×10^8 = 9,091 s ≈ 2 h 32 min</pre>
<table>
<tr><th>Data</th><th>1 Gbps</th><th>10 Gbps</th><th>100 Mbps (office uplink)</th></tr>
<tr><td>100 GB</td><td>13 min</td><td>80 s</td><td>2.2 h</td></tr>
<tr><td>1 TB</td><td>2.2 h</td><td>13 min</td><td>22 h</td></tr>
<tr><td>10 TB</td><td>22 h</td><td>2.2 h</td><td>9.3 days</td></tr>
<tr><td>100 TB</td><td>9.3 days</td><td>22 h</td><td>93 days</td></tr>
</table>
<p>Those are perfect-pipe numbers; in practice multiply by ~1.25 (protocol overhead, sharing the link, retries). Rule of thumb: if the online transfer takes more than about a week, or would saturate the link production depends on, <strong>ship the disks</strong> — AWS Snowball, Azure Data Box, Google Transfer Appliance. A rugged box with tens of TB arriving by courier in 2–3 days has better throughput than most WAN links. ("Never underestimate the bandwidth of a station wagon full of tapes.")</p>
<blockquote>⚠️ Production tip: always do the math <em>before</em> promising a migration window. "We'll copy the 40 TB database over the weekend" on a 1 Gbps VPN is 3.7 days at line rate — it misses Monday.</blockquote>`,
        he: `<p>הנוסחה: <strong>זמן = bytes × 8 ÷ bits לשנייה</strong>. תעבוד ביחידות SI ותמיר הכל לפני שאתה מתחיל.</p>
<pre>1 TB over 1 Gbps:
  10^12 B × 8 = 8 × 10^12 bits
  8 × 10^12 ÷ 10^9 bit/s = 8,000 s = 2 h 13 min   (line rate, perfect)
  at a realistic 110 MB/s: 10^12 ÷ 1.1×10^8 = 9,091 s ≈ 2 h 32 min</pre>
<table>
<tr><th>דאטה</th><th>1 Gbps</th><th>10 Gbps</th><th>100 Mbps (uplink של משרד)</th></tr>
<tr><td>100 GB</td><td>13 דק'</td><td>80 שניות</td><td>2.2 שעות</td></tr>
<tr><td>1 TB</td><td>2.2 שעות</td><td>13 דק'</td><td>22 שעות</td></tr>
<tr><td>10 TB</td><td>22 שעות</td><td>2.2 שעות</td><td>9.3 ימים</td></tr>
<tr><td>100 TB</td><td>9.3 ימים</td><td>22 שעות</td><td>93 ימים</td></tr>
</table>
<p>אלה מספרים של צינור מושלם; בפועל תכפיל בערך ב-1.25 (overhead של פרוטוקולים, שיתוף הלינק, retries). כלל אצבע: אם ההעברה ברשת לוקחת יותר משבוע בערך, או תחנוק לינק שפרודקשן תלוי בו — <strong>תשלח דיסקים</strong>: AWS Snowball, ‏Azure Data Box, ‏Google Transfer Appliance. קופסה מחוזקת עם עשרות TB שמגיעה עם שליח תוך 2–3 ימים נותנת throughput טוב יותר מרוב לינקי ה-WAN. ("אל תזלזל אף פעם ב-bandwidth של סטיישן מלא בקלטות.")</p>
<blockquote>⚠️ טיפ לפרודקשן: תעשה את החשבון <em>לפני</em> שאתה מבטיח חלון מיגרציה. "נעתיק את ה-DB של 40 TB בסוף השבוע" על VPN של 1 Gbps זה 3.7 ימים ב-line rate — זה לא נגמר עד יום שני.</blockquote>`
      }
    },
    {
      h: { en: "Binary, hex and octal in your head (chmod, 0xFF, IPv4, endianness)", he: "בינארי, hex ואוקטלי בראש (chmod, ‏0xFF, ‏IPv4, endianness)" },
      body: {
        en: `<p>One hex digit = 4 bits, one octal digit = 3 bits. That's the whole trick — convert digit by digit:</p>
<table>
<tr><th>Decimal</th><th>Binary</th><th>Hex</th><th>Octal</th><th>Where you meet it</th></tr>
<tr><td>7</td><td>111</td><td>0x7</td><td>7</td><td><code>rwx</code></td></tr>
<tr><td>5</td><td>101</td><td>0x5</td><td>5</td><td><code>r-x</code></td></tr>
<tr><td>255</td><td>1111 1111</td><td>0xFF</td><td>377</td><td>one full byte, <code>/24</code> octet mask</td></tr>
<tr><td>4095</td><td>1111 1111 1111</td><td>0xFFF</td><td>7777</td><td>12-bit VLAN id range is 0–4095</td></tr>
</table>
<p><strong>chmod 755</strong> is octal: 7 = <code>111</code> = rwx for owner, 5 = <code>101</code> = r-x for group and others → <code>rwxr-xr-x</code>. Each permission is literally one bit.</p>
<p><strong>An IPv4 address is just a 32-bit integer</strong> printed as 4 bytes:</p>
<pre>192.168.1.10
= 11000000.10101000.00000001.00001010
= 0xC0A8010A
= 192×2^24 + 168×2^16 + 1×2^8 + 10 = 3,232,235,786</pre>
<p>That's why there are 2^32 ≈ 4.29 billion IPv4 addresses, and why a <code>/24</code> leaves 8 host bits = 256 addresses (the <code>cidr</code> simulator does the rest).</p>
<p><strong>Endianness</strong> is the order a multi-byte number is stored in memory. x86 and ARM (as normally run) are <strong>little-endian</strong> — lowest byte first; network protocols are <strong>big-endian</strong> ("network byte order"). The 32-bit value <code>0x12345678</code>:</p>
<pre>$ printf '\\x78\\x56\\x34\\x12' | od -An -tx4   # bytes in memory on x86
 12345678
little-endian memory:  78 56 34 12
big-endian / network:  12 34 56 78</pre>
<p>You hit it when parsing binary files or packets by hand: read a port from a raw buffer without <code>ntohs()</code> and port 80 (<code>0x0050</code>) becomes 20480 (<code>0x5000</code>). Bit-level operators and flags are covered in <code>pr-bitwise</code>.</p>`,
        he: `<p>ספרת hex אחת = 4 bits, ספרה אוקטלית אחת = 3 bits. זה כל הטריק — ממירים ספרה אחרי ספרה:</p>
<table>
<tr><th>עשרוני</th><th>בינארי</th><th>Hex</th><th>אוקטלי</th><th>איפה תפגוש את זה</th></tr>
<tr><td>7</td><td>111</td><td>0x7</td><td>7</td><td><code>rwx</code></td></tr>
<tr><td>5</td><td>101</td><td>0x5</td><td>5</td><td><code>r-x</code></td></tr>
<tr><td>255</td><td>1111 1111</td><td>0xFF</td><td>377</td><td>byte מלא, octet של מסכת <code>/24</code></td></tr>
<tr><td>4095</td><td>1111 1111 1111</td><td>0xFFF</td><td>7777</td><td>טווח VLAN id של 12 bits הוא 0–4095</td></tr>
</table>
<p><strong>chmod 755</strong> זה אוקטלי: 7 = <code>111</code> = rwx לבעלים, 5 = <code>101</code> = r-x לקבוצה ולשאר → <code>rwxr-xr-x</code>. כל הרשאה היא ממש bit אחד.</p>
<p><strong>כתובת IPv4 היא סתם מספר שלם של 32 bits</strong> שמודפס כ-4 bytes:</p>
<pre>192.168.1.10
= 11000000.10101000.00000001.00001010
= 0xC0A8010A
= 192×2^24 + 168×2^16 + 1×2^8 + 10 = 3,232,235,786</pre>
<p>בגלל זה יש 2^32, כלומר בערך 4.29 מיליארד כתובות IPv4, ובגלל זה <code>/24</code> משאיר 8 bits ל-hosts = ‏256 כתובות (את השאר תעשה בסימולטור <code>cidr</code>).</p>
<p><strong>Endianness</strong> זה הסדר שבו מספר של כמה bytes נשמר בזיכרון. x86 ו-ARM (במצב הרגיל) הם <strong>little-endian</strong> — ה-byte הנמוך ראשון; פרוטוקולי רשת הם <strong>big-endian</strong> (מה שנקרא network byte order). הערך <code>0x12345678</code> של 32 bits:</p>
<pre>$ printf '\\x78\\x56\\x34\\x12' | od -An -tx4   # bytes in memory on x86
 12345678
little-endian memory:  78 56 34 12
big-endian / network:  12 34 56 78</pre>
<p>זה תופס אותך כשאתה מפרסר קבצים בינאריים או packets ידנית: תקרא port מ-buffer גולמי בלי <code>ntohs()</code> ו-port 80 (<code>0x0050</code>) יהפוך ל-20480 (<code>0x5000</code>). אופרטורים ברמת ה-bit ו-flags מוסברים ב-<code>pr-bitwise</code>.</p>`
      }
    },
    {
      h: { en: "Integer sizes, overflow and Y2038", he: "גדלים של integers, ‏overflow ו-Y2038" },
      body: {
        en: `<p>An n-bit signed integer holds −2^(n−1) … 2^(n−1)−1. Memorize the edges — they show up in incidents:</p>
<table>
<tr><th>Type</th><th>Max value</th><th>Classic failure</th></tr>
<tr><td>int8 / uint8</td><td>127 / 255</td><td>IP TTL and protocol fields</td></tr>
<tr><td>int16 / uint16</td><td>32,767 / 65,535</td><td>max TCP/UDP port, max IPv4 packet size</td></tr>
<tr><td>int32</td><td><strong>2,147,483,647</strong></td><td>Postgres <code>serial</code>/<code>integer</code> primary key runs out</td></tr>
<tr><td>uint32</td><td>4,294,967,295</td><td>2^32 ms = 49.7 days uptime-counter bugs</td></tr>
<tr><td>int64</td><td>9,223,372,036,854,775,807</td><td>practically never — use it for ids and timestamps</td></tr>
</table>
<p>When the value passes the max, it <strong>wraps around</strong> (C, Go, Java ints) to the most negative number, or throws (Postgres: <code>ERROR: integer out of range</code>, Python ints never overflow). Real ones:</p>
<ul><li><strong>The int32 primary key</strong>: a busy table inserting 1,000 rows/s burns all 2,147,483,647 ids in 2,147,483,647 ÷ 1,000 ÷ 86,400 ≈ <strong>24.9 days</strong>; at 100/s, 248 days. Then every INSERT fails. Migrating a huge table to <code>bigint</code> under pressure is a multi-day project — start with <code>bigint</code>.</li>
<li><strong>Boeing 787</strong> generators had to be power-cycled every 248 days: a counter of hundredths of a second in a signed 32-bit int overflows after 2^31 ÷ 100 ÷ 86,400 = 248.6 days.</li>
<li><strong>YouTube</strong> moved view counts to 64-bit in 2014 when "Gangnam Style" approached 2,147,483,647 views.</li>
<li><strong>Y2038</strong>: Unix time stored as signed 32-bit seconds since 1970 overflows at <strong>2038-01-19 03:14:07 UTC</strong> and wraps to December 1901. 64-bit Linux uses 64-bit <code>time_t</code>, but old embedded devices, file formats and DB columns (MySQL <code>TIMESTAMP</code>) still carry the limit — and 30-year mortgages already compute dates past 2038.</li></ul>
<pre>$ date -u -d @2147483647
Tue Jan 19 03:14:07 UTC 2038
psql=# SELECT 2147483647::int + 1;
ERROR:  integer out of range</pre>`,
        he: `<p>מספר שלם עם סימן של n bits מחזיק מ-−2^(n−1) עד 2^(n−1)−1. תזכור את הקצוות — הם מופיעים בתקלות:</p>
<table>
<tr><th>טיפוס</th><th>ערך מקסימלי</th><th>תקלה קלאסית</th></tr>
<tr><td>int8 / uint8</td><td>127 / 255</td><td>שדות TTL ו-protocol ב-IP</td></tr>
<tr><td>int16 / uint16</td><td>32,767 / 65,535</td><td>ה-port המקסימלי ב-TCP/UDP, גודל packet מקסימלי ב-IPv4</td></tr>
<tr><td>int32</td><td><strong>2,147,483,647</strong></td><td>primary key מסוג <code>serial</code>/<code>integer</code> ב-Postgres נגמר</td></tr>
<tr><td>uint32</td><td>4,294,967,295</td><td>באגים של מונה uptime: ‏2^32 ms = ‏49.7 ימים</td></tr>
<tr><td>int64</td><td>9,223,372,036,854,775,807</td><td>כמעט אף פעם — תשתמש בזה ל-ids ול-timestamps</td></tr>
</table>
<p>כשהערך עובר את המקסימום הוא <strong>עושה wrap around</strong> (ב-C, ‏Go, ‏int של Java) למספר הכי שלילי, או זורק שגיאה (Postgres: ‏<code>ERROR: integer out of range</code>; ב-Python אין overflow ל-int). דוגמאות אמיתיות:</p>
<ul><li><strong>ה-primary key של int32</strong>: טבלה עמוסה שמכניסה 1,000 שורות בשנייה שורפת 2.1 מיליארד ids תוך 2,147,483,647 ÷ 1,000 ÷ 86,400 ≈ <strong>24.9 ימים</strong>; ב-100 בשנייה — 248 ימים. ואז כל INSERT נכשל. מיגרציה של טבלה ענקית ל-<code>bigint</code> תחת לחץ זה פרויקט של כמה ימים — תתחיל מ-<code>bigint</code>.</li>
<li><strong>Boeing 787</strong>: היה צריך לכבות ולהדליק את הגנרטורים כל 248 ימים — מונה של מאיות שנייה ב-int32 עם סימן עושה overflow אחרי 2^31 ÷ 100 ÷ 86,400 = ‏248.6 ימים.</li>
<li><strong>YouTube</strong> העבירו את מוני הצפיות ל-64 bit ב-2014, כש-"Gangnam Style" התקרב ל-2,147,483,647 צפיות.</li>
<li><strong>Y2038</strong>: זמן Unix שנשמר כשניות מאז 1970 ב-int32 עם סימן עושה overflow ב-<strong>2038-01-19 03:14:07 UTC</strong> וקופץ לדצמבר 1901. Linux של 64 bit משתמש ב-<code>time_t</code> של 64 bit, אבל מכשירי embedded ישנים, פורמטים של קבצים ועמודות DB (‏<code>TIMESTAMP</code> ב-MySQL) עדיין סוחבים את המגבלה — ומשכנתא של 30 שנה כבר מחשבת תאריכים אחרי 2038.</li></ul>
<pre>$ date -u -d @2147483647
Tue Jan 19 03:14:07 UTC 2038
psql=# SELECT 2147483647::int + 1;
ERROR:  integer out of range</pre>`
      }
    },
    {
      h: { en: "How text takes space — and unit mistakes that cause incidents", he: "כמה מקום טקסט תופס — וטעויות יחידות שמייצרות תקלות" },
      body: {
        en: `<p><strong>ASCII</strong> uses 7 bits per character (stored in 1 byte): English letters, digits, punctuation. <strong>UTF-8</strong> is variable length and ASCII-compatible:</p>
<table>
<tr><th>Characters</th><th>Bytes per char in UTF-8</th><th>Example</th></tr>
<tr><td>ASCII (a–z, 0–9)</td><td>1</td><td><code>A</code> = 41</td></tr>
<tr><td>Hebrew, Arabic, Greek, Cyrillic</td><td>2</td><td><code>א</code> = D7 90</td></tr>
<tr><td>Chinese, Japanese, most other BMP</td><td>3</td><td><code>中</code> = E4 B8 AD</td></tr>
<tr><td>Emoji and rare scripts</td><td>4</td><td>🚀 = F0 9F 9A 80</td></tr>
</table>
<pre>$ echo -n "hello" | wc -c
5
$ echo -n "שלום" | wc -c      # 4 letters, 8 bytes
8
$ echo -n "שלום" | xxd
00000000: d7a9 d79c d795 d79d                      ........</pre>
<p>So "max 255 characters" and "max 255 bytes" are different limits: a 255-character Hebrew string is 510 bytes, an emoji-heavy one up to 1,020. SMS is 160 chars in GSM-7 but only 70 once a single Hebrew letter forces UCS-2. (Code points, BOM and mojibake are in <code>pr-encoding-serialization</code>.)</p>
<p><strong>The unit-mistake hall of fame</strong>:</p>
<ul><li>Alert threshold set in MB on a metric exported in bytes (or bits) — the alert never fires, or always fires. Prometheus convention: base units only (<code>_bytes</code>, <code>_seconds</code>).</li>
<li>Capacity plan in Mbps from a dashboard showing MB/s — 8× under-provisioned.</li>
<li>Kubernetes <code>M</code> vs <code>Mi</code> vs <code>m</code>; JVM <code>-Xmx4g</code> (GiB) inside a container limit of <code>4G</code> (GB) — the heap alone is 7% bigger than the container.</li>
<li>Timeouts in ms vs seconds: <code>timeout: 30</code> meant as 30 s, read as 30 ms.</li>
<li>NASA's Mars Climate Orbiter (1999) was lost because one team used pound-force seconds and another newton-seconds. Units aren't pedantry.</li></ul>
<blockquote>💡 Real world: put the unit in the name — <code>timeout_ms</code>, <code>size_bytes</code>, <code>bandwidth_mbps</code>. It's the cheapest bug prevention there is.</blockquote>`,
        he: `<p><strong>ASCII</strong> משתמש ב-7 bits לתו (שנשמר ב-byte אחד): אותיות באנגלית, ספרות, סימני פיסוק. <strong>UTF-8</strong> הוא באורך משתנה ותואם ל-ASCII:</p>
<table>
<tr><th>תווים</th><th>Bytes לתו ב-UTF-8</th><th>דוגמה</th></tr>
<tr><td>ASCII (a–z, 0–9)</td><td>1</td><td><code>A</code> = 41</td></tr>
<tr><td>עברית, ערבית, יוונית, קירילית</td><td>2</td><td><code>א</code> = D7 90</td></tr>
<tr><td>סינית, יפנית ורוב שאר ה-BMP</td><td>3</td><td><code>中</code> = E4 B8 AD</td></tr>
<tr><td>אימוג'י וכתבים נדירים</td><td>4</td><td>🚀 = F0 9F 9A 80</td></tr>
</table>
<pre>$ echo -n "hello" | wc -c
5
$ echo -n "שלום" | wc -c      # 4 letters, 8 bytes
8
$ echo -n "שלום" | xxd
00000000: d7a9 d79c d795 d79d                      ........</pre>
<p>אז "מקסימום 255 תווים" ו"מקסימום 255 bytes" הן מגבלות שונות: מחרוזת של 255 תווים בעברית היא 510 bytes, ומחרוזת מלאה באימוג'י יכולה להגיע ל-1,020. הודעת SMS היא 160 תווים ב-GSM-7 אבל רק 70 ברגע שאות עברית אחת מכריחה UCS-2. (‏Code points, ‏BOM ו-mojibake מוסברים ב-<code>pr-encoding-serialization</code>.)</p>
<p><strong>היכל התהילה של טעויות יחידות</strong>:</p>
<ul><li>סף של alert מוגדר ב-MB על מטריקה שמיוצאת ב-bytes (או ב-bits) — ה-alert אף פעם לא קופץ, או קופץ תמיד. המוסכמה ב-Prometheus: רק יחידות בסיס (<code>_bytes</code>, <code>_seconds</code>).</li>
<li>תכנון קיבולת ב-Mbps לפי dashboard שמראה MB/s — חסר פי 8.</li>
<li>‏<code>M</code> מול <code>Mi</code> מול <code>m</code> ב-Kubernetes; ‏<code>-Xmx4g</code> של JVM (זה GiB) בתוך container limit של <code>4G</code> (זה GB) — ה-heap לבדו גדול ב-7% מהקונטיינר.</li>
<li>Timeouts ב-ms מול שניות: <code>timeout: 30</code> שהתכוונו ל-30 שניות ונקרא כ-30 ms.</li>
<li>ה-Mars Climate Orbiter של NASA אבד ב-1999 כי צוות אחד עבד ב-pound-force seconds ואחר ב-newton-seconds. יחידות זה לא קטנוניות.</li></ul>
<blockquote>💡 מהשטח: תכניס את היחידה לשם — <code>timeout_ms</code>, ‏<code>size_bytes</code>, ‏<code>bandwidth_mbps</code>. זו מניעת הבאגים הכי זולה שיש.</blockquote>`
      }
    }
  ],
  diagram: `  1 byte = 8 bits = 2 nibbles = 2 hex digits
  [1 1 0 0 | 0 0 0 0]  = 0xC0 = 192

  decimal (disks, network)      binary (RAM, OS tools)
  1 KB = 1,000 B                1 KiB = 1,024 B
  1 GB = 10^9 B                 1 GiB = 2^30 B = 1,073,741,824 B
  1 TB disk ---------------->   931 GiB in df -h

  1 Gbps / 8 = 125 MB/s line rate  ->  ~117 MB/s TCP goodput  ->  ~110 MB/s real copy
  1 TB x 8 / 1 Gbps = 8,000 s = 2.2 h`,
  handsOn: [
    { cmd: "df -h / ; df -H /", what: { en: "Same disk in GiB (-h) and GB (-H); notice the ~7% gap.", he: "אותו דיסק ב-GiB (‏-h) וב-GB (‏-H); שים לב לפער של בערך 7%." } },
    { cmd: "echo -n \"שלום\" | wc -c ; echo -n \"hello\" | wc -c", what: { en: "Count bytes, not characters: 8 for the Hebrew word, 5 for the English one.", he: "לספור bytes ולא תווים: 8 למילה בעברית, 5 לאנגלית." } },
    { cmd: "printf '%d %x %o\\n' 255 255 255 ; stat -c '%a %A' /usr/bin/ls", what: { en: "255 in decimal/hex/octal, then a real file's octal mode next to its rwx string.", he: "255 בעשרוני, hex ואוקטלי, ואז ה-mode האוקטלי של קובץ אמיתי לצד מחרוזת ה-rwx." } },
    { cmd: "iperf3 -c <server> -t 10    # vs: iperf3 -c <server> -f M", what: { en: "Measure real throughput: default output is Mbits/sec; -f M prints MBytes/sec.", he: "למדוד throughput אמיתי: ברירת המחדל מדפיסה Mbits/sec; ‏-f M מדפיס MBytes/sec." } },
    { cmd: "date -u -d @2147483647", what: { en: "See the exact Y2038 moment: the largest signed 32-bit Unix timestamp.", he: "לראות את רגע ה-Y2038 המדויק: ה-Unix timestamp הגדול ביותר ב-int32 עם סימן." } }
  ],
  mnemonic: {
    en: "\"Little b flows, big B stays\" — bits for the wire, Bytes for the disk; divide by 8 to cross over. And: 1 Gbps ≈ 1 TB in 2¼ hours.",
    he: "\"b קטנה זורמת, B גדולה נשארת\" — bits לקו, Bytes לדיסק; מחלקים ב-8 כדי לעבור ביניהם. ובנוסף: 1 Gbps ≈ ‏1 TB ב-2¼ שעות."
  },
  pitfalls: [
    { en: "Comparing a network speed in Mbps to a disk or dashboard number in MB/s without dividing by 8. A '100 Mbps' line can never download faster than 12.5 MB/s.", he: "להשוות מהירות רשת ב-Mbps למספר של דיסק או dashboard ב-MB/s בלי לחלק ב-8. קו של '100 Mbps' לא יוריד אף פעם יותר מהר מ-12.5 MB/s." },
    { en: "Using int32 for primary keys, counters or epoch timestamps. 2,147,483,647 sounds huge until a busy table or a millisecond counter eats it in weeks.", he: "להשתמש ב-int32 ל-primary keys, מונים או epoch timestamps. ‏2,147,483,647 נשמע ענק עד שטבלה עמוסה או מונה של מילי-שניות אוכלים אותו בתוך שבועות." },
    { en: "Assuming one character = one byte. Hebrew is 2 bytes per letter in UTF-8, emoji 4 — byte-limited columns, headers and SMS truncate in the middle of a character.", he: "להניח שתו אחד = byte אחד. עברית היא 2 bytes לאות ב-UTF-8, אימוג'י 4 — עמודות, headers ו-SMS שמוגבלים ב-bytes נחתכים באמצע תו." },
    { en: "Promising a migration window without transfer-time math. Bytes × 8 ÷ bps, then add 25% for reality.", he: "להבטיח חלון מיגרציה בלי חשבון זמן העברה. bytes × 8 ÷ bps, ואז להוסיף 25% בשביל המציאות." }
  ],
  interview: [
    {
      q: { en: "You need to move 50 TB from on-prem to S3 over a 1 Gbps link. How long, and what would you do?", he: "צריך להעביר 50 TB מ-on-prem ל-S3 על לינק של 1 Gbps. כמה זמן זה ייקח ומה היית עושה?" },
      a: { en: "50 × 10^12 × 8 ÷ 10^9 = 400,000 s ≈ 4.6 days at perfect line rate, realistically ~6 days, and it would saturate the link everything else uses. I'd order a Snowball-type device (days, no link impact) for the bulk and sync the delta online afterwards, or rate-limit the online copy to off-hours if the deadline allows.", he: "50 × 10^12 × 8 ÷ 10^9 = ‏400,000 שניות ≈ ‏4.6 ימים ב-line rate מושלם, במציאות בערך 6 ימים, וזה יחנוק את הלינק שכל השאר משתמשים בו. הייתי מזמין מכשיר מסוג Snowball לרוב הדאטה (כמה ימים, בלי השפעה על הלינק) ומסנכרן את ה-delta ברשת אחר כך, או מגביל את קצב ההעתקה לשעות שקטות אם הדדליין מאפשר." }
    },
    {
      q: { en: "A customer says their new 2 TB disk 'only has 1.8 TB'. Explain.", he: "לקוח אומר שהדיסק החדש שלו של 2 TB 'יש בו רק 1.8 TB'. תסביר." },
      a: { en: "The vendor sells 2 × 10^12 bytes; the OS reports in binary units, 2 × 10^12 ÷ 2^40 = 1.82 TiB (often labeled 'TB' in the UI). Same bytes, different prefix. Filesystem metadata and reserved blocks take a bit more.", he: "היצרן מוכר 2 × 10^12 bytes; מערכת ההפעלה מדווחת ביחידות בינאריות: 2 × 10^12 ÷ 2^40 = ‏1.82 TiB (שלרוב מוצג בממשק כ-TB). אותם bytes, קידומת אחרת. ה-metadata של ה-filesystem ובלוקים שמורים לוקחים עוד קצת." }
    },
    {
      q: { en: "Why does an IPv4 address fit in a uint32, and why does that matter?", he: "למה כתובת IPv4 נכנסת ב-uint32, ולמה זה חשוב?" },
      a: { en: "It's 4 octets × 8 bits = 32 bits. Storing it as an integer makes range checks and CIDR matching simple integer/bitmask math (ip & mask == network), and explains the 4.29 billion address limit that drove NAT and IPv6.", he: "זה 4 octets × 8 bits = ‏32 bits. לשמור את זה כמספר שלם הופך בדיקות טווח ו-CIDR matching לחשבון פשוט של מספרים ו-bitmask (ip & mask == network), ומסביר את המגבלה של 4.29 מיליארד כתובות שהולידה את NAT ו-IPv6." }
    }
  ],
  quiz: [
    {
      q: { en: "Your OS shows a brand-new '1 TB' drive as about 931 G. Why?", he: "מערכת ההפעלה מציגה כונן חדש של '1 TB' כבערך 931 G. למה?" },
      options: [
        { en: "The drive is defective and has bad sectors", he: "הכונן פגום ויש בו bad sectors" },
        { en: "The vendor counts 10^12 bytes; the OS counts GiB (2^30 bytes): 10^12 ÷ 2^30 ≈ 931", he: "היצרן סופר 10^12 bytes; מערכת ההפעלה סופרת GiB ‏(2^30 bytes): ‏10^12 ÷ 2^30 ≈ ‏931" },
        { en: "The filesystem compresses 7% of the disk", he: "ה-filesystem דוחס 7% מהדיסק" },
        { en: "1 TB means 1 terabit", he: "1 TB זה טרה-bit אחד" }
      ],
      answer: 1,
      explain: { en: "Same bytes, different ruler. The decimal/binary gap is 2.4% at K, 7.4% at G, 10% at T.", he: "אותם bytes, סרגל אחר. הפער בין עשרוני לבינארי הוא 2.4% ב-K, ‏7.4% ב-G ו-10% ב-T." }
    },
    {
      q: { en: "What is the fastest file copy you can expect over a dedicated 1 Gbps link?", he: "מה ההעתקה הכי מהירה שאפשר לצפות לה על לינק ייעודי של 1 Gbps?" },
      options: [
        { en: "~1 GB/s", he: "~1 GB/s" },
        { en: "~1,000 MB/s minus 10%", he: "~1,000 MB/s פחות 10%" },
        { en: "~110–117 MB/s (125 MB/s line rate minus protocol overhead)", he: "~110–117 MB/s (‏125 MB/s line rate פחות overhead של פרוטוקולים)" },
        { en: "~12.5 MB/s", he: "~12.5 MB/s" }
      ],
      answer: 2,
      explain: { en: "1 Gbps ÷ 8 = 125 MB/s. Ethernet/IP/TCP headers take ~6% at MTU 1500, so ~117 MB/s goodput, ~110 in practice. 12.5 MB/s is a 100 Mbps link.", he: "1 Gbps ÷ 8 = ‏125 MB/s. ה-headers של Ethernet/IP/TCP לוקחים בערך 6% ב-MTU של 1500, אז ~117 MB/s של goodput, ובפועל ~110. ‏12.5 MB/s זה לינק של 100 Mbps." }
    },
    {
      q: { en: "Roughly how long does copying 10 TB over 1 Gbps take at perfect line rate?", he: "בערך כמה זמן לוקח להעתיק 10 TB על 1 Gbps ב-line rate מושלם?" },
      options: [
        { en: "~22 minutes", he: "~22 דקות" },
        { en: "~2.2 hours", he: "~2.2 שעות" },
        { en: "~22 hours", he: "~22 שעות" },
        { en: "~9 days", he: "~9 ימים" }
      ],
      answer: 2,
      explain: { en: "10^13 B × 8 = 8 × 10^13 bits ÷ 10^9 = 80,000 s ≈ 22.2 h — and longer in reality. 9 days would be 100 TB.", he: "10^13 B × 8 = ‏8 × 10^13 bits ÷ 10^9 = ‏80,000 שניות ≈ ‏22.2 שעות — ובמציאות יותר. ‏9 ימים זה בשביל 100 TB." }
    },
    {
      q: { en: "How many bytes is the Hebrew word \"שלום\" in UTF-8?", he: "כמה bytes תופסת המילה \"שלום\" ב-UTF-8?" },
      options: [
        { en: "4", he: "4" },
        { en: "8", he: "8" },
        { en: "12", he: "12" },
        { en: "16", he: "16" }
      ],
      answer: 1,
      explain: { en: "Hebrew letters are in U+0590–U+05FF, which UTF-8 encodes in 2 bytes each: 4 letters × 2 = 8 bytes. Only ASCII is 1 byte per char.", he: "אותיות עבריות נמצאות בטווח U+0590–U+05FF, ש-UTF-8 מקודד ב-2 bytes כל אחת: 4 אותיות × 2 = ‏8 bytes. רק ASCII הוא byte אחד לתו." }
    }
  ],
  playground: "cidr",
  related: ["pr-bitwise", "pr-encoding-serialization", "net-ip-cidr", "latency-numbers", "storage-io"]
});

/* ============================== TCP vs UDP (and QUIC) ============================== */
INFRA.lessons.push({
  id: "net-tcp-vs-udp",
  track: "networking",
  order: 50,
  icon: "📮",
  level: 2,
  minutes: 12,
  title: { en: "TCP vs UDP (and QUIC): choosing the transport", he: "TCP מול UDP (ו-QUIC): לבחור את שכבת ה-transport" },
  tldr: {
    en: "TCP gives you a reliable, ordered, flow- and congestion-controlled byte stream at the cost of a handshake and head-of-line blocking; UDP gives you an 8-byte header and nothing else — so loss, ordering and overload become your problem, and they fail silently.",
    he: "TCP נותן לך stream של bytes אמין, מסודר ועם flow ו-congestion control, במחיר של handshake ו-head-of-line blocking; UDP נותן לך header של 8 bytes ותו לא — אז איבוד, סדר ועומס הופכים לבעיה שלך, והם נכשלים בשקט."
  },
  analogy: {
    en: "TCP is a phone call: you dial, the other side says hello, you talk in order, and if a sentence gets garbled they say 'sorry, say that again' — everything pauses until it's repeated. UDP is throwing postcards into a mailbox: no setup, each card stands alone, some arrive out of order, some never arrive, and nobody tells you. QUIC is a courier company that uses postcards as its trucks but adds tracking numbers, receipts and separate lanes per package — so one lost card doesn't hold up the others.",
    he: "TCP זה שיחת טלפון: אתה מחייג, הצד השני עונה, מדברים לפי הסדר, ואם משפט נשמע מקוטע הוא אומר 'סליחה, תחזור על זה' — והכל עוצר עד שחוזרים. UDP זה לזרוק גלויות לתיבת דואר: בלי הכנה, כל גלויה עומדת בפני עצמה, חלק מגיעות לא לפי הסדר, חלק לא מגיעות בכלל, ואף אחד לא מודיע לך. QUIC זו חברת שליחויות שמשתמשת בגלויות בתור משאיות, אבל מוסיפה מספרי מעקב, אישורי מסירה ונתיב נפרד לכל חבילה — כך שגלויה אחת שאבדה לא עוצרת את השאר."
  },
  sections: [
    {
      h: { en: "Two contracts: the headers tell the story", he: "שני חוזים: ה-headers מספרים את הסיפור" },
      body: {
        en: `<p>Look at what each protocol puts in front of your data. Everything TCP promises needs a field; UDP has almost no fields because it promises almost nothing.</p>
<pre>UDP header (8 bytes, fixed)
 0               16              31
+---------------+---------------+
|  src port     |  dst port     |
+---------------+---------------+
|  length       |  checksum     |
+---------------+---------------+

TCP header (20 bytes minimum, up to 60 with options)
+---------------+---------------+
|  src port     |  dst port     |
+-------------------------------+
|        sequence number        |   ordering + reliability
+-------------------------------+
|     acknowledgment number     |   "I got everything up to N"
+----+------+---+---------------+
|offs| rsvd |flg|  window size  |   SYN/ACK/FIN/RST + flow control
+----+------+---+---------------+
|  checksum     |  urgent ptr   |
+-------------------------------+
|  options (MSS, SACK, window scale, timestamps)  |
+-------------------------------------------------+</pre>
<table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>Header</td><td>20–60 B (typically 32 with timestamps)</td><td>8 B</td></tr>
<tr><td>Setup</td><td>3-way handshake (1 RTT before data; +1 for TLS 1.3)</td><td>none — first packet carries data</td></tr>
<tr><td>Unit</td><td>byte stream (no message boundaries)</td><td>datagram (each send = one message)</td></tr>
<tr><td>Reliability / order</td><td>yes — ACKs, retransmits, sequence numbers</td><td>no — may drop, duplicate, reorder</td></tr>
<tr><td>Flow control</td><td>yes — receiver window</td><td>no — sender can flood the receiver</td></tr>
<tr><td>Congestion control</td><td>yes — CUBIC/BBR back off on loss</td><td>no — the app must be polite itself</td></tr>
<tr><td>State in kernel</td><td>per connection (ESTABLISHED, TIME_WAIT...)</td><td>none (but firewalls/NAT invent some)</td></tr>
<tr><td>Broadcast / multicast</td><td>no</td><td>yes</td></tr>
</table>
<p>"Byte stream" vs "datagram" bites people: a TCP <code>send()</code> of 3 messages can arrive as 1 <code>recv()</code> or 5 — you need framing (length prefix, newline). A UDP datagram arrives whole or not at all.</p>`,
        he: `<p>תסתכל מה כל פרוטוקול שם לפני הדאטה שלך. כל הבטחה של TCP צריכה שדה; ל-UDP כמעט אין שדות כי הוא כמעט לא מבטיח כלום.</p>
<pre>UDP header (8 bytes, fixed)
 0               16              31
+---------------+---------------+
|  src port     |  dst port     |
+---------------+---------------+
|  length       |  checksum     |
+---------------+---------------+

TCP header (20 bytes minimum, up to 60 with options)
+---------------+---------------+
|  src port     |  dst port     |
+-------------------------------+
|        sequence number        |   ordering + reliability
+-------------------------------+
|     acknowledgment number     |   "I got everything up to N"
+----+------+---+---------------+
|offs| rsvd |flg|  window size  |   SYN/ACK/FIN/RST + flow control
+----+------+---+---------------+
|  checksum     |  urgent ptr   |
+-------------------------------+
|  options (MSS, SACK, window scale, timestamps)  |
+-------------------------------------------------+</pre>
<table>
<tr><th></th><th>TCP</th><th>UDP</th></tr>
<tr><td>Header</td><td>20–60 B (בדרך כלל 32 עם timestamps)</td><td>8 B</td></tr>
<tr><td>הקמה</td><td>3-way handshake (‏RTT אחד לפני דאטה; עוד אחד ל-TLS 1.3)</td><td>אין — ה-packet הראשון כבר נושא דאטה</td></tr>
<tr><td>יחידה</td><td>stream של bytes (בלי גבולות בין הודעות)</td><td>datagram (כל send = הודעה אחת)</td></tr>
<tr><td>אמינות וסדר</td><td>כן — ACKs, ‏retransmits, ‏sequence numbers</td><td>לא — יכול ליפול, להשתכפל, להתבלגן</td></tr>
<tr><td>Flow control</td><td>כן — ה-window של המקבל</td><td>לא — השולח יכול להציף את המקבל</td></tr>
<tr><td>Congestion control</td><td>כן — CUBIC/BBR מאטים כשיש איבוד</td><td>לא — האפליקציה צריכה להתנהג יפה בעצמה</td></tr>
<tr><td>State ב-kernel</td><td>לכל חיבור (ESTABLISHED, ‏TIME_WAIT...)</td><td>אין (אבל firewalls ו-NAT ממציאים כזה)</td></tr>
<tr><td>Broadcast / multicast</td><td>לא</td><td>כן</td></tr>
</table>
<p>"Stream של bytes" מול "datagram" תופס אנשים: ‏<code>send()</code> של 3 הודעות ב-TCP יכול להגיע כ-<code>recv()</code> אחד או חמישה — צריך framing (קידומת אורך, שורה חדשה). ב-UDP ה-datagram מגיע שלם או לא מגיע בכלל.</p>`
      }
    },
    {
      h: { en: "What TCP's guarantees cost: handshakes and head-of-line blocking", he: "כמה עולות ההבטחות של TCP: handshakes ו-head-of-line blocking" },
      body: {
        en: `<p>TCP's reliability comes from buffering and waiting. The receiver hands bytes to the application <strong>strictly in order</strong>. If segment 5 of 10 is lost, segments 6–10 sit in the kernel buffer until 5 is retransmitted — at least one more RTT, or a full RTO (200 ms minimum on Linux) if fast retransmit doesn't kick in. That's <strong>head-of-line (HOL) blocking</strong>.</p>
<p>For a file download it doesn't matter — you need every byte anyway. It hurts when one connection carries <em>independent</em> things: HTTP/2 multiplexes 100 streams over one TCP connection, so a single lost packet stalls all 100 (see <code>pr-http-versions</code>). For a voice call it's worse: a 300 ms-old audio frame that finally arrives is useless, but TCP insists on delivering it before anything newer.</p>
<p>The setup cost: a TCP + TLS 1.3 connection needs <strong>2 RTTs</strong> before the first request byte (1 for SYN/SYN-ACK, 1 for TLS). From Tel Aviv to us-east-1 (~130 ms RTT) that's ~260 ms of pure waiting. Connection pooling and keep-alive exist to pay it once.</p>
<p>Congestion control is the other big gift: when packets drop, TCP halves (Reno/CUBIC) or re-paces (BBR) its sending rate, which is what keeps the internet from collapsing. UDP apps that blast at a fixed rate don't back off — they can starve every TCP flow sharing the link. Deep internals (windows, retransmits, TIME_WAIT) live in <code>net-tcp-deep</code>.</p>`,
        he: `<p>האמינות של TCP באה מ-buffering ומהמתנה. המקבל מעביר bytes לאפליקציה <strong>אך ורק לפי הסדר</strong>. אם segment מספר 5 מתוך 10 אבד, segments 6 עד 10 יושבים ב-buffer של ה-kernel עד ש-5 נשלח שוב — לפחות עוד RTT, או RTO שלם (מינימום 200 ms ב-Linux) אם fast retransmit לא נכנס לפעולה. זה <strong>head-of-line (HOL) blocking</strong>.</p>
<p>בהורדת קובץ זה לא משנה — אתה צריך כל byte בכל מקרה. זה כואב כשחיבור אחד נושא דברים <em>בלתי תלויים</em>: ‏HTTP/2 מריץ 100 streams על חיבור TCP אחד, אז packet בודד שאבד עוצר את כל ה-100 (ראה <code>pr-http-versions</code>). בשיחה קולית זה עוד יותר גרוע: frame של אודיו בן 300 ms שסוף סוף הגיע לא שווה כלום, אבל TCP מתעקש למסור אותו לפני כל דבר חדש יותר.</p>
<p>מחיר ההקמה: חיבור TCP ועליו TLS 1.3 צריך <strong>2 RTTs</strong> לפני ה-byte הראשון של הבקשה (אחד ל-SYN/SYN-ACK, אחד ל-TLS). מתל אביב ל-us-east-1 (‏RTT של ~130 ms) זה ~260 ms של המתנה נטו. בשביל זה קיימים connection pooling ו-keep-alive — לשלם את זה פעם אחת.</p>
<p>Congestion control הוא המתנה הגדולה השנייה: כשיש איבוד packets, ‏TCP חוצה את הקצב (Reno/CUBIC) או מתזמן אותו מחדש (BBR), וזה מה שמונע מהאינטרנט לקרוס. אפליקציות UDP ששולחות בקצב קבוע לא מאטות — הן יכולות להרעיב כל flow של TCP שחולק איתן את הלינק. הפרטים הפנימיים (windows, ‏retransmits, ‏TIME_WAIT) נמצאים ב-<code>net-tcp-deep</code>.</p>`
      }
    },
    {
      h: { en: "When UDP wins — and how QUIC rebuilds TCP on top of it", he: "מתי UDP מנצח — ואיך QUIC בונה מחדש את TCP מעליו" },
      body: {
        en: `<table>
<tr><th>Use case</th><th>Port</th><th>Why UDP</th></tr>
<tr><td>DNS</td><td>53</td><td>one question, one answer; a handshake would triple the cost. Falls back to TCP for big answers.</td></tr>
<tr><td>VoIP / video (RTP, WebRTC)</td><td>dynamic</td><td>late = useless; the codec hides a lost frame better than waiting for it</td></tr>
<tr><td>Online games</td><td>various</td><td>only the newest position matters</td></tr>
<tr><td>Metrics (StatsD), syslog</td><td>8125, 514</td><td>fire-and-forget; the app must never block on telemetry</td></tr>
<tr><td>NTP, DHCP, SNMP</td><td>123, 67/68, 161</td><td>tiny request/response, or broadcast</td></tr>
<tr><td>VPNs: WireGuard, IPsec NAT-T, OpenVPN</td><td>51820, 4500, 1194</td><td>tunneling TCP inside TCP causes "TCP meltdown"</td></tr>
<tr><td>QUIC / HTTP/3</td><td>443</td><td>a new reliable transport, built in user space</td></tr>
</table>
<p><strong>QUIC</strong> (RFC 9000) is the answer to "TCP's ideas are good but TCP itself is frozen in every kernel and middlebox". It runs over UDP and re-implements, per stream:</p>
<ul><li><strong>Reliability</strong>: packet numbers that never repeat (so no retransmission ambiguity) and ACK frames with ranges.</li>
<li><strong>Independent streams</strong>: loss on stream 3 only stalls stream 3 — no transport-level HOL blocking.</li>
<li><strong>Built-in TLS 1.3</strong>: transport + crypto handshake in <strong>1 RTT</strong>, 0-RTT on resumption. Even most headers are encrypted, so middleboxes can't ossify it.</li>
<li><strong>Connection IDs</strong>: the connection survives your phone switching from Wi-Fi to 4G (new IP, same connection).</li>
<li><strong>Congestion control</strong> in user space — upgradable with the app, not the kernel.</li></ul>
<p>The lesson: "UDP vs TCP" is really "kernel's reliability vs build your own". QUIC built its own carefully. A home-grown "reliable UDP" usually re-invents TCP badly.</p>
<blockquote>💡 Real world: some corporate firewalls block UDP 443. Browsers then silently fall back to HTTP/2 over TCP — so HTTP/3 must always be an optimization, never a requirement.</blockquote>`,
        he: `<table>
<tr><th>שימוש</th><th>Port</th><th>למה UDP</th></tr>
<tr><td>DNS</td><td>53</td><td>שאלה אחת, תשובה אחת; handshake היה משלש את העלות. עובר ל-TCP לתשובות גדולות.</td></tr>
<tr><td>VoIP / וידאו (RTP, ‏WebRTC)</td><td>דינמי</td><td>מאוחר = חסר ערך; ה-codec מסתיר frame שאבד יותר טוב מאשר לחכות לו</td></tr>
<tr><td>משחקים אונליין</td><td>שונים</td><td>רק המיקום האחרון חשוב</td></tr>
<tr><td>מטריקות (StatsD), ‏syslog</td><td>8125, 514</td><td>fire-and-forget; האפליקציה אסור שתיחסם בגלל telemetry</td></tr>
<tr><td>NTP, ‏DHCP, ‏SNMP</td><td>123, 67/68, 161</td><td>בקשה ותשובה קטנטנות, או broadcast</td></tr>
<tr><td>VPNs: ‏WireGuard, ‏IPsec NAT-T, ‏OpenVPN</td><td>51820, 4500, 1194</td><td>TCP בתוך TCP גורם ל-"TCP meltdown"</td></tr>
<tr><td>QUIC / HTTP/3</td><td>443</td><td>transport אמין חדש, שנבנה ב-user space</td></tr>
</table>
<p><strong>QUIC</strong> (RFC 9000) הוא התשובה ל"הרעיונות של TCP טובים, אבל TCP עצמו קפוא בכל kernel ובכל middlebox". הוא רץ מעל UDP ומממש מחדש, לכל stream בנפרד:</p>
<ul><li><strong>אמינות</strong>: מספרי packet שלא חוזרים על עצמם אף פעם (אז אין בלבול ב-retransmission) ו-ACK frames עם טווחים.</li>
<li><strong>Streams בלתי תלויים</strong>: איבוד ב-stream 3 עוצר רק את stream 3 — אין HOL blocking ברמת ה-transport.</li>
<li><strong>TLS 1.3 מובנה</strong>: handshake של transport והצפנה ב-<strong>RTT אחד</strong>, ו-0-RTT בחידוש חיבור. אפילו רוב ה-headers מוצפנים, אז middleboxes לא יכולים "לקבע" אותו.</li>
<li><strong>Connection IDs</strong>: החיבור שורד כשהטלפון עובר מ-Wi-Fi ל-4G (IP חדש, אותו חיבור).</li>
<li><strong>Congestion control</strong> ב-user space — מתעדכן עם האפליקציה, לא עם ה-kernel.</li></ul>
<p>השורה התחתונה: "UDP מול TCP" זה בעצם "האמינות של ה-kernel מול לבנות אחת משלך". ‏QUIC בנה את שלו בזהירות. "UDP אמין" שנכתב בבית בדרך כלל ממציא את TCP מחדש — רע.</p>
<blockquote>💡 מהשטח: חלק מה-firewalls הארגוניים חוסמים UDP 443. הדפדפנים אז נופלים בשקט ל-HTTP/2 מעל TCP — אז HTTP/3 צריך להיות תמיד אופטימיזציה, אף פעם לא דרישה.</blockquote>`
      }
    },
    {
      h: { en: "UDP in production: NAT timeouts and silent buffer drops", he: "UDP בפרודקשן: NAT timeouts ו-drops שקטים ב-buffer" },
      body: {
        en: `<p><strong>NAT and firewalls</strong> are stateful even though UDP isn't. With no SYN/FIN to watch, they guess: an entry is created on the first outbound packet and expires after an idle timeout. Linux conntrack defaults: <code>nf_conntrack_udp_timeout = 30</code> s for a one-way flow, <code>nf_conntrack_udp_timeout_stream = 120</code> s once replies were seen. Home routers often use 30–60 s. A UDP session silent for longer loses its mapping — inbound packets are dropped. That's why WireGuard has <code>PersistentKeepalive = 25</code> and why VoIP/SIP sends keepalives every ~20–30 s. In Kubernetes, the famous "DNS lookups randomly take 5 seconds" was a conntrack race between parallel A and AAAA UDP queries from the same socket (see <code>net-nat-conntrack</code>).</p>
<p><strong>Packet loss without anyone noticing.</strong> UDP has no flow control: if packets arrive faster than the app calls <code>recv()</code>, the socket's <strong>receive buffer</strong> fills and the kernel drops the rest — no error to sender or receiver. The default buffer is small:</p>
<pre>$ sysctl net.core.rmem_default net.core.rmem_max
net.core.rmem_default = 212992      # ~208 KiB
net.core.rmem_max = 212992          # apps can't ask for more than this

$ netstat -su        # or: nstat -az | grep -i udp
Udp:
    98123456 packets received
    1203 packets to unknown port received
    4417209 packet receive errors
    51234567 packets sent
    4417209 receive buffer errors      &lt;-- drops: buffer was full
    0 send buffer errors</pre>
<p>Each queued datagram costs its payload <em>plus</em> kernel overhead (the skb "truesize", hundreds of bytes to a few KiB), so ~208 KiB holds only a few hundred small packets. At 50,000 packets/s that's <strong>a few milliseconds</strong> of slack: one GC pause or a CPU spike in the reader and thousands of packets vanish.</p>
<pre>$ ss -uamn 'sport = :8125'
State  Recv-Q  Send-Q  Local Address:Port  Peer Address:Port
UNCONN 213760  0             0.0.0.0:8125       0.0.0.0:*
	 skmem:(r213760,rb212992,t0,tb212992,f0,w0,o0,bl0,d88231)
#  r = bytes queued now (full!), rb = buffer size, d = packets dropped on this socket</pre>
<p>Fix in layers: raise the ceiling (<code>sysctl -w net.core.rmem_max=26214400</code>, 25 MiB) <em>and</em> make the app request it (<code>SO_RCVBUF</code>; most agents have a setting); read faster (several reader threads with <code>SO_REUSEPORT</code>); and send less (aggregate client-side, or switch high-value telemetry to TCP/gRPC like OTLP).</p>
<blockquote>⚠️ Production tip: alert on the <em>rate</em> of <code>UdpRcvbufErrors</code> (node_exporter: <code>node_netstat_Udp_RcvbufErrors</code>) on every host that receives UDP. It's the only signal you get.</blockquote>`,
        he: `<p><strong>NAT ו-firewalls</strong> הם stateful גם אם UDP לא. בלי SYN/FIN לעקוב אחריהם, הם מנחשים: רשומה נוצרת עם ה-packet היוצא הראשון ופגה אחרי idle timeout. ברירות המחדל של conntrack ב-Linux: ‏<code>nf_conntrack_udp_timeout = 30</code> שניות ל-flow חד-כיווני, ‏<code>nf_conntrack_udp_timeout_stream = 120</code> שניות אחרי שנראו תשובות. ראוטרים ביתיים משתמשים לרוב ב-30 עד 60 שניות. session של UDP ששותק יותר מזה מאבד את המיפוי — packets נכנסים נזרקים. בגלל זה ל-WireGuard יש <code>PersistentKeepalive = 25</code>, ובגלל זה VoIP/SIP שולחים keepalive כל 20–30 שניות בערך. ב-Kubernetes, הבאג המפורסם של "DNS לוקח לפעמים 5 שניות" היה race ב-conntrack בין שאילתות A ו-AAAA מקבילות ב-UDP מאותו socket (ראה <code>net-nat-conntrack</code>).</p>
<p><strong>איבוד packets בלי שאף אחד שם לב.</strong> ל-UDP אין flow control: אם packets מגיעים מהר יותר ממה שהאפליקציה קוראת ל-<code>recv()</code>, ה-<strong>receive buffer</strong> של ה-socket מתמלא וה-kernel זורק את השאר — בלי שגיאה לשולח או למקבל. ה-buffer הדיפולטי קטן:</p>
<pre>$ sysctl net.core.rmem_default net.core.rmem_max
net.core.rmem_default = 212992      # ~208 KiB
net.core.rmem_max = 212992          # apps can't ask for more than this

$ netstat -su        # or: nstat -az | grep -i udp
Udp:
    98123456 packets received
    1203 packets to unknown port received
    4417209 packet receive errors
    51234567 packets sent
    4417209 receive buffer errors      &lt;-- drops: buffer was full
    0 send buffer errors</pre>
<p>כל datagram בתור עולה את ה-payload שלו <em>ועוד</em> overhead של ה-kernel (ה-truesize של ה-skb, מאות bytes עד כמה KiB), אז ~208 KiB מחזיקים רק כמה מאות packets קטנים. ב-50,000 packets בשנייה זה <strong>כמה מילי-שניות</strong> של מרווח: GC pause אחד או קפיצת CPU אצל הקורא — ואלפי packets נעלמים.</p>
<pre>$ ss -uamn 'sport = :8125'
State  Recv-Q  Send-Q  Local Address:Port  Peer Address:Port
UNCONN 213760  0             0.0.0.0:8125       0.0.0.0:*
	 skmem:(r213760,rb212992,t0,tb212992,f0,w0,o0,bl0,d88231)
#  r = bytes queued now (full!), rb = buffer size, d = packets dropped on this socket</pre>
<p>מתקנים בשכבות: להרים את התקרה (<code>sysctl -w net.core.rmem_max=26214400</code>, ‏25 MiB) <em>וגם</em> לגרום לאפליקציה לבקש אותה (<code>SO_RCVBUF</code>; לרוב ה-agents יש הגדרה לזה); לקרוא מהר יותר (כמה threads קוראים עם <code>SO_REUSEPORT</code>); ולשלוח פחות (aggregation בצד הלקוח, או להעביר telemetry חשוב ל-TCP/gRPC כמו OTLP).</p>
<blockquote>⚠️ טיפ לפרודקשן: תתריע על <em>הקצב</em> של <code>UdpRcvbufErrors</code> (ב-node_exporter: ‏<code>node_netstat_Udp_RcvbufErrors</code>) בכל host שמקבל UDP. זה הסימן היחיד שתקבל.</blockquote>`
      }
    },
    {
      h: { en: "Ports, sockets, MTU and fragmentation", he: "Ports, ‏sockets, ‏MTU ו-fragmentation" },
      body: {
        en: `<p>A port is a 16-bit number (0–65535); TCP port 53 and UDP port 53 are <strong>different</strong> ports. A TCP connection is identified by the 5-tuple (protocol, src IP, src port, dst IP, dst port); outgoing connections pick a source port from the ephemeral range (<code>net.ipv4.ip_local_port_range</code>, default <code>32768 60999</code> on Linux).</p>
<pre>$ ss -tulpn
Netid State  Recv-Q Send-Q  Local Address:Port  Peer Address:Port Process
udp   UNCONN 0      0           127.0.0.53%lo:53         0.0.0.0:*     users:(("systemd-resolve",pid=612,fd=13))
udp   UNCONN 0      0             0.0.0.0:8125         0.0.0.0:*     users:(("statsd",pid=2210,fd=7))
tcp   LISTEN 0      4096          0.0.0.0:22           0.0.0.0:*     users:(("sshd",pid=901,fd=3))
tcp   LISTEN 0      511           0.0.0.0:443          0.0.0.0:*     users:(("nginx",pid=1450,fd=6))
# -t tcp, -u udp, -l listening, -p process, -n numeric. UDP shows UNCONN: there is no "LISTEN" without connections.</pre>
<p><strong>MTU</strong> (usually 1500 bytes on Ethernet, 9001 inside an AWS VPC) limits one packet on the wire. The math for the largest payload that fits without fragmentation:</p>
<table>
<tr><th></th><th>IPv4</th><th>IPv6</th></tr>
<tr><td>UDP payload at MTU 1500</td><td>1500 − 20 (IP) − 8 (UDP) = <strong>1472</strong></td><td>1500 − 40 − 8 = 1452</td></tr>
<tr><td>TCP MSS at MTU 1500</td><td>1500 − 20 − 20 = <strong>1460</strong></td><td>1440</td></tr>
<tr><td>Max UDP datagram</td><td>65,535 − 20 − 8 = 65,507</td><td>65,527 (jumbograms aside)</td></tr>
</table>
<p>TCP negotiates its MSS and segments the stream itself, so it rarely fragments. A UDP datagram larger than the path MTU gets <strong>IP-fragmented</strong>, and that's fragile: lose one fragment and the whole datagram is gone; many firewalls and cloud load balancers drop fragments outright; and fragments after the first carry no port numbers, so port-based rules can't match them. That's why DNS recommends EDNS buffer sizes of <strong>1232 bytes</strong> (DNS Flag Day 2020) and retries over TCP when the answer is truncated (<code>TC</code> bit).</p>
<blockquote>⚠️ Production tip: tunnels shrink the MTU — VXLAN adds 50 bytes, WireGuard 60–80, IPsec ~50–70. If small requests work but large responses hang over a VPN, suspect MTU: <code>ping -M do -s 1472 host</code> finds the real path MTU.</blockquote>`,
        he: `<p>Port הוא מספר של 16 bits (0–65535); ‏port 53 של TCP ו-port 53 של UDP הם ports <strong>שונים</strong>. חיבור TCP מזוהה ע"י ה-5-tuple (פרוטוקול, IP מקור, port מקור, IP יעד, port יעד); חיבורים יוצאים בוחרים port מקור מטווח ה-ephemeral (<code>net.ipv4.ip_local_port_range</code>, ברירת מחדל <code>32768 60999</code> ב-Linux).</p>
<pre>$ ss -tulpn
Netid State  Recv-Q Send-Q  Local Address:Port  Peer Address:Port Process
udp   UNCONN 0      0           127.0.0.53%lo:53         0.0.0.0:*     users:(("systemd-resolve",pid=612,fd=13))
udp   UNCONN 0      0             0.0.0.0:8125         0.0.0.0:*     users:(("statsd",pid=2210,fd=7))
tcp   LISTEN 0      4096          0.0.0.0:22           0.0.0.0:*     users:(("sshd",pid=901,fd=3))
tcp   LISTEN 0      511           0.0.0.0:443          0.0.0.0:*     users:(("nginx",pid=1450,fd=6))
# -t tcp, -u udp, -l listening, -p process, -n numeric. UDP shows UNCONN: there is no "LISTEN" without connections.</pre>
<p><strong>MTU</strong> (בדרך כלל 1500 bytes ב-Ethernet, ‏9001 בתוך VPC של AWS) מגביל packet אחד על הקו. החשבון של ה-payload הכי גדול שנכנס בלי fragmentation:</p>
<table>
<tr><th></th><th>IPv4</th><th>IPv6</th></tr>
<tr><td>UDP payload ב-MTU 1500</td><td>1500 − 20 (IP) − 8 (UDP) = <strong>1472</strong></td><td>1500 − 40 − 8 = 1452</td></tr>
<tr><td>TCP MSS ב-MTU 1500</td><td>1500 − 20 − 20 = <strong>1460</strong></td><td>1440</td></tr>
<tr><td>Datagram מקסימלי של UDP</td><td>65,535 − 20 − 8 = 65,507</td><td>65,527 (בלי jumbograms)</td></tr>
</table>
<p>TCP מנהל משא ומתן על ה-MSS ומחלק את ה-stream בעצמו, אז הוא כמעט לא עושה fragmentation. ‏datagram של UDP שגדול מה-MTU של המסלול עובר <strong>IP fragmentation</strong>, וזה שביר: fragment אחד אבד — וכל ה-datagram הלך; הרבה firewalls ו-load balancers בענן זורקים fragments בלי לשאול; וה-fragments שאחרי הראשון לא נושאים מספרי port, אז חוקים לפי port לא תופסים אותם. בגלל זה ב-DNS ממליצים על EDNS buffer של <strong>1232 bytes</strong> (‏DNS Flag Day 2020) ועל ניסיון חוזר ב-TCP כשהתשובה נחתכה (ה-bit ‏<code>TC</code>).</p>
<blockquote>⚠️ טיפ לפרודקשן: tunnels מקטינים את ה-MTU — VXLAN מוסיף 50 bytes, ‏WireGuard ‏60–80, ‏IPsec בערך 50–70. אם בקשות קטנות עובדות ותשובות גדולות נתקעות מעל VPN, תחשוד ב-MTU: <code>ping -M do -s 1472 host</code> מוצא את ה-MTU האמיתי של המסלול.</blockquote>`
      }
    },
    {
      h: { en: "Debugging both: nc, tcpdump, dig", he: "לדבג את שניהם: nc, ‏tcpdump, ‏dig" },
      body: {
        en: `<p>TCP tells you when something's wrong (connection refused = RST, timeout = SYN dropped). UDP mostly doesn't: no reply looks the same whether the port is closed, filtered or the app ignored you. The only hint is an ICMP "port unreachable" when the host is reachable and nothing listens.</p>
<pre># TCP: is the port open?
$ nc -vz db.internal 5432
Connection to db.internal 5432 port [tcp/postgresql] succeeded!

# UDP: start a listener on one box, send from another
box-a$ nc -u -l 9999
box-b$ echo "hello" | nc -u -w1 box-a 9999      # appears on box-a if UDP gets through

# Watch DNS on the wire (both transports)
$ sudo tcpdump -ni any 'port 53'
10:02:11.120 IP 10.0.1.7.41544 &gt; 10.0.0.2.53: 5512+ A? api.shop.com. (30)
10:02:11.121 IP 10.0.0.2.53 &gt; 10.0.1.7.41544: 5512 1/0/0 A 10.0.3.15 (46)

# Force DNS over TCP to rule out UDP/fragment issues
$ dig +tcp api.shop.com
$ dig +bufsize=1232 example.com DNSKEY</pre>
<p>For a UDP receiver that "loses data", check in this order: is the packet arriving at the NIC (<code>tcpdump</code>)? Is the kernel dropping it (<code>netstat -su</code> receive buffer errors, <code>ss -uam</code> drops)? Is a firewall/conntrack table full (<code>dmesg | grep conntrack</code> → "table full, dropping packet")? Only then blame the app.</p>
<blockquote>💡 Real world: <code>tcpdump</code> sees the packet before the socket buffer, so "it's in tcpdump but the app never got it" is the fingerprint of receive-buffer drops.</blockquote>`,
        he: `<p>TCP אומר לך כשמשהו לא בסדר (connection refused = ‏RST, ‏timeout = ה-SYN נזרק). ‏UDP בדרך כלל לא: חוסר תשובה נראה אותו דבר בין אם ה-port סגור, מסונן או שהאפליקציה פשוט התעלמה ממך. הרמז היחיד הוא ICMP "port unreachable" כשה-host זמין ואף אחד לא מאזין.</p>
<pre># TCP: is the port open?
$ nc -vz db.internal 5432
Connection to db.internal 5432 port [tcp/postgresql] succeeded!

# UDP: start a listener on one box, send from another
box-a$ nc -u -l 9999
box-b$ echo "hello" | nc -u -w1 box-a 9999      # appears on box-a if UDP gets through

# Watch DNS on the wire (both transports)
$ sudo tcpdump -ni any 'port 53'
10:02:11.120 IP 10.0.1.7.41544 &gt; 10.0.0.2.53: 5512+ A? api.shop.com. (30)
10:02:11.121 IP 10.0.0.2.53 &gt; 10.0.1.7.41544: 5512 1/0/0 A 10.0.3.15 (46)

# Force DNS over TCP to rule out UDP/fragment issues
$ dig +tcp api.shop.com
$ dig +bufsize=1232 example.com DNSKEY</pre>
<p>כשמקבל UDP "מאבד דאטה", תבדוק בסדר הזה: האם ה-packet מגיע ל-NIC (‏<code>tcpdump</code>)? האם ה-kernel זורק אותו (receive buffer errors ב-<code>netstat -su</code>, ‏drops ב-<code>ss -uam</code>)? האם טבלת firewall/conntrack מלאה (‏<code>dmesg | grep conntrack</code> ← "table full, dropping packet")? רק אחרי זה תאשים את האפליקציה.</p>
<blockquote>💡 מהשטח: <code>tcpdump</code> רואה את ה-packet לפני ה-socket buffer, אז "זה מופיע ב-tcpdump אבל האפליקציה אף פעם לא קיבלה" זו טביעת האצבע של drops ב-receive buffer.</blockquote>`
      }
    }
  ],
  diagram: `  TCP: SYN -> SYN/ACK -> ACK -> data, ACK, data, ACK ...   (stream, in order, retransmits)
        seg1 seg2 [seg3 LOST] seg4 seg5  -> app gets 1,2 ... waits ... 3,4,5   (HOL blocking)

  UDP: dgram1 dgram2 [dgram3 LOST] dgram4  -> app gets 1,2,4   (nobody notices)

  QUIC over UDP:  stream A: a1 a2 [a3 lost] a4  -> A waits for a3
                  stream B: b1 b2 b3            -> B delivered immediately

  UDP receive path:  NIC -> kernel -> socket rcvbuf (~208 KiB) -> app recv()
                                       full? -> DROP (+1 RcvbufErrors)`,
  handsOn: [
    { cmd: "ss -tulpn", what: { en: "List every listening TCP port and bound UDP socket with its process.", he: "להציג כל port של TCP שמאזין וכל socket של UDP עם התהליך שלו." } },
    { cmd: "netstat -su | grep -iE 'receive|buffer'   # or: nstat -az UdpRcvbufErrors", what: { en: "Check for silent UDP drops: receive buffer errors climbing = socket buffer overflow.", he: "לבדוק drops שקטים ב-UDP: אם receive buffer errors עולה, ה-socket buffer מתפוצץ." } },
    { cmd: "nc -u -l 9999   # second terminal: echo hi | nc -u -w1 127.0.0.1 9999", what: { en: "Send and receive a raw UDP datagram; then stop the listener and send again — no error appears.", he: "לשלוח ולקבל datagram גולמי של UDP; אחר כך לעצור את המאזין ולשלוח שוב — שום שגיאה לא מופיעה." } },
    { cmd: "sudo tcpdump -ni any udp port 53 & dig example.com; dig +tcp example.com", what: { en: "See DNS over UDP, then force the same query over TCP and compare the handshake.", he: "לראות DNS מעל UDP, ואז להכריח את אותה שאילתה מעל TCP ולהשוות את ה-handshake." } },
    { cmd: "ping -M do -s 1472 -c 3 8.8.8.8", what: { en: "Probe path MTU: 1472 + 28 header bytes = 1500. Lower -s until it passes over a VPN.", he: "לבדוק את ה-MTU של המסלול: 1472 ועוד 28 bytes של headers = ‏1500. מעל VPN תקטין את הגודל עד שזה עובר." } }
  ],
  mnemonic: {
    en: "\"TCP calls, UDP mails, QUIC tracks.\" And: 20 vs 8, 1460 vs 1472.",
    he: "\"TCP מתקשר, UDP שולח גלויה, QUIC עוקב אחרי המשלוח.\" ובנוסף: 20 מול 8, ‏1460 מול 1472."
  },
  pitfalls: [
    { en: "Assuming UDP delivery because nothing errored. sendto() succeeding only means the packet left your buffer; drops at the receiver are visible only in its netstat -su counters.", he: "להניח ש-UDP הגיע כי לא הייתה שגיאה. ‏sendto() שהצליח אומר רק שה-packet יצא מה-buffer שלך; drops אצל המקבל נראים רק במונים של netstat -su שלו." },
    { en: "Opening only UDP 53 for DNS. Large answers (DNSSEC, many records) set the TC bit and retry over TCP 53 — allow both.", he: "לפתוח רק UDP 53 ל-DNS. תשובות גדולות (DNSSEC, הרבה רשומות) מדליקות את ה-bit של TC ומנסות שוב ב-TCP 53 — תפתח את שניהם." },
    { en: "Raising SO_RCVBUF in the app without raising net.core.rmem_max. The kernel silently caps the request at rmem_max (and reports double the value), so nothing changes.", he: "להגדיל SO_RCVBUF באפליקציה בלי להגדיל את net.core.rmem_max. ה-kernel חותך את הבקשה בשקט ל-rmem_max (ומדווח על פי 2 מהערך), אז כלום לא משתנה." },
    { en: "Building your own reliability on UDP for normal request/response traffic. You will re-implement retransmits, ordering and congestion control worse than TCP or QUIC.", he: "לבנות אמינות משלך מעל UDP לתעבורת request/response רגילה. אתה תממש מחדש retransmits, סדר ו-congestion control יותר גרוע מ-TCP או QUIC." }
  ],
  interview: [
    {
      q: { en: "Why does DNS use UDP, and when does it switch to TCP?", he: "למה DNS משתמש ב-UDP, ומתי הוא עובר ל-TCP?" },
      a: { en: "A query is one small request and one small response; UDP avoids a 1-RTT handshake and per-connection server state, which matters for resolvers handling huge query rates. It switches to TCP when the response doesn't fit (server sets the TC bit), for zone transfers (AXFR/IXFR), and for DNS-over-TLS. Keep EDNS buffers around 1232 bytes to avoid fragmentation.", he: "שאילתה היא בקשה קטנה אחת ותשובה קטנה אחת; UDP חוסך handshake של RTT ו-state לכל חיבור בשרת, וזה קריטי ל-resolvers שמטפלים בכמויות ענק של שאילתות. הוא עובר ל-TCP כשהתשובה לא נכנסת (השרת מדליק את ה-bit של TC), ב-zone transfers (‏AXFR/IXFR) וב-DNS-over-TLS. כדאי להחזיק EDNS buffer סביב 1232 bytes כדי להימנע מ-fragmentation." }
    },
    {
      q: { en: "Your StatsD dashboards show request counts 20% lower than the load balancer logs. What do you check?", he: "ה-dashboards של StatsD מראים 20% פחות בקשות מהלוגים של ה-load balancer. מה אתה בודק?" },
      a: { en: "UDP drops on the receiver: netstat -su receive buffer errors and ss -uam drop counters on the StatsD host, and the agent's CPU (single-threaded readers saturate). Fix by raising rmem_max and the agent's SO_RCVBUF, adding readers with SO_REUSEPORT, aggregating client-side, or moving to a TCP-based protocol. Also check conntrack table-full messages on any NAT in between.", he: "drops של UDP אצל המקבל: receive buffer errors ב-netstat -su ומוני drops ב-ss -uam על ה-host של StatsD, וגם ה-CPU של ה-agent (קוראים עם thread בודד נחנקים). מתקנים ע\"י הגדלת rmem_max וה-SO_RCVBUF של ה-agent, הוספת קוראים עם SO_REUSEPORT, aggregation בצד הלקוח, או מעבר לפרוטוקול מבוסס TCP. וגם לבדוק הודעות table full של conntrack בכל NAT שבדרך." }
    },
    {
      q: { en: "HTTP/2 already multiplexes streams. Why did HTTP/3 move to UDP?", he: "HTTP/2 כבר מריץ streams במקביל. למה HTTP/3 עבר ל-UDP?" },
      a: { en: "HTTP/2 multiplexes at the application layer but rides one TCP byte stream, so one lost packet blocks every stream (transport HOL blocking). QUIC over UDP gives each stream independent loss recovery, merges the transport and TLS 1.3 handshakes into 1 RTT, supports connection migration via connection IDs, and lives in user space so it can evolve without kernel and middlebox upgrades.", he: "HTTP/2 עושה multiplexing בשכבת האפליקציה אבל רוכב על stream אחד של TCP, אז packet אחד שאבד חוסם את כל ה-streams (HOL blocking ברמת ה-transport). ‏QUIC מעל UDP נותן לכל stream שחזור איבוד עצמאי, מאחד את ה-handshake של ה-transport ושל TLS 1.3 ל-RTT אחד, תומך ב-connection migration דרך connection IDs, וחי ב-user space אז הוא יכול להתפתח בלי לחכות לשדרוג של kernels ו-middleboxes." }
    }
  ],
  quiz: [
    {
      q: { en: "What are the minimum header sizes of TCP and UDP?", he: "מה גודל ה-header המינימלי של TCP ושל UDP?" },
      options: [
        { en: "TCP 8 bytes, UDP 20 bytes", he: "TCP ‏8 bytes, ‏UDP ‏20 bytes" },
        { en: "TCP 20 bytes, UDP 8 bytes", he: "TCP ‏20 bytes, ‏UDP ‏8 bytes" },
        { en: "Both 20 bytes", he: "שניהם 20 bytes" },
        { en: "TCP 40 bytes, UDP 0 bytes", he: "TCP ‏40 bytes, ‏UDP ‏0 bytes" }
      ],
      answer: 1,
      explain: { en: "UDP has 4 fields of 2 bytes (ports, length, checksum). TCP needs sequence/ack numbers, flags and window: 20 bytes, up to 60 with options.", he: "ל-UDP יש 4 שדות של 2 bytes (ports, אורך, checksum). ‏TCP צריך sequence ו-ack numbers, ‏flags ו-window: ‏20 bytes, ועד 60 עם options." }
    },
    {
      q: { en: "On a UDP receiver, netstat -su shows 'receive buffer errors' climbing fast. What's happening?", he: "על מקבל UDP, ‏netstat -su מראה ש-receive buffer errors עולה מהר. מה קורה?" },
      options: [
        { en: "Packets have bad checksums from a faulty NIC", he: "ל-packets יש checksum שגוי בגלל NIC תקול" },
        { en: "The sender is blocked by a firewall", he: "השולח חסום ע\"י firewall" },
        { en: "The socket's receive buffer is full because the app reads slower than packets arrive, so the kernel drops them", he: "ה-receive buffer של ה-socket מלא כי האפליקציה קוראת לאט יותר מקצב ההגעה, אז ה-kernel זורק packets" },
        { en: "UDP retransmissions are failing", he: "ה-retransmissions של UDP נכשלים" }
      ],
      answer: 2,
      explain: { en: "UDP has no flow control or retransmission. When rcvbuf is full the kernel drops and counts it here. Fix: bigger rmem_max + SO_RCVBUF, faster/multiple readers, less traffic.", he: "ל-UDP אין flow control ואין retransmission. כשה-rcvbuf מלא ה-kernel זורק וסופר את זה כאן. התיקון: rmem_max ו-SO_RCVBUF גדולים יותר, קוראים מהירים או מרובים, פחות תעבורה." }
    },
    {
      q: { en: "Largest UDP payload that fits in one IPv4 packet on a 1500-byte MTU without fragmentation?", he: "מה ה-payload הכי גדול של UDP שנכנס ב-packet אחד של IPv4 ב-MTU של 1500 בלי fragmentation?" },
      options: [
        { en: "1500 bytes", he: "1500 bytes" },
        { en: "1480 bytes", he: "1480 bytes" },
        { en: "1472 bytes", he: "1472 bytes" },
        { en: "1460 bytes", he: "1460 bytes" }
      ],
      answer: 2,
      explain: { en: "1500 − 20 (IPv4 header) − 8 (UDP header) = 1472. 1460 is the TCP MSS (20-byte TCP header instead of 8).", he: "1500 − 20 (header של IPv4) − 8 (header של UDP) = ‏1472. ‏1460 זה ה-MSS של TCP (header של 20 bytes במקום 8)." }
    },
    {
      q: { en: "Why does HTTP/3 avoid the head-of-line blocking HTTP/2 suffers from on lossy networks?", he: "למה HTTP/3 נמנע מה-head-of-line blocking ש-HTTP/2 סובל ממנו ברשתות עם איבוד?" },
      options: [
        { en: "It compresses headers better", he: "הוא דוחס headers יותר טוב" },
        { en: "QUIC recovers loss per stream over UDP, so a lost packet only stalls the stream it belongs to", he: "QUIC משחזר איבוד לכל stream בנפרד מעל UDP, אז packet שאבד עוצר רק את ה-stream שלו" },
        { en: "UDP never loses packets", he: "UDP אף פעם לא מאבד packets" },
        { en: "It opens one TCP connection per request", he: "הוא פותח חיבור TCP לכל בקשה" }
      ],
      answer: 1,
      explain: { en: "In TCP all streams share one ordered byte stream. QUIC tracks ordering per stream, so loss on one doesn't block the others.", he: "ב-TCP כל ה-streams חולקים stream מסודר אחד של bytes. ‏QUIC עוקב אחרי הסדר בכל stream בנפרד, אז איבוד באחד לא חוסם את האחרים." }
    }
  ],
  playground: "firewall",
  related: ["net-osi-tcpip", "net-tcp-deep", "pr-http-versions", "net-nat-conntrack", "net-dns", "net-troubleshooting"]
});

/* ============================== MEMORY HIERARCHY & VIRTUAL MEMORY ============================== */
INFRA.lessons.push({
  id: "memory-hierarchy",
  track: "foundations",
  order: 31,
  icon: "🏔️",
  level: 2,
  minutes: 13,
  title: { en: "The Memory Hierarchy & Virtual Memory: caches, pages, TLBs and NUMA", he: "היררכיית הזיכרון ו-Virtual Memory: caches, ‏pages, ‏TLB ו-NUMA" },
  tldr: {
    en: "Memory is a pyramid — a few KiB of registers at 0.3 ns down to TBs of disk at milliseconds — and the CPU moves data in 64-byte cache lines and 4 KiB pages; code that respects locality runs 10-100× faster than code that doesn't, on the same hardware.",
    he: "הזיכרון הוא פירמידה — כמה KiB של registers ב-0.3 ns ועד TBs של דיסק במילי-שניות — וה-CPU מזיז דאטה ב-cache lines של 64 bytes וב-pages של 4 KiB; קוד שמכבד locality רץ מהר פי 10 עד 100 מקוד שלא, על אותה חומרה בדיוק."
  },
  analogy: {
    en: "You're a chef. Registers are the ingredients in your hands. L1 is the cutting board, L2 the counter, L3 the shared fridge in the kitchen, RAM is the walk-in freezer down the corridor, SSD is the supplier across town, HDD is a farm in another country. You never fetch one carrot from the freezer — you bring the whole tray (a cache line), and you keep the tray near you because you'll probably need the next carrot too (locality). The page table is the kitchen map that says which shelf in the freezer is 'yours', and the TLB is the sticky note with the shelves you used most recently.",
    he: "אתה שף. ה-registers הם המצרכים שבידיים שלך. ‏L1 זה קרש החיתוך, ‏L2 השיש, ‏L3 המקרר המשותף במטבח, ה-RAM זה חדר הקירור בסוף המסדרון, SSD זה הספק בצד השני של העיר, ו-HDD זו חווה בחו\"ל. אף פעם לא מביאים גזר אחד מחדר הקירור — מביאים את כל המגש (cache line), ומחזיקים אותו קרוב כי כנראה תצטרך גם את הגזר הבא (locality). ה-page table זו מפת המטבח שאומרת איזה מדף בחדר הקירור 'שלך', וה-TLB זה הפתק הצהוב עם המדפים שהשתמשת בהם לאחרונה."
  },
  sections: [
    {
      h: { en: "The pyramid: sizes and latencies", he: "הפירמידה: גדלים ו-latencies" },
      body: {
        en: `<p>Every level is ~10× bigger and ~3–10× slower than the one above. Typical modern server (per core unless noted):</p>
<table>
<tr><th>Level</th><th>Size</th><th>Latency</th><th>Cycles @ 3.5 GHz</th></tr>
<tr><td>Registers</td><td>~16 general + 32 vector, a few KiB</td><td>~0.3 ns</td><td>1</td></tr>
<tr><td>L1d cache</td><td>32–48 KiB</td><td>~1 ns</td><td>4–5</td></tr>
<tr><td>L2 cache</td><td>1–2 MiB</td><td>~3–5 ns</td><td>~14</td></tr>
<tr><td>L3 cache (shared)</td><td>32–384 MiB per socket</td><td>~10–20 ns</td><td>40–70</td></tr>
<tr><td>DRAM</td><td>64 GiB – several TiB</td><td>~80–120 ns</td><td>~300–400</td></tr>
<tr><td>NVMe SSD</td><td>TBs</td><td>~20–100 µs</td><td>~100,000+</td></tr>
<tr><td>HDD</td><td>tens of TB</td><td>~5–10 ms</td><td>~25,000,000</td></tr>
</table>
<p>A RAM miss costs ~300 cycles; a modern core can retire 4+ instructions per cycle, so one miss = <strong>~1,000 instructions of lost work</strong>. That's why "the CPU is at 100%" often means "the CPU is 100% busy waiting for memory" (look at IPC below 1 in <code>perf stat</code>). The time-scaled view of these numbers is in <code>latency-numbers</code>.</p>
<pre>$ lscpu | grep -E 'Model name|^CPU\\(s\\)|L1d|L2|L3|NUMA node\\(s\\)'
CPU(s):                  64
Model name:              AMD EPYC 9354 32-Core Processor
L1d cache:               1 MiB (32 instances)      # 32 KiB per core
L2 cache:                32 MiB (32 instances)     # 1 MiB per core
L3 cache:                256 MiB (8 instances)     # 32 MiB per 8-core CCD
NUMA node(s):            1
$ getconf LEVEL1_DCACHE_LINESIZE
64</pre>
<blockquote>💡 Real world: on the EPYC above, L3 is split into 8 slices of 32 MiB, one per chiplet. A thread on chiplet 0 reading data cached in chiplet 5's L3 pays almost RAM latency — "L3 = 256 MiB" is true but not uniform.</blockquote>`,
        he: `<p>כל רמה גדולה בערך פי 10 ואיטית פי 3 עד 10 מזו שמעליה. שרת מודרני טיפוסי (לכל core, אלא אם צוין אחרת):</p>
<table>
<tr><th>רמה</th><th>גודל</th><th>Latency</th><th>Cycles ב-3.5 GHz</th></tr>
<tr><td>Registers</td><td>~16 כלליים ועוד 32 וקטוריים, כמה KiB</td><td>~0.3 ns</td><td>1</td></tr>
<tr><td>L1d cache</td><td>32–48 KiB</td><td>~1 ns</td><td>4–5</td></tr>
<tr><td>L2 cache</td><td>1–2 MiB</td><td>~3–5 ns</td><td>~14</td></tr>
<tr><td>L3 cache (משותף)</td><td>32–384 MiB לכל socket</td><td>~10–20 ns</td><td>40–70</td></tr>
<tr><td>DRAM</td><td>64 GiB עד כמה TiB</td><td>~80–120 ns</td><td>~300–400</td></tr>
<tr><td>NVMe SSD</td><td>TBs</td><td>~20–100 µs</td><td>~100,000+</td></tr>
<tr><td>HDD</td><td>עשרות TB</td><td>~5–10 ms</td><td>~25,000,000</td></tr>
</table>
<p>Miss ל-RAM עולה בערך 300 cycles; ‏core מודרני יכול לסיים 4 פקודות ומעלה בכל cycle, אז miss אחד = <strong>בערך 1,000 פקודות של עבודה שהלכה לאיבוד</strong>. בגלל זה "ה-CPU ב-100%" אומר הרבה פעמים "ה-CPU עסוק 100% בלחכות לזיכרון" (תחפש IPC מתחת ל-1 ב-<code>perf stat</code>). התצוגה של המספרים האלה בקנה מידה אנושי נמצאת ב-<code>latency-numbers</code>.</p>
<pre>$ lscpu | grep -E 'Model name|^CPU\\(s\\)|L1d|L2|L3|NUMA node\\(s\\)'
CPU(s):                  64
Model name:              AMD EPYC 9354 32-Core Processor
L1d cache:               1 MiB (32 instances)      # 32 KiB per core
L2 cache:                32 MiB (32 instances)     # 1 MiB per core
L3 cache:                256 MiB (8 instances)     # 32 MiB per 8-core CCD
NUMA node(s):            1
$ getconf LEVEL1_DCACHE_LINESIZE
64</pre>
<blockquote>💡 מהשטח: ב-EPYC שלמעלה ה-L3 מחולק ל-8 פרוסות של 32 MiB, אחת לכל chiplet. ‏thread על chiplet 0 שקורא דאטה שנמצא ב-L3 של chiplet 5 משלם כמעט latency של RAM — "L3 = 256 MiB" זה נכון, אבל לא אחיד.</blockquote>`
      }
    },
    {
      h: { en: "Cache lines, locality, false sharing — why arrays beat linked lists", he: "Cache lines, ‏locality, ‏false sharing — למה מערכים מנצחים רשימות מקושרות" },
      body: {
        en: `<p>The CPU never reads one byte from RAM. It reads a <strong>64-byte cache line</strong> (128 B on Apple M-series). Two kinds of <strong>locality</strong> make that pay off:</p>
<ul><li><strong>Spatial</strong> — you'll use the neighbors soon. Reading <code>int32</code>s sequentially uses all 16 values in each line; the hardware <strong>prefetcher</strong> notices the stride and fetches the next lines before you ask.</li>
<li><strong>Temporal</strong> — you'll use the same data again soon, so it's still in L1/L2.</li></ul>
<p><strong>Worked example — sum 1 million integers:</strong></p>
<pre>Array (4 MB contiguous):
  4 MB ÷ 64 B = 62,500 cache lines, streamed by the prefetcher
  at ~10–15 GB/s per core  -&gt;  ~0.3–0.4 ms

Linked list (1M nodes scattered across the heap):
  each node = a dependent pointer chase -&gt; a cache miss the prefetcher can't predict
  1,000,000 × ~100 ns  -&gt;  ~100 ms        (≈ 250× slower, same Big-O: O(n))</pre>
<p>Real benchmarks land between 10× and 100×+ depending on how scattered the allocator left the nodes. Big-O counts operations; hardware charges per cache miss. This is why <code>std::vector</code>/Go slices/Java <code>ArrayList</code> beat linked lists even for many insert-in-the-middle workloads, why columnar databases (Parquet, ClickHouse) scan fast, and why B-trees use wide nodes.</p>
<p><strong>False sharing</strong>: two threads update two <em>different</em> variables that happen to sit on the <em>same</em> cache line. Each write invalidates the line in the other core's cache (MESI protocol), so the line ping-pongs between cores at ~50–100 ns per hop. Two "independent" counters can run 10× slower than one thread.</p>
<pre>// Go — per-worker counters on one line: false sharing
type counters struct{ a, b uint64 }            // 16 bytes, same 64-byte line
// fix: pad each hot field to its own line
type padded struct{ v uint64; _ [56]byte }    // 64 bytes each
// Java: @jdk.internal.vm.annotation.Contended   C++: alignas(64)</pre>`,
        he: `<p>ה-CPU אף פעם לא קורא byte אחד מ-RAM. הוא קורא <strong>cache line של 64 bytes</strong> (‏128 B ב-Apple M-series). שני סוגי <strong>locality</strong> גורמים לזה להשתלם:</p>
<ul><li><strong>מרחבית (spatial)</strong> — תשתמש בשכנים בקרוב. קריאה רציפה של <code>int32</code>-ים מנצלת את כל 16 הערכים בכל line; ה-<strong>prefetcher</strong> בחומרה מזהה את הדפוס ומביא את ה-lines הבאים לפני שביקשת.</li>
<li><strong>בזמן (temporal)</strong> — תשתמש שוב באותו דאטה בקרוב, אז הוא עדיין ב-L1/L2.</li></ul>
<p><strong>דוגמה מחושבת — סכום של מיליון מספרים:</strong></p>
<pre>Array (4 MB contiguous):
  4 MB ÷ 64 B = 62,500 cache lines, streamed by the prefetcher
  at ~10–15 GB/s per core  -&gt;  ~0.3–0.4 ms

Linked list (1M nodes scattered across the heap):
  each node = a dependent pointer chase -&gt; a cache miss the prefetcher can't predict
  1,000,000 × ~100 ns  -&gt;  ~100 ms        (≈ 250× slower, same Big-O: O(n))</pre>
<p>בנצ'מרקים אמיתיים יוצאים בין פי 10 לפי 100 ויותר, תלוי כמה ה-allocator פיזר את ה-nodes. ‏Big-O סופר פעולות; החומרה גובה לפי cache miss. בגלל זה <code>std::vector</code>, ‏slices ב-Go ו-<code>ArrayList</code> ב-Java מנצחים רשימות מקושרות אפילו בהרבה עומסים של הכנסה באמצע, בגלל זה דאטאבייסים עמודתיים (Parquet, ‏ClickHouse) סורקים מהר, ובגלל זה B-trees משתמשים ב-nodes רחבים.</p>
<p><strong>False sharing</strong>: שני threads מעדכנים שני משתנים <em>שונים</em> שבמקרה יושבים על <em>אותו</em> cache line. כל כתיבה מבטלת את ה-line ב-cache של ה-core השני (פרוטוקול MESI), אז ה-line קופץ בין ה-cores בעלות של ~50–100 ns לכל קפיצה. שני מונים "בלתי תלויים" יכולים לרוץ לאט פי 10 מ-thread אחד.</p>
<pre>// Go — per-worker counters on one line: false sharing
type counters struct{ a, b uint64 }            // 16 bytes, same 64-byte line
// fix: pad each hot field to its own line
type padded struct{ v uint64; _ [56]byte }    // 64 bytes each
// Java: @jdk.internal.vm.annotation.Contended   C++: alignas(64)</pre>`
      }
    },
    {
      h: { en: "Virtual memory, page tables, the TLB and huge pages", he: "Virtual memory, ‏page tables, ה-TLB ו-huge pages" },
      body: {
        en: `<p>Every address your program uses is <strong>virtual</strong>. The MMU translates it to a physical address in units of <strong>pages</strong> — 4 KiB on x86-64 (<code>getconf PAGESIZE</code> → 4096; some ARM distros use 16 or 64 KiB). The mapping lives in a <strong>page table</strong>: on x86-64 a 4-level radix tree (48-bit addresses; 5 levels for 57-bit on the newest CPUs). A translation done the slow way is a <strong>page walk</strong> — up to 4 dependent memory reads before the real one.</p>
<p>To avoid that on every load, the CPU caches recent translations in the <strong>TLB</strong> (Translation Lookaside Buffer): ~64 entries in L1 dTLB, ~1,500–2,000 in the second-level TLB. The key number is <strong>TLB reach</strong> = entries × page size:</p>
<table>
<tr><th>Page size</th><th>Reach with 1,536 entries</th><th>Good for</th></tr>
<tr><td>4 KiB</td><td>1,536 × 4 KiB = <strong>6 MiB</strong></td><td>default, small processes</td></tr>
<tr><td>2 MiB (huge page)</td><td>1,536 × 2 MiB = <strong>3 GiB</strong></td><td>DB buffer pools, JVM heaps, DPDK</td></tr>
<tr><td>1 GiB (gigantic)</td><td>hundreds of GiB (fewer entries)</td><td>VM memory, giant in-memory datasets</td></tr>
</table>
<p>A process randomly touching a 100 GiB working set with 4 KiB pages misses the TLB on nearly every access. Huge pages cut page-table size and TLB misses dramatically — often 5–20% throughput for databases and VMs.</p>
<pre>$ grep -i huge /proc/meminfo
AnonHugePages:   4194304 kB      # THP currently in use
HugePages_Total:    8192         # explicitly reserved 2 MiB pages (16 GiB)
HugePages_Free:     1024
Hugepagesize:       2048 kB
$ cat /sys/kernel/mm/transparent_hugepage/enabled
always [madvise] never</pre>
<p>Two flavors: <strong>explicit huge pages</strong> (<code>vm.nr_hugepages</code>, reserved up front, used by Oracle, PostgreSQL <code>huge_pages=on</code>, DPDK) and <strong>Transparent Huge Pages</strong> (kernel promotes automatically). THP's background compaction (<code>khugepaged</code>) can cause latency spikes and memory bloat, which is why Redis, MongoDB and many DB vendors recommend <code>madvise</code> or <code>never</code>.</p>`,
        he: `<p>כל כתובת שהתוכנית שלך משתמשת בה היא <strong>וירטואלית</strong>. ה-MMU מתרגם אותה לכתובת פיזית ביחידות של <strong>pages</strong> — 4 KiB ב-x86-64 (‏<code>getconf PAGESIZE</code> ← 4096; חלק מההפצות ל-ARM משתמשות ב-16 או 64 KiB). המיפוי יושב ב-<strong>page table</strong>: ב-x86-64 זה עץ radix של 4 רמות (כתובות של 48 bits; 5 רמות ל-57 bits במעבדים החדשים ביותר). תרגום שנעשה בדרך האיטית הוא <strong>page walk</strong> — עד 4 קריאות זיכרון תלויות לפני הקריאה האמיתית.</p>
<p>כדי לא לעשות את זה בכל load, ה-CPU שומר תרגומים אחרונים ב-<strong>TLB</strong> (Translation Lookaside Buffer): בערך 64 רשומות ב-L1 dTLB, ובערך 1,500–2,000 ב-TLB של הרמה השנייה. המספר החשוב הוא <strong>TLB reach</strong> = רשומות × גודל page:</p>
<table>
<tr><th>גודל page</th><th>Reach עם 1,536 רשומות</th><th>מתאים ל-</th></tr>
<tr><td>4 KiB</td><td>1,536 × 4 KiB = <strong>6 MiB</strong></td><td>ברירת מחדל, תהליכים קטנים</td></tr>
<tr><td>2 MiB (huge page)</td><td>1,536 × 2 MiB = <strong>3 GiB</strong></td><td>buffer pools של DB, ‏heaps של JVM, ‏DPDK</td></tr>
<tr><td>1 GiB (gigantic)</td><td>מאות GiB (פחות רשומות)</td><td>זיכרון של VMs, ‏datasets ענקיים בזיכרון</td></tr>
</table>
<p>תהליך שנוגע באקראי ב-working set של 100 GiB עם pages של 4 KiB מפספס את ה-TLB כמעט בכל גישה. ‏Huge pages מקטינים דרמטית את ה-page table ואת ה-TLB misses — לרוב 5–20% throughput לדאטאבייסים ול-VMs.</p>
<pre>$ grep -i huge /proc/meminfo
AnonHugePages:   4194304 kB      # THP currently in use
HugePages_Total:    8192         # explicitly reserved 2 MiB pages (16 GiB)
HugePages_Free:     1024
Hugepagesize:       2048 kB
$ cat /sys/kernel/mm/transparent_hugepage/enabled
always [madvise] never</pre>
<p>יש שני סוגים: <strong>huge pages מפורשים</strong> (<code>vm.nr_hugepages</code>, שמורים מראש, בשימוש ב-Oracle, ב-PostgreSQL עם <code>huge_pages=on</code> וב-DPDK) ו-<strong>Transparent Huge Pages</strong> (ה-kernel מקדם אוטומטית). ה-compaction ברקע של THP (‏<code>khugepaged</code>) יכול לגרום לקפיצות latency ולניפוח זיכרון, ובגלל זה Redis, ‏MongoDB והרבה יצרני DB ממליצים על <code>madvise</code> או <code>never</code>.</p>`
      }
    },
    {
      h: { en: "Page faults and mmap", he: "Page faults ו-mmap" },
      body: {
        en: `<p>A <strong>page fault</strong> is the CPU saying "this virtual page has no valid mapping right now" and trapping into the kernel. It's normal — it's how lazy allocation works.</p>
<table>
<tr><th></th><th>Minor fault</th><th>Major fault</th></tr>
<tr><td>What</td><td>page is already in RAM (fresh zeroed page, page cache, shared lib) — just map it</td><td>data must be read from disk (swap or a file not in page cache)</td></tr>
<tr><td>Cost</td><td>~0.1–1 µs</td><td>~50–100 µs on NVMe, ~5–10 ms on HDD</td></tr>
<tr><td>Worry when</td><td>millions/s right after start (warm-up) — usually fine</td><td>steadily non-zero on a latency-sensitive service</td></tr>
</table>
<pre>$ /usr/bin/time -v ./build-index 2&gt;&amp;1 | grep -i 'page faults'
	Major (requiring I/O) page faults: 3812
	Minor (reclaiming a frame) page faults: 1048213
$ ps -o pid,min_flt,maj_flt,rss,cmd -p $(pgrep -d, java)
    PID  MINFL  MAJFL    RSS CMD
   4121 9.8e6    211 7340032 java -Xmx8g ...</pre>
<p><strong>mmap</strong> maps a file into the address space: reading the memory <em>is</em> reading the file, with the page cache doing the I/O through page faults. No <code>read()</code> syscalls, no copy into a user buffer, and the OS shares the pages between processes. Who relies on it:</p>
<ul><li><strong>Elasticsearch/OpenSearch (Lucene)</strong> mmaps index segments — hence the mandatory <code>vm.max_map_count=262144</code> (default 65530 is too low and the node refuses to start).</li>
<li><strong>Prometheus TSDB</strong>, LMDB, Kafka index files, and every shared library (<code>.so</code>) you load.</li></ul>
<blockquote>⚠️ Production tip: an mmap'd database whose working set exceeds RAM turns every cold read into a major fault inside an ordinary memory load — no slow-query log, no I/O wait in the app, just mysterious latency. Watch <code>maj_flt</code> and <code>vmstat 1</code>'s <code>bi</code> column.</blockquote>`,
        he: `<p><strong>Page fault</strong> זה ה-CPU שאומר "ל-page הווירטואלי הזה אין כרגע מיפוי תקין" ועובר ל-kernel. זה נורמלי — ככה lazy allocation עובד.</p>
<table>
<tr><th></th><th>Minor fault</th><th>Major fault</th></tr>
<tr><td>מה</td><td>ה-page כבר ב-RAM (page חדש מאופס, page cache, ספרייה משותפת) — רק צריך למפות</td><td>צריך לקרוא את הדאטה מהדיסק (swap או קובץ שלא ב-page cache)</td></tr>
<tr><td>עלות</td><td>~0.1–1 µs</td><td>~50–100 µs על NVMe, ‏~5–10 ms על HDD</td></tr>
<tr><td>מתי לדאוג</td><td>מיליונים בשנייה מיד אחרי עלייה (warm-up) — בדרך כלל בסדר</td><td>כשהם לא אפס באופן קבוע בשירות רגיש ל-latency</td></tr>
</table>
<pre>$ /usr/bin/time -v ./build-index 2&gt;&amp;1 | grep -i 'page faults'
	Major (requiring I/O) page faults: 3812
	Minor (reclaiming a frame) page faults: 1048213
$ ps -o pid,min_flt,maj_flt,rss,cmd -p $(pgrep -d, java)
    PID  MINFL  MAJFL    RSS CMD
   4121 9.8e6    211 7340032 java -Xmx8g ...</pre>
<p><strong>mmap</strong> ממפה קובץ לתוך ה-address space: לקרוא את הזיכרון <em>זה</em> לקרוא את הקובץ, וה-page cache עושה את ה-I/O דרך page faults. בלי syscalls של <code>read()</code>, בלי העתקה ל-buffer של המשתמש, ומערכת ההפעלה משתפת את ה-pages בין תהליכים. מי סומך על זה:</p>
<ul><li><strong>Elasticsearch/OpenSearch (Lucene)</strong> עושים mmap ל-segments של האינדקס — ומכאן החובה של <code>vm.max_map_count=262144</code> (ברירת המחדל 65530 נמוכה מדי וה-node מסרב לעלות).</li>
<li><strong>Prometheus TSDB</strong>, ‏LMDB, קבצי האינדקס של Kafka, וכל ספרייה משותפת (<code>.so</code>) שאתה טוען.</li></ul>
<blockquote>⚠️ טיפ לפרודקשן: דאטאבייס שעובד עם mmap וה-working set שלו גדול מה-RAM הופך כל קריאה קרה ל-major fault בתוך גישת זיכרון רגילה — בלי slow-query log, בלי I/O wait באפליקציה, רק latency מסתורי. תעקוב אחרי <code>maj_flt</code> ואחרי העמודה <code>bi</code> ב-<code>vmstat 1</code>.</blockquote>`
      }
    },
    {
      h: { en: "NUMA, bandwidth vs latency, DDR5 and HBM", he: "NUMA, ‏bandwidth מול latency, ‏DDR5 ו-HBM" },
      body: {
        en: `<p>On multi-socket servers each CPU has its own memory controllers and DIMMs. Accessing your own socket's RAM is <strong>local</strong>; the other socket's is <strong>remote</strong> — ~1.5–2× the latency and shared link bandwidth. That's <strong>NUMA</strong> (Non-Uniform Memory Access).</p>
<pre>$ numactl -H
available: 2 nodes (0-1)
node 0 cpus: 0-31 64-95
node 0 size: 257652 MB
node 0 free: 12034 MB          &lt;-- node 0 almost full
node 1 cpus: 32-63 96-127
node 1 size: 258017 MB
node 1 free: 201877 MB
node distances:
node   0   1
  0:  10  21                   # remote ≈ 2.1× the "cost" of local
  1:  21  10
$ numastat -p $(pgrep -o postgres)     # per-node memory of a process</pre>
<p>Fixes: pin latency-critical processes and their memory to one node (<code>numactl --cpunodebind=0 --membind=0</code>, Kubernetes Topology Manager <code>single-numa-node</code>), or interleave (<code>--interleave=all</code>) for big shared caches.</p>
<p><strong>Bandwidth vs latency</strong> are different limits. Latency (~100 ns) barely improved in 20 years; bandwidth keeps growing:</p>
<table>
<tr><th>Memory</th><th>Bandwidth</th><th>Typical use</th></tr>
<tr><td>DDR5-4800, 1 channel</td><td>4,800 MT/s × 8 B = <strong>38.4 GB/s</strong></td><td>servers, desktops</td></tr>
<tr><td>DDR5-4800, 12 channels (one EPYC socket)</td><td>12 × 38.4 = <strong>460.8 GB/s</strong></td><td>big-memory servers</td></tr>
<tr><td>HBM3 (NVIDIA H100 SXM, 80 GB)</td><td><strong>~3.35 TB/s</strong></td><td>GPUs / AI accelerators</td></tr>
</table>
<p>Little's Law links them: to stream 38.4 GB/s with 100 ns latency you need 38.4 × 10^9 × 100 × 10^-9 = 3,840 bytes = <strong>60 cache lines in flight</strong>. A single core tracks only ~10–20 outstanding misses, so one thread tops out around ~10–15 GB/s — you need many cores (or the prefetcher) to use the full bandwidth.</p>
<p><strong>Why GPUs use HBM</strong>: LLM decoding at batch size 1 reads every weight once per token. An 8B-parameter model in FP16 is 16 GB, so the ceiling is 3.35 TB/s ÷ 16 GB ≈ <strong>~209 tokens/s</strong> on an H100 — versus 460.8 GB/s ÷ 16 GB ≈ 29 tokens/s from a fully-populated DDR5 socket. Inference is memory-bandwidth-bound, not FLOP-bound; batching reuses each weight read across many requests.</p>`,
        he: `<p>בשרתים עם כמה sockets לכל CPU יש memory controllers ו-DIMMs משלו. גישה ל-RAM של ה-socket שלך היא <strong>local</strong>; ל-RAM של ה-socket השני היא <strong>remote</strong> — בערך פי 1.5 עד 2 ב-latency, ועל לינק עם bandwidth משותף. זה <strong>NUMA</strong> (Non-Uniform Memory Access).</p>
<pre>$ numactl -H
available: 2 nodes (0-1)
node 0 cpus: 0-31 64-95
node 0 size: 257652 MB
node 0 free: 12034 MB          &lt;-- node 0 almost full
node 1 cpus: 32-63 96-127
node 1 size: 258017 MB
node 1 free: 201877 MB
node distances:
node   0   1
  0:  10  21                   # remote ≈ 2.1× the "cost" of local
  1:  21  10
$ numastat -p $(pgrep -o postgres)     # per-node memory of a process</pre>
<p>תיקונים: לנעוץ תהליכים קריטיים ל-latency ואת הזיכרון שלהם ל-node אחד (<code>numactl --cpunodebind=0 --membind=0</code>, ‏Topology Manager ב-Kubernetes עם <code>single-numa-node</code>), או לעשות interleave (<code>--interleave=all</code>) ל-caches גדולים ומשותפים.</p>
<p><strong>Bandwidth מול latency</strong> הן מגבלות שונות. ה-latency (~100 ns) כמעט לא השתפר ב-20 שנה; ה-bandwidth ממשיך לגדול:</p>
<table>
<tr><th>זיכרון</th><th>Bandwidth</th><th>שימוש טיפוסי</th></tr>
<tr><td>DDR5-4800, ערוץ אחד</td><td>4,800 MT/s × 8 B = <strong>38.4 GB/s</strong></td><td>שרתים, מחשבים שולחניים</td></tr>
<tr><td>DDR5-4800, ‏12 ערוצים (socket אחד של EPYC)</td><td>12 × 38.4 = <strong>460.8 GB/s</strong></td><td>שרתים עם הרבה זיכרון</td></tr>
<tr><td>HBM3 (NVIDIA H100 SXM, ‏80 GB)</td><td><strong>~3.35 TB/s</strong></td><td>GPUs ומאיצי AI</td></tr>
</table>
<p>Little's Law מחבר ביניהם: כדי להזרים 38.4 GB/s עם latency של 100 ns צריך 38.4 × 10^9 × 100 × 10^-9 = ‏3,840 bytes = <strong>60 cache lines באוויר</strong>. ‏core בודד עוקב רק אחרי 10–20 misses פתוחים בערך, אז thread אחד נעצר סביב 10–15 GB/s — צריך הרבה cores (או את ה-prefetcher) כדי לנצל את כל ה-bandwidth.</p>
<p><strong>למה GPUs משתמשים ב-HBM</strong>: decoding של LLM ב-batch size 1 קורא כל weight פעם אחת לכל token. מודל של 8B פרמטרים ב-FP16 שוקל 16 GB, אז התקרה היא 3.35 TB/s ÷ 16 GB ≈ <strong>~209 tokens בשנייה</strong> על H100 — לעומת 460.8 GB/s ÷ 16 GB ≈ ‏29 tokens בשנייה מ-socket של DDR5 מלא. ‏Inference חסום ע"י bandwidth של זיכרון, לא ע"י FLOPs; ‏batching ממחזר כל קריאת weight על פני הרבה בקשות.</p>`
      }
    },
    {
      h: { en: "ECC memory and bit flips", he: "זיכרון ECC ו-bit flips" },
      body: {
        en: `<p>DRAM stores bits as tiny charges that cosmic rays, electrical noise, heat and aging can flip. <strong>ECC</strong> memory stores 8 extra check bits per 64 data bits (72 bits per word) using a SECDED code: <strong>corrects any single-bit error, detects double-bit errors</strong>. Server-grade ECC (and Chipkill-style schemes) can survive the failure of a whole DRAM chip.</p>
<p>How common? Google's 2009 field study (Schroeder et al.) found about a third of machines and more than 8% of DIMMs saw at least one correctable error per year. Without ECC, each of those is <strong>silent data corruption</strong>: a flipped bit in a page-cache copy of a file, a pointer, a checksum — wrong results with no crash.</p>
<pre>$ ras-mc-ctl --error-count          # rasdaemon
Label               CE      UE
mc#0csrow#2channel#1 1874    0      &lt;-- one DIMM accumulating corrected errors
mc#0csrow#0channel#0 0       0
$ grep . /sys/devices/system/edac/mc/mc*/ce_count
/sys/devices/system/edac/mc/mc0/ce_count:1874</pre>
<ul><li><strong>CE (correctable)</strong> — fixed silently. A steadily rising CE count on one DIMM predicts failure: schedule replacement.</li>
<li><strong>UE (uncorrectable)</strong> — a Machine Check Exception: the kernel kills the affected process or panics, rather than continuing with bad data.</li></ul>
<p>Note: DDR5's "on-die ECC" protects bits inside the chip only — it is <em>not</em> end-to-end ECC and doesn't replace ECC DIMMs. Rowhammer (repeatedly hammering one row to flip bits in its neighbor) showed bit flips can also be induced on purpose.</p>
<blockquote>💡 Real world: cloud providers run ECC everywhere and live-migrate VMs off hosts with rising CE counts — one reason you sometimes get a "scheduled maintenance / instance retirement" notice.</blockquote>`,
        he: `<p>DRAM שומר bits כמטענים זעירים שקרינה קוסמית, רעש חשמלי, חום והזדקנות יכולים להפוך. זיכרון <strong>ECC</strong> שומר 8 bits נוספים של בדיקה לכל 64 bits של דאטה (72 bits לכל word) עם קוד SECDED: <strong>מתקן כל שגיאה של bit בודד, ומזהה שגיאות של שני bits</strong>. ‏ECC של שרתים (ושיטות בסגנון Chipkill) יכול לשרוד אפילו כשל של שבב DRAM שלם.</p>
<p>כמה זה נפוץ? מחקר השטח של Google מ-2009 (Schroeder ואחרים) מצא שבערך שליש מהמכונות ויותר מ-8% מה-DIMMs ראו לפחות שגיאה אחת שתוקנה בשנה. בלי ECC, כל אחת מהן היא <strong>silent data corruption</strong>: ‏bit שהתהפך בעותק של קובץ ב-page cache, ב-pointer, ב-checksum — תוצאות שגויות בלי שום crash.</p>
<pre>$ ras-mc-ctl --error-count          # rasdaemon
Label               CE      UE
mc#0csrow#2channel#1 1874    0      &lt;-- one DIMM accumulating corrected errors
mc#0csrow#0channel#0 0       0
$ grep . /sys/devices/system/edac/mc/mc*/ce_count
/sys/devices/system/edac/mc/mc0/ce_count:1874</pre>
<ul><li><strong>CE (correctable)</strong> — מתוקן בשקט. מונה CE שעולה בהתמדה על DIMM אחד מנבא כשל: תתזמן החלפה.</li>
<li><strong>UE (uncorrectable)</strong> — Machine Check Exception: ה-kernel הורג את התהליך שנפגע או עושה panic, במקום להמשיך עם דאטה שגוי.</li></ul>
<p>שים לב: ה-"on-die ECC" של DDR5 מגן רק על ה-bits בתוך השבב — זה <em>לא</em> ECC מקצה לקצה ולא מחליף DIMMs עם ECC. ‏Rowhammer (פגיעה חוזרת ונשנית בשורה אחת כדי להפוך bits בשורה השכנה) הראה ש-bit flips אפשר גם לייצר בכוונה.</p>
<blockquote>💡 מהשטח: ספקי ענן מריצים ECC בכל מקום ועושים live migration ל-VMs מ-hosts שמוני ה-CE שלהם עולים — זו אחת הסיבות שלפעמים אתה מקבל הודעת "scheduled maintenance" או "instance retirement".</blockquote>`
      }
    }
  ],
  diagram: `            /\\        registers      ~0.3 ns    KiB
           /  \\       L1  32-48 KiB  ~1 ns
          /    \\      L2  1-2 MiB    ~4 ns
         /      \\     L3  32-384 MiB ~15 ns     (shared per socket)
        /        \\    DRAM GiB-TiB   ~100 ns    (local vs remote NUMA)
       /          \\   NVMe TBs       ~20-100 us
      /____________\\  HDD  tens TB   ~5-10 ms

  virtual addr --[TLB hit: ~1 cycle]--> physical addr --> cache line (64 B) --> L1/L2/L3/RAM
              \\--[TLB miss: page walk, up to 4 memory reads]--/
              \\--[no mapping: page fault -> kernel: minor (map) | major (disk I/O)]`,
  handsOn: [
    { cmd: "lscpu | grep -iE 'cache|numa' ; getconf PAGESIZE ; getconf LEVEL1_DCACHE_LINESIZE", what: { en: "Your cache sizes, NUMA layout, page size (4096) and cache line size (64).", he: "גדלי ה-cache, מבנה ה-NUMA, גודל ה-page ‏(4096) וגודל ה-cache line ‏(64) אצלך." } },
    { cmd: "grep -iE 'huge|MemAvailable' /proc/meminfo ; cat /sys/kernel/mm/transparent_hugepage/enabled", what: { en: "See huge page reservations, THP usage and the current THP mode.", he: "לראות הזמנות של huge pages, שימוש ב-THP ואת מצב ה-THP הנוכחי." } },
    { cmd: "perf stat -e cycles,instructions,cache-references,cache-misses,dTLB-load-misses -- sort -n big.txt > /dev/null", what: { en: "Measure IPC, cache-miss % and TLB misses of a real command. IPC below 1 usually means memory-bound.", he: "למדוד IPC, אחוז cache misses ו-TLB misses של פקודה אמיתית. ‏IPC מתחת ל-1 אומר בדרך כלל חסימה על זיכרון." } },
    { cmd: "/usr/bin/time -v python3 -c \"x=bytearray(500*1024*1024)\" 2>&1 | grep -i fault", what: { en: "Allocate and zero 500 MB: ~128,000 minor faults (500 MiB ÷ 4 KiB), zero major ones.", he: "להקצות ולאפס 500 MB: בערך 128,000 minor faults ‏(500 MiB ÷ 4 KiB), ואפס major." } },
    { cmd: "numactl -H ; numastat -m | head -20", what: { en: "NUMA nodes, their free memory and distances; spot one full node while another is idle.", he: "ה-NUMA nodes, הזיכרון הפנוי והמרחקים שלהם; לזהות node אחד מלא בזמן שאחר ריק." } }
  ],
  mnemonic: {
    en: "\"64 bytes, 4 KiB, 100 ns.\" Line, page, RAM — the three numbers that explain most performance surprises.",
    he: "\"64 bytes, ‏4 KiB, ‏100 ns.\" ‏Line, ‏page, ‏RAM — שלושת המספרים שמסבירים את רוב ההפתעות בביצועים."
  },
  pitfalls: [
    { en: "Trusting Big-O alone. A pointer-chasing O(n) structure can be 100× slower than a contiguous O(n) one because each step is a cache miss.", he: "לסמוך רק על Big-O. מבנה O(n) שקופץ בין pointers יכול להיות איטי פי 100 ממבנה O(n) רציף, כי כל צעד הוא cache miss." },
    { en: "Per-thread counters or locks packed into one struct. They share a cache line and serialize through cache-coherence traffic (false sharing) — pad to 64 bytes.", he: "מונים או locks של threads שונים ארוזים ב-struct אחד. הם חולקים cache line ומסתנכרנים דרך תעבורת cache coherence (‏false sharing) — תרפד ל-64 bytes." },
    { en: "Leaving THP on 'always' for Redis/MongoDB-style latency-sensitive stores. khugepaged compaction and copy-on-write of 2 MiB pages cause latency spikes and RSS bloat.", he: "להשאיר THP על always ב-stores רגישים ל-latency בסגנון Redis/MongoDB. ה-compaction של khugepaged ו-copy-on-write של pages של 2 MiB גורמים לקפיצות latency ולניפוח RSS." },
    { en: "Ignoring NUMA on big boxes: one node's memory fills, allocations spill to the remote node, and latency rises ~2× with no change in your code.", he: "להתעלם מ-NUMA במכונות גדולות: הזיכרון של node אחד מתמלא, הקצאות גולשות ל-node המרוחק, וה-latency עולה פי 2 בערך בלי ששינית שורת קוד." }
  ],
  interview: [
    {
      q: { en: "What is a TLB miss and how do huge pages help?", he: "מה זה TLB miss ואיך huge pages עוזרים?" },
      a: { en: "The TLB caches virtual-to-physical translations. On a miss the CPU walks the page table — up to 4 dependent memory reads on x86-64. With ~1,500 entries and 4 KiB pages the TLB covers ~6 MiB; with 2 MiB pages it covers ~3 GiB, so large working sets (DB buffer pools, JVM heaps, VMs) miss far less and the page table is smaller.", he: "ה-TLB שומר תרגומים מכתובת וירטואלית לפיזית. ב-miss ה-CPU עובר על ה-page table — עד 4 קריאות זיכרון תלויות ב-x86-64. עם כ-1,500 רשומות ו-pages של 4 KiB ה-TLB מכסה בערך 6 MiB; עם pages של 2 MiB הוא מכסה בערך 3 GiB, אז working sets גדולים (buffer pools של DB, ‏heaps של JVM, ‏VMs) מפספסים הרבה פחות וה-page table קטן יותר." }
    },
    {
      q: { en: "Minor vs major page fault — which one should worry you on a production DB?", he: "Minor מול major page fault — מה צריך להדאיג אותך ב-DB בפרודקשן?" },
      a: { en: "Minor faults just map a page already in RAM (~sub-microsecond) and are normal during warm-up. Major faults require disk I/O (tens of µs on NVMe, ms on HDD); a steady major-fault rate means the working set doesn't fit in RAM — swapping or mmap'd data being evicted from page cache — and shows up as latency spikes.", he: "Minor faults רק ממפים page שכבר ב-RAM (פחות ממיקרו-שנייה) והם נורמליים ב-warm-up. ‏Major faults דורשים I/O לדיסק (עשרות µs ב-NVMe, מילי-שניות ב-HDD); קצב קבוע של major faults אומר שה-working set לא נכנס ב-RAM — swap או דאטה ב-mmap שנזרק מה-page cache — וזה מופיע כקפיצות latency." }
    },
    {
      q: { en: "Why is LLM inference on GPUs described as memory-bandwidth-bound?", he: "למה אומרים ש-inference של LLM על GPUs חסום ע\"י memory bandwidth?" },
      a: { en: "Generating each token at small batch size requires reading all model weights from memory once, while doing relatively few FLOPs per byte. An 8B FP16 model (16 GB) on 3.35 TB/s HBM caps out near 209 tokens/s regardless of compute. Batching, quantization (fewer bytes per weight) and KV-cache efficiency raise effective throughput.", he: "ייצור כל token ב-batch קטן דורש לקרוא את כל ה-weights של המודל מהזיכרון פעם אחת, עם מעט FLOPs יחסית לכל byte. מודל 8B ב-FP16 ‏(16 GB) על HBM של 3.35 TB/s נעצר סביב 209 tokens בשנייה בלי קשר לכוח החישוב. ‏Batching, ‏quantization (פחות bytes לכל weight) ויעילות של ה-KV cache מעלים את ה-throughput האפקטיבי." }
    }
  ],
  quiz: [
    {
      q: { en: "What is the cache line size on virtually all x86-64 CPUs?", he: "מה גודל ה-cache line כמעט בכל מעבדי x86-64?" },
      options: [
        { en: "8 bytes", he: "8 bytes" },
        { en: "64 bytes", he: "64 bytes" },
        { en: "4 KiB", he: "4 KiB" },
        { en: "2 MiB", he: "2 MiB" }
      ],
      answer: 1,
      explain: { en: "Caches move data in 64-byte lines. 4 KiB is the default page size; 2 MiB is a huge page; 8 bytes is a 64-bit word.", he: "Caches מזיזים דאטה ב-lines של 64 bytes. ‏4 KiB זה גודל ה-page הדיפולטי; ‏2 MiB זה huge page; ‏8 bytes זה word של 64 bits." }
    },
    {
      q: { en: "A second-level TLB has 1,536 entries. How much memory can it map with 2 MiB huge pages?", he: "ל-TLB של הרמה השנייה יש 1,536 רשומות. כמה זיכרון הוא יכול למפות עם huge pages של 2 MiB?" },
      options: [
        { en: "6 MiB", he: "6 MiB" },
        { en: "64 MiB", he: "64 MiB" },
        { en: "3 GiB", he: "3 GiB" },
        { en: "1.5 TiB", he: "1.5 TiB" }
      ],
      answer: 2,
      explain: { en: "1,536 × 2 MiB = 3,072 MiB = 3 GiB. With 4 KiB pages the same TLB reaches only 6 MiB — a 512× difference.", he: "1,536 × 2 MiB = ‏3,072 MiB = ‏3 GiB. עם pages של 4 KiB אותו TLB מגיע רק ל-6 MiB — הבדל של פי 512." }
    },
    {
      q: { en: "Which event costs the most time?", he: "איזה אירוע עולה הכי הרבה זמן?" },
      options: [
        { en: "An L2 cache hit", he: "Hit ב-L2 cache" },
        { en: "A TLB miss that finds the page table entries in cache", he: "TLB miss שמוצא את רשומות ה-page table ב-cache" },
        { en: "A minor page fault", he: "Minor page fault" },
        { en: "A major page fault on NVMe", he: "Major page fault על NVMe" }
      ],
      answer: 3,
      explain: { en: "Major faults need disk I/O: ~50–100 µs on NVMe. A minor fault is ~0.1–1 µs, a cached page walk tens of ns, an L2 hit ~4 ns.", he: "Major fault צריך I/O לדיסק: ~50–100 µs ב-NVMe. ‏minor fault זה ~0.1–1 µs, ‏page walk מה-cache עשרות ns, ו-hit ב-L2 בערך 4 ns." }
    },
    {
      q: { en: "Two threads each increment their own counter, but the counters are adjacent fields in one struct. Throughput is terrible. Why?", he: "שני threads מעלים כל אחד מונה משלו, אבל המונים הם שדות צמודים באותו struct. ה-throughput נוראי. למה?" },
      options: [
        { en: "The compiler adds a lock around each field", he: "הקומפיילר מוסיף lock סביב כל שדה" },
        { en: "False sharing: both fields sit on one cache line, which bounces between cores on every write", he: "False sharing: שני השדות יושבים על אותו cache line, שקופץ בין ה-cores בכל כתיבה" },
        { en: "Integer overflow", he: "Integer overflow" },
        { en: "The TLB can't hold two addresses on the same page", he: "ה-TLB לא יכול להחזיק שתי כתובות באותו page" }
      ],
      answer: 1,
      explain: { en: "Coherence works per cache line. Each write invalidates the other core's copy. Padding each counter to its own 64-byte line fixes it.", he: "ה-coherence עובד לפי cache line. כל כתיבה מבטלת את העותק של ה-core השני. ריפוד של כל מונה ל-line משלו של 64 bytes פותר את זה." }
    }
  ],
  playground: "cache",
  related: ["memory", "cpu", "latency-numbers", "storage-io", "linux-kernel-tuning", "ai-llm-serving"]
});

/* ============================== GLOSSARY ============================== */
INFRA.glossary.push(
  { term: "KiB / MiB / GiB", track: "foundations", def: { en: "Binary (IEC) units: 1 KiB = 1,024 bytes, 1 GiB = 2^30 bytes. KB/GB are decimal (powers of 1000), which is why a '1 TB' disk shows as 931 GiB.", he: "יחידות בינאריות (IEC): ‏1 KiB = ‏1,024 bytes, ‏1 GiB = ‏2^30 bytes. ‏KB/GB הם עשרוניים (חזקות של 1000), ובגלל זה דיסק של '1 TB' מופיע כ-931 GiB." }, lesson: "bits-bytes-units" },
  { term: "Endianness", track: "foundations", def: { en: "The byte order of multi-byte numbers in memory: little-endian (x86, ARM) stores the lowest byte first; network protocols use big-endian ('network byte order').", he: "סדר ה-bytes של מספר בן כמה bytes בזיכרון: little-endian (‏x86, ‏ARM) שומר את ה-byte הנמוך ראשון; פרוטוקולי רשת משתמשים ב-big-endian (‏network byte order)." }, lesson: "bits-bytes-units" },
  { term: "Bandwidth-delay product", track: "networking", def: { en: "Bandwidth × RTT: how many bytes must be in flight to fill a link. 1 Gbps × 100 ms = 12.5 MB; a smaller TCP window caps throughput.", he: "Bandwidth כפול RTT: כמה bytes צריכים להיות באוויר כדי למלא לינק. ‏1 Gbps × 100 ms = ‏12.5 MB; ‏TCP window קטן מזה מגביל את ה-throughput." }, lesson: "bits-bytes-units" },
  { term: "Datagram", track: "networking", def: { en: "A self-contained UDP message: delivered whole or not at all, with no ordering, retransmission or connection.", he: "הודעת UDP עצמאית: מגיעה שלמה או לא מגיעה בכלל, בלי סדר, בלי retransmission ובלי חיבור." }, lesson: "net-tcp-vs-udp" },
  { term: "Socket receive buffer", track: "networking", def: { en: "Kernel queue of received data waiting for the app to read (SO_RCVBUF, capped by net.core.rmem_max). When a UDP socket's buffer is full, packets are dropped silently ('receive buffer errors').", he: "תור ב-kernel של דאטה שהתקבל ומחכה שהאפליקציה תקרא (SO_RCVBUF, עם תקרה של net.core.rmem_max). כשה-buffer של socket של UDP מלא, packets נזרקים בשקט (receive buffer errors)." }, lesson: "net-tcp-vs-udp" },
  { term: "IP fragmentation", track: "networking", def: { en: "Splitting a packet larger than the path MTU into fragments. Losing any fragment loses the whole datagram, and many firewalls drop fragments — keep UDP payloads under ~1472 bytes (1232 for DNS).", he: "פיצול של packet שגדול מה-MTU של המסלול ל-fragments. איבוד של fragment אחד מאבד את כל ה-datagram, והרבה firewalls זורקים fragments — תשמור payload של UDP מתחת ל-1472 bytes בערך (1232 ל-DNS)." }, lesson: "net-tcp-vs-udp" },
  { term: "Cache line", track: "foundations", def: { en: "The unit CPU caches move between memory levels — 64 bytes on x86-64. Locality and false sharing are both about cache lines.", he: "היחידה שה-caches של ה-CPU מזיזים בין רמות הזיכרון — 64 bytes ב-x86-64. ‏Locality ו-false sharing שניהם עוסקים ב-cache lines." }, lesson: "memory-hierarchy" },
  { term: "TLB", track: "foundations", def: { en: "Translation Lookaside Buffer: the CPU's cache of virtual-to-physical page translations. A miss triggers a page-table walk; huge pages extend its reach.", he: "Translation Lookaside Buffer: ה-cache של ה-CPU לתרגומי pages מווירטואלי לפיזי. ‏miss מפעיל page walk; ‏huge pages מגדילים את הכיסוי שלו." }, lesson: "memory-hierarchy" },
  { term: "Page fault", track: "foundations", def: { en: "A trap to the kernel when a virtual page has no valid mapping. Minor: page already in RAM, just mapped (~µs). Major: must be read from disk (swap or file), far slower.", he: "מעבר ל-kernel כשאין ל-page וירטואלי מיפוי תקין. ‏Minor: ה-page כבר ב-RAM ורק ממופה (~µs). ‏Major: צריך לקרוא אותו מהדיסק (swap או קובץ), הרבה יותר איטי." }, lesson: "memory-hierarchy" }
);

/* ============================== SCENARIO ============================== */
INFRA.scenarios.push({
  id: "udp-packet-loss-metrics",
  icon: "📉",
  title: { en: "The metrics say traffic dropped. The business says it doubled.", he: "המטריקות אומרות שהתעבורה ירדה. הביזנס אומר שהיא הוכפלה." },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "20:45, peak of the biggest sale of the year. Alert: 'checkout_orders_per_min dropped 35% vs last week'. The VP of Sales is in the channel asking why the dashboard looks like an outage while the warehouse says orders are pouring in. All services report healthy.",
        he: "20:45, השיא של המבצע הכי גדול של השנה. Alert: ‏'checkout_orders_per_min dropped 35% vs last week'. סמנכ\"ל המכירות בערוץ ושואל למה ה-dashboard נראה כמו outage, בזמן שהמחסן אומר שההזמנות זורמות בלי הפסקה. כל השירותים מדווחים healthy."
      },
      data: `Grafana (StatsD -> statsd_exporter -> Prometheus)
  checkout_orders_per_min     last week 20:45: 4,120    now: 2,680  (-35%)
  http_requests_per_sec (app) last week: 9,800           now: 7,100  (-28%)
ALB metrics (CloudWatch)
  RequestCount per sec        last week: 9,750           now: 15,900 (+63%)
Last deploy: 3 days ago`,
      choices: [
        { label: { en: "Cross-check against an independent source: ALB numbers and an order count straight from the DB", he: "להצליב מול מקור בלתי תלוי: המספרים של ה-ALB וספירת הזמנות ישירות מה-DB" }, next: "s2", score: 15,
          feedback: { en: "Exactly. Two sources disagree — before fixing anything, find out which one is lying.", he: "בדיוק. שני מקורות לא מסכימים — לפני שמתקנים משהו, צריך להבין מי מהם משקר." } },
        { label: { en: "Declare an incident and roll back the last deploy", he: "להכריז על incident ולעשות rollback לדיפלוי האחרון" }, next: "s2b", score: -10,
          feedback: { en: "The deploy is 3 days old and nothing else indicates customer impact. A rollback during peak adds risk without evidence.", he: "הדיפלוי בן 3 ימים ושום דבר אחר לא מצביע על פגיעה בלקוחות. ‏rollback באמצע השיא מוסיף סיכון בלי ראיות." } },
        { label: { en: "Restart the StatsD agent on the metrics host", he: "לעשות restart ל-agent של StatsD על ה-host של המטריקות" }, next: "s2c", score: 0,
          feedback: { en: "A guess. It might change the symptom briefly, but you still don't know the cause.", he: "ניחוש. זה אולי ישנה את הסימפטום לרגע, אבל עדיין אתה לא יודע מה הסיבה." } }
      ]
    },
    s2b: {
      text: {
        en: "20 minutes later the rollback is done. The dashboard still shows -35%. Customers were never affected; you burned time and change budget during peak.",
        he: "אחרי 20 דקות ה-rollback הסתיים. ה-dashboard עדיין מראה מינוס 35%. הלקוחות אף פעם לא נפגעו; שרפת זמן ותקציב שינויים באמצע השיא."
      },
      choices: [
        { label: { en: "Now compare with the ALB and the database", he: "עכשיו להשוות מול ה-ALB ומול הדאטאבייס" }, next: "s2", score: 5,
          feedback: { en: "Better late than never: verify the signal before acting on it.", he: "עדיף מאוחר מאשר אף פעם: לאמת את הסיגנל לפני שפועלים לפיו." } }
      ]
    },
    s2c: {
      text: {
        en: "The agent restarts. For about 40 seconds the graphs jump back to normal, then sag again to -35%. Interesting — an empty agent keeps up for a moment, then falls behind.",
        he: "ה-agent עולה מחדש. בערך 40 שניות הגרפים קופצים בחזרה לנורמלי, ואז צונחים שוב למינוס 35%. מעניין — agent ריק עומד בקצב לרגע, ואז מפגר."
      },
      choices: [
        { label: { en: "Stop guessing: cross-check the numbers against the ALB and the DB", he: "להפסיק לנחש: להצליב את המספרים מול ה-ALB וה-DB" }, next: "s2", score: 5,
          feedback: { en: "Good. And note the 'recovers then degrades' pattern — it smells like a queue filling up.", he: "טוב. ותזכור את הדפוס של 'מתאושש ואז מידרדר' — זה מריח כמו תור שמתמלא." } }
      ]
    },
    s2: {
      text: {
        en: "The database and ALB agree: real traffic and orders are up ~60%. The metrics pipeline is under-counting. The apps send StatsD over UDP to an agent on a dedicated host.",
        he: "הדאטאבייס וה-ALB מסכימים: התעבורה וההזמנות האמיתיות עלו בכ-60%. ה-pipeline של המטריקות סופר פחות מהמציאות. האפליקציות שולחות StatsD מעל UDP ל-agent על host ייעודי."
      },
      data: `psql=# SELECT count(*) FROM orders WHERE created_at > now() - interval '1 minute';
 count
-------
  6612
(1 row)
# dashboard says 2,680/min; reality is 6,612/min  -> ~60% of metric packets lost`,
      choices: [
        { label: { en: "Check the kernel UDP counters and socket on the metrics host", he: "לבדוק את מוני ה-UDP של ה-kernel ואת ה-socket על ה-host של המטריקות" }, next: "s3", score: 15,
          feedback: { en: "Right layer. UDP loss is invisible to the sender; only the receiving kernel knows.", he: "השכבה הנכונה. איבוד ב-UDP שקוף לשולח; רק ה-kernel של המקבל יודע." } },
        { label: { en: "Look for StatsD client errors in the application logs", he: "לחפש שגיאות של ה-StatsD client בלוגים של האפליקציה" }, next: "s3b", score: 0,
          feedback: { en: "Reasonable instinct, wrong protocol. With UDP the client never learns about drops.", he: "אינסטינקט סביר, פרוטוקול לא נכון. ב-UDP ה-client אף פעם לא יודע על drops." } }
      ]
    },
    s3b: {
      text: {
        en: "Application logs are clean: 'statsd client: 0 send errors'. Of course — sendto() succeeds as soon as the packet leaves the local buffer.",
        he: "הלוגים של האפליקציה נקיים: ‏'statsd client: 0 send errors'. ברור — sendto() מצליח ברגע שה-packet יוצא מה-buffer המקומי."
      },
      choices: [
        { label: { en: "Go to the metrics host and check netstat -su and ss", he: "לעבור ל-host של המטריקות ולבדוק netstat -su ו-ss" }, next: "s3", score: 5,
          feedback: { en: "Yes — the receiver is where UDP drops are counted.", he: "כן — אצל המקבל סופרים drops של UDP." } }
      ]
    },
    s3: {
      text: {
        en: "Found it. The receive-buffer error counter climbs by ~90,000 per minute, the socket's queue is pinned at its 208 KiB limit, and the agent is a single thread at 100% of one core.",
        he: "מצאת. המונה של receive buffer errors עולה בכ-90,000 בדקה, התור של ה-socket תקוע על התקרה של 208 KiB, וה-agent הוא thread יחיד ב-100% של core אחד."
      },
      data: `$ netstat -su | grep -i 'buffer errors'; sleep 60; netstat -su | grep -i 'buffer errors'
    18403311 receive buffer errors
    18494127 receive buffer errors          # +90,816 in 60 s
$ ss -uamn 'sport = :8125'
UNCONN 213760 0  0.0.0.0:8125  0.0.0.0:*
	 skmem:(r213760,rb212992,t0,tb212992,f0,w0,o0,bl0,d18494127)
$ top -H -p $(pgrep statsd)
  PID USER  %CPU COMMAND
 2210 statsd 99.7 statsd-recv
$ sysctl net.core.rmem_max
net.core.rmem_max = 212992`,
      choices: [
        { label: { en: "Raise net.core.rmem_max to 25 MiB, set the agent's receive buffer to match, and run 4 reader workers with SO_REUSEPORT", he: "להעלות את net.core.rmem_max ל-25 MiB, להגדיר את ה-receive buffer של ה-agent בהתאם, ולהריץ 4 workers קוראים עם SO_REUSEPORT" }, next: "s4", score: 20,
          feedback: { en: "Both halves of the problem: more slack for bursts and more read capacity. Either alone wouldn't hold at this rate.", he: "שני חצאי הבעיה: יותר מרווח ל-bursts ויותר יכולת קריאה. כל אחד לבד לא היה מחזיק בקצב הזה." } },
        { label: { en: "Move the agent to a bigger instance with 4× the cores", he: "להעביר את ה-agent ל-instance גדול יותר עם פי 4 cores" }, next: "s4b", score: -5,
          feedback: { en: "The reader is single-threaded — extra cores sit idle, and the buffer is still 208 KiB.", he: "הקורא הוא thread יחיד — ה-cores הנוספים יושבים בטל, וה-buffer עדיין 208 KiB." } },
        { label: { en: "Switch every service to send metrics over TCP right now", he: "להעביר את כל השירותים לשלוח מטריקות מעל TCP עכשיו" }, next: "s4b", score: -5,
          feedback: { en: "Maybe the right long-term direction, but a fleet-wide client change during peak is a bigger risk than lossy metrics.", he: "אולי הכיוון הנכון לטווח ארוך, אבל שינוי client בכל הצי באמצע השיא הוא סיכון גדול יותר ממטריקות שמאבדות." } }
      ]
    },
    s4b: {
      text: {
        en: "Half an hour later nothing improved: the drops continue, and the change-freeze owner is asking why you're deploying during peak.",
        he: "חצי שעה אחר כך שום דבר לא השתפר: ה-drops ממשיכים, והאחראי על ה-change freeze שואל למה אתה עושה דיפלוי באמצע השיא."
      },
      choices: [
        { label: { en: "Go back and fix the receiver: bigger buffer plus more readers", he: "לחזור ולתקן את המקבל: buffer גדול יותר ויותר קוראים" }, next: "s4", score: 5,
          feedback: { en: "Fix the bottleneck you measured, with the smallest safe change.", he: "לתקן את צוואר הבקבוק שמדדת, עם השינוי הבטוח הקטן ביותר." } }
      ]
    },
    s4: {
      text: {
        en: "Within two minutes the drop counter goes flat and the dashboard matches the database again (6,600 orders/min). Peak continues. What do you do before closing the incident?",
        he: "תוך שתי דקות מונה ה-drops מתיישר והדאשבורד שוב תואם לדאטאבייס (6,600 הזמנות בדקה). השיא ממשיך. מה אתה עושה לפני שסוגרים את ה-incident?"
      },
      data: `$ nstat -az UdpRcvbufErrors      # sampled 60 s apart
UdpRcvbufErrors   18511940
UdpRcvbufErrors   18511940     # +0
$ ss -uamn 'sport = :8125' | grep -o 'r[0-9]*,rb[0-9]*'
r0,rb52428800                   # kernel doubles the requested 25 MiB`,
      choices: [
        { label: { en: "Persist the sysctl, alert on rate(node_netstat_Udp_RcvbufErrors), and plan client-side aggregation / OTLP over TCP for business metrics", he: "לקבע את ה-sysctl, להוסיף alert על rate(node_netstat_Udp_RcvbufErrors), ולתכנן aggregation בצד הלקוח או OTLP מעל TCP למטריקות עסקיות" }, next: "win", score: 15,
          feedback: { en: "This turns a silent failure into a paged one, and stops business KPIs depending on a lossy transport.", he: "זה הופך כשל שקט לכשל שמעיר מישהו, ומפסיק את התלות של KPIs עסקיים בתעבורה שמאבדת." } },
        { label: { en: "It works — close the incident, the sysctl change is enough", he: "זה עובד — לסגור את ה-incident, השינוי ב-sysctl מספיק" }, next: "lose", score: -10,
          feedback: { en: "The runtime sysctl is lost on reboot, there's still no alert on drops, and next year's peak will be bigger.", he: "ה-sysctl שהוגדר בזמן ריצה ייעלם ב-reboot, עדיין אין alert על drops, והשיא של השנה הבאה יהיה גדול יותר." } }
      ]
    },
    win: {
      text: {
        en: "Resolved. Postmortem: metrics over UDP dropped silently once traffic exceeded what one reader thread and a 208 KiB buffer could absorb. Actions shipped: persisted sysctl, SO_REUSEPORT readers, a drop alert on every UDP receiver, and order KPIs now come from the DB/OTLP, not fire-and-forget packets.",
        he: "נפתר. ב-postmortem: מטריקות מעל UDP נזרקו בשקט ברגע שהתעבורה עברה את מה ש-thread קורא אחד ו-buffer של 208 KiB יכלו לספוג. מה יצא לפועל: sysctl קבוע, קוראים עם SO_REUSEPORT, ‏alert על drops בכל מקבל UDP, ו-KPIs של הזמנות מגיעים עכשיו מה-DB או מ-OTLP, לא מ-packets של fire-and-forget."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "Three weeks later the metrics host is replaced during routine patching. The sysctl is gone, nobody alerts on RcvbufErrors, and at the next sale the dashboards under-count again — this time Finance makes a stock decision based on them.",
        he: "שלושה שבועות אחר כך ה-host של המטריקות מוחלף במסגרת patching שגרתי. ה-sysctl נעלם, אף אחד לא מתריע על RcvbufErrors, ובמבצע הבא ה-dashboards שוב סופרים פחות — והפעם מחלקת הכספים מקבלת החלטת מלאי לפיהם."
      },
      end: "lose"
    }
  },
  lessons: ["net-tcp-vs-udp", "obs-metrics", "linux-kernel-tuning", "bits-bytes-units"]
});
