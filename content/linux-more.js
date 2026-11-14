window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* =========================================================================
   Linux, deeper: filesystems & RAID, kernel tuning, boot & rescue, hardening
   ========================================================================= */

/* ============================== FILESYSTEMS, RAID & LVM ============================== */
INFRA.lessons.push({
  id: "fs-filesystems-raid",
  track: "foundations",
  order: 20,
  icon: "🗄️",
  level: 2,
  minutes: 14,
  title: { en: "Filesystems, RAID & LVM", he: "Filesystems, ‏RAID ו-LVM" },
  tldr: {
    en: "A filesystem turns raw blocks into files (inodes + journal + extents), RAID trades capacity for survival and speed, LVM lets you resize without downtime — and none of them is a backup.",
    he: "ה-filesystem הופך בלוקים גולמיים לקבצים (inodes + journal + extents), ‏RAID מחליף נפח בשרידות ומהירות, ‏LVM נותן לך לשנות גודל בלי downtime — ואף אחד מהם הוא לא גיבוי."
  },
  analogy: {
    en: "The disk is a huge warehouse of numbered shelves. The filesystem is the warehouse manager: an index card (inode) per item saying which shelves it sits on, and a logbook (journal) where he writes 'about to move X' before moving it, so a power cut never leaves the index half-updated. RAID is building several warehouses that mirror or share the load. LVM is movable walls: you can make a room bigger on a Tuesday afternoon without emptying it.",
    he: "הדיסק הוא מחסן ענק עם מדפים ממוספרים. ה-filesystem הוא מנהל המחסן: כרטיס (inode) לכל פריט שאומר על אילו מדפים הוא יושב, ויומן (journal) שבו הוא כותב 'עומד להזיז את X' לפני שהוא מזיז, כך שהפסקת חשמל אף פעם לא משאירה את האינדקס חצי מעודכן. ‏RAID זה לבנות כמה מחסנים שמשקפים אחד את השני או מחלקים עומס. ‏LVM זה קירות ניידים: אפשר להגדיל חדר ביום שלישי אחר הצהריים בלי לרוקן אותו."
  },
  sections: [
    {
      h: { en: "What a filesystem actually does: inodes, journaling, extents", he: "מה filesystem עושה בפועל: inodes, ‏journaling, ‏extents" },
      body: {
        en: `<p>A block device is just an array of 4 KiB blocks. The filesystem adds structure:</p>
<ul>
<li><strong>Inode</strong> — per-file metadata: owner, mode, timestamps, size and <em>where the data lives</em>. The file name is NOT in the inode; it lives in the directory entry that points to the inode number (that's why hard links work).</li>
<li><strong>Extents</strong> — instead of listing every block (old ext2/ext3 indirect blocks), ext4/XFS store ranges: "blocks 1,000,000–1,032,767". One ext4 extent covers up to 128 MiB, so a 1 GB file needs ~8 entries instead of 262,144 block pointers. Less metadata, less fragmentation.</li>
<li><strong>Journal</strong> — a write-ahead log for metadata. Before changing the inode table/bitmaps, the FS writes the intent to the journal; after a crash it replays the journal in seconds instead of a full <code>fsck</code> that took hours on big disks. ext4 default is <code>data=ordered</code>: metadata is journaled, data blocks are written before the metadata that points at them.</li>
</ul>
<pre>$ stat /var/log/syslog
  File: /var/log/syslog
  Size: 1849302     Blocks: 3616   IO Block: 4096  regular file
Device: 259,1   Inode: 262201   Links: 1
$ sudo filefrag -v /var/lib/mysql/ibdata1 | tail -2
   2:   65536..  98303:   1802240..  1835007:  32768:
ibdata1: 3 extents found
$ sudo dumpe2fs -h /dev/nvme0n1p1 | grep -E 'features|Journal size'
Filesystem features:      has_journal ext_attr resize_inode dir_index extent ...
Journal size:             64M</pre>`,
        he: `<p>block device הוא בסך הכל מערך של בלוקים של 4 KiB. ה-filesystem מוסיף מבנה:</p>
<ul>
<li><strong>Inode</strong> — metadata לכל קובץ: בעלים, הרשאות, זמנים, גודל ו<em>איפה הדאטה יושב</em>. שם הקובץ לא נמצא ב-inode; הוא יושב ב-directory entry שמצביע על מספר ה-inode (בגלל זה hard links עובדים).</li>
<li><strong>Extents</strong> — במקום לרשום כל בלוק (ה-indirect blocks של ext2/ext3), ‏ext4/XFS שומרים טווחים: "בלוקים 1,000,000–1,032,767". ‏extent אחד ב-ext4 מכסה עד 128 MiB, אז קובץ של 1GB צריך בערך 8 רשומות במקום 262,144 מצביעים. פחות metadata, פחות פרגמנטציה.</li>
<li><strong>Journal</strong> — write-ahead log ל-metadata. לפני שמשנים את טבלת ה-inodes/bitmaps, ה-FS כותב את הכוונה ל-journal; אחרי קריסה הוא עושה replay לג'ורנל בשניות במקום <code>fsck</code> מלא שלקח שעות על דיסקים גדולים. ברירת המחדל ב-ext4 היא <code>data=ordered</code>: ה-metadata עובר journal, ובלוקי הדאטה נכתבים לפני ה-metadata שמצביע עליהם.</li>
</ul>
<pre>$ stat /var/log/syslog
  File: /var/log/syslog
  Size: 1849302     Blocks: 3616   IO Block: 4096  regular file
Device: 259,1   Inode: 262201   Links: 1
$ sudo filefrag -v /var/lib/mysql/ibdata1 | tail -2
   2:   65536..  98303:   1802240..  1835007:  32768:
ibdata1: 3 extents found
$ sudo dumpe2fs -h /dev/nvme0n1p1 | grep -E 'features|Journal size'
Filesystem features:      has_journal ext_attr resize_inode dir_index extent ...
Journal size:             64M</pre>`
      }
    },
    {
      h: { en: "ext4 vs XFS vs btrfs/ZFS — and the page cache, fsync, O_DIRECT", he: "ext4 מול XFS מול btrfs/ZFS — וה-page cache, ‏fsync, ‏O_DIRECT" },
      body: {
        en: `<table>
<tr><th>FS</th><th>Strengths</th><th>Watch out</th></tr>
<tr><td>ext4</td><td>Default on Ubuntu/Debian, rock solid, can shrink (offline)</td><td>Inode count fixed at mkfs; max 16 TiB file</td></tr>
<tr><td>XFS</td><td>Default on RHEL/Amazon Linux, great with big files and parallel IO, dynamic inodes</td><td><strong>Cannot shrink</strong>, ever</td></tr>
<tr><td>btrfs / ZFS</td><td>Copy-on-write, checksums on every block (detects bit rot), cheap snapshots, built-in RAID &amp; compression</td><td>More RAM/CPU (ZFS ARC), CoW fragments DB files; btrfs RAID5/6 still not recommended</td></tr>
</table>
<p><strong>The page cache.</strong> <code>write()</code> returns as soon as the data is copied into RAM (a "dirty page"). The kernel flushes it later — dirty pages older than ~30s (<code>vm.dirty_expire_centisecs=3000</code>) or when dirty memory crosses <code>vm.dirty_ratio</code>. Pull the power before that and the "written" data is gone. <code>fsync(fd)</code> blocks until the data and metadata are on stable storage. That's why databases fsync their WAL on every commit, and why fsync latency (~0.1 ms on local NVMe, ~0.5–2 ms on network disks) caps your commit rate.</p>
<p><strong>O_DIRECT</strong> bypasses the page cache entirely. Databases with their own buffer pool use it to avoid caching every page twice: MySQL <code>innodb_flush_method=O_DIRECT</code>. PostgreSQL does the opposite — it leans on the page cache (<code>shared_buffers</code> ≈ 25% of RAM, the OS caches the rest).</p>
<p><strong>Mount options:</strong> by default Linux uses <code>relatime</code> (atime updated at most once a day); <code>noatime</code> removes the write-on-read entirely — a free win for data volumes. Others you'll meet: <code>nofail</code>, <code>discard</code> (online TRIM; many prefer a weekly <code>fstrim.timer</code>), <code>nodev,nosuid,noexec</code> for <code>/tmp</code>.</p>
<blockquote>💡 Real world: a team ran Kafka on btrfs with default CoW and saw throughput collapse as segment files fragmented. Moving to XFS + <code>noatime</code> fixed it. For databases and log-structured systems, XFS or ext4 is the boring, correct default.</blockquote>`,
        he: `<table>
<tr><th>FS</th><th>חוזקות</th><th>שים לב</th></tr>
<tr><td>ext4</td><td>ברירת מחדל ב-Ubuntu/Debian, יציב כמו סלע, אפשר להקטין (offline)</td><td>מספר ה-inodes קבוע ב-mkfs; קובץ מקסימלי 16 TiB</td></tr>
<tr><td>XFS</td><td>ברירת מחדל ב-RHEL/Amazon Linux, מצוין לקבצים גדולים ו-IO מקבילי, inodes דינמיים</td><td><strong>אי אפשר להקטין</strong>, אף פעם</td></tr>
<tr><td>btrfs / ZFS</td><td>Copy-on-write, ‏checksum לכל בלוק (מזהה bit rot), ‏snapshots זולים, ‏RAID ודחיסה מובנים</td><td>יותר RAM/CPU (ה-ARC של ZFS), ‏CoW מפרגמנט קבצי DB; ‏RAID5/6 ב-btrfs עדיין לא מומלץ</td></tr>
</table>
<p><strong>ה-page cache.</strong> ‏<code>write()</code> חוזר ברגע שהדאטה הועתק ל-RAM ("dirty page"). ה-kernel עושה flush אחר כך — dirty pages שגילם מעל ~30 שניות (<code>vm.dirty_expire_centisecs=3000</code>) או כשהזיכרון המלוכלך עובר את <code>vm.dirty_ratio</code>. תנתק חשמל לפני זה והדאטה ש"נכתב" נעלם. ‏<code>fsync(fd)</code> חוסם עד שהדאטה וה-metadata על אחסון יציב. בגלל זה דאטאבייסים עושים fsync ל-WAL בכל commit, ובגלל זה ה-latency של fsync (‏~0.1ms על NVMe מקומי, ‏~0.5–2ms על דיסק רשת) מגביל את קצב ה-commits.</p>
<p><strong>O_DIRECT</strong> עוקף את ה-page cache לגמרי. דאטאבייסים עם buffer pool משלהם משתמשים בו כדי לא לשמור כל דף פעמיים: MySQL ‏<code>innodb_flush_method=O_DIRECT</code>. ‏PostgreSQL עושה הפוך — נשען על ה-page cache (‏<code>shared_buffers</code> ≈ 25% מה-RAM, ומערכת ההפעלה מחזיקה את השאר).</p>
<p><strong>Mount options:</strong> כברירת מחדל לינוקס משתמש ב-<code>relatime</code> (‏atime מתעדכן לכל היותר פעם ביום); ‏<code>noatime</code> מבטל את הכתיבה-בזמן-קריאה לגמרי — רווח חינמי ל-data volumes. עוד כאלה שתפגוש: <code>nofail</code>, ‏<code>discard</code> (‏TRIM אונליין; רבים מעדיפים <code>fstrim.timer</code> שבועי), ‏<code>nodev,nosuid,noexec</code> ל-<code>/tmp</code>.</p>
<blockquote>💡 מהשטח: צוות הריץ Kafka על btrfs עם CoW דיפולטי וראה את ה-throughput קורס ככל שקבצי ה-segment התפרגמנטו. מעבר ל-XFS + <code>noatime</code> פתר את זה. לדאטאבייסים ומערכות log-structured, ‏XFS או ext4 הם ברירת המחדל המשעממת והנכונה.</blockquote>`
      }
    },
    {
      h: { en: "RAID 0/1/5/6/10: capacity, failure math, write penalty", he: "RAID 0/1/5/6/10: נפח, חשבון כשלים, write penalty" },
      body: {
        en: `<p>Example array: <strong>6 × 4 TB disks, ~200 random IOPS each</strong> (HDD) = 1,200 raw IOPS.</p>
<table>
<tr><th>Level</th><th>Usable</th><th>Survives</th><th>Write penalty</th><th>100% random-write IOPS</th></tr>
<tr><td>RAID 0 (stripe)</td><td>24 TB (n)</td><td>0 disks — one dies, all data dies</td><td>1</td><td>1,200</td></tr>
<tr><td>RAID 1 (mirror, 2 disks)</td><td>4 TB (n/2)</td><td>1 of 2</td><td>2</td><td>—</td></tr>
<tr><td>RAID 5 (1 parity)</td><td>20 TB (n-1)</td><td>1 disk</td><td>4</td><td>300</td></tr>
<tr><td>RAID 6 (2 parity)</td><td>16 TB (n-2)</td><td>any 2 disks</td><td>6</td><td>200</td></tr>
<tr><td>RAID 10 (mirrored stripes)</td><td>12 TB (n/2)</td><td>1 per mirror pair (up to 3 if lucky)</td><td>2</td><td>600</td></tr>
</table>
<p><strong>Why the penalty?</strong> A small RAID 5 write = read old data + read old parity + write new data + write new parity = 4 IOs. RAID 6 has two parities = 6 IOs. RAID 10 just writes both mirrors = 2.</p>
<p><strong>The rebuild problem:</strong> when a 16 TB disk dies in RAID 5, the rebuild reads every other disk end to end — often 24+ hours of heavy load on disks of the same age and batch. A second failure or an unrecoverable read error (spec'd ~1 per 10<sup>14</sup>–10<sup>15</sup> bits on HDDs) during that window = array lost. That's why large HDD arrays use RAID 6 or RAID 10, never RAID 5.</p>
<pre>$ sudo mdadm --create /dev/md0 --level=10 --raid-devices=4 /dev/nvme{1..4}n1
$ cat /proc/mdstat
md0 : active raid10 nvme4n1[3] nvme3n1[2] nvme2n1[1] nvme1n1[0]
      3750481920 blocks super 1.2 512K chunks 2 near-copies [4/4] [UUUU]
      [=====&gt;...............]  resync = 27.4% (1027.../3750...) finish=41.2min
$ sudo mdadm --detail /dev/md0 | grep -E 'State|Failed'</pre>
<blockquote>⚠️ Production tip: <strong>RAID is not a backup.</strong> RAID protects against a disk dying. It faithfully mirrors <code>rm -rf</code>, ransomware, a bad migration and filesystem corruption to every disk instantly. Backups = separate copies, separate account/location, tested restores.</blockquote>`,
        he: `<p>מערך לדוגמה: <strong>6 דיסקים × 4TB, בערך 200 random IOPS כל אחד</strong> (HDD) = ‏1,200 IOPS גולמיים.</p>
<table>
<tr><th>Level</th><th>נפח שמיש</th><th>שורד</th><th>Write penalty</th><th>IOPS ב-100% כתיבה רנדומלית</th></tr>
<tr><td>RAID 0 (stripe)</td><td>24TB (n)</td><td>0 דיסקים — אחד מת, כל הדאטה מת</td><td>1</td><td>1,200</td></tr>
<tr><td>RAID 1 (mirror, 2 דיסקים)</td><td>4TB (n/2)</td><td>1 מתוך 2</td><td>2</td><td>—</td></tr>
<tr><td>RAID 5 (parity אחד)</td><td>20TB (n-1)</td><td>דיסק 1</td><td>4</td><td>300</td></tr>
<tr><td>RAID 6 (שני parity)</td><td>16TB (n-2)</td><td>כל 2 דיסקים</td><td>6</td><td>200</td></tr>
<tr><td>RAID 10 (stripe של mirrors)</td><td>12TB (n/2)</td><td>1 בכל זוג mirror (עד 3 אם יש מזל)</td><td>2</td><td>600</td></tr>
</table>
<p><strong>למה יש penalty?</strong> כתיבה קטנה ב-RAID 5 = קריאת הדאטה הישן + קריאת ה-parity הישן + כתיבת הדאטה החדש + כתיבת ה-parity החדש = 4 פעולות IO. ב-RAID 6 יש שני parity = ‏6. ‏RAID 10 פשוט כותב לשני ה-mirrors = ‏2.</p>
<p><strong>בעיית ה-rebuild:</strong> כשדיסק של 16TB מת ב-RAID 5, ה-rebuild קורא כל דיסק אחר מתחילתו ועד סופו — לרוב 24+ שעות של עומס כבד על דיסקים באותו גיל ומאותה סדרת ייצור. כשל שני או unrecoverable read error (לפי ה-spec בערך 1 ל-10<sup>14</sup>–10<sup>15</sup> ביטים ב-HDD) בחלון הזה = המערך אבוד. בגלל זה מערכי HDD גדולים רצים על RAID 6 או RAID 10, אף פעם לא RAID 5.</p>
<pre>$ sudo mdadm --create /dev/md0 --level=10 --raid-devices=4 /dev/nvme{1..4}n1
$ cat /proc/mdstat
md0 : active raid10 nvme4n1[3] nvme3n1[2] nvme2n1[1] nvme1n1[0]
      3750481920 blocks super 1.2 512K chunks 2 near-copies [4/4] [UUUU]
      [=====&gt;...............]  resync = 27.4% (1027.../3750...) finish=41.2min
$ sudo mdadm --detail /dev/md0 | grep -E 'State|Failed'</pre>
<blockquote>⚠️ טיפ לפרודקשן: <strong>RAID זה לא גיבוי.</strong> ‏RAID מגן מפני דיסק שמת. הוא משכפל בנאמנות <code>rm -rf</code>, ‏ransomware, מיגרציה גרועה ו-corruption של ה-filesystem לכל הדיסקים, מיידית. גיבוי = עותקים נפרדים, ב-account/מיקום נפרד, עם restore שנבדק.</blockquote>`
      }
    },
    {
      h: { en: "LVM: PV → VG → LV, online extend, snapshots", he: "LVM: ‏PV ← VG ← LV, הגדלה אונליין, snapshots" },
      body: {
        en: `<p>LVM adds a layer between disks and filesystems: <strong>Physical Volumes</strong> (disks/partitions) are pooled into a <strong>Volume Group</strong>, which is carved into <strong>Logical Volumes</strong> that you format and mount. Add a disk to the pool, grow any LV — online.</p>
<pre>$ sudo pvcreate /dev/nvme1n1 /dev/nvme2n1
$ sudo vgcreate data /dev/nvme1n1 /dev/nvme2n1
$ sudo lvcreate -n pg -L 300G data
$ sudo mkfs.xfs /dev/data/pg &amp;&amp; sudo mount /dev/data/pg /var/lib/postgresql
$ sudo vgs
  VG   #PV #LV #SN Attr   VSize   VFree
  data   2   1   0 wz--n- 399.99g 99.99g
# Running out? Grow LV + filesystem in one go, no unmount:
$ sudo lvextend -r -L +50G /dev/data/pg
# New disk arrived:
$ sudo pvcreate /dev/nvme3n1 &amp;&amp; sudo vgextend data /dev/nvme3n1
# Snapshot (copy-on-write) before a risky upgrade:
$ sudo lvcreate -s -n pg-pre-upgrade -L 20G /dev/data/pg
$ sudo lvs   # watch Data% of the snapshot</pre>
<p><code>-r</code> (<code>--resizefs</code>) calls <code>resize2fs</code> or <code>xfs_growfs</code> for you. An LVM snapshot stores only changed blocks; if it fills its reserved space (20G above) it becomes <strong>invalid</strong> — size it for the change rate and delete it soon. CoW snapshots also slow writes to the origin while they exist.</p>
<blockquote>💡 Real world: in the cloud you often don't need LVM for a single disk — EBS/PD/Managed Disks resize online and have their own snapshots. LVM still shines for striping several volumes together (<code>lvcreate -i 4</code>) to multiply IOPS/throughput, and on bare metal.</blockquote>`,
        he: `<p>LVM מוסיף שכבה בין הדיסקים ל-filesystems: <strong>Physical Volumes</strong> (דיסקים/מחיצות) מאוגדים ל-<strong>Volume Group</strong>, שממנו חותכים <strong>Logical Volumes</strong> שאותם אתה מפרמט ועושה להם mount. מוסיפים דיסק ל-pool, מגדילים כל LV — אונליין.</p>
<pre>$ sudo pvcreate /dev/nvme1n1 /dev/nvme2n1
$ sudo vgcreate data /dev/nvme1n1 /dev/nvme2n1
$ sudo lvcreate -n pg -L 300G data
$ sudo mkfs.xfs /dev/data/pg &amp;&amp; sudo mount /dev/data/pg /var/lib/postgresql
$ sudo vgs
  VG   #PV #LV #SN Attr   VSize   VFree
  data   2   1   0 wz--n- 399.99g 99.99g
# Running out? Grow LV + filesystem in one go, no unmount:
$ sudo lvextend -r -L +50G /dev/data/pg
# New disk arrived:
$ sudo pvcreate /dev/nvme3n1 &amp;&amp; sudo vgextend data /dev/nvme3n1
# Snapshot (copy-on-write) before a risky upgrade:
$ sudo lvcreate -s -n pg-pre-upgrade -L 20G /dev/data/pg
$ sudo lvs   # watch Data% of the snapshot</pre>
<p><code>-r</code> (<code>--resizefs</code>) קורא בשבילך ל-<code>resize2fs</code> או <code>xfs_growfs</code>. ‏snapshot של LVM שומר רק בלוקים שהשתנו; אם הוא ממלא את המקום ששמרת לו (20G למעלה) הוא הופך ל-<strong>invalid</strong> — תגדיר לו גודל לפי קצב השינויים ותמחק אותו מהר. ‏snapshots מסוג CoW גם מאטים כתיבות ל-origin כל עוד הם קיימים.</p>
<blockquote>💡 מהשטח: בענן לרוב אין צורך ב-LVM לדיסק בודד — EBS/PD/Managed Disks גדלים אונליין ויש להם snapshots משלהם. ‏LVM עדיין מבריק כשעושים striping לכמה volumes יחד (‏<code>lvcreate -i 4</code>) כדי להכפיל IOPS/throughput, וב-bare metal.</blockquote>`
      }
    },
    {
      h: { en: "Growing a cloud disk end to end — and ephemeral NVMe vs network storage", he: "הגדלת דיסק בענן מקצה לקצה — ו-NVMe אפמרלי מול אחסון רשת" },
      body: {
        en: `<p>Root disk at 95% on an EC2 instance, no downtime allowed. Three layers must grow: the <strong>volume</strong>, the <strong>partition</strong>, the <strong>filesystem</strong>.</p>
<pre># 1. Volume (from your laptop / IaC). No reboot needed on Nitro.
$ aws ec2 modify-volume --volume-id vol-0abc123 --size 200
$ aws ec2 describe-volumes-modifications --volume-ids vol-0abc123 \\
    --query 'VolumesModifications[0].ModificationState'
"optimizing"        # already usable at this point
# 2. Partition (on the instance)
$ lsblk /dev/nvme0n1
nvme0n1       259:0  0  200G  0 disk
└─nvme0n1p1   259:1  0   50G  0 part /
$ sudo growpart /dev/nvme0n1 1          # note the SPACE before 1
CHANGED: partition=1 start=4096 old: size=104853471 new: size=419426271
# 3. Filesystem
$ df -hT /  → ext4?  sudo resize2fs /dev/nvme0n1p1
            → xfs?   sudo xfs_growfs -d /        # XFS takes the MOUNT POINT
$ df -h /
/dev/nvme0n1p1  197G   48G  149G  25% /</pre>
<p>Gotchas: you can grow but <strong>never shrink</strong> an EBS volume; after a modification you must wait ~6 hours before modifying the same volume again; a data disk with no partition table skips step 2. Azure and GCP follow the same 3 steps (<code>az disk update --size-gb</code>, <code>gcloud compute disks resize</code>).</p>
<table>
<tr><th></th><th>Local / ephemeral NVMe (instance store, i4i, Lsv3)</th><th>Network block storage (EBS gp3/io2, PD, Managed Disk)</th></tr>
<tr><td>Latency</td><td>~50–100 µs</td><td>~0.5–1 ms (io2 Block Express sub-ms)</td></tr>
<tr><td>IOPS</td><td>Hundreds of thousands to millions, included in price</td><td>gp3: 3,000 baseline → 16,000 provisioned; io2: up to 256,000 (paid)</td></tr>
<tr><td>Durability</td><td><strong>Gone</strong> on stop, terminate, host failure (survives reboot)</td><td>Survives instance death, snapshots, re-attach elsewhere</td></tr>
<tr><td>Use for</td><td>Caches, scratch, replicated DBs (Cassandra, Kafka, Elasticsearch with replicas)</td><td>Anything that must survive the VM</td></tr>
</table>
<blockquote>⚠️ Production tip: if you put data on instance store, the replication <em>is</em> your durability. A single-node Postgres on ephemeral NVMe is a data-loss incident waiting for the next instance stop.</blockquote>`,
        he: `<p>דיסק ה-root על EC2 ב-95%, אסור downtime. שלוש שכבות צריכות לגדול: ה-<strong>volume</strong>, ה-<strong>partition</strong>, ה-<strong>filesystem</strong>.</p>
<pre># 1. Volume (from your laptop / IaC). No reboot needed on Nitro.
$ aws ec2 modify-volume --volume-id vol-0abc123 --size 200
$ aws ec2 describe-volumes-modifications --volume-ids vol-0abc123 \\
    --query 'VolumesModifications[0].ModificationState'
"optimizing"        # already usable at this point
# 2. Partition (on the instance)
$ lsblk /dev/nvme0n1
nvme0n1       259:0  0  200G  0 disk
└─nvme0n1p1   259:1  0   50G  0 part /
$ sudo growpart /dev/nvme0n1 1          # note the SPACE before 1
CHANGED: partition=1 start=4096 old: size=104853471 new: size=419426271
# 3. Filesystem
$ df -hT /  → ext4?  sudo resize2fs /dev/nvme0n1p1
            → xfs?   sudo xfs_growfs -d /        # XFS takes the MOUNT POINT
$ df -h /
/dev/nvme0n1p1  197G   48G  149G  25% /</pre>
<p>מוקשים: אפשר להגדיל אבל <strong>אף פעם לא להקטין</strong> EBS volume; אחרי שינוי צריך לחכות בערך 6 שעות לפני ששוב משנים את אותו volume; דיסק דאטה בלי partition table מדלג על שלב 2. ב-Azure וב-GCP זה אותם 3 שלבים (‏<code>az disk update --size-gb</code>, ‏<code>gcloud compute disks resize</code>).</p>
<table>
<tr><th></th><th>NVMe מקומי / אפמרלי (instance store, ‏i4i, ‏Lsv3)</th><th>אחסון block ברשת (EBS gp3/io2, ‏PD, ‏Managed Disk)</th></tr>
<tr><td>Latency</td><td>‏~50–100 µs</td><td>‏~0.5–1ms (‏io2 Block Express מתחת למילישנייה)</td></tr>
<tr><td>IOPS</td><td>מאות אלפים עד מיליונים, כלול במחיר</td><td>gp3: ‏3,000 בסיס ← 16,000 בהקצאה; io2: עד 256,000 (בתשלום)</td></tr>
<tr><td>שרידות</td><td><strong>נעלם</strong> ב-stop, ‏terminate, כשל של ה-host (שורד reboot)</td><td>שורד מוות של ה-instance, ‏snapshots, אפשר לחבר למכונה אחרת</td></tr>
<tr><td>מתאים ל</td><td>Caches, ‏scratch, דאטאבייסים משוכפלים (Cassandra, ‏Kafka, ‏Elasticsearch עם replicas)</td><td>כל מה שחייב לשרוד את ה-VM</td></tr>
</table>
<blockquote>⚠️ טיפ לפרודקשן: אם שמת דאטה על instance store, ה-replication <em>הוא</em> השרידות שלך. ‏Postgres בודד על NVMe אפמרלי זו תקלת איבוד דאטה שמחכה ל-stop הבא של ה-instance.</blockquote>`
      }
    }
  ],
  diagram: "disks:  [nvme1] [nvme2] [nvme3]          RAID 10 write: data -> mirror A + mirror B (2 IOs)\n            \\      |      /                  RAID 5  write: read D, read P, write D', write P' (4 IOs)\n   LVM:   PV      PV     PV\n             \\    |    /\n              VG 'data' (pool)\n             /          \\\n        LV pg 300G   LV logs 50G\n            |              |\n          XFS            ext4      <- filesystem: inodes + extents + journal\n            |              |\n  /var/lib/postgresql   /var/log   <- mount (noatime,nofail)\n\napp write() -> page cache (dirty, RAM) --fsync()/writeback ~30s--> disk",
  handsOn: [
    { cmd: "lsblk -f && df -hT && findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS", what: { en: "Map disks → partitions → filesystems → mount points and their options.", he: "למפות דיסקים ← מחיצות ← filesystems ← נקודות mount וה-options שלהן." } },
    { cmd: "grep -E 'Dirty|Writeback' /proc/meminfo; sync; grep Dirty /proc/meminfo", what: { en: "See dirty page-cache data waiting to hit disk, then force it out with sync.", he: "לראות דאטה מלוכלך ב-page cache שמחכה לדיסק, ואז להכריח flush עם sync." } },
    { cmd: "truncate -s 1G /tmp/d1 /tmp/d2 && sudo losetup -f --show /tmp/d1 && sudo losetup -f --show /tmp/d2", what: { en: "Create two loop 'disks' to safely practice mdadm or pvcreate/vgcreate/lvcreate on any VM.", he: "ליצור שני 'דיסקי' loop כדי לתרגל בבטחה mdadm או pvcreate/vgcreate/lvcreate על כל VM." } },
    { cmd: "sudo pvs; sudo vgs; sudo lvs -o +devices", what: { en: "Inspect LVM layout: which disks back which logical volumes and how much is free.", he: "לבדוק את מבנה ה-LVM: אילו דיסקים מאחורי אילו logical volumes וכמה מקום פנוי." } },
    { cmd: "sudo growpart --dry-run /dev/nvme0n1 1", what: { en: "Preview how growpart would extend the partition after you resize the cloud volume.", he: "לראות מראש איך growpart יגדיל את המחיצה אחרי שהגדלת את ה-volume בענן." } }
  ],
  mnemonic: {
    en: "Volume → Partition → Filesystem: grow all three, in that order. RAID survives disks, not humans.",
    he: "Volume ← Partition ← Filesystem: מגדילים את שלושתם, בסדר הזה. ‏RAID שורד דיסקים, לא בני אדם."
  },
  pitfalls: [
    { en: "Resizing the EBS volume and stopping there — df still shows the old size because the partition and filesystem were never grown.", he: "להגדיל את ה-EBS volume ולעצור שם — df עדיין מראה את הגודל הישן כי לא הגדלת את המחיצה ואת ה-filesystem." },
    { en: "Choosing XFS for a volume you might need to shrink later. XFS can only grow; shrinking means new volume + copy.", he: "לבחור XFS ל-volume שאולי תצטרך להקטין. ‏XFS רק גדל; הקטנה = volume חדש + העתקה." },
    { en: "Treating RAID (or replication) as backup. Deletes and corruption replicate instantly.", he: "להתייחס ל-RAID (או replication) כגיבוי. מחיקות ו-corruption משתכפלים מיידית." },
    { en: "Disabling fsync (or using a disk with a volatile write cache without power-loss protection) for a benchmark win, then losing committed transactions on a crash.", he: "לכבות fsync (או להשתמש בדיסק עם write cache נדיף בלי הגנה מנפילת חשמל) בשביל ניצחון ב-benchmark, ואז לאבד טרנזקציות שעשו commit בקריסה." }
  ],
  interview: [
    {
      q: { en: "You have 8 disks and a write-heavy database. RAID 5 or RAID 10?", he: "יש לך 8 דיסקים ודאטאבייס עם הרבה כתיבות. RAID 5 או RAID 10?" },
      a: { en: "RAID 10. Write penalty 2 vs 4, so roughly double the random-write IOPS; rebuilds copy one mirror instead of reading all disks, so the risk window is shorter and lighter. You pay with 50% capacity (vs 87.5%). RAID 5/6 fits read-heavy, capacity-driven storage like archives.", he: "RAID 10. ‏write penalty של 2 מול 4, אז בערך פי 2 random-write IOPS; ה-rebuild מעתיק mirror אחד במקום לקרוא את כל הדיסקים, אז חלון הסיכון קצר וקל יותר. המחיר: 50% נפח (מול 87.5%). ‏RAID 5/6 מתאים לאחסון שרובו קריאה ומונע ע\"י נפח, כמו ארכיון." }
    },
    {
      q: { en: "write() returned success. Is the data on disk?", he: "write() החזיר הצלחה. הדאטה על הדיסק?" },
      a: { en: "No — it's in the page cache as dirty pages. It reaches stable storage on writeback (~30s or memory pressure) or when the app calls fsync/fdatasync, or uses O_SYNC/O_DIRECT (O_DIRECT still needs fsync for metadata and the device cache). Databases fsync the WAL at commit for exactly this reason.", he: "לא — הוא ב-page cache כ-dirty pages. הוא מגיע לאחסון יציב ב-writeback (‏~30 שניות או לחץ זיכרון) או כשהאפליקציה קוראת ל-fsync/fdatasync, או משתמשת ב-O_SYNC/O_DIRECT (גם O_DIRECT צריך fsync בשביל ה-metadata וה-cache של ההתקן). בדיוק בגלל זה דאטאבייסים עושים fsync ל-WAL ב-commit." }
    },
    {
      q: { en: "Walk me through growing a full root disk on a running cloud VM.", he: "תסביר איך מגדילים דיסק root מלא על VM שרץ בענן." },
      a: { en: "Snapshot first. Resize the volume via API (modify-volume / az disk update / gcloud disks resize). On the VM: lsblk to confirm the new size, growpart /dev/nvme0n1 1 to extend the partition, then resize2fs /dev/nvme0n1p1 for ext4 or xfs_growfs / for XFS. Verify with df -h. No reboot or unmount needed on modern kernels.", he: "קודם snapshot. מגדילים את ה-volume דרך ה-API (‏modify-volume / az disk update / gcloud disks resize). על ה-VM: ‏lsblk לוודא את הגודל החדש, ‏growpart /dev/nvme0n1 1 להגדלת המחיצה, ואז resize2fs /dev/nvme0n1p1 ל-ext4 או xfs_growfs / ל-XFS. מוודאים עם df -h. בלי reboot ובלי unmount ב-kernels מודרניים." }
    }
  ],
  quiz: [
    {
      q: { en: "6 × 4 TB disks in RAID 6. Usable capacity and failure tolerance?", he: "6 דיסקים × 4TB ב-RAID 6. נפח שמיש ועמידות לכשלים?" },
      options: [
        { en: "20 TB, survives 1 disk", he: "20TB, שורד דיסק 1" },
        { en: "16 TB, survives any 2 disks", he: "16TB, שורד כל 2 דיסקים" },
        { en: "12 TB, survives 1 disk per pair", he: "12TB, שורד דיסק 1 בכל זוג" },
        { en: "24 TB, survives 2 disks", he: "24TB, שורד 2 דיסקים" }
      ],
      answer: 1,
      explain: { en: "RAID 6 spends two disks' worth on parity: (6-2) × 4 = 16 TB, and any two disks can fail.", he: "RAID 6 מקדיש נפח של שני דיסקים ל-parity: ‏(6-2) × 4 = 16TB, וכל שני דיסקים יכולים ליפול." }
    },
    {
      q: { en: "You ran modify-volume to 200G, but df -h / still shows 50G. What's missing?", he: "הרצת modify-volume ל-200G, אבל df -h / עדיין מראה 50G. מה חסר?" },
      options: [
        { en: "A reboot", he: "reboot" },
        { en: "growpart on the partition, then resize2fs / xfs_growfs on the filesystem", he: "growpart למחיצה, ואז resize2fs / xfs_growfs ל-filesystem" },
        { en: "mkfs on the new space", he: "mkfs על המקום החדש" },
        { en: "Detaching and re-attaching the volume", he: "לנתק ולחבר מחדש את ה-volume" }
      ],
      answer: 1,
      explain: { en: "The volume grew, but the partition and filesystem on it didn't. growpart then the FS-specific grow command — online, no reboot. mkfs would wipe data.", he: "ה-volume גדל, אבל המחיצה וה-filesystem שעליו לא. ‏growpart ואז פקודת ההגדלה של ה-FS — אונליין, בלי reboot. ‏mkfs היה מוחק את הדאטה." }
    },
    {
      q: { en: "Why does MySQL InnoDB commonly use innodb_flush_method=O_DIRECT?", he: "למה MySQL InnoDB משתמש בדרך כלל ב-innodb_flush_method=O_DIRECT?" },
      options: [
        { en: "It makes fsync unnecessary", he: "זה מייתר את ה-fsync" },
        { en: "To avoid double-caching pages in both its buffer pool and the OS page cache", he: "כדי לא לשמור דפים פעמיים — גם ב-buffer pool שלו וגם ב-page cache של מערכת ההפעלה" },
        { en: "Because ext4 doesn't support buffered IO", he: "כי ext4 לא תומך ב-buffered IO" },
        { en: "To enable RAID striping", he: "כדי לאפשר striping של RAID" }
      ],
      answer: 1,
      explain: { en: "InnoDB has its own buffer pool; caching the same pages again in the page cache wastes RAM. O_DIRECT bypasses the page cache. Durability still relies on fsync.", he: "ל-InnoDB יש buffer pool משלו; לשמור את אותם דפים שוב ב-page cache מבזבז RAM. ‏O_DIRECT עוקף את ה-page cache. השרידות עדיין נשענת על fsync." }
    },
    {
      q: { en: "Which storage is lost when an EC2 instance is stopped?", he: "איזה אחסון הולך לאיבוד כשעושים stop ל-EC2 instance?" },
      options: [
        { en: "gp3 EBS root volume", he: "EBS gp3 של ה-root" },
        { en: "io2 EBS data volume", he: "EBS io2 של דאטה" },
        { en: "Instance store (local NVMe)", he: "Instance store (‏NVMe מקומי)" },
        { en: "EBS snapshots", he: "EBS snapshots" }
      ],
      answer: 2,
      explain: { en: "Instance store is physically attached to the host; stop/terminate moves you off that host and the data is wiped. It survives a reboot only.", he: "Instance store מחובר פיזית ל-host; ‏stop/terminate מעביר אותך מה-host והדאטה נמחק. הוא שורד רק reboot." }
    }
  ],
  playground: "terminal",
  related: ["storage-io", "linux-disks-storage", "linux-boot-rescue", "vms"]
});

