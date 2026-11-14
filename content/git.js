window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

/* ============================================================
   Track: git — Git & Code Hosting (part 1)
   git-internals, git-workflow, git-undo-rescue, git-debugging
   ============================================================ */

/* ------------------------------------------------------------
   1. How Git really works
   ------------------------------------------------------------ */
INFRA.lessons.push({
  id: "git-internals",
  track: "git",
  order: 1,
  icon: "🧬",
  level: 2,
  minutes: 15,
  title: { en: "How Git really works: objects, refs, HEAD & the index", he: "איך Git באמת עובד: objects, refs, ‏HEAD וה-index" },
  tldr: {
    en: "Git is a content-addressed key-value store of snapshots (blobs, trees, commits, tags) plus a handful of tiny text files (refs) that point at commits. Once you see that, branches, detached HEAD, fetch and \"lost\" commits stop being magic.",
    he: "Git הוא key-value store של snapshots שממוען לפי תוכן (blobs, ‏trees, ‏commits, ‏tags), ועוד כמה קבצי טקסט קטנטנים (refs) שמצביעים על commits. ברגע שאתה רואה את זה, branches, ‏detached HEAD, ‏fetch ו-commits \"שנעלמו\" מפסיקים להיות קסם."
  },
  analogy: {
    en: "Think of a warehouse where every box is labeled with the fingerprint of its contents. Two identical boxes get the same label, so the warehouse stores only one. A commit is a box holding a photo of the whole shelf plus a note saying \"the previous photo is box X\". A branch is just a sticky note on the wall reading \"latest photo of feature-login: box 3f2a1bc\" — moving a branch means rewriting a sticky note, not moving any boxes.",
    he: "תחשוב על מחסן שבו כל ארגז מסומן בטביעת אצבע של התוכן שלו. שני ארגזים זהים מקבלים אותה תווית, אז המחסן שומר רק אחד. commit הוא ארגז שמכיל צילום של כל המדף ופתק שאומר \"הצילום הקודם הוא ארגז X\". branch הוא בסך הכל פתק דביק על הקיר: \"הצילום האחרון של feature-login: ארגז 3f2a1bc\". להזיז branch זה לכתוב מחדש פתק, לא להזיז ארגזים."
  },
  sections: [
    {
      h: { en: "Four object types, addressed by their hash", he: "ארבעה סוגי objects, ממוענים לפי ה-hash שלהם" },
      body: {
        en: `<p>Everything Git stores lives in <code>.git/objects</code> as one of four object types. Each object's name is the hash of <code>"&lt;type&gt; &lt;size&gt;\\0&lt;content&gt;"</code> — so the same content always gets the same id, on every machine in the world.</p>
<ul>
<li><strong>blob</strong> — raw file content. No filename, no permissions.</li>
<li><strong>tree</strong> — a directory listing: mode, type, hash and name for each entry (blobs and sub-trees).</li>
<li><strong>commit</strong> — one root tree + parent commit(s) + author/committer + message.</li>
<li><strong>tag</strong> (annotated) — points at an object (usually a commit) with a tagger, message and optional GPG/SSH signature.</li>
</ul>
<pre>$ echo 'hello' | git hash-object --stdin
ce013625030ba8dba906f756967f9e9ca394464a      # same hash on every machine

$ git cat-file -t HEAD
commit
$ git cat-file -p HEAD
tree 9a3c1f0e2b7d4a8c6e5f1d2b3a4c5d6e7f8a9b0c
parent 4b8e2d1a9f3c7e6b5a4d3c2b1a0f9e8d7c6b5a4f
author Dana Levi &lt;dana@example.com&gt; 1731580000 +0200
committer Dana Levi &lt;dana@example.com&gt; 1731580000 +0200

Add retry with jitter to payment client

$ git cat-file -p 'HEAD^{tree}'
100644 blob a1b2c3d4...   README.md
040000 tree e5f6a7b8...   src
100755 blob c9d0e1f2...   deploy.sh</pre>
<p>Because a commit hashes its tree <em>and</em> its parent, changing any byte anywhere in history changes every descendant hash. That is why "rewriting history" produces brand-new commits, and why a commit id is a tamper-evident fingerprint of the entire project up to that point.</p>
<p><strong>SHA-1 → SHA-256:</strong> Git ids are SHA-1 (40 hex chars). After the 2017 SHAttered collision, Git switched to a hardened SHA-1 (SHA-1DC, collision detection) and added SHA-256 repositories (<code>git init --object-format=sha256</code>, 64 hex chars, available since Git 2.29). The Git project plans SHA-256 as the default for new repos in Git 3.0, but hosting support is still uneven, so most real repos are SHA-1 today. You cannot mix the two formats in one repo without the interop layer.</p>`,
        he: `<p>כל מה ש-Git שומר יושב ב-<code>.git/objects</code> כאחד מארבעה סוגי objects. השם של כל object הוא ה-hash של <code>"&lt;type&gt; &lt;size&gt;\\0&lt;content&gt;"</code> — כלומר אותו תוכן תמיד מקבל אותו id, בכל מחשב בעולם.</p>
<ul>
<li><strong>blob</strong> — התוכן הגולמי של קובץ. בלי שם קובץ, בלי הרשאות.</li>
<li><strong>tree</strong> — רשימת תיקייה: mode, סוג, hash ושם לכל רשומה (blobs ו-trees פנימיים).</li>
<li><strong>commit</strong> — tree שורש אחד + commit-ים הורים + author/committer + הודעה.</li>
<li><strong>tag</strong> (annotated) — מצביע על object (בדרך כלל commit) עם tagger, הודעה וחתימת GPG/SSH אופציונלית.</li>
</ul>
<pre>$ echo 'hello' | git hash-object --stdin
ce013625030ba8dba906f756967f9e9ca394464a      # same hash on every machine

$ git cat-file -t HEAD
commit
$ git cat-file -p HEAD
tree 9a3c1f0e2b7d4a8c6e5f1d2b3a4c5d6e7f8a9b0c
parent 4b8e2d1a9f3c7e6b5a4d3c2b1a0f9e8d7c6b5a4f
author Dana Levi &lt;dana@example.com&gt; 1731580000 +0200
committer Dana Levi &lt;dana@example.com&gt; 1731580000 +0200

Add retry with jitter to payment client

$ git cat-file -p 'HEAD^{tree}'
100644 blob a1b2c3d4...   README.md
040000 tree e5f6a7b8...   src
100755 blob c9d0e1f2...   deploy.sh</pre>
<p>מכיוון ש-commit עושה hash ל-tree שלו <em>וגם</em> להורה שלו, שינוי של בייט אחד בכל מקום בהיסטוריה משנה את ה-hash של כל הצאצאים. זו הסיבה ש"שכתוב היסטוריה" מייצר commit-ים חדשים לגמרי, ולמה commit id הוא טביעת אצבע שמסגירה כל שינוי בכל הפרויקט עד אותה נקודה.</p>
<p><strong>SHA-1 ← SHA-256:</strong> ה-ids של Git הם SHA-1 (‏40 תווי hex). אחרי ה-collision של SHAttered ב-2017, Git עבר ל-SHA-1 מוקשח (SHA-1DC, עם זיהוי collisions) והוסיף repos של SHA-256 (‏<code>git init --object-format=sha256</code>, ‏64 תווי hex, זמין מ-Git 2.29). פרויקט Git מתכנן ש-SHA-256 יהיה ברירת המחדל ל-repos חדשים ב-Git 3.0, אבל התמיכה אצל ספקי ה-hosting עדיין חלקית, אז רוב ה-repos האמיתיים היום הם SHA-1. אי אפשר לערבב את שני הפורמטים באותו repo בלי שכבת ה-interop.</p>`
      }
    },
    {
      h: { en: "Snapshots, not diffs — and how packfiles keep it small", he: "Snapshots ולא diffs — ואיך packfiles שומרים על זה קטן" },
      body: {
        en: `<p>Every commit points at a <strong>full snapshot</strong> of the tree. Unchanged files are not copied — the new tree simply reuses the same blob hash. <code>git diff</code> and <code>git show</code> <em>compute</em> diffs on the fly by comparing two trees; diffs are never the storage model.</p>
<p>New objects start as <strong>loose objects</strong>: zlib-compressed files at <code>.git/objects/ce/013625...</code> (first 2 hex chars = directory). Periodically (<code>git gc</code>, auto-triggered at ~6,700 loose objects, and on every push/fetch transfer) Git builds a <strong>packfile</strong>: one <code>.pack</code> + <code>.idx</code> where similar objects are stored as <strong>deltas</strong> against each other. The delta base is chosen by similarity (same filename, similar size), not by history — so the newest version is usually stored whole and older versions as deltas, because you read recent versions most.</p>
<pre>$ git count-objects -vH
count: 37                 # loose objects
size: 148.00 KiB
in-pack: 184302           # objects inside packfiles
packs: 2
size-pack: 92.41 MiB
prune-packable: 0
garbage: 0
size-garbage: 0 bytes

$ ls .git/objects/pack/
pack-5e1c...a9.idx  pack-5e1c...a9.pack  pack-77d0...14.idx  pack-77d0...14.pack</pre>
<blockquote>💡 Real world: a 10-year-old monorepo with 400k commits often fits in 1-3 GB packed because text deltas compress extremely well. What blows up repos is binaries (zip, jar, model weights): each version is a new blob that barely deltas. That is what Git LFS and partial clone exist for.</blockquote>`,
        he: `<p>כל commit מצביע על <strong>snapshot מלא</strong> של ה-tree. קבצים שלא השתנו לא מועתקים — ה-tree החדש פשוט משתמש שוב באותו hash של blob. <code>git diff</code> ו-<code>git show</code> <em>מחשבים</em> diffs בזמן אמת על ידי השוואה של שני trees; diffs הם אף פעם לא מודל האחסון.</p>
<p>objects חדשים מתחילים כ-<strong>loose objects</strong>: קבצים דחוסים ב-zlib בנתיב <code>.git/objects/ce/013625...</code> (שני תווי ה-hex הראשונים = תיקייה). מדי פעם (<code>git gc</code>, שרץ אוטומטית בסביבות 6,700 loose objects, ובכל העברה של push/fetch) Git בונה <strong>packfile</strong>: קובץ <code>.pack</code> אחד + <code>.idx</code>, שבו objects דומים נשמרים כ-<strong>deltas</strong> אחד מול השני. ה-base של ה-delta נבחר לפי דמיון (אותו שם קובץ, גודל דומה), לא לפי היסטוריה — לכן הגרסה החדשה ביותר בדרך כלל נשמרת שלמה והישנות כ-deltas, כי את הגרסאות האחרונות קוראים הכי הרבה.</p>
<pre>$ git count-objects -vH
count: 37                 # loose objects
size: 148.00 KiB
in-pack: 184302           # objects inside packfiles
packs: 2
size-pack: 92.41 MiB
prune-packable: 0
garbage: 0
size-garbage: 0 bytes

$ ls .git/objects/pack/
pack-5e1c...a9.idx  pack-5e1c...a9.pack  pack-77d0...14.idx  pack-77d0...14.pack</pre>
<blockquote>💡 מהעולם האמיתי: monorepo בן 10 שנים עם 400 אלף commits נכנס הרבה פעמים ל-1-3GB ארוז, כי deltas של טקסט נדחסים מצוין. מה שמנפח repos זה בינאריים (zip, ‏jar, משקולות של מודלים): כל גרסה היא blob חדש שכמעט לא מתכווץ כ-delta. בשביל זה קיימים Git LFS ו-partial clone.</blockquote>`
      }
    },
    {
      h: { en: "Refs, branches, tags and HEAD are just tiny files", he: "Refs, ‏branches, ‏tags ו-HEAD הם סתם קבצים קטנים" },
      body: {
        en: `<p>A <strong>branch</strong> is a file containing a 40-char commit id. Committing on a branch = write the new commit object, then overwrite that file with the new id. Creating a branch costs 41 bytes, which is why Git branches are cheap and SVN branches were not.</p>
<pre>$ ls .git
HEAD  config  description  hooks/  index  info/  logs/  objects/  packed-refs  refs/
$ cat .git/HEAD
ref: refs/heads/main               # HEAD is a symbolic ref: "I am on main"
$ cat .git/refs/heads/main
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
$ git rev-parse main HEAD~2 origin/main
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
$ git rev-parse --abbrev-ref @{upstream}
origin/main</pre>
<ul>
<li><code>refs/heads/*</code> — local branches. <code>refs/tags/*</code> — tags (lightweight tag = ref straight to a commit; annotated = ref to a tag object). <code>refs/remotes/origin/*</code> — remote-tracking branches.</li>
<li>Thousands of refs get compacted into <code>.git/packed-refs</code>; Git 2.45+ also offers the <strong>reftable</strong> backend (<code>--ref-format=reftable</code>) for repos with 100k+ refs.</li>
<li><strong>HEAD</strong> normally points at a branch name. Check out a commit or tag directly (<code>git switch --detach v1.4.0</code>) and HEAD contains a raw commit id — <strong>detached HEAD</strong>. You can commit there, but no branch moves forward; switch away and those commits are reachable only via the reflog until you <code>git switch -c rescue</code>.</li>
<li>Revision syntax: <code>HEAD~3</code> = 3 first-parents back, <code>HEAD^2</code> = second parent of a merge, <code>main@{yesterday}</code> / <code>HEAD@{2}</code> = reflog positions, <code>A..B</code> = commits in B not in A.</li>
</ul>`,
        he: `<p><strong>branch</strong> הוא קובץ שמכיל commit id באורך 40 תווים. commit על branch = לכתוב את ה-commit object החדש, ואז לדרוס את הקובץ עם ה-id החדש. יצירת branch עולה 41 בייטים, ולכן branch-ים ב-Git זולים, וב-SVN הם לא היו.</p>
<pre>$ ls .git
HEAD  config  description  hooks/  index  info/  logs/  objects/  packed-refs  refs/
$ cat .git/HEAD
ref: refs/heads/main               # HEAD is a symbolic ref: "I am on main"
$ cat .git/refs/heads/main
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
$ git rev-parse main HEAD~2 origin/main
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
$ git rev-parse --abbrev-ref @{upstream}
origin/main</pre>
<ul>
<li><code>refs/heads/*</code> — branch-ים מקומיים. <code>refs/tags/*</code> — tags (‏lightweight tag = ref ישר ל-commit; ‏annotated = ref ל-tag object). <code>refs/remotes/origin/*</code> — remote-tracking branches.</li>
<li>אלפי refs נדחסים לקובץ <code>.git/packed-refs</code>; מ-Git 2.45 יש גם את ה-backend של <strong>reftable</strong> (‏<code>--ref-format=reftable</code>) ל-repos עם מעל 100 אלף refs.</li>
<li><strong>HEAD</strong> בדרך כלל מצביע על שם של branch. אם אתה עושה checkout ישירות ל-commit או ל-tag (‏<code>git switch --detach v1.4.0</code>), ה-HEAD מכיל commit id גולמי — <strong>detached HEAD</strong>. אפשר לעשות שם commit, אבל אף branch לא מתקדם; תעבור למקום אחר, וה-commits האלה נגישים רק דרך ה-reflog, עד שתריץ <code>git switch -c rescue</code>.</li>
<li>תחביר revisions: <code>HEAD~3</code> = שלושה first-parents אחורה, <code>HEAD^2</code> = ההורה השני של merge, ‏<code>main@{yesterday}</code> / <code>HEAD@{2}</code> = מיקומים ב-reflog, ‏<code>A..B</code> = commits שיש ב-B ואין ב-A.</li>
</ul>`
      }
    },
    {
      h: { en: "The index (staging area): the next commit, pre-built", he: "ה-index (‏staging area): ה-commit הבא, בנוי מראש" },
      body: {
        en: `<p>Git has three "trees": <strong>HEAD</strong> (last commit), the <strong>index</strong> (<code>.git/index</code>, a binary file listing every tracked path with its blob hash, mode and stat info), and the <strong>working tree</strong> (files on disk). <code>git add</code> hashes the file into a blob and updates the index entry; <code>git commit</code> turns the index into tree objects and writes a commit. Nothing else.</p>
<pre>$ git ls-files -s | head -3
100644 a1b2c3d4e5f6... 0	README.md
100755 c9d0e1f2a3b4... 0	deploy.sh
100644 77aa88bb99cc... 0	src/app.py
#  mode   blob hash   stage  path   (stage 1/2/3 appear only during a conflict)

$ git status -s
M  src/app.py      # left column: index vs HEAD (staged)
 M deploy.sh       # right column: working tree vs index (unstaged)
?? notes.txt       # untracked</pre>
<p>The stat info (mtime, size, inode) in the index is why <code>git status</code> on a 100k-file repo takes milliseconds: Git re-hashes only files whose stat data changed. Enable <code>core.fsmonitor=true</code> and <code>core.untrackedCache=true</code> on huge repos to skip even that scan.</p>
<blockquote>💡 Real world: <code>git add -p</code> stages individual hunks — it is the index that lets you turn one messy afternoon of edits into three clean, reviewable commits.</blockquote>`,
        he: `<p>ל-Git יש שלושה "trees": ‏<strong>HEAD</strong> (ה-commit האחרון), ה-<strong>index</strong> (‏<code>.git/index</code>, קובץ בינארי שמפרט כל path שעוקבים אחריו עם ה-hash של ה-blob, ה-mode ומידע stat), וה-<strong>working tree</strong> (הקבצים על הדיסק). <code>git add</code> עושה hash לקובץ לתוך blob ומעדכן את הרשומה ב-index; ‏<code>git commit</code> הופך את ה-index ל-tree objects וכותב commit. זהו.</p>
<pre>$ git ls-files -s | head -3
100644 a1b2c3d4e5f6... 0	README.md
100755 c9d0e1f2a3b4... 0	deploy.sh
100644 77aa88bb99cc... 0	src/app.py
#  mode   blob hash   stage  path   (stage 1/2/3 appear only during a conflict)

$ git status -s
M  src/app.py      # left column: index vs HEAD (staged)
 M deploy.sh       # right column: working tree vs index (unstaged)
?? notes.txt       # untracked</pre>
<p>מידע ה-stat (‏mtime, גודל, inode) ב-index הוא הסיבה ש-<code>git status</code> על repo עם 100 אלף קבצים לוקח מילישניות: Git עושה hash מחדש רק לקבצים שה-stat שלהם השתנה. ב-repos ענקיים תדליק <code>core.fsmonitor=true</code> ו-<code>core.untrackedCache=true</code> כדי לדלג אפילו על הסריקה הזאת.</p>
<blockquote>💡 מהעולם האמיתי: <code>git add -p</code> מכין hunks בודדים ל-commit — ה-index הוא מה שמאפשר לך להפוך אחר צהריים מבולגן של שינויים לשלושה commits נקיים שאפשר לעשות להם review.</blockquote>`
      }
    },
    {
      h: { en: "Remotes, tracking branches, fetch vs pull", he: "Remotes, ‏tracking branches, ‏fetch מול pull" },
      body: {
        en: `<p>A <strong>remote</strong> is a named URL plus a refspec in <code>.git/config</code>. <code>git fetch origin</code> downloads missing objects (as a packfile) and updates <strong>remote-tracking branches</strong> <code>refs/remotes/origin/*</code> — your read-only cache of where the server's branches were at last fetch. It never touches your branches or working tree.</p>
<pre>[remote "origin"]
    url = git@github.com:acme/payments.git
    fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
    remote = origin
    merge = refs/heads/main          # this makes origin/main main's upstream

$ git fetch origin
remote: Enumerating objects: 42, done.
remote: Counting objects: 100% (42/42), done.
remote: Compressing objects: 100% (18/18), done.
remote: Total 27 (delta 14), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (27/27), 6.12 KiB | 1.53 MiB/s, done.
   3f2a1bc..8e7d6c5  main       -&gt; origin/main
 + 1a2b3c4...9f8e7d6 feat/retry -&gt; origin/feat/retry  (forced update)
$ git status -sb
## main...origin/main [behind 3]</pre>
<p><strong>pull = fetch + integrate</strong> (merge by default, or rebase with <code>pull.rebase=true</code>, or refuse with <code>pull.ff=only</code>). Prefer <code>git fetch</code> then look (<code>git log --oneline main..origin/main</code>) before integrating, especially on shared branches. The <code>(forced update)</code> line above is how you notice someone rewrote a branch.</p>
<blockquote>⚠️ Production tip: "ahead/behind" in <code>git status</code> is relative to your <em>last fetch</em>, not the live server. "Your branch is up to date with 'origin/main'" after not fetching for a week means nothing.</blockquote>`,
        he: `<p><strong>remote</strong> הוא URL עם שם ועוד refspec בקובץ <code>.git/config</code>. <code>git fetch origin</code> מוריד objects חסרים (כ-packfile) ומעדכן את ה-<strong>remote-tracking branches</strong> ‏<code>refs/remotes/origin/*</code> — ה-cache שלך, לקריאה בלבד, של איפה ה-branches בשרת היו ב-fetch האחרון. הוא אף פעם לא נוגע ב-branch-ים שלך או ב-working tree.</p>
<pre>[remote "origin"]
    url = git@github.com:acme/payments.git
    fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
    remote = origin
    merge = refs/heads/main          # this makes origin/main main's upstream

$ git fetch origin
remote: Enumerating objects: 42, done.
remote: Counting objects: 100% (42/42), done.
remote: Compressing objects: 100% (18/18), done.
remote: Total 27 (delta 14), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (27/27), 6.12 KiB | 1.53 MiB/s, done.
   3f2a1bc..8e7d6c5  main       -&gt; origin/main
 + 1a2b3c4...9f8e7d6 feat/retry -&gt; origin/feat/retry  (forced update)
$ git status -sb
## main...origin/main [behind 3]</pre>
<p><strong>pull = fetch + שילוב</strong> (‏merge כברירת מחדל, rebase עם <code>pull.rebase=true</code>, או סירוב עם <code>pull.ff=only</code>). עדיף להריץ <code>git fetch</code>, להסתכל (‏<code>git log --oneline main..origin/main</code>) ורק אז לשלב, במיוחד ב-branches משותפים. השורה <code>(forced update)</code> למעלה היא איך שאתה שם לב שמישהו שכתב branch.</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-"ahead/behind" ב-<code>git status</code> הוא יחסית ל-<em>fetch האחרון שלך</em>, לא לשרת החי. ההודעה "Your branch is up to date with 'origin/main'" אחרי שבוע בלי fetch לא אומרת כלום.</blockquote>`
      }
    }
  ],
  diagram: `refs/heads/main ──► C3 ──parent──► C2 ──parent──► C1
     ▲                │               │
   HEAD               ▼ tree          ▼ tree
 (ref: refs/heads/main)  T3            T2
                       ├─ README.md ─► blob a1b2   ◄── reused by T2 (unchanged)
                       └─ src/  ─► tree e5f6
                                   └─ app.py ─► blob 77aa (new content = new blob)

refs/remotes/origin/main ──► C2      (where the server was at last fetch)`,
  handsOn: [
    { cmd: "git cat-file -p HEAD && git cat-file -p 'HEAD^{tree}'", what: { en: "Read the raw commit object, then the root tree it points to.", he: "לקרוא את ה-commit object הגולמי, ואז את ה-tree השורש שהוא מצביע עליו." } },
    { cmd: "cat .git/HEAD; cat .git/refs/heads/$(git branch --show-current) 2>/dev/null || grep \"refs/heads/$(git branch --show-current)\" .git/packed-refs", what: { en: "Prove a branch is just a file holding a commit id (it may live in packed-refs).", he: "להוכיח ש-branch הוא סתם קובץ שמחזיק commit id (הוא יכול לשבת ב-packed-refs)." } },
    { cmd: "git count-objects -vH && git gc && git count-objects -vH", what: { en: "Watch loose objects get packed into a packfile.", he: "לראות איך loose objects נארזים לתוך packfile." } },
    { cmd: "git ls-files -s | head; git status -s", what: { en: "See what the index holds and how it differs from HEAD and the working tree.", he: "לראות מה ה-index מחזיק ובמה הוא שונה מ-HEAD ומה-working tree." } },
    { cmd: "git fetch && git log --oneline --graph main..origin/main", what: { en: "See what you would get before pulling.", he: "לראות מה תקבל לפני שאתה עושה pull." } }
  ],
  mnemonic: {
    en: "Objects are forever, refs are post-its. Blob = file, tree = folder, commit = snapshot + parent, branch = pointer.",
    he: "Objects נשארים לתמיד, refs הם פתקים דביקים. Blob = קובץ, tree = תיקייה, commit = snapshot + הורה, branch = מצביע."
  },
  pitfalls: [
    { en: "Thinking Git stores diffs and that a branch \"contains\" commits. A branch is one pointer; which commits are \"on\" it is just reachability from that pointer.", he: "לחשוב ש-Git שומר diffs ושב-branch \"יש\" commits. branch הוא מצביע אחד; אילו commits \"עליו\" זה פשוט מה שנגיש מהמצביע הזה." },
    { en: "Committing in detached HEAD (e.g. after checking out a tag in CI or during a bisect) and switching away — the work is orphaned. Run git switch -c name before leaving.", he: "לעשות commit ב-detached HEAD (למשל אחרי checkout ל-tag ב-CI או באמצע bisect) ולעבור למקום אחר — העבודה נשארת יתומה. תריץ git switch -c name לפני שאתה עוזב." },
    { en: "Trusting origin/main without fetching. It is a local cache that can be days old.", he: "לסמוך על origin/main בלי fetch. זה cache מקומי שיכול להיות בן כמה ימים." },
    { en: "Committing a 300MB binary, then deleting it in the next commit. The blob stays in history and in every clone forever until you rewrite history.", he: "לעשות commit לבינארי של 300MB ולמחוק אותו ב-commit הבא. ה-blob נשאר בהיסטוריה ובכל clone לתמיד, עד שתשכתב היסטוריה." }
  ],
  interview: [
    { q: { en: "What exactly is a Git branch, and what happens on disk when you commit?", he: "מה בדיוק זה branch ב-Git, ומה קורה על הדיסק כשאתה עושה commit?" },
      a: { en: "A ref: a file (or packed-refs line) holding a commit id. On commit Git writes blobs for staged content (already done by git add), builds tree objects from the index, writes a commit object pointing at the root tree and the current HEAD commit as parent, then updates the branch ref HEAD points to — and appends a line to the reflog.", he: "ref: קובץ (או שורה ב-packed-refs) שמחזיק commit id. ב-commit, Git כותב blobs לתוכן שהוכן (את זה כבר עשה git add), בונה tree objects מה-index, כותב commit object שמצביע על ה-tree השורש ועל ה-commit הנוכחי של HEAD כהורה, ואז מעדכן את ה-ref של ה-branch ש-HEAD מצביע עליו — ומוסיף שורה ל-reflog." } },
    { q: { en: "Git stores full snapshots per commit. Why don't repos explode in size?", he: "Git שומר snapshot מלא לכל commit. למה repos לא מתפוצצים בגודל?" },
      a: { en: "Content addressing dedupes: unchanged files reuse the same blob and unchanged directories the same tree. Objects are zlib-compressed, and packfiles store similar objects as deltas against each other, so text history compresses massively. Binaries are the exception — they delta poorly.", he: "המיעון לפי תוכן מונע כפילויות: קבצים שלא השתנו משתמשים באותו blob, ותיקיות שלא השתנו באותו tree. ה-objects דחוסים ב-zlib, ו-packfiles שומרים objects דומים כ-deltas אחד מול השני, אז היסטוריה של טקסט נדחסת מאוד. בינאריים הם היוצא מן הכלל — ה-deltas שלהם גרועים." } },
    { q: { en: "Difference between git fetch and git pull?", he: "מה ההבדל בין git fetch ל-git pull?" },
      a: { en: "fetch downloads objects and updates remote-tracking refs (origin/*) only — safe, never changes your work. pull runs fetch and then merges (or rebases) the upstream into your current branch, which can create merge commits or conflicts.", he: "fetch מוריד objects ומעדכן רק את ה-remote-tracking refs (‏origin/*) — בטוח, אף פעם לא משנה את העבודה שלך. pull מריץ fetch ואז עושה merge (או rebase) של ה-upstream לתוך ה-branch הנוכחי, מה שיכול לייצר merge commits או conflicts." } }
  ],
  quiz: [
    { q: { en: "You change one line in one file out of 2,000 and commit. What new objects does Git create?", he: "שינית שורה אחת בקובץ אחד מתוך 2,000 ועשית commit. אילו objects חדשים Git יוצר?" },
      options: [
        { en: "A diff object with the changed line", he: "diff object עם השורה שהשתנתה" },
        { en: "A new blob for that file, new trees for every directory on its path up to the root, and a new commit", he: "blob חדש לקובץ הזה, trees חדשים לכל תיקייה בנתיב שלו עד השורש, ו-commit חדש" },
        { en: "2,000 new blobs (a full snapshot) and a new commit", he: "2,000 blobs חדשים (snapshot מלא) ו-commit חדש" },
        { en: "Only a new commit; the blob is updated in place", he: "רק commit חדש; ה-blob מתעדכן במקום" }
      ], answer: 1,
      explain: { en: "Snapshots reuse unchanged blobs and trees by hash. Only the changed blob and the trees on its path get new hashes, plus the commit. Objects are immutable — nothing is updated in place.", he: "snapshots משתמשים שוב ב-blobs וב-trees שלא השתנו לפי hash. רק ה-blob שהשתנה וה-trees בנתיב שלו מקבלים hash חדש, ועוד ה-commit. objects הם immutable — שום דבר לא מתעדכן במקום." } },
    { q: { en: "cat .git/HEAD prints a 40-character hex string instead of \"ref: refs/heads/...\". What does it mean?", he: "cat .git/HEAD מדפיס מחרוזת hex של 40 תווים במקום \"ref: refs/heads/...\". מה זה אומר?" },
      options: [
        { en: "The repository is corrupted", he: "ה-repository מושחת" },
        { en: "You are in detached HEAD: new commits won't advance any branch", he: "אתה ב-detached HEAD: commits חדשים לא יקדמו אף branch" },
        { en: "The repo uses SHA-256", he: "ה-repo משתמש ב-SHA-256" },
        { en: "HEAD is a packed ref", he: "HEAD הוא packed ref" }
      ], answer: 1,
      explain: { en: "A symbolic HEAD names a branch; a raw id means detached. Commit there and switch away, and the commits are reachable only from the reflog. (SHA-256 ids would be 64 chars.)", he: "HEAD סימבולי מצביע על שם של branch; id גולמי אומר detached. תעשה שם commit ותעבור למקום אחר, וה-commits נגישים רק מה-reflog. (‏ids של SHA-256 הם באורך 64 תווים.)" } },
    { q: { en: "After git fetch, which refs changed?", he: "אחרי git fetch, אילו refs השתנו?" },
      options: [
        { en: "Your current branch and the working tree", he: "ה-branch הנוכחי שלך וה-working tree" },
        { en: "Only refs/remotes/origin/* (and FETCH_HEAD)", he: "רק refs/remotes/origin/*‎ (ו-FETCH_HEAD)" },
        { en: "All local branches with an upstream", he: "כל ה-branches המקומיים שיש להם upstream" },
        { en: "Nothing; fetch only checks connectivity", he: "כלום; fetch רק בודק חיבור" }
      ], answer: 1,
      explain: { en: "fetch updates remote-tracking branches and FETCH_HEAD only. Integrating into your branch is a separate merge/rebase step — which is what pull adds.", he: "fetch מעדכן רק remote-tracking branches ו-FETCH_HEAD. השילוב לתוך ה-branch שלך הוא שלב נפרד של merge/rebase — וזה מה ש-pull מוסיף." } },
    { q: { en: "Why does git status stay fast in a repo with 100k files?", he: "למה git status נשאר מהיר ב-repo עם 100 אלף קבצים?" },
      options: [
        { en: "It only checks files changed in the last commit", he: "הוא בודק רק קבצים שהשתנו ב-commit האחרון" },
        { en: "The index caches stat data, so Git re-hashes only files whose mtime/size changed", he: "ה-index שומר stat data ב-cache, אז Git עושה hash מחדש רק לקבצים שה-mtime/size שלהם השתנו" },
        { en: "It asks the server", he: "הוא שואל את השרת" },
        { en: "Packfiles are pre-diffed against the working tree", he: "ה-packfiles כבר מחושבים מול ה-working tree" }
      ], answer: 1,
      explain: { en: "The index stores mtime, size, inode etc. per path. Unchanged stat = unchanged file, no hashing needed. fsmonitor goes further by avoiding even the stat calls.", he: "ה-index שומר mtime, גודל, inode וכו' לכל path. stat שלא השתנה = קובץ שלא השתנה, אין צורך ב-hash. ‏fsmonitor הולך רחוק יותר ונמנע אפילו מקריאות ה-stat." } }
  ],
  playground: "terminal",
  related: ["git-workflow", "git-undo-rescue", "git-large-repos"]
});

