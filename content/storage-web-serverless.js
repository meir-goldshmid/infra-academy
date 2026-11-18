// Disks vs storage services, static website hosting, CDN in production, FaaS vs serverless containers.
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// 1. Disks vs storage
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "storage-kinds-map",
  track: "cloud",
  order: 96,
  icon: "🗂️",
  level: 2,
  minutes: 11,
  title: { en: "Disks vs Storage: Every Kind of Storage and When to Use It", he: "דיסקים מול Storage: כל סוגי האחסון ומתי להשתמש בכל אחד" },
  tldr: {
    en: "A disk is one device that gives one machine a stream of blocks; storage is the whole family of services that keep bytes for you: ephemeral local disks, network block volumes, shared file systems, object stores and archives. Pick by who reads the data (one machine or many), how (blocks, files or HTTP), how fast, and what must survive when the machine dies.",
    he: "דיסק הוא התקן אחד שנותן למכונה אחת רצף של blocks. Storage הוא כל המשפחה של שירותים ששומרים בשבילך bytes: דיסקים מקומיים זמניים, volumes של block ברשת, מערכות קבצים משותפות, object stores וארכיון. בוחרים לפי מי קורא את המידע (מכונה אחת או הרבה), איך (blocks, קבצים או HTTP), כמה מהר, ומה חייב לשרוד כשהמכונה מתה."
  },
  analogy: {
    en: "A disk is the desk drawer in your own office: fast, private, and it goes wherever the desk goes. A file share is the team cabinet in the hallway: everyone can open the same folder, but you walk a bit. Object storage is a huge warehouse with a counter: you hand over a box with a label and get it back by label, never by opening a drawer. Archive is the storage unit outside the city: cheap, but it takes a day to drive there.",
    he: "דיסק הוא המגירה בשולחן שלך: מהירה, פרטית, והולכת לאן שהשולחן הולך. File share הוא הארון המשותף במסדרון: כולם פותחים את אותה תיקייה, אבל צריך ללכת קצת. Object storage הוא מחסן ענק עם דלפק: מוסר ארגז עם תווית ומקבל אותו בחזרה לפי התווית, אף פעם לא פותח מגירה. ארכיון הוא מחסן מחוץ לעיר: זול, אבל לוקח יום להגיע אליו."
  },
  sections: [
    {
      h: { en: "Disk is a device, storage is a service", he: "דיסק הוא התקן, storage הוא שירות" },
      body: {
        en: `<p>The words get mixed up, so separate the layers. From the bottom:</p>
<ol><li><strong>Physical drive</strong>: HDD, SATA SSD or NVMe SSD. It stores blocks and fails at some rate (see <code>disks-hdd-ssd-nvme</code>).</li>
<li><strong>Block device / volume</strong>: what the OS sees, for example <code>/dev/nvme1n1</code>. In the cloud this is usually <em>not</em> a local drive but a network volume (EBS, Azure Managed Disk, GCP Persistent Disk / Hyperdisk) that pretends to be one.</li>
<li><strong>Filesystem</strong>: ext4, XFS or NTFS on top of the block device turns blocks into files and directories.</li>
<li><strong>Storage service</strong>: a product with an API, durability promise, replication and a price list: file shares over NFS/SMB, object stores over HTTP, archives, and databases on top.</li></ol>
<p>So "disk" answers <em>where the blocks physically are</em>. "Storage" answers <em>how your application keeps and finds its data</em>. One VM has disks. A system has a storage design.</p>
<blockquote>💡 Real world: when someone says "we're out of storage", ask which one. A full root disk (<code>df -h</code> shows 100%) is fixed in minutes. A bucket that grew to 400 TB is a cost and lifecycle problem.</blockquote>`,
        he: `<p>המילים מתערבבות, אז מפרידים לשכבות. מלמטה למעלה:</p>
<ol><li><strong>כונן פיזי</strong>: HDD, SSD מסוג SATA או NVMe. הוא שומר blocks ונכשל בקצב מסוים (ראה <code>disks-hdd-ssd-nvme</code>).</li>
<li><strong>Block device / volume</strong>: מה שה-OS רואה, למשל <code>/dev/nvme1n1</code>. בענן זה בדרך כלל <em>לא</em> כונן מקומי אלא volume ברשת (EBS, Azure Managed Disk, GCP Persistent Disk / Hyperdisk) שמתחזה לכונן.</li>
<li><strong>Filesystem</strong>: ext4, XFS או NTFS מעל ה-block device הופכים blocks לקבצים ותיקיות.</li>
<li><strong>שירות storage</strong>: מוצר עם API, הבטחת durability, replication ומחירון: file shares ב-NFS/SMB, object stores ב-HTTP, ארכיון, ו-databases מעל כל אלה.</li></ol>
<p>כלומר "דיסק" עונה על השאלה <em>איפה ה-blocks נמצאים פיזית</em>. "Storage" עונה על השאלה <em>איך האפליקציה שומרת ומוצאת את המידע שלה</em>. ל-VM יש דיסקים. למערכת יש תכנון storage.</p>
<blockquote>💡 מהשטח: כשמישהו אומר "נגמר לנו ה-storage", תשאל איזה. דיסק root מלא (<code>df -h</code> מראה 100%) מתקנים בדקות. Bucket שגדל ל-400 TB הוא בעיה של עלות ו-lifecycle.</blockquote>`
      }
    },
    {
      h: { en: "The map: five kinds of storage", he: "המפה: חמישה סוגי storage" },
      body: {
        en: `<p>Prices are AWS us-east-1 list prices; Azure and GCP are in the same range.</p>
<table><tr><th>Kind</th><th>Access</th><th>Who can use it</th><th>Typical latency</th><th>Survives</th><th>Examples</th><th>Price</th></tr>
<tr><td>Ephemeral local</td><td>Block / filesystem</td><td>One machine</td><td>~0.1 ms (local NVMe)</td><td>Reboot only (instance store); nothing for a container's writable layer</td><td>EC2 instance store, GCP Local SSD, Azure temp disk, <code>emptyDir</code></td><td>Included in the instance</td></tr>
<tr><td>Network block</td><td>Block device</td><td>One VM (multi-attach is rare and special)</td><td>Sub-ms to ~1 ms</td><td>VM death; lives in <strong>one AZ</strong></td><td>EBS gp3/io2, Azure Premium SSD v2, GCP Hyperdisk / PD</td><td>gp3 $0.08/GB-month, 3,000 IOPS and 125 MB/s included</td></tr>
<tr><td>File (shared)</td><td>NFS / SMB, POSIX paths</td><td>Hundreds of clients at once</td><td>~1 ms and up, every metadata call costs a round trip</td><td>AZ failure (regional EFS)</td><td>EFS, FSx, Azure Files, Filestore</td><td>EFS Standard ~$0.30/GB-month</td></tr>
<tr><td>Object</td><td>HTTP API: PUT / GET by key</td><td>Anyone with permission, from anywhere</td><td>Tens of ms to first byte</td><td>AZ failure; 11 nines durability</td><td>S3, Azure Blob, GCS, MinIO</td><td>S3 Standard $0.023/GB-month + per-request fees</td></tr>
<tr><td>Archive</td><td>Object API with a restore step</td><td>Same as object</td><td>Hours (Glacier Deep Archive: up to 12-48 h)</td><td>Same as object</td><td>S3 Glacier, Azure Archive, GCS Archive</td><td>Deep Archive ~$0.001/GB-month</td></tr></table>
<p>Databases, caches and search engines are storage too, built on top of these: Postgres sits on a block volume, a data lake sits on object storage.</p>
<p>The price gap is the lesson: 1 TB costs ~$80/month on gp3, ~$300 on EFS, ~$23 on S3 and ~$1 in Deep Archive. Put each byte in the cheapest place that still meets its access pattern.</p>`,
        he: `<p>המחירים הם מחירון AWS ב-us-east-1; ב-Azure וב-GCP זה באותו סדר גודל.</p>
<table><tr><th>סוג</th><th>גישה</th><th>מי משתמש</th><th>latency טיפוסי</th><th>מה שורד</th><th>דוגמאות</th><th>מחיר</th></tr>
<tr><td>מקומי זמני</td><td>Block / filesystem</td><td>מכונה אחת</td><td>בערך 0.1 ms ‏(NVMe מקומי)</td><td>רק reboot ‏(instance store); כלום בשכבה הכתיבה של קונטיינר</td><td>EC2 instance store, GCP Local SSD, Azure temp disk, <code>emptyDir</code></td><td>כלול במחיר המכונה</td></tr>
<tr><td>Block ברשת</td><td>Block device</td><td>VM אחד (multi-attach נדיר ומיוחד)</td><td>פחות מ-1 ms עד בערך 1 ms</td><td>מוות של ה-VM; חי <strong>ב-AZ אחד</strong></td><td>EBS gp3/io2, Azure Premium SSD v2, GCP Hyperdisk / PD</td><td>gp3: ‏$0.08 ל-GB לחודש, כולל 3,000 IOPS ו-125 MB/s</td></tr>
<tr><td>קבצים (משותף)</td><td>NFS / SMB, נתיבי POSIX</td><td>מאות clients במקביל</td><td>מ-1 ms ומעלה, וכל קריאת metadata עולה round trip</td><td>נפילת AZ ‏(EFS אזורי)</td><td>EFS, FSx, Azure Files, Filestore</td><td>EFS Standard: בערך ‎$0.30 ל-GB לחודש</td></tr>
<tr><td>Object</td><td>API ב-HTTP: PUT / GET לפי key</td><td>כל מי שיש לו הרשאה, מכל מקום</td><td>עשרות ms עד ה-byte הראשון</td><td>נפילת AZ; durability של 11 תשיעיות</td><td>S3, Azure Blob, GCS, MinIO</td><td>S3 Standard: ‏$0.023 ל-GB לחודש, ועוד תשלום לכל request</td></tr>
<tr><td>ארכיון</td><td>API של object עם שלב restore</td><td>כמו object</td><td>שעות (ב-Glacier Deep Archive עד 12-48 שעות)</td><td>כמו object</td><td>S3 Glacier, Azure Archive, GCS Archive</td><td>Deep Archive: בערך ‎$0.001 ל-GB לחודש</td></tr></table>
<p>גם databases, caches ומנועי חיפוש הם storage, והם בנויים מעל אלה: Postgres יושב על volume של block, ו-data lake יושב על object storage.</p>
<p>פער המחירים הוא השיעור: 1 TB עולה בערך ‎$80 לחודש ב-gp3, בערך ‎$300 ב-EFS, בערך ‎$23 ב-S3 ובערך ‎$1 ב-Deep Archive. שמים כל byte במקום הזול ביותר שעדיין מתאים לדפוס הגישה שלו.</p>`
      }
    },
    {
      h: { en: "Which storage for which job", he: "איזה storage לאיזו משימה" },
      body: {
        en: `<table><tr><th>Workload</th><th>Use</th><th>Why</th></tr>
<tr><td>OS / boot disk of a VM</td><td>Network block (gp3)</td><td>Survives the VM, snapshots for backup</td></tr>
<tr><td>Self-managed Postgres / MySQL</td><td>Network block (gp3, io2 for heavy IOPS)</td><td>Low latency fsync, snapshots, the volume moves to a new VM after a crash</td></tr>
<tr><td>Kafka, Cassandra, Elasticsearch, ClickHouse with replication</td><td>Often local NVMe</td><td>The app already keeps 3 copies, so losing a node is a rebuild, and local NVMe is faster and cheaper per IOPS</td></tr>
<tr><td>Build caches, temp files, sort spills</td><td>Ephemeral (<code>emptyDir</code>, instance store)</td><td>Speed matters, loss doesn't</td></tr>
<tr><td>User uploads, images, video, PDFs</td><td>Object storage (+ CDN)</td><td>Unlimited, cheap, any server and any browser can reach it (presigned URLs)</td></tr>
<tr><td>Static website</td><td>Object storage + CDN</td><td>See <code>static-site-hosting</code></td></tr>
<tr><td>Backups, logs older than 30 days, data lake</td><td>Object storage with lifecycle rules</td><td>11 nines, tiers, Object Lock for immutability</td></tr>
<tr><td>7-year compliance retention</td><td>Archive tier + Object Lock</td><td>Almost free to keep, and nobody reads it</td></tr>
<tr><td>Many servers need the same files (legacy CMS uploads, home dirs, shared ML dataset)</td><td>File share (EFS, Azure Files, FSx for Lustre for ML)</td><td>POSIX paths without changing the app; often a sign the app should move to object storage later</td></tr>
<tr><td>Container images</td><td>A registry (ECR, ACR, Artifact Registry)</td><td>Which is object storage underneath</td></tr></table>
<p>In Kubernetes the same map shows up as access modes: <code>ReadWriteOnce</code> PVC = a network block volume, <code>ReadWriteMany</code> = a file share, and object storage is not a volume at all: the app talks to it over HTTP with an SDK.</p>`,
        he: `<table><tr><th>Workload</th><th>במה להשתמש</th><th>למה</th></tr>
<tr><td>דיסק OS / boot של VM</td><td>Block ברשת (gp3)</td><td>שורד את ה-VM, ו-snapshots לגיבוי</td></tr>
<tr><td>Postgres / MySQL בניהול עצמי</td><td>Block ברשת (gp3, ו-io2 להרבה IOPS)</td><td>fsync עם latency נמוך, snapshots, וה-volume עובר ל-VM חדש אחרי קריסה</td></tr>
<tr><td>Kafka, Cassandra, Elasticsearch, ClickHouse עם replication</td><td>הרבה פעמים NVMe מקומי</td><td>האפליקציה כבר מחזיקה 3 עותקים, אז אובדן node הוא rebuild, ו-NVMe מקומי מהיר וזול יותר לכל IOPS</td></tr>
<tr><td>Build caches, קבצים זמניים, sort spills</td><td>זמני (<code>emptyDir</code>, instance store)</td><td>המהירות חשובה, האובדן לא</td></tr>
<tr><td>העלאות של משתמשים, תמונות, וידאו, PDF</td><td>Object storage (ועוד CDN)</td><td>בלי גבול, זול, וכל שרת וכל דפדפן יכולים להגיע אליו (presigned URLs)</td></tr>
<tr><td>אתר סטטי</td><td>Object storage ועוד CDN</td><td>ראה <code>static-site-hosting</code></td></tr>
<tr><td>גיבויים, לוגים מעל 30 יום, data lake</td><td>Object storage עם lifecycle rules</td><td>11 תשיעיות, tiers, ו-Object Lock בשביל immutability</td></tr>
<tr><td>שמירה של 7 שנים בגלל רגולציה</td><td>Tier של ארכיון ועוד Object Lock</td><td>כמעט בחינם לשמור, ואף אחד לא קורא את זה</td></tr>
<tr><td>הרבה שרתים צריכים את אותם קבצים (העלאות של CMS ישן, תיקיות בית, dataset משותף ל-ML)</td><td>File share ‏(EFS, Azure Files, ו-FSx for Lustre ל-ML)</td><td>נתיבי POSIX בלי לשנות את האפליקציה. לרוב זה סימן שהאפליקציה צריכה לעבור בהמשך ל-object storage</td></tr>
<tr><td>Container images</td><td>Registry ‏(ECR, ACR, Artifact Registry)</td><td>שמתחת לפני השטח הוא object storage</td></tr></table>
<p>ב-Kubernetes אותה מפה מופיעה בתור access modes: PVC מסוג <code>ReadWriteOnce</code> הוא volume של block ברשת, <code>ReadWriteMany</code> הוא file share, ו-object storage הוא בכלל לא volume: האפליקציה מדברת איתו ב-HTTP דרך SDK.</p>`
      }
    },
    {
      h: { en: "The traps that cause incidents", he: "המלכודות שגורמות לתקלות" },
      body: {
        en: `<ul><li><strong>Block volumes are zonal.</strong> An EBS volume in <code>eu-west-1a</code> can't attach to a node in <code>eu-west-1b</code>. In Kubernetes the Pod stays Pending with <code>volume node affinity conflict</code>. Use <code>volumeBindingMode: WaitForFirstConsumer</code> and keep node groups in every AZ the volumes live in.</li>
<li><strong>Instance store dies on stop.</strong> It survives a reboot, but a stop, a hibernate, a host failure or a Spot interruption wipes it. Never keep the only copy there.</li>
<li><strong>Shared file systems hate small files.</strong> <code>npm install</code> or a <code>git clone</code> on EFS is painfully slow because every <code>stat()</code> and <code>open()</code> is a network round trip. Big sequential files are fine.</li>
<li><strong>Object storage is not a filesystem.</strong> No append, no partial overwrite, and "rename" is copy plus delete. Tools like Mountpoint for S3 are great for reading big files, and wrong for a database or a log you append to.</li>
<li><strong>Old defaults cost money.</strong> gp2 volumes rely on burst credits, so IOPS drop off a cliff after the burst. gp3 is ~20% cheaper and has a flat baseline. Migrate in place with <code>aws ec2 modify-volume</code>, no downtime.</li></ul>`,
        he: `<ul><li><strong>Volumes של block הם zonal.</strong> Volume של EBS ב-<code>eu-west-1a</code> לא יכול להתחבר ל-node ב-<code>eu-west-1b</code>. ב-Kubernetes ה-Pod נשאר Pending עם <code>volume node affinity conflict</code>. משתמשים ב-<code>volumeBindingMode: WaitForFirstConsumer</code> ומחזיקים node groups בכל AZ שיש בו volumes.</li>
<li><strong>Instance store מת ב-stop.</strong> הוא שורד reboot, אבל stop, hibernate, נפילת host או Spot interruption מוחקים אותו. לעולם לא שומרים שם את העותק היחיד.</li>
<li><strong>מערכות קבצים משותפות שונאות קבצים קטנים.</strong> <code>npm install</code> או <code>git clone</code> על EFS איטיים מאוד, כי כל <code>stat()</code> וכל <code>open()</code> הם round trip ברשת. קבצים גדולים וסדרתיים עובדים מצוין.</li>
<li><strong>Object storage הוא לא filesystem.</strong> אין append, אין דריסה חלקית, ו-"rename" הוא העתקה ועוד מחיקה. כלים כמו Mountpoint for S3 מעולים לקריאה של קבצים גדולים, ולא מתאימים ל-database או ללוג שכותבים לסופו.</li>
<li><strong>ברירות מחדל ישנות עולות כסף.</strong> Volumes מסוג gp2 נשענים על burst credits, אז ה-IOPS צונחים אחרי ה-burst. ‏gp3 זול בערך ב-20% ויש לו baseline קבוע. עוברים בלי downtime עם <code>aws ec2 modify-volume</code>.</li></ul>`
      }
    }
  ],
  diagram: "app\n |-- local NVMe / emptyDir ...... ephemeral, ~0.1 ms, one machine\n |-- /dev/nvme1n1 -> EBS ......... network block, ~1 ms, one VM, one AZ\n |-- /mnt/shared  -> EFS (NFS) ... file, many clients, region\n |-- HTTPS PUT/GET -> S3 ......... object, any client, 11 nines\n '-- lifecycle -> Glacier ........ archive, hours to restore",
  handsOn: [
    { cmd: "lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,MODEL", what: { en: "See the block devices: on EC2 Nitro, EBS volumes show model 'Amazon Elastic Block Store' and instance store shows 'Amazon EC2 NVMe Instance Storage'.", he: "רואים את ה-block devices: ב-EC2 על Nitro, volumes של EBS מופיעים עם model ‏'Amazon Elastic Block Store' ו-instance store עם 'Amazon EC2 NVMe Instance Storage'." } },
    { cmd: "df -hT", what: { en: "Filesystems, their type (ext4, xfs, nfs4, overlay) and how full they are.", he: "ה-filesystems, הסוג שלהם (ext4, xfs, nfs4, overlay) וכמה הם מלאים." } },
    { cmd: "aws ec2 describe-volumes --query \"Volumes[].[VolumeId,VolumeType,Size,Iops,AvailabilityZone,State]\" --output table", what: { en: "Every EBS volume with its type and AZ. Look for gp2 volumes to migrate and 'available' ones that nobody uses but you still pay for.", he: "כל ה-volumes של EBS עם הסוג וה-AZ. מחפשים gp2 להעביר, ו-volumes במצב 'available' שאף אחד לא משתמש בהם אבל עדיין משלמים עליהם." } },
    { cmd: "kubectl get pvc -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,CLASS:.spec.storageClassName,MODES:.spec.accessModes,SIZE:.status.capacity.storage", what: { en: "Which Pods use block (RWO) and which use shared file storage (RWX).", he: "אילו Pod-ים משתמשים ב-block ‏(RWO) ואילו ב-storage משותף של קבצים (RWX)." } },
    { cmd: "aws s3 ls s3://my-bucket --recursive --summarize --human-readable | tail -2", what: { en: "Object count and total size of a bucket (fine for small buckets; use S3 Storage Lens or CloudWatch metrics for big ones).", he: "כמות ה-objects והגודל הכולל של bucket (מתאים ל-bucket קטן; ל-bucket גדול משתמשים ב-S3 Storage Lens או במטריקות של CloudWatch)." } }
  ],
  mnemonic: {
    en: "Block = a drawer for one, File = a cabinet for many, Object = a warehouse over HTTP, Archive = a unit out of town, Ephemeral = a whiteboard.",
    he: "Block = מגירה לאחד, File = ארון לכולם, Object = מחסן דרך HTTP, Archive = מחסן מחוץ לעיר, זמני = לוח מחיק."
  },
  pitfalls: [
    { en: "Running a database on EFS/NFS to 'make it shared'. Databases need low-latency fsync and their own locking; two writers on one shared data dir corrupt it. Share through replication, not through the filesystem.", he: "להריץ database על EFS/NFS כדי ש\"יהיה משותף\". Databases צריכים fsync עם latency נמוך ונעילות משלהם, ושני כותבים על אותה תיקיית data משחיתים אותה. משתפים דרך replication, לא דרך ה-filesystem." },
    { en: "Writing important data to the container's writable layer. It disappears on every restart; anything that must survive goes to a volume or to object storage.", he: "לכתוב מידע חשוב לשכבת הכתיבה של הקונטיינר. הוא נעלם בכל restart, וכל מה שחייב לשרוד הולך ל-volume או ל-object storage." },
    { en: "Forgetting that snapshots and unattached volumes are billed. Orphaned EBS volumes and years of daily snapshots are a classic FinOps finding.", he: "לשכוח שמשלמים על snapshots ועל volumes לא מחוברים. Volumes יתומים של EBS ושנים של snapshots יומיים הם ממצא קלאסי של FinOps." },
    { en: "Picking file storage for user uploads because 'the app writes to /uploads'. It works on day one and becomes the slowest, most expensive part at scale; plan the move to object storage early.", he: "לבחור storage של קבצים להעלאות משתמשים כי \"האפליקציה כותבת ל-/uploads\". ביום הראשון זה עובד, ובסקייל זה הופך לחלק האיטי והיקר ביותר. מתכננים מוקדם את המעבר ל-object storage." }
  ],
  interview: [
    { q: { en: "What's the difference between a disk and storage in the cloud?", he: "מה ההבדל בין דיסק ל-storage בענן?" },
      a: { en: "A disk is a block device attached to one machine; in the cloud it's usually a network volume like EBS that lives in one AZ and is used through a filesystem. Storage is the broader design: block volumes, shared file systems (NFS/SMB), object stores over HTTP and archive tiers, each with different sharing, latency, durability and price. I pick per workload: block for databases and boot disks, object for uploads, backups and static assets, file only when many servers truly need POSIX paths, and ephemeral local NVMe for caches or for replicated systems like Kafka.", he: "דיסק הוא block device שמחובר למכונה אחת. בענן זה בדרך כלל volume ברשת כמו EBS, שחי ב-AZ אחד ומשתמשים בו דרך filesystem. Storage הוא התכנון הרחב יותר: volumes של block, מערכות קבצים משותפות (NFS/SMB), object stores ב-HTTP ו-tiers של ארכיון, ולכל אחד שיתוף, latency, durability ומחיר אחרים. אני בוחר לפי workload: block ל-databases ולדיסקי boot, object להעלאות, גיבויים ו-assets סטטיים, קבצים רק כשהרבה שרתים באמת צריכים נתיבי POSIX, ו-NVMe מקומי זמני ל-caches או למערכות עם replication כמו Kafka." } },
    { q: { en: "A StatefulSet Pod is stuck Pending after a node failure. Why might storage be the cause?", he: "Pod של StatefulSet תקוע ב-Pending אחרי נפילת node. למה ה-storage יכול להיות הסיבה?" },
      a: { en: "Its PVC is bound to a zonal block volume (EBS) in the failed node's AZ. If no healthy node exists in that AZ, the scheduler reports 'volume node affinity conflict'. Fix: node groups in every AZ, WaitForFirstConsumer binding, and for real HA, app-level replication across AZs instead of relying on one volume.", he: "ה-PVC שלו מחובר ל-volume זונלי של block ‏(EBS) ב-AZ של ה-node שנפל. אם אין node תקין באותו AZ, ה-scheduler מדווח 'volume node affinity conflict'. הפתרון: node groups בכל AZ, binding מסוג WaitForFirstConsumer, ובשביל HA אמיתי, replication ברמת האפליקציה בין AZ-ים במקום להישען על volume אחד." } }
  ],
  quiz: [
    { q: { en: "Which storage loses its data when an EC2 instance is stopped (not rebooted)?", he: "איזה storage מאבד את המידע שלו כשעושים stop ל-EC2 (לא reboot)?" },
      options: [{ en: "EBS gp3", he: "EBS gp3" }, { en: "Instance store", he: "Instance store" }, { en: "EFS", he: "EFS" }, { en: "S3", he: "S3" }], answer: 1,
      explain: { en: "Instance store is physically on the host. Stop moves the instance to another host, so the data is gone. EBS, EFS and S3 are network services.", he: "Instance store נמצא פיזית על ה-host. ב-stop המכונה עוברת ל-host אחר, אז המידע נעלם. EBS, ‏EFS ו-S3 הם שירותים ברשת." } },
    { q: { en: "50 web servers must read and write the same uploaded images. What's the best long-term choice?", he: "50 שרתי web צריכים לקרוא ולכתוב את אותן תמונות שהועלו. מה הבחירה הטובה לטווח ארוך?" },
      options: [{ en: "One big EBS volume with multi-attach", he: "Volume גדול אחד של EBS עם multi-attach" }, { en: "Object storage (S3/Blob/GCS), served through a CDN", he: "Object storage ‏(S3/Blob/GCS), מוגש דרך CDN" }, { en: "Instance store on each server", he: "Instance store על כל שרת" }, { en: "A database BLOB column", he: "עמודת BLOB ב-database" }], answer: 1,
      explain: { en: "Object storage is shared by design, unlimited, cheap and reachable by browsers through presigned URLs. Multi-attach needs a cluster-aware filesystem; a shared NFS also works but is pricier and slower at scale.", he: "Object storage משותף מעצם התכנון, בלי גבול, זול, ודפדפנים מגיעים אליו דרך presigned URLs. Multi-attach דורש filesystem שמודע ל-cluster. גם NFS משותף יעבוד, אבל הוא יקר ואיטי יותר בסקייל." } },
    { q: { en: "Roughly how much does 1 TB cost per month in S3 Standard vs EBS gp3?", he: "בערך כמה עולה 1 TB לחודש ב-S3 Standard לעומת EBS gp3?" },
      options: [{ en: "$23 vs $80", he: "‎$23 לעומת ‎$80" }, { en: "$80 vs $23", he: "‎$80 לעומת ‎$23" }, { en: "Both about $100", he: "שניהם בערך ‎$100" }, { en: "$1 vs $300", he: "‎$1 לעומת ‎$300" }], answer: 0,
      explain: { en: "S3 Standard is ~$0.023/GB-month and gp3 ~$0.08/GB-month. EFS Standard is ~$0.30 and Deep Archive ~$0.001.", he: "S3 Standard עולה בערך ‎$0.023 ל-GB לחודש, ו-gp3 בערך ‎$0.08. ‏EFS Standard בערך ‎$0.30 ו-Deep Archive בערך ‎$0.001." } },
    { q: { en: "Which Kubernetes access mode usually means a shared file system underneath?", he: "איזה access mode ב-Kubernetes אומר בדרך כלל שיש מתחת file system משותף?" },
      options: [{ en: "ReadWriteOnce", he: "ReadWriteOnce" }, { en: "ReadWriteMany", he: "ReadWriteMany" }, { en: "ReadWriteOncePod", he: "ReadWriteOncePod" }, { en: "emptyDir", he: "emptyDir" }], answer: 1,
      explain: { en: "RWX lets Pods on many nodes mount the same volume at once, which block volumes can't do; it's backed by NFS-style storage like EFS or Azure Files.", he: "RWX מאפשר ל-Pod-ים על הרבה nodes לעשות mount לאותו volume במקביל, מה ש-volumes של block לא יודעים לעשות. מאחוריו יש storage בסגנון NFS כמו EFS או Azure Files." } }
  ],
  related: ["cloud-storage", "storage-io", "disks-hdd-ssd-nvme", "k8s-storage", "s3-deep", "cloud-storage-lifecycle", "static-site-hosting"]
});

