// Interview prep — storage & edge system design cases (file sync, KV store, object storage, CDN, ID generator).
// Format: CONTENT_SCHEMA.md ("Interview prep — system design case").
window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
window.INFRA.designs = window.INFRA.designs || [];

/* ------------------------------------------------------------------ */
/* 1. File sync (Dropbox-like)                                          */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-file-sync", icon: "🗂️", level: 3,
  title: { en: "Design a file sync service (Dropbox-like)", he: "תכנון שירות סנכרון קבצים (בסגנון Dropbox)" },
  prompt: {
    en: "Design a file sync and share service like Dropbox or Google Drive: a desktop/mobile client watches a folder, every change shows up on the user's other devices within seconds, files can be shared with other users, and it must work offline. 500M users, exabyte-scale storage. Walk me through chunking, dedup, the metadata service, the sync protocol and conflicts.",
    he: "תתכנן שירות סנכרון ושיתוף קבצים כמו Dropbox או Google Drive: client בדסקטופ ובמובייל מאזין לתיקייה, כל שינוי מופיע בשאר המכשירים של המשתמש תוך שניות, אפשר לשתף קבצים עם משתמשים אחרים, והכל חייב לעבוד גם offline. ‏500M משתמשים, אחסון בסקייל של exabyte. תעבור איתי על chunking, ‏dedup, ‏metadata service, פרוטוקול הסנכרון ו-conflicts."
  },
  clarify: [
    { en: "Scale: registered vs daily active users, average storage per user, average and max file size (do we support 50 GB video files)?",
      he: "סקייל: כמה משתמשים רשומים מול פעילים ביום, כמה אחסון ממוצע למשתמש, מה גודל קובץ ממוצע ומקסימלי (תומכים בקבצי וידאו של 50GB)?" },
    { en: "How fast must a change appear on other devices — seconds (interactive) or minutes (backup-like)?",
      he: "כמה מהר שינוי צריך להופיע במכשירים אחרים — שניות (אינטראקטיבי) או דקות (בסגנון גיבוי)?" },
    { en: "Collaboration model: do multiple users edit the same file concurrently (Google Docs-style), or is it whole-file sync where conflicts are rare and resolved by keeping both copies?",
      he: "מודל שיתוף פעולה: כמה משתמשים עורכים את אותו קובץ במקביל (בסגנון Google Docs), או שזה סנכרון של קובץ שלם ש-conflicts בו נדירים ונפתרים בשמירת שני העותקים?" },
    { en: "Version history and undelete: how long do we keep old versions (30 days, 180 days, forever on paid plans)?",
      he: "היסטוריית גרסאות ושחזור מחיקה: כמה זמן שומרים גרסאות ישנות (30 יום, 180 יום, לנצח בתוכנית בתשלום)?" },
    { en: "Is cross-user dedup allowed (privacy/legal), and do we need client-side encryption that would make server-side dedup impossible?",
      he: "מותר לעשות dedup בין משתמשים שונים (פרטיות ומשפט), והאם צריך הצפנה בצד ה-client שתמנע dedup בצד השרת?" },
    { en: "Mobile constraints: metered networks, battery, background upload limits on iOS/Android?",
      he: "אילוצי מובייל: רשת בתשלום לפי נפח, סוללה, הגבלות על upload ברקע ב-iOS וב-Android?" }
  ],
  functional: [
    { en: "Upload, download, rename, move and delete files and folders; changes propagate to all of the user's devices.",
      he: "Upload, ‏download, שינוי שם, הזזה ומחיקה של קבצים ותיקיות; השינויים מתפשטים לכל המכשירים של המשתמש." },
    { en: "Resumable, delta uploads: only changed chunks are sent; identical chunks are never stored twice.",
      he: "Uploads שאפשר לחדש ושולחים רק delta: נשלחים רק chunks שהשתנו; chunk זהה אף פעם לא נשמר פעמיים." },
    { en: "Offline edits that sync on reconnect, with conflict detection (\"conflicted copy\").",
      he: "עריכות offline שמסתנכרנות כשהחיבור חוזר, עם זיהוי conflicts ‏(\"conflicted copy\")." },
    { en: "Share folders/files with users or by link, with viewer/editor permissions.",
      he: "שיתוף תיקיות וקבצים עם משתמשים או דרך לינק, עם הרשאות צפייה או עריכה." },
    { en: "Version history and restore of deleted files for a retention window.",
      he: "היסטוריית גרסאות ושחזור קבצים שנמחקו בתוך חלון retention." }
  ],
  nonFunctional: [
    { en: "Durability: never lose a committed file version (11 nines on block storage); metadata must be strongly consistent per namespace.",
      he: "עמידות: אסור לאבד אף פעם גרסת קובץ שעשתה commit ‏(11 תשיעיות ב-block storage); ה-metadata חייב להיות strongly consistent בתוך כל namespace." },
    { en: "Change propagation p95 under 5 s between online devices; a small-file upload completes in under 1 s.",
      he: "התפשטות שינוי ב-p95 מתחת ל-5 שניות בין מכשירים מחוברים; upload של קובץ קטן מסתיים תוך פחות משנייה." },
    { en: "Efficiency: minimize bytes on the wire (delta sync, compression, dedup) — bandwidth and storage dominate cost.",
      he: "יעילות: מינימום בייטים על הרשת (delta sync, דחיסה, ‏dedup) — רוחב פס ואחסון הם עיקר העלות." },
    { en: "Availability 99.99% for metadata reads; uploads can degrade gracefully (client queues and retries).",
      he: "זמינות 99.99% לקריאות metadata; ‏uploads יכולים להידרדר בצורה מבוקרת (ה-client שומר בתור ומנסה שוב)." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Storage</strong>: 500M users × ~2 GB average ≈ <strong>1 EB logical</strong>. Dedup (same installers, photos shared across folders, unchanged chunks across versions) saves ~25-30% → ~0.7 EB unique. Stored with erasure coding at ~1.5x → <strong>~1.1 EB raw disk</strong> ≈ 55,000 × 20 TB HDDs before free-space headroom.</li>
<li><strong>Change rate</strong>: 100M DAU × ~20 file changes/day = 2B changes/day ≈ <strong>23K commits/s average, ~70K/s peak</strong> on the metadata service.</li>
<li><strong>Upload bandwidth</strong>: thanks to delta sync the average change uploads ~200 KB of new chunks → 2B × 200 KB = <strong>400 TB/day</strong> ≈ 4.6 GB/s average, ~15 GB/s peak. Without delta sync (re-uploading whole files averaging ~3 MB) it would be ~15x more.</li>
<li><strong>Chunk index</strong>: 0.7 EB ÷ ~2 MB average chunk ≈ 3.5×10<sup>11</sup> chunks × ~64 B (32 B SHA-256 + location + refcount) ≈ <strong>22 TB</strong> — a sharded KV store, not one database.</li>
<li><strong>Metadata</strong>: ~2,000 files per user × 500M = 10<sup>12</sup> file entries × ~500 B ≈ <strong>500 TB</strong> before replication — must be sharded (by namespace id).</li>
<li><strong>Notifications</strong>: ~300M devices online at peak, each holding one long-poll/WebSocket. At ~500K idle connections per notification server → <strong>~600 servers</strong>, round up to ~1,000 for headroom and AZ loss.</li>
</ul>`,
    he: `<ul>
<li><strong>אחסון</strong>: ‏500M משתמשים × ~2GB בממוצע ≈ <strong>1EB לוגי</strong>. ‏Dedup (אותם installers, תמונות ששותפו לכמה תיקיות, chunks שלא השתנו בין גרסאות) חוסך ~25-30% ← בערך 0.7EB ייחודי. שמור עם erasure coding של ~1.5x ← <strong>~1.1EB דיסק גולמי</strong> ≈ ‏55,000 דיסקים של 20TB לפני מרווח למקום פנוי.</li>
<li><strong>קצב שינויים</strong>: ‏100M DAU × ~20 שינויי קבצים ביום = 2 מיליארד שינויים ביום ≈ <strong>23K commits בשנייה בממוצע, ~70K בשנייה ב-peak</strong> על ה-metadata service.</li>
<li><strong>רוחב פס של upload</strong>: בזכות delta sync שינוי ממוצע מעלה ~200KB של chunks חדשים ← ‏2B × 200KB = <strong>400TB ביום</strong> ≈ ‏4.6GB/s בממוצע, ~15GB/s ב-peak. בלי delta sync (מעלים מחדש קובץ שלם, ~3MB בממוצע) זה היה פי 15 בערך.</li>
<li><strong>Chunk index</strong>: ‏0.7EB ÷ chunk ממוצע של ~2MB ≈ ‏3.5×10<sup>11</sup> chunks × ~64B ‏(32B של SHA-256 + מיקום + refcount) ≈ <strong>22TB</strong> — זה KV store משורד, לא database אחד.</li>
<li><strong>Metadata</strong>: ~2,000 קבצים למשתמש × 500M = 10<sup>12</sup> רשומות קבצים × ~500B ≈ <strong>500TB</strong> לפני replication — חייב sharding (לפי namespace id).</li>
<li><strong>Notifications</strong>: ~300M מכשירים מחוברים ב-peak, כל אחד מחזיק long-poll או WebSocket אחד. בערך 500K חיבורים רדומים לשרת notifications ← <strong>~600 שרתים</strong>, מעגלים ל-~1,000 בשביל מרווח ונפילת AZ.</li>
</ul>`
  },
  api: `# Metadata service (HTTPS/JSON or gRPC)
GET  /v1/namespaces/{ns}/delta?cursor=c123          -> {entries:[{path, rev, blocklist[], deleted}], cursor:c130, has_more}
POST /v1/namespaces/{ns}/commit
     {path, parent_rev, size, mtime, blocklist:[sha256...]}
     -> 200 {rev}                                  (all blocks known)
     -> 409 {need_blocks:[sha256...]}              (upload these first)
     -> 412 {conflict, server_rev}                 (parent_rev is stale)
GET  /v1/notify/longpoll?ns=...&cursor=c130&timeout=90  -> {changes: true|false}   (or a WebSocket push)
POST /v1/shares {ns, path, grantee|link, role: viewer|editor}

# Block service (separate hostnames, direct to storage tier)
PUT  /v1/blocks/{sha256}      body = compressed chunk  -> 201 (idempotent: same hash = same content)
GET  /v1/blocks/{sha256}      -> chunk bytes            (signed, short-lived token)
POST /v1/blocks/exists  {hashes[]} -> {missing[]}`,
  dataModel: `namespaces(ns_id PK, owner_id, type: user_root|shared_folder, journal_cursor)
journal(ns_id, seq, path, rev, op: add|edit|delete|move, blocklist, size, mtime, author_device)  PK(ns_id, seq)
   -- append-only per namespace; "latest state" = files table, derived from journal
files(ns_id, path_lower, file_id, rev, blocklist[], size, mtime, is_dir, deleted)   PK(ns_id, path_lower)
mounts(user_id, ns_id, mount_path, role)        -- shared folders appear inside users' trees
blocks(sha256 PK, storage_location, size, refcount, created_at)   -- sharded KV, ~22 TB
devices(device_id, user_id, platform, last_cursor_per_ns, push_token)
Sharding: metadata by ns_id (all of a namespace on one shard -> per-namespace serializable commits)`,
  diagram: `  Desktop / mobile client
  +------------------------------------------+
  | watcher (inotify/FSEvents) -> local DB    |
  | chunker (FastCDC) -> sha256 per chunk     |
  | upload queue, retry, resume               |
  +-----+-----------------+---------------+---+
        | 1 commit(meta)  | 2 PUT blocks   ^ 4 long-poll / WS: "ns 77 changed"
        v                 v                |
  +-----------+    +--------------+   +------------------+
  | API / LB  |    | block service|   | notification svc |  ~1,000 nodes,
  +-----+-----+    +------+-------+   | (conn per device)|  300M open conns
        |                 |           +--------^---------+
        v                 v                    | 3 publish(ns_id, seq)
  +--------------+   +------------------+      |
  | metadata svc |-->| block index (KV) |   +--+------------+
  | journal per  |   | sha256 -> loc,   |   | change bus    |
  | namespace    |   | refcount         |   | (Kafka)       |
  | (sharded SQL)|   +--------+---------+   +---------------+
  +------+-------+            v
         |           +-------------------------+
         +---------->| object/block storage    |  erasure coded 8+4,
                     | (immutable chunks)      |  cross-AZ, ~1.1 EB raw
                     +-------------------------+`,
  deepDives: [
    {
      h: { en: "Chunking: fixed-size vs content-defined, and dedup by hash", he: "Chunking: גודל קבוע מול content-defined, ו-dedup לפי hash" },
      body: {
        en: `<p>Files are split into chunks and each chunk is addressed by its <strong>SHA-256</strong>. A file version is just an ordered <code>blocklist</code> of hashes. Upload becomes: compute hashes locally → ask the server which ones are missing → upload only those → commit the blocklist. Re-uploading an unchanged 2 GB file costs a few KB of hashes.</p>
<p><strong>Fixed-size chunks</strong> (Dropbox historically used 4 MB) are simple but fragile: insert one byte at the start of a file and every chunk boundary shifts, so every hash changes. <strong>Content-defined chunking</strong> (Rabin fingerprint, or the faster <strong>FastCDC</strong>) slides a rolling hash over the bytes and cuts a boundary where <code>hash &amp; mask == 0</code> — boundaries follow the content, so an insertion changes only the one or two chunks around it. Typical parameters: min 512 KB, average 1-2 MB, max 8 MB (the min/max stop pathological tiny or giant chunks).</p>
<p>Chunk size is a trade-off: smaller chunks → better dedup and smaller deltas, but more index entries, more requests and more metadata per file. For small files (&lt; 1 chunk) the chunk is the file.</p>
<blockquote>⚠️ Cross-user dedup leaks information: if uploading a hash returns "already have it" instantly, an attacker can probe whether anyone stores a specific file. Mitigations: dedup only within a user/team, or always require the upload of the first copy per account (proof of ownership) before linking.</blockquote>`,
        he: `<p>קבצים מפוצלים ל-chunks וכל chunk מזוהה לפי ה-<strong>SHA-256</strong> שלו. גרסת קובץ היא בסך הכל <code>blocklist</code> מסודר של hashes. ה-upload הופך ל: מחשבים hashes מקומית ← שואלים את השרת אילו חסרים ← מעלים רק אותם ← עושים commit ל-blocklist. העלאה מחדש של קובץ של 2GB שלא השתנה עולה כמה KB של hashes.</p>
<p><strong>Chunks בגודל קבוע</strong> (ב-Dropbox השתמשו היסטורית ב-4MB) פשוטים אבל שבירים: מכניסים בייט אחד בתחילת קובץ וכל גבולות ה-chunks זזים, אז כל ה-hashes משתנים. <strong>Content-defined chunking</strong> ‏(Rabin fingerprint, או ה-<strong>FastCDC</strong> המהיר יותר) מעביר rolling hash על הבייטים וחותך גבול איפה ש-<code>hash &amp; mask == 0</code> — הגבולות עוקבים אחרי התוכן, אז הכנסה משנה רק chunk או שניים סביבה. פרמטרים טיפוסיים: מינימום 512KB, ממוצע 1-2MB, מקסימום 8MB (המינימום והמקסימום מונעים chunks זעירים או ענקיים).</p>
<p>גודל chunk הוא trade-off: chunks קטנים יותר ← dedup טוב יותר ו-deltas קטנים יותר, אבל יותר רשומות ב-index, יותר בקשות ויותר metadata לכל קובץ. בקבצים קטנים (פחות מ-chunk אחד) ה-chunk הוא הקובץ.</p>
<blockquote>⚠️ Dedup בין משתמשים מדליף מידע: אם העלאת hash מחזירה "כבר יש לי" מיד, תוקף יכול לבדוק אם מישהו מחזיק קובץ מסוים. פתרונות: dedup רק בתוך משתמש או צוות, או לדרוש תמיד upload של העותק הראשון בכל חשבון (proof of ownership) לפני שמקשרים.</blockquote>`
      }
    },
    {
      h: { en: "Metadata service vs block storage: two very different systems", he: "Metadata service מול block storage: שתי מערכות שונות מאוד" },
      body: {
        en: `<p>Split the problem. <strong>Blocks</strong> are immutable, content-addressed and huge in volume — perfect for erasure-coded object storage, cacheable forever, no consistency puzzles (same hash = same bytes). <strong>Metadata</strong> is small, mutable and needs transactions: "commit rev 8 of <code>/report.docx</code> only if the current rev is 7".</p>
<p>Model each namespace (a user's root or a shared folder) as an <strong>append-only journal</strong> with a monotonically increasing <code>seq</code>. A commit is one transaction on the namespace's shard: check <code>parent_rev</code>, verify all blocks exist, append to the journal, update the <code>files</code> row. Because a namespace never spans shards, you get serializable commits without distributed transactions. Dropbox moved from sharded MySQL to its own Edgestore/Panda layers; the principle — shard by namespace, journal per namespace — is the same.</p>
<p>Commit protocol order matters: <strong>blocks first, metadata last</strong>. If the client dies mid-upload, orphaned blocks are garbage-collected later (refcount 0 after a grace period); you never have metadata pointing at missing bytes.</p>`,
        he: `<p>מפצלים את הבעיה. <strong>Blocks</strong> הם immutable, ממוענים לפי תוכן ובנפח עצום — מושלם ל-object storage עם erasure coding, אפשר לשמור ב-cache לנצח, ואין חידות של consistency (אותו hash = אותם בייטים). <strong>Metadata</strong> הוא קטן, משתנה וצריך טרנזקציות: "תעשה commit ל-rev 8 של <code>/report.docx</code> רק אם ה-rev הנוכחי הוא 7".</p>
<p>ממדלים כל namespace (ה-root של משתמש או תיקייה משותפת) כ-<strong>journal שרק מוסיפים אליו</strong> עם <code>seq</code> שעולה תמיד. ‏commit הוא טרנזקציה אחת על ה-shard של ה-namespace: בודקים <code>parent_rev</code>, מוודאים שכל ה-blocks קיימים, מוסיפים ל-journal ומעדכנים את השורה ב-<code>files</code>. בגלל ש-namespace אף פעם לא חוצה shards, מקבלים commits שהם serializable בלי טרנזקציות מבוזרות. ב-Dropbox עברו מ-MySQL משורד לשכבות Edgestore ו-Panda משלהם; העיקרון — sharding לפי namespace, ‏journal לכל namespace — נשאר אותו דבר.</p>
<p>הסדר בפרוטוקול ה-commit חשוב: <strong>קודם blocks, metadata בסוף</strong>. אם ה-client מת באמצע upload, ה-blocks היתומים נאספים אחר כך ב-garbage collection ‏(refcount 0 אחרי grace period); אף פעם אין metadata שמצביע על בייטים חסרים.</p>`
      }
    },
    {
      h: { en: "Sync protocol and notifications: cursors + long-poll/WebSocket", he: "פרוטוקול סנכרון ו-notifications: ‏cursors ועוד long-poll או WebSocket" },
      body: {
        en: `<p>Each device keeps a <strong>cursor</strong> per namespace (the last journal <code>seq</code> it applied). Sync is pull-based and idempotent: <code>GET /delta?cursor=c</code> returns journal entries after <code>c</code> plus a new cursor. Lost a message? Pull again from the same cursor. Device offline for a month? Same call, paginated (<code>has_more</code>); if the journal was compacted past the cursor, the server returns "reset" and the client does a full listing diff.</p>
<p>The notification channel carries <strong>no data</strong>, only "namespace 77 changed". Clients hold a long-poll (~60-90 s timeout, jittered) or a WebSocket to a notification server. When a commit lands, the metadata service publishes <code>(ns_id, seq)</code> to a bus; notification servers keep an in-memory map <code>ns_id → connections</code> and ping only interested devices, which then call <code>/delta</code>. Keeping the push dumb means a dropped notification only delays sync until the next poll — correctness lives in the cursor.</p>
<p>Mobile: no persistent connections in the background, so use APNs/FCM pushes as the "changed" signal and sync lazily (metadata only; download file content on open, or for starred/offline folders on Wi-Fi).</p>
<blockquote>⚠️ Thundering herd: a shared folder with 50,000 members (company-wide) generates 50,000 delta calls per edit. Coalesce notifications per namespace (at most one ping per N seconds) and serve hot deltas from a cache.</blockquote>`,
        he: `<p>כל מכשיר מחזיק <strong>cursor</strong> לכל namespace (ה-<code>seq</code> האחרון ב-journal שהוא החיל). הסנכרון מבוסס pull ואידמפוטנטי: <code>GET /delta?cursor=c</code> מחזיר את רשומות ה-journal אחרי <code>c</code> ועוד cursor חדש. הלכה הודעה לאיבוד? מושכים שוב מאותו cursor. מכשיר היה offline חודש? אותה קריאה, עם pagination ‏(<code>has_more</code>); אם ה-journal עבר compaction מעבר ל-cursor, השרת מחזיר "reset" וה-client עושה diff מלא מול הרשימה.</p>
<p>ערוץ ה-notifications <strong>לא נושא דאטה</strong>, רק "namespace 77 השתנה". ה-clients מחזיקים long-poll ‏(timeout של ~60-90 שניות עם jitter) או WebSocket לשרת notifications. כש-commit נוחת, ה-metadata service מפרסם <code>(ns_id, seq)</code> ל-bus; שרתי ה-notifications מחזיקים בזיכרון map של <code>ns_id → connections</code> ומעירים רק מכשירים רלוונטיים, שאז קוראים ל-<code>/delta</code>. כש-push נשאר טיפש, notification שנפל רק מעכב סנכרון עד ה-poll הבא — הנכונות חיה ב-cursor.</p>
<p>מובייל: אין חיבורים קבועים ברקע, אז משתמשים ב-pushes של APNs או FCM בתור אות "השתנה" ומסנכרנים בעצלות (רק metadata; מורידים תוכן קובץ כשפותחים אותו, או לתיקיות שסומנו offline כשיש Wi-Fi).</p>
<blockquote>⚠️ Thundering herd: תיקייה משותפת עם 50,000 חברים (כל החברה) מייצרת 50,000 קריאות delta על כל עריכה. מאחדים notifications לכל namespace (לכל היותר ping אחד כל N שניות) ומגישים deltas חמים מ-cache.</blockquote>`
      }
    },
    {
      h: { en: "Conflicts and offline edits", he: "Conflicts ועריכות offline" },
      body: {
        en: `<p>Every commit carries <code>parent_rev</code> — the version the client edited. If the server's current rev differs, it's a conflict (optimistic concurrency, like an HTTP <code>If-Match</code>). For opaque binary files the server can't merge, so the standard answer is: the first commit wins, the loser's version is saved as <code>report (Dana's conflicted copy 2026-11-14).docx</code>. Nothing is lost; the human merges.</p>
<p>Trickier cases: edit vs delete (keep the edit — restoring is safer than losing work), move vs edit (resolve by <code>file_id</code>, not path, so the edit follows the file), two creates of the same path, case-only renames on case-insensitive filesystems (macOS/Windows) — which is why the key is <code>path_lower</code>.</p>
<p>Real-time co-editing (Google Docs) is a different design: operations, not files, merged with OT or CRDTs. Mention it, but whole-file sync with conflicted copies is the right answer for a Dropbox interview.</p>`,
        he: `<p>כל commit נושא <code>parent_rev</code> — הגרסה שה-client ערך. אם ה-rev הנוכחי בשרת שונה, זה conflict ‏(optimistic concurrency, כמו <code>If-Match</code> ב-HTTP). בקבצים בינאריים אטומים השרת לא יכול למזג, אז התשובה הסטנדרטית: ה-commit הראשון מנצח, והגרסה של המפסיד נשמרת בשם <code>report (Dana's conflicted copy 2026-11-14).docx</code>. שום דבר לא הולך לאיבוד; בן אדם ממזג.</p>
<p>מקרים מסובכים יותר: עריכה מול מחיקה (שומרים את העריכה — שחזור בטוח יותר מאיבוד עבודה), הזזה מול עריכה (פותרים לפי <code>file_id</code>, לא לפי path, כך שהעריכה הולכת אחרי הקובץ), שתי יצירות באותו path, ושינוי שם שמשנה רק אותיות גדולות וקטנות ב-filesystems שלא רגישים לזה (macOS ו-Windows) — ולכן המפתח הוא <code>path_lower</code>.</p>
<p>עריכה משותפת בזמן אמת (Google Docs) היא תכנון אחר: פעולות, לא קבצים, שממוזגות עם OT או CRDTs. תזכיר את זה, אבל בראיון על Dropbox התשובה הנכונה היא סנכרון קובץ שלם עם conflicted copies.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Content-defined chunking (better dedup and deltas on inserts) vs fixed-size chunks (simpler, cheaper CPU on mobile, predictable chunk count).",
      he: "Content-defined chunking ‏(dedup ו-deltas טובים יותר בהכנסות) מול chunks בגודל קבוע (פשוט יותר, פחות CPU במובייל, מספר chunks צפוי)." },
    { en: "Cross-user dedup (large storage savings) vs privacy and client-side encryption (dedup only within an account, or not at all).",
      he: "Dedup בין משתמשים (חיסכון גדול באחסון) מול פרטיות והצפנה בצד ה-client ‏(dedup רק בתוך חשבון, או בכלל לא)." },
    { en: "Long-poll (works through every proxy, simple) vs WebSocket (lower overhead, bidirectional) vs mobile push (battery-friendly but delayed and best-effort).",
      he: "Long-poll (עובר דרך כל proxy, פשוט) מול WebSocket ‏(פחות overhead, דו-כיווני) מול push במובייל (חוסך סוללה אבל מתעכב ו-best-effort)." },
    { en: "Conflicted copies (never lose data, user merges) vs last-writer-wins (clean UX, silently loses edits) vs real-time OT/CRDT (great UX, only for formats you understand).",
      he: "Conflicted copies (לא מאבדים דאטה, המשתמש ממזג) מול last-writer-wins ‏(UX נקי, מאבד עריכות בשקט) מול OT או CRDT בזמן אמת ‏(UX מעולה, רק לפורמטים שאתה מבין)." },
    { en: "Sharding metadata by namespace (simple serializable commits) vs a global transactional store like Spanner (cross-namespace moves are atomic, but more cost and latency).",
      he: "Sharding של metadata לפי namespace ‏(commits פשוטים ו-serializable) מול store טרנזקציוני גלובלי כמו Spanner (הזזות בין namespaces אטומיות, אבל יותר עלות ו-latency)." }
  ],
  followUps: [
    { q: { en: "A user moves a 200 GB folder from their private space into a shared folder. What happens?",
           he: "משתמש מזיז תיקייה של 200GB מהמרחב הפרטי שלו לתוך תיקייה משותפת. מה קורה?" },
      a: { en: "No bytes move — blocks are content-addressed and shared. Only metadata changes, but it crosses namespaces (possibly shards): delete entries in ns A, add entries in ns B. Do it as an idempotent, resumable background job with a saga (mark 'moving', copy entries in batches, flip, delete source), or use a cross-shard transactional store for this case. Clients see the move via both journals.",
           he: "שום בייט לא זז — ה-blocks ממוענים לפי תוכן ומשותפים. רק ה-metadata משתנה, אבל הוא חוצה namespaces (ואולי shards): מוחקים רשומות ב-ns A ומוסיפים ב-ns B. עושים את זה כ-job ברקע אידמפוטנטי שאפשר לחדש, עם saga (מסמנים 'בהזזה', מעתיקים רשומות ב-batches, מחליפים, מוחקים את המקור), או משתמשים ב-store טרנזקציוני בין shards למקרה הזה. ה-clients רואים את ההזזה דרך שני ה-journals." } },
    { q: { en: "How do you garbage-collect chunks safely when they're shared across millions of files?",
           he: "איך עושים garbage collection ל-chunks בבטחה כשהם משותפים למיליוני קבצים?" },
      a: { en: "Refcounts are fragile (a lost decrement leaks, a double decrement deletes live data). Safer: mark-and-sweep — periodically scan all live blocklists (from metadata snapshots) into a set, and delete blocks not in it that are older than a grace period (e.g. 7 days, longer than any in-flight upload or retention window). Combine: refcount for a quick candidate list, sweep to confirm, soft-delete with a delay before physically freeing.",
           he: "Refcounts שבירים (decrement שהלך לאיבוד דולף, ‏decrement כפול מוחק דאטה חי). בטוח יותר: mark-and-sweep — סורקים מדי פעם את כל ה-blocklists החיים (מ-snapshots של metadata) לתוך set, ומוחקים blocks שלא בו וגם ישנים מ-grace period (למשל 7 ימים, יותר מכל upload בתהליך או חלון retention). משלבים: refcount בשביל רשימת מועמדים מהירה, sweep בשביל אישור, ו-soft delete עם השהיה לפני שמשחררים פיזית." } },
    { q: { en: "How do you sync a 50 GB VM image where only a few MB change daily?",
           he: "איך מסנכרנים image של VM בגודל 50GB שרק כמה MB בו משתנים כל יום?" },
      a: { en: "Content-defined chunking means only the chunks around changed regions get new hashes, so the client uploads a few MB. Hashing 50 GB on every change is the real cost — keep a local chunk cache keyed by (inode, mtime, offset) and only re-hash ranges the filesystem reports changed, or use rsync-style rolling checksums for in-place edits. Upload chunks in parallel with resumable sessions.",
           he: "Content-defined chunking אומר שרק ה-chunks סביב האזורים שהשתנו מקבלים hashes חדשים, אז ה-client מעלה כמה MB. העלות האמיתית היא hashing של 50GB על כל שינוי — מחזיקים cache מקומי של chunks לפי (inode, mtime, offset) ועושים hash מחדש רק לטווחים שה-filesystem מדווח שהשתנו, או משתמשים ב-rolling checksums בסגנון rsync לעריכות במקום. מעלים chunks במקביל עם sessions שאפשר לחדש." } },
    { q: { en: "Downloads of a viral shared link are melting a storage node. Fix it.",
           he: "Downloads של לינק משותף שהפך ויראלי ממיסים node של אחסון. תתקן." },
      a: { en: "Blocks are immutable, so put a CDN in front of block GETs with a long TTL keyed by hash (access checked by a signed URL, short-lived). Add a hot-block cache tier in the block service, rate-limit per link, and for extreme cases replicate hot blocks to more nodes. Never let one link's popularity hit the erasure-coded cold tier directly.",
           he: "ה-blocks הם immutable, אז שמים CDN לפני ה-GETs של blocks עם TTL ארוך לפי hash (ההרשאה נבדקת ב-signed URL קצר מועד). מוסיפים שכבת cache ל-blocks חמים ב-block service, ‏rate limit לכל לינק, ובמקרים קיצוניים משכפלים blocks חמים ליותר nodes. אף פעם לא נותנים לפופולריות של לינק אחד לפגוע ישירות בשכבה הקרה עם erasure coding." } }
  ],
  related: ["algo-similarity-dedup", "s3-deep", "pr-checksums-hashing", "pr-realtime-protocols", "db-sharding", "pr-idempotency"]
});

/* ------------------------------------------------------------------ */
/* 2. Distributed key-value store (Dynamo-style)                        */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-kv-store", icon: "🗝️", level: 3,
  title: { en: "Design a distributed key-value store (Dynamo-style)", he: "תכנון key-value store מבוזר (בסגנון Dynamo)" },
  prompt: {
    en: "Design a highly available, horizontally scalable key-value store in the spirit of Amazon's Dynamo paper, Cassandra or Riak: get(key) and put(key, value), 100 TB of data, hundreds of thousands of operations per second, always writable even during node failures and network partitions. Explain partitioning, replication, quorums, conflict resolution, failure detection and the storage engine.",
    he: "תתכנן key-value store זמין מאוד שגדל אופקית, ברוח המאמר של Dynamo מ-Amazon, ‏Cassandra או Riak: ‏get(key) ו-put(key, value), ‏100TB של דאטה, מאות אלפי פעולות בשנייה, ותמיד אפשר לכתוב אליו גם כש-nodes נופלים ויש network partitions. תסביר partitioning, ‏replication, ‏quorums, פתרון conflicts, זיהוי תקלות וה-storage engine."
  },
  clarify: [
    { en: "Data size, key/value sizes and read/write mix? (assume 100 TB, keys ~50 B, values ~1-10 KB, 1M reads/s and 500K writes/s peak)",
      he: "גודל הדאטה, גודל keys ו-values ויחס קריאות לכתיבות? (נניח 100TB, ‏keys של ~50B, ‏values של ~1-10KB, ‏1M קריאות ו-500K כתיבות בשנייה ב-peak)" },
    { en: "Which matters more under a partition: availability (always accept writes) or consistency (reject rather than diverge)? Should it be tunable per request?",
      he: "מה חשוב יותר כשיש partition: זמינות (תמיד לקבל כתיבות) או consistency (לדחות במקום להתפצל)? צריך שזה יהיה tunable לכל בקשה?" },
    { en: "Is last-writer-wins acceptable, or do clients need to see and merge concurrent versions (shopping-cart style)?",
      he: "Last-writer-wins מקובל, או שה-clients צריכים לראות ולמזג גרסאות מקבילות (בסגנון עגלת קניות)?" },
    { en: "Do we need range scans or secondary indexes, or only point lookups by key?",
      he: "צריך range scans או secondary indexes, או רק point lookups לפי key?" },
    { en: "Single region or multi-region active-active? Latency target (p99 &lt; 10 ms in-region)?",
      he: "Region אחד או multi-region ב-active-active? מה יעד ה-latency ‏(p99 מתחת ל-10ms בתוך region)?" }
  ],
  functional: [
    { en: "get(key) returns the value (or concurrent sibling versions with their context); put(key, value, context) and delete(key).",
      he: "get(key) מחזיר את הערך (או גרסאות sibling מקבילות עם ה-context שלהן); ‏put(key, value, context) ו-delete(key)." },
    { en: "Per-request tunable consistency: choose R and W (ONE, QUORUM, ALL) per call.",
      he: "Consistency שאפשר לכוונן לכל בקשה: בוחרים R ו-W ‏(ONE, ‏QUORUM, ‏ALL) לכל קריאה." },
    { en: "Optional TTL per key; tombstones for deletes.",
      he: "TTL אופציונלי לכל key; ‏tombstones למחיקות." },
    { en: "Add/remove nodes online with automatic data rebalancing.",
      he: "הוספה והסרה של nodes אונליין עם איזון דאטה אוטומטי." }
  ],
  nonFunctional: [
    { en: "Always writable: a write succeeds as long as any W healthy nodes are reachable (sloppy quorum).",
      he: "תמיד אפשר לכתוב: כתיבה מצליחה כל עוד יש W ‏nodes בריאים שאפשר להגיע אליהם (sloppy quorum)." },
    { en: "p99 under 10 ms for get/put at QUORUM in-region; linear scale-out.",
      he: "p99 מתחת ל-10ms ל-get ול-put ב-QUORUM בתוך region; ‏scale-out לינארי." },
    { en: "Durability: RF=3 across 3 AZs; no acknowledged write lost with one AZ down.",
      he: "עמידות: RF=3 על 3 AZs; שום כתיבה שאושרה לא הולכת לאיבוד כש-AZ אחד נופל." },
    { en: "Fully decentralized: no single master, every node can coordinate any request.",
      he: "מבוזר לגמרי: אין master יחיד, כל node יכול לתאם כל בקשה." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Storage</strong>: 100 TB × RF 3 = 300 TB. LSM compaction needs free space (size-tiered up to 2x, leveled ~10-20%), so keep nodes at ≤ 50% disk. Nodes with 4 TB NVMe → 2 TB data each → <strong>~150 nodes</strong> (50 per AZ).</li>
<li><strong>Writes</strong>: 500K puts/s × 3 replicas = 1.5M replica writes/s ÷ 150 ≈ <strong>10K writes/s per node</strong> — easy for an LSM (sequential commit log + memtable; a node can do 50K+).</li>
<li><strong>Reads</strong>: 1M gets/s at QUORUM (R=2) = 2M replica reads/s ÷ 150 ≈ <strong>13K reads/s per node</strong>. With a bloom filter (~1% false positives) most reads touch 1-2 SSTables; NVMe does 500K+ random IOPS, so the bottleneck is CPU and compaction, not disk.</li>
<li><strong>Network</strong>: 500K × 3 KB avg × 3 = 4.5 GB/s of replica writes + 2M × 3 KB = 6 GB/s reads (digest reads cut this) ≈ <strong>70 MB/s per node</strong>, fine on 10-25 Gbps. Cross-AZ traffic is the real bill.</li>
<li><strong>Ring</strong>: 150 nodes × 16 vnodes = 2,400 token ranges. Gossip: each node gossips with 1-3 peers per second; state spreads in ~log₂(150) ≈ 7-8 rounds → <strong>under 10 s</strong> cluster-wide.</li>
<li><strong>Rebuild</strong>: replacing a dead node streams 2 TB; with vnodes, ~all peers send in parallel at ~100 MB/s each (throttled) → ~1-2 hours instead of a day from 2 neighbors.</li>
</ul>`,
    he: `<ul>
<li><strong>אחסון</strong>: ‏100TB × RF 3 = 300TB. ‏Compaction ב-LSM צריך מקום פנוי (size-tiered עד פי 2, ‏leveled בערך 10-20%), אז שומרים nodes עד 50% דיסק. ‏Nodes עם 4TB NVMe ← ‏2TB דאטה לכל אחד ← <strong>~150 nodes</strong> ‏(50 בכל AZ).</li>
<li><strong>כתיבות</strong>: ‏500K puts בשנייה × 3 replicas = 1.5M כתיבות replica בשנייה ÷ 150 ≈ <strong>10K כתיבות בשנייה ל-node</strong> — קל ל-LSM ‏(commit log סדרתי ו-memtable; ‏node מחזיק 50K+).</li>
<li><strong>קריאות</strong>: ‏1M gets בשנייה ב-QUORUM ‏(R=2) = 2M קריאות replica בשנייה ÷ 150 ≈ <strong>13K קריאות בשנייה ל-node</strong>. עם bloom filter ‏(~1% false positives) רוב הקריאות נוגעות ב-1-2 SSTables; ‏NVMe עושה 500K+ random IOPS, אז צוואר הבקבוק הוא CPU ו-compaction, לא הדיסק.</li>
<li><strong>רשת</strong>: ‏500K × 3KB בממוצע × 3 = 4.5GB/s כתיבות replica ועוד 2M × 3KB = 6GB/s קריאות (digest reads מקטינים את זה) ≈ <strong>70MB/s ל-node</strong>, בסדר על 10-25Gbps. התעבורה בין AZs היא החשבון האמיתי.</li>
<li><strong>Ring</strong>: ‏150 nodes × 16 vnodes = 2,400 טווחי tokens. ‏Gossip: כל node עושה gossip עם 1-3 שכנים בשנייה; מצב מתפשט בערך ב-log₂(150) ≈ 7-8 סבבים ← <strong>פחות מ-10 שניות</strong> בכל ה-cluster.</li>
<li><strong>Rebuild</strong>: החלפת node מת מזרימה 2TB; עם vnodes כמעט כל השכנים שולחים במקביל בקצב של ~100MB/s כל אחד (עם throttle) ← ‏1-2 שעות במקום יום משני שכנים.</li>
</ul>`
  },
  api: `get(key, consistency=QUORUM)          -> {values: [v1, v2?], context: opaque_vector_clock}
put(key, value, context?, consistency=QUORUM, ttl?) -> ok | UnavailableException(needed=W, alive=k)
delete(key, context?)                  -> ok   (writes a tombstone)

Wire: any node is a coordinator; client either uses a token-aware driver
(sends to a replica directly) or a random node that forwards.

Internal (node to node):
  Replicate(key, value, version)       Read(key) / ReadDigest(key) -> hash
  Hint(target_node, mutation)          MerkleTreeRequest(token_range) -> tree
  Gossip(SYN digest) -> ACK -> ACK2    Stream(token_range) for bootstrap/repair`,
  dataModel: `Ring: token space 0 .. 2^64-1 (Murmur3 hash of key)
  each node owns V vnodes (e.g. 16) = V random tokens; a key belongs to the first vnode clockwise
  preference list(key) = next N distinct physical nodes clockwise, in N distinct AZs

On each node (LSM):
  commit log (append, fsync per batch ~10 ms)  ->  memtable (sorted, in RAM, ~256 MB)
  -> flush -> SSTables (immutable sorted files) + bloom filter + sparse index per SSTable
  compaction: leveled (read-heavy) or size-tiered (write-heavy)
Row on disk: key | version (vector clock or timestamp) | value | ttl | tombstone flag
Hints table: (target_node, key, mutation, created_at)  -- expire after ~3 h
Merkle tree per token range: leaves = hash(rows in sub-range), depth ~15`,
  diagram: `                     client (token-aware driver)
                            |  put(k)
                            v
            hash(k) -> token 0x7A..  -> preference list [B, C, D]
           .------------------------------------------.
         .'   A(az-a)      B(az-b)*coordinator         '.
        /                     |                         \\
       |  F(az-c)        replicate to N=3        C(az-c) |
       |                 /     |      \\                  |
        \\    E(az-b)    v      v       v      D(az-a)  /
         '.            B      C     D (down!) -> hint  .'
           '------------------------------------------'
   W=2: ack after B and C  |  D down -> sloppy quorum: write to E with
   hint "for D"; E hands it off when gossip says D is back

   per node:  commit log -> memtable -> SSTables (L0..L3) + bloom filters
   background: gossip (1/s), anti-entropy Merkle repair, compaction`,
  deepDives: [
    {
      h: { en: "Partitioning: consistent hashing with virtual nodes", he: "Partitioning: ‏consistent hashing עם virtual nodes" },
      body: {
        en: `<p>Hash keys onto a ring (Murmur3, 64-bit). Each node owns positions on the ring; a key goes to the first node clockwise and is replicated to the next N−1 <em>distinct physical nodes</em>, skipping nodes in an AZ already used. Adding a node takes over only neighbours' ranges — ~1/N of the data moves, versus almost everything with <code>hash % N</code>.</p>
<p>One token per node gives lumpy ownership (some nodes 2x others) and a bootstrap that streams from only 2 neighbours. <strong>Virtual nodes</strong> give each physical node V random tokens: ownership evens out, heterogeneous hardware gets more vnodes, and rebuilds stream from many peers in parallel. Too many vnodes (Cassandra's old default of 256) hurts repair and availability math; modern guidance is 8-16 with a token allocation algorithm.</p>
<blockquote>⚠️ Hot keys are not fixed by consistent hashing: one celebrity key still lands on N nodes. Fix at the application level (key salting, client-side caching) or with request coalescing on the coordinator.</blockquote>`,
        he: `<p>עושים hash ל-keys על ring ‏(Murmur3, ‏64 ביט). כל node מחזיק נקודות על ה-ring; ‏key הולך ל-node הראשון עם כיוון השעון ומשוכפל ל-N−1 <em>ה-nodes הפיזיים השונים</em> הבאים, תוך דילוג על nodes ב-AZ שכבר בשימוש. הוספת node לוקחת רק טווחים של השכנים — זז בערך 1/N מהדאטה, לעומת כמעט הכל עם <code>hash % N</code>.</p>
<p>Token אחד לכל node נותן חלוקה לא אחידה (חלק מה-nodes מחזיקים פי 2 מאחרים) ו-bootstrap שמזרים רק משני שכנים. <strong>Virtual nodes</strong> נותנים לכל node פיזי V ‏tokens אקראיים: החלוקה מתאזנת, חומרה חזקה יותר מקבלת יותר vnodes, ו-rebuilds מזרימים מהרבה שכנים במקביל. יותר מדי vnodes (ברירת המחדל הישנה של Cassandra הייתה 256) פוגע ב-repair ובחישובי זמינות; ההמלצה היום היא 8-16 עם אלגוריתם הקצאת tokens.</p>
<blockquote>⚠️ Consistent hashing לא פותר hot keys: ‏key של סלבריטי עדיין נוחת על N ‏nodes. מתקנים ברמת האפליקציה (salting של key, ‏cache בצד ה-client) או עם request coalescing ב-coordinator.</blockquote>`
      }
    },
    {
      h: { en: "Replication with N/R/W quorums, sloppy quorum and hinted handoff", he: "Replication עם quorums של N/R/W, ‏sloppy quorum ו-hinted handoff" },
      body: {
        en: `<p>The coordinator sends every write to all N replicas and acks after <strong>W</strong> respond; reads ask R replicas (often one full read + R−1 digest reads) and return the newest. If <strong>R + W &gt; N</strong>, read and write sets overlap, so a read sees the latest acked write (absent concurrent writes and sloppy quorums). Common settings with N=3: W=2,R=2 (balanced), W=1,R=3 (fast writes), W=3,R=1 (fast reads, but one dead node blocks writes). Cassandra's <code>LOCAL_QUORUM</code> = quorum inside the local DC only.</p>
<p><strong>Sloppy quorum</strong>: if a preference-list node is down, write to the next healthy node on the ring with a <strong>hint</strong> ("this belongs to D"). When gossip marks D alive again, the hint is handed off. Availability goes up, but R+W&gt;N no longer guarantees overlap — the write lives on E, not on the nodes a reader asks. Hints expire (~3 h), so long outages need full repair.</p>
<p><strong>Read repair</strong>: if replicas disagree during a read, the coordinator writes the newest version back to the stale ones — cheap convergence for hot keys.</p>`,
        he: `<p>ה-coordinator שולח כל כתיבה לכל N ה-replicas ומאשר אחרי ש-<strong>W</strong> ענו; קריאות שואלות R ‏replicas (לרוב קריאה מלאה אחת ועוד R−1 קריאות digest) ומחזירות את החדשה ביותר. אם <strong>R + W &gt; N</strong>, קבוצות הקריאה והכתיבה חופפות, אז קריאה רואה את הכתיבה האחרונה שאושרה (כשאין כתיבות מקבילות ו-sloppy quorums). הגדרות נפוצות עם N=3: ‏W=2,R=2 (מאוזן), ‏W=1,R=3 (כתיבות מהירות), ‏W=3,R=1 (קריאות מהירות, אבל node מת אחד חוסם כתיבות). ב-Cassandra ‏<code>LOCAL_QUORUM</code> הוא quorum רק בתוך ה-DC המקומי.</p>
<p><strong>Sloppy quorum</strong>: אם node ברשימת ההעדפה למטה, כותבים ל-node הבריא הבא על ה-ring עם <strong>hint</strong> ‏("זה שייך ל-D"). כש-gossip מסמן ש-D חזר, ה-hint מועבר אליו. הזמינות עולה, אבל R+W&gt;N כבר לא מבטיח חפיפה — הכתיבה יושבת על E, לא על ה-nodes שקורא ישאל. ‏Hints פגים (~3 שעות), אז השבתות ארוכות דורשות repair מלא.</p>
<p><strong>Read repair</strong>: אם ה-replicas לא מסכימים בזמן קריאה, ה-coordinator כותב את הגרסה החדשה ביותר בחזרה לישנים — התכנסות זולה ל-keys חמים.</p>`
      }
    },
    {
      h: { en: "Conflict resolution: vector clocks vs last-writer-wins", he: "פתרון conflicts: ‏vector clocks מול last-writer-wins" },
      body: {
        en: `<p>With W &lt; N and sloppy quorums, two clients can write the same key concurrently on different replicas. <strong>LWW</strong> (Cassandra) attaches a timestamp and keeps the highest — simple, but clock skew silently drops writes, and "concurrent" is decided by whoever's clock is ahead.</p>
<p><strong>Vector clocks</strong> (Dynamo, Riak) attach a list of <code>(node, counter)</code>. Version A descends from B if every counter in A ≥ B; otherwise they're <strong>concurrent siblings</strong> and both are kept. The next <code>get</code> returns both plus a merged context; the client merges (union of cart items) and writes back, collapsing the siblings. Downsides: clocks grow (prune oldest entries past ~10), and clients must implement merge logic. <strong>CRDTs</strong> (counters, sets, maps) make the merge automatic and are Riak's modern answer.</p>
<p>Interview answer: offer LWW for most data (idempotent overwrites, per-column timestamps), vector clocks/CRDTs where lost updates are unacceptable, and conditional writes via a consensus path (Cassandra's Paxos-based LWT) when you need compare-and-set.</p>`,
        he: `<p>עם W &lt; N ו-sloppy quorums, שני clients יכולים לכתוב לאותו key במקביל על replicas שונים. ‏<strong>LWW</strong> ‏(Cassandra) מצמיד timestamp ושומר את הגבוה ביותר — פשוט, אבל clock skew מפיל כתיבות בשקט, ומי "מקבילי" נקבע לפי של מי השעון מקדים.</p>
<p><strong>Vector clocks</strong> ‏(Dynamo, ‏Riak) מצמידים רשימה של <code>(node, counter)</code>. גרסה A יורדת מ-B אם כל counter ב-A ≥ B; אחרת הן <strong>siblings מקבילים</strong> ושתיהן נשמרות. ה-<code>get</code> הבא מחזיר את שתיהן ועוד context ממוזג; ה-client ממזג (איחוד פריטי העגלה) וכותב בחזרה, מה שמקפל את ה-siblings. חסרונות: השעונים גדלים (חותכים את הרשומות הישנות מעבר ל-~10), וה-clients חייבים לממש לוגיקת מיזוג. ‏<strong>CRDTs</strong> ‏(counters, ‏sets, ‏maps) הופכים את המיזוג לאוטומטי והם התשובה המודרנית של Riak.</p>
<p>תשובה בראיון: מציעים LWW לרוב הדאטה (דריסות אידמפוטנטיות, timestamps לכל עמודה), ‏vector clocks או CRDTs איפה שאסור לאבד עדכונים, ו-conditional writes דרך מסלול consensus ‏(LWT של Cassandra שמבוסס Paxos) כשצריך compare-and-set.</p>`
      }
    },
    {
      h: { en: "Failure detection and anti-entropy: gossip + Merkle trees", he: "זיהוי תקלות ו-anti-entropy: ‏gossip ועוד Merkle trees" },
      body: {
        en: `<p><strong>Gossip</strong>: every second each node exchanges a digest of (node, generation, heartbeat version, status, tokens) with 1-3 random peers. Information spreads epidemically in O(log N) rounds with no central coordinator. Failure detection uses the <strong>phi accrual detector</strong>: instead of a fixed timeout it computes a suspicion level from the heartbeat inter-arrival history (Cassandra's <code>phi_convict_threshold</code> default 8). "Down" only stops routing to a node; removing it from the ring is an explicit operator action, so a flapping node doesn't trigger massive data movement.</p>
<p><strong>Anti-entropy</strong>: hinted handoff and read repair miss data (expired hints, keys never read). Periodic repair builds a <strong>Merkle tree</strong> per token range on each replica — leaves hash slices of rows, parents hash children. Replicas compare roots; equal → done; different → descend only into differing branches and stream just those ranges. Comparing 2 TB costs a few KB of hashes when replicas mostly agree.</p>
<blockquote>⚠️ Run full repair more often than <code>gc_grace_seconds</code> (default 10 days). Otherwise a tombstone is compacted away before reaching a replica that missed the delete, and the deleted data "resurrects" on the next repair.</blockquote>`,
        he: `<p><strong>Gossip</strong>: כל שנייה כל node מחליף digest של (node, ‏generation, ‏heartbeat version, סטטוס, ‏tokens) עם 1-3 שכנים אקראיים. המידע מתפשט כמו מגפה ב-O(log N) סבבים בלי coordinator מרכזי. זיהוי תקלות משתמש ב-<strong>phi accrual detector</strong>: במקום timeout קבוע הוא מחשב רמת חשד מההיסטוריה של הזמנים בין heartbeats (ב-Cassandra ‏<code>phi_convict_threshold</code> ברירת מחדל 8). "Down" רק מפסיק לנתב ל-node; הוצאה שלו מה-ring היא פעולה מפורשת של operator, כדי ש-node שמהבהב לא יגרום להזזת דאטה מסיבית.</p>
<p><strong>Anti-entropy</strong>: ‏hinted handoff ו-read repair מפספסים דאטה (hints שפגו, keys שאף פעם לא נקראו). ‏Repair תקופתי בונה <strong>Merkle tree</strong> לכל טווח tokens בכל replica — העלים עושים hash לפרוסות שורות, וההורים עושים hash לילדים. ה-replicas משווים שורשים; שווים ← סיימנו; שונים ← יורדים רק לענפים השונים ומזרימים רק את הטווחים האלה. השוואה של 2TB עולה כמה KB של hashes כשה-replicas ברובם מסכימים.</p>
<blockquote>⚠️ מריצים repair מלא בתדירות גבוהה מ-<code>gc_grace_seconds</code> (ברירת מחדל 10 ימים). אחרת tombstone נמחק ב-compaction לפני שהגיע ל-replica שפספס את המחיקה, והדאטה המחוק "קם לתחייה" ב-repair הבא.</blockquote>`
      }
    },
    {
      h: { en: "Storage engine: why LSM trees", he: "Storage engine: למה LSM trees" },
      body: {
        en: `<p>A write is an append to the <strong>commit log</strong> (fsync batched every ~10 ms) and an insert into the in-memory <strong>memtable</strong>; when the memtable reaches ~256 MB it's flushed as an immutable sorted <strong>SSTable</strong>. No random writes, no read-before-write — ideal for write-heavy replicated workloads where every logical write happens 3 times.</p>
<p>Reads check memtable, then SSTables newest-first; each SSTable has a <strong>bloom filter</strong> (~10 bits/key → ~1% false positives) so most SSTables are skipped without I/O. <strong>Compaction</strong> merges SSTables, dropping overwritten values and expired tombstones: <em>leveled</em> (bounded read amplification, ~10x write amplification — reads), <em>size-tiered</em> (lower write amp, up to 2x space — writes), <em>time-window</em> (TTL'd time-series — drop whole files).</p>`,
        he: `<p>כתיבה היא append ל-<strong>commit log</strong> ‏(fsync ב-batch כל ~10ms) ו-insert ל-<strong>memtable</strong> שבזיכרון; כשה-memtable מגיע ל-~256MB הוא נשפך ל-<strong>SSTable</strong> ממוין ו-immutable. אין כתיבות אקראיות, אין read-before-write — אידיאלי לעומסי כתיבה משוכפלים שבהם כל כתיבה לוגית קורית 3 פעמים.</p>
<p>קריאות בודקות את ה-memtable, ואז SSTables מהחדש לישן; לכל SSTable יש <strong>bloom filter</strong> ‏(~10 ביט ל-key ← בערך 1% false positives) כך שרוב ה-SSTables מדולגים בלי I/O. ‏<strong>Compaction</strong> ממזג SSTables, וזורק ערכים שנדרסו ו-tombstones שפגו: <em>leveled</em> ‏(read amplification חסום, ‏write amplification של ~10x — לקריאות), <em>size-tiered</em> ‏(write amp נמוך יותר, עד פי 2 מקום — לכתיבות), <em>time-window</em> ‏(time-series עם TTL — זורקים קבצים שלמים).</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Leaderless quorums (always writable, no failover pause) vs leader-per-shard with Raft (linearizable, simpler reasoning, brief unavailability on leader loss).",
      he: "Quorums בלי leader (תמיד אפשר לכתוב, בלי השהיית failover) מול leader לכל shard עם Raft ‏(linearizable, קל יותר להבין, חוסר זמינות קצר כשה-leader נופל)." },
    { en: "LWW (simple, silently loses concurrent writes, depends on clocks) vs vector clocks/CRDTs (no lost updates, siblings and merge logic in clients).",
      he: "LWW (פשוט, מאבד בשקט כתיבות מקבילות, תלוי בשעונים) מול vector clocks או CRDTs (בלי עדכונים אבודים, ‏siblings ולוגיקת מיזוג ב-clients)." },
    { en: "Sloppy quorum + hinted handoff (higher write availability) vs strict quorum (R+W&gt;N actually guarantees overlap).",
      he: "Sloppy quorum עם hinted handoff (זמינות כתיבה גבוהה יותר) מול strict quorum ‏(R+W&gt;N באמת מבטיח חפיפה)." },
    { en: "More vnodes (even load, parallel rebuild) vs fewer vnodes (cheaper repair, fewer ranges to lose when 2 nodes die at once).",
      he: "יותר vnodes (עומס אחיד, ‏rebuild מקבילי) מול פחות vnodes ‏(repair זול יותר, פחות טווחים שהולכים לאיבוד כששני nodes מתים ביחד)." },
    { en: "Leveled compaction (read-optimized, more write amplification) vs size-tiered (write-optimized, more space and read amplification).",
      he: "Leveled compaction ‏(מותאם לקריאות, יותר write amplification) מול size-tiered ‏(מותאם לכתיבות, יותר מקום ו-read amplification)." }
  ],
  followUps: [
    { q: { en: "N=3, W=2, R=2. Can a client read a stale value right after its own successful write?",
           he: "N=3, ‏W=2, ‏R=2. ‏client יכול לקרוא ערך ישן מיד אחרי כתיבה מוצלחת שלו?" },
      a: { en: "With strict quorums, no: any 2 of 3 overlap the 2 that acked. But yes if a sloppy quorum put the write on a substitute node, if a concurrent write with a higher timestamp won under LWW, or if the coordinator's clock was behind. Also, a failed write (only 1 ack) may still be on one replica and appear later — quorums are not transactions. For read-your-writes, route a session's reads through the same coordinator or use a consensus path.",
           he: "עם strict quorums, לא: כל 2 מתוך 3 חופפים ל-2 שאישרו. אבל כן אם sloppy quorum שם את הכתיבה על node מחליף, אם כתיבה מקבילה עם timestamp גבוה יותר ניצחה ב-LWW, או אם השעון של ה-coordinator פיגר. בנוסף, כתיבה שנכשלה (רק ack אחד) עדיין יכולה לשבת על replica אחד ולהופיע אחר כך — quorums הם לא טרנזקציות. בשביל read-your-writes מנתבים את הקריאות של session דרך אותו coordinator או משתמשים במסלול consensus." } },
    { q: { en: "Two nodes in different AZs die at the same time. Is any data lost or unavailable?",
           he: "שני nodes ב-AZs שונים מתים באותו זמן. יש דאטה שאבד או לא זמין?" },
      a: { en: "Not lost: every key has 3 replicas in 3 AZs, so at least one survives. Unavailable at QUORUM: keys whose replica set includes both dead nodes have only 1 live replica — W=2 and R=2 fail for those ranges. With many vnodes, almost every pair of nodes shares some range, so some keys are affected; with fewer vnodes, fewer pairs share ranges. Clients can downgrade to ONE for availability, at the cost of consistency.",
           he: "לא אבד: לכל key יש 3 replicas ב-3 AZs, אז לפחות אחד שרד. לא זמין ב-QUORUM: ‏keys שקבוצת ה-replicas שלהם כוללת את שני ה-nodes המתים נשארו עם replica חי אחד — W=2 ו-R=2 נכשלים לטווחים האלה. עם הרבה vnodes כמעט כל זוג nodes חולק טווח כלשהו, אז חלק מה-keys מושפעים; עם פחות vnodes פחות זוגות חולקים טווחים. ‏Clients יכולים לרדת ל-ONE בשביל זמינות, במחיר של consistency." } },
    { q: { en: "How would you add multi-region active-active?",
           he: "איך היית מוסיף multi-region ב-active-active?" },
      a: { en: "Replicate each key to N replicas per region (NetworkTopologyStrategy, e.g. 3+3), use LOCAL_QUORUM so requests never wait on cross-region RTT (~70-150 ms), and replicate asynchronously between regions. Conflicts across regions are resolved by LWW or CRDTs; a region outage loses only the replication lag window. Anything needing global uniqueness (usernames, balances) goes through a separate consensus or single-home path.",
           he: "משכפלים כל key ל-N ‏replicas בכל region ‏(NetworkTopologyStrategy, למשל 3+3), משתמשים ב-LOCAL_QUORUM כדי שבקשות לא יחכו ל-RTT בין regions ‏(~70-150ms), ומשכפלים בין regions בצורה אסינכרונית. ‏Conflicts בין regions נפתרים ב-LWW או CRDTs; נפילת region מאבדת רק את חלון ה-replication lag. כל מה שצריך ייחודיות גלובלית (usernames, יתרות) עובר במסלול נפרד של consensus או single-home." } }
  ],
  related: ["db-wide-column-kv", "db-storage-engines", "staff-consensus-consistency", "consistent-hashing", "db-cap", "staff-time-ordering"]
});

/* ------------------------------------------------------------------ */
/* 3. Object storage (S3-like)                                          */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-object-storage", icon: "🪣", level: 3,
  title: { en: "Design an object storage service (S3-like)", he: "תכנון שירות object storage (בסגנון S3)" },
  prompt: {
    en: "Design an S3-compatible object storage service: buckets, PUT/GET/DELETE/LIST of objects from bytes up to 5 TB, 11 nines of durability, strong read-after-write consistency, and a cost per GB low enough to store hundreds of petabytes. Explain the metadata and data planes, erasure coding, placement, multipart upload, garbage collection and tiering.",
    he: "תתכנן שירות object storage שתואם S3: ‏buckets, ‏PUT/GET/DELETE/LIST של objects מכמה בייטים ועד 5TB, ‏11 תשיעיות של עמידות, ‏strong read-after-write consistency, ועלות ל-GB נמוכה מספיק כדי לאחסן מאות petabytes. תסביר את ה-metadata plane וה-data plane, ‏erasure coding, ‏placement, ‏multipart upload, ‏garbage collection ו-tiering."
  },
  clarify: [
    { en: "Scale: total bytes, object count and size distribution? (assume 100 PB, 1 trillion objects, median 20 KB but most bytes in multi-MB objects)",
      he: "סקייל: כמה בייטים בסך הכל, כמה objects ואיך מתפלג הגודל? (נניח 100PB, טריליון objects, חציון 20KB אבל רוב הבייטים ב-objects של כמה MB)" },
    { en: "Request rates: GET/PUT/LIST per second, and per-prefix hot spots (one bucket with 100K req/s)?",
      he: "קצבי בקשות: כמה GET/PUT/LIST בשנייה, והאם יש hot spots לפי prefix ‏(bucket אחד עם 100K בקשות בשנייה)?" },
    { en: "Consistency: strong read-after-write and list-after-write (S3 since Dec 2020), or eventual is OK?",
      he: "Consistency: ‏strong read-after-write ו-list-after-write ‏(S3 מאז דצמבר 2020), או ש-eventual מספיק?" },
    { en: "Durability and availability targets per storage class (Standard 11 nines across 3 AZs, One-Zone, Archive)?",
      he: "יעדי עמידות וזמינות לכל storage class ‏(Standard עם 11 תשיעיות על 3 AZs, ‏One-Zone, ‏Archive)?" },
    { en: "Features in scope: versioning, lifecycle/tiering, object lock (WORM), server-side encryption, cross-region replication?",
      he: "אילו פיצ'רים בפנים: versioning, ‏lifecycle ו-tiering, ‏object lock ‏(WORM), הצפנה בצד השרת, ‏replication בין regions?" }
  ],
  functional: [
    { en: "Bucket CRUD; PUT/GET (with byte ranges)/HEAD/DELETE object; LIST by prefix with pagination.",
      he: "CRUD ל-buckets; ‏PUT/GET ‏(כולל byte ranges)/HEAD/DELETE ל-object; ‏LIST לפי prefix עם pagination." },
    { en: "Multipart upload for large objects (up to 10,000 parts, 5 MB-5 GB each, max object 5 TB).",
      he: "Multipart upload ל-objects גדולים (עד 10,000 parts, כל אחד 5MB-5GB, ‏object מקסימלי 5TB)." },
    { en: "Versioning, delete markers, lifecycle rules (transition to cold tier, expire).",
      he: "Versioning, ‏delete markers, חוקי lifecycle (מעבר לשכבה קרה, פקיעה)." },
    { en: "IAM/bucket policies, presigned URLs, server-side encryption with per-object data keys.",
      he: "IAM ו-bucket policies, ‏presigned URLs, הצפנה בצד השרת עם data key לכל object." }
  ],
  nonFunctional: [
    { en: "Durability 99.999999999% (11 nines) per object per year; survive loss of a full AZ.",
      he: "עמידות של 99.999999999% ‏(11 תשיעיות) לכל object בשנה; לשרוד אובדן של AZ שלם." },
    { en: "Strong read-after-write for PUT/DELETE and LIST; availability 99.99%.",
      he: "Strong read-after-write ל-PUT/DELETE ול-LIST; זמינות 99.99%." },
    { en: "Cost: raw-to-usable overhead ≤ 1.5x for large objects; GET first-byte latency ~10-50 ms.",
      he: "עלות: overhead של דיסק גולמי מול שמיש עד 1.5x ל-objects גדולים; ‏latency של first byte ב-GET בערך 10-50ms." },
    { en: "Throughput scales per prefix (thousands of req/s) and to tens of Tbps aggregate.",
      he: "Throughput שגדל לכל prefix (אלפי בקשות בשנייה) ועד עשרות Tbps במצטבר." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Raw capacity</strong>: 100 PB logical with <strong>8+4 erasure coding</strong> = 1.5x → 150 PB, vs 300 PB with 3x replication. At 80% fill → ~190 PB raw ≈ <strong>9,400 × 20 TB HDDs</strong> ≈ 160 servers with 60 drives each (~1.2 PB per server). Replication would need double: the difference is ~$10M+ of hardware.</li>
<li><strong>Metadata</strong>: 1 trillion objects × ~500 B (key, version, size, etag, placement, ACL) ≈ <strong>500 TB</strong>, ×3 replicas → 1.5 PB on SSD. Metadata is a sharded, consensus-replicated store, not the data disks.</li>
<li><strong>Requests</strong>: 1M GET/s + 200K PUT/s. If ~60% of GETs hit a cache tier, 400K disk reads/s ÷ ~150 random IOPS per HDD ≈ 2,700 drives busy — under the 9,400 we own, but small objects must be packed so one GET = one disk seek.</li>
<li><strong>Durability math</strong>: AFR 1.5% per disk → p(a disk dies in a 1-hour repair window) ≈ 0.015 ÷ 8,760 ≈ 1.7×10<sup>-6</sup>. An 8+4 stripe is lost only if 5 of 12 fragments are gone: after one failure, 4 more of the other 11 within the window ≈ C(11,4)·p<sup>4</sup> ≈ 330 × 8×10<sup>-24</sup> ≈ 3×10<sup>-21</sup>. Independent failures are not the risk — <strong>correlated</strong> ones (a rack, a firmware bug, a bad deploy) are; hence spread fragments 4/4/4 across 3 AZs and roll out software by AZ.</li>
<li><strong>Repair traffic</strong>: ~9,400 × 1.5% ≈ 140 disks fail per year (~3/week). Rebuilding 16 TB of data on one disk reads 8 fragments per lost fragment → ~128 TB of reads; declustered across hundreds of disks at ~50 MB/s each it finishes in ~1-2 hours.</li>
</ul>`,
    he: `<ul>
<li><strong>קיבולת גולמית</strong>: ‏100PB לוגי עם <strong>erasure coding של 8+4</strong> = 1.5x ← ‏150PB, לעומת 300PB עם replication פי 3. ב-80% מילוי ← בערך 190PB גולמי ≈ <strong>9,400 דיסקים של 20TB</strong> ≈ ‏160 שרתים עם 60 דיסקים כל אחד (~1.2PB לשרת). ‏Replication היה דורש פי 2: ההבדל הוא $10M+ של חומרה.</li>
<li><strong>Metadata</strong>: טריליון objects × ~500B ‏(key, גרסה, גודל, ‏etag, ‏placement, ‏ACL) ≈ <strong>500TB</strong>, ×3 replicas ← ‏1.5PB על SSD. ה-metadata הוא store משורד ומשוכפל עם consensus, לא דיסקי הדאטה.</li>
<li><strong>בקשות</strong>: ‏1M GET בשנייה + 200K PUT בשנייה. אם ~60% מה-GETs פוגעים בשכבת cache, ‏400K קריאות דיסק בשנייה ÷ ~150 random IOPS לדיסק HDD ≈ ‏2,700 דיסקים עסוקים — מתחת ל-9,400 שיש לנו, אבל objects קטנים חייבים להיות ארוזים כך ש-GET אחד = seek אחד.</li>
<li><strong>חישוב עמידות</strong>: ‏AFR של 1.5% לדיסק ← ההסתברות שדיסק ימות בחלון repair של שעה ≈ 0.015 ÷ 8,760 ≈ 1.7×10<sup>-6</sup>. ‏stripe של 8+4 אובד רק אם 5 מתוך 12 fragments נעלמו: אחרי תקלה אחת, עוד 4 מתוך 11 האחרים בתוך החלון ≈ C(11,4)·p<sup>4</sup> ≈ 330 × 8×10<sup>-24</sup> ≈ 3×10<sup>-21</sup>. תקלות בלתי תלויות הן לא הסיכון — תקלות <strong>מתואמות</strong> (rack, באג ב-firmware, ‏deploy רע) הן כן; לכן מפזרים fragments ב-4/4/4 על 3 AZs ומגלגלים תוכנה AZ אחרי AZ.</li>
<li><strong>תעבורת repair</strong>: ‏9,400 × 1.5% ≈ 140 דיסקים מתים בשנה (~3 בשבוע). ‏Rebuild של 16TB דאטה מדיסק אחד קורא 8 fragments לכל fragment שאבד ← בערך 128TB של קריאות; מפוזר על מאות דיסקים ב-~50MB/s כל אחד זה נגמר תוך ~1-2 שעות.</li>
</ul>`
  },
  api: `PUT    /{bucket}/{key}            body, Content-MD5, x-amz-checksum-sha256 -> 200 ETag, x-amz-version-id
GET    /{bucket}/{key}            Range: bytes=0-1048575, If-None-Match     -> 200/206/304
HEAD   /{bucket}/{key}            -> size, etag, storage class, version
DELETE /{bucket}/{key}            -> 204 (versioned bucket: adds a delete marker)
GET    /{bucket}?list-type=2&prefix=logs/2026/11/&delimiter=/&continuation-token=...
POST   /{bucket}/{key}?uploads                         -> UploadId
PUT    /{bucket}/{key}?partNumber=7&uploadId=U         -> ETag of part
POST   /{bucket}/{key}?uploadId=U  [{part, etag}...]   -> final ETag ("md5-of-md5s"-10000)
PUT    /{bucket}?lifecycle   rules: transition to COLD after 30d, expire noncurrent after 90d
Auth: SigV4 signed requests or presigned URL (expires <= 7 days)`,
  dataModel: `Metadata plane (sharded by hash(bucket, key-prefix range); each shard = Raft group of 3 across AZs):
  buckets(bucket PK, owner, region, versioning, policy, created_at)
  objects(bucket, key, version_id DESC) ->
      {size, etag, checksum, storage_class, created_at, is_delete_marker,
       chunks: [{chunk_id, offset, length}], encryption: {kms_key_id, wrapped_data_key}}
  multipart_uploads(upload_id, bucket, key, parts: {n -> chunk_id, etag, size}, initiated_at)
  -- key-range partitions split automatically when hot (prefix "logs/2026/11/" -> its own shard)

Data plane:
  chunk_id -> stripe placement: [12 fragments -> (storage_node, disk, extent)] (4 per AZ)
  storage nodes store fragments in large append-only extents (~1 GB), small objects packed
  chunk layout: up to 64 MB per chunk; stripe = 8 data + 4 parity fragments (Reed-Solomon)

GC: chunk refs from metadata; orphan sweep after 24h grace`,
  diagram: `  client (SDK, SigV4)
     |
     v
 +-------------------+     auth (IAM, bucket policy), rate limit per prefix
 | front-end / API   |----------------------------------------------+
 | (stateless, LB)   |                                              |
 +----+---------+----+                                              |
      | 1 metadata lookup/commit                     2 stream bytes  |
      v                                                             v
 +-------------------------------+         +-----------------------------------+
 | METADATA PLANE                |         | DATA PLANE                        |
 | key-range shards, Raft x3     |         | placement svc: pick 12 disks,     |
 | (bucket,key,version)->chunks  |         | 4 per AZ, distinct racks          |
 | strong consistency, LIST      |         |  AZ-a: d1 d2 d3 d4 (data)         |
 +---------------+---------------+         |  AZ-b: d5 d6 d7 d8 (data)         |
                 |                         |  AZ-c: p1 p2 p3 p4 (parity)       |
                 v                         |  RS(8,4): any 8 of 12 rebuild     |
 +-------------------------------+         +----------------+------------------+
 | background: GC, lifecycle,    |<------- repair/scrub ----+
 | tiering to cold (16+4 / tape) |
 +-------------------------------+
 PUT order: write fragments (ack 12, or >= 10 with repair) -> commit metadata -> 200`,
  deepDives: [
    {
      h: { en: "Metadata plane vs data plane", he: "Metadata plane מול data plane" },
      body: {
        en: `<p>Separate them because they scale on different axes. The <strong>data plane</strong> is bytes: immutable chunks on HDDs, measured in PB and Tbps, optimized for cost per GB. The <strong>metadata plane</strong> is the index: <code>(bucket, key, version) → chunk list</code>, measured in trillions of rows and millions of lookups per second, on SSD, and it is where consistency lives.</p>
<p>A PUT streams the body to the data plane first (new chunks, never overwriting), computes checksums end-to-end, and only then commits the metadata row atomically. GET reads metadata (cached aggressively, invalidated on commit) then fetches fragments. Because chunks are immutable and the metadata commit is the single point of truth, an overwrite is just a new pointer — readers see old or new, never a mix.</p>
<p>Partition metadata by <strong>key range</strong> (not hash) so LIST by prefix is a range scan on one or a few shards. Ranges split automatically when hot — this is why S3 scales "per prefix" (3,500 PUT / 5,500 GET per second per prefix partition) and why a sudden spike on a new prefix can briefly see 503 SlowDown while the range splits.</p>`,
        he: `<p>מפרידים ביניהם כי הם גדלים על צירים שונים. ה-<strong>data plane</strong> הוא בייטים: ‏chunks שהם immutable על HDDs, נמדד ב-PB וב-Tbps, ומותאם לעלות ל-GB. ה-<strong>metadata plane</strong> הוא ה-index: ‏<code>(bucket, key, version) → chunk list</code>, נמדד בטריליוני שורות ומיליוני lookups בשנייה, על SSD, ושם חי ה-consistency.</p>
<p>PUT מזרים קודם את ה-body ל-data plane ‏(chunks חדשים, אף פעם לא דורס), מחשב checksums מקצה לקצה, ורק אז עושה commit אטומי לשורת ה-metadata. ‏GET קורא metadata ‏(עם cache אגרסיבי שמתבטל ב-commit) ואז מביא fragments. בגלל שה-chunks הם immutable וה-commit של ה-metadata הוא מקור האמת היחיד, דריסה היא בסך הכל pointer חדש — קוראים רואים ישן או חדש, אף פעם לא ערבוב.</p>
<p>מחלקים metadata לפי <strong>טווח keys</strong> (לא hash) כדי ש-LIST לפי prefix יהיה range scan על shard אחד או כמה. טווחים מתפצלים אוטומטית כשהם חמים — זו הסיבה ש-S3 גדל "לכל prefix" ‏(3,500 PUT ו-5,500 GET בשנייה לכל partition של prefix) ולמה קפיצה פתאומית על prefix חדש יכולה לקבל לרגע 503 SlowDown עד שהטווח מתפצל.</p>`
      }
    },
    {
      h: { en: "Erasure coding vs replication, and placement", he: "Erasure coding מול replication, ו-placement" },
      body: {
        en: `<p><strong>3x replication</strong>: 200% overhead, survives 2 losses, reads hit one copy, repair copies one replica. <strong>Reed-Solomon 8+4</strong>: split a chunk into 8 data fragments, compute 4 parity fragments, store 12 on 12 different disks; <em>any</em> 8 rebuild the data. 50% overhead, survives 4 losses. The cost: a write touches 12 disks, a degraded read or repair must read 8 fragments (8x repair I/O vs 1x), and CPU for encoding (cheap with SIMD).</p>
<p>So use both: small or hot objects replicated (or packed into larger stripes), large and cold data erasure-coded. Wider codes for cold tiers (e.g. 16+4 = 1.25x) trade even more repair cost for cheaper storage. Local Reconstruction Codes (Azure's LRC) add local parity so common single-disk repairs read 6 fragments instead of 12.</p>
<p><strong>Placement</strong>: with 3 AZs, put 4 fragments per AZ on distinct racks/servers. Losing a whole AZ removes exactly 4 → still 8 left, readable, while repair proceeds. Placement is decided by a placement service that tracks disk fill, health and failure domains, and spreads fragments of each stripe across many disks (declustering) so a single disk's rebuild is done by hundreds of peers in parallel.</p>`,
        he: `<p><strong>Replication פי 3</strong>: ‏overhead של 200%, שורד 2 אובדנים, קריאות פוגעות בעותק אחד, ‏repair מעתיק replica אחד. ‏<strong>Reed-Solomon 8+4</strong>: מפצלים chunk ל-8 fragments של דאטה, מחשבים 4 fragments של parity, ושומרים 12 על 12 דיסקים שונים; <em>כל</em> 8 מספיקים לשחזר. ‏overhead של 50%, שורד 4 אובדנים. המחיר: כתיבה נוגעת ב-12 דיסקים, קריאה במצב degraded או repair חייבים לקרוא 8 fragments ‏(פי 8 I/O ב-repair מול פי 1), ו-CPU לקידוד (זול עם SIMD).</p>
<p>אז משתמשים בשניהם: objects קטנים או חמים משוכפלים (או ארוזים ב-stripes גדולים), ודאטה גדול וקר מקבל erasure coding. קודים רחבים יותר לשכבות קרות (למשל 16+4 = 1.25x) מחליפים עוד עלות repair באחסון זול יותר. ‏Local Reconstruction Codes ‏(LRC של Azure) מוסיפים parity מקומי כך ש-repair נפוץ של דיסק אחד קורא 6 fragments במקום 12.</p>
<p><strong>Placement</strong>: עם 3 AZs שמים 4 fragments בכל AZ על racks ושרתים שונים. אובדן AZ שלם מוריד בדיוק 4 ← נשארו 8, אפשר לקרוא, וה-repair ממשיך. את ה-placement מחליט placement service שעוקב אחרי מילוי דיסקים, בריאות ו-failure domains, ומפזר את ה-fragments של כל stripe על הרבה דיסקים (declustering) כך שה-rebuild של דיסק אחד נעשה ע"י מאות שכנים במקביל.</p>`
      }
    },
    {
      h: { en: "Strong consistency, LIST and multipart upload", he: "Strong consistency, ‏LIST ו-multipart upload" },
      body: {
        en: `<p>Each metadata shard is a <strong>Raft group</strong> (3 replicas across AZs). A PUT commit is a Raft write; a GET reads from the leader (or a follower with a read index/lease), so read-after-write is linearizable per key. Front-end metadata caches are the classic source of staleness — S3 solved it with a witness/version check that tells a cache whether its entry is still current, cheaper than going to the leader for everything.</p>
<p><strong>LIST</strong> is a range scan on the key-sorted shard(s), paginated with a continuation token (the last key returned). It's strongly consistent because it reads the same committed index — but it's also the most expensive call, so price it and rate-limit it; customers who list a billion-object bucket every minute need an inventory report instead.</p>
<p><strong>Multipart</strong>: <code>CreateMultipartUpload</code> returns an UploadId; parts are uploaded in parallel (each an independent set of chunks, retryable), and <code>Complete</code> atomically commits the ordered part list as one object. Uncompleted uploads keep consuming storage — lifecycle rule <code>AbortIncompleteMultipartUpload</code> after N days is a must.</p>`,
        he: `<p>כל shard של metadata הוא <strong>Raft group</strong> ‏(3 replicas על AZs שונים). ‏commit של PUT הוא כתיבת Raft; ‏GET קורא מה-leader (או מ-follower עם read index או lease), אז read-after-write הוא linearizable לכל key. ‏Caches של metadata בשכבת ה-front-end הם המקור הקלאסי לדאטה ישן — ב-S3 פתרו את זה עם בדיקת witness/version שאומרת ל-cache אם הרשומה שלו עדיין עדכנית, זול יותר מללכת ל-leader על כל דבר.</p>
<p><strong>LIST</strong> הוא range scan על ה-shards הממוינים לפי key, עם pagination בעזרת continuation token ‏(ה-key האחרון שהוחזר). הוא strongly consistent כי הוא קורא את אותו index שעשה commit — אבל הוא גם הקריאה הכי יקרה, אז מתמחרים אותו ושמים עליו rate limit; לקוחות שעושים list ל-bucket עם מיליארד objects כל דקה צריכים inventory report במקום.</p>
<p><strong>Multipart</strong>: ‏<code>CreateMultipartUpload</code> מחזיר UploadId; ה-parts עולים במקביל (כל אחד סט עצמאי של chunks, אפשר לנסות שוב), ו-<code>Complete</code> עושה commit אטומי לרשימת ה-parts המסודרת בתור object אחד. ‏Uploads שלא הושלמו ממשיכים לצרוך אחסון — חוק lifecycle של <code>AbortIncompleteMultipartUpload</code> אחרי N ימים הוא חובה.</p>`
      }
    },
    {
      h: { en: "Deletes, garbage collection, versioning and tiering", he: "מחיקות, ‏garbage collection, ‏versioning ו-tiering" },
      body: {
        en: `<p>DELETE only removes (or, with versioning, adds a <strong>delete marker</strong> on top of) the metadata entry. Chunks become garbage asynchronously. Because chunk references live in the metadata store, GC is a background job: find chunks no longer referenced by any version or pending multipart upload, wait a grace period (e.g. 24 h — covers in-flight PUTs whose metadata isn't committed yet), then free extents. Storage nodes reclaim space by compacting extents that are mostly dead (rewrite live fragments, drop the extent).</p>
<p><strong>Versioning</strong>: every PUT creates a new <code>version_id</code> (time-ordered, sorted DESC so "latest" is the first row). Overwrites never destroy data — great for ransomware protection with Object Lock, terrible for bills if nobody sets <code>NoncurrentVersionExpiration</code>.</p>
<p><strong>Tiering</strong>: lifecycle rules move objects to cheaper classes — Infrequent Access (same disks, different pricing), wider erasure codes on dense HDDs, or archive (tape/very dense disk, retrieval in minutes to hours). The metadata row keeps the key and changes <code>storage_class</code> and chunk locations; a GET on an archived object returns <code>InvalidObjectState</code> until a restore is requested.</p>`,
        he: `<p>DELETE רק מוחק את רשומת ה-metadata (או, עם versioning, מוסיף מעליה <strong>delete marker</strong>). ה-chunks הופכים לזבל בצורה אסינכרונית. בגלל שההפניות ל-chunks חיות ב-metadata store, ה-GC הוא job ברקע: מוצאים chunks שאף גרסה או multipart upload פתוח כבר לא מפנים אליהם, מחכים grace period (למשל 24 שעות — מכסה PUTs בתהליך שה-metadata שלהם עוד לא עשה commit), ואז משחררים extents. ‏Storage nodes מחזירים מקום ע"י compaction ל-extents שרובם מתים (כותבים מחדש את ה-fragments החיים וזורקים את ה-extent).</p>
<p><strong>Versioning</strong>: כל PUT יוצר <code>version_id</code> חדש (מסודר לפי זמן, ממוין DESC כך ש"האחרון" הוא השורה הראשונה). דריסות אף פעם לא משמידות דאטה — מעולה להגנה מ-ransomware עם Object Lock, נורא לחשבון אם אף אחד לא מגדיר <code>NoncurrentVersionExpiration</code>.</p>
<p><strong>Tiering</strong>: חוקי lifecycle מעבירים objects ל-classes זולים יותר — Infrequent Access (אותם דיסקים, תמחור אחר), קודי erasure רחבים יותר על HDDs צפופים, או archive ‏(tape או דיסק צפוף מאוד, שחזור תוך דקות עד שעות). שורת ה-metadata שומרת את ה-key ומשנה את <code>storage_class</code> ואת מיקומי ה-chunks; ‏GET על object בארכיון מחזיר <code>InvalidObjectState</code> עד שמבקשים restore.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Erasure coding 8+4 (1.5x, survives 4 losses, 8x repair reads, higher small-object latency) vs 3x replication (3x cost, cheap repair and fast reads).",
      he: "Erasure coding של 8+4 ‏(1.5x, שורד 4 אובדנים, פי 8 קריאות ב-repair, ‏latency גבוה יותר ל-objects קטנים) מול replication פי 3 ‏(פי 3 עלות, ‏repair זול וקריאות מהירות)." },
    { en: "Key-range partitioning of metadata (fast prefix LIST, hot-range risk needing splits) vs hash partitioning (even load, LIST becomes scatter-gather).",
      he: "חלוקת metadata לפי טווח keys ‏(LIST מהיר לפי prefix, סיכון לטווח חם שדורש פיצול) מול חלוקה לפי hash (עומס אחיד, ‏LIST הופך ל-scatter-gather)." },
    { en: "Strong consistency via consensus on metadata (correct, extra latency and cache invalidation work) vs eventual consistency (cheaper, but clients see stale LISTs and 404s).",
      he: "Strong consistency עם consensus על ה-metadata ‏(נכון, ‏latency נוסף ועבודת ביטול cache) מול eventual consistency (זול יותר, אבל clients רואים LISTs ישנים ו-404)." },
    { en: "Wide stripes across 3 AZs (survive AZ loss, cross-AZ write traffic on every PUT) vs single-AZ storage classes (cheaper, lose the data if the AZ is destroyed).",
      he: "Stripes רחבים על 3 AZs (שורדים אובדן AZ, תעבורה בין AZs בכל PUT) מול storage classes של AZ אחד (זול יותר, הדאטה אובד אם ה-AZ נהרס)." }
  ],
  followUps: [
    { q: { en: "How do you make billions of 1 KB objects efficient on erasure-coded HDDs?",
           he: "איך הופכים מיליארדי objects של 1KB ליעילים על HDDs עם erasure coding?" },
      a: { en: "Don't erasure-code each tiny object (12 fragments of 85 bytes is absurd). Pack small objects into large append-only extents (Haystack-style): write them first to a replicated SSD/HDD log, then seal extents of ~1 GB and erasure-code the whole extent. Metadata points to (extent, offset, length). A GET is one seek on the disk holding the data fragment (systematic code — data fragments are stored in clear). Deletes leave holes reclaimed by compaction.",
           he: "לא עושים erasure coding לכל object זעיר (12 fragments של 85 בייט זה אבסורד). אורזים objects קטנים ב-extents גדולים שרק מוסיפים אליהם (בסגנון Haystack): כותבים אותם קודם ל-log משוכפל על SSD או HDD, ואז אוטמים extents של ~1GB ועושים erasure coding לכל ה-extent. ה-metadata מצביע על (extent, ‏offset, ‏length). ‏GET הוא seek אחד על הדיסק שמחזיק את fragment הדאטה (קוד systematic — fragments של דאטה נשמרים גלויים). מחיקות משאירות חורים שנאספים ב-compaction." } },
    { q: { en: "How do you detect silent data corruption (bit rot) before a customer reads it?",
           he: "איך מזהים השחתת דאטה שקטה (bit rot) לפני שלקוח קורא אותה?" },
      a: { en: "Checksums at every layer: client sends Content-MD5/SHA-256, front-end verifies, each fragment stores its own CRC, and GET verifies end-to-end. A background scrubber reads every fragment on a schedule (e.g. every 2-4 weeks per disk) and compares checksums; bad fragments are reconstructed from the other 11. Track scrub coverage as an SLO — durability claims are only as good as how recently you verified the bytes.",
           he: "Checksums בכל שכבה: ה-client שולח Content-MD5 או SHA-256, ה-front-end מאמת, כל fragment שומר CRC משלו, ו-GET מאמת מקצה לקצה. ‏scrubber ברקע קורא כל fragment לפי לוח זמנים (למשל כל 2-4 שבועות לכל דיסק) ומשווה checksums; ‏fragments פגומים משוחזרים מה-11 האחרים. עוקבים אחרי כיסוי ה-scrub כ-SLO — הבטחת עמידות טובה רק כמו הפעם האחרונה שאימתת את הבייטים." } },
    { q: { en: "A bucket's metadata shard becomes hot: one prefix gets 50K PUT/s. What happens and what do you do?",
           he: "Shard של metadata של bucket נהיה חם: ‏prefix אחד מקבל 50K PUT בשנייה. מה קורה ומה עושים?" },
      a: { en: "The shard's Raft leader saturates; the system returns 503 SlowDown while the split controller divides the key range (on observed load, by key distribution) and moves halves to new Raft groups — this takes minutes. Meanwhile clients back off exponentially. Advice to the customer: spread writes across prefixes (hash or date-reversed prefixes) rather than one monotonic prefix like logs/2026-11-14T12:00:01.",
           he: "ה-leader של ה-Raft ב-shard נחנק; המערכת מחזירה 503 SlowDown בזמן שה-split controller מחלק את טווח ה-keys (לפי עומס שנמדד ולפי התפלגות ה-keys) ומעביר חצאים ל-Raft groups חדשים — זה לוקח דקות. בינתיים ה-clients עושים backoff אקספוננציאלי. העצה ללקוח: לפזר כתיבות על כמה prefixes ‏(hash או תאריך הפוך) במקום prefix מונוטוני אחד כמו logs/2026-11-14T12:00:01." } }
  ],
  related: ["s3-deep", "raid-levels-deep", "cloud-storage-lifecycle", "staff-consensus-consistency", "disks-hdd-ssd-nvme", "pr-checksums-hashing"]
});

/* ------------------------------------------------------------------ */
/* 4. CDN                                                               */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-cdn", icon: "🌍", level: 2,
  title: { en: "Design a CDN", he: "תכנון CDN" },
  prompt: {
    en: "Design a content delivery network like CloudFront, Cloudflare or Akamai: customers point their domains at you, you serve their static assets, images, video segments and API responses from servers close to users worldwide, protect their origins from load and DDoS, and let them purge content in seconds. How do users reach the nearest PoP, what gets cached and for how long, and how much traffic still hits the origin?",
    he: "תתכנן content delivery network כמו CloudFront, ‏Cloudflare או Akamai: לקוחות מפנים את הדומיינים שלהם אליך, אתה מגיש את ה-assets הסטטיים, התמונות, ה-segments של וידאו ותגובות API שלהם משרתים קרובים למשתמשים בכל העולם, מגן על ה-origins שלהם מעומס ומ-DDoS, ונותן להם לעשות purge לתוכן תוך שניות. איך משתמשים מגיעים ל-PoP הקרוב, מה נשמר ב-cache ולכמה זמן, וכמה תעבורה עדיין מגיעה ל-origin?"
  },
  clarify: [
    { en: "Traffic mix: small static assets, large video segments, or dynamic/API traffic? Peak egress (Tbps) and request rate?",
      he: "תמהיל התעבורה: assets סטטיים קטנים, ‏segments גדולים של וידאו, או תעבורה דינמית ו-API? מה ה-egress ב-peak ‏(Tbps) וקצב הבקשות?" },
    { en: "Geography: global users or concentrated in a few countries? How many PoPs can we afford, and where do we have peering?",
      he: "גאוגרפיה: משתמשים בכל העולם או מרוכזים בכמה מדינות? כמה PoPs אנחנו יכולים להרשות לעצמנו, ואיפה יש לנו peering?" },
    { en: "Purge SLA: how fast must an invalidation be visible everywhere (seconds vs minutes)? By URL, by tag, or whole site?",
      he: "SLA של purge: כמה מהר invalidation צריך להיראות בכל מקום (שניות מול דקות)? לפי URL, לפי tag, או כל האתר?" },
    { en: "TLS: do we manage certificates for customers (automatic issuance), support custom certs, and need mTLS to origin?",
      he: "TLS: אנחנו מנהלים certificates בשביל הלקוחות (הנפקה אוטומטית), תומכים ב-certs שלהם, וצריכים mTLS ל-origin?" },
    { en: "Security scope: L3/L4 DDoS absorption only, or also WAF, bot management and rate limiting at the edge?",
      he: "היקף האבטחה: רק ספיגת DDoS ב-L3 ו-L4, או גם WAF, ניהול bots ו-rate limiting ב-edge?" }
  ],
  functional: [
    { en: "Serve customer content from the nearest healthy PoP; fetch from origin on miss and cache per HTTP caching rules.",
      he: "להגיש תוכן של לקוחות מה-PoP הבריא הקרוב; להביא מה-origin ב-miss ולשמור ב-cache לפי חוקי HTTP caching." },
    { en: "Per-customer config: cache keys, TTL overrides, origin selection/failover, header rewrites.",
      he: "קונפיגורציה לכל לקוח: ‏cache keys, דריסת TTL, בחירת origin ו-failover, שכתוב headers." },
    { en: "Purge by URL, prefix or surrogate tag, globally within seconds.",
      he: "Purge לפי URL, ‏prefix או surrogate tag, בכל העולם תוך שניות." },
    { en: "TLS termination at the edge with automatic certificate issuance and renewal.",
      he: "TLS termination ב-edge עם הנפקה וחידוש אוטומטיים של certificates." },
    { en: "Real-time logs and analytics per customer (requests, hit ratio, bandwidth, status codes).",
      he: "Logs ו-analytics בזמן אמת לכל לקוח (בקשות, ‏hit ratio, רוחב פס, ‏status codes)." }
  ],
  nonFunctional: [
    { en: "Latency: TTFB for a cache hit under ~30 ms for 95% of users (a PoP within ~1,000 km).",
      he: "Latency: ‏TTFB ל-cache hit מתחת ל-~30ms ל-95% מהמשתמשים (PoP בטווח של ~1,000 ק\"מ)." },
    { en: "Availability 99.99%+: a PoP or a whole region failing must shift traffic automatically within seconds to a minute.",
      he: "זמינות של 99.99%+: נפילה של PoP או region שלם חייבת להעביר תעבורה אוטומטית תוך שניות עד דקה." },
    { en: "Origin offload of at least 95% of bytes; absorb multi-Tbps DDoS without customer impact.",
      he: "Origin offload של 95% לפחות מהבייטים; לספוג DDoS של כמה Tbps בלי שהלקוחות ירגישו." },
    { en: "Config and purge propagation: global in under 5 s; config changes are safe (staged rollout).",
      he: "התפשטות קונפיגורציה ו-purge: גלובלית בפחות מ-5 שניות; שינויי קונפיגורציה בטוחים (rollout מדורג)." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Egress</strong>: assume 20 Tbps peak, 50M requests/s, ~200 PoPs → ~100 Gbps average per PoP; the top 20 metro PoPs carry 500 Gbps-1 Tbps each. An edge server with a 100 Gbps NIC serves ~40-60 Gbps of real traffic → ~20 servers in a big PoP, plus N+2 spares.</li>
<li><strong>Hit ratio → origin offload</strong>: edge byte hit ratio 95% → 20 Tbps × 5% = 1 Tbps of misses. An <strong>origin shield</strong> tier (a few regional mid-tier PoPs) with 80% hit ratio on those misses → <strong>200 Gbps</strong> reaching all origins combined, i.e. 99% offload. Without the shield, each of 200 PoPs misses independently on the long tail.</li>
<li><strong>Cache size</strong>: a big PoP with 20 servers × 50 TB NVMe/SSD = 1 PB; small PoPs ~100 TB. Popularity is Zipf-like: the top 1% of objects take most requests, so even 100 TB catches the head; the long tail is what the shield is for.</li>
<li><strong>TLS</strong>: 50M req/s, most on reused connections; assume 2M new handshakes/s. ECDSA P-256 signing does ~20-40K ops/s per core → <strong>~50-100 cores</strong> worldwide just for handshake signatures; session resumption and TLS 1.3 cut full handshakes further. RSA-2048 would cost ~5-10x more CPU.</li>
<li><strong>Logs</strong>: 50M req/s × ~400 B per log line = 20 GB/s ≈ <strong>1.7 PB/day</strong> raw. Aggregate at the edge (per-minute counters per customer) and ship raw logs only for customers who pay for them, compressed (~10x).</li>
</ul>`,
    he: `<ul>
<li><strong>Egress</strong>: נניח 20Tbps ב-peak, ‏50M בקשות בשנייה, ~200 PoPs ← בערך 100Gbps בממוצע ל-PoP; ‏20 ה-PoPs המטרופוליניים הגדולים נושאים 500Gbps עד 1Tbps כל אחד. שרת edge עם NIC של 100Gbps מגיש ~40-60Gbps של תעבורה אמיתית ← ~20 שרתים ב-PoP גדול, ועוד N+2 ספייר.</li>
<li><strong>Hit ratio → origin offload</strong>: ‏byte hit ratio של 95% ב-edge ← ‏20Tbps × 5% = 1Tbps של misses. שכבת <strong>origin shield</strong> (כמה PoPs אזוריים בשכבת ביניים) עם hit ratio של 80% על ה-misses האלה ← <strong>200Gbps</strong> מגיעים לכל ה-origins ביחד, כלומר offload של 99%. בלי shield כל אחד מ-200 ה-PoPs מפספס בנפרד על ה-long tail.</li>
<li><strong>גודל cache</strong>: ‏PoP גדול עם 20 שרתים × 50TB של NVMe או SSD = 1PB; ‏PoPs קטנים ~100TB. הפופולריות מתפלגת בערך לפי Zipf: ה-1% העליון של ה-objects מקבל את רוב הבקשות, אז אפילו 100TB תופס את הראש; בשביל ה-long tail יש את ה-shield.</li>
<li><strong>TLS</strong>: ‏50M בקשות בשנייה, רובן על חיבורים חוזרים; נניח 2M handshakes חדשים בשנייה. חתימת ECDSA P-256 עושה ~20-40K פעולות בשנייה לליבה ← <strong>~50-100 ליבות</strong> בכל העולם רק לחתימות של handshakes; ‏session resumption ו-TLS 1.3 מורידים עוד handshakes מלאים. עם RSA-2048 זה היה עולה פי 5-10 יותר CPU.</li>
<li><strong>Logs</strong>: ‏50M בקשות בשנייה × ~400B לשורת log = 20GB/s ≈ <strong>1.7PB ביום</strong> גולמי. מצרפים ב-edge (counters לדקה לכל לקוח) ושולחים logs גולמיים רק ללקוחות שמשלמים עליהם, דחוסים (~10x).</li>
</ul>`
  },
  api: `Customer control plane (REST):
  POST /v1/distributions {domains:["static.example.com"], origins:[{host:"origin.example.com", failover:"s3-backup"}],
                          cache_policy:{key:["host","path","query:v"], default_ttl:86400, honor_origin:true}}
  POST /v1/distributions/{id}/purge {urls:[...]} | {prefixes:[...]} | {tags:["product-42"]}  -> 202 {purge_id}
  GET  /v1/purges/{purge_id}           -> {status: in_progress|done, pops_done: 198/200}
  POST /v1/certificates {domain, method:"dns-01"|"http-01"} -> auto-renewed via ACME
  GET  /v1/analytics?dist=..&from=..&group_by=status,pop

Data plane (what end users hit):
  GET https://static.example.com/app.3f9a.js
  <- 200, Cache-Control: public, max-age=31536000, immutable; Age: 3600; X-Cache: HIT
  origin responses can set Surrogate-Key: product-42 catalog  (used for tag purge)`,
  dataModel: `Edge config (pushed to every PoP, versioned):
  distributions(id, customer_id, domains[], origins[], cache_policy, waf_rules, cert_ids[], version)
  hostname -> distribution index (in memory, millions of hostnames)

Per edge server cache:
  cache_key = hash(host + path + selected query params + Vary headers)
  index (RAM): cache_key -> {disk, offset, size, expires_at, etag, surrogate_keys[], stored_at}
  storage: RAM (hot) -> NVMe/SSD (warm); size-aware eviction (LRU / S3-FIFO)

Purge log: (purge_id, seq, distribution_id, type: url|prefix|tag, value, issued_at)
  -- edge applies as "anything stored before issued_at matching X is stale"

Logs: per request {ts, pop, customer, host, path, status, bytes, cache_status, ttfb_ms, client_asn}`,
  diagram: `  user (Tel Aviv)
     | DNS: static.example.com CNAME -> cust.cdn.net
     | anycast IP 203.0.113.10 (announced by every PoP via BGP)
     v
 +--------------------------- edge PoP (TLV) ------------------------+
 |  L4 LB / XDP DDoS filter -> TLS termination (cert by SNI)         |
 |  -> HTTP proxy: WAF, cache lookup (RAM -> NVMe)                    |
 |     HIT  -> respond (~10 ms)                                       |
 |     MISS -> consistent hash to the one server in PoP owning key    |
 +-------------------------------+------------------------------------+
                                 | miss (5% of bytes)
                                 v
               +----------------------------------+
               | origin shield / mid-tier (FRA)   |  one regional tier,
               | request collapsing per key       |  80% hit on misses
               +----------------+-----------------+
                                | miss (~1% of bytes)
                                v
               +----------------------------------+
               | customer origin (S3 / LB / app)  |
               +----------------------------------+
 control plane: config + purge -> pub/sub fan-out -> all PoPs (< 5 s)
 logs: edge aggregates -> Kafka -> analytics store / customer log push`,
  deepDives: [
    {
      h: { en: "Routing users to the right PoP: anycast vs GeoDNS", he: "ניתוב משתמשים ל-PoP הנכון: ‏anycast מול GeoDNS" },
      body: {
        en: `<p><strong>Anycast</strong>: every PoP announces the same IP prefix via BGP; internet routing delivers each packet to the "closest" PoP in BGP terms (shortest AS path / best peering, not always geographically closest). Failover is automatic — a PoP withdraws its route and traffic shifts within seconds. It also spreads DDoS floods across all PoPs. Cloudflare is all-anycast.</p>
<p><strong>GeoDNS / latency-based DNS</strong>: the authoritative DNS returns a different PoP IP based on the resolver's location (or the client subnet via EDNS Client Subnet), plus health and load. More control (steer traffic away from a PoP that's busy, not just down), but failover is bounded by DNS TTLs (typically 30-60 s, and some resolvers ignore them) and the resolver may be far from the user. Akamai and CloudFront rely mainly on DNS steering.</p>
<p>Many CDNs combine them: DNS picks a region or PoP cluster, anycast within it. The concern with anycast for long TCP connections: a BGP change mid-connection can move packets to a different PoP with no state for that connection — mitigated with stable routing policy and, for very long downloads, client retries with range requests.</p>`,
        he: `<p><strong>Anycast</strong>: כל PoP מפרסם את אותו IP prefix ב-BGP; הניתוב של האינטרנט מוסר כל packet ל-PoP ה"קרוב" במונחי BGP (ה-AS path הקצר או ה-peering הכי טוב, לא תמיד הקרוב גאוגרפית). ה-failover אוטומטי — PoP מושך את ה-route שלו והתעבורה זזה תוך שניות. זה גם מפזר הצפות DDoS על כל ה-PoPs. ‏Cloudflare עובדים רק עם anycast.</p>
<p><strong>GeoDNS או DNS לפי latency</strong>: ה-DNS ה-authoritative מחזיר IP של PoP שונה לפי המיקום של ה-resolver (או ה-subnet של ה-client דרך EDNS Client Subnet), ובהתחשב בבריאות ועומס. יותר שליטה (מסיטים תעבורה מ-PoP עמוס, לא רק מנופל), אבל ה-failover מוגבל ע"י ה-TTL של ה-DNS (בדרך כלל 30-60 שניות, וחלק מה-resolvers מתעלמים ממנו) וה-resolver יכול להיות רחוק מהמשתמש. ‏Akamai ו-CloudFront נשענים בעיקר על הכוונה ב-DNS.</p>
<p>הרבה CDNs משלבים: ה-DNS בוחר region או אשכול PoPs, ובתוכו anycast. החשש עם anycast בחיבורי TCP ארוכים: שינוי BGP באמצע חיבור יכול להעביר packets ל-PoP אחר שאין לו state לחיבור — מקטינים את זה עם מדיניות ניתוב יציבה, ובהורדות ארוכות מאוד עם retries של ה-client עם range requests.</p>`
      }
    },
    {
      h: { en: "Cache hierarchy, cache keys, TTLs and hit ratio", he: "היררכיית cache, ‏cache keys, ‏TTLs ו-hit ratio" },
      body: {
        en: `<p>Inside a PoP, don't let 20 servers each cache their own copy: hash the cache key to one owner server (consistent hashing) so the PoP behaves like one big cache, with only the hottest objects duplicated in every server's RAM. Between PoPs, add a <strong>shield</strong> tier: all edge misses for a customer go to one regional mid-tier, which collapses concurrent requests for the same key into <strong>one</strong> origin fetch (request collapsing). Without collapsing, a new viral video segment triggers 200 simultaneous origin fetches.</p>
<p><strong>Cache key</strong> = host + path + only the query params and headers that change the response. Including a random <code>utm_source</code> or the full <code>Cookie</code> header fragments the cache and kills hit ratio; including too little (missing <code>Accept-Encoding</code> or a language header from <code>Vary</code>) serves the wrong variant — a cache poisoning risk.</p>
<p><strong>TTLs</strong>: honor <code>Cache-Control</code> from origin (<code>s-maxage</code> for shared caches), with per-customer overrides. Best practice for static assets: fingerprinted names (<code>app.3f9a.js</code>) + <code>max-age=31536000, immutable</code>, so purge is rarely needed. For HTML freshness use short TTLs plus <code>stale-while-revalidate</code> (serve stale, refresh in the background) and <code>stale-if-error</code> (serve stale when origin is down).</p>`,
        he: `<p>בתוך PoP לא נותנים ל-20 שרתים לשמור כל אחד עותק משלו: עושים hash ל-cache key לשרת בעלים אחד (consistent hashing) כדי שה-PoP יתנהג כמו cache אחד גדול, ורק ה-objects הכי חמים משוכפלים ב-RAM של כל שרת. בין PoPs מוסיפים שכבת <strong>shield</strong>: כל ה-misses של לקוח מה-edge הולכים לשכבת ביניים אזורית אחת, שמאחדת בקשות מקבילות לאותו key ל-fetch <strong>אחד</strong> מה-origin ‏(request collapsing). בלי collapsing, ‏segment חדש של וידאו ויראלי מייצר 200 fetches בו זמנית ל-origin.</p>
<p><strong>Cache key</strong> = host + path + רק ה-query params וה-headers שמשנים את התגובה. הכללה של <code>utm_source</code> אקראי או של ה-header ‏<code>Cookie</code> המלא מפצלת את ה-cache והורגת את ה-hit ratio; הכללה של פחות מדי (חסר <code>Accept-Encoding</code> או header של שפה ב-<code>Vary</code>) מגישה את הגרסה הלא נכונה — סיכון ל-cache poisoning.</p>
<p><strong>TTLs</strong>: מכבדים את ה-<code>Cache-Control</code> מה-origin ‏(<code>s-maxage</code> ל-caches משותפים), עם דריסות לכל לקוח. ה-best practice ל-assets סטטיים: שמות עם fingerprint ‏(<code>app.3f9a.js</code>) ועוד <code>max-age=31536000, immutable</code>, כך שכמעט אף פעם לא צריך purge. בשביל עדכניות של HTML משתמשים ב-TTLs קצרים ועוד <code>stale-while-revalidate</code> (מגישים ישן ומרעננים ברקע) ו-<code>stale-if-error</code> (מגישים ישן כשה-origin למטה).</p>`
      }
    },
    {
      h: { en: "Purge propagation in seconds", he: "התפשטות purge תוך שניות" },
      body: {
        en: `<p>The control plane writes the purge to a durable log and fans it out over a pub/sub tree (control plane → regional relays → every server), typically 150 ms to a few seconds worldwide. Purge is <strong>logical, not physical</strong>: each server records "objects of distribution D matching X stored before T are stale" and checks it on lookup; the bytes are evicted lazily. A URL purge is a key lookup; a <strong>tag purge</strong> needs an index <code>surrogate_key → cache keys</code> per server, or a generation counter per tag folded into the freshness check.</p>
<p>Servers that were offline or partitioned during a purge must not serve stale data when they return: each server tracks the last purge <code>seq</code> it applied and refuses to serve a distribution (or treats everything as stale) until caught up. The API returns a <code>purge_id</code> with progress so customers can wait for "done" before announcing a release.</p>
<blockquote>⚠️ "Purge everything" on a big customer at peak = instant 0% hit ratio = the CDN DDoSes the customer's origin. Prefer a soft purge (mark stale, revalidate with <code>If-None-Match</code>, the origin answers with cheap 304s) and keep request collapsing on at the shield.</blockquote>`,
        he: `<p>ה-control plane כותב את ה-purge ל-log עמיד ומפזר אותו דרך עץ pub/sub ‏(control plane ← relays אזוריים ← כל שרת), בדרך כלל 150ms עד כמה שניות בכל העולם. ‏Purge הוא <strong>לוגי, לא פיזי</strong>: כל שרת רושם "objects של distribution D שמתאימים ל-X ונשמרו לפני T הם stale" ובודק את זה ב-lookup; הבייטים עצמם מפונים בעצלות. ‏purge לפי URL הוא lookup לפי key; ‏<strong>purge לפי tag</strong> צריך index של <code>surrogate_key → cache keys</code> בכל שרת, או generation counter לכל tag שנכנס לבדיקת העדכניות.</p>
<p>שרתים שהיו offline או מנותקים בזמן purge אסור להם להגיש דאטה ישן כשהם חוזרים: כל שרת עוקב אחרי ה-<code>seq</code> האחרון של purge שהוא החיל, ומסרב להגיש distribution (או מתייחס להכל כ-stale) עד שהוא משלים. ה-API מחזיר <code>purge_id</code> עם התקדמות כדי שלקוחות יוכלו לחכות ל-"done" לפני שהם מכריזים על release.</p>
<blockquote>⚠️ "Purge everything" ללקוח גדול ב-peak = ‏hit ratio של 0% מיד = ה-CDN עושה DDoS ל-origin של הלקוח. עדיף soft purge (מסמנים stale, עושים revalidate עם <code>If-None-Match</code>, וה-origin עונה ב-304 זולים) ומשאירים request collapsing דלוק ב-shield.</blockquote>`
      }
    },
    {
      h: { en: "TLS at the edge and DDoS absorption", he: "TLS ב-edge וספיגת DDoS" },
      body: {
        en: `<p><strong>TLS</strong>: millions of customer hostnames, so the edge picks the certificate by <strong>SNI</strong> during the handshake from an in-memory index. Private keys are distributed encrypted, or kept in a central keyless signing service for customers who won't hand over keys (the edge sends the handshake signing request over a secure channel). Certificates are issued automatically via ACME (Let's Encrypt or your own CA) with DNS-01/HTTP-01 validation and renewed ~30 days before expiry; expiry monitoring is mandatory — an expired cert is a full outage for that customer. TLS 1.3, ECDSA certs, session tickets with rotated keys, OCSP stapling.</p>
<p><strong>DDoS</strong>: anycast spreads a 3 Tbps flood over 200 PoPs → ~15 Gbps each, which every PoP can absorb. Volumetric L3/L4 attacks (SYN floods, UDP reflection) are dropped in the NIC/kernel with <strong>XDP/eBPF</strong> filters before reaching userspace; SYN cookies protect the TCP stack. L7 floods (valid HTTPS requests) need rate limiting per IP/ASN/TLS fingerprint (JA3/JA4), challenges, and caching — a cached response costs microseconds, an origin fetch costs the customer money.</p>`,
        he: `<p><strong>TLS</strong>: יש מיליוני hostnames של לקוחות, אז ה-edge בוחר את ה-certificate לפי <strong>SNI</strong> בזמן ה-handshake מתוך index בזיכרון. ה-private keys מופצים מוצפנים, או נשמרים בשירות חתימה מרכזי מסוג keyless ללקוחות שלא מוכנים למסור keys (ה-edge שולח את בקשת החתימה של ה-handshake בערוץ מאובטח). ה-certificates מונפקים אוטומטית דרך ACME ‏(Let's Encrypt או CA משלך) עם אימות DNS-01 או HTTP-01, ומתחדשים ~30 יום לפני הפקיעה; ניטור פקיעה הוא חובה — cert שפג זה outage מלא ללקוח הזה. ‏TLS 1.3, ‏certs של ECDSA, ‏session tickets עם keys שמתחלפים, ‏OCSP stapling.</p>
<p><strong>DDoS</strong>: ‏anycast מפזר הצפה של 3Tbps על 200 PoPs ← בערך 15Gbps לכל אחד, וכל PoP יכול לספוג את זה. התקפות נפח ב-L3 ו-L4 ‏(SYN floods, ‏UDP reflection) נזרקות ב-NIC או ב-kernel עם פילטרים של <strong>XDP/eBPF</strong> לפני שהן מגיעות ל-userspace; ‏SYN cookies מגינים על ה-TCP stack. הצפות L7 (בקשות HTTPS תקינות) צריכות rate limiting לפי IP, ‏ASN או TLS fingerprint ‏(JA3/JA4), ‏challenges, ו-caching — תגובה מה-cache עולה מיקרו-שניות, ‏fetch מה-origin עולה ללקוח כסף.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "Anycast (instant failover, DDoS spreading, less control) vs GeoDNS (fine-grained steering by load, failover bounded by DNS TTL and resolver location).",
      he: "Anycast ‏(failover מיידי, פיזור DDoS, פחות שליטה) מול GeoDNS ‏(הכוונה מדויקת לפי עומס, ‏failover מוגבל ע\"י ה-TTL של ה-DNS ומיקום ה-resolver)." },
    { en: "Many small PoPs (lower latency, lower hit ratio per PoP, more ops) vs fewer large PoPs (better hit ratio and economics, a few more ms).",
      he: "הרבה PoPs קטנים (latency נמוך יותר, ‏hit ratio נמוך יותר לכל PoP, יותר תפעול) מול פחות PoPs גדולים (hit ratio וכלכלה טובים יותר, עוד כמה ms)." },
    { en: "Origin shield (huge offload and request collapsing, an extra hop on misses and a regional dependency) vs misses going straight to origin.",
      he: "Origin shield ‏(offload ענק ו-request collapsing, ‏hop נוסף ב-misses ותלות אזורית) מול misses שהולכים ישר ל-origin." },
    { en: "Long TTLs + purge (high hit ratio, purge correctness becomes critical) vs short TTLs + revalidation (simpler freshness, more origin load).",
      he: "TTLs ארוכים ועוד purge ‏(hit ratio גבוה, הנכונות של ה-purge נהיית קריטית) מול TTLs קצרים ועוד revalidation (עדכניות פשוטה יותר, יותר עומס על ה-origin)." }
  ],
  followUps: [
    { q: { en: "A customer complains that users in Brazil get their pages from Miami. Why, and what do you do?",
           he: "לקוח מתלונן שמשתמשים בברזיל מקבלים את הדפים שלו ממיאמי. למה, ומה עושים?" },
      a: { en: "With anycast, BGP picks the path: the local ISP may not peer with you in São Paulo, so its routes prefer your Miami announcement via a transit provider. Confirm by client ASN in the logs, then add peering at the local IX (IX.br) or directly with the ISP, tune with BGP communities/prepending, or deploy caches inside the ISP. With DNS steering, check whether the users' resolvers (e.g. a public resolver without ECS) are located elsewhere.",
           he: "עם anycast ה-BGP בוחר את המסלול: ייתכן שה-ISP המקומי לא עושה איתך peering בסאו פאולו, אז ה-routes שלו מעדיפים את ההכרזה שלך במיאמי דרך ספק transit. מאמתים לפי ה-ASN של ה-clients ב-logs, ואז מוסיפים peering ב-IX המקומי (IX.br) או ישירות עם ה-ISP, מכווננים עם BGP communities או prepending, או מציבים caches בתוך ה-ISP. עם הכוונת DNS, בודקים אם ה-resolvers של המשתמשים (למשל resolver ציבורי בלי ECS) נמצאים במקום אחר." } },
    { q: { en: "How would you cache personalized or authenticated content?",
           he: "איך היית שומר ב-cache תוכן מותאם אישית או כזה שדורש אימות?" },
      a: { en: "Split the page: cache the shared shell and fragments publicly, and fetch the personalized part via a small uncached API call (or assemble it with edge-side includes / edge compute). For authenticated but shared content (paid video), cache publicly and enforce access with signed URLs or signed cookies validated at the edge (HMAC with expiry), not by putting the session cookie in the cache key. Never cache responses with Set-Cookie or Cache-Control: private.",
           he: "מפצלים את הדף: שומרים ב-cache ציבורי את השלד המשותף ואת ה-fragments, ומביאים את החלק האישי דרך קריאת API קטנה בלי cache (או מרכיבים אותו עם edge-side includes או edge compute). לתוכן שדורש אימות אבל משותף (וידאו בתשלום) שומרים ב-cache ציבורי ואוכפים גישה עם signed URLs או signed cookies שנבדקים ב-edge ‏(HMAC עם תפוגה), לא ע\"י הכנסת ה-session cookie ל-cache key. אף פעם לא שומרים ב-cache תגובות עם Set-Cookie או Cache-Control: private." } },
    { q: { en: "A bad config push to all PoPs takes down 30% of traffic. How do you prevent it next time?",
           he: "Push של קונפיגורציה רעה לכל ה-PoPs מפיל 30% מהתעבורה. איך מונעים את זה בפעם הבאה?" },
      a: { en: "Treat config like code: validate and fuzz it in CI, roll out progressively (canary servers → one small PoP → a region → global) with automatic health gates on error rate and CPU, and keep instant rollback to the previous version on every server. Separate global config (WAF rules, which have caused real global outages) from per-customer config with blast-radius limits, and have the data plane fall back to the last known good config.",
           he: "מתייחסים לקונפיגורציה כמו לקוד: מאמתים ועושים לה fuzz ב-CI, מגלגלים בהדרגה (שרתי canary ← ‏PoP קטן אחד ← region ← גלובלי) עם health gates אוטומטיים על error rate ו-CPU, ושומרים rollback מיידי לגרסה הקודמת בכל שרת. מפרידים קונפיגורציה גלובלית (חוקי WAF, שכבר גרמו ל-outages גלובליים אמיתיים) מקונפיגורציה לכל לקוח עם הגבלת blast radius, וה-data plane חוזר ל-last known good config." } }
  ],
  related: ["net-proxies-cdn", "net-http-caching", "net-ddos-edge", "net-bgp-anycast", "net-http-tls", "rel-cert-operations"]
});

/* ------------------------------------------------------------------ */
/* 5. Unique ID generator                                               */
/* ------------------------------------------------------------------ */
window.INFRA.designs.push({
  id: "sd-id-generator", icon: "🔢", level: 1,
  title: { en: "Design a unique ID generator at scale", he: "תכנון מחולל מזהים ייחודיים בסקייל" },
  prompt: {
    en: "Design a service (or library) that generates unique IDs for tweets, orders and events across hundreds of services and multiple data centers: about 1M IDs per second at peak, no collisions ever, ideally roughly sortable by time, and it must not become a single point of failure. Compare UUIDs, Snowflake-style IDs and database-backed ranges.",
    he: "תתכנן שירות (או ספרייה) שמייצר מזהים ייחודיים ל-tweets, הזמנות ו-events בין מאות שירותים וכמה data centers: בערך 1M מזהים בשנייה ב-peak, אף פעם לא התנגשות, רצוי ממוינים בערך לפי זמן, ואסור שזה יהפוך ל-single point of failure. תשווה בין UUIDs, מזהים בסגנון Snowflake ו-ranges שמגיעים מ-database."
  },
  clarify: [
    { en: "Size constraint: must the ID fit in 64 bits (BIGINT, compact indexes) or is 128 bits fine?",
      he: "אילוץ גודל: המזהה חייב להיכנס ב-64 ביט ‏(BIGINT, ‏indexes קומפקטיים) או ש-128 ביט זה בסדר?" },
    { en: "Ordering: strictly increasing, roughly time-sortable (k-sorted), or no ordering needed?",
      he: "סדר: עולה באופן קפדני, ממוין בערך לפי זמן (k-sorted), או שלא צריך סדר בכלל?" },
    { en: "Are IDs exposed publicly? If so, is leaking creation time and volume (sequential IDs) a business concern?",
      he: "המזהים חשופים לציבור? אם כן, זו בעיה עסקית שהם מדליפים זמן יצירה ונפח (מזהים רציפים)?" },
    { en: "Throughput and topology: IDs per second at peak, how many generating nodes and data centers?",
      he: "Throughput וטופולוגיה: כמה מזהים בשנייה ב-peak, כמה nodes מייצרים וכמה data centers?" },
    { en: "Latency budget: can generation require a network call, or must it be in-process (sub-microsecond)?",
      he: "תקציב latency: מותר שהייצור ידרוש קריאת רשת, או שהוא חייב להיות בתוך התהליך (פחות ממיקרו-שנייה)?" }
  ],
  functional: [
    { en: "nextId() returns an ID that is globally unique across all nodes and DCs, forever.",
      he: "nextId() מחזיר מזהה ייחודי גלובלית בין כל ה-nodes וה-DCs, לתמיד." },
    { en: "IDs are roughly sortable by creation time (so the newest rows cluster at the end of indexes).",
      he: "המזהים ממוינים בערך לפי זמן יצירה (כך שהשורות החדשות מתקבצות בסוף ה-indexes)." },
    { en: "Batch API: reserve N IDs in one call; parse an ID back into its timestamp and origin.",
      he: "Batch API: לשריין N מזהים בקריאה אחת; לפרק מזהה בחזרה ל-timestamp ולמקור שלו." }
  ],
  nonFunctional: [
    { en: "Zero collisions, including across restarts, clock adjustments and node replacement.",
      he: "אפס התנגשויות, כולל אחרי restarts, תיקוני שעון והחלפת nodes." },
    { en: "1M IDs/s aggregate; p99 generation latency under 1 ms (ideally in-process, no network).",
      he: "1M מזהים בשנייה במצטבר; ‏p99 של ייצור מתחת ל-1ms (רצוי בתוך התהליך, בלי רשת)." },
    { en: "Highly available: generation keeps working if a coordinator or a whole DC is down.",
      he: "זמינות גבוהה: הייצור ממשיך לעבוד אם coordinator או DC שלם למטה." }
  ],
  estimates: {
    en: `<ul>
<li><strong>Snowflake layout (64-bit)</strong>: 1 sign bit + 41 bits of milliseconds since a custom epoch (2<sup>41</sup> ms ≈ <strong>69.7 years</strong>) + 10 bits worker id (<strong>1,024 workers</strong>) + 12 bits sequence (<strong>4,096 IDs per ms per worker</strong> ≈ 4.1M/s per worker).</li>
<li><strong>Capacity</strong>: 1M IDs/s needs a single worker in theory; spread over ~200 service instances it's 5K/s each — ~5 per ms, far below 4,096. Theoretical cluster max: 1,024 × 4.1M ≈ 4.2 billion IDs/s.</li>
<li><strong>UUID v4</strong>: 122 random bits. Birthday bound: 50% collision chance after ~2.7×10<sup>18</sup> IDs; at 1M/s that's ~86,000 years. The real risk is a broken RNG (cloned VM snapshots, bad seeding), not the math.</li>
<li><strong>UUID v7</strong>: 48-bit Unix ms timestamp + 4-bit version + 74 random bits (+2 variant bits). A collision needs two IDs in the same ms to share all 74 random bits — negligible even at millions per ms.</li>
<li><strong>Storage impact</strong>: 1 billion rows × (16 B UUID − 8 B BIGINT) = 8 GB more per index containing the key — and every InnoDB secondary index stores the primary key, so a table with 4 secondary indexes pays it 5 times (~40 GB).</li>
<li><strong>Segment allocation</strong>: DB ranges of 10,000 IDs per fetch; at 5K IDs/s per instance that's one DB round-trip every 2 s per instance — ~100 DB updates/s for 200 instances. Trivial.</li>
</ul>`,
    he: `<ul>
<li><strong>מבנה Snowflake ‏(64 ביט)</strong>: ביט סימן אחד + 41 ביט של מילי-שניות מ-epoch מותאם (2<sup>41</sup> ms ≈ <strong>69.7 שנים</strong>) + 10 ביט של worker id ‏(<strong>1,024 workers</strong>) + 12 ביט של sequence ‏(<strong>4,096 מזהים למילי-שנייה לכל worker</strong> ≈ ‏4.1M בשנייה ל-worker).</li>
<li><strong>קיבולת</strong>: ‏1M מזהים בשנייה צריכים תיאורטית worker אחד; כשמפוזרים על ~200 instances של שירותים זה 5K בשנייה לכל אחד — בערך 5 למילי-שנייה, הרחק מתחת ל-4,096. המקסימום התיאורטי של ה-cluster: ‏1,024 × 4.1M ≈ ‏4.2 מיליארד מזהים בשנייה.</li>
<li><strong>UUID v4</strong>: ‏122 ביט אקראיים. ‏Birthday bound: סיכוי של 50% להתנגשות אחרי ~2.7×10<sup>18</sup> מזהים; ב-1M בשנייה זה בערך 86,000 שנה. הסיכון האמיתי הוא RNG שבור (snapshots משוכפלים של VM, ‏seeding גרוע), לא המתמטיקה.</li>
<li><strong>UUID v7</strong>: ‏timestamp של 48 ביט במילי-שניות Unix + 4 ביט גרסה + 74 ביט אקראיים (+2 ביט variant). התנגשות דורשת ששני מזהים באותה מילי-שנייה יחלקו את כל 74 הביטים האקראיים — זניח גם במיליונים למילי-שנייה.</li>
<li><strong>השפעה על אחסון</strong>: מיליארד שורות × (16B של UUID פחות 8B של BIGINT) = עוד 8GB לכל index שמכיל את המפתח — וכל secondary index ב-InnoDB שומר את ה-primary key, אז טבלה עם 4 secondary indexes משלמת את זה 5 פעמים (~40GB).</li>
<li><strong>הקצאת segments</strong>: ‏ranges של 10,000 מזהים לכל שליפה מה-DB; ב-5K מזהים בשנייה ל-instance זה round-trip אחד ל-DB כל 2 שניות לכל instance — בערך 100 עדכוני DB בשנייה ל-200 instances. זניח.</li>
</ul>`
  },
  api: `In-process library (preferred):
  id  = idgen.next()                   -> 64-bit int, e.g. 1859384756123459584
  ids = idgen.nextBatch(1000)
  idgen.parse(id) -> {timestamp_ms, dc_id, worker_id, sequence}

Optional network service (for clients that can't embed the library):
  POST /v1/ids?count=100   -> 200 {ids: ["1859384756123459584", ...]}   (strings! JS loses precision above 2^53)

Segment allocator (DB-backed), internal:
  AllocateSegment(biz_tag="order", step=10000) -> {start: 4200001, end: 4210000}

Worker id lease:
  AcquireWorkerId(instance_id) -> {worker_id: 417, lease_ttl: 30s}   (etcd / ZooKeeper / DB row)
  RenewLease(worker_id) every 10s`,
  dataModel: `Snowflake ID (64 bits):
  | 1 sign | 41 ms since epoch 2020-01-01 | 5 DC id | 5 worker id | 12 sequence |
  (the 10 worker bits are often split DC/worker: 32 DCs x 32 workers)

UUIDv7 (128 bits):  | 48 unix_ts_ms | 4 ver=7 | 12 rand_a | 2 var | 62 rand_b |

Segment table (MySQL/Postgres, Leaf-style):
  id_segments(biz_tag PK, max_id BIGINT, step INT, updated_at)
  UPDATE id_segments SET max_id = max_id + step WHERE biz_tag = 'order' RETURNING max_id;

Worker id registry (etcd):
  /idgen/workers/417 -> {instance: "orders-7f9c-x2", lease: 30s, last_ts_ms: 1763112345678}`,
  diagram: `  Option A: Snowflake in-process (no network on the hot path)
  +--------------------+   startup: lease worker_id   +-----------------+
  | service instance   |----------------------------->| etcd/ZooKeeper  |
  |  idgen(worker=417) |<-----------------------------| /idgen/workers  |
  |  ts|dc|worker|seq  |   renew every 10s            +-----------------+
  +--------------------+
     next() = (now_ms - epoch) << 22 | dc_worker << 12 | seq++

  Option B: segments from a DB (Leaf)
  +--------------------+  at 10-20% of buffer used:    +------------------+
  | idgen service      |  fetch next segment async     | MySQL            |
  | buffer1 [4.20M..   |------------------------------>| id_segments      |
  |          4.21M]    |   UPDATE max_id += 10000      | (primary+replica)|
  | buffer2 [prefetch] |<------------------------------+------------------+
  +--------------------+
     next() = atomic increment in RAM; a DB outage is tolerated for minutes`,
  deepDives: [
    {
      h: { en: "The options: UUID v4/v7, Snowflake, DB segments, ticket servers", he: "האפשרויות: UUID v4/v7, ‏Snowflake, ‏segments מ-DB, ‏ticket servers" },
      body: {
        en: `<p><strong>UUID v4</strong>: 122 random bits, zero coordination, generated anywhere. Downsides: 16 bytes, and <strong>random insert order</strong> — each insert lands on a random B-tree page, causing page splits, poor cache locality and write amplification once the index exceeds RAM. <strong>UUID v7</strong> (RFC 9562, 2024) fixes ordering: the timestamp prefix makes inserts append-mostly, still with no coordination. It's today's default when 128 bits is acceptable.</p>
<p><strong>Snowflake</strong> (Twitter, 2010): 64-bit, time-sorted, generated in-process with no network calls — but needs a unique worker id per generator and trusts the clock. Variants: Instagram's (timestamp + logical shard id + per-shard sequence, generated inside Postgres), Sonyflake (10 ms units, 16-bit machine id), Discord's IDs.</p>
<p><strong>DB segments</strong> (Meituan's Leaf, Flickr-style): a table holds <code>max_id</code> per business tag; a generator grabs a range of 10,000 with one atomic UPDATE and serves from memory, prefetching the next segment when 10-20% is consumed (double buffer). Dense, 64-bit, monotonic per generator, survives a short DB outage. <strong>Ticket servers</strong> (Flickr, 2010): two MySQL servers with <code>auto_increment_increment=2</code> and offsets 1 and 2 hand out odd/even IDs — simple, but a network round-trip per ID; mostly replaced by segments.</p>`,
        he: `<p><strong>UUID v4</strong>: ‏122 ביט אקראיים, אפס תיאום, נוצר בכל מקום. חסרונות: 16 בייט, ו-<strong>סדר הכנסה אקראי</strong> — כל insert נוחת על דף אקראי ב-B-tree, מה שגורם ל-page splits, ‏cache locality גרוע ו-write amplification ברגע שה-index גדול מה-RAM. ‏<strong>UUID v7</strong> ‏(RFC 9562, ‏2024) מתקן את הסדר: ה-prefix של ה-timestamp הופך את ה-inserts לכמעט append, ועדיין בלי תיאום. זו ברירת המחדל היום כש-128 ביט מקובל.</p>
<p><strong>Snowflake</strong> ‏(Twitter, ‏2010): ‏64 ביט, ממוין לפי זמן, נוצר בתוך התהליך בלי קריאות רשת — אבל צריך worker id ייחודי לכל מחולל וסומך על השעון. וריאציות: של Instagram ‏(timestamp + מזהה shard לוגי + sequence לכל shard, שנוצרים בתוך Postgres), ‏Sonyflake ‏(יחידות של 10ms, ‏machine id של 16 ביט), והמזהים של Discord.</p>
<p><strong>Segments מ-DB</strong> ‏(Leaf של Meituan, בסגנון Flickr): טבלה מחזיקה <code>max_id</code> לכל business tag; מחולל לוקח טווח של 10,000 עם UPDATE אטומי אחד ומגיש מהזיכרון, ושולף מראש את ה-segment הבא כש-10-20% נצרכו (double buffer). צפוף, ‏64 ביט, מונוטוני לכל מחולל, ושורד השבתה קצרה של ה-DB. ‏<strong>Ticket servers</strong> ‏(Flickr, ‏2010): שני שרתי MySQL עם <code>auto_increment_increment=2</code> ו-offsets של 1 ו-2 מחלקים מזהים אי-זוגיים וזוגיים — פשוט, אבל round-trip ברשת לכל מזהה; היום הוחלף ברובו ב-segments.</p>`
      }
    },
    {
      h: { en: "Clock skew and clocks moving backward", he: "Clock skew ושעונים שזזים אחורה" },
      body: {
        en: `<p>Snowflake's uniqueness rests on two facts: the worker id is unique, AND a (timestamp, sequence) pair is never reused by that worker. If NTP <strong>steps</strong> the clock back 50 ms, the generator would re-issue timestamps it already used → duplicate IDs. Rules:</p>
<ul><li>Keep <code>last_ts</code>. If <code>now &lt; last_ts</code> by a small amount (up to ~5-10 ms), wait until the clock catches up.</li>
<li>If it's further back, <strong>refuse</strong> to generate (throw, mark the instance unhealthy, alert) rather than risk duplicates — or keep issuing from <code>last_ts</code>, "borrowing" future sequence space and accepting drift in the embedded time.</li>
<li>Configure chrony/ntpd to <strong>slew</strong> (speed up or slow down the clock) instead of stepping, and use a monotonic clock for elapsed time where possible.</li>
<li>Persist <code>last_ts</code> periodically (e.g. in the worker-id lease record) so a restarted process with a skewed clock can't go back in time either.</li></ul>
<p>Sequence exhaustion: if 4,096 IDs are issued within one ms, block until the next millisecond. Leap seconds: major clouds smear them (Google and AWS spread the second over 24 h), so the wall clock doesn't jump.</p>`,
        he: `<p>הייחודיות של Snowflake נשענת על שתי עובדות: ה-worker id ייחודי, וגם זוג של (timestamp, ‏sequence) אף פעם לא חוזר באותו worker. אם NTP עושה <strong>step</strong> לשעון 50ms אחורה, המחולל יוציא שוב timestamps שכבר השתמש בהם ← מזהים כפולים. החוקים:</p>
<ul><li>שומרים <code>last_ts</code>. אם <code>now &lt; last_ts</code> בקצת (עד ~5-10ms), מחכים עד שהשעון משלים.</li>
<li>אם זה רחוק יותר אחורה, <strong>מסרבים</strong> לייצר (זורקים exception, מסמנים את ה-instance כ-unhealthy, מתריעים) במקום להסתכן בכפילויות — או ממשיכים להוציא מ-<code>last_ts</code>, "לווים" ממרחב ה-sequence של העתיד ומקבלים סחף בזמן שמוטבע במזהה.</li>
<li>מגדירים את chrony או ntpd לעשות <strong>slew</strong> (להאיץ או להאט את השעון) במקום step, ומשתמשים ב-monotonic clock לזמן שעבר איפה שאפשר.</li>
<li>שומרים את <code>last_ts</code> מדי פעם (למשל ברשומת ה-lease של ה-worker id) כדי שגם תהליך שעשה restart עם שעון סטוי לא יוכל לחזור אחורה בזמן.</li></ul>
<p>מיצוי sequence: אם 4,096 מזהים יצאו באותה מילי-שנייה, חוסמים עד המילי-שנייה הבאה. ‏Leap seconds: העננים הגדולים מורחים אותם (Google ו-AWS מפזרים את השנייה על 24 שעות), אז שעון הקיר לא קופץ.</p>`
      }
    },
    {
      h: { en: "Assigning worker ids safely", he: "הקצאת worker ids בבטחה" },
      body: {
        en: `<p>Two generators with the same worker id = guaranteed duplicates. Options, from weakest to strongest:</p>
<ul><li><strong>Static config</strong> per host — breaks with autoscaling and copy-pasted configs.</li>
<li><strong>Derived from the IP or a K8s StatefulSet ordinal</strong> (<code>orders-17</code> → 17, plus a DC prefix) — simple, but 10 bits = only 1,024 slots, and IP reuse after a reschedule can collide with a zombie that's still running.</li>
<li><strong>Leased from a coordinator</strong> (an etcd/ZooKeeper ephemeral node, or a DB row with <code>lease_until</code>): on startup claim a free id, renew every 10 s with a 30 s TTL. If renewal fails, the generator must <strong>stop issuing before the lease expires</strong> (fence on local time with a safety margin), otherwise the new owner and the old one overlap.</li></ul>
<p>After a worker id is released, wait at least the maximum clock skew before reassigning it, so the new owner can't produce timestamps the old owner already used. With only 1,024 slots and thousands of pods, run ID generation on a smaller set of dedicated instances, or move to 128-bit IDs.</p>`,
        he: `<p>שני מחוללים עם אותו worker id = כפילויות מובטחות. האפשרויות, מהחלשה לחזקה:</p>
<ul><li><strong>קונפיגורציה סטטית</strong> לכל host — נשבר עם autoscaling וקונפיגים שהועתקו.</li>
<li><strong>נגזר מה-IP או מה-ordinal של StatefulSet ב-K8s</strong> (<code>orders-17</code> ← 17, ועוד prefix של DC) — פשוט, אבל 10 ביט = רק 1,024 משבצות, ושימוש חוזר ב-IP אחרי reschedule יכול להתנגש עם zombie שעדיין רץ.</li>
<li><strong>Lease מ-coordinator</strong> ‏(ephemeral node ב-etcd או ZooKeeper, או שורת DB עם <code>lease_until</code>): בעלייה תופסים id פנוי, ומחדשים כל 10 שניות עם TTL של 30 שניות. אם החידוש נכשל, המחולל חייב <strong>להפסיק להוציא לפני שה-lease פג</strong> (fence לפי זמן מקומי עם מרווח ביטחון), אחרת הבעלים החדש והישן חופפים.</li></ul>
<p>אחרי ש-worker id שוחרר, מחכים לפחות את ה-clock skew המקסימלי לפני שמקצים אותו מחדש, כדי שהבעלים החדש לא יוכל לייצר timestamps שהישן כבר השתמש בהם. עם רק 1,024 משבצות ואלפי pods, מריצים את ייצור המזהים על קבוצה קטנה יותר של instances ייעודיים, או עוברים למזהים של 128 ביט.</p>`
      }
    }
  ],
  tradeoffs: [
    { en: "UUID v7 (no coordination, 128-bit, time-sortable) vs Snowflake (64-bit, compact indexes, needs worker-id management and a sane clock).",
      he: "UUID v7 ‏(בלי תיאום, ‏128 ביט, ממוין לפי זמן) מול Snowflake ‏(64 ביט, ‏indexes קומפקטיים, צריך ניהול worker ids ושעון שפוי)." },
    { en: "In-process generation (no network, no SPOF, only roughly ordered across nodes) vs a central service (strict ordering possible, an extra hop and a dependency).",
      he: "ייצור בתוך התהליך (בלי רשת, בלי SPOF, רק בערך ממוין בין nodes) מול שירות מרכזי (אפשר סדר קפדני, ‏hop נוסף ותלות)." },
    { en: "DB segments (dense, monotonic per generator, depend on the DB for refills; restarts leave gaps) vs Snowflake (no DB, depends on clocks).",
      he: "Segments מ-DB ‏(צפוף, מונוטוני לכל מחולל, תלוי ב-DB למילוי; ‏restarts משאירים חורים) מול Snowflake ‏(בלי DB, תלוי בשעונים)." },
    { en: "Sequential/time-based IDs (index-friendly, leak creation time and volume) vs random IDs (opaque, unguessable, poor index locality).",
      he: "מזהים רציפים או מבוססי זמן (ידידותיים ל-index, מדליפים זמן יצירה ונפח) מול מזהים אקראיים (אטומים, אי אפשר לנחש, ‏locality גרוע ב-index)." }
  ],
  followUps: [
    { q: { en: "Your frontend shows order 1859384756123459584 as 1859384756123459600. What happened?",
           he: "ה-frontend מציג את הזמנה 1859384756123459584 בתור 1859384756123459600. מה קרה?" },
      a: { en: "JavaScript Numbers are IEEE-754 doubles: integers are exact only up to 2^53 − 1 (~9×10^15). A 64-bit Snowflake ID exceeds that and gets rounded by JSON.parse. Serialize IDs as strings in JSON APIs (Twitter added id_str for exactly this reason), or use BigInt on the client. The same trap exists in some JSON libraries and in spreadsheets.",
           he: "Numbers ב-JavaScript הם doubles של IEEE-754: מספרים שלמים מדויקים רק עד 2^53 − 1 (~9×10^15). מזהה Snowflake של 64 ביט עובר את זה ו-JSON.parse מעגל אותו. מסריאלזים מזהים כ-strings ב-APIs של JSON ‏(Twitter הוסיפו id_str בדיוק בגלל זה), או משתמשים ב-BigInt בצד ה-client. אותה מלכודת קיימת בחלק מספריות ה-JSON ובגיליונות אלקטרוניים." } },
    { q: { en: "Do you need IDs that are strictly increasing across the whole system?",
           he: "צריך מזהים שעולים באופן קפדני בכל המערכת?" },
      a: { en: "Usually not — and it's expensive: it needs a single sequencer (or consensus) per ID, capping throughput and adding a network hop. Snowflake gives k-sorted IDs: ordered across nodes up to clock skew (a few ms). If the business needs a total order (a ledger), get it from the system of record (a per-account sequence in the DB, a Kafka partition offset), not from the ID generator.",
           he: "בדרך כלל לא — וזה יקר: זה דורש sequencer יחיד (או consensus) לכל מזהה, מה שמגביל throughput ומוסיף hop ברשת. ‏Snowflake נותן מזהים k-sorted: ממוינים בין nodes עד כדי ה-clock skew (כמה ms). אם העסק צריך סדר מלא (ledger), מקבלים אותו ממערכת הרשומה (sequence לכל חשבון ב-DB, ‏offset של partition ב-Kafka), לא ממחולל המזהים." } },
    { q: { en: "A VM is restored from a snapshot and starts generating IDs. What can go wrong?",
           he: "VM משוחזר מ-snapshot ומתחיל לייצר מזהים. מה יכול להשתבש?" },
      a: { en: "Everything that lived in memory is rewound: a Snowflake generator may reuse its worker id while the original VM is still running (duplicates), a segment allocator may re-serve a range it already handed out if it resumes a cached segment, and a UUID v4 generator may restart from the same RNG state if seeded badly. Defenses: re-acquire the worker-id lease on boot, always allocate a fresh segment from the DB on startup (never resume a cached one), and seed from the OS CSPRNG (getrandom), which reseeds when the VM generation id changes.",
           he: "כל מה שחי בזיכרון מתגלגל אחורה: מחולל Snowflake עלול להשתמש שוב ב-worker id שלו בזמן שה-VM המקורי עדיין רץ (כפילויות), ‏segment allocator עלול להגיש שוב טווח שכבר חילק אם הוא ממשיך segment מה-cache, ומחולל UUID v4 עלול להתחיל מאותו מצב RNG אם ה-seed גרוע. הגנות: לוקחים מחדש את ה-lease של ה-worker id בעלייה, תמיד מקצים segment חדש מה-DB בעלייה (אף פעם לא ממשיכים segment מה-cache), ועושים seed מה-CSPRNG של מערכת ההפעלה (getrandom), שעושה reseed כשה-VM generation id משתנה." } }
  ],
  related: ["uuid-guid-deep", "pr-ids-pagination", "staff-time-ordering", "pr-time-timestamps", "db-storage-engines"]
});
