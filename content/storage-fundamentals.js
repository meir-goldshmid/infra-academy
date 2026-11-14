window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Storage fundamentals: disks inside (HDD/SSD/NVMe), filesystems compared,
   every RAID level, and S3 in depth.
   ========================================================================= */
(function () {
const t = (en, he) => ({ en, he });

/* ---------------------------------------------------------------------- */
INFRA.lessons.push({
  id: "disks-hdd-ssd-nvme",
  track: "foundations",
  order: 33,
  icon: "💽",
  level: 2,
  minutes: 16,
  title: t("Disks Inside: HDD vs SSD vs NVMe", "דיסקים מבפנים: HDD מול SSD מול NVMe"),
  tldr: t(
    "An HDD is limited by physics (seek + rotation ≈ 8-12 ms per random IO → ~100-200 IOPS), an SSD by its flash translation layer and NAND wear, and the interface decides the ceiling: SATA has 1 queue of 32 commands, NVMe up to 64K queues of 64K commands over PCIe. Measure with fio, watch health with SMART, and know that a cloud disk is a network service with a price tag on every IOPS.",
    "HDD מוגבל בפיזיקה (seek + סיבוב ≈ 8-12 ms לכל IO אקראי → בערך 100-200 IOPS), SSD מוגבל ב-FTL ובשחיקה של ה-NAND, והממשק קובע את התקרה: ל-SATA יש queue אחד של 32 פקודות, ל-NVMe עד 64K queues של 64K פקודות על PCIe. מודדים עם fio, עוקבים אחרי בריאות עם SMART, וזוכרים שדיסק בענן הוא שירות רשת עם תג מחיר על כל IOPS."
  ),
  analogy: t(
    "An HDD is a librarian on roller skates: every random request means skating to the right shelf (seek) and waiting for the carousel to spin the book in front of him (rotation) — he's quick at reading a whole shelf in order, painfully slow at fetching scattered books. An SSD is a wall of mailboxes with no skating at all, but each mailbox can only be erased in big blocks and wears out after a few thousand rewrites, so a clever clerk (the FTL) keeps shuffling letters around. NVMe is giving that clerk 64,000 service windows instead of the single window SATA had.",
    "HDD הוא ספרן על רולרבליידס: כל בקשה אקראית אומרת להחליק למדף הנכון (seek) ולחכות שהקרוסלה תסובב את הספר מולו (rotation) — הוא מהיר בקריאת מדף שלם לפי הסדר, ואיטי להחריד בהבאת ספרים מפוזרים. SSD הוא קיר של תאי דואר בלי שום החלקה, אבל כל תא אפשר למחוק רק בבלוקים גדולים והוא נשחק אחרי כמה אלפי כתיבות, אז פקיד חכם (ה-FTL) כל הזמן מזיז מכתבים ממקום למקום. NVMe זה לתת לפקיד הזה 64,000 אשנבים במקום האשנב האחד שהיה ב-SATA."
  ),
  sections: [
    {
      h: t("Inside an HDD: seek + rotational latency, the math behind ~150 IOPS", "בתוך HDD: seek ו-rotational latency, החשבון שמאחורי ~150 IOPS"),
      body: t(
`<p>The lesson <strong>storage-io</strong> gave you the headline numbers. Here is <em>why</em> they are what they are. An HDD is a stack of magnetic platters spinning at a fixed speed, with one actuator arm moving all the read/write heads together. A random read costs three things:</p>
<ul>
<li><strong>Seek time</strong> — moving the arm to the right track: ~4 ms (enterprise) to ~9 ms (desktop) average.</li>
<li><strong>Rotational latency</strong> — waiting for the sector to come under the head. On average half a revolution.</li>
<li><strong>Transfer time</strong> — reading 4-64 KB at ~200 MB/s: 0.02-0.3 ms, almost free.</li>
</ul>
<table>
<tr><th>Spindle speed</th><th>One revolution</th><th>Avg rotational latency (½ rev)</th><th>Typical avg seek</th><th>Random IOPS at QD1 ≈ 1 / (seek + rot)</th></tr>
<tr><td>5,400 rpm</td><td>11.1 ms</td><td>5.6 ms</td><td>~10 ms</td><td>~65</td></tr>
<tr><td>7,200 rpm</td><td>8.3 ms</td><td><strong>4.2 ms</strong></td><td>~4-8.5 ms</td><td>~80-120</td></tr>
<tr><td>10,000 rpm</td><td>6.0 ms</td><td>3.0 ms</td><td>~4 ms</td><td>~140</td></tr>
<tr><td>15,000 rpm</td><td>4.0 ms</td><td>2.0 ms</td><td>~3.5 ms</td><td>~180</td></tr>
</table>
<p>Worked: 7,200 rpm → 7,200 / 60 = 120 revolutions per second → 1 / 120 = 8.33 ms per revolution → half of that = <strong>4.17 ms</strong> average rotational latency. Add a 4 ms enterprise seek: 8.2 ms per IO → 1 / 0.0082 ≈ <strong>122 IOPS</strong>. With a deep queue the drive reorders requests to minimize arm travel (NCQ / elevator scheduling) and you reach ~150-200 IOPS — and that's the physical ceiling. No firmware update changes Newton.</p>
<p>Sequential is a different story: no seeks, the head just reads the track as it flies by, so a modern 20 TB drive streams ~250-280 MB/s on the outer tracks and roughly half that on the inner ones (outer tracks hold more sectors per revolution). That's why HDDs are still king for backups, archives, video and object-storage backends where IO is big and sequential, at ~$15/TB vs ~$50-80/TB for enterprise SSD.</p>
<blockquote>💡 Real world: 15K rpm SAS drives are basically extinct — a cheap SATA SSD does 100× their random IOPS. Today's HDD market is almost entirely high-capacity 7,200 rpm "nearline" drives (20-30 TB, some with SMR or HAMR) living in NAS boxes and in the back end of S3, Azure Blob and GCS.</blockquote>
<p><strong>CMR vs SMR:</strong> shingled (SMR) drives overlap tracks like roof shingles to gain ~20% capacity, but rewriting a track means rewriting the whole band. They are fine for write-once archives and terrible under random writes or RAID rebuilds — an SMR drive in a ZFS/RAID array can take days to resilver. Check the datasheet before buying "NAS" drives.</p>`,
`<p>השיעור <strong>storage-io</strong> נתן לך את המספרים הכלליים. כאן נבין <em>למה</em> הם כאלה. HDD הוא ערימה של פלטות מגנטיות שמסתובבות במהירות קבועה, עם זרוע אחת שמזיזה את כל ראשי הקריאה/כתיבה יחד. קריאה אקראית עולה שלושה דברים:</p>
<ul>
<li><strong>Seek time</strong> — הזזת הזרוע ל-track הנכון: בממוצע ~4 ms (enterprise) עד ~9 ms (desktop).</li>
<li><strong>Rotational latency</strong> — המתנה עד שה-sector יגיע מתחת לראש. בממוצע חצי סיבוב.</li>
<li><strong>Transfer time</strong> — קריאה של 4-64 KB בקצב ~200 MB/s: בין 0.02 ל-0.3 ms, כמעט בחינם.</li>
</ul>
<table>
<tr><th>מהירות סיבוב</th><th>סיבוב אחד</th><th>Rotational latency ממוצע (חצי סיבוב)</th><th>Seek ממוצע טיפוסי</th><th>IOPS אקראי ב-QD1 ≈ 1 / (seek + rot)</th></tr>
<tr><td>5,400 rpm</td><td>11.1 ms</td><td>5.6 ms</td><td>~10 ms</td><td>~65</td></tr>
<tr><td>7,200 rpm</td><td>8.3 ms</td><td><strong>4.2 ms</strong></td><td>~4-8.5 ms</td><td>~80-120</td></tr>
<tr><td>10,000 rpm</td><td>6.0 ms</td><td>3.0 ms</td><td>~4 ms</td><td>~140</td></tr>
<tr><td>15,000 rpm</td><td>4.0 ms</td><td>2.0 ms</td><td>~3.5 ms</td><td>~180</td></tr>
</table>
<p>החשבון: 7,200 rpm → 7,200 / 60 = 120 סיבובים בשנייה → 1 / 120 = 8.33 ms לסיבוב → חצי מזה = <strong>4.17 ms</strong> rotational latency ממוצע. מוסיפים seek של 4 ms בדיסק enterprise: 8.2 ms לכל IO → 1 / 0.0082 ≈ <strong>122 IOPS</strong>. עם queue עמוק הדיסק מסדר מחדש את הבקשות כדי לקצר את תנועת הזרוע (NCQ / elevator scheduling) ומגיעים ל-150-200 IOPS — וזו התקרה הפיזיקלית. שום עדכון firmware לא משנה את ניוטון.</p>
<p>קריאה רציפה זה סיפור אחר: אין seek, הראש פשוט קורא את ה-track כשהוא חולף מתחתיו, אז דיסק מודרני של 20 TB מזרים ~250-280 MB/s ב-tracks החיצוניים ובערך חצי מזה בפנימיים (ב-track חיצוני יש יותר sectors לסיבוב). בגלל זה HDD עדיין המלך של גיבויים, ארכיונים, וידאו וה-backend של object storage, איפה שה-IO גדול ורציף, בערך $15 ל-TB לעומת $50-80 ל-TB ב-SSD של enterprise.</p>
<blockquote>💡 מהשטח: דיסקי SAS של 15K rpm כמעט נכחדו — SSD זול של SATA עושה פי 100 מה-IOPS האקראיים שלהם. שוק ה-HDD היום הוא כמעט כולו דיסקי "nearline" גדולים של 7,200 rpm (20-30 TB, חלקם SMR או HAMR) שחיים בקופסאות NAS ובבטן של S3, Azure Blob ו-GCS.</blockquote>
<p><strong>CMR מול SMR:</strong> בדיסקי SMR (shingled) ה-tracks חופפים כמו רעפים כדי להרוויח ~20% נפח, אבל כתיבה מחדש של track מחייבת לכתוב מחדש את כל ה-band. הם בסדר לארכיון שנכתב פעם אחת, ונוראיים בכתיבות אקראיות או ב-rebuild של RAID — דיסק SMR במערך ZFS/RAID יכול לעשות resilver במשך ימים. תבדוק את ה-datasheet לפני שאתה קונה דיסקי "NAS".</p>`
      )
    },
    {
      h: t("Inside an SSD: NAND cells, the FTL, write amplification, TRIM and endurance", "בתוך SSD: תאי NAND, ה-FTL, write amplification, TRIM ו-endurance"),
      body: t(
`<p>An SSD stores charge in NAND flash cells. The more bits per cell, the more voltage levels the controller must tell apart — cheaper and denser, but slower and less durable:</p>
<table>
<tr><th>Type</th><th>Bits/cell</th><th>Voltage levels</th><th>Typical P/E cycles</th><th>Where you meet it</th></tr>
<tr><td>SLC</td><td>1</td><td>2</td><td>~50,000-100,000</td><td>Industrial, and the "SLC cache" region inside TLC/QLC drives</td></tr>
<tr><td>MLC</td><td>2</td><td>4</td><td>~3,000-10,000</td><td>Older enterprise drives</td></tr>
<tr><td>TLC</td><td>3</td><td>8</td><td>~1,000-3,000</td><td>Almost every laptop, server and cloud SSD today</td></tr>
<tr><td>QLC</td><td>4</td><td>16</td><td>~300-1,000</td><td>Cheap high-capacity (30-122 TB) read-mostly drives</td></tr>
</table>
<p>Two physical rules shape everything: you <strong>read and write in pages</strong> (~16 KB) but can only <strong>erase whole blocks</strong> (hundreds of pages, several MB), and a page must be erased before it is rewritten. So an SSD never overwrites in place. The <strong>Flash Translation Layer (FTL)</strong> in the controller keeps a map from logical block address (what the OS sees) to physical page, writes every update to a fresh page, marks the old one stale, and later runs <strong>garbage collection</strong>: copy the still-valid pages out of a mostly-stale block, then erase it. It also does <strong>wear leveling</strong> so no block dies early.</p>
<p>That copying is <strong>write amplification</strong>: WAF = bytes written to NAND / bytes written by the host. Sequential writes on an empty drive: WAF ≈ 1. Small random writes on a 95%-full drive: WAF of 3-10 is normal, and both speed and lifetime drop. Two levers fix it:</p>
<ul>
<li><strong>TRIM</strong> (SATA) / <strong>Deallocate</strong> (NVMe) / <strong>UNMAP</strong> (SCSI): the filesystem tells the drive "these blocks are free now", so GC doesn't copy dead data. On Linux, prefer a weekly <code>fstrim.timer</code> over the <code>discard</code> mount option.</li>
<li><strong>Over-provisioning</strong>: spare NAND the OS can't see. A 3.84 TB enterprise drive usually has ~4 TB of raw flash or more; "mixed-use" drives sold as 3.2 TB are the same hardware with more spare area → lower WAF, higher endurance.</li>
</ul>
<p><strong>Endurance</strong> is quoted as TBW (terabytes written) or DWPD (drive writes per day over the warranty):</p>
<pre>DWPD = TBW / (capacity_TB × 365 × warranty_years)

Consumer 1 TB, 600 TBW, 5 years:     600 / (1 × 365 × 5)   = 0.33 DWPD
Enterprise 3.84 TB, 1 DWPD, 5 years: 3.84 × 365 × 5        = 7,008 TB ≈ 7 PB TBW
Your DB writes 1.5 TB/day at WAF 3 → 4.5 TB/day of NAND writes
  → on the 7 PB drive: 7,008 / 4.5 ≈ 1,557 days ≈ 4.3 years</pre>
<blockquote>⚠️ Production tip: SSDs of the same model, bought together, in the same mirror, receiving the same writes, wear out together. Mixing batches (or at least watching <code>percentage_used</code>) is cheap insurance. Also: consumer SSDs without power-loss protection can lose acknowledged writes on power cut — enterprise drives have capacitors to flush the DRAM cache, which is also why their fsync latency is much lower.</blockquote>`,
`<p>SSD שומר מטען חשמלי בתאי NAND flash. ככל שיש יותר bits בתא, הבקר צריך להבחין בין יותר רמות מתח — זול וצפוף יותר, אבל איטי ופחות עמיד:</p>
<table>
<tr><th>סוג</th><th>Bits לתא</th><th>רמות מתח</th><th>P/E cycles טיפוסי</th><th>איפה תפגוש אותו</th></tr>
<tr><td>SLC</td><td>1</td><td>2</td><td>~50,000-100,000</td><td>תעשייתי, וגם אזור ה-"SLC cache" בתוך דיסקי TLC/QLC</td></tr>
<tr><td>MLC</td><td>2</td><td>4</td><td>~3,000-10,000</td><td>דיסקי enterprise ישנים</td></tr>
<tr><td>TLC</td><td>3</td><td>8</td><td>~1,000-3,000</td><td>כמעט כל SSD בלפטופ, בשרת ובענן היום</td></tr>
<tr><td>QLC</td><td>4</td><td>16</td><td>~300-1,000</td><td>דיסקים זולים בנפח עצום (30-122 TB), בעיקר לקריאה</td></tr>
</table>
<p>שני חוקים פיזיקליים קובעים הכול: <strong>קוראים וכותבים ב-pages</strong> (~16 KB), אבל אפשר <strong>למחוק רק blocks שלמים</strong> (מאות pages, כמה MB), ו-page חייב להימחק לפני שכותבים עליו שוב. לכן SSD אף פעם לא דורס במקום. ה-<strong>Flash Translation Layer (FTL)</strong> שבבקר מחזיק מפה מ-logical block address (מה שה-OS רואה) ל-page פיזי, כותב כל עדכון ל-page חדש, מסמן את הישן כ-stale, ואחר כך מריץ <strong>garbage collection</strong>: מעתיק החוצה את ה-pages שעדיין תקפים מ-block שרובו stale, ואז מוחק אותו. הוא גם עושה <strong>wear leveling</strong> כדי שאף block לא ימות מוקדם.</p>
<p>ההעתקה הזו היא <strong>write amplification</strong>: WAF = bytes שנכתבו ל-NAND חלקי bytes שה-host כתב. כתיבה רציפה לדיסק ריק: WAF ≈ 1. כתיבות אקראיות קטנות לדיסק מלא ב-95%: WAF של 3-10 זה נורמלי, וגם המהירות וגם אורך החיים יורדים. שני מנופים מתקנים את זה:</p>
<ul>
<li><strong>TRIM</strong> (SATA) / <strong>Deallocate</strong> (NVMe) / <strong>UNMAP</strong> (SCSI): ה-filesystem אומר לדיסק "ה-blocks האלה פנויים עכשיו", ואז ה-GC לא מעתיק מידע מת. בלינוקס עדיף <code>fstrim.timer</code> שבועי על פני mount option של <code>discard</code>.</li>
<li><strong>Over-provisioning</strong>: NAND רזרבי שה-OS לא רואה. לדיסק enterprise של 3.84 TB יש בדרך כלל ~4 TB של flash גולמי או יותר; דיסקי "mixed-use" שנמכרים כ-3.2 TB הם אותה חומרה עם יותר שטח רזרבי → WAF נמוך יותר, endurance גבוה יותר.</li>
</ul>
<p><strong>Endurance</strong> מצוין כ-TBW (terabytes written) או DWPD (כמה פעמים אפשר לכתוב את כל הדיסק ביום לאורך האחריות):</p>
<pre>DWPD = TBW / (capacity_TB × 365 × warranty_years)

Consumer 1 TB, 600 TBW, 5 years:     600 / (1 × 365 × 5)   = 0.33 DWPD
Enterprise 3.84 TB, 1 DWPD, 5 years: 3.84 × 365 × 5        = 7,008 TB ≈ 7 PB TBW
Your DB writes 1.5 TB/day at WAF 3 → 4.5 TB/day of NAND writes
  → on the 7 PB drive: 7,008 / 4.5 ≈ 1,557 days ≈ 4.3 years</pre>
<blockquote>⚠️ טיפ לפרודקשן: SSD-ים מאותו דגם, שנקנו יחד, באותו mirror, שמקבלים את אותן כתיבות — נשחקים יחד. לערבב batches (או לפחות לעקוב אחרי <code>percentage_used</code>) זה ביטוח זול. ועוד דבר: SSD צרכני בלי power-loss protection יכול לאבד כתיבות שכבר אושרו כשהחשמל נופל — לדיסקי enterprise יש קבלים שמרוקנים את ה-DRAM cache, ובגלל זה גם ה-fsync latency שלהם נמוך בהרבה.</blockquote>`
      )
    },
    {
      h: t("Interfaces: SATA vs SAS vs NVMe, queues and PCIe bandwidth", "ממשקים: SATA מול SAS מול NVMe, queues ורוחב פס של PCIe"),
      body: t(
`<p>The same NAND can be wrapped in very different plumbing. The protocol decides how many requests can be in flight and how much CPU each one costs:</p>
<table>
<tr><th></th><th>SATA (AHCI)</th><th>SAS</th><th>NVMe</th></tr>
<tr><td>Designed for</td><td>Spinning desktop disks</td><td>Enterprise HDD/SSD, dual-ported</td><td>Flash, from scratch</td></tr>
<tr><td>Link speed</td><td>6 Gb/s → ~550 MB/s real</td><td>12 Gb/s (SAS-3), 22.5 Gb/s (SAS-4 "24G")</td><td>PCIe lanes (usually x4)</td></tr>
<tr><td>Command queues</td><td><strong>1 queue × 32 commands</strong> (NCQ)</td><td>1 queue × ~254 commands per device</td><td><strong>up to 65,535 queues × 65,536 commands</strong></td></tr>
<tr><td>Path</td><td>CPU → HBA/chipset → AHCI → drive</td><td>CPU → SAS HBA/RAID card → drive</td><td>CPU → PCIe → drive (one queue pair per CPU core, no lock)</td></tr>
<tr><td>Typical 4K random read</td><td>~90K IOPS</td><td>~200-400K IOPS (SSD)</td><td>~1-2.5M IOPS (Gen4/Gen5)</td></tr>
<tr><td>Latency added by stack</td><td>~10-20 µs</td><td>~10-20 µs</td><td>~2-5 µs</td></tr>
</table>
<p>NVMe's trick is that each CPU core gets its own submission/completion queue pair, so 64 cores can issue IO in parallel without fighting over one lock. The bandwidth ceiling then comes from PCIe:</p>
<table>
<tr><th>PCIe gen</th><th>Per lane (after encoding)</th><th>x4 drive link</th><th>Real drives (seq. read)</th></tr>
<tr><td>Gen3 (8 GT/s)</td><td>~0.98 GB/s</td><td>~3.9 GB/s</td><td>~3.5 GB/s</td></tr>
<tr><td>Gen4 (16 GT/s)</td><td>~1.97 GB/s</td><td>~7.9 GB/s</td><td>~7 GB/s</td></tr>
<tr><td>Gen5 (32 GT/s)</td><td>~3.94 GB/s</td><td>~15.8 GB/s</td><td>~12-14 GB/s</td></tr>
<tr><td>Gen6 (64 GT/s)</td><td>~7.5 GB/s</td><td>~30 GB/s</td><td>first drives 2026+</td></tr>
</table>
<p>Form factors are separate from protocol: <strong>M.2</strong> (laptops, boot drives) can be SATA <em>or</em> NVMe; <strong>U.2/U.3</strong> and <strong>E1.S/E3.S (EDSFF)</strong> are hot-swappable server NVMe. And <strong>NVMe-oF</strong> (over RDMA or TCP) carries the same protocol across the network — that's roughly how cloud block storage is exposed to modern VMs.</p>
<blockquote>💡 Real world: on AWS Nitro instances <em>every</em> disk, even a network EBS volume, shows up as <code>/dev/nvme1n1</code>. The guest speaks NVMe to the Nitro card, which turns it into network traffic to EBS. Seeing "nvme" in <code>lsblk</code> tells you nothing about whether the disk is local — use <code>sudo nvme list</code> and look at the model: "Amazon Elastic Block Store" vs "Amazon EC2 NVMe Instance Storage".</blockquote>
<p>Little's Law ties it together: <strong>IOPS = queue depth / latency</strong>. A disk at 100 µs with 1 request outstanding does 10,000 IOPS; to reach 1M IOPS at the same latency you need 100 requests in flight. That's why single-threaded <code>dd</code> makes an NVMe drive look slow, and why databases issue IO from many threads or use <code>io_uring</code>.</p>`,
`<p>אותו NAND יכול להיעטף בצנרת שונה מאוד. הפרוטוקול קובע כמה בקשות יכולות להיות באוויר במקביל וכמה CPU כל אחת עולה:</p>
<table>
<tr><th></th><th>SATA (AHCI)</th><th>SAS</th><th>NVMe</th></tr>
<tr><td>תוכנן עבור</td><td>דיסקים מסתובבים של desktop</td><td>HDD/SSD של enterprise, dual-ported</td><td>Flash, מאפס</td></tr>
<tr><td>מהירות link</td><td>6 Gb/s → בפועל ~550 MB/s</td><td>12 Gb/s (SAS-3), 22.5 Gb/s (SAS-4 "24G")</td><td>נתיבי PCIe (בדרך כלל x4)</td></tr>
<tr><td>Command queues</td><td><strong>queue אחד × 32 פקודות</strong> (NCQ)</td><td>queue אחד × ~254 פקודות לדיסק</td><td><strong>עד 65,535 queues × 65,536 פקודות</strong></td></tr>
<tr><td>מסלול</td><td>CPU → HBA/chipset → AHCI → דיסק</td><td>CPU → SAS HBA/כרטיס RAID → דיסק</td><td>CPU → PCIe → דיסק (זוג queues לכל core, בלי lock)</td></tr>
<tr><td>4K random read טיפוסי</td><td>~90K IOPS</td><td>~200-400K IOPS (SSD)</td><td>~1-2.5M IOPS (Gen4/Gen5)</td></tr>
<tr><td>Latency שה-stack מוסיף</td><td>~10-20 µs</td><td>~10-20 µs</td><td>~2-5 µs</td></tr>
</table>
<p>הטריק של NVMe הוא שלכל core יש זוג submission/completion queues משלו, כך ש-64 cores יכולים לשלוח IO במקביל בלי להילחם על lock אחד. את תקרת רוחב הפס קובע PCIe:</p>
<table>
<tr><th>דור PCIe</th><th>לכל lane (אחרי encoding)</th><th>Link של x4</th><th>דיסקים בפועל (קריאה רציפה)</th></tr>
<tr><td>Gen3 (8 GT/s)</td><td>~0.98 GB/s</td><td>~3.9 GB/s</td><td>~3.5 GB/s</td></tr>
<tr><td>Gen4 (16 GT/s)</td><td>~1.97 GB/s</td><td>~7.9 GB/s</td><td>~7 GB/s</td></tr>
<tr><td>Gen5 (32 GT/s)</td><td>~3.94 GB/s</td><td>~15.8 GB/s</td><td>~12-14 GB/s</td></tr>
<tr><td>Gen6 (64 GT/s)</td><td>~7.5 GB/s</td><td>~30 GB/s</td><td>דיסקים ראשונים מ-2026</td></tr>
</table>
<p>Form factor זה נפרד מהפרוטוקול: <strong>M.2</strong> (לפטופים, דיסקי boot) יכול להיות SATA <em>או</em> NVMe; <strong>U.2/U.3</strong> ו-<strong>E1.S/E3.S (EDSFF)</strong> הם NVMe לשרתים עם hot-swap. ו-<strong>NVMe-oF</strong> (על RDMA או TCP) מעביר את אותו פרוטוקול על הרשת — פחות או יותר ככה block storage בענן נחשף ל-VM-ים מודרניים.</p>
<blockquote>💡 מהשטח: במכונות Nitro של AWS <em>כל</em> דיסק, גם volume של EBS ברשת, מופיע כ-<code>/dev/nvme1n1</code>. ה-guest מדבר NVMe עם כרטיס ה-Nitro, שהופך את זה לתעבורת רשת ל-EBS. לראות "nvme" ב-<code>lsblk</code> לא אומר כלום על זה שהדיסק מקומי — תריץ <code>sudo nvme list</code> ותסתכל על ה-model: "Amazon Elastic Block Store" מול "Amazon EC2 NVMe Instance Storage".</blockquote>
<p>Little's Law קושר את הכול: <strong>IOPS = queue depth / latency</strong>. דיסק עם latency של 100 µs ובקשה אחת באוויר עושה 10,000 IOPS; כדי להגיע ל-1M IOPS באותו latency צריך 100 בקשות באוויר. לכן <code>dd</code> עם thread אחד גורם ל-NVMe להיראות איטי, ולכן מסדי נתונים שולחים IO מהרבה threads או משתמשים ב-<code>io_uring</code>.</p>`
      )
    },
    {
      h: t("SMART: reading disk health before it dies", "SMART: לקרוא את בריאות הדיסק לפני שהוא מת"),
      body: t(
`<p>Every drive keeps self-monitoring counters (S.M.A.R.T.). For SATA/SAS use <code>smartctl</code> from smartmontools; for NVMe either <code>smartctl</code> or <code>nvme-cli</code>.</p>
<pre>$ sudo smartctl -a /dev/sda
=== START OF INFORMATION SECTION ===
Device Model:     WDC WUH722020BLE6L4
User Capacity:    20,000,588,955,648 bytes [20.0 TB]
Rotation Rate:    7200 rpm
SMART overall-health self-assessment test result: PASSED
ID# ATTRIBUTE_NAME          VALUE WORST THRESH TYPE      RAW_VALUE
  5 Reallocated_Sector_Ct   100   100   005    Pre-fail  0
  9 Power_On_Hours          093   093   000    Old_age   31544
187 Reported_Uncorrect      100   100   000    Old_age   0
194 Temperature_Celsius     062   048   000    Old_age   38
197 Current_Pending_Sector  100   100   000    Old_age   0
198 Offline_Uncorrectable   100   100   000    Old_age   0
199 UDMA_CRC_Error_Count    200   200   000    Old_age   0</pre>
<p>Read the <strong>RAW_VALUE</strong>, not "PASSED" — the overall verdict only flips when a normalized value crosses the vendor threshold, often way too late. Backblaze's fleet data (hundreds of thousands of drives) shows the attributes that actually predict failure are <strong>5</strong> (reallocated), <strong>187</strong> (uncorrectable reported), <strong>188</strong> (command timeout), <strong>197</strong> (pending — sectors that failed a read and await a rewrite) and <strong>198</strong> (offline uncorrectable). Any non-zero and growing value = plan a replacement. <strong>199</strong> growing usually means a bad cable or backplane, not a bad disk.</p>
<pre>$ sudo nvme smart-log /dev/nvme0
critical_warning                    : 0
temperature                         : 41 °C
available_spare                     : 100%
available_spare_threshold           : 10%
percentage_used                     : 7%
data_units_written                  : 1,465,000,000
media_errors                        : 0
num_err_log_entries                 : 12
unsafe_shutdowns                    : 9</pre>
<p>For NVMe watch <code>critical_warning</code> (any bit set is bad), <code>available_spare</code> dropping toward its threshold, <code>percentage_used</code> (vendor's estimate of rated endurance consumed — can exceed 100%) and <code>media_errors</code>. One data unit = 1,000 × 512 bytes, so 1,465,000,000 units × 512,000 B ≈ <strong>750 TB written</strong>.</p>
<blockquote>⚠️ Production tip: run <code>smartd</code> (or node_exporter's smartctl exporter) with alerts on 5/187/197/198 deltas and NVMe <code>critical_warning</code>, and schedule a weekly long self-test (<code>smartctl -t long</code>). Cloud disks don't expose SMART at all — there the provider handles drive health and you watch latency and the volume status checks instead.</blockquote>`,
`<p>כל דיסק מחזיק מוני ניטור עצמי (S.M.A.R.T.). ל-SATA/SAS משתמשים ב-<code>smartctl</code> מחבילת smartmontools; ל-NVMe ב-<code>smartctl</code> או ב-<code>nvme-cli</code>.</p>
<pre>$ sudo smartctl -a /dev/sda
=== START OF INFORMATION SECTION ===
Device Model:     WDC WUH722020BLE6L4
User Capacity:    20,000,588,955,648 bytes [20.0 TB]
Rotation Rate:    7200 rpm
SMART overall-health self-assessment test result: PASSED
ID# ATTRIBUTE_NAME          VALUE WORST THRESH TYPE      RAW_VALUE
  5 Reallocated_Sector_Ct   100   100   005    Pre-fail  0
  9 Power_On_Hours          093   093   000    Old_age   31544
187 Reported_Uncorrect      100   100   000    Old_age   0
194 Temperature_Celsius     062   048   000    Old_age   38
197 Current_Pending_Sector  100   100   000    Old_age   0
198 Offline_Uncorrectable   100   100   000    Old_age   0
199 UDMA_CRC_Error_Count    200   200   000    Old_age   0</pre>
<p>תקרא את ה-<strong>RAW_VALUE</strong>, לא את ה-"PASSED" — הפסיקה הכללית מתהפכת רק כשערך מנורמל חוצה את ה-threshold של היצרן, הרבה פעמים מאוחר מדי. הנתונים של Backblaze (מאות אלפי דיסקים) מראים שהמדדים שבאמת חוזים כשל הם <strong>5</strong> (reallocated), <strong>187</strong> (uncorrectable reported), <strong>188</strong> (command timeout), <strong>197</strong> (pending — sectors שנכשלו בקריאה ומחכים לכתיבה מחדש) ו-<strong>198</strong> (offline uncorrectable). כל ערך שאינו אפס ועולה = לתכנן החלפה. <strong>199</strong> שעולה זה בדרך כלל כבל או backplane תקולים, לא דיסק תקול.</p>
<pre>$ sudo nvme smart-log /dev/nvme0
critical_warning                    : 0
temperature                         : 41 °C
available_spare                     : 100%
available_spare_threshold           : 10%
percentage_used                     : 7%
data_units_written                  : 1,465,000,000
media_errors                        : 0
num_err_log_entries                 : 12
unsafe_shutdowns                    : 9</pre>
<p>ב-NVMe עוקבים אחרי <code>critical_warning</code> (כל bit דולק זה רע), <code>available_spare</code> שיורד לכיוון ה-threshold, <code>percentage_used</code> (הערכת היצרן כמה מה-endurance נצרך — יכול לעבור 100%) ו-<code>media_errors</code>. Data unit אחד = 1,000 × 512 bytes, אז 1,465,000,000 units × 512,000 B ≈ <strong>750 TB שנכתבו</strong>.</p>
<blockquote>⚠️ טיפ לפרודקשן: תריץ <code>smartd</code> (או את ה-smartctl exporter של node_exporter) עם התראות על שינוי ב-5/187/197/198 ועל <code>critical_warning</code> ב-NVMe, ותזמן long self-test שבועי (<code>smartctl -t long</code>). דיסקים בענן לא חושפים SMART בכלל — שם הספק מטפל בבריאות הדיסקים ואתה עוקב אחרי latency ואחרי ה-status checks של ה-volume.</blockquote>`
      )
    },
    {
      h: t("Cloud disks vs local NVMe, and benchmarking with fio", "דיסקים בענן מול NVMe מקומי, ו-benchmark עם fio"),
      body: t(
`<table>
<tr><th>Offering</th><th>Media</th><th>Performance model</th><th>Max per volume (approx.)</th></tr>
<tr><td>AWS EBS gp3</td><td>SSD, network</td><td>3,000 IOPS / 125 MiB/s baseline at any size, pay to raise</td><td>16,000 IOPS / 1,000 MiB/s for years; raised in 2025 to 80,000 / 2,000 MiB/s on bigger volumes — check your region</td></tr>
<tr><td>AWS EBS io2 Block Express</td><td>SSD, network</td><td>Provisioned IOPS (up to 1,000 IOPS per GiB), sub-ms, 99.999% durability</td><td>256,000 IOPS / 4,000 MiB/s, 64 TiB</td></tr>
<tr><td>AWS st1 / sc1</td><td>HDD, network</td><td>Throughput credits, for big sequential scans</td><td>500 / 250 MiB/s</td></tr>
<tr><td>Azure Premium SSD (v1)</td><td>SSD</td><td>Size-based tiers: P30 (1 TiB) = 5,000 IOPS / 200 MB/s</td><td>P80: 20,000 IOPS / 900 MB/s</td></tr>
<tr><td>Azure Premium SSD v2</td><td>SSD</td><td>3,000 IOPS / 125 MB/s free, tune IOPS & MB/s independently</td><td>80,000 IOPS / 1,200 MB/s</td></tr>
<tr><td>Azure Ultra Disk</td><td>SSD</td><td>Provisioned, change live</td><td>400,000 IOPS / 10,000 MB/s</td></tr>
<tr><td>GCP pd-balanced / pd-ssd</td><td>SSD</td><td>IOPS scale with size (6 / 30 IOPS per GB)</td><td>up to ~80,000-100,000 IOPS, capped by VM</td></tr>
<tr><td>GCP Hyperdisk Balanced / Extreme</td><td>SSD</td><td>Provisioned IOPS & throughput, decoupled from size</td><td>Extreme: 350,000 IOPS</td></tr>
<tr><td>Local NVMe (EC2 i4i/i7i, Azure Lsv3, GCP Local SSD)</td><td>NVMe in the host</td><td>Included in the instance price</td><td>Hundreds of thousands to millions of IOPS, ~50-100 µs</td></tr>
</table>
<p>The catch with local NVMe: it is <strong>ephemeral</strong>. Stop the instance, lose the host, or get a spot interruption — the data is gone. Use it for caches, scratch space, Kafka/Cassandra/Elasticsearch replicas that rebuild from peers, or temp tables — never as the only copy. Also remember the <strong>instance</strong> has its own EBS bandwidth limit: a small instance can't drive a 64,000-IOPS volume.</p>
<p><strong>Benchmark before you believe a datasheet.</strong> fio is the standard tool. Always use <code>--direct=1</code> (skip the page cache, or you benchmark RAM) and a file bigger than any cache:</p>
<pre>$ sudo fio --name=randread --filename=/data/fio.test --size=20G \
    --rw=randread --bs=4k --ioengine=libaio --direct=1 \
    --iodepth=32 --numjobs=4 --runtime=60 --time_based --group_reporting

randread: (groupid=0, jobs=4): err= 0: pid=4121
  read: IOPS=412k, BW=1609MiB/s (1687MB/s)(94.3GiB/60001msec)
    clat (usec): min=12, max=4120, avg=306.40, stdev=88.12
    clat percentiles (usec):
     |  1.00th=[  130],  5.00th=[  165], 50.00th=[  297],
     | 90.00th=[  412], 99.00th=[  578], 99.90th=[  848], 99.99th=[ 1450]
  cpu          : usr=12.10%, sys=38.42%
  IO depths    : 32=100.0%</pre>
<p>How to read it: <strong>IOPS=412k</strong> × 4 KiB = 1,609 MiB/s (BW line agrees). <strong>clat</strong> is completion latency per IO — the median 297 µs and the <strong>p99 / p99.9</strong> tail are what your database feels. Sanity-check with Little's Law: 4 jobs × iodepth 32 = 128 in flight; 128 / 306 µs ≈ 418K IOPS ✓. Run the same job on a gp3 volume and you'll see <code>IOPS=3000</code> with avg clat ≈ 128 / 3,000 = ~43 ms — the volume is throttled and requests queue. Other jobs worth running: <code>--rw=randwrite --bs=4k --iodepth=1 --fsync=1</code> (database commit latency) and <code>--rw=read --bs=1M</code> (throughput).</p>
<blockquote>⚠️ Production tip: never point fio at a raw device that holds data (<code>--filename=/dev/nvme1n1</code> with a write job destroys the filesystem). Benchmark a file, or a fresh volume. And a new EBS volume restored from a snapshot is lazily loaded from S3 — first reads are slow until you pre-warm it (read every block with fio/dd) or enable Fast Snapshot Restore.</blockquote>`,
`<table>
<tr><th>שירות</th><th>מדיה</th><th>מודל ביצועים</th><th>מקסימום ל-volume (בקירוב)</th></tr>
<tr><td>AWS EBS gp3</td><td>SSD ברשת</td><td>3,000 IOPS / 125 MiB/s בסיס בכל גודל, משלמים כדי להעלות</td><td>שנים זה היה 16,000 IOPS / 1,000 MiB/s; ב-2025 עלה ל-80,000 / 2,000 MiB/s ב-volumes גדולים — תבדוק ב-region שלך</td></tr>
<tr><td>AWS EBS io2 Block Express</td><td>SSD ברשת</td><td>Provisioned IOPS (עד 1,000 IOPS ל-GiB), פחות מ-ms, durability של 99.999%</td><td>256,000 IOPS / 4,000 MiB/s, 64 TiB</td></tr>
<tr><td>AWS st1 / sc1</td><td>HDD ברשת</td><td>Throughput credits, לסריקות רציפות גדולות</td><td>500 / 250 MiB/s</td></tr>
<tr><td>Azure Premium SSD (v1)</td><td>SSD</td><td>Tiers לפי גודל: P30 (1 TiB) = 5,000 IOPS / 200 MB/s</td><td>P80: 20,000 IOPS / 900 MB/s</td></tr>
<tr><td>Azure Premium SSD v2</td><td>SSD</td><td>3,000 IOPS / 125 MB/s בחינם, מכוונים IOPS ו-MB/s בנפרד</td><td>80,000 IOPS / 1,200 MB/s</td></tr>
<tr><td>Azure Ultra Disk</td><td>SSD</td><td>Provisioned, משנים בזמן ריצה</td><td>400,000 IOPS / 10,000 MB/s</td></tr>
<tr><td>GCP pd-balanced / pd-ssd</td><td>SSD</td><td>IOPS גדלים עם הנפח (6 / 30 IOPS ל-GB)</td><td>עד ~80,000-100,000 IOPS, מוגבל לפי ה-VM</td></tr>
<tr><td>GCP Hyperdisk Balanced / Extreme</td><td>SSD</td><td>IOPS ו-throughput מוקצים, מנותקים מהנפח</td><td>Extreme: 350,000 IOPS</td></tr>
<tr><td>NVMe מקומי (EC2 i4i/i7i, Azure Lsv3, GCP Local SSD)</td><td>NVMe בתוך ה-host</td><td>כלול במחיר ה-instance</td><td>מאות אלפים עד מיליוני IOPS, ~50-100 µs</td></tr>
</table>
<p>הקאץ' של NVMe מקומי: הוא <strong>ephemeral</strong>. עוצרים את ה-instance, ה-host מת, או מקבלים spot interruption — המידע נעלם. משתמשים בו ל-cache, ל-scratch, ל-replicas של Kafka/Cassandra/Elasticsearch שנבנים מחדש מה-peers, או לטבלאות זמניות — אף פעם לא כעותק היחיד. ותזכור שגם ל-<strong>instance</strong> יש מגבלת EBS bandwidth משלו: instance קטן לא יצליח להזיז volume של 64,000 IOPS.</p>
<p><strong>תעשה benchmark לפני שאתה מאמין ל-datasheet.</strong> fio הוא הכלי הסטנדרטי. תמיד <code>--direct=1</code> (לעקוף את ה-page cache, אחרת אתה מודד RAM) וקובץ גדול מכל cache:</p>
<pre>$ sudo fio --name=randread --filename=/data/fio.test --size=20G \
    --rw=randread --bs=4k --ioengine=libaio --direct=1 \
    --iodepth=32 --numjobs=4 --runtime=60 --time_based --group_reporting

randread: (groupid=0, jobs=4): err= 0: pid=4121
  read: IOPS=412k, BW=1609MiB/s (1687MB/s)(94.3GiB/60001msec)
    clat (usec): min=12, max=4120, avg=306.40, stdev=88.12
    clat percentiles (usec):
     |  1.00th=[  130],  5.00th=[  165], 50.00th=[  297],
     | 90.00th=[  412], 99.00th=[  578], 99.90th=[  848], 99.99th=[ 1450]
  cpu          : usr=12.10%, sys=38.42%
  IO depths    : 32=100.0%</pre>
<p>איך קוראים את זה: <strong>IOPS=412k</strong> × 4 KiB = 1,609 MiB/s (שורת ה-BW מסכימה). <strong>clat</strong> הוא completion latency לכל IO — החציון של 297 µs וה-tail של <strong>p99 / p99.9</strong> הם מה שה-DB שלך מרגיש. בדיקת שפיות עם Little's Law: 4 jobs × iodepth 32 = 128 בקשות באוויר; 128 / 306 µs ≈ 418K IOPS ✓. תריץ את אותו job על volume של gp3 ותראה <code>IOPS=3000</code> עם clat ממוצע ≈ 128 / 3,000 = ~43 ms — ה-volume עושה throttling והבקשות עומדות בתור. עוד jobs ששווה להריץ: <code>--rw=randwrite --bs=4k --iodepth=1 --fsync=1</code> (latency של commit ב-DB) ו-<code>--rw=read --bs=1M</code> (throughput).</p>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם אל תכוון fio ל-device גולמי שיש עליו מידע (<code>--filename=/dev/nvme1n1</code> עם job של כתיבה מוחק את ה-filesystem). תמדוד על קובץ, או על volume חדש. ועוד: volume חדש של EBS ששוחזר מ-snapshot נטען בעצלות מ-S3 — הקריאות הראשונות איטיות עד שאתה עושה לו pre-warm (קורא כל block עם fio/dd) או מפעיל Fast Snapshot Restore.</blockquote>`
      )
    }
  ],
  diagram: `HDD random read:  [arm seek ~4-9 ms] + [wait 1/2 rotation: 4.2 ms @7200rpm] + [transfer ~0.05 ms]  => ~100-200 IOPS

SSD write path:   host LBA 42 --FTL map--> new page P(9,17)   old page P(3,5) = stale
                  block 3 mostly stale --GC--> copy valid pages out --> erase block 3   (WAF = NAND bytes / host bytes)

Interfaces:       SATA/AHCI : CPU ---> [ 1 queue x 32 ] ---> disk           ~550 MB/s
                  NVMe      : core0 -> [SQ/CQ] \
                              core1 -> [SQ/CQ]  >-- PCIe x4 --> SSD          Gen4 ~7 GB/s, up to 64K queues x 64K
                              coreN -> [SQ/CQ] /

Little's Law:     IOPS = in-flight IOs / latency      128 / 306 us = ~418K IOPS`,
  handsOn: [
    { cmd: "lsblk -d -o NAME,ROTA,TRAN,MODEL,SIZE && sudo nvme list", what: t("ROTA=1 means spinning disk; TRAN shows sata/sas/nvme; nvme list reveals whether an NVMe device is local or EBS.", "ROTA=1 אומר דיסק מסתובב; TRAN מראה sata/sas/nvme; nvme list חושף אם ה-NVMe מקומי או EBS.") },
    { cmd: "sudo smartctl -a /dev/sda | grep -E 'Reallocated|Pending|Uncorrect|CRC|Power_On'", what: t("Pull the SMART attributes that predict failure; any non-zero growing RAW value is a replacement ticket.", "שולף את מדדי ה-SMART שחוזים כשל; כל RAW value שאינו אפס ועולה = טיקט להחלפה.") },
    { cmd: "sudo nvme smart-log /dev/nvme0 | grep -E 'critical|spare|percentage_used|media_errors|data_units_written'", what: t("NVMe health: spare capacity, endurance used and media errors.", "בריאות NVMe: שטח רזרבי, כמה endurance נצרך ושגיאות מדיה.") },
    { cmd: "sudo fio --name=commit --filename=/data/fio.test --size=2G --rw=randwrite --bs=4k --iodepth=1 --fsync=1 --direct=1 --runtime=30 --time_based", what: t("Measure what a database commit feels: 4K write + fsync at queue depth 1. Look at clat p99.", "מודד את מה ש-commit ב-DB מרגיש: כתיבת 4K + fsync ב-queue depth 1. תסתכל על clat p99.") },
    { cmd: "systemctl status fstrim.timer && sudo fstrim -av", what: t("Check that weekly TRIM is enabled and run it once by hand to see how much each filesystem released.", "בודק ש-TRIM שבועי מופעל ומריץ אותו ידנית כדי לראות כמה כל filesystem שחרר.") }
  ],
  mnemonic: t(
    "HDD = Newton (seek + spin), SSD = janitor (FTL + GC + wear), NVMe = many windows (64K queues). IOPS = depth / latency.",
    "HDD = ניוטון (seek + סיבוב), SSD = שרת ניקיון (FTL + GC + שחיקה), NVMe = הרבה אשנבים (64K queues). IOPS = עומק / latency."
  ),
  pitfalls: [
    t("Benchmarking with dd or without --direct=1: you measure the page cache (GB/s from RAM) and size the production disk wrong.", "Benchmark עם dd או בלי --direct=1: אתה מודד את ה-page cache (GB/s מה-RAM) ומתמחר את דיסק הפרודקשן לא נכון."),
    t("Trusting 'SMART PASSED': the overall flag flips late. Alert on raw 5/187/197/198 growth instead.", "לסמוך על 'SMART PASSED': הדגל הכללי מתהפך מאוחר. תתריע על עלייה ב-raw של 5/187/197/198."),
    t("Storing the only copy of data on instance store / local NVMe — a stop or host failure wipes it.", "לשמור את העותק היחיד של המידע על instance store / NVMe מקומי — stop או כשל של ה-host מוחקים אותו."),
    t("Running an SSD at 95% full with no TRIM: write amplification explodes, latency spikes and endurance drains.", "להריץ SSD מלא ב-95% בלי TRIM: ה-write amplification מתפוצץ, ה-latency קופץ וה-endurance נשרף.")
  ],
  interview: [
    { q: t("Why does a 7,200 rpm HDD top out around 100-200 random IOPS?", "למה HDD של 7,200 rpm נעצר בסביבות 100-200 IOPS אקראיים?"),
      a: t("Each random IO pays a seek (~4-9 ms) plus on average half a rotation: 60/7200 = 8.33 ms per revolution, so ~4.2 ms. ~8-12 ms per IO → ~80-120 IOPS at QD1; command reordering with a deep queue pushes it to ~150-200. It's mechanical, so no software fixes it.", "כל IO אקראי משלם seek (~4-9 ms) ועוד בממוצע חצי סיבוב: 60/7200 = 8.33 ms לסיבוב, כלומר ~4.2 ms. ~8-12 ms לכל IO → ~80-120 IOPS ב-QD1; סידור מחדש של פקודות עם queue עמוק מביא ל-150-200. זה מכני, אז שום תוכנה לא מתקנת את זה.") },
    { q: t("What is write amplification on an SSD and how do you reduce it?", "מה זה write amplification ב-SSD ואיך מקטינים אותו?"),
      a: t("NAND can only be erased in large blocks, so the FTL writes updates to new pages and garbage-collects blocks by copying still-valid pages. WAF = NAND writes / host writes. Reduce it with TRIM/discard so dead data isn't copied, free space / over-provisioning, and larger sequential writes (LSM-style) instead of small random overwrites.", "NAND אפשר למחוק רק בבלוקים גדולים, אז ה-FTL כותב עדכונים ל-pages חדשים ועושה garbage collection ל-blocks ע\"י העתקת ה-pages שעדיין תקפים. WAF = כתיבות NAND חלקי כתיבות host. מקטינים עם TRIM/discard כדי שמידע מת לא יועתק, שטח פנוי / over-provisioning, וכתיבות רציפות גדולות (בסגנון LSM) במקום דריסות אקראיות קטנות.") },
    { q: t("Your gp3-backed Postgres shows 40 ms write latency but %util looks fine on the host. What's going on?", "ל-Postgres שלך על gp3 יש write latency של 40 ms, אבל ה-%util על ה-host נראה בסדר. מה קורה?"),
      a: t("The volume is likely capped at its provisioned 3,000 IOPS / 125 MiB/s (or the instance's EBS bandwidth limit). By Little's Law, with ~128 IOs in flight at 3,000 IOPS each waits ~43 ms. Check CloudWatch VolumeReadOps/WriteOps and throughput against limits, then raise gp3 IOPS, move to io2, or reduce IO (bigger buffer cache, fewer fsyncs).", "כנראה שה-volume מגיע לתקרה המוקצית של 3,000 IOPS / 125 MiB/s (או למגבלת ה-EBS bandwidth של ה-instance). לפי Little's Law, עם ~128 IOs באוויר ב-3,000 IOPS כל אחד מחכה ~43 ms. תבדוק ב-CloudWatch את VolumeReadOps/WriteOps ואת ה-throughput מול המגבלות, ואז תעלה IOPS ב-gp3, תעבור ל-io2, או תקטין IO (buffer cache גדול יותר, פחות fsync).") }
  ],
  quiz: [
    { q: t("What is the average rotational latency of a 7,200 rpm disk?", "מה ה-rotational latency הממוצע של דיסק 7,200 rpm?"),
      options: [t("~0.4 ms", "~0.4 ms"), t("~4.2 ms", "~4.2 ms"), t("~8.3 ms", "~8.3 ms"), t("~12 ms", "~12 ms")],
      answer: 1,
      explain: t("One revolution = 60 / 7,200 s = 8.33 ms; on average you wait half a revolution = 4.17 ms.", "סיבוב אחד = 60 / 7,200 שניות = 8.33 ms; בממוצע מחכים חצי סיבוב = 4.17 ms.") },
    { q: t("Why can NVMe reach millions of IOPS while SATA SSDs stall around ~90K?", "למה NVMe מגיע למיליוני IOPS כש-SSD של SATA נתקע בסביבות 90K?"),
      options: [t("NVMe uses SLC flash only", "NVMe משתמש רק ב-SLC flash"), t("NVMe has up to 64K queues × 64K commands over PCIe vs SATA's single 32-command queue", "ל-NVMe יש עד 64K queues × 64K פקודות על PCIe, מול queue יחיד של 32 פקודות ב-SATA"), t("SATA SSDs have spinning parts", "ב-SSD של SATA יש חלקים מסתובבים"), t("NVMe disables the FTL", "NVMe מבטל את ה-FTL")],
      answer: 1,
      explain: t("The protocol and bus are the bottleneck: AHCI was built for disks with one queue of 32; NVMe gives each core its own queue pair and PCIe gives GB/s per lane.", "הפרוטוקול וה-bus הם צוואר הבקבוק: AHCI נבנה לדיסקים מסתובבים עם queue אחד של 32; NVMe נותן לכל core זוג queues משלו ו-PCIe נותן GB/s לכל lane.") },
    { q: t("A 3.84 TB SSD is rated 1 DWPD for 5 years. Roughly what TBW is that?", "SSD של 3.84 TB מדורג ל-1 DWPD לחמש שנים. בערך כמה TBW זה?"),
      options: [t("~19 TB", "~19 TB"), t("~700 TB", "~700 TB"), t("~7,000 TB (7 PB)", "~7,000 TB (7 PB)"), t("~70 PB", "~70 PB")],
      answer: 2,
      explain: t("TBW = capacity × DWPD × 365 × years = 3.84 × 1 × 365 × 5 ≈ 7,008 TB.", "TBW = נפח × DWPD × 365 × שנים = 3.84 × 1 × 365 × 5 ≈ 7,008 TB.") },
    { q: t("fio reports IOPS=3000 and avg clat ≈ 43 ms at total queue depth 128 on an EBS gp3 volume. Most likely cause?", "fio מראה IOPS=3000 ו-clat ממוצע של ~43 ms ב-queue depth כולל של 128 על volume של gp3. הסיבה הסבירה?"),
      options: [t("The SSD is wearing out", "ה-SSD נשחק"), t("The volume is throttled at its provisioned 3,000 IOPS, so requests queue (128 / 3,000 ≈ 43 ms)", "ה-volume עושה throttling ב-3,000 IOPS המוקצים, אז הבקשות עומדות בתור (128 / 3,000 ≈ 43 ms)"), t("TRIM is disabled", "TRIM כבוי"), t("The page cache is too small", "ה-page cache קטן מדי")],
      answer: 1,
      explain: t("Little's Law: latency = in-flight / IOPS. A provisioned cap turns extra concurrency into queueing delay, not more throughput.", "Little's Law: latency = בקשות באוויר / IOPS. תקרה מוקצית הופכת מקביליות נוספת להמתנה בתור, לא ליותר throughput.") }
  ],
  related: ["storage-io", "fs-filesystems-raid", "linux-disks-storage", "cloud-storage", "filesystems-compared", "raid-levels-deep", "db-storage-engines"]
});

/* ---------------------------------------------------------------------- */
INFRA.lessons.push({
  id: "filesystems-compared",
  track: "foundations",
  order: 34,
  icon: "🗂️",
  level: 2,
  minutes: 16,
  title: t("Filesystems Compared: NTFS, ReFS, FAT32, exFAT, ext4, XFS, btrfs, ZFS, APFS", "השוואת filesystems: NTFS, ReFS, FAT32, exFAT, ext4, XFS, btrfs, ZFS, APFS"),
  tldr: t(
    "A filesystem is a set of trade-offs: journaling (ext4, XFS, NTFS) protects metadata after a crash, copy-on-write (ZFS, btrfs, APFS, ReFS) adds snapshots and checksums, FAT32 is the universal but 4 GiB-per-file relic, and network filesystems (NFS, SMB) add a network round trip and a permission model to every call. Pick by OS, workload and what must survive.",
    "Filesystem הוא אוסף של trade-offs: journaling (ext4, XFS, NTFS) מגן על ה-metadata אחרי קריסה, copy-on-write (ZFS, btrfs, APFS, ReFS) מוסיף snapshots ו-checksums, FAT32 הוא השריד האוניברסלי עם מגבלת 4 GiB לקובץ, ו-filesystems של רשת (NFS, SMB) מוסיפים round trip ומודל הרשאות לכל קריאה. בוחרים לפי מערכת ההפעלה, ה-workload ומה חייב לשרוד."
  ),
  analogy: t(
    "Filesystems are different ways to run a warehouse. FAT32 is a paper ledger: everyone can read it, but no locks, no safety, and no box over 4 GiB fits through the door. ext4/XFS/NTFS keep a logbook of every shelf change so a power cut doesn't leave the inventory confused (journaling). ZFS/btrfs never move a box in place — they put the new version on an empty shelf and flip the label, so you can photograph the whole warehouse at any moment (snapshots) and every box carries a tamper seal (checksums). NFS and SMB are a phone line to a warehouse across town.",
    "Filesystems הם דרכים שונות לנהל מחסן. FAT32 הוא פנקס נייר: כולם יכולים לקרוא אותו, אבל אין מנעולים, אין בטיחות, ושום קרטון מעל 4 GiB לא עובר בדלת. ext4/XFS/NTFS מנהלים יומן של כל שינוי במדפים, כך שהפסקת חשמל לא משאירה את המלאי מבולבל (journaling). ZFS/btrfs אף פעם לא מזיזים קרטון במקום — הם שמים את הגרסה החדשה על מדף ריק ומחליפים את התווית, אז אפשר לצלם את כל המחסן בכל רגע (snapshots) ולכל קרטון יש חותמת נגד זיופים (checksums). NFS ו-SMB הם קו טלפון למחסן בצד השני של העיר."
  ),
  sections: [
    {
      h: t("The big comparison table", "טבלת ההשוואה הגדולה"),
      body: t(
`<p><strong>fs-filesystems-raid</strong> covered how ext4/XFS work inside (inodes, extents, journal). Here is the whole landscape side by side:</p>
<table>
<tr><th>FS</th><th>Max file</th><th>Max volume</th><th>Crash safety</th><th>Snapshots</th><th>Data checksums</th><th>Compression</th><th>Case</th><th>Permissions</th><th>Lives on</th></tr>
<tr><td>FAT32</td><td><strong>4 GiB − 1 B</strong></td><td>2 TiB (Windows formats only ≤32 GB)</td><td>None</td><td>No</td><td>No</td><td>No</td><td>Insensitive</td><td>None</td><td>USB sticks, SD cards, UEFI ESP</td></tr>
<tr><td>exFAT</td><td>16 EiB (theoretical)</td><td>128 PiB</td><td>None (no journal)</td><td>No</td><td>No</td><td>No</td><td>Insensitive</td><td>None</td><td>Big USB drives, SDXC, cameras, Mac↔Windows disks</td></tr>
<tr><td>NTFS</td><td>= volume limit</td><td>16 TiB @4 KiB clusters → 256 TiB @64 KiB → 8 PiB @2 MiB</td><td>Metadata journal ($LogFile)</td><td>Via VSS (OS service)</td><td>No</td><td>Per file (LZNT1)</td><td>Insensitive (per-dir option)</td><td>NTFS ACLs</td><td>Windows clients &amp; servers</td></tr>
<tr><td>ReFS</td><td>35 PB</td><td>35 PB</td><td>Allocate-on-write metadata</td><td>Block cloning, VSS</td><td>Metadata always; data opt-in (integrity streams)</td><td>Dedup (+compression in newer Server)</td><td>Insensitive</td><td>NTFS ACLs</td><td>Hyper-V, Storage Spaces Direct, backup repos, Dev Drive</td></tr>
<tr><td>ext4</td><td>16 TiB</td><td>1 EiB</td><td>Journal (data=ordered)</td><td>No (use LVM)</td><td>Metadata only (metadata_csum)</td><td>No</td><td>Sensitive (casefold opt.)</td><td>POSIX + ACLs</td><td>Ubuntu/Debian default</td></tr>
<tr><td>XFS</td><td>8 EiB</td><td>8 EiB</td><td>Metadata journal</td><td>No (reflink copies yes)</td><td>Metadata (CRC)</td><td>No</td><td>Sensitive</td><td>POSIX + ACLs</td><td>RHEL/Amazon Linux default, big files</td></tr>
<tr><td>btrfs</td><td>16 EiB</td><td>16 EiB</td><td>Copy-on-write</td><td>Yes, subvolumes</td><td>Yes (crc32c/xxhash/sha256/blake2)</td><td>zstd/lzo/zlib</td><td>Sensitive</td><td>POSIX + ACLs</td><td>openSUSE/Fedora desktop, Synology</td></tr>
<tr><td>ZFS</td><td>16 EiB</td><td>Practically unlimited (128-bit)</td><td>Copy-on-write + ZIL</td><td>Yes, plus clones and send/receive</td><td>Yes, every block (fletcher4/sha256)</td><td>lz4/zstd</td><td>Sensitive (configurable)</td><td>POSIX/NFSv4 ACLs</td><td>TrueNAS, Proxmox, FreeBSD, backup servers</td></tr>
<tr><td>APFS</td><td>8 EiB</td><td>8 EiB</td><td>Copy-on-write</td><td>Yes (Time Machine, OS updates)</td><td>Metadata only</td><td>Transparent per file</td><td>Insensitive by default</td><td>POSIX + ACLs</td><td>macOS, iOS</td></tr>
</table>
<p><strong>Journaling vs copy-on-write</strong> is the key split. A journaling FS overwrites blocks in place but first logs metadata changes, so after a crash it replays the log in seconds and the structure is consistent — file <em>contents</em> may still be half-written. A CoW FS never overwrites live data: it writes new blocks elsewhere, then atomically flips a pointer up the tree. The old tree is still intact, so a snapshot is just "keep the old root pointer" — instant and free until data diverges. The price: random overwrites (database pages, VM images) fragment, which is why you set <code>recordsize=16K</code> on ZFS for MySQL or <code>chattr +C</code> (nodatacow) on btrfs VM directories.</p>
<blockquote>💡 Real world: checksums are why ZFS people sleep well. A journaling FS trusts the disk; if the disk returns flipped bits (bit rot, a firmware bug, a bad cable) ext4 hands the garbage to your app. ZFS verifies every block on read, and with a mirror or RAID-Z it silently repairs the bad copy from the good one — <code>zpool status</code> shows the fix in the CKSUM column.</blockquote>`,
`<p>השיעור <strong>fs-filesystems-raid</strong> הסביר איך ext4/XFS עובדים מבפנים (inodes, extents, journal). כאן כל הנוף אחד ליד השני:</p>
<table>
<tr><th>FS</th><th>קובץ מקסימלי</th><th>Volume מקסימלי</th><th>הגנה מקריסה</th><th>Snapshots</th><th>Checksums למידע</th><th>דחיסה</th><th>אותיות גדולות/קטנות</th><th>הרשאות</th><th>איפה חי</th></tr>
<tr><td>FAT32</td><td><strong>4 GiB פחות byte</strong></td><td>2 TiB (פירמוט ב-Windows רק עד 32 GB)</td><td>אין</td><td>לא</td><td>לא</td><td>לא</td><td>Insensitive</td><td>אין</td><td>דיסקים און קי, כרטיסי SD, ה-ESP של UEFI</td></tr>
<tr><td>exFAT</td><td>16 EiB (תיאורטי)</td><td>128 PiB</td><td>אין (בלי journal)</td><td>לא</td><td>לא</td><td>לא</td><td>Insensitive</td><td>אין</td><td>דיסקים חיצוניים גדולים, SDXC, מצלמות, דיסק משותף ל-Mac ול-Windows</td></tr>
<tr><td>NTFS</td><td>= מגבלת ה-volume</td><td>16 TiB ב-clusters של 4 KiB → 256 TiB ב-64 KiB → 8 PiB ב-2 MiB</td><td>Journal ל-metadata ($LogFile)</td><td>דרך VSS (שירות של ה-OS)</td><td>לא</td><td>לכל קובץ (LZNT1)</td><td>Insensitive (אפשרות לכל תיקייה)</td><td>NTFS ACLs</td><td>לקוחות ושרתי Windows</td></tr>
<tr><td>ReFS</td><td>35 PB</td><td>35 PB</td><td>Metadata ב-allocate-on-write</td><td>Block cloning, VSS</td><td>Metadata תמיד; מידע לפי בחירה (integrity streams)</td><td>Dedup (ודחיסה בגרסאות Server חדשות)</td><td>Insensitive</td><td>NTFS ACLs</td><td>Hyper-V, Storage Spaces Direct, repositories של גיבוי, Dev Drive</td></tr>
<tr><td>ext4</td><td>16 TiB</td><td>1 EiB</td><td>Journal (data=ordered)</td><td>לא (דרך LVM)</td><td>רק metadata (metadata_csum)</td><td>לא</td><td>Sensitive (אפשרות casefold)</td><td>POSIX + ACLs</td><td>ברירת המחדל ב-Ubuntu/Debian</td></tr>
<tr><td>XFS</td><td>8 EiB</td><td>8 EiB</td><td>Journal ל-metadata</td><td>לא (העתקות reflink כן)</td><td>Metadata (CRC)</td><td>לא</td><td>Sensitive</td><td>POSIX + ACLs</td><td>ברירת המחדל ב-RHEL/Amazon Linux, קבצים גדולים</td></tr>
<tr><td>btrfs</td><td>16 EiB</td><td>16 EiB</td><td>Copy-on-write</td><td>כן, subvolumes</td><td>כן (crc32c/xxhash/sha256/blake2)</td><td>zstd/lzo/zlib</td><td>Sensitive</td><td>POSIX + ACLs</td><td>Desktop של openSUSE/Fedora, Synology</td></tr>
<tr><td>ZFS</td><td>16 EiB</td><td>כמעט בלי גבול (128-bit)</td><td>Copy-on-write + ZIL</td><td>כן, ועוד clones ו-send/receive</td><td>כן, כל block (fletcher4/sha256)</td><td>lz4/zstd</td><td>Sensitive (ניתן לשינוי)</td><td>POSIX/NFSv4 ACLs</td><td>TrueNAS, Proxmox, FreeBSD, שרתי גיבוי</td></tr>
<tr><td>APFS</td><td>8 EiB</td><td>8 EiB</td><td>Copy-on-write</td><td>כן (Time Machine, עדכוני OS)</td><td>רק metadata</td><td>שקופה לכל קובץ</td><td>Insensitive כברירת מחדל</td><td>POSIX + ACLs</td><td>macOS, iOS</td></tr>
</table>
<p><strong>Journaling מול copy-on-write</strong> זה הפיצול המרכזי. FS עם journal דורס blocks במקום, אבל קודם רושם ביומן את שינויי ה-metadata, כך שאחרי קריסה הוא מריץ את היומן בשניות והמבנה עקבי — ה<em>תוכן</em> של קבצים עדיין יכול להיות חצי כתוב. FS עם CoW אף פעם לא דורס מידע חי: הוא כותב blocks חדשים במקום אחר, ואז מחליף אטומית מצביע במעלה העץ. העץ הישן עדיין שלם, אז snapshot זה פשוט "תשמור את מצביע ה-root הישן" — מיידי ובחינם עד שהמידע מתפצל. המחיר: דריסות אקראיות (pages של DB, images של VM) גורמות ל-fragmentation, ובגלל זה מגדירים <code>recordsize=16K</code> ב-ZFS עבור MySQL או <code>chattr +C</code> (nodatacow) על תיקיות VM ב-btrfs.</p>
<blockquote>💡 מהשטח: checksums הם הסיבה שאנשי ZFS ישנים טוב. FS עם journal סומך על הדיסק; אם הדיסק מחזיר bits הפוכים (bit rot, באג ב-firmware, כבל תקול) ext4 מגיש את הזבל לאפליקציה. ZFS מאמת כל block בקריאה, ועם mirror או RAID-Z הוא מתקן בשקט את העותק הפגום מהעותק התקין — <code>zpool status</code> מראה את התיקון בעמודת CKSUM.</blockquote>`
      )
    },
    {
      h: t("Windows side: NTFS internals (MFT, ADS, ACLs, chkdsk) and ReFS", "הצד של Windows: NTFS מבפנים (MFT, ADS, ACLs, chkdsk) ו-ReFS"),
      body: t(
`<p>In NTFS <em>everything</em> is a file, including the metadata. The heart is the <strong>Master File Table ($MFT)</strong>: one record (usually 1 KiB) per file or directory, holding its attributes — name, timestamps, security descriptor, and the data itself. Files smaller than ~700 bytes are <strong>resident</strong>: their content lives inside the MFT record and takes no cluster at all. Bigger files store <em>runs</em> (extents) pointing to clusters. Other system files: <code>$LogFile</code> (the journal), <code>$Bitmap</code> (free clusters), <code>$UsnJrnl</code> (change journal that backup and antivirus tools read).</p>
<pre>C:\&gt; fsutil fsinfo ntfsinfo C:
NTFS Version   :                  3.1
Bytes Per Cluster :               4096
Bytes Per FileRecord Segment    : 1024
Mft Valid Data Length :           1.25 GB
Mft Zone Size  :                  200.00 MB

C:\&gt; dir /r C:\Users\me\Downloads\setup.exe
     2,481,152 setup.exe
            26 setup.exe:Zone.Identifier:$DATA

PS&gt; Get-Content .\setup.exe -Stream Zone.Identifier
[ZoneTransfer]
ZoneId=3
HostUrl=https://example.com/setup.exe</pre>
<p>That second entry is an <strong>Alternate Data Stream (ADS)</strong>: a file can carry extra named data streams that <code>dir</code> and Explorer don't show by size. Windows uses one for the "Mark of the Web" (<code>ZoneId=3</code> = Internet → SmartScreen warning). Malware has hidden payloads in streams like <code>notes.txt:evil.exe</code>. ADS are lost when you copy to FAT32/exFAT or upload over most protocols.</p>
<p><strong>Permissions</strong> are ACLs: an ordered list of allow/deny entries per user/group with fine rights (read, write, modify, delete, change permissions, take ownership) and inheritance down the tree. Much richer than POSIX <code>rwx</code> for owner/group/other:</p>
<pre>C:\&gt; icacls D:\Shares\Finance
D:\Shares\Finance CORP\Finance-RW:(OI)(CI)(M)
                  CORP\Auditors:(OI)(CI)(RX)
                  BUILTIN\Administrators:(OI)(CI)(F)
C:\&gt; icacls D:\Shares\Finance /grant "CORP\Interns:(OI)(CI)(RX)"</pre>
<p><code>(OI)(CI)</code> = inherited by files and subfolders; <code>M</code> modify, <code>RX</code> read &amp; execute, <code>F</code> full control.</p>
<p><strong>chkdsk</strong> is NTFS's fsck. Modern Windows does self-healing and online scanning, so you rarely need the old offline marathon:</p>
<pre>chkdsk C: /scan        &lt;- online scan, volume stays in use
chkdsk C: /spotfix     &lt;- fix the issues found, seconds of downtime
chkdsk D: /f           &lt;- full offline fix (dismounts D:)
chkdsk D: /r           &lt;- /f + scan every sector for bad blocks (hours on big HDDs)</pre>
<p><strong>ReFS</strong> (Resilient FS) is Microsoft's answer to ZFS-style integrity: checksummed metadata, optional integrity streams for data, automatic repair from a Storage Spaces mirror, and <strong>block cloning</strong> — copying a 1 TB VHDX or building a Veeam synthetic full in seconds by sharing blocks. Limits: you can't boot Windows Server from it, and it lacks NTFS features like EFS and disk quotas. Use it for Hyper-V/S2D volumes and backup repositories; keep NTFS for OS and general file servers.</p>
<blockquote>⚠️ Production tip: a 4 KiB-cluster NTFS volume can't grow past 16 TiB — <code>2^32 clusters × 4 KiB</code>. If a file server volume might ever get big, format with 64 KiB clusters from day one; you can't change cluster size without reformatting.</blockquote>`,
`<p>ב-NTFS <em>הכול</em> הוא קובץ, כולל ה-metadata. הלב הוא <strong>Master File Table ($MFT)</strong>: רשומה אחת (בדרך כלל 1 KiB) לכל קובץ או תיקייה, עם ה-attributes שלו — שם, חותמות זמן, security descriptor, והמידע עצמו. קבצים קטנים מ-~700 bytes הם <strong>resident</strong>: התוכן שלהם יושב בתוך רשומת ה-MFT ולא תופס cluster בכלל. קבצים גדולים יותר שומרים <em>runs</em> (extents) שמצביעים ל-clusters. קבצי מערכת נוספים: <code>$LogFile</code> (ה-journal), <code>$Bitmap</code> (clusters פנויים), <code>$UsnJrnl</code> (יומן שינויים שכלי גיבוי ואנטי-וירוס קוראים).</p>
<pre>C:\&gt; fsutil fsinfo ntfsinfo C:
NTFS Version   :                  3.1
Bytes Per Cluster :               4096
Bytes Per FileRecord Segment    : 1024
Mft Valid Data Length :           1.25 GB
Mft Zone Size  :                  200.00 MB

C:\&gt; dir /r C:\Users\me\Downloads\setup.exe
     2,481,152 setup.exe
            26 setup.exe:Zone.Identifier:$DATA

PS&gt; Get-Content .\setup.exe -Stream Zone.Identifier
[ZoneTransfer]
ZoneId=3
HostUrl=https://example.com/setup.exe</pre>
<p>השורה השנייה היא <strong>Alternate Data Stream (ADS)</strong>: לקובץ יכולים להיות streams נוספים עם שם, ש-<code>dir</code> וה-Explorer לא מראים בגודל. Windows משתמש באחד כזה בשביל ה-"Mark of the Web" (<code>ZoneId=3</code> = Internet → אזהרת SmartScreen). Malware כבר החביא payloads ב-streams כמו <code>notes.txt:evil.exe</code>. ה-ADS הולכים לאיבוד כשמעתיקים ל-FAT32/exFAT או מעלים ברוב הפרוטוקולים.</p>
<p><strong>הרשאות</strong> הן ACLs: רשימה מסודרת של כניסות allow/deny לכל משתמש/קבוצה, עם זכויות מפורטות (read, write, modify, delete, שינוי הרשאות, take ownership) והורשה במורד העץ. הרבה יותר עשיר מ-<code>rwx</code> של POSIX ל-owner/group/other:</p>
<pre>C:\&gt; icacls D:\Shares\Finance
D:\Shares\Finance CORP\Finance-RW:(OI)(CI)(M)
                  CORP\Auditors:(OI)(CI)(RX)
                  BUILTIN\Administrators:(OI)(CI)(F)
C:\&gt; icacls D:\Shares\Finance /grant "CORP\Interns:(OI)(CI)(RX)"</pre>
<p><code>(OI)(CI)</code> = עובר בהורשה לקבצים ולתתי-תיקיות; <code>M</code> זה modify, <code>RX</code> קריאה והרצה, <code>F</code> שליטה מלאה.</p>
<p><strong>chkdsk</strong> הוא ה-fsck של NTFS. Windows מודרני עושה self-healing וסריקה online, אז כמעט לא צריך את המרתון הישן במצב offline:</p>
<pre>chkdsk C: /scan        &lt;- online scan, volume stays in use
chkdsk C: /spotfix     &lt;- fix the issues found, seconds of downtime
chkdsk D: /f           &lt;- full offline fix (dismounts D:)
chkdsk D: /r           &lt;- /f + scan every sector for bad blocks (hours on big HDDs)</pre>
<p><strong>ReFS</strong> (Resilient FS) היא התשובה של Microsoft לאמינות בסגנון ZFS: metadata עם checksums, integrity streams אופציונליים למידע, תיקון אוטומטי מ-mirror של Storage Spaces, ו-<strong>block cloning</strong> — העתקה של VHDX של 1 TB או בניית synthetic full ב-Veeam בשניות ע"י שיתוף blocks. מגבלות: אי אפשר לעשות boot ל-Windows Server ממנו, וחסרות בו יכולות של NTFS כמו EFS ו-disk quotas. משתמשים בו ל-volumes של Hyper-V/S2D ול-repositories של גיבוי; משאירים NTFS ל-OS ולשרתי קבצים רגילים.</p>
<blockquote>⚠️ טיפ לפרודקשן: volume של NTFS עם clusters של 4 KiB לא יכול לגדול מעבר ל-16 TiB — <code>2^32 clusters × 4 KiB</code>. אם volume של שרת קבצים עלול אי פעם לגדול, תפרמט עם clusters של 64 KiB מהיום הראשון; אי אפשר לשנות cluster size בלי פירמוט מחדש.</blockquote>`
      )
    },
    {
      h: t("Removable media and cross-platform: FAT32, exFAT, and mounting NTFS on Linux", "מדיה נשלפת ובין מערכות: FAT32, exFAT, ו-mount של NTFS בלינוקס"),
      body: t(
`<p><strong>FAT32</strong> survives because every device on earth reads it — TVs, car stereos, BIOS/UEFI (the EFI System Partition <em>must</em> be FAT). Its fatal limit: the file size field is 32 bits, so the largest file is <strong>4 GiB − 1 byte (4,294,967,295 bytes)</strong>. Copying a 6 GB ISO or a 4K movie to a FAT32 stick fails with "file too large for the destination file system" even with 50 GB free. Fixes: format as <strong>exFAT</strong> (no practical file limit, readable by Windows, macOS and Linux 5.7+ natively), or split the file.</p>
<pre>$ lsblk -f /dev/sdb
NAME   FSTYPE LABEL   UUID      MOUNTPOINTS
sdb1   vfat   KINGSTON 1A2B-3C4D /media/me/KINGSTON
$ cp ubuntu-24.04-desktop-amd64.iso /media/me/KINGSTON/
cp: error writing '/media/me/KINGSTON/ubuntu-24.04-desktop-amd64.iso': File too large
$ sudo umount /dev/sdb1 &amp;&amp; sudo mkfs.exfat -L KINGSTON /dev/sdb1</pre>
<p>Neither FAT32 nor exFAT has a journal or permissions: yank the stick mid-write and you can corrupt the allocation table; any user on any OS can read everything. Fine for transport, wrong for anything you care about.</p>
<p><strong>Mounting NTFS on Linux</strong> (rescuing a Windows disk, dual boot, a USB drive from a Windows colleague):</p>
<pre># Kernel driver (Linux 5.15+), fast, read-write
$ sudo mount -t ntfs3 -o uid=1000,gid=1000,iocharset=utf8 /dev/sdc2 /mnt/win
# Older systems: FUSE driver
$ sudo mount -t ntfs-3g /dev/sdc2 /mnt/win
# "The disk contains an unclean file system (0, 0)" / "hibernated":
$ sudo mount -t ntfs3 -o ro /dev/sdc2 /mnt/win       # read-only is always safe
$ sudo ntfsfix -d /dev/sdc2                           # clears dirty flag; real repair = chkdsk on Windows</pre>
<p>Windows "Fast Startup" is hibernation in disguise: the NTFS volume is left mounted-and-dirty, and writing to it from Linux can corrupt it. Disable Fast Startup on dual-boot machines, or mount read-only.</p>
<blockquote>💡 Real world: case sensitivity bites cross-platform teams. A git repo with <code>Readme.md</code> and <code>README.md</code> works on Linux (ext4 is case-sensitive) but breaks on a default macOS (APFS case-insensitive) or Windows checkout — one file silently "replaces" the other. Same for Docker builds copying from a Mac: <code>import "./Utils"</code> works locally and fails in the Linux CI.</blockquote>`,
`<p><strong>FAT32</strong> שורד כי כל מכשיר בעולם קורא אותו — טלוויזיות, מערכות שמע ברכב, BIOS/UEFI (ה-EFI System Partition <em>חייבת</em> להיות FAT). המגבלה הקטלנית שלו: שדה גודל הקובץ הוא 32 bits, אז הקובץ הגדול ביותר הוא <strong>4 GiB פחות byte אחד (4,294,967,295 bytes)</strong>. העתקה של ISO של 6 GB או סרט 4K לדיסק און קי עם FAT32 נכשלת עם "file too large for the destination file system" גם כשיש 50 GB פנויים. הפתרונות: לפרמט ל-<strong>exFAT</strong> (בלי מגבלת קובץ מעשית, נקרא באופן מובנה ב-Windows, ב-macOS ובלינוקס מ-5.7), או לפצל את הקובץ.</p>
<pre>$ lsblk -f /dev/sdb
NAME   FSTYPE LABEL   UUID      MOUNTPOINTS
sdb1   vfat   KINGSTON 1A2B-3C4D /media/me/KINGSTON
$ cp ubuntu-24.04-desktop-amd64.iso /media/me/KINGSTON/
cp: error writing '/media/me/KINGSTON/ubuntu-24.04-desktop-amd64.iso': File too large
$ sudo umount /dev/sdb1 &amp;&amp; sudo mkfs.exfat -L KINGSTON /dev/sdb1</pre>
<p>ל-FAT32 ול-exFAT אין journal ואין הרשאות: תשלוף את הדיסק באמצע כתיבה ואתה יכול להשחית את טבלת ההקצאה; כל משתמש בכל OS קורא הכול. בסדר להעברה, לא נכון לשום דבר שחשוב לך.</p>
<p><strong>Mount של NTFS בלינוקס</strong> (חילוץ דיסק של Windows, dual boot, דיסק USB מעמית עם Windows):</p>
<pre># Kernel driver (Linux 5.15+), fast, read-write
$ sudo mount -t ntfs3 -o uid=1000,gid=1000,iocharset=utf8 /dev/sdc2 /mnt/win
# Older systems: FUSE driver
$ sudo mount -t ntfs-3g /dev/sdc2 /mnt/win
# "The disk contains an unclean file system (0, 0)" / "hibernated":
$ sudo mount -t ntfs3 -o ro /dev/sdc2 /mnt/win       # read-only is always safe
$ sudo ntfsfix -d /dev/sdc2                           # clears dirty flag; real repair = chkdsk on Windows</pre>
<p>ה-"Fast Startup" של Windows הוא בעצם hibernation בתחפושת: ה-volume של NTFS נשאר mounted ומלוכלך, וכתיבה אליו מלינוקס יכולה להשחית אותו. תכבה Fast Startup במכונות dual boot, או תעשה mount לקריאה בלבד.</p>
<blockquote>💡 מהשטח: case sensitivity נושך צוותים שעובדים על כמה מערכות. Repo של git עם <code>Readme.md</code> וגם <code>README.md</code> עובד בלינוקס (ext4 מבחין בין אותיות) אבל נשבר ב-checkout על macOS ברירת מחדל (APFS לא מבחין) או על Windows — קובץ אחד "מחליף" את השני בשקט. אותו דבר ב-Docker build שמעתיק מ-Mac: <code>import "./Utils"</code> עובד מקומית ונכשל ב-CI של לינוקס.</blockquote>`
      )
    },
    {
      h: t("Network filesystems: NFS, SMB/CIFS and the cloud file services", "Filesystems ברשת: NFS, SMB/CIFS ושירותי הקבצים בענן"),
      body: t(
`<table>
<tr><th></th><th>NFSv3</th><th>NFSv4.x</th><th>SMB 3.x (CIFS = old SMB1 dialect)</th></tr>
<tr><td>Home turf</td><td>Unix/Linux</td><td>Unix/Linux, cloud file services</td><td>Windows, macOS, NAS; Linux via cifs</td></tr>
<tr><td>State</td><td>Stateless server (locks via separate NLM)</td><td>Stateful: opens, locks, leases, delegations</td><td>Stateful sessions, oplocks/leases</td></tr>
<tr><td>Ports</td><td>2049 + rpcbind 111 + mountd/lockd (dynamic)</td><td>Just TCP 2049</td><td>TCP 445</td></tr>
<tr><td>Auth</td><td>AUTH_SYS: <strong>trusts the client's UID</strong></td><td>AUTH_SYS or Kerberos (krb5/krb5i/krb5p)</td><td>NTLM / Kerberos via Active Directory</td></tr>
<tr><td>Permissions</td><td>POSIX mode bits</td><td>POSIX + NFSv4 ACLs</td><td>NTFS ACLs</td></tr>
<tr><td>Encryption in transit</td><td>No</td><td>krb5p, or TLS (EFS uses stunnel/efs-utils)</td><td>SMB 3 encryption (AES-GCM)</td></tr>
</table>
<p>With NFS AUTH_SYS, the server believes whatever UID the client claims. Root on any client that can reach the export = can read anyone's files (except root itself, which <code>root_squash</code> maps to <code>nobody</code>). So restrict exports to specific subnets and use Kerberos where it matters. <strong>SMB1</strong> must be dead everywhere — EternalBlue/WannaCry (2017) spread through it.</p>
<pre># NFS (EFS-style options)
$ sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport \
    fs-0abc123.efs.eu-west-1.amazonaws.com:/ /mnt/efs
# SMB share from Linux
$ cat /root/.smbcred
username=svc-backup
password=********
domain=CORP
$ sudo mount -t cifs //fs01.corp.local/finance /mnt/finance \
    -o credentials=/root/.smbcred,vers=3.1.1,seal,uid=1000,gid=1000,file_mode=0640,dir_mode=0750
# /etc/fstab — _netdev waits for network, nofail keeps boot alive
//fs01.corp.local/finance  /mnt/finance  cifs  credentials=/root/.smbcred,vers=3.1.1,_netdev,nofail  0 0</pre>
<p><code>hard</code> means a lost server makes processes wait (state D) instead of getting IO errors — safer for data, but a dead NFS server can hang <code>df</code> and your monitoring. Never use <code>soft</code> for anything that writes.</p>
<table>
<tr><th>Need</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>Linux shared FS (NFS)</td><td>EFS (NFSv4.1, multi-AZ, elastic)</td><td>Azure Files NFS (premium), Azure NetApp Files</td><td>Filestore</td></tr>
<tr><td>Windows shares (SMB + AD)</td><td>FSx for Windows File Server</td><td>Azure Files (SMB)</td><td>Google Cloud NetApp Volumes (SMB)</td></tr>
<tr><td>HPC / ML scratch</td><td>FSx for Lustre</td><td>Azure Managed Lustre</td><td>Managed Lustre / Parallelstore</td></tr>
<tr><td>NFS + SMB + iSCSI, snapshots, enterprise</td><td>FSx for NetApp ONTAP, FSx for OpenZFS</td><td>Azure NetApp Files</td><td>Google Cloud NetApp Volumes</td></tr>
</table>
<blockquote>⚠️ Production tip: shared network filesystems are slow at metadata. <code>npm install</code>, <code>git status</code> or a PHP app with 50,000 small files over EFS can be 10-50× slower than local disk because every <code>stat()</code> is a network round trip. Put code and dependencies in the image, keep NFS for shared data (uploads, models), and use <code>nconnect=</code> plus larger files when throughput matters.</blockquote>`,
`<table>
<tr><th></th><th>NFSv3</th><th>NFSv4.x</th><th>SMB 3.x (CIFS = הדיאלקט הישן SMB1)</th></tr>
<tr><td>מגרש ביתי</td><td>Unix/Linux</td><td>Unix/Linux, שירותי קבצים בענן</td><td>Windows, macOS, NAS; לינוקס דרך cifs</td></tr>
<tr><td>State</td><td>שרת stateless (נעילות דרך NLM נפרד)</td><td>Stateful: opens, locks, leases, delegations</td><td>Sessions עם state, oplocks/leases</td></tr>
<tr><td>פורטים</td><td>2049 ועוד rpcbind 111 ו-mountd/lockd (דינמיים)</td><td>רק TCP 2049</td><td>TCP 445</td></tr>
<tr><td>אימות</td><td>AUTH_SYS: <strong>סומך על ה-UID שהלקוח מצהיר</strong></td><td>AUTH_SYS או Kerberos (krb5/krb5i/krb5p)</td><td>NTLM / Kerberos דרך Active Directory</td></tr>
<tr><td>הרשאות</td><td>POSIX mode bits</td><td>POSIX ועוד NFSv4 ACLs</td><td>NTFS ACLs</td></tr>
<tr><td>הצפנה בתעבורה</td><td>אין</td><td>krb5p, או TLS (ב-EFS דרך stunnel/efs-utils)</td><td>הצפנת SMB 3 (AES-GCM)</td></tr>
</table>
<p>עם AUTH_SYS ב-NFS, השרת מאמין לכל UID שהלקוח טוען. root על כל לקוח שמגיע ל-export = יכול לקרוא קבצים של כולם (חוץ מ-root עצמו, ש-<code>root_squash</code> ממפה ל-<code>nobody</code>). לכן מגבילים exports ל-subnets ספציפיים ומשתמשים ב-Kerberos איפה שזה חשוב. <strong>SMB1</strong> חייב להיות מת בכל מקום — EternalBlue/WannaCry (2017) התפשטו דרכו.</p>
<pre># NFS (EFS-style options)
$ sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport \
    fs-0abc123.efs.eu-west-1.amazonaws.com:/ /mnt/efs
# SMB share from Linux
$ cat /root/.smbcred
username=svc-backup
password=********
domain=CORP
$ sudo mount -t cifs //fs01.corp.local/finance /mnt/finance \
    -o credentials=/root/.smbcred,vers=3.1.1,seal,uid=1000,gid=1000,file_mode=0640,dir_mode=0750
# /etc/fstab — _netdev waits for network, nofail keeps boot alive
//fs01.corp.local/finance  /mnt/finance  cifs  credentials=/root/.smbcred,vers=3.1.1,_netdev,nofail  0 0</pre>
<p><code>hard</code> אומר ששרת שנעלם גורם לתהליכים לחכות (state D) במקום לקבל שגיאות IO — בטוח יותר למידע, אבל שרת NFS מת יכול לתקוע את <code>df</code> ואת הניטור שלך. אף פעם אל תשתמש ב-<code>soft</code> לשום דבר שכותב.</p>
<table>
<tr><th>צורך</th><th>AWS</th><th>Azure</th><th>GCP</th></tr>
<tr><td>FS משותף ללינוקס (NFS)</td><td>EFS (NFSv4.1, multi-AZ, אלסטי)</td><td>Azure Files NFS (premium), Azure NetApp Files</td><td>Filestore</td></tr>
<tr><td>Shares של Windows (SMB + AD)</td><td>FSx for Windows File Server</td><td>Azure Files (SMB)</td><td>Google Cloud NetApp Volumes (SMB)</td></tr>
<tr><td>HPC / scratch ל-ML</td><td>FSx for Lustre</td><td>Azure Managed Lustre</td><td>Managed Lustre / Parallelstore</td></tr>
<tr><td>NFS + SMB + iSCSI, snapshots, enterprise</td><td>FSx for NetApp ONTAP, FSx for OpenZFS</td><td>Azure NetApp Files</td><td>Google Cloud NetApp Volumes</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: filesystems משותפים ברשת איטיים ב-metadata. <code>npm install</code>, <code>git status</code> או אפליקציית PHP עם 50,000 קבצים קטנים על EFS יכולים להיות איטיים פי 10-50 מדיסק מקומי, כי כל <code>stat()</code> הוא round trip ברשת. תשים קוד ו-dependencies בתוך ה-image, תשאיר NFS למידע משותף (uploads, מודלים), ותשתמש ב-<code>nconnect=</code> ובקבצים גדולים כשה-throughput חשוב.</blockquote>`
      )
    },
    {
      h: t("Choosing one: a decision guide", "איך בוחרים: מדריך החלטה"),
      body: t(
`<table>
<tr><th>Situation</th><th>Pick</th><th>Why</th></tr>
<tr><td>Linux server, general purpose, small/medium volumes</td><td>ext4</td><td>Boring, battle-tested, can shrink offline, every tool knows it</td></tr>
<tr><td>Linux, big files, parallel IO, large volumes, RHEL family</td><td>XFS</td><td>Scales with allocation groups, dynamic inodes; just never needs to shrink</td></tr>
<tr><td>Database on Linux</td><td>XFS or ext4 (noatime)</td><td>Predictable latency; the DB does its own checksums and WAL</td></tr>
<tr><td>NAS / backup server / you want snapshots + bit-rot protection</td><td>ZFS (RAID-Z2/mirrors)</td><td>End-to-end checksums, self-heal, snapshots, send/receive replication</td></tr>
<tr><td>Linux desktop with rollback on updates</td><td>btrfs</td><td>Cheap subvolume snapshots (snapper); avoid its RAID 5/6</td></tr>
<tr><td>Windows server / file shares</td><td>NTFS (64 KiB clusters on data volumes)</td><td>ACLs, AD integration, every Windows tool</td></tr>
<tr><td>Hyper-V, S2D, Veeam repository</td><td>ReFS</td><td>Block cloning, integrity streams</td></tr>
<tr><td>USB stick shared across OSes, files &gt; 4 GiB</td><td>exFAT</td><td>Universal, no 4 GiB limit</td></tr>
<tr><td>UEFI boot partition, ancient devices</td><td>FAT32</td><td>Required by the spec / only thing they read</td></tr>
<tr><td>Kubernetes pods sharing files across nodes</td><td>EFS / Azure Files / Filestore via CSI (RWX)</td><td>Block volumes are RWO — one node at a time</td></tr>
</table>
<p>Check what you have:</p>
<pre>$ df -Th
Filesystem     Type   Size  Used Avail Use% Mounted on
/dev/nvme0n1p1 xfs     50G   12G   39G  24% /
/dev/nvme1n1   ext4   492G  201G  266G  44% /var/lib/postgresql
fs-0abc.efs... nfs4   8.0E  1.2T  8.0E   1% /mnt/efs
//fs01/finance cifs   2.0T  1.1T  0.9T  55% /mnt/finance
$ findmnt -no OPTIONS /var/lib/postgresql
rw,noatime,errors=remount-ro
$ sudo zpool status -x
all pools are healthy</pre>
<p>Note EFS reports 8.0 EiB — it's elastic, so <code>df</code> on it is meaningless for capacity alerts; alert on cost/size metrics instead. And <code>errors=remount-ro</code> on ext4 means a detected corruption flips the FS to read-only: your app will start failing writes, which is the signal to check <code>dmesg</code>.</p>`,
`<table>
<tr><th>מצב</th><th>בחירה</th><th>למה</th></tr>
<tr><td>שרת לינוקס, שימוש כללי, volumes קטנים/בינוניים</td><td>ext4</td><td>משעמם, מוכח בקרב, אפשר לכווץ offline, כל כלי מכיר אותו</td></tr>
<tr><td>לינוקס, קבצים גדולים, IO מקבילי, volumes גדולים, משפחת RHEL</td><td>XFS</td><td>גדל עם allocation groups, inodes דינמיים; רק שלעולם לא תצטרך לכווץ</td></tr>
<tr><td>Database על לינוקס</td><td>XFS או ext4 (noatime)</td><td>Latency צפוי; ה-DB עושה checksums ו-WAL בעצמו</td></tr>
<tr><td>NAS / שרת גיבוי / רוצים snapshots והגנה מ-bit rot</td><td>ZFS (RAID-Z2/mirrors)</td><td>Checksums מקצה לקצה, ריפוי עצמי, snapshots, שכפול עם send/receive</td></tr>
<tr><td>Desktop לינוקס עם rollback לעדכונים</td><td>btrfs</td><td>Snapshots זולים של subvolumes (snapper); להתרחק מ-RAID 5/6 שלו</td></tr>
<tr><td>שרת Windows / shares של קבצים</td><td>NTFS (clusters של 64 KiB ב-volumes של מידע)</td><td>ACLs, אינטגרציה עם AD, כל כלי של Windows</td></tr>
<tr><td>Hyper-V, S2D, repository של Veeam</td><td>ReFS</td><td>Block cloning, integrity streams</td></tr>
<tr><td>דיסק און קי שעובר בין מערכות, קבצים מעל 4 GiB</td><td>exFAT</td><td>אוניברסלי, בלי מגבלת 4 GiB</td></tr>
<tr><td>מחיצת boot של UEFI, מכשירים עתיקים</td><td>FAT32</td><td>נדרש לפי התקן / הדבר היחיד שהם קוראים</td></tr>
<tr><td>Pods ב-Kubernetes שחולקים קבצים בין nodes</td><td>EFS / Azure Files / Filestore דרך CSI (RWX)</td><td>Block volumes הם RWO — node אחד בכל פעם</td></tr>
</table>
<p>לבדוק מה יש לך:</p>
<pre>$ df -Th
Filesystem     Type   Size  Used Avail Use% Mounted on
/dev/nvme0n1p1 xfs     50G   12G   39G  24% /
/dev/nvme1n1   ext4   492G  201G  266G  44% /var/lib/postgresql
fs-0abc.efs... nfs4   8.0E  1.2T  8.0E   1% /mnt/efs
//fs01/finance cifs   2.0T  1.1T  0.9T  55% /mnt/finance
$ findmnt -no OPTIONS /var/lib/postgresql
rw,noatime,errors=remount-ro
$ sudo zpool status -x
all pools are healthy</pre>
<p>שים לב ש-EFS מדווח 8.0 EiB — הוא אלסטי, אז <code>df</code> עליו חסר משמעות להתראות נפח; תתריע על מדדי עלות/גודל במקום. ו-<code>errors=remount-ro</code> ב-ext4 אומר שהשחתה שזוהתה מעבירה את ה-FS לקריאה בלבד: האפליקציה תתחיל להיכשל בכתיבות, וזה הסימן לבדוק את <code>dmesg</code>.</p>`
      )
    }
  ],
  diagram: `JOURNALING (ext4, XFS, NTFS)                 COPY-ON-WRITE (ZFS, btrfs, APFS, ReFS)
 1. write intent -> journal                     1. write new data block D'  (old D untouched)
 2. overwrite blocks in place                   2. write new parent pointing to D'
 3. mark journal entry done                     3. atomically swap root:  root_old -> root_new
 crash? replay journal (seconds)                crash? old root still valid. snapshot = keep root_old

 FAT32 file size field: 32 bits -> max 2^32 - 1 bytes = 4 GiB - 1

 Local FS:   app -> syscall -> FS -> block device                      (~0.1 ms on NVMe)
 Network FS: app -> syscall -> NFS/SMB client -> TCP 2049/445 -> server FS -> disk   (+0.5-5 ms per op)`,
  handsOn: [
    { cmd: "df -Th && lsblk -f", what: t("See every mounted filesystem type, size and UUID on the machine.", "רואה את סוג, גודל ו-UUID של כל filesystem שמחובר למכונה.") },
    { cmd: "truncate -s 5G big.bin && cp big.bin /media/$USER/USBSTICK/", what: t("Reproduce the FAT32 4 GiB limit on a FAT-formatted stick: 'File too large'.", "משחזר את מגבלת ה-4 GiB של FAT32 על דיסק און קי מפורמט FAT: 'File too large'.") },
    { cmd: "Get-Item .\\setup.exe -Stream * ; icacls C:\\Data", what: t("On Windows (PowerShell): list a file's alternate data streams and the folder's ACL.", "ב-Windows (PowerShell): מציג את ה-alternate data streams של קובץ ואת ה-ACL של תיקייה.") },
    { cmd: "sudo mount -t cifs //server/share /mnt/share -o credentials=/root/.smbcred,vers=3.1.1 && findmnt /mnt/share", what: t("Mount an SMB share from Linux with SMB 3.1.1 and check the active mount options.", "עושה mount ל-share של SMB מלינוקס עם SMB 3.1.1 ובודק את אפשרויות ה-mount הפעילות.") },
    { cmd: "nfsstat -m && mountstats /mnt/efs | head -40", what: t("Inspect NFS mount options and per-operation latency (GETATTR/LOOKUP counts show metadata pain).", "בודק אפשרויות mount של NFS ו-latency לכל פעולה (כמויות GETATTR/LOOKUP חושפות את כאב ה-metadata).") }
  ],
  mnemonic: t(
    "Journal = diary before you edit; CoW = never erase, just re-point. FAT32 = 4 GiB door. NFS trusts your UID, SMB trusts your AD.",
    "Journal = יומן לפני שעורכים; CoW = אף פעם לא מוחקים, רק מפנים מחדש. FAT32 = דלת של 4 GiB. NFS סומך על ה-UID שלך, SMB סומך על ה-AD שלך."
  ),
  pitfalls: [
    t("Formatting a big external drive as FAT32 for compatibility, then failing on the first file over 4 GiB. Use exFAT.", "לפרמט דיסק חיצוני גדול ל-FAT32 בשביל תאימות, ואז להיכשל בקובץ הראשון מעל 4 GiB. תשתמש ב-exFAT."),
    t("Creating an NTFS data volume with 4 KiB clusters that later needs to grow beyond 16 TiB — you must reformat.", "ליצור volume מידע של NTFS עם clusters של 4 KiB שאחר כך צריך לגדול מעבר ל-16 TiB — חייבים לפרמט מחדש."),
    t("Exporting NFS with AUTH_SYS to a wide network: any root on any client can impersonate any UID.", "לעשות export של NFS עם AUTH_SYS לרשת רחבה: כל root על כל לקוח יכול להתחזות לכל UID."),
    t("Running a database or node_modules-heavy app on NFS/EFS and blaming the code for slowness — metadata round trips dominate.", "להריץ database או אפליקציה עמוסת node_modules על NFS/EFS ולהאשים את הקוד באיטיות — ה-round trips של ה-metadata שולטים.")
  ],
  interview: [
    { q: t("What's the practical difference between a journaling filesystem and a copy-on-write filesystem?", "מה ההבדל המעשי בין filesystem עם journal ל-filesystem עם copy-on-write?"),
      a: t("Journaling (ext4, XFS, NTFS) overwrites in place but logs metadata changes first, so crash recovery is a fast replay and the structure stays consistent. CoW (ZFS, btrfs, APFS) writes new blocks and atomically swaps a root pointer, giving free snapshots and room for per-block checksums, at the cost of fragmentation under random overwrites and more RAM/CPU.", "Journaling (ext4, XFS, NTFS) דורס במקום אבל קודם רושם את שינויי ה-metadata, כך שהתאוששות מקריסה היא replay מהיר והמבנה נשאר עקבי. CoW (ZFS, btrfs, APFS) כותב blocks חדשים ומחליף אטומית מצביע root, מה שנותן snapshots בחינם ומקום ל-checksums לכל block, במחיר fragmentation בדריסות אקראיות ויותר RAM/CPU.") },
    { q: t("A user can't copy a 5 GB file to a USB stick with 30 GB free. Why, and what do you do?", "משתמש לא מצליח להעתיק קובץ של 5 GB לדיסק און קי עם 30 GB פנויים. למה, ומה עושים?"),
      a: t("The stick is FAT32, whose 32-bit size field caps a file at 4 GiB − 1 byte. Reformat it as exFAT (readable on Windows, macOS, modern Linux) or NTFS if only Windows matters, or split the file.", "הדיסק מפורמט FAT32, ששדה הגודל שלו (32 bits) מגביל קובץ ל-4 GiB פחות byte. מפרמטים ל-exFAT (נקרא ב-Windows, ב-macOS ובלינוקס מודרני) או ל-NTFS אם רק Windows חשוב, או מפצלים את הקובץ.") },
    { q: t("When would you choose SMB over NFS for a shared file system?", "מתי תבחר SMB על פני NFS ל-filesystem משותף?"),
      a: t("When clients are Windows or the org authenticates with Active Directory and needs NTFS ACLs — SMB 3 gives Kerberos/AD auth, per-user ACLs and encryption out of the box (FSx for Windows, Azure Files). NFSv4.1 fits Linux fleets and Kubernetes RWX volumes (EFS, Filestore), ideally with Kerberos or network restrictions.", "כשהלקוחות הם Windows או שהארגון מאמת דרך Active Directory וצריך NTFS ACLs — SMB 3 נותן אימות Kerberos/AD, ACLs לכל משתמש והצפנה מהקופסה (FSx for Windows, Azure Files). NFSv4.1 מתאים לצי של לינוקס ול-volumes מסוג RWX ב-Kubernetes (EFS, Filestore), עדיף עם Kerberos או הגבלות רשת.") }
  ],
  quiz: [
    { q: t("What is the largest single file FAT32 can store?", "מה הקובץ הגדול ביותר ש-FAT32 יכול לשמור?"),
      options: [t("2 GiB", "2 GiB"), t("4 GiB − 1 byte", "4 GiB פחות byte"), t("16 TiB", "16 TiB"), t("No practical limit", "אין מגבלה מעשית")],
      answer: 1,
      explain: t("The directory entry stores file size in 32 bits: 2^32 − 1 = 4,294,967,295 bytes.", "רשומת התיקייה שומרת את גודל הקובץ ב-32 bits: 2^32 פחות 1 = 4,294,967,295 bytes.") },
    { q: t("Which filesystems verify checksums on user data blocks by default?", "אילו filesystems מאמתים checksums על blocks של מידע כברירת מחדל?"),
      options: [t("ext4 and XFS", "ext4 ו-XFS"), t("NTFS and exFAT", "NTFS ו-exFAT"), t("ZFS and btrfs", "ZFS ו-btrfs"), t("APFS and FAT32", "APFS ו-FAT32")],
      answer: 2,
      explain: t("ext4/XFS/APFS checksum metadata only; NTFS/FAT none. ZFS and btrfs checksum every block and can self-heal from redundancy. (ReFS does data only if integrity streams are on.)", "ext4/XFS/APFS עושים checksum רק ל-metadata; ל-NTFS/FAT אין בכלל. ZFS ו-btrfs עושים checksum לכל block ויכולים לרפא את עצמם מיתירות. (ReFS עושה למידע רק אם integrity streams מופעלים.)") },
    { q: t("What does 'setup.exe:Zone.Identifier' in 'dir /r' output represent?", "מה מייצג 'setup.exe:Zone.Identifier' בפלט של 'dir /r'?"),
      options: [t("A hidden shortcut", "קיצור דרך מוסתר"), t("An NTFS alternate data stream holding the Mark of the Web", "Alternate data stream של NTFS שמחזיק את ה-Mark of the Web"), t("A corrupted MFT record", "רשומת MFT פגומה"), t("A shadow copy", "Shadow copy")],
      answer: 1,
      explain: t("NTFS files can have named extra streams; browsers write Zone.Identifier with ZoneId=3 so Windows warns before running downloaded files.", "לקבצי NTFS יכולים להיות streams נוספים עם שם; דפדפנים כותבים Zone.Identifier עם ZoneId=3 כדי ש-Windows יזהיר לפני הרצת קבצים שהורדו.") },
    { q: t("Why is NFSv3 with AUTH_SYS risky on a broad network?", "למה NFSv3 עם AUTH_SYS מסוכן ברשת רחבה?"),
      options: [t("It has no locking at all", "אין בו נעילות בכלל"), t("The server trusts the UID the client claims, so root on any client can act as any user", "השרת סומך על ה-UID שהלקוח טוען, אז root על כל לקוח יכול לפעול בתור כל משתמש"), t("It only works over UDP", "הוא עובד רק על UDP"), t("It stores passwords in plain text on the server", "הוא שומר סיסמאות כטקסט גלוי בשרת")],
      answer: 1,
      explain: t("AUTH_SYS has no real authentication; restrict exports by subnet, use root_squash, or move to NFSv4 with Kerberos.", "ב-AUTH_SYS אין אימות אמיתי; מגבילים exports לפי subnet, משתמשים ב-root_squash, או עוברים ל-NFSv4 עם Kerberos.") }
  ],
  related: ["fs-filesystems-raid", "storage-io", "linux-disks-storage", "disks-hdd-ssd-nvme", "raid-levels-deep", "k8s-storage", "cloud-storage"]
});

/* ---------------------------------------------------------------------- */
INFRA.lessons.push({
  id: "raid-levels-deep",
  track: "foundations",
  order: 35,
  icon: "🧱",
  level: 3,
  minutes: 18,
  title: t("Every RAID Level: 0 to 60, RAID-Z, Rebuilds and URE Math", "כל רמות ה-RAID: מ-0 עד 60, RAID-Z, rebuilds וחשבון URE"),
  tldr: t(
    "RAID trades disks for speed or survival: 0 stripes (no safety), 1/10 mirror (fast writes, half the space), 5/6 add 1/2 parity (more space, write penalty 4/6, long risky rebuilds), 2/3/4 died because one parity disk bottlenecks every write, and ZFS RAID-Z fixes the write hole with copy-on-write. On big disks, a RAID 5 rebuild has to read tens of TB — with a spec URE of 1 in 10^14 bits that alone can kill it. And in the cloud you mostly don't need RAID at all.",
    "RAID מחליף דיסקים במהירות או בשרידות: 0 עושה striping (בלי הגנה), 1/10 עושים mirror (כתיבות מהירות, חצי מהנפח), 5/6 מוסיפים 1/2 parity (יותר נפח, write penalty של 4/6, rebuilds ארוכים ומסוכנים), 2/3/4 מתו כי דיסק parity יחיד חונק כל כתיבה, ו-RAID-Z של ZFS פותר את ה-write hole עם copy-on-write. בדיסקים גדולים rebuild של RAID 5 צריך לקרוא עשרות TB — עם URE לפי מפרט של 1 ל-10^14 bits, זה לבד יכול להרוג אותו. ובענן כמעט לא צריך RAID בכלל."
  ),
  analogy: t(
    "Think of a team copying a giant book. RAID 0 splits the pages between scribes — fast, but if one scribe disappears, the book has holes. RAID 1 has two scribes copy the whole book each. RAID 5 splits pages among scribes and adds a 'checksum page' per chapter, rotating who writes it, so any one lost scribe can be reconstructed. RAID 4 made one poor scribe write every checksum page — he became the bottleneck for the whole team. A rebuild is asking the remaining scribes to re-read the entire book aloud without a single stutter, while customers keep asking them questions.",
    "תחשוב על צוות שמעתיק ספר ענק. RAID 0 מחלק את הדפים בין הסופרים — מהיר, אבל אם סופר אחד נעלם, יש חורים בספר. ב-RAID 1 שני סופרים מעתיקים כל אחד את כל הספר. RAID 5 מחלק דפים בין הסופרים ומוסיף 'דף בדיקה' לכל פרק, ומחליף בכל פעם מי כותב אותו, כך שאפשר לשחזר כל סופר אחד שנעלם. ב-RAID 4 סופר מסכן אחד כתב את כל דפי הבדיקה — והוא הפך לצוואר הבקבוק של כל הצוות. Rebuild זה לבקש מהסופרים שנשארו לקרוא בקול את כל הספר בלי לגמגם אפילו פעם אחת, בזמן שלקוחות ממשיכים לשאול אותם שאלות."
  ),
  sections: [
    {
      h: t("The levels side by side: layout, capacity, survival, speed", "הרמות אחת ליד השנייה: layout, נפח, שרידות, מהירות"),
      body: t(
`<p><strong>fs-filesystems-raid</strong> introduced RAID 0/1/5/6/10 on a 6-disk example. Now every level, on <strong>8 × 12 TB HDDs, ~150 random IOPS each</strong> (C = disk size, n = disks):</p>
<table>
<tr><th>Level</th><th>How</th><th>Usable formula</th><th>8 × 12 TB</th><th>Survives</th><th>Write penalty</th><th>Status</th></tr>
<tr><td>RAID 0</td><td>Block striping</td><td>n × C</td><td>96 TB</td><td>0 disks</td><td>1</td><td>Scratch / throughput only</td></tr>
<tr><td>RAID 1</td><td>Mirror (2 or 3-way)</td><td>C</td><td>12 TB (2 disks)</td><td>n − 1</td><td>2 (3 for 3-way)</td><td>Boot disks, small DBs</td></tr>
<tr><td>RAID 2</td><td>Bit striping + Hamming ECC disks</td><td>n − ECC disks</td><td>—</td><td>1 (corrects 1 bit)</td><td>—</td><td><strong>Obsolete</strong> (disks have ECC built in)</td></tr>
<tr><td>RAID 3</td><td>Byte striping + dedicated parity disk, synced spindles</td><td>(n − 1) × C</td><td>84 TB</td><td>1</td><td>every IO hits all disks</td><td><strong>Obsolete</strong></td></tr>
<tr><td>RAID 4</td><td>Block striping + dedicated parity disk</td><td>(n − 1) × C</td><td>84 TB</td><td>1</td><td>4, all on one parity disk</td><td><strong>Obsolete</strong> (except NetApp WAFL)</td></tr>
<tr><td>RAID 5</td><td>Blocks + parity rotated across disks</td><td>(n − 1) × C</td><td>84 TB</td><td>1</td><td>4</td><td>OK for small SSD arrays</td></tr>
<tr><td>RAID 6</td><td>Blocks + 2 rotated parities (P, Q)</td><td>(n − 2) × C</td><td>72 TB</td><td>any 2</td><td>6</td><td>Standard for big HDD arrays</td></tr>
<tr><td>RAID 10 (1+0)</td><td>Stripe across mirror pairs</td><td>n × C / 2</td><td>48 TB</td><td>1 guaranteed, up to 4 (one per pair)</td><td>2</td><td>Databases, VMs</td></tr>
<tr><td>RAID 01 (0+1)</td><td>Mirror of two stripes</td><td>n × C / 2</td><td>48 TB</td><td>1 guaranteed</td><td>2</td><td>Avoid — use 10</td></tr>
<tr><td>RAID 50</td><td>Stripe across g RAID 5 groups</td><td>(n − g) × C</td><td>72 TB (2 × 4-disk)</td><td>1 per group</td><td>4</td><td>Large arrays, faster rebuild than one wide RAID 5</td></tr>
<tr><td>RAID 60</td><td>Stripe across g RAID 6 groups</td><td>(n − 2g) × C</td><td>48 TB (2 × 4-disk)</td><td>2 per group</td><td>6</td><td>Very large HDD arrays</td></tr>
<tr><td>RAID-Z1/Z2/Z3</td><td>ZFS variable-width stripes, 1/2/3 parity</td><td>≈ (n − p) × C</td><td>Z2: ≈ 72 TB</td><td>p disks per vdev</td><td>none (full-stripe CoW writes)</td><td>NAS, backup, ZFS everywhere</td></tr>
</table>
<pre>RAID 0             RAID 1          RAID 4 (dedicated parity)     RAID 5 (rotating parity)
d0  d1  d2  d3     d0   d1         d0  d1  d2  P              d0  d1  d2  d3
A1  A2  A3  A4     A1   A1         A1  A2  A3  Ap             A1  A2  A3  Ap
B1  B2  B3  B4     B1   B1         B1  B2  B3  Bp             B1  B2  Bp  B3
                                               ^ every write  C1  Cp  C2  C3
RAID 10 = stripe(mirror(d0,d1), mirror(d2,d3))  hits this disk  Dp  D1  D2  D3
RAID 6  = like 5, but two parity blocks per stripe: P (XOR) + Q (Reed-Solomon)</pre>
<p><strong>Why RAID 2/3/4 died:</strong> they dedicate one disk to parity (or several to ECC). Every small write must update that one disk, so the whole array writes at the speed of a single parity drive. RAID 5 fixed it by rotating parity across all disks. RAID 2 also became pointless once every drive had its own internal ECC, and RAID 3's byte-level striping makes every IO touch every disk, so the array does one random IO at a time. NetApp is the famous exception: its WAFL filesystem batches writes into full stripes, so the dedicated parity disk (RAID 4 / RAID-DP) isn't a bottleneck.</p>
<p><strong>RAID 10 vs RAID 01:</strong> same capacity, very different odds. With 4 disks, after one failure: in RAID 10 only the dead disk's mirror partner is fatal (1 of 3 remaining = 33%). In RAID 01 the first failure takes its whole stripe set offline, so a failure on <em>either</em> disk of the other stripe is fatal (2 of 3 = 67%), and the rebuild copies a whole stripe. Always 1+0.</p>`,
`<p>השיעור <strong>fs-filesystems-raid</strong> הציג RAID 0/1/5/6/10 על דוגמה של 6 דיסקים. עכשיו כל הרמות, על <strong>8 × 12 TB HDD, ~150 IOPS אקראיים כל אחד</strong> (C = גודל דיסק, n = מספר דיסקים):</p>
<table>
<tr><th>רמה</th><th>איך</th><th>נוסחת נפח שמיש</th><th>8 × 12 TB</th><th>שורד</th><th>Write penalty</th><th>מצב</th></tr>
<tr><td>RAID 0</td><td>Striping של blocks</td><td>n × C</td><td>96 TB</td><td>0 דיסקים</td><td>1</td><td>רק scratch / throughput</td></tr>
<tr><td>RAID 1</td><td>Mirror (של 2 או 3)</td><td>C</td><td>12 TB (2 דיסקים)</td><td>n − 1</td><td>2 (3 ב-3-way)</td><td>דיסקי boot, DB קטנים</td></tr>
<tr><td>RAID 2</td><td>Striping של bits ודיסקי ECC של Hamming</td><td>n פחות דיסקי ECC</td><td>—</td><td>1 (מתקן bit אחד)</td><td>—</td><td><strong>מת</strong> (לדיסקים יש ECC מובנה)</td></tr>
<tr><td>RAID 3</td><td>Striping של bytes ודיסק parity ייעודי, צירים מסונכרנים</td><td>(n − 1) × C</td><td>84 TB</td><td>1</td><td>כל IO נוגע בכל הדיסקים</td><td><strong>מת</strong></td></tr>
<tr><td>RAID 4</td><td>Striping של blocks ודיסק parity ייעודי</td><td>(n − 1) × C</td><td>84 TB</td><td>1</td><td>4, כולם על דיסק parity אחד</td><td><strong>מת</strong> (חוץ מ-WAFL של NetApp)</td></tr>
<tr><td>RAID 5</td><td>Blocks ו-parity שמסתובב בין הדיסקים</td><td>(n − 1) × C</td><td>84 TB</td><td>1</td><td>4</td><td>בסדר למערכי SSD קטנים</td></tr>
<tr><td>RAID 6</td><td>Blocks ושני parities מסתובבים (P, Q)</td><td>(n − 2) × C</td><td>72 TB</td><td>כל 2</td><td>6</td><td>הסטנדרט למערכי HDD גדולים</td></tr>
<tr><td>RAID 10 (1+0)</td><td>Stripe מעל זוגות mirror</td><td>n × C / 2</td><td>48 TB</td><td>1 מובטח, עד 4 (אחד לכל זוג)</td><td>2</td><td>Databases, VM-ים</td></tr>
<tr><td>RAID 01 (0+1)</td><td>Mirror של שני stripes</td><td>n × C / 2</td><td>48 TB</td><td>1 מובטח</td><td>2</td><td>להימנע — להשתמש ב-10</td></tr>
<tr><td>RAID 50</td><td>Stripe מעל g קבוצות RAID 5</td><td>(n − g) × C</td><td>72 TB (2 × 4 דיסקים)</td><td>1 לכל קבוצה</td><td>4</td><td>מערכים גדולים, rebuild מהיר יותר מ-RAID 5 רחב אחד</td></tr>
<tr><td>RAID 60</td><td>Stripe מעל g קבוצות RAID 6</td><td>(n − 2g) × C</td><td>48 TB (2 × 4 דיסקים)</td><td>2 לכל קבוצה</td><td>6</td><td>מערכי HDD ענקיים</td></tr>
<tr><td>RAID-Z1/Z2/Z3</td><td>Stripes ברוחב משתנה של ZFS, 1/2/3 parity</td><td>≈ (n − p) × C</td><td>Z2: ≈ 72 TB</td><td>p דיסקים לכל vdev</td><td>אין (כתיבות CoW של stripe מלא)</td><td>NAS, גיבוי, כל מקום שיש ZFS</td></tr>
</table>
<pre>RAID 0             RAID 1          RAID 4 (dedicated parity)     RAID 5 (rotating parity)
d0  d1  d2  d3     d0   d1         d0  d1  d2  P              d0  d1  d2  d3
A1  A2  A3  A4     A1   A1         A1  A2  A3  Ap             A1  A2  A3  Ap
B1  B2  B3  B4     B1   B1         B1  B2  B3  Bp             B1  B2  Bp  B3
                                               ^ every write  C1  Cp  C2  C3
RAID 10 = stripe(mirror(d0,d1), mirror(d2,d3))  hits this disk  Dp  D1  D2  D3
RAID 6  = like 5, but two parity blocks per stripe: P (XOR) + Q (Reed-Solomon)</pre>
<p><strong>למה RAID 2/3/4 מתו:</strong> הם מקדישים דיסק אחד ל-parity (או כמה ל-ECC). כל כתיבה קטנה חייבת לעדכן את הדיסק הזה, אז כל המערך כותב במהירות של דיסק parity יחיד. RAID 5 פתר את זה ע"י סיבוב ה-parity בין כל הדיסקים. RAID 2 גם נהיה מיותר ברגע שלכל דיסק היה ECC פנימי, וב-RAID 3 ה-striping ברמת byte גורם לכל IO לגעת בכל הדיסקים, כך שהמערך עושה IO אקראי אחד בכל פעם. NetApp הם החריג המפורסם: ה-filesystem שלהם, WAFL, מקבץ כתיבות ל-stripes מלאים, אז דיסק ה-parity הייעודי (RAID 4 / RAID-DP) לא הופך לצוואר בקבוק.</p>
<p><strong>RAID 10 מול RAID 01:</strong> אותו נפח, סיכויים שונים מאוד. עם 4 דיסקים, אחרי כשל אחד: ב-RAID 10 רק ה-mirror partner של הדיסק המת קטלני (1 מתוך 3 שנשארו = 33%). ב-RAID 01 הכשל הראשון מוריד את כל ה-stripe שלו, אז כשל ב<em>כל אחד</em> מהדיסקים של ה-stripe השני קטלני (2 מתוך 3 = 67%), וה-rebuild מעתיק stripe שלם. תמיד 1+0.</p>`
      )
    },
    {
      h: t("Performance: write penalty math with a real workload", "ביצועים: חשבון write penalty עם workload אמיתי"),
      body: t(
`<p>A small (partial-stripe) write on parity RAID can't just write the data — parity must stay correct:</p>
<pre>RAID 5 small write  = read old data + read old parity
                    + write new data + write new parity          = 4 IOs
                      new_P = old_P XOR old_D XOR new_D
RAID 6 small write  = read D, P, Q + write D, P, Q               = 6 IOs
RAID 1/10 write     = write both mirrors                         = 2 IOs
Full-stripe write   = compute parity from new data, no reads     = n/(n−parity) overhead only</pre>
<p>Front-end IOPS = raw IOPS / (read% + write% × penalty). With our 8 × 150 = <strong>1,200 raw IOPS</strong> and a typical <strong>70% read / 30% write</strong> OLTP mix:</p>
<table>
<tr><th>Level</th><th>Calculation</th><th>Usable random IOPS</th><th>Capacity</th></tr>
<tr><td>RAID 0</td><td>1200 / (0.7 + 0.3 × 1)</td><td>1,200</td><td>96 TB</td></tr>
<tr><td>RAID 10</td><td>1200 / (0.7 + 0.3 × 2)</td><td>~923</td><td>48 TB</td></tr>
<tr><td>RAID 5</td><td>1200 / (0.7 + 0.3 × 4)</td><td>~632</td><td>84 TB</td></tr>
<tr><td>RAID 6</td><td>1200 / (0.7 + 0.3 × 6)</td><td>480</td><td>72 TB</td></tr>
<tr><td>RAID-Z2 (1 vdev)</td><td>≈ one disk's random IOPS per vdev</td><td>~150-250</td><td>≈ 72 TB</td></tr>
</table>
<p>RAID 10 gives ~2× the write-heavy IOPS of RAID 6 for 2/3 of the capacity — that's why databases live on mirrors. Reads are cheap everywhere (RAID 1/10 can serve from either copy). RAID-Z is the surprise: every block is spread across the whole vdev, so for small random IO a vdev behaves like one disk. ZFS rule of thumb: <strong>IOPS scale with the number of vdevs, not disks</strong> — 4 mirror vdevs from the same 8 disks beat one 8-wide RAID-Z2 for VMs and databases.</p>
<blockquote>💡 Real world: hardware RAID controllers hide the penalty with a battery- or flash-backed write cache (1-8 GB). Writes return as soon as they hit protected cache, and the controller coalesces them into full stripes. When the battery fails its learn cycle, controllers switch to write-through and RAID 6 latency jumps 10× overnight — a classic "nothing changed but the DB is slow" incident. Check it: <code>storcli /c0/bbu show</code> or <code>ssacli ctrl all show status</code>.</blockquote>`,
`<p>כתיבה קטנה (חלק מ-stripe) ב-RAID עם parity לא יכולה פשוט לכתוב את המידע — ה-parity חייב להישאר נכון:</p>
<pre>RAID 5 small write  = read old data + read old parity
                    + write new data + write new parity          = 4 IOs
                      new_P = old_P XOR old_D XOR new_D
RAID 6 small write  = read D, P, Q + write D, P, Q               = 6 IOs
RAID 1/10 write     = write both mirrors                         = 2 IOs
Full-stripe write   = compute parity from new data, no reads     = n/(n−parity) overhead only</pre>
<p>IOPS ב-front-end = IOPS גולמיים / (אחוז קריאה + אחוז כתיבה × penalty). עם ה-8 × 150 = <strong>1,200 IOPS גולמיים</strong> שלנו ותמהיל OLTP טיפוסי של <strong>70% קריאה / 30% כתיבה</strong>:</p>
<table>
<tr><th>רמה</th><th>חישוב</th><th>IOPS אקראיים שמישים</th><th>נפח</th></tr>
<tr><td>RAID 0</td><td>1200 / (0.7 + 0.3 × 1)</td><td>1,200</td><td>96 TB</td></tr>
<tr><td>RAID 10</td><td>1200 / (0.7 + 0.3 × 2)</td><td>~923</td><td>48 TB</td></tr>
<tr><td>RAID 5</td><td>1200 / (0.7 + 0.3 × 4)</td><td>~632</td><td>84 TB</td></tr>
<tr><td>RAID 6</td><td>1200 / (0.7 + 0.3 × 6)</td><td>480</td><td>72 TB</td></tr>
<tr><td>RAID-Z2 (vdev אחד)</td><td>≈ IOPS אקראיים של דיסק אחד לכל vdev</td><td>~150-250</td><td>≈ 72 TB</td></tr>
</table>
<p>RAID 10 נותן בערך פי 2 מה-IOPS של RAID 6 ב-workload עם כתיבות, תמורת 2/3 מהנפח — בגלל זה databases חיים על mirrors. קריאות זולות בכל מקום (RAID 1/10 יכולים לקרוא מכל עותק). RAID-Z הוא ההפתעה: כל block מפוזר על כל ה-vdev, אז ל-IO אקראי קטן vdev מתנהג כמו דיסק אחד. כלל אצבע ב-ZFS: <strong>IOPS גדלים עם מספר ה-vdevs, לא הדיסקים</strong> — 4 vdevs של mirror מאותם 8 דיסקים מנצחים RAID-Z2 אחד ברוחב 8 עבור VM-ים ו-databases.</p>
<blockquote>💡 מהשטח: בקרי RAID בחומרה מסתירים את ה-penalty עם write cache מגובה סוללה או flash (1-8 GB). כתיבות חוזרות ברגע שהן נוחתות ב-cache המוגן, והבקר מאחד אותן ל-stripes מלאים. כשהסוללה נכשלת ב-learn cycle שלה, הבקר עובר ל-write-through וה-latency של RAID 6 קופץ פי 10 בן לילה — תקרית קלאסית של "שום דבר לא השתנה אבל ה-DB איטי". לבדוק: <code>storcli /c0/bbu show</code> או <code>ssacli ctrl all show status</code>.</blockquote>`
      )
    },
    {
      h: t("Rebuilds, URE math and the write hole: why RAID 5 on big disks is risky", "Rebuilds, חשבון URE וה-write hole: למה RAID 5 על דיסקים גדולים מסוכן"),
      body: t(
`<p>When a disk dies, a parity array runs <strong>degraded</strong>: every read of the missing disk's blocks is reconstructed from all the others (slow), and one more problem = data loss. The rebuild must read <strong>every sector of every surviving disk</strong>.</p>
<p><strong>Rebuild time:</strong> 12 TB at a best-case 150 MB/s sustained = 12×10^12 / 150×10^6 = 80,000 s ≈ <strong>22 hours</strong> on an idle array. Under production load md throttles to keep latency sane — at 50 MB/s it's ~67 hours, almost 3 days. Bigger disks, same IOPS: the risk window grows every generation.</p>
<p><strong>URE math:</strong> consumer/nearline HDD datasheets specify an Unrecoverable Read Error rate of &lt; 1 per 10^14 bits read (enterprise: 10^15). 10^14 bits = 12.5 TB. Rebuilding a 4 × 12 TB RAID 5 reads 3 × 12 = 36 TB = 2.88 × 10^14 bits:</p>
<pre>expected UREs = 2.88e14 bits × 1e-14 = 2.88
P(no URE)     = e^-2.88 ≈ 0.056   → ~94% chance of at least one URE   (spec 10^14)
with 10^15:     e^-0.288 ≈ 0.75   → ~25% chance                         (enterprise)
RAID 6 degraded by one disk: a URE is just another missing block — Q parity rebuilds it.</pre>
<p>Datasheet numbers are worst-case bounds and real drives usually do better, but the shape of the risk is real. What a URE does depends on the stack: many hardware controllers <em>abort the rebuild and fail the array</em>; Linux md (with its bad-block log) records the bad sector and continues, losing that stripe; ZFS tells you exactly which file is damaged (<code>zpool status -v</code>). Add correlated failures — disks from the same batch, same age, now under 100% load for days — and you get the industry rule: <strong>no RAID 5 on HDDs above ~2 TB; use RAID 6/RAID-Z2 or RAID 10.</strong> Regular scrubs (read everything monthly) find latent bad sectors <em>before</em> you depend on them.</p>
<p><strong>The write hole:</strong> a stripe update writes data and parity to different disks — not atomically. Lose power between the two and the stripe's parity no longer matches. Nobody notices… until a disk fails and the reconstruction uses the stale parity, producing silently wrong data. Fixes:</p>
<ul>
<li><strong>Hardware RAID</strong>: battery/flash-backed write cache replays in-flight writes after power returns.</li>
<li><strong>mdadm</strong>: <code>--consistency-policy=ppl</code> (partial parity log, RAID 5) or a write journal on an SSD: <code>--write-journal /dev/nvme0n1p1</code>. The write-intent <code>bitmap</code> only speeds up resync; it doesn't close the hole.</li>
<li><strong>ZFS RAID-Z</strong>: copy-on-write + variable-width stripes — every write is a full new stripe, the old one stays valid until the pointer flips. No write hole by design. (btrfs RAID 5/6 still has write-hole issues, which is why it's not recommended.)</li>
</ul>
<blockquote>⚠️ Production tip: RAID is <strong>availability</strong>, not backup. It keeps you online through a disk failure. It will faithfully replicate <code>rm -rf</code>, ransomware, a bad migration and controller-induced corruption to every disk. Before replacing a disk in a degraded array, confirm your last good backup — the rebuild is the most dangerous hours that array will ever live.</blockquote>`,
`<p>כשדיסק מת, מערך עם parity רץ ב-<strong>degraded</strong>: כל קריאה של blocks מהדיסק החסר משוחזרת מכל האחרים (איטי), ועוד בעיה אחת = אובדן מידע. ה-rebuild חייב לקרוא <strong>כל sector בכל דיסק ששרד</strong>.</p>
<p><strong>זמן rebuild:</strong> 12 TB בקצב רציף אופטימי של 150 MB/s = 12×10^12 / 150×10^6 = 80,000 שניות ≈ <strong>22 שעות</strong> על מערך שלא עושה כלום אחר. תחת עומס פרודקשן md מגביל את עצמו כדי לשמור על latency סביר — ב-50 MB/s זה ~67 שעות, כמעט 3 ימים. דיסקים גדלים, ה-IOPS נשארים: חלון הסיכון גדל בכל דור.</p>
<p><strong>חשבון URE:</strong> ה-datasheets של HDD צרכני/nearline מציינים קצב Unrecoverable Read Error של פחות מ-1 ל-10^14 bits שנקראו (enterprise: 10^15). 10^14 bits = 12.5 TB. Rebuild של RAID 5 עם 4 × 12 TB קורא 3 × 12 = 36 TB = 2.88 × 10^14 bits:</p>
<pre>expected UREs = 2.88e14 bits × 1e-14 = 2.88
P(no URE)     = e^-2.88 ≈ 0.056   → ~94% chance of at least one URE   (spec 10^14)
with 10^15:     e^-0.288 ≈ 0.75   → ~25% chance                         (enterprise)
RAID 6 degraded by one disk: a URE is just another missing block — Q parity rebuilds it.</pre>
<p>המספרים ב-datasheet הם גבול עליון למקרה הגרוע ודיסקים אמיתיים בדרך כלל טובים יותר, אבל צורת הסיכון אמיתית. מה ש-URE עושה תלוי ב-stack: הרבה בקרי חומרה <em>מפסיקים את ה-rebuild ומפילים את המערך</em>; md של לינוקס (עם ה-bad-block log שלו) רושם את ה-sector הפגום וממשיך, ומאבד את ה-stripe הזה; ZFS אומר לך בדיוק איזה קובץ נפגע (<code>zpool status -v</code>). תוסיף כשלים מתואמים — דיסקים מאותו batch, באותו גיל, עכשיו תחת 100% עומס במשך ימים — ומקבלים את הכלל של התעשייה: <strong>אין RAID 5 על HDD מעל ~2 TB; משתמשים ב-RAID 6/RAID-Z2 או RAID 10.</strong> Scrubs קבועים (לקרוא הכול פעם בחודש) מוצאים sectors פגומים רדומים <em>לפני</em> שאתה תלוי בהם.</p>
<p><strong>ה-write hole:</strong> עדכון stripe כותב מידע ו-parity לדיסקים שונים — לא אטומית. נופל החשמל בין שתי הכתיבות, וה-parity של ה-stripe כבר לא תואם. אף אחד לא שם לב… עד שדיסק נכשל והשחזור משתמש ב-parity הישן ומייצר מידע שגוי בשקט. פתרונות:</p>
<ul>
<li><strong>RAID בחומרה</strong>: write cache מגובה סוללה/flash מריץ מחדש את הכתיבות שהיו באוויר כשהחשמל חוזר.</li>
<li><strong>mdadm</strong>: <code>--consistency-policy=ppl</code> (partial parity log, ל-RAID 5) או write journal על SSD: <code>--write-journal /dev/nvme0n1p1</code>. ה-<code>bitmap</code> של write-intent רק מאיץ resync; הוא לא סוגר את החור.</li>
<li><strong>RAID-Z של ZFS</strong>: copy-on-write ו-stripes ברוחב משתנה — כל כתיבה היא stripe חדש ומלא, והישן נשאר תקף עד שהמצביע מתחלף. אין write hole מעצם התכנון. (ב-RAID 5/6 של btrfs עדיין יש בעיות write hole, ובגלל זה לא ממליצים עליו.)</li>
</ul>
<blockquote>⚠️ טיפ לפרודקשן: RAID זה <strong>זמינות</strong>, לא גיבוי. הוא משאיר אותך באוויר כשדיסק נכשל. הוא ישכפל בנאמנות <code>rm -rf</code>, ransomware, migration גרוע והשחתה שנגרמה מהבקר לכל הדיסקים. לפני שאתה מחליף דיסק במערך degraded, תוודא מה הגיבוי הטוב האחרון שלך — ה-rebuild הוא השעות הכי מסוכנות שהמערך הזה יחיה אי פעם.</blockquote>`
      )
    },
    {
      h: t("Hardware RAID vs mdadm vs ZFS, hot spares, and running mdadm", "RAID בחומרה מול mdadm מול ZFS, hot spares, ועבודה עם mdadm"),
      body: t(
`<table>
<tr><th></th><th>Hardware RAID card</th><th>Linux mdadm</th><th>ZFS (RAID-Z / mirrors)</th></tr>
<tr><td>Where logic runs</td><td>Controller CPU + cache</td><td>Host kernel</td><td>Host kernel, integrated with the FS</td></tr>
<tr><td>Write hole</td><td>Closed by BBU/flash cache</td><td>Open unless PPL/journal</td><td>None (CoW)</td></tr>
<tr><td>Bit-rot detection</td><td>No (parity check only on scrub)</td><td>No (mismatch_cnt, can't tell which copy is right)</td><td>Yes, checksums pick the good copy</td></tr>
<tr><td>Rebuild copies</td><td>Every sector</td><td>Every sector (bitmap helps after short outages)</td><td>Only allocated data (resilver)</td></tr>
<tr><td>Portability</td><td>Need same vendor/controller to read disks</td><td>Any Linux box</td><td>Any OpenZFS box (Linux, FreeBSD)</td></tr>
<tr><td>Visibility</td><td>Vendor CLI (storcli, ssacli, perccli)</td><td>/proc/mdstat, mdadm</td><td>zpool status</td></tr>
</table>
<p><strong>Hot spare:</strong> an idle disk in the chassis that the array grabs automatically when a member fails, so the rebuild starts at 03:00 instead of when someone drives to the data center. A <em>global</em> spare serves any array. ZFS's <strong>dRAID</strong> goes further: spare capacity is distributed across all disks, so a rebuild writes to all of them in parallel and finishes in a fraction of the time.</p>
<pre>$ sudo mdadm --create /dev/md0 --level=6 --raid-devices=6 --spare-devices=1 \
       --bitmap=internal /dev/sd[b-h]
$ cat /proc/mdstat                      # a member died, the spare took over:
md0 : active raid6 sdh[6] sdg[5] sdf[4] sde[3](F) sdd[2] sdc[1] sdb[0]
      31251490816 blocks super 1.2 level 6, 512k chunk, algorithm 2 [6/5] [UUU_UU]
      [====&gt;................]  recovery = 21.7% (1695483904/7812872704) finish=611.4min speed=166752K/sec
      bitmap: 2/59 pages [8KB], 65536KB chunk

$ sudo mdadm --detail /dev/md0 | sed -n '/State :/,$p'
           State : clean, degraded, recovering
  Active Devices : 5
 Working Devices : 6
  Failed Devices : 1
   Spare Devices : 1
  Rebuild Status : 21% complete
    Number   Major   Minor   RaidDevice State
       0       8       16        0      active sync   /dev/sdb
       1       8       32        1      active sync   /dev/sdc
       2       8       48        2      active sync   /dev/sdd
       6       8      112        3      spare rebuilding   /dev/sdh
       4       8       80        4      active sync   /dev/sdf
       5       8       96        5      active sync   /dev/sdg
       3       8       64        -      faulty   /dev/sde</pre>
<p>Reading it: <code>[6/5]</code> = 6 slots, 5 working; <code>[UUU_UU]</code> = slot 3 missing; <code>(F)</code> faulty, <code>(S)</code> would mean spare. 6 disks × RAID 6 → 4 × 7,812,872,704 KiB = 31,251,490,816 KiB ≈ 32 TB usable. Remaining: (7,812,872,704 − 1,695,483,904) KiB / 166,752 KiB/s ≈ 611 minutes.</p>
<pre># Swap the dead disk, the new one becomes the next spare
$ sudo mdadm /dev/md0 --remove /dev/sde
$ sudo mdadm /dev/md0 --add /dev/sdi
# Rebuild speed limits (KiB/s per device)
$ sysctl dev.raid.speed_limit_min dev.raid.speed_limit_max
dev.raid.speed_limit_min = 1000
dev.raid.speed_limit_max = 200000
# Monthly scrub: read and verify everything
$ echo check | sudo tee /sys/block/md0/md/sync_action
$ cat /sys/block/md0/md/mismatch_cnt
# Persist and alert
$ sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
$ echo 'MAILADDR oncall@example.com' | sudo tee -a /etc/mdadm/mdadm.conf
$ sudo update-initramfs -u &amp;&amp; sudo systemctl enable --now mdmonitor

# The ZFS equivalent
$ sudo zpool create tank raidz2 sdb sdc sdd sde sdf sdg spare sdh
$ sudo zpool replace tank sde sdi &amp;&amp; zpool status tank   # "resilver in progress"
$ sudo zpool scrub tank</pre>
<blockquote>⚠️ Production tip: never run <code>mdadm --create</code> on disks of an existing array to "fix" it — that writes new superblocks and can destroy the layout. To recover a failed array use <code>mdadm --assemble --force</code>, ideally on <code>ddrescue</code> images of the disks, and only after reading <code>mdadm --examine</code> on every member. And label the drive bays: pulling the <em>healthy</em> disk from a degraded RAID 5 is a career-defining moment.</blockquote>`,
`<table>
<tr><th></th><th>כרטיס RAID בחומרה</th><th>mdadm של לינוקס</th><th>ZFS (RAID-Z / mirrors)</th></tr>
<tr><td>איפה הלוגיקה רצה</td><td>CPU ו-cache של הבקר</td><td>Kernel של ה-host</td><td>Kernel של ה-host, משולב עם ה-FS</td></tr>
<tr><td>Write hole</td><td>נסגר ע"י cache מגובה BBU/flash</td><td>פתוח אלא אם יש PPL/journal</td><td>אין (CoW)</td></tr>
<tr><td>זיהוי bit rot</td><td>לא (בדיקת parity רק ב-scrub)</td><td>לא (mismatch_cnt, לא יודע איזה עותק נכון)</td><td>כן, ה-checksums בוחרים את העותק התקין</td></tr>
<tr><td>מה ה-rebuild מעתיק</td><td>כל sector</td><td>כל sector (ה-bitmap עוזר אחרי ניתוקים קצרים)</td><td>רק מידע שבשימוש (resilver)</td></tr>
<tr><td>ניידות</td><td>צריך אותו יצרן/בקר כדי לקרוא את הדיסקים</td><td>כל מכונת לינוקס</td><td>כל מכונה עם OpenZFS (לינוקס, FreeBSD)</td></tr>
<tr><td>נראות</td><td>CLI של היצרן (storcli, ssacli, perccli)</td><td>/proc/mdstat, mdadm</td><td>zpool status</td></tr>
</table>
<p><strong>Hot spare:</strong> דיסק רדום במארז שהמערך תופס אוטומטית כשחבר נכשל, כך שה-rebuild מתחיל ב-03:00 ולא כשמישהו מגיע ל-data center. Spare <em>גלובלי</em> משרת כל מערך. ה-<strong>dRAID</strong> של ZFS הולך רחוק יותר: נפח ה-spare מפוזר על כל הדיסקים, אז rebuild כותב לכולם במקביל ומסתיים בחלק קטן מהזמן.</p>
<pre>$ sudo mdadm --create /dev/md0 --level=6 --raid-devices=6 --spare-devices=1 \
       --bitmap=internal /dev/sd[b-h]
$ cat /proc/mdstat                      # a member died, the spare took over:
md0 : active raid6 sdh[6] sdg[5] sdf[4] sde[3](F) sdd[2] sdc[1] sdb[0]
      31251490816 blocks super 1.2 level 6, 512k chunk, algorithm 2 [6/5] [UUU_UU]
      [====&gt;................]  recovery = 21.7% (1695483904/7812872704) finish=611.4min speed=166752K/sec
      bitmap: 2/59 pages [8KB], 65536KB chunk

$ sudo mdadm --detail /dev/md0 | sed -n '/State :/,$p'
           State : clean, degraded, recovering
  Active Devices : 5
 Working Devices : 6
  Failed Devices : 1
   Spare Devices : 1
  Rebuild Status : 21% complete
    Number   Major   Minor   RaidDevice State
       0       8       16        0      active sync   /dev/sdb
       1       8       32        1      active sync   /dev/sdc
       2       8       48        2      active sync   /dev/sdd
       6       8      112        3      spare rebuilding   /dev/sdh
       4       8       80        4      active sync   /dev/sdf
       5       8       96        5      active sync   /dev/sdg
       3       8       64        -      faulty   /dev/sde</pre>
<p>איך קוראים: <code>[6/5]</code> = 6 מקומות, 5 עובדים; <code>[UUU_UU]</code> = מקום 3 חסר; <code>(F)</code> זה faulty, ו-<code>(S)</code> היה אומר spare. 6 דיסקים ב-RAID 6 → 4 × 7,812,872,704 KiB = 31,251,490,816 KiB ≈ 32 TB שמישים. נשאר: (7,812,872,704 − 1,695,483,904) KiB / 166,752 KiB/s ≈ 611 דקות.</p>
<pre># Swap the dead disk, the new one becomes the next spare
$ sudo mdadm /dev/md0 --remove /dev/sde
$ sudo mdadm /dev/md0 --add /dev/sdi
# Rebuild speed limits (KiB/s per device)
$ sysctl dev.raid.speed_limit_min dev.raid.speed_limit_max
dev.raid.speed_limit_min = 1000
dev.raid.speed_limit_max = 200000
# Monthly scrub: read and verify everything
$ echo check | sudo tee /sys/block/md0/md/sync_action
$ cat /sys/block/md0/md/mismatch_cnt
# Persist and alert
$ sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
$ echo 'MAILADDR oncall@example.com' | sudo tee -a /etc/mdadm/mdadm.conf
$ sudo update-initramfs -u &amp;&amp; sudo systemctl enable --now mdmonitor

# The ZFS equivalent
$ sudo zpool create tank raidz2 sdb sdc sdd sde sdf sdg spare sdh
$ sudo zpool replace tank sde sdi &amp;&amp; zpool status tank   # "resilver in progress"
$ sudo zpool scrub tank</pre>
<blockquote>⚠️ טיפ לפרודקשן: אף פעם אל תריץ <code>mdadm --create</code> על דיסקים של מערך קיים כדי "לתקן" אותו — זה כותב superblocks חדשים ויכול להרוס את ה-layout. כדי לשחזר מערך שנפל משתמשים ב-<code>mdadm --assemble --force</code>, עדיף על images של הדיסקים שנעשו עם <code>ddrescue</code>, ורק אחרי שקראת <code>mdadm --examine</code> על כל חבר. ותסמן את ה-bays: לשלוף את הדיסק ה<em>תקין</em> מ-RAID 5 שכבר degraded זה רגע שמגדיר קריירה.</blockquote>`
      )
    },
    {
      h: t("RAID in the cloud: mostly don't", "RAID בענן: ברוב המקרים, לא"),
      body: t(
`<p>A cloud block volume is <em>already</em> redundant: EBS replicates each volume across multiple servers inside its AZ (gp3 ~99.8-99.9% annual durability, io2 99.999%); Azure Managed Disks keep 3 copies (LRS) or spread across zones (ZRS); GCP PD replicates within the zone, regional PD across two zones. Putting RAID 1/5/6 on top buys almost nothing and costs a lot:</p>
<table>
<tr><th>Cloud RAID</th><th>Verdict</th><th>Why</th></tr>
<tr><td>RAID 0 across EBS/PD volumes</td><td>✅ Sometimes</td><td>Aggregate past a single volume's cap: 4 × gp3 at 16,000 IOPS / 1,000 MiB/s = 64,000 IOPS / 4,000 MiB/s — if the instance's EBS bandwidth allows it. One volume lost = array lost, so snapshot all members together (multi-volume crash-consistent snapshots).</td></tr>
<tr><td>RAID 1 across EBS</td><td>❌</td><td>Double the cost and EBS bandwidth for redundancy you already have; doesn't protect against AZ loss (same AZ).</td></tr>
<tr><td>RAID 5/6 across EBS</td><td>❌ AWS explicitly advises against</td><td>Parity writes eat 20-30% of your provisioned IOPS and bandwidth.</td></tr>
<tr><td>RAID 0 on local NVMe (instance store)</td><td>✅ Common</td><td>One fast scratch volume for Spark shuffle, caches, or Kafka/Cassandra data that replicates at the application layer.</td></tr>
<tr><td>Bigger single volume (io2 Block Express, Ultra Disk, Hyperdisk Extreme)</td><td>✅ Usually best</td><td>256K-400K IOPS on one volume, no striping complexity, native snapshots.</td></tr>
</table>
<pre># RAID 0 over 4 instance-store NVMe disks (i4i), formatted XFS
$ sudo mdadm --create /dev/md0 --level=0 --raid-devices=4 /dev/nvme{1..4}n1
$ sudo mkfs.xfs /dev/md0 &amp;&amp; sudo mount -o noatime /dev/md0 /scratch</pre>
<blockquote>💡 Real world: in the cloud, redundancy moved <em>up</em> the stack. Instead of RAID under one big server, you run 3 database replicas in 3 AZs, Kafka with replication factor 3, or put data in S3 with 11 nines. The disk is allowed to die — the system isn't.</blockquote>`,
`<p>Volume של block בענן הוא <em>כבר</em> יתיר: EBS משכפל כל volume על כמה שרתים בתוך ה-AZ שלו (gp3 עם durability שנתי של ~99.8-99.9%, io2 עם 99.999%); Azure Managed Disks שומרים 3 עותקים (LRS) או מפזרים בין zones (ZRS); PD של GCP משכפל בתוך ה-zone, ו-regional PD בין שני zones. לשים RAID 1/5/6 מעל זה כמעט לא קונה כלום ועולה הרבה:</p>
<table>
<tr><th>RAID בענן</th><th>שורה תחתונה</th><th>למה</th></tr>
<tr><td>RAID 0 מעל volumes של EBS/PD</td><td>✅ לפעמים</td><td>לאחד מעבר לתקרה של volume בודד: 4 × gp3 ב-16,000 IOPS / 1,000 MiB/s = 64,000 IOPS / 4,000 MiB/s — אם ה-EBS bandwidth של ה-instance מרשה. Volume אחד שנעלם = המערך נעלם, אז עושים snapshot לכל החברים יחד (multi-volume crash-consistent snapshots).</td></tr>
<tr><td>RAID 1 מעל EBS</td><td>❌</td><td>כפול עלות וכפול EBS bandwidth בשביל יתירות שכבר יש לך; לא מגן מנפילת AZ (אותו AZ).</td></tr>
<tr><td>RAID 5/6 מעל EBS</td><td>❌ AWS ממליצים במפורש שלא</td><td>כתיבות parity אוכלות 20-30% מה-IOPS וה-bandwidth שהקצית.</td></tr>
<tr><td>RAID 0 על NVMe מקומי (instance store)</td><td>✅ נפוץ</td><td>Volume מהיר אחד ל-scratch: shuffle של Spark, caches, או מידע של Kafka/Cassandra שמשוכפל בשכבת האפליקציה.</td></tr>
<tr><td>Volume בודד גדול יותר (io2 Block Express, Ultra Disk, Hyperdisk Extreme)</td><td>✅ בדרך כלל הכי טוב</td><td>256K-400K IOPS על volume אחד, בלי מורכבות של striping, עם snapshots מובנים.</td></tr>
</table>
<pre># RAID 0 over 4 instance-store NVMe disks (i4i), formatted XFS
$ sudo mdadm --create /dev/md0 --level=0 --raid-devices=4 /dev/nvme{1..4}n1
$ sudo mkfs.xfs /dev/md0 &amp;&amp; sudo mount -o noatime /dev/md0 /scratch</pre>
<blockquote>💡 מהשטח: בענן, היתירות עלתה <em>למעלה</em> ב-stack. במקום RAID מתחת לשרת גדול אחד, מריצים 3 replicas של DB ב-3 AZs, Kafka עם replication factor 3, או שמים מידע ב-S3 עם 11 תשיעיות. הדיסק מורשה למות — המערכת לא.</blockquote>`
      )
    }
  ],
  diagram: `8 x 12 TB, 150 IOPS each, 70% read / 30% write:

 level     usable   survives          IOPS = 1200 / (0.7 + 0.3 x penalty)
 RAID 0    96 TB    0                 1200 / 1.0 = 1200
 RAID 10   48 TB    1 (up to 4)       1200 / 1.3 =  923
 RAID 5    84 TB    1                 1200 / 1.9 =  632
 RAID 6    72 TB    2                 1200 / 2.5 =  480

RAID 5 rebuild, 4 x 12 TB:  read 36 TB = 2.88e14 bits
   URE spec 1e-14  ->  expected 2.88 UREs  ->  P(clean rebuild) = e^-2.88 = ~6%

write hole:  write D' to disk1 ... POWER CUT ... (P' never written)  -> parity stale -> wrong data on next rebuild`,
  handsOn: [
    { cmd: "cat /proc/mdstat && sudo mdadm --detail /dev/md0", what: t("Read array health: [n/m] slots, [UU_U] map, recovery progress and per-disk state.", "קורא את בריאות המערך: מקומות [n/m], מפת [UU_U], התקדמות recovery ומצב כל דיסק.") },
    { cmd: "for f in 1 2 3 4; do truncate -s 1G /tmp/d$f.img; done; for f in 1 2 3 4; do sudo losetup -f /tmp/d$f.img; done; losetup -a", what: t("Build a safe lab: four 1 GiB loop devices you can turn into a throwaway RAID 5 with mdadm --create.", "בונה מעבדה בטוחה: ארבעה loop devices של 1 GiB שאפשר להפוך ל-RAID 5 זמני עם mdadm --create.") },
    { cmd: "sudo mdadm /dev/md127 --fail /dev/loop2 && cat /proc/mdstat", what: t("On the lab array only: simulate a disk failure and watch the array go degraded.", "רק על מערך המעבדה: מדמה כשל דיסק ורואה את המערך עובר ל-degraded.") },
    { cmd: "echo check | sudo tee /sys/block/md0/md/sync_action; watch cat /proc/mdstat", what: t("Run a scrub to find latent bad sectors before a rebuild depends on them.", "מריץ scrub כדי למצוא sectors פגומים רדומים לפני ש-rebuild יהיה תלוי בהם.") },
    { cmd: "zpool status -v", what: t("ZFS: see vdev layout, READ/WRITE/CKSUM error counters and exactly which files are damaged.", "ZFS: רואה את מבנה ה-vdevs, מוני שגיאות READ/WRITE/CKSUM ובדיוק אילו קבצים נפגעו.") }
  ],
  mnemonic: t(
    "0 = speed no seatbelt, 1 = twin, 5 = one spare tire, 6 = two spare tires, 10 = twins in a row. Penalty 1-2-4-6. Big disks + RAID 5 + URE = rebuild roulette.",
    "0 = מהירות בלי חגורה, 1 = תאומים, 5 = גלגל רזרבי אחד, 6 = שני גלגלים רזרביים, 10 = תאומים בשורה. Penalty של 1-2-4-6. דיסקים גדולים + RAID 5 + URE = רולטת rebuild."
  ),
  pitfalls: [
    t("RAID 5 on multi-TB HDDs: the rebuild reads tens of TB under load for a day or more; one URE or second failure loses the array.", "RAID 5 על HDD של כמה TB: ה-rebuild קורא עשרות TB תחת עומס יום ויותר; URE אחד או כשל שני מאבדים את המערך."),
    t("Treating RAID as a backup — deletes, ransomware and corruption replicate to every member instantly.", "להתייחס ל-RAID כגיבוי — מחיקות, ransomware והשחתה משוכפלים לכל החברים מיד."),
    t("Ignoring a failed BBU on a hardware controller: it silently switches to write-through and write latency explodes.", "להתעלם מ-BBU תקול בבקר חומרה: הוא עובר בשקט ל-write-through וה-write latency מתפוצץ."),
    t("Building parity RAID (5/6) across EBS volumes: parity eats 20-30% of provisioned IOPS for redundancy EBS already gives you.", "לבנות RAID עם parity (5/6) מעל volumes של EBS: ה-parity אוכל 20-30% מה-IOPS המוקצים בשביל יתירות ש-EBS כבר נותן.")
  ],
  interview: [
    { q: t("Why is the RAID 5 write penalty 4, and how do controllers hide it?", "למה ה-write penalty של RAID 5 הוא 4, ואיך בקרים מסתירים אותו?"),
      a: t("A partial-stripe write must keep parity consistent: read old data and old parity, compute new parity (old P XOR old D XOR new D), write new data and new parity — 4 IOs. Controllers hide it with a battery/flash-backed cache that acknowledges early and coalesces writes into full stripes, where parity is computed from new data with no reads.", "כתיבה לחלק מ-stripe חייבת לשמור על parity עקבי: לקרוא את המידע הישן ואת ה-parity הישן, לחשב parity חדש (old P XOR old D XOR new D), ולכתוב מידע חדש ו-parity חדש — 4 IOs. בקרים מסתירים את זה עם cache מגובה סוללה/flash שמאשר מוקדם ומאחד כתיבות ל-stripes מלאים, שבהם ה-parity מחושב מהמידע החדש בלי קריאות.") },
    { q: t("Explain the URE argument against RAID 5 on large disks.", "תסביר את הטיעון של URE נגד RAID 5 על דיסקים גדולים."),
      a: t("A rebuild must read every surviving disk end to end with no redundancy left. With a spec URE rate of 1 per 10^14 bits (12.5 TB), rebuilding 4 × 12 TB reads 36 TB ≈ 2.9 expected UREs, so by spec a clean rebuild is unlikely (~6%). Real drives beat the spec, but add long rebuild windows and correlated failures and the risk is unacceptable — use RAID 6/RAID-Z2 or RAID 10, and scrub regularly.", "Rebuild חייב לקרוא כל דיסק ששרד מתחילתו ועד סופו, בלי יתירות שנשארה. עם URE לפי מפרט של 1 ל-10^14 bits (12.5 TB), rebuild של 4 × 12 TB קורא 36 TB ≈ 2.9 UREs צפויים, אז לפי המפרט rebuild נקי לא סביר (~6%). דיסקים אמיתיים טובים מהמפרט, אבל תוסיף חלונות rebuild ארוכים וכשלים מתואמים והסיכון לא קביל — משתמשים ב-RAID 6/RAID-Z2 או RAID 10, ועושים scrub קבוע.") },
    { q: t("You need 60,000 IOPS on AWS for a database. Would you RAID EBS volumes?", "אתה צריך 60,000 IOPS ב-AWS עבור database. היית עושה RAID ל-volumes של EBS?"),
      a: t("First choice: one io2 Block Express volume (up to 256K IOPS) or a high-IOPS gp3 — simpler, native snapshots. If striping is needed, RAID 0 across several gp3 volumes, checking the instance's EBS bandwidth/IOPS limit and using multi-volume snapshots. Never RAID 5/6 (parity eats IOPS) or RAID 1 (EBS is already replicated). For HA, use replicas in another AZ, not disk RAID.", "בחירה ראשונה: volume אחד של io2 Block Express (עד 256K IOPS) או gp3 עם הרבה IOPS — פשוט יותר, עם snapshots מובנים. אם צריך striping, אז RAID 0 מעל כמה volumes של gp3, תוך בדיקת מגבלת ה-EBS bandwidth/IOPS של ה-instance ושימוש ב-multi-volume snapshots. אף פעם לא RAID 5/6 (ה-parity אוכל IOPS) או RAID 1 (EBS כבר משוכפל). ל-HA משתמשים ב-replicas ב-AZ אחר, לא ב-RAID של דיסקים.") }
  ],
  quiz: [
    { q: t("8 × 12 TB disks in RAID 6. Usable capacity?", "8 דיסקים של 12 TB ב-RAID 6. מה הנפח השמיש?"),
      options: [t("96 TB", "96 TB"), t("84 TB", "84 TB"), t("72 TB", "72 TB"), t("48 TB", "48 TB")],
      answer: 2,
      explain: t("RAID 6 = (n − 2) × C = 6 × 12 = 72 TB. 84 TB is RAID 5, 48 TB is RAID 10.", "RAID 6 = (n − 2) × C = 6 × 12 = 72 TB. 84 TB זה RAID 5, 48 TB זה RAID 10.") },
    { q: t("Why did RAID 4 fall out of use while RAID 5 thrived?", "למה RAID 4 יצא משימוש בזמן ש-RAID 5 שגשג?"),
      options: [t("RAID 4 has no parity", "ל-RAID 4 אין parity"), t("RAID 4's dedicated parity disk takes part in every write and becomes the bottleneck", "דיסק ה-parity הייעודי של RAID 4 משתתף בכל כתיבה והופך לצוואר הבקבוק"), t("RAID 4 needs synchronized spindles", "RAID 4 צריך צירים מסונכרנים"), t("RAID 4 can't survive any failure", "RAID 4 לא שורד שום כשל")],
      answer: 1,
      explain: t("Same capacity and protection as RAID 5, but all parity updates hit one disk. RAID 5 rotates parity so writes spread across all disks.", "אותו נפח ואותה הגנה כמו RAID 5, אבל כל עדכוני ה-parity פוגעים בדיסק אחד. RAID 5 מסובב את ה-parity כך שהכתיבות מתפזרות על כל הדיסקים.") },
    { q: t("With 1,200 raw IOPS and a 70/30 read/write mix, roughly how many random IOPS does RAID 5 deliver?", "עם 1,200 IOPS גולמיים ותמהיל של 70/30 קריאה/כתיבה, כמה IOPS אקראיים בערך RAID 5 נותן?"),
      options: [t("~1,200", "~1,200"), t("~923", "~923"), t("~632", "~632"), t("~300", "~300")],
      answer: 2,
      explain: t("1,200 / (0.7 + 0.3 × 4) = 1,200 / 1.9 ≈ 632. RAID 10 would give ~923, RAID 6 480.", "1,200 / (0.7 + 0.3 × 4) = 1,200 / 1.9 ≈ 632. RAID 10 היה נותן ~923, ו-RAID 6 נותן 480.") },
    { q: t("What is the RAID 'write hole' and which design avoids it entirely?", "מה זה ה-'write hole' של RAID ואיזה תכנון נמנע ממנו לגמרי?"),
      options: [t("A gap in striping that wastes space; RAID 0 avoids it", "רווח ב-striping שמבזבז מקום; RAID 0 נמנע ממנו"), t("Power loss between data and parity writes leaves stale parity; ZFS RAID-Z avoids it with copy-on-write full-stripe writes", "נפילת חשמל בין כתיבת המידע לכתיבת ה-parity משאירה parity לא מעודכן; RAID-Z של ZFS נמנע ממנו עם כתיבות CoW של stripe מלא"), t("A missing hot spare; dRAID avoids it", "Hot spare חסר; dRAID נמנע ממנו"), t("A bad sector on the parity disk; RAID 4 avoids it", "Sector פגום בדיסק ה-parity; RAID 4 נמנע ממנו")],
      answer: 1,
      explain: t("Data and parity land on different disks non-atomically. Battery-backed cache or md PPL/journal mitigate it; CoW RAID-Z never overwrites a live stripe, so there's no hole.", "המידע וה-parity נוחתים על דיסקים שונים בלי אטומיות. Cache מגובה סוללה או PPL/journal של md מקטינים את הבעיה; RAID-Z עם CoW אף פעם לא דורס stripe חי, אז אין חור.") }
  ],
  related: ["fs-filesystems-raid", "disks-hdd-ssd-nvme", "filesystems-compared", "storage-io", "db-backups", "pr-backups-strategy", "rel-bcdr"]
});

/* ---------------------------------------------------------------------- */
INFRA.lessons.push({
  id: "s3-deep",
  track: "cloud",
  order: 80,
  icon: "🪣",
  level: 3,
  minutes: 18,
  title: t("S3 in Depth: Object Model, Uploads, Access, Encryption, Events", "S3 לעומק: מודל האובייקטים, העלאות, הרשאות, הצפנה ו-events"),
  tldr: t(
    "S3 is a flat key → object store (no real folders) with strong read-after-write consistency and 11 nines of durability. Big files go up in multipart (5 MiB-5 GiB parts, max 10,000), browsers upload through presigned URLs, access is IAM + bucket policy with ACLs disabled and Block Public Access on, every object is encrypted (SSE-S3 by default, SSE-KMS + Bucket Keys for control), and changes flow out as events. Most S3 disasters are a public bucket or an over-privileged role, not a lost disk.",
    "S3 הוא מאגר שטוח של key → object (בלי תיקיות אמיתיות) עם strong read-after-write consistency ו-11 תשיעיות של durability. קבצים גדולים עולים ב-multipart (חלקים של 5 MiB עד 5 GiB, עד 10,000 חלקים), דפדפנים מעלים דרך presigned URLs, הרשאות הן IAM + bucket policy כש-ACLs כבויים ו-Block Public Access דלוק, כל אובייקט מוצפן (SSE-S3 כברירת מחדל, SSE-KMS עם Bucket Keys לשליטה), ושינויים יוצאים החוצה כ-events. רוב האסונות ב-S3 הם bucket ציבורי או role עם יותר מדי הרשאות, לא דיסק שהלך לאיבוד."
  ),
  analogy: t(
    "S3 is a gigantic coat check with infinite hooks. You hand over a coat (object), get a ticket with a unique label (key), and the label can look like 'floor2/row5/coat.jpg' — but there are no floors or rows, only labels sorted alphabetically. The coat check never loses a coat (11 nines), but it gives a coat to anyone holding a valid ticket: a presigned URL is a ticket you print for a guest that expires at midnight, and a public bucket is taping all tickets to the front door.",
    "S3 הוא מלתחה ענקית עם אינסוף ווים. אתה מוסר מעיל (object), מקבל כרטיס עם תווית ייחודית (key), והתווית יכולה להיראות כמו 'floor2/row5/coat.jpg' — אבל אין קומות ואין שורות, רק תוויות שממוינות לפי א-ב. המלתחה אף פעם לא מאבדת מעיל (11 תשיעיות), אבל היא נותנת מעיל לכל מי שמחזיק כרטיס תקף: presigned URL זה כרטיס שאתה מדפיס לאורח ופג בחצות, ו-bucket ציבורי זה להדביק את כל הכרטיסים על דלת הכניסה."
  ),
  sections: [
    {
      h: t("The object model: buckets, keys, versions — and no folders", "מודל האובייקטים: buckets, keys, versions — ובלי תיקיות"),
      body: t(
`<p><strong>cloud-storage</strong> compared object/block/file and <strong>cloud-storage-lifecycle</strong> covered classes, lifecycle, versioning, prefixes and consistency. This lesson is about how you <em>build</em> on S3.</p>
<ul>
<li><strong>Bucket</strong>: a container with a globally unique DNS-style name (3-63 chars), living in one region. 10,000 general purpose buckets per account by default (raised from 100 in late 2024).</li>
<li><strong>Key</strong>: any UTF-8 string up to 1,024 bytes. <code>invoices/2026/11/inv-0042.pdf</code> is <em>one flat key</em>. "Folders" in the console are just a <code>ListObjectsV2</code> call with <code>Prefix=invoices/2026/</code> and <code>Delimiter=/</code>, which groups the rest into <code>CommonPrefixes</code>. "Create folder" writes a zero-byte object named <code>invoices/</code>.</li>
<li><strong>Object</strong>: bytes + system metadata (Content-Type, ETag, storage class) + up to 2 KB user metadata (<code>x-amz-meta-*</code>) + up to 10 tags. Immutable: changing one byte = new PUT of the whole object.</li>
<li><strong>Version ID</strong>: with versioning on, every PUT creates a new version and DELETE adds a delete marker.</li>
</ul>
<pre>$ aws s3api head-object --bucket acme-media --key videos/launch.mp4
{
    "AcceptRanges": "bytes",
    "LastModified": "2026-11-12T09:41:07+00:00",
    "ContentLength": 734003200,
    "ETag": "\"9b2cf535f27731c974343645a3985328-88\"",
    "VersionId": "3HL4kqtJlcpXroDTDmJ.rmSpXd3dIbrH",
    "ContentType": "video/mp4",
    "ServerSideEncryption": "aws:kms",
    "BucketKeyEnabled": true,
    "StorageClass": "STANDARD_IA"
}</pre>
<p>That <code>-88</code> suffix tells you it was a multipart upload of 88 parts (700 MiB / 8 MiB = 87.5 → 88) — and that the ETag is <em>not</em> the file's MD5, so don't use it for integrity checks on multipart objects (use the <code>x-amz-checksum-*</code> SHA-256/CRC headers instead).</p>
<p>Consequences of a flat namespace: there's <strong>no rename</strong> (copy + delete — renaming a "folder" of 10 million objects is 20 million requests), <code>ls</code> is paginated at 1,000 keys per call, and a "directory" can't be locked or permissioned except through key-prefix conditions in policies.</p>
<p><strong>Durability vs availability in numbers:</strong> 11 nines of durability = an annual loss probability of 10^-11 per object. Store 10 billion objects → expect to lose ~0.1 objects a year. Availability is a different promise: S3 Standard is designed for 99.99% and the SLA credits start below 99.9% — your reads can fail with 503s during an event while not a single byte is lost. Design for retries, not for loss.</p>`,
`<p>השיעור <strong>cloud-storage</strong> השווה object/block/file, ו-<strong>cloud-storage-lifecycle</strong> כיסה classes, lifecycle, versioning, prefixes ו-consistency. השיעור הזה עוסק באיך <em>בונים</em> על S3.</p>
<ul>
<li><strong>Bucket</strong>: מיכל עם שם ייחודי גלובלית בסגנון DNS (3-63 תווים), שחי ב-region אחד. 10,000 general purpose buckets לכל account כברירת מחדל (עלה מ-100 בסוף 2024).</li>
<li><strong>Key</strong>: כל מחרוזת UTF-8 עד 1,024 bytes. <code>invoices/2026/11/inv-0042.pdf</code> הוא <em>key שטוח אחד</em>. "תיקיות" ב-console הן פשוט קריאת <code>ListObjectsV2</code> עם <code>Prefix=invoices/2026/</code> ו-<code>Delimiter=/</code>, שמקבצת את השאר ל-<code>CommonPrefixes</code>. "Create folder" כותב אובייקט של אפס bytes בשם <code>invoices/</code>.</li>
<li><strong>Object</strong>: bytes ועוד metadata של המערכת (Content-Type, ETag, storage class), עד 2 KB של user metadata (<code>x-amz-meta-*</code>) ועד 10 tags. בלתי ניתן לשינוי: לשנות byte אחד = PUT חדש של כל האובייקט.</li>
<li><strong>Version ID</strong>: כש-versioning דלוק, כל PUT יוצר גרסה חדשה ו-DELETE מוסיף delete marker.</li>
</ul>
<pre>$ aws s3api head-object --bucket acme-media --key videos/launch.mp4
{
    "AcceptRanges": "bytes",
    "LastModified": "2026-11-12T09:41:07+00:00",
    "ContentLength": 734003200,
    "ETag": "\"9b2cf535f27731c974343645a3985328-88\"",
    "VersionId": "3HL4kqtJlcpXroDTDmJ.rmSpXd3dIbrH",
    "ContentType": "video/mp4",
    "ServerSideEncryption": "aws:kms",
    "BucketKeyEnabled": true,
    "StorageClass": "STANDARD_IA"
}</pre>
<p>הסיומת <code>-88</code> מספרת שזו הייתה העלאת multipart של 88 חלקים (700 MiB / 8 MiB = 87.5 → 88) — ושה-ETag הוא <em>לא</em> ה-MD5 של הקובץ, אז אל תשתמש בו לבדיקת שלמות של אובייקטים מ-multipart (תשתמש ב-headers של <code>x-amz-checksum-*</code> עם SHA-256/CRC).</p>
<p>ההשלכות של namespace שטוח: <strong>אין rename</strong> (copy + delete — לשנות שם ל"תיקייה" של 10 מיליון אובייקטים זה 20 מיליון בקשות), <code>ls</code> מחולק לעמודים של 1,000 keys לקריאה, ואי אפשר לנעול "תיקייה" או לתת לה הרשאות אלא דרך תנאים על prefix ב-policies.</p>
<p><strong>Durability מול availability במספרים:</strong> 11 תשיעיות durability = הסתברות אובדן שנתית של 10^-11 לכל אובייקט. שומרים 10 מיליארד אובייקטים → צפוי לאבד ~0.1 אובייקט בשנה. Availability זו הבטחה אחרת: S3 Standard מתוכנן ל-99.99% וזיכויי ה-SLA מתחילים מתחת ל-99.9% — הקריאות שלך יכולות להיכשל עם 503 בזמן אירוע בלי שאף byte אחד ילך לאיבוד. מתכננים ל-retries, לא לאובדן.</p>`
      )
    },
    {
      h: t("Moving bytes: multipart uploads, presigned URLs, request rates", "להזיז bytes: multipart uploads, presigned URLs, קצב בקשות"),
      body: t(
`<table>
<tr><th>Limit</th><th>Value</th></tr>
<tr><td>Single PUT</td><td>up to 5 GiB (use multipart above ~100 MB anyway)</td></tr>
<tr><td>Multipart part size</td><td>5 MiB - 5 GiB (last part may be smaller)</td></tr>
<tr><td>Parts per upload</td><td>10,000</td></tr>
<tr><td>Max object size</td><td>5 TB for most of S3's life; AWS raised it to 50 TB in late 2025 — check current docs</td></tr>
</table>
<p>Multipart = <code>CreateMultipartUpload</code> → upload parts in parallel (retry just the failed part) → <code>CompleteMultipartUpload</code> with the list of part ETags. The math matters: at 8 MiB per part, 10,000 parts caps you at ~78 GiB, so a 100 GiB file would need 12,800 parts — the CLI and SDKs bump the part size automatically, your hand-rolled uploader may not. To hit 5 TB you need parts ≥ ~525 MiB.</p>
<p>An upload that is started but never completed or aborted keeps its parts — <strong>invisible in <code>aws s3 ls</code> but billed</strong>. Every bucket should have the <code>AbortIncompleteMultipartUpload</code> lifecycle rule (see cloud-storage-lifecycle). Find them:</p>
<pre>$ aws s3api list-multipart-uploads --bucket acme-media \
    --query 'Uploads[].{Key:Key,Started:Initiated,Id:UploadId}' --output table
$ aws s3api abort-multipart-upload --bucket acme-media --key raw/big.mov --upload-id 2~fYk...</pre>
<p><strong>Presigned URLs</strong> let a client without AWS credentials GET or PUT one specific object for a limited time. Your backend signs (SigV4) with its own credentials; no network call to AWS is needed to sign:</p>
<pre>$ aws s3 presign s3://acme-media/videos/launch.mp4 --expires-in 900
https://acme-media.s3.eu-west-1.amazonaws.com/videos/launch.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &amp;X-Amz-Credential=ASIA...%2F20261114%2Feu-west-1%2Fs3%2Faws4_request&amp;X-Amz-Date=20261114T101500Z
  &amp;X-Amz-Expires=900&amp;X-Amz-Security-Token=...&amp;X-Amz-SignedHeaders=host&amp;X-Amz-Signature=5f1c...

# Python: browser uploads straight to S3, your API never touches the bytes
url = s3.generate_presigned_url("put_object",
        Params={"Bucket": "acme-uploads", "Key": f"u/{user_id}/{uuid4()}.jpg",
                "ContentType": "image/jpeg"}, ExpiresIn=300)</pre>
<p>Rules: max expiry is 7 days with long-term credentials, but a URL signed with temporary (STS/role) credentials dies when those credentials expire — a Lambda-signed URL "valid for 7 days" may stop working after a few hours. A presigned URL is a bearer token: whoever holds it can use it, so keep expiries short, sign exact keys, and use <strong>presigned POST</strong> when you need to enforce <code>content-length-range</code> or a key prefix.</p>
<p><strong>Request rate:</strong> at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD per second <em>per partitioned prefix</em>, auto-scaling behind the scenes with temporary <code>503 SlowDown</code> while it splits. 10 prefixes ≈ 55,000 GET/s. For one hot object read by thousands of clients, put CloudFront in front instead.</p>`,
`<table>
<tr><th>מגבלה</th><th>ערך</th></tr>
<tr><td>PUT בודד</td><td>עד 5 GiB (בכל מקרה עדיף multipart מעל ~100 MB)</td></tr>
<tr><td>גודל חלק ב-multipart</td><td>5 MiB עד 5 GiB (החלק האחרון יכול להיות קטן יותר)</td></tr>
<tr><td>חלקים להעלאה</td><td>10,000</td></tr>
<tr><td>גודל אובייקט מקסימלי</td><td>5 TB ברוב חייו של S3; AWS העלו ל-50 TB בסוף 2025 — תבדוק בתיעוד העדכני</td></tr>
</table>
<p>Multipart = <code>CreateMultipartUpload</code> → מעלים חלקים במקביל (ובכשל מנסים שוב רק את החלק שנכשל) → <code>CompleteMultipartUpload</code> עם רשימת ה-ETags של החלקים. החשבון חשוב: ב-8 MiB לחלק, 10,000 חלקים מגבילים אותך ל-~78 GiB, אז קובץ של 100 GiB היה צריך 12,800 חלקים — ה-CLI וה-SDKs מגדילים את גודל החלק אוטומטית, ה-uploader שכתבת לבד אולי לא. כדי להגיע ל-5 TB צריך חלקים של ~525 MiB לפחות.</p>
<p>העלאה שהתחילה ואף פעם לא הושלמה או בוטלה שומרת את החלקים שלה — <strong>לא נראית ב-<code>aws s3 ls</code> אבל מחויבת</strong>. לכל bucket צריך להיות lifecycle rule של <code>AbortIncompleteMultipartUpload</code> (ראה cloud-storage-lifecycle). למצוא אותן:</p>
<pre>$ aws s3api list-multipart-uploads --bucket acme-media \
    --query 'Uploads[].{Key:Key,Started:Initiated,Id:UploadId}' --output table
$ aws s3api abort-multipart-upload --bucket acme-media --key raw/big.mov --upload-id 2~fYk...</pre>
<p><strong>Presigned URLs</strong> נותנים ללקוח בלי credentials של AWS לעשות GET או PUT לאובייקט ספציפי אחד לזמן מוגבל. ה-backend שלך חותם (SigV4) עם ה-credentials שלו; לא צריך שום קריאת רשת ל-AWS כדי לחתום:</p>
<pre>$ aws s3 presign s3://acme-media/videos/launch.mp4 --expires-in 900
https://acme-media.s3.eu-west-1.amazonaws.com/videos/launch.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &amp;X-Amz-Credential=ASIA...%2F20261114%2Feu-west-1%2Fs3%2Faws4_request&amp;X-Amz-Date=20261114T101500Z
  &amp;X-Amz-Expires=900&amp;X-Amz-Security-Token=...&amp;X-Amz-SignedHeaders=host&amp;X-Amz-Signature=5f1c...

# Python: browser uploads straight to S3, your API never touches the bytes
url = s3.generate_presigned_url("put_object",
        Params={"Bucket": "acme-uploads", "Key": f"u/{user_id}/{uuid4()}.jpg",
                "ContentType": "image/jpeg"}, ExpiresIn=300)</pre>
<p>כללים: תוקף מקסימלי של 7 ימים עם credentials קבועים, אבל URL שנחתם עם credentials זמניים (STS/role) מת כשה-credentials פגים — URL שנחתם ב-Lambda "לשבעה ימים" יכול להפסיק לעבוד אחרי כמה שעות. Presigned URL הוא bearer token: מי שמחזיק אותו יכול להשתמש בו, אז תשמור על תוקף קצר, תחתום על keys מדויקים, ותשתמש ב-<strong>presigned POST</strong> כשאתה צריך לאכוף <code>content-length-range</code> או prefix של key.</p>
<p><strong>קצב בקשות:</strong> לפחות 3,500 PUT/COPY/POST/DELETE ו-5,500 GET/HEAD בשנייה <em>לכל prefix מחולק</em>, עם scaling אוטומטי מאחורי הקלעים ו-<code>503 SlowDown</code> זמני בזמן הפיצול. 10 prefixes ≈ 55,000 GET בשנייה. לאובייקט חם אחד שאלפי לקוחות קוראים, שמים CloudFront מלפנים.</p>`
      )
    },
    {
      h: t("Access control: IAM, bucket policies, ACLs off, Block Public Access, access points", "הרשאות: IAM, bucket policies, ACLs כבויים, Block Public Access, access points"),
      body: t(
`<p>Four layers decide whether a request is allowed. <strong>An explicit Deny anywhere wins.</strong> Otherwise:</p>
<table>
<tr><th>Caller</th><th>Needs</th></tr>
<tr><td>Same account</td><td>Allow in the <strong>IAM policy OR</strong> the <strong>bucket policy</strong></td></tr>
<tr><td>Other account</td><td>Allow in the bucket policy <strong>AND</strong> in the caller's own IAM policy</td></tr>
<tr><td>Anonymous</td><td>Public bucket policy — blocked by Block Public Access</td></tr>
<tr><td>Everyone</td><td>Also must pass SCPs/RCPs (Organizations), VPC endpoint policies, and KMS key policy for SSE-KMS objects</td></tr>
</table>
<ul>
<li><strong>ACLs</strong>: the 2006-era per-object grant system. Since April 2023 new buckets default to <strong>Object Ownership = Bucket owner enforced</strong>: ACLs are disabled and the bucket owner owns every object, even ones uploaded by other accounts. Keep it that way.</li>
<li><strong>Block Public Access (BPA)</strong>: four switches (<code>BlockPublicAcls</code>, <code>IgnorePublicAcls</code>, <code>BlockPublicPolicy</code>, <code>RestrictPublicBuckets</code>) at the bucket and the <strong>account</strong> level; on by default for new buckets since April 2023. Turn them on at the account level so nobody can make a bucket public by accident. Static websites go behind CloudFront with Origin Access Control instead of a public bucket.</li>
<li><strong>Access points</strong>: named network endpoints on a bucket, each with its own policy (and optionally VPC-only). Instead of one 400-line bucket policy for 30 teams, give each app an access point scoped to its prefix and delegate from the bucket policy.</li>
</ul>
<pre>{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "DenyNonTLS", "Effect": "Deny", "Principal": "*", "Action": "s3:*",
      "Resource": ["arn:aws:s3:::acme-data", "arn:aws:s3:::acme-data/*"],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } } },
    { "Sid": "OnlyFromOurVpcEndpoint", "Effect": "Deny", "Principal": "*",
      "Action": ["s3:GetObject", "s3:PutObject"], "Resource": "arn:aws:s3:::acme-data/*",
      "Condition": { "StringNotEquals": { "aws:SourceVpce": "vpce-0a1b2c3d4e5f" } } },
    { "Sid": "AnalyticsAccountReadReports", "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::444455556666:role/athena-reader" },
      "Action": "s3:GetObject", "Resource": "arn:aws:s3:::acme-data/reports/*" }
  ]
}</pre>
<pre>$ aws s3control put-public-access-block --account-id 111122223333 \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
$ aws s3api get-bucket-policy-status --bucket acme-data
{ "PolicyStatus": { "IsPublic": false } }</pre>
<blockquote>⚠️ Production tip: a <code>Deny</code> on <code>aws:SourceVpce</code> also blocks the console, CI and your own laptop — add an exception for an admin role (<code>aws:PrincipalArn</code>) <em>before</em> applying, or you'll need the root user to delete the policy. IAM Access Analyzer flags buckets shared outside your account or organization; check it after every policy change.</blockquote>`,
`<p>ארבע שכבות מחליטות אם בקשה מותרת. <strong>Deny מפורש בכל מקום מנצח.</strong> אחרת:</p>
<table>
<tr><th>מי קורא</th><th>מה צריך</th></tr>
<tr><td>אותו account</td><td>Allow ב-<strong>IAM policy או</strong> ב-<strong>bucket policy</strong></td></tr>
<tr><td>Account אחר</td><td>Allow ב-bucket policy <strong>וגם</strong> ב-IAM policy של הקורא עצמו</td></tr>
<tr><td>אנונימי</td><td>Bucket policy ציבורי — נחסם ע"י Block Public Access</td></tr>
<tr><td>כולם</td><td>חייבים לעבור גם SCPs/RCPs (Organizations), VPC endpoint policies, ו-key policy של KMS לאובייקטים עם SSE-KMS</td></tr>
</table>
<ul>
<li><strong>ACLs</strong>: מערכת ההרשאות לכל אובייקט מ-2006. מאפריל 2023 buckets חדשים מוגדרים כברירת מחדל ל-<strong>Object Ownership = Bucket owner enforced</strong>: ה-ACLs כבויים וה-bucket owner הוא הבעלים של כל אובייקט, גם כאלה שהועלו מ-accounts אחרים. תשאיר את זה ככה.</li>
<li><strong>Block Public Access (BPA)</strong>: ארבעה מתגים (<code>BlockPublicAcls</code>, <code>IgnorePublicAcls</code>, <code>BlockPublicPolicy</code>, <code>RestrictPublicBuckets</code>) ברמת ה-bucket וברמת ה-<strong>account</strong>; דלוקים כברירת מחדל ב-buckets חדשים מאפריל 2023. תדליק אותם ברמת ה-account כדי שאף אחד לא יהפוך bucket לציבורי בטעות. אתרים סטטיים שמים מאחורי CloudFront עם Origin Access Control במקום bucket ציבורי.</li>
<li><strong>Access points</strong>: נקודות קצה רשתיות עם שם על bucket, לכל אחת policy משלה (ואפשר רק מתוך VPC). במקום bucket policy אחד של 400 שורות ל-30 צוותים, נותנים לכל אפליקציה access point שמוגבל ל-prefix שלה ומאצילים אליו מה-bucket policy.</li>
</ul>
<pre>{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "DenyNonTLS", "Effect": "Deny", "Principal": "*", "Action": "s3:*",
      "Resource": ["arn:aws:s3:::acme-data", "arn:aws:s3:::acme-data/*"],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } } },
    { "Sid": "OnlyFromOurVpcEndpoint", "Effect": "Deny", "Principal": "*",
      "Action": ["s3:GetObject", "s3:PutObject"], "Resource": "arn:aws:s3:::acme-data/*",
      "Condition": { "StringNotEquals": { "aws:SourceVpce": "vpce-0a1b2c3d4e5f" } } },
    { "Sid": "AnalyticsAccountReadReports", "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::444455556666:role/athena-reader" },
      "Action": "s3:GetObject", "Resource": "arn:aws:s3:::acme-data/reports/*" }
  ]
}</pre>
<pre>$ aws s3control put-public-access-block --account-id 111122223333 \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
$ aws s3api get-bucket-policy-status --bucket acme-data
{ "PolicyStatus": { "IsPublic": false } }</pre>
<blockquote>⚠️ טיפ לפרודקשן: <code>Deny</code> על <code>aws:SourceVpce</code> חוסם גם את ה-console, את ה-CI ואת הלפטופ שלך — תוסיף חריג ל-role של admin (<code>aws:PrincipalArn</code>) <em>לפני</em> שאתה מחיל, אחרת תצטרך את ה-root user כדי למחוק את ה-policy. IAM Access Analyzer מסמן buckets שמשותפים מחוץ ל-account או לארגון שלך; תבדוק אותו אחרי כל שינוי policy.</blockquote>`
      )
    },
    {
      h: t("Encryption: SSE-S3, SSE-KMS with Bucket Keys, SSE-C", "הצפנה: SSE-S3, SSE-KMS עם Bucket Keys, SSE-C"),
      body: t(
`<table>
<tr><th>Mode</th><th>Who holds the key</th><th>What it adds</th><th>Cost / limits</th></tr>
<tr><td><strong>SSE-S3</strong> (AES-256)</td><td>S3, fully managed</td><td>Encryption at rest. <strong>Default for every new object since January 2023.</strong></td><td>Free</td></tr>
<tr><td><strong>SSE-KMS</strong></td><td>AWS KMS key (AWS-managed or your customer-managed key)</td><td>A second permission gate (<code>kms:Decrypt</code>), CloudTrail log of every key use, key rotation, can disable the key = crypto-shred</td><td>$0.03 per 10,000 KMS requests; KMS request quotas (thousands to tens of thousands per second per region, shared)</td></tr>
<tr><td><strong>DSSE-KMS</strong></td><td>KMS, two layers</td><td>Dual-layer encryption for compliance regimes that demand it</td><td>More KMS cost</td></tr>
<tr><td><strong>SSE-C</strong></td><td>You send the key with every request; S3 never stores it</td><td>Key never at rest in AWS</td><td>Lose the key = lose the data; HTTPS required</td></tr>
</table>
<p>The SSE-KMS trap is request volume. Without Bucket Keys, every PUT calls <code>GenerateDataKey</code> and every GET calls <code>Decrypt</code>. 100 million GETs a month = 100M / 10,000 × $0.03 = <strong>$300/month</strong> in KMS alone, plus throttling (<code>ThrottlingException</code> surfacing as S3 503s) during spikes. An <strong>S3 Bucket Key</strong> makes S3 derive a short-lived bucket-level key from KMS and reuse it for many objects, cutting KMS calls by up to 99% (→ ~$3/month). Turn it on with the default encryption:</p>
<pre>$ aws s3api put-bucket-encryption --bucket acme-data --server-side-encryption-configuration '{
  "Rules": [{ "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": "arn:aws:kms:eu-west-1:111122223333:key/1a2b3c4d-..." },
              "BucketKeyEnabled": true }] }'
$ aws s3 cp report.parquet s3://acme-data/reports/ --sse aws:kms</pre>
<p>Why bother with KMS if SSE-S3 is free? Because SSE-KMS turns "can read the bucket" into "can read the bucket <em>and</em> use this key". A leaked role with <code>s3:GetObject</code> but no <code>kms:Decrypt</code> gets <code>AccessDenied</code>. Cross-account reads need the key policy to allow the other account too — the #1 cause of "the bucket policy allows it but I still get AccessDenied".</p>
<blockquote>⚠️ Production tip: in January 2025 the "Codefinger" ransomware campaign used stolen AWS keys to re-encrypt victims' objects with SSE-C using an attacker-held key, then set lifecycle rules to delete them in 7 days. AWS can't decrypt SSE-C data for you. If you don't use SSE-C, deny it in the bucket policy (condition on <code>s3:x-amz-server-side-encryption-customer-algorithm</code> being present), keep versioning + Object Lock on critical buckets, and never use long-lived access keys.</blockquote>`,
`<table>
<tr><th>מצב</th><th>מי מחזיק את המפתח</th><th>מה זה מוסיף</th><th>עלות / מגבלות</th></tr>
<tr><td><strong>SSE-S3</strong> (AES-256)</td><td>S3, מנוהל לגמרי</td><td>הצפנה at rest. <strong>ברירת המחדל לכל אובייקט חדש מינואר 2023.</strong></td><td>בחינם</td></tr>
<tr><td><strong>SSE-KMS</strong></td><td>מפתח KMS (AWS-managed או customer-managed שלך)</td><td>שער הרשאות שני (<code>kms:Decrypt</code>), לוג ב-CloudTrail לכל שימוש במפתח, rotation, וכיבוי המפתח = crypto-shred</td><td>$0.03 ל-10,000 בקשות KMS; quotas של KMS (אלפים עד עשרות אלפים בשנייה ל-region, משותפים)</td></tr>
<tr><td><strong>DSSE-KMS</strong></td><td>KMS, שתי שכבות</td><td>הצפנה כפולה לרגולציות שדורשות את זה</td><td>יותר עלות KMS</td></tr>
<tr><td><strong>SSE-C</strong></td><td>אתה שולח את המפתח בכל בקשה; S3 לא שומר אותו</td><td>המפתח אף פעם לא נשמר ב-AWS</td><td>איבדת את המפתח = איבדת את המידע; חובה HTTPS</td></tr>
</table>
<p>המלכודת של SSE-KMS היא כמות הבקשות. בלי Bucket Keys, כל PUT קורא ל-<code>GenerateDataKey</code> וכל GET קורא ל-<code>Decrypt</code>. 100 מיליון GET בחודש = 100M / 10,000 × $0.03 = <strong>$300 לחודש</strong> רק על KMS, ועוד throttling (<code>ThrottlingException</code> שמופיע כ-503 של S3) בזמן קפיצות. <strong>S3 Bucket Key</strong> גורם ל-S3 לגזור מ-KMS מפתח קצר-חיים ברמת ה-bucket ולהשתמש בו להרבה אובייקטים, וזה חותך את קריאות ה-KMS בעד 99% (→ ~$3 לחודש). מדליקים אותו יחד עם ה-default encryption:</p>
<pre>$ aws s3api put-bucket-encryption --bucket acme-data --server-side-encryption-configuration '{
  "Rules": [{ "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": "arn:aws:kms:eu-west-1:111122223333:key/1a2b3c4d-..." },
              "BucketKeyEnabled": true }] }'
$ aws s3 cp report.parquet s3://acme-data/reports/ --sse aws:kms</pre>
<p>למה להתעסק עם KMS אם SSE-S3 בחינם? כי SSE-KMS הופך את "יכול לקרוא את ה-bucket" ל"יכול לקרוא את ה-bucket <em>וגם</em> להשתמש במפתח הזה". Role שדלף עם <code>s3:GetObject</code> אבל בלי <code>kms:Decrypt</code> מקבל <code>AccessDenied</code>. קריאות בין accounts צריכות שגם ה-key policy ירשה את ה-account השני — הסיבה מספר 1 ל"ה-bucket policy מרשה ובכל זאת אני מקבל AccessDenied".</p>
<blockquote>⚠️ טיפ לפרודקשן: בינואר 2025 קמפיין ה-ransomware "Codefinger" השתמש במפתחות AWS גנובים כדי להצפין מחדש אובייקטים של קורבנות עם SSE-C ומפתח שנמצא אצל התוקף, ואז הגדיר lifecycle rules שמוחקים אותם תוך 7 ימים. AWS לא יכולים לפענח בשבילך מידע של SSE-C. אם אתה לא משתמש ב-SSE-C, תחסום אותו ב-bucket policy (תנאי על כך ש-<code>s3:x-amz-server-side-encryption-customer-algorithm</code> קיים), תשאיר versioning ו-Object Lock על buckets קריטיים, ואף פעם אל תשתמש ב-access keys ארוכי טווח.</blockquote>`
      )
    },
    {
      h: t("Events and the newer S3 family: EventBridge, Express One Zone, Tables", "Events ומשפחת S3 החדשה: EventBridge, Express One Zone, Tables"),
      body: t(
`<p>S3 can announce changes so you don't poll with LIST:</p>
<table>
<tr><th></th><th>S3 Event Notifications</th><th>Amazon EventBridge</th></tr>
<tr><td>Targets</td><td>SQS, SNS, Lambda</td><td>20+ targets (Step Functions, API destinations, other accounts/buses…)</td></tr>
<tr><td>Filtering</td><td>Prefix + suffix only</td><td>Rich content filtering (key patterns, size, metadata)</td></tr>
<tr><td>Fan-out</td><td>Overlapping prefix rules for the same event type aren't allowed</td><td>Any number of rules on the same event</td></tr>
<tr><td>Extras</td><td>Simple, cheapest</td><td>Archive &amp; replay, schema registry</td></tr>
</table>
<p>Both are <strong>at-least-once</strong> and <strong>unordered</strong>: a consumer can see the same <code>ObjectCreated</code> twice or a DELETE before the PUT it follows. Use the object's <code>sequencer</code> field or version ID to discard stale events, and make processing idempotent.</p>
<pre>$ aws s3api put-bucket-notification-configuration --bucket acme-uploads \
    --notification-configuration '{"EventBridgeConfiguration": {}}'
# EventBridge rule pattern:
{ "source": ["aws.s3"], "detail-type": ["Object Created"],
  "detail": { "bucket": { "name": ["acme-uploads"] },
              "object": { "key": [{ "prefix": "u/" }], "size": [{ "numeric": ["&gt;", 0] }] } } }</pre>
<blockquote>⚠️ Production tip: the classic S3 + Lambda bill-shock is the recursive loop — a Lambda triggered on <code>uploads/</code> writes a thumbnail back to <code>uploads/</code>, triggering itself millions of times. Write outputs to a different bucket or prefix that the trigger doesn't match. Lambda now detects and stops some S3 recursion, but don't rely on it.</blockquote>
<p><strong>The newer members:</strong></p>
<ul>
<li><strong>S3 Express One Zone</strong>: "directory buckets" in a single AZ you choose (<code>mybucket--euw1-az1--x-s3</code>), consistent single-digit-millisecond latency, up to ~10× faster than Standard and cheaper per request, but pricier per GB and only one AZ of resilience. For ML training data, Spark shuffle, and hot intermediate data next to compute.</li>
<li><strong>Conditional writes</strong> (2024): <code>If-None-Match: *</code> (create only if absent) and <code>If-Match: &lt;etag&gt;</code> (compare-and-swap) — S3 can now be the lock/commit point for table formats and leader election.</li>
<li><strong>S3 Tables</strong>: "table buckets" that store Apache Iceberg tables with automatic compaction and snapshot cleanup, queryable from Athena/Spark/Trino. <strong>S3 Vectors</strong> stores embeddings for RAG at object-storage prices.</li>
<li><strong>S3 Object Lambda</strong>: transforms an object on GET through a Lambda (redact PII, resize). AWS stopped onboarding new customers to it in late 2025 — for new designs put the transform behind CloudFront or your own API.</li>
</ul>`,
`<p>S3 יכול להודיע על שינויים כדי שלא תצטרך לעשות polling עם LIST:</p>
<table>
<tr><th></th><th>S3 Event Notifications</th><th>Amazon EventBridge</th></tr>
<tr><td>יעדים</td><td>SQS, SNS, Lambda</td><td>יותר מ-20 יעדים (Step Functions, API destinations, accounts/buses אחרים…)</td></tr>
<tr><td>סינון</td><td>רק prefix ו-suffix</td><td>סינון עשיר לפי תוכן (תבניות key, גודל, metadata)</td></tr>
<tr><td>Fan-out</td><td>אסור rules עם prefixes חופפים לאותו סוג event</td><td>כמה rules שרוצים על אותו event</td></tr>
<tr><td>תוספות</td><td>פשוט, הכי זול</td><td>Archive ו-replay, schema registry</td></tr>
</table>
<p>שניהם <strong>at-least-once</strong> ו-<strong>בלי סדר מובטח</strong>: צרכן יכול לראות את אותו <code>ObjectCreated</code> פעמיים, או DELETE לפני ה-PUT שהוא בא אחריו. תשתמש בשדה <code>sequencer</code> של האובייקט או ב-version ID כדי לזרוק events ישנים, ותעשה את העיבוד idempotent.</p>
<pre>$ aws s3api put-bucket-notification-configuration --bucket acme-uploads \
    --notification-configuration '{"EventBridgeConfiguration": {}}'
# EventBridge rule pattern:
{ "source": ["aws.s3"], "detail-type": ["Object Created"],
  "detail": { "bucket": { "name": ["acme-uploads"] },
              "object": { "key": [{ "prefix": "u/" }], "size": [{ "numeric": ["&gt;", 0] }] } } }</pre>
<blockquote>⚠️ טיפ לפרודקשן: הלולאה הרקורסיבית היא ה-bill shock הקלאסי של S3 ו-Lambda — Lambda שמופעלת על <code>uploads/</code> כותבת thumbnail בחזרה ל-<code>uploads/</code> ומפעילה את עצמה מיליוני פעמים. תכתוב את הפלט ל-bucket או prefix אחר שה-trigger לא תופס. Lambda היום מזהה ועוצרת חלק מהרקורסיות של S3, אבל אל תסמוך על זה.</blockquote>
<p><strong>החברים החדשים:</strong></p>
<ul>
<li><strong>S3 Express One Zone</strong>: "directory buckets" ב-AZ אחד שאתה בוחר (<code>mybucket--euw1-az1--x-s3</code>), latency עקבי של ms בודדים, עד פי ~10 מהיר יותר מ-Standard וזול יותר לבקשה, אבל יקר יותר ל-GB ועם עמידות של AZ אחד בלבד. מתאים לדאטה של אימון ML, ל-shuffle של Spark ולמידע ביניים חם ליד ה-compute.</li>
<li><strong>Conditional writes</strong> (2024): <code>If-None-Match: *</code> (ליצור רק אם לא קיים) ו-<code>If-Match: &lt;etag&gt;</code> (compare-and-swap) — S3 יכול עכשיו להיות נקודת ה-lock/commit לפורמטים של טבלאות ול-leader election.</li>
<li><strong>S3 Tables</strong>: "table buckets" ששומרים טבלאות Apache Iceberg עם compaction וניקוי snapshots אוטומטיים, וניתנים לשאילתה מ-Athena/Spark/Trino. <strong>S3 Vectors</strong> שומר embeddings ל-RAG במחירי object storage.</li>
<li><strong>S3 Object Lambda</strong>: משנה אובייקט ב-GET דרך Lambda (השחרת PII, שינוי גודל). AWS הפסיקו לקלוט לקוחות חדשים לשירות בסוף 2025 — בתכנונים חדשים שמים את ההמרה מאחורי CloudFront או API משלך.</li>
</ul>`
      )
    },
    {
      h: t("S3-compatible stores, cross-cloud differences, and famous leaks", "מאגרים תואמי S3, הבדלים בין עננים, ודליפות מפורסמות"),
      body: t(
`<table>
<tr><th></th><th>AWS S3</th><th>Google Cloud Storage</th><th>Azure Blob Storage</th><th>Cloudflare R2</th><th>MinIO / Ceph RGW</th></tr>
<tr><td>Hierarchy</td><td>bucket / key</td><td>bucket / object (optional hierarchical namespace)</td><td>storage account / container / blob; ADLS Gen2 = real directories + atomic rename</td><td>bucket / key</td><td>bucket / key</td></tr>
<tr><td>API</td><td>S3</td><td>JSON/XML API; XML is largely S3-compatible (HMAC keys)</td><td>Blob REST API (not S3)</td><td>S3-compatible</td><td>S3-compatible, self-hosted</td></tr>
<tr><td>Temporary access</td><td>Presigned URL</td><td>Signed URL</td><td>SAS token</td><td>Presigned URL</td><td>Presigned URL</td></tr>
<tr><td>Scaling guidance</td><td>3,500 W / 5,500 R per second per prefix</td><td>Start ~1,000 W / 5,000 R per second, ramp up gradually</td><td>Per storage-account limits (e.g. ~20,000 req/s default)</td><td>Managed</td><td>Your hardware</td></tr>
<tr><td>Egress</td><td>~$0.09/GB to internet</td><td>Similar</td><td>Similar</td><td><strong>$0 egress</strong></td><td>Your bandwidth</td></tr>
</table>
<p>"S3-compatible" usually means the core object API (PUT/GET/LIST/multipart/presign) works; features like Object Lock, event notifications, lifecycle transitions, SSE-KMS or bucket policies may be partial or different. MinIO was the default self-hosted choice for years; its community edition was cut back in 2025 (admin console features removed, source-only releases), so check licensing before you build on it — Ceph RGW, Garage and SeaweedFS are the usual alternatives.</p>
<p><strong>Famous S3 incidents and what they teach:</strong></p>
<table>
<tr><th>Incident</th><th>What happened</th><th>Lesson</th></tr>
<tr><td>Deep Root Analytics (2017)</td><td>A public bucket exposed ~198 million US voter records</td><td>Account-level Block Public Access; Macie / Access Analyzer scans</td></tr>
<tr><td>Verizon via a partner (2017)</td><td>A vendor's public bucket held ~14 million customer records</td><td>Your data in a third party's bucket is still your breach — audit vendors</td></tr>
<tr><td>Capital One (2019)</td><td>SSRF through a misconfigured WAF → EC2 metadata service (IMDSv1) → role credentials → bulk S3 reads; ~106 million people affected, $80M regulator fine</td><td>IMDSv2, least-privilege instance roles, alert on unusual <code>ListBuckets</code>/GET volume (GuardDuty, CloudTrail data events)</td></tr>
<tr><td>S3 us-east-1 outage (Feb 2017)</td><td>A typo in a playbook command removed more capacity than intended; S3 in us-east-1 was down ~4 hours, taking half the internet with it</td><td>Durability ≠ availability; multi-region for critical paths</td></tr>
</table>
<pre>$ aws s3 sync ./site s3://acme-web --delete --exclude ".git/*" --size-only
$ aws s3 ls s3://acme-logs/app/2026/11/ --recursive --summarize --human-readable | tail -2
Total Objects: 184213
   Total Size: 412.7 GiB
$ aws s3api list-object-versions --bucket acme-data --prefix reports/q3.csv \
    --query '{V:Versions[].[VersionId,IsLatest,LastModified],D:DeleteMarkers[].[VersionId,IsLatest]}'
$ aws s3api get-object --bucket acme-data --key reports/q3.csv --version-id 3HL4kq... q3-restored.csv</pre>`,
`<table>
<tr><th></th><th>AWS S3</th><th>Google Cloud Storage</th><th>Azure Blob Storage</th><th>Cloudflare R2</th><th>MinIO / Ceph RGW</th></tr>
<tr><td>היררכיה</td><td>bucket / key</td><td>bucket / object (אפשר hierarchical namespace)</td><td>storage account / container / blob; ADLS Gen2 = תיקיות אמיתיות ו-rename אטומי</td><td>bucket / key</td><td>bucket / key</td></tr>
<tr><td>API</td><td>S3</td><td>JSON/XML API; ה-XML ברובו תואם S3 (HMAC keys)</td><td>Blob REST API (לא S3)</td><td>תואם S3</td><td>תואם S3, ב-self-hosting</td></tr>
<tr><td>גישה זמנית</td><td>Presigned URL</td><td>Signed URL</td><td>SAS token</td><td>Presigned URL</td><td>Presigned URL</td></tr>
<tr><td>הנחיות scaling</td><td>3,500 W / 5,500 R בשנייה לכל prefix</td><td>מתחילים ב-~1,000 W / 5,000 R בשנייה ומעלים בהדרגה</td><td>מגבלות לכל storage account (למשל ~20,000 req/s כברירת מחדל)</td><td>מנוהל</td><td>החומרה שלך</td></tr>
<tr><td>Egress</td><td>~$0.09 ל-GB לאינטרנט</td><td>דומה</td><td>דומה</td><td><strong>$0 egress</strong></td><td>רוחב הפס שלך</td></tr>
</table>
<p>"תואם S3" בדרך כלל אומר שה-API הבסיסי (PUT/GET/LIST/multipart/presign) עובד; יכולות כמו Object Lock, event notifications, lifecycle transitions, SSE-KMS או bucket policies יכולות להיות חלקיות או שונות. MinIO היה הבחירה הדיפולטית ל-self-hosting במשך שנים; ה-community edition שלו קוצץ ב-2025 (יכולות admin הוסרו מה-console, שחרורים רק כקוד מקור), אז תבדוק רישוי לפני שאתה בונה עליו — Ceph RGW, Garage ו-SeaweedFS הם החלופות הנפוצות.</p>
<p><strong>תקריות S3 מפורסמות ומה הן מלמדות:</strong></p>
<table>
<tr><th>תקרית</th><th>מה קרה</th><th>הלקח</th></tr>
<tr><td>Deep Root Analytics (2017)</td><td>Bucket ציבורי חשף ~198 מיליון רשומות של בוחרים בארה"ב</td><td>Block Public Access ברמת ה-account; סריקות של Macie / Access Analyzer</td></tr>
<tr><td>Verizon דרך שותף (2017)</td><td>Bucket ציבורי של ספק החזיק ~14 מיליון רשומות לקוחות</td><td>המידע שלך ב-bucket של צד שלישי הוא עדיין הדליפה שלך — תעשה audit לספקים</td></tr>
<tr><td>Capital One (2019)</td><td>SSRF דרך WAF שהוגדר לא נכון → שירות ה-metadata של EC2 (IMDSv1) → credentials של role → קריאה המונית מ-S3; ~106 מיליון אנשים נפגעו, קנס רגולטורי של $80M</td><td>IMDSv2, instance roles עם least privilege, התראה על נפח חריג של <code>ListBuckets</code>/GET (GuardDuty, CloudTrail data events)</td></tr>
<tr><td>נפילת S3 ב-us-east-1 (פברואר 2017)</td><td>טעות הקלדה בפקודה מתוך playbook הסירה יותר קיבולת מהמתוכנן; S3 ב-us-east-1 היה למטה ~4 שעות והפיל איתו חצי אינטרנט</td><td>Durability ≠ availability; multi-region לנתיבים קריטיים</td></tr>
</table>
<pre>$ aws s3 sync ./site s3://acme-web --delete --exclude ".git/*" --size-only
$ aws s3 ls s3://acme-logs/app/2026/11/ --recursive --summarize --human-readable | tail -2
Total Objects: 184213
   Total Size: 412.7 GiB
$ aws s3api list-object-versions --bucket acme-data --prefix reports/q3.csv \
    --query '{V:Versions[].[VersionId,IsLatest,LastModified],D:DeleteMarkers[].[VersionId,IsLatest]}'
$ aws s3api get-object --bucket acme-data --key reports/q3.csv --version-id 3HL4kq... q3-restored.csv</pre>`
      )
    }
  ],
  diagram: `PUT s3://acme-media/videos/launch.mp4   (one flat key, '/' is just a character)
        |
   IAM policy OR bucket policy allow?  -- explicit Deny anywhere --> 403
   Block Public Access / SCP / VPC endpoint policy / KMS key policy
        |
   multipart: Create -> UploadPart x N (5 MiB..5 GiB, N <= 10,000, parallel) -> Complete
        |
   encrypt (SSE-S3 default | SSE-KMS + Bucket Key | SSE-C) -> store across >= 3 AZs (11 nines)
        |
   strong read-after-write: next GET/LIST sees it
        |
   event --> SQS / SNS / Lambda   or   EventBridge --> many rules   (at-least-once, unordered)

browser --(1) ask API for upload URL--> backend --(2) sign SigV4, no AWS call--> presigned URL
browser --(3) PUT bytes directly------------------------------------------------> S3`,
  handsOn: [
    { cmd: "aws s3api head-object --bucket <bucket> --key <key>", what: t("Inspect size, ETag (multipart '-N' suffix), version, storage class and encryption of one object.", "בודק גודל, ETag (סיומת '-N' של multipart), גרסה, storage class והצפנה של אובייקט אחד.") },
    { cmd: "aws s3api list-multipart-uploads --bucket <bucket>", what: t("Find invisible, billed incomplete multipart uploads; then add an AbortIncompleteMultipartUpload lifecycle rule.", "מוצא העלאות multipart לא גמורות שלא רואים אבל משלמים עליהן; ואז מוסיף lifecycle rule של AbortIncompleteMultipartUpload.") },
    { cmd: "aws s3 presign s3://<bucket>/<key> --expires-in 300", what: t("Generate a 5-minute download link and open it in a private browser window — then try it after expiry.", "מייצר קישור הורדה ל-5 דקות ופותח אותו בחלון גלישה פרטי — ואז מנסה שוב אחרי שפג תוקפו.") },
    { cmd: "aws s3control get-public-access-block --account-id $(aws sts get-caller-identity --query Account --output text)", what: t("Verify Block Public Access is on for the whole account.", "מוודא ש-Block Public Access דלוק לכל ה-account.") },
    { cmd: "aws s3api get-bucket-encryption --bucket <bucket>", what: t("Check default encryption and whether BucketKeyEnabled is true for SSE-KMS buckets.", "בודק את ה-default encryption והאם BucketKeyEnabled דלוק ב-buckets עם SSE-KMS.") }
  ],
  mnemonic: t(
    "Flat keys, strong reads, eleven nines. Parts 5 MiB-5 GiB × 10,000. Deny wins, ACLs off, BPA on. KMS? Add a Bucket Key.",
    "Keys שטוחים, קריאות חזקות, 11 תשיעיות. חלקים של 5 MiB עד 5 GiB × 10,000. Deny מנצח, ACLs כבויים, BPA דלוק. KMS? תוסיף Bucket Key."
  ),
  pitfalls: [
    t("Treating prefixes as folders: 'renaming' a prefix of millions of objects means millions of COPY + DELETE requests.", "להתייחס ל-prefixes כתיקיות: 'שינוי שם' ל-prefix של מיליוני אובייקטים זה מיליוני בקשות COPY + DELETE."),
    t("No AbortIncompleteMultipartUpload rule: failed uploads leave invisible parts that are billed forever.", "בלי rule של AbortIncompleteMultipartUpload: העלאות שנכשלו משאירות חלקים בלתי נראים שמחויבים לנצח."),
    t("SSE-KMS without Bucket Keys on a high-traffic bucket: KMS costs and throttling show up as S3 503s.", "SSE-KMS בלי Bucket Keys על bucket עם הרבה תעבורה: עלויות KMS ו-throttling מופיעים כ-503 של S3."),
    t("Signing presigned URLs with short-lived role credentials and promising users a 7-day link — it dies when the session expires.", "לחתום presigned URLs עם credentials קצרי-חיים של role ולהבטיח למשתמשים קישור ל-7 ימים — הוא מת כשה-session פג.")
  ],
  interview: [
    { q: t("How would you let users upload 2 GB videos from the browser without routing bytes through your API?", "איך תאפשר למשתמשים להעלות סרטונים של 2 GB מהדפדפן בלי להעביר את ה-bytes דרך ה-API שלך?"),
      a: t("The API authenticates the user and returns presigned URLs: for large files, start a multipart upload server-side and presign each UploadPart (e.g. 64 MiB parts → 32 parts), the browser PUTs parts in parallel and the API completes the upload. Constrain key prefix and size (presigned POST or server-side validation), keep expiry short, add AbortIncompleteMultipartUpload, and trigger processing from an S3 event.", "ה-API מאמת את המשתמש ומחזיר presigned URLs: לקבצים גדולים, מתחילים multipart upload בצד השרת וחותמים כל UploadPart (למשל חלקים של 64 MiB → 32 חלקים), הדפדפן עושה PUT לחלקים במקביל וה-API משלים את ההעלאה. מגבילים prefix וגודל (presigned POST או ולידציה בשרת), שומרים על תוקף קצר, מוסיפים AbortIncompleteMultipartUpload, ומפעילים עיבוד מ-event של S3.") },
    { q: t("A role in account B gets AccessDenied reading an object in account A, though A's bucket policy allows B. What do you check?", "Role ב-account B מקבל AccessDenied כשהוא קורא אובייקט ב-account A, למרות שה-bucket policy של A מרשה ל-B. מה אתה בודק?"),
      a: t("Cross-account needs both sides: the role's own IAM policy in B must allow s3:GetObject on that ARN. If the object is SSE-KMS, the KMS key policy in A must allow B's role kms:Decrypt (and B's IAM must allow it). Then look for explicit denies: SCPs/RCPs, VPC endpoint policies, aws:SourceVpce conditions, and whether the object was written before Bucket owner enforced (old ACL ownership).", "בין accounts צריך את שני הצדדים: ה-IAM policy של ה-role ב-B חייב לאפשר s3:GetObject על ה-ARN הזה. אם האובייקט מוצפן ב-SSE-KMS, ה-key policy של KMS ב-A חייב לאפשר ל-role של B את kms:Decrypt (וגם ה-IAM של B). אחר כך מחפשים deny מפורש: SCPs/RCPs, VPC endpoint policies, תנאי aws:SourceVpce, והאם האובייקט נכתב לפני Bucket owner enforced (בעלות ישנה של ACL).") },
    { q: t("S3 promises 11 nines of durability. Why do you still need versioning and backups?", "S3 מבטיח 11 תשיעיות durability. למה עדיין צריך versioning וגיבויים?"),
      a: t("Durability protects against hardware loss, not against you: deletes, overwrites, a compromised key encrypting data with SSE-C, or a bad lifecycle rule are executed durably. Versioning plus Object Lock (compliance mode) protects against deletion and ransomware; replication to another account/region protects against account compromise and regional outages.", "Durability מגן מאובדן חומרה, לא ממך: מחיקות, דריסות, מפתח שנפרץ ומצפין מידע עם SSE-C, או lifecycle rule שגוי — כולם מתבצעים בעמידות מלאה. Versioning יחד עם Object Lock (compliance mode) מגנים ממחיקה ומ-ransomware; replication ל-account/region אחר מגן מפריצה ל-account ומנפילות של region.") }
  ],
  quiz: [
    { q: t("What does the '-88' at the end of an S3 ETag indicate?", "מה מציין ה-'-88' בסוף ETag של S3?"),
      options: [t("The object has 88 versions", "לאובייקט יש 88 גרסאות"), t("It was uploaded with multipart in 88 parts, so the ETag isn't the file's MD5", "הוא הועלה ב-multipart ב-88 חלקים, אז ה-ETag הוא לא ה-MD5 של הקובץ"), t("It is stored in 88 AZs", "הוא שמור ב-88 AZs"), t("It is encrypted with KMS key 88", "הוא מוצפן עם מפתח KMS מספר 88")],
      answer: 1,
      explain: t("Multipart ETags are an MD5 of the part MD5s plus '-<part count>'. Use x-amz-checksum headers for integrity.", "ETag של multipart הוא MD5 של ה-MD5-ים של החלקים ועוד '-<מספר חלקים>'. לבדיקת שלמות משתמשים ב-headers של x-amz-checksum.") },
    { q: t("Same account: the IAM policy allows s3:GetObject, the bucket policy says nothing about this role. Result?", "אותו account: ה-IAM policy מרשה s3:GetObject, וה-bucket policy לא אומר כלום על ה-role הזה. מה התוצאה?"),
      options: [t("Denied — the bucket policy must allow it too", "נחסם — גם ה-bucket policy חייב להרשות"), t("Allowed — within one account an allow in either IAM or the bucket policy is enough (absent explicit deny)", "מותר — בתוך account אחד מספיק allow ב-IAM או ב-bucket policy (כשאין deny מפורש)"), t("Allowed only if ACLs are enabled", "מותר רק אם ACLs דלוקים"), t("Denied unless Block Public Access is off", "נחסם אלא אם Block Public Access כבוי")],
      answer: 1,
      explain: t("Same-account access is the union of identity and resource policies. Cross-account needs both. Explicit Deny always wins.", "גישה באותו account היא איחוד של identity policies ו-resource policies. בין accounts צריך את שניהם. Deny מפורש תמיד מנצח.") },
    { q: t("A high-traffic bucket using SSE-KMS starts returning 503s and the KMS bill jumps. Best fix?", "Bucket עמוס תעבורה עם SSE-KMS מתחיל להחזיר 503 וחשבון ה-KMS קופץ. מה התיקון הכי טוב?"),
      options: [t("Switch to SSE-C", "לעבור ל-SSE-C"), t("Enable S3 Bucket Keys to cut KMS requests by up to 99%", "להדליק S3 Bucket Keys כדי לחתוך את בקשות ה-KMS בעד 99%"), t("Disable versioning", "לכבות versioning"), t("Add more prefixes only", "רק להוסיף עוד prefixes")],
      answer: 1,
      explain: t("Without Bucket Keys each GET/PUT is a KMS call, hitting KMS quotas and costing $0.03 per 10,000. Bucket Keys reuse a bucket-level data key.", "בלי Bucket Keys כל GET/PUT זו קריאה ל-KMS, שפוגעת ב-quotas של KMS ועולה $0.03 ל-10,000. Bucket Keys משתמשים מחדש במפתח ברמת ה-bucket.") },
    { q: t("What is the maximum number of parts in one S3 multipart upload, and the minimum non-final part size?", "מה המספר המקסימלי של חלקים בהעלאת multipart אחת ב-S3, ומה גודל החלק המינימלי (לא אחרון)?"),
      options: [t("1,000 parts, 1 MiB", "1,000 חלקים, 1 MiB"), t("10,000 parts, 5 MiB", "10,000 חלקים, 5 MiB"), t("100,000 parts, 5 MiB", "100,000 חלקים, 5 MiB"), t("10,000 parts, 100 MiB", "10,000 חלקים, 100 MiB")],
      answer: 1,
      explain: t("Parts are 5 MiB-5 GiB (last one can be smaller), up to 10,000 per upload — so large files need bigger parts.", "חלקים הם 5 MiB עד 5 GiB (האחרון יכול להיות קטן יותר), עד 10,000 להעלאה — אז קבצים גדולים צריכים חלקים גדולים יותר.") }
  ],
  related: ["cloud-storage", "cloud-storage-lifecycle", "storage-io", "cloud-iam-security", "crypto-encryption-practice", "flow-event-pipeline", "net-proxies-cdn"]
});

/* ------------------------------ glossary ------------------------------ */
INFRA.glossary.push(
  { term: "NVMe", track: "foundations", lesson: "disks-hdd-ssd-nvme",
    def: t("Storage protocol built for flash over PCIe: up to 65,535 queues × 65,536 commands, one queue pair per CPU core, microsecond latency.", "פרוטוקול אחסון שנבנה ל-flash מעל PCIe: עד 65,535 queues × 65,536 פקודות, זוג queues לכל core, latency של מיקרו-שניות.") },
  { term: "TRIM", track: "foundations", lesson: "disks-hdd-ssd-nvme",
    def: t("Command (Deallocate on NVMe, UNMAP on SCSI) telling an SSD which blocks the filesystem freed, so garbage collection stops copying dead data. On Linux: fstrim.timer.", "פקודה (Deallocate ב-NVMe, UNMAP ב-SCSI) שאומרת ל-SSD אילו blocks ה-filesystem שחרר, כדי שה-garbage collection יפסיק להעתיק מידע מת. בלינוקס: fstrim.timer.") },
  { term: "DWPD / TBW", track: "foundations", lesson: "disks-hdd-ssd-nvme",
    def: t("SSD endurance ratings: terabytes written over the warranty, or full drive writes per day. DWPD = TBW / (capacity × 365 × years).", "מדדי endurance של SSD: כמה terabytes אפשר לכתוב לאורך האחריות, או כמה פעמים לכתוב את כל הדיסק ביום. DWPD = TBW / (נפח × 365 × שנים).") },
  { term: "Copy-on-write (CoW) filesystem", track: "foundations", lesson: "filesystems-compared",
    def: t("Filesystem that never overwrites live blocks: it writes new ones and atomically swaps a pointer (ZFS, btrfs, APFS, ReFS) — enabling instant snapshots and per-block checksums.", "Filesystem שאף פעם לא דורס blocks חיים: הוא כותב חדשים ומחליף מצביע אטומית (ZFS, btrfs, APFS, ReFS) — מה שמאפשר snapshots מיידיים ו-checksums לכל block.") },
  { term: "NFS", track: "foundations", lesson: "filesystems-compared",
    def: t("Network File System: Unix shared filesystem over TCP 2049. v3 is stateless and trusts client UIDs; v4.x is stateful with locks, ACLs and optional Kerberos. EFS and Filestore speak it.", "Network File System: filesystem משותף של Unix מעל TCP 2049. v3 הוא stateless וסומך על ה-UID של הלקוח; v4.x הוא stateful עם נעילות, ACLs ו-Kerberos אופציונלי. EFS ו-Filestore מדברים אותו.") },
  { term: "SMB / CIFS", track: "foundations", lesson: "filesystems-compared",
    def: t("Windows file-sharing protocol on TCP 445 with AD/Kerberos auth and NTFS ACLs. Use SMB 3.x (encryption); CIFS/SMB1 is obsolete and was the WannaCry vector.", "פרוטוקול שיתוף הקבצים של Windows על TCP 445 עם אימות AD/Kerberos ו-NTFS ACLs. משתמשים ב-SMB 3.x (עם הצפנה); CIFS/SMB1 מת והיה וקטור ההתפשטות של WannaCry.") },
  { term: "URE (Unrecoverable Read Error)", track: "foundations", lesson: "raid-levels-deep",
    def: t("A sector the disk can't read even after ECC and retries. Spec'd around 1 per 10^14 bits (12.5 TB) on nearline HDDs — the reason big RAID 5 rebuilds are risky.", "Sector שהדיסק לא מצליח לקרוא גם אחרי ECC וניסיונות חוזרים. לפי מפרט בערך 1 ל-10^14 bits (12.5 TB) ב-HDD מסוג nearline — הסיבה ש-rebuilds גדולים של RAID 5 מסוכנים.") },
  { term: "RAID write hole", track: "foundations", lesson: "raid-levels-deep",
    def: t("Power loss between writing data and its parity leaves a stripe inconsistent, silently corrupting a later rebuild. Closed by battery-backed cache, md PPL/journal, or ZFS copy-on-write.", "נפילת חשמל בין כתיבת המידע לכתיבת ה-parity שלו משאירה stripe לא עקבי, שמשחית בשקט rebuild עתידי. נסגר ע\"י cache מגובה סוללה, PPL/journal של md, או copy-on-write של ZFS.") },
  { term: "RAID-Z", track: "foundations", lesson: "raid-levels-deep",
    def: t("ZFS parity RAID (Z1/Z2/Z3 = 1/2/3 parity disks) with variable-width copy-on-write stripes: no write hole, checksummed self-healing, resilvers only used data.", "RAID עם parity של ZFS (Z1/Z2/Z3 = 1/2/3 דיסקי parity) עם stripes ברוחב משתנה ב-copy-on-write: בלי write hole, ריפוי עצמי עם checksums, ו-resilver רק של מידע בשימוש.") },
  { term: "Presigned URL", track: "cloud", lesson: "s3-deep",
    def: t("A URL signed with SigV4 that grants GET/PUT on one object for a limited time (max 7 days, less with temporary credentials). A bearer token — anyone holding it can use it.", "URL שנחתם עם SigV4 ונותן GET/PUT על אובייקט אחד לזמן מוגבל (עד 7 ימים, פחות עם credentials זמניים). זה bearer token — כל מי שמחזיק אותו יכול להשתמש בו.") },
  { term: "S3 Block Public Access", track: "cloud", lesson: "s3-deep",
    def: t("Four account- and bucket-level switches that override any ACL or policy making S3 data public. On by default for new buckets since April 2023; enable at the account level.", "ארבעה מתגים ברמת account וברמת bucket שגוברים על כל ACL או policy שהופכים מידע ב-S3 לציבורי. דלוקים כברירת מחדל ב-buckets חדשים מאפריל 2023; מדליקים ברמת ה-account.") },
  { term: "S3 Bucket Key", track: "cloud", lesson: "s3-deep",
    def: t("SSE-KMS optimization: S3 derives a short-lived bucket-level key from KMS and reuses it for many objects, cutting KMS requests (cost and throttling) by up to 99%.", "אופטימיזציה ל-SSE-KMS: S3 גוזר מ-KMS מפתח קצר-חיים ברמת ה-bucket ומשתמש בו להרבה אובייקטים, וחותך את בקשות ה-KMS (עלות ו-throttling) בעד 99%.") }
);

/* ------------------------------ scenario ------------------------------ */
INFRA.scenarios.push({
  id: "raid5-rebuild-second-failure",
  icon: "💥",
  title: t("RAID 5 Rebuild Meets a Second Failure", "Rebuild של RAID 5 פוגש כשל שני"),
  start: "s1",
  steps: {
    s1: {
      text: t(
        "02:14, Friday. mdmonitor pages you: 'Fail event on /dev/sdd:/dev/md0' on nas-01 — the file server holding /srv/projects for 200 engineers. It's an mdadm RAID 5 of 6 × 8 TB nearline HDDs, about 4 years old, no hot spare. Users are still working (it's daytime in the US office).",
        "02:14, יום שישי. mdmonitor מקפיץ אותך: 'Fail event on /dev/sdd:/dev/md0' על nas-01 — שרת הקבצים שמחזיק את /srv/projects ל-200 מהנדסים. זה RAID 5 של mdadm עם 6 דיסקי HDD מסוג nearline של 8 TB, בני בערך 4 שנים, בלי hot spare. משתמשים עדיין עובדים (בארה\"ב עכשיו יום)."
      ),
      data: `$ cat /proc/mdstat
md0 : active raid5 sdg[5] sdf[4] sde[3] sdd[2](F) sdc[1] sdb[0]
      39062585340 blocks super 1.2 level 5, 512k chunk, algorithm 2 [6/5] [UU_UUU]
      bitmap: 6/59 pages [24KB], 65536KB chunk
unused devices: <none>`,
      choices: [
        { label: t("Before touching anything: check the state of backups and SMART on the five surviving disks.", "לפני שנוגעים במשהו: לבדוק את מצב הגיבויים ואת ה-SMART של חמשת הדיסקים ששרדו."), next: "s2", score: 10,
          feedback: t("Right. A degraded RAID 5 has zero redundancy left, and the rebuild is the riskiest operation it will ever run. Know your safety net first.", "נכון. ל-RAID 5 במצב degraded לא נשארה שום יתירות, וה-rebuild הוא הפעולה הכי מסוכנת שהוא יריץ אי פעם. קודם תכיר את רשת הביטחון שלך.") },
        { label: t("Hot-swap the dead disk and start the rebuild immediately at maximum speed.", "להחליף את הדיסק המת ב-hot-swap ולהתחיל rebuild מיד במהירות מקסימלית."), next: "s3", score: 3,
          feedback: t("Understandable instinct, but you've started reading 40 TB from aging disks without knowing whether a recent backup exists.", "אינסטינקט מובן, אבל התחלת לקרוא 40 TB מדיסקים מזדקנים בלי לדעת אם קיים גיבוי עדכני.") },
        { label: t("Run fsck -y on /dev/md0 to make sure the filesystem is fine.", "להריץ fsck -y על /dev/md0 כדי לוודא שה-filesystem בסדר."), next: "s2", score: 0,
          feedback: t("The filesystem isn't the problem — the array is. fsck -y on a live, degraded array means downtime plus a full read of the weak disks, and '-y' can 'repair' things destructively. Back to basics: backups and SMART.", "ה-filesystem הוא לא הבעיה — המערך כן. fsck -y על מערך חי ו-degraded זה downtime ועוד קריאה מלאה של הדיסקים החלשים, ו-'-y' יכול 'לתקן' דברים בצורה הרסנית. חזרה ליסודות: גיבויים ו-SMART.") }
      ]
    },
    s2: {
      text: t(
        "Two discoveries. The nightly restic backup to S3 has been failing for two days (a password rotation broke it, and nobody alerts on backup jobs). And /dev/sdf, one of the survivors, is far from healthy.",
        "שתי תגליות. הגיבוי הלילי של restic ל-S3 נכשל כבר יומיים (רוטציית סיסמה שברה אותו, ואף אחד לא מתריע על jobs של גיבוי). ו-/dev/sdf, אחד הדיסקים ששרדו, רחוק מלהיות בריא."
      ),
      data: `$ restic snapshots --latest 1
ID        Time                 Host    Paths
a1b2c3d4  2026-11-12 01:00:04  nas-01  /srv
$ journalctl -u restic-backup --since -2d | tail -1
Fatal: wrong password or no key found
$ sudo smartctl -A /dev/sdf | grep -E 'Realloc|Power_On|Pending|Offline'
  5 Reallocated_Sector_Ct   ...  Pre-fail  Always   -   312
  9 Power_On_Hours          ...  Old_age   Always   -   35210
197 Current_Pending_Sector  ...  Old_age   Always   -   48
198 Offline_Uncorrectable   ...  Old_age   Always   -   48`,
      choices: [
        { label: t("Fix the backup credentials, and before any rebuild copy the last two days of changes off the box (find -mtime -3 | rsync to another host / S3). Ask users to pause big writes.", "לתקן את ה-credentials של הגיבוי, ולפני כל rebuild להעתיק את השינויים של היומיים האחרונים מהשרת (find -mtime -3 | rsync לשרת אחר / S3). לבקש מהמשתמשים לעצור כתיבות גדולות."), next: "s3", score: 10,
          feedback: t("Excellent. A small targeted copy reads far less than a full rebuild and closes the gap between your last good backup and now.", "מצוין. העתקה ממוקדת וקטנה קוראת הרבה פחות מ-rebuild מלא וסוגרת את הפער בין הגיבוי הטוב האחרון לבין עכשיו.") },
        { label: t("sdf is dying too — pull it now and replace both disks in one go.", "גם sdf גוסס — לשלוף אותו עכשיו ולהחליף את שני הדיסקים בבת אחת."), next: "lose", score: 0,
          feedback: t("RAID 5 survives exactly one missing disk. Removing a second member of a degraded array takes it offline instantly.", "RAID 5 שורד בדיוק דיסק חסר אחד. להוציא חבר שני ממערך degraded מוריד אותו מיד.") },
        { label: t("Start the rebuild now; deal with the backup job on Monday.", "להתחיל rebuild עכשיו; לטפל ב-job של הגיבוי ביום שני."), next: "s3", score: 3,
          feedback: t("You're betting two days of 200 engineers' work on a disk with 48 pending sectors reading every block for 15+ hours.", "אתה מהמר על יומיים של עבודה של 200 מהנדסים, על דיסק עם 48 pending sectors שיקרא כל block במשך 15+ שעות.") }
      ]
    },
    s3: {
      text: t(
        "A new disk (sdh) is in and the rebuild is running. At 63%, the kernel log lights up and the array status changes. sdf hit unreadable sectors and md kicked it out — with the rebuild unfinished, that's two missing members.",
        "דיסק חדש (sdh) בפנים וה-rebuild רץ. ב-63% ה-log של ה-kernel נדלק ומצב המערך משתנה. sdf נתקל ב-sectors שלא ניתנים לקריאה ו-md העיף אותו — וכשה-rebuild לא הסתיים, אלה שני חברים חסרים."
      ),
      data: `[Fri Nov 14 13:41:12] ata6.00: exception Emask 0x0 SAct 0x4000 SErr 0x0 action 0x0
[Fri Nov 14 13:41:12] blk_update_request: I/O error, dev sdf, sector 9876543210
[Fri Nov 14 13:41:12] md/raid:md0: read error not correctable (sector 9876541168 on sdf).
[Fri Nov 14 13:41:13] md/raid:md0: Disk failure on sdf, disabling device.
$ cat /proc/mdstat
md0 : active raid5 sdh[6](S) sdg[5] sdf[4](F) sde[3] sdc[1] sdb[0]
      39062585340 blocks super 1.2 level 5, 512k chunk, algorithm 2 [6/4] [UU_U_U]`,
      choices: [
        { label: t("Recreate the array with mdadm --create using the same parameters to force it back online.", "ליצור מחדש את המערך עם mdadm --create עם אותם פרמטרים כדי להכריח אותו לחזור לאוויר."), next: "lose", score: 0,
          feedback: t("--create writes fresh superblocks; one wrong device order, chunk size or data offset and the data is scrambled beyond recovery.", "--create כותב superblocks חדשים; סדר דיסקים, chunk size או data offset אחד שגוי — והמידע מעורבב בלי אפשרות שחזור.") },
        { label: t("Stop all IO and unmount. Clone sdf with ddrescue to a fresh disk, then try mdadm --assemble --force read-only using the clone to salvage anything newer than the backup.", "לעצור כל IO ולעשות unmount. לשכפל את sdf עם ddrescue לדיסק חדש, ואז לנסות mdadm --assemble --force לקריאה בלבד עם השכפול, כדי להציל כל מה שחדש מהגיבוי."), next: "s4", score: 10,
          feedback: t("Textbook recovery: work on copies, never write to the failing disk, and assemble read-only.", "שחזור לפי הספר: עובדים על עותקים, לא כותבים לדיסק הכושל אף פעם, ועושים assemble לקריאה בלבד.") },
        { label: t("Declare the array lost and go straight to restoring from the backup.", "להכריז שהמערך אבוד ולעבור ישר לשחזור מהגיבוי."), next: "s5", score: 6,
          feedback: t("Valid and fast if you already copied the recent changes in step 2. If not, you just accepted losing up to two days of work without trying a safe salvage.", "לגיטימי ומהיר אם כבר העתקת את השינויים האחרונים בשלב 2. אם לא, הרגע קיבלת אובדן של עד יומיים עבודה בלי לנסות חילוץ בטוח.") }
      ]
    },
    s4: {
      text: t(
        "ddrescue recovered all but ~196 kB of sdf. A forced, read-only assemble of the four good disks plus the clone works and the filesystem mounts read-only, with a few errors reported by a dry-run check.",
        "ddrescue שחזר את כל sdf חוץ מ-~196 kB. Assemble בכפייה ולקריאה בלבד של ארבעת הדיסקים התקינים ועוד השכפול עובד, וה-filesystem עולה לקריאה בלבד, עם כמה שגיאות שבדיקה יבשה מדווחת."
      ),
      data: `$ sudo ddrescue -f -n /dev/sdf /dev/sdi /root/sdf.map
     rescued:   7999 GB,  bad areas:       31,  bad-sector size:  196608 B
pct rescued:   99.99%,   read errors:       48,  run time:  14h 02m
$ sudo mdadm --assemble --force --readonly /dev/md0 /dev/sd[bcegi]
mdadm: /dev/md0 has been started with 5 drives (out of 6).
$ sudo mount -o ro /dev/md0 /mnt/rescue && sudo e2fsck -n /dev/md0 | tail -2
Inode 48213907 has illegal block(s).
/dev/md0: ********** WARNING: Filesystem still has errors **********`,
      choices: [
        { label: t("Copy everything modified since the last good backup (and anything the step-2 copy missed) to safe storage, verify it, then retire this array entirely.", "להעתיק כל מה שהשתנה מאז הגיבוי הטוב האחרון (וכל מה שההעתקה של שלב 2 פספסה) לאחסון בטוח, לאמת, ואז להוריד את המערך הזה לגמרי."), next: "s5", score: 10,
          feedback: t("Salvage the delta, don't trust the patient. ~196 kB of zeros landed somewhere in the clone — you don't want to run production on that.", "מחלצים את ה-delta, לא סומכים על החולה. בערך 196 kB של אפסים נחתו איפשהו בשכפול — אתה לא רוצה להריץ פרודקשן על זה.") },
        { label: t("Add a new disk, let it rebuild, run fsck -y and put this array back into production.", "להוסיף דיסק חדש, לתת לו לבנות מחדש, להריץ fsck -y ולהחזיר את המערך הזה לפרודקשן."), next: "lose", score: 0,
          feedback: t("The rebuilt array would contain the unreadable regions as zeros — silently corrupted files nobody can identify, on disks from a batch that's failing.", "המערך שנבנה מחדש יכיל את האזורים שלא נקראו כאפסים — קבצים מושחתים בשקט שאף אחד לא יודע לזהות, על דיסקים מ-batch שכבר קורס.") }
      ]
    },
    s5: {
      text: t(
        "Time to rebuild the storage and restore. New disks have arrived (8 × 8 TB). Restic snapshot from 2026-11-12 plus the rescued delta are ready. How do you build the replacement?",
        "הגיע הזמן לבנות מחדש את האחסון ולשחזר. הגיעו דיסקים חדשים (8 × 8 TB). ה-snapshot של restic מ-2026-11-12 ועוד ה-delta שחולץ מוכנים. איך אתה בונה את המחליף?"
      ),
      choices: [
        { label: t("RAID 6 (or ZFS RAID-Z2) with a hot spare, restore the snapshot, overlay the rescued delta, verify with restic check and spot-check files with users.", "RAID 6 (או RAID-Z2 של ZFS) עם hot spare, לשחזר את ה-snapshot, להלביש את ה-delta שחולץ, לאמת עם restic check ולבדוק קבצים מדגמית עם המשתמשים."), next: "s6", score: 10,
          feedback: t("Two-disk tolerance survives a URE during a rebuild; the spare starts rebuilding at 03:00 instead of when someone notices.", "עמידות לשני דיסקים שורדת URE באמצע rebuild; ה-spare מתחיל rebuild ב-03:00 ולא כשמישהו שם לב.") },
        { label: t("RAID 5 again across all 8 disks — maximum capacity, it worked for four years.", "שוב RAID 5 על כל 8 הדיסקים — נפח מקסימלי, זה עבד ארבע שנים."), next: "s6", score: 2,
          feedback: t("A wider RAID 5 of 8 TB disks means a ~56 TB read on the next rebuild — by spec you'd expect several UREs. Same incident, scheduled for later.", "RAID 5 רחב יותר של דיסקים של 8 TB אומר קריאה של ~56 TB ב-rebuild הבא — לפי המפרט צפויים כמה UREs. אותה תקרית, רק בתזמון מאוחר יותר.") }
      ]
    },
    s6: {
      text: t(
        "Service is restored by Saturday evening; the step-2 copy plus ddrescue saved all but a handful of files. Now the postmortem. Which action item matters most?",
        "השירות חזר במוצאי שבת; ההעתקה של שלב 2 יחד עם ddrescue הצילו הכול חוץ מקומץ קבצים. עכשיו ה-postmortem. איזה action item הכי חשוב?"
      ),
      choices: [
        { label: t("Alert on backup job failures and backup age, run a monthly restore test, a monthly RAID scrub, and SMART alerts on 5/187/197/198.", "התראה על כשלי jobs של גיבוי ועל גיל הגיבוי, בדיקת שחזור חודשית, scrub חודשי ל-RAID, והתראות SMART על 5/187/197/198."), next: "win", score: 10,
          feedback: t("These would have turned this into a non-event: the backup gap and sdf's pending sectors were both visible days earlier.", "אלה היו הופכים את זה ללא-אירוע: גם הפער בגיבוי וגם ה-pending sectors של sdf נראו כבר ימים לפני.") },
        { label: t("Buy more expensive enterprise disks.", "לקנות דיסקי enterprise יקרים יותר."), next: "win", score: 3,
          feedback: t("Better UREs help a little, but the root causes were an unmonitored backup and no early warning.", "URE טוב יותר עוזר קצת, אבל שורשי הבעיה היו גיבוי שלא מנוטר והיעדר התרעה מוקדמת.") },
        { label: t("Write up the on-call engineer who started the rebuild.", "לרשום הערה למהנדס ה-on-call שהתחיל את ה-rebuild."), next: "win", score: 0,
          feedback: t("Blameful postmortems hide the next incident. The system let backups fail silently — fix the system.", "Postmortem מאשים מחביא את התקרית הבאה. המערכת נתנה לגיבויים להיכשל בשקט — מתקנים את המערכת.") }
      ]
    },
    win: {
      text: t(
        "Recovered. You treated the degraded array as having zero redundancy, protected the delta before the risky rebuild, recovered from copies instead of the failing disk, and rebuilt on RAID 6 with monitoring that would have caught this days earlier. RAID kept you online; backups kept your data.",
        "התאוששת. התייחסת למערך ה-degraded כמערך בלי שום יתירות, הגנת על ה-delta לפני ה-rebuild המסוכן, שחזרת מעותקים ולא מהדיסק הכושל, ובנית מחדש על RAID 6 עם ניטור שהיה תופס את זה ימים לפני. ה-RAID השאיר אותך באוויר; הגיבויים שמרו על המידע."
      ),
      end: "win"
    },
    lose: {
      text: t(
        "Data lost. The array is gone (or quietly corrupted), and the newest good backup is two days old — 200 engineers just lost two days of work. Lessons: a degraded RAID 5 tolerates zero more failures; never remove a second member or run mdadm --create on a live array; copy the delta and image failing disks before any risky step; and RAID is not a backup.",
        "המידע אבד. המערך נעלם (או הושחת בשקט), והגיבוי הטוב האחרון בן יומיים — 200 מהנדסים איבדו יומיים של עבודה. הלקחים: RAID 5 במצב degraded לא סובל אף כשל נוסף; אף פעם לא מוציאים חבר שני ולא מריצים mdadm --create על מערך חי; מעתיקים את ה-delta ועושים image לדיסקים כושלים לפני כל צעד מסוכן; ו-RAID הוא לא גיבוי."
      ),
      end: "lose"
    }
  },
  lessons: ["raid-levels-deep", "fs-filesystems-raid", "disks-hdd-ssd-nvme", "db-backups", "pr-backups-strategy"]
});

})();