// ---------------------------------------------------------------------------
// 2. Static website hosting
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "static-site-hosting",
  track: "cloud",
  order: 97,
  icon: "🌐",
  level: 2,
  minutes: 10,
  title: { en: "Static Websites: Hosting, CDN, Caching and Deploys", he: "אתרים סטטיים: hosting, ‏CDN, ‏caching ו-deploy" },
  tldr: {
    en: "A static site is a folder of prebuilt files (HTML, JS, CSS, images) served as-is, with no server code per request. Put it in object storage or on a static host, put a CDN in front, cache hashed assets forever and index.html never, and keep the bucket private behind the CDN. It costs cents, scales without effort and has almost no attack surface.",
    he: "אתר סטטי הוא תיקייה של קבצים שנבנו מראש (HTML, ‏JS, ‏CSS, תמונות) שמוגשים כמו שהם, בלי קוד שרת לכל request. שמים אותו ב-object storage או ב-host סטטי, שמים CDN מלפנים, עושים cache ל-assets עם hash לתמיד ול-index.html אף פעם, ומשאירים את ה-bucket פרטי מאחורי ה-CDN. זה עולה סנטים, עושה scale בלי מאמץ, וכמעט אין לו משטח תקיפה."
  },
  analogy: {
    en: "A dynamic site is a restaurant kitchen that cooks every order. A static site is a vending machine stocked in advance: every customer gets the same sealed package instantly, and you can put a copy of the machine on every street corner (the CDN). When the menu changes, you restock the machines; you don't hire cooks.",
    he: "אתר דינמי הוא מטבח של מסעדה שמבשל כל הזמנה. אתר סטטי הוא מכונת חטיפים שמילאו מראש: כל לקוח מקבל מיד את אותה אריזה סגורה, ואפשר להציב עותק של המכונה בכל פינת רחוב (ה-CDN). כשהתפריט משתנה, ממלאים מחדש את המכונות, לא מגייסים טבחים."
  },
  sections: [
    {
      h: { en: "What 'static' really means", he: "מה זה באמת \"סטטי\"" },
      body: {
        en: `<p>Static means the <strong>server</strong> does no work per request: it returns files that a build produced earlier. The page can still be very interactive, because the JavaScript runs in the browser and calls APIs.</p>
<ul><li><strong>Static site generators (SSG)</strong>: Hugo, Astro, Jekyll, Docusaurus, Next.js with <code>output: 'export'</code>. They render every page to HTML at build time. Great for docs, blogs, marketing.</li>
<li><strong>Single-page apps (SPA)</strong>: React, Vue or Svelte built with Vite into <code>index.html</code> + JS bundles. One HTML file; the router in the browser draws every "page".</li>
<li><strong>Not static</strong>: server-side rendering per request (Next.js SSR, Rails, Django templates). That needs compute: a container, a function or an edge runtime.</li></ul>
<p>The dynamic parts (login, forms, search, payments) move to APIs: your backend, serverless functions or SaaS. This split is often called <em>Jamstack</em>.</p>
<p>Why teams love it: a 5 MB site with 1M page views a month costs a few dollars, there is no server to patch, and a traffic spike hits a CDN built for millions of requests per second. This app (Infra Academy) is itself a static site on GitHub Pages.</p>`,
        he: `<p>סטטי אומר שה-<strong>שרת</strong> לא עושה שום עבודה לכל request: הוא מחזיר קבצים ש-build ייצר קודם. הדף עדיין יכול להיות אינטראקטיבי מאוד, כי ה-JavaScript רץ בדפדפן וקורא ל-APIs.</p>
<ul><li><strong>Static site generators ‏(SSG)</strong>: Hugo, Astro, Jekyll, Docusaurus, ו-Next.js עם <code>output: 'export'</code>. הם מרנדרים כל דף ל-HTML בזמן ה-build. מעולה לתיעוד, בלוגים ואתרי שיווק.</li>
<li><strong>Single-page apps ‏(SPA)</strong>: React, ‏Vue או Svelte שנבנים עם Vite ל-<code>index.html</code> ועוד JS bundles. קובץ HTML אחד, וה-router בדפדפן מצייר כל "דף".</li>
<li><strong>לא סטטי</strong>: רינדור בצד השרת לכל request ‏(Next.js SSR, ‏Rails, תבניות של Django). זה דורש compute: קונטיינר, פונקציה או edge runtime.</li></ul>
<p>החלקים הדינמיים (login, טפסים, חיפוש, תשלומים) עוברים ל-APIs: ה-backend שלך, פונקציות serverless או SaaS. לחלוקה הזאת קוראים הרבה פעמים <em>Jamstack</em>.</p>
<p>למה צוותים אוהבים את זה: אתר של 5 MB עם מיליון צפיות בחודש עולה כמה דולרים, אין שרת לעשות לו patch, ו-spike בתעבורה פוגע ב-CDN שבנוי למיליוני requests בשנייה. האפליקציה הזאת (Infra Academy) היא בעצמה אתר סטטי על GitHub Pages.</p>`
      }
    },
    {
      h: { en: "Where to host it", he: "איפה לארח אותו" },
      body: {
        en: `<table><tr><th>Option</th><th>Good for</th><th>Notes</th></tr>
<tr><td>GitHub Pages</td><td>Docs, personal and open-source sites</td><td>Free, HTTPS, custom domain. Site up to 1 GB, soft limit 100 GB/month bandwidth, no custom response headers</td></tr>
<tr><td>Cloudflare Pages, Netlify, Vercel</td><td>Product frontends, teams</td><td>Git push = deploy, preview URL per pull request, instant rollback, edge functions for the few dynamic bits</td></tr>
<tr><td>S3 + CloudFront</td><td>Teams already on AWS that want full control</td><td>Private bucket, Origin Access Control, ACM certificate, WAF, Terraform-managed</td></tr>
<tr><td>Azure Storage static website / Azure Static Web Apps</td><td>Azure shops</td><td>Files in the <code>$web</code> container, Front Door as CDN; Static Web Apps adds PR previews and built-in auth</td></tr>
<tr><td>GCS + Cloud CDN / Firebase Hosting</td><td>GCP shops</td><td>Bucket behind an external Application Load Balancer for HTTPS, or Firebase for the one-command path</td></tr></table>
<p>Rule of thumb: a managed static host is the fastest path and usually the right one. Choose the bucket + CDN build when you need it inside your cloud account: same IAM, same WAF, same audit logs, same Terraform.</p>`,
        he: `<table><tr><th>אפשרות</th><th>מתאים ל</th><th>הערות</th></tr>
<tr><td>GitHub Pages</td><td>תיעוד, אתרים אישיים ו-open source</td><td>חינם, HTTPS, דומיין משלך. אתר עד 1 GB, מגבלה רכה של 100 GB לחודש, ואי אפשר להוסיף response headers</td></tr>
<tr><td>Cloudflare Pages, Netlify, Vercel</td><td>Frontends של מוצר, צוותים</td><td>Git push הוא deploy, ‏preview URL לכל pull request, ‏rollback מיידי, ו-edge functions למעט החלקים הדינמיים</td></tr>
<tr><td>S3 ועוד CloudFront</td><td>צוותים שכבר ב-AWS ורוצים שליטה מלאה</td><td>Bucket פרטי, ‏Origin Access Control, תעודת ACM, ‏WAF, וניהול ב-Terraform</td></tr>
<tr><td>Azure Storage static website / Azure Static Web Apps</td><td>ארגונים ב-Azure</td><td>הקבצים ב-container בשם <code>$web</code>, ו-Front Door בתור CDN. ‏Static Web Apps מוסיף previews ל-PR ו-auth מובנה</td></tr>
<tr><td>GCS ועוד Cloud CDN / Firebase Hosting</td><td>ארגונים ב-GCP</td><td>Bucket מאחורי external Application Load Balancer בשביל HTTPS, או Firebase בשביל הדרך של פקודה אחת</td></tr></table>
<p>כלל אצבע: host סטטי מנוהל הוא הדרך המהירה, ולרוב גם הנכונה. בוחרים ב-bucket ועוד CDN כשצריך את האתר בתוך חשבון הענן שלך: אותו IAM, אותו WAF, אותם audit logs, אותו Terraform.</p>`
      }
    },
    {
      h: { en: "The AWS reference build: private S3 + CloudFront", he: "הבנייה המקובלת ב-AWS: ‏S3 פרטי ועוד CloudFront" },
      body: {
        en: `<ol><li><strong>Private bucket</strong>, Block Public Access on. Do <em>not</em> use the S3 "static website hosting" endpoint: it's HTTP only and requires a public bucket.</li>
<li><strong>CloudFront distribution</strong> with the bucket as origin through <strong>Origin Access Control (OAC)</strong>, so only CloudFront can read it. Default root object: <code>index.html</code>.</li>
<li><strong>TLS certificate</strong> from ACM, and it must be in <code>us-east-1</code> for CloudFront, whatever region your bucket is in.</li>
<li><strong>DNS</strong>: a Route 53 alias record (or a CNAME at your DNS provider) to <code>d1234abcd.cloudfront.net</code>.</li>
<li><strong>SPA routing</strong>: a deep link like <code>/settings/billing</code> has no file, and S3 answers 403 when the caller can't list the bucket. Map 403 and 404 to <code>/index.html</code> with status 200, or rewrite the path in a CloudFront Function.</li>
<li><strong>Security headers</strong> through a response headers policy: HSTS, <code>Content-Security-Policy</code>, <code>X-Content-Type-Options</code>.</li></ol>
<p>The bucket policy that lets only your distribution in:</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-site/*",
    "Condition": { "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::111122223333:distribution/E1ABCDEF2GHIJ"
    } }
  }]
}</pre>`,
        he: `<ol><li><strong>Bucket פרטי</strong>, עם Block Public Access דלוק. <em>לא</em> משתמשים ב-endpoint של "static website hosting" של S3: הוא HTTP בלבד ודורש bucket ציבורי.</li>
<li><strong>Distribution של CloudFront</strong> עם ה-bucket בתור origin דרך <strong>Origin Access Control ‏(OAC)</strong>, כך שרק CloudFront יכול לקרוא ממנו. ‏Default root object: ‏<code>index.html</code>.</li>
<li><strong>תעודת TLS</strong> מ-ACM, והיא חייבת להיות ב-<code>us-east-1</code> בשביל CloudFront, לא משנה באיזה region ה-bucket.</li>
<li><strong>DNS</strong>: רשומת alias ב-Route 53 (או CNAME אצל ספק ה-DNS שלך) ל-<code>d1234abcd.cloudfront.net</code>.</li>
<li><strong>Routing של SPA</strong>: ל-deep link כמו <code>/settings/billing</code> אין קובץ, ו-S3 עונה 403 כשלמי שקורא אין הרשאת list על ה-bucket. ממפים 403 ו-404 ל-<code>/index.html</code> עם סטטוס 200, או משכתבים את הנתיב ב-CloudFront Function.</li>
<li><strong>Security headers</strong> דרך response headers policy: ‏HSTS, ‏<code>Content-Security-Policy</code>, ‏<code>X-Content-Type-Options</code>.</li></ol>
<p>ה-bucket policy שנותנת להיכנס רק ל-distribution שלך:</p>
<pre>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-site/*",
    "Condition": { "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::111122223333:distribution/E1ABCDEF2GHIJ"
    } }
  }]
}</pre>`
      }
    },
    {
      h: { en: "Caching and deploys without broken pages", he: "Caching ו-deploy בלי דפים שבורים" },
      body: {
        en: `<p>The whole strategy fits in two rules:</p>
<ul><li><strong>Assets with a content hash in the name</strong> (<code>app.3f9a1c.js</code>, <code>logo.8b2e.svg</code>): <code>Cache-Control: public, max-age=31536000, immutable</code>. A new build gets a new name, so a year-long cache is safe.</li>
<li><strong>HTML entry points</strong> (<code>index.html</code>): <code>Cache-Control: no-cache</code>. The browser and CDN revalidate every time (a cheap 304), so users see the new release at once.</li></ul>
<pre># 1. upload new hashed assets first (old ones stay for open tabs)
aws s3 sync dist/ s3://my-site --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"
# 2. then switch the entry point
aws s3 cp dist/index.html s3://my-site/index.html --cache-control "no-cache"
# 3. purge only what changed
aws cloudfront create-invalidation --distribution-id E1ABCDEF2GHIJ --paths "/index.html"
# 4. days later: delete assets older than N releases (lifecycle rule or script)</pre>
<p>The order matters. Upload <code>index.html</code> first and for a few seconds it points to bundles that don't exist yet. Run <code>sync --delete</code> on every deploy and users with an open tab get <code>ChunkLoadError</code> when their old page lazy-loads a chunk you just deleted.</p>
<p>CloudFront invalidations: first 1,000 paths a month are free, then $0.005 per path, and a wildcard like <code>/*</code> counts as one path. With hashed assets you rarely need more than <code>/index.html</code>.</p>
<blockquote>⚠️ Production tip: anything in the bundle is public. Environment variables like <code>VITE_API_KEY</code> are baked into the JS at build time and anyone can read them in DevTools. Only public keys (a Stripe publishable key, a map key restricted by referrer) belong there.</blockquote>`,
        he: `<p>כל האסטרטגיה נכנסת בשני כללים:</p>
<ul><li><strong>Assets עם hash של התוכן בשם</strong> ‏(<code>app.3f9a1c.js</code>, ‏<code>logo.8b2e.svg</code>): ‏<code>Cache-Control: public, max-age=31536000, immutable</code>. ‏Build חדש מקבל שם חדש, אז cache של שנה בטוח.</li>
<li><strong>קבצי HTML שהם נקודת הכניסה</strong> ‏(<code>index.html</code>): ‏<code>Cache-Control: no-cache</code>. הדפדפן וה-CDN עושים revalidate בכל פעם (304 זול), אז משתמשים רואים מיד את ה-release החדש.</li></ul>
<pre># 1. upload new hashed assets first (old ones stay for open tabs)
aws s3 sync dist/ s3://my-site --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"
# 2. then switch the entry point
aws s3 cp dist/index.html s3://my-site/index.html --cache-control "no-cache"
# 3. purge only what changed
aws cloudfront create-invalidation --distribution-id E1ABCDEF2GHIJ --paths "/index.html"
# 4. days later: delete assets older than N releases (lifecycle rule or script)</pre>
<p>הסדר חשוב. אם מעלים קודם את <code>index.html</code>, לכמה שניות הוא מצביע על bundles שעוד לא קיימים. אם מריצים <code>sync --delete</code> בכל deploy, משתמש עם טאב פתוח יקבל <code>ChunkLoadError</code> כשהדף הישן שלו טוען chunk שמחקת הרגע.</p>
<p>Invalidations ב-CloudFront: 1,000 הנתיבים הראשונים בחודש בחינם, ואחר כך ‎$0.005 לנתיב. ‏Wildcard כמו <code>/*</code> נחשב נתיב אחד. עם assets שיש להם hash כמעט אף פעם לא צריך יותר מ-<code>/index.html</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: כל מה שב-bundle הוא ציבורי. משתני סביבה כמו <code>VITE_API_KEY</code> נאפים לתוך ה-JS בזמן ה-build, וכל אחד יכול לקרוא אותם ב-DevTools. רק מפתחות ציבוריים שייכים לשם (publishable key של Stripe, מפתח מפות שמוגבל לפי referrer).</blockquote>`
      }
    }
  ],
  diagram: "git push -> CI build (dist/) -> S3 bucket (private)\n                                     ^ OAC (only CloudFront)\nuser -> DNS -> CloudFront PoP (cache, TLS, WAF, headers) --miss--> S3\n             hit: served from the edge, ~5-20 ms",
  handsOn: [
    { cmd: "npm run build && npx serve dist", what: { en: "Build and serve the output folder locally: exactly what will be uploaded, no dev server tricks.", he: "בונים ומגישים מקומית את תיקיית הפלט: בדיוק מה שיעלה, בלי הטריקים של dev server." } },
    { cmd: "curl -sI https://example.com/ | grep -iE 'cache-control|x-cache|age|strict-transport'", what: { en: "Check the headers of the HTML: no-cache, HSTS, and whether the CDN served a Hit or a Miss.", he: "בודקים את ה-headers של ה-HTML: ‏no-cache, ‏HSTS, והאם ה-CDN הגיש Hit או Miss." } },
    { cmd: "curl -sI https://example.com/assets/app.3f9a1c.js | grep -i cache-control", what: { en: "Hashed assets should say max-age=31536000, immutable.", he: "ל-assets עם hash צריך להיות max-age=31536000, immutable." } },
    { cmd: "curl -s -o /dev/null -w '%{http_code}\\n' https://example.com/settings/billing", what: { en: "A SPA deep link must return 200 (index.html), not 403 or 404.", he: "Deep link של SPA חייב להחזיר 200 ‏(index.html), לא 403 או 404." } }
  ],
  mnemonic: {
    en: "Hash it and cache it forever; HTML never. Assets first, index last, delete later.",
    he: "יש hash? ‏cache לתמיד. ‏HTML? אף פעם. קודם assets, בסוף index, ומוחקים אחר כך."
  },
  pitfalls: [
    { en: "Making the bucket public to 'get the site working'. Use OAC so the CDN is the only door; a public bucket leaks drafts and skips your WAF.", he: "להפוך את ה-bucket לציבורי כדי ש\"האתר יעבוד\". משתמשים ב-OAC כך שה-CDN הוא הדלת היחידה. ‏Bucket ציבורי מדליף טיוטות ועוקף את ה-WAF." },
    { en: "Caching index.html for an hour. Users keep loading the old app after a deploy, and a bad release can't be rolled back quickly.", he: "לעשות cache ל-index.html לשעה. משתמשים ממשיכים לטעון את האפליקציה הישנה אחרי deploy, ואי אפשר לעשות rollback מהיר ל-release גרוע." },
    { en: "Requesting the ACM certificate in your app's region. CloudFront only accepts certificates from us-east-1.", he: "לבקש את תעודת ה-ACM ב-region של האפליקציה. ‏CloudFront מקבל רק תעודות מ-us-east-1." },
    { en: "Putting secrets in frontend env vars. Everything shipped to the browser is public.", he: "לשים סודות במשתני סביבה של ה-frontend. כל מה שנשלח לדפדפן הוא ציבורי." }
  ],
  interview: [
    { q: { en: "How would you host a React SPA on AWS?", he: "איך היית מארח SPA של React ב-AWS?" },
      a: { en: "Build to dist/, upload to a private S3 bucket, serve through CloudFront with Origin Access Control, an ACM certificate in us-east-1 and a Route 53 alias. Map 403/404 to /index.html with 200 for client-side routes, add a response headers policy for HSTS and CSP, and WAF if needed. Hashed assets get a one-year immutable cache, index.html gets no-cache; deploy assets first, then index.html, invalidate /index.html, and clean old assets later. All of it in Terraform, deployed from CI with an OIDC role.", he: "בונים ל-dist/, מעלים ל-bucket פרטי ב-S3, ומגישים דרך CloudFront עם Origin Access Control, תעודת ACM ב-us-east-1 ו-alias ב-Route 53. ממפים 403/404 ל-/index.html עם 200 בשביל routes בצד הלקוח, מוסיפים response headers policy ל-HSTS ול-CSP, ו-WAF אם צריך. ‏Assets עם hash מקבלים cache של שנה עם immutable, ו-index.html מקבל no-cache. ב-deploy מעלים קודם assets, אחר כך index.html, עושים invalidate ל-/index.html, ומנקים assets ישנים מאוחר יותר. הכול ב-Terraform, ו-deploy מ-CI עם OIDC role." } },
    { q: { en: "Users report blank pages right after every deploy. What's happening?", he: "משתמשים מדווחים על דפים ריקים מיד אחרי כל deploy. מה קורה?" },
      a: { en: "Most likely old index.html still in a cache points to bundles the deploy deleted (sync --delete), or the new index.html was uploaded before its bundles. The console shows ChunkLoadError or 404 on .js files. Fix: no-cache on HTML, upload assets before HTML, keep old assets for a few releases.", he: "כנראה index.html ישן שעדיין ב-cache מצביע על bundles שה-deploy מחק (sync --delete), או שה-index.html החדש עלה לפני ה-bundles שלו. ב-console רואים ChunkLoadError או 404 על קבצי .js. הפתרון: no-cache על HTML, להעלות assets לפני HTML, ולשמור assets ישנים לכמה releases." } }
  ],
  quiz: [
    { q: { en: "Why not use the S3 static website endpoint directly for a production site?", he: "למה לא להשתמש ישירות ב-endpoint של S3 static website לאתר בפרודקשן?" },
      options: [{ en: "It can't serve index.html", he: "הוא לא יודע להגיש index.html" }, { en: "It is HTTP-only and needs a public bucket", he: "הוא HTTP בלבד ודורש bucket ציבורי" }, { en: "It costs more than CloudFront", he: "הוא יקר יותר מ-CloudFront" }, { en: "It only works in us-east-1", he: "הוא עובד רק ב-us-east-1" }], answer: 1,
      explain: { en: "The website endpoint has no HTTPS and can't use OAC, so the bucket must be public. CloudFront in front of a private bucket fixes both.", he: "ל-website endpoint אין HTTPS והוא לא יכול להשתמש ב-OAC, אז ה-bucket חייב להיות ציבורי. ‏CloudFront מול bucket פרטי פותר את שני הדברים." } },
    { q: { en: "Which Cache-Control fits app.3f9a1c.js?", he: "איזה Cache-Control מתאים ל-app.3f9a1c.js?" },
      options: [{ en: "no-store", he: "no-store" }, { en: "no-cache", he: "no-cache" }, { en: "public, max-age=31536000, immutable", he: "public, max-age=31536000, immutable" }, { en: "private, max-age=60", he: "private, max-age=60" }], answer: 2,
      explain: { en: "The hash changes when the content changes, so the file at this URL never changes and can be cached for a year.", he: "ה-hash משתנה כשהתוכן משתנה, אז הקובץ בכתובת הזאת לעולם לא משתנה ואפשר לשמור אותו ב-cache לשנה." } },
    { q: { en: "A SPA deep link /orders/42 returns 403 from CloudFront + S3. Fix?", he: "Deep link של SPA ‏/orders/42 מחזיר 403 מ-CloudFront ועוד S3. מה הפתרון?" },
      options: [{ en: "Make the bucket public", he: "להפוך את ה-bucket לציבורי" }, { en: "Map 403/404 to /index.html with 200, or rewrite in a CloudFront Function", he: "למפות 403/404 ל-/index.html עם 200, או לשכתב ב-CloudFront Function" }, { en: "Create a file per route", he: "ליצור קובץ לכל route" }, { en: "Turn off caching", he: "לכבות caching" }], answer: 1,
      explain: { en: "There is no object for that key, so S3 returns 403 (no ListBucket). The SPA router needs index.html for every unknown path.", he: "אין object ל-key הזה, אז S3 מחזיר 403 (אין ListBucket). ה-router של ה-SPA צריך את index.html לכל נתיב לא מוכר." } },
    { q: { en: "Where must the ACM certificate for a CloudFront distribution live?", he: "איפה חייבת להיות תעודת ה-ACM של distribution ב-CloudFront?" },
      options: [{ en: "In the bucket's region", he: "ב-region של ה-bucket" }, { en: "us-east-1", he: "us-east-1" }, { en: "Any region", he: "בכל region" }, { en: "eu-west-1", he: "eu-west-1" }], answer: 1,
      explain: { en: "CloudFront is a global service whose control plane reads certificates from us-east-1 only.", he: "CloudFront הוא שירות גלובלי, וה-control plane שלו קורא תעודות רק מ-us-east-1." } }
  ],
  related: ["cdn-production", "net-proxies-cdn", "s3-deep", "storage-kinds-map", "aws-networking-edge"]
});