/* ------------------------------------------------------------
   2. Branching, merging & rebasing
   ------------------------------------------------------------ */
INFRA.lessons.push({
  id: "git-workflow",
  track: "git",
  order: 2,
  icon: "🔀",
  level: 2,
  minutes: 16,
  title: { en: "Branching, merging & rebasing done right", he: "Branching, ‏merge ו-rebase כמו שצריך" },
  tldr: {
    en: "Merge preserves what happened, rebase rewrites it into what should have happened. Rebase your own unpushed or private work freely; never rewrite a branch others build on, and when you must force-push use --force-with-lease.",
    he: "Merge שומר את מה שקרה, rebase משכתב את זה למה שהיה צריך לקרות. תעשה rebase חופשי לעבודה פרטית שלך או כזו שעוד לא עשית לה push; אף פעם אל תשכתב branch שאחרים בונים עליו, וכשחייבים force-push — רק עם ‎--force-with-lease."
  },
  analogy: {
    en: "Merging is stapling two notebooks together with a cover page saying \"joined here\" — honest, but the binder gets thick. Rebasing is rewriting your notebook pages as if you had started writing after reading the latest version of the team notebook — clean, but they are new pages with new page numbers, so anyone who photocopied your old pages now has a mismatching copy.",
    he: "merge זה להדק שתי מחברות יחד עם דף שער שאומר \"פה הן התחברו\" — כנה, אבל הקלסר מתעבה. rebase זה לכתוב מחדש את הדפים שלך כאילו התחלת לכתוב רק אחרי שקראת את הגרסה האחרונה של המחברת של הצוות — נקי, אבל אלה דפים חדשים עם מספרי עמודים חדשים, אז מי שצילם את הדפים הישנים שלך מחזיק עכשיו עותק שלא מתאים."
  },
  sections: [
    {
      h: { en: "Four ways to land a branch", he: "ארבע דרכים להכניס branch" },
      body: {
        en: `<p>Start: <code>main</code> moved on (M1, M2) while you committed F1, F2 on <code>feat</code>.</p>
<pre>            F1──F2   feat
           /
  A──B──C──M1──M2    main

1) Fast-forward (only possible if main did NOT move):  git merge --ff-only feat
  A──B──C──F1──F2    main = feat   (no new commit, just moves the pointer)

2) Merge commit:  git merge --no-ff feat
  A──B──C──M1──M2──M    main      (M has 2 parents: M2 and F2)
           \\       /
            F1──F2

3) Squash merge:  git merge --squash feat &amp;&amp; git commit
  A──B──C──M1──M2──S    main      (S = F1+F2 as ONE new commit, single parent)

4) Rebase then fast-forward:  git rebase main feat &amp;&amp; git switch main &amp;&amp; git merge --ff-only feat
  A──B──C──M1──M2──F1'──F2'    main   (F1', F2' are NEW commits, new hashes)</pre>
<table>
<tr><th>Strategy</th><th>History</th><th>Good for</th><th>Cost</th></tr>
<tr><td>Merge commit</td><td>True, non-linear</td><td>Long-lived branches, release branches, "what exactly shipped together"</td><td>Noisy graph; bisect walks into feature internals</td></tr>
<tr><td>Squash</td><td>Linear, 1 commit per PR</td><td>Most product teams; easy revert of a whole PR</td><td>Loses per-commit detail; the source branch looks "unmerged" to Git</td></tr>
<tr><td>Rebase + FF</td><td>Linear, every commit kept</td><td>Teams that curate commits; kernel-style history</td><td>Needs discipline; rewrites hashes</td></tr>
</table>
<blockquote>💡 Real world: GitHub's "Squash and merge", "Rebase and merge" and "Create a merge commit" buttons are exactly options 3, 4 and 2. Most teams pick one in repo settings and disable the rest so history stays consistent.</blockquote>`,
        he: `<p>נקודת פתיחה: <code>main</code> התקדם (M1, ‏M2) בזמן שעשית F1, ‏F2 על <code>feat</code>.</p>
<pre>            F1──F2   feat
           /
  A──B──C──M1──M2    main

1) Fast-forward (only possible if main did NOT move):  git merge --ff-only feat
  A──B──C──F1──F2    main = feat   (no new commit, just moves the pointer)

2) Merge commit:  git merge --no-ff feat
  A──B──C──M1──M2──M    main      (M has 2 parents: M2 and F2)
           \\       /
            F1──F2

3) Squash merge:  git merge --squash feat &amp;&amp; git commit
  A──B──C──M1──M2──S    main      (S = F1+F2 as ONE new commit, single parent)

4) Rebase then fast-forward:  git rebase main feat &amp;&amp; git switch main &amp;&amp; git merge --ff-only feat
  A──B──C──M1──M2──F1'──F2'    main   (F1', F2' are NEW commits, new hashes)</pre>
<table>
<tr><th>אסטרטגיה</th><th>היסטוריה</th><th>מתאים ל</th><th>מחיר</th></tr>
<tr><td>Merge commit</td><td>אמיתית, לא לינארית</td><td>branches ארוכי חיים, release branches, "מה בדיוק עלה יחד"</td><td>גרף רועש; bisect נכנס לתוך הפנים של פיצ'רים</td></tr>
<tr><td>Squash</td><td>לינארית, commit אחד ל-PR</td><td>רוב צוותי המוצר; revert קל ל-PR שלם</td><td>מאבדים פירוט לכל commit; ה-branch המקורי נראה ל-Git "לא ממוזג"</td></tr>
<tr><td>Rebase + FF</td><td>לינארית, כל commit נשמר</td><td>צוותים שמלטשים commits; היסטוריה בסגנון ה-kernel</td><td>דורש משמעת; משכתב hashes</td></tr>
</table>
<blockquote>💡 מהעולם האמיתי: הכפתורים "Squash and merge", ‏"Rebase and merge" ו-"Create a merge commit" ב-GitHub הם בדיוק אפשרויות 3, 4 ו-2. רוב הצוותים בוחרים אחת בהגדרות ה-repo ומבטלים את השאר, כדי שההיסטוריה תישאר עקבית.</blockquote>`
      }
    },
    {
      h: { en: "Interactive rebase: clean history before review", he: "Interactive rebase: היסטוריה נקייה לפני review" },
      body: {
        en: `<p><code>git rebase -i</code> lets you rewrite <em>your</em> unpushed (or private-branch) commits: reorder, squash, reword, split, drop.</p>
<pre>$ git rebase -i origin/main
pick 1a2b3c4 Add retry client
pick 5d6e7f8 wip
pick 9a0b1c2 Fix typo in retry client
pick 3d4e5f6 Add metrics for retries

# edit to:
pick   1a2b3c4 Add retry client
fixup  9a0b1c2 Fix typo in retry client     # melt into previous, drop its message
drop   5d6e7f8 wip
reword 3d4e5f6 Add metrics for retries
# Commands: p pick, r reword, e edit (stop to amend/split), s squash (meld + edit msg),
#           f fixup (meld, keep first msg), d drop, x exec &lt;cmd&gt; (run tests after each)</pre>
<p><strong>Autosquash</strong> makes this nearly automatic. When review asks for a change to an older commit:</p>
<pre>$ git commit --fixup=1a2b3c4          # creates "fixup! Add retry client"
$ git rebase -i --autosquash origin/main   # fixups are pre-sorted under their targets
$ git config --global rebase.autoSquash true
$ git rebase -i --exec "make test" origin/main   # prove every commit builds</pre>
<p>Useful extras: <code>rebase.updateRefs=true</code> (Git 2.38+) moves every branch in a <em>stack</em> of dependent PR branches during one rebase; <code>git rebase --onto main old-base feat</code> transplants a branch that was cut from the wrong base.</p>`,
        he: `<p><code>git rebase -i</code> מאפשר לשכתב commits <em>שלך</em> שעוד לא עשית להם push (או שהם על branch פרטי): לשנות סדר, לאחד, לשנות הודעה, לפצל, למחוק.</p>
<pre>$ git rebase -i origin/main
pick 1a2b3c4 Add retry client
pick 5d6e7f8 wip
pick 9a0b1c2 Fix typo in retry client
pick 3d4e5f6 Add metrics for retries

# edit to:
pick   1a2b3c4 Add retry client
fixup  9a0b1c2 Fix typo in retry client     # melt into previous, drop its message
drop   5d6e7f8 wip
reword 3d4e5f6 Add metrics for retries
# Commands: p pick, r reword, e edit (stop to amend/split), s squash (meld + edit msg),
#           f fixup (meld, keep first msg), d drop, x exec &lt;cmd&gt; (run tests after each)</pre>
<p><strong>Autosquash</strong> הופך את זה לכמעט אוטומטי. כשב-review מבקשים שינוי ב-commit ישן יותר:</p>
<pre>$ git commit --fixup=1a2b3c4          # creates "fixup! Add retry client"
$ git rebase -i --autosquash origin/main   # fixups are pre-sorted under their targets
$ git config --global rebase.autoSquash true
$ git rebase -i --exec "make test" origin/main   # prove every commit builds</pre>
<p>תוספות שימושיות: <code>rebase.updateRefs=true</code> (מ-Git 2.38) מזיז כל branch ב-<em>stack</em> של PR-ים תלויים במהלך rebase אחד; ‏<code>git rebase --onto main old-base feat</code> משתיל branch שנחתך מה-base הלא נכון.</p>`
      }
    },
    {
      h: { en: "When NOT to rebase, and --force-with-lease", he: "מתי לא לעשות rebase, ו-‎--force-with-lease" },
      body: {
        en: `<p><strong>The golden rule:</strong> don't rewrite commits that someone else may have based work on — <code>main</code>, <code>release/*</code>, or a feature branch two people push to. Rebase creates new hashes; their clones still hold the old ones, so their next pull duplicates commits or resurrects removed ones.</p>
<p>Rebasing your <em>own</em> PR branch after pushing is normal, but the push must be forced. Use the lease:</p>
<pre>$ git push --force-with-lease --force-if-includes
# --force-with-lease: refuse if origin/feat is no longer what MY last fetch saw
#   (i.e. a teammate pushed meanwhile)
# --force-if-includes (Git 2.30+): also refuse if I fetched their commits but never
#   integrated them (protects against background "git fetch" in IDEs defeating the lease)

 ! [rejected]        feat -&gt; feat (stale info)
error: failed to push some refs to 'github.com:acme/payments.git'</pre>
<p>Plain <code>git push --force</code> overwrites whatever is on the server, silently deleting anyone else's commits there. Alias it away: <code>git config --global alias.pushf "push --force-with-lease --force-if-includes"</code>.</p>
<blockquote>⚠️ Production tip: protect <code>main</code> and <code>release/*</code> with branch protection or rulesets: block force pushes and deletions, require PRs and status checks. Then a mistaken force-push to main is impossible rather than merely discouraged.</blockquote>`,
        he: `<p><strong>כלל הזהב:</strong> לא משכתבים commits שמישהו אחר אולי בנה עליהם עבודה — <code>main</code>, ‏<code>release/*</code>, או feature branch ששני אנשים עושים אליו push. rebase מייצר hashes חדשים; ב-clones שלהם עדיין יש את הישנים, אז ה-pull הבא שלהם משכפל commits או מחזיר לחיים כאלה שהוסרו.</p>
<p>rebase ל-branch של ה-PR <em>שלך</em> אחרי push זה נורמלי, אבל ה-push חייב להיות force. תשתמש ב-lease:</p>
<pre>$ git push --force-with-lease --force-if-includes
# --force-with-lease: refuse if origin/feat is no longer what MY last fetch saw
#   (i.e. a teammate pushed meanwhile)
# --force-if-includes (Git 2.30+): also refuse if I fetched their commits but never
#   integrated them (protects against background "git fetch" in IDEs defeating the lease)

 ! [rejected]        feat -&gt; feat (stale info)
error: failed to push some refs to 'github.com:acme/payments.git'</pre>
<p><code>git push --force</code> רגיל דורס את מה שיש בשרת ומוחק בשקט commits של כל אחד אחר שיש שם. תחליף אותו ב-alias: <code>git config --global alias.pushf "push --force-with-lease --force-if-includes"</code>.</p>
<blockquote>⚠️ טיפ לפרודקשן: תגן על <code>main</code> ועל <code>release/*</code> עם branch protection או rulesets: לחסום force push ומחיקה, לדרוש PR-ים ו-status checks. ככה force-push בטעות ל-main הוא בלתי אפשרי, ולא רק "לא מומלץ".</blockquote>`
      }
    },
    {
      h: { en: "Resolving conflicts step by step", he: "לפתור conflicts צעד אחרי צעד" },
      body: {
        en: `<p>A conflict means both sides changed the same lines (or one edited a file the other deleted) relative to the <strong>merge base</strong>. Turn on <code>zdiff3</code> so you also see the base — half of all conflicts become obvious once you see what the original was.</p>
<pre>$ git config --global merge.conflictStyle zdiff3
$ git merge feat
CONFLICT (content): Merge conflict in src/client.py
Automatic merge failed; fix conflicts and then commit the result.
$ git status -s
UU src/client.py

&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
TIMEOUT_S = 5
RETRIES = 3
||||||| base
TIMEOUT_S = 10
RETRIES = 3
=======
TIMEOUT_S = 10
RETRIES = 5
&gt;&gt;&gt;&gt;&gt;&gt;&gt; feat
# base had 10/3; main changed timeout, feat changed retries -&gt; keep BOTH: 5 and 5</pre>
<ol>
<li>Edit to the correct result, delete all markers. <code>git diff --check</code> catches leftover markers.</li>
<li><code>git add src/client.py</code> marks it resolved.</li>
<li>Run tests, then <code>git merge --continue</code> / <code>git rebase --continue</code>. Bail out anytime with <code>--abort</code>.</li>
<li>Whole-file picks: <code>git checkout --ours file</code> / <code>--theirs file</code>. <strong>During a rebase they are swapped</strong>: "ours" is the branch you are rebasing <em>onto</em> (main), "theirs" is your commit being replayed.</li>
<li><code>git mergetool</code> opens a 3-way tool (vimdiff, meld, VS Code via <code>merge.tool=vscode</code>).</li>
</ol>
<p><strong>rerere</strong> ("reuse recorded resolution"): with <code>rerere.enabled=true</code>, Git records how you resolved each conflict hunk and re-applies it automatically next time the same conflict appears — a lifesaver when you rebase a long branch repeatedly.</p>`,
        he: `<p>conflict אומר ששני הצדדים שינו את אותן שורות (או שצד אחד ערך קובץ שהשני מחק) ביחס ל-<strong>merge base</strong>. תדליק <code>zdiff3</code> כדי לראות גם את ה-base — חצי מה-conflicts נהיים ברורים ברגע שאתה רואה מה היה במקור.</p>
<pre>$ git config --global merge.conflictStyle zdiff3
$ git merge feat
CONFLICT (content): Merge conflict in src/client.py
Automatic merge failed; fix conflicts and then commit the result.
$ git status -s
UU src/client.py

&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
TIMEOUT_S = 5
RETRIES = 3
||||||| base
TIMEOUT_S = 10
RETRIES = 3
=======
TIMEOUT_S = 10
RETRIES = 5
&gt;&gt;&gt;&gt;&gt;&gt;&gt; feat
# base had 10/3; main changed timeout, feat changed retries -&gt; keep BOTH: 5 and 5</pre>
<ol>
<li>לערוך לתוצאה הנכונה ולמחוק את כל הסימונים. <code>git diff --check</code> תופס סימונים שנשארו.</li>
<li><code>git add src/client.py</code> מסמן שזה נפתר.</li>
<li>להריץ טסטים, ואז <code>git merge --continue</code> / <code>git rebase --continue</code>. אפשר לברוח בכל רגע עם <code>--abort</code>.</li>
<li>לבחור קובץ שלם: <code>git checkout --ours file</code> / <code>--theirs file</code>. <strong>ב-rebase הם מתהפכים</strong>: "ours" זה ה-branch שאתה עושה עליו rebase (‏main), ו-"theirs" זה ה-commit שלך שמשוחזר.</li>
<li><code>git mergetool</code> פותח כלי 3-way (‏vimdiff, ‏meld, ‏VS Code עם <code>merge.tool=vscode</code>).</li>
</ol>
<p><strong>rerere</strong> ("reuse recorded resolution"): עם <code>rerere.enabled=true</code>, Git מתעד איך פתרת כל hunk של conflict ומחיל את זה אוטומטית בפעם הבאה שאותו conflict מופיע — מציל חיים כשאתה עושה rebase שוב ושוב ל-branch ארוך.</p>`
      }
    },
    {
      h: { en: "Commit messages, small PRs and pull config", he: "הודעות commit, ‏PR-ים קטנים והגדרות pull" },
      body: {
        en: `<pre>Add jittered retry to payment client          &lt;- subject: imperative, ~50 chars, no period

Card-network timeouts spiked to 2% during peak; a fixed 1s retry caused
synchronized retry storms. Use full jitter (0..base*2^n, cap 8s), max 3
attempts, and only for idempotent calls (keyed by Idempotency-Key).
                                               &lt;- body wrapped at 72: WHY, not what
Refs: PAY-1423</pre>
<ul>
<li>The subject completes "If applied, this commit will…". The diff shows <em>what</em>; the message must say <em>why</em> and what you rejected.</li>
<li><strong>Keep PRs small</strong>: review quality drops sharply past ~400 changed lines (the classic Cisco/SmartBear study found 200-400 LOC per review session optimal). Split refactor from behavior change, ship behind a feature flag, or stack PRs.</li>
<li>One logical change per commit, and each commit should build — that is what makes <code>git bisect</code> and <code>git revert</code> work later.</li>
</ul>
<pre>$ git config --global pull.rebase true        # pull = fetch + rebase, no "Merge branch 'main' of ..." noise
$ git config --global rebase.autoStash true   # stash dirty tree around the rebase
$ git config --global pull.ff only            # alternative: refuse anything but fast-forward
$ git config --global push.autoSetupRemote true</pre>`,
        he: `<pre>Add jittered retry to payment client          &lt;- subject: imperative, ~50 chars, no period

Card-network timeouts spiked to 2% during peak; a fixed 1s retry caused
synchronized retry storms. Use full jitter (0..base*2^n, cap 8s), max 3
attempts, and only for idempotent calls (keyed by Idempotency-Key).
                                               &lt;- body wrapped at 72: WHY, not what
Refs: PAY-1423</pre>
<ul>
<li>ה-subject משלים את המשפט "If applied, this commit will…". ה-diff מראה <em>מה</em>; ההודעה צריכה להגיד <em>למה</em> ומה פסלת.</li>
<li><strong>תשמור על PR-ים קטנים</strong>: איכות ה-review צונחת מעבר לבערך 400 שורות ששונו (המחקר הקלאסי של Cisco/SmartBear מצא ש-200-400 שורות לסשן review זה האופטימום). תפריד refactor משינוי התנהגות, תעלה מאחורי feature flag, או תעשה stack של PR-ים.</li>
<li>שינוי לוגי אחד לכל commit, וכל commit צריך לעבור build — זה מה שגורם ל-<code>git bisect</code> ול-<code>git revert</code> לעבוד אחר כך.</li>
</ul>
<pre>$ git config --global pull.rebase true        # pull = fetch + rebase, no "Merge branch 'main' of ..." noise
$ git config --global rebase.autoStash true   # stash dirty tree around the rebase
$ git config --global pull.ff only            # alternative: refuse anything but fast-forward
$ git config --global push.autoSetupRemote true</pre>`
      }
    }
  ],
  handsOn: [
    { cmd: "git log --oneline --graph --decorate --all -20", what: { en: "See the real shape of history: merges, branches, where each ref points.", he: "לראות את הצורה האמיתית של ההיסטוריה: merges, ‏branches, ולאן כל ref מצביע." } },
    { cmd: "git commit --fixup=HEAD~2 && git rebase -i --autosquash origin/main", what: { en: "Fold a review fix into the commit it belongs to.", he: "לקפל תיקון מה-review לתוך ה-commit שהוא שייך אליו." } },
    { cmd: "git config --global merge.conflictStyle zdiff3 && git config --global rerere.enabled true", what: { en: "See the base in conflicts and let Git remember your resolutions.", he: "לראות את ה-base ב-conflicts ולתת ל-Git לזכור את הפתרונות שלך." } },
    { cmd: "git push --force-with-lease --force-if-includes", what: { en: "The only acceptable way to push a rebased branch.", he: "הדרך המקובלת היחידה לעשות push ל-branch אחרי rebase." } },
    { cmd: "git merge-base main feat && git diff main...feat --stat", what: { en: "Find the common ancestor and what the branch changed since it (three dots = vs merge base).", he: "למצוא את האב המשותף ומה ה-branch שינה מאז (שלוש נקודות = מול ה-merge base)." } }
  ],
  mnemonic: {
    en: "Merge = true story, rebase = edited story. Rebase what's yours, merge what's shared, and always lease your force.",
    he: "Merge = הסיפור האמיתי, rebase = הסיפור הערוך. rebase למה ששלך, merge למה שמשותף, ו-force תמיד עם lease."
  },
  pitfalls: [
    { en: "Rebasing a shared branch and force-pushing: teammates' next pull duplicates commits or silently drops their work.", he: "לעשות rebase ל-branch משותף ו-force-push: ה-pull הבא של חברי הצוות משכפל commits או מעלים בשקט את העבודה שלהם." },
    { en: "Forgetting that --ours/--theirs flip during a rebase and keeping the wrong side of a conflict.", he: "לשכוח ש-‎--ours/--theirs מתהפכים ב-rebase ולשמור את הצד הלא נכון של ה-conflict." },
    { en: "Committing conflict markers. Run git diff --check (or a pre-commit hook) before git add.", he: "לעשות commit עם סימוני conflict. תריץ git diff --check (או pre-commit hook) לפני git add." },
    { en: "Giant PRs with mixed refactor + feature: reviewers skim, bugs slip through, and reverting one part means reverting everything.", he: "PR-ים ענקיים שמערבבים refactor עם פיצ'ר: ה-reviewers מרפרפים, באגים עוברים, ו-revert לחלק אחד אומר revert להכל." }
  ],
  interview: [
    { q: { en: "Merge vs rebase — which do you use and when?", he: "Merge או rebase — במה אתה משתמש ומתי?" },
      a: { en: "Rebase (often interactive) for my own branch to stay current with main and to clean up commits before review; merge — or the team's chosen squash/rebase-merge — to land it. Never rebase a branch others have pulled. Merge commits are right for long-lived/release branches where the true topology matters.", he: "rebase (הרבה פעמים interactive) ל-branch שלי, כדי להישאר מעודכן מול main ולנקות commits לפני review; ‏merge — או ה-squash/rebase-merge שהצוות בחר — כדי להכניס אותו. אף פעם לא rebase ל-branch שאחרים עשו לו pull. merge commits מתאימים ל-branches ארוכי חיים או release branches, שבהם הטופולוגיה האמיתית חשובה." } },
    { q: { en: "What does --force-with-lease protect against that --force doesn't?", he: "מפני מה ‎--force-with-lease מגן ש-‎--force לא?" },
      a: { en: "It's a compare-and-swap: the push succeeds only if the remote ref still equals what my remote-tracking ref says. If a teammate pushed since my last fetch, it is rejected instead of erasing their commits. --force-if-includes closes the gap where an automatic fetch updated my tracking ref without me integrating.", he: "זה compare-and-swap: ה-push מצליח רק אם ה-ref בשרת עדיין שווה למה שה-remote-tracking ref שלי אומר. אם חבר צוות עשה push מאז ה-fetch האחרון שלי, ה-push נדחה במקום למחוק לו commits. ‎--force-if-includes סוגר את הפרצה שבה fetch אוטומטי עדכן את ה-tracking ref שלי בלי ששילבתי." } }
  ],
  quiz: [
    { q: { en: "main has not moved since you branched. git merge feat produces...", he: "main לא זז מאז שפתחת branch. ‏git merge feat מייצר..." },
      options: [
        { en: "A merge commit with two parents", he: "merge commit עם שני הורים" },
        { en: "A fast-forward: main's pointer just moves to feat's tip, no new commit", he: "fast-forward: המצביע של main פשוט זז לקצה של feat, בלי commit חדש" },
        { en: "A squashed commit", he: "commit אחד מאוחד (squash)" },
        { en: "A conflict", he: "conflict" }
      ], answer: 1,
      explain: { en: "If the target is an ancestor of the source, Git just moves the ref (unless --no-ff forces a merge commit).", he: "אם היעד הוא אב קדמון של המקור, Git פשוט מזיז את ה-ref (אלא אם ‎--no-ff מכריח merge commit)." } },
    { q: { en: "You rebased your PR branch onto the latest main. Why does a plain git push get rejected?", he: "עשית rebase ל-branch של ה-PR על ה-main העדכני. למה git push רגיל נדחה?" },
      options: [
        { en: "Rebased branches can't be pushed", he: "אי אפשר לעשות push ל-branch אחרי rebase" },
        { en: "The remote branch tip is no longer an ancestor of your new commits (they have new hashes), so it's not a fast-forward", he: "הקצה של ה-branch בשרת כבר לא אב קדמון של ה-commits החדשים שלך (יש להם hashes חדשים), אז זה לא fast-forward" },
        { en: "Branch protection always blocks rebased commits", he: "branch protection תמיד חוסם commits אחרי rebase" },
        { en: "You need to run git gc first", he: "צריך להריץ git gc קודם" }
      ], answer: 1,
      explain: { en: "Rebase replaced your commits with new ones; the old tip on the server would be discarded, so Git demands a force — use --force-with-lease.", he: "ה-rebase החליף את ה-commits שלך בחדשים; הקצה הישן בשרת ייזרק, אז Git דורש force — תשתמש ב-‎--force-with-lease." } },
    { q: { en: "During git rebase main, you run git checkout --theirs config.yaml. Whose version do you get?", he: "באמצע git rebase main אתה מריץ git checkout --theirs config.yaml. של מי הגרסה שתקבל?" },
      options: [
        { en: "main's version", he: "הגרסה של main" },
        { en: "Your branch's commit being replayed", he: "ה-commit מה-branch שלך שמשוחזר" },
        { en: "The merge base version", he: "הגרסה של ה-merge base" },
        { en: "The remote's version", he: "הגרסה של השרת" }
      ], answer: 1,
      explain: { en: "Rebase checks out main and replays your commits onto it, so \"ours\" = main (upstream) and \"theirs\" = your commit. The opposite of a merge.", he: "rebase עושה checkout ל-main ומשחזר עליו את ה-commits שלך, אז \"ours\" = ‏main (‏upstream) ו-\"theirs\" = ה-commit שלך. הפוך מ-merge." } },
    { q: { en: "What does rerere.enabled=true do?", he: "מה עושה rerere.enabled=true?" },
      options: [
        { en: "Retries failed pushes", he: "מנסה שוב push-ים שנכשלו" },
        { en: "Records conflict resolutions and replays them automatically when the same conflict recurs", he: "מתעד פתרונות של conflicts ומחיל אותם אוטומטית כשאותו conflict חוזר" },
        { en: "Rebases on every pull", he: "עושה rebase בכל pull" },
        { en: "Re-runs hooks after rebase", he: "מריץ שוב hooks אחרי rebase" }
      ], answer: 1,
      explain: { en: "Reuse Recorded Resolution. Essential when repeatedly rebasing long branches or re-doing a merge.", he: "Reuse Recorded Resolution. חיוני כשעושים rebase שוב ושוב ל-branches ארוכים או מבצעים merge מחדש." } }
  ],
  playground: "terminal",
  related: ["git-internals", "git-undo-rescue", "cicd-github-actions", "pr-code-review-quality"]
});