/* ============================== KERNEL & LIMITS TUNING ============================== */
INFRA.lessons.push({
  id: "linux-kernel-tuning",
  track: "linux",
  order: 20,
  icon: "🎛️",
  level: 3,
  minutes: 13,
  title: { en: "Kernel & limits tuning: sysctl, ulimits, THP, NUMA", he: "כיוונון kernel ו-limits: ‏sysctl, ‏ulimits, ‏THP, ‏NUMA" },
  tldr: {
    en: "Kernel defaults are tuned for a generic laptop-to-server world; a handful of sysctls and limits matter for busy servers — change them only when a metric proves you hit them, and persist them in /etc/sysctl.d.",
    he: "ברירות המחדל של ה-kernel מכוונות לעולם גנרי מלפטופ עד שרת; קומץ sysctls ו-limits באמת משנים בשרתים עמוסים — תשנה אותם רק כשמטריקה מוכיחה שנתקעת בהם, ותקבע אותם ב-/etc/sysctl.d."
  },
  analogy: {
    en: "The kernel is a restaurant with house rules set by the franchise: 1,024 tables per waiter, a waiting line of 4,096 people at the door, a policy to move unused food to the freezer (swap) fairly early. For a wedding hall you change some rules — but only after you've seen people turned away at the door, not because a blog post said '65535 is faster'.",
    he: "ה-kernel הוא מסעדה עם כללי בית שהזכיין קבע: 1,024 שולחנות למלצר, תור של 4,096 איש בכניסה, מדיניות להעביר אוכל שלא משתמשים בו למקפיא (swap) די מוקדם. לאולם אירועים משנים חלק מהכללים — אבל רק אחרי שראית אנשים שנדחו בכניסה, לא כי פוסט בבלוג אמר ש-'65535 יותר מהיר'."
  },
  sections: [
    {
      h: { en: "Measure before tuning: how to read and set sysctls", he: "קודם מודדים: איך קוראים וקובעים sysctls" },
      body: {
        en: `<p>Every sysctl is a file under <code>/proc/sys</code>: <code>net.core.somaxconn</code> = <code>/proc/sys/net/core/somaxconn</code>. Change at runtime with <code>sysctl -w</code> (lost on reboot); persist in <code>/etc/sysctl.d/*.conf</code>.</p>
<pre>$ sysctl net.core.somaxconn vm.swappiness
net.core.somaxconn = 4096
vm.swappiness = 60
$ sudo sysctl -w net.core.somaxconn=8192          # runtime only
$ cat /etc/sysctl.d/99-api.conf                    # persistent
# Why: ListenOverflows climbing during traffic spikes (INC-4471)
net.core.somaxconn = 8192
net.ipv4.ip_local_port_range = 10240 65535
$ sudo sysctl --system                             # reload all sysctl.d files
$ sudo sysctl -a 2&gt;/dev/null | wc -l
1187</pre>
<p><strong>The philosophy:</strong> every line in that file should have a comment pointing to the evidence. Copy-pasted "ultimate Linux tuning" blocks from 2012 (<code>tcp_tw_recycle</code>, giant TCP buffers, <code>swappiness=0</code>) cause more outages than they prevent. Signal first: <code>nstat</code>, <code>ss -s</code>, <code>/proc/PID/limits</code>, <code>vmstat 1</code>, dmesg — then tune — then verify the metric moved.</p>`,
        he: `<p>כל sysctl הוא קובץ תחת <code>/proc/sys</code>: ‏<code>net.core.somaxconn</code> = ‏<code>/proc/sys/net/core/somaxconn</code>. משנים בזמן ריצה עם <code>sysctl -w</code> (נעלם ב-reboot); קובעים לתמיד ב-<code>/etc/sysctl.d/*.conf</code>.</p>
<pre>$ sysctl net.core.somaxconn vm.swappiness
net.core.somaxconn = 4096
vm.swappiness = 60
$ sudo sysctl -w net.core.somaxconn=8192          # runtime only
$ cat /etc/sysctl.d/99-api.conf                    # persistent
# Why: ListenOverflows climbing during traffic spikes (INC-4471)
net.core.somaxconn = 8192
net.ipv4.ip_local_port_range = 10240 65535
$ sudo sysctl --system                             # reload all sysctl.d files
$ sudo sysctl -a 2&gt;/dev/null | wc -l
1187</pre>
<p><strong>הפילוסופיה:</strong> לכל שורה בקובץ הזה צריכה להיות הערה שמצביעה על הראיה. בלוקים של "ultimate Linux tuning" מ-2012 שהועתקו (<code>tcp_tw_recycle</code>, באפרים ענקיים ל-TCP, ‏<code>swappiness=0</code>) גורמים ליותר תקלות ממה שהם מונעים. קודם סיגנל: <code>nstat</code>, ‏<code>ss -s</code>, ‏<code>/proc/PID/limits</code>, ‏<code>vmstat 1</code>, ‏dmesg — אז מכווננים — ואז מוודאים שהמטריקה זזה.</p>`
      }
    },
    {
      h: { en: "Network sysctls that actually matter", he: "ה-sysctls של הרשת שבאמת משנים" },
      body: {
        en: `<ul>
<li><strong><code>net.core.somaxconn</code></strong> — cap on the accept queue (fully-established connections the app hasn't <code>accept()</code>ed yet). Default 4096 since kernel 5.4 (128 before — old distros still bite). The effective backlog is <code>min(app's listen backlog, somaxconn)</code>, so nginx needs <code>listen 443 backlog=8192</code> too. Evidence: <code>nstat -az TcpExtListenOverflows</code> increasing, or <code>ss -lnt</code> Recv-Q near Send-Q.</li>
<li><strong><code>net.ipv4.ip_local_port_range</code></strong> — ephemeral ports for <em>outgoing</em> connections. Default <code>32768 60999</code> ≈ 28k ports per (src IP, dst IP, dst port). A proxy hammering one upstream with short connections, each sitting 60s in TIME_WAIT, tops out near 28,000/60 ≈ 470 new conns/s → <code>EADDRNOTAVAIL: Cannot assign requested address</code>. Widen to <code>10240 65535</code>, but reserve ports your services listen on (<code>net.ipv4.ip_local_reserved_ports</code>). The real fix is usually keep-alive / connection pooling.</li>
<li><strong><code>net.ipv4.tcp_tw_reuse</code></strong> — <code>1</code> lets new <em>outgoing</em> connections reuse TIME_WAIT sockets (safe, needs TCP timestamps). Newer kernels default to <code>2</code> = loopback only. Its evil twin <code>tcp_tw_recycle</code> broke clients behind NAT and was <strong>removed in 4.12</strong> — delete it if you see it.</li>
</ul>
<pre>$ nstat -az TcpExtListenOverflows TcpExtListenDrops
TcpExtListenOverflows           18342              0.0
$ ss -lnt 'sport = :8080'
State   Recv-Q  Send-Q   Local Address:Port
LISTEN  4097    4096     0.0.0.0:8080         # queue full: app not accepting fast enough
$ ss -tan state time-wait | wc -l
27911                                          # near the 28k ephemeral range</pre>
<blockquote>💡 Real world: a full accept queue is usually a <em>symptom</em> — the app's accept loop is starved (blocked event loop, too few workers). Raising somaxconn buys burst tolerance, not throughput.</blockquote>`,
        he: `<ul>
<li><strong><code>net.core.somaxconn</code></strong> — תקרה ל-accept queue (חיבורים שהושלמו שהאפליקציה עוד לא עשתה להם <code>accept()</code>). ברירת מחדל 4096 מאז kernel 5.4 (לפני זה 128 — הפצות ישנות עדיין נושכות). ה-backlog האפקטיבי הוא <code>min(ה-backlog של האפליקציה, somaxconn)</code>, אז גם nginx צריך <code>listen 443 backlog=8192</code>. ראיה: <code>nstat -az TcpExtListenOverflows</code> עולה, או ב-<code>ss -lnt</code> ה-Recv-Q קרוב ל-Send-Q.</li>
<li><strong><code>net.ipv4.ip_local_port_range</code></strong> — פורטים אפמרליים לחיבורים <em>יוצאים</em>. ברירת מחדל <code>32768 60999</code> ≈ ‏28 אלף פורטים לכל (src IP, ‏dst IP, ‏dst port). ‏proxy שמפציץ upstream אחד בחיבורים קצרים, שכל אחד יושב 60 שניות ב-TIME_WAIT, נתקע בסביבות 28,000/60 ≈ ‏470 חיבורים חדשים בשנייה ← <code>EADDRNOTAVAIL: Cannot assign requested address</code>. מרחיבים ל-<code>10240 65535</code>, אבל שומרים את הפורטים שהשירותים שלך מאזינים עליהם (<code>net.ipv4.ip_local_reserved_ports</code>). התיקון האמיתי לרוב הוא keep-alive / connection pooling.</li>
<li><strong><code>net.ipv4.tcp_tw_reuse</code></strong> — <code>1</code> מאפשר לחיבורים <em>יוצאים</em> חדשים למחזר sockets ב-TIME_WAIT (בטוח, דורש TCP timestamps). ב-kernels חדשים ברירת המחדל היא <code>2</code> = רק loopback. התאום הרשע שלו <code>tcp_tw_recycle</code> שבר לקוחות מאחורי NAT ו<strong>הוסר ב-4.12</strong> — אם אתה רואה אותו, תמחק.</li>
</ul>
<pre>$ nstat -az TcpExtListenOverflows TcpExtListenDrops
TcpExtListenOverflows           18342              0.0
$ ss -lnt 'sport = :8080'
State   Recv-Q  Send-Q   Local Address:Port
LISTEN  4097    4096     0.0.0.0:8080         # queue full: app not accepting fast enough
$ ss -tan state time-wait | wc -l
27911                                          # near the 28k ephemeral range</pre>
<blockquote>💡 מהשטח: accept queue מלא הוא בדרך כלל <em>סימפטום</em> — לולאת ה-accept של האפליקציה מורעבת (event loop חסום, מעט מדי workers). הגדלת somaxconn קונה עמידות ל-bursts, לא throughput.</blockquote>`
      }
    },
    {
      h: { en: "File descriptors: fs.file-max, ulimit nofile, systemd LimitNOFILE", he: "File descriptors: ‏fs.file-max, ‏ulimit nofile, ‏LimitNOFILE של systemd" },
      body: {
        en: `<p>Every socket and file is a file descriptor. Two ceilings: <code>fs.file-max</code> (system-wide, already huge on modern distros — check <code>/proc/sys/fs/file-nr</code>) and the <strong>per-process <code>RLIMIT_NOFILE</code></strong>, which is what actually bites: soft limit 1024 by default. Hit it and you get <code>EMFILE: Too many open files</code> — new connections fail while CPU and memory look fine.</p>
<pre>$ cat /proc/$(pgrep -f 'java.*api' | head -1)/limits | grep 'open files'
Max open files            1024                 524288               files
$ ls /proc/4121/fd | wc -l
1021
# The trap: /etc/security/limits.conf applies to PAM login sessions ONLY.
# A systemd service ignores it. Set it in the unit:
$ sudo systemctl edit api.service
[Service]
LimitNOFILE=65536
$ sudo systemctl daemon-reload &amp;&amp; sudo systemctl restart api
$ systemctl show api -p LimitNOFILE
LimitNOFILE=65536</pre>
<p>Containers inherit from the runtime (containerd/dockerd unit's <code>LimitNOFILE</code>, or <code>docker run --ulimit nofile=65536:65536</code>). Rule of thumb: max expected connections × 2 (each proxied request = client fd + upstream fd), plus files.</p>
<blockquote>⚠️ Production tip: verify on the <em>running process</em> via <code>/proc/PID/limits</code>, never by running <code>ulimit -n</code> in your SSH shell — your shell's limit tells you nothing about the service.</blockquote>`,
        he: `<p>כל socket וכל קובץ הם file descriptor. שתי תקרות: <code>fs.file-max</code> (לכל המערכת, כבר ענק בהפצות מודרניות — תבדוק ב-<code>/proc/sys/fs/file-nr</code>) וה-<strong><code>RLIMIT_NOFILE</code> לכל תהליך</strong>, שהוא מה שבאמת נושך: soft limit של 1024 כברירת מחדל. נתקעת בו ותקבל <code>EMFILE: Too many open files</code> — חיבורים חדשים נכשלים בזמן שה-CPU והזיכרון נראים מצוין.</p>
<pre>$ cat /proc/$(pgrep -f 'java.*api' | head -1)/limits | grep 'open files'
Max open files            1024                 524288               files
$ ls /proc/4121/fd | wc -l
1021
# The trap: /etc/security/limits.conf applies to PAM login sessions ONLY.
# A systemd service ignores it. Set it in the unit:
$ sudo systemctl edit api.service
[Service]
LimitNOFILE=65536
$ sudo systemctl daemon-reload &amp;&amp; sudo systemctl restart api
$ systemctl show api -p LimitNOFILE
LimitNOFILE=65536</pre>
<p>קונטיינרים יורשים מה-runtime (‏<code>LimitNOFILE</code> ביוניט של containerd/dockerd, או <code>docker run --ulimit nofile=65536:65536</code>). כלל אצבע: מקסימום חיבורים צפוי × 2 (כל בקשה שעוברת proxy = fd ללקוח + fd ל-upstream), ועוד קבצים.</p>
<blockquote>⚠️ טיפ לפרודקשן: תוודא על <em>התהליך שרץ</em> דרך <code>/proc/PID/limits</code>, אף פעם לא ע"י <code>ulimit -n</code> ב-shell של ה-SSH שלך — ה-limit של ה-shell שלך לא אומר כלום על השירות.</blockquote>`
      }
    },
    {
      h: { en: "Memory: swappiness, overcommit, max_map_count, Transparent Huge Pages", he: "זיכרון: swappiness, ‏overcommit, ‏max_map_count, ‏Transparent Huge Pages" },
      body: {
        en: `<ul>
<li><strong><code>vm.swappiness</code></strong> (default 60) — how eagerly the kernel swaps anonymous memory vs dropping page cache. DB hosts often use <code>1</code>–<code>10</code>: keep the heap in RAM, sacrifice cache first. <code>0</code> doesn't mean "never" and can trigger OOM earlier. Kubernetes nodes traditionally run with swap off (swap support in the kubelet is newer and opt-in).</li>
<li><strong><code>vm.overcommit_memory</code></strong> — <code>0</code> heuristic (default), <code>1</code> always allow, <code>2</code> strict (commit limit = swap + RAM × <code>overcommit_ratio</code>%). Redis asks for <code>1</code>: <code>BGSAVE</code> forks a 20 GB process; with heuristic overcommit the fork can fail even though copy-on-write means it will touch far less. Mode <code>2</code> breaks many JVM/Go apps that reserve big virtual ranges.</li>
<li><strong><code>vm.max_map_count</code></strong> (default 65530) — max memory-mapped areas per process. Elasticsearch/OpenSearch mmap every Lucene segment and refuse to start in production mode below <strong>262144</strong>: <code>max virtual memory areas vm.max_map_count [65530] is too low</code>.</li>
<li><strong>Transparent Huge Pages</strong> — kernel auto-promotes memory to 2 MiB pages to save TLB misses. Great for big sequential workloads, bad for fork-heavy or sparse-access ones: Redis warns at startup (latency spikes + memory bloat during fork CoW, since a 1-byte write copies 2 MiB) and recommends <code>never</code>. MongoDB said "disable THP" for years — but <strong>MongoDB 8.0 reversed it</strong> and recommends enabling THP. Read the docs for your version.</li>
</ul>
<pre>$ cat /sys/kernel/mm/transparent_hugepage/enabled
[always] madvise never
$ echo madvise | sudo tee /sys/kernel/mm/transparent_hugepage/enabled  # runtime
# persist: kernel cmdline transparent_hugepage=madvise, or a oneshot systemd unit
$ cat /etc/sysctl.d/90-data.conf
vm.swappiness = 10            # PG host: keep shared_buffers in RAM
vm.overcommit_memory = 1      # Redis BGSAVE fork
vm.max_map_count = 262144     # Elasticsearch bootstrap check</pre>`,
        he: `<ul>
<li><strong><code>vm.swappiness</code></strong> (ברירת מחדל 60) — כמה ה-kernel להוט לעשות swap לזיכרון אנונימי לעומת לזרוק page cache. בשרתי DB נהוג <code>1</code>–<code>10</code>: להשאיר את ה-heap ב-RAM, להקריב cache קודם. ‏<code>0</code> לא אומר "אף פעם" ויכול להקדים OOM. ‏nodes של Kubernetes רצים מסורתית עם swap כבוי (תמיכת swap ב-kubelet חדשה יותר ודורשת opt-in).</li>
<li><strong><code>vm.overcommit_memory</code></strong> — <code>0</code> היוריסטי (ברירת מחדל), ‏<code>1</code> תמיד לאשר, ‏<code>2</code> קפדני (commit limit = swap + RAM × <code>overcommit_ratio</code>%). ‏Redis מבקש <code>1</code>: ‏<code>BGSAVE</code> עושה fork לתהליך של 20GB; עם overcommit היוריסטי ה-fork יכול להיכשל למרות שבזכות copy-on-write הוא ייגע בהרבה פחות. מצב <code>2</code> שובר הרבה אפליקציות JVM/Go ששומרות טווחים וירטואליים גדולים.</li>
<li><strong><code>vm.max_map_count</code></strong> (ברירת מחדל 65530) — מקסימום אזורי memory-map לתהליך. ‏Elasticsearch/OpenSearch עושים mmap לכל segment של Lucene ומסרבים לעלות במצב production מתחת ל-<strong>262144</strong>: ‏<code>max virtual memory areas vm.max_map_count [65530] is too low</code>.</li>
<li><strong>Transparent Huge Pages</strong> — ה-kernel מקדם זיכרון אוטומטית לדפים של 2 MiB כדי לחסוך TLB misses. מצוין לעומסים גדולים וסדרתיים, רע לעומסים עם הרבה fork או גישה דלילה: Redis מזהיר כבר בעלייה (קפיצות latency וניפוח זיכרון בזמן CoW של fork, כי כתיבה של בייט אחד מעתיקה 2 MiB) וממליץ <code>never</code>. ‏MongoDB אמרו "תכבו THP" במשך שנים — אבל <strong>MongoDB 8.0 הפכו את ההמלצה</strong> וממליצים להפעיל THP. תקרא את התיעוד של הגרסה שלך.</li>
</ul>
<pre>$ cat /sys/kernel/mm/transparent_hugepage/enabled
[always] madvise never
$ echo madvise | sudo tee /sys/kernel/mm/transparent_hugepage/enabled  # runtime
# persist: kernel cmdline transparent_hugepage=madvise, or a oneshot systemd unit
$ cat /etc/sysctl.d/90-data.conf
vm.swappiness = 10            # PG host: keep shared_buffers in RAM
vm.overcommit_memory = 1      # Redis BGSAVE fork
vm.max_map_count = 262144     # Elasticsearch bootstrap check</pre>`
      }
    },
    {
      h: { en: "NUMA and the CPU governor", he: "NUMA ו-CPU governor" },
      body: {
        en: `<p>On 2-socket servers (and big cloud instances like 96+ vCPU), memory is attached to a specific CPU socket — a <strong>NUMA node</strong>. Local memory access ~80–100 ns, remote (across the interconnect) ~1.5–2× slower. A database whose threads run on node 0 while its memory sits on node 1 loses 20–30% for no visible reason.</p>
<pre>$ numactl --hardware
available: 2 nodes (0-1)
node 0 cpus: 0-23 48-71     node 0 size: 192000 MB
node 1 cpus: 24-47 72-95    node 1 size: 192000 MB
node distances:   0   1
  0:  10  21
  1:  21  10
$ numastat -p mysqld          # memory per node for a process
$ numactl --cpunodebind=0 --membind=0 ./redis-server    # pin to one node
$ sysctl vm.zone_reclaim_mode   # keep 0 for most DB/cache workloads</pre>
<p><strong>CPU governor:</strong> on bare metal, <code>powersave</code>/<code>ondemand</code> scales frequency down at idle, adding latency on bursts. Latency-sensitive hosts use <code>performance</code>:</p>
<pre>$ cpupower frequency-info | grep governor
$ sudo cpupower frequency-set -g performance</pre>
<p>On most cloud VMs the hypervisor owns P-states and <code>cpupower</code> reports nothing to change — that's normal. In Kubernetes, NUMA alignment is done by the kubelet's <strong>CPU Manager (static)</strong> + <strong>Topology Manager</strong> for Guaranteed pods with integer CPUs.</p>`,
        he: `<p>בשרתים עם 2 sockets (וב-instances גדולים בענן כמו 96+ vCPU), הזיכרון מחובר ל-socket ספציפי — <strong>NUMA node</strong>. גישה לזיכרון מקומי ‏~80–100ns, מרוחק (דרך ה-interconnect) איטי פי ~1.5–2. דאטאבייס שה-threads שלו רצים על node 0 והזיכרון שלו יושב על node 1 מפסיד 20–30% בלי סיבה נראית לעין.</p>
<pre>$ numactl --hardware
available: 2 nodes (0-1)
node 0 cpus: 0-23 48-71     node 0 size: 192000 MB
node 1 cpus: 24-47 72-95    node 1 size: 192000 MB
node distances:   0   1
  0:  10  21
  1:  21  10
$ numastat -p mysqld          # memory per node for a process
$ numactl --cpunodebind=0 --membind=0 ./redis-server    # pin to one node
$ sysctl vm.zone_reclaim_mode   # keep 0 for most DB/cache workloads</pre>
<p><strong>CPU governor:</strong> ב-bare metal, ‏<code>powersave</code>/<code>ondemand</code> מורידים תדר כשהמכונה idle, ומוסיפים latency ב-bursts. שרתים רגישים ל-latency משתמשים ב-<code>performance</code>:</p>
<pre>$ cpupower frequency-info | grep governor
$ sudo cpupower frequency-set -g performance</pre>
<p>ברוב ה-VMs בענן ה-hypervisor שולט ב-P-states ו-<code>cpupower</code> לא מראה מה לשנות — זה תקין. ב-Kubernetes, יישור NUMA נעשה ע"י <strong>CPU Manager (static)</strong> + <strong>Topology Manager</strong> של ה-kubelet עבור Pods מסוג Guaranteed עם CPUs שלמים.</p>`
      }
    },
    {
      h: { en: "Doing it in Kubernetes: safe vs unsafe sysctls, init containers", he: "לעשות את זה ב-Kubernetes: ‏sysctls בטוחים מול לא בטוחים, ‏init containers" },
      body: {
        en: `<p>Some sysctls are <strong>namespaced</strong> (per network namespace = per Pod): most <code>net.*</code>. Others are <strong>node-wide</strong>: all <code>vm.*</code>, <code>fs.file-max</code>. Kubernetes splits namespaced ones into <em>safe</em> (allowed by default: <code>net.ipv4.ip_local_port_range</code>, <code>net.ipv4.tcp_syncookies</code>, <code>net.ipv4.ping_group_range</code>, <code>net.ipv4.ip_unprivileged_port_start</code>, <code>kernel.shm_rmid_forced</code>, and in newer versions <code>tcp_keepalive_*</code>, <code>ip_local_reserved_ports</code>) and <em>unsafe</em> (everything else, e.g. <code>net.core.somaxconn</code>) which the kubelet must allow with <code>--allowed-unsafe-sysctls</code>.</p>
<pre>apiVersion: v1
kind: Pod
spec:
  securityContext:
    sysctls:
    - name: net.ipv4.ip_local_port_range      # safe: works everywhere
      value: "10240 65535"
    - name: net.core.somaxconn                # unsafe: Pod is rejected (SysctlForbidden)
      value: "8192"                           # unless kubelet allows it on that node</pre>
<p>Node-wide settings (<code>vm.max_map_count</code> for Elasticsearch) can't be set per Pod. Options, best first: bake it into the node image / node bootstrap (Karpenter <code>userData</code>, EKS launch template, GKE <code>linuxConfig.sysctls</code>, AKS custom node config); a privileged DaemonSet; or a privileged init container — which changes the <em>whole node</em> for everyone:</p>
<pre>initContainers:
- name: sysctl
  image: busybox:1.36
  securityContext: { privileged: true }
  command: ["sysctl", "-w", "vm.max_map_count=262144"]</pre>
<blockquote>⚠️ Production tip: Pod Security "restricted"/"baseline" blocks privileged init containers. Prefer node-level config with a dedicated node pool (taints) for the workloads that need it — and document it, because the next engineer will not guess why OpenSearch only runs on that pool.</blockquote>`,
        he: `<p>חלק מה-sysctls הם <strong>namespaced</strong> (לכל network namespace = לכל Pod): רוב ה-<code>net.*</code>. אחרים הם <strong>ברמת ה-node</strong>: כל ה-<code>vm.*</code>, ‏<code>fs.file-max</code>. ‏Kubernetes מחלק את ה-namespaced ל-<em>safe</em> (מותרים כברירת מחדל: ‏<code>net.ipv4.ip_local_port_range</code>, ‏<code>net.ipv4.tcp_syncookies</code>, ‏<code>net.ipv4.ping_group_range</code>, ‏<code>net.ipv4.ip_unprivileged_port_start</code>, ‏<code>kernel.shm_rmid_forced</code>, ובגרסאות חדשות גם <code>tcp_keepalive_*</code>, ‏<code>ip_local_reserved_ports</code>) ו-<em>unsafe</em> (כל השאר, למשל <code>net.core.somaxconn</code>) שה-kubelet צריך לאשר עם <code>--allowed-unsafe-sysctls</code>.</p>
<pre>apiVersion: v1
kind: Pod
spec:
  securityContext:
    sysctls:
    - name: net.ipv4.ip_local_port_range      # safe: works everywhere
      value: "10240 65535"
    - name: net.core.somaxconn                # unsafe: Pod is rejected (SysctlForbidden)
      value: "8192"                           # unless kubelet allows it on that node</pre>
<p>הגדרות ברמת node (‏<code>vm.max_map_count</code> ל-Elasticsearch) אי אפשר לקבוע per Pod. האפשרויות, מהטובה ביותר: לאפות את זה ב-image של ה-node / ב-bootstrap (‏<code>userData</code> של Karpenter, ‏launch template ב-EKS, ‏<code>linuxConfig.sysctls</code> ב-GKE, ‏custom node config ב-AKS); ‏DaemonSet עם privileged; או init container עם privileged — שמשנה את <em>כל ה-node</em> לכולם:</p>
<pre>initContainers:
- name: sysctl
  image: busybox:1.36
  securityContext: { privileged: true }
  command: ["sysctl", "-w", "vm.max_map_count=262144"]</pre>
<blockquote>⚠️ טיפ לפרודקשן: Pod Security ברמת "restricted"/"baseline" חוסם init containers עם privileged. עדיף config ברמת ה-node עם node pool ייעודי (taints) לעומסים שצריכים את זה — ותתעד, כי המהנדס הבא לא ינחש למה OpenSearch רץ רק על ה-pool הזה.</blockquote>`
      }
    }
  ],
  diagram: "evidence (nstat, /proc/PID/limits, dmesg, app logs)\n        |\n        v\n  hypothesis: 'accept queue overflows'\n        |\n        v\n  sysctl -w net.core.somaxconn=8192   (runtime, test)\n        |\n        v\n  metric moved?  --no-->  revert, find real bottleneck\n        | yes\n        v\n  /etc/sysctl.d/99-app.conf  + comment + ticket   (or node bootstrap / Pod securityContext in K8s)",
  handsOn: [
    { cmd: "sysctl net.core.somaxconn net.ipv4.ip_local_port_range net.ipv4.tcp_tw_reuse vm.swappiness vm.overcommit_memory vm.max_map_count", what: { en: "Read the current values of the sysctls from this lesson.", he: "לקרוא את הערכים הנוכחיים של ה-sysctls מהשיעור." } },
    { cmd: "nstat -az TcpExtListenOverflows TcpExtListenDrops; ss -lnt", what: { en: "Check for accept-queue overflows and compare Recv-Q to Send-Q per listener.", he: "לבדוק overflows ב-accept queue ולהשוות Recv-Q ל-Send-Q לכל listener." } },
    { cmd: "for p in $(pgrep -f nginx); do grep 'open files' /proc/$p/limits; ls /proc/$p/fd | wc -l; done", what: { en: "Compare a service's real nofile limit with how many fds it has open right now.", he: "להשוות את ה-nofile limit האמיתי של שירות לכמות ה-fds שפתוחים אצלו עכשיו." } },
    { cmd: "cat /sys/kernel/mm/transparent_hugepage/enabled; grep AnonHugePages /proc/meminfo", what: { en: "See the THP mode and how much memory is currently backed by huge pages.", he: "לראות את מצב ה-THP וכמה זיכרון כרגע יושב על huge pages." } },
    { cmd: "numactl --hardware; lscpu | grep -i numa", what: { en: "Find out whether your machine has multiple NUMA nodes and which CPUs belong to each.", he: "לבדוק אם למכונה יש כמה NUMA nodes ואילו CPUs שייכים לכל אחד." } }
  ],
  mnemonic: {
    en: "Evidence, change, verify, persist (with a comment). 'Too many open files' = check /proc/PID/limits, not your shell.",
    he: "ראיה, שינוי, אימות, קיבוע (עם הערה). ‏'Too many open files' = תבדוק /proc/PID/limits, לא את ה-shell שלך."
  },
  pitfalls: [
    { en: "Setting nofile in /etc/security/limits.conf for a systemd service — it only applies to PAM login sessions. Use LimitNOFILE= in the unit.", he: "לקבוע nofile ב-/etc/security/limits.conf לשירות systemd — זה חל רק על sessions של PAM. תשתמש ב-LimitNOFILE= ביוניט." },
    { en: "Pasting a 2012 tuning blog with tcp_tw_recycle — it was removed in kernel 4.12 and broke NAT clients when it existed.", he: "להדביק בלוג tuning מ-2012 עם tcp_tw_recycle — הוא הוסר ב-kernel 4.12 ושבר לקוחות מאחורי NAT כשהוא עוד היה קיים." },
    { en: "Changing a sysctl with sysctl -w during an incident and never persisting it — the next reboot silently brings the outage back.", he: "לשנות sysctl עם sysctl -w באמצע תקלה ולא לקבע אותו אף פעם — ה-reboot הבא מחזיר את התקלה בשקט." },
    { en: "Using a privileged init container for vm.max_map_count in a shared cluster: it changes the node for every tenant and is blocked by Pod Security standards.", he: "להשתמש ב-init container עם privileged בשביל vm.max_map_count ב-cluster משותף: זה משנה את ה-node לכל ה-tenants ונחסם ע\"י Pod Security standards." }
  ],
  interview: [
    {
      q: { en: "A proxy logs 'Cannot assign requested address' under load. What's happening and how do you fix it?", he: "proxy כותב 'Cannot assign requested address' תחת עומס. מה קורה ואיך מתקנים?" },
      a: { en: "Ephemeral port exhaustion: each outgoing connection to the same upstream IP:port needs a unique local port, and closed ones sit in TIME_WAIT for 60s. ~28k ports / 60s ≈ 470 new conns/s. Fix properly with upstream keep-alive/pooling; mitigate with a wider ip_local_port_range, tcp_tw_reuse=1, or more upstream IPs.", he: "מיצוי פורטים אפמרליים: כל חיבור יוצא לאותו IP:port של upstream צריך פורט מקומי ייחודי, וחיבורים סגורים יושבים 60 שניות ב-TIME_WAIT. ‏~28 אלף פורטים / 60 שניות ≈ ‏470 חיבורים חדשים בשנייה. התיקון הנכון: keep-alive/pooling מול ה-upstream; הקלה: ip_local_port_range רחב יותר, ‏tcp_tw_reuse=1, או יותר IPs ל-upstream." }
    },
    {
      q: { en: "Why does Redis want vm.overcommit_memory=1 and THP disabled?", he: "למה Redis רוצה vm.overcommit_memory=1 ו-THP כבוי?" },
      a: { en: "BGSAVE/AOF rewrite fork the whole process. With heuristic overcommit, forking a large process can fail even though CoW means little memory is actually copied; mode 1 lets it succeed. With THP, every write after fork copies a 2 MiB page instead of 4 KiB, causing latency spikes and memory blow-up during the snapshot.", he: "BGSAVE/AOF rewrite עושים fork לכל התהליך. עם overcommit היוריסטי, fork של תהליך גדול יכול להיכשל למרות שבזכות CoW מעט זיכרון מועתק בפועל; מצב 1 נותן לו להצליח. עם THP, כל כתיבה אחרי ה-fork מעתיקה דף של 2 MiB במקום 4 KiB, מה שגורם לקפיצות latency ולניפוח זיכרון בזמן ה-snapshot." }
    },
    {
      q: { en: "How do you set vm.max_map_count for Elasticsearch on Kubernetes?", he: "איך קובעים vm.max_map_count ל-Elasticsearch ב-Kubernetes?" },
      a: { en: "It's node-wide (not namespaced), so Pod securityContext.sysctls can't set it. Best: node bootstrap/image config (GKE linuxConfig, EKS launch template, Karpenter userData) on a dedicated node pool. Alternatives: a privileged DaemonSet or init container running sysctl -w — works, but affects the whole node and violates restricted Pod Security.", he: "זה ברמת node (לא namespaced), אז securityContext.sysctls של Pod לא יכול לקבוע אותו. הכי טוב: config ב-bootstrap/image של ה-node (‏linuxConfig ב-GKE, ‏launch template ב-EKS, ‏userData ב-Karpenter) על node pool ייעודי. חלופות: DaemonSet או init container עם privileged שמריץ sysctl -w — עובד, אבל משפיע על כל ה-node ומפר Pod Security ברמת restricted." }
    }
  ],
  quiz: [
    {
      q: { en: "A systemd service hits 'Too many open files'. You added 'app soft nofile 65536' to /etc/security/limits.conf and restarted. Still failing. Why?", he: "שירות systemd מקבל 'Too many open files'. הוספת 'app soft nofile 65536' ל-/etc/security/limits.conf ועשית restart. עדיין נכשל. למה?" },
      options: [
        { en: "fs.file-max is too low", he: "fs.file-max נמוך מדי" },
        { en: "limits.conf applies to PAM login sessions; systemd services need LimitNOFILE= in the unit", he: "limits.conf חל על sessions של PAM; שירותי systemd צריכים LimitNOFILE= ביוניט" },
        { en: "You need a reboot for limits.conf", he: "צריך reboot בשביל limits.conf" },
        { en: "nofile can't exceed 1024", he: "nofile לא יכול לעבור 1024" }
      ],
      answer: 1,
      explain: { en: "systemd starts services outside PAM, so limits.conf is ignored. Set LimitNOFILE=65536 (systemctl edit), daemon-reload, restart, and verify in /proc/PID/limits.", he: "systemd מריץ שירותים מחוץ ל-PAM, אז limits.conf לא נלקח בחשבון. קובעים LimitNOFILE=65536 (‏systemctl edit), ‏daemon-reload, ‏restart, ומוודאים ב-/proc/PID/limits." }
    },
    {
      q: { en: "Which sysctl must be raised for Elasticsearch to pass its bootstrap checks?", he: "איזה sysctl צריך להעלות כדי ש-Elasticsearch יעבור את ה-bootstrap checks?" },
      options: [
        { en: "net.core.somaxconn", he: "net.core.somaxconn" },
        { en: "vm.swappiness", he: "vm.swappiness" },
        { en: "vm.max_map_count to at least 262144", he: "vm.max_map_count לפחות ל-262144" },
        { en: "fs.file-max to 65530", he: "fs.file-max ל-65530" }
      ],
      answer: 2,
      explain: { en: "Lucene memory-maps its segment files; the default 65530 map areas isn't enough, so ES requires vm.max_map_count ≥ 262144.", he: "Lucene עושה memory-map לקבצי ה-segment; ברירת המחדל של 65530 אזורים לא מספיקה, אז ES דורש vm.max_map_count ≥ 262144." }
    },
    {
      q: { en: "In Kubernetes, a Pod sets net.core.somaxconn in securityContext.sysctls and fails with SysctlForbidden. Why?", he: "ב-Kubernetes, ‏Pod קובע net.core.somaxconn ב-securityContext.sysctls ונכשל עם SysctlForbidden. למה?" },
      options: [
        { en: "somaxconn is node-wide and can never be set per Pod", he: "somaxconn הוא ברמת node ואי אפשר לקבוע אותו per Pod אף פעם" },
        { en: "It's namespaced but 'unsafe'; the kubelet must allow it via --allowed-unsafe-sysctls", he: "הוא namespaced אבל 'unsafe'; ה-kubelet צריך לאשר אותו דרך --allowed-unsafe-sysctls" },
        { en: "Sysctls are only allowed in init containers", he: "sysctls מותרים רק ב-init containers" },
        { en: "The value must be a power of two", he: "הערך חייב להיות חזקה של 2" }
      ],
      answer: 1,
      explain: { en: "net.core.somaxconn is per network namespace, but not on the safe list. Enable it per node with --allowed-unsafe-sysctls=net.core.somaxconn and schedule the Pod there.", he: "net.core.somaxconn הוא per network namespace, אבל לא ברשימת ה-safe. מאפשרים אותו per node עם --allowed-unsafe-sysctls=net.core.somaxconn ומתזמנים את ה-Pod לשם." }
    },
    {
      q: { en: "What's the right first step before adding a sysctl to /etc/sysctl.d?", he: "מה הצעד הראשון הנכון לפני שמוסיפים sysctl ל-/etc/sysctl.d?" },
      options: [
        { en: "Copy a well-known tuning guide", he: "להעתיק מדריך tuning מוכר" },
        { en: "Reboot to clear state", he: "reboot כדי לנקות state" },
        { en: "Find a metric showing you hit that limit, change it at runtime, and verify the metric improves", he: "למצוא מטריקה שמראה שנתקעת ב-limit, לשנות בזמן ריצה, ולוודא שהמטריקה השתפרה" },
        { en: "Set every value to its maximum", he: "לקבוע כל ערך למקסימום" }
      ],
      answer: 2,
      explain: { en: "Measure, change, verify, then persist with a comment explaining why. Blind tuning hides the real bottleneck and creates surprises later.", he: "מודדים, משנים, מוודאים, ואז מקבעים עם הערה שמסבירה למה. ‏tuning עיוור מסתיר את צוואר הבקבוק האמיתי ויוצר הפתעות בהמשך." }
    }
  ],
  playground: "terminal",
  related: ["linux-performance-60s", "linux-systemd-logs", "memory", "cpu", "linux-processes"]
});