// ---------------------------------------------------------------------------
// 3. CDN in production
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "cdn-production",
  track: "networking",
  order: 62,
  icon: "🛰️",
  level: 3,
  minutes: 12,
  title: { en: "CDN in Production: Cache Keys, Purging, Shielding, Edge Compute", he: "CDN בפרודקשן: cache keys, ‏purge, ‏shielding ו-edge compute" },
  tldr: {
    en: "A CDN's value is measured in origin offload: every percent of hit ratio removes load and egress from your origin. You win it with a tight cache key, TTLs set by headers, versioned URLs instead of purges, a shield tier between the edges and the origin, and stale-if-error for outages. On top of caching, the edge terminates TLS near users, absorbs attacks, and can run small pieces of code.",
    he: "הערך של CDN נמדד ב-origin offload: כל אחוז של hit ratio מוריד עומס ו-egress מה-origin. משיגים אותו עם cache key הדוק, TTLs שנקבעים ב-headers, כתובות עם גרסה במקום purge, שכבת shield בין ה-edges ל-origin, ו-stale-if-error לזמן תקלה. מעבר ל-caching, ה-edge מסיים TLS קרוב למשתמשים, סופג התקפות, ויכול להריץ קטעי קוד קטנים."
  },
  analogy: {
    en: "A CDN is a chain of neighborhood kiosks stocked from one central bakery. Each kiosk keeps the popular items on the shelf (cache hits), sends a runner to a regional depot when it runs out (the shield), and only the depot ever drives to the bakery (the origin). If you label bread by day of baking (versioned URLs), you never have to call every kiosk to throw out old loaves (purge).",
    he: "CDN הוא רשת של קיוסקים שכונתיים שמקבלים סחורה ממאפייה מרכזית אחת. כל קיוסק מחזיק על המדף את הפריטים הפופולריים (cache hits), שולח שליח למחסן אזורי כשנגמר משהו (ה-shield), ורק המחסן נוסע למאפייה (ה-origin). אם מסמנים כל לחם לפי יום האפייה (כתובות עם גרסה), אף פעם לא צריך להתקשר לכל הקיוסקים כדי שיזרקו לחם ישן (purge)."
  },
  sections: [
    {
      h: { en: "The request path and the hit-ratio math", he: "המסלול של request והחשבון של hit ratio" },
      body: {
        en: `<p>User → DNS (or anycast) picks the nearest PoP → edge cache → on a miss, a regional / shield cache → on a miss, your origin (S3, a load balancer, an API).</p>
<p>Hit ratio decides how much the origin feels. At 10,000 requests per second:</p>
<table><tr><th>Hit ratio</th><th>Origin requests/s</th></tr>
<tr><td>90%</td><td>1,000</td></tr><tr><td>95%</td><td>500</td></tr><tr><td>99%</td><td>100</td></tr></table>
<p>Going from 95% to 99% cuts origin load by 5x. That's why CDN tuning is about the last few percent. Watch two numbers: <strong>request hit ratio</strong> and <strong>byte hit ratio (offload)</strong>. A site can hit 98% of requests and still pull most bytes from origin if the big video files miss.</p>
<p>Even with no caching at all, the edge helps. TCP + TLS 1.3 to a far origin costs 2 round trips before the request is sent. From Tel Aviv to Virginia (~130 ms RTT) that's ~260 ms of handshakes. With a PoP 5 ms away, the handshakes cost ~10 ms and the edge reuses a warm connection to the origin.</p>`,
        he: `<p>משתמש ← DNS (או anycast) בוחר את ה-PoP הקרוב ← edge cache ← ב-miss, cache אזורי / shield ← ב-miss, ה-origin שלך (S3, ‏load balancer, ‏API).</p>
<p>ה-hit ratio קובע כמה ה-origin מרגיש. ב-10,000 requests לשנייה:</p>
<table><tr><th>Hit ratio</th><th>Requests לשנייה ב-origin</th></tr>
<tr><td>90%</td><td>1,000</td></tr><tr><td>95%</td><td>500</td></tr><tr><td>99%</td><td>100</td></tr></table>
<p>מעבר מ-95% ל-99% מוריד את העומס על ה-origin פי 5. בגלל זה כוונון CDN עוסק באחוזים האחרונים. עוקבים אחרי שני מספרים: <strong>request hit ratio</strong> ו-<strong>byte hit ratio ‏(offload)</strong>. אתר יכול להגיע ל-98% hits ב-requests ועדיין למשוך את רוב ה-bytes מה-origin, אם קבצי הווידאו הגדולים מפספסים.</p>
<p>גם בלי caching בכלל, ה-edge עוזר. ‏TCP ועוד TLS 1.3 ל-origin רחוק עולים 2 round trips לפני שה-request בכלל נשלח. מתל אביב לווירג'יניה (RTT של בערך 130 ms) זה בערך 260 ms של handshakes. עם PoP במרחק 5 ms, ה-handshakes עולים בערך 10 ms, וה-edge משתמש שוב בחיבור חם ל-origin.</p>`
      }
    },
    {
      h: { en: "Cache key and TTLs: where hit ratio is won or lost", he: "Cache key ו-TTLs: שם מרוויחים או מפסידים hit ratio" },
      body: {
        en: `<p>The <strong>cache key</strong> is what makes two requests "the same". By default it's host + path (+ query string on some CDNs). Every extra part splits the cache:</p>
<ul><li><strong>Query strings</strong>: <code>?utm_source=newsletter</code> creates a new copy per campaign. Whitelist only the parameters that change the response (<code>?page=</code>, <code>?w=</code>).</li>
<li><strong>Cookies</strong>: including all cookies in the key gives every user a private cache, which means a ~0% hit ratio.</li>
<li><strong>Headers</strong>: <code>Vary: User-Agent</code> has thousands of values. Normalize to a small set (device type) at the edge, or don't vary.</li></ul>
<p><strong>TTL</strong>: the origin sends <code>Cache-Control</code>; <code>s-maxage</code> applies only to shared caches like the CDN, <code>max-age</code> to browsers too. The CDN can clamp it with min / max / default TTL settings.</p>
<pre>Cache-Control: public, max-age=60, s-maxage=600, stale-while-revalidate=30, stale-if-error=86400</pre>
<ul><li><code>stale-while-revalidate=30</code>: for 30 s after expiry, serve the old copy instantly and refresh in the background. Users never wait for the origin.</li>
<li><code>stale-if-error=86400</code>: if the origin returns 5xx or times out, keep serving the old copy for a day. This turns an origin outage into a non-event for cacheable pages.</li></ul>
<p>Also cache errors briefly: a 404 cached for 10-60 s stops a bot from hammering the origin with the same missing URL.</p>`,
        he: `<p>ה-<strong>cache key</strong> הוא מה שהופך שני requests ל"אותו דבר". כברירת מחדל זה host ועוד path (ובחלק מה-CDNs גם ה-query string). כל חלק נוסף מפצל את ה-cache:</p>
<ul><li><strong>Query strings</strong>: ‏<code>?utm_source=newsletter</code> יוצר עותק חדש לכל קמפיין. מכניסים ל-key רק את הפרמטרים שמשנים את התשובה (<code>?page=</code>, ‏<code>?w=</code>).</li>
<li><strong>Cookies</strong>: אם כל ה-cookies נכנסים ל-key, לכל משתמש יש cache פרטי, כלומר hit ratio של בערך 0%.</li>
<li><strong>Headers</strong>: ל-<code>Vary: User-Agent</code> יש אלפי ערכים. מנרמלים ב-edge לסט קטן (סוג מכשיר), או לא עושים vary בכלל.</li></ul>
<p><strong>TTL</strong>: ה-origin שולח <code>Cache-Control</code>. ‏<code>s-maxage</code> חל רק על caches משותפים כמו ה-CDN, ו-<code>max-age</code> חל גם על דפדפנים. ה-CDN יכול להגביל את זה עם הגדרות min / max / default TTL.</p>
<pre>Cache-Control: public, max-age=60, s-maxage=600, stale-while-revalidate=30, stale-if-error=86400</pre>
<ul><li><code>stale-while-revalidate=30</code>: במשך 30 שניות אחרי שהתוקף פג, מגישים מיד את העותק הישן ומרעננים ברקע. משתמשים אף פעם לא מחכים ל-origin.</li>
<li><code>stale-if-error=86400</code>: אם ה-origin מחזיר 5xx או עושה timeout, ממשיכים להגיש את העותק הישן יום שלם. ככה נפילה של ה-origin הופכת ללא-אירוע בדפים שאפשר לשמור ב-cache.</li></ul>
<p>שומרים ב-cache גם שגיאות, לזמן קצר: 404 שנשמר ל-10 עד 60 שניות עוצר bot שמפציץ את ה-origin עם אותה כתובת חסרה.</p>`
      }
    },
    {
      h: { en: "Purging, versioning and the shield tier", he: "Purge, ‏versioning ושכבת ה-shield" },
      body: {
        en: `<ul><li><strong>Version, don't purge.</strong> <code>/img/hero.v42.webp</code> or <code>?v=42</code> on static assets means a deploy needs no purge at all.</li>
<li><strong>Purge by tag</strong> when content is dynamic: the origin labels responses (<code>Surrogate-Key: product-123 category-9</code> on Fastly, <code>Cache-Tag</code> on Cloudflare) and you purge every page that shows product 123 in one call when its price changes. Purge speed differs a lot: Fastly is known for ~150 ms global purges, Cloudflare takes seconds, CloudFront invalidations usually finish within a minute or two.</li>
<li><strong>Never "purge everything" during an incident</strong> unless you must: every PoP misses at once and the origin takes a thundering herd at exactly the wrong time.</li></ul>
<p><strong>Shielding / tiered cache</strong>: without it, each of 300+ PoPs fetches the same object from the origin on its own miss. With a shield (CloudFront Origin Shield, Cloudflare Tiered Cache, Fastly shielding, Akamai tiered distribution), edges ask one regional cache first, and only it talks to the origin. Pick the shield region closest to the origin. It also collapses concurrent misses for the same object into one origin request (request collapsing).</p>`,
        he: `<ul><li><strong>עושים גרסה, לא purge.</strong> ‏<code>/img/hero.v42.webp</code> או <code>?v=42</code> על assets סטטיים אומר ש-deploy לא צריך purge בכלל.</li>
<li><strong>Purge לפי tag</strong> כשהתוכן דינמי: ה-origin מסמן תשובות (<code>Surrogate-Key: product-123 category-9</code> ב-Fastly, ‏<code>Cache-Tag</code> ב-Cloudflare), וכשהמחיר של מוצר 123 משתנה עושים purge לכל הדפים שמציגים אותו בקריאה אחת. מהירות ה-purge שונה מאוד: Fastly ידוע ב-purge גלובלי של בערך 150 ms, ב-Cloudflare זה לוקח שניות, ו-invalidations ב-CloudFront מסתיימים בדרך כלל תוך דקה או שתיים.</li>
<li><strong>אף פעם לא עושים "purge everything" באמצע תקלה</strong>, אלא אם אין ברירה: כל ה-PoPs מפספסים בבת אחת, וה-origin חוטף thundering herd בדיוק ברגע הכי גרוע.</li></ul>
<p><strong>Shielding / tiered cache</strong>: בלי זה, כל אחד מ-300 ומשהו PoPs מביא את אותו object מה-origin ב-miss שלו. עם shield ‏(CloudFront Origin Shield, ‏Cloudflare Tiered Cache, ‏Fastly shielding, ‏Akamai tiered distribution), ה-edges שואלים קודם cache אזורי אחד, ורק הוא מדבר עם ה-origin. בוחרים את ה-region של ה-shield הכי קרוב ל-origin. זה גם מאחד misses מקבילים על אותו object ל-request אחד ל-origin ‏(request collapsing).</p>`
      }
    },
    {
      h: { en: "Beyond caching: private content, security and edge code", he: "מעבר ל-caching: תוכן פרטי, אבטחה וקוד ב-edge" },
      body: {
        en: `<ul><li><strong>Private content</strong>: signed URLs or signed cookies (CloudFront key groups, Cloudflare tokens, Akamai tokens) let the CDN serve paid videos or invoices only to whoever holds a valid, expiring signature. The origin stays private.</li>
<li><strong>Security at the edge</strong>: WAF rules, rate limits, bot scoring and DDoS absorption happen before traffic reaches you. Lock the origin so only the CDN can reach it (OAC for S3, a secret header or provider IP ranges for load balancers).</li>
<li><strong>Performance features</strong>: HTTP/3, Brotli compression, image resizing and WebP/AVIF conversion on the fly.</li>
<li><strong>Edge compute</strong>, from lightest to heaviest:
<table><tr><th>Runtime</th><th>Good for</th><th>Limits</th></tr>
<tr><td>CloudFront Functions</td><td>Header rewrites, redirects, URL normalization, simple auth checks</td><td>JavaScript, viewer events only, sub-millisecond budget, no network calls</td></tr>
<tr><td>Cloudflare Workers / Fastly Compute</td><td>A/B routing, auth, personalization, small APIs</td><td>V8 isolates or Wasm, near-zero cold start, tight CPU and memory limits</td></tr>
<tr><td>Lambda@Edge</td><td>Origin-side logic, calls to other services</td><td>Node.js or Python, created in us-east-1, up to 5 s on viewer events and 30 s on origin events, real cold starts</td></tr></table></li></ul>`,
        he: `<ul><li><strong>תוכן פרטי</strong>: signed URLs או signed cookies ‏(key groups ב-CloudFront, טוקנים ב-Cloudflare וב-Akamai) מאפשרים ל-CDN להגיש סרטונים בתשלום או חשבוניות רק למי שמחזיק חתימה תקפה עם תפוגה. ה-origin נשאר פרטי.</li>
<li><strong>אבטחה ב-edge</strong>: חוקי WAF, ‏rate limits, ‏bot scoring וספיגת DDoS קורים לפני שהתעבורה מגיעה אליך. נועלים את ה-origin כך שרק ה-CDN יכול להגיע אליו (OAC ל-S3, ‏header סודי או טווחי ה-IP של הספק ל-load balancers).</li>
<li><strong>ביצועים</strong>: HTTP/3, דחיסת Brotli, שינוי גודל תמונות והמרה ל-WebP/AVIF בזמן אמת.</li>
<li><strong>Edge compute</strong>, מהקל לכבד:
<table><tr><th>Runtime</th><th>מתאים ל</th><th>מגבלות</th></tr>
<tr><td>CloudFront Functions</td><td>שכתוב headers, ‏redirects, נרמול URL, בדיקות auth פשוטות</td><td>JavaScript, רק viewer events, תקציב של פחות ממילישנייה, בלי קריאות רשת</td></tr>
<tr><td>Cloudflare Workers / Fastly Compute</td><td>ניתוב A/B, ‏auth, התאמה אישית, APIs קטנים</td><td>V8 isolates או Wasm, ‏cold start כמעט אפסי, מגבלות הדוקות של CPU וזיכרון</td></tr>
<tr><td>Lambda@Edge</td><td>לוגיקה בצד ה-origin, קריאות לשירותים אחרים</td><td>Node.js או Python, נוצר ב-us-east-1, עד 5 שניות ב-viewer events ו-30 שניות ב-origin events, ‏cold starts אמיתיים</td></tr></table></li></ul>`
      }
    },
    {
      h: { en: "Providers, cost and what to watch", he: "ספקים, עלות ועל מה לעקוב" },
      body: {
        en: `<table><tr><th>CDN</th><th>Known for</th></tr>
<tr><td>CloudFront</td><td>Deep AWS integration (OAC, WAF, Shield, ACM); origin fetch from AWS origins is free; ~$0.085/GB for the first 10 TB in North America and Europe, 1 TB/month free tier</td></tr>
<tr><td>Cloudflare</td><td>Huge anycast network, generous free plan, no per-GB bandwidth fee on most plans, Workers and R2</td></tr>
<tr><td>Fastly</td><td>Instant purge, purge by cache tag, programmable edge (VCL, Compute)</td></tr>
<tr><td>Akamai</td><td>The largest and oldest; enterprise media and security</td></tr>
<tr><td>Azure Front Door, Google Cloud CDN / Media CDN</td><td>The native choice inside those clouds, with global L7 load balancing</td></tr></table>
<p>Big sites run <strong>multi-CDN</strong> behind DNS steering for resilience and price leverage, at the cost of keeping configs in sync.</p>
<p>How to debug a response:</p>
<pre>$ curl -sI https://www.example.com/img/hero.webp
x-cache: Hit from cloudfront          # Miss / RefreshHit / Error
x-amz-cf-pop: TLV50-C1                # the PoP that answered (Tel Aviv)
age: 1834                             # seconds the copy has been in cache
cache-control: public, max-age=86400

# Cloudflare: cf-cache-status: HIT | MISS | EXPIRED | BYPASS | DYNAMIC</pre>
<p>Dashboards: hit ratio and byte offload per path prefix, origin latency, edge 4xx/5xx vs origin 4xx/5xx (an edge 5xx with a healthy origin points at CDN config or the origin lock).</p>`,
        he: `<table><tr><th>CDN</th><th>במה הוא ידוע</th></tr>
<tr><td>CloudFront</td><td>אינטגרציה עמוקה עם AWS ‏(OAC, ‏WAF, ‏Shield, ‏ACM). משיכה מ-origins ב-AWS בחינם, בערך ‎$0.085 ל-GB ב-10 ה-TB הראשונים בצפון אמריקה ובאירופה, ו-free tier של 1 TB בחודש</td></tr>
<tr><td>Cloudflare</td><td>רשת anycast ענקית, תוכנית חינם נדיבה, ברוב התוכניות אין תשלום לפי GB, ‏Workers ו-R2</td></tr>
<tr><td>Fastly</td><td>Purge מיידי, ‏purge לפי tag, ‏edge שאפשר לתכנת (VCL, ‏Compute)</td></tr>
<tr><td>Akamai</td><td>הגדול והוותיק ביותר; מדיה ואבטחה לארגונים</td></tr>
<tr><td>Azure Front Door, Google Cloud CDN / Media CDN</td><td>הבחירה הטבעית בתוך העננים האלה, עם load balancing גלובלי ב-L7</td></tr></table>
<p>אתרים גדולים מריצים <strong>multi-CDN</strong> מאחורי ניתוב ב-DNS, בשביל עמידות וכוח מיקוח על מחיר, במחיר של סנכרון הגדרות.</p>
<p>איך עושים debug לתשובה:</p>
<pre>$ curl -sI https://www.example.com/img/hero.webp
x-cache: Hit from cloudfront          # Miss / RefreshHit / Error
x-amz-cf-pop: TLV50-C1                # the PoP that answered (Tel Aviv)
age: 1834                             # seconds the copy has been in cache
cache-control: public, max-age=86400

# Cloudflare: cf-cache-status: HIT | MISS | EXPIRED | BYPASS | DYNAMIC</pre>
<p>Dashboards: ‏hit ratio ו-byte offload לכל prefix של נתיב, ‏latency של ה-origin, ו-4xx/5xx ב-edge מול 4xx/5xx ב-origin (5xx ב-edge כשה-origin בריא מצביע על הגדרות ה-CDN או על נעילת ה-origin).</p>`
      }
    }
  ],
  diagram: "user (Haifa) --5 ms--> PoP TLV  [edge cache]\n                           | miss\n                           v\n                  shield (eu-central-1)  [regional cache, collapses misses]\n                           | miss\n                           v\n                  origin (S3 / ALB in us-east-1, locked to the CDN)",
  handsOn: [
    { cmd: "curl -sI https://www.example.com/ | grep -iE 'x-cache|cf-cache-status|age|cache-control|x-amz-cf-pop'", what: { en: "Hit or miss, which PoP, how old the copy is.", he: "Hit או miss, איזה PoP, וכמה העותק ישן." } },
    { cmd: "for i in 1 2 3; do curl -s -o /dev/null -w '%{time_starttransfer}s\\n' https://www.example.com/app.js; done", what: { en: "Time to first byte: the first call may miss, the next ones should be much faster.", he: "זמן עד ה-byte הראשון: הקריאה הראשונה אולי miss, והבאות אמורות להיות הרבה יותר מהירות." } },
    { cmd: "aws cloudfront create-invalidation --distribution-id E1ABCDEF2GHIJ --paths \"/index.html\" \"/api/config.json\"", what: { en: "Purge specific paths (the first 1,000 paths a month are free).", he: "Purge לנתיבים ספציפיים (1,000 הנתיבים הראשונים בחודש בחינם)." } },
    { cmd: "curl -sI 'https://www.example.com/?utm_source=a' | grep -i x-cache; curl -sI 'https://www.example.com/?utm_source=b' | grep -i x-cache", what: { en: "If the second one is a Miss, tracking parameters are fragmenting your cache key.", he: "אם השני הוא Miss, פרמטרי tracking מפצלים לך את ה-cache key." } }
  ],
  mnemonic: {
    en: "KEY tight, TTL right, VERSION not purge, SHIELD the origin, STALE when it breaks.",
    he: "Key הדוק, ‏TTL נכון, גרסה במקום purge, ‏shield מול ה-origin, ‏stale כשנשבר."
  },
  pitfalls: [
    { en: "Caching a response that carries Set-Cookie or user data under a shared key. One user's page is served to everyone. Mark personal responses private or no-store, and strip cookies from the key for public paths.", he: "לשמור ב-cache תשובה עם Set-Cookie או מידע של משתמש תחת key משותף. הדף של משתמש אחד מוגש לכולם. מסמנים תשובות אישיות כ-private או no-store, ומוציאים cookies מה-key בנתיבים ציבוריים." },
    { en: "Forwarding all query strings and cookies 'to be safe'. The hit ratio collapses and the CDN becomes an expensive proxy.", he: "להעביר את כל ה-query strings וה-cookies \"ליתר ביטחון\". ה-hit ratio קורס וה-CDN הופך ל-proxy יקר." },
    { en: "Leaving the origin open to the internet. Attackers skip the CDN, its WAF and its cache, and hit you directly.", he: "להשאיר את ה-origin פתוח לאינטרנט. תוקפים עוקפים את ה-CDN, את ה-WAF ואת ה-cache שלו, ופוגעים בך ישירות." },
    { en: "Caching 5xx responses with the normal TTL. A 10-second origin blip becomes a 10-minute outage.", he: "לשמור ב-cache תשובות 5xx עם ה-TTL הרגיל. תקלה של 10 שניות ב-origin הופכת להשבתה של 10 דקות." }
  ],
  interview: [
    { q: { en: "Your CDN hit ratio is 60% on a mostly static site. How do you improve it?", he: "ה-hit ratio של ה-CDN הוא 60% באתר שרובו סטטי. איך משפרים?" },
      a: { en: "Find what splits the cache key: query strings (utm, fbclid), cookies or Vary headers; whitelist only meaningful parameters. Check Cache-Control from the origin (no-cache or short max-age on assets), add hashed filenames with a long immutable TTL, enable a shield tier so hundreds of PoPs don't each miss to the origin, add stale-while-revalidate, and cache 404s briefly. Then measure byte offload, not just request hit ratio.", he: "מוצאים מה מפצל את ה-cache key: ‏query strings ‏(utm, ‏fbclid), ‏cookies או Vary headers, ומשאירים רק פרמטרים משמעותיים. בודקים את ה-Cache-Control שה-origin שולח (no-cache או max-age קצר על assets), מוסיפים שמות קבצים עם hash ו-TTL ארוך עם immutable, מפעילים שכבת shield כדי שמאות PoPs לא יפספסו כל אחד בנפרד אל ה-origin, מוסיפים stale-while-revalidate ושומרים 404 ב-cache לזמן קצר. אחר כך מודדים byte offload, לא רק request hit ratio." } },
    { q: { en: "How does a CDN help an API that can't be cached at all?", he: "איך CDN עוזר ל-API שאי אפשר לשמור ב-cache בכלל?" },
      a: { en: "TLS and TCP terminate at a nearby PoP, which saves round trips; the edge keeps warm, multiplexed connections to the origin over the provider's backbone; WAF, rate limiting and DDoS absorption happen at the edge; and HTTP/3 helps on lossy mobile networks. Some responses (config, feature flags, public lists) can still be micro-cached for 1-5 seconds.", he: "TLS ו-TCP מסתיימים ב-PoP קרוב, וזה חוסך round trips. ה-edge מחזיק חיבורים חמים עם multiplexing ל-origin על ה-backbone של הספק. ‏WAF, ‏rate limiting וספיגת DDoS קורים ב-edge. ‏HTTP/3 עוזר ברשתות סלולריות עם איבוד packets. וחלק מהתשובות (config, ‏feature flags, רשימות ציבוריות) עדיין אפשר לשמור ב-micro-cache לשנייה עד חמש." } }
  ],
  quiz: [
    { q: { en: "At 20,000 req/s, raising the hit ratio from 95% to 99% changes origin traffic from…", he: "ב-20,000 requests לשנייה, העלאת ה-hit ratio מ-95% ל-99% משנה את התעבורה ל-origin מ…" },
      options: [{ en: "1,000 to 200 req/s", he: "1,000 ל-200 בשנייה" }, { en: "19,000 to 19,800 req/s", he: "19,000 ל-19,800 בשנייה" }, { en: "500 to 100 req/s", he: "500 ל-100 בשנייה" }, { en: "It barely changes", he: "כמעט לא משתנה" }], answer: 0,
      explain: { en: "Misses go to origin: 5% of 20,000 = 1,000; 1% = 200. A 5x reduction.", he: "Misses הולכים ל-origin: ‏5% מ-20,000 זה 1,000, ו-1% זה 200. ירידה פי 5." } },
    { q: { en: "What does stale-if-error=86400 do?", he: "מה עושה stale-if-error=86400?" },
      options: [{ en: "Caches errors for a day", he: "שומר שגיאות ב-cache ליום" }, { en: "Serves the expired copy for up to a day when the origin fails", he: "מגיש את העותק שפג תוקפו עד יום כשה-origin נכשל" }, { en: "Purges the cache after an error", he: "עושה purge ל-cache אחרי שגיאה" }, { en: "Retries the origin 86400 times", he: "מנסה את ה-origin שוב 86400 פעמים" }], answer: 1,
      explain: { en: "It lets caches keep serving stale content during origin 5xx or timeouts.", he: "הוא מאפשר ל-caches להמשיך להגיש תוכן ישן בזמן 5xx או timeouts של ה-origin." } },
    { q: { en: "What is the main job of an origin shield?", he: "מה התפקיד העיקרי של origin shield?" },
      options: [{ en: "Encrypt traffic to the origin", he: "להצפין תעבורה ל-origin" }, { en: "Block DDoS", he: "לחסום DDoS" }, { en: "Make all PoPs fetch through one regional cache, so the origin sees far fewer misses", he: "לגרום לכל ה-PoPs למשוך דרך cache אזורי אחד, כך שה-origin רואה הרבה פחות misses" }, { en: "Store logs", he: "לשמור לוגים" }], answer: 2,
      explain: { en: "The shield is an extra cache layer that consolidates misses and collapses concurrent requests for the same object.", he: "ה-shield הוא שכבת cache נוספת שמאחדת misses ומכווצת requests מקבילים לאותו object." } },
    { q: { en: "Best way to ship a new version of app.js through a CDN?", he: "מה הדרך הטובה לשחרר גרסה חדשה של app.js דרך CDN?" },
      options: [{ en: "Purge /* after every deploy", he: "Purge ל-/* אחרי כל deploy" }, { en: "Set TTL to 0", he: "לקבוע TTL של 0" }, { en: "Give it a new hashed filename and reference it from no-cache HTML", he: "לתת לו שם קובץ חדש עם hash ולהפנות אליו מ-HTML עם no-cache" }, { en: "Ask users to hard refresh", he: "לבקש ממשתמשים לעשות hard refresh" }], answer: 2,
      explain: { en: "Versioned URLs make purges unnecessary and old pages keep working with old files.", he: "כתובות עם גרסה מייתרות purge, ודפים ישנים ממשיכים לעבוד עם הקבצים הישנים." } }
  ],
  related: ["net-proxies-cdn", "net-ddos-edge", "aws-networking-edge", "static-site-hosting", "arch-wasm-edge"]
});