/* ------------------------------------------------------------
   3. Undo & rescue
   ------------------------------------------------------------ */
INFRA.lessons.push({
  id: "git-undo-rescue",
  track: "git",
  order: 3,
  icon: "🛟",
  level: 2,
  minutes: 16,
  title: { en: "Undo & rescue: reset, revert, reflog and leaked secrets", he: "Undo והצלה: reset, ‏revert, ‏reflog ו-secrets שדלפו" },
  tldr: {
    en: "Almost nothing committed is ever lost: the reflog remembers every place HEAD and your branches have been for ~90 days. Rewrite private history with reset/amend, undo shared history with revert — and a pushed secret is compromised the moment it lands, so rotate first, scrub second.",
    he: "כמעט שום דבר שעשית לו commit לא הולך לאיבוד: ה-reflog זוכר כל מקום שבו HEAD וה-branches שלך היו, בערך 90 יום. היסטוריה פרטית משכתבים עם reset/amend, היסטוריה משותפת מבטלים עם revert — ו-secret שעשית לו push נחשב דלוף ברגע שהוא נוחת, אז קודם מחליפים אותו ורק אחר כך מנקים."
  },
  analogy: {
    en: "Git is a building with a security camera on every door. reset is moving the \"you are here\" sign — the rooms you left are still there. revert is putting up a new sign saying \"ignore the change in room 12\" — nothing is torn down, everyone sees the correction. The reflog is the camera footage: even after you moved the signs badly, you can rewind and see exactly where you were at 14:02.",
    he: "Git הוא בניין עם מצלמת אבטחה על כל דלת. reset זה להזיז את השלט \"אתה נמצא כאן\" — החדרים שעזבת עדיין שם. revert זה לתלות שלט חדש: \"תתעלמו מהשינוי בחדר 12\" — שום דבר לא נהרס, וכולם רואים את התיקון. ה-reflog הוא צילומי המצלמה: גם אחרי שהזזת את השלטים לא נכון, אפשר להריץ אחורה ולראות בדיוק איפה היית ב-14:02."
  },
  sections: [
    {
      h: { en: "restore vs reset vs revert", he: "restore מול reset מול revert" },
      body: {
        en: `<ul>
<li><strong><code>git restore</code></strong> touches <em>files</em>, never history. <code>git restore app.py</code> = discard unstaged changes (copy from index). <code>git restore --staged app.py</code> = unstage (copy from HEAD into index). <code>git restore --source=HEAD~3 app.py</code> = bring back an old version.</li>
<li><strong><code>git reset &lt;commit&gt;</code></strong> moves the current <em>branch pointer</em>, then optionally the index and working tree:</li>
</ul>
<table>
<tr><th>Mode</th><th>Branch ref</th><th>Index</th><th>Working tree</th><th>Typical use</th></tr>
<tr><td><code>--soft</code></td><td>moved</td><td>kept</td><td>kept</td><td>Squash last N commits: <code>reset --soft HEAD~3 &amp;&amp; commit</code></td></tr>
<tr><td><code>--mixed</code> (default)</td><td>moved</td><td>reset</td><td>kept</td><td>Un-commit and re-stage differently</td></tr>
<tr><td><code>--hard</code></td><td>moved</td><td>reset</td><td><strong>reset</strong></td><td>Throw everything away — uncommitted work is gone for real</td></tr>
</table>
<ul>
<li><strong><code>git revert &lt;commit&gt;</code></strong> creates a <em>new</em> commit that applies the inverse diff. History only grows — the only safe undo on <code>main</code> or anything already pushed and pulled by others.</li>
</ul>
<pre>$ git revert 8e7d6c5
[main 2c4e6a8] Revert "Enable new pricing engine"
 3 files changed, 4 insertions(+), 41 deletions(-)

$ git revert -m 1 a1b2c3d     # undo a MERGE commit: -m 1 = keep parent 1 (main) as mainline
</pre>
<blockquote>⚠️ Production tip: after reverting a merge, Git considers those feature commits "already merged". Re-merging the fixed branch later brings in only the new commits — you must first <code>git revert</code> the revert commit, then merge the fixes.</blockquote>
<p>Other daily undos: <code>git commit --amend</code> (fix the last commit's message or add a forgotten file — rewrites it, so only before pushing), <code>git stash push -u -m "wip"</code> / <code>git stash pop</code> (park dirty work, <code>-u</code> includes untracked), <code>git cherry-pick -x &lt;sha&gt;</code> (copy one commit to another branch, e.g. a hotfix to <code>release/2.3</code>; <code>-x</code> records "cherry picked from commit ...").</p>`,
        he: `<ul>
<li><strong><code>git restore</code></strong> נוגע ב-<em>קבצים</em>, אף פעם לא בהיסטוריה. <code>git restore app.py</code> = לזרוק שינויים שלא הוכנו (העתקה מה-index). ‏<code>git restore --staged app.py</code> = להוציא מה-staging (העתקה מ-HEAD ל-index). ‏<code>git restore --source=HEAD~3 app.py</code> = להחזיר גרסה ישנה.</li>
<li><strong><code>git reset &lt;commit&gt;</code></strong> מזיז את <em>המצביע של ה-branch</em> הנוכחי, ואז אופציונלית את ה-index ואת ה-working tree:</li>
</ul>
<table>
<tr><th>Mode</th><th>Branch ref</th><th>Index</th><th>Working tree</th><th>שימוש טיפוסי</th></tr>
<tr><td><code>--soft</code></td><td>זז</td><td>נשמר</td><td>נשמר</td><td>לאחד את N ה-commits האחרונים: <code>reset --soft HEAD~3 &amp;&amp; commit</code></td></tr>
<tr><td><code>--mixed</code> (ברירת מחדל)</td><td>זז</td><td>מתאפס</td><td>נשמר</td><td>לבטל commit ולהכין מחדש בצורה אחרת</td></tr>
<tr><td><code>--hard</code></td><td>זז</td><td>מתאפס</td><td><strong>מתאפס</strong></td><td>לזרוק הכל — עבודה שלא עשית לה commit נעלמת באמת</td></tr>
</table>
<ul>
<li><strong><code>git revert &lt;commit&gt;</code></strong> יוצר commit <em>חדש</em> שמחיל את ה-diff ההפוך. ההיסטוריה רק גדלה — זה ה-undo הבטוח היחיד על <code>main</code> או על כל דבר שכבר עשית לו push ואחרים משכו.</li>
</ul>
<pre>$ git revert 8e7d6c5
[main 2c4e6a8] Revert "Enable new pricing engine"
 3 files changed, 4 insertions(+), 41 deletions(-)

$ git revert -m 1 a1b2c3d     # undo a MERGE commit: -m 1 = keep parent 1 (main) as mainline
</pre>
<blockquote>⚠️ טיפ לפרודקשן: אחרי revert ל-merge, ‏Git מחשיב את ה-commits של הפיצ'ר כ"כבר ממוזגים". merge מחדש של ה-branch המתוקן יכניס רק את ה-commits החדשים — קודם צריך לעשות <code>git revert</code> ל-commit של ה-revert, ורק אז merge לתיקונים.</blockquote>
<p>עוד undos יומיומיים: <code>git commit --amend</code> (לתקן את ההודעה של ה-commit האחרון או להוסיף קובץ ששכחת — זה משכתב אותו, אז רק לפני push), ‏<code>git stash push -u -m "wip"</code> / <code>git stash pop</code> (להחנות עבודה מלוכלכת, ‏<code>-u</code> כולל קבצים שלא במעקב), ‏<code>git cherry-pick -x &lt;sha&gt;</code> (להעתיק commit אחד ל-branch אחר, למשל hotfix ל-<code>release/2.3</code>; ‏<code>-x</code> רושם "cherry picked from commit ...").</p>`
      }
    },
    {
      h: { en: "The reflog: your undo history for refs", he: "ה-reflog: היסטוריית ה-undo של ה-refs" },
      body: {
        en: `<p>Every time HEAD or a branch moves (commit, reset, rebase, checkout, merge, pull, amend), Git appends a line to <code>.git/logs/HEAD</code> and <code>.git/logs/refs/heads/&lt;branch&gt;</code>. Objects are not deleted when they become unreachable — <code>git gc</code> prunes them only after the reflog entries expire: <strong>90 days</strong> for reachable entries (<code>gc.reflogExpire</code>) and <strong>30 days</strong> for unreachable ones (<code>gc.reflogExpireUnreachable</code>).</p>
<pre># Oops: reset --hard to the wrong commit, 3 commits "gone"
$ git reset --hard HEAD~3
HEAD is now at 4b8e2d1 Bump deps
$ git reflog -6
4b8e2d1 (HEAD -&gt; feat) HEAD@{0}: reset: moving to HEAD~3
9f8e7d6 HEAD@{1}: commit: Add retry metrics
5c4b3a2 HEAD@{2}: commit: Handle 429 from card network
1a2b3c4 HEAD@{3}: commit: Add retry client
4b8e2d1 HEAD@{4}: checkout: moving from main to feat
$ git reset --hard HEAD@{1}       # or: git reset --hard 9f8e7d6
HEAD is now at 9f8e7d6 Add retry metrics

# A rebase went wrong? ORIG_HEAD holds where you were before it
$ git reset --hard ORIG_HEAD
$ git reflog show feat@{2.hours.ago}   # time-based lookup works too</pre>
<p><strong>Deleted a branch?</strong> Git told you the id: <code>Deleted branch feat/retry (was 9f8e7d6).</code> → <code>git branch feat/retry 9f8e7d6</code>. Lost the output? <code>git reflog</code> shows "checkout: moving from feat/retry to main" with the commit. For commits never in any reflog (a dropped stash, an object received but never checked out): <code>git fsck --lost-found --no-reflogs</code> lists dangling commits.</p>
<blockquote>⚠️ Production tip: the reflog is <strong>local and never pushed</strong>. If a commit only ever existed on a laptop that was wiped, it is gone. On the server side, hosts keep their own push logs (GitHub "Activity" view and API show force-push before/after SHAs; GitLab audit events) — use those when a shared branch was overwritten.</blockquote>`,
        he: `<p>בכל פעם ש-HEAD או branch זזים (commit, ‏reset, ‏rebase, ‏checkout, ‏merge, ‏pull, ‏amend), ‏Git מוסיף שורה ל-<code>.git/logs/HEAD</code> ול-<code>.git/logs/refs/heads/&lt;branch&gt;</code>. objects לא נמחקים כשהם הופכים ללא-נגישים — <code>git gc</code> מנקה אותם רק אחרי שרשומות ה-reflog פגות: <strong>90 יום</strong> לרשומות נגישות (‏<code>gc.reflogExpire</code>) ו-<strong>30 יום</strong> ללא-נגישות (‏<code>gc.reflogExpireUnreachable</code>).</p>
<pre># Oops: reset --hard to the wrong commit, 3 commits "gone"
$ git reset --hard HEAD~3
HEAD is now at 4b8e2d1 Bump deps
$ git reflog -6
4b8e2d1 (HEAD -&gt; feat) HEAD@{0}: reset: moving to HEAD~3
9f8e7d6 HEAD@{1}: commit: Add retry metrics
5c4b3a2 HEAD@{2}: commit: Handle 429 from card network
1a2b3c4 HEAD@{3}: commit: Add retry client
4b8e2d1 HEAD@{4}: checkout: moving from main to feat
$ git reset --hard HEAD@{1}       # or: git reset --hard 9f8e7d6
HEAD is now at 9f8e7d6 Add retry metrics

# A rebase went wrong? ORIG_HEAD holds where you were before it
$ git reset --hard ORIG_HEAD
$ git reflog show feat@{2.hours.ago}   # time-based lookup works too</pre>
<p><strong>מחקת branch?</strong> Git אמר לך את ה-id: ‏<code>Deleted branch feat/retry (was 9f8e7d6).</code> ← <code>git branch feat/retry 9f8e7d6</code>. הפלט הלך? <code>git reflog</code> מראה "checkout: moving from feat/retry to main" עם ה-commit. ל-commits שאף פעם לא היו באף reflog (‏stash שנזרק, object שהתקבל אבל אף פעם לא עשו לו checkout): ‏<code>git fsck --lost-found --no-reflogs</code> מציג dangling commits.</p>
<blockquote>⚠️ טיפ לפרודקשן: ה-reflog הוא <strong>מקומי ואף פעם לא עובר ב-push</strong>. אם commit היה קיים רק על לפטופ שנמחק, הוא אבד. בצד השרת, ספקי ה-hosting שומרים לוג push משלהם (תצוגת "Activity" וה-API של GitHub מראים את ה-SHA לפני ואחרי force-push; ב-GitLab יש audit events) — בהם משתמשים כש-branch משותף נדרס.</blockquote>`
      }
    },
    {
      h: { en: "A secret got pushed: rotate first, then rewrite", he: "Secret עלה ב-push: קודם מחליפים, אחר כך משכתבים" },
      body: {
        en: `<p>The moment an AWS key hits a public repo, assume it is compromised: scrapers watch the public GitHub event stream and leaked keys are typically tried within minutes. Even in a private repo, every clone, fork, CI cache and PR ref already has it. Order of operations:</p>
<ol>
<li><strong>Revoke / rotate the secret now</strong> (IAM key deactivate, DB password change, token revoke). Check usage logs (CloudTrail etc.) for abuse.</li>
<li>Remove it from the tip in a normal commit and move it to a secret manager.</li>
<li>Optionally rewrite history so it stops spreading — mandatory if the repo will be made public.</li>
</ol>
<pre># git filter-repo (recommended by the Git project; replaces filter-branch)
$ pip install git-filter-repo
$ git clone --mirror git@github.com:acme/payments.git &amp;&amp; cd payments.git
$ git filter-repo --invert-paths --path config/.env              # drop a file from all history
$ echo 'AKIAIOSFODNN7EXAMPLE==&gt;***REMOVED***' &gt; ../replacements.txt
$ git filter-repo --replace-text ../replacements.txt              # scrub a string everywhere
$ git push --force --mirror origin

# BFG Repo-Cleaner (Java, older, fast)
$ java -jar bfg.jar --delete-files .env --replace-text passwords.txt payments.git
$ git reflog expire --expire=now --all &amp;&amp; git gc --prune=now --aggressive</pre>
<p>After rewriting: every commit hash after the leak changes, so all collaborators must re-clone (a pull would merge the dirty history back in). Old commits may still be reachable on the host via PR refs (<code>refs/pull/*</code>), forks and cached views — GitHub and GitLab document a support request to purge them.</p>
<blockquote>💡 Real world: prevention beats cleanup — enable push protection / secret scanning on the host and a pre-commit scanner (gitleaks, trufflehog) so the key is blocked before it ever leaves the laptop.</blockquote>`,
        he: `<p>ברגע שמפתח AWS נוחת ב-repo ציבורי, תניח שהוא דלוף: scrapers עוקבים אחרי ה-event stream הציבורי של GitHub, ומפתחות שדלפו בדרך כלל נבדקים תוך דקות. גם ב-repo פרטי, כל clone, ‏fork, ‏cache של CI ו-ref של PR כבר מחזיקים אותו. סדר הפעולות:</p>
<ol>
<li><strong>לבטל או להחליף את ה-secret עכשיו</strong> (‏deactivate למפתח IAM, החלפת סיסמת DB, ‏revoke ל-token). לבדוק לוגים של שימוש (‏CloudTrail וכו') לחשד לניצול.</li>
<li>להסיר אותו מהקצה ב-commit רגיל ולהעביר אותו ל-secret manager.</li>
<li>אופציונלית, לשכתב היסטוריה כדי שהוא יפסיק להתפשט — חובה אם ה-repo עומד להיות ציבורי.</li>
</ol>
<pre># git filter-repo (recommended by the Git project; replaces filter-branch)
$ pip install git-filter-repo
$ git clone --mirror git@github.com:acme/payments.git &amp;&amp; cd payments.git
$ git filter-repo --invert-paths --path config/.env              # drop a file from all history
$ echo 'AKIAIOSFODNN7EXAMPLE==&gt;***REMOVED***' &gt; ../replacements.txt
$ git filter-repo --replace-text ../replacements.txt              # scrub a string everywhere
$ git push --force --mirror origin

# BFG Repo-Cleaner (Java, older, fast)
$ java -jar bfg.jar --delete-files .env --replace-text passwords.txt payments.git
$ git reflog expire --expire=now --all &amp;&amp; git gc --prune=now --aggressive</pre>
<p>אחרי השכתוב: כל hash של commit אחרי הדליפה משתנה, אז כל השותפים חייבים לעשות clone מחדש (‏pull יחזיר את ההיסטוריה המלוכלכת דרך merge). commits ישנים עדיין יכולים להיות נגישים אצל ספק ה-hosting דרך refs של PR-ים (‏<code>refs/pull/*</code>), ‏forks ותצוגות שנשמרו ב-cache — ב-GitHub וב-GitLab יש בקשת support מתועדת כדי לנקות אותם.</p>
<blockquote>💡 מהעולם האמיתי: מניעה עדיפה על ניקוי — תדליק push protection / secret scanning אצל ספק ה-hosting ו-scanner ב-pre-commit (‏gitleaks, ‏trufflehog), כדי שהמפתח ייחסם עוד לפני שהוא יוצא מהלפטופ.</blockquote>`
      }
    },
    {
      h: { en: "\"What do I run?\" decision table", he: "טבלת \"מה להריץ?\"" },
      body: {
        en: `<table>
<tr><th>Situation</th><th>Command</th><th>Rewrites history?</th></tr>
<tr><td>Discard local edits to a file</td><td><code>git restore file</code></td><td>No</td></tr>
<tr><td>Unstage a file</td><td><code>git restore --staged file</code></td><td>No</td></tr>
<tr><td>Typo in last commit msg / forgot a file (not pushed)</td><td><code>git commit --amend</code></td><td>Yes (1 commit)</td></tr>
<tr><td>Undo last 2 commits, keep the changes</td><td><code>git reset --soft HEAD~2</code></td><td>Yes</td></tr>
<tr><td>Throw away local commits, match the server</td><td><code>git fetch &amp;&amp; git reset --hard origin/main</code></td><td>Yes (local)</td></tr>
<tr><td>Bad commit already on main</td><td><code>git revert &lt;sha&gt;</code></td><td>No</td></tr>
<tr><td>Bad merge already on main</td><td><code>git revert -m 1 &lt;merge-sha&gt;</code></td><td>No</td></tr>
<tr><td>Need to switch branches with dirty work</td><td><code>git stash push -u</code> → <code>git stash pop</code></td><td>No</td></tr>
<tr><td>Hotfix needed on a release branch</td><td><code>git cherry-pick -x &lt;sha&gt;</code></td><td>No</td></tr>
<tr><td>"Lost" commits after reset/rebase/amend</td><td><code>git reflog</code> → <code>git reset --hard HEAD@{n}</code> or <code>git branch rescue &lt;sha&gt;</code></td><td>Restores</td></tr>
<tr><td>Deleted a branch</td><td><code>git branch name &lt;sha-from-reflog&gt;</code></td><td>Restores</td></tr>
<tr><td>Pushed a secret</td><td>Rotate → remove → <code>git filter-repo</code> + force push + re-clone</td><td>Yes (everything)</td></tr>
</table>
<p>Before any scary operation, make a free safety net: <code>git branch backup/before-rebase</code>. It costs 41 bytes.</p>`,
        he: `<table>
<tr><th>מצב</th><th>פקודה</th><th>משכתב היסטוריה?</th></tr>
<tr><td>לזרוק שינויים מקומיים בקובץ</td><td><code>git restore file</code></td><td>לא</td></tr>
<tr><td>להוציא קובץ מה-staging</td><td><code>git restore --staged file</code></td><td>לא</td></tr>
<tr><td>טעות בהודעה של ה-commit האחרון / שכחת קובץ (לפני push)</td><td><code>git commit --amend</code></td><td>כן (‏commit אחד)</td></tr>
<tr><td>לבטל את שני ה-commits האחרונים ולשמור את השינויים</td><td><code>git reset --soft HEAD~2</code></td><td>כן</td></tr>
<tr><td>לזרוק commits מקומיים ולהתיישר לשרת</td><td><code>git fetch &amp;&amp; git reset --hard origin/main</code></td><td>כן (מקומית)</td></tr>
<tr><td>commit גרוע שכבר ב-main</td><td><code>git revert &lt;sha&gt;</code></td><td>לא</td></tr>
<tr><td>merge גרוע שכבר ב-main</td><td><code>git revert -m 1 &lt;merge-sha&gt;</code></td><td>לא</td></tr>
<tr><td>צריך להחליף branch עם עבודה מלוכלכת</td><td><code>git stash push -u</code> ← <code>git stash pop</code></td><td>לא</td></tr>
<tr><td>צריך hotfix על release branch</td><td><code>git cherry-pick -x &lt;sha&gt;</code></td><td>לא</td></tr>
<tr><td>commits "אבודים" אחרי reset/rebase/amend</td><td><code>git reflog</code> ← <code>git reset --hard HEAD@{n}</code> או <code>git branch rescue &lt;sha&gt;</code></td><td>משחזר</td></tr>
<tr><td>מחקת branch</td><td><code>git branch name &lt;sha-from-reflog&gt;</code></td><td>משחזר</td></tr>
<tr><td>עשית push ל-secret</td><td>להחליף ← להסיר ← <code>git filter-repo</code> + force push + clone מחדש</td><td>כן (הכל)</td></tr>
</table>
<p>לפני כל פעולה מפחידה, תיצור רשת ביטחון בחינם: <code>git branch backup/before-rebase</code>. זה עולה 41 בייטים.</p>`
      }
    }
  ],
  diagram: `git reset --soft  : moves [branch]
git reset --mixed : moves [branch] + [index]
git reset --hard  : moves [branch] + [index] + [working tree]   <- uncommitted work lost

git revert X      : A──B──X──C──X'     (X' = inverse of X, history only grows)

reflog            : HEAD@{0} reset ─┐
                    HEAD@{1} commit ◄┘  git reset --hard HEAD@{1}  brings it back`,
  handsOn: [
    { cmd: "git reflog -15", what: { en: "See every place HEAD has been — your undo history.", he: "לראות כל מקום שבו HEAD היה — היסטוריית ה-undo שלך." } },
    { cmd: "git branch backup/now && git reset --hard HEAD~2 && git reset --hard HEAD@{1}", what: { en: "Practice: lose two commits and bring them back from the reflog.", he: "תרגול: לאבד שני commits ולהחזיר אותם מה-reflog." } },
    { cmd: "git stash push -u -m \"wip\" && git stash list && git stash show -p stash@{0}", what: { en: "Park work including untracked files and inspect it.", he: "להחנות עבודה כולל קבצים שלא במעקב ולבדוק אותה." } },
    { cmd: "git fsck --lost-found --no-reflogs | head", what: { en: "Find dangling commits that no reflog points to (e.g. a dropped stash).", he: "למצוא dangling commits שאף reflog לא מצביע עליהם (למשל stash שנזרק)." } }
  ],
  mnemonic: {
    en: "Restore files, reset pointers, revert in public. When in doubt: reflog, then breathe.",
    he: "Restore לקבצים, reset למצביעים, revert בפומבי. בספק? reflog, ואז לנשום."
  },
  pitfalls: [
    { en: "git reset --hard with uncommitted changes: those were never objects, so the reflog can't help. Stash or commit first.", he: "git reset --hard עם שינויים שלא עשית להם commit: הם אף פעם לא היו objects, אז ה-reflog לא יעזור. קודם stash או commit." },
    { en: "Resetting or amending commits already on main and force-pushing instead of using revert.", he: "לעשות reset או amend ל-commits שכבר ב-main ו-force-push, במקום להשתמש ב-revert." },
    { en: "Re-merging a branch after reverting its merge and wondering why half the changes are missing — revert the revert first.", he: "לעשות merge מחדש ל-branch אחרי revert ל-merge שלו ולתהות למה חצי מהשינויים חסרים — קודם revert ל-revert." },
    { en: "Scrubbing a leaked key from history but not rotating it. The key already left; rewriting history doesn't un-leak it.", he: "לנקות מפתח שדלף מההיסטוריה בלי להחליף אותו. המפתח כבר יצא; שכתוב היסטוריה לא מבטל את הדליפה." }
  ],
  interview: [
    { q: { en: "A teammate ran git reset --hard and lost a day of commits. Can you recover them?", he: "חבר צוות הריץ git reset --hard ואיבד יום של commits. אפשר לשחזר?" },
      a: { en: "Yes, if they were committed: git reflog shows the previous HEAD positions; git reset --hard HEAD@{n} or git branch rescue <sha>. Unreachable objects survive until reflog expiry (30 days default for unreachable) plus gc. Uncommitted, unstaged edits are gone; staged-but-uncommitted content can sometimes be found as dangling blobs with git fsck.", he: "כן, אם עשו להם commit: ‏git reflog מראה את המיקומים הקודמים של HEAD; ‏git reset --hard HEAD@{n} או git branch rescue <sha>. objects לא-נגישים שורדים עד שה-reflog פג (‏30 יום כברירת מחדל ללא-נגישים) ועוד gc. שינויים שלא הוכנו ולא עשו להם commit אבדו; תוכן שהוכן ב-staging בלי commit אפשר לפעמים למצוא כ-dangling blobs עם git fsck." } },
    { q: { en: "reset vs revert — when do you use which?", he: "reset או revert — מתי משתמשים בכל אחד?" },
      a: { en: "reset moves a branch pointer and rewrites history: fine for local/private branches. revert adds an inverse commit, preserving history: required for shared branches like main, and it is auditable and itself revertible.", he: "reset מזיז מצביע של branch ומשכתב היסטוריה: בסדר ל-branches מקומיים או פרטיים. revert מוסיף commit הפוך ושומר על ההיסטוריה: חובה ב-branches משותפים כמו main, והוא ניתן למעקב ואפשר לעשות לו revert בעצמו." } }
  ],
  quiz: [
    { q: { en: "A bad commit was merged to main an hour ago and 10 people have pulled. What do you do?", he: "commit גרוע נכנס ל-main לפני שעה ו-10 אנשים כבר עשו pull. מה עושים?" },
      options: [
        { en: "git reset --hard HEAD~1 && git push --force", he: "git reset --hard HEAD~1 && git push --force" },
        { en: "git revert <sha> and push", he: "git revert <sha> ו-push" },
        { en: "git commit --amend", he: "git commit --amend" },
        { en: "Delete main and recreate it", he: "למחוק את main וליצור אותו מחדש" }
      ], answer: 1,
      explain: { en: "Shared history must not be rewritten. revert adds an inverse commit everyone can pull normally.", he: "אסור לשכתב היסטוריה משותפת. revert מוסיף commit הפוך שכולם יכולים למשוך כרגיל." } },
    { q: { en: "Which reset keeps your changes staged, ready to commit again?", he: "איזה reset שומר את השינויים שלך ב-staging, מוכנים ל-commit מחדש?" },
      options: [
        { en: "--hard", he: "‎--hard" },
        { en: "--mixed", he: "‎--mixed" },
        { en: "--soft", he: "‎--soft" },
        { en: "--keep", he: "‎--keep" }
      ], answer: 2,
      explain: { en: "--soft moves only the branch ref; index and working tree stay, so everything appears staged. --mixed unstages; --hard discards.", he: "‎--soft מזיז רק את ה-ref של ה-branch; ה-index וה-working tree נשארים, אז הכל נראה מוכן ל-commit. ‎--mixed מוציא מה-staging; ‎--hard זורק." } },
    { q: { en: "You force-pushed a branch rewrite and then realize you dropped a needed commit. Where do you look first?", he: "עשית force-push לשכתוב של branch ואז הבנת שזרקת commit שהיה צריך. איפה מחפשים קודם?" },
      options: [
        { en: "git log origin/branch", he: "git log origin/branch" },
        { en: "Your local git reflog (HEAD and branch logs)", he: "ה-git reflog המקומי שלך (הלוגים של HEAD ושל ה-branch)" },
        { en: "git stash list", he: "git stash list" },
        { en: "It's gone; nothing to do", he: "זה אבד; אין מה לעשות" }
      ], answer: 1,
      explain: { en: "The reflog recorded the pre-rewrite tip. origin/branch now shows the rewritten history.", he: "ה-reflog תיעד את הקצה שלפני השכתוב. origin/branch מראה עכשיו את ההיסטוריה המשוכתבת." } },
    { q: { en: "An API key was pushed to a public repo 5 minutes ago. First action?", he: "API key עלה ב-push ל-repo ציבורי לפני 5 דקות. פעולה ראשונה?" },
      options: [
        { en: "Run git filter-repo and force-push", he: "להריץ git filter-repo ו-force-push" },
        { en: "Make the repo private", he: "להפוך את ה-repo לפרטי" },
        { en: "Revoke/rotate the key and check its usage logs", he: "לבטל/להחליף את המפתח ולבדוק את לוגי השימוש שלו" },
        { en: "Delete the commit with git revert", he: "למחוק את ה-commit עם git revert" }
      ], answer: 2,
      explain: { en: "Assume it's already harvested. Rotation stops the damage; history rewriting only limits further spread (and revert doesn't remove it from history at all).", he: "תניח שהוא כבר נאסף. ההחלפה עוצרת את הנזק; שכתוב היסטוריה רק מגביל המשך התפשטות (ו-revert בכלל לא מוציא אותו מההיסטוריה)." } }
  ],
  playground: "terminal",
  related: ["git-internals", "git-workflow", "git-repo-security", "cloud-secrets-management"]
});