/* ============================== BOOT PROCESS & RESCUE ============================== */
INFRA.lessons.push({
  id: "linux-boot-rescue",
  track: "linux",
  order: 21,
  icon: "🛟",
  level: 3,
  minutes: 13,
  title: { en: "Boot process & rescue: GRUB, initramfs, systemd, serial consoles", he: "תהליך ה-boot וחילוץ: GRUB, ‏initramfs, ‏systemd, ‏serial console" },
  tldr: {
    en: "Firmware → GRUB → kernel + initramfs → systemd → targets: know where in that chain it died (the serial console tells you), and you'll know whether to fix fstab, the kernel cmdline, or detach the disk to a helper VM.",
    he: "Firmware ← GRUB ← kernel + initramfs ← systemd ← targets: תדע איפה בשרשרת זה מת (ה-serial console יגיד לך), ותדע אם לתקן את ה-fstab, את ה-cmdline של ה-kernel, או לנתק את הדיסק ל-VM עזר."
  },
  analogy: {
    en: "Booting is a relay race. The firmware hands the baton to GRUB, GRUB to the kernel, the kernel uses a tiny backpack (initramfs) with just enough tools to reach the real root disk, then hands off to systemd, who wakes up every service. When a VM 'won't boot', your first job is to find which runner dropped the baton — and in the cloud, the serial console is the only camera on the track.",
    he: "boot זה מרוץ שליחים. ה-firmware מעביר את המקל ל-GRUB, ‏GRUB ל-kernel, ה-kernel משתמש בתרמיל קטן (initramfs) עם בדיוק מספיק כלים כדי להגיע לדיסק ה-root האמיתי, ואז מעביר ל-systemd, שמעיר את כל השירותים. כש-VM 'לא עולה', העבודה הראשונה שלך היא למצוא איזה רץ הפיל את המקל — ובענן, ה-serial console הוא המצלמה היחידה על המסלול."
  },
  sections: [
    {
      h: { en: "The chain: UEFI/BIOS → GRUB → kernel + initramfs → systemd", he: "השרשרת: UEFI/BIOS ← GRUB ← kernel + initramfs ← systemd" },
      body: {
        en: `<ol>
<li><strong>Firmware</strong> — BIOS reads the first 512 bytes of the disk (MBR); UEFI reads a bootloader file from the FAT32 <strong>EFI System Partition</strong> (<code>/boot/efi/EFI/ubuntu/shimx64.efi</code>), optionally verified by Secure Boot.</li>
<li><strong>GRUB</strong> — reads <code>/boot/grub/grub.cfg</code> (generated from <code>/etc/default/grub</code> by <code>update-grub</code> / <code>grub2-mkconfig</code>), shows the menu, loads <code>vmlinuz</code> + <code>initramfs</code> into RAM and passes the <strong>kernel command line</strong>: <code>root=UUID=... ro console=ttyS0,115200</code>.</li>
<li><strong>Kernel</strong> — initializes CPU, memory, devices, then unpacks the <strong>initramfs</strong>: a small root filesystem with the drivers and tools needed to find the real root (NVMe/virtio drivers, LVM, LUKS, RAID). It mounts root and <code>switch_root</code>s into it.</li>
<li><strong>systemd (PID 1)</strong> — reads units, mounts <code>/etc/fstab</code> entries, starts services in parallel by dependency until it reaches the default <strong>target</strong> (<code>multi-user.target</code> on servers, <code>graphical.target</code> on desktops).</li>
</ol>
<pre>$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-6.8.0-1015-aws root=PARTUUID=4f1c... ro console=tty1 console=ttyS0 nvme_core.io_timeout=4294967295
$ systemctl get-default
multi-user.target
$ systemd-analyze
Startup finished in 2.1s (kernel) + 9.8s (userspace) = 11.9s
$ systemd-analyze blame | head -3
6.211s cloud-init.service
2.003s systemd-networkd-wait-online.service
 812ms docker.service
$ systemd-analyze critical-chain docker.service</pre>`,
        he: `<ol>
<li><strong>Firmware</strong> — ‏BIOS קורא את 512 הבייטים הראשונים בדיסק (MBR); ‏UEFI קורא קובץ bootloader מה-<strong>EFI System Partition</strong> שהיא FAT32 (‏<code>/boot/efi/EFI/ubuntu/shimx64.efi</code>), ואופציונלית מאמת אותו עם Secure Boot.</li>
<li><strong>GRUB</strong> — קורא את <code>/boot/grub/grub.cfg</code> (נוצר מ-<code>/etc/default/grub</code> ע"י <code>update-grub</code> / <code>grub2-mkconfig</code>), מציג תפריט, טוען <code>vmlinuz</code> + <code>initramfs</code> ל-RAM ומעביר את <strong>ה-command line של ה-kernel</strong>: ‏<code>root=UUID=... ro console=ttyS0,115200</code>.</li>
<li><strong>Kernel</strong> — מאתחל CPU, זיכרון, התקנים, ואז פורס את ה-<strong>initramfs</strong>: ‏root filesystem קטן עם ה-drivers והכלים שצריך כדי למצוא את ה-root האמיתי (‏drivers של NVMe/virtio, ‏LVM, ‏LUKS, ‏RAID). הוא עושה mount ל-root ו-<code>switch_root</code> אליו.</li>
<li><strong>systemd (PID 1)</strong> — קורא units, עושה mount לרשומות ב-<code>/etc/fstab</code>, מעלה שירותים במקביל לפי תלויות עד שהוא מגיע ל-<strong>target</strong> ברירת המחדל (‏<code>multi-user.target</code> בשרתים, ‏<code>graphical.target</code> בדסקטופ).</li>
</ol>
<pre>$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-6.8.0-1015-aws root=PARTUUID=4f1c... ro console=tty1 console=ttyS0 nvme_core.io_timeout=4294967295
$ systemctl get-default
multi-user.target
$ systemd-analyze
Startup finished in 2.1s (kernel) + 9.8s (userspace) = 11.9s
$ systemd-analyze blame | head -3
6.211s cloud-init.service
2.003s systemd-networkd-wait-online.service
 812ms docker.service
$ systemd-analyze critical-chain docker.service</pre>`
      }
    },
    {
      h: { en: "Where it breaks: reading the failure", he: "איפה זה נשבר: לקרוא את הכשל" },
      body: {
        en: `<table>
<tr><th>Last thing you see</th><th>Stage</th><th>Usual cause</th></tr>
<tr><td><code>grub rescue&gt;</code> / <code>error: no such partition</code></td><td>GRUB</td><td>Partition table changed, /boot deleted, wrong disk order</td></tr>
<tr><td><code>Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)</code></td><td>Kernel/initramfs</td><td>Missing/broken initramfs, missing storage driver (e.g. changed instance type to Nitro without the NVMe driver), wrong <code>root=</code></td></tr>
<tr><td><code>dracut-initqueue timeout ... /dev/disk/by-uuid/... does not exist</code> → dracut shell</td><td>initramfs</td><td>Root UUID changed, LVM VG renamed</td></tr>
<tr><td><code>You are in emergency mode</code></td><td>systemd</td><td>A non-<code>nofail</code> fstab entry failed to mount, or fsck failed</td></tr>
<tr><td>Boots, but no SSH</td><td>Userspace</td><td>Network config, sshd failed, firewall, disk full, cloud-init failure</td></tr>
</table>
<p><strong>Kernel panic</strong> = the kernel hit an unrecoverable error and stopped. Make machines reboot themselves instead of hanging forever (<code>kernel.panic = 10</code> → reboot after 10s), and capture a crash dump with <strong>kdump</strong> for root-cause analysis. A panic in the middle of uptime (not at boot) is usually hardware, a buggy driver/module, or an OOM with <code>panic_on_oom</code>.</p>
<pre>$ journalctl -b -1 -p err          # errors from the PREVIOUS boot
$ journalctl --list-boots | tail -3
$ systemctl --failed
  UNIT          LOAD   ACTIVE SUB    DESCRIPTION
● data.mount    loaded failed failed /data</pre>`,
        he: `<table>
<tr><th>הדבר האחרון שאתה רואה</th><th>שלב</th><th>סיבה נפוצה</th></tr>
<tr><td><code>grub rescue&gt;</code> / <code>error: no such partition</code></td><td>GRUB</td><td>טבלת המחיצות השתנתה, ‏/boot נמחק, סדר דיסקים שגוי</td></tr>
<tr><td><code>Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)</code></td><td>Kernel/initramfs</td><td>initramfs חסר/שבור, ‏driver אחסון חסר (למשל שינית instance type ל-Nitro בלי driver של NVMe), ‏<code>root=</code> שגוי</td></tr>
<tr><td><code>dracut-initqueue timeout ... /dev/disk/by-uuid/... does not exist</code> ← shell של dracut</td><td>initramfs</td><td>ה-UUID של root השתנה, ‏VG של LVM שונה שם</td></tr>
<tr><td><code>You are in emergency mode</code></td><td>systemd</td><td>רשומה ב-fstab בלי <code>nofail</code> נכשלה ב-mount, או ש-fsck נכשל</td></tr>
<tr><td>עולה, אבל אין SSH</td><td>Userspace</td><td>config רשת, ‏sshd נפל, ‏firewall, דיסק מלא, כשל של cloud-init</td></tr>
</table>
<p><strong>Kernel panic</strong> = ה-kernel נתקל בשגיאה שאי אפשר להתאושש ממנה ועצר. תגרום למכונות לעשות reboot לבד במקום להיתקע לנצח (‏<code>kernel.panic = 10</code> ← ‏reboot אחרי 10 שניות), ותאסוף crash dump עם <strong>kdump</strong> לניתוח root cause. ‏panic באמצע uptime (לא ב-boot) הוא בדרך כלל חומרה, driver/module באגי, או OOM עם <code>panic_on_oom</code>.</p>
<pre>$ journalctl -b -1 -p err          # errors from the PREVIOUS boot
$ journalctl --list-boots | tail -3
$ systemctl --failed
  UNIT          LOAD   ACTIVE SUB    DESCRIPTION
● data.mount    loaded failed failed /data</pre>`
      }
    },
    {
      h: { en: "Rescue and emergency mode, a bad fstab, a lost root password", he: "Rescue ו-emergency mode, ‏fstab שבור, סיסמת root שאבדה" },
      body: {
        en: `<p>At the GRUB menu press <code>e</code>, go to the line starting with <code>linux</code>, append a parameter, boot with <code>Ctrl+X</code>:</p>
<ul>
<li><code>systemd.unit=rescue.target</code> — single-user: root fs mounted, basic services, no network. Needs the root password.</li>
<li><code>systemd.unit=emergency.target</code> — even less: root mounted <strong>read-only</strong>, almost nothing else. Also needs root's password.</li>
<li><code>rd.break</code> (RHEL/dracut) — stop inside the initramfs before switching to the real root. <strong>No password</strong> — this is how you reset root's.</li>
<li><code>init=/bin/bash</code> — the kernel runs bash as PID 1 instead of systemd. No password, no services.</li>
</ul>
<p><strong>Fixing a bad fstab</strong> (the #1 "won't boot after reboot" cause):</p>
<pre>You are in emergency mode. After logging in, type "journalctl -xb" to view
system logs, "systemctl reboot" to reboot, "systemctl default" or "exit"
to boot into default mode.
Give root password for maintenance
(or press Control-D to continue):
# mount -o remount,rw /
# vi /etc/fstab
UUID=5e7a...-c901  /data  xfs  defaults,nofail,x-systemd.device-timeout=10s  0 2
# mount -a &amp;&amp; systemctl daemon-reload &amp;&amp; reboot</pre>
<p><strong>Resetting root's password (RHEL family)</strong>: boot with <code>rd.break</code>, then:</p>
<pre>switch_root:/# mount -o remount,rw /sysroot
switch_root:/# chroot /sysroot
sh-5.1# passwd root
sh-5.1# touch /.autorelabel        # SELinux: relabel on next boot, or login breaks
sh-5.1# exit; exit</pre>
<p>On Debian/Ubuntu: <code>init=/bin/bash</code>, then <code>mount -o remount,rw /</code>, <code>passwd</code>, <code>sync</code>, <code>reboot -f</code>.</p>
<blockquote>⚠️ Production tip: physical/console access = root. That's why serial console access in the cloud is gated by IAM, and why disk encryption matters for anything that can be stolen.</blockquote>`,
        he: `<p>בתפריט של GRUB לוחצים <code>e</code>, הולכים לשורה שמתחילה ב-<code>linux</code>, מוסיפים פרמטר, ועושים boot עם <code>Ctrl+X</code>:</p>
<ul>
<li><code>systemd.unit=rescue.target</code> — single-user: ה-root fs עושה mount, שירותים בסיסיים, בלי רשת. דורש סיסמת root.</li>
<li><code>systemd.unit=emergency.target</code> — עוד פחות: ה-root עושה mount <strong>read-only</strong>, כמעט כלום מעבר. גם דורש סיסמת root.</li>
<li><code>rd.break</code> (RHEL/dracut) — עוצר בתוך ה-initramfs לפני המעבר ל-root האמיתי. <strong>בלי סיסמה</strong> — ככה מאפסים את סיסמת ה-root.</li>
<li><code>init=/bin/bash</code> — ה-kernel מריץ bash בתור PID 1 במקום systemd. בלי סיסמה, בלי שירותים.</li>
</ul>
<p><strong>תיקון fstab שבור</strong> (הסיבה מספר 1 ל-"לא עולה אחרי reboot"):</p>
<pre>You are in emergency mode. After logging in, type "journalctl -xb" to view
system logs, "systemctl reboot" to reboot, "systemctl default" or "exit"
to boot into default mode.
Give root password for maintenance
(or press Control-D to continue):
# mount -o remount,rw /
# vi /etc/fstab
UUID=5e7a...-c901  /data  xfs  defaults,nofail,x-systemd.device-timeout=10s  0 2
# mount -a &amp;&amp; systemctl daemon-reload &amp;&amp; reboot</pre>
<p><strong>איפוס סיסמת root (משפחת RHEL)</strong>: ‏boot עם <code>rd.break</code>, ואז:</p>
<pre>switch_root:/# mount -o remount,rw /sysroot
switch_root:/# chroot /sysroot
sh-5.1# passwd root
sh-5.1# touch /.autorelabel        # SELinux: relabel on next boot, or login breaks
sh-5.1# exit; exit</pre>
<p>ב-Debian/Ubuntu: ‏<code>init=/bin/bash</code>, ואז <code>mount -o remount,rw /</code>, ‏<code>passwd</code>, ‏<code>sync</code>, ‏<code>reboot -f</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: גישה פיזית/קונסולה = root. בגלל זה הגישה ל-serial console בענן מוגנת ב-IAM, ובגלל זה הצפנת דיסק חשובה לכל דבר שאפשר לגנוב.</blockquote>`
      }
    },
    {
      h: { en: "Cloud specifics: serial consoles and cloud-init", he: "ספציפי לענן: serial consoles ו-cloud-init" },
      body: {
        en: `<p>No keyboard, no monitor — the kernel and systemd write to the serial port (<code>console=ttyS0</code>), and every cloud lets you read it:</p>
<table>
<tr><th>Cloud</th><th>Read-only output</th><th>Interactive console</th></tr>
<tr><td>AWS</td><td><code>aws ec2 get-console-output --instance-id i-0abc --latest</code>, <code>get-console-screenshot</code></td><td>EC2 Serial Console (Nitro): <code>aws ec2 enable-serial-console-access</code> once per region, then connect from the console or <code>ec2-instance-connect send-serial-console-ssh-public-key</code></td></tr>
<tr><td>Azure</td><td>Boot diagnostics (screenshot + serial log)</td><td>Serial Console in the portal — requires boot diagnostics enabled</td></tr>
<tr><td>GCP</td><td><code>gcloud compute instances get-serial-port-output vm-1</code></td><td><code>gcloud compute connect-to-serial-port vm-1</code> after metadata <code>serial-port-enable=TRUE</code></td></tr>
</table>
<p>The catch: an interactive console still needs a <strong>local user with a password</strong> to log in. Cloud images ship key-only users, so plan ahead: a break-glass user with a vaulted password, or accept that rescue = helper VM.</p>
<p><strong>cloud-init</strong> is what turns a generic image into <em>your</em> VM on first boot: sets hostname, injects SSH keys, writes files, runs <code>user-data</code>. Stages: <code>init-local</code> → <code>init</code> (network) → <code>modules:config</code> → <code>modules:final</code> (your <code>runcmd</code> scripts). User-data runs <strong>once per instance</strong> by default — editing it and rebooting does nothing.</p>
<pre>$ cloud-init status --long
status: error
detail: ('scripts_user', RuntimeError('Runparts: 1 failures (part-001) in /var/lib/cloud/instance/scripts'))
$ sudo tail -50 /var/log/cloud-init-output.log     # stdout/stderr of your scripts
$ sudo grep -i error /var/log/cloud-init.log       # cloud-init's own log
$ cloud-init analyze blame | head -3
$ sudo cloud-init clean --logs &amp;&amp; sudo reboot      # re-run as if first boot (testing only)</pre>`,
        he: `<p>אין מקלדת, אין מסך — ה-kernel ו-systemd כותבים לפורט הסריאלי (‏<code>console=ttyS0</code>), וכל ענן נותן לך לקרוא אותו:</p>
<table>
<tr><th>ענן</th><th>פלט לקריאה בלבד</th><th>קונסולה אינטראקטיבית</th></tr>
<tr><td>AWS</td><td><code>aws ec2 get-console-output --instance-id i-0abc --latest</code>, ‏<code>get-console-screenshot</code></td><td>EC2 Serial Console (‏Nitro): ‏<code>aws ec2 enable-serial-console-access</code> פעם אחת לכל region, ואז מתחברים מהקונסולה או עם <code>ec2-instance-connect send-serial-console-ssh-public-key</code></td></tr>
<tr><td>Azure</td><td>Boot diagnostics (צילום מסך + serial log)</td><td>Serial Console בפורטל — דורש boot diagnostics פעיל</td></tr>
<tr><td>GCP</td><td><code>gcloud compute instances get-serial-port-output vm-1</code></td><td><code>gcloud compute connect-to-serial-port vm-1</code> אחרי metadata ‏<code>serial-port-enable=TRUE</code></td></tr>
</table>
<p>המלכודת: קונסולה אינטראקטיבית עדיין צריכה <strong>משתמש מקומי עם סיסמה</strong> כדי להתחבר. ה-images בענן מגיעים עם משתמשים של key בלבד, אז תתכנן מראש: משתמש break-glass עם סיסמה בכספת, או שתקבל ש-rescue = ‏VM עזר.</p>
<p><strong>cloud-init</strong> הוא מה שהופך image גנרי ל-VM <em>שלך</em> ב-boot הראשון: קובע hostname, מזריק מפתחות SSH, כותב קבצים, מריץ <code>user-data</code>. שלבים: <code>init-local</code> ← <code>init</code> (רשת) ← <code>modules:config</code> ← <code>modules:final</code> (סקריפטי ה-<code>runcmd</code> שלך). ה-user-data רץ <strong>פעם אחת לכל instance</strong> כברירת מחדל — לערוך אותו ולעשות reboot לא עושה כלום.</p>
<pre>$ cloud-init status --long
status: error
detail: ('scripts_user', RuntimeError('Runparts: 1 failures (part-001) in /var/lib/cloud/instance/scripts'))
$ sudo tail -50 /var/log/cloud-init-output.log     # stdout/stderr of your scripts
$ sudo grep -i error /var/log/cloud-init.log       # cloud-init's own log
$ cloud-init analyze blame | head -3
$ sudo cloud-init clean --logs &amp;&amp; sudo reboot      # re-run as if first boot (testing only)</pre>`
      }
    },
    {
      h: { en: "Rescuing an unbootable VM: detach the disk to a helper VM", he: "חילוץ VM שלא עולה: לנתק את הדיסק ל-VM עזר" },
      body: {
        en: `<p>When you can't log in through the console, operate on the disk from outside:</p>
<pre># 0. Snapshot the broken root volume first. Always.
$ aws ec2 create-snapshot --volume-id vol-0broken --description "pre-rescue"
# 1. Stop the instance (stop, NOT terminate — DeleteOnTermination may be true)
$ aws ec2 stop-instances --instance-ids i-0broken
$ aws ec2 detach-volume --volume-id vol-0broken
# 2. Attach to a helper VM in the SAME AZ, same OS family
$ aws ec2 attach-volume --volume-id vol-0broken --instance-id i-0helper --device /dev/sdf
# 3. On the helper
$ lsblk
nvme0n1      259:0  0  20G  0 disk
└─nvme0n1p1  259:1  0  20G  0 part /
nvme1n1      259:2  0  50G  0 disk          &lt;- the broken root
└─nvme1n1p1  259:3  0  50G  0 part
$ sudo mount -o nouuid /dev/nvme1n1p1 /mnt   # XFS from same AMI = duplicate UUID
$ sudo vi /mnt/etc/fstab                     # or: chroot /mnt to rebuild initramfs / grub
$ sudo umount /mnt
# 4. Re-attach as the ROOT device name and start
$ aws ec2 detach-volume --volume-id vol-0broken
$ aws ec2 attach-volume --volume-id vol-0broken --instance-id i-0broken --device /dev/xvda
$ aws ec2 start-instances --instance-ids i-0broken</pre>
<p>Need to rebuild the initramfs or GRUB? <code>for d in dev proc sys; do mount --bind /$d /mnt/$d; done; chroot /mnt</code>, then <code>dracut -f --kver 6.x</code> or <code>update-initramfs -u</code> / <code>grub2-install</code>. Azure automates this flow with <code>az vm repair create</code> / <code>az vm repair restore</code>; AWS has EC2Rescue and the AWSSupport-ExecuteEC2Rescue automation; on GCP you do the same detach/attach with <code>gcloud compute instances detach-disk / attach-disk</code>.</p>
<blockquote>💡 Real world: the best rescue is not needing one. Cattle, not pets: if the VM is stateless and built from an image + IaC, replacing it is faster than rescuing it. Rescue is for the pets you still have — the old database box, the license server.</blockquote>`,
        he: `<p>כשאי אפשר להתחבר דרך הקונסולה, עובדים על הדיסק מבחוץ:</p>
<pre># 0. Snapshot the broken root volume first. Always.
$ aws ec2 create-snapshot --volume-id vol-0broken --description "pre-rescue"
# 1. Stop the instance (stop, NOT terminate — DeleteOnTermination may be true)
$ aws ec2 stop-instances --instance-ids i-0broken
$ aws ec2 detach-volume --volume-id vol-0broken
# 2. Attach to a helper VM in the SAME AZ, same OS family
$ aws ec2 attach-volume --volume-id vol-0broken --instance-id i-0helper --device /dev/sdf
# 3. On the helper
$ lsblk
nvme0n1      259:0  0  20G  0 disk
└─nvme0n1p1  259:1  0  20G  0 part /
nvme1n1      259:2  0  50G  0 disk          &lt;- the broken root
└─nvme1n1p1  259:3  0  50G  0 part
$ sudo mount -o nouuid /dev/nvme1n1p1 /mnt   # XFS from same AMI = duplicate UUID
$ sudo vi /mnt/etc/fstab                     # or: chroot /mnt to rebuild initramfs / grub
$ sudo umount /mnt
# 4. Re-attach as the ROOT device name and start
$ aws ec2 detach-volume --volume-id vol-0broken
$ aws ec2 attach-volume --volume-id vol-0broken --instance-id i-0broken --device /dev/xvda
$ aws ec2 start-instances --instance-ids i-0broken</pre>
<p>צריך לבנות מחדש initramfs או GRUB? ‏<code>for d in dev proc sys; do mount --bind /$d /mnt/$d; done; chroot /mnt</code>, ואז <code>dracut -f --kver 6.x</code> או <code>update-initramfs -u</code> / <code>grub2-install</code>. ‏Azure עושה אוטומציה לכל הזרימה הזו עם <code>az vm repair create</code> / <code>az vm repair restore</code>; ב-AWS יש EC2Rescue וה-automation ‏AWSSupport-ExecuteEC2Rescue; ב-GCP עושים אותו detach/attach עם <code>gcloud compute instances detach-disk / attach-disk</code>.</p>
<blockquote>💡 מהשטח: החילוץ הכי טוב הוא כזה שלא צריך. Cattle, not pets: אם ה-VM הוא stateless ונבנה מ-image + IaC, להחליף אותו מהיר יותר מלחלץ אותו. ‏rescue זה בשביל ה-pets שעוד נשארו לך — קופסת הדאטאבייס הישנה, שרת הרישיונות.</blockquote>`
      }
    }
  ],
  diagram: "power on\n   |\nUEFI/BIOS --(ESP / MBR)--> GRUB --(vmlinuz + initramfs + cmdline)--> kernel\n                              |  'e' to edit: rd.break | systemd.unit=rescue.target | init=/bin/bash\n                                                                     |\n                                   initramfs: load nvme/lvm drivers, find root=UUID, switch_root\n                                                                     |\n                                   systemd (PID 1): fstab mounts -> services -> multi-user.target\n                                                                     |\n                                   cloud-init: hostname, ssh keys, user-data (once per instance)\n\nwhere it died?  serial console output -> GRUB | kernel panic | dracut shell | emergency mode | no SSH",
  handsOn: [
    { cmd: "systemd-analyze && systemd-analyze blame | head -10 && systemd-analyze critical-chain", what: { en: "See how long boot took and which units are on the critical path.", he: "לראות כמה זמן לקח ה-boot ואילו units על ה-critical path." } },
    { cmd: "cat /proc/cmdline; ls -lh /boot", what: { en: "Inspect the kernel command line and the installed kernels and initramfs images.", he: "לבדוק את ה-command line של ה-kernel ואת ה-kernels וה-initramfs המותקנים." } },
    { cmd: "journalctl --list-boots | tail -3; journalctl -b -1 -p err --no-pager | tail -20", what: { en: "Read errors from the previous boot — the first stop after an unexpected reboot.", he: "לקרוא שגיאות מה-boot הקודם — העצירה הראשונה אחרי reboot לא צפוי." } },
    { cmd: "aws ec2 get-console-output --instance-id i-0abc --latest --output text | tail -40", what: { en: "Read the serial console of an EC2 instance that doesn't answer SSH.", he: "לקרוא את ה-serial console של EC2 instance שלא עונה ל-SSH." } },
    { cmd: "cloud-init status --long; sudo tail -30 /var/log/cloud-init-output.log", what: { en: "Check whether first-boot provisioning (user-data) succeeded and see its output.", he: "לבדוק אם ה-provisioning של ה-boot הראשון (user-data) הצליח ולראות את הפלט שלו." } }
  ],
  mnemonic: {
    en: "F-G-K-I-S: Firmware, GRUB, Kernel, Initramfs, Systemd. Find the runner who dropped the baton — then nofail every non-root mount.",
    he: "F-G-K-I-S: ‏Firmware, ‏GRUB, ‏Kernel, ‏Initramfs, ‏Systemd. תמצא את הרץ שהפיל את המקל — ותשים nofail על כל mount שהוא לא root."
  },
  pitfalls: [
    { en: "Adding a data volume to /etc/fstab without nofail — if the volume is detached or renamed, the VM drops to emergency mode and SSH never starts.", he: "להוסיף data volume ל-/etc/fstab בלי nofail — אם ה-volume מנותק או שונה שם, ה-VM נופל ל-emergency mode ו-SSH לא עולה בכלל." },
    { en: "Terminating a broken instance to 'start fresh' — with DeleteOnTermination=true the root volume and whatever was on it is gone. Stop, snapshot, then rescue.", he: "לעשות terminate ל-instance שבור כדי 'להתחיל מחדש' — עם DeleteOnTermination=true ה-root volume וכל מה שהיה עליו נעלמים. ‏stop, ‏snapshot, ואז rescue." },
    { en: "Expecting the serial console to save you on images with key-only users — you'll see the emergency prompt but can't log in. Plan a break-glass user or the helper-VM path ahead of time.", he: "לצפות שה-serial console יציל אותך ב-images עם משתמשי key בלבד — תראה את ה-prompt של emergency אבל לא תוכל להתחבר. תתכנן מראש משתמש break-glass או את מסלול ה-VM העזר." },
    { en: "Forgetting touch /.autorelabel after resetting a password via rd.break on SELinux systems — the shadow file gets a wrong label and nobody can log in.", he: "לשכוח touch /.autorelabel אחרי איפוס סיסמה דרך rd.break במערכות עם SELinux — קובץ ה-shadow מקבל label שגוי ואף אחד לא יכול להתחבר." }
  ],
  interview: [
    {
      q: { en: "Describe the Linux boot process from power-on to a login prompt.", he: "תתאר את תהליך ה-boot של לינוקס מהדלקה ועד prompt של login." },
      a: { en: "Firmware (UEFI reads the bootloader from the ESP; BIOS reads the MBR) → GRUB loads the kernel and initramfs with a command line → kernel initializes hardware and runs the initramfs, which loads storage drivers, finds root=UUID, and switch_roots → systemd as PID 1 mounts fstab, starts units by dependency until the default target (multi-user.target) → getty/sshd. In cloud, cloud-init runs during that systemd phase to apply user-data.", he: "Firmware (‏UEFI קורא את ה-bootloader מה-ESP; ‏BIOS קורא את ה-MBR) ← GRUB טוען kernel ו-initramfs עם command line ← ה-kernel מאתחל חומרה ומריץ את ה-initramfs, שטוען drivers של אחסון, מוצא root=UUID ועושה switch_root ← systemd כ-PID 1 עושה mount ל-fstab ומעלה units לפי תלויות עד ה-target ברירת המחדל (‏multi-user.target) ← getty/sshd. בענן, cloud-init רץ בשלב ה-systemd כדי להחיל את ה-user-data." }
    },
    {
      q: { en: "An EC2 instance fails its instance status check after a reboot and SSH times out. What do you do?", he: "EC2 instance נכשל ב-instance status check אחרי reboot ו-SSH עושה timeout. מה אתה עושה?" },
      a: { en: "Read get-console-output / screenshot to find the failing stage. Emergency mode from fstab is the classic. If a password user exists, use EC2 Serial Console to fix fstab live. Otherwise snapshot, stop, detach the root volume, attach to a helper in the same AZ, mount (nouuid for XFS), fix (add nofail / correct UUID), reattach as /dev/xvda, start. Then fix the root cause fleet-wide.", he: "לקרוא get-console-output / צילום מסך כדי למצוא את השלב שנכשל. ‏emergency mode בגלל fstab זה הקלאסיקה. אם יש משתמש עם סיסמה, להשתמש ב-EC2 Serial Console ולתקן את ה-fstab בזמן אמת. אחרת snapshot, ‏stop, לנתק את ה-root volume, לחבר ל-VM עזר באותו AZ, ‏mount (‏nouuid ל-XFS), לתקן (להוסיף nofail / לתקן UUID), לחבר בחזרה כ-/dev/xvda, ‏start. ואז לתקן את ה-root cause בכל הצי." }
    }
  ],
  quiz: [
    {
      q: { en: "What is the job of the initramfs?", he: "מה התפקיד של ה-initramfs?" },
      options: [
        { en: "Store the GRUB menu", he: "לשמור את התפריט של GRUB" },
        { en: "Provide the drivers and tools needed to find and mount the real root filesystem", he: "לספק את ה-drivers והכלים שצריך כדי למצוא ולעשות mount ל-root filesystem האמיתי" },
        { en: "Run cloud-init user-data", he: "להריץ את ה-user-data של cloud-init" },
        { en: "Hold swap space during boot", he: "להחזיק swap בזמן ה-boot" }
      ],
      answer: 1,
      explain: { en: "The kernel can't mount root if root needs NVMe/LVM/LUKS modules that live on root. The initramfs is a tiny RAM filesystem carrying them; after mounting root it switch_roots to it.", he: "ה-kernel לא יכול לעשות mount ל-root אם ה-root צריך מודולים של NVMe/LVM/LUKS שיושבים על ה-root. ה-initramfs הוא filesystem קטן ב-RAM שנושא אותם; אחרי ה-mount ל-root הוא עושה switch_root אליו." }
    },
    {
      q: { en: "After a reboot, the console shows 'You are in emergency mode' and a timeout waiting for a /data device. Best permanent fix?", he: "אחרי reboot, הקונסולה מראה 'You are in emergency mode' ו-timeout בהמתנה ל-device של /data. מה התיקון הקבוע הכי טוב?" },
      options: [
        { en: "Reinstall GRUB", he: "להתקין מחדש את GRUB" },
        { en: "Fix the fstab entry (correct UUID) and add nofail so a missing data volume never blocks boot", he: "לתקן את רשומת ה-fstab (‏UUID נכון) ולהוסיף nofail כדי ש-volume דאטה חסר לא יחסום boot אף פעם" },
        { en: "Rebuild the initramfs", he: "לבנות מחדש את ה-initramfs" },
        { en: "Disable systemd", he: "לכבות את systemd" }
      ],
      answer: 1,
      explain: { en: "Emergency mode on a failed mount is systemd refusing to continue without a required filesystem. nofail (and ideally x-systemd.device-timeout) makes data mounts optional for boot.", he: "emergency mode בגלל mount שנכשל זה systemd שמסרב להמשיך בלי filesystem שמוגדר כחובה. ‏nofail (ורצוי גם x-systemd.device-timeout) הופך mounts של דאטה לאופציונליים ל-boot." }
    },
    {
      q: { en: "Which kernel parameter lets you reset a forgotten root password on RHEL without knowing any password?", he: "איזה פרמטר kernel מאפשר לאפס סיסמת root שנשכחה ב-RHEL בלי לדעת אף סיסמה?" },
      options: [
        { en: "systemd.unit=rescue.target", he: "systemd.unit=rescue.target" },
        { en: "systemd.unit=emergency.target", he: "systemd.unit=emergency.target" },
        { en: "rd.break", he: "rd.break" },
        { en: "console=ttyS0", he: "console=ttyS0" }
      ],
      answer: 2,
      explain: { en: "rescue and emergency targets both ask for the root password. rd.break stops in the initramfs shell before sulogin; you remount /sysroot rw, chroot, passwd, and touch /.autorelabel.", he: "גם rescue וגם emergency מבקשים סיסמת root. ‏rd.break עוצר ב-shell של ה-initramfs לפני sulogin; עושים remount ל-/sysroot כ-rw, ‏chroot, ‏passwd, ו-touch /.autorelabel." }
    },
    {
      q: { en: "Mounting the broken root volume on a helper VM fails with a duplicate UUID error (XFS). Why and what's the fix?", he: "mount לדיסק ה-root השבור על VM עזר נכשל עם שגיאת duplicate UUID ‏(XFS). למה ומה התיקון?" },
      options: [
        { en: "The disk is corrupted; run xfs_repair -L", he: "הדיסק פגום; להריץ xfs_repair -L" },
        { en: "Both VMs came from the same image so their root filesystems share a UUID; mount with -o nouuid", he: "שני ה-VMs נבנו מאותו image ולכן ל-root filesystems שלהם אותו UUID; לעשות mount עם -o nouuid" },
        { en: "The volume is in another AZ", he: "ה-volume ב-AZ אחר" },
        { en: "You must format it first", he: "צריך לפרמט אותו קודם" }
      ],
      answer: 1,
      explain: { en: "XFS refuses to mount two filesystems with the same UUID. -o nouuid skips the check. xfs_repair -L zeroes the log and can lose data — never your first move.", he: "XFS מסרב לעשות mount לשני filesystems עם אותו UUID. ‏-o nouuid מדלג על הבדיקה. ‏xfs_repair -L מאפס את ה-log ויכול לאבד דאטה — אף פעם לא המהלך הראשון." }
    }
  ],
  playground: "terminal",
  related: ["linux-systemd-logs", "linux-disks-storage", "vms", "linux-ssh-remote"]
});