// ---------------------------------------------------------------------------
// 4. FaaS vs serverless containers
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "faas-vs-container-serverless",
  track: "cloud",
  order: 98,
  icon: "⚖️",
  level: 2,
  minutes: 12,
  title: { en: "FaaS vs Serverless Containers: Lambda vs Cloud Run, Container Apps and Fargate", he: "FaaS מול קונטיינרים serverless: ‏Lambda מול Cloud Run, ‏Container Apps ו-Fargate" },
  tldr: {
    en: "Both hide the servers. FaaS (Lambda, Azure Functions, Cloud Run functions) runs a handler per event, one request per instance, with strict limits and the richest event triggers. Serverless containers (Cloud Run, Azure Container Apps) run any image that listens on a port, many requests per instance, longer requests and portable code. Fargate is different again: serverless nodes for ECS/EKS, always-on tasks with no scale to zero. Pick FaaS for event glue and spiky work, containers for web apps and steady I/O-heavy traffic.",
    he: "שניהם מסתירים את השרתים. ‏FaaS ‏(Lambda, ‏Azure Functions, ‏Cloud Run functions) מריץ handler לכל event, request אחד לכל instance, עם מגבלות קשוחות וה-triggers הכי עשירים. קונטיינרים serverless ‏(Cloud Run, ‏Azure Container Apps) מריצים כל image שמאזין על port, הרבה requests לכל instance, requests ארוכים יותר וקוד נייד. ‏Fargate הוא עוד משהו: nodes בלי שרתים ל-ECS/EKS, ‏tasks שרצים תמיד, בלי scale to zero. בוחרים FaaS ל-glue של events ולעבודה קופצנית, וקונטיינרים לאפליקציות web ולתעבורה יציבה עם הרבה I/O."
  },
  analogy: {
    en: "FaaS is a taxi: you pay per ride, a new car (instance) per passenger group, and there are rules about luggage size and trip length. Serverless containers are a minibus that leaves when the first passenger arrives and takes up to 80 people on the same ride: you pay while it drives, not per passenger. Fargate is a leased car with a driver: you never service it, but it's yours, and you pay for every hour it's parked.",
    he: "FaaS הוא מונית: משלמים לכל נסיעה, רכב חדש (instance) לכל קבוצת נוסעים, ויש חוקים על גודל המזוודה ואורך הנסיעה. קונטיינרים serverless הם מיניבוס שיוצא כשהנוסע הראשון מגיע ולוקח עד 80 איש באותה נסיעה: משלמים בזמן שהוא נוסע, לא לכל נוסע. ‏Fargate הוא רכב בליסינג עם נהג: אף פעם לא עושים לו טיפול, אבל הוא שלך ומשלמים על כל שעה שהוא חונה."
  },
  sections: [
    {
      h: { en: "Two contracts with the platform", he: "שני חוזים שונים עם הפלטפורמה" },
      body: {
        en: `<p><strong>FaaS</strong>: you give a function. The platform owns the runtime, the HTTP server, the event plumbing and scaling.</p>
<pre>// Lambda: you write the handler, AWS owns everything around it
export const handler = async (event) =&gt; {
  const order = JSON.parse(event.body);
  await saveOrder(order);
  return { statusCode: 201, body: JSON.stringify({ id: order.id }) };
};</pre>
<p><strong>Serverless containers</strong>: you give an OCI image that listens on <code>$PORT</code> (or a job that runs to completion). Inside it's a normal web server: Express, FastAPI, Spring, Go net/http. The platform owns the machines, TLS, routing and scaling.</p>
<pre>gcloud run deploy orders --image=europe-docker.pkg.dev/acme/apps/orders:1.4.2 \
  --region=europe-west1 --concurrency=80 --min-instances=1 --max-instances=50 \
  --cpu=1 --memory=512Mi</pre>
<p><strong>Fargate</strong> is the third, often confused, option: it removes the <em>nodes</em> under ECS or EKS, but you still run a service with a desired count of tasks that run (and bill) 24/7. It's serverless infrastructure, not a scale-to-zero app platform.</p>
<p>The line keeps blurring: Lambda accepts container images up to 10 GB (still the FaaS model inside), Cloud Run runs functions from source, and Azure Functions can run on Container Apps. Judge by the <em>execution model</em>, not the packaging.</p>`,
        he: `<p><strong>FaaS</strong>: נותנים פונקציה. הפלטפורמה אחראית על ה-runtime, שרת ה-HTTP, הצנרת של ה-events וה-scaling.</p>
<pre>// Lambda: you write the handler, AWS owns everything around it
export const handler = async (event) =&gt; {
  const order = JSON.parse(event.body);
  await saveOrder(order);
  return { statusCode: 201, body: JSON.stringify({ id: order.id }) };
};</pre>
<p><strong>קונטיינרים serverless</strong>: נותנים OCI image שמאזין על <code>$PORT</code> (או job שרץ עד הסוף). בפנים זה שרת web רגיל: Express, ‏FastAPI, ‏Spring, ‏net/http של Go. הפלטפורמה אחראית על המכונות, TLS, ניתוב ו-scaling.</p>
<pre>gcloud run deploy orders --image=europe-docker.pkg.dev/acme/apps/orders:1.4.2 \
  --region=europe-west1 --concurrency=80 --min-instances=1 --max-instances=50 \
  --cpu=1 --memory=512Mi</pre>
<p><strong>Fargate</strong> היא האפשרות השלישית, וקל להתבלבל בה: היא מעלימה את ה-<em>nodes</em> מתחת ל-ECS או EKS, אבל עדיין מריצים service עם desired count של tasks שרצים (ומשלמים עליהם) 24/7. זו תשתית serverless, לא פלטפורמת אפליקציות עם scale to zero.</p>
<p>הקו ממשיך להיטשטש: Lambda מקבל container images עד 10 GB (ובפנים זה עדיין מודל FaaS), ‏Cloud Run מריץ פונקציות מקוד מקור, ו-Azure Functions יכול לרוץ על Container Apps. שופטים לפי <em>מודל הריצה</em>, לא לפי האריזה.</p>`
      }
    },
    {
      h: { en: "Side by side", he: "אחד ליד השני" },
      body: {
        en: `<table><tr><th></th><th>FaaS (Lambda)</th><th>Serverless containers (Cloud Run, Container Apps)</th><th>Fargate (ECS/EKS)</th></tr>
<tr><td>You ship</td><td>Handler code (zip up to 250 MB unzipped, or an image up to 10 GB)</td><td>Any container image listening on a port</td><td>Container image + task definition / Pod spec</td></tr>
<tr><td>Requests per instance</td><td><strong>1</strong></td><td>Many (Cloud Run default 80, up to 1,000)</td><td>Whatever your server handles</td></tr>
<tr><td>Max request time</td><td>15 min</td><td>Cloud Run up to 60 min; jobs much longer</td><td>Unlimited</td></tr>
<tr><td>Size</td><td>Up to 10 GB memory, 6 vCPU</td><td>Cloud Run up to 32 GiB and 8 vCPU, GPUs available</td><td>Up to 16 vCPU, 120 GB</td></tr>
<tr><td>Scale to zero</td><td>Yes</td><td>Yes (or keep min instances)</td><td>No, you set the task count</td></tr>
<tr><td>Scaling signal</td><td>Each event</td><td>Concurrent requests, CPU; on Container Apps any KEDA scaler (queue length…)</td><td>Your autoscaling policy (CPU, ALB requests), in minutes</td></tr>
<tr><td>Triggers</td><td>Richest: S3, SQS, Kinesis, DynamoDB Streams, EventBridge, schedules, HTTP</td><td>HTTP and gRPC first; events through Eventarc / Pub/Sub push / Dapr / KEDA</td><td>Long-running services, queue workers</td></tr>
<tr><td>Billing</td><td>Per request + GB-seconds per invocation</td><td>vCPU-seconds + GiB-seconds while serving (or per instance), + per request</td><td>vCPU-hours + GB-hours while the task runs</td></tr>
<tr><td>Portability</td><td>Low: event shapes and handler are provider-specific</td><td>High: the same image runs on Kubernetes, Knative or a laptop</td><td>High</td></tr></table>`,
        he: `<table><tr><th></th><th>FaaS ‏(Lambda)</th><th>קונטיינרים serverless ‏(Cloud Run, ‏Container Apps)</th><th>Fargate ‏(ECS/EKS)</th></tr>
<tr><td>מה מעלים</td><td>קוד handler ‏(zip עד 250 MB פרוס, או image עד 10 GB)</td><td>כל container image שמאזין על port</td><td>Container image ועוד task definition / Pod spec</td></tr>
<tr><td>Requests לכל instance</td><td><strong>1</strong></td><td>הרבה (ב-Cloud Run ברירת מחדל 80, עד 1,000)</td><td>כמה שהשרת שלך מחזיק</td></tr>
<tr><td>זמן מקסימלי ל-request</td><td>15 דקות</td><td>ב-Cloud Run עד 60 דקות, ו-jobs הרבה יותר</td><td>בלי הגבלה</td></tr>
<tr><td>גודל</td><td>עד 10 GB זיכרון ו-6 vCPU</td><td>ב-Cloud Run עד 32 GiB ו-8 vCPU, ויש GPUs</td><td>עד 16 vCPU ו-120 GB</td></tr>
<tr><td>Scale to zero</td><td>כן</td><td>כן (או שומרים min instances)</td><td>לא, אתה קובע את מספר ה-tasks</td></tr>
<tr><td>אות ל-scaling</td><td>כל event</td><td>Requests מקבילים, CPU; וב-Container Apps כל scaler של KEDA (אורך תור…)</td><td>מדיניות ה-autoscaling שלך (CPU, ‏requests ב-ALB), בקצב של דקות</td></tr>
<tr><td>Triggers</td><td>הכי עשירים: S3, ‏SQS, ‏Kinesis, ‏DynamoDB Streams, ‏EventBridge, תזמונים, HTTP</td><td>קודם כול HTTP ו-gRPC; ‏events דרך Eventarc / Pub/Sub push / Dapr / KEDA</td><td>Services שרצים לאורך זמן, workers של תורים</td></tr>
<tr><td>חיוב</td><td>לכל request ועוד GB-seconds לכל הפעלה</td><td>vCPU-seconds ועוד GiB-seconds בזמן שמגישים (או לכל instance), ועוד לכל request</td><td>vCPU-hours ועוד GB-hours כל עוד ה-task רץ</td></tr>
<tr><td>ניידות</td><td>נמוכה: מבנה ה-events וה-handler תלויים בספק</td><td>גבוהה: אותו image רץ על Kubernetes, ‏Knative או על הלפטופ</td><td>גבוהה</td></tr></table>`
      }
    },
    {
      h: { en: "Concurrency changes the bill and the database", he: "Concurrency משנה את החשבון ואת ה-database" },
      body: {
        en: `<p>The "1 request per instance" rule is the real difference. Take an API at a steady <strong>100 req/s</strong>, 200 ms per request, mostly waiting on the database (~10 ms of CPU each), 512 MB memory. List prices, us-east-1 / tier-1 regions, approximate:</p>
<table><tr><th>Platform</th><th>How it runs</th><th>~Monthly cost</th></tr>
<tr><td>Lambda</td><td>~20 environments busy at any moment, each billed for the full 200 ms of waiting: 26M GB-s + 259M requests</td><td>~$485 (+ API Gateway if used)</td></tr>
<tr><td>Cloud Run (request-based billing)</td><td>The same 20 concurrent requests fit in 1-2 instances with concurrency 80; you pay for instance time, not per request-duration</td><td>~$170-240</td></tr>
<tr><td>Fargate</td><td>2 tasks of 1 vCPU / 2 GB, always on</td><td>~$72 + load balancer</td></tr></table>
<p>At steady load, always-on is cheapest. At 1M requests a month with long idle gaps, Lambda costs ~$2 and wins. Concurrency matters most for I/O-bound work, because FaaS bills you for the time each request spends waiting.</p>
<p>The same rule hits the database: 500 concurrent Lambdas = 500 DB connections, which can exhaust Postgres (<code>max_connections</code> is often 100-500). You need RDS Proxy or another pooler. 500 concurrent requests on Cloud Run at concurrency 80 is ~7 instances, each with a pool of 10 connections.</p>`,
        he: `<p>הכלל של "request אחד לכל instance" הוא ההבדל האמיתי. ניקח API עם <strong>100 requests לשנייה</strong> קבוע, 200 ms לכל request, רובו המתנה ל-database (בערך 10 ms של CPU לכל אחד), ו-512 MB זיכרון. מחירון ב-us-east-1 / regions של tier 1, בקירוב:</p>
<table><tr><th>פלטפורמה</th><th>איך זה רץ</th><th>עלות חודשית בערך</th></tr>
<tr><td>Lambda</td><td>בערך 20 סביבות עסוקות בכל רגע, וכל אחת מחויבת על כל 200 ה-ms של ההמתנה: ‏26M GB-s ועוד 259M requests</td><td>בערך ‎$485 (ועוד API Gateway אם יש)</td></tr>
<tr><td>Cloud Run (request-based billing)</td><td>אותם 20 requests מקבילים נכנסים ל-1-2 instances עם concurrency של 80; משלמים על זמן ה-instance, לא על משך כל request</td><td>בערך ‎$170-240</td></tr>
<tr><td>Fargate</td><td>2 tasks של 1 vCPU ו-2 GB, דלוקים תמיד</td><td>בערך ‎$72 ועוד load balancer</td></tr></table>
<p>בעומס קבוע, דלוק-תמיד הכי זול. במיליון requests בחודש עם הפסקות ארוכות, Lambda עולה בערך ‎$2 ומנצח. ה-concurrency חשוב בעיקר לעבודה שתלויה ב-I/O, כי FaaS מחייב אותך על הזמן שכל request מחכה.</p>
<p>אותו כלל פוגע ב-database: ‏500 Lambdas מקבילים הם 500 חיבורים ל-DB, וזה יכול למצות את Postgres ‏(<code>max_connections</code> הוא הרבה פעמים 100-500). צריך RDS Proxy או pooler אחר. ‏500 requests מקבילים ב-Cloud Run עם concurrency של 80 הם בערך 7 instances, ולכל אחד pool של 10 חיבורים.</p>`
      }
    },
    {
      h: { en: "How to choose", he: "איך בוחרים" },
      body: {
        en: `<p><strong>Choose FaaS when</strong>:</p>
<ul><li>The work is event glue: S3 upload → thumbnail, SQS message → process, nightly cron, webhook → enqueue.</li>
<li>Traffic is spiky or rare, and idle time is most of the day.</li>
<li>Each unit of work is short (seconds) and independent.</li>
<li>You want the provider's native triggers, retries and DLQs with zero code.</li></ul>
<p><strong>Choose serverless containers when</strong>:</p>
<ul><li>You have a web app or API built on a normal framework, or an existing Dockerfile.</li>
<li>Traffic is steady-ish and I/O-bound, so many requests per instance pay off.</li>
<li>Requests are long, stream responses, use WebSockets or need GPUs.</li>
<li>You want the option to move to Kubernetes later with the same image.</li></ul>
<p><strong>Choose Fargate or Kubernetes when</strong>: the service is always on, needs sidecars, background threads, fixed IPs, custom networking, or you already run a platform there.</p>
<p>A common path as a product grows: Lambda for the MVP → the same code in a container (Lambda Web Adapter or Cloud Run) when the API grows → Kubernetes when many teams share a platform. Keep business logic out of the handler signature and the move stays cheap.</p>`,
        he: `<p><strong>בוחרים FaaS כש</strong>:</p>
<ul><li>העבודה היא glue של events: העלאה ל-S3 ← thumbnail, הודעה ב-SQS ← עיבוד, cron לילי, webhook ← הכנסה לתור.</li>
<li>התעבורה קופצנית או נדירה, ורוב היום אין עבודה.</li>
<li>כל יחידת עבודה קצרה (שניות) ועצמאית.</li>
<li>רוצים את ה-triggers, ה-retries וה-DLQs המובנים של הספק בלי לכתוב קוד.</li></ul>
<p><strong>בוחרים קונטיינרים serverless כש</strong>:</p>
<ul><li>יש אפליקציית web או API על framework רגיל, או Dockerfile קיים.</li>
<li>התעבורה די יציבה ותלויה ב-I/O, אז הרבה requests לכל instance משתלמים.</li>
<li>Requests ארוכים, מזרימים תשובות, משתמשים ב-WebSockets או צריכים GPUs.</li>
<li>רוצים אפשרות לעבור ל-Kubernetes בהמשך עם אותו image.</li></ul>
<p><strong>בוחרים Fargate או Kubernetes כש</strong>: ה-service דלוק תמיד, צריך sidecars, threads ברקע, IPs קבועים, רשת מותאמת, או שכבר מריצים שם פלטפורמה.</p>
<p>מסלול נפוץ כשמוצר גדל: Lambda ל-MVP ← אותו קוד בקונטיינר (Lambda Web Adapter או Cloud Run) כשה-API גדל ← Kubernetes כשהרבה צוותים חולקים פלטפורמה. מחזיקים את הלוגיקה העסקית מחוץ לחתימה של ה-handler, והמעבר נשאר זול.</p>`
      }
    },
    {
      h: { en: "Gotchas per platform", he: "מלכודות לכל פלטפורמה" },
      body: {
        en: `<ul><li><strong>Lambda</strong>: 6 MB request/response payload for synchronous calls, so big files go through presigned S3 URLs. Default 1,000 concurrent executions per account per region, shared by all functions: one runaway function can throttle the rest, so set reserved concurrency. Code after <code>return</code> doesn't reliably run.</li>
<li><strong>Cloud Run</strong>: with request-based billing, CPU is throttled outside requests, so background work after the response crawls or dies. Use instance-based billing or hand the work to Cloud Tasks / Pub/Sub. Big images slow cold starts; keep them slim.</li>
<li><strong>Azure Container Apps</strong>: built on Kubernetes + KEDA + Envoy without exposing them; scale rules on queue length make it a great queue-worker platform. Consumption profile scales to zero; dedicated workload profiles for steady or big workloads.</li>
<li><strong>Fargate</strong>: no scale to zero, a 1-minute billing minimum per task, no DaemonSets or privileged containers on EKS, and slower startup (often 30-60 s) than a Pod on an existing node.</li>
<li><strong>Knative</strong> gives you the Cloud Run model on your own Kubernetes cluster (Cloud Run started from the same API), if you need it on-prem or in another cloud.</li></ul>`,
        he: `<ul><li><strong>Lambda</strong>: מגבלה של 6 MB ל-payload של request/response בקריאות סינכרוניות, אז קבצים גדולים עוברים דרך presigned URLs של S3. ברירת מחדל של 1,000 הרצות מקבילות לחשבון ב-region, משותף לכל הפונקציות: פונקציה אחת שמשתוללת יכולה לעשות throttle לשאר, אז מגדירים reserved concurrency. קוד אחרי <code>return</code> לא בטוח שירוץ.</li>
<li><strong>Cloud Run</strong>: ב-request-based billing ה-CPU מוגבל מחוץ ל-requests, אז עבודה ברקע אחרי התשובה זוחלת או מתה. משתמשים ב-instance-based billing או מעבירים את העבודה ל-Cloud Tasks / Pub/Sub. ‏Images גדולים מאטים cold starts, אז שומרים אותם רזים.</li>
<li><strong>Azure Container Apps</strong>: בנוי על Kubernetes, ‏KEDA ו-Envoy בלי לחשוף אותם. חוקי scale לפי אורך תור הופכים אותו לפלטפורמה מעולה ל-workers של תורים. ‏Consumption profile עושה scale to zero, ו-dedicated workload profiles מתאימים ל-workloads יציבים או גדולים.</li>
<li><strong>Fargate</strong>: אין scale to zero, חיוב מינימלי של דקה לכל task, אין DaemonSets או קונטיינרים privileged ב-EKS, ועלייה איטית יותר (הרבה פעמים 30-60 שניות) מ-Pod על node קיים.</li>
<li><strong>Knative</strong> נותן את המודל של Cloud Run על cluster ה-Kubernetes שלך (Cloud Run התחיל מאותו API), אם צריך אותו on-prem או בענן אחר.</li></ul>`
      }
    }
  ],
  diagram: "FaaS:        event -> [fn instance] (1 request each) -> 100 concurrent = 100 instances\nContainers:  HTTP  -> [container: 80 concurrent]    -> 100 concurrent = 2 instances\nFargate:     ALB   -> [task] [task]  (always on, you set the count)",
  handsOn: [
    { cmd: "aws lambda get-account-settings --query AccountLimit", what: { en: "Your regional concurrency limit and how much is unreserved.", he: "מגבלת ה-concurrency האזורית שלך וכמה ממנה לא שמור." } },
    { cmd: "aws lambda put-function-concurrency --function-name thumbnailer --reserved-concurrent-executions 50", what: { en: "Cap one function so it can't starve the others (and can't open more than 50 DB connections).", he: "מגבילים פונקציה אחת כדי שלא תרעיב את האחרות (ולא תפתח יותר מ-50 חיבורים ל-DB)." } },
    { cmd: "gcloud run services update orders --concurrency=80 --min-instances=1 --cpu-boost", what: { en: "Tune Cloud Run: requests per instance, one warm instance, extra CPU during startup.", he: "מכווננים Cloud Run: ‏requests לכל instance, ‏instance חם אחד, ו-CPU נוסף בזמן עלייה." } },
    { cmd: "az containerapp update -n worker -g rg --min-replicas 0 --max-replicas 20 --scale-rule-name queue --scale-rule-type azure-queue --scale-rule-metadata queueName=jobs queueLength=10 --scale-rule-auth connection=queue-conn", what: { en: "Container Apps worker that scales from 0 to 20 by queue length (KEDA under the hood).", he: "Worker ב-Container Apps שעושה scale מ-0 עד 20 לפי אורך התור (KEDA מתחת לפני השטח)." } }
  ],
  mnemonic: {
    en: "Function = one rider per taxi. Container = a minibus of 80. Fargate = a leased car that's always parked on your bill.",
    he: "פונקציה = נוסע אחד למונית. קונטיינר = מיניבוס של 80. ‏Fargate = רכב בליסינג שתמיד חונה על החשבון שלך."
  },
  pitfalls: [
    { en: "Calling Fargate 'serverless' and expecting scale to zero. The tasks you configure run and bill around the clock.", he: "לקרוא ל-Fargate \"serverless\" ולצפות ל-scale to zero. ה-tasks שהגדרת רצים ומחויבים מסביב לשעון." },
    { en: "Moving a steady, I/O-bound API to Lambda for 'cost savings'. You pay for every millisecond each request waits on the database; a container with concurrency is often 2-3x cheaper.", he: "להעביר API יציב שתלוי ב-I/O ל-Lambda בשביל \"חיסכון\". משלמים על כל מילישנייה שכל request מחכה ל-database, וקונטיינר עם concurrency זול הרבה פעמים פי 2-3." },
    { en: "Opening a new DB connection per Lambda invocation with no pooler. A traffic spike becomes 'too many connections' on Postgres.", he: "לפתוח חיבור חדש ל-DB בכל הפעלה של Lambda בלי pooler. ‏Spike בתעבורה הופך ל-'too many connections' ב-Postgres." },
    { en: "Doing background work after the response on Cloud Run with request-based billing. CPU is throttled and the work silently stalls.", he: "לעשות עבודה ברקע אחרי התשובה ב-Cloud Run עם request-based billing. ה-CPU מוגבל והעבודה נתקעת בשקט." }
  ],
  interview: [
    { q: { en: "What's the difference between FaaS and serverless containers, and when would you use each?", he: "מה ההבדל בין FaaS לקונטיינרים serverless, ומתי משתמשים בכל אחד?" },
      a: { en: "FaaS runs a provider-specific handler per event with one request per instance, strict limits (Lambda: 15 min, 10 GB, 6 MB payloads) and the richest native triggers; serverless containers run any image on a port, serve many concurrent requests per instance, allow longer requests and are portable to Kubernetes. I use FaaS for event-driven glue and spiky, short tasks, and serverless containers for web APIs, steady I/O-bound traffic, streaming or existing Dockerized apps. Fargate is neither: serverless nodes for always-on ECS/EKS tasks.", he: "FaaS מריץ handler שתלוי בספק לכל event, request אחד לכל instance, עם מגבלות קשוחות (ב-Lambda: ‏15 דקות, 10 GB, ‏payloads של 6 MB) וה-triggers המובנים הכי עשירים. קונטיינרים serverless מריצים כל image על port, מגישים הרבה requests מקבילים לכל instance, מאפשרים requests ארוכים יותר וניידים ל-Kubernetes. אני משתמש ב-FaaS ל-glue מבוסס events ולמשימות קצרות וקופצניות, ובקונטיינרים serverless ל-web APIs, לתעבורה יציבה שתלויה ב-I/O, ל-streaming או לאפליקציות שכבר ב-Docker. ‏Fargate הוא לא זה ולא זה: nodes בלי שרתים ל-tasks של ECS/EKS שרצים תמיד." } },
    { q: { en: "Your Lambda-based API overloads Postgres during peaks. Options?", he: "ה-API שלך על Lambda מעמיס את Postgres בשיאים. מה האפשרויות?" },
      a: { en: "Each concurrent invocation holds its own connection. Add RDS Proxy (or PgBouncer) to pool connections, cap reserved concurrency to what the DB can handle, reuse the client outside the handler, push writes through SQS to smooth peaks, or move the API to a container platform with request concurrency and a normal connection pool.", he: "כל הפעלה מקבילה מחזיקה חיבור משלה. מוסיפים RDS Proxy (או PgBouncer) ל-pooling של חיבורים, מגבילים reserved concurrency למה שה-DB מחזיק, משתמשים שוב ב-client מחוץ ל-handler, מעבירים כתיבות דרך SQS כדי להחליק שיאים, או מעבירים את ה-API לפלטפורמת קונטיינרים עם concurrency ל-requests ו-connection pool רגיל." } },
    { q: { en: "Is Fargate serverless?", he: "האם Fargate הוא serverless?" },
      a: { en: "It's serverless infrastructure: no nodes to patch or scale. But it isn't serverless in the app-platform sense: there's no scale to zero or per-request billing; you run a service with N tasks that bill per vCPU-hour and GB-hour while they run.", he: "זו תשתית serverless: אין nodes לעשות להם patch או scale. אבל זה לא serverless במובן של פלטפורמת אפליקציות: אין scale to zero ואין חיוב לפי request. מריצים service עם N tasks שמחויבים לפי vCPU-hour ו-GB-hour כל עוד הם רצים." } }
  ],
  quiz: [
    { q: { en: "500 concurrent requests hit Lambda. How many execution environments run?", he: "500 requests מקבילים מגיעים ל-Lambda. כמה סביבות ריצה רצות?" },
      options: [{ en: "1", he: "1" }, { en: "About 7", he: "בערך 7" }, { en: "About 500", he: "בערך 500" }, { en: "It depends on memory size", he: "תלוי בגודל הזיכרון" }], answer: 2,
      explain: { en: "Classic Lambda serves one request per environment at a time, so concurrency equals environments (and DB connections).", he: "Lambda הקלאסי מגיש request אחד לכל סביבה בכל רגע, אז ה-concurrency שווה למספר הסביבות (ולמספר החיבורים ל-DB)." } },
    { q: { en: "Which platform does NOT scale to zero on its own?", he: "איזו פלטפורמה לא עושה scale to zero בעצמה?" },
      options: [{ en: "Cloud Run", he: "Cloud Run" }, { en: "Lambda", he: "Lambda" }, { en: "ECS on Fargate", he: "ECS על Fargate" }, { en: "Azure Container Apps (consumption)", he: "Azure Container Apps ‏(consumption)" }], answer: 2,
      explain: { en: "Fargate runs the task count you set; scaling it to zero is your job (scheduled actions or custom autoscaling).", he: "Fargate מריץ את מספר ה-tasks שקבעת. להוריד אותו לאפס זה התפקיד שלך (scheduled actions או autoscaling מותאם)." } },
    { q: { en: "A steady 100 req/s API spends most of each request waiting on the DB. Which is usually cheaper?", he: "API עם 100 requests לשנייה קבוע מבלה את רוב הזמן בהמתנה ל-DB. מה בדרך כלל זול יותר?" },
      options: [{ en: "Lambda, because it's pay per use", he: "Lambda, כי משלמים לפי שימוש" }, { en: "A container platform with request concurrency", he: "פלטפורמת קונטיינרים עם concurrency ל-requests" }, { en: "Both cost the same", he: "שניהם עולים אותו דבר" }, { en: "Lambda with more memory", he: "Lambda עם יותר זיכרון" }], answer: 1,
      explain: { en: "Lambda bills each request's full duration including waiting; a container shares one instance across many waiting requests.", he: "Lambda מחייב על כל משך ה-request כולל ההמתנה, וקונטיינר מחלק instance אחד בין הרבה requests שמחכים." } },
    { q: { en: "You need a 40-minute video transcode triggered by an upload. Best fit?", he: "צריך transcode של 40 דקות לווידאו, שמופעל מהעלאה. מה הכי מתאים?" },
      options: [{ en: "A Lambda function", he: "פונקציית Lambda" }, { en: "A container job (Cloud Run job, ECS task, Container Apps job) started by the event", he: "Job בקונטיינר (Cloud Run job, ‏ECS task, ‏Container Apps job) שמופעל מה-event" }, { en: "CloudFront Functions", he: "CloudFront Functions" }, { en: "An API Gateway integration", he: "אינטגרציה של API Gateway" }], answer: 1,
      explain: { en: "Lambda stops at 15 minutes. A container job has no such limit and still scales to zero between uploads.", he: "Lambda נעצר ב-15 דקות. ל-job בקונטיינר אין מגבלה כזאת, והוא עדיין יורד לאפס בין העלאות." } }
  ],
  playground: "scaling",
  related: ["cloud-serverless", "cloud-models", "cloud-event-services", "k8s-keda", "db-managed-cloud", "arch-wasm-edge"]
});