/* ------------------------------------------------------------
   4. Debugging with Git
   ------------------------------------------------------------ */
INFRA.lessons.push({
  id: "git-debugging",
  track: "git",
  order: 4,
  icon: "🔎",
  level: 2,
  minutes: 14,
  title: { en: "Debugging with Git: bisect, blame, pickaxe & worktrees", he: "Debugging עם Git: ‏bisect, ‏blame, ‏pickaxe ו-worktrees" },
  tldr: {
    en: "History is a debugging database. git bisect finds the commit that broke something in log2(N) steps (1,000 commits ≈ 10 tests), pickaxe (log -S/-G) finds when a string appeared or vanished, blame -w -C -C finds who really wrote a line, and worktrees let you check a hotfix without stashing anything.",
    he: "ההיסטוריה היא מסד נתונים ל-debugging. ‏git bisect מוצא את ה-commit ששבר משהו ב-log2(N) צעדים (‏1,000 commits ≈ ‏10 בדיקות), ‏pickaxe (‏log -S/-G) מוצא מתי מחרוזת הופיעה או נעלמה, ‏blame -w -C -C מוצא מי באמת כתב שורה, ו-worktrees מאפשרים לבדוק hotfix בלי לעשות stash לכלום."
  },
  analogy: {
    en: "bisect is the \"guess my number\" game: \"is it broken at commit 500?\" — yes — \"at 250?\" — no — and in ten questions you've cornered one commit out of a thousand. Pickaxe is a metal detector you sweep across years of history for one specific string; blame is the label on each brick saying who laid it, and -C -C peels off the label of whoever merely moved the brick.",
    he: "bisect זה המשחק \"נחש את המספר\": \"זה שבור ב-commit 500?\" — כן — \"ב-250?\" — לא — ובעשר שאלות תפסת commit אחד מתוך אלף. pickaxe הוא גלאי מתכות שאתה מעביר על שנים של היסטוריה בחיפוש אחרי מחרוזת אחת; ‏blame הוא התווית על כל לבנה שאומרת מי הניח אותה, ו-‎-C -C מקלף את התווית של מי שרק הזיז את הלבנה."
  },
  sections: [
    {
      h: { en: "git bisect: binary search for the bad commit", he: "git bisect: חיפוש בינארי אחרי ה-commit השבור" },
      body: {
        en: `<p>You know v2.3.0 was fine and <code>main</code> is broken, with 840 commits between. Bisect checks out the midpoint, you mark it, repeat: ⌈log2(840)⌉ = <strong>10 steps</strong>.</p>
<pre>$ git bisect start
$ git bisect bad                 # current HEAD is broken
$ git bisect good v2.3.0
Bisecting: 419 revisions left to test after this (roughly 9 steps)
[7c1d9e2...] Switch HTTP client pool to keep-alive
$ make test-checkout   # ... fails
$ git bisect bad
Bisecting: 209 revisions left to test after this (roughly 8 steps)
...
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3 is the first bad commit
commit 3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
Author: Dana Levi &lt;dana@example.com&gt;
    Cache currency rates for 24h instead of 1h
$ git bisect reset               # back to where you started</pre>
<p><strong>Automate it</strong> with <code>git bisect run</code>. The script's exit code is the verdict: <code>0</code> = good, <code>1-127</code> (except 125) = bad, <code>125</code> = skip (can't test this commit, e.g. it doesn't build), <code>128+</code> = abort.</p>
<pre>$ cat /tmp/check.sh
#!/bin/sh
make build &gt;/dev/null 2&gt;&amp;1 || exit 125          # unbuildable commit: skip it
pytest -q tests/test_pricing.py::test_eur_rounding
$ git bisect start main v2.3.0
$ git bisect run /tmp/check.sh
running '/tmp/check.sh'
...
3f2a1bc... is the first bad commit
bisect found first bad commit</pre>
<p>Tips: keep the test script <em>outside</em> the repo (old commits won't have it); <code>git bisect skip</code> for a broken-build commit; <code>git bisect terms --term-old=fast --term-new=slow</code> when hunting a perf change rather than a bug; <code>git bisect log &gt; bisect.txt</code> and <code>git bisect replay</code> to share or redo a session; <code>--first-parent</code> to bisect only merge commits on main (one PR at a time).</p>
<blockquote>💡 Real world: bisect only works well when every commit builds — another reason squash-merge or "each commit passes CI" policies pay off.</blockquote>`,
        he: `<p>אתה יודע ש-v2.3.0 היה תקין ו-<code>main</code> שבור, עם 840 commits ביניהם. bisect עושה checkout לאמצע, אתה מסמן, וחוזר חלילה: ‏⌈log2(840)⌉ = ‏<strong>10 צעדים</strong>.</p>
<pre>$ git bisect start
$ git bisect bad                 # current HEAD is broken
$ git bisect good v2.3.0
Bisecting: 419 revisions left to test after this (roughly 9 steps)
[7c1d9e2...] Switch HTTP client pool to keep-alive
$ make test-checkout   # ... fails
$ git bisect bad
Bisecting: 209 revisions left to test after this (roughly 8 steps)
...
3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3 is the first bad commit
commit 3f2a1bc9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
Author: Dana Levi &lt;dana@example.com&gt;
    Cache currency rates for 24h instead of 1h
$ git bisect reset               # back to where you started</pre>
<p><strong>תעשה לזה אוטומציה</strong> עם <code>git bisect run</code>. ה-exit code של הסקריפט הוא פסק הדין: <code>0</code> = תקין, ‏<code>1-127</code> (חוץ מ-125) = שבור, ‏<code>125</code> = לדלג (אי אפשר לבדוק את ה-commit הזה, למשל הוא לא עובר build), ‏<code>128+</code> = לעצור.</p>
<pre>$ cat /tmp/check.sh
#!/bin/sh
make build &gt;/dev/null 2&gt;&amp;1 || exit 125          # unbuildable commit: skip it
pytest -q tests/test_pricing.py::test_eur_rounding
$ git bisect start main v2.3.0
$ git bisect run /tmp/check.sh
running '/tmp/check.sh'
...
3f2a1bc... is the first bad commit
bisect found first bad commit</pre>
<p>טיפים: תשמור את סקריפט הבדיקה <em>מחוץ</em> ל-repo (ב-commits ישנים הוא לא קיים); ‏<code>git bisect skip</code> ל-commit עם build שבור; ‏<code>git bisect terms --term-old=fast --term-new=slow</code> כשמחפשים שינוי בביצועים ולא באג; ‏<code>git bisect log &gt; bisect.txt</code> ו-<code>git bisect replay</code> כדי לשתף או לשחזר סשן; ‏<code>--first-parent</code> כדי לעשות bisect רק על merge commits ב-main (‏PR אחד בכל פעם).</p>
<blockquote>💡 מהעולם האמיתי: bisect עובד טוב רק כשכל commit עובר build — עוד סיבה שמדיניות של squash-merge או "כל commit עובר CI" משתלמת.</blockquote>`
      }
    },
    {
      h: { en: "blame that tells the truth: -w -C -C and ignore-revs", he: "blame שאומר את האמת: ‎-w -C -C ו-ignore-revs" },
      body: {
        en: `<p>Plain <code>git blame</code> credits whoever last touched a line — often the person who ran the formatter or moved the function to another file. Fix that:</p>
<pre>$ git blame -w -C -C -L 120,135 src/pricing.py
^4b8e2d1 (Noa Katz   2023-02-11 120)     def round_eur(amount):
3f2a1bc9 (Dana Levi  2026-10-28 121)         return amount.quantize(Decimal("0.1"))
a1b2c3d4 (Omer Ben   2024-06-03 122)     # banker's rounding per finance spec
#  -w        ignore whitespace-only changes
#  -C        detect lines moved/copied from other files changed in the same commit
#  -C -C     ... also from any file in the commit that created this file
#  -C -C -C  ... from any file in any commit (slow)
#  -M        detect lines moved within the same file
#  -L 120,135 or -L :round_eur   restrict to a range or function</pre>
<p>For mass reformat commits (black, prettier), list their hashes in <code>.git-blame-ignore-revs</code> and run <code>git config blame.ignoreRevsFile .git-blame-ignore-revs</code>; GitHub's blame view honors that file automatically.</p>
<blockquote>⚠️ Production tip: blame answers "which commit", not "whose fault". Click through to the commit and PR to read <em>why</em> — the reasoning in the PR is the real value. Blameless culture applies to git blame too.</blockquote>`,
        he: `<p><code>git blame</code> רגיל נותן קרדיט למי שנגע אחרון בשורה — הרבה פעמים מי שהריץ את ה-formatter או העביר את הפונקציה לקובץ אחר. ככה מתקנים את זה:</p>
<pre>$ git blame -w -C -C -L 120,135 src/pricing.py
^4b8e2d1 (Noa Katz   2023-02-11 120)     def round_eur(amount):
3f2a1bc9 (Dana Levi  2026-10-28 121)         return amount.quantize(Decimal("0.1"))
a1b2c3d4 (Omer Ben   2024-06-03 122)     # banker's rounding per finance spec
#  -w        ignore whitespace-only changes
#  -C        detect lines moved/copied from other files changed in the same commit
#  -C -C     ... also from any file in the commit that created this file
#  -C -C -C  ... from any file in any commit (slow)
#  -M        detect lines moved within the same file
#  -L 120,135 or -L :round_eur   restrict to a range or function</pre>
<p>ל-commits של reformat המוני (‏black, ‏prettier), תרשום את ה-hashes שלהם ב-<code>.git-blame-ignore-revs</code> ותריץ <code>git config blame.ignoreRevsFile .git-blame-ignore-revs</code>; תצוגת ה-blame של GitHub מכבדת את הקובץ הזה אוטומטית.</p>
<blockquote>⚠️ טיפ לפרודקשן: blame עונה על "איזה commit", לא "באשמת מי". תיכנס ל-commit ול-PR כדי לקרוא <em>למה</em> — ההיגיון ב-PR הוא הערך האמיתי. תרבות blameless חלה גם על git blame.</blockquote>`
      }
    },
    {
      h: { en: "Searching history: pickaxe, log -L, git grep, shortlog", he: "לחפש בהיסטוריה: pickaxe, ‏log -L, ‏git grep, ‏shortlog" },
      body: {
        en: `<pre># When did this string appear or disappear? (-S: number of occurrences changed)
$ git log -S "FEATURE_NEW_CHECKOUT" --oneline
9d8c7b6 Remove new-checkout flag (100% rollout)
1a2b3c4 Add new-checkout feature flag

# Any added/removed line matching a regex (-G), with the patch
$ git log -G "timeout\\s*=\\s*[0-9]+" -p -- src/client.py

# The full history of one function, even as it moved around in the file
$ git log -L :charge_card:src/payments.py
$ git log -L 40,60:deploy/values.yaml

# Search the code at any revision (fast: uses the index, skips untracked/ignored)
$ git grep -n "DB_HOST"                        # working tree
$ git grep -n "DB_HOST" v2.3.0 -- '*.yaml'      # as of a tag

# Who works on this? Where is the churn?
$ git shortlog -sne --since="6 months ago" -- services/billing | head -3
   142  Dana Levi &lt;dana@example.com&gt;
    87  Omer Ben &lt;omer@example.com&gt;
    12  Noa Katz &lt;noa@example.com&gt;
$ git log --since="3 months ago" --format= --name-only | sort | uniq -c | sort -rn | head -5
     61 services/billing/invoice.py      # hotspot: high churn = likely bug nest</pre>
<p>Difference that matters: <code>-S</code> fires only when the <em>count</em> of the string changes (so a line merely moved isn't reported); <code>-G</code> fires whenever a changed line matches. Add <code>--all</code> to search every branch, <code>--diff-filter=D --name-only</code> to find when a file was deleted.</p>`,
        he: `<pre># When did this string appear or disappear? (-S: number of occurrences changed)
$ git log -S "FEATURE_NEW_CHECKOUT" --oneline
9d8c7b6 Remove new-checkout flag (100% rollout)
1a2b3c4 Add new-checkout feature flag

# Any added/removed line matching a regex (-G), with the patch
$ git log -G "timeout\\s*=\\s*[0-9]+" -p -- src/client.py

# The full history of one function, even as it moved around in the file
$ git log -L :charge_card:src/payments.py
$ git log -L 40,60:deploy/values.yaml

# Search the code at any revision (fast: uses the index, skips untracked/ignored)
$ git grep -n "DB_HOST"                        # working tree
$ git grep -n "DB_HOST" v2.3.0 -- '*.yaml'      # as of a tag

# Who works on this? Where is the churn?
$ git shortlog -sne --since="6 months ago" -- services/billing | head -3
   142  Dana Levi &lt;dana@example.com&gt;
    87  Omer Ben &lt;omer@example.com&gt;
    12  Noa Katz &lt;noa@example.com&gt;
$ git log --since="3 months ago" --format= --name-only | sort | uniq -c | sort -rn | head -5
     61 services/billing/invoice.py      # hotspot: high churn = likely bug nest</pre>
<p>ההבדל שחשוב: <code>-S</code> נדלק רק כשה-<em>כמות</em> של המחרוזת משתנה (אז שורה שרק זזה לא מדווחת); ‏<code>-G</code> נדלק כל פעם ששורה שהשתנתה מתאימה. תוסיף <code>--all</code> כדי לחפש בכל ה-branches, ו-<code>--diff-filter=D --name-only</code> כדי למצוא מתי קובץ נמחק.</p>`
      }
    },
    {
      h: { en: "Worktrees: a hotfix without stashing", he: "Worktrees: ‏hotfix בלי stash" },
      body: {
        en: `<p>Mid-feature, production breaks. Instead of stash → switch → rebuild → switch back, add a second working directory that shares the same <code>.git</code> object store:</p>
<pre>$ git fetch origin
$ git worktree add -b hotfix/pay-1450 ../payments-hotfix origin/main
Preparing worktree (new branch 'hotfix/pay-1450')
HEAD is now at 8e7d6c5 Merge pull request #2231 from acme/feat/retry
$ cd ../payments-hotfix &amp;&amp; vim src/client.py &amp;&amp; git commit -am "Fix null currency" &amp;&amp; git push
$ git worktree list
/home/dana/payments          9f8e7d6 [feat/retry]
/home/dana/payments-hotfix   b4c5d6e [hotfix/pay-1450]
$ git worktree remove ../payments-hotfix     # when done (git worktree prune cleans stale ones)</pre>
<ul>
<li>No second clone, no re-download: objects are shared, only the checkout is duplicated.</li>
<li>A branch can be checked out in only one worktree at a time (Git refuses, to avoid two trees fighting over one ref).</li>
<li>Great for: running a long test suite on one branch while coding on another, reviewing a PR locally, bisecting in a separate tree, and running several AI coding agents on parallel branches.</li>
</ul>`,
        he: `<p>באמצע פיצ'ר, פרודקשן נשבר. במקום stash ← החלפת branch ← build מחדש ← לחזור, תוסיף תיקיית עבודה שנייה שחולקת את אותו object store של <code>.git</code>:</p>
<pre>$ git fetch origin
$ git worktree add -b hotfix/pay-1450 ../payments-hotfix origin/main
Preparing worktree (new branch 'hotfix/pay-1450')
HEAD is now at 8e7d6c5 Merge pull request #2231 from acme/feat/retry
$ cd ../payments-hotfix &amp;&amp; vim src/client.py &amp;&amp; git commit -am "Fix null currency" &amp;&amp; git push
$ git worktree list
/home/dana/payments          9f8e7d6 [feat/retry]
/home/dana/payments-hotfix   b4c5d6e [hotfix/pay-1450]
$ git worktree remove ../payments-hotfix     # when done (git worktree prune cleans stale ones)</pre>
<ul>
<li>בלי clone שני, בלי להוריד מחדש: ה-objects משותפים, רק ה-checkout משוכפל.</li>
<li>branch יכול להיות ב-checkout רק ב-worktree אחד בכל רגע (‏Git מסרב, כדי ששני trees לא יריבו על אותו ref).</li>
<li>מעולה בשביל: להריץ test suite ארוך על branch אחד בזמן שאתה כותב קוד באחר, לעשות review ל-PR מקומית, להריץ bisect בעץ נפרד, ולהריץ כמה AI coding agents על branches מקבילים.</li>
</ul>`
      }
    },
    {
      h: { en: "Config & aliases worth having everywhere", he: "Config ו-aliases ששווה שיהיו בכל מקום" },
      body: {
        en: `<pre>[rerere]
    enabled = true               # remember conflict resolutions
[fetch]
    prune = true                 # delete origin/x when x is deleted on the server
    pruneTags = true
[diff]
    algorithm = histogram        # clearer diffs than default myers (better on moved blocks)
    colorMoved = default         # moved lines shown in a different color
[merge]
    conflictStyle = zdiff3       # show the merge base inside conflicts
[rebase]
    autoSquash = true
    autoStash = true
    updateRefs = true
[push]
    autoSetupRemote = true       # first push of a new branch sets upstream
[branch]
    sort = -committerdate        # git branch: most recent first
[help]
    autocorrect = prompt
[alias]
    lg    = log --graph --oneline --decorate --all
    st    = status -sb
    pushf = push --force-with-lease --force-if-includes
    undo  = reset --soft HEAD~1
    who   = shortlog -sne --no-merges
    recent = for-each-ref --sort=-committerdate --count=15 --format='%(refname:short)  %(committerdate:relative)' refs/heads/</pre>
<p>Put this in <code>~/.gitconfig</code> (or run each line as <code>git config --global key value</code>). Large repos also benefit from <code>git maintenance start</code>, which schedules background prefetch, commit-graph and incremental repack.</p>`,
        he: `<pre>[rerere]
    enabled = true               # remember conflict resolutions
[fetch]
    prune = true                 # delete origin/x when x is deleted on the server
    pruneTags = true
[diff]
    algorithm = histogram        # clearer diffs than default myers (better on moved blocks)
    colorMoved = default         # moved lines shown in a different color
[merge]
    conflictStyle = zdiff3       # show the merge base inside conflicts
[rebase]
    autoSquash = true
    autoStash = true
    updateRefs = true
[push]
    autoSetupRemote = true       # first push of a new branch sets upstream
[branch]
    sort = -committerdate        # git branch: most recent first
[help]
    autocorrect = prompt
[alias]
    lg    = log --graph --oneline --decorate --all
    st    = status -sb
    pushf = push --force-with-lease --force-if-includes
    undo  = reset --soft HEAD~1
    who   = shortlog -sne --no-merges
    recent = for-each-ref --sort=-committerdate --count=15 --format='%(refname:short)  %(committerdate:relative)' refs/heads/</pre>
<p>תשים את זה ב-<code>~/.gitconfig</code> (או תריץ כל שורה כ-<code>git config --global key value</code>). ב-repos גדולים כדאי גם <code>git maintenance start</code>, שמתזמן ברקע prefetch, ‏commit-graph ו-repack הדרגתי.</p>`
      }
    }
  ],
  diagram: `git bisect over 1,000 commits (good = v2.3.0, bad = main)

 good ├──────────────────────────────┼──────────────────────────────┤ bad
                                   500? bad
 good ├──────────────┼──────────────┤
                    250? good
                     ├──────┼───────┤
                          375? bad   ...  ~10 steps -> "3f2a1bc is the first bad commit"`,
  handsOn: [
    { cmd: "git bisect start HEAD HEAD~50 && git bisect run sh -c 'make test'", what: { en: "Let Git find the first failing commit among the last 50 automatically (then git bisect reset).", he: "לתת ל-Git למצוא אוטומטית את ה-commit הראשון שנכשל מבין 50 האחרונים (ואז git bisect reset)." } },
    { cmd: "git log -S \"some_function\" --oneline --all", what: { en: "Find the commits that added or removed a symbol.", he: "למצוא את ה-commits שהוסיפו או הסירו symbol." } },
    { cmd: "git blame -w -C -C -L :main path/to/file.py", what: { en: "Blame one function, ignoring whitespace and following code moved from other files.", he: "blame לפונקציה אחת, בלי להתחשב ב-whitespace ותוך מעקב אחרי קוד שהועבר מקבצים אחרים." } },
    { cmd: "git worktree add ../hotfix -b hotfix/x origin/main && git worktree list", what: { en: "Open a second checkout for a hotfix without touching your current work.", he: "לפתוח checkout שני ל-hotfix בלי לגעת בעבודה הנוכחית." } }
  ],
  mnemonic: {
    en: "Bisect finds WHEN, pickaxe finds WHAT, blame finds WHO (then read WHY in the PR), worktree gives you a second desk.",
    he: "Bisect מוצא מתי, pickaxe מוצא מה, blame מוצא מי (ואת הלמה קוראים ב-PR), ו-worktree נותן לך שולחן שני."
  },
  pitfalls: [
    { en: "Writing the bisect test script inside the repo — older commits don't have it, so every step \"fails\". Keep it in /tmp.", he: "לכתוב את סקריפט ה-bisect בתוך ה-repo — ל-commits ישנים אין אותו, אז כל צעד \"נכשל\". תשמור אותו ב-/tmp." },
    { en: "Not exiting 125 for unbuildable commits, so bisect blames a commit that simply didn't compile.", he: "לא לצאת עם 125 ב-commits שלא עוברים build, ואז bisect מאשים commit שפשוט לא התקמפל." },
    { en: "Trusting plain blame after a reformat or file move — it points at the formatter. Use -w -C -C and .git-blame-ignore-revs.", he: "לסמוך על blame רגיל אחרי reformat או העברת קובץ — הוא מצביע על ה-formatter. תשתמש ב-‎-w -C -C וב-.git-blame-ignore-revs." },
    { en: "Forgetting git bisect reset and continuing to work in detached HEAD.", he: "לשכוח git bisect reset ולהמשיך לעבוד ב-detached HEAD." }
  ],
  interview: [
    { q: { en: "A regression appeared somewhere in the last 2,000 commits. How do you find it efficiently?", he: "רגרסיה הופיעה איפשהו ב-2,000 ה-commits האחרונים. איך מוצאים אותה ביעילות?" },
      a: { en: "Write a script that reproduces it and exits 0/1 (125 to skip unbuildable commits), keep it outside the repo, then git bisect start <bad> <good> and git bisect run. About 11 steps (log2 2000). With merge-heavy history, --first-parent narrows it to the offending PR first.", he: "לכתוב סקריפט שמשחזר את הבעיה ויוצא עם 0/1 (‏125 כדי לדלג על commits שלא עוברים build), לשמור אותו מחוץ ל-repo, ואז git bisect start <bad> <good> ו-git bisect run. בערך 11 צעדים (‏log2 של 2000). בהיסטוריה עם הרבה merges, ‏--first-parent מצמצם קודם ל-PR האשם." } },
    { q: { en: "What's the difference between git log -S and -G?", he: "מה ההבדל בין git log -S ל-‎-G?" },
      a: { en: "-S \"str\" lists commits where the number of occurrences of str changed (added or removed). -G regex lists commits whose diff has an added/removed line matching the regex, including lines that merely changed around it.", he: "-S \"str\" מציג commits שבהם מספר המופעים של str השתנה (נוסף או הוסר). ‎-G regex מציג commits שב-diff שלהם יש שורה שנוספה/הוסרה ומתאימה ל-regex, כולל שורות שרק השתנו סביבו." } }
  ],
  quiz: [
    { q: { en: "About how many test runs does git bisect need for 4,000 commits?", he: "בערך כמה הרצות בדיקה git bisect צריך ל-4,000 commits?" },
      options: [
        { en: "~12", he: "~12" },
        { en: "~64", he: "~64" },
        { en: "~400", he: "~400" },
        { en: "~2,000", he: "~2,000" }
      ], answer: 0,
      explain: { en: "Binary search: log2(4000) ≈ 12.", he: "חיפוש בינארי: log2(4000) ≈ ‏12." } },
    { q: { en: "In a git bisect run script, which exit code means \"can't test this commit, skip it\"?", he: "בסקריפט של git bisect run, איזה exit code אומר \"אי אפשר לבדוק את ה-commit הזה, לדלג\"?" },
      options: [
        { en: "1", he: "1" },
        { en: "125", he: "125" },
        { en: "127", he: "127" },
        { en: "255", he: "255" }
      ], answer: 1,
      explain: { en: "0 = good, 1-127 except 125 = bad, 125 = skip, 128+ aborts the bisect.", he: "0 = תקין, 1-127 חוץ מ-125 = שבור, 125 = לדלג, 128 ומעלה עוצר את ה-bisect." } },
    { q: { en: "A function was moved from utils.py to pricing.py in a refactor commit. Plain blame on pricing.py credits the refactorer. What helps?", he: "פונקציה הועברה מ-utils.py ל-pricing.py ב-commit של refactor. ‏blame רגיל על pricing.py נותן קרדיט למי שעשה את ה-refactor. מה עוזר?" },
      options: [
        { en: "git blame -w", he: "git blame -w" },
        { en: "git blame -C -C", he: "git blame -C -C" },
        { en: "git log -S", he: "git log -S" },
        { en: "git blame --reverse", he: "git blame --reverse" }
      ], answer: 1,
      explain: { en: "-C detects lines moved/copied from other files; doubling it widens the search to all files in the commit that created the file. -w only ignores whitespace.", he: "‎-C מזהה שורות שהועברו או הועתקו מקבצים אחרים; פעמיים מרחיב את החיפוש לכל הקבצים ב-commit שיצר את הקובץ. ‎-w רק מתעלם מ-whitespace." } },
    { q: { en: "Why use git worktree add instead of a second git clone for a hotfix?", he: "למה להשתמש ב-git worktree add במקום git clone שני בשביל hotfix?" },
      options: [
        { en: "Worktrees bypass branch protection", he: "worktrees עוקפים branch protection" },
        { en: "It shares the object store and refs: no re-download, branches and commits visible from both directories", he: "הוא חולק את ה-object store וה-refs: בלי להוריד מחדש, ו-branches ו-commits נראים משתי התיקיות" },
        { en: "It lets the same branch be checked out twice", he: "הוא מאפשר checkout לאותו branch פעמיים" },
        { en: "It automatically stashes your changes", he: "הוא עושה stash לשינויים שלך אוטומטית" }
      ], answer: 1,
      explain: { en: "One .git, many checkouts. Git actually forbids checking out the same branch in two worktrees.", he: "‏.git אחד, הרבה checkouts. ‏Git דווקא אוסר checkout לאותו branch בשני worktrees." } }
  ],
  playground: "terminal",
  related: ["git-internals", "git-undo-rescue", "git-large-repos", "pr-code-review-quality"]
});