/* ============================== LINUX HARDENING ============================== */
INFRA.lessons.push({
  id: "linux-hardening",
  track: "linux",
  order: 22,
  icon: "🛡️",
  level: 3,
  minutes: 14,
  title: { en: "Linux hardening: SSH, firewall, SELinux/AppArmor, auditing", he: "Hardening ללינוקס: SSH, ‏firewall, ‏SELinux/AppArmor, ‏auditing" },
  tldr: {
    en: "Hardening is shrinking the attack surface layer by layer: keys-only SSH (or no SSH), default-deny firewall, SELinux/AppArmor left ON, auto security patches, least-privilege sudo, audit logs — measured against CIS, and ideally on an immutable minimal OS.",
    he: "Hardening זה לצמצם את משטח התקיפה שכבה אחרי שכבה: SSH עם מפתחות בלבד (או בלי SSH בכלל), ‏firewall עם default-deny, ‏SELinux/AppArmor נשארים דלוקים, עדכוני אבטחה אוטומטיים, ‏sudo עם least privilege, לוגים של audit — נמדד מול CIS, ובאידיאל על OS מינימלי ו-immutable."
  },
  analogy: {
    en: "A hardened server is a bank branch, not a single big lock. A guarded entrance that only accepts badges (SSH keys), a door policy of 'closed unless listed' (default-deny firewall), staff who can only enter their own rooms even with a valid badge (SELinux/AppArmor), cameras recording who opened the vault (auditd), a guard who bans someone after 5 wrong badges (fail2ban), and the best branches have no back door at all (no SSH, immutable OS).",
    he: "שרת מוקשח הוא סניף בנק, לא מנעול גדול אחד. כניסה מאובטחת שמקבלת רק תגים (מפתחות SSH), מדיניות דלת של 'סגור אלא אם ברשימה' (‏firewall עם default-deny), עובדים שיכולים להיכנס רק לחדרים שלהם גם עם תג תקף (‏SELinux/AppArmor), מצלמות שמתעדות מי פתח את הכספת (‏auditd), שומר שחוסם מישהו אחרי 5 תגים שגויים (‏fail2ban), ובסניפים הכי טובים — אין דלת אחורית בכלל (בלי SSH, ‏OS immutable)."
  },
  sections: [
    {
      h: { en: "SSH: keys only, no root — or no SSH at all", he: "SSH: מפתחות בלבד, בלי root — או בלי SSH בכלל" },
      body: {
        en: `<p>An internet-facing port 22 gets thousands of password guesses per day within minutes of boot. Put your policy in a drop-in file so package upgrades don't overwrite it:</p>
<pre>$ sudo tee /etc/ssh/sshd_config.d/10-hardening.conf &lt;&lt;'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
AllowGroups ssh-users
MaxAuthTries 3
LoginGraceTime 20
X11Forwarding no
AllowAgentForwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
$ sudo sshd -t &amp;&amp; sudo systemctl reload ssh     # sshd on RHEL
$ sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
permitrootlogin no
passwordauthentication no</pre>
<p>Prefer <strong>ed25519</strong> keys, and for fleets use <strong>SSH certificates</strong> (short-lived, signed by a CA: <code>TrustedUserCAKeys</code>) instead of copying public keys everywhere. Better still, remove inbound SSH: <strong>AWS SSM Session Manager</strong>, <strong>GCP IAP TCP forwarding</strong>, <strong>Azure Bastion</strong> — IAM-authenticated, logged, and port 22 stays closed.</p>
<blockquote>⚠️ Production tip: keep your current session open, test the new config with <code>sshd -t</code> and a <em>second</em> login before closing it. Locking yourself out of a VM is how you end up in the boot-rescue lesson.</blockquote>`,
        he: `<p>פורט 22 שפתוח לאינטרנט מקבל אלפי ניחושי סיסמה ביום, תוך דקות מה-boot. תשים את המדיניות בקובץ drop-in כדי שעדכוני חבילות לא ידרסו אותה:</p>
<pre>$ sudo tee /etc/ssh/sshd_config.d/10-hardening.conf &lt;&lt;'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
AllowGroups ssh-users
MaxAuthTries 3
LoginGraceTime 20
X11Forwarding no
AllowAgentForwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
$ sudo sshd -t &amp;&amp; sudo systemctl reload ssh     # sshd on RHEL
$ sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
permitrootlogin no
passwordauthentication no</pre>
<p>תעדיף מפתחות <strong>ed25519</strong>, ולצי של שרתים תשתמש ב-<strong>SSH certificates</strong> (קצרי חיים, חתומים ע"י CA: ‏<code>TrustedUserCAKeys</code>) במקום להעתיק public keys לכל מקום. עוד יותר טוב — תסיר SSH נכנס: <strong>AWS SSM Session Manager</strong>, ‏<strong>GCP IAP TCP forwarding</strong>, ‏<strong>Azure Bastion</strong> — אימות דרך IAM, הכל נרשם, ופורט 22 נשאר סגור.</p>
<blockquote>⚠️ טיפ לפרודקשן: תשאיר את ה-session הנוכחי פתוח, תבדוק את ה-config החדש עם <code>sshd -t</code> ועם login <em>שני</em> לפני שאתה סוגר. לנעול את עצמך מחוץ ל-VM זו הדרך להגיע לשיעור על boot rescue.</blockquote>`
      }
    },
    {
      h: { en: "Host firewall: nftables, ufw, firewalld", he: "Firewall ברמת ה-host: ‏nftables, ‏ufw, ‏firewalld" },
      body: {
        en: `<p>Cloud security groups filter at the hypervisor; a host firewall is defense in depth (and the only filter on bare metal). Modern Linux uses <strong>nftables</strong> (iptables commands are often a compatibility shim on top). <code>ufw</code> (Ubuntu) and <code>firewalld</code> (RHEL) are friendlier front-ends.</p>
<pre>$ cat /etc/nftables.conf
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    ct state invalid drop
    iif "lo" accept
    ip protocol icmp accept
    meta l4proto ipv6-icmp accept
    tcp dport 22 ip saddr 10.0.0.0/8 accept        # SSH only from the VPC
    tcp dport { 80, 443 } accept
    counter log prefix "nft-drop: " limit rate 5/minute
  }
}
$ sudo nft -c -f /etc/nftables.conf &amp;&amp; sudo systemctl enable --now nftables

# ufw equivalent
$ sudo ufw default deny incoming &amp;&amp; sudo ufw default allow outgoing
$ sudo ufw allow from 10.0.0.0/8 to any port 22 proto tcp
$ sudo ufw allow 443/tcp &amp;&amp; sudo ufw enable
# firewalld equivalent
$ sudo firewall-cmd --permanent --add-service=https
$ sudo firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=10.0.0.0/8 service name=ssh accept'
$ sudo firewall-cmd --permanent --remove-service=ssh &amp;&amp; sudo firewall-cmd --reload</pre>
<p>Before writing rules, see what's actually listening: <code>ss -tulpn</code>. Every listener you can remove beats a rule that blocks it.</p>
<blockquote>💡 Real world: Docker inserts its own nat/filter rules for published ports (<code>-p 8080:80</code>) that are evaluated before ufw's chains — a "blocked" port is still reachable from the internet. Bind to <code>127.0.0.1:8080:80</code> or filter in the <code>DOCKER-USER</code> chain.</blockquote>`,
        he: `<p>Security groups בענן מסננים ברמת ה-hypervisor; ‏firewall על ה-host הוא defense in depth (והמסנן היחיד ב-bare metal). לינוקס מודרני משתמש ב-<strong>nftables</strong> (פקודות iptables הן לרוב שכבת תאימות מעליו). ‏<code>ufw</code> (‏Ubuntu) ו-<code>firewalld</code> (‏RHEL) הם ממשקים ידידותיים יותר.</p>
<pre>$ cat /etc/nftables.conf
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    ct state invalid drop
    iif "lo" accept
    ip protocol icmp accept
    meta l4proto ipv6-icmp accept
    tcp dport 22 ip saddr 10.0.0.0/8 accept        # SSH only from the VPC
    tcp dport { 80, 443 } accept
    counter log prefix "nft-drop: " limit rate 5/minute
  }
}
$ sudo nft -c -f /etc/nftables.conf &amp;&amp; sudo systemctl enable --now nftables

# ufw equivalent
$ sudo ufw default deny incoming &amp;&amp; sudo ufw default allow outgoing
$ sudo ufw allow from 10.0.0.0/8 to any port 22 proto tcp
$ sudo ufw allow 443/tcp &amp;&amp; sudo ufw enable
# firewalld equivalent
$ sudo firewall-cmd --permanent --add-service=https
$ sudo firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=10.0.0.0/8 service name=ssh accept'
$ sudo firewall-cmd --permanent --remove-service=ssh &amp;&amp; sudo firewall-cmd --reload</pre>
<p>לפני שכותבים חוקים, תראה מה באמת מאזין: <code>ss -tulpn</code>. כל listener שאפשר להסיר עדיף על חוק שחוסם אותו.</p>
<blockquote>💡 מהשטח: Docker מכניס חוקי nat/filter משלו לפורטים שעושים publish (‏<code>-p 8080:80</code>) שנבדקים לפני ה-chains של ufw — פורט "חסום" עדיין נגיש מהאינטרנט. תעשה bind ל-<code>127.0.0.1:8080:80</code> או תסנן ב-chain של <code>DOCKER-USER</code>.</blockquote>`
      }
    },
    {
      h: { en: "SELinux vs AppArmor: read the denial, don't disable it", he: "SELinux מול AppArmor: תקרא את ה-denial, אל תכבה" },
      body: {
        en: `<p>Both are <strong>Mandatory Access Control</strong>: even root-owned processes are limited to what their policy allows. If nginx is exploited, SELinux/AppArmor stops it from reading <code>/etc/shadow</code> or opening outbound connections, regardless of Unix permissions.</p>
<table>
<tr><th></th><th>SELinux (RHEL, Fedora, Amazon Linux, Android)</th><th>AppArmor (Ubuntu, Debian, SUSE)</th></tr>
<tr><td>Model</td><td>Labels on every file/process/port (<code>httpd_t</code>, <code>httpd_sys_content_t</code>)</td><td>Path-based profiles per program</td></tr>
<tr><td>Modes</td><td>enforcing / permissive / disabled</td><td>enforce / complain per profile</td></tr>
<tr><td>Status</td><td><code>getenforce</code>, <code>sestatus</code></td><td><code>aa-status</code></td></tr>
<tr><td>Denials in</td><td><code>/var/log/audit/audit.log</code> (type=AVC)</td><td>journal / dmesg (<code>apparmor="DENIED"</code>)</td></tr>
</table>
<p>The classic: you move the web root to <code>/srv/www</code> and nginx gets 403 even though permissions look right.</p>
<pre>$ sudo ausearch -m AVC -ts recent
type=AVC msg=audit(1731580000.123:812): avc:  denied  { read } for  pid=2211 comm="nginx"
  name="index.html" scontext=system_u:system_r:httpd_t:s0
  tcontext=unconfined_u:object_r:var_t:s0 tclass=file permissive=0
$ sudo ausearch -m AVC -ts recent | audit2why
  Was caused by: Missing type enforcement (TE) allow rule.
$ ls -Z /srv/www/index.html
unconfined_u:object_r:var_t:s0 /srv/www/index.html        # wrong label
# Fix the LABEL, persistently:
$ sudo semanage fcontext -a -t httpd_sys_content_t "/srv/www(/.*)?"
$ sudo restorecon -Rv /srv/www
# App must call an upstream? There's a boolean for that:
$ sudo setsebool -P httpd_can_network_connect on</pre>
<p>Order of fixes: <code>restorecon</code> (wrong label, e.g. after <code>mv</code>) → <code>semanage fcontext</code>/<code>semanage port</code> → <code>setsebool</code> → only then a custom module via <code>audit2allow -M</code>, reviewed like code. Debugging a single service? <code>semanage permissive -a httpd_t</code> makes just that domain permissive instead of the whole box.</p>
<blockquote>⚠️ Production tip: <code>setenforce 0</code> "to make it work" is the Linux version of disabling the smoke detector because toast set it off. Container escapes in the wild have been blocked by SELinux on hosts that kept it enforcing.</blockquote>`,
        he: `<p>שניהם <strong>Mandatory Access Control</strong>: גם תהליכים של root מוגבלים למה שה-policy שלהם מתיר. אם פרצו ל-nginx, ‏SELinux/AppArmor מונעים ממנו לקרוא את <code>/etc/shadow</code> או לפתוח חיבורים החוצה, בלי קשר להרשאות Unix.</p>
<table>
<tr><th></th><th>SELinux (‏RHEL, ‏Fedora, ‏Amazon Linux, ‏Android)</th><th>AppArmor (‏Ubuntu, ‏Debian, ‏SUSE)</th></tr>
<tr><td>מודל</td><td>Labels על כל קובץ/תהליך/פורט (‏<code>httpd_t</code>, ‏<code>httpd_sys_content_t</code>)</td><td>Profiles מבוססי path לכל תוכנה</td></tr>
<tr><td>מצבים</td><td>enforcing / permissive / disabled</td><td>enforce / complain לכל profile</td></tr>
<tr><td>סטטוס</td><td><code>getenforce</code>, ‏<code>sestatus</code></td><td><code>aa-status</code></td></tr>
<tr><td>Denials ב-</td><td><code>/var/log/audit/audit.log</code> (‏type=AVC)</td><td>journal / dmesg (‏<code>apparmor="DENIED"</code>)</td></tr>
</table>
<p>הקלאסיקה: אתה מעביר את ה-web root ל-<code>/srv/www</code> ו-nginx מחזיר 403 למרות שההרשאות נראות תקינות.</p>
<pre>$ sudo ausearch -m AVC -ts recent
type=AVC msg=audit(1731580000.123:812): avc:  denied  { read } for  pid=2211 comm="nginx"
  name="index.html" scontext=system_u:system_r:httpd_t:s0
  tcontext=unconfined_u:object_r:var_t:s0 tclass=file permissive=0
$ sudo ausearch -m AVC -ts recent | audit2why
  Was caused by: Missing type enforcement (TE) allow rule.
$ ls -Z /srv/www/index.html
unconfined_u:object_r:var_t:s0 /srv/www/index.html        # wrong label
# Fix the LABEL, persistently:
$ sudo semanage fcontext -a -t httpd_sys_content_t "/srv/www(/.*)?"
$ sudo restorecon -Rv /srv/www
# App must call an upstream? There's a boolean for that:
$ sudo setsebool -P httpd_can_network_connect on</pre>
<p>סדר התיקונים: <code>restorecon</code> (‏label שגוי, למשל אחרי <code>mv</code>) ← <code>semanage fcontext</code>/<code>semanage port</code> ← <code>setsebool</code> ← רק אז module מותאם דרך <code>audit2allow -M</code>, שעובר review כמו קוד. מדבג שירות בודד? <code>semanage permissive -a httpd_t</code> הופך רק את ה-domain הזה ל-permissive במקום את כל המכונה.</p>
<blockquote>⚠️ טיפ לפרודקשן: <code>setenforce 0</code> "כדי שזה יעבוד" זו הגרסה הלינוקסית של לנתק את גלאי העשן כי הטוסט הפעיל אותו. בריחות מקונטיינרים בעולם האמיתי נחסמו ע"י SELinux בשרתים שהשאירו אותו ב-enforcing.</blockquote>`
      }
    },
    {
      h: { en: "auditd, fail2ban, patching, least-privilege sudo, file integrity", he: "auditd, ‏fail2ban, ‏patching, ‏sudo עם least privilege, ‏file integrity" },
      body: {
        en: `<pre># auditd: who touched what (kernel-level, survives log tampering by apps)
$ cat /etc/audit/rules.d/50-identity.rules
-w /etc/passwd -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers
-a always,exit -F arch=b64 -S execve -F euid=0 -F auid&gt;=1000 -F auid!=4294967295 -k root-cmds
$ sudo augenrules --load
$ sudo ausearch -k sudoers -i | tail -5

# fail2ban: ban IPs after repeated failures
$ cat /etc/fail2ban/jail.local
[sshd]
enabled  = true
maxretry = 5
findtime = 10m
bantime  = 1h
$ sudo fail2ban-client status sshd

# Automatic security updates
$ sudo apt install unattended-upgrades &amp;&amp; sudo dpkg-reconfigure -plow unattended-upgrades
$ sudo dnf install dnf-automatic &amp;&amp; sudo systemctl enable --now dnf-automatic-install.timer
$ needs-restarting -r   # RHEL: reboot needed for new kernel/glibc?

# Least-privilege sudo: exact commands, validated with visudo
$ sudo visudo -f /etc/sudoers.d/deploy
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart api.service, /usr/bin/journalctl -u api.service
$ sudo visudo -c</pre>
<ul>
<li><strong>fail2ban</strong> is noise reduction; with keys-only SSH the real protection is already in place. It's more valuable for web logins and mail.</li>
<li><strong>Patching</strong>: a new kernel or glibc isn't active until reboot (or livepatch: Ubuntu Pro Livepatch, kpatch). Track "reboot required" as a metric.</li>
<li><strong>sudo</strong>: never grant editors, pagers, <code>find</code>, <code>tar</code>, or interpreters via sudo — they can spawn a root shell (<code>vim</code> → <code>:!sh</code>). Check GTFOBins before allowing a binary.</li>
<li><strong>File integrity</strong>: AIDE builds a hash database of system files (<code>aide --init</code>) and reports changes (<code>aide --check</code>) — a cron job that tells you someone replaced <code>/usr/bin/ssh</code>.</li>
<li><strong>Minimal packages</strong>: no compilers, no telnet/ftp, no unused daemons. <code>dnf list installed | wc -l</code> — every package is a CVE you'll have to patch.</li>
</ul>`,
        he: `<pre># auditd: who touched what (kernel-level, survives log tampering by apps)
$ cat /etc/audit/rules.d/50-identity.rules
-w /etc/passwd -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers
-a always,exit -F arch=b64 -S execve -F euid=0 -F auid&gt;=1000 -F auid!=4294967295 -k root-cmds
$ sudo augenrules --load
$ sudo ausearch -k sudoers -i | tail -5

# fail2ban: ban IPs after repeated failures
$ cat /etc/fail2ban/jail.local
[sshd]
enabled  = true
maxretry = 5
findtime = 10m
bantime  = 1h
$ sudo fail2ban-client status sshd

# Automatic security updates
$ sudo apt install unattended-upgrades &amp;&amp; sudo dpkg-reconfigure -plow unattended-upgrades
$ sudo dnf install dnf-automatic &amp;&amp; sudo systemctl enable --now dnf-automatic-install.timer
$ needs-restarting -r   # RHEL: reboot needed for new kernel/glibc?

# Least-privilege sudo: exact commands, validated with visudo
$ sudo visudo -f /etc/sudoers.d/deploy
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart api.service, /usr/bin/journalctl -u api.service
$ sudo visudo -c</pre>
<ul>
<li><strong>fail2ban</strong> זה הפחתת רעש; עם SSH של מפתחות בלבד ההגנה האמיתית כבר במקום. הוא שווה יותר ל-logins של אתרים ולמייל.</li>
<li><strong>Patching</strong>: ‏kernel או glibc חדשים לא פעילים עד reboot (או livepatch: ‏Ubuntu Pro Livepatch, ‏kpatch). תעקוב אחרי "reboot required" כמטריקה.</li>
<li><strong>sudo</strong>: אף פעם לא לתת דרך sudo עורכים, pagers, ‏<code>find</code>, ‏<code>tar</code> או interpreters — הם יכולים לפתוח shell של root (‏<code>vim</code> ← <code>:!sh</code>). תבדוק ב-GTFOBins לפני שאתה מאשר binary.</li>
<li><strong>File integrity</strong>: ‏AIDE בונה מסד hashes של קבצי מערכת (‏<code>aide --init</code>) ומדווח על שינויים (‏<code>aide --check</code>) — cron job שאומר לך שמישהו החליף את <code>/usr/bin/ssh</code>.</li>
<li><strong>מינימום חבילות</strong>: בלי compilers, בלי telnet/ftp, בלי daemons שלא בשימוש. ‏<code>dnf list installed | wc -l</code> — כל חבילה היא CVE שתצטרך לעשות לו patch.</li>
</ul>`
      }
    },
    {
      h: { en: "Measure it (CIS, Lynis) — and the immutable OS endgame", he: "למדוד (CIS, ‏Lynis) — וסוף המשחק: OS immutable" },
      body: {
        en: `<p><strong>CIS Benchmarks</strong> are consensus hardening checklists per OS (Level 1 = safe baseline, Level 2 = stricter, may break things). Auditors ask for them (SOC 2, PCI). Don't hand-apply 300 controls — use CIS-hardened images (AWS/Azure/GCP marketplaces), Ansible roles, or OpenSCAP:</p>
<pre>$ sudo lynis audit system --quick
  Hardening index : 64 [############        ]
  Tests performed : 262
  Suggestions (38):
  * Disable root login via SSH [SSH-7408]
  * Install a file integrity tool [FINT-4350]
$ sudo oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis_server_l1 \\
    --report /tmp/cis.html /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml</pre>
<p><strong>The endgame — don't harden a general-purpose OS, run one with nothing to harden:</strong></p>
<table>
<tr><th>OS</th><th>Idea</th></tr>
<tr><td><strong>Bottlerocket</strong> (AWS)</td><td>Container-only host. Read-only root verified by dm-verity, A/B partition atomic updates, no SSH and no package manager by default — access via an admin container through SSM. SELinux enforcing.</td></tr>
<tr><td><strong>Talos Linux</strong></td><td>Kubernetes-only. No SSH, no shell at all — managed entirely through a gRPC API (<code>talosctl</code>). Config is a YAML document.</td></tr>
<tr><td><strong>Flatcar Container Linux</strong></td><td>CoreOS successor. Immutable <code>/usr</code>, A/B auto-updates, provisioned by Ignition on first boot.</td></tr>
</table>
<p>Fewer binaries = fewer CVEs, no configuration drift (nothing to change by hand), and an attacker who gets in finds no shell, no curl, no package manager. You replace nodes instead of patching them.</p>
<blockquote>💡 Real world: the most effective hardening program most teams can run is "golden image + IaC + no SSH + replace weekly". Every node is freshly patched and identical, and drift can't accumulate because nothing lives long enough.</blockquote>`,
        he: `<p><strong>CIS Benchmarks</strong> הם רשימות hardening בהסכמה רחבה לכל OS (‏Level 1 = בסיס בטוח, ‏Level 2 = קפדני יותר, עלול לשבור דברים). אודיטורים מבקשים אותם (‏SOC 2, ‏PCI). אל תחיל ידנית 300 בקרות — תשתמש ב-images מוקשחים לפי CIS (ב-marketplaces של AWS/Azure/GCP), ב-Ansible roles, או ב-OpenSCAP:</p>
<pre>$ sudo lynis audit system --quick
  Hardening index : 64 [############        ]
  Tests performed : 262
  Suggestions (38):
  * Disable root login via SSH [SSH-7408]
  * Install a file integrity tool [FINT-4350]
$ sudo oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis_server_l1 \\
    --report /tmp/cis.html /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml</pre>
<p><strong>סוף המשחק — לא להקשיח OS כללי, אלא להריץ OS שאין בו מה להקשיח:</strong></p>
<table>
<tr><th>OS</th><th>הרעיון</th></tr>
<tr><td><strong>Bottlerocket</strong> (‏AWS)</td><td>host לקונטיינרים בלבד. ‏root לקריאה בלבד שמאומת ע"י dm-verity, עדכונים אטומיים עם מחיצות A/B, בלי SSH ובלי package manager כברירת מחדל — גישה דרך admin container ב-SSM. ‏SELinux ב-enforcing.</td></tr>
<tr><td><strong>Talos Linux</strong></td><td>Kubernetes בלבד. בלי SSH, בלי shell בכלל — מנוהל כולו דרך gRPC API (‏<code>talosctl</code>). ה-config הוא מסמך YAML.</td></tr>
<tr><td><strong>Flatcar Container Linux</strong></td><td>היורש של CoreOS. ‏<code>/usr</code> immutable, עדכונים אוטומטיים A/B, ‏provisioning עם Ignition ב-boot הראשון.</td></tr>
</table>
<p>פחות binaries = פחות CVEs, אין configuration drift (אין מה לשנות ביד), ותוקף שנכנס לא מוצא shell, לא curl, לא package manager. מחליפים nodes במקום לעשות להם patch.</p>
<blockquote>💡 מהשטח: תוכנית ה-hardening הכי אפקטיבית שרוב הצוותים יכולים להריץ היא "golden image + IaC + בלי SSH + החלפה שבועית". כל node מעודכן וזהה, ו-drift לא יכול להצטבר כי שום דבר לא חי מספיק זמן.</blockquote>`
      }
    }
  ],
  diagram: "internet\n   |\n[cloud SG / NACL]          <- only 443 open, 22 closed (SSM / IAP / Bastion instead)\n   |\n[host firewall: nftables policy drop]\n   |\n[sshd: keys only, no root, AllowGroups]   [fail2ban]\n   |\n[process: nginx as user 'www-data']\n   |\n[SELinux / AppArmor: httpd_t may read httpd_sys_content_t only]\n   |\n[auditd: execve as root, writes to /etc/sudoers -> SIEM]\n\nmeasure: Lynis / OpenSCAP vs CIS L1     endgame: Bottlerocket / Talos / Flatcar (no shell, read-only root)",
  handsOn: [
    { cmd: "sudo sshd -T | grep -Ei 'permitrootlogin|passwordauthentication|pubkeyauthentication|allowgroups'", what: { en: "Print the effective SSH server config (after all drop-ins) for the settings that matter.", he: "להדפיס את ה-config האפקטיבי של שרת ה-SSH (אחרי כל ה-drop-ins) להגדרות החשובות." } },
    { cmd: "sudo ss -tulpn", what: { en: "List every listening port and the process behind it — the attack surface before any firewall.", he: "להציג כל פורט שמאזין ואת התהליך שמאחוריו — משטח התקיפה לפני כל firewall." } },
    { cmd: "getenforce 2>/dev/null || sudo aa-status | head -5", what: { en: "Check whether SELinux or AppArmor is active and in which mode.", he: "לבדוק אם SELinux או AppArmor פעילים ובאיזה מצב." } },
    { cmd: "sudo ausearch -m AVC -ts today | audit2why", what: { en: "Explain today's SELinux denials instead of guessing (RHEL family).", he: "להסביר את ה-denials של SELinux מהיום במקום לנחש (משפחת RHEL)." } },
    { cmd: "sudo lynis audit system --quick | tail -30", what: { en: "Run a quick hardening audit and read the top suggestions and the hardening index.", he: "להריץ audit מהיר של hardening ולקרוא את ההמלצות המובילות ואת ה-hardening index." } }
  ],
  mnemonic: {
    en: "Keys, Walls, Labels, Cameras, Patches — and the best door is no door (no SSH, immutable OS).",
    he: "מפתחות, חומות, labels, מצלמות, patches — והדלת הכי טובה היא שאין דלת (בלי SSH, ‏OS immutable)."
  },
  pitfalls: [
    { en: "Running setenforce 0 or disabling AppArmor to 'fix' a 403 — the real fix is usually one restorecon or semanage command found via ausearch | audit2why.", he: "להריץ setenforce 0 או לכבות AppArmor כדי 'לתקן' 403 — התיקון האמיתי הוא לרוב פקודת restorecon או semanage אחת שמוצאים עם ausearch | audit2why." },
    { en: "Editing /etc/ssh/sshd_config and reloading without sshd -t and a second test session — one typo and you're locked out.", he: "לערוך את /etc/ssh/sshd_config ולעשות reload בלי sshd -t ובלי session בדיקה שני — שגיאת הקלדה אחת ואתה נעול בחוץ." },
    { en: "Trusting ufw to block Docker-published ports — Docker's iptables rules bypass ufw chains. Bind to 127.0.0.1 or use DOCKER-USER.", he: "לסמוך על ufw שיחסום פורטים ש-Docker עושה להם publish — חוקי ה-iptables של Docker עוקפים את ה-chains של ufw. תעשה bind ל-127.0.0.1 או תשתמש ב-DOCKER-USER." },
    { en: "Granting sudo for vim, less, find or python 'just for that one task' — each can spawn a root shell. Allow exact commands with exact arguments.", he: "לתת sudo ל-vim, ‏less, ‏find או python 'רק בשביל המשימה הזו' — כל אחד מהם יכול לפתוח shell של root. תאשר פקודות מדויקות עם ארגומנטים מדויקים." }
  ],
  interview: [
    {
      q: { en: "You're handed a fresh Linux VM that will face the internet. What are your first hardening steps?", he: "קיבלת VM לינוקס חדש שיהיה חשוף לאינטרנט. מה צעדי ה-hardening הראשונים שלך?" },
      a: { en: "Patch and enable automatic security updates; SSH keys-only, no root login, restricted to a group — or close 22 and use SSM/IAP; default-deny firewall at the cloud SG and host level, open only what's needed; check ss -tulpn and remove unneeded services/packages; keep SELinux/AppArmor enforcing; least-privilege sudo; auditd + ship logs off-box; then scan with Lynis/OpenSCAP against CIS L1. Ideally all of this lives in the golden image, not done by hand.", he: "patch והפעלת עדכוני אבטחה אוטומטיים; ‏SSH עם מפתחות בלבד, בלי root, מוגבל לקבוצה — או לסגור את 22 ולהשתמש ב-SSM/IAP; ‏firewall עם default-deny ברמת ה-SG בענן וברמת ה-host, לפתוח רק מה שצריך; לבדוק ss -tulpn ולהסיר שירותים/חבילות מיותרים; להשאיר SELinux/AppArmor ב-enforcing; ‏sudo עם least privilege; ‏auditd + לשלוח לוגים מחוץ למכונה; ואז סריקה עם Lynis/OpenSCAP מול CIS L1. באידיאל כל זה חי ב-golden image, לא נעשה ביד." }
    },
    {
      q: { en: "A developer says 'SELinux is breaking my app, I'm disabling it'. How do you respond?", he: "מפתח אומר 'SELinux שובר לי את האפליקציה, אני מכבה אותו'. מה אתה עונה?" },
      a: { en: "Let's read the denial: ausearch -m AVC -ts recent | audit2why. Usually it's a wrong file label (restorecon / semanage fcontext), a non-standard port (semanage port -a -t http_port_t -p tcp 8081), or a boolean (httpd_can_network_connect). If we need time, make only that domain permissive (semanage permissive -a httpd_t) — never the whole host. Disabling it removes the layer that contains an exploited process.", he: "בוא נקרא את ה-denial: ‏ausearch -m AVC -ts recent | audit2why. לרוב זה label שגוי על קובץ (‏restorecon / semanage fcontext), פורט לא סטנדרטי (‏semanage port -a -t http_port_t -p tcp 8081), או boolean (‏httpd_can_network_connect). אם צריך זמן, הופכים רק את ה-domain הזה ל-permissive (‏semanage permissive -a httpd_t) — אף פעם לא את כל ה-host. לכבות אותו מסיר את השכבה שבולמת תהליך שנפרץ." }
    }
  ],
  quiz: [
    {
      q: { en: "nginx returns 403 after you moved the web root to /srv/www. Permissions are 755/644. SELinux is enforcing. Best fix?", he: "nginx מחזיר 403 אחרי שהעברת את ה-web root ל-/srv/www. ההרשאות 755/644. ‏SELinux ב-enforcing. מה התיקון הכי טוב?" },
      options: [
        { en: "setenforce 0", he: "setenforce 0" },
        { en: "chmod -R 777 /srv/www", he: "chmod -R 777 /srv/www" },
        { en: "semanage fcontext -a -t httpd_sys_content_t \"/srv/www(/.*)?\" then restorecon -Rv /srv/www", he: "semanage fcontext -a -t httpd_sys_content_t \"/srv/www(/.*)?\" ואז restorecon -Rv /srv/www" },
        { en: "Run nginx as root", he: "להריץ את nginx כ-root" }
      ],
      answer: 2,
      explain: { en: "The files carry the wrong SELinux type (var_t). Registering the path's context and relabeling fixes it persistently while keeping MAC protection.", he: "לקבצים יש type שגוי של SELinux (‏var_t). רישום ה-context של ה-path ועשיית relabel מתקנים את זה לתמיד, ומשאירים את הגנת ה-MAC." }
    },
    {
      q: { en: "Which sshd_config pair blocks password guessing and direct root login?", he: "איזה זוג הגדרות ב-sshd_config חוסם ניחוש סיסמאות ו-login ישיר של root?" },
      options: [
        { en: "PasswordAuthentication no + PermitRootLogin no", he: "PasswordAuthentication no + PermitRootLogin no" },
        { en: "X11Forwarding no + MaxSessions 1", he: "X11Forwarding no + MaxSessions 1" },
        { en: "Port 2222 + UseDNS no", he: "Port 2222 + UseDNS no" },
        { en: "PubkeyAuthentication no + PermitRootLogin yes", he: "PubkeyAuthentication no + PermitRootLogin yes" }
      ],
      answer: 0,
      explain: { en: "No passwords means nothing to guess; no root login means attackers must also know a valid username and escalate. Changing the port only reduces log noise.", he: "בלי סיסמאות אין מה לנחש; בלי login של root התוקף צריך גם שם משתמש תקף וגם הסלמת הרשאות. שינוי פורט רק מפחית רעש בלוגים." }
    },
    {
      q: { en: "Why is a sudoers rule 'deploy ALL=(root) NOPASSWD: /usr/bin/vim' dangerous?", he: "למה חוק sudoers כמו 'deploy ALL=(root) NOPASSWD: /usr/bin/vim' מסוכן?" },
      options: [
        { en: "vim is slow as root", he: "vim איטי כ-root" },
        { en: "vim can spawn a shell (:!sh), giving full root", he: "vim יכול לפתוח shell (‏:!sh), מה שנותן root מלא" },
        { en: "NOPASSWD is not valid syntax", he: "NOPASSWD זה לא syntax תקין" },
        { en: "It only works on Ubuntu", he: "זה עובד רק ב-Ubuntu" }
      ],
      answer: 1,
      explain: { en: "Editors, pagers, find, tar and interpreters can execute commands. Granting them via sudo equals granting a root shell. Use sudoedit for file edits, or allow only exact commands.", he: "עורכים, ‏pagers, ‏find, ‏tar ו-interpreters יכולים להריץ פקודות. לתת אותם דרך sudo שווה לתת shell של root. תשתמש ב-sudoedit לעריכת קבצים, או תאשר רק פקודות מדויקות." }
    },
    {
      q: { en: "What makes Bottlerocket/Talos-style OSes more secure than a hardened Ubuntu?", he: "מה הופך מערכות כמו Bottlerocket/Talos לבטוחות יותר מ-Ubuntu מוקשח?" },
      options: [
        { en: "They run a different kernel that has no CVEs", he: "הן מריצות kernel אחר שאין בו CVEs" },
        { en: "Minimal read-only image, no shell/SSH/package manager by default, atomic image updates — little attack surface and no drift", he: "image מינימלי לקריאה בלבד, בלי shell/SSH/package manager כברירת מחדל, עדכוני image אטומיים — משטח תקיפה קטן ובלי drift" },
        { en: "They disable networking", he: "הן מכבות רשת" },
        { en: "They are only usable on-prem", he: "אפשר להשתמש בהן רק on-prem" }
      ],
      answer: 1,
      explain: { en: "Same Linux kernel, but far fewer binaries, an immutable verified root, and API-driven management. Nodes are replaced/updated as a whole image instead of mutated by hand.", he: "אותו kernel של לינוקס, אבל הרבה פחות binaries, ‏root מאומת ו-immutable, וניהול דרך API. מחליפים/מעדכנים nodes כ-image שלם במקום לשנות אותם ביד." }
    }
  ],
  playground: "firewall",
  related: ["linux-ssh-remote", "net-firewalls", "linux-permissions-users", "container-security", "cloud-iam-security", "pr-security-ops"]
});