// ---------------------------------------------------------------------------
// 5. Network hops
// ---------------------------------------------------------------------------
INFRA.lessons.push({
  id: "net-hops-paths",
  track: "networking",
  order: 63,
  icon: "🦘",
  level: 2,
  minutes: 11,
  title: { en: "Network Hops: TTL, traceroute, Latency and the Hidden Hops", he: "Hops ברשת: TTL, ‏traceroute, ‏latency וה-hops הנסתרים" },
  tldr: {
    en: "A hop is one router that forwards your packet and decrements its TTL; traceroute and mtr reveal hops by making each one expire a packet. Latency comes from distance and queues, not hop count: a router adds microseconds, an ocean adds ~60 ms. Read traceroute by what persists to the last hop. Many real hops are invisible to it: cloud fabrics, MPLS, NAT, load balancers and proxies, and in a microservice path the proxies are the hops that matter.",
    he: "Hop הוא router אחד שמעביר את ה-packet ומוריד לו את ה-TTL. ‏traceroute ו-mtr חושפים hops כי הם גורמים לכל אחד מהם להפיל packet. ה-latency בא ממרחק ומתורים, לא ממספר ה-hops: router מוסיף מיקרו-שניות, אוקיינוס מוסיף בערך 60 ms. קוראים traceroute לפי מה שנמשך עד ה-hop האחרון. הרבה hops אמיתיים בלתי נראים לו: ה-fabric של הענן, ‏MPLS, ‏NAT, ‏load balancers ו-proxies. ובמסלול של microservices, ה-proxies הם ה-hops שחשובים."
  },
  analogy: {
    en: "A packet is a letter with a stamp that says 'may change hands 64 times'. Every post office (router) that passes it on crosses off one. traceroute sends letters marked 1, 2, 3… and each post office that crosses off the last one sends back a note saying 'it died here', so you learn the route one office at a time. The trip time is mostly the flights between cities, not the sorting inside each office.",
    he: "Packet הוא מכתב עם חותמת שאומרת \"מותר להעביר אותו 64 פעמים\". כל סניף דואר (router) שמעביר אותו מוחק אחת. ‏traceroute שולח מכתבים עם 1, 2, 3… וכל סניף שמוחק את האחרונה שולח פתק \"הוא מת אצלי\", ככה לומדים את המסלול סניף אחרי סניף. זמן הנסיעה הוא בעיקר הטיסות בין הערים, לא המיון בתוך כל סניף."
  },
  sections: [
    {
      h: { en: "What a hop is (and isn't)", he: "מה זה hop (ומה לא)" },
      body: {
        en: `<p>A <strong>hop</strong> is a Layer 3 device that routes your packet: a home router, an ISP router, a backbone router, a cloud gateway. Each one decrements the IP <strong>TTL</strong> (IPv6 calls it hop limit). At 0 the packet is dropped and the router sends back ICMP "time exceeded". That stops routing loops from circulating packets forever.</p>
<ul><li>Linux and macOS start at TTL 64, Windows at 128, many network devices at 255. So a ping reply with <code>ttl=57</code> from a Linux server came through 7 hops (64 − 57).</li>
<li><strong>Switches are not hops.</strong> They forward frames at Layer 2 and don't touch TTL, so a path through 10 switches and 1 router is 1 hop.</li>
<li>The internet path between two cities is typically 10-20 hops.</li></ul>
<p>There's also an application-level meaning: in "the request makes 6 hops", each hop is a <em>connection</em> that a proxy terminates and opens again: CDN → load balancer → ingress → sidecar → service → database. Those don't show up in traceroute at all, and in production they are usually where the time and the failures are.</p>`,
        he: `<p><strong>Hop</strong> הוא רכיב בשכבה 3 שמנתב את ה-packet: הראוטר בבית, router של ספק האינטרנט, router ב-backbone, ‏gateway בענן. כל אחד מוריד באחד את ה-<strong>TTL</strong> של IP (ב-IPv6 קוראים לזה hop limit). כשמגיעים ל-0, ה-packet נזרק וה-router מחזיר ICMP "time exceeded". זה מה שעוצר לולאות ניתוב מלהסתובב לנצח.</p>
<ul><li>Linux ו-macOS מתחילים ב-TTL של 64, ‏Windows ב-128, והרבה רכיבי רשת ב-255. אז תשובת ping עם <code>ttl=57</code> משרת Linux עברה 7 hops ‏(64 פחות 57).</li>
<li><strong>Switches הם לא hops.</strong> הם מעבירים frames בשכבה 2 ולא נוגעים ב-TTL, אז מסלול דרך 10 switches ו-router אחד הוא hop אחד.</li>
<li>מסלול באינטרנט בין שתי ערים הוא בדרך כלל 10-20 hops.</li></ul>
<p>יש גם משמעות ברמת האפליקציה: כשאומרים "ה-request עושה 6 hops", כל hop הוא <em>חיבור</em> ש-proxy מסיים ופותח מחדש: CDN ← load balancer ← ingress ← sidecar ← service ← database. הם בכלל לא מופיעים ב-traceroute, ובפרודקשן בדרך כלל שם נמצאים הזמן והתקלות.</p>`
      }
    },
    {
      h: { en: "Where latency really comes from", he: "מאיפה ה-latency באמת מגיע" },
      body: {
        en: `<p>Four parts add up on every hop:</p>
<table><tr><th>Delay</th><th>Size</th><th>Grows with</th></tr>
<tr><td>Propagation</td><td>~5 µs per km in fiber (light travels ~200 km per ms)</td><td>Distance</td></tr>
<tr><td>Serialization</td><td>1,500 bytes on 10 Gb/s = 1.2 µs; on 10 Mb/s = 1.2 ms</td><td>Slow links</td></tr>
<tr><td>Processing</td><td>Microseconds in a hardware router</td><td>Almost nothing</td></tr>
<tr><td>Queueing</td><td>0 to hundreds of ms</td><td>Congestion, bufferbloat</td></tr></table>
<p>So hop count is a weak predictor. Tel Aviv → Frankfurt is ~3,000 km: at least ~15 ms each way in a straight fiber, and a real RTT of ~50-60 ms because cables don't run straight. Fifteen hops inside one data center add well under 1 ms. When latency jumps, look for distance (an ocean crossing) or a full queue, not "too many hops".</p>
<p>Handy rule: RTT in ms ≈ distance in km ÷ 100 for a good path. London ↔ New York (5,600 km) ≈ 56 ms theoretical, ~70 ms in practice.</p>`,
        he: `<p>ארבעה רכיבים מצטברים בכל hop:</p>
<table><tr><th>עיכוב</th><th>גודל</th><th>גדל עם</th></tr>
<tr><td>Propagation</td><td>בערך 5 µs לכל ק"מ בסיב (האור עובר בערך 200 ק"מ ב-ms)</td><td>מרחק</td></tr>
<tr><td>Serialization</td><td>1,500 bytes על 10 Gb/s זה 1.2 µs; על 10 Mb/s זה 1.2 ms</td><td>קווים איטיים</td></tr>
<tr><td>Processing</td><td>מיקרו-שניות ב-router חומרה</td><td>כמעט כלום</td></tr>
<tr><td>Queueing</td><td>מ-0 ועד מאות ms</td><td>עומס, bufferbloat</td></tr></table>
<p>אז מספר ה-hops הוא מנבא חלש. מתל אביב לפרנקפורט זה בערך 3,000 ק"מ: לפחות בערך 15 ms לכל כיוון בסיב ישר, ו-RTT אמיתי של בערך 50-60 ms כי הכבלים לא עוברים בקו ישר. חמישה-עשר hops בתוך data center אחד מוסיפים הרבה פחות מ-1 ms. כשה-latency קופץ, מחפשים מרחק (חציית ים) או תור מלא, לא "יותר מדי hops".</p>
<p>כלל שימושי: RTT ב-ms שווה בערך למרחק בק"מ חלקי 100 במסלול טוב. בין לונדון לניו יורק (5,600 ק"מ) זה בערך 56 ms בתיאוריה, ובערך 70 ms בפועל.</p>`
      }
    },
    {
      h: { en: "Reading traceroute and mtr like a pro", he: "לקרוא traceroute ו-mtr כמו מקצוען" },
      body: {
        en: `<pre>$ mtr -rwc 100 -T -P 443 api.example.com
HOST                              Loss%   Snt   Last   Avg  Best  Wrst StDev
  1. 192.168.1.1                   0.0%   100    0.8   0.9   0.6   3.1   0.3
  2. 10.10.0.1                     0.0%   100    4.2   4.5   3.9  11.0   0.9
  3. core2.isp.example.net.il      0.0%   100    5.1   5.6   4.8  14.2   1.1
  4. ae-12.edge3.Frankfurt1.net   40.0%   100   58.3  59.0  57.9  66.1   1.2
  5. ae-2.core1.Frankfurt.net      0.0%   100   58.9  59.4  58.2  70.3   1.6
  6. ???                         100.0%   100    0.0   0.0   0.0   0.0   0.0
  7. api.example.com               0.0%   100   60.1  60.4  59.7  68.8   1.3</pre>
<ul><li><strong>Hop 3 → 4, +53 ms</strong>: the jump stays for every hop after it, so it's real: the Mediterranean cable to Frankfurt. That's distance, not a problem.</li>
<li><strong>40% loss at hop 4, 0% at the end</strong>: not real loss. Routers rate-limit or deprioritize the ICMP replies they generate, while still forwarding your traffic fine. <em>Only loss that continues to the last hop matters.</em></li>
<li><strong>Hop 6 <code>???</code></strong>: a router that doesn't answer at all. Normal.</li>
<li><strong>Use TCP to the real port</strong> (<code>-T -P 443</code> in mtr, <code>traceroute -T -p 443</code>): many firewalls drop the UDP probes or ICMP that classic traceroute uses, and the result then looks broken while the service works.</li>
<li><strong>The return path can differ.</strong> traceroute only shows the forward path; the replies may come back another way (asymmetric routing). For a full picture, trace from both ends.</li>
<li><strong>ECMP</strong>: routers spread flows over equal-cost links, so successive probes may take different paths and you see two routers at the same hop. Paris-traceroute and mtr's TCP mode keep the flow fields fixed to stay on one path.</li></ul>`,
        he: `<pre>$ mtr -rwc 100 -T -P 443 api.example.com
HOST                              Loss%   Snt   Last   Avg  Best  Wrst StDev
  1. 192.168.1.1                   0.0%   100    0.8   0.9   0.6   3.1   0.3
  2. 10.10.0.1                     0.0%   100    4.2   4.5   3.9  11.0   0.9
  3. core2.isp.example.net.il      0.0%   100    5.1   5.6   4.8  14.2   1.1
  4. ae-12.edge3.Frankfurt1.net   40.0%   100   58.3  59.0  57.9  66.1   1.2
  5. ae-2.core1.Frankfurt.net      0.0%   100   58.9  59.4  58.2  70.3   1.6
  6. ???                         100.0%   100    0.0   0.0   0.0   0.0   0.0
  7. api.example.com               0.0%   100   60.1  60.4  59.7  68.8   1.3</pre>
<ul><li><strong>מ-hop 3 ל-hop 4, תוספת של 53 ms</strong>: הקפיצה נשארת בכל ה-hops שאחריו, אז היא אמיתית: הכבל בים התיכון לפרנקפורט. זה מרחק, לא בעיה.</li>
<li><strong>40% loss ב-hop 4, ו-0% בסוף</strong>: זה לא איבוד אמיתי. Routers מגבילים או דוחים לסוף התור את תשובות ה-ICMP שהם מייצרים, ובמקביל ממשיכים להעביר את התעבורה שלך בלי בעיה. <em>רק loss שנמשך עד ה-hop האחרון חשוב.</em></li>
<li><strong>Hop 6 עם <code>???</code></strong>: router שבכלל לא עונה. זה רגיל.</li>
<li><strong>משתמשים ב-TCP ל-port האמיתי</strong> (<code>-T -P 443</code> ב-mtr, ‏<code>traceroute -T -p 443</code>): הרבה firewalls זורקים את ה-probes של UDP או ICMP ש-traceroute הקלאסי משתמש בהם, ואז התוצאה נראית שבורה בזמן שה-service עובד.</li>
<li><strong>מסלול החזרה יכול להיות אחר.</strong> רואים ב-traceroute רק את המסלול הלוך, והתשובות יכולות לחזור בדרך אחרת (asymmetric routing). לתמונה מלאה עושים trace משני הצדדים.</li>
<li><strong>ECMP</strong>: routers מפזרים flows על כמה קווים בעלות שווה, אז probes עוקבים יכולים לעבור במסלולים שונים, ורואים שני routers באותו hop. ‏Paris-traceroute ומצב ה-TCP של mtr מקבעים את שדות ה-flow כדי להישאר על מסלול אחד.</li></ul>`
      }
    },
    {
      h: { en: "The hops traceroute can't see", he: "ה-hops ש-traceroute לא רואה" },
      body: {
        en: `<ul><li><strong>Cloud VPC fabric</strong>: inside an AWS VPC a traceroute between two instances usually shows the target as hop 1 (or nothing), even across AZs. The software-defined network (Nitro cards on AWS, Andromeda on GCP) encapsulates your packet and hides its physical path.</li>
<li><strong>MPLS and tunnels</strong>: carriers and VPNs carry your packet inside a label or tunnel; the whole core can look like one hop.</li>
<li><strong>NAT, load balancers, proxies</strong>: a NAT gateway rewrites addresses; an L7 load balancer, an ingress or a sidecar terminates your TCP connection and opens a new one. traceroute stops at the first one that terminates TCP.</li>
<li><strong>Kubernetes</strong>: Pod → veth → node (iptables or eBPF does the Service DNAT) → maybe an overlay tunnel (VXLAN/Geneve) to another node → target Pod. Node-to-node is often one visible hop even when the packet crossed racks.</li></ul>
<p>For those layers, use the tools of each layer: VPC Reachability Analyzer / Network Watcher / Connectivity Tests in the cloud, <code>curl -w</code> timing per phase, load balancer and mesh metrics, and distributed tracing, which shows every application hop with its own latency.</p>
<blockquote>💡 Real world: every proxy in the path adds roughly 0.5-2 ms and one more thing that can time out. A path of CDN → WAF → ALB → ingress → sidecar → app → sidecar → DB can spend more time in proxies than in the network itself. Count application hops in design reviews.</blockquote>`,
        he: `<ul><li><strong>ה-fabric של VPC בענן</strong>: בתוך VPC ב-AWS, ‏traceroute בין שתי מכונות מראה בדרך כלל את היעד כ-hop 1 (או כלום), גם בין AZ-ים. הרשת המוגדרת בתוכנה (כרטיסי Nitro ב-AWS, ‏Andromeda ב-GCP) עוטפת את ה-packet ומסתירה את המסלול הפיזי שלו.</li>
<li><strong>MPLS ו-tunnels</strong>: ספקי תקשורת ו-VPNs מעבירים את ה-packet בתוך label או tunnel, וכל ה-core יכול להיראות כמו hop אחד.</li>
<li><strong>NAT, ‏load balancers, ‏proxies</strong>: ‏NAT gateway משכתב כתובות. ‏Load balancer בשכבה 7, ‏ingress או sidecar מסיימים את חיבור ה-TCP ופותחים חדש. ‏traceroute נעצר בראשון שמסיים TCP.</li>
<li><strong>Kubernetes</strong>: Pod ← veth ← node (‏iptables או eBPF עושים את ה-DNAT של ה-Service) ← אולי tunnel של overlay ‏(VXLAN/Geneve) ל-node אחר ← ה-Pod היעד. בין nodes זה הרבה פעמים hop גלוי אחד, גם כשה-packet חצה racks.</li></ul>
<p>לשכבות האלה משתמשים בכלים של כל שכבה: VPC Reachability Analyzer / Network Watcher / Connectivity Tests בענן, תזמון לפי שלבים עם <code>curl -w</code>, מטריקות של load balancer ושל ה-mesh, ו-distributed tracing, שמראה כל hop של האפליקציה עם ה-latency שלו.</p>
<blockquote>💡 מהשטח: כל proxy במסלול מוסיף בערך 0.5-2 ms ועוד דבר אחד שיכול לעשות timeout. מסלול של CDN ← WAF ← ALB ← ingress ← sidecar ← app ← sidecar ← DB יכול לבזבז יותר זמן ב-proxies מאשר ברשת עצמה. ב-design reviews סופרים גם את ה-hops של האפליקציה.</blockquote>`
      }
    }
  ],
  diagram: "laptop -(1)-> home router -(2)-> ISP -(3..5)-> backbone ==sea cable, +50 ms==> Frankfurt (6..8) -> cloud edge -> [VPC fabric: hidden]\n TTL 64         63               62..60                                        59..57\n\napp-level hops (invisible to traceroute):  CDN -> ALB -> ingress -> sidecar -> service -> DB",
  handsOn: [
    { cmd: "ping -c 3 example.com", what: { en: "Look at ttl= in the replies: 64 minus it (or 128 minus it for Windows hosts) is roughly the hop count.", he: "מסתכלים על ttl= בתשובות: 64 פחות הערך (או 128 פחות הערך ל-hosts של Windows) זה בערך מספר ה-hops." } },
    { cmd: "sudo traceroute -n -T -p 443 example.com", what: { en: "TCP traceroute to the real port, without a DNS lookup per hop.", he: "traceroute ב-TCP ל-port האמיתי, בלי חיפוש DNS לכל hop." } },
    { cmd: "mtr -rwc 100 -T -P 443 example.com", what: { en: "100 probes per hop with loss and jitter; look only at what persists to the final line.", he: "100 probes לכל hop עם loss ו-jitter; מסתכלים רק על מה שנמשך עד השורה האחרונה." } },
    { cmd: "tracert -d example.com", what: { en: "The Windows version (ICMP-based).", he: "הגרסה של Windows (מבוססת ICMP)." } },
    { cmd: "curl -o /dev/null -s -w 'dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer}\\n' https://example.com", what: { en: "When traceroute looks fine, measure the application path phase by phase.", he: "כש-traceroute נראה תקין, מודדים את המסלול של האפליקציה שלב אחרי שלב." } }
  ],
  mnemonic: {
    en: "TTL counts hops, distance counts milliseconds, and only loss that reaches the end is real.",
    he: "TTL סופר hops, המרחק סופר מילישניות, ורק loss שמגיע עד הסוף אמיתי."
  },
  pitfalls: [
    { en: "Opening a ticket with the ISP because one middle hop shows 50% loss. If the final hop shows 0%, it's ICMP rate limiting on that router.", he: "לפתוח קריאה לספק כי hop באמצע מראה 50% loss. אם ב-hop האחרון יש 0%, זה rate limiting של ICMP באותו router." },
    { en: "Concluding 'the network is down' from a traceroute full of * * *. Firewalls and cloud security groups often drop the probes; test the real port with TCP (nc, curl, traceroute -T).", he: "להסיק ש\"הרשת למטה\" מ-traceroute מלא בכוכביות. ‏Firewalls ו-security groups בענן זורקים הרבה פעמים את ה-probes, אז בודקים את ה-port האמיתי ב-TCP ‏(nc, ‏curl, ‏traceroute -T)." },
    { en: "Blaming hop count for latency. Fix distance (a closer region, a CDN) or congestion; removing a router saves microseconds.", he: "להאשים את מספר ה-hops ב-latency. מתקנים מרחק (region קרוב יותר, CDN) או עומס; הסרה של router חוסכת מיקרו-שניות." },
    { en: "Forgetting the application hops. Each proxy adds latency, a timeout to tune and a failure mode; traceroute will never show them.", he: "לשכוח את ה-hops של האפליקציה. כל proxy מוסיף latency, ‏timeout שצריך לכוונן ועוד דרך להיכשל, ו-traceroute לעולם לא יראה אותם." }
  ],
  interview: [
    { q: { en: "How does traceroute work?", he: "איך traceroute עובד?" },
      a: { en: "It sends probes with TTL 1, 2, 3… Each router decrements TTL; the one that takes it to 0 drops the probe and returns ICMP time exceeded from its own address, which reveals that hop and its RTT. It repeats until the destination answers (port unreachable for UDP probes, echo reply for ICMP, SYN-ACK or RST for TCP). Classic Linux traceroute uses UDP, Windows tracert uses ICMP, and TCP mode gets through firewalls.", he: "הוא שולח probes עם TTL של 1, 2, 3… כל router מוריד את ה-TTL, וזה שמגיע ל-0 זורק את ה-probe ומחזיר ICMP time exceeded מהכתובת שלו, וזה חושף את ה-hop ואת ה-RTT שלו. הוא חוזר על זה עד שהיעד עונה (port unreachable ל-probes של UDP, ‏echo reply ל-ICMP, ‏SYN-ACK או RST ל-TCP). ה-traceroute הקלאסי ב-Linux משתמש ב-UDP, ‏tracert של Windows ב-ICMP, ומצב TCP עובר firewalls." } },
    { q: { en: "mtr shows 30% loss at hop 5 and 0% at the destination. Is there a problem?", he: "mtr מראה 30% loss ב-hop 5 ו-0% ביעד. יש בעיה?" },
      a: { en: "No. That router rate-limits or deprioritizes the ICMP replies it generates itself, but forwards transit traffic normally. Real loss shows at that hop and every hop after it, including the destination.", he: "לא. ה-router הזה מגביל או דוחה את תשובות ה-ICMP שהוא עצמו מייצר, אבל מעביר תעבורה עוברת כרגיל. Loss אמיתי מופיע ב-hop הזה ובכל ה-hops שאחריו, כולל היעד." } }
  ],
  quiz: [
    { q: { en: "A ping reply from a Linux server shows ttl=58. Roughly how many hops away is it?", he: "תשובת ping משרת Linux מראה ttl=58. בערך כמה hops הוא רחוק?" },
      options: [{ en: "58", he: "58" }, { en: "6", he: "6" }, { en: "70", he: "70" }, { en: "You can't tell", he: "אי אפשר לדעת" }], answer: 1,
      explain: { en: "Linux starts at 64; 64 - 58 = 6 routers decremented it on the way back.", he: "Linux מתחיל ב-64, ו-64 פחות 58 זה 6 routers שהורידו אותו בדרך חזרה." } },
    { q: { en: "Which device does NOT count as a hop in traceroute?", he: "איזה רכיב לא נחשב hop ב-traceroute?" },
      options: [{ en: "A home router", he: "ראוטר ביתי" }, { en: "An ISP core router", he: "Router בליבת הספק" }, { en: "A Layer 2 switch", he: "Switch בשכבה 2" }, { en: "A cloud internet gateway that routes", he: "Internet gateway בענן שמנתב" }], answer: 2,
      explain: { en: "Switches forward frames without touching the IP TTL.", he: "Switches מעבירים frames בלי לגעת ב-TTL של IP." } },
    { q: { en: "Latency jumps from 5 ms to 58 ms between hop 3 and 4 and stays there. Most likely cause?", he: "ה-latency קופץ מ-5 ms ל-58 ms בין hop 3 ל-4 ונשאר שם. מה הסיבה הסבירה?" },
      options: [{ en: "A faulty router at hop 4", he: "Router תקול ב-hop 4" }, { en: "Physical distance, such as an undersea cable", he: "מרחק פיזי, למשל כבל תת-ימי" }, { en: "Too many hops", he: "יותר מדי hops" }, { en: "DNS", he: "DNS" }], answer: 1,
      explain: { en: "A jump that persists to the end is real path latency, usually distance. Light in fiber covers ~200 km per ms.", he: "קפיצה שנמשכת עד הסוף היא latency אמיתי של המסלול, בדרך כלל מרחק. אור בסיב עובר בערך 200 ק\"מ במילישנייה." } },
    { q: { en: "Why does traceroute between two EC2 instances in different AZs show just one hop?", he: "למה traceroute בין שתי מכונות EC2 ב-AZ-ים שונים מראה hop אחד בלבד?" },
      options: [{ en: "They are on the same switch", he: "הן על אותו switch" }, { en: "The VPC's software-defined network hides the physical path", he: "הרשת המוגדרת בתוכנה של ה-VPC מסתירה את המסלול הפיזי" }, { en: "ICMP is disabled in AWS", he: "ICMP כבוי ב-AWS" }, { en: "AZs share one router", he: "ל-AZ-ים יש router אחד משותף" }], answer: 1,
      explain: { en: "The VPC encapsulates traffic between hosts; the physical routers in between never decrement your packet's TTL.", he: "ה-VPC עוטף את התעבורה בין hosts, וה-routers הפיזיים בדרך אף פעם לא מורידים את ה-TTL של ה-packet שלך." } }
  ],
  related: ["net-troubleshooting", "net-osi-tcpip", "net-vpc", "net-bgp-anycast", "net-errors-by-layer", "cdn-production"]
});