/* ============================== GLOSSARY ============================== */
[
  ["Git object (blob / tree / commit)", "Git's immutable, content-addressed storage units: blob = file content, tree = directory listing, commit = root tree + parents + metadata. Named by the hash of their content.", "יחידות האחסון של Git, שלא משתנות וממוענות לפי תוכן: blob = תוכן קובץ, tree = רשימת תיקייה, commit = ‏tree שורש + הורים + מטא-דאטה. השם שלהן הוא ה-hash של התוכן.", "git-internals"],
  ["Packfile", "A single .pack file (+ .idx) where Git stores many objects zlib-compressed and delta-encoded against similar objects; built by git gc and used for every fetch/push transfer.", "קובץ ‎.pack אחד (+ ‎.idx) שבו Git שומר הרבה objects דחוסים ב-zlib ומקודדים כ-delta מול objects דומים; נבנה ע\"י git gc ומשמש בכל העברה של fetch/push.", "git-internals"],
  ["Detached HEAD", "State where HEAD holds a raw commit id instead of a branch name (after checking out a tag or commit). New commits advance no branch and are reachable only via the reflog unless you create one.", "מצב שבו HEAD מחזיק commit id גולמי במקום שם של branch (אחרי checkout ל-tag או commit). commits חדשים לא מקדמים אף branch ונגישים רק דרך ה-reflog, אלא אם תיצור branch.", "git-internals"],
  ["Fast-forward merge", "A merge where the target branch is an ancestor of the source, so Git just moves the pointer forward — no merge commit. --ff-only refuses anything else.", "merge שבו ה-branch היעד הוא אב קדמון של המקור, אז Git פשוט מזיז את המצביע קדימה — בלי merge commit. ‎--ff-only מסרב לכל דבר אחר.", "git-workflow"],
  ["Interactive rebase", "git rebase -i: replay a range of commits with a to-do list to pick, reword, edit, squash, fixup, reorder or drop them. Rewrites hashes — for unshared work.", "git rebase -i: לשחזר טווח של commits עם רשימת משימות כדי לבחור, לשנות הודעה, לערוך, לאחד, לעשות fixup, לשנות סדר או למחוק. משכתב hashes — לעבודה שלא שותפה.", "git-workflow"],
  ["--force-with-lease", "A safe force-push: succeeds only if the remote branch still points where your remote-tracking ref says (compare-and-swap), so you can't erase commits pushed by others since your last fetch.", "force-push בטוח: מצליח רק אם ה-branch בשרת עדיין מצביע לאן שה-remote-tracking ref שלך אומר (‏compare-and-swap), כך שאי אפשר למחוק commits שאחרים עשו להם push מאז ה-fetch האחרון שלך.", "git-workflow"],
  ["Reflog", "A local, per-ref log of every position HEAD and each branch has had (commit, reset, rebase, checkout). Kept ~90 days (30 for unreachable); the main tool to recover \"lost\" commits. Never pushed.", "לוג מקומי, לכל ref, של כל מיקום ש-HEAD וכל branch היו בו (‏commit, ‏reset, ‏rebase, ‏checkout). נשמר בערך 90 יום (‏30 ללא-נגישים); הכלי המרכזי לשחזר commits \"אבודים\". אף פעם לא עובר ב-push.", "git-undo-rescue"],
  ["git revert", "Creates a new commit that applies the inverse of an earlier commit, undoing it without rewriting history — the safe undo on shared branches. Merges need -m 1.", "יוצר commit חדש שמחיל את ההפך של commit קודם, ומבטל אותו בלי לשכתב היסטוריה — ה-undo הבטוח ב-branches משותפים. ל-merges צריך ‎-m 1.", "git-undo-rescue"],
  ["git filter-repo", "The Git-project-recommended tool (replacing filter-branch) for rewriting whole history: drop paths, replace leaked strings, split repos. Requires force-push and re-clones afterwards.", "הכלי שפרויקט Git ממליץ עליו (במקום filter-branch) לשכתוב כל ההיסטוריה: להסיר paths, להחליף מחרוזות שדלפו, לפצל repos. דורש force-push ו-clone מחדש אחר כך.", "git-undo-rescue"],
  ["git bisect", "Binary search through history for the commit that introduced a change: mark good/bad (or automate with git bisect run and exit codes 0/1/125) and find it in log2(N) steps.", "חיפוש בינארי בהיסטוריה אחרי ה-commit שהכניס שינוי: מסמנים good/bad (או אוטומציה עם git bisect run ו-exit codes ‏0/1/125) ומוצאים אותו ב-log2(N) צעדים.", "git-debugging"],
  ["Pickaxe (git log -S / -G)", "History search for commits whose diff adds or removes a string (-S, occurrence count changed) or a line matching a regex (-G).", "חיפוש בהיסטוריה אחרי commits שה-diff שלהם מוסיף או מסיר מחרוזת (‎-S, מספר המופעים השתנה) או שורה שמתאימה ל-regex (‎-G).", "git-debugging"],
  ["git worktree", "Extra working directories attached to one repository, sharing its object store and refs — check out another branch (e.g. a hotfix) without stashing or cloning again.", "תיקיות עבודה נוספות שמחוברות ל-repository אחד וחולקות את ה-object store וה-refs שלו — checkout ל-branch אחר (למשל hotfix) בלי stash ובלי clone נוסף.", "git-debugging"]
].forEach(([term, en, he, lesson]) => INFRA.glossary.push({ term, track: "git", def: { en, he }, lesson }));