/* ============================== GLOSSARY ============================== */
INFRA.glossary.push(
  { term: "RAID", track: "foundations", def: { en: "Combining disks for speed and/or redundancy (0 stripe, 1 mirror, 5/6 parity, 10 mirrored stripes). Survives disk failures, not deletions — not a backup.", he: "שילוב דיסקים למהירות ו/או שרידות (0 stripe, ‏1 mirror, ‏5/6 parity, ‏10 stripe של mirrors). שורד כשל דיסקים, לא מחיקות — זה לא גיבוי." }, lesson: "fs-filesystems-raid" },
  { term: "LVM", track: "foundations", def: { en: "Logical Volume Manager: pools disks (PVs) into volume groups and carves resizable logical volumes, with online extend and CoW snapshots.", he: "Logical Volume Manager: מאגד דיסקים (PVs) ל-volume groups וחותך מהם logical volumes שאפשר לשנות להם גודל, עם הגדלה אונליין ו-snapshots מסוג CoW." }, lesson: "fs-filesystems-raid" },
  { term: "fsync", track: "foundations", def: { en: "System call that blocks until a file's dirty data and metadata reach stable storage. Databases call it on commit; its latency caps commit rate.", he: "System call שחוסם עד שהדאטה המלוכלך וה-metadata של קובץ מגיעים לאחסון יציב. דאטאבייסים קוראים לו ב-commit; ה-latency שלו מגביל את קצב ה-commits." }, lesson: "fs-filesystems-raid" },
  { term: "sysctl", track: "linux", def: { en: "Interface to read and set kernel parameters at runtime (/proc/sys). Persist in /etc/sysctl.d/*.conf and apply with sysctl --system.", he: "ממשק לקריאה וקביעה של פרמטרים של ה-kernel בזמן ריצה (‏/proc/sys). מקבעים ב-/etc/sysctl.d/*.conf ומחילים עם sysctl --system." }, lesson: "linux-kernel-tuning" },
  { term: "Transparent Huge Pages", track: "linux", def: { en: "Kernel feature that auto-backs memory with 2 MiB pages to cut TLB misses; can cause latency spikes and bloat for fork-heavy apps like Redis.", he: "פיצ'ר של ה-kernel שמגבה זיכרון אוטומטית בדפים של 2 MiB כדי לחסוך TLB misses; יכול לגרום לקפיצות latency וניפוח זיכרון באפליקציות עם הרבה fork כמו Redis." }, lesson: "linux-kernel-tuning" },
  { term: "NUMA", track: "foundations", def: { en: "Non-Uniform Memory Access: on multi-socket machines each CPU has local memory; remote access is ~1.5–2× slower, so pinning matters for databases.", he: "Non-Uniform Memory Access: במכונות עם כמה sockets לכל CPU יש זיכרון מקומי; גישה מרוחקת איטית פי ~1.5–2, אז pinning חשוב לדאטאבייסים." }, lesson: "linux-kernel-tuning" },
  { term: "initramfs", track: "linux", def: { en: "Small RAM filesystem loaded with the kernel that holds the drivers/tools to find and mount the real root filesystem, then switch_roots into it.", he: "filesystem קטן ב-RAM שנטען עם ה-kernel ומחזיק את ה-drivers/כלים למציאת ה-root filesystem האמיתי ול-mount שלו, ואז עושה switch_root אליו." }, lesson: "linux-boot-rescue" },
  { term: "Serial console", track: "linux", def: { en: "Text console over the VM's serial port (ttyS0); in the cloud it's the only way to see boot output or log in when the network or SSH is down.", he: "קונסולת טקסט דרך הפורט הסריאלי של ה-VM ‏(ttyS0); בענן זו הדרך היחידה לראות את פלט ה-boot או להתחבר כשהרשת או SSH למטה." }, lesson: "linux-boot-rescue" },
  { term: "cloud-init", track: "cloud", def: { en: "First-boot agent in cloud images that sets hostname, SSH keys and runs user-data; logs in /var/log/cloud-init*.log, runs once per instance by default.", he: "agent של boot ראשון ב-images של ענן שקובע hostname, מפתחות SSH ומריץ user-data; לוגים ב-/var/log/cloud-init*.log, רץ פעם אחת לכל instance כברירת מחדל." }, lesson: "linux-boot-rescue" },
  { term: "SELinux", track: "linux", def: { en: "Label-based Mandatory Access Control in the kernel (RHEL family): confines even root processes; debug denials with ausearch and audit2why instead of disabling.", he: "Mandatory Access Control מבוסס labels ב-kernel (משפחת RHEL): מגביל גם תהליכי root; מדבגים denials עם ausearch ו-audit2why במקום לכבות." }, lesson: "linux-hardening" },
  { term: "AppArmor", track: "linux", def: { en: "Path-based Mandatory Access Control (Ubuntu/Debian/SUSE) with per-program profiles in enforce or complain mode.", he: "Mandatory Access Control מבוסס path ‏(Ubuntu/Debian/SUSE) עם profiles לכל תוכנה במצב enforce או complain." }, lesson: "linux-hardening" },
  { term: "CIS Benchmark", track: "linux", def: { en: "Consensus security configuration checklist per OS/platform (Level 1 baseline, Level 2 strict); audited with tools like OpenSCAP and Lynis.", he: "רשימת בדיקה מוסכמת לקונפיגורציית אבטחה לכל OS/פלטפורמה (‏Level 1 בסיס, ‏Level 2 קפדני); נבדקת עם כלים כמו OpenSCAP ו-Lynis." }, lesson: "linux-hardening" }
);