// ---------------------------------------------------------------------------
// Glossary (hover cards)
// ---------------------------------------------------------------------------
INFRA.glossary.push(
  // storage
  { term: "EBS", track: "cloud", aliases: ["Elastic Block Store"], def: { en: "AWS network block volumes for EC2: a virtual disk that lives in one AZ, survives the instance, and is backed up with snapshots (gp3, io2, st1, sc1).", he: "Volumes של block ברשת ל-EC2 ב-AWS: דיסק וירטואלי שחי ב-AZ אחד, שורד את המכונה ומגובה ב-snapshots ‏(gp3, ‏io2, ‏st1, ‏sc1)." }, lesson: "storage-kinds-map" },
  { term: "EFS", track: "cloud", aliases: ["Elastic File System"], def: { en: "AWS managed NFS file system: many instances or Pods mount the same files at once, regional, ~$0.30/GB-month on Standard, slow on many small files.", he: "File system מנוהל של AWS מבוסס NFS: הרבה מכונות או Pod-ים עושים mount לאותם קבצים במקביל. אזורי, בערך ‎$0.30 ל-GB לחודש ב-Standard, ואיטי עם הרבה קבצים קטנים." }, lesson: "storage-kinds-map" },
  { term: "Instance store", track: "cloud", aliases: ["instance storage", "Local SSD"], def: { en: "NVMe disks physically attached to the cloud host: very fast and included in the price, but wiped on stop, hibernate, host failure or Spot interruption.", he: "דיסקי NVMe שמחוברים פיזית ל-host בענן: מהירים מאוד וכלולים במחיר, אבל נמחקים ב-stop, ב-hibernate, בנפילת host או ב-Spot interruption." }, lesson: "storage-kinds-map" },
  { term: "gp3 / gp2", track: "cloud", def: { en: "EBS general-purpose SSD volumes. gp3 includes a flat 3,000 IOPS and 125 MB/s and costs ~20% less than gp2, which relies on burst credits. Migrate gp2 to gp3 in place.", he: "Volumes של EBS מסוג SSD לשימוש כללי. ‏gp3 כולל baseline קבוע של 3,000 IOPS ו-125 MB/s ועולה בערך 20% פחות מ-gp2, שנשען על burst credits. מעבירים מ-gp2 ל-gp3 בלי downtime." }, lesson: "storage-kinds-map" },
  { term: "Ephemeral storage", track: "cloud", aliases: ["ephemeral disk"], def: { en: "Storage that lives only as long as its container, Pod or instance: the writable layer, emptyDir, instance store. Fast scratch space, never the only copy.", he: "Storage שחי רק כל עוד הקונטיינר, ה-Pod או המכונה חיים: שכבת הכתיבה, ‏emptyDir, ‏instance store. מקום עבודה זמני ומהיר, אף פעם לא העותק היחיד." }, lesson: "storage-kinds-map" },
  { term: "File storage", track: "cloud", aliases: ["file share", "file shares", "shared file system"], def: { en: "Storage exposed as a shared POSIX or SMB file system (EFS, Azure Files, Filestore, FSx) that many machines mount at once.", he: "Storage שנחשף כ-file system משותף מסוג POSIX או SMB ‏(EFS, ‏Azure Files, ‏Filestore, ‏FSx), שהרבה מכונות עושות לו mount במקביל." }, lesson: "storage-kinds-map" },
  // static sites
  { term: "Static site", track: "cloud", aliases: ["static website", "static websites", "static sites", "static hosting"], def: { en: "A website made of prebuilt files served as-is (no server code per request), usually from object storage or a static host behind a CDN.", he: "אתר שבנוי מקבצים שנבנו מראש ומוגשים כמו שהם (בלי קוד שרת לכל request), בדרך כלל מ-object storage או מ-host סטטי מאחורי CDN." }, lesson: "static-site-hosting" },
  { term: "Single-page app (SPA)", track: "cloud", aliases: ["SPA", "single-page application", "SPAs"], def: { en: "A web app that ships one HTML file plus JS bundles; the browser router draws every page, so the host must return index.html for unknown paths.", he: "אפליקציית web ששולחת קובץ HTML אחד ועוד JS bundles. ה-router בדפדפן מצייר כל דף, אז ה-host חייב להחזיר index.html לנתיבים לא מוכרים." }, lesson: "static-site-hosting" },
  { term: "Static site generator (SSG)", track: "cloud", aliases: ["SSG", "static site generators"], def: { en: "A build tool (Hugo, Astro, Jekyll, Docusaurus) that renders every page to HTML ahead of time.", he: "כלי build ‏(Hugo, ‏Astro, ‏Jekyll, ‏Docusaurus) שמרנדר כל דף ל-HTML מראש." }, lesson: "static-site-hosting" },
  { term: "Jamstack", track: "cloud", def: { en: "Architecture of prebuilt static frontends on a CDN plus APIs and serverless functions for everything dynamic.", he: "ארכיטקטורה של frontend סטטי שנבנה מראש ומוגש מ-CDN, ועוד APIs ופונקציות serverless לכל מה שדינמי." }, lesson: "static-site-hosting" },
  // CDN
  { term: "CloudFront", track: "networking", aliases: ["Amazon CloudFront"], def: { en: "AWS's CDN: edge caching, TLS, WAF and Shield integration, Origin Access Control for private S3, and edge code (CloudFront Functions, Lambda@Edge).", he: "ה-CDN של AWS: caching ב-edge, ‏TLS, אינטגרציה עם WAF ו-Shield, ‏Origin Access Control ל-S3 פרטי, וקוד ב-edge ‏(CloudFront Functions, ‏Lambda@Edge)." }, lesson: "cdn-production" },
  { term: "Cache invalidation (CDN purge)", track: "networking", aliases: ["CDN purge", "cache purge", "invalidations"], def: { en: "Telling a CDN to drop cached copies before their TTL. Slower and pricier than versioned URLs; purge by tag for dynamic content.", he: "בקשה מה-CDN לזרוק עותקים מה-cache לפני שה-TTL שלהם נגמר. איטי ויקר יותר מכתובות עם גרסה; לתוכן דינמי עושים purge לפי tag." }, lesson: "cdn-production" },
  { term: "Origin shield", track: "networking", aliases: ["tiered cache", "tiered caching", "shield tier"], def: { en: "An extra regional cache layer between CDN edges and the origin, so hundreds of PoPs share one cache and the origin sees far fewer misses.", he: "שכבת cache אזורית נוספת בין ה-edges של ה-CDN ל-origin, כך שמאות PoPs חולקים cache אחד וה-origin רואה הרבה פחות misses." }, lesson: "cdn-production" },
  { term: "stale-if-error", track: "networking", def: { en: "Cache-Control directive that lets caches keep serving an expired copy when the origin returns 5xx or times out.", he: "Directive ב-Cache-Control שמאפשר ל-caches להמשיך להגיש עותק שפג תוקפו כשה-origin מחזיר 5xx או עושה timeout." }, lesson: "cdn-production" },
  { term: "Request collapsing", track: "networking", aliases: ["request coalescing"], def: { en: "A cache merging many simultaneous misses for the same object into one origin request, then answering all waiters from it.", he: "Cache שמאחד הרבה misses בו-זמניים לאותו object ל-request אחד ל-origin, ואז עונה ממנו לכל מי שחיכה." }, lesson: "cdn-production" },
  { term: "Origin offload", track: "networking", aliases: ["byte hit ratio"], def: { en: "The share of bytes served from the CDN cache instead of the origin; often more telling than the request hit ratio.", he: "החלק של ה-bytes שמוגש מה-cache של ה-CDN ולא מה-origin. הרבה פעמים אומר יותר מה-request hit ratio." }, lesson: "cdn-production" },
  { term: "CloudFront Functions", track: "networking", def: { en: "Lightweight JavaScript on CloudFront viewer events (rewrites, redirects, headers) with a sub-millisecond budget and no network calls.", he: "JavaScript קליל על viewer events ב-CloudFront ‏(rewrites, ‏redirects, ‏headers), עם תקציב של פחות ממילישנייה ובלי קריאות רשת." }, lesson: "cdn-production" },
  { term: "Lambda@Edge", track: "networking", def: { en: "Lambda functions (Node.js/Python) attached to CloudFront events; heavier than CloudFront Functions, can call other services, deployed from us-east-1.", he: "פונקציות Lambda ‏(Node.js/Python) שמחוברות ל-events של CloudFront. כבדות יותר מ-CloudFront Functions, יכולות לקרוא לשירותים אחרים, ונפרסות מ-us-east-1." }, lesson: "cdn-production" },
  { term: "Cloudflare Workers", track: "networking", def: { en: "Cloudflare's edge compute on V8 isolates: code runs in hundreds of cities with near-zero cold starts and tight CPU limits.", he: "ה-edge compute של Cloudflare על V8 isolates: קוד שרץ במאות ערים עם cold start כמעט אפסי ומגבלות CPU הדוקות." }, lesson: "cdn-production" },
  // serverless
  { term: "Serverless containers", track: "cloud", aliases: ["serverless container", "container serverless"], def: { en: "Platforms that run any container image on demand with scale to zero and many requests per instance: Cloud Run, Azure Container Apps, Knative.", he: "פלטפורמות שמריצות כל container image לפי דרישה, עם scale to zero והרבה requests לכל instance: ‏Cloud Run, ‏Azure Container Apps, ‏Knative." }, lesson: "faas-vs-container-serverless" },
  { term: "Fargate", track: "cloud", aliases: ["AWS Fargate"], def: { en: "AWS serverless compute for ECS and EKS: no nodes to manage, but tasks run and bill per vCPU-hour and GB-hour around the clock; no scale to zero by itself.", he: "Compute בלי שרתים של AWS ל-ECS ול-EKS: אין nodes לנהל, אבל tasks רצים ומחויבים לפי vCPU-hour ו-GB-hour מסביב לשעון, ואין scale to zero בעצמו." }, lesson: "faas-vs-container-serverless" },
  { term: "Cloud Run", track: "cloud", aliases: ["Google Cloud Run"], def: { en: "GCP's serverless container platform: any image on $PORT, up to 1,000 concurrent requests per instance, scale to zero, jobs for batch work.", he: "פלטפורמת הקונטיינרים serverless של GCP: כל image על $PORT, עד 1,000 requests מקבילים לכל instance, ‏scale to zero, ו-jobs לעבודת batch." }, lesson: "faas-vs-container-serverless" },
  { term: "Azure Container Apps", track: "cloud", aliases: ["Container Apps"], def: { en: "Azure's serverless container platform built on Kubernetes, KEDA, Envoy and Dapr without exposing them; scales on HTTP, CPU or any KEDA trigger, down to zero.", he: "פלטפורמת הקונטיינרים serverless של Azure, בנויה על Kubernetes, ‏KEDA, ‏Envoy ו-Dapr בלי לחשוף אותם. עושה scale לפי HTTP, ‏CPU או כל trigger של KEDA, עד אפס." }, lesson: "faas-vs-container-serverless" },
  { term: "Knative", track: "kubernetes", def: { en: "Open-source serverless layer for Kubernetes: request-driven autoscaling with scale to zero (Serving) and event routing (Eventing); the model behind Cloud Run.", he: "שכבת serverless בקוד פתוח ל-Kubernetes: autoscaling לפי requests עם scale to zero ‏(Serving) וניתוב events ‏(Eventing). המודל שמאחורי Cloud Run." }, lesson: "faas-vs-container-serverless" },
  { term: "AWS Lambda", track: "cloud", def: { en: "AWS's FaaS: a handler per event, one request per execution environment, up to 15 minutes and 10 GB memory, billed per request and GB-second.", he: "ה-FaaS של AWS: ‏handler לכל event, ‏request אחד לכל סביבת ריצה, עד 15 דקות ו-10 GB זיכרון, וחיוב לפי request ו-GB-second." }, lesson: "faas-vs-container-serverless" },
  { term: "Reserved concurrency", track: "cloud", def: { en: "A per-function cap (and guarantee) on concurrent Lambda executions, used to protect downstream databases and stop one function from starving the rest.", he: "תקרה (וגם הבטחה) להרצות מקבילות של פונקציית Lambda אחת. משמשת להגן על databases ולמנוע מפונקציה אחת להרעיב את השאר." }, lesson: "faas-vs-container-serverless" },
  { term: "Provisioned concurrency", track: "cloud", def: { en: "Lambda environments kept initialized and warm in advance to remove cold starts, billed even when idle.", he: "סביבות Lambda שמאותחלות ונשמרות חמות מראש כדי לבטל cold starts, ומחויבות גם כשהן לא עובדות." }, lesson: "cloud-serverless" },
  // network hops
  { term: "Hop", track: "networking", aliases: ["network hop", "hops"], def: { en: "One router (Layer 3 device) on the path that forwards the packet and decrements its TTL. Switches are not hops; proxies are 'hops' only at the application level.", he: "Router אחד (רכיב בשכבה 3) במסלול, שמעביר את ה-packet ומוריד לו את ה-TTL. ‏Switches הם לא hops, ו-proxies הם \"hops\" רק ברמת האפליקציה." }, lesson: "net-hops-paths" },
  { term: "TTL (IP) / hop limit", track: "networking", aliases: ["hop limit", "IP TTL"], def: { en: "A counter in every IP packet that each router decrements; at 0 the packet is dropped with ICMP time exceeded. Linux starts at 64, Windows at 128.", he: "מונה בכל packet של IP שכל router מוריד באחד. ב-0 ה-packet נזרק עם ICMP time exceeded. ‏Linux מתחיל ב-64 ו-Windows ב-128." }, lesson: "net-hops-paths" },
  { term: "traceroute", track: "networking", aliases: ["tracert", "traceroutes"], def: { en: "Tool that maps the path to a host by sending probes with TTL 1, 2, 3… and listening for each router's time-exceeded reply.", he: "כלי שממפה את המסלול ל-host בשליחת probes עם TTL של 1, 2, 3… והאזנה לתשובת time exceeded מכל router." }, lesson: "net-hops-paths" },
  { term: "mtr", track: "networking", def: { en: "traceroute + ping in one, repeated continuously, with per-hop loss and latency stats. Only loss that persists to the final hop is real.", he: "traceroute ועוד ping ביחד, שרץ ברצף ומראה loss ו-latency לכל hop. רק loss שנמשך עד ה-hop האחרון אמיתי." }, lesson: "net-hops-paths" },
  { term: "ECMP", track: "networking", aliases: ["equal-cost multi-path"], def: { en: "Equal-cost multi-path routing: routers spread flows across several equal links by hashing the 5-tuple, so one flow stays on one path.", he: "Equal-cost multi-path routing: ‏routers מפזרים flows על כמה קווים שווים לפי hash של ה-5-tuple, כך ש-flow אחד נשאר על מסלול אחד." }, lesson: "net-hops-paths" },
  { term: "Propagation delay", track: "networking", def: { en: "Time for a signal to travel the distance: ~5 µs per km in fiber, so RTT in ms ≈ km ÷ 100 on a good path.", he: "הזמן שלוקח לאות לעבור את המרחק: בערך 5 µs לכל ק\"מ בסיב, אז RTT ב-ms שווה בערך לק\"מ חלקי 100 במסלול טוב." }, lesson: "net-hops-paths" }
);