/* ============================== SCENARIO ============================== */
INFRA.scenarios.push({
  id: "bad-force-push",
  icon: "💥",
  title: { en: "Someone force-pushed over main", he: "מישהו עשה force-push על main" },
  start: "s1",
  steps: {
    s1: {
      text: {
        en: "10:40, Tuesday. CI on main is red and Slack is on fire: \"where did my merged PR go?\" Three developers report their merged work vanished. You fetch and look.",
        he: "10:40, יום שלישי. ה-CI על main אדום וה-Slack בוער: \"לאן נעלם ה-PR שמיזגתי?\" שלושה מפתחים מדווחים שעבודה שכבר מוזגה נעלמה. אתה עושה fetch ומסתכל."
      },
      data: `$ git fetch origin
 + 8e7d6c5...41c0a9f main       -> origin/main  (forced update)
$ git log --oneline -4 origin/main
41c0a9f WIP local experiments
4b8e2d1 Bump deps
2d9e1f0 Merge pull request #2198 from acme/feat/invoices
7a6b5c4 Fix flaky invoice test`,
      choices: [
        { label: { en: "Freeze main: tell everyone to stop pushing and pulling main, and lock the branch", he: "להקפיא את main: להגיד לכולם להפסיק לעשות push ו-pull ל-main, ולנעול את ה-branch" }, next: "s2", score: 15,
          feedback: { en: "Right. Every new pull spreads the bad history to more clones, and every new push on top makes the merge-back harder. Stop the bleeding first.", he: "נכון. כל pull חדש מפיץ את ההיסטוריה הגרועה ליותר clones, וכל push חדש מעליה מסבך את השחזור. קודם עוצרים את הדימום." } },
        { label: { en: "Immediately git push --force your own local main back over it", he: "מיד לעשות git push --force ל-main המקומי שלך מעליו" }, next: "s2b", score: -10,
          feedback: { en: "Your local main may be days old — you could overwrite the server with an even older state and wipe more work. Never answer a force-push with a blind force-push.", he: "ה-main המקומי שלך יכול להיות בן כמה ימים — אתה עלול לדרוס את השרת עם מצב עוד יותר ישן ולמחוק עוד עבודה. אף פעם לא עונים ל-force-push עם force-push עיוור." } },
        { label: { en: "Ask the three developers to re-open and re-merge their PRs", he: "לבקש משלושת המפתחים לפתוח מחדש ולמזג את ה-PR-ים שלהם" }, next: "s2b", score: -5,
          feedback: { en: "Slow, error-prone, and you don't even know yet how many commits are missing — there may be dozens, not three.", he: "איטי, מועד לטעויות, ואתה עוד לא יודע כמה commits חסרים — יכולים להיות עשרות, לא שלושה." } }
      ]
    },
    s2b: {
      text: {
        en: "A senior engineer stops you: \"Before anyone pushes anything else — what exactly was main before the force-push?\" You freeze pushes to main and start investigating.",
        he: "מהנדס בכיר עוצר אותך: \"לפני שמישהו עושה push למשהו נוסף — מה בדיוק היה main לפני ה-force-push?\" אתה מקפיא push-ים ל-main ומתחיל לחקור."
      },
      choices: [
        { label: { en: "Find the pre-force-push SHA", he: "למצוא את ה-SHA שלפני ה-force-push" }, next: "s2", score: 5,
          feedback: { en: "Good recovery. Evidence first, action second.", he: "התאוששות טובה. קודם ראיות, אחר כך פעולה." } }
      ]
    },
    s2: {
      text: {
        en: "main is locked (ruleset: no pushes except admins). You need the commit main pointed to right before the force-push. Your own fetch output already printed something useful. Where do you get the authoritative value?",
        he: "main נעול (‏ruleset: בלי push-ים חוץ מ-admins). אתה צריך את ה-commit ש-main הצביע עליו רגע לפני ה-force-push. פלט ה-fetch שלך כבר הדפיס משהו שימושי. מאיפה מקבלים את הערך המוסמך?"
      },
      data: `$ gh api "repos/acme/payments/activity?ref=refs/heads/main&activity_type=force_push" \\
    --jq '.[0] | {before, after, actor: .actor.login, timestamp}'
{
  "before": "8e7d6c5f1a2b3c4d5e6f708192a3b4c5d6e7f809",
  "after": "41c0a9f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7",
  "actor": "omer-ben",
  "timestamp": "2026-11-10T10:31:07Z"
}`,
      choices: [
        { label: { en: "Use the hosting provider's push log (before = 8e7d6c5) and cross-check with the '8e7d6c5...41c0a9f' from your fetch", he: "להשתמש בלוג ה-push של ספק ה-hosting (‏before = ‏8e7d6c5) ולהצליב עם '8e7d6c5...41c0a9f' מה-fetch שלך" }, next: "s3", score: 15,
          feedback: { en: "Two independent sources agree on the old tip. The server log is authoritative and doesn't depend on anyone's laptop.", he: "שני מקורות בלתי תלויים מסכימים על הקצה הישן. הלוג של השרת מוסמך ולא תלוי בלפטופ של אף אחד." } },
        { label: { en: "Ask Omer to run git reflog on his machine and reset main from there", he: "לבקש מעומר להריץ git reflog אצלו ולעשות reset ל-main משם" }, next: "s3", score: 5,
          feedback: { en: "His reflog shows where HIS local main was, which is probably the stale state he force-pushed. Useful as a clue, not as the source of truth.", he: "ה-reflog שלו מראה איפה ה-main המקומי <em>שלו</em> היה, שזה כנראה בדיוק המצב הישן שהוא דחף ב-force. שימושי כרמז, לא כמקור אמת." } },
        { label: { en: "Restore main from last night's repository backup", he: "לשחזר את main מהגיבוי של ה-repository מאתמול בלילה" }, next: "s3", score: 0,
          feedback: { en: "Would work, but you'd lose everything merged this morning. Use the exact pre-push SHA instead.", he: "יעבוד, אבל תאבד את כל מה שמוזג הבוקר. עדיף להשתמש ב-SHA המדויק שלפני ה-push." } }
      ]
    },
    s3: {
      text: {
        en: "Does 8e7d6c5 still exist? It's no longer referenced by main on the server. You check your clone and a CI runner's cache, and look at what the bad push actually contains.",
        he: "האם 8e7d6c5 עדיין קיים? הוא כבר לא מוצבע ע\"י main בשרת. אתה בודק ב-clone שלך וב-cache של CI runner, ומסתכל מה ה-push הגרוע בעצם מכיל."
      },
      data: `$ git cat-file -t 8e7d6c5
commit
$ git log --oneline 41c0a9f..8e7d6c5 | wc -l
23                                  # 23 commits on old main missing from new main
$ git log --oneline 8e7d6c5..41c0a9f
41c0a9f WIP local experiments        # the only commit unique to the bad push
$ git reflog show origin/main -3
41c0a9f refs/remotes/origin/main@{0}: fetch: forced-update
8e7d6c5 refs/remotes/origin/main@{1}: fetch: fast-forward
9a1b2c3 refs/remotes/origin/main@{2}: fetch: fast-forward`,
      choices: [
        { label: { en: "Create a safety branch at 8e7d6c5 and push it before anything else", he: "ליצור branch ביטחון על 8e7d6c5 ולעשות לו push לפני כל דבר אחר" }, next: "s4", score: 15,
          feedback: { en: "Now the 23 commits are referenced on the server and can't be garbage-collected, no matter what happens next.", he: "עכשיו 23 ה-commits מוצבעים בשרת ולא יכולים לעבור garbage collection, לא משנה מה יקרה הלאה." } },
        { label: { en: "Skip the backup, go straight to fixing main", he: "לדלג על הגיבוי ולעבור ישר לתקן את main" }, next: "s4", score: 0,
          feedback: { en: "Probably fine, but a 41-byte safety ref costs nothing and protects you from a typo in the next step.", he: "כנראה יהיה בסדר, אבל ref ביטחון של 41 בייטים לא עולה כלום ומגן עליך מטעות הקלדה בצעד הבא." } }
      ]
    },
    s4: {
      text: {
        en: "Safety branch rescue/main-8e7d6c5 is pushed. One problem: 41c0a9f (Omer's WIP) is junk, but between 10:31 and the lock, a teammate (Dana) pushed a real hotfix directly on top of the bad main. How do you rebuild main?",
        he: "ה-branch rescue/main-8e7d6c5 עלה. בעיה אחת: 41c0a9f (ה-WIP של עומר) הוא זבל, אבל בין 10:31 לנעילה, חברת צוות (דנה) עשתה push ל-hotfix אמיתי ישירות מעל ה-main הגרוע. איך בונים את main מחדש?"
      },
      data: `$ git log --oneline -2 origin/main
c7e8f90 Fix null currency in refund path    # Dana's real hotfix
41c0a9f WIP local experiments               # junk from the bad force-push`,
      choices: [
        { label: { en: "Start from 8e7d6c5, cherry-pick Dana's c7e8f90 on top, run CI, then update main with an explicit lease", he: "להתחיל מ-8e7d6c5, לעשות cherry-pick ל-c7e8f90 של דנה מעליו, להריץ CI, ואז לעדכן את main עם lease מפורש" }, next: "s5", score: 20,
          feedback: { en: "You keep all 23 lost commits plus the hotfix, and drop the junk. The lease guarantees nobody slipped another push in.", he: "שומרים את כל 23 ה-commits שאבדו ועוד את ה-hotfix, וזורקים את הזבל. ה-lease מבטיח שאף אחד לא הכניס עוד push בינתיים." } },
        { label: { en: "Just force-push 8e7d6c5 to main", he: "פשוט לעשות force-push ל-8e7d6c5 על main" }, next: "lose", score: -10,
          feedback: { en: "You just did to Dana what Omer did to everyone: her hotfix is gone from main, and production keeps failing refunds.", he: "עשית לדנה בדיוק מה שעומר עשה לכולם: ה-hotfix שלה נעלם מ-main, והפרודקשן ממשיך להיכשל ב-refunds." } },
        { label: { en: "git merge 8e7d6c5 into current main without force", he: "git merge ל-8e7d6c5 לתוך ה-main הנוכחי בלי force" }, next: "s5", score: 5,
          feedback: { en: "No force needed and nothing lost — but the WIP junk commit stays in main's history and must be reverted separately. Acceptable if force-push is forbidden by policy.", he: "לא צריך force ושום דבר לא אבד — אבל ה-commit של ה-WIP נשאר בהיסטוריה של main וצריך revert נפרד. סביר אם force-push אסור לפי מדיניות." } }
      ]
    },
    s5: {
      text: {
        en: "main is restored and CI is green. Developers whose clones pulled the bad main need to resync, and you need to make sure this can't happen again.",
        he: "main שוחזר וה-CI ירוק. מפתחים שה-clones שלהם משכו את ה-main הגרוע צריכים להסתנכרן, ואתה צריך לוודא שזה לא יקרה שוב."
      },
      data: `$ git push --force-with-lease=main:c7e8f90 origin rebuilt-main:main
 + c7e8f90...e1f2a3b rebuilt-main -> main (forced update)

# message to the team:
git fetch origin && git switch main && git reset --hard origin/main
# (only if you have no local commits on main; otherwise rebase them onto origin/main)`,
      choices: [
        { label: { en: "Re-enable protection on main: block force pushes and deletions for everyone (incl. admins), require PRs; write a blameless postmortem", he: "להחזיר הגנה על main: לחסום force push ומחיקה לכולם (כולל admins), לדרוש PR-ים; לכתוב postmortem בלי האשמות" }, next: "win", score: 20,
          feedback: { en: "The root cause wasn't Omer — it was that main allowed a force push at all. Fix the system.", he: "שורש הבעיה הוא לא עומר — אלא ש-main בכלל אפשר force push. מתקנים את המערכת." } },
        { label: { en: "Revoke Omer's write access and move on", he: "לשלול לעומר הרשאות כתיבה ולהמשיך הלאה" }, next: "lose", score: -10,
          feedback: { en: "Blame without a guardrail: the next person with a stale main and a habit of git push -f does it again next month.", he: "האשמה בלי מעקה בטיחות: הבן אדם הבא עם main ישן והרגל של git push -f יעשה את זה שוב בחודש הבא." } }
      ]
    },
    win: {
      text: {
        en: "Recovered in 35 minutes with zero lost commits. You froze the branch, found the pre-push SHA from the server's push log, pinned it with a safety ref, rebuilt main keeping the late hotfix, pushed with an explicit lease, and made force-pushes to main impossible. The postmortem's action item list is one line long.",
        he: "שוחזר תוך 35 דקות, בלי אף commit שאבד. הקפאת את ה-branch, מצאת את ה-SHA שלפני ה-push מלוג ה-push של השרת, נעצת אותו עם ref ביטחון, בנית מחדש את main כולל ה-hotfix המאוחר, עשית push עם lease מפורש, והפכת force-push ל-main לבלתי אפשרי. רשימת ה-action items ב-postmortem היא שורה אחת."
      },
      end: "win"
    },
    lose: {
      text: {
        en: "Work was lost or the hole is still open. Remember: freeze first, get the old SHA from the server's push log (or a fresh clone's reflog), pin it with a branch, rebuild keeping anything pushed since, update with --force-with-lease, then block force pushes on main for everyone.",
        he: "עבודה אבדה או שהחור עדיין פתוח. תזכור: קודם מקפיאים, מוציאים את ה-SHA הישן מלוג ה-push של השרת (או מה-reflog של clone עדכני), נועצים אותו עם branch, בונים מחדש תוך שמירה על כל מה שעלה מאז, מעדכנים עם ‎--force-with-lease, ואז חוסמים force push על main לכולם."
      },
      end: "lose"
    }
  },
  lessons: ["git-undo-rescue", "git-internals", "git-workflow"]
});