/* ============================== SCENARIO: VM WON'T BOOT ============================== */
INFRA.scenarios.push({
  id: "vm-wont-boot",
  icon: "🧊",
  title: { en: "The VM that didn't come back after a reboot", he: "ה-VM שלא חזר אחרי reboot" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "Sunday 07:40. Scheduled kernel patching rebooted 'billing-legacy-01', a long-lived EC2 instance (yes, a pet: it runs the nightly invoicing job). It never came back. SSH times out. The invoicing run starts at 10:00.",
        he: "יום ראשון 07:40. patching מתוזמן של ה-kernel עשה reboot ל-'billing-legacy-01', ‏EC2 instance ותיק (כן, pet: הוא מריץ את ג'וב החשבוניות הלילי). הוא לא חזר. ‏SSH עושה timeout. ריצת החשבוניות מתחילה ב-10:00."
      },
      data: "$ aws ec2 describe-instance-status --instance-ids i-0b1ll1ng\n  InstanceState:  running\n  SystemStatus:   ok\n  InstanceStatus: impaired   (reachability check failed since 07:31)\n$ ssh ec2-user@10.20.4.17\nssh: connect to host 10.20.4.17 port 22: Connection timed out",
      choices: [
        { label: { en: "Read the serial console output first", he: "לקרוא קודם את הפלט של ה-serial console" }, next: "s2", score: 15,
          feedback: { en: "System check OK + instance check failed = the hypervisor is fine, the OS inside isn't. The console tells you which boot stage died.", he: "System check תקין + instance check נכשל = ה-hypervisor בסדר, מערכת ההפעלה בפנים לא. הקונסולה תגיד לך באיזה שלב ה-boot מת." } },
        { label: { en: "Reboot it again, maybe it was a fluke", he: "לעשות לו reboot שוב, אולי זה היה מקרי" }, next: "s1b", score: -5,
          feedback: { en: "A deterministic boot failure fails the same way every time. You burned 5 minutes and learned nothing.", he: "כשל boot דטרמיניסטי נכשל באותה צורה כל פעם. שרפת 5 דקות ולא למדת כלום." } },
        { label: { en: "Terminate it and launch a new one from the base AMI", he: "לעשות terminate ולהרים חדש מה-AMI הבסיסי" }, next: "lose", score: -30,
          feedback: { en: "This is a pet with years of hand-made state on its root volume — and DeleteOnTermination was true.", he: "זה pet עם שנים של state שנבנה ביד על ה-root volume — ו-DeleteOnTermination היה true." } }
      ]
    },
    s1b: {
      text: { en: "Same result: running, instance check impaired, SSH timeout. Time is 07:50.", he: "אותה תוצאה: running, ‏instance check במצב impaired, ‏SSH timeout. השעה 07:50." },
      choices: [
        { label: { en: "OK — read the serial console output", he: "טוב — לקרוא את הפלט של ה-serial console" }, next: "s2", score: 5,
          feedback: { en: "Evidence before actions.", he: "ראיות לפני פעולות." } }
      ]
    },
    s2: {
      text: { en: "The console output is clear about where it stopped.", he: "הפלט של הקונסולה ברור לגבי איפה זה נעצר." },
      data: "$ aws ec2 get-console-output --instance-id i-0b1ll1ng --latest --output text | tail -12\n[  OK  ] Reached target Local File Systems (Pre).\n[ TIME ] Timed out waiting for device dev-disk-by\\x2duuid-7c2e9a41\\x2d...\\x2d3f10.device.\n[DEPEND] Dependency failed for /data/invoices.\n[DEPEND] Dependency failed for Local File Systems.\n[  OK  ] Started Emergency Shell.\nYou are in emergency mode. After logging in, type \"journalctl -xb\" to view\nsystem logs, \"systemctl reboot\" to reboot, \"systemctl default\" or \"exit\"\nto boot into default mode.\nCannot open access to console, the root account is locked.\nSee sulogin(8) man page for more details.\nPress Enter to continue.",
      choices: [
        { label: { en: "Use EC2 Serial Console to log in and fix fstab", he: "להשתמש ב-EC2 Serial Console כדי להתחבר ולתקן את ה-fstab" }, next: "s3", score: 0,
          feedback: { en: "Reasonable idea — but read the last lines again: the root account is locked.", he: "רעיון סביר — אבל תקרא שוב את השורות האחרונות: חשבון ה-root נעול." } },
        { label: { en: "Snapshot, stop, detach the root volume and attach it to a helper VM", he: "snapshot, ‏stop, לנתק את ה-root volume ולחבר אותו ל-VM עזר" }, next: "s4", score: 15,
          feedback: { en: "Right call: no password user means no console login. Snapshot first so every next step is reversible.", he: "החלטה נכונה: אין משתמש עם סיסמה = אין login בקונסולה. ‏snapshot קודם כדי שכל צעד הבא יהיה הפיך." } },
        { label: { en: "Detach the missing data volume's entry by deleting the volume", he: "להיפטר מהרשומה של ה-volume החסר ע\"י מחיקת ה-volume" }, next: "lose", score: -30,
          feedback: { en: "The volume isn't missing because it's bad — and you just deleted the invoices volume. That's not in the runbook for a reason.", he: "ה-volume לא חסר כי הוא תקול — ועכשיו מחקת את volume החשבוניות. יש סיבה שזה לא ב-runbook." } }
      ]
    },
    s3: {
      text: { en: "The serial console connects and shows the same emergency prompt — 'root account is locked'. The image only has key-based users. No way in from here.", he: "ה-serial console מתחבר ומראה את אותו prompt של emergency — 'root account is locked'. ב-image יש רק משתמשים עם מפתחות. אין דרך להיכנס מכאן." },
      data: "Cannot open access to console, the root account is locked.\nSee sulogin(8) man page for more details.\nPress Enter to continue.",
      choices: [
        { label: { en: "Go the helper-VM route: snapshot, stop, detach, attach elsewhere", he: "ללכת על מסלול ה-VM העזר: snapshot, ‏stop, לנתק, לחבר למכונה אחרת" }, next: "s4", score: 5,
          feedback: { en: "Yes. Note for the postmortem: a vaulted break-glass user would have made this a 2-minute fix.", he: "כן. הערה ל-postmortem: משתמש break-glass עם סיסמה בכספת היה הופך את זה לתיקון של 2 דקות." } }
      ]
    },
    s4: {
      text: { en: "Snapshot taken, instance stopped, root volume attached to a helper VM in the same AZ. You try to mount it.", he: "snapshot נלקח, ה-instance עצור, ה-root volume מחובר ל-VM עזר באותו AZ. אתה מנסה לעשות mount." },
      data: "$ lsblk -f\nnvme0n1     xfs   1f3a...   /\nnvme1n1\n└─nvme1n1p1 xfs   1f3a...          <- broken root (same AMI lineage)\n$ sudo mount /dev/nvme1n1p1 /mnt\nmount: /mnt: wrong fs type, bad option, bad superblock on /dev/nvme1n1p1, missing codepage or helper program, or other error.\n$ sudo dmesg | tail -1\nXFS (nvme1n1p1): Filesystem has duplicate UUID 1f3a... - can't mount",
      choices: [
        { label: { en: "mount -o nouuid /dev/nvme1n1p1 /mnt", he: "mount -o nouuid /dev/nvme1n1p1 /mnt" }, next: "s5", score: 15,
          feedback: { en: "Exactly. Both disks come from the same image, so XFS sees the same UUID. nouuid skips the check — nothing is wrong with the disk.", he: "בדיוק. שני הדיסקים מגיעים מאותו image, אז XFS רואה אותו UUID. ‏nouuid מדלג על הבדיקה — אין שום בעיה בדיסק." } },
        { label: { en: "xfs_repair -L /dev/nvme1n1p1 — the superblock must be corrupted", he: "xfs_repair -L /dev/nvme1n1p1 — ה-superblock כנראה פגום" }, next: "s4b", score: -15,
          feedback: { en: "-L zeroes the journal and can throw away metadata changes. Running it on a healthy filesystem because of a misread error is how you create real damage. Good thing you snapshotted.", he: "-L מאפס את ה-journal ויכול לזרוק שינויי metadata. להריץ את זה על filesystem תקין בגלל שגיאה שקראת לא נכון זו הדרך לייצר נזק אמיתי. טוב שעשית snapshot." } }
      ]
    },
    s4b: {
      text: { en: "xfs_repair complained loudly, cleared the log and 'fixed' a few inodes. You restore a fresh volume from the pre-rescue snapshot (10 minutes lost) and read dmesg properly this time.", he: "xfs_repair התלונן בקול, ניקה את ה-log ו'תיקן' כמה inodes. אתה משחזר volume חדש מה-snapshot שלפני החילוץ (10 דקות הלכו) והפעם קורא את dmesg כמו שצריך." },
      choices: [
        { label: { en: "Mount the restored volume with -o nouuid", he: "לעשות mount ל-volume המשוחזר עם -o nouuid" }, next: "s5", score: 0,
          feedback: { en: "Back on track. The snapshot just paid for itself.", he: "חזרת למסלול. ה-snapshot החזיר את ההשקעה." } }
      ]
    },
    s5: {
      text: { en: "Mounted. fstab has the culprit: last week someone replaced the invoices volume with one restored from a snapshot-copy — new volume, new filesystem UUID — and only updated the app config, not fstab. The entry has no nofail.", he: "עשית mount. ב-fstab נמצא האשם: בשבוע שעבר מישהו החליף את volume החשבוניות ב-volume שהוא שחזר מעותק snapshot — volume חדש, ‏UUID חדש ל-filesystem — ועדכן רק את ה-config של האפליקציה, לא את ה-fstab. לרשומה אין nofail." },
      data: "$ cat /mnt/etc/fstab\nUUID=1f3a...                                /              xfs  defaults,noatime         0 0\nUUID=7c2e9a41-...-3f10                      /data/invoices xfs  defaults                 0 2\n$ aws ec2 describe-volumes --filters Name=attachment.instance-id,Values=i-0b1ll1ng --query 'Volumes[].VolumeId'\n[\"vol-0root...\", \"vol-0inv2026...\"]     # helper: blkid on vol-0inv2026 -> UUID=a90d17c3-...-55e2",
      choices: [
        { label: { en: "Fix the UUID to a90d17c3-... and add nofail,x-systemd.device-timeout=10s", he: "לתקן את ה-UUID ל-a90d17c3-... ולהוסיף nofail,x-systemd.device-timeout=10s" }, next: "s6", score: 15,
          feedback: { en: "Fixes the cause and makes the next mistake non-fatal for boot.", he: "מתקן את הסיבה והופך את הטעות הבאה ללא-קטלנית ל-boot." } },
        { label: { en: "Comment out the /data/invoices line and deal with it later", he: "להפוך את שורת /data/invoices להערה ולטפל בזה אחר כך" }, next: "s6", score: 0,
          feedback: { en: "It will boot — but the 10:00 invoicing job will write into an empty /data/invoices directory on the root disk. Silent data in the wrong place.", he: "זה יעלה — אבל ג'וב החשבוניות של 10:00 יכתוב לתיקייה ריקה /data/invoices על דיסק ה-root. דאטה שקט במקום הלא נכון." } }
      ]
    },
    s6: {
      text: { en: "Unmounted, volume re-attached to the original instance as /dev/xvda, started. 08:35: status checks 2/2, SSH works, /data/invoices is mounted. What do you do before closing the incident?", he: "unmount, ה-volume חובר בחזרה ל-instance המקורי כ-/dev/xvda, ‏start. ‏08:35: ‏status checks 2/2, ‏SSH עובד, ‏/data/invoices עושה mount. מה אתה עושה לפני שאתה סוגר את התקלה?" },
      data: "$ findmnt /data/invoices\nTARGET          SOURCE          FSTYPE OPTIONS\n/data/invoices  /dev/nvme1n1    xfs    rw,relatime,attr2,inode64\n$ systemctl --failed\n0 loaded units listed.",
      choices: [
        { label: { en: "Add an fstab check (findmnt --verify + nofail on non-root mounts) to the fleet, a break-glass console user, and a ticket to make this box replaceable", he: "להוסיף בדיקת fstab (‏findmnt --verify + nofail על mounts שאינם root) לכל הצי, משתמש break-glass לקונסולה, וטיקט להפוך את הקופסה הזו לברת-החלפה" }, next: "win", score: 15,
          feedback: { en: "That's the difference between fixing an incident and fixing a class of incidents.", he: "זה ההבדל בין לתקן תקלה לבין לתקן סוג של תקלות." } },
        { label: { en: "Close the ticket — it works now", he: "לסגור את הטיקט — זה עובד עכשיו" }, next: "win", score: 0,
          feedback: { en: "It works — until the next volume swap on any other box without nofail.", he: "זה עובד — עד ההחלפה הבאה של volume בכל קופסה אחרת בלי nofail." } }
      ]
    },
    win: {
      text: { en: "Invoicing ran at 10:00 on time. Postmortem: fstab drift after a manual volume swap + no nofail + no console access. Action items shipped the same week.", he: "החשבוניות רצו ב-10:00 בזמן. ‏Postmortem: ‏drift ב-fstab אחרי החלפת volume ידנית + בלי nofail + בלי גישה לקונסולה. ה-action items נסגרו באותו שבוע." },
      end: "win"
    },
    lose: {
      text: { en: "The invoicing data and years of hand-tuned config are gone. The 10:00 run fails, finance escalates, and the restore from last month's backup takes two days. Lesson: stop, snapshot, read the console — then act.", he: "דאטה החשבוניות ושנים של config שכוונן ביד נעלמו. הריצה של 10:00 נכשלת, הכספים מסלימים, והשחזור מהגיבוי של החודש שעבר לוקח יומיים. השיעור: stop, ‏snapshot, לקרוא את הקונסולה — ורק אז לפעול." },
      end: "lose"
    }
  },
  lessons: ["linux-boot-rescue", "fs-filesystems-raid", "linux-disks-storage"]
});
